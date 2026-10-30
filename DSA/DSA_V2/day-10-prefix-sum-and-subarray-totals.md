# Day 10: Prefix Sum & Subarray Totals

<nav aria-label="Lecture navigation">

[Previous: Variable Sliding Window](day-09-sliding-window-variable-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Singly & Doubly Linked Lists](day-11-singly-and-doubly-linked-lists.md)

</nav>

---

## 1. Prefix Sum

A **Prefix Sum** is an array of cumulative running totals where each element stores the aggregate sum of all values up to that position.

Instead of recalculating a range sum by iterating from index $L$ to $R$ on every query ($O(n)$ work per query), precomputing a prefix sum array allows any contiguous range sum to be answered in **$O(1)$ constant time** using subtraction:

$$\text{Range Sum}(L \dots R) = \text{prefix}[R + 1] - \text{prefix}[L]$$

To picture this physically, imagine taking a road trip across four cities and tracking the distance driven each day:
* Day 1: 50 miles
* Day 2: 70 miles
* Day 3: 40 miles
* Day 4: 100 miles

How does your car know the distance driven between the start of Day 2 and the end of Day 3?
* It **does not recount each mile marker** on the road.
* Your car has an **odometer** (a prefix sum) recording total cumulative miles:
  - Day 0 (Start): **0 miles**
  - After Day 1: **50 miles**
  - After Day 2: **120 miles**
  - After Day 3: **160 miles**
  - After Day 4: **260 miles**
* To find miles driven on Days 2 and 3, subtract the odometer reading before Day 2 from the odometer reading at the end of Day 3:
  $$160 - 50 = 110 \text{ miles} \quad (70 + 40 = 110)$$

```text
Original Array:         [   2,    1,    5,    3   ]  (length n = 4)
Indices:                    0     1     2     3

Prefix Array (n + 1):   [ 0,  2,    3,    8,   11   ]  (length 5)
Prefix Indices:           0   1     2     3    4

Query: Range Sum from L = 1 to R = 3 (values: 1 + 5 + 3 = 9)
Formula: prefix[R + 1] - prefix[L]
Calculation: prefix[4] - prefix[1] = 11 - 2 = 9  ──► O(1) Instant Lookup!
```

```javascript
// Node.js code
"use strict";

// Baseline Prefix Sum array construction and range query
function buildPrefixSum(arr) {
  if (!Array.isArray(arr)) return [0];

  const n = arr.length;
  // Allocate n + 1 elements with prefix[0] = 0
  const prefix = new Array(n + 1).fill(0);

  for (let i = 0; i < n; i++) {
    prefix[i + 1] = prefix[i] + arr[i];
  }

  return prefix;
}

function queryRangeSum(prefix, left, right) {
  return prefix[right + 1] - prefix[left];
}

const numbers = [2, 1, 5, 3];
const pSum = buildPrefixSum(numbers);
console.log(queryRangeSum(pSum, 1, 3)); // 9 (1 + 5 + 3)
console.log(queryRangeSum(pSum, 0, 2)); // 8 (2 + 1 + 5)
```

---

### 1.1 The $(n + 1)$ Prefix Array Contract

Always size the prefix array to **$n + 1$**, initializing `prefix[0] = 0`:

$$\text{prefix}[i] = \sum_{j=0}^{i-1} \text{arr}[j]$$

Why the leading zero is essential:
* `prefix[0] = 0` represents the empty prefix (the sum of 0 elements).
* Without `prefix[0] = 0`, querying a range that starts at index `0` ($L = 0$) would require a special conditional branch (`left === 0 ? prefix[right] : prefix[right] - prefix[left - 1]`).
* With the $n + 1$ convention, the single formula `prefix[right + 1] - prefix[left]` works uniformly for all valid ranges without branching.

> [!NOTE]
> **Self-Check:** If an array has $n = 100,000$ numbers and you must answer $q = 100,000$ range sum queries, what is the operation count of a prefix sum vs naive looping?  
> *Answer:* Naive looping takes $O(q \cdot n) = 10^{10}$ operations (freezing Node.js for over 15 seconds). Prefix sum precomputes in $O(n)$ steps and answers each query in $O(1)$ subtraction, executing $n + q = 200,000$ operations in under 3 milliseconds.

---

### 1.2 Prefix Complements for Subarray Totals

When searching for contiguous subarrays whose sum equals $k$ in an array containing negative numbers, sliding windows fail because monotonicity is broken.

Prefix sum converts the geometric window search into an exact algebraic lookup:

$$\text{Subarray Sum}(i \dots j) = \text{prefix}[j] - \text{prefix}[i] = k \iff \text{prefix}[i] = \text{prefix}[j] - k$$

As we iterate through the array:
1. Maintain running total `currentPrefix`.
2. Check if the complement `currentPrefix - k` was seen previously in a Hash Map.
3. If seen, add the recorded frequency of that complement to your valid subarray count.
4. Record `currentPrefix` into the Hash Map.
5. **Base Case:** Initialize `map.set(0, 1)` because a prefix sum of 0 occurs once before array iteration starts.

---

### 1.3 Operations Reference Table

| Operation | Role in Prefix Sum | Time Complexity | Auxiliary Space | Code Example |
| :--- | :--- | :---: | :---: | :--- |
| **Prefix Construction** | Builds cumulative $(n + 1)$ array | $O(n)$ | $O(n)$ | `prefix[i + 1] = prefix[i] + arr[i]` |
| **Range Sum Query** | Computes sum of $[L \dots R]$ in constant time | $O(1)$ | $O(1)$ | `prefix[R + 1] - prefix[L]` |
| **Complement Lookup** | Checks if `runningSum - k` exists in map | $O(1)$ | $O(1)$ | `map.get(runningSum - k)` |
| **Pivot Equilibrium Test**| Checks if `leftSum === totalSum - leftSum - arr[i]` | $O(1)$ | $O(1)$ | `if (left === total - left - arr[i])` |
| **Prefix Modulo Update** | Normalizes remainder into hash map | $O(1)$ | $O(1)$ | `rem = ((prefix % k) + k) % k` |

---

## 2. Pattern Overview

### 2.1 Pattern Family
* **1D Static Range Sum:** Array precomputation with formula `prefix[R + 1] - prefix[L]`.
* **Prefix Sum + Hash Map (Complement Lookup):** Counting or finding subarrays summing to $k$ with negative, zero, and positive numbers.
* **Running Equilibrium (Pivot Index):** Balancing left prefix sum with right suffix sum in a single pass.
* **2D Matrix Prefix Sum:** Precomputing subgrid sums to answer rectangular range queries in $O(1)$.

### 2.2 Pattern Recognition Table

| Problem Keyword | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| **"Range sum query" / "Multiple subarray sums"** | Answer $O(1)$ sum queries on immutable array. | $(n + 1)$ Prefix Sum Array. |
| **"Subarray sum equals K" (with negative numbers)** | Count contiguous ranges totaling $K$. | Running Prefix Sum + Hash Map. |
| **"Find pivot / equilibrium index"** | Find index where left sum equals right sum. | Total sum precomputation + single sweep. |
| **"Subarray sums divisible by K"** | Count subarrays where sum is multiple of $K$. | Prefix Sum Modulo Hash Map. |
| **"Equal number of 0s and 1s"** | Longest balanced binary subarray. | Replace 0 with -1 + Prefix Map. |

### 2.3 When to Use vs When NOT to Use
* **When to Use**:
* Multiple range sum queries are requested on an array that does not mutate frequently.
* Subarray sum problems involve **negative numbers** (where sliding window monotonicity fails).
* You need to find equilibrium indices where left and right halves balance.

* **When NOT to Use**:
* The array experiences frequent element updates (prefix sum requires $O(n)$ rebuild per update; use a **Segment Tree** or **Fenwick Tree**).
* You only need the shortest/longest subarray with non-negative numbers (use **Variable Sliding Window**, Day 09, for $O(1)$ space).
* Non-contiguous subsequences are requested (use **Dynamic Programming**).

### 2.4 The 10^7 Operations Rule
If $n = 50,000$ and $q = 50,000$ queries:
* Naive looping per query executes $n \times q = 2.5 \times 10^9$ operations $\to$ **Timeout error**.
* Prefix sum builds once in $50,000$ operations and answers $50,000$ queries in $O(1)$ each, finishing in **under 3 milliseconds**.

---

## 3. Problem Walkthroughs

---

### 3.1 Range Sum Query - Immutable

#### 3.1.1 Problem Statement
Given an integer array `nums`, handle multiple queries of the following type:
Calculate the sum of the elements of `nums` between indices `left` and `right` inclusive where `left <= right`.

Implement the `NumArray` class:
* `NumArray(int[] nums)` Initializes the object with the integer array `nums`.
* `int sumRange(int left, int right)` Returns the sum of the elements of `nums` between indices `left` and `right` inclusive.

* **Sample Input:**
  ```javascript
  const numArray = new NumArray([-2, 0, 3, -5, 2, -1]);
  numArray.sumRange(0, 2); // -> 1
  numArray.sumRange(2, 5); // -> -1
  numArray.sumRange(0, 5); // -> -3
  ```
* **Constraints:** $1 \le nums.length \le 10^4$, $-10^5 \le nums[i] \le 10^5$, $0 \le left \le right < nums.length$, at most $10^4$ calls to `sumRange`.

#### 3.1.2 How to Think About It
Cards on a table: `[ -2, 0, 3, -5, 2, -1 ]`.
If a user asks for sums of different sections 10,000 times, adding the numbers on each query wastes time.
Precompute an odometer ledger:
* At index 0: `0`
* After item 0: `0 + (-2) = -2`
* After item 1: `-2 + 0 = -2`
* After item 2: `-2 + 3 = 1`
* After item 3: `1 + (-5) = -4`
* After item 4: `-4 + 2 = -2`
* After item 5: `-2 + (-1) = -3`

`prefix = [ 0, -2, -2, 1, -4, -2, -3 ]`.
To query range `[2, 5]`: subtract reading before index 2 (`prefix[2] = -2`) from reading after index 5 (`prefix[6] = -3`):
$$-3 - (-2) = -1$$
Instant answer with a single subtraction!

#### 3.1.3 Brute Force Approach & Bottleneck
Iterating over the range on every `sumRange` call:

```javascript
class NumArrayBrute {
  constructor(nums) { this.nums = nums; }
  sumRange(left, right) {
    let sum = 0;
    for (let i = left; i <= right; i++) sum += this.nums[i];
    return sum;
  }
}
```

* **The Bottleneck:** Each query takes $O(n)$ time. For $q$ queries, total time is $O(q \cdot n)$ ($10^8$ operations for $10^4 \times 10^4$), causing latency spikes in APIs.

#### 3.1.4 The Pattern Insight
Precompute an array of size $n + 1$ in the constructor ($O(n)$ work once).
Every subsequent query computes `prefix[right + 1] - prefix[left]` in **$O(1)$ constant time**.

#### 3.1.5 Pseudocode

```text
CLASS NumArray:
  CONSTRUCTOR(nums):
    n = length(nums)
    prefix = Array of size n + 1 with zeroes
    FOR i FROM 0 TO n - 1:
      prefix[i + 1] = prefix[i] + nums[i]

  METHOD sumRange(left, right):
    RETURN prefix[right + 1] - prefix[left]
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) build, O(1) query time using (n + 1) prefix array
class NumArray {
  constructor(nums) {
    const n = Array.isArray(nums) ? nums.length : 0;
    this.prefix = new Array(n + 1).fill(0);

    for (let i = 0; i < n; i++) {
      this.prefix[i + 1] = this.prefix[i] + nums[i];
    }
  }

  sumRange(left, right) {
    return this.prefix[right + 1] - this.prefix[left];
  }
}

// Example runs
const numArray = new NumArray([-2, 0, 3, -5, 2, -1]);
console.log(numArray.sumRange(0, 2)); // 1
console.log(numArray.sumRange(2, 5)); // -1
console.log(numArray.sumRange(0, 5)); // -3
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: 0-indexed prefix array requiring ternary branch
class BuggyNumArray {
  constructor(nums) {
    this.prefix = [];
    let sum = 0;
    for (const n of nums) {
      sum += n;
      this.prefix.push(sum);
    }
  }
  sumRange(left, right) {
    // BUG-PRONE: Branch instruction required on every call; prone to off-by-one errors
    return left === 0 ? this.prefix[right] : this.prefix[right] - this.prefix[left - 1];
  }
}
```
* **Why it fails:** 0-indexed prefix arrays require conditional branching (`left === 0`) on every single query and introduce negative index bugs if `left - 1` is accessed without guards.

#### 3.1.8 Complexity Derivation
* **Time Complexity:**
  - `constructor`: $\mathbf{O(n)}$ linear precomputation.
  - `sumRange`: $\mathbf{O(1)}$ constant time per query.
* **Auxiliary Space Complexity:** $\mathbf{O(n)}$ to store the prefix array of size $n + 1$.

---

### 3.2 Subarray Sum Equals K

#### 3.2.1 Problem Statement
Given an array of integers `nums` and an integer `k`, return the total number of subarrays whose sum equals to `k`.
A subarray is a contiguous non-empty sequence of elements within an array. **Note that elements may be negative, zero, or positive.**

* **Sample Input 1:** `nums = [1, 1, 1]`, `k = 2` $\to$ **Expected Output:** `2`  
  *(Subarrays: `[1, 1]` at indices 0..1 and 1..2)*
* **Sample Input 2:** `nums = [1, 2, 3]`, `k = 3` $\to$ **Expected Output:** `2`  
  *(Subarrays: `[1, 2]` and `[3]`)*
* **Sample Input 3:** `nums = [1, -1, 0]`, `k = 0` $\to$ **Expected Output:** `3`  
  *(Subarrays: `[1, -1]`, `[0]`, `[1, -1, 0]`)*
* **Constraints:** $1 \le nums.length \le 2 \times 10^4$, $-1000 \le nums[i] \le 1000$, $-10^7 \le k \le 10^7$.

#### 3.2.2 How to Think About It
Imagine a ledger tracking a bank balance: `nums = [1, -1, 1, 1, 1]`, `k = 2`.
Before we start, our balance is 0 (seen 1 time).
* Step 0 (deposit 1): balance = 1. We want balance $1 - 2 = -1$. Seen before? No. Record balance `1`.
* Step 1 (withdraw 1): balance = 0. We want balance $0 - 2 = -2$. Seen? No. Record balance `0`.
* Step 2 (deposit 1): balance = 1. We want balance $1 - 2 = -1$. Seen? No. Record balance `1`.
* Step 3 (deposit 1): balance = 2. We want balance $2 - 2 = 0$. Seen? Yes! Balance 0 was seen twice previously! Add 2 to our answer.
* Step 4 (deposit 1): balance = 3. We want balance $3 - 2 = 1$. Seen? Yes! Balance 1 was seen twice! Add 2 to answer.
Total valid subarrays: $2 + 2 = 4$.

#### 3.2.3 Brute Force Approach & Bottleneck
Evaluating all pairs with nested loops:

```javascript
function subarraySumBrute(nums, k) {
  let count = 0;
  for (let start = 0; start < nums.length; start++) {
    let sum = 0;
    for (let end = start; end < nums.length; end++) {
      sum += nums[end];
      if (sum === k) count++;
    }
  }
  return count;
}
```

* **The Bottleneck:** Quadratic $O(n^2)$ time. For $20,000$ elements, this runs $4 \times 10^8$ operations, causing TLE. Sliding window cannot be used because negative numbers break monotonicity.

#### 3.2.4 The Pattern Insight
Use **Prefix Sum + Hash Map (Complement Lookup)**:
* Formula: $\text{prefix}[j] - \text{prefix}[i] = k \implies \text{prefix}[i] = \text{prefix}[j] - k$.
* Maintain a running prefix sum.
* If `prefixSum - k` exists in our `Map`, add its frequency count to our total.
* Record the current `prefixSum` into the map.
* **Base Case:** Initialize `map.set(0, 1)` so subarrays starting at index 0 are counted.

#### 3.2.5 Pseudocode

```text
FUNCTION SubarraySum(nums, k):
  map = Map()
  map.set(0, 1)

  currentPrefix = 0
  totalCount = 0

  FOR i FROM 0 TO length(nums) - 1:
    currentPrefix = currentPrefix + nums[i]
    complement = currentPrefix - k

    IF map.has(complement):
      totalCount = totalCount + map.get(complement)

    map.set(currentPrefix, (map.get(currentPrefix) || 0) + 1)

  RETURN totalCount
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(n) space prefix sum + hash complement
function subarraySum(nums, k) {
  if (!Array.isArray(nums) || nums.length === 0) return 0;

  const prefixMap = new Map();
  // Base case: prefix sum of 0 occurs once before array starts
  prefixMap.set(0, 1);

  let currentPrefix = 0;
  let totalCount = 0;

  for (let i = 0; i < nums.length; i++) {
    currentPrefix += nums[i];
    const complement = currentPrefix - k;

    if (prefixMap.has(complement)) {
      totalCount += prefixMap.get(complement);
    }

    prefixMap.set(currentPrefix, (prefixMap.get(currentPrefix) || 0) + 1);
  }

  return totalCount;
}

// Example runs
console.log(subarraySum([1, 1, 1], 2));       // 2
console.log(subarraySum([1, 2, 3], 3));       // 2
console.log(subarraySum([1, -1, 0], 0));      // 3
console.log(subarraySum([3, 4, 7, 2, -3, 1, 4, 2], 7)); // 4
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Forgetting map.set(0, 1) base case
function buggySubarraySum(nums, k) {
  const map = new Map();
  // BUG: Missing map.set(0, 1)! Subarrays starting at index 0 will be completely missed!
  let current = 0, count = 0;
  for (let i = 0; i < nums.length; i++) {
    current += nums[i];
    if (map.has(current - k)) count += map.get(current - k);
    map.set(current, (map.get(current) || 0) + 1);
  }
  return count;
}
```
* **Why it fails:** For `nums = [2], k = 2`, `current = 2`. Complement is $2 - 2 = 0$. Because `0` was never seeded into the map, the function returns `0` instead of `1`.

#### 3.2.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. Single pass across $n$ items. Each Map `.get()` and `.set()` runs in $O(1)$ amortized time.
* **Auxiliary Space Complexity:** $\mathbf{O(n)}$ to store at most $n + 1$ prefix totals in the Map.

---

### 3.3 Find Pivot Index

#### 3.3.1 Problem Statement
Given an array of integers `nums`, calculate the **pivot index** of this array.
The pivot index is the index where the sum of all the numbers strictly to the left of the index is equal to the sum of all the numbers strictly to the index's right.
If the index is on the left edge, the left sum is 0 (likewise for right edge). Return the **leftmost** pivot index, or `-1` if no such index exists.

* **Sample Input 1:** `nums = [1, 7, 3, 6, 5, 6]` $\to$ **Expected Output:** `3`  
  *(Left sum = $1 + 7 + 3 = 11$, Right sum = $5 + 6 = 11$)*
* **Sample Input 2:** `nums = [1, 2, 3]` $\to$ **Expected Output:** `-1`
* **Sample Input 3:** `nums = [2, 1, -1]` $\to$ **Expected Output:** `0`  
  *(Left sum = $0$, Right sum = $1 + (-1) = 0$)*
* **Constraints:** $1 \le nums.length \le 10^4$, $-1000 \le nums[i] \le 1000$.

#### 3.3.2 How to Think About It
Imagine a balance scale.
First, weigh all the weights together: `1 + 7 + 3 + 6 + 5 + 6 = 28` (`totalSum = 28`).
Now walk from left to right, maintaining `leftSum`:
* At index 0 (`value 1`): left sum is 0. Right sum is $28 - 0 - 1 = 27$. Not balanced ($0 \ne 27$). Add 1 to `leftSum` (`leftSum = 1`).
* At index 1 (`value 7`): left sum is 1. Right sum is $28 - 1 - 7 = 20$. Not balanced ($1 \ne 20$). Add 7 (`leftSum = 8`).
* At index 2 (`value 3`): left sum is 8. Right sum is $28 - 8 - 3 = 17$. Not balanced ($8 \ne 17$). Add 3 (`leftSum = 11`).
* At index 3 (`value 6`): left sum is 11. Right sum is $28 - 11 - 6 = 11$. Balanced! ($11 === 11$). Return index `3`.

#### 3.3.3 Brute Force Approach & Bottleneck
Recalculating left sum and right sum from scratch for every index takes $O(n^2)$ time:

```javascript
function pivotIndexBrute(nums) {
  for (let i = 0; i < nums.length; i++) {
    let left = 0, right = 0;
    for (let j = 0; j < i; j++) left += nums[j];
    for (let j = i + 1; j < nums.length; j++) right += nums[j];
    if (left === right) return i;
  }
  return -1;
}
```

* **The Bottleneck:** Recalculates overlapping subarrays repeatedly ($O(n^2)$).

#### 3.3.4 The Pattern Insight
At any index $i$, if `leftSum` is known:
$$\text{rightSum} = \text{totalSum} - \text{leftSum} - \text{nums}[i]$$
1. Compute `totalSum` in one linear pass ($O(n)$).
2. Walk through `nums`: check if `leftSum === totalSum - leftSum - nums[i]`.
3. If true, return $i$ immediately.
4. Otherwise, increment `leftSum += nums[i]`.
Runs in $O(n)$ time using **$O(1)$ auxiliary space**!

#### 3.3.5 Pseudocode

```text
FUNCTION PivotIndex(nums):
  totalSum = SUM(nums)
  leftSum = 0

  FOR i FROM 0 TO length(nums) - 1:
    IF leftSum == totalSum - leftSum - nums[i]:
      RETURN i
    leftSum = leftSum + nums[i]

  RETURN -1
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(1) space single-pass balance check
function pivotIndex(nums) {
  if (!Array.isArray(nums) || nums.length === 0) return -1;

  let totalSum = 0;
  for (let i = 0; i < nums.length; i++) {
    totalSum += nums[i];
  }

  let leftSum = 0;
  for (let i = 0; i < nums.length; i++) {
    // rightSum is: totalSum - leftSum - nums[i]
    if (leftSum === totalSum - leftSum - nums[i]) {
      return i;
    }
    leftSum += nums[i];
  }

  return -1;
}

// Example runs
console.log(pivotIndex([1, 7, 3, 6, 5, 6])); // 3
console.log(pivotIndex([1, 2, 3]));          // -1
console.log(pivotIndex([2, 1, -1]));         // 0
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Building two separate prefix and suffix arrays
function buggyPivotIndex(nums) {
  const n = nums.length;
  const leftPrefix = new Array(n).fill(0);
  const rightSuffix = new Array(n).fill(0);
  // SUB-OPTIMAL: Allocates two auxiliary arrays (O(n) heap memory) when O(1) space suffices!
  for (let i = 1; i < n; i++) leftPrefix[i] = leftPrefix[i - 1] + nums[i - 1];
  for (let i = n - 2; i >= 0; i--) rightSuffix[i] = rightSuffix[i + 1] + nums[i + 1];
  for (let i = 0; i < n; i++) {
    if (leftPrefix[i] === rightSuffix[i]) return i;
  }
  return -1;
}
```
* **Why it fails:** Allocating two separate $O(n)$ arrays wastes heap memory and triggers garbage collection churn when the right sum can be derived in $O(1)$ space using scalar math.

#### 3.3.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. Pass 1 sums the array ($n$ steps). Pass 2 checks equilibrium ($n$ steps). Total: $2n \implies O(n)$.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. Strictly scalar integer variables stored in CPU registers.

---

## 4. Tricky Edge Cases

* **`map.set(0, 1)` Base Case:** In Subarray Sum Equals K, forgetting to seed `0: 1` into the map fails any subarray starting at index 0.
* **Complement Check Before Insertion:** Always check `map.has(currentPrefix - k)` *before* recording `currentPrefix` into the map. If $k = 0$, inserting first causes single elements to match with themselves as empty subarrays.
* **Negative Numbers in Prefix Modulo:** In JavaScript, `-7 % 5` evaluates to `-2` (not `3`). Always normalize remainders using `((sum % k) + k) % k`.
* **Arrays with Multiple Pivot Indices:** The problem asks for the leftmost pivot index. Return immediately on the first match during the forward loop.

---

## 5. Summary Cheat Sheet

* **Prefix Sum Formula:** $\text{prefix}[right + 1] - \text{prefix}[left]$ answers range sum in $O(1)$ time.
* **Size $(n + 1)$ Rule:** Always size prefix arrays to $n + 1$ with `prefix[0] = 0` to avoid ternary branching on index 0.
* **Complement Hash Lookup:** Solves subarray sums with negative numbers in $O(n)$ time: check `map.has(currentPrefix - k)`.
* **Pivot Index Equilibrium:** `leftSum === totalSum - leftSum - nums[i]` solves the balance point in $O(n)$ time and $O(1)$ auxiliary space.

---

## 6. Practice Problems

### 6.1 Running Sum of 1D Array

Given an array `nums`. We define a running sum of an array as `runningSum[i] = sum(nums[0]…nums[i])`. Return the running sum of `nums`.

* **Difficulty:** Easy | **Focus:** Cumulative In-Place Scan
* **Sample Input 1:** `nums = [1, 2, 3, 4]` $\to$ **Expected Output:** `[1, 3, 6, 10]`
* **Sample Input 2:** `nums = [1, 1, 1, 1, 1]` $\to$ **Expected Output:** `[1, 2, 3, 4, 5]`
* **Constraints:** $1 \le nums.length \le 1000$, $-10^6 \le nums[i] \le 10^6$.
* **Hint 1:** Can you update `nums` in-place without creating a second array?
* **Hint 2:** Start loop at index 1: `nums[i] += nums[i - 1]`.

---

### 6.2 Contiguous Array

Given a binary array `nums`, return the maximum length of a contiguous subarray with an equal number of `0` and `1`.

* **Difficulty:** Medium | **Focus:** Transformed Balance Offset
* **Sample Input 1:** `nums = [0, 1]` $\to$ **Expected Output:** `2`
* **Sample Input 2:** `nums = [0, 1, 0]` $\to$ **Expected Output:** `2`
* **Sample Input 3:** `nums = [0, 0, 1, 0, 0, 0, 1, 1]` $\to$ **Expected Output:** `6`
* **Constraints:** $1 \le nums.length \le 10^5$, `nums[i]` is either `0` or `1`.
* **Hint 1:** Replace every `0` with `-1`. Finding equal 0s and 1s becomes finding a subarray summing to 0!
* **Hint 2:** Store the *first seen index* of each prefix sum in a `Map`. Initialize `map.set(0, -1)`.
* **Hint 3:** If `map.has(prefixSum)`, update `maxLen = Math.max(maxLen, i - map.get(prefixSum))`. Do not overwrite earlier indices to preserve maximal length.

---

### 6.3 Subarray Sums Divisible by K

Given an integer array `nums` and an integer `k`, return the number of non-empty subarrays that have a sum divisible by `k`.

* **Difficulty:** Medium | **Focus:** Modulo Remainder Frequencies
* **Sample Input 1:** `nums = [4, 5, 0, -2, -3, 1]`, `k = 5` $\to$ **Expected Output:** `7`
* **Sample Input 2:** `nums = [5]`, `k = 9` $\to$ **Expected Output:** `0`
* **Constraints:** $1 \le nums.length \le 3 \times 10^4$, $2 \le k \le 10^4$.
* **Hint 1:** In modular arithmetic, $(P[j] - P[i]) \pmod k === 0 \iff P[j] \pmod k === P[i] \pmod k$.
* **Hint 2:** Normalize JavaScript negative remainders: `((sum % k) + k) % k`.
* **Hint 3:** Count remainder frequencies using a $k$-slot array initialized with `remainderCounts[0] = 1`.

---

<nav aria-label="Lecture navigation">

[Previous: Variable Sliding Window](day-09-sliding-window-variable-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Singly & Doubly Linked Lists](day-11-singly-and-doubly-linked-lists.md)

</nav>
