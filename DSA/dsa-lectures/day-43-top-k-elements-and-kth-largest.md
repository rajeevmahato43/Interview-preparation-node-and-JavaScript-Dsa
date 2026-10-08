# Day 43: Top 'K' Elements and Kth Largest

<nav aria-label="Lecture navigation">
  <a href="day-42-min-heap-and-max-heap-implementation.md">◀ Day 42: Min-Heap and Max-Heap Implementation</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-44-two-heaps-median-from-stream.md">Day 44: Two Heaps: Median from Data Stream ▶</a>
</nav>

---
## Prerequisites

- [Day 06: Frequency Counting and Hash Tables](day-06-frequency-counting-and-hash-tables.md) — Frequency maps and aggregation mechanics.
- [Day 41: Binary Heap and Array Representation](day-41-binary-heap-array-representation.md) — Heap array properties and index formulas.
- [Day 42: Min-Heap and Max-Heap Implementation](day-42-min-heap-and-max-heap-implementation.md) — `push()`, `poll()`, and `peek()` operations.
---

## 1. The Bounded Heap Mechanics & Inversion Invariant

> **Inversion Invariant**: To find the $K$ largest elements, maintain a **Min-Heap** of size $K$. The root will always represent the $K$-th largest element.

> **Bounded Heap**: A heap whose capacity is capped at size $K$; inserting an element beyond $K$ immediately triggers an eviction of the root.

To find the $K$ largest elements in an array or stream of size $n$, sorting the entire array takes $O(n \log n)$ time and $O(n)$ space.
By using a **Min-Heap of size $K$**, we maintain only the top $K$ largest elements encountered so far:
- When the heap contains fewer than $K$ elements, simply insert the new value.
- Once the heap reaches size $K$, the root is the **smallest of the top $K$ candidates**.
- If a newly arriving value $x > \text{root}$, the root cannot be in the top $K$. We extract the root and push $x$.
- If $x \le \text{root}$, $x$ is smaller than all current top $K$ candidates, so we discard $x$.

```text
Finding Top 3 Largest Elements using Min-Heap of Size 3:
Stream of Numbers: [10, 5, 20, 8, 25, 3]

1. Insert 10, 5, 20:       Heap: [5, 10, 20] (Size = 3)
2. Number 8 arrives:       8 > min(5)  -> Evict 5, insert 8. Heap: [8, 10, 20]
3. Number 25 arrives:      25 > min(8) -> Evict 8, insert 25. Heap: [10, 20, 25]
4. Number 3 arrives:       3 < min(10) -> Discard 3. Heap: [10, 20, 25]

Result: Root is 10 = 3rd Largest Element!
Elements in Heap: [10, 20, 25] = Top 3 Largest Elements.
Time: O(n log K) vs O(n log n). Space: O(K) vs O(n).
```

**Rule of Thumb**:
- **$K$ Largest Elements** $\implies$ **Min-Heap** of size $K$ (evicts smaller values).
- **$K$ Smallest Elements** $\implies$ **Max-Heap** of size $K$ (evicts larger values).

---

## 2. Kth Largest Element in an Array (LeetCode 215)

```javascript
// Node.js code: Kth Largest using Min-Heap
class MinHeap {
  constructor() {
    this.data = [];
  }
  size() { return this.data.length; }
  peek() { return this.data[0]; }

  push(val) {
    this.data.push(val);
    let curr = this.data.length - 1;
    while (curr > 0) {
      const p = (curr - 1) >> 1;
      if (this.data[curr] < this.data[p]) {
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
      let smallest = curr;

      if (left < n && this.data[left] < this.data[smallest]) smallest = left;
      if (right < n && this.data[right] < this.data[smallest]) smallest = right;

      if (smallest !== curr) {
        [this.data[curr], this.data[smallest]] = [this.data[smallest], this.data[curr]];
        curr = smallest;
      } else break;
    }

    return root;
  }
}

/**
 * Finds the K-th largest element in an unsorted array.
 * Time Complexity: O(n log K)
 * Space Complexity: O(K)
 * @param {number[]} nums
 * @param {number} k
 * @returns {number}
 */
function findKthLargest(nums, k) {
  const minHeap = new MinHeap();

  for (let i = 0; i < nums.length; i++) {
    minHeap.push(nums[i]);
    if (minHeap.size() > k) {
      minHeap.poll(); // Evict smallest element outside top K
    }
  }

  return minHeap.peek();
}

console.log('3rd largest in [3,2,1,5,6,4]:', findKthLargest([3, 2, 1, 5, 6, 4], 2)); // 5
```

---

## 3. Top K Frequent Elements: Heap vs. Bucket Sort

In **Top K Frequent Elements** (LeetCode 347), we must return the $k$ most frequent numbers in an array.

#### Approach A: Min-Heap of Size $K$ ($O(n \log K)$)
1. Build frequency map `Map<num, freq>`.
2. Push `{ num, freq }` into a Min-Heap of size $K$ comparing by `freq`.
3. Evict when size exceeds $K$.

#### Approach B: Bucket Sort ($O(n)$ Linear Time)
Because the maximum possible frequency of any element is bounded by the array length $N$, we can allocate an array of $N + 1$ buckets where index $f$ stores an array of all numbers that appear with frequency $f$.

```text
Bucket Sort Frequency Distribution:
Input: nums = [1, 1, 1, 2, 2, 3], k = 2
Frequency Map: { 1: 3, 2: 2, 3: 1 }

Buckets array of size N + 1 = 7:
Index (Freq):  0     1     2     3     4     5     6
Bucket:       []   [ 3 ] [ 2 ] [ 1 ]  []    []    []

Scan buckets backwards from index 6 down to 1:
- Bucket 6: empty
- Bucket 5: empty
- Bucket 4: empty
- Bucket 3: has [1] -> Collect 1 (Remaining k = 1)
- Bucket 2: has [2] -> Collect 2 (Remaining k = 0)
Result: [1, 2] in strictly O(n) linear time!
```

```javascript
// Node.js code: Top K Frequent Elements via O(n) Bucket Sort
/**
 * @param {number[]} nums
 * @param {number} k
 * @returns {number[]}
 */
function topKFrequentBucketSort(nums, k) {
  const n = nums.length;
  const freqMap = new Map();

  // 1. Build frequency map: O(n)
  for (let i = 0; i < n; i++) {
    freqMap.set(nums[i], (freqMap.get(nums[i]) || 0) + 1);
  }

  // 2. Allocate buckets array where index = frequency: O(n)
  const buckets = Array.from({ length: n + 1 }, () => []);
  for (const [num, count] of freqMap.entries()) {
    buckets[count].push(num);
  }

  // 3. Collect top k elements scanning backwards: O(n)
  const result = [];
  for (let freq = n; freq >= 1 && result.length < k; freq--) {
    if (buckets[freq].length > 0) {
      for (const num of buckets[freq]) {
        result.push(num);
        if (result.length === k) break;
      }
    }
  }

  return result;
}

console.log('Top 2 frequent:', topKFrequentBucketSort([1, 1, 1, 2, 2, 3], 2)); // [1, 2]
```

---

## Detailed Node.js Relevance

### Real-Time Telemetry and API Heavy-Hitter Tracking

In Node.js API gateways (Express/Fastify) handling millions of requests per minute:

```text
Streaming Log Pipeline:
[Live HTTP Access Logs] ---> [Sliding Window Counter] ---> [Bounded Min-Heap (K = 10)]
1,000,000 logs/min           In-memory Map                 Only stores top 10 IPs!
```

1. **Memory Bound Guarantee**: Buffering 1,000,000 raw request objects in the V8 heap consumes hundreds of megabytes of RAM and triggers long GC pauses. Using a bounded Min-Heap of size 10 consumes less than 1 kilobyte of memory while continuously tracking the top 10 most active IP addresses.
2. **DDoS Early Warning**: When an IP address rises above the root of the top-10 heap, its request volume is flagged. If its frequency exceeds a danger threshold, the API gateway immediately triggers dynamic rate-limiting or IP blocking rules.

---

## Tricky Points & Edge Cases

1. **Using Max-Heap Instead of Min-Heap for $K$ Largest**:
   Inserting all $N$ elements into a Max-Heap and extracting $K$ times takes $O(N + K \log N)$ time, but consumes **$O(N)$ space**. For an infinite stream or large dataset ($N = 10^8$), this blows past V8's heap limit. Always use a **Min-Heap of size $K$** to guarantee $O(K)$ bounded space.
2. **Bucket Sort Memory Footprint on Large Values**:
   Bucket Sort relies on the fact that **frequency** is bounded by the array length $N$, not the values themselves. Do not index buckets by element values (which could be $10^9$); always index buckets by frequency ($0 \dots N$).
3. **Handling Duplicate Frequencies in Top $K$**:
   Problems may allow any valid top $k$ subset when multiple items share identical frequencies. Verify whether interview problem statements require deterministic tie-breaking (e.g., lexicographical sorting for identical frequencies).
4. **$K = N$ Boundary Condition**:
   When $K$ equals the array length, simply return the distinct keys or copy of the array directly without allocating heaps or sorting.

---

## Hands-On Exercise

### Scenario
You are building a live analytics dashboard for an e-commerce platform in Node.js. High-frequency click events arrive continuously as `{ productId: string, category: string, price: number }`.
Implement `ProductRankingTracker`:
1. `recordClick(productId)`: Records a user click on a product in $O(1)$ amortized time.
2. `getTopKProducts(k)`: Returns the $k$ most clicked product IDs. If two products have the same click count, return the one that received a click more recently.
3. Must execute efficiently without re-sorting the entire catalogue of thousands of products.

### Buggy Code
```javascript
class ProductRankingTracker {
  constructor() {
    this.clicks = new Map();
  }

  recordClick(productId) {
    this.clicks.set(productId, (this.clicks.get(productId) || 0) + 1);
  }

  getTopKProducts(k) {
    // BUG: Full array sort on every query takes O(P log P) where P is all products!
    const entries = Array.from(this.clicks.entries());
    entries.sort((a, b) => b[1] - a[1]);
    return entries.slice(0, k).map(e => e[0]);
  }
}
```

### Acceptance Criteria
- Track both click count and last-clicked timestamp for deterministic tie-breaking.
- Use a bounded Min-Heap of size $K$ to extract top $K$ products in $O(P \log K)$ time instead of full sorting.
- Handle cases where $K$ exceeds the total number of recorded products.

### Solution Code
```javascript
const assert = require('assert');

// Node.js code: High-Performance Bounded Top-K Tracker
class ProductRankingTracker {
  constructor() {
    /** @type {Map<string, { count: number, lastClicked: number }>} */
    this.productStats = new Map();
    this.tick = 0;
  }

  recordClick(productId) {
    this.tick++;
    const current = this.productStats.get(productId) || { count: 0, lastClicked: 0 };
    current.count++;
    current.lastClicked = this.tick;
    this.productStats.set(productId, current);
  }

  /**
   * Retrieves top K products using bounded Min-Heap.
   * Time Complexity: O(P log K) where P is unique products
   * Space Complexity: O(K)
   * @param {number} k
   * @returns {string[]}
   */
  getTopKProducts(k) {
    if (k <= 0) return [];

    // Min-Heap of size K: root is the lowest-ranked product inside the top K
    const heap = [];

    // Comparator: returns < 0 if a is lower rank than b (should be evicted first)
    const isLowerRank = (a, b) => {
      if (a.count !== b.count) return a.count < b.count;
      return a.lastClicked < b.lastClicked;
    };

    const pushHeap = (item) => {
      heap.push(item);
      let curr = heap.length - 1;
      while (curr > 0) {
        const p = (curr - 1) >> 1;
        if (isLowerRank(heap[curr], heap[p])) {
          [heap[curr], heap[p]] = [heap[p], heap[curr]];
          curr = p;
        } else break;
      }
    };

    const pollHeap = () => {
      if (heap.length <= 1) return heap.pop();
      const root = heap[0];
      heap[0] = heap.pop();
      let curr = 0;
      const n = heap.length;

      while (true) {
        const left = (curr << 1) + 1;
        const right = (curr << 1) + 2;
        let smallest = curr;

        if (left < n && isLowerRank(heap[left], heap[smallest])) smallest = left;
        if (right < n && isLowerRank(heap[right], heap[smallest])) smallest = right;

        if (smallest !== curr) {
          [heap[curr], heap[smallest]] = [heap[smallest], heap[curr]];
          curr = smallest;
        } else break;
      }

      return root;
    };

    for (const [id, stats] of this.productStats.entries()) {
      const candidate = { id, count: stats.count, lastClicked: stats.lastClicked };

      if (heap.length < k) {
        pushHeap(candidate);
      } else if (!isLowerRank(candidate, heap[0])) {
        pollHeap();
        pushHeap(candidate);
      }
    }

    // Extract elements from heap and sort in descending rank
    const result = [];
    while (heap.length > 0) {
      result.push(pollHeap().id);
    }

    return result.reverse(); // Descending order
  }
}

// Verification & Automated Unit Tests
const tracker = new ProductRankingTracker();

tracker.recordClick('prod-A'); // count: 1
tracker.recordClick('prod-B'); // count: 1
tracker.recordClick('prod-A'); // count: 2
tracker.recordClick('prod-C'); // count: 1
tracker.recordClick('prod-B'); // count: 2 (clicked after prod-A's 2nd click)

// Top 2: Both prod-B and prod-A have count 2, but prod-B was clicked more recently!
const top2 = tracker.getTopKProducts(2);
assert.deepStrictEqual(top2, ['prod-B', 'prod-A']);

// Top 3 includes prod-C
const top3 = tracker.getTopKProducts(3);
assert.deepStrictEqual(top3, ['prod-B', 'prod-A', 'prod-C']);

// K larger than unique products
const top10 = tracker.getTopKProducts(10);
assert.strictEqual(top10.length, 3);

console.log('✅ All ProductRankingTracker assertions passed successfully!');
```

### Solution Explanation
1. **Bounded Min-Heap Strategy**: Instead of sorting the entire catalog ($O(P \log P)$), candidate products are routed through a Min-Heap capped at size $K$. Any candidate lower than the heap root is discarded in $O(1)$ time without modifying the heap.
2. **Stable Tie-Breaking**: Tracking `tick` on every click provides deterministic ordering when click frequencies match.
3. **Descending Final Format**: Extracted elements from the Min-Heap emerge in ascending rank; reversing the final $K$ elements yields standard top-ranking presentation in $O(K)$ time.

---

## Summary

- The **Top 'K' Pattern** extracts the most extreme $K$ elements using a bounded heap of size $K$ in $O(n \log K)$ time and $O(K)$ space.
- **Inversion Invariant**: $K$ largest elements require a **Min-Heap**; $K$ smallest elements require a **Max-Heap**.
- **QuickSelect** provides $O(n)$ average time for static in-memory arrays but is unsuitable for streaming data and mutates input.
- **Bucket Sort** solves Top K Frequent Elements in $O(n)$ deterministic time because frequencies cannot exceed the array length $N$.
- In Node.js backend systems, bounded priority queues prevent heap exhaustion during real-time telemetry tracking and DDoS traffic filtering.

---

## Cheat Sheet & Common Pitfalls

| Problem Goal | Optimal Heap Type | Size Constraint | Eviction Condition |
| :--- | :--- | :--- | :--- |
| **Top $K$ Largest** | Min-Heap | Size $K$ | If `val > minHeap.peek()`, poll & push |
| **Top $K$ Smallest** | Max-Heap | Size $K$ | If `val < maxHeap.peek()`, poll & push |
| **$K$-th Largest** | Min-Heap | Size $K$ | Read `minHeap.peek()` at end |
| **Top $K$ Frequent** | Bucket Sort ($O(n)$) or Min-Heap ($O(n \log K)$) | $N + 1$ buckets or Heap size $K$ | Scan backwards from max frequency |

---

## Interview Questions

### 1. Why do you use a Min-Heap instead of a Max-Heap to find the $K$ largest elements?
**Question:** Explain the operational logic behind choosing a Min-Heap over a Max-Heap when finding the $K$ largest elements from a stream.

**Answer:**
To maintain the $K$ largest elements:
1. We want our data structure to hold **only** the $K$ highest values seen so far.
2. Inside that group of $K$ winners, the element at greatest risk of being replaced by a newcomer is the **smallest among them** (the $K$-th largest).
3. A **Min-Heap** places the minimum of those $K$ elements directly at the root in $O(1)$ access time.
4. When a new candidate arrives, we can compare it to the root in $O(1)$:
   - If the candidate is $\le \text{root}$, it cannot be in the top $K$, so we discard it in $O(1)$.
   - If the candidate is $> \text{root}$, we evict the root and insert the candidate in $O(\log K)$ time.
5. If we used a Max-Heap instead, the root would be the *absolute largest* element. There would be no $O(1)$ way to find and evict the smallest of the $K$ elements without storing all $N$ elements in the heap ($O(N)$ space).

---

### 2. What are the key trade-offs between QuickSelect and a Bounded Heap for finding the Kth largest element?

> **QuickSelect**: A divide-and-conquer selection algorithm based on QuickSort partitioning that finds the $k$-th smallest/largest element.
**Question:** Compare QuickSelect against a Min-Heap of size $K$ for LeetCode 215 across time complexity, space complexity, data mutability, and streaming support.

**Answer:**
| Dimension | QuickSelect | Bounded Min-Heap |
| :--- | :--- | :--- |
| **Average Time** | $O(n)$ | $O(n \log K)$ |
| **Worst-Case Time** | $O(n^2)$ (poor pivot choices) | $O(n \log K)$ (strictly guaranteed) |
| **Space Complexity** | $O(1)$ auxiliary (in-place) | $O(K)$ auxiliary |
| **Input Mutability** | Mutates the original input array | Read-only; leaves input untouched |
| **Streaming Data** | Impossible (requires random access to full dataset) | Perfect; processes items one-by-one online |
| **Production Fit** | Best for offline, mutable batch arrays | Best for live streams, immutable data, and small $K \ll n$ |

---

### 3. When does Bucket Sort outperform a Min-Heap for Top K Frequent Elements?
**Question:** Under what circumstances is Bucket Sort preferable to a Min-Heap for Top K Frequent Elements, and what are its memory implications?

**Answer:**
Bucket Sort is strictly preferable when the input array is static and already loaded in memory:
1. **Time Complexity Advantage**: Bucket Sort executes in $O(n)$ deterministic linear time, compared to $O(n \log K)$ for the bounded heap.
2. **Frequency Bound**: Because no element can appear more than $N$ times, the number of buckets is capped at $N + 1$.
3. **Memory Trade-Off**: Bucket Sort allocates an array of $N + 1$ bucket arrays in V8 memory. If $N$ is very large and memory is constrained, or if the data arrives as an infinite stream, a bounded Min-Heap is preferable because its memory footprint is strictly capped at $O(K)$.

---

### 4. How do you implement a rolling Top-K tracker over a sliding 5-minute time window in Node.js?
**Question:** How would you architect a rolling Top-K tracker that only counts events occurring within the last 5 minutes without blowing up memory?

**Answer:**
1. **Time Bucket Segmentation**: Divide the 5-minute window into 30 sub-buckets of 10 seconds each (or 60 buckets of 5 seconds).
2. **Per-Bucket Frequency Counters**: Each sub-bucket maintains a `Map<itemId, count>`.
3. **Sliding Window Ring Buffer**: Store the sub-buckets in a circular array of size 30. Every 10 seconds, clear the oldest bucket and advance the pointer.
4. **Aggregate Top-K Query**: When querying Top $K$, sum the frequencies across the 30 active sub-buckets into a merged map, then feed the entries into a bounded Min-Heap of size $K$.
5. **Memory Bound**: Memory is strictly bounded to the number of distinct items active within the 5-minute window, with old events evicted automatically without individual timestamp scanning.

---

<nav aria-label="Lecture navigation">
  <a href="day-42-min-heap-and-max-heap-implementation.md">◀ Day 42: Min-Heap and Max-Heap Implementation</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-44-two-heaps-median-from-stream.md">Day 44: Two Heaps: Median from Data Stream ▶</a>
</nav>
