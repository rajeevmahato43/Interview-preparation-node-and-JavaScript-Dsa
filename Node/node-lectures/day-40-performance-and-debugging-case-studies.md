# Day 40: Performance and Debugging Case Studies

<nav aria-label="Lecture navigation">

[Previous: Testing Strategy Across Boundaries](day-39-testing-strategy-across-boundaries.md) | [Roadmap](../node-roadmap.md) | [Next: Designing a Reliable Backend System](day-41-designing-a-reliable-backend-system.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Turn symptoms into hypotheses and traces in a Node backend.
- Separate CPU, I/O, database, network, queue, and memory causes.
- Read evidence such as event-loop delay, memory profiles, and query plans intelligently.
- Write a concise incident summary with root cause, fix, and regression plan.

## Prerequisites

- [Day 02: Event Loop and Scheduling](day-02-event-loop-and-scheduling.md)
- [Day 08: Streams and Backpressure](day-08-streams-and-backpressure.md)
- [Day 12: Testing, Diagnostics, Observability, and Shutdown](day-12-testing-diagnostics-observability-and-shutdown.md)
- [Day 24: MongoDB Aggregation and Index Awareness](day-24-mongodb-aggregation-and-index-awareness.md)
- [Day 30: SQL Composition and Performance Awareness](day-30-sql-composition-and-performance-awareness.md)

## Core Concepts

### 1. A symptom is not a cause

A user reports ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œthe API is slow,ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â but the real issue could be:

- DB latency spike
- CPU-heavy request path
- too many queued jobs
- large file streaming issue
- event-loop lag
- network dependency timeout

The job is to narrow the evidence.

### 2. Performance debugging is evidence-driven

Start with the simplest measurable question:

- Does CPU rise?
- Does event-loop lag rise?
- Are DB queries slow?
- Are tasks queued?
- Is memory growth steady?

### 3. Incident writing matters

A good incident write-up contains:

- symptom
- timeline
- hypothesis
- evidence
- root cause
- change
- verification

## Detailed Explanations and Traces

### Case study: slow requests with low CPU

This pattern often means the app is waiting on a dependency or is blocked by a pool, queue, or network call. Event-loop delay may be low, but the request timeline tells a different story.

### Case study: high event-loop delay

This often points to heavy synchronous work or lots of blocking operations in the main thread. That can affect all requests even when the DB is healthy.

### Case study: memory leak

A gradual memory rise combined with sustained node process load suggests retained timers, listeners, or queues. A heap snapshot is far more useful than guessing.

## Common Mistakes and Interview Traps

- Optimizing before measuring.
- Blaming the database without checking the event-loop.
- Treating one metric as the whole story.
- Writing a fix without a regression test or metric.

## Tricky Points

- Slow request latency is not the same as high CPU.
- Queue depth and dependency latency can be the real source of user-visible slowness.
- An improved code path can still be wrong if the underlying workload assumptions were false.

## Practical Exercise

**Goal:** Write a brief incident report for a realistic Node backend slowdown.

**Inputs and outputs:** Provide symptom, hypothesis, evidence, causal explanation, and fix.

**Constraints:** Use concrete metrics or traces, not vague suggestions.

**Acceptance criteria:** The report distinguishes a CPU issue from a dependency issue and includes a regression strategy.

## Summary

- Debugging is a sequence of evidence gathering and hypothesis testing.
- Performance issues usually have a single dominant bottleneck, but the path to that bottleneck matters.
- Good incident analysis ends with a fix and a regression measure.

## Cheat Sheet

| Symptom | Likely evidence |
|---|---|
| slow API, low CPU | DB/network/queue latency |
| slow API, high event-loop lag | blocking work in main thread |
| memory growth | heap snapshots, listener leaks |
| connection errors | pool saturation or dependency failure |

## Interview Questions

1. **Definition:** Why is a slow API not enough information to debug a backend issue?
   - **Expected answer:** It does not tell you whether the problem is CPU, database, queue, network, memory, or a blocking path.
   - **Follow-up:** Which evidence would you gather first?

2. **Debugging:** An application shows high latency but low CPU. What are the most likely causes?
   - **Expected answer:** DB or network latency, queue backpressure, or request-level waiting caused by a dependency or lock.
   - **Follow-up:** Why is event-loop lag not the only suspect?

3. **Implementation:** Describe how you would investigate a memory growth issue in a Node process.
   - **Expected answer:** Use heap snapshots, count listeners/timers/queues, and check whether requests or jobs retain references.
   - **Follow-up:** What is the difference between leak and normal steady-state memory use?

4. **Engineering judgment:** What makes a good incident report?
   - **Expected answer:** It describes the symptom, evidence, cause, fix, and verification rather than only a guessed explanation.
   - **Follow-up:** Why is a regression test or metric essential?

<nav aria-label="Lecture navigation">

[Previous: Testing Strategy Across Boundaries](day-39-testing-strategy-across-boundaries.md) | [Roadmap](../node-roadmap.md) | [Next: Designing a Reliable Backend System](day-41-designing-a-reliable-backend-system.md)

</nav>