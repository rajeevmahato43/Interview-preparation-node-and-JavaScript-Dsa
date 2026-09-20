# Day 46: Dynamic Programming: Memoization and Tabulation

## 1. Learning Outcomes
- Master the two prerequisites for **Dynamic Programming (DP)**: **Optimal Substructure** and **Overlapping Subproblems**.
- Understand the dual implementation paradigms: **Top-Down (Recursion + Memoization)** vs. **Bottom-Up (Iterative Tabulation)**.
- Formulate DP solutions using the **3-Step Framework**: State Definition, Recurrence Relation, and Base Cases.
- Optimize memory from $O(n)$ table storage to $O(1)$ scalar state variables.
- Connect memoization and tabulation to in-memory caching and Redis query optimization in Node.js backends.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 04 (Recursion & Call Stack), Day 21 (Recursion Mechanics).
- **Navigation**:
  - [Previous: Day 45 - Merge 'K' Sorted Lists and Task Scheduling](day-45-merge-k-sorted-lists-and-task-scheduling.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 47 - 1D DP: House Robber and Coin Change](day-47-1d-dp-house-robber-and-coin-change.md)

---

## 3. Core Concepts & Mental Models
Dynamic Programming is simply **recursion without redundant recalculations**.
1. **Overlapping Subproblems**: The same smaller sub-calculations repeat multiple times across branches (e.g., $fib(3)$ calculated repeatedly in $fib(5)$).
2. **Optimal Substructure**: The optimal solution to a problem can be constructed directly from optimal solutions of its subproblems.

```text
Fibonacci Call Tree (Exponential O(2^n) without DP):
                      fib(5)
                   /          \
              fib(4)          fib(3)  <-- Duplicate branch!
             /      \        /      \
         fib(3)   fib(2)   fib(2)   fib(1)
        /      \
      fib(2)  fib(1)

With Memoization (Pruned to Linear O(n)):
fib(5) -> fib(4) -> fib(3) -> fib(2) -> fib(1)
  All sibling calls return cached values in O(1) time!
```

---

## 4. Detailed Technical Explanations

### 4.1 Top-Down vs. Bottom-Up Comparison
| Paradigm | Direction | Mechanism | Advantages | Disadvantages |
| :--- | :--- | :--- | :--- | :--- |
| **Top-Down (Memoization)** | Target $\rightarrow$ Base cases | Recursion + Cache (`Map` or Array) | Intuitive from recursive mental model; only computes states actually visited | V8 call-stack overhead; risk of stack overflow on large $n$ |
| **Bottom-Up (Tabulation)** | Base cases $\rightarrow$ Target | Iterative `for` loop + DP Array | Zero call-stack overhead; straightforward $O(1)$ space optimization | Must compute all states in topological dependency order |

### 4.2 The 3-Step DP Formulation Framework
1. **State Definition**: What does `dp[i]` represent? (e.g., `dp[i]` = number of distinct ways to climb $i$ steps).
2. **Recurrence Relation**: How does `dp[i]` depend on earlier states? (e.g., `dp[i] = dp[i - 1] + dp[i - 2]`).
3. **Base Cases**: What are the starting values? (e.g., `dp[0] = 1, dp[1] = 1`).

### 4.3 Node.js Relevance: In-Memory Caching & Function Memoization
In Node.js APIs, expensive asynchronous calculations (e.g., computing heavy statistical aggregations or database joins) mirror top-down memoization. Utilities like Lodash `memoize` or Redis-backed memoization wrappers intercept function invocations with identical parameters, returning cached results in $O(1)$ time to preserve single-threaded event loop throughput.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 Climbing Stairs (LeetCode 70) - 3 Implementations
```javascript
// 1. Top-Down: Recursion with Memoization (O(n) time, O(n) space)
function climbStairsMemo(n) {
  const memo = new Map();

  function dp(i) {
    if (i <= 2) return i;
    if (memo.has(i)) return memo.get(i);

    const result = dp(i - 1) + dp(i - 2);
    memo.set(i, result);
    return result;
  }

  return dp(n);
}

// 2. Bottom-Up: Tabulation (O(n) time, O(n) space)
function climbStairsTable(n) {
  if (n <= 2) return n;

  const dp = new Uint32Array(n + 1);
  dp[1] = 1;
  dp[2] = 2;

  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }

  return dp[n];
}

// 3. Bottom-Up: Space-Optimized O(1) (O(n) time, O(1) space)
function climbStairs(n) {
  if (n <= 2) return n;

  let prev2 = 1; // Represents dp[i - 2]
  let prev1 = 2; // Represents dp[i - 1]

  for (let i = 3; i <= n; i++) {
    const curr = prev1 + prev2;
    prev2 = prev1;
    prev1 = curr;
  }

  return prev1;
}
```

### 5.2 Execution Trace: Space-Optimized `climbStairs(5)`
```text
Base state: prev2 = 1 (step 1), prev1 = 2 (step 2)

i = 3: curr = 2 + 1 = 3.  prev2 = 2, prev1 = 3
i = 4: curr = 3 + 2 = 5.  prev2 = 3, prev1 = 5
i = 5: curr = 5 + 3 = 8.  prev2 = 5, prev1 = 8

Loop terminates. Return prev1 = 8.
Total memory used: 3 scalar numbers (O(1) auxiliary space)!
```

---

## 6. Common Mistakes & Anti-Patterns
- **Unbounded Recursion without Memoization**: Calculating Fibonacci for $N = 50$ without memoization requires $2^{50} \approx 1.12 \times 10^{15}$ operations, freezing the Node.js process permanently.
- **Incorrect DP Array Sizing**: Allocating `new Array(n)` instead of `new Array(n + 1)` when 1-indexed state `dp[n]` is required causes out-of-bounds `undefined` errors.
- **State Dependency Order Errors**: In bottom-up DP, calculating `dp[i]` before its dependencies `dp[i - 1]` or `dp[i - 2]` are computed results in `NaN` propagation.

---

## 7. Tricky Points & Edge Cases
- **Integer Precision Limits**: In JavaScript, values exceeding $2^{53} - 1$ (`Number.MAX_SAFE_INTEGER`) lose precision. For large DP states (e.g., $N > 78$ in Fibonacci), use `BigInt` (`1n, 2n`) or apply modulo arithmetic ($10^9 + 7$) as specified in interview questions.
- **Base Cases $N = 0, 1, 2$**: Always test boundary cases at the very beginning of functions to prevent off-by-one loop indexing.
- **Space Optimization Feasibility**: Space optimization from $O(n)$ to $O(1)$ is only possible when `dp[i]` depends on a fixed constant number of previous states (e.g., only the last 2 states).

---

## 8. Practical Engineering Exercises
1. Implement **Min Cost Climbing Stairs** (LeetCode 746) using $O(1)$ auxiliary space.
2. Given a generic function `fn(arg1, arg2)`, write a higher-order `memoize` decorator in JavaScript supporting arbitrary primitive arguments with cache eviction.

---

## 9. Key Takeaways & Summary
- Dynamic Programming optimizes overlapping recursive calculations by storing intermediate results.
- Top-Down uses recursion + memoization; Bottom-Up uses iteration + tabulation.
- Any DP table where `dp[i]` only depends on `dp[i - 1]` and `dp[i - 2]` can be optimized to $O(1)$ space using two rolling variables.
- Bottom-Up tabulation eliminates V8 call stack frames and protects against stack overflow.

---

## 10. Quick Reference Cheat Sheet
| Characteristic | Top-Down (Memo) | Bottom-Up (Table) | Bottom-Up (Optimized) |
| :--- | :--- | :--- | :--- |
| **Time** | $O(n)$ | $O(n)$ | $O(n)$ |
| **Space** | $O(n)$ heap + $O(n)$ stack | $O(n)$ heap | $O(1)$ scalars |
| **Direction** | Recursive (N to 0) | Iterative (0 to N) | Iterative (0 to N) |
| **Overflow Risk** | Yes (V8 call stack) | No | No |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: What is the difference between Divide-and-Conquer (e.g., Merge Sort) and Dynamic Programming (e.g., Fibonacci)?  
**Hint**: Examine whether the subproblems overlap.  
**Expected Answer Shape**: In Divide-and-Conquer, the subproblems are completely independent and non-overlapping (e.g., sorting the left half of an array has zero common work with sorting the right half). In Dynamic Programming, subproblems overlap heavily (e.g., $fib(3)$ is computed repeatedly by both $fib(4)$ and $fib(5)$). DP caches these shared subproblem solutions to prevent exponential redundant re-computation.

### 2. Code-Writing
**Question**: Write `minCostClimbingStairs(cost)` that finds the minimum cost to reach the top of a staircase with $O(1)$ space.  
**Hint**: Can step from index $i-1$ or $i-2$ paying cost.  
**Expected Answer Shape**: Maintain `prev2 = cost[0]` and `prev1 = cost[1]`. For $i$ from 2 to `cost.length - 1`: `curr = cost[i] + Math.min(prev1, prev2); prev2 = prev1; prev1 = curr;`. At the end, return `Math.min(prev1, prev2)` in $O(n)$ time and $O(1)$ space.

### 3. Debugging
**Question**: Identify why this memoized function fails when `n = 0`:  
```javascript
function solve(n, memo = {}) {
  if (memo[n]) return memo[n];
  if (n <= 1) return 1;
  return memo[n] = solve(n - 1, memo) + solve(n - 2, memo);
}
```  
**Hint**: How does JavaScript evaluate `if (memo[n])` when the cached value is `0`?  
**Expected Answer Shape**: In JavaScript, if `memo[n]` evaluates to `0` (or `false`), `if (memo[n])` treats it as falsy, triggering the calculation again and negating memoization! Always check key existence explicitly: `if (n in memo)` or `if (memo.has(n))`.

### 4. System Design / Tradeoff
**Question**: In a high-traffic Node.js API, when should you implement in-process memory memoization versus caching via Redis?  
**Hint**: Process restarts, clustering, and memory constraints.  
**Expected Answer Shape**: In-process memoization (JavaScript `Map` or LRU) provides microsecond retrieval with zero network serialization overhead, making it ideal for small, immutable lookup tables or hot calculations. However, it cannot be shared across clustered Node.js worker threads and consumes V8 heap memory. For large dynamic data shared across multiple service instances, Redis caching is required despite 1–3ms network round-trip overhead.

### 5. Tricky / Edge Case
**Question**: Can all Dynamic Programming problems be space-optimized from $O(n)$ to $O(1)$? Why or why not?  
**Hint**: Consider problems where `dp[i]` depends on all previous elements $0 \dots i-1$.  
**Expected Answer Shape**: No. Space optimization to $O(1)$ is only possible when each state depends on a fixed constant window of previous states (e.g., $k=1$ or $k=2$ states as in Fibonacci). In problems like Longest Increasing Subsequence (LIS) or Coin Change, `dp[i]` depends on all previous states $0 \le j < i$ or varying coin denominations, requiring the full $O(n)$ table to be preserved in memory.

### 6. Real-World Node.js Context
**Question**: How does a custom Node.js memoization wrapper prevent memory leaks when caching results of arbitrary incoming HTTP request queries?  
**Hint**: Unbounded Map growth and garbage collection.  
**Expected Answer Shape**: An unbounded JavaScript `Map` caching request queries will grow continuously, holding objects in memory and causing V8 heap exhaustion (OOM). A production memoization wrapper uses a Least Recently Used (LRU) cache (e.g., `lru-cache`) with a fixed maximum item limit (`max: 5000`) and TTL expiration, automatically evicting stale cache entries to keep memory bounded.
