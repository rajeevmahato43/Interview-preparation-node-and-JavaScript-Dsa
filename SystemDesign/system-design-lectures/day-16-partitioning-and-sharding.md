# Day 16: Partitioning and Sharding

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> | <a href="day-15-replication-and-read-scaling.md">Previous: Day 15</a> | <a href="day-17-transactions-and-data-integrity.md">Next: Day 17</a></nav>

## What You Will Learn Today

- Distinguish vertical partitioning, horizontal partitioning, and sharding.
- Choose a shard key based on access patterns, growth, write distribution, and query locality.
- Compare range and hash placement, including skew and hot-partition risks.
- Explain scatter-gather queries, rebalancing, and why resharding is an ongoing operational concern.

## Prerequisites

- [Day 04: Estimation and Back-of-the-Envelope Math](../system-design-roadmap.md#day-04-estimation-and-back-of-the-envelope-math)
- [Day 09: Data Modeling and Storage Choices](../system-design-roadmap.md#day-09-data-modeling-and-storage-choices)
- [Day 10: Indexes, Query Patterns, and Data Access](../system-design-roadmap.md#day-10-indexes-query-patterns-and-data-access)

## Quick Vocabulary Card

- **Partitioning:** Dividing data into smaller pieces using a defined rule.
- **Vertical partitioning:** Separating columns, tables, or responsibilities, often to isolate access or storage needs.
- **Horizontal partitioning:** Dividing rows into subsets that share a schema.
- **Sharding:** Horizontal partitioning across independently addressable database nodes or clusters.
- **Shard key:** Attribute or key used to assign records to partitions.
- **Hot partition:** A partition receiving disproportionate traffic or work relative to its peers.
- **Scatter-gather:** Sending a query to multiple partitions and combining their responses.

## Core Concepts

Partitioning is a way to manage data volume, throughput, or ownership after access patterns and a single-node design have been understood. It is not a default performance setting: it adds routing, uneven-load risk, cross-partition query cost, and migration complexity. Before sharding, estimate the actual bottleneck and consider vertical scaling, indexes, query changes, caching, archival, or read replicas. A good design has a reason the current storage boundary cannot meet.

Vertical partitioning separates parts of a model. For example, a user table may keep frequently read profile fields separate from rarely requested audit details. Horizontal partitioning splits rows: events may be divided by account, time range, or a hash of an identifier. Sharding is often used for the distributed form of horizontal partitioning, where each shard owns a subset and a router determines the destination. Some database products use “partitioning” for both local table partitions and distributed shards; use the system's specific terminology when discussing implementation.

### Pick a key from workload, not intuition

A shard key determines write placement, query locality, and workload balance. Evaluate cardinality and distribution, whether common queries contain the key, lifecycle and resharding needs, routing after topology changes, and tenant skew.

Range partitioning places nearby key values together. It can support range scans and time-based retention efficiently, but sequential or highly skewed values may direct most new writes to one range. Hash partitioning spreads key values using a hash function. It can distribute writes more evenly when inputs are well distributed, but makes ordered range queries span partitions and does not guarantee balanced workload if a few keys dominate. Neither is universally better.

Shard-key and balancing behavior is product-specific; verify deployed settings in the [MongoDB sharding guide](https://www.mongodb.com/docs/manual/sharding/) or the relevant database documentation.

### Worked scenario: event store

Assume an event store receives 25,000 new events/s and supports two main queries: fetch recent events for one account, and compute a time-window aggregate across all accounts. Data grows continuously, and old events are retained for a fixed period. Partitioning by timestamp makes time-range scans and expiration convenient, but a single newest partition may become a write hotspot. Sharding by account ID localizes the account history query and spreads writes if account activity is broadly distributed; however, a very large or unusually active account can be hot, and a global time aggregate now needs work from many shards.

Hashing accounts while partitioning by time within each shard may distribute accounts and simplify retention, but not solve a hot account. Adding an event bucket spreads that tenant's writes but makes its reads span buckets. Compare against measured skew and query frequency.

When a request contains the shard key, the router can target a subset; otherwise it may fan out. Fan-out adds per-shard work, network and merge cost, and tail-latency exposure. Global sorting and pagination need an explicit ordering and merge strategy.

### Skew and hot partitions

High cardinality does not prevent skew: a large tenant or popular key can dominate traffic. Measure data and request distributions because equal row counts do not mean equal CPU or I/O. Per-partition rates, queue depth, storage, latency, and throttling help identify hotspots. Isolation, buckets, caching, or access-pattern changes can help, with added complexity.

### Rebalancing and resharding

Adding a shard does not necessarily move existing data automatically or instantly. A system may need to split ranges, copy records, update routing metadata, keep changes in sync, and switch ownership safely. During migration, duplicate work, lag, capacity pressure, and partial failure are possible. Plan headroom for the migration itself, define retry and rollback boundaries, and ensure each record has an unambiguous owner at every stage. Hashing directly modulo shard count is simple but adding a shard can remap many keys; consistent hashing or a routing directory can reduce or control movement, each with its own complexity.

## Common Mistakes and Interview Traps

- Sharding before showing a single-node or query-level bottleneck.
- Choosing a key because it is unique without checking write skew or hot tenants.
- Assuming hash partitioning makes every workload balanced.
- Ignoring queries that omit the shard key, global sorting, and cross-shard joins.
- Treating resharding as a one-line configuration change without capacity, data-copy, routing, and rollback plans.

## Tricky Points

- A key can distribute stored rows well while concentrating the hottest requests on one shard. Data balance and work balance are separate measurements.
- Increasing shard count can reduce per-node data but increase coordination, connection pools, fan-out, and operational burden.
- Range partitioning can be ideal for bounded time queries and retention while still requiring a second distribution strategy to avoid a write hotspot.

## Practical Exercise

**Goal:** Choose and defend a partitioning strategy for an event store.

**Input/context:** The service ingests 25,000 events/s, fetches recent events by account, and computes global hourly aggregates. Data is retained for 180 days. Most accounts are small, but the busiest 0.1% produce 30% of events. Growth may double annual storage.

**Constraints:** Compare at least two shard-key candidates and one range/hash strategy. State what routes a normal account query, what happens to the global aggregate, and how retention works. Do not assume uniform account activity.

**Edge cases:** One account grows rapidly; a newly added shard; a query missing account ID; failed data copy during resharding; a global aggregate hitting a slow shard.

**Acceptance criteria:** Provide a short decision record with access patterns, expected routing, hotspot mitigation, operational metrics, and a resharding outline. Name one workload measurement that could reverse your choice.

## Summary

Partitioning divides data to address a specific capacity, query, or lifecycle constraint. Shard keys control write placement and query locality, so evaluate both key cardinality and workload skew. Range and hash strategies trade locality for distribution. Multi-partition queries and rebalancing are first-class design costs, not later implementation details.

## Cheat Sheet

- **Vertical:** Separate fields or responsibilities.
- **Horizontal:** Divide rows; distributed horizontal partitions are commonly called shards.
- **Range:** Local range scans and retention; risk of sequential hotspots.
- **Hash:** Better spread under suitable distributions; range scans fan out.
- **Shard key test:** Distribution + common query routing + lifecycle + migration + tenant skew.
- **Common Pitfalls:** Sharding without a bottleneck; assuming unique means balanced; ignoring scatter-gather and resharding.

## Interview Questions

1. **[Hard]** What makes a shard key poor even when it has high cardinality? **Expected answer shape:** Discuss skew, hot values, missing-key queries, query locality, and operational changes. **Follow-up:** How would you determine whether the problem is data skew or request skew?
2. **[Hard]** Compare range partitioning by event time with hashing by account ID for an event store. **Expected answer shape:** Connect each choice to writes, account reads, global time scans, retention, and hotspots. **Follow-up:** What evidence would favor a composite design?
3. **[Very Hard]** Plan a resharding operation while writes continue and clients need predictable reads. **Expected answer shape:** Cover ownership, copy/catch-up, routing cutover, duplicate handling, capacity, validation, and rollback. **Follow-up:** What invariant prevents a write from being lost or applied to conflicting owners during cutover?