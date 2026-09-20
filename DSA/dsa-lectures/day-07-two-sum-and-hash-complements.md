# Day 07: Two Sum and Hash Map Complements

<nav aria-label="Lecture navigation">

[Previous: Frequency Counting and Hash Tables](day-06-frequency-counting-and-hash-tables.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Group Anagrams and Frequency Vectors](day-08-group-anagrams-and-frequency-vectors.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Master the **Complement Lookup Pattern** ($target - current$) to eliminate nested loops.
- Implement the canonical **Two Sum** in a single pass in $O(n)$ time and $O(n)$ auxiliary space.
- Handle tricky duplicate numbers without overwriting required indices in the hash table.
- Solve Two Sum variations: returning values vs indices, counting total pairs, and handling unsorted vs sorted arrays.
- Understand how cache lookups in Node.js mirror the complement pattern for fast relational matching.

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md)
- [Day 02: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md)
- [Day 06: Frequency Counting and Hash Tables](day-06-frequency-counting-and-hash-tables.md)

---

## Core Concepts

### 1. The Complement Insight

Suppose we are given `nums = [2, 7, 11, 15]` and `target = 9`.
The naive approach tests every pair `(nums[i], nums[j])` with nested loops:
```text
For i = 0 (2): compare with 7 (sum=9 -> match!)
Operations: (n * (n - 1)) / 2 = O(n^2) time
```

Instead of asking *"Does any future number add up to target?"*, invert the question:
> **"For this number $x$, does its complement ($target - x$) already exist in our history?"**

```text
Formula: complement = target - nums[i]

i=0: num = 2, complement = 9 - 2 = 7. Has 7 been seen? No. Store { 2: index 0 }
i=1: num = 7, complement = 9 - 7 = 2. Has 2 been seen? YES! (at index 0)
Match found: [0, 1] in O(n) time!
```

---

### 2. Single-Pass vs Two-Pass Hash Map

- **Two-Pass Hash Map**:
  1. Pass 1: Insert all `num -> index` into the map ($O(n)$).
  2. Pass 2: For each element, look up `map.get(target - num)`.
  *Hazard*: You must ensure `map.get(target - num) !== currentIndex` so an element cannot pair with itself (e.g. `target = 6, nums = [3]` must not return `[0, 0]`).
- **Single-Pass Hash Map (Optimal)**:
  Look up the complement *before* inserting the current element into the map. This automatically prevents an element from matching with itself and stops early the moment a pair is discovered.

```text
Array: [3, 2, 4], Target = 6

Step 1: num = 3. complement = 3. Map is empty. Insert { 3: 0 }.
Step 2: num = 2. complement = 4. Map has {3}. Insert { 2: 1 }.
Step 3: num = 4. complement = 2. Map HAS 2 (index 1)! Return [1, 2].
```

---

## Detailed Explanations & Node.js Relevance

### Index Caching with `Map` in JavaScript

In JavaScript, arrays can contain negative numbers, zeros, and numbers up to `Number.MAX_SAFE_INTEGER`.
When storing numbers as keys:
- Plain objects coerce all keys to strings: `{ 2: 0 }` stores property `"2"`.
- `new Map()` preserves numbers as primitive integer keys without string conversion overhead:
  ```js
  const seen = new Map(); // key: number, value: index
  seen.set(nums[i], i);
  ```

### Backend Relevance: In-Memory Joins
In Node.js backend development, you often fetch two disparate data sets from separate microservices or database tables (e.g. `Orders` and `Users`) without a direct SQL `JOIN`.
Nested looping through `orders` and `users` to match `order.userId === user.id` is an $O(n \times m)$ performance killer that blocks the event loop.
Using a hash map to index `users` by `id` reduces the join to $O(n + m)$ time.

---

## JavaScript Implementation & Tracing

### Problem: Two Sum (LeetCode 1)

Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. Exactly one solution exists; you may not use the same element twice.

```js
function twoSum(nums, target) {
  // Map stores: key = number, value = its index in nums
  const seen = new Map();

  for (let i = 0; i < nums.length; i++) {
    const currentNum = nums[i];
    const complement = target - currentNum;

    // Check if the complement was already seen in prior steps
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }

    // Record current number and its index
    seen.set(currentNum, i);
  }

  return []; // Fallback if no pair exists
}
```

### Step-by-Step Execution Trace

Input: `nums = [3, 2, 4]`, `target = 6`

| Step `i` | `currentNum` | `complement = 6 - num` | `seen.has(complement)?` | `seen` Map State (After Step) |
| :--- | :--- | :--- | :--- | :--- |
| `i = 0` | `3` | `3` | `false` | `{ 3 => 0 }` |
| `i = 1` | `2` | `4` | `false` | `{ 3 => 0, 2 => 1 }` |
| `i = 2` | `4` | `2` | **`true`** (index 1) | **Return `[1, 2]`** |

- **Time Complexity**: $O(n)$ where $n$ is `nums.length`. We perform at most $n$ lookups and insertions, each taking $O(1)$ average time.
- **Auxiliary Space**: $O(n)$ extra space to store up to $n$ entries in `seen`.

---

## Common Mistakes & Interview Traps

1. **Self-Pairing Trap**:
   ```js
   // WRONG: In a two-pass approach without an index check:
   for (let i = 0; i < nums.length; i++) {
     if (seen.has(target - nums[i])) return [i, seen.get(target - nums[i])];
   }
   // If nums = [3, 1], target = 6, 6 - 3 = 3 is found in the map at index 0 -> returns [0, 0]!
   ```
   *Fix*: Use single-pass insertion or check `seen.get(complement) !== i`.
2. **Handling Identical Values**:
   If `nums = [3, 3]`, `target = 6`:
   At `i = 0`, map is empty; `seen.set(3, 0)`.
   At `i = 1`, `complement = 3` is found in the map at index `0`. Returns `[0, 1]`. The single-pass approach handles duplicate numbers effortlessly.
3. **Sorting Unnecessarily**:
   Sorting an array first takes $O(n \log n)$ time and invalidates the original indices unless pairs are bundled with their original positions. If indices are requested, a hash map ($O(n)$) is superior.

---

## Tricky Points & Edge Cases

- **Negative Numbers and Zeroes**:
  `nums = [-1, -2, -3, -4, -5]`, `target = -8`:
  Complement: `-8 - (-3) = -5`. Arithmetic works identically with negative numbers.
- **Very Large Arrays in Node.js**:
  For an array of $10^6$ elements, `new Map()` will allocate ~40 MB of heap memory. This is completely safe in Node.js, whereas an $O(n^2)$ loop over $10^6$ elements would take days to complete.

---

## Practical Exercise

Implement `countPairsWithSum(nums, target)` which counts the total number of distinct pairs $(i, j)$ with $i < j$ such that `nums[i] + nums[j] === target`.
- **Constraint**: Array can have duplicates (e.g. `[1, 1, 1, 1]`, `target = 2` should return `6`).
- **Acceptance Criterion**: Must run in $O(n)$ time using a frequency map without nested loops.

---

## Summary

- The Complement pattern transforms pair-matching problems from $O(n^2)$ brute force to $O(n)$ linear time.
- Single-pass hash map searches previous elements before inserting the current one, naturally eliminating self-pairing and handling duplicates.
- JavaScript `Map` handles numerical keys cleanly without string conversion overhead.
- In backend services, building an in-memory index to join collections simulates the complement pattern and keeps event-loop latency minimal.

---

## Cheat Sheet

### Two Sum Comparison
| Approach | Time Complexity | Auxiliary Space | Preserves Indices? |
| :--- | :--- | :--- | :--- |
| Brute Force (Nested Loops) | $O(n^2)$ | $O(1)$ | Yes |
| Two-Pointer (Sort First) | $O(n \log n)$ | $O(1)$ (or $O(n)$ to copy) | Requires index tracking |
| **Single-Pass Hash Map** | **$O(n)$** | **$O(n)$** | **Yes (Direct)** |

### Core Algorithm Blueprint
```js
const seen = new Map();
for (let i = 0; i < nums.length; i++) {
  const comp = target - nums[i];
  if (seen.has(comp)) return [seen.get(comp), i];
  seen.set(nums[i], i);
}
```

---

## Interview Questions

### 1. Deep Definitions and Mental Models
**Question:** Explain the difference in trade-offs between solving Two Sum using a Hash Map versus using a Two-Pointer approach on a sorted array.
- **Expected answer shape:** A Hash Map solves Two Sum in $O(n)$ time and $O(n)$ space on unsorted data while naturally preserving original array indices. The Two-Pointer approach requires $O(n \log n)$ time to sort first, but runs with $O(1)$ extra memory. If the array is already sorted, Two-Pointer wins with $O(n)$ time and $O(1)$ auxiliary space.

### 2. Predict the Output and Trace Execution
**Question:** What does this function return for `nums = [3, 2, 4]` and `target = 6`?
```js
function test(nums, target) {
  const map = new Map();
  nums.forEach((n, i) => map.set(n, i));
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [i, map.get(diff)];
  }
}
```
- **Expected answer shape:** It incorrectly returns `[0, 0]`. At `i = 0`, `diff = 6 - 3 = 3`. Because the map already contains all numbers, `map.has(3)` is true, returning index 0 paired with itself. A check `map.get(diff) !== i` is required to fix it.

### 3. Implementation Exercise
**Question:** Implement `twoSumValues(nums, target)` that returns the two *values* (not indices) that sum to target, returning `null` if none exist. Optimize space by using a `Set`.
- **Expected answer shape:**
```js
function twoSumValues(nums, target) {
  const seen = new Set();
  for (const num of nums) {
    const complement = target - num;
    if (seen.has(complement)) return [complement, num];
    seen.add(num);
  }
  return null;
}
```

### 4. Debugging and Failure Analysis
**Question:** A junior developer uses an object `const seen = {}` for Two Sum: `seen[target - num] = i`. When testing with numbers like `0` or negative values, they write `if (seen[num]) return [seen[num], i]`. Why does this fail for index 0?
- **Expected answer shape:** In JavaScript, index `0` is falsy. If the complement was stored at index `0`, `seen[num]` evaluates to `0`, causing `if (0)` to evaluate as false. The check must be `if (seen[num] !== undefined)` or use `seen.has(num)` with a `Map`.

### 5. Design and Tradeoff Questions
**Question:** If `nums` contains 50 million integers and memory is capped at 50 MB, why can you not use the Hash Map approach, and how would you solve it?
- **Expected answer shape:** Storing 50 million entries in a JavaScript `Map` requires over 2 GB of RAM, causing an out-of-memory crash under a 50 MB limit. Instead, use an external sorting algorithm (disk-based merge sort) to sort the integers, and then stream through the sorted file using two pointers from both ends with $O(1)$ memory.

### 6. Senior Follow-ups: Node.js Concurrency
**Question:** In a Node.js microservice handling 5,000 requests/sec, an endpoint performs an in-memory Two Sum matching IDs from two payloads. How do you prevent event-loop latency spikes?
- **Expected answer shape:** Ensure payload sizes are capped ($N \le 1,000$). At $N \le 1,000$, an $O(n)$ hash map executes in $< 0.1$ ms on the V8 main thread. If payloads can be large ($N \ge 100,000$), offload the computation to a worker thread (`worker_threads`) so CPU-bound array hashing does not stall incoming HTTP connections.

<nav aria-label="Lecture navigation">

[Previous: Frequency Counting and Hash Tables](day-06-frequency-counting-and-hash-tables.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Group Anagrams and Frequency Vectors](day-08-group-anagrams-and-frequency-vectors.md)

</nav>
