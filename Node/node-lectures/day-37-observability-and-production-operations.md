# Day 37: Observability and Production Operations

<nav aria-label="Lecture navigation">

[Previous: Queues and Background Work](day-36-queues-and-background-work.md) | [Roadmap](../node-roadmap.md) | [Next: Security Review of a Node Backend](day-38-security-review-of-a-node-backend.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain the difference between logs, metrics, and traces.
- Define useful health, readiness, and dependency signals for a Node service.
- Understand how event-loop lag, request latency, and dependency latency fit together in production operations.
- Design operational evidence for incident response and service diagnosis.

## Prerequisites

- [Day 12: Testing, Diagnostics, Observability, and Shutdown](day-12-testing-diagnostics-observability-and-shutdown.md)
- [Day 20: Express Security and HTTP Testing](day-20-express-security-and-http-testing.md)
- [Day 36: Queues and Background Work](day-36-queues-and-background-work.md)

## Core Concepts

### 1. Logs are for events, metrics for aggregates, traces for flow

- logs: discrete events, structured entries, request IDs
- metrics: counts, durations, error rates, percentiles
- traces: execution path across a request and dependencies

These are complementary and answer different questions.

### 2. Health and readiness are not the same thing

- liveness: is the process alive?
- readiness: should traffic be sent to this instance?
- dependency health: can required downstream services reliably serve requests?

A process can be alive but not ready to serve traffic.

### 3. The metric must have a question behind it

A useful metric answers something like: "Is the API degraded?", "Is the event loop lag rising?", or "Is DB latency increasing?" It is not enough to say the system has "some logs."

## Detailed Explanations and Traces

### Production symptoms

A spike in 500 errors might be caused by database latency, rate limiting, auth failures, or invalid input. Observability is needed to separate those symptoms from their causes.

### Event-loop delay as a service-level signal

High event-loop delay is often a sign of blocking work, large CPU tasks, or a stuck synchronous operation. This matters because it can affect all requests in the process.

## Common Mistakes and Interview Traps

- Using averages instead of percentiles.
- Logging raw secrets or high-cardinality user fields.
- Treating "process is alive" as "service is healthy."
- Failing to preserve request correlation across logs and traces.

## Tricky Points

- A health endpoint can be useful and still misleading.
- The best metric is often not the simplest to compute, but the one that tells a decision-maker what to do next.
- Operational data should be redacted and bounded, not just present.

## Practical Exercise

**Goal:** Define a minimal observability plan for an API service.

**Inputs and outputs:** A short list of metrics, logs, and readiness behavior for a Node service.

**Constraints:** Include request correlation and a clear distinction between liveness and readiness.

**Acceptance criteria:** The plan identifies what evidence is needed to distinguish API slowness from dependency slowness or event-loop lag.

## Summary

- Observability connects an incident to a cause.
- The best evidence depends on the system and the question being asked.
- Health and readiness are not interchangeable, and request correlation matters.

## Cheat Sheet

| Concern | Evidence |
|---|---|
| Logs | structured event records with request IDs |
| Metrics | counts, latency percentiles, error rates |
| Traces | request flow across dependencies |
| Liveness | process still running |
| Readiness | serving traffic safely |

## Interview Questions

1. **Definition:** What is the difference between a log, a metric, and a trace?
   - **Expected answer:** Logs record discrete events; metrics aggregate over time; traces follow one request or job across systems.
   - **Follow-up:** Why are all three useful together?

2. **Design:** Define liveness and readiness for a service backed by a database.
   - **Expected answer:** Liveness indicates the process is alive; readiness indicates the process can safely accept traffic and required dependencies are available.
   - **Follow-up:** Why is a dependency outage not always a liveness problem?

3. **Debugging:** A user reports very slow API responses and the CPU is low. What next?
   - **Expected answer:** Check dependency latency, event-loop lag, queue depth, and request path bottlenecks before blaming the code path itself.
   - **Follow-up:** Why are percentiles better than averages here?

4. **Engineering judgment:** What is the risk of logging too much or logging unbounded data?
   - **Expected answer:** It can create noisy systems, leak secrets, and increase storage and latency costs.
   - **Follow-up:** How do you keep logs useful and safe?

<nav aria-label="Lecture navigation">

[Previous: Queues and Background Work](day-36-queues-and-background-work.md) | [Roadmap](../node-roadmap.md) | [Next: Security Review of a Node Backend](day-38-security-review-of-a-node-backend.md)

</nav>