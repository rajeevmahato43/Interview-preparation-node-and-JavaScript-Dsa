# Day 14: Express Middleware and Request Flow

<nav aria-label="Lecture navigation">

[← Previous: Express Application Structure](day-13-express-application-structure.md) | [Roadmap](../node-roadmap.md) | [Next: Express Routing and Route Parameters](day-15-express-routing-and-route-parameters.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Deconstruct the internal mechanics of the Express middleware pipeline, including `app._router.stack`, `Layer` objects, and the function arity (`fn.length`) rule.
- Differentiate the exact behavior of `next()`, `next(err)`, `next('route')`, and `next('router')` across application and router layers.
- Prevent catastrophic runtime errors caused by double `next()` invocations and post-response execution (`ERR_HTTP_HEADERS_SENT`).
- Architect a production request pipeline in canonical execution order (correlation IDs, security headers, body parsing, auth, authorization, validation, controllers, 404 handler, and error middleware).
- Bridge the asynchronous error-handling gap between Express 4 (unhandled promise rejections) and Express 5 (native async promise catching) using robust wrapper utilities.
- Implement short-circuiting guards and atomic context decorators without mutating frozen request properties.

---

## Prerequisites

Before diving into middleware mechanics, review:
- [Day 02: Event Loop and Scheduling](day-02-event-loop-and-scheduling.md) for async microtask scheduling and unhandled promise rejections.
- [Day 09: Node HTTP Fundamentals](day-09-node-http-fundamentals.md) for `ERR_HTTP_HEADERS_SENT` and HTTP streaming headers.
- [Day 13: Express Application Structure](day-13-express-application-structure.md) for 4-layer architecture and application factories.

---

## Quick Vocabulary Card

| Term | Programming Definition | Anti-Pattern / Misconception |
| :--- | :--- | :--- |
| **Middleware Function** | A function with signature `(req, res, next)` that has access to the request, response, and the pipeline iterator. | Thinking middleware only modifies data; forgetting to call either `next()` or send a response causes the HTTP request to hang until client timeout. |
| **Function Arity (`fn.length`)** | The number of formal arguments declared in a function signature, inspected by Express via `fn.length` at runtime. | Defining error middleware with `(err, req, res)` (length 3); Express interprets it as standard middleware and passes `req` into the `err` parameter. |
| **Short-Circuiting** | Terminating request processing early by writing an HTTP response without invoking the `next()` callback. | Calling `res.status(401).json(...)` and then calling `next()`, which continues pipeline execution and triggers `ERR_HTTP_HEADERS_SENT`. |
| **`next('route')`** | A special signal that skips all remaining middleware functions in the *current* route stack and jumps to the next route matching the path. | Attempting to use `next('route')` inside top-level `app.use()` middleware (it is only supported inside route-level handlers like `router.get`). |
| **`next('router')`** | A control signal that aborts execution of the current `express.Router()` instance completely and returns control to the parent router stack. | Using `next('router')` assuming it acts like `next(err)`; it skips the sub-router without initiating error handling. |
| **`asyncHandler`** | A higher-order wrapper that wraps an async middleware function and chains `.catch(next)` to intercept rejected promises. | Assuming Express 4 automatically catches thrown errors in `async` middleware functions (causes unhandled promise rejections). |

---

## Core Concepts

### 1. Internal Pipeline Architecture & The Function Arity Rule

An Express application processes HTTP requests through an ordered linked-array pipeline called `app._router.stack`.

Every call to `app.use()` or `app.METHOD()` creates an internal `Layer` object containing a route path regular expression and a dispatch function:

```text
Incoming HTTP Request (req, res)
                 │
                 ▼
         [app._router.stack]
┌─────────────────────────────────────────────────────────────┐
│ Layer 0: Correlation ID Middleware  (fn.length === 3)       │
│          calls next() ──►                                   │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: Body Parser Middleware     (fn.length === 3)       │
│          calls next() ──►                                   │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: Authentication Guard       (fn.length === 3)       │
│          calls next(err) ──┐ (Enters Error Mode!)           │
├────────────────────────────┼────────────────────────────────┤
│ Layer 3: User Route Handler│ (SKIPPED in Error Mode)        │
│          (fn.length === 3) │                                │
├────────────────────────────┼────────────────────────────────┤
│ Layer 4: 404 Handler       │ (SKIPPED in Error Mode)        │
│          (fn.length === 3) │                                │
├────────────────────────────┼────────────────────────────────┤
│ Layer 5: Centralized Error Handler  (fn.length === 4) ◄─────┘
│          receives (err, req, res, next)                     │
└─────────────────────────────────────────────────────────────┘
```

#### The Function Arity (`fn.length`) Mechanism
Express determines whether a middleware is a **Standard Middleware** or an **Error Middleware** solely by inspecting `fn.length`:

```js
// Express internal dispatch check (simplified):
if (err) {
  // Only invoke layers that explicitly declare 4 arguments
  if (layer.handle.length === 4) {
    layer.handle_error(err, req, res, next);
  } else {
    next(err); // Skip standard layer
  }
} else {
  // Standard execution: only invoke layers that declare <= 3 arguments
  if (layer.handle.length < 4) {
    layer.handle_request(req, res, next);
  } else {
    next(); // Skip error layer
  }
}
```

> **CRITICAL RULE**: Error-handling middleware **must** declare all four parameters `(err, req, res, next)`. If you omit `next` and declare `(err, req, res)`, `fn.length` is 3; Express will treat it as regular middleware, fail to invoke it during errors, and pass the standard `req` as `err`.

---

### 2. Control Flow Signals: `next()` vs `next(err)` vs `next('route')` vs `next('router')`

The `next()` callback accepts specific arguments that instruct the Express router iterator how to traverse the pipeline:

| Invocation | Target Destination | When to Use |
| :--- | :--- | :--- |
| **`next()`** | The immediate next standard middleware or matching route handler. | Normal linear pipeline continuation. |
| **`next(err)`** | Skips all regular middleware and jumps to the next **4-argument error middleware** `(err, req, res, next)`. | Any handled exception, database failure, or business validation error. |
| **`next('route')`**| Skips remaining callbacks in the **current route definition** and jumps to the next route matching the same path. | Conditional routing (e.g. bypassing a standard handler to execute a specialized fallback handler). |
| **`next('router')`**| Escapes the entire **current `express.Router()`** and resumes execution in the parent router stack. | Aborting an entire route group (e.g., bypassing an entire `/api/v2` router). |

---

### 3. Canonical Middleware Execution Order

The order of `app.use()` calls defines the exact execution sequence of your application. Reversing order introduces security holes or silent failures:

```text
1. Global Observability       ──► Correlation ID (X-Request-ID), Request Timer
2. Security & Network         ──► Helmet (Security Headers), CORS
3. Request Body Parsing       ──► express.json({ limit: '100kb' }), express.urlencoded
4. Request Sanitization       ──► HPP (HTTP Parameter Pollution), XSS scrubbing
5. Authentication Guard       ──► Verify JWT / Session, attach req.user
6. Rate Limiting              ──► Bounded IP / User bucket rate limiting
7. Route Mounts               ──► app.use('/api/v1/users', userRouter)
   ├── Route Authorization    ────► requireRole('admin')
   ├── Route Input Validation ────► validateSchema(userCreateSchema)
   └── Controller Execution   ────► userController.create
8. 404 Fallback Catch-All     ──► Catches any unhandled route paths
9. Centralized Error Handler  ──► (err, req, res, next) maps errors to JSON
```

- **Placing Auth after Route Mounts**: If `app.use(authMiddleware)` is placed after `app.use('/users', userRouter)`, the routes execute without authentication.
- **Placing Body Parser after Routes**: `req.body` will be `undefined` inside the route handlers because the stream was never consumed.
- **Placing Error Handler before Routes**: The error handler will never be reached by route errors because it is registered before them in the stack.

---

### 4. Asynchronous Middleware and Promise Catching

In **Express 4.x**, the router is purely synchronous. If an `async` middleware function throws an error or rejects a Promise:

```js
// ❌ EXPRESS 4 HAZARD: Unhandled Promise Rejection!
app.get('/users', async (req, res, next) => {
  const users = await db.query('SELECT * FROM non_existent_table'); // Throws DB error!
  res.json(users);
});
```

Because Express 4 does not wrap middleware invocations in `Promise.resolve().catch(next)`, the rejected promise escapes the Express error pipeline, triggers a Node.js `unhandledRejection` event, and terminates the Node process in modern Node versions.

#### The `asyncHandler` Solution
To safely use `async/await` in Express 4 without wrapping every handler in repetitive `try/catch` blocks, wrap async handlers in an `asyncHandler`:

```js
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ✅ SAFE: Caught rejection is routed directly to next(err)
app.get('/users', asyncHandler(async (req, res, next) => {
  const users = await db.query('SELECT * FROM users');
  res.json(users);
}));
```

*(Note: Express 5.x introduces native Promise catching where rejected promises automatically route to `next(err)`, but understanding this mechanism remains critical for production maintenance and interview evaluations).*

---

### 5. Short-Circuiting and Mutating Request Context

Middleware functions enrich the request context by attaching verified metadata.

#### Rules for Safe Context Decoration:
1. **Never Mutate Native Read-Only Properties**: Do not overwrite native Express or Node properties like `req.url`, `req.method`, `req.headers`, or `res.socket`.
2. **Namespace Attached Metadata**: Attach metadata under clear domain namespaces such as `req.user`, `req.correlationId`, or `req.tenantContext`.
3. **Always Return on Short-Circuit**: When rejecting a request (e.g. 401 Unauthorized), you must **`return`** to stop execution:

```js
// ❌ BUG: Execution continues after sending response!
function badAuth(req, res, next) {
  if (!req.headers.authorization) {
    res.status(401).json({ error: 'Unauthorized' });
    // Missing return! Calls next(), causing downstream controller to run!
  }
  next();
}

// ✅ CORRECT: Explicit return terminates function execution immediately
function goodAuth(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}
```

---

## Code Snippets and Demonstrations

### 1. The Anatomy of Middleware Execution: Order and Short-Circuiting

Demonstrating execution order, pipeline short-circuiting, and skipping via `next('route')`.

```js
// Node.js code
// filename: middleware-flow-demo.mjs
import express from 'express';

export function createFlowApp() {
  const app = express();
  const executionLog = [];

  // Middleware 1: Global Logger
  app.use((req, res, next) => {
    executionLog.push('M1: Logger Start');
    next();
    executionLog.push('M1: Logger Post-Next'); // Runs on the way back up call stack!
  });

  // Middleware 2: Guard with conditional short-circuit
  app.use((req, res, next) => {
    executionLog.push('M2: Guard');
    if (req.headers['x-block-request'] === 'true') {
      executionLog.push('M2: Short-circuiting request');
      return res.status(403).json({ blocked: true });
    }
    next();
  });

  // Route with multiple handlers demonstrating next('route')
  app.get('/items', 
    (req, res, next) => {
      executionLog.push('Route-H1: Evaluating bypass');
      if (req.query.special === 'true') {
        executionLog.push("Route-H1: Bypassing to next route via next('route')");
        return next('route'); // Skips Route-H2!
      }
      next();
    },
    (req, res) => {
      executionLog.push('Route-H2: Standard Item Handler');
      res.json({ type: 'standard' });
    }
  );

  // Fallback route for special item handling
  app.get('/items', (req, res) => {
    executionLog.push('Route-Fallback: Special Item Handler');
    res.json({ type: 'special' });
  });

  app.getExecutionLog = () => [...executionLog];
  return app;
}
```

---

### 2. Robust Async Middleware Wrapper with Signal Cancellation

Building an industrial-grade `asyncHandler` that bridges async promise rejections and monitors client abort signals.

```js
// Node.js code
// filename: async-handler.mjs

/**
 * Wraps an asynchronous Express handler to automatically catch rejected promises
 * and pass them to next(err), while guarding against calls after client disconnection.
 */
export function asyncHandler(asyncFn) {
  return (req, res, next) => {
    // Wrap execution in a native Promise to intercept thrown sync errors & rejections
    Promise.resolve(asyncFn(req, res, next)).catch((err) => {
      // If response has already started streaming, delegate to default Express error handler
      if (res.headersSent) {
        return next(err);
      }

      // Check if client aborted the connection before processing concluded
      if (req.destroyed) {
        console.warn(`[asyncHandler] Request aborted by client. Suppressing error propagation.`);
        return;
      }

      next(err);
    });
  };
}
```

---

### 3. Production Middleware Pipeline Assembly

Assembling a canonical production pipeline with correlation tracking, validation, authorization, and centralized error handling.

```js
// Node.js code
// filename: canonical-pipeline.mjs
import express from 'express';
import crypto from 'node:crypto';
import { asyncHandler } from './async-handler.mjs';

export function createProductionPipelineApp({ userService }) {
  const app = express();

  // 1. Global Correlation ID & Observability
  app.use((req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    next();
  });

  // 2. Body Parser with strict payload size limit
  app.use(express.json({ limit: '50kb' }));

  // 3. Authentication Middleware: Decodes token & attaches user
  app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null; // Unauthenticated guest
      return next();
    }

    const token = authHeader.split(' ')[1];
    // Dummy JWT verification
    if (token === 'valid-admin-token') {
      req.user = { id: 'usr_admin', role: 'admin' };
    } else if (token === 'valid-user-token') {
      req.user = { id: 'usr_member', role: 'member' };
    } else {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    next();
  });

  // Authorization Guard Factory
  const requireRole = (allowedRole) => (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role !== allowedRole) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    next();
  };

  // 4. Routes
  app.get('/api/public', (req, res) => {
    res.json({ status: 'public access granted' });
  });

  app.get('/api/admin/dashboard', requireRole('admin'), (req, res) => {
    res.json({ status: 'admin dashboard data', user: req.user });
  });

  app.post('/api/users', asyncHandler(async (req, res) => {
    const { email } = req.body || {};
    if (!email) {
      const error = new Error('Email field is required');
      error.statusCode = 400;
      throw error; // Caught cleanly by asyncHandler!
    }

    const result = await userService.createUser(email);
    res.status(201).json({ data: result });
  }));

  // 5. 404 Catch-All Middleware for unmatched routes
  app.use((req, res, next) => {
    res.status(404).json({
      error: 'Route Not Found',
      path: req.originalUrl,
      correlationId: req.correlationId
    });
  });

  // 6. Centralized 4-Argument Error Middleware
  app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    const isClientError = status >= 400 && status < 500;

    // Log unexpected 5xx errors
    if (!isClientError) {
      console.error(`[Error ${req.correlationId}] ${err.message}`, err.stack);
    }

    res.status(status).json({
      error: isClientError ? err.message : 'Internal Server Error',
      correlationId: req.correlationId
    });
  });

  return app;
}
```

---

## Edge Cases and Tricky Scenarios

### 1. The Double `next()` Invocation Disaster

Calling `next()` multiple times in an asynchronous callback is a frequent developer trap:

```js
// Node.js code
// ❌ DANGEROUS ANTI-PATTERN: Double next() invocation!
app.use((req, res, next) => {
  fs.readFile('./config.json', (err, data) => {
    if (err) {
      next(err); // First call to next!
    }
    // Execution continues!
    next(); // Second call to next!
  });
});
```

- **The Disaster**: The first `next(err)` triggers error handling. The second `next()` concurrently triggers the standard route handler. Both handlers execute concurrently, causing multiple database writes, corrupting in-flight responses, and crashing Node with `ERR_HTTP_HEADERS_SENT`.
- **The Defense**: Always prefix `next()` with `return`:
  ```js
  if (err) return next(err);
  return next();
  ```

### 2. Error Middleware Invocation with Incorrect Parameter Count

If an error-handling middleware is defined without the fourth `next` parameter:

```js
// Node.js code
// ❌ ANTI-PATTERN: fn.length is 3!
app.use((err, req, res) => {
  res.status(500).json({ error: err.message });
});
```

Express checks `layer.handle.length === 4` before invoking an error middleware. Because the function above only declares three parameters, Express treats it as regular middleware, skips it entirely when an error occurs, and prints the raw error stack trace to the client via Node's default fallback handler.

---

## Node.js, JavaScript, and Systems Connections

```text
┌──────────────────────────────────────────────────────────────┐
│ V8 Execution Context                                         │
│ - Function Arity Inspection (fn.length property)             │
│ - Microtask Queue (Promise.resolve().catch(next))            │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Express Router Engine                                        │
│ - app._router.stack (Array of Layer objects)                 │
│ - Sequential Index Pointer (idx++)                           │
│ - Mode Switching: Normal Traversal vs Error Traversal        │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Node.js HTTP Protocol Layer                                  │
│ - res.headersSent Boolean Flag                               │
│ - Socket Stream Backpressure                                 │
│ - Client Connection Abort (req.on('close'))                  │
└──────────────────────────────────────────────────────────────┘
```

- **JavaScript Reflection**: Express's entire error handling architecture relies on JavaScript's `Function.prototype.length` property, reflecting the number of declared formal parameters.
- **Node.js Headers Protocol**: Writing a response header commits the HTTP status line to the socket. Attempting to modify status or headers in subsequent middleware triggers `ERR_HTTP_HEADERS_SENT` at the native Node stream level.
- **Systems & Memory**: Bounding request bodies with `express.json({ limit: '100kb' })` inside early middleware prevents unauthenticated attackers from exhausting Node process memory with gigabyte JSON payloads.

---

## Hands-On Exercise

### Scenario
An existing microservice has multiple critical middleware defects:
1. An authentication middleware validates tokens asynchronously, but when the token is missing, it sends a 401 response *and* still calls `next()`, causing subsequent database operations to run for unauthorized users and throwing `ERR_HTTP_HEADERS_SENT`.
2. An async user profile handler throws database connection errors that are never caught, causing unhandled promise rejections.
3. The centralized error handler declares `(err, req, res)`, so Express never invokes it during failures.

### Buggy Code

```js
// Node.js code
// filename: buggy-middleware-app.mjs
const express = require('express');
const app = express();

app.use(express.json());

// ❌ BUG 1: Missing return on 401 causes both 401 and route handler to execute!
app.use((req, res, next) => {
  if (!req.headers.authorization) {
    res.status(401).json({ error: 'No token provided' });
  }
  next();
});

// ❌ BUG 2: Unhandled async rejection in Express 4 crashes process!
app.get('/profile', async (req, res, next) => {
  // Simulates an async database rejection
  const profile = await Promise.reject(new Error('Database connection failed'));
  res.json(profile);
});

// ❌ BUG 3: Declared with 3 arguments instead of 4! Express skips this handler!
app.use((err, req, res) => {
  res.status(500).json({ error: 'Handled: ' + err.message });
});

module.exports = app;
```

### Acceptance Criteria
1. Fix the authentication middleware to cleanly short-circuit unauthorized requests with a single 401 response and zero subsequent execution.
2. Implement a safe `asyncHandler` that wraps the `/profile` route and routes errors to `next(err)`.
3. Fix the centralized error middleware to declare all 4 parameters `(err, req, res, next)` so Express routes errors into it.
4. Provide a test suite using `node:test` proving that unauthorized requests return 401 without header errors, and errors return formatted 500 JSON.

### Solution Code

```js
// Node.js code
// filename: solution-middleware-app.mjs
import express from 'express';

// 1. Generic Async Handler
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export function createFixedApp(dbStub = { shouldFail: false }) {
  const app = express();
  app.use(express.json());

  // ✅ FIX 1: Explicit return terminates pipeline on unauthorized access
  app.use('/profile', (req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: 'No token provided' });
    }
    next();
  });

  // ✅ FIX 2: Wrapped in asyncHandler to catch rejected promises
  app.get('/profile', asyncHandler(async (req, res) => {
    if (dbStub.shouldFail) {
      throw new Error('Database connection failed');
    }
    res.json({ id: 'usr_123', name: 'Verified User' });
  }));

  // ✅ FIX 3: Declares all 4 parameters (fn.length === 4) for proper error routing
  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: 'Handled: ' + err.message });
  });

  return app;
}
```

Accompanying test suite:
```js
// Node.js code
// filename: solution-middleware-app.test.mjs
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createFixedApp } from './solution-middleware-app.mjs';

describe('Middleware Pipeline Verification Tests', () => {
  it('correctly short-circuits unauthorized requests without headers errors', async () => {
    const app = createFixedApp();
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/profile`);
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.deepEqual(body, { error: 'No token provided' });
    } finally {
      server.close();
    }
  });

  it('catches async error and routes to 4-argument error middleware', async () => {
    const app = createFixedApp({ shouldFail: true });
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/profile`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      assert.equal(res.status, 500);
      const body = await res.json();
      assert.deepEqual(body, { error: 'Handled: Database connection failed' });
    } finally {
      server.close();
    }
  });
});
```

### Solution Explanation
1. **Short-Circuit Return**: In the auth middleware, returning `res.status(401).json(...)` halts execution before `next()` can be called, eliminating double-execution and `ERR_HTTP_HEADERS_SENT` crashes.
2. **Async Error Catching**: `asyncHandler` wraps the async route in `Promise.resolve().catch(next)`, guaranteeing that asynchronous rejections flow into Express's error pipeline instead of triggering unhandled rejections.
3. **Four-Parameter Signature**: Defining `(err, req, res, next)` ensures `fn.length === 4`, allowing Express's internal router to recognize the function as an error handler.

---

## Summary

- Express executes middleware in strict registration order via its internal `app._router.stack` array of `Layer` objects.
- Express identifies error middleware exclusively by function arity (`fn.length === 4`). Defining `(err, req, res)` causes Express to misinterpret it as standard middleware.
- `next()` continues linear execution; `next(err)` jumps directly to the next error middleware; `next('route')` skips remaining handlers in the current route definition; `next('router')` exits the sub-router.
- Always use `return next()` or `return res.status(...).json(...)` to prevent execution from continuing after short-circuiting.
- In Express 4, asynchronous middleware must be wrapped in an `asyncHandler` utility to route rejected promises to `next(err)`.
- Assemble pipelines in canonical order: Observability -> Security -> Parsing -> Auth -> Guards -> Routes -> 404 Handler -> Centralized Error Handler.

---

## Cheat Sheet

| Directive / Pattern | Intended Behavior | Critical Safety Rule |
| :--- | :--- | :--- |
| `return next()` | Advance to next matching layer | Always prefix with `return` to prevent post-callback code execution |
| `return next(err)` | Transition pipeline to error mode | Skips standard layers until hitting `(err, req, res, next)` |
| `return next('route')`| Skip remaining handlers in route | Valid only inside route handlers (`app.get`, not `app.use`) |
| `(err, req, res, next)`| Error-handling middleware | Must declare all 4 arguments; omitting `next` breaks detection |
| `asyncHandler(fn)` | Safe async/await wrapper | Intercepts promise rejections and forwards them to `next(err)` |
| Canonical Order | 404 catch-all before error handler | Place 404 handler immediately before centralized error handler |

### Common Pitfalls
- **Missing `return` on short-circuit**: Calling `res.status(401).json(...)` without returning allows downstream handlers to execute, crashing with `ERR_HTTP_HEADERS_SENT`.
- **Declaring error middleware with 3 arguments**: `(err, req, res)` has `fn.length === 3`; Express will never invoke it during an error.
- **Calling `next()` twice**: Causes duplicate handler executions and race conditions.
- **Registering body-parser after routes**: Causes `req.body` to be `undefined` inside route handlers.

---

## Interview Questions

### 1. How does Express distinguish between regular middleware and error-handling middleware under the hood, and what happens if you declare `(err, req, res)`?

Express distinguishes between regular middleware and error-handling middleware by inspecting JavaScript's `Function.prototype.length` property on the middleware callback function at registration time (`layer.handle.length`).

When Express executes its router stack:
- If no error has occurred, Express iterates through layers where `layer.handle.length < 4` (standard 3-argument middleware `(req, res, next)` or 2-argument route handlers `(req, res)`), skipping any layer where `length === 4`.
- When an error is passed via `next(err)` or thrown in synchronous execution, Express switches into error-handling mode. It skips all standard middleware layers and executes **only** layers where `layer.handle.length === 4`.

If a developer declares an error handler with only three parameters `(err, req, res)`, the function's arity (`fn.length`) is **3**. Express evaluates `layer.handle.length === 4` as false, concluding that the function is a standard middleware. Consequently, when an error occurs, Express skips this function entirely, falling back to Node's default HTML error handler. Furthermore, during normal non-error requests, Express will invoke this function and pass the standard `req` object into the parameter named `err`, corrupting request handling.

### 2. What causes the `ERR_HTTP_HEADERS_SENT` error in an Express application, and what coding pattern prevents it?

The `ERR_HTTP_HEADERS_SENT` error occurs when application code attempts to set an HTTP response header or status code on an `http.ServerResponse` object after the HTTP headers have already been committed and flushed to the network socket.

In Express, this almost always stems from failing to terminate a middleware function after sending an HTTP response:
```js
// Anti-pattern:
if (!user) {
  res.status(404).json({ error: 'User not found' });
  // Missing return!
}
next(); // Downstream handler attempts res.status(200).json(...)!
```
When `res.json()` executes, Express writes the HTTP status line and headers to the socket. If `next()` is subsequently invoked because the developer omitted a `return` statement, the next middleware or controller executes and attempts to call `res.json()` or `res.setHeader()`. Node detects that headers were already sent on the socket stream and throws a fatal `ERR_HTTP_HEADERS_SENT` exception.

The universal prevention pattern is to **always return response and next calls**:
```js
if (!user) {
  return res.status(404).json({ error: 'User not found' });
}
return next();
```

### 3. Why do unhandled Promise rejections in Express 4 async middleware fail to reach error middleware, and how does `asyncHandler` resolve this?

Express 4 was designed prior to the widespread adoption of native JavaScript Promises and `async/await`. Its internal routing engine is purely synchronous: it invokes `layer.handle_request(req, res, next)` inside a synchronous `try/catch` block.

When an `async` function is invoked in JavaScript, it returns a Promise. If an exception occurs within the `async` function (or an `await` rejects), the synchronous `try/catch` block inside Express 4 does **not** catch it because the rejection occurs asynchronously on the V8 microtask queue after the synchronous call stack has already returned. Because the rejection is unhandled by Express, it triggers Node's global `unhandledRejection` process event, completely bypassing Express's 4-argument error-handling middleware.

The `asyncHandler` pattern resolves this by wrapping the asynchronous function in a higher-order wrapper that explicitly attaches a `.catch(next)` handler to the returned promise:
```js
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```
If the async function resolves, execution continues normally. If it rejects or throws, the `.catch()` callback intercepts the error and explicitly invokes `next(err)`, transitioning the Express router into error-handling mode.

### 4. What is the difference between `next('route')` and `next('router')`, and in what scenarios would you use each?

`next('route')` and `next('router')` are specialized control-flow signals used to bypass execution hierarchies within Express:

1. **`next('route')`**:
   - **Scope**: Operates within a single route definition containing multiple middleware callbacks.
   - **Behavior**: Skips all remaining middleware functions in the *current* route stack and instructs Express to jump to the *next matching route* for the same URL path.
   - **Restriction**: Only works inside route-level handlers (e.g., `app.get('/path', [fn1, fn2])`). It has no effect inside top-level `app.use()` middleware.
   - **Use Case**: Conditional route specialization. For example, if a request has an `x-api-version: 2` header, `fn1` calls `next('route')` to bypass the v1 handler stack and fall through to a distinct v2 route handler defined further down for the same path.

2. **`next('router')`**:
   - **Scope**: Operates within an `express.Router()` sub-application instance.
   - **Behavior**: Aborts all remaining routes and middleware within the *entire sub-router* and returns execution control back to the parent router or application stack.
   - **Use Case**: Tenant isolation or feature toggling. If an entire mounted feature module (e.g., `/admin` mounted via `app.use('/admin', adminRouter)`) detects that the feature flag is disabled or tenant access is forbidden for the entire group, a guard inside the sub-router calls `next('router')` to cleanly bail out of the entire sub-router and allow the parent app to continue matching fallback routes.

---

<nav aria-label="Lecture navigation">

[← Previous: Express Application Structure](day-13-express-application-structure.md) | [Roadmap](../node-roadmap.md) | [Next: Express Routing and Route Parameters](day-15-express-routing-and-route-parameters.md)

</nav>