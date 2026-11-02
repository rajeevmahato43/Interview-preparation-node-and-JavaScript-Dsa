# Day 09: Variable Sliding Window

<nav aria-label="Lecture navigation">

[Previous: Fixed Sliding Window](day-08-sliding-window-fixed-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Prefix Sum & Subarray Totals](day-10-prefix-sum-and-subarray-totals.md)

</nav>

---

## 1. Variable Sliding Window

A **Variable Sliding Window** is a technique where the left and right edges of a window grow and shrink based on the rules of the problem.

Instead of testing all $\frac{n(n+1)}{2}$ possible contiguous subarrays ($O(n^2)$ or $O(n^3)$), we use two pointers:
* The **`right` pointer** steps forward to grow the window and take in new items.
* The **`left` pointer** steps forward to shrink the window whenever the window breaks a rule (or when we want to find the smallest valid size).

Because both pointers only move forward from left to right and never move backward, the entire array is processed in **$O(n)$ linear time**.

To picture this physically, imagine a caterpillar moving along a tree branch:
1. **The Head (`right` pointer):** Reaches forward to grab new leaves, stretching the caterpillar's body longer.
2. **The Body (The Window):** Represents the current sub-array or sub-string.
3. **The Tail (`left` pointer):** When the body touches a thorn (breaks a rule like a duplicate letter or exceeding an allowed sum), the tail pulls forward, shrinking the body until the caterpillar is safe again.

```text
The Expand and Contract Rhythm:
Input string: "abcabcb", Find Longest Substring Without Repeating Characters

Step 1: Expand right
[ a ] b  c  a  b  c  b          ──► Valid! Window length = 1

Step 2: Expand right
[ a  b ] c  a  b  c  b          ──► Valid! Window length = 2

Step 3: Expand right
[ a  b  c ] a  b  c  b          ──► Valid! Window length = 3

Step 4: Expand right (Duplicate 'a' arrives!)
[ a  b  c  a ] b  c  b          ──► INVALID! Duplicate 'a' detected!

Step 5: Contract left past first 'a'
   a [ b  c  a ] b  c  b        ──► Valid again! Window length = 3
```

```javascript
// Node.js code
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

### 1.1 The Two Operational Strategies

Variable sliding window problems divide into two simple strategies depending on whether you want to find the longest or the shortest window:

```text
┌────────────────────────────────────────────────────────────────────────┐
│               VARIABLE SLIDING WINDOW STRATEGY MATRIX                  │
├─────────────────────────┬──────────────────────┬───────────────────────┤
│ Property                │ Strategy 1: Longest  │ Strategy 2: Shortest  │
├─────────────────────────┼──────────────────────┼───────────────────────┤
│ Goal                    │ Find biggest window  │ Find smallest window  │
│ Shrink Condition        │ WHILE window INVALID │ WHILE window VALID    │
│ Update Location         │ AFTER while loop     │ INSIDE while loop     │
│ Starting Value          │ maxLen = 0           │ minLen = Infinity     │
│ Classic Example         │ Longest Substring    │ Min Subarray Sum      │
└─────────────────────────┴──────────────────────┴───────────────────────┘
```

---

### 1.2 Why the Nested Loop is Still Linear O(n)

At first glance, a `while` loop inside a `for` loop looks like $O(n^2)$:

```javascript
for (let right = 0; right < n; right++) {
  while (windowIsInvalid) {
    left++;
  }
}
```

**Why this always finishes in $O(n)$ time:**
1. The `right` pointer moves forward $n$ times (once per turn of the `for` loop).
2. The `left` pointer only moves forward (`left++`). It **never moves backward and never resets to 0**.
3. Across the entire run, `left` can move at most $n$ times before it catches up to `right`.
4. Total pointer movements: $n \text{ (right moves)} + n \text{ (left moves)} \le 2n$.
5. $O(2n)$ simplifies to **$O(n)$ linear time**.

> [!NOTE]
> **Self-Check:** Why does the variable sliding window fail if an array has negative numbers when searching for a target sum?  
> *Answer:* Negative numbers break the rule that growing the window increases the sum and shrinking the window decreases the sum. With negative numbers, adding an item could make the sum smaller, so you cannot know whether moving `left` helps or hurts. Use **Prefix Sum + Hash Map (Day 10)** for negative numbers.

---

### 1.3 Operations Reference Table

| Operation | Role in Variable Window | Time Complexity | Extra Space | Code Example |
| :--- | :--- | :---: | :---: | :--- |
| **Grow Right** | Add incoming item `s[right]` to window | $O(1)$ | $O(1)$ | `seen.set(s[right], right)` |
| **Shrink Left** | Shrink window from `left` until valid | $O(1)$ on average | $O(1)$ | `while (invalid) { left++; }` |
| **Jump Left** | Jump `left` straight past earlier duplicate | $O(1)$ | $O(1)$ | `left = lastSeen.get(char) + 1` |
| **Window Length** | Measure current window size | $O(1)$ | $O(1)$ | `const len = right - left + 1` |
| **Update Best Answer**| Save the longest or shortest window size | $O(1)$ | $O(1)$ | `maxLen = Math.max(maxLen, len)` |

---

## 2. Pattern Overview

### 2.1 Pattern Family
* **Longest Valid Window (Strategy 1):** Grow `right`, shrink `left` while invalid, record `maxLen` after the `while` loop.
* **Shortest Valid Window (Strategy 2):** Grow `right`, shrink `left` while valid, record `minLen` inside the `while` loop before shrinking.
* **Character Frequency Window:** Tracking letter counts using a `Map` or a 128-slot ASCII array.
* **Allowed Flips / Mistakes Window:** Counting zeroes or errors, and shrinking when `zeros > k`.

### 2.2 Pattern Recognition Table

| Problem Keyword | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| **"Longest substring without repeating characters"** | Find the longest sub-string with all unique letters. | Strategy 1: Map + jump `left` on duplicate. |
| **"Minimum size subarray with sum $\ge target$"** | Find the shortest positive sub-array that reaches target sum. | Strategy 2: Add to sum + shrink while sum $\ge$ target. |
| **"Max consecutive ones with at most K flips"** | Find the longest streak with at most $k$ zeroes. | Strategy 1: Grow right, shrink when `zeroes > k`. |
| **"Longest substring with at most K distinct chars"** | Find max length where `map.size <= k`. | Strategy 1: Map counts + shrink when `size > k`. |
| **"Minimum window substring"** | Smallest sub-string holding all target letters. | Strategy 2: Match needed letter counts + shrink while valid. |

### 2.3 When to Use vs When NOT to Use
* **When to Use**:
* The problem asks for the **longest** or **shortest** contiguous sub-array or sub-string matching a rule.
* All numbers are positive (so adding always increases the total, and removing always decreases the total).
* You can update the window state in $O(1)$ fast time whenever a pointer moves.

* **When NOT to Use**:
* The array contains negative numbers with sum targets (use **Prefix Sum**, Day 10).
* You can pick items out of order or skip items (use **Greedy** or **Dynamic Programming**).
* The window has a fixed constant length $k$ (use **Fixed Sliding Window**, Day 08).

### 2.4 The 10^7 Operations Rule
If $n = 50,000$:
* Testing all $\frac{n(n+1)}{2} \approx 1.25 \times 10^9$ pairs in nested loops takes over **12 seconds**, causing a timeout error.
* A variable sliding window touches each item at most twice ($2n = 100,000$ operations), finishing in **under 2 milliseconds**.

---

## 3. Problem Walkthroughs

---

### 3.1 Longest Substring Without Repeating Characters

#### 3.1.1 Problem Statement
Given a string `s`, find the length of the **longest substring** without repeating characters.

* **Sample Input 1:** `s = "abcabcbb"` $\to$ **Expected Output:** `3`  
  *(The answer is `"abc"`, with length 3)*
* **Sample Input 2:** `s = "bbbbb"` $\to$ **Expected Output:** `1`  
  *(The answer is `"b"`, with length 1)*
* **Sample Input 3:** `s = "pwwkew"` $\to$ **Expected Output:** `3`  
  *(The answer is `"wke"`, with length 3)*
* **Constraints:** $0 \le s.length \le 5 \times 10^4$, `s` consists of English letters, digits, symbols, and spaces.

#### 3.1.2 How to Think About It
Cards on a table: `"a b c a b c b b"`.  
Read the cards from left to right:
1. `right = 0` (`'a'`): First time seeing `'a'`. Window is `[a]`, length = 1.
2. `right = 1` (`'b'`): First time seeing `'b'`. Window is `[a, b]`, length = 2.
3. `right = 2` (`'c'`): First time seeing `'c'`. Window is `[a, b, c]`, length = 3.
4. `right = 3` (`'a'`): We have seen `'a'` before at index 0!  
   Instead of starting over, jump your left finger past the old `'a'` to index 1 (`left = 1`).  
   The window is now `[b, c, a]`, length = 3.
5. Keep scanning to the end. The longest valid window seen is 3.

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

* **The Bottleneck:** Quadratic $O(n^2)$ time ($2.5 \times 10^9$ operations for $50,000$ characters). When a duplicate `'a'` appears in `"abca"`, brute force throws away `"bc"` and restarts from `"b"`, checking letters it already checked.

#### 3.1.4 The Pattern Insight
Use a **Variable Sliding Window with a Last-Seen Map**:
* Store the latest index where each character appeared: `char -> lastSeenIndex`.
* When `s[right]` is already in the map and its index is $\ge left$, jump `left = lastSeenIndex + 1` directly.
* Update `maxLen = Math.max(maxLen, right - left + 1)`.
* Every character is checked in $O(1)$ time, eliminating repeated scans.

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
// ✅ CORRECT: Optimal O(n) time, O(min(n, m)) space variable sliding window with index jump
function lengthOfLongestSubstring(s) {
  if (typeof s !== "string" || s.length === 0) return 0;

  const lastSeen = new Map(); // char -> last seen index
  let left = 0;
  let maxLen = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];

    // If character was seen and its recorded position is within active window
    if (lastSeen.has(char) && lastSeen.get(char) >= left) {
      // Jump left directly past the duplicate
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
// ❌ ANTI-PATTERN: Using Array.includes() and Array.shift() inside loop
function buggyLengthOfLongestSubstring(s) {
  let maxLen = 0;
  const currentWindow = [];

  // BUG: Array.includes() and Array.shift() are O(k) linear operations inside O(n) loop
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    while (currentWindow.includes(char)) {
      currentWindow.shift(); // O(k) memory shift in RAM on every call!
    }
    currentWindow.push(char);
    maxLen = Math.max(maxLen, currentWindow.length);
  }
  return maxLen;
}
```
* **Why it fails:** Calling `.shift()` and `.includes()` inside a loop makes the code take $O(n \cdot k)$ time and creates heavy memory garbage.

#### 3.1.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The `right` pointer steps through the string once. Map lookups and writes take $O(1)$ time. Total operations: $n \implies O(n)$.
* **Auxiliary Space Complexity:** $\mathbf{O(\min(n, m))}$, where $m$ is the number of distinct characters in the alphabet (at most 128 for ASCII).

---

### 3.2 Minimum Size Subarray Sum

#### 3.2.1 Problem Statement
Given an array of positive integers `nums` and a positive integer `target`, return the **minimal length** of a contiguous subarray of which the sum is greater than or equal to `target`. If there is no such subarray, return `0` instead.

* **Sample Input 1:** `target = 7`, `nums = [2, 3, 1, 2, 4, 3]` $\to$ **Expected Output:** `2`  
  *(Subarray `[4, 3]` has minimal length 2 with sum 7)*
* **Sample Input 2:** `target = 4`, `nums = [1, 4, 4]` $\to$ **Expected Output:** `1`
* **Sample Input 3:** `target = 11`, `nums = [1, 1, 1, 1, 1, 1, 1, 1]` $\to$ **Expected Output:** `0`
* **Constraints:** $1 \le target \le 10^9$, $1 \le nums.length \le 10^5$, $1 \le nums[i] \le 10^4$.

#### 3.2.2 How to Think About It
Adding weights onto a scale with target = 7: `[ 2, 3, 1, 2, 4, 3 ]`.
1. Add 2 $\to$ sum = 2 (under target).
2. Add 3 $\to$ sum = 5 (under target).
3. Add 1 $\to$ sum = 6 (under target).
4. Add 2 $\to$ sum = 8. Target reached! Window is `[2, 3, 1, 2]`, length = 4.  
   Can we make it smaller?  
   Remove 2 from left $\to$ sum = 6. Now below target.
5. Add 4 $\to$ sum = 10. Target reached! Window is `[3, 1, 2, 4]`, length = 4.  
   Shrink from left: remove 3 $\to$ sum = 7. Still valid! Length = 3 (`[1, 2, 4]`).  
   Remove 1 $\to$ sum = 6. Below target.
6. Add 3 $\to$ sum = 9. Target reached! Window is `[2, 4, 3]`, length = 3.  
   Shrink from left: remove 2 $\to$ sum = 7. Still valid! Length = 2 (`[4, 3]`).  
   Remove 4 $\to$ sum = 3. Below target.
7. The smallest valid window length found is 2.

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

* **The Bottleneck:** Checks $O(n^2)$ pairs. For $n = 100,000$, this runs $10^{10}$ additions and freezes single-threaded Node.js for tens of seconds.

#### 3.2.4 The Pattern Insight
Because all numbers are positive, the sum is predictable:
* Adding a number always increases the sum.
* Removing a number always decreases the sum.
Use **Strategy 2 (Shortest Window)**:
* Move `right` forward and add `nums[right]` to `currentSum`.
* **While `currentSum >= target`:**
  - Update `minLen = Math.min(minLen, right - left + 1)`.
  - Shrink window: subtract `nums[left]` and increment `left++`.
* Total runtime drops from $O(n^2)$ to $O(n)$!

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
// ✅ CORRECT: Optimal O(n) time, O(1) space variable sliding window
function minSubArrayLen(target, nums) {
  if (!Array.isArray(nums) || nums.length === 0 || target <= 0) return 0;

  let left = 0;
  let currentSum = 0;
  let minLen = Infinity;

  for (let right = 0; right < nums.length; right++) {
    currentSum += nums[right];

    // Strategy 2 (Shortest Window): While condition is met, record and shrink
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
// ❌ ANTI-PATTERN: Using if instead of while during contraction
function buggyMinSubArrayLenIf(target, nums) {
  let left = 0, currentSum = 0, minLen = Infinity;
  for (let right = 0; right < nums.length; right++) {
    currentSum += nums[right];
    // BUG: Only shrinks by ONE position instead of shrinking as far as possible!
    if (currentSum >= target) {
      minLen = Math.min(minLen, right - left + 1);
      currentSum -= nums[left++];
    }
  }
  return minLen === Infinity ? 0 : minLen;
}
```
* **Why it fails:** Using `if` instead of `while` shrinks `left` only once per step. If the sub-array is still $\ge target$ after removing `nums[left]`, it misses the true shortest window.

#### 3.2.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The `right` pointer moves forward $n$ times. The `left` pointer moves forward at most $n$ times. Total steps: $2n \implies O(n)$.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. We only store simple number variables in memory.

---

### 3.3 Max Consecutive Ones III

#### 3.3.1 Problem Statement
Given a binary array `nums` and an integer `k`, return the maximum number of consecutive `1`'s in the array if you can flip at most `k` `0`'s.

* **Sample Input 1:** `nums = [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0]`, `k = 2` $\to$ **Expected Output:** `6`  
  *(Flipping two zeroes at indices 4 and 5 gives `[1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1]` with length 6)*
* **Sample Input 2:** `nums = [0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1]`, `k = 3` $\to$ **Expected Output:** `10`
* **Sample Input 3:** `nums = [0, 0, 0, 0]`, `k = 0` $\to$ **Expected Output:** `0`
* **Constraints:** $1 \le nums.length \le 10^5$, `nums[i]` is either `0` or `1`, $0 \le k \le nums.length$.

#### 3.3.2 How to Think About It
Rephrase the problem in simple English:  
**Find the longest sub-array that contains at most `k` zeroes.**  
If a window has $\le k$ zeroes, we can flip all of them to ones, turning the whole window into ones.
1. Expand `right`: count every `0` that enters the window (`zeroCount++`).
2. If `zeroCount > k`, the window has too many zeroes!
3. Shrink `left`: move your left finger forward until one `0` leaves the window (`zeroCount--`).
4. Keep track of the largest valid window size you have seen.

#### 3.3.3 Brute Force Approach & Bottleneck
Checking all pairs of indices and counting zeroes takes $O(n^2)$ time. For $10^5$ items, this takes $10^{10}$ operations and freezes Node.js.

#### 3.3.4 The Pattern Insight
Use **Strategy 1 (Longest Window)**:
* `right` moves forward continuously, taking in elements.
* When `nums[right] === 0`, add 1 to `zeroCount`.
* **While `zeroCount > k`:** if `nums[left] === 0`, subtract 1 from `zeroCount`, then increment `left++`.
* Once valid, update `maxLen = Math.max(maxLen, right - left + 1)`.

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
// ✅ CORRECT: Optimal O(n) time, O(1) space variable sliding window
function longestOnes(nums, k) {
  if (!Array.isArray(nums) || nums.length === 0 || k < 0) return 0;

  let left = 0;
  let zeroCount = 0;
  let maxLen = 0;

  for (let right = 0; right < nums.length; right++) {
    // If incoming element is zero, consume one flip allowance
    if (nums[right] === 0) {
      zeroCount++;
    }

    // Strategy 1 (Longest Window): Contract left while window is INVALID
    while (zeroCount > k) {
      if (nums[left] === 0) {
        zeroCount--;
      }
      left++;
    }

    // Record maximum valid window length
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
// ❌ ANTI-PATTERN: Slicing and filtering arrays inside the loop
function buggyLongestOnes(nums, k) {
  let maxLen = 0;
  for (let i = 0; i < nums.length; i++) {
    for (let j = i; j < nums.length; j++) {
      // BUG: Allocates a new slice and iterates to count zeroes -> O(n^3) time!
      const zeroes = nums.slice(i, j + 1).filter(x => x === 0).length;
      if (zeroes <= k) maxLen = Math.max(maxLen, j - i + 1);
    }
  }
  return maxLen;
}
```
* **Why it fails:** Calling `.slice()` and `.filter()` inside nested loops creates $O(n^3)$ operations, crashing performance immediately.

#### 3.3.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The `right` pointer moves $n$ times. The `left` pointer moves at most $n$ times. Total steps $\le 2n \implies O(n)$.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. We only use simple number variables.

---

## 4. Tricky Edge Cases

* **Where to Update Answer (Longest vs Shortest):**
  - In **Longest Window** problems (like Longest Substring), update `maxLen` **after** the `while` loop, once the window is valid again.
  - In **Shortest Window** problems (like Min Subarray Sum), update `minLen` **inside** the `while` loop while the window is valid, right before shrinking `left++`.
* **Target Sum Never Reached:** In shortest window problems, if the total sum never reaches `target`, `minLen` stays `Infinity`. Always return `minLen === Infinity ? 0 : minLen`.
* **Window Length Formula:** The number of items between index `left` and `right` inclusive is always **`right - left + 1`**. Forgetting `+ 1` is the most common off-by-one bug.
* **Empty Input Strings and Arrays:** Always check `if (!arr || arr.length === 0) return 0;` at the very start of the function.

---

## 5. Summary Cheat Sheet

* **Variable Sliding Window:** Both pointers move forward. `right` grows the window; `left` shrinks the window to keep rules satisfied.
* **$2n$ Step Limit:** Because neither pointer ever resets or moves backward, total operations are capped at $2n \implies O(n)$.
* **Strategy 1 (Longest):** Shrink while invalid (`while (invalid) left++`). Record answer after `while`.
* **Strategy 2 (Shortest):** Shrink while valid (`while (valid) { update; left++; }`). Record answer inside `while`.
* **Positive Numbers Required:** In sum problems, numbers must be positive ($\ge 0$). For negative numbers, use Prefix Sums.

---

## 6. Practice Problems

### 6.1 Fruit Into Baskets

You are visiting a farm with trees in a row. You have 2 baskets, and each basket can only hold a single type of fruit. Return the maximum total number of fruits you can pick in a contiguous sequence.

* **Difficulty:** Medium | **Focus:** At Most 2 Distinct Elements
* **Sample Input 1:** `fruits = [1, 2, 1]` $\to$ **Expected Output:** `3`
* **Sample Input 2:** `fruits = [0, 1, 2, 2]` $\to$ **Expected Output:** `3`
* **Sample Input 3:** `fruits = [1, 2, 3, 2, 2]` $\to$ **Expected Output:** `4`
* **Constraints:** $1 \le fruits.length \le 10^5$, $0 \le fruits[i] < fruits.length$.
* **Hint 1:** Rephrase: Find the length of the longest contiguous subarray with at most 2 distinct integer values.
* **Hint 2:** Use a `Map` to count the fruit types inside the current window.
* **Hint 3:** While `map.size > 2`, subtract 1 from the count of `fruits[left]`. Delete the key if its count reaches 0, and advance `left++`. After shrinking, update `maxLen = Math.max(maxLen, right - left + 1)`.

---

### 6.2 Longest Substring with At Most K Distinct Characters

Given a string `s` and an integer `k`, return the length of the longest substring of `s` that contains at most `k` distinct characters.

* **Difficulty:** Medium | **Focus:** Dynamic Character Frequencies
* **Sample Input 1:** `s = "eceba"`, `k = 2` $\to$ **Expected Output:** `3` (Substring `"ece"`)
* **Sample Input 2:** `s = "aa"`, `k = 1` $\to$ **Expected Output:** `2`
* **Constraints:** $1 \le s.length \le 5 \times 10^4$, $0 \le k \le 50$.
* **Hint 1:** Grow `right`, adding characters to a frequency `Map`.
* **Hint 2:** While `map.size > k`, subtract 1 from `s[left]` count, remove it from the map if 0, and increment `left++`.
* **Hint 3:** Update `maxLen = Math.max(maxLen, right - left + 1)`.

---

### 6.3 Minimum Window Substring

Given two strings `s` and `t`, return the minimum window substring of `s` such that every character in `t` (including duplicates) is included in the window. If there is no such substring, return `""`.

* **Difficulty:** Hard | **Focus:** Dual-Map Substring Matching
* **Sample Input 1:** `s = "ADOBECODEBANC"`, `t = "ABC"` $\to$ **Expected Output:** `"BANC"`
* **Sample Input 2:** `s = "a"`, `t = "a"` $\to$ **Expected Output:** `"a"`
* **Sample Input 3:** `s = "a"`, `t = "aa"` $\to$ **Expected Output:** `""`
* **Constraints:** $m == s.length$, $n == t.length$, $1 \le m, n \le 10^5$.
* **Hint 1:** Build a frequency map of needed characters for `t`. Keep a counter `formed` tracking how many distinct characters have their needed counts satisfied.
* **Hint 2:** Grow `right`. When `formed === requiredCount`, the window is valid.
* **Hint 3:** While valid, compare against `minLen`, then shrink `left`: if removing `s[left]` drops its count below requirement, subtract 1 from `formed`. Advance `left++`.

---

<nav aria-label="Lecture navigation">

[Previous: Fixed Sliding Window](day-08-sliding-window-fixed-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Prefix Sum & Subarray Totals](day-10-prefix-sum-and-subarray-totals.md)

</nav>
