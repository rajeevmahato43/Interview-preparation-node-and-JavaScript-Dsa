# Day 24: Debugging and Language Failures

<nav aria-label="Lecture navigation">

[← Previous Day: Day 23 - Testing JavaScript Behavior](day-23-testing-javascript-behavior.md) | [Roadmap](../javascript-roadmap.md) | [Next Day: Day 25 - Security-Relevant JavaScript Behavior →](day-25-security-relevant-javascript.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Apply a scientific, hypothesis-driven debugging methodology (reproduce, minimize to MCVE, isolate, fix, and regress) rather than trial-and-error guessing.
- Dissect complex JavaScript call stacks and navigate V8 Zero-Cost asynchronous stack traces.
- Preserve full failure causal chains using `Error.cause` without losing diagnostic context across abstraction layers.
- Distinguish between `uncaughtException` (fatal synchronous process breakdown) and `unhandledRejection` (escaped asynchronous promise rejection).
- Diagnose subtle asynchronous race conditions, including Time-of-Check to Time-of-Use (TOCTOU) bugs and interleaving state mutations.
- Isolate memory leaks using Heap Snapshot metrics (Shallow Size vs. Retained Size, Distance to GC Root).
- Implement structured observability and context propagation via `AsyncLocalStorage` while strictly redacting PII and sensitive credentials.

---

## Vocabulary Card

| Term | Plain Definition | Everyday Analogy |
| :--- | :--- | :--- |
| **Root-Cause Analysis (RCA)** | The process of identifying the foundational flaw that initiated a failure sequence rather than merely treating visible downstream symptoms. | Finding the leaking water pipe inside the drywall instead of continually mopping up puddles on the kitchen floor. |
| **MCVE** | Minimum, Complete, and Verifiable Example: the smallest isolated snippet of code that reliably reproduces a bug with zero extraneous noise. | Stripping a broken motorcycle down to just the engine, battery, and spark plug on a test stand to see why it won't fire. |
| **`Error.cause`** | A native ES2022 property that chains an underlying root error to a high-level domain error, preserving complete multi-layer diagnostic traces. | Attaching a doctor’s pathology report to a patient’s hospital discharge summary so specialists know the exact origin of a diagnosis. |
| **Shallow Size** | The physical memory byte count directly allocated for an object itself, excluding references to other objects. | The weight of an empty filing cabinet without any of the folders stored inside it. |
| **Retained Size** | The total quantity of memory that would be freed if an object were garbage collected, including all objects reachable exclusively through it. | The weight of the filing cabinet plus every single folder and paper sheet locked inside it that would be thrown out if the cabinet were destroyed. |
| **TOCTOU Race Condition** | Time-of-Check to Time-of-Use: a bug where system state changes between the moment a condition is verified and the moment an action is executed. | Checking that a bank account has $100, waiting 2 seconds while another transaction withdraws $90, and then attempting to withdraw $100. |

---

## Core Concepts

### 1. The Scientific Method of Debugging

Senior debugging is structured and hypothesis-driven:
1. **Reproduce:** Establish a deterministic sequence that reliably triggers the failure.
2. **Minimize (MCVE):** Strip away libraries, unrelated network calls, and database tables until the smallest failing code snippet remains.
3. **Formulate Hypothesis:** State explicitly: "I believe variable $X$ is mutated unexpectedly at step $Y$ because of missing await."
4. **Isolate & Observe:** Use breakpoints or targeted logging to confirm state transitions before and after the suspected failure point.
5. **Smallest Fix:** Apply the minimal targeted repair that resolves the root defect without introducing collateral changes.
6. **Regression Guard:** Add an automated test that asserts the bug stays fixed.

### 2. Reading Asynchronous Call Stacks and `Error.cause`

When an error crosses service layers, throwing a generic new error without chaining discards the original file and line number:

```javascript
// Node.js code
// ❌ ANTI-PATTERN: Discards root-cause stack trace
async function processOrderBad(orderId) {
  try {
    await databaseCharge(orderId);
  } catch (err) {
    // Overwrites original stack trace! Developers cannot see what failed inside databaseCharge!
    throw new Error(`Order ${orderId} failed`);
  }
}

// ✅ BEST PRACTICE: Preserve causal chain with Error.cause (ES2022)
class OrderProcessingError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "OrderProcessingError";
  }
}

async function processOrderGood(orderId) {
  try {
    await databaseCharge(orderId);
  } catch (rawError) {
    throw new OrderProcessingError(`Order ${orderId} could not be completed`, {
      cause: rawError, // Preserves the exact database connection/query stack trace!
    });
  }
}

function databaseCharge() {
  return Promise.reject(new Error("Connection reset by peer (port 5432)"));
}

processOrderGood(101).catch((err) => {
  console.log("High-level error:", err.message);
  console.log("Root-cause error:", err.cause.message);
  console.log("Full causal stack trace:\n", err.stack);
});
```

### 3. Fatal Process Crashes: `uncaughtException` vs. `unhandledRejection`

Node.js distinguishes synchronous crashes from unhandled promises:

- **`uncaughtException`:** A synchronous exception was thrown and was never caught by any `try...catch` block. The process execution context is corrupted. **You must log and immediately exit the process (`process.exit(1)`)** because application state can no longer be trusted.
- **`unhandledRejection`:** A Promise rejected without an attached `.catch()` handler. Modern Node.js terminates the process by default unless a custom listener handles it.

```javascript
// Node.js code
// Recommended production monitoring pattern:
process.on("uncaughtException", (err, origin) => {
  console.error(`FATAL: Uncaught Exception at ${origin}:`, err);
  // Synchronous state is corrupt! Flush logs and crash cleanly for container orchestrator restart:
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("WARN: Unhandled Promise Rejection:", reason);
  // Log telemetry; in modern Node.js, unhandled rejections terminate with code 1 by default
});
```

### 4. Asynchronous Race Conditions: The TOCTOU Trap

In single-threaded Node.js, race conditions do not occur inside synchronous operations. They occur **across `await` suspension points**, where other concurrent requests interleave and alter shared state:

```javascript
// Node.js code
// ❌ TOCTOU BUG: State mutation across await boundary
class InventoryService {
  constructor() {
    this.stock = 1;
  }

  async purchaseItem(userId) {
    // 1. Time-of-Check:
    if (this.stock > 0) {
      console.log(`[USER ${userId}] Stock confirmed available. Processing payment...`);

      // ⚠️ DANGER: Async suspension point! Another request can run here!
      await new Promise((r) => setTimeout(r, 50)); // Simulates payment API call

      // 2. Time-of-Use:
      this.stock--;
      console.log(`[USER ${userId}] Purchase complete. Remaining stock: ${this.stock}`);
      return true;
    }
    return false;
  }
}

const store = new InventoryService();
// Two users purchase simultaneously when only 1 item exists in stock:
Promise.all([store.purchaseItem("Alice"), store.purchaseItem("Bob")]);
// Result: Both users pass the check! Remaining stock drops to -1 (Overselling bug!)
```

**Fix:** Atomic operations, mutex locks, or optimistic concurrency control with database version keys.

### 5. Structured Observability without Leaking Secrets

Logging arbitrary objects (`console.log(req.body)`) frequently leaks passwords, session tokens, and credit card numbers into log files. Use targeted redaction and request context propagation:

```javascript
// Node.js code
const { AsyncLocalStorage } = require("node:async_hooks");
const requestContext = new AsyncLocalStorage();

// Safe logging utility that redacts sensitive keys:
function safeLog(level, message, data = {}) {
  const store = requestContext.getStore();
  const traceId = store ? store.traceId : "system";

  const sanitizedData = { ...data };
  const SENSITIVE_KEYS = ["password", "token", "authorization", "secret", "creditCard"];

  for (const key of Object.keys(sanitizedData)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
      sanitizedData[key] = "[REDACTED]";
    }
  }

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    traceId,
    message,
    payload: sanitizedData,
  }));
}

// Running within a scoped context:
requestContext.run({ traceId: "req_uuid_9921" }, () => {
  safeLog("INFO", "User login attempt", {
    username: "john_doe",
    password: "super_secret_password_123",
  });
});
// Output: {"timestamp":"...","level":"INFO","traceId":"req_uuid_9921","message":"User login attempt","payload":{"username":"john_doe","password":"[REDACTED]"}}
```

---

## Detailed Explanations and Traces

### Trace 1: The Missing `return` Promise Leak Trace

Consider debugging a background worker that appears to succeed, but database mutations fail silently:

```javascript
// Node.js code
// Broken function under test:
function syncUserRecords(userId) {
  return Promise.resolve(userId)
    .then((id) => {
      console.log("Step 1: Found user", id);
      // Asynchronous database write is kicked off, BUT missing 'return'!
      updateDatabaseRecord(id).catch((e) => console.error("DB error:", e.message));
    })
    .then(() => {
      console.log("Step 2: Sync completed successfully");
      return "SUCCESS";
    });
}

function updateDatabaseRecord(id) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Database write timeout")), 50);
  });
}

syncUserRecords(42).then((res) => console.log("Final outcome:", res));
```

```
Execution Timeline:
--------------------------------------------------------------------------------
0ms:  syncUserRecords(42) called.
      - Step 1 executes: logs "Step 1: Found user 42".
      - updateDatabaseRecord(42) is called -> Returns pending Promise P1.
      - Because 'return P1' is missing, callback returns undefined!
      - Next .then() executes immediately: logs "Step 2: Sync completed successfully".
      - Outer promise fulfills with "SUCCESS"!
      - Caller assumes everything was written to database.
50ms: updateDatabaseRecord's timer expires.
      - P1 rejects with "Database write timeout".
      - Local .catch() logs "DB error: Database write timeout" in the background.
      - Production Impact: API returned 200 OK, but user data was permanently lost!
```

**Diagnosis Rule:** Whenever an async chain completes before background work finishes, inspect every `.then()` callback for a missing `return` statement.

---

## Code Examples

### 1. Heap Snapshot Leak Diagnosis: Shallow vs. Retained Size

When analyzing a V8 heap snapshot in Chrome DevTools or via Node's `v8.getHeapSnapshot()`:
- **Shallow Size:** Memory taken by the object itself (typically 32 to 64 bytes for a plain object).
- **Retained Size:** The total heap memory freed if this object is deleted.
- **Distance:** Number of pointer hops from the GC Root. Objects with distance 1 or 2 are directly held by globals or module scopes.

```javascript
// Node.js code
const v8 = require("node:v8");
const fs = require("node:fs");

function captureHeapDiagnostic(filename) {
  const snapshotStream = v8.getHeapSnapshot();
  const fileStream = fs.createWriteStream(filename);
  snapshotStream.pipe(fileStream);
  fileStream.on("finish", () => {
    console.log(`Heap snapshot written to ${filename}. Inspect in Chrome DevTools -> Memory tab.`);
  });
}

// When memory usage climbs past threshold:
if (process.memoryUsage().heapUsed > 500 * 1024 * 1024) {
  captureHeapDiagnostic("oom_investigation.heapsnapshot");
}
```

---

## Tricky Points and Gotchas

### 1. `console.log` Dynamic Object Evaluation in DevTools

In browser dev tools and some IDE terminals, logging an object (`console.log(user)`) does NOT evaluate the object snapshot at the moment of the log! It creates a dynamic reference. If code mutates the object later, expanding the logged object in the console displays the **future mutated value**.

**Fix:** When debugging mutations, serialize a point-in-time snapshot:
`console.log(JSON.parse(JSON.stringify(user)));` or `console.log({ ...user });`

### 2. Adding Arbitrary `setTimeout` Delays to "Fix" Race Conditions

A dangerous anti-pattern is inserting `await new Promise(r => setTimeout(r, 100))` to make asynchronous code pass. This does not fix race conditions; it merely alters scheduling timings on your local machine. In CI or production under load, the race condition will inevitably recur.

**Fix:** Use explicit synchronization primitives: promises, events, or async mutex queues.

---

## Hands-on Exercise: Debugging a Concurrency Race Condition in a Session Store

### Problem Statement

You are debugging a distributed caching middleware. When two rapid concurrent requests arrive for the same user, the cache loader makes two redundant expensive database calls instead of sharing the in-flight request, occasionally writing stale cache values over newer ones.

### Buggy Implementation

```javascript
// Node.js code
// ❌ BUGS:
// 1. Race condition: Multiple calls initiate database queries before cache is populated
// 2. Swallows database rejection, returning undefined without error
const cache = new Map();

async function getOrFetchSession(sessionId, fetchFromDb) {
  // Check cache:
  if (cache.has(sessionId)) {
    return cache.get(sessionId);
  }

  // ⚠️ BUG: Between this check and the set below, 10 concurrent requests arrive!
  const data = await fetchFromDb(sessionId);
  cache.set(sessionId, data);
  return data;
}
```

### Edge Cases to Address

1. In-flight Promise deduplication: Concurrent requests for the same key must join the same pending promise (Promise memoization).
2. Failure cleanup: If the database query rejects, the pending promise must be removed from the cache so future requests can retry.
3. Cache bounding.

### Verified Solution

```javascript
// Node.js code
class ConcurrentSafeSessionCache {
  constructor() {
    this.cache = new Map(); // sessionId -> resolvedData
    this.inFlight = new Map(); // sessionId -> Promise<data>
  }

  async getOrFetch(sessionId, fetchFromDb) {
    // 1. Fast path: Value already resolved in cache
    if (this.cache.has(sessionId)) {
      return this.cache.get(sessionId);
    }

    // 2. In-flight path: A request is already fetching this key! Share the promise:
    if (this.inFlight.has(sessionId)) {
      console.log(`[DEDUP] Joining in-flight fetch for session: ${sessionId}`);
      return await this.inFlight.get(sessionId);
    }

    // 3. Cold path: Initiate fetch and register in-flight promise
    console.log(`[FETCH] Initiating single database fetch for session: ${sessionId}`);
    const fetchPromise = (async () => {
      try {
        const data = await fetchFromDb(sessionId);
        this.cache.set(sessionId, data);
        return data;
      } finally {
        // ✅ GUARANTEED: Remove from in-flight map on success OR failure
        this.inFlight.delete(sessionId);
      }
    })();

    this.inFlight.set(sessionId, fetchPromise);
    return await fetchPromise;
  }
}

// Verification:
const sessionCache = new ConcurrentSafeSessionCache();
let dbQueries = 0;

async function mockDbFetch(id) {
  dbQueries++;
  await new Promise((r) => setTimeout(r, 40)); // 40ms DB latency
  return { id, user: "Alice", loadedAt: Date.now() };
}

// Simulate 5 simultaneous requests for the same session:
Promise.all([
  sessionCache.getOrFetch("sess_99", mockDbFetch),
  sessionCache.getOrFetch("sess_99", mockDbFetch),
  sessionCache.getOrFetch("sess_99", mockDbFetch),
  sessionCache.getOrFetch("sess_99", mockDbFetch),
  sessionCache.getOrFetch("sess_99", mockDbFetch),
]).then((results) => {
  console.log("All 5 requests resolved successfully.");
  console.log("Total DB Queries executed:", dbQueries);
  // Output: Exactly 1 DB query executed! All 5 joined the single in-flight promise.
});
```

---

## Summary

- Debugging is hypothesis testing: reproduce with an MCVE, isolate root causes, apply minimal targeted repairs, and lock them with regression tests.
- Always preserve underlying error causes using `Error.cause` when wrapping domain exceptions.
- On `uncaughtException`, application state is corrupt; log the error and terminate the process cleanly via `process.exit(1)`.
- Asynchronous race conditions happen across `await` boundaries (TOCTOU bugs); synchronize concurrent operations with locks or promise deduplication.
- Heap Snapshot investigation focuses on Retained Size and distance from GC Roots to find memory leaks.
- Propagate contextual logging with `AsyncLocalStorage` and automatically redact sensitive credentials (passwords, tokens).

---

## Cheat Sheet

### Debugging Diagnostic Workflow

```
[ Step 1: Deterministic Reproduction ]
                |
                v
[ Step 2: Minimize to MCVE (Eliminate extraneous code) ]
                |
                v
[ Step 3: Formulate Falsifiable Hypothesis ]
                |
                v
[ Step 4: Trace Causal Events (Inspect state before/after await) ]
                |
                v
[ Step 5: Smallest Targeted Code Repair ]
                |
                v
[ Step 6: Automated Regression Test ]
```

### Process Crash Events Comparison

| Event | Cause | Corrupted State? | Action Required |
| :--- | :--- | :--- | :--- |
| **`uncaughtException`** | Unhandled synchronous `throw` | **Yes** | Log error and call `process.exit(1)` immediately. |
| **`unhandledRejection`** | Promise rejected without `.catch()` | **Varies** | Attach `.catch()`; terminate process by default in Node.js. |
| **`SIGTERM`** | Host/Kubernetes stopping process | No | Stop accepting requests, drain sockets, exit cleanly. |

---

## Interview Questions & Deep Dives

### 1. Why is it dangerous to simply resume normal operation after catching an `uncaughtException` in Node.js?

**Question:** Why does the official Node.js documentation strongly advise calling `process.exit(1)` inside an `uncaughtException` handler instead of logging and continuing to serve traffic?

**Answer:**
When an `uncaughtException` occurs, a synchronous exception was thrown and propagated through the call stack without encountering any `try...catch` block.

Because the exception abruptly aborted execution mid-operation:
1. Object allocations and multi-step mutations were left half-completed.
2. Handlers inside `finally` blocks may not have run, leaving file descriptors, mutex locks, and database transaction connections permanently locked or leaked.
3. In-memory state and application caches are in an **undefined, corrupt state**.

If the process continues running, subsequent requests may read corrupt memory, write invalid data to databases, or lock up completely. The only safe architecture is:
1. Log the failure and diagnostic stack trace.
2. Cleanly close active HTTP servers (stop accepting new traffic).
3. Exit the process via `process.exit(1)`.
4. Let a process supervisor (like systemd, PM2, or Kubernetes) spin up a fresh, healthy process container.

---

### 2. How does `Error.cause` improve debugging in modern Node.js compared to legacy error wrapping?

**Question:** What diagnostic problem does `Error.cause` solve in distributed Node.js microservices, and how does it prevent loss of context?

**Answer:**
Historically, when a low-level error (e.g. `PgError: connection reset on port 5432`) occurred inside a database utility, developers faced an unpalatable choice:
1. *Rethrow raw error:* Leaked low-level implementation details to outer service layers, violating abstraction boundaries.
2. *Throw a new domain error (`throw new PaymentError("Payment failed")`):* Overwrote the original stack trace. Developers debugging production logs saw where `PaymentError` was thrown, but had zero visibility into *why* the underlying database failed.

**With `Error.cause` (ES2022):**
Developers wrap errors cleanly without losing root context:
`throw new PaymentError("Unable to charge customer", { cause: rawDatabaseError });`
The V8 runtime formats the stack trace to display the complete causal sequence:
`PaymentError: Unable to charge customer -> Caused by: PgError: connection reset`.
Both high-level domain boundaries and low-level diagnostic root causes are preserved intact.

---

### 3. What is the difference between an object's Shallow Size and Retained Size in a V8 Heap Snapshot?

**Question:** When diagnosing a memory leak in Chrome DevTools or Node.js heap snapshots, why is sorting by Retained Size vastly more effective than sorting by Shallow Size?

**Answer:**
- **Shallow Size:** The quantity of memory allocated directly to hold the object's own immediate structure (its hidden class pointer, internal properties, elements array pointer). For almost all standard JavaScript objects and closures, shallow size is tiny: between 32 and 64 bytes. Even an object holding references to 100 megabytes of data will typically have a shallow size under 80 bytes.
- **Retained Size:** The total volume of memory that would be reclaimed if the object were deleted and collected by GC. It includes the object's shallow size **plus the size of all children objects that are reachable exclusively from this object**.

**Why Retained Size Matters:**
If you sort by Shallow Size, you will see huge numbers of primitive strings and raw ArrayBuffers, but they provide zero context about *who* is keeping them alive. Sorting by **Retained Size** immediately highlights the root culprit (e.g. an unbounded module array, a leaky cache Map, or an EventEmitter listener list) that is holding a massive graph of objects in memory.

---

### 4. What is a Time-of-Check to Time-of-Use (TOCTOU) race condition in asynchronous JavaScript, and how do you resolve it?

**Question:** JavaScript is single-threaded. How can race conditions like TOCTOU occur in Node.js, and how do you prevent them?

**Answer:**
While JavaScript code executes synchronously on a single thread, asynchronous operations interleave execution via the event loop.

A TOCTOU race condition happens when:
1. Step 1 (Check): Code reads state and verifies a condition (e.g. `if (account.balance >= 100)`).
2. Step 2 (Wait): Code initiates an asynchronous I/O operation (e.g. `await remoteApiAuth()`).
3. Step 3 (Use): When the async operation returns, code assumes the condition verified in Step 1 is still true and mutates state (`account.balance -= 100`).

During the asynchronous pause in Step 2, another concurrent HTTP request for the same account may have executed, checked the balance, and withdrawn the money. When Request 1 resumes, the balance is no longer sufficient, leading to double-spending or negative balances.

**Resolution Strategies:**
1. **Atomic Database Transactions:** Move the check and mutation into a single atomic SQL statement (`UPDATE accounts SET balance = balance - 100 WHERE id = $1 AND balance >= 100;`).
2. **In-Flight Deduplication / Mutex:** In memory, maintain an asynchronous locking queue or mutex keyed by resource ID so concurrent operations for the same entity run sequentially rather than interleaved.

---

<nav aria-label="Lecture navigation">

[← Previous Day: Day 23 - Testing JavaScript Behavior](day-23-testing-javascript-behavior.md) | [Roadmap](../javascript-roadmap.md) | [Next Day: Day 25 - Security-Relevant JavaScript Behavior →](day-25-security-relevant-javascript.md)

</nav>
