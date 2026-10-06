# Day 46: Dynamic Programming: Memoization and Tabulation

<nav aria-label="Lecture navigation">
  <a href="day-45-merge-k-sorted-lists-and-task-scheduling.md">◀ Day 45: Merge 'K' Sorted Lists and Task Scheduling</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-47-1d-dp-house-robber-and-coin-change.md">Day 47: 1D DP: House Robber and Coin Change ▶</a>
</nav>

---

## Learning Outcomes

- Master the two mathematical prerequisites for **Dynamic Programming (DP)**: **Optimal Substructure** and **Overlapping Subproblems**.
- Compare the two canonical implementation paradigms: **Top-Down (Recursion + Memoization)** vs. **Bottom-Up (Iterative Tabulation)**.
- Apply the **3-Step DP Formulation Framework**: State Definition, Recurrence Relation, and Base Cases.
- Optimize auxiliary memory consumption from $O(n)$ full array storage down to $O(1)$ scalar state variables.
- Connect memoization patterns to in-memory caching (LRU, Redis) and idempotent query optimization in Node.js backend services.
- Prevent V8 stack overflow exceptions caused by deep recursive memoization on large input constraints.

---

## Prerequisites

- [Day 04: Recursion and the Call Stack](day-04-recursion-and-the-call-stack.md) — Activation frames, base cases, and recursion trees.
- [Day 21: Recursion Mechanics and Call Stack](day-21-recursion-mechanics-and-call-stack.md) — Call stack limits, winding/unwinding phases, and trampolining.
- [Day 45: Merge 'K' Sorted Lists and Task Scheduling](day-45-merge-k-sorted-lists-and-task-scheduling.md) — Divide-and-conquer subproblem decomposition.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
| :--- | :--- | :--- |
| **Optimal Substructure** | The property where an optimal solution to a problem can be constructed directly from optimal solutions of its subproblems. | Without this, DP cannot guarantee mathematical optimality (Greedy or exhaustive search required). |
| **Overlapping Subproblems** | A problem decomposition where the exact same sub-calculations repeat multiple times across different recursive branches. | The sole reason to cache or tabulate; transforms exponential $O(2^n)$ work into polynomial $O(n)$. |
| **Top-Down (Memoization)** | Starting at the target state and recursively breaking it down, saving computed subproblem outputs in a hash table or array. | Intuitive to write from recursive thinking; only explores states strictly needed for the answer. |
| **Bottom-Up (Tabulation)** | Starting at the smallest base cases and iteratively filling an array in topological dependency order until reaching the target. | Eliminates V8 call stack overhead; enables straightforward space reduction to $O(1)$ rolling variables. |
| **State Definition** | The precise semantic meaning of `dp[i]` or `dp[i][j]` expressed in words before writing any code. | The foundation of all DP; getting the state definition wrong guarantees broken recurrence relations. |
| **Space Optimization** | Replacing full $N$-element DP arrays with 2 or 3 scalar variables when transitions only reference immediate predecessors. | Reduces memory footprint from $O(N)$ to $O(1)$, preventing GC memory pressure in Node.js. |

---

## Core Concepts & Mechanical Architecture

### 1. The Anatomy of Dynamic Programming

**Dynamic Programming (DP)** is an algorithmic optimization technique that solves complex problems by breaking them down into simpler, overlapping subproblems, computing each subproblem's solution exactly once, and storing the results to eliminate redundant calculations.

```text
The Two Pillars of Dynamic Programming:
1. Optimal Substructure:
   ShortestPath(A -> C) = ShortestPath(A -> B) + ShortestPath(B -> C)

2. Overlapping Subproblems (e.g., Naive Fibonacci Tree):
                          fib(5)
                       /          \
                  fib(4)          fib(3)  <--- Duplicate calculation!
                 /      \        /      \
             fib(3)   fib(2)   fib(2)   fib(1)
            /      \
        fib(2)   fib(1)
        Duplicate branches evaluate the same states repeatedly!
        Work grows exponentially: O(2^n) = 2^5 = 32 operations.
```

With memoization or tabulation, once `fib(3)` is computed, its result is cached. Any subsequent visit returns the cached value in $O(1)$ time, flattening the call tree into a linear chain of $O(n)$ operations.

---

### 2. Top-Down (Memoization) vs. Bottom-Up (Tabulation)

| Feature | Top-Down (Memoization) | Bottom-Up (Tabulation) |
| :--- | :--- | :--- |
| **Direction** | Target $N \rightarrow$ Base Cases ($0, 1$) | Base Cases ($0, 1$) $\rightarrow$ Target $N$ |
| **Control Flow** | Recursive function calls | Iterative `for` loops |
| **Data Structure** | Hash Map or Array cache | Contiguous DP Table or scalar variables |
| **State Exploration** | Lazy (only evaluates reachable states) | Eager (evaluates all table entries in order) |
| **Memory Risk** | `RangeError: Maximum call stack size exceeded` | Zero call-stack risk (bounded heap allocation) |
| **Space Optimization** | Hard (must retain cache entries for recursion) | Easy (can discard older rows/variables) |

```javascript
// Node.js code: Top-Down vs. Bottom-Up Demonstration

// ❌ 1. Exponential Naive Recursion: O(2^n) time
function fibNaive(n) {
  if (n <= 1) return n;
  return fibNaive(n - 1) + fibNaive(n - 2);
}

// ✅ 2. Top-Down Memoization: O(n) time, O(n) space
function fibMemo(n, memo = new Map()) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);

  const res = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  memo.set(n, res);
  return res;
}

// ✅ 3. Bottom-Up Tabulation: O(n) time, O(n) space
function fibTable(n) {
  if (n <= 1) return n;
  const dp = new Array(n + 1);
  dp[0] = 0;
  dp[1] = 1;
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}

// ✅ 4. Space-Optimized Bottom-Up: O(n) time, O(1) space
function fibOptimized(n) {
  if (n <= 1) return n;
  let prev2 = 0;
  let prev1 = 1;

  for (let i = 2; i <= n; i++) {
    const curr = prev1 + prev2;
    prev2 = prev1;
    prev1 = curr;
  }

  return prev1;
}

console.log('Fib(10) optimized:', fibOptimized(10)); // 55
```

---

### 3. The 3-Step DP Formulation Framework

Every dynamic programming problem can be systematically decomposed using three rigorous steps:

1. **Step 1: State Definition**:
   Define precisely what the function or array index represents in English.
   *Example (Climbing Stairs, LeetCode 70)*: `dp[i]` = the total number of distinct ways to reach step $i$.
2. **Step 2: Recurrence Relation**:
   Formulate how state `dp[i]` is derived from smaller subproblems.
   To land on step $i$, one could either take a 1-step leap from $i - 1$ or a 2-step leap from $i - 2$:
   $$dp[i] = dp[i - 1] + dp[i - 2]$$
3. **Step 3: Base Cases**:
   Identify the smallest known instances that stop recursion or initialize the table:
   $$dp[0] = 1 \quad (\text{1 way to stand at ground}), \quad dp[1] = 1 \quad (\text{1 way: single 1-step})$$

```javascript
// Node.js code: Climbing Stairs with O(1) Space
/**
 * @param {number} n
 * @returns {number}
 */
function climbStairs(n) {
  if (n <= 1) return 1;

  let prev2 = 1; // dp[0]
  let prev1 = 1; // dp[1]

  for (let i = 2; i <= n; i++) {
    const curr = prev1 + prev2;
    prev2 = prev1;
    prev1 = curr;
  }

  return prev1;
}

console.log('Ways to climb 5 stairs:', climbStairs(5)); // 8
```

---

### 4. Step-by-Step Execution Trace: Climbing Stairs Tabulation

```text
Input: n = 5
Objective: Calculate total distinct ways to climb 5 stairs with step sizes 1 or 2.

State Array Allocation: dp of size 6 (indices 0 to 5)
Base Cases:
  dp[0] = 1  (Ground level: 1 distinct way - stay put)
  dp[1] = 1  (Step 1: 1 way - [1])

Tabulation Loop Evolution:
Step i = 2: dp[2] = dp[1] + dp[0] = 1 + 1 = 2
            Ways: [1, 1], [2]
Step i = 3: dp[3] = dp[2] + dp[1] = 2 + 1 = 3
            Ways: [1, 1, 1], [1, 2], [2, 1]
Step i = 4: dp[4] = dp[3] + dp[2] = 3 + 2 = 5
            Ways: [1, 1, 1, 1], [1, 1, 2], [1, 2, 1], [2, 1, 1], [2, 2]
Step i = 5: dp[5] = dp[4] + dp[3] = 5 + 3 = 8
            Ways: 8 distinct combinations!

Memory State Evolution:
Index:   0    1    2    3    4    5
dp:    [ 1,   1,   2,   3,   5,   8 ]
Time Complexity: Exactly 4 additions = O(n)
Space Complexity: 2 integer registers in scalar mode = O(1)
```

---

### 5. Production Pattern: Bounded LRU Memoizer in Node.js

To prevent memory leaks when applying top-down memoization across arbitrary inputs in long-lived Node.js microservices, wrap functions with a capacity-capped LRU (Least Recently Used) cache:

```javascript
// Node.js code: Production-Grade Bounded Memoizer
/**
 * Wraps a computationally expensive function with a capacity-bounded LRU cache.
 * @param {Function} fn
 * @param {number} [maxCapacity=1000]
 * @returns {Function}
 */
function createBoundedMemoizer(fn, maxCapacity = 1000) {
  const cache = new Map();

  return function (...args) {
    const key = args.length === 1 ? args[0] : JSON.stringify(args);

    if (cache.has(key)) {
      const val = cache.get(key);
      // Refresh recency in Map (delete and re-insert puts key at end of iteration order)
      cache.delete(key);
      cache.set(key, val);
      return val;
    }

    const computed = fn(...args);

    // Evict oldest item if capacity exceeded
    if (cache.size >= maxCapacity) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }

    cache.set(key, computed);
    return computed;
  };
}

// Verification
let calls = 0;
const expensiveSquare = createBoundedMemoizer((x) => {
  calls++;
  return x * x;
}, 3);

expensiveSquare(10); // calls = 1
expensiveSquare(10); // calls = 1 (Cache hit!)
expensiveSquare(20);
expensiveSquare(30);
expensiveSquare(40); // Evicts 10 because capacity = 3
expensiveSquare(10); // calls = 2 (Recomputed)
console.log('Total executions with LRU bounds:', calls); // 4
```


---

## Detailed Node.js Relevance

### In-Memory Caching, Idempotency, and the V8 Event Loop

In high-throughput Node.js web applications, the principles of Top-Down Memoization and Bottom-Up Tabulation apply directly to system design:

```text
Node.js API Memoization Architecture:
[Incoming HTTP Request] ---> [LRU Memoization Cache] ---> [Expensive DB / CPU Calculation]
                                  |                             |
                                  |-- Cache Hit: Return in 0.1ms |
                                  '-- Cache Miss: Compute & Cache --'
```

1. **Event Loop Non-Blocking**: Heavy repetitive calculations (such as parsing complex configuration DAGs, computing permission matrices, or statistical analytics) block the single-threaded Node.js event loop. Memoizing these functions reduces CPU execution time from milliseconds to microseconds, preventing request starvation.
2. **V8 Call Stack Safety**: Top-down recursive memoization in Node.js fails for $N > 10,000$ due to the V8 call stack size limit (`RangeError: Maximum call stack size exceeded`). Production services requiring deep state evaluation must use **bottom-up tabulation** or explicit array-based stack loops.
3. **Cache Eviction and Memory Leaks**: An unbounded memoization cache (`new Map()`) will retain object references indefinitely, leading to memory leaks in long-running Node.js processes. Production memoization must always be bounded with an LRU (Least Recently Used) eviction policy or Redis TTL.

---

## Tricky Points & Edge Cases

1. **Unbounded Map Memory Leaks**:
   ```javascript
   // ❌ MEMORY LEAK: Map grows indefinitely with each unique request argument
   const globalCache = new Map();
   function computeSomething(userId, payload) {
     const key = `${userId}:${JSON.stringify(payload)}`;
     if (globalCache.has(key)) return globalCache.get(key);
     // ...
   }
   // ✅ FIX: Use LRU Cache with maximum entry capacity
   ```
2. **The 32-Bit Integer Overflow in Large DP Arrays**:
   In problems like Climbing Stairs or Fibonacci, values exceed JavaScript's `Number.MAX_SAFE_INTEGER` ($2^{53} - 1$) around $N \ge 80$. Use `BigInt` when computing large combinatorial DP counts to prevent silent precision corruption.
3. **Off-By-One Allocation Errors**:
   When declaring a table of size $N$ for states $0 \dots N$, allocating `new Array(n)` causes an `undefined` access at index $N$. Always allocate `new Array(n + 1)`.
4. **Base Case Granularity**:
   Ensure base cases are mathematically grounded. In coin change or paths, setting `dp[0] = 0` versus `dp[0] = 1` changes the entire meaning from "minimum count" to "total ways".

---

## Hands-On Exercise

### Scenario
You are developing a high-performance billing calculator for a Node.js SaaS platform. A subscription fee increments over monthly renewal cycles based on an exponential tier calculation:
$$f(n) = 2 \cdot f(n - 1) + 3 \cdot f(n - 2)$$
With base cases $f(0) = 1$ and $f(1) = 2$.
Implement `calculateTierFee(n)`:
1. Compute the fee for arbitrary month $n$.
2. Must run in $O(n)$ time and $O(1)$ auxiliary space.
3. Handle large $n$ up to $100$ using `BigInt` without overflow or precision loss.
4. Reject negative inputs by throwing a `RangeError`.

### Buggy Code
```javascript
function calculateTierFee(n) {
  // BUG: Naive recursion causes O(2^n) exponential freeze on n = 50
  // BUG: Uses regular numbers; overflows MAX_SAFE_INTEGER
  // BUG: Missing negative input validation
  if (n === 0) return 1;
  if (n === 1) return 2;
  return 2 * calculateTierFee(n - 1) + 3 * calculateTierFee(n - 2);
}
```

### Acceptance Criteria
- Validate $n \ge 0$, throwing `RangeError` on negative inputs.
- Compute outputs using `BigInt` arithmetic.
- Maintain strict $O(1)$ auxiliary space using iterative state variables.
- Execute calculations for $n = 100$ in $< 1\text{ms}$.

### Solution Code
```javascript
const assert = require('assert');

// Node.js code: Production Space-Optimized BigInt DP Calculator
/**
 * Computes f(n) = 2*f(n-1) + 3*f(n-2) using O(1) space BigInt tabulation.
 * Time Complexity: O(n)
 * Space Complexity: O(1)
 * @param {number} n
 * @returns {bigint}
 */
function calculateTierFee(n) {
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) {
    throw new RangeError('Input must be a non-negative integer');
  }

  if (n === 0) return 1n;
  if (n === 1) return 2n;

  let prev2 = 1n; // f(0)
  let prev1 = 2n; // f(1)

  for (let i = 2; i <= n; i++) {
    const curr = 2n * prev1 + 3n * prev2;
    prev2 = prev1;
    prev1 = curr;
  }

  return prev1;
}

// Verification & Automated Unit Tests
// Base cases
assert.strictEqual(calculateTierFee(0), 1n);
assert.strictEqual(calculateTierFee(1), 2n);

// n = 2: 2 * 2 + 3 * 1 = 7
assert.strictEqual(calculateTierFee(2), 7n);

// n = 3: 2 * 7 + 3 * 2 = 20
assert.strictEqual(calculateTierFee(3), 20n);

// n = 4: 2 * 20 + 3 * 7 = 61
assert.strictEqual(calculateTierFee(4), 61n);

// n = 50 executes instantly without call stack issues
const fee50 = calculateTierFee(50);
assert.strictEqual(typeof fee50, 'bigint');
assert.strictEqual(fee50 > 1000000000n, true);

// Error validation
assert.throws(() => calculateTierFee(-5), RangeError);
assert.throws(() => calculateTierFee(2.5), RangeError);

console.log('✅ All calculateTierFee BigInt DP assertions passed successfully!');
```

### Solution Explanation
1. **Input Validation**: Guarding `typeof n !== 'number' || n < 0` prevents infinite loops and undefined states.
2. **`BigInt` Literal Operations**: Using `1n`, `2n`, and `3n` ensures arbitrary-precision integer arithmetic, completely eliminating floating-point rounding errors for large $n$.
3. **Space Optimization**: Storing only `prev1` and `prev2` avoids allocating an array of 100 elements, operating in strict $O(1)$ auxiliary space.

---

## Summary

- **Dynamic Programming** solves problems by combining solutions to overlapping subproblems where optimal substructure exists.
- **Top-Down Memoization** writes intuitive recursion paired with a cache; **Bottom-Up Tabulation** computes states iteratively starting from base cases.
- In Node.js, Bottom-Up is preferred for deep recursions ($N > 10,000$) to avoid V8 call stack size limit crashes.
- State optimization reduces $O(N)$ arrays to $O(1)$ scalar variables when a state depends only on a fixed number of immediate predecessors.
- Large numerical combinations should use `BigInt` to prevent silent IEEE-754 precision truncation.

---

## Cheat Sheet & Common Pitfalls

| Concept | Top-Down (Memo) | Bottom-Up (Tabulation) | Space-Optimized |
| :--- | :--- | :--- | :--- |
| **Call Stack Usage** | $O(n)$ frames (risk of overflow) | $O(1)$ frames (safe) | $O(1)$ frames (safe) |
| **Heap Memory** | $O(n)$ cache entries | $O(n)$ array entries | $O(1)$ scalar variables |
| **Unvisited States** | Skipped automatically | Must be initialized | N/A |
| **Large Numbers** | Risk of float overflow | Use `BigInt` literals | Use `BigInt` literals |

---

## Interview Questions

### 1. What are the two essential characteristics of a problem that indicate Dynamic Programming is applicable?
**Question:** Define Optimal Substructure and Overlapping Subproblems, and explain why both must be present for Dynamic Programming to be effective.

**Answer:**
1. **Optimal Substructure**: An optimal solution to the overall problem can be constructed directly from optimal solutions of its subproblems. If solving subproblems independently does not yield the global optimum (e.g., Longest Simple Path in a general graph), DP fails.
2. **Overlapping Subproblems**: The recursive decomposition of the problem generates the same subproblems repeatedly.
   - If subproblems are independent and never overlap (such as Merge Sort or QuickSort), **Divide and Conquer** is appropriate, and caching provides zero performance gain.
   - If subproblems overlap, caching results via memoization or tabulation reduces exponential time complexity ($O(2^n)$) to polynomial time ($O(n)$).

---

### 2. When would you prefer Top-Down Memoization over Bottom-Up Tabulation in a real-world project?
**Question:** Under what circumstances is Top-Down Memoization architecturally superior to Bottom-Up Tabulation?

**Answer:**
Top-Down Memoization is superior when:
1. **Sparse State Spaces**: In multi-dimensional problems (e.g., game trees or string alignment with large state grids), only a small fraction of the total possible states $(i, j)$ are ever visited on valid execution paths. Tabulation evaluates every single cell in the matrix ($O(M \times N)$ work), whereas memoization evaluates only reachable states, often doing orders of magnitude less work.
2. **Complex State Dependencies**: When transitions do not follow a simple linear index progression (e.g., trees or DAG traversals), determining the correct topological dependency order for bottom-up loops is difficult, whereas top-down recursion navigates dependencies naturally.

---

### 3. Why does recursive memoization crash with `RangeError` in Node.js, and how do you prevent it?
**Question:** Explain why running top-down memoization on $N = 20,000$ in Node.js throws a runtime error, and describe how to make it stack-safe.

**Answer:**
1. **The V8 Stack Limit**: The V8 engine has a fixed call stack size (typically ~10,000 activation frames). Each unreturned recursive call allocates a stack frame storing arguments, local variables, and return addresses. When recursion depth exceeds this limit, V8 throws `RangeError: Maximum call stack size exceeded`.
2. **Prevention Strategies**:
   - **Convert to Bottom-Up Tabulation**: Replace recursion with an iterative `for` loop, eliminating stack frames entirely.
   - **Trampolining**: Wrap the recursive function in a trampoline loop that returns thunks (functions) instead of recursing directly.
   - **Explicit Stack**: Simulate the call stack using an array allocated on the V8 heap.

---

### 4. How do you recognize when a 1D DP table can be optimized to $O(1)$ space?
**Question:** What structural property of a DP recurrence relation allows an engineer to reduce auxiliary space from $O(n)$ to $O(1)$?

**Answer:**
A DP table can be optimized to $O(1)$ space whenever the recurrence relation for state $dp[i]$ depends **only on a fixed, constant number of preceding states** ($k$ states) that do not scale with $i$.
- For example, if $dp[i] = f(dp[i - 1], dp[i - 2])$, $dp[i]$ only requires the 2 immediate previous values. All earlier values ($dp[i - 3], \dots, dp[0]$) are never referenced again and can be discarded. We replace the $N$-element array with 2 scalar variables (`prev1`, `prev2`).
- If $dp[i]$ requires scanning **all** previous states (e.g., Longest Increasing Subsequence where $dp[i] = 1 + \max_{j < i} dp[j]$), earlier states cannot be discarded, making $O(1)$ scalar optimization impossible without alternate algorithmic models (like Patience Sorting).

---

<nav aria-label="Lecture navigation">
  <a href="day-45-merge-k-sorted-lists-and-task-scheduling.md">◀ Day 45: Merge 'K' Sorted Lists and Task Scheduling</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-47-1d-dp-house-robber-and-coin-change.md">Day 47: 1D DP: House Robber and Coin Change ▶</a>
</nav>
