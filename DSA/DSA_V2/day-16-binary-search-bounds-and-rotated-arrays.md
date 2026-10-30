# Day 16: Binary Search Bounds & Rotated Arrays

<nav aria-label="Lecture navigation">

[Previous: Queues, Circular Buffers & Design](day-15-queues-circular-buffers-and-design.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search on Solution Space](day-17-binary-search-on-solution-space.md)

</nav>

---

## 1. Binary Search Bounds & Rotations Foundation

Classic binary search locates an exact target value within a monotonically sorted collection by repeatedly halving the search space. In production systems and technical problem solving, data rarely stays in simple sorted form. Collections frequently contain duplicate values requiring **boundary thresholding** (isolating the first or last occurrence of a value), or they have been **rotated** around an unknown pivot point during caching or circular buffering.

A **Rotated Sorted Array** is an array originally sorted in ascending order that has had a contiguous suffix sliced from the end and prepended to the front. For example, rotating `[0, 1, 2, 4, 5, 6, 7]` at pivot index `4` yields `[4, 5, 6, 7, 0, 1, 2]`. 

Imagine cutting a standard deck of cards sorted from Ace (1) to King (13) and placing the bottom half on top:
- The deck is no longer monotonically sorted from top to bottom.
- However, wherever you cut the remaining deck in half, **at least one of the two halves is guaranteed to be completely sorted**!
- If you check whether your target card lies within the sorted half's lower and upper bounds, you know immediately whether to search that half or discard it.

```text
ROTATED ARRAY STRUCTURE:
Original:  [ 0, 1, 2, 4, 5, 6, 7 ]
Rotated:   [ 4, 5, 6, 7 | 0, 1, 2 ]
             ▲        ▲   ▲     ▲
             └─Zone A─┘   └Zone B┘
          (Ascending)   (Ascending)
          Zone A is strictly greater than Zone B!
```

Baseline implementation of lower bound and upper bound in JavaScript:

```javascript
// Lower bound: First index where arr[i] >= target
function lowerBound(arr, target) {
  let low = 0;
  let high = arr.length - 1;
  let ans = arr.length; // Default if all elements < target

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (arr[mid] >= target) {
      ans = mid;      // Candidate found
      high = mid - 1; // Squeeze search space left to check for earlier matches
    } else {
      low = mid + 1;  // Target must be to the right
    }
  }

  return ans;
}

// Upper bound: First index where arr[i] > target
function upperBound(arr, target) {
  let low = 0;
  let high = arr.length - 1;
  let ans = arr.length;

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (arr[mid] > target) {
      ans = mid;
      high = mid - 1; // Squeeze left for earlier strictly greater element
    } else {
      low = mid + 1;
    }
  }

  return ans;
}

const sample = [1, 2, 2, 2, 3, 5];
console.log(lowerBound(sample, 2)); // 1 (First 2 is at index 1)
console.log(upperBound(sample, 2)); // 4 (First element > 2 is 3 at index 4)
```

### 1.1 The One-Sorted-Half Invariant

In any rotated sorted array containing distinct elements, any chosen midpoint `mid` partitions the array into two segments where **at least one half is strictly ascending**:

- If `nums[low] <= nums[mid]`, the **left half** (`nums[low ... mid]`) is sorted.
- Otherwise (`nums[low] > nums[mid]`), the **right half** (`nums[mid ... high]`) is sorted.

```text
EVALUATION LOGIC:
1. Is Left Half Sorted? (nums[low] <= nums[mid])
   - If YES: Does target lie inside [ nums[low] ... nums[mid] ]?
     - If YES: high = mid - 1 (search left half)
     - If NO:  low = mid + 1  (search right half)
2. Otherwise, Right Half MUST be Sorted! (nums[mid] <= nums[high])
   - Does target lie inside [ nums[mid] ... nums[high] ]?
     - If YES: low = mid + 1  (search right half)
     - If NO:  high = mid - 1 (search left half)
```

> [!NOTE]
> Self-Check: Why does a single rotation guarantee that at least one half is sorted?
> Answer: A single rotation introduces exactly one point of disorder (the cliff where values drop from high to low). Dividing an array in half can trap that single cliff in at most one half. The other half remains completely sorted.

### 1.2 Mathematical Midpoint Calculation in JavaScript

In JavaScript, all standard numbers are IEEE-754 double-precision 64-bit floats. Naively computing `(low + high) / 2` introduces two critical hazards:

1. **Fractional Indices**: `(0 + 1) / 2` yields `0.5`. An index read `nums[0.5]` coerces the float to a string property key (`nums["0.5"]`), returning `undefined` and breaking loop invariants silently.
2. **Bitwise 32-Bit Overflow**: Using bitwise right shifts `(low + high) >> 1` forces operands into signed 32-bit integers. If `low + high` exceeds $2^{31} - 1$, the sum wraps around to a negative integer, causing out-of-bounds errors.

The robust, standard calculation across all JavaScript engines is:

$$\text{mid} = \text{low} + \left\lfloor \frac{\text{high} - \text{low}}{2} \right\rfloor$$

```javascript
// ✅ CORRECT: Safe midpoint calculation in JavaScript
const mid = low + Math.floor((high - low) / 2);
```

### 1.3 Bounds & Search Invariants Reference Table

| Search Type | While Condition | Mid Assignment (Left Branch) | Mid Assignment (Right Branch) | Termination State |
| :--- | :---: | :---: | :---: | :--- |
| **Exact Match** | `low <= high` | `low = mid + 1` | `high = mid - 1` | Returns `mid` on hit, or `-1` |
| **Lower Bound** | `low <= high` | `low = mid + 1` | `high = mid - 1` | Returns recorded `ans` |
| **Upper Bound** | `low <= high` | `low = mid + 1` | `high = mid - 1` | Returns recorded `ans` |
| **Find Minimum (Rotated)** | `low < high` | `low = mid + 1` | `high = mid` | `low === high` (Minimum index) |
| **Find Peak Element** | `low < high` | `low = mid + 1` | `high = mid` | `low === high` (Peak index) |

---

## 2. Rotated Search Patterns

### 2.1 Pattern Family

Boundary and rotated binary search patterns divide into four primary families:

- **Sorted Half Discarding**: Checking whether the target lies inside the boundaries of the sorted half to eliminate $50\%$ of candidates per step.
- **Cliff / Inflection Point Detection**: Comparing `nums[mid]` against `nums[high]` to detect whether the minimum element lies to the left or right of the cliff.
- **Slope Incline Traversal**: Comparing `nums[mid]` against `nums[mid + 1]` to climb towards local peaks in unsorted mountain collections.
- **Boundary Shrinking (Lower/Upper Bound)**: Squeezing search windows after finding a candidate to identify first or last occurrences.

### 2.2 Pattern Recognition Table

| Problem Trigger / Keywords | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| "Search in rotated sorted array" | Locate target in shifted distinct array | Identify sorted half, test boundary containment |
| "Find minimum in rotated sorted array" | Find global minimum / inflection point | Compare `nums[mid]` against `nums[high]` |
| "First and last position in sorted array" | Find start and end range of duplicate value | Dual binary search: `lowerBound` and `upperBound - 1` |
| "Find peak element in array" | Find index $i$ where $nums[i] > nums[i \pm 1]$ | Slope test: `nums[mid] < nums[mid + 1]` |
| "Rotation count of sorted array" | Number of times array was shifted right | Index of global minimum element |

### 2.3 When to Use vs When NOT to Use

- **When to Use**:
  - The array is sorted, or consists of two sorted subarrays resulting from rotation.
  - The problem requires $O(\log n)$ runtime on arrays with up to $10^9$ elements.
  - Searching for boundary thresholds (first or last element satisfying a condition).
  - Finding local peaks in mountain arrays without inspecting all items.

- **When NOT to Use**:
  - The array is completely unsorted with no monotonic slope properties (use a linear scan or hash map).
  - Rotated arrays containing extensive duplicate values where `nums[low] === nums[mid] === nums[high]` (degrades to $O(n)$ linear scan).
  - The collection is a linked list (cannot access midpoint in $O(1)$ time).

### 2.4 The $10^7$ Operations Rule

A linear scan inspecting $n = 10^7$ elements takes $\approx 100\text{ms}$ in Node.js. 

Binary search cuts the candidate space in half on every step ($n \to n/2 \to n/4 \to \dots \to 1$), completing in $\lceil \log_2 n \rceil$ iterations. Even for $n = 10^9$ (one billion items), binary search executes at most **30 comparisons** ($\ll 10^7$ budget), finishing in under $0.005$ milliseconds.

---

## 3. Problem Walkthroughs

### 3.1 Search in Rotated Sorted Array

#### 3.1.1 Problem Statement
Given an integer array `nums` sorted in ascending order (with **distinct** values) that has been rotated at an unknown pivot index, and an integer `target`, return the index of `target` if it is in `nums`, or `-1` if it is not in `nums`.

You must write an algorithm with **$O(\log n)$ runtime complexity**.

```text
Input: nums = [4, 5, 6, 7, 0, 1, 2], target = 0  ──> Output: 4
Input: nums = [4, 5, 6, 7, 0, 1, 2], target = 3  ──> Output: -1
Input: nums = [1], target = 0                    ──> Output: -1
```

#### 3.1.2 How to Think About It
Imagine a thick telephone directory cut in half and restacked: `[4, 5, 6, 7, 0, 1, 2]`. You want to find name `0`.

Place your left finger at index 0 (`4`) and your right finger at index 6 (`2`).
1. Inspect the middle page: `mid = 3` (value `7`).
2. Ask: "Is the left half normally sorted?"
   `4 <= 7` is True. Yes, the left half `[4, 5, 6, 7]` is in standard alphabetical order.
3. Now ask: "Does our target `0` fall between `4` and `7`?"
   `4 <= 0 < 7` is False! Target `0` cannot possibly exist in the left half.
4. Safely tear away the left half. Move your left finger past the middle: `low = mid + 1 = 4`.
5. Remaining window is `[0, 1, 2]`. Inspect middle: `mid = 5` (value `1`).
6. Left half `[0, 1]` is sorted. Target `0` falls in range `[0, 1]`. Squeeze right finger: `high = mid - 1 = 4`.
7. `low = 4, high = 4, mid = 4`. `nums[4] === 0`. Found at index 4!

```text
Trace: [ 4, 5, 6, 7, 0, 1, 2 ], target = 0
low = 0 (4), high = 6 (2), mid = 3 (7)
Left half [4..7] is sorted. 0 is NOT in [4..7] -> low = mid + 1 = 4

low = 4 (0), high = 6 (2), mid = 5 (1)
Right half [1..2] is sorted. 0 is NOT in [1..2] -> high = mid - 1 = 4

low = 4 (0), high = 4 (0), mid = 4 (0)
nums[4] === 0 -> Return 4!
```

#### 3.1.3 Brute Force Approach & Bottleneck
A brute-force scan checks each index sequentially:

```javascript
function searchBrute(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === target) return i;
  }
  return -1;
}
```

The bottleneck is $O(n)$ linear work. It inspects every element, ignoring the pre-existing sorted order of the two rotated segments and violating the logarithmic performance constraint.

#### 3.1.4 The Pattern Insight
At every step, determine which half of the array is sorted. 
- If the left half is sorted (`nums[low] <= nums[mid]`), check if the target is within `nums[low] <= target && target < nums[mid]`. If so, search left (`high = mid - 1`); otherwise search right (`low = mid + 1`).
- If the right half is sorted, check if the target is within `nums[mid] < target && target <= nums[high]`. If so, search right (`low = mid + 1`); otherwise search left (`high = mid - 1`).

#### 3.1.5 Pseudocode
```text
function search(nums, target):
  low = 0, high = length(nums) - 1

  while low <= high:
    mid = low + floor((high - low) / 2)

    if nums[mid] == target:
      return mid

    if nums[low] <= nums[mid]: // Left half sorted
      if nums[low] <= target AND target < nums[mid]:
        high = mid - 1
      else:
        low = mid + 1
    else: // Right half sorted
      if nums[mid] < target AND target <= nums[high]:
        low = mid + 1
      else:
        high = mid - 1

  return -1
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: One-pass binary search with sorted-half validation
function search(nums, target) {
  let low = 0;
  let high = nums.length - 1;

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);

    if (nums[mid] === target) {
      return mid;
    }

    // Check if the left half is sorted
    if (nums[low] <= nums[mid]) {
      // Check if target lies within the boundaries of the sorted left half
      if (nums[low] <= target && target < nums[mid]) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    } 
    // Otherwise, the right half must be sorted
    else {
      // Check if target lies within the boundaries of the sorted right half
      if (nums[mid] < target && target <= nums[high]) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
  }

  return -1;
}

// Example runs
console.log(search([4, 5, 6, 7, 0, 1, 2], 0)); // 4
console.log(search([4, 5, 6, 7, 0, 1, 2], 3)); // -1
console.log(search([1], 0));                   // -1
console.log(search([1, 3], 3));                // 1
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Standard binary search without sorted-half check
function buggyRotatedSearch(nums, target) {
  let low = 0, high = nums.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] === target) return mid;
    // BUG: Assuming monotonicity causes target to be discarded
    if (nums[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}

console.log(buggyRotatedSearch([4, 5, 6, 7, 0, 1, 2], 0)); // -1 (Failed on rotated array!)
```

#### 3.1.8 Complexity Derivation
- **Time Complexity**: $O(\log n)$. The search space is strictly cut in half on each step.
- **Auxiliary Space Complexity**: $O(1)$. Uses three scalar pointer integers.

---

### 3.2 Find Minimum in Rotated Sorted Array

#### 3.2.1 Problem Statement
Given the sorted rotated array `nums` of **unique** elements, return the **minimum element** of this array.

You must write an algorithm that runs in **$O(\log n)$ time**.

```text
Input: nums = [3, 4, 5, 1, 2]          ──> Output: 1
Input: nums = [4, 5, 6, 7, 0, 1, 2]    ──> Output: 0
Input: nums = [11, 13, 15, 17]         ──> Output: 11
```

#### 3.2.2 How to Think About It
Imagine plotting the array values on a graph against their index: `[4, 5, 6, 7, 0, 1, 2]`.
- Zone 1 rises steadily: `4 -> 5 -> 6 -> 7`.
- A vertical cliff drops suddenly: `7 -> 0` (**The Inflection Point**).
- Zone 2 rises steadily again: `0 -> 1 -> 2`.

Notice the relationship with the last element (`nums[high] = 2`):
- All numbers in Zone 1 (`4, 5, 6, 7`) are strictly **greater** than `2`.
- All numbers in Zone 2 (`0, 1, 2`) are **less than or equal to** `2`.
- If `nums[mid] > nums[high]`, `mid` is stranded up on the high cliff (Zone 1). The minimum must lie strictly to the **right** (`low = mid + 1`).
- If `nums[mid] <= nums[high]`, `mid` is in Zone 2. The minimum could be `mid` itself or to its **left** (`high = mid`).

```text
Graph Visualization:
7         *
6       *
5     *
4   *
3
2               *
1             *
0           * ◄── Inflection point (minimum)!
```

#### 3.2.3 Brute Force Approach & Bottleneck
A brute-force scan tracks the minimum value across all indices:

```javascript
function findMinBrute(nums) {
  let min = nums[0];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] < min) min = nums[i];
  }
  return min;
}
```

The bottleneck is $O(n)$ scanning time. It inspects all $n$ items, failing to exploit the cliff property that allows eliminating half the elements on each step.

#### 3.2.4 The Pattern Insight
Compare `nums[mid]` against `nums[high]`:
- If `nums[mid] > nums[high]`: `mid` belongs to the left elevated segment. The inflection point is strictly to the right $\to$ `low = mid + 1`.
- If `nums[mid] <= nums[high]`: `mid` belongs to the right descending segment. `mid` itself could be the minimum $\to$ `high = mid`.
- When `low === high`, the window has converged on the exact minimum element.

#### 3.2.5 Pseudocode
```text
function findMin(nums):
  low = 0
  high = length(nums) - 1

  while low < high:
    mid = low + floor((high - low) / 2)

    if nums[mid] > nums[high]:
      low = mid + 1
    else:
      high = mid

  return nums[low]
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Binary search comparing against upper bound
function findMin(nums) {
  let low = 0;
  let high = nums.length - 1;

  // Invariant: The minimum element is guaranteed to lie within nums[low ... high]
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);

    if (nums[mid] > nums[high]) {
      // mid is in the upper rotated segment; minimum MUST be to the right of mid
      low = mid + 1;
    } else {
      // mid is in the lower segment; mid itself could be the minimum
      high = mid; // Note: NOT mid - 1, because mid could be the answer
    }
  }

  // Loop terminates when low === high
  return nums[low];
}

// Example runs
console.log(findMin([3, 4, 5, 1, 2]));       // 1
console.log(findMin([4, 5, 6, 7, 0, 1, 2])); // 0
console.log(findMin([11, 13, 15, 17]));      // 11
console.log(findMin([2, 1]));                // 1
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Using high = mid - 1 skips the minimum element when mid is the answer
function buggyFindMin(nums) {
  let low = 0, high = nums.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] > nums[high]) low = mid + 1;
    else high = mid - 1; // BUG! If mid was the minimum, it gets discarded!
  }
  return nums[low];
}

console.log(buggyFindMin([3, 1, 2])); // 3 (Skipped 1 because high was set to mid - 1!)
```

#### 3.2.8 Complexity Derivation
- **Time Complexity**: $O(\log n)$. Each step halves the remaining distance between `low` and `high`.
- **Auxiliary Space Complexity**: $O(1)$. Uses only integer pointers.

---

### 3.3 Find First and Last Position of Element in Sorted Array

#### 3.3.1 Problem Statement
Given an array of integers `nums` sorted in non-decreasing order, find the starting and ending position of a given `target` value.

If `target` is not found in the array, return `[-1, -1]`.

You must write an algorithm with **$O(\log n)$ runtime complexity**.

```text
Input: nums = [5, 7, 7, 8, 8, 10], target = 8  ──> Output: [3, 4]
Input: nums = [5, 7, 7, 8, 8, 10], target = 6  ──> Output: [-1, -1]
Input: nums = [], target = 0                  ──> Output: [-1, -1]
```

#### 3.3.2 How to Think About It
Imagine a shelf of books where multiple copies of the exact same title sit next to each other: `[5, 7, 7, 8, 8, 10]`. You want to find where the copies of Book `8` start and where they end.

Do not stop when you find any copy of Book 8.
- To find the **first copy (left bound)**: When you find Book 8 at index 3, mark `bound = 3`, then search the shelf strictly to the left (`high = mid - 1`) to see if an earlier copy exists.
- To find the **last copy (right bound)**: When you find Book 8, mark `bound = mid`, then search strictly to the right (`low = mid + 1`) to see if another copy sits further along the shelf.

```text
Finding First Occurrence of 8 in [5, 7, 7, 8, 8, 10]:
mid = 2 (7) < 8 -> low = mid + 1 = 3
mid = 4 (8) == 8 -> Record bound = 4, high = mid - 1 = 3
mid = 3 (8) == 8 -> Record bound = 3, high = mid - 1 = 2
low > high -> First occurrence is 3!
```

#### 3.3.3 Brute Force Approach & Bottleneck
Finding the first index with `nums.indexOf(target)` and expanding linearly to find the end:

```javascript
function searchRangeBrute(nums, target) {
  const start = nums.indexOf(target);
  if (start === -1) return [-1, -1];
  let end = start;
  while (end < nums.length && nums[end] === target) end++;
  return [start, end - 1];
}
```

The bottleneck is linear expansion. In worst-case inputs where the entire array contains identical target values (`[8, 8, 8, ..., 8]`), the `while` loop scans all $n$ items, degrading runtime to $O(n)$.

#### 3.3.4 The Pattern Insight
Execute two independent binary searches:
1. `findBound(isFirst = true)`: When `nums[mid] === target`, save `bound = mid` and move `high = mid - 1`.
2. `findBound(isFirst = false)`: When `nums[mid] === target`, save `bound = mid` and move `low = mid + 1`.

Both searches operate in $O(\log n)$ time, ensuring the entire procedure completes in $2 \times O(\log n) = O(\log n)$ time.

#### 3.3.5 Pseudocode
```text
function searchRange(nums, target):
  function findBound(isFirst):
    low = 0, high = length(nums) - 1, bound = -1

    while low <= high:
      mid = low + floor((high - low) / 2)

      if nums[mid] == target:
        bound = mid
        if isFirst:
          high = mid - 1
        else:
          low = mid + 1
      else if nums[mid] < target:
        low = mid + 1
      else:
        high = mid - 1

    return bound

  first = findBound(true)
  if first == -1: return [-1, -1]
  last = findBound(false)

  return [first, last]
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Two-pass binary search for lower and upper boundaries
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
          high = mid - 1; // Squeeze left to find earlier occurrences
        } else {
          low = mid + 1;  // Squeeze right to find later occurrences
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
  if (first === -1) {
    return [-1, -1];
  }
  const last = findBound(false);

  return [first, last];
}

// Example runs
console.log(searchRange([5, 7, 7, 8, 8, 10], 8)); // [ 3, 4 ]
console.log(searchRange([5, 7, 7, 8, 8, 10], 6)); // [ -1, -1 ]
console.log(searchRange([], 0));                  // [ -1, -1 ]
console.log(searchRange([8, 8, 8, 8, 8], 8));      // [ 0, 4 ]
console.log(searchRange([1], 1));                  // [ 0, 0 ]
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Returning immediately on first match
function buggySearchRange(nums, target) {
  let low = 0, high = nums.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    // BUG: Returning mid on match misses first/last boundary when duplicates exist
    if (nums[mid] === target) return [mid, mid];
    if (nums[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return [-1, -1];
}

console.log(buggySearchRange([5, 7, 7, 8, 8, 10], 8)); // [4, 4] instead of [3, 4]!
```

#### 3.3.8 Complexity Derivation
- **Time Complexity**: $O(\log n)$. Two binary search passes run in $O(\log n) + O(\log n) = O(\log n)$ time.
- **Auxiliary Space Complexity**: $O(1)$. Uses scalar integer pointers.

---

## 4. Tricky Edge Cases

- **Duplicate Elements in Rotated Arrays (LC 81)**: If duplicate elements exist (`[1, 0, 1, 1, 1]` or `[1, 1, 1, 0, 1]`), `nums[low] === nums[mid] === nums[high]`. It is impossible to determine which half is sorted. You must increment `low++` and decrement `high--`, which degrades worst-case runtime to $O(n)$.
- **Strict Inequality in Bounds Comparison**: In `searchInRotatedArray`, use `nums[low] <= target && target < nums[mid]` (strict `<` at `mid`, non-strict `<=` at `low`) because the case `nums[mid] === target` was already handled.
- **`low <= high` vs `low < high`**: Use `while (low <= high)` when searching for an exact target with returns inside the loop. Use `while (low < high)` when searching for an inflection or minimum point where the window contracts to a single answer (`high = mid` and `low = mid + 1`).
- **Unrotated Arrays**: When the array was rotated $0$ times (e.g. `[11, 13, 15, 17]`), `nums[mid] < nums[high]` holds true on every step, contracting `high = mid` until returning index 0 (`11`).
- **Single-Element and Two-Element Arrays**: Test boundaries where $n = 1$ (`[1]`) or $n = 2$ (`[2, 1]`) to ensure pointer calculations do not produce negative or out-of-bounds indices.

---

## 5. Summary Cheat Sheet

- **Rotated Array Invariant**: Any rotated sorted array cut at midpoint is guaranteed to have at least one sorted half (`nums[low] <= nums[mid]`).
- **Sorted Half Discarding**: Test if the target falls within the sorted half's range. If so, search that half; otherwise, discard it.
- **Find Minimum Cliff**: Compare `nums[mid]` against `nums[high]`. If `nums[mid] > nums[high]`, minimum lies right (`low = mid + 1`); otherwise `high = mid`.
- **Lower Bound / Upper Bound**: Never terminate immediately on target match when finding ranges. Save candidate index and squeeze search space left or right.
- **Safe JavaScript Midpoint**: Always use `low + Math.floor((high - low) / 2)` to prevent float decimals and 32-bit signed integer overflow.

---

## 6. Practice Problems

### 6.1 Find Peak Element
A peak element is an element that is strictly greater than its neighbors. Given a 0-indexed integer array `nums`, find a peak element, and return its index. If the array contains multiple peaks, return the index to any of the peaks.

You must write an algorithm that runs in $O(\log n)$ time.

```text
Sample Input 1: nums = [1, 2, 3, 1]
Expected Output 1: 2 (value 3 is a peak)

Sample Input 2: nums = [1, 2, 1, 3, 5, 6, 4]
Expected Output 2: 5 (value 6 is a peak)
```

- *Hint 1*: Compare `nums[mid]` with its right neighbor `nums[mid + 1]`.
- *Hint 2*: If `nums[mid] < nums[mid + 1]`, you are climbing an upward slope; a peak is guaranteed to exist to the right (`low = mid + 1`).
- *Hint 3*: Otherwise, you are on a downward slope; a peak exists at `mid` or to the left (`high = mid`).

### 6.2 Search in Rotated Sorted Array II
Given the array `nums` after rotation that may contain **duplicate** values, and an integer `target`, return `true` if `target` is in `nums`, or `false` if it is not in `nums`.

```text
Sample Input 1: nums = [2, 5, 6, 0, 0, 1, 2], target = 0
Expected Output 1: true

Sample Input 2: nums = [2, 5, 6, 0, 0, 1, 2], target = 3
Expected Output 2: false
```

- *Hint 1*: When `nums[low] === nums[mid] && nums[mid] === nums[high]`, you cannot tell which side is sorted.
- *Hint 2*: In that specific duplicate condition, simply shrink both boundaries: `low++` and `high--`.
- *Hint 3*: For all other conditions, apply the standard rotated sorted array logic from Day 16.

### 6.3 Peak Index in a Mountain Array
An array `arr` is a mountain if `arr[0] < arr[1] < ... < arr[i - 1] < arr[i] > arr[i + 1] > ... > arr[arr.length - 1]`. Return the index of the mountain peak in $O(\log n)$ time.

```text
Sample Input 1: arr = [0, 1, 0]
Expected Output 1: 1

Sample Input 2: arr = [0, 2, 1, 0]
Expected Output 2: 1

Sample Input 3: arr = [0, 10, 5, 2]
Expected Output 3: 1
```

- *Hint 1*: The mountain peak is the unique point where values transition from strictly increasing to strictly decreasing.
- *Hint 2*: Use `while (low < high)`.
- *Hint 3*: Compare `arr[mid]` and `arr[mid + 1]`. Update `low = mid + 1` if slope is increasing; update `high = mid` if slope is decreasing.

---

<nav aria-label="Lecture navigation">

[Previous: Queues, Circular Buffers & Design](day-15-queues-circular-buffers-and-design.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search on Solution Space](day-17-binary-search-on-solution-space.md)

</nav>
