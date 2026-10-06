# Day 7: Mixed Patterns and Senior Interview Practice

Quick review of main-course lectures 56–60. Focuses on constraint-to-complexity mapping, senior live interview communication, production Node.js event-loop considerations, and systematic unsticking frameworks.

## Pattern selection and constraint mapping

**1. Input size to complexity threshold**

Evaluate $N$ from problem constraints to dictate optimal algorithm class immediately:

```text
N <= 10..20:      O(2^N) or O(N!) - Backtracking, permutations, subsets
N <= 500..1000:   O(N^2) or O(N^3) - 2D DP, Floyd-Warshall, matrix traversals
N <= 10^5..10^6:  O(N) or O(N log N) - Two pointers, sorting, heaps, hash maps, binary search
N >= 10^9:        O(log N) or O(1) - Binary search on answer, mathematical formulas
```

**2. Pattern decision matrix**

- **Sorted array:** Two pointers, binary search, sliding window.
- **Top / Bottom K items or streaming data:** Heap / Priority Queue.
- **Shortest path:** BFS (unweighted), Dijkstra (non-negative weights).
- **Substrings / Subarrays:** Sliding window, prefix sums + hash map.
- **Parentheses / Matching / Next greater:** Monotonic Stack.
- **Dependency ordering / Prerequisites:** Topological Sort (Kahn's algorithm).
- **Disjoint groups / Dynamic connectivity:** Disjoint Set Union (DSU).
- **Optimal choices with overlapping states:** Dynamic Programming.

**3. Live interview 7-step communication protocol**

1. *Clarify:* Confirm input bounds, duplicates, mutation rules, empty states.
2. *Brute Force:* State baseline approach and identify its $O(n^2)$ bottleneck.
3. *Optimal Invariant:* State chosen data structure and core invariant before typing.
4. *Dry Run:* Step through a small representative trace on paper/comments.
5. *Code:* Write clean, modular JavaScript with explicit naming.
6. *Analyze:* State exact time and auxiliary space complexities separately.
7. *Edge Test:* Trace empty array, single element, negative numbers, extreme duplicates.

[Mixed pattern strategy](../../DSA/dsa-lectures/day-56-mixed-pattern-strategy-and-constraints.md) | [High-frequency problems](../../DSA/dsa-lectures/day-57-high-frequency-senior-interview-problems.md) | [Live interview execution](../../DSA/dsa-lectures/day-59-live-interview-framework-and-unsticking.md)

## Production Node.js DSA and runtime considerations

**1. Event loop protection and CPU chunking**

Heavy synchronous algorithms block the Node.js event loop, halting incoming HTTP requests. Yield control periodically using `setImmediate()` to permit I/O processing.

```js
async function processLargeDataset(items, batchSize = 1000) {
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    processChunk(chunk);
    await new Promise(resolve => setImmediate(resolve)); // Yield to event loop
  }
}
```

**2. Memory footprints: V8 object overhead vs typed arrays**

JavaScript arrays of objects create high pointer and hidden-class memory overhead in V8. For large numerical datasets, use `Int32Array` or `Float64Array` to avoid garbage collection pressure.

```js
// Typed array: flat, contiguous, zero V8 object header overhead
const vector = new Int32Array(1_000_000); // exactly 4MB memory
```

**3. Streaming vs buffering**

Avoid buffering multi-gigabyte datasets in memory with `arr.push()`; process streams chunk-by-chunk using Node.js `stream.Transform`.

[DSA in production Node.js](../../DSA/dsa-lectures/day-58-dsa-in-production-nodejs-backends.md) | [Comprehensive master review](../../DSA/dsa-lectures/day-60-comprehensive-dsa-master-cheat-sheet.md)

## Tricky points

1. **Senior interview communication**
   **1.1 Premature coding:** Typing code before agreeing on complexity and invariants often leads to restarts under time pressure; validate logic with the interviewer first.
   **1.2 Unsticking trap:** When stuck on an optimization, do not guess randomly; reduce input size to $N = 3$, list all state transitions, and ask which repeated computation can be cached or skipped.

2. **Node.js runtime traps**
   **2.1 Call stack limits:** V8 default call stack depth is $\approx 10^4$ frames; recursive DFS exceeding this throws `RangeError: Maximum call stack size exceeded`. Convert deep traversals to iterative stacks.
   **2.2 Integer precision:** Integers larger than $2^{53} - 1$ (`Number.MAX_SAFE_INTEGER`) lose precision silently; use `BigInt` (e.g. `123n`) for 64-bit IDs.
   **2.3 Unbounded Map memory leaks:** Storing cache entries in a raw `Map` without TTL or LRU eviction causes slow heap exhaustion and process crash in production services.