# Day 15: Prefix Sum and Cumulative Totals

<nav aria-label="Lecture navigation">

[Previous: Sliding Window: Variable Size](day-14-sliding-window-variable-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Stack Fundamentals and LIFO Architecture](day-16-stack-fundamentals-and-lifo.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain the **Cumulative Prefix Sum** principle: trading a one-time $O(n)$ precomputation for instant $O(1)$ range queries.
- Build a 1-indexed Prefix Sum array with a leading zero (`size = n + 1`) to eliminate edge-case conditionals.
- Explain why **Prefix Sum + Hash Map** works seamlessly with negative numbers where Sliding Window fails.
- Solve **Subarray Sum Equals K** in $O(n)$ time by storing prefix sum frequencies.
- Solve **Product of Array Except Self** in $O(n)$ time and $O(1)$ auxiliary space without using the division operator.

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md)
- [Day 06: Frequency Counting and Hash Tables](day-06-frequency-counting-and-hash-tables.md)
- [Day 07: Two Sum and Hash Map Complements](day-07-two-sum-and-hash-complements.md)

---

## Core Concepts

### 1. The Odometer Principle

If your car's odometer read $10,000\text{ km}$ at the start of a trip and reads $10,450\text{ km}$ at the destination:
$$\text{Distance} = 10,450 - 10,000 = 450\text{ km}$$
You do not need to sum every meter driven. You subtract the starting reading from the ending reading.

A **Prefix Sum** array acts as an odometer for an array of numbers:

```text
Original Array nums:   [   3  ,   1  ,   4  ,   2  ,   5  ]
Index:                     0      1      2      3      4

Prefix Array pref:     [ 0 , 3 , 4 , 8 , 10 , 15 ]
Index:                   0   1   2   3   4    5
```

To calculate the sum between index $i = 1$ and $j = 3$ (`nums[1] + nums[2] + nums[3] = 1 + 4 + 2 = 7`):
$$\text{Sum}(i \dots j) = \text{pref}[j + 1] - \text{pref}[i]$$
$$\text{Sum}(1 \dots 3) = \text{pref}[4] - \text{pref}[1] = 10 - 3 = 7 \quad (O(1)\text{ Instant Calculation!})$$

---

### 2. The Leading Zero Invariant (`size = n + 1`)

Always allocate the prefix array with size **$n + 1$** and set `prefix[0] = 0`:
```js
const prefix = new Array(nums.length + 1).fill(0);
for (let i = 0; i < nums.length; i++) {
  prefix[i + 1] = prefix[i] + nums[i];
}
```
**Why this matters**:
If a query asks for the range from $0$ to $j$, formula `prefix[j + 1] - prefix[0]` automatically evaluates correctly (`prefix[0]` is 0). You never need an `if (i === 0)` branch!

---

## Detailed Explanations & Node.js Relevance

### Prefix Sum + Hash Map: Handling Negative Numbers

When an array contains **negative numbers**, sliding window breaks because expanding does not monotonically increase the sum.
Prefix sum solves this by translating the problem into a variation of **Two Sum**:
$$\text{currentSum} - \text{previousSum} = k \iff \text{previousSum} = \text{currentSum} - k$$

As we maintain a running total `currentSum`, we ask our hash map:
> *"How many times has a prefix sum equal to `currentSum - k` occurred in our history?"*

```text
nums = [1, -1, 1, 1, 1], k = 2
Running prefix sum:
Step 0: sum = 0  -> Map { 0: 1 } (Base case: empty subarray has sum 0)
Step 1: sum = 1  -> target (1 - 2 = -1) not in map -> Map { 0:1, 1:1 }
Step 2: sum = 0  -> target (0 - 2 = -2) not in map -> Map { 0:2, 1:1 }
Step 3: sum = 1  -> target (1 - 2 = -1) not in map -> Map { 0:2, 1:2 }
Step 4: sum = 2  -> target (2 - 2 = 0) IS IN MAP (count: 2)! -> 2 subarrays found!
```

### Node.js Backend Relevance: Cumulative Analytics & Metrics
In backend analytics (e.g. tracking hourly sales or API request spikes), storing cumulative running totals allows calculating metric totals over any dynamic time range $[t_1, t_2]$ in $O(1)$ time without running heavy `SUM()` database aggregations.

---

## JavaScript Implementation & Tracing

### 1. Subarray Sum Equals K (LeetCode 560)

```js
function subarraySum(nums, k) {
  // Map stores: key = prefixSum, value = frequency of occurrence
  const prefixCounts = new Map();

  // Base case: a prefix sum of 0 has occurred 1 time (empty subarray)
  prefixCounts.set(0, 1);

  let currentSum = 0;
  let totalSubarrays = 0;

  for (let i = 0; i < nums.length; i++) {
    currentSum += nums[i];

    // Check how many times (currentSum - k) appeared previously
    const target = currentSum - k;
    if (prefixCounts.has(target)) {
      totalSubarrays += prefixCounts.get(target);
    }

    // Record current sum in frequency map
    prefixCounts.set(currentSum, (prefixCounts.get(currentSum) || 0) + 1);
  }

  return totalSubarrays;
}
```

### 2. Product of Array Except Self (LeetCode 238)

Return an array `output` such that `output[i]` is the product of all elements of `nums` except `nums[i]`, without division, in $O(n)$ time and $O(1)$ auxiliary space (output array does not count as extra space).

```js
function productExceptSelf(nums) {
  const n = nums.length;
  const result = new Array(n).fill(1);

  // Pass 1: Prefix products (accumulate products to the left of i)
  let prefix = 1;
  for (let i = 0; i < n; i++) {
    result[i] = prefix;
    prefix *= nums[i];
  }

  // Pass 2: Suffix products (accumulate products to the right of i)
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    result[i] *= suffix;
    suffix *= nums[i];
  }

  return result;
}
```

### Trace: `productExceptSelf([1, 2, 3, 4])`

| Index `i` | `nums[i]` | Left Pass `result[i] = prefix` | `prefix` after step | Right Pass `result[i] *= suffix` | `suffix` after step |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `0` | `1` | `result[0] = 1` | $1 \times 1 = 1$ | $1 \times 24 = \mathbf{24}$ | $24 \times 1 = 24$ |
| `1` | `2` | `result[1] = 1` | $1 \times 2 = 2$ | $1 \times 12 = \mathbf{12}$ | $12 \times 2 = 24$ |
| `2` | `3` | `result[2] = 2` | $2 \times 3 = 6$ | $2 \times 4 = \mathbf{8}$ | $4 \times 3 = 12$ |
| `3` | `4` | `result[3] = 6` | $6 \times 4 = 24$| $6 \times 1 = \mathbf{6}$ | $1 \times 4 = 4$ |

Final `result`: `[24, 12, 8, 6]`.
- **Time Complexity**: $O(n)$ (two sequential passes).
- **Auxiliary Space**: $O(1)$ extra space beyond the returned `result` array.

---

## Common Mistakes & Interview Traps

1. **Forgetting `prefixCounts.set(0, 1)`**:
   If the first element equals $k$ (`nums = [3], k = 3`), `currentSum = 3`. The lookup `3 - 3 = 0` requires `prefixCounts.get(0)` to equal `1`. Without initializing `(0, 1)`, valid subarrays starting at index 0 will be missed!
2. **Off-by-One in Range Queries**:
   Remember: $\text{Sum}(i \dots j) = \text{pref}[j + 1] - \text{pref}[i]$. Subtracting $\text{pref}[i - 1]$ in a 0-indexed prefix array crashes when $i = 0$.
3. **Attempting Sliding Window when array has negatives**:
   If an interviewer introduces negative numbers, explicitly state: *"Because negative numbers break the monotonicity required for sliding windows, we must use Prefix Sum with a Hash Map instead."*

---

## Tricky Points & Edge Cases

- **Target $k = 0$ in Subarray Sum**:
  `nums = [0, 0, 0], k = 0`: Every zero subarray contributes. Handled automatically because the frequency map increments count on every step.
- **Zeros in Product of Array Except Self**:
  If the array has two or more zeros, all outputs are 0. If it has one zero, only the position of the zero receives a non-zero product. The prefix/suffix two-pass algorithm handles zeros naturally without division-by-zero errors.

---

## Practical Exercise

Implement **Find Pivot Index** (LeetCode 724):
Given an array of integers `nums`, calculate the pivot index where the sum of all the numbers strictly to the left of the index is equal to the sum of all the numbers strictly to the index's right.
- **Acceptance Criterion**: Must run in $O(n)$ time and $O(1)$ auxiliary space using `totalSum` and `leftSum`.

---

## Summary

- Prefix sums trade a one-time $O(n)$ precomputation for $O(1)$ range sum calculations.
- Using an $n+1$ length prefix array with `prefix[0] = 0` prevents index-out-of-bounds conditionals.
- Combining prefix sums with a hash map solves subarray sum problems in $O(n)$ time even with negative numbers.
- Accumulating prefix and suffix passes allows computing complex cumulative products without division in $O(1)$ auxiliary space.

---

## Cheat Sheet

### Range Sum Formulas
$$\text{pref}[0] = 0, \quad \text{pref}[i + 1] = \text{pref}[i] + \text{nums}[i]$$
$$\text{Sum}(i \dots j) = \text{pref}[j + 1] - \text{pref}[i]$$

### Subarray Sum Equals K
```js
const map = new Map([[0, 1]]);
let sum = 0, count = 0;
for (const x of nums) {
  sum += x;
  count += (map.get(sum - k) || 0);
  map.set(sum, (map.get(sum) || 0) + 1);
}
return count;
```

---

## Interview Questions

### 1. Deep Definitions and Mental Models
**Question:** Why does Subarray Sum Equals K require a Hash Map storing frequencies rather than a Set storing seen sums?
- **Expected answer shape:** Multiple prefixes can have the exact same sum (especially with zeros and negative numbers). Each previous prefix that equals `currentSum - k` forms a distinct valid subarray ending at the current index. A `Set` would collapse duplicates to a single count, failing to count multiple overlapping subarrays.

### 2. Predict the Output and Trace Execution
**Question:** What does this code print for `nums = [1, 2, 3]`, `k = 3`?
```js
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
```
- **Expected answer shape:** Prints `1` (only subarray `[1, 2]`). It misses subarray `[3]` because `map` was not initialized with `[0, 1]`. When `sum = 3`, `sum - k = 0`. Since `0` is not in the map, the subarray starting from index 0 is skipped.

### 3. Implementation Exercise
**Question:** Implement `pivotIndex(nums)` in $O(n)$ time and $O(1)$ extra space.
- **Expected answer shape:**
```js
function pivotIndex(nums) {
  const total = nums.reduce((a, b) => a + b, 0);
  let leftSum = 0;
  for (let i = 0; i < nums.length; i++) {
    if (leftSum === total - leftSum - nums[i]) return i;
    leftSum += nums[i];
  }
  return -1;
}
```

### 4. Debugging and Failure Analysis
**Question:** A candidate solves Product of Array Except Self by calculating the product of all elements and dividing: `result[i] = totalProduct / nums[i]`. When `nums = [0, 4, 0]`, what happens?
- **Expected answer shape:** Division by zero throws an error or evaluates to `NaN` in JavaScript (`0 / 0 = NaN`). Furthermore, when zeros exist, `totalProduct` becomes 0, producing incorrect results for all other elements. The two-pass prefix/suffix algorithm handles zeros safely without division.

### 5. Design and Tradeoff Questions
**Question:** How does 2D Range Sum Query (Matrix Prefix Sum) work, and what is the formula to query rectangle $(r_1, c_1)$ to $(r_2, c_2)$ in $O(1)$ time?
- **Expected answer shape:** 2D prefix sums store the sum of the subgrid from $(0,0)$ to $(r, c)$. To query rectangle $(r_1, c_1)$ to $(r_2, c_2)$:
$$\text{Sum} = P[r_2+1][c_2+1] - P[r_1][c_2+1] - P[r_2+1][c_1] + P[r_1][c_1]$$
The bottom-right area is added, top and left strips are subtracted, and the doubly-subtracted top-left overlap is restored (Inclusion-Exclusion Principle).

### 6. Senior Follow-ups: Node.js Timeseries Metrics
**Question:** In a high-traffic Node.js metrics collector, how do prefix sums allow calculating rolling 5-minute request rates over an array of 1-second bucketed counters with zero database overhead?
- **Expected answer shape:** Store requests per second in a circular buffer of 300 entries (5 minutes). Maintain a running cumulative prefix sum. The total requests over any arbitrary time window $[t_1, t_2]$ is simply `prefix[t2] - prefix[t1]`, evaluated in $O(1)$ CPU time. This completely bypasses expensive database aggregation queries on the request path.

<nav aria-label="Lecture navigation">

[Previous: Sliding Window: Variable Size](day-14-sliding-window-variable-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Stack Fundamentals and LIFO Architecture](day-16-stack-fundamentals-and-lifo.md)

</nav>
