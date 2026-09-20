# Day 56: Mixed Pattern Strategy and Input Constraints

## 1. Learning Outcomes
- Master the **Input Constraint Heuristic**: deducing optimal algorithm time complexity directly from $N$.
- Map problem keywords and requirements to the **17 Core DSA Patterns**.
- Formulate a systematic decision matrix to evaluate competing algorithms in seconds.
- Recognize composite problems that combine two or more patterns (e.g., Trie + Backtracking, Heap + Two Pointers).
- Apply constraint-based complexity bounds to prevent event-loop-blocking CPU spikes in Node.js backends.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: All Weeks 1–11 (Days 01–55).
- **Navigation**:
  - [Previous: Day 55 - Union-Find: Graph Applications and MST](day-55-union-find-graph-applications.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 57 - High-Frequency Senior Interview Problems](day-57-high-frequency-senior-interview-problems.md)

---

## 3. Core Concepts & Mental Models
In coding interviews, the problem statement always provides input constraints (e.g., $1 \le N \le 10^5$). Because modern CPU execution environments permit $\approx 10^7 - 10^8$ basic operations per second, the constraint $N$ **strictly bounds** the acceptable asymptotic complexity:

```text
Constraint-to-Complexity Decoupling:
Input Size (N)       Expected Complexity        Candidate Patterns
-------------------------------------------------------------------------------------
N <= 10 - 16         O(2^N) or O(N!)            Backtracking, Subsets, Permutations
N <= 100             O(N^3) or O(N^4)           Floyd-Warshall, 3D/4D DP
N <= 1,000           O(N^2)                     2D Dynamic Programming, Nested Loops
N <= 100,000 (10^5)  O(N log N) or O(N)         Sorting, Heaps, Two Pointers, Window
N <= 1,000,000 (10^6)O(N)                       Hash Maps, Prefix Sum, Monotonic Stack
N >= 10^9 (Huge)     O(log N) or O(1)           Binary Search, Math, Bitwise Arithmetic
```

---

## 4. Detailed Technical Explanations

### 4.1 Keyword-to-Pattern Mapping Matrix
| Problem Clue / Requirement | Likely Pattern | Day Reference |
| :--- | :--- | :--- |
| **"Subarray with target sum"** | Prefix Sum + Hash Map | Day 15 |
| **"Contiguous subarray with min/max length"** | Sliding Window (Variable) | Day 14 |
| **"Sorted array, find pair / triple"** | Two Pointers (Opposing) | Day 11 |
| **"Next greater / smaller element"** | Monotonic Stack | Day 18 |
| **"Top / Most frequent / K-th element"** | Min/Max Heap of size $K$ | Day 43 |
| **"Shortest path in unweighted graph/grid"** | Breadth-First Search (BFS) | Day 37 |
| **"Explore all combinations / permutations"** | Backtracking | Day 22–24 |
| **"Prerequisites / dependency ordering"** | Topological Sort (Kahn's) | Day 40 |
| **"Optimize choices with non-overlapping intervals"** | Greedy (Sort by End Time) | Day 51 |
| **"Optimal partition / subset sum"** | Dynamic Programming (0/1 Knapsack) | Day 50 |
| **"Dynamic connected components / cycles"** | Union-Find (DSU) | Day 54 |
| **"Prefix search / word dictionary"** | Trie (Prefix Tree) | Day 53 |

### 4.2 Dissecting Composite Problems
Senior interview questions frequently combine two distinct patterns:
- **Trie + Backtracking**: Word Search II (Trie prunes exponential backtracking grid exploration).
- **Two Pointers + Min-Heap**: Trapping Rain Water II (Min-Heap tracks expanding water boundary perimeter).
- **Hash Map + Doubly Linked List**: LRU Cache (Map provides $O(1)$ lookup, Doubly Linked List provides $O(1)$ eviction).
- **Binary Search + Greedy**: Capacity to Ship Packages (Binary search over answer space, greedy feasibility test).

### 4.3 Node.js Relevance: SLA Constraints & CPU Budgets
In Node.js, the single-threaded event loop must remain unblocked. An HTTP request handler with a 50ms latency SLA can tolerate at most $10^6$ JS operations. If a service processes $N = 100,000$ records per request, an $O(N^2)$ algorithm runs $10^{10}$ operations, freezing the server for over 10 seconds and causing HTTP 504 Gateway Timeouts. Understanding constraints ensures algorithms fit Node's execution budget.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 Constraint-Driven Problem Solver: Subarray Sum Equals K (LeetCode 560)
Constraint: $N = 2 \times 10^4$.
- Naive brute-force: $O(N^2)$ requires $4 \times 10^8$ operations (fails/marginal).
- Prefix Sum + Hash Map: $O(N)$ requires $2 \times 10^4$ operations (passes instantly in $<15\text{ms}$).

```javascript
/**
 * O(n) Prefix Sum + Hash Map solution.
 * Time Complexity: O(n)
 * Space Complexity: O(n)
 */
function subarraySum(nums, k) {
  const prefixMap = new Map();
  prefixMap.set(0, 1); // Base case: prefix sum 0 occurs once

  let currentSum = 0;
  let count = 0;

  for (const num of nums) {
    currentSum += num;

    // If currentSum - k exists in map, add its frequency
    if (prefixMap.has(currentSum - k)) {
      count += prefixMap.get(currentSum - k);
    }

    // Record running prefix sum
    prefixMap.set(currentSum, (prefixMap.get(currentSum) || 0) + 1);
  }

  return count;
}
```

### 5.2 Execution Trace: Identifying Pattern for "Find Minimum in Rotated Sorted Array"
```text
Given: Rotated sorted array of distinct integers. Find minimum.
Constraint: N = 10^5. Desired runtime: O(log n).

Clue: "Sorted" + "Rotated" + "O(log n)".
Immediate Pattern: Binary Search (Day 27).
Check mid against right:
  If nums[mid] > nums[right]: Min must be in right half -> left = mid + 1
  Else: Min must be at mid or in left half -> right = mid
Boundary converges in log2(100,000) ≈ 17 comparisons!
```

---

## 6. Common Mistakes & Anti-Patterns
- **Ignoring Constraints in Problem Description**: Jumping straight to coding without checking $N$. Writing a complex $O(n \log n)$ divide-and-conquer for $N \le 10$ where a clean 5-line backtracking solution suffices, or writing $O(n^2)$ when $N = 10^5$.
- **Assuming "Subarray" Equals "Subsequence"**: Subarrays are strictly contiguous (Sliding Window, Prefix Sum). Subsequences are non-contiguous (DP, Backtracking).
- **Over-Engineering Simple Problems**: Applying Dynamic Programming to a problem where a single-pass Greedy choice or Two Pointers is provably optimal.

---

## 7. Tricky Points & Edge Cases
- **Negative Numbers Invalidate Sliding Window**: A variable sliding window expanding with sum $< K$ relies on values being non-negative. If negatives exist, window shrinkage becomes non-monotonic; you must use **Prefix Sum + Hash Map**.
- **$N \ge 10^{18}$ Constraint**: Indicates a pure mathematical closed-form formula, matrix exponentiation, or bit manipulation.
- **Space Constraints ($O(1)$ Auxiliary)**: When extra space is forbidden, look for in-place pointer swapping, cycle marking on array indices (`nums[abs(x)] = -nums[abs(x)]`), or rolling variables.

---

## 8. Practical Engineering Exercises
1. Analyze 5 random interview problem prompts and write down their target Big-O and candidate pattern in under 30 seconds each without writing code.
2. Given a problem where $N \le 20$, write an $O(2^N)$ backtracking template and explain why DP is unnecessary.

---

## 9. Key Takeaways & Summary
- Input size $N$ strictly bounds acceptable asymptotic complexity.
- Match problem keywords (contiguous, shortest path, non-overlapping) to specific patterns.
- Distinguish between contiguous subarrays (Window, Prefix Sum) and non-contiguous subsequences (DP, Backtracking).
- Senior problems often combine two patterns (e.g., Trie + DFS, Heap + Pointers).

---

## 10. Quick Reference Cheat Sheet
| Constraint | Target Complexity | Primary Pattern |
| :--- | :--- | :--- |
| $N \le 16$ | $O(2^N), O(N!)$ | Backtracking / Bitmask |
| $N \le 10^3$ | $O(N^2)$ | 2D Dynamic Programming |
| $N \le 10^5$ | $O(N \log N)$ | Heaps, Sorting, Binary Search on Answer |
| $N \le 10^6$ | $O(N)$ | Hash Map, Prefix Sum, Two Pointers, Monotonic Stack |
| $N \ge 10^9$ | $O(\log N)$ | Binary Search, Bitwise Arithmetic |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: How does the presence of negative numbers in an array change the pattern selection between Sliding Window and Prefix Sum for subarray sum problems?  
**Hint**: Does adding an element always increase the window sum?  
**Expected Answer Shape**: Variable Sliding Window requires monotonicity: adding an element must non-strictly increase the sum, and shrinking the left pointer must decrease the sum. When negative numbers are present, adding an element can decrease the sum and shrinking the window can increase it, destroying the greedy expansion/contraction invariant. Therefore, subarray sum problems with negative integers must use **Prefix Sum + Hash Map**, which handles arbitrary sum deltas in $O(n)$ time.

### 2. Code-Writing
**Question**: You are given constraints $N \le 10^5$ and need to find if there exists a pair with difference $K$ in an unsorted array. Choose the optimal pattern and implement it.  
**Hint**: $O(n)$ Hash Set complement lookup.  
**Expected Answer Shape**: Use a `Set` for $O(n)$ time and $O(n)$ space. Iterate through `nums`: for each `x`, check if `set.has(x - k)` or `set.has(x + k)`. If so, return true. Otherwise `set.add(x)`. Return false at the end. Runs in $O(n)$ time, well within the $10^5$ constraint.

### 3. Debugging
**Question**: An engineer writes this solution for a problem where $N = 10^5$:  
```javascript
function findTarget(nums, target) {
  return nums.some((x, i) => nums.slice(i + 1).includes(target - x));
}
```  
**Why will this fail the interview?**  
**Hint**: Calculate the total number of operations for $N = 100,000$.  
**Expected Answer Shape**: `nums.slice(i + 1)` creates an array copy of length up to $N$, and `.includes()` scans it linearly ($O(N)$). Inside `.some()`, this creates an $O(N^2)$ time complexity and allocates $O(N^2)$ temporary arrays. For $N = 10^5$, this executes $\approx 5 \times 10^9$ operations and gigabytes of GC allocations, instantly triggering Time Limit Exceeded and Out-Of-Memory. Use a `Set` or sort + Two Pointers for $O(N)$ or $O(N \log N)$ execution.

### 4. System Design / Tradeoff
**Question**: In an enterprise Node.js microservice handling 5,000 requests per second, how do algorithm constraints dictate whether to process data in-process or offload to a background worker?  
**Hint**: Event loop turn latency target $<10\text{ms}$.  
**Expected Answer Shape**: Any algorithm taking more than $\approx 10\text{ms}$ of continuous CPU time starves the Node.js event loop, delaying all other concurrent I/O events. If input data has $N \le 10^4$ and the algorithm is $O(N)$, it takes $<2\text{ms}$ and can run safely in the main request thread. If $N = 10^6$ or the algorithm is $O(N \log N)$ or $O(N^2)$, it will freeze the event loop for hundreds of milliseconds; it must be offloaded to a Node.js `Worker Thread` or an asynchronous job queue (BullMQ).

### 5. Tricky / Edge Case
**Question**: If a problem requires finding the maximum or minimum of a value, but the problem does not provide a formula—only a function `isValid(x)` that is monotonic—what pattern should you immediately consider?  
**Hint**: Binary Search on the solution space.  
**Expected Answer Shape**: **Binary Search on Solution Space** (Day 28). If the answer space is bounded between `[minVal, maxVal]` and the verification function `isValid(x)` is monotonic (e.g., if valid for $x$, it is also valid for all $x' > x$), you binary search over candidate values in $O(\log(\text{range}) \cdot \text{costOfValid})$.

### 6. Real-World Node.js Context
**Question**: When implementing search filtering on an in-memory array of 100,000 JSON user records in Node.js, what pattern choices prevent server lag?  
**Hint**: Avoid repeated full-array scans on every HTTP keystroke.  
**Expected Answer Shape**: Linear `.filter()` on 100,000 objects takes $O(N)$ per keystroke. Under 100 concurrent users, this saturates CPU. Instead, pre-index user records at server startup using a **Trie** (for prefix search on usernames) or an inverted **Hash Index** (Map of tokens to user IDs). Keystroke queries then resolve in $O(L)$ or $O(1)$ time, maintaining sub-millisecond API responses.
