# Day 28: Binary Heaps & Priority Queues

<nav aria-label="Lecture navigation">

[Previous: Directed Graphs & Topological Sort](day-27-cycle-detection-and-topological-sort.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Dynamic Programming: 1D & 2D](day-29-dynamic-programming-1d-and-2d.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Logarithmic bounds ($O(\log n)$).
- [Day 02: Arrays, Strings & Memory](day-02-arrays-strings-and-primitive-memory.md) — Array indexing.

---

## 1. What is a Binary Heap?

A **Binary Heap** is a complete binary tree stored inside a flat array with **zero pointer overhead**.

> **Min-Heap Invariant**: The smallest value is always at the root (`index 0`), and every parent is $\le$ its children.
> **Max-Heap Invariant**: The largest value is always at the root (`index 0`), and every parent is $\ge$ its children.

```text
Tree Representation:
             [ 10 ] (index 0)
            /      \
        [ 20 ]    [ 30 ] (indices 1, 2)
        /    \
     [ 40 ]  [ 50 ] (indices 3, 4)

Flat Array Representation:
[ 10, 20, 30, 40, 50 ]
```

### The Index Formulas (Memorize These!)
For any element at index `i`:
- **Parent**: `Math.floor((i - 1) / 2)`
- **Left Child**: `2 * i + 1`
- **Right Child**: `2 * i + 2`

---

## 2. Core Heap Operations ($O(\log n)$)

1. **`peek()`**: Look at `heap[0]` in **$O(1)$ time**.
2. **`push(val)`**: Add to the end of the array, then **bubble up** (swap with parent while smaller) in **$O(\log n)$ time**.
3. **`pop()`**: Remove root (`heap[0]`), move last element to index 0, then **bubble down** (swap with smaller child) in **$O(\log n)$ time**.

```javascript
// Node.js code: Clean Min-Heap (Priority Queue)
class MinHeap {
  constructor() {
    this.heap = [];
  }

  size() { return this.heap.length; }
  peek() { return this.heap[0]; }

  push(val) {
    this.heap.push(val);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.size() === 0) return null;
    const root = this.heap[0];
    const last = this.heap.pop();
    if (this.size() > 0) {
      this.heap[0] = last;
      this._bubbleDown(0);
    }
    return root;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[i] < this.heap[parent]) {
        [this.heap[i], this.heap[parent]] = [this.heap[parent], this.heap[i]];
        i = parent;
      } else break;
    }
  }

  _bubbleDown(i) {
    const n = this.size();
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;

      if (left < n && this.heap[left] < this.heap[smallest]) smallest = left;
      if (right < n && this.heap[right] < this.heap[smallest]) smallest = right;

      if (smallest !== i) {
        [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
        i = smallest;
      } else break;
    }
  }
}
```

---

## 3. Problem 1: Top K Frequent Elements

Given an integer array `nums` and integer $k$, return the $k$ most frequent elements in **$O(n \log k)$ time**.

### The Min-Heap Trick for "Top K Largest":
Instead of sorting all elements ($O(n \log n)$), keep a **Min-Heap of size $k$**:
- If heap size exceeds $k$, pop the smallest frequency out!
- The remaining $k$ items in the heap are guaranteed to be the $k$ largest!

```javascript
// Node.js code
function topKFrequent(nums, k) {
  const counts = new Map();
  for (const n of nums) counts.set(n, (counts.get(n) || 0) + 1);

  // Min-heap compares frequencies
  const minHeap = new MinHeap(); // (stores { num, freq })

  // Alternatively in JavaScript using bucket sort (O(n)):
  const buckets = Array.from({ length: nums.length + 1 }, () => []);
  for (const [num, freq] of counts) {
    buckets[freq].push(num);
  }

  const result = [];
  for (let f = buckets.length - 1; f >= 0 && result.length < k; f--) {
    for (const num of buckets[f]) {
      result.push(num);
      if (result.length === k) return result;
    }
  }

  return result;
}

console.log(topKFrequent([1, 1, 1, 2, 2, 3], 2)); // [1, 2]
```

---

## 4. Problem 2: Find Median from Data Stream (Two Heaps)

Design a data structure that continuously receives numbers and returns the median in **$O(1)$ time**.

### The Two-Heap Architecture:
Split numbers into two halves:
- **Max-Heap (lower half)**: Stores the smaller 50% of numbers. Root is the largest of the small half.
- **Min-Heap (upper half)**: Stores the larger 50% of numbers. Root is the smallest of the large half.

```text
Stream: [ 1, 2, 3, 4, 5 ]
Max-Heap (small half): [ 3, 2, 1 ] ──► Root is 3
Min-Heap (large half): [ 4, 5 ]    ──► Root is 4

Median:
• If heaps have equal size: (maxHeap.peek() + minHeap.peek()) / 2
• If maxHeap has 1 extra item: maxHeap.peek()
```
- **Insert Number:** $O(\log n)$
- **Find Median:** **$O(1)$**

---

## 5. Tricky Points and Common Traps

1. **No built-in Heap in JavaScript:** Unlike Python (`heapq`) or Java (`PriorityQueue`), JavaScript has no built-in heap! In interviews, write a concise `MinHeap` or check if the interviewer accepts a bucket-sort shortcut.
2. **Top K: Use Min-Heap, not Max-Heap:** To find the $K$ largest elements, use a **Min-Heap** of size $K$. This lets you discard smaller elements in $O(\log K)$ time.

---

## 6. Hands-On Exercises

Run this script in Node.js to verify Min-Heap behavior:

```javascript
// Node.js code
const assert = require("node:assert");

const h = new MinHeap();
h.push(5);
h.push(2);
h.push(8);
h.push(1);

assert.equal(h.pop(), 1);
assert.equal(h.pop(), 2);
assert.equal(h.pop(), 5);
assert.equal(h.pop(), 8);

console.log("✅ Min-Heap assertions passed!");
```

---

## 7. Summary

- **Binary Heaps** store a complete binary tree inside a flat array without pointer objects.
- **Parent/Child formulas**: `parent = Math.floor((i - 1) / 2)`, `left = 2*i + 1`, `right = 2*i + 2`.
- **`push` and `pop`** run in $O(\log n)$ time; **`peek`** is $O(1)$.
- **Two Heaps** find running stream medians in $O(1)$ time.

---

## 8. Cheat Sheet

| Operation | Heap Time | Unsorted Array Time |
| :--- | :---: | :---: |
| Find Min/Max | **$O(1)$** | $O(n)$ |
| Insert Element | **$O(\log n)$** | $O(1)$ |
| Remove Min/Max | **$O(\log n)$** | $O(n)$ |

---

## 9. Interview Q&A

### 45-Second Explanation
> *"A Binary Heap is an array-backed complete binary tree that maintains the heap order property. In a Min-Heap, the root element at index 0 is always the minimum value. We insert new elements at the end and bubble them up to their valid level in $O(\log n)$ time, and remove the root by swapping it with the last element and bubbling down in $O(\log n)$. For Top K problems, keeping a min-heap of size $k$ optimizes the search from $O(n \log n)$ down to $O(n \log k)$."*

---

## 10. Practice Problems

### 1. Kth Largest Element in an Array - Medium
Given an integer array `nums` and an integer `k`, return the $k^{\text{th}}$ largest element in the array. Note that it is the $k^{\text{th}}$ largest element in the sorted order, not the $k^{\text{th}}$ distinct element. Can you solve it using a Min-Heap of size $k$ in $O(n \log k)$ time?
- **Input:** `nums = [3,2,1,5,6,4], k = 2`
- **Expected Output:** `5`
- **Input:** `nums = [3,2,3,1,2,4,5,5,6], k = 4`
- **Expected Output:** `4`

### 2. Top K Frequent Elements - Medium
Given an integer array `nums` and an integer `k`, return the `k` most frequent elements. You may return the answer in any order.
- **Input:** `nums = [1,1,1,2,2,3], k = 2`
- **Expected Output:** `[1,2]`
- **Input:** `nums = [1], k = 1`
- **Expected Output:** `[1]`

### 3. Find Median from Data Stream - Hard
The **median** is the middle value in an ordered integer list. If the size of the list is even, there is no middle value, and the median is the mean of the two middle values. Design a data structure that supports adding integer numbers from a data stream and finding the median of all elements so far using two heaps (max-heap and min-heap).
- **Input:** `["MedianFinder", "addNum", "addNum", "findMedian", "addNum", "findMedian"], [[], [1], [2], [], [3], []]`
- **Expected Output:** `[null, null, null, 1.5, null, 2.0]`

---

<nav aria-label="Lecture navigation">

[Previous: Directed Graphs & Topological Sort](day-27-cycle-detection-and-topological-sort.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Dynamic Programming: 1D & 2D](day-29-dynamic-programming-1d-and-2d.md)

</nav>
