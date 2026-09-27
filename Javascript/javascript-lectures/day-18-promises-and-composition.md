# Day 18: Promises and Promise Composition

<nav aria-label="Lecture navigation">

[← Previous Day: Day 17 - Modules and Module Interoperability](day-17-modules-and-interoperability.md) | [Roadmap](../javascript-roadmap.md) | [Next Day: Day 19 - `async`/`await` and Asynchronous Error Propagation →](day-19-async-await-errors-and-cleanup.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Deconstruct a `Promise` into its three lifecycle states (`pending`, `fulfilled`, `rejected`) and enforce settlement immutability.
- Trace the internal mechanics of `.then()`, `.catch()`, and `.finally()` chaining and value unwrapping.
- Implement and explain the ECMAScript Promise Resolution Procedure (`[[Resolve]]`) regarding thenable adoption and flattening.
- Compare the four core promise combinators: `Promise.all()`, `Promise.allSettled()`, `Promise.race()`, and `Promise.any()`.
- Distinguish between sequential execution, unconstrained concurrency, and bounded concurrency in high-throughput Node.js services.
- Architect robust resource cleanup and cooperative cancellation using `AbortController` alongside promise chains.
- Debug unhandled rejections, silent promise dropouts, and executor execution ordering traps.

---

## Vocabulary Card

| Term | Plain Definition | Everyday Analogy |
| :--- | :--- | :--- |
| **Promise** | An object representing the eventual completion (or failure) of an asynchronous operation and its resulting value. | A restaurant buzzer given to you while waiting for a table; it blinks when the table is ready or buzzes red if the kitchen closed. |
| **Settled** | The permanent terminal state of a promise, which has transitioned to either `fulfilled` or `rejected`. | A sealed court verdict that cannot be reopened, renegotiated, or modified. |
| **Executor Function** | The callback `(resolve, reject) => {}` passed to `new Promise(...)`, which executes **synchronously** immediately upon creation. | The ignition sequence that fires up the engine the instant you turn the car key. |
| **Thenable** | Any object or function that defines a callable `.then()` method conforming to the Promises/A+ protocol. | A universal foreign electrical adapter that allows third-party plugs to fit into standard wall outlets. |
| **Promise Combinator** | A static utility (`all`, `allSettled`, `race`, `any`) that accepts an iterable of promises and aggregates their outcomes into a single unified promise. | A relay team coach judging whether all runners finished, who crossed the line first, or if at least one runner won. |
| **Bounded Concurrency** | An execution pattern that constrains the maximum number of active asynchronous operations running simultaneously to a fixed limit $N$. | A nightclub bouncer admitting new guests only when earlier guests exit to prevent exceeding room capacity. |

---

## Core Concepts

### 1. The Promise Lifecycle and Settlement Immutability

A Promise is a state machine with three mutually exclusive states:
1. `pending`: Initial state; neither fulfilled nor rejected.
2. `fulfilled`: Operation completed successfully with a resulting `value`.
3. `rejected`: Operation failed with an associated `reason` (typically an `Error`).

Settlement is **irreversible**. Once a promise transitions from `pending` to `fulfilled` or `rejected`, all subsequent calls to `resolve()` or `reject()` are silently ignored.

```javascript
// Node.js code
// ✅ DO: Settle a promise once
const paymentPromise = new Promise((resolve, reject) => {
  resolve({ txId: "tx_001", status: "success" });
  
  // ❌ Ignored: Further calls do not alter the settled value or state
  resolve({ txId: "tx_999", status: "duplicate" });
  reject(new Error("Network glitch"));
});

paymentPromise.then((data) => console.log("Result:", data.txId));
// Output: "Result: tx_001"
```

**Synchronous Executor Trap:** The function passed into `new Promise((resolve, reject) => { ... })` executes **synchronously and immediately** upon instantiation. Only the `.then()` / `.catch()` callbacks are deferred to the microtask queue.

### 2. Chaining Mechanics and Value Transformation

Calling `.then()`, `.catch()`, or `.finally()` returns a **brand-new Promise**.
- Returning a plain value from `.then()` fulfills the downstream promise with that value.
- Throwing an exception (`throw new Error()`) rejects the downstream promise.
- Returning a Promise (or thenable) causes the downstream promise to adopt the returned promise's eventual state and value.

```javascript
// Node.js code
Promise.resolve(10)
  .then((val) => {
    console.log("Step 1:", val); // 10
    return val * 2; // Fulfills downstream with 20
  })
  .then((val) => {
    console.log("Step 2:", val); // 20
    throw new Error("Calculation failed"); // Rejects downstream
  })
  .catch((err) => {
    console.log("Recovered from:", err.message); // Recovers from error!
    return 100; // Fulfills downstream with recovery value
  })
  .then((val) => {
    console.log("Step 4:", val); // 100
  });
```

### 3. The `finally()` Trap

The `.finally(callback)` handler runs regardless of whether the promise fulfilled or rejected. It is intended purely for side-effect cleanup (e.g., closing file handles, resetting UI spinners).
- Values returned from `finally()` are **ignored**; the upstream value passes through.
- However, if `finally()` throws an error or returns a rejected promise, the chain is rejected with the new reason, superseding any prior fulfillment.

```javascript
// Node.js code
Promise.resolve("user_data")
  .finally(() => {
    console.log("[CLEANUP] Releasing connection lock");
    return "ignored_return_value"; // Has NO effect on the chain
  })
  .then((val) => console.log("Received:", val));
// Output:
// [CLEANUP] Releasing connection lock
// Received: user_data
```

### 4. Thenables and the Promise Resolution Procedure

If an object has a callable `then` property, the JavaScript engine treats it as a "thenable" and automatically adopts its state via the ECMAScript Promise Resolution Procedure (`[[Resolve]]`).

```javascript
// Node.js code
const customThenable = {
  then(resolvePromise, rejectPromise) {
    // Allows bridging custom async libraries or legacy callback wrappers
    setTimeout(() => resolvePromise("Adopted from custom thenable!"), 50);
  },
};

Promise.resolve(customThenable).then((msg) => console.log(msg));
// Output: "Adopted from custom thenable!"
```

### 5. Promise Combinators: The Core Four

JavaScript provides four static combinators to manage multiple concurrent promises:

```javascript
// Node.js code
const p1 = Promise.resolve("Service A");
const p2 = Promise.reject(new Error("Service B Failed"));
const p3 = Promise.resolve("Service C");

// 1. Promise.all: Fulfills when ALL fulfill; rejects IMMEDIATELY when ANY rejects (Fast-fail)
Promise.all([p1, p3]).then(console.log); // ['Service A', 'Service C']

// 2. Promise.allSettled: Never rejects. Returns array of outcome objects:
// [{ status: 'fulfilled', value }, { status: 'rejected', reason }]
Promise.allSettled([p1, p2]).then((results) => {
  console.log("Settled count:", results.length);
});

// 3. Promise.race: Settles with the fate of the FIRST promise to settle (fulfill OR reject)
Promise.race([p1, p2]).then(console.log); // "Service A"

// 4. Promise.any: Fulfills with the FIRST FULFILLED promise.
// Rejects with AggregateError ONLY if ALL inputs reject.
Promise.any([p2, p3]).then((fastestSuccess) => {
  console.log("Fastest success:", fastestSuccess); // "Service C"
});
```

---

## Detailed Explanations and Traces

### Trace 1: The Missing `return` Disaster

One of the most frequent async production defects is failing to return a promise from inside a `.then()` handler:

```javascript
// Node.js code
// ❌ DEFECTIVE CODE:
function fetchUserRecord(userId) {
  return Promise.resolve({ id: userId, name: "Alice" })
    .then((user) => {
      // Async database write started, but NOT returned!
      Promise.resolve().then(() => {
        user.saved = true;
      });
      // Missing return statement here!
    });
}

fetchUserRecord(1).then((result) => {
  console.log("Returned result:", result);
});
```

```
Execution Trace:
1. `fetchUserRecord(1)` executes. Outer promise resolves with `{ id: 1, name: 'Alice' }`.
2. First `.then()` callback runs with `user`.
3. An inner asynchronous operation is spawned.
4. Because the callback lacks an explicit `return`, JavaScript defaults to returning `undefined`.
5. The promise returned by `fetchUserRecord` fulfills immediately with `undefined`.
6. Caller's `.then()` receives `undefined` instead of the user object!
7. The inner async write finishes later in an unmonitored detached state (fire-and-forget).
```

---

### Trace 2: `Promise.all` Rejection vs. Task Cancellation

A critical misconception is that `Promise.all` stops or cancels running tasks when one rejects.

```javascript
// Node.js code
let counter = 0;

function longRunningTask(id, ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      counter++;
      console.log(`Task ${id} completed in background`);
      resolve(id);
    }, ms);
  });
}

function failingTask() {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Fatal Crash")), 50);
  });
}

Promise.all([
  longRunningTask("Task-1", 100),
  failingTask(), // Rejects at 50ms
  longRunningTask("Task-2", 200),
]).catch((err) => {
  console.log("Promise.all rejected at 50ms with:", err.message);
});
```

```
Timeline:
  0ms: All three tasks are initiated concurrently.
 50ms: failingTask rejects.
       -> Promise.all immediately rejects and fires the .catch() handler.
100ms: Task-1 finishes executing its timer, increments counter, and logs to console.
200ms: Task-2 finishes executing its timer, increments counter, and logs to console.
```

**Key Takeaway:** `Promise.all` abandons waiting for remaining results, but the background operations **continue running to completion**, consuming network sockets, database connections, and CPU time. True cancellation requires explicit cooperative signaling (e.g. `AbortSignal`).

---

## Code Examples

### 1. Production Bounded Concurrency Worker Pool

When processing thousands of API requests, unconstrained `Promise.all(tasks.map(fn))` exhausts system file descriptors and crashes backends with `ECONNRESET` or `EMFILE`. A bounded worker pool limits concurrent in-flight promises:

```javascript
// Node.js code
async function mapWithConcurrency(items, concurrencyLimit, asyncWorkerFn) {
  if (!Number.isInteger(concurrencyLimit) || concurrencyLimit < 1) {
    throw new RangeError("concurrencyLimit must be a positive integer");
  }

  const results = new Array(items.length);
  let nextItemIndex = 0;

  async function poolWorker() {
    while (nextItemIndex < items.length) {
      const currentIndex = nextItemIndex++;
      // Execute task and preserve exact input-to-output array indexing
      results[currentIndex] = await asyncWorkerFn(items[currentIndex], currentIndex);
    }
  }

  // Spawn exactly 'concurrencyLimit' long-lived worker loops
  const workerThreads = Array.from(
    { length: Math.min(concurrencyLimit, items.length) },
    () => poolWorker()
  );

  await Promise.all(workerThreads);
  return results;
}

// Verification:
const taskIds = [1, 2, 3, 4, 5, 6];
const start = Date.now();

mapWithConcurrency(taskIds, 2, async (id) => {
  await new Promise((r) => setTimeout(r, 50));
  return `Processed-${id}`;
}).then((res) => {
  console.log("Processed Results:", res);
  console.log("Completed in approx ~150ms with limit 2");
});
```

### 2. Timeout and Cooperative Cancellation via `AbortController`

Wrapping `Promise.race` with an `AbortSignal` ensures that when a timeout triggers, downstream HTTP or I/O calls abort immediately:

```javascript
// Node.js code
async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const { signal } = controller;

  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Operation timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  try {
    // Pass signal to native fetch or any cancelable operation
    const response = await fetch(url, { signal });
    return await response.json();
  } finally {
    clearTimeout(timeoutId); // Prevent timer leak on fast fulfillment
  }
}
```

---

## Tricky Points and Gotchas

### 1. Two-Argument `.then(onFulfilled, onRejected)` Trap

Passing an error handler as the second argument to `.then()` catches errors from *previous* steps in the chain, but **cannot catch an error thrown inside the current step's `onFulfilled` callback**!

```javascript
// Node.js code
// ❌ DANGEROUS: If onFulfilled throws, onRejected CANNOT catch it!
Promise.resolve("data").then(
  (data) => {
    throw new Error("Bug inside fulfillment handler!");
  },
  (err) => {
    console.log("Caught:", err.message); // NEVER RUNS! Leads to UnhandledPromiseRejection
  }
);

// ✅ SAFE: Use chained .catch() to protect both stages
Promise.resolve("data")
  .then((data) => {
    throw new Error("Bug inside fulfillment handler!");
  })
  .catch((err) => {
    console.log("Safely caught by .catch():", err.message);
  });
```

### 2. `Promise.race([])` vs. `Promise.all([])` on Empty Iterables

An empty array passed to combinators exhibits dramatically different edge-case behavior:
- `Promise.all([])`: Fulfills **immediately and synchronously** with an empty array `[]`.
- `Promise.allSettled([])`: Fulfills **immediately** with an empty array `[]`.
- `Promise.any([])`: Rejects **immediately** with `AggregateError: All promises were rejected`.
- `Promise.race([])`: **Remains `pending` forever!** Because there are no elements to settle first, the returned promise never transitions.

### 3. Multiple Promise Listeners are NOT Event Emitters

Attaching multiple `.then()` handlers to a single promise does not execute an EventEmitter pipeline. All registered `.then()` callbacks receive the identical settled value in insertion order during the subsequent microtask drain.

---

## Hands-on Exercise: Building a Resilient Multi-Service Aggregator

### Problem Statement

You are building an aggregation endpoint for a financial portal that queries three pricing services (`alpha`, `beta`, `gamma`). You need to:
1. Accept an array of service fetchers.
2. Query them with a strict 150ms timeout.
3. Return the fastest successful quote.
4. If all fail or time out, return a fallback cached quote.

### Buggy Implementation

```javascript
// Node.js code
// ❌ BUGS:
// 1. Uses Promise.race() instead of Promise.any(), rejecting if the fastest service fails!
// 2. Leaks timeout timers.
// 3. Does not cancel pending network requests on timeout.
function getFastestQuote(serviceFetchers, fallbackQuote) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), 150)
  );

  return Promise.race([...serviceFetchers.map((fn) => fn()), timeoutPromise])
    .catch(() => fallbackQuote);
}
```

### Edge Cases to Address

1. If Service Alpha fails in 10ms, but Service Beta succeeds in 30ms, `Promise.race()` fails prematurely. We need "fastest fulfillment" (`Promise.any`).
2. Timers must be cleared to prevent keeping the Node.js event loop alive unnecessarily.
3. When `Promise.any` rejects with `AggregateError`, gracefully fall back to default cache.

### Verified Solution

```javascript
// Node.js code
async function getFastestQuoteResilient(fetchers, fallbackQuote, timeoutMs = 150) {
  const controller = new AbortController();
  let timerId;

  // 1. Create a timeout promise tied to the abort controller
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      controller.abort(new Error(`All quotes timed out after ${timeoutMs}ms`));
      reject(new Error("Timeout"));
    }, timeoutMs);
  });

  // 2. Invoke fetchers passing the cancellation signal
  const fetchPromises = fetchers.map((fetchFn) => fetchFn(controller.signal));

  try {
    // 3. Race the fastest successful quote against the overall timeout
    const result = await Promise.race([
      Promise.any(fetchPromises),
      timeoutPromise,
    ]);
    return result;
  } catch (error) {
    console.warn(`[WARN] All quote sources failed or timed out: ${error.message}. Returning fallback.`);
    return fallbackQuote;
  } finally {
    clearTimeout(timerId); // Always clean up pending timer handles
  }
}

// Verification:
const fastFailingService = () => new Promise((_, r) => setTimeout(() => r(new Error("500 Internal")), 20));
const slowSuccessService = () => new Promise((r) => setTimeout(() => r({ source: "beta", price: 104.5 }), 80));
const timeoutService = () => new Promise((r) => setTimeout(() => r({ source: "gamma", price: 105.0 }), 300));

getFastestQuoteResilient([fastFailingService, slowSuccessService, timeoutService], { source: "cache", price: 100.0 })
  .then((quote) => {
    console.log("Selected Quote:", quote);
    // Correctly ignores 20ms failure and selects 80ms success: { source: 'beta', price: 104.5 }
  });
```

---

## Summary

- Promises have three states: `pending`, `fulfilled`, and `rejected`. Settlement is immutable.
- The executor function passed to `new Promise(...)` runs synchronously upon construction.
- Each call to `.then()`, `.catch()`, or `.finally()` returns a new promise adopting the return value or thrown error of its callback.
- Objects implementing a callable `.then()` property are thenables and are automatically adopted via the Promise Resolution Procedure.
- `Promise.all` fails fast on the first rejection; `Promise.allSettled` waits for all outcomes; `Promise.race` adopts the first settled state; `Promise.any` adopts the first fulfilled state.
- Combinators do not cancel ongoing asynchronous operations when resolving or rejecting early.
- High-throughput backends must apply bounded concurrency limits to avoid exhausting memory, sockets, or thread pool resources.

---

## Cheat Sheet

### Combinator Decision Matrix

| Combinator | Primary Goal | Fulfills When | Rejects When | On Empty Input `[]` |
| :--- | :--- | :--- | :--- | :--- |
| **`Promise.all`** | "All must succeed" | **All** inputs fulfill | **Any** input rejects (Fast-fail) | Fulfills with `[]` immediately |
| **`Promise.allSettled`** | "Report all outcomes" | **All** inputs settle | **Never** rejects | Fulfills with `[]` immediately |
| **`Promise.race`** | "Fastest response wins" | **First** input fulfills | **First** input rejects | **Hangs pending forever!** |
| **`Promise.any`** | "Fastest success wins" | **First** input fulfills | **All** inputs reject (`AggregateError`) | Rejects with `AggregateError` |

### Chaining Return Behaviors

| Action in Callback | Downstream Promise State | Downstream Value |
| :--- | :--- | :--- |
| `return value;` | Fulfilled | `value` |
| `return promise;` | Adopts state of `promise` | Eventual value of `promise` |
| `throw new Error();` | Rejected | Thrown `Error` instance |
| `return undefined;` (or no return) | Fulfilled | `undefined` |

---

## Interview Questions & Deep Dives

### 1. What is the fundamental difference between `.then(onFulfilled, onRejected)` and `.then(onFulfilled).catch(onRejected)`?

**Question:** Why is chaining `.catch(onRejected)` considered standard best practice over supplying two arguments directly to `.then(onFulfilled, onRejected)`?

**Answer:**
In `.then(onFulfilled, onRejected)`, both callbacks belong to the **same invocation step**. If the promise upstream rejects, `onRejected` executes. However, if the promise upstream fulfills, `onFulfilled` executes. If `onFulfilled` throws an exception or returns a rejected promise, the sibling `onRejected` callback **cannot catch it** because it only listens to the previous link in the chain. The error bypasses `onRejected` and becomes an unhandled promise rejection unless caught further downstream.

In contrast, `.then(onFulfilled).catch(onRejected)` places `.catch()` on a **subsequent promise** in the chain. As a result, `onRejected` catches errors from both the original upstream promise AND any errors thrown inside `onFulfilled`.

---

### 2. Why does `Promise.all` NOT stop or cancel remaining asynchronous tasks when one of them rejects?

**Question:** If three database updates are executed via `Promise.all([writeA(), writeB(), writeC()])` and `writeA` rejects immediately, what happens to `writeB` and `writeC`? How do you prevent orphaned writes?

**Answer:**
`Promise.all` is purely an observer of promise states; it has no ownership or control over the asynchronous operations that produced those promises. When `writeA()` rejects, `Promise.all` immediately rejects its returned wrapper promise to alert the caller without waiting for the others. However, the underlying operations for `writeB()` and `writeC()` are already scheduled and running on the event loop, thread pool, or remote network socket. They will run to completion, potentially writing partial data to your database.

**Prevention Strategies:**
1. **Cooperative Cancellation:** Pass an `AbortSignal` (from `AbortController`) into every write function, and call `controller.abort()` inside the error handler.
2. **Database Transactions:** Wrap all updates within a single ACID transaction (`BEGIN` / `COMMIT` / `ROLLBACK`). If any step fails, roll back the transaction so partial background writes cannot persist.

---

### 3. How does the JavaScript engine adopt thenables, and why can an adversarial thenable break promise guarantees?

**Question:** What is a thenable, how does `Promise.resolve(thenable)` handle it, and how does the ECMAScript specification protect against buggy thenables that call both resolve and reject?

**Answer:**
A thenable is any object or function that exposes a callable `.then()` method. When `Promise.resolve(x)` or a `.then()` callback encounters a thenable, it executes the ECMAScript Promise Resolution Procedure (`[[Resolve]]`). The engine calls `thenable.then(resolvePromise, rejectPromise)` with internal resolution callbacks.

If an adversarial or poorly written third-party thenable attempts to call both `resolvePromise("success")` and `rejectPromise("fail")`, or calls `resolvePromise()` multiple times, the native Promise engine enforces internal boolean flags (`alreadyResolved = true`). The first invocation settles the native promise, and all subsequent invocations are discarded. This ensures that native Promises maintaining settlement immutability even when consuming non-compliant third-party libraries.

---

### 4. How would you design a rate-limited API client that makes 10,000 asynchronous requests without crashing Node.js?

**Question:** An engineer writes `await Promise.all(urls.map(url => fetch(url)))` for 10,000 URLs. Why will this crash in production, and how do you design a robust architecture?

**Answer:**
**Failure Modes:**
1. **File Descriptor Exhaustion (`EMFILE`):** Opening 10,000 concurrent TCP sockets exceeds the operating system's maximum file descriptor limit per process.
2. **DNS & Remote Rate Limits (`429 Too Many Requests`):** Spamming the target server with 10,000 simultaneous connections triggers firewall drops, socket resets (`ECONNRESET`), or IP bans.
3. **Memory Spike:** Allocating 10,000 pending Promise objects, network buffers, and closures simultaneously spikes heap usage, inducing severe V8 garbage collection pauses.

**Architectural Design:**
1. **Bounded Worker Pool (Concurrency Throttling):** Restrict active concurrent requests to a manageable pool (e.g. 10 to 50 concurrent tasks) using an index-based queue or libraries like `p-limit`.
2. **Token Bucket / Leaky Bucket Rate Limiter:** Enforce maximum requests per second (e.g. 100 req/sec) to respect target API quotas.
3. **Exponential Backoff and Jitter:** Wrap individual fetchers with retry logic that intercepts `429` and `503` responses, applying randomized delays to avoid thundering herds.
4. **Cooperative Timeout & Circuit Breaking:** Use `AbortController` with individual request deadlines, and trip a circuit breaker if failure rates exceed a threshold.

---

<nav aria-label="Lecture navigation">

[← Previous Day: Day 17 - Modules and Module Interoperability](day-17-modules-and-interoperability.md) | [Roadmap](../javascript-roadmap.md) | [Next Day: Day 19 - `async`/`await` and Asynchronous Error Propagation →](day-19-async-await-errors-and-cleanup.md)

</nav>
