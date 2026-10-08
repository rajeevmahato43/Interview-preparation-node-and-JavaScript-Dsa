# Day 27: Binary Search on Rotated Arrays and Peaks

<nav aria-label="Lecture navigation">

[Previous: Binary Search Bounds and Intervals](day-26-binary-search-bounds-and-intervals.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search on Solution Space](day-28-binary-search-on-solution-space.md)

</nav>
## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Asymptotic complexity.
- [Day 26: Binary Search Bounds and Intervals](day-26-binary-search-bounds-and-intervals.md) — Loop invariants and safe midpoint math.
---

## 1. The Sorted Half Invariant: Anatomy of Rotated Arrays

> **Sorted Half Invariant**: The structural property guaranteeing that splitting a rotated sorted array at any arbitrary midpoint always produces at least one normally sorted half.

A **rotated sorted array** is created by taking a strictly ascending array and circularly shifting its elements around a pivot index:
$$[0, 1, 2, 4, 5, 6, 7] \xrightarrow{\text{rotate at index 4}} [4, 5, 6, 7, 0, 1, 2]$$

When you inspect any arbitrary midpoint `mid` in a rotated sorted array, the following invariant holds:
> **At least one half of the array (either $[left \dots mid]$ or $[mid \dots right]$) is ALWAYS normally sorted in ascending order.**

```text
Array: [ 4 , 5 , 6 , 7 , 0 , 1 , 2 ]
         ▲           ▲             ▲
       left         mid          right

Left Half:  [ 4, 5, 6, 7 ] -> Strictly sorted! (nums[left] <= nums[mid])
Right Half: [ 7, 0, 1, 2 ] -> Contains rotation pivot.
```

#### Determining Which Half is Sorted
- If `nums[left] <= nums[mid]`: The **left half is normally sorted**.
- Otherwise (`nums[left] > nums[mid]`): The **right half is normally sorted**.

Once the sorted half is identified, testing whether `target` falls inside its boundary is trivial:
- If `target` is within the sorted range: Discard the other half.
- If `target` is outside the sorted range: Discard the sorted half and search the unsorted half.

---

## 2. Search in Rotated Sorted Array (LeetCode 33)

> **Rotated Sorted Array**: An array initially sorted in ascending order that has been circularly shifted around an unknown pivot index.

Given a rotated sorted array of distinct integers and a target value, find its index in $O(\log n)$ time.

```text
Decision Flowchart at Midpoint:
1. Does nums[mid] === target? Return mid!
2. Is Left Half Sorted? (nums[left] <= nums[mid])
   - Is target within [nums[left], nums[mid])?
     YES -> Search Left:  right = mid - 1
     NO  -> Search Right: left = mid + 1
3. Otherwise, Right Half MUST be sorted:
   - Is target within (nums[mid], nums[right]]?
     YES -> Search Right: left = mid + 1
     NO  -> Search Left:  right = mid - 1
```

```javascript
// Node.js code: Search in Rotated Sorted Array (LeetCode 33)

function searchRotated(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (nums[mid] === target) {
      return mid;
    }

    // Case 1: Left half is normally sorted
    if (nums[left] <= nums[mid]) {
      // Check if target lies within the sorted left interval
      if (nums[left] <= target && target < nums[mid]) {
        right = mid - 1; // Search left
      } else {
        left = mid + 1;  // Search right
      }
    }
    // Case 2: Right half is normally sorted
    else {
      // Check if target lies within the sorted right interval
      if (nums[mid] < target && target <= nums[right]) {
        left = mid + 1;  // Search right
      } else {
        right = mid - 1; // Search left
      }
    }
  }

  return -1;
}

console.log(searchRotated([4, 5, 6, 7, 0, 1, 2], 0)); // 4
console.log(searchRotated([4, 5, 6, 7, 0, 1, 2], 3)); // -1
```

---

## 3. Find Minimum in Rotated Sorted Array (LeetCode 153)

To locate the minimum element (the rotation inflection point) without a target value, compare `nums[mid]` against `nums[right]`.

```text
Comparing nums[mid] against nums[right]:

Scenario A: nums[mid] > nums[right]
Example: [ 4, 5, 6, 7, 0, 1, 2 ], mid = 3 (val 7), right = 6 (val 2)
7 > 2 -> The minimum MUST lie strictly to the right of mid!
Update: left = mid + 1.

Scenario B: nums[mid] <= nums[right]
Example: [ 6, 7, 0, 1, 2, 4, 5 ], mid = 3 (val 1), right = 6 (val 5)
1 <= 5 -> The right half is sorted; mid could be the minimum itself,
          or the minimum lies to the left of mid!
Update: right = mid. (Do NOT subtract 1, mid might be the answer!)
```

```javascript
// Node.js code: Find Minimum in Rotated Sorted Array

function findMin(nums) {
  let left = 0;
  let right = nums.length - 1;

  // Use left < right: loop terminates when left === right at the minimum!
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);

    if (nums[mid] > nums[right]) {
      // Inflection point is strictly to the right
      left = mid + 1;
    } else {
      // mid itself could be the minimum, or minimum is to the left
      right = mid;
    }
  }

  return nums[left];
}

console.log(findMin([3, 4, 5, 1, 2])); // 1
console.log(findMin([4, 5, 6, 7, 0, 1, 2])); // 0
```

---

## 4. Binary Search on Unsorted Data: Find Peak Element (LeetCode 162)

A **peak element** is an element strictly greater than its neighbors: `nums[i] > nums[i - 1]` and `nums[i] > nums[i + 1]`.

A common interview misconception is that binary search requires globally sorted arrays. **It does not.** Binary search only requires a **monotonic decision gradient** that guarantees the target exists in one half.

#### The Slope Climbing Invariant
Compare `nums[mid]` with `nums[mid + 1]`:
- If `nums[mid] < nums[mid + 1]`: We are on an **upward slope**. Because the array boundary is bounded by $-\infty$, following the ascent guarantees encountering a peak. Move right: `left = mid + 1`.
- If `nums[mid] > nums[mid + 1]`: We are on a **downward slope**. Either `mid` is the peak itself, or a peak exists to the left. Move left: `right = mid`.

```text
Slope Visualization:
        Peak
         /\
        /  \     /
       /    \   /
      ▲      ▲
     mid   mid+1  (nums[mid] < nums[mid+1] -> Peak MUST lie to the right!)
```

```javascript
// Node.js code: Find Peak Element in O(log n) time

function findPeakElement(nums) {
  let left = 0;
  let right = nums.length - 1;

  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);

    if (nums[mid] < nums[mid + 1]) {
      left = mid + 1; // Ascend right
    } else {
      right = mid;    // Descend left or mid is peak
    }
  }

  return left; // left === right points to a local peak!
}

console.log(findPeakElement([1, 2, 3, 1])); // Index 2 (value 3)
console.log(findPeakElement([1, 2, 1, 3, 5, 6, 4])); // Index 5 (value 6)
```

---

## Detailed Node.js Relevance: Consistent Hash Ring Routing

In distributed Node.js microservices (e.g., routing requests across Redis clusters, Memcached instances, or Cassandra shards), nodes are distributed on a **Consistent Hashing Ring**:

```text
Circular 32-bit Hash Space:
Node A (Token 1000) ──────► Node B (Token 5000) ──────► Node C (Token 9000)
         ▲                                                     │
         └────────────────── Circular Wrap ────────────────────┘
```

When an incoming HTTP request with key `user:42` hashes to token `6500`:
1. Node.js maintains an array of server hash tokens sorted ascending: `[1000, 5000, 9000]`.
2. Binary search identifies the first server with `token >= 6500` $\implies$ Node C (`9000`).
3. If a key hashes to `9500` (exceeding all servers), binary search wraps around to index `0` $\implies$ Node A (`1000`).
4. Using binary search, request partition routing executes in $O(\log N)$ time, scaling smoothly to thousands of distributed nodes.

---

## Tricky Points & Edge Cases

1. **Using `<` instead of `<=` in Sorted Check**:
   Writing `if (nums[left] < nums)` fails when `left === mid` (a two-element subarray). In that case, `nums[left] === nums`, but the left half is legitimately sorted. Always write `nums[left] <= nums`.
2. **Infinite Loops with `while (left <= right)` in Min/Peak Search**:
   Because `right` is set to `mid` (not `mid - 1`), using `while (left <= right)` causes an infinite loop when `left === right`. Min and Peak searches must use `while (left < right)`.
3. **The Duplicates Trap (LeetCode 81)**:
   If an array contains duplicates (`[1, 0, 1, 1, 1]`), `nums[left] === nums=== nums[right]`. It is mathematically impossible to know which half contains the pivot. You must increment `left++` and decrement `right--`, degrading worst-case time to $O(n)$.

---

## Hands-On Exercise

### Scenario: Zero-Allocation Shard Inflection Finder

In a Node.js distributed database client, shard partition boundaries are rotated during cluster rebalancing. Implement a zero-allocation `findRotationCount(shards)` function that returns the number of times a sorted array has been rotated (which equals the index of the minimum element).

### Buggy Code

```javascript
// ❌ BUGGY: Fails on unrotated arrays and loops infinitely on two elements
function buggyRotationCount(nums) {
  let left = 0;
  let right = nums.length - 1;

  // BUG 1: while (left <= right) loops infinitely because right = mid!
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    // BUG 2: Compares with nums[left] instead of nums[right], failing on unrotated arrays!
    if (nums> nums[left]) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return left;
}
```

### Acceptance Criteria

1. Returns the number of rotations in $O(\log n)$ time and $O(1)$ space.
2. Correctly returns `0` for unrotated arrays (`[1, 2, 3, 4, 5]`).
3. Avoids infinite loops using `while (left < right)` and `nums> nums[right]`.
4. Verified with comprehensive Node.js assertions across various rotation offsets.

### Solution Code

```javascript
// Node.js code: Robust Rotation Count Finder
const assert = require("assert");

function findRotationCount(nums) {
  let left = 0;
  let right = nums.length - 1;

  // Loop terminates when left === right at the minimum element index
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);

    // If mid element is strictly greater than right element,
    // the inflection point (minimum) must lie in the right half
    if (nums> nums[right]) {
      left = mid + 1;
    } else {
      // The right half is sorted; mid could be the minimum itself
      right = mid;
    }
  }

  // The index of the minimum element equals the number of circular rotations
  return left;
}

// Verification Tests
assert.strictEqual(findRotationCount([15, 18, 2, 3, 6, 12]), 2); // Minimum is 2 at index 2
assert.strictEqual(findRotationCount([7, 9, 11, 12, 5]), 4);      // Minimum is 5 at index 4
assert.strictEqual(findRotationCount([1, 2, 3, 4, 5]), 0);         // Unrotated array returns 0
assert.strictEqual(findRotationCount([2, 1]), 1);                  // Two elements rotated
assert.strictEqual(findRotationCount([1]), 0);                     // Single element

console.log("✅ All Rotation Count assertions passed successfully.");
```

### Solution Explanation

1. **Inflection Property**: In a circularly rotated array, the minimum element's index is exactly equal to the number of rotation shifts applied to the original array.
2. **Right-Comparison Invariant**: Comparing `nums` against `nums[right]` cleanly differentiates between sorted segments and segments containing the drop-off inflection point.

---

## Summary

- **Sorted Half Invariant**: Every split of a rotated sorted array yields at least one normally sorted half, identified via `nums[left] <= nums`.
- **Search Logic**: Test whether the target is bounded within the sorted half; if not, search the other half.
- **Find Minimum**: Compare `nums> nums[right]`. Use `while (left < right)` and set `right = mid` to preserve candidate roots.
- **Peak Finding on Unsorted Data**: Follow the upward slope (`nums< nums[mid + 1]`) to locate a local peak in $O(\log n)$ time.
- **Consistent Hashing**: Use rotated binary search to route request keys to server ring partitions in distributed Node.js tiers.

---

## Cheat Sheet & Common Pitfalls

### Rotated Array Search Invariants
```javascript
// Search Rotated Array (Target Search)
if (nums[left] <= nums) {
  if (nums[left] <= target && target < nums) right = mid - 1;
  else left = mid + 1;
} else {
  if (nums< target && target <= nums[right]) left = mid + 1;
  else right = mid - 1;
}

// Find Minimum / Inflection
while (left < right) {
  const mid = left + Math.floor((right - left) / 2);
  if (nums> nums[right]) left = mid + 1;
  else right = mid;
}
return nums[left];
```

### Common Pitfalls

| Mistake | Consequence | Correct Pattern |
| :--- | :--- | :--- |
| **`nums[left] < nums`** | Fails two-element arrays where `left === mid`. | Use `<=` to identify sorted left half. |
| **`right = mid - 1` in FindMin** | Discards `mid` when `mid` is the actual minimum. | Use `right = mid`. |
| **`while (left <= right)` in Peak/Min** | Infinite loop when `left === right`. | Use `while (left < right)`. |
| **Assuming $O(\log n)$ with duplicates** | Degrades to $O(n)$ when $L = M = R$. | Must increment/decrement bounds linearly. |

---

## Interview Questions

### 1. How can Binary Search find a peak in an unsorted array when it normally requires sorted data?

**Question:** Explain the theoretical principle that allows Binary Search to find a local peak in an unsorted array in $O(\log n)$ time.

**Answer:** 
Binary search does not strictly require globally sorted data; it requires a **monotonic decision criterion** that guarantees the existence of at least one valid answer in one of the two halves.

For peak finding:
1. We compare `nums` with `nums[mid + 1]`.
2. If `nums< nums[mid + 1]`: The sequence is rising toward the right. Since the problem defines array boundaries as $-\infty$ (`nums[-1] = nums[n] = -\infty`), continuing to the right is guaranteed to encounter a peak. Either the values continue rising until the boundary (in which case the boundary element is a peak), or they drop at some point (in which case the inflection point before the drop is a peak).
3. If `nums> nums[mid + 1]`: The sequence is dropping. By symmetric logic, a peak is guaranteed to exist to the left (or `mid` itself is a peak).

Because every step safely discards half the elements while preserving the existence of a peak, the algorithm terminates in $O(\log n)$ comparisons.

---

### 2. What is the output and execution trace of `findMin([3, 1])`?

**Question:** Trace the execution of `findMin` on the two-element array `nums = [3, 1]`.

**Answer:** 
The function returns `1`.

**Execution Trace:**
1. Initialization: `left = 0`, `right = 1`.
2. Iteration 1:
   - `left < right` ($0 < 1$) is `true`.
   - `mid = 0 + Math.floor((1 - 0) / 2) = 0`.
   - `nums= nums[0] = 3`.
   - `nums[right] = nums[1] = 1`.
   - Comparison: `nums> nums[right]` ($3 > 1$) is `true`.
   - Update: `left = mid + 1 = 1`.
3. Iteration 2:
   - `left < right` ($1 < 1$) evaluates to `false`.
   - Loop terminates.
4. Returns `nums[left] = nums[1] = 1`.

The algorithm correctly identifies `1` as the minimum without index out-of-bounds or infinite looping.

---

### 3. Why does the presence of duplicate elements degrade Rotated Array Search to $O(n)$ time?

**Question:** In Search in Rotated Sorted Array II (LeetCode 81), why does allowing duplicate elements degrade worst-case time complexity from $O(\log n)$ to $O(n)$?

**Answer:** 
When all elements are distinct, `nums[left] <= nums` uniquely identifies that the left half is sorted.
However, when duplicates exist, consider searching for `0` in:
$$\text{Array A: } [1, 1, 1, 0, 1] \quad (\text{inflection point in right half})$$
$$\text{Array B: } [1, 0, 1, 1, 1] \quad (\text{inflection point in left half})$$
In both arrays:
- `left = 0` (`nums[0] = 1`)
- `mid = 2` (`nums[2] = 1`)
- `right = 4` (`nums[4] = 1`)

Here, `nums[left] === nums=== nums[right] === 1`. There is no mathematical signal indicating whether the inflection point and target lie in the left half or the right half.

The only safe operation is to shrink the boundaries linearly: `left++` and `right--`. In the worst-case scenario where all elements except one are identical (e.g., searching for `0` in `[1, 1, 1, ..., 0, ..., 1]`), the algorithm must check elements one-by-one, degrading time complexity to $O(n)$.

---

### 4. How does a distributed Node.js service use binary search to route request keys in a consistent hashing ring?

> **Consistent Hashing Ring**: A circular keyspace where servers and data keys map to 32-bit tokens on a circular boundary.

**Question:** Explain how consistent hashing routing is implemented in Node.js using binary search over a circular token ring.

**Answer:** 
In consistent hashing, cache or database servers are assigned 32-bit integer tokens by hashing their hostnames (e.g., using MurmurHash or MD5).
1. **Ring Representation**: Maintain a sorted array of server tokens `ringTokens = [T_0, T_1, \dots, T_{k-1}]` and a hash map pairing each token to its server descriptor `{ host, port }`.
2. **Key Routing**: When a client issues a request with key `K`:
   - Compute hash token $H = \text{hash}(K)$.
   - Perform binary search (`searchInsert` / `lower_bound`) over `ringTokens` to find the smallest token $T_i \ge H$.
   - **Wrap-Around Handling**: If $H > T_{k-1}$ (greater than all server tokens), the search wraps around to index `0` ($T_0$), modeling the circular geometry of the ring.
3. **Complexity & Performance**: The routing decision runs in $O(\log k)$ time where $k$ is the number of server replicas. For 1,000 servers, routing requires $\approx 10$ comparisons, executing in microseconds on the Node.js event loop without blocking concurrent HTTP traffic.

---

<nav aria-label="Lecture navigation">

[Previous: Binary Search Bounds and Intervals](day-26-binary-search-bounds-and-intervals.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search on Solution Space](day-28-binary-search-on-solution-space.md)

</nav>
