# Day 14: Iterables, Iterators, Generators, and Symbols

<nav aria-label="Lecture navigation">

[← Day 13: Destructuring, Spread, and Modern Operators](day-13-destructuring-spread-and-modern-operators.md) | [Roadmap](../javascript-roadmap.md) | [Day 15: Regular Expressions and Text Processing →](day-15-regular-expressions-and-text-processing.md)

</nav>

---

## What You Will Learn Today

By the end of this lecture, you should be able to:

- Distinguish an **Iterable** (an object implementing `[Symbol.iterator]()`) from an **Iterator** (an object with a `next()` method).
- Trace the step-by-step mechanics of the Iterable protocol under `for...of`, array spread (`[...iterable]`), and `Array.from()`.
- Implement custom iterable objects that generate independent, reusable iterator instances.
- Write generator functions (`function*`) and control execution suspension and resumption with `yield`.
- Implement two-way data flow: sending values into generators using `generator.next(value)`.
- Use `yield*` to delegate iteration to other iterables or sub-generators seamlessly.
- Enforce resource cleanup during premature iteration exits (`break`, `return()`, `throw()`) using `try...finally`.
- Build memory-efficient lazy pipelines for streaming large datasets and paginated API responses in Node.js.

**Prerequisites:** [Day 05 – Control Flow and Loops](day-05-control-flow-and-loops.md) (`for...of` loops), [Day 06 – Functions, Parameters, and Callbacks](day-06-functions-parameters-and-callbacks.md), and [Day 12 – Built-in Data Structures and Serialization](day-12-built-in-data-structures-and-serialization.md).  
*Upcoming Connections:* [Day 16](day-16-symbols-reflection-and-proxies.md) expands well-known symbols and reflection; [Day 19](day-19-async-await-errors-and-cleanup.md) introduces asynchronous iteration (`for await...of` and `Symbol.asyncIterator`).

---

## Quick Vocabulary Card

| Term | Definition |
| :--- | :--- |
| **Iterable Protocol** | An ECMAScript standard requiring an object to define a `[Symbol.iterator]` method that returns an iterator. |
| **Iterator Protocol** | An ECMAScript standard requiring an object to implement a `next()` method returning `{ value: any, done: boolean }`. |
| **`Symbol.iterator`** | A built-in well-known symbol used as the method key that specifies an object’s default iteration behavior. |
| **Generator Function (`function*`)** | A special constructor-like function syntax that returns a `Generator` object and can be paused and resumed. |
| **`yield` Keyword** | An operator used inside a generator to suspend execution and emit a value to the caller. |
| **`yield*` Expression** | An operator that delegates iteration to another iterable or generator, yielding each of its elements sequentially. |
| **Lazy Evaluation** | A computation strategy where values are calculated on-demand only when requested by the consumer, saving memory. |
| **Iterator Return (`return()`)** | An optional iterator method invoked automatically when iteration terminates prematurely (e.g., via `break`). |

---

## 1. Iterable vs. Iterator: The Core Protocols

JavaScript defines two distinct but complementary protocols that power all modern collection iteration: the **Iterable Protocol** and the **Iterator Protocol**.

```
                   The Iteration Architecture
┌─────────────────────────┐
│     Iterable Object     │
│   (Array, Map, Set)     │
│   [Symbol.iterator]()   │─── returns ───┐
└─────────────────────────┘               │
                                          ▼
                             ┌─────────────────────────┐
                             │     Iterator Object     │
                             │   next()                │─── produces ───┐
                             └─────────────────────────┘                │
                                                                        ▼
                                                           ┌─────────────────────────┐
                                                           │     IteratorResult      │
                                                           │   { value, done }       │
                                                           └─────────────────────────┘
```

### The Iterable Protocol

An object is **iterable** if it has a method keyed by `Symbol.iterator` that returns an iterator object without arguments:
- Built-in iterables include: `Array`, `String`, `Map`, `Set`, `TypedArray`, and `arguments`.
- Plain objects `{}` do **not** implement `[Symbol.iterator]` by default.

### The Iterator Protocol

An object is an **iterator** if it implements a **`next()`** method that takes zero or one argument and returns an **IteratorResult** object with two properties:
1. **`value`**: The current yielded value.
2. **`done`**: A boolean indicating whether iteration has finished (`true` when complete).

```js
// Node.js code
const colors = ["cyan", "magenta"];

// 1. Obtain the iterator from the iterable array
const iterator = colors[Symbol.iterator]();

// 2. Consume items by calling next() manually
console.log(iterator.next()); // { value: 'cyan', done: false }
console.log(iterator.next()); // { value: 'magenta', done: false }
console.log(iterator.next()); // { value: undefined, done: true }

// Subsequent calls stay completed
console.log(iterator.next()); // { value: undefined, done: true }
```

### Language Consumers of the Iterable Protocol

Whenever you use:
- **`for...of` loops**
- **Spread syntax (`[...iterable]`)**
- **`Array.from(iterable)`**
- **`Promise.all(iterable)` / `Promise.race(iterable)`**
- **`new Set(iterable)` / `new Map(iterable)`**

JavaScript automatically queries `iterable[Symbol.iterator]()` and consumes it using the Iterator protocol.

---

## 2. Implementing Custom Iterables

To make any custom business object iterable, attach a method under the computed property key `[Symbol.iterator]`.

> **Crucial Rule:** The iterable itself should **not** store iteration state directly. Each invocation of `[Symbol.iterator]()` must return a **fresh, independent iterator** so that multiple loops can iterate over the object concurrently without interfering with each other.

```js
// Node.js code
class NumberRange {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  // ✅ Implement the Iterable Protocol
  [Symbol.iterator]() {
    let current = this.start;
    const terminal = this.end;

    // Return a fresh Iterator object
    return {
      next() {
        if (current <= terminal) {
          return { value: current++, done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
}

const range = new NumberRange(1, 3);

// Consumed via spread:
console.log([...range]); // [ 1, 2, 3 ]

// Multiple independent loops work concurrently:
for (const x of range) {
  for (const y of range) {
    // Both inner and outer loops maintain independent iterators!
  }
}
```

---

## 3. Generator Functions (`function*`) and `yield`

Writing manual iterator objects requires boilerplate state tracking. **Generator functions (`function*`)** provide a powerful, declarative alternative.

When invoked, a generator function does **not** execute its body immediately. Instead, it returns a **Generator object** that implements both the Iterable and Iterator protocols.

```js
// Node.js code
function* sequenceGenerator() {
  console.log("Starting sequence...");
  yield "Step 1: Parse";
  console.log("Resuming to Step 2...");
  yield "Step 2: Validate";
  console.log("Finishing...");
  return "Completed";
}

const gen = sequenceGenerator(); // Body has NOT run yet!

console.log(gen.next()); // logs "Starting sequence...", returns { value: 'Step 1: Parse', done: false }
console.log(gen.next()); // logs "Resuming to Step 2...", returns { value: 'Step 2: Validate', done: false }
console.log(gen.next()); // logs "Finishing...", returns { value: 'Completed', done: true }
console.log(gen.next()); // returns { value: undefined, done: true }
```

### The Return Value Trap in Generators

A generator's `return "Completed"` produces `{ value: "Completed", done: true }`.

However, **standard iteration constructs (`for...of`, `[...gen]`, `Array.from()`) discard the return value when `done: true`**!

```js
// Node.js code
function* returnExample() {
  yield 1;
  yield 2;
  return 3; // ⚠️ Discarded by for...of!
}

console.log([...returnExample()]); // [ 1, 2 ] (Notice 3 is missing!)
```

> **Rule:** Use `yield` to emit all data intended for consumers. Use `return` only for early termination or metadata intended exclusively for manual `.next()` callers.

---

## 4. Two-Way Communication: Passing Values into Generators

The `yield` expression is a two-way street: not only does it emit values to the caller, but it also evaluates to whatever argument is passed to the next call to `.next(arg)`.

```js
// Node.js code
function* conversationFlow() {
  // 1. Pauses here and yields the prompt
  const user = yield "Enter your username:";
  
  // 2. 'user' holds the value passed in from the subsequent next() call
  const role = yield `Welcome ${user}! Enter your role:`;

  return `User ${user} granted ${role} permissions`;
}

const session = conversationFlow();

// ⚠️ First next() call starts the generator; any argument passed here is IGNORED!
const q1 = session.next(); 
console.log(q1.value); // "Enter your username:"

// Second next() sends "alice" into the first yielded pause
const q2 = session.next("alice");
console.log(q2.value); // "Welcome alice! Enter your role:"

// Third next() sends "admin" into the second yielded pause
const finalResult = session.next("admin");
console.log(finalResult.value); // "User alice granted admin permissions"
```

---

## 5. Delegation with `yield*`

The **`yield*`** operator delegates iteration to another iterable object (an Array, a Set, or another generator), yielding each of its items as if they were emitted by the parent generator.

```js
// Node.js code
function* subTask() {
  yield "Subtask A";
  yield "Subtask B";
  return "Subtask Result"; // Can be captured by parent generator
}

function* mainWorkflow() {
  yield "Init";
  
  // ✅ Delegate iteration to subTask generator
  const subResult = yield* subTask();
  console.log("Delegated return value captured:", subResult);

  // ✅ Delegate iteration to built-in array
  yield* [10, 20];

  yield "Done";
}

console.log([...mainWorkflow()]);
// Output: [ 'Init', 'Subtask A', 'Subtask B', 10, 20, 'Done' ]
```

---

## 6. Generator Lifecycle and Cleanup: `return()` and `throw()`

Generators can manage active system resources (file handles, database connections, socket streams). When a consumer stops iterating early (e.g., using `break`), the engine invokes the iterator's `.return()` method, triggering any enclosing `finally` blocks.

```js
// Node.js code
function* openResourceStream() {
  console.log("1. Allocating resource handle");
  try {
    yield "Chunk 1";
    yield "Chunk 2";
    yield "Chunk 3";
  } finally {
    // ✅ Guaranteed cleanup runs on normal completion OR early exit!
    console.log("2. Guaranteed cleanup: Closing resource handle");
  }
}

// Scenario 1: Early loop break triggers finally cleanup automatically
for (const chunk of openResourceStream()) {
  console.log("Received:", chunk);
  if (chunk === "Chunk 1") {
    break; // Loop terminates early!
  }
}
// Logs:
// 1. Allocating resource handle
// Received: Chunk 1
// 2. Guaranteed cleanup: Closing resource handle
```

### Injecting Errors with `generator.throw()`

You can inject an exception directly into a suspended generator at its paused `yield` position using `.throw(error)`:

```js
// Node.js code
function* resilientWorker() {
  try {
    yield "Working...";
  } catch (err) {
    yield `Recovered from: ${err.message}`;
  }
}

const worker = resilientWorker();
worker.next(); // Pauses at yield "Working..."

// Inject exception into the generator's paused state
const recovery = worker.throw(new Error("Network glitch"));
console.log(recovery.value); // "Recovered from: Network glitch"
```

---

## 7. Lazy Evaluation and Infinite Streams

**Lazy evaluation** computes values on-demand only when requested. This enables generators to model infinite streams or large datasets without allocating massive arrays in RAM.

```js
// Node.js code
// Infinite ID generator: uses zero memory for unrequested IDs
function* idGenerator(prefix = "id") {
  let counter = 1;
  while (true) {
    yield `${prefix}_${counter++}`;
  }
}

const gen = idGenerator("tx");

// Take only what you need:
console.log(gen.next().value); // "tx_1"
console.log(gen.next().value); // "tx_2"
console.log(gen.next().value); // "tx_3"

// ❌ Never spread an infinite generator:
// [...idGenerator()]; // Fatal crash: RangeError: Maximum call stack size or out of memory!
```

---

## Tricky Points

### 1. `for...of` Discards Generator Return Value
When a generator returns `{ value: "x", done: true }`, `for...of` and spread ignore `"x"`. Use `yield` to output values.

### 2. Passing Arguments to the First `next()`
The argument passed to the first call of `gen.next(arg)` is silently ignored because no `yield` expression is waiting to receive it.

### 3. Iterators are Single-Use; Iterables are Multi-Use
An iterator maintains internal state and cannot be reset once exhausted. An iterable can be iterated repeatedly because each `[Symbol.iterator]()` call creates a fresh iterator.

### 4. Generators are Synchronous Pauses
A generator's `yield` suspends the generator function, but it does **not** pause the JavaScript event loop or block other asynchronous operations.

### 5. Plain Objects are Not Iterables
Attempting `for (const x of { a: 1 })` throws `TypeError: (intermediate value) is not iterable`. Use `Object.entries(obj)` or `Object.keys(obj)`.

---

## Hands-on Exercise

### Scenario: High-Volume Paginated Database Cursor

You are building a database querying abstraction in Node.js. Large database queries must be fetched in batches (pages) to conserve server memory, but consumers must be able to iterate over individual records smoothly using `for...of`.

### Buggy Code

```js
// Node.js code (Buggy Implementation)
function* createDatabaseCursorBuggy(fetchPageFn, maxPages) {
  // Bug 1: Loads all pages eagerly into memory at startup
  const allRecords = [];
  for (let p = 1; p <= maxPages; p++) {
    allRecords.push(...fetchPageFn(p));
  }

  // Bug 2: Emits from massive array instead of lazy fetching
  for (const item of allRecords) {
    yield item;
  }
}
```

### Acceptance Criteria

1. **Lazy Page Fetching:** Pages must be fetched from the database **only when** the consumer requests an item from that page.
2. **Infinite or Bounded Stream:** Support iterating until the fetch function returns an empty batch or reaches `maxPages`.
3. **Guaranteed Teardown:** Ensure database cursor cleanup executes using `try...finally` if the consumer breaks out of the loop early.
4. **Zero Pre-Allocation:** Avoid accumulating records in an in-memory buffer.

### Solution

```js
// Node.js code
function* createDatabaseCursor(fetchPageFn, { pageSize = 2, maxPages = 5 } = {}) {
  let currentPage = 1;
  let cursorOpened = false;

  try {
    cursorOpened = true;
    console.log("[DB] Cursor opened");

    while (currentPage <= maxPages) {
      // Lazy fetch: occurs only when needed
      console.log(`[DB] Fetching page ${currentPage}...`);
      const batch = fetchPageFn(currentPage, pageSize);

      if (!batch || batch.length === 0) {
        break; // No more records
      }

      // Yield each record individually from current batch
      yield* batch;

      currentPage++;
    }
  } finally {
    // Guaranteed cleanup on completion or early break
    if (cursorOpened) {
      console.log("[DB] Cursor safely closed and connection released");
    }
  }
}

// --- Verification Tests ---

// Mock database page fetcher
function mockDb(page, size) {
  if (page > 3) return []; // 3 pages total
  return [
    { id: `rec_${(page - 1) * size + 1}` },
    { id: `rec_${(page - 1) * size + 2}` }
  ];
}

// Test 1: Full consumption
console.log("--- Test 1: Full Consumption ---");
const cursor1 = createDatabaseCursor(mockDb, { pageSize: 2, maxPages: 5 });
for (const record of cursor1) {
  console.log("Processed:", record.id);
}

// Test 2: Early break triggers finally cleanup immediately
console.log("\n--- Test 2: Early Termination ---");
const cursor2 = createDatabaseCursor(mockDb, { pageSize: 2, maxPages: 5 });
for (const record of cursor2) {
  console.log("Processed early:", record.id);
  if (record.id === "rec_2") {
    console.log("Stopping early!");
    break; // Breaks during first page!
  }
}
```

---

## Summary

- **Iterable vs. Iterator:** An Iterable implements `[Symbol.iterator]()` to produce an Iterator. An Iterator implements `next()` returning `{ value, done }`.
- **Custom Iterables:** Make custom domain objects iterable by implementing `[Symbol.iterator]()`, returning a fresh iterator instance per call.
- **Generators (`function*`):** Declarative state machines that suspend execution at `yield` and resume on `.next()`.
- **Two-Way Flow:** Pass data out via `yield value` and receive data in via `const input = yield`.
- **Delegation with `yield*`:** Seamlessly delegates iteration to other iterables or child generators.
- **Guaranteed Cleanup:** `try...finally` inside generators executes cleanup when iteration completes or when terminated early via `.return()`.
- **Lazy Evaluation:** Yields items on demand, enabling unbounded streams and low-memory data pipelines.

---

## Cheat Sheet

### Protocols Quick Reference

| Entity | Required Method | Return Value | Example |
| :--- | :--- | :--- | :--- |
| **Iterable** | `[Symbol.iterator]()` | Iterator object | `Array`, `Map`, `Set`, `String` |
| **Iterator** | `next(val)` | `{ value: any, done: boolean }` | Result of `arr[Symbol.iterator]()` |
| **Generator** | Implements both! | Self-iterable Iterator | Result of `function*()` |

### Generator Methods

| Method | Behavior |
| :--- | :--- |
| **`gen.next(value)`** | Resumes generator, evaluates current `yield` to `value`, runs to next `yield`. |
| **`gen.return(value)`** | Terminates generator immediately, runs `finally` blocks, returns `{ value, done: true }`. |
| **`gen.throw(error)`** | Injects `error` into generator at paused location; handled by generator's `try/catch`. |

### Common Pitfalls

- **Attempting to iterate plain objects with `for...of`** → throws `TypeError`. Use `Object.entries(obj)`.
- **Spreading an infinite generator** → causes an Out-Of-Memory (OOM) crash.
- **Relying on a generator's `return value` in `for...of`** → discarded by language iteration constructs.
- **Passing an argument to the first `next()` call** → ignored by the engine.

---

## Interview Questions

### 1. What is the difference between an Iterable and an Iterator?

**Question:** Explain the difference between an Iterable and an Iterator in JavaScript. Why can an Array be iterated multiple times with `for...of`, whereas a Generator object often cannot?

**Answer:**
1. **The Separation of Responsibilities:**
   - **Iterable:** An object that adheres to the **Iterable protocol** by implementing a `[Symbol.iterator]()` method. Its sole responsibility is to act as a factory that manufactures iterator instances.
   - **Iterator:** An object that adheres to the **Iterator protocol** by implementing a `next()` method that tracks stateful traversal and returns `{ value, done }`.
2. **Why Arrays are Multi-Use:**
   - An Array is an **Iterable**. Every time `for...of` or `[...arr]` runs, it invokes `arr[Symbol.iterator]()`, producing a **brand-new, independent iterator** initialized at index 0. Therefore, arrays can be iterated indefinitely.
3. **Why Generators are Single-Use:**
   - A Generator object is both an iterable and its own iterator (`gen[Symbol.iterator]() === gen`). It maintains internal execution state (the instruction pointer).
   - Once a generator runs to completion (`done: true`), its execution context is finished. Calling `[Symbol.iterator]()` on an exhausted generator returns the same exhausted instance, meaning subsequent loops will terminate immediately.

---

### 2. Predict the Output: Generator arguments, yields, and returns

```js
function* taskFlow() {
  const a = yield 10;
  const b = yield a + 5;
  return a + b;
}

const runner = taskFlow();
console.log(runner.next(100));
console.log(runner.next(20));
console.log(runner.next(5));
console.log(runner.next());
```

**Question:** Predict the output of the four `.next()` calls and explain how values flow into the generator.

**Answer:**
**Output:**
```text
{ value: 10, done: false }
{ value: 25, done: false }
{ value: 25, done: true }
{ value: undefined, done: true }
```

**Explanation:**
1. **First `runner.next(100)`:** Starts the generator. The argument `100` is **ignored** because no `yield` is currently waiting for input. The generator runs until `yield 10`, returning `{ value: 10, done: false }`.
2. **Second `runner.next(20)`:** Resumes execution. The first `yield` expression evaluates to `20`, assigning `a = 20`. It computes `a + 5` (`25`) and pauses at `yield 25`, returning `{ value: 25, done: false }`.
3. **Third `runner.next(5)`:** Resumes execution. The second `yield` evaluates to `5`, assigning `b = 5`. It evaluates `return a + b` (`20 + 5 = 25`), terminating the generator and returning `{ value: 25, done: true }`.
4. **Fourth `runner.next()`:** The generator is already exhausted. It returns `{ value: undefined, done: true }`.

---

### 3. Debugging: Diagnosing a memory leak and hang caused by an unbounded generator

```js
function* generateLogEvents() {
  let seq = 1;
  while (true) {
    yield { seq: seq++, timestamp: Date.now() };
  }
}

// Service Endpoint
app.get("/logs/export", (req, res) => {
  const events = [...generateLogEvents()]; // Server hangs and crashes!
  res.json(events);
});
```

**Question:** In production, calling `/logs/export` completely freezes the Node.js event loop and eventually crashes the process with `JavaScript heap out of memory`. Diagnose the issue and refactor the code to stream logs safely with bounds.

**Answer:**
**Diagnosis:**
`generateLogEvents` is an **infinite generator** (`while (true)`).
Using the array spread operator `[...generateLogEvents()]` forces JavaScript to consume the generator until `done: true`. Because `done` is never `true`, the loop runs infinitely, locking the single-threaded Node.js event loop, exhausting the V8 heap, and crashing the application.

**Safe Refactoring:**
```js
// Node.js code
function* generateBoundedLogEvents(limit = 100) {
  let seq = 1;
  while (seq <= limit) {
    yield { seq: seq++, timestamp: Date.now() };
  }
}

app.get("/logs/export", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 1000);
  const events = [...generateBoundedLogEvents(limit)];
  res.json({ count: events.length, events });
});
```

---

### 4. Node.js Backend Scenario: Implementing an Observable File Chunking Stream

**Question:** In a Node.js microservice handling large file uploads or CSV ingestion, implement a generator-based chunker that reads an array or stream of lines and yields batched chunks of size `N`. Ensure that if processing fails mid-stream, resources are cleaned up immediately.

**Answer:**

```js
// Node.js code
function* createBatchChunker(itemIterable, batchSize = 100) {
  if (batchSize <= 0) throw new RangeError("batchSize must be greater than 0");

  let batch = [];
  let totalProcessed = 0;

  try {
    for (const item of itemIterable) {
      batch.push(item);
      totalProcessed++;

      if (batch.length === batchSize) {
        // Yield full batch and reset
        yield batch;
        batch = [];
      }
    }

    // Yield any remaining trailing items
    if (batch.length > 0) {
      yield batch;
    }
  } finally {
    // Guaranteed resource cleanup hook
    console.log(`[Chunker] Stream finalized. Total items processed: ${totalProcessed}`);
  }
}

// Example Verification:
const mockRecords = ["user_1", "user_2", "user_3", "user_4", "user_5"];
const chunker = createBatchChunker(mockRecords, 2);

for (const batch of chunker) {
  console.log("Processing batch:", batch);
}
// Logs:
// Processing batch: [ 'user_1', 'user_2' ]
// Processing batch: [ 'user_3', 'user_4' ]
// Processing batch: [ 'user_5' ]
// [Chunker] Stream finalized. Total items processed: 5
```

---

<nav aria-label="Lecture navigation">

[← Day 13: Destructuring, Spread, and Modern Operators](day-13-destructuring-spread-and-modern-operators.md) | [Roadmap](../javascript-roadmap.md) | [Day 15: Regular Expressions and Text Processing →](day-15-regular-expressions-and-text-processing.md)

</nav>
