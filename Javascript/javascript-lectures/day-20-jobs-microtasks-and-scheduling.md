# Day 20: Jobs, Microtasks, and Observable Scheduling

<nav aria-label="Lecture navigation">

[Previous: `async`/`await` and Asynchronous Error Propagation](day-19-async-await-errors-and-cleanup.md) | [Roadmap](../javascript-roadmap.md) | [Next: Memory, Reachability, and Ownership](day-21-memory-reachability-and-garbage-collection.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain the call stack and execution jobs at a useful level.
- Predict ordering between synchronous code and promise reactions.
- Use `queueMicrotask` deliberately.
- Separate ECMAScript guarantees from timer and event-loop host behavior.
- Recognize microtask starvation and its effect on Node latency.
- Trace scheduling examples without copying browser explanations into Node blindly.

## Prerequisites

Read [Day 05: Conditions, Loops, and Control Transfer](day-05-control-flow-and-loops.md), [Day 08: Closures, Execution Context, and `this`](day-08-closures-execution-context-and-this.md), [Day 18: Promises and Promise Composition](day-18-promises-and-composition.md), and [Day 19: `async`/`await` and Asynchronous Error Propagation](day-19-async-await-errors-and-cleanup.md).

## Core Concepts

JavaScript executes synchronous code on a call stack. A function call adds a frame; returning removes it. A long synchronous loop keeps the stack busy and prevents other work from running.

Promise reactions, such as `.then` callbacks, run as jobs after the current synchronous job finishes. They do not run in the middle of the current function just because a promise is already fulfilled.

```js
console.log("one");
Promise.resolve().then(() => console.log("three"));
console.log("two");
```

Expected output:

```text
one
two
three
```

### `queueMicrotask`

```js
console.log("start");
queueMicrotask(() => console.log("microtask"));
console.log("end");
```

Expected output:

```text
start
end
microtask
```

Both promise reactions and `queueMicrotask` callbacks are microtask-like scheduling mechanisms in modern JavaScript hosts. The exact host event-loop integration is not the same as the ECMAScript language model.

## Detailed Explanations and Traces

### Nested microtasks

```js
console.log("A");
Promise.resolve().then(() => {
  console.log("B");
  queueMicrotask(() => console.log("D"));
});
queueMicrotask(() => console.log("C"));
console.log("E");
```

Expected output:

```text
A
E
B
C
D
```

Synchronous code finishes first. The microtask queue then processes `B`, `C`, and finally the microtask added by `B`.

### `await` creates a later continuation

```js
async function show() {
  console.log("inside 1");
  await null;
  console.log("inside 2");
}

console.log("outside 1");
show();
console.log("outside 2");
```

Expected output:

```text
outside 1
inside 1
outside 2
inside 2
```

Even though `null` is not a promise, the continuation after `await` resumes later.

### Timers are host behavior

```js
console.log("start");
setTimeout(() => console.log("timer"), 0);
Promise.resolve().then(() => console.log("promise"));
console.log("end");
```

In common browser and Node environments the output is usually `start`, `end`, `promise`, `timer`, because the current job finishes and promise reactions are processed before the timer callback. Timer phases and exact ordering around other host APIs are runtime behavior; do not describe them as universal ECMAScript rules.

### Microtask starvation

```js
let count = 0;
function keepRunning() {
  count += 1;
  if (count < 3) {
    queueMicrotask(keepRunning);
  }
}

queueMicrotask(keepRunning);
console.log("scheduled");
```

This bounded example finishes. An unbounded chain can keep adding microtasks so that timers, I/O callbacks, or other host work wait for a very long time. A production design needs a bound, batching, or a yield point appropriate to the host.

## Examples and Traces

### Separate guarantees from host behavior

| Behavior | Language-level idea | Host-dependent part |
|---|---|---|
| Synchronous statements finish first | Yes | No |
| Promise continuation is deferred | Yes | Integration details vary |
| `queueMicrotask` exists | Modern platform feature | Availability/version matters |
| `setTimeout` exists | No, it is a host API | Delay and event-loop phase |
| Node timer versus I/O ordering | No | Node runtime behavior |
| Browser rendering opportunity | No | Browser behavior |

## Compare & Recall

| Concept A | Concept B | Key difference |
|---|---|---|
| Synchronous code | Microtask (promise reaction) | Synchronous code always finishes first. Microtasks run **after** the current synchronous job completes, but **before** the next macrotask (timer, I/O). |
| Microtask (`Promise.then`) | Macrotask (`setTimeout`) | Microtasks: run after current job, before any I/O/timer callbacks. Macrotasks: scheduled by the host (Node/browser) with their own delay. Promise reactions are microtasks; timers are macrotasks. |
| `queueMicrotask(fn)` | `Promise.resolve().then(fn)` | Both schedule a microtask. They run at the same checkpoint and are effectively equivalent in ordering. `queueMicrotask` is more explicit. |
| `await value` | Synchronous read | Even `await 5` defers continuation to a microtask. The function pauses and yields to the microtask queue, even for a non-async value. |
| Starvation (microtask loop) | Starvation (sync loop) | Endless synchronous code blocks everything. Endless microtask chaining also starves timers/I/O because the queue is drained before moving to macrotasks. |
| Event loop (Node) | Event loop (browser) | Same basic principle (call stack + queues), but different phases and APIs. Node has libuv phases (timers, I/O, check/setImmediate). Don't assume browser diagrams map exactly to Node. |

> **Cross-day links:** Promises and their settlement are in [Day 18](day-18-promises-and-composition.md). `async/await` and how `await` defers are in [Day 19](day-19-async-await-errors-and-cleanup.md). Node-specific async patterns are in [Day 27](day-27-concurrency-and-resource-safe-async.md).

## Common Mistakes and Interview Traps

- Saying promise callbacks run immediately.
- Treating `setTimeout(..., 0)` as "run next" with an exact universal guarantee.
- Mixing browser event-loop diagrams with Node behavior.
- Creating an unbounded microtask chain.
- Confusing concurrency with parallel execution.
- Assuming `await` makes CPU-heavy work non-blocking.
- Ignoring synchronous work before the first await.

## Tricky Points

- A fulfilled promise still schedules its reaction for later.
- A microtask created by another microtask is processed after already queued microtasks according to the host's microtask checkpoint behavior.
- `await` can resume later even for an ordinary value.
- Microtasks do not create a new thread; CPU-heavy callbacks still run on the JavaScript thread.

## Practical Exercise

**Goal:** Trace and verify a mixed scheduling example.

**Inputs and outputs:** Include synchronous logs, a promise reaction, `queueMicrotask`, and a timer; write the expected output order.

**Constraints:** Label which ordering is language-level and which depends on Node. Add a bounded microtask loop.

**Edge cases:** A rejection callback, nested microtasks, a timer registered inside a microtask, and a large synchronous loop.

**Acceptance criteria:** Produce a manual trace, run the example only on a stated runtime version, and explain any host-dependent result.

## Summary

- Synchronous code runs before deferred promise reactions.
- Promise reactions and microtasks run after the current job at a microtask checkpoint.
- `await` resumes later, even for ordinary values.
- Timers are host APIs, not ECMAScript guarantees.
- Endless synchronous work or microtasks can starve other work.
- Node-specific phase ordering must be checked against the supported runtime.

## Cheat Sheet

| Code | General ordering |
|---|---|
| Direct statement | Current synchronous job |
| `Promise.resolve().then(fn)` | Later promise reaction |
| `queueMicrotask(fn)` | Later microtask |
| `await value` continuation | Later async continuation |
| `setTimeout(fn, 0)` | Host timer callback, not exact universal timing |
| Long loop | Blocks other JavaScript callbacks |
| Endless microtask chain | Can starve host work |

**vs. quick reference**

| Queue type | Examples | Runs when |
|---|---|---|
| Current (synchronous) | Regular code, call stack | Immediately |
| Microtask | `Promise.then`, `queueMicrotask`, `await` resume | After current sync job, before next macrotask |
| Macrotask | `setTimeout`, `setInterval`, I/O callbacks | After all microtasks are drained |
| Node-specific | `setImmediate` (check phase), `process.nextTick` | Phase-dependent; check Node docs |

> **Rule of thumb:** Promise reaction ≠ immediate. Timer ≠ exact delay. The only guarantees are: sync first, microtasks before macrotasks.

## Interview Questions

> Difficulty guide: **[Beginner]** = entry-level, **[Mid]** = requires understanding of internals, **[Senior]** = design and tradeoff thinking expected.

1. **[Beginner] Definition:** Explain why a promise callback does not run in the middle of the current synchronous function.
   - Expected answer: The reaction is scheduled for a later job/microtask checkpoint after the current job completes.
   - Follow-up: Does this create parallel JavaScript execution?

2. **[Mid] Trace:** Predict the output:

   ```js
   console.log("a");
   queueMicrotask(() => console.log("c"));
   Promise.resolve().then(() => console.log("d"));
   console.log("b");
   ```
   - Expected answer: `a`, `b`, then `c`, `d` in the queue order for this example.
   - Follow-up: What if the first microtask queues another microtask?

3. **[Senior] Implementation:** Build a batch processor that handles at most 100 items per microtask turn and yields between batches.
   - Expected answer: Define queue state, progress, error handling, yield mechanism, fairness, and memory limits.
   - Follow-up: Which yield mechanism is appropriate for the target host?

4. **[Mid] Debugging:** A Node server's timers and I/O callbacks are delayed even though no single promise is slow. Diagnose a microtask starvation pattern.
   - Expected answer: Look for recursive promise/microtask scheduling, measure queue growth, add bounded batches and an appropriate yield, and test latency.
   - Follow-up: How would you distinguish CPU blocking from microtask starvation?

5. **[Senior] Design:** Explain scheduling guarantees for a cross-platform library that must behave consistently in browsers and Node.
   - Expected answer: Promise only language-level assumptions, avoid relying on timer/I/O order, document host adapters, test supported runtimes, and define fairness expectations.
   - Follow-up: How would you handle a host without a desired scheduling API?

