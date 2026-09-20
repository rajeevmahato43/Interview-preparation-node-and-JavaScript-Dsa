# Day 50: 2D Dynamic Programming: Longest Common Subsequence and Knapsack

## 1. Learning Outcomes
- Master string alignment 2D DP in **Longest Common Subsequence (LCS)**.
- Formulate the fundamental **0/1 Knapsack Problem** decision model (include vs. exclude).
- Understand why 1D space optimization in 0/1 Knapsack requires **reverse (backward) loop iteration**.
- Solve **Partition Equal Subset Sum** by reducing it to a 0/1 Knapsack problem.
- Connect string diffing and knapsack resource optimization to git diff engines and rate-limiter cost packing in Node.js.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 03 (Strings & Text Patterns), Day 46 (Dynamic Programming Fundamentals), Day 49 (2D Grid DP).
- **Navigation**:
  - [Previous: Day 49 - 2D DP: Grid Paths and Minimum Path Sum](day-49-2d-dp-grid-paths-and-minimum-path-sum.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 51 - Greedy: Interval Scheduling and Overlaps](day-51-greedy-interval-scheduling.md)

---

## 3. Core Concepts & Mental Models
Two fundamental patterns define multi-variable Dynamic Programming:

### 1. Two-Sequence Pattern (LCS)
Comparing two strings $S_1$ and $S_2$:
```text
State: dp[i][j] = LCS of S1[0...i-1] and S2[0...j-1]
If S1[i-1] === S2[j-1]:
    dp[i][j] = 1 + dp[i-1][j-1]   (Match! Diagonal transition)
Else:
    dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]) (Take best of skipping from S1 or S2)
```

### 2. Bounded Resource Pattern (0/1 Knapsack)
Given $N$ items with weights and values, maximize value within capacity $W$. Each item can be picked **at most once**:
```text
For item i with weight w_i and value v_i:
dp[w] = Math.max(
  dp[w],              // Option 1: Skip item i
  dp[w - w_i] + v_i   // Option 2: Take item i
)
```

---

## 4. Detailed Technical Explanations

### 4.1 The Backward Loop Trick in 0/1 Knapsack
In 1D space optimization, if we iterate capacity forward ($w = w_i \dots W$):
`dp[w] = Math.max(dp[w], dp[w - w_i] + v_i)` uses `dp[w - w_i]`, which was *already updated in the current iteration*. This accidentally permits using item $i$ multiple times (Unbounded Knapsack / Coin Change).
**Rule**: In 0/1 Knapsack, iterate $w$ **backwards** from $W$ down to $w_i$:
```javascript
for (let w = capacity; w >= weight; w--) {
  dp[w] = Math.max(dp[w], dp[w - weight] + value);
}
```
Because $w - \text{weight} < w$, reading `dp[w - weight]` reads the value from the *previous item's row*, enforcing the 0/1 invariant!

### 4.2 Partition Equal Subset Sum Reduction
Can array `nums` be partitioned into two subsets with equal sum?
- If `totalSum` is odd, return `false` immediately.
- Target is `totalSum / 2`.
- The problem is identical to 0/1 Knapsack: can we select a subset of elements whose weights sum exactly to `target`?

### 4.3 Node.js Relevance: Git Diffs & Document Similarity Scoring
Text diff algorithms (like the Myers diff algorithm behind `git diff` or markdown editors in Node.js) are built on Longest Common Subsequence. LCS identifies lines unchanged between two file versions, producing minimal insertion/deletion patches.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 Longest Common Subsequence (LeetCode 1143)
```javascript
/**
 * Finds length of longest common subsequence between text1 and text2.
 * Time Complexity: O(m * n)
 * Space Complexity: O(n) optimized to single rolling row
 */
function longestCommonSubsequence(text1, text2) {
  const m = text1.length;
  const n = text2.length;
  let prev = new Uint16Array(n + 1);
  let curr = new Uint16Array(n + 1);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        curr[j] = 1 + prev[j - 1];
      } else {
        curr[j] = Math.max(prev[j], curr[j - 1]);
      }
    }
    // Swap rows for next iteration
    prev.set(curr);
  }

  return prev[n];
}
```

### 5.2 0/1 Knapsack (Space-Optimized O(W))
```javascript
/**
 * Solves 0/1 Knapsack in O(N * W) time and O(W) space.
 */
function knapsack01(weights, values, capacity) {
  const dp = new Uint32Array(capacity + 1);

  for (let i = 0; i < weights.length; i++) {
    const w = weights[i];
    const v = values[i];

    // CRITICAL: Loop backwards to prevent reusing item i
    for (let cap = capacity; cap >= w; cap--) {
      dp[cap] = Math.max(dp[cap], dp[cap - w] + v);
    }
  }

  return dp[capacity];
}
```

### 5.3 Partition Equal Subset Sum (LeetCode 416)
```javascript
/**
 * Determines if array can be partitioned into two equal sum subsets.
 * Time Complexity: O(n * target)
 * Space Complexity: O(target)
 */
function canPartition(nums) {
  const sum = nums.reduce((acc, val) => acc + val, 0);
  if (sum % 2 !== 0) return false; // Odd sum cannot be partitioned evenly

  const target = sum / 2;
  const dp = new Uint8Array(target + 1);
  dp[0] = 1; // Base case: sum 0 is always achievable with empty subset

  for (const num of nums) {
    // Loop backwards down to num
    for (let s = target; s >= num; s--) {
      if (dp[s - num] === 1) {
        dp[s] = 1;
      }
    }
    if (dp[target] === 1) return true; // Early exit
  }

  return dp[target] === 1;
}
```

### 5.4 Execution Trace: `canPartition([1, 5, 11, 5])`
```text
Total sum = 22. Target = 11. dp array of size 12 initialized to [1, 0, 0, ...].

num = 1:  dp[1] = dp[1-1] = 1.
num = 5:  dp[6] = dp[6-5] = 1; dp[5] = dp[5-5] = 1. Active: [0, 1, 5, 6]
num = 11: s = 11: dp[11 - 11] = dp[0] is 1 -> dp[11] = 1!
Target 11 achieved! Early return TRUE immediately!
```

---

## 6. Common Mistakes & Anti-Patterns
- **Forward Loop in 0/1 Knapsack**: Iterating `for (let cap = w; cap <= capacity; cap++)` turns 0/1 knapsack into unbounded knapsack, allowing an item to be selected multiple times.
- **Forgetting 1-Indexed Offset in LCS**: `text1[i - 1]` corresponds to `dp[i][j]` when using an $(M+1) \times (N+1)$ table. Failing to subtract 1 accesses wrong characters or undefined.
- **Floating Point Division in Partition**: Checking `sum / 2` without checking `sum % 2 !== 0` causes infinite or erroneous subproblems on odd sums.

---

## 7. Tricky Points & Edge Cases
- **Empty Strings in LCS**: Handled cleanly by base row and column filled with 0.
- **Reconstructing the LCS String**: To output the actual common characters rather than length, trace backwards from `dp[m][n]`: if characters match, prepend to result and move diagonally `(i-1, j-1)`; else move towards the larger neighbor `(i-1, j)` or `(i, j-1)`.
- **Target Exceeds Knapsack Capacity**: Handled naturally by boundary condition `cap >= w`.

---

## 8. Practical Engineering Exercises
1. Implement **Edit Distance** (LeetCode 72) using 2D DP with operations insert, delete, and replace.
2. Modify `longestCommonSubsequence` to return the actual reconstructed subsequence string.

---

## 9. Key Takeaways & Summary
- LCS compares two sequences using diagonal matches ($1 + dp[i-1][j-1]$) and horizontal/vertical skips ($\max(dp[i-1][j], dp[i][j-1])$).
- 0/1 Knapsack models non-renewable resource allocation.
- The reverse iteration loop (`cap = capacity down to w`) enforces the 0/1 constraint in 1D memory.
- Partition Equal Subset Sum is a direct reduction to 0/1 Knapsack with target $\text{sum}/2$.

---

## 10. Quick Reference Cheat Sheet
| Problem | Match Condition | No-Match Condition | Space |
| :--- | :--- | :--- | :--- |
| **LCS** | $1 + dp[i-1][j-1]$ | $\max(dp[i-1][j], dp[i][j-1])$ | $O(N)$ rolling |
| **0/1 Knapsack** | N/A (backward loop) | $\max(dp[w], dp[w - w_i] + v_i)$ | $O(W)$ |
| **Subset Sum** | N/A (backward loop) | $dp[s] = dp[s] \lor dp[s - num]$ | $O(T)$ |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: Explain why 0/1 Knapsack requires iterating the capacity loop in reverse when optimized to a 1D array, while Unbounded Knapsack (Coin Change) iterates forward.  
**Hint**: Examine which row's values are read during the update.  
**Expected Answer Shape**: In 1D space, `dp[w]` updates to `Math.max(dp[w], dp[w - weight] + value)`. If we iterate forward, `dp[w - weight]` was already updated using the current item, allowing the same item to be included multiple times (unbounded). By iterating backwards from `capacity` down to `weight`, `dp[w - weight]` still contains the result from the *previous item*, ensuring each item is considered at most once.

### 2. Code-Writing
**Question**: Write `minDistance(word1, word2)` (Edit Distance) that computes minimum operations (insert, delete, replace) to convert word1 to word2.  
**Hint**: 2D DP where matching costs 0 and mismatch is $1 + \min(\text{insert}, \text{delete}, \text{replace})$.  
**Expected Answer Shape**: Initialize `(m+1) x (n+1)` DP table. Base: `dp[i][0] = i`, `dp[0][j] = j`. If `word1[i-1] === word2[j-1]`, `dp[i][j] = dp[i-1][j-1]`. Else, `dp[i][j] = 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])` (representing delete, insert, replace). Return `dp[m][n]` in $O(M \cdot N)$ time.

### 3. Debugging
**Question**: Identify why this LCS code returns `0` for all inputs:  
```javascript
function lcs(s1, s2) {
  const m = s1.length, n = s2.length;
  let dp = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i] === s2[j]) dp[j] = 1 + dp[j - 1];
      else dp[j] = Math.max(dp[j], dp[j - 1]);
    }
  }
  return dp[n];
}
```  
**Hint**: Look at string index bounds and the overwrite of `dp[j-1]` in the same row.  
**Expected Answer Shape**: 1) `s1[i]` and `s2[j]` are out of bounds at $i=m, j=n$; it must be `s1[i - 1]` and `s2[j - 1]`. 2) In 1D space, updating `dp[j]` directly overwrites the top-left diagonal neighbor (`dp[i-1][j-1]`), corrupting subsequent diagonal lookups in the same row. A temporary variable (`let prevDiagonal`) or two explicit rows (`prev` and `curr`) must be maintained.

### 4. System Design / Tradeoff
**Question**: In building a document similarity service in Node.js (e.g., plagiarism detector or JSON difference viewer), how do you prevent LCS from freezing the process on 10,000-line files?  
**Hint**: $10,000 \times 10,000 = 10^8$ operations.  
**Expected Answer Shape**: Calculating LCS on two 10,000-line files requires $10^8$ operations, consuming hundreds of megabytes and causing multi-second event loop freezes. In production Node.js systems, pre-filter with hash-based chunking (e.g., hashing each line to 64-bit integers), strip common identical prefixes and suffixes before DP, and use the Myers Diff algorithm with divide-and-conquer linear space ($O((M+N)D)$ time, where $D$ is edit count).

### 5. Tricky / Edge Case
**Question**: Can the Partition Equal Subset Sum problem be solved if numbers in the array include negative integers?  
**Hint**: Can capacity or array indices be negative?  
**Expected Answer Shape**: Standard Knapsack DP relies on non-negative weights to index into the DP array. If negative integers are permitted, `sum / 2` could be negative, and transitions can cycle. To handle negative values, either offset all values by the absolute minimum sum, or use recursive DFS with memoization on `(index, currentSum)` using a Map instead of flat arrays.

### 6. Real-World Node.js Context
**Question**: How does a Node.js microservice bundle packer (like Webpack's splitChunks or a container packing tool) map to the 0/1 Knapsack problem?  
**Hint**: Maximizing module utility within a maximum chunk byte size limit.  
**Expected Answer Shape**: When creating optimal vendor chunks within strict size budgets (e.g., 250KB max chunk size for fast mobile download), each module has a byte size (weight) and a request frequency / criticality score (value). Knapsack DP selects the combination of modules that maximizes cache hit value without exceeding the maximum byte threshold.
