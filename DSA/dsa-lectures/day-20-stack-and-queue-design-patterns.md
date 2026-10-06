# Day 20: Stack and Queue Design Patterns

<nav aria-label="Lecture navigation">

[Previous: Queue Fundamentals, Circular Queues, and Deque](day-19-queue-circular-queue-and-deque.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Recursion Mechanics and Call Stack](day-21-recursion-mechanics-and-call-stack.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Design an auxiliary-tracked **MinStack** that guarantees strict $O(1)$ constant time for `push()`, `pop()`, `top()`, and `getMin()`.
- Implement a **FIFO Queue using two LIFO Stacks** (`inStack` and `outStack`) with a rigorous amortized $O(1)$ accounting proof.
- Implement a **LIFO Stack using standard FIFO Queues** via circular rotation ($O(n)$ push, $O(1)$ pop) and evaluate structural asymmetry.
- Model multi-page navigation and transactional state machines using the **Browser History Design Pattern** (LeetCode 1472).
- Diagnose and prevent algorithmic anti-patterns, including eager dual-stack reshuffling and precision loss in difference-encoded stacks.
- Evaluate real-world Node.js infrastructure patterns, including database connection pool scheduling (FIFO queue fairness vs LIFO stack cache locality) and transactional undo/redo engines.

---

## Prerequisites

- [Day 16: Stack Fundamentals and LIFO Architecture](day-16-stack-fundamentals-and-lifo.md)
- [Day 17: Valid Parentheses and Expression Parsing](day-17-valid-parentheses-and-expressions.md)
- [Day 19: Queue Fundamentals, Circular Queues, and Deque](day-19-queue-circular-queue-and-deque.md)

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
| :--- | :--- | :--- |
| **MinStack** | A stack abstract data type augmented with auxiliary state to track the historical minimum element at every frame in $O(1)$ time. | Eliminates $O(n)$ full-scan minimum lookups without sacrificing $O(1)$ mutation speed. |
| **Dual-Stack Invariant** | A structural constraint where incoming items accumulate in an ingest stack and transfer lazily to an egress stack only when the egress stack is empty. | Guarantees amortized $O(1)$ FIFO behavior using exclusively LIFO building blocks. |
| **Amortized Analysis** | An asymptotic method averaging execution runtime over an arbitrary sequence of length $k$, guaranteeing an upper bound of $O(k)$ total work. | Proves that infrequent $O(n)$ batch transfers do not degrade overall throughput below $O(1)$ per operation. |
| **Circular Queue Rotation** | Cycling the front $k - 1$ elements of a FIFO queue back to its tail after enqueueing a new element. | Inverts FIFO order to simulate LIFO behavior using only standard queue operations. |
| **History Stack Pruning** | The transactional clearing of a forward history stack whenever a new discrete state action is committed. | Prevents non-linear branching in undo/redo engines and browser navigation. |

---

## Core Concepts

### 1. MinStack Architecture: $O(1)$ Historical State Tracking

A **MinStack** is a stack data structure that augments standard LIFO operations with a `getMin()` method that returns the minimum value currently stored in the container in $O(1)$ time.

A standard array-backed stack requires an $O(n)$ linear scan to find the minimum element. Storing a single scalar variable `currentMin` fails because popping that minimum removes the reference, requiring an $O(n)$ rescan to recover the predecessor minimum. To maintain $O(1)$ retrieval across arbitrary mutations, the data structure must preserve the historical minimum corresponding to every stack height.

```text
Action        mainStack (Data)             minStack (Historical Minimum)    getMin()
------------------------------------------------------------------------------------
push(5)       [ 5 ]                        [ 5 ]                             5
push(3)       [ 5, 3 ]                     [ 5, 3 ]                          3
push(7)       [ 5, 3, 7 ]                  [ 5, 3, 3 ]                       3  (3 <= 7)
push(3)       [ 5, 3, 7, 3 ]               [ 5, 3, 3, 3 ]                    3
push(2)       [ 5, 3, 7, 3, 2 ]            [ 5, 3, 3, 3, 2 ]                 2  (2 < 3)
------------------------------------------------------------------------------------
pop() -> 2    [ 5, 3, 7, 3 ]               [ 5, 3, 3, 3 ]                    3
pop() -> 3    [ 5, 3, 7 ]                  [ 5, 3, 3 ]                       3
pop() -> 7    [ 5, 3 ]                     [ 5, 3 ]                          3
pop() -> 3    [ 5 ]                        [ 5 ]                             5
```

```text
MinStack Memory Layout Options:

Option A: Synchronized Parallel Stacks (Optimal in V8)
mainStack: [ 5, 3, 7, 3, 2 ]  <-- Packed SMI Array
minStack:  [ 5, 3, 3, 3, 2 ]  <-- Packed SMI Array

Option B: Single Stack of Objects (High GC Overhead)
stack:     [ {v:5, m:5}, {v:3, m:3}, {v:7, m:3}, {v:3, m:3}, {v:2, m:2} ]
```

#### MinStack Architecture Comparison

| Architecture | Push Time | Pop Time | GetMin Time | Space Overhead | V8 Engine Impact |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Synchronized Parallel Stacks** | $O(1)$ | $O(1)$ | $O(1)$ | $2n$ elements | Uses contiguous packed SMI arrays; zero object allocation overhead. |
| **Compressed MinStack (`val <= min`)** | $O(1)$ | $O(1)$ | $O(1)$ | $n + k$ ($k \le n$) | Saves space on ascending data; requires conditional checks on `pop()`. |
| **Single Stack of Tuple Objects** | $O(1)$ | $O(1)$ | $O(1)$ | $n$ objects | Allocates heap objects per push; triggers GC churn under high volume. |
| **Difference Encoding (`val - min`)** | $O(1)$ | $O(1)$ | $O(1)$ | $n$ elements | **Dangerous**: Causes integer overflow beyond `Number.MAX_SAFE_INTEGER`. |

```javascript
// Node.js code: MinStack Implementation and Pitfall Comparison

// ❌ WRONG: Tracking only a single scalar variable fails on pop()
class BrokenMinStack {
  constructor() {
    this.stack = [];
    this.min = Infinity;
  }
  push(val) {
    this.stack.push(val);
    if (val < this.min) this.min = val;
  }
  pop() {
    const val = this.stack.pop();
    // FAILS: If val was the minimum, we have lost the previous minimum!
    // Rescanning the array takes O(n), violating the O(1) requirement.
    return val;
  }
  getMin() {
    return this.min;
  }
}

// ✅ CORRECT: Synchronized Parallel Stacks preserving historical state in O(1)
class MinStack {
  constructor() {
    this.mainStack = [];
    this.minStack = [];
  }

  push(val) {
    this.mainStack.push(val);
    const currentMin = this.minStack.length === 0 
      ? val 
      : this.minStack[this.minStack.length - 1];
    this.minStack.push(val < currentMin ? val : currentMin);
  }

  pop() {
    if (this.mainStack.length === 0) return null;
    this.minStack.pop();
    return this.mainStack.pop();
  }

  top() {
    if (this.mainStack.length === 0) return null;
    return this.mainStack[this.mainStack.length - 1];
  }

  getMin() {
    if (this.minStack.length === 0) return null;
    return this.minStack[this.minStack.length - 1];
  }
}

const ms = new MinStack();
ms.push(5);
ms.push(3);
ms.push(7);
console.log(ms.getMin()); // 3
ms.pop(); // pops 7
console.log(ms.getMin()); // 3
ms.pop(); // pops 3
console.log(ms.getMin()); // 5 (restored historical minimum in O(1))
```

---

### 2. Implement Queue Using Stacks: The Lazy Transfer Invariant

A **Dual-Stack Queue** simulates a First-In-First-Out (FIFO) queue by buffering incoming elements in an ingest stack (`inStack`) and lazily reversing them into an egress stack (`outStack`) exclusively when the egress stack is exhausted.

Because a LIFO stack reverses insertion order, reversing the reversed sequence restores the original FIFO order: $\text{reverse}(\text{reverse}(S)) = S$.

```text
Step 1: Enqueue 1, 2, 3
inStack:  [ 1, 2, 3 ] (Top is 3)
outStack: [ ]

Step 2: Dequeue() requested
outStack is empty -> Trigger lazy transfer!
Transfer loop: outStack.push(inStack.pop())
inStack:  [ ]
outStack: [ 3, 2, 1 ] (Top is 1)
Return outStack.pop() -> 1 (FIFO preserved!)

Step 3: Enqueue 4
inStack:  [ 4 ]
outStack: [ 3, 2 ] (Top is 2)

Step 4: Dequeue() requested
outStack is NOT empty -> Do NOT touch inStack!
Return outStack.pop() -> 2 (FIFO preserved!)
```

#### The Amortized $O(1)$ Accounting Proof

Why is the Dual-Stack Queue considered $O(1)$ when a transfer takes $O(n)$ time?

We use the **Accounting Method** of amortized analysis:
1. Each element enters the queue via `push()`: Charge an amortized cost of **$4$ credits**:
   - $1$ credit pays for the actual `inStack.push()`.
   - $1$ credit pays for the future `inStack.pop()` during transfer.
   - $1$ credit pays for the future `outStack.push()` during transfer.
   - $1$ credit pays for the final `outStack.pop()` upon dequeue.
2. When the expensive transfer occurs, it consumes the prepaid credits stored on the elements. No additional cost is charged to `pop()` or `peek()`.
3. Over an arbitrary sequence of $k$ operations, total work is bounded by $\le 4k = O(k)$.
4. Therefore, every individual operation has an **amortized time complexity of $O(1)$**.

```javascript
// Node.js code: Dual-Stack Queue Implementation and Common Anti-Pattern

// ❌ WRONG: Eager reshuffling on every single pop/peek destroys amortized O(1)
class InefficientQueue {
  constructor() {
    this.inStack = [];
    this.outStack = [];
  }
  push(x) { this.inStack.push(x); }
  pop() {
    // Transferring all elements back and forth on EVERY pop takes O(n) worst case EVERY time!
    while (this.inStack.length > 0) this.outStack.push(this.inStack.pop());
    const val = this.outStack.pop();
    while (this.outStack.length > 0) this.inStack.push(this.outStack.pop());
    return val;
  }
}

// ✅ CORRECT: Lazy transfer occurs ONLY when outStack is empty
class MyQueue {
  constructor() {
    this.inStack = [];
    this.outStack = [];
  }

  push(x) {
    this.inStack.push(x);
  }

  pop() {
    this._transfer();
    return this.outStack.pop() ?? null;
  }

  peek() {
    this._transfer();
    return this.outStack.length > 0 ? this.outStack[this.outStack.length - 1] : null;
  }

  empty() {
    return this.inStack.length === 0 && this.outStack.length === 0;
  }

  _transfer() {
    // Invariant: Only transfer when outStack is completely empty!
    if (this.outStack.length === 0) {
      while (this.inStack.length > 0) {
        this.outStack.push(this.inStack.pop());
      }
    }
  }
}

const q = new MyQueue();
q.push(1);
q.push(2);
console.log(q.peek()); // 1
console.log(q.pop());  // 1
q.push(3);
console.log(q.pop());  // 2
console.log(q.pop());  // 3
console.log(q.empty()); // true
```

---

### 3. Implement Stack Using Queues: Single-Queue Circular Rotation

A **Queue-based Stack** simulates LIFO behavior using a standard FIFO queue by cycling preexisting elements behind each newly enqueued item.

Because a standard FIFO queue does not allow pulling from the tail, achieving LIFO behavior requires changing the internal order during insertion so that the newest element remains at the front of the queue.

```text
Action: push(A)
Queue state: [ A ]

Action: push(B)
1. Enqueue B:       [ A, B ]       (B is at tail, but must be at front)
2. Rotate length-1: Dequeue A -> Enqueue A
Queue state:       [ B, A ]       (B is now at front!)

Action: push(C)
1. Enqueue C:       [ B, A, C ]
2. Rotate length-1:
   - Dequeue B -> Enqueue B: [ A, C, B ]
   - Dequeue A -> Enqueue A: [ C, B, A ]
Queue state:       [ C, B, A ]    (C is now at front!)

Action: pop()
Dequeue front -> C returned in O(1)!
```

```javascript
// Node.js code: Stack using Single Queue Circular Rotation

class MyStack {
  constructor() {
    this.queue = [];
  }

  push(x) {
    this.queue.push(x);
    const size = this.queue.length;
    // Rotate size - 1 elements to place the newest element at the front
    for (let i = 0; i < size - 1; i++) {
      this.queue.push(this.queue.shift());
    }
  }

  pop() {
    return this.queue.shift() ?? null;
  }

  top() {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  empty() {
    return this.queue.length === 0;
  }
}

const stack = new MyStack();
stack.push(10);
stack.push(20);
stack.push(30);
console.log(stack.top()); // 30
console.log(stack.pop()); // 30
console.log(stack.pop()); // 20
```

#### Structural Asymmetry: Dual-Stack Queue vs Queue Stack

| Metric | Queue using Stacks (LeetCode 232) | Stack using Queues (LeetCode 225) |
| :--- | :--- | :--- |
| **Push Complexity** | $O(1)$ worst-case | $O(n)$ worst-case |
| **Pop Complexity** | $O(1)$ amortized ($O(n)$ worst-case) | $O(1)$ worst-case |
| **Containers Needed** | $2$ Stacks | $1$ Queue (with rotation) or $2$ Queues |
| **Why the Asymmetry?** | Stacks reverse order; two reversals cancel out ($O(1)$ amortized). | Queues preserve order; reversing requires cyclic rotation per push ($O(n)$). |

---

### 4. Browser History & State Machine Patterns: Dual-Stack Navigation

The **Dual-Stack History Pattern** partitions discrete application states across two complementary stacks—backward history and forward history—with the currently active state residing at the boundary.

Whenever a user commits a new discrete action (`visit`), all potential forward states are invalidated and pruned.

```text
1. visit("google.com") -> visit("github.com") -> visit("nodejs.org")
   backStack:    [ "google.com", "github.com" ]
   current:      "nodejs.org"
   forwardStack: [ ]

2. back(1):
   Push current ("nodejs.org") to forwardStack.
   Pop "github.com" from backStack into current.
   backStack:    [ "google.com" ]
   current:      "github.com"
   forwardStack: [ "nodejs.org" ]

3. visit("stackoverflow.com")  <-- FORWARD STACK INVALIDATION!
   Push current ("github.com") to backStack.
   current = "stackoverflow.com"
   forwardStack = [ ] (pruned completely!)
```

```javascript
// Node.js code: Design Browser History (LeetCode 1472)

class BrowserHistory {
  constructor(homepage) {
    this.current = homepage;
    this.backStack = [];
    this.forwardStack = [];
  }

  visit(url) {
    // Invariant: Visiting a new page invalidates all forward history
    this.backStack.push(this.current);
    this.current = url;
    this.forwardStack = []; // Clears forward tree
  }

  back(steps) {
    while (steps > 0 && this.backStack.length > 0) {
      this.forwardStack.push(this.current);
      this.current = this.backStack.pop();
      steps--;
    }
    return this.current;
  }

  forward(steps) {
    while (steps > 0 && this.forwardStack.length > 0) {
      this.backStack.push(this.current);
      this.current = this.forwardStack.pop();
      steps--;
    }
    return this.current;
  }
}

const browser = new BrowserHistory("leetcode.com");
browser.visit("google.com");
browser.visit("facebook.com");
browser.visit("youtube.com");
console.log(browser.back(1));     // "facebook.com"
console.log(browser.back(1));     // "google.com"
console.log(browser.forward(1));  // "facebook.com"
browser.visit("linkedin.com");    // Invalidates "youtube.com"
console.log(browser.forward(2));  // Still "linkedin.com" (forward stack was pruned)
```

---

## Detailed Node.js Relevance: Queue vs Stack in Connection Pools

In backend Node.js infrastructure, deciding between a **FIFO Queue** and a **LIFO Stack** for connection pool management involves critical engineering trade-offs between starvation prevention and CPU cache locality.

```text
FIFO Scheduling (Fairness & Anti-Starvation):
Client Requests Queue:  [ Req 1, Req 2, Req 3 ]
Connection Pool:        Oldest idle socket assigned to Req 1.
Result: Even distribution of connection age; prevents socket timeout drops.

LIFO Scheduling (Warm Connection Re-use):
Client Requests Stack:  [ Req 1, Req 2, Req 3 ]
Connection Pool:        Most recently returned socket assigned to Req 3.
Result: Keeps a small subset of connections hot in memory; allows idle
excess sockets to naturally close via keep-alive timeouts.
```

- **Why Database Drivers (e.g., `pg`, `generic-pool`) Use FIFO Queues**:
  A FIFO queue ensures that client requests waiting for database connections are handled fairly. If a LIFO stack were used for pending requests, during a traffic surge, newly arriving requests would jump ahead of older requests, causing older requests to exceed client timeouts and drop.
- **Why Some HTTP/2 Keep-Alive Pools Use LIFO Stacks for Idle Sockets**:
  LIFO connection reuse ensures that the same socket is repeatedly utilized while warm. Idle sockets at the bottom of the stack remain untouched until idle-connection timeouts close them, allowing the connection pool to scale down naturally.

---

## Tricky Points & Edge Cases

1. **Integer Precision Loss in Difference-Encoded MinStack**:
   A common textbook optimization suggests storing `diff = val - min` to avoid an auxiliary stack. In JavaScript, numbers are IEEE-754 64-bit floats. If values approach `Number.MAX_SAFE_INTEGER` ($2^{53} - 1$) or subtract across extreme negative signs, precision loss leads to corrupt calculations. The parallel stack approach is memory-safe and avoids arithmetic degradation.
2. **Transfer Condition in Dual-Stack Queue**:
   Never transfer elements from `inStack` to `outStack` if `outStack` still contains elements. Doing so places newer elements on top of older elements, violating FIFO ordering.
3. **Failure to Clear Forward Stack on New State Creation**:
   In undo/redo and browser history engines, failing to clear `forwardStack` on `visit()` allows users to "redo" into parallel, divergent states, causing corrupted data.
4. **Boundary Checks on Empty Containers**:
   Always guard against popping or peeking empty containers. In JavaScript, accessing `stack[stack.length - 1]` on an empty array returns `undefined` rather than throwing an error, which can silently propagate `NaN` into calculations.

---

## Hands-On Exercise

### Scenario: Transactional State Manager with Bounded History

In a high-throughput Node.js microservice, document mutations must support transactional `applyAction()`, `undo()`, and `redo()`. However, unboundedly growing undo stacks cause memory leaks. Implement a `TransactionManager` that enforces a maximum history limit (`maxHistory`) while preserving strict undo/redo invariants.

### Buggy Code

```javascript
// ❌ BUGGY: Leaks memory unboundedly and fails to clear redo stack on new action
class BuggyTransactionManager {
  constructor(maxHistory = 5) {
    this.maxHistory = maxHistory;
    this.currentState = "INIT";
    this.undoStack = [];
    this.redoStack = [];
  }

  apply(newState) {
    this.undoStack.push(this.currentState);
    this.currentState = newState;
    // BUG 1: Forgets to clear redoStack! Allows corrupt branching state redos.
    // BUG 2: Never bounds undoStack size! Memory grows indefinitely.
  }

  undo() {
    if (this.undoStack.length === 0) return this.currentState;
    this.redoStack.push(this.currentState);
    this.currentState = this.undoStack.pop();
    return this.currentState;
  }

  redo() {
    if (this.redoStack.length === 0) return this.currentState;
    this.undoStack.push(this.currentState);
    this.currentState = this.redoStack.pop();
    return this.currentState;
  }
}
```

### Acceptance Criteria

1. `apply(newState)` commits state, clears `redoStack`, and caps `undoStack` length at `maxHistory`.
2. Oldest history frames are pruned when `undoStack.length > maxHistory`.
3. `undo()` and `redo()` execute in $O(1)$ time and restore previous states accurately.
4. Production test suite verifies edge cases with `assert`.

### Solution Code

```javascript
// Node.js code: Bounded Transaction Manager
const assert = require("assert");

class TransactionManager {
  constructor(initialState, maxHistory = 3) {
    this.currentState = initialState;
    this.maxHistory = maxHistory;
    this.undoStack = [];
    this.redoStack = [];
  }

  apply(newState) {
    this.undoStack.push(this.currentState);
    // Enforce bounded history to prevent memory leaks
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift(); // Prune oldest historical frame
    }
    this.currentState = newState;
    this.redoStack = []; // Invalidate redo tree on new mutation
  }

  undo() {
    if (this.undoStack.length === 0) return this.currentState;
    this.redoStack.push(this.currentState);
    this.currentState = this.undoStack.pop();
    return this.currentState;
  }

  redo() {
    if (this.redoStack.length === 0) return this.currentState;
    this.undoStack.push(this.currentState);
    this.currentState = this.redoStack.pop();
    return this.currentState;
  }

  getState() {
    return this.currentState;
  }
}

// Verification Tests
const tm = new TransactionManager("v1", 2);
tm.apply("v2");
tm.apply("v3");
tm.apply("v4"); // History exceeded (capacity 2): "v1" pruned; undoStack: ["v2", "v3"]

assert.strictEqual(tm.getState(), "v4");
assert.strictEqual(tm.undo(), "v3");
assert.strictEqual(tm.undo(), "v2");
assert.strictEqual(tm.undo(), "v2"); // Cannot undo past pruned "v1"

assert.strictEqual(tm.redo(), "v3");
tm.apply("v5"); // New mutation invalidates redo stack
assert.strictEqual(tm.redo(), "v5"); // Redo has no effect

console.log("✅ All TransactionManager tests passed successfully.");
```

### Solution Explanation

1. **State Partitioning**: The active document state sits between `undoStack` and `redoStack`.
2. **Redo Invalidation**: Committing a new transaction via `apply()` drops all redo branches (`this.redoStack = []`), maintaining linear state progression.
3. **Memory Bounding**: Capping `undoStack` at `maxHistory` bounds heap consumption in long-running Node.js processes.

---

## Summary

- **MinStack Invariant**: Maintain a secondary parallel stack tracking the minimum value at each frame to deliver $O(1)$ `getMin()`, `push()`, and `pop()`.
- **Dual-Stack Queue**: Buffer in `inStack` and transfer lazily to `outStack` only when `outStack` is empty. This guarantees amortized $O(1)$ operations via the accounting method.
- **Queue-Based Stack**: Rotate $n - 1$ queue elements per push to orient the newest element at the head, enabling $O(1)$ `pop()`.
- **Browser History**: Manage state with paired `backStack` and `forwardStack` collections. Invalidate the forward collection whenever a new state is visited.
- **Connection Pooling**: Use FIFO queues for waiting requests to prevent starvation, and LIFO stacks for idle sockets to optimize warm-socket reuse.

---

## Cheat Sheet & Common Pitfalls

### Dual-Stack Transfer Rule
```javascript
_transfer() {
  // Transfer ONLY when outStack is empty!
  if (this.outStack.length === 0) {
    while (this.inStack.length > 0) {
      this.outStack.push(this.inStack.pop());
    }
  }
}
```

### Common Pitfalls

| Mistake | Consequence | Correct Pattern |
| :--- | :--- | :--- |
| **Eager Transfer in MyQueue** | $O(n)$ cost on every pop and peek. | Transfer lazily only when `outStack.length === 0`. |
| **Difference MinStack** | Precision loss on large numbers or floats. | Use synchronized parallel arrays of SMI integers. |
| **Unbounded Undo Stacks** | Memory leak in Node.js processes. | Enforce a `maxHistory` cap and prune old frames. |
| **Retaining Forward History** | Divergent state corruption after new mutation. | Clear `forwardStack = []` immediately on `visit()`. |

---

## Interview Questions

### 1. How does amortized analysis mathematically prove that a Dual-Stack Queue operates in $O(1)$ time?

**Question:** Mathematically prove why a Dual-Stack Queue has an amortized time complexity of $O(1)$ per operation despite the transfer loop requiring $O(n)$ steps in the worst case. How does this differ from average-case complexity?

**Answer:** 
Average-case complexity assumes a probabilistic distribution over incoming operations (e.g., assuming random inputs). In contrast, amortized analysis makes no probabilistic assumptions and guarantees an upper bound over **any arbitrary sequence** of operations.

Using the potential method or accounting method:
- When an element is pushed into the queue, we assign it $4$ time tokens: $1$ for the initial push to `inStack`, $1$ for popping from `inStack`, $1$ for pushing to `outStack`, and $1$ for popping from `outStack`.
- The actual push operation only takes $1$ unit of work, leaving $3$ tokens stored with the element.
- When `_transfer()` executes, each transfer step (pop from `inStack`, push to `outStack`) is paid for by the tokens previously stored on that element.
- The final `pop()` from `outStack` is also prepaid.

For any valid sequence of $k$ operations containing $m$ pushes and $k - m$ pops, the total actual runtime across the entire sequence is bounded by $\le 4m \le 4k = O(k)$. Therefore, the amortized cost per operation is $\frac{O(k)}{k} = O(1)$.

---

### 2. Why does arithmetic difference encoding in MinStack fail on extreme integers in JavaScript?

**Question:** A candidate proposes an $O(1)$ auxiliary space MinStack by storing arithmetic differences `diff = val - min`. What edge cases and JavaScript runtime vulnerabilities exist with this approach, and how does the two-stack approach resolve them?

**Answer:** 
The difference approach tracks a scalar `min` and pushes `val - min` onto the stack:
- If `val < min`, the candidate pushes a negative difference `val - min` and sets `min = val`.
- On `pop()`, if the popped value is negative, the previous minimum is restored via `min = min - diff`.

In JavaScript, this approach suffers from two severe runtime vulnerabilities:
1. **Integer Overflow Beyond Safe Limits**: JavaScript numbers are IEEE-754 double-precision floats with $53$ bits of integer precision (`Number.MAX_SAFE_INTEGER` = $9,007,199,254,740,991$). If `val = Number.MAX_SAFE_INTEGER` and `min = -Number.MAX_SAFE_INTEGER`, computing `val - min` yields $1.8 \times 10^{16}$, causing loss of precision. The difference cannot be reversed accurately.
2. **Floating-Point Imprecision**: If the stack stores decimal numbers, binary floating-point subtraction (e.g., $0.3 - 0.2 = 0.09999999999999998$) introduces rounding noise that accumulates across repeated pushes and pops.

The synchronized two-stack pattern stores values directly without arithmetic mutation, completely avoiding numeric precision degradation and allowing the V8 engine to store integers in fast packed SMI arrays.

---

### 3. Why is implementing a Stack using Queues structurally more expensive than a Queue using Stacks?

**Question:** Why can a Queue be implemented using two Stacks with amortized $O(1)$ operations, but a Stack implemented using standard Queues requires $O(n)$ worst-case time for either push or pop?

**Answer:** 
This asymmetry stems from the topological properties of the underlying data structures:
- **Stacks reverse order**: A stack is a reversing structure. Pushing a sequence $[1, 2, 3]$ into Stack 1 and then transferring it to Stack 2 yields $[3, 2, 1]$, reversing the order twice. This double reversal restores the original FIFO order. Because elements can remain parked in Stack 2 in FIFO order until consumed, we only reverse when necessary, yielding amortized $O(1)$ costs.
- **Queues preserve order**: A FIFO queue preserves insertion order. Transferring elements between two FIFO queues simply reproduces the same FIFO order without inverting it. To produce LIFO behavior, the newest element must be moved to the front. The only way to move the newest element to the front of a FIFO queue is to rotate all $n - 1$ preexisting elements behind it, which requires $O(n)$ operations.

Because a single queue operation cannot reverse an entire sequence in a single transfer pass, one of the operations (`push` or `pop`) must take $O(n)$ time.

---

### 4. When should a Node.js connection pool schedule idle sockets using a FIFO Queue versus a LIFO Stack?

**Question:** In a high-throughput Node.js microservice communicating with PostgreSQL or Redis, under what conditions would you design the idle connection pool using a FIFO Queue versus a LIFO Stack?

**Answer:** 
The choice between FIFO and LIFO scheduling depends on the engineering trade-off between **request latency fairness** and **resource conservation**:

- **FIFO Queue (Fairness & Anti-Starvation)**:
  - Waiting client requests receive connections in the exact order they requested them.
  - Sockets are cycled evenly across the pool.
  - Used by relational database drivers (e.g., PostgreSQL, MySQL) to prevent older queries from timing out while newer queries jump ahead during traffic spikes.
- **LIFO Stack (Warm Socket Reuse & Automatic Downscaling)**:
  - The most recently returned connection is assigned to the next incoming request.
  - A small working set of connections remains hot in memory and CPU caches, keeping active TCP buffers and TLS sessions warm.
  - Sockets at the bottom of the stack remain idle. This allows idle timeout sweeps to harvest and close excess connections during off-peak periods, naturally scaling down backend connection counts.

In production microservices, client request queues should use FIFO scheduling to prevent starvation, while idle physical socket reuse can leverage LIFO scheduling to optimize connection reuse.

---

<nav aria-label="Lecture navigation">

[Previous: Queue Fundamentals, Circular Queues, and Deque](day-19-queue-circular-queue-and-deque.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Recursion Mechanics and Call Stack](day-21-recursion-mechanics-and-call-stack.md)

</nav>
