# Day 19: Queue Fundamentals, Circular Queues, and Deque

<nav aria-label="Lecture navigation">

[Previous: Monotonic Stack Patterns](day-18-monotonic-stack-patterns.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Stack and Queue Design Patterns](day-20-stack-and-queue-design-patterns.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain the **First-In, First-Out (FIFO)** processing principle.
- Identify why JavaScript's native `Array.prototype.shift()` is an $O(n)$ hazard and avoid it in high-throughput systems.
- Implement an efficient $O(1)$ Queue using a head index pointer.
- Design a **Circular Queue** with fixed capacity using modulo arithmetic.
- Implement a **Double-Ended Queue (Deque)** supporting $O(1)$ push/pop at both ends.

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md)
- [Day 16: Stack Fundamentals and LIFO Architecture](day-16-stack-fundamentals-and-lifo.md)

---

## Core Concepts

### 1. The FIFO Principle

A **Queue** models a real-world checkout line: the first person to join the line is the first person served.

```text
Enqueue(10) -> [ 10 ]               <- Back
Enqueue(20) -> [ 10, 20 ]           <- 10 is FRONT, 20 is BACK
Enqueue(30) -> [ 10, 20, 30 ]
Dequeue()   -> removes 10 (Front)   <- Front is now 20
```

- **`enqueue(x)`**: Add to the back $\to O(1)$
- **`dequeue()`**: Remove and return from the front $\to O(1)$
- **`peek()`**: Inspect front item without removing $\to O(1)$
- **`isEmpty()`**: Check if empty $\to O(1)$

---

### 2. The JavaScript `arr.shift()` Performance Trap

Many developers implement a queue in JavaScript like this:
```js
class BadQueue {
  constructor() { this.items = []; }
  enqueue(x) { this.items.push(x); } // O(1)
  dequeue()  { return this.items.shift(); } // O(n) DANGEROUS!
}
```
**Why `shift()` is slow**:
An array is a contiguous memory buffer. When element 0 is removed, the JavaScript engine must shift all remaining $n - 1$ elements one index to the left in memory.
Over $n$ operations, total time is:
$$\sum_{i=1}^n i = O(n^2)$$

#### Solution 1: Head Pointer Queue ($O(1)$ Amortized)
Instead of shifting memory, simply advance an index pointer `head`:
```js
class FastQueue {
  constructor() {
    this.items = [];
    this.head = 0;
  }
  enqueue(x) { this.items.push(x); }
  dequeue() {
    if (this.isEmpty()) return null;
    const val = this.items[this.head];
    this.head++;
    // Periodically garbage collect dead space when head is large
    if (this.head > 1000 && this.head > this.items.length / 2) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }
    return val;
  }
  isEmpty() { return this.head === this.items.length; }
}
```

---

## Detailed Explanations & Node.js Relevance

### Circular Buffer (Ring Buffer)

In low-level networking, audio streaming, and high-frequency Node.js message queues, fixed-capacity **Circular Queues** are standard.
Instead of an unbounded array that grows infinitely, a circular queue uses a fixed array of size $C$ and wraps indices using modulo arithmetic:
$$\text{nextIndex} = (\text{currentIndex} + 1) \pmod C$$

```text
Capacity C = 5
Indices: 0, 1, 2, 3, 4
When index reaches 4, next index is (4 + 1) % 5 = 0 (wraps back to start!)
```

### Node.js Backend Relevance: Asynchronous Job Queues
In Node.js backend architectures (e.g. BullMQ, Celery workers, webhook handlers), tasks arrive faster than worker processes can execute them.
Queues provide **load leveling** (rate smoothing), buffering requests in FIFO order to prevent downstream databases from crashing during traffic spikes.

---

## JavaScript Implementation & Tracing

### 1. Design Circular Queue (LeetCode 622)

```js
class MyCircularQueue {
  constructor(k) {
    this.capacity = k;
    this.queue = new Array(k);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  enQueue(value) {
    if (this.isFull()) return false;
    this.queue[this.tail] = value;
    this.tail = (this.tail + 1) % this.capacity;
    this.size++;
    return true;
  }

  deQueue() {
    if (this.isEmpty()) return false;
    this.head = (this.head + 1) % this.capacity;
    this.size--;
    return true;
  }

  Front() {
    return this.isEmpty() ? -1 : this.queue[this.head];
  }

  Rear() {
    if (this.isEmpty()) return -1;
    // Tail points to next empty slot; rear is (tail - 1 + capacity) % capacity
    const rearIndex = (this.tail - 1 + this.capacity) % this.capacity;
    return this.queue[rearIndex];
  }

  isEmpty() {
    return this.size === 0;
  }

  isFull() {
    return this.size === this.capacity;
  }
}
```

### 2. Double-Ended Queue (Deque) using Doubly Linked List

A **Deque** allows $O(1)$ push and pop from both the front and the back.

```js
class DequeNode {
  constructor(val) {
    this.val = val;
    this.prev = null;
    this.next = null;
  }
}

class Deque {
  constructor() {
    this.dummyHead = new DequeNode(null);
    this.dummyTail = new DequeNode(null);
    this.dummyHead.next = this.dummyTail;
    this.dummyTail.prev = this.dummyHead;
    this.length = 0;
  }

  pushBack(val) {
    const node = new DequeNode(val);
    const last = this.dummyTail.prev;
    last.next = node;
    node.prev = last;
    node.next = this.dummyTail;
    this.dummyTail.prev = node;
    this.length++;
  }

  popFront() {
    if (this.length === 0) return null;
    const first = this.dummyHead.next;
    this.dummyHead.next = first.next;
    first.next.prev = this.dummyHead;
    this.length--;
    return first.val;
  }
}
```

### Trace: Circular Queue with Capacity 3

| Operation | `queue` Array | `head` | `tail` | `size` | Return Value |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `enQueue(1)` | `[1, _, _]` | 0 | 1 | 1 | `true` |
| `enQueue(2)` | `[1, 2, _]` | 0 | 2 | 2 | `true` |
| `enQueue(3)` | `[1, 2, 3]` | 0 | 0 (wrapped) | 3 | `true` |
| `enQueue(4)` | `[1, 2, 3]` | 0 | 0 | 3 | `false` (isFull) |
| `deQueue()` | `[_, 2, 3]` | 1 | 0 | 2 | `true` |
| `enQueue(4)` | `[4, 2, 3]` | 1 | 1 | 3 | `true` (wrapped) |

- **Time Complexity**: $O(1)$ strictly for all operations (`enQueue`, `deQueue`, `Front`, `Rear`).
- **Auxiliary Space**: $O(k)$ preallocated fixed memory buffer.

---

## Common Mistakes & Interview Traps

1. **Calculating Rear in Circular Queue**:
   ```js
   // WRONG: this.queue[this.tail - 1]
   // When tail is at index 0 (after wrapping), tail - 1 is -1 (invalid array index!)
   // CORRECT: (this.tail - 1 + this.capacity) % this.capacity
   ```
2. **Using `arr.shift()` in BFS algorithms**:
   In graph and tree traversal, breadth-first search uses a queue. Using `queue.shift()` degrades BFS from $O(V + E)$ to $O(V^2 + E)$. Always use a head pointer or linked queue!
3. **Memory Leaks in Head Pointer Queues**:
   If a head pointer queue runs forever without trimming `items`, dead elements before `head` remain referenced, causing a slow memory leak in Node.js.

---

## Tricky Points & Edge Cases

- **Queue of Size 1**:
  When `k = 1`, `head` and `tail` point to the same index. The `size` variable prevents ambiguity between full and empty states.
- **Differentiating Empty vs Full in Ring Buffers without `size`**:
  If `size` is not tracked, `head === tail` can mean either completely empty or completely full. Tracking `size` explicitly eliminates this ambiguity cleanly.

---

## Practical Exercise

Implement **Number of Recent Calls** (LeetCode 933):
Design a class `RecentCounter` that counts the number of recent requests within a certain time frame:
- `ping(t)`: Adds a new request at time `t` (in milliseconds) and returns the number of requests that have happened in the past 3000 milliseconds (i.e. in the range $[t - 3000, t]$).
- **Acceptance Criterion**: Must run in $O(1)$ amortized time using a fast FIFO queue.

---

## Summary

- A Queue maintains FIFO order supporting $O(1)$ enqueue and dequeue.
- JavaScript's `arr.shift()` is an $O(n)$ operation that must never be used in performance-critical queues or BFS loops.
- Head pointer queues provide simple $O(1)$ operations on arrays with periodic compaction.
- Fixed circular buffers use modulo arithmetic to achieve strict $O(1)$ operations with zero memory allocations.

---

## Cheat Sheet

### Queue Mechanics Comparison
| Implementation | Enqueue | Dequeue | Space Overhead | Best For |
| :--- | :--- | :--- | :--- | :--- |
| `arr.push()` + `arr.shift()` | $O(1)$ | **$O(n)$** | Low | Never in production! |
| **Head Pointer Array** | $O(1)$ | **$O(1)$ amortized** | Moderate | BFS & general DSA |
| **Circular Ring Buffer** | $O(1)$ | **$O(1)$ strict** | Fixed $O(k)$ | Hardware & streaming buffers |
| **Doubly Linked List** | $O(1)$ | **$O(1)$ strict** | High (Node pointers) | Deques (push/pop both ends) |

---

## Interview Questions

### 1. Deep Definitions and Mental Models
**Question:** Why does JavaScript not provide a native $O(1)$ Queue data structure in standard ECMAScript, and how should a senior engineer implement one?
- **Expected answer shape:** ECMAScript relies on Array as the universal linear collection. `push` and `pop` are $O(1)$, but `shift` is $O(n)$ by specification because array elements are stored contiguously. Senior engineers implement a Queue using either (1) an array with a `head` index pointer with periodic compaction, or (2) a singly/doubly linked list, or (3) a fixed-size TypedArray ring buffer for bounded workloads.

### 2. Predict the Output and Trace Execution
**Question:** In a circular queue of capacity 3: `enQueue(1)`, `enQueue(2)`, `deQueue()`, `enQueue(3)`, `enQueue(4)`. What are the values of `Front()` and `Rear()`?
- **Expected answer shape:**
- After `enQueue(1), enQueue(2)`: queue has `[1, 2]`.
- After `deQueue()`: 1 is removed. Front is `2`.
- After `enQueue(3), enQueue(4)`: queue has `[2, 3, 4]`.
- `Front()` returns `2`. `Rear()` returns `4`.

### 3. Implementation Exercise
**Question:** Write `RecentCounter` (LeetCode 933) using a head pointer queue.
- **Expected answer shape:**
```js
class RecentCounter {
  constructor() {
    this.requests = [];
    this.head = 0;
  }
  ping(t) {
    this.requests.push(t);
    while (this.requests[this.head] < t - 3000) {
      this.head++;
    }
    return this.requests.length - this.head;
  }
}
```

### 4. Debugging and Failure Analysis
**Question:** An engineer implements a circular queue without tracking `size`, relying solely on `if (this.head === this.tail)` to check if the queue is empty. What bug occurs when the queue is full?
- **Expected answer shape:** When a circular queue becomes full, `tail` wraps around and equals `head`. If `head === tail` is used for `isEmpty()`, the code will mistakenly report a completely full queue as empty, allowing illegal overwriting of existing un-dequeued data.

### 5. Design and Tradeoff Questions
**Question:** How does a Doubly Linked List Deque compare to a Ring Buffer Deque?
- **Expected answer shape:** A Doubly Linked List Deque has dynamic capacity and strictly guaranteed $O(1)$ push/pop at both ends, but requires allocating a new Node object on the heap per element with two pointer references (`prev` and `next`), increasing GC overhead. A Ring Buffer Deque has zero heap allocations and excellent cache locality, but has a fixed capacity or requires expensive buffer re-allocation when full.

### 6. Senior Follow-ups: Node.js Microservice Buffering
**Question:** An Express microservice receives 10,000 webhook events/second and writes them to PostgreSQL. Writing directly to the database causes connection pool exhaustion and crashes the service. How does a queue architecture resolve this?
- **Expected answer shape:** Introduce an asynchronous queue (e.g. BullMQ with Redis or an in-memory ring buffer). When webhooks arrive, immediately enqueue the payload and respond with `HTTP 202 Accepted` in $< 5$ ms. Worker processes consume from the queue in controlled batches of 100 records using `INSERT INTO ... VALUES (...)`, smoothing database load and capping connection pool utilization regardless of incoming traffic bursts.

<nav aria-label="Lecture navigation">

[Previous: Monotonic Stack Patterns](day-18-monotonic-stack-patterns.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Stack and Queue Design Patterns](day-20-stack-and-queue-design-patterns.md)

</nav>
