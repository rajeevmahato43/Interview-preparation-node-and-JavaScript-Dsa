# Day 48: 1D Dynamic Programming: Longest Increasing Subsequence

<nav aria-label="Lecture navigation">
  <a href="day-47-1d-dp-house-robber-and-coin-change.md">◀ Day 47: 1D DP: House Robber and Coin Change</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-49-2d-dp-grid-paths-and-minimum-path-sum.md">Day 49: 2D DP: Grid Paths and Minimum Path Sum ▶</a>
</nav>

---
## Prerequisites

- [Day 26: Binary Search Bounds and Intervals](day-26-binary-search-bounds-and-intervals.md) — Lower bound binary search (`lower_bound` / `bisect_left`).
- [Day 46: Dynamic Programming: Memoization and Tabulation](day-46-dynamic-programming-memo-and-tabulation.md) — State definition and tabulation mechanics.
---

## 1. The Classic $O(n^2)$ Tabulation Approach

In **Longest Increasing Subsequence** (LeetCode 300), given an integer array `nums`, we must find the length of the longest strictly increasing subsequence.

```text
Array: [10, 9, 2, 5, 3, 7, 101, 18]
Valid Subsequences:
- [10, 101] (Length 2)
- [2, 5, 7, 101] (Length 4)
- [2, 3, 7, 18] (Length 4)
Longest Increasing Subsequence Length = 4
```

#### 1. State Definition:
Let `dp[i]` be the length of the longest strictly increasing subsequence that **ends at index $i$**.
#### 2. Base Case:
Every single element is an increasing subsequence of length 1: `dp.fill(1)`.
#### 3. Recurrence Relation:
To calculate `dp[i]`, we inspect every predecessor $j < i$:
$$\text{If } nums[j] < nums[i] \implies dp[i] = \max(dp[i], dp[j] + 1)$$
Global answer: $\max(dp[0], dp[1], \dots, dp[n - 1])$.

```javascript
// Node.js code: Classic O(n^2) LIS Tabulation
/**
 * @param {number[]} nums
 * @returns {number}
 */
function lengthOfLISQuadratic(nums) {
  if (!nums || nums.length === 0) return 0;
  const n = nums.length;
  const dp = new Array(n).fill(1);
  let maxLIS = 1;

  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
    if (dp[i] > maxLIS) {
      maxLIS = dp[i];
    }
  }

  return maxLIS;
}

console.log('LIS length:', lengthOfLISQuadratic([10, 9, 2, 5, 3, 7, 101, 18])); // 4
```

---

## 2. Why LIS Cannot Be Reduced to $O(1)$ Space

In problems like Fibonacci or House Robber, state `dp[i]` depends strictly on a fixed number of immediate predecessors (`dp[i-1]`, `dp[i-2]`), allowing state compression to 2 scalar variables.
In LIS, state `dp[i]` depends on **all** preceding states $j \in [0 \dots i - 1]$ because any previous smaller element could be the predecessor in the optimal subsequence. Because we cannot predict which historical elements will be smaller than future elements, the entire array must be preserved, making $O(n)$ space unavoidable in standard DP.

---

## 3. Optimal $O(n \log n)$ Patience Sorting & Binary Search

> **Patience Sorting**: Card-sorting algorithm where each element is placed on the leftmost pile whose top card is $\ge$ the element.

To achieve $O(n \log n)$ time, we maintain an array `tails = []`:
- `tails[i]` stores the **smallest tail element** of all increasing subsequences of length $i + 1$ found so far.

```text
Patience Sorting Invariants:
1. 'tails' is ALWAYS strictly increasing in value: tails[0] < tails[1] < tails[2]...
2. For each number x in nums:
   - Use Binary Search to find the first element in 'tails' that is >= x.
   - Case A: If no such element exists (x is larger than all tails):
             Append x to 'tails' (extends maximum subsequence length by 1!).
   - Case B: If tails[idx] >= x:
             Overwrite tails[idx] = x (maintains smallest possible tail for that length!).

Trace for [10, 9, 2, 5, 3, 7, 101, 18]:
x = 10:  tails = [10]
x = 9:   9 replaces 10        -> tails = [9]
x = 2:   2 replaces 9         -> tails = [2]
x = 5:   5 > 2, append 5      -> tails = [2, 5]
x = 3:   3 replaces 5         -> tails = [2, 3]  (Subsequence of length 2 now ends with 3!)
x = 7:   7 > 3, append 7      -> tails = [2, 3, 7]
x = 101: 101 > 7, append 101  -> tails = [2, 3, 7, 101]
x = 18:  18 replaces 101      -> tails = [2, 3, 7, 18]

Final tails.length = 4! (Length of LIS)
```

> **Warning**: The `tails` array does **not** necessarily represent the actual elements of the LIS (it stores ending candidates of various lengths). However, its **length** is strictly guaranteed to equal the maximum LIS length!

```javascript
// Node.js code: Optimal O(n log n) LIS
/**
 * @param {number[]} nums
 * @returns {number}
 */
function lengthOfLIS(nums) {
  if (!nums || nums.length === 0) return 0;

  const tails = [];

  for (let i = 0; i < nums.length; i++) {
    const x = nums[i];

    // Binary search for first element in tails >= x
    let low = 0;
    let high = tails.length - 1;
    let idx = tails.length;

    while (low <= high) {
      const mid = (low + high) >> 1;
      if (tails[mid] >= x) {
        idx = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    if (idx === tails.length) {
      tails.push(x);
    } else {
      tails[idx] = x;
    }
  }

  return tails.length;
}

console.log('Optimal LIS length:', lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18])); // 4
```

---

## 4. 2D Extension: Russian Doll Envelopes (LeetCode 354)

> **Russian Doll Envelopes**: 2D nesting problem where envelope $A$ fits inside $B$ if and only if $w_A < w_B$ and $h_A < h_B$.

Given envelopes with dimensions `[width, height]`. Envelope $A$ fits inside $B$ if and only if $w_A < w_B$ and $h_A < h_B$. Find the maximum number of envelopes you can Russian-doll.

#### The Dimension-Sorting Trick:
1. Sort envelopes by **width ascending**.
2. If two envelopes have the same width, sort by **height descending**!
   $$\text{Sort: } (w_1, h_1) \text{ vs } (w_2, h_2) \implies w_1 \ne w_2 ? w_1 - w_2 : h_2 - h_1$$
3. Why height descending? If widths are identical, an envelope cannot fit inside another of the same width. Sorting heights descending ensures that standard strictly-increasing LIS on the heights will pick at most one envelope per width!
4. Run standard 1D LIS on the sorted heights in $O(n \log n)$ time.

```javascript
// Node.js code: Russian Doll Envelopes
/**
 * @param {number[][]} envelopes
 * @returns {number}
 */
function maxEnvelopes(envelopes) {
  if (!envelopes || envelopes.length === 0) return 0;

  // 1. Sort widths ASC, heights DESC
  envelopes.sort((a, b) => {
    if (a[0] !== b[0]) return a[0] - b[0];
    return b[1] - a[1];
  });

  // 2. Extract heights and run O(n log n) LIS
  const heights = envelopes.map(e => e[1]);
  return lengthOfLIS(heights);
}

console.log(
  'Max envelopes:',
  maxEnvelopes([[5, 4], [6, 4], [6, 7], [2, 3]])
); // 3: [2,3] => [5,4] => [6,7]
```

---

## Detailed Node.js Relevance

### Audit Log Sequence Reconciliation and Monotonic Trace Ordering

In distributed Node.js microservices (e.g., event sourcing engines, Kafka consumer lag trackers):

```text
Distributed Kafka Events:
Event Stream: [Event(t=10), Event(t=4), Event(t=15), Event(t=12), Event(t=25)]
Goal: Identify longest coherent monotonic chain of operations without re-ordering violations.
```

1. **Clock Drift and Out-of-Order Delivery**: Network latency often causes events from distributed servers to arrive slightly out of order. Running LIS on event causal sequence numbers isolates the longest valid subset of consistently ordered events, allowing services to replay safe state transitions while flagging anomalous out-of-sequence events for audit inspection.
2. **Performance Impact**: For high-throughput log streams ($N = 100,000$ events), an $O(n^2)$ algorithm performs $10^{10}$ operations, freezing the Node.js event loop for over 10 seconds. The $O(n \log n)$ Patience Sorting algorithm finishes in under 25 milliseconds, guaranteeing event loop responsiveness.

---

## Tricky Points & Edge Cases

1. **Strictly Increasing vs. Non-Decreasing**:
   - For **strictly increasing** ($<$): use `lower_bound` (first element in tails $\ge x$).
   - For **non-decreasing** ($\le$): use `upper_bound` (first element in tails $> x$).
2. **The `tails` Array Content Illusion**:
   A frequent candidate mistake is returning `tails` as the actual LIS sequence. The `tails` array stores minimal tail elements across different lengths, not the actual sequence! To extract the actual subsequence elements, you must store predecessor pointers.
3. **Russian Doll Height Tie-Breaking**:
   If you sort heights ascending on equal widths, two envelopes with the same width (e.g., `[6, 4]` and `[6, 7]`) would both be included in the LIS because $4 < 7$, violating the strict width requirement $w_A < w_B$. Sorting heights **descending** forces the algorithm to choose at most one.
4. **All Elements Decreasing**:
   If `nums = [5, 4, 3, 2, 1]`, LIS length is 1. The algorithm should correctly return 1 without errors.

---

## Hands-On Exercise

### Scenario
You are developing an event sequencing auditor for a Node.js telemetry pipeline. You receive a list of system events: each event has `{ id: string, timestamp: number }`.
Implement `extractLongestValidTrace(events)`:
1. Returns the **actual list of events** (in order) that form the longest strictly increasing sequence by `timestamp`.
2. Must execute in $O(n \log n)$ time using Patience Sorting with parent tracking back-pointers.
3. If multiple subsequences share the maximum length, return any valid one.

### Buggy Code
```javascript
function extractLongestValidTrace(events) {
  // BUG: Returns tails array directly; elements in tails do not form a valid subsequence!
  const tails = [];
  for (let e of events) {
    let idx = tails.findIndex(t => t.timestamp >= e.timestamp);
    if (idx === -1) tails.push(e);
    else tails[idx] = e; // Destroys historic subsequence linkage!
  }
  return tails;
}
```

### Acceptance Criteria
- Return the actual array of event objects forming a valid strictly increasing sequence.
- Maintain $O(n \log n)$ time complexity by using binary search instead of `findIndex`.
- Reconstruct the path using predecessor index pointers.
- Handle empty arrays cleanly.

### Solution Code
```javascript
const assert = require('assert');

// Node.js code: Full LIS Path Reconstruction with O(n log n) Patience Sorting
/**
 * @param {Array<{ id: string, timestamp: number }>} events
 * @returns {Array<{ id: string, timestamp: number }>}
 */
function extractLongestValidTrace(events) {
  if (!events || events.length === 0) return [];

  const n = events.length;
  // tails[len] stores the INDEX in events array of the smallest tail
  const tailsIndices = [];
  // parent[i] stores the index of the predecessor of events[i] in the LIS
  const parent = new Array(n).fill(-1);

  for (let i = 0; i < n; i++) {
    const x = events[i].timestamp;

    // Binary search for first tails element with timestamp >= x
    let low = 0;
    let high = tailsIndices.length - 1;
    let targetSlot = tailsIndices.length;

    while (low <= high) {
      const mid = (low + high) >> 1;
      const tailIdx = tailsIndices;
      if (events[tailIdx].timestamp >= x) {
        targetSlot = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    // Link this element's predecessor to the previous tail
    if (targetSlot > 0) {
      parent[i] = tailsIndices[targetSlot - 1];
    }

    if (targetSlot === tailsIndices.length) {
      tailsIndices.push(i);
    } else {
      tailsIndices[targetSlot] = i;
    }
  }

  // Reconstruct path from the last tail index
  const result = [];
  let curr = tailsIndices[tailsIndices.length - 1];
  while (curr !== -1) {
    result.push(events[curr]);
    curr = parent[curr];
  }

  return result.reverse();
}

// Verification & Automated Unit Tests
const testEvents = [
  { id: 'ev-1', timestamp: 10 },
  { id: 'ev-2', timestamp: 9 },
  { id: 'ev-3', timestamp: 2 },
  { id: 'ev-4', timestamp: 5 },
  { id: 'ev-5', timestamp: 3 },
  { id: 'ev-6', timestamp: 7 },
  { id: 'ev-7', timestamp: 101 },
  { id: 'ev-8', timestamp: 18 }
];

const validTrace = extractLongestValidTrace(testEvents);

// Assertions
assert.strictEqual(validTrace.length, 4); // Max LIS is length 4
// Verify strictly increasing
for (let i = 1; i < validTrace.length; i++) {
  assert.strictEqual(validTrace[i].timestamp > validTrace[i - 1].timestamp, true);
}

// Test empty array
assert.deepStrictEqual(extractLongestValidTrace([]), []);

// Test single element
const single = [{ id: 'ev-solo', timestamp: 42 }];
assert.deepStrictEqual(extractLongestValidTrace(single), single);

console.log('✅ All extractLongestValidTrace LIS assertions passed successfully!');
```

### Solution Explanation
1. **Storing Indices Instead of Values**: `tailsIndices` stores the *indices* of candidate tail elements in `events`, enabling direct linking to predecessor history.
2. **Parent Array Reconstruction**: When element $i$ is placed in `targetSlot`, its predecessor in the subsequence is `tailsIndices[targetSlot - 1]`. Recording `parent[i]` preserves the exact historical branch.
3. **Logarithmic Performance**: Binary search maintains the $O(n \log n)$ time bound while reconstructing the full path in $O(L) \le O(n)$ time.

---

## Summary

- **Longest Increasing Subsequence (LIS)** can be solved in $O(n^2)$ time via standard 1D Dynamic Programming ($dp[i] = \max(dp[i], dp[j] + 1)$).
- LIS cannot be compressed to $O(1)$ space because every predecessor must remain accessible.
- **Patience Sorting & Binary Search** achieves optimal $O(n \log n)$ time by maintaining the monotonic `tails` candidate array.
- **Russian Doll Envelopes** reduces 2D dimensions to 1D LIS by sorting widths ascending and heights descending.
- In Node.js distributed architectures, LIS provides sequence reconciliation for out-of-order event streams in real time.

---

## Cheat Sheet & Common Pitfalls

| Variant | Time Complexity | Auxiliary Space | Algorithm |
| :--- | :--- | :--- | :--- |
| **Standard DP LIS** | $O(n^2)$ | $O(n)$ | Nested loop over all $j < i$ |
| **Patience Sorting LIS** | $O(n \log n)$ | $O(n)$ | Monotonic `tails` + Binary Search |
| **Strictly Increasing** | $O(n \log n)$ | $O(n)$ | Binary search for $\ge x$ (`lower_bound`) |
| **Non-Decreasing** | $O(n \log n)$ | $O(n)$ | Binary search for $> x$ (`upper_bound`) |
| **Russian Doll** | $O(n \log n)$ | $O(n)$ | Sort width ASC, height DESC, then LIS |

---

## Interview Questions

### 1. Why does the `tails` array in Patience Sorting not necessarily represent a valid increasing subsequence?

> **`tails` Array**: An array where `tails[len]` stores the smallest possible ending tail value of all increasing subsequences of length `len + 1`.

> **Subsequence**: A sequence derived from an array by deleting zero or more elements without changing the relative order of the remaining elements.
**Question:** Explain why the elements stored in the `tails` array at the end of the $O(n \log n)$ LIS algorithm may not form a valid subsequence of the original array, yet its length is always correct.

**Answer:**
The `tails` array maintains the smallest tail element for every possible subsequence length discovered so far. When a smaller element overwrites an existing entry in `tails`, it is updating the potential future baseline for that length, but it does **not** rewrite the historical elements that came before it.
**Example**:
- Input: `[2, 5, 1]`
- After processing `2` and `5`: `tails = [2, 5]`. (Valid subsequence `[2, 5]`, length 2).
- When `1` arrives, it replaces `2`: `tails = [1, 5]`.
- The sequence `[1, 5]` is invalid because `1` appeared **after** `5` in the original array!
- However, the **length** of `tails` remains 2. If a future element like `3` arrives, it can extend `1` to form `[1, 3]`, which is a valid length-2 subsequence. Thus, `tails.length` is always mathematically optimal even if the elements inside `tails` are mixed across different historical branches.

---

### 2. Why must heights be sorted in descending order for equal widths in Russian Doll Envelopes?
**Question:** In LeetCode 354 (Russian Doll Envelopes), why does sorting widths ascending and heights descending correctly resolve width ties, whereas sorting both ascending fails?

**Answer:**
An envelope $A$ can only fit inside $B$ if **both** $w_A < w_B$ and $h_A < h_B$.
1. If two envelopes have the same width (e.g., `[6, 4]` and `[6, 7]`), neither can fit inside the other because their widths are equal ($w_A = w_B$).
2. If we sorted heights **ascending** (`[6, 4], [6, 7]`), running standard LIS on the heights would compare $4 < 7$ and select both envelopes, falsely declaring that `[6, 4]` fits inside `[6, 7]`.
3. By sorting heights **descending** (`[6, 7], [6, 4]`), when LIS evaluates the heights, $7 > 4$. Because $4$ is not strictly greater than $7$, LIS will never select both envelopes in the same increasing subsequence. It can pick at most one envelope among all envelopes sharing that same width.

---

### 3. How do you find the total number of Longest Increasing Subsequences (LeetCode 673)?
**Question:** How can the standard $O(n^2)$ LIS algorithm be modified to count the total number of distinct subsequences that achieve the maximum length?

**Answer:**
Maintain two parallel DP arrays:
- `lengths[i]`: Length of LIS ending at index $i$ (initialized to 1).
- `counts[i]`: Number of distinct LIS of length `lengths[i]` ending at index $i$ (initialized to 1).
For each pair $(j, i)$ where $j < i$ and `nums[j] < nums[i]`:
1. If `lengths[j] + 1 > lengths[i]`: We found a strictly longer subsequence!
   - Update `lengths[i] = lengths[j] + 1`.
   - Reset `counts[i] = counts[j]`.
2. If `lengths[j] + 1 === lengths[i]`: We found an additional alternative path of the same max length!
   - Increment `counts[i] += counts[j]`.
At the end, find `maxLength = Math.max(...lengths)`, and sum `counts[i]` for all $i$ where `lengths[i] === maxLength`. Total time: $O(n^2)$, space: $O(n)$.

---

### 4. Can LIS be solved in $O(n \log n)$ time using a Segment Tree or Fenwick Tree (Binary Indexed Tree)?
**Question:** Explain how a Binary Indexed Tree (Fenwick Tree) can be used to solve LIS in $O(n \log n)$ time.

**Answer:**
Yes. A Fenwick Tree or Segment Tree can compute LIS in $O(n \log n)$ time:
1. **Coordinate Compression**: Map all unique values in `nums` to ranked integer indices $1 \dots U$ where $U \le N$.
2. **BIT Semantics**: The Fenwick Tree maintains the maximum LIS length found so far for each value rank.
3. For each number $x$ with compressed rank $r$:
   - Query the BIT for the maximum length among all values strictly smaller than $r$: `maxLen = bit.query(r - 1)`.
   - The LIS ending at $x$ is `currentLen = maxLen + 1`.
   - Update the BIT at rank $r$ with `currentLen`: `bit.update(r, currentLen)`.
4. Global answer is the maximum value in the BIT.
This approach naturally extends to dynamic LIS queries and multidimensional variants.

---

<nav aria-label="Lecture navigation">
  <a href="day-47-1d-dp-house-robber-and-coin-change.md">◀ Day 47: 1D DP: House Robber and Coin Change</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-49-2d-dp-grid-paths-and-minimum-path-sum.md">Day 49: 2D DP: Grid Paths and Minimum Path Sum ▶</a>
</nav>
