# Day 6: Memory, Performance, Testing, and Debugging

## Memory and performance

**1. Reachability and garbage collection**

Objects reachable from program roots remain live; unreachable objects can be collected, but collection timing is not guaranteed.

**2. Retained references and leaks**

Caches, listeners, timers, or closures can keep objects alive; bound and release owned state.

```js
const timer = setInterval(work, 1000);
clearInterval(timer); // release when no longer needed
```

**3. Performance reasoning**

Estimate time/space growth, mutation/copying, eager/lazy work, batching, recursion depth, and numeric limits; measure actual hot paths.

[Memory](../../Javascript/javascript-lectures/day-21-memory-reachability-and-garbage-collection.md) | [Performance](../../Javascript/javascript-lectures/day-22-performance-and-algorithmic-reasoning.md)

## Testing and debugging

**1. Behavior tests**

Test observable outputs, errors, cleanup, boundaries, and async completion; isolate external effects where needed.

```js
await expect(loadUser("missing")).rejects.toThrow("not found");
```

**2. Debugging**

Reduce a failure to a minimal reproduction; distinguish parse errors, runtime exceptions, and valid-but-wrong results.

**3. Execution traces**

Follow bindings, object identity, call order, and promise settlement to find the cause instead of guessing.

[Testing](../../Javascript/javascript-lectures/day-23-testing-javascript-behavior.md) | [Debugging](../../Javascript/javascript-lectures/day-24-debugging-and-language-failures.md)

## Tricky points

1. **Memory**
	1.1 **Garbage collection:** It frees unreachable memory eventually; it is not a substitute for closing files, timers, sockets, or listeners.
	1.2 **Closures:** They retain referenced lexical state; a callback stored forever can retain much more data than expected.
2. **Performance**
	2.1 **Complexity:** `O(n)` can still be expensive for huge input; include memory, allocation, and input bounds.
	2.2 **Measurement:** Benchmark representative workloads and warm-up/runtime conditions; a microbenchmark may not reflect service behavior.
3. **Testing and debugging**
	3.1 **Async tests:** Return/await the promise; otherwise the test can finish before the assertion or rejection.
	3.2 **Valid output:** A program can parse and run without throwing yet still be incorrect; assert expected results, not only absence of errors.