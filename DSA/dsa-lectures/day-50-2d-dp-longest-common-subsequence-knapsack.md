# Day 50: 2D Dynamic Programming: Longest Common Subsequence and Knapsack

<nav aria-label="Lecture navigation">
  <a href="day-49-2d-dp-grid-paths-and-minimum-path-sum.md">◀ Day 49: 2D DP: Grid Paths and Minimum Path Sum</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-51-greedy-interval-scheduling.md">Day 51: Greedy: Interval Scheduling and Overlaps ▶</a>
</nav>

---

## Learning Outcomes

- Master the **Two-Sequence String Alignment Pattern** in **Longest Common Subsequence (LCS)** using a 2D matrix.
- Formulate the classical **0/1 Knapsack Problem** decision model (include vs. exclude) under capacity constraints.
- Mathematically prove why 1D space optimization in 0/1 Knapsack strictly requires **reverse (backward) loop iteration**.
- Reduce the **Partition Equal Subset Sum** problem to a 0/1 Knapsack decision model.
- Trace string alignment operations to understand diff engines (like `git diff`) and text reconciliation.
- Optimize high-throughput payload packing and rate-limiter cost allocations in Node.js backend microservices.

---

## Prerequisites

- [Day 03: String Manipulation and Two Pointers](day-03-string-manipulation-and-two-pointers.md) — Substrings vs. subsequences and string indexing.
- [Day 46: Dynamic Programming: Memoization and Tabulation](day-46-dynamic-programming-memo-and-tabulation.md) — Multi-variable DP state formulations.
- [Day 49: 2D DP: Grid Paths and Minimum Path Sum](day-49-2d-dp-grid-paths-and-minimum-path-sum.md) — 2D matrix navigation and rolling array space optimizations.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
| :--- | :--- | :--- |
| **Longest Common Subsequence (LCS)** | The longest sequence of characters appearing in both strings in the same relative order without needing to be contiguous. | Foundation for `git diff`, document comparison, DNA sequencing, and Levenshtein Edit Distance. |
| **0/1 Knapsack Problem** | Choosing a subset from $N$ items with given weights and values to maximize total value without exceeding capacity $W$; each item can be picked **at most once**. | Core combinatorial optimization archetype; directly models cloud resource budgeting. |
| **Backward Loop Iteration** | Iterating capacity $w$ backwards from $W$ down to $\text{weight}_i$ when using a 1D DP array. | Critical invariant: prevents an item from being reused multiple times within the same round. |
| **Subset Sum Partitioning** | Determining if an array can be partitioned into two subsets with equal sum $S / 2$. | NP-complete decision problem solved in pseudo-polynomial $O(N \cdot S)$ time via 0/1 Knapsack. |
| **Diagonal Transition** | The state transition $dp[i][j] = 1 + dp[i-1][j-1]$ occurring when characters at current indices match ($s_1[i-1] === s_2[j-1]$). | Signals that both strings can consume one matching character together. |

---

## Core Concepts & Mechanical Architecture

### 1. Longest Common Subsequence (LCS) Mechanics

In **Longest Common Subsequence** (LeetCode 1143), given strings `text1` and `text2`, we seek the length of their longest common subsequence.

```text
Strings: S1 = "abcde", S2 = "ace"
Common Subsequences: "a", "c", "e", "ac", "ae", "ce", "ace"
Longest Common Subsequence = "ace" (Length 3)
```

#### 1. State Definition:
Let `dp[i][j]` represent the LCS length of prefix $S_1[0 \dots i - 1]$ and prefix $S_2[0 \dots j - 1]$.
#### 2. Base Cases:
If either string prefix has length 0, the LCS is 0:
$$dp[0][j] = 0 \quad \text{and} \quad dp[i][0] = 0$$
#### 3. Recurrence Relation:
Compare the current characters $S_1[i - 1]$ and $S_2[j - 1]$:
- **Case 1: Characters Match** ($S_1[i - 1] === S_2[j - 1]$):
  We take the diagonal result and add 1:
  $$dp[i][j] = 1 + dp[i - 1][j - 1]$$
- **Case 2: Characters Differ** ($S_1[i - 1] \ne S_2[j - 1]$):
  We take the best result of either skipping the character from $S_1$ or from $S_2$:
  $$dp[i][j] = \max(dp[i - 1][j], dp[i][j - 1])$$

```javascript
// Node.js code: LCS Implementation with 2D Tabulation
/**
 * @param {string} text1
 * @param {string} text2
 * @returns {number}
 */
function longestCommonSubsequence(text1, text2) {
  const m = text1.length;
  const n = text2.length;

  // dp table of dimensions (m + 1) x (n + 1)
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = 1 + dp[i - 1][j - 1]; // Match: diagonal transition
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]); // Skip best
      }
    }
  }

  return dp[m][n];
}

console.log('LCS of "abcde" and "ace":', longestCommonSubsequence('abcde', 'ace')); // 3
```

---

### 2. The 0/1 Knapsack Problem and Backward Iteration

Given $N$ items where item $i$ has weight $w_i$ and value $v_i$, maximize total value within capacity limit $W$. Each item can be chosen **at most once** ($0$ times or $1$ time).

```text
Item Decision at Item i:
                    Item i (Weight w_i, Value v_i)
                       /                      \
          Option 1: EXCLUDE                   Option 2: INCLUDE
          /                                      \
    Keep current capacity w               Remaining capacity becomes w - w_i
    Value: dp[i - 1][w]                   Value: dp[i - 1][w - w_i] + v_i

Recurrence:
dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - w_i] + v_i)
```

#### Why 1D Optimization Requires Backward Iteration:
If we compress the 2D table into a 1D array `dp[w]` and loop **forward** ($w = w_i \dots W$):
$$dp[w] = \max(dp[w], dp[w - w_i] + v_i)$$
Because $w - w_i < w$, `dp[w - w_i]` was **already updated in the current item's loop**, meaning item $i$ could be picked again and again! That represents the **Unbounded Knapsack** (Coin Change), violating the 0/1 constraint.

By looping **backward** ($w = W$ down to $w_i$):
- When computing `dp[w]`, `dp[w - w_i]` has **not yet been touched** in the current loop.
- It still holds the value from the **previous item's row**, guaranteeing item $i$ is used at most once!

```javascript
// Node.js code: 0/1 Knapsack with O(W) 1D Backward Iteration
/**
 * @param {number[]} weights
 * @param {number[]} values
 * @param {number} capacity
 * @returns {number}
 */
function knapsack01(weights, values, capacity) {
  const n = weights.length;
  const dp = new Array(capacity + 1).fill(0);

  for (let i = 0; i < n; i++) {
    const w_i = weights[i];
    const v_i = values[i];

    // ✅ BACKWARD LOOP: From capacity down to item weight
    for (let w = capacity; w >= w_i; w--) {
      dp[w] = Math.max(dp[w], dp[w - w_i] + v_i);
    }
  }

  return dp[capacity];
}

console.log('Max value:', knapsack01([1, 3, 4, 5], [1, 4, 5, 7], 7)); // 9 (weights 3 + 4 = values 4 + 5 = 9)
```

---

### 3. Partition Equal Subset Sum (LeetCode 416)

Given a non-empty array `nums` containing only positive integers, determine if the array can be partitioned into two subsets such that the sum of elements in both subsets is equal.

#### Reduction to 0/1 Knapsack:
1. Compute `totalSum = sum(nums)`.
2. If `totalSum` is odd, it is mathematically impossible to divide into two equal integers $\implies$ return `false`.
3. Target sum for each subset is `target = totalSum / 2`.
4. The problem reduces to: **Can we find a subset of items that sums up to exactly `target`?**
5. State: `dp[s]` = boolean indicating whether a subset sum of $s$ is achievable.

```javascript
// Node.js code: Partition Equal Subset Sum
/**
 * @param {number[]} nums
 * @returns {boolean}
 */
function canPartition(nums) {
  let totalSum = 0;
  for (let i = 0; i < nums.length; i++) totalSum += nums[i];

  // If sum is odd, cannot be split evenly
  if (totalSum % 2 !== 0) return false;

  const target = totalSum / 2;
  const dp = new Uint8Array(target + 1);
  dp[0] = 1; // Base case: sum of 0 is always achievable

  for (let i = 0; i < nums.length; i++) {
    const num = nums[i];
    // Backward loop to preserve 0/1 property
    for (let s = target; s >= num; s--) {
      if (dp[s - num] === 1) {
        dp[s] = 1;
      }
    }
    if (dp[target] === 1) return true; // Early exit
  }

  return dp[target] === 1;
}

console.log('Can partition [1, 5, 11, 5]:', canPartition([1, 5, 11, 5])); // true (11 and 1+5+5)
console.log('Can partition [1, 2, 3, 5]:', canPartition([1, 2, 3, 5])); // false
```

---

## Detailed Node.js Relevance

### API Rate Limiting Cost Packing & Document Diff Engines

In Node.js enterprise microservices:

```text
Rate Limiter Cost Packing Pipeline:
[Burst Window: Max Cost 100]
Candidate Tasks: [{cost: 20, value: 50}, {cost: 45, value: 110}, ...]
Goal: Maximize API throughput value within fixed token window.
```

1. **Text Diff Engines**: In content management systems or automated code review tools built on Node.js, determining file changes (`git diff`) calculates the Longest Common Subsequence between the old and new text lines. Lines not in the LCS are flagged as additions (`+`) or deletions (`-`).
2. **Batch Request Packing**: In serverless functions or worker pools with strict execution memory limits (e.g., AWS Lambda 512MB RAM), background jobs have both a memory cost and an SLA priority value. Running 0/1 Knapsack schedules the highest total priority value of jobs that fit within the instance's memory ceiling.

---

## Tricky Points & Edge Cases

1. **Forward vs. Backward Loop Confusion**:
   - **Forward loop** ($w$ goes $w_i \to W$): Unbounded Knapsack (each item reusable infinite times).
   - **Backward loop** ($w$ goes $W \to w_i$): 0/1 Knapsack (each item reusable at most once).
2. **Reconstructing the LCS String**:
   Finding the **length** of the LCS requires only numbers. Reconstructing the **actual characters** requires walking backward from cell `(m, n)` along the path of equality decisions:
   ```javascript
   let i = m, j = n, result = [];
   while (i > 0 && j > 0) {
     if (text1[i - 1] === text2[j - 1]) {
       result.push(text1[i - 1]);
       i--; j--;
     } else if (dp[i - 1][j] >= dp[i][j - 1]) {
       i--;
     } else {
       j--;
     }
   }
   return result.reverse().join('');
   ```
3. **Target Exceeds Max Integer Range in Subset Sum**:
   If `totalSum / 2` is very large (e.g., elements up to $10^9$), allocating an array of size `target + 1` triggers V8 heap out-of-memory. In such cases, standard DP cannot be used; a `Set` or Meet-in-the-Middle approach is required.

---

## Hands-On Exercise

### Scenario
You are developing an API payload bundler in Node.js for mobile clients on low-bandwidth networks. You receive a set of optional data modules: each module has `{ name: string, sizeKb: number, priorityScore: number }`. The mobile client specifies a strict bandwidth ceiling `maxBandwidthKb`.
Implement `bundlePayloadModules(modules, maxBandwidthKb)`:
1. Returns the **maximum total priority score** achievable.
2. Returns the **exact list of module names** included in the optimal bundle.
3. Must enforce that each module can be included **at most once** (0/1 Knapsack).

### Buggy Code
```javascript
function bundlePayloadModules(modules, maxBandwidthKb) {
  // BUG: Forward loop allows including the same module multiple times!
  const dp = new Array(maxBandwidthKb + 1).fill(0);

  for (let m of modules) {
    for (let w = m.sizeKb; w <= maxBandwidthKb; w++) {
      dp[w] = Math.max(dp[w], dp[w - m.sizeKb] + m.priorityScore);
    }
  }

  return { maxScore: dp[maxBandwidthKb], selected: [] }; // Cannot reconstruct names!
}
```

### Acceptance Criteria
- Enforce the 0/1 single-selection constraint using backward iteration or 2D table tracking.
- Return `{ maxScore, selectedModules }` containing the exact names of chosen modules.
- Handle edge cases where `maxBandwidthKb = 0` or no modules fit.

### Solution Code
```javascript
const assert = require('assert');

// Node.js code: 0/1 Knapsack with Exact Item Selection Backtracking
/**
 * @param {Array<{ name: string, sizeKb: number, priorityScore: number }>} modules
 * @param {number} maxBandwidthKb
 * @returns {{ maxScore: number, selectedModules: string[] }}
 */
function bundlePayloadModules(modules, maxBandwidthKb) {
  if (!modules || modules.length === 0 || maxBandwidthKb <= 0) {
    return { maxScore: 0, selectedModules: [] };
  }

  const n = modules.length;
  // Use full 2D table to reconstruct selected item names cleanly
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(maxBandwidthKb + 1));

  for (let i = 1; i <= n; i++) {
    const { sizeKb, priorityScore } = modules[i - 1];

    for (let w = 0; w <= maxBandwidthKb; w++) {
      if (sizeKb <= w) {
        dp[i][w] = Math.max(
          dp[i - 1][w],                         // Skip module
          dp[i - 1][w - sizeKb] + priorityScore // Include module
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  const maxScore = dp[n][maxBandwidthKb];

  // Backtrack to extract selected module names
  const selectedModules = [];
  let w = maxBandwidthKb;

  for (let i = n; i > 0; i--) {
    // If current value differs from row above, module i - 1 was included!
    if (dp[i][w] !== dp[i - 1][w]) {
      selectedModules.push(modules[i - 1].name);
      w -= modules[i - 1].sizeKb;
    }
  }

  return {
    maxScore,
    selectedModules: selectedModules.reverse()
  };
}

// Verification & Automated Unit Tests
const testModules = [
  { name: 'user-profile', sizeKb: 10, priorityScore: 30 },
  { name: 'recent-orders', sizeKb: 20, priorityScore: 50 },
  { name: 'recommendations', sizeKb: 30, priorityScore: 70 },
  { name: 'loyalty-points', sizeKb: 15, priorityScore: 40 }
];

// With budget = 35:
// Options:
// - user-profile (10) + recent-orders (20) = size 30, score 80
// - user-profile (10) + loyalty-points (15) = size 25, score 70
// - recent-orders (20) + loyalty-points (15) = size 35, score 90 (Optimal!)
const result = bundlePayloadModules(testModules, 35);
assert.strictEqual(result.maxScore, 90);
assert.deepStrictEqual(result.selectedModules, ['recent-orders', 'loyalty-points']);

// Zero bandwidth
assert.deepStrictEqual(bundlePayloadModules(testModules, 0), { maxScore: 0, selectedModules: [] });

// All modules exceed bandwidth
assert.deepStrictEqual(bundlePayloadModules(testModules, 5), { maxScore: 0, selectedModules: [] });

console.log('✅ All bundlePayloadModules 0/1 Knapsack assertions passed successfully!');
```

### Solution Explanation
1. **2D Table for Decision Tracking**: While 1D space saves memory for score-only queries, maintaining the 2D table allows backtracking in $O(N)$ time: if `dp[i][w] !== dp[i - 1][w]`, module $i - 1$ was selected.
2. **0/1 Invariant Preservation**: Reading strictly from row `i - 1` prevents any module from being counted more than once.
3. **Typed Arrays for V8 Efficiency**: `new Int32Array(maxBandwidthKb + 1)` keeps memory contiguous and compact.

---

## Summary

- **Longest Common Subsequence (LCS)** aligns two sequences via a 2D matrix: characters matching trigger diagonal increments ($1 + dp[i-1][j-1]$); mismatches take $\max(dp[i-1][j], dp[i][j-1])$.
- The **0/1 Knapsack Problem** evaluates the include/exclude decision for $N$ items bounded by capacity $W$.
- **Backward Loop Rule**: When optimizing 0/1 Knapsack to a 1D array, iterating capacity $w$ in reverse ensures each item is used at most once.
- **Partition Equal Subset Sum** maps directly to 0/1 Knapsack with target capacity $\sum \text{nums} / 2$.
- In Node.js backend infrastructure, LCS powers diff generation and 0/1 Knapsack models serverless resource packing.

---

## Cheat Sheet & Common Pitfalls

| Problem | Direction | Recurrence / Transition | Space Complexity |
| :--- | :--- | :--- | :--- |
| **LCS** | $i = 1 \dots M, j = 1 \dots N$ | If match: $1 + dp[i-1][j-1]$; else max skip | $O(M \times N)$ or $O(N)$ |
| **0/1 Knapsack** | $w = W$ down to $w_i$ (Backward) | $dp[w] = \max(dp[w], dp[w - w_i] + v_i)$ | $O(W)$ 1D array |
| **Unbounded Knapsack** | $w = w_i \dots W$ (Forward) | $dp[w] = \max(dp[w], dp[w - w_i] + v_i)$ | $O(W)$ 1D array |
| **Subset Sum** | $s = \text{target}$ down to $\text{num}$ | $dp[s] = dp[s] \lor dp[s - \text{num}]$ | $O(\text{target})$ 1D array |

---

## Interview Questions

### 1. Why does looping backward over capacity preserve the 0/1 property in Knapsack?
**Question:** Explain the mechanical difference between looping forward versus backward over capacity in a 1D array Knapsack implementation.

**Answer:**
Let our 1D array be `dp[w]`.
- **Looping Forward ($w = w_i \to W$)**:
  When updating `dp[w] = Math.max(dp[w], dp[w - w_i] + v_i)`, because $w - w_i < w$, the value at `dp[w - w_i]` was already updated earlier in the current loop iteration. Thus, it may already include item $i$. Adding item $i$ again permits the same item to be chosen multiple times (Unbounded Knapsack).
- **Looping Backward ($w = W \to w_i$)**:
  When updating `dp[w]`, the value at `dp[w - w_i]` has **not yet been modified** during the current item's loop. It still holds the state from the previous item ($i - 1$). Therefore, reading `dp[w - w_i]` guarantees that item $i$ was not already included, strictly enforcing the 0/1 constraint.

---

### 2. How do you reconstruct the actual characters of the Longest Common Subsequence?
**Question:** Given the completed $(M + 1) \times (N + 1)$ DP table from the LCS algorithm, write the algorithm to reconstruct the actual string characters of the LCS.

**Answer:**
We backtrack through the matrix starting from the bottom-right cell $(M, N)$:
```javascript
function getLCSString(text1, text2, dp) {
  let i = text1.length;
  let j = text2.length;
  const chars = [];

  while (i > 0 && j > 0) {
    if (text1[i - 1] === text2[j - 1]) {
      // Characters matched; must have come from diagonal!
      chars.push(text1[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      // Came from top cell (skipped char from text1)
      i--;
    } else {
      // Came from left cell (skipped char from text2)
      j--;
    }
  }

  return chars.reverse().join('');
}
```
Time complexity is $O(M + N)$ linear traversal time.

---

### 3. What is the relationship between Longest Common Subsequence and Edit Distance (Levenshtein Distance)?
**Question:** Explain how the 2D DP matrix transitions in LCS compare to the transitions in Levenshtein Edit Distance (LeetCode 72).

**Answer:**
Both problems use a 2D matrix comparing prefixes $S_1[0 \dots i-1]$ and $S_2[0 \dots j-1]$.
- **LCS (Maximization)**:
  - Match: $1 + dp[i-1][j-1]$ (diagonal).
  - Mismatch: $\max(dp[i-1][j], dp[i][j-1])$ (skip character).
- **Edit Distance (Minimization of operations: Insert, Delete, Replace)**:
  - Match: $dp[i-1][j-1]$ (0 cost, diagonal).
  - Mismatch: $1 + \min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1])$:
    - $dp[i-1][j-1] + 1$: **Replace** character.
    - $dp[i-1][j] + 1$: **Delete** character from $S_1$.
    - $dp[i][j-1] + 1$: **Insert** character into $S_1$.
Both problems execute in $O(M \times N)$ time.

---

### 4. Why is the 0/1 Knapsack problem considered pseudo-polynomial time?
**Question:** Why is the $O(N \cdot W)$ time complexity of 0/1 Knapsack termed "pseudo-polynomial" rather than truly polynomial?

**Answer:**
In algorithmic complexity theory, an algorithm is polynomial if its running time is bounded by a polynomial in the **input size in bits**.
1. The capacity $W$ is a number represented in $\log_2 W$ bits of input.
2. The runtime of 0/1 Knapsack is proportional to the **numerical magnitude** of $W$, not the number of bits.
3. If $W = 2^{64}$, the input size for $W$ is only 64 bits, but the algorithm performs $2^{64}$ operations—an **exponential** number of steps relative to input length!
4. An algorithm whose runtime is polynomial in the numerical value of the input, but exponential in the number of bits needed to represent that input, is defined as **pseudo-polynomial**. If $W$ is small, it runs fast; if $W$ is exponentially large, the DP approach becomes impractical.

---

<nav aria-label="Lecture navigation">
  <a href="day-49-2d-dp-grid-paths-and-minimum-path-sum.md">◀ Day 49: 2D DP: Grid Paths and Minimum Path Sum</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-51-greedy-interval-scheduling.md">Day 51: Greedy: Interval Scheduling and Overlaps ▶</a>
</nav>
