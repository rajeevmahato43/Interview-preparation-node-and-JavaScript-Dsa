# Day 10: Sorting Deep Dive: Merge Sort and Quick Sort

<nav aria-label="Lecture navigation">

[Previous: Duplicate Detection and Array Intersections](day-09-duplicate-detection-and-intersections.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Opposing Pointers](day-11-two-pointers-opposing.md)

</nav>
## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Asymptotic analysis and auxiliary space.
- [Day 04: Recursion and Call Stack](day-04-recursion-and-call-stack.md) — Stack frame allocation and `RangeError` depth limits.
- [Day 05: Sorting and Searching Basics](day-05-sorting-and-searching-basics.md) — Sorting stability and comparator contracts.
---

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                       DIVIDE-AND-CONQUER: MERGE SORT VS QUICK SORT                          │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  1. MERGE SORT (Divide is trivial; Combine does the heavy work)
     [ 38, 27, 43, 3, 9, 82, 10 ]
            /                \
     [ 38, 27, 43 ]      [ 3, 9, 82, 10 ]     <-- Recursively divide in half (O(log n) levels)
     (Unwind & Merge sorted arrays back up into auxiliary buffer: O(n) per level)
     --> Guaranteed O(n log n) time, O(n) auxiliary memory. Stable!

  2. QUICK SORT (Partition does the heavy work; Combine is free)
     Choose pivot (e.g. 10):
     [ < 10 ]  +  [ 10 ]  +  [ > 10 ]         <-- Partition in-place using two pointers
     Recursively sort left and right partitions in-place!
     --> Average O(n log n) time, O(1) buffer space, O(log n) stack frames. Unstable!
```

## 1. The Divide-and-Conquer Strategy

> **Divide-and-Conquer**: An algorithmic paradigm that partitions a problem into smaller subproblems, solves them recursively, and combines their solutions.

Both Merge Sort and Quick Sort follow the three-phase Divide-and-Conquer structure:
1. **Divide:** Split the problem into smaller subproblems.
   - *Merge Sort:* Bisects the array at midpoint `mid = Math.floor(n / 2)`.
   - *Quick Sort:* Partitions the array around a pivot such that elements $\le \text{pivot}$ are to its left, and elements $> \text{pivot}$ are to its right.
2. **Conquer:** Recursively solve each subproblem until reaching base cases (arrays of size $0$ or $1$).
3. **Combine:** Combine the subproblem solutions into the final answer.
   - *Merge Sort:* Scans two sorted lists, merging them into an auxiliary array in $O(n)$ time.
   - *Quick Sort:* Requires zero work to combine because elements are already rearranged in place.

---

## 2. Comprehensive Comparison Matrix

| Property | Merge Sort | Quick Sort (In-Place) | TimSort (V8 Native) |
|---|---|---|---|
| **Best-Case Time** | $O(n \log n)$ | $O(n \log n)$ | **$O(n)$** (Linear on pre-sorted data) |
| **Average-Case Time**| $O(n \log n)$ | $O(n \log n)$ | $O(n \log n)$ |
| **Worst-Case Time** | **$O(n \log n)$ (Guaranteed)**| $O(n^2)$ (Adversarial pivot) | $O(n \log n)$ |
| **Auxiliary Space** | $O(n)$ (Buffer arrays) | **$O(\log n)$ (Call stack)** | $O(n)$ |
| **Sort Stability** | **Stable** | Unstable | **Stable** |
| **Memory Locality** | Poor (Allocates new arrays) | **High (In-place array cache hits)** | High |
| **Best Use Case** | Linked lists, guaranteed latency | Memory-constrained systems | General-purpose application data |

---

## 3. Merge Sort Implementation and Trace

Merge Sort guarantees $O(n \log n)$ time across all inputs. Because merging two sublists cannot be performed in-place without $O(n)$ shifting overhead, it allocates an auxiliary buffer array of size $n$.

```javascript
// Node.js code
"use strict";

function mergeSort(arr) {
  // Base case: arrays of 0 or 1 elements are sorted
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

  // Two-pointer merge into sorted array
  while (i < left.length && j < right.length) {
    // Note: '<=' is required to preserve sort stability!
    if (left[i] <= right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  // Append remaining items
  while (i < left.length) result.push(left[i++]);
  while (j < right.length) result.push(right[j++]);

  return result;
}

console.log("Merge Sort:", mergeSort([38, 27, 43, 3, 9, 82, 10]));
// [ 3, 9, 10, 27, 38, 43, 82 ]
```

#### Merge Step Trace: `left = [27, 38]` and `right = [3, 43]`

| Step | Pointer `i` | Pointer `j` | Comparison | Action Taken | `result` Buffer |
|---|---|---|---|---|---|
| 1 | `left[0] = 27` | `right[0] = 3` | $27 > 3$ | Append `3`, `j++` | `[ 3 ]` |
| 2 | `left[0] = 27` | `right[1] = 43` | $27 \le 43$ | Append `27`, `i++` | `[ 3, 27 ]` |
| 3 | `left[1] = 38` | `right[1] = 43` | $38 \le 43$ | Append `38`, `i++` | `[ 3, 27, 38 ]` |
| 4 | `i = 2` (Exhausted) | `right[1] = 43` | Loop exits | Flush remainder `[ 43 ]` | `[ 3, 27, 38, 43 ]` |

---

## 4. Quick Sort Implementation (In-Place Lomuto Partitioning)

Quick Sort avoids allocating temporary arrays by partitioning elements directly inside the original array via pointer swaps.

```javascript
// Node.js code
// In-place Quick Sort
function quickSort(arr, left = 0, right = arr.length - 1) {
  if (left < right) {
    const pivotIndex = partitionLomuto(arr, left, right);
    quickSort(arr, left, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, right);
  }
  return arr;
}

// Lomuto Partitioning Scheme
function partitionLomuto(arr, left, right) {
  const pivot = arr[right]; // Choose the last element as pivot
  let i = left; // Boundary pointer for elements strictly smaller than pivot

  for (let j = left; j < right; j++) {
    if (arr[j] < pivot) {
      // Swap arr[i] and arr[j] to move smaller element to left partition
      [arr[i], arr[j]] = [arr[j], arr[i]];
      i++;
    }
  }

  // Place pivot into its correct final sorted position
  [arr[i], arr[right]] = [arr[right], arr[i]];
  return i;
}

const numbers = [10, 80, 30, 90, 40, 50, 70];
console.log("Quick Sort:", quickSort(numbers));
// [ 10, 30, 40, 50, 70, 80, 90 ]
```

---

## Tricky Points and Edge Cases

### 1. The Naive Functional Quick Sort Anti-Pattern in JavaScript
A popular coding tutorial snippet implements Quick Sort functionally using `.filter()` and array spreads:

```javascript
// Node.js code
// ❌ ANTI-PATTERN: Junior Functional Quick Sort
function quickSortNaive(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[0];
  const left = arr.slice(1).filter(x => x <= pivot);
  const right = arr.slice(1).filter(x => x > pivot);
  return [...quickSortNaive(left), pivot, ...quickSortNaive(right)];
}
```
**Why this is an anti-pattern:**
1. It allocates two new filtered arrays and runs full scans on every recursive call, creating $O(n \log n)$ temporary array allocations on the V8 heap.
2. It completely eliminates the core architectural advantage of Quick Sort: **in-place sorting with zero memory allocation**.
3. It triggers heavy Garbage Collection pauses in Node.js.

### 2. Worst-Case $O(n^2)$ Quick Sort and V8 Stack Overflow
If you always pick `arr[right]` or `arr[0]` as the pivot on an array that is **already sorted**:
- Every partition divides an array of size $n$ into partitions of size $0$ and $n - 1$.
- Number of recursive calls becomes $n$, and total comparisons scale to $\frac{n(n - 1)}{2} = O(n^2)$.
- On an array of $20,000$ sorted elements, the call stack exceeds 10,000 frames, crashing with:
  `RangeError: Maximum call stack size exceeded`.
- **Mitigation:** Use randomized pivot selection (`swap(arr, randomIdx, right)`) or the **Median-of-Three** heuristic (median of first, middle, and last elements).

### 3. Stability Loss Bug in Merge Sort
In the `merge()` function, changing `if (left[i] <= right[j])` to `<` destroys sorting stability:
If `left[i] === right[j]`, using `<` causes `right[j]` to be appended first, swapping the relative positions of duplicate keys. Always use `<=` to maintain stability.

---

## Hands-On Exercise

### Scenario
You are developing an in-memory priority queue scheduler for a Node.js microservice. You receive an array of tasks tagged with three discrete priority levels: `0` (High), `1` (Medium), and `2` (Low).

You must sort the array in place in a **single pass** ($O(n)$ time) using **$O(1)$ auxiliary memory** (the Dutch National Flag problem / LeetCode 75: Sort Colors).

### Buggy Code
```javascript
// Node.js code
function sortColorsBuggy(nums) {
  // ❌ Bug 1: Two passes and violates the in-place single-pass constraint
  // ❌ Bug 2: Array allocations trigger GC overhead
  const zeros = nums.filter(x => x === 0);
  const ones = nums.filter(x => x === 1);
  const twos = nums.filter(x => x === 2);
  const combined = [...zeros, ...ones, ...twos];
  for (let i = 0; i < nums.length; i++) nums[i] = combined[i];
  return nums;
}
```

### Acceptance Criteria
1. The sort must occur in-place in a single pass ($O(n)$ time).
2. Auxiliary memory must be strictly $O(1)$ (no new arrays, sets, or maps).
3. Correctly partition duplicate-dense arrays (e.g., `[2, 0, 2, 1, 1, 0]` $\to$ `[0, 0, 1, 1, 2, 2]`).

### Solution Code

```javascript
// Node.js code
import assert from "node:assert/strict";

function sortColors(nums) {
  let low = 0;              // Boundary pointer for 0s
  let mid = 0;              // Current scanning pointer
  let high = nums.length - 1; // Boundary pointer for 2s

  // Invariant:
  // nums[0 ... low - 1] are all 0s
  // nums[low ... mid - 1] are all 1s
  // nums[mid ... high] are unclassified
  // nums[high + 1 ... n - 1] are all 2s
  while (mid <= high) {
    if (nums=== 0) {
      // Swap with low pointer and advance both
      [nums[low], nums] = [nums, nums[low]];
      low++;
      mid++;
    } else if (nums=== 1) {
      // 1 is in its correct middle partition; simply advance scanner
      mid++;
    } else {
      // nums=== 2: Swap with high pointer and decrement high
      [nums, nums[high]] = [nums[high], nums];
      high--;
      // Do NOT increment mid here: the swapped element from high must be evaluated!
    }
  }

  return nums;
}

// Verification Tests
const test1 = [2, 0, 2, 1, 1, 0];
sortColors(test1);
assert.deepEqual(test1, [0, 0, 1, 1, 2, 2]);

const test2 = [2, 0, 1];
sortColors(test2);
assert.deepEqual(test2, [0, 1, 2]);

const test3 = [0];
sortColors(test3);
assert.deepEqual(test3, [0]);

const test4 = [2, 2, 2, 0, 0];
sortColors(test4);
assert.deepEqual(test4, [0, 0, 2, 2, 2]);

console.log("✅ All Dutch National Flag 3-way partition tests passed successfully!");
```

### Solution Explanation

1. **Three-Pointer Partition Invariant:** The array is partitioned into four dynamic zones: zeros on the left (`< low`), ones in the middle (`low` to `mid - 1`), unclassified elements (`mid` to `high`), and twos on the right (`> high`).
2. **Single Pass with $O(1)$ Space:** Each element is visited and swapped at most twice, providing deterministic $O(n)$ time complexity and zero memory allocations.

---

## Summary

- **Merge Sort** is an $O(n \log n)$ stable divide-and-conquer algorithm that requires $O(n)$ auxiliary memory to merge sorted runs.
- **Quick Sort** operates in-place using two-pointer partitioning, running in $O(n \log n)$ average time and $O(\log n)$ call stack space.
- Naive pivot selection in Quick Sort degrades to $O(n^2)$ time on sorted arrays, risking V8 call stack overflow crashes (`RangeError`).
- Modern JavaScript engines use **TimSort**, a stable hybrid of Merge Sort and Insertion Sort that achieves $O(n)$ time on partially sorted data.
- The **Dutch National Flag algorithm** solves 3-way partitioning in a single pass ($O(n)$ time, $O(1)$ memory).

---

## Cheat Sheet

### Sorting Complexities Comparison
| Algorithm | Best Time | Average Time | Worst Time | Auxiliary Space | Stable? | Best Used When |
|---|---|---|---|---|---|---|
| **Merge Sort** | $O(n \log n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ | **Yes** | Predictable latency & stability required |
| **Quick Sort** | $O(n \log n)$ | $O(n \log n)$ | $O(n^2)$ | $O(\log n)$ | **No** | In-place sorting; low memory budget |
| **TimSort** | $O(n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ | **Yes** | Built-in JavaScript `Array.prototype.sort()` |
| **Dutch National Flag** | $O(n)$ | $O(n)$ | $O(n)$ | $O(1)$ | **No** | Array with 3 distinct keys/duplicates |

### Common Pitfalls
- **Spread-Filter Quick Sort:** Using `[...quickSort(left), pivot, ...quickSort(right)]` wastes memory and degrades cache locality.
- **Missing `<=` in Merge:** Comparing `left[i] < right[j]` instead of `<=` breaks sort stability.
- **Stack Overflow on Sorted Inputs:** Naive Quick Sort on pre-sorted arrays creates $n$ stack frames, crashing Node.js.
- **Incrementing `mid` after `high` swap:** In Dutch National Flag, advancing `mid` after swapping with `high` skips evaluation of the newly swapped element.

---

## Interview Questions

### 1. Why does Merge Sort require $O(n)$ auxiliary space, whereas Quick Sort can sort in place with $O(\log n)$ space?

**Question:** Explain the structural differences between Merge Sort and Quick Sort that dictate their auxiliary memory requirements.

**Answer:** 
The difference in memory requirements originates from **when and where the sorting work takes place**:

1. **Merge Sort (Combine Phase Heavy):**
   - Merge Sort divides the array down into trivial single-element arrays without rearranging elements.
   - The sorting happens during the **merge step**, where two independently sorted subarrays must be combined into a single sorted sequence.
   - In contiguous memory arrays, merging two lists in place without an auxiliary buffer requires shifting elements on every insertion, which would take $O(n)$ time per insertion and turn the algorithm into $O(n^2)$. To achieve $O(n \log n)$ time, Merge Sort must allocate an auxiliary buffer of size $n$ to write merged elements sequentially.
2. **Quick Sort (Divide/Partition Phase Heavy):**
   - Quick Sort performs all comparison and movement work **before** recursing.
   - The `partition()` subroutine selects a pivot and uses two converging pointers (`i` and `j`) to swap out-of-order elements directly within the existing array buffer.
   - Once partitioning completes, the pivot is in its final position, and the left and right sub-arrays can be sorted independently in place.
   - No buffer arrays are allocated. The only extra memory consumed is the **$O(\log n)$ call stack frames** required for the recursive execution tree.

---

### 2. What causes Quick Sort to degrade to $O(n^2)$ time on sorted arrays, and how do modern runtimes prevent this failure mode?

**Question:** Trace the execution of naive Quick Sort on an already sorted array and explain how pivot selection heuristics prevent worst-case degradation.

**Answer:** 
**Failure Mechanism:**
Consider an already sorted array `[1, 2, 3, 4, 5]` sorted using Lomuto partitioning with the last element chosen as pivot:
- **Call 1:** Pivot is `5`. Every other element is $< 5$. The partition divides the array into a left subarray of size $4$ (`[1, 2, 3, 4]`) and a right subarray of size $0$.
- **Call 2:** Pivot is `4`. Divides into left size $3$ and right size $0$.
- **Call 3:** Pivot is `3`. Divides into left size $2$ and right size $0$.

Instead of halving the problem space into balanced $n/2$ subproblems ($O(\log n)$ tree height), the recursion tree becomes a skewed linear chain of height $n$:
$$\text{Total comparisons} = (n - 1) + (n - 2) + \dots + 1 = \frac{n(n - 1)}{2} = O(n^2)$$
In Node.js, if $n = 50,000$, the recursion depth reaches 50,000 frames, triggering a fatal `RangeError: Maximum call stack size exceeded` crash.

**Modern Mitigations:**
1. **Randomized Pivot Selection:** Swap `arr[right]` with an element at a randomly chosen index between `left` and `right`. This makes the probability of encountering worst-case partitions mathematically negligible ($< 10^{-10}$).
2. **Median-of-Three Heuristic:** Inspect the first, middle, and last elements (`arr[left]`, `arr`, `arr[right]`), select their median, and swap it into the pivot position. On sorted arrays, this consistently selects the exact midpoint, guaranteeing optimal $O(n \log n)$ performance.

---

### 3. How does the Dutch National Flag 3-way partition algorithm work in JavaScript, and why is it superior on duplicate keys?

> **Dutch National Flag (3-Way Partition)**: A single-pass partitioning algorithm that groups identical keys into a central partition bounded by three pointers.

**Question:** Implement the Dutch National Flag algorithm (`sortColors`) in $O(n)$ time and $O(1)$ space, explaining its behavior with duplicate keys.

**Answer:** 
Standard Quick Sort partitioning schemes (Lomuto) do not isolate duplicate keys. When sorting an array consisting entirely of identical elements (e.g., `[5, 5, 5, 5, 5]`), Lomuto partitioning puts all elements into the left partition, resulting in worst-case $O(n^2)$ performance.

The **Dutch National Flag (3-way partition)** algorithm groups elements into three distinct segments in a single pass:
1. Elements $< \text{pivot}$ (indices $0 \dots \text{low} - 1$).
2. Elements $== \text{pivot}$ (indices $\text{low} \dots \text{mid} - 1$).
3. Unclassified elements (indices $\text{mid} \dots \text{high}$).
4. Elements $> \text{pivot}$ (indices $\text{high} + 1 \dots n - 1$).

```javascript
// Node.js code
function dutchNationalFlag(arr, pivot) {
  let low = 0;
  let mid = 0;
  let high = arr.length - 1;

  while (mid <= high) {
    if (arr< pivot) {
      [arr[low], arr] = [arr, arr[low]];
      low++;
      mid++;
    } else if (arr=== pivot) {
      mid++;
    } else {
      [arr, arr[high]] = [arr[high], arr];
      high--; // mid is NOT incremented; inspect swapped value
    }
  }

  return arr;
}
```
**Why it is superior:**
By isolating all elements equal to the pivot into a finalized middle zone in a single $O(n)$ pass, subsequent recursive calls only need to sort elements strictly less than and strictly greater than the pivot. If an array contains only a few unique keys (e.g., 0, 1, 2), 3-way Quick Sort sorts the entire array in **$O(n)$ linear time**.

---

### 4. How does an External Merge Sort work in Node.js when sorting a 20 GB CSV file under a 512 MB memory limit?

**Question:** Describe the architectural phases of External Merge Sort for sorting datasets far larger than available RAM in Node.js.

**Answer:** 
Node.js processes run within a bounded V8 heap (~1.5–4 GB). Loading a 20 GB file into memory crashes the process with an Out-Of-Memory (OOM) error. An **External Merge Sort** solves this using disk-backed streaming and a K-way merge:

```
20 GB Unsorted File
  │ (Stream in 100 MB chunks)
  ├──> Chunk 1 (100 MB) ──> In-memory arr.sort() ──> Write chunk_1.tmp (sorted)
  ├──> Chunk 2 (100 MB) ──> In-memory arr.sort() ──> Write chunk_2.tmp (sorted)
  └──> ... (produces 200 sorted temporary files on disk)

K-Way Merge Phase:
  Open 200 readable streams (chunk_1.tmp ... chunk_200.tmp)
  Maintain Min-Heap of size 200 (top record from each stream)
  Continuously pop minimum record -> Write to final output file -> Read next item from that stream
  --> Total memory used: ~20 MB of buffer streams and heap!
```

**Architecture Steps:**
1. **Phase 1 (Chunk Sorting):**
   - Read the 20 GB CSV sequentially using `fs.createReadStream()` with `readline`.
   - Accumulate rows into memory until the buffer reaches ~100 MB.
   - Sort the 100 MB array in memory using `arr.sort(comparator)`.
   - Write the sorted batch to disk as a temporary run (`run_1.tmp`, `run_2.tmp`, etc.).
   - Repeat until the entire 20 GB file is partitioned into ~200 sorted files on disk.
2. **Phase 2 (K-Way Streaming Merge):**
   - Open concurrent readable file streams for all 200 temporary files.
   - Initialize a **Min-Heap (Priority Queue)** of capacity 200, containing the first record from each temporary file along with its stream identifier.
   - In an asynchronous loop:
     1. Pop the minimum record from the heap.
     2. Write that record directly to the master output write stream (`sorted_output.csv`).
     3. Read the next line from the stream that provided the popped record and push it into the heap.
     4. If a stream is exhausted, close it and delete its temporary file.
3. **Memory & Concurrency Profile:**
   - Active memory is bounded to the 200-element heap and small stream chunk buffers ($< 25\text{ MB}$ total RAM).
   - Node.js handles the I/O efficiently via non-blocking libuv stream events without saturating memory or locking the event loop.

---

<nav aria-label="Lecture navigation">

[Previous: Duplicate Detection and Array Intersections](day-09-duplicate-detection-and-intersections.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Opposing Pointers](day-11-two-pointers-opposing.md)

</nav>
