# Day 09: Sliding Window: Variable Size

<nav aria-label="Lecture navigation">

[Previous: Sliding Window: Fixed Size](day-08-sliding-window-fixed-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Prefix Sum & Subarray Totals](day-10-prefix-sum-and-subarray-totals.md)

</nav>

## Prerequisites

- [Day 04: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md) — Hash Sets & Maps.
- [Day 08: Sliding Window: Fixed Size](day-08-sliding-window-fixed-size.md) — The sliding window concept.

---

## 1. What is a Variable Sliding Window?

In a **Variable Sliding Window**, the window expands and shrinks dynamically as we scan the array:
- The **right pointer** expands the window to include new elements.
- When the window violates a rule (like having a duplicate character), the **left pointer** shrinks the window until the rule is satisfied again.

```text
The Expand & Shrink Rhythm:
[ left ......... right ] ──► Valid! Record window size: (right - left + 1)
[ left ............. right+1 ] ──► Invalid (e.g., duplicate found!)
       [ left+1 ..... right+1 ] ──► Shrink left until valid again!
```

---

## 2. Problem 1: Longest Substring Without Repeating Characters

Given a string `s`, find the length of the longest substring without repeating characters.

### The Algorithm:
1. Use a `Set` to track characters in the current window.
2. Advance `right` character by character.
3. If `s[right]` is already in the `Set`, remove `s[left]` from the Set and increment `left++` until the duplicate is gone.
4. Add `s[right]` to the Set and update `maxLength = Math.max(maxLength, right - left + 1)`.

```javascript
// Node.js code
function lengthOfLongestSubstring(s) {
  const seen = new Set();
  let left = 0;
  let maxLength = 0;

  for (let right = 0; right < s.length; right++) {
    // Shrink left until the duplicate character is removed
    while (seen.has(s[right])) {
      seen.delete(s[left]);
      left++;
    }

    seen.add(s[right]);
    maxLength = Math.max(maxLength, right - left + 1);
  }

  return maxLength;
}

console.log(lengthOfLongestSubstring("abcabcbb")); // 3 ("abc")
console.log(lengthOfLongestSubstring("bbbbb"));    // 1 ("b")
console.log(lengthOfLongestSubstring("pwwkew"));   // 3 ("wke")
```
- **Time Complexity:** $O(n)$ — Each character is added to the Set once and removed at most once ($2n$ steps).
- **Extra Space:** $O(\min(n, m))$ — Where $m$ is the alphabet size (at most 128 ASCII characters).

---

## 3. Problem 2: Minimum Size Subarray Sum

Given an array of positive integers `nums` and a positive integer `target`, return the minimal length of a contiguous subarray whose sum is greater than or equal to `target`. If there is none, return 0.

### The Algorithm (Shrink to Minimize):
1. Expand `right` and add `nums[right]` to `currentSum`.
2. While `currentSum >= target`: Record the length (`right - left + 1`), then subtract `nums[left]` and advance `left++` to see if a shorter window still meets the target!

```javascript
// Node.js code
function minSubArrayLen(target, nums) {
  let left = 0;
  let currentSum = 0;
  let minLength = Infinity;

  for (let right = 0; right < nums.length; right++) {
    currentSum += nums[right];

    // Shrink from the left while the sum condition is satisfied
    while (currentSum >= target) {
      minLength = Math.min(minLength, right - left + 1);
      currentSum -= nums[left];
      left++;
    }
  }

  return minLength === Infinity ? 0 : minLength;
}

console.log(minSubArrayLen(7, [2, 3, 1, 2, 4, 3])); // 2 ([4, 3])
console.log(minSubArrayLen(4, [1, 4, 4]));          // 1 ([4])
console.log(minSubArrayLen(11, [1, 1, 1, 1]));       // 0
```
- **Time Complexity:** $O(n)$ — Both `left` and `right` traverse the array at most once.
- **Extra Space:** $O(1)$ — Only numbers stored.

---

## 4. Tricky Points and Common Traps

1. **Why is it $O(n)$ if there is a `while` loop inside a `for` loop?**
   The inner `while` loop advances `left`. Across the entire run, `left` can only move from $0$ to $n - 1$ once. It does **not** reset to $0$. Total moves $= n$ for `right` $+ n$ for `left` $= 2n \implies O(n)$.
2. **Window length formula:** The number of elements between `left` and `right` inclusive is always **`right - left + 1`**.
3. **Empty string input:** Always ensure your code handles `s = ""` safely (returns 0).

---

## 5. Hands-On Exercises

Run this script in Node.js to test variable sliding window:

```javascript
// Node.js code
const assert = require("node:assert");

function testLongestSub(s) {
  const set = new Set();
  let l = 0, max = 0;
  for (let r = 0; r < s.length; r++) {
    while (set.has(s[r])) {
      set.delete(s[l]);
      l++;
    }
    set.add(s[r]);
    max = Math.max(max, r - l + 1);
  }
  return max;
}

assert.equal(testLongestSub("abcabcbb"), 3);
assert.equal(testLongestSub(""), 0);
assert.equal(testLongestSub("au"), 2);

console.log("✅ Variable sliding window tests passed!");
```

---

## 6. Summary

- **Variable sliding window** handles conditions like "longest without duplicates" or "shortest sum $\ge$ target".
- **Two pointers in harmony**: `right` expands the window; `left` shrinks it when conditions break.
- **Linear time ($O(n)$)**: Pointers only move forward; no nested full scans.

---

## 7. Cheat Sheet

| Goal | When to expand (`right`) | When to shrink (`left`) | What to record |
| :--- | :--- | :--- | :--- |
| **Longest Valid** | Every step | While window is **invalid** | Max length after shrinking |
| **Shortest Valid** | While sum $<$ target | While window is **valid** | Min length inside shrink loop |

---

## 8. Interview Q&A

### 45-Second Explanation
> *"For Longest Substring Without Repeating Characters, we maintain a variable sliding window using a Set. As we expand the right pointer, if we encounter a character already in our Set, we shrink the window from the left until the duplicate is removed. Because both left and right pointers only move forward, each character is visited at most twice, guaranteeing an optimal $O(n)$ time complexity."*

---

## 9. Practice Problems

### 1. Longest Substring Without Repeating Characters - Medium
Given a string `s`, find the length of the longest substring without repeating characters.
- **Input:** `s = "abcabcbb"`
- **Expected Output:** `3`
- **Input:** `s = "bbbbb"`
- **Expected Output:** `1`
- **Input:** `s = "pwwkew"`
- **Expected Output:** `3`

### 2. Minimum Size Subarray Sum - Medium
Given an array of positive integers `nums` and a positive integer `target`, return the minimal length of a subarray whose sum is greater than or equal to `target`. If there is no such subarray, return `0` instead.
- **Input:** `target = 7, nums = [2,3,1,2,4,3]`
- **Expected Output:** `2`
- **Input:** `target = 4, nums = [1,4,4]`
- **Expected Output:** `1`
- **Input:** `target = 11, nums = [1,1,1,1,1,1,1,1]`
- **Expected Output:** `0`

### 3. Longest Repeating Character Replacement - Medium
You are given a string `s` and an integer `k`. You can choose any character of the string and change it to any other uppercase English character. You can perform this operation at most `k` times. Return the length of the longest substring containing the same letter you can get after performing the above operations.
- **Input:** `s = "ABAB", k = 2`
- **Expected Output:** `4`
- **Input:** `s = "AABABBA", k = 1`
- **Expected Output:** `4`

---

<nav aria-label="Lecture navigation">

[Previous: Sliding Window: Fixed Size](day-08-sliding-window-fixed-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Prefix Sum & Subarray Totals](day-10-prefix-sum-and-subarray-totals.md)

</nav>
