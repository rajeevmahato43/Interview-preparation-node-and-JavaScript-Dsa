# Day 12: Two Pointers: Same-Direction / Fast & Slow

<nav aria-label="Lecture navigation">

[Previous: Two Pointers: Opposing Pointers](day-11-two-pointers-opposing.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Sliding Window: Fixed Size](day-13-sliding-window-fixed-size.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Apply the **Read/Write Pointer Pattern** to mutate arrays in-place without allocating new arrays.
- Implement **Remove Duplicates from Sorted Array** in $O(n)$ time and $O(1)$ space.
- Solve **Move Zeroes** cleanly without using costly `Array.prototype.splice()` operations.
- Master the **Dutch National Flag (3-Pointer Partition)** algorithm for 3-way segregation in a single pass.
- Solve **Trapping Rain Water** using boundary two-pointer shrinkage in $O(n)$ time and $O(1)$ auxiliary space.

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md)
- [Day 02: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md)
- [Day 11: Two Pointers: Opposing Pointers](day-11-two-pointers-opposing.md)

---

## Core Concepts

### 1. The Read/Write Pointer Pattern

In array interview problems, a common constraint is:
> *"Modify the input array in-place such that each element appears only once and return the new length. Do not allocate extra space."*

If you use `arr.splice(i, 1)` inside a loop, every deletion shifts all remaining elements to the left:
$$n + (n - 1) + (n - 2) + \dots + 1 = O(n^2) \text{ time!}$$

Instead, use two pointers moving in the **same direction**:
- `readIndex`: Scans forward through every element in the array ($O(n)$).
- `writeIndex`: Marks the position where the next valid element should be placed.

```text
Array: [ 1, 1, 2 ]
Initial: write = 1 (index 0 is already valid: 1)

read = 1: nums[1] === nums[0] (duplicate!) -> skip read++
read = 2: nums[2] !== nums[write - 1] (new unique 2!)
          nums[write] = nums[read] -> nums[1] = 2; write++

Result: [ 1, 2, ... ], new length = write = 2
Time: O(n), Space: O(1)
```

---

### 2. Trapping Rain Water (Two-Pointer Invariant)

Problem: Given `n` non-negative integers representing an elevation map where width of each bar is 1, compute how much water it can trap after raining.

```text
       |           |   <- Water trapped between boundaries
   |   |   ~   ~   |
   +---+---+---+---+
```

Water trapped on top of any index `i` is determined by:
$$\text{Water}[i] = \max(0, \min(\text{maxLeft}, \text{maxRight}) - \text{height}[i])$$

**The Two-Pointer Invariant**:
Maintain `left = 0, right = n - 1`, tracking `leftMax` and `rightMax`.
- If `leftMax < rightMax`:
  The water height at `left` is strictly bounded by `leftMax` (even if `rightMax` becomes taller later).
  We can compute water at `left` immediately: `water += leftMax - height[left]`, and increment `left++`.
- Otherwise:
  The water height at `right` is strictly bounded by `rightMax`.
  We compute `water += rightMax - height[right]`, and decrement `right--`.

---

## Detailed Explanations & Node.js Relevance

### In-Place Array Compaction in V8

When working in Node.js, mutating an array in-place using indices (`arr[write] = arr[read]`) maintains a **Packed Elements** array in V8.
Shortening the array by updating `arr.length = write` instantly truncates the backing store without re-allocating new objects on the heap.
Conversely, creating intermediate arrays via `.filter()`, `.map()`, or `.slice()` allocates fresh heap buffers, creating garbage collection pressure.

---

## JavaScript Implementation & Tracing

### 1. Remove Duplicates from Sorted Array (LeetCode 26)

```js
function removeDuplicates(nums) {
  if (nums.length === 0) return 0;

  // write pointer points to next unique slot
  let write = 1;

  for (let read = 1; read < nums.length; read++) {
    // If current element is different from previous unique element
    if (nums[read] !== nums[write - 1]) {
      nums[write] = nums[read];
      write++;
    }
  }

  return write; // New effective length
}
```

### 2. Move Zeroes (LeetCode 283)

```js
function moveZeroes(nums) {
  let write = 0;

  // Pass 1: Compact all non-zero elements to front
  for (let read = 0; read < nums.length; read++) {
    if (nums[read] !== 0) {
      nums[write] = nums[read];
      write++;
    }
  }

  // Pass 2: Fill remaining tail with zeroes
  while (write < nums.length) {
    nums[write] = 0;
    write++;
  }

  return nums;
}
```

### 3. Trapping Rain Water (LeetCode 42)

```js
function trap(height) {
  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let totalWater = 0;

  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) {
        leftMax = height[left];
      } else {
        totalWater += leftMax - height[left];
      }
      left++;
    } else {
      if (height[right] >= rightMax) {
        rightMax = height[right];
      } else {
        totalWater += rightMax - height[right];
      }
      right--;
    }
  }

  return totalWater;
}
```

### Trace: `moveZeroes([0, 1, 0, 3, 12])`

| `read` | `nums[read]` | Condition `!= 0` | Action | Array State | `write` |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `0` | `0` | `false` | None | `[0, 1, 0, 3, 12]` | `0` |
| `1` | `1` | `true` | `nums[0] = 1` | `[1, 1, 0, 3, 12]` | `1` |
| `2` | `0` | `false` | None | `[1, 1, 0, 3, 12]` | `1` |
| `3` | `3` | `true` | `nums[1] = 3` | `[1, 3, 0, 3, 12]` | `2` |
| `4` | `12` | `true` | `nums[2] = 12`| `[1, 3, 12, 3, 12]`| `3` |
| **Tail**| Fill 0s | `write < len` | `nums[3]=0, nums[4]=0` | `[1, 3, 12, 0, 0]` | `5` |

- **Time Complexity**: $O(n)$ (two sequential linear passes).
- **Auxiliary Space**: $O(1)$ extra space.

---

## Common Mistakes & Interview Traps

1. **Calling `.splice()` in a loop**:
   Never use `.splice()` to delete elements when filtering in an interview. Explain that it turns an $O(n)$ pass into an $O(n^2)$ array-shifting penalty.
2. **Comparing `nums[read]` with `nums[read - 1]` instead of `nums[write - 1]`**:
   In `removeDuplicates`, comparing with `nums[write - 1]` guarantees comparison against the last successfully written unique element.
3. **Off-by-One in Trapping Rain Water**:
   Using `left <= right` instead of `left < right` causes an extra iteration where `left === right`, which is redundant since a single bar cannot trap water on top of itself without another opposing wall.

---

## Tricky Points & Edge Cases

- **Arrays with No Zeroes or All Zeroes**:
  `moveZeroes([0, 0, 0])` and `moveZeroes([1, 2, 3])` must execute without index errors.
- **Heights with Monotonic Slopes in Trapping Rain Water**:
  Strictly ascending `[1, 2, 3, 4]` or descending `[4, 3, 2, 1]` terrain can hold 0 units of water. The algorithm naturally outputs `0`.

---

## Practical Exercise

Implement **Sort Colors / Dutch National Flag** (LeetCode 75):
Given an array `nums` with $n$ objects colored `0` (red), `1` (white), or `2` (blue), sort them in-place in a single pass ($O(n)$ time, $O(1)$ space) using 3 pointers: `low`, `mid`, and `high`.
- **Invariants**:
  - `[0 ... low - 1]` are all `0`.
  - `[low ... mid - 1]` are all `1`.
  - `[high + 1 ... n - 1]` are all `2`.

---

## Summary

- The Read/Write pointer pattern mutates arrays in-place in $O(n)$ time with $O(1)$ auxiliary memory.
- In-place compaction avoids $O(n^2)$ `.splice()` shifts and reduces V8 heap allocation churn.
- Trapping Rain Water can be solved with two boundary pointers converging inward by processing the smaller boundary first.
- Dutch National Flag uses three pointers to partition an array into three regions in a single pass.

---

## Cheat Sheet

### Fast & Slow Pointer Patterns
| Pattern | Pointer Roles | Problem Example |
| :--- | :--- | :--- |
| **Read / Write** | `read` scans forward, `write` overwrites valid data | Remove Duplicates, Move Zeroes |
| **3-Way Partition** | `low` (for 0s), `mid` (scanner), `high` (for 2s) | Dutch National Flag / Sort Colors |
| **Boundary Shrinkage**| `left`, `right` with `leftMax`, `rightMax` | Trapping Rain Water |

---

## Interview Questions

### 1. Deep Definitions and Mental Models
**Question:** Why does `Array.prototype.splice()` inside a loop lead to $O(n^2)$ time complexity, and how does the Read/Write pointer pattern solve this?
- **Expected answer shape:** `splice(i, 1)` deletes an element by shifting all subsequent elements left by one index in $O(n)$ time. Calling this inside an $O(n)$ loop results in $\sum_{i=1}^n i = O(n^2)$ operations. The Read/Write pointer pattern advances a single `read` pointer and writes matching elements to a `write` pointer sequentially, touching each element once for $O(n)$ total time.

### 2. Predict the Output and Trace Execution
**Question:** What does this function return and what is the state of `nums`?
```js
function removeElement(nums, val) {
  let k = 0;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== val) {
      nums[k] = nums[i];
      k++;
    }
  }
  return k;
}
const nums = [3, 2, 2, 3];
console.log(removeElement(nums, 3), nums);
```
- **Expected answer shape:** Returns `2`. `nums` becomes `[2, 2, 2, 3]`. The first 2 elements (`[2, 2]`) are the elements not equal to 3. The return value `k = 2` indicates the valid length of the compacted array.

### 3. Implementation Exercise
**Question:** Implement `removeDuplicatesII(nums)` where duplicates are allowed at most **twice** in-place in $O(n)$ time and $O(1)$ space.
- **Expected answer shape:**
```js
function removeDuplicatesII(nums) {
  if (nums.length <= 2) return nums.length;
  let write = 2;
  for (let read = 2; read < nums.length; read++) {
    if (nums[read] !== nums[write - 2]) {
      nums[write] = nums[read];
      write++;
    }
  }
  return write;
}
```

### 4. Debugging and Failure Analysis
**Question:** A developer writes Move Zeroes by swapping `[nums[read], nums[write]] = [nums[write], nums[read]]` on every non-zero number. When `nums = [1]`, what happens?
- **Expected answer shape:** When `nums = [1]`, `read = 0, write = 0`. Swapping `nums[0]` with `nums[0]` works correctly, but is a redundant self-swap. Adding `if (read !== write)` prevents unnecessary memory writes.

### 5. Design and Tradeoff Questions
**Question:** How does the Two-Pointer solution for Trapping Rain Water compare to the dynamic programming prefix/suffix array solution?
- **Expected answer shape:** The DP solution precomputes `leftMax` array ($O(n)$ space) and `rightMax` array ($O(n)$ space) in two passes, then computes water in a third pass ($O(n)$ time, $O(n)$ space). The Two-Pointer solution computes water on the fly by converging from both ends, reducing auxiliary space from $O(n)$ to $O(1)$ with identical $O(n)$ runtime.

### 6. Senior Follow-ups: Node.js Buffer Compaction
**Question:** In high-throughput network programming with Node.js `Buffer`, why is in-place data compaction preferred over allocating new buffer slices?
- **Expected answer shape:** Calling `Buffer.from()` or `buffer.slice()` creates new JS wrapper objects and memory handles that must be tracked by V8. In-place compaction using `buffer.copy()` inside an existing pre-allocated pool buffer avoids memory fragmentation and keeps garbage collection pauses near zero.

<nav aria-label="Lecture navigation">

[Previous: Two Pointers: Opposing Pointers](day-11-two-pointers-opposing.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Sliding Window: Fixed Size](day-13-sliding-window-fixed-size.md)

</nav>
