# Day 21: Global and Multi-Region Systems

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> | <a href="day-20-data-lifecycle-backup-and-recovery.md">Previous: Day 20</a></nav>

## What You Will Learn Today

- Distinguish availability zones from regions and explain which failure domains each design addresses.
- Compare active-passive and active-active patterns for a stated workload and recovery objective.
- Design regional routing, data ownership, replication, failover, and failback as one operating model.
- Identify conflict, residency, and split-brain concerns created by writes in multiple regions.

## Prerequisites

- [Day 15: Replication and Read Scaling](day-15-replication-and-read-scaling.md)
- [Day 18: Consistency Models and CAP Trade-offs](day-18-consistency-models-and-cap.md)
- [Day 20: Data Lifecycle, Backup, and Recovery](day-20-data-lifecycle-backup-and-recovery.md)

## Quick Vocabulary Card

- **Availability zone:** A provider-defined deployment area intended to be isolated from some failures within a region; exact independence is provider-specific.
- **Region:** A geographic deployment area with its own infrastructure and failure boundaries.
- **Active-passive:** One region serves authoritative traffic while another is prepared to take over, usually with some failover process.
- **Active-active:** Multiple regions serve traffic concurrently; writes may be local, routed to owners, or reconciled across regions.
- **Failover:** Moving traffic or authority away from a failed region.
- **Failback:** Returning service to a recovered preferred region or topology after a disruption.
- **Data residency:** Requirements that constrain where particular data may be stored or processed.

## Core Concepts

Multi-region design can reduce user latency or improve regional recovery, but adds replication, routing, consistency, security, and operational cost. A second region is not recovery-ready unless it can serve traffic, access data and secrets, run dependencies, and validate state. Start from a latency, recovery, residency, or risk requirement; zones and tested backups may be sufficient without global writes.

Zones can tolerate some local failures with relatively short network distances; regions offer geographic separation but add latency and data movement. Failure independence is provider-specific. Validate selected services' documented behavior using relevant guidance ([AWS Reliability](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html), [Google Cloud Architecture Framework](https://cloud.google.com/architecture/framework)).

### Active-passive

In active-passive, one region is the normal write authority; another receives replicated data and can take over. This is often easier to reason about than concurrent regional writes. A scaled-down standby costs less but must have enough capacity for the RTO. Specify failover authority, possible data loss, promotion, and fencing of the old region.

Automatic failover is faster but may mistake isolation or control-plane failure for regional loss; manual decisions may miss the recovery target. DNS and global routing are not instant for every client, and connections or cached routes persist. Test actual traffic movement.

### Active-active

Active-active serves user requests in multiple regions. Reads can be local while writes use one of several models:

- Route each entity to a home region; other regions serve replicated reads.
- Allow writes to disjoint data, resolve concurrent same-entity changes by policy, or coordinate across regions at added latency.

“Active-active” does not mean every region can safely write every record without coordination. Last-write-wins based on timestamps can discard a valid update, and clocks across regions are not a reliable universal conflict oracle. Conflict-free data types can fit specific mergeable operations, but do not automatically solve arbitrary business invariants such as seat allocation or money transfer. Define write ownership, conflict semantics, and the client response before choosing the label.

### Worked scenario: global catalog

Assume a read-heavy catalog serves users in North America and Europe. Product detail reads need low regional latency; product edits are made by a small operations team. Search can lag by five seconds; price and inventory must be revalidated at checkout. The business needs to tolerate a regional outage but has no requirement for independent simultaneous writes in both regions.

A reasonable starting design is active-passive for the write database, with a warm standby and local read models only where freshness permits. Traffic goes to the healthy region; edits use the current authority, and checkout validates price and stock there. Failover fences the old region, promotes a suitable copy, changes routing, and accounts for the acknowledged-write gap. Search projections catch up from durable changes. This favors simple ownership over writes in both regions.

If local edits become necessary, identify fields with independent ownership versus globally shared values that need one authority or coordination. This changes consistency policy, not just routing. Rehearse failback by reconciling writes and resynchronizing replicas before returning authority.

### Residency, security, and operations

Data residency may restrict copying personal or regulated data to another region. Check where backups, logs, traces, queues, support tools, and derived search data reside, not only the primary database. Cross-region replication requires network encryption, controlled identities, key availability, and an explicit trust boundary. A regional recovery design should identify whether keys and control-plane dependencies themselves survive the event.

Runbooks should cover declaration, fencing, promotion, retries, validation, capacity, and failback. Monitor replication lag, traffic, errors, and readiness; exercise infrastructure and control-plane failures. Untested systems may depend on the original region in hidden ways.

## Common Mistakes and Interview Traps

- Adding a second region without a user, business, residency, or recovery requirement.
- Treating DNS routing as instant, or failing to account for cached routes and existing connections.
- Calling a topology active-active while ignoring who owns writes or how conflicts are resolved.
- Promoting a standby without fencing the previous primary or measuring possible data loss.
- Discussing failover but not failback, capacity, secrets, dependencies, backups, or regional data rules.

## Tricky Points

- Local reads can be stale after local writes if replication is asynchronous; “nearest region” is not the same as “most current copy.”
- A region can be healthy while its control plane, identity provider, DNS, or dependent service is not. Failure domains include dependencies and operations, not just compute.
- Low RTO does not guarantee low RPO. Traffic can return quickly to a copy that is missing recent writes unless the recovery contract accounts for that gap.

## Practical Exercise

**Goal:** Design regional failover for a read-heavy service.

**Input/context:** A product catalog serves users in North America and Europe, has read-heavy traffic, one global operations team editing products, and requires service recovery within 30 minutes after a regional outage. Search may lag five seconds; checkout must not confirm an unavailable or incorrectly priced item.

**Constraints:** Compare active-passive and active-active. State write authority, replica/freshness assumptions, routing behavior, RPO/RTO implications, fencing, and failback. Account for data residency as an open requirement to clarify, not an assumed answer.

**Edge cases:** Inter-region partition with both regions reachable to some clients; primary loss during acknowledged write; DNS or global router stale state; recovered former primary contains divergent writes; standby lacks production capacity.

**Acceptance criteria:** Draw normal and failover flows, identify the authority for every write, list the declaration and promotion steps, state user-visible behavior during uncertainty, and name metrics and a drill that validate the recovery objective.

## Summary

Multi-region architecture is justified by explicit latency, recovery, or residency needs. Active-passive centralizes write authority and can simplify correctness, but requires tested promotion and adequate standby capacity. Active-active can improve locality and availability only when ownership and conflict rules are defined. Routing, replication, security, data recovery, failback, and operator procedures are all part of the design.

## Cheat Sheet

- **Zones:** Address some within-region failures; provider-specific isolation.
- **Active-passive:** One write authority; simpler conflict model; requires tested promotion/fencing and standby capacity.
- **Active-active:** Concurrent serving; write ownership or conflict rules are mandatory.
- **Failover:** Detect, decide, fence, promote, route, validate, monitor.
- **Failback:** Reconcile and resynchronize before moving authority back.
- **Common Pitfalls:** Multi-region without need; assuming instant routing; ignoring stale reads, RPO, residency, and conflict handling.

## Interview Questions

1. **[Hard]** What requirement justifies two regions instead of multiple zones and backups? **Expected answer shape:** Compare latency, failure scope, recovery objectives, cost, and operational complexity under explicit assumptions. **Follow-up:** What evidence would show the second region is ready to take traffic?
2. **[Hard]** Compare active-passive and active-active for a read-heavy catalog with infrequent global edits. **Expected answer shape:** Cover write authority, local reads, lag, failover, conflict risk, and cost. **Follow-up:** Which catalog fields could safely have independent regional ownership?
3. **[Very Hard]** A network partition leaves both regions accepting traffic, and the former primary returns after promotion. Describe safe recovery. **Expected answer shape:** Explain fencing, authority, possible divergent writes, reconciliation or rebuild, routing, and validation. **Follow-up:** How do RPO and the client-visible result change if the last acknowledged writes were not replicated?