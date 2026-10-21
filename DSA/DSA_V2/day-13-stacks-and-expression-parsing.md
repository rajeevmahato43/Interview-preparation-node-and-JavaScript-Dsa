# Day 13: Stacks & Expression Parsing

<nav aria-label="Lecture navigation">

[Previous: Linked List Reversals & Cycle Detection](day-12-linked-list-reversals-and-cycle-detection.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Monotonic Stack Patterns](day-14-monotonic-stack-patterns.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Constant time $O(1)$ operations vs linear $O(n)$ string/array copies.
- [Day 02: Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md) — Array dynamic resizing and amortized complexity.
- [Day 04: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md) — Instant $O(1)$ dictionary lookups for symbol pairing.

---

## 1. What is a Stack?

A **Stack** is a linear data structure that strictly enforces the **LIFO (Last-In, First-Out)** access principle. Elements can only be added to or removed from a single designated end, called the **top** of the stack. The element added most recently is always the very first element to be removed.

> **LIFO (Last-In, First-Out)**: A processing order where the most recent addition is processed before any older elements.

> **Push**: Adding an element to the top of the stack ($O(1)$).

> **Pop**: Removing and returning the topmost element from the stack ($O(1)$).

> **Peek (Top)**: Inspecting the value of the topmost element without removing it ($O(1)$).

### Everyday Physical Analogies

#### The Spring-Loaded Cafeteria Plate Dispenser
Imagine the plate dispenser in a cafeteria:
1. The dishwasher adds a freshly washed plate to the top of the cylinder (**Push**). The spring compresses downward.
2. The next customer takes the top plate (**Pop**). The plate immediately underneath rises up to take its place (**Peek**).
3. The plate at the very bottom was washed first, but will be used last.
4. If the dispenser is empty and a customer reaches in, an error occurs (**Stack Underflow**).

#### Browser History (The "Back" Button)
When you browse the web:
1. You visit `google.com` (Pushed to history stack).
2. You click a link to `github.com` (Pushed onto stack).
3. You click a link to `stackoverflow.com` (Pushed onto stack).
4. When you click **Back**, the browser **pops** `stackoverflow.com` and reveals `github.com`.

```text
STACK (LIFO) VISUALIZATION:

    PUSH (30)             POP () -> returns 30
       │                         ▲
       ▼                         │
   ┌────────┐                ┌────────┐
   │   30   │ ◄── Top        │        │
   ├────────┤                ├────────┤
   │   20   │                │   20   │ ◄── New Top
   ├────────┤                ├────────┤
   │   10   │ ◄── Bottom     │   10   │ ◄── Bottom
   └────────┘                └────────┘
```

---

## 2. How Stacks Work Step-by-Step

### 1. Array-Based vs Linked-List-Based Implementation

In JavaScript, a stack can be implemented using a standard array or a singly linked list.

#### Approach A: JavaScript Array (`push` / `pop`)
JavaScript's built-in `Array.prototype.push()` and `Array.prototype.pop()` operate exclusively at the end of the array, making arrays a natural $O(1)$ amortized stack.

```javascript
class ArrayStack {
  constructor() {
    this.items = [];
  }
  push(val) { this.items.push(val); }
  pop() { return this.items.pop() ?? null; }
  peek() { return this.items[this.items.length - 1] ?? null; }
  isEmpty() { return this.items.length === 0; }
  size() { return this.items.length; }
}
```

#### Approach B: Linked-List-Based Stack
If strict $O(1)$ worst-case time is required (avoiding array resizing geometric copies), a singly linked list inserting and deleting at `head` provides guaranteed $O(1)$ performance:

```javascript
class StackNode {
  constructor(val, next = null) {
    this.val = val;
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
    if (!this.topNode) return null;
    const val = this.topNode.val;
    this.topNode = this.topNode.next;
    this.count--;
    return val;
  }
  peek() {
    return this.topNode ? this.topNode.val : null;
  }
  isEmpty() { return this.count === 0; }
}
```

---

### 2. Expression Parsing Fundamentals

Mathematical expressions can be written in three notations:
1. **Infix**: Operator between operands: `(A + B) * C` (Human standard, requires parentheses and precedence rules).
2. **Prefix (Polish)**: Operator precedes operands: `* + A B C`.
3. **Postfix (Reverse Polish Notation - RPN)**: Operator follows operands: `A B + C *` (Ideal for computers; eliminates all parentheses).

#### How Postfix Evaluation Works Step-by-Step
Evaluate: `["2", "1", "+", "3", "*"]`
```text
Token 1: "2" -> Operand -> Push 2.       Stack: [ 2 ]
Token 2: "1" -> Operand -> Push 1.       Stack: [ 2, 1 ]
Token 3: "+" -> Operator ->
  1. Pop right operand: b = 1
  2. Pop left operand:  a = 2
  3. Compute a + b = 2 + 1 = 3
  4. Push result 3.                      Stack: [ 3 ]
Token 4: "3" -> Operand -> Push 3.       Stack: [ 3, 3 ]
Token 5: "*" -> Operator ->
  1. Pop right operand: b = 3
  2. Pop left operand:  a = 3
  3. Compute a * b = 3 * 3 = 9
  4. Push result 9.                      Stack: [ 9 ]

Final result: Pop top of stack -> 9!
```

---

## 3. Pattern Recognition of Stacks

### Problem Triggers and Keywords

| Problem Trigger | Underlying Requirement | Recommended Strategy |
| :--- | :--- | :--- |
| **"Balanced parentheses / brackets"** | Most recent opener must match closer. | LIFO Stack of open characters. |
| **"Evaluate arithmetic expression"** | Postfix evaluation or operator precedence. | Operand Stack + Operator Stack. |
| **"Undo / Redo operation"** | Reversing recent historical actions. | Dual Stacks (`undoStack`, `redoStack`). |
| **"Simplify file path (`/a/./b/../../c/`)"**| `..` cancels the most recent directory. | Directory name stack. |
| **"Decode nested strings (`3[a2[c]]`)"** | Innermost brackets resolved first. | Dual Stacks (`countStack`, `stringStack`). |

### The $10^7$ Rule for Stacks
- A linear stack algorithm scans an input string or array of length $n = 10^5$ exactly once.
- Each element is pushed at most once and popped at most once ($2n$ total operations).
- Runtime is strictly $O(n)$ ($\approx 10\text{ms}$ in Node.js), comfortably passing constraints where $n \le 10^6$.

---

## 4. Problem 1: Valid Parentheses (LeetCode 20)

### Problem Statement
Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.
An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

```text
Input: s = "()[]{}" -> Output: true
Input: s = "(]"     -> Output: false
Input: s = "([)]"   -> Output: false
Input: s = "{[]}"   -> Output: true
```

### Step 1: Physical Simulation
Imagine colored plastic nesting cups:
Input: `"{ [ ] }"`
1. Pick up `{`. It is an opener. Place it in the bottom of your tray.
2. Pick up `[`. It is an opener. Place it on top of `{` in your tray.
3. Pick up `]`. It is a closer! Look at the top cup in your tray:
   - Top cup is `[`. It matches `]`. Remove `[` from the tray.
4. Pick up `}`. It is a closer! Look at the top cup in your tray:
   - Top cup is `{`. It matches `}`. Remove `{` from the tray.
5. All characters have been inspected, and the tray is empty! Return `true`.

Now test invalid nesting: `"([)]"`
1. Push `(`. Stack: `[ '(' ]`.
2. Push `[`. Stack: `[ '(', '[' ]`.
3. Encounter `)`. Top of stack is `[`! A round bracket cannot close a square bracket! Mismatch detected $\to$ Return `false` immediately.

### Step 2: Brute Force Approach
Repeatedly search for adjacent matching pairs `()`, `[]`, `{}` and replace them with empty strings until no pairs remain:

```javascript
function isValidBrute(s) {
  let prevLen = -1;
  while (s.length !== prevLen) {
    prevLen = s.length;
    s = s.replace("()", "").replace("[]", "").replace("{}", "");
  }
  return s.length === 0;
}
```
- **Time Complexity**: $O(n^2)$ — In worst case (`"((((....))))"`), string scanning and string allocations occur $n/2$ times.
- **Space Complexity**: $O(n^2)$ — Repeatedly allocates new string buffers in V8 memory.

### Step 3: Bottleneck
Where is the CPU sweating?
Scanning the entire string repeatedly over and over wastes quadratic time. Matching brackets is inherently local: every closing bracket only cares about the **single most recently opened unclosed bracket**.

### Step 4: The Pattern Discovery
A **LIFO Stack** remembers unclosed openers. When encountering a closer, check `stack.pop()`. If it does not match, return `false`.

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: Linear LIFO Stack with Map lookup
function isValid(s) {
  // Odd length string can never be validly paired
  if (s.length % 2 !== 0) return false;

  const stack = [];
  const matchingOpen = {
    ")": "(",
    "}": "{",
    "]": "["
  };

  for (let i = 0; i < s.length; i++) {
    const char = s[i];

    if (matchingOpen[char]) {
      // char is a closing bracket; top of stack must match
      const top = stack.pop();
      if (top !== matchingOpen[char]) {
        return false;
      }
    } else {
      // char is an opening bracket; push onto stack
      stack.push(char);
    }
  }

  // Valid only if all opened brackets were successfully closed
  return stack.length === 0;
}

// ❌ ANTI-PATTERN: Counter variables fail on cross-nesting
function buggyIsValid(s) {
  let round = 0, square = 0, curly = 0;
  for (const c of s) {
    if (c === "(") round++; else if (c === ")") round--;
    if (c === "[") square++; else if (c === "]") square--;
    if (c === "{") curly++; else if (c === "}") curly--;
    if (round < 0 || square < 0 || curly < 0) return false;
  }
  // BUG: "([)]" returns true because counts balance, but order is completely broken!
  return round === 0 && square === 0 && curly === 0;
}

// Example test runs
console.log(isValid("()[]{}")); // true
console.log(isValid("{[]}"));   // true
console.log(isValid("(]"));     // false
console.log(isValid("([)]"));   // false
console.log(isValid("["));      // false
console.log(buggyIsValid("([)]")); // true (BUG: failed to detect incorrect nesting order!)
```

- **Time Complexity**: $O(n)$ — Single linear pass over string of length $n$.
- **Space Complexity**: $O(n)$ — Auxiliary stack holds at most $n$ characters.

---

## 5. Problem 2: Evaluate Reverse Polish Notation (LeetCode 150)

### Problem Statement
You are given an array of strings `tokens` that represents an arithmetic expression in **Reverse Polish Notation**.
Evaluate the expression. Return an integer that represents the value of the expression.
Valid operators are `+`, `-`, `*`, and `/`.
Division between two integers should **truncate toward zero**.

```text
Input: tokens = ["2", "1", "+", "3", "*"]
Output: 9 (Explanation: ((2 + 1) * 3) = 9)

Input: tokens = ["4", "13", "5", "/", "+"]
Output: 6 (Explanation: (4 + (13 / 5)) = 4 + 2 = 6)

Input: tokens = ["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"]
Output: 22
```

### Step 1: Physical Simulation
Imagine index cards on a table: `["4", "13", "5", "/", "+"]`.
1. Place Card `4` on the stack. Stack: `[ 4 ]`.
2. Place Card `13` on the stack. Stack: `[ 4, 13 ]`.
3. Place Card `5` on the stack. Stack: `[ 4, 13, 5 ]`.
4. Card `/` arrives. It is an operator:
   - Pop right card: `b = 5`.
   - Pop left card: `a = 13`.
   - Compute `13 / 5 = 2.6`. Truncate toward zero $\to 2$.
   - Push `2` onto the stack. Stack: `[ 4, 2 ]`.
5. Card `+` arrives. Operator:
   - Pop right card: `b = 2`.
   - Pop left card: `a = 4`.
   - Compute `4 + 2 = 6`.
   - Push `6` onto the stack. Stack: `[ 6 ]`.
6. Return `6`.

### Step 2: Brute Force Approach
Search for the first operator in the array, evaluate it with its two left neighbors, and use `tokens.splice()` to replace the three items with the result, repeating until 1 item remains:

```javascript
function evalRPNBrute(tokens) {
  const ops = new Set(["+", "-", "*", "/"]);
  while (tokens.length > 1) {
    let i = 0;
    while (!ops.has(tokens[i])) i++;
    const a = Number(tokens[i - 2]);
    const b = Number(tokens[i - 1]);
    let res = 0;
    if (tokens[i] === "+") res = a + b;
    else if (tokens[i] === "-") res = a - b;
    else if (tokens[i] === "*") res = a * b;
    else res = Math.trunc(a / b);
    tokens.splice(i - 2, 3, String(res));
  }
  return Number(tokens[0]);
}
```
- **Time Complexity**: $O(n^2)$ — `splice()` shifts remaining elements on every operation.
- **Space Complexity**: $O(1)$ mutating input, but reallocates internal array storage.

### Step 3: Bottleneck
Where is the CPU sweating?
Array `splice()` shifts thousands of array slots on every single mathematical step.

### Step 4: The Pattern Discovery
An **Operand Stack** evaluates postfix expressions in a single $O(n)$ forward pass. Every number is pushed; every operator pops two numbers, evaluates, and pushes the result.

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: Single-pass stack evaluation with Math.trunc
function evalRPN(tokens) {
  const stack = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token === "+" || token === "-" || token === "*" || token === "/") {
      // Right operand was pushed last, so it pops first!
      const b = stack.pop();
      const a = stack.pop();

      switch (token) {
        case "+":
          stack.push(a + b);
          break;
        case "-":
          stack.push(a - b); // Non-commutative! Order matters!
          break;
        case "*":
          stack.push(a * b);
          break;
        case "/":
          // Math.trunc truncates toward zero (-1.5 -> -1, whereas Math.floor(-1.5) -> -2)
          stack.push(Math.trunc(a / b));
          break;
      }
    } else {
      // Convert string token to numeric integer
      stack.push(Number(token));
    }
  }

  return stack.pop();
}

// ❌ ANTI-PATTERN: Reversed operand order and Math.floor division
function buggyEvalRPN(tokens) {
  const stack = [];
  for (const t of tokens) {
    if (t === "-") {
      const b = stack.pop(), a = stack.pop();
      stack.push(b - a); // BUG! Evaluates b - a instead of a - b!
    } else if (t === "/") {
      const b = stack.pop(), a = stack.pop();
      stack.push(Math.floor(a / b)); // BUG! Math.floor(-6 / 132) yields -1 instead of 0!
    } else if (t === "+") {
      stack.push(stack.pop() + stack.pop());
    } else if (t === "*") {
      stack.push(stack.pop() * stack.pop());
    } else {
      stack.push(Number(t));
    }
  }
  return stack.pop();
}

// Example test runs
console.log(evalRPN(["2", "1", "+", "3", "*"])); // 9
console.log(evalRPN(["4", "13", "5", "/", "+"])); // 6
console.log(evalRPN(["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"])); // 22
console.log(evalRPN(["4", "-2", "/", "2", "-3", "-", "-"])); // -7
```

- **Time Complexity**: $O(n)$ — Every token is visited once; each push and pop is $O(1)$.
- **Space Complexity**: $O(n)$ — Stack holds at most $n/2 + 1$ numeric values.

---

## 6. Under the Hood: V8 & Node.js

### The V8 Execution Call Stack
How does JavaScript execute functions?
When Node.js runs:
```javascript
function main() { first(); }
function first() { second(); }
function second() { console.trace(); }
main();
```
1. V8 allocates a native thread stack frame for `main()`.
2. Calling `first()` pushes a new frame on top of `main()`.
3. Calling `second()` pushes a frame on top of `first()`.
4. When `second()` returns, its frame is **popped**, and instruction pointer returns to `first()`.
5. If functions recursively call themselves without base cases, frames stack up until hitting the hardware limit, throwing `RangeError: Maximum call stack size exceeded`.

### Stack Allocation vs Heap Allocation in V8
- **Stack Memory**: Managed directly by CPU registers (Stack Pointer `RSP`). Allocation is a single CPU instruction (pointer increment). Ultra-fast, but limited in size.
- **Heap Memory**: Managed by V8 Garbage Collector. Storing objects, arrays, and closures occurs on the heap.
- In JavaScript, local primitives (numbers, booleans) inside non-escaping functions can be optimized to CPU registers or stack memory by V8's **TurboFan** compiler. When objects or arrays are pushed onto a JavaScript stack (`[]`), they reside on the V8 managed heap.

---

## 7. Hands-On Exercise

### The Scenario
You are developing an in-memory telemetry aggregator for an IoT streaming service in Node.js.
You must design a `MinStack` data structure that supports standard stack operations (`push`, `pop`, `top`) and also retrieves the **minimum element in $O(1)$ constant time**.

### The Buggy Code
```javascript
class BuggyMinStack {
  constructor() {
    this.stack = [];
    this.min = Infinity;
  }
  push(val) {
    if (val < this.min) this.min = val;
    this.stack.push(val);
  }
  pop() {
    const val = this.stack.pop();
    // Bug: If the popped element was the minimum, this.min is permanently corrupted!
    // Finding new minimum requires O(n) scan, violating the O(1) requirement!
    return val;
  }
  getMin() { return this.min; }
}
```

### Acceptance Criteria
1. `push`, `pop`, `top`, and `getMin` must all operate in **strict $O(1)$ time**.
2. Must not use $O(n)$ scans inside `pop()` or `getMin()`.
3. Correctly preserves previous minimums when elements are popped.
4. Verified with direct test execution.

### Verified Solution

```javascript
// ✅ CORRECT: Dual-Stack tracking minimum at each depth
class MinStack {
  constructor() {
    this.stack = [];
    this.minStack = []; // Records the minimum value observed up to each depth
  }

  push(val) {
    this.stack.push(val);

    // If minStack is empty or val <= current minimum, push to minStack
    if (this.minStack.length === 0 || val <= this.minStack[this.minStack.length - 1]) {
      this.minStack.push(val);
    }
  }

  pop() {
    if (this.stack.length === 0) return;

    const val = this.stack.pop();

    // If popped value matches the current minimum, pop from minStack as well
    if (val === this.minStack[this.minStack.length - 1]) {
      this.minStack.pop();
    }
  }

  top() {
    return this.stack[this.stack.length - 1] ?? null;
  }

  getMin() {
    return this.minStack[this.minStack.length - 1] ?? null;
  }
}

// Example test runs
const minStack = new MinStack();
minStack.push(-2);
minStack.push(0);
minStack.push(-3);

console.log(minStack.getMin()); // -3
minStack.pop();
console.log(minStack.top());    // 0
console.log(minStack.getMin()); // -2 (Correctly restored previous minimum!)

minStack.push(-2);
console.log(minStack.getMin()); // -2
minStack.pop();
console.log(minStack.getMin()); // -2
```

---

## 8. Tricky Points and Edge Cases

### 1. Integer Division Truncation in JavaScript
In languages like C++ or Java, integer division `a / b` automatically truncates toward zero.
In JavaScript:
- `Math.floor(-3 / 2) === -2` (Rounds down to more negative number!).
- `Math.trunc(-3 / 2) === -1` (Truncates fractional part toward zero).
- **Rule**: In expression parsing problems, always use **`Math.trunc(a / b)`**.

### 2. Operand Order in Non-Commutative Operators
For subtraction and division:
```javascript
const b = stack.pop(); // Right operand
const a = stack.pop(); // Left operand
stack.push(a - b);     // CORRECT: a - b
```
If you write `stack.push(b - a)`, you reverse the expression and produce negative results.

### 3. Edge Cases Checklist for Stacks
- Empty string input (`""`).
- String with only opening brackets (`"((("`) $\to$ Stack non-empty at end $\to$ `false`.
- String with only closing brackets (`")))"`) $\to$ Stack pops `undefined` on first character $\to$ `false`.
- Cross-nesting brackets (`"([)]"`).

---

## 9. Comprehensive Summary

- **Stacks** operate on the LIFO principle, restricting insertion and removal to the topmost element in $O(1)$ time.
- **Valid Parentheses**: Push opening brackets; on closing brackets, pop and verify matching type. A valid string leaves an empty stack at the end.
- **Postfix Expression Parsing (RPN)**: Push operands; when an operator is encountered, pop two operands, evaluate $a \text{ op } b$, and push the result back onto the stack.
- **MinStack**: Maintain a parallel `minStack` to track the running minimum at every stack depth, achieving $O(1)$ `getMin()` without rescanning.
- **V8 Engine**: Function call stacks use native hardware LIFO frames. Recursive algorithms without base cases overflow V8's ~10,000 frame limit.

---

## 10. Cheat Sheet

### Stack Operation Complexities

| Data Structure / Problem | Operation | Time Complexity | Space Complexity |
| :--- | :--- | :---: | :---: |
| **Array-Based Stack** | `push(x)` / `pop()` | **$O(1)$ amortized** | $O(n)$ |
| **Linked-List Stack** | `push(x)` / `pop()` | **$O(1)$ strict** | $O(n)$ |
| **Valid Parentheses** | Full validation | **$O(n)$** | $O(n)$ |
| **Evaluate RPN** | Postfix calculation | **$O(n)$** | $O(n)$ |
| **MinStack** | `push` / `pop` / `getMin` | **$O(1)$** | $O(n)$ |

### Common Pitfalls List
- **Division Truncation Bug**: Using `Math.floor()` instead of `Math.trunc()` corrupts negative quotients.
- **Popped Operand Order**: Inverting `a` and `b` in `a - b` or `a / b`.
- **Incomplete Validation**: Forgetting to check `stack.length === 0` at the end (e.g., `"("` passes if not checked).
- **Empty Stack Popping**: Calling `.pop()` without checking for empty state returns `undefined`.

---

## 11. Interview Q&A

### 45-Second Technical Pitch
> *"A Stack is a fundamental LIFO data structure where element insertion and removal occur in constant O(1) time at the top. In technical interviews, stacks are the primary tool for problems requiring historical tracking, nested pairing, and expression evaluation. For valid parentheses, we push openers and validate closers against the most recently opened symbol in linear time. For expression parsing like Reverse Polish Notation, a stack naturally eliminates parentheses and operator precedence ambiguities by holding operands until an operator arrives. In backend Node.js engineering, understanding stack mechanics is essential for diagnosing call stack overflows and managing memory execution contexts."*

### 1. Why does `Math.trunc()` have to be used instead of `Math.floor()` or bitwise `| 0` in JavaScript expression evaluation?
**Answer:**
The problem specification requires division to truncate toward zero.
1. `Math.floor()` rounds down toward negative infinity:
   `Math.floor(6 / -132) = Math.floor(-0.045) = -1` (Wrong! Truncation toward zero should be `0`).
2. Bitwise `(a / b) | 0` truncates toward zero, but converts the number to a **32-bit signed integer**. If the result exceeds $2^{31} - 1$ ($2,147,483,647$) or is less than $-2^{31}$, bitwise operations overflow and corrupt the data.
3. `Math.trunc(a / b)` correctly truncates toward zero while safely supporting standard 64-bit IEEE-754 double precision floats.

### 2. What will the following code output in Node.js, and why?
```javascript
const stack = [];
stack.push(1);
stack.push(2);
const res = stack.pop() - stack.pop();
console.log(res);
```
**Answer:**
It outputs `1`.
When `stack.pop()` is first called, it pops `2` (the most recently pushed element).
The second `stack.pop()` pops `1`.
The expression evaluates `2 - 1 = 1`.
Notice that if the intended mathematical operation was the first pushed minus the second pushed ($1 - 2 = -1$), this is an operand inversion error!

### 3. Spot and fix the bug in this bracket checker:
```javascript
function checkBrackets(str) {
  const stack = [];
  for (let c of str) {
    if (c === "(") stack.push(")");
    else if (c === "[") stack.push("]");
    else if (c !== stack.pop()) return false;
  }
  return true;
}
```
**Answer:**
The code has two critical bugs:
1. If `str` contains only opening brackets (e.g., `str = "((("`), the loop completes without checking closers, and the function returns `true`. The correct return condition is `return stack.length === 0`.
2. If `str` contains invalid non-bracket characters, it erroneously attempts to pop from the stack.

### 4. How can you implement a Queue (FIFO) using two Stacks (LIFO), and what is the amortized time complexity of its operations?
**Answer:**
We maintain two stacks: `inStack` and `outStack`.
1. **`enqueue(x)`**: Push `x` directly onto `inStack` ($O(1)$).
2. **`dequeue()`**:
   - If `outStack` is empty, pop all elements from `inStack` one-by-one and push them onto `outStack`. This reverses their order, so the oldest element is now at the top of `outStack`!
   - Pop and return the top of `outStack`.
- **Amortized Time Complexity**: Every element is pushed to `inStack` once, moved to `outStack` once, and popped from `outStack` once (3 operations per item). Thus, the amortized time for `dequeue()` is strictly **$O(1)$**.

---

## 12. Practice Problems

### 1. Valid Parentheses - Easy
Given a string `s` containing `'('`, `')'`, `'{'`, `'}'`, `'['`, `']'`, determine if it is valid.
- **Sample Input 1:** `s = "()[]{}"`
- **Expected Output 1:** `true`
- **Sample Input 2:** `s = "(]"`
- **Expected Output 2:** `false`
- **Sample Input 3:** `s = "([)]"`
- **Expected Output 3:** `false`

### 2. Evaluate Reverse Polish Notation - Medium
Evaluate arithmetic expression in Reverse Polish Notation.
- **Sample Input 1:** `tokens = ["2", "1", "+", "3", "*"]`
- **Expected Output 1:** `9`
- **Sample Input 2:** `tokens = ["4", "13", "5", "/", "+"]`
- **Expected Output 2:** `6`

### 3. Simplify Path - Medium
Given an absolute Unix file path string, simplify it to the canonical path.
- **Sample Input 1:** `path = "/home/"`
- **Expected Output 1:** `"/home"`
- **Sample Input 2:** `path = "/../"`
- **Expected Output 2:** `"/"`
- **Sample Input 3:** `path = "/home//foo/"`
- **Expected Output 3:** `"/home/foo"`

### 4. Min Stack - Medium
Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.
- **Sample Input:**
  `["MinStack","push","push","push","getMin","pop","top","getMin"]`
  `[[],[-2],[0],[-3],[],[],[],[]]`
- **Expected Output:**
  `[null,null,null,null,-3,null,0,-2]`

---

<nav aria-label="Lecture navigation">

[Previous: Linked List Reversals & Cycle Detection](day-12-linked-list-reversals-and-cycle-detection.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Monotonic Stack Patterns](day-14-monotonic-stack-patterns.md)

</nav>
