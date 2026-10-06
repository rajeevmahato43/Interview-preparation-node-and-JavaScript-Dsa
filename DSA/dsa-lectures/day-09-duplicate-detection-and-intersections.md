# Day 09: Duplicate Detection and Array Intersections

<nav aria-label="Lecture navigation">

[Previous: Group Anagrams and Frequency Vectors](day-08-group-anagrams-and-frequency-vectors.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Merge Sort and Quick Sort](day-10-merge-sort-and-quick-sort.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Select the optimal duplicate detection strategy among Hash Sets ($O(n)$ time, $O(n)$ space), In-Place Sorting ($O(n \log n)$ time, $O(1)$ space), and Index Negation ($O(n)$ time, $O(1)$ space).
- Implement both variants of array intersection: Unique Elements (Intersection I) and Frequency-Preserving (Intersection II).
- Optimize auxiliary memory by sizing frequency maps to the smaller array ($\min(n, m)$).
- Apply the **Bounded Sliding Window Set** pattern (Contains Duplicate II) to cap memory consumption at $O(k)$.
- Implement production stream deduplication and idempotency in Node.js using Redis atomic primitives (`SET NX EX`) and Bloom filters.

---

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Asymptotic analysis and auxiliary space.
- [Day 02: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md) — `Set` mechanics and reference equality.
- [Day 06: Frequency Counting and Hash Tables](day-06-frequency-counting-and-hash-tables.md) — Multi-set counting and map decrements.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
|---|---|---|
| **Set Membership** | A hash-indexed collection storing unique values with $O(1)$ average insertion, lookup, and deletion. | Replaces nested array searches (`.includes()`), dropping runtime from $O(n^2)$ to $O(n)$. |
| **Multiset Intersection** | An intersection operation that preserves element multiplicity based on the minimum frequency across both sets. | Requires a frequency map or sorted two pointers rather than a basic uniqueness `Set`. |
| **Bounded Window Set** | A `Set` that maintains at most $k$ elements by ejecting the oldest item whenever its size exceeds $k$. | Guarantees $O(\min(n, k))$ auxiliary space when evaluating proximity constraints ($|i - j| \le k$). |
| **Index Negation Pattern** | An in-place encoding trick using array signs as boolean visited flags when numbers fall in the range $[1, n]$. | Achieves $O(n)$ time and $O(1)$ extra space without allocating secondary sets or maps. |
| **Idempotency** | The property of an operation where applying it multiple times produces the identical result as applying it once. | Essential in Node.js message queues to filter duplicate webhook deliveries without data corruption. |

---

## Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             ARRAY INTERSECTION ARCHITECTURES                                │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  1. INTERSECTION I: UNIQUE COMMON ELEMENTS (LeetCode 349)
     nums1: [ 1, 2, 2, 1 ]  ──> Set1: { 1, 2 }
     nums2: [ 2, 2 ]        ──> Match against Set1 ──> Output: [ 2 ] (Unique set)

  2. INTERSECTION II: MULTISET / FREQUENCY-PRESERVING (LeetCode 350)
     nums1: [ 1, 2, 2, 1 ]  ──> Map1: { 1 => 2, 2 => 2 }
     nums2: [ 2, 2 ]        ──> Match & Decrement  ──> Output: [ 2, 2 ] (Full counts)

  3. BOUNDED WINDOW SET (Contains Duplicate II: |i - j| <= k)
     Window size k = 2
     [ 1,  2,  3,  1,  2,  3 ]
       └───┴───┘                 Set: { 1, 2, 3 } -> Delete nums[0]=1 -> Set: { 2, 3 }
           └───┴───┘             Probe nums[3]=1  -> Not in {2, 3}    -> Add 1 -> Set: { 2, 3, 1 }
```

### 1. Duplicate Detection Paradigms

When checking whether an array contains any duplicate values, choose the approach based on memory constraints:

| Technique | Time Complexity | Auxiliary Space | Mutates Input? | Best Used When |
|---|---|---|---|---|
| **Brute Force** | $O(n^2)$ | $O(1)$ | No | $n < 20$ elements |
| **In-Place Sort** | $O(n \log n)$ | $O(1)$ | Yes | Memory is strictly constrained |
| **Hash Set** | **$O(n)$** | **$O(n)$** | No | General-purpose optimal choice |
| **Index Negation** | $O(n)$ | $O(1)$ | Yes (reversibly) | Numbers strictly bounded to range $[1, n]$ |

```javascript
// Node.js code
"use strict";

// ❌ ANTI-PATTERN: Nested loop duplicate search (O(n^2) time)
function containsDuplicateSlow(nums) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] === nums[j]) return true;
    }
  }
  return false;
}

// ✅ PATTERN: Set-based early exit (O(n) time, O(n) space)
function containsDuplicateFast(nums) {
  const seen = new Set();
  for (const num of nums) {
    if (seen.has(num)) return true; // Early termination on first duplicate
    seen.add(num);
  }
  return false;
}

console.log(containsDuplicateFast([1, 2, 3, 1])); // true
console.log(containsDuplicateFast([1, 2, 3, 4])); // false
```

---

### 2. Intersection of Two Arrays: Unique vs Frequency-Preserving

#### Pattern A: Intersection I — Unique Common Elements (LeetCode 349)
Each element in the result must be unique, and results may appear in any order.

```javascript
// Node.js code
function intersectionUnique(nums1, nums2) {
  // Always build set on smaller array to optimize memory: O(min(n, m))
  if (nums1.length > nums2.length) {
    return intersectionUnique(nums2, nums1);
  }

  const set1 = new Set(nums1);
  const resultSet = new Set();

  for (const num of nums2) {
    if (set1.has(num)) {
      resultSet.add(num);
    }
  }

  return Array.from(resultSet);
}

console.log(intersectionUnique([1, 2, 2, 1], [2, 2])); // [ 2 ]
```
- **Time Complexity:** $O(n + m)$.
- **Auxiliary Space:** $O(\min(n, m))$ for `set1`.

#### Pattern B: Intersection II — Preserving Frequencies (LeetCode 350)
Each element must appear as many times as it appears in **both** arrays.

```javascript
// Node.js code
function intersect(nums1, nums2) {
  // Optimize space by building frequency map on the smaller array
  if (nums1.length > nums2.length) {
    return intersect(nums2, nums1);
  }

  const counts = new Map();
  for (const num of nums1) {
    counts.set(num, (counts.get(num) || 0) + 1);
  }

  const result = [];
  for (const num of nums2) {
    const available = counts.get(num) || 0;
    if (available > 0) {
      result.push(num);
      counts.set(num, available - 1); // Decrement shared inventory
    }
  }

  return result;
}

console.log(intersect([1, 2, 2, 1], [2, 2])); // [ 2, 2 ]
```
- **Time Complexity:** $O(n + m)$.
- **Auxiliary Space:** $O(\min(n, m))$ for the frequency `Map`.

---

### 3. Pre-Sorted Arrays: The Two-Pointer Intersection Alternative

If both input arrays are already sorted, we can avoid allocating a hash map entirely by using the **Two-Pointer technique**, reducing auxiliary space from $O(n)$ to $O(1)$.

```javascript
// Node.js code
function intersectSorted(nums1, nums2) {
  let p1 = 0;
  let p2 = 0;
  const result = [];

  while (p1 < nums1.length && p2 < nums2.length) {
    if (nums1[p1] === nums2[p2]) {
      result.push(nums1[p1]);
      p1++;
      p2++;
    } else if (nums1[p1] < nums2[p2]) {
      p1++; // Advance smaller pointer
    } else {
      p2++; // Advance smaller pointer
    }
  }

  return result;
}

console.log(intersectSorted([1, 1, 2, 2], [2, 2])); // [ 2, 2 ]
```
- **Time Complexity:** $O(n + m)$.
- **Auxiliary Space:** $O(1)$ (excluding output array).

---

### 4. Proximity Deduplication: Bounded Sliding Window Set (Contains Duplicate II)

Given an array `nums` and an integer `k`, determine if there are two distinct indices $i$ and $j$ such that `nums[i] === nums[j]` and $|i - j| \le k$.

Instead of caching all historical indices in an unbounded map, maintain a **Sliding Window Set** that contains at most $k$ elements. Eject elements older than $k$ positions:

```javascript
// Node.js code
function containsNearbyDuplicate(nums, k) {
  const windowSet = new Set();

  for (let i = 0; i < nums.length; i++) {
    // 1. If current element is in our window of size <= k, duplicate is found!
    if (windowSet.has(nums[i])) {
      return true;
    }

    // 2. Add current element to the window
    windowSet.add(nums[i]);

    // 3. Keep window size <= k by deleting the element that fell outside the window
    if (windowSet.size > k) {
      windowSet.delete(nums[i - k]);
    }
  }

  return false;
}

console.log(containsNearbyDuplicate([1, 2, 3, 1], 3)); // true (indices 0 and 3, diff = 3 <= 3)
console.log(containsNearbyDuplicate([1, 2, 3, 1, 2, 3], 2)); // false (diff = 3 > 2)
```
- **Time Complexity:** $O(n)$.
- **Auxiliary Space:** $O(\min(n, k))$ — memory is capped by $k$, not $n$.

---

## Tricky Points and Edge Cases

### 1. The GC Freeze Hazard of `[...new Set(arr)]` in Node.js
While `[...new Set(arr)]` is concise, executing it on an array of 5,000,000 items in a Node.js API endpoint causes performance degradation:
1. `new Set(arr)` allocates ~350 MB of hash buckets.
2. `[...set]` immediately allocates a separate 5,000,000-element array (~200 MB).
3. The simultaneous allocation of ~550 MB triggers a major Mark-Sweep Garbage Collection pause, freezing the single-threaded event loop for 200–500 ms and spiking HTTP request latencies.
For massive datasets, process items via streams or offload deduplication to external databases.

### 2. Sizing Optimizations: Swapping Smaller Array First
In intersection algorithms, always initialize the lookup structure using the **smaller array**:
```javascript
if (nums1.length > nums2.length) return intersect(nums2, nums1);
```
If `nums1` has 1,000,000 items and `nums2` has 10 items, building the map on `nums2` consumes only 10 entries of memory instead of 1,000,000 entries.

---

## Hands-On Exercise

### Scenario
You are building an in-memory audit validator for an inventory system. You are given an array `nums` of $n$ integers where each integer is in the range $[1, n]$. Some elements appear twice, while others appear once.

You must return an array of all integers in the range $[1, n]$ that do not appear in `nums`.

### Buggy Code
```javascript
// Node.js code
function findDisappearedNumbersBuggy(nums) {
  const result = [];
  // ❌ Bug 1: nums.includes() scans the entire array on every loop step!
  // Time complexity is O(n^2), timing out on arrays with 100,000 elements.
  for (let i = 1; i <= nums.length; i++) {
    if (!nums.includes(i)) {
      result.push(i);
    }
  }
  return result;
}
```

### Acceptance Criteria
1. Must execute in strictly $O(n)$ time.
2. Implement **Level 1** using a `Set` ($O(n)$ auxiliary space).
3. Implement **Level 2** using in-place sign negation, running in $O(n)$ time with **$O(1)$ auxiliary space** (modifying the input array).

### Solution Code

```javascript
// Node.js code
import assert from "node:assert/strict";

// Level 1: Hash Set Approach (O(n) time, O(n) space)
function findDisappearedNumbersSet(nums) {
  const seen = new Set(nums);
  const result = [];

  for (let i = 1; i <= nums.length; i++) {
    if (!seen.has(i)) {
      result.push(i);
    }
  }

  return result;
}

// Level 2: In-Place Index Negation (O(n) time, O(1) auxiliary space)
function findDisappearedNumbersInPlace(nums) {
  // Use each number's magnitude as an index pointer: mark nums[idx] negative
  for (let i = 0; i < nums.length; i++) {
    const targetIdx = Math.abs(nums[i]) - 1;
    if (nums[targetIdx] > 0) {
      nums[targetIdx] = -nums[targetIdx];
    }
  }

  const result = [];
  // Indices that remain positive were never visited (their numbers were missing)
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] > 0) {
      result.push(i + 1);
    }
  }

  return result;
}

// Verification Tests
const sample1 = [4, 3, 2, 7, 8, 2, 3, 1];
assert.deepEqual(findDisappearedNumbersSet(sample1), [5, 6]);

const sample2 = [4, 3, 2, 7, 8, 2, 3, 1];
assert.deepEqual(findDisappearedNumbersInPlace(sample2), [5, 6]);

// Edge Cases: No missing numbers
assert.deepEqual(findDisappearedNumbersSet([1, 2, 3]), []);
assert.deepEqual(findDisappearedNumbersInPlace([1, 2, 3]), []);

// Edge Cases: All identical numbers
assert.deepEqual(findDisappearedNumbersInPlace([2, 2]), [1]);

console.log("✅ All disappeared numbers deduplication tests passed successfully!");
```

### Solution Explanation

1. **Set Approach (Level 1):** Inserting $n$ elements into a `Set` runs in $O(n)$ time. The subsequent loop checks numbers $1$ to $n$ against `seen.has()` in $O(1)$ average time.
2. **Index Negation Invariant (Level 2):** Because numbers are guaranteed to fall in the range $[1, n]$, each number maps directly to a valid 0-based array index: `idx = Math.abs(num) - 1`. By negating `nums[idx]`, the array acts as its own boolean bitset. Any index that remains positive at the end indicates that `index + 1` was never present in the input.

---

## Summary

- Hash Sets provide $O(1)$ average membership lookups, reducing duplicate detection from $O(n^2)$ to $O(n)$ time.
- **Intersection I** produces unique elements using Sets, while **Intersection II** preserves frequencies using map counters.
- When operating on pre-sorted arrays, the **Two-Pointer technique** finds intersections in $O(n + m)$ time with $O(1)$ auxiliary memory.
- The **Bounded Window Set** pattern (Contains Duplicate II) enforces proximity conditions while bounding memory to $O(k)$.
- When array values fall within $[1, n]$, the **Index Negation pattern** achieves $O(n)$ time and $O(1)$ auxiliary space without secondary allocations.

---

## Cheat Sheet

### Complexity Matrix
| Problem | Algorithm | Time Complexity | Auxiliary Space | Key Mechanism |
|---|---|---|---|---|
| Contains Duplicate | Hash Set | $O(n)$ | $O(n)$ | Early exit on `set.has()` |
| Contains Duplicate II | Bounded Set | $O(n)$ | $O(\min(n, k))$ | `windowSet.delete(nums[i - k])` |
| Intersection I (Unique) | Set Mapping | $O(n + m)$ | $O(\min(n, m))$ | Build `Set` on smaller array |
| Intersection II (Multi) | Frequency Map | $O(n + m)$ | $O(\min(n, m))$ | Decrement counts on match |
| Intersection (Sorted) | Two Pointers | $O(n + m)$ | $O(1)$ | Advance pointer with smaller value |
| Disappeared Numbers | Index Negation | $O(n)$ | $O(1)$ | `nums[abs(x) - 1] = -abs(...)` |

### Common Pitfalls
- **Unbounded Memory on Huge Streams:** Building unbounded Sets on streaming message queues triggers heap overflow; cap with an LRU or sliding window.
- **Map Sizing Inefficiency:** Building the frequency map on the larger array instead of swapping to `nums2` when $n \gg m$.
- **Window Index Calculation Bug:** Evicting `nums[i - k - 1]` instead of `nums[i - k]` in sliding-window sets.
- **Array Object Equality:** Expecting `new Set([[1], [1]]).size` to be `1`; reference types are compared by memory pointer identity.

---

## Interview Questions

### 1. If both input arrays are already sorted, how does the optimal strategy for Intersection of Two Arrays change?

**Question:** Compare the hash map approach against the two-pointer approach when finding the frequency-preserving intersection of two sorted arrays.

**Answer:** 
When the input arrays are unsorted, a Hash Map is required to achieve $O(n + m)$ time complexity, requiring $O(\min(n, m))$ auxiliary memory.

However, if both arrays are **already sorted**, the **Two-Pointer technique** is strictly superior:
1. Initialize two pointers: `p1 = 0` (for `nums1`) and `p2 = 0` (for `nums2`).
2. Compare the elements:
   - If `nums1[p1] === nums2[p2]`: Append the value to the result and advance both pointers (`p1++`, `p2++`).
   - If `nums1[p1] < nums2[p2]`: Advance `p1++` (since smaller elements cannot match subsequent larger values).
   - If `nums1[p1] > nums2[p2]`: Advance `p2++`.
3. Terminate when either pointer reaches the end of its respective array.

**Asymptotic Comparison:**
- **Time Complexity:** $O(n + m)$ — each element is inspected at most once.
- **Auxiliary Space:** **$O(1)$** — zero auxiliary hash tables or memory buffers are allocated. This eliminates garbage collection pressure in high-throughput Node.js microservices.

---

### 2. What does this code print, and why does the behavior occur?

**Question:** Predict the output of the following snippet and explain the underlying language mechanics:
```javascript
const seen = new Set();
seen.add([1, 2]);
seen.add([1, 2]);
console.log(seen.size, seen.has([1, 2]));
```

**Answer:**
The code prints: `2 false`.

**Explanation:**
1. In the ECMAScript specification, `Set.prototype.has()` and `Set.prototype.add()` evaluate uniqueness using the `SameValueZero` equality algorithm.
2. For JavaScript primitive values (numbers, strings, booleans), equality compares values directly. However, for non-primitive reference types (objects, arrays, functions), `SameValueZero` compares **memory pointer identity**.
3. Each array literal `[1, 2]` allocates a distinct object instance on the V8 heap at a unique memory address:
   - `const arr1 = [1, 2]` (Address $0x101$)
   - `const arr2 = [1, 2]` (Address $0x102$)
   - `const arr3 = [1, 2]` (Address $0x103$)
4. Because $0x101 \ne 0x102$, the `Set` treats them as two completely distinct elements, yielding `seen.size === 2`.
5. When `seen.has([1, 2])` executes, it checks against a newly created third array instance at address $0x103$, which does not match any existing reference pointer in the set, returning `false`.
- **Fix:** Serialize array values to primitive strings (e.g., `seen.add([1, 2].join(','))`).

---

### 3. How does the Bounded Sliding Window Set pattern optimize space in Contains Duplicate II ($|i - j| \le k$)?

**Question:** Implement Contains Duplicate II and explain why auxiliary memory scales with $O(\min(n, k))$ rather than $O(n)$.

**Answer:** 
The problem asks whether any two identical numbers exist within an index distance of $k$.
A naive hash map stores every observed element and its latest index:
```javascript
// Stores all n elements -> O(n) space
const map = new Map();
```
In contrast, the **Bounded Sliding Window Set** maintains a `Set` containing only the elements currently residing within the active $k$-element window:

```javascript
// Node.js code
function containsNearbyDuplicate(nums, k) {
  const window = new Set();

  for (let i = 0; i < nums.length; i++) {
    if (window.has(nums[i])) return true;

    window.add(nums[i]);

    // Keep the window bounded to size <= k
    if (window.size > k) {
      window.delete(nums[i - k]);
    }
  }

  return false;
}
```
**Space Optimization Analysis:**
At any step $i$, the element that was added $k + 1$ iterations ago (`nums[i - k]`) is removed from the set. Therefore, the set never contains more than $k$ elements. If $n = 10,000,000$ and $k = 50$, the unbounded approach allocates a hash map with 10 million entries (~400 MB RAM), whereas the sliding window approach never stores more than 50 numbers in memory ($< 1$ KB RAM). Hence, auxiliary space is strictly bounded to **$O(\min(n, k))$**.

---

### 4. How would you architect high-volume duplicate transaction detection in a Node.js microservice to prevent both event-loop freezes and memory exhaustion?

**Question:** A Node.js payment service processes 10,000 webhook events per second. How do you detect and reject duplicate transaction IDs without exhausting server RAM or causing event loop latency spikes?

**Answer:** 
**Why In-Memory Hash Sets Fail:**
1. **Memory Exhaustion:** Storing millions of transaction strings in a local `Set` within Node.js memory leads to V8 heap bloat, triggering frequent garbage collection pauses and eventually causing an Out-Of-Memory (OOM) process crash.
2. **Distributed Inconsistency:** Modern Node.js services run across multiple cluster workers and container replicas behind a load balancer. A local in-memory `Set` cannot detect duplicates routed to different application instances.

**Production Architecture:**
1. **Distributed Idempotency Cache via Redis:**
   Use a shared Redis cluster using the atomic `SET` command with conditional parameters:
   ```javascript
   // Node.js code
   async function processTransaction(txId, payload) {
     // SET key value NX (only if Not eXists) EX (expire in seconds)
     const acquired = await redis.set(`tx:${txId}`, "1", "NX", "EX", 86400);

     if (!acquired) {
       // Key already existed -> Duplicate request rejected!
       return { status: 409, message: "Duplicate transaction ignored" };
     }

     return executePayment(payload);
   }
   ```
2. **Probabilistic Pre-Filtering (Bloom Filter):**
   If Redis network latency becomes a bottleneck, place an in-memory **Bloom Filter** (e.g., using a fixed-size `SharedArrayBuffer` or Redis Bloom module) in front of the database. The Bloom filter uses constant memory ($O(1)$) to confirm with 100% certainty if a transaction ID has *never* been seen before, avoiding database lookups for fresh requests.

---

<nav aria-label="Lecture navigation">

[Previous: Group Anagrams and Frequency Vectors](day-08-group-anagrams-and-frequency-vectors.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Merge Sort and Quick Sort](day-10-merge-sort-and-quick-sort.md)

</nav>
