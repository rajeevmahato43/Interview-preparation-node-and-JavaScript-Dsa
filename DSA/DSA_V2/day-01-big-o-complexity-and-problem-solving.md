# Day 01: Big O Complexity & Problem Solving

<nav aria-label="Lecture navigation">

[Roadmap](../javascript-dsa-roadmap.md) | [Next: Arrays, Strings & Memory](day-02-arrays-strings-and-primitive-memory.md)

</nav>

## Prerequisites

- Basic JavaScript syntax: `let`, `const`, loops (`for`, `while`), `if/else`, and functions.
- Understanding that code runs line by line.

---

## 1. What is Big O?

**Big O notation** describes how the number of operations or memory needs of a program grow as the input size $n$ gets larger.

> **Big O**: A way to measure code efficiency that counts steps instead of clock seconds, because seconds change depending on your computer's CPU, battery, and background apps.

Big O measures two things:
1. **Time Complexity**: How many steps code takes as input size $n$ grows.
2. **Space Complexity**: How much extra memory code allocates as input size $n$ grows.

```text
Operations (Work)
  ^
  |                                 / O(2^n) - Exponential (Freezes at n > 30)
  |                                /
  |                               / O(n^2) - Quadratic (Slow at n > 10,000)
  |                              /
  |                             / / O(n log n) - Fast sorting benchmark
  |                            / /
  |                           / / / O(n) - Linear (Proportional to input)
  |                          / / /
  |                         / / / / O(log n) - Logarithmic (Halves work each step)
  |  ──────────────────────/─/─/─/─ O(1) - Constant (Same speed always)
  +───────────────────────────────────────────────────> Input Size (n)
```

### The Three Asymptotic Bounds

In technical interviews, algorithms are characterized by three mathematical bounds:

> **Big O ($O$)**: The **upper bound** (worst-case). It represents the absolute maximum work the algorithm will ever perform. Interviewers ask for Big O in 99% of technical evaluations.

> **Big Omega ($\Omega$)**: The **lower bound** (best-case). It represents the minimum work required under the most favorable input scenario (e.g., finding the target at index 0 on the very first comparison takes $\Omega(1)$).

> **Big Theta ($\Theta$)**: The **tight bound** (exact match). Used when an algorithm's best-case and worst-case run in the exact same order of growth (e.g., Merge Sort always executes in $\Theta(n \log n)$ steps).

---

## 2. Constraint-to-Complexity Decoding

In technical assessments and live coding interviews, the problem statement always specifies input constraints (such as $1 \le n \le 10^5$). 

Because modern server CPUs execute roughly $10^7$ to $10^8$ basic operations per second before hitting a 1-second timeout, the constraint $n$ **strictly dictates the allowable Big-O complexity before you write a single line of code**.

Most candidates read the problem text first and guess an algorithm. Senior engineers do the reverse: they glance at the input constraint $n$ first. The constraint strictly dictates which algorithms are mathematically possible before you write a single line of code.

Input constraints help us choose the right algorithm by checking whether the worst-case operations, at the maximum value of $n$, stay within the acceptable execution limit of roughly $10^7$ to $10^8$ operations.

```text
The Constraint-to-Complexity Decision Flow:
"Given an array of size n = 100,000..."
  |
  +---> Could it be O(n^2)?
  |     (100,000)^2 = 10,000,000,000 (10^10) operations.
  |     Takes ~100 seconds! REJECT IMMEDIATELY.
  |
  +---> Could it be O(n log n)?
  |     100,000 * 17 ≈ 1,700,000 operations.
  |     Takes ~0.02 seconds! ACCEPTABLE: Sorting, Heaps, Divide & Conquer.
  |
  '---> Could it be O(n)?
        100,000 operations.
        Takes ~0.001 seconds! OPTIMAL: Hash Maps, Two Pointers, Sliding Window.
```

### Constraint Lookup Matrix

| Input Constraint ($n$) | Max Operations (as per input) | Max Complexity | Target Algorithmic Paradigms | Classic LeetCode Archetypes |
| :--- | :--- | :--- | :--- | :--- |
| **$n \le 10$** | **~3.6 Million** | $O(n!)$ | Permutations, Combinatorial Backtracking | *Permutations, N-Queens* |
| **$n \le 20$** | **~1 Million** | $O(2^n)$ | Subsets, Power Set, Bitmask DP | *Subsets, Word Search* |
| **$n \le 100$** | **1 Million** | $O(n^3)$ | 3D Dynamic Programming, Matrix Scans | *Floyd-Warshall* |
| **$n \le 1,000$** | **1 Million** | $O(n^2)$ | 2D Dynamic Programming, Double Loops, All Pairs | *Longest Increasing Subsequence, 3Sum* |
| **$n \le 100,000$ ($10^5$)** | **~1.7 Million** | **$O(n \log n)$** | **Sorting, Binary Heaps, Divide & Conquer** | *Merge Intervals, Top K Frequent Elements* |
| **$n \le 1,000,000$ ($10^6$)** | **1 Million** | **$O(n)$** | **Single Pass, Hash Maps, Two Pointers, Sliding Window** | *Two Sum, Maximum Subarray* |
| **$n \ge 10^9$ (Huge)** | **~30 operations** | **$O(\log n)$ or $O(1)$** | **Binary Search on Solution Space, Bitwise Math** | *Search in Rotated Sorted Array, Sqrt(x)* |

---

## 3. The Common Time Complexities

### $O(1)$ — Constant Time
Work stays exactly the same no matter how big the input is.
```javascript
// Node.js code
function getFirst(arr) {
  return arr.length > 0 ? arr[0] : null; // 1 step
}
```

### $O(\log n)$ — Logarithmic Time
The algorithm divides the remaining search space in half at every step.
- $\log_2(8) = 3$ (divide 8 by 2 three times to reach 1).
- $\log_2(1,000,000) \approx 20$. A search through 1,000,000 items takes only ~20 comparisons!
- The base 2 is dropped in notation because changing logarithm bases only introduces a constant multiplier.

```javascript
// Node.js code
function binarySearch(sortedArr, target) {
  let low = 0;
  let high = sortedArr.length - 1;

  while (low <= high) {
    const mid = Math.floor(low + (high - low) / 2);

    if (sortedArr[mid] === target) return mid; // Found!

    if (sortedArr[mid] < target) {
      low = mid + 1; // Discard left half
    } else {
      high = mid - 1; // Discard right half
    }
  }

  return -1;
}
```

### $O(n)$ — Linear Time
Work grows directly with input size. If size doubles, time doubles.
```javascript
// Node.js code
function findMax(arr) {
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) max = arr[i];
  }
  return max;
}
```

### $O(n \log n)$ — Linearithmic Time
Optimal benchmark for comparison-based sorting (Merge Sort, QuickSort average, V8 `Array.prototype.sort()`). It divides the problem into logarithmic levels and does $O(n)$ work across each level.
- For $n = 8$: $8 \times \log_2(8) = 8 \times 3 = 24$ operations (8 items processed across 3 division levels).
- For $n = 1,000$: $1,000 \times \log_2(1,000) \approx 1,000 \times 10 \approx 10,000$ operations (only 10× more work than a single pass $O(n)$).
- For $n = 1,000,000$: $1,000,000 \times \log_2(1,000,000) \approx 1,000,000 \times 20 \approx 20,000,000$ operations (sorting 1 million items takes only ~20 million ops, finishing in ~0.2s!).
- Intuition: Think of it as "linear work ($n$) repeated across logarithmic depth ($\log n$)"—like dividing an array in half repeatedly, then merging all $n$ items at each level.

```javascript
// Node.js code
function sortNumbers(arr) {
  return [...arr].sort((a, b) => a - b);
}
```

### $O(n^2)$ — Quadratic Time
A loop inside another loop over the same list. Freezes when $n \ge 10,000$.
```javascript
// Node.js code: Naive Pair Check
function hasDuplicateNaive(arr) {
  // Outer loop runs n times; inner loop runs n times -> n * n operations
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) return true;
    }
  }
  return false;
}
```

---

### $O(2^n)$ — Exponential Time
Work doubles with each additional element added to the input. Unusable for $n > 30$.

```javascript
// Node.js code: Naive Fibonacci
function fibonacci(n) {
  if (n <= 1) return n;
  // Spawns 2 recursive branches per step -> 2^n calls
  return fibonacci(n - 1) + fibonacci(n - 2);
}
```

---

### $O(n!)$ — Factorial Time
Work grows by multiplying by each decreasing integer ($n \times (n-1) \times (n-2) \dots$). Crashes for $n > 12$.
- For $n = 3$: $3! = 3 \times 2 \times 1 = 6$ operations (all arrangements of `[A, B, C]`).
- For $n = 10$: $10! = 3,628,800$ operations (~3.6 million ops, finishes in ~0.03s).
- For $n = 13$: $13! = 6,227,020,800$ operations (~6.2 billion ops, takes >60 seconds $\to$ instant TLE / crash!).
- Intuition: Think of placing items into spots one by one. Spot 1 has $n$ choices, Spot 2 has $n-1$, Spot 3 has $n-2$... Total ways = $n \times (n-1) \times \dots \times 1 = n!$.

```javascript
// Node.js code: Generating all permutations of an array
function getPermutations(arr) {
  if (arr.length <= 1) return [arr];
  const permutations = [];

  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
    const subPerms = getPermutations(remaining);

    for (const sub of subPerms) {
      permutations.push([current, ...sub]);
    }
  }

  return permutations;
}
```

---

## 4. The 5 Rules for Big O

1. **Drop Constant Numbers:** $O(2n) \to O(n)$. Doing 2 loops is still linear.
2. **Drop Smaller Terms:** $O(n^2 + 5n) \to O(n^2)$. As $n$ grows, $n^2$ dominates.
3. **Different Inputs Don't Mix:** If a function loops through array `A` and array `B`, sequential loops are **$O(A + B)$**, not $O(n)$. Nested loops are **$O(A \times B)$**.
4. **Fixed Loops Are $O(1)$:** A loop that always runs 10 times is constant time ($O(1)$).
5. **Sequential Adds, Nested Multiplies:**
   - One loop after another $\implies O(n + m)$
   - One loop inside another $\implies O(n \times m)$

---

## 5. Space Complexity: Extra Memory vs Call Stack

Space complexity measures **how much extra memory** an algorithm needs.

> **Auxiliary Space**: Extra memory allocated by your code (variables, new arrays, hash maps, and recursion call stack frames).

```javascript
// Node.js code
// Takes O(n) extra space because it makes a new copy of the array
function duplicate(arr) {
  const copy = [];
  for (const item of arr) copy.push(item);
  return copy;
}
```

### The Call Stack Trap
Every time a function calls itself, Node.js places a new frame on the call stack. A recursion depth of $n$ takes **$O(n)$ extra memory**, even with zero local variables!

---

## 6. What is Amortized Time?

> **Amortized**: The average time per operation over a long sequence, even if one single step is occasionally slow.

In JavaScript, `arr.push()` is **$O(1)$ amortized**.
- Usually, pushing to an array takes 1 step ($O(1)$).
- Once the internal memory buffer fills up, V8 doubles the array capacity and copies elements over ($O(n)$).
- Because doubling happens rarely, the average cost per push is still **$O(1)$**.

---

## 7. How Slow Loops Break Node.js

Node.js runs JavaScript on a **single main thread**. 
- If you run an $O(n^2)$ loop that takes 2 seconds to complete, the entire server freezes.
- No other users can connect, database results cannot be read, and health checks fail.
- **Rule for Node.js backends:** Keep synchronous request algorithms to $O(n)$ or $O(n \log n)$.

---

## 8. Common Traps & Edge Cases

1. **Hidden loops inside built-in methods:**
   ```javascript
   // ❌ Anti-pattern: indexOf() is a loop inside filter() -> O(n^2)!
   arr.filter((item, idx) => arr.indexOf(item) === idx);

   // ✅ Clean pattern: Set lookup is O(1) -> O(n) total!
   Array.from(new Set(arr));
   ```
2. **`arr.shift()` and `arr.unshift()` are $O(n)$:** They shift every item in memory. Use a head pointer or a real queue instead.
3. **Recursion depth limit:** V8 throws `RangeError: Maximum call stack size exceeded` around 10,000 calls. Convert deep recursion to loops.

---

## 9. Hands-On Exercises

Run this script in Node.js to verify linear vs binary search operations:

```javascript
// Node.js code
const assert = require("node:assert");

function linearSearchCount(arr, target) {
  let steps = 0;
  for (let i = 0; i < arr.length; i++) {
    steps++;
    if (arr[i] === target) break;
  }
  return steps;
}

function binarySearchCount(arr, target) {
  let steps = 0, low = 0, high = arr.length - 1;
  while (low <= high) {
    steps++;
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) break;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return steps;
}

const numbers = Array.from({ length: 1024 }, (_, i) => i + 1);
const linearSteps = linearSearchCount(numbers, 1024);
const binarySteps = binarySearchCount(numbers, 1024);

assert.equal(linearSteps, 1024);
assert.equal(binarySteps <= 11, true); // log2(1024) = 10 steps!

console.log(`✅ Linear steps: ${linearSteps}, Binary steps: ${binarySteps}`);
```

---

## 10. Summary

- **Big O** measures how operations and memory grow as input size $n$ grows.
- **Read constraints first:** $n \le 10^5$ requires $O(n)$ or $O(n \log n)$; reject $O(n^2)$.
- **Key complexities:** $O(1) < O(\log n) < O(n) < O(n \log n) < O(n^2) < O(2^n)$.
- **Auxiliary space** counts extra memory including recursion stack frames.
- **Node.js reality:** Heavy synchronous loops block the single-threaded event loop.

---

## 11. Cheat Sheet

| Big O | Name | Operations for $n = 1,000$ | Example |
| :--- | :--- | :--- | :--- |
| **$O(1)$** | Constant | 1 | `arr[0]`, `map.get()` |
| **$O(\log n)$** | Logarithmic | $\approx 10$ | Binary Search |
| **$O(n)$** | Linear | 1,000 | Single `for` loop |
| **$O(n \log n)$** | Linearithmic | $\approx 10,000$ | `arr.sort()`, Merge Sort |
| **$O(n^2)$** | Quadratic | 1,000,000 | Nested loops |
| **$O(2^n)$** | Exponential | Huge | Naive recursion |

---

## 12. Interview Q&A

### 45-Second Explanation
> *"Big O measures how our algorithm's work scales as the input size grows. In this problem, because $n$ is up to $100,000$, a nested loop of $O(n^2)$ would require 10 billion operations and freeze the Node.js event loop. Instead, we can use a Hash Map to bring lookup time down to $O(1)$, giving us an overall $O(n)$ solution in exchange for $O(n)$ extra memory."*

### Questions & Answers
1. **Why do we ignore constant numbers like 3 in $O(3n)$?**
   Because Big O measures the growth rate curve. Doubling $n$ doubles the work in both $O(n)$ and $O(3n)$.
2. **Why is `arr.shift()` slow in a loop?**
   Because removing the first element forces every other element in contiguous memory to move 1 slot to the left, taking $O(n)$ steps every time.

---

## 13. Practice Problems

### 1. Two Sum  - Easy
Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.
- **Input:** `nums = [2, 7, 11, 15]`, `target = 9`
- **Expected Output:** `[0, 1]`
- **Input:** `nums = [3, 2, 4]`, `target = 6`
- **Expected Output:** `[1, 2]`
- **Input:** `nums = [3, 3]`, `target = 6`
- **Expected Output:** `[0, 1]`

### 2. Contains Duplicate - Easy
Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.
- **Input:** `nums = [1, 2, 3, 1]`
- **Expected Output:** `true`
- **Input:** `nums = [1, 2, 3, 4]`
- **Expected Output:** `false`
- **Input:** `nums = [1, 1, 1, 3, 3, 4, 3, 2, 4, 2]`
- **Expected Output:** `true`

### 3. Maximum Subarray - Medium
Given an integer array `nums`, find the subarray with the largest sum, and return its sum.
- **Input:** `nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]`
- **Expected Output:** `6` (Explanation: The subarray `[4, -1, 2, 1]` has the largest sum `6`.)
- **Input:** `nums = [1]`
- **Expected Output:** `1`
- **Input:** `nums = [5, 4, -1, 7, 8]`
- **Expected Output:** `23`

---

<nav aria-label="Lecture navigation">

[Roadmap](../javascript-dsa-roadmap.md) | [Next: Arrays, Strings & Memory](day-02-arrays-strings-and-primitive-memory.md)

</nav>
