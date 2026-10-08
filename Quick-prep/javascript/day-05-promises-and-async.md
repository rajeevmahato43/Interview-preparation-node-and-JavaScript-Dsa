# Day 5: Modules, Promises, Async/Await, and Microtask Scheduling

Quick review of main-course lectures 17–20. Designed for rapid interview revision: ESM live bindings, Promise combinators (`all`, `allSettled`, `race`, `any`), sequential vs concurrent async loops, and microtask vs macrotask event loop execution order.

## Modules and static graph evaluation

**1. Static ESM imports vs dynamic `import()`**

Static `import` statements are hoisted and analyzed before any code executes, constructing a deterministic module dependency graph. Dynamic `import(specifier)` loads modules asynchronously at runtime, returning a Promise.

```js
// Static import: Analyzed and linked at compile time
import { config } from "./config.js";

// Dynamic import: Loaded conditionally on-demand
async function loadAnalytics() {
  if (process.env.NODE_ENV === "production") {
    const { initAnalytics } = await import("./analytics.js");
    initAnalytics();
  }
}
```

**1.1 ESM live bindings vs CJS snapshots**

ESM exports are read-only live bindings to the exporting module's memory slot. When the exporter mutates a variable, all importing modules observe the update immediately.

```js
// math.js
export let total = 0;
export const add = (n) => { total += n; };

// app.js
import { total, add } from "./math.js";
console.log(total); // 0
add(5);
console.log(total); // 5 (observed live update)
// total = 10;      // TypeError: Assignment to constant variable (read-only binding)
```

[Modules and packaging](../../Javascript/javascript-lectures/day-17-modules-and-interoperability.md)

## Promise states, constructor mechanics, and combinators

**1. The Promise lifecycle and state machine**

A Promise transitions from `pending` to either `fulfilled` or `rejected` exactly once. Calling `resolve()` or `reject()` multiple times has no effect on an already settled Promise.

```js
const p = new Promise((resolve, reject) => {
  resolve("Success");
  reject(new Error("Ignored")); // Ineffective: promise already fulfilled
});
p.then((val) => console.log(val)); // "Success"
```

**2. The four Promise composition combinators**

Understand when to use each combinator in production:
- **`Promise.all(iterable)`:** Short-circuits on the *first* rejection; fulfills when all succeed. Ideal for parallel operations that all must succeed.
- **`Promise.allSettled(iterable)`:** Waits for *all* promises regardless of outcome. Never rejects; returns an array of `{ status: "fulfilled", value }` or `{ status: "rejected", reason }`. Ideal for batch processing.
- **`Promise.race(iterable)`:** Settles with the outcome of the *first* promise to settle (fulfill or reject). Ideal for timeouts.
- **`Promise.any(iterable)`:** Fulfills with the *first* fulfilled promise; rejects with an `AggregateError` only if *all* promises fail. Ideal for redundant fallback services.

```js
const p1 = Promise.resolve(10);
const p2 = Promise.reject(new Error("Fail"));
const p3 = Promise.resolve(30);

// all: Rejects immediately because p2 fails
Promise.all([p1, p2, p3]).catch((err) => console.log("all rejected:", err.message));

// allSettled: Always resolves with complete audit trail
const results = await Promise.allSettled([p1, p2, p3]);
// [ { status: 'fulfilled', value: 10 }, { status: 'rejected', reason: ... }, { status: 'fulfilled', value: 30 } ]

// any: Resolves with first success (10), ignoring p2
const firstSuccess = await Promise.any([p2, p1, p3]); // 10
```

[Promises and composition](../../Javascript/javascript-lectures/day-18-promises-and-composition.md)

## Async/await, error propagation, and loop concurrency

**1. Async function return contract**

Every `async` function wraps its return value in a Promise and unwinds errors as rejected Promises. An unhandled rejection inside an async function crashes modern Node processes.

```js
async function getData() {
  return 42; // Wrapped as Promise.resolve(42)
}
console.log(getData() instanceof Promise); // true
```

**2. Sequential vs Concurrent iteration**

Never use `array.forEach` with an async callback: `forEach` does not await promises and executes all iterations concurrently without handling rejection errors.

```js
const ids = [1, 2, 3];

// 1. Sequential execution: Each request waits for previous to finish
for (const id of ids) {
  await fetchItem(id); // Runs sequentially: 1 then 2 then 3
}

// 2. Concurrent execution: Launches all in parallel with bounded completion
await Promise.all(ids.map((id) => fetchItem(id)));

// 3. INCORRECT: forEach ignores async returned promises!
// ids.forEach(async (id) => await fetchItem(id)); // Uncontrolled concurrent firing!
```

[Async/await and errors](../../Javascript/javascript-lectures/day-19-async-await-errors-and-cleanup.md)

## Event loop scheduling: Microtasks vs Macrotasks

**1. Microtask queue priority**

The event loop processes one macrotask from the task queue (e.g., Timers, I/O callbacks), then immediately **drains all pending microtasks** (`Promise.then`, `queueMicrotask`, `process.nextTick`) until the microtask queue is completely empty before moving to the next macrotask.

```js
console.log("1. Sync Start");

setTimeout(() => {
  console.log("5. Macrotask (setTimeout)");
}, 0);

Promise.resolve().then(() => {
  console.log("3. Microtask 1");
}).then(() => {
  console.log("4. Microtask 2");
});

queueMicrotask(() => {
  console.log("2. Microtask (queueMicrotask)");
});

console.log("Sync End");

// Output Order:
// 1. Sync Start
// Sync End
// 3. Microtask 1
// 2. Microtask (queueMicrotask)
// 4. Microtask 2
// 5. Macrotask (setTimeout)
```

[Jobs, microtasks, and scheduling](../../Javascript/javascript-lectures/day-20-jobs-microtasks-and-scheduling.md)

## Tricky points

1. **Promises and errors**

**1.1 `Promise.all` fail-fast leaves ghost operations running**
If one promise in `Promise.all([p1, p2, p3])` rejects, the returned promise rejects immediately; however, the other promises continue executing in the background unmonitored. Use `AbortController` to cancel in-flight operations.

**1.2 Accidental truthy test on unawaited promises**
Forgetting `await` on an async function (`if (isAuthorized())`) evaluates the pending `Promise` object as truthy, bypassing authentication checks.

2. **Async iteration**

**1.3 Sequential bottlenecks from unneeded `await` in loops**
Awaiting independent network queries inside a `for` loop forces them to execute sequentially, multiplying total latency by $N$. Use `Promise.all()` for independent queries.

**1.4 Swallowing errors in `.catch()`**
Returning `undefined` inside `.catch(err => {})` marks the Promise chain as fulfilled with value `undefined`. Downstream consumers receive `undefined` rather than detecting a failure.

3. **Event loop scheduling**

**1.5 Microtask queue starvation**
Chaining infinite microtasks via recursive `Promise.resolve().then(recurse)` starves the event loop entirely; the engine never yields to macrotasks (Timers, I/O, or rendering).

**1.6 `setTimeout(fn, 0)` is not zero milliseconds**
The HTML5 and Node specifications enforce a minimum timer clamping of 1ms (or 4ms after multiple nested timers); synchronous code and all microtasks always execute before any 0ms timer.