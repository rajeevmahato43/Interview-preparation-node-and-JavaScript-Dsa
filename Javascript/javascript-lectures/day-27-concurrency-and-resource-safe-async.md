# Day 27: Concurrency and Resource-Safe Async Code

<nav aria-label="Lecture navigation">

[← Previous Day: Day 26 - JavaScript Boundaries in Services](day-26-javascript-boundaries-for-services.md) | [Roadmap](../javascript-roadmap.md) | [Next Day: Day 28 - Senior JavaScript Integration and Review →](day-28-senior-javascript-interview-integration.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Implement bounded concurrency patterns (worker pools, semaphores) that constrain simultaneous operations to a fixed capacity.
- Guarantee strict input-to-output array order mapping regardless of task completion timing.
- Formulate and execute task failure policies: Fail-Fast, All-Settled/Collect-All, and Threshold-Degraded.
- Architect end-to-end cooperative cancellation using `AbortController`, `AbortSignal`, `signal.throwIfAborted()`, and composite signals (`AbortSignal.any()`).
- Differentiate between timeout rejection (stopping the coordinator) and actual resource cancellation (halting the underlying worker).
- Classify errors into transient vs. permanent categories and implement exponential backoff with full jitter to eliminate Thundering Herd surges.
- Ensure zero resource, handle, and listener leaks in long-running asynchronous orchestration pipelines.

---

## Vocabulary Card

| Term | Plain Definition | Everyday Analogy |
| :--- | :--- | :--- |
| **Bounded Concurrency** | An execution design that limits the number of simultaneously active asynchronous operations to a maximum threshold $N$. | A highway toll plaza with exactly 4 open lanes; cars line up in queue and pass through 4 at a time to prevent gridlock. |
| **Cooperative Cancellation** | A cancellation pattern where an asynchronous task actively observes an `AbortSignal` token and voluntarily stops its own execution. | A contractor who checks their mobile phone periodically for a "stop work" order from the client before buying materials. |
| **Composite Signal (`AbortSignal.any`)** | A single `AbortSignal` that triggers whenever *any* one of multiple parent signals aborts (e.g. user cancellation OR request timeout). | A smoke alarm wired to trigger if either heat sensors in the kitchen OR smoke detectors in the hallway go off. |
| **Idempotency** | The property of an operation whereby performing it multiple times produces the identical side effects as performing it exactly once. | An elevator button; pressing "Floor 5" ten times produces the exact same destination as pressing it once. |
| **Exponential Backoff with Jitter** | An algorithm that progressively doubles delay times between retry attempts, introducing randomized variance to prevent synchronized server hammering. | Trapped bees trying to escape a bottle at randomized, spaced intervals rather than slamming into the glass all at the exact same second. |
| **Thundering Herd** | A failure mode where hundreds of concurrent requests wake up or retry at the exact same millisecond, instantly crashing the recovering database. | A crowd rushing through a single narrow subway turnstile simultaneously when the train pulls in. |

---

## Core Concepts

### 1. The Concurrency vs. Resource Exhaustion Dilemma

Node.js allows kicking off thousands of Promises concurrently via `Promise.all(tasks.map(fn))`. However, unbounded concurrency triggers:
- OS Socket exhaustion (`EMFILE: too many open files`).
- Database connection pool starvation (timeouts waiting for available pool clients).
- Extreme V8 garbage collection pauses caused by allocating thousands of pending closures simultaneously.

```javascript
// Node.js code
// ❌ DANGEROUS: Unbounded concurrency launches 10,000 requests simultaneously!
async function processAllUnsafe(items, workerFn) {
  // Can crash the process or trigger rate-limit IP bans (HTTP 429)
  return Promise.all(items.map((item) => workerFn(item)));
}

// ✅ SAFE: Bounded concurrency constrains active workers to fixed capacity:
async function processAllBounded(items, limit, workerFn) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      results[i] = await workerFn(items[i], i); // Preserves exact input index!
    }
  }

  // Spawn exactly 'limit' workers:
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    () => worker()
  );

  await Promise.all(workers);
  return results;
}
```

### 2. Task Failure Policies

A resilient concurrent coordinator must define its behavior when a task rejects:

1. **Fail-Fast (Default `Promise.all`):** Halts processing of unstarted tasks immediately upon the first failure and rejects the coordinator.
2. **Collect-All / Best-Effort (`Promise.allSettled`):** Continues executing all remaining tasks to completion, returning a structured summary of successes and errors.
3. **Threshold-Degraded:** Continues execution as long as failure rates remain below a budget (e.g. $> 95\%$ success).

### 3. Cooperative Cancellation with `AbortSignal`

JavaScript engines cannot kill running synchronous frames or forcibly terminate promises. Cancellation is strictly **cooperative**:
- The worker must inspect `signal.aborted` or call `signal.throwIfAborted()`.
- Async operations (such as `fetch` or database queries) must accept `{ signal }`.

```javascript
// Node.js code
// ✅ DO: Implement cooperative cancellation checks:
async function processBatchTask(taskData, signal) {
  // 1. Pre-flight check:
  signal?.throwIfAborted();

  console.log(`Processing ${taskData.id}...`);

  // 2. Pass signal to cancelable async operations:
  const response = await fetch(`https://api.internal/process/${taskData.id}`, { signal });
  const data = await response.json();

  // 3. Post-await check before writing side effects:
  signal?.throwIfAborted();

  return data;
}
```

### 4. Composite Signals via `AbortSignal.any()` (Node.js 20+)

Often, an operation must abort if **either** the caller cancels the request **or** a local timeout expires:

```javascript
// Node.js code
async function fetchWithDeadlineAndCancel(url, externalSignal, timeoutMs) {
  // 1. Create a timeout signal that aborts automatically after timeoutMs:
  const timeoutSignal = AbortSignal.timeout(timeoutMs);

  // 2. Combine with the external signal:
  const combinedSignal = AbortSignal.any(
    externalSignal ? [externalSignal, timeoutSignal] : [timeoutSignal]
  );

  const response = await fetch(url, { signal: combinedSignal });
  return await response.json();
}
```

### 5. Safe Retries: Idempotency and Exponential Backoff with Jitter

**The Cardinal Rule:** Never retry non-idempotent operations (such as charging a credit card or appending an un-keyed balance transfer) without an **Idempotency Key**.

When retrying transient infrastructure errors (HTTP 503, 429, TCP timeouts), apply **Full Jitter** to prevent the Thundering Herd problem:

$$\text{sleep} = \text{random}(0, \min(\text{cap}, \text{base} \times 2^{\text{attempt}}))$$

```javascript
// Node.js code
function calculateBackoffWithJitter(attempt, baseMs = 50, maxCapMs = 2000) {
  // Exponential growth: 50ms, 100ms, 200ms, 400ms...
  const exponentialDelay = Math.min(maxCapMs, baseMs * Math.pow(2, attempt));
  // Full Jitter: Uniformly randomized between 0 and exponentialDelay:
  return Math.floor(Math.random() * exponentialDelay);
}
```

---

## Detailed Explanations and Traces

### Trace 1: The Bounded Worker Pool Lifecycle

Consider executing 5 tasks with concurrency limit $N = 2$:

```
Tasks Queue: [ T0, T1, T2, T3, T4 ]
Workers Spawned: Worker-1, Worker-2
Shared Atomic Pointer: nextIndex = 0

Time T=0ms:
  Worker-1 claims nextIndex=0 (Task T0). nextIndex becomes 1.
  Worker-2 claims nextIndex=1 (Task T1). nextIndex becomes 2.
  Active tasks in memory: [ T0, T1 ] (Exact limit of 2 respected!)

Time T=30ms:
  Task T0 finishes.
  Worker-1 immediately loops and claims nextIndex=2 (Task T2). nextIndex becomes 3.
  Active tasks in memory: [ T1, T2 ]

Time T=50ms:
  Task T1 finishes.
  Worker-2 claims nextIndex=3 (Task T3). nextIndex becomes 4.
  Active tasks in memory: [ T2, T3 ]

Time T=70ms:
  Task T2 finishes.
  Worker-1 claims nextIndex=4 (Task T4). nextIndex becomes 5.
  Active tasks in memory: [ T3, T4 ]

Time T=90ms:
  Task T3 finishes. Worker-2 sees nextIndex >= 5 -> Exits loop.
Time T=100ms:
  Task T4 finishes. Worker-1 sees nextIndex >= 5 -> Exits loop.
  Promise.all([Worker-1, Worker-2]) resolves.
  Results returned in exact index order [ R0, R1, R2, R3, R4 ]!
```

---

## Code Examples

### 1. Production Bounded Task Runner with Stop Policies

```javascript
// Node.js code
async function runBoundedTasks(tasks, concurrencyLimit, options = {}) {
  const { signal, stopOnError = true } = options;

  if (!Number.isInteger(concurrencyLimit) || concurrencyLimit < 1) {
    throw new RangeError("concurrencyLimit must be a positive integer");
  }

  const results = new Array(tasks.length);
  const errors = [];
  let nextTaskIndex = 0;
  let isHalted = false;

  async function poolWorker() {
    while (!isHalted && nextTaskIndex < tasks.length) {
      if (signal?.aborted) {
        isHalted = true;
        break;
      }

      const currentIndex = nextTaskIndex++;
      const taskFn = tasks[currentIndex];

      try {
        // Execute task passing signal
        results[currentIndex] = await taskFn(signal);
      } catch (err) {
        errors.push({ index: currentIndex, error: err });
        if (stopOnError) {
          isHalted = true; // Stop subsequent tasks from being picked up
        }
      }
    }
  }

  const workerCount = Math.min(concurrencyLimit, tasks.length);
  const workers = Array.from({ length: workerCount }, () => poolWorker());

  await Promise.all(workers);

  if (signal?.aborted) {
    throw signal.reason ?? new Error("Task runner aborted");
  }

  return {
    results,
    errors,
    completedCount: results.filter((r) => r !== undefined).length,
    failedCount: errors.length,
  };
}

// Verification:
const sampleTasks = [
  async () => "Result A",
  async () => "Result B",
  async () => { throw new Error("Task C Failed"); },
  async () => "Result D",
];

runBoundedTasks(sampleTasks, 2, { stopOnError: false })
  .then((report) => {
    console.log("Runner Completed (stopOnError=false):");
    console.log("Success count:", report.completedCount); // 3
    console.log("Error count:", report.failedCount); // 1
  });
```

### 2. Resilient Retrier with Exponential Backoff and Full Jitter

```javascript
// Node.js code
async function retryWithJitter(operationFn, options = {}) {
  const {
    maxAttempts = 3,
    baseDelayMs = 50,
    maxDelayMs = 1000,
    signal,
    isRetryable = (err) => true,
  } = options;

  let attempt = 0;

  while (attempt < maxAttempts) {
    signal?.throwIfAborted();

    try {
      return await operationFn(attempt);
    } catch (error) {
      attempt++;

      // Non-retryable error or exhausted attempts:
      if (attempt >= maxAttempts || !isRetryable(error)) {
        throw error;
      }

      // Calculate jittered exponential backoff
      const rawDelay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
      const jitteredSleep = Math.floor(Math.random() * rawDelay);

      console.log(`[RETRY] Attempt ${attempt} failed: "${error.message}". Backing off for ${jitteredSleep}ms...`);

      // Sleep with abort listener cleanup:
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, jitteredSleep);
        if (signal) {
          signal.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              reject(signal.reason);
            },
            { once: true }
          );
        }
      });
    }
  }
}
```

---

## Tricky Points and Gotchas

### 1. `Promise.race` Timeout Does NOT Cancel the Underlying Promise!

Wrapping a task in `Promise.race([task(), timeout])` only causes the *caller* to stop waiting. The underlying `task()` continues executing on the event loop, holding socket connections and writing data. True cancellation requires passing an `AbortSignal` directly into the worker logic!

### 2. Retrying Non-Transient Errors

Blindly retrying all errors creates cascading failures:
- **Transient (Retryable):** Network socket drops (`ECONNRESET`), HTTP 503 Service Unavailable, HTTP 429 Rate Limit.
- **Permanent (Non-Retryable):** HTTP 400 Bad Request, HTTP 401 Unauthorized, HTTP 404 Not Found, Validation Schema mismatches. Retrying a 400 Bad Request will fail 100% of the time while wasting CPU and server capacity.

### 3. Memory Leaks in AbortSignal Listeners

Attaching event listeners to long-lived `AbortSignal` instances without cleanup leaks memory:

```javascript
// Node.js code
// ❌ LEAK: Listener attached to long-lived signal is never removed!
function watchCancel(signal) {
  signal.addEventListener("abort", () => {
    console.log("Cancelled");
  });
}

// ✅ FIX: Use { once: true } or explicitly remove the listener in a finally block:
function watchCancelClean(signal) {
  const onAbort = () => console.log("Cancelled");
  signal.addEventListener("abort", onAbort, { once: true });
}
```

---

## Hands-on Exercise: Building an Idempotent Asset Syncer

### Problem Statement

You are building a cloud storage sync worker that migrates 100 assets to an S3-compatible bucket. It must:
1. Limit active simultaneous uploads to 4.
2. Observe an external `AbortSignal` for graceful shutdown.
3. Retry transient network drops using jittered backoff (up to 3 times).
4. Preserve input-to-output array mapping for status verification.

### Buggy Implementation

```javascript
// Node.js code
// ❌ BUGS:
// 1. Promise.all map runs all 100 uploads at once, exceeding socket limits
// 2. Ignores abort signal
// 3. Blindly retries without jitter, causing thundering herd crashes
async function syncAssetsBad(assets, uploader) {
  return Promise.all(
    assets.map(async (asset) => {
      let tries = 0;
      while (tries < 3) {
        try {
          return await uploader.upload(asset);
        } catch (e) {
          tries++;
          await new Promise((r) => setTimeout(r, 100)); // Fixed sleep: Thundering herd!
        }
      }
    })
  );
}
```

### Edge Cases to Address

1. Bounded concurrency (limit: 4 workers).
2. AbortSignal cancellation propagation before and during upload.
3. Full jitter exponential backoff on retryable upload failures.

### Verified Solution

```javascript
// Node.js code
async function syncAssetsResilient(assets, uploader, options = {}) {
  const { concurrency = 4, signal } = options;

  const results = new Array(assets.length);
  let nextIndex = 0;

  async function uploadWorker() {
    while (nextIndex < assets.length) {
      signal?.throwIfAborted();

      const currentIndex = nextIndex++;
      const asset = assets[currentIndex];

      // Execute upload with jittered retry policy:
      results[currentIndex] = await retryWithJitter(
        async (attempt) => {
          return await uploader.upload(asset, signal);
        },
        {
          maxAttempts: 3,
          baseDelayMs: 40,
          maxDelayMs: 500,
          signal,
          isRetryable: (err) => err.isTransient === true,
        }
      );
    }
  }

  const workerCount = Math.min(concurrency, assets.length);
  await Promise.all(Array.from({ length: workerCount }, () => uploadWorker()));

  return results;
}

// Verification:
const mockUploader = {
  async upload(asset, signal) {
    signal?.throwIfAborted();
    // Simulate transient failure on asset 2:
    if (asset.id === 2 && !asset.retried) {
      asset.retried = true;
      const err = new Error("Socket Timeout");
      err.isTransient = true;
      throw err;
    }
    return { assetId: asset.id, uploaded: true, key: `s3://${asset.name}` };
  },
};

const assetList = [
  { id: 1, name: "image1.png" },
  { id: 2, name: "image2.png" },
  { id: 3, name: "video.mp4" },
  { id: 4, name: "document.pdf" },
];

syncAssetsResilient(assetList, mockUploader, { concurrency: 2 })
  .then((synced) => {
    console.log("Successfully synced all assets with bounded concurrency:");
    console.log(synced.map((s) => s.key));
    // Output: ['s3://image1.png', 's3://image2.png', 's3://video.mp4', 's3://document.pdf']
  });
```

---

## Summary

- Unbounded concurrency (`Promise.all(items.map(fn))`) exhausts system resources; protect your services with **bounded worker pools**.
- Bounded concurrency workers preserve exact input-to-output array indexing by claiming shared queue index pointers.
- Cooperative cancellation requires passing `AbortSignal` directly into asynchronous workers; `Promise.race` timeout alone does not cancel background tasks.
- Use `AbortSignal.any()` to combine parent cancellation signals and local timeouts.
- Never retry non-idempotent operations without idempotency keys.
- Prevent Thundering Herd server crashes by applying **Exponential Backoff with Full Jitter** to transient retries.
- Always clean up abort event listeners with `{ once: true }` to prevent memory leaks.

---

## Cheat Sheet

### Concurrency Patterns Decision Matrix

| Pattern | Throughput | Resource Safety | Ordering | Best Used For |
| :--- | :--- | :--- | :--- | :--- |
| **Serial (`for...of await`)** | Lowest ($1$ at a time) | Maximum | Sequential | Dependent steps where Step B requires Step A |
| **Unbounded (`Promise.all`)** | Highest (Spike) | Dangerous ($N$ sockets) | Guaranteed | Small, fixed arrays ($N < 20$) |
| **Bounded Worker Pool** | Controlled ($K$ workers) | High (Strictly capped) | Guaranteed | Batch migrations, bulk database updates |
| **Streaming Queue** | Continuous | High | Completion-order | Real-time event ingestion pipes |

### Cancellation & Signal API Quick Reference

| Method | Behavior | Use Case |
| :--- | :--- | :--- |
| `signal.aborted` | Returns `true` if aborted | Polling before starting expensive work |
| `signal.throwIfAborted()` | Throws `signal.reason` immediately | Clean pre-flight checks inside async loops |
| `AbortSignal.timeout(ms)` | Creates signal that aborts after $ms$ | Standard request deadlines |
| `AbortSignal.any([s1, s2])` | Aborts when *either* $s1$ or $s2$ aborts | Combining caller aborts with local timeouts |

---

## Interview Questions & Deep Dives

### 1. How does a Bounded Concurrency Worker Pool preserve input-to-output array ordering in JavaScript?

**Question:** When processing 1,000 asynchronous tasks with a concurrency limit of 10, task #3 may take 500ms while task #4 takes 10ms. How do you guarantee the returned results array matches the input order without sorting?

**Answer:**
A bounded worker pool maintains a pre-allocated array of size $N$ (`const results = new Array(tasks.length)`) and a shared atomic index counter (`let nextIndex = 0`).

1. When a worker becomes available, it claims the current index atomically: `const currentIndex = nextIndex++`.
2. The worker retrieves the corresponding task function: `const task = tasks[currentIndex]`.
3. The worker executes the task: `const result = await task()`.
4. Regardless of how long the task took to complete or how many other workers completed in the interim, the worker assigns the outcome directly to its pre-allocated slot: `results[currentIndex] = result`.

Because the assignment is keyed by the original index (`results[currentIndex]`), the array preserves exact input order without any post-processing sort step.

---

### 2. Why does `Promise.race` with a timeout NOT cancel an ongoing asynchronous database operation?

**Question:** An engineer implements a timeout pattern as `await Promise.race([queryDatabase(), timeoutPromise(5000)])`. Why will the database query continue running if the timeout expires, and what are the system consequences?

**Answer:**
`Promise.race` is merely a state observer; it resolves or rejects with the fate of the first settled promise in the array. When the timeout promise rejects at 5,000ms:
1. `Promise.race` immediately rejects to alert the caller.
2. However, the Promise returned by `queryDatabase()` was already dispatched to the database driver and the operating system's TCP network stack.
3. The Node.js event loop and database server have **no awareness** that the caller stopped waiting.
4. The database continues executing the expensive query, consuming CPU, disk I/O, and locking table rows. When the query completes, the database driver sends the response packets back to Node.js, where they are silently discarded because no listeners remain.

**Consequence & Fix:**
Under load, timed-out queries stack up on the database, worsening the slowdown.
**Fix:** Pass an `AbortSignal` into the database driver (`db.query(sql, { signal })`). When the timeout occurs, call `controller.abort()`. The driver sends a cancellation packet (or closes the TCP socket) to instruct the database engine to immediately abort the query and roll back.

---

### 3. What is the "Thundering Herd" problem in distributed systems, and how does Exponential Backoff with Jitter resolve it?

**Question:** When an upstream payment service experiences a 30-second outage, why does fixed-interval retrying cause the service to crash again immediately upon recovery, and how does Jitter solve it?

**Answer:**
**The Thundering Herd Problem:**
If 10,000 incoming requests fail during the outage and all use standard exponential backoff without jitter (e.g. sleep exactly 2s, then 4s, then 8s):
- The requests become synchronized in lock-step.
- When the payment service boots back up, all 10,000 requests fire at the **exact same millisecond**.
- This instantaneous traffic spike overwhelms the recovering service's connection pool, immediately crashing it again (the Thundering Herd).

**The Solution: Full Jitter:**
Instead of fixed delays, randomize the sleep duration uniformly across the exponential window:
$$\text{delay} = \text{random}(0, \min(\text{cap}, \text{base} \times 2^{\text{attempt}}))$$
This desynchronizes the retries, spreading the 10,000 requests smoothly over a wide time spectrum and allowing the recovering dependency to process traffic without being overwhelmed.

---

### 4. What are the memory risks associated with passing `AbortSignal` into short-lived asynchronous operations?

**Question:** How can using `AbortController` in a high-throughput Node.js HTTP server inadvertently introduce a massive memory leak?

**Answer:**
Memory leaks occur when event listeners attached to an `AbortSignal` are never removed.

If a server creates a long-lived `AbortController` (e.g. tied to process shutdown or a long-lived WebSocket session), and every incoming HTTP request attaches an abort listener to that shared signal:
```javascript
sharedSignal.addEventListener("abort", () => {
  cleanupRequest(req);
});
```
When an HTTP request completes successfully, the listener closure **remains attached to `sharedSignal`'s internal listener array**. Because `sharedSignal` is long-lived, it retains strong references to the request closures, socket objects, and response buffers for all past requests. After serving tens of thousands of requests, process memory climbs until the process crashes with `OOM`.

**Prevention:**
1. Always pass `{ once: true }` if the listener only fires on shutdown.
2. In request workflows, always remove the event listener inside a `finally` block:
   ```javascript
   try {
     signal.addEventListener("abort", onAbort);
     await doWork();
   } finally {
     signal.removeEventListener("abort", onAbort);
   }
   ```
3. Use scoped signals (`AbortSignal.timeout(ms)`) whose lifecycle is naturally bound to the individual request.

---

<nav aria-label="Lecture navigation">

[← Previous Day: Day 26 - JavaScript Boundaries in Services](day-26-javascript-boundaries-for-services.md) | [Roadmap](../javascript-roadmap.md) | [Next Day: Day 28 - Senior JavaScript Integration and Review →](day-28-senior-javascript-interview-integration.md)

</nav>
