# Day 02: Event Loop and Scheduling

<nav aria-label="Lecture navigation">

[Previous: Node.js Runtime and Architecture](day-01-node-runtime-and-architecture.md) | [Roadmap](../node-roadmap.md) | [Next: Modules, Packages, and Resolution](day-03-modules-packages-and-resolution.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain why Node uses an event loop.
- Describe the purpose and normal progression of the timers, pending callbacks, poll, check, and close-callback phases.
- Explain how an asynchronous operation moves from registration to a callback that runs on the JavaScript thread.
- Trace synchronous code, promise callbacks, `process.nextTick()`, timers, and immediates.
- Distinguish microtasks from Node's `nextTick` queue and event-loop phases.
- Explain why timer delays are minimum delays, not exact appointment times.
- Recognize starvation and design code that gives other work a chance to run.

## Prerequisites

Read [Day 01: Node.js Runtime and Architecture](day-01-node-runtime-and-architecture.md) and [JavaScript Day 20: Jobs, Microtasks, and Scheduling](../../Javascript/javascript-lectures/day-20-jobs-microtasks-and-scheduling.md).

The JavaScript language defines promise jobs. Node adds queues and event-loop phases around that language behavior. Exact ordering can depend on where code is started, so this lecture states the starting context for each example.

## Core Concepts

### 1. The event loop

The event loop is the runtime's repeated process of finding ready work and running its callbacks. Node does not run a callback merely because its delay has expired. The callback must be eligible for a phase, and the JavaScript thread must finish the callback that is currently running.

This is a simplified mental model, not a promise that every phase runs once in this exact order:

```text
  execute the current JavaScript callback to completion
  run the current JavaScript callback to completion
  drain process.nextTick callbacks
  drain promise microtasks
  enter an event-loop phase and run eligible callbacks
  repeat the queue-draining step after Node returns from a callback
```

Node's documented phases include timers, pending callbacks, poll, check, and close callbacks. Node also has internal idle and prepare phases. The phase model describes scheduling responsibilities; it is not a promise that every operation uses one directly observable queue.

### 2. What happens when asynchronous work is registered

Consider a filesystem operation:

```js
const fs = require("node:fs");

fs.readFile("notes.txt", "utf8", (error, contents) => {
  if (error) {
    console.error(error.message);
    return;
  }

  console.log("file callback");
});
```

The important sequence is:

```text
1. JavaScript calls fs.readFile.
2. Node validates the arguments and registers the operation.
3. The current JavaScript callback continues; it does not wait for file contents.
4. The operating system or libuv worker pool performs the appropriate work.
5. Completion information is recorded when the operation finishes.
6. Node makes the callback eligible for a later event-loop opportunity.
7. The callback runs on the main JavaScript thread when its phase is reached.
8. Node drains nextTick and promise work created by that callback.
```

The I/O can progress while JavaScript does other work, but the user callback still runs on the JavaScript thread. Network sockets usually use operating-system readiness; some filesystem, DNS, crypto, and compression work may use the libuv worker pool. ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œEverything runs in the thread poolÃƒÂ¢Ã¢â€šÂ¬Ã‚Â is incorrect.

### 3. `setTimeout` is a lower bound

`setTimeout(callback, 10)` asks Node not to run the callback before roughly 10 milliseconds. It does not reserve the CPU at exactly 10 milliseconds. If the event loop is busy, the callback runs later.

### 4. `process.nextTick` and promise microtasks

`process.nextTick()` adds a callback to Node's next-tick queue. Node drains that queue after the current JavaScript operation finishes and before it continues through the event-loop phases. Promise reactions use the microtask queue, which Node drains after the next-tick queue.

In CommonJS code, a top-level `process.nextTick()` therefore runs before a promise reaction scheduled at the same point. ES modules are evaluated through the microtask machinery, so do not transfer that exact top-level ordering to every module format.

Both tools are useful in small amounts. Repeatedly adding more work to either queue can starve timers and I/O.

### 5. `setImmediate`

`setImmediate()` schedules a callback for the check phase. Its relationship with `setTimeout(..., 0)` is not universally fixed when both are started from top-level code. Inside an I/O callback, `setImmediate()` commonly runs before a zero-delay timer because the check phase follows the poll phase.

### 6. The phases in detail

For interview reasoning, use this simplified model:

```text
timers -> pending callbacks -> poll -> check -> close callbacks
```

The real loop also contains internal `idle, prepare` work. Node can begin with timers before entering the loop, and timer placement changed in Node.js 20 when libuv moved timer processing to after poll for each iteration. Use the model to explain responsibilities, not to predict every callback order.

| Phase | Main responsibility | Common example |
|---|---|---|
| Timers | Run eligible timer callbacks | `setTimeout`, `setInterval` |
| Pending callbacks | Run selected deferred system callbacks | Some TCP errors |
| Poll | Receive and process ready I/O; wait when appropriate | Socket and filesystem completion |
| Check | Run callbacks scheduled by `setImmediate` | `setImmediate` |
| Close callbacks | Notify about closed handles | Socket `close` events |

The poll phase is the key decision point:

```text
ready I/O?       -> run I/O callbacks
setImmediate queued? -> leave poll and enter check
timer ready?     -> move toward the timers phase
otherwise        -> wait for I/O or the next timer deadline
```

Timers are thresholds, not appointments. A long callback delays every later phase. `setImmediate()` commonly beats a zero-delay timer when both are scheduled inside an I/O callback because check follows poll.

#### Microtask checkpoints between callbacks

The phase diagram is incomplete without the queues that run around callbacks:

```text
run one JavaScript callback
  -> drain process.nextTick queue
  -> drain promise microtasks
  -> select and run more event-loop work
```

After Node returns from a JavaScript callback, it drains the next-tick queue and then the promise microtask queue before continuing. An unbounded chain can prevent the loop from reaching timers or I/O.

#### Node version note

Node.js 20 changed timer processing through its libuv update: timers run after poll during each loop iteration instead of both before and after poll. A startup timer may still run before the first loop iteration. Therefore, do not promise one top-level order for a zero-delay timer and `setImmediate`; state the Node version when the edge matters.

### 7. A complete event-loop walkthrough

This is a **Node.js example**. The labels in the trace describe the usual scheduling model, not a promise that filesystem completion occurs at a fixed time:

```js
const fs = require("node:fs");

console.log("A: top-level");

setTimeout(() => {
  console.log("D: timer callback");
}, 0);

setImmediate(() => {
  console.log("E: immediate callback");
});

fs.readFile(__filename, () => {
  console.log("F: I/O callback");
  process.nextTick(() => console.log("G: nextTick from I/O"));
  Promise.resolve().then(() => console.log("H: promise from I/O"));
  setImmediate(() => console.log("I: immediate from I/O"));
  setTimeout(() => console.log("J: timer from I/O"), 0);
});

Promise.resolve().then(() => console.log("C: top-level promise"));
process.nextTick(() => console.log("B: top-level nextTick"));
```

The reasoning is more important than memorizing one output:

```text
1. A runs synchronously while the module is evaluated.
2. B runs before C because nextTick is drained before promise microtasks in Node.
3. C runs before the event loop proceeds to ordinary timer, poll, or check work.
4. D and E are both eligible from top-level scheduling; their relative order is context- and version-sensitive.
5. F runs only after the filesystem operation completes and its callback becomes eligible.
6. G runs after F's callback reaches a nextTick checkpoint.
7. H runs after the nextTick queue is drained.
8. I is queued for the check phase after the I/O callback returns, so it commonly runs before J.
9. J waits for a timer phase and is not guaranteed to run immediately after F.
```

The trace demonstrates three independent facts: registration is synchronous, completion is asynchronous, and scheduling a callback does not mean it interrupts the callback currently running.


## Detailed Explanations and Traces

### Starvation trace

```js
let count = 0;

function keepGoing() {
  count += 1;
  if (count < 1000) {
    process.nextTick(keepGoing);
  }
}

process.nextTick(keepGoing);
setTimeout(() => console.log("timer can run now"), 0);
```

The timer waits until the next-tick work stops. An unbounded version could prevent timers and I/O callbacks from running for a dangerous amount of time.

Promise microtasks can create the same problem. The issue is an unbounded chain that keeps refilling a queue before normal event-loop progress. Use bounded batches and a later-turn scheduling point for sustained work.

For large work, process a bounded amount and schedule the next chunk later:

```js
function processInChunks(items, handleChunk, done) {
  let index = 0;

  function processNextChunk() {
    const end = Math.min(index + 100, items.length);
    while (index < end) {
      handleChunk(items[index]);
      index += 1;
    }

    if (index < items.length) {
      setImmediate(processNextChunk);
      return;
    }

    done();
  }

  processNextChunk();
}
```

This is a teaching pattern. The correct chunk size depends on the work and latency target.

## Node.js, JavaScript, and DSA Connections

- **JavaScript connection:** Promise handlers are jobs that run after the current stack finishes.
- **Node connection:** Node adds `nextTick`, timers, I/O, and check scheduling around those jobs.
- **DSA connection:** A queue is useful because work can be stored and processed in order, but an always-growing queue increases waiting time and memory use.

## Common Mistakes and Interview Traps

- Saying `setTimeout(fn, 0)` runs immediately.
- Giving one fixed top-level ordering for `setTimeout(0)` and `setImmediate()`.
- Treating `process.nextTick()` as a normal timer.
- Recursively scheduling microtasks without a stopping condition.
- Assuming `await` makes CPU work non-blocking. It only yields when awaiting an asynchronous result.
- Measuring timer delay without considering garbage collection, CPU load, and other callbacks.

## Tricky Points

- A callback can be ready but still wait behind earlier work.
- `process.nextTick()` can starve the event loop more easily than a timer because it is drained before the runtime advances normally.
- Timer order is not a reliable way to measure elapsed time precisely.
- The same code can show different timer/immediate order depending on whether it starts at top level or inside I/O.

## Practical Exercise

**Goal:** Build a scheduling trace that records the order of different callback types.

**Inputs and outputs:** Record labels from synchronous code, `process.nextTick`, a resolved promise, a zero-delay timer, an immediate, and a filesystem callback. Print the resulting array.

**Constraints:** Run the trace at top level and again from inside an I/O callback. State which orderings are guaranteed and which are context-dependent.

**Edge cases:** Add a bounded `nextTick` chain and an intentionally large synchronous loop. Observe how each affects a timer.

**Acceptance criteria:**

- You explain every observed ordering without claiming unsupported guarantees.
- You identify at least one starvation risk.
- You show a bounded way to split CPU work.
- You state that timer delay is a minimum delay, not an exact execution time.

## Summary

- The event loop runs ready callbacks while the process has active work.
- Promise jobs and `process.nextTick` callbacks can run before later timer and I/O work.
- Timers express a minimum delay.
- `setImmediate` ordering depends on the starting context.
- Long callbacks and unbounded microtask chains increase latency and can starve I/O.
- Bounded chunks and explicit scheduling help keep the event loop responsive.

## Cheat Sheet

### Phases

| Phase | Remember |
|---|---|
| Timers | Eligible `setTimeout` and `setInterval` callbacks; threshold is not an exact time |
| Pending callbacks | Selected deferred system callbacks |
| Poll | Ready I/O, or waits for I/O/timer deadline |
| Check | `setImmediate` callbacks |
| Close callbacks | Close notifications for handles and sockets |

After each callback, Node can drain `process.nextTick()` and promise microtasks. Long callbacks and unbounded microtasks delay every phase.

### Scheduling tools

| Tool | Main idea | Main risk |
|---|---|---|
| Promise handler | Runs after the current stack | Large chains can delay other work |
| `process.nextTick` | Runs before normal event-loop progress | Starvation |
| `setTimeout` | Runs after a minimum delay | Delayed by busy loop |
| `setImmediate` | Runs in the check phase | Order varies by starting context |
| `fs` callback | Runs when I/O result is ready | Callback can still be slow |

## Interview Questions

1. **Definition:** What problem does the Node event loop solve?
   - **Expected answer:** It lets one main JavaScript thread coordinate many operations that spend time waiting for I/O.
   - **Follow-up:** Which parts are JavaScript guarantees and which parts are Node behavior?

2. **Trace:** In the top-level example, which logs are guaranteed to appear first?
   - **Expected answer:** `sync`, then `nextTick`, then `promise`; timer/immediate order should not be claimed universally.
   - **Follow-up:** How does starting inside an I/O callback change the discussion?

3. **Implementation:** Write a bounded chunk processor for 100,000 items.
   - **Expected answer:** Process a finite batch, schedule the next batch, and expose completion and error behavior.
   - **Follow-up:** How would you cancel it?

4. **Debugging [Hard]:** A health endpoint stops responding while a promise-based loop is running. What could be wrong?
   - **Expected answer:** The loop may continuously schedule microtasks or perform long synchronous work; inspect event-loop delay and break work into bounded chunks.
   - **Follow-up:** Why might replacing one queue with `nextTick` make it worse?

5. **Design [Hard]:** Design a scheduler for background tasks that must not delay HTTP requests.
   - **Expected answer:** Use bounded concurrency, queue limits, deadlines, cancellation, prioritization, metrics, and a separate worker when CPU work is heavy.
   - **Follow-up:** How do you prevent an unbounded queue from becoming a memory problem?

6. **Trace [Hard]:** In the complete walkthrough, why must the top-level `nextTick` and promise run before ordinary event-loop callbacks? Why do the callbacks created inside the I/O callback not run inside that same JavaScript call stack?
  - **Expected answer:** Node drains its next-tick and promise queues after the current stack; newly scheduled callbacks are later work associated with their queues or phases and cannot interrupt the current callback.
  - **Follow-up:** What changes if the I/O callback creates an unbounded promise chain?

7. **Trace [Very Hard]:** Compare `setTimeout(fn, 0)` and `setImmediate(fn)` at top level, inside an I/O callback, and after a long synchronous callback.
  - **Expected answer:** Top-level ordering is not a portable guarantee; inside I/O, immediate commonly precedes the zero-delay timer; a long callback delays both because neither preempts running JavaScript. Include supported Node version assumptions.
  - **Follow-up:** How did the Node 20/libuv timer change affect simplistic diagrams?

<nav aria-label="Lecture navigation">

[Previous: Node.js Runtime and Architecture](day-01-node-runtime-and-architecture.md) | [Roadmap](../node-roadmap.md) | [Next: Modules, Packages, and Resolution](day-03-modules-packages-and-resolution.md)

</nav>