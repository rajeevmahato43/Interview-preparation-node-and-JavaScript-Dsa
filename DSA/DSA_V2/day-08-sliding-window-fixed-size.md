# Day 08: Fixed Sliding Window

<nav aria-label="Lecture navigation">

[Previous: Fast & Slow Pointers](day-07-two-pointers-fast-slow-and-partitioning.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Variable Sliding Window](day-09-sliding-window-variable-size.md)

</nav>

---

## 1. Fixed Sliding Window

A **Fixed Sliding Window** is a technique used when working with sub-arrays or sub-strings of an exact, fixed size $k$.

Instead of recalculating every window of size $k$ from scratch (which takes $O(k)$ time per window and causes a slow $O(n \cdot k)$ bottleneck), we slide the window forward by one step. We update our result in $O(1)$ fast time by subtracting the item leaving on the left and adding the item entering on the right:

$$\text{New Window State} = \text{Current Window State} - \text{Item Leaving} + \text{Item Entering}$$

To picture this physically, imagine looking out a train window that frames exactly $k = 3$ telephone poles along the tracks:
* As the train moves forward, you **do not close your eyes and recount all three poles**.
* The middle two poles did not change at all.
* Exactly **one pole leaves your view** on the left edge, and **one new pole enters your view** on the right edge.
* You subtract the value of the pole leaving and add the value of the pole entering.

```text
Array: [ 2, 1, 5, 1, 3, 2 ], Window Size k = 3

Window 0: [ 2,  1,  5 ]  1,   3,   2   ──► Initial Sum = 2 + 1 + 5 = 8
           -2       +1
Window 1:   2  [ 1,  5,  1 ]  3,   2   ──► New Sum = 8 - 2 + 1 = 7
               -1       +3
Window 2:   2,  1  [ 5,  1,  3 ]  2   ──► New Sum = 7 - 1 + 3 = 9  (Max Sum!)
                   -5       +2
Window 3:   2,  1,  5  [ 1,  3,  2 ]   ──► New Sum = 9 - 5 + 2 = 6
```

```javascript
// Node.js code
"use strict";

// Baseline fixed sliding window: Maximum sum subarray of length k
function maxSubarraySum(arr, k) {
  if (!Array.isArray(arr) || arr.length < k || k <= 0) return 0;

  // Phase 1: Build sum of the initial window
  let windowSum = 0;
  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
  }

  let maxSum = windowSum;

  // Phase 2: Slide across the remaining elements
  for (let i = k; i < arr.length; i++) {
    // Subtract element exiting on left (i - k), add element entering on right (i)
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

### 1.1 Invariant State Transition

A fixed sliding window always keeps the exact same size $k$:

$$\text{Active Window: } \text{arr}[i - k + 1 \dots i] \implies \text{Contains exactly } k \text{ elements}$$

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      FIXED WINDOW LIFECYCLE PHASES                     │
├─────────────────────┬──────────────────┬─────────────────┬─────────────┤
│ Index Range         │ Item Leaving     │ Item Entering   │ Action      │
├─────────────────────┼──────────────────┼─────────────────┼─────────────┤
│ 0 to k - 1          │ None             │ arr[i]          │ Build window│
│ k to n - 1          │ arr[i - k]       │ arr[i]          │ Slide: -out +in│
└─────────────────────┴──────────────────┴─────────────────┴─────────────┘
```

> [!NOTE]
> **Self-Check:** If an input array has $n = 100,000$ numbers and $k = 30,000$, how many math operations does the sliding window perform versus recalculating from scratch?  
> *Answer:* Recalculating from scratch takes $(n - k + 1) \times k \approx 70,000 \times 30,000 = 2.1 \times 10^9$ operations (freezing Node.js). The sliding window does $k$ initial additions and then 2 operations per step $\approx 170,000$ operations (finishing in under 2 milliseconds).

---

### 1.2 Rolling Arithmetic vs Recomputation

| Strategy | Operations Per Window | Total Time Complexity | Extra Space | Node.js Impact |
| :--- | :---: | :---: | :---: | :--- |
| **Naive Slicing (`.slice().reduce()`)** | $O(k)$ | **$O(n \cdot k)$** | $O(k)$ memory churn | Garbage collector pauses, slow execution |
| **Fixed Sliding Window** | $O(1)$ | **$O(n)$** | $O(1)$ | Non-blocking, instant execution |

When calculating averages, do not divide by $k$ inside the loop. Small decimal rounding errors add up over thousands of steps. Keep the raw sum as an integer inside the loop, and divide by $k$ just once at the very end.

---

### 1.3 Operations Reference Table

| Operation | Role in Fixed Window | Time Complexity | Extra Space | Code Example |
| :--- | :--- | :---: | :---: | :--- |
| **Build Initial Window** | Sums first $k$ items ($0 \dots k - 1$) | $O(k)$ | $O(1)$ | `for (let i = 0; i < k; i++) sum += arr[i]` |
| **Slide Window** | Subtract leaving `arr[i - k]`, add entering `arr[i]` | $O(1)$ | $O(1)$ | `sum += arr[i] - arr[i - k]` |
| **Update Best Answer** | Keeps track of maximum or minimum sum | $O(1)$ | $O(1)$ | `maxSum = Math.max(maxSum, sum)` |
| **Update Frequency Counts** | Adjust counts in 26-slot typed array | $O(1)$ | $O(1)$ | `counts[inCode]++; counts[outCode]--` |
| **Check Counts Match** | Compare 26 frequency slots | $O(1)$ | $O(1)$ | `arraysEqual(pCount, sCount)` |

---

## 2. Pattern Overview

### 2.1 Pattern Family
* **Rolling Sum / Average:** Keeping a running total across fixed sub-arrays.
* **Character Frequency Window:** Keeping a 26-slot count array across fixed-length substrings (like anagram matching).
* **Rolling Hash (Rabin-Karp):** Rolling a hash value across strings to find substrings quickly.
* **Monotonic Deque Window:** Keeping track of the maximum or minimum item in every window of size $k$ using a double-ended queue in $O(n)$ time.

### 2.2 Pattern Recognition Table

| Problem Keyword | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| **"Subarray of length $k$" + "Max/Min sum or average"** | Find the best sum or average over a fixed size $k$. | Fixed window with a running sum. |
| **"Find all anagrams" / "Permutation of string"** | Match character counts across fixed window size $|p|$. | Fixed window with two 26-slot count arrays. |
| **"Substrings of size $k$ with distinct characters"** | Check for unique characters in chunks of size $k$. | Fixed window with character set or count array. |
| **"Sliding window maximum"** | Find the largest number in every window of size $k$. | Fixed window with Monotonic Deque. |

### 2.3 When to Use vs When NOT to Use
* **When to Use**:
* The problem gives a **fixed window size $k$** (or a constant interval).
* The problem asks about contiguous sub-arrays or sub-strings, not scattered items.
* You can calculate the next window by subtracting the item that left and adding the item that entered.

* **When NOT to Use**:
* The window must grow or shrink based on conditions (use **Variable Sliding Window**, Day 09).
* Negative numbers exist and you need an exact target sum with arbitrary lengths (use **Prefix Sum + Hash Map**, Day 10).
* Items can be picked in any order (use **Greedy** or **Two Pointers**).

### 2.4 The 10^7 Operations Rule
If $n = 100,000$ and $k = 50,000$:
* A brute-force nested loop runs $(n - k + 1) \times k \approx 2.5 \times 10^9$ operations, freezing single-threaded Node.js for over 15 seconds.
* A fixed sliding window runs $n = 100,000$ single-step operations, finishing in **under 2 milliseconds**.

---

## 3. Problem Walkthroughs

---

### 3.1 Maximum Average Subarray I

#### 3.1.1 Problem Statement
You are given an integer array `nums` consisting of $n$ elements, and an integer $k$. Find a contiguous subarray whose **length is equal to $k$** that has the maximum average value and return this value. Any calculation error less than $10^{-5}$ will be accepted.

* **Sample Input 1:** `nums = [1, 12, -5, -6, 50, 3]`, `k = 4` $\to$ **Expected Output:** `12.75000`  
  *(Subarray `[12, -5, -6, 50]` has sum $51$, average $51 / 4 = 12.75$)*
* **Sample Input 2:** `nums = [5]`, `k = 1` $\to$ **Expected Output:** `5.00000`
* **Sample Input 3:** `nums = [-1]`, `k = 1` $\to$ **Expected Output:** `-1.00000`
* **Constraints:** $n == nums.length$, $1 \le k \le n \le 10^5$, $-10^4 \le nums[i] \le 10^4$.

#### 3.1.2 How to Think About It
Lay out numbered cards on a table: `[ 1, 12, -5, -6, 50, 3 ]`.  
Take a cardboard frame that shows exactly $k = 4$ cards at a time.
1. Place the frame over the first 4 cards: `[ 1, 12, -5, -6 ]`.  
   Add them up: $1 + 12 - 5 - 6 = 2$.  
   Save `maxSum = 2`.
2. Slide the frame one spot to the right:  
   Card `1` (at index 0) leaves on the left.  
   Card `50` (at index 4) enters on the right.  
   New sum = $2 - 1 + 50 = 51$.  
   Since $51 > 2$, update `maxSum = 51`.
3. Slide the frame one more spot:  
   Card `12` leaves, card `3` enters.  
   New sum = $51 - 12 + 3 = 42$.  
   Since $42 < 51$, `maxSum` stays $51$.
4. Divide `maxSum` by $k = 4$ just once at the very end: $51 / 4 = 12.75$.

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

* **The Bottleneck:** Neighbor windows share $k - 1$ identical numbers. The brute force way re-adds those same numbers every single time, causing $O(n \cdot k)$ work ($2.5 \times 10^9$ operations on big arrays).

#### 3.1.4 The Pattern Insight
Instead of re-adding $k$ items, reuse the sum you already have:
* Subtract the leaving item `nums[i - k]`.
* Add the entering item `nums[i]`.
* This makes each window update take $O(1)$ constant time.
* Keep the raw sum as an integer and divide by $k$ only at the return statement to avoid floating-point errors.

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
// ✅ CORRECT: Optimal O(n) time, O(1) space fixed sliding window
function findMaxAverage(nums, k) {
  if (!Array.isArray(nums) || nums.length < k || k <= 0) return 0;

  // Phase 1: Sum the first window of length k
  let currentSum = 0;
  for (let i = 0; i < k; i++) {
    currentSum += nums[i];
  }

  let maxSum = currentSum;

  // Phase 2: Slide across the remaining elements
  for (let i = k; i < nums.length; i++) {
    currentSum += nums[i] - nums[i - k];
    if (currentSum > maxSum) {
      maxSum = currentSum;
    }
  }

  // Single division at return prevents float rounding accumulation
  return maxSum / k;
}

// Example runs
console.log(findMaxAverage([1, 12, -5, -6, 50, 3], 4)); // 12.75
console.log(findMaxAverage([5], 1));                   // 5
console.log(findMaxAverage([-1], 1));                  // -1
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Dividing by k inside the loop and initializing maxAvg to 0
function buggyFindMaxAverage(nums, k) {
  let avg = 0;
  for (let i = 0; i < k; i++) avg += nums[i] / k;

  // BUG 1: Initializing to 0 fails completely when all numbers are negative!
  let maxAvg = 0;

  for (let i = k; i < nums.length; i++) {
    // BUG 2: Repeated float division accumulates IEEE-754 precision drift
    avg += (nums[i] - nums[i - k]) / k;
    maxAvg = Math.max(maxAvg, avg);
  }
  return maxAvg;
}
```
* **Why it fails:** If all numbers are negative (like `nums = [-5, -2], k = 2`), setting `maxAvg = 0` makes the code return `0` instead of `-3.5`. Also, dividing by $k$ inside the loop causes decimal precision drift.

#### 3.1.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The first loop does $k$ steps. The second loop does $n - k$ steps. Total steps: $k + (n - k) = n$.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. We only store two numbers (`currentSum` and `maxSum`) in memory.

---

### 3.2 Find All Anagrams in a String

#### 3.2.1 Problem Statement
Given two strings `s` and `p`, return an array of all the start indices of `p`'s anagrams in `s`. You may return the answer in any order.

An Anagram is a word or phrase formed by rearranging the letters of another word or phrase, using all the original letters exactly once.

* **Sample Input 1:** `s = "cbaebabacd"`, `p = "abc"` $\to$ **Expected Output:** `[0, 6]`  
  *(Substring `"cba"` at index 0 and `"bac"` at index 6 are anagrams of `"abc"`)*
* **Sample Input 2:** `s = "abab"`, `p = "ab"` $\to$ **Expected Output:** `[0, 1, 2]`
* **Sample Input 3:** `s = "hello"`, `p = "world"` $\to$ **Expected Output:** `[]`
* **Constraints:** $1 \le s.length, p.length \le 3 \times 10^4$, `s` and `p` consist of lowercase English letters.

#### 3.2.2 How to Think About It
Imagine you have letter tiles for `p = "abc"`. Its length is $k = 3$.  
You slide a 3-letter frame across `s = "cbaebabacd"`:
1. Window at index 0 is `"cba"`. Count of `'a'` is 1, `'b'` is 1, `'c'` is 1. This matches `p`! Add index `0` to results.
2. Slide to index 1: Drop `'c'` on the left, add `'e'` on the right. Current window is `"bae"`. Letter `'e'` does not belong! Mismatch.
3. Slide to index 2: Drop `'b'`, add `'b'`. Window is `"aeb"`. Mismatch.
4. Keep sliding until index 6 (`"bac"`). The letter counts match `p` again! Add index `6` to results.

#### 3.2.3 Brute Force Approach & Bottleneck
The naive way cuts out every substring of length $k$, sorts its letters, and compares it to sorted `p`:

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

* **The Bottleneck:** Sorting every chunk takes $O(k \log k)$ time, leading to $O(n \cdot k \log k)$ total time. Creating new strings on every step also causes heavy memory allocations.

#### 3.2.4 The Pattern Insight
You do not need to sort strings to check for an anagram. You only need to compare letter counts.
* The window size is fixed at $k = p.length$.
* Use two fixed 26-slot integer arrays (`pCount` and `sCount`).
* On each slide:
  - Subtract 1 from count of the leaving letter: `sCount[s.charCodeAt(i - k) - 97]--`.
  - Add 1 to count of the entering letter: `sCount[s.charCodeAt(i) - 97]++`.
  - Compare the two 26-slot arrays in $O(26) = O(1)$ constant time.

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
// ✅ CORRECT: Optimal O(n) time, O(1) space fixed sliding window frequency matching
function findAnagrams(s, p) {
  const result = [];
  if (typeof s !== "string" || typeof p !== "string" || s.length < p.length) {
    return result;
  }

  const k = p.length;
  const pCount = new Int32Array(26);
  const sCount = new Int32Array(26);
  const aCode = 97; // 'a'.charCodeAt(0)

  // Phase 1: Build frequencies for p and initial window of s
  for (let i = 0; i < k; i++) {
    pCount[p.charCodeAt(i) - aCode]++;
    sCount[s.charCodeAt(i) - aCode]++;
  }

  if (arraysEqual(pCount, sCount)) {
    result.push(0);
  }

  // Phase 2: Slide window across remaining characters of s
  for (let i = k; i < s.length; i++) {
    sCount[s.charCodeAt(i) - aCode]++;       // Add incoming character
    sCount[s.charCodeAt(i - k) - aCode]--;   // Remove outgoing character

    if (arraysEqual(pCount, sCount)) {
      result.push(i - k + 1);
    }
  }

  return result;
}

// Constant-time comparison: exactly 26 iterations = O(1)
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
// ❌ ANTI-PATTERN: Allocating new Map on every window slide
function buggyFindAnagramsMap(s, p) {
  const result = [];
  // BUG: Allocates a new Map object in heap memory on every loop index
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
* **Why it fails:** Making a brand new `Map` on every loop step wastes memory and slows down execution, turning an $O(n)$ pattern back into an $O(n \cdot k)$ bottleneck.

#### 3.2.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$, where $n = s.length$. Setting up initial counts takes $O(k)$ time. Sliding the window runs $n - k$ times. In each step, updating the array is $O(1)$ and checking equality takes 26 steps ($O(1)$). Total time: $O(k) + 26 \times O(n - k) = O(n)$.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. We allocate exactly two 26-slot typed arrays, which never grow with string length.

---

### 3.3 Permutation in String

#### 3.3.1 Problem Statement
Given two strings `s1` and `s2`, return `true` if `s2` contains a permutation of `s1`, or `false` otherwise.

In other words, return `true` if one of `s1`'s permutations is a substring of `s2`.

* **Sample Input 1:** `s1 = "ab"`, `s2 = "eidbaooo"` $\to$ **Expected Output:** `true`  
  *(Substring `"ba"` at index 3 is a permutation of `"ab"`)*
* **Sample Input 2:** `s1 = "ab"`, `s2 = "eidboaoo"` $\to$ **Expected Output:** `false`
* **Sample Input 3:** `s1 = "adc"`, `s2 = "dcda"` $\to$ **Expected Output:** `true`
* **Constraints:** $1 \le s1.length, s2.length \le 10^4$, `s1` and `s2` consist of lowercase English letters.

#### 3.3.2 How to Think About It
A permutation of `s1` has the exact same letters and length as `s1`.  
Because every permutation has length equal to `s1.length`, this problem is identical to checking if any window of size $k = s1.length$ in `s2` has the exact same letter counts as `s1`.  
Slide a frame of size `s1.length` across `s2`. The moment the counts inside the window match `s1`, return `true` right away!

#### 3.3.3 Brute Force Approach & Bottleneck
Generating all permutations of `s1` takes $O(k!)$ factorial time. If $k = 10$, $10! = 3,628,800$ permutations. Checking them against `s2` freezes your application immediately.

#### 3.3.4 The Pattern Insight
Never generate permutations. Use a **Fixed Sliding Window of size $k = s1.length$**:
* Track letter counts using two 26-slot arrays.
* Slide the window across `s2`.
* Check if counts match. If they match, exit early with `true`.
* If the loop finishes without a match, return `false`.

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
// ✅ CORRECT: Optimal O(n) time, O(1) space fixed sliding window early exit
function checkInclusion(s1, s2) {
  if (typeof s1 !== "string" || typeof s2 !== "string" || s1.length > s2.length) {
    return false;
  }

  const k = s1.length;
  const count1 = new Int32Array(26);
  const count2 = new Int32Array(26);
  const aCode = 97;

  // Phase 1: Build initial window
  for (let i = 0; i < k; i++) {
    count1[s1.charCodeAt(i) - aCode]++;
    count2[s2.charCodeAt(i) - aCode]++;
  }

  if (matches26(count1, count2)) return true;

  // Phase 2: Slide across s2
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
// ❌ ANTI-PATTERN: Generating all string permutations
function buggyCheckInclusion(s1, s2) {
  // BUG: Factorial O(k!) complexity explodes when s1.length >= 8
  const permutations = generatePermutations(s1);
  for (const perm of permutations) {
    if (s2.includes(perm)) return true;
  }
  return false;
}
```
* **Why it fails:** Generating permutations takes factorial $O(k!)$ time. For $k = 10$, that is over 3.6 million strings, which crashes Node.js memory.

#### 3.3.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$, where $n = s2.length$. Building the initial window takes $O(k)$ steps. The slide loop runs $n - k$ times, doing $O(1)$ operations per step. Total time is $O(n)$.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. We only allocate two 26-slot integer arrays.

---

## 4. Tricky Edge Cases

* **Window Size $k$ Larger than Array ($k > n$):** Always check `if (nums.length < k || k <= 0) return 0;` at the beginning. If you miss this, negative indices cause `NaN` errors.
* **All Negative Numbers:** When looking for the maximum sum, setting `maxSum = 0` will give the wrong answer `0` instead of the true negative max. Always start `maxSum` with the sum of the first window (`currentSum`) or `-Infinity`.
* **Decimal Precision Drift:** Calculating `sum += nums[i] / k` inside an $n$-step loop creates small decimal rounding errors. Keep the raw sum as an integer and divide by $k$ once at the end.
* **Single Element Arrays:** When $n = 1$ and $k = 1$, the sliding loop does not run. The code directly returns the initial window sum.

---

## 5. Summary Cheat Sheet

* **Fixed Window Invariant:** The window length stays constant ($k$). Calculate each new window by subtracting the leaving item and adding the entering item.
* **Formula:** $\text{windowState} = \text{windowState} + \text{arr}[i] - \text{arr}[i - k]$.
* **Replaces $O(n \cdot k)$ with $O(n)$:** Neighbor windows share $k - 1$ items; re-adding them from scratch is wasted work.
* **Character Matching:** For fixed string anagrams, use two 26-slot typed arrays (`new Int32Array(26)`) and compare them in $O(1)$ time.
* **Avoid Array Slicing:** Avoid calling `slice()` and `reduce()` inside loops to keep garbage collection fast and smooth in Node.js.

---

## 6. Practice Problems

### 6.1 Substrings of Size Three with Distinct Characters

Given a string `s`, return the number of good substrings of length three. A string is good if there are no repeated characters.

* **Difficulty:** Easy | **Focus:** Fixed Window Validation
* **Sample Input 1:** `s = "xyzzaz"` $\to$ **Expected Output:** `1` (Only `"xyz"` has distinct characters)
* **Sample Input 2:** `s = "aababcabc"` $\to$ **Expected Output:** `4` (Substrings: `"abc"`, `"bca"`, `"cab"`, `"abc"`)
* **Sample Input 3:** `s = "aa"` $\to$ **Expected Output:** `0`
* **Constraints:** $1 \le s.length \le 100$, `s` consists of lowercase English letters.
* **Hint 1:** Because $k = 3$ is constant and small, check characters directly using indices `i - 2`, `i - 1`, and `i` without calling `slice()`.
* **Hint 2:** Test `s[i - 2] !== s[i - 1] && s[i - 1] !== s[i] && s[i - 2] !== s[i]`. If true, add 1 to your count.

---

### 6.2 Maximum Number of Vowels in a Substring of Given Length

Given a string `s` and an integer `k`, return the maximum number of vowel letters (`'a'`, `'e'`, `'i'`, `'o'`, `'u'`) in any substring of `s` with length `k`.

* **Difficulty:** Medium | **Focus:** Rolling Count State Transition
* **Sample Input 1:** `s = "abciiidef"`, `k = 3` $\to$ **Expected Output:** `3` (The substring `"iii"` contains 3 vowels)
* **Sample Input 2:** `s = "aeiou"`, `k = 2` $\to$ **Expected Output:** `2`
* **Sample Input 3:** `s = "leetcode"`, `k = 3` $\to$ **Expected Output:** `2`
* **Constraints:** $1 \le s.length \le 10^5$, $1 \le k \le s.length$, `s` consists of lowercase English letters.
* **Hint 1:** Create a helper or Set to check if a character is a vowel in $O(1)$ time.
* **Hint 2:** Count the vowels in the first $k$ characters.
* **Hint 3:** Slide from $i = k$ to $n - 1$: if the entering character is a vowel, add 1 to count. If the leaving character `s[i - k]` was a vowel, subtract 1 from count. Keep track of `maxVowels`.

---

### 6.3 Sliding Window Maximum

You are given an array of integers `nums`, there is a sliding window of size `k` which is moving from the very left of the array to the very right. You can only see the `k` numbers in the window. Each time the sliding window moves right by one position, return the max sliding window.

* **Difficulty:** Hard | **Focus:** Monotonic Deque Optimization
* **Sample Input 1:** `nums = [1, 3, -1, -3, 5, 3, 6, 7]`, `k = 3` $\to$ **Expected Output:** `[3, 3, 5, 5, 6, 7]`
* **Sample Input 2:** `nums = [1]`, `k = 1` $\to$ **Expected Output:** `[1]`
* **Sample Input 3:** `nums = [1, -1]`, `k = 1` $\to$ **Expected Output:** `[1, -1]`
* **Constraints:** $1 \le nums.length \le 10^5$, $-10^4 \le nums[i] \le 10^4$, $1 \le k \le nums.length$.
* **Hint 1:** If an entering number `nums[i]` is bigger than older numbers in the window, those smaller numbers can never be the maximum of this or future windows.
* **Hint 2:** Keep a double-ended queue (deque) of indices storing values in decreasing order.
* **Hint 3:** Before adding `i`, remove smaller numbers from the back. Remove the front index if it has fallen outside the window (`deque[front] <= i - k`). Once $i \ge k - 1$, `nums[deque[front]]` is the maximum for that window.

---

<nav aria-label="Lecture navigation">

[Previous: Fast & Slow Pointers](day-07-two-pointers-fast-slow-and-partitioning.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Variable Sliding Window](day-09-sliding-window-variable-size.md)

</nav>
