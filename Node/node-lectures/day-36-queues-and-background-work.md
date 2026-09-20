# Day 36: Queues and Background Work

<nav aria-label="Lecture navigation">

[Previous: Caching and Rate Limiting](day-35-caching-and-rate-limiting.md) | [Roadmap](../node-roadmap.md) | [Next: Observability and Production Operations](day-37-observability-and-production-operations.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain why background work is often moved out of the request path.
- Distinguish at-least-once delivery, retries, and idempotent consumers.
- Design a queue-backed workflow with failure-handling and shutdown behavior.
- Understand the operational tradeoff between quick API responses and reliable job execution.

## Prerequisites

- [Day 11: Worker Threads and Child Processes](day-11-worker-threads-and-child-processes.md)
- [Day 34: Deadlines, Retries, and Idempotency](day-34-deadlines-retries-and-idempotency.md)
- [Day 35: Caching and Rate Limiting](day-35-caching-and-rate-limiting.md)

## Core Concepts

### 1. Request path vs background path

A request handler should usually do minimal work and return quickly. Long-running jobs, notifications, reporting, and expensive processing belong in a queue or worker process.

### 2. At-least-once delivery is common

Many queues guarantee that a task is delivered at least once, not exactly once. That means a job can be retried and must be safe to process again.

### 3. Idempotent consumer pattern

A queue consumer should check whether the work is already done before doing side effects.

```js
if (await jobRepo.isProcessed(jobId)) {
  return;
}

await sendEmail(job);
await jobRepo.markProcessed(jobId);
```

This reduces duplicate work after transient failures.

## Detailed Explanations and Traces

### Queue lifecycle

```text
request -> enqueue job -> return 202 accepted -> worker polls queue -> process job -> ack or retry -> dead-letter if needed
```

This decouples request latency from long-running work, but it also adds operational complexity.

### Dead letters and retries

A queue should support retries with bounded backoff and a dead-letter strategy for unrecoverable messages. Otherwise, a poisoned message can replay forever and consume capacity.

## Common Mistakes and Interview Traps

- Assuming queue delivery is exactly once.
- Forgetting to make the consumer idempotent.
- Returning success before the job is durably stored.
- Ignoring shutdown and worker drain behavior.

## Tricky Points

- Background work is not free; it adds hidden latency and operational complexity.
- A queue protects request response time, but it does not eliminate correctness work.
- Worker crashes can cause duplicate processing unless the consumer is designed for it.

## Practical Exercise

**Goal:** Design a background email or report job workflow.

**Inputs and outputs:** Accept a request that schedules a job and describe the consumer behavior and retry strategy.

**Constraints:** Account for duplicates, retries, and graceful worker shutdown.

**Acceptance criteria:** The design explains at-least-once semantics and the idempotency requirement for job execution.

## Summary

- Background jobs protect request latency but add reliability and deduplication complexity.
- Queue jobs should be designed for retry and idempotency.
- Dead-letter, ack, and shutdown flows are part of the contract, not afterthoughts.

## Cheat Sheet

| Concern | Pattern |
|---|---|
| Request speed | return quickly, queue work |
| Retries | bounded + backoff |
| Duplicate processing | idempotent consumers |
| Final failure | dead-letter or explicit escalation |
| Shutdown | stop accepting, drain workers, then exit |

## Interview Questions

1. **Definition:** Why move expensive work out of the request path?
   - **Expected answer:** To keep request latency predictable and reduce coupled failure between API traffic and heavy jobs.
   - **Follow-up:** What is the tradeoff?

2. **Design:** Design a queue-backed notification service.
   - **Expected answer:** Accept the request, store a job, return quickly, and let a worker send the message with retry and idempotency safeguards.
   - **Follow-up:** What if the worker crashes after sending but before acking?

3. **Implementation:** Write an idempotent queue consumer.
   - **Expected answer:** Check if work is already done before side effects, store job state, and handle retries safely.
   - **Follow-up:** Why is exactly-once not a safe assumption?

4. **Engineering judgment:** When is a queue the right fix and when is it over-engineering?
   - **Expected answer:** It helps when work is slow, may fail, and should not block user-facing requests; it is overkill for trivial operations.
   - **Follow-up:** How do you know the job is large enough to justify it?

<nav aria-label="Lecture navigation">

[Previous: Caching and Rate Limiting](day-35-caching-and-rate-limiting.md) | [Roadmap](../node-roadmap.md) | [Next: Observability and Production Operations](day-37-observability-and-production-operations.md)

</nav>