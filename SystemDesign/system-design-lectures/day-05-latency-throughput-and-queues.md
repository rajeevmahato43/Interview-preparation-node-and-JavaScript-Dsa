# Day 05: Latency, Throughput, and Tail Behavior

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> · Previous: <a href="day-04-capacity-estimation.md">Day 04</a> · Next: <a href="day-06-networking-and-request-lifecycle.md">Day 06</a></nav>

## What You Will Learn Today

By the end of this lesson, you can:

- Distinguish latency, service time, throughput, concurrency, and utilization.
- Explain why queueing delay rises sharply near saturation.
- Interpret p50, p95, and p99 without relying on averages alone.
- Trace how fan-out and dependency tails affect an end-to-end request.

## Prerequisites

- [Day 03: Functional Requirements, Quality Attributes, and Constraints](day-03-requirements-and-quality-attributes.md)
- [Day 04: Estimation and Back-of-the-Envelope Math](day-04-capacity-estimation.md)

## Quick Vocabulary Card

- **Latency:** Elapsed time for an operation, from a defined start boundary to an end boundary.
- **Service time:** Time spent actively processing a request, excluding time waiting in a queue.
- **Throughput:** Completed work per unit time, such as requests per second.
- **Concurrency:** Number of operations in progress at the same time.
- **Utilization:** Fraction of a resource's capacity currently in use.
- **Tail latency:** Latency among the slowest portion of requests, often discussed using p95 or p99.
- **Queue:** Work waiting for a resource or dependency to become available.

## Core Concepts

Latency and throughput are related but not interchangeable. A service can complete many small requests per second while an individual request waits a long time. It can also respond quickly at low load yet fail to maintain that latency during a burst. The [Google SRE chapter on monitoring distributed systems](https://sre.google/sre-book/monitoring-distributed-systems/) emphasizes useful service signals; percentile latency is one way to expose slow experiences that an average hides.

### Separate processing from waiting

Suppose an API worker takes 20 ms of active processing to handle a request. If 100 requests arrive at once and the worker can process only one at a time, later requests wait before receiving service. Their user-visible latency includes queue wait plus service time. More workers may increase concurrency and throughput, but only until another resource becomes limiting, such as a database connection pool or a downstream service.

Little's Law provides a useful steady-state relationship:

$$L = \lambda W$$

Here $L$ is the average number of items in the system, $\lambda$ is average arrival/completion rate in items per second, and $W$ is average time in the system in seconds. For example, if a service sustains 200 requests/s and requests spend an average of 0.1 s in the system, the average in-flight count is about $200\ \text{requests/s} \times 0.1\ \text{s}=20\ \text{requests}$. This does not prove that 20 concurrent workers are enough: the system may have queues, variable service time, or multiple resource stages.

As utilization approaches the effective capacity of a constrained resource, small bursts have less idle capacity to absorb them. Queues grow, waiting time rises, and timeouts can cause retries that add more work. The exact curve depends on workload and scheduling; the robust design lesson is to observe queue depth and saturation, bound waiting, and avoid treating a resource at 100% utilization as healthy headroom.

### Percentiles describe the distribution

If p50 latency is 80 ms, half of the measured requests are at or below 80 ms. If p99 is 900 ms, roughly 1% take at least that long in the measured population and window, subject to the percentile calculation and sample size. An average may look acceptable while a meaningful minority has a poor experience.

Always ask what was measured: client-perceived latency, API server time, a database call, or a synthetic probe. Percentiles from separate systems should not be casually averaged. A short measurement window with few requests gives an unstable p99; filtering only successful responses can hide slow timeouts or failures.

### Fan-out magnifies tail exposure

Imagine a page request that waits for four independent services in parallel and responds only when all four finish. If each dependency is under its own p99 latency 99% of the time, the probability that all four are under that threshold is approximately $0.99^4 \approx 96.1\%$, assuming independent behavior. Thus the combined request can exceed the individual p99 threshold more than 1% of the time. Correlated slowdowns can make the result worse; independence is a simplifying assumption, not a guarantee.

If the calls run sequentially, their durations add instead of taking roughly the slowest branch. If the service can return partial results, it may use a deadline and graceful degradation, but that changes product behavior. The right approach depends on which data is required for a correct response.

### Observe queues and boundaries

For each critical operation, measure end-to-end latency and useful component spans, along with throughput, in-flight work, queue depth, errors, and timeouts. A rising queue with steady arrival rate and increasing latency suggests processing capacity or a dependency is not keeping up. A high latency without a growing queue may point to one slow dependency, lock contention, or external network delay. Measurements guide diagnosis; they do not by themselves prove causality.

## Common Mistakes and Interview Traps

- Reporting average latency as if it described every user.
- Confusing service time with end-to-end time and ignoring queue wait.
- Increasing concurrency without checking downstream capacity; this can move or worsen saturation.
- Calling a system “high throughput” without naming operation mix, payload, and measurement interval.
- Assuming parallel fan-out eliminates latency cost; the slowest required branch still gates completion.
- Treating percentile arithmetic as exact while dependencies are correlated or sample sizes are small.

## Tricky Points

Tail latency is not the same as a rare server glitch. Variance, queueing, shared resources, retries, and fan-out can make slow responses systematic. Also, p99 is a population statistic over a chosen interval, not a promise that every hundredth request will be slow in a regular pattern.

## Practical Exercise

**Goal:** Trace latency through a request that calls four dependencies.

**Inputs:** A request calls identity, profile, permissions, and recommendation services in parallel. Assume measured times for one observed request are 35 ms, 90 ms, 60 ms, and 240 ms respectively; ignore network overhead for this one trace.

**Constraints:** The response requires identity and permissions. Profile may be omitted; recommendations are optional. State whether calls are parallel or sequential.

**Edge cases:** One dependency times out, shared network congestion correlates latencies, and a burst creates queue wait.

**Acceptance criteria:** Calculate the parallel critical-path time under the stated observation, contrast with sequential execution, identify which responses can be degraded, explain why independent dependency percentiles do not directly add, and propose measurements to isolate the source of p99 growth. Do not assert that the observed times are a benchmark.

## Summary

Latency includes waiting and processing; throughput measures completed work; concurrency describes in-flight work. Queues become costly as constrained resources approach saturation. Percentiles reveal slow requests that averages hide, and fan-out raises the chance that at least one dependency is slow. Measure boundaries and workload context before changing capacity.

## Cheat Sheet

- $L=\lambda W$: average in-flight work = rate × time, for a steady-state system.
- End-to-end latency includes queue wait, service time, and dependency time.
- Track p50/p95/p99 with sample window, request class, and error treatment.
- Parallel required branches are gated by the slowest branch; sequential times accumulate.
- Monitor throughput, latency, queue depth, concurrency, saturation, and errors together.
- **Common Pitfalls:** averages-only dashboards; unbounded queues; blindly raising concurrency; independent-tail assumptions; measurements with unclear boundaries.

## Interview Questions

1. **[Hard]** Explain the difference between latency and throughput. **Expected answer shape:** concise definitions, an example workload, and how each is measured. **Follow-up:** How can adding workers increase throughput but still worsen p99 latency?
2. **[Hard]** A service reports a stable average latency but users complain about slow requests. What do you inspect? **Expected answer shape:** percentiles, request classes, errors/timeouts, queue depth, saturation, and dependency traces with clear boundaries. **Follow-up:** Why might p99 from a low-volume endpoint be noisy?
3. **[Very Hard]** A request waits for several parallel dependencies and p99 rises as the product adds more optional data sources. Explain the mechanism and mitigation choices. **Expected answer shape:** fan-out probability, critical path, correlation caveat, deadlines, partial responses, concurrency and load constraints, plus correctness trade-offs. **Follow-up:** What evidence would justify making one dependency asynchronous or removing it from the critical path?