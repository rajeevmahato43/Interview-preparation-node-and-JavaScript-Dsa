# Day 05: Control Flow and Loops

<nav aria-label="Lecture navigation">

[← Day 04: Coercion, Equality, and Operators](day-04-coercion-equality-and-operators.md) | [Roadmap](../javascript-roadmap.md) | [Day 06: Functions, Parameters, and Callbacks →](day-06-functions-parameters-and-callbacks.md)

</nav>

---

## What You Will Learn Today

By the end of this lecture you should be able to:

- Choose the right control-flow construct (`if/else`, `switch`, lookup tables) for any branching scenario.
- Select the correct iteration mechanism between `for`, `while`, `for...of`, `for...in`, and array methods.
- Understand the iterable protocol and why `for...of` works on arrays but throws on plain objects.
- Master loop control statements (`break`, `continue`, labeled statements) and early returns.
- Explain why `let` in a `for` loop creates a per-iteration binding while `var` shares a single binding.
- Recognize and fix mutation-during-iteration bugs (the `splice()` index-shift trap).
- Connect loop efficiency to algorithmic complexity ($O(n)$ with `Set` vs. $O(n^2)$ nested checks).
- Prevent Node.js event-loop starvation when processing large datasets synchronously.

**Prerequisites:** [Day 04 – Coercion, Equality, and Operators](day-04-coercion-equality-and-operators.md) (truthiness, falsy vs. nullish values, strict equality).

---

## Quick Vocabulary Card

| Term | Definition |
| :--- | :--- |
| **Control Flow** | The order in which individual statements and instructions are executed in a program. |
| **Branching** | Directing execution along different paths based on whether a condition evaluates to true or false. |
| **Fall-Through** | The behavior in a `switch` statement where execution cascades into subsequent `case` blocks unless interrupted by `break` or `return`. |
| **Iteration** | Repeating a block of code for each element in a collection or until a condition is met. |
| **Iterable Protocol** | An ECMAScript standard that allows objects to define their iteration behavior by implementing the `[Symbol.iterator]` method. |
| **Enumerable Property** | An object property whose internal `enumerable` flag is `true`, making it visible to `for...in` and `Object.keys()`. |
| **Event Loop Starvation** | When a long-running synchronous JavaScript operation monopolizes the thread, preventing timers, I/O callbacks, and HTTP requests from executing. |

---

## 1. Branching: `if/else` and `switch`

Branching directs execution along different code paths based on conditions.

### `if/else` Statements

An `if` statement evaluates an expression's truthiness and executes the corresponding block. Conditions evaluate from top to bottom; once a branch matches, subsequent branches are skipped.

```js
// Node.js code
const userRole = "editor";

// ✅ Explicit, braced block structure
if (userRole === "admin") {
  console.log("Full system access granted");
} else if (userRole === "editor") {
  console.log("Content modification access granted");
} else {
  console.log("Read-only access granted");
}

// ❌ Avoid braceless single-line statements (prone to silent indentation bugs)
// if (userRole === "admin") deleteDatabase(); auditLog(); // auditLog() always runs!
```

### `switch` Statements and Strict Matching

A `switch` statement compares a single value against multiple `case` clauses using **strict equality (`===`)**. Without an explicit `break` or `return`, execution **falls through** into subsequent cases regardless of whether they match.

```js
// Node.js code
function handleHttpStatus(code) {
  switch (code) {
    case 200:
    case 201:
      // ✅ Intentional fall-through: groups related HTTP success codes
      return "Success";
    case 400:
      return "Bad Request";
    case 401:
    case 403:
      return "Unauthorized / Forbidden";
    case "200":
      // ❌ Never matches if code is numeric 200 (switch uses === strict equality)
      return "String 200";
    default:
      return "Unhandled Status";
  }
}

console.log(handleHttpStatus(200)); // "Success"
console.log(handleHttpStatus(404)); // "Unhandled Status"
```

### `if/else` vs. `switch` vs. Lookup Map

When mapping static keys to values or handlers, a plain object or `Map` lookup is often cleaner and faster than a large `switch` statement:

```js
// Node.js code
// ✅ Lookup Map pattern (O(1) lookup, cleaner than switch)
const HTTP_HANDLERS = new Map([
  [200, () => "OK"],
  [404, () => "Not Found"],
  [500, () => "Internal Server Error"]
]);

function routeStatus(status) {
  const handler = HTTP_HANDLERS.get(status);
  return handler ? handler() : "Unknown Status";
}

console.log(routeStatus(404)); // "Not Found"
```

### Summary Comparison: Branching Constructs

| Feature | `if/else if` | `switch` | Object / Map Lookup |
| :--- | :--- | :--- | :--- |
| **Matching check** | Any truthy boolean expression | Strict equality (`===`) against a single value | Hash key lookup (`O(1)`) |
| **Fall-through** | No | Yes (requires `break` or `return`) | No |
| **Best suited for** | Complex ranges, multi-variable conditions | Fixed scalar constants (enums, action types) | Large dictionaries of static values or handlers |

---

## 2. Standard Loops: `for`, `while`, and `do...while`

A loop repeatedly executes a block of code as long as its condition remains true.

### The Classic `for` Loop

A `for` loop bundles initialization, condition check, and loop update into a single header statement.

```js
// Node.js code
// ✅ Standard forward loop
const items = ["alpha", "beta", "gamma"];

for (let i = 0; i < items.length; i++) {
  console.log(`Index ${i}: ${items[i]}`);
}

// ❌ Off-by-one error trap: <= items.length accesses undefined
// for (let i = 0; i <= items.length; i++) { console.log(items[i]); } // Last element is undefined
```

### The `while` Loop

Evaluates its condition **before** entering each iteration. If the condition begins as `false`, the body never executes.

```js
// Node.js code
let retries = 3;
while (retries > 0) {
  console.log(`Connecting... attempts left: ${retries}`);
  retries--; // ✅ Must update condition variable to prevent infinite loops
}
```

### The `do...while` Loop

Evaluates its condition **after** the body executes. It is guaranteed to run **at least once**.

```js
// Node.js code
let attempts = 0;
do {
  attempts++;
  console.log(`Execution pass: ${attempts}`);
} while (attempts < 1); // ✅ Condition checked after first run; outputs pass: 1
```

---

## 3. Iterating Collections: `for...of` vs. `for...in`

Choosing between `for...of` and `for...in` is one of the most critical decisions in JavaScript iteration.

### `for...of` (Iterates Values of an Iterable)

`for...of` (ES2015+) loops over the **values** produced by any object implementing the **Iterable protocol** (Arrays, Strings, Maps, Sets, TypedArrays, Generators, and Node.js streams).

> **Analogy for `for...in` vs. `for...of`:**
> Imagine inspecting a library bookshelf.
> - `for...of` takes down each book from the shelf one by one and reads its content (the **values**).
> - `for...in` reads every barcode label, inventory sticker, and inspection tag pasted onto the shelf itself, the brackets, and even the manufacturer stamps inherited from the factory that built the shelf (the **keys** and **prototype properties**).

```js
// Node.js code
const frameworkList = ["Express", "Fastify", "NestJS"];

// ✅ for...of reads array values directly
for (const framework of frameworkList) {
  console.log(framework); // "Express", "Fastify", "NestJS"
}

// ✅ for...of works seamlessly on Maps and Sets
const sessionMap = new Map([
  ["usr_1", "active"],
  ["usr_2", "idle"]
]);

for (const [userId, status] of sessionMap) {
  console.log(`${userId} -> ${status}`);
}
```

### Plain Objects Are NOT Iterable

Plain objects `{}` do not implement `[Symbol.iterator]` by default. Attempting to use `for...of` on a plain object throws a runtime `TypeError`.

```js
// Node.js code
const config = { host: "localhost", port: 8080 };

// ❌ Throws TypeError: config is not iterable
// for (const val of config) { console.log(val); }

// ✅ Correct pattern: iterate using Object.entries() or Object.values()
for (const [key, value] of Object.entries(config)) {
  console.log(`${key}: ${value}`); // "host: localhost", "port: 8080"
}
```

### `for...in` (Iterates Enumerable Property Keys)

`for...in` traverses all **enumerable string property names (keys)** of an object, including properties inherited down its prototype chain.

```js
// Node.js code
const baseConfig = { timeout: 5000 };
const appConfig = Object.create(baseConfig);
appConfig.appName = "OrderService";

// ❌ for...in includes inherited prototype keys!
for (const key in appConfig) {
  console.log(key); // "appName", then "timeout" (inherited from baseConfig!)
}

// ✅ Guard with Object.hasOwn() to filter out prototype properties (Node.js >= 16.9.0 / ES2022)
for (const key in appConfig) {
  if (Object.hasOwn(appConfig, key)) {
    console.log(`Own key: ${key}`); // "Own key: appName"
  }
}
```

### Why `for...in` is Dangerous for Arrays

Never use `for...in` to iterate array elements:
1. It yields string index keys (`"0"`, `"1"`, `"2"`), not numbers or values.
2. It iterates in arbitrary order (not guaranteed to be numeric sequence).
3. If any library or third-party code attaches methods to `Array.prototype`, `for...in` will iterate over those function names too!

```js
// Node.js code
const scores = [10, 20, 30];
Array.prototype.customHelper = function () {}; // Simulating third-party prototype mutation

// ❌ Dangerous array iteration:
for (const index in scores) {
  console.log(typeof index, index); // "string" "0", "string" "1", ..., "string" "customHelper"!
}

delete Array.prototype.customHelper; // Clean up
```

### Summary Comparison: `for...of` vs. `for...in` vs. `Object.entries()`

| Construct | Iterates Over | Target Objects | Inherited Properties? | Safe for Arrays? |
| :--- | :--- | :--- | :--- | :--- |
| `for...of` | **Values** | Iterables (Array, Map, Set, String) | No | ✅ Yes |
| `for...in` | **String Keys** | Any Object | **Yes** (prototype chain) | ❌ No (yields string keys) |
| `Object.entries()` + `for...of` | **[Key, Value] Pairs** | Plain Objects | No (own properties only) | Unnecessary (use `for...of`) |

---

## 4. Functional Array Methods vs. Imperative Loops

Modern JavaScript provides declarative array methods (`forEach`, `map`, `filter`, `find`, `some`, `every`, `reduce`). While clean, they have fundamental operational differences from imperative loops.

### `forEach()` Limitations

1. **Cannot `break` or `continue`:** Calling `break` inside a `forEach` callback is a syntax error.
2. **`return` Does Not Exit the Outer Function:** A `return` statement inside a `forEach` callback merely terminates that individual callback invocation (behaving like `continue`).
3. **The Async/Await Trap:** `forEach` does **not await** promises returned by asynchronous callbacks. It fires all callbacks concurrently as unhandled promises and immediately returns `undefined`.

```js
// Node.js code
const numbers = [1, 2, 3, 4, 5];

// ❌ Early exit does not work in forEach:
numbers.forEach((num) => {
  if (num === 3) return; // Acts like `continue`, DOES NOT stop the loop!
  console.log(num); // Prints 1, 2, 4, 5
});

// ✅ Use for...of when early exit or breaking is needed:
for (const num of numbers) {
  if (num === 3) break; // Exits loop completely
  console.log(num); // Prints 1, 2
}
```

### The `async/await` Inside `forEach` Disaster

```js
// Node.js code
async function mockSave(id) {
  return new Promise((resolve) => setTimeout(() => resolve(`saved_${id}`), 50));
}

async function flawedProcess() {
  const ids = [1, 2, 3];

  // ❌ forEach does not await promises!
  ids.forEach(async (id) => {
    const res = await mockSave(id);
    console.log(res);
  });

  console.log("Processing finished!"); // Prints BEFORE any mockSave finishes!
}

flawedProcess();
// Output order:
// "Processing finished!"
// "saved_1"
// "saved_2"
// "saved_3"

// ✅ Correct Sequential Processing: use for...of
async function safeSequentialProcess(ids) {
  for (const id of ids) {
    const res = await mockSave(id);
    console.log(res);
  }
  console.log("All saves completed!");
}

// ✅ Correct Concurrent Processing: use Promise.all + map
async function safeConcurrentProcess(ids) {
  await Promise.all(ids.map((id) => mockSave(id)));
  console.log("All concurrent saves completed!");
}
```

### Comparison Matrix: `for...of` vs. `forEach` vs. `map`

| Requirement | `for...of` | `forEach()` | `map()` |
| :--- | :--- | :--- | :--- |
| **Supports `break` / `continue`** | ✅ Yes | ❌ No | ❌ No |
| **Supports `await` sequentially** | ✅ Yes | ❌ No | ❌ No (use `Promise.all(arr.map())`) |
| **Produces a new array** | ❌ No | ❌ No (`undefined`) | ✅ Yes |
| **Performance overhead** | Low (direct iteration) | Minor (function call per item) | Allocates new array memory |

---

## 5. Jump Statements: `break`, `continue`, and Labels

Jump statements disrupt normal linear control flow.

### `break` and `continue`

- **`break`**: Immediately terminates the nearest enclosing `for`, `while`, `do...while`, or `switch`.
- **`continue`**: Halts the remainder of the current loop iteration and proceeds immediately to the next evaluation/update step.

```js
// Node.js code
for (let i = 1; i <= 5; i++) {
  if (i === 2) continue; // ✅ Skips 2
  if (i === 4) break;    // ✅ Halts loop at 4
  console.log(i); // Prints 1, 3
}
```

### Labeled Statements for Nested Loops

A label gives a name to an outer loop so an inner loop can break or continue it directly.

```js
// Node.js code
// ✅ Labeled matrix search
const matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
];

let targetFound = false;

searchLoop: for (let row = 0; row < matrix.length; row++) {
  for (let col = 0; col < matrix[row].length; col++) {
    if (matrix[row][col] === 5) {
      targetFound = true;
      break searchLoop; // ✅ Exits both loops directly!
    }
  }
}
console.log(`Found target 5: ${targetFound}`); // true
```

*Best practice:* Labeled statements can make control flow hard to follow. Refactoring the nested loop into a dedicated helper function that uses an early `return` is often much cleaner.

---

## 6. Loop Scoping: `var` vs. `let` in Closures

Understanding how variables are scoped inside a loop is essential for asynchronous Node.js operations.

- **`var` (Function-Scoped):** A single variable binding is created and shared across all loop iterations. Callbacks created inside the loop close over the same shared variable.
- **`let` (Block-Scoped):** The JavaScript engine creates a **brand-new lexical binding for every single iteration**. Each callback captures its own unique value.

```js
// Node.js code
// ❌ var trap: all timers capture the final value (3)
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(`var i: ${i}`), 10);
}
// Logs: "var i: 3", "var i: 3", "var i: 3"

// ✅ let binding: each callback captures its own iteration value
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(`let j: ${j}`), 10);
}
// Logs: "let j: 0", "let j: 1", "let j: 2"
```

---

## 7. Mutation During Iteration (The Splice Trap)

Modifying an array's length or structure while looping over it forward by index causes subtle skipping bugs.

### The Index-Shift Problem

When you remove an element with `arr.splice(index, 1)`, all elements to the right shift left by one position. When the loop advances `index++`, the element that slid into the current index is **completely skipped**.

```js
// Node.js code
const pending = [1, 2, 3, 4];

// ❌ Flawed removal: skips elements during forward iteration
for (let i = 0; i < pending.length; i++) {
  if (pending[i] % 2 === 0) {
    pending.splice(i, 1); // Element at i+1 shifts to index i!
    // Next loop iteration increments i++, skipping that shifted element!
  }
}

// ⚠️ If consecutive items match, the second one is skipped!
const consecutive = [1, 2, 2, 3];
for (let i = 0; i < consecutive.length; i++) {
  if (consecutive[i] === 2) {
    consecutive.splice(i, 1);
  }
}
console.log(consecutive); // [1, 2, 3] — The second 2 was skipped!

// ✅ Solution A: Decrement index when splicing forward
for (let i = 0; i < consecutive.length; i++) {
  if (consecutive[i] === 2) {
    consecutive.splice(i, 1);
    i--; // Adjust index so next iteration checks the shifted item
  }
}
console.log(consecutive); // [1, 3] (correct!)

// ✅ Solution B: Iterate backwards (no index shift affects unvisited items)
const itemsBackwards = [1, 2, 2, 3];
for (let i = itemsBackwards.length - 1; i >= 0; i--) {
  if (itemsBackwards[i] === 2) {
    itemsBackwards.splice(i, 1);
  }
}
console.log(itemsBackwards); // [1, 3] (correct!)

// ✅ Solution C: Non-mutating filter (usually the cleanest and easiest to reason about)
const filtered = [1, 2, 2, 3].filter((num) => num !== 2);
console.log(filtered); // [1, 3]
```

---

## 8. Complexity and the DSA Connection: $O(n)$ vs. $O(n^2)$

A loop over `n` items is $O(n)$ time. However, performing an array search (such as `.indexOf()`, `.includes()`, or `.some()`) inside that loop multiplies the work, turning the loop into an $O(n^2)$ quadratic operation.

### Finding Duplicates: Nested Search ($O(n^2)$) vs. Hash Set ($O(n)$)

```js
// Node.js code
// ❌ O(n^2) Quadratic approach: .indexOf() does a full array scan inside the loop!
function hasDuplicateSlow(arr) {
  for (let i = 0; i < arr.length; i++) {
    if (arr.indexOf(arr[i]) !== i) { // O(n) scan inside an O(n) loop = O(n^2)
      return true;
    }
  }
  return false;
}

// ✅ O(n) Linear approach using a Set: O(1) average lookup time
function hasDuplicateFast(arr) {
  const seen = new Set();
  for (const item of arr) {
    if (seen.has(item)) return true; // O(1) lookup
    seen.add(item);
  }
  return false;
}

// Performance comparison on 50,000 items:
// O(n^2) = 2,500,000,000 comparisons (several seconds, freezes Node.js thread!)
// O(n)   = 50,000 comparisons (less than 5 milliseconds)
```

---

## 9. Performance & Node.js Event Loop Starvation

JavaScript in Node.js runs on a **single-threaded event loop**. Synchronous code executed on that thread blocks everything else until it finishes.

### The Problem: Synchronous Blocking

If a synchronous loop iterates through 500,000 records doing heavy JSON parsing or regex calculations, the Node.js event loop is completely starved:
- Incoming HTTP requests time out.
- Timers (`setTimeout`, `setInterval`) are delayed.
- Health-check probes (e.g., Kubernetes liveness probes) fail, causing container restarts.

```js
// Node.js code
// ❌ Blocking CPU loop: freezes entire Node.js server for seconds!
function heavyBatchCalculation(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += Math.sqrt(items[i]);
  }
  return total;
}
```

### The Solution: Chunking and Yielding with `setImmediate()`

To keep the server responsive during heavy batch processing, divide the data into chunks and yield control back to the event loop between chunks using `setImmediate()`:

```js
// Node.js code
async function processLargeBatchNonBlocking(items, chunkSize = 10000) {
  let index = 0;
  let total = 0;

  while (index < items.length) {
    const end = Math.min(index + chunkSize, items.length);

    // Process chunk synchronously
    for (let i = index; i < end; i++) {
      total += Math.sqrt(items[i]);
    }

    index = end;

    // ✅ Yield execution back to the event loop so HTTP requests and I/O can run!
    if (index < items.length) {
      await new Promise((resolve) => setImmediate(resolve));
    }
  }

  return total;
}
```

---

## Tricky Points

### 1. `forEach` with `async/await` Cannot Be Caught with `try/catch`

Wrapping `array.forEach(async ...)` in a `try/catch` block does **not catch errors thrown inside the async callback**. The callback returns an unhandled rejected promise that escapes the `try/catch` and can crash the Node.js process with an `unhandledRejection`.

```js
// Node.js code
async function failTask() { throw new Error("Database offline"); }

// ❌ try/catch DOES NOT catch errors from forEach async callbacks:
try {
  [1, 2].forEach(async () => {
    await failTask(); // ❌ Unhandled rejection!
  });
} catch (err) {
  console.log("This will never run!");
}

// ✅ Correct approach: use for...of with try/catch
async function safeRun() {
  try {
    for (const item of [1, 2]) {
      await failTask();
    }
  } catch (err) {
    console.log("Successfully caught error:", err.message); // ✅ Caught!
  }
}
```

### 2. Mutating an Array While Iterating with `splice()` Skips Elements

Calling `arr.splice(i, 1)` shifts all subsequent elements to the left by one index. When the loop advances `i++`, the element immediately following the deleted item is skipped unless the index is decremented or a reverse loop is used.

### 3. Accidental Quadratic Complexity ($O(n^2)$) Inside Loops

Calling array search methods like `.indexOf()`, `.includes()`, or `.find()` inside a loop turns an $O(n)$ operation into $O(n^2)$. For 100,000 items, this is the difference between 100,000 operations ($O(n)$ with a `Set`) and 10,000,000,000 operations ($O(n^2)$).

---

## Hands-On Exercise: Fix the Batch Webhook Dispatcher

A junior developer implemented a batch webhook notification worker for an Express e-commerce API. The code has three fatal production bugs:
1. It uses `for...in` on an array, causing unexpected iteration bugs.
2. It uses `forEach(async ...)` to send HTTP webhooks, causing unhandled rejections and returning `200 OK` before deliveries complete.
3. It mutates the active order list during iteration using `splice()`, skipping notifications.
4. Large batches freeze the server.

### Buggy Code

```js
// Node.js code — webhook-dispatcher.js
async function dispatchWebhooks(subscribers, payload) {
  // Bug 1: for...in on array yields string indices and prototype properties
  for (const index in subscribers) {
    console.log("Preparing notification for index:", index);
  }

  // Bug 2: forEach with async callback does not await delivery
  subscribers.forEach(async (subscriber) => {
    await sendHttpWebhook(subscriber.url, payload);
    // Bug 3: mutating array while iterating skips items
    if (subscriber.oneTimeOnly) {
      subscribers.splice(subscribers.indexOf(subscriber), 1);
    }
  });

  return { status: "All webhooks delivered" }; // Returns immediately before webhooks send!
}
```

### Acceptance Criteria

1. Use `for...of` or `Promise.all` to ensure all webhook deliveries finish before returning.
2. Capture and report delivery errors cleanly without crashing on unhandled promise rejections.
3. Correctly remove `oneTimeOnly` subscribers without skipping elements.
4. Yield to the event loop if batch size exceeds 500 subscribers.

### Solution

```js
// Node.js code — webhook-dispatcher.js
"use strict";

async function mockSendHttpWebhook(url, payload) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (url.includes("fail")) reject(new Error(`Failed to deliver to ${url}`));
      else resolve({ url, status: 200 });
    }, 20);
  });
}

async function dispatchWebhooks(subscribers, payload) {
  const deliveryResults = [];
  const errors = [];
  const CHUNK_SIZE = 500;

  // Fix 1 & 2: Use for...of to control flow and await deliveries reliably
  for (let i = 0; i < subscribers.length; i++) {
    const subscriber = subscribers[i];

    try {
      const res = await mockSendHttpWebhook(subscriber.url, payload);
      deliveryResults.push(res);
    } catch (err) {
      errors.push({ url: subscriber.url, error: err.message });
    }

    // Fix 4: Yield to event loop to avoid starvation during huge batches
    if (i > 0 && i % CHUNK_SIZE === 0) {
      await new Promise((resolve) => setImmediate(resolve));
    }
  }

  // Fix 3: Safely filter oneTimeOnly subscribers without in-loop splice corruption
  const remainingSubscribers = subscribers.filter((sub) => !sub.oneTimeOnly);

  return {
    deliveredCount: deliveryResults.length,
    failedCount: errors.length,
    errors,
    remainingSubscribers
  };
}

// Verification
const mockSubs = [
  { url: "https://api.site1.com/hook", oneTimeOnly: true },
  { url: "https://api.fail.com/hook", oneTimeOnly: false },
  { url: "https://api.site2.com/hook", oneTimeOnly: true }
];

dispatchWebhooks(mockSubs, { event: "ORDER_CREATED" }).then((summary) => {
  console.log("Dispatch Summary:", summary);
});
// Output:
// Dispatch Summary: {
//   deliveredCount: 2,
//   failedCount: 1,
//   errors: [ { url: 'https://api.fail.com/hook', error: 'Failed to deliver to https://api.fail.com/hook' } ],
//   remainingSubscribers: [ { url: 'https://api.fail.com/hook', oneTimeOnly: false } ]
// }
```

---

## Summary

- Use `if/else` for arbitrary conditions, `switch` for multi-value scalar matching with strict equality, and **Lookup Maps** for clean key-handler mappings.
- **`for...of`** traverses **values** of iterables (Arrays, Maps, Sets, Strings). It is the standard modern choice for array iteration.
- **`for...in`** traverses **enumerable string keys**, including inherited prototype properties. Never use it for arrays.
- Plain objects `{}` are not iterable. Iterate over them using `Object.keys()`, `Object.values()`, or `Object.entries()`.
- **`forEach()` cannot be stopped with `break`** and **does not await asynchronous callbacks**. Use `for...of` for sequential async tasks and `Promise.all(arr.map())` for concurrent async tasks.
- `let` in a `for` loop creates a **new binding per iteration**, solving closure capture issues that occur with `var`.
- Mutating an array during forward index iteration causes elements to be skipped. Filter into a new array or iterate backwards instead.
- Avoid $O(n^2)$ complexity by using `Set` or `Map` instead of calling `.includes()` inside loops.
- Long synchronous loops block Node.js's single thread. Chunk large datasets and yield control using `setImmediate()`.

---

## Cheat Sheet

### Loop Selection Guide

| Situation | Recommended Construct | Reason |
| :--- | :--- | :--- |
| Iterating Array values | `for...of` | Clean syntax, supports `break`, `continue`, and `await` |
| Transforming an array | `arr.map()` | Returns new array cleanly |
| Filtering an array | `arr.filter()` | Pure and non-mutating |
| Sequential async operations | `for...of` with `await` | Guarantees in-order completion |
| Concurrent async operations | `Promise.all(arr.map())` | Executes in parallel with unified promise |
| Object own properties | `Object.entries(obj)` with `for...of` | Excludes prototype keys, gives both key and value |
| Fast dictionary lookup | `Map.get()` or `obj[key]` | $O(1)$ constant time lookup |

### `for...of` vs. `for...in` vs. `forEach()`

| Feature | `for...of` | `for...in` | `forEach()` |
| :--- | :--- | :--- | :--- |
| **Iterates** | Values | Keys (strings) | Values (in callback) |
| **Works on Arrays** | ✅ Yes | ❌ No | ✅ Yes |
| **Works on Plain Objects** | ❌ No (requires `Object.entries`) | ✅ Yes | ❌ No |
| **Inherited Prototype Keys** | Ignored | **Included** | Ignored |
| **Supports `break` / `continue`** | ✅ Yes | ✅ Yes | ❌ No |
| **Supports `await` properly** | ✅ Yes | ❌ No | ❌ No |

### Common Pitfalls

- **Using `async` inside `forEach()`** → promises fire concurrently without being awaited, and errors cannot be caught with `try/catch`.
- **Using `for...in` to iterate arrays** → yields string indices, arbitrary iteration order, and exposes custom prototype methods.
- **Calling `arr.splice()` inside an index-based forward loop** → shifts elements left, silently skipping the next item.
- **Missing `break` in a `switch` statement** → causes unintentional fall-through into following cases.
- **Running long synchronous loops on the Node.js main thread** → freezes the event loop, causing HTTP timeouts and dropped connections.

---

## Interview Questions

### 1. What is the fundamental difference between `for...in` and `for...of`?

**Question:** Compare `for...in` and `for...of`. Why does `for...in` cause bugs when used on arrays, and why does `for...of` throw on plain objects?

**Answer:**
- **`for...of`** operates on **values** produced by any data structure that implements the **Iterable protocol** (`[Symbol.iterator]`), such as `Array`, `String`, `Map`, and `Set`. It reads the collection's items in their natural ordered sequence.
- **`for...in`** operates on **enumerable string keys** of an object, walking up the entire prototype chain.

**Why `for...in` is bad for arrays:**
1. It returns indices as strings (`"0"`, `"1"`) rather than numbers.
2. Iteration order is not guaranteed to follow numeric order across all engines.
3. It visits any custom methods or properties added to `Array.prototype` or the array instance.

**Why `for...of` throws on plain objects:**
Plain JavaScript objects `{}` do not implement `[Symbol.iterator]` by default because there is no universal iteration order that makes sense for all objects (values vs. keys vs. entries, prototype properties vs. own properties). To iterate a plain object with `for...of`, use `Object.keys(obj)`, `Object.values(obj)`, or `Object.entries(obj)`.

---

### 2. Predict the Output: `return` inside `forEach` vs. `for...of`

```js
function testForEach() {
  [1, 2, 3].forEach((num) => {
    if (num === 2) return;
    console.log("forEach:", num);
  });
  console.log("forEach done");
}

function testForOf() {
  for (const num of [1, 2, 3]) {
    if (num === 2) return;
    console.log("forOf:", num);
  }
  console.log("forOf done");
}

testForEach();
testForOf();
```

**Question:** Predict the output of both functions and explain why they behave differently.

**Answer:**
**Output:**
```text
forEach: 1
forEach: 3
forEach done
forOf: 1
```

**Explanation:**
- In `testForEach()`, `return` exits only the *current callback function* invoked for element `2`. The outer `forEach` loop continues executing the callback for the remaining element `3`, and `testForEach()` finishes and logs `"forEach done"`.
- In `testForOf()`, `return` is executed directly inside the body of `testForOf()`. It immediately terminates the entire function, returning to the caller. Element `3` is never visited and `"forOf done"` is never logged.

---

### 3. Debugging: Why does this Express handler return before operations complete?

```js
app.post("/notifications", async (req, res) => {
  const users = req.body.users;

  users.forEach(async (user) => {
    await sendPushNotification(user);
    await logNotificationInDb(user.id);
  });

  res.json({ success: true, count: users.length });
});
```

**Question:** Clients report that this API returns `200 OK` instantly, but database logs show notifications are frequently lost and errors crash the Node.js server. Diagnose the issue and rewrite the code safely.

**Answer:**
**Diagnosis:**
`Array.prototype.forEach` ignores the return value of its callback. When an `async` function is passed to `forEach`, it returns a Promise on each iteration, but `forEach` does not await it.
1. `res.json()` runs immediately before any notifications finish sending.
2. If `sendPushNotification()` throws an error, it results in an unhandled promise rejection because there is no `await` or `.catch()` attached to the promise returned by the callback, which can terminate the Node.js process.

**Fix (Concurrent delivery with Promise.all):**
```js
app.post("/notifications", async (req, res, next) => {
  try {
    const users = req.body.users;
    await Promise.all(
      users.map(async (user) => {
        await sendPushNotification(user);
        await logNotificationInDb(user.id);
      })
    );
    res.json({ success: true, count: users.length });
  } catch (err) {
    next(err); // Forward error to Express error handler
  }
});
```

---

### 4. Node.js Event Loop & DSA: Processing 500,000 Records Responsively

**Question:** You need to deduplicate a 500,000-record array of user transactions in Node.js and compute running totals. Explain how an $O(n^2)$ loop starves the event loop, and implement an $O(n)$ solution that yields execution to the event loop so incoming HTTP traffic remains responsive.

**Answer:**
**Algorithmic Analysis:**
An $O(n^2)$ algorithm (e.g., using `uniqueList.some()` or `uniqueList.indexOf()` inside a loop for 500,000 records) performs up to $(5 \times 10^5)^2 = 2.5 \times 10^{11}$ operations. This will block Node.js's single thread for minutes, freezing the server and causing connection drops.
Using a `Set` provides $O(1)$ lookups, reducing total complexity to $O(n)$ ($500,000$ operations).

**Event Loop Yielding:**
Even an $O(n)$ pass over 500,000 records can take 100–300ms of continuous CPU time. To prevent event-loop starvation, process the items in batches (e.g., 20,000 items) and yield to the event loop using `setImmediate()`:

```js
// Node.js code
async function processTransactionsNonBlocking(transactions, batchSize = 20000) {
  const seenTxIds = new Set();
  const uniqueTransactions = [];
  let runningTotal = 0;

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];

    if (!seenTxIds.has(tx.id)) {
      seenTxIds.add(tx.id);
      uniqueTransactions.push(tx);
      runningTotal += tx.amount;
    }

    // Yield control to event loop every batchSize iterations
    if (i > 0 && i % batchSize === 0) {
      await new Promise((resolve) => setImmediate(resolve));
    }
  }

  return { uniqueTransactions, runningTotal };
}
```

---

<nav aria-label="Lecture navigation">

[← Day 04: Coercion, Equality, and Operators](day-04-coercion-equality-and-operators.md) | [Roadmap](../javascript-roadmap.md) | [Day 06: Functions, Parameters, and Callbacks →](day-06-functions-parameters-and-callbacks.md)

</nav>
