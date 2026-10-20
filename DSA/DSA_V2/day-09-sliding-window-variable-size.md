# Day 09: Sliding Window: Variable Size

<nav aria-label="Lecture navigation">

[Previous: Sliding Window: Fixed Size](day-08-sliding-window-fixed-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Prefix Sum & Subarray Totals](day-10-prefix-sum-and-subarray-totals.md)

</nav>

## Prerequisites

- [Day 04: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md) — Constant-time membership queries with `Set` and `Map`.
- [Day 08: Sliding Window: Fixed Size](day-08-sliding-window-fixed-size.md) — Window state transitions and rolling updates.

---

## 1. What is a Variable Sliding Window?

A **Variable Sliding Window** is an algorithmic pattern where the left and right boundaries of a window expand and contract dynamically based on problem-specific constraints.

> **Variable Sliding Window**: A two-pointer technique where the `right` pointer eagerly expands the window to incorporate new data, and the `left` pointer contracts the window to restore an invariant or find a minimal boundary, processing $n$ elements in amortized $O(n)$ time and $O(1)$ or $O(k)$ space.

### The Caterpillar Analogy

Think of a caterpillar moving across a leaf:
1. **The Head (`right` pointer):** Extends forward, exploring new territory and eating leaf segments.
2. **The Body (The Window):** Stretches longer and longer as the head moves forward.
3. **The Tail (`left` pointer):** When the body stretches too far or touches a thorn (violating a constraint like a duplicate character or exceeding a sum limit), the tail pulls forward, contracting the body until the caterpillar is comfortable and valid again.

```text
The Expand and Contract Rhythm:
Input: "abcabcb"

Step 1: Expand right
[ a ] b c a b c b          --> Valid! Length = 1

Step 2: Expand right
[ a  b ] c a b c b         --> Valid! Length = 2

Step 3: Expand right
[ a  b  c ] a b c b        --> Valid! Length = 3

Step 4: Expand right -> "a" is a duplicate!
[ a  b  c  a ] b c b       --> INVALID! Duplicate 'a' detected!

Step 5: Contract left until duplicate 'a' is eliminated
   a [ b  c  a ] b c b     --> Valid again! Length = 3
```

---

## 2. How Variable Sliding Window Works Step-by-Step

Variable sliding window problems divide into two major operational templates:

```text
+--------------------------------------------------------------------------+
|                  THE TWO VARIABLE WINDOW STRATEGIES                      |
+--------------------------------------------------------------------------+
|  Strategy 1: Find LONGEST Valid Window (e.g. Longest Substring)          |
|  - Advance `right` on every loop iteration.                              |
|  - While window is INVALID: contract `left++` to restore validity.       |
|  - Update answer AFTER loop: `maxLength = Math.max(maxLength, len)`     |
+--------------------------------------------------------------------------+
|  Strategy 2: Find SHORTEST Valid Window (e.g. Minimum Size Subarray)     |
|  - Advance `right` on every loop iteration to accumulate data.           |
|  - While window is VALID: update `minLen`, then contract `left++`.       |
|  - Update answer INSIDE while loop before shrinking.                     |
+--------------------------------------------------------------------------+
```

### The $2n$ Amortized Complexity Proof

Junior engineers often assume that a `while` loop nested inside a `for` loop produces an $O(n^2)$ quadratic runtime:
```javascript
for (let right = 0; right < n; right++) {
  while (condition) {
    left++;
  }
}
```

**Why this is strictly $O(n)$:**
1. The pointer `right` starts at $0$ and increments at most $n$ times.
2. The pointer `left` starts at $0$ and only moves **forward**. It never resets or moves backward.
3. Therefore, across the *entire lifetime* of the algorithm, `left` can increment at most $n$ times.
4. Total pointer operations: at most $n \text{ (right increments)} + n \text{ (left increments)} = 2n \text{ steps}$.
5. $O(2n) \implies \mathbf{O(n)}$ **linear time!**

---

## 3. Pattern Recognition of Variable Sliding Window

Spot this pattern in technical screens within 30 seconds:

### 30-Second Problem Triggers
- **Seeking "Longest" or "Shortest" contiguous segment:** The prompt uses superlatives over continuous ranges (e.g., "longest substring without...", "minimum length subarray with sum $\ge target$").
- **Constraint violation trigger:** Adding an element can invalidate the window (e.g., duplicate character, exceeding $K$ distinct types).
- **All elements are positive:** In sum-based problems, all array elements are positive ($\ge 0$), guaranteeing that adding elements strictly increases the sum and removing elements strictly decreases it.

### Problem Keywords to Look For
- *"Longest substring with at most K distinct characters"*
- *"Longest substring without repeating characters"*
- *"Minimum size subarray sum"*
- *"Smallest contiguous window containing all elements"*
- *"Maximum consecutive ones with at most K flips"*

### The 10^7 Operations Rule
- A brute force all-subarrays check tests $\frac{n(n+1)}{2}$ windows, requiring $O(n^2)$ or $O(n^3)$ operations. For $n = 50,000$, this takes $2.5 \times 10^9$ operations ($\approx 3$ seconds $\to$ Timeout).
- A Variable Sliding Window processes $n$ elements in at most $2n$ steps, executing in **under 2 milliseconds** in Node.js.

### When NOT to Use Variable Sliding Window
- **Arrays with negative numbers and exact sum targets:** If an array has negative numbers, adding an element does *not* guarantee the sum will increase! Contracting `left` does *not* guarantee the sum will decrease. Monotonicity is broken. You **must** use Prefix Sum + Hash Map (Day 10).
- **Subsequences (non-contiguous):** If you can pick arbitrary elements while skipping others, sliding window is invalid. Use Dynamic Programming or Greedy algorithms.

---

## 4. Problem 1: Longest Substring Without Repeating Characters

### Problem Statement
Given a string `s`, find the length of the **longest substring** without repeating characters.

- **Example 1:** `s = "abcabcbb"` $\to$ `3`  
  *(The answer is `"abc"`, with the length of 3)*
- **Example 2:** `s = "bbbbb"` $\to$ `1`  
  *(The answer is `"b"`, with the length of 1)*
- **Example 3:** `s = "pwwkew"` $\to$ `3`  
  *(The answer is `"wke"`, with the length of 3. Note that `"pwke"` is a subsequence, not a substring)*
- **Constraints:** $0 \le s.length \le 5 \times 10^4$. `s` consists of English letters, digits, symbols, and spaces.

---

### Step 1: Physical Simulation

Let `s = "pwwkew"`.
Imagine placing letter tiles one by one into a plastic tray from the right:

1. Insert `'p'`: Tray has `[ p ]`. Unique! Length = 1.
2. Insert `'w'`: Tray has `[ p, w ]`. Unique! Length = 2.
3. Insert `'w'`: Tray has `[ p, w, w ]`. **Duplicate `'w'` detected!**
   - Eject tiles from the left end of the tray one by one until the first `'w'` is gone:
   - Remove `'p'`: Tray has `[ w, w ]`. Still duplicate.
   - Remove `'w'`: Tray has `[ w ]`. Unique again!
4. Insert `'k'`: Tray has `[ w, k ]`. Unique! Length = 2.
5. Insert `'e'`: Tray has `[ w, k, e ]`. Unique! Length = 3. Record `maxLength = 3`.
6. Insert `'w'`: Duplicate `'w'`!
   - Remove from left: remove `'w'`.
   - Tray has `[ k, e, w ]`. Length = 3.
7. Return `3`.

---

### Step 2: Brute Force Approach

Generate every possible substring and check if all characters in it are unique using a Set:

```javascript
// Node.js code
function lengthOfLongestSubstringBruteForce(s) {
  let maxLength = 0;

  for (let i = 0; i < s.length; i++) {
    const seen = new Set();
    for (let j = i; j < s.length; j++) {
      if (seen.has(s[j])) {
        break; // Duplicate found, stop expanding this substring
      }
      seen.add(s[j]);
      maxLength = Math.max(maxLength, j - i + 1);
    }
  }

  return maxLength;
}
```

#### Complexity Analysis:
- **Time Complexity:** $O(n^2)$. Outer loop runs $n$ times; inner loop runs up to $n$ times.
- **Space Complexity:** $O(\min(n, \Sigma))$ auxiliary space for the Set.
- **Scale Failure:** For $n = 50,000$, $n^2 = 2.5 \times 10^9$ operations $\to$ Node.js freeze.

---

### Step 3: Bottleneck

Why is the brute force so wasteful?
- In `"pwwkew"`, after finding that `"pww"` has a duplicate `'w'`, the brute force restarts completely from index 1 (`"w"`).
- But we already know that `'w'` caused the collision!
- **The Wasted Work:** Throwing away all character discovery work and restarting from scratch.

---

### Step 4: The Pattern Discovery

- Maintain a dynamic window bounded by `left` and `right`.
- Store all active characters in a Hash Set:
  - If `seen.has(s[right])`, shrink from the left: `seen.delete(s[left])`, `left++` until the duplicate character is removed.
  - Add `s[right]` to `seen`.
  - Update `maxLength = Math.max(maxLength, right - left + 1)`.
- Each character enters the Set once and leaves at most once.
- Work drops from **$O(n^2)$ to $O(n)$**!

---

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(min(n, m)) space variable sliding window
function lengthOfLongestSubstring(s) {
  const seenChars = new Set();
  let left = 0;
  let maxLength = 0;

  for (let right = 0; right < s.length; right++) {
    const incomingChar = s[right];

    // Shrink window from the left while the incoming character is a duplicate
    while (seenChars.has(incomingChar)) {
      seenChars.delete(s[left]);
      left++;
    }

    // Insert current character and record maximum valid window size
    seenChars.add(incomingChar);
    const currentWindowLength = right - left + 1;
    if (currentWindowLength > maxLength) {
      maxLength = currentWindowLength;
    }
  }

  return maxLength;
}

// ❌ ANTI-PATTERN / COMMON BUG: Slicing substrings inside the loop
function buggyLongestSubstring(s) {
  let maxLen = 0;
  let left = 0;
  for (let right = 0; right < s.length; right++) {
    // BUG: indexOf on sliced substring creates O(n) scan inside loop -> O(n^2)
    const sub = s.slice(left, right);
    const dupIdx = sub.indexOf(s[right]);
    if (dupIdx !== -1) {
      left += dupIdx + 1;
    }
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}

// Example runs
console.log(lengthOfLongestSubstring("abcabcbb")); // 3 ("abc")
console.log(lengthOfLongestSubstring("bbbbb"));    // 1 ("b")
console.log(lengthOfLongestSubstring("pwwkew"));   // 3 ("wke")
console.log(lengthOfLongestSubstring(""));         // 0
console.log(lengthOfLongestSubstring(" "));        // 1 (" ")
console.log(lengthOfLongestSubstring("au"));       // 2 ("au")
```

#### Complexity Derivation:
- **Time Complexity:** $O(n)$. Each character is visited by `right` exactly once, and by `left` at most once. The `while` loop runs at most $n$ times total across all iterations of the outer loop. Total operations: $\le 2n \implies O(n)$.
- **Space Complexity:** $O(\min(n, m))$ where $m$ is the size of the character alphabet (at most 128 ASCII characters or 256 extended ASCII).

---

## 5. Problem 2: Minimum Size Subarray Sum

### Problem Statement
Given an array of positive integers `nums` and a positive integer `target`, return the **minimal length** of a contiguous subarray whose sum is greater than or equal to `target`. If there is no such subarray, return `0` instead.

- **Example 1:** `target = 7`, `nums = [2, 3, 1, 2, 4, 3]` $\to$ `2`  
  *(The subarray `[4, 3]` has the minimal length under the problem constraint)*
- **Example 2:** `target = 4`, `nums = [1, 4, 4]` $\to$ `1`
- **Example 3:** `target = 11`, `nums = [1, 1, 1, 1, 1, 1, 1, 1]` $\to$ `0`
- **Constraints:** $1 \le target \le 10^9$, $1 \le nums.length \le 10^5$, $1 \le nums[i] \le 10^4$.

---

### Step 1: Physical Simulation

Let `target = 7` and `nums = [2, 3, 1, 2, 4, 3]`.
Imagine placing weights on a scale pan until the weight hits at least 7kg:

1. Add `2`: sum = 2 ($< 7$). Keep adding.
2. Add `3`: sum = 5 ($< 7$). Keep adding.
3. Add `1`: sum = 6 ($< 7$). Keep adding.
4. Add `2`: sum = 8 ($\ge 7$). **Target reached!**
   - Window is `[ 2, 3, 1, 2 ]`. Length = 4. Record `minLen = 4`.
   - Can we make it shorter? Try removing weights from the left (`left++`):
   - Remove `2`: sum = $8 - 2 = 6$ ($< 7$). Now invalid! Stop contracting.
5. Add `4`: sum = $6 + 4 = 10$ ($\ge 7$). Target reached!
   - Window is `[ 3, 1, 2, 4 ]`. Length = 4.
   - Shrink from left: Remove `3` $\to$ sum = 7 ($\ge 7$).
   - Window is `[ 1, 2, 4 ]`. Length = 3. Record `minLen = 3`.
   - Shrink from left: Remove `1` $\to$ sum = 6 ($< 7$). Invalid.
6. Add `3`: sum = $6 + 3 = 9$ ($\ge 7$). Target reached!
   - Window is `[ 2, 4, 3 ]`. Length = 3.
   - Shrink from left: Remove `2` $\to$ sum = 7 ($\ge 7$).
   - Window is `[ 4, 3 ]`. Length = 2. Record `minLen = 2`!
   - Shrink from left: Remove `4` $\to$ sum = 3 ($< 7$).
7. Return `2`.

---

### Step 2: Brute Force Approach

Examine all possible contiguous subarrays using nested loops:

```javascript
// Node.js code
function minSubArrayLenBruteForce(target, nums) {
  let minLength = Infinity;

  for (let i = 0; i < nums.length; i++) {
    let currentSum = 0;
    for (let j = i; j < nums.length; j++) {
      currentSum += nums[j];
      if (currentSum >= target) {
        minLength = Math.min(minLength, j - i + 1);
        break; // Shorter subarrays starting at i cannot exist
      }
    }
  }

  return minLength === Infinity ? 0 : minLength;
}
```

#### Complexity Analysis:
- **Time Complexity:** $O(n^2)$. Checks all pairs $(i, j)$.
- **Space Complexity:** $O(1)$.
- **Scale Failure:** At $n = 100,000$, $n^2 = 10^{10}$ operations $\to$ instant timeout.

---

### Step 3: Bottleneck

- After finding that `[2, 3, 1, 2]` sums to 8, the brute force restarts at index 1 (`[3, 1, 2, 4]`).
- It re-adds `3 + 1 + 2 = 6` from scratch.
- **The Wasted Work:** Resetting the accumulation instead of keeping the running sum.

---

### Step 4: The Pattern Discovery

- Because all numbers in `nums` are **positive** ($\ge 1$):
  - Incrementing `right` **strictly increases** the sum.
  - Incrementing `left` **strictly decreases** the sum.
- **Shrinking Strategy:**
  - Whenever `currentSum >= target`, we have a valid window.
  - Record its length: `minLength = Math.min(minLength, right - left + 1)`.
  - Immediately subtract `nums[left]` and advance `left++` to see if a shorter window is also valid!
- Time drops from **$O(n^2)$ to $O(n)$**!

---

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(1) space variable sliding window
function minSubArrayLen(target, nums) {
  let left = 0;
  let currentSum = 0;
  let minLength = Infinity;

  for (let right = 0; right < nums.length; right++) {
    currentSum += nums[right];

    // Shrink the window from the left as long as the sum condition is satisfied
    while (currentSum >= target) {
      const currentWindowLength = right - left + 1;
      if (currentWindowLength < minLength) {
        minLength = currentWindowLength;
      }

      currentSum -= nums[left];
      left++;
    }
  }

  // If minLength was never updated, no valid subarray was found
  return minLength === Infinity ? 0 : minLength;
}

// ❌ ANTI-PATTERN / COMMON BUG: Updating answer outside the while loop
function buggyMinSubArrayLen(target, nums) {
  let left = 0;
  let sum = 0;
  let minLen = Infinity;

  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    while (sum >= target) {
      sum -= nums[left++];
    }
    // BUG: Window is now INVALID (sum < target), so recording length here is wrong!
    minLen = Math.min(minLen, right - left + 2);
  }

  return minLen === Infinity ? 0 : minLen;
}

// Example runs
console.log(minSubArrayLen(7, [2, 3, 1, 2, 4, 3])); // 2 ([4, 3])
console.log(minSubArrayLen(4, [1, 4, 4]));          // 1 ([4])
console.log(minSubArrayLen(11, [1, 1, 1, 1, 1, 1])); // 0 (impossible)
console.log(minSubArrayLen(15, [1, 2, 3, 4, 5]));   // 5 ([1, 2, 3, 4, 5])
```

#### Complexity Derivation:
- **Time Complexity:** $O(n)$. Each element is added to `currentSum` by `right` once, and subtracted by `left` at most once. Both pointers move monotonically from left to right. Total operations: $\le 2n \implies O(n)$.
- **Space Complexity:** $O(1)$ auxiliary space. Only scalar numbers are used for pointers and accumulators.

---

## 6. Under the Hood: V8 & Node.js

### 1. V8 SlicedString Memory Leak Traps

When junior engineers write sliding window code on strings, they often store substrings:
```javascript
// ❌ Dangerous memory leak pattern in V8
let currentSub = s.substring(left, right);
```
In V8:
- `substring()` creates a `SlicedString` shape that holds an internal pointer to the **entire parent string** in memory to avoid copying characters.
- If the parent string is a 50MB HTTP payload and you retain small 5-character sliced substrings in a cache, V8 **cannot garbage collect the 50MB parent string**!
- Variable sliding windows avoid this completely by storing only integer indices (`left`, `right`) and measuring length with simple arithmetic: `right - left + 1`.

### 2. Monotonicity and Micro-Architectural Branch Prediction

In `minSubArrayLen`:
- Modern CPUs use dynamic branch prediction tables to anticipate whether `while (currentSum >= target)` will evaluate to true.
- Because `nums` contains positive integers, `currentSum` rises smoothly and drops smoothly, allowing CPU branch predictors to achieve over 95% branch prediction accuracy, minimizing CPU instruction pipeline flushes.

### 3. TCP Sliding Window Congestion Control

The variable sliding window pattern is the exact algorithm used in the **TCP protocol stack** inside the Node.js networking layer:
- The TCP Sender window expands (`right++`) as network ACK packets arrive cleanly (increasing throughput).
- When a packet drops or network congestion is reported (constraint violated), the TCP window shrinks immediately to throttle traffic and prevent bufferbloat.

---

## 7. Hands-On Exercise: Clean Session Token Flag Analyzer

### Scenario
A Node.js security microservice analyzes streaming session audit tokens. Each token is a string of permission flags (e.g., `"read:write:admin:read:audit"`). You must find the length of the longest continuous flag segment that contains **at most $k = 2$ distinct permission types**. A junior engineer wrote a solution using nested `.slice()` and `new Set()` calls, which caused massive V8 garbage collection pauses. You must rewrite it to run in $O(n)$ time and $O(k)$ space using a variable sliding window.

### Buggy Code
```javascript
// Node.js code
function longestKDistinctFlagsBuggy(flags, k) {
  let maxLen = 0;
  // ❌ PERFORMANCE BUG:
  // Evaluates every substring with slice() and new Set() -> O(n^2 * k) heap memory churn
  for (let i = 0; i < flags.length; i++) {
    for (let j = i + 1; j <= flags.length; j++) {
      const distinct = new Set(flags.slice(i, j));
      if (distinct.size <= k) {
        maxLen = Math.max(maxLen, j - i);
      }
    }
  }
  return maxLen;
}
```

### Acceptance Criteria
1. Must use a **Variable Sliding Window** with `left` and `right` pointers.
2. Must track distinct flag frequencies using a `Map`.
3. When `map.size > k`, shrink `left` until distinct types $\le k$.
4. Must operate in **$O(n)$ time** and **$O(k)$ auxiliary space**.
5. Must process $100,000$ flags in under 15 milliseconds.

### Solution Code

```javascript
// ✅ CORRECT: Optimal O(n) time, O(k) space variable sliding window
function longestKDistinctFlags(flags, k) {
  if (!Array.isArray(flags) || flags.length === 0 || k <= 0) {
    return 0;
  }

  // Map tracks: flagName (string) -> frequencyCount (number)
  const frequencyMap = new Map();
  let left = 0;
  let maxLength = 0;

  for (let right = 0; right < flags.length; right++) {
    const incomingFlag = flags[right];
    frequencyMap.set(incomingFlag, (frequencyMap.get(incomingFlag) || 0) + 1);

    // Contract window from left while distinct flag count exceeds k
    while (frequencyMap.size > k) {
      const outgoingFlag = flags[left];
      const count = frequencyMap.get(outgoingFlag);

      if (count === 1) {
        frequencyMap.delete(outgoingFlag); // Remove completely when count drops to zero
      } else {
        frequencyMap.set(outgoingFlag, count - 1);
      }

      left++;
    }

    // Record maximum valid window length
    const currentLength = right - left + 1;
    if (currentLength > maxLength) {
      maxLength = currentLength;
    }
  }

  return maxLength;
}

// Example runs
const flags1 = ["read", "write", "read", "admin", "read", "write"];
console.log(longestKDistinctFlags(flags1, 2)); // 3 (["read", "write", "read"])

const flags2 = ["a", "b", "c", "d"];
console.log(longestKDistinctFlags(flags2, 1)); // 1

// Benchmark test: 100,000 flags
const flagPool = ["READ", "WRITE", "DELETE", "ADMIN", "AUDIT", "EXPORT"];
const largeStream = Array.from({ length: 100000 }, (_, i) => flagPool[i % 4]);
const start = Date.now();
const result = longestKDistinctFlags(largeStream, 2);
const elapsed = Date.now() - start;

console.log(`Processed 100,000 flags in ${elapsed}ms! Result: ${result}`);
```

---

## 8. Tricky Points and Edge Cases

### 1. Removing Keys from Frequency Maps Completely
When shrinking `left`, simply doing `map.set(char, map.get(char) - 1)` is not enough!
- `map.size` counts how many **keys** exist in the Map.
- If a count reaches `0`, the key still exists in the Map: `map.get('a') === 0`, but `map.has('a') === true`!
- **Rule:** You must explicitly call `map.delete(key)` when its count hits zero:
  ```javascript
  if (count === 1) map.delete(key);
  else map.set(key, count - 1);
  ```

### 2. Returning 0 When No Subarray Meets the Target
In minimum length problems, initialize `minLength = Infinity`.
If no valid subarray was ever found (e.g., total sum of the entire array is less than `target`), return `0`, **not `Infinity`**!
```javascript
return minLength === Infinity ? 0 : minLength;
```

### 3. Strings with Unicode or Special Characters
When using an array of size 26 instead of a Map, any non-English letter or uppercase character will cause negative or out-of-bounds indexing. Use a `Map` when inputs contain arbitrary ASCII or Unicode characters.

---

## 9. Comprehensive Summary

- **Variable Sliding Window** expands `right` to explore new elements and contracts `left` to restore invariants.
- **Two Core Modes:**
  - **Maximize:** Update answer outside the `while` loop after restoring validity.
  - **Minimize:** Update answer inside the `while` loop before each contraction step.
- **Linear Complexity:** Both pointers move strictly forward, guaranteeing at most $2n$ pointer updates ($O(n)$ time).
- **Zero SlicedString Leaks:** Tracking integer indices instead of slicing substrings avoids V8 heap retention bugs.
- **Positive Number Invariant:** In sum problems, variable sliding window requires non-negative numbers to maintain monotonic sum changes.

---

## 10. Cheat Sheet

### Decision Table

| Problem Goal | While Loop Condition | Where to Update Answer | Complexity |
| :--- | :--- | :--- | :---: |
| **Longest Substring Without Repeats** | `while (seen.has(s[right]))` | After while loop: `max = Math.max(max, len)` | $O(n)$ time, $O(1)$ space |
| **Longest Subarray with $\le K$ Distinct** | `while (map.size > k)` | After while loop: `max = Math.max(max, len)` | $O(n)$ time, $O(k)$ space |
| **Shortest Subarray with Sum $\ge Target$** | `while (sum >= target)` | Inside while loop: `min = Math.min(min, len)` | $O(n)$ time, $O(1)$ space |
| **Exact Subarray Sum with Negative Numbers** | **DO NOT USE SLIDING WINDOW!** | Use Prefix Sum + Hash Map (Day 10) | $O(n)$ time, $O(n)$ space |

### Common Pitfalls List
- **The Map.size Zombie Key:** Decrementing a frequency to 0 without calling `map.delete()`, corrupting `map.size`.
- **The Infinity Leak:** Returning `Infinity` instead of `0` when no valid subarray satisfies the condition.
- **Negative Number Blindspot:** Attempting to use sliding window on arrays with negative numbers.
- **Subsequence Confusion:** Applying sliding window to problems where order does not matter.

### Reusable Variable Sliding Window Skeleton

```javascript
function variableWindowTemplate(arr, targetCondition) {
  let left = 0;
  let bestResult = 0; // or Infinity for minimum

  for (let right = 0; right < arr.length; right++) {
    // 1. Expand window with arr[right]
    addState(arr[right]);

    // 2. Shrink window while invalid (or valid for minimization)
    while (isInvalid()) {
      removeState(arr[left]);
      left++;
    }

    // 3. Record result
    bestResult = Math.max(bestResult, right - left + 1);
  }

  return bestResult;
}
```

---

## 11. Interview Q&A

### 45-Second Technical Pitch
> *"The Variable Sliding Window pattern solves optimization problems on contiguous sequences where window boundaries must dynamically expand and contract. By advancing the right pointer to explore candidates and advancing the left pointer to restore invariants, both pointers traverse the input monotonically from left to right. This guarantees an amortized O(n) runtime with O(1) or O(k) space. In Node.js backend systems, this avoids string slicing memory leaks and provides optimal throughput for streaming log parsers and token analyzers."*

---

### 1. Why do negative numbers break the variable sliding window pattern for subarray sums?
**Answer:**
The variable sliding window relies on **monotonicity**: expanding `right` must always increase the sum, and contracting `left` must always decrease the sum. When negative numbers are introduced, expanding `right` could decrease the sum, and contracting `left` could increase the sum. Because the sum changes unpredictably, the algorithm cannot make greedy decisions about when to contract or expand, potentially skipping valid smaller subarrays. For arrays with negative numbers and exact sum targets, **Prefix Sum with a Hash Map** must be used instead.

---

### 2. Can you optimize "Longest Substring Without Repeating Characters" so that `left` jumps directly instead of sliding one by one?
**Answer:**
Yes. Instead of using a `Set` and incrementing `left` one by one, use a `Map` that stores each character's **most recent index**:
```javascript
const lastSeen = new Map();
let left = 0, maxLen = 0;
for (let right = 0; right < s.length; right++) {
  if (lastSeen.has(s[right])) {
    // Jump left directly past the previous instance of s[right]
    left = Math.max(left, lastSeen.get(s[right]) + 1);
  }
  lastSeen.set(s[right], right);
  maxLen = Math.max(maxLen, right - left + 1);
}
```
This guarantees that `left` never re-scans characters, executing in exactly $n$ steps instead of $2n$ steps.

---

### 3. What will this code output, and what bug does it contain?
```javascript
function longestDistinct(nums, k) {
  const map = new Map();
  let left = 0, max = 0;
  for (let right = 0; right < nums.length; right++) {
    map.set(nums[right], (map.get(nums[right]) || 0) + 1);
    while (map.size > k) {
      map.set(nums[left], map.get(nums[left]) - 1);
      left++;
    }
    max = Math.max(max, right - left + 1);
  }
  return max;
}
console.log(longestDistinct([1, 2, 1, 3], 2));
```
**Answer:**
It enters an **infinite while loop**!
Inside the `while (map.size > k)` loop, it decrements the count of `nums[left]`, but **never deletes the key** from the Map! When the count of an element reaches `0`, the key still exists in the Map, so `map.size` never decreases. The fix is:
```javascript
const count = map.get(nums[left]) - 1;
if (count === 0) map.delete(nums[left]);
else map.set(nums[left], count);
left++;
```

---

### 4. How does the Variable Sliding Window pattern prevent heap memory leaks in Node.js?
**Answer:**
In V8, creating substrings using `str.slice()` or `str.substring()` creates `SlicedString` wrappers that maintain hidden references to the underlying root string in heap memory. In long-running Node.js processes (e.g., streaming server log parsers), retaining small substrings prevents the Garbage Collector from freeing the large original memory buffers. Variable sliding window operates entirely by updating integer pointer offsets (`left` and `right`) and computing window lengths mathematically (`right - left + 1`), keeping memory on the stack and producing **zero V8 heap allocations**.

---

## 12. Practice Problems

### 1. Max Consecutive Ones III - Medium
Given a binary array `nums` and an integer `k`, return the maximum number of consecutive `1`'s in the array if you can flip at most `k` `0`'s.
- **Sample Input 1:** `nums = [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0]`, `k = 2`
- **Expected Output 1:** `6` (Flip 0s at index 5 and 10 to get 6 consecutive 1s)
- **Sample Input 2:** `nums = [0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1]`, `k = 3`
- **Expected Output 2:** `10`
- **Sample Input 3:** `nums = [0, 0, 0]`, `k = 1`
- **Expected Output 3:** `1`

### 2. Fruit Into Baskets - Medium
You have two baskets, and each basket can only hold a **single type** of fruit. Given an integer array `fruits` where `fruits[i]` is the type of fruit produced by the $i$-th tree, return the maximum number of fruits you can pick with at most 2 baskets.
- **Sample Input 1:** `fruits = [1, 2, 1]`
- **Expected Output 1:** `3`
- **Sample Input 2:** `fruits = [0, 1, 2, 2]`
- **Expected Output 2:** `3` (Subarray `[1, 2, 2]`)
- **Sample Input 3:** `fruits = [1, 2, 3, 2, 2]`
- **Expected Output 3:** `4` (Subarray `[2, 3, 2, 2]`)

### 3. Minimum Window Substring - Hard
Given two strings `s` and `t` of lengths `m` and `n` respectively, return the minimum window substring of `s` such that every character in `t` (including duplicates) is included in the window. If there is no such substring, return the empty string `""`.
- **Sample Input 1:** `s = "ADOBECODEBANC"`, `t = "ABC"`
- **Expected Output 1:** `"BANC"`
- **Sample Input 2:** `s = "a"`, `t = "a"`
- **Expected Output 2:** `"a"`
- **Sample Input 3:** `s = "a"`, `t = "aa"`
- **Expected Output 3:** `""`

---

<nav aria-label="Lecture navigation">

[Previous: Sliding Window: Fixed Size](day-08-sliding-window-fixed-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Prefix Sum & Subarray Totals](day-10-prefix-sum-and-subarray-totals.md)

</nav>
