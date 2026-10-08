# Day 11: Two Pointers: Opposing Pointers

<nav aria-label="Lecture navigation">

[Previous: Merge Sort and Quick Sort](day-10-merge-sort-and-quick-sort.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Same-Direction / Fast & Slow](day-12-two-pointers-fast-and-slow.md)

</nav>
## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Asymptotic analysis and auxiliary memory.
- [Day 05: Sorting and Searching Basics](day-05-sorting-and-searching-basics.md) — Sorting arrays with numeric comparators.
- [Day 07: Two Sum and Hash Map Complements](day-07-two-sum-and-hash-complements.md) — Pair matching and complement logic.
- [Day 10: Merge Sort and Quick Sort](day-10-merge-sort-and-quick-sort.md) — Sorting in-place and partitioning.
---

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            OPPOSING POINTER CONVERGENCE PIPELINE                            │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Sorted Array: [ 1 , 3 , 5 , 8 , 11 , 15 ],  Target = 13
                  ▲                     ▲
                left                  right

  Step 1: sum = 1 + 15 = 16. (16 > 13: Too large!)
          Because the array is sorted, 15 paired with ANY element after 1 (3, 5, 8, 11)
          will be strictly > 16. We safely prune 15 from all future checks: right--.

  Step 2: sum = 1 + 11 = 12. (12 < 13: Too small!)
          1 paired with ANY element before 11 (1, 3, 5, 8) will be strictly < 12.
          We safely prune 1 from all future checks: left++.

  Step 3: sum = 3 + 11 = 14. (14 > 13) -> right--.
  Step 4: sum = 3 + 8  = 11. (11 < 13) -> left++.
  Step 5: sum = 5 + 8  = 13. MATCH! Return indices [ 2, 3 ].
```

## 1. Opposing Pointers on Monotonic Sequences

When an array is sorted in ascending order, the array possesses **monotonicity**:
- Incrementing `left` strictly increases or maintains the sum of `arr[left] + arr[right]`.
- Decrementing `right` strictly decreases or maintains the sum of `arr[left] + arr[right]`.

By placing `left = 0` and `right = arr.length - 1`, every comparison between `arr[left] + arr[right]` and `target` eliminates an entire row or column of potential pairs without inspecting them.

```javascript
// Node.js code
"use strict";

// Two Sum II: Input Array Is Sorted (LeetCode 167)
// Returns 1-based indices as per classic specification
function twoSumSorted(numbers, target) {
  let left = 0;
  let right = numbers.length - 1;

  while (left < right) {
    const currentSum = numbers[left] + numbers[right];

    if (currentSum === target) {
      return [left + 1, right + 1]; // Found target pair (1-based)
    } else if (currentSum < target) {
      left++; // Sum too small: advance left boundary
    } else {
      right--; // Sum too large: decrement right boundary
    }
  }

  return [];
}

console.log("Two Sum Sorted:", twoSumSorted([2, 7, 11, 15], 9)); // [1, 2]
```
- **Time Complexity:** $O(n)$ — at each iteration, either `left` advances or `right` decrements.
- **Auxiliary Space:** $O(1)$ — only two integer pointer variables on the stack.

---

## 2. Container With Most Water: The Greedy Pruning Proof

> **Greedy Pruning**: Discarding a set of candidates without explicit evaluation because a mathematical bound proves none can beat the current optimum.

Given an array of non-negative integers `height` where each represents a vertical line:
$$\text{Area}(L, R) = \min(\text{height}[L], \text{height}[R]) \times (R - L)$$

```
    8 |   |                   |
    7 |   |                   |       |
    6 |   |   |               |       |
      +---+---+---+---+---+---+---+---+
        L=1                         R=7
          <---------- Width ---------->
```

#### The Invariant Proof:
At any state $(L, R)$, the water container capacity is bounded by the **shorter line**:
Suppose $\text{height}[L] < \text{height}[R]$.
- If we move $R$ inward to $R - 1$, the width decreases by $1$.
- The new height can never exceed $\text{height}[L]$ because the formula takes the minimum.
- Therefore, for all interior points $k \in [L + 1, R - 1]$, the area with line $L$ is bounded by:
  $$\text{Area}(L, k) \le \text{height}[L] \times (k - L) < \text{height}[L] \times (R - L) = \text{Area}(L, R)$$
- None of the interior lines can form a larger container with $L$. We can safely prune line $L$ by moving **`left++`**.

```javascript
// Node.js code
function maxArea(height) {
  let left = 0;
  let right = height.length - 1;
  let maxWater = 0;

  while (left < right) {
    const width = right - left;
    const currentHeight = Math.min(height[left], height[right]);
    const currentArea = width * currentHeight;

    if (currentArea > maxWater) {
      maxWater = currentArea;
    }

    // Discard the shorter boundary line
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }

  return maxWater;
}

console.log("Max Water:", maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7])); // 49
```

---

## 3. 3Sum: Reducing $O(n^3)$ to $O(n^2)$ with Duplicate Pruning

> **Duplicate Pruning**: Advancing pointers past identical values to prevent redundant combinations or duplicate output tuples.

Given an array `nums`, find all unique triplets `[nums[i], nums[j], nums[k]]` such that $i \ne j \ne k$ and $\text{nums}[i] + \text{nums}[j] + \text{nums}[k] = 0$.

```javascript
// Node.js code
function threeSum(nums) {
  // Step 1: Sort ascending (O(n log n))
  nums.sort((a, b) => a - b);
  const result = [];

  for (let i = 0; i < nums.length - 2; i++) {
    // Early exit: if the smallest number is > 0, three positive numbers cannot sum to 0
    if (nums[i] > 0) break;

    // Duplicate Pruning 1: Skip identical base elements
    if (i > 0 && nums[i] === nums[i - 1]) continue;

    let left = i + 1;
    let right = nums.length - 1;
    const target = -nums[i];

    while (left < right) {
      const sum = nums[left] + nums[right];

      if (sum === target) {
        result.push([nums[i], nums[left], nums[right]]);

        // Duplicate Pruning 2: Skip identical adjacent left/right values
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;

        left++;
        right--;
      } else if (sum < target) {
        left++;
      } else {
        right--;
      }
    }
  }

  return result;
}

console.log("3Sum:", threeSum([-1, 0, 1, 2, -1, -4]));
// [ [ -1, -1, 2 ], [ -1, 0, 1 ] ]
```
- **Time Complexity:** $O(n^2)$ — sorting takes $O(n \log n)$, and the outer loop runs $n$ Two Sum scans ($n \times O(n)$).
- **Auxiliary Space:** $O(1)$ (or $O(\log n)$ for sorting call stack) excluding output storage.

---

## 4. Zero-Allocation In-Memory Financial Order Matching in Node.js

In high-frequency trading or matching engines, transactions are stored in pre-sorted ring buffers or arrays. Using two-pointer convergence to match buy and sell orders avoids allocating intermediate objects or arrays, completely eliminating V8 Garbage Collection pauses on the main thread:

```javascript
// Node.js code
// Match buy and sell orders that sum to target clearing price
function matchOrdersInPlace(buyOrders, sellOrders, clearingPrice) {
  let buyIdx = 0; // Sorted ascending
  let sellIdx = sellOrders.length - 1; // Sorted ascending
  const matches = [];

  while (buyIdx < buyOrders.length && sellIdx >= 0) {
    const combined = buyOrders[buyIdx].price + sellOrders[sellIdx].price;

    if (combined === clearingPrice) {
      matches.push({ buyId: buyOrders[buyIdx].id, sellId: sellOrders[sellIdx].id });
      buyIdx++;
      sellIdx--;
    } else if (combined < clearingPrice) {
      buyIdx++;
    } else {
      sellIdx--;
    }
  }

  return matches;
}
```

---

## Tricky Points and Edge Cases

### 1. Opposing Pointers on Unsorted Arrays
Attempting to run opposing two pointers on unsorted data produces incorrect answers. Moving `left++` on unsorted data does not guarantee the sum will increase. If the problem forbids sorting (e.g., original array indices must be preserved without extra memory), use the Hash Complement pattern ($O(n)$ space).

### 2. Missing Boundary Checks in Duplicate Skips
When advancing pointers past duplicates in 3Sum:
```javascript
// ❌ BUG: Pointer can increment past 'right', causing out-of-bounds reads
while (nums[left] === nums[left + 1]) left++;

// ✅ FIX: Bound check must precede value comparison
while (left < right && nums[left] === nums[left + 1]) left++;
```

### 3. Loop Boundary: `left < right` vs `left <= right`
In Two Sum and Container With Most Water, an element cannot be paired with itself. Using `left <= right` causes a redundant comparison when `left === right` (where width is 0). Use `left < right`.

---

## Hands-On Exercise

### Scenario
You are developing a string sanitizer for an authentication service. A candidate username must be checked for palindrome validity. You are asked to implement **Valid Palindrome II**: determine if a string can be a palindrome after deleting **at most one** character.

### Buggy Code
```javascript
// Node.js code
function validPalindromeIIBuggy(s) {
  // ❌ Bug: Slices and allocates multiple new strings on every character test!
  // Triggers O(n^2) time complexity, timing out on strings with length 50,000.
  for (let i = 0; i < s.length; i++) {
    const candidate = s.slice(0, i) + s.slice(i + 1);
    if (candidate === candidate.split("").reverse().join("")) {
      return true;
    }
  }
  return false;
}
```

### Acceptance Criteria
1. The algorithm must execute in strictly $O(n)$ time.
2. Auxiliary memory must be strictly $O(1)$ without allocating reversed strings.
3. Pass edge cases: strings that are already palindromes (`"aba"`), strings requiring one deletion (`"abca"`), and strings that cannot be made palindromes (`"abc"`).

### Solution Code

```javascript
// Node.js code
import assert from "node:assert/strict";

function validPalindrome(s) {
  let left = 0;
  let right = s.length - 1;

  // Helper to verify standard palindrome in O(n) time, O(1) space
  function isSubPalindrome(l, r) {
    while (l < r) {
      if (s[l] !== s[r]) return false;
      l++;
      r--;
    }
    return true;
  }

  while (left < right) {
    if (s[left] !== s[right]) {
      // Upon encountering the first mismatch, test skipping either left or right character
      return isSubPalindrome(left + 1, right) || isSubPalindrome(left, right - 1);
    }
    left++;
    right--;
  }

  return true; // Already a valid palindrome without any deletions
}

// Verification Tests
assert.equal(validPalindrome("aba"), true);   // Already palindrome
assert.equal(validPalindrome("abca"), true);  // Delete 'c' or 'b'
assert.equal(validPalindrome("abc"), false);  // Requires 2 deletions
assert.equal(validPalindrome("deeee"), true); // Delete 'd'
assert.equal(validPalindrome("eeeed"), true); // Delete 'd'

console.log("✅ All Valid Palindrome II tests passed successfully!");
```

### Solution Explanation

1. **Greedy Single-Skip Verification:** As long as `s[left] === s[right]`, characters are matched. The first mismatch at indices $(L, R)$ requires deleting either $s[L]$ or $s[R]$.
2. **Strict $O(n)$ Bound:** `isSubPalindrome()` scans the remaining inner window at most twice, guaranteeing at most $2n$ comparisons and $O(1)$ stack allocations.

---

## Summary

- Opposing two pointers converge inward on sorted arrays in $O(n)$ time and $O(1)$ auxiliary space.
- In **Two Sum II**, monotonic ordering dictates whether to increment `left` (sum too small) or decrement `right` (sum too large).
- In **Container With Most Water**, greedy shrinkage discards the shorter boundary line because its area cannot be improved with smaller widths.
- **3Sum** fixes one element and runs Two Sum II on the remaining suffix ($O(n^2)$), requiring duplicate skipping at all pointer positions.
- Using primitive stack pointers avoids heap allocations, preventing V8 garbage collection pauses and stabilizing p99 latency in Node.js.

---

## Cheat Sheet

### Decision Rules
| Problem Condition | Pointer Action | Why It Works |
|---|---|---|
| `sum < target` | `left++` | Array is sorted; all pairs with current `left` are strictly too small |
| `sum > target` | `right--` | Array is sorted; all pairs with current `right` are strictly too large |
| `height[L] < height[R]` | `left++` | Line $L$ bottlenecks capacity; interior widths cannot yield larger areas |
| `s[L] === s[R]` (Palindrome) | `left++, right--` | Outer characters match; test remaining inner substring |

### Common Pitfalls
- **Sorting Unnecessarily when Indices Matter:** Pre-sorting unsorted arrays destroys initial index positions.
- **Missing Boundary Guard in Duplicate Skips:** Writing `while (nums[left] === nums[left+1])` without `left < right`.
- **Using `<=` for Pair Matching:** Allowing `left === right` permits an element to match with itself.
- **Allocating Strings in Palindrome Checks:** Using `str.split('').reverse().join('')` instead of index pointers.

---

## Interview Questions

### 1. Why does sorting an array before running Two Pointers take $O(n \log n)$ time, and why is this often preferable to an $O(n)$ hash map?

**Question:** Compare the time, memory, and operational trade-offs between sorting with Two Pointers versus using a Hash Map for pair finding.

**Answer:** 
- **Asymptotic Comparison:**
  - Hash Map runs in $O(n)$ average time and consumes **$O(n)$ auxiliary memory**.
  - Sorting takes $O(n \log n)$ time, followed by an $O(n)$ two-pointer scan, taking $O(n \log n)$ overall time and **$O(1)$ auxiliary space** (if sorted in place).
- **Why Two Pointers is Often Preferred:**
  1. **Zero Garbage Collection Overhead:** In high-throughput Node.js microservices, allocating a hash map with 500,000 entries generates thousands of heap objects, triggering V8 garbage collector scavenges and spiking p99 latency. Two-pointer convergence uses two integer registers on the stack with zero heap allocations.
  2. **Memory-Constrained Environments:** In containerized environments with strict memory limits (e.g., 64 MB), an $O(n)$ hash map risks an Out-Of-Memory (OOM) crash, whereas Two Pointers operates with zero additional RAM.
  3. **Multi-Target Queries:** If the dataset is already sorted (e.g., stored in a sorted table or indexed stream), Two Pointers runs in $O(n)$ time with $O(1)$ space, beating the hash map on all metrics.

---

### 2. What does this code return for `height = [1, 1]`, and what is the exact execution trace?

**Question:** Walk through the execution of `maxArea` on `height = [1, 1]` and explain why the while loop terminates.
```javascript
function maxArea(height) {
  let l = 0, r = height.length - 1, ans = 0;
  while (l < r) {
    ans = Math.max(ans, Math.min(height[l], height[r]) * (r - l));
    if (height[l] < height[r]) l++;
    else r--;
  }
  return ans;
}
```

**Answer:**
The function returns `1`.

**Execution Trace:**
1. **Initialization:** `l = 0`, `r = 1`, `ans = 0`.
2. **Iteration 1:**
   - Loop condition `l < r` ($0 < 1$) evaluates to `true`.
   - `width = r - l = 1 - 0 = 1`.
   - `currentHeight = Math.min(height[0], height[1]) = Math.min(1, 1) = 1`.
   - `area = 1 * 1 = 1`.
   - `ans = Math.max(0, 1) = 1`.
   - Evaluation of `height[l] < height[r]` ($1 < 1$) is `false`, entering the `else` branch: `r--` decrements `r` to `0`.
3. **Termination:**
   - Next iteration checks `l < r` ($0 < 0$), which evaluates to `false`.
   - Loop terminates immediately, returning `ans = 1`.

---

### 3. How do you implement 3Sum while guaranteeing no duplicate triplets appear in the output, without using a `Set`?

**Question:** Explain the duplicate pruning logic in 3Sum and implement it cleanly in JavaScript.

**Answer:** 
To guarantee unique triplets without spending extra memory on a `Set`, the array is sorted first, and duplicates are skipped at all three pointer locations:

```javascript
// Node.js code
function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const result = [];

  for (let i = 0; i < nums.length - 2; i++) {
    if (nums[i] > 0) break; // Smallest number > 0 cannot sum to 0
    // Skip duplicate anchor elements
    if (i > 0 && nums[i] === nums[i - 1]) continue;

    let left = i + 1;
    let right = nums.length - 1;
    const target = -nums[i];

    while (left < right) {
      const sum = nums[left] + nums[right];

      if (sum === target) {
        result.push([nums[i], nums[left], nums[right]]);
        // Skip duplicate left and right elements
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;
        left++;
        right--;
      } else if (sum < target) {
        left++;
      } else {
        right--;
      }
    }
  }

  return result;
}
```
- **Anchor Pruning:** `if (i > 0 && nums[i] === nums[i - 1]) continue` prevents processing the same first value more than once.
- **Converging Pruning:** Once a valid sum is found, advancing past all identical adjacent values guarantees that neither `left` nor `right` re-uses the same number for the fixed anchor.

---

### 4. Can the opposing two-pointer technique be generalized to 4Sum and $K$-Sum, and what are the resulting time complexities?

**Question:** Explain how Two Pointers generalizes to 4Sum and arbitrary $K$-Sum on a sorted array.

**Answer:** 
Yes. The two-pointer technique forms the base case ($K = 2$) for a recursive divide-and-conquer generalization to arbitrary $K$-Sum:
- For $K = 2$ (Two Sum II): Use opposing two pointers on the sorted array in $O(n)$ time.
- For $K = 3$ (3Sum): Loop over the first element ($O(n)$) and invoke Two Sum II on the remainder, yielding $O(n^2)$ time.
- For $K = 4$ (4Sum): Use two nested loops to fix the first two elements ($O(n^2)$) and invoke Two Sum II on the remainder, yielding $O(n^3)$ time.
- **Generalization:** For arbitrary $K \ge 2$, sorting takes $O(n \log n)$, followed by $K - 2$ nested loops wrapping the final Two-Pointer scan. The asymptotic time complexity is **$O(n^{K - 1})$** with $O(1)$ auxiliary space (excluding recursion stack of depth $K$).

---

<nav aria-label="Lecture navigation">

[Previous: Merge Sort and Quick Sort](day-10-merge-sort-and-quick-sort.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Same-Direction / Fast & Slow](day-12-two-pointers-fast-and-slow.md)

</nav>
