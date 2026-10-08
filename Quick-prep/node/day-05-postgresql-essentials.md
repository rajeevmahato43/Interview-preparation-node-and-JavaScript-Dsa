# Day 5: PostgreSQL, Connection Pooling, Parameterized SQL, and Transactions

Quick review of main-course lectures 27–32. Designed for rapid interview revision: `pg.Pool` connection lifecycle, SQL injection prevention, relational constraints, query execution plans (`EXPLAIN ANALYZE`), MVCC, and pessimistic locking (`FOR UPDATE`).

## Connection pooling and the `pg` client lifecycle

**1. `pg.Pool` connection management**

A connection pool manages persistent TCP connections to PostgreSQL, avoiding expensive connection handshakes per query. Use `pool.query()` for standalone queries (it acquires and releases automatically). Use `pool.connect()` only when managing multi-statement transactions.

```js
import pg from "pg";
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                   // Maximum clients in the pool
  idleTimeoutMillis: 30000,  // Close idle clients after 30s
  connectionTimeoutMillis: 2000 // Error if client checkout takes > 2s
});

// Always register error listener on idle clients
pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client:", err);
});
```

**1.1 Client checkout and release contract**

When acquiring a client manually via `pool.connect()`, always release it in a `finally` block. Failing to release a checked-out client leaks the socket, eventually exhausting the pool and causing the server to hang.

```js
const client = await pool.connect();
try {
  const result = await client.query("SELECT NOW()");
} finally {
  client.release(); // Crucial: Returns client socket to pool
}
```

[PostgreSQL pool lifecycle](../../Node/node-lectures/day-27-postgresql-and-pg-pool-lifecycle.md)

## Parameterized queries and SQL injection prevention

**1. Parameterized SQL queries**

Always pass dynamic user values through parameterized placeholders (`$1`, `$2`). The PostgreSQL query planner compiles and binds parameters separately from the SQL grammar, rendering SQL injection impossible.

```js
// Correct: Safe parameterized query
const { rows } = await pool.query(
  "SELECT id, email, role FROM users WHERE email = $1 AND is_active = $2",
  [emailInput, true]
);

// Incorrect: Vulnerable to catastrophic SQL Injection!
// const query = `SELECT * FROM users WHERE email = '${emailInput}'`;
// Attacker input: "admin@corp.com' OR '1'='1" bypasses authentication entirely!
```

**1.1 Dynamic identifiers and query builders**

Parameters (`$1`) can only substitute **values**, not table or column identifiers. If table or column names are dynamic, sanitize and quote them using `pg-format` (`%I` format specifier).

```js
import format from "pg-format";

// Safe dynamic column sort
const sql = format("SELECT * FROM products ORDER BY %I ASC LIMIT 10", sortByColumn);
const { rows } = await pool.query(sql);
```

[Parameterized SQL CRUD](../../Node/node-lectures/day-28-parameterized-sql-crud.md) | [Relational correctness](../../Node/node-lectures/day-29-relational-correctness-for-apis.md)

## Schema constraints and query performance

**1. Relational constraints as source of truth**

Enforce data integrity at the database layer using constraints: `PRIMARY KEY`, `FOREIGN KEY ... ON DELETE CASCADE | RESTRICT`, `UNIQUE`, and `CHECK`.

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**2. Query execution analysis: `EXPLAIN ANALYZE`**

Use `EXPLAIN (ANALYZE, BUFFERS)` to diagnose slow queries.
- `Seq Scan`: Full table scan. Slow on large tables; indicates a missing index.
- `Index Scan` / `Bitmap Index Scan`: Uses a B-tree index to locate rows rapidly.

```sql
-- Create an index on foreign key for performant JOINs
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Verify execution plan
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 'c7a4b88e-6701-4475-8120-cf6a17b07542';
```

[SQL composition and performance](../../Node/node-lectures/day-30-sql-composition-and-performance-awareness.md)

## Transactions, MVCC, and pessimistic locking

**1. Transaction isolation and execution flow**

Run transactions across a single checked-out client with explicit `BEGIN`, `COMMIT`, and `ROLLBACK` blocks.

```js
async function transferFunds(fromId, toId, amount) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Pessimistic lock: Prevents concurrent updates until transaction completes
    const { rows: [sender] } = await client.query(
      "SELECT balance FROM accounts WHERE id = $1 FOR UPDATE",
      [fromId]
    );

    if (sender.balance < amount) throw new Error("Insufficient funds");

    await client.query("UPDATE accounts SET balance = balance - $1 WHERE id = $2", [amount, fromId]);
    await client.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [amount, toId]);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
```

**2. MVCC (Multi-Version Concurrency Control) and row locks**

Under MVCC, readers never block writers, and writers never block readers. When an `UPDATE` occurs, Postgres writes a new tuple version and flags the old tuple as dead (later reclaimed by `VACUUM`). Use `FOR UPDATE` to lock specific rows during critical read-modify-write balances, or `FOR UPDATE SKIP LOCKED` for high-throughput concurrency job queues.

```js
// Lock-free queue consumer: grabs the first unlocked task and skips locked ones
const { rows } = await client.query(`
  SELECT id, payload FROM jobs
  WHERE status = 'PENDING'
  ORDER BY id
  FOR UPDATE SKIP LOCKED
  LIMIT 1
`);
```

[Transactions and MVCC](../../Node/node-lectures/day-31-postgresql-transactions-mvcc-and-locks.md) | [PostgreSQL in Express](../../Node/node-lectures/day-32-postgresql-in-express.md)

## Tricky points

1. **Connection pooling**

**1.1 Leaking clients on error paths**
If `client.release()` is omitted or placed inside the `try` block before an error occurs, the checked-out client is never returned to the pool. Over time, all connections lock, freezing every subsequent database call across the server.

**1.2 Mixing `pool.query()` with `BEGIN`**
Calling `await pool.query("BEGIN")` executes on an arbitrary client from the pool; subsequent calls may run on completely different clients, breaking transaction boundaries and leaving open transactions lingering in Postgres.

2. **Queries and constraints**

**2.1 Missing indexes on foreign keys**
Unlike primary keys, PostgreSQL does not automatically create indexes on foreign key columns. Deleting or updating rows on the referenced parent table requires an expensive full table `Seq Scan` on the child table.

**2.2 Blind numeric float coercion**
Storing financial balances in `FLOAT` or JavaScript `Number` causes floating-point rounding errors (e.g., `0.1 + 0.2 !== 0.3`). Always use `NUMERIC(12, 2)` or integer cents.

3. **Concurrency and locks**

**3.1 Deadlocks from inconsistent locking order**
If Transaction A locks Account 1 and attempts to lock Account 2, while Transaction B locks Account 2 and attempts to lock Account 1, Postgres detects a deadlock and aborts one transaction with error code `40P01`. Always sort resource IDs before acquiring locks.

**3.2 Table bloat from long-running transactions**
A lingering open transaction prevents `VACUUM` from cleaning dead tuple versions across the entire database, causing disk bloat and degrading query performance across unrelated tables.