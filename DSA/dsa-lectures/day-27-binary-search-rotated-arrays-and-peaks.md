# Day 27: Binary Search on Rotated Arrays and Peaks

<nav aria-label="Lecture navigation">

[Previous: Binary Search Bounds and Intervals](day-26-binary-search-bounds-and-intervals.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search on Solution Space](day-28-binary-search-on-solution-space.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Identify the **Sorted Half Invariant** in rotated sorted arrays.
- Implement **Search in Rotated Sorted Array** in $O(\log n)$ time.
- Implement **Find Minimum in Rotated Sorted Array** in $O(\log n)$ time.
- Explain how Binary Search works on **unsorted data** to find a local peak in $O(\log n)$ time (**Find Peak Element**).
- Avoid performance degradation when duplicates appear in rotated arrays ($O(n)$ worst-case).

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md)
- [Day 26: Binary Search Bounds and Intervals](day-26-binary-search-bounds-and-intervals.md)

---

## Core Concepts

### 1. The Sorted Half Invariant

A rotated sorted array is formed by rotating a sorted array at some pivot unknown to you beforehand:
`[ 0, 1, 2, 4, 5, 6, 7 ]` rotated at pivot becomes `[ 4, 5, 6, 7, 0, 1, 2 ]`.

Notice what happens when you split the array at **any** midpoint `mid`:
```text
Array: [ 4 , 5 , 6 , 7 , 0 , 1 , 2 ]
         ▲           ▲             ▲
       left         mid          right
Left Half:  [ 4, 5, 6, 7 ] -> STRICTLY SORTED!
Right Half: [ 7, 0, 1, 2 ] -> Contains the rotation pivot.
```

**The Universal Invariant**:
> **At least one half of a rotated sorted array is ALWAYS normally sorted.**

How to detect which half is sorted:
- If `nums[left] <= nums[mid]`: The **left half is sorted**.
- Otherwise (`nums[left] > nums[mid]`): The **right half is sorted**.

Once you know which half is sorted, check if `target` lies within that sorted range:
- If `target` is within the sorted half: Search that half (`right = mid - 1` or `left = mid + 1`).
- Otherwise: Search the opposite half!

---

### 2. Binary Search on Unsorted Data: Find Peak Element

A peak element is an element that is strictly greater than its neighbors: `nums[i] > nums[i-1]` and `nums[i] > nums[i+1]`.
Can we find a peak in $O(\log n)$ time even if the array is completely unsorted? **YES!**

**The Slope Climbing Invariant**:
Look at the neighbor to the right of `mid`:
- If `nums[mid] < nums[mid + 1]`:
  We are on an **upward slope**. There is guaranteed to be at least one peak to our right! Move right: `left = mid + 1`.
- If `nums[mid] > nums[mid + 1]`:
  We are on a **downward slope** (or `mid` is the peak itself). There is guaranteed to be at least one peak to our left (including `mid`). Move left: `right = mid`.

```text
       Peak
        /\
       /  \    /
      /    \  /
           mid mid+1 (nums[mid] < nums[mid+1] -> Peak MUST lie to the right!)
```

---

## Detailed Explanations & Node.js Relevance

### Find Minimum in Rotated Sorted Array (LeetCode 153)

To find the minimum element (the rotation inflection point):
Compare `nums[mid]` against `nums[right]`:
- If `nums[mid] > nums[right]`:
  The minimum element must lie strictly to the right of `mid` (because a sorted array never drops to a smaller value on the right unless a rotation occurred). Move right: `left = mid + 1`.
- If `nums[mid] <= nums[right]`:
  The right half is sorted, meaning the minimum element is either `mid` itself or lies to the left of `mid`. Move left: `right = mid`.

Loop terminates when `left === right`, pointing directly to the minimum!

### Node.js Relevance: Partitioned Shard Routing
In distributed Node.js backends (e.g. DynamoDB or Cassandra hash rings), database shards are arranged in a circular sorted ring by hash value. When routing a query key, Node.js binary searches the rotated shard ring to find the partition replica in $O(\log N)$ time.

---

## JavaScript Implementation & Tracing

### 1. Search in Rotated Sorted Array (LeetCode 33)

```js
function searchRotated(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (nums[mid] === target) return mid;

    // Case 1: Left half is normally sorted
    if (nums[left] <= nums[mid]) {
      // Check if target falls within the sorted left half
      if (nums[left] <= target && target < nums[mid]) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    // Case 2: Right half is normally sorted
    else {
      // Check if target falls within the sorted right half
      if (nums[mid] < target && target <= nums[right]) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
  }

  return -1;
}
```

### 2. Find Peak Element (LeetCode 162)

```js
function findPeakElement(nums) {
  let left = 0;
  let right = nums.length - 1;

  // Use left < right because we compare mid with mid + 1
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);

    if (nums[mid] < nums[mid + 1]) {
      // Upward slope: peak lies to the right
      left = mid + 1;
    } else {
      // Downward slope: mid could be peak or peak is to the left
      right = mid;
    }
  }

  return left; // left === right points to a peak!
}
```

### Trace: `searchRotated([4, 5, 6, 7, 0, 1, 2], 0)`

| `left` | `right` | `mid` | `nums[mid]` | Sorted Half? | `target = 0` in Sorted Half? | Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 0 | 6 | 3 | 7 | Left (`4 <= 7`) | `0` in `[4, 7)`? No! | `left = mid + 1 = 4` |
| 4 | 6 | 5 | 1 | Right (`1 <= 2`) | `0` in `(1, 2]`? No! | `right = mid - 1 = 4` |
| 4 | 4 | 4 | 0 | Match found! | — | **Return index `4`** |

- **Time Complexity**: $O(\log n)$ for all searches.
- **Auxiliary Space**: $O(1)$ extra space.

---

## Common Mistakes & Interview Traps

1. **Using `<` instead of `<=` when checking sorted half**:
   ```js
   // WRONG: if (nums[left] < nums[mid])
   // When left === mid (two elements left), nums[left] === nums[mid].
   // You must use <= so the two-element case correctly identifies the left half as sorted!
   ```
2. **Infinite loop in `findPeakElement` with `while (left <= right)`**:
   When comparing `mid` with `mid + 1`, `right` must be updated to `right = mid`. If you use `while (left <= right)`, `left === right` keeps re-evaluating `mid === left`, running forever! Use `while (left < right)`.
3. **Duplicates in Rotated Array (Search in Rotated Sorted Array II)**:
   If duplicates exist (`nums = [1, 0, 1, 1, 1]`), `nums[left] === nums[mid] === nums[right]`. You cannot tell which half is sorted! You must decrement `right--` or increment `left++`, degrading worst-case runtime to $O(n)$.

---

## Tricky Points & Edge Cases

- **Array of Length 1**:
  `searchRotated([1], 0)` returns `-1`; `searchRotated([1], 1)` returns `0`.
- **Unrotated Array (Rotated 0 Times)**:
  `[1, 2, 3, 4, 5]`: `nums[left] <= nums[mid]` is always true; behaves identically to standard binary search.

---

## Practical Exercise

Implement **Find Minimum in Rotated Sorted Array** (LeetCode 153):
Given the sorted rotated array `nums` of unique elements, return the minimum element of this array.
- **Constraint**: Must run in $O(\log n)$ time.
- **Hint**: Compare `nums[mid]` with `nums[right]`.

---

## Summary

- At least one half of a rotated sorted array is always normally sorted.
- Determine which half is sorted by checking `nums[left] <= nums[mid]`.
- If the target is bounded inside the sorted half, search there; otherwise search the other half.
- Binary search can find peaks on unsorted data in $O(\log n)$ time by following the upward slope.

---

## Cheat Sheet

### Rotated Array Search Invariant
```js
if (nums[left] <= nums[mid]) {
  // Left half is sorted
  if (nums[left] <= target && target < nums[mid]) right = mid - 1;
  else left = mid + 1;
} else {
  // Right half is sorted
  if (nums[mid] < target && target <= nums[right]) left = mid + 1;
  else right = mid - 1;
}
```

---

## Interview Questions

### 1. Deep Definitions and Mental Models
**Question:** How can Binary Search find a peak in an array that is completely unsorted, given that binary search normally requires sorted data?
- **Expected answer shape:** Binary search does not strictly require globally sorted data; it requires a **monotonic decision criterion** that guarantees the target exists in one half. For peak finding, if `nums[mid] < nums[mid + 1]`, the array is increasing. Since the array is bounded by $-\infty$ at both ends, continuing in the direction of the increase is mathematically guaranteed to encounter a peak (either the sequence continues rising to the boundary or turns downward, creating a peak).

### 2. Predict the Output and Trace Execution
**Question:** What does this code return for `nums = [3, 1]`?
```js
function findMin(nums) {
  let l = 0, r = nums.length - 1;
  while (l < r) {
    const m = l + Math.floor((r - l) / 2);
    if (nums[m] > nums[r]) l = m + 1;
    else r = m;
  }
  return nums[l];
}
```
- **Expected answer shape:** Returns `1`. Initial: `l = 0, r = 1, m = 0 (nums[0]=3)`. $3 > 1 \to l = m + 1 = 1$. Loop terminates (`l === r = 1`). Returns `nums[1] = 1`.

### 3. Implementation Exercise
**Question:** Implement `findMin(nums)` in $O(\log n)$ time for unique elements.
- **Expected answer shape:**
```js
function findMin(nums) {
  let l = 0, r = nums.length - 1;
  while (l < r) {
    const m = l + Math.floor((r - l) / 2);
    if (nums[m] > nums[r]) l = m + 1;
    else r = m;
  }
  return nums[l];
}
```

### 4. Debugging and Failure Analysis
**Question:** In Search in Rotated Sorted Array II (with duplicates), what is the worst-case time complexity, and why can it not be guaranteed to run in $O(\log n)$ time?
- **Expected answer shape:** Worst-case time degrades to $O(n)$. For example, in `[1, 1, 1, 0, 1]` searching for `0`, `nums[left] === nums[mid] === nums[right] === 1`. There is no mathematical signal indicating whether the inflection point lies in the left half or right half. The algorithm must increment `left++` and decrement `right--`, checking elements one by one linearly.

### 5. Design and Tradeoff Questions
**Question:** Can an array have multiple peak elements? Which one does `findPeakElement` return?
- **Expected answer shape:** Yes, an array can have multiple local peaks (e.g. `[1, 3, 2, 4, 1]` has peaks at 3 and 4). Binary search is guaranteed to find *at least one* valid peak, but which one it finds depends on the initial midpoint selections. The problem specification allows returning the index of *any* valid peak.

### 6. Senior Follow-ups: Node.js Consistent Hashing Ring
**Question:** In a distributed Node.js caching cluster using Consistent Hashing, server nodes are mapped to points on a 32-bit integer ring. How does binary search locate the responsible server for a given cache key?
- **Expected answer shape:** Server tokens are sorted in an array. When a key is hashed to token $K$, Node.js binary searches the array using `lower_bound` to find the first server token $\ge K$. If $K$ is greater than all server tokens, it wraps around to the first server at index 0 (circular ring). Binary search resolves the cache node in $O(\log N)$ time, enabling high-performance request routing across thousands of cache nodes.

<nav aria-label="Lecture navigation">

[Previous: Binary Search Bounds and Intervals](day-26-binary-search-bounds-and-intervals.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search on Solution Space](day-28-binary-search-on-solution-space.md)

</nav>
