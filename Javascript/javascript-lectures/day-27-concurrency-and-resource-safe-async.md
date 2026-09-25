# Day 27: Concurrency and Resource-Safe Async Code

<nav aria-label="Lecture navigation">

[Previous: JavaScript Boundaries in Services](day-26-javascript-boundaries-for-services.md) | [Roadmap](../javascript-roadmap.md) | [Next: Senior JavaScript Integration and Review](day-28-senior-javascript-interview-integration.md)

</nav>

## Learning Outcomes

- Implement bounded concurrency with ordered results.
- Define stop, continue, cancellation, and partial-result policies.
- Distinguish timeout rejection from cancellation.
- Classify retryable work and preserve cleanup ownership.

## Prerequisites and Links

Read [Day 18](day-18-promises-and-composition.md), [Day 19](day-19-async-await-errors-and-cleanup.md), [Day 20](day-20-jobs-microtasks-and-scheduling.md), [Day 21](day-21-memory-reachability-and-garbage-collection.md), and [Day 26](day-26-javascript-boundaries-for-services.md).

## Core Concepts

Concurrency is overlapping progress, not parallel execution. A concurrency limit protects memory and external capacity, but it does not cancel tasks already started. A runner must define what happens after failure: stop claiming new work, continue independent work, or abort cooperatively.

Retries require a failure classification and an idempotency decision. Retrying a non-idempotent operation can duplicate effects.

## Detailed Explanations of Difficult Behavior

### Ordered bounded runner

**Environment:** Node.js or another modern ECMAScript runtime.

```js
async function runBounded(tasks, limit, { signal, stopOnError = true } = {}) {
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError("limit must be positive");
  const results = new Array(tasks.length);
  const failures = [];
  let next = 0;
  let stopped = false;

  async function worker() {
    while (!stopped && next < tasks.length) {
      if (signal?.aborted) { stopped = true; break; }
      const index = next++;
      try {
        results[index] = await tasks[index](signal);
      } catch (error) {
        failures.push({ index, error });
        if (stopOnError) stopped = true;
      }
    }
  }

  const count = Math.min(limit, tasks.length);
  await Promise.all(Array.from({ length: count }, worker));
  return { results, failures, stopped };
}
```

This runner limits starts, preserves indexes, and reports failures. It does not forcibly stop a task already awaiting or running. Tasks must observe `signal` if cancellation is part of the contract.

### Deadline ownership

A deadline wrapper owns its timer. It should clear the timer when the operation settles. It may call `controller.abort()` to request cooperative cancellation, but the operation must actually observe the signal.

## Examples and Traces

```js
const output = await runBounded([
  async () => "a",
  async () => "b",
  async () => "c",
], 2);
console.log(output.results); // [ "a", "b", "c" ]
console.log(output.failures.length); // 0
```

**Verification:** Add tasks that record active count, reject synchronously and asynchronously, abort cooperatively, and verify active count never exceeds the limit.

## Compare & Recall

| Concept A | Concept B | Key difference |
|---|---|---|
| Timeout (race) | AbortSignal (cancellation) | `Promise.race` with a timer rejects the outer call after the deadline, but the underlying operation still runs. `AbortSignal` is a cooperative contract that tells the operation to stop — only works if the API supports it. |
| Concurrency limit | Serial execution | Serial: one task at a time, unlimited delay. Concurrency limit: N tasks simultaneously. Limits prevent resource exhaustion (DB connections, file handles, memory) without serializing unnecessarily. |
| Idempotent operation | Non-idempotent operation | Idempotent: calling it twice gives the same result as once. Non-idempotent: second call has a different effect (charge a card twice). Only retry idempotent operations automatically. |
| `Promise.all` | Bounded worker pool | `Promise.all` starts all N operations immediately. A worker pool starts at most N at a time and queues the rest. Use a pool when N is unknown or could exhaust resources. |
| Cooperative cancellation | Forced cancellation | JavaScript has no preemptive cancellation. All cancellation is cooperative: the operation must check the signal and stop. Async functions running synchronous CPU work cannot be interrupted mid-execution. |
| Retry with backoff | Immediate retry | Immediate retry floods the failing resource. Exponential backoff with jitter spreads load and gives the service time to recover. Always add a maximum retry count and a deadline. |

> **Cross-day links:** Promise combinators (`all`, `race`, `allSettled`, `any`) are in [Day 18](day-18-promises-and-composition.md). Abort signals and `async/await` cleanup are in [Day 19](day-19-async-await-errors-and-cleanup.md). Microtask scheduling is in [Day 20](day-20-jobs-microtasks-and-scheduling.md).

## Common Mistakes and Interview Traps

- Treating `Promise.all` rejection as cancellation.
- Starting every task before applying a limit.
- Retrying every error, including validation and non-idempotent failures.
- Reporting results in completion order when callers require input order.
- Leaving timers or resources open after completion.

## Tricky Points

A timeout can reject the coordinator while work continues. Cancellation is a request, not an interrupt. A stopped runner may still return successful results for tasks already completed and failures for tasks already started.

## Practical Exercise

**Goal:** Build a production-shaped bounded task runner.

**Inputs:** Task functions, positive limit, failure policy, and optional `AbortSignal`.

**Outputs:** Ordered result slots, structured failures, and completion metadata.

**Constraints:** Never exceed the limit, normalize synchronous throws, preserve causes, define stop/continue behavior, and clean up deadlines.

**Edge cases:** Empty tasks, zero/negative limit, one slow task, cancellation before start, cancellation during work, retryable failure, and partial completion.

**Acceptance criteria:** Tests prove ordering, capacity, policy behavior, cleanup, and the fact that promise combinators do not cancel underlying work.

## Summary

Bounded concurrency is a contract around work admission, result ordering, failure policy, and cancellation. Retries require idempotency reasoning. Deadlines reject or signal but do not magically interrupt arbitrary work. Every resource and timer needs an owner.

## Cheat Sheet

| Question | Required decision |
|---|---|
| How many start? | Positive concurrency limit |
| What order return? | Completion or input order, explicitly |
| What after failure? | Stop or continue |
| What cancels work? | Cooperative signal/API contract |
| What retries? | Classified, safe, idempotent operations |
| Who cleans up? | The boundary that acquires the resource |

## Interview Questions

> Difficulty guide: **[Beginner]** = entry-level, **[Mid]** = requires understanding of internals, **[Senior]** = design and tradeoff thinking expected.

1. **[Senior] Implementation:** Implement ordered bounded concurrency with a positive limit and failure policy.
2. **[Senior] Debugging:** Explain why a timed-out operation still writes to a dependency.
3. **[Senior] Design:** Design retries and cancellation for mixed idempotent and non-idempotent tasks.
