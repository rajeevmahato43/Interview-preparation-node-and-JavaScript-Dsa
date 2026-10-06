# Day 5: Heaps, Priority Queues, and Scheduling

Quick review of main-course lectures 41–45. Covers binary heap invariants in arrays, custom priority queue implementations in JavaScript, top-K filtering, two-heap streaming medians, and multi-way merging.

## Binary heaps and priority queues

**1. Array representation and heap index math**

Store complete binary trees sequentially in flat arrays without pointer overhead. For zero-based index $i$:
`parent = Math.floor((i - 1) / 2)`, `left = 2 * i + 1`, `right = 2 * i + 2`.

**2. MinHeap implementation (bubble up and sift down)**

Maintain the invariant: `parent <= children`. Insert at the end and bubble up ($O(\log n)$); extract root by moving the last element to index 0 and sifting down ($O(\log n)$).

```js
class MinHeap {
  constructor() { this.heap = []; }
  peek() { return this.heap[0]; }
  size() { return this.heap.length; }
  push(val) {
    this.heap.push(val);
    this.bubbleUp(this.heap.length - 1);
  }
  bubbleUp(idx) {
    while (idx > 0) {
      const p = Math.floor((idx - 1) / 2);
      if (this.heap[idx] >= this.heap[p]) break;
      [this.heap[idx], this.heap[p]] = [this.heap[p], this.heap[idx]];
      idx = p;
    }
  }
  pop() {
    if (this.heap.length === 0) return null;
    const min = this.heap[0], last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.siftDown(0);
    }
    return min;
  }
  siftDown(idx) {
    while (2 * idx + 1 < this.heap.length) {
      let left = 2 * idx + 1, right = 2 * idx + 2, smallest = idx;
      if (this.heap[left] < this.heap[smallest]) smallest = left;
      if (right < this.heap.length && this.heap[right] < this.heap[smallest]) smallest = right;
      if (smallest === idx) break;
      [this.heap[idx], this.heap[smallest]] = [this.heap[smallest], this.heap[idx]];
      idx = smallest;
    }
  }
}
```

**3. Linear heap building ($O(n)$ heapify)**

Starting from index $\lfloor n / 2 \rfloor - 1$ down to 0 and running `siftDown` constructs a heap in $O(n)$ time, outperforming $n$ sequential pushes ($O(n \log n)$).

[Heap array representation](../../DSA/dsa-lectures/day-41-binary-heap-array-representation.md) | [Min and Max Heap implementation](../../DSA/dsa-lectures/day-42-min-heap-and-max-heap-implementation.md)

## Priority patterns and streaming data

**1. Kth largest element (Size-K MinHeap)**

Keep a MinHeap of size $K$. When scanning $N$ numbers, push onto the heap; if `size > k`, pop the smallest. At the end, the heap contains the $K$ largest elements, and `heap.peek()` is the $K$-th largest ($O(n \log k)$ time, $O(k)$ space).

```js
function findKthLargest(nums, k) {
  const heap = new MinHeap();
  for (const x of nums) {
    heap.push(x);
    if (heap.size() > k) heap.pop();
  }
  return heap.peek();
}
```

**2. Two-heap streaming median**

Balance stream elements across two heaps: a MaxHeap for the smaller half and a MinHeap for the larger half. Invariant: sizes differ by at most 1, and every element in MaxHeap $\le$ every element in MinHeap.

```js
class MedianFinder {
  constructor() {
    this.small = new MaxHeap(); // lower half
    this.large = new MinHeap(); // upper half
  }
  addNum(num) {
    this.small.push(num);
    this.large.push(this.small.pop());
    if (this.large.size() > this.small.size()) {
      this.small.push(this.large.pop());
    }
  }
  findMedian() {
    if (this.small.size() > this.large.size()) return this.small.peek();
    return (this.small.peek() + this.large.peek()) / 2;
  }
}
```

**3. Merge K sorted lists**

Seed a MinHeap with the head node of each of the $K$ lists. Repeatedly pop the minimum node, append it to the merged list, and push its `.next` node into the heap until empty ($O(N \log K)$ where $N$ is total elements).

```js
function mergeKLists(lists) {
  const dummy = new ListNode(0);
  let tail = dummy;
  const heap = new MinHeapByVal(); // comparator on node.val
  for (const node of lists) if (node) heap.push(node);
  while (heap.size() > 0) {
    const minNode = heap.pop();
    tail.next = minNode;
    tail = tail.next;
    if (minNode.next) heap.push(minNode.next);
  }
  return dummy.next;
}
```

[Top K elements](../../DSA/dsa-lectures/day-43-top-k-elements-and-kth-largest.md) | [Median from stream](../../DSA/dsa-lectures/day-44-two-heaps-median-from-stream.md) | [Merge K sorted lists](../../DSA/dsa-lectures/day-45-merge-k-sorted-lists-and-task-scheduling.md)

## Tricky points

1. **Heap invariants and indexing**
   **1.1 Internal array ordering:** Only index 0 is guaranteed to be the extreme value; the rest of the array is partially ordered, not sorted.
   **1.2 Off-by-one indices:** For 0-indexed arrays, `left = 2 * i + 1` and `parent = Math.floor((i - 1) / 2)`. Mixing up 0-indexed and 1-indexed math corrupts tree topology.
   **1.3 JS runtime missing priority queue:** JavaScript does not provide a standard library priority queue; be prepared to implement `bubbleUp` and `siftDown` quickly.

2. **Algorithm selection**
   **2.1 Top-K Min vs Max choice:** To find the $K$ *largest* elements, use a *MinHeap* of size $K$ (evicting smaller items). Using a MaxHeap requires loading all $N$ elements into memory ($O(n \log n)$).
   **2.2 Two-heap size parity:** If rebalancing is skipped, one heap can starve the other, yielding incorrect median values when total count is even or odd.
   **2.3 SiftDown termination:** Always check that the left child index `2 * idx + 1 < length` before accessing children to prevent accessing out-of-bounds indices.