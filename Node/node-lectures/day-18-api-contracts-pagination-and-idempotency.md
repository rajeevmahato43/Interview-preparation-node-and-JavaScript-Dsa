# Day 18: API Contracts, Pagination, and Idempotency

<nav aria-label="Lecture navigation">

[← Previous: Async Express and Centralized Errors](day-17-async-express-and-centralized-errors.md) | [Roadmap](../node-roadmap.md) | [Next: Authentication and Authorization Boundaries](day-19-authentication-and-authorization-boundaries.md)

</nav>

## Prerequisites

Before diving into API contracts and idempotency, review:
- [Day 09: Node HTTP Fundamentals](day-09-node-http-fundamentals.md) for HTTP method semantics and headers.
- [Day 15: Express Routing and Route Parameters](day-15-express-routing-and-route-parameters.md) for query parameter handling.
- [Day 16: Express Input Validation and Serialization](day-16-express-input-validation-and-serialization.md) for request validation and DTO response shaping.
- [Day 17: Async Express and Centralized Errors](day-17-async-express-and-centralized-errors.md) for centralized error envelopes.
---

## Core Concepts

### 1. Modern API Contract Design and Data Enveloping

> **API Contract**: The formal specification defining URI paths, HTTP methods, headers, schemas, status codes, and error formats for a service interface.

A production REST API should never return a bare JSON array as a top-level response (`[{ id: 1 }, { id: 2 }]`). 

Top-level arrays cannot be safely extended with metadata (pagination, counts, filtering flags) without breaking client parsing schemas. Always wrap list responses in a standardized **Data Envelope**:

```json
{
  "data": [
    { "id": "usr_100", "email": "alice@example.com" },
    { "id": "usr_101", "email": "bob@example.com" }
  ],
  "pagination": {
    "limit": 20,
    "hasMore": true,
    "nextCursor": "ZXlKaGJHY2lPaUpTVXpVeE5pSXNJblI1Y0NJNklrcFhWQ0o5",
    "totalCount": 1450
  },
  "meta": {
    "requestId": "req_88a91c2b",
    "serverTime": "2026-10-06T12:00:00.000Z"
  }
}
```

---

### 2. Offset Pagination vs Keyset / Cursor Pagination

> **Cursor Pagination**: A pagination pattern using an opaque, indexed pointer (such as `WHERE id > cursor LIMIT 20`) to resume reading at a specific position.

> **Offset Pagination**: A pagination pattern using `LIMIT count OFFSET skip` to bypass a fixed number of rows in a database query.

Pagination is an architectural database design decision, not merely an HTTP query formatting convention.

```text
Offset Pagination: OFFSET 100000 LIMIT 20
┌─────────────────────────────────────────────────────────────┐
│ Database reads and discards 100,000 index rows!            │
│ Disk I/O & CPU scale linearly O(N) with page depth!         │
└─────────────────────────────────────────────────────────────┘

Cursor Pagination: WHERE (created_at, id) < ('2026-10-01', 500) LIMIT 21
┌─────────────────────────────────────────────────────────────┐
│ B-Tree Index Seek directly to target row in O(log N) time!  │
│ Fetches exactly 21 rows regardless of total dataset size!   │
└─────────────────────────────────────────────────────────────┘
```

#### The Page Drift Problem
Consider a live social feed using offset pagination (`limit=10, offset=0`):
1. User loads Page 1 (`offset=0`): Receives posts 1 through 10.
2. While reading, 5 new posts are published to the database.
3. User scrolls to Page 2 (`offset=10`): The database skips the first 10 rows. Posts 6 through 10 have now slid down into positions 11 through 15!
4. **Result**: The user sees posts 6 through 10 a second time. If rows were deleted instead, the user would completely miss posts.

#### Comprehensive Pagination Tradeoff Matrix:

| Dimension | Offset Pagination (`?page=2&limit=20`) | Cursor Pagination (`?cursor=xyz&limit=20`) |
| :--- | :--- | :--- |
| **SQL Mechanism** | `OFFSET 20 LIMIT 20` | `WHERE (created_at, id) < ($ts, $id) LIMIT 20` |
| **Algorithmic Cost** | $O(N)$ — Degrades with page depth | $O(\log N)$ — B-Tree seek; constant performance |
| **Stability Under Writes**| **Poor** — Suffers from duplicate/skipped rows | **Immutable** — Perfectly stable windows |
| **Random Page Access** | **Supported** — Can jump directly to Page 45 | **Unsupported** — Forward/backward navigation only |
| **Index Dependency** | Simple single-column index | Strict composite index `(sort_col, id)` required |
| **Best Used For** | Small administrative tables, static data | Infinite scroll feeds, high-volume APIs, event logs |

---

### 3. Constructing Resilient Cursor Tokens

To prevent clients from coupling to internal database primary key schemas, cursors must be opaque, serialized strings:

```text
Database Tuple: { createdAt: 1718000000, id: 9542 }
                      │
                      ▼
JSON String: '{"t":1718000000,"i":9542}'
                      │
                      ▼
Base64URL Token: "eyJ0IjoxNzE4MDAwMDAwLCJpIjo5NTQyfQ"
```

#### The Tie-Breaker Rule:
Never paginate on non-unique columns (like `created_at` or `status`) alone. Multiple records can share the exact same millisecond timestamp. When `WHERE created_at < $cursor` executes, records with identical timestamps are arbitrarily skipped.
- **Rule**: Always construct a composite cursor pairing the primary sort key with a unique tie-breaker (e.g. `(created_at, id)`).

---

### 4. Idempotency Across HTTP Verbs

> **Idempotency**: The property of an operation where applying it multiple times produces the identical side-effect state as applying it once ($f(f(x)) = f(x)$).

Idempotency guarantees that executing an operation $N$ times leaves the system in the identical business state as executing it once:

```text
HTTP Verb Idempotency Matrix
┌─────────┬──────────────┬──────────────────┬──────────────────────────────────────┐
│ Method  │ Idempotent?  │ Safe (Read-Only)?│ Re-execution Behavior                │
├─────────┼──────────────┼──────────────────┼──────────────────────────────────────┤
│ GET     │ YES          │ YES              │ Returns identical state; no writes   │
│ HEAD    │ YES          │ YES              │ Returns headers only; no writes      │
│ PUT     │ YES          │ NO               │ Replaces full entity; state stable   │
│ DELETE  │ YES          │ NO               │ Deletes entity; repeated call is safe│
│ POST    │ NO           │ NO               │ Creates entity; retries duplicate!   │
│ PATCH   │ CONDITIONAL  │ NO               │ Idempotent if absolute set; not if inc│
└─────────┴──────────────┴──────────────────┴──────────────────────────────────────┘
```

- **`PUT /users/42`**: Idempotent. Sending `{ "name": "Alice" }` three times results in `user.name === "Alice"`.
- **`POST /charges`**: Non-idempotent. Sending `{ "amount": 100 }` three times charges the credit card three times ($300 total).
- **`PATCH /users/42`**: Idempotent if setting absolute fields (`{ "status": "active" }`); non-idempotent if applying delta increments (`{ "loginCount": "+1" }`).

---

### 5. The Idempotency Key State Machine (IETF Specification)

To make non-idempotent operations (`POST`, `PATCH`) safe against network retries, services implement the `Idempotency-Key` header:

```text
Client Request: POST /orders (Header: Idempotency-Key: "idemp_abc123")
                          │
                          ▼
             [Inspect Key in Cache / DB]
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
   [Key Not Found]  [Key IN_PROGRESS] [Key COMPLETED]
         │                │                │
         │                ▼                ▼
         │          HTTP 409 Conflict    Return CACHED
         │          (Retry-After: 2s)    Status & Body
         │                               (Instantaneous!)
         ▼
1. Acquire Distributed Lock (Key status = IN_PROGRESS)
2. Compute Payload Hash (SHA-256 of body)
3. Execute Business Logic (Database transaction)
4. Store Result: status = COMPLETED, statusCode, responseBody
5. Release Lock and return response to client
```

#### Payload Fingerprint Mismatch Guard:
If a client submits the same `Idempotency-Key` with a *different* request payload (e.g., changing `amount: 100` to `amount: 500`), the server must reject the request with **HTTP 422 Unprocessable Entity** (`Idempotency key payload mismatch`). This prevents malicious or buggy clients from using cached idempotency tokens to bypass validation.

---

## Code Snippets and Demonstrations

### 1. Enterprise Keyset / Cursor Pagination Engine

Implementing base64 cursor encoding, tie-breaker composite queries, and `hasMore` lookahead fetching.

```js
// Node.js code
// filename: cursor-pagination.mjs

export class CursorPagination {
  /**
   * Encodes a sort value and tie-breaker ID into an opaque Base64URL string.
   */
  static encodeCursor(sortValue, id) {
    const payload = JSON.stringify([sortValue, id]);
    return Buffer.from(payload, 'utf8').toString('base64url');
  }

  /**
   * Decodes an opaque cursor string into [sortValue, id].
   */
  static decodeCursor(cursorToken) {
    if (!cursorToken) return null;
    try {
      const decoded = Buffer.from(cursorToken, 'base64url').toString('utf8');
      const parsed = JSON.parse(decoded);
      if (Array.isArray(parsed) && parsed.length === 2) {
        return parsed;
      }
      return null;
    } catch {
      return null; // Malformed cursor
    }
  }

  /**
   * Paginates a dataset using keyset cursor semantics.
   * Fetches (limit + 1) items to compute `hasMore` without executing a separate COUNT(*) query.
   */
  static async paginateQuery(dataSource, options = {}) {
    const { cursor = null, limit = 20 } = options;
    const boundedLimit = Math.min(Math.max(1, limit), 100);

    const decoded = CursorPagination.decodeCursor(cursor);
    
    // Fetch limit + 1 records to check if a subsequent page exists
    const records = await dataSource.fetchItems({
      lastSortValue: decoded ? decoded[0] : null,
      lastId: decoded ? decoded[1] : null,
      fetchLimit: boundedLimit + 1
    });

    const hasMore = records.length > boundedLimit;
    const pageItems = hasMore ? records.slice(0, boundedLimit) : records;

    let nextCursor = null;
    if (hasMore && pageItems.length > 0) {
      const lastItem = pageItems[pageItems.length - 1];
      nextCursor = CursorPagination.encodeCursor(lastItem.createdAt, lastItem.id);
    }

    return {
      data: pageItems,
      pagination: {
        limit: boundedLimit,
        hasMore,
        nextCursor
      }
    };
  }
}
```

---

### 2. Enterprise Idempotency Middleware with SHA-256 Fingerprinting

Building a complete Redis/memory-backed idempotency filter that prevents double payments and catches payload tampering.

```js
// Node.js code
// filename: idempotency-middleware.mjs
import crypto from 'node:crypto';

export class IdempotencyStore {
  constructor() {
    this.storage = new Map(); // In production: Redis with TTL
  }

  async get(key) {
    return this.storage.get(key) || null;
  }

  async set(key, value, ttlSeconds = 86400) {
    this.storage.set(key, value);
    // Simulated TTL eviction
    setTimeout(() => this.storage.delete(key), ttlSeconds * 1000).unref();
  }
}

/**
 * Generates an SHA-256 hash of the request body and URL to detect payload tampering.
 */
function computeFingerprint(req) {
  const hash = crypto.createHash('sha256');
  hash.update(req.originalUrl || req.url);
  hash.update(JSON.stringify(req.body || {}));
  return hash.digest('hex');
}

export function idempotencyMiddleware(store) {
  return async (req, res, next) => {
    // Idempotency applies exclusively to write methods
    if (req.method !== 'POST' && req.method !== 'PATCH') {
      return next();
    }

    const idempotencyKey = req.headers['idempotency-key'];
    if (!idempotencyKey) {
      return next(); // Key is optional or enforce with 400 if strictly required
    }

    const currentFingerprint = computeFingerprint(req);
    const cachedRecord = await store.get(idempotencyKey);

    if (cachedRecord) {
      // 1. Check for payload tampering / key reuse mismatch
      if (cachedRecord.fingerprint !== currentFingerprint) {
        return res.status(422).json({
          error: 'Idempotency Key Conflict',
          detail: 'The provided Idempotency-Key was previously used with a different request payload.'
        });
      }

      // 2. Check if original operation is still in-flight
      if (cachedRecord.status === 'IN_PROGRESS') {
        res.setHeader('Retry-After', '2');
        return res.status(409).json({
          error: 'Operation In Progress',
          detail: 'A request with this Idempotency-Key is currently being processed. Please retry.'
        });
      }

      // 3. Return cached response instantaneously
      if (cachedRecord.status === 'COMPLETED') {
        res.setHeader('X-Cache-Lookup', 'IDEMPOTENT_HIT');
        for (const [header, val] of Object.entries(cachedRecord.headers)) {
          res.setHeader(header, val);
        }
        return res.status(cachedRecord.statusCode).json(cachedRecord.body);
      }
    }

    // 4. Mark key IN_PROGRESS (Distributed Lock)
    await store.set(idempotencyKey, {
      status: 'IN_PROGRESS',
      fingerprint: currentFingerprint,
      createdAt: Date.now()
    }, 60); // 60s lease

    // Intercept res.json to capture response body and status
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Restore standard method
      res.json = originalJson;

      // Only cache successful or intentional 4xx client responses
      if (res.statusCode < 500) {
        store.set(idempotencyKey, {
          status: 'COMPLETED',
          fingerprint: currentFingerprint,
          statusCode: res.statusCode,
          headers: { 'Content-Type': 'application/json' },
          body
        }, 86400); // Cache for 24 hours
      }

      return originalJson(body);
    };

    next();
  };
}
```

---

### 3. Integrated Application Assembly

Wiring cursor pagination and idempotency protection into an Express service.

```js
// Node.js code
// filename: payment-service-app.mjs
import express from 'express';
import { CursorPagination } from './cursor-pagination.mjs';
import { IdempotencyStore, idempotencyMiddleware } from './idempotency-middleware.mjs';

export function createPaymentApp() {
  const app = express();
  app.use(express.json());

  const idempotencyStore = new IdempotencyStore();
  app.use(idempotencyMiddleware(idempotencyStore));

  // In-memory mock database
  const ordersDb = [];

  // GET /api/orders (Cursor paginated)
  app.get('/api/orders', async (req, res) => {
    const { cursor, limit } = req.query;

    const dataSource = {
      fetchItems: async ({ lastSortValue, lastId, fetchLimit }) => {
        let filtered = [...ordersDb];
        // Sort descending by (createdAt, id)
        filtered.sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id));

        if (lastSortValue && lastId) {
          filtered = filtered.filter(item => {
            if (item.createdAt < lastSortValue) return true;
            if (item.createdAt === lastSortValue && item.id < lastId) return true;
            return false;
          });
        }
        return filtered.slice(0, fetchLimit);
      }
    };

    const paginatedResponse = await CursorPagination.paginateQuery(dataSource, {
      cursor,
      limit: Number(limit) || 10
    });

    res.json(paginatedResponse);
  });

  // POST /api/orders (Idempotent write)
  app.post('/api/orders', async (req, res) => {
    const { amount, currency } = req.body || {};

    if (!amount || amount <= 0) {
      return res.status(422).json({ error: 'Amount must be greater than zero' });
    }

    const newOrder = {
      id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      amount,
      currency: currency || 'USD',
      status: 'processed',
      createdAt: Date.now()
    };

    ordersDb.push(newOrder);
    res.status(201).json({ data: newOrder });
  });

  return app;
}
```

---

## Edge Cases and Tricky Scenarios

### 1. In-Flight Race Conditions on Idempotency Keys

What happens when two identical HTTP requests with the exact same `Idempotency-Key` hit two separate server instances simultaneously (within 2 milliseconds of each other)?
- **The Risk**: Both servers query the cache, see that the key does not exist yet, and both execute the payment transaction in parallel, causing double charges.
- **The Defense**: Use atomic test-and-set operations (such as Redis `SET key value NX EX 60` or Postgres `INSERT ... ON CONFLICT DO NOTHING`). If the atomic insert fails, the second request knows it lost the race, marks the request `IN_PROGRESS`, and returns **HTTP 409 Conflict** with a `Retry-After: 2` header.

### 2. Tampered Cursors and SQL Injection Risks

If an API accepts user-supplied cursor strings (`?cursor=eyJ...`), decoding the token directly without type validation can expose the database query to injection or malformed input errors:
- **The Fix**: Validate the decoded cursor tuple with strict schema validation (e.g. `z.tuple([z.number(), z.string()])`) before injecting values into SQL parameterized queries.

---

## Node.js, JavaScript, and Systems Connections

```text
┌──────────────────────────────────────────────────────────────┐
│ V8 Buffer & Base64URL Encoding                               │
│ - Buffer.from(json).toString('base64url')                    │
│ - Compact opaque URL-safe serialization                      │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Database Index Execution Engine                              │
│ - Offset Pagination: Scans & drops N rows in B-Tree (Slow)   │
│ - Keyset Pagination: Direct seek on (created_at, id) index   │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Distributed State Management                                 │
│ - Redis SETNX atomic locking for in-flight requests          │
│ - Cryptographic SHA-256 Request Fingerprinting               │
└──────────────────────────────────────────────────────────────┘
```

- **Base64URL vs Standard Base64**: Using `base64url` avoids URL-reserved characters (`+`, `/`, `=`), preventing corrupt query parameters in HTTP GET strings.
- **B-Tree Composite Indexing**: Keyset pagination requires a database index covering `(sort_column DESC, id DESC)` to achieve true $O(\log N)$ seeks without filesorts.

---

## Hands-On Exercise

### Scenario
A subscription billing API processes credit card charges. Due to intermittent mobile network timeouts, client apps retry charge requests. In production:
1. Retrying `POST /charges` charges customers multiple times because the server lacks idempotency deduplication.
2. An attacker reuses an existing `Idempotency-Key` with a higher payment amount, receiving a confirmation without paying.
3. The transaction history endpoint uses offset pagination (`OFFSET N`), causing users to skip transactions when new payments settle concurrently.

### Buggy Code

```js
// Node.js code
// filename: buggy-billing-api.mjs
const express = require('express');
const app = express();
app.use(express.json());

const db = {
  charges: [],
  idempotencyLog: new Map()
};

// ❌ BUG 1 & 2: Naive idempotency allows payload tampering and does not lock in-flight requests!
app.post('/charges', async (req, res) => {
  const key = req.headers['idempotency-key'];
  
  if (key && db.idempotencyLog.has(key)) {
    // Blindly returns cached response without checking if payload matches!
    return res.json(db.idempotencyLog.get(key));
  }

  // Simulate payment processing
  const charge = {
    id: `ch_${Date.now()}`,
    amount: req.body.amount,
    status: 'succeeded',
    createdAt: Date.now()
  };

  db.charges.push(charge);

  if (key) {
    db.idempotencyLog.set(key, charge);
  }

  res.status(201).json(charge);
});

// ❌ BUG 3: Offset pagination suffers from page drift and O(N) degradation!
app.get('/charges', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Drifts when new charges are inserted!
  const results = db.charges.slice(offset, offset + limit);
  res.json({ page, results });
});

module.exports = app;
```

### Acceptance Criteria
1. Implement the `idempotencyMiddleware` with SHA-256 payload fingerprinting and in-flight request locking.
2. If an `Idempotency-Key` is reused with a modified amount, reject with HTTP 422.
3. Replace offset pagination with composite keyset cursor pagination (`(createdAt, id)`).
4. Provide a test suite using `node:test` verifying that duplicate requests return cached results, tampered requests return 422, and cursor pagination maintains stable windows.

### Solution Code

```js
// Node.js code
// filename: solution-billing-api.mjs
import express from 'express';
import crypto from 'node:crypto';
import { CursorPagination } from './cursor-pagination.mjs';

export function createFixedBillingApp() {
  const app = express();
  app.use(express.json());

  const db = {
    charges: [],
    idempotencyStore: new Map()
  };

  // 1. Idempotency Middleware
  app.use(async (req, res, next) => {
    if (req.method !== 'POST') return next();

    const key = req.headers['idempotency-key'];
    if (!key) return next();

    const hash = crypto.createHash('sha256')
      .update(req.originalUrl)
      .update(JSON.stringify(req.body || {}))
      .digest('hex');

    const existing = db.idempotencyStore.get(key);

    if (existing) {
      // Check fingerprint
      if (existing.fingerprint !== hash) {
        return res.status(422).json({
          error: 'Idempotency Mismatch',
          detail: 'Idempotency key previously used with different payload'
        });
      }

      // Check in-flight lock
      if (existing.status === 'IN_PROGRESS') {
        res.setHeader('Retry-After', '1');
        return res.status(409).json({ error: 'Concurrent request in progress' });
      }

      // Return cached
      return res.status(existing.statusCode).json(existing.body);
    }

    // Lock key
    db.idempotencyStore.set(key, { status: 'IN_PROGRESS', fingerprint: hash });

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      res.json = originalJson;
      db.idempotencyStore.set(key, {
        status: 'COMPLETED',
        fingerprint: hash,
        statusCode: res.statusCode,
        body
      });
      return originalJson(body);
    };

    next();
  });

  // 2. Cursor Paginated GET /charges
  app.get('/charges', async (req, res) => {
    const { cursor, limit } = req.query;

    const dataSource = {
      fetchItems: async ({ lastSortValue, lastId, fetchLimit }) => {
        let sorted = [...db.charges].sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id));

        if (lastSortValue && lastId) {
          sorted = sorted.filter(c => {
            if (c.createdAt < lastSortValue) return true;
            if (c.createdAt === lastSortValue && c.id < lastId) return true;
            return false;
          });
        }
        return sorted.slice(0, fetchLimit);
      }
    };

    const result = await CursorPagination.paginateQuery(dataSource, {
      cursor,
      limit: Number(limit) || 10
    });

    res.json(result);
  });

  // 3. POST /charges
  app.post('/charges', (req, res) => {
    const { amount } = req.body || {};
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const charge = {
      id: `ch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      amount,
      createdAt: Date.now()
    };

    db.charges.push(charge);
    res.status(201).json({ data: charge });
  });

  return app;
}
```

Accompanying test suite:
```js
// Node.js code
// filename: solution-billing-api.test.mjs
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createFixedBillingApp } from './solution-billing-api.mjs';

describe('API Contracts, Idempotency, and Pagination Tests', () => {
  it('deduplicates identical POSTs and rejects payload tampering with 422', async () => {
    const app = createFixedBillingApp();
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const idempKey = 'key_unique_123';

      // 1. First POST
      const res1 = await fetch(`http://127.0.0.1:${port}/charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempKey },
        body: JSON.stringify({ amount: 50 })
      });
      assert.equal(res1.status, 201);
      const body1 = await res1.json();

      // 2. Exact Duplicate POST (Simulating retry)
      const res2 = await fetch(`http://127.0.0.1:${port}/charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempKey },
        body: JSON.stringify({ amount: 50 })
      });
      assert.equal(res2.status, 201);
      const body2 = await res2.json();
      assert.deepEqual(body1, body2); // Returns identical cached charge!

      // 3. Tampered POST with different amount
      const res3 = await fetch(`http://127.0.0.1:${port}/charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempKey },
        body: JSON.stringify({ amount: 100 }) // Modified payload!
      });
      assert.equal(res3.status, 422);
      const body3 = await res3.json();
      assert.equal(body3.error, 'Idempotency Mismatch');
    } finally {
      server.close();
    }
  });

  it('performs stable cursor pagination across records', async () => {
    const app = createFixedBillingApp();
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      // Seed 3 charges
      for (let i = 1; i <= 3; i++) {
        await fetch(`http://127.0.0.1:${port}/charges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: i * 10 })
        });
        await new Promise(r => setTimeout(r, 10)); // Ensure distinct timestamps
      }

      // Page 1 with limit=2
      const page1Res = await fetch(`http://127.0.0.1:${port}/charges?limit=2`);
      assert.equal(page1Res.status, 200);
      const page1 = await page1Res.json();
      assert.equal(page1.data.length, 2);
      assert.equal(page1.pagination.hasMore, true);
      assert.ok(page1.pagination.nextCursor);

      // Page 2 using nextCursor
      const page2Res = await fetch(`http://127.0.0.1:${port}/charges?limit=2&cursor=${page1.pagination.nextCursor}`);
      assert.equal(page2Res.status, 200);
      const page2 = await page2Res.json();
      assert.equal(page2.data.length, 1);
      assert.equal(page2.pagination.hasMore, false);
    } finally {
      server.close();
    }
  });
});
```

### Solution Explanation
1. **Cryptographic Fingerprinting**: SHA-256 hashes of the request body and URL detect payload tampering, rejecting mismatched key reuse with HTTP 422.
2. **In-Flight Locking**: Recording `status: 'IN_PROGRESS'` prevents concurrent duplicate requests from running parallel database transactions.
3. **Keyset Cursor Paging**: Using `(createdAt, id)` as composite sort keys guarantees $O(\log N)$ seeks and eliminates page drift bugs across dynamic data streams.

---

## Summary

- Wrap REST list responses in a standardized JSON Data Envelope (`{ data, pagination, meta }`) rather than bare arrays.
- Offset pagination suffers from $O(N)$ index degradation and Page Drift. Keyset/Cursor pagination provides constant $O(\log N)$ index seeks and stable windows.
- Always include a unique tie-breaker (such as the primary key `id`) in cursor sort tuples to handle identical timestamp collisions.
- HTTP `GET`, `PUT`, and `DELETE` are naturally idempotent. `POST` and `PATCH` require application-level idempotency layers to prevent duplicate writes on network retries.
- The `Idempotency-Key` state machine tracks requests from `IN_PROGRESS` to `COMPLETED`, guarding against payload tampering via SHA-256 request fingerprinting.

---

## Cheat Sheet

| Pagination / Idempotency Pattern | Implementation Rule | Primary Benefit |
| :--- | :--- | :--- |
| **Data Envelopes** | `{ data: [...], pagination: {...} }` | Extensible API responses without breaking client schemas |
| **Keyset Cursor** | `WHERE (sort_col, id) < ($val, $id)` | $O(\log N)$ performance and zero page drift |
| **Lookahead Paging** | Query `LIMIT count + 1` | Computes `hasMore` without expensive `COUNT(*)` queries |
| **Opaque Cursor** | `Buffer.from(tuple).toString('base64url')` | URL-safe token that hides database column names |
| **Idempotency Key** | Header: `Idempotency-Key` | Safe retries for non-idempotent `POST` writes |
| **Fingerprint Guard** | SHA-256 hash of URL + Body | Rejects payload tampering with HTTP 422 |

### Common Pitfalls
- **Using `OFFSET 100000` on large tables**: Reads and discards 100,000 rows, freezing the database thread.
- **Paginating by non-unique timestamps**: Skips rows that share the same millisecond timestamp.
- **Blindly returning cached idempotency responses**: Returns stale data if the client changed the payload.
- **Missing distributed lock on idempotency keys**: Allows duplicate requests arriving within milliseconds to execute concurrently.

---

## Interview Questions

### 1. What is the "Deep Page Problem" in Offset Pagination, and how does Keyset (Cursor) Pagination resolve it at the database index level?

In **Offset Pagination**, a query such as `SELECT * FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 100000` instructs the database storage engine to read through the B-Tree index, load 100,020 rows from disk, and then discard the first 100,000 rows, returning only the final 20. As the offset $N$ grows larger, query latency and disk I/O degrade linearly ($O(N)$). For deep pages, this causes heavy buffer cache evictions, CPU exhaustion, and queries taking multiple seconds to complete.

**Keyset (Cursor) Pagination** resolves this by transforming the query into a direct range predicate:
```sql
SELECT * FROM orders 
WHERE (created_at, id) < ($last_created_at, $last_id) 
ORDER BY created_at DESC, id DESC 
LIMIT 20;
```
Because the database has a composite B-Tree index on `(created_at, id)`, the query engine performs a binary index seek directly to the exact index leaf page corresponding to the cursor tuple in $O(\log N)$ time, and then scans forward exactly 20 index entries. The database never reads or discards previous rows, guaranteeing identical single-digit millisecond query latency regardless of whether you are reading page 1 or page 50,000.

### 2. What is the Page Drift (Sliding Window) problem, and how does it impact user experience in real-time applications?

> **Page Drift (Window Bug)**: A phenomenon where items shift positions across pages during offset pagination due to concurrent row inserts or deletions.

The **Page Drift Problem** occurs in offset pagination when data rows are added or deleted while a client is actively paginating through a dataset.

Because offset pagination relies on fixed numerical positions (`OFFSET (page - 1) * limit`), any modification to preceding rows shifts the entire collection:
1. **Insertions (Duplicate Rows)**: If a user is viewing Page 1 (`offset=0`, rows 1–10) and 3 new items are inserted at the top of the collection, all existing items slide down by 3 positions. When the user loads Page 2 (`offset=10`), rows 8, 9, and 10—which were previously on Page 1—now occupy positions 11, 12, and 13. The user sees duplicate items on their screen.
2. **Deletions (Skipped Rows)**: If 3 items are deleted from Page 1, items from Page 2 shift upward. When the user requests Page 2, they completely miss the items that shifted into Page 1.

Cursor pagination eliminates page drift entirely because the cursor acts as an anchor attached to a specific entity rather than an arbitrary numerical index. Even if thousands of new rows are inserted at the top of the collection, the query `WHERE id < $cursor` continues fetching strictly from the anchored position downward.

### 3. Walk through the complete lifecycle of a request using an `Idempotency-Key` header, including race conditions and payload validation.

An enterprise idempotency lifecycle follows an atomic state machine:

1. **Header Extraction**: The server inspects incoming `POST` or `PATCH` requests for the `Idempotency-Key` header. If absent, the request proceeds normally.
2. **Payload Fingerprinting**: The server computes a SHA-256 cryptographic hash of the request URL and body.
3. **Atomic Cache Lookup & Lock**: The server performs an atomic check against a persistent store (e.g. Redis `SET key value NX EX 60`):
   - **Scenario A (Completed)**: If a record exists with `status: 'COMPLETED'`, the server compares the stored fingerprint with the current fingerprint. If they match, the server returns the cached status code and response payload immediately. If they differ, it returns **HTTP 422 Unprocessable Entity** (payload conflict).
   - **Scenario B (In-Progress)**: If a record exists with `status: 'IN_PROGRESS'`, another concurrent request is currently processing this transaction. The server immediately returns **HTTP 409 Conflict** with a `Retry-After: 2` header, preventing duplicate concurrent writes.
   - **Scenario C (New Request)**: If the key does not exist, the server atomically creates a record with `status: 'IN_PROGRESS'` and the payload fingerprint.
4. **Business Execution**: The application executes the domain transaction (e.g. charging a payment card and persisting the database order).
5. **Response Storage**: Upon successful transaction completion, the server updates the key state to `COMPLETED`, storing the HTTP status code, response headers, and response body with an expiration TTL (e.g. 24 hours), and flushes the response to the client.

### 4. Why is `DELETE /users/42` considered an idempotent HTTP method even if subsequent requests return HTTP 404?

Idempotency in the HTTP specification (RFC 9110) is defined in terms of **server-side side-effect state**, not identical HTTP response status codes:

$$\text{State}(f(x)) = \text{State}(f(f(x)))$$

When a client issues `DELETE /users/42`:
- The first request deletes user 42 from the database and returns HTTP 200 OK or HTTP 204 No Content. The resultant state of the system is: *"User 42 does not exist."*
- If the client repeats the request (`DELETE /users/42`), the server finds no record and returns HTTP 404 Not Found.
- The resultant state of the system after the second request is still: *"User 42 does not exist."*

Because the second request made **zero additional modifications to the server's resource state** (no other records were altered or deleted), the operation is strictly idempotent. The difference in response status (204 vs 404) reflects the server's perception of the action, but the server's underlying state was unchanged by the subsequent invocation.

---

<nav aria-label="Lecture navigation">

[← Previous: Async Express and Centralized Errors](day-17-async-express-and-centralized-errors.md) | [Roadmap](../node-roadmap.md) | [Next: Authentication and Authorization Boundaries](day-19-authentication-and-authorization-boundaries.md)

</nav>