# Day 15: Queues, Circular Buffers & Design

<nav aria-label="Lecture navigation">

[Previous: Monotonic Stack Patterns](day-14-monotonic-stack-patterns.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search Bounds & Rotated Arrays](day-16-binary-search-bounds-and-rotated-arrays.md)

</nav>

---

## 1. Queues Foundation

A **Queue** is a linear data structure that operates strictly on the **FIFO (First-In, First-Out)** principle. Elements are added at the rear (**Enqueue**) and removed from the front (**Dequeue**). The earliest element added is always the very first element to be served or removed.

Imagine standing in line at a bank teller. Customer A arrives first and stands at the counter window (the **front** or **head**). Customer B arrives next and stands directly behind Customer A (the **rear** or **tail**). Customer C arrives and stands behind B. When the teller finishes serving Customer A, Customer A exits through the front door, and Customer B steps up to the window. No one is permitted to cut into the front of the line or leave from the middle.

A **Circular Buffer (Ring Buffer)** is a fixed-size queue implemented over a fixed-length array where the end of the array wraps around to the beginning using modulo arithmetic. 

Think of a circular airport luggage carousel with 8 physical slots numbered 0 through 7:
- Suitcases are loaded onto open slots at the rear. When slot 7 is filled, the next suitcase drops into slot 0, wrapping around in a circle.
- Passengers pick up their bags from the front. The carousel does not rebuild itself or shift suitcases when one is lifted off; the front pointer simply advances clockwise to the next slot.

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

### 1.1 The Array Shift Performance Trap

In JavaScript, developers often use native arrays to represent queues:

```javascript
// ❌ ANTI-PATTERN: Array shift() turns dequeue into an O(n) operation
const queue = [];
queue.push(10);            // O(1) enqueue
const item = queue.shift(); // O(n) DEQUEUE BOTTLENECK!
```

JavaScript arrays are stored in contiguous memory blocks. When `arr.shift()` removes index 0, the V8 engine must copy and shift every single remaining element ($1$ to $n - 1$) one memory slot to the left. 

In a backend service processing a stream of $100,000$ queued tasks, calling `shift()` on each task forces $100,000 \times 100,000 / 2 = 5 \times 10^9$ memory operations. Because JavaScript runs on a single main thread, this contiguous memory movement blocks the Node.js event loop for several seconds.

> [!NOTE]
> Self-Check: Why is `arr.pop()` fast ($O(1)$) while `arr.shift()` is slow ($O(n)$) in V8?
> Answer: `arr.pop()` removes an element from the end of the contiguous array, requiring only a length decrement. `arr.shift()` removes the first element, requiring every remaining element in memory to be moved leftward by one slot.

### 1.2 Doubly-Linked Queue Mechanics

A singly or doubly linked list with explicit `head` and `tail` pointers provides guaranteed worst-case $O(1)$ operations for both enqueue and dequeue:

```text
LINKED QUEUE ARCHITECTURE:

Head (Dequeue side)                         Tail (Enqueue side)
       │                                           │
       ▼                                           ▼
   ┌───────┬──────┐   ┌───────┬──────┐   ┌───────┬──────┐
   │ val:1 │ next ├──>│ val:2 │ next ├──>│ val:3 │ null │
   └───────┴──────┘   └───────┴──────┘   └───────┴──────┘

Enqueue(4): Create Node(4). Point tail.next = Node(4). Update tail = Node(4).  (O(1))
Dequeue():   Read head.val. Update head = head.next.                           (O(1))
```

Because node additions and removals only reassign pointer references, no elements ever shift in memory.

### 1.3 Circular Buffer Mechanics

When a queue has a known maximum capacity (such as an audio playback buffer, network socket buffer, or sliding telemetry window), a **Circular Buffer (Ring Buffer)** achieves constant $O(1)$ operations while completely avoiding garbage collection churn.

Instead of allocating new node objects on the heap, a circular buffer pre-allocates a fixed array of size $k$ and manages positions using modulo arithmetic:

```text
STATE VARIABLES:
- buffer: Fixed array of length k
- head: Index of oldest element
- size: Number of active elements currently stored (0 <= size <= k)
- capacity: Maximum capacity k

FORMULAS:
- Insertion index (tail):  (head + size) % capacity
- Read rear index:         (head + size - 1) % capacity
- Advance head on dequeue: (head + 1) % capacity
- Full condition:          size === capacity
- Empty condition:         size === 0
```

> [!NOTE]
> Self-Check: How does tracking an explicit `size` variable eliminate the classical circular buffer ambiguity?
> Answer: Without a `size` variable, both an empty buffer and a full buffer have `head === tail`. An explicit `size` counter makes empty (`size === 0`) and full (`size === capacity`) unambiguous.

### 1.4 Queue Implementations Reference

| Implementation | Enqueue Time | Dequeue Time | Space Overhead | Best Used When |
| :--- | :---: | :---: | :---: | :--- |
| **Naive JS Array (`shift`)** | $O(1)$ amortized | $O(n)$ (Slow) | Low | Small scripts with $< 100$ items |
| **Linked List Queue** | $O(1)$ strict | $O(1)$ strict | High (Node pointers) | Unbounded dynamic FIFO queue |
| **Circular Buffer (Ring)** | $O(1)$ strict | $O(1)$ strict | Minimal ($O(k)$ pre-allocated) | Fixed capacity, streaming, zero GC |
| **Dual-Stack Queue** | $O(1)$ strict | $O(1)$ amortized | Low | Constrained environments, interview tasks |

---

## 2. Queue & Container Design Patterns

### 2.1 Pattern Family

Queue design patterns split into four core architectural paradigms:

- **Dynamic FIFO Queues**: Unbounded queues backed by linked lists for asynchronous task dispatch and Breadth-First Search (BFS) traversals.
- **Fixed Circular Buffers**: Ring buffers backed by contiguous arrays for high-throughput streaming, zero-allocation buffers, and packet caches.
- **Dual-Stack Transformation**: Reversing order through a pair of stacks (`inStack` and `outStack`) with lazy transfers to achieve amortized $O(1)$ FIFO behavior.
- **Sliding Window Aggregators**: Tracking running statistics (moving averages, counts within time windows) by evicting stale events at the queue head.

### 2.2 Pattern Recognition Table

| Problem Trigger / Keywords | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| "Process events in order of arrival" | Standard FIFO scheduling | Fast Linked List Queue |
| "Implement Queue using Stacks" | FIFO behavior using LIFO primitives | Dual Stacks with Lazy Transfer |
| "Design circular queue / ring buffer" | Fixed-capacity queue with wrap-around | Array of size $k$ with modulo indexing |
| "Moving average of last k values" | Rolling average over sliding window | Fixed circular buffer with running sum |
| "Number of recent calls within 3000ms" | Discard entries older than threshold | Monotonic time queue with head evictions |

### 2.3 When to Use vs When NOT to Use

- **When to Use**:
  - Processing elements in exact arrival order (FIFO scheduling).
  - Breadth-First Search tree or graph traversal level-by-level.
  - Streaming data with fixed memory constraints (audio/video packet buffering).
  - Managing time-windowed request rate limiters.

- **When NOT to Use**:
  - Processing elements in reverse order of arrival (use a Stack).
  - Retrieving the element with the highest priority or smallest weight (use a Priority Queue / Min-Heap).
  - Fast search by unique identifier or key lookup (use a Hash Map).

### 2.4 The $10^7$ Operations Rule

In high-throughput services handling $10^5$ events:
- A naive `arr.shift()` approach requires $10^5 \times 10^5 / 2 = 5 \times 10^9$ operations, freezing the Node.js event loop.
- A proper $O(1)$ queue or circular buffer performs $10^5$ operations, well below the $10^7$ budget, finishing in under 15 milliseconds.

---

## 3. Problem Walkthroughs

### 3.1 Implement Queue using Stacks

#### 3.1.1 Problem Statement
Implement a First-In, First-Out (FIFO) queue using only two standard stacks. The implemented queue should support all regular queue functions: `push`, `pop`, `peek`, and `empty`.

Implement the `MyQueue` class:
- `void push(int x)`: Pushes element `x` to the back of the queue.
- `int pop()`: Removes the element from the front of the queue and returns it.
- `int peek()`: Returns the element at the front of the queue.
- `boolean empty()`: Returns `true` if the queue is empty, `false` otherwise.

You must use only standard stack operations (`push` to top, `peek`/`pop` from top, `size`, and `isEmpty`).

```text
Input:
["MyQueue", "push", "push", "peek", "pop", "empty"]
[[], [1], [2], [], [], []]

Output:
[null, null, null, 1, 1, false]

Explanation:
MyQueue myQueue = new MyQueue();
myQueue.push(1); // queue is: [1]
myQueue.push(2); // queue is: [1, 2]
myQueue.peek(); // return 1
myQueue.pop();  // return 1, queue is [2]
myQueue.empty(); // return false
```

#### 3.1.2 How to Think About It
Imagine two narrow vertical tubes that hold tennis balls (Tube A and Tube B). You can only drop balls into the top of a tube and pull balls from the top of a tube.

1. Drop Ball 1 into Tube A, then Ball 2, then Ball 3.
   Tube A: `[ Bottom: 1 | 2 | Top: 3 ]`.
2. A customer arrives asking for Ball 1 (the oldest ball). But Ball 1 is trapped at the very bottom of Tube A!
3. **The Pouring Trick**: Pour balls from Tube A into Tube B one by one:
   - Pop Ball 3 from Tube A $\to$ drop into Tube B.
   - Pop Ball 2 from Tube A $\to$ drop into Tube B.
   - Pop Ball 1 from Tube A $\to$ drop into Tube B.
4. Look at Tube B: `[ Bottom: 3 | 2 | Top: 1 ]`!
   The order is completely reversed. Ball 1 is now sitting right at the top of Tube B!
5. **The Key Insight**: You do not need to pour balls back into Tube A! As long as Tube B has balls, any `pop()` or `peek()` can be served immediately from the top of Tube B in $O(1)$ time. Only when Tube B becomes completely empty do you pour from Tube A again.

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
A brute-force strategy pours elements back and forth on every single operation:

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

The bottleneck is constant transferring. Every single `push()` takes $O(n)$ time because all existing elements are transferred twice. For $n$ insertions, this degrades total time to $O(n^2)$.

#### 3.1.4 The Pattern Insight
Use **Lazy Transfer**.
- `push(x)` always pushes directly to `inStack` in strict $O(1)$ time.
- `pop()` and `peek()` draw from `outStack`.
- Only when `outStack` is empty do we dump the contents of `inStack` into `outStack`.

Each element enters `inStack` once, transfers to `outStack` once, and leaves `outStack` once. Across its entire lifetime, each element undergoes exactly 3 operations, guaranteeing an **amortized $O(1)$ runtime**.

#### 3.1.5 Pseudocode
```text
class MyQueue:
  constructor():
    inStack = []
    outStack = []

  method push(x):
    inStack.push(x)

  method pop():
    shiftStacks()
    return outStack.pop()

  method peek():
    shiftStacks()
    return outStack.top()

  method empty():
    return inStack.isEmpty() AND outStack.isEmpty()

  helper shiftStacks():
    if outStack is empty:
      while inStack not empty:
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

#### 3.1.8 Complexity Derivation
- **Time Complexity**:
  - `push(x)`: $O(1)$ strict.
  - `pop()`: $O(1)$ amortized. Transferring $k$ elements takes $O(k)$ steps, but occurs only once per element.
  - `peek()`: $O(1)$ amortized.
  - `empty()`: $O(1)$ strict.
- **Auxiliary Space Complexity**: $O(n)$. Elements are distributed between `inStack` and `outStack`, storing at most $n$ total items.

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

```text
Input:
["MyCircularQueue", "enQueue", "enQueue", "enQueue", "enQueue", "Rear", "isFull", "deQueue", "enQueue", "Rear"]
[[3], [1], [2], [3], [4], [], [], [], [4], []]

Output:
[null, true, true, true, false, 3, true, true, true, 4]

Explanation:
MyCircularQueue myCircularQueue = new MyCircularQueue(3);
myCircularQueue.enQueue(1); // return True
myCircularQueue.enQueue(2); // return True
myCircularQueue.enQueue(3); // return True
myCircularQueue.enQueue(4); // return False, queue is full
myCircularQueue.Rear();     // return 3
myCircularQueue.isFull();   // return True
myCircularQueue.deQueue();  // return True (removes 1)
myCircularQueue.enQueue(4); // return True (inserts 4 at slot 0)
myCircularQueue.Rear();     // return 4
```

#### 3.2.2 How to Think About It
Imagine 3 numbered chairs placed in a circle: Chair 0, Chair 1, and Chair 2.

1. **enQueue(1)**: Place Person 1 in Chair 0. Total seated: 1. `head = 0`.
2. **enQueue(2)**: Place Person 2 in Chair 1. Total seated: 2. `head = 0`.
3. **enQueue(3)**: Place Person 3 in Chair 2. Total seated: 3. All chairs are full!
4. **enQueue(4)**: All 3 chairs are occupied. Reject with `false`.
5. **Inspect Rear**: Who was seated last?
   $$\text{rearIndex} = (\text{head} + \text{size} - 1) \pmod 3 = (0 + 3 - 1) \pmod 3 = 2 \pmod 3 = 2 \text{ (Person 3)}$$
6. **deQueue()**: Person 1 stands up and leaves Chair 0. 
   Advance `head = (0 + 1) % 3 = 1`. Total seated is now 2.
7. **enQueue(4)**: A chair is open! Where does Person 4 sit?
   $$\text{insertIndex} = (\text{head} + \text{size}) \pmod 3 = (1 + 2) \pmod 3 = 3 \pmod 3 = 0$$
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
A naive implementation relies on JavaScript arrays using `push()` and `shift()`:

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

The bottleneck is `arr.shift()`, which forces memory shifting on every dequeue. It also constantly grows and shrinks heap memory, triggering garbage collection cycles.

#### 3.2.4 The Pattern Insight
Pre-allocate a fixed-size array `new Array(k)` on initialization. Maintain two integer pointers:
- `head`: The index of the front element.
- `size`: The count of currently occupied slots.

Modulo arithmetic (`% k`) wraps pointers around naturally without array copying or memory allocations.

#### 3.2.5 Pseudocode
```text
class MyCircularQueue:
  constructor(k):
    capacity = k
    buffer = array of size k
    head = 0
    size = 0

  method enQueue(val):
    if isFull(): return false
    insertIdx = (head + size) % capacity
    buffer[insertIdx] = val
    size = size + 1
    return true

  method deQueue():
    if isEmpty(): return false
    head = (head + 1) % capacity
    size = size - 1
    return true

  method Front():
    if isEmpty(): return -1
    return buffer[head]

  method Rear():
    if isEmpty(): return -1
    rearIdx = (head + size - 1) % capacity
    return buffer[rearIdx]

  method isEmpty(): return size == 0
  method isFull(): return size == capacity
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

#### 3.2.8 Complexity Derivation
- **Time Complexity**: Strict $O(1)$ for every single method (`enQueue`, `deQueue`, `Front`, `Rear`, `isEmpty`, `isFull`). Arithmetic operations and array index reads execute in constant time.
- **Auxiliary Space Complexity**: Strict $O(k)$. Fixed-size pre-allocation ensures no dynamic memory growth or garbage collection churn occurs during runtime.

---

### 3.3 Moving Average from Data Stream

#### 3.3.1 Problem Statement
Given a stream of integers and a window size, calculate the moving average of all integers in the sliding window.

Implement the `MovingAverage` class:
- `MovingAverage(int size)`: Initializes the object with the size of the window `size`.
- `double next(int val)`: Returns the moving average of the last `size` values of the stream.

```text
Input:
["MovingAverage", "next", "next", "next", "next"]
[[3], [1], [10], [3], [5]]

Output:
[null, 1.0, 5.5, 4.66667, 6.0]

Explanation:
MovingAverage movingAverage = new MovingAverage(3);
movingAverage.next(1); // return 1.0 = 1 / 1
movingAverage.next(10); // return 5.5 = (1 + 10) / 2
movingAverage.next(3); // return 4.66667 = (1 + 10 + 3) / 3
movingAverage.next(5); // return 6.0 = (10 + 3 + 5) / 3 (1 was evicted)
```

#### 3.3.2 How to Think About It
Imagine a whiteboard that only has room to write 3 numbers. Next to the whiteboard is a calculator showing the running total of those numbers.

1. `next(1)`: Write `1` in slot 0. Add `1` to total ($1$). Average: $1 / 1 = 1.0$.
2. `next(10)`: Write `10` in slot 1. Add `10` to total ($11$). Average: $11 / 2 = 5.5$.
3. `next(3)`: Write `3` in slot 2. Add `3` to total ($14$). Average: $14 / 3 = 4.6667$.
4. `next(5)`: The whiteboard is full! The oldest slot is slot 0 (which holds `1`).
   - Subtract `1` from total: $14 - 1 = 13$.
   - Overwrite slot 0 with `5`.
   - Add `5` to total: $13 + 5 = 18$.
   - Average: $18 / 3 = 6.0$.

Notice you never re-sum the numbers from scratch. You only adjust the running sum by subtracting the evicted number and adding the incoming number.

```text
SLOT TRACE (capacity = 3):
Slot 0: 1  ──> overwritten with 5:  [ 5, 10, 3 ]
RunningSum: 14 - 1 + 5 = 18
Average: 18 / 3 = 6.0
```

#### 3.3.3 Brute Force Approach & Bottleneck
A brute-force solution stores incoming numbers in an array, calls `arr.shift()` when the array exceeds `size`, and sums all elements with `reduce()` on every call:

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

The bottlenecks are twofold:
1. `arr.shift()` shifts array elements in memory ($O(k)$).
2. `reduce()` scans the entire window on every single invocation ($O(k)$).

For a window size $k = 10,000$ receiving $100,000$ telemetry pings, this takes $10^9$ operations.

#### 3.3.4 The Pattern Insight
Use a **Fixed Circular Buffer of size `size`** alongside a **`runningSum` accumulator variable**.
- When `count > capacity`, find the slot holding the oldest element: `slot = head`.
- Subtract `buffer[slot]` from `runningSum`.
- Overwrite `buffer[slot] = val`.
- Add `val` to `runningSum`.
- Advance `head = (head + 1) % capacity`.

Both sum updating and circular overwriting execute in strict $O(1)$ time with zero memory allocations.

#### 3.3.5 Pseudocode
```text
class MovingAverage:
  constructor(size):
    capacity = size
    buffer = array of size size filled with 0
    head = 0
    count = 0
    runningSum = 0

  method next(val):
    count = count + 1
    slot = (head + (count - 1)) % capacity

    if count > capacity:
      runningSum = runningSum - buffer[slot]
      head = (head + 1) % capacity

    buffer[slot] = val
    runningSum = runningSum + val

    effectiveWindow = min(count, capacity)
    return runningSum / effectiveWindow
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

#### 3.3.8 Complexity Derivation
- **Time Complexity**: Strict $O(1)$ per `next()` invocation. Updating the running sum and computing the division involves constant-time arithmetic operations.
- **Auxiliary Space Complexity**: Strict $O(k)$, where $k$ is the specified window size. Pre-allocated array memory remains constant.

---

## 4. Tricky Edge Cases

- **Modulo Wrap-Around Arithmetic**: When calculating the rear index `(head + size - 1) % capacity`, ensure values are non-negative. In JavaScript, because `head >= 0` and `size >= 1`, `head + size - 1 >= 0`, preventing negative remainder bugs.
- **Distinguishing Empty vs Full in Circular Buffers**: Maintaining an explicit `size` counter eliminates the ambiguity where `head === tail` occurs during both empty and full states.
- **Exhausting `outStack` in Dual-Stack Queues**: In a dual-stack queue, never transfer elements from `inStack` to `outStack` unless `outStack` is completely empty. Transferring early breaks the FIFO sequence.
- **Single Capacity Buffers ($k = 1$)**: When buffer capacity is 1, `head` and `tail` refer to the identical memory slot. Verify `enQueue` correctly rejects incoming items when `size === 1`.
- **Stream Warm-Up Phase in Moving Average**: During the initial warm-up period (`count < capacity`), divide the running sum by `count` rather than `capacity` to prevent deflating initial averages.

---

## 5. Summary Cheat Sheet

- **FIFO Access Model**: Queues process data in First-In, First-Out order. Enqueue occurs at the rear; dequeue occurs at the front.
- **Avoid `arr.shift()`**: In JavaScript, `arr.shift()` forces $O(n)$ contiguous memory moves in V8. Use a linked list or circular buffer for true $O(1)$ performance.
- **Circular Buffer (Ring Buffer)**: Pre-allocates a fixed array of size $k$. Modulo arithmetic (`% k`) navigates positions circularly, avoiding garbage collection pauses.
- **Dual-Stack Queue**: Implements FIFO using two LIFO stacks. Lazy transferring only when `outStack` is empty guarantees amortized $O(1)$ runtime per operation.
- **Running Accumulator**: Sliding window averages should maintain an incremental `runningSum` variable ($O(1)$) rather than recalculating the sum with array scans ($O(k)$).

---

## 6. Practice Problems

### 6.1 Implement Stack using Queues
Implement a Last-In, First-Out (LIFO) stack using only standard FIFO queue operations (`enqueue`, `dequeue`, `peek`, `isEmpty`).

Implement the `MyStack` class supporting `push`, `pop`, `top`, and `empty`.

```text
Sample Input:
["MyStack", "push", "push", "top", "pop", "empty"]
[[], [1], [2], [], [], []]

Expected Output:
[null, null, null, 2, 2, false]
```

- *Hint 1*: A stack can be implemented using a single queue by rotating elements upon insertion.
- *Hint 2*: When pushing element `x`, enqueue `x`, then dequeue and re-enqueue all preceding $n - 1$ elements behind it.
- *Hint 3*: This leaves the most recently added element at the front of the queue, making `pop()` and `top()` simple $O(1)$ queue operations.

### 6.2 Design Circular Deque
Design your implementation of the circular double-ended queue (Deque) supporting insertion and deletion at both ends in $O(1)$ time.

Implement methods: `insertFront`, `insertLast`, `deleteFront`, `deleteLast`, `getFront`, `getRear`, `isEmpty`, `isFull`.

```text
Sample Input:
["MyCircularDeque", "insertLast", "insertLast", "insertFront", "insertFront", "getRear", "isFull", "deleteLast", "insertFront", "getFront"]
[[3], [1], [2], [3], [4], [], [], [], [4], []]

Expected Output:
[null, true, true, true, false, 2, true, true, true, 4]
```

- *Hint 1*: Maintain `head`, `size`, and `capacity` just like a circular queue.
- *Hint 2*: For `insertFront`, decrement `head`: `head = (head - 1 + capacity) % capacity`.
- *Hint 3*: For `deleteLast`, decrement `size`. For `deleteFront`, advance `head = (head + 1) % capacity` and decrement `size`.

### 6.3 Number of Recent Calls
You have a `RecentCounter` class which counts the number of recent requests within a certain time frame.

Implement the `RecentCounter` class:
- `RecentCounter()`: Initializes the counter with zero recent requests.
- `int ping(int t)`: Adds a new request at time `t` (in milliseconds) and returns the number of requests that have happened in the past 3000 milliseconds (including the new request), strictly within `[t - 3000, t]`. It is guaranteed that every call to `ping` uses a strictly larger value of `t` than the previous call.

```text
Sample Input:
["RecentCounter", "ping", "ping", "ping", "ping"]
[[], [1], [100], [3001], [3002]]

Expected Output:
[null, 1, 2, 3, 3]
```

- *Hint 1*: Timestamps are guaranteed to arrive in strictly increasing chronological order.
- *Hint 2*: Enqueue `t` into a FIFO queue.
- *Hint 3*: While the timestamp at the front of the queue is strictly less than `t - 3000`, dequeue that stale timestamp. Return the remaining queue size.

---

<nav aria-label="Lecture navigation">

[Previous: Monotonic Stack Patterns](day-14-monotonic-stack-patterns.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search Bounds & Rotated Arrays](day-16-binary-search-bounds-and-rotated-arrays.md)

</nav>
