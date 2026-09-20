# Day 24: MongoDB Aggregation and Index Awareness

<nav aria-label="Lecture navigation">

[Previous: MongoDB Access Patterns and Document Shape](day-23-mongodb-access-patterns-and-document-shape.md) | [Roadmap](../node-roadmap.md) | [Next: MongoDB Atomicity, Transactions, and Retries](day-25-mongodb-atomicity-transactions-and-retries.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Read and reason about simple MongoDB aggregation pipelines.
- Explain why an index matters for query performance and sorting.
- Use `explain()` to interpret execution plans.
- Recognize common mistakes in aggregation and indexing decisions.

## Prerequisites

- [Day 22: MongoDB CRUD from Node](day-22-mongodb-crud-from-node.md)
- [Day 23: MongoDB Access Patterns and Document Shape](day-23-mongodb-access-patterns-and-document-shape.md)

## Core Concepts

### 1. Aggregation is a pipeline, not a single query

A pipeline stages operations such as match, project, group, sort, and limit.

```js
const result = await db.collection("orders").aggregate([
  { $match: { status: "paid" } },
  { $group: { _id: "$userId", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } },
  { $limit: 10 },
]).toArray();
```

This is useful for analytics and reporting, not only for CRUD-like fetches.

### 2. Indexes are a performance tool, not magic

The right index can support filter and sort operations. The wrong one can add write cost and still not help.

```js
await db.collection("orders").createIndex({ status: 1, createdAt: -1 });
```

The query and index order matter. A compound index is only useful when the query pattern matches it sensibly.

### 3. Explain reveals the plan

```js
const plan = await db.collection("orders").find({ status: "paid" }).sort({ createdAt: -1 }).explain("executionStats");
```

This gives evidence about whether the database used an index, how many documents it scanned, and whether a sort was in-memory or index-supported.

## Detailed Explanations and Traces

### Match+sort+limit

A query with a filter on `status` and a sort on `createdAt` may be efficient with a compound index. Without the index, MongoDB may scan many documents or sort in memory.

The important question is not ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œdoes an index exist?ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â but ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œwhat query pattern does it support?ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â

### Aggregation tradeoff

Aggregation is powerful, but it can be expensive when run on large sets or with sharded or poorly indexed collections. It is often a design tradeoff between reading a lot and computing a little.

## Common Mistakes and Interview Traps

- Creating indexes on every field without thinking about workload.
- Expecting an index to fix all slow queries.
- Ignoring sort order and filter selectivity.
- Forgetting that aggregation stages can still be CPU and memory intensive.

## Tricky Points

- Indexes speed reads but cost writes.
- A compound index is not inherently useful for every query shape.
- `explain()` can reveal where the cost truly is; it is better evidence than a guess.

## Practical Exercise

**Goal:** Compare two query plans and decide which index supports the workload.

**Inputs and outputs:** Use a small dataset with status and createdAt patterns and run `explain()` on the equivalent queries.

**Constraints:** Use realistic filter and sort combinations.

**Acceptance criteria:** You can explain which query is index-supported and why.

## Summary

- Aggregation pipelines are powerful but should be matched to workload and indexes.
- A good query plan depends on filter selectivity, sort order, and index structure.
- `explain()` is the right tool for evidence-based optimization.

## Cheat Sheet

| Topic | Rule |
|---|---|
| Aggregation | stages operate in order |
| Index | must match query pattern |
| Sort | index-backed sort is cheaper |
| Explain | check scanned docs and index usage |
| Tradeoff | reads faster, writes slower |

## Interview Questions

1. **Definition:** What is an aggregation pipeline?
   - **Expected answer:** A sequence of stages that transforms or summarizes documents.
   - **Follow-up:** Why not just use a `find` for everything?

2. **Debugging:** A query is slower than expected, but there is an index. What do you check next?
   - **Expected answer:** The query pattern, sort order, field selectivity, and `explain()` output.
   - **Follow-up:** Could a bad compound index still be slow?

3. **Implementation:** Design a query for `status` and `createdAt` that benefits from a compound index.
   - **Expected answer:** Put the equality filter before the sort key in the index.
   - **Follow-up:** What if the sort direction changes?

4. **Design:** When is aggregation a strength, and when is it a warning sign?
   - **Expected answer:** Useful for summary/report workloads but expensive when used on huge collections without the right indexes.
   - **Follow-up:** How do you know whether a pipeline is doing too much work?

<nav aria-label="Lecture navigation">

[Previous: MongoDB Access Patterns and Document Shape](day-23-mongodb-access-patterns-and-document-shape.md) | [Roadmap](../node-roadmap.md) | [Next: MongoDB Atomicity, Transactions, and Retries](day-25-mongodb-atomicity-transactions-and-retries.md)

</nav>