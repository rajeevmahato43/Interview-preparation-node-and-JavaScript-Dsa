# Day 20: Express Security and HTTP Testing

<nav aria-label="Lecture navigation">

[← Previous: Authentication and Authorization Boundaries](day-19-authentication-and-authorization-boundaries.md) | [Roadmap](../node-roadmap.md) | [Next: MongoDB Driver Lifecycle and BSON](day-21-mongodb-driver-lifecycle-and-bson.md)

</nav>

## Prerequisites

Before diving into security controls and HTTP testing, review:
- [Day 09: Node HTTP Fundamentals](day-09-node-http-fundamentals.md) for HTTP protocol headers and keep-alive connections.
- [Day 12: Testing, Diagnostics, Observability, and Shutdown](day-12-testing-diagnostics-observability-and-shutdown.md) for native `node:test` suites and ephemeral ports.
- [Day 14: Express Middleware and Request Flow](day-14-express-middleware-and-request-flow.md) for middleware pipeline execution order.
- [Day 19: Authentication and Authorization Boundaries](day-19-authentication-and-authorization-boundaries.md) for 401 and 403 authorization guards.
---

## Core Concepts

### 1. HTTP Security Hardening: The Helmet Defense Matrix

Production APIs must instruct client browsers to enforce strict sandboxing behaviors via HTTP response headers:

```text
Incoming Request -> [Helmet Middleware Suite] -> Sets Security Headers -> Response Outbound
```

| Header | Core Protection | Production Value | Attack Mitigated |
| :--- | :--- | :--- | :--- |
| **Content-Security-Policy (CSP)** | Restricts sources from which scripts, styles, and images can load | `default-src 'self'` | Cross-Site Scripting (XSS), Data Exfiltration |
| **Strict-Transport-Security (HSTS)**| Forces browsers to communicate exclusively over HTTPS | `max-age=31536000; includeSubDomains` | SSL Stripping, Man-in-the-Middle (MitM) |
| **X-Content-Type-Options** | Forbids browsers from MIME-sniffing away from declared `Content-Type` | `nosniff` | Malicious script execution disguised as image |
| **X-Frame-Options** | Restricts embedding the site within `<frame>` or `<iframe>` | `DENY` | Clickjacking attacks |
| **Referrer-Policy** | Controls how much referrer metadata is passed in outbound links | `strict-origin-when-cross-origin` | Leaking sensitive token URLs to third parties |

---

### 2. CORS Mechanics and Preflight Negotiations

> **CORS**: Cross-Origin Resource Sharing; a browser-enforced security protocol that dictates whether web pages can read HTTP responses from foreign origins.

CORS is an opt-in mechanism enforced by browsers. It allows web applications hosted on Origin A (`https://app.frontend.com`) to read responses from Origin B (`https://api.backend.com`):

```text
Browser (Origin: https://frontend.com)                 API Server (api.backend.com)
┌──────────────────────────────────────┐               ┌──────────────────────────────┐
│ 1. OPTIONS /api/data (Preflight)     │ ────────────► │ Inspects Origin:             │
│    Access-Control-Request-Method: PUT│               │ In allowlist?                │
│    Access-Control-Request-Headers:   │               │                              │
│    authorization, content-type       │ ◄──────────── │ 2. HTTP 204 No Content       │
│                                      │               │    Access-Control-Allow-     │
│                                      │               │    Origin: https://frontend.com
│                                      │               │    Access-Control-Allow-     │
│                                      │               │    Methods: GET, POST, PUT   │
│                                      │               │    Access-Control-Max-Age:86400
│ 3. Actual Request:                   │               │                              │
│    PUT /api/data (with JWT Token)    │ ────────────► │ 4. Processes request         │
│                                      │ ◄──────────── │    Returns HTTP 200 OK       │
└──────────────────────────────────────┘               └──────────────────────────────┘
```

#### The Reflection Vulnerability
If an API configures CORS by dynamically echoing the incoming `Origin` header alongside `credentials: true`:
```js
// ❌ CRITICAL SECURITY VULNERABILITY: Arbitrary Origin Reflection
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});
```
An attacker can host a malicious website (`https://evil-hacker.com`), trick an authenticated user into visiting it, and issue cross-origin requests. Because the server echoes `https://evil-hacker.com` and allows credentials, the attacker's browser JavaScript can read the user's private data.

---

### 3. Reverse Proxies and the `X-Forwarded-For` Spoofing Hazard

In modern cloud deployments (Kubernetes Ingress, AWS ALB, Cloudflare), Express sits behind one or more reverse proxies.

The client's real IP address is forwarded in the `X-Forwarded-For` header:
```text
X-Forwarded-For: <client_ip>, <proxy_1>, <proxy_2>
```

```text
Attacker (IP: 198.51.100.1) ──► Sends Header: "X-Forwarded-For: 127.0.0.1"
      │
      ▼
Load Balancer (AWS ALB: 10.0.1.5) ──► Appends Real IP: "127.0.0.1, 198.51.100.1"
      │
      ▼
Express Application:
- If trust proxy is FALSE: req.ip is "10.0.1.5" (All clients share ALB IP! Rate limiting breaks!)
- If trust proxy is TRUE (Blindly): Express reads LEFTMOST value: "127.0.0.1" (SPOOFED!)
- If trust proxy is CONFIGURED (1 hop): Express reads RIGHTMOST untrusted IP: "198.51.100.1" (SAFE!)
```

#### Production Rule:
Never set `app.set('trust proxy', true)`. Configure exact hop counts or subnet CIDRs:
```js
// Trust exactly 1 upstream proxy (e.g. AWS ALB)
app.set('trust proxy', 1);

// Or trust specific private subnets
app.set('trust proxy', 'loopback, linklocal, 10.0.0.0/8');
```

---

### 4. Sliding-Window Rate Limiting Architecture

Fixed-window rate limiters (e.g., 100 requests per clock minute) suffer from the **Boundary Burst Flaw**: a client sends 100 requests at 11:59:59 and another 100 requests at 12:00:01, hitting the backend with 200 requests within 2 seconds.

The **Sliding-Window Algorithm** tracks requests over a rolling 60-second window using Redis Sorted Sets:

```text
Redis Sorted Set Key: "rate_limit:user_123"
Score = Timestamp in Milliseconds | Member = Unique Request ID / Nonce

1. Remove elements older than (now - 60000ms):
   ZREMRANGEBYSCORE key 0 (now - 60000)

2. Count elements remaining in current rolling window:
   ZCARD key

3. If count >= limit:
   Reject with HTTP 429 Too Many Requests (Compute Retry-After from oldest entry)

4. If count < limit:
   ZADD key now nonce
   EXPIRE key 60
   Allow request
```

---

### 5. Deterministic Integration Testing via Ephemeral Ports

> **Ephemeral Port (Port 0)**: Instructing the OS kernel to assign an unused random high port by passing port `0` to `server.listen(0)`.

Unit tests with mocks cannot verify that middleware order, header parsers, CORS preflights, and error handlers work together correctly.

A robust integration test:
1. Spawns an actual instance of the Express app using `createApp(deps)`.
2. Binds to **Port 0** (`server.listen(0)`), allowing the OS kernel to assign an ephemeral, non-conflicting port.
3. Issues real HTTP requests using native `fetch()`.
4. Closes the server cleanly in an `after()` lifecycle hook.

```text
[CI Test Worker 1] ──► createApp() ──► server.listen(0) ──► Bound to Port 49215 (Isolated!)
[CI Test Worker 2] ──► createApp() ──► server.listen(0) ──► Bound to Port 49216 (Isolated!)
```

---

## Code Snippets and Demonstrations

### 1. Hardened Express Security Middleware Pipeline

Assembling Helmet, strict CORS allowlisting, and reverse proxy trust.

```js
// Node.js code
// filename: security-pipeline.mjs
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

export function createSecureExpressApp(config = {}) {
  const app = express();

  // 1. Configure Reverse Proxy Trust
  // In production behind 1 reverse proxy (e.g. Nginx or AWS ALB), trust 1 hop
  app.set('trust proxy', config.proxyHopCount || 1);

  // 2. Helmet Security Headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    frameguard: { action: 'deny' },
    noSniff: true
  }));

  // 3. Strict Dynamic CORS Configuration
  const allowedOrigins = new Set(config.allowedOrigins || [
    'https://app.example.com',
    'https://admin.example.com'
  ]);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow mobile apps / curl (origin is undefined) or allowlisted web origins
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS Policy Violation: Origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'Idempotency-Key'],
    credentials: true, // Allow cookies / authorization headers
    maxAge: 86400 // Cache preflight OPTIONS responses for 24 hours
  }));

  // 4. Strict Body Limits
  app.use(express.json({ limit: '50kb' }));

  return app;
}
```

---

### 2. High-Precision Sliding-Window Rate Limiter

Implementing rolling window rate limiting with RFC-compliant headers using an in-memory sorted map (or Redis).

```js
// Node.js code
// filename: sliding-window-limiter.mjs

export class InMemorySlidingWindowStore {
  constructor() {
    this.hits = new Map(); // key -> Array of timestamps
  }

  async recordHit(key, windowMs) {
    const now = Date.now();
    const threshold = now - windowMs;

    let timestamps = this.hits.get(key) || [];
    // Filter out expired timestamps (Sliding window eviction)
    timestamps = timestamps.filter(ts => ts > threshold);
    timestamps.push(now);
    this.hits.set(key, timestamps);

    return {
      count: timestamps.length,
      oldestTimestamp: timestamps[0]
    };
  }
}

/**
 * Express Middleware for Sliding-Window Rate Limiting.
 */
export function slidingWindowRateLimiter(options = {}) {
  const {
    windowMs = 60000, // 1 minute
    maxRequests = 100,
    store = new InMemorySlidingWindowStore()
  } = options;

  return async (req, res, next) => {
    // Key by authenticated user ID or real client IP
    const clientKey = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;

    try {
      const { count, oldestTimestamp } = await store.recordHit(clientKey, windowMs);
      const remaining = Math.max(0, maxRequests - count);
      const resetTimeSec = Math.ceil((oldestTimestamp + windowMs) / 1000);

      // Standard RFC RateLimit Headers
      res.setHeader('RateLimit-Limit', maxRequests);
      res.setHeader('RateLimit-Remaining', remaining);
      res.setHeader('RateLimit-Reset', resetTimeSec);

      if (count > maxRequests) {
        const retryAfterSec = Math.ceil((oldestTimestamp + windowMs - Date.now()) / 1000);
        res.setHeader('Retry-After', Math.max(1, retryAfterSec));

        return res.status(429).json({
          error: 'Too Many Requests',
          detail: `Rate limit of ${maxRequests} requests per minute exceeded. Please retry later.`
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
```

---

### 3. Deterministic HTTP Integration Test Suite with `node:test`

Validating security headers, CORS preflights, rate limiting, and business endpoints across a real HTTP network socket.

```js
// Node.js code
// filename: app-security.test.mjs
import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createSecureExpressApp } from './security-pipeline.mjs';
import { slidingWindowRateLimiter, InMemorySlidingWindowStore } from './sliding-window-limiter.mjs';

describe('Security Controls & HTTP Integration Tests', () => {
  let server;
  let baseUrl;
  const limiterStore = new InMemorySlidingWindowStore();

  before((done) => {
    const app = createSecureExpressApp({
      allowedOrigins: ['https://app.example.com'],
      proxyHopCount: 1
    });

    // Attach Rate Limiter (Max 2 requests per 5 seconds for fast testing)
    app.use(slidingWindowRateLimiter({
      windowMs: 5000,
      maxRequests: 2,
      store: limiterStore
    }));

    app.get('/api/resource', (req, res) => {
      res.json({ message: 'Secure payload', clientIp: req.ip });
    });

    // Centralized error handler for CORS rejections
    app.use((err, req, res, next) => {
      res.status(403).json({ error: err.message });
    });

    // Bind to port 0 (OS assigns ephemeral free port)
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      done();
    });
  });

  after((done) => {
    server.close(done);
  });

  it('enforces Helmet security headers on responses', async () => {
    const res = await fetch(`${baseUrl}/api/resource`);
    assert.equal(res.status, 200);

    // Verify critical headers
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.ok(res.headers.get('content-security-policy'));
  });

  it('handles CORS preflight OPTIONS request for allowlisted origin', async () => {
    const res = await fetch(`${baseUrl}/api/resource`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://app.example.com',
        'Access-Control-Request-Method': 'GET'
      }
    });

    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), 'https://app.example.com');
    assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
  });

  it('rejects CORS request from unauthorized origin', async () => {
    const res = await fetch(`${baseUrl}/api/resource`, {
      headers: {
        'Origin': 'https://malicious-website.com'
      }
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.error, /CORS Policy Violation/);
  });

  it('enforces sliding-window rate limiting with HTTP 429 and Retry-After', async () => {
    // Hit 1 -> 200 OK
    const res1 = await fetch(`${baseUrl}/api/resource`);
    assert.equal(res1.status, 200);
    assert.equal(res1.headers.get('ratelimit-remaining'), '1');

    // Hit 2 -> 200 OK
    const res2 = await fetch(`${baseUrl}/api/resource`);
    assert.equal(res2.status, 200);
    assert.equal(res2.headers.get('ratelimit-remaining'), '0');

    // Hit 3 -> 429 Too Many Requests
    const res3 = await fetch(`${baseUrl}/api/resource`);
    assert.equal(res3.status, 429);
    assert.ok(res3.headers.get('retry-after'));
    const body3 = await res3.json();
    assert.equal(body3.error, 'Too Many Requests');
  });
});
```

---

## Edge Cases and Tricky Scenarios

### 1. Rejecting CORS Preflight `OPTIONS` Requests with 401 Unauthorized

A common architectural bug occurs when developers place authentication middleware before CORS:
```js
// ❌ BROKEN: Auth placed before CORS!
app.use(authMiddleware);
app.use(cors());
```
- **The Problem**: Browsers issue preflight `OPTIONS` requests **without Authorization headers or cookies**. The authentication middleware rejects the `OPTIONS` request with a `401 Unauthorized`, breaking all cross-origin requests in web browsers.
- **The Rule**: Always register `cors()` **before** authentication middleware in your Express pipeline.

### 2. Leaking Server Technology via `X-Powered-By: Express`

By default, Express advertises its framework identity in an HTTP header:
```text
X-Powered-By: Express
```
- **The Risk**: Advertises server technology to automated vulnerability scanners, making it trivial for attackers to target known CVEs in specific Express versions.
- **The Fix**: `helmet()` removes this header automatically, or disable it manually via `app.disable('x-powered-by')`.

---

## Node.js, JavaScript, and Systems Connections

```text
┌──────────────────────────────────────────────────────────────┐
│ Operating System Network Stack                               │
│ - Ephemeral Port Binding (server.listen(0))                  │
│ - TCP Socket Handshake & Keep-Alive Recycling                │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Reverse Proxy & Ingress Layer                                │
│ - X-Forwarded-For Header Formatting                          │
│ - app.set('trust proxy', 1) evaluates client IP hops         │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Express Security Perimeter                                   │
│ - Helmet (Security headers injection)                        │
│ - CORS (Preflight OPTIONS negotiation)                       │
│ - Sliding Window Rate Limiting (Redis / Memory)              │
└──────────────────────────────────────────────────────────────┘
```

- **Operating System Ephemeral Ports**: Port `0` instructs the kernel to allocate an unused port from the dynamic range (`49152`–`65535`), allowing thousands of integration test suites to execute concurrently without port collisions.
- **Reverse Proxy Header Hops**: Understanding proxy architecture prevents IP spoofing attacks that would otherwise disable IP-based rate limiting.

---

## Hands-On Exercise

### Scenario
A healthcare records API has three critical security flaws:
1. `trust proxy` is set to `true`, allowing attackers to spoof `X-Forwarded-For: 127.0.0.1` and bypass rate limiting.
2. CORS dynamically echoes any incoming `Origin` with `credentials: true`, allowing malicious websites to steal medical records.
3. Test suites fail intermittently in CI because test files hardcode `app.listen(3001)`.

### Buggy Code

```js
// Node.js code
// filename: buggy-health-api.mjs
const express = require('express');
const app = express();

// ❌ BUG 1: Trust proxy is blindly set to true! Allows IP spoofing!
app.set('trust proxy', true);

// ❌ BUG 2: Vulnerable CORS reflection attack!
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const accessLog = new Map();

// Rate limiter vulnerable to IP spoofing
app.use((req, res, next) => {
  const ip = req.ip; // Attacker can spoof as 127.0.0.1
  const count = (accessLog.get(ip) || 0) + 1;
  accessLog.set(ip, count);
  if (count > 2) return res.status(429).send('Rate limited');
  next();
});

app.get('/patient-data', (req, res) => {
  res.json({ ssn: '123-45-6789', diagnosis: 'Sensitive Health Data' });
});

// ❌ BUG 3: Hardcoded port causes CI test collisions!
app.listen(3001);

module.exports = app;
```

### Acceptance Criteria
1. Decouple app factory from `listen()`, supporting ephemeral port testing (`listen(0)`).
2. Configure `trust proxy` to trust exactly 1 upstream hop (`app.set('trust proxy', 1)`).
3. Enforce strict CORS with an explicit origin allowlist, rejecting unapproved origins with HTTP 403.
4. Implement sliding-window rate limiting with standard RFC rate limit headers.
5. Provide a test suite using `node:test` proving that spoofed IPs are ignored, unauthorized origins are rejected, and rate limits trigger cleanly.

### Solution Code

```js
// Node.js code
// filename: solution-health-api.mjs
import express from 'express';
import cors from 'cors';
import { slidingWindowRateLimiter, InMemorySlidingWindowStore } from './sliding-window-limiter.mjs';

export function createHealthApp(config = {}) {
  const app = express();
  app.use(express.json());

  // ✅ FIX 1: Trust exactly 1 upstream proxy hop (e.g. AWS ALB)
  app.set('trust proxy', 1);

  // ✅ FIX 2: Strict CORS allowlist
  const allowedOrigins = new Set(['https://hospital-portal.example.com']);
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Disallowed CORS origin'));
    },
    credentials: true
  }));

  // ✅ FIX 3: Sliding window rate limiter
  const limiterStore = config.limiterStore || new InMemorySlidingWindowStore();
  app.use(slidingWindowRateLimiter({
    windowMs: 5000,
    maxRequests: config.maxRequests || 2,
    store: limiterStore
  }));

  app.get('/patient-data', (req, res) => {
    res.json({ ssn: '123-45-6789', diagnosis: 'Sensitive Health Data', clientIp: req.ip });
  });

  // Centralized CORS error handler
  app.use((err, req, res, next) => {
    if (err.message === 'Disallowed CORS origin') {
      return res.status(403).json({ error: 'Forbidden by CORS policy' });
    }
    res.status(500).json({ error: 'Internal Error' });
  });

  return app;
}
```

Accompanying test suite:
```js
// Node.js code
// filename: solution-health-api.test.mjs
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createHealthApp } from './solution-health-api.mjs';

describe('Healthcare API Security Verification Tests', () => {
  it('rejects unauthorized CORS origin with 403 and blocks IP spoofing', async () => {
    const app = createHealthApp();
    const server = http.createServer(app);
    // Bind to port 0 (Ephemeral port assigned by OS)
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      // 1. Unauthorized CORS Origin -> 403 Forbidden
      const corsRes = await fetch(`http://127.0.0.1:${port}/patient-data`, {
        headers: { 'Origin': 'https://attacker.evil.com' }
      });
      assert.equal(corsRes.status, 403);
      const corsBody = await corsRes.json();
      assert.equal(corsBody.error, 'Forbidden by CORS policy');

      // 2. Legitimate CORS Origin -> 200 OK
      const validRes = await fetch(`http://127.0.0.1:${port}/patient-data`, {
        headers: { 'Origin': 'https://hospital-portal.example.com' }
      });
      assert.equal(validRes.status, 200);

      // 3. Attempting to spoof IP via X-Forwarded-For
      // With trust proxy: 1, Express inspects the last hop from the socket, ignoring spoofed leftmost IP!
      const spoofRes = await fetch(`http://127.0.0.1:${port}/patient-data`, {
        headers: {
          'Origin': 'https://hospital-portal.example.com',
          'X-Forwarded-For': '1.1.1.1, 2.2.2.2'
        }
      });
      assert.equal(spoofRes.status, 200);
      const spoofBody = await spoofRes.json();
      // Verified that real socket IP (127.0.0.1) was used, not spoofed 1.1.1.1!
      assert.equal(spoofBody.clientIp, '2.2.2.2');
    } finally {
      server.close();
    }
  });
});
```

### Solution Explanation
1. **Decoupled Ephemeral Port**: Exporting `createHealthApp` allows test runners to bind to `server.listen(0)`, eliminating port collision bugs.
2. **CORS Allowlist**: Explicitly checking `allowedOrigins.has(origin)` eliminates the CORS reflection vulnerability.
3. **Controlled Proxy Trust**: Setting `trust proxy: 1` ensures Express only trusts the single proxy hop added by the load balancer, ignoring attacker-injected IP headers.

---

## Summary

- Harden Express transport security using Helmet headers: CSP, HSTS, X-Frame-Options, and X-Content-Type-Options (`nosniff`).
- CORS is a browser-side mechanism; never reflect incoming origins blindly alongside `credentials: true`. Always validate origins against an explicit allowlist.
- Always configure `app.set('trust proxy')` with specific hop counts or CIDR subnets to prevent IP spoofing attacks via `X-Forwarded-For`.
- Use Sliding-Window rate limiting with Redis sorted sets to eliminate boundary burst attacks, returning RFC-compliant headers (`RateLimit-Limit`, `RateLimit-Remaining`, `Retry-After`).
- Test HTTP applications using `createApp()` factories bound to OS ephemeral ports (`server.listen(0)`), ensuring parallel CI test isolation without mock drift.

---

## Cheat Sheet

| Security / Testing Concern | Implementation Pattern | Core Rule |
| :--- | :--- | :--- |
| **Security Headers** | `app.use(helmet())` | Protects browsers from XSS, Clickjacking, and MIME-sniffing |
| **Strict CORS** | `cors({ origin: allowlist, credentials: true })` | Never reflect `req.headers.origin` blindly |
| **Reverse Proxy Trust** | `app.set('trust proxy', 1)` | Never set `trust proxy: true`; configure exact hop count |
| **Rate Limiter** | Sliding window counter | Return HTTP 429 with `Retry-After` header |
| **Integration Testing**| `server.listen(0)` + native `fetch` | Run tests on ephemeral ports without collisions |
| **Server Fingerprint** | `app.disable('x-powered-by')` | Hide Express framework identity from scanners |

### Common Pitfalls
- **Placing auth middleware before CORS**: Causes preflight `OPTIONS` requests to fail with 401 Unauthorized.
- **Setting `trust proxy: true`**: Allows attackers to bypass rate limits by spoofing `X-Forwarded-For: 127.0.0.1`.
- **Reflecting `req.headers.origin` with credentials**: Enables arbitrary websites to read authenticated user data.
- **Hardcoding test ports (`app.listen(3000)`)**: Causes CI builds to fail during parallel test execution.

---

## Interview Questions

### 1. What is the difference between CORS and server-side Authentication, and why is CORS not a security boundary for protecting backend APIs?

**CORS (Cross-Origin Resource Sharing)** is strictly a **browser-enforced security mechanism**. Its sole purpose is to allow a browser sandbox running code from Origin A (`https://app.com`) to read responses returned by Origin B (`https://api.com`). When a cross-origin violation occurs, the browser makes the request, but refuses to pass the response data back to the JavaScript application.

CORS provides **zero security protection** against non-browser clients:
- Attackers using `curl`, Postman, Python scripts, or server-side microservices do not enforce CORS policies. They can invoke your API endpoints directly regardless of what CORS headers you configure.
- CORS does not authenticate the caller, does not encrypt the transport, and does not check user permissions.

**Authentication & Authorization**, by contrast, are **server-side security boundaries**. They verify caller credentials (tokens, signatures, sessions) and enforce access permissions before executing any business logic. An API must rely on authentication, authorization, and rate limiting to protect its data, treating CORS merely as a browser interoperability policy.

### 2. How does the "CORS Origin Reflection" vulnerability work, and what is the secure way to handle dynamic multiple origins in Express?

The **CORS Origin Reflection** vulnerability occurs when a backend developer attempts to support multiple origins by dynamically setting the `Access-Control-Allow-Origin` header to whatever string the client sent in the `Origin` request header, while enabling `credentials: true`:
```js
// Vulnerable:
res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
res.setHeader('Access-Control-Allow-Credentials', 'true');
```
While browsers forbid the wildcard (`*`) with credentials, reflecting the exact origin circumvents this browser restriction. An attacker can set up `https://evil-site.com`, lure an authenticated user to visit it, and issue an AJAX request to your API with `credentials: 'include'`. The server reflects `https://evil-site.com` as allowed. The browser permits the attacker's script to read the authenticated response, resulting in catastrophic cross-origin data theft.

**The Secure Pattern**:
Configure an explicit Set/Allowlist of approved origins. In the CORS origin validator callback, check if the incoming origin is present in the Set. If not present, pass an error to reject the preflight and refuse cross-origin headers:
```js
const allowlist = new Set(['https://app.example.com', 'https://admin.example.com']);
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowlist.has(origin)),
  credentials: true
}));
```

### 3. What is the security danger of configuring `app.set('trust proxy', true)` in Express when deployed behind a cloud load balancer?

When Express is deployed behind a reverse proxy (such as AWS ALB or Cloudflare), the client's IP address is forwarded in the `X-Forwarded-For` header.

The `X-Forwarded-For` header contains a comma-separated list of IP addresses:
```text
X-Forwarded-For: <client_ip>, <proxy_1>, <proxy_2>
```
If an attacker sends an HTTP request with a spoofed header:
```text
X-Forwarded-For: 127.0.0.1
```
The load balancer appends the attacker's real IP (`198.51.100.1`) to the end of the header:
```text
X-Forwarded-For: 127.0.0.1, 198.51.100.1
```
When `app.set('trust proxy', true)` is configured, Express blindly trusts **every** IP in the chain and picks the **leftmost** IP address as `req.ip`. The application believes the caller is `127.0.0.1`. The attacker can bypass IP allowlists, evade rate limiters by rotating fake IPs, or poison audit logs.

The secure configuration is setting `trust proxy` to the **exact number of trusted upstream proxy hops** (e.g. `app.set('trust proxy', 1)`). Express will count backward from the rightmost socket IP, selecting the first untrusted IP address and completely ignoring attacker-injected header entries.

### 4. How does the Sliding-Window Rate Limiter prevent the "Boundary Burst Flaw" of Fixed-Window limiters?

In a **Fixed-Window Rate Limiter**, time is partitioned into static blocks (e.g., 12:00:00 to 12:01:00) with a limit of 100 requests per block. A client can send 100 requests at 12:00:59, and another 100 requests at 12:01:01. Both batches are technically within their respective 1-minute windows, but the backend experiences a **burst of 200 requests within a 2-second interval**, easily causing server starvation.

The **Sliding-Window Rate Limiter** resolves this by maintaining a continuously moving rolling window:
1. It records each request timestamp in a Redis Sorted Set keyed by client IP/ID.
2. Upon each incoming request, it removes entries older than `(now - 60000ms)` using `ZREMRANGEBYSCORE`.
3. It counts remaining entries in the set using `ZCARD`.
4. If count exceeds the limit, it rejects the request with HTTP 429 and calculates `Retry-After` based on the timestamp of the oldest surviving entry.

Because the window slides continuously with current time, the system guarantees that at **no point in time** can a client exceed 100 requests across *any* contiguous 60-second window, completely eliminating boundary burst spikes.

---

<nav aria-label="Lecture navigation">

[← Previous: Authentication and Authorization Boundaries](day-19-authentication-and-authorization-boundaries.md) | [Roadmap](../node-roadmap.md) | [Next: MongoDB Driver Lifecycle and BSON](day-21-mongodb-driver-lifecycle-and-bson.md)

</nav>