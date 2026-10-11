# Day 19: Merge Sort & Quick Sort

<nav aria-label="Lecture navigation">

[Previous: Recursion & Call Stack](day-18-recursion-fundamentals-and-call-stack.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Recursion Trees & Backtracking](day-20-recursion-trees-and-backtracking-core.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Asymptotic complexity ($O(n \log n)$).
- [Day 18: Recursion & Call Stack](day-18-recursion-fundamentals-and-call-stack.md) — Recursive division.

---

## 1. What is Divide and Conquer?

**Divide and Conquer** breaks a large problem into two smaller halves, solves each half recursively, and combines the results.

Both **Merge Sort** and **Quick Sort** run in **$O(n \log n)$ average time**, which is exponentially faster than $O(n^2)$ elementary sorts.

---

## 2. Merge Sort: Guaranteed $O(n \log n)$ Stability

Merge Sort splits the array in half until individual elements remain, then merges sorted halves back together.

```text
[ 38, 27, 43, 3, 9, 82, 10 ]
        /               \
[ 38, 27, 43, 3 ]     [ 9, 82, 10 ]
   /         \           /       \
[38, 27]   [43, 3]     [9, 82]   [10]
   \         /           \       /
[ 3, 27, 38, 43 ]     [ 9, 10, 82 ]
        \               /
[ 3, 9, 10, 27, 38, 43, 82 ] (Merged!)
```

```javascript
// Node.js code: Merge Sort
function mergeSort(arr) {
  if (arr.length <= 1) return arr; // Base case

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  return result.concat(left.slice(i)).concat(right.slice(j));
}

console.log(mergeSort([38, 27, 43, 3, 9, 82, 10]));
// Output: [3, 9, 10, 27, 38, 43, 82]
```
- **Time Complexity:** **$O(n \log n)$ guaranteed** in all cases (best, average, worst).
- **Extra Space:** $O(n)$ — Creates intermediate arrays during merging.
- **Stable Sort:** Preserves the relative order of identical elements.

---

## 3. Quick Sort: Fast In-Place Partitioning

Quick Sort picks a **pivot element** and partitions the array so:
- All elements **smaller** than the pivot move to its left.
- All elements **larger** than the pivot move to its right.
- It then recursively sorts the left and right sides in-place.

```javascript
// Node.js code: In-Place Quick Sort
function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pivotIndex = partition(arr, low, high);
    quickSort(arr, low, pivotIndex - 1);  // Sort left partition
    quickSort(arr, pivotIndex + 1, high); // Sort right partition
  }
  return arr;
}

function partition(arr, low, high) {
  const pivot = arr[high]; // Pick last element as pivot
  let i = low; // Slot for next smaller element

  for (let j = low; j < high; j++) {
    if (arr[j] < pivot) {
      [arr[i], arr[j]] = [arr[j], arr[i]];
      i++;
    }
  }

  // Swap pivot into its correct final position
  [arr[i], arr[high]] = [arr[high], arr[i]];
  return i;
}

console.log(quickSort([10, 80, 30, 90, 40, 50, 70]));
// Output: [10, 30, 40, 50, 70, 80, 90]
```
- **Time Complexity:** **$O(n \log n)$ average**, $O(n^2)$ worst case (if pivot is poorly chosen on already-sorted data).
- **Extra Space:** **$O(\log n)$** call stack memory (modifies original array in-place).

---

## 4. Merge Sort vs Quick Sort Comparison

| Feature | Merge Sort | Quick Sort |
| :--- | :---: | :---: |
| **Best Time** | $O(n \log n)$ | $O(n \log n)$ |
| **Average Time** | $O(n \log n)$ | $O(n \log n)$ |
| **Worst Time** | **$O(n \log n)$** | $O(n^2)$ (unbalanced pivot) |
| **Auxiliary Memory** | $O(n)$ extra memory | **$O(\log n)$ stack space** |
| **Stability** | **Stable** | Unstable |
| **Best Used For** | Linked lists, external files | In-memory arrays |

---

## 5. Tricky Points and Common Traps

1. **Quick Sort worst case:** If the array is already sorted and you pick the first or last element as pivot, Quick Sort degrades to $O(n^2)$! Modern implementations pick a random pivot or median of three.
2. **Merge Sort memory overhead:** Merge Sort creates many small temporary arrays. In memory-constrained environments, Quick Sort or Heapsort is preferred.
3. **Stability in sorting:** A stable sort preserves the original order of items with equal values (e.g., sorting users by score without scrambling their alphabetical order). Merge Sort is stable; Quick Sort is not.

---

## 6. Hands-On Exercises

Run this script in Node.js to verify sorting correctness:

```javascript
// Node.js code
const assert = require("node:assert");

function testMergeSort(arr) {
  if (arr.length <= 1) return arr;
  const m = Math.floor(arr.length / 2);
  const l = testMergeSort(arr.slice(0, m));
  const r = testMergeSort(arr.slice(m));
  const res = [];
  let i = 0, j = 0;
  while (i < l.length && j < r.length) res.push(l[i] <= r[j] ? l[i++] : r[j++]);
  return res.concat(l.slice(i)).concat(r.slice(j));
}

assert.deepEqual(testMergeSort([5, 2, 9, 1, 5, 6]), [1, 2, 5, 5, 6, 9]);
assert.deepEqual(testMergeSort([]), []);
assert.deepEqual(testMergeSort([1]), [1]);

console.log("✅ Sorting assertions passed!");
```

---

## 7. Summary

- **Merge Sort** divides arrays in half and merges them back in guaranteed $O(n \log n)$ time with $O(n)$ space.
- **Quick Sort** partitions arrays in-place around a pivot in $O(n \log n)$ average time with $O(\log n)$ memory.
- **Merge Sort is stable**; **Quick Sort is in-place**.

---

## 8. Cheat Sheet

| Algorithm | Average Time | Space | Stable | In-Place |
| :--- | :---: | :---: | :---: | :---: |
| **Merge Sort** | $O(n \log n)$ | $O(n)$ | ✅ Yes | ❌ No |
| **Quick Sort** | $O(n \log n)$ | $O(\log n)$ | ❌ No | ✅ Yes |

---

## 9. Interview Q&A

### 45-Second Explanation
> *"Merge Sort and Quick Sort are both divide-and-conquer algorithms that sort in $O(n \log n)$ average time. Merge Sort guarantees $O(n \log n)$ performance and is stable, but requires $O(n)$ auxiliary memory to merge sub-arrays. Quick Sort partitions the array in-place, using only $O(\log n)$ call stack space and exhibiting better CPU cache locality, but has a worst-case of $O(n^2)$ if the pivot choices are poor."*

---

## 10. Practice Problems

### 1. Sort an Array - Medium
Given an array of integers `nums`, sort the array in ascending order and return it. You must solve the problem without using any built-in functions in $O(n \log n)$ time complexity and with the smallest space complexity possible.
- **Input:** `nums = [5,2,3,1]`
- **Expected Output:** `[1,2,3,5]`
- **Input:** `nums = [5,1,1,2,0,0]`
- **Expected Output:** `[0,0,1,1,2,5]`

### 2. Kth Largest Element in an Array - Medium
Given an integer array `nums` and an integer `k`, return the $k^{\text{th}}$ largest element in the array. Note that it is the $k^{\text{th}}$ largest element in the sorted order, not the $k^{\text{th}}$ distinct element. Solve it using QuickSelect partition in $O(n)$ average time.
- **Input:** `nums = [3,2,1,5,6,4], k = 2`
- **Expected Output:** `5`
- **Input:** `nums = [3,2,3,1,2,4,5,5,6], k = 4`
- **Expected Output:** `4`

### 3. Merge Sorted Array - Easy
You are given two integer arrays `nums1` and `nums2`, sorted in non-decreasing order, and two integers `m` and `n`, representing the number of elements in `nums1` and `nums2` respectively. Merge `nums1` and `nums2` into a single array sorted in non-decreasing order.
- **Input:** `nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3`
- **Expected Output:** `[1,2,2,3,5,6]`
- **Input:** `nums1 = [1], m = 1, nums2 = [], n = 0`
- **Expected Output:** `[1]`

---

<nav aria-label="Lecture navigation">

[Previous: Recursion & Call Stack](day-18-recursion-fundamentals-and-call-stack.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Recursion Trees & Backtracking](day-20-recursion-trees-and-backtracking-core.md)

</nav>
