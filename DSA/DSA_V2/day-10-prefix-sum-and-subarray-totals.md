# Day 10: Prefix Sum & Subarray Totals

<nav aria-label="Lecture navigation">

[Previous: Sliding Window: Variable Size](day-09-sliding-window-variable-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Singly & Doubly Linked Lists](day-11-singly-and-doubly-linked-lists.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Precomputing $O(n)$ to get $O(1)$ queries.
- [Day 04: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md) — Hash Map lookups.

---

## 1. What is a Prefix Sum?

A **Prefix Sum** array stores the running cumulative sum of elements from index 0 up to index $i$.

> **Prefix Sum Formula**:
> $\text{prefix}[0] = 0$
> $\text{prefix}[i + 1] = \text{prefix}[i] + \text{nums}[i]$

```text
Original: [ 2,  1,  5,  3 ]
Prefix:   [ 0,  2,  3,  8, 11 ]
```

### Why Use It?
If someone asks you for the sum between index $L$ and index $R$, a loop takes $O(n)$ time. With a prefix sum, you get the answer instantly in **$O(1)$ time**:
$$\text{Sum}(L \dots R) = \text{prefix}[R + 1] - \text{prefix}[L]$$

For example, sum from index 1 to 3 in `[2, 1, 5, 3]`:
$$\text{prefix}[4] - \text{prefix}[1] = 11 - 2 = 9 \quad (1 + 5 + 3 = 9!)$$

---

## 2. Problem 1: Range Sum Query (Immutable)

Calculate the sum of elements of `nums` between indices `left` and `right` inclusive across many queries.

```javascript
// Node.js code
class NumArray {
  constructor(nums) {
    // prefix[i] stores the sum of first i elements
    this.prefix = new Array(nums.length + 1).fill(0);
    for (let i = 0; i < nums.length; i++) {
      this.prefix[i + 1] = this.prefix[i] + nums[i];
    }
  }

  // Answer any range query in O(1) time
  sumRange(left, right) {
    return this.prefix[right + 1] - this.prefix[left];
  }
}

const obj = new NumArray([-2, 0, 3, -5, 2, -1]);
console.log(obj.sumRange(0, 2)); // 1  (-2 + 0 + 3)
console.log(obj.sumRange(2, 5)); // -1 (3 + -5 + 2 + -1)
console.log(obj.sumRange(0, 5)); // -3
```
- **Build Time:** $O(n)$ once.
- **Query Time:** **$O(1)$** per query.
- **Extra Space:** $O(n)$ for prefix array.

---

## 3. Problem 2: Subarray Sum Equals K

Given an array of integers `nums` and an integer $k$, return the total number of subarrays whose sum equals $k$.

### Why Sliding Window Fails:
Sliding window only works when numbers are all positive (sum grows monotonically). If `nums` contains **negative numbers**, we must use **Prefix Sum + Hash Map**.

### The Insight:
If `currentPrefix - previousPrefix === k`, then the subarray between them sums to $k$!
$$\text{previousPrefix} = \text{currentPrefix} - k$$

```javascript
// Node.js code: Optimal O(n) Subarray Sum
function subarraySum(nums, k) {
  // Map stores: prefixSum -> how many times it appeared
  const prefixCounts = new Map();
  prefixCounts.set(0, 1); // Base case: prefix sum 0 occurs once before starting

  let runningSum = 0;
  let count = 0;

  for (const num of nums) {
    runningSum += num;

    // Check if (runningSum - k) was seen before
    const needed = runningSum - k;
    if (prefixCounts.has(needed)) {
      count += prefixCounts.get(needed);
    }

    // Record the current running sum in the map
    prefixCounts.set(runningSum, (prefixCounts.get(runningSum) || 0) + 1);
  }

  return count;
}

console.log(subarraySum([1, 1, 1], 2));       // 2 ([1,1] and [1,1])
console.log(subarraySum([1, 2, 3], 3));       // 2 ([1,2] and [3])
console.log(subarraySum([1, -1, 0], 0));     // 3 ([1,-1], [0], [1,-1,0])
```
- **Time Complexity:** $O(n)$ — Single pass.
- **Extra Space:** $O(n)$ — Map stores distinct prefix sums.

---

## 4. Tricky Points and Common Traps

1. **Forgetting `prefixCounts.set(0, 1)`:** If a subarray from index 0 itself sums to $k$, `runningSum - k = 0`. Without the initial `(0 => 1)`, you miss that valid subarray!
2. **Negative numbers and zeroes:** A prefix sum can repeat multiple times when adding zeroes or cancelling negative numbers. That is why the map must store the **frequency count**, not just a boolean.
3. **1-based index in prefix array:** Making `prefix` length $n + 1$ with `prefix[0] = 0` avoids awkward `if (left === 0)` edge cases.

---

## 5. Hands-On Exercises

Run this script in Node.js to verify prefix sums:

```javascript
// Node.js code
const assert = require("node:assert");

function testPrefix(nums, k) {
  const map = new Map([[0, 1]]);
  let sum = 0, count = 0;
  for (const n of nums) {
    sum += n;
    if (map.has(sum - k)) count += map.get(sum - k);
    map.set(sum, (map.get(sum) || 0) + 1);
  }
  return count;
}

assert.equal(testPrefix([1, 1, 1], 2), 2);
assert.equal(testPrefix([3, 4, 7, 2, -3, 1, 4, 2], 7), 4);

console.log("✅ Prefix sum assertions passed!");
```

---

## 6. Summary

- **Prefix Sum** precalculates cumulative sums in $O(n)$ time to answer any range sum query in $O(1)$.
- **Subarray Sum Equals K** works with negative numbers by storing seen prefix sums in a Hash Map.
- **Base case rule**: Always initialize your prefix map with `(0 => 1)` to capture subarrays starting at index 0.

---

## 7. Cheat Sheet

| Formula | Expression |
| :--- | :--- |
| **Build Prefix** | `prefix[i + 1] = prefix[i] + nums[i]` |
| **Range Sum $(L \dots R)$** | `prefix[R + 1] - prefix[L]` |
| **Target Check** | `needed = runningSum - k; count += map.get(needed)` |
| **Complexity** | **$O(n)$ time**, **$O(n)$ space** |

---

## 8. Interview Q&A

### 45-Second Explanation
> *"To find the number of subarrays summing to $k$ when the array contains negative numbers, sliding window does not work because sums are not monotonic. Instead, we use a Prefix Sum combined with a Hash Map. As we iterate through the array, we track the running sum and check if `runningSum - k` was recorded previously. If it was, every previous occurrence represents a valid subarray that sums to $k$. This achieves an optimal $O(n)$ runtime in a single pass."*

---

## 9. Practice Problems

### 1. Range Sum Query - Immutable - Easy
Given an integer array `nums`, handle multiple queries of the following type: Calculate the sum of the elements of `nums` between indices `left` and `right` inclusive where `left <= right`. Implement the `NumArray` class with $O(1)$ query time.
- **Input:** `nums = [-2, 0, 3, -5, 2, -1]`, `sumRange(0, 2)`
- **Expected Output:** `1`
- **Input:** `sumRange(2, 5)`
- **Expected Output:** `-1`
- **Input:** `sumRange(0, 5)`
- **Expected Output:** `-3`

### 2. Subarray Sum Equals K - Medium
Given an array of integers `nums` and an integer `k`, return the total number of subarrays whose sum equals to `k`. A subarray is a contiguous non-empty sequence of elements within an array.
- **Input:** `nums = [1,1,1]`, `k = 2`
- **Expected Output:** `2`
- **Input:** `nums = [1,2,3]`, `k = 3`
- **Expected Output:** `2`

### 3. Contiguous Array - Medium
Given a binary array `nums`, return the maximum length of a contiguous subarray with an equal number of `0` and `1`.
- **Input:** `nums = [0,1]`
- **Expected Output:** `2`
- **Input:** `nums = [0,1,0]`
- **Expected Output:** `2`

---

<nav aria-label="Lecture navigation">

[Previous: Sliding Window: Variable Size](day-09-sliding-window-variable-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Singly & Doubly Linked Lists](day-11-singly-and-doubly-linked-lists.md)

</nav>
