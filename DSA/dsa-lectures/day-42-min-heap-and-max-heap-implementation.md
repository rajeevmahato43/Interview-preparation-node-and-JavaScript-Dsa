# Day 42: Min-Heap and Max-Heap Implementation

## 1. Learning Outcomes
- Implement a reusable, production-ready `MinHeap` and `MaxHeap` class in JavaScript.
- Master the **Bubble-Up (Sift-Up)** algorithm for $O(\log n)$ heap insertion.
- Master the **Bubble-Down (Sift-Down)** algorithm for $O(\log n)$ root extraction.
- Mathematically prove and implement **Linear Time Heapify ($O(n)$)** to build a heap from an unsorted array.
- Support custom comparators for prioritizing complex objects in Node.js backend systems.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 41 (Binary Heap Array Representation).
- **Navigation**:
  - [Previous: Day 41 - Binary Heap and Array Representation](day-41-binary-heap-array-representation.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 43 - Top 'K' Elements and Kth Largest](day-43-top-k-elements-and-kth-largest.md)

---

## 3. Core Concepts & Mental Models
Heap mutations preserve two invariants simultaneously:
1. **Shape Invariant**: The heap remains a complete binary tree.
2. **Order Invariant**: Every parent satisfies the comparison relationship with its children.

```text
Heap Mutation Operations:
1. Insert(1):
   - Push to end of array (maintains shape).
   - Bubble-Up: Swap with parent while child < parent.
   [2, 4, 7, 10, 8, 15, (1)]  -->  [1, 4, 2, 10, 8, 15, 7]

2. ExtractMin():
   - Save root [1].
   - Overwrite root with last element [7] and pop last slot.
   - Bubble-Down: Swap with smallest child while parent > child.
   [(7), 4, 2, 10, 8, 15]      -->  [2, 4, 7, 10, 8, 15]
```

---

## 4. Detailed Technical Explanations

### 4.1 Bubble-Up (Sift-Up) Algorithm
- Insertion occurs at the next available array position (`heap.push(val)`).
- While index $> 0$ and `comparator(heap[index], heap[parent]) < 0`:
  - Swap current element with parent element.
  - Set `index = parentIndex`.
- Maximum swaps: Height of tree = $\lfloor \log_2 n \rfloor \implies O(\log n)$ time.

### 4.2 Bubble-Down (Sift-Down) Algorithm
- Extracting the root leaves an empty slot at index 0. Moving the last element to index 0 preserves the complete binary tree shape.
- While left child exists:
  - Find the smaller of the two children (if right child exists and is smaller, choose right; otherwise choose left).
  - If current element is already smaller than the chosen child, break (heap order satisfied).
  - Otherwise, swap with chosen child and update index.
- Maximum swaps: Height of tree $\implies O(\log n)$ time.

### 4.3 Why `buildHeap` (Heapify) is $O(n)$, NOT $O(n \log n)$
Inserting $n$ elements one-by-one takes $n \cdot O(\log n) = O(n \log n)$.
In contrast, **bottom-up Heapify** starts at the last non-leaf node ($\lfloor n/2 \rfloor - 1$) and calls `bubbleDown` backwards down to index 0:
- Leaves ($\approx n/2$ nodes) require $0$ swaps.
- Nodes 1 level above leaves ($\approx n/4$ nodes) require at most $1$ swap.
- Root ($1$ node) requires at most $\log n$ swaps.
Sum of work:
$$\sum_{h=0}^{\log n} \frac{n}{2^{h+1}} \cdot h = n \sum_{h=0}^{\infty} \frac{h}{2^{h+1}} = n \cdot 1 = O(n)$$

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 Generic PriorityQueue / Heap Class
```javascript
class PriorityQueue {
  /**
   * @param {Function} comparator - Defaults to Min-Heap: (a, b) => a - b
   */
  constructor(comparator = (a, b) => a - b) {
    this.heap = [];
    this.comparator = comparator;
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

  insert(val) {
    this.heap.push(val);
    this._bubbleUp(this.heap.length - 1);
  }

  extract() {
    if (this.isEmpty()) return null;
    if (this.size() === 1) return this.heap.pop();

    const root = this.heap[0];
    this.heap[0] = this.heap.pop(); // Move last element to root
    this._bubbleDown(0);
    return root;
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parentIdx = Math.floor((index - 1) / 2);
      // If child has higher priority than parent, swap
      if (this.comparator(this.heap[index], this.heap[parentIdx]) < 0) {
        this._swap(index, parentIdx);
        index = parentIdx;
      } else {
        break;
      }
    }
  }

  _bubbleDown(index) {
    const length = this.heap.length;

    while (2 * index + 1 < length) {
      let bestChildIdx = 2 * index + 1; // Left child
      const rightChildIdx = 2 * index + 2;

      // If right child exists and has higher priority than left child
      if (
        rightChildIdx < length &&
        this.comparator(this.heap[rightChildIdx], this.heap[bestChildIdx]) < 0
      ) {
        bestChildIdx = rightChildIdx;
      }

      // If best child has higher priority than current node, swap
      if (this.comparator(this.heap[bestChildIdx], this.heap[index]) < 0) {
        this._swap(index, bestChildIdx);
        index = bestChildIdx;
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

  /**
   * O(n) Linear Bottom-Up Heapify
   */
  static fromArray(arr, comparator = (a, b) => a - b) {
    const pq = new PriorityQueue(comparator);
    pq.heap = [...arr];
    // Start at last non-leaf node and bubble-down backwards
    for (let i = Math.floor(pq.heap.length / 2) - 1; i >= 0; i--) {
      pq._bubbleDown(i);
    }
    return pq;
  }
}
```

### 5.2 Execution Trace: Linear Heapify on `[10, 20, 5, 30, 2, 8]`
```text
Array: [10, 20, 5, 30, 2, 8], length = 6.
Last non-leaf index = Math.floor(6/2) - 1 = index 2 (val: 5).

1. _bubbleDown(2):
   Left child is index 5 (val: 8). 5 < 8 -> No swap.
2. _bubbleDown(1):
   Left child idx 3 (30), Right child idx 4 (2).
   Best child is 2 (idx 4). 2 < 20 -> Swap 20 with 2!
   Heap: [10, 2, 5, 30, 20, 8]
3. _bubbleDown(0):
   Left child idx 1 (2), Right child idx 2 (5).
   Best child is 2 (idx 1). 2 < 10 -> Swap 10 with 2!
   Heap: [2, 10, 5, 30, 20, 8].
   Continue bubbleDown from index 1:
   Children are 30 and 20. Best is 20 (idx 4). 10 < 20 -> Stop!
Final Heap: [2, 10, 5, 30, 20, 8]. Valid Min-Heap built in O(n) time!
```

---

## 6. Common Mistakes & Anti-Patterns
- **Swapping with the Wrong Child**: In `bubbleDown`, swapping with the *first* child that is smaller rather than the *smallest* of both children violates the heap invariant.
- **Popping Root Without Rewiring**: Calling `heap.shift()` instead of swapping with the last element triggers an $O(n)$ array reindexing across the entire heap on every extract.
- **Off-By-One in Heapify Loop**: Starting heapify at index $n - 1$ instead of $\lfloor n/2 \rfloor - 1$ wastes iterations on leaf nodes that cannot bubble down.

---

## 7. Tricky Points & Edge Cases
- **Handling Single-Element Extraction**: Guard `if (this.size() === 1) return this.heap.pop();` to avoid copying the only element to itself and corrupting the array.
- **Max-Heap Comparator Syntax**: For a Max-Heap of numbers, supply comparator `(a, b) => b - a`.
- **Duplicate Elements**: When values are equal, comparator returns 0; the algorithm breaks early without unnecessary swaps.

---

## 8. Practical Engineering Exercises
1. Implement an in-place `heapSort(arr)` function in $O(n \log n)$ time and $O(1)$ space using Max-Heap linear heapify.
2. Add a `remove(val)` method to `PriorityQueue` that finds and unlinks an arbitrary element in $O(n)$ search and $O(\log n)$ rebalance.

---

## 9. Key Takeaways & Summary
- `insert` appends to tail and bubbles up in $O(\log n)$ time.
- `extract` swaps root with tail, pops, and bubbles down in $O(\log n)$ time.
- Bottom-up heapify builds a valid heap from any array in strictly linear $O(n)$ time.
- Passing a custom comparator enables both Min-Heaps and Max-Heaps for arbitrary object schemas.

---

## 10. Quick Reference Cheat Sheet
| Operation | Method | Time Complexity | Auxiliary Space |
| :--- | :--- | :--- | :--- |
| **Peek** | `heap[0]` | $O(1)$ | $O(1)$ |
| **Insert** | `push` + `bubbleUp` | $O(\log n)$ | $O(1)$ |
| **Extract** | Swap root + `pop` + `bubbleDown` | $O(\log n)$ | $O(1)$ |
| **Heapify** | Bottom-up `bubbleDown` from $\lfloor n/2 \rfloor - 1$ | $O(n)$ | $O(1)$ |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: Mathematically prove why building a heap from an array using bottom-up Heapify takes $O(n)$ time instead of $O(n \log n)$.  
**Hint**: Express total operations as a sum of node counts at height $h$ multiplied by height $h$.  
**Expected Answer Shape**: A heap of size $n$ has height $H = \log n$. At height $h$, there are at most $\lceil n/2^{h+1} \rceil$ nodes, and each node can sift down at most $h$ levels. The total work is $S = \sum_{h=0}^{\log n} \frac{n}{2^{h+1}} h = \frac{n}{2} \sum_{h=0}^{\infty} \frac{h}{2^h}$. The infinite series $\sum_{h=0}^{\infty} \frac{h}{2^h}$ converges to 2. Therefore, total operations equal $\frac{n}{2} \cdot 2 = O(n)$ time.

### 2. Code-Writing
**Question**: Write an in-place `heapSort` function in JavaScript that sorts an array in ascending order in $O(n \log n)$ time and $O(1)$ space.  
**Hint**: Build a Max-Heap, then repeatedly swap root with the last index and sift down.  
**Expected Answer Shape**: Build a Max-Heap in-place via `bubbleDown` from $\lfloor n/2 \rfloor - 1$ down to 0. Then iterate `i` from $n - 1$ down to 1: swap `arr[0]` with `arr[i]`, and call `bubbleDown(arr, 0, i)` on the reduced heap of size $i$. When the loop finishes, the array is sorted in ascending order with $O(1)$ auxiliary space.

### 3. Debugging
**Question**: Identify why this `bubbleDown` implementation causes an infinite loop:  
```javascript
_bubbleDown(i) {
  let left = 2 * i + 1;
  while (left < this.heap.length) {
    if (this.heap[left] < this.heap[i]) {
      this._swap(i, left);
      i = left;
    }
  }
}
```  
**Hint**: What happens if the left child is larger than or equal to the current node?  
**Expected Answer Shape**: If `this.heap[left] >= this.heap[i]`, the swap is skipped, `i` is never updated, and the while condition `left < this.heap.length` remains permanently true, locking the Node.js event loop in an infinite loop. It also completely ignores the right child. Must break when heap condition is met.

### 4. System Design / Tradeoff
**Question**: In building a distributed priority task dispatcher in Node.js, would you maintain a local in-memory heap or use Redis Sorted Sets?  
**Hint**: Single-instance CPU speed vs. multi-replica persistence and race conditions.  
**Expected Answer Shape**: An in-memory JavaScript `PriorityQueue` executes heap operations in sub-microsecond time with zero network overhead, but task state is lost on process crash and cannot be shared across clustered Node.js workers. Redis Sorted Sets (`ZADD`, `ZPOPMIN`) provide atomic $O(\log n)$ priority queue operations shared across multiple Node.js instances with persistence and clustering support, making them the standard choice for distributed architectures.

### 5. Tricky / Edge Case
**Question**: How does a custom comparator `(a, b) => a.priority - b.priority` handle two tasks with the same priority value? How would you enforce FIFO tie-breaking?  
**Hint**: Store a secondary sequence counter with each task.  
**Expected Answer Shape**: Binary heaps are not stable by default; elements with equal priority can be extracted in arbitrary order. To enforce FIFO tie-breaking, attach an incremental sequence number `seq` upon insertion. Update comparator: `if (a.priority !== b.priority) return a.priority - b.priority; return a.seq - b.seq;`.

### 6. Real-World Node.js Context
**Question**: How does BullMQ / Celery-style delayed job scheduling utilize a Priority Queue in Node.js?  
**Hint**: Jobs with future execution timestamps (`runAt`).  
**Expected Answer Shape**: Delayed jobs specify a delay or target execution timestamp (`runAt = Date.now() + delay`). The scheduler enqueues jobs into a Min-Heap ordered by `runAt`. A single timer checks the root (`heap.peek()`). When `Date.now() >= root.runAt`, the job is extracted and dispatched to worker pools. If not, the timer sleeps until `root.runAt - Date.now()`, avoiding polling loops.
