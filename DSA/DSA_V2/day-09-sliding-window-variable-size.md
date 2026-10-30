# Day 09: Variable Sliding Window

<nav aria-label="Lecture navigation">

[Previous: Fixed Sliding Window](day-08-sliding-window-fixed-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Prefix Sum & Subarray Totals](day-10-prefix-sum-and-subarray-totals.md)

</nav>

---

## 1. Variable Sliding Window

A **Variable Sliding Window** is an algorithmic pattern where the left and right boundaries of a window expand and contract dynamically based on problem-specific constraints.

Instead of testing all $\frac{n(n+1)}{2}$ possible contiguous subarrays ($O(n^2)$ or $O(n^3)$), the algorithm uses two pointers:
* The **`right` pointer** advances forward, expanding the window to incorporate new data.
* The **`left` pointer** advances forward, contracting the window whenever the current range violates problem constraints (or to find the minimal boundary).

Because both pointers move strictly from left to right and never move backward, the entire array is processed in **amortized $O(n)$ linear time**.

To picture this physically, imagine a caterpillar crawling along a tree branch:
1. **The Head (`right` pointer):** Extends forward, exploring new leaves and stretching the caterpillar's body longer.
2. **The Body (The Window):** Represents the active contiguous subarray or substring.
3. **The Tail (`left` pointer):** When the body touches a thorn (violating a constraint like a duplicate character or exceeding an allowed sum), the tail pulls forward, contracting the body until the caterpillar is valid again.

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

Variable sliding window problems divide cleanly into two opposing strategies depending on whether the problem asks to maximize or minimize:

```text
┌────────────────────────────────────────────────────────────────────────┐
│               VARIABLE SLIDING WINDOW STRATEGY MATRIX                  │
├─────────────────────────┬──────────────────────┬───────────────────────┤
│ Property                │ Strategy 1: Longest  │ Strategy 2: Shortest  │
├─────────────────────────┼──────────────────────┼───────────────────────┤
│ Target Goal             │ Maximize window size │ Minimize window size  │
│ Contraction Condition   │ WHILE window INVALID │ WHILE window VALID    │
│ Update Location         │ AFTER while loop     │ INSIDE while loop     │
│ Initialization          │ maxLen = 0           │ minLen = Infinity     │
│ Canonical Example       │ LC 3 (Longest Substr)│ LC 209 (Min Subarray) │
└─────────────────────────┴──────────────────────┴───────────────────────┘
```

---

### 1.2 Amortized Linear Complexity Proof

At first glance, a `while` loop nested inside a `for` loop looks quadratic ($O(n^2)$):

```javascript
for (let right = 0; right < n; right++) {
  while (windowIsInvalid) {
    left++;
  }
}
```

**Why this is guaranteed to run in $O(n)$ time:**
1. The `right` pointer increments exactly $n$ times (one per iteration of the `for` loop).
2. The `left` pointer only increments (`left++`). It **never moves backward and never resets to 0**.
3. Across the entire execution of the program, `left` can increment at most $n$ times before reaching `right`.
4. Total pointer operations: $n \text{ (right increments)} + n \text{ (left increments)} \le 2n$.
5. $O(2n) \implies \mathbf{O(n)}$ linear time.

> [!NOTE]
> **Self-Check:** Why does the variable sliding window pattern fail if an array contains negative numbers in a subarray sum problem?  
> *Answer:* Negative numbers destroy **monotonicity**. Adding an element can decrease the sum, and contracting `left` can increase the sum. The contract that advancing `left` strictly shrinks the sum no longer holds, causing valid subarrays to be skipped. Use **Prefix Sum + Hash Map (Day 10)** for negative numbers.

---

### 1.3 Operations Reference Table

| Operation | Role in Variable Window | Time Complexity | Auxiliary Space | Code Example |
| :--- | :--- | :---: | :---: | :--- |
| **Expand Right** | Incorporate incoming element `s[right]` into state | $O(1)$ | $O(1)$ | `seen.set(s[right], right)` |
| **Contract Left** | Shrink window from `left` until invariant restored | $O(1)$ amortized | $O(1)$ | `while (invalid) { left++; }` |
| **Direct Jump Left** | Fast-forward `left` past previous duplicate | $O(1)$ | $O(1)$ | `left = lastSeen.get(char) + 1` |
| **Window Length Query** | Calculate current active window span | $O(1)$ | $O(1)$ | `const len = right - left + 1` |
| **Update Optimal Bound**| Record longest or shortest valid window | $O(1)$ | $O(1)$ | `maxLen = Math.max(maxLen, len)` |

---

## 2. Pattern Overview

### 2.1 Pattern Family
* **Longest Valid Window (Strategy 1):** Eagerly expand `right`, contract `left` while invalid, record `maxLen` after the `while` loop.
* **Shortest Valid Window (Strategy 2):** Expand `right`, contract `left` while valid, record `minLen` inside the `while` loop before shrinking.
* **Character Frequency Window:** Tracking unique characters or counts using a `Map` or 128-slot ASCII array.
* **Tolerated Flips / Errors Window:** Maintaining a count of zero/error elements and contracting when `zeros > k`.

### 2.2 Pattern Recognition Table

| Problem Keyword | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| **"Longest substring without repeating characters"** | Maximize unique contiguous characters. | Strategy 1: Set / Map + contract on duplicate. |
| **"Minimum size subarray with sum $\ge target$"** | Minimize length of positive subarray $\ge target$. | Strategy 2: Accumulate sum + contract while valid. |
| **"Max consecutive ones with at most K flips"** | Maximize sequence containing $\le K$ zeroes. | Strategy 1: Expand right, shrink when `zeroes > k`. |
| **"Longest substring with at most K distinct chars"** | Maximize length where `map.size <= k`. | Strategy 1: Frequency map + shrink when `size > k`. |
| **"Minimum window substring"** | Smallest substring containing all target characters. | Strategy 2: Character requirements map + contract while formed. |

### 2.3 When to Use vs When NOT to Use
* **When to Use**:
* The problem asks for the **longest** or **shortest** contiguous subarray or substring satisfying a condition.
* The collection exhibits **monotonicity** (e.g. positive numbers where adding increases value, removing decreases value).
* The validity of the window can be tracked incrementally in $O(1)$ time per pointer movement.

* **When NOT to Use**:
* The array contains negative numbers with sum targets (monotonicity breaks; use **Prefix Sum**, Day 10).
* You can pick elements out of order or skip items (use **Greedy** or **Dynamic Programming**).
* The window has a predetermined constant size (use **Fixed Sliding Window**, Day 08).

### 2.4 The 10^7 Operations Rule
If $n = 50,000$:
* Testing all $\frac{n(n+1)}{2} \approx 1.25 \times 10^9$ pairs in nested loops takes over **12 seconds**, triggering a Timeout error.
* A variable sliding window visits each element at most twice ($2n = 100,000$ operations), finishing in **under 2 milliseconds**.

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
  *(The answer is `"wke"`, with length 3. Note that `"pwke"` is a subsequence, not a contiguous substring)*
* **Constraints:** $0 \le s.length \le 5 \times 10^4$, `s` consists of English letters, digits, symbols, and spaces.

#### 3.1.2 How to Think About It
Cards on a table: `"a b c a b c b b"`.
Start reading cards from left to right:
1. `right = 0` (`'a'`): First time seeing `'a'`. Valid window: `[a]`, length = 1.
2. `right = 1` (`'b'`): First time seeing `'b'`. Valid window: `[a, b]`, length = 2.
3. `right = 2` (`'c'`): First time seeing `'c'`. Valid window: `[a, b, c]`, length = 3.
4. `right = 3` (`'a'`): We have seen `'a'` before at index 0!
   Instead of restarting from scratch, jump your left finger past the old `'a'` to index 1 (`left = 1`).
   The window is now `[b, c, a]`, length = 3.
5. Continue scanning to the end. The maximum length confirmed is 3.

#### 3.1.3 Brute Force Approach & Bottleneck
The naive approach generates all substrings and tests each for duplicate characters using a Set:

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

* **The Bottleneck:** Quadratic $O(n^2)$ time ($2.5 \times 10^9$ operations for $50,000$ characters). When a duplicate `'a'` appears in `"abca"`, brute force discards `"bc"` and restarts scanning at `"b"`, repeating work that was already verified.

#### 3.1.4 The Pattern Insight
Use a **Variable Sliding Window with Last-Seen Index Map**:
* Store each character's latest index: `char -> lastSeenIndex`.
* When `s[right]` is already in our map and its index is $\ge left$, jump `left = lastSeenIndex + 1` directly.
* Update `maxLen = Math.max(maxLen, right - left + 1)`.
* Every character is processed in $O(1)$ time, eliminating all redundant rescanning.

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
* **Why it fails:** Calling `.shift()` and `.includes()` degrades time complexity to $O(n \cdot k)$ and creates heavy garbage collection pauses from continuous array mutations.

#### 3.1.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The `right` pointer scans from $0$ to $n - 1$ once. Hash Map lookups and updates run in $O(1)$ time. Total operations: $n \implies O(n)$.
* **Auxiliary Space Complexity:** $\mathbf{O(\min(n, m))}$, where $m$ is the size of the character alphabet (e.g. at most 128 for ASCII or 26 for lowercase letters).

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
Weights on a scale with target = 7: `[ 2, 3, 1, 2, 4, 3 ]`.
1. Add 2 $\to$ sum = 2 (too small).
2. Add 3 $\to$ sum = 5 (too small).
3. Add 1 $\to$ sum = 6 (too small).
4. Add 2 $\to$ sum = 8. Target reached! Window is `[2, 3, 1, 2]`, length = 4.
   Can we make it smaller?
   Remove 2 from left $\to$ sum = 6. Fell below target.
5. Add 4 $\to$ sum = 10. Target reached! Window is `[3, 1, 2, 4]`, length = 4.
   Shrink from left: remove 3 $\to$ sum = 7. Still valid! Length = 3 (`[1, 2, 4]`).
   Remove 1 $\to$ sum = 6. Fell below target.
6. Add 3 $\to$ sum = 9. Target reached! Window is `[2, 4, 3]`, length = 3.
   Shrink left: remove 2 $\to$ sum = 7. Valid! Length = 2 (`[4, 3]`).
   Remove 4 $\to$ sum = 3. Fell below target.
7. Smallest valid window length found is 2.

#### 3.2.3 Brute Force Approach & Bottleneck
The naive approach tests all subarrays starting from every index:

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

* **The Bottleneck:** Evaluates $O(n^2)$ pairs. For $n = 100,000$, this executes $10^{10}$ additions, freezing single-threaded Node.js for tens of seconds.

#### 3.2.4 The Pattern Insight
Because all elements are strictly positive, the sum is **monotonic**:
* Adding an element strictly increases the sum.
* Subtracting an element strictly decreases the sum.
Use **Strategy 2 (Shortest Window)**:
* Advance `right` and add `nums[right]` to `currentSum`.
* **While `currentSum >= target`:**
  - Update `minLen = Math.min(minLen, right - left + 1)`.
  - Contract window: subtract `nums[left]` and increment `left++`.
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
* **Why it fails:** Using `if` instead of `while` contracts `left` at most once. If the subarray remains $\ge target$ after removing `nums[left]`, it fails to find the true minimal length.

#### 3.2.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The `right` pointer increments $n$ times. The `left` pointer increments at most $n$ times. Total operations: $2n \implies O(n)$.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. Only scalar integer index and sum variables are stored.

---

### 3.3 Max Consecutive Ones III

#### 3.3.1 Problem Statement
Given a binary array `nums` and an integer `k`, return the maximum number of consecutive `1`'s in the array if you can flip at most `k` `0`'s.

* **Sample Input 1:** `nums = [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0]`, `k = 2` $\to$ **Expected Output:** `6`  
  *(Flipping two zeroes at indices 4 and 5 produces `[1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1]` with length 6)*
* **Sample Input 2:** `nums = [0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1]`, `k = 3` $\to$ **Expected Output:** `10`
* **Sample Input 3:** `nums = [0, 0, 0, 0]`, `k = 0` $\to$ **Expected Output:** `0`
* **Constraints:** $1 \le nums.length \le 10^5$, `nums[i]` is either `0` or `1`, $0 \le k \le nums.length$.

#### 3.3.2 How to Think About It
Rephrase the problem in plain English:  
**Find the longest contiguous subarray that contains at most `k` zeroes.**
Whenever a window contains $\le k$ zeroes, all those zeroes can be flipped into ones, making the entire window solid ones.
1. Expand `right`: count every `0` that enters your view (`zeroCount++`).
2. If `zeroCount > k`, the window is invalid!
3. Contract `left`: advance your left finger forward until one `0` exits the window (`zeroCount--`).
4. Record the maximum valid window size seen.

#### 3.3.3 Brute Force Approach & Bottleneck
Testing all pairs of indices and counting zeroes takes $O(n^2)$ time. For $10^5$ items, this takes $10^{10}$ operations, causing complete thread freeze.

#### 3.3.4 The Pattern Insight
Use **Strategy 1 (Longest Window)**:
* `right` advances continuously, accumulating elements.
* When `nums[right] === 0`, increment `zeroCount++`.
* **While `zeroCount > k`:** if `nums[left] === 0`, decrement `zeroCount--`, then `left++`.
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
* **Why it fails:** Calling `.slice()` and `.filter()` inside nested loops creates $O(n^3)$ operations and massive memory churn, immediately timing out.

#### 3.3.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The `right` pointer runs $n$ times. The `left` pointer increments at most $n$ times. Total steps $\le 2n \implies O(n)$.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. Strictly in-place with primitive integer variables.

---

## 4. Tricky Edge Cases

* **Update Placement (Longest vs Shortest):**
  - In **Longest Window** (e.g. Longest Substring), update `maxLen` **after** the `while` loop, once validity is restored.
  - In **Shortest Window** (e.g. Min Subarray Sum), update `minLen` **inside** the `while` loop on every valid state before incrementing `left++`.
* **Zero-Target or Unreachable Sums:** In shortest window problems, if the total sum never reaches `target`, `minLen` remains `Infinity`. Always return `minLen === Infinity ? 0 : minLen`.
* **Window Length Calculation Formula:** The number of items between indices `left` and `right` inclusive is always **`right - left + 1`**. Forgetting `+ 1` is the single most common off-by-one bug.
* **Empty Input Strings and Arrays:** Always guard `if (!arr || arr.length === 0) return 0;` at line 1.

---

## 5. Summary Cheat Sheet

* **Variable Sliding Window:** Both pointers advance forward. `right` expands eagerly; `left` contracts dynamically to maintain invariants.
* **$2n$ Amortized Bound:** Because neither pointer ever resets or moves backward, total operations are capped at $2n \implies O(n)$.
* **Strategy 1 (Longest):** Shrink while invalid (`while (invalid) left++`). Record answer after `while`.
* **Strategy 2 (Shortest):** Shrink while valid (`while (valid) { update; left++; }`). Record answer inside `while`.
* **Monotonicity Precondition:** In sum problems, elements must be non-negative ($\ge 0$). For negative numbers, use Prefix Sums.

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
* **Hint 2:** Maintain a `Map` tracking frequency of fruit types in the active window.
* **Hint 3:** While `map.size > 2`, decrement count of `fruits[left]`, delete if count hits 0, and advance `left++`. After shrinking, update `maxLen = Math.max(maxLen, right - left + 1)`.

---

### 6.2 Longest Substring with At Most K Distinct Characters

Given a string `s` and an integer `k`, return the length of the longest substring of `s` that contains at most `k` distinct characters.

* **Difficulty:** Medium | **Focus:** Dynamic Character Frequencies
* **Sample Input 1:** `s = "eceba"`, `k = 2` $\to$ **Expected Output:** `3` (Substring `"ece"`)
* **Sample Input 2:** `s = "aa"`, `k = 1` $\to$ **Expected Output:** `2`
* **Constraints:** $1 \le s.length \le 5 \times 10^4$, $0 \le k \le 50$.
* **Hint 1:** Expand `right`, adding characters to a frequency `Map`.
* **Hint 2:** While `map.size > k`, decrement `s[left]` frequency, remove from map if 0, and increment `left++`.
* **Hint 3:** Update `maxLen = Math.max(maxLen, right - left + 1)`.

---

### 6.3 Minimum Window Substring

Given two strings `s` and `t`, return the minimum window substring of `s` such that every character in `t` (including duplicates) is included in the window. If there is no such substring, return `""`.

* **Difficulty:** Hard | **Focus:** Dual-Map Substring Matching
* **Sample Input 1:** `s = "ADOBECODEBANC"`, `t = "ABC"` $\to$ **Expected Output:** `"BANC"`
* **Sample Input 2:** `s = "a"`, `t = "a"` $\to$ **Expected Output:** `"a"`
* **Sample Input 3:** `s = "a"`, `t = "aa"` $\to$ **Expected Output:** `""`
* **Constraints:** $m == s.length$, $n == t.length$, $1 \le m, n \le 10^5$.
* **Hint 1:** Build a frequency map of required characters for `t`. Maintain `formed` tracking how many unique characters have their required counts satisfied in current window.
* **Hint 2:** Expand `right`. When `formed === requiredCount`, the window is valid.
* **Hint 3:** While valid, compare against `minLen`, then contract `left`: if removing `s[left]` breaks count requirement, decrement `formed--`. Advance `left++`.

---

<nav aria-label="Lecture navigation">

[Previous: Fixed Sliding Window](day-08-sliding-window-fixed-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Prefix Sum & Subarray Totals](day-10-prefix-sum-and-subarray-totals.md)

</nav>
