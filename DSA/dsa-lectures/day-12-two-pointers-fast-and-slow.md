# Day 12: Two Pointers: Same-Direction / Fast & Slow

<nav aria-label="Lecture navigation">

[Previous: Two Pointers: Opposing Pointers](day-11-two-pointers-opposing.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Sliding Window: Fixed Size](day-13-sliding-window-fixed-size.md)

</nav>
## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Asymptotic analysis and auxiliary memory.
- [Day 02: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md) — Array element kinds and memory allocation.
- [Day 11: Two Pointers: Opposing Pointers](day-11-two-pointers-opposing.md) — Boundary pointer mechanics.
---

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          READ / WRITE POINTER COMPACTION PIPELINE                           │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Sorted Array: [ 1,  1,  2,  2,  3 ]
  Initial: write = 1 (index 0 is already valid)

  read = 1: nums[1] === nums[write - 1] (duplicate 1!) -> Skip: read++
  read = 2: nums[2] !== nums[write - 1] (unique 2!)    -> nums[write] = nums[read]; write++
  read = 3: nums[3] === nums[write - 1] (duplicate 2!) -> Skip: read++
  read = 4: nums[4] !== nums[write - 1] (unique 3!)    -> nums[write] = nums[read]; write++

  Final State: [ 1, 2, 3,  ... ], write = 3 (Valid unique length)
  Time: O(n), Space: O(1)
```

## 1. In-Place Compaction: The Read/Write Pointer Pattern

In technical interviews and systems programming, problems frequently demand:
> *"Modify the input array in place such that duplicates or target elements are removed. Return the new valid length without allocating extra space."*

```javascript
// Node.js code
"use strict";

const sample = [1, 1, 2, 2, 3, 4, 4];

// ❌ ANTI-PATTERN: Using arr.splice() in a loop (O(n^2) total!)
function removeDuplicatesSlow(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      // splice() shifts all subsequent n - i elements in memory!
      arr.splice(i, 1);
      i--; // Rewind index to check new shifted element
    }
  }
  return arr.length;
}

// ✅ PATTERN: Read/Write Pointers in a single linear pass (O(n) time, O(1) space)
function removeDuplicatesFast(nums) {
  if (nums.length === 0) return 0;

  let write = 1;

  for (let read = 1; read < nums.length; read++) {
    // If read element differs from the last written unique element
    if (nums[read] !== nums[write - 1]) {
      nums[write] = nums[read];
      write++;
    }
  }

  // Truncate array in place without re-allocating
  nums.length = write;
  return write;
}

console.log("Compacted length:", removeDuplicatesFast(sample)); // 4
console.log("Compacted array:", sample); // [ 1, 2, 3, 4 ]
```

---

## 2. Move Zeroes (In-Place Compaction and Tail Flushing)

Given an array `nums`, move all `0`s to the end of the array while maintaining the relative order of the non-zero elements.

```javascript
// Node.js code
function moveZeroes(nums) {
  let write = 0;

  // Pass 1: Compact non-zero elements to the front
  for (let read = 0; read < nums.length; read++) {
    if (nums[read] !== 0) {
      nums[write] = nums[read];
      write++;
    }
  }

  // Pass 2: Flush remaining trailing slots with zeroes
  while (write < nums.length) {
    nums[write] = 0;
    write++;
  }

  return nums;
}

const data = [0, 1, 0, 3, 12];
console.log("Move Zeroes:", moveZeroes(data)); // [ 1, 3, 12, 0, 0 ]
```

#### Execution Trace: `moveZeroes([0, 1, 0, 3, 12])`

| `read` | `nums[read]` | Condition `!= 0` | Action Taken | Array State | `write` |
|---|---|---|---|---|---|
| `0` | `0` | `false` | None | `[0, 1, 0, 3, 12]` | `0` |
| `1` | `1` | `true` | `nums[0] = 1` | `[1, 1, 0, 3, 12]` | `1` |
| `2` | `0` | `false` | None | `[1, 1, 0, 3, 12]` | `1` |
| `3` | `3` | `true` | `nums[1] = 3` | `[1, 3, 0, 3, 12]` | `2` |
| `4` | `12` | `true` | `nums[2] = 12` | `[1, 3, 12, 3, 12]` | `3` |
| **Tail** | Fill zeros | `write < len` | `nums[3]=0, nums[4]=0` | `[1, 3, 12, 0, 0]` | `5` |

- **Time Complexity:** $O(n)$ — touches each element at most twice.
- **Auxiliary Space:** $O(1)$ — zero temporary arrays or heap allocations.

---

## 3. Trapping Rain Water: Two-Pointer Boundary Shrinkage

> **Boundary Shrinkage**: A convergence technique where the smaller of two outer boundary maxima (`leftMax`, `rightMax`) is processed first.

Given $n$ non-negative integers representing an elevation map where the width of each bar is 1, compute how much water can be trapped after raining.

```
       |           |   <- Water trapped between boundaries
   |   |   ~   ~   |
   +---+---+---+---+
```

Water trapped on top of any index $i$ is determined by:
$$\text{Water}[i] = \max(0, \min(\text{leftMax}, \text{rightMax}) - \text{height}[i])$$

#### The Two-Pointer Convergence Proof:
Maintain two outer boundaries: `left = 0, right = n - 1`, tracking `leftMax` and `rightMax`.
- If `height[left] < height[right]`:
  The water volume at index `left` is strictly bounded by `leftMax` (because `height[right]` guarantees that a taller or equal wall exists somewhere to the right). We can compute trapped water at `left` immediately:
  $$\text{water} += \max(0, \text{leftMax} - \text{height}[\text{left}])$$
  and advance **`left++`**.
- Otherwise:
  The water volume at index `right` is strictly bounded by `rightMax`. We compute water at `right` and decrement **`right--`**.

```javascript
// Node.js code
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

console.log("Trapped Water:", trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1])); // 6
```
- **Time Complexity:** $O(n)$ — each pointer moves inward until convergence.
- **Auxiliary Space:** $O(1)$ — replaces the two $O(n)$ prefix and suffix arrays with two integer variables.

---

## 4. Node.js In-Place Buffer Compaction for High-Throughput Streams

In networking and message protocol parsing (e.g., stripping escape bytes or delimiters from raw TCP payloads), allocating new `Buffer` slices via `.slice()` or `Buffer.concat()` causes memory fragmentation and triggers garbage collection pauses.

Using in-place read/write pointer compaction over a pre-allocated `Buffer` achieves optimal zero-copy performance:

```javascript
// Node.js code
// Compact buffer in place by removing null-byte delimiters (0x00)
function compactBufferInPlace(buf) {
  let write = 0;

  for (let read = 0; read < buf.length; read++) {
    if (buf[read] !== 0x00) {
      buf[write] = buf[read];
      write++;
    }
  }

  // Returns a subarray view of valid bytes without copying memory
  return buf.subarray(0, write);
}

const rawStream = Buffer.from([0x48, 0x00, 0x69, 0x00, 0x21]); // "H\0i\0!"
const clean = compactBufferInPlace(rawStream);
console.log("Compacted Buffer:", clean.toString()); // "Hi!"
```

---

## Tricky Points and Edge Cases

### 1. Duplicates Allowed at Most Twice (Remove Duplicates II)
When duplicates are allowed up to $k$ times (e.g., $k = 2$), compare the incoming `nums[read]` against `nums[write - k]`:

```javascript
// Node.js code
function removeDuplicatesII(nums) {
  if (nums.length <= 2) return nums.length;
  let write = 2;

  for (let read = 2; read < nums.length; read++) {
    // If incoming element differs from the element 2 spots back, it is valid!
    if (nums[read] !== nums[write - 2]) {
      nums[write] = nums[read];
      write++;
    }
  }

  nums.length = write;
  return write;
}

const nums2 = [1, 1, 1, 2, 2, 3];
console.log("Allowed at most twice length:", removeDuplicatesII(nums2)); // 5
console.log("Array state:", nums2); // [ 1, 1, 2, 2, 3 ]
```

### 2. Self-Assignment in Move Zeroes
When an array contains no zeroes (e.g., `[1, 2, 3]`), `read` and `write` advance at the exact same pace. Writing `nums[write] = nums[read]` causes redundant self-assignments. In performance-critical loops, guard with `if (read !== write) nums[write] = nums[read]`.

### 3. Trapping Rain Water on Monotonic Terrains
Terrain that is strictly ascending (`[1, 2, 3, 4]`) or strictly descending (`[4, 3, 2, 1]`) cannot trap water. The two-pointer algorithm updates `leftMax` or `rightMax` on every iteration without accumulating water, returning `0` correctly.

---

## Hands-On Exercise

### Scenario
You are developing a telemetry ingestion filter for an IoT fleet gateway. Telemetry packets arrive in an array of sorted device IDs. Due to network retries, IDs appear multiple times. You must filter the list in place so that **each device ID appears at most twice**.

### Buggy Code
```javascript
// Node.js code
function filterTelemetryBuggy(packets) {
  // ❌ Bug 1: Compares nums[read] with nums[read - 1], which only tracks consecutive duplicates,
  // failing to track overall frequency in the compacted region!
  // ❌ Bug 2: Allocates intermediate arrays, violating O(1) space constraint.
  const result = [];
  let count = 1;
  for (let i = 0; i < packets.length; i++) {
    if (packets[i] === packets[i - 1]) count++;
    else count = 1;
    if (count <= 2) result.push(packets[i]);
  }
  return result;
}
```

### Acceptance Criteria
1. Mutate the input array in place in $O(n)$ time.
2. Auxiliary space must be strictly $O(1)$.
3. Allow each unique ID to appear at most twice.
4. Pass edge cases: arrays of length $\le 2$, all identical elements (`[1, 1, 1, 1]`), and strictly unique elements (`[1, 2, 3]`).

### Solution Code

```javascript
// Node.js code
import assert from "node:assert/strict";

function filterTelemetry(packets) {
  if (packets.length <= 2) return packets.length;

  let write = 2;

  for (let read = 2; read < packets.length; read++) {
    // Invariant: packets[read] is valid if it differs from the element
    // placed two positions back in the finalized written sequence.
    if (packets[read] !== packets[write - 2]) {
      packets[write] = packets[read];
      write++;
    }
  }

  packets.length = write; // In-place array truncation
  return write;
}

// Verification Tests
const test1 = [1, 1, 1, 2, 2, 3];
assert.equal(filterTelemetry(test1), 5);
assert.deepEqual(test1, [1, 1, 2, 2, 3]);

const test2 = [0, 0, 1, 1, 1, 1, 2, 3, 3];
assert.equal(filterTelemetry(test2), 7);
assert.deepEqual(test2, [0, 0, 1, 1, 2, 3, 3]);

const test3 = [1, 1, 1, 1];
assert.equal(filterTelemetry(test3), 2);
assert.deepEqual(test3, [1, 1]);

const test4 = [1, 2];
assert.equal(filterTelemetry(test4), 2);
assert.deepEqual(test4, [1, 2]);

console.log("✅ All in-place telemetry compaction assertions passed successfully!");
```

### Solution Explanation

1. **Window-Relative Invariant:** Comparing `packets[read]` with `packets[write - 2]` guarantees that no more than two identical elements can ever be copied into the output sequence.
2. **True In-Place Mutation:** Zero additional arrays are created. Setting `packets.length = write` immediately adjusts the backing store in V8.

---

## Summary

- The **Read/Write Pointer Pattern** mutates arrays in place in $O(n)$ time and $O(1)$ auxiliary space.
- Using `arr.splice(i, 1)` inside loops introduces $O(n^2)$ memory-copy penalties that freeze the event loop on large collections.
- **Move Zeroes** executes in two linear passes: compacting non-zero elements forward and flushing remaining trailing slots with zeroes.
- **Trapping Rain Water** uses two-pointer boundary shrinkage to evaluate water volume on the fly, eliminating $O(n)$ prefix/suffix arrays.
- Truncating arrays in place via `arr.length = write` updates the V8 array length without triggering heap allocations.

---

## Cheat Sheet

### Fast & Slow Pointer Patterns
| Pattern | Pointer Roles | Problem Example | Space Complexity |
|---|---|---|---|
| **Read / Write** | `read` scans input, `write` points to destination slot | Remove Duplicates, Move Zeroes | $O(1)$ |
| **K-Duplicate Filter** | Compare `nums[read]` with `nums[write - k]` | Remove Duplicates II ($k = 2$) | $O(1)$ |
| **Boundary Shrinkage**| `left` and `right` track `leftMax` and `rightMax` | Trapping Rain Water | $O(1)$ |
| **3-Way Partition** | `low` (for 0s), `mid` (scanner), `high` (for 2s) | Dutch National Flag / Sort Colors | $O(1)$ |

### Common Pitfalls
- **Using `splice()` for Deletions:** Incurring an $O(n)$ memory shift per deletion inside a loop.
- **Comparing with `read - 1` Instead of `write - 1`:** Fails when multiple consecutive duplicates have already been processed.
- **Self-Swap Overhead:** Swapping elements when `read === write` performs redundant memory assignments.
- **Off-by-One in Trapping Water:** Using `left <= right` causes an extra redundant comparison when `left === right`.

---

## Interview Questions

### 1. Why does calling `Array.prototype.splice()` inside a loop cause $O(n^2)$ performance degradation, and how do Read/Write pointers resolve this?

> **Read/Write Pointers**: A two-pointer pattern where a `read` pointer scans forward across all elements while a `write` pointer marks the destination of valid elements.

**Question:** Analyze the internal V8 memory behavior of calling `arr.splice(i, 1)` inside a loop and explain the mechanical advantage of Read/Write pointers.

**Answer:** 
In the V8 engine, arrays are stored in contiguous memory buffers. When `arr.splice(i, 1)` is called, the element at index $i$ is deleted. To maintain zero-based contiguous indexing, the JavaScript engine must copy and shift every remaining element from index $i + 1$ to $n - 1$ one slot to the left.
- In the worst case (e.g., deleting every element from an array of size $n$), the total memory copy operations equal:
  $$\sum_{i=1}^{n} (n - i) = \frac{n(n - 1)}{2} = O(n^2) \text{ operations}$$
For an array of 50,000 items, this triggers over 1.25 billion memory shifts, stalling the single-threaded Node.js event loop.

**The Read/Write Pointer Solution:**
The Read/Write pointer pattern uses two index markers:
1. A `read` pointer that moves forward through every element exactly once.
2. A `write` pointer that overwrites valid elements sequentially at the front of the array.
Each element is read once and written at most once, reducing total operations to strictly **$O(n)$ linear time** and **$O(1)$ space**.

---

### 2. What does this code return, and what is the exact state of `nums` after execution?

**Question:** Predict the output and explain the state of `nums`:
```javascript
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

**Answer:**
The function prints: `2 [ 2, 2, 2, 3 ]`.

**Explanation:**
1. **`i = 0`:** `nums[0] = 3 === val`. Condition is false; `k` remains `0`.
2. **`i = 1`:** `nums[1] = 2 !== val`. `nums[k] = nums[1] \to nums[0] = 2`. `k` becomes `1`. Array is now `[2, 2, 2, 3]`.
3. **`i = 2`:** `nums[2] = 2 !== val`. `nums[k] = nums[2] \to nums[1] = 2`. `k` becomes `2`. Array is `[2, 2, 2, 3]`.
4. **`i = 3`:** `nums[3] = 3 === val`. Condition is false; loop terminates.
5. The function returns `k = 2`, indicating that the first 2 elements (`nums[0]` and `nums[1]`) contain the valid filtered array `[2, 2]`. The remaining elements at index $\ge 2$ contain un-truncated trailing data.

---

### 3. How does the Two-Pointer approach for Trapping Rain Water compare to the Dynamic Programming prefix/suffix array approach?

**Question:** Compare time complexity, space complexity, and algorithmic invariants between Dynamic Programming and Two Pointers for Trapping Rain Water.

**Answer:** 
1. **Dynamic Programming Approach:**
   - **Mechanism:** Computes two auxiliary arrays:
     - `leftMax[i]`: the maximum height from index $0$ to $i$ ($O(n)$ space).
     - `rightMax[i]`: the maximum height from index $i$ to $n - 1$ ($O(n)$ space).
   - In a third pass, trapped water at index $i$ is calculated as $\min(\text{leftMax}[i], \text{rightMax}[i]) - \text{height}[i]$.
   - **Complexity:** $O(n)$ time, **$O(n)$ auxiliary space** (requires allocating two arrays of size $n$).
2. **Two-Pointer Approach (Optimal):**
   - **Mechanism:** Maintains pointers `left = 0, right = n - 1` and scalar variables `leftMax = 0, rightMax = 0`.
   - On each step, if `height[left] < height[right]`, the water at index `left` is determined solely by `leftMax` (since `height[right]` guarantees a taller or equal boundary exists to the right). It calculates water at `left` on the fly and advances `left++`. The symmetric logic applies when `height[right] <= height[left]`.
   - **Complexity:** $O(n)$ time, **$O(1)$ auxiliary space**.
- **Conclusion:** The Two-Pointer approach matches the $O(n)$ runtime of Dynamic Programming while eliminating memory allocations, making it strictly superior.

---

### 4. In high-throughput network programming with Node.js `Buffer`, why is in-place data compaction preferred over allocating new buffer slices?

**Question:** Analyze the memory allocation and garbage collection impact of in-place `Buffer` compaction versus `.slice()` or `Buffer.concat()` in Node.js backends.

**Answer:** 
1. **Heap Allocation Overhead:** In Node.js, `Buffer.slice()` or `buffer.subarray()` allocates a new JavaScript `Buffer` instance wrapper object on the V8 heap, while `Buffer.concat()` allocates a completely new underlying C++ memory buffer and copies bytes over.
2. **Garbage Collection Pressure:** If a high-volume TCP microservice processes 50,000 requests per second and allocates new buffer slices on each request to strip delimiters, millions of short-lived objects fill the V8 Young Generation heap. This triggers frequent minor GC scavenges and periodic major Mark-Sweep pauses, introducing latency jitter and spiking 99th-percentile (p99) response times.
3. **In-Place Compaction Advantage:** By utilizing Read/Write pointers over a pre-allocated pool buffer (`buf[write] = buf[read]`) and returning `buf.subarray(0, write)`, zero new native memory buffers are allocated. Byte manipulation occurs directly in existing memory, keeping garbage collection overhead near zero and maintaining consistent throughput.

---

<nav aria-label="Lecture navigation">

[Previous: Two Pointers: Opposing Pointers](day-11-two-pointers-opposing.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Sliding Window: Fixed Size](day-13-sliding-window-fixed-size.md)

</nav>
