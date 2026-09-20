# Day 44: Two Heaps: Median from Data Stream

## 1. Learning Outcomes
- Master the **Two Heaps Pattern** to partition dynamic data into two balanced halves.
- Implement **MedianFinder** to insert numbers in $O(\log n)$ time and calculate median in $O(1)$ time.
- Understand the structural invariants: Max-Heap for the lower half, Min-Heap for the upper half.
- Solve edge cases with odd vs. even element stream distributions.
- Apply two-heap quantile tracking to dynamic P50/P90/P99 latency calculations in Node.js APM monitoring engines.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 41 (Binary Heap Representation), Day 42 (Min/Max Heap Implementation).
- **Navigation**:
  - [Previous: Day 43 - Top 'K' Elements and Kth Largest](day-43-top-k-elements-and-kth-largest.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 45 - Merge K Sorted Lists and Task Scheduling](day-45-merge-k-sorted-lists-and-task-scheduling.md)

---

## 3. Core Concepts & Mental Models
The median of a sequence divides numbers into two equal halves: all numbers in the lower half are $\le$ all numbers in the upper half.
Instead of maintaining a fully sorted array (which takes $O(n)$ insertion time), we use **Two Heaps**:
1. **Lower Half (Max-Heap)**: Stores smaller half of numbers. The largest among them is at the root.
2. **Upper Half (Min-Heap)**: Stores larger half of numbers. The smallest among them is at the root.

```text
Two Heaps Partition:
Lower Half (Max-Heap):          Upper Half (Min-Heap):
      [4] (Max of lower)              [6] (Min of upper)
     /   \                           /   \
   [2]   [3]                       [8]   [10]

Invariants:
1. Every element in Max-Heap <= Every element in Min-Heap
2. Sizes balanced: maxHeap.size() === minHeap.size() OR
                   maxHeap.size() === minHeap.size() + 1

Median:
- If odd total elements: maxHeap.peek() = 4
- If even total elements: (maxHeap.peek() + minHeap.peek()) / 2 = (4 + 6) / 2 = 5.0
```

---

## 4. Detailed Technical Explanations

### 4.1 Insertion and Rebalancing Protocol
When a new number `num` arrives:
1. **Route to Heap**:
   - If `maxHeap` is empty or `num <= maxHeap.peek()`, insert into `maxHeap`.
   - Otherwise, insert into `minHeap`.
2. **Rebalance Sizes**:
   - If `maxHeap.size() > minHeap.size() + 1`: Extract from `maxHeap` and insert into `minHeap`.
   - If `minHeap.size() > maxHeap.size()`: Extract from `minHeap` and insert into `maxHeap`.
Both operations execute in strictly $O(\log n)$ time.

### 4.2 Finding the Median in $O(1)$
- If `maxHeap.size() > minHeap.size()`: Total count is odd. Median is `maxHeap.peek()`.
- If sizes are equal: Total count is even. Median is `(maxHeap.peek() + minHeap.peek()) / 2`.
Inspection requires only reading index 0 of both heaps: $O(1)$ time!

### 4.3 Node.js Relevance: APM Metrics & P50/P95 Latency Tracking
In Node.js Application Performance Monitoring (APM) tools (e.g., Datadog, New Relic, OpenTelemetry), API response latencies arrive in real time. Sorting an array of 100,000 request latencies every second blocks the event loop ($O(n \log n)$). A two-heap structure updates the true P50 (median) latency dynamically in $O(\log n)$ per request without lag.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 MedianFinder Class (LeetCode 295)
```javascript
import { PriorityQueue } from './day-42-min-heap-and-max-heap-implementation.js';

class MedianFinder {
  constructor() {
    // maxHeap for lower half: larger values have higher extraction priority
    this.maxHeap = new PriorityQueue((a, b) => b - a);
    // minHeap for upper half: smaller values have higher extraction priority
    this.minHeap = new PriorityQueue((a, b) => a - b);
  }

  /**
   * Inserts a number into the data stream.
   * Time Complexity: O(log n)
   */
  addNum(num) {
    // Step 1: Add to appropriate heap
    if (this.maxHeap.isEmpty() || num <= this.maxHeap.peek()) {
      this.maxHeap.insert(num);
    } else {
      this.minHeap.insert(num);
    }

    // Step 2: Rebalance heaps to maintain size invariant
    // maxHeap can have at most 1 more element than minHeap
    if (this.maxHeap.size() > this.minHeap.size() + 1) {
      this.minHeap.insert(this.maxHeap.extract());
    } else if (this.minHeap.size() > this.maxHeap.size()) {
      this.maxHeap.insert(this.minHeap.extract());
    }
  }

  /**
   * Returns the median of all elements so far.
   * Time Complexity: O(1)
   */
  findMedian() {
    if (this.maxHeap.size() > this.minHeap.size()) {
      return this.maxHeap.peek();
    }
    return (this.maxHeap.peek() + this.minHeap.peek()) / 2;
  }
}
```

### 5.2 Execution Trace: Streaming `[5, 2, 8, 1]`
```text
1. addNum(5):
   maxHeap: [5], minHeap: []. Sizes: (1, 0) -> Balanced.
   Median = 5.

2. addNum(2):
   2 <= maxHeap.peek() (5) -> insert to maxHeap: [5, 2]. minHeap: [].
   Sizes: (2, 0). maxHeap > minHeap + 1 -> move root (5) to minHeap.
   maxHeap: [2], minHeap: [5]. Sizes: (1, 1) -> Balanced.
   Median = (2 + 5) / 2 = 3.5.

3. addNum(8):
   8 > maxHeap.peek() (2) -> insert to minHeap: [5, 8].
   Sizes: (1, 2). minHeap > maxHeap -> move root (5) to maxHeap.
   maxHeap: [5, 2], minHeap: [8]. Sizes: (2, 1) -> Balanced.
   Median = maxHeap.peek() = 5.

4. addNum(1):
   1 <= maxHeap.peek() (5) -> insert to maxHeap: [5, 2, 1].
   Sizes: (3, 1). maxHeap > minHeap + 1 -> move root (5) to minHeap: [5, 8].
   maxHeap: [2, 1], minHeap: [5, 8]. Sizes: (2, 2) -> Balanced.
   Median = (2 + 5) / 2 = 3.5.
```

---

## 6. Common Mistakes & Anti-Patterns
- **Adding to Min-Heap by Default**: Inserting arbitrarily without checking against `maxHeap.peek()` violates the fundamental invariant that all elements in `maxHeap` $\le$ all elements in `minHeap`.
- **Integer Division Pitfall**: In languages like Java or C++, `(a + b) / 2` performs integer truncation. JavaScript numbers are IEEE 754 floats by default, but always test odd/even sums explicitly.
- **Sorting on Every Call to `findMedian`**: Maintaining an unsorted array and calling `arr.sort()` on every `findMedian()` turns each median lookup into $O(n \log n)$, degrading high-throughput services.

---

## 7. Tricky Points & Edge Cases
- **Duplicate Values**: Numbers equal to `maxHeap.peek()` route to `maxHeap` without violating invariants.
- **Negative Values**: Heaps naturally compare negative numbers correctly via comparator `(a, b) => b - a`.
- **Sliding Window Median (LeetCode 480)**: When elements leave the sliding window, deleting an arbitrary element from inside a heap takes $O(n)$ search. Use **Lazy Deletion** with a hash map tracking pending deletions to maintain $O(\log k)$ performance.

---

## 8. Practical Engineering Exercises
1. Implement **Sliding Window Median** (LeetCode 480) for window size $k$ using Two Heaps with a hash map for lazy deletion.
2. Extend `MedianFinder` to calculate arbitrary percentiles (e.g., P90, P99) by adjusting the heap size ratio constraint.

---

## 9. Key Takeaways & Summary
- The Two Heaps pattern divides data into a lower half (Max-Heap) and an upper half (Min-Heap).
- Invariant 1: Max-Heap elements $\le$ Min-Heap elements.
- Invariant 2: Sizes differ by at most 1.
- Insertion runs in $O(\log n)$ time, and Median lookup is instantaneous in $O(1)$ time.

---

## 10. Quick Reference Cheat Sheet
| Metric | Max-Heap (Lower) | Min-Heap (Upper) |
| :--- | :--- | :--- |
| **Values Stored** | Smaller half $[0 \dots \lfloor n/2 \rfloor]$ | Larger half $[\lceil n/2 \rceil \dots n]$ |
| **Root Represents** | Maximum of lower half | Minimum of upper half |
| **Size Constraint** | `minHeap.size()` or `minHeap.size() + 1` | `maxHeap.size()` or `maxHeap.size() - 1` |
| **Median (Odd)** | `maxHeap.peek()` | N/A |
| **Median (Even)** | `(maxHeap.peek() + minHeap.peek()) / 2` | |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: Why is a Two-Heaps structure preferred over a self-balancing Binary Search Tree (AVL / Red-Black Tree) for finding the running median from a stream?  
**Hint**: Implementation complexity, cache locality, and operations needed.  
**Expected Answer Shape**: A balanced BST also allows $O(\log n)$ insertions and $O(1)$ or $O(\log n)$ median queries (using subtree node counts). However, self-balancing BSTs are significantly more complex to implement, require node pointer rotations, and suffer from pointer-chasing CPU cache misses. Two Heaps utilize contiguous flat arrays with straightforward bubble-up/down logic, providing higher cache efficiency and lower runtime constants in the V8 engine.

### 2. Code-Writing
**Question**: How would you adapt the Two-Heaps pattern to maintain the 90th percentile (P90) of a streaming dataset?  
**Hint**: Adjust the size ratio between the two heaps.  
**Expected Answer Shape**: Partition data into a lower 90% and upper 10%. Lower heap is a Max-Heap; upper heap is a Min-Heap. Enforce the invariant: `lowerHeap.size() === Math.floor(0.9 * totalElements)`. P90 is always accessible at `upperHeap.peek()` or `lowerHeap.peek()` in $O(1)$ time, with $O(\log n)$ insertions.

### 3. Debugging
**Question**: Identify why this Two-Heaps implementation produces incorrect medians:  
```javascript
addNum(num) {
  this.maxHeap.insert(num);
  this.minHeap.insert(this.maxHeap.extract());
  if (this.minHeap.size() > this.maxHeap.size()) {
    this.maxHeap.insert(this.minHeap.extract());
  }
}
```  
**Hint**: Trace what happens to the size and invariants. Does this code work correctly?  
**Expected Answer Shape**: This implementation actually works correctly and is an elegant two-step alternative! By routing `num` through `maxHeap` into `minHeap`, it guarantees the smallest element of the upper half lands in `minHeap`. Then, if `minHeap` has more elements, it shifts one back to `maxHeap`. However, its performance penalty is doing 2 extracts and 2 inserts on *every single addition* ($4 \times O(\log n)$) rather than conditionally inserting into the correct heap first ($1 \times O(\log n)$).

### 4. System Design / Tradeoff
**Question**: In a high-throughput Node.js microservice handling 100,000 telemetry events per second, why is an exact streaming two-heap median avoided in favor of t-digest or HdrHistogram?  
**Hint**: Memory consumption of 100,000 heap elements per second vs. approximate sketches.  
**Expected Answer Shape**: An exact two-heap requires storing all $N$ data points in memory ($O(N)$ space). Over millions of requests, this exhausts V8 heap RAM and increases GC pauses. Production telemetry systems (OpenTelemetry, Prometheus) use approximate streaming data sketches like **HdrHistogram** or **t-digest**, which compute percentiles (P50, P99) with $<1\%$ error in constant $O(1)$ memory and sub-nanosecond updates.

### 5. Tricky / Edge Case
**Question**: In Sliding Window Median, how does "Lazy Deletion" prevent degrading the heap from $O(\log k)$ to $O(k)$ when an element slides out of the window?  
**Hint**: Do not search and delete immediately; record pending deletions in a Hash Map.  
**Expected Answer Shape**: Instead of searching the flat array in $O(k)$ to delete the outgoing element, increment its count in an `invalidHash` map. Whenever `maxHeap.peek()` or `minHeap.peek()` matches an entry in `invalidHash`, extract it lazily and decrement the map count. This defers deletion until the element naturally surfaces to the root, preserving strict $O(\log k)$ heap operations.

### 6. Real-World Node.js Context
**Question**: How does Node.js core compute event loop delay percentiles in the `perf_hooks` module?  
**Hint**: `monitorEventLoopDelay` API.  
**Expected Answer Shape**: Node.js's `perf_hooks.monitorEventLoopDelay()` uses an HdrHistogram written in C++ rather than a JavaScript heap. It samples event loop turn latencies in microseconds, records them in fixed pre-allocated histogram buckets, and provides `min`, `max`, `mean`, `percentile(50)`, and `percentile(99)` with zero JavaScript memory allocation, preventing monitoring overhead from distorting event loop latency.
