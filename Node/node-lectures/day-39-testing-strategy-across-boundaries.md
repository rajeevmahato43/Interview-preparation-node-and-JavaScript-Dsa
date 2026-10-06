# Day 39: Testing Strategy Across Boundaries

<nav aria-label="Lecture navigation">

[Previous: Security Review of a Node Backend](day-38-security-review-of-a-node-backend.md) | [Roadmap](../node-roadmap.md) | [Next: Performance and Debugging Case Studies](day-40-performance-and-debugging-case-studies.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Structure a high-confidence test pyramid in Node.js balancing Unit Tests, HTTP Integration Tests, Database Integration Tests, and Contract Tests.
- Avoid the "Mocking Trap" (mocking what you don't own) by substituting database query builders with real test databases or contract-preserving in-memory fakes.
- Isolate database integration tests using the **Transactional Rollback Pattern** (`BEGIN` before test $\to$ `ROLLBACK` after test) to execute parallel, zero-leak tests at high speed.
- Test failure modes, timeouts, and cooperative cancellations (`AbortController`) without relying on brittle timing hacks or sleep loops.
- Detect and prevent asynchronous handle leaks (dangling timers, unclosed sockets) that prevent test runners and Node.js worker processes from exiting cleanly.
- Author robust test suites using native `node:test` and `node:assert` without third-party test framework overhead.

---

## Prerequisites

- [Day 12: Testing, Diagnostics, Observability, and Shutdown](day-12-testing-diagnostics-observability-and-shutdown.md) — Node test runner fundamentals, handle leaks, and lifecycle hooks.
- [Day 20: Express Security and HTTP Testing](day-20-express-security-and-http-testing.md) — Ephemeral port testing and Supertest integration.
- [Day 32: PostgreSQL in Express](day-32-postgresql-in-express.md) — Multi-layer architecture, repositories, and transaction isolation.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Production Impact |
|---|---|---|
| **Test Boundary** | The explicit interface seam (HTTP route, service interface, or database socket) where a test injects inputs and verifies assertions. | Defining the wrong boundary leads to brittle tests that break on minor refactors or pass despite production bugs. |
| **Transactional Rollback Isolation** | Running each database integration test inside a dedicated transaction that is rolled back in the test teardown (`afterEach`). | Enables instantaneous test cleanup without slow database table truncation or schema drops between tests. |
| **Mock vs Stub vs Fake** | **Stub:** Provides canned responses; **Mock:** Asserts interaction expectations; **Fake:** Working in-memory implementation of an interface. | Overusing mocks couples tests to internal code structure; Fakes test real behavioral invariants cleanly. |
| **Dangling Handle** | An unclosed TCP socket, active timer, or child process handle remaining registered in libuv's event loop after test completion. | Causes test runners (Jest, `node:test`) to hang indefinitely at the end of execution and leaks memory in production. |
| **Contract Testing** | Verifying that an API consumer and provider agree on shared request/response schemas (e.g., Pact) without deploying full clusters. | Eliminates integration surprises between microservices without the fragility and slow execution of end-to-end tests. |

---

## Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                       THE NODE.JS MICROSERVICE TESTING PYRAMID                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

                                   / \
                                  /   \
                                 / E2E \       • End-to-End Smoke Tests (Few, Slow, Fragile)
                                / Smoke \        Tests critical user journeys in staging.
                               /─────────\
                              /  Database \    • Repository Integration Tests (Real SQL/DB)
                             / Integration \     Verifies SQL syntax, indexes, constraints, ACID.
                            /───────────────\
                           /  HTTP Contract  \ • Route & Controller Tests (Injected Services)
                          /    Integration    \  Verifies status codes, headers, Zod validation.
                         /─────────────────────\
                        /   Pure Domain Unit    \• Domain Unit Tests (Many, Sub-Millisecond)
                       /         Tests           \ Pure functions, business calculations, rules.
                      /───────────────────────────\
```

### 1. Defining Test Boundaries: What to Test at Each Level

A reliable test suite tests the appropriate concern at the appropriate architectural boundary:

| Test Level | Target Architectural Seam | What It Validates | What Must Be Stubbed / Faked |
|---|---|---|---|
| **Domain Unit Test** | Domain Entities, Calculators, Invariant Rules | Pure business math, discount algorithms, permission matrices. | **Everything external.** Zero network, zero databases, zero HTTP. |
| **HTTP Integration Test** | Express Route $\to$ Controller $\to$ Error Middleware | Status codes (201, 400, 409), Zod validation schemas, RFC 7807 payloads, headers. | The **Service Layer** is injected with mock/stub responses. |
| **Database Integration Test** | Repository $\to$ Real PostgreSQL / MongoDB | Real SQL execution, constraints (`23505`, `23503`), transactions, complex joins. | External HTTP gateways (e.g., Stripe, Sendgrid). |
| **Contract Test** | Client SDK $\to$ Microservice API | Request/Response schema compatibility, breaking field changes. | Internal database and service internals. |

---

### 2. The Mocking Trap: Why Mocking What You Don't Own Fails

The most frequent architectural anti-pattern in Node.js testing is **mocking the database client**:

```javascript
// Node.js code
// anti-pattern: The Dangerous Mocking Trap
it('fetches active users', async () => {
  const fakePool = {
    query: jest.fn().mockResolvedValue({ rows: [{ id: 1, email: 'alice@corp.com' }] })
  };

  const userRepo = new UserRepository(fakePool);
  const result = await userRepo.findActiveUsers();

  expect(fakePool.query).toHaveBeenCalledWith(
    'SELECT * FROM users WHERE status = "active"' // ❌ INVALID SQL! Postgres uses single quotes!
  );
  expect(result).toHaveLength(1);
});
```

**The Disaster:** This test passes with 100% code coverage. But in production, PostgreSQL crashes immediately with a syntax error because double quotes (`"active"`) designate column identifiers, not string literals!
- **Rule:** *Never mock third-party drivers or query builders (`pg`, `knex`, `mongodb`). Test repositories against a real database instance (using Testcontainers or a dedicated local test database).*

---

### 3. Fast Database Isolation: The Transactional Rollback Pattern

Running database integration tests against a real database traditionally suffers from test pollution: Test A creates a user, leaving data that breaks Test B. Dropping and migrating schemas between every test is painfully slow (seconds per test).

The **Transactional Rollback Pattern** executes each test inside an isolated database transaction, rolling it back immediately in `afterEach()`:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                       TRANSACTIONAL ROLLBACK TEST ISOLATION                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Test Runner (beforeEach)
         │
         ▼
  1. Checks out dedicated Client from Test Pool: const client = await pool.connect();
  2. Begins Transaction: await client.query('BEGIN');
  3. Injects Client as Executor into Repository under test.
         │
         ▼
  Test Execution (it('creates user'))
  4. Repository executes INSERT INTO users (...) on the transactional client.
  5. Test verifies rows exist within this transaction's snapshot.
         │
         ▼
  Test Teardown (afterEach)
  6. Rolls back Transaction: await client.query('ROLLBACK');
  7. Releases Client back to pool: client.release();
  Outcome: Database remains 100% pristine! Zero disk cleanup overhead!
```

---

### 4. Detecting and Preventing Handle Leaks

Node.js test suites frequently fail to exit cleanly, printing warnings:
`Jest did not exit one second after the test run has completed...` or hanging indefinitely in `node:test`.

This is caused by **Dangling Handles** registered in libuv's event loop:
1. **Unclosed Connection Pools:** Failing to call `await pool.end()` in global teardown keeps TCP socket handles active.
2. **Active Periodic Timers:** `setInterval` timers that are not cleared or unreferenced (`.unref()`).
3. **Open HTTP Servers:** Failing to close `http.Server` instances in `after()`.

```javascript
// Node.js code
// pattern: Diagnostic handle leak detector in test teardown
export function logDanglingHandles() {
  const handles = process._getActiveHandles();
  console.log(`Active libuv handles remaining: ${handles.length}`);
  for (const handle of handles) {
    console.log(`- Type: ${handle.constructor.name}`);
    if (handle.hasRef && !handle.hasRef()) {
      console.log('  (Handle is unreferenced)');
    }
  }
}
```

---

## Detailed Explanations and Traces

### Native `node:test` Architecture

Node.js v18+ includes a built-in, zero-dependency test runner (`node:test`) and assertion library (`node:assert/strict`). It runs natively with ES Modules, executes tests in parallel worker threads, and avoids heavy Jest/Babel transformation overhead:

```javascript
// Node.js code
// pattern: Native node:test suite with lifecycle hooks
import { test, describe, beforeEach, afterEach, before, after } from 'node:test';
import assert from 'node:assert/strict';

describe('Order Pricing Domain Logic', () => {
  test('applies tiered discount correctly', () => {
    const total = calculateOrderTotal({
      items: [{ priceCents: 1000, quantity: 5 }],
      discountTier: 'GOLD' // 20% off
    });

    assert.equal(total, 4000);
  });

  test('rejects negative quantities with DomainError', () => {
    assert.throws(
      () => calculateOrderTotal({ items: [{ priceCents: 1000, quantity: -1 }] }),
      { name: 'DomainError', message: /Quantity must be positive/ }
    );
  });
});
```

---

## Common Mistakes and Interview Traps

### 1. Testing Implementation Details Instead of External Contracts

Refactoring a private helper function or renaming an internal variable should never break a test suite:
```javascript
// Node.js code
// ❌ BRITTLE TEST (Testing private implementation detail):
expect(service._calculateInternalTaxSubroutine).toHaveBeenCalled();

// ✅ ROBUST TEST (Testing observable behavioral contract):
const result = await service.calculateInvoice(order);
expect(result.taxTotal).toBe(15.50);
```

### 2. Flaky Async Tests: Race Conditions and Arbitrary `sleep()`

Using arbitrary timeouts (`await sleep(50)`) to wait for asynchronous background processing or database writes is an anti-pattern. If the CI server experiences a momentary CPU spike, the 50ms sleep expires before the background work completes, causing random test failures.
- **Rule:** *Never use arbitrary sleep timers to synchronize tests. Use deterministic event promises, polling predicates with timeouts, or explicit completion callbacks.*

---

## Hands-On Exercise: Comprehensive Multi-Boundary Test Suite

### Scenario

You are implementing the test suite for an e-commerce checkout workflow using native `node:test`.
The system consists of:
1. Pure domain pricing logic (`calculateDiscountedTotal`).
2. An Express HTTP controller validating input with Zod and returning `201 Created` or `400 Bad Request`.
3. A PostgreSQL `OrderRepository` persisting orders with `RETURNING *` and checking inventory.

### Acceptance Criteria

1. **Domain Unit Test:** Verify pricing math and boundary validations without any database or HTTP dependencies.
2. **HTTP Integration Test:** Test the Express controller using mock service injection, asserting that invalid payloads receive RFC 7807 `400 Bad Request`.
3. **Database Integration Test:** Test `OrderRepository` against a real PostgreSQL instance using the **Transactional Rollback Pattern** to guarantee zero data pollution.
4. **Lifecycle & Clean Teardown:** Ensure all database clients and HTTP servers are closed in teardown hooks, verifying that `node:test` exits with zero dangling handles.

### Solution Code

```javascript
// Node.js code
import { describe, test, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import pg from 'pg';
import { z } from 'zod';

// ==========================================
// 1. SYSTEM UNDER TEST
// ==========================================

// Domain Logic
export function calculateDiscountedTotal(items, discountCode) {
  if (!items || items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  let subtotal = 0;
  for (const item of items) {
    if (item.quantity <= 0 || item.unitPriceCents <= 0) {
      throw new Error('Quantity and price must be strictly positive');
    }
    subtotal += item.quantity * item.unitPriceCents;
  }

  let discountMultiplier = 0;
  if (discountCode === 'SAVE20') discountMultiplier = 0.20;
  if (discountCode === 'SAVE50') discountMultiplier = 0.50;

  return Math.round(subtotal * (1 - discountMultiplier));
}

// Repository
export class OrderRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async createOrder({ customerId, totalCents }, executor = this.pool) {
    const query = `
      INSERT INTO test_orders (customer_id, total_cents, created_at)
      VALUES ($1, $2, NOW())
      RETURNING id, customer_id, total_cents, created_at;
    `;
    const { rows } = await executor.query(query, [customerId, totalCents]);
    return rows[0];
  }
}

// HTTP Controller
const CheckoutSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    unitPriceCents: z.number().int().positive()
  })).min(1),
  discountCode: z.string().optional()
});

export function createCheckoutApp(checkoutService) {
  const app = express();
  app.use(express.json());

  app.post('/api/checkout', async (req, res) => {
    const parseResult = CheckoutSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        type: 'https://api.domain.com/errors/validation',
        title: 'Validation Error',
        status: 400,
        errors: parseResult.error.issues
      });
    }

    try {
      const order = await checkoutService.processCheckout(parseResult.data);
      res.status(201).json({ data: order });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return app;
}

// ==========================================
// 2. TEST SUITE (node:test)
// ==========================================

describe('Checkout System Multi-Boundary Test Suite', () => {

  // ----------------------------------------
  // A. DOMAIN UNIT TESTS
  // ----------------------------------------
  describe('Domain Layer: calculateDiscountedTotal', () => {
    test('calculates correct total with valid discount code', () => {
      const items = [
        { quantity: 2, unitPriceCents: 1000 }, // 2000
        { quantity: 1, unitPriceCents: 3000 }  // 3000 -> Total: 5000
      ];
      const finalTotal = calculateDiscountedTotal(items, 'SAVE20');
      assert.equal(finalTotal, 4000); // 20% off 5000 = 4000
    });

    test('throws error when items array is empty', () => {
      assert.throws(() => calculateDiscountedTotal([], 'SAVE20'), {
        message: 'Order must contain at least one item'
      });
    });

    test('throws error on non-positive item quantities', () => {
      assert.throws(() => calculateDiscountedTotal([{ quantity: -2, unitPriceCents: 100 }]), {
        message: 'Quantity and price must be strictly positive'
      });
    });
  });

  // ----------------------------------------
  // B. HTTP INTEGRATION TESTS (In-Memory App)
  // ----------------------------------------
  describe('HTTP Presentation Layer: POST /api/checkout', () => {
    let server;
    let baseUrl;
    let mockService;

    before(async () => {
      mockService = {
        processCheckout: async (dto) => ({
          id: 'ord-123',
          customerId: dto.customerId,
          totalCents: 5000
        })
      };

      const app = createCheckoutApp(mockService);
      await new Promise((resolve) => {
        server = app.listen(0, () => {
          const port = server.address().port;
          baseUrl = `http://127.0.0.1:${port}`;
          resolve();
        });
      });
    });

    after(async () => {
      // Clean up HTTP server to eliminate dangling socket handles
      await new Promise((resolve) => server.close(resolve));
    });

    test('returns 201 Created for valid checkout payload', async () => {
      const payload = {
        customerId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        items: [{
          productId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
          quantity: 2,
          unitPriceCents: 2500
        }]
      };

      const response = await fetch(`${baseUrl}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      assert.equal(response.status, 201);
      const data = await response.json();
      assert.equal(data.data.id, 'ord-123');
    });

    test('returns 400 Bad Request when customerId is not a valid UUID', async () => {
      const invalidPayload = {
        customerId: 'invalid-non-uuid-string',
        items: []
      };

      const response = await fetch(`${baseUrl}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPayload)
      });

      assert.equal(response.status, 400);
      const problem = await response.json();
      assert.equal(problem.status, 400);
      assert.equal(problem.title, 'Validation Error');
    });
  });

  // ----------------------------------------
  // C. DATABASE INTEGRATION TESTS (Transactional Rollback)
  // ----------------------------------------
  describe('Persistence Layer: OrderRepository (Transactional Isolation)', () => {
    let pool;
    let testClient;
    let orderRepo;

    before(async () => {
      pool = new pg.Pool({
        connectionString: process.env.TEST_DATABASE_URL || 'postgres://localhost:5432/test_db',
        max: 5
      });

      // Prepare ephemeral table structure
      await pool.query(`
        CREATE TEMPORARY TABLE IF NOT EXISTS test_orders (
          id SERIAL PRIMARY KEY,
          customer_id UUID NOT NULL,
          total_cents INT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL
        );
      `);

      orderRepo = new OrderRepository(pool);
    });

    after(async () => {
      // Drain pool to eliminate dangling database socket handles
      await pool.end();
    });

    beforeEach(async () => {
      // Check out client and BEGIN transaction for isolated test run
      testClient = await pool.connect();
      await testClient.query('BEGIN');
    });

    afterEach(async () => {
      // ROLLBACK transaction and release client immediately
      try {
        await testClient.query('ROLLBACK');
      } finally {
        testClient.release();
      }
    });

    test('persists order and retrieves generated columns using RETURNING clause', async () => {
      const order = await orderRepo.createOrder(
        {
          customerId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          totalCents: 9500
        },
        testClient // Injects isolated transaction client!
      );

      assert.ok(order.id);
      assert.equal(order.total_cents, 9500);

      // Verify row exists within current transaction snapshot
      const check = await testClient.query(
        'SELECT id FROM test_orders WHERE id = $1',
        [order.id]
      );
      assert.equal(check.rowCount, 1);
    });

    test('subsequent test observes zero data leakage from previous test', async () => {
      // Verifies that afterEach ROLLBACK left the table completely pristine!
      const check = await testClient.query('SELECT COUNT(*) AS total FROM test_orders');
      assert.equal(Number(check.rows[0].total), 0);
    });
  });
});
```

### Solution Explanation

1. **Pure Domain Boundary:** The `calculateDiscountedTotal` tests execute in memory with zero dependencies, testing discount calculations and edge-case exceptions within microseconds.
2. **HTTP Layer Testing via Dynamic Ephemeral Ports:** The HTTP tests start Express using `app.listen(0)` on an OS-assigned dynamic port, testing the real HTTP pipeline (headers, JSON parsing, Zod schemas) without port collisions. The server is explicitly closed in `after()` to prevent socket leaks.
3. **Zero-Pollution Transactional Rollbacks:** `OrderRepository` tests execute inside a checked-out client with an active `BEGIN` statement. Mutations occur inside the isolated transaction. In `afterEach()`, `ROLLBACK` wipes the data instantly without expensive database truncation scripts.
4. **Guaranteed Handle Teardown:** Both `server.close()` and `await pool.end()` ensure that all HTTP and database socket handles are closed, allowing `node:test` to terminate cleanly.

---

## Summary

- Choose test boundaries deliberately: Domain Unit tests verify business rules in memory; HTTP Integration tests verify status codes and validation; Database Integration tests verify SQL queries and constraints against a real database.
- Never mock database drivers (`pg`, `mongodb`); mocking what you don't own masks SQL syntax errors and constraint failures.
- The **Transactional Rollback Pattern** provides fast, isolated database testing by executing each test inside an active transaction and rolling it back in `afterEach()`.
- Test failure paths, timeouts, and cancellations using `AbortController` rather than fragile timing hacks.
- Always drain connection pools and close HTTP servers in test teardown hooks to eliminate dangling libuv handles that cause test runners to hang.

---

## Cheat Sheet

| Test Pattern | Implementation | Key Operational Benefit |
|---|---|---|
| **Domain Unit Test** | `assert.equal(calculateTax(100), 10)` | Microsecond execution; zero external dependencies |
| **HTTP Boundary** | `app.listen(0)` on ephemeral port | Tests real HTTP status codes, Zod validation, headers |
| **Transactional Rollback**| `beforeEach: BEGIN; afterEach: ROLLBACK` | Real SQL testing with zero database pollution |
| **Handle Teardown** | `await pool.end(); server.close()` | Prevents test runners from hanging on dangling handles |
| **Timeout Testing** | `AbortSignal.timeout(100)` | Tests client cancellation deterministically |
| **Native Test Runner**| `import { test } from 'node:test'` | Zero-dependency, native ESM test execution |

---

## Interview Questions

### 1. What is the "Mocking Trap" (or mocking what you don't own), and why does it lead to false confidence in Node.js backend testing?

The Mocking Trap occurs when developers use mocking libraries to simulate complex third-party libraries, database drivers, or ORMs (such as `pg.Pool`, MongoDB driver, or AWS SDKs) rather than testing against the actual dependency or defining their own abstraction boundaries:
```javascript
// Mocking the pg driver directly:
jest.spyOn(pool, 'query').mockResolvedValue({ rows: [...] });
```
This leads to false confidence because the test is no longer testing the contract between the application and the database. It is merely testing that your code invokes the mock with whatever arbitrary string you wrote.
1. **Masks SQL Syntax Errors:** If you make a typo in a SQL statement (`SEELCT * FROM users`), use invalid dialect syntax, or mix single and double quotes, the mock resolves successfully and the test passes.
2. **Ignores Database Constraints:** It cannot test unique constraint violations (`23505`), foreign key failures, check constraints, or transaction rollbacks.
3. **Breaks on Library Updates:** If the driver's internal API changes, your tests continue to pass because you mocked the old implementation.

**Senior Solution:** Apply the Dependency Inversion Principle. Either:
- Write repository integration tests against a real database (e.g., using Testcontainers).
- Create a domain-level repository interface (`UserRepository`) and mock or fake your own interface, not the third-party database driver.

---

### 2. How does the Transactional Rollback Pattern work in database integration testing, and what are its advantages over database truncation or re-migration?

In traditional database integration testing, ensuring that tests do not pollute each other requires cleaning the database after each test run. Common legacy approaches include:
- Dropping and re-running all database migrations before every test.
- Executing `TRUNCATE TABLE` across all database tables in `afterEach()`.
Both approaches are very slow. Truncating dozens of tables requires acquiring table locks and performing disk operations, adding hundreds of milliseconds to every test and slowing down CI pipelines.

The **Transactional Rollback Pattern** provides isolation with minimal overhead:
1. In `beforeEach()`, the test checks out a dedicated client from the pool and starts a transaction:
   ```javascript
   const client = await pool.connect();
   await client.query('BEGIN');
   ```
2. The repository or service under test is configured to execute all its SQL queries using this specific `client` as its executor.
3. The test executes its operations and asserts that rows exist within this transaction's snapshot.
4. In `afterEach()`, the test rolls back the transaction and returns the client to the pool:
   ```javascript
   await client.query('ROLLBACK');
   client.release();
   ```
Because PostgreSQL transactions are executed in memory and never committed to the table heap, rolling back takes less than a millisecond. The database remains completely clean, allowing hundreds of integration tests to run in seconds.

---

### 3. What causes Node.js test runners (like Jest or `node:test`) to hang indefinitely after tests complete, and how do you systematically diagnose the issue?

Test runners hang when the Node.js process cannot exit. Under Node.js event-loop rules, the process will only terminate when the **libuv event loop has no active handles or active requests remaining** (its reference count reaches zero).

Common causes of dangling handles in test suites include:
1. **Unclosed Database Pools:** `pg.Pool` or MongoDB connection pools maintain open TCP sockets waiting for queries. Unless `await pool.end()` or `await client.close()` is executed in a global `after()` hook, the open sockets prevent process termination.
2. **Active Periodic Timers:** A background module (e.g., a token refresher, cache cleaner, or metrics reporter) initialized a `setInterval()` that was not cleared with `clearInterval()` and was not marked as unreferenced (`timer.unref()`).
3. **Unclosed HTTP Servers:** An Express `server.listen()` instance was not closed via `server.close()`.

**Systematic Diagnosis:**
Inspect active libuv handles using Node's internal API:
```javascript
const handles = process._getActiveHandles();
console.log(handles.map(h => h.constructor.name));
```
Alternatively, use Node's `wtfnode` package or run the test runner with `--detectOpenHandles` (in Jest) to print the exact stack trace where the unclosed timer, socket, or file descriptor was initially created.

---

### 4. What is Contract Testing (e.g., using Pact), and how does it prevent breaking changes in distributed microservices without the overhead of end-to-end tests?

In a microservices architecture, deploying full End-to-End (E2E) testing environments to verify that Service A can communicate with Service B is expensive, slow, and prone to flaky network failures. Conversely, testing with static mocks risks deploying breaking changes if Service B modifies a response field without Service A updating its mock.

**Contract Testing** verifies that two microservices agree on a shared boundary contract (request structure, headers, response status, and response JSON schema) without requiring both services to run simultaneously:
1. **Consumer-Driven Contract:** The consumer service (e.g., Web API) defines its expectations (what payload it sends and what response structure it needs) in a machine-readable "Pact" file.
2. **Consumer Test:** The consumer runs tests against a local Pact mock server that verifies the consumer's client SDK produces requests matching the contract.
3. **Provider Verification:** The Pact contract file is published to a shared repository (Pact Broker). The provider service (e.g., Billing Service) pulls the contract and replays the requests against its real endpoints during its own CI pipeline.
4. If the provider modifies or removes a required field, the contract test fails in the provider's pipeline *before* the code is ever merged or deployed. This provides end-to-end integration safety at the speed and reliability of unit tests.

---

<nav aria-label="Lecture navigation">

[Previous: Security Review of a Node Backend](day-38-security-review-of-a-node-backend.md) | [Roadmap](../node-roadmap.md) | [Next: Performance and Debugging Case Studies](day-40-performance-and-debugging-case-studies.md)

</nav>