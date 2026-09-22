# Day 21: Memory, Reachability, and Ownership

<nav aria-label="Lecture navigation">

[Previous: Jobs, Microtasks, and Observable Scheduling](day-20-jobs-microtasks-and-scheduling.md) | [Roadmap](../javascript-roadmap.md) | [Next: Performance and Algorithmic Reasoning](day-22-performance-and-algorithmic-reasoning.md)

</nav>

## Learning Outcomes

- Explain reachability and object lifetime without treating garbage collection as a correctness mechanism.
- Find common retention paths through closures, listeners, module state, and caches.
- Choose between strong and weak ownership deliberately.
- Design bounded state for long-lived Node.js processes.

## Prerequisites and Links

Read [Day 08](day-08-closures-execution-context-and-this.md), [Day 09](day-09-objects-and-property-access.md), [Day 12](day-12-built-in-data-structures-and-serialization.md), and [Day 19](day-19-async-await-errors-and-cleanup.md). This lecture uses ECMAScript concepts; heap snapshots and Node diagnostics belong to the Node curriculum.

## Core Concepts

JavaScript implementations may reclaim an object when it is no longer reachable from live roots. Scope, reachability, and garbage-collection timing are related but not identical. A binding can disappear while an object remains reachable through another reference; a long-lived module binding can retain a large graph.

`Map`, arrays, object properties, closures, and pending promises create strong references. `WeakMap` and `WeakSet` do not keep object keys alive, but they are not general-purpose observable caches: they are not iterable and require object keys.

### Ownership questions

For every long-lived value ask: who owns it, who may mutate it, how is it bounded, and when is it released? A cache without an eviction rule is an ownership bug waiting to become a memory problem.

## Detailed Explanations of Difficult Behavior

### Closure retention

```js
// Node.js or any ECMAScript host
function createHandler(largePayload) {
  return () => largePayload.id;
}

const handler = createHandler({ id: 7, records: new Array(100_000).fill("data") });
console.log(handler()); // 7
```

The returned function keeps access to the binding and can therefore keep the payload reachable. This is not automatically a leak; it becomes a problem when the handler outlives its intended request or subscription.

### Weak ownership

```js
const metadata = new WeakMap();
const request = {};
metadata.set(request, { startedAt: 123 });
console.log(metadata.get(request).startedAt); // 123
console.log(metadata.has(request)); // true
```

The metadata is associated with the object without creating an enumerable property. The language does not provide a reliable way to observe when collection happens, so do not use weak collections for required business data or cleanup timing.

## Examples and Traces

**Environment:** Node.js, CommonJS or ESM, no Node-specific API required.

```js
function createBoundedCache(maxEntries) {
  const values = new Map();

  return {
    get(key) { return values.get(key); },
    set(key, value) {
      values.delete(key);
      values.set(key, value);
      while (values.size > maxEntries) values.delete(values.keys().next().value);
    },
    size() { return values.size; },
  };
}

const cache = createBoundedCache(2);
cache.set("a", 1);
cache.set("b", 2);
cache.set("c", 3);
console.log(cache.size()); // 2
console.log(cache.get("a")); // undefined
```

The observable guarantee here is the explicit bound, not when the runtime collects unreachable objects.

## Node.js Connection

A Node process may serve requests for days. Module-level arrays, retained request closures, event listeners, pending promises, and unbounded maps can therefore accumulate across requests. Node heap tools can help locate retainers, but the language-level fix is usually clearer ownership, bounded state, and explicit teardown.

---

## Compare & Recall

| Concept A | Concept B | Key difference |
|---|---|---|
| Strong reference | Weak reference | A strong reference keeps the object alive (GC cannot collect it). A weak reference (`WeakMap`/`WeakRef`) lets GC collect the object if no other strong references exist. |
| `Map` | `WeakMap` | `Map` holds strong key references — entries stay until explicitly deleted. `WeakMap` holds weak keys — the entry is eligible for GC when the key object has no other references. |
| Memory leak | Intentional retention | Not all long-lived objects are leaks. A cache, a registry, or a subscriber list is intentionally retained. A leak is retention that persists longer than intended with no path to release. |
| `WeakRef` | `WeakMap` | `WeakRef` holds a weak reference to a single value; you call `.deref()` to get it back. `WeakMap` maps weak keys to values. Neither is iterable or suitable for explicit cleanup logic. |
| `FinalizationRegistry` | Explicit teardown | `FinalizationRegistry` runs a callback **after** GC, timing unknown, not guaranteed. Explicit teardown (`.close()`, `.removeEventListener()`) runs immediately and reliably. Never use GC callbacks for correctness. |
| Closure capture | Pass-by-value | Closures capture **references** to variables, not copies of values. If a large object is only reachable through a closure, it stays alive as long as the closure does. |

> **Cross-day links:** `WeakMap` key identity and use cases are introduced in [Day 12](day-12-built-in-data-structures-and-serialization.md). Object lifetimes and property ownership are in [Day 09](day-09-objects-and-property-access.md). Async resource cleanup with `finally` is in [Day 19](day-19-async-await-errors-and-cleanup.md).

## Common Mistakes and Interview Traps

- Calling every retained closure a memory leak.
- Assuming `const` makes an object immutable or short-lived.
- Using `WeakMap` for data that must be listed or persisted.
- Depending on finalizers for correctness or timely cleanup.
- Measuring allocation without measuring retained reachability.

## Tricky Points

- Garbage collection timing is implementation behavior, not an application scheduling contract.
- A weak reference can disappear between observations; weak collections intentionally provide limited observability.
- Closing over a small property can still retain a larger object graph if the closure captures the original object.

## Practical Exercise

**Goal:** Diagnose and redesign a retained-object graph.

**Inputs:** A subscription factory that captures a request object and stores handlers in a module-level array.

**Constraints:** Preserve required subscriptions, provide unsubscribe behavior, bound any cache, and do not rely on finalizers.

**Edge cases:** Duplicate subscriptions, failed initialization, repeated teardown, and a large request payload.

**Acceptance criteria:** Draw the strong-reference paths, implement explicit release, and verify that the collection length and cache size remain bounded after repeated use.

## Summary

Reachability determines whether an implementation may reclaim an object. Closures and module state can intentionally or accidentally extend lifetimes. Strong collections need ownership and bounds; weak collections associate metadata with objects without making collection observable. Garbage collection is not a cleanup API.

## Cheat Sheet

| Concern | Decision cue |
|---|---|
| `Map` or array | Use when entries must be observable; define bounds or deletion |
| `WeakMap` | Object-keyed auxiliary metadata; not iterable |
| Closure | Inspect captured graph and intended lifetime |
| Cache | Define maximum size, eviction, and ownership |
| Finalization | Never use for required correctness |

## Interview Questions

> Difficulty guide: **[Beginner]** = entry-level, **[Mid]** = requires understanding of internals, **[Senior]** = design and tradeoff thinking expected.

1. **[Mid] Definition:** Explain reachability versus lexical scope. Include a closure example.
2. **[Senior] Debugging:** A service's heap grows after every request. Identify likely retention paths and the evidence you would collect.
3. **[Senior] Design:** Design a bounded cache with explicit ownership, eviction, and testable teardown. State what belongs to JavaScript and what belongs to Node diagnostics.
