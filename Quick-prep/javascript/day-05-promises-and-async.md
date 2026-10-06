# Day 5: Modules, Promises, and Scheduling

## Modules

**1. ES modules**

`import`/`export` use module scope and live bindings; static imports are linked before module evaluation.

```js
import { total } from "./state.js"; // reads the exported binding
```

**2. Dynamic import and cycles**

`import()` loads asynchronously; cycles can expose a binding before it has initialized.

```js
const module = await import("./feature.js");
```

**3. CommonJS interop**

`require`/`module.exports` are Node.js behavior, not ECMAScript syntax; package metadata and Node version affect interop.

[Full topic](../../Javascript/javascript-lectures/day-17-modules-and-interoperability.md)

## Promises and async functions

**1. Promise lifecycle and chaining**

A promise settles once; `.then()` creates a new promise and adopts returned promises/thenables.

```js
Promise.resolve(2).then(value => value + 1); // fulfills with 3
```

**2. Promise combinators**

`all` rejects on any rejection; `allSettled` reports all outcomes; `race` returns the first settlement; `any` returns the first fulfillment.

```js
await Promise.all([loadUser(), loadOrders()]); // independent work
```

**3. `async`/`await` and errors**

An async function always returns a promise; `await` suspends its continuation and throws on rejection at that point.

**4. Sequential and concurrent work**

Await dependent operations in order; start independent operations together and bound concurrency for large batches.

[Promises](../../Javascript/javascript-lectures/day-18-promises-and-composition.md) | [Async errors and cleanup](../../Javascript/javascript-lectures/day-19-async-await-errors-and-cleanup.md)

## Jobs and scheduling

**1. Promise jobs**

`.then` callbacks run after the current synchronous stack; they do not make CPU-heavy JavaScript parallel.

**2. Host scheduling**

Hosts add timer/I/O scheduling; Node's `process.nextTick` is not a browser or ECMAScript API.

```js
console.log("sync");
Promise.resolve().then(() => console.log("job")); // runs after sync stack
```

[Full topic](../../Javascript/javascript-lectures/day-20-jobs-microtasks-and-scheduling.md)

## Tricky points

1. **Modules**
	1.1 **Live bindings:** Imported bindings reflect exporter updates; they are not copied snapshots.
	1.2 **Cycles:** Import cycles are allowed but initialization order can expose uninitialized bindings.
2. **Promises**
	2.1 **Missing return:** Omitting `return` inside `.then()` breaks the chain and can hide downstream completion/errors.
	2.2 **`Promise.all`:** Rejection does not cancel other operations; cancellation must be supported and requested separately.
	2.3 **`try/catch`:** It catches a rejection only when awaited/thrown in that control flow; an ignored promise escapes it.
	2.4 **Timeouts:** Racing a promise against a timer does not cancel the underlying operation.
3. **Scheduling**
	3.1 **Microtasks:** Recursive microtask scheduling can delay timers and I/O.
	3.2 **Runtime order:** Do not claim one universal timer/I/O ordering across Node contexts or versions.