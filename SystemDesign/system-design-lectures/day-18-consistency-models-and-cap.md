# Day 18: Consistency Models and CAP Trade-offs

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> | <a href="day-17-transactions-and-data-integrity.md">Previous: Day 17</a> | <a href="day-19-search-and-read-models.md">Next: Day 19</a></nav>

## What You Will Learn Today

- Describe linearizability, eventual consistency, read-your-writes, and monotonic reads in user-visible terms.
- Separate consistency guarantees from freshness expectations and replication implementation details.
- State the CAP theorem's scope precisely: what trade-off arises when a network partition occurs.
- Apply consistency choices to different operations and explain why no single system-wide label is enough.

## Prerequisites

- [Day 15: Replication and Read Scaling](day-15-replication-and-read-scaling.md)
- [Day 17: Transactions and Data Integrity](day-17-transactions-and-data-integrity.md)

## Quick Vocabulary Card

- **Consistency model:** A contract describing which results clients may observe when operations overlap or replicas differ.
- **Linearizability:** Each operation appears to take effect atomically at one point between its invocation and response, respecting real-time order for non-overlapping operations.
- **Eventual consistency:** If updates stop and the system continues to make progress, replicas are expected eventually to converge; this alone says little about how stale reads may be.
- **Read-your-writes:** A client that has completed a write will not subsequently read an older value for that data, within the guarantee's scope.
- **Monotonic reads:** A client does not move backward to an older observed version of the same data.
- **Network partition:** A communication failure that prevents some nodes from exchanging messages even though they may still run.

## Core Concepts

Consistency is not a single slider called “strong” versus “eventual.” It describes observable behavior for operations. A useful design question is: after a write returns, what may a later read return, from which client or region, and during what failures? The answer depends on the storage system, its configuration, the operation, and how the application routes requests. The Jepsen consistency-model reference provides a useful vocabulary for distinguishing histories and guarantees ([Consistency Models](https://jepsen.io/consistency)).

Linearizability is a strong single-object style guarantee: a successful update can be treated as taking effect at one instant between request and response, and a later non-overlapping read cannot report an older value. It is useful for operations such as acquiring a unique seat or checking a balance when the user promise depends on current state. It may require coordination across replicas and incur latency or reduced availability during communication failures.

Eventual consistency is weaker and often useful for feeds, counters, or search results. It permits temporary disagreement, but the application still needs to define acceptable delay, ordering, conflict handling, and what happens if updates continue. “Eventually” is not an SLO: measure lag and expose or handle stale results. Session guarantees can provide useful middle ground. Read-your-writes can route a client's follow-up read to a current replica or primary. Monotonic reads can keep the client on a replica at least as current as one it has already observed. These are guarantees only if the routing and version-tracking mechanism actually enforces them.

### CAP: precise scope

CAP considers a distributed data service when a network partition prevents nodes from communicating. During that partition, the system cannot in general guarantee both:

- **Consistency in the CAP sense:** an operation behaves as though there were one up-to-date copy (commonly framed around atomic/linearizable behavior), and
- **Availability in the CAP sense:** every request sent to a non-failing node receives a response, even if that response may not reflect the latest write.

If both sides continue accepting operations, they may conflict or be stale; refusing or delaying unsafe operations sacrifices CAP availability. This trade-off applies during a partition, not as a permanent normal-operation choice. Latency, durability, recovery, and conflict rules remain separate concerns. Transaction isolation labels are not CAP properties ([PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)).

### Workload-specific choices

Consider three operations:

- **Bank transfer authorization:** An old balance can permit overspending, so the authoritative debit decision usually needs an atomic invariant and a strong coordination boundary. During inability to reach that authority, rejecting or delaying a transfer may be safer than accepting it.
- **Social feed display:** A brief delay in showing a new post may be acceptable. Replicas can serve the feed with a freshness target, while post creation itself has its own write contract.
- **View counter:** Temporary undercount or delayed aggregation may be acceptable if the total converges and abuse or billing does not depend on an exact immediate count.

One product may need different contracts for transfers, profile edits, feeds, and search. State consistency per entity, operation, and user journey rather than labeling the whole app “eventually consistent.”

### Worked trace: a partition during a reservation

Suppose East and West both hold a seat marked available, then lose communication. If each confirms a reservation, the system may oversell. Keeping one writer or rejecting requests in the isolated region protects the invariant but blocks some users. A pending reservation can defer the decision, changing the API contract until ownership is resolved.

Choose based on the invariant and business cost of double booking versus temporary inability to reserve. State the client result, durability, conflict handling, and maximum pending time; “choose CP” is not a complete design.

## Common Mistakes and Interview Traps

- Reciting “CAP means choose any two” without naming a partition or defining the guarantees.
- Treating eventual consistency as a precise freshness bound.
- Calling a database “strongly consistent” without specifying operation, scope, and failure conditions.
- Assuming quorum reads and writes always provide linearizability; quorum overlap, version rules, leader behavior, and configuration all matter.
- Using CAP to answer normal-operation latency or transaction-isolation questions.

## Tricky Points

- “Availability” in CAP is a formal property about responses during a partition, not a synonym for uptime or an SLO percentage.
- Strong consistency does not inherently mean every read goes to one physical primary, and a replica read is not inherently stale; the configured protocol and guarantees determine behavior.
- A client can observe non-monotonic results if requests are routed to replicas at different progress points, even when each replica is internally correct.

## Practical Exercise

**Goal:** Assign consistency contracts to a bank balance, social feed, and view counter.

**Input/context:** Each service is deployed in two regions. Network communication between regions can fail for several minutes. Users expect clear API responses; the system must not silently claim success for an operation that may later be discarded.

**Constraints:** For each operation, choose what can proceed during a partition, what reads may show, and what recovery or reconciliation is required. Distinguish CAP availability from the service's long-term uptime target.

**Edge cases:** Simultaneous writes on both sides; a client retries after a timeout; a user moves regions after observing a new value; connectivity returns with conflicting updates.

**Acceptance criteria:** Produce a table with operation, invariant, consistency promise, partition behavior, and client-visible outcome. Defend one trade-off and explain why it is workload-specific.

## Summary

Consistency models describe observable histories, not just database brands. Linearizability offers a strong real-time ordering contract with coordination costs; eventual consistency allows temporary divergence and requires explicit convergence and freshness behavior. CAP addresses the consistency-versus-availability choice during a network partition. Make the decision per operation and explain the failure response users will see.

## Cheat Sheet

- **Linearizability:** Operations appear atomic and real-time ordered.
- **Eventual:** Convergence is expected after updates stop; no inherent maximum lag.
- **Session guarantees:** Read-your-writes and monotonic reads can improve one client's experience.
- **CAP:** Under partition, preserve the stated single-copy consistency or answer all requests; some requests cannot satisfy both.
- **Common Pitfalls:** “Choose two”; applying CAP outside a partition; treating eventual as bounded; using one label for every operation.

## Interview Questions

1. **[Hard]** Explain the difference between read-your-writes and linearizability. **Expected answer shape:** Define each through observable behavior and describe their scope. **Follow-up:** Can a system provide one session guarantee without providing the other to all clients?
2. **[Hard]** During a regional partition, two regions accept a reservation for the same seat. Which guarantee was sacrificed, and what would you change? **Expected answer shape:** Trace the conflict, state the invariant, compare accept/reconcile versus reject/wait behavior. **Follow-up:** How would a pending reservation alter the API contract?
3. **[Very Hard]** Apply CAP to a multi-region service and separate the theorem from practical design choices. **Expected answer shape:** State the partition condition and formal trade-off, then discuss per-operation policy, latency, failure response, and recovery. **Follow-up:** Which metric or business requirement would change your choice?