# Day 60: Comprehensive DSA Master Cheat Sheet and Revision Map

## 1. Learning Outcomes
- Master the **Big-O Master Reference Matrix** covering all data structures and sorting algorithms.
- Review the **17 Core Algorithmic Patterns** with triggers, templates, and complexity guarantees.
- Consolidate 12 weeks of mid-to-senior technical preparation into a rapid pre-interview revision guide.
- Retain the bridge between theoretical algorithmic complexity and production Node.js V8 execution.
- Finalize the full 60-day curriculum with senior engineering confidence.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 01 through Day 59 (Complete 12-Week Curriculum).
- **Navigation**:
  - [Previous: Day 59 - Live Interview Framework and Unsticking Strategies](day-59-live-interview-framework-and-unsticking.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - **Next: Curriculum Completed! Ready for Technical Interviews!**

---

## 3. Core Concepts & Big-O Master Reference Matrix

### 3.1 Data Structures Complexity Matrix
| Data Structure | Access (Avg / Worst) | Search (Avg / Worst) | Insertion (Avg / Worst) | Deletion (Avg / Worst) | Auxiliary Space |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Array** | $O(1) / O(1)$ | $O(n) / O(n)$ | $O(n) / O(n)$ | $O(n) / O(n)$ | $O(n)$ contiguous |
| **Linked List (Singly)** | $O(n) / O(n)$ | $O(n) / O(n)$ | $O(1) / O(1)$ (head) | $O(1) / O(1)$ (head) | $O(n)$ pointers |
| **Linked List (Doubly)** | $O(n) / O(n)$ | $O(n) / O(n)$ | $O(1) / O(1)$ (head/tail)| $O(1) / O(1)$ (node ref) | $O(n)$ two pointers |
| **Stack / Queue** | $O(n) / O(n)$ | $O(n) / O(n)$ | $O(1) / O(1)$ | $O(1) / O(1)$ | $O(n)$ |
| **Hash Map / Set** | N/A | $O(1) / O(n)$ | $O(1) / O(n)$ | $O(1) / O(n)$ | $O(n)$ buckets |
| **Binary Search Tree** | $O(\log n) / O(n)$ | $O(\log n) / O(n)$ | $O(\log n) / O(n)$ | $O(\log n) / O(n)$ | $O(n)$ |
| **Balanced BST (AVL/RB)**| $O(\log n) / O(\log n)$ | $O(\log n) / O(\log n)$ | $O(\log n) / O(\log n)$ | $O(\log n) / O(\log n)$ | $O(n)$ |
| **Binary Heap (PQ)** | $O(1)$ (peek root) | $O(n) / O(n)$ | $O(\log n) / O(\log n)$ | $O(\log n) / O(\log n)$ | $O(n)$ flat array |
| **Trie (Prefix Tree)** | N/A | $O(L) / O(L)$ | $O(L) / O(L)$ | $O(L) / O(L)$ | $O(N \cdot L \cdot \Sigma)$ |
| **Graph (Adj List)** | N/A | $O(V + E)$ | $O(1)$ add edge | $O(E)$ remove edge | $O(V + E)$ |
| **Graph (Adj Matrix)** | N/A | $O(1)$ edge check | $O(1)$ add edge | $O(1)$ remove edge | $O(V^2)$ |
| **Union-Find (DSU)** | N/A | $O(\alpha(n))$ `find` | $O(\alpha(n))$ `union` | N/A | $O(n)$ flat array |

*Note: $L$ is word length; $\Sigma$ is alphabet size; $\alpha(n)$ is the Inverse Ackermann function ($\le 4$).*

---

### 3.2 Sorting Algorithms Matrix
| Algorithm | Best Time | Average Time | Worst Time | Space | Stable? | V8 Native Context |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **QuickSort** | $O(n \log n)$ | $O(n \log n)$ | $O(n^2)$ | $O(\log n)$ | No | Historical V8 sort |
| **MergeSort** | $O(n \log n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ | Yes | Basis of modern TimSort |
| **TimSort** | $O(n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ | Yes | **Current V8 `Array.prototype.sort()`** |
| **HeapSort** | $O(n \log n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(1)$ | No | In-place guaranteed $O(n \log n)$ |
| **BucketSort** | $O(n + k)$ | $O(n + k)$ | $O(n^2)$ | $O(n)$ | Yes | Bounded range frequencies |

---

## 4. Detailed Technical Explanations: The 17 Core Patterns Lookup Table

| Pattern # | Pattern Name | Key Trigger Clue | Typical Complexity | Target Benchmark Problem | Lecture Ref |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Frequency Counter** | Anagrams, duplicates, counts | $O(n)$ time, $O(n)$ space | Group Anagrams (LC 49) | Day 06, 08 |
| **2** | **Hash Complements** | Target pair sum, difference | $O(n)$ time, $O(n)$ space | Two Sum (LC 1) | Day 07 |
| **3** | **Two Pointers (Opposing)**| Sorted array, pairs, container | $O(n)$ time, $O(1)$ space | 3Sum (LC 15), Container Water (LC 11) | Day 11 |
| **4** | **Two Pointers (Fast/Slow)**| Cycles, linked list middle | $O(n)$ time, $O(1)$ space | Linked List Cycle II (LC 142) | Day 12, 30 |
| **5** | **Sliding Window (Fixed)** | Window of fixed length $k$ | $O(n)$ time, $O(1)$ space | Max Sum Subarray of Size K | Day 13 |
| **6** | **Sliding Window (Variable)**| Smallest/longest subarray $\le K$| $O(n)$ time, $O(1)$ space | Longest Substring No Repeats (LC 3) | Day 14 |
| **7** | **Prefix Sum** | Range sum queries, sum $= K$ | $O(n)$ time, $O(n)$ space | Subarray Sum Equals K (LC 560) | Day 15 |
| **8** | **Monotonic Stack** | Next greater/smaller element | $O(n)$ time, $O(n)$ space | Daily Temperatures (LC 739) | Day 18 |
| **9** | **Backtracking** | Subsets, permutations, paths | $O(2^n)$ or $O(n!)$ | Subsets (LC 78), N-Queens (LC 51) | Day 22–25 |
| **10** | **Binary Search (Bounds)** | Sorted array lookup, peak | $O(\log n)$ time, $O(1)$ | Search Rotated Array (LC 33) | Day 26, 27 |
| **11** | **Binary Search (Answer)** | Minimize max, capacity bounds | $O(n \log(\text{range}))$ | Koko Eating Bananas (LC 875) | Day 28 |
| **12** | **Level-Order BFS** | Shortest path, tree layers | $O(V + E)$ time, $O(w)$ space | Binary Tree Level Order (LC 102) | Day 32, 37 |
| **13** | **Tree/Graph DFS** | Components, islands, LCA | $O(V + E)$ time, $O(h)$ space | Number of Islands (LC 200), LCA (LC 236)| Day 31, 38 |
| **14** | **Topological Sort** | Prerequisites, task build order | $O(V + E)$ time, $O(V)$ space | Course Schedule II (LC 210) | Day 40 |
| **15** | **Top 'K' Heaps** | $K$ largest, stream median | $O(n \log K)$ time, $O(K)$ | Top K Frequent (LC 347), Median (LC 295)| Day 43, 44 |
| **16** | **Dynamic Programming** | Maximize value, partition, count| $O(n)$ or $O(n^2)$ | Coin Change (LC 322), LCS (LC 1143) | Day 46–50 |
| **17** | **Greedy & Disjoint Set** | Intervals, Kruskal MST, cycle | $O(n \log n)$ or $O(E \alpha(V))$ | Merge Intervals (LC 56), DSU (LC 684) | Day 51–55 |

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 The Universal Master Template: 60-Day Problem Attack Routine
Whenever presented with any algorithmic challenge:
```javascript
/**
 * 1. CLARIFY: Verify constraints, negative numbers, empty inputs, return types.
 * 2. CLASSIFY: Check constraint N against Big-O table -> select 1 of the 17 patterns.
 * 3. EXECUTE: Apply the 3-phase clean template:
 */
function solveInterviewProblem(input) {
  // Phase 1: Guard Clauses
  if (!input || input.length === 0) {
    return 0; // or null / [] depending on specification
  }

  // Phase 2: State Initialization
  // Initialize Pointers, Maps, Heaps, or DP arrays with typed structures

  // Phase 3: Primary Pattern Traversal
  // Single-pass Two Pointers, Window Expansion, or Bottom-up DP Table

  // Phase 4: Return State & Validate Edge Cases Mentally
}
```

---

## 6. Common Mistakes & Anti-Patterns
- **Forgetting that V8 Arrays Are Dynamic**: Treating standard arrays as fixed C-style buffers. Repeated `shift()` or `unshift()` induces $O(n)$ element shuffling. Use index pointers.
- **Neglecting Modulo Arithmetic**: Forgetting that counts can exceed $2^{53} - 1$ in combinatorics and DP problems. Always apply `(ans % 1_000_000_007)`.
- **Mixing Up Heap Min vs. Max Logic**: Using a Max-Heap when finding $K$ largest elements. Evicting the maximum keeps small elements! Finding $K$ largest requires a Min-Heap.

---

## 7. Tricky Points & Edge Cases
- **Negative Values**: Invalidate standard Sliding Window (use Prefix Sum) and Dijkstra's algorithm (use Bellman-Ford).
- **Touching Endpoints in Intervals**: Clarify whether `[1, 2]` and `[2, 3]` are considered overlapping.
- **Reference Mutation in Trees/Lists**: When testing palindrome or cycle detection, restore modified pointers before returning to prevent side effects.

---

## 8. Practical Engineering Exercises
1. Perform a mock interview with a peer using the 45-minute live framework from Day 59 on an unseen LeetCode Hard problem.
2. Review all 60 day titles in `DSA/dsa-lectures/` and explain the core invariant of each day in 1 sentence.

---

## 9. Key Takeaways & Summary
- Mastery of constraints ($N$) dictates whether a problem requires $O(1)$, $O(\log n)$, $O(n)$, $O(n \log n)$, or $O(2^n)$.
- All 17 patterns reduce to fundamental pointer, memory, or recurrence invariants.
- Node.js production engineering bridges theoretical DSA with event-loop latency, GC pressure, and stream chunking.
- Consistent communication, modular code, and systematic dry-runs separate Senior/Staff candidates from junior peers.

---

## 10. Quick Reference Cheat Sheet
| Concept | Formula / Quick Rule |
| :--- | :--- |
| **Parent Index (0-Indexed)** | `Math.floor((i - 1) / 2)` |
| **Left / Right Child** | `2 * i + 1` / `2 * i + 2` |
| **Middle Node (Fast/Slow)** | `slow = slow.next; fast = fast.next.next;` |
| **Prefix Sum Complement** | `prefixMap.has(currSum - target)` |
| **0/1 Knapsack Space Optimization** | Loop capacity **backwards**: `for (let w = W; w >= weight; w--)` |
| **Kahn's Topological Queue** | Enqueue whenever `inDegree[neighbor] === 0` |
| **Union-Find Invariant** | `parent[i] = find(parent[i])` (Path Compression) |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: How does V8 execute `Array.prototype.sort()` in modern Node.js, and what are its performance characteristics?  
**Hint**: TimSort algorithm.  
**Expected Answer Shape**: Modern V8 (since v7.0 / Node.js 12+) implements **TimSort**, a hybrid sorting algorithm derived from MergeSort and InsertionSort. It takes $O(n)$ time for already sorted or partially sorted arrays, and $O(n \log n)$ worst-case time with $O(n)$ space. Crucially, TimSort is **stable** (preserving the relative order of equal elements), unlike the QuickSort implementation historically used in older V8 releases.

### 2. Code-Writing
**Question**: Write an optimal function to find the single non-duplicate number in an array where every other element appears exactly twice.  
**Hint**: Bitwise XOR ($\oplus$).  
**Expected Answer Shape**: Use XOR. Since $x \oplus x = 0$ and $x \oplus 0 = x$, XORing all elements together cancels out all pairs, leaving only the unique number in $O(n)$ time and $O(1)$ space: `nums.reduce((acc, val) => acc ^ val, 0)`.

### 3. Debugging
**Question**: Identify why this Fibonacci implementation blows the V8 call stack for $N = 20,000$ even though it is memoized:  
```javascript
const memo = new Map();
function fib(n) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);
  const res = fib(n - 1) + fib(n - 2);
  memo.set(n, res);
  return res;
}
```  
**Hint**: Recursion depth vs. V8 call stack frame limits.  
**Expected Answer Shape**: Even though memoization ensures each subproblem is evaluated once, calculating `fib(20000)` executes `fib(19999) -> fib(19998) ...` down a call stack of depth 20,000. V8's call stack limit is $\approx 10,000$ frames, triggering `RangeError: Maximum call stack size exceeded`. Fix by using iterative bottom-up tabulation with two scalar variables ($O(n)$ time, $O(1)$ space) which has zero call-stack frames.

### 4. System Design / Tradeoff
**Question**: In designing an in-memory real-time analytics aggregation service in Node.js, how would you store 10,000,000 active counter keys without exhausting 4GB of RAM?  
**Hint**: Object overhead vs. flat TypedArray or compact key hashes.  
**Expected Answer Shape**: 10,000,000 JavaScript objects create massive hidden class and GC overhead exceeding 4GB. Instead: (1) Map keys to 32-bit integers using MurmurHash or a compact dictionary; (2) Store counts in a contiguous `Uint32Array(10000000)` (consuming exactly 40MB RAM); (3) Or offload to an external in-memory data store like Redis using raw Hashes or HyperLogLog for approximate counting.

### 5. Tricky / Edge Case
**Question**: If an interviewer asks you to sort an array of 100,000,000 integers that are all between 1 and 100, what algorithm do you choose?  
**Hint**: Do NOT use comparison sorts ($O(n \log n)$).  
**Expected Answer Shape**: Use **Counting Sort** (Bucket Sort). Allocate a single frequency array of size 101. Count occurrences of each number in one pass ($O(n)$ time, $O(1)$ auxiliary space). Then rewrite the array based on frequencies. This takes $O(n)$ time and 404 bytes of memory, outperforming QuickSort/TimSort by over $20\times$.

### 6. Real-World Node.js Context
**Question**: As a Senior Node.js Engineer, what are the 3 golden rules you enforce when reviewing algorithmic code intended for production microservices?  
**Hint**: Event loop, memory allocation, and streaming.  
**Expected Answer Shape**: 1) **Event Loop Safety**: No synchronous loop may exceed a 10ms CPU budget; heavy operations must be chunked with `setImmediate()` or offloaded to Worker Threads. 2) **Memory Locality & GC**: Minimize high-frequency object allocations inside tight loops; favor TypedArrays or reusable buffers to avoid triggering Mark-Sweep stop-the-world GC pauses. 3) **Streaming Over Buffering**: Never buffer unbounded payloads (files, queries, logs) into memory; always process data via Node.js streams with backpressure support.
