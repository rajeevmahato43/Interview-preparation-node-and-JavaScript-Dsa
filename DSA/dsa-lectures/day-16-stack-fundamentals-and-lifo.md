# Day 16: Stack Fundamentals and LIFO Architecture

<nav aria-label="Lecture navigation">

[Previous: Prefix Sum and Cumulative Totals](day-15-prefix-sum-and-range-queries.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Valid Parentheses and Expression Parsing](day-17-valid-parentheses-and-expressions.md)

</nav>
## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Asymptotic analysis and auxiliary memory.
- [Day 02: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md) — Array internal element kinds and backing memory.
- [Day 04: Recursion and Call Stack](day-04-recursion-and-call-stack.md) — Call stack activation records and stack overflow limits.
---

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            LIFO (LAST-IN, FIRST-OUT) ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Push Operations (Adding to Top):
  push(10) ──> [ 10 ]
  push(20) ──> [ 10, 20 ]        <-- 20 is on TOP
  push(30) ──> [ 10, 20, 30 ]    <-- 30 is on TOP

  Pop Operation (Removing from Top):
  pop()    ──> removes 30        <-- Returns 30; Top is now 20!

  Peek Operation (Inspecting Top):
  peek()   ──> returns 20 without mutating the stack.
```

## 1. The LIFO Principle and Stack Primitives

> **LIFO (Last-In, First-Out)**: An access model where the most recently added item is the first item removed.

A **Stack** is a linear collection governed by the Last-In, First-Out (LIFO) protocol: the newest element pushed onto the stack is the first element popped off.

All fundamental stack operations execute in **$O(1)$ constant time**:
- **`push(item)`**: Inserts `item` onto the top of the stack ($O(1)$).
- **`pop()`**: Removes and returns the top element ($O(1)$).
- **`peek()` / `top()`**: Reads the top element without mutating the collection ($O(1)$).
- **`isEmpty()`**: Checks if the stack contains zero elements ($O(1)$).
- **`size()`**: Returns the count of elements currently on the stack ($O(1)$).

---

## 2. Implementation Paradigms: Dynamic Array vs Singly Linked List

| Criterion | Dynamic Array (`Array.prototype`) | Singly Linked List (`StackNode`) |
|---|---|---|
| **Push Complexity** | $O(1)$ amortized (occasional $O(n)$ resize) | Strict $O(1)$ worst case |
| **Pop Complexity** | $O(1)$ | Strict $O(1)$ worst case |
| **Memory Locality** | **High** (contiguous packed buffer in V8) | Low (scattered heap nodes and pointer references) |
| **Memory Overhead** | Minimal (contiguous typed or SMI elements) | High (allocates a JavaScript object wrapper per node) |
| **GC Pressure** | Minimal | **High** (frequent object allocations and dereferencing) |
| **Recommendation** | **Standard in JavaScript/Node.js** | Specialized real-time systems needing strict latencies |

```javascript
// Node.js code
"use strict";

// ❌ ANTI-PATTERN: Using shift/unshift at the head of an array (O(n) per operation!)
class SlowHeadStack {
  constructor() { this.items = []; }
  push(val) { this.items.unshift(val); } // O(n) memory shift!
  pop() { return this.items.shift(); }   // O(n) memory shift!
}

// ✅ PATTERN A: Optimal Dynamic Array Stack (O(1) amortized)
class ArrayStack {
  constructor() {
    this.items = [];
  }

  push(val) {
    this.items.push(val); // O(1) amortized
  }

  pop() {
    if (this.isEmpty()) return null;
    return this.items.pop(); // O(1)
  }

  peek() {
    return this.isEmpty() ? null : this.items[this.items.length - 1];
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }
}

// ✅ PATTERN B: Linked List Stack (Strict O(1) without resizes)
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

  push(val) {
    this.topNode = new StackNode(val, this.topNode);
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

const stack = new ArrayStack();
stack.push(10);
stack.push(20);
console.log("Top item:", stack.peek()); // 20
console.log("Popped:", stack.pop());    // 20
console.log("New top:", stack.peek());  // 10
```

---

## 3. Explicit Heap Stack vs V8 Call Stack Limits

> **Explicit Heap Stack**: Simulating execution frames manually using a JavaScript array residing on the V8 heap.

In Node.js, every function call allocates a stack frame on the V8 engine's physical Call Stack. The physical call stack has a strict limit of ~1 MB (~10,000 frames).

If an algorithm requires traversing deeply nested data (e.g., deep tree traversal, recursive graph DFS, or AST parsing):
- Recursive calls exceed stack depth, throwing `RangeError: Maximum call stack size exceeded`.
- **The Solution:** Allocate an explicit array stack on the **V8 Heap** (`const stack = []`). Heap memory is bounded only by available RAM (1.5 GB to 4 GB in Node.js), allowing algorithms to safely process millions of elements.

```javascript
// Node.js code
// Simulated tree with 50,000 linear depth
let deepTree = { val: 50000, next: null };
for (let i = 49999; i >= 1; i--) {
  deepTree = { val: i, next: deepTree };
}

// ❌ Recursive traversal throws RangeError on this tree
// function traverse(node) { if (!node) return; traverse(node.next); }

// ✅ Explicit Heap Stack processes millions of elements safely
function traverseWithExplicitStack(root) {
  const stack = [root];
  let processedCount = 0;

  while (stack.length > 0) {
    const current = stack.pop();
    processedCount++;
    if (current.next) {
      stack.push(current.next);
    }
  }

  return processedCount;
}

console.log("Processed deep tree nodes:", traverseWithExplicitStack(deepTree)); // 50000
```

---

## 4. Undo / Redo History Manager Pattern

In stateful backend systems (e.g., collaborative editors or transactional staging), user actions are managed via two coupled LIFO stacks:
1. `undoStack`: Stores chronological actions executed by the user.
2. `redoStack`: Stores actions that were undone.
- **Rule:** Executing any *new* action clears the `redoStack` immediately because the previous future timeline is invalidated.

```javascript
// Node.js code
class UndoRedoManager {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
  }

  executeAction(action) {
    this.undoStack.push(action);
    // Executing a new action invalidates existing redo history
    this.redoStack.length = 0;
  }

  undo() {
    if (this.undoStack.length === 0) return null;
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    return action; // Reverses this action
  }

  redo() {
    if (this.redoStack.length === 0) return null;
    const action = this.redoStack.pop();
    this.undoStack.push(action);
    return action; // Re-applies this action
  }
}

const manager = new UndoRedoManager();
manager.executeAction("INSERT: 'Hello'");
manager.executeAction("INSERT: ' World'");
console.log("Undo action:", manager.undo()); // "INSERT: ' World'"
console.log("Redo action:", manager.redo()); // "INSERT: ' World'"
```

#### Execution Trace: Undo / Redo Lifecycle

| Operation | `undoStack` (Bottom $\to$ Top) | `redoStack` (Bottom $\to$ Top) | Output Action |
|---|---|---|---|
| `executeAction("A")` | `["A"]` | `[]` | — |
| `executeAction("B")` | `["A", "B"]` | `[]` | — |
| `undo()` | `["A"]` | `["B"]` | `"B"` |
| `redo()` | `["A", "B"]` | `[]` | `"B"` |
| `executeAction("C")` | `["A", "B", "C"]` | `[]` (Cleared) | — |

---

## Tricky Points and Edge Cases

### 1. Popping from an Empty Stack in JavaScript
In JavaScript, executing `[].pop()` returns `undefined` without throwing an error:
```javascript
// Node.js code
const stack = [];
const val = stack.pop(); // undefined

// ❌ TRAP: Arithmetic with undefined yields NaN!
const total = val + 5; // NaN
```
Always check `if (stack.length > 0)` or use `.isEmpty()` guards before performing operations.

### 2. V8 Backing Store Memory Retention
When an array grows to 1,000,000 elements, V8 allocates a multi-megabyte internal memory buffer. If you pop all elements via `while (stack.length) stack.pop()`, `stack.length` reaches `0`, but V8 often retains the allocated capacity buffer to avoid future reallocations. In long-running Node.js processes, reset via `stack.length = 0` or reassign `stack = []` to allow garbage collection.

---

## Hands-On Exercise

### Scenario
You are developing an automated scoring engine for a game simulator (LeetCode 682: Baseball Game). You receive an array of string operations representing game events:
- An integer `x`: Record a new score of `x`.
- `"+"`: Record a new score that is the sum of the previous two scores.
- `"D"`: Record a new score that is double the previous score.
- `"C"`: Invalidate and remove the previous score from the record.

You must return the total sum of all scores remaining on the record.

### Buggy Code
```javascript
// Node.js code
function calPointsBuggy(operations) {
  // ❌ Bug 1: Uses shift/unshift, introducing an O(n^2) performance penalty
  // ❌ Bug 2: Fails to convert string values to integers before summing
  const record = [];
  for (const op of operations) {
    if (op === "+") record.push(record[record.length - 1] + record[record.length - 2]); // Strings concatenated!
    else if (op === "D") record.push(record[record.length - 1] * 2);
    else if (op === "C") record.pop();
    else record.push(op);
  }
  return record.reduce((a, b) => a + b, 0);
}
```

### Acceptance Criteria
1. Execute in strictly $O(n)$ time using an array-backed stack.
2. Auxiliary space must be $O(n)$ to store scores.
3. Parse numeric strings explicitly into integers (`parseInt` or `Number()`).
4. Accurately handle score invalidations (`"C"`) and double operations (`"D"`).

### Solution Code

```javascript
// Node.js code
import assert from "node:assert/strict";

function calPoints(operations) {
  const stack = [];

  for (const op of operations) {
    if (op === "+") {
      // Sum the previous two scores without popping them
      const prev1 = stack[stack.length - 1];
      const prev2 = stack[stack.length - 2];
      stack.push(prev1 + prev2);
    } else if (op === "D") {
      // Double the previous score
      const prev = stack[stack.length - 1];
      stack.push(prev * 2);
    } else if (op === "C") {
      // Invalidate and remove the previous score
      stack.pop();
    } else {
      // Numerical integer score
      stack.push(Number(op));
    }
  }

  // Sum all valid remaining scores
  let totalScore = 0;
  for (let i = 0; i < stack.length; i++) {
    totalScore += stack[i];
  }

  return totalScore;
}

// Verification Tests
assert.equal(calPoints(["5", "2", "C", "D", "+"]), 30);
// Trace: [5] -> [5, 2] -> [5] -> [5, 10] -> [5, 10, 15] -> Sum = 30

assert.equal(calPoints(["5", "-2", "4", "C", "D", "9", "+", "+"]), 27);
assert.equal(calPoints(["1", "C"]), 0);

console.log("✅ All Baseball Game stack scoring assertions passed successfully!");
```

### Solution Explanation

1. **LIFO Score Invalidation:** The `"C"` operator corresponds directly to `stack.pop()`, removing the most recent score in $O(1)$ time.
2. **Direct Top Peeking:** Reading `stack[stack.length - 1]` and `stack[stack.length - 2]` accesses the top two scores without mutating stack contents.

---

## Summary

- Stacks adhere to the **Last-In, First-Out (LIFO)** protocol; `push`, `pop`, and `peek` execute in $O(1)$ time.
- Dynamic JavaScript arrays using `.push()` and `.pop()` provide optimal stack performance with superior CPU cache locality in V8.
- Never use `shift()` or `unshift()` for stacks; head modifications trigger $O(n)$ memory shifts.
- Converting recursive algorithms to use an **explicit stack on the heap** prevents Node.js `RangeError: Maximum call stack size exceeded` crashes.
- Coupled undo and redo stacks maintain transactional state history with $O(1)$ transitions per action.

---

## Cheat Sheet

### Common Stack Methods
```javascript
const stack = [];
stack.push(val);                      // O(1) Push to top
const top = stack.pop();              // O(1) Pop from top
const peek = stack[stack.length - 1]; // O(1) Inspect top
const isEmpty = stack.length === 0;   // O(1) Empty check
stack.length = 0;                     // O(1) Reset & drop references
```

### Common Pitfalls
- **Using `shift()` and `unshift()`:** Introduces $O(n)$ element shifting per operation, causing $O(n^2)$ overall runtime.
- **Popping Empty Stacks:** Returns `undefined`, which silently leads to `NaN` errors during arithmetic.
- **Retaining Stale Redo State:** Forgetting to clear `redoStack` when a new action is performed.
- **Unbounded Stack Memory:** Retaining millions of historical actions in an undo buffer without a maximum capacity limit.

---

## Interview Questions

### 1. How does converting a recursive algorithm into an iterative algorithm using an explicit stack protect a Node.js process?

**Question:** Explain how call stack memory limits in V8 differ from heap memory allocations, and how simulating recursion with an explicit stack prevents application crashes.

**Answer:** 
In the V8 engine, function execution contexts are placed on the **Call Stack**, an isolated memory region with a rigid physical capacity of approximately 1 MB. This allocates room for roughly **10,000 to 10,400 activation records**. If a recursive function traverses a skewed tree, graph, or nested document of depth $> 10,400$, V8 throws an uncatchable `RangeError: Maximum call stack size exceeded`. In Node.js, an uncaught exception in a request handler terminates the entire worker process.

**The Explicit Heap Stack Solution:**
By declaring an array `const stack = []` inside a `while` loop, execution records are allocated on the **V8 Heap** rather than the physical Call Stack:
- Heap memory in Node.js defaults to 1.5 GB to 4 GB.
- The iterative loop executes within a **single call stack frame**, using $O(1)$ physical call stack space.
- The heap array can hold millions of element frames without crashing the process, bounded only by system RAM.

---

### 2. What does this code print, and what is the exact step-by-step evaluation order?

**Question:** Trace the execution and output of the following stack operations:
```javascript
const stack = [1, 2, 3];
stack.push(stack.pop() * 2);
stack.push(stack.pop() + stack.pop());
console.log(stack);
```

**Answer:**
The code prints: `[ 1, 8 ]`.

**Execution Trace:**
1. **Initial State:** `stack = [1, 2, 3]`.
2. **Line 2 (`stack.push(stack.pop() * 2)`):**
   - `stack.pop()` removes and returns `3`. Stack is now `[1, 2]`.
   - `3 * 2 = 6`.
   - `stack.push(6)` appends `6`. Stack is now `[1, 2, 6]`.
3. **Line 3 (`stack.push(stack.pop() + stack.pop())`):**
   - Expressions in JavaScript evaluate left to right.
   - First `stack.pop()` executes, returning `6`. Stack is now `[1, 2]`.
   - Second `stack.pop()` executes, returning `2`. Stack is now `[1]`.
   - The addition evaluates: `6 + 2 = 8`.
   - `stack.push(8)` appends `8`. Stack is now `[1, 8]`.
4. Output is `[1, 8]`.

---

### 3. When would a singly linked list stack be preferred over a dynamic array stack in systems programming?

**Question:** Compare worst-case operation latencies and memory characteristics between dynamic arrays and linked lists for stack implementations.

**Answer:** 
1. **Dynamic Array Stack:**
   - **Performance:** Appends are $O(1)$ *amortized*. However, when the allocated capacity of the array is exhausted, the engine must allocate a new buffer of double the size and copy all existing $n$ elements over. This single push takes $O(n)$ time.
   - **Cache Locality:** Contiguous memory layout yields excellent CPU L1/L2 cache hits.
2. **Linked List Stack:**
   - **Performance:** Every `push()` allocates an independent `StackNode` containing a pointer to the previous node. Because no resizing or mass array reallocation ever occurs, every single push and pop operation has a **guaranteed strict $O(1)$ worst-case latency**.
   - **Cache Locality:** Poor. Nodes are scattered across the heap, causing CPU cache misses.
- **Trade-off Decision:** Dynamic arrays are faster for general Node.js applications. Linked list stacks are preferred in hard real-time systems where $O(n)$ reallocation latency spikes are unacceptable.

---

### 4. In a long-running Node.js process, an in-memory undo stack has recorded 500,000 actions. Even after popping all items, process memory remains high. Why, and how do you fix it?

**Question:** Explain V8 array backing store memory behavior when elements are popped, and how to reclaim memory in Node.js.

**Answer:** 
When an array grows in V8, the runtime repeatedly doubles its underlying C++ backing store capacity. When elements are subsequently removed via `pop()`, V8 decrements the JavaScript `.length` property, but **does not automatically shrink or deallocate the pre-allocated backing memory buffer**. This optimization avoids memory reallocation churn if the array grows again.

However, in a long-lived Node.js server, retaining a 500,000-element capacity buffer consumes tens of megabytes of resident set size (RSS).

**How to Fix:**
1. **Reset Length:** `stack.length = 0` clears the array, but may still retain capacity in some V8 versions.
2. **Reassign Reference:** Reassign the variable to a brand-new empty array: `stack = []`.
   This severs all references to the large old backing store, allowing V8's Garbage Collector to reclaim the buffer during the next GC cycle.
3. **Cap History Depth:** Enforce a maximum capacity limit (e.g., maximum 1,000 actions) using a bounded circular buffer or by shifting the oldest action when capacity is exceeded.

---

<nav aria-label="Lecture navigation">

[Previous: Prefix Sum and Cumulative Totals](day-15-prefix-sum-and-range-queries.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Valid Parentheses and Expression Parsing](day-17-valid-parentheses-and-expressions.md)

</nav>
