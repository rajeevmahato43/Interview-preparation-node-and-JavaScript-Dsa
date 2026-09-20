# Day 09: Duplicate Detection and Array Intersections

<nav aria-label="Lecture navigation">

[Previous: Group Anagrams and Frequency Vectors](day-08-group-anagrams-and-frequency-vectors.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Sorting Deep Dive: Merge Sort and Quick Sort](day-10-merge-sort-and-quick-sort.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Master **Set-based Membership Testing** to find duplicates in $O(n)$ time.
- Implement **Intersection of Two Arrays I** (unique common elements) and **Intersection II** (preserving frequencies).
- Solve the **Contains Duplicate II** problem using an $O(k)$ sliding window bounded `Set`.
- Choose between Set hashing ($O(n)$ time, $O(n)$ space) and two-pointer sorted intersection ($O(n \log n)$ time, $O(1)$ space).
- Apply duplicate filtering and deduplication in Node.js backend streams and caching systems.

## Prerequisites

- [Day 02: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md)
- [Day 06: Frequency Counting and Hash Tables](day-06-frequency-counting-and-hash-tables.md)

---

## Core Concepts

### 1. The Power of `Set` for Duplicate Detection

A JavaScript `Set` stores unique values with $O(1)$ average insertion, lookup, and deletion.
When an interview problem asks:
- *"Does this array contain any duplicates?"*
- *"Find all unique elements common to two datasets"*

Compare the three approaches:
1. **Brute Force ($O(n^2)$)**: Compare every pair `(i, j)`.
2. **Sort First ($O(n \log n)$)**: Sort array, then check if `arr[i] === arr[i+1]`. Extra space: $O(1)$.
3. **Hash Set ($O(n)$ time, $O(n)$ space)**: Add items to a `Set`. If `set.has(item)` is true, a duplicate is found immediately.

```text
Input: [1, 2, 3, 1]
Set State:
Read 1 -> set.add(1) -> Set { 1 }
Read 2 -> set.add(2) -> Set { 1, 2 }
Read 3 -> set.add(3) -> Set { 1, 2, 3 }
Read 1 -> set.has(1) === true! Duplicate detected! (Returns true in 4 steps)
```

---

### 2. Intersection: Unique vs Frequency-Preserving

There are two major variations of the intersection problem:

#### Variation 1: Unique Common Elements (LeetCode 349)
Each element in the result must be unique:
`nums1 = [1, 2, 2, 1]`, `nums2 = [2, 2]` $\to$ Output: `[2]`
- *Solution*: Store `nums1` in a `Set`. Iterate through `nums2`, collecting matches in a second `Set`.

#### Variation 2: Intersection Preserving Frequency (LeetCode 350)
Each element should appear as many times as it shows in **both** arrays:
`nums1 = [1, 2, 2, 1]`, `nums2 = [2, 2]` $\to$ Output: `[2, 2]`
- *Solution*: Build a frequency map of `nums1`. For each element in `nums2`, if its count in the map is $> 0$, push to the result and decrement its count.

---

## Detailed Explanations & Node.js Relevance

### Bounded Window Deduplication: Contains Duplicate II

Problem: Find if there exist two distinct indices $i$ and $j$ such that `nums[i] === nums[j]` and $|i - j| \le k$.

Instead of storing all numbers in an unbounded `Set` ($O(n)$ memory), we maintain a **Sliding Window of size $k$**:
```text
Window size k = 2
Array: [ 1, 2, 3, 1, 2, 3 ]

i=0: Set: { 1 }
i=1: Set: { 1, 2 }
i=2: Set: { 1, 2, 3 } (Size reaches k+1; delete oldest element nums[0]=1) -> Set: { 2, 3 }
i=3: nums[3]=1. set.has(1)? False. Set: { 2, 3, 1 } (Delete nums[1]=2) -> Set: { 3, 1 }
i=4: nums[4]=2. set.has(2)? False. Set: { 3, 1, 2 } ...
```
By deleting elements older than $k$ indices, auxiliary space is strictly bounded to $O(k)$!

### Backend Relevance: Stream Deduplication
In Node.js message queues (Kafka, RabbitMQ) and webhooks, messages can arrive with duplicates ("at-least-once" delivery).
To prevent duplicate processing without running out of RAM, developers maintain an LRU cache or a rolling TTL `Set` of the last $k$ processed message IDs.

---

## JavaScript Implementation & Tracing

### 1. Intersection of Two Arrays II (Preserving Frequencies)

```js
function intersect(nums1, nums2) {
  // Optimize space: always build frequency map on smaller array
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
      counts.set(num, available - 1);
    }
  }

  return result;
}
```

### 2. Contains Duplicate II (Sliding Window Set)

```js
function containsNearbyDuplicate(nums, k) {
  const windowSet = new Set();

  for (let i = 0; i < nums.length; i++) {
    // 1. If current element is in our window of size <= k, duplicate found!
    if (windowSet.has(nums[i])) {
      return true;
    }

    // 2. Add current element to window
    windowSet.add(nums[i]);

    // 3. Keep window size <= k by ejecting the oldest element
    if (windowSet.size > k) {
      windowSet.delete(nums[i - k]);
    }
  }

  return false;
}
```

### Step-by-Step Trace for `containsNearbyDuplicate`

Input: `nums = [1, 2, 3, 1]`, `k = 3`

| Index `i` | `nums[i]` | `windowSet.has(nums[i])` | Add to Set | `windowSet.size > k`? | `windowSet` State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `0` | `1` | `false` | Add 1 | No ($1 \le 3$) | `{ 1 }` |
| `1` | `2` | `false` | Add 2 | No ($2 \le 3$) | `{ 1, 2 }` |
| `2` | `3` | `false` | Add 3 | No ($3 \le 3$) | `{ 1, 2, 3 }` |
| `3` | `1` | **`true`** | Match found! | Return `true` | (Finished) |

- **Time Complexity**: $O(n)$ where $n$ is `nums.length`.
- **Auxiliary Space**: $O(\min(n, k))$ because the `Set` never holds more than $k + 1$ items.

---

## Common Mistakes & Interview Traps

1. **Building the frequency map on the larger array**:
   If `nums1` has $10^6$ items and `nums2` has $10$ items, building the map on `nums1` consumes $10^6$ entries of memory. Always swap to build the map on the smaller array ($O(\min(n, m))$ auxiliary space).
2. **Deleting from `windowSet` using the wrong index**:
   ```js
   // WRONG: Deleting i - k - 1 or forgetting that Set size must be pruned
   if (i >= k) windowSet.delete(nums[i - k]);
   ```
   Always verify the boundary condition: when index is $i$, the element that just left the $k$-window is at index $i - k$.
3. **Using `.filter()` and `.includes()` for Array Intersection**:
   `nums1.filter(x => nums2.includes(x))` runs in $O(n \times m)$ time! A hash set is required for $O(n + m)$ linear time.

---

## Tricky Points & Edge Cases

- **$k \ge n$ in Contains Duplicate II**:
  If $k$ is greater than or equal to array length, the window never prunes, degrading to a standard whole-array duplicate check.
- **Empty Arrays**:
  If either `nums1` or `nums2` is empty, the intersection is immediately `[]`.

---

## Practical Exercise

Implement `findDisappearedNumbers(nums)` where `nums` is an array of $n$ integers where $nums[i]$ is in the range $[1, n]$. Return an array of all integers in $[1, n]$ that do not appear in `nums`.
- **Level 1**: Solve using a `Set` in $O(n)$ time and $O(n)$ space.
- **Level 2 (Senior Follow-up)**: Solve in $O(n)$ time and $O(1)$ auxiliary space by negating values at indices (`nums[Math.abs(x) - 1] = -Math.abs(...)`).

---

## Summary

- Set membership lookup runs in $O(1)$ average time, enabling linear-time duplicate detection.
- Array Intersection I uses two sets for unique elements; Intersection II uses a frequency map to track counts.
- Maintains a bounded sliding-window Set of size $k$ to detect duplicates within range $k$ with only $O(k)$ memory.
- In Node.js, bounded sets prevent memory leaks when deduplicating streaming message queues.

---

## Cheat Sheet

### Duplicate & Intersection Comparison
| Problem | Optimal Data Structure | Time Complexity | Auxiliary Space |
| :--- | :--- | :--- | :--- |
| Contains Duplicate | `new Set()` | $O(n)$ | $O(n)$ |
| Contains Duplicate II ($k$) | Bounded `Set` of size $k$ | $O(n)$ | $O(\min(n, k))$ |
| Intersection I (Unique) | `Set` for `nums1` & output | $O(n + m)$ | $O(n + m)$ |
| Intersection II (Counts) | `Map` for smaller array | $O(n + m)$ | $O(\min(n, m))$ |

---

## Interview Questions

### 1. Deep Definitions and Mental Models
**Question:** If both input arrays are already sorted, how does the optimal strategy for Intersection of Two Arrays change?
- **Expected answer shape:** If both arrays are already sorted, we can use the **Two-Pointer** technique instead of a hash map. One pointer tracks `nums1` and the other tracks `nums2`, advancing whichever pointer holds the smaller value. This reduces auxiliary space from $O(\min(n, m))$ to $O(1)$ while keeping runtime at $O(n + m)$.

### 2. Predict the Output and Trace Execution
**Question:** What does this code print?
```js
const s = new Set();
s.add([1, 2]);
s.add([1, 2]);
console.log(s.size);
```
- **Expected answer shape:** Prints `2`. In JavaScript, reference types are compared by memory identity. `[1, 2]` creates a new object in memory each time, so `s.has([1, 2])` is false.

### 3. Implementation Exercise
**Question:** Implement `intersectionUnique(nums1, nums2)` using `Set` operations in concise, idiomatic JavaScript.
- **Expected answer shape:**
```js
function intersectionUnique(nums1, nums2) {
  const set1 = new Set(nums1);
  const resultSet = new Set();
  for (const num of nums2) {
    if (set1.has(num)) resultSet.add(num);
  }
  return Array.from(resultSet);
}
```

### 4. Debugging and Failure Analysis
**Question:** A developer uses `[...new Set(arr)]` on an array of 5 million items inside an Express HTTP route. What happens to server performance?
- **Expected answer shape:** `new Set(arr)` allocates memory for 5 million hash set buckets, and `[...set]` immediately creates a second 5 million-element array. This can consume ~500 MB of heap memory, triggering a major Garbage Collection pause of 200–500 ms, freezing the single-threaded event loop and causing latency spikes for all concurrent HTTP requests.

### 5. Design and Tradeoff Questions
**Question:** What are the tradeoffs between using a bloom filter versus a hash set for duplicate detection on massive streams?
- **Expected answer shape:** A Hash Set has 100% accuracy (no false positives, no false negatives) but scales linearly with memory ($O(n)$), risking OOM. A Bloom Filter uses a tiny fixed-size bit array ($O(1)$ memory) and has zero false negatives, but has a controllable rate of false positives. Bloom filters are preferred at massive scale when memory is constrained and occasional false positives are tolerable.

### 6. Senior Follow-ups: Node.js Stream Deduplication
**Question:** How would you implement real-time duplicate transaction detection for a high-volume payment processor running on Node.js?
- **Expected answer shape:** Storing all transaction IDs in Node.js process memory is vulnerable to crashes and multi-instance scaling issues. Architecture: (1) Use Redis with an atomic command: `SET transaction:<id> 1 NX EX 86400` (set if not exists with 24-hour expiration). (2) If Redis returns `null`, the transaction is a duplicate. (3) This provides distributed, crash-resilient deduplication with automatic memory cleanup via TTL.

<nav aria-label="Lecture navigation">

[Previous: Group Anagrams and Frequency Vectors](day-08-group-anagrams-and-frequency-vectors.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Sorting Deep Dive: Merge Sort and Quick Sort](day-10-merge-sort-and-quick-sort.md)

</nav>
