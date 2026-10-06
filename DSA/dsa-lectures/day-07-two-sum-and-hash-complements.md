# Day 07: Two Sum and Hash Complements

<nav aria-label="Lecture navigation">

[Previous: Frequency Counting and Hash Tables](day-06-frequency-counting-and-hash-tables.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Group Anagrams and Frequency Vectors](day-08-group-anagrams-and-frequency-vectors.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Master the **Hash Complement Pattern** ($\text{complement} = \text{target} - \text{current}$) to eliminate quadratic nested loops ($O(n^2) \to O(n)$).
- Implement the canonical **Two Sum** in a single pass in $O(n)$ time and $O(n)$ auxiliary space.
- Distinguish between single-pass and two-pass hash table strategies, preventing self-pairing and duplicate overwrites.
- Solve Two Sum variations: returning original indices vs values, counting total pairs, and handling pre-sorted arrays with Two Pointers.
- Apply hash-indexed in-memory joins in Node.js microservices to merge detached dataset streams without blocking the event loop.

---

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Asymptotic complexity and memory scaling.
- [Day 02: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md) — JavaScript `Map` operations and key typing.
- [Day 06: Frequency Counting and Hash Tables](day-06-frequency-counting-and-hash-tables.md) — Hash bucket indexing and collision resolution.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
|---|---|---|
| **Hash Complement** | The calculated difference ($\text{target} - x$) required to satisfy a sum equality with value $x$. | Inverts forward pair searches into instantaneous $O(1)$ historical lookups. |
| **Self-Pairing Trap** | A bug where an element pairs with itself because the hash table is pre-populated with all indices. | Occurs in naive two-pass algorithms when testing numbers whose complement equals themselves ($6 - 3 = 3$). |
| **Single-Pass Hash Map** | An algorithm that checks for the complement before inserting the current element into the map. | Naturally prevents self-pairing, correctly handles duplicate numbers, and enables early termination. |
| **Falsy Index Bug** | Evaluating index existence via `if (map[key])` which evaluates index `0` as `false`. | Causes silent lookups failures when an answer index is `0`; resolved via `map.has(key)` or `map[key] !== undefined`. |
| **In-Memory Hash Join** | Indexing one relational dataset into a hash map by foreign key to join with another dataset in $O(n + m)$ time. | Replaces quadratic nested loops in Node.js backends when combining disparate microservice payloads. |

---

## Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           THE TWO SUM HASH COMPLEMENT PIPELINE                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Array: [ 3, 2, 4 ], Target = 6

  Iteration 0:
    Current: 3 | Complement = 6 - 3 = 3
    Check: seen.has(3)? No.
    Store: seen.set(3, index 0) ──> Map: { 3 => 0 }

  Iteration 1:
    Current: 2 | Complement = 6 - 2 = 4
    Check: seen.has(4)? No.
    Store: seen.set(2, index 1) ──> Map: { 3 => 0, 2 => 1 }

  Iteration 2:
    Current: 4 | Complement = 6 - 4 = 2
    Check: seen.has(2)? YES! -> Found at index 1.
    RETURN: [ seen.get(2), 2 ] ──> [ 1, 2 ]
```

### 1. Inverting Search: The Complement Insight

Given an array `nums = [2, 7, 11, 15]` and a target sum `target = 9`.

A brute-force solution checks every pair $(i, j)$ using nested loops:
$$\frac{n(n - 1)}{2} \text{ comparisons} = O(n^2) \text{ time}$$

Instead of searching forward into the array for each element's partner, we record what we have already visited and invert the question:
> *"For my current number $x$, does its complement ($\text{target} - x$) exist in our previously observed history?"*

Because hash map lookups take $O(1)$ average time, checking history for each of the $n$ elements yields an optimal **$O(n)$ overall runtime**.

---

### 2. Single-Pass vs Two-Pass Hash Map Architectures

#### The Two-Pass Flaw and the Self-Pairing Bug
In a two-pass approach:
1. Pass 1 inserts all `num => index` pairs into the map.
2. Pass 2 iterates through `nums` and checks `map.has(target - num)`.

If `nums = [3, 1]` and `target = 6`, at index `0` the complement is $6 - 3 = 3$. The map already contains `3` at index `0`. Without an explicit inequality guard (`map.get(complement) !== i`), the algorithm erroneously matches index `0` with itself, returning `[0, 0]`.

#### The Single-Pass Invariant (Optimal)
In a single-pass hash map:
- We check if the complement exists in the map **before** inserting the current element.
- Since the current element is not yet in the map, it can never match with itself.
- If duplicate numbers exist (e.g., `nums = [3, 3]`, `target = 6`), the first `3` is stored at index `0`. When the second `3` arrives at index `1`, its complement `3` is found in the map at index `0`, immediately returning `[0, 1]`.

```javascript
// Node.js code
"use strict";

// ❌ ANTI-PATTERN: Brute-Force Nested Loops (O(n^2) time, O(1) space)
function twoSumBruteForce(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}

// ✅ PATTERN: Single-Pass Hash Map (O(n) time, O(n) space)
function twoSumSinglePass(nums, target) {
  const seen = new Map(); // Key: number, Value: original index

  for (let i = 0; i < nums.length; i++) {
    const current = nums[i];
    const complement = target - current;

    // Check history prior to insertion (eliminates self-pairing)
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }

    seen.set(current, i);
  }

  return [];
}

console.log("Single-pass result:", twoSumSinglePass([3, 2, 4], 6)); // [1, 2]
```

---

### 3. Asymptotic Trade-Offs: Hash Map vs Sorted Two Pointers

| Technique | Time Complexity | Auxiliary Space | Index Preservation | Best Scenario |
|---|---|---|---|---|
| **Brute Force** | $O(n^2)$ | $O(1)$ | Preserves original indices | Tiny arrays ($n < 20$) |
| **Single-Pass Hash Map** | **$O(n)$** | **$O(n)$** | Preserves original indices | Unsorted arrays where indices are required |
| **Two-Pointer (Pre-Sorted)** | $O(n)$ | $O(1)$ | Lost unless index tuples tracked | Arrays that are already sorted |
| **Sort + Two-Pointer** | $O(n \log n)$ | $O(n)$ or $O(1)$ | Lost unless index tuples tracked | When values are required and memory is capped |

#### Two Sum II: Two-Pointer Approach on Sorted Inputs
If the problem guarantees that the array is already sorted, the two-pointer inward scan finds the pair in $O(n)$ time with zero extra memory:

```javascript
// Node.js code
function twoSumSorted(numbers, target) {
  let left = 0;
  let right = numbers.length - 1;

  while (left < right) {
    const currentSum = numbers[left] + numbers[right];

    if (currentSum === target) {
      return [left, right]; // Matched
    } else if (currentSum < target) {
      left++; // Need a larger sum
    } else {
      right--; // Need a smaller sum
    }
  }

  return [];
}

console.log("Sorted two-pointer result:", twoSumSorted([2, 7, 11, 15], 9)); // [0, 1]
```

---

### 4. Node.js Backend Application: In-Memory Relational Hash Join

In microservice architectures, an API aggregator service often retrieves related data from different backend services (e.g., an array of `orders` from an order service and an array of `users` from an auth service).

Joining these two arrays without SQL requires matching `order.userId === user.id`.

```javascript
// Node.js code
// ❌ ANTI-PATTERN: Nested loop join runs in O(n * m) time!
// For 10,000 orders and 10,000 users = 100,000,000 checks, stalling the event loop!
function joinOrdersSlow(orders, users) {
  return orders.map(order => {
    const user = users.find(u => u.id === order.userId);
    return { ...order, user };
  });
}

// ✅ PATTERN: Hash Map Join runs in O(n + m) time!
function joinOrdersFast(orders, users) {
  // Step 1: Index users by ID in O(m) time
  const userMap = new Map();
  for (const user of users) {
    userMap.set(user.id, user);
  }

  // Step 2: Join orders with instant O(1) lookups in O(n) time
  return orders.map(order => ({
    ...order,
    user: userMap.get(order.userId) || null
  }));
}
```

---

## Tricky Points and Edge Cases

### 1. The Falsy Index Zero Trap in JavaScript
When using a plain object or relying on truthiness to check index existence:

```javascript
// Node.js code
const seen = {};
seen[5] = 0; // Number 5 is at index 0

// ❌ BUG: 0 is falsy in JavaScript!
if (seen[5]) {
  console.log("Found!"); // Never runs because seen[5] === 0, which is falsy!
}

// ✅ FIX: Strict undefined comparison or Map.has()
if (seen[5] !== undefined) {
  console.log("Correctly identified index 0 via object property check");
}
```

### 2. Negative Targets and Operands
The complement formula $\text{target} - \text{current}$ handles negative integers and zeros without modification:
- `nums = [-3, 4, 3, 90]`, `target = 0`: At `-3`, complement is $0 - (-3) = 3$. At `3`, complement is $0 - 3 = -3$, successfully matching `[-3, 3]`.
- `nums = [-5, -2, -8]`, `target = -7`: At `-5`, complement is $-7 - (-5) = -2$, successfully matching `[-5, -2]`.

---

## Hands-On Exercise

### Scenario
You are building a peer-to-peer cryptocurrency order book matcher. You receive an array of trade amounts `trades`. You must find the total count of distinct trade pairs $(i, j)$ with $i < j$ whose combined volume equals a required settlement `target`.

Duplicate amounts may appear multiple times (e.g., three separate orders of `10`).

### Buggy Code
```javascript
// Node.js code
function countPairCombinationsBuggy(trades, target) {
  let count = 0;
  const seen = new Set();

  for (let i = 0; i < trades.length; i++) {
    const complement = target - trades[i];
    // ❌ Bug 1: A Set only tracks boolean existence, ignoring multiple identical trades!
    // ❌ Bug 2: Fails when multiple pairs share the same numerical value.
    if (seen.has(complement)) {
      count++;
    }
    seen.add(trades[i]);
  }

  return count;
}
```

### Acceptance Criteria
1. Return the exact count of valid index pairs $(i, j)$ with $i < j$ summing to `target`.
2. Must run in $O(n)$ time using a single frequency map pass.
3. Correctly calculate combinations for repeated elements (e.g., `[2, 2, 2]`, `target = 4` has 3 pairs).

### Solution Code

```javascript
// Node.js code
import assert from "node:assert/strict";

function countPairCombinations(trades, target) {
  const freq = new Map();
  let totalPairs = 0;

  for (const trade of trades) {
    const complement = target - trade;

    // If complement exists in history, current trade pairs with ALL previous instances
    if (freq.has(complement)) {
      totalPairs += freq.get(complement);
    }

    // Record or increment current trade frequency
    freq.set(trade, (freq.get(trade) || 0) + 1);
  }

  return totalPairs;
}

// Verification Tests
// Test 1: Simple distinct pairs
assert.equal(countPairCombinations([1, 2, 3, 4, 3], 6), 2); // (2, 4) and (3, 3)

// Test 2: Identical numbers: 4 items of value 1. Combinations = 4 * 3 / 2 = 6 pairs
assert.equal(countPairCombinations([1, 1, 1, 1], 2), 6);

// Test 3: No valid pairs
assert.equal(countPairCombinations([1, 5, 9], 100), 0);

// Test 4: Negative numbers and zeros
assert.equal(countPairCombinations([0, 0, 0], 0), 3); // (0,1), (0,2), (1,2)
assert.equal(countPairCombinations([-2, 5, -3, 8], 3), 2); // (-2, 5) and (-5 doesn't exist, etc.)

console.log("✅ All Two Sum pair frequency tests passed successfully!");
```

### Solution Explanation

1. **Cumulative Frequency Addition:** For each incoming number `trade`, every previously seen instance of `complement` forms a distinct valid pair $(i, j)$ where $i < j$. Therefore, we add `freq.get(complement)` directly to `totalPairs`.
2. **Strict $O(n)$ Time:** A single linear pass updates the frequency counter and tallies combinations in $O(1)$ average time per entry.

---

## Summary

- The **Hash Complement Pattern** transforms $O(n^2)$ pair searches into $O(n)$ linear algorithms by querying previously observed values.
- **Single-Pass Hash Maps** check for the complement prior to inserting the current element, avoiding self-pairing and resolving duplicate keys.
- If data is already sorted, the **Two-Pointer technique** finds pair sums in $O(n)$ time with $O(1)$ auxiliary space.
- In Node.js, `new Map()` avoids string coercion and prototype pollution when storing numerical keys.
- The hash complement pattern forms the algorithmic basis for in-memory relational joins between microservice datasets.

---

## Cheat Sheet

### Complexity Matrix
| Approach | Time | Space | Prerequisite | Notes |
|---|---|---|---|---|
| Brute Force | $O(n^2)$ | $O(1)$ | None | Quadratic; unsuitable for large datasets |
| Single-Pass `Map` | $O(n)$ | $O(n)$ | None | Best general-purpose approach for unsorted data |
| Two Pointers | $O(n)$ | $O(1)$ | Pre-sorted | Best for memory-constrained environments on sorted inputs |
| Sort + Two Pointers | $O(n \log n)$ | $O(1)$ or $O(n)$ | None | Useful when values are needed and memory is strictly limited |

### Common Pitfalls
- **Self-Pairing Bug:** Testing the complement against an already populated map containing the current element's index.
- **Falsy Index 0:** Checking `if (map[key])` instead of `if (map.has(key))` causes lookups for index `0` to fail.
- **Premature Sorting:** Sorting an array just to run two pointers destroys original index positions unless wrapped in index-value tuples.
- **Quadratic In-Memory Joins:** Using `.find()` inside a `.map()` to join collections in Node.js instead of building a hash index map.

---

## Interview Questions

### 1. What are the key algorithmic trade-offs between solving Two Sum with a Hash Map versus the Two-Pointer approach on a sorted array?

**Question:** Compare time complexity, space complexity, input preconditions, and index preservation between the Hash Map and Two-Pointer approaches for Two Sum.

**Answer:** 
1. **Hash Map Approach:**
   - **Time Complexity:** $O(n)$ average time on unsorted data.
   - **Space Complexity:** $O(n)$ auxiliary space to store elements in the hash table.
   - **Index Preservation:** Naturally preserves the original indices of the elements.
   - **Best used when:** The array is unsorted and index positions must be returned.
2. **Two-Pointer Approach:**
   - **Time Complexity:** $O(n)$ if the array is already sorted; $O(n \log n)$ if sorting is required beforehand.
   - **Space Complexity:** $O(1)$ auxiliary space if the array is sorted in place.
   - **Index Preservation:** Sorting reorders elements, destroying the original index mappings unless extra memory is spent storing `[value, originalIndex]` tuples ($O(n)$ space).
   - **Best used when:** The input array is already sorted or when auxiliary memory is strictly constrained ($O(1)$ memory requirement).

---

### 2. What does this code return for `nums = [3, 2, 4]` and `target = 6`, and why does it fail?

**Question:** Identify the bug in the following implementation and explain how to fix it:
```javascript
function twoSumBuggy(nums, target) {
  const map = new Map();
  nums.forEach((val, idx) => map.set(val, idx));

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [i, map.get(complement)];
    }
  }
}
```

**Answer:**
The function returns `[0, 0]`, which is incorrect.

**Explanation:**
This is the **Self-Pairing Trap** inherent to naive two-pass implementations. The first pass populates the map with all elements: `{ 3 => 0, 2 => 1, 4 => 2 }`.
When the loop begins at `i = 0`, `nums[0] = 3`. The complement is $6 - 3 = 3$. The function queries `map.has(3)`, which returns `true` because `3` was inserted during the first pass at index `0`. The function immediately returns `[0, 0]`, matching index `0` with itself.

**Fix:** Either add an index guard (`map.get(complement) !== i`), or switch to a **single-pass** approach where elements are inserted into the map only *after* checking for the complement.

---

### 3. How do you implement `twoSumValues(nums, target)` returning the two numbers (not indices) while minimizing memory overhead?

**Question:** Write an optimal JavaScript function that returns the two values that sum to `target` using a `Set` instead of a `Map`.

**Answer:** When only the values are required rather than the indices, storing values in an ES2015 `Set` reduces memory overhead compared to a `Map` (since keys and values do not need to be stored separately):

```javascript
// Node.js code
function twoSumValues(nums, target) {
  const seen = new Set();

  for (const num of nums) {
    const complement = target - num;

    if (seen.has(complement)) {
      return [complement, num]; // Found matching pair
    }

    seen.add(num);
  }

  return null; // No pair found
}

console.log(twoSumValues([10, 15, 3, 7], 17)); // [10, 7]
```
- **Time Complexity:** $O(n)$ average time.
- **Auxiliary Space:** $O(n)$ space within a compact `Set`.

---

### 4. If an unsorted dataset contains 50 million integers and memory is strictly capped at 50 MB, why does the Hash Map approach fail, and how do you solve it?

**Question:** Analyze the memory limits of solving Two Sum on 50 million integers in Node.js and describe an architecture that adheres to a 50 MB RAM budget.

**Answer:** 
**Why Hash Map Fails:**
In V8, each entry in a `Map` or `Set` consumes approximately 40 to 64 bytes of heap overhead (including hash bucket pointers and object wrappers). Storing 50 million entries requires:
$$50{,}000{,}000 \times 48\text{ bytes} \approx 2.4\text{ GB of RAM}$$
In an environment capped at 50 MB of memory, attempting to build this `Map` causes an Out-Of-Memory (OOM) crash.

**Architecture for 50 MB RAM (External Sort + Two Pointers):**
1. **Phase 1: External Merge Sort:**
   - Stream the 50 million integers from disk in 10 MB chunks.
   - Sort each chunk in memory using `arr.sort((a, b) => a - b)` and write the sorted runs to temporary files on disk.
   - Perform a K-way merge using streams and a small Min-Heap, producing a single, sorted 50-million-number file on disk.
2. **Phase 2: Streaming Two-Pointer Scan:**
   - Open two streaming readers on the sorted file: one at the start of the file (`left`) and one at the end of the file (`right`).
   - Read numbers sequentially from both ends:
     - If $\text{leftVal} + \text{rightVal} === \text{target}$, return the pair.
     - If $\text{leftVal} + \text{rightVal} < \text{target}$, advance the `left` file pointer forward.
     - If $\text{leftVal} + \text{rightVal} > \text{target}$, advance the `right` file pointer backward.
3. Total memory consumption remains bounded under **$O(1)$** buffer frames ($< 5\text{ MB}$), well within the 50 MB budget.

---

<nav aria-label="Lecture navigation">

[Previous: Frequency Counting and Hash Tables](day-06-frequency-counting-and-hash-tables.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Group Anagrams and Frequency Vectors](day-08-group-anagrams-and-frequency-vectors.md)

</nav>
