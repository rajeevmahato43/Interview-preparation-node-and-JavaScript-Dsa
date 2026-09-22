# Day 18: Promises and Promise Composition

<nav aria-label="Lecture navigation">

[Previous: Modules and Module Interoperability](day-17-modules-and-interoperability.md) | [Roadmap](../javascript-roadmap.md) | [Next: `async`/`await` and Asynchronous Error Propagation](day-19-async-await-errors-and-cleanup.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain promise states and settlement.
- Trace `then`, `catch`, and `finally` chains.
- Explain thenable adoption and flattening.
- Choose among `all`, `allSettled`, `race`, and `any`.
- Distinguish sequential work from concurrent work.
- Design failure and partial-result behavior deliberately.

## Prerequisites

Read [Day 06: Functions, Parameters, and Callbacks](day-06-functions-parameters-and-callbacks.md), [Day 07: Errors and Exceptions](day-07-errors-and-exception-flow.md), and [Day 17: Modules and Module Interoperability](day-17-modules-and-interoperability.md).

## Core Concepts

A promise represents the eventual result of an operation. It is pending, fulfilled, or rejected. Settlement happens once; later resolve or reject attempts do not change the result.

```js
const promise = new Promise((resolve) => {
  resolve("done");
  resolve("ignored");
});

promise.then((value) => console.log(value)); // "done"
```

Creating a promise runs its executor immediately. The callback passed to `then` runs later through promise job scheduling, discussed in Day 20.

### Chaining

```js
Promise.resolve(2)
  .then((value) => value * 3)
  .then((value) => console.log(value)); // 6
```

A `then` call returns a new promise. Returning a normal value fulfills the next promise. Throwing rejects it. Returning a promise makes the next promise follow that promise.

```js
Promise.resolve("start")
  .then(() => {
    throw new Error("failed");
  })
  .catch((error) => `recovered: ${error.message}`)
  .then(console.log); // "recovered: failed"
```

### `finally`

`finally` runs for both fulfillment and rejection. Its normal completion passes the earlier result through; a throw or rejected promise from `finally` replaces it.

```js
Promise.resolve("value")
  .finally(() => console.log("cleanup"))
  .then(console.log); // cleanup, then value
```

## Detailed Explanations and Traces

### The missing `return` bug

```js
function loadName() {
  return Promise.resolve("Asha")
    .then((name) => {
      console.log(name);
      // Missing return
    });
}

loadName().then((name) => console.log(name)); // Asha, then undefined
```

Every asynchronous branch that should contribute to the next step must return its promise or value.

### Thenables

Promise resolution adopts objects with a callable `then` method.

```js
const thenable = {
  then(resolve) {
    resolve("adopted");
  },
};

Promise.resolve(thenable).then(console.log); // "adopted"
```

This is why a promise can follow a promise-like object from another library. A badly behaved thenable can call callbacks multiple times or throw; the promise resolution procedure settles the promise only once.

### Promise combinators

```js
const first = Promise.resolve("first");
const second = Promise.resolve("second");

Promise.all([first, second]).then(console.log); // ["first", "second"]
Promise.allSettled([first, Promise.reject(new Error("no"))])
  .then(console.log);
// [{ status: "fulfilled", value: "first" },
//  { status: "rejected", reason: Error("no") }]
```

- `Promise.all`: fulfills with ordered results; rejects when one rejects.
- `Promise.allSettled`: waits for every input and reports each outcome.
- `Promise.race`: settles with the first input to settle.
- `Promise.any`: fulfills with the first fulfillment; rejects with an aggregate error if all reject.

The combinators do not automatically cancel the underlying operations.

### Sequential versus concurrent composition

```js
async function sequential(loadA, loadB) {
  const a = await loadA();
  const b = await loadB(a);
  return [a, b];
}

async function concurrent(loadA, loadB) {
  const firstPromise = loadA();
  const secondPromise = loadB();
  return Promise.all([firstPromise, secondPromise]);
}
```

Only use concurrency when the operations are independent and the external system can handle the load. Starting thousands of promises at once is not the same as bounded concurrency.

## Examples and Traces

### Bounded task runner shape

```js
async function runTasks(tasks, workerCount) {
  if (!Number.isInteger(workerCount) || workerCount < 1) {
    throw new RangeError("workerCount must be a positive integer");
  }

  const results = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < tasks.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await tasks[index]();
    }
  }

  const workers = Array.from(
    { length: Math.min(workerCount, tasks.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}
```

This is a teaching example. Real code should define what happens when one task fails and whether already-started tasks should continue.

## Node.js Connection

Promise composition controls service latency and failure policy, while Node adapters determine the underlying I/O and cancellation contract.

---

## Compare & Recall

| Concept A | Concept B | Key difference |
|---|---|---|
| `.then(onFulfill, onReject)` | `.then().catch()` | Both handle rejection. Two-arg `.then` catches only the previous step. `.catch` chains separately and can recover from any earlier rejection in the chain. Prefer `.catch()` for clarity. |
| `Promise.all` | `Promise.allSettled` | `.all`: one rejection immediately rejects the group. `.allSettled`: waits for all, always returns status records. Use `.allSettled` when partial results are acceptable. |
| `Promise.race` | `Promise.any` | `.race`: first **settled** (fulfilled or rejected) wins. `.any`: first **fulfilled** wins; only rejects if all reject. Use `.any` for "any successful" semantics. |
| Parallel execution | Sequential (chained) execution | Parallel: start all promises, then await. Sequential: `await` each before starting the next. Parallel is faster when tasks are independent; sequential when each depends on the previous. |
| `finally` | `catch` | `catch` recovers from rejection and can change the result. `finally` runs on both success and failure but **passes the result through** (unless it throws or returns a rejected promise). |
| Resolved | Fulfilled | Resolved is a superset: a promise is resolved if it adopts another promise's fate. Fulfilled means it resolved with a plain value (not pending). |

> **Cross-day links:** `async`/`await` (syntactic sugar over promises) is in [Day 19](day-19-async-await-errors-and-cleanup.md). Microtask scheduling and when `.then` callbacks run is in [Day 20](day-20-jobs-microtasks-and-scheduling.md).

## Common Mistakes and Interview Traps

- Forgetting to return a promise inside a `then` callback.
- Assuming `Promise.all` cancels remaining work after rejection.
- Starting independent work sequentially by placing every call after an `await`.
- Starting dependent work concurrently.
- Treating `race` as a cancellation mechanism.
- Ignoring unhandled rejection paths.
- Assuming `finally` cannot replace the original result.
- Launching unbounded parallel tasks.

## Tricky Points

- A promise can be resolved with another promise and remain pending until the adopted promise settles.
- `Promise.all` preserves input order, not completion order.
- `Promise.any` rejects only after every input rejects.
- An async function always returns a promise, including when it returns a normal value.

## Practical Exercise

**Goal:** Build a task runner with explicit failure semantics.

**Inputs and outputs:** Receive async task functions and a concurrency limit; return ordered results or a structured failure report.

**Constraints:** Never exceed the limit, preserve task indexes, and document whether remaining work continues after a failure.

**Edge cases:** Empty tasks, limit zero, synchronous throws, rejected promises, and one very slow task.

**Acceptance criteria:** Test sequential and bounded-concurrent behavior and explain why each combinator is or is not appropriate.

## Summary

- A promise settles once as fulfilled or rejected.
- Chaining passes values, errors, and returned promises to new promises.
- Thenables are adopted by the promise resolution process.
- `finally` is for cleanup but can replace the result if it fails.
- Combinators express different group completion policies.
- Concurrency must be bounded when external resources or memory are limited.
- Promise combinators do not automatically cancel underlying work.

## Cheat Sheet

| Method | Fulfillment behavior | Rejection behavior |
|---|---|---|
| `then` | Transforms value | Callback can recover or rethrow |
| `catch` | Recovers from rejection | New throw remains rejected |
| `finally` | Passes result through normally | Failure can replace result |
| `Promise.all` | Ordered values when all fulfill | First observed rejection rejects group |
| `Promise.allSettled` | All status records | Does not reject for member failure |
| `Promise.race` | First settlement | First rejection can reject |
| `Promise.any` | First fulfillment | Rejects if all reject |

**vs. quick reference**

| | `Promise.all` | `Promise.allSettled` | `Promise.race` | `Promise.any` |
|---|---|---|---|---|
| Waits for all? | Only if all fulfill | ✓ Always | ✗ (first settles) | ✗ (first fulfills) |
| Rejects on one failure? | ✓ Yes | ✗ No | If first is rejected | Only if all reject |
| Returns | Ordered values | Status records | First result | First fulfillment |
| Use case | All required | Partial OK | Race/timeout | Any-success |

## Interview Questions

> Difficulty guide: **[Beginner]** = entry-level, **[Mid]** = requires understanding of internals, **[Senior]** = design and tradeoff thinking expected.

1. **[Mid] Definition:** Explain promise settlement and thenable adoption.
   - Expected answer: State the three states, one-settlement rule, and how returned promises or thenables determine the next promise.
   - Follow-up: What happens if a thenable calls both resolve and reject?

2. **[Beginner] Trace:** What is the final value?

   ```js
   Promise.resolve(1)
     .then((value) => value + 1)
     .then(() => { throw new Error("x"); })
     .catch(() => 10)
     .finally(() => {})
     .then(console.log);
   ```
   - Expected answer: `10`; the catch recovers and finally passes the value through.
   - Follow-up: What if finally throws?

3. **[Senior] Implementation:** Implement bounded concurrency while preserving result order.
   - Expected answer: Use a shared next index, limited workers, ordered result slots, and explicit handling of synchronous and async failures.
   - Follow-up: How would you add cancellation?

4. **[Mid] Debugging:** A service rejects early but database writes continue. Explain why `Promise.all` did not cancel them.
   - Expected answer: Combinators observe promises but do not own cancellation; use cooperative cancellation and transaction/domain design.
   - Follow-up: How should partial writes be reconciled?

5. **[Senior] Design:** Choose a composition strategy for ten independent remote calls with rate limits and partial-result requirements.
   - Expected answer: Discuss bounded concurrency, retries, deadlines, result policy, observability, overload, and idempotency.
   - Follow-up: How would the design change if one result is mandatory?

