# Day 34: Capacity Planning, Autoscaling, and Cost

<nav aria-label="Lecture navigation">[Roadmap](../system-design-roadmap.md) | [Previous: Day 33](day-33-slos-and-error-budgets.md) | [Next: Day 35](day-35-disaster-recovery-and-readiness.md)</nav>

## What You Will Learn Today

- Find the constrained resource in a workload instead of scaling the most visible component by habit.
- Choose a scaling signal connected to demand and understand its delay and saturation risks.
- Explain why replica growth may not increase useful throughput.
- Include headroom, cost guardrails, and load testing in capacity decisions.

## Prerequisites

- [Day 04: Estimation and Back-of-the-Envelope Math](day-04-capacity-estimation.md)
- [Day 05: Latency, Throughput, and Tail Behavior](day-05-latency-throughput-and-queues.md)
- [Day 12: Load Balancing and Stateless Services](day-12-load-balancing-and-stateless-services.md)
- [Day 27: Observability and Incident Diagnosis](day-27-observability-and-diagnosis.md)

## Quick Vocabulary Card

- **Capacity:** The amount of work a component can sustain while meeting its constraints.
- **Bottleneck:** The constrained component or resource limiting end-to-end throughput or latency.
- **Saturation:** A resource or queue approaching its useful limit, where added demand degrades service.
- **Headroom:** Spare capacity reserved for bursts, failures, uncertainty, or recovery.
- **Autoscaling:** Automatically adjusting resources or instance count in response to a policy signal.
- **Scaling lag:** Time between demand changing and added capacity becoming useful.

## Core Concepts

Capacity planning starts from workload and service objectives, not from an instance count. Estimate average and peak request rates, concurrency, payload sizes, read/write mix, and dependency work. Then observe resource use and latency under representative load. A CPU-bound API may benefit from more compute; a service waiting on a saturated database may not. Adding application replicas can increase database connections and make the original bottleneck worse.

Vertical scaling gives one instance more resources and may be operationally simple until a limit, cost step, or failure concentration becomes unacceptable. Horizontal scaling adds instances and can improve throughput or failure tolerance when work can be distributed. It also increases coordination and shared-resource pressure. Stateful systems may require partitioning, replication, or careful capacity changes; “add replicas” is not universally available or safe.

Choose a scaling signal that relates to the resource or work queue that is becoming constrained. CPU can help for CPU-bound work, but it is a weak signal if requests are waiting on a remote database, event loop, connection pool, or disk. Request rate alone ignores request cost. Queue age or queued work per consumer can reveal asynchronous backlog; concurrency or active requests can matter for a server with bounded workers. A composite policy may be useful, but more signals add tuning and debugging work. Always monitor the saturation boundary directly, such as pool exhaustion, rejected work, throttling, or growing queue age.

**Worked scenario: read-heavy API.** Traffic doubles while API CPU remains moderate, but database wait time and query latency rise as the connection pool fills. More API instances may multiply connections and worsen overload. Verify query plans, pool sizing, cache behavior, and database capacity before changing the scale-out policy. Reducing reads, improving indexes, caching, or adding read capacity have different freshness and cost trade-offs; measurements should decide.

Autoscaling is reactive unless the system has forecast or scheduled capacity. It takes time to detect demand, decide, schedule, start, initialize, pass readiness, and warm caches or pools. During this lag, existing capacity absorbs the burst. If the service is already saturated, metrics can become delayed or misleading: CPU may be throttled, requests may be rejected before they count, and a queue may grow faster than consumers can drain it. Set minimum capacity and headroom for the expected burst and failure scenario, and use a scale-out signal that responds before user latency collapses where possible. Exact reaction times and policies are platform-specific, so measure them in the deployed environment.

Scale-in deserves equal care. Removing instances too quickly can evict warm caches, terminate long requests, or cause connection churn. Use cooldowns or stabilization, drain work, and protect a floor appropriate to normal and failover demand. Queue consumers should stop taking new work before termination and finish or safely return leased work. Keep maximum limits and admission control so scaling does not turn an unbounded cost increase into the default response to a traffic spike or attack.

Cost is driven by more than compute: storage and retention, network egress, managed service tiers, idle minimums, cross-region transfer, logs and metrics, and operational labor can dominate. Measure cost per useful unit such as a successful request or processed job, while checking that the unit meets latency and reliability goals. A cheap design that repeatedly misses objectives is not efficient. A high-availability design may require deliberate spare capacity; this is insurance whose value depends on impact and recovery time.

Use load tests to find a capacity curve under realistic mixes, cache states, bursts, and dependency delays. Track throughput, tail latency, errors, queue age, and saturation; repeat after material changes. Record safe limits and scaling lead time. The [AWS Cost Optimization guidance](https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html) and [Google Cloud Architecture Framework](https://cloud.google.com/architecture/framework) are decision lenses; verify actual pricing and scaling behavior in the chosen environment.

## Common Mistakes and Interview Traps

- Scaling the API tier while the database, connection pool, or downstream quota is saturated.
- Treating CPU or request count as a universal autoscaling signal.
- Ignoring startup, warm-up, metric, and scheduling delay.
- Optimizing average cost while omitting peak, failover headroom, or degraded mode.
- Setting no maximum capacity or admission limit, allowing cost to track abusive demand.

## Tricky Points

- **More replicas can lower throughput.** They may contend for a shared database, lock, connection limit, or rate quota.
- **A metric can go quiet during failure.** Rejected requests may vanish from a success-based demand signal while queue age or saturation worsens.
- **Autoscaling cannot fix an unstable feedback loop.** Scale-out can increase shared load; slow scale-in can retain expensive capacity.
- **Failover consumes headroom.** Capacity planned only for normal traffic may collapse when a zone or region is lost.

## Practical Exercise

- **Goal:** Propose a capacity and autoscaling plan for a read-heavy API.
- **Context/input:** The API has several stateless instances, a relational database, a cache, and a background queue. During peaks p99 latency rises; average API CPU is only 45%. Cost has a monthly ceiling.
- **Constraints:** Do not assume the application tier is the bottleneck. Define a safe capacity test and preserve a stated reliability target.
- **Edge cases:** Cache cold start, one database replica unavailable, queue growth, traffic spike faster than instance startup, and abusive request volume.
- **Acceptance criterion:** Name the measurements needed to locate saturation, recommend candidate scaling signals with lag caveats, specify minimum/maximum/headroom policies, and give one cost guardrail. Do not invent benchmark results or a universal instance count.

## Summary

- Capacity is end-to-end; find the bottleneck before adding resources.
- Autoscaling has detection and warm-up lag, and its signal can be misleading under saturation.
- Extra application replicas may overload shared dependencies rather than increase useful throughput.
- Plan headroom, scale-in behavior, maximums, and admission control alongside scale-out.
- Validate with realistic tests and track cost per useful work under the required service level.

## Cheat Sheet

- Identify demand, bottleneck, saturation signal, and scaling lead time.
- Scale the constrained resource, or reduce work reaching it.
- Keep minimum headroom for burst and failure; set ceilings and load shedding.
- Test cold and warm conditions, dependency degradation, and failover load.
- Measure cost alongside user outcomes, queue age, and tail latency.

**Common Pitfalls**

- CPU-only scaling for I/O-bound services.
- Scaling application pods without connection-pool budgets.
- No max, no scale-in stabilization, and no protection against queue buildup.
- Treating a single load-test peak as a durable production capacity guarantee.

## Interview Questions

1. **Hard:** Why might adding API instances make p99 latency worse? **Expected answer shape:** Trace shared-resource pressure, connection growth, queueing, and saturation; state what to measure. **Follow-up:** Which signal would reveal the actual bottleneck?
2. **Hard:** Choose an autoscaling metric for a queue worker. **Expected answer shape:** Relate backlog or age to processing capacity, include startup lag, bounds, and safe scale-in. **Follow-up:** What if message processing time varies widely?
3. **Very Hard:** Demand doubles faster than new instances start, while the database is near its connection limit. Design immediate and long-term controls. **Expected answer shape:** Protect dependencies with admission control, bounded concurrency, prioritization, headroom, and measured scaling; discuss cost and SLO impact. **Follow-up:** How will you drain backlog without creating a second overload?
4. **Very Hard:** Defend capacity planning for loss of one availability zone under a fixed budget. **Expected answer shape:** State failure assumptions, required surviving capacity, degraded features, test evidence, and cost trade-offs. **Follow-up:** What objective justifies the reserved headroom?