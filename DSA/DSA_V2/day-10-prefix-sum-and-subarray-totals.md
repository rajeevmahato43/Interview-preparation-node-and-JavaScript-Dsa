# Day 10: Prefix Sum & Subarray Totals

<nav aria-label="Lecture navigation">

[Previous: Sliding Window: Variable Size](day-09-sliding-window-variable-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Singly & Doubly Linked Lists](day-11-singly-and-doubly-linked-lists.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Trading precomputation space ($O(n)$) for instant query time ($O(1)$).
- [Day 04: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md) — Hash Map frequency accumulation.

---

## 1. What is a Prefix Sum?

A **Prefix Sum** is an array of cumulative running totals where each element stores the sum of all preceding values up to that position.

> **Prefix Sum**: A precomputation technique where an auxiliary array $P$ is built such that $P[i]$ equals the sum of the first $i$ elements of the original array. This transforms any contiguous range sum query between index $L$ and index $R$ from an $O(n)$ linear scan into a single **$O(1)$ subtraction**: $P[R + 1] - P[L]$.

### The Automobile Odometer Analogy

Imagine taking a road trip across four cities and recording the distances driven each day:
- Day 1: 50 miles
- Day 2: 70 miles
- Day 3: 40 miles
- Day 4: 100 miles

How does your car calculate the total distance driven between the start of Day 2 and the end of Day 3?
- It **does not** recount every mile marker driven.
- Your car has an **odometer** (a prefix sum) that constantly tracks total cumulative miles:
  - Day 0 (Start): 0 miles
  - After Day 1: 50 miles
  - After Day 2: 120 miles
  - After Day 3: 160 miles
  - After Day 4: 260 miles
- To find the miles driven on Days 2 and 3, subtract the odometer reading before Day 2 began from the odometer reading at the end of Day 3:
  $$160 - 50 = 110 \text{ miles} \quad (70 + 40 = 110!)$$

```text
Prefix Sum Transformation (1-indexed prefix array):
Original Array:        [  2,   1,   5,   3  ]  (length n = 4)
                       0    1    2    3

Prefix Array P:    [ 0,  2,   3,   8,  11  ]  (length n + 1 = 5)
Index P:             0   1    2    3   4

Query: Range Sum from index L = 1 to index R = 3 (values: 1 + 5 + 3 = 9)
Formula: P[R + 1] - P[L]
Calculation: P[4] - P[1] = 11 - 2 = 9  --> O(1) Instant Lookup!
```

---

## 2. How Prefix Sum Works Step-by-Step

Understanding prefix sums requires mastering the 1-indexed $(n + 1)$ array standard:

### The $(n + 1)$ Size Standard

Always allocate the prefix array with size **$n + 1$**:
$$\text{prefix} = \text{new Array}(n + 1).\text{fill}(0)$$

```text
+-----------------------------------------------------------------------+
|                 WHY THE LEADING ZERO MATTERS                          |
+-----------------------------------------------------------------------+
|  prefix[0] = 0 represents the sum of zero elements.                   |
|  prefix[1] = nums[0]                                                  |
|  prefix[2] = nums[0] + nums[1]                                        |
|  prefix[i] = sum of first i elements: nums[0 ... i - 1]               |
+-----------------------------------------------------------------------+
```

### Eliminating Conditional Edge Cases

Without the leading zero at `prefix[0]`, querying a range that starts at the very beginning of the array ($L = 0$) requires a special `if/else` condition:
```javascript
// ❌ Clunky 0-indexed prefix array:
const sum = L === 0 ? prefix[R] : prefix[R] - prefix[L - 1];

// ✅ Clean (n + 1) prefix array:
const sum = prefix[R + 1] - prefix[L]; // Works universally for all L >= 0!
```

If $L = 0$ and $R = 2$, $\text{prefix}[3] - \text{prefix}[0] = \text{prefix}[3] - 0 = \text{prefix}[3]$. No branch instructions needed!

---

## 3. Pattern Recognition of Prefix Sum

Spot this pattern in technical screens within 30 seconds:

### 30-Second Problem Triggers
- **Multiple range sum queries:** The problem asks to calculate the sum of elements between indices $L$ and $R$ repeatedly across $q$ queries.
- **Subarrays summing to $k$ with negative numbers:** The problem asks for the count or length of subarrays summing to $k$, and the array contains negative numbers.
- **Equal parts / Equilibrium index:** Finding an index where the sum of numbers on the left equals the sum of numbers on the right.
- **Product of array except self:** Accumulating prefix products from the left and suffix products from the right.

### Problem Keywords to Look For
- *"Range sum query"*
- *"Subarray sum equals k"*
- *"Pivot index / Equilibrium index"*
- *"Continuous subarray sum"*
- *"Equal 0s and 1s"* (treat 0s as -1 and use prefix sum)

### The 10^7 Operations Rule
- For $q = 100,000$ queries on an array of length $n = 100,000$:
  - Naive loop per query: $O(q \cdot n) = 10^{10}$ operations $\to$ **15+ seconds (Time Limit Exceeded)**.
  - Prefix Sum: Precomputes in $O(n)$ time once, answers all $q$ queries in $O(1)$ each. Total operations: $n + q = 200,000 \approx 2 \times 10^5$ operations $\to$ **executed in 3 milliseconds** in Node.js!

### When NOT to Use Prefix Sum
- **Frequent in-place array updates:** If array elements are constantly updated between queries, a standard prefix sum requires an $O(n)$ rebuild per modification. Use a **Binary Indexed Tree (Fenwick Tree)** or **Segment Tree** instead for $O(\log n)$ updates and queries.
- **Simple sliding window without negative numbers:** If searching for the shortest/longest subarray with non-negative numbers, a variable sliding window (Day 09) achieves $O(n)$ time with strictly $O(1)$ space.

---

## 4. Problem 1: Range Sum Query - Immutable

### Problem Statement
Given an integer array `nums`, handle multiple queries of the following type:
Calculate the sum of the elements of `nums` between indices `left` and `right` inclusive where `left <= right`.

Implement the `NumArray` class:
- `NumArray(int[] nums)` Initializes the object with the integer array `nums`.
- `int sumRange(int left, int right)` Returns the sum of the elements of `nums` between indices `left` and `right` inclusive (i.e. `nums[left] + nums[left + 1] + ... + nums[right]`).

- **Example 1:**
  ```text
  Input:
  ["NumArray", "sumRange", "sumRange", "sumRange"]
  [[[-2, 0, 3, -5, 2, -1]], [0, 2], [2, 5], [0, 5]]
  Output:
  [null, 1, -1, -3]
  Explanation:
  NumArray numArray = new NumArray([-2, 0, 3, -5, 2, -1]);
  numArray.sumRange(0, 2); // return (-2) + 0 + 3 = 1
  numArray.sumRange(2, 5); // return 3 + (-5) + 2 + (-1) = -1
  numArray.sumRange(0, 5); // return (-2) + 0 + 3 + (-5) + 2 + (-1) = -3
  ```
- **Constraints:** $1 \le nums.length \le 10^4$, $-10^5 \le nums[i] \le 10^5$, $0 \le left \le right < nums.length$. At most $10^4$ calls will be made to `sumRange`.

---

### Step 1: Physical Simulation

Take the array: `[-2, 0, 3, -5, 2, -1]`.
Create a notebook where each page records the cumulative total up to that point:

- Page 0 (Before starting): `0`
- Page 1 (After card 0): $0 + (-2) = -2$
- Page 2 (After card 1): $-2 + 0 = -2$
- Page 3 (After card 2): $-2 + 3 = 1$
- Page 4 (After card 3): $1 + (-5) = -4$
- Page 5 (After card 4): $-4 + 2 = -2$
- Page 6 (After card 5): $-2 + (-1) = -3$

When someone asks: *"What is the sum from card 2 to card 5?"*
1. Open to Page 6 (after card 5): value is `-3`.
2. Open to Page 2 (before card 2): value is `-2`.
3. Subtract: $-3 - (-2) = -1$.
You gave the exact answer in **one instant subtraction** without looking at cards 2, 3, 4, or 5!

---

### Step 2: Brute Force Approach

Sum the elements from index `left` to `right` inside `sumRange()` on every call:

```javascript
// Node.js code
class NumArrayBruteForce {
  constructor(nums) {
    this.nums = nums;
  }

  // ❌ O(n) loop on every query
  sumRange(left, right) {
    let sum = 0;
    for (let i = left; i <= right; i++) {
      sum += this.nums[i];
    }
    return sum;
  }
}
```

#### Complexity Analysis:
- **Build Time:** $O(1)$.
- **Query Time:** $O(n)$ per call.
- **Overall Time for $q$ queries:** $O(q \cdot n)$. For $10^4$ queries on $10^4$ elements, total operations reach $10^8$, creating unacceptable latency in APIs.

---

### Step 3: Bottleneck

- If queries frequently request overlapping ranges (e.g., `sumRange(0, 5000)` followed by `sumRange(10, 5000)`), the brute force repeatedly re-adds thousands of identical numbers.
- **The Wasted Work:** Redundant sequential addition over static, immutable data.

---

### Step 4: The Pattern Discovery

- Precompute the prefix sums **once** in the constructor in $O(n)$ time.
- Store the results in an array `prefix` of length $n + 1$.
- Any subsequent `sumRange(left, right)` call calculates:
  $$\text{prefix}[right + 1] - \text{prefix}[left]$$
- Query runtime drops from **$O(n)$ to $O(1)$**!

---

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) precomputation, O(1) query time prefix sum class
class NumArray {
  constructor(nums) {
    // prefix[i] stores the sum of the first i elements
    // Size is nums.length + 1 with leading 0 to eliminate edge cases
    this.prefix = new Array(nums.length + 1).fill(0);

    for (let i = 0; i < nums.length; i++) {
      this.prefix[i + 1] = this.prefix[i] + nums[i];
    }
  }

  // Answer any range query in strictly O(1) time
  sumRange(left, right) {
    return this.prefix[right + 1] - this.prefix[left];
  }
}

// ❌ ANTI-PATTERN / COMMON BUG: 0-indexed prefix array with ternary check
class BuggyNumArray {
  constructor(nums) {
    this.prefix = new Array(nums.length);
    let sum = 0;
    for (let i = 0; i < nums.length; i++) {
      sum += nums[i];
      this.prefix[i] = sum;
    }
  }
  sumRange(left, right) {
    // INFERIOR: Introduces branch prediction overhead on every query
    if (left === 0) return this.prefix[right];
    return this.prefix[right] - this.prefix[left - 1];
  }
}

// Example runs
const obj = new NumArray([-2, 0, 3, -5, 2, -1]);
console.log(obj.sumRange(0, 2)); // 1  ((-2) + 0 + 3)
console.log(obj.sumRange(2, 5)); // -1 (3 + (-5) + 2 + (-1))
console.log(obj.sumRange(0, 5)); // -3
console.log(obj.sumRange(3, 3)); // -5 (single element)
```

#### Complexity Derivation:
- **Time Complexity:**
  - `constructor`: $O(n)$ single linear pass to compute cumulative sums.
  - `sumRange`: Strictly $O(1)$ constant time (two array lookups and one subtraction).
  - Total for $q$ queries: $O(n + q)$, down from $O(q \cdot n)$.
- **Space Complexity:** $O(n)$ auxiliary space to store the $(n + 1)$ prefix array.

---

## 5. Problem 2: Subarray Sum Equals K

### Problem Statement
Given an array of integers `nums` and an integer `k`, return the total number of subarrays whose sum equals to `k`.
A subarray is a contiguous non-empty sequence of elements within an array.

- **Example 1:** `nums = [1, 1, 1]`, `k = 2` $\to$ `2`  
  *(Subarrays: `[1, 1]` at indices 0-1, and `[1, 1]` at indices 1-2)*
- **Example 2:** `nums = [1, 2, 3]`, `k = 3` $\to$ `2`  
  *(Subarrays: `[1, 2]` at indices 0-1, and `[3]` at index 2)*
- **Example 3:** `nums = [1, -1, 0]`, `k = 0` $\to$ `3`  
  *(Subarrays: `[1, -1]`, `[0]`, `[1, -1, 0]`)*
- **Constraints:** $1 \le nums.length \le 2 \times 10^4$, $-1000 \le nums[i] \le 1000$, $-10^7 \le k \le 10^7$.

---

### Step 1: Physical Simulation

Let `nums = [1, 2, 3]` and `k = 3`.
Think of managing your bank account balance:
- Start with balance $0$.
- Day 1: Deposit $1 \to$ Balance = 1.
- Day 2: Deposit $2 \to$ Balance = 3.
- Day 3: Deposit $3 \to$ Balance = 6.

How do you know if you received a net total of $k = 3$ over *some* continuous window?
- At Balance = 3: Ask: *"Did my balance ever equal $3 - 3 = 0$ in the past?"* Yes, at the start! Subarray found: `[1, 2]`.
- At Balance = 6: Ask: *"Did my balance ever equal $6 - 3 = 3$ in the past?"* Yes, on Day 2! Subarray found: `[3]`.
Total matching subarrays = 2!

Notice the mathematical relation:
$$\text{Current Balance} - \text{Previous Balance} = k \iff \text{Previous Balance} = \text{Current Balance} - k$$

---

### Step 2: Brute Force Approach

Check the sum of every possible contiguous subarray using nested loops:

```javascript
// Node.js code
function subarraySumBruteForce(nums, k) {
  let count = 0;
  for (let i = 0; i < nums.length; i++) {
    let sum = 0;
    for (let j = i; j < nums.length; j++) {
      sum += nums[j];
      if (sum === k) {
        count++;
      }
    }
  }
  return count;
}
```

#### Complexity Analysis:
- **Time Complexity:** $O(n^2)$. Checks $\frac{n(n+1)}{2}$ subarrays.
- **Space Complexity:** $O(1)$.
- **Scale Failure:** At $n = 20,000$, $n^2 = 4 \times 10^8$ operations. In Node.js, this takes over 1.8 seconds.

---

### Step 3: Bottleneck

Why can't we use a Sliding Window here?
- **Crucial Constraint:** `nums` contains **negative numbers** ($-1000 \le nums[i] \le 1000$).
- Sliding window requires sums to grow monotonically: expanding `right` must increase the sum, and contracting `left` must decrease it.
- With negative numbers, adding a number can *decrease* the sum! Shrinking can *increase* it! A sliding window gets completely lost.
- **The Wasted Work:** The brute force recalculates all subarray sums because it has no memory of prior prefix sums.

---

### Step 4: The Pattern Discovery

Combine **Prefix Sum** with a **Hash Map** (Frequency Counter):
- Let `runningSum` track the cumulative sum from index 0 to the current index.
- If a subarray ending at current index sums to $k$, there must be an earlier prefix sum equal to:
  $$\text{targetPrefix} = \text{runningSum} - k$$
- Maintain a Hash Map `prefixCounts` storing:
  $$\text{prefixSum} \to \text{how many times this sum has appeared}$$
- On each step:
  1. Add `nums[i]` to `runningSum`.
  2. If `prefixCounts.has(runningSum - k)`, add `prefixCounts.get(runningSum - k)` to `count`!
  3. Store or increment `runningSum` in `prefixCounts`.
- **The Essential Base Case:** Before the loop starts, register `prefixCounts.set(0, 1)` to account for subarrays starting at index 0 whose sum directly equals $k$!
- Runtime drops from **$O(n^2)$ to $O(n)$**!

---

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(n) space Prefix Sum + Hash Map
function subarraySum(nums, k) {
  // Map stores: prefixSum (number) -> frequencyCount (number)
  const prefixCounts = new Map();

  // BASE CASE: A prefix sum of 0 has occurred exactly once (before any elements are added)
  prefixCounts.set(0, 1);

  let runningSum = 0;
  let totalSubarrays = 0;

  for (let i = 0; i < nums.length; i++) {
    runningSum += nums[i];

    // If (runningSum - k) exists in our map, a valid subarray ending at i exists!
    const neededPrefix = runningSum - k;
    if (prefixCounts.has(neededPrefix)) {
      totalSubarrays += prefixCounts.get(neededPrefix);
    }

    // Record the current prefix sum in the map
    prefixCounts.set(runningSum, (prefixCounts.get(runningSum) || 0) + 1);
  }

  return totalSubarrays;
}

// ❌ ANTI-PATTERN / COMMON BUG: Missing the base case prefixCounts.set(0, 1)
function buggySubarraySumMissingBase(nums, k) {
  const map = new Map();
  // BUG: Forgot map.set(0, 1)!
  // Any subarray starting at index 0 that sums to k will be completely missed!
  let sum = 0, count = 0;
  for (const num of nums) {
    sum += num;
    if (map.has(sum - k)) count += map.get(sum - k);
    map.set(sum, (map.get(sum) || 0) + 1);
  }
  return count;
}

// Example runs
console.log(subarraySum([1, 1, 1], 2));        // 2
console.log(subarraySum([1, 2, 3], 3));        // 2
console.log(subarraySum([1, -1, 0], 0));       // 3 ([1, -1], [0], [1, -1, 0])
console.log(subarraySum([3, 4, 7, 2, -3, 1, 4, 2], 7)); // 4
```

#### Complexity Derivation:
- **Time Complexity:** $O(n)$. Single `for` loop executing $n$ iterations. In each iteration, `map.has()`, `map.get()`, and `map.set()` operate in $O(1)$ average time. Total time is $O(n)$.
- **Space Complexity:** $O(n)$ auxiliary space. In the worst case (where every prefix sum is unique), the `Map` stores up to $n + 1$ entries.

---

## 6. Under the Hood: V8 & Node.js

### 1. TypedArray Allocation for Prefix Sums

In performance-critical Node.js services processing large datasets (e.g., millions of telemetry floats):
- A regular JavaScript array `new Array(n + 1)` allocates an array of V8 object pointers.
- Using **`Float64Array`** or **`Int32Array`** allocates a single contiguous block of C++ memory directly on the system heap:
  ```javascript
  const prefix = new Int32Array(nums.length + 1);
  ```
- This achieves:
  - 4x to 8x lower RAM consumption.
  - Zero pointer dereference overhead in CPU registers.
  - Total immunity from V8 Garbage Collection pauses.

```text
Memory Layout Comparison in V8:
Regular Array:  [ Pointer -> Object ] [ Pointer -> Object ] (Heap fragmentation)
Int32Array:     [ 4 Bytes ][ 4 Bytes ][ 4 Bytes ][ 4 Bytes ] (Continuous C++ buffer)
```

### 2. Number Precision Boundaries in Cumulative Sums

In JavaScript, all numbers are 64-bit IEEE-754 double-precision floats:
- Integers up to **$2^{53} - 1$** (`9,007,199,254,740,991` or `Number.MAX_SAFE_INTEGER`) maintain exact integer precision.
- However, V8 represents numbers smaller than $2^{31} - 1$ as **Smis (Small Integers)** in CPU registers.
- When an accumulated prefix sum exceeds $2^{31} - 1$ ($\approx 2.14 \times 10^9$), V8 seamlessly boxes the value into a heap-allocated `HeapNumber`.
- If you accumulate sums that could exceed `Number.MAX_SAFE_INTEGER`, use `BigInt` (`0n`) to prevent silent precision loss!

### 3. Financial Ledgers and Double-Entry Invariants

In Node.js backend systems handling payment ledgers:
- Transactions represent credits (+) and debits (-).
- Prefix sum arrays form the mathematical foundation of **Audit Ledgers**:
  - Validating that an account balance never drops below zero ($P[i] \ge 0$ for all $i$).
  - Proving double-entry balance across accounts ($P[n] === 0$).

---

## 7. Hands-On Exercise: Financial Transaction Ledger Audit

### Scenario
You are developing a financial compliance audit service in Node.js. Given an array of customer transactions (deposits as positive integers, withdrawals as negative integers), the compliance team needs to know how many continuous transaction windows resulted in a **net change of exactly zero dollars** (indicating a neutral wash cycle). A previous contractor wrote a solution using nested loops, which freezes during batch audits of 50,000 transactions. You must rewrite it to run in $O(n)$ time.

### Buggy Code
```javascript
// Node.js code
function countZeroNetWindowsBuggy(transactions) {
  let zeroCount = 0;
  // ❌ PERFORMANCE BUG:
  // Nested loops test all pairs -> O(n^2) runtime
  for (let i = 0; i < transactions.length; i++) {
    let balance = 0;
    for (let j = i; j < transactions.length; j++) {
      balance += transactions[j];
      if (balance === 0) {
        zeroCount++;
      }
    }
  }
  return zeroCount;
}
```

### Acceptance Criteria
1. Must compute the count of zero-sum continuous windows in **$O(n)$ time**.
2. Must handle negative, zero, and positive transactions correctly.
3. Must use a **Prefix Sum + Hash Map** pattern.
4. Must process a ledger of $50,000$ transactions in under 10 milliseconds.

### Solution Code

```javascript
// ✅ CORRECT: Optimal O(n) time, O(n) space ledger compliance auditor
function countZeroNetWindows(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return 0;
  }

  // Map stores: balance (number) -> frequencyCount (number)
  const balanceCounts = new Map();

  // BASE CASE: Balance 0 occurred once before any transactions took place
  balanceCounts.set(0, 1);

  let currentBalance = 0;
  let zeroSumWindows = 0;

  for (let i = 0; i < transactions.length; i++) {
    currentBalance += transactions[i];

    // If currentBalance was seen earlier, the net change between then and now is 0!
    if (balanceCounts.has(currentBalance)) {
      zeroSumWindows += balanceCounts.get(currentBalance);
    }

    // Record current balance in the audit ledger map
    balanceCounts.set(currentBalance, (balanceCounts.get(currentBalance) || 0) + 1);
  }

  return zeroSumWindows;
}

// Example runs
console.log(countZeroNetWindows([100, -100, 50, -50])); // 3 ([100, -100], [50, -50], [100, -100, 50, -50])
console.log(countZeroNetWindows([50, -50, 0]));          // 4 ([50, -50], [0], [-50, 0, 50], [50, -50, 0])
console.log(countZeroNetWindows([10, 20, 30]));          // 0

// Benchmark test: 50,000 transactions
const testLedger = Array.from({ length: 50000 }, (_, i) => (i % 2 === 0 ? 50 : -50));
const start = Date.now();
const result = countZeroNetWindows(testLedger);
const elapsed = Date.now() - start;

console.log(`Audited 50,000 transactions in ${elapsed}ms! Found ${result} zero-net windows.`);
```

---

## 8. Tricky Points and Edge Cases

### 1. Forgetting the Base Case `map.set(0, 1)`
This is the **#1 bug** in Subarray Sum interview questions:
- If `nums = [3, 4]`, `k = 7`.
- `runningSum` at index 1 is $3 + 4 = 7$.
- Needed prefix: $7 - 7 = 0$.
- If `map.set(0, 1)` is missing, `map.has(0)` returns `false`, and the subarray `[3, 4]` is completely skipped!
- **Rule:** A prefix sum of 0 always exists **once** before processing the first element.

### 2. 1-Indexed Prefix Array Math
When using an $(n + 1)$ prefix array:
- Range from index $L$ to index $R$ (inclusive) is calculated as:
  $$\text{prefix}[R + 1] - \text{prefix}[L]$$
- Do not subtract $\text{prefix}[L - 1]$. That causes an out-of-bounds error when $L = 0$!

### 3. Zeros in the Input Array
If `nums` contains zeros (e.g., `[0, 0, 0]`, `k = 0`):
- Adding `0` does not change `runningSum`.
- Therefore, the same prefix sum repeats multiple times.
- The algorithm handles this naturally because the Map stores **frequencies**, correctly adding all previous matching instances!

---

## 9. Comprehensive Summary

- **Prefix Sum** precomputes cumulative totals in an $O(n)$ array, reducing any range query $(L \dots R)$ to an **$O(1)$ subtraction**: $P[R + 1] - P[L]$.
- **The $(n + 1)$ Array Standard:** Starting with `prefix[0] = 0` eliminates conditional branching for queries starting at index 0.
- **Overcoming Negative Numbers:** When array elements are negative, sliding window fails. Pairing **Prefix Sum with a Hash Map** solves subarray sum problems in linear $O(n)$ time.
- **The Core Ledger Equation:**
  $$\text{Current Prefix} - \text{Previous Prefix} = k \iff \text{Previous Prefix} = \text{Current Prefix} - k$$
- **V8 TypedArray Optimization:** Using `Int32Array` or `Float64Array` creates contiguous memory buffers, reducing RAM by 80% and eliminating garbage collector pauses.

---

## 10. Cheat Sheet

### Decision Table

| Problem Characteristics | Target Complexity | Preferred Technique |
| :--- | :---: | :--- |
| **Immutable Range Sum Queries** | Build: $O(n)$, Query: $O(1)$ | $(n + 1)$ Prefix Sum Array |
| **Subarray Sum Equals $k$ (Contains negative numbers)** | Time: $O(n)$, Space: $O(n)$ | Prefix Sum + Hash Map (with `map.set(0, 1)`) |
| **Subarray Sum Equals $k$ (All positive numbers)** | Time: $O(n)$, Space: $O(1)$ | Variable Sliding Window (Day 09) |
| **Find Pivot Index where Left Sum === Right Sum** | Time: $O(n)$, Space: $O(1)$ | Total sum minus left sum |
| **Contiguous Array with equal 0s and 1s** | Time: $O(n)$, Space: $O(n)$ | Treat 0 as -1; Prefix Sum + Hash Map |

### Common Pitfalls List
- **Missing `map.set(0, 1)`:** Fails to detect valid subarrays that start at index 0.
- **The Sliding Window Trap:** Attempting to use a sliding window on arrays with negative numbers.
- **Off-by-One in Range Formula:** Writing `prefix[R] - prefix[L]` instead of `prefix[R + 1] - prefix[L]`.
- **Heap Churn with Plain Objects:** Using `{}` instead of `new Map()`, causing string coercion and prototype property collisions.

### Reusable Prefix Sum + Map Skeleton

```javascript
function prefixSumMapTemplate(nums, target) {
  const prefixCounts = new Map();
  prefixCounts.set(0, 1); // Crucial base case

  let runningSum = 0;
  let matches = 0;

  for (let i = 0; i < nums.length; i++) {
    runningSum += nums[i];

    const complement = runningSum - target;
    if (prefixCounts.has(complement)) {
      matches += prefixCounts.get(complement);
    }

    prefixCounts.set(runningSum, (prefixCounts.get(runningSum) || 0) + 1);
  }

  return matches;
}
```

---

## 11. Interview Q&A

### 45-Second Technical Pitch
> *"The Prefix Sum pattern optimizes range queries and subarray sum problems by precomputing running cumulative totals in O(n) time. It converts range queries from linear scans into instant O(1) mathematical subtractions: P[R + 1] - P[L]. When paired with a Hash Map, it solves the classic 'Subarray Sum Equals K' problem in linear O(n) time even when arrays contain negative numbers, which breaks sliding window monotonicity. In Node.js backend systems, typed prefix arrays eliminate garbage collection churn and provide the foundational architecture for financial audit ledgers and real-time metric aggregators."*

---

### 1. Why does the presence of negative numbers make Sliding Window fail and require Prefix Sum + Hash Map?
**Answer:**
A Sliding Window relies on **monotonicity**: expanding the right pointer must strictly increase or maintain the window sum, and contracting the left pointer must strictly decrease it. When an array contains negative numbers, adding an element might decrease the total sum, while removing an element might increase it. Because the sum can move unpredictably in either direction, the sliding window cannot make greedy decisions about when to shrink or expand. Prefix Sum with a Hash Map avoids this issue entirely by evaluating mathematical differences between cumulative checkpoints ($P[j] - P[i] = k$), working identically regardless of whether numbers are positive, negative, or zero.

---

### 2. Why must we initialize the prefix frequency map with `map.set(0, 1)`?
**Answer:**
The Hash Map stores past prefix sums to answer: *"Has there been a previous checkpoint such that `currentSum - previousSum === k`?"*
If a valid subarray starts at index 0 and extends to index $i$, its sum is $nums[0] + ... + nums[i] = k$.
At index $i$, `runningSum` equals $k$. The algorithm checks for `needed = runningSum - k = k - k = 0`.
If the map does not contain `0`, it cannot match this subarray! The entry `map.set(0, 1)` represents the **empty prefix** before the array begins, ensuring that any subarray starting at index 0 is counted.

---

### 3. What will this code output, and what bug does it contain?
```javascript
function findPivotIndex(nums) {
  let totalSum = 0;
  for (const num of nums) totalSum += num;

  let leftSum = 0;
  for (let i = 0; i < nums.length; i++) {
    if (leftSum === totalSum - leftSum) {
      return i;
    }
    leftSum += nums[i];
  }
  return -1;
}
console.log(findPivotIndex([1, 7, 3, 6, 5, 6]));
```
**Answer:**
It outputs `-1` instead of `3`!
The bug is in the equation: `leftSum === totalSum - leftSum`.
The pivot element `nums[i]` itself belongs to **neither** the left sum nor the right sum!
The correct right sum is: $\text{rightSum} = \text{totalSum} - \text{leftSum} - nums[i]$.
The condition must be:
```javascript
if (leftSum === totalSum - leftSum - nums[i]) {
  return i;
}
```
At index 3 (`val = 6`), $\text{leftSum} = 1 + 7 + 3 = 11$, and $\text{rightSum} = 28 - 11 - 6 = 11$. Correct pivot index is `3`.

---

### 4. How can Prefix Sum arrays be used to solve "Product of Array Except Self" in $O(n)$ time without division?
**Answer:**
We construct two arrays:
1. **Prefix Products:** `leftProducts[i]` stores the product of all elements to the left of index $i$.
2. **Suffix Products:** `rightProducts[i]` stores the product of all elements to the right of index $i$.
For any index $i$, the product of all elements except `nums[i]` is simply:
$$\text{result}[i] = leftProducts[i] \times rightProducts[i]$$
By computing prefix products in a forward pass ($O(n)$) and suffix products in a backward pass ($O(n)$), we achieve $O(n)$ runtime and $O(1)$ auxiliary space (by writing directly into the output array) without ever using the division operator.

---

## 12. Practice Problems

### 1. Find Pivot Index - Easy
Given an array of integers `nums`, calculate the **pivot index** of this array. The pivot index is the index where the sum of all the numbers strictly to the left of the index is equal to the sum of all the numbers strictly to the index's right. Return the leftmost pivot index. If no such index exists, return `-1`.
- **Sample Input 1:** `nums = [1, 7, 3, 6, 5, 6]`
- **Expected Output 1:** `3` (Left sum: $1+7+3=11$, Right sum: $5+6=11$)
- **Sample Input 2:** `nums = [1, 2, 3]`
- **Expected Output 2:** `-1`
- **Sample Input 3:** `nums = [2, 1, -1]`
- **Expected Output 3:** `0` (Left sum: 0, Right sum: $1+(-1)=0$)

### 2. Product of Array Except Self - Medium
Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`. You must write an algorithm that runs in $O(n)$ time and without using the division operation.
- **Sample Input 1:** `nums = [1, 2, 3, 4]`
- **Expected Output 1:** `[24, 12, 8, 6]`
- **Sample Input 2:** `nums = [-1, 1, 0, -3, 3]`
- **Expected Output 2:** `[0, 0, 9, 0, 0]`
- **Sample Input 3:** `nums = [2, 3]`
- **Expected Output 3:** `[3, 2]`

### 3. Contiguous Array (Equal 0s and 1s) - Medium
Given a binary array `nums`, return the maximum length of a contiguous subarray with an equal number of `0` and `1`. (Hint: Treat 0 as -1 and use a prefix sum with a Hash Map storing the earliest index).
- **Sample Input 1:** `nums = [0, 1]`
- **Expected Output 1:** `2`
- **Sample Input 2:** `nums = [0, 1, 0]`
- **Expected Output 2:** `2` (Subarray `[0, 1]` or `[1, 0]`)
- **Sample Input 3:** `nums = [0, 0, 0, 1, 1, 1]`
- **Expected Output 3:** `6`

---

<nav aria-label="Lecture navigation">

[Previous: Sliding Window: Variable Size](day-09-sliding-window-variable-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Singly & Doubly Linked Lists](day-11-singly-and-doubly-linked-lists.md)

</nav>
