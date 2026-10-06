# Day 04: Recursion and Call Stack

<nav aria-label="Lecture navigation">

[Previous: Strings and Text Patterns](day-03-strings-and-text-patterns.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Sorting and Searching Basics](day-05-sorting-and-searching-basics.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Deconstruct recursive mechanics into rigorous base cases and progress-guaranteeing recursive steps.
- Explain the physical structure of a call stack frame (activation record) in the V8 engine.
- Calculate recursive auxiliary space complexity based on peak call stack depth.
- Identify the limits of the JavaScript call stack (~10,000 frames) and protect Node.js microservices against recursive Denial-of-Service (DoS) attacks.
- Convert exponential tree recursion ($O(2^n)$) into linear time ($O(n)$) using top-down memoization.
- Refactor stack-overflow-prone recursion into memory-safe iteration using heap-allocated explicit stacks and trampolines.

---

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Asymptotic analysis and auxiliary call stack space.
- [Day 02: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md) — Array stack primitives (`push`/`pop`) and `Map` cache structures.
- [JS Day 06: Functions, Parameters, and Callbacks](../../Javascript/javascript-lectures/day-06-functions-parameters-and-callbacks.md) — Execution contexts and scope chains.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
|---|---|---|
| **Activation Record (Stack Frame)** | A discrete memory block allocated on the execution call stack storing arguments, local variables, and the return address. | Consumes stack memory per active function call; disappears only when the function executes `return`. |
| **Base Case** | The terminating condition that produces an immediate non-recursive result without further calls. | Missing or faulty base cases cause infinite recursion and application crashes. |
| **Stack Overflow** | A runtime exception (`RangeError`) triggered when cumulative stack frames exceed the call stack memory limit (~1 MB in V8). | Occurs at ~10,400 nested calls in Node.js, crashing the entire worker process if uncaught. |
| **Call Stack Depth** | The maximum number of concurrently active stack frames living in memory at any point during execution. | Defines the auxiliary space complexity ($O(\text{depth})$) of recursive algorithms. |
| **Tail Call Optimization (TCO)** | An engine optimization that reuses the current stack frame if the recursive call is in tail position. | Supported in ES2015 spec, but **not implemented in V8/Node.js**; recursion always grows the stack. |
| **Explicit Stack** | A heap-allocated JavaScript array used with a `while` loop to emulate the execution call stack. | Allows processing millions of tree nodes or graph vertices without exhausting call stack limits. |

---

## Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            CALL STACK VS HEAP MEMORY ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  CALL STACK (Fixed Size: ~1 MB, ~10,000 Frames)       HEAP MEMORY (Dynamic Size: ~1.5 - 4 GB)
  ┌──────────────────────────────────────────────┐     ┌────────────────────────────────────┐
  │ Frame 3: factorial(1) -> returns 1           │     │ Explicit Arrays: [ node1, node2 ]  │
  ├──────────────────────────────────────────────┤     │ Memoization Maps: Map(50)          │
  │ Frame 2: factorial(2) -> waits for 1         │     │ Large JSON Payloads & Buffers      │
  ├──────────────────────────────────────────────┤     │ Dynamically allocated objects      │
  │ Frame 1: factorial(3) -> waits for 2         │     └────────────────────────────────────┘
  ├──────────────────────────────────────────────┤
  │ Frame 0: Global Execution Context            │     • Stack grows DOWNWARD per function.
  └──────────────────────────────────────────────┘     • Heap holds explicit data structures.
```

### 1. Anatomy of Recursion: Base Case and Recursive Step

Recursion is a problem-solving technique where a function solves a subproblem by calling itself with smaller or partitioned input.

Every valid recursive function must possess two invariant elements:
1. **Base Case:** A terminating branch that halts recursion and returns a concrete value when the subproblem is trivial.
2. **Recursive Step:** The code path that divides the problem, invokes the function on the reduced problem space, and advances strictly toward the base case.

```javascript
// Node.js code
"use strict";

// Basic countdown demonstration
function countdown(n) {
  // 1. Base case: Terminate when n reaches zero
  if (n <= 0) {
    console.log("Go!");
    return;
  }

  // Action before recursive call (executes on the way DOWN the stack)
  console.log("T-minus:", n);

  // 2. Recursive step: Decrement input toward the base case
  countdown(n - 1);
}

countdown(3);
// Output:
// T-minus: 3
// T-minus: 2
// T-minus: 1
// Go!
```

---

### 2. The Execution Call Stack and Activation Records

JavaScript executes code synchronously on a single thread. When a function is called, the V8 engine pushes an **activation record** (stack frame) onto the Call Stack.

Each stack frame encapsulates:
- The function arguments and parameters.
- Local variables and scoped identifiers.
- The return address pointer (where execution resumes after return).

Consider `factorial(3)`:
$$\text{factorial}(n) = n \times \text{factorial}(n - 1), \quad \text{where } \text{factorial}(1) = 1$$

```javascript
// Node.js code
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

console.log(factorial(3)); // 6
```

#### Execution Lifecycle: Stack Buildup and Unwinding

| Step | Call Stack State | Action / Evaluation | Phase |
|---|---|---|---|
| 1 | `[factorial(3)]` | Calls `factorial(2)` (Suspends frame 3) | Buildup |
| 2 | `[factorial(3), factorial(2)]` | Calls `factorial(1)` (Suspends frame 2) | Buildup |
| 3 | `[factorial(3), factorial(2), factorial(1)]` | Hits base case: returns `1` | Base Case |
| 4 | `[factorial(3), factorial(2)]` | Evaluates $2 \times 1 = 2$; returns `2` | Unwinding |
| 5 | `[factorial(3)]` | Evaluates $3 \times 2 = 6$; returns `6` | Unwinding |
| 6 | `[]` | Result `6` received by caller | Complete |

The auxiliary space complexity of recursion is strictly governed by the **maximum stack depth** attained during execution, not the total number of calls executed.

---

### 3. Stack Depth Limits and V8 `RangeError`

The V8 engine reserves a fixed call stack size of approximately 1 MB per isolate. On typical 64-bit systems, each frame consumes between 96 and 128 bytes, allowing approximately **10,000 to 10,400 concurrent frames**.

```javascript
// Node.js code
function measureMaxStackDepth(depth = 1) {
  try {
    return measureMaxStackDepth(depth + 1);
  } catch (err) {
    return depth;
  }
}

console.log("Max V8 Call Stack Depth:", measureMaxStackDepth());
// Typically prints ~10,400 to 10,500 depending on V8 version and flag configuration
```

If recursion exceeds this allocation, V8 terminates execution with:
`RangeError: Maximum call stack size exceeded`

> [!WARNING]
> Never use recursion for linear traversals over large arrays or unbounded streams. Processing a list of 20,000 items recursively crashes the Node.js process unless an iterative loop is used.

---

### 4. Branching Recursion vs Memoization ($O(2^n) \to O(n)$)

When a recursive function branches by invoking itself multiple times per frame, the total operations grow exponentially if subproblems overlap.

The classic naive Fibonacci sequence:
$$F(n) = F(n-1) + F(n-2)$$

```
                                fib(5)
                              /        \
                        fib(4)          fib(3)
                       /      \         /      \
                   fib(3)    fib(2)   fib(2)   fib(1)
                   /    \
               fib(2)  fib(1)
```

Notice that `fib(3)` is computed twice, and `fib(2)` is computed three times. The total number of calls scales as $O(2^n)$. Calculating `fib(50)` requires over $1.12 \times 10^{15}$ operations.

#### The Top-Down Memoization Solution
Memoization intercepts recursive calls and stores previously calculated values inside a hash map or array cache, reducing time complexity from $O(2^n)$ to $O(n)$.

```javascript
// Node.js code
// ❌ ANTI-PATTERN: Naive branching recursion (O(2^n) time)
function fibNaive(n) {
  if (n <= 1) return n;
  return fibNaive(n - 1) + fibNaive(n - 2);
}

// ✅ PATTERN: Memoized top-down recursion (O(n) time, O(n) space)
function fibMemo(n, memo = new Map()) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);

  const result = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  memo.set(n, result);
  return result;
}

console.time("fibMemo(45)");
console.log("Result:", fibMemo(45)); // 1134903170
console.timeEnd("fibMemo(45)"); // ~1ms
```

---

### 5. Logarithmic Recursion: Divide and Conquer (`myPow`)

Not all recursion is linear ($O(n)$) or exponential ($O(2^n)$). When a recursive function divides the problem size in half on each step, the recursion depth is bounded by $O(\log n)$.

```javascript
// Node.js code
// Calculates x^n in O(log n) time using binary exponentiation
function myPow(x, n) {
  if (n === 0) return 1;
  if (n < 0) return 1 / myPow(x, -n); // Handle negative powers

  // Divide problem in half
  const half = myPow(x, Math.floor(n / 2));

  // If n is even: x^n = (x^(n/2))^2
  // If n is odd:  x^n = (x^(n/2))^2 * x
  return n % 2 === 0 ? half * half : half * half * x;
}

console.log(myPow(2, 10)); // 1024
console.log(myPow(2, -3)); // 0.125
```
- **Time Complexity:** $O(\log n)$ — input exponent is halved on each step.
- **Auxiliary Space:** $O(\log n)$ stack frames. For $n = 1,000,000$, call stack depth is only $\approx 20$ frames.

---

### 6. Converting Recursion to Heap-Allocated Iteration

When recursion depth threatens to exceed 10,000 frames (e.g., deep tree traversals, graph searches, or compiler parsing), developers must convert the recursion into an iterative `while` loop utilizing an explicit array stack stored on the **heap**.

Heap memory in Node.js defaults to 1.5–4 GB, comfortably supporting millions of stored elements.

```javascript
// Node.js code
// Simulated tree structure
const root = {
  val: "root",
  left: { val: "left-child", left: null, right: null },
  right: { val: "right-child", left: null, right: null },
};

// ❌ Vulnerable to stack overflow on skewed trees with depth > 10,000
function traverseRecursive(node) {
  if (!node) return;
  console.log(node.val);
  traverseRecursive(node.left);
  traverseRecursive(node.right);
}

// ✅ Immune to stack overflow: uses heap memory
function traverseIterative(root) {
  if (!root) return;

  const stack = [root]; // Heap-allocated array

  while (stack.length > 0) {
    const node = stack.pop();
    console.log(node.val);

    // Push right first so that left is popped and processed first (LIFO)
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }
}

traverseIterative(root);
```

---

## Tricky Points and Edge Cases

### 1. The Post-Decrement Trap (`n--` vs `n - 1`)
Passing `n--` into a recursive call passes the *current value* of `n` to the next function invocation before decrementing local `n`. The next frame receives the exact same number, creating an immediate infinite loop.

```javascript
// Node.js code
function brokenCountdown(n) {
  if (n <= 0) return;
  // ❌ BROKEN: passes current n, never reaches 0
  // brokenCountdown(n--); 

  // ✅ CORRECT: evaluates n - 1 directly
  brokenCountdown(n - 1);
}
```

### 2. Execution Order: Pre-Order vs Post-Order
Statements executed *before* the recursive invocation run during the downward stack buildup. Statements placed *after* the recursive call run in reverse order during stack unwinding.

```javascript
// Node.js code
function printUpDown(n) {
  if (n <= 0) return;
  console.log("Down:", n); // Downward phase
  printUpDown(n - 1);
  console.log("Up:", n);   // Unwinding phase
}

printUpDown(3);
// Output:
// Down: 3
// Down: 2
// Down: 1
// Up: 1
// Up: 2
// Up: 3
```

### 3. V8 Tail Call Optimization Reality
While ES2015 formally specified Proper Tail Calls (PTC), **V8 (and therefore Node.js) disabled PTC support** due to debugging complexities and stack trace erasure. Tail-recursive code in Node.js still consumes stack frames linearly.

---

## Hands-On Exercise

### Scenario
A Node.js backend receives nested filesystem metadata objects from external clients. You must recursively calculate the total byte size of all files across the nested tree.

If a corrupted or malicious payload contains cyclic references or exceeds a safe nesting depth, the service must safely abort without throwing an unhandled `RangeError`.

### Buggy Code
```javascript
// Node.js code
function calculateTotalSizeBuggy(node) {
  // ❌ Bug 1: No base case check for null/undefined!
  // ❌ Bug 2: No cycle detection; circular objects trigger RangeError crash!
  // ❌ Bug 3: No depth limit; deep nesting freezes the event loop!
  let total = node.size || 0;
  if (node.children) {
    for (const child of node.children) {
      total += calculateTotalSizeBuggy(child);
    }
  }
  return total;
}
```

### Acceptance Criteria
1. Gracefully calculate total `size` across all valid descendant nodes.
2. Defend against circular references using a `Set` tracking visited references.
3. Enforce a `maxDepth` limit (default 100) and throw a descriptive business error instead of crashing the V8 call stack.
4. Pass validation tests for empty nodes, deep nesting, and circular structures.

### Solution Code

```javascript
// Node.js code
import assert from "node:assert/strict";

function calculateTotalSize(node, maxDepth = 100, currentDepth = 0, visited = new Set()) {
  if (!node || typeof node !== "object") {
    return 0;
  }

  // Guard 1: Enforce maximum call stack depth boundary
  if (currentDepth > maxDepth) {
    throw new Error(`Maximum traversal depth of ${maxDepth} exceeded`);
  }

  // Guard 2: Detect circular references
  if (visited.has(node)) {
    throw new Error("Circular reference detected in filesystem tree");
  }
  visited.add(node);

  let totalBytes = typeof node.size === "number" ? node.size : 0;

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      totalBytes += calculateTotalSize(child, maxDepth, currentDepth + 1, visited);
    }
  }

  return totalBytes;
}

// Verification Tests
const validTree = {
  name: "root",
  size: 100,
  children: [
    { name: "file1.txt", size: 250, children: [] },
    {
      name: "subdir",
      size: 50,
      children: [
        { name: "image.png", size: 1000, children: [] }
      ]
    }
  ]
};

assert.equal(calculateTotalSize(validTree), 1400);

// Test circular detection
const circularNode = { name: "cycle", size: 10, children: [] };
circularNode.children.push(circularNode);

assert.throws(
  () => calculateTotalSize(circularNode),
  /Circular reference detected/
);

// Test depth limit enforcement
let deepTree = { name: "leaf", size: 5, children: [] };
for (let i = 0; i < 150; i++) {
  deepTree = { name: `dir_${i}`, size: 1, children: [deepTree] };
}

assert.throws(
  () => calculateTotalSize(deepTree, 50),
  /Maximum traversal depth of 50 exceeded/
);

console.log("✅ All recursive traversal security tests passed successfully!");
```

### Solution Explanation

1. **Cycle Tracking via `visited` Set:** Non-primitive object references are recorded in a `Set`. If an already visited node reference is encountered, execution immediately halts, preventing infinite loops.
2. **Depth Counter Invariant:** `currentDepth` tracks stack frame accumulation. Bounding recursion depth ensures that user-controlled payloads cannot exhaust the physical 10,000-frame V8 limit.

---

## Summary

- Every recursive function requires a terminating **base case** and a **recursive step** that moves strictly toward that base case.
- Each call creates an **activation record** on the call stack containing parameters, local variables, and return addresses.
- V8 limits the call stack to roughly **10,000 frames** (~1 MB). Exceeding this boundary throws a fatal `RangeError: Maximum call stack size exceeded`.
- Branching recursive algorithms (such as naive Fibonacci) suffer from $O(2^n)$ repeated work; **memoization** eliminates redundancy, reducing runtime to $O(n)$.
- When problem inputs can exceed stack limits, rewrite recursive logic into a `while` loop using an **explicit array stack on the heap**.

---

## Cheat Sheet

### Complexity Comparison
| Recursive Pattern | Example | Time Complexity | Auxiliary Stack Space |
|---|---|---|---|
| Linear Recursion | Countdown, Factorial | $O(n)$ | $O(n)$ |
| Divide & Conquer | Binary Search, `myPow` | $O(\log n)$ | $O(\log n)$ |
| Branching Tree (Unmemoized) | Naive Fibonacci | $O(2^n)$ | $O(n)$ (tree height) |
| Branching Tree (Memoized) | Memoized Fibonacci | $O(n)$ | $O(n)$ |
| Explicit Heap Stack | Iterative Tree DFS | Problem-dependent | $O(1)$ stack, $O(n)$ heap |

### Common Pitfalls
- **Post-decrement `n--`:** Re-invokes the function with the original unchanged value, causing stack overflow.
- **Missing Non-Positive Guard:** Testing strictly `if (n === 0)` fails when negative inputs bypass the base case.
- **Relying on TCO in Node.js:** Assuming tail recursion runs in $O(1)$ space; V8 does not optimize tail calls.
- **Unbounded Deep Traversal:** Processing deeply nested untrusted JSON recursively in Node.js API handlers, leading to process crashes.

---

## Interview Questions

### 1. What happens in memory when a function calls itself recursively, and why does a `while` loop avoid call stack exhaustion?

**Question:** Compare call stack memory consumption during recursion against iterative execution within a `while` loop.

**Answer:** When a function calls itself recursively, the JavaScript runtime cannot release the caller's memory because the caller must wait for the callee's return value to complete its own evaluation. Consequently, the V8 engine allocates an **activation record (stack frame)** on the call stack for each nested call. This frame preserves local variables, parameters, and the return instruction pointer. Because the V8 call stack is bounded to approximately 1 MB, nesting deeper than ~10,000 frames exhausts the allocated memory and triggers a `RangeError: Maximum call stack size exceeded`.

In contrast, a `while` loop executes within a **single stack frame**. On each iteration, variables within the existing frame are reassigned or mutated in place. No new activation records are pushed onto the call stack. Therefore, an iterative loop maintaining state uses **$O(1)$ stack space** regardless of whether it performs 10 or 10,000,000 iterations.

---

### 2. What does this code output, and why do the console statements print in opposite orders?

**Question:** Explain the execution order and output of the following recursive function:
```javascript
function traceStack(n) {
  if (n <= 0) return;
  console.log("Down:", n);
  traceStack(n - 1);
  console.log("Up:", n);
}
traceStack(3);
```

**Answer:**
The function outputs:
```
Down: 3
Down: 2
Down: 1
Up: 1
Up: 2
Up: 3
```
**Explanation:** 
Execution proceeds in two distinct phases:
1. **The Downward (Buildup) Phase:** As each function call is invoked, `console.log("Down:", n)` executes immediately *before* the recursive call. When `traceStack(3)` runs, it prints `Down: 3` and pushes `traceStack(2)` onto the stack. This continues until `traceStack(0)` matches the base case `n <= 0` and returns without logging.
2. **The Upward (Unwinding) Phase:** Once the base case returns, suspended stack frames resume execution starting from the line immediately following `traceStack(n - 1)`. The most recently suspended frame (`traceStack(1)`) resumes first, executing `console.log("Up:", 1)` and popping off the stack. Then `traceStack(2)` resumes and logs `Up: 2`, followed finally by `traceStack(3)` logging `Up: 3`. This illustrates the Last-In, First-Out (LIFO) nature of the call stack.

---

### 3. How does binary exponentiation reduce the complexity of calculating $x^n$ from $O(n)$ to $O(\log n)$, and what is its call stack space requirement?

**Question:** Implement and explain the time and space complexity of computing $x^n$ recursively using divide-and-conquer exponentiation.

**Answer:** Naively multiplying $x$ by itself $n$ times requires $O(n)$ multiplications and $O(n)$ stack frames. Binary exponentiation exploits mathematical exponent division:
- If $n$ is even: $x^n = \left(x^{n/2}\right)^2$
- If $n$ is odd: $x^n = \left(x^{n/2}\right)^2 \times x$

```javascript
// Node.js code
function myPow(x, n) {
  if (n === 0) return 1;
  if (n < 0) return 1 / myPow(x, -n);

  const half = myPow(x, Math.floor(n / 2));
  return n % 2 === 0 ? half * half : half * half * x;
}
```
**Complexity Analysis:**
- **Time Complexity:** Because $n$ is halved on every recursive call ($\lfloor n/2 \rfloor$), the maximum number of recursive invocations is $\lfloor \log_2 n \rfloor + 1$. Thus, time complexity is $O(\log n)$. For $n = 1,000,000$, it takes only $\approx 20$ operations instead of 1,000,000.
- **Auxiliary Space:** The call stack height equals the recursion tree height, which is strictly $O(\log n)$ frames. Computing $2^{1000000}$ requires only 20 stack frames, completely eliminating any risk of stack overflow.

---

### 4. How can recursive parsing of user-supplied JSON or nested document trees lead to Denial-of-Service in a Node.js microservice, and how do you mitigate it?

**Question:** An API endpoint uses a recursive function to validate nested permission hierarchies in client JSON payloads. How can an attacker exploit this to crash the server, and what are the three architectural lines of defense?

**Answer:** In Node.js, uncaught exceptions crash the single-threaded event loop and terminate the operating process. If an attacker submits a maliciously crafted JSON payload nested 15,000 levels deep (`{"a": {"a": {"a": ...}}}`), a naive recursive validator pushes 15,000 stack frames onto the V8 call stack. This triggers an unhandled `RangeError: Maximum call stack size exceeded`. Because Node.js cannot catch stack overflows that exhaust process stack limits gracefully, the worker dies, causing a service outage.

**Architectural Defenses:**
1. **Depth Guards & Invariant Limits:** Pass an explicit `depth` counter through the recursive traversal. If `depth > MAX_SAFE_DEPTH` (e.g., 20 levels), abort immediately with a 400 Bad Request error.
2. **Payload Size Restrictions:** Configure HTTP body parsers (e.g., Express `express.json({ limit: "64kb" })`) to reject oversized request payloads before validation begins.
3. **Iterative Stack on the Heap:** Convert recursive parsing logic into an iterative `while` loop utilizing an explicit array on the heap. Heap allocations scale up to gigabytes, neutralizing call stack exhaustion.

---

<nav aria-label="Lecture navigation">

[Previous: Strings and Text Patterns](day-03-strings-and-text-patterns.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Sorting and Searching Basics](day-05-sorting-and-searching-basics.md)

</nav>
