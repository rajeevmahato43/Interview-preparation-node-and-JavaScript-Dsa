# Day 16: Stack Fundamentals and LIFO Architecture

<nav aria-label="Lecture navigation">

[Previous: Prefix Sum and Cumulative Totals](day-15-prefix-sum-and-range-queries.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Valid Parentheses and Expression Parsing](day-17-valid-parentheses-and-expressions.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain the **Last-In, First-Out (LIFO)** data processing principle.
- Implement a Stack using both a dynamic JavaScript array and a singly linked list.
- Trace execution frames and call stack mechanics in the V8 engine.
- Understand stack memory allocation vs heap allocation in Node.js.
- Design an undo/redo history manager using two LIFO stacks.

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md)
- [Day 04: Recursion and Call Stack](day-04-recursion-and-call-stack.md)

---

## Core Concepts

### 1. The LIFO Principle

A **Stack** behaves like a physical stack of cafeteria trays: the last tray placed on top is the first tray removed.

```text
Operations:
push(10) -> [ 10 ]
push(20) -> [ 10, 20 ]       <- 20 is on TOP
push(30) -> [ 10, 20, 30 ]   <- 30 is on TOP
pop()    -> removes 30       <- Top is now 20
peek()   -> inspects 20 without removing it
```

- **`push(item)`**: Add item to the top $\to O(1)$
- **`pop()`**: Remove and return the top item $\to O(1)$
- **`peek()` / `top()`**: Return the top item without mutating $\to O(1)$
- **`isEmpty()`**: Check if size is $0 \to O(1)$

---

### 2. Array-Backed vs Linked-List-Backed Stack

In JavaScript, there are two primary ways to implement a stack:

#### Approach 1: Dynamic Array (`push()` and `pop()`)
JavaScript arrays are dynamically resized arrays. Adding and removing from the end (`arr.push(x)` and `arr.pop()`) runs in **$O(1)$ amortized time**.
- **Pros**: Minimal memory overhead, contiguous memory layout (fast CPU cache hits in V8).
- **Cons**: Occasional capacity resizing when the array doubles its backing store.

#### Approach 2: Singly Linked List
Nodes where each node points to the node beneath it.
- **Pros**: Strictly guaranteed $O(1)$ worst-case push/pop (no array resizing).
- **Cons**: Allocates an object wrapper per element (higher GC overhead in Node.js).

---

## Detailed Explanations & Node.js Relevance

### Call Stack Simulation in Node.js

Every function call in JavaScript creates an execution context pushed onto V8's internal **Call Stack**.
When a function returns, its frame is popped from the stack.
```text
Call Stack:
| processPayment() | <- Top of stack (executing)
| handleCheckout() |
| routerMiddleware|
+------------------+
```
If an algorithm requires deep recursion, it risks a `RangeError: Maximum call stack size exceeded` in Node.js.
By allocating an **explicit stack on the heap** (`const stack = []`), you can rewrite recursive algorithms iteratively, converting limited call stack depth (~10,000 frames) into heap-allocated operations bounded only by available RAM (GBs).

### Node.js Architecture: Undo / Redo Buffers
In stateful backend services (e.g. collaborative document editing or configuration rollback), actions are pushed to an `undoStack`. When an undo occurs, the action is popped and pushed to a `redoStack`.

---

## JavaScript Implementation & Tracing

### 1. Linked-List-Backed Stack Implementation

```js
class StackNode {
  constructor(value, next = null) {
    this.value = value;
    this.next = next;
  }
}

class LinkedListStack {
  constructor() {
    this.topNode = null;
    this.count = 0;
  }

  push(value) {
    const newNode = new StackNode(value, this.topNode);
    this.topNode = newNode;
    this.count++;
  }

  pop() {
    if (this.isEmpty()) return null;
    const value = this.topNode.value;
    this.topNode = this.topNode.next;
    this.count--;
    return value;
  }

  peek() {
    return this.isEmpty() ? null : this.topNode.value;
  }

  isEmpty() {
    return this.count === 0;
  }

  size() {
    return this.count;
  }
}
```

### 2. Undo / Redo Manager Pattern

```js
class UndoRedoManager {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
  }

  executeAction(action) {
    this.undoStack.push(action);
    // Executing a new action clears the redo history
    this.redoStack.length = 0;
  }

  undo() {
    if (this.undoStack.length === 0) return null;
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    return action; // Caller reverses this action
  }

  redo() {
    if (this.redoStack.length === 0) return null;
    const action = this.redoStack.pop();
    this.undoStack.push(action);
    return action; // Caller re-applies this action
  }
}
```

### Trace: Undo / Redo Execution

| Operation | `undoStack` (Bottom $\to$ Top) | `redoStack` (Bottom $\to$ Top) | Returned Action |
| :--- | :--- | :--- | :--- |
| `executeAction("Type A")` | `["Type A"]` | `[]` | — |
| `executeAction("Type B")` | `["Type A", "Type B"]` | `[]` | — |
| `undo()` | `["Type A"]` | `["Type B"]` | `"Type B"` |
| `redo()` | `["Type A", "Type B"]` | `[]` | `"Type B"` |
| `executeAction("Type C")` | `["Type A", "Type B", "Type C"]` | `[]` (Cleared) | — |

- **Time Complexity**: $O(1)$ for every `executeAction`, `undo`, and `redo` operation.
- **Auxiliary Space**: $O(n)$ where $n$ is total history size.

---

## Common Mistakes & Interview Traps

1. **Popping from an Empty Stack**:
   Calling `arr.pop()` on an empty array in JavaScript returns `undefined`. Always verify `.length > 0` before operating on values to prevent silent type coercion bugs.
2. **Accidentally using `arr.shift()` and `arr.unshift()`**:
   Adding and removing from the front of an array takes $O(n)$ time because all subsequent elements must be re-indexed. Stacks must only use `push()` and `pop()` at the end of the array.
3. **Forgetting to clear the Redo stack**:
   When a user performs a new action after an undo, the existing redo history becomes invalid and must be discarded.

---

## Tricky Points & Edge Cases

- **Peeking Without Mutating**:
  `const top = stack[stack.length - 1];` reads the top element in $O(1)$ time without removing it.
- **Memory Retention with Arrays**:
  Setting `stack.length = 0` instantly drops all references, allowing V8's garbage collector to reclaim memory immediately.

---

## Practical Exercise

Implement **Baseball Game** (LeetCode 682):
You are keeping score for a baseball game with strange rules. Given an array of string operations:
- Integer $x$: Record a new score of $x$.
- `"+"`: Record a new score that is the sum of the previous two scores.
- `"D"`: Record a new score that is double the previous score.
- `"C"`: Invalidate the previous score, removing it.
Return the sum of all scores remaining on the record.
- **Acceptance Criterion**: Must run in $O(n)$ time and $O(n)$ auxiliary space using an explicit stack.

---

## Summary

- A Stack is a LIFO data structure supporting $O(1)$ push, pop, and peek.
- JavaScript's native array methods `.push()` and `.pop()` provide an optimal array-backed stack.
- Using an explicit heap-allocated stack eliminates recursion depth limitations in the Node.js runtime.
- Undo/redo managers utilize two coupled stacks to track state reversibility in $O(1)$ time per operation.

---

## Cheat Sheet

### Stack Operations in JavaScript
```js
const stack = [];
stack.push(val);          // O(1) Push to top
const top = stack.pop();  // O(1) Pop from top
const peek = stack[stack.length - 1]; // O(1) Peek top element
const isEmpty = stack.length === 0;   // O(1) Check empty
```

---

## Interview Questions

### 1. Deep Definitions and Mental Models
**Question:** Explain how converting a recursive algorithm into an iterative algorithm using an explicit stack protects a Node.js process.
- **Expected answer shape:** The V8 call stack has a strict maximum size (~10,000 frames). Recursive functions on large inputs risk throwing a `RangeError: Maximum call stack size exceeded`. An explicit stack allocates frames as objects in the V8 heap, which can hold millions of elements bounded only by available system RAM (e.g. 1.4 GB–4 GB), preventing process termination.

### 2. Predict the Output and Trace Execution
**Question:** What does this code log?
```js
const stack = [1, 2, 3];
stack.push(stack.pop() * 2);
stack.push(stack.pop() + stack.pop());
console.log(stack);
```
- **Expected answer shape:** Prints `[1, 8]`.
1. `stack.pop()` returns `3`. `3 * 2 = 6`. `stack.push(6)` $\to$ `[1, 2, 6]`.
2. Next line evaluates `stack.pop() + stack.pop()` from left to right: first pop is `6`, second pop is `2`. Sum is `6 + 2 = 8`. `stack.push(8)` $\to$ `[1, 8]`.

### 3. Implementation Exercise
**Question:** Write a function that uses a stack to reverse a string in $O(n)$ time.
- **Expected answer shape:**
```js
function reverseStringWithStack(str) {
  const stack = [];
  for (let i = 0; i < str.length; i++) stack.push(str[i]);
  let reversed = "";
  while (stack.length > 0) reversed += stack.pop();
  return reversed;
}
```

### 4. Debugging and Failure Analysis
**Question:** A developer uses an array as a stack: `stack.unshift(x)` to push and `stack.shift()` to pop. During load testing, performance degrades exponentially with input size. Why?
- **Expected answer shape:** `unshift()` and `shift()` insert and remove elements at index 0, requiring V8 to shift all existing elements in the underlying buffer. This is an $O(n)$ operation. Over $n$ items, total time is $O(n^2)$. Stacks must use `push()` and `pop()` at the end of the array for $O(1)$ operations.

### 5. Design and Tradeoff Questions
**Question:** When would a linked-list stack be preferred over a dynamic-array stack in a systems programming context?
- **Expected answer shape:** A dynamic array periodically needs to resize when capacity is exceeded, which incurs an $O(n)$ reallocation and memory copy overhead (amortized $O(1)$). A linked list allocates nodes individually, providing a guaranteed $O(1)$ strict worst-case latency per operation, which is critical in hard real-time systems where GC or reallocation spikes are prohibited.

### 6. Senior Follow-ups: Node.js Memory Management
**Question:** In a long-running Node.js process, an in-memory undo stack has recorded 500,000 actions. Even after popping all items, process memory remains high. Why?
- **Expected answer shape:** In V8, arrays grow their internal backing capacity as elements are pushed. Popping elements decrements `array.length`, but V8 often keeps the pre-allocated backing memory buffer allocated to avoid resizing churn. Setting `stack.length = 0` or reassigning `stack = []` explicitly drops references, allowing V8 to deallocate the buffer during the next garbage collection cycle.

<nav aria-label="Lecture navigation">

[Previous: Prefix Sum and Cumulative Totals](day-15-prefix-sum-and-range-queries.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Valid Parentheses and Expression Parsing](day-17-valid-parentheses-and-expressions.md)

</nav>
