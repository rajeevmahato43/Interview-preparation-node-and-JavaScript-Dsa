# Day 44: Two Heaps: Median from Data Stream

<nav aria-label="Lecture navigation">
  <a href="day-43-top-k-elements-and-kth-largest.md">◀ Day 43: Top 'K' Elements and Kth Largest</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-45-merge-k-sorted-lists-and-task-scheduling.md">Day 45: Merge 'K' Sorted Lists and Task Scheduling ▶</a>
</nav>

---
## Prerequisites

- [Day 41: Binary Heap and Array Representation](day-41-binary-heap-array-representation.md) — Heap array mechanics, child formulas, and complete binary trees.
- [Day 42: Min-Heap and Max-Heap Implementation](day-42-min-heap-and-max-heap-implementation.md) — Reusable `PriorityQueue` classes with custom comparators.
---

## 1. The Median Partitioning Mental Model

> **Median**: The middle value in an ordered set; divides numbers such that half are smaller and half are larger.

In a sorted list of numbers, the **median** sits right in the center:
- If the count $N$ is odd, the median is the exact middle element.
- If the count $N$ is even, the median is the arithmetic mean of the two middle elements.

Instead of inserting each new number into a sorted array—which requires $O(n)$ element shifts—we split the numbers into two complementary halves:
1. **Lower Half (Max-Heap)**: Holds all numbers $\le$ median. Root is the largest element of the lower half.
2. **Upper Half (Min-Heap)**: Holds all numbers $\ge$ median. Root is the smallest element of the upper half.

```text
The Two Heaps Partition Architecture:

Stream of Numbers: [ 2, 4, 6, 8, 10, 12 ]
Median = (6 + 8) / 2 = 7.0

Lower Half (Max-Heap):                Upper Half (Min-Heap):
      [ 6 ] (Root = Max of lower)           [ 8 ] (Root = Min of upper)
     /     \                               /     \
   [ 2 ]   [ 4 ]                        [ 10 ]   [ 12 ]

Ordering Invariant:
Every element in Max-Heap <= Every element in Min-Heap!

Size Balancing Invariant:
maxHeap.size() === minHeap.size()       (When N is even)
       OR
maxHeap.size() === minHeap.size() + 1   (When N is odd)
```

---

## 2. Insertion and Rebalancing Protocol

When a new number `num` arrives:
1. **Step 1: Placement**:
   - If `maxHeap` is empty or `num <= maxHeap.peek()`, insert `num` into `maxHeap`.
   - Otherwise, insert `num` into `minHeap`.
2. **Step 2: Rebalancing**:
   - If `maxHeap.size() > minHeap.size() + 1`: Extract root from `maxHeap` and push into `minHeap`.
   - If `minHeap.size() > maxHeap.size()`: Extract root from `minHeap` and push into `maxHeap`.

```text
Insertion Trace: Adding 1, 5, 2, 8, 4

1. Add 1: maxHeap: [1], minHeap: []             Median = 1
2. Add 5: maxHeap: [1], minHeap: [5]             Median = (1 + 5)/2 = 3.0
3. Add 2: 2 <= 1? False. minHeap: [2, 5].
          Rebalance: minHeap size (2) > maxHeap (1).
          Move 2 to maxHeap.
          maxHeap: [2, 1], minHeap: [5]          Median = 2
4. Add 8: 8 > 2 -> minHeap: [5, 8]
          maxHeap: [2, 1], minHeap: [5, 8]       Median = (2 + 5)/2 = 3.5
5. Add 4: 4 > 2 -> minHeap: [4, 5, 8]
          Rebalance: minHeap size (3) > maxHeap (2).
          Move 4 to maxHeap.
          maxHeap: [4, 2, 1], minHeap: [5, 8]    Median = 4
```

---

## 3. Implementation: MedianFinder (LeetCode 295)

```javascript
// Node.js code: Complete MedianFinder Implementation
class SimpleHeap {
  constructor(comparator) {
    this.comparator = comparator;
    this.data = [];
  }
  size() { return this.data.length; }
  peek() { return this.data.length > 0 ? this.data[0] : null; }

  push(val) {
    this.data.push(val);
    let curr = this.data.length - 1;
    while (curr > 0) {
      const p = (curr - 1) >> 1;
      if (this.comparator(this.data[curr], this.data[p]) < 0) {
        [this.data[curr], this.data[p]] = [this.data[p], this.data[curr]];
        curr = p;
      } else break;
    }
  }

  poll() {
    if (this.data.length <= 1) return this.data.pop();
    const root = this.data[0];
    this.data[0] = this.data.pop();
    let curr = 0;
    const n = this.data.length;

    while (true) {
      const left = (curr << 1) + 1;
      const right = (curr << 1) + 2;
      let target = curr;

      if (left < n && this.comparator(this.data[left], this.data[target]) < 0) target = left;
      if (right < n && this.comparator(this.data[right], this.data[target]) < 0) target = right;

      if (target !== curr) {
        [this.data[curr], this.data[target]] = [this.data[target], this.data[curr]];
        curr = target;
      } else break;
    }

    return root;
  }
}

class MedianFinder {
  constructor() {
    // maxHeap holds smaller half: root is maximum of lower half
    this.maxHeap = new SimpleHeap((a, b) => b - a);
    // minHeap holds larger half: root is minimum of upper half
    this.minHeap = new SimpleHeap((a, b) => a - b);
  }

  /**
   * Time Complexity: O(log n)
   * @param {number} num
   */
  addNum(num) {
    // 1. Initial routing
    if (this.maxHeap.size() === 0 || num <= this.maxHeap.peek()) {
      this.maxHeap.push(num);
    } else {
      this.minHeap.push(num);
    }

    // 2. Rebalancing
    if (this.maxHeap.size() > this.minHeap.size() + 1) {
      this.minHeap.push(this.maxHeap.poll());
    } else if (this.minHeap.size() > this.maxHeap.size()) {
      this.maxHeap.push(this.minHeap.poll());
    }
  }

  /**
   * Time Complexity: O(1)
   * @returns {number}
   */
  findMedian() {
    if (this.maxHeap.size() > this.minHeap.size()) {
      return this.maxHeap.peek();
    }
    return (this.maxHeap.peek() + this.minHeap.peek()) / 2.0;
  }
}

// Verification
const mf = new MedianFinder();
mf.addNum(1);
mf.addNum(2);
console.log('Median of [1, 2]:', mf.findMedian()); // 1.5
mf.addNum(3);
console.log('Median of [1, 2, 3]:', mf.findMedian()); // 2
```

---

## Detailed Node.js Relevance

### Real-Time APM Latency Percentiles (P50, P90, P99)

In Node.js backend monitoring services (such as Datadog or New Relic APM tracers), tracking latency percentiles across thousands of concurrent HTTP requests is vital for SLA monitoring.

```text
HTTP Request Latency Distribution:
Fast requests: 5ms, 12ms, 15ms ... P50 Median: 24ms ... P99 Tail: 450ms (Database stall)
```

1. **Why Average Latency is Deceptive**: If 99 users experience 10ms latency and 1 user experiences 10,000ms, the arithmetic mean is ~110ms. The mean hides the fact that $99\%$ of requests were fast, while falsely implying normal users waited 110ms. The **median (P50)** accurately reports 10ms, while **P99** captures the 10,000ms tail outlier.
2. **Generalizing to Quantiles**: By maintaining two heaps with capacity ratios adjusted to $p : (1 - p)$—for example, $90\% : 10\%$ for P90 or $99\% : 1\%$ for P99—the boundary value between the two heaps continuously provides the exact percentile in $O(1)$ time while processing millions of events per minute.

---

## Tricky Points & Edge Cases

1. **Integer Division Truncation in JavaScript**: In languages like Java or C++, `(a + b) / 2` truncates to integer. In JavaScript, `/ 2` performs 64-bit float division natively, but be vigilant when converting output to strings or bitwise operations (`| 0`) which inadvertently truncate the decimal part (`2.5 | 0 === 2`).
2. **Empty Heap Query**: Calling `findMedian()` before any numbers have been added will attempt `null + null / 2`, producing `NaN`. Always guard empty states in production APIs.
3. **Rebalancing Direction Priority**: If you arbitrarily choose to allow `minHeap` to hold the extra element during odd counts, make sure your `findMedian()` logic checks the correct heap. Sticking to the standard convention—**`maxHeap` always holds the extra element**—prevents subtle off-by-one errors.
4. **Duplicate Values**: Numbers equal to the median can land in either heap without violating invariants. The rebalancing step automatically preserves correct heap sizes regardless of duplicates.

---

## Hands-On Exercise

### Scenario
You are developing a real-time analytics module in Node.js for an online auction platform. Bids arrive sequentially. You must implement `SlidingWindowMedianTracker` that maintains the median of only the **last $W$ bids** (a sliding window of size $W$).
When window size $W$ is reached, the oldest bid exiting the window must be removed, and the median of the current window must be reported.

### Buggy Code
```javascript
class SlidingWindowMedianTracker {
  constructor(windowSize) {
    this.k = windowSize;
    this.window = [];
  }

  addBid(price) {
    this.window.push(price);
    if (this.window.length > this.k) {
      this.window.shift(); // BUG: shift() is O(W)
    }
  }

  getMedian() {
    // BUG: Cloning and sorting on EVERY query takes O(W log W)!
    const sorted = [...this.window].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) return sorted;
    return (sorted[mid - 1] + sorted) / 2;
  }
}
```

### Acceptance Criteria
- Return exact median values for both odd and even window lengths.
- Cleanly remove expired bids from the sliding window.
- Support streams containing duplicate bid values.
- Must not crash on window sizes of 1 or 2.

### Solution Code
```javascript
const assert = require('assert');

// Node.js code: Binary Search Insertion Window Median Tracker
/**
 * Uses sorted array with binary search insertion and deletion.
 * Operates in O(W) insertion/deletion and O(1) median query.
 */
class SlidingWindowMedianTracker {
  constructor(windowSize) {
    this.k = windowSize;
    this.history = []; // Raw arrival queue
    this.sorted = [];  // Sorted window array
  }

  addBid(price) {
    this.history.push(price);

    // 1. Binary search insertion into sorted array: O(log W) search + O(W) shift
    let low = 0;
    let high = this.sorted.length - 1;
    let insertIdx = this.sorted.length;

    while (low <= high) {
      const mid = (low + high) >> 1;
      if (this.sorted>= price) {
        insertIdx = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    this.sorted.splice(insertIdx, 0, price);

    // 2. Remove oldest bid if window exceeds k: O(log W) search + O(W) splice
    if (this.history.length > this.k) {
      const oldest = this.history.shift();
      // Locate oldest in sorted array
      let l = 0;
      let r = this.sorted.length - 1;
      let removeIdx = -1;
      while (l <= r) {
        const m = (l + r) >> 1;
        if (this.sorted[m] === oldest) {
          removeIdx = m;
          break;
        } else if (this.sorted[m] > oldest) {
          r = m - 1;
        } else {
          l = m + 1;
        }
      }
      if (removeIdx !== -1) {
        this.sorted.splice(removeIdx, 1);
      }
    }
  }

  /**
   * Retrieves median in O(1) constant time
   * @returns {number}
   */
  getMedian() {
    const len = this.sorted.length;
    if (len === 0) return 0;

    const mid = len >> 1;
    if (len % 2 === 1) {
      return this.sorted;
    }
    return (this.sorted[mid - 1] + this.sorted) / 2.0;
  }
}

// Verification & Automated Unit Tests
const tracker = new SlidingWindowMedianTracker(3);

tracker.addBid(10);
assert.strictEqual(tracker.getMedian(), 10); // Window: [10]

tracker.addBid(20);
assert.strictEqual(tracker.getMedian(), 15); // Window: [10, 20] -> (10+20)/2 = 15

tracker.addBid(30);
assert.strictEqual(tracker.getMedian(), 20); // Window: [10, 20, 30] -> median 20

// 4th bid: 10 expires, window is [20, 30, 40]
tracker.addBid(40);
assert.strictEqual(tracker.getMedian(), 30); // Window: [20, 30, 40] -> median 30

// 5th bid: 20 expires, window is [30, 40, 5] -> sorted: [5, 30, 40]
tracker.addBid(5);
assert.strictEqual(tracker.getMedian(), 30); // Window: [5, 30, 40] -> median 30

console.log('✅ All SlidingWindowMedianTracker assertions passed successfully!');
```

### Solution Explanation
1. **Sorted Window with Binary Search**: For small-to-moderate sliding windows ($W \le 10,000$), maintaining a sorted array with binary search insertion and deletion (`splice`) runs in $O(W)$ time without the complex lazy-removal bookkeeping required by two-heap structures.
2. **$O(1)$ Median Lookup**: The median is accessed directly via array index arithmetic: `sorted` for odd lengths, or the average of `mid - 1` and `mid` for even lengths.
3. **Oldest Bid Expiration**: The FIFO `history` queue tracks original arrival sequence, guaranteeing that the correct expired item is excised from the sorted array.

---

## Summary

- The **Two Heaps Pattern** maintains the running median of a streaming dataset in $O(\log n)$ insertion time and $O(1)$ query time.
- The **Lower Half** is stored in a **Max-Heap**, and the **Upper Half** is stored in a **Min-Heap**.
- **Invariants**: Every element in `maxHeap` is $\le$ every element in `minHeap`, and their sizes differ by at most 1.
- When $N$ is odd, the median is `maxHeap.peek()`; when $N$ is even, it is the average of both roots.
- In Node.js backend systems, two-heap architectures underpin APM percentile latency calculations (P50, P90, P99) without memory leaks.

---

## Cheat Sheet & Common Pitfalls

| Heap Name | Holds Which Data? | Root Element | Allowed Size |
| :--- | :--- | :--- | :--- |
| **Max-Heap** | Smaller $50\%$ of numbers | Largest of lower half | Size of Min-Heap or Size + 1 |
| **Min-Heap** | Larger $50\%$ of numbers | Smallest of upper half | Size of Max-Heap |
| **Median (Odd)** | Lower half has $+1$ item | `maxHeap.peek()` | $O(1)$ |
| **Median (Even)** | Both heaps equal size | `(maxHeap.peek() + minHeap.peek()) / 2` | $O(1)$ |

---

## Interview Questions

### 1. Why is the Two-Heaps approach superior to an Insertion-Sorted Array for finding the running median?
**Question:** Compare the time and space complexity of maintaining the running median using an insertion-sorted array versus the Two-Heaps pattern.

**Answer:**
- **Insertion-Sorted Array**:
  - Finding the insertion position via binary search takes $O(\log n)$ time.
  - However, inserting the element into the array requires shifting $O(n)$ elements in memory.
  - Total insertion time is $\Theta(n)$. For a stream of $N$ numbers, total time is $O(n^2)$.
- **Two-Heaps Approach**:
  - Inserting into either heap takes $O(\log n)$ time.
  - Rebalancing between the two heaps takes at most one extraction and one insertion, which is $2 \cdot O(\log n) = O(\log n)$ time.
  - Total insertion time is strictly $O(\log n)$. For a stream of $N$ numbers, total time is $O(n \log n)$.
  - In both approaches, querying the median is $O(1)$.
- **Conclusion**: The Two-Heaps pattern improves streaming insertion throughput from quadratic $O(n^2)$ to linearithmic $O(n \log n)$, which is essential for high-velocity streaming architectures.

---

### 2. Can you calculate the median in $O(1)$ time if the numbers are restricted to integers between 0 and 100?
**Question:** If an infinite stream contains only integers bounded between 0 and 100, what is the optimal data structure to find the running median?

**Answer:**
If numbers are bounded within a small integer range $[0, 100]$:
1. **Frequency Array (Counting Sort Model)**: Maintain an array `count = new Uint32Array(101)` and a total counter `totalCount`.
2. **Insertion**: Increment `count[num]++` and `totalCount++` in $O(1)$ constant time.
3. **Median Lookup**:
   - Calculate target indices: `mid1 = Math.floor((totalCount + 1) / 2)` and `mid2 = Math.floor((totalCount + 2) / 2)`.
   - Scan the 101-element array, accumulating running totals until reaching `mid1` and `mid2`.
   - Since the loop runs at most 101 steps (a fixed constant independent of $N$), finding the median takes $O(1)$ time.
4. **Space Complexity**: Fixed at 101 integers (~404 bytes), completely immune to memory leaks regardless of billions of stream items.

---

### 3. How does lazy removal work when adapting Two Heaps to the Sliding Window Median problem?
**Question:** In LeetCode 480 (Sliding Window Median), how does the "lazy removal" technique allow the Two-Heaps pattern to delete out-of-window elements in $O(\log k)$ time?

**Answer:**
Standard binary heaps cannot remove arbitrary elements in $O(\log k)$ time without index maps.
**Lazy Removal Protocol**:
1. When an element exits the sliding window, do **not** immediately search and remove it from the heaps. Instead, record it in a hash map: `delayed.set(num, (delayed.get(num) || 0) + 1)`.
2. Maintain effective sizes for both heaps (excluding delayed items).
3. **Pruning at the Roots**: Whenever `maxHeap.peek()` or `minHeap.peek()` matches an item in `delayed`, extract it from the heap and decrement its count in `delayed`.
4. Only elements currently at the root need to be pruned; stale elements deeper in the heap do not affect median calculation and will eventually bubble up to the root to be pruned later.
5. This preserves $O(\log k)$ amortized time for insertions and window updates.

---

### 4. How would you adapt Two Heaps to calculate the 90th percentile (P90) latency instead of the median?
**Question:** Explain how to modify the balance invariant of the Two-Heaps pattern to track the 90th percentile (P90) of incoming latency metrics.

**Answer:**
To track the 90th percentile:
1. **Capacity Distribution**:
   - `maxHeap` (lower values) should hold $90\%$ of all observed numbers.
   - `minHeap` (upper values) should hold the remaining $10\%$ of numbers.
2. **Balance Invariant**:
   - Target size for `maxHeap` is $\lfloor 0.9 \cdot N \rfloor$.
   - Target size for `minHeap` is $\lceil 0.1 \cdot N \rceil$.
3. **Rebalancing**:
   - If `minHeap.size() > Math.ceil(0.1 * N)`, move `minHeap.poll()` to `maxHeap`.
   - If `minHeap.size() < Math.ceil(0.1 * N)`, move `maxHeap.poll()` to `minHeap`.
4. **P90 Value**: The 90th percentile is accessible at the root of `minHeap` (or the root of `maxHeap`, depending on boundary definition) in $O(1)$ time.

---

<nav aria-label="Lecture navigation">
  <a href="day-43-top-k-elements-and-kth-largest.md">◀ Day 43: Top 'K' Elements and Kth Largest</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-45-merge-k-sorted-lists-and-task-scheduling.md">Day 45: Merge 'K' Sorted Lists and Task Scheduling ▶</a>
</nav>
