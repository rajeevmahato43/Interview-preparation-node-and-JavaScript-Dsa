# Day 42: Min-Heap and Max-Heap Implementation

<nav aria-label="Lecture navigation">
  <a href="day-41-binary-heap-array-representation.md">◀ Day 41: Binary Heap and Array Representation</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-43-top-k-elements-and-kth-largest.md">Day 43: Top 'K' Elements and Kth Largest ▶</a>
</nav>

---
## Prerequisites

- [Day 41: Binary Heap and Array Representation](day-41-binary-heap-array-representation.md) — Complete binary tree array indexing, parent/child arithmetic, and heap invariants.
---

## 1. Heap Mutation Mechanics: Insert and Extract

A Binary Heap must preserve two invariants simultaneously:
1. **The Complete Binary Tree Shape Invariant**: Handled by array length manipulation (`push` and `pop`).
2. **The Heap-Order Invariant**: Handled by bubble-up and bubble-down swapping.

```text
Heap Mutation Step-by-Step Traces:

1. Insert(1) into Min-Heap [2, 4, 7, 10, 8, 15]:
   Step A: Append to end of array (maintains shape)
           [2, 4, 7, 10, 8, 15, (1)]  (1 is at index 6)
   Step B: Bubble-Up:
           - Parent of 6 is (6-1)/2 = 2 (value 7). 1 < 7 -> Swap!
           [2, 4, (1), 10, 8, 15, 7]  (1 is at index 2)
           - Parent of 2 is (2-1)/2 = 0 (value 2). 1 < 2 -> Swap!
           [(1), 4, 2, 10, 8, 15, 7]  (1 is at root index 0)
   Result: Heap order restored in O(log n) swaps!

2. ExtractMin() from Min-Heap [(1), 4, 2, 10, 8, 15, 7]:
   Step A: Save root (1). Overwrite root with last element (7) and pop:
           [(7), 4, 2, 10, 8, 15]     (7 is at index 0)
   Step B: Bubble-Down:
           - Children of index 0 are left=1 (value 4) and right=2 (value 2).
           - Smallest child is index 2 (value 2). 7 > 2 -> Swap!
           [2, 4, (7), 10, 8, 15]     (7 is at index 2)
           - Children of index 2 is left=5 (value 15), right out of bounds.
           - Smallest child is 15. 7 < 15 -> Heap order satisfied! Break.
   Result: Root (1) returned. Heap order restored in O(log n) swaps!
```

---

## 2. Implementation: Production-Grade Heap Class

A production-ready JavaScript implementation must accept a custom comparator, providing support for numbers, strings, and complex domain objects.

```javascript
// Node.js code: Generic PriorityQueue (Min-Heap / Max-Heap)
class PriorityQueue {
  /**
   * @param {(a: any, b: any) => number} [comparator] Default is min-heap: (a, b) => a - b
   */
  constructor(comparator = (a, b) => a - b) {
    this.comparator = comparator;
    this.heap = [];
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  /**
   * Inserts a new element into the heap.
   * Time Complexity: O(log n)
   * @param {any} val
   */
  push(val) {
    this.heap.push(val);
    this._bubbleUp(this.heap.length - 1);
  }

  /**
   * Extracts and returns the root element.
   * Time Complexity: O(log n)
   * @returns {any}
   */
  poll() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const root = this.heap[0];
    // Move last element to root and pop
    this.heap[0] = this.heap.pop();
    this._bubbleDown(0);
    return root;
  }

  /**
   * Sifts an element up until heap order is restored.
   * @param {number} index
   * @private
   */
  _bubbleUp(index) {
    let curr = index;
    while (curr > 0) {
      const parent = (curr - 1) >> 1;
      // If curr is higher priority than parent (comparator returns negative)
      if (this.comparator(this.heap[curr], this.heap[parent]) < 0) {
        this._swap(curr, parent);
        curr = parent;
      } else {
        break;
      }
    }
  }

  /**
   * Sifts an element down until heap order is restored.
   * @param {number} index
   * @private
   */
  _bubbleDown(index) {
    let curr = index;
    const n = this.heap.length;

    while (true) {
      const left = (curr << 1) + 1;
      const right = (curr << 1) + 2;
      let highestPriority = curr;

      if (
        left < n &&
        this.comparator(this.heap[left], this.heap[highestPriority]) < 0
      ) {
        highestPriority = left;
      }

      if (
        right < n &&
        this.comparator(this.heap[right], this.heap[highestPriority]) < 0
      ) {
        highestPriority = right;
      }

      if (highestPriority !== curr) {
        this._swap(curr, highestPriority);
        curr = highestPriority;
      } else {
        break;
      }
    }
  }

  _swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }
}

// Verification
const minH = new PriorityQueue();
minH.push(10);
minH.push(5);
minH.push(20);
minH.push(1);
console.log('Polled min:', minH.poll()); // 1
console.log('Next min:', minH.poll());   // 5
```

---

## 3. Linear Time $O(n)$ Heapify Mathematical Proof

Constructing a heap from an unsorted array of size $n$ can be done in two ways:
1. **$n$ Sequential Insertions**: For each element, call `push(val)`. Total time is:
   $$\sum_{i=1}^n \log i = \log(n!) = O(n \log n)$$
2. **Bottom-Up `buildHeap` (Heapify)**: Place all $n$ elements in the array, then call `bubbleDown` on all internal nodes starting from the last parent $\lfloor (n - 2) / 2 \rfloor$ down to index $0$.

```text
Bottom-Up Heapify Traversal Order:
Array: [10, 20, 15, 30, 40]
Last Parent = (5 - 2) / 2 = 1 (Node 20).
1. Sift-down Node 20 (height 1, at most 1 swap)
2. Sift-down Node 10 (height 2, at most 2 swaps)
Leaves (30, 40, 15) are NEVER sifted down! They have height 0.
```

**The Mathematical Proof**:
- There are $\approx n / 2$ leaves at height $0$ (requiring $0$ swaps).
- There are $\approx n / 4$ nodes at height $1$ (requiring at most $1$ swap).
- There are $\approx n / 8$ nodes at height $2$ (requiring at most $2$ swaps).
- In general, at height $h$, there are at most $\lceil n / 2^{h+1} \rceil$ nodes.

Total swaps $S$:
$$S = \sum_{h=0}^{\lfloor \log_2 n \rfloor} \frac{n}{2^{h+1}} \cdot h = \frac{n}{2} \sum_{h=0}^\infty \frac{h}{2^h}$$

The infinite series $\sum_{h=0}^\infty \frac{h}{2^h}$ converges to exactly $2$:
$$S \le \frac{n}{2} \cdot 2 = n$$
Therefore, **`buildHeap` runs in strictly $O(n)$ linear time**!

```javascript
// Node.js code: In-Place Linear Heapify Function
/**
 * Transforms an array into a valid Min-Heap in-place.
 * Time Complexity: O(n)
 * Space Complexity: O(1)
 * @param {number[]} arr
 */
function heapify(arr) {
  const n = arr.length;
  const lastParent = (n - 2) >> 1;

  function siftDown(curr) {
    while (true) {
      const left = (curr << 1) + 1;
      const right = (curr << 1) + 2;
      let smallest = curr;

      if (left < n && arr[left] < arr[smallest]) smallest = left;
      if (right < n && arr[right] < arr[smallest]) smallest = right;

      if (smallest !== curr) {
        const tmp = arr[curr];
        arr[curr] = arr[smallest];
        arr[smallest] = tmp;
        curr = smallest;
      } else {
        break;
      }
    }
  }

  // Iterate backwards from last parent to root
  for (let i = lastParent; i >= 0; i--) {
    siftDown(i);
  }
}

const unsorted = [60, 20, 40, 10, 50, 30];
heapify(unsorted);
console.log('Heapified array:', unsorted); // Valid min-heap
```

---

## Detailed Node.js Relevance

### Microservice Task Prioritization and Rate Limiting

In high-concurrency Node.js services (e.g., job workers processing BullMQ or RabbitMQ queues):

```text
Priority Dispatch Pipeline:
[Incoming Jobs] ---> [PriorityQueue (Min-Heap)] ---> [Worker Thread Pool]
                      - High-tier customer (weight 1)
                      - Medium-tier (weight 5)
                      - Low-tier free user (weight 10)
```

1. **Starvation Prevention with Composite Comparators**: If workers only prioritize by customer tier, free-tier requests may starve indefinitely. A composite comparator factors in arrival timestamps:
   ```javascript
   const comparator = (a, b) => {
     // Effective priority = tierRank - waitTimeWeight * (now - a.timestamp)
     return a.effectivePriority - b.effectivePriority;
   };
   ```
2. **Event Loop Non-Blocking Execution**: Extracting the top task from a heap takes $O(\log n)$ CPU time (< 1 microsecond for $100,000$ jobs), allowing the Node.js event loop to dispatch jobs to worker threads without noticeable thread stall.

---

## Tricky Points & Edge Cases

1. **Root Extraction on 1-Element Heap**:
   ```javascript
   // ❌ SUBTLE BUG:
   // If heap length is 1:
   this.heap[0] = this.heap.pop(); // Returns the only element, but sets heap[0] to itself!
   // Result: Heap still has length 1!
   // ✅ FIX: Guard explicitly:
   if (this.heap.length === 1) return this.heap.pop();
   ```
2. **Comparator Sign Confusion**:
   Remember JavaScript's convention:
   - For a **Min-Heap**: return a negative number when $a < b$ (`(a, b) => a - b`).
   - For a **Max-Heap**: return a negative number when $a > b$ (`(a, b) => b - a`).
3. **Floating Point Precision**: When prioritizing by floating-point timestamps or weights, avoid bitwise operations (`| 0`, `>> 0`) on the actual values, as bitwise operators truncate numbers to 32-bit signed integers.
4. **Mutating Objects In-Place Inside the Heap**: If an external caller mutates an object already stored inside the heap (e.g., changing `job.priority = 10`), the heap-order property is broken silently. To update a priority, the item must be removed and re-inserted, or its index must be tracked to trigger an explicit bubble-up or bubble-down.

---

## Hands-On Exercise

### Scenario
You are designing an asynchronous task runner in Node.js. Tasks arrive with `{ id: string, priority: number, createdAt: number }`. When two tasks have identical `priority` values, the task created earlier (`createdAt`) must execute first (FIFO tie-breaking).
Implement `TaskScheduler`:
1. `enqueue(task)`: Adds task in $O(\log n)$ time.
2. `dequeue()`: Returns the highest priority task (lowest `priority` number, then lowest `createdAt`).
3. `size()`: Returns remaining task count.

### Buggy Code
```javascript
class TaskScheduler {
  constructor() {
    this.tasks = [];
  }

  enqueue(task) {
    this.tasks.push(task);
    // BUG: Bubble-up ignores tie-breaking condition createdAt
    let curr = this.tasks.length - 1;
    while (curr > 0) {
      let p = (curr - 1) >> 1;
      if (this.tasks[curr].priority < this.tasks[p].priority) {
        [this.tasks[curr], this.tasks[p]] = [this.tasks[p], this.tasks[curr]];
        curr = p;
      } else {
        break;
      }
    }
  }

  dequeue() {
    // BUG: Calls array.shift(), causing O(N) performance degradation!
    return this.tasks.shift();
  }
}
```

### Acceptance Criteria
- Preserve FIFO ordering when tasks share the same priority score.
- Ensure `dequeue()` operates in strictly $O(\log n)$ time without calling `shift()`.
- Return `null` when dequeuing from an empty scheduler.

### Solution Code
```javascript
const assert = require('assert');

// Node.js code: Production Task Scheduler with Stable Tie-Breaking
class TaskScheduler {
  constructor() {
    this.heap = [];
  }

  size() {
    return this.heap.length;
  }

  /**
   * Compares two tasks:
   * Returns < 0 if a should come before b
   */
  _compare(a, b) {
    if (a.priority !== b.priority) {
      return a.priority - b.priority; // Lower number = higher priority
    }
    // Tie-breaker: earlier creation time comes first
    return a.createdAt - b.createdAt;
  }

  enqueue(task) {
    this.heap.push(task);
    this._bubbleUp(this.heap.length - 1);
  }

  dequeue() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const top = this.heap[0];
    this.heap[0] = this.heap.pop();
    this._bubbleDown(0);
    return top;
  }

  _bubbleUp(index) {
    let curr = index;
    while (curr > 0) {
      const parent = (curr - 1) >> 1;
      if (this._compare(this.heap[curr], this.heap[parent]) < 0) {
        this._swap(curr, parent);
        curr = parent;
      } else {
        break;
      }
    }
  }

  _bubbleDown(index) {
    let curr = index;
    const n = this.heap.length;

    while (true) {
      const left = (curr << 1) + 1;
      const right = (curr << 1) + 2;
      let highest = curr;

      if (left < n && this._compare(this.heap[left], this.heap[highest]) < 0) {
        highest = left;
      }

      if (right < n && this._compare(this.heap[right], this.heap[highest]) < 0) {
        highest = right;
      }

      if (highest !== curr) {
        this._swap(curr, highest);
        curr = highest;
      } else {
        break;
      }
    }
  }

  _swap(i, j) {
    const tmp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = tmp;
  }
}

// Verification & Automated Unit Tests
const scheduler = new TaskScheduler();

// Insert tasks with priority and creation timestamps
scheduler.enqueue({ id: 'task-c', priority: 2, createdAt: 1000 });
scheduler.enqueue({ id: 'task-a', priority: 1, createdAt: 1050 });
scheduler.enqueue({ id: 'task-b1', priority: 2, createdAt: 800 }); // Same priority as C, but created earlier
scheduler.enqueue({ id: 'task-b2', priority: 2, createdAt: 900 });

// Assertions
// 1. Highest priority (lowest number = 1)
assert.strictEqual(scheduler.dequeue().id, 'task-a');

// 2. Priority 2 with earliest timestamp (createdAt: 800)
assert.strictEqual(scheduler.dequeue().id, 'task-b1');

// 3. Priority 2 with next timestamp (createdAt: 900)
assert.strictEqual(scheduler.dequeue().id, 'task-b2');

// 4. Priority 2 with latest timestamp (createdAt: 1000)
assert.strictEqual(scheduler.dequeue().id, 'task-c');

// 5. Empty dequeue
assert.strictEqual(scheduler.dequeue(), null);
assert.strictEqual(scheduler.size(), 0);

console.log('✅ All TaskScheduler assertions passed successfully!');
```

### Solution Explanation
1. **Composite Comparator**: Encapsulating both `priority` and `createdAt` in `_compare(a, b)` provides deterministic ordering without unstable sorting.
2. **Correct Single-Element Extraction**: Handling `if (this.heap.length === 1) return this.heap.pop()` eliminates the array self-overwrite bug.
3. **Logarithmic Bound**: Both `enqueue` and `dequeue` are guaranteed to run in $O(\log n)$ time.

---

## Summary

- Heaps maintain both a complete binary tree **shape invariant** and a parent-child **order invariant**.
- Insertion (`push`) places the item at the array tail and calls **Bubble-Up** ($O(\log n)$).
- Extraction (`poll`) replaces the root with the array tail, removes the tail, and calls **Bubble-Down** ($O(\log n)$).
- **Linear Heapify**: Bottom-up sift-down on internal nodes builds a heap in $O(n)$ time because the majority of nodes are located near the bottom where tree heights are minimal.
- Custom comparators enable priority queues to manage complex domain records with custom tie-breaking in Node.js backend systems.

---

## Cheat Sheet & Common Pitfalls

| Heap Method | Algorithm | Time Complexity | Direction |
| :--- | :--- | :--- | :--- |
| **`push(val)`** | Append to array, then Bubble-Up | $O(\log n)$ | Leaf $\to$ Root |
| **`poll()`** | Swap root with tail, pop tail, Bubble-Down | $O(\log n)$ | Root $\to$ Leaf |
| **`peek()`** | Inspect `heap[0]` | $O(1)$ | Direct read |
| **`heapify(arr)`** | Sift-down backwards from $\lfloor (n - 2) / 2 \rfloor$ | $O(n)$ | Bottom-up |

---

## Interview Questions

### 1. Why does bottom-up `heapify` run in $O(n)$ time while $n$ insertions take $O(n \log n)$?
**Question:** Mathematically explain why building a heap using bottom-up sift-down takes $O(n)$ time, whereas inserting $n$ elements one by one takes $O(n \log n)$ time.

**Answer:**
- **Top-Down Insertions ($n \log n$)**: Each insertion occurs at a leaf (maximum tree depth). The majority of nodes (the bottom half of the tree) must bubble up through the entire height $O(\log n)$. Hence, $n / 2$ nodes do $O(\log n)$ work, yielding $\Theta(n \log n)$.
- **Bottom-Up Heapify ($O(n)$)**: Heapify works in reverse. Nodes are processed from the bottom up.
  - The $n / 2$ leaf nodes are already valid subtrees and require **0 swaps**.
  - The $n / 4$ nodes at height 1 require at most **1 swap**.
  - The $n / 8$ nodes at height 2 require at most **2 swaps**.
  - Only the 1 root node requires $O(\log n)$ swaps.
  Summing $\sum_{h=0}^{\log n} \frac{n}{2^{h+1}} \cdot h = \frac{n}{2} \sum_{h=0}^\infty \frac{h}{2^h} = \frac{n}{2} \cdot 2 = O(n)$. Because the largest number of nodes perform the smallest amount of work, the total time is strictly linear.

---

### 2. What happens if you extract the root of a heap with only one element without guarding?
**Question:** Explain the bug that occurs if `poll()` does not check whether `heap.length === 1` before setting `heap[0] = heap.pop()`.

**Answer:**
If `this.heap.length === 1`:
1. Calling `this.heap.pop()` removes the single element from the array and returns it.
2. Assigning `this.heap[0] = this.heap.pop()` immediately puts that same element back into index 0 of the array!
3. The array length remains 1 instead of decreasing to 0.
4. Calling `_bubbleDown(0)` performs redundant work, and subsequent calls to `isEmpty()` or `size()` return invalid results.
**Fix**: Explicitly guard: `if (this.heap.length === 1) return this.heap.pop();`.

---

### 3. How do you implement a Max-Heap using a Min-Heap implementation?
**Question:** Given an existing generic `MinHeap` class that sorts numbers in ascending order, how can you use it to behave as a Max-Heap without rewriting internal logic?

**Answer:**
There are two standard approaches:
1. **Negation Technique**: Multiply every number by $-1$ before inserting, and multiply by $-1$ again upon extraction:
   ```javascript
   minHeap.push(-val);
   const maxVal = -minHeap.poll();
   ```
   Because $-A < -B \iff A > B$, the smallest negative number corresponds to the largest positive number.
2. **Comparator Inversion**: If the heap accepts a custom comparator, pass an inverted comparison function:
   ```javascript
   const maxHeap = new PriorityQueue((a, b) => b - a);
   ```
   Returning a negative number when $b < a$ causes the larger value to rise to the root.

---

### 4. How can you remove an arbitrary element from the middle of a binary heap in $O(\log n)$ time?
**Question:** In a priority queue, removing the root takes $O(\log n)$. How do you delete an arbitrary element at index $i$ in $O(\log n)$ time?

**Answer:**
To remove an element at index $i$:
1. Swap `heap[i]` with the last element in the heap (`heap[heap.length - 1]`).
2. Pop the last element from the array.
3. To restore the heap property, compare the swapped element with its new parent and children:
   - If the swapped element is higher priority than its new parent, call `_bubbleUp(i)`.
   - If it is lower priority than its children, call `_bubbleDown(i)`.
4. **Index Tracking**: To find index $i$ in $O(1)$ time rather than searching in $O(n)$, maintain a companion `Map<elementId, arrayIndex>` updated on every swap.
5. Total removal time is strictly $O(\log n)$.

---

<nav aria-label="Lecture navigation">
  <a href="day-41-binary-heap-array-representation.md">◀ Day 41: Binary Heap and Array Representation</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-43-top-k-elements-and-kth-largest.md">Day 43: Top 'K' Elements and Kth Largest ▶</a>
</nav>
