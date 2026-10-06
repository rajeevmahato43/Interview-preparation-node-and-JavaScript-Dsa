# Day 05: Sorting and Searching Basics

<nav aria-label="Lecture navigation">

[Previous: Recursion and Call Stack](day-04-recursion-and-call-stack.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Frequency Counting and Hash Tables](day-06-frequency-counting-and-hash-tables.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Differentiate between linear search ($O(n)$) and binary search ($O(\log n)$), selecting the appropriate technique based on order invariants.
- Implement overflow-safe binary search with precise loop boundaries (`left <= right`) and derive insertion points.
- Explain the mechanics of V8's native `Array.prototype.sort()` engine (TimSort) and its performance guarantees.
- Avoid the default lexicographical sorting trap and implement robust, transitive comparator functions.
- Prevent unintended in-place array mutations using ES2023 `toSorted()` or shallow copy methods.
- Evaluate sort stability and design multi-attribute sorting workflows.
- Architect high-scale sorting pipelines: deciding between database-level B-Tree indexing, Node.js event-loop sorting, and External Merge Sort for datasets exceeding RAM.

---

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Asymptotic bounds ($O(\log n)$ vs $O(n)$ vs $O(n \log n)$).
- [Day 04: Recursion and Call Stack](day-04-recursion-and-call-stack.md) — Divide-and-conquer recursion and stack frame limits.
- [JS Day 12: Built-in Data Structures](../../Javascript/javascript-lectures/day-12-built-in-data-structures-and-serialization.md) — Array methods and mutating operations.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
|---|---|---|
| **Binary Search** | An $O(\log n)$ search algorithm that repeatedly halves a monotonically ordered search interval. | Requires pre-sorted data; reduces 1,000,000 element scans to at most 20 comparison steps. |
| **Comparator Function** | A callback function `(a, b)` returning $< 0$, $0$, or $> 0$ defining strict weak ordering between two elements. | Without a numeric comparator, JavaScript coerces numbers to UTF-16 strings, sorting `"10"` before `"2"`. |
| **In-Place Mutation** | Modifying an existing data structure directly in its allocated memory addresses without creating a new copy. | `arr.sort()` mutates the source array; mutating shared cache arrays corrupts server state. |
| **Sort Stability** | A guarantee that elements with equal sort keys maintain their relative pre-sort sequence. | Preserves secondary ordering (e.g., sorting users by department while keeping earlier name sorting intact). |
| **TimSort** | V8's hybrid sorting algorithm combining Merge Sort and Insertion Sort. | Stable, adaptive sorting running in $O(n \log n)$ worst case and $O(n)$ on nearly-sorted arrays. |
| **External Merge Sort** | A two-phase sorting algorithm that sorts large chunks on disk and merges them via streaming buffers and Min-Heaps. | Enables sorting 50 GB log files on Node.js servers constrained to 1 GB heap limits. |

---

## Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            SEARCH SPACE REDUCTION: LINEAR VS BINARY                         │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  1. LINEAR SEARCH (Unsorted Array: O(n) Time)
     [ 4 | 2 | 9 | 1 | 7 | 5 | 8 ]  --> Scans index 0, 1, 2, 3... until target found.

  2. BINARY SEARCH (Sorted Array: O(log n) Time)
     Search space: [ 1, 3, 5, 7, 9, 11, 13 ], Target: 9
     
     Step 1: left=0, right=6, mid=3 (val=7) --> 9 > 7: Discard left half [1..7]
     Step 2: left=4, right=6, mid=5 (val=11) --> 9 < 11: Discard right half [11..13]
     Step 3: left=4, right=4, mid=4 (val=9)  --> Found at index 4!
```

### 1. Linear Search vs Binary Search

Linear search tests every element sequentially from index $0$ to $n-1$. It requires zero prior knowledge or ordering constraints.

Binary search requires the underlying dataset to be sorted (or monotonic). It probes the middle element; if the target does not match the midpoint, it eliminates half of the remaining elements in a single step.

```javascript
// Node.js code
"use strict";

// Linear Search: O(n) time, O(1) space
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}

// Binary Search: O(log n) time, O(1) space
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  // Invariant: If target exists, it lies within arr[left ... right]
  while (left <= right) {
    // Avoid 32-bit integer overflow: left + Math.floor((right - left) / 2)
    const mid = left + Math.floor((right - left) / 2);

    if (arr[mid] === target) {
      return mid; // Target matched
    } else if (arr[mid] < target) {
      left = mid + 1; // Target lies strictly in right partition
    } else {
      right = mid - 1; // Target lies strictly in left partition
    }
  }

  return -1; // Target does not exist in array
}

const numbers = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
console.log("Found 23 at index:", binarySearch(numbers, 23)); // 5
console.log("Found 40:", binarySearch(numbers, 40));         // -1
```

> [!NOTE]
> Never sort an unsorted array merely to perform a single search query. Sorting costs $O(n \log n)$, which is asymptotically slower than a direct $O(n)$ linear scan. Only pre-sort if the array will be queried repeatedly ($k \times O(\log n)$ amortizes the initial sort).

---

### 2. JavaScript `sort()` Traps: Lexicographical Coercion and Mutation

`Array.prototype.sort()` possesses two runtime behaviors that frequently cause production bugs.

#### Trap A: Lexicographical String Sorting by Default
Without an explicit comparator callback, JavaScript coerces all array elements to UTF-16 strings before comparing them:

```javascript
// Node.js code
const rawNumbers = [10, 2, 5, 1, 20];

// ❌ ANTI-PATTERN: Default sort coerces numbers to strings!
rawNumbers.sort();
console.log("Lexicographical Sort:", rawNumbers);
// Outputs: [1, 10, 2, 20, 5] -> "10" precedes "2" because '1' < '2' in UTF-16!

// ✅ PATTERN: Supply a numeric comparator function
rawNumbers.sort((a, b) => a - b);
console.log("Numerical Sort:", rawNumbers);
// Outputs: [1, 2, 5, 10, 20]
```

#### The Comparator Contract
A comparator function `(a, b)` must return:
- A negative number ($< 0$) if `a` should precede `b`.
- Zero ($0$) if `a` and `b` have equal priority.
- A positive number ($> 0$) if `b` should precede `a`.

#### Trap B: In-Place Mutation of Shared Memory
`arr.sort()` rearranges elements in place, mutating the source reference:

```javascript
// Node.js code
const cachedConfig = [40, 10, 30];

// ❌ ANTI-PATTERN: Modifies the shared cached configuration
function getSortedBad(arr) {
  return arr.sort((a, b) => a - b);
}

const sortedRef = getSortedBad(cachedConfig);
console.log(cachedConfig); // [10, 30, 40] -> Original cache mutated!

// ✅ PATTERN: Sort a copy via ES2023 toSorted() or arr.slice().sort()
const freshConfig = [40, 10, 30];
const safeSorted = freshConfig.toSorted((a, b) => a - b); // ES2023
const fallbackSorted = freshConfig.slice().sort((a, b) => a - b); // Universal
console.log(freshConfig); // [40, 10, 30] -> Unchanged
```

---

### 3. Sort Stability and TimSort in V8

A sorting algorithm is **stable** if elements with equivalent comparison keys preserve their original relative positioning after sorting.

```
Initial Array:
[ { id: 1, role: "admin" }, { id: 2, role: "user" }, { id: 3, role: "admin" } ]

Sorted by 'role' (Stable):
[ { id: 1, role: "admin" }, { id: 3, role: "admin" }, { id: 2, role: "user" } ]
Notice: ID 1 remains before ID 3 because both are "admin".
```

Since ECMAScript 2019 (ES10), `Array.prototype.sort()` is strictly specified to be **stable**.

In Node.js (V8 engine), this is implemented using **TimSort**, a hybrid algorithm derived from Merge Sort and Insertion Sort:
- **Best-case time:** $O(n)$ when data is already sorted or reverse-sorted.
- **Average & Worst-case time:** $O(n \log n)$.
- **Auxiliary space:** $O(n)$ in the worst case.

---

### 4. Merge Sort: Divide-and-Conquer Implementation

Merge Sort splits an array recursively into single-element subarrays, then merges adjacent sorted lists into larger sorted sequences.

```
                  [38, 27, 43, 3]
                   /            \
             [38, 27]          [43, 3]
             /      \          /     \
          [38]      [27]     [43]    [3]
             \      /          \     /
             [27, 38]          [3, 43]
                   \            /
                  [3, 27, 38, 43]
```

```javascript
// Node.js code
function mergeSort(arr) {
  // Base case: arrays of length 0 or 1 are already sorted
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0;
  let j = 0;

  // Merge items by comparing head pointers
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i++]); // <= guarantees stability
    } else {
      result.push(right[j++]);
    }
  }

  // Concatenate remaining elements
  while (i < left.length) result.push(left[i++]);
  while (j < right.length) result.push(right[j++]);

  return result;
}

console.log(mergeSort([38, 27, 43, 3, 9, 82, 10]));
// [3, 9, 10, 27, 38, 43, 82]
```
- **Time Complexity:** $O(n \log n)$ across all cases (best, worst, average).
- **Auxiliary Space:** $O(n)$ to store merged array buffers.

---

### 5. Architectural Decision: Node.js vs Database Sorting

| Criterion | In-Memory Node.js `arr.sort()` | Database `ORDER BY` (e.g., PostgreSQL) |
|---|---|---|
| **Data Size** | Small datasets ($< 2,000$ objects) already in memory | Large tables ($> 5,000$ rows) |
| **Indexing** | No index support; full $O(n \log n)$ CPU sort on single thread | Uses B-Tree index ($O(\log n)$ traversal) |
| **Network Overhead** | Must serialize and transmit entire dataset over network | Transmits only requested page (`LIMIT / OFFSET`) |
| **Event Loop Risk** | Synchronous CPU blocking; freezes HTTP handling on large arrays | Zero Node.js CPU cost; offloaded to DB daemon |

---

## Tricky Points and Edge Cases

### 1. Midpoint Overflow Guard in Binary Search
In lower-level languages (or when handling indices exceeding $2^{31} - 1$), computing `(left + right) / 2` triggers integer overflow. In JavaScript, numbers are IEEE-754 double floats, but bitwise operations (`(left + right) >> 1`) coerce values to 32-bit signed integers. 
Standardize on:
```javascript
const mid = left + Math.floor((right - left) / 2);
```

### 2. Binary Search Insertion Point Invariant
When binary search completes without finding the target (`left > right`), the `left` pointer index marks the exact insertion point where `target` belongs:

```javascript
// Node.js code
function searchInsert(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }

  return left; // 'left' is the exact insert position
}

console.log(searchInsert([1, 3, 5, 6], 5)); // 2 (found)
console.log(searchInsert([1, 3, 5, 6], 2)); // 1 (insert between 1 and 3)
console.log(searchInsert([1, 3, 5, 6], 7)); // 4 (insert at end)
```

### 3. Sorting Non-ASCII Strings (`localeCompare`)
Using `<` or `>` on accented letters like `'é'` or `'ñ'` orders them according to arbitrary ASCII code points. Use `localeCompare()`:

```javascript
// Node.js code
const words = ["éclair", "apple", "zebra"];
words.sort((a, b) => a.localeCompare(b, "en"));
console.log(words); // ['apple', 'éclair', 'zebra']
```

---

## Hands-On Exercise

### Scenario
You are building an automated regression detector for a CI/CD build deployment system. You have $n$ sequential versions labeled $1$ to $n$. A version failure indicates all subsequent versions are bad. You have an asynchronous API `isBadVersion(version)` that returns `true` or `false`.

You must find the **first bad version** using the minimum number of API checks.

### Buggy Code
```javascript
// Node.js code
function findFirstBadVersionBuggy(n, isBadVersion) {
  // ❌ Bug 1: Performs a linear scan O(n). If n = 1,000,000, it times out!
  // ❌ Bug 2: Off-by-one error starting at index 0 when versions start at 1.
  for (let i = 0; i < n; i++) {
    if (isBadVersion(i)) return i;
  }
  return -1;
}
```

### Acceptance Criteria
1. The function must execute in $O(\log n)$ time using binary search.
2. The search space spans from $1$ to $n$.
3. Handle boundary conditions: version 1 is bad, or only the final version $n$ is bad.

### Solution Code

```javascript
// Node.js code
import assert from "node:assert/strict";

function findFirstBadVersion(n, isBadVersion) {
  let left = 1;
  let right = n;
  let firstBad = -1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (isBadVersion(mid)) {
      // Record candidate and search left partition for earlier bad versions
      firstBad = mid;
      right = mid - 1;
    } else {
      // Mid is good; search right partition
      left = mid + 1;
    }
  }

  return firstBad;
}

// Verification Tests
const testRun1 = (v) => v >= 4;
assert.equal(findFirstBadVersion(5, testRun1), 4);

const testRun2 = (v) => v >= 1; // Immediate version 1 failure
assert.equal(findFirstBadVersion(10, testRun2), 1);

const testRun3 = (v) => v >= 100; // Final version failure
assert.equal(findFirstBadVersion(100, testRun3), 100);

console.log("✅ All first bad version binary search tests passed successfully!");
```

### Solution Explanation

1. **Monotonic Condition:** Because bad versions are monotonic (`[false, false, ..., true, true]`), binary search can eliminate half the search space.
2. **Candidate Retention:** When `isBadVersion(mid)` is `true`, `mid` could be the first bad version, so we record `firstBad = mid` and move `right = mid - 1` to search for earlier failures.

---

## Summary

- Linear search operates on unsorted collections in $O(n)$ time; binary search operates on ordered collections in $O(\log n)$ time.
- `Array.prototype.sort()` coerces values to strings by default; always pass a numeric comparator `(a, b) => a - b`.
- `sort()` mutates arrays in place; use `toSorted()` or `slice().sort()` when immutability is required.
- V8 uses TimSort, guaranteeing stable sorting in $O(n \log n)$ time and $O(n)$ space.
- In Node.js backend systems, delegate large dataset sorting to database `ORDER BY` with B-Tree indices to prevent event-loop CPU starvation.

---

## Cheat Sheet

### Sorting & Searching Complexity Reference
| Algorithm | Best Time | Average Time | Worst Time | Space | Stable? |
|---|---|---|---|---|---|
| Linear Search | $O(1)$ | $O(n)$ | $O(n)$ | $O(1)$ | N/A |
| Binary Search | $O(1)$ | $O(\log n)$ | $O(\log n)$ | $O(1)$ | N/A |
| TimSort (V8 `sort`) | $O(n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ | ✅ Yes |
| Merge Sort | $O(n \log n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ | ✅ Yes |
| Quick Sort | $O(n \log n)$ | $O(n \log n)$ | $O(n^2)$ | $O(\log n)$ | ❌ No |

### Common Comparators
```javascript
// Ascending numbers
arr.sort((a, b) => a - b);

// Descending numbers
arr.sort((a, b) => b - a);

// Object property sorting
arr.sort((a, b) => a.priority - b.priority);

// Accented strings
arr.sort((a, b) => a.localeCompare(b, "en"));
```

### Common Pitfalls
- **Default Lexicographical Sort:** Calling `[100, 20, 5].sort()` produces `[100, 20, 5]`.
- **Sorting Cache in Place:** Calling `.sort()` on an in-memory cache mutates the shared data.
- **Sorting for a Single Query:** Pre-sorting unsorted data ($O(n \log n)$) just to run a single binary search ($O(\log n)$) wastes CPU cycles.
- **Binary Search Termination:** Using `while (left < right)` instead of `while (left <= right)` skips evaluation of the final single-element interval.

---

## Interview Questions

### 1. What does it mean for a sorting algorithm to be stable, how does V8 guarantee it, and why does stability matter in production systems?

**Question:** Define sort stability, explain how modern JavaScript handles it, and provide a real-world scenario where an unstable sort causes bugs.

**Answer:** A sorting algorithm is **stable** if elements with identical sort keys retain their original relative order in the output. Since ECMAScript 2019, the language specification mandates that `Array.prototype.sort()` must be stable. In Node.js and Chromium, V8 fulfills this guarantee using **TimSort**, a hybrid algorithm combining Merge Sort and Insertion Sort.

**Why stability matters:**
Consider a table of financial transactions that is initially sorted chronologically by timestamp. If a user subsequently sorts the table by `customer_id`, a stable sort guarantees that within each `customer_id` group, transactions remain in their original chronological order:
```javascript
// Initial list (chronological)
const txs = [
  { id: 1, user: "A", time: "10:00" },
  { id: 2, user: "B", time: "10:05" },
  { id: 3, user: "A", time: "10:10" }
];
// Sorting by user:
// Stable output:   [{ id: 1, user: "A", time: "10:00" }, { id: 3, user: "A", time: "10:10" }, ...]
// Unstable output: Might swap items 1 and 3, scrambling the chronological record!
```
Without stability, multi-column or secondary-level sorting requires custom composite comparator logic (`(a, b) => a.user - b.user || a.time - b.time`).

---

### 2. Why does `[100, 20, 5].sort()` fail to sort numerically in JavaScript, and what are the strict mathematical requirements of a custom comparator?

**Question:** Explain the default behavior of `Array.prototype.sort()` and the mathematical axioms required for a custom comparator function.

**Answer:** Under the ECMAScript specification, calling `arr.sort()` without arguments coerces all elements to strings before comparing them according to UTF-16 code unit values. For `[100, 20, 5]`, the string representations are `"100"`, `"20"`, and `"5"`. Comparing the first character codes yields:
`'1' (49) < '2' (50) < '5' (53)`
Hence, `"100"` is placed before `"20"`, which is placed before `"5"`, resulting in `[100, 20, 5]`.

To sort numerically, developers pass a comparator `(a, b) => a - b`. Mathematically, the comparator must establish a **strict weak ordering**:
1. **Reflexivity / Identity:** `compare(a, a) === 0`.
2. **Anti-symmetry:** If `compare(a, b) < 0`, then `compare(b, a) > 0`.
3. **Transitivity:** If `compare(a, b) < 0` and `compare(b, c) < 0`, then `compare(a, c) < 0`.

If a comparator returns non-deterministic values (such as `Math.random() - 0.5`), it violates transitivity, causing TimSort to produce corrupt, browser-dependent results.

---

### 3. What are the key loop invariants of binary search, and why does `left` point to the target insertion index upon termination?

**Question:** Walk through the loop invariants of binary search, index calculation safeguards, and the state of pointers when a target is missing.

**Answer:** 
1. **Loop Invariant:** The condition `left <= right` guarantees that if the target value exists in the array, it must lie within the inclusive bounds `[left, right]`. When `left === right`, the search window contains exactly one element. Terminating when `left < right` prematurely exits before evaluating this final candidate.
2. **Midpoint Calculation:** Calculating `mid = Math.floor((left + right) / 2)` is susceptible to 32-bit integer overflow in languages with fixed-width types if `left + right > 2^{31} - 1`. Using `left + Math.floor((right - left) / 2)` guarantees that the intermediate addition never exceeds the maximum bound `right`.
3. **Insertion Index Invariant:** If `target` is not in the array, the loop terminates when `left > right` (specifically `left = right + 1`). At that exact moment:
- All elements at indices $< left$ are strictly smaller than `target`.
- All elements at indices $\ge left$ are strictly greater than `target`.
Therefore, `left` corresponds to the correct insertion index where `target` should be spliced to preserve sorted order.

---

### 4. When should data sorting be performed inside a Node.js process versus delegated to an external database, and how do you sort a 20 GB dataset on a machine with 2 GB RAM?

**Question:** Analyze the trade-offs of in-memory Node.js sorting versus SQL database sorting, and describe the architecture of External Merge Sort for massive datasets.

**Answer:** 
**Node.js vs Database Sorting:**
- **Delegate to Database:** When sorting tabular rows from a database, sorting should almost always occur in the database via `ORDER BY created_at LIMIT 20 OFFSET 0`. Relational databases use pre-built B-Tree indexes, executing lookups in $O(\log n)$ time and returning only the required page over the network. Sorting in Node.js requires transferring all 100,000+ rows over the network and sorting them on the single-threaded event loop, blocking concurrent request handling.
- **Sort in Node.js:** Only sort in Node.js when the dataset is already present in memory, is small ($< 2,000$ items), or involves dynamic business logic not expressible in database queries.

**Sorting 20 GB Data on 2 GB RAM (External Merge Sort):**
Because Node.js default heap limits (~1.5–4 GB) would cause an Out-Of-Memory (OOM) crash, use a two-phase **External Merge Sort**:
1. **Phase 1 (Chunk Sorting):** Read the 20 GB file sequentially using streams in 200 MB batches. Sort each batch in memory using `arr.sort()` and write it to disk as a temporary sorted file (`chunk_1.tmp` through `chunk_100.tmp`).
2. **Phase 2 (K-Way Merge):** Open a readable stream to all 100 temporary files simultaneously. Maintain a **Min-Heap** of size 100 containing the top record from each stream.
3. Continuously pop the minimum element from the heap, write it to the final output file stream, and read the next record from the corresponding temporary stream into the heap.
4. Total memory consumption remains bounded to $O(K)$ buffer records (a few megabytes), easily running within a 2 GB RAM limit.

---

<nav aria-label="Lecture navigation">

[Previous: Recursion and Call Stack](day-04-recursion-and-call-stack.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Frequency Counting and Hash Tables](day-06-frequency-counting-and-hash-tables.md)

</nav>
