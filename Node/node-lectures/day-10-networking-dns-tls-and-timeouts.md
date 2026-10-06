# Day 10: Networking, DNS, TLS, and Timeouts

<nav aria-label="Lecture navigation">

[← Previous: Node HTTP Fundamentals](day-09-node-http-fundamentals.md) | [Roadmap](../node-roadmap.md) | [Next: Worker Threads and Child Processes](day-11-worker-threads-and-child-processes.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Diagnose and isolate network failures across individual lifecycle stages: DNS resolution, TCP handshake, TLS negotiation, request transmission, and response body streaming.
- Contrast `dns.lookup()` (synchronous OS `getaddrinfo()` executed on libuv thread pool) with `dns.resolve*()` (asynchronous c-ares network resolver) and prevent thread-pool starvation under high DNS query volumes.
- Configure Node.js HTTP/HTTPS agents (`http.Agent`, `undici.Agent`) with connection pooling, socket timeouts, and keep-alive socket recreation to prevent stale socket crashes (`ECONNRESET`).
- Implement end-to-end deadline budgets and cooperative cancellation using `AbortController` and `AbortSignal.timeout()` across multi-stage outbound request graphs.
- Protect internal infrastructure against Server-Side Request Forgery (SSRF) and DNS rebinding attacks using strict IP allowlists and pinned socket connections.
- Design resilient, production-grade retry policies incorporating exponential backoff with full jitter, classification of transient versus terminal status codes, and idempotency key safety.

---

## Prerequisites

Before diving into networking and timeouts, review:
- [Day 02: Event Loop and Scheduling](day-02-event-loop-and-scheduling.md) for libuv thread-pool mechanics and `UV_THREADPOOL_SIZE`.
- [Day 06: Buffers, Encodings, and Serialization](day-06-buffers-encodings-and-serialization.md) for raw socket byte streams and serialization.
- [Day 08: Streams and Backpressure](day-08-streams-and-backpressure.md) for stream pipeline abort handling and socket teardown.
- [Day 09: Node HTTP Fundamentals](day-09-node-http-fundamentals.md) for HTTP protocol framing and server socket timeouts.

---

## Quick Vocabulary Card

| Term | Programming Definition | Anti-Pattern / Misconception |
| :--- | :--- | :--- |
| **Stage Timeout** | A deadline bound to a specific network phase (e.g., DNS lookup, TCP connect, TLS handshake, or initial response headers). | Setting only a single global 30-second timeout that obscures whether the failure was DNS resolution, socket queueing, or server stall. |
| **`dns.lookup()`** | Node.js DNS resolver wrapping the operating system's `getaddrinfo(3)` C function, executed synchronously on the libuv thread pool. | Assuming all DNS lookups in Node.js are non-blocking async network calls; high DNS load blocks `fs` and `crypto` operations. |
| **`dns.resolve()`** | Node.js DNS resolver powered by `c-ares`, issuing asynchronous UDP/TCP queries directly to configured name servers without touching the thread pool. | Using `dns.resolve()` expecting it to parse `/etc/hosts` or system nsswitch files (it bypasses local OS hostname resolution files). |
| **Stale Socket Race** | A race condition where a client sends a request over an idle Keep-Alive connection just as the upstream server closes it, yielding an `ECONNRESET`. | Treating `ECONNRESET` on keep-alive reuse as an unrecoverable server crash rather than an expected transient race requiring automatic retry. |
| **Full Jitter Backoff** | A retry backoff algorithm where sleep duration is selected uniformly at random between 0 and `min(cap, base * 2^attempt)`. | Adding constant sleep intervals or deterministic exponential backoff, which synchronizes retried requests and creates thundering herds. |
| **SSRF** | Server-Side Request Forgery; an exploit where an attacker forces a backend server to issue requests to internal or restricted IP networks. | Relying on regex URL validation alone without resolving and checking the destination IP against private CIDR blocks prior to connection. |

---

## Core Concepts

### 1. Outbound Network Request Lifecycle

An outbound HTTP/HTTPS request is an orchestrated pipeline of discrete networking layers rather than a single atomic operation:

```text
[URL Parse] 
    │
    ▼
[Connection Pool Queue] ──(Pool Limit: maxSockets)
    │
    ▼
[DNS Resolution] ────────(dns.lookup via Libuv Thread Pool OR dns.resolve via c-ares)
    │
    ▼
[TCP 3-Way Handshake] ───(SYN -> SYN-ACK -> ACK over OS network stack)
    │
    ▼
[TLS 1.3 Handshake] ─────(ClientHello -> ServerHello -> Certificate & Key Exchange -> Finished)
    │
    ▼
[HTTP Request Headers] ──(Serialized to socket buffer)
    │
    ▼
[HTTP Request Body] ─────(Stream chunks written to socket until end)
    │
    ▼
[Response Headers] ──────(Server processes and returns HTTP status & headers)
    │
    ▼
[Response Body Stream] ──(Streaming bytes until EOF / socket release back to pool)
```

Each stage operates under independent physical, OS, and network constraints. A global timer tells you *that* a request timed out; stage-specific metrics tell you *where* it stalled:

| Stage | What It Measures | Typical Error / Root Cause |
| :--- | :--- | :--- |
| **Pool Wait** | Time spent queued in `http.Agent` waiting for an available socket. | `maxSockets` exhausted by concurrent slow requests or leaked connections. |
| **DNS Resolution** | Time to resolve domain name to an IPv4/IPv6 address. | `ENOTFOUND`, `EAI_AGAIN`, DNS resolver saturation, libuv thread-pool exhaustion. |
| **TCP Connect** | Duration of TCP 3-way handshake (`SYN` to `ACK`). | `ECONNREFUSED` (port closed), `ETIMEDOUT` (firewall dropping packets), packet loss. |
| **TLS Handshake** | Time to verify peer certificates and establish shared session keys. | `CERT_HAS_EXPIRED`, `DEPTH_ZERO_SELF_SIGNED_CERT`, TLS version mismatch. |
| **First Byte (TTFB)** | Time between writing the request and receiving the first response header byte. | Upstream application saturation, unindexed database queries, remote thread deadlock. |
| **Body Download** | Time to stream the complete response payload. | Network throttling, memory backpressure stalls, unconsumed response streams. |

---

### 2. DNS in Node.js: `dns.lookup()` vs `dns.resolve*()`

`dns.lookup()` and `dns.resolve*()` represent fundamentally different resolution mechanisms in Node.js with divergent thread-pool and operating-system implications.

- **`dns.lookup()`**: Uses the POSIX `getaddrinfo(3)` system call. Because `getaddrinfo` has no standard asynchronous C API, Node.js offloads each call to the **libuv thread pool** (default 4 threads). It honors `/etc/hosts`, Windows `hosts`, NIS, and local resolver caches. However, if your application issues hundreds of outbound requests concurrently using default Node `http.request`, all 4 libuv threads become blocked on DNS network I/O, completely stalling local file system calls (`fs`) and crypto tasks (`crypto.pbkdf2`).
- **`dns.resolve()`** (and `dns.promises.resolve()`): Uses the `c-ares` asynchronous DNS library. It communicates directly over non-blocking UDP/TCP sockets managed by the libuv event loop. It **never** consumes thread pool threads. However, it completely ignores local `/etc/hosts` files and system-level configuration switches.

| Feature | `dns.lookup()` | `dns.resolve*()` (`c-ares`) |
| :--- | :--- | :--- |
| **Execution Context** | Libuv Thread Pool (default 4 threads) | Event Loop (Non-blocking UDP/TCP socket) |
| **Thread Pool Block** | **Yes** — Starves `fs`, `crypto`, `zlib` | **No** — Zero thread-pool overhead |
| **System Hosts File** | Reads `/etc/hosts` / OS resolution | Ignores `/etc/hosts`; queries DNS server directly |
| **Default In** | Node.js `http.request()`, `fetch()`, `net.connect()` | Explicit invocation via `import dns from 'node:dns'` |
| **Custom Servers** | Uses OS system DNS settings only | Configurable via `dns.setServers()` |

---

### 3. Socket Lifecycle and Connection Pooling (`http.Agent`)

An HTTP connection pool manages reusable persistent TCP/TLS sockets to eliminate the latency of establishing new TCP connections and TLS handshakes for every request.

In Node.js, `http.Agent` and `https.Agent` implement connection pooling:
- `keepAlive: true`: Keeps sockets open after request completion for subsequent requests.
- `keepAliveMsecs`: Frequency of TCP Keep-Alive probes sent at the OS socket level.
- `maxSockets`: Maximum number of concurrent active sockets allowed per origin (`host:port`). Default is `Infinity` in Node.js core `http.Agent`, which can overwhelm downstream services or exhaust local file descriptors under traffic spikes.
- `maxFreeSockets`: Maximum number of idle sockets left open waiting for reuse per origin (default 256).
- `timeout`: Socket idle timeout. If a socket sits in the pool idle for longer than this duration without receiving traffic, the agent destroys it.

#### The Stale Socket Race Condition (`ECONNRESET`)
When using Keep-Alive, both client and upstream server maintain idle timeout timers. If the upstream server has a 5-second keep-alive timeout and closes the socket after 5.001 seconds, and the client sends a request at second 5.000, the packets cross on the wire. The server responds with a TCP `RST`, and Node.js emits an `ECONNRESET` error. Robust clients must recognize this race condition on reused sockets and automatically retry on a fresh connection.

---

### 4. Comprehensive Timeout Architecture & Cooperative Cancellation

A robust timeout architecture specifies deadlines at every tier of the call stack, preventing orphaned socket operations from leaking file descriptors or lingering indefinitely.

```text
                  Total Call Budget (e.g. 2500ms via AbortController)
┌─────────────────────────────────────────────────────────────────────────────┐
│ Connect Timeout: 500ms                                                      │
│ ┌───────────────┐                                                           │
│ │ DNS + TCP/TLS │                                                           │
│ └───────────────┘                                                           │
│                   Headers Timeout: 1200ms                                   │
│                   ┌───────────────────────────────┐                         │
│                   │ Request Written -> TTFB Headers│                         │
│                   └───────────────────────────────┘                         │
│                                                     Body Deadline: Remainder│
│                                                     ┌──────────────────────┐│
│                                                     │ Read stream to EOF   ││
│                                                     └──────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **Connect Timeout**: Time allowed to complete DNS resolution, TCP handshake, and TLS negotiation. If a firewall silently drops `SYN` packets, the OS default TCP connect timeout can hang for 75 to 120 seconds. An explicit connect timeout terminates dead connections quickly.
2. **Headers Timeout**: Time allowed for the upstream service to begin responding after the request has finished writing. Protects against upstream database locks and service deadlocks.
3. **Socket Idle Timeout**: Configured via `socket.setTimeout(ms)`. Fires if no bytes are sent or received over the socket for `ms` milliseconds. Crucial: `socket.setTimeout()` does **not** close the socket automatically; your callback must explicitly call `socket.destroy()`.
4. **End-to-End Request Deadline**: Managed via `AbortController` and `AbortSignal`. Propagates cancellation down through fetch, HTTP request streams, and local processing pipelines.

---

### 5. Server-Side Request Forgery (SSRF) and DNS Rebinding Defenses

SSRF occurs when an attacker crafts input that induces the backend server to make an HTTP request to an unintended destination, such as internal cloud metadata endpoints (`http://169.254.169.254/`) or loopback administrative interfaces (`http://127.0.0.1:8080/`).

#### The DNS Rebinding Flaw
A naive SSRF check resolves the IP of a hostname, verifies that it is not a private IP, and then passes the original URL to `fetch(url)`. This contains a critical **Time-of-Check to Time-of-Use (TOCTOU)** vulnerability:
1. **Check**: Attacker's DNS server returns a legitimate public IP (`198.51.100.1`) with a TTL of 0 seconds. Validation passes.
2. **Use**: `fetch(url)` issues a second DNS query. Attacker's DNS server now returns `127.0.0.1` or `169.254.169.254`. The request hits internal infrastructure.

**Production Defense**: Pin the resolved IP address directly to the underlying socket connection or use a custom lookup agent that validates the IP and establishes the TCP connection directly to the verified IP, passing the expected hostname in the TLS `servername` (SNI) and HTTP `Host` header.

---

### 6. Resilient Retry Strategy: Exponential Backoff, Jitter, and Idempotency

Retrying blindly multiplies network load and triggers catastrophic cascading failures known as **retry storms**.

```text
No Jitter:       All clients retry at t=1s, t=2s, t=4s (Periodic massive spikes!)
Full Jitter:     Sleep = Math.random() * Math.min(cap, base * 2 ** attempt)
                 (Uniformly distributes retries across the time horizon)
```

#### The Rules of Resilient Retries:
1. **Idempotency Verification**: Never retry non-idempotent HTTP methods (`POST`, `PATCH`) automatically unless an explicit `Idempotency-Key` header was accepted by upstream or the operation is inherently safe to repeat.
2. **Status Code Classification**:
   - **Retryable Transient**: Network timeouts (`ETIMEDOUT`, `ECONNRESET`), HTTP 429 (Too Many Requests with `Retry-After`), HTTP 502 (Bad Gateway), HTTP 503 (Service Unavailable), HTTP 504 (Gateway Timeout).
   - **Terminal Non-Retryable**: HTTP 400 (Bad Request), HTTP 401 (Unauthorized), HTTP 403 (Forbidden), HTTP 404 (Not Found), HTTP 422 (Unprocessable Entity).
3. **Full Jitter**: Using deterministic backoff causes all clients experiencing an outage to retry at the exact same millisecond interval, creating massive thundering herds that re-crash recovering servers. Full jitter decorrelates retry waves.
4. **Total Deadline Budget**: Retries must decrement the overall operation deadline. If the caller's total timeout is 3 seconds, individual attempts cannot sleep past that horizon.

---

## Code Snippets and Demonstrations

### 1. Libuv Thread Pool DNS Starvation vs `c-ares` Custom Resolver

Demonstrating how `dns.lookup` blocks thread pool operations and how to configure a custom agent using `dns.resolve4`.

```js
// Node.js code
// filename: dns-threadpool-demo.mjs
import dns from 'node:dns';
import dnsPromises from 'node:dns/promises';
import crypto from 'node:crypto';
import http from 'node:http';

// ❌ ANTI-PATTERN: dns.lookup consumes libuv threads.
// Under heavy concurrency, 4 slow DNS lookups block all crypto/fs operations!
export function demonstrateThreadpoolSaturation() {
  const start = Date.now();
  
  // Launch 4 concurrent threadpool crypto tasks
  for (let i = 0; i < 4; i++) {
    crypto.pbkdf2('password', 'salt', 100000, 64, 'sha512', () => {
      console.log(`[PBKDF2 ${i}] finished at ${Date.now() - start}ms`);
    });
  }

  // dns.lookup also runs on the libuv threadpool
  dns.lookup('google.com', (err, address) => {
    console.log(`[dns.lookup] finished at ${Date.now() - start}ms -> ${address}`);
  });
}

// ✅ PRODUCTION PATTERN: Custom Agent with c-ares asynchronous DNS resolution
// Uses non-blocking UDP sockets, completely bypassing the libuv thread pool
export function createAsyncDnsAgent() {
  const resolver = new dnsPromises.Resolver();
  // Optionally point to high-performance internal resolvers
  resolver.setServers(['1.1.1.1', '8.8.8.8']);

  return new http.Agent({
    keepAlive: true,
    maxSockets: 64,
    // Custom lookup function substituting dns.lookup with c-ares
    lookup: async (hostname, options, callback) => {
      try {
        const addresses = await resolver.resolve4(hostname);
        if (!addresses || addresses.length === 0) {
          return callback(new Error(`ENOTFOUND ${hostname}`));
        }
        // Return first address (family 4)
        callback(null, addresses[0], 4);
      } catch (err) {
        callback(err);
      }
    }
  });
}
```

---

### 2. Robust Node.js Outbound HTTP Client with Multi-Stage Deadlines

Implementing fine-grained connect, headers, idle, and total deadlines with proper socket teardown.

```js
// Node.js code
// filename: resilient-http-client.mjs
import http from 'node:http';
import https from 'node:https';

export class OutboundRequestError extends Error {
  constructor(message, stage, code) {
    super(message);
    this.name = 'OutboundRequestError';
    this.stage = stage; // 'dns' | 'connect' | 'headers' | 'body' | 'abort'
    this.code = code;
  }
}

/**
 * Executes an HTTP/S request with granular stage timeouts and cooperative cancellation.
 */
export function executeManagedRequest(targetUrl, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
    connectTimeoutMs = 1500,
    headersTimeoutMs = 3000,
    totalTimeoutMs = 5000,
    agent = undefined,
    parentSignal = null
  } = options;

  return new Promise((resolve, reject) => {
    const url = new URL(targetUrl);
    const transport = url.protocol === 'https:' ? https : http;

    // Track stages for granular observability
    let stage = 'init';
    let connectTimer = null;
    let headersTimer = null;
    let totalTimer = null;
    let completed = false;

    const cleanup = () => {
      completed = true;
      if (connectTimer) clearTimeout(connectTimer);
      if (headersTimer) clearTimeout(headersTimer);
      if (totalTimer) clearTimeout(totalTimer);
    };

    const fail = (err, failureStage) => {
      if (completed) return;
      cleanup();
      req.destroy();
      reject(new OutboundRequestError(err.message, failureStage, err.code));
    };

    // 1. Total request deadline
    totalTimer = setTimeout(() => {
      fail(new Error(`Total deadline exceeded (${totalTimeoutMs}ms)`), 'total_deadline');
    }, totalTimeoutMs);

    // 2. AbortSignal integration
    if (parentSignal) {
      if (parentSignal.aborted) {
        return fail(new Error('Operation aborted by caller signal'), 'abort');
      }
      parentSignal.addEventListener('abort', () => {
        fail(new Error('Operation aborted by caller signal'), 'abort');
      }, { once: true });
    }

    stage = 'connecting';
    const req = transport.request(url, {
      method,
      headers,
      agent
    });

    // 3. Connect timeout (DNS + TCP + TLS handshake)
    connectTimer = setTimeout(() => {
      fail(new Error(`TCP/TLS Connect timed out after ${connectTimeoutMs}ms`), 'connect');
    }, connectTimeoutMs);

    req.on('socket', (socket) => {
      socket.once('connect', () => {
        // Socket established; clear connect timer and arm headers timer
        if (connectTimer) clearTimeout(connectTimer);
        stage = 'waiting_headers';
        headersTimer = setTimeout(() => {
          fail(new Error(`Response headers timed out after ${headersTimeoutMs}ms`), 'headers');
        }, headersTimeoutMs);
      });
    });

    req.on('response', (res) => {
      // First byte and headers received; clear headers timer
      if (headersTimer) clearTimeout(headersTimer);
      stage = 'reading_body';

      const chunks = [];
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        cleanup();
        const responseBody = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: responseBody
        });
      });

      res.on('error', (err) => {
        fail(err, 'body');
      });
    });

    req.on('error', (err) => {
      fail(err, stage);
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}
```

---

### 3. Production Retry Runner: Exponential Backoff with Full Jitter

A generic, deadline-bounded retry wrapper classifying errors and avoiding thundering herd problems.

```js
// Node.js code
// filename: resilient-retry.mjs

export function isTransientNetworkError(err, statusCode) {
  // Network socket errors
  const transientCodes = new Set([
    'ETIMEDOUT', 'ECONNRESET', 'EADDRINUSE', 'ECONNREFUSED', 'EPIPE', 'EAI_AGAIN'
  ]);
  if (err && transientCodes.has(err.code)) {
    return true;
  }

  // HTTP status codes: 429 Too Many Requests, 502 Bad Gateway, 503 Unavailable, 504 Timeout
  if (statusCode && [429, 502, 503, 504].includes(statusCode)) {
    return true;
  }

  return false;
}

export function calculateFullJitterSleep(attempt, baseDelayMs = 100, maxDelayMs = 2000) {
  // Exponential backoff: base * 2 ^ attempt
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const cappedDelay = Math.min(maxDelayMs, exponentialDelay);
  // Full Jitter: Sleep uniformly random between 0 and cappedDelay
  return Math.floor(Math.random() * cappedDelay);
}

/**
 * Runs an asynchronous task with bounded retries and total deadline budget.
 */
export async function executeWithRetry(operationFn, options = {}) {
  const {
    maxAttempts = 3,
    baseDelayMs = 100,
    maxDelayMs = 2000,
    totalBudgetMs = 6000,
    parentSignal = null
  } = options;

  const deadline = Date.now() + totalBudgetMs;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Check remaining budget
    const remainingTime = deadline - Date.now();
    if (remainingTime <= 0) {
      throw new Error(`Retry budget exhausted before attempt ${attempt + 1}`);
    }

    try {
      if (parentSignal?.aborted) {
        throw new Error('Aborted by caller');
      }

      // Execute operation passing remaining time budget
      return await operationFn(remainingTime, attempt);
    } catch (err) {
      const isLastAttempt = attempt === maxAttempts - 1;
      const isTransient = isTransientNetworkError(err, err.statusCode);

      if (isLastAttempt || !isTransient) {
        throw err; // Terminal failure; do not retry
      }

      // Calculate sleep with full jitter
      const sleepMs = calculateFullJitterSleep(attempt, baseDelayMs, maxDelayMs);
      
      // Ensure we don't sleep beyond total deadline
      const sleepBudget = Math.min(sleepMs, Math.max(0, deadline - Date.now()));
      if (sleepBudget <= 0) {
        throw new Error('Total deadline expired during retry backoff', { cause: err });
      }

      console.warn(`[Retry] Attempt ${attempt + 1} failed (${err.message}). Sleeping ${sleepBudget}ms...`);
      await new Promise((resolve) => setTimeout(resolve, sleepBudget));
    }
  }
}
```

---

### 4. Bulletproof SSRF and DNS Rebinding Prevention Guard

Validating target IP addresses against RFC 1918, RFC 3927, and RFC 6890 private ranges before socket connection.

```js
// Node.js code
// filename: safe-ssrf-guard.mjs
import net from 'node:net';
import dnsPromises from 'node:dns/promises';

/**
 * Checks if an IPv4 or IPv6 string is within a restricted / private CIDR block.
 */
export function isPrivateOrRestrictedIp(ip) {
  if (!net.isIP(ip)) return true; // Malformed IP is treated as unsafe

  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return true;
    // 10.0.0.0/8 (Private)
    if (parts[0] === 10) return true;
    // 172.16.0.0/12 (Private: 172.16.x.x - 172.31.x.x)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 169.254.0.0/16 (Link-Local & Cloud Metadata AWS/GCP/Azure)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 0.0.0.0/8 (Current network)
    if (parts[0] === 0) return true;
    return false;
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    // ::1 (Loopback)
    if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
    // fc00::/7 (Unique local address)
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    // fe80::/10 (Link-local)
    if (normalized.startsWith('fe80:')) return true;
    // IPv4-mapped IPv6 ::ffff:127.0.0.1
    if (normalized.includes('::ffff:')) {
      const ipv4Part = normalized.split('::ffff:')[1];
      return isPrivateOrRestrictedIp(ipv4Part);
    }
  }

  return false;
}

/**
 * Securely resolves a target URL and validates its IP to eliminate SSRF & DNS Rebinding.
 */
export async function validateOutboundUrl(rawUrl) {
  const parsed = new URL(rawUrl);

  // 1. Strict protocol whitelist
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Disallowed protocol: ${parsed.protocol}`);
  }

  const hostname = parsed.hostname;

  // 2. Direct IP check if hostname is already a numeric IP
  if (net.isIP(hostname)) {
    if (isPrivateOrRestrictedIp(hostname)) {
      throw new Error(`Access to restricted IP denied: ${hostname}`);
    }
    return { url: parsed, resolvedIp: hostname };
  }

  // 3. Resolve using c-ares to avoid threadpool block
  const resolver = new dnsPromises.Resolver();
  const addresses = await resolver.resolve4(hostname);

  if (!addresses || addresses.length === 0) {
    throw new Error(`DNS resolution failed for hostname: ${hostname}`);
  }

  // 4. Verify all resolved IPs are public
  for (const ip of addresses) {
    if (isPrivateOrRestrictedIp(ip)) {
      throw new Error(`Hostname ${hostname} resolved to restricted IP: ${ip} (SSRF Blocked)`);
    }
  }

  return { url: parsed, resolvedIp: addresses[0] };
}
```

---

## Edge Cases and Tricky Scenarios

### 1. The Undici / `fetch()` Leaked Response Body Socket Lock

In Node.js 18+ global `fetch()` (powered by `undici`), an HTTP socket is checked out of the internal connection pool when a request begins. If the server returns a non-200 error code (e.g., 500 or 404) and your application handles it without reading the body, the socket remains locked until garbage collected. Under high volume, this rapidly exhausts the client pool:

```js
// Node.js code
// ❌ WRONG: Response body is never consumed. The underlying socket hangs open in undici!
async function leakyFetch(url) {
  const res = await fetch(url);
  if (!res.ok) {
    // Throws error immediately without consuming body!
    throw new Error(`HTTP Error: ${res.status}`);
  }
  return await res.json();
}

// ✅ CORRECT: Always drain or dump the body stream on error paths
async function safeFetch(url) {
  const res = await fetch(url);
  if (!res.ok) {
    // Read and discard or log snippet to release socket back to pool
    const errorText = await res.text().catch(() => '');
    throw new Error(`HTTP Error: ${res.status}: ${errorText.slice(0, 100)}`);
  }
  return await res.json();
}
```

### 2. Disabling TLS Verification via `NODE_TLS_REJECT_UNAUTHORIZED = '0'`

A frequent developer trap when encountering self-signed certificate errors in development is setting `process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'`.

- **The Danger**: This environment variable disables certificate signature verification across the **entire Node.js process** for all outbound HTTPS requests, exposing all third-party API keys, Stripe requests, and OAuth tokens to trivial Man-in-the-Middle (MitM) interception.
- **The Correct Fix**: Supply the specific self-signed or enterprise Certificate Authority (CA) root directly to the custom `https.Agent` via the `ca` option:
  ```js
  // Node.js code
  import https from 'node:https';
  import fs from 'node:fs';

  const customAgent = new https.Agent({
    ca: fs.readFileSync('./internal-ca.pem'), // Verify against private company CA only
    rejectUnauthorized: true                   // Enforce strict TLS validation
  });
  ```

---

## Node.js, JavaScript, and Systems Connections

```text
┌──────────────────────────────────────────────────────────────┐
│ V8 JavaScript Engine                                         │
│ - AbortController & AbortSignal (Cooperative cancellation)   │
│ - URL Class (RFC 3986 parsing & normalization)               │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Node.js Core Modules                                         │
│ - node:net / node:tls (Raw TCP and TLS byte streams)         │
│ - node:http / node:https (Message framing & Agent pooling)   │
│ - undici (High performance client powering global fetch)     │
└──────────────┬───────────────────────────────┬───────────────┘
               │                               │
┌──────────────▼──────────────┐ ┌──────────────▼───────────────┐
│ Libuv Thread Pool           │ │ Libuv Event Loop (epoll/kqueue)│
│ - dns.lookup() ->           │ │ - dns.resolve() -> c-ares UDP │
│   POSIX getaddrinfo(3)      │ │ - TCP Socket non-blocking I/O │
└─────────────────────────────┘ └──────────────────────────────┘
```

- **JavaScript Core**: `AbortSignal.timeout(ms)` provides standard browser/runtime-compatible deadline generation. Signals compose cleanly using `AbortSignal.any([signal1, signal2])`.
- **Node Runtime**: The choice between `dns.lookup` and `dns.resolve` bridges the gap between POSIX system compatibility and high-throughput non-blocking event loops.
- **Systems & OS**: TCP Keep-Alive operates at the TCP layer (Layer 4) with kernel ACK packets, whereas HTTP Keep-Alive operates at the application layer (Layer 7) controlling socket reuse across multiple HTTP transactions.

---

## Hands-On Exercise

### Scenario
An existing microservice aggregator calls an upstream pricing service. In production, when the pricing service slows down under peak load, the Node.js API server freezes, health checks fail, and CPU usage stays low while memory and open file descriptors spike until the container is terminated by Kubernetes.

### Buggy Code

```js
// Node.js code
// filename: buggy-aggregator.mjs
import http from 'node:http';

export function fetchProductPrice(productId) {
  return new Promise((resolve, reject) => {
    // Bug 1: Creates an unmanaged request with NO timeouts whatsoever
    // Bug 2: Host header / URL constructed from input without validation
    // Bug 3: If upstream stalls or drops packets, socket remains open indefinitely
    const req = http.get(`http://pricing-service.internal:8080/price/${productId}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve(JSON.parse(data));
      });
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}
```

### Acceptance Criteria
1. Construct and reuse a persistent `http.Agent` with `keepAlive: true` and capped `maxSockets`.
2. Apply a strict stage-based timeout: 500ms connect timeout, 1500ms response headers timeout, and a 2500ms total deadline.
3. Automatically abort the request and destroy the underlying socket upon timeout or caller cancellation.
4. Safely retry once on transient network drop (`ECONNRESET` or `ETIMEDOUT`) using full jitter.

### Solution Code

```js
// Node.js code
// filename: solution-aggregator.mjs
import http from 'node:http';

// Reusable persistent agent with connection limits
const pricingAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 30000 // Destroy idle pooled sockets after 30s
});

export function fetchProductPriceWithProtection(productId, options = {}) {
  const { maxRetries = 1, timeoutMs = 2500 } = options;

  const attemptRequest = (remainingBudget) => {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      let connectTimer = null;
      let headersTimer = null;
      let settled = false;

      const totalTimer = setTimeout(() => {
        cleanup();
        controller.abort();
        reject(new Error(`Total request timeout (${timeoutMs}ms)`));
      }, remainingBudget);

      const cleanup = () => {
        settled = true;
        clearTimeout(totalTimer);
        if (connectTimer) clearTimeout(connectTimer);
        if (headersTimer) clearTimeout(headersTimer);
      };

      const req = http.get({
        hostname: 'pricing-service.internal',
        port: 8080,
        path: `/price/${encodeURIComponent(productId)}`,
        agent: pricingAgent,
        signal: controller.signal
      }, (res) => {
        if (headersTimer) clearTimeout(headersTimer);

        if (res.statusCode < 200 || res.statusCode >= 300) {
          // Drain body to release socket back to pool
          res.resume();
          cleanup();
          return reject(new Error(`Upstream status ${res.statusCode}`));
        }

        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          cleanup();
          try {
            const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            resolve(parsed);
          } catch (e) {
            reject(new Error('Malformed JSON payload from pricing service'));
          }
        });
        res.on('error', (err) => {
          cleanup();
          reject(err);
        });
      });

      // Connect timeout
      connectTimer = setTimeout(() => {
        if (!settled) {
          cleanup();
          req.destroy(new Error('Connect timeout (500ms)'));
        }
      }, 500);

      req.on('socket', (socket) => {
        socket.once('connect', () => {
          if (connectTimer) clearTimeout(connectTimer);
          // Arm headers timeout once socket connects
          headersTimer = setTimeout(() => {
            if (!settled) {
              cleanup();
              req.destroy(new Error('Headers timeout (1500ms)'));
            }
          }, 1500);
        });
      });

      req.on('error', (err) => {
        cleanup();
        reject(err);
      });
    });
  };

  // Execute with bounded retry and jitter
  return (async () => {
    const startTime = Date.now();
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const elapsed = Date.now() - startTime;
      const budgetLeft = timeoutMs - elapsed;
      if (budgetLeft <= 0) {
        throw new Error('Overall budget expired prior to attempt');
      }

      try {
        return await attemptRequest(budgetLeft);
      } catch (err) {
        const isTransient = err.message.includes('timeout') || err.code === 'ECONNRESET';
        if (attempt === maxRetries || !isTransient) {
          throw err;
        }

        // Full jitter backoff: 50ms - 150ms
        const jitterSleep = Math.floor(Math.random() * 100) + 50;
        await new Promise((r) => setTimeout(r, jitterSleep));
      }
    }
  })();
}
```

### Solution Explanation
1. **Reused Agent**: `pricingAgent` enables Keep-Alive to avoid repeated TCP handshakes while setting `maxSockets: 50` to safeguard local file descriptors and the upstream server.
2. **Layered Deadlines**: A `connectTimer` catches hanging TCP handshakes in 500ms; a `headersTimer` catches application processing hangs in 1500ms; and `totalTimer` guarantees strict 2500ms completion.
3. **Stream Drainage**: If upstream returns a non-200 code, `res.resume()` is called immediately to consume the stream, allowing the socket to return to the pool rather than leaking.
4. **Jittered Retry**: Only retryable transient network errors trigger a retry, with sleep calculated via randomized jitter to prevent synchronized retry waves.

---

## Summary

- Outbound requests traverse DNS, TCP handshake, TLS negotiation, request writing, headers reception (TTFB), and body streaming; each stage requires dedicated monitoring and timeouts.
- `dns.lookup()` executes on the shared libuv thread pool (4 threads by default), causing DNS spikes to starve file system (`fs`) and cryptography tasks. Use `dns.resolve*()` via `c-ares` for high-volume non-blocking resolution.
- Connection pooling via `http.Agent` reuses idle sockets, but requires handling stale socket races (`ECONNRESET`) and bounding `maxSockets` to prevent descriptor exhaustion.
- Never set a single indefinite timeout; implement connect, headers, idle, and end-to-end deadline budgets using `AbortController`.
- SSRF defenses must resolve hostnames and validate target IPs against RFC 1918 / RFC 3927 private ranges before connecting to prevent DNS rebinding attacks.
- Retries must be limited to idempotent operations, bounded by total time budgets, and paced with exponential backoff and full jitter.

---

## Cheat Sheet

| Parameter / API | Recommended Value / Pattern | Primary Purpose |
| :--- | :--- | :--- |
| `http.Agent({ keepAlive: true })` | Always enabled for internal microservices | Reduces latency by reusing established TCP/TLS connections |
| `Agent({ maxSockets: N })` | 25 – 100 per service dependency | Bounds client socket creation and prevents remote host flooding |
| `c-ares (dns.resolve4)` | In custom agent `lookup` | Avoids blocking libuv thread pool with DNS queries |
| `AbortSignal.timeout(ms)` | 2000ms – 5000ms | Global operation deadline covering retries and network phases |
| `socket.setTimeout(ms)` | 10000ms – 30000ms idle timeout | Detects dead half-open TCP connections |
| `Full Jitter formula` | `random() * min(cap, base * 2^attempt)` | Eliminates thundering herds during system recovery |

### Common Pitfalls
- **Setting `NODE_TLS_REJECT_UNAUTHORIZED='0'` in production**: Destroys TLS integrity and exposes credentials to MitM attacks. Supply the specific CA certificate instead.
- **Unbounded `maxSockets: Infinity`**: Default in Node.js core `http.Agent`; can cause socket exhaustion (`EMFILE`) during outbound traffic surges.
- **Retrying POST requests without Idempotency Keys**: Generates duplicate transactions, double payments, or repeated records upon network timeouts.
- **Forgetting `res.resume()` on error responses**: Leaks pooled sockets in `undici` and `http.Agent`, eventually starving future outbound requests.

---

## Interview Questions

### 1. What is the fundamental difference between `dns.lookup()` and `dns.resolve()` in Node.js, and how can high outbound request traffic degrade file system performance?

`dns.lookup()` wraps the operating system's synchronous C library call `getaddrinfo(3)`. Because `getaddrinfo` lacks a non-blocking asynchronous POSIX implementation, Node.js executes it on the **libuv thread pool** (which defaults to only 4 threads). In contrast, `dns.resolve()` (and its family `dns.resolve4`, `dns.resolve6`) utilizes the third-party `c-ares` C library, which issues asynchronous UDP and TCP queries directly over non-blocking sockets managed by the libuv event loop, consuming zero thread pool threads.

When an application issues hundreds of concurrent outbound requests using default Node.js HTTP methods (`http.request()`, `https.request()`, or `fetch()`), Node invokes `dns.lookup()` for every hostname. Under high volume or when public DNS servers respond slowly, all 4 libuv threads become blocked waiting for DNS responses. Because file system operations (`fs.readFile`, `fs.writeFile`) and CPU-intensive crypto tasks (`crypto.pbkdf2`) also share this exact same 4-thread pool, local file reads and authentication hashing completely freeze, degrading server throughput even though CPU utilization remains near zero. The production mitigation is to configure a custom agent with a non-blocking `c-ares` lookup function or expand `UV_THREADPOOL_SIZE`.

### 2. Why can an HTTP client experience an `ECONNRESET` error when reusing a Keep-Alive connection, and how should a resilient client handle it?

An `ECONNRESET` on a persistent connection occurs due to an inherent race condition between the client and server keep-alive idle timers. In HTTP/1.1 Keep-Alive, an idle socket remains open in the client's connection pool waiting for the next request. Concurrently, the upstream server runs its own idle connection timer (for example, 5 seconds). If the upstream server reaches its idle timeout and transmits a TCP `FIN` packet to close the socket at the exact moment the client pulls that idle socket from its pool and writes a new HTTP request, the client's request packets cross paths with the server's close packet on the wire.

When the server receives new data on a connection it has already begun closing, its TCP stack responds with a `RST` (Reset) packet. The client's operating system receives the `RST` and emits an `ECONNRESET` error on the socket. Because this failure occurs before any request processing took place on the server, it is an expected transient network artifact of connection reuse. A resilient HTTP client must inspect whether the failed request was sent over a reused socket; if so, it should silently close the stale socket, check out a fresh connection, and immediately retry the request once without counting it against the caller's main application retry budget.

### 3. If an outbound HTTP request times out on the client side, does that guarantee the upstream server did not execute the operation? How does this dictate retry design?

A client-side timeout provides **zero guarantee** regarding the server's execution state. In networking, a timeout only proves that the client did not observe a response within its configured deadline. The failure could have occurred at any point along the bidirectional path:
1. The request was lost in transit before reaching the server (not executed).
2. The request reached the server and executed successfully, but the network connection severed before the response reached the client (fully executed).
3. The server received the request and is currently executing it in the background while the client timed out (in-flight execution).

Because of this uncertainty, automatically retrying a timed-out request is dangerous for non-idempotent operations like processing a payment, booking a seat, or creating an account. If the original request succeeded, an automatic retry would duplicate the business operation. Resilient retry design mandates that clients only retry operations that are strictly idempotent (such as `GET`, `PUT`, `DELETE`) or require a unique `Idempotency-Key` header passed in the request. The upstream server stores this key and returns the cached result of the original execution if a duplicate key arrives, guaranteeing at-most-once execution semantics despite network retries.

### 4. How does a DNS Rebinding attack bypass traditional SSRF validation, and how do you implement a bulletproof defense in Node.js?

A traditional SSRF validation function inspects a user-supplied URL by resolving its hostname (e.g., `attacker.com`) to an IP address, checking that the IP is not in a private CIDR block (like `127.0.0.1` or `169.254.169.254`), and then calling `fetch(url)`. An attacker bypasses this check using **DNS Rebinding**, exploiting the Time-of-Check to Time-of-Use (TOCTOU) gap between the validation code and the actual HTTP request.

The attacker controls the authoritative nameserver for `attacker.com`. When the application performs the validation lookup, the attacker's nameserver returns a benign public IP address (such as `1.2.3.4`) with a DNS TTL (Time To Live) of 0 or 1 second. The validation passes. Immediately following the check, `fetch(url)` executes and initiates a second DNS lookup because the record has already expired. This time, the attacker's nameserver returns `169.254.169.254` (the AWS/GCP instance metadata IP) or `127.0.0.1`. The HTTP client connects directly to the internal target, leaking credentials or sensitive cluster configurations.

To implement a bulletproof defense in Node.js, you must eliminate the double DNS resolution:
1. Resolve the hostname once using `c-ares`.
2. Inspect every resolved IP address against strict private/loopback/link-local CIDR ranges.
3. Connect directly to the validated IP address at the socket level (`net.createConnection({ host: validatedIp, port })`).
4. Set the original hostname in the HTTP `Host` header and the TLS `servername` option (SNI) so virtual hosting and certificate validation function correctly, guaranteeing that the outbound socket connects strictly to the pre-verified IP address.

---

<nav aria-label="Lecture navigation">

[← Previous: Node HTTP Fundamentals](day-09-node-http-fundamentals.md) | [Roadmap](../node-roadmap.md) | [Next: Worker Threads and Child Processes](day-11-worker-threads-and-child-processes.md)

</nav>