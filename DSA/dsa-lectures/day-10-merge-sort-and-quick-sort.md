# Day 10: Sorting Deep Dive: Merge Sort and Quick Sort

<nav aria-label="Lecture navigation">

[Previous: Duplicate Detection and Array Intersections](day-09-duplicate-detection-and-intersections.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Opposing Pointers](day-11-two-pointers-opposing.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain the **Divide-and-Conquer** paradigm in recursive sorting algorithms.
- Implement **Merge Sort** and explain why its $O(n \log n)$ guarantee requires $O(n)$ auxiliary memory.
- Implement **Quick Sort** with in-place Lomuto/Hoare partitioning and explain its $O(n^2)$ worst case.
- Understand what **Sorting Stability** means and why it matters in business logic (e.g. multi-column sorting).
- Connect JavaScript's engine-level sorting (V8 Timsort) to memory allocation and call-stack limits.

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md)
- [Day 04: Recursion and Call Stack](day-04-recursion-and-call-stack.md)
- [Day 05: Sorting and Searching Basics](day-05-sorting-and-searching-basics.md)

---

## Core Concepts

### 1. The Divide-and-Conquer Strategy

Both Merge Sort and Quick Sort solve problems by breaking them into smaller subproblems:
1. **Divide**: Split the array into two halves or partition around a pivot.
2. **Conquer**: Recursively sort the smaller subarrays until reaching base cases (arrays of length 0 or 1).
3. **Combine**: Merge the sorted subarrays or combine partitioned segments.

```text
Merge Sort (Divide-heavy, combine does the work):
       [ 38, 27, 43, 3, 9, 82, 10 ]
             /                \
      [ 38, 27, 43 ]      [ 3, 9, 82, 10 ]
         /      \             /       \
      [38, 27]   [43]      [3, 9]    [82, 10]
      (Split down to single elements, then merge sorted lists back up)

Quick Sort (Combine-free, partition does the work):
Pick pivot (e.g. 10): [ < 10 ] + [ 10 ] + [ > 10 ]
Recursively partition sub-segments in-place!
```

---

### 2. Merge Sort vs Quick Sort Comparison

| Property | Merge Sort | Quick Sort |
| :--- | :--- | :--- |
| **Best / Average Time** | $O(n \log n)$ | $O(n \log n)$ |
| **Worst-Case Time** | $O(n \log n)$ (Guaranteed) | $O(n^2)$ (When pivot selection is poor) |
| **Auxiliary Space** | $O(n)$ (Buffer arrays during merge) | $O(\log n)$ (Recursive call stack) |
| **Stability** | **Stable** (Preserves relative order) | **Unstable** (Swaps can reorder identical keys) |
| **In-Place?** | No (Allocates temporary arrays) | Yes (In-place array pointer swaps) |

---

## Detailed Explanations & Node.js Relevance

### What is Sorting Stability?

A sorting algorithm is **stable** if elements with identical sort keys appear in the output in the same relative order as in the input.

```text
Initial list: [ { id: 1, age: 25 }, { id: 2, age: 25 } ]
Stable sort by age:   [ { id: 1, age: 25 }, { id: 2, age: 25 } ] (id 1 stays before id 2)
Unstable sort by age: [ { id: 2, age: 25 }, { id: 1, age: 25 } ] (Order was flipped!)
```
In Node.js e-commerce APIs, stability is critical when users sort by category, then by price: an unstable sort scrambles the earlier category grouping.

### V8 Engine Sort: Timsort
Modern V8 (Node.js and Chrome) uses **Timsort** (a hybrid of Merge Sort and Insertion Sort).
- Stable: Yes.
- Time: $O(n \log n)$ worst case, $O(n)$ best case for already-sorted data.
- Space: $O(n)$.

---

## JavaScript Implementation & Tracing

### 1. Merge Sort

```js
function mergeSort(arr) {
  // Base case: arrays of 0 or 1 elements are already sorted
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
    if (left[i] <= right[j]) { // <= ensures stability
      result.push(left[i]);
      i++;
    } else {
      result.push(right[j]);
      j++;
    }
  }

  // Append remaining items
  while (i < left.length) result.push(left[i++]);
  while (j < right.length) result.push(right[j++]);

  return result;
}
```

### 2. In-Place Quick Sort (Lomuto Partitioning)

```js
function quickSort(arr, left = 0, right = arr.length - 1) {
  if (left < right) {
    const pivotIndex = partition(arr, left, right);
    quickSort(arr, left, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, right);
  }
  return arr;
}

function partition(arr, left, right) {
  const pivot = arr[right]; // Choose last element as pivot
  let i = left; // i marks boundary of elements smaller than pivot

  for (let j = left; j < right; j++) {
    if (arr[j] < pivot) {
      [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap
      i++;
    }
  }

  // Place pivot in its correct sorted position
  [arr[i], arr[right]] = [arr[right], arr[i]];
  return i;
}
```

### Trace: Merge of `[27, 38]` and `[3, 43]`

| Step | `i` (left) | `j` (right) | Comparison | `result` Array |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `27` | `3` | `27 > 3` $\to$ push `3`, `j++` | `[3]` |
| 2 | `27` | `43` | `27 <= 43` $\to$ push `27`, `i++` | `[3, 27]` |
| 3 | `38` | `43` | `38 <= 43` $\to$ push `38`, `i++` | `[3, 27, 38]` |
| 4 | loop ends | `j = 1` | Append remainder `[43]` | `[3, 27, 38, 43]` |

---

## Common Mistakes & Interview Traps

1. **Allocating arrays in naive Quick Sort**:
   ```js
   // JUNIOR TRAP: Allocating 3 arrays on every recursive call:
   const left = arr.filter(x => x < pivot);
   const right = arr.filter(x => x > pivot);
   return [...quickSort(left), pivot, ...quickSort(right)];
   ```
   This creates $O(n \log n)$ array copies and defeats the entire purpose of Quick Sort (which is $O(1)$ auxiliary space in-place sorting).
2. **Choosing bad pivots**:
   If an array is already sorted and you pick the first or last element as pivot, Lomuto partitioning produces subarrays of size $0$ and $n-1$, degrading time to $O(n^2)$ and call stack depth to $O(n)$ (risking stack overflow).
3. **Losing Stability with `<` vs `<=`**:
   In `merge()`, using `if (left[i] < right[j])` instead of `<=` causes duplicate items in `left` to jump behind identical items in `right`, breaking stability!

---

## Tricky Points & Edge Cases

- **Recursion Depth Limits in Node.js**:
  In Quick Sort, if recursion depth reaches $O(n)$ on a sorted array of $20,000$ items, V8 will throw: `RangeError: Maximum call stack size exceeded`. Choosing a random pivot or median-of-three prevents this.
- **Handling Arrays with All Identical Elements**:
  Lomuto partitioning handles duplicates poorly. Hoare partitioning or 3-way partitioning (Dutch National Flag) handles duplicate keys in $O(n)$ time.

---

## Practical Exercise

Implement **Sort Colors / Dutch National Flag** (LeetCode 75):
Given an array `nums` with $n$ objects colored red (`0`), white (`1`), or blue (`2`), sort them in-place so that objects of the same color are adjacent, in order `0, 1, 2`.
- **Constraint**: You must solve this in a single pass ($O(n)$ time) using three pointers with $O(1)$ extra memory.

---

## Summary

- Merge Sort guarantees $O(n \log n)$ time and stability at the cost of $O(n)$ auxiliary memory.
- Quick Sort is an in-place $O(n \log n)$ average-time sort with $O(\log n)$ call stack space, but has an $O(n^2)$ worst case on poor pivot selection.
- V8's native `arr.sort()` uses Timsort: stable, adaptive $O(n \log n)$, optimized for partially sorted real-world data.
- External merge sort is the industry standard for sorting gigabyte-scale datasets that cannot fit in Node.js heap memory.

---

## Cheat Sheet

### Complexity Matrix
| Algorithm | Best Time | Average Time | Worst Time | Space | Stable? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Merge Sort** | $O(n \log n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ | **Yes** |
| **Quick Sort** | $O(n \log n)$ | $O(n \log n)$ | $O(n^2)$ | $O(\log n)$ | **No** |
| **Timsort (V8)**| $O(n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ | **Yes** |

---

## Interview Questions

### 1. Deep Definitions and Mental Models
**Question:** Why does Merge Sort require $O(n)$ extra space, while Quick Sort can sort in-place?
- **Expected answer shape:** Merge Sort divides the array down to base elements and merges sorted arrays back together; merging two sorted arrays cannot be done in-place without shifting elements in $O(n)$ time per step, requiring a separate buffer array. Quick Sort does its partitioning work *before* recursing, swapping elements directly in-place across the pivot index.

### 2. Predict the Output and Trace Execution
**Question:** What does this code print, and why?
```js
const arr = [10, 2, 5, 1];
arr.sort();
console.log(arr);
```
- **Expected answer shape:** Prints `[1, 10, 2, 5]`. In JavaScript, `Array.prototype.sort()` converts elements to strings before sorting by default. `"10"` comes before `"2"` in UTF-16 code unit order. Always pass a comparator: `arr.sort((a, b) => a - b)`.

### 3. Implementation Exercise
**Question:** Write `mergeTwoSortedArrays(arr1, arr2)` that returns a single merged sorted array in $O(n + m)$ time.
- **Expected answer shape:**
```js
function mergeTwoSortedArrays(a, b) {
  const result = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    result.push(a[i] <= b[j] ? a[i++] : b[j++]);
  }
  while (i < a.length) result.push(a[i++]);
  while (j < b.length) result.push(b[j++]);
  return result;
}
```

### 4. Debugging and Failure Analysis
**Question:** An engineer implements recursive Quick Sort. In production, sorting an array of 50,000 items that is already sorted crashes with `RangeError: Maximum call stack size exceeded`. Why?
- **Expected answer shape:** On a pre-sorted array with a naive pivot (e.g. `arr[right]`), every partition divides the array into $n-1$ and $0$ elements. The recursion tree has depth $n$ instead of $\log n$. V8's call stack limit (~10,000 frames) is exceeded. Mitigate by picking a random pivot, median-of-three, or switching to iterative Quick Sort with tail-call elimination.

### 5. Design and Tradeoff Questions
**Question:** When would you choose Merge Sort over Quick Sort in a production backend service?
- **Expected answer shape:** (1) When stability is strictly required (e.g. maintaining previous sort order across multi-column data tables). (2) When guaranteed $O(n \log n)$ worst-case latency is required to prevent denial-of-service from worst-case inputs. (3) When sorting linked lists or disk-bound external streams where sequential access is fast and random access is slow.

### 6. Senior Follow-ups: Node.js Stream Sorting
**Question:** How does an external merge sort work in Node.js when sorting a 20 GB CSV file with a 512 MB memory limit?
- **Expected answer shape:** (1) Stream the CSV in ~100 MB chunks, parse and sort each chunk in memory, and write each sorted chunk to a temporary file on disk. (2) Open read streams to all temporary files simultaneously. (3) Use a Min-Heap (priority queue) of size equal to the number of temp files to continuously pick the smallest record across all streams, writing the output to a master sorted file. Memory usage is bounded to $O(k)$ where $k$ is the number of file streams.

<nav aria-label="Lecture navigation">

[Previous: Duplicate Detection and Array Intersections](day-09-duplicate-detection-and-intersections.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Opposing Pointers](day-11-two-pointers-opposing.md)

</nav>
