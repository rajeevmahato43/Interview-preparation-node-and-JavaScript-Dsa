# Day 27: PostgreSQL and `pg` Pool Lifecycle

<nav aria-label="Lecture navigation">

[Previous: MongoDB in Express](day-26-mongodb-in-express.md) | [Roadmap](../node-roadmap.md) | [Next: Parameterized SQL CRUD](day-28-parameterized-sql-crud.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain how a Node service connects to PostgreSQL with the `pg` library.
- Manage pool sizing, client checkout, and graceful shutdown.
- Understand why a database pool is a resource that must be monitored and closed.
- Separate the SQL layer from application logic.

## Prerequisites

- [Day 04: Process, Configuration, and Lifecycle](day-04-process-configuration-and-lifecycle.md)
- [Day 10: Networking, DNS, TLS, and Timeouts](day-10-networking-dns-tls-and-timeouts.md)
- [Day 12: Testing, Diagnostics, Observability, and Shutdown](day-12-testing-diagnostics-observability-and-shutdown.md)

## Core Concepts

### 1. `pg` uses a pool

The `pg` library provides a `Pool` object for reusing database connections. A Node API should create a pool once and reuse it.

```js
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});
```

### 2. Pool sizing is a tradeoff

Too few connections reduce throughput; too many increase concurrency pressure and memory usage. Pool sizing depends on database capacity, workload shape, and CPU/memory available to both app and database.

### 3. Query and client lifecycle

Every query uses a client from the pool. The pool handles connection reuse, but the application still owns its query ordering and timeout behavior.

```js
const result = await pool.query("SELECT 1");
```

## Detailed Explanations and Traces

### Graceful shutdown

```js
async function shutdown() {
  await pool.end();
  console.log("pool closed");
}
```

This is necessary because an open pool can keep the process alive or leave active connections hanging during exit.

### Query safety and parameterization

The pool returns rows and metadata, not just arrays. The service should use parameterized queries to avoid SQL injection and keep query structure separate from values.

## Common Mistakes and Interview Traps

- Creating a new pool in every request.
- Forgetting to close the pool on shutdown.
- Using string concatenation to build SQL.
- Ignoring pool saturation and database latency.

## Tricky Points

- Pool size is a system design choice, not just a config tweak.
- `pool.query` makes client acquisition and release implicit; understanding the underlying lifecycle still matters.
- A database is a shared resource, so connection count and timeouts are part of service health.

## Practical Exercise

**Goal:** Build a PostgreSQL pool module with query and shutdown helpers.

**Inputs and outputs:** A simple query to fetch a user by id and a shutdown function for the process.

**Constraints:** Use a pool, close it gracefully, and keep the module reusable in tests and production.

**Acceptance criteria:** The module can execute queries and shutdown cleanly without leaving dangling clients.

## Summary

- `pg` pools are essential for PostgreSQL-backed Node services.
- Pool size and query semantics are operational concerns.
- Close the pool during shutdown to avoid orphaned connections.

## Cheat Sheet

| Concern | Pattern |
|---|---|
| Connect | `new Pool(...)` |
| Query | `await pool.query(...)` |
| Shutdown | `await pool.end()` |
| Risk | pool exhaustion, leaked clients |
| Safety | parameterized queries |

## Interview Questions

1. **Definition:** Why does PostgreSQL access in Node usually use a pool instead of one direct connection?
   - **Expected answer:** A pool reuses connections, reduces connection overhead, and supports concurrency better than a single long-lived client.
   - **Follow-up:** What happens when the pool is too small or too large?

2. **Debugging:** A service starts rejecting queries under load. What do you inspect first?
   - **Expected answer:** Pool saturation, database latency, and connection count under pressure.
   - **Follow-up:** Why is the pool size not an arbitrary knob?

3. **Implementation:** Write a module that returns a query function and a shutdown function.
   - **Expected answer:** Keep the pool in module scope and export a small interface around it.
   - **Follow-up:** How does this affect tests and process lifecycle?

4. **Design:** Why is SQL injection prevention important even when the API looks simple?
   - **Expected answer:** Client input can appear in identifiers, filters, or values, and parameterized queries keep the query structure separate from data.
   - **Follow-up:** What does this protect beyond "bad user input"?

<nav aria-label="Lecture navigation">

[Previous: MongoDB in Express](day-26-mongodb-in-express.md) | [Roadmap](../node-roadmap.md) | [Next: Parameterized SQL CRUD](day-28-parameterized-sql-crud.md)

</nav>