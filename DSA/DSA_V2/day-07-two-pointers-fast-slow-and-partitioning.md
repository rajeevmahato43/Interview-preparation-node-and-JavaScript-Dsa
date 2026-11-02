# Day 07: Two Pointers: Fast & Slow and In-Place Partitioning

<nav aria-label="Lecture navigation">

[Previous: Two Pointers: Opposing & Symmetrical Scans](day-06-two-pointers-opposing-and-symmetrical.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Fixed Sliding Window](day-08-sliding-window-fixed-size.md)

</nav>

---

## 1. Fast & Slow Pointers

**Fast & Slow pointers** start at the beginning of an array or list. Both pointers move in the **same direction**, but at different speeds or following different rules.

Instead of making a new array or calling slow methods like `.splice()` ($O(n^2)$), one pointer reads ahead while the other pointer writes good data right into the original array ($O(n)$ time, $O(1)$ extra space).

To picture this physically, imagine sorting a line of playing cards on a table:
* **The Scout (`fast`):** Walks quickly ahead, looking at every card on the table.
* **The Scribe (`slow`):** Points to the next empty spot where a kept card belongs.
* When the Scout sees junk (like duplicate cards or zeroes), it skips them.
* When the Scout finds a good card, it copies that card into the Scribe's spot, and the Scribe takes one step forward.

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

When rewriting an array in-place, both pointers move forward with clear jobs:
* **The Reader (`fast`):** Checks every item from index `0` to `n - 1`.
* **The Writer (`slow`):** Marks the spot for the next kept item. It only steps forward when `fast` finds an item we want to keep.

```text
[  Valid Kept Items  |  Discarded Items  |  Uninspected Items  ]
 0                slow - 1             fast - 1              n - 1
```

> [!NOTE]
> **Self-Check:** What is the performance difference between calling `arr.splice(i, 1)` and using a `slow` write pointer?  
> *Answer:* `splice()` shifts every remaining item in memory to the left on each call ($O(n)$ work per delete, leading to $O(n^2)$ total time). A `slow` pointer directly overwrites `arr[slow]` in $O(1)$ time without moving other items.

---

### 1.2 Tortoise and Hare Speeds

When moving through linked lists, the two pointers move at different speeds:
* **Tortoise (`slow`):** Moves **1 step** at a time.
* **Hare (`fast`):** Moves **2 steps** at a time.

If there is a loop, the fast pointer enters the loop and catches up to the slow pointer from behind. Because the gap between them shrinks by 1 step in every round ($2 - 1 = 1$), they are guaranteed to meet. If there is no loop, the fast pointer reaches the end (`null`) in $O(n)$ time.

---

### 1.3 Pointer Movement Summary

| Strategy | Speed of Slow | Speed of Fast | Main Use Case | Time Complexity | Extra Space |
| :--- | :---: | :---: | :--- | :---: | :---: |
| **Reader / Writer** | Moves on condition | Moves every step | Remove duplicates, move zeroes, filter items | **$O(n)$** | **$O(1)$** |
| **Tortoise & Hare** | 1 step per turn | 2 steps per turn | Find loops, find middle node | **$O(n)$** | **$O(1)$** |
| **Three-Way Partition**| Low boundary | Mid scanner & High | Dutch National Flag (sort 3 values) | **$O(n)$** | **$O(1)$** |

---

## 2. Pattern Overview

### Pattern Family
* **Reader & Writer Pointers:** Both pointers move forward. `fast` reads every item while `slow` writes kept items into the array.
* **Tortoise & Hare (Floyd's Algorithm):** 1-step vs 2-step speeds to find cycles and middle nodes.
* **Dutch National Flag (3 Pointers):** Low, Mid, and High pointers that divide an array into three parts in one pass.

### Pattern Recognition Table

| Problem Keyword | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| **"In-place" + "$O(1)$ extra space"** | Change the array without making a new copy. | Reader & Writer Pointers. |
| **"Remove duplicates from sorted array"** | Keep only one copy of each number. | Overwrite when `nums[fast] !== nums[slow]`. |
| **"Remove all instances of val"** | Filter out a specific value without empty gaps. | Copy `nums[fast]` to `nums[slow]` when `!== val`. |
| **"Sort 3 values" / "Dutch National Flag"** | Group an array into 3 sections in-place. | Three pointers (`low`, `mid`, `high`). |
| **"Find middle of linked list"** | Find the center node in one pass. | Tortoise (1 step) & Hare (2 steps). |

### When to Use
* The problem asks to clean up, remove duplicates, or group an array in-place using $O(1)$ extra space.
* The array is already sorted, so duplicate values sit right next to each other.
* You need to avoid slow $O(n^2)$ array shifts from `splice()`.

### When NOT to Use
* The order of items does not matter and you can delete an item by swapping it with the last element in $O(1)$ time.
* You need to find two numbers that add up to a target in a sorted array (use Opposing Two Pointers).
* You need to find contiguous sub-arrays with sum or length limits (use Sliding Window).

### The $10^7$ Operations Constraint Rule
If an array has $n = 50,000$ items:
* Calling `splice()` inside a loop shifts up to $50,000$ items on every call. That runs $\approx \frac{n^2}{2} = 1.25 \times 10^9$ operations and freezes Node.js for several seconds.
* Fast and slow pointers visit each item once with zero memory shifting ($50,000$ operations). This finishes in **under 1 millisecond**.

---

## 3. Problem Walkthroughs

---

### 3.1 Remove Duplicates from Sorted Array

#### 3.1.1 Problem Statement
Given an integer array `nums` sorted in non-decreasing order, remove the duplicates **in-place** so that each unique element appears only **once**. Keep the relative order of the elements the same. Then return the number of unique elements in `nums`.

Let `k` be the count of unique elements. You must change `nums` so that the first `k` spots hold the unique numbers in their original order.

* **Sample Input 1:** `nums = [1, 1, 2]` $\to$ **Expected Output:** `k = 2`, `nums = [1, 2, _]`
* **Sample Input 2:** `nums = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]` $\to$ **Expected Output:** `k = 5`, `nums = [0, 1, 2, 3, 4, _, _, _, _, _]`
* **Constraints:** $1 \le nums.length \le 3 \times 10^4$, $-100 \le nums[i] \le 100$, `nums` is sorted in non-decreasing order.

#### 3.1.2 How to Think About It
Picture cards laid out on a table: `[0, 0, 1, 1, 1, 2, 2, 3, 3, 4]`.  
The first card (`0`) is already unique because it is the very first one.  
Place your left index finger (`slow`) on card 0.  
Use your right index finger (`fast`) to look through the cards starting from card 1:
1. Card at `fast` is `0`. It matches the card at `slow` (`0 === 0`). This is a duplicate! Skip it.
2. Card at `fast` is `1`. It does not match the card at `slow`. This is a brand new unique number!
3. Move your left finger to slot 1 (`slow++`) and write card `1` into that slot.
4. Keep going until `fast` reaches the end. All unique cards are now packed tightly from index `0` to `slow`.

#### 3.1.3 Brute Force Approach & Bottleneck
The naive way loops through the array and calls `.splice(i + 1, 1)` whenever two neighbor numbers are the same:

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

* **The Bottleneck:** Every time `splice()` runs, it shifts all remaining items to the left in memory ($O(n)$ work). For $30,000$ duplicates, this causes millions of item shifts ($O(n^2)$ time).

#### 3.1.4 The Pattern Insight
Because `nums` is sorted, identical numbers always sit side-by-side.  
We do not need to delete anything. We just let `fast` search for the next number that differs from `nums[slow]`. When found, move `slow++` and write `nums[slow] = nums[fast]`.

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
* **Why it fails:** Making a new `Set` and a new helper array wastes extra memory. The problem requires $O(1)$ extra space.

#### 3.1.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The `fast` pointer checks each index from `1` to `n - 1` exactly once.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. We modify the array directly without allocating extra data structures.

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
Imagine three bins for pool balls: Red (`0`), White (`1`), and Blue (`2`).  
Place three markers along the table:
* `low = 0`: The spot where the next Red (`0`) belongs.
* `high = n - 1`: The spot where the next Blue (`2`) belongs.
* `mid = 0`: Your scanner checking each ball one by one.

As `mid` walks forward:
1. **If ball is 0 (Red):** Swap it into the `low` bin (`swap(nums[low], nums[mid])`), then step both `low++` and `mid++`.
2. **If ball is 1 (White):** It is already in the right middle zone! Simply step forward: `mid++`.
3. **If ball is 2 (Blue):** Swap it into the `high` bin (`swap(nums[mid], nums[high])`), then shrink the blue boundary: `high--`. **Do not move `mid`**, because the new ball brought in from `high` has not been checked yet!

#### 3.2.3 Brute Force Approach & Bottleneck
The naive way counts how many 0s, 1s, and 2s exist in a first pass (or sorts with `nums.sort((a, b) => a - b)` in $O(n \log n)$ time), then writes them back in a second pass:

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

* **The Bottleneck:** This needs two full passes over the array. While it runs in $O(n)$ time, the interview question explicitly asks for a **single-pass in-place partitioning** algorithm.

#### 3.2.4 The Pattern Insight
Use the **Dutch National Flag (Three-Way Partitioning)** algorithm:  
Divide the array into four clear zones:
* `[0 ... low - 1]`: All confirmed `0`s.
* `[low ... mid - 1]`: All confirmed `1`s.
* `[mid ... high]`: Unchecked items.
* `[high + 1 ... n - 1]`: All confirmed `2`s.

The loop runs while `mid <= high`.  
When swapping with `high`, we do not advance `mid` because the ball that arrived at `nums[mid]` could be a `0` or `2`. We must check it on the next step.

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
* **Why it fails:** Swapping `nums[mid]` with `nums[high]` brings an unchecked number into `nums[mid]`. Moving `mid++` skips that number. If the number was `0`, it stays stuck in the middle of the array forever.

#### 3.2.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. In every step, either `mid` moves right or `high` moves left. We inspect each item at most once.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. We only use three number pointers to sort the array directly.

---

### 3.3 Remove Element

#### 3.3.1 Problem Statement
Given an integer array `nums` and an integer `val`, remove all occurrences of `val` in `nums` **in-place**. The order of the elements may be changed. Then return the number of elements in `nums` which are not equal to `val`.

Let `k` be the count of elements that are not equal to `val`. You must modify `nums` so that the first `k` spots hold the kept elements.

* **Sample Input 1:** `nums = [3, 2, 2, 3]`, `val = 3` $\to$ **Expected Output:** `k = 2`, `nums = [2, 2, _, _]`
* **Sample Input 2:** `nums = [0, 1, 2, 2, 3, 0, 4, 2]`, `val = 2` $\to$ **Expected Output:** `k = 5`, `nums = [0, 1, 3, 0, 4, _, _, _]`
* **Constraints:** $0 \le nums.length \le 100$, $0 \le nums[i], val \le 50$.

#### 3.3.2 How to Think About It
Imagine a bouncer checking a guest list.  
The number `val` is on the banned list.  
* `slow` marks the next chair for an approved guest (`slow = 0`).
* `fast` walks through every person in line:
  - If the person at `fast` is banned (`nums[fast] === val`), skip them!
  - If the person at `fast` is approved (`nums[fast] !== val`), give them the chair at `nums[slow]` and move `slow++`.

#### 3.3.3 Brute Force Approach & Bottleneck
Using `.splice()` inside a loop shifts items left every time `val` is found. This burns $O(n^2)$ time.

#### 3.3.4 The Pattern Insight
Instead of shifting memory, overwrite items in-place. `fast` reads every item, and we only write `nums[slow] = nums[fast]` when the item is **not** equal to `val`. `slow` naturally keeps count of all kept items.

> [!NOTE]
> **Self-Check:** Why does `removeDuplicates` return `slow + 1`, while `removeElement` returns `slow`?  
> *Answer:* In `removeDuplicates`, `slow` is the *index* of the last unique item, so the total count is `slow + 1`. In `removeElement`, `slow` starts at 0 and increments *right after* writing each kept item, so it already holds the total *count* of kept items.

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
* **Why it fails:** Moving `slow` when `nums[fast] === val` ruins the front of the array. It keeps the banned numbers and overwrites valid numbers.

#### 3.3.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The `fast` pointer takes one single pass through `nums`.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. We rewrite items directly in the existing array.

---

## 4. Tricky Edge Cases

* **Index vs Count Confusion (`slow` vs `slow + 1`):**
  - In `removeDuplicates`, `slow` is the *index* of the last unique item, so return **`slow + 1`**.
  - In `removeElement`, `slow` increments *after* writing, so `slow` is already the **count**.
* **All Items Match Target (`nums = [2, 2, 2]`, `val = 2`):** `slow` never increments, and the function correctly returns `0`.
* **All Items Unique (`nums = [1, 2, 3]`):** `fast` and `slow` move side-by-side. The check `if (slow !== fast)` prevents copying an item onto itself.
* **Empty Input Array (`[]`):** Always check empty arrays at the top so loops do not throw errors and return `0` immediately.

---

## 5. Summary Cheat Sheet

* **Fast & Slow Mechanics:** Both pointers move in the same direction. `fast` reads every item; `slow` marks the spot for kept items.
* **Eliminates `splice()`:** Replaces slow $O(n^2)$ memory shifts with fast $O(1)$ in-place overwrites.
* **Sorted Array Synergy:** When an array is sorted, matching items always sit next to each other (`nums[fast] !== nums[slow]`).
* **Speed Difference:** Moving at 1-step vs 2-step speeds detects cycles in linked structures without extra memory.

---

## 6. Practice Problems

### 6.1 Remove Duplicates from Sorted Array II

Given an integer array `nums` sorted in non-decreasing order, remove some duplicates in-place so that each unique element appears **at most twice**. Keep the relative order of the elements the same. Return `k` after placing the final result in the first `k` spots of `nums`.

* **Difficulty:** Medium | **Focus:** At Most K Duplicates
* **Sample Input 1:** `nums = [1, 1, 1, 2, 2, 3]` $\to$ **Expected Output:** `5`, `nums = [1, 1, 2, 2, 3, _]`
* **Sample Input 2:** `nums = [0, 0, 1, 1, 1, 1, 2, 3, 3]` $\to$ **Expected Output:** `7`, `nums = [0, 0, 1, 1, 2, 3, 3, _]`
* **Constraints:** $1 \le nums.length \le 3 \times 10^4$, $-10^4 \le nums[i] \le 10^4$, `nums` is sorted.
* **Hint 1:** Any array with length $\le 2$ is already valid. Start with `slow = 2` and `fast = 2`.
* **Hint 2:** Compare `nums[fast]` with `nums[slow - 2]`. If they are different, write `nums[slow] = nums[fast]` and increment `slow++`.

---

### 6.2 Linked List Cycle

Given `head`, the head of a singly linked list, check if the linked list has a cycle in it. Return `true` if there is a cycle; otherwise, return `false`.

* **Difficulty:** Easy | **Focus:** Tortoise & Hare Speeds
* **Sample Input 1:** `head = [3, 2, 0, -4]`, `pos = 1` $\to$ **Expected Output:** `true`
* **Sample Input 2:** `head = [1, 2]`, `pos = 0` $\to$ **Expected Output:** `true`
* **Sample Input 3:** `head = [1]`, `pos = -1` $\to$ **Expected Output:** `false`
* **Constraints:** The number of nodes in the list is in the range $[0, 10^4]$, $-10^5 \le Node.val \le 10^5$.
* **Hint 1:** Set two pointers: `slow = head` and `fast = head`.
* **Hint 2:** In each step, move `slow` by 1 node and `fast` by 2 nodes. If `fast` or `fast.next` hits `null`, there is no cycle. If `slow === fast`, a cycle exists.

---

### 6.3 Find the Middle of the Linked List

Given the `head` of a singly linked list, return the middle node of the linked list. If there are two middle nodes, return the second middle node.

* **Difficulty:** Easy | **Focus:** Finding the Middle Node
* **Sample Input 1:** `head = [1, 2, 3, 4, 5]` $\to$ **Expected Output:** Node with value `3`
* **Sample Input 2:** `head = [1, 2, 3, 4, 5, 6]` $\to$ **Expected Output:** Node with value `4`
* **Constraints:** The number of nodes in the list is in the range $[1, 100]$, $1 \le Node.val \le 100$.
* **Hint 1:** Set `slow = head` and `fast = head`.
* **Hint 2:** In each step, move `slow = slow.next` (1 step) and `fast = fast.next.next` (2 steps). When `fast` reaches `null` or `fast.next === null`, `slow` is right at the middle.

---

<nav aria-label="Lecture navigation">

[Previous: Two Pointers: Opposing & Symmetrical Scans](day-06-two-pointers-opposing-and-symmetrical.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Fixed Sliding Window](day-08-sliding-window-fixed-size.md)

</nav>
