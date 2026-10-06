# Day 13: Express Application Structure

<nav aria-label="Lecture navigation">

[← Previous: Testing, Diagnostics, Observability, and Shutdown](day-12-testing-diagnostics-observability-and-shutdown.md) | [Roadmap](../node-roadmap.md) | [Next: Express Middleware and Request Flow](day-14-express-middleware-and-request-flow.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Deconstruct the internal relationship between Express and Node's core `http.Server`, explaining how Express extends `IncomingMessage` and `ServerResponse` prototypes.
- Architect scalable backend systems using the 4-Layer Architecture (Routes, Controllers, Domain Services, and Data Repositories).
- Implement clean Dependency Injection (DI) via Functional Factory compositions to make HTTP services deterministically testable without global mocks.
- Decouple application assembly (`createApp`) from network binding (`server.listen()`), supporting side-effect-free module imports in test runners.
- Isolate domain business logic from transport protocols, preventing HTTP objects (`req`, `res`, `next`) from leaking into domain services and repositories.
- Design an explicit asynchronous Composition Root that handles database connectivity, schema validation, and health signals during service bootstrap.

---

## Prerequisites

Before diving into Express application structure, review:
- [Day 03: Modules, Packages, and Resolution](day-03-modules-packages-and-resolution.md) for ESM/CJS module graph resolution and entry points.
- [Day 09: Node HTTP Fundamentals](day-09-node-http-fundamentals.md) for `http.createServer`, `IncomingMessage`, and `ServerResponse`.
- [Day 12: Testing, Diagnostics, Observability, and Shutdown](day-12-testing-diagnostics-observability-and-shutdown.md) for ephemeral port binding and test lifecycle isolation.

---

## Quick Vocabulary Card

| Term | Programming Definition | Anti-Pattern / Misconception |
| :--- | :--- | :--- |
| **Application Factory** | A higher-order function that accepts configured dependencies and returns a freshly configured Express application instance. | Instantiating a single global `const app = express()` at module scope that binds port 3000 immediately upon file import. |
| **Composition Root** | The single location in an application where the dependency graph is composed and wired together during bootstrap. | Scattering `new DatabaseClient()` or `new Service()` instantiations throughout individual route handlers. |
| **Controller** | An adapter layer component that translates incoming HTTP requests (parameters, headers, body) into domain inputs and maps domain results to HTTP responses. | Embedding database queries, third-party payment calls, and business validation rules directly inside controller functions. |
| **Domain Service** | A transport-agnostic module implementing pure business rules and domain operations without referencing `req`, `res`, or HTTP status codes. | Passing Express `req` and `res` objects into domain services, locking business logic exclusively to the Express HTTP protocol. |
| **Repository** | A persistence abstraction encapsulating raw database access (SQL queries, ORM calls, MongoDB filters) behind domain interfaces. | Writing raw `db.query('SELECT...')` statements directly inside HTTP route callbacks. |
| **Side-Effect-Free Import**| A module design guarantee where importing a file does not initiate network connections, open file handles, or start timers. | Running `app.listen(3000)` at module load time, causing test runners to collide on port 3000 when importing the app. |

---

## Core Concepts

### 1. How Express Extends Node's Core HTTP Layer

Express is not an alternative runtime; it is a higher-order request listener function layered directly over Node's native `http.Server`.

When you execute `const app = express()`, Express constructs a callable JavaScript function that internally behaves as a request listener `(req, res) => app.handle(req, res)`. This function is passed directly to Node's core HTTP server:

```text
Node.js Core (node:http)
┌─────────────────────────────────────────────────────────────┐
│ http.createServer((req, res) => { ... })                    │
│   ▲                                                         │
│   │ [Incoming TCP Connection & HTTP Parser]                 │
└───┼─────────────────────────────────────────────────────────┘
    │ Passes req, res
┌───▼─────────────────────────────────────────────────────────┐
│ Express Application Function                                 │
│ - Prototypes:                                               │
│   req.__proto__ -> express.request -> http.IncomingMessage  │
│   res.__proto__ -> express.response -> http.ServerResponse  │
│ - Internal Routing Engine:                                  │
│   app._router.stack = [ Layer, Layer, Layer... ]            │
└─────────────────────────────────────────────────────────────┘
```

#### Prototype Augmentation
Express augments Node's native HTTP objects without mutating global prototypes:
- `express.request` inherits from `http.IncomingMessage.prototype`, adding convenience helpers like `req.params`, `req.query`, `req.get()`, and `req.ip`.
- `express.response` inherits from `http.ServerResponse.prototype`, adding formatting helpers like `res.status()`, `res.json()`, `res.send()`, and `res.cookie()`.

Because an Express app is simply a request listener callback, running `app.listen(port)` is merely syntactic sugar for:
```js
const server = http.createServer(app);
server.listen(port);
```

---

### 2. The 4-Layer Backend Architecture

Placing business logic, database queries, and HTTP parsing into a single monolithic handler creates unmaintainable code that cannot be tested without running a live HTTP server and live database.

An enterprise Node.js backend organizes code into four strictly separated layers:

```text
[HTTP Ingress: Client Request]
             │
             ▼
┌────────────────────────────────────────┐
│ 1. ROUTE / TRANSPORT LAYER             │  Responsibility:
│ - Defines HTTP Verb & Path             │  - HTTP Path matching & parameter extraction
│ - Binds Middleware & Validators        │  - Authentication & Authorization guards
└──────────────────┬─────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│ 2. CONTROLLER LAYER                    │  Responsibility:
│ - Extracts req.body, req.params        │  - Translates HTTP inputs to Domain DTOs
│ - Calls Domain Service                 │  - Maps Service outcomes to HTTP status codes
└──────────────────┬─────────────────────┘  - Never contains raw SQL or business logic!
                   │
                   ▼
┌────────────────────────────────────────┐
│ 3. DOMAIN SERVICE LAYER                │  Responsibility:
│ - Enforces Business Rules & Policies   │  - Core domain calculations & invariant checks
│ - Manages Domain Transactions          │  - Completely transport-agnostic (Zero req/res)
└──────────────────┬─────────────────────┘  - Operates on pure JS objects / Entities
                   │
                   ▼
┌────────────────────────────────────────┐
│ 4. REPOSITORY / INFRASTRUCTURE LAYER   │  Responsibility:
│ - Executes SQL queries / NoSQL filters │  - Data persistence & schema mapping
│ - Interfaces with Redis & 3rd party APIs- Completely isolated from HTTP & business rules
└────────────────────────────────────────┘
```

| Layer | Knows About HTTP (`req`, `res`)? | Knows About Database (SQL, Mongoose)? | Primary Responsibility |
| :--- | :--- | :--- | :--- |
| **Route / Controller**| **Yes** — Inspects headers, params, body | **No** — Interacts only with Services | Transport parsing, error-to-status translation |
| **Domain Service** | **NO** — Strictly transport-agnostic | **No** — Interacts with abstract Repositories | Business rules, calculations, orchestration |
| **Repository** | **NO** — Unaware of HTTP or Express | **Yes** — Executes raw queries/transactions | Data access, persistence, hydration |

---

### 3. Dependency Injection (DI) via Functional Factories

Hardcoding database imports or service singletons inside handlers makes isolated testing impossible.

```text
❌ Tight Coupling (Hardcoded Singletons):
Controller ──► imports dbClient from './db.js' ──► Touches live DB in every test!

✅ Dependency Injection (Functional Factory):
createController({ userService }) ──► Receives configured service via parameters.
                                      Tests can easily supply mock/in-memory stubs!
```

In modern Node.js, **Functional Factory DI** offers maximum clarity without requiring complex TypeScript reflection decorators or bulky third-party DI containers:

```js
// Repository Factory
export function createUserRepository({ dbPool }) {
  return {
    async findById(id) { /* dbPool query */ },
    async save(userData) { /* dbPool query */ }
  };
}

// Service Factory
export function createUserService({ userRepo, emailClient, logger }) {
  return {
    async registerUser(input) {
      // Pure business logic: validate, persist, send email
      const existing = await userRepo.findById(input.id);
      if (existing) throw new ConflictError('User already exists');
      return await userRepo.save(input);
    }
  };
}
```

---

### 4. The Composition Root Pattern

The **Composition Root** is the centralized bootstrap entry point of the application where all concrete instances are initialized and injected into dependent layers.

```text
                 [Composition Root (server.mjs)]
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
  [DB Pool]              [Redis Client]         [Pino Logger]
       │                       │                       │
       └──────────────┬────────┘                       │
                      ▼                                │
             [User Repository]                         │
                      │                                │
                      └──────────────┬─────────────────┘
                                     ▼
                            [User Service]
                                     │
                                     ▼
                            [User Controller]
                                     │
                                     ▼
                               [User Router]
                                     │
                                     ▼
                             [Express App]
```

By concentrating object instantiation into a single bootstrap file, the rest of the codebase contains **zero direct module instantiations**, guaranteeing modularity and clear architectural boundaries.

---

### 5. Separation of App Factory from Network Binding

A production application must separate the assembly of the Express application from the network listener that binds a port.

- **`createApp({ dependencies })` (App Factory)**: Configures middleware, mounts routers, attaches centralized error handlers, and returns the configured Express instance. **Does not bind network ports**.
- **`server.js` (Server Entry Point)**: Loads environment variables, establishes database connections, instantiates dependencies, calls `createApp()`, and invokes `server.listen()`.

#### Dual-Execution Entry Point Guard
To support both programmatic importing (in automated tests) and CLI execution (in Docker/production), detect whether the module is the entry point:

In ES Modules (ESM):
```js
import { fileURLToPath } from 'node:url';

// True if executed directly via "node server.mjs"
const isDirectExecution = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  startServer();
}
```

In CommonJS (CJS):
```js
if (require.main === module) {
  startServer();
}
```

---

## Code Snippets and Demonstrations

### 1. Enterprise 4-Layer Architecture Implementation

Building a complete production flow across Repository, Service, Controller, and Router.

```js
// Node.js code
// filename: domain-errors.mjs
export class DomainError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}
export class NotFoundError extends DomainError {
  constructor(msg) { super(msg, 'NOT_FOUND'); }
}
export class ConflictError extends DomainError {
  constructor(msg) { super(msg, 'CONFLICT'); }
}
```

```js
// Node.js code
// filename: repositories/user-repository.mjs
export function createUserRepository({ db }) {
  return {
    async findByEmail(email) {
      // In real code: await db.query('SELECT * FROM users WHERE email = $1', [email])
      return db.users.find(u => u.email === email) || null;
    },
    async create(userData) {
      const newUser = { id: `usr_${Date.now()}`, ...userData, createdAt: new Date() };
      db.users.push(newUser);
      return newUser;
    }
  };
}
```

```js
// Node.js code
// filename: services/user-service.mjs
import { ConflictError } from '../domain-errors.mjs';

// ✅ PURE BUSINESS LOGIC: Completely unaware of HTTP, req, res, or status codes!
export function createUserService({ userRepo, logger }) {
  return {
    async registerUser({ email, name, role = 'member' }) {
      logger.info('Executing user registration domain logic', { email });

      const existingUser = await userRepo.findByEmail(email);
      if (existingUser) {
        throw new ConflictError(`User with email "${email}" already exists`);
      }

      // Enforce business invariant
      const sanitizedName = name.trim();
      if (sanitizedName.length < 2) {
        throw new Error('Name must be at least 2 characters long');
      }

      return await userRepo.create({ email, name: sanitizedName, role });
    }
  };
}
```

```js
// Node.js code
// filename: controllers/user-controller.mjs
// ✅ CONTROLLER: Translates HTTP requests to Service inputs and handles status mapping
export function createUserController({ userService }) {
  return {
    async register(req, res, next) {
      try {
        const { email, name } = req.body;
        
        // Transport-level parameter validation
        if (!email || !name) {
          return res.status(400).json({ error: 'Email and name are required' });
        }

        const user = await userService.registerUser({ email, name });
        return res.status(201).json({ data: user });
      } catch (err) {
        // Pass error down to centralized Express error middleware
        next(err);
      }
    }
  };
}
```

```js
// Node.js code
// filename: routes/user-routes.mjs
import express from 'express';

export function createUserRouter({ userController }) {
  const router = express.Router();
  router.post('/', (req, res, next) => userController.register(req, res, next));
  return router;
}
```

---

### 2. The Application Factory (`createApp`)

Composing middleware, routes, and centralized error translation into an isolated application instance.

```js
// Node.js code
// filename: app-factory.mjs
import express from 'express';
import { createUserRouter } from './routes/user-routes.mjs';
import { DomainError } from './domain-errors.mjs';

export function createApp({ userController, logger }) {
  const app = express();

  // Core middleware
  app.use(express.json({ limit: '100kb' }));

  // Health probe (Liveness)
  app.get('/livez', (req, res) => res.status(200).send('OK'));

  // Mount API routers
  app.use('/api/v1/users', createUserRouter({ userController }));

  // Centralized Error Handling Middleware
  app.use((err, req, res, next) => {
    // Map Domain errors to appropriate HTTP status codes
    if (err instanceof DomainError) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: err.message, code: err.code });
      }
      if (err.code === 'CONFLICT') {
        return res.status(409).json({ error: err.message, code: err.code });
      }
    }

    logger.error('Unhandled internal server error', { message: err.message, stack: err.stack });
    return res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}
```

---

### 3. The Composition Root and Server Bootstrap

Wiring all components together in `server.mjs` and establishing safe lifecycle handling.

```js
// Node.js code
// filename: server.mjs
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createApp } from './app-factory.mjs';
import { createUserRepository } from './repositories/user-repository.mjs';
import { createUserService } from './services/user-service.mjs';
import { createUserController } from './controllers/user-controller.mjs';

// Standard structured logger stub
const logger = {
  info: (msg, meta) => console.log(`[INFO] ${msg}`, meta || ''),
  error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta || '')
};

// Bootstrap Composition Root
export async function bootstrapSystem(customDeps = {}) {
  // In-memory or database initialization
  const db = customDeps.db || { users: [] };

  // 1. Compose Infrastructure Layer
  const userRepo = createUserRepository({ db });

  // 2. Compose Domain Service Layer
  const userService = createUserService({ userRepo, logger });

  // 3. Compose Transport Controller Layer
  const userController = createUserController({ userService });

  // 4. Compose Express Application
  const app = createApp({ userController, logger });

  return { app, db };
}

// Start Server Entry Guard
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const PORT = process.env.PORT || 3000;
  
  bootstrapSystem().then(({ app }) => {
    const server = http.createServer(app);
    server.listen(PORT, () => {
      logger.info(`Server successfully bound and listening on port ${PORT}`);
    });
  }).catch((err) => {
    logger.error('Failed to bootstrap application', { error: err.message });
    process.exit(1);
  });
}
```

---

## Edge Cases and Tricky Scenarios

### 1. Passing `req` and `res` into Domain Services

Developers frequently pass the entire `req` or `res` object into domain services for convenience:

```js
// Node.js code
// ❌ ANTI-PATTERN: Leaks HTTP transport into the domain!
export class OrderService {
  async checkout(req, res) {
    const userId = req.user.id;
    const items = req.body.items;
    // ...
    res.status(200).json({ success: true }); // Locks service to Express HTTP!
  }
}
```

- **The Problem**: You cannot reuse `OrderService.checkout()` in a background BullMQ queue worker, a CLI administrative script, a WebSocket handler, or a gRPC endpoint because those callers do not have Express `req` and `res` objects.
- **The Rule**: Domain services must accept plain JavaScript objects or primitive parameters (`{ userId, items }`) and return plain JavaScript values. The controller is solely responsible for reading `req` and writing `res`.

### 2. Leaking Express Handlers Across Router Boundaries

If you mount an Express router using `app.use('/users', userRouter)`, but declare routes inside `userRouter` with the full path `router.get('/users/:id')`, the resulting match path becomes `/users/users/:id`.
- **The Fix**: Routes defined inside a sub-router must use relative paths (`router.get('/:id')`). The parent mount point owns the route prefix.

---

## Node.js, JavaScript, and Systems Connections

```text
┌──────────────────────────────────────────────────────────────┐
│ V8 Execution Context                                         │
│ - Lexical Closures (Retains injected service dependencies)   │
│ - Prototype Delegation (req.__proto__ -> express.request)    │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Express Framework Layer                                      │
│ - app.handle(req, res, next)                                 │
│ - Router Stack & Layer Pipeline                              │
│ - Centralized Error Middleware (err, req, res, next)         │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Node.js Runtime (node:http)                                  │
│ - http.createServer(requestListener)                         │
│ - http.IncomingMessage & http.ServerResponse                 │
│ - Sockets, Buffers, Streams                                  │
└──────────────────────────────────────────────────────────────┘
```

- **JavaScript Closures**: Factory functions leverage lexical closures to bind dependencies (`db`, `logger`) permanently to service methods without requiring the `this` keyword or risking unbound context bugs.
- **Node.js HTTP**: Express delegates socket handling and HTTP parsing directly to Node's native C++ HTTP parser (`llhttp`).
- **Systems & Modularity**: Keeping application assembly side-effect-free enables sub-millisecond in-memory integration testing via mock sockets.

---

## Hands-On Exercise

### Scenario
A legacy e-commerce application stores all code in a single 1500-line `index.js` file. The server connects directly to the database and binds port 4000 on module load. As a result, integration tests cannot run concurrently, database mocks cannot be injected, and a bug in payment calculation crashes the entire HTTP server because errors are not routed through a centralized pipeline.

### Buggy Code

```js
// Node.js code
// filename: buggy-monolith.js
const express = require('express');
const pg = require('pg'); // Live DB dependency
const app = express();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

app.use(express.json());

// ❌ ANTI-PATTERN 1: DB query, business rules, and HTTP handling tangled in 1 function
app.post('/orders', async (req, res) => {
  const { customerId, items } = req.body;
  
  // Direct DB call inside route
  const customer = await pool.query('SELECT * FROM customers WHERE id = $1', [customerId]);
  if (!customer.rows[0]) {
    return res.status(404).send('Customer not found');
  }

  // Business logic mixed in
  let total = 0;
  for (const item of items) {
    if (item.price < 0) return res.status(400).send('Invalid price');
    total += item.price;
  }

  const order = await pool.query(
    'INSERT INTO orders (customer_id, total) VALUES ($1, $2) RETURNING *',
    [customerId, total]
  );

  res.status(201).json(order.rows[0]);
});

// ❌ ANTI-PATTERN 2: Starts server immediately on import!
app.listen(4000, () => {
  console.log('Server running on 4000');
});

module.exports = app;
```

### Acceptance Criteria
1. Decouple into 4 distinct layers: `OrderRepository`, `OrderService`, `OrderController`, and `OrderRouter`.
2. Extract an `createApp()` factory function that accepts injected dependencies and performs no network binding.
3. Keep `OrderService` completely free of Express or HTTP objects.
4. Route domain errors (`NotFoundError`, `ValidationError`) through a centralized Express error handling middleware.
5. Provide a deterministic integration test using `node:test` that executes with an in-memory repository without binding port 4000.

### Solution Code

```js
// Node.js code
// filename: solution-layers.mjs
import express from 'express';
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// 1. Domain Errors
export class NotFoundError extends Error {
  constructor(msg) { super(msg); this.name = 'NotFoundError'; }
}
export class ValidationError extends Error {
  constructor(msg) { super(msg); this.name = 'ValidationError'; }
}

// 2. Repository Layer (Database abstraction)
export function createOrderRepository(db) {
  return {
    async findCustomerById(id) {
      return db.customers.find(c => c.id === id) || null;
    },
    async createOrder(customerId, total) {
      const order = { id: `ord_${Date.now()}`, customerId, total, createdAt: new Date() };
      db.orders.push(order);
      return order;
    }
  };
}

// 3. Domain Service Layer (Pure Business Logic)
export function createOrderService({ orderRepo }) {
  return {
    async placeOrder({ customerId, items }) {
      const customer = await orderRepo.findCustomerById(customerId);
      if (!customer) {
        throw new NotFoundError(`Customer ${customerId} not found`);
      }

      if (!Array.isArray(items) || items.length === 0) {
        throw new ValidationError('Order must contain at least one item');
      }

      let total = 0;
      for (const item of items) {
        if (typeof item.price !== 'number' || item.price <= 0) {
          throw new ValidationError(`Invalid item price: ${item.price}`);
        }
        total += item.price;
      }

      return await orderRepo.createOrder(customerId, total);
    }
  };
}

// 4. Controller Layer (HTTP Transport Adapter)
export function createOrderController({ orderService }) {
  return {
    async createOrder(req, res, next) {
      try {
        const { customerId, items } = req.body;
        if (!customerId || !items) {
          return res.status(400).json({ error: 'customerId and items are required' });
        }

        const order = await orderService.placeOrder({ customerId, items });
        res.status(201).json({ data: order });
      } catch (err) {
        next(err); // Forward to centralized error handler
      }
    }
  };
}

// 5. Application Factory
export function createApp({ orderController }) {
  const app = express();
  app.use(express.json());

  app.post('/orders', (req, res, next) => orderController.createOrder(req, res, next));

  // Centralized Error Middleware
  app.use((err, req, res, next) => {
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}
```

Integration test demonstrating isolated in-memory verification:
```js
// Node.js code
// filename: solution-layers.test.mjs
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {
  createOrderRepository,
  createOrderService,
  createOrderController,
  createApp
} from './solution-layers.mjs';

describe('Order System Layered Architecture Tests', () => {
  it('successfully creates an order via injected in-memory repository', async () => {
    // Isolated in-memory database stub
    const mockDb = {
      customers: [{ id: 'cust_99', name: 'Bob' }],
      orders: []
    };

    // Wire dependencies
    const orderRepo = createOrderRepository(mockDb);
    const orderService = createOrderService({ orderRepo });
    const orderController = createOrderController({ orderService });
    const app = createApp({ orderController });

    // Ephemeral port binding
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      // 1. Place valid order
      const response = await fetch(`http://127.0.0.1:${port}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: 'cust_99',
          items: [{ price: 50 }, { price: 25 }]
        })
      });

      assert.equal(response.status, 201);
      const body = await response.json();
      assert.equal(body.data.total, 75);
      assert.equal(mockDb.orders.length, 1);

      // 2. Place order for nonexistent customer -> Expect 404
      const notFoundRes = await fetch(`http://127.0.0.1:${port}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: 'cust_unknown',
          items: [{ price: 10 }]
        })
      });
      assert.equal(notFoundRes.status, 404);
    } finally {
      server.close();
    }
  });
});
```

### Solution Explanation
1. **Decoupled Business Rules**: `OrderService` calculates totals and enforces invariants without any knowledge of HTTP status codes, headers, or Express middleware.
2. **Deterministic DI**: Repositories, Services, and Controllers are wired together cleanly via factory arguments. The test passes an in-memory database stub without needing a PostgreSQL container.
3. **Clean Error Pipeline**: Errors thrown in services (`NotFoundError`, `ValidationError`) bubble up to the controller, which passes them to `next(err)`. The centralized middleware maps domain types to HTTP 404 and 400 statuses.
4. **No Import Side Effects**: The module can be imported anywhere without binding ports or initiating database connections.

---

## Summary

- Express is a high-level abstraction built on Node's native `http.Server`, augmenting `IncomingMessage` and `ServerResponse` prototypes with convenient utility methods.
- Maintain a strict 4-Layer Architecture: Routes handle paths, Controllers map HTTP to Domain DTOs, Services enforce business logic, and Repositories handle database persistence.
- Never pass `req` or `res` into Domain Services. Keeping services transport-agnostic allows them to be reused in background jobs, CLI tools, and WebSockets.
- Use Functional Factory Dependency Injection to compose modules at the Composition Root, eliminating hardcoded singletons and global imports.
- Separate `createApp()` from `server.listen()` to ensure tests can import the application without port collisions or side-effect overhead.

---

## Cheat Sheet

| Layer / Pattern | Primary Function | Allowed Dependencies | Forbidden Dependencies |
| :--- | :--- | :--- | :--- |
| **Router** | URL path matching, middleware routing | Controller | Service, Database |
| **Controller** | Translates `req` to DTO; calls Service; sets `res` | Service, Transport DTOs | Database SQL, Raw ORM |
| **Domain Service** | Pure business logic & domain invariants | Repository, Domain Entities | Express `req`, `res`, `next` |
| **Repository** | Persists and queries database entities | Database Pool / ORM | Express `req`, `res`, Domain Service |
| **App Factory** | Configures Express pipeline and middleware | Controllers, Routers | `server.listen()`, Port binding |
| **Composition Root** | Instantiates and injects all modules | Configuration, All Factories | None (owns bootstrap) |

### Common Pitfalls
- **Running `app.listen()` at module scope**: Spawns open server ports during test imports, causing `EADDRINUSE` errors in parallel test runners.
- **Passing `res` into Services**: Locks core business logic exclusively to Express HTTP responses, preventing service reuse in queues or CLI scripts.
- **Hardcoding database imports inside Controllers**: Prevents in-memory stubbing and forces tests to connect to live databases.
- **Throwing HTTP status codes from Repositories**: Leaks transport concepts (`res.status(404)`) into data persistence modules.

---

## Interview Questions

### 1. What does Express actually provide on top of Node.js core `http.Server`, and how do their request and response prototypes interact?

An Express application is essentially an augmented request listener callback function passed to Node's core `http.createServer(app)`. Internally, Express inherits from Node's `EventEmitter` and manages a routing stack (`app._router.stack`) composed of middleware and route layers.

Rather than replacing Node's native HTTP objects, Express utilizes JavaScript's prototype inheritance chain to extend them:
- `express.request` sets its prototype to `http.IncomingMessage.prototype`. When a request arrives, Express decorates the instance with convenience properties and methods like `req.params`, `req.query`, `req.ip`, and `req.get()`.
- `express.response` sets its prototype to `http.ServerResponse.prototype`. It augments native response streams with helper methods like `res.status()`, `res.json()`, `res.send()`, `res.cookie()`, and `res.set()`.

Because Express builds directly upon Node's native prototypes, all underlying Node.js stream capabilities—such as `req.on('data')`, `req.pipe()`, and `res.write()`—remain fully functional and accessible within Express handlers.

### 2. Why is passing Express `req` and `res` objects into domain services considered a severe architectural defect?

Passing `req` and `res` into domain services violates the **Single Responsibility Principle** and tightly couples business logic to the HTTP transport layer:

1. **Reusability Failure**: A service that relies on `req.body` or calls `res.status(200).json(...)` cannot be executed outside of an Express HTTP request. If your system needs to execute the same business logic from an asynchronous message queue (e.g. BullMQ or Kafka), a scheduled cron job, a CLI maintenance command, or a WebSocket connection, you cannot reuse the service without constructing complex, fragile mock `req`/`res` objects.
2. **Testability Degraded**: Testing a service that accepts `req` and `res` requires instantiating mock HTTP objects with mocked headers, status methods, and JSON responders. A pure domain service accepts plain JavaScript objects (`{ userId, amount }`) and returns plain values, making unit testing trivial, fast, and completely independent of HTTP frameworks.
3. **Leaked Transport Concerns**: Domain rules should not know about HTTP status codes, cookies, or headers. Transport-specific mapping belongs strictly in the controller layer.

### 3. What is the difference between an Application Factory and an Application Singleton, and why does the factory pattern matter in test suites?

An **Application Singleton** instantiates a single static instance of the Express application at the top-level scope of a module (`const app = express(); export default app;`) and often invokes `app.listen()` in the same file. In contrast, an **Application Factory** is a higher-order function (`export function createApp(dependencies)`) that accepts configuration and dependencies as arguments and returns a newly constructed Express instance upon each invocation.

The Application Factory pattern is critical for testing and environment isolation:
1. **Side-Effect-Free Imports**: When test suites import an app factory, no network sockets are opened and no background connections are initiated. Tests can instantiate multiple isolated application instances in parallel without colliding on hardcoded ports (`EADDRINUSE`).
2. **Deterministic Dependency Injection**: Factories allow test runners to inject mock databases, stubbed loggers, and in-memory caches directly into the app instance, bypassing real network dependencies without relying on fragile module-level mocking libraries (like `proxyquire` or `jest.mock`).
3. **State Isolation**: Because each test can invoke `createApp()` independently, tests avoid leaking global state, middleware modifications, or session caches between test runs.

### 4. How should errors flow through a 4-layer architecture (Repository -> Service -> Controller -> Express Error Middleware)?

Errors should flow upward through the architectural hierarchy with each layer translating or propagating errors according to its domain:

1. **Repository Layer**: Encapsulates persistence failures. It catches database-specific driver errors (such as unique constraint violation `23505` in Postgres) and throws domain-meaningful persistence errors (e.g., `DuplicateRecordError` or `DatabaseConnectionError`), shielding upper layers from SQL syntax or database driver specifics.
2. **Domain Service Layer**: Enforces business invariants. When an invariant fails or a repository returns null, the service throws domain-specific errors (e.g., `NotFoundError('User not found')`, `InsufficientFundsError`, `ValidationError`). The service never assigns HTTP status codes.
3. **Controller Layer**: Catches errors from the domain service. Rather than formatting an HTTP error response manually with ad-hoc status codes, the controller delegates unhandled errors directly to Express by calling `next(err)`.
4. **Centralized Error Middleware**: Express's 4-argument error middleware `(err, req, res, next)` serves as the single source of truth for error translation. It inspects the error instance type (`err instanceof NotFoundError ? 404 : 500`), formats a consistent JSON error schema (`{ error: err.message, code: err.code }`), logs the stack trace if it is an unexpected 500 error, and sanitizes internal details from client responses.

---

<nav aria-label="Lecture navigation">

[← Previous: Testing, Diagnostics, Observability, and Shutdown](day-12-testing-diagnostics-observability-and-shutdown.md) | [Roadmap](../node-roadmap.md) | [Next: Express Middleware and Request Flow](day-14-express-middleware-and-request-flow.md)

</nav>