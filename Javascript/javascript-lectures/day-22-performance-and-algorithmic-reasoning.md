# Day 22: Performance and Algorithmic Reasoning

<nav aria-label="Lecture navigation">

[Previous: Memory, Reachability, and Ownership](day-21-memory-reachability-and-garbage-collection.md) | [Roadmap](../javascript-roadmap.md) | [Next: Testing JavaScript Behavior](day-23-testing-javascript-behavior.md)

</nav>

## Learning Outcomes

- Analyze time, space, and allocation costs with explicit assumptions.
- Choose arrays, objects, `Map`, and `Set` for backend data operations.
- Recognize mutation, copying, recursion-depth, and event-loop risks.
- Compare eager and lazy implementations without inventing benchmark claims.

## Prerequisites and Links

Read [Day 05](day-05-control-flow-and-loops.md), [Day 12](day-12-built-in-data-structures-and-serialization.md), [Day 14](day-14-iterables-iterators-generators-and-symbols.md), and [Day 21](day-21-memory-reachability-and-garbage-collection.md).

## Core Concepts

Complexity is a model of how work grows with input size. State assumptions: lookup key distribution, data structure invariants, sorting needs, allocation, and whether input is trusted. Big-O does not replace measurement, but it exposes dangerous growth patterns early.

An array scan is generally $O(n)$; a `Map` lookup is specified in terms of average sublinear access requirements, not a universal constant-time implementation. Sorting is commonly $O(n \log n)$ but depends on the engine and algorithm. State guarantees and workload assumptions rather than promising exact timings.

## Detailed Explanations of Difficult Behavior

### Indexing versus repeated scanning

```js
// Node.js or any ECMAScript host
function countByCategory(items) {
  const counts = new Map();
  for (const item of items) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  return counts;
}

const result = countByCategory([{ category: "a" }, { category: "b" }, { category: "a" }]);
console.log([...result]); // [ [ "a", 2 ], [ "b", 1 ] ]
```

Building an index is $O(n)$ and uses additional space. Repeatedly scanning the full list for each category can become quadratic. The index is worthwhile when lookup frequency and memory budget justify it.

### Recursion depth

```js
function sum(items, index = 0) {
  if (index === items.length) return 0;
  return items[index] + sum(items, index + 1);
}

console.log(sum([1, 2, 3])); // 6
```

The recurrence is clear, but very large input can exceed the implementation's call-stack capacity. An iterative version avoids that runtime-sensitive limit.

## Examples and Traces

**Environment:** Node.js or another modern ECMAScript runtime.

```js
function sumIteratively(items) {
  let total = 0;
  for (const item of items) total += item;
  return total;
}

const input = [1, 2, 3];
console.log(sumIteratively(input)); // 6
```

Compare both versions using a focused correctness test and a large bounded input. Do not claim a performance result without actually running the same runtime and workload.

## Node.js Connection

JavaScript computation runs on the event-loop execution path unless moved to another Node mechanism. An $O(n^2)$ request operation or a huge synchronous copy can delay unrelated requests. Algorithm choice, allocation volume, and input limits are latency and availability decisions.

---

## Compare & Recall

| Concept A | Concept B | Key difference |
|---|---|---|
| Time complexity O(n) | Space complexity O(n) | Time: how execution steps grow with input size. Space: how memory usage grows. A solution can have O(n) time but O(1) space (streaming) or O(1) time but O(n) space (pre-built lookup). |
| Array linear scan O(n) | Map lookup O(1) expected | Scanning an array for a key each time is O(n). Building a `Map` once and looking up is O(1) expected per lookup. If there are many lookups, the map wins despite upfront O(n) build cost. |
| Recursive solution | Iterative solution | Recursion is often clearer. But each recursive call adds a stack frame; deep recursion causes `RangeError: Maximum call stack size exceeded`. Iterative with an explicit stack handles unbounded depth. |
| Generator / lazy | Eager array | Eager: compute all values first, then process. Lazy: compute one value at a time on demand. Lazy is memory-efficient for large/infinite sequences; eager is simpler and sometimes faster for small inputs. |
| Mutation in place | Copy and transform | Mutation is faster (no allocation). Copying is safer for callers who expect the original unchanged. In interview questions, always state which approach you're using and why. |
| Input validation | Complexity analysis | Both matter in production. A valid O(log n) algorithm on uncapped input is O(adversarial). Always pair complexity with an input-size bound. |

> **Cross-day links:** Data structures (`Map`, `Set`, array) are in [Day 12](day-12-built-in-data-structures-and-serialization.md). Memory and GC implications of large data structures are in [Day 21](day-21-memory-reachability-and-garbage-collection.md). Generators for lazy evaluation are in [Day 14](day-14-iterables-iterators-generators-and-symbols.md).

## Common Mistakes and Interview Traps

- Calling every `Map` operation universally $O(1)$.
- Ignoring memory amplification from copies and intermediate arrays.
- Assuming `sort()` is numeric by default; it compares string representations unless given a comparator.
- Replacing a simple linear scan with an index whose construction and memory cost are never used.
- Treating recursion as safer merely because it is shorter.

## Tricky Points

- Complexity describes growth, not exact wall-clock time.
- Lazy generators reduce eager allocation but may increase repeated work if values are consumed repeatedly.
- Shallow copies protect only the outer container; nested mutation remains shared.

## Practical Exercise

**Goal:** Compare two implementations of lookup and aggregation.

**Inputs:** An array of records with duplicate keys and malformed records.

**Outputs:** Validated counts and a list of rejected indexes.

**Constraints:** State time and space complexity, preserve input order for errors, and do not mutate the input.

**Edge cases:** Empty input, duplicate keys, `NaN` values, sparse arrays, and very large bounded input.

**Acceptance criteria:** Include an iterative implementation, a justified data-structure choice, tests for correctness, and an explicit input-size limit.

## Summary

Use complexity to expose growth, then account for allocation, mutation, input validity, and runtime limits. Arrays are useful for ordered sequences; `Map` and `Set` express keyed identity and membership. Avoid unbounded synchronous work in a Node request path.

## Cheat Sheet

| Need | Typical choice |
|---|---|
| Ordered sequence | Array |
| Keyed lookup | `Map` |
| Membership/deduplication | `Set` |
| Recursive clarity | Recursion with a depth bound or small input |
| Large unknown depth | Iteration |
| Lazy production | Generator/iterator |

## Interview Questions

> Difficulty guide: **[Beginner]** = entry-level, **[Mid]** = requires understanding of internals, **[Senior]** = design and tradeoff thinking expected.

1. **[Mid] Analysis:** Compare scan-per-query with an indexed `Map` solution, including construction cost and memory.
2. **[Senior] Debugging:** A recursive parser fails only on large input. Explain why and propose an iterative design.
3. **[Senior] Design:** Choose data structures for a high-throughput Node request path under a memory budget and an adversarial input limit.
