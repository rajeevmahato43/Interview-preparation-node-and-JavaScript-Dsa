# Day 03: Searching & Elementary Sorting

<nav aria-label="Lecture navigation">

[Previous: Arrays, Strings & Memory](day-02-arrays-strings-and-primitive-memory.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Asymptotic complexity ($O(n), O(\log n), O(n^2)$).
- [Day 02: Arrays, Strings & Memory](day-02-arrays-strings-and-primitive-memory.md) — In-place array swapping and indexing.

---


Every valid algorithm must satisfy four core properties:
1. **Finiteness:** It must terminate after a finite number of operations (no unintentional infinite loops).
2. **Definiteness:** Every step must be unambiguous and rigorously defined.
3. **Correctness:** For every valid input, it produces the expected output and preserves all loop invariants.
4. **Efficiency:** It accomplishes the task while minimizing time (CPU instructions) and auxiliary space (memory allocations).

## 1. Searching: Linear vs Binary Search

When looking for a value in an array, there are two primary approaches:

| Algorithm | Requires Sorted Array? | Time Complexity | How it Works |
| :--- | :---: | :---: | :--- |
| **Linear Search** | ❌ No | **$O(n)$** | Scans from index 0 to $n - 1$ one item at a time. |
| **Binary Search** | ✅ **Yes** | **$O(\log n)$** | Jumps to the middle and discards half the array at each step. |

### Binary Search (Logarithmic Halving)
If an array is sorted, we can search $1,000,000$ items in at most **20 comparisons**:
```javascript
// Node.js code
function binarySearch(arr, target) {
  let low = 0;
  let high = arr.length - 1;

  while (low <= high) {
    const mid = Math.floor(low + (high - low) / 2);

    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1; // Look in right half
    else high = mid - 1;                 // Look in left half
  }

  return -1; // Not found
}
```

---

## 2. The 3 Elementary Sorting Algorithms ($O(n^2)$)

While modern JavaScript uses TimSort ($O(n \log n)$), interviews expect you to understand the three classic elementary sorts:

### 1. Bubble Sort: Swapping Adjacent Elements
Repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. The largest element "bubbles up" to the end on each pass.
```javascript
// Node.js code
function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    if (!swapped) break; // Early stop if already sorted
  }
  return arr;
}
```

### 2. Selection Sort: Finding the Smallest
Finds the smallest item in the unsorted section and swaps it with the first unsorted index.
```javascript
// Node.js code
function selectionSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    if (minIdx !== i) [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
  }
  return arr;
}
```

### 3. Insertion Sort: Inserting into a Sorted Hand
Takes elements one by one and inserts them into their correct position in the already-sorted left portion (like sorting cards in your hand). Fast ($O(n)$) on nearly-sorted data.
```javascript
// Node.js code
function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    const current = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > current) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = current;
  }
  return arr;
}
```

---

## 3. JavaScript's Built-In `arr.sort()` Trap

JavaScript's `arr.sort()` sorts elements as **strings by default**:
```javascript
// ❌ WRONG: Converts numbers to strings!
const nums = [10, 5, 20, 1];
nums.sort();
console.log(nums); // [1, 10, 20, 5] ('10' comes before '5' in alphabetical order!)

// ✅ CORRECT: Always pass a numeric comparator!
nums.sort((a, b) => a - b);
console.log(nums); // [1, 5, 10, 20]
```
- In V8, `sort()` runs **TimSort** with guaranteed **$O(n \log n)$ time** and **$O(1)$ to $O(n)$ space**.

---

## 4. Problem 1: Sort Colors (Dutch National Flag)

Given an array `nums` with `0`s (red), `1`s (white), and `2`s (blue), sort them in-place in a single pass ($O(n)$ time and $O(1)$ space).

### The 3-Pointer Algorithm:
- `low`: Next spot for `0`.
- `mid`: Current scanning index.
- `high`: Next spot for `2`.

```javascript
// Node.js code: Dutch National Flag
function sortColors(nums) {
  let low = 0, mid = 0, high = nums.length - 1;

  while (mid <= high) {
    if (nums[mid] === 0) {
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--; // Don't advance mid; check swapped item!
    }
  }

  return nums;
}

console.log(sortColors([2, 0, 2, 1, 1, 0])); // [0, 0, 1, 1, 2, 2]
```
- **Time Complexity:** $O(n)$ — Single pass.
- **Extra Space:** $O(1)$ — In-place swaps.

---

## 5. Problem 2: Meeting Rooms (Interval Overlap)

Given an array of meeting intervals `[[start, end]]`, determine if a person can attend all meetings (no overlapping meetings).

```javascript
// Node.js code
function canAttendMeetings(intervals) {
  // Sort meetings by start time
  intervals.sort((a, b) => a[0] - b[0]);

  for (let i = 1; i < intervals.length; i++) {
    // If next meeting starts before current meeting ends -> conflict!
    if (intervals[i][0] < intervals[i - 1][1]) {
      return false;
    }
  }

  return true;
}

console.log(canAttendMeetings([[0, 30], [5, 10], [15, 20]])); // false (overlap at 5)
console.log(canAttendMeetings([[7, 10], [2, 4]]));             // true
```
- **Time Complexity:** $O(n \log n)$ — Driven by the sort.
- **Extra Space:** $O(1)$ — Only compares adjacent intervals.

---

## 6. Tricky Points and Common Traps

1. **Binary search on unsorted array:** Fails completely. Binary search requires a sorted array.
2. **Forgetting comparator in `arr.sort()`:** `[100, 25].sort()` gives `[100, 25]` without `(a, b) => a - b`.
3. **Midpoint integer overflow:** In languages like Java or C++, `(low + high) / 2` can overflow. In JavaScript, use `Math.floor(low + (high - low) / 2)`.

---

## 7. Hands-On Exercises

Run this script in Node.js to verify binary search and Dutch National Flag sorting:

```javascript
// Node.js code
const assert = require("node:assert");

function testBS(arr, target) {
  let l = 0, r = arr.length - 1;
  while (l <= r) {
    const m = Math.floor((l + r) / 2);
    if (arr[m] === target) return m;
    if (arr[m] < target) l = m + 1;
    else r = m - 1;
  }
  return -1;
}

assert.equal(testBS([1, 3, 5, 7, 9], 7), 3);
assert.equal(testBS([1, 3, 5, 7, 9], 2), -1);

console.log("✅ Binary search assertions passed!");
```

---

## 8. Summary

- **Linear search** is $O(n)$ and works on any array.
- **Binary search** is $O(\log n)$ but requires the array to be sorted.
- **Bubble, Selection, and Insertion Sort** are $O(n^2)$ elementary sorts.
- **JavaScript `sort()`** runs in $O(n \log n)$ but converts to strings unless you pass `(a, b) => a - b`.
- **Dutch National Flag** sorts 3 values in $O(n)$ time using three pointers (`low`, `mid`, `high`).

---

## 9. Cheat Sheet

| Algorithm | Best Time | Worst Time | Space | Stable? |
| :--- | :---: | :---: | :---: | :---: |
| **Linear Search** | $O(1)$ | $O(n)$ | $O(1)$ | N/A |
| **Binary Search** | $O(1)$ | **$O(\log n)$** | $O(1)$ | N/A |
| **Bubble Sort** | $O(n)$ | $O(n^2)$ | $O(1)$ | Yes |
| **Insertion Sort**| $O(n)$ | $O(n^2)$ | $O(1)$ | Yes |
| **Selection Sort**| $O(n^2)$ | $O(n^2)$ | $O(1)$ | No |
| **JS `arr.sort()`**| $O(n)$ | **$O(n \log n)$** | $O(1)-O(n)$ | Yes (TimSort) |

---

## 10. Interview Q&A

### 45-Second Explanation
> *"Linear search scans items sequentially in $O(n)$ time and works on any array. Binary search requires sorted data, but by halving the search space on each step, it runs in $O(\log n)$ time. In JavaScript, always provide a numeric comparator to `arr.sort()` to prevent default alphabetical string sorting. For 3-value partitioning, we use Dijkstra's Dutch National Flag algorithm to sort in a single $O(n)$ pass."*

### Questions & Answers
1. **Why is Insertion Sort faster than Bubble Sort on nearly-sorted data?**
   Insertion Sort stops its inner loop as soon as it finds the right spot, running in $O(n)$ best-case time with very few swaps.
2. **What does the comparator `(a, b) => a - b` mean?**
   If `a - b < 0`, `a` comes before `b`. If `a - b > 0`, `b` comes before `a`. If `0`, order stays unchanged.

---

## 11. Practice Problems

### 1. Binary Search - Easy
Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`.
- **Input:** `nums = [-1,0,3,5,9,12]`, `target = 9`
- **Expected Output:** `4`
- **Input:** `nums = [-1,0,3,5,9,12]`, `target = 2`
- **Expected Output:** `-1`

### 2. Sort Colors - Medium
Given an array `nums` with `n` objects colored red, white, or blue, sort them in-place so that objects of the same color are adjacent, with the colors in the order red, white, and blue. We use the integers `0`, `1`, and `2` to represent the colors red, white, and blue respectively.
- **Input:** `nums = [2,0,2,1,1,0]`
- **Expected Output:** `[0,0,1,1,2,2]`
- **Input:** `nums = [2,0,1]`
- **Expected Output:** `[0,1,2]`

### 3. Majority Element - Easy
Given an array `nums` of size `n`, return the majority element. The majority element is the element that appears more than `floor(n / 2)` times. You may assume that the majority element always exists in the array.
- **Input:** `nums = [3,2,3]`
- **Expected Output:** `3`
- **Input:** `nums = [2,2,1,1,1,2,2]`
- **Expected Output:** `2`

---

<nav aria-label="Lecture navigation">

[Previous: Arrays, Strings & Memory](day-02-arrays-strings-and-primitive-memory.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md)

</nav>
