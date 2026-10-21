# Day 15: Queues, Circular Buffers & Design

<nav aria-label="Lecture navigation">

[Previous: Monotonic Stack Patterns](day-14-monotonic-stack-patterns.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search Bounds & Rotated Arrays](day-16-binary-search-bounds-and-rotated-arrays.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Amortized time complexity analysis.
- [Day 02: Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md) — Contiguous array memory shifting overhead ($O(n)$ `shift()`).
- [Day 11: Singly & Doubly Linked Lists](day-11-singly-and-doubly-linked-lists.md) — Constant time head deletions and tail insertions.

---

## 1. What is a Queue & Circular Buffer?

A **Queue** is a linear data structure that operates strictly on the **FIFO (First-In, First-Out)** principle. Elements are added at the rear (**Enqueue**) and removed from the front (**Dequeue**). The earliest element added is always the very first element to be processed.

A **Circular Buffer (Ring Buffer)** is a fixed-size array that connects its end back to its beginning using modulo arithmetic ($\text{index} \pmod k$). It provides constant $O(1)$ enqueue and dequeue operations without shifting array memory or allocating new heap nodes.

> **FIFO (First-In, First-Out)**: A scheduling discipline where the oldest unserved request is processed first.

> **Enqueue**: Adding an element to the back (tail) of the queue in $O(1)$ time.

> **Dequeue**: Removing and returning the oldest element from the front (head) of the queue in $O(1)$ time.

> **Deque (Double-Ended Queue)**: A generalized queue supporting $O(1)$ insertion and deletion at both the front and rear.

### Everyday Physical Analogies

#### The Bank Teller Line (FIFO Queue)
Imagine waiting in line at a bank teller:
1. Customer A arrives first and stands at the window (The **Front / Head**).
2. Customer B arrives and stands behind A (The **Rear / Tail**).
3. Customer C arrives and stands behind B.
4. When the teller finishes, Customer A is served and exits (**Dequeue**). Customer B steps up to the window.
5. Cutting to the front or leaving from the middle is forbidden.

#### The Airport Luggage Carousel (Circular Buffer)
Imagine an airport baggage carousel with 8 physical numbered slots (0 through 7):
- Suitcases are loaded onto open slots. When slot 7 is reached, the next suitcase drops onto slot 0 (**wraps around**).
- Passengers pick up their bags from the front. The carousel does not rebuild itself or shift bags when one is removed; the pickup pointer simply advances clockwise!

```text
CIRCULAR BUFFER (CAPACITY = 6):
           Slot 0: [ A ] ◄── Front (Head)
       Slot 5: [   ]     Slot 1: [ B ]
       Slot 4: [   ]     Slot 2: [ C ]
           Slot 3: [ D ] ◄── Rear (Tail)

Queue currently holds 4 items: A, B, C, D
Enqueue(E) -> places E at Slot 4.
Dequeue()  -> removes A, Front moves to Slot 1.
```

---

## 2. How Queues & Circular Buffers Work Step-by-Step

### 1. The `Array.prototype.shift()` Performance Anti-Pattern

In JavaScript, novice developers often implement queues using standard arrays:

```javascript
// ❌ ANTI-PATTERN: Array shift() degrades queue performance to O(n)
const queue = [];
queue.push(10);     // O(1) enqueue
const val = queue.shift(); // O(n) DEQUEUE BUG!
```

#### Why `arr.shift()` is catastrophic in Node.js:
- JavaScript arrays are backed by contiguous flat memory.
- When `shift()` removes index 0, V8 must copy and shift every single remaining element ($1$ to $n - 1$) leftward by one memory slot.
- In a backend queue handling 100,000 tasks, each `shift()` performs 100,000 memory moves, freezing the single-threaded Node.js event loop!

---

### 2. Doubly-Linked Queue ($O(1)$ Dynamic Queue)

A Linked List provides guaranteed $O(1)$ enqueue and dequeue:
- Maintain two pointers: `head` (for dequeue) and `tail` (for enqueue).
- **Enqueue**: Point `tail.next = newNode`, update `tail = newNode` ($O(1)$).
- **Dequeue**: Read `head.val`, update `head = head.next` ($O(1)$).

```javascript
class QueueNode {
  constructor(val) {
    this.val = val;
    this.next = null;
  }
}

class FastLinkedQueue {
  constructor() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  enqueue(val) {
    const node = new QueueNode(val);
    if (!this.tail) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
    this.size++;
  }

  dequeue() {
    if (!this.head) return null;
    const val = this.head.val;
    this.head = this.head.next;
    if (!this.head) this.tail = null;
    this.size--;
    return val;
  }

  peek() { return this.head ? this.head.val : null; }
  isEmpty() { return this.size === 0; }
}
```

---

### 3. Circular Buffer (Ring Buffer) Mechanics

When memory capacity is fixed (e.g., streaming audio, video frames, network socket buffers), a **Circular Buffer** achieves $O(1)$ operations with zero garbage collection overhead by recycling array slots:

#### Pointer & State Variables:
- `buffer`: Fixed-size array of length $k$.
- `head`: Index of the oldest element (front).
- `size`: Current count of stored elements ($0 \le \text{size} \le k$).
- `capacity`: Maximum allowed elements $k$.

#### Modulo Formulas:
1. **Calculate Rear Position**:
   $$\text{tail} = (\text{head} + \text{size}) \pmod{\text{capacity}}$$
2. **Advance Head on Dequeue**:
   $$\text{head} = (\text{head} + 1) \pmod{\text{capacity}}$$
3. **Full Condition**:
   $$\text{size} === \text{capacity}$$
4. **Empty Condition**:
   $$\text{size} === 0$$

#### Step-by-Step Trace: Circular Queue with Capacity = 3
```text
State 0: Initial (capacity = 3, head = 0, size = 0, buffer = [ _, _, _ ])
  enqueue(10) -> index = (0 + 0) % 3 = 0. buffer = [ 10, _, _ ], size = 1.
  enqueue(20) -> index = (0 + 1) % 3 = 1. buffer = [ 10, 20, _ ], size = 2.
  enqueue(30) -> index = (0 + 2) % 3 = 2. buffer = [ 10, 20, 30 ], size = 3 (FULL).

State 1: Dequeue()
  read buffer[head] = buffer[0] = 10.
  advance head: head = (0 + 1) % 3 = 1.
  size = 2. buffer = [ (freed), 20, 30 ].

State 2: Enqueue(40) -> WRAP AROUND!
  index = (head + size) % 3 = (1 + 2) % 3 = 3 % 3 = 0!
  buffer[0] = 40.
  size = 3. buffer = [ 40, 20, 30 ].
  Notice: Slot 0 was recycled! 20 is at Head (index 1), 40 is at Tail (index 0).
```

---

## 3. Pattern Recognition of Queues

### Problem Triggers and Keywords

| Problem Trigger | Underlying Requirement | Recommended Strategy |
| :--- | :--- | :--- |
| **"Breadth-First Search (BFS)"** | Process tree/graph nodes layer-by-layer. | FIFO Queue (`enqueue(root)`). |
| **"Level-order traversal"** | Collect nodes grouped by depth. | Queue with snapshot `queue.size` loop. |
| **"Sliding Window Maximum"** | Maintain potential maxima in window. | Monotonic Decreasing Deque. |
| **"Implement Queue using Stacks"** | LIFO to FIFO reversal. | Dual Stacks (`inStack`, `outStack`). |
| **"Circular Buffer / Ring Buffer"** | Fixed capacity stream without memory shifts. | Modulo array `(head + size) % k`. |
| **"Hit Counter / Rate Limiter"** | Sliding 60-second window of timestamps. | Circular Buffer or Queue timestamp eviction. |

### The $10^7$ Rule for Queues
- Enqueue and dequeue in an optimized queue or circular buffer run in strict **$O(1)$ time**.
- Processing $10^6$ tasks takes $\approx 12\text{ms}$ in Node.js.
- Calling `arr.shift()` on an array of $10^5$ items takes $\approx 5\text{ seconds}$, freezing the Node.js event loop.

---

## 4. Problem 1: Implement Queue using Stacks (LeetCode 232)

### Problem Statement
Implement a First-In, First-Out (FIFO) queue using only two stacks. The implemented queue should support all standard functions: `push`, `pop`, `peek`, and `empty`.

```text
MyQueue queue = new MyQueue();
queue.push(1); // queue is: [1]
queue.push(2); // queue is: [1, 2] (leftmost is front)
queue.peek(); // return 1
queue.pop();  // return 1, queue is [2]
queue.empty(); // return false
```

### Step 1: Physical Simulation
Imagine two narrow plastic tubes that can only hold tennis balls (Stacks A and B):
1. Drop Ball `1` into Tube A, then Ball `2`, then Ball `3`.
   Tube A: `[ Bottom: 1 | 2 | Top: 3 ]`.
2. A customer wants the oldest ball (Ball `1`), but Ball `1` is trapped at the very bottom!
3. **The Pouring Trick**:
   - Pour balls from Tube A into Tube B one-by-one:
     - Pop `3` from A $\to$ push to B.
     - Pop `2` from A $\to$ push to B.
     - Pop `1` from A $\to$ push to B.
   - Look at Tube B: `[ Bottom: 3 | 2 | Top: 1 ]`!
4. The oldest ball (`1`) is now sitting right at the top of Tube B ready to be popped in $O(1)$ instant time!
5. **Key Insight**: Tube B does not need to be poured back into Tube A! As long as Tube B has balls, any `pop()` or `peek()` can be served directly from Tube B. Only when Tube B is empty do we pour from Tube A again.

### Step 2: Brute Force Approach
On every single `push(x)` call, transfer all elements from Stack 1 to Stack 2, push `x`, then transfer everything back to Stack 1:

```javascript
class SlowQueue {
  constructor() { this.s1 = []; this.s2 = []; }
  push(x) {
    while (this.s1.length) this.s2.push(this.s1.pop());
    this.s1.push(x);
    while (this.s2.length) this.s1.push(this.s2.pop());
  }
  pop() { return this.s1.pop(); }
}
```
- **Time Complexity**: $O(n)$ on every single `push()` call.
- **Space Complexity**: $O(n)$ duplicated stack frames.

### Step 3: Bottleneck
Where is the CPU sweating?
Shuffling elements back and forth on every operation is totally redundant.

### Step 4: The Pattern Discovery
**Lazy Transfer (Amortized $O(1)$)**:
- `push(x)` always pushes directly to `inStack` in $O(1)$ time.
- `pop()` / `peek()` reads from `outStack`.
- Only when `outStack` is empty do we dump `inStack` into `outStack`. Each element moves between stacks **at most once in its entire lifetime**.

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: Dual-Stack Queue with Amortized O(1) Lazy Transfers
class MyQueue {
  constructor() {
    this.inStack = [];  // Receives new elements
    this.outStack = []; // Serves dequeue and peek operations
  }

  // Push element x to the back of queue
  push(x) {
    this.inStack.push(x); // Strict O(1)
  }

  // Removes the element from in front of queue and returns it
  pop() {
    this._shiftStacks();
    return this.outStack.pop() ?? null;
  }

  // Get the front element
  peek() {
    this._shiftStacks();
    return this.outStack[this.outStack.length - 1] ?? null;
  }

  // Returns whether the queue is empty
  empty() {
    return this.inStack.length === 0 && this.outStack.length === 0;
  }

  // Internal helper: Transfers elements only when outStack is depleted
  _shiftStacks() {
    if (this.outStack.length === 0) {
      while (this.inStack.length > 0) {
        this.outStack.push(this.inStack.pop());
      }
    }
  }
}

// ❌ ANTI-PATTERN: Transferring elements back and forth on every operation
class BuggyShufflingQueue {
  constructor() { this.s1 = []; this.s2 = []; }
  push(x) { this.s1.push(x); }
  pop() {
    // BUG: Dumping s1 to s2, popping, then dumping BACK to s1 does O(n) work every time!
    while (this.s1.length) this.s2.push(this.s1.pop());
    const val = this.s2.pop();
    while (this.s2.length) this.s1.push(this.s2.pop());
    return val;
  }
}

// Example test runs
const queue = new MyQueue();
queue.push(1);
queue.push(2);
console.log(queue.peek());  // 1
console.log(queue.pop());   // 1
console.log(queue.empty()); // false
console.log(queue.pop());   // 2
console.log(queue.empty()); // true
```

- **Time Complexity**:
  - `push()`: $O(1)$ strict.
  - `pop()` / `peek()`: **$O(1)$ amortized**. Each element is pushed to `inStack` once, moved to `outStack` once, and popped from `outStack` once.
- **Space Complexity**: $O(n)$ — Total elements distributed between both stacks.

---

## 5. Problem 2: Design Circular Queue (LeetCode 622)

### Problem Statement
Design your implementation of the circular queue. The circular queue is a linear data structure in which the operations are performed based on FIFO principle, and the last position is connected back to the first position to make a circle.
It is also called "Ring Buffer".

Implement the `MyCircularQueue` class:
- `MyCircularQueue(k)`: Initializes the object with the size of the queue to be `k`.
- `enQueue(val)`: Inserts an element into the circular queue. Return `true` if operation is successful.
- `deQueue()`: Deletes an element from the circular queue. Return `true` if operation is successful.
- `Front()`: Gets the front item from the queue. If empty, return `-1`.
- `Rear()`: Gets the last item from the queue. If empty, return `-1`.
- `isEmpty()`: Checks whether the circular queue is empty.
- `isFull()`: Checks whether the circular queue is full.

```text
Input:
["MyCircularQueue", "enQueue", "enQueue", "enQueue", "enQueue", "Rear", "isFull", "deQueue", "enQueue", "Rear"]
[[3], [1], [2], [3], [4], [], [], [], [4], []]

Output:
[null, true, true, true, false, 3, true, true, true, 4]
```

### Step 1: Physical Simulation
Imagine 3 numbered chairs in a circle (0, 1, 2):
1. **Seat 1 (enQueue 1)**: Put Person 1 in Chair 0. `head = 0, size = 1`.
2. **Seat 2 (enQueue 2)**: Put Person 2 in Chair 1. `head = 0, size = 2`.
3. **Seat 3 (enQueue 3)**: Put Person 3 in Chair 2. `head = 0, size = 3 (FULL)`.
4. **Seat 4 (enQueue 4)**: All 3 chairs are full! Reject with `false`.
5. **Inspect Rear**: Who is in the last chair?
   $$\text{rearIndex} = (0 + 3 - 1) \pmod 3 = 2 \pmod 3 = 2 \text{ (Person 3)}!$$
6. **deQueue()**: Person 1 leaves Chair 0.
   `head = (0 + 1) % 3 = 1`. `size = 2`.
7. **enQueue 4**: A chair is free! Place Person 4 in Chair:
   $$\text{insertIndex} = (\text{head} + \text{size}) \pmod 3 = (1 + 2) \pmod 3 = 0$$
   Chair 0 is reused for Person 4!
8. **Inspect Rear**: Last person seated is Person 4 at Chair 0!

### Step 2: Brute Force Approach
Using dynamic array `arr.shift()` and `arr.push()` with capacity checks:

```javascript
class SlowCircularQueue {
  constructor(k) { this.k = k; this.q = []; }
  enQueue(v) { if (this.q.length === this.k) return false; this.q.push(v); return true; }
  deQueue() { if (this.q.length === 0) return false; this.q.shift(); return true; } // O(n) shift!
}
```
- **Time Complexity**: $O(n)$ per dequeue.
- **Space Complexity**: Allocates dynamic memory arrays.

### Step 3: Bottleneck
Where is the CPU sweating?
Dynamic array resizing and shifting allocates and copies heap memory on every call.

### Step 4: The Pattern Discovery
Pre-allocate a fixed-size array `new Array(k)`. Use `head` and `size` variables with **modulo arithmetic** to navigate slots in $O(1)$ constant time.

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: Zero-allocation circular queue using modulo arithmetic
class MyCircularQueue {
  constructor(k) {
    this.capacity = k;
    this.buffer = new Array(k);
    this.head = 0; // Index of the oldest element
    this.size = 0; // Number of elements currently stored
  }

  enQueue(value) {
    if (this.isFull()) return false;

    // Calculate insertion index: (head + size) % capacity
    const insertIdx = (this.head + this.size) % this.capacity;
    this.buffer[insertIdx] = value;
    this.size++;
    return true;
  }

  deQueue() {
    if (this.isEmpty()) return false;

    // Advance head forward circularly
    this.head = (this.head + 1) % this.capacity;
    this.size--;
    return true;
  }

  Front() {
    if (this.isEmpty()) return -1;
    return this.buffer[this.head];
  }

  Rear() {
    if (this.isEmpty()) return -1;
    // Rear index is the most recently added slot: (head + size - 1) % capacity
    const rearIdx = (this.head + this.size - 1) % this.capacity;
    return this.buffer[rearIdx];
  }

  isEmpty() {
    return this.size === 0;
  }

  isFull() {
    return this.size === this.capacity;
  }
}

// ❌ ANTI-PATTERN: Missing modulo wrap-around or negative index bugs
class BuggyCircularQueue {
  constructor(k) { this.k = k; this.buf = []; this.head = 0; this.tail = 0; }
  enQueue(v) {
    // BUG: Comparing head === tail cannot distinguish between EMPTY and FULL!
    this.buf[this.tail++] = v; 
    return true;
  }
}

// Example test runs
const circularQueue = new MyCircularQueue(3);
console.log(circularQueue.enQueue(1)); // true
console.log(circularQueue.enQueue(2)); // true
console.log(circularQueue.enQueue(3)); // true
console.log(circularQueue.enQueue(4)); // false (Queue is full!)
console.log(circularQueue.Rear());     // 3
console.log(circularQueue.isFull());   // true
console.log(circularQueue.deQueue());  // true (deletes 1)
console.log(circularQueue.enQueue(4)); // true (wraps around to slot 0)
console.log(circularQueue.Rear());     // 4
```

- **Time Complexity**: Strict **$O(1)$** for all operations (`enQueue`, `deQueue`, `Front`, `Rear`, `isEmpty`, `isFull`).
- **Space Complexity**: Strict **$O(k)$** pre-allocated fixed memory with zero GC churn.

---

## 6. Under the Hood: V8 & Node.js

### Libuv Task Queues & Microtask Processing
How does Node.js handle thousands of concurrent asynchronous tasks without blocking?
1. **The Libuv Event Loop**:
   - The event loop divides work into distinct phases (Timers, I/O Polling, Check/setImmediate).
   - Each phase maintains an internal **FIFO Queue** of pending callbacks implemented in C as a linked queue.
2. **The Microtask Queue (`process.nextTick` & Promises)**:
   - Microtasks are stored in a dedicated high-priority queue.
   - At the completion of every tick, V8 completely empties the microtask queue before returning control to Libuv.
   - If a recursive `process.nextTick()` continuously enqueues tasks, the microtask queue starves the event loop, freezing I/O!

### Network Socket Ring Buffers
In high-throughput TCP/UDP servers (such as `net.Socket` and audio streaming in Node.js):
- Network interface cards (NICs) stream bytes directly into kernel **Ring Buffers**.
- A circular buffer allows the operating system kernel to write incoming packets at the tail while Node.js user-space streams read from the head simultaneously without lock contention or memory reallocations.

---

## 7. Hands-On Exercise

### The Scenario
You are developing a telemetry latency monitor for an API gateway in Node.js.
You must implement a `MovingAverage` class that computes the moving average of all integers in a sliding window of size `size`.

```text
MovingAverage m = new MovingAverage(3);
m.next(1); // return 1.0 = 1 / 1
m.next(10); // return 5.5 = (1 + 10) / 2
m.next(3); // return 4.66667 = (1 + 10 + 3) / 3
m.next(5); // return 6.0 = (10 + 3 + 5) / 3 (1 was evicted!)
```

### The Buggy Code
```javascript
class BuggyMovingAverage {
  constructor(size) {
    this.size = size;
    this.queue = [];
  }
  next(val) {
    this.queue.push(val);
    if (this.queue.length > this.size) this.queue.shift(); // O(n) shift penalty!
    // Bug: Recalculating sum with reduce on every call takes O(size) time!
    const sum = this.queue.reduce((acc, curr) => acc + curr, 0);
    return sum / this.queue.length;
  }
}
```

### Acceptance Criteria
1. `next(val)` must run in **strict $O(1)$ time**.
2. Must maintain a running `sum` variable rather than recalculating the sum on every call.
3. Uses a circular buffer of fixed size to avoid $O(n)$ array shifting.
4. Verified with direct test execution.

### Verified Solution

```javascript
// ✅ CORRECT: O(1) Moving Average using Circular Buffer and running sum
class MovingAverage {
  constructor(size) {
    this.capacity = size;
    this.buffer = new Array(size).fill(0);
    this.head = 0;
    this.count = 0;
    this.runningSum = 0;
  }

  next(val) {
    this.count++;

    // Calculate slot in circular buffer
    const slot = (this.head + (this.count - 1)) % this.capacity;

    if (this.count > this.capacity) {
      // Overwrite the oldest element in slot, subtract its value from runningSum
      this.runningSum -= this.buffer[slot];
      // Advance head pointer forward
      this.head = (this.head + 1) % this.capacity;
    }

    // Insert new value and update running sum
    this.buffer[slot] = val;
    this.runningSum += val;

    // Window size is either count (during warm-up) or full capacity
    const effectiveSize = Math.min(this.count, this.capacity);
    return this.runningSum / effectiveSize;
  }
}

// Example test runs
const m = new MovingAverage(3);
console.log(m.next(1));  // 1
console.log(m.next(10)); // 5.5
console.log(m.next(3));  // 4.666666666666667
console.log(m.next(5));  // 6 (1 was evicted, window holds [10, 3, 5])
```

---

## 8. Tricky Points and Edge Cases

### 1. The Empty vs Full Ambiguity in Circular Buffers
If you only maintain `head` and `tail` pointers without a `size` count:
- When empty: `head === tail`.
- When full: `head === tail`!
- **Fix**: Always track an explicit `size` variable, or allocate an array of size $k + 1$ to leave one slot perpetually empty as a sentinel. Tracking `size` is cleaner and uses 100% of allocated memory.

### 2. Computing the Rear Index
To find the most recently inserted item:
```javascript
const rearIdx = (this.head + this.size - 1) % this.capacity;
```
If you do not add `capacity` before modulo in languages that support negative remainders, index calculation can produce negative values. In JavaScript, since `head >= 0` and `size >= 1`, `(head + size - 1)` is always $\ge 0$.

### 3. Edge Cases Checklist for Queues
- Enqueue to a full circular buffer (must reject without overwriting).
- Dequeue from an empty queue (must return `false` or `null` without crashing).
- Calling `Front()` or `Rear()` on an empty queue (returns `-1`).
- Buffer of capacity 1 (head and tail share the same slot).

---

## 9. Comprehensive Summary

- **Queues** process data in FIFO order. Using `arr.shift()` in JavaScript causes $O(n)$ contiguous memory shifts and freezes Node.js event loop threads.
- **Circular Buffers (Ring Buffers)** use modulo arithmetic to recycle a fixed-size array in strict $O(1)$ time with zero garbage collection churn.
- **Implement Queue with Stacks**: Use two stacks with **Lazy Transfer**. Elements move between stacks at most once, yielding $O(1)$ amortized runtime.
- **Design Circular Queue**: Track `head`, `size`, and `capacity`. Insertion index is `(head + size) % capacity`; deletion advances `head = (head + 1) % capacity`.
- **Node.js Internals**: Libuv uses FIFO queues to schedule event loop phases, and network drivers use circular ring buffers to ingest streaming packets.

---

## 10. Cheat Sheet

### Queue Implementation Trade-offs

| Implementation | Enqueue Time | Dequeue Time | Space Complexity | Best Used When |
| :--- | :---: | :---: | :---: | :--- |
| **Naive JS Array (`shift`)**| $O(1)$ | **$O(n)$ (SLOW)** | $O(n)$ | ❌ Never in production queues |
| **Doubly-Linked Queue** | **$O(1)$** | **$O(1)$** | $O(n)$ | Unbounded dynamic FIFO queue |
| **Circular Buffer (Ring)** | **$O(1)$** | **$O(1)$** | **$O(k)$ fixed** | Fixed capacity, streaming, zero GC |
| **Dual-Stack Queue** | **$O(1)$** | **$O(1)$ amortized** | $O(n)$ | Interview constraint scenarios |

### Common Pitfalls List
- **`arr.shift()` in loops**: Causes quadratic $O(n^2)$ queue draining.
- **Rear Index Calculation**: Writing `this.tail` instead of `(this.head + this.size - 1) % capacity`.
- **Missing `size` tracking**: Inability to differentiate between empty and full states.
- **Microtask Event Loop Starvation**: Continuously enqueuing microtasks prevents Libuv I/O from running.

---

## 11. Interview Q&A

### 45-Second Technical Pitch
> *"A Queue is a fundamental FIFO data structure essential for asynchronous event scheduling and Breadth-First Search algorithms. In JavaScript, implementing queues using array.shift() is a major performance trap because removing index zero requires an O(n) memory copy of all subsequent elements. For unbounded queues, we use a singly or doubly linked list with head and tail pointers to guarantee O(1) operations. For streaming pipelines and fixed memory limits, we implement a Circular Ring Buffer using modulo indexing to recycle array slots without memory allocations. In Node.js, these principles directly mirror the Libuv task queues that power the event loop."*

### 1. Why does `arr.shift()` cause high latency in Node.js backend services, and what should be used instead?
**Answer:**
JavaScript arrays in V8 are backed by contiguous flat memory. When `arr.shift()` is called, index 0 is removed, forcing V8 to perform an internal `memmove` operation copying all $n - 1$ remaining pointers leftward by one slot.
In high-throughput services (like processing 50,000 webhook events), calling `shift()` repeatedly takes $O(n^2)$ total operations. Because Node.js runs JavaScript on a single thread, this blocks the event loop for seconds.
Instead, use a **Doubly-Linked List Queue** or a pre-allocated **Circular Buffer** where dequeue is strictly $O(1)$ pointer reassignment.

### 2. What will the following code output in Node.js, and why?
```javascript
const k = 3;
let head = 2;
let size = 2;
const insertIdx = (head + size) % k;
console.log(insertIdx);
```
**Answer:**
It outputs `1`.
- `head + size = 2 + 2 = 4`.
- `4 % 3 = 1`.
Because `capacity = 3`, indices are `0, 1, 2`.
Slot 2 is occupied by the item at `head`.
Slot 0 is occupied by the item at `(head + 1) % 3`.
Therefore, the next available slot wraps around to index `1`. Modulo arithmetic automatically handles wrap-around without conditional logic.

### 3. Spot and fix the bug in this dual-stack queue:
```javascript
class BadQueue {
  constructor() { this.s1 = []; this.s2 = []; }
  push(x) { this.s1.push(x); }
  pop() {
    while (this.s1.length) this.s2.push(this.s1.pop());
    return this.s2.pop();
  }
}
```
**Answer:**
The bug occurs when `push()` is called between two `pop()` calls.
If we push 1 and 2, then call `pop()`: `s1` pours into `s2` (`[2, 1]`), and `1` is popped. `s2` still holds `[2]`.
Now we push 3 into `s1`.
If we call `pop()` again, `while (this.s1.length) this.s2.push(...)` dumps `3` on top of `2` in `s2` (`[2, 3]`), and pops `3`!
This violates FIFO order (`3` was popped before `2`)!
**Fix**: Only dump `s1` into `s2` when **`s2` is completely empty** (`if (this.s2.length === 0)`).

### 4. How does a Circular Buffer prevent garbage collection pauses in real-time Node.js streaming applications?
**Answer:**
In Node.js, allocating and discarding millions of temporary objects forces V8's Scavenger and Mark-Sweep garbage collectors to run frequently, introducing unpredictable **Stop-The-World (STW)** latency pauses of 10ms–50ms.
A Circular Buffer pre-allocates a single fixed-length array `new Array(k)` on server startup.
Incoming streaming chunks overwrite existing array slots without creating new node objects or expanding array capacity. Because memory addresses are never discarded, zero heap allocations occur, eliminating garbage collection pauses entirely.

---

## 12. Practice Problems

### 1. Implement Queue using Stacks - Easy
Implement a FIFO queue using only two stacks with amortized $O(1)$ operations.
- **Sample Input:** `push(1), push(2), peek(), pop(), empty()`
- **Expected Output:** `1 (peek), 1 (pop), false (empty)`

### 2. Design Circular Queue - Medium
Implement fixed-capacity circular queue using modulo arithmetic.
- **Sample Input:** `MyCircularQueue(3), enQueue(1), enQueue(2), enQueue(3), enQueue(4), Rear()`
- **Expected Output:** `true, true, true, false, 3`

### 3. Moving Average from Data Stream - Easy
Calculate moving average within a sliding window of size $k$ in $O(1)$ time per entry.
- **Sample Input:** `MovingAverage(3), next(1), next(10), next(3), next(5)`
- **Expected Output:** `1.0, 5.5, 4.67, 6.0`

### 4. Design Circular Deque - Medium
Design a double-ended queue supporting insertion and deletion at both ends in $O(1)$ time.
- **Sample Input:** `insertFront(1), insertLast(2), getFront(), getRear()`
- **Expected Output:** `true, true, 1, 2`

---

<nav aria-label="Lecture navigation">

[Previous: Monotonic Stack Patterns](day-14-monotonic-stack-patterns.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search Bounds & Rotated Arrays](day-16-binary-search-bounds-and-rotated-arrays.md)

</nav>
