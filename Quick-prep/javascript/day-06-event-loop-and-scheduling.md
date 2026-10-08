# Day 6: Memory, Garbage Collection, V8 Optimizations, Testing, and Debugging

Quick review of main-course lectures 21–24. Designed for rapid interview revision: V8 heap memory architecture, Mark-and-Sweep garbage collection, hidden classes (Shapes), Inline Caches (Monomorphic vs Megamorphic), test doubles (Stubs vs Mocks vs Spies), and heap profiling.

## Memory management and garbage collection

**1. V8 Heap architecture and generations**

V8 divides its memory heap based on the generational hypothesis (most objects die young):
- **New Space (Young Generation):** Small (1–64MB), allocated rapidly. Collected via fast **Scavenge** GC algorithms using semi-spaces.
- **Old Space:** Objects that survive two Scavenge GC cycles are promoted to Old Space, managed by **Mark-Sweep-Compact** GC.

```text
+--------------------------------------------------------------+
|                        V8 Heap Memory                        |
+------------------------------+-------------------------------+
|      New Space (1-64MB)      |           Old Space           |
| (Active Semi-space / From)   |  (Long-lived objects,         |
| (Inactive Semi-space / To)   |   Closures, Singletons)       |
+------------------------------+-------------------------------+
```

**1.1 Mark-and-Sweep reachability and memory leaks**

Garbage collection traces pointers starting from GC roots (global object, local call stack variables). An object is retained if a reference path exists from any root.
- **Accidental globals:** Variables declared without `const`/`let`/`var` attach to `globalThis`.
- **Lingering event listeners:** Event emitters that are never unsubscribed keep both the callback and its enclosing closure scope alive.
- **Detached references:** Caching objects or DOM elements in long-lived arrays after they are removed from the active application.

```js
// Leaking closure example: outer array held in memory by detached callback
function leakMemory() {
  const largeArray = new Array(1000000).fill("payload");
  return function keepAlive() {
    // Retains largeArray in memory even if never accessed directly!
    return largeArray.length;
  };
}
const leakyHandler = leakMemory(); // Retained in heap indefinitely
```

[Memory management](../../Javascript/javascript-lectures/day-21-memory-reachability-and-garbage-collection.md)

## V8 engine optimizations: Hidden classes and Inline Caches

**1. Hidden classes (Shapes) and transition trees**

V8 generates internal "Hidden Classes" (Shapes) behind every JavaScript object. Objects that share the exact same properties declared in the **exact same order** share the same hidden class, enabling fast memory offsets.

```js
// Optimal: Shapes match - identical hidden class shared
function Point(x, y) {
  this.x = x;
  this.y = y;
}
const p1 = new Point(1, 2);
const p2 = new Point(3, 4);

// Deoptimized: Adding properties in different orders creates separate hidden classes
const bad1 = {}; bad1.a = 1; bad1.b = 2; // Shape A -> Shape B
const bad2 = {}; bad2.b = 2; bad2.a = 1; // Shape A -> Shape C (Different Shape!)
```

**2. Inline Caches (ICs): Monomorphic vs Megamorphic**

Inline Caches optimize property access sites by caching memory offsets for observed shapes:
- **Monomorphic (1 Shape):** Fast path; property offset read in 1 machine instruction.
- **Polymorphic (2–4 Shapes):** Multiple shape branches checked.
- **Megamorphic (5+ Shapes):** Deoptimized; falls back to slow hash-table dictionary lookup.

```js
// Monomorphic call site: Always invoked with identical Point shape
function getX(point) {
  return point.x; // V8 inlines offset directly
}
```

[Performance optimizations](../../Javascript/javascript-lectures/day-22-performance-and-algorithmic-reasoning.md)

## Testing strategies: Stubs, Mocks, and Spies

**1. Test double taxonomy**

Choose the appropriate test double to ensure tests are fast, reliable, and decoupled from implementation details:
- **Stub:** Replaces a dependency with hardcoded, predetermined answers (e.g., returning `{ id: 1 }`).
- **Spy:** Wraps an existing method to record invocation arguments, call counts, and return values without altering original behavior.
- **Mock:** Pre-programs expectations about method calls (e.g., expecting `mailService.send` to be called exactly once with specific arguments); fails the test if expectations are violated.

```js
// Unit test using a Spy / Mock double
import { jest } from "@jest/globals";

test("userService logs user registration", async () => {
  const loggerSpy = jest.spyOn(logger, "info");
  await userService.register({ email: "user@corp.com" });

  expect(loggerSpy).toHaveBeenCalledTimes(1);
  expect(loggerSpy).toHaveBeenCalledWith("User registered: user@corp.com");

  loggerSpy.mockRestore(); // Crucial: restore original method
});
```

[Testing strategy](../../Javascript/javascript-lectures/day-23-testing-javascript-behavior.md)

## Diagnostics, profiling, and heap inspection

**1. CPU profiling and detecting event loop bottlenecks**

Profile CPU execution using `node --cpu-prof app.js`. Load the generated `.cpuprofile` into Chrome DevTools to inspect the Flamegraph. Look for wide, flat functions (hot synchronous code) dominating execution time.

**2. Heap snapshot comparison**

Capture a baseline heap snapshot, perform the suspected memory-leaking action (e.g., simulate 1,000 HTTP requests), and capture a second snapshot. Sort the comparison by **# Delta** and **Size Delta** to isolate retained objects that failed to garbage-collect.

[Debugging and profiling](../../Javascript/javascript-lectures/day-24-debugging-and-language-failures.md)

## Tricky points

1. **Memory and garbage collection**

**1.1 Unintentionally retaining large objects in closures**
If an inner function references one small variable from an outer scope that also declares a massive array or buffer, V8’s lexical scope object retains the entire enclosing environment, preventing the massive array from garbage collection.

**1.2 Circular references vs WeakRef**
Modern Mark-and-Sweep garbage collectors easily collect circular object references (`a.b = b; b.a = a`) as long as neither object is reachable from a root; however, unmanaged `Map` keys holding circular references remain rooted forever.

2. **V8 performance traps**

**2.1 Using `delete obj.key` deoptimizing objects**
Calling `delete obj.prop` alters the object’s hidden class and deoptimizes it into slow dictionary mode (hash table). Prefer setting `obj.prop = undefined` or constructing a new object.

**2.2 Array hole polymorphism**
Deleting an index from an array (`delete arr[2]`) transforms a packed, contiguous memory array (`PACKED_ELEMENTS`) into a slow, sparse dictionary array (`HOLEY_ELEMENTS`), degrading access performance across all array methods.

3. **Testing and test doubles**

**3.1 Forgetting `mockRestore()` polluting subsequent tests**
Spying on global or shared module methods without restoring them in an `afterEach()` hook leaves mocked behaviors active, silently compromising the correctness of subsequent test suites.

**3.2 Unreturned Promises in test blocks**
Writing asynchronous expectations inside a test block without returning the Promise or using `await` causes the test runner to register the test as passing immediately before assertions execute.