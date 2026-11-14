# Day 10: Prefix Sum & Subarray Totals

<nav aria-label="Lecture navigation">

[Previous: Variable Sliding Window](day-09-sliding-window-variable-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Singly & Doubly Linked Lists](day-11-singly-and-doubly-linked-lists.md)

</nav>

---

## 1. Prefix Sum

A **prefix sum** is a list of running totals. Each total adds all the values before its position.

Build the list once. Then get the sum from index `L` to index `R` with one subtraction:

`range sum = prefix[R + 1] - prefix[L]`

Think of an odometer that shows total miles so far. To find miles driven between two readings, subtract the earlier reading from the later one. Prefix sums use the same idea.

```text
Original Array:         [   2,    1,    5,    3   ]  (length n = 4)
Indices:                    0     1     2     3

Prefix Array (n + 1):   [ 0,  2,    3,    8,   11   ]  (length 5)
Prefix Indices:           0   1     2     3    4

Query: Range from L = 1 to R = 3 (values: 1 + 5 + 3 = 9)
Formula: prefix[R + 1] - prefix[L]
Calculation: prefix[4] - prefix[1] = 11 - 2 = 9  -> One subtraction
```

```javascript
"use strict";

// Build running totals, then answer range sum queries.
function buildPrefixSum(arr) {
  if (!Array.isArray(arr)) return [0];

  const n = arr.length;
  // The first total is 0, before any values are added.
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

### 1.1 Why the Prefix Array Has One Extra Slot

For `n` input values, make a prefix array with `n + 1` slots. Start with `prefix[0] = 0`.

`prefix[i]` is the sum of the values before index `i`.

For `[2, 1, 5, 3]`, the prefix array is `[0, 2, 3, 8, 11]`. The extra first slot means every range uses the same formula, even when it starts at index `0`.

> [!NOTE]
> If `n = 100,000` and there are `q = 100,000` range questions, which method does less work: add each range again, or build prefix sums once?
>
> *Answer:* Building prefix sums takes about `n` steps, then each question takes one subtraction. Adding every range again can take about `n * q` steps.

---

### 1.2 Find Earlier Totals for a Target Sum

**Subarray** means a group of neighboring values. With negative numbers, a sliding window cannot reliably find a subarray that adds up to `k`: adding or removing a value may raise or lower the sum.

Use running totals and a Map. The key idea is:

`earlier total = current total - k`

Start the Map with `map.set(0, 1)`. It represents the total before reading any values. This lets the count include groups that start at index `0`.

For each value:
1. Add it to `currentPrefix`.
2. Check whether `currentPrefix - k` is in the Map. Each match marks a group that sums to `k`.
3. Add the number of matches to the answer.
4. Store the current total in the Map.

---

### 1.3 Operations Reference Table

| Operation | What it does | Time | Extra space | Example |
| :--- | :--- | :---: | :---: | :--- |
| Build prefix list | Save each running total | `O(n)` | `O(n)` | `prefix[i + 1] = prefix[i] + arr[i]` |
| Get range sum | Subtract two saved totals | `O(1)` | `O(1)` | `prefix[R + 1] - prefix[L]` |
| Find a matching total | Check whether `currentPrefix - k` was seen | `O(1)` average | `O(n)` worst case | `map.has(currentPrefix - k)` |
| Check a balance point | Compare left and right totals | `O(1)` | `O(1)` | `leftSum === totalSum - leftSum - arr[i]` |
| Fix a negative remainder | Make a remainder fall between 0 and `k - 1` | `O(1)` | `O(1)` | `((sum % k) + k) % k` |

---

## 2. Pattern Overview

### 2.1 Pattern Family
* **Range sums:** Save running totals so any range can be found with one subtraction.
* **Subarray sum and Map:** Count groups that add to `k`, even when values are negative.
* **Pivot index:** Find a position where the sum on the left equals the sum on the right.
* **2D prefix sums:** Use the same idea on a grid to get the sum inside a rectangle.

### 2.2 Pattern Recognition Table

| Problem words | What it asks | Method |
| :--- | :--- | :--- |
| **"Range sum" / "Many range sums"** | Find sums from an array that does not change. | Build a prefix list once. |
| **"Subarray sum equals K" with negative values** | Count groups that add to `K`. | Running total and a Map. |
| **"Find the pivot" / "Balance point"** | Find where the left and right sums match. | Get the total, then scan once. |
| **"Subarray sums divisible by K"** | Count groups whose sum is a multiple of `K`. | Count prefix remainders. |
| **"Equal number of 0s and 1s"** | Find the longest group with equal zeroes and ones. | Treat `0` as `-1`, then track running totals. |

### 2.3 When to Use vs When NOT to Use
* **Use it when:**
  * You need many range sums from an array that does not change.
  * You need to count groups that sum to a target and the array may have negative values.
  * You need to find a balance point.

* **Do not use it when:**
  * The array changes often. You would need to rebuild the prefix list after each change.
  * You only need the shortest or longest group and all values are positive. A variable window (Day 9) uses less extra space.
  * The chosen items do not need to be next to each other.

### 2.4 The 10^7 Operations Rule
For `n = 50,000` values and `q = 50,000` questions:
* Adding each range again can take about 2.5 billion steps.
* Building prefix sums takes about 50,000 steps. Each question then takes one subtraction.
* `10^7` steps is only a rough guide. Actual run time depends on the computer and the code.

---

## 3. Problem Walkthroughs

---

### 3.1 Range Sum Queries

#### 3.1.1 Problem Statement
Create a `NumArray` from `nums`. The array does not change. Its `sumRange(left, right)` method returns the sum from index `left` through index `right`. Both ends are included.

* **Input:**
  ```text
  const numArray = new NumArray([-2, 0, 3, -5, 2, -1]);
  numArray.sumRange(0, 2); // -> 1
  numArray.sumRange(2, 5); // -> -1
  numArray.sumRange(0, 5); // -> -3
  ```
* **Input limits:** 1 to 10,000 values. Each value is between -100,000 and 100,000. There can be up to 10,000 calls to `sumRange`.

#### 3.1.2 How to Think About It
For `nums = [-2, 0, 3, -5, 2, -1]`, the running totals are `prefix = [0, -2, -2, 1, -4, -2, -3]`.

To get the sum from index `2` through `5`, subtract the total before index `2` from the total after index `5`:

`prefix[6] - prefix[2] = -3 - (-2) = -1`

#### 3.1.3 Brute Force Approach & Bottleneck
Adding numbers in a loop on every `sumRange` call:

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

* **The slow part:** Adding each range for every query can take `O(q * n)` time, where `q` is the number of questions.

#### 3.1.4 The Pattern Insight
Build a prefix array with `n + 1` slots once. Each query then uses `prefix[right + 1] - prefix[left]`, which takes `O(1)` time.

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
// ✅ CORRECT: Builds totals once and answers each query with one subtraction.
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
// ❌ ANTI-PATTERN: Uses the wrong right index.
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
    // BUG: This leaves out the value at index right.
    return this.prefix[right] - this.prefix[left];
  }
}
```
* **Why it fails:** This formula skips the value at `left`. Use `prefix[right + 1] - prefix[left]` to include both ends.

#### 3.1.8 Complexity Derivation
* **Time:** The constructor takes `O(n)`. Each `sumRange` call takes `O(1)`.
* **Extra space:** `O(n)` for the saved prefix totals.

---

### 3.2 Subarray Sum Equals K

#### 3.2.1 Problem Statement
Given an integer array `nums` and a number `k`, count the groups of neighboring values that add up to `k`.

Values can be negative, zero, or positive.

* **Input:** `nums = [1, 1, 1]`, `k = 2` -> **Output:** `2`
* **Input:** `nums = [1, 2, 3]`, `k = 3` -> **Output:** `2`
* **Input:** `nums = [1, -1, 0]`, `k = 0` -> **Output:** `3`
* **Input limits:** 1 to 20,000 values, each between -1,000 and 1,000. `k` is between -10,000,000 and 10,000,000.

#### 3.2.2 How to Think About It
Use `nums = [1, -1, 1, 1, 1]` and `k = 2`. Keep a running total as you read.

- Before reading values, save total `0` once in the Map.
- After the first two values, the total is `0`. It has appeared before, so save its count.
- When the total reaches `2`, look for `2 - 2 = 0`. The Map says `0` appeared twice, so two groups ending here sum to `2`.
- Later, the total is `3`. Look for `3 - 2 = 1`. The Map says `1` appeared twice, so add two more groups.

The answer is `4`.

#### 3.2.3 Brute Force Approach & Bottleneck
Checking every pair of indices with nested loops:

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

* **The slow part:** Checking every possible group takes `O(n^2)` time. A sliding window cannot guide the search because negative values can raise or lower the sum.

#### 3.2.4 The Pattern Insight
Use a running total and a Map of earlier totals:
* For the current total, look for `currentPrefix - k`.
* Each time that total was seen before, one group ending here adds to `k`.
* Add the current total to the Map after checking.
* Start with `map.set(0, 1)` so groups that begin at index `0` are counted.

#### 3.2.5 Pseudocode

```text
FUNCTION SubarraySum(nums, k):
  map = Map()
  map.set(0, 1)

  currentPrefix = 0
  totalCount = 0

  FOR i FROM 0 TO length(nums) - 1:
    currentPrefix = currentPrefix + nums[i]
    neededTotal = currentPrefix - k

    IF map.has(neededTotal):
      totalCount = totalCount + map.get(neededTotal)

    map.set(currentPrefix, (map.get(currentPrefix) || 0) + 1)

  RETURN totalCount
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Counts earlier totals that would make the current group sum to k.
function subarraySum(nums, k) {
  if (!Array.isArray(nums) || nums.length === 0) return 0;

  const prefixMap = new Map();
  // Total 0 exists before the first value.
  prefixMap.set(0, 1);

  let currentPrefix = 0;
  let totalCount = 0;

  for (let i = 0; i < nums.length; i++) {
    currentPrefix += nums[i];
    const neededTotal = currentPrefix - k;

    if (prefixMap.has(neededTotal)) {
      totalCount += prefixMap.get(neededTotal);
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
* **Why it fails:** For `nums = [2]` and `k = 2`, the needed earlier total is `0`. Without the starting `0`, the function misses the group `[2]`.

#### 3.2.8 Complexity Derivation
* **Time:** `O(n)` on average. Read each value once, with an average `O(1)` Map lookup and update.
* **Extra space:** `O(n)` in the worst case for the saved totals.

---

### 3.3 Find Pivot Index

#### 3.3.1 Problem Statement
Given an integer array `nums`, find its leftmost pivot index.

At a pivot, the values to the left and right have the same sum. The pivot value is not part of either side. An empty side has sum `0`. Return `-1` if there is no pivot.

* **Input:** `nums = [1, 7, 3, 6, 5, 6]` -> **Output:** `3`
* **Input:** `nums = [1, 2, 3]` -> **Output:** `-1`
* **Input:** `nums = [2, 1, -1]` -> **Output:** `0`
* **Input limits:** 1 to 10,000 values, each between -1,000 and 1,000.

#### 3.3.2 How to Think About It
Imagine a scale with two sides.  
The total of `[1, 7, 3, 6, 5, 6]` is `28`. As you scan, keep the sum on the left.

At index `3`, the value is `6`. The left sum is `1 + 7 + 3 = 11`. The right sum is `5 + 6 = 11`. Both sides match, so return `3`.

#### 3.3.3 Brute Force Approach & Bottleneck
Adding the left and right sides again for every index can take `O(n^2)` time:

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

* **The slow part:** The same values are added many times.

#### 3.3.4 The Pattern Insight
First add all values to get `totalSum`. At each index:
* The right sum is `totalSum - leftSum - nums[i]`.
* If it equals `leftSum`, return the index.
* Otherwise, add `nums[i]` to `leftSum` and keep going.

This takes `O(n)` time and `O(1)` extra space.

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
// ✅ CORRECT: Finds the total once, then checks each index.
function pivotIndex(nums) {
  if (!Array.isArray(nums) || nums.length === 0) return -1;

  let totalSum = 0;
  for (let i = 0; i < nums.length; i++) {
    totalSum += nums[i];
  }

  let leftSum = 0;
  for (let i = 0; i < nums.length; i++) {
    // The pivot value is in neither side.
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
// ❌ ANTI-PATTERN: Saves both side sums in separate arrays.
function buggyPivotIndex(nums) {
  const n = nums.length;
  const leftPrefix = new Array(n).fill(0);
  const rightSuffix = new Array(n).fill(0);
  // These arrays use more extra space than the running-sum method.
  for (let i = 1; i < n; i++) leftPrefix[i] = leftPrefix[i - 1] + nums[i - 1];
  for (let i = n - 2; i >= 0; i--) rightSuffix[i] = rightSuffix[i + 1] + nums[i + 1];
  for (let i = 0; i < n; i++) {
    if (leftPrefix[i] === rightSuffix[i]) return i;
  }
  return -1;
}
```
* **Why it is a poor fit:** The two arrays use `O(n)` extra space. The total and left sum are enough.

#### 3.3.8 Complexity Derivation
* **Time:** `O(n)`. One pass finds the total. A second pass checks each index.
* **Extra space:** `O(1)`. The function stores only a few sums.

---

## 4. Tricky Edge Cases

* **Start the Map with zero:** `map.set(0, 1)` counts groups that start at index `0`.
* **Check before saving:** Look for `currentPrefix - k` before adding the current total to the Map. This avoids counting an empty group when `k` is `0`.
* **Negative remainder:** In JavaScript, `-7 % 5` is `-2`. Use `((sum % k) + k) % k` to get a remainder from `0` to `k - 1`.
* **More than one pivot:** Return the first match to get the leftmost index.

---

## 5. Summary Cheat Sheet

* **Range sum:** `prefix[right + 1] - prefix[left]`.
* **Prefix array:** Use `n + 1` slots and start with `prefix[0] = 0`.
* **Count groups that sum to `k`:** Check whether `currentPrefix - k` is in the Map.
* **Pivot index:** Compare `leftSum` with `totalSum - leftSum - nums[i]`.

---

## 6. Practice Problems

### 6.1 Running Sum of 1D Array

Given an array `nums`, return an array where each value is the sum of all values up to that position.

* **Difficulty:** Easy | **Focus:** Cumulative In-Place Scan
* **Input:** `nums = [1, 2, 3, 4]` -> **Output:** `[1, 3, 6, 10]`
* **Input:** `nums = [1, 1, 1, 1, 1]` -> **Output:** `[1, 2, 3, 4, 5]`
* **Input limits:** 1 to 1,000 values. Each value is between -1,000,000 and 1,000,000.
* **Hint 1:** Can you update `nums` instead of making another array?
* **Hint 2:** Start at index `1`. Add the previous running total to each value.

---

### 6.2 Contiguous Array

Given an array of `0`s and `1`s, find the longest group of neighboring values with the same number of `0`s and `1`s.

* **Difficulty:** Medium | **Focus:** Transformed Balance Offset
* **Input:** `nums = [0, 1]` -> **Output:** `2`
* **Input:** `nums = [0, 1, 0]` -> **Output:** `2`
* **Input:** `nums = [0, 0, 1, 0, 0, 0, 1, 1]` -> **Output:** `6`
* **Input limits:** 1 to 100,000 values. Each value is 0 or 1.
* **Hint 1:** Count each `0` as `-1`. Now a group with equal zeroes and ones sums to `0`.
* **Hint 2:** Save the first index where each running sum appears. Start with `map.set(0, -1)`.
* **Hint 3:** When a running sum repeats, the values between its first and current index sum to `0`. Keep the first index to get the longest group.

---

### 6.3 Subarray Sums Divisible by K

Given an integer array `nums` and a number `k`, count the non-empty groups whose sum is divisible by `k`.

* **Difficulty:** Medium | **Focus:** Modulo Remainder Frequencies
* **Input:** `nums = [4, 5, 0, -2, -3, 1]`, `k = 5` -> **Output:** `7`
* **Input:** `nums = [5]`, `k = 9` -> **Output:** `0`
* **Input limits:** 1 to 30,000 values. `k` is between 2 and 10,000.
* **Hint 1:** If two running totals leave the same remainder after division by `k`, the values between them add to a multiple of `k`.
* **Hint 2:** JavaScript can give a negative remainder. Use `((sum % k) + k) % k`.
* **Hint 3:** Count how often each remainder appears. Start with `remainderCounts[0] = 1`.

---

<nav aria-label="Lecture navigation">

[Previous: Variable Sliding Window](day-09-sliding-window-variable-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Singly & Doubly Linked Lists](day-11-singly-and-doubly-linked-lists.md)

</nav>
