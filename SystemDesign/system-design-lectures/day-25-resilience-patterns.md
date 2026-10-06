# Day 25: Circuit Breakers, Bulkheads, and Load Shedding

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> | Previous: <a href="day-24-ordering-and-coordination.md">Day 24</a> | Next: <a href="day-26-sagas-and-workflows.md">Day 26</a></nav>

## What You Will Learn Today

- Separate failure detection from the decision to stop calling a dependency.
- Explain closed, open, and half-open circuit-breaker behavior and its limits.
- Use bulkheads and admission controls to protect capacity for important work.
- Choose graceful degradation or load shedding without hiding persistent failures.

## Prerequisites

- [Day 05: Latency, Throughput, and Tail Behavior](day-05-latency-throughput-and-queues.md)
- [Day 12: Load Balancing and Stateless Services](day-12-load-balancing-and-stateless-services.md)
- [Day 22: Timeouts, Deadlines, and Retries](day-22-timeouts-retries-and-deadlines.md)

## Quick Vocabulary Card

- **Circuit breaker:** A policy that temporarily blocks calls to a failing dependency after a defined failure signal.
- **Closed:** Calls flow normally while outcomes are observed.
- **Open:** Calls are rejected or degraded without contacting the dependency.
- **Half-open:** A limited probe set is allowed to test recovery.
- **Bulkhead:** Isolation that caps how much capacity one workload or dependency can consume.
- **Load shedding:** Deliberately rejecting lower-priority work to keep critical work within capacity.

## Core Concepts

Resilience patterns limit the damage a failing or overloaded dependency can cause. They do not make the dependency healthy; they control local behavior while failure is detected and recovery is tested. The roadmap’s [Day 25 entry](../system-design-roadmap.md#day-25-circuit-breakers-bulkheads-and-load-shedding) references Google's SRE guidance on [addressing cascading failures](https://sre.google/sre-book/addressing-cascading-failures/).

### Circuit breaker state machine

In the **closed** state, calls proceed and outcomes are sampled. If a configured failure condition is reached, the breaker moves to **open** for a cooldown, rejecting calls quickly or invoking an explicit fallback. After the cooldown, it enters **half-open** and permits a small number of probes. Success may close the breaker; failure reopens it. The exact thresholds, rolling window, concurrency, and state-sharing behavior are implementation choices, not universal guarantees.

A breaker needs a meaningful signal. Counting every error can be wrong: a `400` validation response is not evidence the service is down, while timeouts and selected overload responses may be. A low-traffic dependency may not produce enough samples to classify reliably. Separate a circuit breaker's dependency-level health signal from a caller-specific deadline, bulkhead saturation, or product error. Instrument transitions, rejected calls, probes, and fallback outcomes.

Breakers can mask an outage if operators see only fast fallback success. Preserve visibility into the underlying dependency and breaker-open duration. Avoid flapping with an appropriate window and recovery policy. A process-local breaker may have different state on each instance; synchronized fleet-wide state can create its own dependency and complexity. Choose scope deliberately.

### Bulkheads protect independent work

Give dependency calls bounded concurrency, connection pools, or worker capacity so a slow integration cannot occupy every request slot. Separate pools by dependency or priority where justified. A bulkhead should fail fast or queue only within a bounded wait; an unbounded queue simply delays exhaustion. Capacity isolation has a utilization cost because one pool may sit idle while another is saturated, so size against measured workloads and preserve headroom for critical paths.

Backpressure and admission control limit accepted work before it consumes scarce resources. Reject early with a retryable response only when caller retry behavior is safe and bounded. Shed optional recommendation or enrichment work before authorization, payment accounting, or other correctness-critical actions. A fallback must be truthful: returning stale or partial data should be an explicit product contract, not a fabricated success.

### Worked example: checkout and recommendations

Suppose checkout synchronously requests inventory, payment authorization, and optional recommendations. If recommendations slow down, its calls should occupy a small independent pool and have a short deadline; checkout can omit suggestions while preserving the purchase path. If payment authorization is failing, silently pretending the charge succeeded is not a valid fallback. A breaker can stop repeated calls during a known failure, while a bulkhead preserves slots for inventory and payment. Admission control can reject excess new checkout attempts rather than let queues grow past the deadline. Monitor both user outcomes and the failing dependency so graceful degradation does not conceal an incident.

## Common Mistakes and Interview Traps

- Treating a circuit breaker as a retry policy or as a mechanism that repairs a dependency.
- Counting validation and business errors as dependency health failures.
- Opening a breaker from too few or misleading samples without considering traffic volume.
- Using a fallback that changes business correctness or hides a persistent outage.
- Creating an unbounded queue behind a bulkhead and calling it isolation.
- Applying the same priority to optional enrichment and critical transaction work.
- Ignoring process-local breaker differences or alerting only on caller-facing success.

## Tricky Points

An open circuit protects local capacity but can delay recovery if the probe policy is too conservative, or overload recovery if too many half-open probes are released at once. A breaker can also trip on local saturation caused by the caller rather than a failed dependency. Separate timeout, concurrency, and dependency error signals; state what fallback is valid and make transitions observable.

## Practical Exercise

**Goal:** Protect checkout from a failing recommendation service.

**Inputs/context:** Checkout must reserve inventory and authorize payment; recommendations are optional. Recommendation latency has a long tail and may be unavailable.

**Constraints:** Define breaker signals and states, independent concurrency limits, deadline, fallback, and load-shedding priority. Do not claim any resilience pattern guarantees recovery.

**Edge cases:** Low-volume false signal; recommendation timeout while payment succeeds; breaker opens across only some instances; half-open probe causes overload; all pools saturate.

**Acceptance criterion:** Draw the checkout dependency path, name what work continues or is shed for each failure, specify bounded queues/concurrency, and define alerts that show both degradation and dependency health. Do not implement a breaker library.

## Summary

Circuit breakers reduce repeated calls to a failing dependency; bulkheads limit resource coupling; admission control and load shedding protect capacity. Choose failure signals carefully, bound queues and probes, and degrade only where product semantics allow it. These patterns contain damage and improve diagnosis; they do not remove the need for timeouts, retries, capacity planning, or repair.

## Cheat Sheet

- Breaker: closed observes, open blocks, half-open probes recovery.
- Use dependency-relevant failure signals and make breaker transitions visible.
- Bulkhead: bound concurrency/resources per dependency or workload.
- Shed optional work before critical work; use honest, documented fallbacks.
- Bounded queues, deadlines, and admission control prevent hidden overload.
### Common Pitfalls

- Breaker as cure; unbounded wait; business errors tripping breaker; fallback hiding outage.

## Interview Questions

1. **[Hard]** Explain the three circuit-breaker states. **Expected answer shape:** Normal observation, fast rejection/fallback, limited recovery probes, transition criteria, and implementation variability. **Follow-up:** What signal should not usually count as a dependency outage?
2. **[Hard]** How does a bulkhead differ from a circuit breaker? **Expected answer shape:** Resource isolation versus call suppression, interaction with timeouts and queues. **Follow-up:** What is the utilization cost of separate pools?
3. **[Hard]** Which checkout work would you shed when recommendations fail? **Expected answer shape:** Preserve correctness-critical actions, degrade optional work, disclose user-visible behavior, observe underlying failure. **Follow-up:** What if the payment provider is failing?
4. **[Very Hard]** A breaker is open and user errors fall, but dependency failures remain undetected. Redesign operations and alerting. **Expected answer shape:** Transition/rejection metrics, dependency health, low-volume caveat, fallback outcome, probe behavior, alert thresholds. **Follow-up:** How would you prevent a half-open recovery wave from overloading the provider?