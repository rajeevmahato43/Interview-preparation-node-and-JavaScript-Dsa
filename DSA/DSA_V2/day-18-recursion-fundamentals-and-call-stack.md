# Day 18: Recursion & Call Stack

<nav aria-label="Lecture navigation">

[Previous: Binary Search on Solution Space](day-17-binary-search-on-solution-space.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Merge Sort & Quick Sort](day-19-merge-sort-and-quick-sort.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Auxiliary space & call stack frames.
- [Day 13: Stacks & Expression Parsing](day-13-stacks-and-expression-parsing.md) — LIFO stack mechanics.

---

## 1. What is Recursion?

**Recursion** is when a function calls itself to solve a smaller piece of the same problem.

Every recursive function must have two parts:
1. **The Base Case**: The stopping condition. Without this, the function calls itself forever until it crashes.
2. **The Recursive Step**: Calling itself with a smaller input, moving closer to the base case.

```javascript
// Node.js code
function countdown(n) {
  // 1. Base case
  if (n <= 0) {
    console.log("Blast off!");
    return;
  }

  // 2. Recursive step (n - 1 is closer to base case)
  console.log(n);
  countdown(n - 1);
}

countdown(3); // Prints 3, 2, 1, Blast off!
```

---

## 2. How the Call Stack Works (Winding & Unwinding)

Whenever a function is called, JavaScript puts a **Stack Frame** on the thread call stack.
- **Winding phase**: The function calls itself deeper and deeper, stacking frames up.
- **Base case hit**: The deepest call returns a value.
- **Unwinding phase**: Stack frames resolve and pop off in reverse order (LIFO).

```text
Tracing factorial(3):
[ fact(1) = 1       ]  ──► Hit Base Case! Pops off, returns 1.
[ fact(2) = 2 * 1   ]  ──► Pops off, returns 2.
[ fact(3) = 3 * 2   ]  ──► Pops off, returns 6.
```

### The Stack Overflow Limit
In V8 (Node.js), the call stack holds roughly **10,000 frames**. If recursion exceeds this, Node.js crashes with:
`RangeError: Maximum call stack size exceeded`

---

## 3. Problem 1: Fibonacci (Naive vs Memoized)

Compute the $n$-th Fibonacci number: $F(n) = F(n - 1) + F(n - 2)$.

### The Naive Way ($O(2^n)$ Slow)
```javascript
// ❌ Naive: Spawns duplicate branches -> O(2^n) exponential time
function fibNaive(n) {
  if (n <= 1) return n;
  return fibNaive(n - 1) + fibNaive(n - 2);
}
```

### The Memoized Way ($O(n)$ Fast)
Store computed answers in a cache so each number is calculated only once:
```javascript
// ✅ Memoized: Stores results -> O(n) time and O(n) space
function fib(n, memo = new Map()) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);

  const result = fib(n - 1, memo) + fib(n - 2, memo);
  memo.set(n, result);
  return result;
}

console.log(fib(10)); // 55
console.log(fib(50)); // 12586269025 (Finishes instantly!)
```
- **Time Complexity:** $O(n)$ — Each state from $0$ to $n$ computed once.
- **Extra Space:** $O(n)$ — Recursion call stack and memo map.

---

## 4. Problem 2: Reverse a String Recursively

```javascript
// Node.js code
function reverseString(str) {
  // Base case: empty or single char string
  if (str.length <= 1) return str;

  // Recursive step: reverse rest of string + first char at the end
  return reverseString(str.slice(1)) + str[0];
}

console.log(reverseString("hello")); // "olleh"
```
- **Time Complexity:** $O(n^2)$ due to string slicing. (Iterative two-pointer is preferred in production, but this demonstrates unwinding).

---

## 5. Tricky Points and Common Traps

1. **Missing or unreachable base case:** Triggers instant `RangeError: Maximum call stack size exceeded`. Always check the base case first.
2. **Auxiliary memory cost:** Recursion is **never $O(1)$ space**. Even if your function allocates zero variables, a recursion depth of $n$ takes $O(n)$ memory on the call stack.
3. **Tail Call Optimization (TCO):** Although part of the ES6 specification, TCO is **not supported** in V8/Node.js. Deep recursion must be rewritten iteratively with a loop.

---

## 6. Hands-On Exercises

Run this script in Node.js to test recursion and memoization:

```javascript
// Node.js code
const assert = require("node:assert");

function testFib(n, memo = {}) {
  if (n <= 1) return n;
  if (memo[n]) return memo[n];
  return memo[n] = testFib(n - 1, memo) + testFib(n - 2, memo);
}

assert.equal(testFib(0), 0);
assert.equal(testFib(1), 1);
assert.equal(testFib(7), 13);
assert.equal(testFib(30), 832040);

console.log("✅ Recursion and memoization assertions passed!");
```

---

## 7. Summary

- **Recursion** requires a **base case** to stop and a **recursive step** that shrinks the problem.
- **Call stack** tracks active function frames; deep recursion takes $O(n)$ auxiliary space.
- **Memoization** caches duplicate subproblems, cutting naive recursion from $O(2^n)$ down to $O(n)$.
- **Limit:** V8 throws a stack overflow around ~10,000 frames.

---

## 8. Cheat Sheet

| Component | Purpose |
| :--- | :--- |
| **Base Case** | Stopping condition (`if (n <= 1) return ...`) |
| **Recursive Call**| Solves smaller subproblem (`func(n - 1)`) |
| **Memoization** | Caches results to prevent re-computation |
| **Stack Memory** | $O(\text{max recursion depth})$ auxiliary space |

---

## 9. Interview Q&A

### 45-Second Explanation
> *"Recursion is a programming technique where a function solves a problem by calling itself with smaller inputs until reaching a base case. Each call pushes a new frame onto the runtime call stack. For branching problems like Fibonacci, naive recursion repeats subproblems exponentially in $O(2^n)$ time. By memoizing previously computed results in a hash map, we ensure each state is computed only once, optimizing the runtime to $O(n)$ with $O(n)$ auxiliary space."*

---

## 10. Practice Problems

### 1. Fibonacci Number - Easy
The Fibonacci numbers, commonly denoted `F(n)` form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from `0` and `1`. Given `n`, calculate `F(n)`.
- **Input:** `n = 2`
- **Expected Output:** `1`
- **Input:** `n = 3`
- **Expected Output:** `2`
- **Input:** `n = 4`
- **Expected Output:** `3`

### 2. Power of Two - Easy
Given an integer `n`, return `true` if it is a power of two. Otherwise, return `false`. An integer `n` is a power of two if there exists an integer `x` such that `n == 2^x`.
- **Input:** `n = 1`
- **Expected Output:** `true`
- **Input:** `n = 16`
- **Expected Output:** `true`
- **Input:** `n = 3`
- **Expected Output:** `false`

### 3. Reverse String - Easy
Write a function that reverses a string recursively. The input string is given as an array of characters `s`. You must do this by modifying the input array in-place with $O(1)$ extra memory.
- **Input:** `s = ["h","e","l","l","o"]`
- **Expected Output:** `["o","l","l","e","h"]`
- **Input:** `s = ["H","a","n","n","a","h"]`
- **Expected Output:** `["h","a","n","n","a","H"]`

---

<nav aria-label="Lecture navigation">

[Previous: Binary Search on Solution Space](day-17-binary-search-on-solution-space.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Merge Sort & Quick Sort](day-19-merge-sort-and-quick-sort.md)

</nav>
