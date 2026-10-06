# Day 17: Async Express and Centralized Errors

<nav aria-label="Lecture navigation">

[← Previous: Express Input Validation and Serialization](day-16-express-input-validation-and-serialization.md) | [Roadmap](../node-roadmap.md) | [Next: API Contracts, Pagination, and Idempotency](day-18-api-contracts-pagination-and-idempotency.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Deconstruct the asynchronous error-handling mechanics between Express 4 (synchronous router, unhandled promise rejections) and Express 5 (native async promise interception).
- Architect an enterprise Domain Error Class Hierarchy that encapsulates HTTP status codes, operational flags, and error codes.
- Distinguish **Operational Errors** (predictable runtime failures) from **Programmer Errors** (bugs requiring process restart) to prevent server state corruption.
- Implement a centralized 4-argument Express error middleware adhering to the **RFC 7807 Problem Details** standard with automatic production stack trace redaction.
- Translate low-level database and third-party driver errors (PostgreSQL constraint `23505`, MongoDB `E11000`, JWT `TokenExpiredError`) into clean public API responses.
- Prevent unhandled rejections and streaming memory leaks when client connections disconnect (`req.on('close')`) mid-operation.

---

## Prerequisites

Before diving into async error handling, review:
- [Day 02: Event Loop and Scheduling](day-02-event-loop-and-scheduling.md) for microtask queue drains and `unhandledRejection` lifecycle.
- [Day 04: Process, Configuration, and Lifecycle](day-04-process-configuration-and-lifecycle.md) for `uncaughtException` and graceful process exit.
- [Day 13: Express Application Structure](day-13-express-application-structure.md) for 4-layer architecture and error propagation.
- [Day 14: Express Middleware and Request Flow](day-14-express-middleware-and-request-flow.md) for function arity (`fn.length === 4`) error routing.

---

## Quick Vocabulary Card

| Term | Programming Definition | Anti-Pattern / Misconception |
| :--- | :--- | :--- |
| **Operational Error** | A known, predictable runtime failure mode that does not indicate a software bug (e.g., validation failure, 404 not found, expired token, network timeout). | Treating all errors as generic 500 bugs and restarting the Node.js process upon client validation errors. |
| **Programmer Error** | An unhandled software defect or bug in application code (e.g., `TypeError`, `ReferenceError`, calling methods on `undefined`). | Swallowing programmer errors with a generic `catch {}` block and attempting to continue execution in an unpredictable state. |
| **RFC 7807 Problem Details**| A standardized JSON specification (`application/problem+json`) defining machine-readable error responses (`type`, `title`, `status`, `detail`, `instance`). | Returning inconsistent error payload shapes (e.g., `{ msg: 'error' }` on route A, `{ error: 'failed' }` on route B, `{ message: 'err' }` on route C). |
| **`isOperational` Flag** | A boolean property attached to custom `AppError` instances denoting that the failure was anticipated and can be safely resolved with an HTTP response. | Relying on error string matching (`err.message.includes('not found')`) to determine HTTP status codes. |
| **`res.headersSent`** | A native boolean property indicating whether HTTP response headers have already been committed to the underlying network socket. | Attempting to call `res.status(500).json(...)` in error middleware after a stream has already begun flushing bytes to the client. |
| **Driver Error Translation**| The process of mapping proprietary database errors (e.g. Postgres error code `23505`) into domain errors (`ConflictError`) at the persistence boundary. | Letting raw database error objects escape directly to clients, leaking database table names and column constraints. |

---

## Core Concepts

### 1. The Asynchronous Error Gap: Express 4 vs Express 5

Understanding why Express handles synchronous and asynchronous errors differently requires inspecting how the router executes:

```text
Express 4 Routing Dispatcher:
try {
  layer.handle_request(req, res, next); // Calls async function!
} catch (err) {
  next(err); // ⚠️ ONLY catches SYNCHRONOUS errors!
}
```

When an `async` function executes, it immediately returns a Promise to the caller. Any exception thrown inside the async function (or any rejected `await` expression) is enqueued on the **V8 Microtask Queue**. By the time the microtask rejects, the synchronous `try/catch` block in Express 4 has already exited!

```text
[Sync Stack: layer.handle_request] ──► Returns Promise ──► try/catch exits cleanly!
               │
               ▼ (Next Microtask Tick)
[Microtask Queue: await db.query()] ──► Promise Rejection!
               │
               ▼
[Express Router: MISSES IT!] ──► Emits process 'unhandledRejection'!
                                 Process terminates in modern Node.js!
```

#### Express 5 Modernization
Express 5 wraps all middleware and route handler invocations in a promise check:
```js
// Express 5 internal handler dispatch:
const result = layer.handle_request(req, res, next);
if (result && typeof result.then === 'function') {
  result.catch(next); // Native promise rejection catching!
}
```
Until your infrastructure runs Express 5 natively, all asynchronous route handlers in Express 4 **must** be wrapped in an `asyncHandler` or use monkey-patching libraries like `express-async-errors`.

---

### 2. Operational Errors vs Programmer Errors

A production backend must maintain a clear distinction between **Operational Errors** and **Programmer Errors**:

```text
                      Error Occurs in Application
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
[Operational Error (isOperational: true)]           [Programmer Error (isOperational: false)]
- Invalid client input (422)                        - TypeError: Cannot read property of undefined
- Resource does not exist (404)                     - ReferenceError: dbClient is not defined
- Expired JWT token (401)                           - Logic error: Array index out of bounds
- Upstream network timeout (504)                    - Memory corruption / State leak
         │                                                   │
         ▼                                                   ▼
- Safe to handle and continue                       - Process is in an UNPREDICTABLE state!
- Format RFC 7807 response                          - Log full stack trace with alert
- Server process remains alive                      - Return generic 500 Internal Error
                                                    - Gracefully RESTART container!
```

| Dimension | Operational Error | Programmer Error |
| :--- | :--- | :--- |
| **Origin** | External client behavior, network, environment | Software bugs, developer mistakes, unhandled edge cases |
| **Predictability** | Expected and designed for | Unexpected and unhandled |
| **`isOperational`**| `true` | `false` (or `undefined` on native `Error`) |
| **HTTP Status** | 4xx or specific 5xx (502, 503, 504) | 500 Internal Server Error |
| **Recovery** | Respond with structured error; keep process alive | Return generic 500; initiate graceful container restart |

---

### 3. Enterprise Domain Error Hierarchy

Hardcoding status codes inside route controllers leads to inconsistent status mappings and fragile testing.

Implement a dedicated error hierarchy rooted in an abstract `AppError`:

```text
Error (Native JavaScript)
  └── AppError (isOperational = true, statusCode, code, details)
        ├── ValidationError (422)
        ├── UnauthorizedError (401)
        ├── ForbiddenError (403)
        ├── NotFoundError (404)
        ├── ConflictError (409)
        ├── RateLimitError (429)
        └── BadGatewayError (502)
```

Each subclass encapsulates its corresponding HTTP status code, machine-readable string code, and default user-facing message, keeping controllers clean and expressive:
```js
// In Domain Service:
if (!user) throw new NotFoundError(`User "${id}" does not exist`);
if (user.isLocked) throw new ForbiddenError('Account is suspended');
```

---

### 4. RFC 7807 Problem Details Standard

RFC 7807 defines a standardized HTTP error payload schema (`application/problem+json`), providing a predictable contract for frontend and mobile API clients:

```json
{
  "type": "https://api.example.com/errors/validation-failed",
  "title": "Validation Failed",
  "status": 422,
  "detail": "The request body failed 2 validation rules.",
  "instance": "/api/v1/users",
  "code": "VALIDATION_ERROR",
  "invalidParams": [
    { "name": "email", "reason": "Must be a valid email address" },
    { "name": "age", "reason": "Must be greater than or equal to 18" }
  ],
  "correlationId": "8f8a1e20-3b42-4f71-a79b-2c67d7a8d56b"
}
```

#### Production Security Rules:
1. **Never Expose Internal Stack Traces in Production**: Only include `err.stack` when `process.env.NODE_ENV !== 'production'`.
2. **Never Expose Raw Database Errors**: Sanitize internal SQL query strings, database constraint names, and file paths.

---

### 5. Third-Party Driver Error Translation

Database drivers and third-party SDKs throw proprietary error objects that should never leak beyond the repository boundary:

```text
Database Driver Error                                  Domain Error
┌─────────────────────────────────┐                    ┌───────────────────────────────┐
│ Postgres Driver Error           │                    │ ConflictError                 │
│ code: "23505"                   │ ──(Translation)──► │ statusCode: 409               │
│ detail: "Key (email) exists"    │                    │ message: "Email already exists"│
└─────────────────────────────────┘                    └───────────────────────────────┘
┌─────────────────────────────────┐                    ┌───────────────────────────────┐
│ JWT Verification Error          │                    │ UnauthorizedError             │
│ name: "TokenExpiredError"       │ ──(Translation)──► │ statusCode: 401               │
│ expiredAt: 1718000000           │                    │ message: "Session expired"    │
└─────────────────────────────────┘                    └───────────────────────────────┘
```

By mapping low-level driver codes at the repository or centralized error middleware layer, the public API remains completely decoupled from the underlying database engine.

---

## Code Snippets and Demonstrations

### 1. The Enterprise Domain Error Hierarchy

Implementing a robust base error class and specialized operational error subclasses.

```js
// Node.js code
// filename: domain-errors.mjs

/**
 * Base Application Error representing an operational, handled failure.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Denotes predictable runtime error

    // Capture clean stack trace omitting constructor
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details = null) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', details = null) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden', details = null) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details = null) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', invalidParams = []) {
    super(message, 422, 'VALIDATION_FAILED', invalidParams);
  }
}
```

---

### 2. Universal `asyncHandler` with Streaming and Cancellation Safeguards

Building an asynchronous handler wrapper that protects against client disconnection and streaming header errors.

```js
// Node.js code
// filename: async-handler.mjs

/**
 * Wraps an async route handler to intercept rejected promises,
 * safely route errors to next(err), and respect client disconnects.
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    // Check if client disconnected before execution starts
    if (req.destroyed) {
      console.warn(`[asyncHandler] Client aborted connection before handler execution: ${req.originalUrl}`);
      return;
    }

    Promise.resolve(fn(req, res, next)).catch((err) => {
      // If headers were already committed to the socket stream, delegate to Express native handler
      if (res.headersSent) {
        return next(err);
      }

      // If client closed socket during processing, suppress writing response
      if (req.destroyed) {
        console.warn(`[asyncHandler] Client aborted connection during async processing: ${req.originalUrl}`);
        return;
      }

      next(err);
    });
  };
}
```

---

### 3. RFC 7807 Centralized Error Middleware with Driver Translation

Implementing the production 4-argument error middleware with database error mapping and security redaction.

```js
// Node.js code
// filename: centralized-error-middleware.mjs
import { AppError, ConflictError, UnauthorizedError } from './domain-errors.mjs';

/**
 * Translates low-level database and third-party driver errors into domain errors.
 */
function translateDriverErrors(err) {
  // PostgreSQL: 23505 Unique Violation
  if (err && err.code === '23505') {
    return new ConflictError('A record with this identifier already exists');
  }

  // MongoDB: 11000 Duplicate Key Error
  if (err && err.code === 11000) {
    return new ConflictError('Duplicate key error in database persistence');
  }

  // JWT Errors
  if (err && err.name === 'TokenExpiredError') {
    return new UnauthorizedError('Authentication token has expired');
  }
  if (err && err.name === 'JsonWebTokenError') {
    return new UnauthorizedError('Invalid authentication token signature');
  }

  return err;
}

/**
 * Centralized 4-argument Express Error Handling Middleware.
 */
export function createErrorHandler(logger = console) {
  return (err, req, res, next) => {
    // 1. If headers have already been sent to client, delegate to native Express handler
    if (res.headersSent) {
      return next(err);
    }

    // 2. Translate third-party / DB driver errors
    const normalizedErr = translateDriverErrors(err);

    // 3. Determine if operational error or programmer bug
    const isOperational = normalizedErr instanceof AppError && normalizedErr.isOperational;
    const statusCode = isOperational ? normalizedErr.statusCode : 500;
    const errorCode = isOperational ? normalizedErr.code : 'INTERNAL_SERVER_ERROR';
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || 'unknown';

    // 4. Log unexpected programmer bugs (5xx) with full stack trace
    if (!isOperational || statusCode >= 500) {
      logger.error(`[UNHANDLED_ERROR] [${correlationId}] ${err.message}`, {
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        body: req.body
      });
    } else {
      logger.warn(`[OPERATIONAL_ERROR] [${correlationId}] ${normalizedErr.message}`, {
        code: errorCode,
        status: statusCode
      });
    }

    // 5. Construct RFC 7807 Problem Details Response
    const isProduction = process.env.NODE_ENV === 'production';
    const problemDetails = {
      type: `https://api.example.com/errors/${errorCode.toLowerCase().replace(/_/g, '-')}`,
      title: isOperational ? normalizedErr.name : 'Internal Server Error',
      status: statusCode,
      detail: isOperational ? normalizedErr.message : 'An unexpected server error occurred.',
      instance: req.originalUrl,
      code: errorCode,
      correlationId
    };

    if (normalizedErr.details) {
      problemDetails.invalidParams = normalizedErr.details;
    }

    // Include stack trace only in local / staging development environments
    if (!isProduction && err.stack) {
      problemDetails.stack = err.stack;
    }

    res.status(statusCode);
    res.setHeader('Content-Type', 'application/problem+json');
    res.json(problemDetails);
  };
}
```

---

## Edge Cases and Tricky Scenarios

### 1. Writing Responses After `res.headersSent` is True

If an error occurs while streaming a large response payload or after an explicit `res.flushHeaders()` call:

```js
// Node.js code
app.get('/export', async (req, res, next) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.write('['); // Headers are committed and sent!
  
  // Later error occurs:
  throw new Error('Database streaming connection broke mid-stream');
});
```
- **The Pitfall**: If your centralized error middleware blindly attempts `res.status(500).json(...)`, Node crashes with `ERR_HTTP_HEADERS_SENT`.
- **The Rule**: Always guard error handlers with:
  ```js
  if (res.headersSent) {
    return next(err); // Delegates to Express default handler, which destroys the socket stream
  }
  ```

### 2. Client Connection Abort (`req.on('close')`)

If a client terminates a request (e.g. user closes browser tab) while an expensive async database query is running:
- The database promise eventually resolves or rejects.
- If it rejects, `asyncHandler` calls `next(err)`.
- The error handler attempts to write a 500 response to the closed socket, wasting CPU and logging false-positive error alerts.
- **The Defense**: Inspect `if (req.destroyed) return;` inside `asyncHandler` to suppress error propagation for cancelled requests.

---

## Node.js, JavaScript, and Systems Connections

```text
┌──────────────────────────────────────────────────────────────┐
│ V8 Microtask Queue                                           │
│ - Promise.resolve().catch(next) intercepts async rejections  │
│ - Unhandled rejections emit process 'unhandledRejection'     │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Express Router Internal State                                │
│ - Sequential Layer Traversal                                 │
│ - layer.handle_error(err, req, res, next) [Arity === 4]      │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Node.js Native HTTP Protocol                                 │
│ - res.headersSent Boolean flag on ServerResponse             │
│ - Socket stream lifecycle: FIN, RST, req.on('close')         │
│ - RFC 7807 Content-Type: application/problem+json            │
└──────────────────────────────────────────────────────────────┘
```

- **V8 Microtasks**: The fundamental reason Express 4 requires `asyncHandler` is that microtasks execute asynchronously outside the router's synchronous call frame.
- **HTTP Transport**: Once the first byte is flushed, the HTTP status line is immutable. Sockets must be closed via `req.destroy()` rather than sending another HTTP status code.

---

## Hands-On Exercise

### Scenario
An e-commerce order checkout API has multiple production failure modes:
1. In checkout, when an order is submitted with an invalid item ID, the service queries the database, rejects with an async error, and crashes the entire Node process due to an unhandled promise rejection.
2. When a duplicate order ID is generated, the PostgreSQL driver emits error code `23505`, but the API returns a generic 500 error leaking raw SQL error strings.
3. In local testing, error responses use three different JSON payload structures, confusing frontend error handling.

### Buggy Code

```js
// Node.js code
// filename: buggy-order-api.mjs
const express = require('express');
const app = express();
app.use(express.json());

const fakeDb = {
  orders: new Set(),
  async create(orderId) {
    if (fakeDb.orders.has(orderId)) {
      const err = new Error('duplicate key value violates unique constraint');
      err.code = '23505'; // Postgres duplicate key
      throw err;
    }
    if (orderId === 'bad_item') {
      throw new Error('Item bad_item does not exist in inventory');
    }
    fakeDb.orders.add(orderId);
    return { orderId, status: 'confirmed' };
  }
};

// ❌ BUG 1: Bare async handler without asyncHandler causes unhandled rejection!
app.post('/checkout', async (req, res, next) => {
  const result = await fakeDb.create(req.body.orderId);
  res.status(201).json(result);
});

// ❌ BUG 2 & 3: Naive error handler returns raw 500 and inconsistent error formats
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message, raw: err });
});

module.exports = app;
```

### Acceptance Criteria
1. Implement the Domain Error hierarchy including `NotFoundError` and `ConflictError`.
2. Wrap the async checkout route in `asyncHandler` to safely forward rejections to Express error middleware.
3. Translate PostgreSQL `23505` error into a `ConflictError` (409).
4. Implement centralized error handling that formats all errors into standard RFC 7807 Problem Details (`application/problem+json`).
5. Provide a test suite using `node:test` verifying that duplicate orders return 409, missing items return 404, and unhandled errors return RFC 7807 500s.

### Solution Code

```js
// Node.js code
// filename: solution-order-api.mjs
import express from 'express';

// 1. Domain Errors
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}
export class NotFoundError extends AppError {
  constructor(msg) { super(msg, 404, 'NOT_FOUND'); }
}
export class ConflictError extends AppError {
  constructor(msg) { super(msg, 409, 'CONFLICT'); }
}

// 2. Async Handler
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export function createFixedOrderApp() {
  const app = express();
  app.use(express.json());

  const fakeDb = {
    orders: new Set(),
    async create(orderId) {
      if (fakeDb.orders.has(orderId)) {
        const err = new Error('duplicate key value violates unique constraint');
        err.code = '23505'; // Simulated Postgres unique constraint
        throw err;
      }
      if (orderId === 'bad_item') {
        throw new NotFoundError('Item bad_item does not exist in inventory');
      }
      fakeDb.orders.add(orderId);
      return { orderId, status: 'confirmed' };
    }
  };

  // ✅ Wrapped with asyncHandler
  app.post('/checkout', asyncHandler(async (req, res) => {
    const result = await fakeDb.create(req.body.orderId);
    res.status(201).json({ data: result });
  }));

  // ✅ RFC 7807 Error Handling Middleware
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }

    // Translate Postgres 23505
    let resolvedError = err;
    if (err && err.code === '23505') {
      resolvedError = new ConflictError('Order ID already exists in system');
    }

    const isOperational = resolvedError instanceof AppError;
    const statusCode = isOperational ? resolvedError.statusCode : 500;
    const code = isOperational ? resolvedError.code : 'INTERNAL_SERVER_ERROR';

    res.status(statusCode);
    res.setHeader('Content-Type', 'application/problem+json');
    res.json({
      type: `https://api.example.com/errors/${code.toLowerCase().replace(/_/g, '-')}`,
      title: resolvedError.name || 'Internal Server Error',
      status: statusCode,
      detail: isOperational ? resolvedError.message : 'An unexpected error occurred',
      instance: req.originalUrl,
      code
    });
  });

  return app;
}
```

Accompanying test suite:
```js
// Node.js code
// filename: solution-order-api.test.mjs
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createFixedOrderApp } from './solution-order-api.mjs';

describe('Centralized Async Error Handling Tests', () => {
  it('translates database 23505 error into RFC 7807 409 Conflict', async () => {
    const app = createFixedOrderApp();
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      // 1. Initial valid order
      const firstRes = await fetch(`http://127.0.0.1:${port}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'ord_100' })
      });
      assert.equal(firstRes.status, 201);

      // 2. Duplicate order -> triggers 23505 -> mapped to 409
      const duplicateRes = await fetch(`http://127.0.0.1:${port}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'ord_100' })
      });
      assert.equal(duplicateRes.status, 409);
      assert.equal(duplicateRes.headers.get('content-type'), 'application/problem+json');

      const body = await duplicateRes.json();
      assert.equal(body.code, 'CONFLICT');
      assert.equal(body.detail, 'Order ID already exists in system');
      assert.equal(body.status, 409);
    } finally {
      server.close();
    }
  });

  it('maps domain NotFoundError to RFC 7807 404', async () => {
    const app = createFixedOrderApp();
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'bad_item' })
      });
      assert.equal(res.status, 404);

      const body = await res.json();
      assert.equal(body.code, 'NOT_FOUND');
      assert.equal(body.status, 404);
      assert.equal(body.detail, 'Item bad_item does not exist in inventory');
    } finally {
      server.close();
    }
  });
});
```

### Solution Explanation
1. **Promise Interception**: `asyncHandler` ensures asynchronous rejections from `fakeDb.create()` are caught and passed cleanly to `next(err)`.
2. **Postgres Error Translation**: The error middleware checks `err.code === '23505'` and maps it to a `ConflictError`, masking raw SQL strings and returning HTTP 409.
3. **Standardized RFC 7807 Format**: Every error response returns `application/problem+json` with consistent fields (`type`, `title`, `status`, `detail`, `code`), ensuring client compatibility.

---

## Summary

- Express 4 routing is synchronous and does not catch unhandled promise rejections from `async` handlers; use `asyncHandler` to route errors to `next(err)`.
- Distinguish Operational Errors (predictable runtime failures, safe to handle) from Programmer Errors (code bugs, require graceful process restart).
- Model domain failures using an `AppError` inheritance tree carrying HTTP status codes and machine-readable error codes.
- Format all error responses according to the RFC 7807 Problem Details specification (`application/problem+json`).
- Translate low-level database driver errors (e.g., Postgres `23505`, MongoDB `11000`) into clean domain errors before formatting responses.
- Always check `res.headersSent` before sending an error response to avoid `ERR_HTTP_HEADERS_SENT` crashes.

---

## Cheat Sheet

| Error / Layer | Source / Trigger | Handled Outcome |
| :--- | :--- | :--- |
| **`asyncHandler(fn)`** | Wrap all async Express 4 handlers | Forwards rejected promises to `next(err)` |
| **`AppError`** | Custom base error class | Defines `isOperational: true`, `statusCode`, `code` |
| **Postgres `23505`** | Unique constraint violation | Translate to `ConflictError` (HTTP 409) |
| **MongoDB `11000`** | Duplicate key error | Translate to `ConflictError` (HTTP 409) |
| **JWT `TokenExpired`** | Expired bearer token | Translate to `UnauthorizedError` (HTTP 401) |
| **`res.headersSent`** | Headers already sent to socket | Call `return next(err)` to destroy socket |
| **RFC 7807 Header** | Problem details format | `Content-Type: application/problem+json` |

### Common Pitfalls
- **Writing async Express 4 routes without `asyncHandler`**: Causes `unhandledRejection` and process crashes on rejections.
- **Returning 500 for business validation failures**: Conflates client mistakes with server outages, distorting SLA monitoring.
- **Calling `res.status().json()` after headers are sent**: Triggers fatal `ERR_HTTP_HEADERS_SENT` errors.
- **Exposing internal stack traces in production**: Discloses sensitive server file structures and dependency versions.

---

## Interview Questions

### 1. Why does an unhandled Promise rejection in an Express 4 async route handler escape the framework's error middleware, and what changed in Express 5?

In Express 4, the internal router dispatch loop is purely synchronous. When a route handler is invoked, Express calls `layer.handle_request(req, res, next)` wrapped in a synchronous `try { ... } catch (err) { next(err); }` block.

When an `async` function executes, it immediately returns a pending Promise to the caller while continuing its asynchronous operations on the V8 microtask queue. Because the function returns a Promise rather than throwing synchronously, the synchronous `try/catch` block exits without error. If the async function subsequently throws an error or rejects an `await` call during a later microtask turn, Express is no longer in the call stack. The rejection escapes into Node's global process environment, triggering an `unhandledRejection` event and bypassing Express's 4-argument error middleware entirely.

In **Express 5**, the router was refactored to inspect the return value of every middleware and route handler. If the return value is a Promise (`typeof result?.then === 'function'`), Express automatically attaches a `.catch(next)` handler, natively routing rejected promises directly into the 4-argument error middleware pipeline without requiring an `asyncHandler` wrapper.

### 2. What is the fundamental difference between an Operational Error and a Programmer Error, and how should a production Node.js service react to each?

1. **Operational Errors**:
   - **Definition**: Predictable, anticipated runtime errors that occur during the normal operation of a healthy application. Examples include invalid user input (422), resource not found (404), expired JWT credentials (401), and external database timeouts (504).
   - **Handling Strategy**: The system should log the occurrence at `WARN` level, format an RFC 7807 error response for the client, and **keep the Node.js process running**. Because the system state remains uncorrupted, no process restart is needed.

2. **Programmer Errors**:
   - **Definition**: Unanticipated software bugs, syntax errors, or logical defects in code. Examples include `TypeError: Cannot read properties of undefined`, `ReferenceError`, passing invalid types to native APIs, or unhandled null pointers.
   - **Handling Strategy**: Programmer errors place the application into an **unpredictable state**. Continuing to run the process can result in memory leaks, corrupted database transactions, or deadlocks. The application should log the full stack trace at `FATAL` level, alert on-call engineering, return a generic 500 response, and **initiate a graceful process shutdown and restart** (via Kubernetes or process manager) so a fresh container replica can take over.

### 3. What is the RFC 7807 specification, and why is it preferred over ad-hoc error formats in enterprise REST APIs?

RFC 7807 ("Problem Details for HTTP APIs") defines a standardized JSON schema and media type (`application/problem+json`) for conveying machine-readable error details from HTTP APIs.

Standard fields include:
- `type`: A URI identifying the problem type (e.g. `https://api.example.com/errors/not-found`).
- `title`: A short, human-readable summary of the problem type.
- `status`: The HTTP status code generated by the origin server.
- `detail`: A human-readable explanation specific to this occurrence.
- `instance`: A URI reference identifying the specific occurrence of the problem (e.g. the requested URL).

Advantages over ad-hoc formats:
1. **Client Interoperability**: Frontend applications, mobile SDKs, and third-party consumers can write generic, centralized error handling clients without writing bespoke parsers for different endpoints.
2. **Machine-Readable Classification**: Fields like `code` or `type` allow programmatic client actions (e.g., redirecting to payment update on `insufficient-funds`) without relying on brittle error message string matching.
3. **Structured Debugging**: Standardization encourages incorporating correlation IDs and field-level validation dictionaries (`invalidParams`) consistently across all microservices.

### 4. What happens if an error occurs after `res.headersSent` is true, and how must error middleware handle this condition?

Once an HTTP response begins flushing bytes to the network socket—either because the response buffer filled up, `res.flushHeaders()` was invoked, or data chunks were written via `res.write()`—the HTTP status line and headers are committed to the TCP stream. At this point, Node's `res.headersSent` property becomes `true`.

If an asynchronous error occurs *after* headers are sent (for example, a database cursor breaks while streaming a massive CSV export):
- If error-handling middleware attempts to call `res.status(500).json(...)`, Node's HTTP engine throws a fatal `ERR_HTTP_HEADERS_SENT` exception because the HTTP protocol forbids sending a second status line on the same connection.
- To handle this condition safely, centralized error middleware must always inspect `res.headersSent`:
  ```js
  if (res.headersSent) {
    return next(err);
  }
  ```
  Calling `next(err)` when headers are already sent instructs Express's default fallback handler to immediately **destroy the underlying network socket** (`res.socket.destroy()`). This terminates the client connection cleanly, preventing partial response corruption and avoiding `ERR_HTTP_HEADERS_SENT` crashes.

---

<nav aria-label="Lecture navigation">

[← Previous: Express Input Validation and Serialization](day-16-express-input-validation-and-serialization.md) | [Roadmap](../node-roadmap.md) | [Next: API Contracts, Pagination, and Idempotency](day-18-api-contracts-pagination-and-idempotency.md)

</nav>