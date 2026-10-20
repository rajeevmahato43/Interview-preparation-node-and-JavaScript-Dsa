# Day 07: Two Pointers: Fast & Slow

<nav aria-label="Lecture navigation">

[Previous: Two Pointers: Opposing & Symmetrical](day-06-two-pointers-opposing-and-symmetrical.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Sliding Window: Fixed Size](day-08-sliding-window-fixed-size.md)

</nav>

## Prerequisites

- [Day 02: JavaScript Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md) — Contiguous memory buffers, in-place index mutation, and zero-based offsets.
- [Day 06: Two Pointers: Opposing & Symmetrical](day-06-two-pointers-opposing-and-symmetrical.md) — Two pointer fundamentals and asymptotic complexity pruning.

---

## 1. What are Fast and Slow Pointers?

Unlike opposing pointers that start at opposite ends and converge inward, **Fast & Slow pointers** both start at the beginning of a collection and advance forward in the **same direction** at different speeds or under different conditions.

> **Fast & Slow Pointers**: An algorithmic technique where two index markers traverse an iterable in the same direction—either at differing velocities (e.g., $1\times$ vs $2\times$) or under differing conditional filters (Read pointer vs Write pointer)—to partition data in-place or detect cycles in $O(1)$ auxiliary space.

### The Shelf Organizer Analogy

Imagine organizing a messy bookshelf holding books and empty soda cans:
- You want to keep all books packed tightly on the left and throw all soda cans away.
- **The Slow Pointer (The Shelf Manager):** Points to the next empty spot on the left where a good book belongs.
- **The Fast Pointer (The Scout):** Walks quickly ahead, inspecting every item one by one.
- When the Scout spots an empty can, it ignores it and keeps walking.
- When the Scout spots a real book, it hands it to the Shelf Manager to place at `slow`, and the Shelf Manager steps one slot to the right (`slow++`).

```text
Fast & Slow Pointer Mechanics (In-Place Partition):
Initial:  [ 0,  1,  0,  3, 12 ], Target: Move Zeroes to End
          ▲
        slow = 0, fast = 0

Step 1:   fast = 0 (value 0). Zero detected! slow stays at 0. fast advances to 1.
          [ 0,  1,  0,  3, 12 ]
            ▲   ▲
          slow fast

Step 2:   fast = 1 (value 1). Non-zero! Swap with slow (0) -> slow++, fast++
          [ 1,  0,  0,  3, 12 ]
                ▲   ▲
              slow fast

Step 3:   fast = 2 (value 0). Zero detected! slow stays at 1. fast advances to 3.
          [ 1,  0,  0,  3, 12 ]
                ▲       ▲
              slow    fast

Step 4:   fast = 3 (value 3). Non-zero! Swap with slow (0) -> slow++, fast++
          [ 1,  3,  0,  0, 12 ]
                    ▲       ▲
                  slow    fast

Step 5:   fast = 4 (value 12). Non-zero! Swap with slow (0) -> slow++, fast++
          [ 1,  3, 12,  0,  0 ]  --> Done in O(n) time, O(1) space!
```

---

## 2. How Fast and Slow Pointers Works Step-by-Step

Fast and slow pointer problems divide into two major operational categories:

### Category 1: Read Pointer vs Write Pointer (Array Partitioning)
1. **Initialize:** `slow = 0` (boundary of processed valid data), `fast = 0` (current element scanner).
2. **Scan:** `fast` moves forward through every index from $0$ to $n - 1$.
3. **Filter:** When `arr[fast]` satisfies the retention rule (e.g., non-zero, unique, or non-target):
   - Overwrite or swap: `arr[slow] = arr[fast]`.
   - Expand valid boundary: `slow++`.
4. **Result:** The subarray `arr[0 ... slow - 1]` contains all valid elements in original relative order, with zero extra arrays created.

### Category 2: Tortoise & Hare (Cycle Detection & Middle Finding)
1. **Initialize:** `slow = 0` (Tortoise), `fast = 0` (Hare).
2. **Move:** On every iteration:
   - `slow` moves **1 step** forward ($v = 1$).
   - `fast` moves **2 steps** forward ($v = 2$).
3. **Cycle Invariant:** If a cycle of length $C$ exists, the distance between `fast` and `slow` closes by exactly 1 position on every step ($2 - 1 = 1$). They are guaranteed to collide in at most $C$ iterations after entering the loop.
4. **Middle Invariant:** In a linear sequence without cycles, when `fast` reaches the end (`fast >= n - 1`), `slow` is guaranteed to be sitting at the exact middle index $\lfloor n / 2 \rfloor$.

---

## 3. Pattern Recognition of Fast & Slow Pointers

Spot this pattern in technical screens within 30 seconds:

### 30-Second Problem Triggers
- **In-place array modification:** The problem states: *"Modify the array in-place with $O(1)$ extra memory."*
- **Filtering elements:** *"Remove all occurrences of value $val$."*
- **Deduplication:** *"Remove duplicates from a sorted array."*
- **Partitioning:** *"Move all zeroes to the end while preserving order."*
- **Linked list cycle or middle node:** *"Detect if a cycle exists"* or *"Find the middle of the linked list in one pass."*

### Problem Keywords to Look For
- *"In-place"*
- *"Do not allocate extra space for another array"*
- *"Relative order of elements should be kept the same"*
- *"Return the number of unique elements"*
- *"Detect cycle / Floyd's cycle-finding algorithm"*

### The 10^7 Operations Rule
- Using `arr.splice()` inside a loop to remove elements takes $O(n)$ work per removal, yielding an **$O(n^2)$ trap** that freezes on $n \ge 50,000$.
- Fast and Slow pointers process $n$ elements in a single linear pass ($O(n)$ time), completing $100,000$ operations in **under 2 milliseconds** in Node.js.

### When NOT to Use Fast & Slow Pointers
- **When relative order does not matter:** If removing elements and preserving order is unnecessary, you can simply swap the target element with the last element in $O(1)$ time.
- **When searching for symmetric pairs:** Palindromes or two-sum bounds require opposing pointers moving toward each other, not in the same direction.

---

## 4. Problem 1: Remove Duplicates from Sorted Array

### Problem Statement
Given an integer array `nums` sorted in **non-decreasing order**, remove the duplicates **in-place** such that each unique element appears only **once**. The relative order of the elements should be kept the same. Then return the number of unique elements in `nums`.

Consider the number of unique elements of `nums` to be `k`. To get accepted, you need to do the following things:
1. Change the array `nums` such that the first `k` elements of `nums` contain the unique elements in the order they were present in `nums` initially.
2. The remaining elements of `nums` are not important.
3. Return `k`.

- **Example 1:** `nums = [1, 1, 2]` $\to$ `k = 2`, `nums = [1, 2, _]`
- **Example 2:** `nums = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]` $\to$ `k = 5`, `nums = [0, 1, 2, 3, 4, _, _, _, _, _]`
- **Constraints:** $1 \le nums.length \le 3 \times 10^4$, $-100 \le nums[i] \le 100$, `nums` is sorted in non-decreasing order.

---

### Step 1: Physical Simulation

Lay out cards on a table:
`[ 0, 0, 1, 1, 1, 2, 2, 3, 3, 4 ]`

1. The first card `0` is always unique. Keep it at slot 0.
2. Place your left finger (`slow`) at slot 0 (last known unique card).
3. Place your right finger (`fast`) at slot 1 and scan to the right:
   - Card at `fast` is `0`. Matches card at `slow` (`0 === 0`). Duplicate! Skip it (`fast++`).
   - Card at `fast` is `1`. Does not match `0`! We found a brand-new unique card.
   - Advance your left finger to slot 1 (`slow++`) and place card `1` there.
   - Card at `fast` is `1`. Matches `nums[slow]`. Skip.
   - Card at `fast` is `1`. Matches `nums[slow]`. Skip.
   - Card at `fast` is `2`. New unique card! Advance `slow++` to slot 2 and write `2`.
4. When `fast` reaches the end of the deck, all unique cards sit packed from slot `0` to slot `slow`.
5. The total count of unique cards is `slow + 1`.

---

### Step 2: Brute Force Approach

The naive approach uses JavaScript's built-in `arr.splice()` to delete duplicates whenever they are found:

```javascript
// Node.js code
function removeDuplicatesBruteForce(nums) {
  let i = 0;
  while (i < nums.length - 1) {
    if (nums[i] === nums[i + 1]) {
      // ❌ HIDDEN BOTTLENECK: splice() shifts all subsequent elements left!
      nums.splice(i + 1, 1);
    } else {
      i++;
    }
  }
  return nums.length;
}
```

#### Complexity Analysis:
- **Time Complexity:** $O(n^2)$. The loop iterates up to $n$ times. Each `splice(i + 1, 1)` shifts up to $n$ items one slot to the left in contiguous memory ($O(n)$ work per deletion). Total operations: $\approx O(n^2)$.
- **Space Complexity:** $O(1)$.
- **Scale Failure:** For $n = 30,000$ with many duplicates, `splice()` causes millions of memory copies, taking over 1.2 seconds and freezing Node.js request threads.

---

### Step 3: Bottleneck

Why is the brute force so slow?
- Deleting an element from an array requires the CPU to shift every single remaining element to the left to close the gap.
- We perform this shift over and over for every single duplicate!
- **The Wasted Work:** Constantly shifting memory elements when we only care about where unique elements end up.

---

### Step 4: The Pattern Discovery

- Instead of deleting duplicates, **overwrite values in place**.
- Let `slow` point to the last unique element confirmed.
- Let `fast` scout ahead:
  - If `nums[fast] === nums[slow]`, it is a duplicate. Ignore it.
  - If `nums[fast] !== nums[slow]`, it is a new unique number. Increment `slow++` and copy `nums[slow] = nums[fast]`.
- No memory shifting. Zero deletions.
- Time drops from **$O(n^2)$ to $O(n)$**!

---

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(1) space fast and slow pointers
function removeDuplicates(nums) {
  if (nums.length === 0) return 0;

  // slow tracks the index of the last placed unique element
  let slow = 0;

  // fast scans through the array starting from index 1
  for (let fast = 1; fast < nums.length; fast++) {
    // Because the array is sorted, duplicates are strictly adjacent
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast]; // Overwrite next position with unique value
    }
  }

  // Length of unique prefix is slow index + 1
  return slow + 1;
}

// ❌ ANTI-PATTERN / COMMON BUG: Array.from(new Set(nums))
function removeDuplicatesAntiPattern(nums) {
  // FAILS INTERVIEW CRITERIA:
  // 1. Allocates O(n) heap memory for Set and new Array
  // 2. Does not mutate the original nums array in-place!
  const unique = Array.from(new Set(nums));
  for (let i = 0; i < unique.length; i++) {
    nums[i] = unique[i];
  }
  return unique.length;
}

// Example runs
const testArr1 = [1, 1, 2];
const k1 = removeDuplicates(testArr1);
console.log(`Unique count: ${k1}, Array prefix:`, testArr1.slice(0, k1));
// Unique count: 2, Array prefix: [ 1, 2 ]

const testArr2 = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4];
const k2 = removeDuplicates(testArr2);
console.log(`Unique count: ${k2}, Array prefix:`, testArr2.slice(0, k2));
// Unique count: 5, Array prefix: [ 0, 1, 2, 3, 4 ]

const testArr3 = [10];
const k3 = removeDuplicates(testArr3);
console.log(`Unique count: ${k3}, Array prefix:`, testArr3.slice(0, k3));
// Unique count: 1, Array prefix: [ 10 ]
```

#### Complexity Derivation:
- **Time Complexity:** $O(n)$. The `fast` pointer visits each index from $1$ to $n - 1$ exactly once. Each comparison and assignment is an $O(1)$ constant-time step. Total time is linear $O(n)$.
- **Space Complexity:** $O(1)$ auxiliary space. The operation modifies `nums` directly in memory using only two integer pointers (`slow` and `fast`).

---

## 5. Problem 2: Move Zeroes

### Problem Statement
Given an integer array `nums`, move all `0`'s to the end of it while maintaining the relative order of the non-zero elements.
**Note** that you must do this in-place without making a copy of the array.

- **Example 1:** `nums = [0, 1, 0, 3, 12]` $\to$ `[1, 3, 12, 0, 0]`
- **Example 2:** `nums = [0]` $\to$ `[0]`
- **Constraints:** $1 \le nums.length \le 10^4$, $-2^{31} \le nums[i] \le 2^{31} - 1$.

---

### Step 1: Physical Simulation

Place items on a conveyor belt:
`[ 0, 1, 0, 3, 12 ]`

1. `slow` stands at index 0 (the first slot waiting for a non-zero item).
2. `fast` walks along the belt from index 0 to 4:
   - At index 0, item is `0`. Not a keeper. Leave `slow` at index 0.
   - At index 1, item is `1`. Non-zero! Swap item at `fast` (1) with item at `slow` (0).
     Belt becomes: `[ 1, 0, 0, 3, 12 ]`.
     Advance `slow` to index 1.
   - At index 2, item is `0`. Skip.
   - At index 3, item is `3`. Non-zero! Swap item at `fast` (3) with item at `slow` (0).
     Belt becomes: `[ 1, 3, 0, 0, 12 ]`.
     Advance `slow` to index 2.
   - At index 4, item is `12`. Non-zero! Swap item at `fast` (4) with item at `slow` (0).
     Belt becomes: `[ 1, 3, 12, 0, 0 ]`.
     Advance `slow` to index 3.
3. Every non-zero item has been gathered on the left in original order, and all zeroes naturally bubbled to the right!

---

### Step 2: Brute Force Approach

The naive approach allocates an extra temporary array or uses `splice` + `push`:

```javascript
// Node.js code
function moveZeroesBruteForce(nums) {
  // ❌ O(n^2) approach using splice and push
  let count = 0;
  let i = 0;
  while (i < nums.length - count) {
    if (nums[i] === 0) {
      nums.splice(i, 1); // O(n) shift
      nums.push(0);      // O(1) push
      count++;
    } else {
      i++;
    }
  }
  return nums;
}
```

#### Complexity Analysis:
- **Time Complexity:** $O(n^2)$. Each `splice()` takes $O(n)$ time to shift all subsequent elements.
- **Space Complexity:** $O(1)$.
- **Scale Failure:** With $10^5$ items, `splice()` causes hundreds of millions of memory movements, triggering CPU throttling.

---

### Step 3: Bottleneck

- `splice(i, 1)` moves all items to the left, only for `push(0)` to place zero at the end.
- When an array has thousands of zeroes, we shift elements over and over again.
- **The Core Problem:** We are doing physical memory shifting instead of a simple two-element swap.

---

### Step 4: The Pattern Discovery

- Maintain a boundary `slow` that marks where the next non-zero number belongs.
- `fast` scans every element:
  - When `nums[fast] !== 0`, swap `nums[slow]` with `nums[fast]`, then increment `slow++`.
- If `nums[fast] === 0`, do nothing (`fast` moves ahead, `slow` stays put).
- By swapping non-zeroes into the `slow` slot:
  - Non-zero numbers preserve their exact relative order.
  - Zeroes are automatically pushed to the right.
- Runtime drops from **$O(n^2)$ to $O(n)$**!

---

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(1) space single-pass swap
function moveZeroes(nums) {
  let slow = 0; // Index where the next non-zero value should be placed

  for (let fast = 0; fast < nums.length; fast++) {
    if (nums[fast] !== 0) {
      // Swap non-zero element at fast with element at slow
      if (slow !== fast) {
        const temp = nums[slow];
        nums[slow] = nums[fast];
        nums[fast] = temp;
      }
      slow++;
    }
  }

  return nums;
}

// ❌ ANTI-PATTERN / COMMON BUG: Two-pass overwrite with zero fill
function moveZeroesTwoPass(nums) {
  let slow = 0;
  // Pass 1: Copy all non-zeroes to the front
  for (let fast = 0; fast < nums.length; fast++) {
    if (nums[fast] !== 0) {
      nums[slow++] = nums[fast];
    }
  }
  // Pass 2: Fill the rest with zeroes
  // SUB-OPTIMAL: Does 2 passes and unnecessary writes when nums is mostly non-zeroes
  while (slow < nums.length) {
    nums[slow++] = 0;
  }
  return nums;
}

// Example runs
console.log(moveZeroes([0, 1, 0, 3, 12])); // [ 1, 3, 12, 0, 0 ]
console.log(moveZeroes([0]));              // [ 0 ]
console.log(moveZeroes([1, 2, 3, 4, 5]));  // [ 1, 2, 3, 4, 5 ]
console.log(moveZeroes([0, 0, 0, 1]));     // [ 1, 0, 0, 0 ]
```

#### Complexity Derivation:
- **Time Complexity:** $O(n)$. Single `for` loop where `fast` runs from index $0$ to $n - 1$. Each swap takes $O(1)$ operations. Total operations: at most $n$ swaps.
- **Space Complexity:** $O(1)$ auxiliary space. Direct in-place mutation without allocating extra arrays or objects.

---

## 6. Under the Hood: V8 & Node.js

### 1. In-Place Swaps vs `splice()` De-optimization in V8

When you call `arr.splice(index, 1)` on a JavaScript array:
- V8 must invoke internal C++ memory movement routines (`memmove`), shifting every contiguous pointer slot to the left.
- In-place mutation using index access (`nums[slow] = nums[fast]`) compiles directly into a single assembly `MOV` instruction:
  ```assembly
  mov QWORD PTR [rax + rbx*8], rdx
  ```
- No memory shifting, no internal array resizing, and zero de-optimization from TurboFan JIT.

```text
V8 Memory Behavior:
arr.splice() -> Triggers C++ memmove -> Invalidates JIT fast path -> High CPU latency
arr[slow] = arr[fast] -> Single CPU MOV instruction -> 0 Allocations -> Pure 64-bit speed
```

### 2. Forward Cache Prefetching

CPUs have dedicated hardware prefetchers that recognize linear sequential memory access patterns:
- In Fast & Slow pointers, both `slow` and `fast` move **monotonically forward** through memory addresses ($0 \to 1 \to 2 \dots$).
- The CPU detects this forward stride and pre-loads the next cache line from RAM into L1/L2 cache before your code even reaches it.
- This results in a near **100% L1 cache hit rate**, executing up to 10x faster than algorithms that jump unpredictably across memory.

### 3. Node.js Stream Buffer Read/Write Pointers

The fast and slow pointer pattern is the exact architectural mechanism used in Node.js internal streaming buffers (`stream.Readable` and `Buffer`):
- Node.js maintains an internal memory chunk for socket data.
- A **Write Pointer** (`slow`) writes incoming TCP network packets into the buffer.
- A **Read Pointer** (`fast`) parses protocol headers and drains payload bytes.
- This circular or partitioned pointer mechanism allows Node.js to stream gigabytes of file and network I/O with zero heap allocation overhead.

---

## 7. Hands-On Exercise: Clean Event Stream De-duplication

### Scenario
You are developing a telemetry ingestion service in Node.js for IoT devices. Devices emit sensor pings that are pre-sorted by `deviceId`. Due to cellular network retries, the ingestion queue contains consecutive duplicate sensor readings. A previous developer implemented deduplication using `Array.prototype.filter()`, which caused heavy GC memory spikes under load. You must rewrite the deduplication function to operate **in-place in $O(n)$ time and $O(1)$ auxiliary space**.

### Buggy Code
```javascript
// Node.js code
function deduplicateSensorsBuggy(sensorReadings) {
  // ❌ PERFORMANCE BOTTLENECK:
  // 1. filter() allocates a brand-new array on the V8 heap.
  // 2. Comparing with index + 1 forces an extra allocation on each tick.
  return sensorReadings.filter((reading, idx, arr) => {
    return idx === 0 || reading.id !== arr[idx - 1].id;
  });
}
```

### Acceptance Criteria
1. Must deduplicate the input array **in-place** using Fast and Slow pointers.
2. Must preserve the first appearance of each unique sensor reading.
3. Must return the integer count $k$ of unique sensor readings.
4. Must not allocate a new array (`$O(1)$ auxiliary space`).
5. Must process $100,000$ readings in under 5 milliseconds.

### Solution Code

```javascript
// ✅ CORRECT: Optimal O(n) time, O(1) space in-place deduplication
function deduplicateSensorStream(readings) {
  if (!Array.isArray(readings) || readings.length === 0) {
    return 0;
  }

  // slow tracks the last confirmed unique sensor reading
  let slow = 0;

  // fast scouts ahead looking for the next unique reading
  for (let fast = 1; fast < readings.length; fast++) {
    if (readings[fast].id !== readings[slow].id) {
      slow++;
      readings[slow] = readings[fast]; // Overwrite next valid slot in-place
    }
  }

  // Return count of unique elements
  return slow + 1;
}

// Example runs
const sensorBatch = [
  { id: 101, temp: 21.5 },
  { id: 101, temp: 21.5 }, // duplicate
  { id: 102, temp: 22.1 },
  { id: 103, temp: 19.8 },
  { id: 103, temp: 19.9 }, // duplicate id
  { id: 104, temp: 20.0 }
];

const uniqueCount = deduplicateSensorStream(sensorBatch);
console.log(`Unique Sensor Count: ${uniqueCount}`);
console.log("Processed Valid Readings:", sensorBatch.slice(0, uniqueCount));

// Benchmark test: 100,000 sensor readings
const largeBatch = [];
for (let i = 0; i < 100000; i++) {
  largeBatch.push({ id: Math.floor(i / 3), temp: 20.0 + (i % 5) });
}

const start = Date.now();
const count = deduplicateSensorStream(largeBatch);
const elapsed = Date.now() - start;
console.log(`Processed 100,000 readings down to ${count} unique in ${elapsed}ms!`);
```

---

## 8. Tricky Points and Edge Cases

### 1. The Empty or Single-Element Array
- If `nums.length === 0`, return `0` immediately.
- If `nums.length === 1`, the loop from `fast = 1` never executes, and `slow + 1` correctly returns `1`. Always guard with an early return:
  ```javascript
  if (nums.length <= 1) return nums.length;
  ```

### 2. Off-by-One in Return Values (`slow` vs `slow + 1`)
- `slow` is an **array index** (0-based).
- `k` is an **element count** (length).
- If unique elements occupy indices `0, 1, 2`, the count is $2 + 1 = 3$. Returning `slow` instead of `slow + 1` will cut off the final unique element!

### 3. Avoiding Unnecessary Self-Swaps
In `moveZeroes`, if the array contains no zeroes (e.g., `[1, 2, 3]`), `slow` and `fast` will be at the exact same index. Adding `if (slow !== fast)` prevents useless self-swapping operations.

---

## 9. Comprehensive Summary

- **Fast & Slow Pointers** move in the same direction, using one pointer to scout ahead and another pointer to write valid data or mark boundaries.
- **Eliminates Shifting Bottlenecks:** Replaces $O(n^2)$ array `splice()` operations with $O(n)$ in-place overwrites or swaps.
- **Zero Heap Allocations:** Keeps space complexity strictly at $O(1)$ by mutating the existing array buffer directly.
- **CPU Cache Optimization:** Monotonic forward strides maximize L1 cache prefetching, running significantly faster than non-linear data structures.
- **Node.js Production Reliability:** Avoids V8 GC heap spikes and event loop delays, ensuring predictable sub-millisecond response times.

---

## 10. Cheat Sheet

### Decision Table

| Problem Requirement | Target Complexity | Optimal Fast & Slow Strategy |
| :--- | :---: | :--- |
| **Remove duplicates from sorted array** | Time: $O(n)$, Space: $O(1)$ | If `nums[fast] !== nums[slow]`, `slow++`, `nums[slow] = nums[fast]` |
| **Remove all instances of a specific value $val$** | Time: $O(n)$, Space: $O(1)$ | If `nums[fast] !== val`, `nums[slow] = nums[fast]`, `slow++` |
| **Move zeroes to end in-place** | Time: $O(n)$, Space: $O(1)$ | If `nums[fast] !== 0`, swap `nums[slow]` and `nums[fast]`, `slow++` |
| **Find middle node of linked list** | Time: $O(n)$, Space: $O(1)$ | Tortoise ($1\times$) & Hare ($2\times$); when Hare hits end, Tortoise is at middle |
| **Detect cycle in linked list or sequence** | Time: $O(n)$, Space: $O(1)$ | Tortoise ($1\times$) & Hare ($2\times$); collision indicates a cycle |

### Common Pitfalls List
- **The Splice Trap:** Calling `arr.splice()` in a loop to remove elements $\to O(n^2)$ performance disaster.
- **The Set Memory Leak:** Using `new Set(nums)` on an array of 500,000 elements, consuming tens of megabytes of heap memory instead of in-place mutation.
- **Index vs Count Confusion:** Returning `slow` instead of `slow + 1` for element counts.
- **Unchecked Self-Assignment:** Writing `nums[slow] = nums[fast]` when `slow === fast` in dense non-zero arrays.

### Reusable Fast & Slow Partition Skeleton

```javascript
function fastSlowPartitionTemplate(arr, filterPredicate) {
  let slow = 0; // Boundary of kept elements

  for (let fast = 0; fast < arr.length; fast++) {
    if (filterPredicate(arr[fast])) {
      if (slow !== fast) {
        // Swap or overwrite depending on whether discarded elements matter
        const temp = arr[slow];
        arr[slow] = arr[fast];
        arr[fast] = temp;
      }
      slow++;
    }
  }

  return slow; // Returns count of kept elements
}
```

---

## 11. Interview Q&A

### 45-Second Technical Pitch
> *"The Fast and Slow pointer pattern partitions linear data structures in-place with O(n) runtime and strictly O(1) auxiliary space. By designating one pointer as a forward scout and another as an in-place write boundary, we eliminate the O(n^2) memory shifting overhead of array deletion methods like splice(). In Node.js backend systems, this avoids V8 heap allocations, maximizes CPU L1 cache prefetching, and keeps synchronous latency under two milliseconds."*

---

### 1. Why is `arr.splice()` inside a loop an $O(n^2)$ anti-pattern in Node.js?
**Answer:**
JavaScript arrays in the V8 engine are backed by contiguous memory buffers. When `splice(i, 1)` is called, V8 must shift every subsequent element from index $i + 1$ to $n - 1$ one slot to the left via internal memory copy operations. If an array of $n$ elements contains $O(n)$ matching items, executing `splice()` inside a loop performs $\approx \frac{n^2}{2}$ memory movements. For $n = 50,000$, this results in over 1 billion operations, blocking the Node.js event loop for seconds. Fast and Slow pointers replace shifting with direct overwrites in a single $O(n)$ pass.

---

### 2. How does Floyd's Tortoise and Hare algorithm guarantee cycle detection without infinite loops?
**Answer:**
Let the slow pointer advance 1 step per tick and the fast pointer advance 2 steps per tick. When both pointers enter a cycle of length $C$, let the distance from the slow pointer to the fast pointer along the cycle be $d$. On every subsequent tick, the slow pointer advances by 1, and the fast pointer advances by 2. The relative distance between them changes by:
$$\Delta \text{distance} = 2 - 1 = 1 \text{ step per tick}$$
Because the distance closes by exactly 1 on every step, the fast pointer will catch up to the slow pointer in at most $C - d$ ticks. It cannot skip over the slow pointer because integers modulo $C$ decrease by 1 continuously until reaching 0.

---

### 3. What will this code output, and what bug does it contain?
```javascript
function removeElement(nums, val) {
  let slow = 0;
  for (let fast = 0; fast < nums.length; fast++) {
    if (nums[fast] === val) {
      slow++;
    } else {
      nums[slow] = nums[fast];
    }
  }
  return slow;
}
const arr = [3, 2, 2, 3];
console.log(removeElement(arr, 3));
```
**Answer:**
It outputs `2`, but corrupts the array!
The condition is inverted: `slow` should advance when `nums[fast] !== val`. As written, when it encounters the target value `3`, it increments `slow` instead of ignoring it, and when it encounters non-target values (`2`), it overwrites the wrong slots. The correct pattern is:
```javascript
if (nums[fast] !== val) {
  nums[slow] = nums[fast];
  slow++;
}
```

---

### 4. How do in-place pointer algorithms improve memory management in Node.js microservices?
**Answer:**
Node.js processes run inside the V8 engine with a default memory ceiling (~1.4GB to 4GB). When microservices process large incoming JSON arrays using immutable functional chains (`.filter().map()`), V8 must allocate new arrays and objects on the heap. This triggers the V8 Garbage Collector (Scavenge and Mark-Sweep), which freezes the main thread during "Stop-The-World" GC pauses. In-place Fast and Slow pointer algorithms mutate the pre-existing buffer, creating **zero new heap allocations**, avoiding GC pauses completely, and keeping microservice response latencies flat.

---

## 12. Practice Problems

### 1. Remove Element - Easy
Given an integer array `nums` and an integer `val`, remove all occurrences of `val` in `nums` **in-place**. The order of the elements may be changed. Then return the number of elements in `nums` which are not equal to `val`.
- **Sample Input 1:** `nums = [3, 2, 2, 3]`, `val = 3`
- **Expected Output 1:** `2`, `nums = [2, 2, _, _]`
- **Sample Input 2:** `nums = [0, 1, 2, 2, 3, 0, 4, 2]`, `val = 2`
- **Expected Output 2:** `5`, `nums = [0, 1, 3, 0, 4, _, _, _]`
- **Sample Input 3:** `nums = [1]`, `val = 1`
- **Expected Output 3:** `0`, `nums = [_]`

### 2. Remove Duplicates from Sorted Array II - Medium
Given an integer array `nums` sorted in non-decreasing order, remove some duplicates in-place such that each unique element appears **at most twice**. The relative order of the elements should be kept the same.
- **Sample Input 1:** `nums = [1, 1, 1, 2, 2, 3]`
- **Expected Output 1:** `5`, `nums = [1, 1, 2, 2, 3, _]`
- **Sample Input 2:** `nums = [0, 0, 1, 1, 1, 1, 2, 3, 3]`
- **Expected Output 2:** `7`, `nums = [0, 0, 1, 1, 2, 3, 3, _, _]`
- **Sample Input 3:** `nums = [1, 2, 3]`
- **Expected Output 3:** `3`, `nums = [1, 2, 3]`

### 3. Sort Colors (Dutch National Flag) - Medium
Given an array `nums` with $n$ objects colored red, white, or blue, sort them **in-place** so that objects of the same color are adjacent, with the colors in the order red, white, and blue (represented by integers `0`, `1`, and `2`). You must solve this without using the library's sort function in $O(n)$ time and $O(1)$ space.
- **Sample Input 1:** `nums = [2, 0, 2, 1, 1, 0]`
- **Expected Output 1:** `[0, 0, 1, 1, 2, 2]`
- **Sample Input 2:** `nums = [2, 0, 1]`
- **Expected Output 2:** `[0, 1, 2]`
- **Sample Input 3:** `nums = [0]`
- **Expected Output 3:** `[0]`

---

<nav aria-label="Lecture navigation">

[Previous: Two Pointers: Opposing & Symmetrical](day-06-two-pointers-opposing-and-symmetrical.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Sliding Window: Fixed Size](day-08-sliding-window-fixed-size.md)

</nav>
