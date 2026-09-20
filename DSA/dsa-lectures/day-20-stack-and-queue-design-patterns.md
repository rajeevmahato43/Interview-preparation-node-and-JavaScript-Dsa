# Day 20: Stack and Queue Design Patterns

<nav aria-label="Lecture navigation">

[Previous: Queue Fundamentals, Circular Queues, and Deque](day-19-queue-circular-queue-and-deque.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Recursion Mechanics and Call Stack](day-21-recursion-mechanics-and-call-stack.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Design a **MinStack** supporting $O(1)$ `push`, `pop`, `top`, and `getMin` using parallel minimum tracking.
- Implement a **Queue using two Stacks** with amortized $O(1)$ operation costs.
- Implement a **Stack using Queues** using circular rotation.
- Model multi-page navigation state using the **Browser History Design Pattern**.
- Recognize when dual-data structure coupling provides optimal trade-offs in backend caching and state management.

## Prerequisites

- [Day 16: Stack Fundamentals and LIFO Architecture](day-16-stack-fundamentals-and-lifo.md)
- [Day 19: Queue Fundamentals, Circular Queues, and Deque](day-19-queue-circular-queue-and-deque.md)

---

## Core Concepts

### 1. The MinStack Design: $O(1)$ Minimum Retrieval

A standard stack retrieves the minimum element by scanning all elements: $O(n)$ time.
How can we retrieve the minimum element in **$O(1)$ constant time** while keeping `push` and `pop` at $O(1)$?

**The Synchronized Stack Invariant**:
Maintain a second stack, `minStack`, where `minStack[top]` is always the minimum element present in the stack at that height:

```text
Operations:
push(5) -> main: [ 5 ]          minStack: [ 5 ]
push(3) -> main: [ 5, 3 ]       minStack: [ 5, 3 ]       (min is 3)
push(7) -> main: [ 5, 3, 7 ]    minStack: [ 5, 3, 3 ]    (min is still 3!)
push(2) -> main: [ 5, 3, 7, 2 ] minStack: [ 5, 3, 3, 2 ] (min is now 2)

pop()   -> pops 2 from both -> getMin() returns 3!
pop()   -> pops 7 & 3       -> getMin() returns 3!
```
By storing the historical minimum alongside every frame, popping an element automatically restores the previous minimum in $O(1)$ time!

---

### 2. Implement Queue Using Stacks (Dual-Stack Pattern)

A stack reverses order (LIFO). Reversing a reverse gives the original order (FIFO)!
Maintain two stacks:
- **`inStack`**: Receives all incoming `push()` operations.
- **`outStack`**: Serves all `pop()` and `peek()` operations.

```text
Enqueue A, B, C:
inStack:  [ A, B, C ] (Top is C)
outStack: [ ]

When Dequeue() is called:
If outStack is empty, transfer all elements from inStack to outStack:
inStack.pop() -> outStack.push():
outStack: [ C, B, A ] (Top is now A!)

Now outStack.pop() returns A in FIFO order!
Subsequent pops return B, then C without moving inStack again!
```

---

## Detailed Explanations & Node.js Relevance

### Amortized $O(1)$ Complexity Analysis

Why is the Dual-Stack Queue considered $O(1)$ when transferring elements takes $O(n)$?
- An element is pushed to `inStack` **once** ($O(1)$).
- An element is moved from `inStack` to `outStack` at most **once** ($O(1)$).
- An element is popped from `outStack` **once** ($O(1)$).
Total operations per element across its entire lifecycle: $3 \to \mathbf{O(1)\text{ Amortized Time}}$.
Only occasional pops trigger a transfer, while the overwhelming majority of calls execute in strict $O(1)$ time.

### Node.js Backend Relevance: Bidirectional Stream Buffers
In Node.js socket duplex streams (e.g. WebSocket chat servers), incoming packets must be read in FIFO order while outgoing message history must support LIFO backtracking. Dual-stack and queue abstractions maintain clean data separation without race conditions.

---

## JavaScript Implementation & Tracing

### 1. MinStack (LeetCode 155)

```js
class MinStack {
  constructor() {
    this.stack = [];
    this.minStack = [];
  }

  push(val) {
    this.stack.push(val);

    // If minStack is empty, val is the minimum; otherwise compare with current top
    if (this.minStack.length === 0 || val <= this.minStack[this.minStack.length - 1]) {
      this.minStack.push(val);
    } else {
      // Duplicate current minimum to keep stacks synchronized in height
      const currentMin = this.minStack[this.minStack.length - 1];
      this.minStack.push(currentMin);
    }
  }

  pop() {
    this.minStack.pop();
    return this.stack.pop();
  }

  top() {
    return this.stack[this.stack.length - 1];
  }

  getMin() {
    return this.minStack[this.minStack.length - 1];
  }
}
```

### 2. Implement Queue using Stacks (LeetCode 232)

```js
class MyQueue {
  constructor() {
    this.inStack = [];
    this.outStack = [];
  }

  push(x) {
    this.inStack.push(x);
  }

  pop() {
    this._shiftStacks();
    return this.outStack.pop();
  }

  peek() {
    this._shiftStacks();
    return this.outStack[this.outStack.length - 1];
  }

  empty() {
    return this.inStack.length === 0 && this.outStack.length === 0;
  }

  _shiftStacks() {
    // Only transfer elements if outStack is completely empty
    if (this.outStack.length === 0) {
      while (this.inStack.length > 0) {
        this.outStack.push(this.inStack.pop());
      }
    }
  }
}
```

### Trace: `MyQueue` Push 1, Push 2, Peek, Pop, Empty

| Operation | `inStack` | `outStack` | Output | Explanation |
| :--- | :--- | :--- | :--- | :--- |
| `push(1)` | `[1]` | `[]` | — | Pushed to `inStack` |
| `push(2)` | `[1, 2]` | `[]` | — | Pushed to `inStack` |
| `peek()` | `[]` | `[2, 1]` | `1` | `_shiftStacks()` moves elements; peek returns top of `outStack` |
| `pop()` | `[]` | `[2]` | `1` | Pops `1` from `outStack` |
| `empty()` | `[]` | `[2]` | `false` | `outStack` still holds `2` |

- **Time Complexity**:
  - `push`: $O(1)$
  - `pop` / `peek`: $O(1)$ amortized
  - `empty`: $O(1)$
- **Auxiliary Space**: $O(n)$ where $n$ is total elements stored.

---

## Common Mistakes & Interview Traps

1. **Transferring Elements on Every Pop/Peek**:
   ```js
   // WRONG: Transferring back and forth on every operation:
   this.outStack.push(...this.inStack.reverse()); // Takes O(n) EVERY call!
   ```
   Only transfer from `inStack` to `outStack` when `outStack` is **completely empty**! Once elements are in `outStack`, leave them there until consumed.
2. **Missing Equality in MinStack Push**:
   If using the compressed MinStack variation, you must check `val <= minStack.top` (less than OR equal), not just `<`. If duplicate minimums exist and you only push on strictly less, popping the first copy prematurely leaves the stack with no valid minimum.

---

## Tricky Points & Edge Cases

- **Calling `pop()` or `getMin()` on Empty MinStack**:
  Always return `null` or handle empty state gracefully.
- **Alternating Pushes and Pops in MyQueue**:
  Items in `outStack` retain their correct relative FIFO order even if new items are continuously pushed to `inStack`.

---

## Practical Exercise

Implement **Design Browser History** (LeetCode 1472):
You have a browser of one tab where you start on the `homepage` and you can visit another `url`, get back in the history number of `steps` or move forward in the history number of `steps`.
- `visit(url)`: Clears forward history and navigates to `url`.
- `back(steps)`: Moves back at most `steps` steps.
- `forward(steps)`: Moves forward at most `steps` steps.
- **Acceptance Criterion**: Implement using two stacks (`backStack` and `forwardStack`) in $O(1)$ time per single step.

---

## Summary

- MinStack tracks the running minimum alongside each stack frame to provide $O(1)$ `getMin()`.
- Two LIFO stacks combine to create an amortized $O(1)$ FIFO Queue.
- The lazy transfer rule (transferring only when `outStack` is empty) is essential for amortized $O(1)$ performance.
- Browser history, undo/redo buffers, and transactional state trees are all built on dual-stack design patterns.

---

## Cheat Sheet

### Dual-Stack Queue Transfer Rule
```js
_shift() {
  if (this.outStack.length === 0) {
    while (this.inStack.length > 0) {
      this.outStack.push(this.inStack.pop());
    }
  }
}
```

### MinStack Space Optimization
Instead of pushing duplicate minimums, store `[value, count]` pairs on `minStack` to save memory when minimums repeat often.

---

## Interview Questions

### 1. Deep Definitions and Mental Models
**Question:** Define amortized time complexity in the context of the Dual-Stack Queue, and explain why it is distinct from average time complexity.
- **Expected answer shape:** Average time complexity assumes random or probabilistic inputs. Amortized time complexity provides a mathematical guarantee over *any* worst-case sequence of operations. In a Dual-Stack Queue, while a single `pop()` call may take $O(n)$ steps to transfer elements, each element is moved at most once from `inStack` to `outStack`. Across $k$ operations, total work is bounded by $O(k)$, guaranteeing that each operation costs $O(1)$ amortized.

### 2. Predict the Output and Trace Execution
**Question:** Trace the contents of `minStack` after: `push(2)`, `push(0)`, `push(3)`, `push(0)`, `pop()`, `getMin()`.
- **Expected answer shape:**
- `push(2)` $\to$ `minStack: [2]`
- `push(0)` $\to$ `minStack: [2, 0]`
- `push(3)` $\to$ `minStack: [2, 0, 0]`
- `push(0)` $\to$ `minStack: [2, 0, 0, 0]`
- `pop()` $\to$ pops `0`, `minStack: [2, 0, 0]`
- `getMin()` $\to$ returns `0` (the top of `minStack`).

### 3. Implementation Exercise
**Question:** Implement `MyStack` using a single standard FIFO Queue with circular rotation.
- **Expected answer shape:**
```js
class MyStack {
  constructor() { this.q = []; }
  push(x) {
    this.q.push(x);
    for (let i = 0; i < this.q.length - 1; i++) {
      this.q.push(this.q.shift()); // Rotate previous elements behind new element
    }
  }
  pop() { return this.q.shift(); }
  top() { return this.q[0]; }
  empty() { return this.q.length === 0; }
}
```

### 4. Debugging and Failure Analysis
**Question:** A developer optimizes MinStack by storing the mathematical difference: `diff = val - min`. On inputs near `Number.MAX_SAFE_INTEGER`, the stack produces incorrect results. Why?
- **Expected answer shape:** Subtracting large numbers ($10^{16} - (-10^{16})$) causes integer overflow and precision loss beyond JavaScript's 53-bit integer limit (`Number.MAX_SAFE_INTEGER`). The two-stack approach avoids arithmetic differences and is completely safe from overflow.

### 5. Design and Tradeoff Questions
**Question:** How would you design a data structure that supports $O(1)$ `push`, `pop`, `getMin`, and `getMax` simultaneously?
- **Expected answer shape:** Maintain three synchronized stacks: `mainStack`, `minStack`, and `maxStack`. On `push(x)`, push $x$ to `mainStack`, $\min(x, \text{currentMin})$ to `minStack`, and $\max(x, \text{currentMax})$ to `maxStack`. All four operations (`push`, `pop`, `getMin`, `getMax`) run in $O(1)$ time with $O(3n) = O(n)$ auxiliary space.

### 6. Senior Follow-ups: Node.js Connection Pooling
**Question:** In a high-concurrency Node.js database driver, why would connection pool checkouts be designed as a Queue (FIFO) rather than a Stack (LIFO)?
- **Expected answer shape:** A Queue (FIFO) prevents starvation by ensuring that the client request waiting longest gets the next available connection (fairness). A Stack (LIFO) would continuously reuse the hottest connection for new requests, potentially starving older requests until they hit client-side socket timeouts.

<nav aria-label="Lecture navigation">

[Previous: Queue Fundamentals, Circular Queues, and Deque](day-19-queue-circular-queue-and-deque.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Recursion Mechanics and Call Stack](day-21-recursion-mechanics-and-call-stack.md)

</nav>
