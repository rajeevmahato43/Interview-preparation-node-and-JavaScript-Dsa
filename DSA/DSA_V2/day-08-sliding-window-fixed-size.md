# Day 08: Sliding Window: Fixed Size

<nav aria-label="Lecture navigation">

[Previous: Two Pointers: Fast & Slow](day-07-two-pointers-fast-slow-and-partitioning.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Sliding Window: Variable Size](day-09-sliding-window-variable-size.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — $O(n)$ vs $O(n \times k)$.
- [Day 02: Arrays, Strings & Memory](day-02-arrays-strings-and-primitive-memory.md) — Contiguous subarrays.

---

## 1. What is a Fixed Sliding Window?

A **Fixed Sliding Window** solves problems on contiguous subarrays of a fixed length $k$.

Think of looking out of a moving train window of fixed width $k$:
- As the train moves forward 1 step, you **do not** recount all the trees from scratch.
- Exactly **one tree leaves** your view on the left, and **one new tree enters** on the right.
- Everything in the middle stays the same!

$$\text{newSum} = \text{oldSum} - \text{arr}[i - k] + \text{arr}[i]$$

```text
Array: [ 2, 1, 5, 1, 3, 2 ],  k = 3

Window 0: [ 2, 1, 5 ] 1, 3, 2   ──► Sum = 2 + 1 + 5 = 8
            -2    +1
Window 1: 2 [ 1, 5, 1 ] 3, 2    ──► Sum = 8 - 2 + 1 = 7
               -1    +3
Window 2: 2, 1 [ 5, 1, 3 ] 2    ──► Sum = 7 - 1 + 3 = 9  <-- Maximum!
                  -5    +2
Window 3: 2, 1, 5 [ 1, 3, 2 ]   ──► Sum = 9 - 5 + 2 = 6

Total work: Instead of adding 3 numbers per window, each step does 1 minus and 1 plus -> O(n) total!
```

---

## 2. Problem 1: Maximum Average Subarray I

Given an array `nums` and an integer $k$, find a contiguous subarray of length $k$ with the maximum average.

```javascript
// Node.js code
function findMaxAverage(nums, k) {
  // Step 1: Compute sum of first window (first k items)
  let currentSum = 0;
  for (let i = 0; i < k; i++) {
    currentSum += nums[i];
  }

  let maxSum = currentSum;

  // Step 2: Slide the window from index k to end
  for (let i = k; i < nums.length; i++) {
    currentSum += nums[i] - nums[i - k]; // Add new, drop old
    if (currentSum > maxSum) {
      maxSum = currentSum;
    }
  }

  return maxSum / k;
}

console.log(findMaxAverage([1, 12, -5, -6, 50, 3], 4)); // 12.75
console.log(findMaxAverage([5], 1));                     // 5
```
- **Time Complexity:** $O(n)$ — Single pass through the array.
- **Extra Space:** $O(1)$ — Only a few numbers stored.

---

## 3. Problem 2: Find All Anagrams in a String

Given two strings `s` and `p`, find all start indices of `p`'s anagrams in `s`.

### The Insight: Fixed Window of Size `p.length`
Any anagram of `p` must have the exact same length as `p`. We slide a window of size `p.length` across `s` and compare character counts:

```javascript
// Node.js code
function findAnagrams(s, p) {
  const result = [];
  if (s.length < p.length) return result;

  const pCount = new Array(26).fill(0);
  const sCount = new Array(26).fill(0);

  // Initialize count for p and first window of s
  for (let i = 0; i < p.length; i++) {
    pCount[p.charCodeAt(i) - 97]++;
    sCount[s.charCodeAt(i) - 97]++;
  }

  function matches(c1, c2) {
    for (let i = 0; i < 26; i++) {
      if (c1[i] !== c2[i]) return false;
    }
    return true;
  }

  if (matches(pCount, sCount)) result.push(0);

  // Slide window of size p.length
  for (let i = p.length; i < s.length; i++) {
    sCount[s.charCodeAt(i) - 97]++;             // Add right char
    sCount[s.charCodeAt(i - p.length) - 97]--;   // Remove left char

    if (matches(pCount, sCount)) {
      result.push(i - p.length + 1);
    }
  }

  return result;
}

console.log(findAnagrams("cbaebabacd", "abc")); // [0, 6]
```
- **Time Complexity:** $O(n \times 26) = O(n)$ — Comparing 26 counts takes $O(1)$ time.
- **Extra Space:** $O(1)$ — Two fixed 26-slot arrays.

---

## 4. Tricky Points and Common Traps

1. **Off-by-one errors:** The element leaving the window is at index `i - k`.
2. **Handling $k > \text{array.length}$:** Always check `if (nums.length < k) return 0;`.
3. **Negative numbers:** Initialize `maxSum = currentSum` (the first window's sum), not `0`! If all numbers are negative, initializing to `0` gives the wrong answer.

---

## 5. Hands-On Exercises

Run this script in Node.js to test fixed sliding window:

```javascript
// Node.js code
const assert = require("node:assert");

function testMaxSubarray(nums, k) {
  let sum = 0;
  for (let i = 0; i < k; i++) sum += nums[i];
  let max = sum;
  for (let i = k; i < nums.length; i++) {
    sum += nums[i] - nums[i - k];
    if (sum > max) max = sum;
  }
  return max;
}

assert.equal(testMaxSubarray([2, 1, 5, 1, 3, 2], 3), 9);
assert.equal(testMaxSubarray([-1, -2, -3, -4], 2), -3);

console.log("✅ Fixed sliding window tests passed!");
```

---

## 6. Summary

- **Fixed Sliding Window** runs in $O(n)$ by updating rolling totals: `sum += arr[i] - arr[i - k]`.
- **Avoid recalculating:** Never sum all $k$ elements inside the loop ($O(n \cdot k)$ anti-pattern).
- **Initialize with the first window:** Always compute the first window from $0$ to $k - 1$ first.

---

## 7. Cheat Sheet

| Step | Code |
| :--- | :--- |
| **1. First Window** | `for (let i = 0; i < k; i++) sum += nums[i];` |
| **2. Base Answer** | `let max = sum;` |
| **3. Slide Window** | `for (let i = k; i < nums.length; i++) { sum += nums[i] - nums[i - k]; ... }` |
| **Complexity** | **$O(n)$ time**, **$O(1)$ space** |

---

## 8. Interview Q&A

### 45-Second Explanation
> *"When looking for the maximum sum or average across contiguous subarrays of size $k$, recomputing each window from scratch takes $O(n \times k)$ time. By using a fixed sliding window, we calculate the sum of the first $k$ elements once. Then, for each step, we simply add the incoming element and subtract the outgoing element. This reduces the total time to a linear $O(n)$ pass with strictly $O(1)$ extra space."*

---

## 9. Practice Problems

### 1. Maximum Average Subarray I - Easy
You are given an integer array `nums` consisting of `n` elements, and an integer `k`. Find a contiguous subarray whose length is equal to `k` that has the maximum average value and return this value. Any answer with a calculation error less than `10^-5` will be accepted.
- **Input:** `nums = [1,12,-5,-6,50,3]`, `k = 4`
- **Expected Output:** `12.75`
- **Input:** `nums = [5]`, `k = 1`
- **Expected Output:** `5.0`

### 2. Find All Anagrams in a String - Medium
Given two strings `s` and `p`, return an array of all the start indices of `p`'s anagrams in `s`. You may return the answer in any order.
- **Input:** `s = "cbaebabacd"`, `p = "abc"`
- **Expected Output:** `[0,6]`
- **Input:** `s = "abab"`, `p = "ab"`
- **Expected Output:** `[0,1,2]`

### 3. Number of Sub-arrays of Size K and Average Greater than or Equal to Threshold - Medium
Given an array of integers `arr` and two integers `k` and `threshold`, return the number of sub-arrays of size `k` and average greater than or equal to `threshold`.
- **Input:** `arr = [2,2,2,2,5,5,5,8]`, `k = 3`, `threshold = 4`
- **Expected Output:** `3`
- **Input:** `arr = [11,13,17,23,29,31,7,5,2,3]`, `k = 3`, `threshold = 5`
- **Expected Output:** `6`

---

<nav aria-label="Lecture navigation">

[Previous: Two Pointers: Fast & Slow](day-07-two-pointers-fast-slow-and-partitioning.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Sliding Window: Variable Size](day-09-sliding-window-variable-size.md)

</nav>
