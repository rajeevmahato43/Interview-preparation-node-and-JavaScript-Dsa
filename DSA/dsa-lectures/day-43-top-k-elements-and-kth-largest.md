# Day 43: Top 'K' Elements and Kth Largest

## 1. Learning Outcomes
- Master the **Top 'K' Elements Pattern** using bounded heaps of size $K$.
- Solve the **Kth Largest Element in an Array** using a Min-Heap of size $K$ ($O(n \log K)$ time, $O(K)$ space).
- Understand why finding $K$ largest elements requires a **Min-Heap**, while finding $K$ smallest requires a **Max-Heap**.
- Solve **Top K Frequent Elements** combining frequency maps with priority queues and explore $O(n)$ Bucket Sort.
- Apply Top K algorithms to real-time telemetry, trending analytics, and API top-consumer tracking in Node.js.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 06 (Frequency Counting & Hash Tables), Day 42 (Min-Heap & Max-Heap Implementation).
- **Navigation**:
  - [Previous: Day 42 - Min-Heap and Max-Heap Implementation](day-42-min-heap-and-max-heap-implementation.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 44 - Two Heaps: Median from Data Stream](day-44-two-heaps-median-from-stream.md)

---

## 3. Core Concepts & Mental Models
A naive approach to finding the $K$-th largest element is sorting the entire array: $O(n \log n)$ time.
By keeping a **bounded Min-Heap of size $K$**, we only store the $K$ largest elements seen so far. The root of the Min-Heap is always the *minimum of the $K$ largest elements*—which is precisely the $K$-th largest element!

```text
Top K Largest via Min-Heap of Size K = 3:
Stream of numbers: [10, 5, 20, 8, 25, 3]

1. Insert 10, 5, 20:       Heap = [5, 10, 20] (size 3)
2. Number 8 arrives:       8 > min(5) -> pop 5, insert 8. Heap = [8, 10, 20]
3. Number 25 arrives:      25 > min(8) -> pop 8, insert 25. Heap = [10, 20, 25]
4. Number 3 arrives:       3 < min(10) -> ignore!
Final Heap: [10, 20, 25]. Root is 10 = 3rd largest element!
```

### The Inversion Invariant
- **$K$ Largest Elements**: Use a **Min-Heap** of size $K$. Evict smallest values whenever size exceeds $K$.
- **$K$ Smallest Elements**: Use a **Max-Heap** of size $K$. Evict largest values whenever size exceeds $K$.

---

## 4. Detailed Technical Explanations

### 4.1 Time & Space Complexity Comparison
| Method | Time Complexity | Auxiliary Space | Best When |
| :--- | :--- | :--- | :--- |
| **Full Sort** | $O(n \log n)$ | $O(n)$ | One-off offline batch |
| **Min-Heap (size $K$)** | $O(n \log K)$ | $O(K)$ | Streaming data, $K \ll n$ |
| **QuickSelect** | $O(n)$ average / $O(n^2)$ worst | $O(1)$ | Mutable in-memory static array |
| **Bucket Sort** | $O(n)$ | $O(n)$ | Frequencies bounded by array length |

### 4.2 Streaming Data Advantage
When data arrives as a continuous infinite stream (e.g., live WebSocket messages in Node.js), sorting the entire dataset is impossible. A bounded heap maintains the Top $K$ elements in real time with constant $O(K)$ memory.

### 4.3 Node.js Relevance: Real-Time Trending Metrics & Heavy-Hitter APIs
In API gateways (e.g., Express or Fastify reverse proxies), telemetry tracks which IP addresses or user IDs consume the highest request volume. A bounded priority queue retains the Top 100 heaviest consumers over sliding time windows without buffering millions of raw HTTP request logs in V8 heap memory.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 Kth Largest Element in an Array (LeetCode 215)
```javascript
import { PriorityQueue } from './day-42-min-heap-and-max-heap-implementation.js';

/**
 * Finds the kth largest element using a Min-Heap of size k.
 * Time Complexity: O(n log k)
 * Space Complexity: O(k)
 */
function findKthLargest(nums, k) {
  // Min-Heap comparator: smaller numbers have higher extraction priority
  const minHeap = new PriorityQueue((a, b) => a - b);

  for (const num of nums) {
    minHeap.insert(num);

    // Keep heap size strictly <= k
    if (minHeap.size() > k) {
      minHeap.extract(); // Evict smallest element
    }
  }

  // The root of min-heap of size k is the kth largest element!
  return minHeap.peek();
}
```

### 5.2 Top K Frequent Elements (LeetCode 347)
```javascript
/**
 * Returns k most frequent elements.
 * Time Complexity: O(n log k)
 * Space Complexity: O(n + k)
 */
function topKFrequent(nums, k) {
  // 1. Build frequency map
  const freqMap = new Map();
  for (const num of nums) {
    freqMap.set(num, (freqMap.get(num) || 0) + 1);
  }

  // 2. Min-Heap of size k ordered by frequency
  const minHeap = new PriorityQueue((a, b) => a.count - b.count);

  for (const [val, count] of freqMap.entries()) {
    minHeap.insert({ val, count });

    if (minHeap.size() > k) {
      minHeap.extract();
    }
  }

  // 3. Extract all remaining elements in heap
  const result = [];
  while (!minHeap.isEmpty()) {
    result.push(minHeap.extract().val);
  }

  return result;
}
```

### 5.3 Execution Trace: `findKthLargest([3, 2, 1, 5, 6, 4], 2)`
```text
k = 2. minHeap bounded to size 2:
num = 3: heap = [3]
num = 2: heap = [2, 3] (size = 2)
num = 1: heap.insert(1) -> [1, 3, 2]. size 3 > 2 -> extract() pops 1. heap = [2, 3]
num = 5: heap.insert(5) -> [2, 3, 5]. size 3 > 2 -> extract() pops 2. heap = [3, 5]
num = 6: heap.insert(6) -> [3, 5, 6]. size 3 > 2 -> extract() pops 3. heap = [5, 6]
num = 4: heap.insert(4) -> [4, 6, 5]. size 3 > 2 -> extract() pops 4. heap = [5, 6]
Result: minHeap.peek() = 5 (2nd largest element in array)!
```

---

## 6. Common Mistakes & Anti-Patterns
- **Using a Max-Heap of Size $N$ Instead of Min-Heap of Size $K$**: Building a Max-Heap of all $N$ elements takes $O(N)$ or $O(N \log N)$ and extracting $K$ times takes $O(K \log N)$. When $N = 10^7$ and $K = 5$, a Max-Heap allocates $10^7$ elements; a Min-Heap of size $K$ only holds 5 elements!
- **Using a Max-Heap to Find Top $K$ Largest**: If you use a Max-Heap of size $K$ and pop when size $> K$, you evict the *largest* element, keeping only small elements.
- **Sorting Entire Hash Map in Top K Frequent**: Running `Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, k)` takes $O(U \log U)$ time ($U$ = unique elements). When $U$ is large and $K$ is small, a bounded heap is significantly faster.

---

## 7. Tricky Points & Edge Cases
- **Duplicate Values**: Handled naturally; identical values simply occupy separate slots in the heap.
- **$K = 1$**: Minimum heap size of 1 simply tracks the global maximum element in $O(n)$ time.
- **Bucket Sort Alternative for Top K Frequent**: Because element frequencies are integers bounded by $N$, we can create an array of buckets `buckets[count] = [val1, val2]`. Scanning backwards from index $N$ down to 1 yields $O(N)$ time without any heap!

---

## 8. Practical Engineering Exercises
1. Implement **Top K Frequent Elements** using the $O(n)$ **Bucket Sort** algorithm.
2. Implement **Sort Characters By Frequency** (LeetCode 451) returning a string with characters sorted in decreasing order of frequency.

---

## 9. Key Takeaways & Summary
- Top $K$ largest elements uses a Min-Heap of size $K$.
- Top $K$ smallest elements uses a Max-Heap of size $K$.
- Space complexity is bounded to $O(K)$, making heaps optimal for streaming infinite data.
- Top K Frequent combines a Frequency Hash Map ($O(n)$) with a bounded heap of size $K$ ($O(U \log K)$).

---

## 10. Quick Reference Cheat Sheet
| Goal | Heap Type | Bounded Size | Complexity |
| :--- | :--- | :--- | :--- |
| **$K$ Largest** | Min-Heap | $K$ | $O(n \log K)$ time, $O(K)$ space |
| **$K$ Smallest** | Max-Heap | $K$ | $O(n \log K)$ time, $O(K)$ space |
| **Top $K$ Frequent** | Min-Heap by freq | $K$ | $O(n + U \log K)$ |
| **$K$ Closest to Origin** | Max-Heap by dist | $K$ | $O(n \log K)$ |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: Explain why finding the $K$ largest elements requires a Min-Heap rather than a Max-Heap when maintaining a bounded size $K$.  
**Hint**: What element must be evicted when the heap size exceeds $K$?  
**Expected Answer Shape**: We want to keep only the $K$ largest elements encountered. When a new element arrives and the heap size exceeds $K$, we must evict the *smallest* among the candidates. A Min-Heap exposes the minimum element at its root in $O(1)$ time, allowing instant eviction of the candidate with the lowest value in $O(\log K)$ time. A Max-Heap would expose the maximum element at the root, which is the exact element we want to retain.

### 2. Code-Writing
**Question**: Write `kClosest(points, k)` to find the $K$ closest points to the origin $(0, 0)$ in 2D space.  
**Hint**: Maintain a Max-Heap of size $K$ based on Euclidean distance $x^2 + y^2$.  
**Expected Answer Shape**: Distance metric is $d = x^2 + y^2$ (square roots unnecessary for comparison). Use a Max-Heap bounded to size $K$ with comparator `(a, b) => (b.x^2 + b.y^2) - (a.x^2 + a.y^2)`. Push each point; if heap size $> K$, evict the maximum distance point. Return remaining points in $O(n \log K)$ time and $O(K)$ space.

### 3. Debugging
**Question**: Identify why this QuickSelect implementation encounters an infinite loop on arrays with duplicate elements:  
```javascript
function quickSelect(arr, left, right, k) {
  let pivot = arr[right];
  let p = left;
  for (let i = left; i < right; i++) {
    if (arr[i] <= pivot) {
      [arr[i], arr[p]] = [arr[p], arr[i]];
      p++;
    }
  }
  [arr[p], arr[right]] = [arr[right], arr[p]];
  if (p === k) return arr[p];
  if (p < k) return quickSelect(arr, p + 1, right, k);
  return quickSelect(arr, left, p - 1, k);
}
```  
**Hint**: What happens if all elements in `arr` are identical?  
**Expected Answer Shape**: When all elements are identical, `arr[i] <= pivot` evaluates true for every element, placing `p = right`. The recursive call does not shrink the partition window evenly, resulting in worst-case $O(n^2)$ time and call-stack overflow on large duplicate arrays. Implement 3-way Dutch National Flag partitioning (`< pivot`, `== pivot`, `> pivot`) to handle duplicate keys in $O(n)$ time.

### 4. System Design / Tradeoff
**Question**: Compare using a Bounded Heap vs. Redis Sorted Sets for computing the Top 10 trending products in a Node.js e-commerce application receiving 50,000 purchase events/sec.  
**Hint**: Event loop CPU saturation vs. network I/O.  
**Expected Answer Shape**: Writing 50,000 network requests per second directly to Redis will saturate network sockets. A local in-memory batching buffer in Node.js aggregates counts over a 5-second interval using a Hash Map and bounded Min-Heap. The local top 100 products are then flushed to Redis periodically via `ZINCRBY` pipelining, combining minimal Node.js event loop overhead with shared distributed ranking.

### 5. Tricky / Edge Case
**Question**: When is Bucket Sort preferred over a Heap for finding Top $K$ Frequent Elements?  
**Hint**: Upper bound on frequencies vs. unique values.  
**Expected Answer Shape**: The maximum possible frequency of any element is $N$ (the length of the input array). Bucket Sort creates an array of size $N + 1$ where index $i$ stores a list of elements with frequency $i$. Populating the buckets takes $O(N)$ time, and iterating backwards to gather $K$ elements takes $O(N)$ time. This achieves strictly linear $O(N)$ time and space, outperforming the heap's $O(N \log K)$ time when $K$ is large.

### 6. Real-World Node.js Context
**Question**: You are implementing an in-memory sliding window rate limiter in Node.js. How does a priority queue help identify the top abusive IP addresses over the last 60 seconds?  
**Hint**: IP request timestamp logs and bounded count heaps.  
**Expected Answer Shape**: Store incoming request timestamps in a circular buffer or Map of IPs. A periodic cleanup task evicts timestamps older than 60 seconds. To report the top 10 abusive IPs, iterate over the aggregated active IP counts and push into a Min-Heap of size 10. The heap extracts the 10 worst offenders in $O(U \log 10) = O(U)$ time without locking the event loop by sorting all unique IPs.
