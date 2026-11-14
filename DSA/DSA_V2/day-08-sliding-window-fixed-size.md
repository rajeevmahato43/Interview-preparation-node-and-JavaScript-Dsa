# Day 08: Fixed Sliding Window

<nav aria-label="Lecture navigation">

[Previous: Fast & Slow Pointers](day-07-two-pointers-fast-slow-and-partitioning.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Variable Sliding Window](day-09-sliding-window-variable-size.md)

</nav>

---

## 1. Fixed Sliding Window

A **fixed window** is a group of `k` neighboring values or letters. The group always stays the same size as it moves.

Do not add all `k` values again after each move. Keep the current result. Subtract the value leaving on the left, then add the new value on the right:

`new total = old total - value leaving + value entering`

Imagine a frame that shows three poles as a train passes them. When the train moves, one pole leaves the frame and one enters. The other two stay in view. Update the total using only the pole that left and the one that entered.

```text
Array: [ 2, 1, 5, 1, 3, 2 ], Window Size k = 3

Window 0: [ 2,  1,  5 ]  1,   3,   2   -> Sum = 2 + 1 + 5 = 8
           -2       +1
Window 1:   2  [ 1,  5,  1 ]  3,   2   -> New sum = 8 - 2 + 1 = 7
               -1       +3
Window 2:   2,  1  [ 5,  1,  3 ]  2   -> New sum = 7 - 1 + 3 = 9  (max sum)
                   -5       +2
Window 3:   2,  1,  5  [ 1,  3,  2 ]   -> New sum = 9 - 5 + 2 = 6
```

```javascript
"use strict";

// Find the largest sum among groups of length k.
function maxSubarraySum(arr, k) {
  if (!Array.isArray(arr) || arr.length < k || k <= 0) return 0;

  // Add the first group.
  let windowSum = 0;
  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
  }

  let maxSum = windowSum;

  // Move the group across the remaining values.
  for (let i = k; i < arr.length; i++) {
    // Remove the value that leaves and add the value that enters.
    windowSum += arr[i] - arr[i - k];
    if (windowSum > maxSum) {
      maxSum = windowSum;
    }
  }

  return maxSum;
}

console.log(maxSubarraySum([2, 1, 5, 1, 3, 2], 3)); // 9
```

---

### 1.1 How the Window Moves

A fixed window always contains exactly `k` items. First, add the first `k` items. For each move after that, remove one item and add one item.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      FIXED WINDOW LIFECYCLE PHASES                     │
├─────────────────────┬──────────────────┬─────────────────┬─────────────┤
│ Index Range         │ Leaves           │ Enters          │ Action      │
├─────────────────────┼──────────────────┼─────────────────┼─────────────┤
│ 0 to k - 1          │ None             │ arr[i]          │ Build       │
│ k to n - 1          │ arr[i - k]       │ arr[i]          │ Move window │
└─────────────────────┴──────────────────┴─────────────────┴─────────────┘
```

> [!NOTE]
> With `n = 100,000` values and `k = 30,000`, which method does less work: adding every window again, or updating the total as it moves?
>
> *Answer:* Updating the total does less work. Re-adding each window can take about 2.1 billion additions. Building the first total and then moving the window takes about 170,000 additions and subtractions.

---

### 1.2 Reuse the Previous Total

| Strategy | Work per window | Total time | Extra space |
| :--- | :---: | :---: | :---: |
| Add every window again | `O(k)` | `O(n * k)` | `O(1)` if no copy is made |
| Copy and add every window | `O(k)` | `O(n * k)` | `O(k)` temporary space |
| Fixed sliding window | `O(1)` after the first window | `O(n)` | `O(1)` |

For averages, keep the window sum and divide by `k` when you return the answer. This avoids doing a division on every move.

---

### 1.3 Operations Reference Table

| Operation | What it does | Time | Extra space | Example |
| :--- | :--- | :---: | :---: | :--- |
| Build first window | Add its first `k` values | `O(k)` | `O(1)` | `sum += arr[i]` |
| Move the window | Remove one value and add one | `O(1)` | `O(1)` | `sum += arr[i] - arr[i - k]` |
| Save the best result | Keep the largest or smallest total | `O(1)` | `O(1)` | `maxSum = Math.max(maxSum, sum)` |
| Update letter counts | Add or remove one letter count | `O(1)` | `O(1)` | `counts[inCode]++` |
| Compare letter counts | Check all 26 lowercase letters | `O(1)` | `O(1)` | `arraysEqual(pCount, sCount)` |

---

## 2. Pattern Overview

### 2.1 Pattern Family
* **Rolling total or average:** Keep the total for the current group. Remove what leaves and add what enters.
* **Letter counts:** Keep a count for each letter in the current group. Use this to find anagrams.
* **Rolling hash:** Turn each group of letters into a number for quick comparison. Different groups can have the same number, so check matches before using them.
* **Window maximum:** Use a deque (a list where items can be added or removed at either end). Keep useful indexes in decreasing value order. The first index points to the largest value.

For `[1, 3, -1, -3, 5]` with `k = 3`, the first window has maximum `3`. Keep the indexes of `3` and `-1` in the deque. When `5` enters, remove the smaller values before it: they cannot be the maximum while `5` is still in the window. Also remove an index when its value has left the window.

### 2.2 Pattern Recognition Table

| Problem words | What it asks | Method |
| :--- | :--- | :--- |
| **"Groups of size `k`" + "largest/smallest sum or average"** | Find the best total or average in any group of size `k`. | Keep a running total. |
| **"Find all anagrams" / "Find a rearranged word"** | Find groups with the same letter counts. | Keep and compare letter counts. |
| **"Groups of size `k` with no repeated letters"** | Find groups where each letter appears once. | Track letters in the current group. |
| **"Largest value in each window"** | Find the largest value in every group of size `k`. | Keep possible maximums in a deque. |

### 2.3 When to Use vs When NOT to Use
* **Use it when:**
  * The problem gives a fixed size `k`.
  * It asks about neighboring values or letters.
  * You can update the result using the item that left and the item that entered.

* **Do not use it when:**
  * The window size must grow or shrink based on a rule. Use a variable window (Day 9).
  * You need a target sum with any window size and the array has negative numbers. Use prefix sums (Day 10).
  * The selected items do not need to be next to each other.

### 2.4 The 10^7 Operations Rule
For `n = 100,000` and `k = 50,000`:
* Adding every window again can take about 2.5 billion additions.
* The fixed window builds one total, then moves across the array. It does about 100,000 steps.
* `10^7` steps is only a rough guide. Actual run time depends on the computer and the code.

---

## 3. Problem Walkthroughs

---

### 3.1 Maximum Average Subarray I

#### 3.1.1 Problem Statement
Given an integer array `nums` and a number `k`, find the largest average among all groups of `k` neighboring values.

* **Input:** `nums = [1, 12, -5, -6, 50, 3]`, `k = 4` -> **Output:** `12.75` (The group `[12, -5, -6, 50]` has sum 51 and average 12.75.)
* **Input:** `nums = [5]`, `k = 1` -> **Output:** `5`
* **Input:** `nums = [-1]`, `k = 1` -> **Output:** `-1`
* **Input limits:** 1 to 100,000 values. `k` is between 1 and the array length. Each value is between -10,000 and 10,000.

#### 3.1.2 How to Think About It
Start with the first four values: `[1, 12, -5, -6]`. Their sum is `2`.

- Move one spot right. Remove `1` and add `50`. The new sum is `51`.
- Move again. Remove `12` and add `3`. The new sum is `42`.
- The largest sum is `51`. Divide it by `4` to get the largest average: `12.75`.

#### 3.1.3 Brute Force Approach & Bottleneck
The naive way recalculates every window from scratch using nested loops:

```javascript
function findMaxAverageBrute(nums, k) {
  let maxAvg = -Infinity;
  for (let i = 0; i <= nums.length - k; i++) {
    let windowSum = 0;
    for (let j = i; j < i + k; j++) {
      windowSum += nums[j];
    }
    maxAvg = Math.max(maxAvg, windowSum / k);
  }
  return maxAvg;
}
```

* **The slow part:** Neighboring groups share `k - 1` values. The slow method adds those same values again for every group. This can take `O(n * k)` time.

#### 3.1.4 The Pattern Insight
Reuse the sum from the previous group:
* Subtract the value leaving the group, `nums[i - k]`.
* Add the value entering, `nums[i]`.
* Compare sums. Divide the largest sum by `k` at the end.

#### 3.1.5 Pseudocode

```text
FUNCTION FindMaxAverage(nums, k):
  currentSum = 0
  FOR i FROM 0 TO k - 1:
    currentSum = currentSum + nums[i]

  maxSum = currentSum

  FOR i FROM k TO length(nums) - 1:
    currentSum = currentSum + nums[i] - nums[i - k]
    maxSum = MAX(maxSum, currentSum)

  RETURN maxSum / k
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Reuses the previous window sum.
function findMaxAverage(nums, k) {
  if (!Array.isArray(nums) || nums.length < k || k <= 0) return 0;

  // Sum the first group.
  let currentSum = 0;
  for (let i = 0; i < k; i++) {
    currentSum += nums[i];
  }

  let maxSum = currentSum;

  // Move the group across the remaining values.
  for (let i = k; i < nums.length; i++) {
    currentSum += nums[i] - nums[i - k];
    if (currentSum > maxSum) {
      maxSum = currentSum;
    }
  }

  // Divide only after finding the largest sum.
  return maxSum / k;
}

// Example runs
console.log(findMaxAverage([1, 12, -5, -6, 50, 3], 4)); // 12.75
console.log(findMaxAverage([5], 1));                   // 5
console.log(findMaxAverage([-1], 1));                  // -1
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Starts the best average at 0.
function buggyFindMaxAverage(nums, k) {
  let avg = 0;
  for (let i = 0; i < k; i++) avg += nums[i] / k;

  // This is wrong when every average is below 0.
  let maxAvg = 0;

  for (let i = k; i < nums.length; i++) {
    avg += (nums[i] - nums[i - k]) / k;
    maxAvg = Math.max(maxAvg, avg);
  }
  return maxAvg;
}
```
* **Why it fails:** If all values are negative, `0` is larger than every real average. For example, with `nums = [-5, -2]` and `k = 2`, it returns `0` instead of `-3.5`. Start with the first group's average or use `-Infinity`.

#### 3.1.8 Complexity Derivation
* **Time:** `O(n)`. The first loop adds `k` values. The second loop moves across the rest of the array.
* **Extra space:** `O(1)`. The function stores only a few numbers.

---

### 3.2 Find All Anagrams in a String

#### 3.2.1 Problem Statement
Given strings `s` and `p`, return the start positions of every group in `s` that uses the same letters as `p`, in any order.

An **anagram** uses the same letters the same number of times, but the letters may be in a different order.

* **Input:** `s = "cbaebabacd"`, `p = "abc"` -> **Output:** `[0, 6]` (The groups `"cba"` and `"bac"` use the same letters as `"abc"`.)
* **Input:** `s = "abab"`, `p = "ab"` -> **Output:** `[0, 1, 2]`
* **Input:** `s = "hello"`, `p = "world"` -> **Output:** `[]`
* **Input limits:** 1 to 30,000 lowercase letters in each string.

#### 3.2.2 How to Think About It
For `p = "abc"`, look at groups of three letters in `s`. The first group, `"cba"`, has one `a`, one `b`, and one `c`, so save its start position. When the group moves, remove the letter that leaves and add the one that enters. Save a position whenever the letter counts match.

#### 3.2.3 Brute Force Approach & Bottleneck
The slow method cuts out every group of length `k`, sorts its letters, and compares it with sorted `p`:

```javascript
function findAnagramsBrute(s, p) {
  const result = [];
  const k = p.length;
  const sortedP = p.split("").sort().join("");

  for (let i = 0; i <= s.length - k; i++) {
    // ❌ Slices and sorts every substring
    if (s.slice(i, i + k).split("").sort().join("") === sortedP) {
      result.push(i);
    }
  }
  return result;
}
```

* **The slow part:** Sorting every group takes `O(k log k)` time. Doing this for all groups takes `O(n * k log k)` time and creates many temporary strings.

#### 3.2.4 The Pattern Insight
Do not sort each group. Count the letters instead.
* The group size is `p.length`.
* Use one 26-number array for `p` and one for the current group.
* When the window moves, subtract the leaving letter and add the entering letter.
* Compare the 26 counts. Since there are always 26 lowercase letters, this check takes a fixed amount of work.

#### 3.2.5 Pseudocode

```text
FUNCTION FindAnagrams(s, p):
  IF length(s) < length(p) RETURN []

  k = length(p)
  pCount = Array of 26 zeroes
  sCount = Array of 26 zeroes
  result = []

  FOR i FROM 0 TO k - 1:
    pCount[p[i] - 'a']++
    sCount[s[i] - 'a']++

  IF pCount == sCount THEN result.append(0)

  FOR i FROM k TO length(s) - 1:
    sCount[s[i] - 'a']++
    sCount[s[i - k] - 'a']--

    IF pCount == sCount THEN result.append(i - k + 1)

  RETURN result
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Keeps letter counts and updates them as the window moves.
function findAnagrams(s, p) {
  const result = [];
  if (typeof s !== "string" || typeof p !== "string" || s.length < p.length) {
    return result;
  }

  const k = p.length;
  const pCount = new Int32Array(26);
  const sCount = new Int32Array(26);
  const aCode = 97; // 'a'.charCodeAt(0)

  // Count letters in p and in the first group of s.
  for (let i = 0; i < k; i++) {
    pCount[p.charCodeAt(i) - aCode]++;
    sCount[s.charCodeAt(i) - aCode]++;
  }

  if (arraysEqual(pCount, sCount)) {
    result.push(0);
  }

  // Move the window across the rest of s.
  for (let i = k; i < s.length; i++) {
    sCount[s.charCodeAt(i) - aCode]++;       // Add the new letter.
    sCount[s.charCodeAt(i - k) - aCode]--;   // Remove the old letter.

    if (arraysEqual(pCount, sCount)) {
      result.push(i - k + 1);
    }
  }

  return result;
}

// Check the counts for all 26 lowercase letters.
function arraysEqual(a, b) {
  for (let i = 0; i < 26; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// Example runs
console.log(findAnagrams("cbaebabacd", "abc")); // [ 0, 6 ]
console.log(findAnagrams("abab", "ab"));         // [ 0, 1, 2 ]
console.log(findAnagrams("hello", "world"));     // []
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Makes a new Map for every group.
function buggyFindAnagramsMap(s, p) {
  const result = [];
  // This repeats the counting work for every group.
  for (let i = 0; i <= s.length - p.length; i++) {
    const map = new Map();
    for (let j = i; j < i + p.length; j++) {
      map.set(s[j], (map.get(s[j]) || 0) + 1);
    }
    // Checking equality with p requires additional iteration...
  }
  return result;
}
```
* **Why it is slow:** Making a new `Map` for every group repeats the counting work. Keep and update one set of counts as the window moves.

#### 3.2.8 Complexity Derivation
* **Time:** `O(n)`, where `n = s.length`. Count the first group, then check each next group once. Comparing counts checks the same 26 letters each time.
* **Extra space:** `O(1)`. The function uses two arrays with 26 slots each.

---

### 3.3 Permutation in String

#### 3.3.1 Problem Statement
Given strings `s1` and `s2`, return `true` if some group in `s2` has the same letters as `s1`. Otherwise, return `false`.

* **Input:** `s1 = "ab"`, `s2 = "eidbaooo"` -> **Output:** `true` (`"ba"` has the same letters as `"ab"`.)
* **Input:** `s1 = "ab"`, `s2 = "eidboaoo"` -> **Output:** `false`
* **Input:** `s1 = "adc"`, `s2 = "dcda"` -> **Output:** `true`
* **Input limits:** 1 to 10,000 lowercase letters in each string.

#### 3.3.2 How to Think About It
Every rearrangement of `s1` has the same length and the same letter counts. Check each group of that length in `s2`. If its letter counts match, return `true`.

#### 3.3.3 Brute Force Approach & Bottleneck
Generating all possible rearrangements takes `O(k!)` time. With 10 letters, there are more than 3.6 million possible arrangements. Counting letters in each moving group avoids making them all.

#### 3.3.4 The Pattern Insight
Use a fixed window with size `s1.length`:
* Count the letters in `s1` and in the first group of `s2`.
* Move the group across `s2`, updating only the two changed letter counts.
* Return `true` if the counts match. If no group matches, return `false`.

#### 3.3.5 Pseudocode

```text
FUNCTION CheckInclusion(s1, s2):
  IF length(s1) > length(s2) RETURN false

  k = length(s1)
  count1 = Array of 26 zeroes
  count2 = Array of 26 zeroes

  FOR i FROM 0 TO k - 1:
    count1[s1[i] - 'a']++
    count2[s2[i] - 'a']++

  IF count1 == count2 THEN RETURN true

  FOR i FROM k TO length(s2) - 1:
    count2[s2[i] - 'a']++
    count2[s2[i - k] - 'a']--

    IF count1 == count2 THEN RETURN true

  RETURN false
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Moves a fixed-size window and compares letter counts.
function checkInclusion(s1, s2) {
  if (typeof s1 !== "string" || typeof s2 !== "string" || s1.length > s2.length) {
    return false;
  }

  const k = s1.length;
  const count1 = new Int32Array(26);
  const count2 = new Int32Array(26);
  const aCode = 97;

  // Count letters in s1 and in the first window.
  for (let i = 0; i < k; i++) {
    count1[s1.charCodeAt(i) - aCode]++;
    count2[s2.charCodeAt(i) - aCode]++;
  }

  if (matches26(count1, count2)) return true;

  // Move the window across s2.
  for (let i = k; i < s2.length; i++) {
    count2[s2.charCodeAt(i) - aCode]++;
    count2[s2.charCodeAt(i - k) - aCode]--;

    if (matches26(count1, count2)) return true;
  }

  return false;
}

function matches26(arr1, arr2) {
  for (let i = 0; i < 26; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

// Example runs
console.log(checkInclusion("ab", "eidbaooo")); // true
console.log(checkInclusion("ab", "eidboaoo")); // false
console.log(checkInclusion("adc", "dcda"));     // true
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Generates every possible letter order.
function buggyCheckInclusion(s1, s2) {
  // The number of arrangements grows very quickly.
  const permutations = generatePermutations(s1);
  for (const perm of permutations) {
    if (s2.includes(perm)) return true;
  }
  return false;
}
```
* **Why it is a poor fit:** The number of arrangements grows very quickly. Counting letters in each window is simpler and does not create all those strings.

#### 3.3.8 Complexity Derivation
* **Time:** `O(n)`, where `n` is the length of `s2`. Count the first group, then check each next group once.
* **Extra space:** `O(1)`. The function uses two arrays with 26 slots each.

---

## 4. Tricky Edge Cases

* **Window too large:** If `k` is bigger than the array or string, there is no full window. Check this before reading its values.
* **All values are negative:** Start the best sum from the first window, not from `0`.
* **Average:** Keep a sum while the window moves. Divide by `k` at the end.
* **One-item window:** When `k = 1`, each item is its own window.

---

## 5. Summary Cheat Sheet

* The window always has `k` items.
* On each move, subtract the value that leaves and add the value that enters.
* Reusing the total takes `O(n)` time instead of adding every group again in `O(n * k)` time.
* For lowercase letter counts, use two 26-slot arrays.
* Avoid copying and sorting each group when a running total or counts are enough.

---

## 6. Practice Problems

### 6.1 Substrings of Size Three with Distinct Characters

Given a string `s`, return the number of good substrings of length three. A string is good if there are no repeated characters.

* **Difficulty:** Easy | **Focus:** Fixed Window Validation
* **Input:** `s = "xyzzaz"` -> **Output:** `1` (Only `"xyz"` has three different letters.)
* **Input:** `s = "aababcabc"` -> **Output:** `4`
* **Input:** `s = "aa"` -> **Output:** `0`
* **Input limits:** 1 to 100 lowercase letters.
* **Hint 1:** Check each group of three using its three indexes.
* **Hint 2:** Add to the count only when all three letters are different.

---

### 6.2 Maximum Number of Vowels in a Substring of Given Length

Given a string `s` and an integer `k`, return the maximum number of vowel letters (`'a'`, `'e'`, `'i'`, `'o'`, `'u'`) in any substring of `s` with length `k`.

* **Difficulty:** Medium | **Focus:** Rolling Count State Transition
* **Input:** `s = "abciiidef"`, `k = 3` -> **Output:** `3` (The group `"iii"` has three vowels.)
* **Input:** `s = "aeiou"`, `k = 2` -> **Output:** `2`
* **Input:** `s = "leetcode"`, `k = 3` -> **Output:** `2`
* **Input limits:** 1 to 100,000 lowercase letters. `k` is between 1 and the string length.
* **Hint 1:** Count the vowels in the first group.
* **Hint 2:** When the group moves, add 1 if the new letter is a vowel and subtract 1 if the leaving letter is a vowel.
* **Hint 3:** Save the largest vowel count.

---

### 6.3 Sliding Window Maximum

Given an array `nums` and a window size `k`, return the largest value in each window as it moves from left to right.

* **Difficulty:** Hard | **Focus:** Monotonic Deque Optimization
* **Input:** `nums = [1, 3, -1, -3, 5, 3, 6, 7]`, `k = 3` -> **Output:** `[3, 3, 5, 5, 6, 7]`
* **Input:** `nums = [1]`, `k = 1` -> **Output:** `[1]`
* **Input:** `nums = [1, -1]`, `k = 1` -> **Output:** `[1, -1]`
* **Input limits:** 1 to 100,000 values. `k` is between 1 and the array length.
* **Hint 1:** A smaller value before a new, larger value cannot be the maximum while both are in the window.
* **Hint 2:** Keep indexes in a deque. The values at those indexes stay in largest-to-smallest order.
* **Hint 3:** Remove indexes that leave the window. The first index in the deque points to the current maximum.

---

<nav aria-label="Lecture navigation">

[Previous: Fast & Slow Pointers](day-07-two-pointers-fast-slow-and-partitioning.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Variable Sliding Window](day-09-sliding-window-variable-size.md)

</nav>
