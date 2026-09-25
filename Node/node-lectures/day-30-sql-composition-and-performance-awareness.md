# Day 30: SQL Composition and Performance Awareness

<nav aria-label="Lecture navigation">

[Previous: Relational Correctness for APIs](day-29-relational-correctness-for-apis.md) | [Roadmap](../node-roadmap.md) | [Next: PostgreSQL Transactions, MVCC, and Locks](day-31-postgresql-transactions-mvcc-and-locks.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Read and reason about SQL query structure and execution order.
- Understand when joins, groupings, and subqueries are appropriate.
- Relate index design to selectivity and query shape.
- Explain how `EXPLAIN` helps distinguish a wrong query from a missing index.

## Prerequisites

- [Day 29: Relational Correctness for APIs](day-29-relational-correctness-for-apis.md)
- [Day 24: MongoDB Aggregation and Index Awareness](day-24-mongodb-aggregation-and-index-awareness.md)

## Core Concepts

### 1. SQL execution order is not the same as text order

SQL is written in a readable order, but the optimizer chooses a plan. The important conceptual order is often:

1. `FROM`
2. `WHERE`
3. `GROUP BY`
4. `HAVING`
5. `SELECT`
6. `ORDER BY`
7. `LIMIT`

The app should reason about what the database will do, not just what text appears on the page.

### 2. Filtering, joins, and order matter

```sql
SELECT u.email, COUNT(o.id)
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.role = 'user'
GROUP BY u.id, u.email
ORDER BY COUNT(o.id) DESC
LIMIT 20;
```

This is a query with important costs: join size, grouping cost, and order complexity.

### 3. Indexes are about workload, not slogans

A query using `WHERE user_id = $1 ORDER BY created_at DESC` benefits from a matching index. But a broad query with poor selectivity may still be expensive even with an index.

## Detailed Explanations and Traces

### Why `EXPLAIN` matters

```sql
EXPLAIN ANALYZE
SELECT * FROM orders WHERE status = 'paid' ORDER BY created_at DESC LIMIT 20;
```

This can show whether PostgreSQL used an index, how many rows it scanned, and whether an expensive sort or heap fetch happened.

### Selectivity and cardinality

A highly selective filter can justify a query plan with an index, while a low-cardinality filter may still scan a large share of the table.

The right answer is always workload-specific.

## Common Mistakes and Interview Traps

- Writing SQL that works but is too broad for large datasets.
- Assuming an index exists for every pattern.
- Ignoring the join and sort cost of a seemingly small query.
- Using `SELECT *` without considering table size and payload cost.

## Tricky Points

- A query can "look simple" and still be expensive due to join multiplication or poor ordering.
- The optimizer may choose a different plan than the one you expect.
- An index is only a help if the query pattern matches it.

## Practical Exercise

**Goal:** Compare two queries on a user/order dataset and explain the likely execution plan.

**Inputs and outputs:** Use a list query and a report query with filters and ordering.

**Constraints:** Explain which query would benefit from an index and why.

**Acceptance criteria:** The answer includes an index rationale and a likely plan explanation.

## Summary

- SQL composition matters for correctness and performance.
- Query shape and indexes are tightly connected.
- `EXPLAIN` is a critical tool for making optimization evidence-based.

## Cheat Sheet

| Concern | Rule |
|---|---|
| Query plan | optimizer chooses based on statistics |
| Joins | think about row multiplication |
| Sorts | index can help if order matches |
| Selection | highly selective filters are easier to optimize |
| `EXPLAIN` | use it before tuning blindly |

## Interview Questions

1. **Definition:** What is the main reason a query may be slow even though it is logically simple?
   - **Expected answer:** The table shape, join cardinality, sort cost, and index support can make a simple query expensive.
   - **Follow-up:** How would you confirm this?

2. **Debugging:** A query with `ORDER BY` is slow. What do you inspect first?
   - **Expected answer:** Whether the sort is index-backed and whether filtering produces a small enough set before sorting.
   - **Follow-up:** How does `EXPLAIN ANALYZE` help?

3. **Implementation:** Write a query that joins users and orders and groups by user.
   - **Expected answer:** Use a clear join condition and aggregated results, then discuss index assumptions.
   - **Follow-up:** What if the table is large and the join is broad?

4. **Design:** Under what conditions would you prefer a different data model than a very broad join-heavy query?
   - **Expected answer:** When the query is too expensive or unstable under load, or when the access patterns are better served by a denormalized or separate table.
   - **Follow-up:** What is the tradeoff?

<nav aria-label="Lecture navigation">

[Previous: Relational Correctness for APIs](day-29-relational-correctness-for-apis.md) | [Roadmap](../node-roadmap.md) | [Next: PostgreSQL Transactions, MVCC, and Locks](day-31-postgresql-transactions-mvcc-and-locks.md)

</nav>