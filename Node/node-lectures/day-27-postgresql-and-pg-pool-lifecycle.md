# Day 27: PostgreSQL and `pg` Pool Lifecycle

<nav aria-label="Lecture navigation">

[← Previous: MongoDB in Express](day-26-mongodb-in-express.md) | [Roadmap](../node-roadmap.md) | [Next: Parameterized SQL CRUD](day-28-parameterized-sql-crud.md)

</nav>

## Prerequisites

Before diving into PostgreSQL pool internals, review:
- [Day 04: Process, Configuration, and Lifecycle](day-04-process-configuration-and-lifecycle.md) for OS signals (`SIGTERM`) and process exit states.
- [Day 10: Networking, DNS, TLS, and Timeouts](day-10-networking-dns-tls-and-timeouts.md) for TCP sockets and connection timeouts.
- [Day 12: Testing, Diagnostics, Observability, and Shutdown](day-12-testing-diagnostics-observability-and-shutdown.md) for open handle tracking and ephemeral port teardown.
- [Day 13: Express Application Structure](day-13-express-application-structure.md) for Composition Root dependency wiring.
---

## Core Concepts

### 1. PostgreSQL's Process-Per-Connection Architecture

> **Process-Per-Connection**: PostgreSQL's native process model where each connected client spawns a dedicated OS backend process (`postgres: worker`).

Unlike Node.js (which uses a single-threaded non-blocking event loop) or threaded databases, PostgreSQL uses a **process-based concurrency architecture**:

```text
Node.js Application Pool               PostgreSQL Database Server (Host OS)
┌─────────────────────────┐            ┌────────────────────────────────────────┐
│ Client Socket 1 (TCP)   │ ─────────► │ Forked OS Process: postgres: worker 1  │
│ Client Socket 2 (TCP)   │ ─────────► │ Forked OS Process: postgres: worker 2  │
│ Client Socket 3 (TCP)   │ ─────────► │ Forked OS Process: postgres: worker 3  │
└─────────────────────────┘            └────────────────────────────────────────┘
                                       Each Postgres backend process allocates:
                                       - 5MB - 10MB private OS virtual memory
                                       - Shared memory locks and catalog caches
```

#### The Connection Exhaustion Hazard:
If your cluster has 20 Node.js API pods and each pod configures `max: 50`:
$$\text{Total Active Connections} = 20 \times 50 = 1,000 \text{ connections}$$
1,000 PostgreSQL worker processes consume ~10GB of database server RAM strictly for connection management overhead. The server's CPU spends more time context-switching between 1,000 processes than executing SQL queries, triggering severe performance collapse.

---

### 2. Client Acquisition: `pool.query()` vs `pool.connect()`

The `pg` library offers two distinct execution mechanisms:

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. Implicit Checkout: pool.query(sql, params)               │
│ - Checks out client from pool                               │
│ - Executes single SQL query                                 │
│ - Automatically calls client.release() in internal finally  │
│ - ✅ Best for: Independent, single-statement CRUD queries   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. Manual Checkout: const client = await pool.connect()     │
│ - Manually checks out client from pool                      │
│ - Caller OWNS the connection until client.release()         │
│ - ⚠️ DANGER: If client.release() is not in finally, LEAKS!   │
│ - ✅ Mandatory for: Multi-statement Transactions (BEGIN)    │
└─────────────────────────────────────────────────────────────┘
```

#### The Transaction Rule:
You **cannot** run transactions with `pool.query()`:
```js
// ❌ CRITICAL BUG: Each query acquires a DIFFERENT pool client!
await pool.query('BEGIN');                                    // Runs on Client A
await pool.query('UPDATE accounts SET balance = balance - 100');// Runs on Client B
await pool.query('COMMIT');                                   // Runs on Client C
// Client A holds an open uncommitted transaction lock forever!
```
Transactions **must** acquire a dedicated client via `pool.connect()`, execute all commands on that same `client`, and release the client in a `finally` block.

---

### 3. The Leaked Client Deadlock

When a client is checked out with `pool.connect()`, the pool increments its active connection count. If an unhandled exception bypasses `client.release()`:

```text
Pool configured with max: 3
1. Request 1 checks out Client 1 -> Throws error -> Release forgotten! (1 active, 2 free)
2. Request 2 checks out Client 2 -> Throws error -> Release forgotten! (2 active, 1 free)
3. Request 3 checks out Client 3 -> Throws error -> Release forgotten! (3 active, 0 free)
4. Request 4 arrives:
   Pool is fully saturated (0 free)!
   Request 4 queues in memory waiting for a client to be released...
   Wait never ends! Entire Node API freezes and times out!
```

#### Safe Client Cleanup:
```js
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // ... execute statements
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK').catch(() => {});
  throw err;
} finally {
  // ✅ Guaranteed execution: Always returns client to pool
  client.release();
}
```

---

### 4. Sizing the Connection Pool Mathematically

A common myth is that larger pool sizes equal higher throughput. In reality, oversized connection pools degrade database throughput due to disk spindle contention and CPU thrashing.

The **HikariCP Pool Formula** provides a proven empirical baseline for sizing connection pools:

$$\text{Pool Size} = (\text{Database CPU Cores} \times 2) + \text{Effective Spindle Count}$$

- For a dedicated database server with 4 CPU cores and fast NVMe SSD storage:
  $$\text{Target Postgres Connections} = (4 \times 2) + 1 = 9 \text{ to } 10 \text{ connections}$$
- If you deploy 5 Node.js API container replicas against this database:
  $$\text{Max Pool Per Pod} = \frac{10}{5} = 2 \text{ to } 3 \text{ connections per pod!}$$

A small, saturated pool of 10 connections executing fast queries in 2ms throughputs vastly more operations than a bloated pool of 200 connections queuing on disk locks.

---

### 5. Idle Socket Teardown & The Background Error Event

When PostgreSQL idle connections sit open in a pool, stateful firewalls, cloud load balancers, or the database server itself may terminate the TCP socket after an idle timeout.

When a pooled idle connection is severed remotely:
- Node's underlying `net.Socket` receives an `ECONNRESET` or `FIN` packet.
- If the application has not registered an error listener on the pool, Node.js treats the unhandled `'error'` event as a fatal exception and **crashes the entire process**!

```js
// ✅ MANDATORY PRODUCTION LISTENER:
pool.on('error', (err, client) => {
  console.error('[pg.Pool] Unexpected error on idle client socket:', err.message);
  // Do NOT re-throw! The pool automatically removes the dead client from its pool!
});
```

---

## Code Snippets and Demonstrations

### 1. Enterprise `pg.Pool` Database Manager

> **`pg.Pool`**: An in-memory connection pool managing a set of reusable, persistent TCP clients connected to PostgreSQL.

Configuring timeouts, pool limits, and idle error listeners with graceful drain capabilities.

```js
// Node.js code
// filename: pg-connection-manager.mjs
import pg from 'pg';
const { Pool } = pg;

export class PostgresDatabaseManager {
  constructor(config = {}) {
    this.pool = new Pool({
      connectionString: config.connectionString || process.env.DATABASE_URL,
      max: config.max || 10,                          // Maximum active sockets
      min: config.min || 2,                           // Minimum pre-warmed sockets
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,       // 30s before idle close
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2500, // 2.5s wait timeout
      application_name: config.applicationName || 'node_api_service'
    });

    this.isDraining = false;

    // 1. Mandatory Idle Client Error Listener
    this.pool.on('error', (err, client) => {
      console.error('[pg.Pool] Background socket error on idle client:', err.message);
      // The pool handles removing the broken socket internally
    });

    // 2. Telemetry and lifecycle logging
    this.pool.on('connect', (client) => {
      console.log('[pg.Pool] New backend connection established to PostgreSQL.');
    });
  }

  /**
   * Executes a single query using implicit client acquisition.
   */
  async query(text, params) {
    if (this.isDraining) {
      throw new Error('Database pool is shutting down. Rejecting query.');
    }
    return await this.pool.query(text, params);
  }

  /**
   * Acquires a client for manual multi-statement transactions.
   */
  async connect() {
    if (this.isDraining) {
      throw new Error('Database pool is shutting down. Rejecting client checkout.');
    }
    return await this.pool.connect();
  }

  /**
   * Administrative healthcheck.
   */
  async ping() {
    const start = Date.now();
    await this.pool.query('SELECT 1 AS heartbeat');
    return Date.now() - start;
  }

  /**
   * Idempotent graceful shutdown.
   */
  async close() {
    if (this.isDraining) return;
    this.isDraining = true;

    console.log('[pg.Pool] Closing pool and draining active connections...');
    try {
      await this.pool.end();
      console.log('[pg.Pool] All connections drained cleanly.');
    } catch (err) {
      console.error('[pg.Pool] Error during pool teardown:', err.message);
      throw err;
    }
  }
}
```

---

### 2. Transaction Helper with Leak-Proof Cleanup

A higher-order wrapper that manages checkout, `BEGIN`, `COMMIT`, `ROLLBACK`, and guaranteed release.

```js
// Node.js code
// filename: transaction-runner.mjs

/**
 * Executes a callback within a managed PostgreSQL transaction.
 * Guarantees that the client is always released back to the pool.
 */
export async function withTransaction(dbManager, transactionFn) {
  const client = await dbManager.connect();

  try {
    await client.query('BEGIN');

    // Execute user transaction logic passing the checked-out client
    const result = await transactionFn(client);

    await client.query('COMMIT');
    return result;
  } catch (err) {
    // Attempt rollback; catch and log secondary rollback errors
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('[withTransaction] Rollback failed:', rollbackErr.message);
    }
    throw err;
  } finally {
    // ✅ CRITICAL: Guarantees client release even if queries or rollback throw
    client.release();
  }
}
```

---

### 3. Safe Client Eviction via `client.release(err)`

Demonstrating how to destroy a corrupted client socket instead of returning it to the pool.

```js
// Node.js code
// filename: safe-eviction.mjs

export async function executeRiskyQuery(dbManager, sqlText) {
  const client = await dbManager.connect();
  let fatalError = false;

  try {
    const res = await client.query(sqlText);
    return res.rows;
  } catch (err) {
    // If error indicates broken socket state or connection drop
    if (err.code === '57P01' || err.message.includes('connection')) {
      fatalError = true;
    }
    throw err;
  } finally {
    // Passing true or an Error to client.release() instructs the pool
    // to DESTROY the underlying TCP socket instead of recycling a dirty client!
    if (fatalError) {
      console.warn('[pg.Pool] Evicting corrupted client from pool.');
      client.release(true);
    } else {
      client.release();
    }
  }
}
```

---

## Edge Cases and Tricky Scenarios

### 1. The Missing `connectionTimeoutMillis` Infinite Hang

> **`connectionTimeoutMillis`**: The duration a query waits in the pool's FIFO queue for a free connection before throwing an error.

By default in `pg`, `connectionTimeoutMillis` is `0` (disabled).
- **The Failure**: Under peak traffic, all connections in the pool become checked out.
- When the 11th request arrives, the pool puts the request in an internal JavaScript array queue.
- If the database suffers a lock deadlock and connections never return, the request sits in the queue **forever**.
- Incoming HTTP requests pile up in Node.js memory until the container crashes from memory starvation.
- **The Fix**: Always configure an explicit `connectionTimeoutMillis: 2500`. If a connection cannot be acquired within 2.5 seconds, the pool throws an error immediately, allowing Express to return an HTTP 503.

### 2. Leaking Listeners with `LISTEN / NOTIFY`

PostgreSQL supports pub/sub via `LISTEN channel_name` and `NOTIFY channel_name`.
- **The Trap**: If you execute `client.query('LISTEN events')` and subsequently return that client to the pool via `client.release()`, that client is now listening on the channel. When another route borrows the client for an unrelated query, notification events trigger unexpected callbacks.
- **The Rule**: Sockets using `LISTEN` must be dedicated, persistent `Client` instances created outside the `Pool`, and must never be released back into a shared query pool.

---

## Node.js, JavaScript, and Systems Connections

```text
┌──────────────────────────────────────────────────────────────┐
│ V8 Microtask & Promise Engine                                │
│ - pool.connect() allocates net.Socket wrapper                │
│ - finally { client.release() } guarantees return on tick     │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Node.js libuv Layer                                          │
│ - net.Socket managing raw PostgreSQL binary wire protocol    │
│ - Socket Keep-Alive probes & idle timeout timers             │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ PostgreSQL Server Host                                       │
│ - postmaster process forks dedicated postgres worker process │
│ - Allocates private virtual memory space per socket          │
│ - Max connections limit enforced by OS process table         │
└──────────────────────────────────────────────────────────────┘
```

- **Socket Events**: Each `pg.Client` encapsulates a native `net.Socket`. If the remote PostgreSQL daemon restarts, the socket emits `'end'` and `'error'`, caught by the pool's error handler.
- **WiredTiger vs Postgres Memory**: Unlike MongoDB's threaded architecture, PostgreSQL assigns a separate OS process to each connection, making connection count control critical for preventing host out-of-memory crashes.

---

## Hands-On Exercise

### Scenario
A billing microservice running in production suffers from recurring pool deadlocks:
1. In the checkout controller, an engineer uses `pool.connect()` to update an order, but an uncaught exception skips `client.release()`. After 10 requests, the entire API freezes.
2. The pool lacks an idle error listener; when AWS RDS drops idle connections overnight, the Node process crashes with an unhandled `'error'` event.
3. Multiple queries inside a transaction are executed with `pool.query()`, causing queries to execute on random different clients and leaving uncommitted database locks.

### Buggy Code

```js
// Node.js code
// filename: buggy-postgres-service.mjs
const { Pool } = require('pg');

// ❌ ANTI-PATTERN 1: No error listener, no timeouts configured!
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5
});

// ❌ ANTI-PATTERN 2: Client leak! If validation fails, client is never released!
async function processCheckout(userId, amount) {
  const client = await pool.connect();
  
  if (amount <= 0) {
    throw new Error('Invalid amount'); // LEAKS CLIENT! client.release() is bypassed!
  }

  await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, userId]);
  client.release();
}

// ❌ ANTI-PATTERN 3: Transaction queries executed across different pool clients!
async function transferFunds(fromId, toId, amount) {
  await pool.query('BEGIN'); // Runs on Client A
  await pool.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, fromId]); // Client B
  await pool.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, toId]);   // Client C
  await pool.query('COMMIT'); // Client D
}

module.exports = { pool, processCheckout, transferFunds };
```

### Acceptance Criteria
1. Wrap `pg.Pool` with mandatory idle error listeners and strict `connectionTimeoutMillis: 2000`.
2. Refactor `processCheckout` to guarantee client release in a `try ... finally` block.
3. Refactor `transferFunds` using a dedicated single client inside `withTransaction()`.
4. Provide a test suite using `node:test` verifying that client release occurs even when business errors are thrown, preventing pool exhaustion.

### Solution Code

```js
// Node.js code
// filename: solution-postgres-service.mjs
import pg from 'pg';
const { Pool } = pg;

export class ResilientPostgresService {
  constructor(config = {}) {
    this.pool = new Pool({
      connectionString: config.connectionString || 'postgres://localhost:5432/testdb',
      max: config.max || 5,
      connectionTimeoutMillis: 2000,
      idleTimeoutMillis: 10000
    });

    // ✅ FIX 1: Mandatory idle error listener prevents process crash
    this.pool.on('error', (err) => {
      console.error('[pg.Pool] Background idle connection error:', err.message);
    });
  }

  // ✅ FIX 2: Guaranteed client release via try/finally
  async processCheckout(userId, amount) {
    const client = await this.pool.connect();
    try {
      if (amount <= 0) {
        throw new Error('Invalid amount');
      }

      const res = await client.query(
        'UPDATE accounts SET balance = balance - $1 WHERE id = $2 RETURNING balance',
        [amount, userId]
      );
      return res.rows[0];
    } finally {
      client.release(); // Always executed regardless of exceptions!
    }
  }

  // ✅ FIX 3: Transaction executed entirely on a single dedicated client
  async transferFunds(fromId, toId, amount) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
        [amount, fromId]
      );
      await client.query(
        'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
        [amount, toId]
      );

      await client.query('COMMIT');
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}
```

Accompanying test suite:
```js
// Node.js code
// filename: solution-postgres-service.test.mjs
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ResilientPostgresService } from './solution-postgres-service.mjs';

// Mock Pool implementation to verify checkout/release lifecycle without live Postgres
class MockPgPool {
  constructor(max = 2) {
    this.max = max;
    this.activeCheckouts = 0;
  }
  async connect() {
    if (this.activeCheckouts >= this.max) {
      throw new Error('Pool exhausted: timeout waiting for connection');
    }
    this.activeCheckouts++;
    return {
      query: async (sql, params) => ({ rows: [{ balance: 100 }] }),
      release: () => {
        this.activeCheckouts--;
      }
    };
  }
  async end() {}
}

describe('PostgreSQL Pool Lifecycle Tests', () => {
  it('guarantees client release on error, preventing pool exhaustion', async () => {
    const mockPool = new MockPgPool(2);
    const service = new ResilientPostgresService({});
    service.pool = mockPool; // Inject mock pool

    // Run 5 failing checkout calls sequentially
    for (let i = 0; i < 5; i++) {
      await assert.rejects(
        async () => {
          await service.processCheckout('usr_1', -50); // Negative amount throws!
        },
        /Invalid amount/
      );
    }

    // Verify active checkouts is 0 (No leaked connections!)
    assert.equal(mockPool.activeCheckouts, 0);

    // Verify subsequent call still succeeds
    const res = await service.processCheckout('usr_1', 50);
    assert.equal(res.balance, 100);
    assert.equal(mockPool.activeCheckouts, 0);
  });
});
```

### Solution Explanation
1. **Guaranteed Release**: The `try ... finally` block ensures that `client.release()` is executed regardless of whether the business logic throws a validation error or network drop, eliminating pool deadlocks.
2. **Idle Error Protection**: Registering `this.pool.on('error')` intercepts background TCP disconnections, preventing uncaught exceptions.
3. **Transactional Isolation**: All transaction commands execute on the same checked-out `client` instance, ensuring `BEGIN`, `UPDATE`, and `COMMIT` operate within the exact same database worker process.

---

## Summary

- PostgreSQL uses a process-per-connection architecture; excessive connections consume server RAM and degrade performance.
- Always configure `pg.Pool` with `connectionTimeoutMillis` to prevent infinite request queuing during pool exhaustion.
- Use `pool.query()` for independent single queries; use `pool.connect()` with `try ... finally { client.release(); }` for multi-step transactions.
- Never execute multi-statement transactions across `pool.query()` calls; transactions must execute on a single checked-out client.
- Register an error listener on `pool.on('error')` to intercept idle TCP socket drops without crashing the Node.js process.
- Size connection pools mathematically across pods using the HikariCP formula: $(\text{cores} \times 2) + \text{spindles}$.

---

## Cheat Sheet

| Directive / Option | Configuration | Primary Responsibility |
| :--- | :--- | :--- |
| **Max Connections** | `new Pool({ max: 10 })` | Caps concurrent sockets per Node.js instance |
| **Connection Timeout** | `connectionTimeoutMillis: 2500` | Fails fast when pool is saturated |
| **Idle Timeout** | `idleTimeoutMillis: 30000` | Reclaims idle sockets after 30s |
| **Idle Error Guard** | `pool.on('error', handler)` | Prevents crashes when remote DB drops idle socket |
| **Single Query** | `await pool.query(sql, params)` | Automated checkout and release |
| **Transaction Pattern** | `const c = await pool.connect()` | Dedicated client for `BEGIN ... COMMIT` |
| **Guaranteed Release** | `finally { client.release(); }` | Eliminates client leaks and pool deadlocks |

### Common Pitfalls
- **Running `BEGIN` across `pool.query()`**: Distributes statements across random clients, leaving dangling locks.
- **Forgetting `client.release()`**: Permanently leaks pool sockets, deadlocking the service after $N$ errors.
- **Omitting `pool.on('error')`**: Crashes the Node.js process when AWS RDS or firewalls drop idle sockets.
- **Setting `max: 100` on 50 container pods**: Overwhelms PostgreSQL with 5,000 backend worker processes.

---

## Interview Questions

### 1. What is PostgreSQL's process architecture for client connections, and why does an oversized Node.js connection pool degrade database performance?

PostgreSQL utilizes a **process-per-connection architecture** managed by its master `postmaster` daemon. Whenever a client establishes a TCP connection, PostgreSQL forks a completely new operating system process (`postgres: worker`). Each worker process allocates 5MB to 10MB of memory for local execution state, query workspace (`work_mem`), and catalog caches.

If a developer configures an oversized pool (e.g. `max: 100` across 20 Node pods = 2,000 connections):
1. **Memory Exhaustion**: The database host consumes 10–20GB of RAM strictly managing connection processes, starving PostgreSQL's shared buffer cache (`shared_buffers`).
2. **CPU Context-Switching Thrashing**: When hundreds of concurrent queries execute, the operating system kernel spends more CPU cycles switching process contexts on the CPU than running database operations.
3. **Lock Contention**: Concurrency increases contention on row locks, table locks, and internal latches.
By contrast, sizing the pool strictly to database CPU capacity (e.g. 10–20 connections per pod) ensures queries execute in milliseconds without context-switching churn, resulting in significantly higher aggregate throughput.

### 2. What is the fundamental difference between `pool.query()` and `pool.connect()` in the Node.js `pg` driver, and why can't `pool.query()` be used for transactions?

- **`pool.query(text, params)`**:
  - A high-level convenience method.
  - Internally checks out an idle client from the pool, executes the SQL command, and automatically invokes `client.release()` in a built-in `finally` block before resolving the promise.
  - Safe and recommended for single, independent SQL statements.

- **`pool.connect()`**:
  - Manually checks out a dedicated `pg.Client` instance from the pool.
  - The calling application owns the connection exclusively until it explicitly invokes `client.release()`.

**Why `pool.query()` cannot be used for transactions**:
Because `pool.query()` checks out and immediately releases a client for each call, executing:
```js
await pool.query('BEGIN');
await pool.query('UPDATE balance SET amount = amount - 50');
await pool.query('COMMIT');
```
causes each statement to execute on an **arbitrary, different client socket** checked out from the pool.
- Statement 1 opens a transaction on Client A.
- Statement 2 executes outside any transaction on Client B (auto-committing immediately!).
- Statement 3 executes on Client C (throwing an error because Client C has no open transaction!).
- Meanwhile, Client A remains locked in an open transaction state, holding locks and leaking resources. Transactions must always be executed on a single checked-out client via `pool.connect()`.

### 3. What causes a connection pool deadlock in Node.js, and how do you write code to make a leak structurally impossible?

A connection pool deadlock occurs when all connections in a pool (e.g., `max: 10`) are checked out via `pool.connect()`, but are never returned via `client.release()`. Once 10 clients are leaked:
- Any subsequent call to `pool.connect()` or `pool.query()` is enqueued in the pool's internal waiting queue.
- If `connectionTimeoutMillis` is not configured, the requests wait indefinitely.
- The Node.js application completely stops processing database traffic and hangs all incoming HTTP requests.

To make leaks structurally impossible:
1. **Strict `try/finally` Discipline**: Always release clients in an unconditional `finally` block:
   ```js
   const client = await pool.connect();
   try {
     return await doWork(client);
   } finally {
     client.release(); // Executes regardless of returns or thrown errors
   }
   ```
2. **Higher-Order Transaction Wrapper**: Enforce a project-wide `withTransaction()` utility function so individual developers never call `client.release()` manually.
3. **Fail-Fast Timeouts**: Always configure `connectionTimeoutMillis: 2500` so queries throw errors immediately if the pool is saturated rather than hanging indefinitely.

### 4. Why is registering a `pool.on('error')` event listener mandatory in production Node.js applications using `pg`?

When a connection sits idle in a `pg.Pool`, it maintains an active TCP socket with the remote PostgreSQL server. In cloud environments (e.g. AWS RDS, Azure Database, Kubernetes networks):
- Stateful firewalls, NAT gateways, or the database's own `idle_session_timeout` will close the socket if no traffic passes for a period of time.
- When the socket closes unexpectedly, Node.js's underlying `net.Socket` emits an `'error'` event.
- The `pg.Pool` forwards this error to its own event emitter: `pool.emit('error', err, client)`.

In Node.js, if an `EventEmitter` emits an `'error'` event and **no listener has been registered**, Node treats the error as an **unhandled exception**. The runtime prints a stack trace and **immediately crashes the entire Node.js process** (`process.exit(1)`).
Registering:
```js
pool.on('error', (err, client) => {
  console.error('Unexpected idle client error:', err.message);
});
```
prevents the process crash. The pool catches the event, discards the dead socket, and transparently spawns a fresh connection when new queries arrive.

---

<nav aria-label="Lecture navigation">

[← Previous: MongoDB in Express](day-26-mongodb-in-express.md) | [Roadmap](../node-roadmap.md) | [Next: Parameterized SQL CRUD](day-28-parameterized-sql-crud.md)

</nav>