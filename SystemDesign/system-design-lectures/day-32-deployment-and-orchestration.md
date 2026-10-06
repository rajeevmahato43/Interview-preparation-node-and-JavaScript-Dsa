# Day 32: Deployment, Containers, and Orchestration Concepts

<nav aria-label="Lecture navigation">[Roadmap](../system-design-roadmap.md) | [Previous: Day 31](day-31-configuration-and-evolution.md) | [Next: Day 33](day-33-slos-and-error-budgets.md)</nav>

## What You Will Learn Today

- Trace a change from source to a running instance and distinguish build from release.
- Explain why immutable artifacts and gradual rollout reduce deployment risk.
- Separate startup, readiness, and liveness checks by the action each one should trigger.
- Plan traffic draining, rollback, and database-change behavior during a rollout.

## Prerequisites

- [Day 12: Load Balancing and Stateless Services](day-12-load-balancing-and-stateless-services.md)
- [Day 29: Monoliths, Modular Monoliths, and Microservices](day-29-monoliths-and-service-boundaries.md)
- [Day 30: Service Discovery, Gateways, and Internal Communication](day-30-service-communication-and-discovery.md)
- [Day 31: Configuration, Feature Flags, and Schema Evolution](day-31-configuration-and-evolution.md)

## Quick Vocabulary Card

- **Artifact:** A built, versioned output such as an executable package or container image.
- **Deployment:** Making a selected artifact available to serve work in an environment.
- **Orchestrator:** A system that schedules and supervises application instances according to declared state.
- **Readiness:** Whether an instance should receive new work now.
- **Liveness:** Whether an instance should be restarted because it cannot make progress.
- **Drain:** Stop assigning new work while allowing existing work to finish or be safely terminated.

## Core Concepts

A deployment pipeline moves a tested change into production. Build an artifact once, identify it by version or digest, and promote the same artifact through environments while supplying environment-specific configuration separately. Rebuilding separately for production can create an artifact that was never tested. Immutable artifacts make it easier to identify exactly what is running and to compare a candidate with its predecessor. They do not guarantee that configuration, dependencies, or data are compatible.

Containers package an application with much of its runtime environment, but they share a host kernel and still rely on host resources, networking, storage, and configuration. They are not a complete security boundary by themselves. An orchestrator can schedule replicas, restart failed processes, and route to eligible instances, but it cannot make application code safe, data migrations reversible, or capacity infinite. Product behavior depends on platform, configuration, and version; avoid assuming one vendor's probe timing or rollout algorithm applies everywhere.

Health checks should be tied to different decisions. A **startup check** allows a slow-starting process time to initialize before ordinary liveness evaluation, where the platform supports it. A **readiness check** says whether this instance should receive new traffic; a warming instance or one draining during shutdown should not be ready. A **liveness check** asks whether restarting the process is a reasonable recovery action. It should not fail just because a downstream database is briefly unavailable: restarting every instance can amplify an outage. A process can be live but not ready, or ready for basic requests while a noncritical feature is degraded. One endpoint labeled `health` may serve several callers with different needs, so define what each caller's check means.

**Worked scenario: rolling API release.** Assume six stateless API replicas and a load balancer. A rollout replaces a subset at a time. New replicas start, load configuration, warm required state, and pass startup and readiness criteria before receiving traffic. Existing replicas are removed from new routing, given time to finish bounded requests, and then stopped. If the new version's error rate rises, halt progression and route traffic back to the previous compatible version. These steps depend on the platform's documented behavior; the application still needs graceful shutdown and request cancellation semantics. If background jobs share the process, draining HTTP traffic alone may not stop duplicate or interrupted job effects.

Rolling deployment overlaps old and new versions, so both must tolerate the shared schema and contracts. A canary compares candidate and baseline signals on limited traffic, but a small share may still contain high-risk writes. Blue/green shifts traffic between environments, though data stores and external effects can remain shared. Each strategy needs monitoring and an abort criterion.

Resource requests and limits, where offered, influence scheduling and contention. Requests describe planning needs; limits may constrain consumption, with exact semantics varying across orchestrators and resource types. An undersized CPU allocation can increase latency; memory pressure can trigger process termination; generous reservations can waste capacity or prevent other workloads from scheduling. Set values from measurements under representative load, then monitor throttling, restarts, queueing, and saturation instead of treating configuration as a one-time guess.

Rollback is easiest when the previous artifact remains available and persistent state is still compatible. A code rollback may be unsafe after a destructive migration or after the new version writes records that old code cannot parse. Prefer staged schema changes, backward-compatible interfaces, and feature flags for controlled exposure. Define the rollback trigger, who can stop the rollout, and what happens to in-flight requests and jobs. A fix-forward may be safer than binary rollback when new writes have crossed a compatibility boundary.

Readiness also requires monitoring, secrets access, capacity, ownership, and a runbook. For stateful components include restore, migration, and replication plans. Kubernetes probe details are Kubernetes-specific; see the [Kubernetes documentation](https://kubernetes.io/docs/home/) and the [AWS Well-Architected Framework: Operational Excellence](https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/welcome.html) as references, not universal guarantees.

## Common Mistakes and Interview Traps

- Treating a container as a VM or assuming packaging removes host and network failures.
- Using one health endpoint that restarts all instances whenever any dependency is down.
- Sending traffic as soon as a process exists, before it is initialized and ready.
- Calling a canary safe without representative traffic, comparison metrics, or stop conditions.
- Assuming rollback reverses database writes or external side effects.

## Tricky Points

- **Readiness is not correctness.** A readiness result is a routing signal, not proof that every user journey works.
- **Liveness restarts can worsen an outage.** If the fault is shared or external, repeated restarts consume capacity and prevent recovery.
- **Graceful shutdown needs a deadline.** Drain connections and work, but define behavior for requests that exceed the termination window.
- **Health-check scope matters.** Load balancers, orchestrators, and synthetic probes may need distinct checks.

## Practical Exercise

- **Goal:** Design a rollout and rollback plan for a stateless API with a database migration.
- **Context/input:** Four replicas serve traffic. The new version adds an optional column, begins writing it, and later expects it on reads. A batch worker runs alongside the API.
- **Constraints:** No planned downtime; allow old and new versions to overlap; state what each health check controls and how instances drain.
- **Edge cases:** Slow startup, dependency outage, elevated 5xx on candidate, worker interruption, and rollback after some new-format writes.
- **Acceptance criterion:** Provide deployment order, probe purposes, traffic and job draining behavior, candidate stop conditions, and a rollback-versus-fix-forward decision point. Do not provide a full deployment manifest.

## Summary

- Build and test a versioned artifact once, then promote it with controlled configuration.
- Orchestration supervises instances but does not replace sound application, data, or capacity design.
- Startup, readiness, and liveness checks trigger different actions and need different failure scopes.
- Gradual rollout lowers exposure only when traffic, metrics, and abort criteria are meaningful.
- Rollback safety depends on persistent data and side effects as much as on the binary.

## Cheat Sheet

- **Startup:** Has initialization completed?
- **Readiness:** Should this instance receive new work now?
- **Liveness:** Is restart a useful recovery action for a stuck process?
- **Before rollout:** Verify artifact identity, compatibility, capacity, dashboards, and stop criteria.
- **Before rollback:** Check schema, newly written data, in-flight work, and external side effects.

**Common Pitfalls**

- Dependency failure wired directly to liveness.
- No request or worker draining.
- Unbounded termination time or no treatment for in-flight effects.
- Assuming platform defaults are cross-provider guarantees.

## Interview Questions

1. **Hard:** Distinguish startup, readiness, and liveness checks. **Expected answer shape:** State the question each answers, the action it controls, and one bad coupling. **Follow-up:** What should happen if the database is unavailable to every replica?
2. **Hard:** Explain how a rolling deployment serves traffic safely. **Expected answer shape:** Cover overlap, compatibility, readiness, draining, monitoring, and abort behavior. **Follow-up:** What changes for long-lived connections?
3. **Very Hard:** A canary's error rate is normal, but p99 latency and database saturation rise. Decide whether to continue. **Expected answer shape:** Assess user impact, candidate comparison, saturation, traffic representativeness, and rollback threshold. **Follow-up:** How would you separate candidate impact from a coincident load spike?
4. **Very Hard:** A release changed stored records and now the prior binary cannot read them. Build the recovery response. **Expected answer shape:** Stop rollout, bound further writes, inspect compatibility and backups, compare fix-forward with restoration, and preserve evidence. **Follow-up:** What should have been tested before deployment?