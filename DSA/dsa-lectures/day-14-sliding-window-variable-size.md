# Day 14: Sliding Window: Variable Size

<nav aria-label="Lecture navigation">

[Previous: Sliding Window: Fixed Size](day-13-sliding-window-fixed-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Prefix Sum and Cumulative Totals](day-15-prefix-sum-and-range-queries.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Master the **Expand & Contract Invariant** for variable-size sliding windows.
- Solve **Longest Substring Without Repeating Characters** in $O(n)$ time using a character index map.
- Implement the **At-Most $K$ Distinct Elements** pattern to solve range count problems.
- Solve **Minimum Window Substring** using a frequency match tracker.
- Prevent catastrophic backtracking and $O(n^2)$ worst cases in string processing algorithms.

## Prerequisites

- [Day 03: Strings and Text Patterns](day-03-strings-and-text-patterns.md)
- [Day 06: Frequency Counting and Hash Tables](day-06-frequency-counting-and-hash-tables.md)
- [Day 13: Sliding Window: Fixed Size](day-13-sliding-window-fixed-size.md)

---

## Core Concepts

### 1. The Variable Window Expand / Contract Rhythm

While a fixed-size window keeps its width constant, a **variable-size window** expands and contracts dynamically based on a condition:
- **`right` pointer**: Greedily expands the window to include new elements ($O(n)$ total moves).
- **`left` pointer**: Shrinks the window whenever the window **violates the required invariant** ($O(n)$ total moves).

```text
Problem: Longest Substring Without Repeating Characters
String: "p w w k e w"

1. Expand right:
   [p] w w k e w       -> Valid (len=1)
   [p w] w k e w       -> Valid (len=2)
   [p w w] k e w       -> INVALID! Duplicate 'w' detected!

2. Shrink left until valid again:
   p [w w] k e w       -> Still invalid
   p w [w] k e w       -> VALID AGAIN! (len=1)

3. Resume expanding right:
   p w [w k] e w       -> Valid (len=2)
   p w [w k e] w       -> Valid (len=3)
```

Because both `left` and `right` only advance forward and never move backward, each character is processed at most twice: **Total Time is $O(2n) = O(n)$!**

---

### 2. The Universal Variable Window Blueprint

```js
let left = 0;
let bestResult = 0;

for (let right = 0; right < arr.length; right++) {
  // 1. Expand: Add arr[right] to window state (sum, map, set)

  // 2. Contract: While window is invalid, shrink from left
  while (windowIsInvalid) {
    // Remove arr[left] from window state
    left++;
  }

  // 3. Update Result: Window [left ... right] is now valid!
  bestResult = Math.max(bestResult, right - left + 1);
}
```

---

## Detailed Explanations & Node.js Relevance

### Hash Map Optimization: Jumping the `left` Pointer

In *Longest Substring Without Repeating Characters*, when a duplicate character is encountered, we do not need to increment `left` one step at a time.
By storing the **last seen index** of each character in a `Map`, we can jump `left` directly past the previous occurrence:

```text
"a b c d b a"
       ▲   ▲
      left right (sees second 'b' at index 4)

Previous 'b' was at index 1.
Jump left directly to: Math.max(left, map.get('b') + 1) = index 2!
```
*Important*: Use `Math.max(left, ...)` because the previous occurrence of a character might be *behind* the current `left` boundary (outside the active window).

### Node.js Backend Relevance: Session Window Aggregation
In stream processing with Node.js, event streams often group telemetry by "active sessions" where a session window stays open until an inactivity threshold is reached or an error burst occurs. Variable sliding windows process these streams in linear time with $O(1)$ garbage collection overhead.

---

## JavaScript Implementation & Tracing

### 1. Longest Substring Without Repeating Characters (LeetCode 3)

```js
function lengthOfLongestSubstring(s) {
  const lastSeen = new Map(); // char -> last seen index
  let left = 0;
  let maxLength = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];

    // If character was seen inside current window, jump left past it
    if (lastSeen.has(char)) {
      left = Math.max(left, lastSeen.get(char) + 1);
    }

    lastSeen.set(char, right);
    maxLength = Math.max(maxLength, right - left + 1);
  }

  return maxLength;
}
```

### 2. Minimum Size Subarray Sum (LeetCode 209)

Find the minimal length of a contiguous subarray of which the sum is $\ge target$. If none exists, return 0.

```js
function minSubArrayLen(target, nums) {
  let left = 0;
  let currentSum = 0;
  let minLength = Infinity;

  for (let right = 0; right < nums.length; right++) {
    currentSum += nums[right];

    // While condition is satisfied, record length and try to shrink
    while (currentSum >= target) {
      minLength = Math.min(minLength, right - left + 1);
      currentSum -= nums[left];
      left++;
    }
  }

  return minLength === Infinity ? 0 : minLength;
}
```

### Step-by-Step Trace for `lengthOfLongestSubstring("abcabcbb")`

| `right` | `char` | Seen index | `left` calculation | Active Window | Window Len | `maxLength` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `0` | `'a'` | none | `0` | `"a"` | 1 | 1 |
| `1` | `'b'` | none | `0` | `"ab"` | 2 | 2 |
| `2` | `'c'` | none | `0` | `"abc"` | 3 | **3** |
| `3` | `'a'` | 0 | $\max(0, 0 + 1) = 1$ | `"bca"` | 3 | 3 |
| `4` | `'b'` | 1 | $\max(1, 1 + 1) = 2$ | `"cab"` | 3 | 3 |
| `5` | `'c'` | 2 | $\max(2, 2 + 1) = 3$ | `"abc"` | 3 | 3 |
| `6` | `'b'` | 4 | $\max(3, 4 + 1) = 5$ | `"cb"` | 2 | 3 |
| `7` | `'b'` | 6 | $\max(5, 6 + 1) = 7$ | `"b"` | 1 | 3 |

- **Time Complexity**: $O(n)$ where $n$ is string length.
- **Auxiliary Space**: $O(\min(n, m))$ where $m$ is the alphabet size ($m \le 128$ for ASCII).

---

## Common Mistakes & Interview Traps

1. **Forgetting `Math.max(left, ...)` when jumping**:
   ```js
   // WRONG:
   left = lastSeen.get(char) + 1;
   // In "abba": at index 3 ('a'), last seen 'a' is index 0.
   // But left is already at index 2 (after 'b')! Setting left = 1 moves left BACKWARD!
   ```
2. **Confusing Window Length Formula**:
   The length of a zero-indexed window `[left ... right]` is **`right - left + 1`**, NOT `right - left`.
3. **Thinking the nested while-loop makes it $O(n^2)$**:
   In interview explanations, explicitly clarify: *"Although there is a while-loop inside the for-loop, the `left` pointer only advances forward. Over the entire execution, `left` increments at most $n$ times, guaranteeing $O(n)$ amortized time."*

---

## Tricky Points & Edge Cases

- **Empty String**: `s = ""` immediately returns `0`.
- **All Identical Characters**: `s = "bbbbb"` contracts on every step, correctly outputting `1`.
- **String with No Repeats**: `s = "abcdef"` never contracts, outputting `6`.

---

## Practical Exercise

Implement **Fruit Into Baskets** (LeetCode 904):
You are visiting a farm that has a single row of fruit trees. You have two baskets, and each basket can only hold a single type of fruit. Return the maximum number of fruits you can pick in a continuous row.
- **Equivalent Problem**: Find the length of the longest contiguous subarray with at most **2** distinct numbers.
- **Acceptance Criterion**: Must run in $O(n)$ time using the sliding window frequency map blueprint.

---

## Summary

- Variable-size sliding windows solve range problems by expanding `right` and contracting `left`.
- Because both pointers only advance forward, the algorithm runs in guaranteed $O(n)$ linear time.
- Always use `Math.max(left, map.get(char) + 1)` when jumping the left pointer to prevent moving backward.
- When maximizing length, update the answer *after* contracting; when minimizing length, record the answer *during* contraction.

---

## Cheat Sheet

### Variable Window Blueprint
| Goal | Update Position | Contraction Condition |
| :--- | :--- | :--- |
| **Maximize Window** | After while loop: `max = Math.max(max, R - L + 1)` | `while (windowIsInvalid)` |
| **Minimize Window** | Inside while loop: `min = Math.min(min, R - L + 1)` | `while (windowIsValid)` |

```js
// Longest Substring Without Repeats
const map = new Map();
let left = 0, max = 0;
for (let right = 0; right < s.length; right++) {
  if (map.has(s[right])) left = Math.max(left, map.get(s[right]) + 1);
  map.set(s[right], right);
  max = Math.max(max, right - left + 1);
}
return max;
```

---

## Interview Questions

### 1. Deep Definitions and Mental Models
**Question:** Explain the difference between fixed-size and variable-size sliding windows and how to identify which one a problem requires.
- **Expected answer shape:** A fixed-size window has a predetermined constant length $k$ (e.g. "max sum of $k$ consecutive items"); the window simply shifts by subtracting `i - k` and adding `i`. A variable-size window dynamically expands and shrinks according to a constraint (e.g. "longest substring with at most $k$ distinct characters"); the size changes continuously based on the validity of the current window state.

### 2. Predict the Output and Trace Execution
**Question:** In `lengthOfLongestSubstring("abba")`, what happens at index 3 if the code does NOT use `Math.max(left, ...)`?
- **Expected answer shape:** At index 1, `left = 0`. At index 2 (second `'b'`), `left` jumps to $1 + 1 = 2$. At index 3 (second `'a'`), the last seen index of `'a'` was 0. Without `Math.max`, `left` would jump back to $0 + 1 = 1$, reviving a duplicate `'b'` into the window and producing an incorrect length of 3 (`"bba"`).

### 3. Implementation Exercise
**Question:** Write `characterReplacement(s, k)` (LeetCode 424) where you can replace at most $k$ characters to form the longest repeating character substring.
- **Expected answer shape:**
```js
function characterReplacement(s, k) {
  const counts = new Int32Array(26);
  let left = 0, maxFreq = 0, maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    const idx = s.charCodeAt(right) - 65;
    counts[idx]++;
    maxFreq = Math.max(maxFreq, counts[idx]);
    // If replacements needed (windowLen - maxFreq) > k, shrink
    if ((right - left + 1) - maxFreq > k) {
      counts[s.charCodeAt(left) - 65]--;
      left++;
    }
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}
```

### 4. Debugging and Failure Analysis
**Question:** A candidate uses `s.substring(left, right + 1).includes(char)` to check for duplicates in a sliding window. What is the time complexity?
- **Expected answer shape:** `substring()` takes $O(k)$ time to allocate a new string, and `.includes()` scans it in $O(k)$ time. Nested inside a loop of length $n$, the total runtime degrades to $O(n^2)$ time. A `Map` or `Set` must be used to perform checks in $O(1)$ time.

### 5. Design and Tradeoff Questions
**Question:** When finding the "number of subarrays with exact condition $K$" (e.g. exactly $K$ odd numbers), why is the standard variable sliding window difficult to apply directly, and how do you solve it?
- **Expected answer shape:** In variable sliding windows, as we expand, multiple left boundaries might satisfy "exactly $K$", breaking the simple greedy contraction rule. We solve this by computing:
$$\text{Exact}(K) = \text{AtMost}(K) - \text{AtMost}(K - 1)$$
$\text{AtMost}(K)$ has a monotonic property (expanding increases count, contracting decreases count), making it easily solvable with standard sliding windows.

### 6. Senior Follow-ups: Node.js Memory Pressure
**Question:** Why is maintaining a single `Int32Array(128)` preferred over a `Map` when tracking ASCII characters in a high-frequency Node.js string-parsing service?
- **Expected answer shape:** A `Map` allocates hash table nodes on the V8 heap and creates memory handles that must be traced by the garbage collector. An `Int32Array(128)` allocates a single contiguous block of 512 bytes of memory once and is mutated by index. This results in zero heap allocation churn, no GC pauses, and superior cache locality.

<nav aria-label="Lecture navigation">

[Previous: Sliding Window: Fixed Size](day-13-sliding-window-fixed-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Prefix Sum and Cumulative Totals](day-15-prefix-sum-and-range-queries.md)

</nav>
