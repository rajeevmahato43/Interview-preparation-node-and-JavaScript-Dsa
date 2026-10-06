# Day 07: Events, Timers, and Resource Ownership

<nav aria-label="Lecture navigation">

[← Previous: Buffers, Encodings, and Serialization](day-06-buffers-encodings-and-serialization.md) | [Roadmap](../node-roadmap.md) | [Next: Streams and Backpressure](day-08-streams-and-backpressure.md)

</nav>

---

## What You Will Learn Today

By the end of this lecture, you should be able to:

- Explain the synchronous execution contract of Node's `EventEmitter` and trace listener dispatching on the V8 call stack.
- Handle the special `'error'` event and utilize `events.errorMonitor` to prevent unhandled error crashes.
- Diagnose and eliminate event listener memory leaks (`MaxListenersExceededWarning`) caused by per-request subscriptions and closure retention.
- Understand listener identity and safely decouple event listeners using `off()`, `once()`, and `events.on()` async iterators.
- Prevent timer drift and concurrency pileups by replacing overlapping `setInterval()` loops with self-scheduling `setTimeout()` chains.
- Coordinate modern resource cancellation using `AbortController` and `AbortSignal` across timers, sockets, and event listeners.
- Avoid the async event listener trap and handle promise rejections cleanly using `captureRejections: true`.

---

## Prerequisites

Before studying this lecture, you should be comfortable with:
- **Event Loop & Scheduling:** How timers and microtasks drain ([Day 02: Event Loop and Scheduling](day-02-event-loop-and-scheduling.md)).
- **Process Lifecycle:** Signal handling and graceful teardown patterns ([Day 04: Process, Configuration, and Lifecycle](day-04-process-configuration-and-lifecycle.md)).
- **JavaScript Closures:** How functions retain references to outer scope variables ([JavaScript Day 08: Closures, Execution Context, and this](../../Javascript/javascript-lectures/day-08-closures-execution-context-and-this.md)).

*Upcoming Connections:*
- [Day 08: Streams and Backpressure](day-08-streams-and-backpressure.md) demonstrates how Streams inherit from `EventEmitter` to signal `'data'`, `'drain'`, and `'end'` events.
- [Day 09: Node HTTP Fundamentals](day-09-node-http-fundamentals.md) uses event-driven request and response lifecycle listeners.

---

## Quick Vocabulary Card

| Term | Definition |
| :--- | :--- |
| **`EventEmitter`** | A core Node.js class in `node:events` providing an in-memory Publish-Subscribe (Observer) mechanism for synchronous event delivery. |
| **Synchronous Emission** | The guarantee that `emitter.emit('event')` executes all registered listener callbacks synchronously one after another on the active call stack. |
| **The `'error'` Event** | A special Node.js event that, if emitted without at least one attached `'error'` listener, throws an unhandled exception and crashes the process. |
| **`errorMonitor`** | A special symbol listener (`emitter.on(events.errorMonitor, fn)`) that observes `'error'` events for diagnostics without consuming or intercepting them. |
| **`MaxListenersExceededWarning`** | A memory-leak warning emitted when more than 10 listeners (by default) are registered to a single event on an emitter. |
| **Listener Closure Leak** | A memory leak occurring when an event listener's closure retains references to large request objects, preventing V8 garbage collection. |
| **Timer Drift** | The discrepancy between scheduled timer execution times and real elapsed wall-clock time caused by event loop lag or blocking work. |
| **`AbortController`** | A standard Web API controller providing an `AbortSignal` to coordinate cooperative cancellation across asynchronous operations. |
| **`captureRejections`** | An `EventEmitter` option (`{ captureRejections: true }`) that automatically catches rejected Promises returned by `async` listeners. |

---

## 1. What is an EventEmitter? The Synchronous Execution Contract

The **`EventEmitter`** class is an in-memory implementation of the Observer pattern that allows objects to emit named events and register subscriber callbacks.

The most critical mental model to establish in Node.js is that **`emitter.emit()` is completely synchronous**. Emitting an event does **NOT** push callbacks onto the event loop, does NOT spawn background worker threads, and does NOT interleave with microtasks.

```text
[Call Stack] emitter.emit('data', payload)
      │
      ├─► Executes Listener 1 (Synchronous JS function)
      ├─► Executes Listener 2 (Synchronous JS function)
      └─► Executes Listener 3 (Synchronous JS function)
      │
[Call Stack] Next line of code after emit() runs ONLY AFTER all listeners finish!
```

### Real-World Analogy: The Intercom System vs. The Mailbox

- **An Asynchronous Queue (Mailbox):** You drop an envelope into an outgoing mailbox. You walk away, and the postal service delivers it hours later (**Message Queues / libuv Thread Pool**).
- **An EventEmitter (Intercom System):** You press the office intercom button and speak (**`emitter.emit()`**). Everyone sitting in the office with their speakers turned on hears you immediately at that exact instant. You cannot continue walking down the hallway until you release the button (**Synchronous Call Stack Execution**).

```js
// Node.js code
// Proving EventEmitter synchronous execution on the call stack

const { EventEmitter } = require("node:events");
const emitter = new EventEmitter();

emitter.on("userAction", (user) => {
  console.log(`2. Listener executed synchronously for: ${user}`);
});

console.log("1. Before emit()");

// ❌ Trap: Believing emit() defers execution to the event loop
emitter.emit("userAction", "lotus");

console.log("3. After emit() - Runs ONLY after listener completes!");

// Output:
// 1. Before emit()
// 2. Listener executed synchronously for: lotus
// 3. After emit() - Runs ONLY after listener completes!
```

---

## 2. The Special `'error'` Event & `errorMonitor`

In Node.js, the event name `'error'` has special treatment baked directly into the C++ runtime.

### 2.1 The Uncaught Crash Rule

If an `EventEmitter` emits an `'error'` event and **no listener is registered for `'error'`**, Node.js treats it as a fatal unhandled error:
1. It prints the error stack trace to `stderr`.
2. It throws an unhandled exception that bubbles up to V8.
3. Unless intercepted by `process.on('uncaughtException')`, **the entire Node.js process crashes immediately!**

```js
// Node.js code
// Demonstrating the Special 'error' Event Crash

const { EventEmitter } = require("node:events");
const emitter = new EventEmitter();

// ❌ Crash: Emitting 'error' without a listener crashes the process!
// emitter.emit("error", new Error("Database connection dropped")); 
// Fatal: Uncaught, unspecified "error" event!

// ✅ Safe Pattern: Always register at least one 'error' listener!
emitter.on("error", (err) => {
  console.error("✅ Caught emitter error safely:", err.message);
});

emitter.emit("error", new Error("Database connection dropped"));
// Logs: ✅ Caught emitter error safely: Database connection dropped
```

### 2.2 Observing Errors with `events.errorMonitor` (Node.js 13.6+)

If you want an APM logger (e.g., Datadog, Prometheus) to monitor all errors emitted by an object **without consuming or swallowing the error**, listen to the `errorMonitor` symbol:

```js
// Node.js code
const { EventEmitter, errorMonitor } = require("node:events");
const emitter = new EventEmitter();

// Diagnostic observer: Logs errors without interfering with standard error listeners
emitter.on(errorMonitor, (err) => {
  console.log("[Telemetry Monitor] Error observed:", err.message);
});

// Standard business logic error handler
emitter.on("error", (err) => {
  console.log("[Handler] Handling error gracefully:", err.message);
});

emitter.emit("error", new Error("Socket timeout"));

// Output:
// [Telemetry Monitor] Error observed: Socket timeout
// [Handler] Handling error gracefully: Socket timeout
```

---

## 3. Event Listener Memory Leaks & `MaxListenersExceededWarning`

By default, an `EventEmitter` prints a warning to `stderr` if you attach more than **10 listeners** for a single event:

```text
(node:12345) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 
11 userLogin listeners added to [EventEmitter]. Use emitter.setMaxListeners() to increase limit
```

### 3.1 The Root Cause: Per-Request Subscriptions

The warning is almost never a false positive. It occurs when developers attach listeners to a shared, long-lived emitter inside an HTTP request handler without unregistering them:

```js
// Node.js code
// ❌ CRITICAL MEMORY LEAK: Subscribing to a shared emitter per HTTP request
const http = require("node:http");
const { EventEmitter } = require("node:events");

const globalEventBus = new EventEmitter();

http.createServer((req, res) => {
  // ❌ LEAK: Every HTTP request registers a NEW listener to globalEventBus!
  // The listener closure captures 'req' and 'res', preventing V8 from ever garbage collecting them!
  globalEventBus.on("configUpdate", () => {
    res.write("Config updated");
  });

  res.end("OK");
  // After 11 requests, Node throws MaxListenersExceededWarning!
  // After 10,000 requests, the server runs out of heap memory and crashes (OOM)!
});
```

### 3.2 The Anti-Pattern: Calling `setMaxListeners(0)` or `setMaxListeners(1000)`

Never call `emitter.setMaxListeners(0)` or `emitter.setMaxListeners(1000)` to silence a memory leak warning! Increasing the limit does not fix the leak; it merely blinds your monitoring until the server crashes in production with an Out-Of-Memory failure.

---

## 4. Listener Identity & Safe Cleanup (`on`, `once`, `off`)

To remove a listener using `emitter.off(event, listener)` or `emitter.removeListener(event, listener)`, you **must pass the exact same function reference** that was originally registered.

```js
// Node.js code
// Demonstrating Listener Identity Traps

const { EventEmitter } = require("node:events");
const emitter = new EventEmitter();

// ❌ Trap: Passing an inline arrow function makes removal impossible!
emitter.on("data", () => console.log("Received"));
emitter.off("data", () => console.log("Received")); // DOES NOTHING! Different function reference!
console.log("Listener count:", emitter.listenerCount("data")); // Still 1!

// ✅ Correct Pattern: Retain named function references
function onDataReceived(payload) {
  console.log("Processed:", payload);
}

emitter.on("data", onDataReceived);
emitter.off("data", onDataReceived); // Successfully removed!
console.log("Listener count after off():", emitter.listenerCount("data")); // 0
```

### 4.1 Auto-Cleaning with `emitter.once()`

`emitter.once(event, fn)` registers a listener that is invoked at most once, after which Node automatically unregisters it from the internal listener array.

```js
// Node.js code
emitter.once("connect", () => {
  console.log("Connected! This listener will self-destruct.");
});
```

### 4.2 Modern Async Iteration via `events.on()` (Node.js 12.16+)

Instead of managing callbacks and manual `off()` calls, you can consume events sequentially as an asynchronous stream using `events.on()`:

```js
// Node.js code
// Consuming events cleanly with for await...of
const { on } = require("node:events");

async function processEventStream(emitter, signal) {
  try {
    // Automatically handles registration and teardown when the loop exits!
    for await (const [message] of on(emitter, "message", { signal })) {
      console.log("Received message:", message);
      if (message === "STOP") break;
    }
  } catch (err) {
    if (err.name === "AbortError") {
      console.log("Stream safely aborted by signal.");
    } else {
      throw err;
    }
  }
}
```

---

## 5. Timers: Drift, Overlapping Execution, and Cleanup

Timers (`setTimeout`, `setInterval`) are resources managed by libuv's min-heap. Like event listeners, unmanaged timers cause severe memory leaks and process hanging.

### 5.1 The `setInterval()` Concurrency Pileup Bug

When an asynchronous task is scheduled with `setInterval(fn, 1000)`, Node queues the callback every 1,000 milliseconds **regardless of whether the previous execution has finished**.

If a database query inside the interval takes 2,500ms due to database load:
1. Tick 1 runs at $t=1000\text{ms}$ (Query finishes at $t=3500\text{ms}$).
2. Tick 2 triggers at $t=2000\text{ms}$ while Tick 1 is still querying!
3. Tick 3 triggers at $t=3000\text{ms}$ while Ticks 1 and 2 are still querying!

This creates an **unbounded concurrency cascade**: the database gets slower, more intervals pile up concurrently, and the server crashes.

```text
Timeline with setInterval(fn, 1000) when task takes 2500ms:
t=1000ms: [Task 1 Started..............................]
t=2000ms:        [Task 2 Started..............................]
t=3000ms:               [Task 3 Started..............................]
❌ Multiple database queries run in parallel, overwhelming the server!
```

### 5.2 The Solution: Self-Scheduling `setTimeout()`

To guarantee that tasks never overlap, use a recursive, self-scheduling `setTimeout()`. The next timer is scheduled **only after the previous asynchronous operation completes**:

```js
// Node.js code
// ✅ Safe Pattern: Self-scheduling setTimeout prevents overlapping executions

let isRunning = true;

async function executePeriodicTask() {
  if (!isRunning) return;

  const startTime = Date.now();
  try {
    console.log("-> Starting asynchronous maintenance task...");
    // Simulate long-running async operation (e.g., syncing data)
    await new Promise((resolve) => setTimeout(resolve, 2500));
    console.log("-> Maintenance task finished.");
  } catch (err) {
    console.error("Task error:", err);
  } finally {
    // Schedule NEXT iteration only after the current one has completely finished!
    if (isRunning) {
      setTimeout(executePeriodicTask, 1000);
    }
  }
}

executePeriodicTask();
```

---

## 6. Resource Cancellation via `AbortController`

An **`AbortController`** is a standardized Web API object that allows you to broadcast a cancellation signal to asynchronous operations, timers, and event listeners simultaneously.

### Canceling Timers, Streams, and Emitters Together

```js
// Node.js code
// Demonstrating Unified Resource Cancellation via AbortSignal

const { setTimeout: sleep } = require("node:timers/promises");

async function performTaskWithTimeout() {
  const ac = new AbortController();
  const { signal } = ac;

  // Set hard 2-second timeout
  const timeoutId = setTimeout(() => {
    console.log("⏰ Operation timed out! Aborting...");
    ac.abort(new Error("TimeoutExceeded"));
  }, 2000);

  try {
    console.log("Starting slow operation (takes 5s)...");
    // timers/promises natively accepts { signal }
    await sleep(5000, null, { signal });
    console.log("Operation finished successfully.");
  } catch (err) {
    if (signal.aborted) {
      console.log("❌ Operation aborted cleanly:", signal.reason.message);
    } else {
      throw err;
    }
  } finally {
    clearTimeout(timeoutId); // Clean up the abort timer
  }
}

performTaskWithTimeout();
```

---

## 7. The Async Listener Trap & `captureRejections`

Many developers write `async` event listeners:

```js
// Node.js code
// ❌ CRITICAL TRAP: EventEmitter does not await async listeners!
emitter.on("save", async (data) => {
  await database.save(data); // If this throws an error...
  // UNHANDLED PROMISE REJECTION!
  // EventEmitter has no mechanism to catch errors thrown inside un-awaited Promises!
});

emitter.emit("save", { id: 1 });
```

Because `emit()` is synchronous, it calls the `async` listener, receives a pending `Promise`, and **immediately ignores it**. If the Promise rejects, the rejection bubbles up as an unhandled promise rejection!

### The Solution: Enable `captureRejections: true` (Node.js 14+)

When you create an emitter with `{ captureRejections: true }`, Node automatically catches any rejected Promise returned by an `async` listener and forwards it to the emitter's `'error'` handler:

```js
// Node.js code
// ✅ Safe Async Listeners via captureRejections: true

const { EventEmitter } = require("node:events");

const emitter = new EventEmitter({ captureRejections: true });

// Async listener that fails
emitter.on("processData", async () => {
  throw new Error("Failed to process payment in async listener!");
});

// Any rejected Promise in any async listener is automatically caught here!
emitter.on("error", (err) => {
  console.log("✅ Emitter cleanly caught async rejection:", err.message);
});

emitter.emit("processData");

// Output:
// ✅ Emitter cleanly caught async rejection: Failed to process payment in async listener!
```

---

## 8. JavaScript, Node.js, and DSA Connections

- **JavaScript Language Connection:** `EventEmitter` relies fundamentally on JavaScript function closures. When a listener references variables in its parent scope, V8 retains that entire lexical environment in memory until the listener is removed.
- **Node.js Platform Connection:** Node's core I/O abstractions (`Stream`, `Server`, `Socket`, `process`) all inherit from `EventEmitter`. Node optimizes small emitters by storing listeners as a raw function pointer if there is only 1 listener, and upgrading to an array of functions only when $\ge 2$ listeners exist.
- **DSA Connection:**
  - **Observer Pattern:** The emitter maintains a lookup table (dictionary/map) keyed by event string, where each value is an array of callback function pointers.
  - **Memory Graph Retain Trees:** Leaked listeners create retain edges in V8's heap graph. An orphaned listener attached to a root object retains all captured closures, preventing garbage collection across hundreds of parent scopes.

---

## Tricky Points

### 1. `emitter.emit()` Order is Strictly Sequential
If Listener 1 contains a blocking while-loop or synchronous crypto call, Listener 2 will **never run** until Listener 1 unblocks the thread!

### 2. Modifying Listeners During an `emit()` Loop
If a listener removes itself or another listener while an `emit()` loop is running, Node makes a temporary copy of the listener array before dispatching. The removal takes effect **after** the current emission finishes.

### 3. `events.once()` Returns an Array
When using `events.once(emitter, 'data')` as a Promise, the promise resolves to an **array of arguments** passed to `emit()`, not a single scalar value:

```js
// Node.js code
const { once, EventEmitter } = require("node:events");
const emitter = new EventEmitter();

setTimeout(() => emitter.emit("greet", "Hello", "World"), 10);

async function test() {
  const [first, second] = await once(emitter, "greet");
  console.log(first, second); // "Hello World"
}
test();
```

---

## Hands-On Exercise

### Scenario: Fixing a Critical Memory Leak in an HTTP SSE Event Stream
Your team maintains a Server-Sent Events (SSE) notification service. Whenever users open the notifications page, the server subscribes their socket to a shared `notificationHub` emitter. Under production load, the server logs hundreds of `MaxListenersExceededWarning` alerts and crashes with Out-Of-Memory errors after several hours because client disconnects fail to unregister listeners.

### Buggy Code

```js
// Node.js code
// BUGGY: Memory leak on client disconnect + overlapping interval drift

const http = require("node:http");
const { EventEmitter } = require("node:events");

const notificationHub = new EventEmitter();

// Simulate periodic background notification generation
setInterval(() => {
  notificationHub.emit("notification", { time: Date.now(), msg: "Ping" });
}, 1000);

const server = http.createServer((req, res) => {
  if (req.url === "/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // ❌ BUG: Subscribes an inline arrow function to notificationHub!
    // When the user closes the browser tab, this listener is NEVER removed!
    notificationHub.on("notification", (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    });

    // ❌ BUG: Does not listen for 'close' or cleanup the subscription!
  } else {
    res.writeHead(404).end();
  }
});

server.listen(3000);
```

### Acceptance Criteria
1. When a client opens `/events`, stream notifications cleanly.
2. When the client disconnects or closes their tab (`req.on('close')`), **immediately remove the exact listener** from `notificationHub`.
3. Verify that `notificationHub.listenerCount('notification')` drops back to 0 when all clients disconnect.
4. Convert the background interval to a drift-free, non-overlapping timer with clean shutdown support.
5. Handle potential socket write errors gracefully without crashing the process.

### Solution Code

```js
// Node.js code
// SOLUTION: Robust SSE Controller with guaranteed listener teardown

const http = require("node:http");
const { EventEmitter } = require("node:events");

const notificationHub = new EventEmitter({ captureRejections: true });
notificationHub.on("error", (err) => console.error("Hub error:", err));

// 1. Safe Non-Overlapping Notification Generator
let isGenerating = true;

async function generateNotifications() {
  while (isGenerating) {
    try {
      notificationHub.emit("notification", {
        timestamp: new Date().toISOString(),
        message: "System Heartbeat Event",
      });
    } catch (err) {
      console.error("Emission failure:", err);
    }
    // Wait 1 second before next tick
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
generateNotifications();

// 2. HTTP Server with Guaranteed Listener Cleanup
const server = http.createServer((req, res) => {
  if (req.url === "/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Dedicated listener function with identity
    function onNotification(eventData) {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(eventData)}\n\n`);
      }
    }

    // Subscribe to notification hub
    notificationHub.on("notification", onNotification);
    console.log(`[Connect] Client connected. Active listeners: ${notificationHub.listenerCount("notification")}`);

    // ✅ Clean Teardown: Intercept client connection close event
    req.on("close", () => {
      // Remove the exact listener reference immediately!
      notificationHub.off("notification", onNotification);
      console.log(`[Disconnect] Client disconnected. Active listeners: ${notificationHub.listenerCount("notification")}`);
    });

    req.on("error", (err) => {
      console.error("Client socket error:", err.message);
      notificationHub.off("notification", onNotification);
    });
  } else {
    res.writeHead(404).end("Not Found");
  }
});

server.listen(3000, () => {
  console.log("SSE Server listening on http://localhost:3000");
});
```

### Solution Explanation

1. **Listener Identity:** Rather than using an anonymous arrow function, `onNotification` is declared as a named function reference in scope. This enables `notificationHub.off('notification', onNotification)` to locate and remove the exact listener.
2. **Connection Lifecycle Hook (`req.on('close')`):** When the browser tab closes or the network drops, the HTTP transport fires the `'close'` event. The handler immediately unregisters the listener, breaking the retain edge and allowing V8 to garbage collect the request and response objects.
3. **Safe Timer Execution:** The background heartbeat loop uses an asynchronous while loop with `await new Promise(...)`, guaranteeing zero overlap and predictable execution.

---

## Summary

- `EventEmitter.emit()` executes all subscriber listeners synchronously on the active V8 call stack. It is not an asynchronous queue.
- If an `'error'` event is emitted without an attached `'error'` listener, Node treats it as an unhandled exception and crashes the process.
- `MaxListenersExceededWarning` alerts developers to listener memory leaks. Never silence it with `setMaxListeners(0)`; always identify and remove leaked subscriptions.
- To remove a listener with `emitter.off()`, you must pass the **exact same function reference** used during registration.
- Avoid `setInterval()` for asynchronous operations because long tasks cause unbounded concurrency pileups; prefer self-scheduling `setTimeout()` loops.
- Use `AbortController` and `AbortSignal` to coordinate cooperative cancellation across timers, streams, and event listeners.
- Enable `{ captureRejections: true }` on emitters when using `async` listeners to automatically catch and forward rejected Promises to `'error'`.

---

## Cheat Sheet

### Event & Timer APIs at a Glance

| API | Responsibility | Primary Use Case |
| :--- | :--- | :--- |
| `emitter.on(event, fn)` | Registers persistent event listener | Subscribing to repeated notifications |
| `emitter.once(event, fn)` | Registers single-use self-removing listener | Waiting for one-time initialization |
| `emitter.off(event, fn)` | Removes listener by function reference | Preventing memory leaks during cleanup |
| `emitter.on(errorMonitor, fn)` | Observes errors without consuming them | APM metrics, diagnostic logging |
| `new EventEmitter({ captureRejections: true })` | Forwards async listener rejections to `'error'` | Safe async event listeners |
| `events.on(emitter, event, { signal })` | Returns an async iterable of events | Clean `for await...of` event streaming |
| `AbortController` | Coordinates cross-resource cancellation | Canceling timers, fetches, and listeners |

### Common Pitfalls
- **Assuming `emit()` is asynchronous:** Calling slow or blocking code in a listener stalls the entire application.
- **Forgetting an `'error'` listener:** Emitting `'error'` crashes the Node process if unhandled.
- **Registering anonymous listeners per request:** Leaks listeners and retains HTTP contexts in memory.
- **Using `setInterval()` for async operations:** Causes overlapping task executions during database lag.
- **Using `async` listeners without `captureRejections`:** Produces unhandled promise rejection crashes.

---

## Interview Questions

### 1. Is `EventEmitter.emit()` synchronous or asynchronous, and why does this matter?
**Question:** Explain the execution model of `EventEmitter.emit()`. How does it interact with V8's call stack, microtasks, and the libuv event loop?

**Answer:**
`EventEmitter.emit()` is **completely synchronous**:
1. When `emitter.emit('event', arg)` is called, Node immediately iterates through its internal array of registered listener functions and invokes them sequentially one after another on the active V8 call stack.
2. The code line immediately following `emitter.emit()` **will not execute** until every single listener function has run to completion.
3. It does not create microtasks, does not schedule timers, and does not yield to libuv's event loop phases.

**Why this matters in production:**
- **Performance:** If one listener executes expensive synchronous work (e.g., synchronous JSON parsing, cryptographic hashing, or a blocking while-loop), all subsequent listeners and the calling code are blocked, stalling the main JavaScript thread.
- **Error Handling:** Any synchronous exception thrown inside a listener immediately unwinds the call stack of the emitter, aborting remaining listeners unless wrapped in `try/catch`.
- **Re-entrancy:** If a listener calls `emit()` on the same event, it creates synchronous recursion that can trigger a `RangeError: Maximum call stack size exceeded`.

---

### 2. Predict the Output: `EventEmitter` Execution Order and Exceptions
**Question:** What will the following code output, and why? Explain what happens when Listener 2 throws an error:

```js
// Node.js code
const { EventEmitter } = require("node:events");
const emitter = new EventEmitter();

emitter.on("data", (val) => {
  console.log("1. Listener A:", val);
});

emitter.on("data", (val) => {
  console.log("2. Listener B:", val);
  throw new Error("Boom in B");
});

emitter.on("data", (val) => {
  console.log("3. Listener C:", val);
});

try {
  console.log("Start emit");
  emitter.emit("data", 42);
  console.log("End emit");
} catch (err) {
  console.log("Caught:", err.message);
}
```

**Answer:**
**Execution Output:**
```text
Start emit
1. Listener A: 42
2. Listener B: 42
Caught: Boom in B
```

**Reasoning:**
1. `console.log("Start emit")` executes synchronously.
2. `emitter.emit("data", 42)` is called. Node synchronously invokes Listener A, which prints `1. Listener A: 42`.
3. Node synchronously invokes Listener B, which prints `2. Listener B: 42` and then throws `new Error("Boom in B")`.
4. Because the call stack unwinds immediately upon an unhandled exception, **Listener C is NEVER executed**, and `console.log("End emit")` is skipped.
5. The outer `try/catch` block intercepts the exception thrown by Listener B, printing `Caught: Boom in B`.

---

### 3. Diagnosing and Fixing `MaxListenersExceededWarning` in Production
**Question:** A production Node.js service emits `MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 listeners added`. How do you systematically trace the source of the leak, and why is `emitter.setMaxListeners(0)` considered a dangerous anti-pattern?

**Answer:**
**Systematic Tracing Steps:**
1. **Enable Full Stack Tracing:** Run Node with the `--trace-warnings` flag:
   ```bash
   node --trace-warnings server.js
   ```
   This prints the exact file and line number where the 11th listener was registered.
2. **Inspect Listener Array:** Inspect `emitter.rawListeners('eventName')` or `emitter.listenerCount('eventName')` to check what functions are being registered.
3. **Check Request Scope:** Verify whether `emitter.on()` is being called inside an Express middleware, HTTP route handler, or socket connection handler without a corresponding `req.on('close', () => emitter.off(...))` cleanup hook.

**Why `setMaxListeners(0)` is an Anti-Pattern:**
`setMaxListeners(0)` does not fix or prevent the leak—it merely disables the safety warning. The underlying problem is that every registered listener holds an in-memory closure reference to its surrounding scope (including HTTP `req`, `res`, and headers). Silencing the warning allows thousands of orphaned closures to accumulate silently in V8's heap until the server crashes with a fatal Out-Of-Memory (`JavaScript heap out of memory`) error.

---

### 4. Architectural Tradeoff: `setInterval()` vs. Self-Scheduling `setTimeout()`
**Question:** Compare the architectural tradeoffs of scheduling recurring background maintenance tasks using `setInterval()` versus self-scheduling `setTimeout()` in an event-driven Node.js backend.

**Answer:**

| Feature | `setInterval(fn, ms)` | Self-Scheduling `setTimeout(fn, ms)` |
| :--- | :--- | :--- |
| **Execution Timing** | Triggers rigidly every `ms`, independent of async completion. | Schedules next execution only **after** async task finishes. |
| **Concurrency Risk** | **High**. If task duration $> ms$, tasks overlap and pile up. | **Zero**. Guarantees strictly sequential, non-overlapping executions. |
| **Timer Drift** | Suffers from cumulative event loop lag and drift. | Drift is isolated to individual pauses between executions. |
| **Error Handling** | If an unhandled error throws, interval continues firing blindly. | Errors can be cleanly caught in `finally` before rescheduling. |

**Decision Rule:**
- **Never use `setInterval()` for asynchronous tasks** (tasks that involve database queries, network HTTP calls, or file I/O). If the external dependency experiences latency spikes, `setInterval` will spawn hundreds of overlapping operations, overwhelming the database and crashing the server.
- **Always use self-scheduling `setTimeout()`** for asynchronous background maintenance, ensuring the next run is queued only after the previous run completes cleanly.

---

<nav aria-label="Lecture navigation">

[← Previous: Buffers, Encodings, and Serialization](day-06-buffers-encodings-and-serialization.md) | [Roadmap](../node-roadmap.md) | [Next: Streams and Backpressure](day-08-streams-and-backpressure.md)

</nav>