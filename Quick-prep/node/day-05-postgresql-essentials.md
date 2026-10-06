# Day 5: PostgreSQL from Node.js

## Client and SQL

**1. `pg` pool and client**

Reuse a bounded pool; release each checked-out client in `finally` so errors do not leak connections.

```js
const client = await pool.connect();
try { await client.query("SELECT 1"); }
finally { client.release(); }
```

**2. Parameterized queries**

Pass values separately from SQL text; never concatenate untrusted values into query strings.

```js
await pool.query("SELECT id FROM users WHERE email = $1", [email]);
```

**3. Relational schema and constraints**

Primary/foreign keys and `NOT NULL`/`UNIQUE`/`CHECK` constraints keep invalid states out, including concurrent writes.

[Pool](../../Node/node-lectures/day-27-postgresql-and-pg-pool-lifecycle.md) | [Parameterized CRUD](../../Node/node-lectures/day-28-parameterized-sql-crud.md) | [Correctness](../../Node/node-lectures/day-29-relational-correctness-for-apis.md)

## Querying and performance

**1. SQL composition**

Joins combine relations; grouping aggregates rows; subqueries/CTEs name intermediate query steps. Check row cardinality before aggregating.

**2. Indexes and plans**

Indexes may support filters/orderings but add storage/write cost; use `EXPLAIN` and workload evidence.

**3. API integration**

Map database rows to API output; keep client/transaction lifetime separate from unrelated remote calls.

[Query composition](../../Node/node-lectures/day-30-sql-composition-and-performance-awareness.md) | [Express integration](../../Node/node-lectures/day-32-postgresql-in-express.md)

## Transactions and concurrency

**1. Transactions**

`BEGIN`/`COMMIT` group database changes; rollback on failure and keep transaction boundaries narrow.

**2. MVCC and isolation**

MVCC provides versioned snapshots; isolation level determines which concurrent changes a transaction observes.

**3. Row locks and deadlocks**

Locks coordinate conflicting writes; deterministic lock order reduces deadlock risk.

```sql
BEGIN;
UPDATE inventory SET quantity = quantity - 1 WHERE id = $1 AND quantity > 0;
COMMIT;
```

**4. Retry and integrity**

Constraints are authoritative; retry deadlock/serialization failures only when the transaction is safe to rerun.

[Transactions, MVCC, and locks](../../Node/node-lectures/day-31-postgresql-transactions-mvcc-and-locks.md)

## Tricky points

1. **Client and query**

**1.1 Pool release**

A checked-out client not released after errors can starve later requests.

**1.2 Parameters**

Parameters represent values, not identifiers; dynamic table/column names need strict allowlisting.

**1.3 `NULL`**

`column = NULL` is unknown; use `IS NULL`.

2. **Relational semantics**

**2.1 Join cardinality**

A one-to-many join duplicates parent rows; aggregate at the intended level.

**2.2 Outer joins**

A `WHERE` predicate on the nullable side can remove unmatched rows and effectively act like an inner join.

**2.3 Constraints**

Application check-then-insert races; database constraints are authoritative.

3. **Transactions and performance**

**3.1 Remote calls**

Do not hold row locks while waiting on HTTP or another slow dependency.

**3.2 Isolation**

A transaction does not prevent every anomaly at every level; state the isolation level and invariant.

**3.3 Indexes**

More indexes can improve reads but slow writes and consume resources; verify actual plans.