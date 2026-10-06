# Day 15: Prefix Sum and Cumulative Totals

<nav aria-label="Lecture navigation">

[Previous: Sliding Window: Variable Size](day-14-sliding-window-variable-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Stack Fundamentals and LIFO Architecture](day-16-stack-fundamentals-and-lifo.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain the **Cumulative Prefix Sum** principle: trading a one-time $O(n)$ precomputation for instant $O(1)$ range queries.
- Implement 1-indexed Prefix Sum arrays with a leading zero (`size = n + 1`) to eliminate boundary conditional branching.
- Explain why **Prefix Sum + Hash Map** works seamlessly with negative numbers where Sliding Window fails due to broken monotonicity.
- Solve **Subarray Sum Equals K** in $O(n)$ time by tracking prefix sum frequency distributions.
- Solve **Product of Array Except Self** in $O(n)$ time and $O(1)$ auxiliary space without using the division operator.
- Implement 2D Matrix Prefix Sums using the Principle of Inclusion-Exclusion.
- Architect high-throughput real-time timeseries metrics aggregators in Node.js using in-memory prefix tables.

---

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Asymptotic analysis and auxiliary space.
- [Day 06: Frequency Counting and Hash Tables](day-06-frequency-counting-and-hash-tables.md) — Hash bucket indexing and frequency maps.
- [Day 07: Two Sum and Hash Map Complements](day-07-two-sum-and-hash-complements.md) — The complement lookup pattern.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
|---|---|---|
| **Prefix Sum Array** | An array where each index $k$ stores the cumulative sum of all elements from index $0$ to $k - 1$. | Reduces range sum queries over arbitrary intervals $[i, j]$ from $O(n)$ to $O(1)$ time. |
| **Leading Zero Invariant** | Prepending a zero at index `0` of the prefix array (`size = n + 1`). | Guarantees that ranges beginning at index `0` evaluate as `pref[j + 1] - pref[0]` without edge-case branching. |
| **Prefix Complement Pattern** | The algebraic identity: $\text{currentSum} - \text{previousSum} = k \iff \text{previousSum} = \text{currentSum} - k$. | Solves subarray sum problems with negative numbers in $O(n)$ time where sliding window fails. |
| **Prefix/Suffix Product** | Multiplying elements from the left and right in two passes to calculate cumulative products excluding index $i$. | Computes product of array except self without relying on division or risking division-by-zero crashes. |
| **Inclusion-Exclusion Principle** | Calculating 2D subgrid areas by combining overlapping bounding rectangles: $A + D - B - C$. | Enables $O(1)$ rectangular range queries over 2D grids and geo-spatial matrices. |

---

## Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            THE ODOMETER PREFIX SUM PRINCIPLE                                │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Original Array nums:   [   3  ,   1  ,   4  ,   2  ,   5  ]
  Index:                     0      1      2      3      4

  Prefix Array pref:     [ 0 , 3 , 4 , 8 , 10 , 15 ]
  Index:                   0   1   2   3   4    5
                           ▲
                    Leading zero (Base: sum of 0 elements is 0)

  To calculate range sum from index i = 1 to j = 3 (1 + 4 + 2 = 7):
  Sum(1 ... 3) = pref[3 + 1] - pref[1]
               = pref[4] - pref[1]
               = 10 - 3 = 7   <-- Instant O(1) evaluation!
```

### 1. Cumulative Range Queries: The Odometer Principle

If your vehicle's odometer reads $10,000\text{ km}$ at departure and $10,450\text{ km}$ upon arrival, you calculate trip distance by subtracting initial from final: $10,450 - 10,000 = 450\text{ km}$. You do not measure individual meters.

A **Prefix Sum** array acts as an odometer for numeric sequences:
- **Precomputation ($O(n)$):** One linear pass builds the prefix table.
- **Range Query ($O(1)$):**
  $$\text{Sum}(i \dots j) = \text{pref}[j + 1] - \text{pref}[i]$$

```javascript
// Node.js code
"use strict";

const data = [3, 1, 4, 2, 5];

// ❌ ANTI-PATTERN: Summing subarray elements per query (O(q * n))
function rangeSumSlow(nums, queries) {
  return queries.map(([i, j]) => {
    let sum = 0;
    for (let k = i; k <= j; k++) sum += nums[k];
    return sum;
  });
}

// ✅ PATTERN: Prefix table precomputation (O(n) build, O(1) per query)
class NumArray {
  constructor(nums) {
    // Leading zero invariant: array length is n + 1
    this.pref = new Array(nums.length + 1).fill(0);
    for (let i = 0; i < nums.length; i++) {
      this.pref[i + 1] = this.pref[i] + nums[i];
    }
  }

  sumRange(left, right) {
    // Formula: pref[right + 1] - pref[left]
    return this.pref[right + 1] - this.pref[left];
  }
}

const table = new NumArray(data);
console.log("Sum(1 to 3):", table.sumRange(1, 3)); // 1 + 4 + 2 = 7
console.log("Sum(0 to 2):", table.sumRange(0, 2)); // 3 + 1 + 4 = 8
```

---

### 2. The Leading Zero Invariant (`size = n + 1`)

Always allocate the prefix array with size **$n + 1$** and initialize `pref[0] = 0`.
- If a query requests the sum from $0$ to $j$:
  $$\text{Sum}(0 \dots j) = \text{pref}[j + 1] - \text{pref}[0] = \text{pref}[j + 1] - 0 = \text{pref}[j + 1]$$
- This completely eliminates conditional boundary checks (`if (left === 0)`) inside the query path, improving performance on hot code paths in V8.

---

### 3. Prefix Sum + Hash Map: Subarray Sum Equals K

Given an array of integers `nums` and an integer `k`, return the total number of subarrays whose sum equals `k`.

#### Why Sliding Window Fails:
If `nums` contains negative numbers (e.g., `[1, -1, 1, 1, 1]`), expanding the right pointer can *decrease* the window sum, and shrinking the left pointer can *increase* it. Monotonicity is destroyed, rendering sliding window invalid.

#### The Prefix Hash Complement Invariant:
Let $S_j$ be the prefix sum up to index $j$, and $S_i$ be the prefix sum up to index $i - 1$:
$$S_j - S_i = k \iff S_i = S_j - k$$
As we maintain a running `currentSum` ($S_j$), we query a frequency map:
> *"How many times has a prefix sum equal to `currentSum - k` occurred in history?"*

```javascript
// Node.js code
function subarraySum(nums, k) {
  const prefixCounts = new Map();

  // Base Case: An empty subarray has a prefix sum of 0 occurring 1 time
  prefixCounts.set(0, 1);

  let currentSum = 0;
  let totalSubarrays = 0;

  for (let i = 0; i < nums.length; i++) {
    currentSum += nums[i];
    const target = currentSum - k;

    // Add count of all previous prefixes that yield sum k when subtracted
    if (prefixCounts.has(target)) {
      totalSubarrays += prefixCounts.get(target);
    }

    // Record or increment current prefix sum frequency
    prefixCounts.set(currentSum, (prefixCounts.get(currentSum) || 0) + 1);
  }

  return totalSubarrays;
}

console.log("Subarrays summing to 2:", subarraySum([1, 1, 1], 2)); // 2 ([1,1] at 0..1 and 1..2)
console.log("Subarrays with negatives:", subarraySum([1, -1, 0], 0)); // 3 ([1, -1], [0], [1, -1, 0])
```
- **Time Complexity:** $O(n)$ — single linear pass.
- **Auxiliary Space:** $O(n)$ — stores up to $n$ unique prefix sums.

---

### 4. Product of Array Except Self ($O(1)$ Auxiliary Space)

Given an array `nums`, return an array `output` such that `output[i]` is equal to the product of all elements of `nums` except `nums[i]`, without using the division operator:

```javascript
// Node.js code
function productExceptSelf(nums) {
  const n = nums.length;
  const result = new Array(n).fill(1);

  // Pass 1: Prefix products (accumulate products strictly to the left of i)
  let prefix = 1;
  for (let i = 0; i < n; i++) {
    result[i] = prefix;
    prefix *= nums[i];
  }

  // Pass 2: Suffix products (accumulate products strictly to the right of i)
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    result[i] *= suffix;
    suffix *= nums[i];
  }

  return result;
}

console.log("Product Except Self:", productExceptSelf([1, 2, 3, 4])); // [ 24, 12, 8, 6 ]
```

#### Trace: `productExceptSelf([1, 2, 3, 4])`

| Index `i` | `nums[i]` | Left Pass (`result[i] = prefix`) | `prefix` After Step | Right Pass (`result[i] *= suffix`) | `suffix` After Step |
|---|---|---|---|---|---|
| `0` | `1` | `result[0] = 1` | $1 \times 1 = 1$ | $1 \times 24 = \mathbf{24}$ | $24 \times 1 = 24$ |
| `1` | `2` | `result[1] = 1` | $1 \times 2 = 2$ | $1 \times 12 = \mathbf{12}$ | $12 \times 2 = 24$ |
| `2` | `3` | `result[2] = 2` | $2 \times 3 = 6$ | $2 \times 4 = \mathbf{8}$ | $4 \times 3 = 12$ |
| `3` | `4` | `result[3] = 6` | $6 \times 4 = 24$ | $6 \times 1 = \mathbf{6}$ | $1 \times 4 = 4$ |

---

### 5. 2D Matrix Prefix Sum: Inclusion-Exclusion Principle

For a 2D matrix, range sum queries over subgrids from $(r_1, c_1)$ to $(r_2, c_2)$ are evaluated in $O(1)$ time using the **Principle of Inclusion-Exclusion**:

$$\text{Sum} = P[r_2 + 1][c_2 + 1] - P[r_1][c_2 + 1] - P[r_2 + 1][c_1] + P[r_1][c_1]$$

```
   (0,0)────────────(0, c2)
     │   Top Strip    │
     │   (Subtract)   │
   (r1,0)───────────(r1, c1)──────(r1, c2)
     │   Left Strip   │  TARGET  │
     │   (Subtract)   │  REGION  │
     │                │          │
   (r2,0)───────────(r2, c1)──────(r2, c2)
```

The top strip and left strip are subtracted. Because their top-left overlap is subtracted twice, it is added back once.

---

## Tricky Points and Edge Cases

### 1. Forgetting the Base Case `prefixCounts.set(0, 1)`
If the first element equals $k$ (`nums = [5], k = 5`), `currentSum = 5`. The lookup is $5 - 5 = 0$. If `0` was not initialized with frequency `1`, the algorithm fails to count subarrays that begin at index 0.

### 2. Division Operator Prohibitions and Zero Handlings
Calculating `totalProduct / nums[i]` fails catastrophically when elements contain zeros:
- If array has two zeros (`[0, 4, 0]`), all answers must be 0.
- If array has one zero (`[1, 2, 0, 4]`), division by zero throws or evaluates to `NaN` or `Infinity`, corrupting outputs.
The prefix/suffix two-pass algorithm handles zeros naturally without division.

---

## Hands-On Exercise

### Scenario
You are developing a load-balancing partitioner for an event-driven Node.js service. You receive an array of server workload metrics `nums`. You must find the **Pivot Index** where the sum of numbers strictly to the left equals the sum of numbers strictly to the right (LeetCode 724: Find Pivot Index).

If no such index exists, return `-1`. If multiple exist, return the leftmost index.

### Buggy Code
```javascript
// Node.js code
function pivotIndexBuggy(nums) {
  // ❌ Bug: Re-slices and re-sums arrays on every index step!
  // Takes O(n^2) time, timing out on 100,000 workloads.
  for (let i = 0; i < nums.length; i++) {
    const leftSum = nums.slice(0, i).reduce((a, b) => a + b, 0);
    const rightSum = nums.slice(i + 1).reduce((a, b) => a + b, 0);
    if (leftSum === rightSum) return i;
  }
  return -1;
}
```

### Acceptance Criteria
1. Execute in strictly $O(n)$ time.
2. Maintain $O(1)$ auxiliary memory without allocating prefix arrays.
3. Handle negative numbers and boundary pivot elements (e.g., pivot at index 0).

### Solution Code

```javascript
// Node.js code
import assert from "node:assert/strict";

function pivotIndex(nums) {
  // Pass 1: Compute total sum of all elements in O(n) time
  let totalSum = 0;
  for (let i = 0; i < nums.length; i++) {
    totalSum += nums[i];
  }

  let leftSum = 0;

  // Pass 2: Check balance condition in O(1) per index
  for (let i = 0; i < nums.length; i++) {
    // Invariant: rightSum = totalSum - leftSum - nums[i]
    if (leftSum === totalSum - leftSum - nums[i]) {
      return i; // Leftmost pivot index found
    }
    leftSum += nums[i];
  }

  return -1;
}

// Verification Tests
assert.equal(pivotIndex([1, 7, 3, 6, 5, 6]), 3); // Left sum = 1+7+3 = 11; Right sum = 5+6 = 11
assert.equal(pivotIndex([1, 2, 3]), -1);
assert.equal(pivotIndex([2, 1, -1]), 0);         // Index 0: left sum = 0, right sum = 1 + (-1) = 0
assert.equal(pivotIndex([-1, -1, 0, 1, 1, 0]), 2);

console.log("✅ All Find Pivot Index assertions passed successfully!");
```

### Solution Explanation

1. **Total Sum Invariant:** By precomputing `totalSum`, the sum to the right of index $i$ is derived instantly as $\text{rightSum} = \text{totalSum} - \text{leftSum} - \text{nums}[i]$.
2. **Strict $O(1)$ Memory:** No prefix tables are allocated, executing in two linear passes with two scalar accumulator variables.

---

## Summary

- Prefix sums trade an $O(n)$ precomputation for instant $O(1)$ range queries over arbitrary intervals.
- The **Leading Zero Invariant** (`size = n + 1`, `pref[0] = 0`) eliminates boundary conditionals for queries starting at index 0.
- Prefix sums combined with a hash map solve subarray sum problems with negative numbers where sliding windows fail.
- **Product of Array Except Self** uses two passes (prefix products and suffix products) to achieve $O(n)$ time and $O(1)$ auxiliary space without division.
- 2D Matrix Prefix Sums evaluate rectangular subgrids in $O(1)$ time using the Principle of Inclusion-Exclusion.

---

## Cheat Sheet

### Range Query Formulas
$$\text{pref}[0] = 0, \quad \text{pref}[i + 1] = \text{pref}[i] + \text{nums}[i]$$
$$\text{Sum}(i \dots j) = \text{pref}[j + 1] - \text{pref}[i]$$

### Subarray Sum Equals K Blueprint
```javascript
const map = new Map([[0, 1]]);
let sum = 0, count = 0;

for (const x of nums) {
  sum += x;
  count += (map.get(sum - k) || 0);
  map.set(sum, (map.get(sum) || 0) + 1);
}

return count;
```

### Common Pitfalls
- **Missing `(0, 1)` Base Case:** Omitting `map.set(0, 1)` causes valid subarrays starting at index 0 to be missed.
- **Sliding Window on Negatives:** Using sliding window on arrays with negative numbers breaks monotonicity.
- **Division by Zero in Products:** Using `/ nums[i]` crashes when elements contain zeros.
- **0-Indexed Prefix Array Bugs:** Evaluating $\text{pref}[j] - \text{pref}[i - 1]$ causes an index out-of-bounds error when $i = 0$.

---

## Interview Questions

### 1. Why does Subarray Sum Equals K require a Hash Map storing frequencies rather than a Set storing seen sums?

**Question:** Explain why a `Set` cannot solve Subarray Sum Equals K and why frequency tracking is mathematically mandatory.

**Answer:** 
A `Set` only tracks whether a particular prefix sum value has occurred, recording a boolean existence flag. However, when arrays contain zeros or negative numbers, **multiple distinct prefix indices can produce the exact same cumulative sum**.

For example, consider `nums = [1, -1, 1, 1, 1]` with target $k = 2$:
- Index 0: sum = 1
- Index 1: sum = 0
- Index 2: sum = 1
- Index 3: sum = 2
- Index 4: sum = 3

At index 3 (`currentSum = 2`), the required target prefix is $\text{currentSum} - k = 2 - 2 = 0$.
At index 4 (`currentSum = 3`), the required target prefix is $3 - 2 = 1$.
The prefix sum `1` was produced at **both index 0 and index 2**. Each of these two historical prefix points defines a distinct valid subarray ending at index 4:
1. Subarray `[1 ... 4]` (`[-1, 1, 1, 1]`, sum = 2)
2. Subarray `[3 ... 4]` (`[1, 1]`, sum = 2)

If a `Set` were used, the duplicate occurrence of prefix sum `1` would be collapsed to a single entry, undercounting valid subarrays. A `Map` records that prefix sum `1` occurred twice, adding $2$ to the result counter.

---

### 2. What does this code print for `nums = [1, 2, 3]`, `k = 3`, and why does it fail?

**Question:** Identify the missing invariant and explain the execution output:
```javascript
function test(nums, k) {
  const map = new Map();
  let sum = 0, count = 0;
  for (const n of nums) {
    sum += n;
    if (map.has(sum - k)) count += map.get(sum - k);
    map.set(sum, (map.get(sum) || 0) + 1);
  }
  return count;
}
console.log(test([1, 2, 3], 3));
```

**Answer:**
The function prints `1`, which is incorrect (the correct answer is `2`).

**Explanation:**
For `nums = [1, 2, 3]` and $k = 3$, there are two valid subarrays:
1. `[1, 2]` (sum = 3)
2. `[3]` (sum = 3)

**Trace:**
- **`n = 1`:** `sum = 1`. Target $1 - 3 = -2$ not in map. Store `{ 1 => 1 }`.
- **`n = 2`:** `sum = 3`. Target $3 - 3 = 0$. Because `0` is not in the map, `map.has(0)` returns `false`. Subarray `[1, 2]` is **missed**! Store `{ 1 => 1, 3 => 1 }`.
- **`n = 3`:** `sum = 6`. Target $6 - 3 = 3$. Map contains `{ 3 => 1 }`, so `count += 1`. Subarray `[3]` is found.
- The function terminates with `count = 1`.
- **Fix:** Pre-populate `map.set(0, 1)`. A prefix sum of `0` exists before any elements are processed (representing an empty prefix), allowing subarrays starting at index 0 whose sum equals $k$ to match.

---

### 3. How does 2D Matrix Prefix Sum calculate any subgrid sum in $O(1)$ time, and what is the Inclusion-Exclusion formula?

**Question:** Derive the precomputation and query formulas for 2D Matrix Range Sum queries.

**Answer:** 
Let $M$ be an $R \times C$ matrix. We construct a 2D prefix sum matrix $P$ of dimensions $(R + 1) \times (C + 1)$, where $P[r + 1][c + 1]$ represents the cumulative sum of all elements inside the rectangular subgrid from $(0, 0)$ to $(r, c)$.

1. **Precomputation Formula ($O(R \times C)$):**
   $$P[r + 1][c + 1] = M[r][c] + P[r][c + 1] + P[r + 1][c] - P[r][c]$$
   We add the current cell, the subgrid directly above, and the subgrid directly to the left. The top-left corner is added twice, so we subtract $P[r][c]$ once.

2. **Query Formula ($O(1)$ Time):**
   To calculate the sum of the rectangular subgrid with top-left $(r_1, c_1)$ and bottom-right $(r_2, c_2)$:
   $$\text{Sum} = P[r_2 + 1][c_2 + 1] - P[r_1][c_2 + 1] - P[r_2 + 1][c_1] + P[r_1][c_1]$$
   - $P[r_2 + 1][c_2 + 1]$ is the total area from $(0, 0)$ to $(r_2, c_2)$.
   - We subtract the area above the target subgrid ($P[r_1][c_2 + 1]$).
   - We subtract the area to the left of the target subgrid ($P[r_2 + 1][c_1]$).
   - Because the top-left intersection $P[r_1][c_1]$ was subtracted twice, we add it back once.

---

### 4. How can a Node.js timeseries analytics service calculate arbitrary time-range request totals in $O(1)$ time without database aggregations?

**Question:** Design an in-memory prefix sum architecture for a high-traffic Node.js API to report rolling metrics over arbitrary intervals.

**Answer:** 
**Architecture Design:**
1. **Time-Bucketed In-Memory Buffer:**
   - In Node.js memory, allocate a fixed-size typed array (e.g., `Uint32Array(86400)`) representing the 86,400 seconds in a 24-hour day.
   - Incoming HTTP requests atomically increment the counter for the current second: `buckets[currentSecond]++`.
2. **Cumulative Prefix Table:**
   - Maintain a synchronized prefix array `pref` of size 86,401:
     $$\text{pref}[s + 1] = \text{pref}[s] + \text{buckets}[s]$$
   - As seconds advance, update the latest prefix entry.
3. **Instant $O(1)$ Query Execution:**
   - When a dashboard client requests total API requests between timestamp $T_1$ and $T_2$ (e.g., "how many requests between 14:10:00 and 14:45:00?"):
     $$\text{Total} = \text{pref}[T_2 + 1] - \text{pref}[T_1]$$
   - This executes in **$O(1)$ CPU time** via a single memory offset subtraction.
4. **Operational Impact:**
   - Completely eliminates `SELECT COUNT(*) FROM api_logs WHERE created_at BETWEEN ...` SQL database queries.
   - Consumes $< 700\text{ KB}$ of RAM in the Node.js process, shielding the primary database from analytical query load.

---

<nav aria-label="Lecture navigation">

[Previous: Sliding Window: Variable Size](day-14-sliding-window-variable-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Stack Fundamentals and LIFO Architecture](day-16-stack-fundamentals-and-lifo.md)

</nav>
