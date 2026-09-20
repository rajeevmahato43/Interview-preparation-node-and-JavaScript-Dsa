# Day 04: Recursion and Call Stack

<nav aria-label="Lecture navigation">

[Previous: Strings and Text Patterns](day-03-strings-and-text-patterns.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Sorting and Searching Basics](day-05-sorting-and-searching-basics.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain what recursion is and break it down into base cases and recursive steps.
- Trace how function calls push and pop frames on the JavaScript **call stack**.
- Understand why deep recursion crashes with `RangeError: Maximum call stack size exceeded`.
- Calculate time complexity from recursion trees and space complexity from stack depth.
- Use memoization to speed up slow recursive functions.
- Convert recursive logic to an iterative loop with an explicit stack array.

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md)
- Understanding how JavaScript functions receive arguments and return values.

---

## Core Concepts

### 1. What Recursion Is

A recursive function is simply a function that **calls itself with a smaller input**.

Every recursive function needs two parts:

```text
Recursion Anatomy:
1. Base Case: The condition that stops recursion and returns directly.
2. Recursive Step: Calls the function with a smaller problem, moving closer to the base case.
```

If the base case is missing or unreachable, the function calls itself forever until it crashes.

### 2. The Call Stack in Action

When a function is called, JavaScript adds a frame to the **call stack**. The frame holds its parameters and local variables.

```js
function countdown(n) {
  if (n === 0) {
    console.log("Blastoff!");
    return;
  }
  console.log(n);
  countdown(n - 1);
}
countdown(3);
```

#### How the Call Stack Moves:
```text
WINDING PHASE (Going down):
countdown(3) calls countdown(2)
  countdown(2) calls countdown(1)
    countdown(1) calls countdown(0) [BASE CASE REACHED!]

UNWINDING PHASE (Returning up):
countdown(0) returns -> popped from stack
countdown(1) finishes -> popped from stack
countdown(2) finishes -> popped from stack
countdown(3) finishes -> popped from stack
```

---

### 3. The Call Stack Limit in Node.js

The call stack in Node.js and V8 is stored in a small memory region (about $1 \text{ MB}$).
- It can hold approximately **10,000 active function frames**.
- If a recursive function exceeds this depth, V8 throws:
  `RangeError: Maximum call stack size exceeded`

> [!WARNING]
> Do not use recursion for simple linear scans over large datasets in Node.js backend services. A dataset with 20,000 items will crash your server with a stack overflow error. Use a simple `for` or `while` loop instead.

---

## Detailed Explanations

### Recursion Trees: Branching and Repeated Work

When a function calls itself **twice**, like naive Fibonacci:
```js
function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}
```

It creates a **branching tree**:
```text
                fib(4)
               /      \
           fib(3)      fib(2)
          /     \      /     \
       fib(2)  fib(1) fib(1) fib(0)
       /    \
    fib(1) fib(0)
```
- Total function calls double at each level: $O(2^n)$ Time (explodes very quickly!).
- Notice that `fib(2)` is calculated multiple times.
- **Memoization**: By saving the result of `fib(k)` in a `Map` or array, we never re-calculate the same subproblem, reducing time to $O(n)$!

---

## Examples and Traces

### Example 1: Factorial ($O(n)$ Time, $O(n)$ Stack Space)

```js
function factorial(n) {
  // Base case: factorial of 0 or 1 is 1
  if (n <= 1) return 1;

  // Recursive step: n * factorial(n - 1)
  return n * factorial(n - 1);
}
```

#### Trace for `factorial(3)`:
- `factorial(3)` calls `3 * factorial(2)`
- `factorial(2)` calls `2 * factorial(1)`
- `factorial(1)` returns `1`
- `factorial(2)` returns `2 * 1 = 2`
- `factorial(3)` returns `3 * 2 = 6`
- **Complexity**: $O(n)$ time, $O(n)$ space on the call stack.

---

### Example 2: Climbing Stairs with Memoization

#### Problem:
You are climbing a staircase with $n$ steps. You can take either 1 or 2 steps each time. How many distinct ways can you reach the top?

#### Solution ($O(n)$ Time with Memoization):
```js
function climbStairs(n, memo = new Map()) {
  if (n <= 1) return 1;

  // Check if already computed
  if (memo.has(n)) return memo.get(n);

  const ways = climbStairs(n - 1, memo) + climbStairs(n - 2, memo);
  memo.set(n, ways);

  return ways;
}
```
- **Complexity**: $O(n)$ time (each step is computed once), $O(n)$ space for stack and memo map.

---

## Common Mistakes and Interview Traps

1. **The Post-Decrement Trap (`n--`)**: Writing `recurse(n--)` passes the *original* value of $n$, then decrements after the call. This causes infinite recursion! Always write `recurse(n - 1)`.
2. **Missing Base Case for Negatives**: Writing `if (n === 0)` fails if someone calls `func(-1)`. Use inequality guards like `if (n <= 0)`.
3. **Assuming Tail Call Optimization Works**: While ECMAScript specifies tail call optimization, Node.js and V8 disabled it in production. Tail recursive functions still consume call stack frames in JavaScript.

---

## Tricky Points

- **Converting Recursion to an Iterative Stack**: If recursion risks stack overflow, simulate the call stack manually using an array on the heap:
```js
function traverseIterative(root) {
  if (!root) return;
  const stack = [root]; // Heap-allocated array (no stack overflow!)
  while (stack.length > 0) {
    const node = stack.pop();
    console.log(node.val);
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }
}
```

---

## Practical Exercise

Write a recursive function `sumArray(arr, index = 0)` that sums all numbers in an array. State its base case, time complexity, and call stack space complexity.

---

## Summary

- Every recursive function needs a **base case** to stop and a **recursive step** that shrinks the problem.
- Function calls push frames onto the **call stack**; returns pop them off.
- The V8 call stack limit is approximately **10,000 frames** before throwing a `RangeError`.
- Multi-branch recursion (like naive Fibonacci) runs in $O(2^n)$ time; use **memoization** to reduce it to $O(n)$.
- To avoid stack overflow on deep trees, use an **iterative while loop** with an array stack on the heap.

---

## Cheat Sheet

### Recursion Checklist
1. What is the base case? (Stop condition)
2. Does each step move strictly closer to the base case?
3. What is the maximum depth? (Call stack memory: $O(\text{depth})$)
4. Are subproblems repeated? (If yes, add memoization)

### Complexity Rules
- Linear recursion (one call per level): $O(n)$ time, $O(n)$ stack space.
- Binary recursion (two calls per level): $O(2^n)$ time, $O(n)$ stack space (without memoization).

---

## Interview Questions

### 1. Deep Definitions and Mental Models

**Question:** What happens to computer memory during recursion? Why does deep recursion crash while a simple `while` loop does not?
- **Expected answer shape:** Each recursive call adds a new stack frame (containing arguments, local variables, return address) to the call stack. The call stack has a small fixed memory limit (~1 MB). Deep recursion exhausts this buffer, throwing `RangeError`. A `while` loop reuses the same stack frame and variables across iterations, using $O(1)$ stack memory.

### 2. Predict the Output and Trace Execution

**Question:** What does this function log, and in what order?
```js
function printUpDown(n) {
  if (n <= 0) return;
  console.log("Down:", n);
  printUpDown(n - 1);
  console.log("Up:", n);
}
printUpDown(2);
```
- **Expected answer shape:**
```text
Down: 2
Down: 1
Up: 1
Up: 2
```
Statements before the recursive call run on the way down (winding); statements after run on the way back up (unwinding) in reverse order.

### 3. Implementation Exercise

**Question:** Implement `myPow(x, n)` to calculate $x^n$ in $O(\log n)$ time using recursion.
- **Expected answer shape:**
```js
function myPow(x, n) {
  if (n === 0) return 1;
  if (n < 0) return 1 / myPow(x, -n);
  const half = myPow(x, Math.floor(n / 2));
  return n % 2 === 0 ? half * half : half * half * x;
}
```

### 4. Debugging and Failure Analysis

**Question:** Why does this recursive function cause a maximum call stack error?
```js
function count(n) {
  if (n === 0) return;
  count(n--);
}
count(5);
```
- **Expected answer shape:** The post-decrement `n--` passes the current value of `n` (`5`) to the function before decrementing. The function repeatedly receives `5` forever, never reaching the base case. Fix by passing `n - 1`.

### 5. Design and Tradeoff Questions

**Question:** When is recursion cleaner than iteration, and when should iteration be preferred?
- **Expected answer shape:** Recursion is cleaner for hierarchical or branching problems like tree traversals, graphs, divide-and-conquer, and nested JSON. Iteration is preferred for linear scans, simple loops, or when input depth might exceed 10,000 items to guarantee stack safety.

### 6. Senior Follow-ups: Node.js Security

**Question:** An API endpoint parses nested user JSON with a recursive validator. An attacker sends an object nested 15,000 levels deep (`{"a": {"a": ...}}`). What happens, and how do you protect the service?
- **Expected answer shape:** The deep payload causes a `RangeError: Maximum call stack size exceeded`. In Node.js, an uncaught exception crashes the process, causing a Denial of Service. Protect by: (1) passing a `maxDepth` counter that aborts early (e.g. at 20 levels), (2) configuring request body limits in middleware, or (3) refactoring the parser to use an iterative stack on the heap.

<nav aria-label="Lecture navigation">

[Previous: Strings and Text Patterns](day-03-strings-and-text-patterns.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Sorting and Searching Basics](day-05-sorting-and-searching-basics.md)

</nav>
