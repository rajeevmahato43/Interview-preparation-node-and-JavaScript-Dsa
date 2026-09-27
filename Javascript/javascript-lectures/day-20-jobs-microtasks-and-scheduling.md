# Day 20: Jobs, Microtasks, and Observable Scheduling

<nav aria-label="Lecture navigation">

[← Previous Day: Day 19 - `async`/`await` and Asynchronous Error Propagation](day-19-async-await-errors-and-cleanup.md) | [Roadmap](../javascript-roadmap.md) | [Next Day: Day 21 - Memory, Reachability, and Ownership →](day-21-memory-reachability-and-garbage-collection.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Deconstruct the ECMAScript Job queue model and separate language-level specifications from host environment event loops.
- Accurately predict execution ordering across synchronous frames, `process.nextTick`, Promise reaction jobs, `queueMicrotask`, and host timers.
- Explain the microtask queue drain cycle and diagnose event loop starvation scenarios.
- Articulate the role of `setImmediate` vs. `setTimeout(fn, 0)` in libuv's phase transitions.
- Implement cooperative scheduling and yielding strategies to chunk compute-intensive algorithms without blocking I/O latency.
- Debug order-of-execution anomalies in mixed callback, promise, and async generator environments.

---

## Vocabulary Card

| Term | Plain Definition | Everyday Analogy |
| :--- | :--- | :--- |
| **Job (ECMAScript)** | An engine-level abstraction representing a deferred computation unit scheduled to run once the current synchronous execution context stack empties. | A sticky note placed on your computer screen to handle immediately before walking away from your desk. |
| **Microtask** | A high-priority deferred task (promise reactions, `queueMicrotask`) processed immediately following the current script and before any macrotask or I/O. | A fast-pass lane at an amusement park that is emptied completely before the main ride line moves forward. |
| **Macrotask (Task)** | A discrete host-level task (timers, network I/O, UI events) scheduled in distinct event-loop phase queues. | A scheduled bus arrival; passengers board in planned cycles rather than on an instantaneous priority basis. |
| **`process.nextTick`** | A Node.js-specific priority queue that executes before the standard ECMAScript microtask queue across synchronous boundaries. | An emergency intercom interrupt that takes precedence over even the fast-pass line. |
| **Microtask Starvation** | A condition where recursive or continuous microtask scheduling prevents the event loop from ever advancing to timer, I/O, or close phases. | A bucket brigade passing endless buckets down the line, completely forgetting to stop and check if the fire alarm is ringing. |
| **Event Loop Yielding** | Deliberately relinquishing the main thread using timers or `setImmediate` to allow pending I/O and network requests to process. | Pausing a long speech every 10 minutes to take audience questions and drink water. |

---

## Core Concepts

### 1. The Call Stack and Synchronous Execution

JavaScript engines operate on a single main thread with a synchronous call stack. Every function invocation pushes a frame; returning pops it.
- **Synchronous execution is non-preemptive:** A long-running `while(true)` or expensive computation blocks the stack entirely.
- Deferred callbacks (whether microtasks or timers) **never interrupt running JavaScript**. They wait until the stack unwinds to zero.

```javascript
// Node.js code
console.log("1. Synchronous frame start");

function blockMainThread(durationMs) {
  const start = Date.now();
  while (Date.now() - start < durationMs) {
    // Busy wait: Locks the entire process!
  }
}

// Schedules a microtask:
Promise.resolve().then(() => console.log("3. Microtask executed"));

blockMainThread(50); // Locks execution for 50ms
console.log("2. Synchronous frame end");

// Output:
// 1. Synchronous frame start
// 2. Synchronous frame end
// 3. Microtask executed
```

### 2. The Microtask Queue: `Promise.then` and `queueMicrotask`

When a Promise fulfills or rejects, its `.then()`, `.catch()`, or `.finally()` callbacks are queued into the microtask queue.
The browser and Node.js also expose `queueMicrotask(callback)` to schedule a microtask directly without allocating a Promise wrapper.

```javascript
// Node.js code
console.log("A");

queueMicrotask(() => {
  console.log("C (queueMicrotask)");
});

Promise.resolve().then(() => {
  console.log("D (Promise.then)");
});

console.log("B");

// Output:
// A
// B
// C (queueMicrotask)
// D (Promise.then)
```

`queueMicrotask` and `Promise.resolve().then()` share the **same FIFO microtask queue**. They execute in insertion order immediately after synchronous execution finishes.

### 3. Node.js Priority: `process.nextTick` vs. Microtasks

In Node.js, `process.nextTick()` does **not** use the standard ECMAScript microtask queue. It manages its own internal `nextTickQueue` that executes **before** standard Promise microtasks:

```javascript
// Node.js code
Promise.resolve().then(() => {
  console.log("Microtask: Promise.then");
});

queueMicrotask(() => {
  console.log("Microtask: queueMicrotask");
});

process.nextTick(() => {
  console.log("High Priority: process.nextTick");
});

// Output:
// High Priority: process.nextTick
// Microtask: Promise.then
// Microtask: queueMicrotask
```

### 4. Macrotasks: `setTimeout` and `setImmediate`

Macrotasks belong to the host environment (libuv in Node.js) and are partitioned into distinct event-loop phases:
1. **Timers Phase:** Executes callbacks scheduled by `setTimeout()` and `setInterval()`.
2. **Poll / I/O Phase:** Retrieves incoming network traffic and file system read/write completions.
3. **Check Phase:** Executes callbacks scheduled specifically by `setImmediate()`.

Between every macrotask execution, the engine **drains the entire microtask queue to completion**.

```javascript
// Node.js code
setTimeout(() => {
  console.log("Timer callback (Macrotask 1)");
  queueMicrotask(() => console.log("Microtask inside Timer"));
}, 0);

setImmediate(() => {
  console.log("Check callback (Macrotask 2)");
});

// Output:
// Timer callback (Macrotask 1)
// Microtask inside Timer
// Check callback (Macrotask 2)
```

### 5. Microtask Starvation

Because the engine drains the microtask queue completely before advancing to the next event-loop phase, recursively enqueueing microtasks creates an infinite loop that starves the event loop of timers and I/O.

```javascript
// Node.js code
// ❌ DANGEROUS: Recursive microtasks starve the event loop!
let iterations = 0;

function infiniteMicrotask() {
  iterations++;
  if (iterations < 100000) {
    queueMicrotask(infiniteMicrotask);
  }
}

setTimeout(() => {
  console.log("Timer finally fired!"); // Delayed until all 100k microtasks drain!
}, 0);

infiniteMicrotask();
```

---

## Detailed Explanations and Traces

### Trace 1: The Unified Scheduling Ordering Trace

Predict the exact console output of this classic interview challenge:

```javascript
// Node.js code
console.log("1. Sync Main");

setTimeout(() => {
  console.log("8. Macrotask: setTimeout");
}, 0);

setImmediate(() => {
  console.log("9. Macrotask: setImmediate");
});

process.nextTick(() => {
  console.log("4. nextTick 1");
  process.nextTick(() => {
    console.log("5. Nested nextTick");
  });
});

Promise.resolve().then(() => {
  console.log("6. Promise microtask 1");
  queueMicrotask(() => {
    console.log("7. Nested queueMicrotask");
  });
});

queueMicrotask(() => {
  console.log("6.5. queueMicrotask sibling");
});

console.log("2. Sync End");
```

```
Step-by-Step Scheduling Order:
================================================================================
Phase 0: Synchronous Script Execution
  - Logs: "1. Sync Main"
  - Schedules Timer (Macrotask)
  - Schedules Immediate (Macrotask)
  - Pushes callback to nextTickQueue
  - Pushes callback to microtaskQueue
  - Pushes callback to microtaskQueue
  - Logs: "2. Sync End"
  -> Synchronous stack is completely EMPTY.

Phase 1: Process nextTickQueue
  - Runs "4. nextTick 1". Queues "5. Nested nextTick" onto nextTickQueue.
  - NextTick queue still has items! Runs "5. Nested nextTick".
  -> nextTickQueue is now EMPTY.

Phase 2: Drain ECMAScript Microtask Queue
  - Runs "6. Promise microtask 1". Queues "7. Nested queueMicrotask" onto end of queue.
  - Runs "6.5. queueMicrotask sibling".
  - Runs "7. Nested queueMicrotask".
  -> Microtask queue is now EMPTY.

Phase 3: Libuv Event Loop Macrotasks
  - Enters Timers phase: Runs "8. Macrotask: setTimeout".
  - Enters Check phase: Runs "9. Macrotask: setImmediate".
```

---

### Trace 2: `setTimeout(fn, 0)` vs. `setImmediate(fn)` Non-Determinism

Consider running this at the top level of a Node.js script:

```javascript
// Node.js code
setTimeout(() => console.log("timeout"), 0);
setImmediate(() => console.log("immediate"));
```

**Why the output order varies:**
1. At the process root, Node.js boots and enters the event loop.
2. `setTimeout(fn, 0)` is internally normalized to `setTimeout(fn, 1)` because minimum timer granularity is 1ms.
3. Depending on how long process initialization and file parsing took, the event loop may enter the Timers phase in `< 1ms` or `> 1ms`:
   - If `< 1ms` has elapsed, the timer has not expired yet. The loop advances to the Check phase: prints `immediate`, then `timeout`.
   - If `> 1ms` has elapsed, the timer has expired. The Timers phase executes first: prints `timeout`, then `immediate`.

**Deterministic Inside an I/O Cycle:**
When placed inside an I/O callback (e.g. `fs.readFile`), `setImmediate` is **guaranteed to run first** because the Check phase immediately follows the I/O Poll phase!

---

## Code Examples

### 1. Non-Blocking Computation: Cooperative Event Loop Yielding

Long CPU-intensive computations (e.g., parsing large arrays or cryptographic hashing) freeze HTTP server responsiveness. Yielding via `setImmediate` splits work into manageable slices:

```javascript
// Node.js code
// ✅ DO: Yield control to the event loop periodically
async function processLargeArrayNonBlocking(items, batchSize = 1000) {
  let index = 0;

  while (index < items.length) {
    const end = Math.min(index + batchSize, items.length);

    // Process slice synchronously
    for (let i = index; i < end; i++) {
      items[i] = items[i] * 2;
    }

    index = end;

    // Yield control back to libuv to service I/O and timers!
    if (index < items.length) {
      await new Promise((resolve) => setImmediate(resolve));
    }
  }

  return items;
}

// Verification:
const dataset = Array.from({ length: 5000 }, (_, i) => i);
processLargeArrayNonBlocking(dataset, 1000).then(() => {
  console.log("Processed 5,000 items cooperatively without event loop freeze!");
});
```

### 2. Ensuring Consistent Asynchrony (Zalgo Prevention)

Functions that execute sometimes synchronously and sometimes asynchronously ("releasing Zalgo") cause unpredictable state mutations and race conditions:

```javascript
// Node.js code
const cache = new Map();

// ❌ ANTI-PATTERN: Inconsistent timing (Zalgo)
function getUserDataUnsafe(id, callback) {
  if (cache.has(id)) {
    // Synchronous execution on cache hit!
    callback(null, cache.get(id));
  } else {
    // Asynchronous execution on cache miss!
    setTimeout(() => {
      const data = { id, name: "Alice" };
      cache.set(id, data);
      callback(null, data);
    }, 10);
  }
}

// ✅ FIXED: Normalize execution using queueMicrotask
function getUserDataSafe(id, callback) {
  if (cache.has(id)) {
    // Guarantees callback is always deferred asynchronously
    queueMicrotask(() => callback(null, cache.get(id)));
  } else {
    setTimeout(() => {
      const data = { id, name: "Alice" };
      cache.set(id, data);
      callback(null, data);
    }, 10);
  }
}
```

---

## Tricky Points and Gotchas

### 1. `await` Always Defers (Even on Non-Promise Values!)

Developers often assume `await 123` executes synchronously. In reality, `await` **always** yields execution to the microtask queue, wrapping the operand in `Promise.resolve()`:

```javascript
// Node.js code
async function checkSuspension() {
  console.log("Inside async 1");
  await 123; // Defers to microtask queue!
  console.log("Inside async 2");
}

console.log("Outer 1");
checkSuspension();
console.log("Outer 2");

// Output:
// Outer 1
// Inside async 1
// Outer 2
// Inside async 2 (Resumes during microtask drain!)
```

### 2. Unhandled Rejection Timing

Unhandled promise rejections do not trigger immediately when the promise rejects; the runtime allows other microtasks in the current turn to attach a `.catch()` handler before firing the `unhandledRejection` event.

### 3. `setImmediate` vs. `process.nextTick`

Despite its name, `process.nextTick()` runs **immediately** before microtasks, whereas `setImmediate()` runs **later** during the check phase of the event loop.

---

## Hands-on Exercise: Building a Fair-Share Batch Scheduler

### Problem Statement

You are building a background task scheduler in Node.js. It receives an array of 500 database aggregation tasks. If executed in one monolithic promise loop, incoming HTTP requests experience p99 latency spikes of over 500ms.

### Buggy Implementation

```javascript
// Node.js code
// ❌ BUGS:
// 1. Drains array using recursive microtasks, starving I/O
// 2. Blocks event loop check/poll phases
async function runBackgroundQueue(tasks) {
  while (tasks.length > 0) {
    const task = tasks.shift();
    task();
    await Promise.resolve(); // Microtask does NOT yield to I/O!
  }
}
```

### Edge Cases to Address

1. `Promise.resolve()` resumes in the *microtask queue*, preventing the event loop from servicing network sockets.
2. The scheduler must yield to **macrotask** boundaries (`setImmediate`) every $N$ operations or after an elapsed budget (e.g. 16ms).

### Verified Solution

```javascript
// Node.js code
async function runFairShareScheduler(tasks, timeSliceBudgetMs = 15) {
  let completed = 0;
  let sliceStart = Date.now();

  for (const task of tasks) {
    task();
    completed++;

    // Check if time slice budget has been exceeded:
    if (Date.now() - sliceStart >= timeSliceBudgetMs) {
      // ✅ Yield to macrotask (Check Phase) so Node.js can service HTTP requests!
      await new Promise((resolve) => setImmediate(resolve));
      sliceStart = Date.now(); // Reset time budget for next batch
    }
  }

  return completed;
}

// Verification:
const mockTasks = Array.from({ length: 100 }, (_, i) => () => {
  // Simulate small compute work
  let sum = 0;
  for (let j = 0; j < 10000; j++) sum += j;
});

runFairShareScheduler(mockTasks, 5).then((count) => {
  console.log(`Successfully processed ${count} tasks with fair-share macrotask yielding!`);
});
```

---

## Summary

- JavaScript synchronous execution runs on a single call stack and is strictly non-preemptive.
- The ECMAScript Job queue model mandates that Promise reaction jobs and `queueMicrotask` callbacks run as soon as the synchronous call stack is empty.
- In Node.js, `process.nextTick` has higher priority than the ECMAScript microtask queue.
- Between every macrotask execution (timers, I/O, `setImmediate`), the engine drains the microtask queue completely.
- Endless microtask recursion starves the event loop, blocking I/O and timers.
- `await` on any value (including primitives) always yields to the microtask queue.
- To prevent main-thread freezing during heavy CPU processing, yield execution cooperatively using `setImmediate`.

---

## Cheat Sheet

### Execution Queue Precedence Hierarchy (Node.js)

```
[ 1. Call Stack (Synchronous Code) ]
                |
                v
[ 2. process.nextTick Queue (Node.js internal) ]
                |
                v
[ 3. Microtask Queue (Promise reactions, queueMicrotask) ]
                |
                v
[ 4. Event Loop Phases (Macrotasks via libuv) ]
     ├─ Timers (setTimeout, setInterval)
     ├─ Pending Callbacks (OS I/O errors)
     ├─ Poll Phase (I/O reading & network sockets)
     ├─ Check Phase (setImmediate)
     └─ Close Callbacks (socket.destroy())
```

### Scheduling API Comparison

| API | Queue Type | Timing / Phase | Primary Use Case |
| :--- | :--- | :--- | :--- |
| **`process.nextTick()`** | Node Priority | Immediate after sync code, before microtasks | Critical error propagation, internal protocol setup |
| **`queueMicrotask()`** | Microtask | After sync code & nextTick, before macrotasks | Deferred asynchronous state normalization |
| **`Promise.prototype.then()`** | Microtask | Same as `queueMicrotask` | Asynchronous reaction handling |
| **`setImmediate()`** | Macrotask | Libuv Check phase (after I/O polling) | Event-loop yielding, chunked compute work |
| **`setTimeout(fn, 0)`** | Macrotask | Libuv Timers phase (min ~1ms resolution) | Timed execution, browser cross-compatibility |

---

## Interview Questions & Deep Dives

### 1. Explain the exact difference between `process.nextTick()` and `setImmediate()` in Node.js.

**Question:** Why are their names considered historically inverted, and what are their respective execution phases?

**Answer:**
Their names are considered historically inverted because `process.nextTick()` actually executes *immediately* after the current synchronous frame (before any microtasks or event loop phases), whereas `setImmediate()` executes *later* in the Check phase of the libuv event loop after I/O callbacks.

- **`process.nextTick()`:** Manages an internal Node.js FIFO queue. It executes immediately after the current operation on the call stack unwinds, draining completely before standard ECMAScript Promise microtasks and before the event loop advances. Because it drains synchronously to completion, recursive calls to `process.nextTick()` can completely starve I/O.
- **`setImmediate()`:** Schedules a macrotask in the Check phase of the libuv event loop. It executes after timers and the I/O Poll phase have processed. It is specifically designed to allow other pending I/O events, sockets, and timers to run between iterations.

---

### 2. What happens if a microtask schedules another microtask recursively, and how does this affect I/O polling in a Node.js server?

**Question:** If an application contains `function loop() { queueMicrotask(loop); } loop();`, what happens to incoming HTTP connections?

**Answer:**
The Node.js server will suffer complete **event loop starvation**.

The ECMAScript specification dictates that when the call stack clears, the engine must process all pending microtasks until the microtask queue is completely empty. If a microtask callback pushes another microtask onto the queue, the microtask queue continues to populate faster than or equal to its draining rate.

Because the engine will not advance to the libuv event loop phases (such as the Poll phase where new TCP connections and incoming HTTP requests are received) until the microtask queue is empty, the server will **never process incoming HTTP requests, never fire timer callbacks, and never handle file system I/O**. The process appears completely locked despite CPU load being spent entirely on draining the microtask queue.

---

### 3. Inside an `fs.readFile` callback, why is `setImmediate` guaranteed to execute before `setTimeout(..., 0)`?

**Question:** In the following code, explain why the output order is deterministic:
```javascript
fs.readFile(__filename, () => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
});
```

**Answer:**
The order is deterministic because the callback executes during the **Poll phase** of the libuv event loop.

1. When `fs.readFile` finishes reading from the disk, its callback is invoked in the Poll phase.
2. Inside the callback, `setTimeout(..., 0)` schedules a timer callback in the Timers phase.
3. `setImmediate(...)` schedules a callback in the Check phase.
4. After completing the current Poll phase callback, the libuv event loop advances sequentially:
   `Poll phase -> Check phase -> Close callbacks -> (Loop wrap-around) -> Timers phase`.
5. Because the Check phase immediately follows the Poll phase, libuv executes `setImmediate` **first**.
6. The timer callback in the Timers phase must wait for the event loop to complete its current iteration and wrap around to the Timers phase on the next tick.

---

### 4. What is "releasing Zalgo" in asynchronous JavaScript, and how do you protect against it?

**Question:** What does the phrase "Don't release Zalgo" mean, and what bug does it cause in asynchronous architectures?

**Answer:**
"Releasing Zalgo" refers to designing an API that executes its callback **synchronously in some conditions and asynchronously in others** (e.g. executing synchronously when a value is cached, but asynchronously via I/O when not cached).

**Why it causes severe bugs:**
It destroys deterministic execution order. Consider:
```javascript
let count = 0;
fetchData(id, () => {
  console.log("Count:", count);
});
count = 1;
```
If `fetchData` is synchronous (cache hit), the callback runs *before* `count = 1`, printing `Count: 0`. If `fetchData` is asynchronous (cache miss), the callback runs *after* `count = 1`, printing `Count: 1`. This introduces subtle race conditions and unexpected state mutations.

**The Fix:**
Always ensure consistent timing. If an operation can complete synchronously (from memory cache), wrap the callback invocation in `queueMicrotask(callback)` or `process.nextTick(callback)` so that it is guaranteed to execute asynchronously after the caller's synchronous code finishes.

---

<nav aria-label="Lecture navigation">

[← Previous Day: Day 19 - `async`/`await` and Asynchronous Error Propagation](day-19-async-await-errors-and-cleanup.md) | [Roadmap](../javascript-roadmap.md) | [Next Day: Day 21 - Memory, Reachability, and Ownership →](day-21-memory-reachability-and-garbage-collection.md)

</nav>
