# Day 34: Deadlines, Retries, and Idempotency

<nav aria-label="Lecture navigation">

[Previous: Layered Backend Architecture](day-33-layered-backend-architecture.md) | [Roadmap](../node-roadmap.md) | [Next: Caching and Rate Limiting](day-35-caching-and-rate-limiting.md)

</nav>

## Prerequisites

- [Day 10: Networking, DNS, TLS, and Timeouts](day-10-networking-dns-tls-and-timeouts.md) — Socket timeouts, DNS lookups, and TCP teardown.
- [Day 18: API Contracts, Pagination, and Idempotency](day-18-api-contracts-pagination-and-idempotency.md) — Idempotency headers and API response envelopes.
- [Day 28: Parameterized SQL CRUD](day-28-parameterized-sql-crud.md) — Atomic transactions and conflict resolution.
---

## Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                       DISTRIBUTED TIMEOUT VS DEADLINE PROPAGATION                           │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Client (Total Timeout: 1000ms)
     │
     │ Sends HTTP POST /orders (Deadline: T0 + 1000ms = 12:00:01.000)
     ▼
  Gateway Service (Elapsed: 200ms)
     │
     │ Remaining Budget: 800ms
     │ Forwards request to Payment Service with header: X-Request-Deadline: 12:00:01.000
     ▼
  Payment Service (Elapsed: 500ms)
     │
     │ Remaining Budget: 300ms
     │ Issues DB query with: SET LOCAL statement_timeout = '250ms'
     ▼
  PostgreSQL Database
     │
     │ If DB takes > 250ms: Statement canceled! Saves database CPU!
     ▼
  Outcome: System halts immediately when budget expires, preventing wasted computation.
```

### 1. Timeouts vs Cancellation vs Deadlines

In single-process applications, terminating a promise when a timer fires is simple. In distributed microservice architectures, three distinct concepts must be coordinated:

1. **Local Timeout:**
   ```javascript
   // Node.js code
   const res = await Promise.race([
     fetch('https://api.billing.com/charge'),
     new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
   ]);
   ```
   **The Hazard:** When the 2000ms timer fires, the client rejects the promise and moves on. However, the underlying TCP socket to `api.billing.com` may remain open, and the remote billing server continues processing and charges the credit card!
2. **Cooperative Cancellation (`AbortSignal`):**
   ```javascript
   // Node.js code
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 2000);
   const res = await fetch('https://api.billing.com/charge', { signal: controller.signal });
   ```
   Aborting closes the local socket. If the remote server monitors connection close events, it can stop processing.
3. **Deadline Propagation:**
   Rather than passing a relative timeout ("5 seconds"), the originating client defines an absolute timestamp: `X-Request-Deadline: 1772841605000`. Each intermediate hop subtracts the current timestamp from the deadline. If the remaining budget is zero or less than network transmission latency, the service aborts immediately without making downstream calls.

---

### 2. Retry Policies and Classification

Retrying is a policy designed strictly for **transient network and infrastructure failures**. Retrying permanent business or validation errors is an anti-pattern.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             ERROR RETRY CLASSIFICATION MATRIX                               │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Error Category        Examples                          Retryable?   Handling Strategy
 ─────────────────────────────────────────────────────────────────────────────────────────────
  Client Errors         400 Bad Request, 422 Validation   ❌ NEVER     Fail fast; log validation issues
  Authentication        401 Unauthorized, 403 Forbidden   ❌ NEVER     Fail fast; client must re-auth
  Not Found             404 Not Found                     ❌ NEVER     Fail fast; entity does not exist
  Rate Limiting         429 Too Many Requests             ⚠️ CONDITIONAL Retry ONLY if Retry-After header present
  Transient Server      502 Bad Gateway, 503 Unavailable  ✅ YES       Retry with exponential backoff & jitter
  Downstream Timeout    504 Gateway Timeout               ⚠️ WITH IDEMPOTENCY Retry ONLY if operation is idempotent
  Network Transport     ECONNRESET, ETIMEDOUT, ECONNREFUSED ✅ YES     Retry with exponential backoff & jitter
  Database Concurrency  Postgres 40001, 40P01 (Deadlock)  ✅ YES       Retry with immediate randomized jitter
```

---

### 3. Preventing Retry Storms: Full Jitter Backoff

> **Full Jitter Backoff**: A randomized exponential backoff formula: $t = \text{random}(0, \min(\text{cap}, \text{base} \times 2^{\text{attempt}}))$.

> **Retry Storm**: A cascading system failure where hundreds of clients simultaneously retry requests against a struggling downstream service, driving it to 100% failure.

When a downstream service degrades or restarts, all connected clients encounter failures simultaneously. If clients use a standard fixed backoff (e.g., retry every 500ms) or pure exponential backoff without randomness, their retries align into synchronized pulses—a **Thundering Herd** or **Retry Storm**. The struggling service is repeatedly hammered by traffic spikes every time clients retry.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           BACKOFF ALGORITHM COMPARISON                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  1. PURE EXPONENTIAL BACKOFF (Causes synchronized spikes):
     Attempt 1: 100ms   ──► 1,000 clients retry together at T+100ms 💥
     Attempt 2: 200ms   ──► 1,000 clients retry together at T+300ms 💥
     Attempt 3: 400ms   ──► 1,000 clients retry together at T+700ms 💥

  2. EXPONENTIAL BACKOFF WITH FULL JITTER (Smooth distribution):
     Formula: sleep = Math.random() * Math.min(cap, base * 2 ** attempt)
     Retries are spread evenly across the time window, allowing the service to recover!
```

```javascript
// Node.js code
// pattern: Exponential backoff with Full Jitter and Retry Budget
export function calculateFullJitterDelay(attempt, baseMs = 100, maxMs = 5000) {
  const exponentialLimit = Math.min(maxMs, baseMs * Math.pow(2, attempt));
  // Full Jitter: Uniformly distributed between 0 and exponentialLimit
  return Math.floor(Math.random() * exponentialLimit);
}
```

#### Retry Budgets

To protect infrastructure from endless retries, implement a **Retry Budget** (using a token bucket algorithm). A service must limit retried requests to a maximum percentage of total traffic (e.g., at most **10%** of outbound calls can be retries). If the budget is exhausted, further retries are blocked and failed immediately, preventing cascading system collapse.

---

### 4. The Idempotency State Machine

> **Idempotency State Machine**: A persistent record tracking the lifecycle (`PENDING` $\to$ `COMPLETED` / `FAILED`) of an operation keyed by a client-provided UUID.

An operation is **idempotent** if performing it once produces the exact same side-effects and outcome as performing it multiple times with identical parameters ($f(x) = f(f(x))$).

For non-idempotent operations (such as processing credit card payments or creating orders), clients must supply a unique `Idempotency-Key` header (typically a UUIDv4).

The server enforces an **Atomic 3-State Lifecycle**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          IDEMPOTENCY KEY STATE MACHINE LIFECYCLE                            │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

                  Client sends POST /payments with Idempotency-Key
                                          │
                                          ▼
                                Atomic INSERT / Lock
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
         Key Does NOT Exist                              Key ALREADY Exists
                  │                                               │
      Set State = 'PENDING'                               Check Recorded State
      Store Request SHA-256 Hash                                  │
                  │                                ┌──────────────┼──────────────┐
                  ▼                                ▼              ▼              ▼
         Execute Payment Logic                 'PENDING'     'COMPLETED'      'FAILED'
                  │                                │              │              │
        ┌─────────┴─────────┐                      ▼              ▼              ▼
        ▼                   ▼                 Concurrent     Return Cached  Allow Retry /
     Success             Failure               Conflict      HTTP Response  Clear Key
        │                   │                 (409 Conflict) (200 / 201)    (Depends on policy)
        ▼                   ▼
  State='COMPLETED'   State='FAILED'
  Cache HTTP Status   Clear Key OR
  & Response Body     Store Error
```

#### Request Fingerprinting Safety

What happens if an attacker or buggy client sends the same `Idempotency-Key` but changes the payment amount from `$10` to `$10,000`?
- The server must compute a cryptographic hash (e.g., SHA-256) of the incoming request payload (`method + path + body`).
- When a matching idempotency key is found, the server verifies that the incoming request hash matches the stored hash.
- If the hashes differ, the server rejects the request with **`422 Unprocessable Entity`** or **`400 Bad Request`** with error code `IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`.

---

## Detailed Explanations and Traces

### Network Trace: Handling Duplicate In-Flight Requests

Consider two concurrent network calls using the same idempotency key arriving milliseconds apart:

```
Time   Request 1 (Client A)                          Request 2 (Client A Network Retry)
────────────────────────────────────────────────────────────────────────────────────────────
T1     POST /orders (Key: "k-100", Hash: "abc")
T2     DB: Atomic INSERT ... ON CONFLICT
       Status: PENDING ✅
T3                                                   POST /orders (Key: "k-100", Hash: "abc")
T4                                                   DB: Inspects key "k-100"
                                                     Status: PENDING!
T5                                                   Decision: Operation currently in flight.
                                                     Returns: 409 Conflict (or waits on poll).
T6     Service completes order placement.
T7     DB: UPDATE idempotency_keys
       SET status = 'COMPLETED',
           response_status = 201,
           response_body = '{"id":"ord-1"}'
T8     Client A receives 201 Created.
────────────────────────────────────────────────────────────────────────────────────────────
T9     (Subsequent retry after network blip)
       POST /orders (Key: "k-100", Hash: "abc")
T10    DB: Inspects key "k-100" -> Status: COMPLETED
       Returns: Cached 201 Created with '{"id":"ord-1"}' instantly without re-executing order!
```

---

## Common Mistakes and Interview Traps

### 1. The Cache-Then-Mutate Race Condition

Developers frequently implement idempotency using non-atomic Redis operations:
```javascript
// Node.js code
// ❌ WRONG: TOCTOU race condition in Redis
const cached = await redis.get(`idemp:${key}`);
if (cached) return JSON.parse(cached);
// Vulnerable gap! Concurrent requests pass through here simultaneously!
await redis.set(`idemp:${key}`, JSON.stringify(result));
```
**Fix:** Always use an atomic lock (`SET key val NX EX 30` in Redis) or a PostgreSQL `INSERT ... ON CONFLICT DO NOTHING` statement to establish the lock atomically.

### 2. Retrying When HTTP Responses Are Lost

When a client experiences a network timeout or connection reset while waiting for a response, the client **does not know** whether the server processed the request. Retrying without an idempotency key guarantees duplicate operations. Senior engineers design all write endpoints with idempotency keys.

---

## Tricky Points and Edge Cases

### 1. Cooperative Cancellation with Node.js Streams

> **Cooperative Cancellation**: A cancellation pattern using `AbortController` and `AbortSignal` where downstream tasks actively listen for termination signals.

When a client closes an HTTP connection mid-stream (`req.on('close')`), Node.js does not automatically stop background asynchronous operations unless your code explicitly registers an abort listener:
```javascript
// Node.js code
app.get('/heavy-report', async (req, res) => {
  const ac = new AbortController();
  req.on('close', () => {
    if (!res.writableEnded) {
      ac.abort(); // Propagates cancellation to database
    }
  });

  const data = await fetchReportFromPostgres(pool, { signal: ac.signal });
  res.json(data);
});
```

---

## Hands-On Exercise: Resilient HTTP Client with Idempotency Middleware

### Scenario

You are building the integration layer between an Express ordering API and an external payment gateway.
The current client exhibits critical reliability defects:
1. It retries blindly on every failure, causing duplicate payment charges.
2. It uses fixed 200ms sleep timers without jitter, contributing to retry storms.
3. It has no request timeout or cancellation mechanism.
4. The server endpoint lacks idempotency protection, causing double-orders when clients retry.

### Buggy Code

```javascript
// Node.js code
// anti-pattern: Fragile HTTP client and non-idempotent endpoint
export async function buggyChargePayment(url, payload) {
  let attempts = 0;
  while (attempts < 5) {
    try {
      // BUG 1: No timeout, no AbortSignal!
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      // BUG 2: Retries on 400 Bad Request and 402 Card Declined!
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      attempts++;
      // BUG 3: Fixed sleep causes thundering herd retry storms!
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error('Exceeded retries');
}
```

### Acceptance Criteria

1. Implement `resilientFetchWithRetry`:
   - Enforce an end-to-end deadline budget via `AbortController`.
   - Implement Exponential Backoff with Full Jitter.
   - Retry exclusively on transient errors (network errors, `502`, `503`, `504`, `429`).
   - Stop retrying immediately on non-transient client errors (`400`, `401`, `403`, `422`).
2. Implement an Express Idempotency Middleware backed by PostgreSQL or Redis:
   - Atomic state transitions: `PENDING` $\to$ `COMPLETED` / `FAILED`.
   - Fingerprint incoming payloads using SHA-256.
   - Return `409 Conflict` if an identical key is currently `PENDING`.
   - Return `422 Unprocessable Entity` if an existing key is presented with a mismatched payload hash.
   - Return the cached response body and status code if `COMPLETED`.

### Solution Code

```javascript
// Node.js code
import crypto from 'crypto';

// ==========================================
// 1. RESILIENT RETRY CLIENT WITH DEADLINES
// ==========================================

export class NonRetryableError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'NonRetryableError';
    this.status = status;
  }
}

export async function resilientFetchWithRetry(url, options = {}, config = {}) {
  const {
    maxAttempts = 3,
    baseDelayMs = 150,
    maxDelayMs = 3000,
    timeoutMs = 5000
  } = config;

  const deadline = Date.now() + timeoutMs;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    const remainingBudget = deadline - Date.now();
    if (remainingBudget <= 0) {
      throw new Error('Operation deadline exceeded before request dispatch');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), remainingBudget);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      // Return successful response
      if (response.ok) {
        return response;
      }

      // Check if status is transient
      const isTransient = [429, 502, 503, 504].includes(response.status);
      if (!isTransient) {
        // Permanent failure (400, 401, 403, 404, 422, etc.)
        throw new NonRetryableError(`Permanent HTTP error: ${response.status}`, response.status);
      }

      // Handle Rate-Limiting Retry-After header if present
      const retryAfterHeader = response.headers.get('retry-after');
      let delayMs;
      if (retryAfterHeader) {
        delayMs = Number(retryAfterHeader) * 1000;
      } else {
        // Full Jitter Formula: rand(0, min(maxDelay, base * 2^attempt))
        const exponentialBound = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
        delayMs = Math.floor(Math.random() * exponentialBound);
      }

      // Respect deadline boundary
      if (Date.now() + delayMs >= deadline) {
        throw new Error('Deadline exceeded during retry backoff window');
      }

      await new Promise((r) => setTimeout(r, delayMs));
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof NonRetryableError) {
        throw err;
      }

      // On final attempt, bubble error
      if (attempt >= maxAttempts) {
        throw new Error(`Failed after ${attempt} attempts: ${err.message}`);
      }

      // Network error (ECONNRESET, ETIMEDOUT, AbortError): Calculate jitter backoff
      const exponentialBound = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
      const delayMs = Math.floor(Math.random() * exponentialBound);

      if (Date.now() + delayMs >= deadline) {
        throw new Error('Deadline exceeded during network retry backoff');
      }

      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

// ==========================================
// 2. ATOMIC POSTGRESQL IDEMPOTENCY MIDDLEWARE
// ==========================================

export function createIdempotencyMiddleware(pool) {
  return async (req, res, next) => {
    // Only apply idempotency to mutating HTTP methods
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers['idempotency-key'];
    if (!idempotencyKey) {
      return next(); // Key is optional; proceed normally
    }

    // Compute request payload fingerprint (SHA-256)
    const payloadHash = crypto
      .createHash('sha256')
      .update(`${req.method}:${req.originalUrl}:${JSON.stringify(req.body ?? {})}`)
      .digest('hex');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Attempt atomic lock insertion
      const insertQuery = `
        INSERT INTO idempotency_records (
          key, request_hash, status, created_at, expires_at
        )
        VALUES ($1, $2, 'PENDING', NOW(), NOW() + INTERVAL '24 hours')
        ON CONFLICT (key) DO NOTHING
        RETURNING key, request_hash, status, response_status, response_body;
      `;

      const insertRes = await client.query(insertQuery, [idempotencyKey, payloadHash]);

      if (insertRes.rowCount > 0) {
        // Lock acquired! Commit lock transaction and attach completion hook
        await client.query('COMMIT');
        client.release();

        // Intercept response methods to cache result on completion
        const originalJson = res.json.bind(res);
        res.json = (body) => {
          // Asynchronously update record to COMPLETED
          pool.query(
            `UPDATE idempotency_records
             SET status = 'COMPLETED',
                 response_status = $1,
                 response_body = $2,
                 updated_at = NOW()
             WHERE key = $3`,
            [res.statusCode, JSON.stringify(body), idempotencyKey]
          ).catch((e) => console.error('Failed to update idempotency cache:', e));

          return originalJson(body);
        };

        return next();
      }

      // Key already exists! Fetch existing record
      const selectQuery = `
        SELECT key, request_hash, status, response_status, response_body, expires_at
        FROM idempotency_records
        WHERE key = $1;
      `;
      const { rows } = await client.query(selectQuery, [idempotencyKey]);
      await client.query('COMMIT');
      client.release();

      const record = rows[0];

      // Verification 1: Check payload fingerprint
      if (record.request_hash !== payloadHash) {
        return res.status(422).json({
          error: 'Idempotency Key Conflict',
          detail: 'The payload does not match the original request for this Idempotency-Key.'
        });
      }

      // Verification 2: Check in-flight status
      if (record.status === 'PENDING') {
        return res.status(409).json({
          error: 'Conflict',
          detail: 'An identical request is currently processing. Please retry shortly.'
        });
      }

      // Verification 3: Return cached response if COMPLETED
      if (record.status === 'COMPLETED') {
        res.setHeader('X-Cache-Lookup', 'IDEMPOTENT-HIT');
        return res.status(record.response_status).json(JSON.parse(record.response_body));
      }

      // If record is FAILED, allow retry
      return next();
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      client.release();
      next(err);
    }
  };
}
```

### Solution Explanation

1. **End-to-End Deadlines:** `resilientFetchWithRetry` computes `remainingBudget = deadline - Date.now()` before every attempt, passing the budget to an `AbortController`. Downstream calls are cleanly aborted if the overall deadline is breached.
2. **Selective Retry Logic:** The client explicitly checks status codes. Permanent errors (`400`, `401`, `422`) immediately throw `NonRetryableError`, halting the retry loop. Only transient infrastructure codes (`429`, `502`, `503`, `504`) and socket exceptions trigger retries.
3. **Full Jitter Elimination of Spikes:** The delay uses `Math.random() * Math.min(maxDelay, base * 2 ** attempt)`, ensuring retry attempts are spread uniformly across the time spectrum.
4. **Atomic Database State Machine:** The Express middleware uses `INSERT ... ON CONFLICT DO NOTHING` on `idempotency_records`. If the insert succeeds, this request holds the lock (`PENDING`). If another request with the same key arrives simultaneously, it receives `409 Conflict`.
5. **Fingerprint Verification:** By hashing the method, path, and body into a SHA-256 digest, the middleware protects against parameter tampering and payload mismatches.

---

## Summary

- A local timeout merely stops the caller from waiting; cooperative cancellation (`AbortController`) signals downstream workers to stop, and deadlines propagate absolute time limits across services.
- Never retry non-idempotent operations without an `Idempotency-Key`.
- Only retry transient infrastructure errors (`502`, `503`, `504`, `429`, network drops). Never retry client validation errors (`400`, `422`).
- Prevent Thundering Herds and retry storms using **Exponential Backoff with Full Jitter** and outbound Retry Budgets.
- The Idempotency State Machine requires three states (`PENDING`, `COMPLETED`, `FAILED`), atomic database/Redis locking, and SHA-256 payload fingerprinting to prevent parameter tampering.

---

## Cheat Sheet

| Mechanism | Implementation | Production Protection |
|---|---|---|
| **Deadline Budget** | `const deadline = Date.now() + 5000;` | Prevents cascading hangs across microservices |
| **Cooperative Abort**| `const ac = new AbortController(); fetch(..., { signal: ac.signal })` | Terminates sockets and releases worker memory |
| **Full Jitter** | `Math.random() * Math.min(cap, base * 2**attempt)` | Eliminates retry storms and spreads connection load |
| **Retry Filter** | `[429, 502, 503, 504].includes(status)` | Prevents useless retries on client bugs (`400`, `422`) |
| **Payload Hash** | `crypto.createHash('sha256').update(body).digest('hex')` | Prevents reusing idempotency keys with different payloads |
| **Atomic Lock** | `INSERT INTO idempotency_records (...) ON CONFLICT DO NOTHING` | Prevents concurrent duplicate execution |
| **In-Flight Conflict**| Return `409 Conflict` if status is `'PENDING'` | Informs caller that identical work is actively running |

---

## Interview Questions

### 1. What is the fundamental difference between a timeout and cooperative cancellation in Node.js, and why does a client timeout not guarantee that server work has stopped?

A **timeout** is a purely local timer mechanism residing in the caller's process. When `setTimeout` fires or `Promise.race()` resolves, the caller terminates its local wait promise and resumes execution. However, the timeout does not inherently transmit any cancellation signal across the network socket. The remote server, worker thread, or database query remains completely unaware that the caller stopped waiting; it continues consuming CPU, memory, and database locks until it finishes the computation.

**Cooperative cancellation** relies on an active signaling abstraction, such as `AbortController` and `AbortSignal`. When `controller.abort()` is called, an abort event is fired along the signal pipeline. If passed to `fetch` or Node's `http` client, it forcibly terminates the underlying TCP socket. For this to actually stop remote server work, the downstream server must actively listen for socket disconnect events (`req.on('close')`) and propagate that cancellation to its database driver (e.g., via PostgreSQL's query cancellation protocol or MongoDB's `maxTimeMS`). Without cooperative cancellation, timeouts merely create "zombie" background processes that waste system capacity.

---

### 2. What is a "Retry Storm" (or Thundering Herd) in distributed systems, and how does Exponential Backoff with Full Jitter resolve it?

A **Retry Storm** occurs when a shared dependency (such as an auth service or primary database) suffers a momentary degradation or restarts under load. When the dependency fails, hundreds or thousands of calling client instances fail simultaneously. If those clients implement fixed-interval retries (e.g., "retry every 500ms") or standard exponential backoff without randomness ($t = 2^k$), their retry attempts synchronize into massive, periodic traffic spikes. When the recovering service attempts to restart, it is immediately crushed by a synchronized wave of thousands of retries, driving it back down into failure. This cycle can prolong a brief hiccup into a prolonged outage.

**Exponential Backoff with Full Jitter** breaks synchronization by introducing uniform randomness into the delay window:
$$\text{sleep} = \text{random}(0, \min(\text{cap}, \text{base} \times 2^{\text{attempt}}))$$
Instead of all clients firing retries at the exact same exponential intervals ($100\text{ms}, 200\text{ms}, 400\text{ms}$), each client picks a random number within that range. This spreads the retried requests evenly across the entire time spectrum, transforming destructive traffic spikes into a smooth, low-amplitude stream of requests that allows the downstream dependency to recover gracefully.

---

### 3. How do you design an Idempotency State Machine in Node.js, and how does it prevent race conditions when two identical requests arrive simultaneously?

An Idempotency State Machine uses an atomic persistent storage engine (PostgreSQL or Redis) to manage an operation across three explicit states: `PENDING`, `COMPLETED`, and `FAILED`.

When an incoming request with an `Idempotency-Key` arrives:
1. **Atomic Lock Acquisition:** The server attempts an atomic write:
   ```sql
   INSERT INTO idempotency_records (key, request_hash, status) 
   VALUES ($1, $2, 'PENDING') 
   ON CONFLICT (key) DO NOTHING;
   ```
2. **Handling Concurrent Collision:** If the insert inserts 0 rows, the key already exists. The server reads the existing record. If the status is `'PENDING'`, another concurrent thread is actively processing the request. The server immediately returns **`409 Conflict`** (or pauses to poll the key's status), preventing the second request from executing the underlying business logic.
3. **Payload Fingerprinting:** The server computes a SHA-256 hash of the request method, path, and body, and compares it to the stored `request_hash`. If they do not match, the request is rejected with **`422 Unprocessable Entity`**, preventing key hijacking with altered parameters.
4. **Execution & Caching:** If the insert succeeds, this process executes the business operation. Upon completion, it updates the record to `'COMPLETED'`, caching the HTTP status code and response body.
5. **Replay:** Any future request with that key and matching hash finds status `'COMPLETED'` and immediately returns the cached HTTP response without touching domain logic.

---

### 4. What is the role of Deadline Propagation in a microservices call graph, and how does it differ from per-hop timeout configuration?

In a distributed call graph where Service A calls Service B, which in turn calls Service C and a database, configuring fixed per-hop timeouts (e.g., each service timeout = 3 seconds) creates severe latency waste:
- If Service A has an overall client SLA of 2 seconds, but Service B and C both wait for their individual 3-second timeouts, Service A will time out and fail the customer after 2 seconds, while Service B and C continue processing for up to 6 additional seconds. This is called **budget depletion blindness**.

**Deadline Propagation** replaces relative per-hop timeouts with an absolute global deadline:
1. The entry gateway calculates an absolute cutoff timestamp: $\text{Deadline} = \text{Now} + \text{SLA}$ (e.g., `12:00:02.500`), and passes it in the `X-Request-Deadline` HTTP header.
2. When Service B receives the request, it calculates its remaining time budget: $\text{Budget} = \text{Deadline} - \text{CurrentTime}$. If the budget is already $\le 0$, Service B aborts immediately without calling Service C.
3. When Service B calls Service C or the database, it sets its socket timeout and database `statement_timeout` to the remaining budget minus a small network buffer (e.g., 50ms).
This guarantees that every hop in the call graph respects the caller's deadline, terminating immediately when the overall request budget is exhausted and preserving cluster resources.

---

<nav aria-label="Lecture navigation">

[Previous: Layered Backend Architecture](day-33-layered-backend-architecture.md) | [Roadmap](../node-roadmap.md) | [Next: Caching and Rate Limiting](day-35-caching-and-rate-limiting.md)

</nav>