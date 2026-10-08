# Day 60: Comprehensive DSA Master Cheat Sheet and Revision Map

<nav aria-label="Lecture navigation">
  <a href="day-59-live-interview-framework-and-unsticking.md">◀ Day 59: Live Interview Framework and Unsticking Strategies</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <span>Curriculum Completed! Ready for Technical Interviews! 🎉</span>
</nav>

---
## Prerequisites

- [Day 01 through Day 59: Complete 12-Week Curriculum](day-01-big-o-notation-and-algorithm-analysis-in-v8.md) — All foundational, intermediate, and advanced DSA topics.
---

## 1. Data Structures Master Reference Matrix

A data structure master reference matrix is a unified asymptotic complexity lookup system that maps fundamental abstract data types to their operational Big-O runtimes and space constraints across average and worst-case execution conditions.

| Data Structure | Access (Avg / Worst) | Search (Avg / Worst) | Insertion (Avg / Worst) | Deletion (Avg / Worst) | Auxiliary Space |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Array** | $O(1) / O(1)$ | $O(n) / O(n)$ | $O(n) / O(n)$ (mid) | $O(n) / O(n)$ (mid) | $O(n)$ contiguous |
| **Linked List (Singly)** | $O(n) / O(n)$ | $O(n) / O(n)$ | $O(1) / O(1)$ (head) | $O(1) / O(1)$ (head) | $O(n)$ pointers |
| **Linked List (Doubly)** | $O(n) / O(n)$ | $O(n) / O(n)$ | $O(1) / O(1)$ (head/tail)| $O(1) / O(1)$ (node ref) | $O(n)$ two pointers |
| **Stack / Queue** | $O(n) / O(n)$ | $O(n) / O(n)$ | $O(1) / O(1)$ | $O(1) / O(1)$ | $O(n)$ buffer |
| **Hash Map / Set** | N/A | $O(1) / O(n)$ | $O(1) / O(n)$ | $O(1) / O(n)$ | $O(n)$ buckets |
| **Binary Search Tree** | $O(\log n) / O(n)$ | $O(\log n) / O(n)$ | $O(\log n) / O(n)$ | $O(\log n) / O(n)$ | $O(n)$ tree nodes |
| **Balanced BST (AVL/RB)**| $O(\log n) / O(\log n)$ | $O(\log n) / O(\log n)$ | $O(\log n) / O(\log n)$ | $O(\log n) / O(\log n)$ | $O(n)$ tree nodes |
| **Binary Heap (PQ)** | $O(1)$ (peek root) | $O(n) / O(n)$ | $O(\log n) / O(\log n)$ | $O(\log n) / O(\log n)$ | $O(n)$ flat array |
| **Trie (Prefix Tree)** | N/A | $O(L) / O(L)$ | $O(L) / O(L)$ | $O(L) / O(L)$ | $O(N \cdot L \cdot \Sigma)$ |
| **Graph (Adj List)** | N/A | $O(V + E)$ | $O(1)$ add edge | $O(E)$ remove edge | $O(V + E)$ lists |
| **Graph (Adj Matrix)** | N/A | $O(1)$ edge check | $O(1)$ add edge | $O(1)$ remove edge | $O(V^2)$ matrix |
| **Union-Find (DSU)** | N/A | $O(\alpha(n))$ `find` | $O(\alpha(n))$ `union` | N/A | $O(n)$ flat array |

*Note: $L$ is string length; $\Sigma$ is alphabet size; $\alpha(n)$ is the Inverse Ackermann function ($\le 4$).*

---

## 2. Sorting Algorithms Master Matrix

A sorting algorithm master matrix is a systematic comparison framework documenting the asymptotic time complexities, auxiliary memory bounds, and stability characteristics of canonical data ordering procedures.

| Algorithm | Best Time | Average Time | Worst Time | Space | Stable? | Production / V8 Context |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **QuickSort** | $O(n \log n)$ | $O(n \log n)$ | $O(n^2)$ | $O(\log n)$ | No | Historical V8 sort (prior to 2018) |
| **MergeSort** | $O(n \log n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ | Yes | Foundational divide-and-conquer |
| **TimSort** | $O(n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ | Yes | **Current V8 `Array.prototype.sort()`** |
| **HeapSort** | $O(n \log n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(1)$ | No | Guaranteed in-place $O(n \log n)$ |
| **BucketSort** | $O(n + k)$ | $O(n + k)$ | $O(n^2)$ | $O(n)$ | Yes | Top K Frequent Elements ($O(n)$) |

---

## 3. The 17 Core Algorithmic Patterns Master Reference

Algorithmic design patterns are reusable structural templates that map recurring computational problems to optimal space-time strategies, abstracting specific input details into standardized algorithmic paradigms.

| # | Pattern Name | Trigger Keyword | Template Strategy | Key Benchmark Problem | Day |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Frequency Counter** | Anagrams, duplicates | `Map<key, count>` | Group Anagrams (LC 49) | Day 06 |
| **2** | **Hash Complements** | Target pair sum | `map.has(target - val)` | Two Sum (LC 1) | Day 07 |
| **3** | **Two Pointers (Opposing)** | Sorted array, container | `left = 0, right = n - 1` | 3Sum (LC 15), Container Water (LC 11) | Day 11 |
| **4** | **Fast & Slow Pointers** | Cycles, linked list midpoint | `slow = slow.next, fast = fast.next.next` | Linked List Cycle II (LC 142) | Day 12 |
| **5** | **Sliding Window (Fixed)** | Max sum of size $K$ | Maintain rolling sum of window | Max Subarray of Size K | Day 13 |
| **6** | **Sliding Window (Variable)**| Longest substring without duplicates | Expand `right`, contract `left` | Longest Substring Without Repeat (LC 3) | Day 14 |
| **7** | **Prefix Sum** | Subarray sum equals $K$ | `prefixSum[i] - target` in Map | Subarray Sum Equals K (LC 560) | Day 15 |
| **8** | **Monotonic Stack** | Next greater / smaller element | Pop stack while `curr > stack.top` | Daily Temperatures (LC 739) | Day 18 |
| **9** | **Binary Search (Bounds)** | First / last occurrence | `while (low <= high)`, strict updates | Find First and Last Position (LC 34) | Day 26 |
| **10**| **Binary Search on Solution**| Min capacity, max allocation | Feasibility predicate `canShip(cap)` | Koko Bananas (LC 875) | Day 28 |
| **11**| **Backtracking / Subsets** | All permutations, combinations | Choose $\to$ Explore $\to$ Unchoose | Subsets (LC 78), N-Queens (LC 51) | Day 22 |
| **12**| **Tree DFS Traversal** | Path sums, ancestor queries | Pre/In/Post-order recursive depth | Max Path Sum (LC 124) | Day 33 |
| **13**| **BFS Level Order** | Shortest path unweighted, views | FIFO queue + level sizing | Word Ladder (LC 127) | Day 37 |
| **14**| **Topological Sort** | Build dependencies, cycles | Kahn's In-Degree Queue | Course Schedule II (LC 210) | Day 40 |
| **15**| **Top-K Bounded Heap** | K-th largest, stream median | Min-Heap of size $K$ / Two Heaps | Kth Largest (LC 215), Median Stream (LC 295) | Day 43 |
| **16**| **Dynamic Programming** | Optimal choices, knapsack | State $\to$ Recurrence $\to$ Base | House Robber (LC 198), 0/1 Knapsack | Day 47 |
| **17**| **Disjoint Set Union (DSU)**| Dynamic connectivity, cycles | Path Compression + Union by Rank | Redundant Connection (LC 684) | Day 54 |

---

## 4. Canonical Algorithmic Code Templates

Canonical algorithmic code templates are standardized, language-idiomatic implementation skeletons that encapsulate the invariant loop structures, boundary conditions, and state transitions of core computational patterns.

```javascript
// Node.js code: Master Template Suite for Core Algorithmic Patterns

// --- Pattern A: Two Pointers (Opposing) ---
function twoPointersOpposing(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return [-1, -1];
}

// --- Pattern B: Sliding Window (Variable Length / Contraction) ---
function slidingWindowVariable(str) {
  let left = 0, maxLen = 0;
  const charFreq = new Map();

  for (let right = 0; right < str.length; right++) {
    const char = str[right];
    charFreq.set(char, (charFreq.get(char) || 0) + 1);

    // Contract window when window condition is violated
    while (charFreq.get(char) > 1) {
      const leftChar = str[left];
      charFreq.set(leftChar, charFreq.get(leftChar) - 1);
      left++;
    }
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}

// --- Pattern C: Binary Search on Monotonic Predicate ---
function binarySearchPredicate(low, high, isValid) {
  let ans = -1;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (isValid(mid)) {
      ans = mid;         // Record potential optimal answer
      high = mid - 1;    // Try smaller value for minimum search
    } else {
      low = mid + 1;
    }
  }
  return ans;
}

// --- Pattern D: Monotonic Decreasing Stack (Next Greater Element) ---
function nextGreaterElements(nums) {
  const n = nums.length;
  const result = new Array(n).fill(-1);
  const stack = []; // Stores indices

  for (let i = 0; i < n; i++) {
    while (stack.length > 0 && nums[i] > nums[stack[stack.length - 1]]) {
      const prevIdx = stack.pop();
      result[prevIdx] = nums[i];
    }
    stack.push(i);
  }
  return result;
}

// --- Pattern E: Kahn's Topological Sort (In-Degree Queue) ---
function topologicalSort(numNodes, edges) {
  const adj = Array.from({ length: numNodes }, () => []);
  const inDegree = new Int32Array(numNodes);

  for (const [u, v] of edges) {
    adj[u].push(v);
    inDegree[v]++;
  }

  const queue = [];
  for (let i = 0; i < numNodes; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }

  const order = [];
  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    order.push(curr);
    for (const neighbor of adj[curr]) {
      if (--inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  return order.length === numNodes ? order : []; // Empty if cycle detected
}

// --- Pattern F: Disjoint Set Union (Path Compression + Rank) ---
class DisjointSetUnion {
  constructor(n) {
    this.parent = new Int32Array(n);
    this.rank = new Int32Array(n);
    for (let i = 0; i < n; i++) this.parent[i] = i;
  }

  find(i) {
    if (this.parent[i] === i) return i;
    return (this.parent[i] = this.find(this.parent[i])); // Path compression
  }

  union(i, j) {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI === rootJ) return false; // Cycle detected

    if (this.rank[rootI] < this.rank[rootJ]) {
      this.parent[rootI] = rootJ;
    } else if (this.rank[rootI] > this.rank[rootJ]) {
      this.parent[rootJ] = rootI;
    } else {
      this.parent[rootJ] = rootI;
      this.rank[rootI]++;
    }
    return true;
  }
}
```

---

## 5. 12-Week Post-Course Revision Plan & Pre-Interview Checklist

A structured revision roadmap is a spaced-repetition retention schedule that organizes comprehensive computer science curriculum topics into prioritized review blocks, benchmark challenges, and time-boxed mock interviews.

| Review Phase | Curriculum Weeks | Focus Topics | Target Benchmark Problems |
| :--- | :--- | :--- | :--- |
| **Phase 1: Linear & Sliding** | Weeks 1–3 | Arrays, Two Pointers, Sliding Window, Prefix Sum | 3Sum (LC 15), Minimum Window Substring (LC 76) |
| **Phase 2: Stack, Search, LL** | Weeks 4–6 | Monotonic Stack, Binary Search Bounds/Space, Linked Lists | Daily Temperatures (LC 739), Koko Bananas (LC 875) |
| **Phase 3: Trees & Graphs** | Weeks 7–9 | Tree DFS/BFS, Graph Traversal, Cycles, Topo Sort, Heaps | Course Schedule II (LC 210), Median Stream (LC 295) |
| **Phase 4: Advanced Mastery**| Weeks 10–12| Dynamic Programming (1D & 2D), Greedy, DSU, Mock Loops | Coin Change (LC 322), Longest Common Subsequence (LC 1143) |

#### Pre-Interview 24-Hour Checklist:
1. **No New Unsolved Hard Problems**: Only review canonical patterns and your personal bug journal.
2. **Review V8 Runtime Constraints**: Memorize `Number.MAX_SAFE_INTEGER`, hidden classes, and the 10ms event loop budget.
3. **Internalize the 4-Phase Delivery Framework**: Clarify $\to$ Architecture $\to$ Step-wise Implementation $\to$ Manual Dry-Run.

---

## Detailed Node.js Relevance

### Algorithmic Engineering in Production Node.js Architecture

Production algorithmic engineering in Node.js is the application of theoretical time and space complexity principles to the constraints of the single-threaded V8 engine and libuv event loop architecture.

```text
The Production Node.js Runtime Spectrum:
1. Event Loop Budget:
   Keep synchronous operations strictly under 10ms.
   Chunk long loops using setImmediate() to prevent stalling I/O callbacks.

2. V8 Heap & GC Sympathy:
   Use TypedArrays (Int32Array, Float64Array) for large datasets.
   Preserve Monomorphic Hidden Classes (declare all properties in constructors).
   Never use delete obj.prop (de-optimizes to slow Dictionary Mode).

3. Memory Leaks:
   Always bound in-memory caches using LRU eviction policies.
   Clean up timers, stream event listeners, and WebSocket subscriber maps.

4. Multi-Threading:
   Offload heavily CPU-bound DSA routines to Worker Threads via worker_threads
   and transfer binary payloads using SharedArrayBuffer and Atomics.
```

---

## Tricky Points & Edge Cases

1. **Integer Precision Boundary ($2^{53} - 1$)**:
   In JavaScript, `Number.MAX_SAFE_INTEGER` is $9,007,199,254,740,991$. When calculating large DP combinations or factorials, standard numbers lose precision. Always use `BigInt` for arbitrary-precision integer calculations.
2. **Object Key Coercion**:
   JavaScript plain objects `{}` coerce all keys to strings (`obj[1]` becomes `obj["1"]`). In technical interviews, always use a `Map` or an array if keys are integers to avoid hidden string conversion overhead.
3. **Array Mutation in `.sort()`**:
   `Array.prototype.sort()` mutates the original array in-place. Always write `[...arr].sort((a, b) => a - b)` if caller data immutability is required.
4. **Empty and Single-Element Edge Cases**:
   Always verify edge bounds at the top of every function: `if (!head) return null;` or `if (nums.length <= 1) return ...`.
5. **Recursion Stack Frame Limit in V8**:
   V8 default stack frames max out around 10,000 recursive calls. Convert deep DFS paths (e.g., $10^5$ grid cells) to explicit array-based iterative stacks to avoid `RangeError: Maximum call stack size exceeded`.

---

## Hands-On Exercise

### Scenario
You are developing an automated coding assessment validator in Node.js. Implement `validateSystemPerformance(metricName, executionTimeMs, memoryUsageMb)`:
1. Validates that the algorithm meets the **Senior Production SLA Thresholds**:
   - `executionTimeMs` must be $\le 15\text{ms}$ (Event Loop Budget safe).
   - `memoryUsageMb` must be $\le 64\text{MB}$ (V8 Heap safe).
2. Returns `{ isProductionReady: boolean, status: string, warnings: string[] }`.
3. Emits specific architectural warnings if either budget is breached.

### Buggy Code
```javascript
function validateSystemPerformance(metricName, executionTimeMs, memoryUsageMb) {
  // BUG: Only checks execution time; completely ignores memory leaks and heap budgets!
  return {
    isProductionReady: executionTimeMs <= 50,
    status: executionTimeMs <= 50 ? 'PASS' : 'FAIL',
    warnings: []
  };
}
```

### Acceptance Criteria
- Enforce strict 15ms latency and 64MB memory limits.
- Return descriptive architectural warnings identifying which resource threshold failed.
- Test with passing, CPU-starved, and memory-leaking metrics.

### Solution Code
```javascript
const assert = require('assert');

// Node.js code: Production Algorithm Performance Auditor
/**
 * @param {string} metricName
 * @param {number} executionTimeMs
 * @param {number} memoryUsageMb
 * @returns {{ isProductionReady: boolean, status: string, warnings: string[] }}
 */
function validateSystemPerformance(metricName, executionTimeMs, memoryUsageMb) {
  const MAX_EVENT_LOOP_BUDGET_MS = 15.0;
  const MAX_HEAP_BUDGET_MB = 64.0;
  const warnings = [];

  if (executionTimeMs > MAX_EVENT_LOOP_BUDGET_MS) {
    warnings.push(
      `CPU Event Loop Risk: Execution time (${executionTimeMs}ms) exceeds the ${MAX_EVENT_LOOP_BUDGET_MS}ms budget. May stall concurrent I/O.`
    );
  }

  if (memoryUsageMb > MAX_HEAP_BUDGET_MB) {
    warnings.push(
      `Heap Allocation Risk: Memory consumption (${memoryUsageMb}MB) exceeds the ${MAX_HEAP_BUDGET_MB}MB budget. May induce V8 GC pauses.`
    );
  }

  const isProductionReady = warnings.length === 0;

  return {
    isProductionReady,
    status: isProductionReady ? 'READY' : 'DEGRADED',
    warnings
  };
}

// Verification & Automated Unit Tests
// Test 1: Production ready algorithm
const res1 = validateSystemPerformance('LRUCache', 2.4, 12.0);
assert.strictEqual(res1.isProductionReady, true);
assert.strictEqual(res1.status, 'READY');
assert.strictEqual(res1.warnings.length, 0);

// Test 2: CPU-bound event loop violation
const res2 = validateSystemPerformance('MatrixExponentiation', 45.0, 10.0);
assert.strictEqual(res2.isProductionReady, false);
assert.strictEqual(res2.warnings.length, 1);
assert.strictEqual(res2.warnings[0].includes('CPU Event Loop Risk'), true);

// Test 3: Memory leak / GC risk
const res3 = validateSystemPerformance('UnboundedTrie', 5.0, 128.0);
assert.strictEqual(res3.isProductionReady, false);
assert.strictEqual(res3.warnings.length, 1);
assert.strictEqual(res3.warnings[0].includes('Heap Allocation Risk'), true);

// Test 4: Both violated
const res4 = validateSystemPerformance('BruteForceGraph', 80.0, 256.0);
assert.strictEqual(res4.isProductionReady, false);
assert.strictEqual(res4.warnings.length, 2);

console.log('✅ All validateSystemPerformance assertions passed successfully!');
```

### Solution Explanation
1. **Event Loop Latency Enforcement**: Flags synchronous computations exceeding 15ms to prevent single-threaded I/O starvation.
2. **V8 Heap Budget Protection**: Flags allocations $> 64\text{MB}$ to prevent triggering Stop-The-World Mark-Sweep garbage collection cycles.
3. **Automated Verification**: Comprehensive assertions validate all performance states deterministically.

---

## Summary

- The **Big-O Master Matrix** consolidates asymptotic complexity for all 12 core data structures and 5 primary sorting algorithms.
- The **17 Algorithmic Patterns** categorize 95% of all technical coding interview problems into proven architectural templates.
- Senior-level engineering bridges algorithmic code to production runtime performance: V8 Hidden Classes, TypedArrays, bounded LRU caches, and cooperative event loop yielding.
- You have completed all 60 lectures of the comprehensive Node.js & JavaScript DSA interview curriculum!

---

## Cheat Sheet & Common Pitfalls

| Category | Golden Rule | Common Pitfall |
| :--- | :--- | :--- |
| **Array Sorting** | Always pass `(a, b) => a - b` | Calling `.sort()` converts numbers to strings |
| **Graph Traversal** | Mark visited **immediately upon enqueue** | Marking on dequeue causes exponential duplicates |
| **Recursion Limits** | Guard against $> 10,000$ stack frames in V8 | Using recursive DFS on deep serpentine matrices |
| **Heap Property** | Heaps do **not** sort horizontally | Confusing Binary Heap with Binary Search Tree |
| **0/1 Knapsack** | Iterate capacity **backwards** in 1D array | Forward iteration permits unbounded re-use |
| **Event Loop Safety** | Chunk synchronous CPU tasks via `setImmediate()` | Blocking single thread with synchronous $O(n^2)$ loops |

---

## Interview Questions

### 1. How does modern JavaScript's TimSort in V8 differ from classic QuickSort and MergeSort?
**Question:** Explain how V8's `Array.prototype.sort()` works internally, why it uses TimSort, and what performance benefits it offers over classic QuickSort.

**Answer:**
Prior to V8 v7.0 (2018), Node.js used an unstable QuickSort for arrays with $> 10$ elements. Since 2018, V8 uses **TimSort** (a hybrid of MergeSort and InsertionSort):
1. **Stability**: TimSort is **stable**, meaning elements with equal keys maintain their original relative order. QuickSort is unstable.
2. **Real-World Adaptive Performance**: Real-world datasets often contain pre-existing sorted subsequences ("runs"). While QuickSort always does $O(n \log n)$ work, TimSort identifies natural runs and merges them, achieving $O(n)$ linear time on partially sorted data.
3. **Worst-Case Safety**: QuickSort degrades to $O(n^2)$ on adversarial pivot inputs. TimSort is mathematically guaranteed to run in $O(n \log n)$ worst-case time with $O(n)$ space.

---

### 2. What is the fundamental difference between a Monotonic Stack and a Priority Queue?
**Question:** Compare a Monotonic Stack with a Priority Queue (Heap). When should you choose one over the other?

**Answer:**
- **Monotonic Stack**:
  - Maintains elements in strictly increasing or decreasing order while preserving **original sequential array order**.
  - Best for: Finding the **nearest** greater or smaller element to the left or right, or finding largest rectangular areas in histograms.
  - Complexity: $O(n)$ time across all operations ($O(1)$ amortized per element) because each element is pushed and popped at most once.
- **Priority Queue (Heap)**:
  - Maintains elements in **global priority order** without preserving their original relative sequence.
  - Best for: Repeatedly finding the **absolute global** minimum or maximum from a dynamic stream, or maintaining the Top $K$ elements.
  - Complexity: $O(\log n)$ per insertion or deletion.

---

### 3. How do you recognize whether a graph problem should be solved via BFS, DFS, or Union-Find?
**Question:** What decision framework tells you whether to use Breadth-First Search, Depth-First Search, or Union-Find for a graph problem?

**Answer:**
- **Use BFS**: When you need to find the **Shortest Path** (minimum edge transitions) in an unweighted graph or grid, or when traversing level-by-level (views, minimum hops, concentric rings).
- **Use DFS**: When you need to explore **all paths**, detect cycles in directed graphs (3-color state machine), perform backtracking, count connected components on static grids, or compute topological orders via post-order finishing times.
- **Use Union-Find (DSU)**: When edges arrive **dynamically as a stream**, when checking whether an undirected edge forms a cycle in $O(1)$ time (Kruskal's MST, Redundant Connection), or when merging equivalence sets dynamically (Accounts Merge).

---

### 4. What single piece of advice differentiates a Senior engineer from a Junior engineer in a live coding interview?
**Question:** What behavior during a technical interview most reliably demonstrates senior-level engineering maturity?

**Answer:**
**Systematic Verification Before Execution**:
- A junior engineer rushes to write code, clicks "Run", and uses error outputs to guess and patch bugs.
- A senior engineer spends the first 10 minutes clarifying constraints and validating the approach, writes modular code with clean invariant naming, and **manually dry-runs edge cases line-by-line** before ever clicking "Run".
- A senior engineer actively communicates tradeoffs, designs for failure modes, respects runtime constraints (event loop and memory budgets), and treats the interview as an architectural collaboration rather than a test.

---

<nav aria-label="Lecture navigation">
  <a href="day-59-live-interview-framework-and-unsticking.md">◀ Day 59: Live Interview Framework and Unsticking Strategies</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <span>Curriculum Completed! Ready for Technical Interviews! 🎉</span>
</nav>
