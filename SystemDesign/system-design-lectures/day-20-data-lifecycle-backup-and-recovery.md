# Day 20: Data Lifecycle, Backup, and Recovery

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> | <a href="day-19-search-and-read-models.md">Previous: Day 19</a> | <a href="day-21-multi-region-design.md">Next: Day 21</a></nav>

## What You Will Learn Today

- Define retention, archival, deletion, backup, restore, and disaster recovery as separate lifecycle concerns.
- Explain why replicas improve some availability scenarios but do not provide independent recovery from many data errors.
- Set draft recovery point objective (RPO) and recovery time objective (RTO) targets from business impact.
- Describe a restore plan that is protected, tested, and operationally measurable.

## Prerequisites

- [Day 09: Data Modeling and Storage Choices](../system-design-roadmap.md#day-09-data-modeling-and-storage-choices)
- [Day 15: Replication and Read Scaling](day-15-replication-and-read-scaling.md)
- [Day 17: Transactions and Data Integrity](day-17-transactions-and-data-integrity.md)

## Quick Vocabulary Card

- **Retention:** How long a system keeps data in a particular form or location.
- **Archive:** Lower-cost storage or representation for data accessed less often but retained for a defined purpose.
- **Backup:** A separately recoverable copy or recovery record intended to restore data after loss or corruption.
- **RPO (Recovery Point Objective):** The maximum acceptable amount of data loss measured in time for a stated failure scenario.
- **RTO (Recovery Time Objective):** The target time to restore a service or capability after a stated disruption.
- **Point-in-time recovery (PITR):** Restoring a database to a selected time using a base backup and a sequence of change records, when the database and configuration support it.

## Core Concepts

Data lifecycle covers live data, archives, deletion, copy retention, and recovery. Product needs, privacy commitments, contracts, and operating capacity shape the policy. Specify what happens to primary records, indexes, caches, exports, and backups; deleting one copy does not delete all others.

### Availability, durability, backup, and recovery

Availability asks whether the service responds; durability asks whether acknowledged data survives specified failures. Backups provide a recovery source, while disaster recovery restores service and data. A service can be available but vulnerable to deletion, or well backed up but slow to restore.

Replication copies changes to another node and can help keep service running after a node failure. But a mistaken update or deletion may replicate immediately to every replica. Replicas can also share a failure domain, credentials, control plane, or operator mistake. Backups should provide a recovery path that is protected from the failures they are meant to mitigate, with retention and access controls that match the threat model. A replica is useful redundancy, not a complete backup strategy.

### Define recovery objectives from user impact

RPO and RTO are objectives, not product features. If a payment ledger has an RPO of five minutes, the business is accepting that much loss in a covered recovery scenario unless other controls lower it. An RTO of one hour means the target capability should be restored within that interval, not simply that servers boot. Clarify which data, workflows, and failure scope the target covers: a single-node loss, region loss, logical corruption, or account compromise may need different plans.

Tighter objectives usually require more frequent or continuous recovery data, reserved capacity, automation, and regular drills. That costs money and operational attention. A restore time also depends on database size, throughput, network, validation, key access, and application readiness. Do not infer RTO from backup frequency.

### Recovery mechanisms and their boundaries

Full backups provide a baseline; incremental/differential copies and database log archiving can support point-in-time restore when configured. Mechanics and limits vary by database ([PostgreSQL backup and restore](https://www.postgresql.org/docs/current/backup.html)). Object versioning also needs testing and does not by itself align object and database restore points.

A recovery procedure names who declares an incident, where copies and keys are, how to select a restore point, how to control traffic, and how to validate before resuming. Protect backups with encryption, restricted access, audit, and deletion controls.

### Worked scenario: restoring a deleted tenant

Assume a multi-tenant application stores customer records in a relational database and documents in object storage. An operator accidentally deletes one tenant's records at 10:00; the deletion replicates to the standby immediately. The organization requires no more than 15 minutes of data loss for a region failure and aims to restore a single tenant within two hours, but whole-database PITR would affect all tenants.

Different failures need different restores. A standby and database logs may help with regional loss; tenant deletion may need logical exports, object versions, or an isolated restore. Replacing production with a 09:59 snapshot could discard other tenants' later writes. Instead, restore in isolation, extract the target tenant and related objects, validate consistency, and import through controlled repair. Pair object versions with corresponding metadata.

Rehearse both modes; measure restore, validation, and recovery time. Track missing logs, backup failures, verified restore-point age, and drill results. A successful backup job does not prove recoverability.

### Retention, archival, and deletion

Set retention by data class, including archive access expectations and format compatibility. Deletion may be irreversible and interact with audit needs or legal holds. Document how replicas, indexes, caches, and backup copies expire under applicable policy; legal obligations depend on jurisdiction and counsel.

## Common Mistakes and Interview Traps

- Saying “we have replicas, so we have backups.” Replicas can reproduce logical mistakes and share failure domains.
- Stating an RPO/RTO without defining failure scope, data set, or business impact.
- Measuring backup completion but never restoring or validating the result.
- Restoring a whole database to fix one record without considering newer valid writes from other tenants.
- Ignoring encryption keys, credentials, object versions, and dependencies needed to read a backup.

## Tricky Points

- A backup can be intact but unusable because required logs, encryption keys, schema versions, or application code are unavailable.
- A “successful” point-in-time restore may still require domain validation: relationships and derived data can be logically inconsistent if they came from different recovery points.
- Recovery plans need protection against ransomware or compromised production credentials; backups writable by the same compromised identity may not be independent enough.

## Practical Exercise

**Goal:** Draft recovery objectives and a tested restore plan.

**Input/context:** A subscription service stores account state in PostgreSQL, files in object storage, and search documents in a separate index. A region failure can interrupt the service; an operator may also accidentally delete one customer's data. Propose initial RPO/RTO targets and state the assumptions behind them.

**Constraints:** Separate whole-service disaster recovery from tenant-level repair. Identify recovery sources, access controls, validation, traffic cutover, and the role of replicas. Do not assume every store can restore to the same instant automatically.

**Edge cases:** Corrupt data has replicated; log archive is missing; recovery key is unavailable; object metadata and blobs disagree; restore takes longer than target; a backup account is compromised.

**Acceptance criteria:** Produce a concise runbook outline, RPO/RTO by scenario, at least four verification signals, and a recurring restore drill with a measurable pass condition. No full infrastructure implementation is required.

## Summary

Data lifecycle covers retention and deletion as well as recovery. Availability and durability are different from possessing a backup, and a replica can reproduce unwanted changes. Define RPO/RTO by failure scenario, protect recovery material, and prove restore procedures with drills that validate data and application behavior. Build separate procedures for regional recovery and narrow logical repair where their costs and blast radii differ.

## Cheat Sheet

- **RPO:** Acceptable recovery-point age/data loss for a stated scenario.
- **RTO:** Target time to restore a stated capability.
- **Replica:** Can aid availability; may copy deletion/corruption.
- **Backup:** Independent recovery path; verify retention, access, keys, and restore steps.
- **Test:** Restore, validate, measure, and rehearse; job success is not recoverability.
- **Common Pitfalls:** No scenario for objectives; no restore drills; ignoring cross-store consistency and backup compromise.

## Interview Questions

1. **[Hard]** Why is a replica not a backup? **Expected answer shape:** Compare node failure with logical deletion/corruption and shared failure domains; state what independent recovery adds. **Follow-up:** What controls make a backup meaningfully independent?
2. **[Hard]** Define RPO and RTO for a payment service and explain what each target costs. **Expected answer shape:** Tie objectives to failure scenario and user impact, then discuss recovery data, capacity, and operational burden. **Follow-up:** What drill result would show the RTO target is not credible?
3. **[Very Hard]** Recover one tenant after a bad deletion without rolling back valid writes for all tenants. **Expected answer shape:** Separate logical repair from disaster recovery, restore in isolation, reconcile related data, validate, and import safely. **Follow-up:** How do object storage versions and search projections affect the procedure?