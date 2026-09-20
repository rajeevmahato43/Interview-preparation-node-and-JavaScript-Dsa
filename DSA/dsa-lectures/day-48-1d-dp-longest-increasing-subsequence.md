# Day 48: 1D Dynamic Programming: Longest Increasing Subsequence

## 1. Learning Outcomes
- Master the classic $O(n^2)$ Dynamic Programming solution for **Longest Increasing Subsequence (LIS)**.
- Understand why LIS cannot be optimized to $O(1)$ space using scalar variables.
- Master the advanced $O(n \log n)$ **Patience Sorting & Binary Search** algorithm.
- Solve 2D multidimensional extensions: **Russian Doll Envelopes** using height/width sorting tricks.
- Apply sequence reconciliation and audit-log monotonic verification to Node.js backend pipelines.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 26 (Binary Search Bounds & Intervals), Day 46 (Dynamic Programming Fundamentals).
- **Navigation**:
  - [Previous: Day 47 - 1D DP: House Robber and Coin Change](day-47-1d-dp-house-robber-and-coin-change.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 49 - 2D DP: Grid Paths and Minimum Path Sum](day-49-2d-dp-grid-paths-and-minimum-path-sum.md)

---

## 3. Core Concepts & Mental Models
A **Subsequence** is derived from an array by deleting zero or more elements without changing the relative order of remaining elements (unlike substrings, subsequences do not need to be contiguous).

```text
Array: [10, 9, 2, 5, 3, 7, 101, 18]
Valid Increasing Subsequence: [2, 3, 7, 101] (Length 4)
Longest Increasing Subsequence Length: 4

O(n^2) DP Mental Model:
dp[i] = Length of LIS ending at index i
For every j < i:
  if nums[j] < nums[i]:
    dp[i] = Math.max(dp[i], dp[j] + 1)

O(n log n) Patience Sorting Mental Model:
Maintain an array 'tails' where tails[len] is the SMALLEST tail element
of all increasing subsequences of length len + 1 found so far.
Because 'tails' is strictly sorted, use Binary Search to update it!
```

---

## 4. Detailed Technical Explanations

### 4.1 Classic $O(n^2)$ Tabulation
- Every element starts as an LIS of length 1: `dp.fill(1)`.
- For each index $i$ from 1 to $n-1$:
  - Scan all predecessors $j \in [0 \dots i-1]$.
  - If `nums[j] < nums[i]`, update `dp[i] = Math.max(dp[i], dp[j] + 1)`.
- Global answer: `Math.max(...dp)`.
- **Complexity**: $O(n^2)$ time, $O(n)$ space. Cannot be reduced to $O(1)$ space because `dp[i]` depends on all $i$ previous entries.

### 4.2 Patience Sorting & Binary Search ($O(n \log n)$)
- Maintain an array `tails = []`.
- For each `x` in `nums`:
  - Binary search for the first element in `tails` that is $\ge x$ (`bisect_left`).
  - If `x` is larger than all elements in `tails`, append `x` to `tails` (extends the max subsequence length by 1).
  - Otherwise, replace that element with `x` (keeping the tail value as small as possible to maximize future extension opportunities).
- At the end, `tails.length` is the exact length of the LIS!

### 4.3 Russian Doll Envelopes (LeetCode 354)
Given envelopes `[width, height]`, one envelope fits into another only if both width and height are strictly greater.
- **Sorting Trick**:
  - Sort `width` in **ascending order**.
  - If widths are equal, sort `height` in **descending order**.
- Why descending on height? It prevents two envelopes with the same width from being included in the same increasing subsequence!
- Run standard $O(n \log n)$ LIS exclusively on the sorted heights.

### 4.4 Node.js Relevance: Monotonic Event Streaming & Audit Trails
In event-sourced Node.js backends (e.g., Kafka consumers or CQRS systems), distributed network delays can deliver events out of order. LIS identifies the longest consistent chronologically ordered subset of transactions, allowing audit pipelines to flag tampered or delayed log sequences.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 Classic $O(n^2)$ LIS (LeetCode 300)
```javascript
/**
 * O(n^2) Dynamic Programming solution.
 * Time Complexity: O(n^2)
 * Space Complexity: O(n)
 */
function lengthOfLIS_DP(nums) {
  if (!nums || nums.length === 0) return 0;

  const n = nums.length;
  const dp = new Array(n).fill(1);
  let maxLIS = 1;

  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
    maxLIS = Math.max(maxLIS, dp[i]);
  }

  return maxLIS;
}
```

### 5.2 Optimal $O(n \log n)$ LIS (Patience Sorting)
```javascript
/**
 * O(n log n) Patience Sorting with Binary Search.
 * Time Complexity: O(n log n)
 * Space Complexity: O(n)
 */
function lengthOfLIS(nums) {
  if (!nums || nums.length === 0) return 0;

  const tails = [];

  for (const x of nums) {
    // Binary search (lower bound): find first element in tails >= x
    let left = 0;
    let right = tails.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (tails[mid] < x) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    // If x is greater than all elements in tails, extend LIS
    if (left === tails.length) {
      tails.push(x);
    } else {
      // Overwrite first element >= x with a smaller tail
      tails[left] = x;
    }
  }

  return tails.length;
}
```

### 5.3 Execution Trace: `lengthOfLIS([10, 9, 2, 5, 3, 7, 101])`
```text
tails array evolution:
x = 10:  tails = [10]
x = 9:   lower bound is 0 (10 >= 9). Overwrite: tails = [9]
x = 2:   lower bound is 0 (9 >= 2). Overwrite: tails = [2]
x = 5:   5 > 2. Append: tails = [2, 5]
x = 3:   lower bound is 1 (5 >= 3). Overwrite: tails = [2, 3]
x = 7:   7 > 3. Append: tails = [2, 3, 7]
x = 101: 101 > 7. Append: tails = [2, 3, 7, 101]

Final tails.length = 4 (Corresponding LIS: [2, 3, 7, 101]).
```

---

## 6. Common Mistakes & Anti-Patterns
- **Assuming `tails` Contains the Actual LIS Sequence**: The `tails` array stores the smallest tail values of subproblems; its length equals the LIS length, but the elements inside `tails` at the end do *not* necessarily form a valid subsequence (e.g., for `[2, 5, 1]`, `tails` ends as `[1, 5]`, which is not an increasing subsequence of the original array).
- **Using `<=` Instead of `<` in Strict LIS**: For strictly increasing sequences, binary search condition must be `tails[mid] < x`. If non-decreasing sequence is required, use `tails[mid] <= x`.
- **Forgetting Width Ties in Russian Doll**: Sorting both width and height ascending permits envelopes with identical widths `[3, 4]` and `[3, 5]` to nest, which violates strict inequality. Height must sort descending!

---

## 7. Tricky Points & Edge Cases
- **Duplicate Elements**: In strictly increasing LIS, identical elements overwrite each other at the same lower-bound index, properly preventing length inflation.
- **Empty Array**: Guard `if (nums.length === 0) return 0;`.
- **Reconstructing the Actual LIS Elements**: To output the actual elements rather than just the length, track predecessor index pointers in a parent array during DP.

---

## 8. Practical Engineering Exercises
1. Modify `lengthOfLIS` to reconstruct and return the actual elements of the Longest Increasing Subsequence.
2. Implement **Russian Doll Envelopes** (LeetCode 354) using the $O(n \log n)$ algorithm.

---

## 9. Key Takeaways & Summary
- Classic DP solves LIS in $O(n^2)$ time by evaluating all predecessors: $dp[i] = 1 + \max(dp[j])$.
- Patience Sorting optimizes LIS to $O(n \log n)$ by maintaining the minimum tail value of increasing subsequences in a binary-searchable `tails` array.
- Russian Doll Envelopes is reduced to 1D LIS by sorting width ascending and height descending.

---

## 10. Quick Reference Cheat Sheet
| Algorithm | Time Complexity | Auxiliary Space | Best For |
| :--- | :--- | :--- | :--- |
| **Tabular DP** | $O(n^2)$ | $O(n)$ | Reconstructing sequence / small $N$ |
| **Patience Sort** | $O(n \log n)$ | $O(n)$ | Length only / large $N \le 10^5$ |
| **Russian Doll** | $O(n \log n)$ | $O(n)$ | 2D multidimensional nesting |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: Why does the `tails` array in the $O(n \log n)$ LIS algorithm remain strictly sorted at all times?  
**Hint**: Consider what happens when an element is appended vs. replaced.  
**Expected Answer Shape**: In Patience Sorting, an element $x$ is appended to `tails` only when it is strictly greater than all existing elements, which naturally maintains ascending order. When $x$ replaces an existing element at index `left`, it replaces the first element that is $\ge x$. Since `tails[left - 1] < x` and `x <= tails[left] < tails[left + 1]`, replacing `tails[left]` with $x$ maintains strict monotonic ascending order across the entire array.

### 2. Code-Writing
**Question**: Write `maxEnvelopes(envelopes)` (Russian Doll Envelopes) in $O(n \log n)$ time.  
**Hint**: Sort width ascending, height descending; run LIS on heights.  
**Expected Answer Shape**: Sort envelopes: `envelopes.sort((a, b) => a[0] === b[0] ? b[1] - a[1] : a[0] - b[0])`. Extract heights array `heights = envelopes.map(e => e[1])`. Run $O(n \log n)$ patience sorting LIS on `heights` and return `tails.length`.

### 3. Debugging
**Question**: Identify why this code fails to return the correct LIS on `[7, 7, 7, 7]`:  
```javascript
function lengthOfLIS(nums) {
  const tails = [];
  for (const x of nums) {
    let l = 0, r = tails.length;
    while (l < r) {
      let m = Math.floor((l + r) / 2);
      if (tails[m] <= x) l = m + 1;
      else r = m;
    }
    tails[l] = x;
  }
  return tails.length;
}
```  
**Hint**: Check the comparison operator `tails[m] <= x`.  
**Expected Answer Shape**: The condition `tails[m] <= x` implements `bisect_right` (Upper Bound), which finds the Longest *Non-Decreasing* Subsequence. For `[7, 7, 7, 7]`, it appends every duplicate 7, returning length 4 instead of 1. For strictly increasing sequences, the check must be `tails[m] < x` (Lower Bound) so duplicates overwrite the same slot.

### 4. System Design / Tradeoff
**Question**: You are building an anomaly detection engine in Node.js analyzing 500,000 transaction timestamps. Should you use $O(n^2)$ DP or $O(n \log n)$ Patience Sorting?  
**Hint**: $N = 500,000$. Compare $N^2$ vs. $N \log N$ operations.  
**Expected Answer Shape**: For $N = 500,000$, $N^2 = 2.5 \times 10^{11}$ operations, which will freeze the Node.js single thread for hours. In contrast, $N \log_2 N \approx 500,000 \times 19 \approx 9.5 \times 10^6$ operations, executing in under 50 milliseconds in V8. $O(n \log n)$ Patience Sorting is mandatory for large-scale data pipelines.

### 5. Tricky / Edge Case
**Question**: Why does Russian Doll Envelopes sort height descending when widths are equal, rather than ascending?  
**Hint**: What happens if two envelopes have the same width?  
**Expected Answer Shape**: An envelope cannot fit inside another if both have identical widths (e.g., `[3, 4]` and `[3, 5]`). If heights were sorted ascending, heights `[4, 5]` would form an increasing subsequence of length 2, falsely suggesting `[3, 4]` fits inside `[3, 5]`. By sorting heights descending (`[5, 4]`), 4 cannot follow 5 in an increasing sequence, guaranteeing that at most one envelope of width 3 is selected.

### 6. Real-World Node.js Context
**Question**: In building an automated database schema migration tool in Node.js, how does LIS determine the minimum number of migration rollbacks needed to resolve out-of-order patches?  
**Hint**: Deletions needed = Total patches minus Longest Increasing Subsequence.  
**Expected Answer Shape**: If patches arrived out of chronological order, the longest already-ordered sequence is given by the LIS of patch version numbers. The minimum number of operations required to make the entire sequence monotonically sorted is `totalPatches - LIS_length`. The migration tool rolls back only the non-LIS patches, minimizing database downtime during reconciliation.
