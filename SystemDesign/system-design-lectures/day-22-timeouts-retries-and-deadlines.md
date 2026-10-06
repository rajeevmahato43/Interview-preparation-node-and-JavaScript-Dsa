# Day 22: Timeouts, Deadlines, Retries, and Backoff

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> | Previous: <a href="day-21-multi-region-design.md">Day 21</a> | Next: <a href="day-23-idempotency-and-message-delivery.md">Day 23</a></nav>

## What You Will Learn Today

- Distinguish a per-attempt timeout from an end-to-end deadline.
- Explain why a timeout is evidence of uncertainty, not proof that remote work stopped.
- Build bounded retry policies with backoff, jitter, budgets, and cancellation.
- Prevent retry amplification and preserve time for response generation or cleanup.

## Prerequisites

- [Day 05: Latency, Throughput, and Tail Behavior](day-05-latency-throughput-and-queues.md)
- [Day 06: Networking and Request Lifecycle](day-06-networking-and-request-lifecycle.md)
- [Day 13: Asynchronous Processing and Message Queues](day-13-queues-and-asynchronous-processing.md)

## Quick Vocabulary Card

- **Timeout:** A local limit on how long an operation waits before the caller stops waiting.
- **Deadline:** An absolute end time for the overall operation, including downstream work.
- **Retry:** A new attempt after a failure or uncertain result; it may repeat effects.
- **Exponential backoff:** Increasing delay between attempts, usually capped.
- **Jitter:** Random variation added to retry delays to avoid synchronized retry waves.
- **Retry budget:** A limit on retry load, often expressed per request, dependency, or time window.

## Core Concepts

Networks can delay, drop, or lose responses after a remote service has already completed work. A timeout protects local resources, but it cannot generally tell the caller whether a remote mutation committed. Retry behavior must therefore consider both capacity and operation semantics. The roadmap’s [Day 22 entry](../system-design-roadmap.md#day-22-timeouts-deadlines-retries-and-backoff) points to Google SRE's guidance on [addressing cascading failures](https://sre.google/sre-book/addressing-cascading-failures/).

### Time budget versus attempt limit

A connect timeout limits connection establishment; a request or read timeout limits some portion of a call. Exact stages and APIs differ by client library. An end-to-end deadline bounds the whole user operation. If an API has 800 ms total, spending 700 ms on a downstream call leaves little time to serialize a response, run remaining work, or return useful failure. Propagate the remaining budget to dependencies instead of independently granting each one a fresh 800 ms.

For a request that calls inventory and then pricing sequentially, a deadline must cover both operations plus local work. If they run in parallel, the slowest call contributes to completion time, but both still consume resources. Cancellation should be propagated when supported, but cancellation is cooperative and may arrive after remote work has committed. Set timeouts from measured latency distributions and product targets, not arbitrary small values that turn normal tail latency into widespread failure.

### A timeout leaves a mutation uncertain

Suppose a client sends a payment request. The payment service charges the card, but its response is lost. The caller's timeout means “I did not observe a response in time,” not “the charge did not happen.” Blindly retrying can create a second charge. Read-only or naturally idempotent operations are safer to retry, subject to the actual contract; mutating calls need idempotency or a status/reconciliation path.

Even a GET can be expensive or trigger unintended side effects in a poorly designed system. Conversely, a correctly designed PUT may be safe to repeat. Decide based on the operation's effect and service contract, not solely the method name.

### Bounded retries with backoff

Retry only failures plausibly transient, such as selected connection resets or overload responses, and honor server retry guidance where defined. Use a maximum attempt count and a deadline: a retry must fit within the remaining budget, with room for response handling. Exponential backoff reduces pressure; jitter helps clients avoid retrying together after a shared failure. A simplified policy grows delay up to a cap, adds bounded random jitter, and stops when attempts or deadline are exhausted.

Retries multiply work across service layers. If three layers each allow three total attempts, one original operation can lead to as many as $3^3 = 27$ attempts at a deepest dependency in the worst case. Count semantics vary (retries versus total attempts), so document them. Use a retry budget or concurrency limit to stop retries from consuming all capacity. When a request deadline expires, do not continue hidden background work unless ownership has explicitly moved to a durable asynchronous workflow.

### Worked trace: two downstream calls

Assume an endpoint has a 900 ms deadline. It calls inventory (300 ms limit) then shipping quote (350 ms limit), reserving 100 ms for local processing and response. A first inventory attempt uses 280 ms and returns a transient error. Retrying for another 300 ms cannot fit alongside the quote and response budget, so the operation should fail or choose a defined degraded path rather than exceed its deadline. If inventory reservation were a mutation with uncertain outcome, the retry also requires a stable idempotency identity. The chosen policy should be visible in metrics: attempt count, remaining deadline, timeout stage, and final result.

## Common Mistakes and Interview Traps

- Retrying every error, including validation, authorization, and permanent business rejection.
- Treating client timeout as cancellation or proof that remote work did not commit.
- Giving each downstream call a full request timeout and exceeding the end-to-end latency target.
- Retrying at several layers without calculating the multiplicative load.
- Using fixed synchronized delays that make clients retry together.
- Retrying mutations without idempotency, deduplication, or reconciliation.
- Allowing retries to consume capacity needed for new work.
- Saying “three retries” without clarifying whether the initial attempt is included.

## Tricky Points

A timeout is a local observation with ambiguous remote state. Cancellation support may release local sockets or stop cooperative work, but it is not a rollback protocol. Also distinguish a retry of a request from a replay of a durable job: jobs can outlive the original caller deadline and need their own deadline, attempt budget, and status lifecycle. Use operation-specific policies and avoid a global retry rule that ignores semantics.

## Practical Exercise

**Goal:** Define timeout and retry behavior for a request that calls inventory and a shipping provider.

**Inputs/context:** The public endpoint has a 1-second target. Inventory reserve changes state; shipping quote is read-only but rate-limited. Both dependencies have variable latency.

**Constraints:** Allocate an end-to-end deadline, per-attempt bounds, retryable failures, max attempts, backoff/jitter, cancellation behavior, and a retry budget. Include response/cleanup time.

**Edge cases:** Response lost after reservation commits; provider returns overload; no deadline remains; caller disconnects; retry budget exhausted; one dependency is slow but the other is healthy.

**Acceptance criterion:** Draw a timed attempt trace, label which call can be retried and why, define the safe handling of uncertain reservation, and name metrics for timeout stage and retry amplification. Do not provide a universal numeric policy beyond the stated target.

## Summary

Timeouts bound waiting; deadlines bound the whole operation. Neither proves remote work stopped or failed to commit. Retry only plausibly transient failures when the operation is safe, within a remaining deadline and budget. Backoff and jitter reduce synchronization, while bounded concurrency and retry budgets protect the dependency from amplified load.

## Cheat Sheet

- Propagate remaining deadline, not a fresh full timeout at each hop.
- Treat timed-out mutations as uncertain until status or idempotency resolves them.
- Retry only selected transient failures and safe operations.
- Cap attempts and delay; add jitter; honor remaining time and retry budget.
- Count total attempts clearly and inspect amplification across layers.
### Common Pitfalls

- Timeout-as-rollback; unbounded retries; synchronized storms; retrying business errors.

## Interview Questions

1. **[Hard]** What does a client know after a request times out? **Expected answer shape:** Local wait expired; remote outcome remains unknown; distinguish cancellation and commit. **Follow-up:** How should a caller resolve a payment timeout?
2. **[Hard]** Allocate a 700 ms request deadline across two sequential dependencies. **Expected answer shape:** Remaining-budget propagation, per-attempt limits, response reserve, and failure path. **Follow-up:** How does parallel execution change latency and resource usage?
3. **[Hard]** Why can retries make an outage worse? **Expected answer shape:** Added offered load, retry amplification, synchronization, queueing, and capacity exhaustion. **Follow-up:** Explain backoff, jitter, and a retry budget.
4. **[Very Hard]** Design retries for an endpoint that reserves inventory and calls a rate-limited shipping provider. **Expected answer shape:** Operation semantics, stable idempotency identity, transient classification, deadlines, partial outcomes, cancellation, and reconciliation. **Follow-up:** What changes when the caller disconnects after the reserve commit?