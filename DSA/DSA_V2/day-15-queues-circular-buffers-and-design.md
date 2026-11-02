# Day 15: Queues, Circular Buffers & Design

<nav aria-label="Lecture navigation">

[Previous: Monotonic Stack Patterns](day-14-monotonic-stack-patterns.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search Bounds & Rotated Arrays](day-16-binary-search-bounds-and-rotated-arrays.md)

</nav>

---

## 1. Queues Foundation

A **Queue** is a line of items that follows one main rule: **FIFO (First-In, First-Out)**. This means the first item to enter the line is always the first item to leave. You add new items to the back (**Enqueue**) and remove items from the front (**Dequeue**).

To picture this physically, imagine standing in line at a bank:
* Customer A arrives first and stands at the counter window (the **front**).
* Customer B arrives next and stands behind Customer A (the **back**).
* Customer C arrives and stands behind Customer B.
* When the teller finishes with Customer A, Customer A leaves through the front door, and Customer B steps up to the window.
* No one can cut in line or leave from the middle.

A **Circular Buffer (Ring Buffer)** is a fixed-size queue built using an array where the end of the array wraps right back around to the beginning using modulo math (`%`).

Think of a circular luggage carousel at an airport with 8 slots numbered 0 to 7:
* Suitcases drop onto open slots at the back. When slot 7 is filled, the next suitcase drops into slot 0, wrapping around in a circle.
* Passengers pick up bags from the front. The carousel does not rebuild itself or move other bags when one bag is lifted off; the front pointer simply moves clockwise to the next slot.

```text
CIRCULAR BUFFER (CAPACITY = 6):

           Slot 0: [ A ] ◄── Front (Head)
       Slot 5: [   ]     Slot 1: [ B ]
       Slot 4: [   ]     Slot 2: [ C ]
           Slot 3: [ D ] ◄── Rear (Tail)

Current state: 4 items stored (A, B, C, D)
Enqueue(E): Inserts E at Slot 4.
Dequeue():  Removes A, Front advances to Slot 1.
```

A clean linked-list queue in JavaScript:

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
    this.count = 0;
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
    this.count++;
  }

  dequeue() {
    if (!this.head) return null;
    const val = this.head.val;
    this.head = this.head.next;
    if (!this.head) {
      this.tail = null;
    }
    this.count--;
    return val;
  }

  peek() {
    return this.head ? this.head.val : null;
  }

  isEmpty() {
    return this.count === 0;
  }

  size() {
    return this.count;
  }
}

const queue = new FastLinkedQueue();
queue.enqueue(10);
queue.enqueue(20);
queue.enqueue(30);
console.log(queue.peek());    // 10
console.log(queue.dequeue()); // 10
console.log(queue.size());    // 2
```

---

### 1.1 The Array Shift Performance Trap

In JavaScript, developers often use normal arrays to build queues:
* `push()` adds an item to the end in fast $O(1)$ time.
* `shift()` removes an item from the front.

**Why `shift()` is a dangerous trap:**  
When you call `arr.shift()`, JavaScript must physically shift every remaining item in memory one spot to the left.  
If your queue has $100,000$ items, calling `shift()` moves up to $100,000$ items on every single call! Doing this inside a loop creates an $O(n^2)$ bottleneck that freezes Node.js.

Always use a linked list or circular buffer for queues where you need true $O(1)$ dequeue speed.

---

### 1.2 Circular Buffer Wrap-Around

A circular buffer uses the modulo operator (`%`) to wrap indices around automatically:

$$\text{nextIndex} = (\text{currentIndex} + 1) \pmod{\text{capacity}}$$

```text
Array of length 4: [ 0, 1, 2, 3 ]
(0 + 1) % 4 = 1
(1 + 1) % 4 = 2
(2 + 1) % 4 = 3
(3 + 1) % 4 = 0  <-- Wraps back to slot 0!
```

---

### 1.3 Empty vs Full with Size Tracking

In a circular buffer, if you only track `head` and `tail`, both an empty buffer and a full buffer have `head === tail`.  
To fix this ambiguity, always keep a simple `size` number variable:
* `isEmpty()`: `size === 0`
* `isFull()`: `size === capacity`
* Insertion index: `(head + size) % capacity`
* Last element index: `(head + size - 1) % capacity`

> [!NOTE]
> **Self-Check:** How does tracking an explicit `size` variable eliminate ambiguity in a circular buffer?  
> *Answer:* Without a `size` count, both an empty buffer and a full buffer have `head === tail`. Keeping a separate `size` counter makes empty (`size === 0`) and full (`size === capacity`) completely distinct and easy to check.

---

### 1.4 Queue Implementations Reference

| Implementation | Enqueue Time | Dequeue Time | Extra Space | Best Used When |
| :--- | :---: | :---: | :---: | :--- |
| **Naive JS Array (`shift`)** | $O(1)$ on average | $O(n)$ (Slow) | Low | Small scripts with $< 100$ items |
| **Linked List Queue** | $O(1)$ strict | $O(1)$ strict | High (Node pointers) | Unbounded dynamic FIFO queue |
| **Circular Buffer (Ring)** | $O(1)$ strict | $O(1)$ strict | Minimal ($O(k)$ pre-allocated) | Fixed capacity, streaming, zero GC |
| **Dual-Stack Queue** | $O(1)$ strict | $O(1)$ on average | Low | Interview questions using stacks |

---

## 2. Queue & Container Design Patterns

### 2.1 Pattern Family
* **Dynamic FIFO Queues:** Linked list queues for task scheduling and Breadth-First Search (BFS) level-order traversals.
* **Fixed Circular Buffers:** Ring buffers over arrays for fixed memory, streaming audio/video, and zero memory churn.
* **Dual-Stack Transformation:** Using two stacks (`inStack` and `outStack`) to turn LIFO stacks into a FIFO queue.
* **Sliding Window Aggregators:** Keeping running averages or counts within a time window by removing old events from the queue head.

### 2.2 Pattern Recognition Table

| Problem Keyword | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| **"Process events in arrival order"** | Standard FIFO scheduling. | Fast Linked List Queue. |
| **"Implement Queue using Stacks"** | FIFO queue using only stack operations. | Dual Stacks with Lazy Transfer. |
| **"Design circular queue / ring buffer"** | Fixed-size queue with wrap-around. | Array of size $k$ with modulo math. |
| **"Moving average of last k numbers"** | Running average over sliding window. | Circular buffer with running sum. |
| **"Recent calls within 3000ms"** | Remove events older than a time window. | Time queue with head removals. |

### 2.3 When to Use vs When NOT to Use
* **When to Use**:
  * You need to process items in the exact order they arrive (FIFO).
  * Breadth-First Search tree or graph traversal level-by-level.
  * Streaming data with fixed memory limits.
  * Rate-limiting requests within a time window.
* **When NOT to Use**:
  * You need to process the most recent items first (use a **Stack**).
  * You need the item with the highest priority or smallest number (use a **Priority Queue / Heap**).
  * Fast search by key or id (use a **Map**).

### 2.4 The $10^7$ Operations Rule
In systems handling $100,000$ events:
* Using `arr.shift()` runs $\approx 5 \times 10^9$ operations and freezes the Node.js event loop.
* A proper $O(1)$ queue or circular buffer runs $100,000$ operations in under 15 milliseconds.

---

## 3. Problem Walkthroughs

---

### 3.1 Implement Queue using Stacks

#### 3.1.1 Problem Statement
Implement a First-In, First-Out (FIFO) queue using only two standard stacks. The implemented queue should support all regular queue functions: `push`, `pop`, `peek`, and `empty`.

Implement the `MyQueue` class:
- `void push(int x)`: Pushes element `x` to the back of the queue.
- `int pop()`: Removes the element from the front of the queue and returns it.
- `int peek()`: Returns the element at the front of the queue.
- `boolean empty()`: Returns `true` if the queue is empty, `false` otherwise.

You must use only standard stack operations (`push` to top, `peek`/`pop` from top, `size`, and `isEmpty`).

* **Sample Input:**
  ```text
  ["MyQueue", "push", "push", "peek", "pop", "empty"]
  [[], [1], [2], [], [], []]
  ```
* **Expected Output:**
  ```text
  [null, null, null, 1, 1, false]
  ```
* **Constraints:** $1 \le x \le 9$, at most $100$ calls to `push`, `pop`, `peek`, `empty`.

#### 3.1.2 How to Think About It
Imagine two narrow tubes that hold tennis balls (Tube A and Tube B). You can only drop balls into the top and pull balls from the top:
1. Drop Ball 1 into Tube A, then Ball 2, then Ball 3.  
   Tube A: `[ Bottom: 1 | 2 | Top: 3 ]`.
2. Someone asks for Ball 1 (the oldest ball). But Ball 1 is stuck at the bottom of Tube A!
3. **The Pouring Trick**: Pour balls from Tube A into Tube B one by one:
   - Pop Ball 3 from Tube A $\to$ drop into Tube B.
   - Pop Ball 2 from Tube A $\to$ drop into Tube B.
   - Pop Ball 1 from Tube A $\to$ drop into Tube B.
4. Look at Tube B: `[ Bottom: 3 | 2 | Top: 1 ]`!  
   The order is completely reversed. Ball 1 is now sitting right at the top of Tube B!
5. **The Big Insight**: You do not need to pour balls back into Tube A!  
   As long as Tube B has balls, you can serve `pop()` or `peek()` directly from Tube B in $O(1)$ fast time. Only when Tube B becomes completely empty do you pour balls from Tube A again.

```text
TUBE TRACE:
inStack:  receives new incoming balls (push)
outStack: dispenses oldest balls (pop / peek)

push(1), push(2):
  inStack: [ 1, 2 ]
  outStack: [ ]

pop(): outStack is empty! Pour inStack into outStack:
  inStack: [ ]
  outStack: [ 2, 1 ]
  pop from outStack -> returns 1.
  outStack now holds: [ 2 ]

push(3):
  inStack: [ 3 ]
  outStack: [ 2 ]

pop(): outStack still has balls! Pop directly from outStack -> returns 2.
No pouring needed!
```

#### 3.1.3 Brute Force Approach & Bottleneck
Pouring elements back and forth on every single push:

```javascript
class SlowQueue {
  constructor() {
    this.s1 = [];
    this.s2 = [];
  }
  push(x) {
    while (this.s1.length > 0) this.s2.push(this.s1.pop());
    this.s1.push(x);
    while (this.s2.length > 0) this.s1.push(this.s2.pop());
  }
  pop() { return this.s1.pop(); }
}
```

* **The Bottleneck:** Every single `push()` takes $O(n)$ time because all existing items are moved back and forth twice. For $n$ pushes, this takes $O(n^2)$ time.

#### 3.1.4 The Pattern Insight
Use **Lazy Transfer**:
* `push(x)` always pushes directly to `inStack` in $O(1)$ time.
* `pop()` and `peek()` pull from `outStack`.
* Only when `outStack` is empty do we pour `inStack` into `outStack`.
Every element enters `inStack` once, moves to `outStack` once, and leaves `outStack` once. Across its whole life, each item takes only 3 steps, giving an **amortized $O(1)$ runtime**.

#### 3.1.5 Pseudocode

```text
CLASS MyQueue:
  CONSTRUCTOR():
    inStack = []
    outStack = []

  METHOD push(x):
    inStack.push(x)

  METHOD pop():
    shiftStacks()
    RETURN outStack.pop()

  METHOD peek():
    shiftStacks()
    RETURN outStack.top()

  METHOD empty():
    RETURN inStack.isEmpty() AND outStack.isEmpty()

  HELPER shiftStacks():
    IF outStack IS EMPTY:
      WHILE inStack IS NOT EMPTY:
        outStack.push(inStack.pop())
```

#### 3.1.6 Optimal Solution

```javascript
class MyQueue {
  constructor() {
    this.inStack = [];  // Buffers newly enqueued elements
    this.outStack = []; // Buffers reversed elements ready for dequeue
  }

  push(x) {
    this.inStack.push(x);
  }

  pop() {
    this._shiftStacks();
    return this.outStack.pop() ?? null;
  }

  peek() {
    this._shiftStacks();
    return this.outStack[this.outStack.length - 1] ?? null;
  }

  empty() {
    return this.inStack.length === 0 && this.outStack.length === 0;
  }

  // Internal helper: Transfers elements only when outStack is exhausted
  _shiftStacks() {
    if (this.outStack.length === 0) {
      while (this.inStack.length > 0) {
        this.outStack.push(this.inStack.pop());
      }
    }
  }
}

// Example runs
const queue = new MyQueue();
queue.push(1);
queue.push(2);
console.log(queue.peek());  // 1
console.log(queue.pop());   // 1
console.log(queue.empty()); // false
console.log(queue.pop());   // 2
console.log(queue.empty()); // true
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Transferring when outStack is not empty destroys FIFO order
class BuggyQueue {
  constructor() { this.s1 = []; this.s2 = []; }
  push(x) { this.s1.push(x); }
  pop() {
    // BUG: Missing check for this.s2.length === 0!
    // If s2 already contains older elements, dumping s1 on top of s2
    // places newer elements above older elements, completely corrupting FIFO order!
    while (this.s1.length) {
      this.s2.push(this.s1.pop());
    }
    return this.s2.pop();
  }
}

const buggy = new BuggyQueue();
buggy.push(1);
buggy.push(2);
buggy.pop(); // pops 1, s2 has [2]
buggy.push(3);
// BUG: pops 3 instead of 2 because 3 was dumped on top of 2!
console.log(buggy.pop()); // 3 (Expected: 2)
```
* **Why it fails:** If `outStack` still has items, dumping new items on top of it puts new items in front of old items, destroying the FIFO order.

#### 3.1.8 Complexity Derivation
* **Time Complexity:**
  - `push(x)`: $\mathbf{O(1)}$.
  - `pop()`: $\mathbf{O(1)}$ amortized.
  - `peek()`: $\mathbf{O(1)}$ amortized.
  - `empty()`: $\mathbf{O(1)}$.
* **Auxiliary Space Complexity:** $\mathbf{O(n)}$. The items are split between `inStack` and `outStack`, storing at most $n$ items total.

---

### 3.2 Design Circular Queue

#### 3.2.1 Problem Statement
Design your implementation of the circular queue. A circular queue is a linear data structure based on the FIFO principle where the last position connects back to the first position to make a circle (also known as a **Ring Buffer**).

Implement the `MyCircularQueue` class:
- `MyCircularQueue(k)`: Initializes the object with the buffer capacity `k`.
- `boolean enQueue(int value)`: Inserts an element into the circular queue. Return `true` if operation is successful.
- `boolean deQueue()`: Deletes an element from the circular queue. Return `true` if operation is successful.
- `int Front()`: Gets the front item. If the queue is empty, return `-1`.
- `int Rear()`: Gets the last item. If the queue is empty, return `-1`.
- `boolean isEmpty()`: Checks whether the circular queue is empty.
- `boolean isFull()`: Checks whether the circular queue is full.

You must not use built-in queue or dynamic resizing data structures.

* **Sample Input:**
  ```text
  ["MyCircularQueue", "enQueue", "enQueue", "enQueue", "enQueue", "Rear", "isFull", "deQueue", "enQueue", "Rear"]
  [[3], [1], [2], [3], [4], [], [], [], [4], []]
  ```
* **Expected Output:**
  ```text
  [null, true, true, true, false, 3, true, true, true, 4]
  ```
* **Constraints:** $1 \le k \le 1000$, $0 \le value \le 1000$, at most $3000$ calls to methods.

#### 3.2.2 How to Think About It
Imagine 3 chairs placed in a circle: Chair 0, Chair 1, and Chair 2.
1. **enQueue(1)**: Place Person 1 in Chair 0. Total seated: 1. `head = 0`.
2. **enQueue(2)**: Place Person 2 in Chair 1. Total seated: 2. `head = 0`.
3. **enQueue(3)**: Place Person 3 in Chair 2. Total seated: 3. All chairs are full!
4. **enQueue(4)**: All 3 chairs are full. Reject with `false`.
5. **Inspect Rear**: Who was seated last?
   $$\text{rearIndex} = (\text{head} + \text{size} - 1) \pmod 3 = (0 + 3 - 1) \pmod 3 = 2 \text{ (Person 3)}$$
6. **deQueue()**: Person 1 stands up and leaves Chair 0.  
   Advance `head = (0 + 1) % 3 = 1`. Total seated is now 2.
7. **enQueue(4)**: A chair is open! Where does Person 4 sit?
   $$\text{insertIndex} = (\text{head} + \text{size}) \pmod 3 = (1 + 2) \pmod 3 = 0$$
   Chair 0 is reused for Person 4!
8. **Inspect Rear**: Last seated person is Person 4 at Chair 0!

```text
CHAIR TRACE (k = 3):
Initial: [ _, _, _ ]
enQueue(1) -> [ 1, _, _ ] (head = 0, size = 1)
enQueue(2) -> [ 1, 2, _ ] (head = 0, size = 2)
enQueue(3) -> [ 1, 2, 3 ] (head = 0, size = 3, FULL)
deQueue()   -> [ _, 2, 3 ] (head = 1, size = 2)
enQueue(4) -> [ 4, 2, 3 ] (head = 1, size = 3, wraps to index 0!)
Rear is at index (1 + 3 - 1) % 3 = 0 -> value 4!
```

#### 3.2.3 Brute Force Approach & Bottleneck
Using a normal array with `push()` and `shift()`:

```javascript
class SlowCircularQueue {
  constructor(k) {
    this.k = k;
    this.q = [];
  }
  enQueue(v) {
    if (this.q.length === this.k) return false;
    this.q.push(v);
    return true;
  }
  deQueue() {
    if (this.q.length === 0) return false;
    this.q.shift(); // O(n) memory copy!
    return true;
  }
}
```

* **The Bottleneck:** Calling `shift()` moves every item in memory on every dequeue. It also creates memory allocations and garbage collection pauses.

#### 3.2.4 The Pattern Insight
Pre-allocate an array `new Array(k)` upfront. Keep two simple numbers:
* `head`: The index of the front item.
* `size`: The count of currently occupied slots.
Modulo arithmetic (`% k`) wraps around automatically without shifting items in memory.

#### 3.2.5 Pseudocode

```text
CLASS MyCircularQueue:
  CONSTRUCTOR(k):
    capacity = k
    buffer = Array of size k
    head = 0
    size = 0

  METHOD enQueue(val):
    IF isFull(): RETURN false
    insertIdx = (head + size) % capacity
    buffer[insertIdx] = val
    size = size + 1
    RETURN true

  METHOD deQueue():
    IF isEmpty(): RETURN false
    head = (head + 1) % capacity
    size = size - 1
    RETURN true

  METHOD Front():
    IF isEmpty(): RETURN -1
    RETURN buffer[head]

  METHOD Rear():
    IF isEmpty(): RETURN -1
    rearIdx = (head + size - 1) % capacity
    RETURN buffer[rearIdx]

  METHOD isEmpty(): RETURN size == 0
  METHOD isFull(): RETURN size == capacity
```

#### 3.2.6 Optimal Solution

```javascript
class MyCircularQueue {
  constructor(k) {
    this.capacity = k;
    this.buffer = new Array(k);
    this.head = 0;
    this.size = 0;
  }

  enQueue(value) {
    if (this.isFull()) {
      return false;
    }

    // Insert at the next available slot wrapping around circularly
    const insertIdx = (this.head + this.size) % this.capacity;
    this.buffer[insertIdx] = value;
    this.size++;
    return true;
  }

  deQueue() {
    if (this.isEmpty()) {
      return false;
    }

    // Advance head index forward circularly
    this.head = (this.head + 1) % this.capacity;
    this.size--;
    return true;
  }

  Front() {
    if (this.isEmpty()) {
      return -1;
    }
    return this.buffer[this.head];
  }

  Rear() {
    if (this.isEmpty()) {
      return -1;
    }
    // Rear index is the most recently added item
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

// Example runs
const circularQueue = new MyCircularQueue(3);
console.log(circularQueue.enQueue(1)); // true
console.log(circularQueue.enQueue(2)); // true
console.log(circularQueue.enQueue(3)); // true
console.log(circularQueue.enQueue(4)); // false (queue full)
console.log(circularQueue.Rear());     // 3
console.log(circularQueue.isFull());   // true
console.log(circularQueue.deQueue());  // true (removes 1)
console.log(circularQueue.enQueue(4)); // true (wraps around to slot 0)
console.log(circularQueue.Rear());     // 4
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Relying only on head and tail pointers without size tracking
class BuggyCircularQueue {
  constructor(k) {
    this.k = k;
    this.buf = new Array(k);
    this.head = 0;
    this.tail = 0;
  }
  // BUG: When queue is empty, head === tail.
  // When queue is completely full, head === tail as well!
  // Without a size counter, isEmpty() and isFull() return the exact same boolean!
  isEmpty() { return this.head === this.tail; }
  isFull() { return this.head === this.tail; }
}
```
* **Why it fails:** Without a `size` variable, an empty buffer and a completely full buffer both look like `head === tail`. Keeping an explicit `size` counter makes the state crystal clear.

#### 3.2.8 Complexity Derivation
* **Time Complexity:** Strict $\mathbf{O(1)}$ for every method (`enQueue`, `deQueue`, `Front`, `Rear`, `isEmpty`, `isFull`).
* **Auxiliary Space Complexity:** Strict $\mathbf{O(k)}$. Memory is allocated once at the start and never grows.

---

### 3.3 Moving Average from Data Stream

#### 3.3.1 Problem Statement
Given a stream of integers and a window size, calculate the moving average of all integers in the sliding window.

Implement the `MovingAverage` class:
- `MovingAverage(int size)`: Initializes the object with the size of the window `size`.
- `double next(int val)`: Returns the moving average of the last `size` values of the stream.

* **Sample Input:**
  ```text
  ["MovingAverage", "next", "next", "next", "next"]
  [[3], [1], [10], [3], [5]]
  ```
* **Expected Output:**
  ```text
  [null, 1.0, 5.5, 4.66667, 6.0]
  ```
* **Constraints:** $1 \le size \le 1000$, $-10^5 \le val \le 10^5$, at most $10^4$ calls to `next`.

#### 3.3.2 How to Think About It
Imagine a whiteboard with room for only 3 numbers, and a calculator next to it showing the running sum:
1. `next(1)`: Write `1` in slot 0. Total = $1$. Average = $1 / 1 = 1.0$.
2. `next(10)`: Write `10` in slot 1. Total = $11$. Average = $11 / 2 = 5.5$.
3. `next(3)`: Write `3` in slot 2. Total = $14$. Average = $14 / 3 = 4.6667$.
4. `next(5)`: The whiteboard is full! Slot 0 holds the oldest number (`1`).
   - Subtract `1` from total: $14 - 1 = 13$.
   - Overwrite slot 0 with `5`.
   - Add `5` to total: $13 + 5 = 18$.
   - Average: $18 / 3 = 6.0$.

Notice you never add up all 3 numbers from scratch. You only subtract the leaving number and add the entering number!

```text
SLOT TRACE (capacity = 3):
Slot 0: 1  ──> overwritten with 5:  [ 5, 10, 3 ]
RunningSum: 14 - 1 + 5 = 18
Average: 18 / 3 = 6.0
```

#### 3.3.3 Brute Force Approach & Bottleneck
Using an array with `shift()` and recalculating the sum with `reduce()` every time:

```javascript
class SlowMovingAverage {
  constructor(size) {
    this.size = size;
    this.window = [];
  }
  next(val) {
    this.window.push(val);
    if (this.window.length > this.size) {
      this.window.shift(); // O(k) shift!
    }
    const sum = this.window.reduce((acc, curr) => acc + curr, 0); // O(k) scan!
    return sum / this.window.length;
  }
}
```

* **The Bottleneck:** Calling `shift()` moves items in memory ($O(k)$), and calling `reduce()` re-adds all items ($O(k)$). For $k = 10,000$ and $100,000$ queries, this runs $10^9$ operations and causes severe latency.

#### 3.3.4 The Pattern Insight
Use a **Fixed Circular Buffer of size `size`** alongside a **`runningSum` variable**:
* When `count > capacity`, find the slot holding the oldest number.
* Subtract the old number from `runningSum`.
* Write the new number into that slot.
* Add the new number to `runningSum`.
* Advance `head = (head + 1) % capacity`.
Both sum updating and circular overwriting run in strict $O(1)$ time with zero memory allocations.

#### 3.3.5 Pseudocode

```text
CLASS MovingAverage:
  CONSTRUCTOR(size):
    capacity = size
    buffer = Array of size size filled with 0
    head = 0
    count = 0
    runningSum = 0

  METHOD next(val):
    count = count + 1
    slot = (head + (count - 1)) % capacity

    IF count > capacity:
      runningSum = runningSum - buffer[slot]
      head = (head + 1) % capacity

    buffer[slot] = val
    runningSum = runningSum + val

    effectiveWindow = MIN(count, capacity)
    RETURN runningSum / effectiveWindow
```

#### 3.3.6 Optimal Solution

```javascript
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

    // Calculate insertion slot
    const slot = (this.head + (this.count - 1)) % this.capacity;

    if (this.count > this.capacity) {
      // Overwrite oldest item: subtract evicted value from running sum
      this.runningSum -= this.buffer[slot];
      // Advance head pointer forward
      this.head = (this.head + 1) % this.capacity;
    }

    // Insert new value and add to running sum
    this.buffer[slot] = val;
    this.runningSum += val;

    // Window size is either current count (during warm-up) or full capacity
    const currentWindowSize = Math.min(this.count, this.capacity);
    return this.runningSum / currentWindowSize;
  }
}

// Example runs
const m = new MovingAverage(3);
console.log(m.next(1));  // 1
console.log(m.next(10)); // 5.5
console.log(m.next(3));  // 4.666666666666667
console.log(m.next(5));  // 6 (1 was evicted)
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Floating point accumulation drift over millions of queries
class BuggyMovingAverage {
  constructor(size) {
    this.capacity = size;
    this.buffer = new Array(size).fill(0);
    this.idx = 0;
    this.sum = 0;
    this.count = 0;
  }
  next(val) {
    this.count++;
    // In IEEE-754 floating point arithmetic, repeatedly subtracting and adding
    // fractional numbers over billions of iterations can accumulate precision drift!
    // For integers, running sum is exact; for floating numbers, periodic re-summing avoids drift.
    this.sum -= this.buffer[this.idx];
    this.buffer[this.idx] = val;
    this.sum += val;
    this.idx = (this.idx + 1) % this.capacity;
    return this.sum / Math.min(this.count, this.capacity);
  }
}
```
* **Why it fails:** For integer inputs, running sum is exact. But for decimal numbers, repeatedly subtracting and adding fractional decimals can cause tiny rounding errors to add up.

#### 3.3.8 Complexity Derivation
* **Time Complexity:** Strict $\mathbf{O(1)}$ per call to `next()`. Updating the sum and calculating the average takes constant time.
* **Auxiliary Space Complexity:** Strict $\mathbf{O(k)}$, where $k$ is the window size. Memory is allocated once and never grows.

---

## 4. Tricky Edge Cases

* **Modulo Wrap-Around Math:** When calculating the rear index `(head + size - 1) % capacity`, make sure numbers stay non-negative.
* **Telling Empty vs Full Apart:** Keeping an explicit `size` variable prevents `head === tail` confusion when the buffer is completely empty or completely full.
* **Dual-Stack Emptying Order:** Never pour items from `inStack` to `outStack` unless `outStack` is completely empty. Transferring early breaks the FIFO order.
* **Buffer with Capacity 1 ($k = 1$):** When capacity is 1, `head` and `tail` point to the exact same slot. Verify `enQueue` correctly rejects incoming items when `size === 1`.
* **Warm-Up Phase in Moving Average:** When the stream is just starting (`count < capacity`), divide `runningSum` by `count`, not `capacity`.

---

## 5. Summary Cheat Sheet

* **FIFO Model:** Queues process data in First-In, First-Out order. Add at the back; remove from the front.
* **Avoid `arr.shift()`:** Calling `arr.shift()` shifts all items in memory ($O(n)$ slow time). Use linked lists or circular buffers for true $O(1)$ speed.
* **Circular Buffer (Ring Buffer):** Allocates a fixed array of size $k$. Modulo math (`% k`) wraps pointers around in a circle without creating extra memory.
* **Dual-Stack Queue:** Builds a queue using two stacks. Pouring items only when `outStack` is empty gives an amortized $O(1)$ runtime per step.
* **Running Sum Accumulator:** Maintain an incremental `runningSum` variable ($O(1)$) instead of re-adding array items from scratch ($O(k)$).

---

## 6. Practice Problems

### 6.1 Implement Stack using Queues

Implement a Last-In, First-Out (LIFO) stack using only standard FIFO queue operations (`enqueue`, `dequeue`, `peek`, `isEmpty`).

Implement the `MyStack` class supporting `push`, `pop`, `top`, and `empty`.

* **Difficulty:** Easy | **Focus:** Queue Rotation Transformation
* **Sample Input:**
  ```text
  ["MyStack", "push", "push", "top", "pop", "empty"]
  [[], [1], [2], [], [], []]
  ```
* **Expected Output:**
  ```text
  [null, null, null, 2, 2, false]
  ```
* **Constraints:** $1 \le x \le 9$, at most $100$ calls to methods.
* **Hint 1:** You can build a stack with a single queue by rotating elements whenever you add a new item.
* **Hint 2:** When pushing an element `x`, enqueue `x`, then dequeue and re-enqueue all previous $n - 1$ items behind it.
* **Hint 3:** This moves the newly added item to the front of the queue, making `pop()` and `top()` simple $O(1)$ queue operations.

---

### 6.2 Design Circular Deque

Design your implementation of the circular double-ended queue (Deque) supporting insertion and deletion at both ends in $O(1)$ time.

Implement methods: `insertFront`, `insertLast`, `deleteFront`, `deleteLast`, `getFront`, `getRear`, `isEmpty`, `isFull`.

* **Difficulty:** Medium | **Focus:** Bidirectional Ring Buffer
* **Sample Input:**
  ```text
  ["MyCircularDeque", "insertLast", "insertLast", "insertFront", "insertFront", "getRear", "isFull", "deleteLast", "insertFront", "getFront"]
  [[3], [1], [2], [3], [4], [], [], [], [4], []]
  ```
* **Expected Output:**
  ```text
  [null, true, true, true, false, 2, true, true, true, 4]
  ```
* **Constraints:** $1 \le k \le 1000$, $0 \le value \le 1000$, at most $2000$ calls.
* **Hint 1:** Track `head`, `size`, and `capacity` just like a circular queue.
* **Hint 2:** For `insertFront`, step `head` backward: `head = (head - 1 + capacity) % capacity`.
* **Hint 3:** For `deleteLast`, decrement `size`. For `deleteFront`, move `head = (head + 1) % capacity` and decrement `size`.

---

### 6.3 Number of Recent Calls

You have a `RecentCounter` class which counts the number of recent requests within a certain time frame.

Implement the `RecentCounter` class:
- `RecentCounter()`: Initializes the counter with zero recent requests.
- `int ping(int t)`: Adds a new request at time `t` (in milliseconds) and returns the number of requests that have happened in the past 3000 milliseconds (including the new request), strictly within `[t - 3000, t]`. It is guaranteed that every call to `ping` uses a strictly larger value of `t` than the previous call.

* **Difficulty:** Easy | **Focus:** Monotonic Time Queue Eviction
* **Sample Input:**
  ```text
  ["RecentCounter", "ping", "ping", "ping", "ping"]
  [[], [1], [100], [3001], [3002]]
  ```
* **Expected Output:**
  ```text
  [null, 1, 2, 3, 3]
  ```
* **Constraints:** $1 \le t \le 10^9$, each call to `ping` has strictly larger `t`, at most $10^4$ calls.
* **Hint 1:** Timestamps always arrive in increasing order.
* **Hint 2:** Enqueue `t` into a queue.
* **Hint 3:** While the timestamp at the front of the queue is smaller than `t - 3000`, remove that old timestamp. Return the remaining queue size.

---

<nav aria-label="Lecture navigation">

[Previous: Monotonic Stack Patterns](day-14-monotonic-stack-patterns.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search Bounds & Rotated Arrays](day-16-binary-search-bounds-and-rotated-arrays.md)

</nav>
