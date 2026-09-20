# Day 26: Binary Search Bounds and Intervals

<nav aria-label="Lecture navigation">

[Previous: Grid Backtracking: Word Search, Maze Paths, and N-Queens](day-25-grid-backtracking-and-n-queens.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search on Rotated Arrays and Peaks](day-27-binary-search-rotated-arrays-and-peaks.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain how Binary Search achieves $O(\log n)$ logarithmic runtime by halving the search space on each step.
- Write bug-free boundary conditions without off-by-one errors or infinite loops.
- Implement **Search Insert Position** (`lower_bound`) to find where a target belongs.
- Find the **First and Last Position** of an element in a sorted array containing duplicates.
- Apply binary search in Node.js backend systems to search time-partitioned logs and database index pages.

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md)
- [Day 05: Sorting and Searching Basics](day-05-sorting-and-searching-basics.md)

---

## Core Concepts

### 1. The Power of Logarithmic Halving ($O(\log n)$)

Binary search is the algorithm you intuitively use when looking up a word in a physical dictionary: you open to the middle, check if your word comes before or after, and discard the other half.

```text
Searching for 23 in a sorted array of 8 elements:
[ 2 , 5 , 8 , 12 , 16 , 23 , 38 , 56 ]
  ▲                  ▲             ▲
left                mid          right

mid is 12 < 23 -> Discard left half! left = mid + 1

[ 16 , 23 , 38 , 56 ]  --> mid is 23 (Target found in 2 steps!)
```

Each step cuts the remaining search range in half. For $1,000,000$ elements, binary search finds the answer in at most **20 comparisons** ($\log_2 10^6 \approx 19.9$)!

---

### 2. The 3 Golden Rules for Bug-Free Binary Search

Binary search is famous for subtle off-by-one errors and infinite loops. Memorize these 3 invariants:

1. **Loop Condition**: `while (left <= right)`
   - Ensures single-element intervals where `left === right` are tested.
2. **Safe Midpoint**: `left + Math.floor((right - left) / 2)`
   - In languages like C++/Java, `(left + right) / 2` overflows 32-bit signed integers. In JavaScript, numbers are 64-bit floats, but `Math.floor((right - left) / 2)` remains the universal best practice.
3. **Pointer Progression**: `left = mid + 1` and `right = mid - 1`
   - Never write `left = mid` or `right = mid` with `while (left <= right)`. When `left` and `right` are adjacent, integer division keeps `mid === left`, creating a permanent infinite loop!

---

## Detailed Explanations & Node.js Relevance

### Boundary Searching: First and Last Occurrence

When an array contains duplicates (`[1, 2, 2, 2, 3]`), standard binary search stops at *any* matching element (often the middle one).
To find the **First Occurrence** (`lower_bound`):
- When `nums[mid] === target`, do NOT return!
- Record `result = mid`.
- Continue searching to the **left**: `right = mid - 1`.

To find the **Last Occurrence** (`upper_bound`):
- When `nums[mid] === target`, do NOT return!
- Record `result = mid`.
- Continue searching to the **right**: `left = mid + 1`.

### Node.js Relevance: Timeseries Range Lookups
In Node.js log querying (e.g. searching a 5 GB sorted log file by timestamp), loading every line into memory is impossible.
Using binary search with file seeks (`fs.read` at byte offsets), Node.js can locate the first and last log entry matching a specific timestamp in just a few disk reads.

---

## JavaScript Implementation & Tracing

### 1. Search Insert Position (LeetCode 35)

Given a sorted array of distinct integers and a target value, return the index if the target is found. If not, return the index where it would be if it were inserted in order.

```js
function searchInsert(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  // If not found, 'left' points to the exact insertion index!
  return left;
}
```

### 2. Find First and Last Position of Element in Sorted Array (LeetCode 34)

```js
function searchRange(nums, target) {
  function findBound(isFirst) {
    let left = 0;
    let right = nums.length - 1;
    let bound = -1;

    while (left <= right) {
      const mid = left + Math.floor((right - left) / 2);

      if (nums[mid] === target) {
        bound = mid;
        if (isFirst) {
          right = mid - 1; // Keep searching left
        } else {
          left = mid + 1;  // Keep searching right
        }
      } else if (nums[mid] < target) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return bound;
  }

  return [findBound(true), findBound(false)];
}
```

### Trace: `searchRange([5, 7, 7, 8, 8, 10], 8)` for First Occurrence

| Step | `left` | `right` | `mid` | `nums[mid]` | Action | `bound` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 0 | 5 | 2 | 7 | $7 < 8 \to$ `left = mid + 1 = 3` | -1 |
| 2 | 3 | 5 | 4 | 8 | $8 === 8 \to$ `bound = 4`, `right = mid - 1 = 3` | 4 |
| 3 | 3 | 3 | 3 | 8 | $8 === 8 \to$ `bound = 3`, `right = mid - 1 = 2` | **3** |
| 4 | 3 | 2 | — | — | `left > right` $\to$ Loop terminates | Returns 3 |

- **Time Complexity**: $O(\log n)$ (two logarithmic passes).
- **Auxiliary Space**: $O(1)$ extra space.

---

## Common Mistakes & Interview Traps

1. **Using `left < right` with `right = nums.length - 1`**:
   If you initialize `right = nums.length - 1` and loop `while (left < right)`, the loop terminates before checking the final element when `left === right`.
2. **Forgetting Math.floor() in JavaScript**:
   JavaScript numbers are floating-point! `(3 + 4) / 2 = 3.5`. `nums[3.5]` returns `undefined`, breaking comparisons! Always wrap with `Math.floor()`.
3. **Assuming Target Exists**:
   Always handle cases where `target` is smaller than `nums[0]` or larger than `nums[n - 1]`.

---

## Tricky Points & Edge Cases

- **Target Belongs at Index 0 or Index $n$**:
  In `searchInsert([1, 3, 5], 0)` $\to$ returns `0`.
  In `searchInsert([1, 3, 5], 7)` $\to$ returns `3` (`nums.length`).
- **Empty Array**: `nums = []` returns `left = 0` immediately.

---

## Practical Exercise

Implement `mySqrt(x)` (LeetCode 69):
Given a non-negative integer `x`, return the square root of `x` rounded down to the nearest integer.
- **Constraint**: Do not use built-in exponent functions (`Math.sqrt()` or `x ** 0.5`).
- **Acceptance Criterion**: Must run in $O(\log x)$ time by binary searching the interval $[0, x]$.

---

## Summary

- Binary search cuts the search domain in half on every step, running in $O(\log n)$ time.
- Use `while (left <= right)` with `mid + 1` and `mid - 1` to guarantee termination without infinite loops.
- In `searchInsert`, when the loop terminates without an exact match, the pointer `left` points to the exact insertion index.
- To find first or last occurrences among duplicates, record the match and continue searching toward the boundary.

---

## Cheat Sheet

### Binary Search Templates
```js
// Exact Match & Search Insert Position
let l = 0, r = nums.length - 1;
while (l <= r) {
  const m = l + Math.floor((r - l) / 2);
  if (nums[m] === target) return m;
  if (nums[m] < target) l = m + 1;
  else r = m - 1;
}
return l; // Insertion position if not found

// First Occurrence (Lower Bound)
if (nums[m] === target) { res = m; r = m - 1; }
// Last Occurrence (Upper Bound)
if (nums[m] === target) { res = m; l = m + 1; }
```

---

## Interview Questions

### 1. Deep Definitions and Mental Models
**Question:** Why does the `left` pointer always end up at the correct insertion index when a target is not found in `searchInsert`?
- **Expected answer shape:** Throughout the search, the invariant is maintained that all elements to the left of `left` are strictly less than `target`, and all elements to the right of `right` are strictly greater than `target`. When the search space is exhausted, `left` crosses `right` such that `left = right + 1`. At this termination point, `left` points to the smallest element that is greater than `target`, which is the exact definition of the insertion index.

### 2. Predict the Output and Trace Execution
**Question:** What does this code return for `nums = [1, 3, 5, 6]`, `target = 2`?
```js
function searchInsert(nums, target) {
  let l = 0, r = nums.length - 1;
  while (l <= r) {
    const m = l + Math.floor((r - l) / 2);
    if (nums[m] < target) l = m + 1;
    else r = m - 1;
  }
  return l;
}
```
- **Expected answer shape:** Returns `1`. Initial: `l = 0, r = 3, m = 1 (nums[1]=3)`. $3 \ge 2 \to r = 0$. Next: `l = 0, r = 0, m = 0 (nums[0]=1)`. $1 < 2 \to l = 1$. Loop ends (`l > r`). Returns `l = 1`.

### 3. Implementation Exercise
**Question:** Write `mySqrt(x)` in $O(\log x)$ time without using `Math.sqrt`.
- **Expected answer shape:**
```js
function mySqrt(x) {
  if (x < 2) return x;
  let l = 1, r = Math.floor(x / 2), ans = 1;
  while (l <= r) {
    const m = l + Math.floor((r - l) / 2);
    if (m * m <= x) {
      ans = m;
      l = m + 1;
    } else {
      r = m - 1;
    }
  }
  return ans;
}
```

### 4. Debugging and Failure Analysis
**Question:** A candidate writes `const mid = (left + right) / 2;` in JavaScript. For `left = 0, right = 1`, `nums[mid]` throws an unexpected error or fails comparisons. Why?
- **Expected answer shape:** In JavaScript, division produces floating-point numbers. `(0 + 1) / 2 = 0.5`. Attempting to access `nums[0.5]` returns `undefined`. All comparisons (`undefined < target`) evaluate to `false`, causing unpredictable behavior or infinite loops. `Math.floor()` or bitwise shift `>> 1` must be used to produce an integer index.

### 5. Design and Tradeoff Questions
**Question:** If an array has $10^9$ elements and fits on disk but not in memory, how does a database B-Tree use binary search inside index pages?
- **Expected answer shape:** A database index organizes data into pages (typically 4 KB–16 KB). The B-Tree navigates from root to leaf in $O(\log_B n)$ disk seeks. Once the appropriate index page is loaded into memory, the engine executes in-memory binary search across the page's keys ($O(\log K)$) to locate the exact record pointer.

### 6. Senior Follow-ups: Node.js Binary Search over File Offsets
**Question:** How would you implement binary search to locate a timestamp in a 50 GB sorted log file on disk using Node.js without loading the file into RAM?
- **Expected answer shape:** Open the file using `fs.openSync()`. Let `left = 0` and `right = fileSizeInBytes`. Compute `midByte = left + Math.floor((right - left) / 2)`. Use `fs.readSync()` to read a small buffer (e.g. 512 bytes) starting at `midByte`, scan to the nearest newline to find the beginning of a log line, parse the timestamp, and adjust `left` or `right`. This finds the target record in ~35 file seeks with $< 1$ MB of RAM.

<nav aria-label="Lecture navigation">

[Previous: Grid Backtracking: Word Search, Maze Paths, and N-Queens](day-25-grid-backtracking-and-n-queens.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search on Rotated Arrays and Peaks](day-27-binary-search-rotated-arrays-and-peaks.md)

</nav>
