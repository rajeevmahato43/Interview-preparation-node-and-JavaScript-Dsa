# Day 24: Ordering, Coordination, and Distributed Locks

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> | Previous: <a href="day-23-idempotency-and-message-delivery.md">Day 23</a> | Next: <a href="day-25-resilience-patterns.md">Day 25</a></nav>

## What You Will Learn Today

- State the smallest ordering scope required by the business operation.
- Explain why message arrival order does not always imply effect-completion order.
- Recognize the limits of leases and distributed locks during pauses and partitions.
- Use fencing or version checks at the protected resource to reject stale owners.

## Prerequisites

- [Day 13: Asynchronous Processing and Message Queues](day-13-queues-and-asynchronous-processing.md)
- [Day 16: Partitioning and Sharding](day-16-partitioning-and-sharding.md)
- [Day 18: Consistency Models and CAP Trade-offs](day-18-consistency-models-and-cap.md)

## Quick Vocabulary Card

- **Ordering scope:** The set of operations for which relative order must be preserved, such as one account or conversation.
- **Partition key:** A value used to route related records or messages to a partition.
- **Lease:** A time-bounded claim to perform work that expires unless renewed.
- **Fencing token:** A monotonically increasing generation number checked by the protected resource to reject work from an older owner.
- **Split brain:** Two actors both believe they hold authority for the same resource.

## Core Concepts

Coordination constrains concurrent work to preserve an invariant. Global order is expensive and often unnecessary. First ask which operations must be ordered, whether they commute, and what state transition must reject stale work. The roadmap’s [Day 24 entry](../system-design-roadmap.md#day-24-ordering-coordination-and-distributed-locks) links [Apache Kafka documentation](https://kafka.apache.org/documentation/) and Google's SRE guidance on [cascading failures](https://sre.google/sre-book/addressing-cascading-failures/); broker ordering and lock behavior must be verified for the actual system and settings.

### Choose per-key ordering where possible

Suppose account events adjust a balance. Events for one account may need a serial order, while events for different accounts can proceed in parallel. Routing by `account_id` can place each account's messages in one partition, allowing parallelism across accounts. This can create a hot partition if one account dominates. If multiple producers publish concurrently, define how sequence is assigned; wall-clock timestamps alone do not prove causal order because clocks can differ and events can arrive late.

Even if a broker delivers one account's messages in order, consumer concurrency can reorder completion. If message A takes longer than B, two workers may apply B first unless dispatch is serialized or the state store checks an expected sequence/version. Ordering must be protected at the point where the invariant is mutated, not just at transport ingress.

### Locks and leases have failure windows

A distributed lock service can grant one process temporary ownership, but a process can pause longer than the lease due to garbage collection, scheduling, network delay, or machine suspension. The lease expires and a new worker acquires ownership. The old process may then resume and continue writing. Both workers have acted as owner at different moments, and the stale one can corrupt current state unless the resource rejects it.

A fencing token addresses that stale-owner case when the protected resource checks it. Each grant gets a larger token. The resource remembers the largest accepted token and rejects writes from a smaller generation. Merely returning a token from the lock service is not enough; every relevant mutation must enforce it. The token source must itself provide the monotonicity/uniqueness contract the design relies on. A database row version or compare-and-swap may be simpler where it directly protects the state.

Leases also depend on time assumptions. Clock drift and delayed renewal can cause early or late expiry; use the coordination product's documented lease semantics rather than comparing local wall clocks casually. Locks do not make arbitrary multi-step work atomic. Keep critical sections short and make recovery behavior explicit.

### Avoid coordination when operations commute

If independent updates can be combined safely, global locking adds latency and a failure dependency without protecting a real invariant. For counters, aggregation or atomic increments may avoid serial application-level coordination, subject to overflow and exactness requirements. For state transitions that do not commute, use a sequence, version, transaction, or serialized worker per key. The design should name the invariant first and select the narrowest mechanism that enforces it.

## Common Mistakes and Interview Traps

- Requiring global order when only per-account or per-aggregate order matters.
- Assuming broker delivery order implies consumer side-effect completion order.
- Treating wall-clock timestamps as a reliable total order across machines.
- Assuming a lease expiration stops a paused or partitioned holder from writing.
- Calling a lock safe without explaining how the protected resource rejects stale owners.
- Generating fencing tokens but failing to check them on every write path.
- Using a distributed lock where a database constraint, version check, or idempotent operation suffices.

## Tricky Points

A lease is a failure detector and authority mechanism with a time window, not a physical barrier around a process. Network partitions can separate the lock service from a holder while the holder still reaches the resource. Safety therefore depends on enforcement at the resource. Also, ordering and deduplication solve different problems: a perfectly ordered stream can still redeliver the same event, and deduplication does not restore a missing order.

## Practical Exercise

**Goal:** Define ordering and coordination for account events.

**Inputs/context:** Deposits and withdrawals are consumed asynchronously for many accounts. Events for one account must be reflected in a valid sequence; unrelated accounts should process in parallel.

**Constraints:** Choose a key and sequence/version mechanism, state how consumers handle duplicate and late events, and avoid assuming global ordering. Include a hot-account limit or strategy.

**Edge cases:** Concurrent producers; delayed earlier event; duplicate message; worker pauses beyond lease; two workers write after lease expiry; partition reassignment.

**Acceptance criterion:** Draw the per-account path, state the invariant, show how the storage layer rejects stale/out-of-order writes, explain one alternative to a lock, and identify an observable signal for hot partitions. Do not assume a broker-specific guarantee without naming what to verify.

## Summary

Order only what the business invariant requires, often per key. Delivery order may not imply completion order, so validate sequence at the state boundary. Leases can expire while an old worker is paused; fencing works only when the protected resource rejects stale tokens. Prefer transactions, versions, or commutative operations when they enforce the invariant with less coordination.

## Cheat Sheet

- Define ordering scope before choosing a broker or lock.
- Partition by the key whose operations need order; watch for skew and hot keys.
- Serialize effects or enforce expected sequence/version at the resource.
- Lease expiry does not stop an old holder; use resource-side fencing/version checks.
- Deduplication prevents repeated effects; ordering controls relative order.
### Common Pitfalls

- Global order by default; timestamp assumptions; lock without fencing; token unused by storage.

## Interview Questions

1. **[Hard]** Why might a consumer process messages out of order even when a broker delivers them in order? **Expected answer shape:** Parallel work, variable completion time, retries, partition/key scope, and state-boundary enforcement. **Follow-up:** How would you preserve per-account order?
2. **[Hard]** Explain how a paused lease holder can corrupt state after another worker acquires the lease. **Expected answer shape:** Pause, expiration, reacquisition, stale resumption, resource-side fencing. **Follow-up:** Why is a token useless if only the lock service checks it?
3. **[Hard]** Choose a partition key for account event processing. **Expected answer shape:** Required scope, parallelism, hot-key/skew risk, producer sequencing, and duplicate handling. **Follow-up:** What if one account generates half the traffic?
4. **[Very Hard]** Design coordination for a job that updates a database and an external storage system under worker pauses and partitions. **Expected answer shape:** Invariant, lease limits, fencing support at each resource, idempotency, transaction boundaries, recovery/reconciliation, and failure trade-offs. **Follow-up:** Which operation can safely proceed without a global lock?