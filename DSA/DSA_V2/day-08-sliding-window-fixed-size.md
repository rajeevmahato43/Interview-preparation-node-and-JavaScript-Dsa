# Day 08: Sliding Window: Fixed Size

<nav aria-label="Lecture navigation">

[Previous: Two Pointers: Fast & Slow](day-07-two-pointers-fast-slow-and-partitioning.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Sliding Window: Variable Size](day-09-sliding-window-variable-size.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Differentiating $O(n)$ from $O(n \times k)$ and the $10^7$ operations rule.
- [Day 02: JavaScript Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md) — Contiguous subarrays and index offsets.
- [Day 05: Hash Table Patterns](day-05-hash-patterns-frequency-counting-and-duplicates.md) — Fixed 26-slot frequency arrays.

---

## 1. What is a Fixed Sliding Window?

A **Fixed Sliding Window** is an algorithmic technique for solving problems on contiguous subarrays or substrings of a strictly defined length $k$.

> **Fixed Sliding Window**: An optimization pattern where a window of fixed length $k$ moves forward one element at a time across a sequence. Instead of recalculating the window state from scratch ($O(k)$ work per step), the algorithm updates the state in $O(1)$ time by subtracting the element that exited on the left and adding the element that entered on the right.

### The Moving Train Window Analogy

Imagine sitting on a train looking out a passenger window that displays exactly $k = 3$ landscape scenery posts at any moment:
- As the train rolls forward one post, you **do not close your eyes and recount all three posts**.
- You already know the middle two posts did not change.
- Exactly **one post disappears** past the left frame edge, and **one new post appears** on the right frame edge.
- You simply subtract the leaving post and add the arriving post.

```text
Fixed Window Transition (k = 3):
Array: [  2,   1,   5,   1,   3,   2  ]

Window 0: [ 2,  1,  5 ]  1,   3,   2   ──► Initial Sum = 2 + 1 + 5 = 8
           -2       +1
Window 1:   2  [ 1,  5,  1 ]  3,   2   ──► New Sum = 8 - 2 + 1 = 7
               -1       +3
Window 2:   2,  1  [ 5,  1,  3 ]  2   ──► New Sum = 7 - 1 + 3 = 9  <-- Maximum!
                   -5       +2
Window 3:   2,  1,  5  [ 1,  3,  2 ]   ──► New Sum = 9 - 5 + 2 = 6

Total Work Comparison:
- Naive recount:  4 windows * 3 additions = 12 operations
- Sliding Window: 3 initial additions + 3 slides * (1 sub + 1 add) = 9 operations
For n = 100,000 and k = 20,000:
- Naive recount:  1,600,000,000 ops (Freeze!)
- Sliding Window: 100,000 ops (Instant!)
```

$$\text{Next Window Sum} = \text{Previous Window Sum} - \text{arr}[i - k] + \text{arr}[i]$$

---

## 2. How Fixed Sliding Window Works Step-by-Step

Every fixed sliding window algorithm executes in two distinct phases:

### Phase 1: Build the Initial Window
1. Compute the state (sum, character counts, hash) for the first $k$ elements from index $0$ to $k - 1$.
2. Initialize your running result (e.g., `maxSum = currentSum`).

### Phase 2: Slide Across the Remaining Array
1. Loop from index $i = k$ up to $n - 1$:
   - **Identify the leaving element:** `outgoing = arr[i - k]` (left edge dropping out).
   - **Identify the entering element:** `incoming = arr[i]` (right edge entering).
   - **Update the state in $O(1)$:** Subtract `outgoing` and add `incoming`.
   - **Update the running answer:** `maxSum = Math.max(maxSum, currentSum)`.
2. Return the computed result after reaching the end of the array.

```text
+-------------------------------------------------------------------------+
|                  FIXED SLIDING WINDOW STATE LIFECYCLE                   |
+-------------------------------------------------------------------------+
|  Index Position i       | Outgoing Element   | Incoming Element         |
+-------------------------+--------------------+--------------------------+
|  0 to k - 1             | None (Building)    | arr[0] ... arr[k - 1]    |
|  k                      | arr[0]             | arr[k]                   |
|  k + 1                  | arr[1]             | arr[k + 1]               |
|  ...                    | ...                | ...                      |
|  n - 1 (final)          | arr[n - 1 - k]     | arr[n - 1]               |
+-------------------------------------------------------------------------+
```

---

## 3. Pattern Recognition of Fixed Sliding Window

Spot this pattern in technical screens within 30 seconds:

### 30-Second Problem Triggers
- **Explicit window size $k$ given:** The problem explicitly provides an integer $k$ or fixed duration (e.g., "size $k$", "length $k$", "every 60 seconds").
- **Contiguous sequence required:** The problem asks for contiguous subarrays or substrings, not arbitrary subsets or subsequences.
- **Aggregation over moving range:** Asking for maximum sum, minimum average, distinct character count, or exact anagram matches over consecutive groups of size $k$.

### Problem Keywords to Look For
- *"Subarray of size $k$"*
- *"Maximum / Minimum average of length $k$"*
- *"All substrings of length $k$"*
- *"Find all anagrams in a string"*
- *"Moving average / Rolling window"*

### The 10^7 Operations Rule
- If $n = 100,000$ and $k = 50,000$, a brute force nested recalculation requires $\approx (n - k) \times k \approx 2.5 \times 10^9$ operations $\to$ **Time Limit Exceeded (failing after 3 seconds)**.
- A Fixed Sliding Window runs in strictly **$O(n)$ time** ($\approx 10^5$ operations), executing in **under 1.5 milliseconds** in Node.js.

### When NOT to Use Fixed Sliding Window
- **When window size is variable:** If the problem asks for the "shortest subarray with sum $\ge S$", the window boundary must expand and shrink dynamically. Use **Variable Sliding Window (Day 09)**.
- **When elements are not contiguous:** If you can pick elements from arbitrary positions, the problem is a subset or greedy problem, not a sliding window.
- **When checking negative numbers with arbitrary sums:** Prefix sums with a Hash Map are required when looking for exact sums with negative numbers (Day 10).

---

## 4. Problem 1: Maximum Average Subarray I

### Problem Statement
You are given an integer array `nums` consisting of $n$ elements, and an integer $k$.
Find a contiguous subarray whose **length is equal to $k$** that has the maximum average value and return this value. Any answer with a calculation error less than $10^{-5}$ will be accepted.

- **Example 1:** `nums = [1, 12, -5, -6, 50, 3]`, `k = 4` $\to$ `12.75`  
  *(Subarray `[12, -5, -6, 50]` has sum $51$, average $51 / 4 = 12.75$)*
- **Example 2:** `nums = [5]`, `k = 1` $\to$ `5.00000`
- **Constraints:** $n == nums.length$, $1 \le k \le n \le 10^5$, $-10^4 \le nums[i] \le 10^4$.

---

### Step 1: Physical Simulation

Lay out numbered cards on a desk:
`[ 1, 12, -5, -6, 50, 3 ]`, and create a cardboard frame with width $k = 4$.

1. Place the frame over the first 4 cards: `[ 1, 12, -5, -6 ]`.
   - Calculate sum: $1 + 12 - 5 - 6 = 2$.
   - Record `maxSum = 2`.
2. Slide the frame one spot to the right:
   - Card `1` (at index 0) leaves the frame on the left.
   - Card `50` (at index 4) enters the frame on the right.
   - New sum = $2 - 1 + 50 = 51$.
   - $51 > 2 \implies$ Update `maxSum = 51`.
3. Slide the frame one spot to the right:
   - Card `12` (at index 1) leaves the frame.
   - Card `3` (at index 5) enters the frame.
   - New sum = $51 - 12 + 3 = 42$.
   - $42 < 51 \implies$ `maxSum` remains $51$.
4. Calculate final average once at the very end: $51 / 4 = 12.75$.

---

### Step 2: Brute Force Approach

Recalculate the sum of $k$ elements from scratch for every starting index:

```javascript
// Node.js code
function findMaxAverageBruteForce(nums, k) {
  let maxAverage = -Infinity;

  for (let i = 0; i <= nums.length - k; i++) {
    let windowSum = 0;
    // ❌ INNER LOOP RECALCULATES K ITEMS ON EVERY STEP
    for (let j = i; j < i + k; j++) {
      windowSum += nums[j];
    }
    const currentAverage = windowSum / k;
    if (currentAverage > maxAverage) {
      maxAverage = currentAverage;
    }
  }

  return maxAverage;
}
```

#### Complexity Analysis:
- **Time Complexity:** $O((n - k + 1) \times k) \approx O(n \cdot k)$. If $n = 100,000$ and $k = 50,000$, total steps exceed $2.5 \times 10^9$.
- **Space Complexity:** $O(1)$.
- **Scale Failure:** Freezes Node.js with a CPU timeout on inputs where $k$ is large.

---

### Step 3: Bottleneck

- Window 1 checks: `nums[0] + nums[1] + nums[2] + nums[3]`.
- Window 2 checks: `nums[1] + nums[2] + nums[3] + nums[4]`.
- Notice that `nums[1] + nums[2] + nums[3]` is calculated in Window 1, and then calculated **all over again** in Window 2!
- **The Wasted Work:** $k - 1$ duplicate additions on every single step.

---

### Step 4: The Pattern Discovery

- When the window moves from $i - 1$ to $i$:
  - Only one number disappears: `nums[i - k]`.
  - Only one number arrives: `nums[i]`.
- Instead of adding $k$ numbers, perform exactly **1 subtraction and 1 addition**:
  $$\text{windowSum} = \text{windowSum} - nums[i - k] + nums[i]$$
- Furthermore, do not divide by $k$ inside the loop. Maximize the sum first, then divide by $k$ once at the very end.
- Runtime drops from **$O(n \cdot k)$ to $O(n)$**!

---

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(1) space fixed sliding window
function findMaxAverage(nums, k) {
  // Phase 1: Calculate sum of the first window
  let currentSum = 0;
  for (let i = 0; i < k; i++) {
    currentSum += nums[i];
  }

  let maxSum = currentSum;

  // Phase 2: Slide the window from index k to end of array
  for (let i = k; i < nums.length; i++) {
    // Add incoming element, subtract outgoing element
    currentSum += nums[i] - nums[i - k];

    if (currentSum > maxSum) {
      maxSum = currentSum;
    }
  }

  // Divide by k exactly once at the end to prevent cumulative float precision loss
  return maxSum / k;
}

// ❌ ANTI-PATTERN / COMMON BUG: Array slice and reduce inside loop
function buggyFindMaxAverage(nums, k) {
  let maxAvg = -Infinity;
  // BUG: slice() allocates a new array of size k on every iteration -> O(n * k) heap memory churn!
  for (let i = 0; i <= nums.length - k; i++) {
    const sum = nums.slice(i, i + k).reduce((acc, val) => acc + val, 0);
    maxAvg = Math.max(maxAvg, sum / k);
  }
  return maxAvg;
}

// Example runs
console.log(findMaxAverage([1, 12, -5, -6, 50, 3], 4)); // 12.75
console.log(findMaxAverage([5], 1));                     // 5
console.log(findMaxAverage([0, 4, 0, 3, 2], 1));         // 4
console.log(findMaxAverage([-1], 1));                    // -1
```

#### Complexity Derivation:
- **Time Complexity:** $O(n)$. Phase 1 takes $k$ operations. Phase 2 takes $n - k$ operations, each with 2 basic arithmetic steps ($O(1)$). Total time: $k + 2(n - k) = 2n - k \implies O(n)$.
- **Space Complexity:** $O(1)$ auxiliary space. Only three numeric primitive variables (`currentSum`, `maxSum`, `i`) are held in CPU registers.

---

## 5. Problem 2: Find All Anagrams in a String

### Problem Statement
Given two strings `s` and `p`, return an array of all the start indices of `p`'s **anagrams** in `s`. You may return the answer in any order.
An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, using all the original letters exactly once.

- **Example 1:** `s = "cbaebabacd"`, `p = "abc"` $\to$ `[0, 6]`  
  *(Substring starting at index 0 is `"cba"`, anagram of `"abc"`. Substring starting at index 6 is `"bac"`, anagram of `"abc"`)*
- **Example 2:** `s = "abab"`, `p = "ab"` $\to$ `[0, 1, 2]`
- **Constraints:** $1 \le s.length, p.length \le 3 \times 10^4$. Strings consist of lowercase English letters.

---

### Step 1: Physical Simulation

Let `s = "cbaebabacd"` and `p = "abc"`.
Notice the crucial constraint: Any anagram of `p` **must have length equal to `p.length` ($k = 3$)**!

1. Count characters in `p`: `{ a: 1, b: 1, c: 1 }`.
2. Place a fixed stencil of width 3 over `s`:
   - Position 0 (`"cba"`): Characters are `{ a: 1, b: 1, c: 1 }`. Matches `p`! Add index `0` to results.
   - Slide to position 1: Character `'c'` leaves on the left. Character `'e'` enters on the right.
     New window is `"bae"`. Characters are `{ a: 1, b: 1, e: 1 }`. Mismatch!
   - Slide to position 2: Character `'b'` leaves. Character `'b'` enters.
     New window is `"aeb"`. Mismatch!
   - Continue sliding until index 6 (`"bac"`): Matches `p`! Add index `6` to results.
3. Return `[0, 6]`.

---

### Step 2: Brute Force Approach

Slice each substring of length `p.length`, sort its characters, and compare with sorted `p`:

```javascript
// Node.js code
function findAnagramsBruteForce(s, p) {
  const result = [];
  const sortedP = p.split("").sort().join("");
  const k = p.length;

  for (let i = 0; i <= s.length - k; i++) {
    // ❌ Slices and sorts every single substring
    const sub = s.slice(i, i + k).split("").sort().join("");
    if (sub === sortedP) {
      result.push(i);
    }
  }

  return result;
}
```

#### Complexity Analysis:
- **Time Complexity:** $O((n - k) \cdot k \log k)$. Slicing and sorting each window of length $k$ takes $O(k \log k)$. For $n = 30,000$ and $k = 1,000$, operations exceed $3 \times 10^8$.
- **Space Complexity:** $O(k)$ per iteration in heap memory allocations.
- **Scale Failure:** High garbage collector overhead causes frame drops and timeouts.

---

### Step 3: Bottleneck

- In each step, `s.slice()` allocates a new string.
- `.split('').sort().join('')` allocates arrays and performs sorting all over again.
- When moving from `"cba"` to `"bae"`, characters `'b'` and `'a'` were already counted.
- **The Core Problem:** We are sorting repeatedly instead of maintaining a rolling frequency count of 26 letters.

---

### Step 4: The Pattern Discovery

- Use two 26-slot integer arrays: `pCount` and `sCount`.
- Initialize `sCount` with the first $k$ characters of `s`.
- On each slide:
  - Decrement the count of the character leaving: `s.charCodeAt(i - k) - 97`.
  - Increment the count of the character entering: `s.charCodeAt(i) - 97`.
  - Compare the two 26-slot arrays. Since 26 is a constant, comparing them takes exactly **26 operations ($O(1)$ constant time)**!
- Runtime drops from **$O(n \cdot k \log k)$ to $O(26 \cdot n) \implies O(n)$**!

---

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(1) space fixed sliding window
function findAnagrams(s, p) {
  const result = [];
  const sLen = s.length;
  const pLen = p.length;

  if (sLen < pLen) return result;

  const pCount = new Array(26).fill(0);
  const sCount = new Array(26).fill(0);

  // Phase 1: Build target frequency and first window
  for (let i = 0; i < pLen; i++) {
    pCount[p.charCodeAt(i) - 97]++;
    sCount[s.charCodeAt(i) - 97]++;
  }

  // Check initial window at index 0
  if (matches(pCount, sCount)) {
    result.push(0);
  }

  // Phase 2: Slide the fixed window of size pLen across string s
  for (let i = pLen; i < sLen; i++) {
    // Add incoming character on the right
    sCount[s.charCodeAt(i) - 97]++;

    // Remove outgoing character on the left
    sCount[s.charCodeAt(i - pLen) - 97]--;

    // Start index of current window is i - pLen + 1
    if (matches(pCount, sCount)) {
      result.push(i - pLen + 1);
    }
  }

  return result;
}

// Helper: Compare two 26-slot arrays in O(1) constant time
function matches(arr1, arr2) {
  for (let i = 0; i < 26; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

// ❌ ANTI-PATTERN / COMMON BUG: Rebuilding Map on every iteration
function buggyFindAnagramsMap(s, p) {
  const result = [];
  // BUG: Allocates a new Map on every index -> O(n * k) memory and GC churn
  for (let i = 0; i <= s.length - p.length; i++) {
    const map = new Map();
    for (let j = i; j < i + p.length; j++) {
      map.set(s[j], (map.get(s[j]) || 0) + 1);
    }
    // Comparison omitted...
  }
  return result;
}

// Example runs
console.log(findAnagrams("cbaebabacd", "abc")); // [ 0, 6 ]
console.log(findAnagrams("abab", "ab"));         // [ 0, 1, 2 ]
console.log(findAnagrams("af", "be"));           // []
```

#### Complexity Derivation:
- **Time Complexity:** $O(n)$ where $n = s.length$. Initializing the counts takes $O(k)$ steps. Sliding the window executes $n - k$ times. In each slide, updating the counts takes $O(1)$ operations, and comparing 26 slots takes $26 \times O(1) = O(1)$ operations. Total time: $k + 26(n - k) \implies O(n)$.
- **Space Complexity:** $O(1)$ auxiliary space. The `pCount` and `sCount` arrays are strictly fixed at 26 elements each, regardless of the size of $s$ or $p$.

---

## 6. Under the Hood: V8 & Node.js

### 1. Rolling Moving Windows in Real-Time Node.js Microservices

In production Node.js APIs (e.g., Express or Fastify), fixed sliding windows are the core architectural pattern used for:
- **API Rate Limiting:** Tracking the count of requests in a moving 60-second window to prevent DDoS attacks.
- **Circuit Breakers:** Tracking failure rates across the last 100 HTTP requests before tripping a circuit.
- **Latency Monitoring:** Calculating p99 response times over fixed rolling batches.

### 2. V8 Garbage Collection Avoidance

Calling `str.slice(i, i + k)` inside an $n$-iteration loop causes significant performance degradation:
- Each slice allocates a brand-new string on the V8 Young Generation heap.
- For $n = 100,000$, this allocates hundreds of megabytes of short-lived objects.
- This triggers the V8 Scavenger garbage collector, which pauses JavaScript execution on the main thread.
- By using array indexing (`s.charCodeAt(i)`) and fixed 26-slot arrays, the sliding window generates **zero heap allocations and zero GC pauses**.

```text
V8 Heap Behavior:
s.slice(i, i + k) -> Allocates 100,000 heap strings -> Triggers GC Stop-the-World pauses
s.charCodeAt(i)   -> Reads UTF-16 bytes directly -> 0 Heap Allocations -> 0 GC Overhead
```

### 3. Floating-Point Cumulative Drift

When calculating averages, adding and subtracting floating-point values repeatedly causes precision drift:
```javascript
// ❌ Dangerous: Float drift accumulates
let avg = 0;
for (...) avg += nums[i] / k - nums[i - k] / k;

// ✅ Safe: Accumulate exact integers, divide once at the end
let sum = 0;
for (...) sum += nums[i] - nums[i - k];
return sum / k;
```

---

## 7. Hands-On Exercise: Real-Time API Rate Limiter Spike Detector

### Scenario
You are maintaining a fintech payments API built in Node.js. The fraud detection module monitors incoming transactions per second. An alert must trigger if the transaction volume within any rolling window of $k = 5$ seconds exceeds a given threshold. A junior developer used nested `slice()` and `reduce()`, which caused the Node.js event loop to freeze during high-volume flash sales. You must rewrite the detector to run in $O(n)$ time and $O(1)$ auxiliary space.

### Buggy Code
```javascript
// Node.js code
function detectSpikesBuggy(transactionsPerSecond, k, threshold) {
  const spikeStartIndices = [];

  // ❌ PERFORMANCE BUG:
  // slice() copies k elements into a new array.
  // reduce() iterates over that array.
  // Total complexity is O(n * k).
  for (let i = 0; i <= transactionsPerSecond.length - k; i++) {
    const windowSum = transactionsPerSecond
      .slice(i, i + k)
      .reduce((sum, count) => sum + count, 0);

    if (windowSum > threshold) {
      spikeStartIndices.push(i);
    }
  }

  return spikeStartIndices;
}
```

### Acceptance Criteria
1. Must use a **Fixed Sliding Window** of size $k$.
2. Must update the rolling window sum in **$O(1)$ operations** per slide.
3. Must achieve **$O(n)$ overall runtime** and **$O(1)$ auxiliary memory** (excluding output array).
4. Must process an input of $100,000$ seconds in under 5 milliseconds.

### Solution Code

```javascript
// ✅ CORRECT: Optimal O(n) time, O(1) space fixed sliding window spike detector
function detectSpikes(transactionsPerSecond, k, threshold) {
  const spikeStartIndices = [];
  const n = transactionsPerSecond.length;

  if (n < k || k <= 0) return spikeStartIndices;

  // Phase 1: Sum initial window of size k
  let currentWindowSum = 0;
  for (let i = 0; i < k; i++) {
    currentWindowSum += transactionsPerSecond[i];
  }

  if (currentWindowSum > threshold) {
    spikeStartIndices.push(0);
  }

  // Phase 2: Slide across the remaining timeline
  for (let i = k; i < n; i++) {
    // Add incoming second, subtract outgoing second
    currentWindowSum += transactionsPerSecond[i] - transactionsPerSecond[i - k];

    if (currentWindowSum > threshold) {
      spikeStartIndices.push(i - k + 1);
    }
  }

  return spikeStartIndices;
}

// Example runs
const traffic = [10, 20, 15, 30, 25, 40, 10, 5];
console.log("Spike windows (k = 3, threshold = 65):", detectSpikes(traffic, 3, 65));
// [ 2, 3, 4 ]

// Benchmark verification: 100,000 seconds
const largeTimeline = Array.from({ length: 100000 }, () => Math.floor(Math.random() * 50));
const start = Date.now();
const spikes = detectSpikes(largeTimeline, 60, 2500);
const elapsed = Date.now() - start;

console.log(`Processed 100,000 seconds in ${elapsed}ms! Found ${spikes.length} spike intervals.`);
```

---

## 8. Tricky Points and Edge Cases

### 1. Window Size $k$ Exceeds Array Length ($k > n$)
If $k > nums.length$, a window of size $k$ cannot be formed:
```javascript
if (nums.length < k || k <= 0) return null; // or []
```
Always validate boundary constraints before initializing the first loop.

### 2. Off-by-One in Window Indices
- When loop index is $i$, the incoming element is `nums[i]`.
- The outgoing element is `nums[i - k]`.
- The start index of the current window is `i - k + 1`.

### 3. Arrays with Negative Numbers
When finding the maximum sum of a window, negative numbers can cause the sum to decrease even when adding a new element. Always initialize `maxSum` to `-Infinity` or to the exact sum of the first window, **never to 0**!
```javascript
// ❌ BUG: If all sums are negative, maxSum will incorrectly stay 0
let maxSum = 0;

// ✅ CORRECT:
let maxSum = currentSum; // where currentSum is the sum of the first window
```

---

## 9. Comprehensive Summary

- **Fixed Sliding Window** computes running metrics across contiguous elements of fixed length $k$.
- **$O(1)$ Transition:** Updates the window state by subtracting the exiting element (`nums[i - k]`) and adding the entering element (`nums[i]`).
- **Complexity Shift:** Eliminates duplicate work, reducing time from $O(n \cdot k)$ to linear $O(n)$.
- **Zero Heap Allocations:** Avoids allocating temporary strings (`slice`) or arrays (`splice`), eliminating V8 garbage collection pauses.
- **Precision Safety:** Accumulates integer sums across the window and divides once at the end to prevent floating-point drift.

---

## 10. Cheat Sheet

### Decision Table

| Problem Type | Window Size | Invariant Update Rule | Target Complexity |
| :--- | :---: | :--- | :---: |
| **Max/Min Sum of length $k$** | Fixed $k$ | `sum += nums[i] - nums[i - k]` | $O(n)$ time, $O(1)$ space |
| **Max Average of length $k$** | Fixed $k$ | Maximize sum; divide by $k$ at return | $O(n)$ time, $O(1)$ space |
| **Find Anagrams of length $k$** | Fixed $|p|$ | `count[in]++`, `count[out]--`, compare 26 slots | $O(n)$ time, $O(1)$ space |
| **Rolling API Rate Limiting** | Fixed seconds | Add current reqs, subtract reqs from $t - k$ | $O(n)$ time, $O(1)$ space |

### Common Pitfalls List
- **The Slice & Reduce Trap:** Using `.slice().reduce()` inside a loop turns an $O(n)$ algorithm into $O(n \cdot k)$ with high GC churn.
- **The 0 Initialization Bug:** Setting `maxSum = 0` fails when arrays contain all negative values.
- **Float Accumulation Drift:** Dividing by $k$ inside the loop instead of accumulating sums.
- **Unchecked $k > n$:** Causing `NaN` or out-of-bounds access when $k$ is larger than the input array.

### Reusable Fixed Sliding Window Skeleton

```javascript
function fixedWindowTemplate(arr, k) {
  if (arr.length < k || k <= 0) return null;

  // 1. Build initial window
  let windowState = 0;
  for (let i = 0; i < k; i++) {
    windowState += arr[i];
  }

  let bestResult = windowState;

  // 2. Slide window across remaining elements
  for (let i = k; i < arr.length; i++) {
    const outgoing = arr[i - k];
    const incoming = arr[i];

    windowState += incoming - outgoing;
    bestResult = Math.max(bestResult, windowState);
  }

  return bestResult;
}
```

---

## 11. Interview Q&A

### 45-Second Technical Pitch
> *"The Fixed Sliding Window pattern optimizes operations on contiguous sequences of constant length k. By recognizing that adjacent windows share k - 1 overlapping elements, we transition from window to window in O(1) constant time by subtracting the outgoing element and adding the incoming element. This reduces runtime from quadratic O(n * k) to linear O(n). In Node.js backend services, it eliminates heap allocation churn and provides the foundational architecture for rolling rate limiters and real-time sliding metrics."*

---

### 1. Why is a Fixed Sliding Window mathematically equivalent to a First-In, First-Out (FIFO) Queue?
**Answer:**
A fixed sliding window maintains an invariant size of $k$. When the window moves forward by one position, the element that entered earliest (the oldest element at the front) must leave, and the newest element arrives at the back. This matches the exact operational contract of a FIFO Queue:
$$\text{Dequeue (leaving element)} \implies \text{Enqueue (entering element)}$$
Because arrays allow direct index access in $O(1)$ time via mathematical pointer offsets (`arr[i - k]` and `arr[i]`), we simulate this queue behavior without incurring the memory allocation overhead of a real queue data structure.

---

### 2. In "Find All Anagrams in a String", how can you optimize the 26-slot comparison from $O(26)$ to $O(1)$?
**Answer:**
Instead of looping through all 26 character slots on each slide, we can maintain a single integer variable `matches` tracking how many of the 26 characters have identical counts in both strings:
1. Initialize `matches` (0 to 26). If `matches === 26`, we found an anagram.
2. When a character count changes during a slide:
   - If count was equal before modification, decrement `matches--`.
   - Update the count.
   - If count is now equal after modification, increment `matches++`.
3. Checking for a match becomes `if (matches === 26)`: a single integer comparison executing in **1 CPU clock cycle** ($O(1)$) instead of 26 array lookups.

---

### 3. What will this code output, and what bug does it contain?
```javascript
function maxKSum(arr, k) {
  let sum = 0;
  for (let i = 0; i < k; i++) sum += arr[i];
  let max = 0;
  for (let i = k; i < arr.length; i++) {
    sum += arr[i] - arr[i - k];
    if (sum > max) max = sum;
  }
  return max;
}
console.log(maxKSum([-5, -2, -8, -1], 2));
```
**Answer:**
It outputs `0` instead of `-7`!
There are two critical bugs:
1. `max` is initialized to `0`. Since all subarray sums are negative (`[-5, -2] = -7`, `[-2, -8] = -10`, `[-8, -1] = -9`), `sum > max` is never true, returning `0` which was never in the array!
2. `max` was not initialized with the sum of the first window. The first window `[-5, -2]` (sum -7) was never even considered as a candidate for `max`.
The fix is: `let max = sum;`.

---

### 4. How does an in-place fixed sliding window prevent event loop lag in Node.js streaming APIs?
**Answer:**
Node.js operates on a single execution thread. In real-time data ingestion pipelines (e.g., websockets or Kafka consumers receiving 20,000 telemetry metrics per second), calculating sliding averages using functional methods like `.slice()` creates massive garbage collector churn. The V8 garbage collector periodically triggers "Stop-The-World" pauses to reclaim orphaned slice buffers, delaying the Node.js event loop poll phase and causing network socket queues to overflow. An in-place sliding window uses primitive integer variables, generating **zero heap objects and zero GC pauses**.

---

## 12. Practice Problems

### 1. Substrings of Size Three with Distinct Characters - Easy
A string is good if there are no repeated characters. Given a string `s`, return the number of good substrings of length three.
- **Sample Input 1:** `s = "xyzzaz"`
- **Expected Output 1:** `1` (Only `"xyz"` has distinct characters)
- **Sample Input 2:** `s = "aababcabc"`
- **Expected Output 2:** `4` (Substrings: `"abc"`, `"bca"`, `"cab"`, `"abc"`)
- **Sample Input 3:** `s = "aa"`
- **Expected Output 3:** `0`

### 2. Maximum Number of Vowels in a Substring of Given Length - Medium
Given a string `s` and an integer `k`, return the maximum number of vowel letters (`'a'`, `'e'`, `'i'`, `'o'`, `'u'`) in any substring of `s` with length `k`.
- **Sample Input 1:** `s = "abciiidef"`, `k = 3`
- **Expected Output 1:** `3` (The substring `"iii"` contains 3 vowels)
- **Sample Input 2:** `s = "aeiou"`, `k = 2`
- **Expected Output 2:** `2`
- **Sample Input 3:** `s = "leetcode"`, `k = 3`
- **Expected Output 3:** `2`

### 3. Sliding Window Maximum - Hard
You are given an array of integers `nums`, there is a sliding window of size `k` which is moving from the very left of the array to the very right. You can only see the `k` numbers in the window. Each time the sliding window moves right by one position, return the max sliding window. Solve in $O(n)$ time using a Monotonic Deque.
- **Sample Input 1:** `nums = [1, 3, -1, -3, 5, 3, 6, 7]`, `k = 3`
- **Expected Output 1:** `[3, 3, 5, 5, 6, 7]`
- **Sample Input 2:** `nums = [1]`, `k = 1`
- **Expected Output 2:** `[1]`
- **Sample Input 3:** `nums = [1, -1]`, `k = 1`
- **Expected Output 3:** `[1, -1]`

---

<nav aria-label="Lecture navigation">

[Previous: Two Pointers: Fast & Slow](day-07-two-pointers-fast-slow-and-partitioning.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Sliding Window: Variable Size](day-09-sliding-window-variable-size.md)

</nav>
