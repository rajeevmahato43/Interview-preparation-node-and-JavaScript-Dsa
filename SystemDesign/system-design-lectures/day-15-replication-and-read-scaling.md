# Day 15: Replication and Read Scaling

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> | <a href="day-16-partitioning-and-sharding.md">Next: Day 16</a></nav>

## What You Will Learn Today

- Explain what a primary and a replica each do, and distinguish data replication from request load balancing.
- Compare synchronous and asynchronous replication in terms of acknowledged writes, latency, and possible data loss.
- Route reads according to freshness requirements instead of sending every read to the same destination.
- Describe replication lag, failover, replica recovery, and the operational checks needed before promoting a replica.

## Prerequisites

- [Day 09: Data Modeling and Storage Choices](../system-design-roadmap.md#day-09-data-modeling-and-storage-choices)
- [Day 10: Indexes, Query Patterns, and Data Access](../system-design-roadmap.md#day-10-indexes-query-patterns-and-data-access)

## Quick Vocabulary Card

- **Primary:** The database node currently accepting the authoritative writes for a replicated dataset.
- **Replica:** A node that receives and applies changes from another node; it may serve reads, backups, or recovery depending on configuration.
- **Replication lag:** The gap between a change being committed at its source and becoming visible on a replica.
- **Synchronous replication:** A commit waits for confirmation from a configured replica or set of replicas. Exact acknowledgment and durability semantics depend on the database and configuration.
- **Asynchronous replication:** The primary can acknowledge a write before a replica has received or applied it.
- **Failover:** Redirecting service to a replacement primary when the current primary is unavailable or deemed unhealthy.

## Core Concepts

Replication copies data across nodes. It can add read capacity and recovery options, but does not automatically distribute writes or make reads fresh. In a primary/replica arrangement, one primary accepts writes and replicas apply its ordered changes; routing sends eligible reads to them.

Mechanisms and acknowledgment stages vary by database and configuration. PostgreSQL documents its high-availability and replication options; interpret its guarantees within the selected settings and failure assumptions, not as universal replication behavior ([PostgreSQL high availability and replication](https://www.postgresql.org/docs/current/high-availability.html)).

### Acknowledgment is a trade-off

With asynchronous replication, a write may commit and return success while the replica is behind. This reduces the write path's dependence on replica response time, but if the primary fails before changes reach a promoted replica, acknowledged writes can be lost from the new primary's history. The risk is a window, not a certainty: actual loss depends on what was transmitted and durably stored before failure.

With synchronous replication, a commit can wait until one or more replicas confirm a configured stage. This can reduce the chance of losing acknowledged data under covered failures, but adds network latency and can reduce write availability if required acknowledgments cannot be obtained. “Synchronous” alone does not tell you whether the remote copy was merely received, written to durable storage, or applied and readable. Ask what the database waits for, how many replicas, and what happens when they are unavailable.

### Route reads by required freshness

Read routing affects correctness. A user reopening a changed profile expects read-your-writes; a lagging replica may show the old value. A report may tolerate seconds of lag, while an account authorization check usually cannot.

One practical policy is to classify reads:

Route freshness-critical reads (such as read-after-write) to a sufficiently current authority. Use replicas for bounded-stale reads only with a measured lag policy. Keep analytical workloads isolated so they do not consume serving capacity.

“Writes to primary, reads to replicas” ignores read-after-write needs. A short primary-read window helps some clients but does not prove replica freshness.

### Worked scenario: product catalog

Assume a catalog receives 8,000 reads/s and 150 writes/s at peak. Browse results may be two seconds stale, but editors must immediately see saved values. The primary handles writes; two asynchronous replicas serve browse requests while measured lag stays within budget. Otherwise, route to primary or use a defined degraded response. The edit workflow reads from primary unless the database provides a reliable applied-position mechanism.

Capacity testing must still include query shape, indexes, replica saturation, network, and failover headroom. More replicas can move the bottleneck to replication or routing.

### Failover and replica recovery

Failover requires a failure decision, eligible replica selection, promotion, write redirection, and fencing of the old primary. Health checks can misread a network split; fencing or quorum rules may reduce split brain, with guarantees depending on configuration.

Other replicas may need to follow the new primary or be rebuilt; a former primary with divergent writes may require reconciliation or a fresh copy. Monitor lag, promotions, replica capacity, and time to restore redundancy.

## Common Mistakes and Interview Traps

- Claiming replicas make writes scale horizontally. In a primary/replica design, writes still converge through the primary unless the system has a different multi-writer design.
- Calling every successful primary commit durable on every replica. Acknowledgment semantics are configuration-specific.
- Treating a replica as a backup. Replication can copy accidental updates and deletes immediately; see Day 20 for independent recovery points.
- Sending all reads to replicas without defining stale-read behavior or a lag threshold.
- Describing failover without addressing split brain, acknowledged-write loss, or how replicas rejoin.

## Tricky Points

- A replica can be current in receiving changes but behind in applying them; “lag” should name the measured stage and unit, such as bytes, log position, or time estimate.
- A read that starts after a write is not necessarily guaranteed to see it just because it reaches a replica a moment later. Use a documented consistency mechanism or route to a source that satisfies the contract.
- Synchronous replication improves a particular failure guarantee only when the relevant acknowledgments and failure assumptions line up. It does not protect against every correlated failure, operator error, or corruption.

## Practical Exercise

**Goal:** Add replicas to a read-heavy service without violating its freshness needs.

**Input/context:** Design the persistence path for a product catalog with 8,000 peak reads/s and 150 writes/s. Product browsing may be two seconds stale. A product editor must immediately read its own successful update. Assume one primary and up to three replicas; database-specific consistency features are not guaranteed.

**Constraints:** Keep one write authority. Specify how clients or the API choose read destinations, how lag is monitored, and what happens when the lag budget is exceeded. State whether the design prefers serving stale data, reading from the primary, or failing a request.

**Edge cases:** Primary failure immediately after acknowledging a write; one replica several seconds behind; stale routing cache; failover while a client has an open transaction; replica rejoining with divergent history.

**Acceptance criteria:** Provide a read-routing table, name the write acknowledgment assumption, state the user-visible behavior for each edge case, identify three operational metrics, and explain one capacity risk. Do not assume a named database's behavior without documenting the configuration to verify.

## Summary

Replication copies changes; read scaling requires eligible reads and replica capacity. Asynchronous replication may acknowledge before copies catch up; synchronous modes trade latency and availability for a configured acknowledgment. Define freshness per operation, monitor lag, and plan failover. Replicas do not replace backups.

## Cheat Sheet

- **Primary/replica:** One write authority, one or more copies; topology alone does not state the durability contract.
- **Async:** Lower write waiting, possible loss of recent acknowledged history after certain failures.
- **Sync:** Waits for configured replica acknowledgment; adds latency and dependency on replica health.
- **Route:** Primary for freshness-critical reads; replicas only where bounded staleness is acceptable.
- **Monitor:** Apply/receive lag, replica health and saturation, failover events, and remaining redundancy.
- **Common Pitfalls:** Equating copies with backups; claiming writes scale; ignoring read-your-writes; assuming promotion is safe without fencing and recovery procedures.

## Interview Questions

1. **[Hard]** Explain how an asynchronous primary/replica database can return success for a write that is absent after failover. **Expected answer shape:** Trace commit, replication delay, promotion, and the failure window; state assumptions about acknowledgment. **Follow-up:** How could synchronous acknowledgment reduce this risk, and what cost does it add?
2. **[Hard]** Trace a user updating a profile and then reading it through a replica that is three seconds behind. **Expected answer shape:** Identify the stale-read anomaly and compare primary routing, session stickiness, and a replication-position mechanism. **Follow-up:** What guarantee can each choice honestly provide?
3. **[Very Hard]** Design read scaling for a service with strict read-your-writes on account settings and tolerant staleness on a public feed. **Expected answer shape:** Separate read classes, describe lag-based routing and fallback, and cover capacity, failover, and observability. **Follow-up:** What evidence would make you add replicas versus optimize queries or introduce a separate read model?