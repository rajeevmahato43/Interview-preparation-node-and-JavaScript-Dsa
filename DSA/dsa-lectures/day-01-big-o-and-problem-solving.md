# Day 01: Big O Notation and Problem-Solving Mindset

<nav aria-label="Lecture navigation">

[Roadmap](../javascript-dsa-roadmap.md) | [Next: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md)

</nav>

## Prerequisites

- Basic JavaScript syntax: variables (`let`, `const`), loops (`for`, `while`), `if/else` checks, and functions.
- Basic understanding of how code runs line-by-line ([JS Day 01: Execution Model and Syntax](../../Javascript/javascript-lectures/day-01-execution-model-and-syntax.md)).

---

## 1. What Big O Actually Measures

Big O notation is a way to describe how the performance of an algorithm changes as the input size grows. 

It does **not** calculate code execution time in seconds. Wall-clock time (using `Date.now()` or `performance.now()`) fluctuates because of CPU hardware differences, background operating system processes, memory garbage collection, and runtime compiler optimizations (like Node.js V8 TurboFan).

Instead, Big O counts the **number of basic operations** (comparisons, arithmetic steps, assignments, or pointer lookups) as the input size $n$ gets bigger.

> When the input size $n$ doubles, by what factor does the total work increase?

It usually measures:
1. **Time complexity**: How many steps/operations an algorithm runs as input grows.
2. **Space complexity**: How much extra memory an algorithm allocates as input grows.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            ASYMPTOTIC GROWTH RATE COMPARISON                                │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Operations (Work)
      ^
      |                                                / O(n!) - Factorial (Catastrophic)
      |                                               /
      |                                              / O(2^n) - Exponential (Freezes at n > 30)
      |                                             /
      |                                            / O(n^2) - Quadratic (Danger: freezes at n > 10^4)
      |                                           /
      |                                          / / O(n log n) - Linearithmic (Fast sorting)
      |                                         / /
      |                                        / / / O(n) - Linear (Proportional to input)
      |                                       / / /
      |                                      / / / / O(log n) - Logarithmic (Cuts problem in half)
      |                                     / / / /
      |  ───────────────────────────────────/─/─/─/─ O(1) - Constant (Work never grows)
      +───────────────────────────────────────────────────────────────> Input Size (n)
```

### The Three Complexity Notations

In computer science, algorithms have best, average, and worst scenarios:

> **Big O ($O$)**: The **upper bound** (worst-case). It guarantees: *"The work will never be worse than this curve."* This is what interviewers ask for 99% of the time.

> **Big Omega ($\Omega$)**: The **lower bound** (best-case). For example, checking if an already-sorted array has a target might finish on the very first check in $\Omega(1)$ steps.

> **Big Theta ($\Theta$)**: The **tight bound** (exact match). When the best-case and worst-case follow the exact same growth rate (e.g., Merge Sort is always $\Theta(n \log n)$).

---

## 2. Common Big O Time Complexities

Time complexity tells you how an algorithm's execution steps grow as the input size $n$ scales from 10 items to 1 million items.

| Big O | Name | Common Example | Scalability Character |
|---|---|---|---|
| **$O(1)$** | Constant | Accessing an array item by index | Instantaneous (Sub-microsecond) |
| **$O(\log n)$** | Logarithmic | Binary search in a sorted array | Extremely fast (~20 ops for 1 million items) |
| **$O(n)$** | Linear | Single loop over an array | Smooth 1:1 growth |
| **$O(n \log n)$** | Linearithmic | Efficient sorting (`arr.sort()`, Merge Sort) | Optimal comparison sorting benchmark |
| **$O(n^2)$** | Quadratic | Nested loops comparing all pairs | Freezes server at $n \ge 50,000$ |
| **$O(2^n)$** | Exponential | Naive recursive Fibonacci | Unusable for $n > 30$ |
| **$O(n!)$** | Factorial | Generating all permutations of an array | Crashes for $n > 12$ |

---

### O(1) — Constant Time

Work stays strictly identical regardless of whether $n = 1$ or $n = 10,000,000$.

```javascript
// Node.js code
function getFirstElement(arr) {
  // ✅ Single array index lookup: offset calculated instantly in memory
  return arr.length > 0 ? arr[0] : null;
}
```

---

### O(log n) — Logarithmic Time

The algorithm cuts the remaining problem size in half on every step.

- $\log_2(8) = 3$ (divide 8 by 2 three times to reach 1).
- $\log_2(1,000,000) \approx 20$. A search through 1,000,000 items takes only ~20 comparisons!
- The base 2 is dropped in notation because changing logarithm bases only introduces a constant multiplier.

```javascript
// Node.js code
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor(left + (right - left) / 2);

    if (arr[mid] === target) return mid; // Found!

    if (arr[mid] < target) {
      left = mid + 1; // ✅ Throw away left half
    } else {
      right = mid - 1; // ✅ Throw away right half
    }
  }
  return -1;
}
```

---

### O(n) — Linear Time

Work scales in direct 1:1 proportion with input size. Looping through an array once is the classic linear pattern.

```javascript
// Node.js code
function findSum(arr) {
  let total = 0;
  // ✅ Loop runs exactly n times
  for (let i = 0; i < arr.length; i++) {
    total += arr[i];
  }
  return total;
}
```

---

### O(n log n) — Linearithmic Time

This is the optimal speed limit for general sorting algorithms based on comparisons (such as Merge Sort, TimSort in V8's `Array.prototype.sort()`, and Heap Sort). It performs $O(\log n)$ work for each of the $n$ elements.

```javascript
// Node.js code
function sortNumbers(arr) {
  // ✅ V8 uses TimSort under the hood: O(n log n) average & worst case
  return arr.slice().sort((a, b) => a - b);
}
```

---

### O(n²) — Quadratic Time

Work grows with the square of the input size. Typically caused by nested loops where both the inner loop and outer loop run up to $n$.

> At $n = 100,000$, an $O(n^2)$ algorithm runs $10,000,000,000$ operations, locking the Node.js event loop for multiple seconds.

```javascript
// Node.js code
function printAllPairs(arr) {
  // ❌ Nested loop: Outer loop runs n times, inner loop runs n times = n * n
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      console.log(arr[i], arr[j]);
    }
  }
}
```

---

### O(2ⁿ) — Exponential Time

Work doubles with every single item added to the input. If $n = 30$, operations reach $1,073,741,824$. If $n = 40$, operations surpass 1 trillion.

```javascript
// Node.js code
function naiveFibonacci(n) {
  if (n <= 1) return n;
  // ❌ Every call branches into 2 more calls: 2^n calls overall!
  return naiveFibonacci(n - 1) + naiveFibonacci(n - 2);
}
```

---

### O(n!) — Factorial Time

Work multiplies by every positive integer up to $n$ ($n \times (n-1) \times \dots \times 1$). Commonly seen when generating all possible permutations or brute-forcing the Traveling Salesperson problem.

```javascript
// Node.js code
function getAllPermutations(arr) {
  if (arr.length <= 1) return [arr];
  const results = [];

  // ❌ For each element, generates all permutations of the remaining elements
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
    const subPerms = getAllPermutations(remaining);

    for (const sub of subPerms) {
      results.push([current, ...sub]);
    }
  }
  return results;
}
```

---

## 3. Space Complexity and Call Stack Memory

Space complexity measures how much memory an algorithm uses as the input size $n$ grows.

In technical interviews, you must always separate:

1. **Input Space**: The memory occupied by the inputs passed to the function (e.g., an array of $n$ numbers passed in occupies $O(n)$ input memory).
2. **Auxiliary (Extra) Space**: The extra temporary memory allocated by the algorithm itself to do its work (temporary arrays, HashMaps, variables, and recursive call stack frames).

> **Auxiliary Space**: The extra working memory an algorithm allocates during execution, excluding the original input itself. In interviews, "space complexity" almost always means auxiliary space.

### Recursive Call Stack Memory

Every function call in JavaScript creates a new **stack frame** in memory to hold parameters, local variables, and the return address. When a function calls itself recursively, those frames stay in memory until the base case returns.

```javascript
// Node.js code
// ❌ Dangerous: Allocates n stack frames on the call stack!
function recursiveCountdown(n) {
  if (n <= 0) return;
  // If n = 15,000, Node.js throws: RangeError: Maximum call stack size exceeded
  recursiveCountdown(n - 1);
}

// ✅ Safe: Allocates strictly O(1) auxiliary (extra) memory
function iterativeCountdown(n) {
  while (n > 0) {
    n--;
  }
}
```

---

## 4. The 5 Algebraic Simplification Rules

When you count the raw steps in code, you might end up with an expression like $T(n) = 3n^2 + 40n + 150$. Big O simplifies this using 5 clean rules:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           BIG O SIMPLIFICATION CHEAT SHEET                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

 1. DROP CONSTANTS:             O(3n)              ──► O(n)
 2. DROP NON-DOMINANT TERMS:    O(n^2 + 50n + 999) ──► O(n^2)
 3. SEPARATE INDEPENDENT VARS:  O(n_users * m_org) ──► O(N * M)  (Do NOT combine to n^2!)
 4. FIXED LOOPS ARE CONSTANTS:  for j in 0..5      ──► O(1)      (Does not grow with n)
 5. SEQUENTIAL ADDS, NESTED MULTIPLIES:
    Loop A followed by Loop B   ──► O(A + B)
    Loop B inside Loop A        ──► O(A * B)
```

### Rule 1: Drop Constant Multipliers
Constants do not change the mathematical curve of growth as $n$ goes to infinity:
$$O(3n) \to O(n) \quad | \quad O(500) \to O(1) \quad | \quad O\left(\frac{n}{2}\right) \to O(n)$$

### Rule 2: Drop Non-Dominant Terms
As $n$ becomes very large, the fastest-growing term overshadows everything else:
$$O(n^2 + 100n + 5000) \to O(n^2)$$

### Rule 3: Keep Independent Input Variables Separate
If a function accepts two separate inputs `arrA` of length $A$ and `arrB` of length $B$, do not assume they have the same size:
- Nested loops: $O(A \times B)$
- Consecutive loops: $O(A + B)$

### Rule 4: Fixed Inner Loops Are Constants
If an inner loop always runs a fixed number of times regardless of $n$, it does not add an $n$ factor:
```javascript
// Node.js code
function processFixedRows(arr) {
  // Outer loop: runs n times
  // Inner loop: runs exactly 3 times (constant O(1))
  // Total work: 3 * n => O(n) linear time
  for (let i = 0; i < arr.length; i++) {
    for (let k = 0; k < 3; k++) {
      console.log(arr[i]);
    }
  }
}
```

### Rule 5: Consecutive Loops Add; Nested Loops Multiply
- One loop finishes, then another begins: $O(A) + O(B) = O(A + B)$.
- One loop runs inside another: $O(A) \times O(B) = O(A \times B)$.

---

## 5. Big O and the Node.js Event Loop

Why does Big O matter in backend Node.js interviews?

Node.js executes JavaScript on a single thread backed by the libuv event loop. When a route handler executes an unoptimized $O(n^2)$ algorithm:
1. The CPU thread spends seconds computing billions of iterations.
2. The event loop is completely **starved** (frozen).
3. All other incoming HTTP requests queue up in the OS socket buffer until client timeouts expire (`504 Gateway Timeout`).
4. Kubernetes `/healthz` liveness probes fail because the server cannot reply, causing container restarts.

> **Event Loop Starvation**: When heavy synchronous code blocks the single Node.js thread, preventing pending network I/O, database callbacks, and timers from running.

```javascript
// Node.js Express code
// ❌ ANTI-PATTERN: Hidden O(n^2) operation in route handler
app.post('/api/clean-users', (req, res) => {
  const users = req.body.users; // e.g., 50,000 items

  // filter() runs n times.
  // Inside filter, indexOf() scans the array from index 0 (n steps).
  // Total Complexity: O(n * n) = O(n^2)! Freezes server for ~6 seconds!
  const uniqueUsers = users.filter((user, index) => users.indexOf(user) === index);

  res.json({ unique: uniqueUsers });
});

// ✅ PATTERN: Optimized O(n) deduplication using a Hash Set
app.post('/api/clean-users', (req, res) => {
  const users = req.body.users;

  // Set lookup and insertion run in O(1) average time.
  // Total Complexity: O(n) time, O(n) auxiliary space. Finishes in ~10 milliseconds!
  const uniqueUsers = Array.from(new Set(users));

  res.json({ unique: uniqueUsers });
});
```

---

## 6. Execution Trace: Linear Search vs Binary Search

Let's search for `target = 27` in a sorted 16-element array:
`arr = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31]` ($n = 16$).

```javascript
// Node.js code
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor(left + (right - left) / 2);

    if (arr[mid] === target) return mid;
    if (arr[mid] < target) {
      left = mid + 1; // Search right half
    } else {
      right = mid - 1; // Search left half
    }
  }
  return -1;
}
```

### Trace Table:

| Step | Search Range | `left` | `right` | `mid` | `arr[mid]` | Evaluation & Action | Remaining Items |
|---|---|---|---|---|---|---|---|
| **1** | Full array | 0 | 15 | 7 | 15 | $15 < 27 \implies$ Target in right half. Set `left = 8`. | 8 items |
| **2** | Right half | 8 | 15 | 11 | 23 | $23 < 27 \implies$ Target in right half. Set `left = 12`. | 4 items |
| **3** | Top quarter | 12 | 15 | 13 | 27 | $27 == 27 \implies$ **Target Found!** Return index 13. | **1 item** |

**Comparison:**
- **Linear Search**: Scans elements one by one from index 0 to 13 $\implies$ **14 iterations**.
- **Binary Search**: Halves the search range at every step $\implies$ **3 iterations** ($\le \log_2(16) = 4$).

---

## Common Mistakes and Interview Traps

### 1. The "Single Line of Code" Trap
Writing code in a single concise line does not make it $O(1)$ or $O(n)$:
```javascript
// Node.js code
// ❌ Looks like a simple check, but runs in O(n^2) quadratic time!
const hasDuplicates = (arr) => arr.some((item, i) => arr.indexOf(item) !== i);
```
`.some()` loops $n$ times. On every turn, `.indexOf()` loops through the array again ($n$ operations). Total work: $O(n^2)$.

### 2. Overlooking Built-in Array Shift/Unshift Costs
Not all array methods have the same cost:
- `arr.push()` and `arr.pop()` are **$O(1)$ amortized** (add/remove at the end).
- `arr.shift()` and `arr.unshift()` are **$O(n)$** because every item after index 0 must be shifted in memory to update its position.
- Calling `arr.shift()` inside a `for` loop that runs $n$ times creates an unintended **$O(n^2)$** bottleneck!

### 3. Merging Independent Input Variables
When code processes two different inputs, e.g., `users` (size $N$) and `orders` (size $M$):
- Do **not** call it $O(n^2)$.
- The correct answer is **$O(N \times M)$** (nested) or **$O(N + M)$** (consecutive).

---

## Tricky Points and Edge Cases

### 1. Amortized $O(1)$ Array Reallocation
In JavaScript, arrays are dynamic. They grow automatically when you push elements:

> **Amortized Time**: The average time an operation takes over a long series of operations, even if one single run is occasionally slow.

- When you run `arr.push()`, V8 writes to the next open memory slot in $O(1)$ time.
- When the allocated buffer runs out of space, V8 creates a brand new memory block (about $1.5\times$ to $2\times$ bigger) and copies all $n$ existing elements over ($O(n)$ work).
- Because this expensive $O(n)$ copy happens very rarely (only once every $n$ pushes), the average cost per push across all $n$ operations remains $O(1)$.

### 2. Big O for Very Small Inputs ($n < 10$)
Big O describes behavior as $n \to \infty$. When $n$ is very small (like $n = 5$):
- An $O(n^2)$ simple loop can actually run faster than an $O(n \log n)$ algorithm.
- Why? Sophisticated algorithms have extra setup costs (function calls, call stack allocations, memory buffers) that can outweigh their theoretical speed advantage on tiny datasets.

### 3. String Concatenation Inside Loops
In JavaScript, strings are immutable (cannot be changed in place).
```javascript
// Node.js code
// ❌ Creates a new string copy on every iteration: O(n^2) total time!
let result = '';
for (let i = 0; i < n; i++) {
  result += strArr[i];
}

// ✅ Push to array and join: O(n) total time
const buffer = [];
for (let i = 0; i < n; i++) {
  buffer.push(strArr[i]);
}
const finalResult = buffer.join('');
```

### 4. V8 Maximum Call Stack Depth
JavaScript engines have strict limits on recursive depth:
- In Node.js, recursive function calls typically overflow after ~10,000 to 15,000 frames (`RangeError: Maximum call stack size exceeded`).
- Even if an algorithm has an optimal time complexity, deep recursion on large inputs will crash the process if you do not convert it to an iterative approach.

---

## Hands-On Exercise: Two Sum Reimbursement Optimizer

### Scenario
An engineer on your team wrote a service to verify if any two transaction amounts in a ledger sum to a target reimbursement amount. Under load testing with $n = 50,000$ transactions, the service times out and freezes the Node.js event loop.

### Buggy Code
```javascript
// Node.js code
// Time: O(n^2) — Space: O(1)
export function hasReimbursementPairBuggy(transactions, targetAmount) {
  for (let i = 0; i < transactions.length; i++) {
    for (let j = 0; j < transactions.length; j++) {
      // BUG: Compares the same index against itself!
      if (i !== j && transactions[i] + transactions[j] === targetAmount) {
        return true;
      }
    }
  }
  return false;
}
```

### Acceptance Criteria
1. Optimize the algorithm to run in **$O(n)$ time** and **$O(n)$ auxiliary (extra) space**.
2. Never compare an element against itself unless that same value appears twice at different indices.
3. Handle edge cases cleanly: arrays with fewer than 2 items, negative numbers, and duplicates.
4. Verify using Node.js native assertions.

### Solution Code
```javascript
// Node.js code
import assert from 'node:assert/strict';

/**
 * Two Sum pair check using a Hash Set
 * Time Complexity: O(n) — single pass
 * Auxiliary (Extra) Space: O(n) — stores at most n items
 */
export function hasReimbursementPairOptimized(transactions, targetAmount) {
  if (!Array.isArray(transactions) || transactions.length < 2) {
    return false;
  }

  const seenComplements = new Set();

  for (let i = 0; i < transactions.length; i++) {
    const current = transactions[i];
    const complement = targetAmount - current;

    // Check if the required complement was already seen (O(1) average lookup)
    if (seenComplements.has(complement)) {
      return true;
    }

    seenComplements.add(current);
  }

  return false;
}

// Verification Tests
assert.equal(hasReimbursementPairOptimized([10, 20, 30, 40], 50), true); // 20 + 30 = 50
assert.equal(hasReimbursementPairOptimized([25], 50), false);            // Less than 2 items
assert.equal(hasReimbursementPairOptimized([25, 25], 50), true);          // Duplicate items (25 + 25 = 50)
assert.equal(hasReimbursementPairOptimized([-10, 60, 20], 50), true);     // Negative numbers (-10 + 60 = 50)
assert.equal(hasReimbursementPairOptimized([1, 2, 3], 10), false);       // No matching pair
console.log('✅ All test assertions passed.');
```

---

## Summary

- **What Big O Measures**: Big O measures how an algorithm's operation count and memory usage scale as input size $n$ grows toward infinity. It abstracts away CPU speed, OS processes, and garbage collection.
- **The Core Complexities Ranked**:
  - $O(1)$ Constant: Array index lookup, `Set.has()`, `Map.set()`.
  - $O(\log n)$ Logarithmic: Binary search (cuts problem in half each step).
  - $O(n)$ Linear: Single loop scan.
  - $O(n \log n)$ Linearithmic: Optimal comparison sorting (`Merge Sort`, `TimSort`).
  - $O(n^2)$ Quadratic: Nested loops over the same collection.
  - $O(2^n)$ Exponential: Naive branching recursion (unusable for $n > 30$).
  - $O(n!)$ Factorial: All permutations (crashes for $n > 12$).
- **Space Complexity Distinction**: Always separate **Input Space** (size of the input passed in) from **Auxiliary (Extra) Space** (memory created by variables, buffers, and recursion call stack frames).
- **The 5 Simplification Rules**:
  1. Drop constant multipliers: $O(3n) \to O(n)$.
  2. Drop non-dominant terms: $O(n^2 + 50n) \to O(n^2)$.
  3. Keep independent inputs separate: $O(A \times B)$ or $O(A + B)$.
  4. Fixed inner loops are constants: 3 iterations = $O(1)$.
  5. Sequential steps add ($O(A+B)$); nested steps multiply ($O(A \times B)$).
- **Node.js Concurrency Impact**: Node.js runs JavaScript on a single thread. CPU-heavy $O(n^2)$ loops block the libuv event loop, freezing network I/O and causing `504 Gateway Timeout` errors in production.
- **Amortized Analysis**: `Array.push()` runs in $O(1)$ amortized time because memory buffer doubling ($O(n)$ cost) happens rarely, averaging out to $O(1)$ per operation over time.

---

## Cheat Sheet

| Growth Order | Name | Example Algorithm / Operation | Scalability Character |
|---|---|---|---|
| **$O(1)$** | Constant | Array index access, `Set.has()`, `Map.set()` | Instantaneous regardless of $n$ |
| **$O(\log n)$** | Logarithmic | Binary search, balanced BST lookup | Extremely scalable (~20 ops for $10^6$) |
| **$O(n)$** | Linear | Single loop traversal, `arr.indexOf()`, `arr.shift()` | Directly proportional to input size |
| **$O(n \log n)$** | Linearithmic | Merge Sort, TimSort (`arr.sort()`), Quick Sort | Optimal sorting benchmark |
| **$O(n^2)$** | Quadratic | Nested loops, bubble sort, pairwise checks | Dangerous: freezes at $n > 10,000$ |
| **$O(2^n)$** | Exponential | Naive recursive Fibonacci, power sets | Impractical for $n > 30$ |
| **$O(n!)$** | Factorial | Generating all permutations | Impractical for $n > 12$ |

### Common Pitfalls Checklist
- [ ] Confusing lines of code with Big O complexity (`.indexOf()` inside `.filter()` is $O(n^2)$).
- [ ] Forgetting that `arr.shift()` and `arr.unshift()` are $O(n)$ because they re-index every element.
- [ ] Forgetting recursive call stack memory (each recursive call adds an $O(n)$ stack frame).
- [ ] Merging two distinct arrays into $O(n^2)$ instead of $O(A \times B)$.
- [ ] Blocking the Node.js event loop with synchronous loops on large user payloads.

---

## Interview Questions

### 1. What does Big O notation actually measure, and why do we drop constants like the 3 in $O(3n)$?

**Question:** What does Big O notation measure, and why are constant multipliers dropped during asymptotic analysis?

**Answer:** Big O measures how an algorithm's operational work or memory scales as the input size $n$ approaches infinity. It does not measure wall-clock seconds because execution time fluctuates based on CPU speed, operating system background tasks, memory garbage collection, and compiler optimizations.

Constants like the 3 in $O(3n)$ are dropped because they do not change the fundamental mathematical growth curve. Whether an algorithm takes $n$ steps or $3n$ steps, doubling the input doubles the work in both cases (both scale linearly). Furthermore, running an $O(3n)$ algorithm on hardware that is 3 times faster makes it perform identically to $O(n)$, whereas no hardware upgrade can compensate for the performance gap between $O(n)$ and $O(n^2)$ as $n$ grows large.

---

### 2. What is the time and space complexity of this loop, and how many times does the inner body run for $n = 16$?

**Question:** Analyze the time and auxiliary space complexity of this code, and calculate the exact execution count for $n = 16$:
```javascript
// Node.js code
function mystery(n) {
  let count = 0;
  for (let i = 1; i < n; i *= 2) {
    count++;
  }
  return count;
}
```

**Answer:** 
- **Time Complexity:** $O(\log n)$.
- **Auxiliary Space Complexity:** $O(1)$.

The loop variable `i` starts at 1 and doubles on every iteration ($i = 1, 2, 4, 8, 16$). The loop terminates when $i \ge n$, meaning $2^k \ge n \implies k = \lceil\log_2 n\rceil$. Because the number of iterations scales logarithmically with $n$, the time complexity is $O(\log n)$. Only two numbers (`count` and `i`) are stored in memory, so auxiliary space is $O(1)$.

For $n = 16$, the loop executes for $i = 1, 2, 4, 8$. When $i$ reaches 16, the condition $16 < 16$ is false, so it terminates. The body executes **exactly 4 times** ($\log_2(16) = 4$).

---

### 3. A developer removes duplicate strings from an array of 100,000 items using `filter()` and `indexOf()`, but the API endpoint times out. Why does this happen, and how do you fix it?

**Question:** Why does `arr.filter((item, index) => arr.indexOf(item) === index)` cause severe performance problems on large arrays, and what is the optimal production fix?

**Answer:** `.filter()` iterates through all $n$ items. On every iteration, it calls `.indexOf(item)`, which performs a linear scan from index 0 across the entire array. Running a linear search inside a loop creates an $O(n \times n) = O(n^2)$ algorithm. For 100,000 items, this performs up to 10 billion comparisons. Because Node.js runs JavaScript on a single thread, this synchronous computation blocks the libuv event loop for seconds, causing incoming HTTP requests to time out.

The optimal fix is to use a JavaScript `Set`:
```javascript
// Node.js code
const deduplicated = Array.from(new Set(arr));
```
`Set` is backed by a hash table, where insertion and membership checks run in $O(1)$ average time. Building the `Set` takes a single pass over $n$ items, reducing the time complexity from $O(n^2)$ to **$O(n)$ time** and **$O(n)$ auxiliary space**. For 100,000 items, execution time drops from several seconds to roughly 10 milliseconds.

---

### 4. How does an unoptimized CPU-bound algorithm affect concurrent I/O throughput in a Node.js backend?

**Question:** In a Node.js backend server, what happens to incoming network requests when a route handler executes a synchronous CPU-bound algorithm, and how should such workloads be architected?

**Answer:** Node.js executes application JavaScript on a single thread backed by the libuv event loop. Asynchronous I/O operations (such as incoming HTTP connections and database queries) depend on the event loop continually cycling through its phases (Poll, Check, Timers) to process socket events.

When a route handler runs an expensive synchronous $O(n^2)$ algorithm, the single thread is completely trapped running that calculation:
- No network I/O callbacks can fire.
- No database query responses can be handled.
- No timer callbacks (`setTimeout`) can execute.
- Incoming HTTP requests queue in the operating system's TCP backlog until client timeouts expire (`504 Gateway Timeout`), and Kubernetes liveness probes fail, triggering container restarts.

To safely handle CPU-heavy workloads in Node.js:
1. **Optimize the algorithm**: Reduce complexity from $O(n^2)$ to $O(n)$ or $O(n \log n)$.
2. **Payload validation**: Enforce strict array length limits in validation middleware (e.g., using Zod) to prevent oversized payloads.
3. **Offload to Worker Threads**: Offload CPU-heavy computation to a separate thread pool using `node:worker_threads` or a background job queue (e.g., BullMQ), keeping the main libuv thread free to handle concurrent HTTP requests.

---

<nav aria-label="Lecture navigation">

[Roadmap](../javascript-dsa-roadmap.md) | [Next: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md)

</nav>
