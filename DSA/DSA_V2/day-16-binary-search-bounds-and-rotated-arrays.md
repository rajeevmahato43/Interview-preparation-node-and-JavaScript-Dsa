# Day 16: Binary Search Bounds & Rotated Arrays

<nav aria-label="Lecture navigation">

[Previous: Queues, Circular Buffers & Design](day-15-queues-circular-buffers-and-design.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search on Solution Space](day-17-binary-search-on-solution-space.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Logarithmic time complexity $O(\log n)$.
- [Day 03: Searching & Elementary Sorting Algorithms](day-03-searching-and-sorting-algorithms.md) — Classic binary search fundamentals and loop invariants.

---

## 1. What is Binary Search on Bounds & Rotated Arrays?

Classic binary search finds an exact target match in a strictly sorted array. However, real-world systems often require locating **boundary thresholds** (the first or last occurrence of a value) or searching arrays that have been **rotated** around an unknown pivot point.

> **Lower Bound (First Occurrence / Bisect Left)**: The first index $i$ in a sorted array where `arr[i] >= target`. If all elements are smaller, returns `arr.length`.

> **Upper Bound (Bisect Right)**: The first index $i$ in a sorted array where `arr[i] > target`.

> **Rotated Sorted Array**: An array originally sorted in ascending order that has had a suffix sliced and prepended to the front (e.g., `[0, 1, 2, 4, 5, 6, 7]` rotated at pivot `4` becomes `[4, 5, 6, 7, 0, 1, 2]`).

> **Inflection Point (Pivot)**: The unique boundary in a rotated sorted array where `arr[i] > arr[i + 1]`. The minimum element of the entire array always sits immediately after the pivot.

### Everyday Physical Analogies

#### The Cut Deck of Cards (Rotated Array)
Imagine a standard deck of cards sorted Ace to King:
1. You cut the deck in the middle and place the bottom half on top.
2. The cards are no longer monotonically sorted from top to bottom.
3. However, wherever you cut the remaining deck in half, **at least one of the two halves is guaranteed to be completely sorted**!
4. By checking whether your target card fits within the sorted half, you instantly know which half to keep and which half to discard.

```text
ROTATED ARRAY STRUCTURE:
Original:  [ 0, 1, 2, 4, 5, 6, 7 ]
Rotated:   [ 4, 5, 6, 7 | 0, 1, 2 ]
             ▲        ▲   ▲     ▲
             └─Zone A─┘   └Zone B┘
          (Ascending)   (Ascending)
          Zone A is strictly greater than Zone B!
```

---

## 2. How Bounds & Rotated Search Work Step-by-Step

### 1. Lower Bound vs Upper Bound

When an array contains duplicate numbers (e.g., `[1, 2, 2, 2, 3, 5]`), classic binary search stops on an arbitrary match. Boundary search systematically shrinks the window to isolate the boundary.

#### Step-by-Step Lower Bound Trace on `[1, 2, 2, 2, 3, 5]`, target = 2:
```text
Goal: Find the first index where arr[i] >= 2.
low = 0, high = 5. ans = 6 (arr.length)

Step 1:
  mid = 0 + Math.floor((5 - 0) / 2) = 2. arr[2] = 2.
  Is arr[2] >= 2? Yes!
  Record candidate ans = 2.
  Shrink search space to the LEFT to see if an earlier 2 exists: high = mid - 1 = 1.

Step 2:
  low = 0, high = 1. mid = 0. arr[0] = 1.
  Is arr[0] >= 2? No!
  Target must be to the right: low = mid + 1 = 1.

Step 3:
  low = 1, high = 1. mid = 1. arr[1] = 2.
  Is arr[1] >= 2? Yes!
  Record candidate ans = 1.
  Shrink left: high = mid - 1 = 0.

Termination: low (1) > high (0).
Final Lower Bound = 1 (First index containing 2).
```

```javascript
// ✅ CORRECT: Lower bound binary search (first index where arr[i] >= target)
function lowerBound(arr, target) {
  let low = 0;
  let high = arr.length - 1;
  let ans = arr.length; // Default if all elements < target

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (arr[mid] >= target) {
      ans = mid;      // Candidate found
      high = mid - 1; // Search left for earlier occurrence
    } else {
      low = mid + 1;  // Search right
    }
  }

  return ans;
}

// ✅ CORRECT: Upper bound binary search (first index where arr[i] > target)
function upperBound(arr, target) {
  let low = 0;
  let high = arr.length - 1;
  let ans = arr.length;

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (arr[mid] > target) {
      ans = mid;
      high = mid - 1; // Search left for earlier strictly greater element
    } else {
      low = mid + 1;
    }
  }

  return ans;
}

// Example test run
const sample = [1, 2, 2, 2, 3, 5];
console.log(lowerBound(sample, 2)); // 1 (First 2 is at index 1)
console.log(upperBound(sample, 2)); // 4 (First element > 2 is 3 at index 4)
```

---

### 2. The One-Sorted-Half Invariant

In any rotated sorted array without duplicates, for any chosen midpoint `mid`:
- If `arr[low] <= arr[mid]`, the **left half is normally sorted**.
- Otherwise (`arr[low] > arr[mid]`), the **right half is normally sorted**.

#### Why this invariant holds:
A single rotation introduces only **one** point of disorder (the pivot). An array cut in half can contain the pivot in at most one of the halves. The other half is guaranteed to be completely clean and ascending!

```text
EVALUATION LOGIC:
1. Is Left Half Sorted? (arr[low] <= arr[mid])
   - If YES: Does target lie inside [ arr[low] ... arr[mid] ]?
     - If YES: high = mid - 1 (search left half)
     - If NO:  low = mid + 1  (search right half)
2. Otherwise, Right Half MUST be Sorted! (arr[mid] <= arr[high])
   - Does target lie inside [ arr[mid] ... arr[high] ]?
     - If YES: low = mid + 1  (search right half)
     - If NO:  high = mid - 1 (search left half)
```

---

### 3. Finding Peak Elements ($O(\log n)$ Slope Check)

Binary search also works on unsorted arrays if an **incline/decline slope invariant** exists. In a mountain array:
- If `arr[mid] < arr[mid + 1]`, we are on an upward slope; the peak MUST lie to the right $\to$ `low = mid + 1`.
- If `arr[mid] > arr[mid + 1]`, we are on a downward slope or at the peak itself $\to$ `high = mid`.

```javascript
// ✅ CORRECT: O(log n) Peak Finding using slope check
function findPeakElement(nums) {
  let low = 0;
  let high = nums.length - 1;

  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    if (nums[mid] < nums[mid + 1]) {
      low = mid + 1; // Climb upward toward peak
    } else {
      high = mid;    // mid could be the peak or peak is to the left
    }
  }

  return low;
}

// Example test run
console.log(findPeakElement([1, 2, 3, 1]));       // 2 (Peak is value 3 at index 2)
console.log(findPeakElement([1, 2, 1, 3, 5, 6, 4])); // 5 (Peak is value 6 at index 5)
```

---

## 3. Pattern Recognition of Bounds & Rotations

### Problem Triggers and Keywords

| Problem Trigger | Underlying Requirement | Recommended Strategy |
| :--- | :--- | :--- |
| **"Sorted array with duplicates"** | First or last index of target. | `lowerBound` / `upperBound` ($O(\log n)$). |
| **"Search in rotated sorted array"** | Find target in shifted array. | Check sorted half invariant ($O(\log n)$). |
| **"Find minimum in rotated array"** | Find inflection pivot point. | Compare `arr[mid]` against `arr[high]`. |
| **"Find rotation count"** | Index of minimum element. | Index of inflection point. |
| **"Find peak element"** | Local maximum in unsorted array. | Slope check: `arr[mid] < arr[mid + 1]`. |

### The $10^7$ Rule for Binary Search
- Linear scans take $O(n)$ time. For $n = 10^7$, a linear scan takes $\approx 100\text{ms}$.
- Binary Search runs in $O(\log n)$ time. For $n = 10^9$ (one billion items), Binary Search completes in at most **30 comparisons** ($\approx 0.001\text{ms}$).

---

## 4. Problem 1: Search in Rotated Sorted Array (LeetCode 33)

### Problem Statement
Given an integer array `nums` sorted in ascending order (with **distinct** values) that has been rotated at an unknown pivot index, and an integer `target`, return the index of `target` if it is in `nums`, or `-1` if it is not in `nums`.
You must write an algorithm with **$O(\log n)$ runtime complexity**.

```text
Input: nums = [4, 5, 6, 7, 0, 1, 2], target = 0
Output: 4

Input: nums = [4, 5, 6, 7, 0, 1, 2], target = 3
Output: -1

Input: nums = [1], target = 0
Output: -1
```

### Step 1: Physical Simulation
Imagine a telephone book cut and re-stacked: `[4, 5, 6, 7, 0, 1, 2]`, `target = 0`.
1. Put fingers on `low = 0` (4) and `high = 6` (2).
2. Look at middle: `mid = 3` (value 7).
3. Is `4 <= 7`? **Yes! The left half `[4, 5, 6, 7]` is normally sorted.**
4. Ask: Does our target `0` fit between 4 and 7?
   - `4 <= 0 <= 7` is False! Target `0` cannot possibly be in the left half.
   - Discard the left half completely! Move `low = mid + 1 = 4`.
5. Remaining window: `[0, 1, 2]`.
   - `low = 4` (0), `high = 6` (2).
   - `mid = 5` (1).
   - Target `0 < 1`. Move `high = mid - 1 = 4`.
6. `low = 4, high = 4, mid = 4`. `nums[4] === 0` -> MATCH FOUND! Return index 4.

### Step 2: Brute Force Approach
Linear scan checking every element one-by-one:

```javascript
function searchBrute(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === target) return i;
  }
  return -1;
}
```
- **Time Complexity**: $O(n)$ — Fails the interview's $O(\log n)$ requirement.
- **Space Complexity**: $O(1)$.

### Step 3: Bottleneck
Where is the CPU sweating?
Linear scan inspects all $n$ items, completely ignoring that the array consists of two pre-sorted segments.

### Step 4: The Pattern Discovery
At least one half is always sorted. By testing if the target lies within the boundaries of the sorted half, we can eliminate half of the search space in every single step ($O(\log n)$).

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: O(log n) Rotated Binary Search
function search(nums, target) {
  let low = 0;
  let high = nums.length - 1;

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);

    if (nums[mid] === target) {
      return mid;
    }

    // Check if Left Half is sorted
    if (nums[low] <= nums[mid]) {
      // Check if target lies within the sorted left half
      if (nums[low] <= target && target < nums[mid]) {
        high = mid - 1; // Search left
      } else {
        low = mid + 1;  // Search right
      }
    } 
    // Otherwise, Right Half must be sorted
    else {
      // Check if target lies within the sorted right half
      if (nums[mid] < target && target <= nums[high]) {
        low = mid + 1;  // Search right
      } else {
        high = mid - 1; // Search left
      }
    }
  }

  return -1; // Target not found
}

// ❌ ANTI-PATTERN: Comparing target with mid only (classic binary search fails on rotated data)
function buggyRotatedSearch(nums, target) {
  let low = 0, high = nums.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] === target) return mid;
    // BUG: Assuming arr is monotonically sorted discards the correct half!
    if (nums[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}

// Example test runs
console.log(search([4, 5, 6, 7, 0, 1, 2], 0)); // 4
console.log(search([4, 5, 6, 7, 0, 1, 2], 3)); // -1
console.log(search([1], 0));                   // -1
console.log(search([1, 3], 3));                // 1
console.log(buggyRotatedSearch([4, 5, 6, 7, 0, 1, 2], 0)); // -1 (BUG: failed on rotated array!)
```

- **Time Complexity**: $O(\log n)$ — Window size halves on every iteration.
- **Space Complexity**: $O(1)$ — Only three integer pointer variables.

---

## 5. Problem 2: Find Minimum in Rotated Sorted Array (LeetCode 153)

### Problem Statement
Given the sorted rotated array `nums` of **unique** elements, return the **minimum element** of this array.
You must write an algorithm that runs in **$O(\log n)$ time**.

```text
Input: nums = [3, 4, 5, 1, 2]
Output: 1 (Original array was [1, 2, 3, 4, 5] rotated 3 times)

Input: nums = [4, 5, 6, 7, 0, 1, 2]
Output: 0

Input: nums = [11, 13, 15, 17]
Output: 11
```

### Step 1: Physical Simulation
Imagine the values plotted as a line graph:
`[4, 5, 6, 7, 0, 1, 2]`
- Zone 1 rises: `4 -> 5 -> 6 -> 7`.
- Sudden drop cliff: `7 -> 0` (**The Inflection Point**).
- Zone 2 rises: `0 -> 1 -> 2`.
- Notice: The minimum element `0` is the **only element in the entire array that is strictly smaller than the last element `nums[high]` (`2`)**!
- Compare `nums[mid]` with `nums[high]`:
  - If `nums[mid] > nums[high]`: `mid` is trapped up on the high cliff (Zone 1). The minimum must lie to the **right** (`low = mid + 1`).
  - If `nums[mid] <= nums[high]`: `mid` is in Zone 2. The minimum could be `mid` itself or to the **left** (`high = mid`).

### Step 2: Brute Force Approach
Linear scan tracking the smallest value:

```javascript
function findMinBrute(nums) {
  let min = nums[0];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] < min) min = nums[i];
  }
  return min;
}
```
- **Time Complexity**: $O(n)$ — Inspects all elements.
- **Space Complexity**: $O(1)$.

### Step 3: Bottleneck
Where is the CPU sweating?
Comparing elements linearly does not exploit the property that `nums[mid]` compared to `nums[high]` determines which side of the inflection cliff we are on.

### Step 4: The Pattern Discovery
Compare `nums[mid]` against `nums[high]`:
- If `nums[mid] > nums[high]`, the inflection point is strictly to the right $\to$ `low = mid + 1`.
- If `nums[mid] <= nums[high]`, the inflection point is at `mid` or to the left $\to$ `high = mid`.
- When `low === high`, the window has converged to the single minimum element!

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: O(log n) Minimum Finding via Right Boundary Comparison
function findMin(nums) {
  let low = 0;
  let high = nums.length - 1;

  // Invariant: The minimum element always resides in nums[low ... high]
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);

    if (nums[mid] > nums[high]) {
      // mid is in the upper rotated segment; minimum MUST be strictly right of mid
      low = mid + 1;
    } else {
      // mid is in the lower segment; mid itself could be the minimum
      high = mid; // Note: NOT mid - 1, because mid could be the answer!
    }
  }

  // Loop terminates when low === high
  return nums[low];
}

// ❌ ANTI-PATTERN: Using high = mid - 1 skips the minimum element when mid is the minimum
function buggyFindMin(nums) {
  let low = 0, high = nums.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] > nums[high]) low = mid + 1;
    else high = mid - 1; // BUG! If mid was the minimum (e.g. 1 in [3, 1, 2]), it is skipped!
  }
  return nums[low];
}

// Example test runs
console.log(findMin([3, 4, 5, 1, 2]));          // 1
console.log(findMin([4, 5, 6, 7, 0, 1, 2]));    // 0
console.log(findMin([11, 13, 15, 17]));         // 11 (Not rotated; returns first)
console.log(findMin([2, 1]));                   // 1
console.log(buggyFindMin([3, 1, 2]));           // 3 (BUG: skipped 1 because high = mid - 1!)
```

- **Time Complexity**: $O(\log n)$ — Logarithmic binary search.
- **Space Complexity**: $O(1)$ — Zero memory allocation.

---

## 6. Under the Hood: V8 & Node.js

### 32-Bit Signed Integer Overflow & Float Midpoints
In C++ or Java, `(low + high) / 2` overflows to a negative integer when `low + high > 2^{31} - 1`.
In JavaScript:
1. All standard numbers are 64-bit IEEE-754 floats. `(low + high) / 2` does not overflow 32-bit limits, but produces **fractional decimals** (e.g., `(0 + 1) / 2 = 0.5`).
2. Array lookup `nums[0.5]` returns `undefined`, breaking binary search silently!
3. Developers sometimes use bitwise shift: `(low + high) >> 1`.
   - **Danger**: In JavaScript, bitwise operators (`>>`, `|`, `&`) coerce floats into **32-bit signed integers**. If array length exceeds $2^{30}$, `(low + high)` overflows to negative, crashing the loop!
4. **Universal Standard**: Always use:
   `const mid = low + Math.floor((high - low) / 2);`

### Branch Predictor in Binary Search
Modern CPUs feature sophisticated **Branch Predictors** that guess whether an `if` condition will be true or false.
- In linear scans, branch predictors achieve ~95% accuracy because elements sequentially fail or pass.
- In binary search, the target comparison `nums[mid] < target` is effectively random (50% probability each way).
- This triggers frequent CPU pipeline stalls called **Branch Mispredictions**.
- Despite pipeline stalls, the reduction from $O(n)$ ($10^6$ operations) to $O(\log n)$ ($20$ operations) makes binary search thousands of times faster.

---

## 7. Hands-On Exercise

### The Scenario
You are developing an indexing service for a high-volume database in Node.js.
You are given an array of integers `nums` sorted in non-decreasing order.
You must implement `searchRange(nums, target)` to find the **starting and ending position** of a given `target` value in $O(\log n)$ runtime. If `target` is not found, return `[-1, -1]`.

```text
Input: nums = [5, 7, 7, 8, 8, 10], target = 8
Output: [3, 4]

Input: nums = [5, 7, 7, 8, 8, 10], target = 6
Output: [-1, -1]
```

### The Buggy Code
```javascript
function searchRangeBuggy(nums, target) {
  // Bug: Linear scan inside helper violates O(log n) requirement on [8, 8, 8, 8, 8]!
  const idx = nums.indexOf(target);
  if (idx === -1) return [-1, -1];
  let end = idx;
  while (end < nums.length && nums[end] === target) end++;
  return [idx, end - 1];
}
```

### Acceptance Criteria
1. Must execute in strict **$O(\log n)$ time**.
2. Must use two binary searches: one for the first occurrence, one for the last occurrence.
3. Correctly returns `[-1, -1]` if target is absent.
4. Verified with direct test execution.

### Verified Solution

```javascript
// ✅ CORRECT: Dual Binary Search for Left and Right Bounds
function searchRange(nums, target) {
  function findBound(isFirst) {
    let low = 0;
    let high = nums.length - 1;
    let bound = -1;

    while (low <= high) {
      const mid = low + Math.floor((high - low) / 2);

      if (nums[mid] === target) {
        bound = mid;
        if (isFirst) {
          high = mid - 1; // Squeeze left to find earlier occurrence
        } else {
          low = mid + 1;  // Squeeze right to find later occurrence
        }
      } else if (nums[mid] < target) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return bound;
  }

  const first = findBound(true);
  if (first === -1) return [-1, -1];
  const last = findBound(false);

  return [first, last];
}

// Example test runs
console.log(searchRange([5, 7, 7, 8, 8, 10], 8)); // [ 3, 4 ]
console.log(searchRange([5, 7, 7, 8, 8, 10], 6)); // [ -1, -1 ]
console.log(searchRange([], 0));                  // [ -1, -1 ]
console.log(searchRange([8, 8, 8, 8, 8], 8));      // [ 0, 4 ]
console.log(searchRange([1], 1));                  // [ 0, 0 ]
```

---

## 8. Tricky Points and Edge Cases

### 1. `low <= high` vs `low < high`
- Use `while (low <= high)` when searching for an **exact target** value where the loop returns inside the body (`if (nums[mid] === target) return mid`).
- Use `while (low < high)` when searching for a **boundary or inflection point** where the window shrinks to a single element (`high = mid` and `low = mid + 1`). When the loop terminates, `low === high`.

### 2. Rotated Array with Duplicates (LeetCode 81)
If elements can be duplicates (e.g., `[1, 0, 1, 1, 1]` or `[1, 1, 1, 0, 1]`):
- `nums[low] === nums[mid] === nums[high]`.
- We cannot determine which half is sorted!
- **Mitigation**: You must increment `low++` and decrement `high--`, degrading the worst-case runtime to $O(n)$.

### 3. Edge Cases Checklist
- Array with 1 element (`[1]`).
- Array with 2 elements (`[2, 1]`).
- Array that is **not rotated** (`[1, 2, 3, 4, 5]`).
- Target is at index 0.
- Target is at index `n - 1`.

---

## 9. Comprehensive Summary

- **Lower Bound**: The first index where `arr[i] >= target`; **Upper Bound**: The first index where `arr[i] > target`.
- **Rotated Array Invariant**: Any rotated sorted array cut at midpoint is guaranteed to have at least one sorted half (`nums[low] <= nums[mid]`).
- **Search in Rotated Array**: Identify the sorted half; test if target fits in that sorted window; discard the opposite half.
- **Find Minimum**: Compare `nums[mid]` against `nums[high]`. If `nums[mid] > nums[high]`, minimum is to the right (`low = mid + 1`); otherwise `high = mid`.
- **V8 Engineering**: Avoid bitwise `>> 1` on large arrays to prevent 32-bit signed overflow; always use `low + Math.floor((high - low) / 2)`.

---

## 10. Cheat Sheet

### Binary Search Decision Matrix

| Problem Type | While Condition | Mid Assignment (Left) | Mid Assignment (Right) | Return Value |
| :--- | :---: | :---: | :---: | :---: |
| **Exact Match** | `low <= high` | `low = mid + 1` | `high = mid - 1` | `mid` or `-1` |
| **Lower Bound** | `low <= high` | `low = mid + 1` | `high = mid - 1` | `ans` |
| **Find Minimum (Rotated)**| `low < high` | `low = mid + 1` | `high = mid` | `nums[low]` |
| **Find Peak Element** | `low < high` | `low = mid + 1` | `high = mid` | `low` |

### Common Pitfalls List
- **Fractional Index Bug**: Omitting `Math.floor()`, producing `nums[2.5] === undefined`.
- **Skipping Minimum**: Using `high = mid - 1` instead of `high = mid` in `findMin`.
- **Missing In-Range Check**: Forgetting `nums[low] <= target && target < nums[mid]` before discarding halves.
- **32-Bit Overflow**: Using `(low + high) >> 1` on arrays with length $> 2^{30}$.

---

## 11. Interview Q&A

### 45-Second Technical Pitch
> *"Binary Search on rotated arrays and boundary ranges adapts classical logarithmic search to non-monotonic or duplicated datasets. In a rotated sorted array, the key invariant is that any midpoint splits the collection into at least one guaranteed sorted half. By checking if the target lies within the boundaries of that sorted half, we safely discard the other half, preserving O(log n) runtime. For boundary lookups like lower bound or search range, we don't terminate upon finding a match; instead, we record the candidate and squeeze the search window to find the earliest or latest occurrence."*

### 1. In `findMin(nums)` on a rotated sorted array, why do we compare `nums[mid]` against `nums[high]` instead of `nums[low]`?
**Answer:**
Comparing against `nums[low]` is ambiguous:
Consider two arrays where `nums[low] < nums[mid]`:
1. `[4, 5, 6, 7, 0, 1, 2]`: `low = 0` (4), `mid = 3` (7). `nums[low] < nums[mid]`. Minimum is to the **right** (at 0).
2. `[1, 2, 3, 4, 5]`: `low = 0` (1), `mid = 2` (3). `nums[low] < nums[mid]`. Minimum is to the **left** (at 1)!
Comparing against `nums[low]` cannot differentiate between an unrotated array and a rotated array.
Comparing against `nums[high]` is 100% deterministic:
- If `nums[mid] > nums[high]`, `mid` is strictly above the pivot cliff, and the minimum must lie to the right (`low = mid + 1`).
- If `nums[mid] <= nums[high]`, `mid` is at or below the cliff, and the minimum is at `mid` or to the left (`high = mid`).

### 2. What will the following code output in Node.js, and why?
```javascript
const arr = [1, 2, 3, 4];
const low = 0, high = 1;
const mid = (low + high) / 2;
console.log(arr[mid]);
```
**Answer:**
It outputs `undefined`.
In JavaScript, all numbers are 64-bit floating-point numbers. `(0 + 1) / 2` evaluates to `0.5`.
Array indexing coerces non-integers to string property names (`arr["0.5"]`), which does not exist on the array, returning `undefined`.
You must always use `Math.floor()` to truncate fractions to valid integer indices.

### 3. Spot and fix the bug in this lower bound search:
```javascript
function findFirstOccurrence(nums, target) {
  let low = 0, high = nums.length - 1;
  while (low <= high) {
    let mid = Math.floor((low + high) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}
```
**Answer:**
The bug is `if (nums[mid] === target) return mid;`.
If the array contains duplicate targets (e.g., `nums = [2, 2, 2, 2]`, `target = 2`), this returns index `1` (the midpoint of the first iteration), rather than the **first occurrence** at index `0`.
**Fix**: When `nums[mid] === target`, record `ans = mid` and continue searching left with `high = mid - 1`.

### 4. Why does allowing duplicate elements in a rotated sorted array degrade binary search from $O(\log n)$ to $O(n)$ worst-case?
**Answer:**
Consider `nums = [1, 0, 1, 1, 1]` and `nums = [1, 1, 1, 0, 1]`, both rotated versions of `[0, 1, 1, 1, 1]`.
In both cases:
`nums[low] === 1`, `nums[mid] === 1`, `nums[high] === 1`.
Because `nums[low] === nums[mid] === nums[high]`, it is mathematically impossible to determine whether the inflection point (and target 0) lies in the left half or the right half without inspecting elements linearly.
The algorithm is forced to decrement `high--` and increment `low++`, turning the search into an $O(n)$ linear scan in the worst case.

---

## 12. Practice Problems

### 1. Search in Rotated Sorted Array - Medium
Search for target in a rotated sorted array of unique integers in $O(\log n)$ time.
- **Sample Input 1:** `nums = [4, 5, 6, 7, 0, 1, 2]`, `target = 0`
- **Expected Output 1:** `4`
- **Sample Input 2:** `nums = [4, 5, 6, 7, 0, 1, 2]`, `target = 3`
- **Expected Output 2:** `-1`

### 2. Find Minimum in Rotated Sorted Array - Medium
Find minimum element in rotated sorted array of unique integers in $O(\log n)$ time.
- **Sample Input 1:** `nums = [3, 4, 5, 1, 2]`
- **Expected Output 1:** `1`
- **Sample Input 2:** `nums = [4, 5, 6, 7, 0, 1, 2]`
- **Expected Output 2:** `0`

### 3. Find First and Last Position of Element in Sorted Array - Medium
Find starting and ending position of target value in sorted array with duplicates.
- **Sample Input 1:** `nums = [5, 7, 7, 8, 8, 10]`, `target = 8`
- **Expected Output 1:** `[3, 4]`
- **Sample Input 2:** `nums = [5, 7, 7, 8, 8, 10]`, `target = 6`
- **Expected Output 2:** `[-1, -1]`

### 4. Peak Index in a Mountain Array - Medium
Find the peak index where `arr[0] < arr[1] < ... < arr[i] > arr[i+1] > ... > arr[n-1]`.
- **Sample Input 1:** `arr = [0, 1, 0]`
- **Expected Output 1:** `1`
- **Sample Input 2:** `arr = [0, 2, 1, 0]`
- **Expected Output 2:** `1`
- **Sample Input 3:** `arr = [0, 10, 5, 2]`
- **Expected Output 3:** `1`

---

<nav aria-label="Lecture navigation">

[Previous: Queues, Circular Buffers & Design](day-15-queues-circular-buffers-and-design.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search on Solution Space](day-17-binary-search-on-solution-space.md)

</nav>
