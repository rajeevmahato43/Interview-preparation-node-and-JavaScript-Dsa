# Day 10: Indexes, Query Patterns, and Data Access

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> | Previous: <a href="day-09-data-modeling-and-storage-choices.md">Day 09</a> | Next: <a href="day-11-caching-fundamentals.md">Day 11</a></nav>

## What You Will Learn Today

- Explain how an index can reduce work for a matching query and why it is not automatically selected.
- Design indexes from filters, ordering, and result bounds, including compound-key order.
- Read a query plan as evidence about actual execution rather than assuming an index is useful.
- Include storage, write amplification, maintenance, and hot-key costs in an index decision.

## Prerequisites

- [Day 09: Data Modeling and Storage Choices](day-09-data-modeling-and-storage-choices.md)

## Quick Vocabulary Card

- **Index:** An auxiliary data structure that helps locate or order records without scanning the full relation or collection.
- **Selectivity:** How much a predicate narrows the candidate rows; higher selectivity generally filters more strongly.
- **Compound index:** One index whose key includes multiple fields in an order chosen for supported query shapes.
- **Query plan:** The database's chosen execution strategy for a query under its statistics and settings.
- **Write amplification:** Extra work caused by maintaining indexes and related structures when data changes.

## Core Concepts

An index trades resources on writes and storage for the possibility of doing less work on reads. It is an access path, not a command that forces every query to be fast. The planner compares available strategies using statistics, costs, and configuration; the selected plan can differ as data distribution changes. The roadmap’s [Day 10 entry](../system-design-roadmap.md#day-10-indexes-query-patterns-and-data-access) links the [PostgreSQL index documentation](https://www.postgresql.org/docs/current/indexes.html) and [MongoDB index documentation](https://www.mongodb.com/docs/manual/indexes/). Use those vendor references to verify product-specific behavior.

### Start with the query shape

Write down the query exactly: equality filters, range filters, sort order, projected fields, page bound, and expected frequency. Suppose an owner lists recent links:

```sql
SELECT id, code, created_at, status
FROM links
WHERE owner_id = $1
ORDER BY created_at DESC, id DESC
LIMIT 50;
```

An index beginning with `owner_id` and continuing with `created_at` and `id` may support locating one owner's range in the needed order. Whether it avoids a sort or reduces enough work depends on database behavior, direction support, query details, statistics, and data distribution. The unique `id` tie-breaker makes ordering deterministic when timestamps match. A query that filters only by `created_at` may not benefit from the same compound index because the leading key is `owner_id`.

### Key order and selectivity

For a compound index, key order determines which prefixes and orderings are naturally available. Equality predicates on leading fields often combine effectively with later range or ordering fields, but this is a design heuristic, not a universal planner law. Validate the exact query using the target database's plan tools. An index on a low-selectivity boolean may still help in a compound index or for a partial subset, but a standalone index may require visiting much of the table. Conversely, selectivity alone does not determine the best index; ordering, correlation, index-only opportunities, memory, and query frequency matter too.

If the API needs only a bounded page, make the query return a bounded result. An index cannot make an endpoint safe if it reads millions of rows and serializes them anyway. Projection can also reduce data read and transferred when supported and useful.

### Plans are hypotheses you verify

Inspect representative plans and runtime behavior with realistic parameter values and data volume. Check whether the plan scans the index, visits many table rows, performs an expensive sort, or chooses a sequential scan. A sequential scan is not automatically bad: for a small table or a query that returns a large fraction of rows, it may be cheaper than traversing an index and fetching scattered records. PostgreSQL's `EXPLAIN` and `EXPLAIN ANALYZE` have different behavior; `ANALYZE` executes the statement, so understand side effects before using it on writes or production systems. MongoDB exposes explain plans with its own execution statistics. Plan formats and planner behavior are product-specific.

Compare estimated and actual rows and time where safely available. Stale statistics, skew, parameter variation, and cache state can mislead a single measurement. Test common and worst-case tenants, not only an average dataset. A hot owner with a huge list may need bounded pagination or partitioning rather than another index.

### Indexes have a continuing price

Every maintained index consumes storage and can add work to inserts, updates, and deletes. Updating an indexed value may require index changes; extra indexes also use memory and can increase backup, replication, and maintenance costs. Indexes may fragment or need product-specific maintenance. Too many overlapping indexes make writes slower and complicate operations without helping the actual query set.

A write-heavy event table illustrates the trade-off: indexing every optional field can make ingestion expensive. Keep only indexes tied to real, measured access patterns and integrity requirements. Unique indexes can be correctness controls, but duplicates and conflicts must be handled as expected outcomes. Revisit indexes as API patterns and data distributions change; remove an index only after verifying that no workload or constraint depends on it.

## Common Mistakes and Interview Traps

- Saying an index makes a query O(log n) without accounting for result retrieval, sort, selectivity, and database implementation.
- Adding one index per field without evaluating combined predicates, order, workload, and write cost.
- Assuming a compound index supports any permutation of its keys.
- Treating an index scan as always better than a sequential scan.
- Trusting estimates from tiny fixtures or one parameter value as representative production evidence.
- Running an execution plan that performs writes without understanding its side effects.
- Ignoring bounded result size, tenant skew, and the cost of maintaining every index.

## Tricky Points

“The query uses an index” is not the same as “the query is efficient.” An index scan may touch many index and table pages, then cost more than a sequential scan. A plan is workload-sensitive: statistics, data correlation, cache state, database version, configuration, and parameter values can change the choice. Use actual production-safe evidence and distinguish plan estimates from measured execution.

## Practical Exercise

**Goal:** Propose a minimal index set for a short-link service.

**Inputs/context:** Queries: unique redirect lookup by `code`; owner listing filtered by `owner_id`, sorted by `created_at DESC, id DESC`; and expiry cleanup over active records.

**Constraints:** Assume 20 million links, frequent link creation, and a database whose exact planner behavior must be verified. Keep API pages bounded. Do not assume indexes are free.

**Edge cases:** A few owners hold a large share of links; timestamps tie; active records are a small fraction; writes arrive during index creation; stale planner statistics.

**Acceptance criterion:** For each query, name a candidate index and key order, what plan evidence would support it, what write/storage cost it adds, and one alternative if the plan is poor. State which uniqueness rule is correctness-critical. No full DDL required.

## Summary

Indexes add alternate access paths. Design them from real query shape: filters, order, projection, and bounds. Compound key order matters, and selectivity is only one planner input. Inspect plans with representative data, while accounting for write amplification, storage, maintenance, hot keys, and the possibility that a scan is cheaper.

## Cheat Sheet

- Query pattern first: filter + sort + projection + limit + frequency.
- Compound-key order controls useful prefixes and ordering opportunities.
- Inspect estimates and actual behavior with representative distribution and parameters.
- Indexes cost write work, storage, memory, backup, and maintenance.
- A sequential scan may be correct for small tables or broad results.
### Common Pitfalls

- Indexing by intuition; assuming a plan is universally stable; forgetting uniqueness constraints and write costs.

## Interview Questions

1. **[Hard]** Choose indexes for redirect-by-code and owner-list queries. **Expected answer shape:** Query shapes, uniqueness requirement, compound key order, bounded pagination, and verification plan. **Follow-up:** What if one owner has 30% of all links?
2. **[Hard]** A query plan shows a sequential scan even though a matching index exists. Is the planner broken? **Expected answer shape:** Consider table size, selectivity, result fraction, row-fetch locality, statistics, and configuration. **Follow-up:** What evidence would you collect before changing the query or index?
3. **[Hard]** Why might adding an index slow the service overall? **Expected answer shape:** Insert/update/delete maintenance, storage and memory, write throughput, maintenance, replication/backup consequences. **Follow-up:** How would you detect an unused or redundant index safely?
4. **[Very Hard]** p95 latency regressed after data growth while average plan cost looks stable. Design a diagnosis. **Expected answer shape:** Compare actual rows, plans by tenant/parameters, skew, sort and fetch work, statistics, concurrency, and boundedness. **Follow-up:** Which changes would you test independently to avoid masking the cause?