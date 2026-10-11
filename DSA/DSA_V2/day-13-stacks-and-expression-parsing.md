# Day 13: Stacks & Expression Parsing

<nav aria-label="Lecture navigation">

[Previous: Linked List Reversals & Cycles](day-12-linked-list-reversals-and-cycle-detection.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Monotonic Stacks](day-14-monotonic-stack-patterns.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — $O(1)$ operations.
- [Day 02: Arrays, Strings & Memory](day-02-arrays-strings-and-primitive-memory.md) — Array `push` and `pop`.

---

## 1. What is a Stack?

A **Stack** is a linear data structure that follows the **LIFO** (Last In, First Out) principle.

Think of a stack of dinner plates in a cafeteria:
- You add a clean plate to the **top** (`push`).
- You remove a plate from the **top** (`pop`).
- The last plate placed on the stack is the first one taken!

```text
Stack Operations:
Push 10:  [ 10 ]
Push 20:  [ 10, 20 ]
Pop():    Returns 20 ──► Stack is now [ 10 ]
```

### Core Stack Operations

| Operation | Array Method | Time Complexity |
| :--- | :--- | :---: |
| **Push** (Add to top) | `stack.push(val)` | **$O(1)$ amortized** |
| **Pop** (Remove from top) | `stack.pop()` | **$O(1)$** |
| **Peek** (View top item) | `stack[stack.length - 1]` | **$O(1)$** |
| **isEmpty** | `stack.length === 0` | **$O(1)$** |

---

## 2. Problem 1: Valid Parentheses

Given a string `s` containing `'('`, `')'`, `'{'`, `'}'`, `'['`, and `']'`, determine if the input string is valid (every open bracket has a matching closing bracket in correct order).

```javascript
// Node.js code: Matching Brackets with a Stack
function isValid(s) {
  const stack = [];
  const map = {
    ')': '(',
    '}': '{',
    ']': '['
  };

  for (const char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char); // Push open bracket to stack
    } else {
      // Closing bracket must match the top of the stack
      const top = stack.pop();
      if (top !== map[char]) {
        return false;
      }
    }
  }

  // Valid only if all brackets were closed (stack is empty)
  return stack.length === 0;
}

console.log(isValid("()[]{}")); // true
console.log(isValid("(]"));     // false
console.log(isValid("([)]"));   // false
console.log(isValid("{[]}"));   // true
```
- **Time Complexity:** $O(n)$ — Single pass through the string.
- **Extra Space:** $O(n)$ — Stack stores up to $n$ characters.

---

## 3. Problem 2: Min Stack ($O(1)$ Minimum)

Design a stack that supports `push`, `pop`, `top`, and retrieving the minimum element in **$O(1)$ time**.

### The Insight: Track Minimum at Each Depth
Store each value alongside the minimum seen so far: `[val, minSoFar]`.

```javascript
// Node.js code
class MinStack {
  constructor() {
    this.stack = [];
  }

  push(val) {
    const currentMin = this.stack.length === 0 
      ? val 
      : Math.min(val, this.getMin());
    this.stack.push({ val, min: currentMin });
  }

  pop() {
    this.stack.pop();
  }

  top() {
    return this.stack[this.stack.length - 1].val;
  }

  getMin() {
    return this.stack[this.stack.length - 1].min;
  }
}

const minStack = new MinStack();
minStack.push(-2);
minStack.push(0);
minStack.push(-3);
console.log(minStack.getMin()); // -3
minStack.pop();
console.log(minStack.top());    // 0
console.log(minStack.getMin()); // -2
```
- **All Operations:** strictly **$O(1)$ time**.
- **Extra Space:** $O(n)$ — Pairs stored in the stack.

---

## 4. Problem 3: Evaluate Reverse Polish Notation (Postfix)

Evaluate an array of arithmetic tokens in Reverse Polish Notation: `["2","1","+","3","*"]` $= ((2 + 1) \times 3) = 9$.

```javascript
// Node.js code
function evalRPN(tokens) {
  const stack = [];

  for (const token of tokens) {
    if (token === "+" || token === "-" || token === "*" || token === "/") {
      const b = stack.pop(); // Note: Second operand popped first!
      const a = stack.pop();

      if (token === "+") stack.push(a + b);
      else if (token === "-") stack.push(a - b);
      else if (token === "*") stack.push(a * b);
      else if (token === "/") stack.push(Math.trunc(a / b)); // Truncate toward zero
    } else {
      stack.push(Number(token));
    }
  }

  return stack.pop();
}

console.log(evalRPN(["2", "1", "+", "3", "*"])); // 9
console.log(evalRPN(["4", "13", "5", "/", "+"])); // 6
```
- **Time Complexity:** $O(n)$
- **Extra Space:** $O(n)$

---

## 5. Tricky Points and Common Traps

1. **Popping an empty stack:** Always verify `stack.length > 0` before checking `top`.
2. **Order of operands in division/subtraction:** When evaluating `a - b`, `b` is popped first and `a` is popped second:
   ```javascript
   const b = stack.pop();
   const a = stack.pop();
   const result = a - b; // NOT b - a!
   ```
3. **JavaScript division truncate towards zero:** Use `Math.trunc(a / b)` rather than `Math.floor()` because `Math.floor(-0.5)` gives `-1`, whereas integer division should truncate to `0`.

---

## 6. Hands-On Exercises

Run this script in Node.js to verify valid parentheses:

```javascript
// Node.js code
const assert = require("node:assert");

function testValid(s) {
  const st = [];
  const m = { ')': '(', '}': '{', ']': '[' };
  for (const c of s) {
    if (c === '(' || c === '{' || c === '[') st.push(c);
    else if (st.pop() !== m[c]) return false;
  }
  return st.length === 0;
}

assert.equal(testValid("()[]{}"), true);
assert.equal(testValid("([)]"), false);
assert.equal(testValid("]"), false);

console.log("✅ Valid parentheses assertions passed!");
```

---

## 7. Summary

- **Stacks** are LIFO (Last In, First Out).
- **Array methods** `push()` and `pop()` implement an $O(1)$ stack directly in JavaScript.
- **Matching brackets** pushes opening brackets and pops to verify against closing brackets.
- **Min Stack** achieves $O(1)$ `getMin()` by recording the current minimum alongside each value.

---

## 8. Cheat Sheet

| Task | Stack Pattern |
| :--- | :--- |
| **Matching Brackets** | Push open brackets, pop and verify on close brackets |
| **Expression Parsing** | Push numbers, pop two on operator, push result |
| **Min Stack** | Store `{ val, min: Math.min(val, currentMin) }` |
| **Complexity** | **$O(1)$ operations**, **$O(n)$ extra space** |

---

## 9. Interview Q&A

### 45-Second Explanation
> *"A Stack is a LIFO data structure where elements are added and removed from the top in $O(1)$ time. For Valid Parentheses, we scan the string and push opening brackets onto the stack. When we encounter a closing bracket, we pop the top of the stack and check for a match. If they don't match, or if the stack is not empty at the end, the string is invalid. This solves the problem in $O(n)$ time and $O(n)$ space."*

---

## 10. Practice Problems

### 1. Valid Parentheses - Easy
Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.
- **Input:** `s = "()[]{}"`
- **Expected Output:** `true`
- **Input:** `s = "(]"`
- **Expected Output:** `false`
- **Input:** `s = "([])"`
- **Expected Output:** `true`

### 2. Min Stack - Medium
Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.
- **Input:** `["MinStack","push","push","push","getMin","pop","top","getMin"], [[],[-2],[0],[-3],[],[],[],[]]`
- **Expected Output:** `[null,null,null,null,-3,null,0,-2]`

### 3. Evaluate Reverse Polish Notation - Medium
You are given an array of strings `tokens` that represents an arithmetic expression in a Reverse Polish Notation. Evaluate the expression and return an integer representing its value.
- **Input:** `tokens = ["2","1","+","3","*"]`
- **Expected Output:** `9`
- **Input:** `tokens = ["4","13","5","/","+"]`
- **Expected Output:** `6`

---

<nav aria-label="Lecture navigation">

[Previous: Linked List Reversals & Cycles](day-12-linked-list-reversals-and-cycle-detection.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Monotonic Stacks](day-14-monotonic-stack-patterns.md)

</nav>
