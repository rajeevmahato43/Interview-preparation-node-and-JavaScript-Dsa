# Day 19: Queue Fundamentals, Circular Queues, and Deque

<nav aria-label="Lecture navigation">

[Previous: Monotonic Stack Patterns](day-18-monotonic-stack-patterns.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Stack and Queue Design Patterns](day-20-stack-and-queue-design-patterns.md)

</nav>
## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Asymptotic analysis and amortized time.
- [Day 02: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md) — Contiguous array allocations and pointer offsets.
- [Day 16: Stack Fundamentals and LIFO Architecture](day-16-stack-fundamentals-and-lifo.md) — LIFO vs FIFO mechanical trade-offs.
---

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            FIFO QUEUE VS CIRCULAR RING BUFFER                               │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  1. LINEAR FIFO QUEUE (Head Pointer Tracking)
     Enqueue: appends to tail (O(1))
     Dequeue: advances head pointer (O(1))
     [ dead_space | dead_space | 10 (Head) | 20 | 30 (Tail) ]
                                    ▲              ▲
                                   head           tail

  2. CIRCULAR RING BUFFER (Capacity = 4)
     Modulo arithmetic wraps pointers: index = (index + 1) % Capacity
            [ 40 ] (Index 3)
           ↗      ↖
     [ 10 ]        [ 30 ]
           ↘      ↗
            [ 20 ]
     • Zero memory allocations; eliminates unbounded array growth!
```

## 1. The FIFO Principle and Queue Primitives

> **FIFO (First-In, First-Out)**: An access protocol where the first element enqueued is the first element dequeued.

A **Queue** models a physical queue: elements enter at the rear (tail) and exit from the front (head).

All fundamental queue operations operate in **$O(1)$ constant time**:
- **`enqueue(x)`**: Inserts `x` at the rear ($O(1)$).
- **`dequeue()`**: Removes and returns the front element ($O(1)$).
- **`peek()` / `front()`**: Reads the front element without mutating the queue ($O(1)$).
- **`isEmpty()`**: Checks if the queue contains zero elements ($O(1)$).
- **`size()`**: Returns the count of active elements ($O(1)$).

---

## 2. The JavaScript `arr.shift()` Hazard

A common mistake in JavaScript is implementing a queue using native array methods:
```javascript
// ❌ ANTI-PATTERN: Dangerous O(n) dequeue!
class BadQueue {
  constructor() { this.items = []; }
  enqueue(x) { this.items.push(x); }        // O(1)
  dequeue()  { return this.items.shift(); } // O(n) MEMORY SHIFT!
}
```

#### Why `arr.shift()` is Dangerous:
JavaScript arrays are contiguous memory buffers. Deleting index 0 forces the V8 engine to copy all remaining $n - 1$ elements one index to the left in memory.
Over $n$ dequeues, total work equals:
$$\sum_{i=1}^{n} i = \frac{n(n + 1)}{2} = O(n^2) \text{ operations}$$
In Breadth-First Search (BFS) over a graph with 50,000 vertices, using `arr.shift()` degrades search performance from $O(V + E)$ to **$O(V^2 + E)$**, freezing the event loop for seconds.

#### The Head Pointer Solution ($O(1)$ Amortized):
Advance a `head` integer index. Periodically compact dead memory space when `head` exceeds a threshold:

```javascript
// Node.js code
"use strict";

// ✅ PATTERN: Fast Head-Pointer Queue (O(1) amortized dequeue)
class FastQueue {
  constructor() {
    this.items = [];
    this.head = 0;
  }

  enqueue(x) {
    this.items.push(x);
  }

  dequeue() {
    if (this.isEmpty()) return null;

    const val = this.items[this.head];
    this.head++;

    // Periodic dead space compaction to prevent unbounded memory growth
    if (this.head > 1000 && this.head > this.items.length / 2) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }

    return val;
  }

  peek() {
    return this.isEmpty() ? null : this.items[this.head];
  }

  isEmpty() {
    return this.head === this.items.length;
  }

  size() {
    return this.items.length - this.head;
  }
}

const q = new FastQueue();
q.enqueue(10);
q.enqueue(20);
console.log("Dequeued:", q.dequeue()); // 10
console.log("Front item:", q.peek());  // 20
```

---

## 3. Design Circular Queue (Ring Buffer)

In streaming systems, network sockets, and OS kernel device drivers, unbounded queues risk Out-Of-Memory crashes. A **Circular Queue** pre-allocates an array of fixed capacity $k$ and wraps pointers using modulo arithmetic:
$$\text{nextIndex} = (\text{currentIndex} + 1) \pmod k$$

```javascript
// Node.js code
// Circular Queue (LeetCode 622)
class MyCircularQueue {
  constructor(k) {
    this.capacity = k;
    this.queue = new Array(k);
    this.head = 0;
    this.tail = 0; // Points to the next available insertion slot
    this.size = 0;
  }

  enQueue(value) {
    if (this.isFull()) return false;

    this.queue[this.tail] = value;
    this.tail = (this.tail + 1) % this.capacity; // Wrap around
    this.size++;
    return true;
  }

  deQueue() {
    if (this.isEmpty()) return false;

    this.head = (this.head + 1) % this.capacity; // Wrap around
    this.size--;
    return true;
  }

  Front() {
    return this.isEmpty() ? -1 : this.queue[this.head];
  }

  Rear() {
    if (this.isEmpty()) return -1;
    // Tail points to next empty slot; rear is the element right before tail
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

#### Trace: Circular Queue with Capacity 3

| Operation | Array Buffer | `head` | `tail` | `size` | Return Value | Notes |
|---|---|---|---|---|---|---|
| `enQueue(1)` | `[1, _, _]` | 0 | 1 | 1 | `true` | Added at index 0 |
| `enQueue(2)` | `[1, 2, _]` | 0 | 2 | 2 | `true` | Added at index 1 |
| `enQueue(3)` | `[1, 2, 3]` | 0 | 0 | 3 | `true` | Tail wraps to index 0 |
| `enQueue(4)` | `[1, 2, 3]` | 0 | 0 | 3 | `false` | Queue is full |
| `deQueue()` | `[_, 2, 3]` | 1 | 0 | 2 | `true` | Head advances to index 1 |
| `enQueue(4)` | `[4, 2, 3]` | 1 | 1 | 3 | `true` | Added at wrapped index 0! |

---

## 4. Double-Ended Queue (Deque) using a Doubly Linked List

> **Deque (Double-Ended Queue)**: A generalized queue data structure allowing $O(1)$ insertions and deletions at both the front and rear.

A **Deque** allows insertions and deletions at both ends in strict $O(1)$ time:
- `pushFront()`, `popFront()`
- `pushBack()`, `popBack()`

```javascript
// Node.js code
class DequeNode {
  constructor(val) {
    this.val = val;
    this.prev = null;
    this.next = null;
  }
}

class Deque {
  constructor() {
    // Sentinel dummy nodes eliminate null checks during head/tail updates
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

  peekFront() {
    return this.length === 0 ? null : this.dummyHead.next.val;
  }

  peekBack() {
    return this.length === 0 ? null : this.dummyTail.prev.val;
  }
}
```

---

## Tricky Points and Edge Cases

### 1. Circular Queue Rear Index Calculation
Because `tail` points to the *next empty insertion slot*, reading the rear element requires inspecting index `tail - 1`.
If `tail === 0` (due to wrap-around), evaluating `tail - 1` evaluates to `-1` (invalid in JavaScript).
Always use the positive modulo formula:
$$\text{rearIndex} = (\text{tail} - 1 + \text{capacity}) \pmod{\text{capacity}}$$

### 2. Full vs Empty Ambiguity in Ring Buffers
If you do not maintain an explicit `size` counter, both a completely empty circular buffer and a completely full circular buffer satisfy `head === tail`. Always track an integer `size` variable to eliminate state ambiguity.

---

## Hands-On Exercise

### Scenario
You are developing an API rate-limiting tracker for an Express.js gateway. You must design a class `RecentCounter` that counts incoming request pings occurring within the past 3,000 milliseconds (LeetCode 933: Number of Recent Calls).

Every call to `ping(t)` adds a request at timestamp `t` (in milliseconds) and returns the number of requests that occurred in the inclusive time window $[t - 3000, t]$. Timestamps are guaranteed to be strictly increasing.

### Buggy Code
```javascript
// Node.js code
class RecentCounterBuggy {
  constructor() {
    this.requests = [];
  }

  ping(t) {
    this.requests.push(t);
    // ❌ Bug: shift() in a loop triggers an O(n^2) memory copy penalty!
    // Under heavy traffic, API response times degrade exponentially.
    while (this.requests[0] < t - 3000) {
      this.requests.shift();
    }
    return this.requests.length;
  }
}
```

### Acceptance Criteria
1. Execute `ping(t)` in amortized $O(1)$ time.
2. Auxiliary memory must scale with $O(W)$ where $W$ is requests within the 3,000 ms window.
3. Eliminate `Array.prototype.shift()` using an index pointer with compaction.

### Solution Code

```javascript
// Node.js code
import assert from "node:assert/strict";

class RecentCounter {
  constructor() {
    this.requests = [];
    this.head = 0;
  }

  ping(t) {
    this.requests.push(t);

    // Evict timestamps older than t - 3000 by advancing head pointer in O(1) amortized time
    while (this.requests[this.head] < t - 3000) {
      this.head++;
    }

    // Periodically compact dead space when head accumulates over 2,000 evicted elements
    if (this.head > 2000) {
      this.requests = this.requests.slice(this.head);
      this.head = 0;
    }

    return this.requests.length - this.head;
  }
}

// Verification Tests
const counter = new RecentCounter();
assert.equal(counter.ping(1), 1);     // Window [-2999, 1] -> [1] -> count: 1
assert.equal(counter.ping(100), 2);   // Window [-2900, 100] -> [1, 100] -> count: 2
assert.equal(counter.ping(3001), 3);  // Window [1, 3001] -> [1, 100, 3001] -> count: 3
assert.equal(counter.ping(3002), 3);  // Window [2, 3002] -> 1 evicted! -> [100, 3001, 3002] -> count: 3

console.log("✅ All RecentCounter queue rate-limiting assertions passed successfully!");
```

### Solution Explanation

1. **Amortized $O(1)$ Eviction:** Because timestamps are strictly increasing, the `head` pointer moves forward monotonically. Each request timestamp is inspected at most twice (once upon push, once upon eviction).
2. **Memory Safety:** Trimming dead references via periodic slice compaction guarantees that memory stays strictly proportional to active requests in the 3-second window.

---

## Summary

- Queues adhere to the **First-In, First-Out (FIFO)** protocol; `enqueue` and `dequeue` operate in $O(1)$ time.
- `Array.prototype.shift()` is an $O(n)$ memory shift; using it inside loops degrades algorithms to $O(n^2)$.
- Head pointer queues provide $O(1)$ dequeues on native arrays by advancing an index pointer and compacting dead memory periodically.
- Fixed **Circular Queues (Ring Buffers)** use modulo arithmetic to achieve strict $O(1)$ bounds with zero memory allocation churn.
- Asynchronous queues provide **load leveling** in Node.js architectures, buffering request bursts to protect databases and external APIs.

---

## Cheat Sheet

### Queue Implementation Comparison
| Architecture | Enqueue | Dequeue | Space Profile | Best Scenario |
|---|---|---|---|---|
| `push()` + `shift()` | $O(1)$ | **$O(n)$** | Low | **Anti-pattern in production** |
| **Head Pointer Array** | $O(1)$ | **$O(1)$ amortized** | Moderate | Graph BFS, LeetCode algorithms |
| **Circular Ring Buffer** | $O(1)$ | **$O(1)$ strict** | Fixed $O(k)$ | Low-level streaming & audio buffers |
| **Doubly Linked List** | $O(1)$ | **$O(1)$ strict** | High (Node pointers) | Deque (both-ends push/pop) |

### Common Pitfalls
- **Using `shift()` in Graph BFS:** Degrades BFS from $O(V + E)$ to $O(V^2 + E)$.
- **Circular Queue Rear Calculation:** Writing `tail - 1` without modulo wrapping evaluates to index `-1` when `tail === 0`.
- **Memory Leaks in Head Pointer Queues:** Never slicing dead array space allows unbounded array growth in long-running services.
- **Empty vs Full Confusion:** Forgetting that `head === tail` occurs in both empty and full states if `size` is untracked.

---

## Interview Questions

### 1. Why does ECMAScript not provide a native $O(1)$ Queue data structure, and how should a senior engineer implement one in Node.js?

**Question:** Analyze why standard JavaScript lacks a built-in Queue collection and evaluate the top three implementation alternatives.

**Answer:** 
The ECMAScript specification relies on `Array` as the universal linear sequence collection. While `push()` and `pop()` execute at the end in $O(1)$ amortized time, `shift()` removes index 0 in $O(n)$ time to maintain zero-based contiguous memory indexing. JavaScript engines prioritized simple single-collection semantics over introducing a dedicated `Queue` interface into the core standard library.

**Senior Implementation Options:**
1. **Head-Pointer Array (Recommended for Algorithms):**
   Maintain a numeric `head` pointer. Dequeue simply returns `items[head++]`. Periodically compact dead space (`if (head > 1000) items = items.slice(head)`).
   - *Pros:* Uses native packed SMI elements in V8; optimal cache locality; zero node object allocation.
2. **Fixed-Size Ring Buffer (Recommended for Bounded Streaming):**
   Pre-allocate a fixed array or `TypedArray`. Wrap indices using modulo arithmetic: `idx = (idx + 1) % capacity`.
   - *Pros:* Strictly $O(1)$ worst case; zero garbage collection allocations.
3. **Doubly Linked List (Recommended for Unbounded Deques):**
   Maintain `head` and `tail` sentinel pointers linking heap-allocated `Node` objects.
   - *Pros:* Dynamic capacity; strict non-amortized $O(1)$ push/pop at both boundaries.

---

### 2. In a circular queue of capacity 3: `enQueue(1)`, `enQueue(2)`, `deQueue()`, `enQueue(3)`, `enQueue(4)`. What are the values of `Front()` and `Rear()`?

**Question:** Trace the internal state of a circular queue across the operations and determine final front and rear values.

**Answer:**
1. **`enQueue(1)`:** Stored at index 0. `head = 0, tail = 1, size = 1`.
2. **`enQueue(2)`:** Stored at index 1. `head = 0, tail = 2, size = 2`.
3. **`deQueue()`:** Element 1 dequeued. `head = (0 + 1) % 3 = 1`. `size = 1`.
4. **`enQueue(3)`:** Stored at index 2. `tail = (2 + 1) % 3 = 0`. `size = 2`.
5. **`enQueue(4)`:** Stored at index 0 (wrapped!). `tail = (0 + 1) % 3 = 1`. `size = 3`.
- **`Front()`:** `queue[head] = queue[1] = 2`.
- **`Rear()`:** $\text{rearIndex} = (1 - 1 + 3) \pmod 3 = 0 \to \text{queue}[0] = 4$.
- **Result:** `Front() === 2` and `Rear() === 4`.

---

### 3. How does an engineer avoid memory leaks when implementing a Head-Pointer Queue in a long-running Node.js daemon?

**Question:** Explain the memory retention behavior of an unbounded head-pointer queue and describe the optimal compaction strategy.

**Answer:** 
**The Memory Retention Hazard:**
In a naive head-pointer queue:
```javascript
class LeakyQueue {
  constructor() { this.items = []; this.head = 0; }
  enqueue(x) { this.items.push(x); }
  dequeue() { return this.items[this.head++]; }
}
```
As elements are dequeued, `this.head` increments, but all previous elements from index $0$ to $\text{head} - 1$ remain referenced inside `this.items`. Even though the application logic considers them discarded, V8's Garbage Collector cannot reclaim their memory because they are reachable from the array root. In a server processing 10,000,000 tasks, this causes a fatal Out-Of-Memory (OOM) memory leak.

**Compaction Strategy:**
Periodically compact the array by slicing off the dead space once `head` crosses an amortized threshold:
```javascript
if (this.head > 1000 && this.head > this.items.length / 2) {
  this.items = this.items.slice(this.head);
  this.head = 0;
}
```
This drops references to dead elements, re-indexes the array to index 0, and runs in amortized $O(1)$ time.

---

### 4. How does an asynchronous queue architecture provide load leveling in Node.js backend systems during traffic spikes?

**Question:** An Express microservice receives 15,000 webhook events per second. Direct database writes crash the PostgreSQL connection pool. How does an asynchronous queue resolve this?

**Answer:** 
**The Problem (Traffic Spikes vs DB Saturation):**
A relational database (e.g., PostgreSQL) has a hard connection pool limit (e.g., 100 concurrent connections). Under a burst of 15,000 incoming HTTP requests/second, attempting to write directly to the database exhausts all available pool connections, causing connection timeouts, cascading HTTP 500 errors, and memory crashes.

**The Queue Load-Leveling Solution:**
```
Incoming Requests (15,000/sec)
       │
       ▼
[ Node.js API Gateway ] ──> Fast In-Memory / Redis Queue (BullMQ)
       │                    (Response: HTTP 202 Accepted in < 5 ms)
       │
       ▼
[ Background Worker Pool ] ──> Consumes queue in controlled batches of 500
       │
       ▼
[ PostgreSQL DB ] ──> Capped at safe throughput (e.g., 500 rows/batch, 10 connections)
```
1. **Decoupled Ingestion:** The HTTP handler immediately pushes the webhook payload into a Redis or in-memory FIFO queue and returns an `HTTP 202 Accepted` response in $< 5\text{ ms}$, freeing the Node.js event loop.
2. **Controlled Batching:** Dedicated worker processes pull jobs from the queue at a sustainable rate, batching individual writes into bulk transactions (`INSERT INTO events VALUES (...), (...)`).
3. **Fault Tolerance:** If the database encounters transient downtime or deadlocks, requests remain buffered safely in the queue and retry automatically without dropping customer data.

---

<nav aria-label="Lecture navigation">

[Previous: Monotonic Stack Patterns](day-18-monotonic-stack-patterns.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Stack and Queue Design Patterns](day-20-stack-and-queue-design-patterns.md)

</nav>
