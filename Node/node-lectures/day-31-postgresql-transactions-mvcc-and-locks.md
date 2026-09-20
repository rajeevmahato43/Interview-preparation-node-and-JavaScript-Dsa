# Day 31: PostgreSQL Transactions, MVCC, and Locks

<nav aria-label="Lecture navigation">

[Previous: SQL Composition and Performance Awareness](day-30-sql-composition-and-performance-awareness.md) | [Roadmap](../node-roadmap.md) | [Next: PostgreSQL in Express](day-32-postgresql-in-express.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain transaction boundaries and why they matter in a Node service.
- Distinguish SQL isolation from application semantics.
- Understand MVCC, row locks, and deadlocks at a practical level.
- Design a safe transaction flow that releases resources and handles retries responsibly.

## Prerequisites

- [Day 27: PostgreSQL and `pg` Pool Lifecycle](day-27-postgresql-and-pg-pool-lifecycle.md)
- [Day 30: SQL Composition and Performance Awareness](day-30-sql-composition-and-performance-awareness.md)

## Core Concepts

### 1. Transactions are explicit boundaries

```js
const client = await pool.connect();

try {
  await client.query("BEGIN");
  await client.query("UPDATE accounts SET balance = balance - $1 WHERE id = $2", [100, accountId]);
  await client.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [100, recipientId]);
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
}
```

This example matters because the service owns the transaction, not just the SQL.

### 2. MVCC gives PostgreSQL snapshot behavior

PostgreSQL uses MVCC to keep readers and writers mostly isolated without locking the entire table. This supports concurrent transactions with more throughput than older locking-heavy designs.

### 3. Locks and deadlocks still happen

Even with MVCC, long transactions, competing row updates, or conflicting writes can cause deadlocks or blocking. The service must design lock times and retry behavior carefully.

## Detailed Explanations and Traces

### Transaction lifecycle

An app using a pool must take a client, start a transaction, perform the sequence, then commit or rollback. The client must be released in `finally` so the pool is not exhausted.

### Isolation levels

Different isolation levels affect what a transaction sees. The application should match the isolation requirement to the business operation. Stronger isolation costs more concurrency.

## Common Mistakes and Interview Traps

- Forgetting to release the client back to the pool.
- Holding a transaction open for too long.
- Assuming all action is safe just because the code uses a DB.
- Ignoring deadlock or lock timeout behavior under load.

## Tricky Points

- A transaction is not a solution for everything; it protects a sequence of statements, not magically the whole application.
- `ROLLBACK` is only useful if the code actually reaches it before the client is returned to the pool.
- Retry logic must be designed with idempotency and lock timeout expectations in mind.

## Practical Exercise

**Goal:** Write a transaction-backed money transfer flow.

**Inputs and outputs:** Transfer funds from one account to another while preserving consistent balances.

**Constraints:** Use a single client transaction, handle error and rollback, and release the client.

**Acceptance criteria:** Either both account updates commit, or the transfer is rolled back with no partial state.

## Summary

- PostgreSQL transactions define an atomic business sequence.
- MVCC provides concurrency but not immunity from lock contention.
- Correct transaction code includes commit, rollback, and client release discipline.

## Cheat Sheet

| Concern | Rule |
|---|---|
| Transaction | `BEGIN` -> statements -> `COMMIT` |
| Failure | `ROLLBACK` and release client |
| Concurrency | MVCC reduces table-wide locks |
| Deadlocks | avoid long lock chains and retry when needed |

## Interview Questions

1. **Definition:** Why do transaction boundaries matter in PostgreSQL?
   - **Expected answer:** They define a set of statements that must be committed atomically or rolled back together.
   - **Follow-up:** What is the cost of a wrong boundary?

2. **Design:** How would you handle an account transfer operation in a service with a pool?
   - **Expected answer:** Use a single client, `BEGIN`, do both updates, then `COMMIT` or `ROLLBACK`.
   - **Follow-up:** What if a deadlock occurs?

3. **Debugging:** A multi-user system sees lock timeouts under load. What do you check first?
   - **Expected answer:** Long-running transactions, lock ordering, and whether there are conflicting updates in the same rows.
   - **Follow-up:** What do you do to reduce lock time?

4. **Engineering judgment:** Should every service operation use a transaction?
   - **Expected answer:** No. Transaction cost and duration must match the correctness requirement.
   - **Follow-up:** What makes the correct boundary obvious or difficult?

<nav aria-label="Lecture navigation">

[Previous: SQL Composition and Performance Awareness](day-30-sql-composition-and-performance-awareness.md) | [Roadmap](../node-roadmap.md) | [Next: PostgreSQL in Express](day-32-postgresql-in-express.md)

</nav>