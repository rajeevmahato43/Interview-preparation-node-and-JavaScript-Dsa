# Day 32: PostgreSQL in Express

<nav aria-label="Lecture navigation">

[Previous: PostgreSQL Transactions, MVCC, and Locks](day-31-postgresql-transactions-mvcc-and-locks.md) | [Roadmap](../node-roadmap.md) | [Next: Layered Backend Architecture](day-33-layered-backend-architecture.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Structure a production-grade 4-layer Express application (Controller, Service, Repository, Database) backed by PostgreSQL and `pg.Pool`.
- Implement clean transaction propagation across multiple repositories using the Unit of Work / Executor abstraction without leaking database clients into HTTP controllers.
- Build centralized Express error-handling middleware translating PostgreSQL SQLSTATE error codes (`23505`, `23503`, `23514`, `57014`, `53300`) into RFC 7807 Problem Details.
- Implement decoupled Kubernetes `/livez` and `/readyz` health check probes using low-overhead ping queries (`SELECT 1`).
- Execute safe, zero-downtime graceful shutdown sequences that drain HTTP connections and close the PostgreSQL pool without severing in-flight transactions.
- Evaluate workload trade-offs between PostgreSQL and MongoDB using a rigorous architectural decision matrix.

---

## Prerequisites

- [Day 27: PostgreSQL and `pg` Pool Lifecycle](day-27-postgresql-and-pg-pool-lifecycle.md) — Pool connection lifecycle, client leaks, and pool sizing.
- [Day 31: PostgreSQL Transactions, MVCC, and Locks](day-31-postgresql-transactions-mvcc-and-locks.md) — Explicit transactions, client checkout, and deadlock prevention.
- [Day 17: Async Express and Centralized Errors](day-17-async-express-and-centralized-errors.md) — Async request boundaries and RFC 7807 problem details.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Production Impact |
|---|---|---|
| **Repository Pattern** | An architectural boundary isolating SQL query composition and row mapping from business domain logic. | Prevents SQL leakage into HTTP routes and enables unit testing via mock repositories without database dependencies. |
| **Executor Abstraction (`dbOrClient`)** | Passing a common interface (`{ query: Function }`) accepting either `pg.Pool` or a checked-out `pg.PoolClient` into repository methods. | Allows repositories to execute either as standalone single queries or composed together within a single shared transaction. |
| **RFC 7807 Problem Details** | A standardized JSON format (`application/problem+json`) for conveying machine-readable API error details to HTTP clients. | Normalizes database constraint errors across microservices with consistent status codes, titles, and error identifiers. |
| **Readiness Probe (`/readyz`)** | An orchestrator health check verifying whether the service instance can actively serve database traffic. | Prevents load balancers from routing customer traffic to instances experiencing database connection pool starvation. |
| **Graceful Pool Drain** | Closing incoming HTTP traffic first, waiting for in-flight queries to finish, and calling `await pool.end()`. | Prevents broken socket pipes and rollbacks of active transactions during rolling deployments. |

---

## Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                       4-LAYER EXPRESS & POSTGRESQL ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Incoming HTTP Request: POST /api/v1/orders
               │
               ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │ 1. CONTROLLER LAYER (orderController.js)                                                │
  │    • Validates request syntax/types via Zod/Joi schema.                                 │
  │    • Unpacks DTO: { customerId, items, paymentMethod }.                                 │
  │    • Calls Service: orderService.placeOrder(dto).                                       │
  │    • Projects HTTP response: 201 Created with JSON envelope.                            │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
               │
               ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │ 2. SERVICE LAYER (orderService.js)                                                      │
  │    • Coordinates business workflows and policy invariants.                              │
  │    • Manages Transaction Boundary: checks out client, runs BEGIN / COMMIT.              │
  │    • Passes transactional client executor to multiple repositories.                     │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
               │ (Executes inside shared client transaction)
               ├───► Calls: orderRepo.create(orderData, client)
               └───► Calls: inventoryRepo.reserveStock(items, client)
               ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │ 3. REPOSITORY LAYER (orderRepository.js, inventoryRepository.js)                        │
  │    • Accepts executor: (pool OR client).                                                │
  │    • Executes parameterized SQL statements ($1, $2) and RETURNING clauses.              │
  │    • Maps PostgreSQL database tuples to domain entities.                                │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
               │
               ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │ 4. DATABASE DRIVER LAYER (pg.Pool)                                                      │
  │    • Manages persistent TCP socket pool to PostgreSQL server.                           │
  │    • Configures pool limits, idle timeouts, and type deserialization.                   │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. Architectural Layering and Separation of Concerns

Placing SQL queries directly inside Express route handlers violates the Single Responsibility Principle. When SQL statements are mixed with HTTP request parsing:
- Controllers become tightly coupled to database schema details.
- Unit testing requires a live database, making CI test suites slow and brittle.
- Composing multiple database operations into a single atomic transaction across routes is nearly impossible.

The senior architectural standard divides the application into four distinct tiers:
1. **Controller:** Owns the HTTP perimeter (status codes, headers, cookie parsing, Zod request body validation). Knows nothing about SQL.
2. **Service:** Owns domain business logic and defines transaction boundaries. Coordinates multiple repositories.
3. **Repository:** Owns SQL grammar, parameterization, and row-to-object mapping. Knows nothing about `req` or `res`.
4. **Database Pool:** Owns connection pool lifecycle, socket health, and configuration.

---

### 2. Transaction Propagation: The Executor Pattern

A common challenge in clean architecture is managing database transactions across multiple repositories. If Repository A and Repository B must execute within the same transaction, how do they share the transaction without leaking the `pg.PoolClient` into the HTTP Controller?

The solution is the **Executor Pattern (`dbOrClient`)**:
- Repository methods accept an optional executor argument: `client = this.pool`.
- In non-transactional contexts, the repository uses `this.pool.query()`.
- In transactional contexts, the Service layer checks out a client, runs `BEGIN`, and passes that `client` to each repository method.

```javascript
// Node.js code
// pattern: Repository supporting both standalone and transactional execution
export class OrderRepository {
  /**
   * @param {import('pg').Pool} pool
   */
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * @param {Object} orderData
   * @param {import('pg').PoolClient} [executor] - Optional checked-out transaction client
   */
  async create(orderData, executor = this.pool) {
    const query = `
      INSERT INTO orders (customer_id, total_cents, status, created_at)
      VALUES ($1, $2, 'PENDING', NOW())
      RETURNING id, customer_id, total_cents, status, created_at;
    `;
    const { rows } = await executor.query(query, [
      orderData.customerId,
      orderData.totalCents
    ]);
    return rows[0];
  }
}
```

---

### 3. Centralized PostgreSQL Error Classification Middleware

PostgreSQL errors are strongly classified via their 5-character `code` property (`SQLSTATE`). Instead of littering every repository with repetitive `try/catch` error translation, an Express application should deploy a centralized error middleware translating SQLSTATE codes into standardized **RFC 7807 Problem Details**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          SQLSTATE TO RFC 7807 ERROR MAPPING MATRIX                          │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  SQLSTATE   PostgreSQL Error Class      HTTP Status   Problem Type URI
 ─────────────────────────────────────────────────────────────────────────────────────────────
  23505      unique_violation            409 Conflict  https://api.domain.com/errors/conflict
  23503      foreign_key_violation       400 Bad Req   https://api.domain.com/errors/invalid-ref
  23502      not_null_violation          422 Unproc    https://api.domain.com/errors/validation
  23514      check_violation             422 Unproc    https://api.domain.com/errors/business-rule
  40001      serialization_failure       503 Unavail   https://api.domain.com/errors/retryable
  40P01      deadlock_detected           503 Unavail   https://api.domain.com/errors/retryable
  57014      query_canceled (timeout)    504 Gateway   https://api.domain.com/errors/timeout
  53300      too_many_connections       503 Unavail   https://api.domain.com/errors/capacity
```

```javascript
// Node.js code
// pattern: Centralized RFC 7807 PostgreSQL error translation middleware
export function pgErrorMiddleware(err, req, res, next) {
  // If headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Detect PostgreSQL driver errors via existence of 'code' property
  if (err.code && typeof err.code === 'string' && err.code.length === 5) {
    const problem = {
      type: 'about:blank',
      instance: req.originalUrl,
      timestamp: new Date().toISOString()
    };

    switch (err.code) {
      case '23505': // unique_violation
        return res.status(409).json({
          ...problem,
          type: 'https://api.domain.com/errors/unique-conflict',
          title: 'Unique Constraint Violation',
          status: 409,
          detail: 'A record with the specified unique field already exists.',
          constraint: err.constraint
        });

      case '23503': // foreign_key_violation
        return res.status(400).json({
          ...problem,
          type: 'https://api.domain.com/errors/foreign-key-violation',
          title: 'Invalid Foreign Entity Reference',
          status: 400,
          detail: 'The referenced foreign resource does not exist.',
          constraint: err.constraint
        });

      case '23514': // check_violation
        return res.status(422).json({
          ...problem,
          type: 'https://api.domain.com/errors/check-violation',
          title: 'Business Invariant Check Violation',
          status: 422,
          detail: 'The provided data violates an operational database rule.',
          constraint: err.constraint
        });

      case '57014': // query_canceled (statement_timeout)
        return res.status(504).json({
          ...problem,
          type: 'https://api.domain.com/errors/database-timeout',
          title: 'Database Query Timeout',
          status: 504,
          detail: 'The database operation exceeded its execution deadline.'
        });

      case '40001': // serialization_failure
      case '40P01': // deadlock_detected
        return res.status(503).json({
          ...problem,
          type: 'https://api.domain.com/errors/concurrency-conflict',
          title: 'Concurrency Conflict - Please Retry',
          status: 503,
          detail: 'The transaction encountered a concurrent lock conflict and was aborted.'
        });
    }
  }

  // Non-PostgreSQL error: forward to general application error handler
  next(err);
}
```

---

### 4. Decoupled Health Probes and Graceful Shutdown

In Kubernetes or containerized environments, an Express application must expose two distinct health endpoints:
1. **`/livez` (Liveness Probe):** Verifies that the Node.js event loop is responding. **Do not query the database here!** If the database has a momentary hiccup, querying it inside `/livez` will cause Kubernetes to restart all healthy Node.js pods simultaneously, triggering a catastrophic cascading failure.
2. **`/readyz` (Readiness Probe):** Verifies that the instance is connected to the database and can accept customer traffic. Query the database using a strict timeout (`SELECT 1`). If the database is unreachable, Kubernetes stops sending traffic to this pod without killing the process.

```javascript
// Node.js code
// pattern: Decoupled liveness and readiness health checks
export function registerHealthProbes(app, pool) {
  // Liveness probe: Shallow process check
  app.get('/livez', (req, res) => {
    res.status(200).json({ status: 'live', uptime: process.uptime() });
  });

  // Readiness probe: Deep dependency check with strict deadline
  app.get('/readyz', async (req, res) => {
    try {
      // Execute fast ping with 1000ms deadline to prevent probe hangs
      const pingPromise = pool.query('SELECT 1 AS ready');
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database ping timed out')), 1000)
      );

      await Promise.race([pingPromise, timeoutPromise]);
      res.status(200).json({
        status: 'ready',
        database: 'connected',
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingRequests: pool.waitingCount
      });
    } catch (err) {
      res.status(503).json({
        status: 'not_ready',
        database: 'unreachable',
        error: err.message
      });
    }
  });
}
```

---

### 5. Architectural Decision Matrix: PostgreSQL vs MongoDB

When designing a Node.js backend, selecting the primary datastore requires matching architectural requirements to database capabilities:

| Architectural Requirement | PostgreSQL | MongoDB |
|---|---|---|
| **Data Model & Schema** | Relational, normalized tables with strict column types and relational constraints (`FK`, `CHECK`). | Hierarchical, denormalized BSON documents with dynamic or JSON-Schema validation. |
| **Integrity Guarantees** | Engine-level relational invariants; impossible to orphan foreign records. | Referential integrity must be manually maintained by application code. |
| **Complex Joins & Aggregation**| Declarative SQL joins (`Nested Loop`, `Hash`, `Merge`), window functions, CTEs. | Aggregation Pipeline (`$lookup`, `$unwind`, `$group`); joins are less performant at scale. |
| **ACID Transactions** | Mature, low-overhead MVCC transactions (`Read Committed` up to `Serializable`). | Multi-document transactions available (replica sets), but incur higher latency and memory overhead. |
| **High Write Volume / Scalability**| Vertical scaling primary; read replicas; table partitioning. | Native automatic horizontal sharding across distributed clusters. |
| **Semi-Structured Data** | Excellent native `JSONB` support with GIN indexes. | Native document storage with rich nested document queries. |
| **When to Choose** | E-commerce, financial ledgers, multi-tenant B2B SaaS, strict schemas, complex relational reporting. | High-volume IoT telemetry, dynamic CMS catalogs, rapidly mutating prototypes, localized single-document trees. |

---

## Detailed Explanations and Traces

### Graceful Shutdown Lifecycle Trace

When deploying updates or terminating containers (`SIGTERM`), shutting down an Express server backed by `pg.Pool` must follow an exact chronological sequence:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          GRACEFUL SHUTDOWN CHRONOLOGICAL SEQUENCE                           │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

 Step 1: Operating system sends SIGTERM to Node.js process.
 Step 2: Mark application as NOT READY:
         - Subsequent /readyz probes immediately return 503 Service Unavailable.
         - Kubernetes removes pod from Service endpoints (stops routing new HTTP traffic).
 Step 3: Stop HTTP Server from accepting new socket connections:
         - httpServer.close() terminates listen socket.
 Step 4: Allow active HTTP requests to complete within grace period (e.g., 10 seconds):
         - Existing queries execute on checked-out pool clients.
 Step 5: Drain and close database connection pool:
         - await pool.end() waits for all checked-out clients to be released,
           sends Terminate message to PostgreSQL server, and closes TCP sockets.
 Step 6: Process exits cleanly with code 0:
         - process.exit(0).
```

```javascript
// Node.js code
// pattern: Production-grade Graceful Shutdown Handler
export function setupGracefulShutdown({ server, pool, timeoutMs = 10000 }) {
  let isShuttingDown = false;

  const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`Received ${signal}. Initiating graceful shutdown...`);

    // Forceful termination fallback if graceful drain hangs
    const forceExitTimer = setTimeout(() => {
      console.error('Graceful shutdown timed out. Forcing process termination.');
      process.exit(1);
    }, timeoutMs);
    forceExitTimer.unref();

    try {
      // 1. Close HTTP server (stops accepting new connections)
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      console.log('HTTP server closed. No longer accepting new requests.');

      // 2. Close PostgreSQL pool (waits for active queries to complete)
      await pool.end();
      console.log('PostgreSQL connection pool drained and terminated.');

      console.log('Graceful shutdown completed successfully.');
      process.exit(0);
    } catch (err) {
      console.error('Error occurred during graceful shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
```

---

## Common Mistakes and Interview Traps

### 1. Leaking Database Clients in Services

When building transactional services, developers frequently forget to release the client if a non-database error is thrown:

```javascript
// Node.js code
// ❌ WRONG: Client leak on business logic failure
export async function transferService(pool, fromId, toId, amount) {
  const client = await pool.connect();
  await client.query('BEGIN');
  
  const user = await client.query('SELECT * FROM users WHERE id = $1', [fromId]);
  if (!user.rows[0].isActive) {
    // 💥 BUG: Throws error WITHOUT releasing client or executing ROLLBACK!
    // That connection socket is permanently orphaned in the pool!
    throw new Error('User inactive');
  }
  // ...
}
```
**Fix:** Always wrap the transaction inside a guaranteed higher-order function (`withTransaction`) that executes `client.release()` inside a `finally` block regardless of where the exception occurs.

---

## Hands-On Exercise: Implementing an End-to-End E-Commerce Order API

### Scenario

You are implementing the core order placement endpoint `POST /api/v1/orders` in an Express application backed by PostgreSQL.
The endpoint must:
1. Accept an order payload (`customerId`, `items`, `idempotencyKey`).
2. Run inside an atomic database transaction coordinating two separate repositories: `OrderRepository` and `InventoryRepository`.
3. Check stock availability and decrement inventory; if stock is insufficient, abort the transaction.
4. Record the order and order line items.
5. Capture duplicate idempotency keys and return `409 Conflict`.
6. Provide full RFC 7807 error translation.

### Acceptance Criteria

1. Implement `OrderRepository` and `InventoryRepository` supporting the executor (`dbOrClient`) pattern.
2. Implement `OrderService.placeOrder` managing client checkout, `BEGIN`, `COMMIT`, `ROLLBACK`, and `finally { client.release() }`.
3. Wire the Express controller and register `pgErrorMiddleware`.
4. Ensure zero client leaks on both successful orders and failed operations.

### Solution Code

```javascript
// Node.js code
import express from 'express';
import { z } from 'zod';

// ==========================================
// 1. REPOSITORIES
// ==========================================

export class InventoryRepository {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Atomically decrements stock if sufficient inventory exists
   */
  async decrementStock(productId, quantity, executor = this.pool) {
    const query = `
      UPDATE products
      SET stock_quantity = stock_quantity - $1,
          updated_at = NOW()
      WHERE id = $2 AND stock_quantity >= $1
      RETURNING id, name, stock_quantity, price_cents;
    `;
    const { rows, rowCount } = await executor.query(query, [quantity, productId]);
    if (rowCount === 0) {
      return null; // Insufficient stock or product not found
    }
    return rows[0];
  }
}

export class OrderRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async createOrder({ customerId, idempotencyKey, totalCents }, executor = this.pool) {
    const query = `
      INSERT INTO orders (customer_id, idempotency_key, total_cents, status, created_at)
      VALUES ($1, $2, $3, 'PLACED', NOW())
      RETURNING id, customer_id, idempotency_key, total_cents, status, created_at;
    `;
    const { rows } = await executor.query(query, [customerId, idempotencyKey, totalCents]);
    return rows[0];
  }

  async addOrderItems(orderId, items, executor = this.pool) {
    const query = `
      INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents)
      SELECT $1, u.product_id, u.quantity, u.unit_price_cents
      FROM UNNEST($2::uuid[], $3::int[], $4::int[]) 
        AS u(product_id, quantity, unit_price_cents)
      RETURNING id, order_id, product_id, quantity, unit_price_cents;
    `;
    const productIds = items.map((i) => i.productId);
    const quantities = items.map((i) => i.quantity);
    const prices = items.map((i) => i.unitPriceCents);

    const { rows } = await executor.query(query, [orderId, productIds, quantities, prices]);
    return rows;
  }
}

// ==========================================
// 2. SERVICE LAYER
// ==========================================

export class InsufficientStockError extends Error {
  constructor(productId) {
    super(`Insufficient stock for product ID: ${productId}`);
    this.name = 'InsufficientStockError';
    this.status = 422;
    this.productId = productId;
  }
}

export class OrderService {
  constructor(pool, orderRepo, inventoryRepo) {
    this.pool = pool;
    this.orderRepo = orderRepo;
    this.inventoryRepo = inventoryRepo;
  }

  async placeOrder({ customerId, idempotencyKey, items }) {
    // 1. Acquire dedicated client from pool for transaction
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      let totalCents = 0;
      const verifiedItems = [];

      // 2. Reserve inventory under transaction
      for (const item of items) {
        const product = await this.inventoryRepo.decrementStock(
          item.productId,
          item.quantity,
          client
        );

        if (!product) {
          throw new InsufficientStockError(item.productId);
        }

        const lineTotal = product.price_cents * item.quantity;
        totalCents += lineTotal;
        verifiedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPriceCents: product.price_cents
        });
      }

      // 3. Create order record
      const order = await this.orderRepo.createOrder(
        { customerId, idempotencyKey, totalCents },
        client
      );

      // 4. Batch insert line items
      const createdItems = await this.orderRepo.addOrderItems(order.id, verifiedItems, client);

      // 5. Commit atomic transaction
      await client.query('COMMIT');

      return {
        ...order,
        items: createdItems
      };
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rbErr) {
        // Suppress rollback errors if connection was severed
      }
      throw error;
    } finally {
      // 6. Guarantee client is returned to pool
      client.release();
    }
  }
}

// ==========================================
// 3. CONTROLLER & APPLICATION SETUP
// ==========================================

const PlaceOrderSchema = z.object({
  customerId: z.string().uuid(),
  idempotencyKey: z.string().min(10).max(100),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive()
    })
  ).min(1)
});

export function createOrderApp(pool) {
  const app = express();
  app.use(express.json());

  const inventoryRepo = new InventoryRepository(pool);
  const orderRepo = new OrderRepository(pool);
  const orderService = new OrderService(pool, orderRepo, inventoryRepo);

  app.post('/api/v1/orders', async (req, res, next) => {
    try {
      const validatedBody = PlaceOrderSchema.parse(req.body);
      const result = await orderService.placeOrder(validatedBody);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  });

  // Domain error handler
  app.use((err, req, res, next) => {
    if (err instanceof InsufficientStockError) {
      return res.status(422).json({
        type: 'https://api.domain.com/errors/insufficient-stock',
        title: 'Insufficient Stock',
        status: 422,
        detail: err.message,
        productId: err.productId
      });
    }
    next(err);
  });

  // Centralized PostgreSQL error middleware
  app.use((err, req, res, next) => {
    if (err.code === '23505' && err.constraint === 'orders_idempotency_key_key') {
      return res.status(409).json({
        type: 'https://api.domain.com/errors/duplicate-order',
        title: 'Order Conflict',
        status: 409,
        detail: 'An order with this idempotency key has already been processed.'
      });
    }
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation Error', issues: err.issues });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}
```

### Solution Explanation

1. **Clean Separation of Layers:** The Express route handler only validates the request body using Zod and delegates directly to `orderService.placeOrder`. It contains zero SQL, zero transaction commands, and zero driver code.
2. **Executor Abstraction (`dbOrClient`):** Both `OrderRepository` and `InventoryRepository` default to `this.pool`, but accept an optional `executor` argument. When called by the service, they receive the checked-out transactional `client`, executing all stock decrements, order insertions, and line-item writes within a single atomic database boundary.
3. **Guaranteed Client Release:** The `try...finally` block in `OrderService.placeOrder` ensures `client.release()` is executed regardless of whether the transaction commits, rolls back on insufficient stock, or crashes on a database constraint error.
4. **RFC 7807 Error Translation:** Duplicate idempotency keys trigger PostgreSQL SQLSTATE `23505`, which is captured by the centralized error middleware and converted into an HTTP `409 Conflict` Problem Details response.

---

## Summary

- Structure Express applications using 4 distinct architectural layers: Controller (HTTP), Service (Domain & Transactions), Repository (SQL & Queries), and Database Driver (`pg.Pool`).
- Use the **Executor Pattern (`dbOrClient`)** in repositories to allow methods to run either independently or composed together within a shared service-managed transaction.
- Translate PostgreSQL error codes (`23505`, `23503`, `23514`, `57014`) into RFC 7807 Problem Details using centralized Express error middleware.
- Decouple health checks: `/livez` must remain a shallow memory/uptime check to avoid cascading pod terminations, while `/readyz` queries the database with a strict 1-second timeout.
- Implement graceful shutdowns by first closing the HTTP server, allowing in-flight requests to complete, and draining the connection pool via `await pool.end()`.
- Choose PostgreSQL when workloads require strict relational integrity, complex joins, declarative constraints, and ACID transactions; choose MongoDB for high-volume single-document hierarchies.

---

## Cheat Sheet

| Architecture Component | Pattern / Technique | Key Benefit |
|---|---|---|
| **Controller** | Zod parse $\to$ Service call $\to$ HTTP 200/201 response | Clean HTTP boundary; no database coupling |
| **Service Layer** | `const client = await pool.connect()` + `client.query('BEGIN')` | Owns transaction boundaries and multi-repo orchestration |
| **Repository Layer** | `async find(id, executor = this.pool)` | Reusable across standalone and transactional contexts |
| **Centralized Error MW** | Match on `err.code` (e.g., `23505`, `23503`) | Translates SQLSTATE codes to RFC 7807 Problem Details |
| **Liveness Probe** | `res.status(200).json({ status: 'live' })` | Prevents cascading pod restarts during DB blips |
| **Readiness Probe** | `Promise.race([pool.query('SELECT 1'), timeout])` | Removes failing pods from load balancer routing |
| **Graceful Shutdown** | `server.close()` $\to$ `await pool.end()` $\to$ `exit(0)` | Zero dropped requests or severed transactions during rollouts |

---

## Interview Questions

### 1. How do you design a clean architecture in Node.js where multiple repositories can participate in a single atomic transaction without leaking the database client to the controller?

The standard pattern is the **Executor Abstraction (or Unit of Work Pattern)**. In this design, repositories do not hold a rigid dependency on `pg.Pool`. Instead, each repository method accepts an optional executor parameter:
```javascript
async createOrder(data, executor = this.pool) { ... }
```
The Controller interacts purely with the Service layer, passing validated DTOs and receiving domain entities. The Controller has no reference to database clients, connections, or SQL.

When a business operation requires multiple repositories to execute atomically, the **Service layer** manages the transaction boundary:
1. The Service checks out a dedicated client from the pool: `const client = await pool.connect()`.
2. The Service begins the transaction: `await client.query('BEGIN')`.
3. The Service invokes methods across multiple repositories (e.g., `orderRepo.create(data, client)` and `inventoryRepo.decrement(data, client)`), passing the `client` as the executor.
4. If all operations succeed, the Service commits: `await client.query('COMMIT')`.
5. In a `catch` block, it rolls back: `await client.query('ROLLBACK')`.
6. Crucially, in a `finally` block, the Service releases the client: `client.release()`.
This pattern keeps controllers decoupled from persistence details while giving the service layer full control over transaction scope.

---

### 2. Why is performing database ping queries inside Kubernetes `/livez` liveness probes an anti-pattern, and how should health checks be decoupled?

Including a database query inside the `/livez` liveness probe creates a severe **cascading failure trap**. 

In Kubernetes, if a container fails its `/livez` probe, the orchestrator immediately kills the container and starts a new pod. If your PostgreSQL database experiences a momentary traffic spike, connection pool saturation, or network blip, every Node.js pod's `/livez` probe will fail simultaneously. Kubernetes will respond by terminating every Node.js pod across the cluster. When the new pods spin up, they simultaneously hammer the already struggling database with connection requests during startup, causing a crash loop and total application blackout.

The solution is decoupling liveness and readiness probes:
- **`/livez` (Liveness):** A shallow, in-memory check verifying only that the Node.js process is running and its event loop is not blocked (`process.uptime()`). It never touches external network services.
- **`/readyz` (Readiness):** A dependency check verifying that the pod can actively process traffic. It runs a lightweight query (`SELECT 1`) guarded by a strict timeout (e.g., 1000ms). If the database becomes unreachable, `/readyz` fails, causing Kubernetes to remove the pod from the load balancer without killing the process. As soon as the database recovers, `/readyz` passes and traffic resumes automatically.

---

### 3. What is the exact sequence of events required for a zero-downtime graceful shutdown in an Express application backed by a PostgreSQL connection pool?

A graceful shutdown sequence must follow a strict chronological order to avoid dropping in-flight HTTP requests or terminating active database transactions:

1. **Signal Interception:** The process registers event listeners for `SIGTERM` and `SIGINT`.
2. **Readiness Probe Invalidation:** The application immediately flips an internal boolean flag (`isShuttingDown = true`), causing all subsequent `/readyz` health check requests to return `503 Service Unavailable`. This informs Kubernetes to stop routing new ingress traffic to this pod.
3. **HTTP Server Closure:** Call `server.close()`. This stops the HTTP server from accepting new TCP connections while allowing currently active HTTP requests to continue executing.
4. **Active Request Drain Window:** Allow in-flight requests a grace period (e.g., 5 to 10 seconds) to complete their application logic and return responses.
5. **Database Pool Drain:** Call `await pool.end()`. This built-in `node-postgres` method waits for all currently checked-out clients to be released back to the pool, sends a termination message to the PostgreSQL server, and closes all underlying database TCP sockets.
6. **Clean Exit:** Once `pool.end()` resolves, call `process.exit(0)`.
7. **Timeout Safeguard:** A watchdog timer (`setTimeout(..., 15000).unref()`) is armed at the start of shutdown. If any operation hangs or fails to drain, the timer fires and forces `process.exit(1)`.

---

### 4. When evaluating PostgreSQL vs MongoDB for a new Node.js microservice, what technical factors dictate choosing PostgreSQL over MongoDB?

You should choose PostgreSQL over MongoDB when the application workload is defined by the following characteristics:

1. **Relational Invariants and Referential Integrity:** If the domain contains entities with complex relationships (e.g., users, organizations, permissions, invoices, line items) where orphaned records would represent critical business or compliance failures. PostgreSQL's foreign keys with declarative referential actions (`RESTRICT`, `CASCADE`) guarantee consistency at the storage engine level.
2. **Multi-Entity ACID Transactions:** While MongoDB supports multi-document transactions, they incur significant latency and memory overhead on replica sets. PostgreSQL's MVCC transaction engine is mature, highly optimized, and supports fine-grained isolation levels (`Read Committed`, `Repeatable Read`, `Serializable`) with row-level locking (`FOR UPDATE`, `FOR NO KEY UPDATE`).
3. **Complex Reporting and Dynamic Aggregation:** When the business requires ad-hoc queries, multi-table joins, window functions, and analytics that are difficult or computationally expensive to express in MongoDB's aggregation pipeline.
4. **Schema Evolution and Strict Types:** When business invariants require mathematical bounds (`CHECK balance >= 0`) and strict column types enforced across all services.
5. **Hybrid Semi-Structured Needs:** PostgreSQL's native `JSONB` data type with GIN indexing allows applications to store flexible schemaless documents alongside rigid relational tables, providing the benefits of document storage without sacrificing relational guarantees.

---

<nav aria-label="Lecture navigation">

[Previous: PostgreSQL Transactions, MVCC, and Locks](day-31-postgresql-transactions-mvcc-and-locks.md) | [Roadmap](../node-roadmap.md) | [Next: Layered Backend Architecture](day-33-layered-backend-architecture.md)

</nav>