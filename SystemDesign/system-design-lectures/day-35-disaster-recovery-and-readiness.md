# Day 35: Disaster Recovery and Operational Readiness

<nav aria-label="Lecture navigation">[Roadmap](../system-design-roadmap.md) | [Previous: Day 34](day-34-capacity-cost-and-autoscaling.md) | [Next: Day 36](day-36-case-study-url-shortener.md)</nav>

## What You Will Learn Today

- Distinguish disaster recovery from ordinary high availability and backup retention.
- Define recovery point and recovery time objectives in measurable business terms.
- Build a recovery plan around dependencies, sequencing, ownership, and safe validation.
- Explain why a restore drill is stronger evidence than the existence of a backup job.

## Prerequisites

- [Day 20: Data Lifecycle, Retention, and Backups](day-20-data-lifecycle-backup-and-recovery.md)
- [Day 21: Global and Multi-Region Systems](day-21-multi-region-design.md)
- [Day 27: Observability and Incident Diagnosis](day-27-observability-and-diagnosis.md)
- [Day 33: SLOs, SLIs, Error Budgets, and Reliability](day-33-slos-and-error-budgets.md)

## Quick Vocabulary Card

- **Disaster recovery (DR):** Restoring an acceptable service after a severe failure affecting a system or failure domain.
- **RPO:** Maximum tolerable data loss measured in time before the disruption.
- **RTO:** Target time to restore a defined service level after disruption begins.
- **Backup:** A recoverable copy or representation of data, separated from ordinary failure paths to the degree required.
- **Failover:** Moving service to an alternate component, site, or region.
- **Restore drill:** A planned test that recovers data and service while recording actual outcomes and gaps.

## Core Concepts

High availability tries to keep a service operating through expected component failures. Disaster recovery addresses a larger loss, such as a region-wide outage, destructive operator action, compromised credentials, or corruption propagated to replicas. These goals overlap but are not interchangeable. A replica can improve availability while reproducing accidental deletion. A backup can preserve recoverable history while leaving the service unavailable until restoration completes.

RPO and RTO describe business tolerance, not product features. **RPO** asks how much recent data the organization can lose and still recover acceptably. **RTO** asks how long a defined service can remain below an acceptable level after a disruption. An RPO of 15 minutes does not mean every backup runs at that interval, nor that all writes are recoverable with that precision. An RTO of one hour is not achieved because a server starts in ten minutes; dependencies, validation, routing, user access, and operational decisions are part of recovery. Specify which service functions count as restored and from what time the clock starts.

Recovery design follows the failure model. A warm standby may reduce activation time but adds ongoing cost and still needs data replication, credentials, capacity, and tested traffic routing. Backup-and-restore can be less expensive while taking longer. Multi-region active-active may improve regional continuity but adds conflict resolution, data consistency, operational, and compliance complexity. There is no universally best pattern; the business impact, data semantics, probability model, and team readiness determine the acceptable trade-off.

**Worked scenario: API with database, cache, and queue.** A regional outage makes the primary database unavailable. Determine whether this is infrastructure failure or corrupted data before promoting a replica. Verify data freshness, recover the database, check schema and invariants, start API capacity, then test before shifting traffic. Rebuild disposable cache entries, but preserve any coordination state. Replay or drain queued work with duplicate external effects in mind. Restore producers gradually and monitor correctness and latency. Actual loss and recovery time depend on replication, backups, and the tested runbook.

A recovery plan needs an inventory of critical state and dependencies: databases, object storage, queues, encryption keys, identity providers, DNS, certificates, secrets, build artifacts, external payment or messaging providers, and people with access. A backup that requires an unavailable key or undocumented account is not practically recoverable. Decide which dependencies must be restored first, which can be degraded, and which actions must stop to avoid writing into the wrong region or duplicating work. Assign a decision owner and a technical operator; incident role clarity reduces delay.

Protect backups with suitable retention, separated access, recoverable encryption keys, and integrity checks. Replication does not provide point-in-time recovery when corruption or deletion propagates; a backup is not a live failover target unless its freshness and recovery path support that role.

The strongest readiness evidence is a restore test that measures the real process. Restore into an isolated environment, recover to a known point, apply required schema or log replay, validate record counts and business invariants, start dependent services, and exercise critical user flows. Record actual RPO and RTO, operator actions, missing access, runbook ambiguity, and data discrepancies. A successful storage restore alone does not demonstrate the application can serve correct traffic. Repeat drills after architecture, permissions, backup, or dependency changes. Test failback too: returning to the preferred site can cause another outage if replication direction, queues, or writes are not reconciled.

Operational readiness also includes incident detection, status communication, customer support, escalation paths, and legal or regulatory notification where relevant. Practice the decision to fail over and the decision not to fail over. Include graceful degradation for noncritical features, safe write behavior during uncertainty, and reconciliation after partial recovery. The [Google SRE guidance on managing critical state](https://sre.google/sre-book/managing-critical-state/) and [AWS Well-Architected Reliability guidance](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html) provide useful review lenses, not guarantees of a specific recovery time.

## Common Mistakes and Interview Traps

- Treating replica count or a green backup job as proof of disaster recovery.
- Quoting RPO/RTO without defining data scope, service level, clock start, or measurement evidence.
- Failing over automatically without distinguishing availability failure from corrupted data.
- Restoring the database but forgetting keys, DNS, queue policy, credentials, schema, and operators.
- Claiming recovery works without testing a real restore and critical end-to-end behavior.

## Tricky Points

- **RPO and RTO are objectives, not guarantees.** Actual results must be measured and compared with the business target.
- **Failover can lose or duplicate work.** Replication lag, in-flight requests, queues, and external effects need explicit handling.
- **Restore correctness includes application invariants.** A readable database can still contain inconsistent business state.
- **Failback is another migration.** Reconcile writes and data direction before routing back.

## Practical Exercise

- **Goal:** Create a recovery-readiness plan for a backend service.
- **Context/input:** The service uses a relational database, cache, and queue; users can create orders and trigger payment-provider calls. It runs in one primary region and retains backups elsewhere. No provider-specific recovery behavior is assumed.
- **Constraints:** Propose business RPO/RTO targets as assumptions, distinguish loss of availability from corruption, and include verification before restoring full writes.
- **Edge cases:** Backup key unavailable, queue replay repeats a payment request, cache contains a lock, DNS change is slow, and failover region lacks normal peak capacity.
- **Acceptance criterion:** Deliver a dependency inventory, recovery sequence and owners, restore/failover decision points, measurable RPO/RTO evidence, and a drill that tests a critical user journey. Do not provide a full runbook solution.

## Summary

- HA handles expected component failures; DR handles severe service or failure-domain loss and recovery.
- RPO limits tolerable data loss; RTO targets time to a defined restored service level.
- Replicas, backups, failover, and restore each protect against different failures.
- Recovery depends on data, dependencies, access, capacity, sequencing, and operational decisions.
- A tested restore and end-to-end validation provide evidence; an untested plan is an assumption.

## Cheat Sheet

- Define failure scenarios, service level restored, RPO, RTO, and measurement start.
- Inventory state, keys, identity, network, queues, external dependencies, and owners.
- Distinguish corrupted state from unavailable state before promoting or restoring.
- Restore, validate invariants and critical flows, then shift traffic gradually.
- Test restore, failover, and failback; record achieved objectives and gaps.

**Common Pitfalls**

- Replica equals backup.
- RTO counts only machine startup.
- Restore omits encryption keys or queue/external-effect handling.
- No drill after permissions or architecture change.

## Interview Questions

1. **Hard:** Define RPO and RTO for an order service. **Expected answer shape:** State tolerated lost-write window, time to a named service level, assumptions, and how each will be measured. **Follow-up:** How does the target differ for read-only browsing?
2. **Hard:** Why is replication not a complete backup strategy? **Expected answer shape:** Contrast availability/freshness with corruption, deletion, retention, and point-in-time restoration. **Follow-up:** What failure can defeat both replicas and backups?
3. **Very Hard:** A region is unavailable and the replica is 8 minutes behind. The stated RPO is 5 minutes. Decide what to do. **Expected answer shape:** Identify incident facts, business authority, data-loss implications, alternative recovery paths, communication, and safety controls rather than silently violating the target. **Follow-up:** How will you reconcile late or duplicate writes?
4. **Very Hard:** What evidence would convince you that a service can recover within its RTO? **Expected answer shape:** Describe repeatable restore/failover drills, measured timings, data validation, critical flow checks, dependency access, ownership, and gaps. **Follow-up:** How would you test recovery from malicious deletion rather than infrastructure loss?