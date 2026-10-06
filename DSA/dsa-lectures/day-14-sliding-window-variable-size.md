# Day 14: Sliding Window: Variable Size

<nav aria-label="Lecture navigation">

[Previous: Sliding Window: Fixed Size](day-13-sliding-window-fixed-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Prefix Sum and Cumulative Totals](day-15-prefix-sum-and-range-queries.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Master the **Expand & Contract Invariant** governing variable-size sliding windows.
- Prove why nested `while` loops inside a `for` loop maintain an amortized **$O(n)$ linear runtime** ($2n$ total pointer steps).
- Implement **Longest Substring Without Repeating Characters** in $O(n)$ time using pointer index jumping.
- Prevent the classic `Math.max(left, ...)` pointer regression bug when processing repeat characters.
- Solve **Minimum Size Subarray Sum** by recording answers during window contraction.
- Solve the **At-Most $K$ Distinct Elements** pattern and decompose exact count queries: $\text{Exact}(K) = \text{AtMost}(K) - \text{AtMost}(K - 1)$.
- Optimize high-throughput string parsers in Node.js using fixed `Int32Array(128)` vectors to eliminate garbage collection pauses.

---

## Prerequisites

- [Day 03: Strings and Text Patterns](day-03-strings-and-text-patterns.md) — String indexing and character codes.
- [Day 06: Frequency Counting and Hash Tables](day-06-frequency-counting-and-hash-tables.md) — Map indexing and frequency tracking.
- [Day 13: Sliding Window: Fixed Size](day-13-sliding-window-fixed-size.md) — State transition fundamentals.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
|---|---|---|
| **Variable Sliding Window** | A contiguous subsegment whose boundaries expand and contract dynamically according to validity conditions. | Solves constraint optimization problems (e.g., shortest valid or longest valid subarray) in linear time. |
| **Amortized Linear Scan** | An algorithm with nested loops where inner operations cumulatively execute at most $n$ times across the outer loop's lifecycle. | Guarantees $O(2n) = O(n)$ overall runtime despite the syntactic appearance of nested iteration. |
| **Index Jumping** | Advancing the `left` boundary directly past a duplicate element's recorded index using a `Map` rather than stepping sequentially. | Skips redundant intermediate checks, minimizing instruction counts in string parsing. |
| **Pointer Regression Bug** | A bug where `left` jumps backward to a character's index that fell outside the active window. | Prevented by wrapping jump destinations in `left = Math.max(left, lastSeen.get(char) + 1)`. |
| **At-Most $K$ Decomposition** | The mathematical equivalence: $\text{Exact}(K) = \text{AtMost}(K) - \text{AtMost}(K - 1)$. | Converts non-monotonic exact count constraints into monotonic sliding-window ranges. |

---

## Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                       VARIABLE WINDOW EXPAND / CONTRACT MECHANISM                           │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Problem: Longest Substring Without Repeating Characters
  String: "p w w k e w"

  1. EXPAND RIGHT:
     [p] w w k e w       ──> Valid: "p" (len = 1)
     [p w] w k e w       ──> Valid: "pw" (len = 2)
     [p w w] k e w       ──> INVALID! Duplicate 'w' violates uniqueness invariant!

  2. CONTRACT LEFT (until invariant restored):
     p [w w] k e w       ──> Still invalid ('w' count = 2)
     p w [w] k e w       ──> VALID AGAIN! (len = 1)

  3. RESUME EXPANDING RIGHT:
     p w [w k] e w       ──> Valid: "wk" (len = 2)
     p w [w k e] w       ──> Valid: "wke" (len = 3)
     p w [w k e w]       ──> Invalid ('w' duplicate) -> Contract left past first 'w'...
```

### 1. The Variable Window Expand / Contract Rhythm

While fixed-size windows maintain a constant width $k$, a **variable-size window** dynamically adapts:
- **`right` pointer (Expansion):** Moves forward monotonically on every iteration, absorbing elements to satisfy or test constraints.
- **`left` pointer (Contraction):** Advances forward when the window enters an invalid state (e.g., duplicate characters, exceeding budget), restoring validity.

#### Amortized Runtime Proof:
Though the code features a `while` loop nested inside a `for` loop, the `left` pointer only ever increments forward.
- The `right` pointer moves from $0$ to $n - 1$ ($n$ steps).
- The `left` pointer moves from $0$ to at most $n - 1$ ($n$ steps).
- **Total pointer operations:** $\le 2n = O(n)$ time.

---

### 2. The Universal Variable Window Blueprints

The placement of the answer-update step depends on whether you are maximizing or minimizing the window length:

```javascript
// Node.js code
// Pattern A: MAXIMIZE Window Length (e.g., Longest Substring Without Repeats)
function longestWindowTemplate(arr) {
  let left = 0;
  let maxLength = 0;

  for (let right = 0; right < arr.length; right++) {
    // 1. Add arr[right] to window state

    // 2. While window violates invariant, shrink from left
    while (windowIsInvalid) {
      // Remove arr[left] from window state
      left++;
    }

    // 3. Update answer AFTER window is restored to validity
    maxLength = Math.max(maxLength, right - left + 1);
  }

  return maxLength;
}

// Pattern B: MINIMIZE Window Length (e.g., Minimum Size Subarray Sum)
function shortestWindowTemplate(arr, target) {
  let left = 0;
  let minLength = Infinity;
  let currentSum = 0;

  for (let right = 0; right < arr.length; right++) {
    currentSum += arr[right];

    // While window SATISFIES target constraint, record answer and try to shrink!
    while (currentSum >= target) {
      minLength = Math.min(minLength, right - left + 1);
      currentSum -= arr[left];
      left++;
    }
  }

  return minLength === Infinity ? 0 : minLength;
}
```

---

### 3. Pointer Jumping & The Pointer Regression Trap

In *Longest Substring Without Repeating Characters*, rather than incrementing `left` by 1 iteratively, we can store the **last seen index** of each character in a `Map`. When a duplicate is detected at `right`, `left` can jump directly to `lastSeen.get(char) + 1`.

#### The Trap:
If a character was seen earlier in the string, but its last occurrence is **behind the current `left` boundary** (outside the active window), jumping without a guard regresses `left` backward!

```javascript
// Node.js code
"use strict";

// String: "abba"
// At index 2 ('b'): left moves to index 2.
// At index 3 ('a'): previous 'a' was at index 0!
// ❌ WRONG: left = lastSeen.get('a') + 1 -> left = 0 + 1 = 1 (REGRESSION! Left moved backward!)
// ✅ CORRECT: left = Math.max(left, lastSeen.get('a') + 1) -> left stays at index 2!

function lengthOfLongestSubstring(s) {
  const lastSeen = new Map(); // Character -> latest index
  let left = 0;
  let maxLength = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];

    if (lastSeen.has(char)) {
      // Guard against pointer regression: never allow left to move backward!
      left = Math.max(left, lastSeen.get(char) + 1);
    }

    lastSeen.set(char, right);
    maxLength = Math.max(maxLength, right - left + 1);
  }

  return maxLength;
}

console.log("Longest non-repeating in 'abcabcbb':", lengthOfLongestSubstring("abcabcbb")); // 3 ("abc")
console.log("Longest non-repeating in 'abba':", lengthOfLongestSubstring("abba"));         // 2 ("ab" or "ba")
```

---

### 4. Step-by-Step Trace: `lengthOfLongestSubstring("abcabcbb")`

| `right` | `char` | Last Seen Index | `left` Calculation | Active Window | Window Length (`R - L + 1`) | `maxLength` |
|---|---|---|---|---|---|---|
| `0` | `'a'` | none | `0` | `"a"` | 1 | 1 |
| `1` | `'b'` | none | `0` | `"ab"` | 2 | 2 |
| `2` | `'c'` | none | `0` | `"abc"` | 3 | **3** |
| `3` | `'a'` | 0 | $\max(0, 0 + 1) = 1$ | `"bca"` | 3 | 3 |
| `4` | `'b'` | 1 | $\max(1, 1 + 1) = 2$ | `"cab"` | 3 | 3 |
| `5` | `'c'` | 2 | $\max(2, 2 + 1) = 3$ | `"abc"` | 3 | 3 |
| `6` | `'b'` | 4 | $\max(3, 4 + 1) = 5$ | `"cb"` | 2 | 3 |
| `7` | `'b'` | 6 | $\max(5, 6 + 1) = 7$ | `"b"` | 1 | 3 |

- **Time Complexity:** $O(n)$ — each character is inspected once.
- **Auxiliary Space:** $O(\min(n, m))$ where $m$ is the alphabet size ($m \le 128$ for ASCII).

---

### 5. Node.js Backend Application: Zero-Allocation ASCII Stream Parsing

In high-throughput HTTP proxying and protocol parsing (e.g., scanning raw header lines or session identifiers), using a `Map` creates short-lived heap nodes that trigger garbage collector scavenges.

Replacing the `Map` with a fixed `Int32Array(128)` allocates a single 512-byte contiguous memory block on the stack/buffer, achieving zero allocation churn:

```javascript
// Node.js code
function lengthOfLongestSubstringFast(s) {
  // Pre-allocate 128-slot typed array initialized to -1 (O(1) memory: 512 bytes)
  const lastSeen = new Int32Array(128).fill(-1);
  let left = 0;
  let maxLength = 0;

  for (let right = 0; right < s.length; right++) {
    const code = s.charCodeAt(right);

    if (code < 128 && lastSeen[code] !== -1) {
      left = Math.max(left, lastSeen[code] + 1);
    }

    if (code < 128) {
      lastSeen[code] = right;
    }

    maxLength = Math.max(maxLength, right - left + 1);
  }

  return maxLength;
}

console.log("Zero-Allocation Result:", lengthOfLongestSubstringFast("pwwkew")); // 3 ("wke")
```

---

## Tricky Points and Edge Cases

### 1. Window Length Calculation Formula
In zero-indexed sequences, the length of an inclusive window `[left ... right]` is:
$$\text{Length} = \text{right} - \text{left} + 1$$
Using `right - left` is an off-by-one error that under-reports subarray lengths by 1.

### 2. Nested Substring Checks Degrade to $O(n^2)$
Calling `s.slice(left, right).includes(char)` inside a sliding window loop copies strings on every iteration, destroying linear time complexity:
```javascript
// ❌ WRONG: O(n^2) time due to string allocations
while (s.slice(left, right).includes(s[right])) left++;
```

### 3. Subarrays with Negative Numbers Break Variable Windows
Variable-size sliding windows require **monotonicity**: expanding must increase the window sum, and contracting must decrease it. If negative numbers exist, expanding can decrease sums, rendering greedy contractions invalid. (Use Prefix Sum + Hash Maps for negative numbers).

---

## Hands-On Exercise

### Scenario
You are developing a telemetry aggregation service for a cloud logging engine. You receive a stream of log event types encoded as integers `fruits`. You have two collectors (baskets), and each collector can only hold a single unique event type.

You must find the length of the longest contiguous subsegment that contains at most **2 unique event types** (LeetCode 904: Fruit Into Baskets).

### Buggy Code
```javascript
// Node.js code
function totalFruitBuggy(fruits) {
  let maxLen = 0;
  // ❌ Bug 1: Brute force nested loops create O(n^2) runtime!
  // ❌ Bug 2: Allocates a new Set on every inner loop iteration.
  for (let i = 0; i < fruits.length; i++) {
    const types = new Set();
    for (let j = i; j < fruits.length; j++) {
      types.add(fruits[j]);
      if (types.size > 2) break;
      maxLen = Math.max(maxLen, j - i + 1);
    }
  }
  return maxLen;
}
```

### Acceptance Criteria
1. Execute in strictly $O(n)$ time using a variable sliding window.
2. Maintain auxiliary space bounded by $O(1)$ (at most 3 distinct keys in the map).
3. Handle single-element arrays and arrays containing only one distinct type.

### Solution Code

```javascript
// Node.js code
import assert from "node:assert/strict";

function totalFruit(fruits) {
  const basket = new Map(); // FruitType -> current frequency in window
  let left = 0;
  let maxPicked = 0;

  for (let right = 0; right < fruits.length; right++) {
    const rightFruit = fruits[right];
    basket.set(rightFruit, (basket.get(rightFruit) || 0) + 1);

    // Contraction: If we hold more than 2 distinct fruit types, shrink from left
    while (basket.size > 2) {
      const leftFruit = fruits[left];
      const count = basket.get(leftFruit) - 1;

      if (count === 0) {
        basket.delete(leftFruit); // Completely evict fruit type from basket
      } else {
        basket.set(leftFruit, count);
      }

      left++;
    }

    // Record maximum window length with <= 2 distinct types
    maxPicked = Math.max(maxPicked, right - left + 1);
  }

  return maxPicked;
}

// Verification Tests
assert.equal(totalFruit([1, 2, 1]), 3);          // Types: [1, 2] -> 3 fruits
assert.equal(totalFruit([0, 1, 2, 2]), 3);       // Types: [1, 2] -> 3 fruits
assert.equal(totalFruit([1, 2, 3, 2, 2]), 4);    // Types: [2, 3] -> 4 fruits
assert.equal(totalFruit([3, 3, 3, 1, 2, 1, 1, 2, 3, 3, 4]), 5); // [1, 2, 1, 1, 2] -> 5
assert.equal(totalFruit([1]), 1);                // Single tree

console.log("✅ All Fruit Into Baskets variable sliding window tests passed successfully!");
```

### Solution Explanation

1. **Frequency Tracking:** `basket.set(fruit, count)` tracks quantities of each distinct type.
2. **Complete Key Eviction:** When `count === 0`, `basket.delete(fruit)` decreases `basket.size` back to 2, restoring the invariant in amortized $O(n)$ time.

---

## Summary

- Variable sliding windows expand `right` greedily and contract `left` when invariants are violated.
- Both pointers advance strictly forward, guaranteeing amortized $O(2n) = O(n)$ linear runtime.
- Prevent pointer regression during index jumps using `left = Math.max(left, lastSeen.get(char) + 1)`.
- Maximize window length by updating answers *after* contraction; minimize window length by recording answers *during* contraction.
- Exact count queries can be solved by computing $\text{Exact}(K) = \text{AtMost}(K) - \text{AtMost}(K - 1)$.

---

## Cheat Sheet

### Variable Window Blueprint
| Goal | Answer Update Location | Contraction Condition |
|---|---|---|
| **Maximize Length** | After `while` loop: `max = Math.max(max, R - L + 1)` | `while (windowIsInvalid)` |
| **Minimize Length** | Inside `while` loop: `min = Math.min(min, R - L + 1)` | `while (windowIsValid)` |

### Common Pitfalls
- **Pointer Regression:** Omitting `Math.max(left, ...)` when jumping `left` with previously seen indices.
- **Window Length Calculation:** Writing `right - left` instead of `right - left + 1`.
- **Falsy Frequency Checks:** Failing to delete a map entry when count reaches 0 (`map.size` remains inflated).
- **Negative Numbers in Variable Windows:** Variable sliding windows fail with negative values because monotonicity is violated.

---

## Interview Questions

### 1. In `lengthOfLongestSubstring("abba")`, what happens at index 3 if the implementation omits `Math.max(left, ...)`?

**Question:** Trace the pointer regression bug on input `"abba"` when jumping `left` without `Math.max`.

**Answer:** 
Let's trace `"abba"` step-by-step without `Math.max`:
1. **`right = 0` ('a'):** `lastSeen.set('a', 0)`. `left = 0`. Window: `"a"`, length: 1.
2. **`right = 1` ('b'):** `lastSeen.set('b', 1)`. `left = 0`. Window: `"ab"`, length: 2.
3. **`right = 2` ('b'):** Duplicate `'b'` found. Last seen `'b'` was at index 1.
   `left = lastSeen.get('b') + 1 = 2`. `lastSeen.set('b', 2)`. Window: `"b"`, length: 1.
4. **`right = 3` ('a'):** Duplicate `'a'` found. Last seen `'a'` was at index 0.
   - **Without `Math.max`:** `left = lastSeen.get('a') + 1 = 0 + 1 = 1`.
   - **The Bug:** `left` was at index 2, but jumped *backward* to index 1!
   - This reintroduces the duplicate `'b'` (at index 1) into the active window `[1 ... 3]` (`"bba"`), calculating an invalid length of $3 - 1 + 1 = 3$.
- **Fix:** `left = Math.max(left, lastSeen.get(char) + 1)` ensures `left` remains at index 2, yielding the correct window `[2 ... 3]` (`"ba"`, length 2).

---

### 2. Why does a variable sliding window maintain an $O(n)$ time complexity despite having a `while` loop nested inside a `for` loop?

**Question:** Prove that the time complexity of a variable sliding window algorithm is amortized $O(n)$.

**Answer:** 
Asymptotic analysis evaluates the **total operations executed across the entire algorithm**, not just the syntactical nesting depth of loops:
1. The outer `for` loop advances the `right` pointer from index $0$ to $n - 1$. The `right` pointer increments exactly $n$ times.
2. The inner `while` loop advances the `left` pointer. Crucially, the `left` pointer **only ever increments forward**; it never resets or decrements backward.
3. The `left` pointer starts at index $0$ and can increment at most $n$ times before `left > right`.
4. Therefore, the total number of element insertions, deletions, and pointer increments performed across all iterations combined is bounded by:
   $$\text{Total Pointer Operations} = n \text{ (right steps)} + n \text{ (left steps)} = 2n$$
Because $2n = O(n)$, the algorithm runs in guaranteed **amortized linear time**.

---

### 3. How does the "At Most $K$" sliding window pattern solve the "Exact $K$" subarray problem?

**Question:** Why is finding subarrays with *exactly* $K$ distinct elements difficult with a single sliding window, and how does the decomposition $\text{Exact}(K) = \text{AtMost}(K) - \text{AtMost}(K - 1)$ solve it?

**Answer:** 
In variable-size sliding windows, the decision to expand or contract relies on **monotonicity**:
- When expanding `right`, the count of distinct elements can only stay the same or increase.
- When shrinking `left`, the count of distinct elements can only stay the same or decrease.

If an algorithm searches for **exactly $K$** distinct elements, expanding `right` might increase the count beyond $K$, while shrinking `left` might leave multiple valid sub-windows ending at `right`. A single greedy pointer cannot easily account for all valid starting points.

**The Algebraic Decomposition:**
The number of subarrays with *at most* $K$ distinct elements has strict monotonicity. For any valid window `[left ... right]` having $\le K$ distinct elements, the number of valid subarrays ending at `right` is simply:
$$\text{count} = \text{right} - \text{left} + 1$$
We can solve this with a standard sliding window function `atMost(K)`. Then, the exact count is derived in $O(n)$ time as:
$$\text{Exact}(K) = \text{atMost}(K) - \text{atMost}(K - 1)$$
This executes two linear passes, maintaining $O(n)$ overall runtime without complex backtracking.

---

### 4. Why is an `Int32Array(128)` preferred over an ES2015 `Map` in high-throughput Node.js string stream parsers?

**Question:** Compare memory allocation, cache locality, and V8 garbage collection behavior between `Int32Array(128)` and `Map` for tracking ASCII character occurrences.

**Answer:** 
1. **Memory Allocation:**
   - A `Map` allocates dynamic bucket nodes on the V8 heap. Each entry allocates an internal key-value hash object with reference pointers, consuming ~48–64 bytes per entry.
   - An `Int32Array(128)` allocates a single contiguous memory block of exactly $128 \times 4 = 512$ bytes once.
2. **Cache Locality:**
   - Reading `Int32Array[code]` compiles to a direct memory offset instruction: $\text{Base} + (\text{code} \times 4)$. This has high CPU L1 cache locality.
   - A `Map` requires hashing the key, computing the bucket index, traversing potential collision pointers, and performing pointer dereferencing.
3. **Garbage Collection (GC) Impact:**
   - In a Node.js microservice handling 50,000 HTTP requests/second, creating a new `Map` per request creates 50,000 heap objects/second, filling the V8 Young Generation space and triggering minor GC scavenges (introducing latency spikes).
   - An `Int32Array` can be pre-allocated or pooled, reset via `arr.fill(-1)` in a single vector instruction, and reused with zero heap churn, guaranteeing flat p99 latency.

---

<nav aria-label="Lecture navigation">

[Previous: Sliding Window: Fixed Size](day-13-sliding-window-fixed-size.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Prefix Sum and Cumulative Totals](day-15-prefix-sum-and-range-queries.md)

</nav>
