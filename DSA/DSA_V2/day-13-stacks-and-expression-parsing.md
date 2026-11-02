# Day 13: Stacks & Expression Parsing

<nav aria-label="Lecture navigation">

[Previous: Linked List Reversals & Cycle Detection](day-12-linked-list-reversals-and-cycle-detection.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Monotonic Stack Patterns](day-14-monotonic-stack-patterns.md)

</nav>

---

## 1. Stacks Foundation

A **Stack** is a simple data structure that follows one main rule: **LIFO (Last-In, First-Out)**. This means the last item you put in is always the very first item you take out. You can only add or remove items from one spot: the **top** of the stack.

To picture this physically, imagine a spring-loaded plate dispenser in a cafeteria:
* Dishwashers put clean plates onto the top of the pile, pushing the spring down.
* When you want a plate, you take the top plate.
* The first plate placed at the bottom stays there until every plate above it is taken.
* If you try to take a plate from an empty dispenser, there is nothing there to take.

```text
STACK (LIFO) DISPENSER:

    PUSH (30)                 POP () -> 30
       │                            ▲
       ▼                            │
   ┌────────┐                   ┌────────┐
   │   30   │ ◄── Top           │        │
   ├────────┤                   ├────────┤
   │   20   │                   │   20   │ ◄── New Top
   ├────────┤                   ├────────┤
   │   10   │ ◄── Bottom        │   10   │ ◄── Bottom
   └────────┘                   └────────┘
```

You can build a simple stack in JavaScript using a normal array where you add and remove from the end:

```javascript
class ArrayStack {
  constructor() {
    this.items = [];
  }

  push(val) {
    this.items.push(val);
  }

  pop() {
    return this.items.pop() ?? null;
  }

  peek() {
    return this.items[this.items.length - 1] ?? null;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }
}

const stack = new ArrayStack();
stack.push(10);
stack.push(20);
stack.push(30);
console.log(stack.peek()); // 30
console.log(stack.pop());  // 30
console.log(stack.size()); // 2
```

### 1.1 Array Stack vs Linked Stack

A stack can use an array or a linked list. Each has different trade-offs:

```text
ARRAY-BACKED STACK:
Memory: [ 10 | 20 | 30 |  _  |  _  ]
- Top points to the end of the array.
- Items sit side-by-side in memory (fast CPU cache).
- push/pop is O(1) on average; array resizing copies items once in a while.

LINKED-LIST-BACKED STACK:
Memory: [ Top: 30 ] ──> [ 20 ] ──> [ 10 ] ──> null
- Top points to the head node.
- Push and pop at the head take strict O(1) time always.
- Uses more memory because every node stores an extra pointer.
```

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

  isEmpty() {
    return this.count === 0;
  }

  size() {
    return this.count;
  }
}
```

> [!NOTE]
> **Self-Check:** Why should you use `push()` and `pop()` instead of `unshift()` and `shift()` for an array stack?  
> *Answer:* `push` and `pop` add and remove items at the end of the array in fast $O(1)$ time. `unshift` and `shift` add or remove from index 0, forcing JavaScript to shift every single item in memory ($O(n)$ slow time).

---

### 1.2 Call Stack Mechanics

The V8 JavaScript engine uses an internal call stack to track running functions. Whenever a function is called, V8 puts a frame on top of its call stack with its local variables and return address:

```text
EXECUTION CALL STACK:

function third()  { console.trace(); }
function second() { third(); }
function first()  { second(); }

Call trace:
┌──────────────────────┐
│  third() frame       │ ◄── Running right now (Top)
├──────────────────────┤
│  second() frame      │
├──────────────────────┤
│  first() frame       │
├──────────────────────┤
│  global / main()     │ ◄── Bottom
└──────────────────────┘
```

When a function finishes, V8 pops it off the stack and goes back to the function below it. If a function keeps calling itself without stopping, the call stack runs out of space (around ~10,000 frames) and crashes with `RangeError: Maximum call stack size exceeded`.

> [!NOTE]
> **Self-Check:** If you replace recursion with an iterative stack using a while loop, where does the memory go?  
> *Answer:* The memory moves from V8's small execution call stack to the normal heap memory, where it can safely use available system RAM without crashing the call stack.

---

### 1.3 Stack Methods Reference

| Method | Target | Time Complexity | Extra Space | Mutates List? | Example |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `push(val)` | Top of stack | $O(1)$ on average | $O(1)$ | Yes | `stack.push(42)` |
| `pop()` | Top of stack | $O(1)$ | $O(1)$ | Yes | `const val = stack.pop()` |
| `peek()` | Top of stack | $O(1)$ | $O(1)$ | No | `const top = stack.peek()` |
| `isEmpty()` | Entire stack | $O(1)$ | $O(1)$ | No | `if (stack.isEmpty()) return;` |
| `size()` | Entire stack | $O(1)$ | $O(1)$ | No | `const len = stack.size()` |

---

## 2. Expression Parsing Patterns

Math expressions can be written in three main ways:
1. **Infix Notation:** Operators sit between numbers (`A + B * C`). Needs parentheses and precedence rules.
2. **Prefix Notation:** Operators come before numbers (`+ A * B C`).
3. **Postfix Notation (Reverse Polish Notation):** Operators come after numbers (`A B C * +`). Needs zero parentheses because the order of tokens makes the calculation clear.

```text
POSTFIX EVALUATION TRACE: ["2", "1", "+", "3", "*"]

Token "2": Number   ──> Push 2        Stack: [ 2 ]
Token "1": Number   ──> Push 1        Stack: [ 2, 1 ]
Token "+": Operator ──> Pop b=1, a=2
                        Compute 2 + 1 = 3
                        Push 3        Stack: [ 3 ]
Token "3": Number   ──> Push 3        Stack: [ 3, 3 ]
Token "*": Operator ──> Pop b=3, a=3
                        Compute 3 * 3 = 9
                        Push 9        Stack: [ 9 ]

Final result: stack.pop() = 9
```

### 2.1 Pattern Family
* **Bracket Matching:** Storing opening brackets on a stack so every closing bracket matches the most recent open one.
* **Expression Evaluation:** Storing numbers on a stack until an operator appears, then popping the last two numbers to compute the result.
* **Tracking History:** Keeping a second stack (like a `minStack`) to find the smallest number in $O(1)$ time at any moment.

### 2.2 Pattern Recognition Table

| Problem Keyword | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| **"Balanced parentheses / brackets"** | Check if symbols open and close in correct order. | Stack holding expected closing symbols. |
| **"Evaluate arithmetic expression / RPN"** | Calculate math operations from tokens. | Number stack, pop 2 numbers on operator. |
| **"Simplify file path (`/a/./b/../../c/`)"** | Go up a folder on `..` tokens. | Path segment stack, pop on `..`. |
| **"Decode nested strings (`3[a2[c]]`)"** | Solve innermost brackets first. | Two stacks: `countStack` and `stringStack`. |
| **"Get minimum element in $O(1)$ time"** | Track smallest value as items come and go. | Dual stack: main stack and running `minStack`. |

### 2.3 When to Use vs When NOT to Use
* **When to Use**:
  * You need to match the most recently opened item first (innermost-first work).
  * You need to undo previous steps (like backspace, file path navigation, or undo buttons).
  * Calculating math expressions where operators act on preceding numbers.
  * Tracking a running minimum or maximum across pushes and pops.
* **When NOT to Use**:
  * The problem requires First-In, First-Out (FIFO) order (use a **Queue**).
  * You need to jump to arbitrary index positions (use an **Array**).
  * You need to look up items by key or check set membership (use a **Map** or **Set**).

### 2.4 The $10^7$ Operations Rule
For an array or string of length $n = 100,000$:
* Each item is pushed at most once and popped at most once ($2n = 200,000$ operations).
* This takes under 15 milliseconds in Node.js, staying far below the $10^7$ operations limit.

---

## 3. Problem Walkthroughs

---

### 3.1 Valid Parentheses

#### 3.1.1 Problem Statement
Given a string `s` containing only the characters `'('`, `')'`, `'{'`, `'}'`, `'['`, and `']'`, determine if the input string is valid.

An input string is valid if:
1. Open brackets are closed by the same type of brackets.
2. Open brackets are closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

* **Sample Input 1:** `s = "()[]{}"` $\to$ **Expected Output:** `true`
* **Sample Input 2:** `s = "(]"` $\to$ **Expected Output:** `false`
* **Sample Input 3:** `s = "([)]"` $\to$ **Expected Output:** `false`
* **Sample Input 4:** `s = "{[]}"` $\to$ **Expected Output:** `true`
* **Constraints:** $1 \le s.length \le 10^4$, `s` consists of parentheses only.

#### 3.1.2 How to Think About It
Imagine nesting cups inside a box:
* If you put a red cup `{` into the box, and then place a blue square cup `[` inside the red cup, the blue square cup is now on top.
* Before you can pack away the outer red cup, you must first close and remove the inner blue cup.
* If someone hands you a red lid `}` while the blue cup `[` is still open on top, the lid does not fit and the nesting is broken!
* Whenever you see an opening bracket, put it on top of your stack.
* Whenever you see a closing bracket, look at the top cup on your stack. It must be the exact match. If it matches, remove both.
* If the stack is completely empty at the end, the string is valid.

```text
Processing: "{ [ ] }"
1. Read '{': Push '{'            Stack: [ '{' ]
2. Read '[': Push '['            Stack: [ '{', '[' ]
3. Read ']': Closer matches '['! Pop '['. Stack: [ '{' ]
4. Read '}': Closer matches '{'! Pop '{'. Stack: [ ]
Stack is empty ──> VALID (true)
```

#### 3.1.3 Brute Force Approach & Bottleneck
Repeatedly searching for `"()"`, `"[]"`, and `"{}"` and erasing them from the string:

```javascript
function isValidBrute(s) {
  let prevLength = -1;
  while (s.length !== prevLength) {
    prevLength = s.length;
    s = s.replace("()", "").replace("[]", "").replace("{}", "");
  }
  return s.length === 0;
}
```

* **The Bottleneck:** Calling `replace()` scans the string and creates new string copies over and over. On nested strings like `"((((....))))"`, this causes $O(n^2)$ slow time.

#### 3.1.4 The Pattern Insight
Every closing bracket must match the **single most recently opened bracket**.  
A stack gives us direct $O(1)$ access to that top bracket.  
Also, if a string has an odd length, it can never be paired up, so we can return `false` right away.

#### 3.1.5 Pseudocode

```text
FUNCTION IsValid(s):
  IF length(s) is odd RETURN false

  pairs = { ')': '(', '}': '{', ']': '[' }
  stack = []

  FOR each char IN s:
    IF char IN pairs:
      top = stack.pop()
      IF top != pairs[char] RETURN false
    ELSE:
      stack.push(char)

  RETURN stack is empty
```

#### 3.1.6 Optimal Solution

```javascript
function isValid(s) {
  // Odd length strings cannot be partitioned into matching pairs
  if (s.length % 2 !== 0) {
    return false;
  }

  const matchingOpen = {
    ")": "(",
    "}": "{",
    "]": "["
  };

  const stack = [];

  for (let i = 0; i < s.length; i++) {
    const char = s[i];

    if (matchingOpen[char]) {
      // char is a closing bracket; top of stack must match its opener
      const top = stack.pop();
      if (top !== matchingOpen[char]) {
        return false;
      }
    } else {
      // char is an opening bracket; push onto stack
      stack.push(char);
    }
  }

  // All opening brackets must be matched and cleared
  return stack.length === 0;
}

// Example runs
console.log(isValid("()[]{}")); // true
console.log(isValid("{[]}"));   // true
console.log(isValid("(]"));     // false
console.log(isValid("([)]"));   // false
console.log(isValid("["));      // false
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Separate integer counters fail on interleaved ordering
function buggyIsValid(s) {
  let round = 0, square = 0, curly = 0;
  for (const c of s) {
    if (c === "(") round++; else if (c === ")") round--;
    if (c === "[") square++; else if (c === "]") square--;
    if (c === "{") curly++; else if (c === "}") curly--;
    if (round < 0 || square < 0 || curly < 0) return false;
  }
  // BUG: "([)]" returns true because total counts balance out,
  // but bracket nesting order is completely violated!
  return round === 0 && square === 0 && curly === 0;
}

console.log(buggyIsValid("([)]")); // true (Incorrectly marks invalid string as valid!)
```
* **Why it fails:** Counting brackets with numbers forgets the order in which they opened. In `"([)]"`, the counts balance, but the brackets overlap incorrectly.

#### 3.1.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. We check each character in the string once. Pushing and popping take $O(1)$ time.
* **Auxiliary Space Complexity:** $\mathbf{O(n)}$. In the worst case where all characters are opening brackets (like `"((((("`), the stack holds $n$ items.

---

### 3.2 Evaluate Reverse Polish Notation

#### 3.2.1 Problem Statement
You are given an array of strings `tokens` that represents an arithmetic expression in **Reverse Polish Notation** (postfix).

Evaluate the expression. Return an integer representing the value of the expression.

Valid operators are `"+"`, `"-"`, `"*"`, and `"/"`. Each operand may be an integer or another expression. Division between two integers must **truncate toward zero**.

* **Sample Input 1:** `tokens = ["2", "1", "+", "3", "*"]` $\to$ **Expected Output:** `9`  
  *(((2 + 1) * 3) = 9)*
* **Sample Input 2:** `tokens = ["4", "13", "5", "/", "+"]` $\to$ **Expected Output:** `6`  
  *(4 + (13 / 5) = 4 + 2 = 6)*
* **Sample Input 3:** `tokens = ["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"]` $\to$ **Expected Output:** `22`
* **Constraints:** $1 \le tokens.length \le 10^4$, each token is an operator or integer in range $[-200, 200]$.

#### 3.2.2 How to Think About It
Imagine reading cards from left to right:
* Numbers are written on blue cards.
* Operators (`+`, `-`, `*`, `/`) are on red cards.
* Whenever you pick up a blue number card, drop it onto a pile on your desk.
* Whenever you pick up a red operator card, grab the top two number cards from your pile.
* **Notice the order:** the card sitting on top was placed there most recently, so it is the **right number ($b$)**. The card below it is the **left number ($a$)**.
* Do the math (`a operator b`), write the answer on a new blue card, and put it back on top of your pile.
* When all cards are read, the single card left on the pile is your final answer!

#### 3.2.3 Brute Force Approach & Bottleneck
Searching for the first operator, doing the math with its two previous numbers, and calling `splice()` to replace them:

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

* **The Bottleneck:** Calling `splice()` shifts all remaining items in the array, taking $O(n)$ work per operator and causing slow $O(n^2)$ time overall.

#### 3.2.4 The Pattern Insight
A stack removes all array shifting:
* Every number is pushed onto the stack.
* When an operator arrives, pop two numbers, calculate the result in $O(1)$ time, and push the answer back.
* In JavaScript, division must round toward zero:
  - `Math.floor(-1.5)` gives `-2` (rounds down).
  - `Math.trunc(-1.5)` gives `-1` (cuts off the decimal part toward zero).
  - Always use `Math.trunc()`.

#### 3.2.5 Pseudocode

```text
FUNCTION EvalRPN(tokens):
  stack = []

  FOR each token IN tokens:
    IF token IS OPERATOR (+, -, *, /):
      b = stack.pop()
      a = stack.pop()
      IF token == '+': push a + b
      IF token == '-': push a - b
      IF token == '*': push a * b
      IF token == '/': push Math.trunc(a / b)
    ELSE:
      push Number(token)

  RETURN stack.pop()
```

#### 3.2.6 Optimal Solution

```javascript
function evalRPN(tokens) {
  const stack = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token === "+" || token === "-" || token === "*" || token === "/") {
      // The right operand was pushed last, so it pops first
      const b = stack.pop();
      const a = stack.pop();

      switch (token) {
        case "+":
          stack.push(a + b);
          break;
        case "-":
          stack.push(a - b);
          break;
        case "*":
          stack.push(a * b);
          break;
        case "/":
          // Math.trunc removes fractional digits, rounding towards zero
          stack.push(Math.trunc(a / b));
          break;
      }
    } else {
      stack.push(Number(token));
    }
  }

  return stack.pop();
}

// Example runs
console.log(evalRPN(["2", "1", "+", "3", "*"])); // 9
console.log(evalRPN(["4", "13", "5", "/", "+"])); // 6
console.log(evalRPN(["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"])); // 22
console.log(evalRPN(["4", "-2", "/", "2", "-3", "-", "-"])); // -7
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Inverted operand order and incorrect rounding function
function buggyEvalRPN(tokens) {
  const stack = [];
  for (const t of tokens) {
    if (t === "-") {
      const b = stack.pop(), a = stack.pop();
      stack.push(b - a); // BUG: Inverted subtraction order evaluates b - a instead of a - b
    } else if (t === "/") {
      const b = stack.pop(), a = stack.pop();
      stack.push(Math.floor(a / b)); // BUG: Math.floor(-0.5) is -1 instead of 0
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
```
* **Why it fails:** Subtraction and division are not reversible. The first popped item is $b$ and the second is $a$. Writing `b - a` flips the signs. Using `Math.floor()` rounds negative numbers away from zero instead of toward zero.

#### 3.2.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. We visit each of the $n$ tokens once. Every push, pop, and math operation runs in $O(1)$ time.
* **Auxiliary Space Complexity:** $\mathbf{O(n)}$. The stack stores at most $(n + 1) / 2$ numbers.

---

### 3.3 Min Stack

#### 3.3.1 Problem Statement
Design a stack that supports `push`, `pop`, `top`, and retrieving the minimum element in constant $O(1)$ time.

Implement the `MinStack` class:
- `MinStack()` initializes the stack object.
- `void push(int val)` pushes the element `val` onto the stack.
- `void pop()` removes the element on the top of the stack.
- `int top()` gets the top element of the stack.
- `int getMin()` retrieves the minimum element in the stack.

You must implement a solution with $O(1)$ time complexity for each method.

* **Sample Input:**
  ```javascript
  const minStack = new MinStack();
  minStack.push(-2);
  minStack.push(0);
  minStack.push(-3);
  minStack.getMin(); // return -3
  minStack.pop();
  minStack.top();    // return 0
  minStack.getMin(); // return -2
  ```
* **Constraints:** $-2^{31} \le val \le 2^{31} - 1$, methods called at most $3 \times 10^4$ times.

#### 3.3.2 How to Think About It
Imagine writing numbers in a notebook.  
If you write down the smallest number on a single sticky note, what happens when that smallest number gets erased from the notebook? You have no idea what the previous smallest number was without reading through the whole notebook again!  
To fix this, keep a twin helper notebook right beside your main notebook:
* When you write a number in the main notebook, check the helper notebook.
* Ask: "Is this new number smaller than or equal to the lowest number currently on top of the helper notebook?"
* If yes, write it down on top of the helper notebook too.
* When you erase a number from the main notebook, if it matches the number on top of the helper notebook, erase it from the helper notebook as well.
* The top of your helper notebook will always hold the current minimum!

```text
Operations:
1. push(-2)  ──> Main: [ -2 ]       MinStack: [ -2 ]
2. push(0)   ──> Main: [ -2, 0 ]    MinStack: [ -2 ]       (0 is not <= -2)
3. push(-3)  ──> Main: [ -2, 0, -3] MinStack: [ -2, -3 ]   (-3 <= -2)
4. getMin()  ──> Reads MinStack top ──> -3
5. pop()     ──> Pops -3 from Main. Matches MinStack top! Pop -3 from MinStack.
                 Main: [ -2, 0 ]    MinStack: [ -2 ]
6. top()     ──> Reads Main top ──> 0
7. getMin()  ──> Reads MinStack top ──> -2
```

#### 3.3.3 Brute Force Approach & Bottleneck
Using a normal array and computing the minimum using `Math.min(...this.stack)`:

```javascript
class SlowMinStack {
  constructor() {
    this.stack = [];
  }
  push(val) { this.stack.push(val); }
  pop() { return this.stack.pop(); }
  top() { return this.stack[this.stack.length - 1]; }
  getMin() {
    return Math.min(...this.stack); // O(n) scan!
  }
}
```

* **The Bottleneck:** Calling `getMin()` searches through the whole array every time, taking $O(n)$ time instead of the required $O(1)$ constant time.

#### 3.3.4 The Pattern Insight
Keep a parallel `minStack`.  
Whenever `val <= currentMin`, push `val` onto `minStack`.  
When `pop()` removes a value that equals the top of `minStack`, pop from `minStack` too.  
This keeps track of the minimum at every level in $O(1)$ time.

#### 3.3.5 Pseudocode

```text
CLASS MinStack:
  CONSTRUCTOR():
    primaryStack = []
    minStack = []

  METHOD push(val):
    primaryStack.push(val)
    IF minStack IS EMPTY OR val <= minStack.top():
      minStack.push(val)

  METHOD pop():
    val = primaryStack.pop()
    IF val == minStack.top():
      minStack.pop()

  METHOD top():
    RETURN primaryStack.top()

  METHOD getMin():
    RETURN minStack.top()
```

#### 3.3.6 Optimal Solution

```javascript
class MinStack {
  constructor() {
    this.stack = [];
    this.minStack = [];
  }

  push(val) {
    this.stack.push(val);

    // If minStack is empty or val <= current minimum, record it on minStack
    if (
      this.minStack.length === 0 ||
      val <= this.minStack[this.minStack.length - 1]
    ) {
      this.minStack.push(val);
    }
  }

  pop() {
    if (this.stack.length === 0) return;

    const val = this.stack.pop();

    // If the removed element was the minimum, pop from minStack too
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

// Example runs
const minStack = new MinStack();
minStack.push(-2);
minStack.push(0);
minStack.push(-3);
console.log(minStack.getMin()); // -3
minStack.pop();
console.log(minStack.top());    // 0
console.log(minStack.getMin()); // -2
minStack.push(-2);
console.log(minStack.getMin()); // -2
minStack.pop();
console.log(minStack.getMin()); // -2
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Using strict less-than (<) instead of less-than-or-equal (<=)
class BuggyMinStack {
  constructor() {
    this.stack = [];
    this.minStack = [];
  }
  push(val) {
    this.stack.push(val);
    // BUG: If duplicate minimums are pushed (e.g. 2, then 2),
    // strict '<' skips the second 2!
    if (this.minStack.length === 0 || val < this.minStack[this.minStack.length - 1]) {
      this.minStack.push(val);
    }
  }
  pop() {
    const val = this.stack.pop();
    if (val === this.minStack[this.minStack.length - 1]) {
      this.minStack.pop();
    }
  }
  getMin() { return this.minStack[this.minStack.length - 1]; }
}

const buggy = new BuggyMinStack();
buggy.push(2);
buggy.push(2);
buggy.pop();
// BUG: minStack is now empty or corrupted because only one '2' was recorded!
console.log(buggy.getMin()); // undefined
```
* **Why it fails:** If the minimum value appears more than once (like pushing `2`, then `2`), using `<` fails to record the second `2`. When the first `2` is popped, the minimum is lost completely. Always use `<=`.

#### 3.3.8 Complexity Derivation
* **Time Complexity:**
  - `push(val)`: $\mathbf{O(1)}$.
  - `pop()`: $\mathbf{O(1)}$.
  - `top()`: $\mathbf{O(1)}$.
  - `getMin()`: $\mathbf{O(1)}$.
* **Auxiliary Space Complexity:** $\mathbf{O(n)}$. In the worst case where numbers arrive in decreasing order (`5, 4, 3, 2, 1`), `minStack` stores $n$ items.

---

## 4. Tricky Edge Cases

* **Popping an Empty Stack:** Calling `.pop()` on an empty array returns `undefined`. Always provide safety checks or default values (`?? null`).
* **Odd Length Strings in Bracket Matching:** Any string with an odd length cannot have matching pairs. Check `if (s.length % 2 !== 0) return false;` at the start to save time.
* **Unclosed Brackets Left Over:** Inputs like `"((("` never trigger a closer mismatch. You must check `stack.length === 0` at the end instead of just returning `true`.
* **Rounding Negative Division:** In JavaScript, `Math.floor(-6 / 132)` gives `-1` because it rounds down. `Math.trunc(-6 / 132)` cuts off the decimal toward zero, returning `0`.
* **Order of Operands in Division and Subtraction:** In postfix math, the first popped item is the **right number** ($b$) and the second popped item is the **left number** ($a$). Doing `b - a` or `b / a` will give the wrong answer.
* **Duplicate Minimums in MinStack:** Always use `val <= currentMin` so duplicate minimum values are recorded on `minStack`.

---

## 5. Summary Cheat Sheet

* **LIFO Model:** Items are added and removed only from the top in $O(1)$ fast time.
* **Array vs Linked List:** Array stacks (`push`/`pop`) are cache-friendly; linked list stacks provide strict $O(1)$ time without resizing delays.
* **Call Stack vs Heap Memory:** V8's function call stack has a limit (~10,000 calls). Moving recursive algorithms to an iterative stack in heap memory avoids call stack crashes.
* **Bracket Matching:** Opening brackets push to stack; closing brackets pop and check for a match. The stack must be empty when the loop finishes.
* **Postfix Notation:** Numbers wait on a stack until an operator arrives. Pop the right number first, then the left number. Use `Math.trunc()` for division.
* **MinStack Invariant:** Keep a second `minStack` tracking minimums. Use `<=` when pushing so duplicate minimums are saved.

---

## 6. Practice Problems

### 6.1 Simplify Path

Given an absolute Unix-style file path `path` starting with a slash `'/'`, transform it into its simplified canonical path.

In Unix path rules:
- A single period `'.'` means the current folder.
- A double period `'..'` moves up to the parent folder.
- Multiple consecutive slashes `'///'` count as a single slash `'/'`.

Return the simplified canonical path.

* **Difficulty:** Medium | **Focus:** Path Token Stack
* **Sample Input 1:** `path = "/home/"` $\to$ **Expected Output:** `"/home"`
* **Sample Input 2:** `path = "/../"` $\to$ **Expected Output:** `"/"`
* **Sample Input 3:** `path = "/home//foo/"` $\to$ **Expected Output:** `"/home/foo"`
* **Constraints:** $1 \le path.length \le 3000$, `path` consists of letters, digits, periods, and slashes.
* **Hint 1:** Split the path string by `'/'` to get folder names.
* **Hint 2:** Walk through the tokens. Skip empty strings and single dots `'.'`.
* **Hint 3:** When `'..'` appears, pop the last folder from your stack if the stack is not empty. Push valid folder names, then join with `'/'`.

---

### 6.2 Decode String

Given an encoded string `s`, return its decoded representation.

The encoding rule is: `k[encoded_string]`, where the `encoded_string` inside square brackets is repeated exactly `k` times. `k` is guaranteed to be a positive integer.

* **Difficulty:** Medium | **Focus:** Nested Expression Unwinding
* **Sample Input 1:** `s = "3[a]2[bc]"` $\to$ **Expected Output:** `"aaabcbc"`
* **Sample Input 2:** `s = "3[a2[c]]"` $\to$ **Expected Output:** `"accaccacc"`
* **Sample Input 3:** `s = "2[abc]3[cd]ef"` $\to$ **Expected Output:** `"abcabccdcdcdef"`
* **Constraints:** $1 \le s.length \le 30$, `s` consists of digits, lowercase letters, and square brackets.
* **Hint 1:** Use two stacks: one for numbers (`countStack`) and one for text (`stringStack`).
* **Hint 2:** Numbers can have multiple digits (like `12[a]`), so keep building the number until you see `'['`.
* **Hint 3:** When you see `']'`, pop the last number and the previous text string, repeat the current text, and attach it to the previous text.

---

### 6.3 Basic Calculator II

Given a string `s` representing an arithmetic expression consisting of non-negative integers, `'+'`, `'-'`, `'*'`, `'/'`, and spaces, evaluate the expression and return its value.

Integer division should truncate toward zero. You may not use built-in `eval()`.

* **Difficulty:** Medium | **Focus:** Operator Precedence Stack
* **Sample Input 1:** `s = "3+2*2"` $\to$ **Expected Output:** `7`
* **Sample Input 2:** `s = " 3/2 "` $\to$ **Expected Output:** `1`
* **Sample Input 3:** `s = " 3+5 / 2 "` $\to$ **Expected Output:** `5`
* **Constraints:** $1 \le s.length \le 3 \times 10^5$, `s` consists of integers and operators `+`, `-`, `*`, `/`.
* **Hint 1:** Keep a number variable and track the `currentSign` starting with `'+'`.
* **Hint 2:** Multiplication and division come before addition and subtraction. When you see `*` or `/`, pop the top number from the stack, do the multiplication or division right away, and push the answer back.
* **Hint 3:** For `+` and `-`, push the number (or `-number`) onto the stack. At the end, add up all numbers left on the stack.

---

<nav aria-label="Lecture navigation">

[Previous: Linked List Reversals & Cycle Detection](day-12-linked-list-reversals-and-cycle-detection.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Monotonic Stack Patterns](day-14-monotonic-stack-patterns.md)

</nav>
