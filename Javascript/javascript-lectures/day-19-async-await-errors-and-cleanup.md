# Day 19: `async`/`await` and Asynchronous Error Propagation

<nav aria-label="Lecture navigation">

[← Previous Day: Day 18 - Promises and Promise Composition](day-18-promises-and-composition.md) | [Roadmap](../javascript-roadmap.md) | [Next Day: Day 20 - Jobs, Microtasks, and Observable Scheduling →](day-20-jobs-microtasks-and-scheduling.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Deconstruct the `async`/`await` syntactic abstraction into underlying generator-coroutine and Promise microtask mechanics.
- Trace stack frame suspension and resumption across `await` boundaries.
- Articulate the critical operational difference between `return promise` and `return await promise` within `try...catch` and `finally` blocks.
- Diagnose and eliminate accidental sequential latency bottlenecks (the "async waterfall" anti-pattern).
- Chain and preserve contextual error causality using `Error.cause` across asynchronous abstraction layers.
- Build bulletproof resource acquisition and teardown pipelines using `try...finally` and cooperative `AbortSignal` cancellation contracts.
- Handle partial failure topologies and distinguish mission-critical dependencies from optional enhancements.

---

## Vocabulary Card

| Term | Plain Definition | Everyday Analogy |
| :--- | :--- | :--- |
| **`async function`** | A function that implicitly wraps any returned value in a fulfilled Promise and any thrown exception in a rejected Promise. | A postal service that takes any item handed to it and automatically packs it into a standardized delivery box before dispatch. |
| **`await`** | An operator that pauses the execution of an `async` function until a Promise settles, unwrapping its fulfillment value or throwing its rejection reason. | A bookmark placed on a recipe page; you pause to let the bread bake in the oven, returning to step 2 once the timer chimes. |
| **Coroutine** | A generalized function execution model that can suspend its execution state (variables and stack pointer) and yield control back to the caller, to be resumed later. | A board game session that players can photograph and pause mid-game, returning next weekend to resume exactly where pieces stood. |
| **Async Waterfall** | The unintended serialization of independent asynchronous tasks by awaiting each one in sequence instead of kicking them off concurrently. | Waiting in a 30-minute queue to order coffee, and only after receiving it, walking to a separate 30-minute queue to order a muffin. |
| **`return await`** | Explicitly waiting for a promise to resolve before returning its value, ensuring local `try...catch` blocks intercept rejections before the frame exits. | Opening an incoming delivery box at the doorway while the delivery driver is still present to check for broken glass before signing. |
| **Cooperative Cancellation** | A cancellation pattern where an asynchronous operation actively checks an external cancellation token (`AbortSignal`) to abort execution cleanly. | A contract where an employee checks their company radio periodically for a "stop work" order rather than being abruptly disconnected from power. |

---

## Core Concepts

### 1. The Anatomy of an Async Function

Declaring a function `async` guarantees that its return value is **always** an ECMAScript Promise:
1. Returning a value wrapped as `return val` automatically fulfills the promise via `Promise.resolve(val)`.
2. Throwing an exception (`throw err`) immediately rejects the returned promise via `Promise.reject(err)`.
3. Synchronous errors thrown *before* the first `await` are still captured by the returned Promise; they do NOT throw synchronously to the caller.

```javascript
// Node.js code
// ✅ DO: Rely on async functions to normalize error handling into rejected promises
async function fetchUserStatus(userId) {
  if (!Number.isInteger(userId)) {
    // Throws synchronously before any await, but caller receives a rejected Promise!
    throw new TypeError("userId must be an integer");
  }
  return { id: userId, active: true };
}

// Caller catches the error via standard Promise mechanics:
fetchUserStatus("invalid-id")
  .catch((err) => console.log("Caught normalization error:", err.message));
// Output: "Caught normalization error: userId must be an integer"
```

### 2. Execution Suspension and Stack Resumption

When JavaScript encounters an `await` expression:
1. The operand is wrapped in `Promise.resolve(operand)`.
2. The current execution frame of the async function is suspended, preserving its local variables and instruction pointer.
3. The function returns a pending promise to the caller, relinquishing the synchronous JavaScript thread.
4. When the awaited promise settles, a microtask is queued to resume the suspended coroutine.
5. Upon resumption, if fulfilled, `await` evaluates to the resolved value; if rejected, `await` **throws the rejection reason like a native synchronous exception**.

### 3. The `return await` Nuance in `try...catch`

A common source of bugs is returning a promise directly without `await` inside a `try...catch` block.

```javascript
// Node.js code
// ❌ BROKEN: Returning without await bypasses local catch!
async function riskyWithoutAwait() {
  try {
    // The promise is returned immediately to the caller in a pending state.
    // The local try/catch block finishes and exits!
    return Promise.reject(new Error("Database connection dropped"));
  } catch (err) {
    // ⚠️ THIS CATCH BLOCK NEVER RUNS!
    console.log("Locally recovered!");
    return "fallback_value";
  }
}

// ✅ FIXED: Using 'return await' pauses execution inside the try block
async function safeWithAwait() {
  try {
    // Pauses here. When the promise rejects, it throws inside the 'try' scope!
    return await Promise.reject(new Error("Database connection dropped"));
  } catch (err) {
    // Runs cleanly!
    console.log("Successfully intercepted inside catch:", err.message);
    return "fallback_value";
  }
}

riskyWithoutAwait().catch((e) => console.log("Escaped to caller:", e.message));
safeWithAwait().then((res) => console.log("Returned result:", res));
```

**Rule of Thumb:**
- Inside a `try...catch` or `try...finally`: Always use `return await` if you need the local block to catch errors or guarantee cleanup order.
- Outside a `try...catch` (at the tail of a function): Omitting `await` (`return promise`) avoids an unnecessary extra microtask tick.

### 4. Accidental Sequential Waterfalls vs. Concurrent Execution

Awaiting independent operations in serial doubles or triples response times:

```javascript
// Node.js code
function fetchUserProfile(id) {
  return new Promise((r) => setTimeout(() => r({ id, name: "Alice" }), 100));
}
function fetchUserOrders(id) {
  return new Promise((r) => setTimeout(() => r([{ orderId: "ord_101" }]), 100));
}

// ❌ SLOW: Async Waterfall (Takes 200ms)
async function getDashboardSlow(userId) {
  const profile = await fetchUserProfile(userId); // Waits 100ms
  const orders = await fetchUserOrders(userId);   // Waits another 100ms
  return { profile, orders };
}

// ✅ FAST: Concurrent Execution (Takes 100ms total)
async function getDashboardFast(userId) {
  // Initiate both promises concurrently in parallel
  const profilePromise = fetchUserProfile(userId);
  const ordersPromise = fetchUserOrders(userId);

  // Await them simultaneously
  const [profile, orders] = await Promise.all([profilePromise, ordersPromise]);
  return { profile, orders };
}
```

### 5. Error Chaining with `Error.cause`

When intercepting errors at architectural boundaries (e.g. database client -> service layer), wrap the low-level failure in a domain-specific error while preserving the original diagnostic stack trace via `Error.cause` (ES2022):

```javascript
// Node.js code
class ServiceUnavailableError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "ServiceUnavailableError";
  }
}

async function queryBilling(accountId) {
  try {
    return await fetchFromRemoteBilling(accountId);
  } catch (rawError) {
    // ✅ DO: Preserve original root-cause stack trace
    throw new ServiceUnavailableError(`Unable to process billing for account ${accountId}`, {
      cause: rawError,
    });
  }
}

function fetchFromRemoteBilling() {
  return Promise.reject(new Error("ETIMEDOUT: Connection to port 5432 failed"));
}

queryBilling(42).catch((err) => {
  console.log("Public Error:", err.message);
  console.log("Underlying Root Cause:", err.cause.message);
});
```

### 6. Cooperative Cancellation with `AbortController`

JavaScript cannot preemptively kill running execution frames. Cancellation requires cooperative checking of an `AbortSignal`:

```javascript
// Node.js code
async function longRunningWorker(signal) {
  for (let step = 1; step <= 5; step++) {
    // 1. Check signal prior to each unit of work
    if (signal.aborted) {
      throw signal.reason; // Throws AbortError
    }

    console.log(`Executing step ${step}...`);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 50);

      // 2. Listen for abort event during async wait
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          reject(signal.reason);
        },
        { once: true }
      );
    });
  }
  return "All steps completed";
}

const controller = new AbortController();
setTimeout(() => controller.abort(new Error("Worker cancelled by timeout")), 80);

longRunningWorker(controller.signal).catch((err) => {
  console.log("Worker stopped cleanly:", err.message);
});
```

---

## Detailed Explanations and Traces

### Trace 1: The Stack Frame Suspension and Resumption Cycle

Let's trace how V8 handles the coroutine state machine behind `async`/`await`:

```javascript
// Node.js code
console.log("1. Script start");

async function runWorkflow() {
  console.log("2. Inside async before await");
  const result = await Promise.resolve("Data payload");
  console.log("4. Inside async after await:", result);
  return "Finished";
}

runWorkflow().then((msg) => console.log("5. Workflow settled:", msg));
console.log("3. Script end");
```

```
Call Stack Execution Trace:
--------------------------------------------------------------------------------
1. Synchronous Frame: Logs "1. Script start".
2. Synchronous Frame: Calls runWorkflow().
3. Inside runWorkflow: Logs "2. Inside async before await".
4. Engine evaluates: await Promise.resolve("Data payload").
   - Resolves operand to a fulfilled promise.
   - Schedules a microtask to resume runWorkflow.
   - Suspends runWorkflow's execution context.
   - runWorkflow() immediately returns an unfulfilled Promise to caller.
5. Synchronous Frame: Attaches .then() handler to runWorkflow's returned promise.
6. Synchronous Frame: Logs "3. Script end".
   -> Synchronous call stack is now completely EMPTY.

Microtask Queue Drain:
--------------------------------------------------------------------------------
7. Microtask runs: Resumes runWorkflow with resolved value "Data payload".
8. Inside runWorkflow: Assigns result = "Data payload".
9. Logs "4. Inside async after await: Data payload".
10. runWorkflow returns "Finished" -> Fulfills its outer promise.
11. Microtask runs: Fires .then() callback on runWorkflow's promise.
12. Logs "5. Workflow settled: Finished".
```

---

### Trace 2: Resource Cleanup in `try...finally` During Error and Abort

Consider a database transaction client that must guarantee connection pool check-in:

```javascript
// Node.js code
async function executeTransaction(pool, transactionLogic) {
  const connection = await pool.acquire();
  console.log("[POOL] Acquired connection #1");

  try {
    await connection.query("BEGIN");
    const result = await transactionLogic(connection);
    await connection.query("COMMIT");
    return result;
  } catch (error) {
    console.log("[POOL] Error encountered; rolling back transaction");
    try {
      await connection.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("[POOL] Rollback failed:", rollbackErr.message);
    }
    throw error; // Re-throw to caller
  } finally {
    // ✅ GUARANTEED: Executes on success, error, or early return
    console.log("[POOL] Releasing connection #1 back to pool");
    await pool.release(connection);
  }
}
```

Even if `transactionLogic()` throws or triggers an unhandled promise rejection, the JavaScript runtime executes the `finally` block before leaving the function frame, preventing connection leaks in the pool.

---

## Code Examples

### 1. Resilient Partial Failure Pattern: Mandatory vs. Optional Dependencies

In production microservices, a dashboard should render even if auxiliary widgets (e.g. notifications or friend recommendations) fail:

```javascript
// Node.js code
async function getAggregatedDashboard(userId) {
  // 1. Kick off all promises concurrently
  const userPromise = fetchUserData(userId); // Mandatory
  const feedPromise = fetchRecentFeed(userId); // Mandatory
  const noticesPromise = fetchNotifications(userId); // Optional

  // 2. Await mandatory and optional sets
  const [userResult, feedResult, noticeResult] = await Promise.allSettled([
    userPromise,
    feedPromise,
    noticesPromise,
  ]);

  // 3. Fail-fast if any MANDATORY dependency rejected
  if (userResult.status === "rejected") {
    throw new Error("Core user profile unavailable", { cause: userResult.reason });
  }
  if (feedResult.status === "rejected") {
    throw new Error("Core news feed unavailable", { cause: feedResult.reason });
  }

  // 4. Gracefully degrade for OPTIONAL dependency
  return {
    user: userResult.value,
    feed: feedResult.value,
    notifications: noticeResult.status === "fulfilled" ? noticeResult.value : [],
    notificationsUnavailable: noticeResult.status === "rejected",
  };
}

function fetchUserData(id) { return Promise.resolve({ id, name: "Bob" }); }
function fetchRecentFeed(id) { return Promise.resolve(["Post 1", "Post 2"]); }
function fetchNotifications(id) { return Promise.reject(new Error("503 Gateway")); }

getAggregatedDashboard(12).then((dashboard) => {
  console.log("Dashboard Loaded Successfully with Degraded Notices:");
  console.log(dashboard);
});
```

---

## Tricky Points and Gotchas

### 1. Synchronous Throw Inside `async` Functions

Developers often assume `try...catch` around an async function call catches synchronous throws:

```javascript
// Node.js code
async function faultyAsync(badArg) {
  if (!badArg) throw new Error("Missing required argument");
  return await Promise.resolve("OK");
}

// ❌ ANTI-PATTERN: Wrapping async function call in synchronous try/catch
try {
  faultyAsync(null); // Returns a REJECTED PROMISE!
} catch (err) {
  // NEVER RUNS! The error was converted to an unhandled promise rejection!
  console.log("Caught synchronously:", err);
}

// ✅ PROPER PATTERN: Always await or chain .catch()
faultyAsync(null).catch((err) => console.log("Properly caught:", err.message));
```

### 2. Accidental Array Method Serialization (`forEach` with `await`)

Using `await` inside an `Array.prototype.forEach` callback does NOT pause the outer function! `forEach` expects a synchronous callback and completely ignores promises returned by it:

```javascript
// Node.js code
async function processItemsBroken(items) {
  // ❌ BROKEN: forEach does NOT wait for async callbacks!
  items.forEach(async (item) => {
    await new Promise((r) => setTimeout(r, 50));
    console.log("Finished item:", item);
  });
  console.log("All items finished?"); // PRINTS IMMEDIATELY BEFORE ANY ITEM RUNS!
}

// ✅ FIXED: Use standard for...of loop for sequential processing
async function processItemsSequential(items) {
  for (const item of items) {
    await new Promise((r) => setTimeout(r, 50));
    console.log("Finished item:", item);
  }
  console.log("All items truly finished sequentially.");
}
```

---

## Hands-on Exercise: Building a Deadline-Aware Pipeline with Cleanup

### Problem Statement

You are writing an asynchronous telemetry batch exporter. It acquires a remote socket connection, sends a batch of events, and closes the socket. If the operation exceeds a 100ms deadline or fails, it must cancel the upload and guarantee the socket is closed without connection leaks.

### Buggy Implementation

```javascript
// Node.js code
// ❌ BUGS:
// 1. Leaks socket if upload rejects or times out
// 2. Uses return without await inside try/catch
// 3. Omits cooperative cancellation
async function exportTelemetry(socketPool, batch) {
  const socket = await socketPool.connect();
  try {
    return socket.sendBatch(batch); // Missing await! Catch won't see upload failure!
  } catch (err) {
    console.error("Telemetry failed:", err);
  } finally {
    socket.close(); // Closes immediately before sendBatch finishes!
  }
}
```

### Edge Cases to Address

1. `finally` closing the socket before un-awaited `sendBatch` completes.
2. Deadline enforcement using `AbortController` and `Promise.race`.
3. Preserving root-cause telemetry errors while ensuring teardown.

### Verified Solution

```javascript
// Node.js code
async function exportTelemetryResilient(socketPool, batch, timeoutMs = 100) {
  const controller = new AbortController();
  const socket = await socketPool.connect();

  let timerId;
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      controller.abort(new Error(`Telemetry upload timed out after ${timeoutMs}ms`));
      reject(new Error("Timeout"));
    }, timeoutMs);
  });

  try {
    console.log("[SOCKET] Uploading batch of size:", batch.length);

    // ✅ Race upload against deadline with AbortSignal
    const uploadPromise = socket.sendBatch(batch, controller.signal);
    const result = await Promise.race([uploadPromise, timeoutPromise]);
    return result;
  } catch (error) {
    console.error("[SOCKET] Failed during export:", error.message);
    throw new Error("Telemetry export failed", { cause: error });
  } finally {
    clearTimeout(timerId);
    console.log("[SOCKET] Performing guaranteed socket teardown");
    await socket.close(); // Safe cleanup
  }
}

// Verification:
const mockSocketPool = {
  async connect() {
    return {
      async sendBatch(batch, signal) {
        return new Promise((resolve, reject) => {
          const t = setTimeout(() => resolve({ uploaded: batch.length }), 40);
          signal.addEventListener("abort", () => {
            clearTimeout(t);
            reject(signal.reason);
          });
        });
      },
      async close() {
        console.log("[SOCKET] Socket cleanly disconnected");
      },
    };
  },
};

exportTelemetryResilient(mockSocketPool, [1, 2, 3])
  .then((res) => console.log("Export Success:", res));
```

---

## Summary

- An `async` function always returns a Promise; values returned are wrapped via `Promise.resolve()`, and thrown errors are rejected via `Promise.reject()`.
- `await` pauses coroutine execution and unwinds to the event loop. Resumption occurs as a microtask when the awaited promise settles.
- `return await` inside a `try...catch` is mandatory if you want local catch/finally handlers to intercept rejections; omitting `await` passes the un-settled promise to the outer caller.
- Avoid sequential async waterfalls by launching independent tasks concurrently and awaiting them with `Promise.all()` or `Promise.allSettled()`.
- Use `Error.cause` to retain low-level diagnostic failure traces when wrapping domain errors.
- Never use `await` inside synchronous iteration callbacks like `forEach()`; use `for...of` for sequential execution or `Promise.all()` for concurrent mapping.
- Implement cooperative cancellation using `AbortController` and `AbortSignal` for graceful timeout and shutdown handling.

---

## Cheat Sheet

### `return promise` vs. `return await promise`

| Context | `return promise` | `return await promise` | Recommended |
| :--- | :--- | :--- | :--- |
| **Inside `try...catch`** | Rejection escapes local `catch`! | Local `catch` handles rejection | **`return await`** |
| **Inside `try...finally`** | `finally` runs before promise settles | `finally` runs after promise settles | **`return await`** |
| **Tail of async function (no try/catch)** | Saves 1 microtask tick | Costs 1 extra microtask tick | **`return promise`** |

### Execution Mechanics Decision Matrix

| Requirement | Syntax Pattern | Failure Semantics |
| :--- | :--- | :--- |
| **Sequential (Step B depends on A)** | `const a = await getA(); const b = await getB(a);` | Aborts immediately if Step A fails. |
| **Concurrent (All mandatory)** | `const [a, b] = await Promise.all([getA(), getB()]);` | Fails fast if either A or B rejects. |
| **Concurrent (Partial degradation)** | `const results = await Promise.allSettled([getA(), getB()]);` | Never rejects; inspect `.status` manually. |
| **Concurrent (Race / Timeout)** | `await Promise.race([task(), timeoutPromise]);` | Rejects on timeout, but does not cancel task without signal. |

---

## Interview Questions & Deep Dives

### 1. In what scenario is `return await` required, and when is it an unnecessary performance penalty?

**Question:** Explain why linters often flag `return await` as redundant, and specify the exact situations where omitting `await` causes serious production defects.

**Answer:**
Linters like ESLint flag `no-return-await` because at the tail of an async function without a `try...catch` block:
```javascript
async function getData() {
  return await fetchUrl(); // Redundant extra microtask tick
}
```
Here, `fetchUrl()` already returns a promise. Awaiting it pauses the async coroutine, schedules a microtask to resume it, unboxes the value, and immediately boxes it back into the return promise. Simply writing `return fetchUrl()` allows the returned promise to be adopted directly, saving a microtask tick.

**When `return await` is REQUIRED:**
Inside a `try...catch` or `try...finally` block:
```javascript
async function getData() {
  try {
    return await fetchUrl(); // MANDATORY!
  } catch (err) {
    return fallback;
  }
}
```
If you omit `await` (`return fetchUrl()`), the pending promise is immediately handed to the caller. The local execution frame exits the `try` block before the promise settles. If the promise later rejects, the local `catch` handler is never invoked, bypassing your error handling and recovery logic entirely.

---

### 2. Why does `await` not block the Node.js event loop thread?

**Question:** A junior developer fears using `await` because they believe it blocks the single-threaded Node.js execution thread. How do you explain the underlying coroutine suspension to them?

**Answer:**
`await` does **not** block the OS thread or the Node.js event loop. It only pauses the **local execution context** of the specific `async` function where it is invoked.

When `await promise` is encountered:
1. The engine checks if the promise is already fulfilled. If not, it attaches internal fulfillment and rejection callbacks to that promise.
2. The current function's call frame (variables, parameters, lexical scope) is preserved on the heap.
3. Control is immediately returned to the caller of the async function, allowing the main thread call stack to unwind.
4. The Node.js event loop continues processing other incoming HTTP requests, timers, and I/O callbacks unhindered.
5. When the awaited asynchronous I/O completes (e.g. database query returns), libuv queues a microtask.
6. The microtask loop pops the suspended frame back onto the call stack and resumes execution from the exact line following the `await`.

---

### 3. How does `Array.prototype.forEach` interact with `async`/`await`, and how should batch asynchronous processing be written?

**Question:** What happens when you write `items.forEach(async (item) => { await process(item); });`? How do you rewrite it for sequential execution and concurrent execution?

**Answer:**
`Array.prototype.forEach` is completely synchronous and was designed before Promises existed. Its implementation internally executes `callback(item, index, array)` in a synchronous `for` loop without inspecting or awaiting the return value of the callback.

When passed an `async` arrow function, `forEach` calls the callback, receives a pending Promise, and immediately proceeds to the next iteration without waiting. The `forEach` call returns `undefined` synchronously, while all the async operations run concurrently in the background unmonitored. Any errors thrown will trigger `unhandledRejection` events.

**Proper Patterns:**
- **Sequential Execution:** Use a standard `for...of` loop:
  ```javascript
  for (const item of items) {
    await process(item);
  }
  ```
- **Unconstrained Concurrent Execution:** Use `Array.prototype.map()` joined with `Promise.all()`:
  ```javascript
  await Promise.all(items.map((item) => process(item)));
  ```
- **Bounded Concurrency:** Use a worker pool or `p-limit` if the array contains thousands of items to avoid exhausting resources.

---

### 4. How do asynchronous stack traces differ from synchronous stack traces, and how has V8 improved error debugging in modern Node.js?

**Question:** Why were asynchronous stack traces historically truncated at the `await` boundary, and how does the modern V8 Zero-Cost Async Stack Trace mechanism solve this?

**Answer:**
In classical synchronous JavaScript, the call stack is a contiguous memory structure. When an exception is thrown, the engine simply walks up the active stack frames to produce the stack trace.

Historically in asynchronous code, once an async operation began, the original call stack unwound completely to the event loop. When the asynchronous callback eventually fired and threw an error, the previous caller frames no longer existed on the stack, leading to notoriously unhelpful traces like:
```text
Error: Failed
    at setTimeout (file.js:10:5)
```
Modern V8 (Node.js 12+) implements **Zero-Cost Async Stack Traces**. When an `async` function awaits a promise, the engine stores a pointer to the suspended caller frame in the Promise's internal reaction record. If an error is thrown upon resumption, the engine traverses these chained reaction records to reconstruct the full logical asynchronous stack trace (e.g. `await stepTwo()` <- `await stepOne()` <- `await main()`) without incurring runtime memory overhead during successful runs.

---

<nav aria-label="Lecture navigation">

[← Previous Day: Day 18 - Promises and Promise Composition](day-18-promises-and-composition.md) | [Roadmap](../javascript-roadmap.md) | [Next Day: Day 20 - Jobs, Microtasks, and Observable Scheduling →](day-20-jobs-microtasks-and-scheduling.md)

</nav>
