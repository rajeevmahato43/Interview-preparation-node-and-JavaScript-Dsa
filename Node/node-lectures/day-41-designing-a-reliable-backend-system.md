# Day 41: Designing a Reliable Backend System

<nav aria-label="Lecture navigation">

[Previous: Performance and Debugging Case Studies](day-40-performance-and-debugging-case-studies.md) | [Roadmap](../node-roadmap.md) | [Next: Senior Integration Review and Capstone](day-42-senior-integration-review-and-capstone.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Break a backend service into clear boundaries: API, domain logic, storage, cache, queue, and observability.
- Reason about failure modes and where retries, deadlines, and timeouts belong.
- Explain how reliability changes when traffic grows and dependencies fail.
- Design a backend system that fails safely without creating inconsistent user experience.

## Prerequisites

- [Day 33: Layered Backend Architecture](day-33-layered-backend-architecture.md)
- [Day 34: Deadlines, Retries, and Idempotency](day-34-deadlines-retries-and-idempotency.md)
- [Day 35: Caching and Rate Limiting](day-35-caching-and-rate-limiting.md)
- [Day 36: Queues and Background Work](day-36-queues-and-background-work.md)

## Core Concepts

### 1. Reliability is a system property

A single Node process can be healthy while the whole service is unreliable because of:

- dependency latency
- pool exhaustion
- invalid retries
- single points of failure
- cache stampedes
- queue backlogs

### 2. Clear boundaries reduce failure blast radius

A backend should separate:

- entry point and auth
- domain service logic
- database access
- cache logic
- asynchronous work
- metrics and alerts

This makes retries and safety easier to reason about.

### 3. Safe failure is not ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œalways succeedÃƒÂ¢Ã¢â€šÂ¬Ã‚Â

A robust system often chooses:

- fail fast on invalid requests
- retry only when idempotent
- allow background work to catch up
- explicitly surface degraded behavior to users

## Detailed Explanations and Traces

### Example: order creation flow

A user submits an order. The app writes the order to the database and emits a message for downstream processing. If the queue write fails, the order may still be valid but not processed. The system must decide whether to retry, reject, or queue the work with an idempotency key.

### Example: timeout design

If an upstream dependency is slow, the app should fail with a bounded timeout. But a timeout is not a cleanup signal; the dependency may still process the request. That is why idempotency is essential for retries and late-arriving responses.

## Common Mistakes and Interview Traps

- Treating retries as safe without idempotency.
- Allowing a request to wait forever on a dependency.
- Putting business logic in route handlers and hiding failure patterns.
- Ignoring queue backlog and retry amplification.

## Tricky Points

- A system can be ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œavailableÃƒÂ¢Ã¢â€šÂ¬Ã‚Â while also being ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œunreliableÃƒÂ¢Ã¢â€šÂ¬Ã‚Â in business terms.
- Backpressure and timeouts are an operational design decision, not just coding details.
- Some failure modes are acceptable for a single request but unacceptable at whole-system scale.

## Practical Exercise

**Goal:** Design a reliable backend for a payment-driven service.

**Inputs and outputs:** Document request flow, storage decisions, queue boundaries, retry policy, and observability signals.

**Constraints:** Include a failure mode and explain how the system fails safely under dependency timeout.

**Acceptance criteria:** The design has explicit timeouts, idempotency, and a clear degraded-mode strategy.

## Summary

- Reliability is not just redundancy; it is controlled failure under realistic conditions.
- Explicit boundaries, deadlines, retries, and operational signals are what make a system predictable.
- The right design depends on business risk, not on a universal ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œalways use queueÃƒÂ¢Ã¢â€šÂ¬Ã‚Â answer.

## Cheat Sheet

| Concern | Design choice |
|---|---|
| external dependency | deadline and retry policy |
| state mutation | idempotency key and transaction |
| heavy work | queue and async boundary |
| degraded mode | explicit user-visible failure |
| observability | metrics, logs, traces, alerts |

## Interview Questions

1. **Definition:** Why is reliability considered a system property rather than a single bug fix?
   - **Expected answer:** Because failures appear across components, dependencies, and operations, so the design needs multiple controls.
   - **Follow-up:** What is a ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œgood enoughÃƒÂ¢Ã¢â€šÂ¬Ã‚Â degraded mode?

2. **Design:** Design a service that calls an external payment provider and then writes to a database.
   - **Expected answer:** Use a bounded timeout, idempotency key, safe retry policy, and a clear state machine to avoid duplicate charges.
   - **Follow-up:** What if the provider succeeds but the app crashes before confirming the DB write?

3. **Debugging:** A queue grows steadily while API latency remains acceptable. What should you check?
   - **Expected answer:** Check backlog growth, worker saturation, retry loops, database pressure, and whether the queue is downstream of a slow or failing dependency.
   - **Follow-up:** Why is a growing queue sometimes a hidden reliability issue?

4. **Engineering judgment:** When is a synchronous direct call better than an async queue?
   - **Expected answer:** When the user needs the result immediately and the dependency is fast, bounded, and inexpensive to wait on; the queue is better for backlog-tolerant work.
   - **Follow-up:** What tradeoff do you give up by making everything async?

<nav aria-label="Lecture navigation">

[Previous: Performance and Debugging Case Studies](day-40-performance-and-debugging-case-studies.md) | [Roadmap](../node-roadmap.md) | [Next: Senior Integration Review and Capstone](day-42-senior-integration-review-and-capstone.md)

</nav>