# Day 19: `async`/`await` and Asynchronous Error Propagation

<nav aria-label="Lecture navigation">

[Previous: Promises and Promise Composition](day-18-promises-and-composition.md) | [Roadmap](../javascript-roadmap.md) | [Next: Jobs, Microtasks, and Observable Scheduling](day-20-jobs-microtasks-and-scheduling.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain what an async function returns.
- Trace suspension and resumption around `await`.
- Catch errors from awaited promises correctly.
- Avoid accidental sequential work.
- Design cooperative cancellation and deadline boundaries.
- Guarantee cleanup with `finally`.

## Prerequisites

Read [Day 07: Errors and Exceptions](day-07-errors-and-exception-flow.md) and [Day 18: Promises and Promise Composition](day-18-promises-and-composition.md).

## Core Concepts

An `async` function always returns a promise.

```js
async function getValue() {
  return 42;
}

getValue().then(console.log); // 42
```

Returning a value fulfills the promise. Throwing an error rejects it.

```js
async function fail() {
  throw new Error("failed");
}

fail().catch((error) => console.log(error.message)); // "failed"
```

`await` pauses the current async function until its value is fulfilled or rejected. It does not block the entire JavaScript thread while waiting for an asynchronous result.

## Detailed Explanations and Traces

### Synchronous throw before the first `await`

```js
async function validate(value) {
  if (typeof value !== "string") {
    throw new TypeError("value must be a string");
  }
  await Promise.resolve();
  return value.trim();
}

validate(10).catch((error) => console.log(error.message));
// "value must be a string"
```

The caller still receives a rejected promise because the function is async, even though the check happens before the first await.

### `try` and `catch` around await

```js
async function readData(load) {
  try {
    return await load();
  } catch (error) {
    throw new Error("Could not load data", { cause: error });
  }
}
```

The `try` catches a rejection from the awaited promise. If the promise is returned without `await` inside the try, the later rejection may escape that synchronous `try` block.

### Sequential and parallel awaits

```js
async function sequential(loadProfile, loadOrders) {
  const profile = await loadProfile();
  const orders = await loadOrders();
  return { profile, orders };
}

async function parallel(loadProfile, loadOrders) {
  const profilePromise = loadProfile();
  const ordersPromise = loadOrders();
  const [profile, orders] = await Promise.all([
    profilePromise,
    ordersPromise,
  ]);
  return { profile, orders };
}
```

Use the second shape only when the calls are independent. Parallel calls can reduce waiting but increase simultaneous load and complicate partial failure.

### Cooperative cancellation

Cancellation is a contract. The caller signals cancellation, and the operation checks the signal or passes it to an API that understands it.

```js
async function waitForWork(signal) {
  if (signal?.aborted) {
    throw new Error("operation cancelled");
  }

  await new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, 10);
    const onAbort = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(new Error("operation cancelled"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });

  return "done";
}
```

This Node.js-flavored example uses a timer as a host API. The JavaScript lesson is that cancellation must be observed; setting a flag does not stop already-running code automatically.

### Deadlines and cleanup

```js
async function withDeadline(operation, milliseconds) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("deadline exceeded")), milliseconds);
  });
  try {
    return await Promise.race([operation(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
```

This demonstrates a rejection boundary, but the operation may continue after the race rejects. A production design should combine the deadline with cooperative cancellation and cleanup.

```js
async function useResource(open, close, work) {
  const resource = await open();
  try {
    return await work(resource);
  } finally {
    await close(resource);
  }
}
```

The `finally` block runs after success, failure, or cancellation that reaches this function.

## Examples and Traces

### Partial failure policy

```js
async function loadDashboard(loadUser, loadNotifications) {
  const userPromise = loadUser();
  const notificationPromise = loadNotifications();
  const [userResult, notificationResult] = await Promise.allSettled([
    userPromise,
    notificationPromise,
  ]);

  if (userResult.status === "rejected") {
    throw userResult.reason;
  }

  return {
    user: userResult.value,
    notifications: notificationResult.status === "fulfilled"
      ? notificationResult.value
      : [],
    notificationsUnavailable: notificationResult.status === "rejected",
  };
}
```

This policy makes the user mandatory and notifications optional. The correct policy depends on the product requirement.

## Node.js Connection

Node service operations must make timeout, cancellation, cleanup, and dependency failure ownership explicit around awaited work.

---

## Compare & Recall

| Concept A | Concept B | Key difference |
|---|---|---|
| `async/await` | Promise `.then/.catch` | Both use promises. `async/await` reads like synchronous code. `.then/.catch` is more explicit about chaining. They're interchangeable but not always equivalent in stack traces and error bubbling. |
| `return value` (in async fn) | `return await value` | `return value` passes the promise to the caller — local `catch` won't see its rejection. `return await value` awaits first, so a local `try/catch` **can** catch it. |
| Sequential `await` | Parallel start + `await` | Sequential: `await a; await b;` — b starts only after a finishes. Parallel: `const pA = a(); const pB = b(); await pA; await pB;` — both start immediately. Parallel is faster for independent work. |
| `Promise.race` timeout | Abort signal | `.race` with a timer rejects the outer promise after a deadline but does **not** cancel the underlying operation. An `AbortSignal` is a cooperative contract that cancels the work if the operation supports it. |
| `try/catch` on awaited call | `.catch()` on non-awaited | `try { await fn() } catch` works because the rejection becomes a throw. `try { fn() } catch` misses async rejections that happen later. |
| `finally` clause | `.then(cleanup, cleanup)` | `finally` is simpler and correct: runs on both success and failure, and errors inside it don't silently swallow the original. |

> **Cross-day links:** Promise combinators (`all`, `allSettled`, `race`, `any`) are in [Day 18](day-18-promises-and-composition.md). Microtask scheduling (why `await` defers) is in [Day 20](day-20-jobs-microtasks-and-scheduling.md). Async iteration (`for await...of`) is introduced briefly here and expanded in [Day 27](day-27-concurrency-and-resource-safe-async.md).

## Common Mistakes and Interview Traps

- Forgetting that an async function returns a promise.
- Assuming `try` catches a promise that was not awaited or returned.
- Serializing independent operations accidentally.
- Starting parallel operations without a limit.
- Treating `Promise.race` timeout as cancellation.
- Forgetting cleanup on rejection.
- Swallowing errors in a catch block and returning misleading success.
- Adding an abort listener without removing or scoping it correctly.

## Tricky Points

- `await` accepts ordinary values and converts them into an already-fulfilled promise-like step.
- A rejected await throws at the await expression, so normal `try`/`catch` applies.
- Returning `await value` can change where a local catch observes failure, while returning `value` passes the promise to the caller.
- Cancellation is cooperative; JavaScript cannot safely interrupt arbitrary synchronous code in the middle of an operation.

## Practical Exercise

**Goal:** Build an async workflow with a deadline and cleanup.

**Inputs and outputs:** Open a resource, perform two independent operations, and return a result containing required and optional data.

**Constraints:** Use a concurrency limit, support an abort signal, close the resource in `finally`, and preserve the original cause.

**Edge cases:** Synchronous open failure, operation rejection, timeout, cancellation during work, and cleanup failure.

**Acceptance criteria:** Write a failure table explaining which error wins and prove that cleanup is attempted on every path.

## Summary

- Async functions always return promises.
- `await` turns promise rejection into a throw at the await expression.
- Independent operations may be started before awaiting, then joined with a combinator.
- Timeouts reject a caller but do not automatically cancel underlying work.
- Cancellation needs a cooperative contract.
- `finally` is the main language tool for cleanup around async work.
- Partial failure must be a deliberate application decision.

## Cheat Sheet

| Pattern | Meaning |
|---|---|
| `async function` | Always returns a promise |
| `await promise` | Resume with value or throw rejection |
| `try { await x } catch` | Catch rejection from `x` |
| `Promise.all` | Join required independent work |
| `Promise.allSettled` | Inspect partial outcomes |
| `finally` | Cleanup on success and failure |
| Timeout race | Rejection boundary, not automatic cancellation |
| Abort signal | Cooperative cancellation contract |

**vs. quick reference**

| Pattern | When `catch` fires | Awaiting? |
|---|---|---|
| `try { return fn() }` | Only on sync throw | ✗ (rejection goes to caller) |
| `try { return await fn() }` | Sync throw AND async rejection | ✓ |
| `.then(fn).catch(handler)` | Async rejection | ✓ |
| `fn().catch(handler)` | Async rejection | ✓ (fire-and-forget safe) |

| Execution style | How to write | When to use |
|---|---|---|
| Sequential | `await a; await b;` | b depends on a |
| Parallel (known count) | `await Promise.all([a(), b()])` | Independent, limited count |
| Parallel (bounded) | Queue + worker pool | Unknown count, resource limits |

## Interview Questions

> Difficulty guide: **[Beginner]** = entry-level, **[Mid]** = requires understanding of internals, **[Senior]** = design and tradeoff thinking expected.

1. **[Beginner] Definition:** Explain why an async function that returns `5` still returns a promise.
   - Expected answer: Async functions wrap returned values in fulfillment and thrown errors in rejection.
   - Follow-up: What happens when it returns another promise?

2. **[Mid] Trace:** Which errors does this catch?

   ```js
   async function run(load) {
     try {
       return load();
     } catch (error) {
       return "fallback";
     }
   }
   ```
   - Expected answer: It catches synchronous throws from calling `load`, but not a later rejection of the returned promise because it is not awaited.
   - Follow-up: Repair it and explain the timing.

3. **[Senior] Implementation:** Design a deadline-aware operation that cancels underlying work when supported.
   - Expected answer: Combine a timer, abort signal, cleanup, race semantics, and clear ownership of cancellation.
   - Follow-up: What if the underlying API ignores cancellation?

4. **[Mid] Debugging:** Latency doubled after converting callback code to async/await. Diagnose accidental serialization.
   - Expected answer: Compare dependency graph, start independent promises before awaiting, measure external limits, and preserve error semantics.
   - Follow-up: When is sequential execution safer?

5. **[Senior] Design:** Design an async workflow where the primary result is mandatory, recommendations are optional, and cleanup must complete before response.
   - Expected answer: Define failure policy, concurrency, deadline, cancellation, cleanup ordering, response contract, and observability.
   - Follow-up: How would you handle cleanup failure without hiding the primary failure?

