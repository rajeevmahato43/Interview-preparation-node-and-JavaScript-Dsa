# Day 26: Binary Search Bounds and Intervals

<nav aria-label="Lecture navigation">

[Previous: Grid Backtracking: Word Search, Maze Paths, and N-Queens](day-25-grid-backtracking-and-n-queens.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search on Rotated Arrays and Peaks](day-27-binary-search-rotated-arrays-and-peaks.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain how Binary Search achieves guaranteed $O(\log n)$ runtime by halving the search space on each iteration.
- Implement the three structural invariants of binary search without off-by-one errors or infinite loops.
- Derive why the `left` pointer lands on the exact insertion index in **Search Insert Position** (`lower_bound`).
- Implement boundary searches to locate the **First and Last Occurrence** of an element in a sorted array containing duplicates.
- Prevent floating-point index bugs in JavaScript caused by missing `Math.floor()` conversions.
- Apply binary search principles in Node.js backend systems to query time-partitioned logs via byte-offset disk seeking.

---

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Logarithmic growth rates ($O(\log n)$).
- [Day 02: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md) — Contiguous array indexing in V8.
- [Day 05: Sorting and Searching Basics](day-05-sorting-and-searching-basics.md) — Array sorting and linear vs binary search baselines.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
| :--- | :--- | :--- |
| **Binary Search** | A divide-and-conquer algorithm that repeatedly halves a sorted search interval by comparing the target with the median element. | Reduces linear scans of $1,000,000$ elements from $1,000,000$ comparisons to at most $20$ comparisons. |
| **Search Space Invariant** | A mathematical guarantee that the target value, if present, is strictly contained within the current `[left, right]` boundary. | Preserving this invariant prevents infinite loops and off-by-one errors. |
| **Lower Bound** | The smallest index `i` such that `nums[i] >= target`. | Identifies the first occurrence of a duplicate or the valid insertion slot for a missing key. |
| **Upper Bound** | The smallest index `i` such that `nums[i] > target`. | Identifies the boundary immediately following the last occurrence of a target. |
| **Byte Offset Seeking** | Using binary search over file byte positions (`fs.read`) to locate timestamped log entries without loading files into memory. | Enables sub-millisecond log querying over multi-gigabyte disk files in Node.js. |

---

## Core Concepts

### 1. The Logarithmic Halving Principle ($O(\log n)$)

A **Binary Search** locates a target within an ordered collection by comparing the target against the element at the midpoint of the search interval and discarding the half that cannot contain the target.

Because the search interval size is divided by $2$ on every iteration, the maximum number of comparisons $k$ required to exhaust an array of size $n$ satisfies:
$$\frac{n}{2^k} \le 1 \implies 2^k \ge n \implies k = \lceil \log_2 n \rceil$$

```text
Searching for 23 in an array of 8 elements:
[ 2 , 5 , 8 , 12 , 16 , 23 , 38 , 56 ]
  ▲                  ▲             ▲
left                mid          right

Step 1: mid index is 3 (nums[3] = 12).
        12 < 23 -> Discard left half!
        New search space: left = mid + 1 = 4.

[ 16 , 23 , 38 , 56 ]
   ▲        ▲        ▲
 left      mid     right

Step 2: mid index is 5 (nums[5] = 23).
        nums[5] === 23 -> Target located in 2 comparisons!
```

#### Comparison Scale: Linear vs Logarithmic

| Collection Size ($n$) | Linear Scan ($O(n)$) | Binary Search ($O(\log_2 n)$) | Speedup Factor |
| :--- | :--- | :--- | :--- |
| $1,000$ | 1,000 operations | $\approx 10$ operations | $100\times$ faster |
| $1,000,000$ | 1,000,000 operations | $\approx 20$ operations | $50,000\times$ faster |
| $1,000,000,000$ | 1,000,000,000 operations | $\approx 30$ operations | $33,333,333\times$ faster |

---

### 2. The Three Invariants for Bug-Free Binary Search

Binary search is notorious for off-by-one errors and infinite loops. Adhering strictly to three mathematical invariants guarantees correctness:

```text
Invariant 1: Loop Condition -> while (left <= right)
             Guarantees single-element intervals (left === right) are evaluated.

Invariant 2: Midpoint Calculation -> left + Math.floor((right - left) / 2)
             Prevents 32-bit integer overflow and avoids floating-point indexes.

Invariant 3: Pointer Progression -> left = mid + 1; right = mid - 1;
             Shrinks the window strictly on every iteration, preventing infinite loops.
```

```javascript
// Node.js code: Binary Search Invariants and Javascript Pitfalls

// ❌ WRONG: Missing Math.floor() produces floating-point indexes in JavaScript!
function brokenBinarySearch(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    // In JavaScript, division produces floats: (0 + 1) / 2 = 0.5!
    const mid = (left + right) / 2;
    // nums[0.5] evaluates to undefined! Comparisons fail silently.
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

// ❌ WRONG: Setting left = mid causes an infinite loop when left and right are adjacent!
function infiniteLoopBinarySearch(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] === target) return mid;
    // When left = 0, right = 1: mid = 0. Setting left = mid keeps left = 0 forever!
    if (nums[mid] < target) left = mid; 
    else right = mid - 1;
  }
  return -1;
}

// ✅ CORRECT: Standard, bulletproof Binary Search
function binarySearch(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (nums[mid] === target) {
      return mid; // Target found
    } else if (nums[mid] < target) {
      left = mid + 1; // Discard left half
    } else {
      right = mid - 1; // Discard right half
    }
  }

  return -1; // Target not found
}
```

---

### 3. Search Insert Position: The Termination Invariant

In **Search Insert Position** (LeetCode 35), we return the index of the target if found, or the index where it would be inserted in order if missing.

#### Why `left` Always Points to the Exact Insertion Index
Throughout the loop, the algorithm maintains two directional invariants:
1. Every element at index $< \text{left}$ is strictly $< \text{target}$.
2. Every element at index $> \text{right}$ is strictly $> \text{target}$.

When the target is not in the array, the search space contracts until `left === right`.
On the final iteration:
- If `nums[mid] < target`: `left` advances to `mid + 1`. Now `left` points to the first element greater than `target`.
- If `nums[mid] > target`: `right` decrements to `mid - 1`. `left` remains stationary at `mid`, which is the first element greater than `target`.

In both cases, the loop terminates with `left = right + 1`, and `left` points precisely to the correct zero-based insertion index:

```javascript
// Node.js code: Search Insert Position (LeetCode 35)

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

  // Invariant: 'left' is the exact insertion position
  return left;
}

console.log(searchInsert([1, 3, 5, 6], 5)); // 2 (found)
console.log(searchInsert([1, 3, 5, 6], 2)); // 1 (missing, belongs at index 1)
console.log(searchInsert([1, 3, 5, 6], 7)); // 4 (belongs at tail)
console.log(searchInsert([1, 3, 5, 6], 0)); // 0 (belongs at head)
```

---

### 4. Boundary Searching: First and Last Occurrences

When a sorted array contains duplicates (e.g., `[5, 7, 7, 8, 8, 10]`), standard binary search stops at whichever duplicate happens to land on `mid`.
To locate the exact boundaries:
- **First Occurrence (`lower_bound`)**: When `nums[mid] === target`, record `mid` as a candidate, but **continue searching to the left** (`right = mid - 1`) to see if earlier duplicates exist.
- **Last Occurrence (`upper_bound`)**: When `nums[mid] === target`, record `mid` as a candidate, but **continue searching to the right** (`left = mid + 1`) to see if subsequent duplicates exist.

```text
Searching for First Occurrence of 8 in [ 5, 7, 7, 8, 8, 10 ]:
Initial: left = 0, right = 5.
mid = 2 (nums[2] = 7). 7 < 8 -> left = 3.

Search interval: [ 8, 8, 10 ] (indexes 3 to 5):
mid = 4 (nums[4] = 8). Match found!
Record bound = 4. Continue searching left: right = mid - 1 = 3.

Search interval: [ 8 ] (index 3):
mid = 3 (nums[3] = 8). Match found!
Record bound = 3. Continue searching left: right = 2.
Loop terminates (left > right). First occurrence is index 3!
```

```javascript
// Node.js code: Find First and Last Position in Sorted Array (LeetCode 34)

function searchRange(nums, target) {
  function findBound(isFirst) {
    let left = 0;
    let right = nums.length - 1;
    let bound = -1;

    while (left <= right) {
      const mid = left + Math.floor((right - left) / 2);

      if (nums[mid] === target) {
        bound = mid;
        // If searching for first occurrence, push boundary left; otherwise push right
        if (isFirst) {
          right = mid - 1;
        } else {
          left = mid + 1;
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

console.log(searchRange([5, 7, 7, 8, 8, 10], 8)); // [3, 4]
console.log(searchRange([5, 7, 7, 8, 8, 10], 6)); // [-1, -1]
```

---

## Detailed Node.js Relevance: Binary Searching Gigabyte Disk Files

In production Node.js log processing (e.g., querying access logs partitioned by ISO-8601 timestamps), loading a 10 GB file into V8 heap memory causes an Out-Of-Memory crash.

Because disk files formatted with fixed or monotonically increasing timestamps are sorted, Node.js can perform binary search directly over **byte offsets**:

```text
Disk File (10 GB):
Offset: 0 GB                     5 GB                          10 GB
        [ 2026-01-01T00:00:00Z ] [ 2026-06-15T12:00:00Z ]      [ 2026-12-31T23:59:59Z ]
                                          ▲
                                   File Seek (mid)
```

1. Maintain `leftByte = 0` and `rightByte = fs.statSync(file).size`.
2. Compute `midByte = leftByte + Math.floor((rightByte - leftByte) / 2)`.
3. Use `fs.readSync()` to read a 1 KB buffer at `midByte`, advance to the nearest newline `\n` to read the first complete timestamp, and compare against the query timestamp.
4. Adjust `leftByte` or `rightByte` accordingly.
5. Locates the target timestamp record in ~34 disk reads ($\log_2 10^{10} \approx 34$) in under 5 milliseconds with $< 1$ MB of RAM!

---

## Tricky Points & Edge Cases

1. **JavaScript Floating-Point Midpoint**:
   Forgetting `Math.floor()` causes JavaScript to produce fractional indexes (e.g., `nums[2.5]`), returning `undefined` and causing comparisons to fail silently.
2. **Target Smaller Than Minimum or Greater Than Maximum**:
   If `target < nums[0]`, `searchInsert` returns `0`. If `target > nums[nums.length - 1]`, it returns `nums.length`. Verify that calling code expects index `nums.length`.
3. **Empty Array Handling**:
   When `nums = []`, `searchRange` returns `[-1, -1]`, and `searchInsert` returns `0`. Ensure no unchecked index accesses occur before loop entry.

---

## Hands-On Exercise

### Scenario: High-Precision Integer Square Root

Implement `mySqrt(x)` (LeetCode 69): Given a non-negative integer $x$, return the square root of $x$ rounded down to the nearest integer. You cannot use built-in exponential operators (`Math.sqrt()` or `x ** 0.5`).

### Buggy Code

```javascript
// ❌ BUGGY: Suffers from infinite loops and integer overflow
function buggySqrt(x) {
  if (x < 2) return x;
  let left = 1;
  let right = x;

  // BUG 1: Using left < right with right = mid causes infinite loop
  while (left < right) {
    const mid = (left + right) / 2; // BUG 2: Floats in JS!
    if (mid * mid === x) return mid;
    if (mid * mid < x) left = mid;  // BUG 3: Infinite loop when left = mid!
    else right = mid - 1;
  }

  return left;
}
```

### Acceptance Criteria

1. Evaluates $\lfloor \sqrt{x} \rfloor$ in $O(\log x)$ time without floating-point math operators.
2. Handles edge cases $x = 0$ and $x = 1$ correctly.
3. Uses safe midpoint calculations and integer floors.
4. Verified with strict Node.js assertions across perfect squares, non-squares, and large values ($x = 2^{31} - 1$).

### Solution Code

```javascript
// Node.js code: Binary Search Integer Square Root
const assert = require("assert");

function mySqrt(x) {
  // Base cases: 0 and 1
  if (x < 2) return x;

  let left = 1;
  // For x >= 2, the square root cannot exceed Math.floor(x / 2)
  let right = Math.floor(x / 2);
  let ans = 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    const square = mid * mid;

    if (square === x) {
      return mid; // Exact integer root found
    } else if (square < x) {
      ans = mid;      // mid is a valid candidate for floor(sqrt(x))
      left = mid + 1; // Try to find a larger valid integer
    } else {
      right = mid - 1; // square > x, must decrease
    }
  }

  return ans;
}

// Verification Tests
assert.strictEqual(mySqrt(0), 0);
assert.strictEqual(mySqrt(1), 1);
assert.strictEqual(mySqrt(4), 2);
assert.strictEqual(mySqrt(8), 2);   // 8^(1/2) = 2.828... -> 2
assert.strictEqual(mySqrt(16), 4);
assert.strictEqual(mySqrt(25), 5);
assert.strictEqual(mySqrt(2147395599), 46339); // Large 31-bit integer

console.log("✅ All Integer Square Root assertions passed successfully.");
```

### Solution Explanation

1. **Upper Bound Optimization**: For all integers $x \ge 4$, $\sqrt{x} \le \frac{x}{2}$. Initializing `right = Math.floor(x / 2)` cuts the search space in half before the first comparison.
2. **Candidate Preservation**: Whenever `mid * mid < x`, we record `ans = mid` because `mid` satisfies the floor condition, and then probe higher values (`left = mid + 1`).

---

## Summary

- **Logarithmic Runtime**: Binary search halves the search domain on each iteration, achieving $O(\log n)$ efficiency.
- **The Three Invariants**: Use `while (left <= right)`, `left + Math.floor((right - left) / 2)`, and strict pointer updates (`mid + 1`, `mid - 1`).
- **Insertion Invariant**: When a target is missing in `searchInsert`, the pointer `left` terminates precisely at the insertion index.
- **Boundary Duplicate Searches**: Record candidate matches and continue searching left (`right = mid - 1`) for lower bounds or right (`left = mid + 1`) for upper bounds.
- **Disk Byte Offsets**: Binary search over file byte offsets enables sub-millisecond queries on multi-gigabyte log files in Node.js.

---

## Cheat Sheet & Common Pitfalls

### Binary Search Core Templates
```javascript
// Exact Match & Search Insert Position
let l = 0, r = nums.length - 1;
while (l <= r) {
  const m = l + Math.floor((r - l) / 2);
  if (nums[m] === target) return m;
  if (nums[m] < target) l = m + 1;
  else r = m - 1;
}
return l; // Insertion position if target not present

// First Occurrence (Lower Bound)
if (nums[m] === target) { ans = m; r = m - 1; }

// Last Occurrence (Upper Bound)
if (nums[m] === target) { ans = m; l = m + 1; }
```

### Common Pitfalls

| Mistake | Consequence | Correct Pattern |
| :--- | :--- | :--- |
| **Omitting `Math.floor()`** | Fractional index; accesses `undefined`. | `l + Math.floor((r - l) / 2)`. |
| **`left = mid` in `while (l <= r)`** | Permanent infinite loop when $r - l = 1$. | Always advance `l = mid + 1` or `r = mid - 1`. |
| **`while (left < right)` without check** | Fails to evaluate the final single element. | Use `while (left <= right)`. |
| **Returning `-1` in `searchInsert`** | Fails to return the required insertion slot. | Return `left` upon loop termination. |

---

## Interview Questions

### 1. Why does the `left` pointer always terminate at the exact insertion index in `searchInsert`?

**Question:** Mathematically explain why the `left` pointer terminates at the exact insertion index when a target is not found in `searchInsert`.

**Answer:** 
Throughout the binary search loop, two boundary invariants are preserved:
1. All elements with indices $< \text{left}$ are strictly $< \text{target}$.
2. All elements with indices $> \text{right}$ are strictly $> \text{target}$.

When the target is not present, the search space continues shrinking until `left === right` (a single remaining candidate).
- If `nums[left] < target`: The target belongs to the right of this element. The algorithm executes `left = mid + 1`. Now `left` points to the first element greater than `target`.
- If `nums[left] > target`: The target belongs at this exact index. The algorithm executes `right = mid - 1`. The pointer `left` remains stationary at this index.

In both cases, the loop terminates with `left = right + 1`, and `left` points to the smallest element strictly greater than `target` (or `nums.length` if `target` is greater than all elements), which is the exact definition of the insertion position.

---

### 2. What is the output and trace of `searchRange([5, 7, 7, 8, 8, 10], 8)` for finding the first occurrence?

**Question:** Trace the pointer values (`left`, `right`, `mid`, `bound`) when searching for the first occurrence of `8` in `nums = [5, 7, 7, 8, 8, 10]`.

**Answer:** 

| Step | `left` | `right` | `mid` | `nums[mid]` | Evaluation | Action | `bound` |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | 0 | 5 | 2 | 7 | $7 < 8$ | `left = mid + 1 = 3` | -1 |
| 2 | 3 | 5 | 4 | 8 | $8 === 8$ | `bound = 4`, `right = mid - 1 = 3` | 4 |
| 3 | 3 | 3 | 3 | 8 | $8 === 8$ | `bound = 3`, `right = mid - 1 = 2` | 3 |
| 4 | 3 | 2 | — | — | `left > right` | Loop terminates | Returns 3 |

The algorithm correctly identifies index `3` as the first occurrence.

---

### 3. How do you implement `mySqrt(x)` in $O(\log x)$ time without using `Math.sqrt`?

**Question:** Write `mySqrt(x)` in $O(\log x)$ time complexity without using floating-point math operators.

**Answer:** 

```javascript
// Node.js code
function mySqrt(x) {
  if (x < 2) return x;
  let left = 1;
  let right = Math.floor(x / 2);
  let ans = 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    const square = mid * mid;

    if (square === x) {
      return mid;
    } else if (square < x) {
      ans = mid;      // Valid candidate for floor(sqrt(x))
      left = mid + 1; // Seek larger candidate
    } else {
      right = mid - 1;
    }
  }

  return ans;
}
```

---

### 4. How would you locate a timestamp in a 50 GB sorted log file on disk using Node.js without loading the file into RAM?

**Question:** A sorted 50 GB access log file resides on a Linux server. How can a Node.js script find the first log entry matching a specific ISO timestamp in under 10 milliseconds without running out of memory?

**Answer:** 
Rather than reading the file sequentially or loading lines into memory, use binary search over **file byte offsets**:
1. Retrieve the file's total size in bytes using `fs.statSync(filePath).size`.
2. Initialize `leftByte = 0` and `rightByte = size`.
3. In a `while (leftByte <= rightByte)` loop:
   - Calculate `midByte = leftByte + Math.floor((rightByte - leftByte) / 2)`.
   - Open a file descriptor via `fs.openSync(filePath, 'r')`.
   - Read a small 512-byte buffer starting at `midByte` using `fs.readSync()`.
   - Scan to the first newline character `\n` to align to the start of the next complete log record.
   - Parse the ISO timestamp from the log line.
   - If `lineTimestamp < targetTimestamp`, set `leftByte = midByte + 1`.
   - Otherwise, set `rightByte = midByte - 1` and record the offset.
4. Because $\log_2(50 \times 10^9) \approx 36$, the search completes in at most 36 disk seeks, consuming $< 1$ MB of RAM and completing in under 10 milliseconds.

---

<nav aria-label="Lecture navigation">

[Previous: Grid Backtracking: Word Search, Maze Paths, and N-Queens](day-25-grid-backtracking-and-n-queens.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search on Rotated Arrays and Peaks](day-27-binary-search-rotated-arrays-and-peaks.md)

</nav>
