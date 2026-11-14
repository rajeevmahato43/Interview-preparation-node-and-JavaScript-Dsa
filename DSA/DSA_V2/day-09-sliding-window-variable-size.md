# Day 09: Variable Sliding Window

<nav aria-label="Lecture navigation">

[Previous: Fixed Sliding Window](day-08-sliding-window-fixed-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Prefix Sum & Subarray Totals](day-10-prefix-sum-and-subarray-totals.md)

</nav>

---

## 1. Variable Sliding Window

A **variable window** is a group of neighboring values or letters. Its size can grow or shrink to follow the problem's rule.

Use two indexes:
* `right` moves forward and adds a new item to the window.
* `left` moves forward to remove items when the window breaks a rule.

Both indexes only move forward. Each moves at most `n` times, so the scan takes `O(n)` time.

Think of the window as a frame over the array. Move its right edge to include the next item. If the frame no longer follows the rule, move its left edge forward until it does.

```text
The Expand and Contract Rhythm:
Input string: "abcabcb", Find Longest Substring Without Repeating Characters

Step 1: Move right
[ a ] b  c  a  b  c  b          -> Valid, length = 1

Step 2: Move right
[ a  b ] c  a  b  c  b          -> Valid, length = 2

Step 3: Move right
[ a  b  c ] a  b  c  b          -> Valid, length = 3

Step 4: A repeated 'a' enters
[ a  b  c  a ] b  c  b          -> Invalid

Step 5: Move left past the old 'a'
   a [ b  c  a ] b  c  b        -> Valid again, length = 3
```

```javascript
"use strict";

// Baseline variable sliding window: Longest Substring Without Repeating Characters
function longestUniqueSubstr(s) {
  if (typeof s !== "string" || s.length === 0) return 0;

  const seen = new Set();
  let left = 0;
  let maxLen = 0;

  for (let right = 0; right < s.length; right++) {
    // While duplicate character exists, shrink window from the left
    while (seen.has(s[right])) {
      seen.delete(s[left]);
      left++;
    }

    seen.add(s[right]);
    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}

console.log(longestUniqueSubstr("abcabcbb")); // 3 ("abc")
```

---

### 1.1 Find the Longest or Shortest Window

The goal decides when to save the answer:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                 VARIABLE WINDOW STRATEGIES                             │
├─────────────────────────┬──────────────────────┬───────────────────────┤
│ Rule                    │ Longest              │ Shortest             │
├─────────────────────────┼──────────────────────┼───────────────────────┤
│ Goal                    │ Largest valid group  │ Smallest valid group │
│ Shrink Condition        │ While invalid        │ While still valid    │
│ Save Answer             │ After shrinking      │ Before each shrink   │
│ Starting Value          │ maxLen = 0           │ minLen = Infinity    │
│ Example                 │ Unique letters       │ Sum reaches target   │
└─────────────────────────┴──────────────────────┴───────────────────────┘
```

---

### 1.2 Why the Nested Loop Is Still O(n)

At first, a `while` loop inside a `for` loop may look like `O(n^2)`:

```javascript
for (let right = 0; right < n; right++) {
  while (windowIsInvalid) {
    left++;
  }
}
```

It is `O(n)` because:
1. `right` moves forward at most `n` times.
2. `left` also moves forward at most `n` times. It never goes back to 0.
3. There are at most `2n` pointer moves. `O(2n)` is `O(n)`.

> [!NOTE]
> Why can negative values break a window that searches for a target sum?
>
> *Answer:* Adding a negative value can make the sum smaller. Removing a value can make it larger. The window no longer changes in a predictable way. Use prefix sums and a Map (Day 10).

---

### 1.3 Operations Reference Table

| Operation | What it does | Time | Extra space | Example |
| :--- | :--- | :---: | :---: | :--- |
| Grow right | Add the next item | `O(1)` | `O(1)` | `seen.set(s[right], right)` |
| Shrink left | Remove items until the window is valid | `O(1)` per move | `O(1)` | `left++` |
| Jump left | Skip past an earlier copy of a letter | `O(1)` average | `O(1)` | `left = lastSeen.get(char) + 1` |
| Get window size | Count items from `left` to `right` | `O(1)` | `O(1)` | `right - left + 1` |
| Save best answer | Keep the largest or smallest size | `O(1)` | `O(1)` | `maxLen = Math.max(maxLen, len)` |

---

## 2. Pattern Overview

### 2.1 Pattern Family
* **Longest valid window:** Move `right`. While the window breaks the rule, move `left`. Save the length after it is valid.
* **Shortest valid window:** Move `right`. While the window follows the rule, save its length and move `left`.
* **Letter counts:** Use a Map to track how many times each letter appears.
* **Limited changes:** Count the items that need to change, such as zeroes that can be flipped.

### 2.2 Pattern Recognition Table

| Problem words | What it asks | Method |
| :--- | :--- | :--- |
| **"Longest group with no repeated letters"** | Find the largest group where each letter appears once. | Keep the last index of each letter. |
| **"Shortest group with sum at least `target`"** | Find the smallest positive-number group that reaches the target. | Add on the right, then shrink while the sum is large enough. |
| **"Most consecutive ones with up to `k` flips"** | Find the longest group with at most `k` zeroes. | Count zeroes and shrink when there are too many. |
| **"Longest group with at most `k` different letters"** | Find the largest group with no more than `k` letter types. | Count letters in a Map. |
| **"Shortest group containing all target letters"** | Find the smallest group with every needed letter. | Count needed letters, then shrink while the group is valid. |

### 2.3 When to Use vs When NOT to Use
* **Use it when:**
  * The problem asks for the longest or shortest group of neighboring items that follows a rule.
  * You can update the window as one item enters or leaves.
  * For a target-sum window, all numbers are positive. Adding raises the sum and removing lowers it.

* **Do not use it when:**
  * The array has negative values and the rule is about a target sum. Use prefix sums (Day 10).
  * Items do not need to be next to each other.
  * The window size is fixed. Use the fixed window (Day 8).

### 2.4 The 10^7 Operations Rule
For `n = 50,000`:
* Checking every group can mean about 1.25 billion checks.
* A variable window moves each pointer forward at most `n` times, for at most about 100,000 moves.
* `10^7` steps is only a rough guide. Actual run time depends on the computer and the code.

---

## 3. Problem Walkthroughs

---

### 3.1 Longest Substring Without Repeating Characters

#### 3.1.1 Problem Statement
Given a string `s`, find the length of its longest group of neighboring characters with no repeats.

* **Input:** `s = "abcabcbb"` -> **Output:** `3` (The group `"abc"` has length 3.)
* **Input:** `s = "bbbbb"` -> **Output:** `1`
* **Input:** `s = "pwwkew"` -> **Output:** `3` (The group `"wke"` has length 3.)
* **Input limits:** 0 to 50,000 English letters, digits, symbols, or spaces.

#### 3.1.2 How to Think About It
Read `"abcabcbb"` from left to right. The group `"abc"` has no repeated letters. When the next `a` arrives, move `left` past the old `a`. The group is now `"bca"`, which is still valid. Keep the longest valid group seen.

#### 3.1.3 Brute Force Approach & Bottleneck
The naive way creates every possible sub-string and checks each for duplicate characters using a Set:

```javascript
function lengthOfLongestSubstringBrute(s) {
  let maxLen = 0;
  for (let i = 0; i < s.length; i++) {
    const seen = new Set();
    for (let j = i; j < s.length; j++) {
      if (seen.has(s[j])) break;
      seen.add(s[j]);
      maxLen = Math.max(maxLen, j - i + 1);
    }
  }
  return maxLen;
}
```

* **The slow part:** The loops can take `O(n^2)` time. They check many of the same letters again. When a repeated letter appears, the window method keeps the useful part instead of starting over.

#### 3.1.4 The Pattern Insight
Use a window and a Map that stores the last index of each character:
* If a repeated character is still inside the window, move `left` to the spot after its old position.
* Save the length `right - left + 1` if it is the largest so far.
* A character outside the current window does not need to be removed from the Map. Its old index is before `left`.

#### 3.1.5 Pseudocode

```text
FUNCTION LengthOfLongestSubstring(s):
  lastSeen = Map()
  left = 0
  maxLen = 0

  FOR right FROM 0 TO length(s) - 1:
    char = s[right]

    IF lastSeen.has(char) AND lastSeen.get(char) >= left:
      left = lastSeen.get(char) + 1

    lastSeen.set(char, right)
    maxLen = MAX(maxLen, right - left + 1)

  RETURN maxLen
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Remembers the last index of each character.
function lengthOfLongestSubstring(s) {
  if (typeof s !== "string" || s.length === 0) return 0;

  const lastSeen = new Map(); // Character -> last index.
  let left = 0;
  let maxLen = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];

    // Move past the old character if it is still in the window.
    if (lastSeen.has(char) && lastSeen.get(char) >= left) {
      left = lastSeen.get(char) + 1;
    }

    lastSeen.set(char, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}

// Example runs
console.log(lengthOfLongestSubstring("abcabcbb")); // 3
console.log(lengthOfLongestSubstring("bbbbb"));    // 1
console.log(lengthOfLongestSubstring("pwwkew"));   // 3
console.log(lengthOfLongestSubstring(""));         // 0
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Searches and shifts an array on every step.
function buggyLengthOfLongestSubstring(s) {
  let maxLen = 0;
  const currentWindow = [];

  // includes() scans the window, and shift() moves its remaining items.
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    while (currentWindow.includes(char)) {
      currentWindow.shift();
    }
    currentWindow.push(char);
    maxLen = Math.max(maxLen, currentWindow.length);
  }
  return maxLen;
}
```
* **Why it is slow:** `includes()` scans the current group, and `shift()` moves its remaining items. Repeating this work can take `O(n * k)` time.

#### 3.1.8 Complexity Derivation
* **Time:** `O(n)`. `right` visits each character once. Map checks and updates take `O(1)` time on average.
* **Extra space:** `O(d)`, where `d` is the number of different characters stored in the Map. It can be at most `O(n)`.

---

### 3.2 Minimum Size Subarray Sum

#### 3.2.1 Problem Statement
Given an array of positive numbers and a `target`, return the length of the shortest group of neighboring numbers whose sum is at least the target. Return `0` if no group works.

* **Input:** `target = 7`, `nums = [2, 3, 1, 2, 4, 3]` -> **Output:** `2` (The group `[4, 3]` sums to 7.)
* **Input:** `target = 4`, `nums = [1, 4, 4]` -> **Output:** `1`
* **Input:** `target = 11`, `nums = [1, 1, 1, 1, 1, 1, 1, 1]` -> **Output:** `0`
* **Input limits:** 1 to 100,000 positive numbers. Each number is at most 10,000. `target` is positive.

#### 3.2.2 How to Think About It
For target `7`, add values from `[2, 3, 1, 2, 4, 3]` until the sum reaches the target. The first valid group is `[2, 3, 1, 2]`, with length 4.

Now remove values from the left while the sum is still at least 7. Later, the group `[1, 2, 4]` also works. Then `[4, 3]` works and has length 2. Keep the shortest length found.

#### 3.2.3 Brute Force Approach & Bottleneck
The naive way checks every possible sub-array starting from every index:

```javascript
function minSubArrayLenBrute(target, nums) {
  let minLen = Infinity;
  for (let i = 0; i < nums.length; i++) {
    let sum = 0;
    for (let j = i; j < nums.length; j++) {
      sum += nums[j];
      if (sum >= target) {
        minLen = Math.min(minLen, j - i + 1);
        break;
      }
    }
  }
  return minLen === Infinity ? 0 : minLen;
}
```

* **The slow part:** Checking all possible groups can take `O(n^2)` time.

#### 3.2.4 The Pattern Insight
This method needs positive numbers:
* Adding a number makes the sum larger.
* Removing a number makes the sum smaller.

Move `right` forward and add its value. While the sum is at least `target`, save the current length, remove the value at `left`, and move `left` forward. Each pointer moves at most `n` times, so the scan takes `O(n)` time.

#### 3.2.5 Pseudocode

```text
FUNCTION MinSubArrayLen(target, nums):
  left = 0
  currentSum = 0
  minLen = INFINITY

  FOR right FROM 0 TO length(nums) - 1:
    currentSum = currentSum + nums[right]

    WHILE currentSum >= target:
      minLen = MIN(minLen, right - left + 1)
      currentSum = currentSum - nums[left]
      left = left + 1

  RETURN minLen == INFINITY ? 0 : minLen
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Shrinks the window while its sum is still large enough.
function minSubArrayLen(target, nums) {
  if (!Array.isArray(nums) || nums.length === 0 || target <= 0) return 0;

  let left = 0;
  let currentSum = 0;
  let minLen = Infinity;

  for (let right = 0; right < nums.length; right++) {
    currentSum += nums[right];

    // Save this length before removing the left value.
    while (currentSum >= target) {
      const windowLen = right - left + 1;
      if (windowLen < minLen) {
        minLen = windowLen;
      }

      currentSum -= nums[left];
      left++;
    }
  }

  return minLen === Infinity ? 0 : minLen;
}

// Example runs
console.log(minSubArrayLen(7, [2, 3, 1, 2, 4, 3])); // 2
console.log(minSubArrayLen(4, [1, 4, 4]));          // 1
console.log(minSubArrayLen(11, [1, 1, 1, 1, 1]));   // 0
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Removes only one value at a time.
function buggyMinSubArrayLenIf(target, nums) {
  let left = 0, currentSum = 0, minLen = Infinity;
  for (let right = 0; right < nums.length; right++) {
    currentSum += nums[right];
    // The window may still reach the target after this one removal.
    if (currentSum >= target) {
      minLen = Math.min(minLen, right - left + 1);
      currentSum -= nums[left++];
    }
  }
  return minLen === Infinity ? 0 : minLen;
}
```
* **Why it fails:** One removal may not be enough. Keep shrinking while the sum is still at least `target`, and save each valid length.

#### 3.2.8 Complexity Derivation
* **Time:** `O(n)`. Each pointer moves forward at most `n` times.
* **Extra space:** `O(1)`. The function uses a few number variables.

---

### 3.3 Max Consecutive Ones III

#### 3.3.1 Problem Statement
Given an array of `0`s and `1`s, find the longest group of `1`s you can make by changing at most `k` zeroes to ones.

* **Input:** `nums = [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0]`, `k = 2` -> **Output:** `6`
* **Input:** `nums = [0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1]`, `k = 3` -> **Output:** `10`
* **Input:** `nums = [0, 0, 0, 0]`, `k = 0` -> **Output:** `0`
* **Input limits:** 1 to 100,000 values. Each value is 0 or 1. `k` is between 0 and the array length.

#### 3.3.2 How to Think About It
The window can contain at most `k` zeroes. Count zeroes as they enter. If there are too many, move `left` until one leaves. Save the largest valid window size.

#### 3.3.3 Brute Force Approach & Bottleneck
Checking every group and counting its zeroes can take `O(n^2)` time.

#### 3.3.4 The Pattern Insight
Use the longest-window method:
* When a zero enters, add 1 to `zeroCount`.
* While `zeroCount > k`, move `left` forward. Subtract 1 from `zeroCount` when a zero leaves.
* When the window is valid, save its length.

#### 3.3.5 Pseudocode

```text
FUNCTION LongestOnes(nums, k):
  left = 0
  zeroCount = 0
  maxLen = 0

  FOR right FROM 0 TO length(nums) - 1:
    IF nums[right] == 0:
      zeroCount = zeroCount + 1

    WHILE zeroCount > k:
      IF nums[left] == 0:
        zeroCount = zeroCount - 1
      left = left + 1

    maxLen = MAX(maxLen, right - left + 1)

  RETURN maxLen
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Keeps at most k zeroes in the window.
function longestOnes(nums, k) {
  if (!Array.isArray(nums) || nums.length === 0 || k < 0) return 0;

  let left = 0;
  let zeroCount = 0;
  let maxLen = 0;

  for (let right = 0; right < nums.length; right++) {
    // Count a zero that enters.
    if (nums[right] === 0) {
      zeroCount++;
    }

    // Move left until the window has at most k zeroes.
    while (zeroCount > k) {
      if (nums[left] === 0) {
        zeroCount--;
      }
      left++;
    }

    // Save the length of this valid window.
    const currentLen = right - left + 1;
    if (currentLen > maxLen) {
      maxLen = currentLen;
    }
  }

  return maxLen;
}

// Example runs
console.log(longestOnes([1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], 2)); // 6
console.log(longestOnes([0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1], 3)); // 10
console.log(longestOnes([0, 0, 0, 0], 0)); // 0
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Copies each group and counts its zeroes again.
function buggyLongestOnes(nums, k) {
  let maxLen = 0;
  for (let i = 0; i < nums.length; i++) {
    for (let j = i; j < nums.length; j++) {
      // Repeatedly copying and checking each group is slow.
      const zeroes = nums.slice(i, j + 1).filter(x => x === 0).length;
      if (zeroes <= k) maxLen = Math.max(maxLen, j - i + 1);
    }
  }
  return maxLen;
}
```
* **Why it is slow:** The loops check many groups, and `slice()` and `filter()` scan and copy their values again.

#### 3.3.8 Complexity Derivation
* **Time:** `O(n)`. Each pointer moves forward at most `n` times.
* **Extra space:** `O(1)`. The function uses a few number variables.

---

## 4. Tricky Edge Cases

* **When to save the answer:** For the longest window, save the length after shrinking. For the shortest window, save each valid length before shrinking again.
* **No matching group:** If the sum never reaches `target`, return `0` instead of `Infinity`.
* **Window length:** Count both ends with `right - left + 1`.
* **Empty input:** Check for an empty array or string before starting.

---

## 5. Summary Cheat Sheet

* Both indexes move forward. `right` adds to the window; `left` removes from it.
* Each index moves at most `n` times, so the scan takes `O(n)` time.
* **Longest window:** Shrink while the rule is broken. Save the answer after shrinking.
* **Shortest window:** While the rule is met, save the answer and shrink.
* For a target-sum window, use positive numbers. Negative numbers can make the sum change in either direction; use prefix sums instead.

---

## 6. Practice Problems

### 6.1 Fruit Into Baskets

You have two baskets. Each can hold one type of fruit. Find the largest group of neighboring trees whose fruit fits in the baskets.

* **Difficulty:** Medium | **Focus:** At Most Two Fruit Types
* **Input:** `fruits = [1, 2, 1]` -> **Output:** `3`
* **Input:** `fruits = [0, 1, 2, 2]` -> **Output:** `3`
* **Input:** `fruits = [1, 2, 3, 2, 2]` -> **Output:** `4`
* **Input limits:** 1 to 100,000 trees.
* **Hint 1:** Find the longest neighboring group with at most two fruit types.
* **Hint 2:** Use a `Map` to count each type in the current group.
* **Hint 3:** While there are more than two types, move `left` and lower the count of each fruit that leaves. Remove a type when its count reaches 0.

---

### 6.2 Longest Substring with At Most K Distinct Characters

Given a string `s` and a number `k`, find the length of the longest group of neighboring characters with at most `k` different characters.

* **Difficulty:** Medium | **Focus:** Count Letters in the Window
* **Input:** `s = "eceba"`, `k = 2` -> **Output:** `3` (The group `"ece"` has length 3.)
* **Input:** `s = "aa"`, `k = 1` -> **Output:** `2`
* **Input limits:** 1 to 50,000 characters. `k` is between 0 and 50.
* **Hint 1:** Use a `Map` to count the letters in the current group.
* **Hint 2:** While the group has more than `k` different letters, move `left` and update the counts.
* **Hint 3:** Save the largest valid group length.

---

### 6.3 Minimum Window Substring

Given strings `s` and `t`, find the shortest group in `s` that contains every letter in `t`, including repeated letters. Return `""` if no such group exists.

* **Difficulty:** Hard | **Focus:** Match All Needed Letters
* **Input:** `s = "ADOBECODEBANC"`, `t = "ABC"` -> **Output:** `"BANC"`
* **Input:** `s = "a"`, `t = "a"` -> **Output:** `"a"`
* **Input:** `s = "a"`, `t = "aa"` -> **Output:** `""`
* **Input limits:** `s` and `t` each have 1 to 100,000 characters.
* **Hint 1:** Count the letters needed from `t`.
* **Hint 2:** Move `right` until the window has enough of every needed letter.
* **Hint 3:** While it has enough, save the shortest length and move `left`. Stop shrinking when the window is missing a needed letter.

---

<nav aria-label="Lecture navigation">

[Previous: Fixed Sliding Window](day-08-sliding-window-fixed-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Prefix Sum & Subarray Totals](day-10-prefix-sum-and-subarray-totals.md)

</nav>
