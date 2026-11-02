# Day 16: Binary Search Bounds & Rotated Arrays

<nav aria-label="Lecture navigation">

[Previous: Queues, Circular Buffers & Design](day-15-queues-circular-buffers-and-design.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search on Solution Space](day-17-binary-search-on-solution-space.md)

</nav>

---

## 1. Binary Search Bounds & Rotations Foundation

Standard binary search finds a target number in a sorted array by cutting the search space in half each time. But in real-world problems, data is not always in clean sorted order. You might have duplicate numbers where you need to find the **first or last copy**, or the array might have been **rotated** around an unknown pivot point.

A **Rotated Sorted Array** is an array that was originally sorted in ascending order, but then had a section sliced from the end and pasted onto the front. For example, rotating `[0, 1, 2, 4, 5, 6, 7]` gives `[4, 5, 6, 7, 0, 1, 2]`.

To picture this physically, imagine cutting a sorted deck of cards and putting the bottom half on top:
* The deck is no longer sorted from top to bottom.
* But wherever you cut the remaining deck in half, **at least one of the two halves is guaranteed to be completely sorted**!
* If you check whether your card fits between the smallest and largest card of that sorted half, you know immediately whether your card is in that half or the other half.

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

---

### 1.1 The One-Sorted-Half Invariant

In any rotated sorted array with unique numbers, picking any middle index `mid` divides the array into two pieces where **at least one half is strictly ascending**:

* If `nums[low] <= nums[mid]`, the **left half** (`nums[low ... mid]`) is sorted.
* Otherwise (`nums[low] > nums[mid]`), the **right half** (`nums[mid ... high]`) is sorted.

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
> **Self-Check:** Why does a single rotation guarantee that at least one half is sorted?  
> *Answer:* Rotating an array once creates only one single "drop" or cliff where numbers go from big to small. When you cut the array in half, that single drop can only land in one half. The other half has no drops, so it must be completely sorted.

---

### 1.2 Binary Search Bounds Summary

| Pattern | Condition on Match | Search Space Update | Finds | Example Result on `[1, 2, 2, 2, 3]` with Target `2` |
| :--- | :--- | :--- | :--- | :---: |
| **Exact Search** | `arr[mid] === target` | Return `mid` immediately | Any matching index | Index `2` (middle match) |
| **Lower Bound** | `arr[mid] >= target` | `ans = mid; high = mid - 1` | First index $\ge target$ | Index `1` (first `2`) |
| **Upper Bound** | `arr[mid] > target` | `ans = mid; high = mid - 1` | First index $> target$ | Index `4` (value `3`) |
| **Rotated Search** | Check sorted half | Discard unsorted half | Target in rotated list | Index where `target` sits |

---

## 2. Pattern Overview

### 2.1 Pattern Family
* **Boundary Thresholding:** Lower and Upper bounds to find starting or ending points of duplicate values.
* **Rotated Array Search:** Finding targets in rotated sorted lists by searching the sorted half.
* **Inflection Point / Minimum Discovery:** Finding the smallest number or pivot point where the array drops.
* **Peak Finding:** Using slope comparisons (`nums[mid] < nums[mid + 1]`) to find local maximums.

### 2.2 Pattern Recognition Table

| Problem Keyword | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| **"Search in rotated sorted array"** | Find target in rotated list in $O(\log n)$. | One-sorted-half binary search. |
| **"Find minimum in rotated sorted array"** | Find the smallest number or pivot point. | Compare `nums[mid]` against `nums[high]`. |
| **"First and last position of element"** | Find range `[start, end]` of duplicates. | Two binary searches: Lower bound + Upper bound. |
| **"Find peak element"** | Find any local peak where $nums[i] > neighbors$. | Slope test: `nums[mid] < nums[mid + 1]`. |
| **"Rotation count of sorted array"** | How many times the array was shifted. | Find index of the smallest number. |

### 2.3 When to Use vs When NOT to Use
* **When to Use**:
  * The array is sorted, or consists of two sorted pieces from a rotation.
  * You need $O(\log n)$ fast performance on huge arrays.
  * Looking for first or last occurrences of a number.
  * Finding peaks in mountain-shaped data.
* **When NOT to Use**:
  * The array is completely unsorted (use a linear scan or a hash map).
  * The rotated array has lots of duplicate values where `nums[low] === nums[mid] === nums[high]` (this degrades to an $O(n)$ scan).
  * The data is in a linked list (you cannot jump to the middle in $O(1)$ time).

### 2.4 The $10^7$ Operations Rule
* Checking $10,000,000$ numbers one by one takes $\approx 100\text{ms}$ in Node.js.
* Binary search cuts the search space in half on every step ($n \to n/2 \to n/4 \to \dots \to 1$). Even for $n = 1,000,000,000$ (one billion numbers), binary search takes at most **30 comparisons**, finishing in under 0.005 milliseconds.

---

## 3. Problem Walkthroughs

---

### 3.1 Search in Rotated Sorted Array

#### 3.1.1 Problem Statement
Given an integer array `nums` sorted in ascending order (with **distinct** values) that has been rotated at an unknown pivot index, and an integer `target`, return the index of `target` if it is in `nums`, or `-1` if it is not in `nums`.

You must write an algorithm with **$O(\log n)$ runtime complexity**.

* **Sample Input 1:** `nums = [4, 5, 6, 7, 0, 1, 2]`, `target = 0` $\to$ **Expected Output:** `4`
* **Sample Input 2:** `nums = [4, 5, 6, 7, 0, 1, 2]`, `target = 3` $\to$ **Expected Output:** `-1`
* **Sample Input 3:** `nums = [1]`, `target = 0` $\to$ **Expected Output:** `-1`
* **Constraints:** $1 \le nums.length \le 5000$, $-10^4 \le nums[i], target \le 10^4$, all values in `nums` are unique.

#### 3.1.2 How to Think About It
Imagine a phone book cut in half and restacked: `[4, 5, 6, 7, 0, 1, 2]`. You want to find name `0`.  
Place your left finger at index 0 (`4`) and your right finger at index 6 (`2`):
1. Check the middle item: `mid = 3` (value `7`).
2. Ask: "Is the left half normally sorted?"  
   `4 <= 7` is True. Yes, `[4, 5, 6, 7]` is sorted normally.
3. Now ask: "Does our target `0` fall between `4` and `7`?"  
   `4 <= 0 < 7` is False! Target `0` cannot be in the left half.
4. Throw away the left half! Move your left finger past the middle: `low = mid + 1 = 4`.
5. The remaining window is `[0, 1, 2]`. Middle item: `mid = 5` (value `1`).
6. Left half `[0, 1]` is sorted. Target `0` falls in range `[0, 1]`. Squeeze right finger: `high = mid - 1 = 4`.
7. `low = 4, high = 4, mid = 4`. Value is `0`. Found at index 4!

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
Checking every item one by one:

```javascript
function searchBrute(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === target) return i;
  }
  return -1;
}
```

* **The Bottleneck:** Takes $O(n)$ time. It checks every item, ignoring the fact that the two segments are already sorted and violating the $O(\log n)$ requirement.

#### 3.1.4 The Pattern Insight
At every step, determine which half is sorted:
* If the left half is sorted (`nums[low] <= nums[mid]`), check if `target` is inside `nums[low] <= target && target < nums[mid]`. If so, search left (`high = mid - 1`); otherwise search right (`low = mid + 1`).
* If the right half is sorted, check if `target` is inside `nums[mid] < target && target <= nums[high]`. If so, search right (`low = mid + 1`); otherwise search left (`high = mid - 1`).

#### 3.1.5 Pseudocode

```text
FUNCTION Search(nums, target):
  low = 0, high = length(nums) - 1

  WHILE low <= high:
    mid = low + floor((high - low) / 2)

    IF nums[mid] == target RETURN mid

    IF nums[low] <= nums[mid]: // Left half sorted
      IF nums[low] <= target AND target < nums[mid]:
        high = mid - 1
      ELSE:
        low = mid + 1
    ELSE: // Right half sorted
      IF nums[mid] < target AND target <= nums[high]:
        low = mid + 1
      ELSE:
        high = mid - 1

  RETURN -1
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
* **Why it fails:** Standard binary search assumes the whole array goes from small to large. On rotated arrays, assuming this discards the side holding the target.

#### 3.1.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(\log n)}$. The search area is halved on each step.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. We only use simple integer pointers.

---

### 3.2 Find Minimum in Rotated Sorted Array

#### 3.2.1 Problem Statement
Given the sorted rotated array `nums` of **unique** elements, return the **minimum element** of this array.

You must write an algorithm that runs in **$O(\log n)$ time**.

* **Sample Input 1:** `nums = [3, 4, 5, 1, 2]` $\to$ **Expected Output:** `1`
* **Sample Input 2:** `nums = [4, 5, 6, 7, 0, 1, 2]` $\to$ **Expected Output:** `0`
* **Sample Input 3:** `nums = [11, 13, 15, 17]` $\to$ **Expected Output:** `11`
* **Constraints:** $n == nums.length$, $1 \le n \le 5000$, $-5000 \le nums[i] \le 5000$, all values in `nums` are unique.

#### 3.2.2 How to Think About It
Imagine graphing the numbers: `[4, 5, 6, 7, 0, 1, 2]`.
* Zone 1 rises steadily: `4 -> 5 -> 6 -> 7`.
* A sharp drop happens: `7 -> 0` (the cliff).
* Zone 2 rises steadily again: `0 -> 1 -> 2`.

Look at the last number (`nums[high] = 2`):
* All numbers in Zone 1 (`4, 5, 6, 7`) are **greater** than `2`.
* All numbers in Zone 2 (`0, 1, 2`) are **less than or equal to** `2`.
* If `nums[mid] > nums[high]`, `mid` is up on Zone 1. The minimum must be to the **right** (`low = mid + 1`).
* If `nums[mid] <= nums[high]`, `mid` is down in Zone 2. The minimum could be `mid` itself or to its **left** (`high = mid`).

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
Scanning for the minimum with a single loop takes $O(n)$ time:

```javascript
function findMinBrute(nums) {
  let min = nums[0];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] < min) min = nums[i];
  }
  return min;
}
```

* **The Bottleneck:** Checks every item one by one, missing the chance to eliminate half the items on each step in $O(\log n)$ time.

#### 3.2.4 The Pattern Insight
Compare `nums[mid]` against `nums[high]`:
* If `nums[mid] > nums[high]`: `mid` is in the higher segment. The minimum is to the right $\to$ `low = mid + 1`.
* If `nums[mid] <= nums[high]`: `mid` is in the lower segment. `mid` itself could be the minimum $\to$ `high = mid`.
* When `low === high`, they have met at the exact minimum element.

#### 3.2.5 Pseudocode

```text
FUNCTION FindMin(nums):
  low = 0
  high = length(nums) - 1

  WHILE low < high:
    mid = low + floor((high - low) / 2)

    IF nums[mid] > nums[high]:
      low = mid + 1
    ELSE:
      high = mid

  RETURN nums[low]
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
* **Why it fails:** Writing `high = mid - 1` discards `mid`. If `mid` was actually the minimum number, you throw away the answer! Use `high = mid`.

#### 3.2.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(\log n)}$. Halves the search space on each step.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. We only use simple integer pointers.

---

### 3.3 Find First and Last Position of Element in Sorted Array

#### 3.3.1 Problem Statement
Given an array of integers `nums` sorted in non-decreasing order, find the starting and ending position of a given `target` value.

If `target` is not found in the array, return `[-1, -1]`.

You must write an algorithm with **$O(\log n)$ runtime complexity**.

* **Sample Input 1:** `nums = [5, 7, 7, 8, 8, 10]`, `target = 8` $\to$ **Expected Output:** `[3, 4]`
* **Sample Input 2:** `nums = [5, 7, 7, 8, 8, 10]`, `target = 6` $\to$ **Expected Output:** `[-1, -1]`
* **Sample Input 3:** `nums = []`, `target = 0` $\to$ **Expected Output:** `[-1, -1]`
* **Constraints:** $0 \le nums.length \le 10^5$, $-10^9 \le nums[i], target \le 10^9$, `nums` is non-decreasing.

#### 3.3.2 How to Think About It
Imagine a shelf of books where multiple copies of the exact same title sit next to each other: `[5, 7, 7, 8, 8, 10]`. You want to find where copies of Book `8` start and where they end.  
Do not stop when you find any copy of Book 8:
* To find the **first copy (left bound)**: When you find Book 8 at index 4, save `bound = 4`, then search strictly to the left (`high = mid - 1`) to see if an earlier copy exists.
* To find the **last copy (right bound)**: When you find Book 8, save `bound = mid`, then search strictly to the right (`low = mid + 1`) to see if another copy sits further along.

```text
Finding First Occurrence of 8 in [5, 7, 7, 8, 8, 10]:
mid = 2 (7) < 8 -> low = mid + 1 = 3
mid = 4 (8) == 8 -> Record bound = 4, high = mid - 1 = 3
mid = 3 (8) == 8 -> Record bound = 3, high = mid - 1 = 2
low > high -> First occurrence is 3!
```

#### 3.3.3 Brute Force Approach & Bottleneck
Finding the first match with `indexOf()` and scanning forward:

```javascript
function searchRangeBrute(nums, target) {
  const start = nums.indexOf(target);
  if (start === -1) return [-1, -1];
  let end = start;
  while (end < nums.length && nums[end] === target) end++;
  return [start, end - 1];
}
```

* **The Bottleneck:** If all elements are equal to `target` (`[8, 8, 8, ..., 8]`), the `while` loop checks all $n$ items, running in $O(n)$ time and failing the $O(\log n)$ requirement.

#### 3.3.4 The Pattern Insight
Run two separate binary searches:
1. `findBound(isFirst = true)`: When `nums[mid] === target`, save `bound = mid` and move `high = mid - 1`.
2. `findBound(isFirst = false)`: When `nums[mid] === target`, save `bound = mid` and move `low = mid + 1`.
Both searches take $O(\log n)$ time, finishing in $O(\log n)$ time total.

#### 3.3.5 Pseudocode

```text
FUNCTION SearchRange(nums, target):
  FUNCTION FindBound(isFirst):
    low = 0, high = length(nums) - 1, bound = -1

    WHILE low <= high:
      mid = low + floor((high - low) / 2)

      IF nums[mid] == target:
        bound = mid
        IF isFirst:
          high = mid - 1
        ELSE:
          low = mid + 1
      ELSE IF nums[mid] < target:
        low = mid + 1
      ELSE:
        high = mid - 1

    RETURN bound

  first = FindBound(true)
  IF first == -1 RETURN [-1, -1]
  last = FindBound(false)

  RETURN [first, last]
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
* **Why it fails:** Stopping on the first match returns whatever copy you bumped into first. When duplicate values exist, you must squeeze left and squeeze right to find the true boundaries.

#### 3.3.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(\log n)}$. Two binary search passes run in $O(\log n) + O(\log n) = O(\log n)$ time.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. We only use simple integer pointers.

---

## 4. Tricky Edge Cases

* **Duplicate Numbers in Rotated Arrays:** If numbers repeat (like `[1, 0, 1, 1, 1]`), `nums[low] === nums[mid] === nums[high]`. You cannot tell which side is sorted. You must step `low++` and `high--`, which degrades worst-case time to $O(n)$.
* **Strict Comparison in Boundaries:** In `searchInRotatedArray`, use `nums[low] <= target && target < nums[mid]` (strict `<` at `mid`) because the case where `nums[mid] === target` was already handled.
* **`low <= high` vs `low < high`:** Use `while (low <= high)` when searching for an exact target with returns inside the loop. Use `while (low < high)` when searching for a minimum or peak point where the window narrows down to one single answer.
* **Unrotated Arrays:** If an array was rotated 0 times (`[11, 13, 15, 17]`), `nums[mid] < nums[high]` is true every time, contracting `high = mid` until returning index 0 (`11`).
* **Arrays of Size 1 or 2:** Always test arrays like `[1]` or `[2, 1]` to make sure pointers do not go out of bounds.

---

## 5. Summary Cheat Sheet

* **Rotated Array Rule:** Any rotated sorted array cut in the middle has at least one sorted half (`nums[low] <= nums[mid]`).
* **Discarding Halves:** Check if the target is inside the sorted half's range. If so, search that half; otherwise discard it.
* **Finding Minimum:** Compare `nums[mid]` against `nums[high]`. If `nums[mid] > nums[high]`, the minimum is to the right (`low = mid + 1`); otherwise `high = mid`.
* **Lower & Upper Bounds:** Never stop on the first match when searching for duplicate ranges. Save the candidate index and keep squeezing left or right.
* **Midpoint Formula:** Always use `low + Math.floor((high - low) / 2)` to avoid decimal rounding errors and 32-bit integer overflow.

---

## 6. Practice Problems

### 6.1 Find Peak Element

A peak element is an element that is strictly greater than its neighbors. Given a 0-indexed integer array `nums`, find a peak element, and return its index. If the array contains multiple peaks, return the index to any of the peaks.

You must write an algorithm that runs in $O(\log n)$ time.

* **Difficulty:** Medium | **Focus:** Slope Direction Binary Search
* **Sample Input 1:** `nums = [1, 2, 3, 1]` $\to$ **Expected Output:** `2` (value 3 is a peak)
* **Sample Input 2:** `nums = [1, 2, 1, 3, 5, 6, 4]` $\to$ **Expected Output:** `5` (value 6 is a peak)
* **Constraints:** $1 \le nums.length \le 1000$, $-2^{31} \le nums[i] \le 2^{31} - 1$, `nums[i] != nums[i + 1]`.
* **Hint 1:** Compare `nums[mid]` with its right neighbor `nums[mid + 1]`.
* **Hint 2:** If `nums[mid] < nums[mid + 1]`, you are climbing uphill; a peak is guaranteed to exist to the right (`low = mid + 1`).
* **Hint 3:** Otherwise, you are on a downhill slope; a peak exists at `mid` or to the left (`high = mid`).

---

### 6.2 Search in Rotated Sorted Array II

Given the array `nums` after rotation that may contain **duplicate** values, and an integer `target`, return `true` if `target` is in `nums`, or `false` if it is not in `nums`.

* **Difficulty:** Medium | **Focus:** Duplicate Ambiguity Elimination
* **Sample Input 1:** `nums = [2, 5, 6, 0, 0, 1, 2]`, `target = 0` $\to$ **Expected Output:** `true`
* **Sample Input 2:** `nums = [2, 5, 6, 0, 0, 1, 2]`, `target = 3` $\to$ **Expected Output:** `false`
* **Constraints:** $1 \le nums.length \le 5000$, $-10^4 \le nums[i], target \le 10^4$.
* **Hint 1:** When `nums[low] === nums[mid] && nums[mid] === nums[high]`, you cannot tell which side is sorted.
* **Hint 2:** In that duplicate case, simply shrink both edges: `low++` and `high--`.
* **Hint 3:** For all other cases, apply the normal rotated sorted array rules from Day 16.

---

### 6.3 Peak Index in a Mountain Array

An array `arr` is a mountain if `arr[0] < arr[1] < ... < arr[i - 1] < arr[i] > arr[i + 1] > ... > arr[arr.length - 1]`. Return the index of the mountain peak in $O(\log n)$ time.

* **Difficulty:** Medium | **Focus:** Mountain Peak Binary Search
* **Sample Input 1:** `arr = [0, 1, 0]` $\to$ **Expected Output:** `1`
* **Sample Input 2:** `arr = [0, 2, 1, 0]` $\to$ **Expected Output:** `1`
* **Sample Input 3:** `arr = [0, 10, 5, 2]` $\to$ **Expected Output:** `1`
* **Constraints:** $3 \le arr.length \le 10^5$, $0 \le arr[i] \le 10^6$.
* **Hint 1:** The peak is the point where numbers switch from going up to going down.
* **Hint 2:** Use `while (low < high)`.
* **Hint 3:** Compare `arr[mid]` and `arr[mid + 1]`. Move `low = mid + 1` if slope is going up; move `high = mid` if slope is going down.

---

<nav aria-label="Lecture navigation">

[Previous: Queues, Circular Buffers & Design](day-15-queues-circular-buffers-and-design.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search on Solution Space](day-17-binary-search-on-solution-space.md)

</nav>
