# Day 07: Two Pointers: Fast & Slow and In-Place Partitioning

<nav aria-label="Lecture navigation">

[Previous: Two Pointers: Opposing & Symmetrical Scans](day-06-two-pointers-opposing-and-symmetrical.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Fixed Sliding Window](day-08-sliding-window-fixed-size.md)

</nav>

---

## 1. Fast & Slow Pointers

**Fast & Slow pointers** start at the beginning of a collection and traverse forward in the **same direction** at different velocities or under different conditional rules.

Instead of creating a new auxiliary array or calling memory-shifting methods like `.splice()` ($O(n^2)$), one pointer reads ahead while the other pointer writes valid data in-place ($O(n)$ time, $O(1)$ space).

To picture this physically, imagine sorting a deck of cards laid out along a conveyor belt:
* **The Scout (`fast`):** Walks quickly ahead, inspecting every card on the belt.
* **The Scribe (`slow`):** Points to the next clean slot on your table.
* When the Scout sees junk (e.g. duplicate cards or zeroes), it skips them.
* When the Scout finds a valid card, it copies that card into the Scribe's slot, and the Scribe steps one slot forward.

```text
Array: [ 0, 1, 0, 3, 12 ], Target: Move Zeroes

fast = 0: Value 0 (Zero)   ──► Skip. slow stays at 0.
fast = 1: Value 1 (Valid)  ──► Swap into slot 0! Array: [ 1, 0, 0, 3, 12 ]. slow becomes 1.
fast = 2: Value 0 (Zero)   ──► Skip. slow stays at 1.
fast = 3: Value 3 (Valid)  ──► Swap into slot 1! Array: [ 1, 3, 0, 0, 12 ]. slow becomes 2.
fast = 4: Value 12 (Valid) ──► Swap into slot 2! Array: [ 1, 3, 12, 0, 0 ]. slow becomes 3.
```

```javascript
// Node.js code
"use strict";

// Baseline fast & slow partitioning
function partitionNonZeroes(arr) {
  let slow = 0;

  for (let fast = 0; fast < arr.length; fast++) {
    if (arr[fast] !== 0) {
      if (slow !== fast) {
        const temp = arr[slow];
        arr[slow] = arr[fast];
        arr[fast] = temp;
      }
      slow++;
    }
  }

  return slow; // Returns count of non-zero elements
}

const numbers = [0, 1, 0, 3, 12];
partitionNonZeroes(numbers);
console.log(numbers); // [ 1, 3, 12, 0, 0 ]
```

### 1.1 Read and Write Pointer Partitioning

In in-place array compaction, both pointers advance forward with distinct responsibilities:
* **The Read Pointer (`fast`):** Scans every element from index `0` to `n - 1`.
* **The Write Pointer (`slow`):** Marks the boundary of confirmed, valid items. It only advances when `fast` encounters an item that meets the retention criteria.

```text
[  Valid Kept Items  |  Discarded Items  |  Uninspected Items  ]
 0                slow - 1             fast - 1              n - 1
```

> [!NOTE]
> **Self-Check:** What is the fundamental performance difference between calling `arr.splice(i, 1)` and using a `slow` write pointer?  
> *Answer:* `splice()` physically shifts all remaining elements in RAM on every call ($O(n)$ work per deletion, leading to $O(n^2)$ total time). A `slow` pointer simply overwrites the memory slot at `arr[slow]` in $O(1)$ time without shifting any elements.

---

### 1.2 Tortoise and Hare Velocity Mechanics

When traversing pointer-linked structures (such as linked lists), pointers move at different velocities:
* **Tortoise (`slow`):** Advances **1 step** per tick.
* **Hare (`fast`):** Advances **2 steps** per tick.

If a cycle exists, the fast pointer enters the cycle and laps the slow pointer from behind. Because the gap between them shrinks by exactly 1 step on every tick ($2 - 1 = 1$), collision is guaranteed without skipping. If no cycle exists, the fast pointer reaches the end (`null`) in $O(n)$ time.

---

### 1.3 Pointer Movement Summary

| Strategy | Speed of Slow | Speed of Fast | Primary Use Case | Time Complexity | Auxiliary Space |
| :--- | :---: | :---: | :--- | :---: | :---: |
| **Reader / Writer** | Moves on condition | Advances every loop | Deduplication, moving zeroes, filtering | **$O(n)$** | **$O(1)$** |
| **Tortoise & Hare** | 1 step per tick | 2 steps per tick | Cycle detection, finding middle node | **$O(n)$** | **$O(1)$** |
| **Three-Way Partition**| Low boundary | Mid scanner & High | Dutch National Flag (sorting 3 values) | **$O(n)$** | **$O(1)$** |

---

## 2. Pattern Overview

### Pattern Family
* **Reader & Writer Pointers:** Both pointers advance forward; `fast` reads every item while `slow` writes retained elements in-place.
* **Tortoise & Hare (Floyd's Algorithm):** 1x vs 2x speed differential for cycle detection and midpoint discovery.
* **Dutch National Flag (3-Pointer Partitioning):** Low, Mid, and High pointers partitioning an array into three discrete segments in a single pass.

### Pattern Recognition Table

| Problem Keyword | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| **"In-place" + "$O(1)$ extra space"** | Reorganize array without allocating buffer arrays. | Reader & Writer Pointers. |
| **"Remove duplicates from sorted array"** | Retain single copies of adjacent unique values. | `nums[fast] !== nums[slow]` overwrite. |
| **"Remove all instances of val"** | Filter out a specific value without gaps. | Copy `nums[fast]` to `nums[slow]` when `!== val`. |
| **"Sort 3 values" / "Dutch National Flag"** | Partition array into three segments in-place. | Three-way pointers (`low`, `mid`, `high`). |
| **"Find middle of linked list"** | Locate midpoint in one pass. | Tortoise (1x) & Hare (2x). |

### When to Use
* The problem asks to deduplicate, compact, or partition an array in-place with $O(1)$ auxiliary memory.
* The collection is sorted or clustered, guaranteeing that duplicate values are adjacent.
* You need to eliminate $O(n^2)$ memory-shifting operations like `splice()`.

### When NOT to Use
* Element ordering does not matter and deletions can be handled by swapping with the last element in $O(1)$.
* Searching for pairs that sum to a target in sorted arrays (use Opposing Two Pointers).
* Dynamic contiguous range queries with sum constraints (use Sliding Window).

### The $10^7$ Operations Constraint Rule
If an array contains $n = 50,000$ elements:
* Calling `splice()` inside a loop shifts up to $50,000$ elements on every call, executing $\approx \frac{n^2}{2} = 1.25 \times 10^9$ operations and freezing Node.js for several seconds.
* Fast and slow pointers visit each element once with zero memory shifting ($50,000$ operations), finishing in **under 1 millisecond**.

---

## 3. Problem Walkthroughs

---

### 3.1 Remove Duplicates from Sorted Array

#### 3.1.1 Problem Statement
Given an integer array `nums` sorted in non-decreasing order, remove the duplicates **in-place** such that each unique element appears only **once**. The relative order of the elements must be kept the same. Then return the number of unique elements in `nums`.
Consider the number of unique elements of `nums` to be `k`. You must modify the array such that the first `k` elements contain the unique elements in original order.

* **Sample Input 1:** `nums = [1, 1, 2]` $\to$ **Expected Output:** `k = 2`, `nums = [1, 2, _]`
* **Sample Input 2:** `nums = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]` $\to$ **Expected Output:** `k = 5`, `nums = [0, 1, 2, 3, 4, _, _, _, _, _]`
* **Constraints:** $1 \le nums.length \le 3 \times 10^4$, $-100 \le nums[i] \le 100$, `nums` is sorted in non-decreasing order.

#### 3.1.2 How to Think About It
Cards on a table: `[0, 0, 1, 1, 1, 2, 2, 3, 3, 4]`.
Card 0 (`0`) is the very first card—it is guaranteed to be unique.
Place your left index finger (`slow`) at card 0.
Use your right index finger (`fast`) to scan starting at card 1:
1. Card at `fast` is `0`. It matches the card at `slow` (`0 === 0`). Duplicate! Skip it.
2. Card at `fast` is `1`. It does not match the card at `slow`. It is a brand-new unique number!
3. Move your left finger to slot 1 (`slow++`) and copy the card `1` into that slot.
4. Repeat until `fast` finishes. All unique cards are packed contiguously from slot `0` to `slow`.

#### 3.1.3 Brute Force Approach & Bottleneck
The naive approach loops through the array and calls `.splice(i + 1, 1)` whenever two adjacent numbers match:

```javascript
function removeDuplicatesBrute(nums) {
  let i = 0;
  while (i < nums.length - 1) {
    if (nums[i] === nums[i + 1]) {
      nums.splice(i + 1, 1); // Costly memory shift!
    } else {
      i++;
    }
  }
  return nums.length;
}
```

* **The Bottleneck:** Every call to `splice()` shifts all remaining elements left in memory ($O(n)$ work). For $30,000$ duplicates, this causes millions of memory copies ($O(n^2)$ time).

#### 3.1.4 The Pattern Insight
Because `nums` is sorted, all identical numbers sit contiguously side-by-side.
We do not need to delete elements from memory. We let `fast` search for the next number that differs from `nums[slow]`. When found, advance `slow++` and overwrite `nums[slow] = nums[fast]`.

#### 3.1.5 Pseudocode

```text
FUNCTION RemoveDuplicates(nums):
  IF length(nums) == 0 RETURN 0

  slow = 0

  FOR fast FROM 1 TO length(nums) - 1:
    IF nums[fast] != nums[slow]:
      slow = slow + 1
      nums[slow] = nums[fast]

  RETURN slow + 1
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(1) space in-place deduplication
function removeDuplicates(nums) {
  if (!Array.isArray(nums) || nums.length === 0) return 0;

  // slow tracks the last confirmed unique element slot
  let slow = 0;

  // fast scans forward starting from index 1
  for (let fast = 1; fast < nums.length; fast++) {
    // Overwrite next slow slot when a new unique value is found
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast];
    }
  }

  // The count of unique numbers is index + 1
  return slow + 1;
}

// Example runs
const arr1 = [1, 1, 2];
const k1 = removeDuplicates(arr1);
console.log(k1, arr1.slice(0, k1)); // 2 [ 1, 2 ]

const arr2 = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4];
const k2 = removeDuplicates(arr2);
console.log(k2, arr2.slice(0, k2)); // 5 [ 0, 1, 2, 3, 4 ]
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Using new Set() to deduplicate (fails O(1) memory requirement)
function removeDuplicatesSet(nums) {
  const unique = Array.from(new Set(nums)); // Burns O(n) heap memory!
  for (let i = 0; i < unique.length; i++) nums[i] = unique[i];
  return unique.length;
}
```
* **Why it fails:** Allocating an auxiliary Set and a secondary array violates the strict $O(1)$ auxiliary space constraint.

#### 3.1.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The `fast` pointer scans each index from `1` to `n - 1` exactly once.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. Operates strictly in-place with zero heap allocations.

---

### 3.2 Sort Colors

#### 3.2.1 Problem Statement
Given an array `nums` with $n$ objects colored red (`0`), white (`1`), or blue (`2`), sort them **in-place** so that objects of the same color are adjacent, with the colors in the order red, white, and blue.
You must solve this problem without using the library's sort function and in a single pass using $O(1)$ constant extra space.

* **Sample Input 1:** `nums = [2, 0, 2, 1, 1, 0]` $\to$ **Expected Output:** `[0, 0, 1, 1, 2, 2]`
* **Sample Input 2:** `nums = [2, 0, 1]` $\to$ **Expected Output:** `[0, 1, 2]`
* **Sample Input 3:** `nums = [0]` $\to$ **Expected Output:** `[0]`
* **Constraints:** $n == nums.length$, $1 \le n \le 300$, `nums[i]` is either `0`, `1`, or `2`.

#### 3.2.2 How to Think About It
Imagine three sorting bins marked for pool balls: Red (`0`), White (`1`), and Blue (`2`).
Place three boundary markers along the table:
* `low = 0`: Left boundary where the next Red (`0`) belongs.
* `high = n - 1`: Right boundary where the next Blue (`2`) belongs.
* `mid = 0`: Your scanner inspecting each ball.

As `mid` walks forward:
1. **If ball is 0 (Red):** Swap it into the `low` bin (`swap(nums[low], nums[mid])`), then advance both `low++` and `mid++`.
2. **If ball is 1 (White):** It is already in the correct middle segment! Simply step forward: `mid++`.
3. **If ball is 2 (Blue):** Swap it into the `high` bin (`swap(nums[mid], nums[high])`), then shrink the blue boundary: `high--`. **Do not advance `mid`**, because the ball swapped in from `high` has not been inspected yet!

#### 3.2.3 Brute Force Approach & Bottleneck
The naive approach counts the occurrences of 0, 1, and 2 in a first pass (or uses `nums.sort((a, b) => a - b)` taking $O(n \log n)$ time), then overwrites the array in a second pass:

```javascript
function sortColorsCounting(nums) {
  let c0 = 0, c1 = 0, c2 = 0;
  for (const n of nums) {
    if (n === 0) c0++;
    else if (n === 1) c1++;
    else c2++;
  }
  let idx = 0;
  while (c0-- > 0) nums[idx++] = 0;
  while (c1-- > 0) nums[idx++] = 1;
  while (c2-- > 0) nums[idx++] = 2;
  return nums;
}
```

* **The Bottleneck:** Requires two full passes over the array. While $O(n)$, the problem constraints explicitly require a **single-pass in-place partitioning algorithm** using pointer boundaries.

#### 3.2.4 The Pattern Insight
Use **Dutch National Flag (Three-Way Partitioning)**:
Partition the array into four invariant regions:
* `[0 ... low - 1]`: Confirmed `0`s.
* `[low ... mid - 1]`: Confirmed `1`s.
* `[mid ... high]`: Uninspected items.
* `[high + 1 ... n - 1]`: Confirmed `2`s.

The loop runs while `mid <= high`.
When swapping with `high`, we do not advance `mid` because the newly placed element at `nums[mid]` could be `0` or `2`, which must be evaluated on the next iteration.

#### 3.2.5 Pseudocode

```text
FUNCTION SortColors(nums):
  low = 0
  mid = 0
  high = length(nums) - 1

  WHILE mid <= high:
    IF nums[mid] == 0:
      SWAP(nums[low], nums[mid])
      low = low + 1
      mid = mid + 1
    ELSE IF nums[mid] == 1:
      mid = mid + 1
    ELSE:
      SWAP(nums[mid], nums[high])
      high = high - 1

  RETURN nums
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) single-pass Dutch National Flag 3-pointer partition
function sortColors(nums) {
  if (!Array.isArray(nums) || nums.length <= 1) return nums;

  let low = 0;                  // Boundary for 0s
  let mid = 0;                  // Current element scanner
  let high = nums.length - 1;   // Boundary for 2s

  while (mid <= high) {
    if (nums[mid] === 0) {
      // 0 belongs in the low segment
      const temp = nums[low];
      nums[low] = nums[mid];
      nums[mid] = temp;
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      // 1 belongs in the middle segment; simply scan forward
      mid++;
    } else {
      // 2 belongs in the high segment
      const temp = nums[mid];
      nums[mid] = nums[high];
      nums[high] = temp;
      high--;
      // Note: Do NOT increment mid here; uninspected element was swapped into mid!
    }
  }

  return nums;
}

// Example runs
console.log(sortColors([2, 0, 2, 1, 1, 0])); // [ 0, 0, 1, 1, 2, 2 ]
console.log(sortColors([2, 0, 1]));          // [ 0, 1, 2 ]
console.log(sortColors([0]));                // [ 0 ]
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Incrementing mid after swapping with high
function buggySortColors(nums) {
  let low = 0, mid = 0, high = nums.length - 1;
  while (mid <= high) {
    if (nums[mid] === 0) {
      const temp = nums[low];
      nums[low] = nums[mid];
      nums[mid] = temp;
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      const temp = nums[mid];
      nums[mid] = nums[high];
      nums[high] = temp;
      high--;
      mid++; // BUG: Advances past swapped item without inspecting it!
    }
  }
  return nums;
}
```
* **Why it fails:** Swapping `nums[mid]` with `nums[high]` places an unknown, uninspected value at index `mid`. Incrementing `mid++` skips that element. If the swapped value was `0`, it gets permanently trapped in the middle of the array.

#### 3.2.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. In every iteration, either `mid` increments or `high` decrements. The scanner covers at most $n$ total operations.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. Operates strictly in-place with three integer pointer variables.

---

### 3.3 Remove Element

#### 3.3.1 Problem Statement
Given an integer array `nums` and an integer `val`, remove all occurrences of `val` in `nums` **in-place**. The order of the elements may be changed. Then return the number of elements in `nums` which are not equal to `val`.
Consider the number of elements in `nums` which are not equal to `val` be `k`. You must modify the array such that the first `k` elements contain the retained elements.

* **Sample Input 1:** `nums = [3, 2, 2, 3]`, `val = 3` $\to$ **Expected Output:** `k = 2`, `nums = [2, 2, _, _]`
* **Sample Input 2:** `nums = [0, 1, 2, 2, 3, 0, 4, 2]`, `val = 2` $\to$ **Expected Output:** `k = 5`, `nums = [0, 1, 3, 0, 4, _, _, _]`
* **Constraints:** $0 \le nums.length \le 100$, $0 \le nums[i], val \le 50$.

#### 3.3.2 How to Think About It
Imagine a bouncer checking an invitation list.
The target `val` is on the banned list.
* `slow` marks the next open seat for an approved guest (`slow = 0`).
* `fast` walks through every person on the list:
  - If person at `fast` is banned (`nums[fast] === val`), skip them!
  - If person at `fast` is approved (`nums[fast] !== val`), copy them to `nums[slow]` and increment `slow++`.

#### 3.3.3 Brute Force Approach & Bottleneck
Using `splice()` inside a loop shifts elements left every time `val` is found, burning $O(n^2)$ time.

#### 3.3.4 The Pattern Insight
Instead of shifting memory, overwrite values in-place: `fast` reads every item, and `nums[slow] = nums[fast]` only executes when the item is **not** equal to `val`. `slow` naturally tracks the count of kept items.

> [!NOTE]
> **Self-Check:** Why does `removeDuplicates` return `slow + 1`, whereas `removeElement` returns `slow`?  
> *Answer:* In `removeDuplicates`, `slow` represents the *index* of the last unique item, so count is `slow + 1`. In `removeElement`, `slow` begins at 0 and increments *immediately after* writing each retained item, so it already stores the total *count* of retained items.

#### 3.3.5 Pseudocode

```text
FUNCTION RemoveElement(nums, val):
  slow = 0

  FOR fast FROM 0 TO length(nums) - 1:
    IF nums[fast] != val:
      nums[slow] = nums[fast]
      slow = slow + 1

  RETURN slow
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(1) space element removal
function removeElement(nums, val) {
  if (!Array.isArray(nums) || nums.length === 0) return 0;

  let slow = 0; // Index for the next retained element

  for (let fast = 0; fast < nums.length; fast++) {
    // Only copy and advance slow when item is NOT the target value
    if (nums[fast] !== val) {
      nums[slow] = nums[fast];
      slow++;
    }
  }

  // slow naturally holds the count of retained elements
  return slow;
}

// Example runs
const test1 = [3, 2, 2, 3];
const len1 = removeElement(test1, 3);
console.log(len1, test1.slice(0, len1)); // 2 [ 2, 2 ]

const test2 = [0, 1, 2, 2, 3, 0, 4, 2];
const len2 = removeElement(test2, 2);
console.log(len2, test2.slice(0, len2)); // 5 [ 0, 1, 3, 0, 4 ]
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Advancing slow on unwanted values
function buggyRemoveElement(nums, val) {
  let slow = 0;
  for (let fast = 0; fast < nums.length; fast++) {
    if (nums[fast] === val) { // BUG: Advances on unwanted elements!
      slow++;
    } else {
      nums[slow] = nums[fast];
    }
  }
  return slow;
}
```
* **Why it fails:** Advancing `slow` when `nums[fast] === val` corrupts the front of the array by preserving the banned values and overwriting valid data.

#### 3.3.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The `fast` pointer executes a single pass over `nums`.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. Modifies array strictly in-place.

---

## 4. Tricky Edge Cases

* **Index vs Count Confusion (`slow` vs `slow + 1`):**
  - In `removeDuplicates`, `slow` marks the *index* of the last unique item; the count is **`slow + 1`**.
  - In `removeElement`, `slow` increments *after* writing; `slow` is already the **count**.
* **All Elements Match Target (`nums = [2, 2, 2]`, `val = 2`):** `slow` never increments, and the function correctly returns `0`.
* **All Elements Unique (`nums = [1, 2, 3]`):** `fast` and `slow` advance side-by-side. The check `if (slow !== fast)` prevents redundant self-swapping writes.
* **Empty Input Array (`[]`):** Always guard small arrays upfront so loops do not throw index errors and return `0` immediately.

---

## 5. Summary Cheat Sheet

* **Fast & Slow Mechanics:** Both pointers move in the same direction. `fast` scans every item; `slow` marks the boundary of kept items.
* **Eliminates `splice()`:** Replaces $O(n^2)$ memory-shifting deletions with $O(1)$ in-place overwrites.
* **Sorting Synergy:** When an array is sorted, duplicates are guaranteed to be adjacent (`nums[fast] !== nums[slow]`).
* **Velocity Difference:** Moving at 1x vs 2x speed detects cycles in linked structures without extra memory.

---

## 6. Practice Problems

### 6.1 Remove Duplicates from Sorted Array II

Given an integer array `nums` sorted in non-decreasing order, remove some duplicates in-place such that each unique element appears **at most twice**. The relative order of the elements should be kept the same. Return `k` after placing the final result in the first `k` slots of `nums`.

* **Difficulty:** Medium | **Focus:** At Most K Duplicates
* **Sample Input 1:** `nums = [1, 1, 1, 2, 2, 3]` $\to$ **Expected Output:** `5`, `nums = [1, 1, 2, 2, 3, _]`
* **Sample Input 2:** `nums = [0, 0, 1, 1, 1, 1, 2, 3, 3]` $\to$ **Expected Output:** `7`, `nums = [0, 0, 1, 1, 2, 3, 3, _]`
* **Constraints:** $1 \le nums.length \le 3 \times 10^4$, $-10^4 \le nums[i] \le 10^4$, `nums` is sorted.
* **Hint 1:** Any array with length $\le 2$ is already valid. Initialize `slow = 2` and `fast = 2`.
* **Hint 2:** Compare `nums[fast]` with `nums[slow - 2]`. If they are different, copy `nums[slow] = nums[fast]` and increment `slow++`.

---

### 6.2 Linked List Cycle

Given `head`, the head of a singly linked list, determine if the linked list has a cycle in it. Return `true` if there is a cycle; otherwise, return `false`.

* **Difficulty:** Easy | **Focus:** Tortoise & Hare Velocity Differential
* **Sample Input 1:** `head = [3, 2, 0, -4]`, `pos = 1` $\to$ **Expected Output:** `true`
* **Sample Input 2:** `head = [1, 2]`, `pos = 0` $\to$ **Expected Output:** `true`
* **Sample Input 3:** `head = [1]`, `pos = -1` $\to$ **Expected Output:** `false`
* **Constraints:** The number of nodes in the list is in the range $[0, 10^4]$, $-10^5 \le Node.val \le 10^5$.
* **Hint 1:** Initialize two pointers: `slow = head` and `fast = head`.
* **Hint 2:** In each step, advance `slow` by 1 node and `fast` by 2 nodes. If `fast` or `fast.next` hits `null`, there is no cycle. If `slow === fast`, a cycle exists.

---

### 6.3 Find the Middle of the Linked List

Given the `head` of a singly linked list, return the middle node of the linked list. If there are two middle nodes, return the second middle node.

* **Difficulty:** Easy | **Focus:** Midpoint Discovery
* **Sample Input 1:** `head = [1, 2, 3, 4, 5]` $\to$ **Expected Output:** Node with value `3`
* **Sample Input 2:** `head = [1, 2, 3, 4, 5, 6]` $\to$ **Expected Output:** Node with value `4`
* **Constraints:** The number of nodes in the list is in the range $[1, 100]$, $1 \le Node.val \le 100$.
* **Hint 1:** Initialize `slow = head` and `fast = head`.
* **Hint 2:** In each step, advance `slow = slow.next` (1 step) and `fast = fast.next.next` (2 steps). When `fast` reaches `null` or `fast.next === null`, `slow` is at the midpoint.

---

<nav aria-label="Lecture navigation">

[Previous: Two Pointers: Opposing & Symmetrical Scans](day-06-two-pointers-opposing-and-symmetrical.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Fixed Sliding Window](day-08-sliding-window-fixed-size.md)

</nav>
