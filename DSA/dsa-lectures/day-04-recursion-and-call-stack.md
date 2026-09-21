# Day 04: Recursion and Call Stack

<nav aria-label="Lecture navigation">

[← Day 03: Strings and Text Patterns](day-03-strings-and-text-patterns.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Day 05: Sorting and Searching Basics →](day-05-sorting-and-searching-basics.md)

</nav>

---

## What You Will Learn Today

- What recursion is and the two parts every recursive function must have.
- How JavaScript manages function calls using the **call stack**.
- Why deep recursion crashes and what the crash message means.
- How to spot repeated work in a recursive function and fix it with **memoization**.
- How to convert a recursive solution into an iterative one when the stack is too small.

---

## Prerequisites

- [DSA Day 01 – Big O and Problem Solving](day-01-big-o-and-problem-solving.md)
- **JavaScript functions:** [JS Day 06 – Functions, Parameters, and Callbacks](../../Javascript/javascript-lectures/day-06-functions-parameters-and-callbacks.md)

---

## Quick Vocabulary

| Word | Plain meaning |
| :--- | :--- |
| **Recursion** | A function that solves a problem by calling itself with a smaller version of the same problem. |
| **Base case** | The condition that stops the recursion and returns a direct answer without another call. |
| **Recursive step** | The part of the function that calls itself with a smaller input, getting closer to the base case. |
| **Call stack** | The place in memory where JavaScript keeps track of all function calls currently in progress. Each call gets its own slot (called a **frame**). |
| **Stack overflow** | What happens when the call stack fills up completely — too many nested calls at once. |
| **Memoization** | Storing the result of a function call so you do not have to compute it again if the same input appears later. |

---

## 1. What Is Recursion?

A recursive function solves a problem by breaking it into a smaller version of itself and calling itself with that smaller version. It keeps doing this until it hits the **base case** — the smallest problem that can be answered directly.

Think of it like opening a box that contains a smaller box, which contains a smaller box, and so on, until you find an empty box (the base case).

```js
// JavaScript
function countdown(n) {
  if (n === 0) {         // base case — stop here
    console.log("Go!");
    return;
  }
  console.log(n);
  countdown(n - 1);      // recursive step — smaller problem
}

countdown(3);
// Prints: 3, 2, 1, Go!
```

**Two required parts:**
1. **Base case** — `if (n === 0)` — what to do when there is nothing left to divide.
2. **Recursive step** — `countdown(n - 1)` — call with a smaller input, moving toward the base case.

If you forget the base case, the function calls itself forever until the program crashes.

---

## 2. How the Call Stack Works

Every time a function is called, JavaScript adds a **frame** to the call stack. That frame holds the function's parameters and local variables. When the function returns, its frame is removed (popped off).

For `countdown(3)`:

```
BUILDING UP (each call adds a frame):
  countdown(3) → calls countdown(2)
    countdown(2) → calls countdown(1)
      countdown(1) → calls countdown(0)
        countdown(0) → base case! returns.

UNWINDING (each return removes a frame):
        countdown(0) removed
      countdown(1) removed
    countdown(2) removed
  countdown(3) removed
```

The stack grows during calls and shrinks during returns. This is why the `console.log` *before* the recursive call prints on the way **down**, and anything *after* the recursive call runs on the way **back up**.

---

## 3. Why Deep Recursion Crashes

The call stack in Node.js (V8 engine) has a fixed size — around 1 MB. This gives room for roughly **10 000 active frames** at the same time.

If your recursion goes deeper than that, V8 throws:
```
RangeError: Maximum call stack size exceeded
```

This is called a **stack overflow**.

> [!WARNING]
> Never use recursion for a simple linear scan over large data. An array with 15 000 items will crash a recursive scanner. Use a `for` or `while` loop for linear work.

A `while` loop does not grow the call stack — it reuses the same frame for every iteration.

---

## 4. Recursion That Branches — and the Problem of Repeated Work

Some problems call the function **twice** in the recursive step. Each call calls itself twice, which calls itself twice… the number of calls doubles at every level.

Classic example — naive Fibonacci (the nth Fibonacci number):

```js
function fib(n) {
  if (n <= 1) return n;          // base case: fib(0)=0, fib(1)=1
  return fib(n - 1) + fib(n - 2); // calls itself TWICE
}
```

The call tree for `fib(5)`:
```
                 fib(5)
                /      \
           fib(4)       fib(3)
          /     \       /    \
       fib(3) fib(2) fib(2) fib(1)
       ...
```

`fib(3)` is calculated twice, `fib(2)` is calculated three times. Total calls: roughly 2^n. For `fib(50)` that is over 1 trillion calls — it never finishes in practice.

### Fix — Memoization

Store each result the first time you compute it. If you see the same input again, return the stored answer immediately.

```js
// JavaScript (Node.js / browser)
function fib(n, memo = new Map()) {
  if (n <= 1) return n;

  if (memo.has(n)) return memo.get(n); // already computed — return instantly

  const result = fib(n - 1, memo) + fib(n - 2, memo);
  memo.set(n, result);                 // save for future calls
  return result;
}

console.log(fib(50)); // 12586269025 — instant
```

**Complexity:** O(n) time — each value from 0 to n is computed exactly once. O(n) space for the memo Map and the call stack.

---

## Worked Examples

### Example 1 — Factorial

Factorial of n (written n!) = n × (n−1) × … × 1. Factorial of 0 is 1.

```js
// JavaScript
function factorial(n) {
  if (n <= 1) return 1;          // base case
  return n * factorial(n - 1);   // recursive step
}
```

**Trace for `factorial(4)`:**

| Call | Returns |
| :--- | :--- |
| `factorial(4)` | waits for `factorial(3)` |
| `factorial(3)` | waits for `factorial(2)` |
| `factorial(2)` | waits for `factorial(1)` |
| `factorial(1)` | **1** (base case) |
| `factorial(2)` | 2 × 1 = **2** |
| `factorial(3)` | 3 × 2 = **6** |
| `factorial(4)` | 4 × 6 = **24** |

**Complexity:** O(n) time, O(n) space (n frames on the call stack at peak depth).

---

### Example 2 — Converting Recursion to an Iterative Stack

When recursion could cause a stack overflow, simulate the call stack yourself using an array stored on the **heap** (regular program memory, not the limited call stack).

Tree traversal without recursion:

```js
// JavaScript
function traverseTree(root) {
  if (!root) return;

  const stack = [root]; // this array lives on the heap — no limit issues

  while (stack.length > 0) {
    const node = stack.pop();
    console.log(node.value);

    // Push children — right first so left is processed first (LIFO order)
    if (node.right) stack.push(node.right);
    if (node.left)  stack.push(node.left);
  }
}
```

A tree with 1 million nodes would crash recursive traversal but works fine here because the array grows on the heap, not on the call stack.

---

## Common Mistakes

### 1. Post-decrement (`n--`) in the recursive call

```js
// BUG — infinite recursion
function count(n) {
  if (n === 0) return;
  count(n--); // n-- passes the CURRENT value first, THEN decrements
              // so count always receives the same n — base case never reached
}

// FIX
function count(n) {
  if (n === 0) return;
  count(n - 1); // passes n minus 1, without changing n itself
}
```

### 2. Base case that misses negative inputs

```js
// BUG — count(-1) skips the base case and recurses forever
if (n === 0) return;

// FIX — use <= 0 to catch any non-positive input
if (n <= 0) return;
```

### 3. Expecting tail call optimisation in Node.js

Some languages can turn a tail-recursive call (where the recursive call is the very last thing the function does) into a loop under the hood, saving stack space. The JavaScript spec allows this, but **V8 (Node.js) does not implement it**. Do not rely on it — the stack still grows.

---

## Tricky Points

- **Where the code runs matters:** Code *before* the recursive call runs on the way **down** (as calls are made). Code *after* the recursive call runs on the way **back up** (as calls return). This is how you print 1, 2, 3 going down and 3, 2, 1 coming up from the same function.
- **Memoization vs Tabulation:** Memoization is top-down (start from n, cache results as you go). Tabulation (covered in the DP lectures) is bottom-up (start from the smallest subproblem and build up). Both give O(n) for Fibonacci.

---

## Practical Exercise

Write `sumArray(arr, index = 0)` that adds up all numbers in an array using recursion.

**Example:**
```
Input:  [1, 2, 3, 4]
Output: 10
```

**Requirements:**
- Base case: when `index` reaches the end of the array, return 0.
- Recursive step: return `arr[index] + sumArray(arr, index + 1)`.
- State the time complexity and the maximum call stack depth.

---

## Summary

- Every recursive function needs a **base case** (stop condition) and a **recursive step** (smaller input).
- Each function call adds a **frame** to the call stack; the stack limit in Node.js is roughly **10 000 frames**.
- Branching recursion (calling itself twice) can run in O(2^n) time — use **memoization** to reduce repeated work to O(n).
- When recursion risks a stack overflow, replace it with a `while` loop and a heap-allocated array as an explicit stack.

---

## Cheat Sheet

### Recursion Checklist
1. What is the base case?
2. Does every path through the recursive step move closer to the base case?
3. What is the maximum depth? That depth is also your O(?) space cost.
4. Are subproblems repeated? If yes, add memoization.

### Complexity Quick Reference
| Pattern | Time | Stack Space |
| :--- | :--- | :--- |
| One call per level (e.g. factorial) | O(n) | O(n) |
| Two calls per level, no memo (e.g. naive fib) | O(2^n) | O(n) |
| Two calls per level, with memo | O(n) | O(n) |

### Memoization Template
```js
function solve(n, memo = new Map()) {
  if (/* base case */) return /* base value */;
  if (memo.has(n)) return memo.get(n);

  const result = /* combine solve(n-1) and/or solve(n-2) */;
  memo.set(n, result);
  return result;
}
```

---

## Interview Questions

### 1. Concept Check

**Question:** What happens in memory when a function calls itself recursively? Why does a `while` loop not have the same problem?

**Expected answer:** Each recursive call adds a new frame to the call stack (a fixed-size memory region of ~1 MB). At roughly 10 000 frames it overflows, throwing `RangeError`. A `while` loop runs inside a single function frame — it reuses the same memory on every iteration, so it stays O(1) stack space no matter how many iterations.

---

### 2. Predict the Output

**Question:** What does this print and in what order?
```js
function printUpDown(n) {
  if (n <= 0) return;
  console.log("Down:", n);
  printUpDown(n - 1);
  console.log("Up:", n);
}
printUpDown(3);
```

**Expected answer:**
```
Down: 3
Down: 2
Down: 1
Up: 1
Up: 2
Up: 3
```
Code before the recursive call runs on the way **down**; code after it runs on the way **back up** in reverse order.

---

### 3. Implement It

**Question:** Implement `myPow(x, n)` to calculate x to the power of n in O(log n) time.

**Expected answer:**
```js
function myPow(x, n) {
  if (n === 0) return 1;
  if (n < 0) return 1 / myPow(x, -n);      // handle negative exponent

  const half = myPow(x, Math.floor(n / 2)); // compute half the power

  if (n % 2 === 0) return half * half;       // even: x^n = (x^(n/2))^2
  return half * half * x;                    // odd:  x^n = (x^(n/2))^2 * x
}
// myPow(2, 10) → 1024
```

Each call halves n, so depth = log₂(n). Time: O(log n), Space: O(log n) call stack.

---

### 4. Debug a Bug

**Question:** Why does this crash with a `RangeError`?
```js
function count(n) {
  if (n === 0) return;
  count(n--);
}
count(5);
```

**Expected answer:** `n--` is post-decrement. It evaluates to the current value of `n` (5), passes that to the recursive call, and *then* decrements `n`. But `n` is a local copy — the next frame receives 5, not 4. The base case is never reached. Fix: `count(n - 1)`.

---

### 5. When to Use Recursion vs Iteration

**Question:** In what situations is recursion a better fit than a loop?

**Expected answer:** Recursion is naturally cleaner when the problem has a **branching or hierarchical structure** — tree traversal, graph DFS, divide-and-conquer (merge sort, binary search), generating permutations, parsing nested structures (JSON, HTML). Iteration is better for **flat linear work** where input could be large (> ~10 000 items), to avoid stack overflow risk.

---

### 6. Senior Follow-up — Node.js Security

**Question:** An API endpoint uses a recursive validator to check user-submitted JSON. An attacker sends an object nested 20 000 levels deep. What happens and how do you protect the service?

**Expected answer:** The 20 000 levels exhaust the call stack, throwing `RangeError: Maximum call stack size exceeded`. In Node.js, an uncaught exception in a request handler crashes the worker process — this is a Denial of Service attack.

Fixes:
1. Add a `depth` counter parameter and reject (return an error) once depth exceeds a safe limit (e.g. 20).
2. Configure a body size limit in your HTTP middleware (e.g. `express.json({ limit: "10kb" })`).
3. Rewrite the validator iteratively using an explicit stack on the heap.

---

<nav aria-label="Lecture navigation">

[← Day 03: Strings and Text Patterns](day-03-strings-and-text-patterns.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Day 05: Sorting and Searching Basics →](day-05-sorting-and-searching-basics.md)

</nav>
