# Day 13: Stacks & Expression Parsing

<nav aria-label="Lecture navigation">

[Previous: Linked List Reversals & Cycle Detection](day-12-linked-list-reversals-and-cycle-detection.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Monotonic Stack Patterns](day-14-monotonic-stack-patterns.md)

</nav>

---

## 1. Stacks Foundation

A **Stack** is a linear data structure that strictly enforces the **LIFO (Last-In, First-Out)** access order. Elements can only be added to or removed from a single designated boundary: the **top** of the stack. The element added most recently is always the very first element to be retrieved or eliminated.

Imagine a spring-loaded plate dispenser in a cafeteria. Dishwashers load clean plates onto the top of the stack, pushing the spring downward. When a customer arrives, they take the topmost plate. The plate placed into the cylinder first sits at the very bottom and will only be taken once every single plate above it has been removed. If a customer attempts to pull a plate from an empty dispenser, an underflow condition occurs.

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

A basic stack in JavaScript can be implemented using native arrays where operations occur at the end of the array:

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

A stack can be backed by a dynamic array or a singly linked list. Each approach exhibits distinct runtime and memory characteristics:

```text
ARRAY-BACKED STACK:
Memory: [ 10 | 20 | 30 |  _  |  _  ]
- Top index points to end of array.
- Cache-friendly contiguous memory.
- push/pop is amortized O(1); resizing occasionally copies the buffer.

LINKED-LIST-BACKED STACK:
Memory: [ Top: 30 ] ──> [ 20 ] ──> [ 10 ] ──> null
- Top pointer points to head node.
- Push and pop operate at head in strict O(1) worst-case time.
- Overhead: each node allocates an object wrapper with an extra pointer reference.
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
> Self-Check: Why is `Array.prototype.push()` and `pop()` preferred over `unshift()` and `shift()` for array-based stacks?
> Answer: `push` and `pop` modify the end of the array in amortized $O(1)$ time. `unshift` and `shift` alter index 0, requiring V8 to shift every subsequent element in memory, causing an $O(n)$ bottleneck on every operation.

### 1.2 Call Stack Mechanics

The V8 runtime uses an internal call stack to manage function execution contexts. Whenever a function is invoked, V8 allocates a call frame containing local variables, arguments, and the return instruction address, then pushes it onto the execution stack:

```text
EXECUTION CALL STACK:

function third()  { console.trace(); }
function second() { third(); }
function first()  { second(); }

Call trace:
┌──────────────────────┐
│  third() frame       │ ◄── Active execution frame (Top)
├──────────────────────┤
│  second() frame      │
├──────────────────────┤
│  first() frame       │
├──────────────────────┤
│  global / main()     │ ◄── Bottom
└──────────────────────┘
```

When a function returns, V8 pops its frame from the stack and resumes execution in the caller frame below. If a function recursively calls itself without reaching a termination condition, call frames accumulate until exceeding V8's call stack limit (typically ~10,000 frames), resulting in a `RangeError: Maximum call stack size exceeded`.

> [!NOTE]
> Self-Check: If an iterative stack algorithm replaces recursion, where does the memory footprint move?
> Answer: The memory moves from V8's fixed-size execution call stack to the V8 managed heap, allowing data structures to grow up to available system RAM without triggering a call stack overflow.

### 1.3 Stack Methods Reference

| Method | Target | Time Complexity | Auxiliary Space | Mutates Container? | Example |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `push(val)` | Top boundary | $O(1)$ amortized | $O(1)$ | Yes | `stack.push(42)` |
| `pop()` | Top boundary | $O(1)$ | $O(1)$ | Yes | `const val = stack.pop()` |
| `peek()` | Top boundary | $O(1)$ | $O(1)$ | No | `const top = stack.peek()` |
| `isEmpty()` | Entire container | $O(1)$ | $O(1)$ | No | `if (stack.isEmpty()) return;` |
| `size()` | Entire container | $O(1)$ | $O(1)$ | No | `const len = stack.size()` |

---

## 2. Expression Parsing Patterns

Mathematical and hierarchical expressions exist in three primary notations:

1. **Infix Notation**: Operators appear between operands (`A + B * C`). Ambiguities require explicit precedence tables and grouping parentheses.
2. **Prefix Notation (Polish)**: Operators precede operands (`+ A * B C`).
3. **Postfix Notation (Reverse Polish Notation - RPN)**: Operators follow operands (`A B C * +`). Postfix eliminates all parentheses; operand order unambiguously dictates computation order.

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

Stack algorithms divide into three primary architectural families:

- **Symmetric Bracket Pairing**: Storing open delimiters on a stack to ensure every closing delimiter matches the most recently opened symbol.
- **Operand & Operator Evaluation**: Processing arithmetic streams in postfix or infix format, buffering numerical operands until triggered by an operator.
- **Historical State Tracking**: Maintaining parallel metadata stacks (such as running minimums or undo/redo states) to support constant-time queries across varying depths.

### 2.2 Pattern Recognition Table

| Problem Trigger / Keywords | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| "Balanced parentheses / matching brackets" | Verify symmetrical, ordered closure of symbols | LIFO stack storing expected closing tokens |
| "Evaluate arithmetic expression / RPN" | Compute mathematical tokens in sequential order | Operand stack with binary operator pops |
| "Simplify file path (`/a/./b/../../c/`)" | Evict historical segments on `..` tokens | Tokenized segment stack popping on `..` |
| "Decode nested strings (`3[a2[c]]`)" | Resolve innermost nested expressions outward | Dual stacks: `countStack` and `stringStack` |
| "Retrieve minimum element in constant time" | Track running boundary values across insertions | Dual stack: primary stack and running `minStack` |

### 2.3 When to Use vs When NOT to Use

- **When to Use**:
  - The problem requires matching the most recent unclosed item first (innermost-first resolution).
  - Processing requires reversing or unwinding previous actions (undo buffers, path normalization).
  - Evaluating expressions with operators acting on preceding operands.
  - Tracking running historical statistics (minimum, maximum) across dynamic pushes and pops.

- **When NOT to Use**:
  - The problem requires First-In, First-Out (FIFO) processing order (use a Queue).
  - Random access to arbitrary indices $i$ is required (use a flat Array).
  - Search operations require looking up values by key or testing set membership (use a Map or Set).

### 2.4 The $10^7$ Operations Rule

A single linear pass using a stack processes an input array or string of length $n = 10^5$ with each element being pushed at most once and popped at most once. This totals at most $2n$ operations.

$$2 \times 10^5 \text{ operations} \ll 10^7 \text{ budget}$$

Stack-based single-pass algorithms run in under 15 milliseconds in Node.js, scaling comfortably to inputs of size $n = 10^6$.

---

## 3. Problem Walkthroughs

### 3.1 Valid Parentheses

#### 3.1.1 Problem Statement
Given a string `s` containing only the characters `'('`, `')'`, `'{'`, `'}'`, `'['`, and `']'`, determine if the input string is valid.

An input string is valid if:
1. Open brackets are closed by the same type of brackets.
2. Open brackets are closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

```text
Input: s = "()[]{}"  ──> Output: true
Input: s = "(]"      ──> Output: false
Input: s = "([)]"    ──> Output: false
Input: s = "{[]}"    ──> Output: true
```

#### 3.1.2 How to Think About It
Imagine a set of physical nesting cups. If you place a red cup `{` into a box, and then place a blue square cup `[` inside the red cup, the blue square cup is now on top. 

Before you can close or pack away the outer red cup, you must first close and remove the inner blue cup. If someone hands you a red lid `}` while the blue cup `[` is still open on top, the lids clash and cannot seal. 

To validate any bracket string, whenever you encounter an opener, place it on top of your tray. Whenever you encounter a closer, check the topmost cup in the tray. It must match that exact shape. Once matched, discard both. If you reach the end of the line and the tray is completely empty, the nesting is valid.

```text
Processing: "{ [ ] }"
1. Read '{': Push '{'            Tray: [ '{' ]
2. Read '[': Push '['            Tray: [ '{', '[' ]
3. Read ']': Closer matches '['! Pop '['. Tray: [ '{' ]
4. Read '}': Closer matches '{'! Pop '{'. Tray: [ ]
Tray is empty ──> VALID (true)
```

#### 3.1.3 Brute Force Approach & Bottleneck
A brute-force strategy repeatedly searches for adjacent matching pairs `"()"`, `"[]"`, and `"{}"`, replacing them with empty strings until no pairs remain:

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

The bottleneck is repeated full-string scans and string reallocations. On nested strings like `"((((....))))"`, `replace()` scans the string and creates new string copies $n/2$ times. This leads to $O(n^2)$ time complexity and heavy garbage collection overhead.

#### 3.1.4 The Pattern Insight
Every closing bracket only pairs with the **single most recently opened unclosed bracket**. A LIFO stack provides constant-time $O(1)$ access to this exact element. 

Using a hash map to map each closing bracket to its required opening bracket allows instant validation of the top element. Furthermore, any string with an odd length can never form complete pairs and can be rejected immediately.

#### 3.1.5 Pseudocode
```text
function isValid(s):
  if length of s is odd:
    return false

  map pairs = { ')': '(', '}': '{', ']': '[' }
  stack = empty array

  for each char in s:
    if char is in pairs (it is a closing bracket):
      top = stack.pop() if stack not empty else null
      if top != pairs[char]:
        return false
    else:
      stack.push(char)

  return stack is empty
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

#### 3.1.8 Complexity Derivation
- **Time Complexity**: $O(n)$. We iterate through the string of length $n$ once. Each character involves an $O(1)$ dictionary lookup and an $O(1)$ array push or pop.
- **Auxiliary Space Complexity**: $O(n)$. In the worst case where all characters are opening brackets (e.g. `"((((("`), the stack stores up to $n$ characters.

---

### 3.2 Evaluate Reverse Polish Notation

#### 3.2.1 Problem Statement
You are given an array of strings `tokens` that represents an arithmetic expression in **Reverse Polish Notation** (postfix).

Evaluate the expression. Return an integer representing the value of the expression.

Valid operators are `"+"`, `"-"`, `"*"`, and `"/"`. Each operand may be an integer or another expression. Division between two integers must **truncate toward zero**.

```text
Input: tokens = ["2", "1", "+", "3", "*"]
Output: 9
Explanation: ((2 + 1) * 3) = 9

Input: tokens = ["4", "13", "5", "/", "+"]
Output: 6
Explanation: (4 + (13 / 5)) = 4 + 2 = 6

Input: tokens = ["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"]
Output: 22
```

#### 3.2.2 How to Think About It
Imagine a deck of cards laid out in front of you. Numbers are written on blue cards, and operations (`+`, `-`, `*`, `/`) are on red cards.

You pick up cards one by one from left to right. Whenever you see a blue number card, place it down on a discard pile. Whenever you see a red operation card, pick up the top two number cards from your discard pile. 

Notice the order: the card sitting on top was placed there most recently, so it represents the **right operand**. The card underneath it was placed earlier, representing the **left operand**. 

Perform the operation (`left op right`), write the result on a new blue card, and place it back on top of the discard pile. When all cards have been processed, exactly one card remains on your pile: the final answer.

```text
Tokens: ["4", "13", "5", "/", "+"]

Step 1: Read "4"   ──> Stack: [ 4 ]
Step 2: Read "13"  ──> Stack: [ 4, 13 ]
Step 3: Read "5"   ──> Stack: [ 4, 13, 5 ]
Step 4: Read "/"   ──> Pop b = 5, Pop a = 13
                       Compute 13 / 5 = 2 (truncated)
                       Push 2 ──> Stack: [ 4, 2 ]
Step 5: Read "+"   ──> Pop b = 2, Pop a = 4
                       Compute 4 + 2 = 6
                       Push 6 ──> Stack: [ 6 ]

Result: 6
```

#### 3.2.3 Brute Force Approach & Bottleneck
A naive array approach scans forward looking for the first operator, computes the operation with its two immediate preceding neighbors, and uses `tokens.splice()` to replace the three items with the result:

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

The bottleneck is `tokens.splice()`. On an array of length $n$, calling `splice()` shifts all remaining elements leftward, taking $O(n)$ time. Repeating this across $n/2$ operators degrades total runtime to $O(n^2)$.

#### 3.2.4 The Pattern Insight
A single LIFO operand stack eliminates all array shifting. Every numeric token is converted to a number and pushed onto the stack. When an operator arrives, two numbers are popped, evaluated in constant $O(1)$ time, and the result is pushed back. 

In JavaScript, division must truncate toward zero:
- `Math.floor(-1.5)` evaluates to `-2` (rounds down towards negative infinity).
- `Math.trunc(-1.5)` evaluates to `-1` (strips fractional digits towards zero).

Therefore, `Math.trunc()` is mandatory.

#### 3.2.5 Pseudocode
```text
function evalRPN(tokens):
  stack = empty array

  for each token in tokens:
    if token is operator (+, -, *, /):
      b = stack.pop()
      a = stack.pop()
      if token == '+': push a + b
      if token == '-': push a - b
      if token == '*': push a * b
      if token == '/': push Math.trunc(a / b)
    else:
      push Number(token)

  return stack.pop()
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

console.log(buggyEvalRPN(["4", "2", "-"])); // -2 instead of 2!
console.log(buggyEvalRPN(["1", "-2", "/"])); // -1 instead of 0!
```

#### 3.2.8 Complexity Derivation
- **Time Complexity**: $O(n)$. Each of the $n$ tokens is processed once. Every push, pop, and arithmetic operation executes in $O(1)$ time.
- **Auxiliary Space Complexity**: $O(n)$. The operand stack stores at most $(n + 1) / 2$ numbers simultaneously.

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

```text
Input:
["MinStack","push","push","push","getMin","pop","top","getMin"]
[[],[-2],[0],[-3],[],[],[],[]]

Output:
[null,null,null,null,-3,null,0,-2]

Explanation:
MinStack minStack = new MinStack();
minStack.push(-2);
minStack.push(0);
minStack.push(-3);
minStack.getMin(); // return -3
minStack.pop();
minStack.top();    // return 0
minStack.getMin(); // return -2
```

#### 3.3.2 How to Think About It
Imagine keeping a written ledger of numbers. If you only keep a single sticky note with the current minimum number written on it, what happens when that minimum number is erased from the ledger? You have no way of knowing what the previous minimum was without rereading the entire page from top to bottom.

To fix this, keep a second twin ledger right next to your main ledger:
- When you write a number in the main ledger, look at the second ledger. 
- Ask: "Is this new number smaller than or equal to the lowest number on the second ledger?"
- If yes, write this new number in the second ledger too.
- When an item is erased from the main ledger, if its value matches the top number on the second ledger, erase it from the second ledger as well.

The top of the second ledger always reflects the lowest active value currently present in the main ledger.

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
A naive implementation uses a single standard array for the stack and computes the minimum on demand using `Math.min(...this.stack)`:

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

The bottleneck is `getMin()`. Searching through the array takes $O(n)$ time on every call, violating the strict $O(1)$ requirement. Alternatively, storing a single `this.min` integer loses historical minimums upon calling `pop()`.

#### 3.3.4 The Pattern Insight
Minimum state is directly tied to stack depth. As elements are added, the running minimum can only decrease or stay the same. As elements are popped, the running minimum reverts to whatever was minimum before that element arrived. 

Maintaining a parallel `minStack` where we push `val` whenever `val <= currentMin` ensures the running minimum at every stack depth is preserved in $O(1)$ time.

#### 3.3.5 Pseudocode
```text
class MinStack:
  constructor():
    primaryStack = []
    minStack = []

  method push(val):
    primaryStack.push(val)
    if minStack is empty OR val <= minStack.top():
      minStack.push(val)

  method pop():
    val = primaryStack.pop()
    if val == minStack.top():
      minStack.pop()

  method top():
    return primaryStack.top()

  method getMin():
    return minStack.top()
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

#### 3.3.8 Complexity Derivation
- **Time Complexity**:
  - `push(val)`: $O(1)$.
  - `pop()`: $O(1)$.
  - `top()`: $O(1)$.
  - `getMin()`: $O(1)$.
- **Auxiliary Space Complexity**: $O(n)$. In the worst case where elements arrive in strictly decreasing order (`5, 4, 3, 2, 1`), `minStack` stores $n$ items.

---

## 4. Tricky Edge Cases

- **Empty Stack Popping**: Invoking `.pop()` or accessing `this.stack[length - 1]` on an empty container returns `undefined`. Always provide guard conditions or default fallbacks (`?? null`).
- **Odd Length Strings in Bracket Matching**: Any string with an odd character length cannot have balanced pairs. Immediate verification via `s.length % 2 !== 0` rejects invalid strings in $O(1)$ time before allocating stack memory.
- **Trailing Unclosed Brackets**: Inputs such as `"((("` never trigger a closing bracket failure during iteration. The final return check must verify `stack.length === 0` rather than simply returning `true` after the loop.
- **Negative Integer Division Truncation**: In JavaScript, `Math.floor(-6 / 132)` yields `-1` because it rounds down toward negative infinity. In contrast, `Math.trunc(-6 / 132)` truncates the fractional digits toward zero, returning `0`.
- **Operand Order in Non-Commutative Operations**: In expressions involving subtraction (`-`) or division (`/`), the first popped element is the **right operand** ($b$) and the second popped element is the **left operand** ($a$). Reversing them to `b - a` or `b / a` inverts signs and yields incorrect fractions.
- **Duplicate Minimum Values in MinStack**: If duplicate values equal to the current minimum are pushed, `minStack` must record each occurrence (`val <= currentMin`). Using strict inequality (`val < currentMin`) causes premature eviction of the minimum when the first duplicate is popped.

---

## 5. Summary Cheat Sheet

- **LIFO Access Model**: Elements are inserted and removed exclusively at the top boundary in constant $O(1)$ time.
- **Array vs Linked List**: Array stacks (`push`/`pop`) provide cache-friendly contiguous memory; linked list stacks provide strict $O(1)$ worst-case guarantees without dynamic resizing pauses.
- **Call Stack vs Heap Memory**: V8 execution call stacks have a fixed recursion ceiling (~10,000 frames). Moving recursive logic to an iterative heap-allocated stack avoids `RangeError` overflows.
- **Bracket Validation**: Open brackets push expected matches; closing brackets pop and verify equality. Complete validity requires an empty stack upon loop termination.
- **Reverse Polish Notation**: Operands are buffered on a stack until operators arrive. Pop right operand first, then left operand; evaluate with `Math.trunc()` for zero-truncated integer division.
- **MinStack Invariant**: Maintain a secondary `minStack` tracking minimums across depths. Use `<= ` during pushes to handle duplicate minimum values safely.

---

## 6. Practice Problems

### 6.1 Simplify Path
Given an absolute Unix-style file path `path` starting with a slash `'/'`, transform it into its simplified canonical path.

In Unix path conventions:
- A single period `'.'` refers to the current directory.
- A double period `'..'` moves up to the previous parent directory.
- Multiple consecutive slashes `'///'` are treated as a single slash `'/'`.

Return the simplified canonical path.

```text
Sample Input 1: path = "/home/"
Expected Output 1: "/home"

Sample Input 2: path = "/../"
Expected Output 2: "/"

Sample Input 3: path = "/home//foo/"
Expected Output 3: "/home/foo"
```

- *Hint 1*: Split the path string by `'/'` to obtain directory tokens.
- *Hint 2*: Iterate through the tokens. Ignore empty strings and single dots `'.'`.
- *Hint 3*: When `'..'` is encountered, pop the previous directory from your stack if the stack is not empty. Push valid directory names, then join with `'/'`.

### 6.2 Decode String
Given an encoded string `s`, return its decoded representation.

The encoding rule is: `k[encoded_string]`, where the `encoded_string` inside square brackets is repeated exactly `k` times. `k` is guaranteed to be a positive integer. You may assume the input string is always valid without stray brackets.

```text
Sample Input 1: s = "3[a]2[bc]"
Expected Output 1: "aaabcbc"

Sample Input 2: s = "3[a2[c]]"
Expected Output 2: "accaccacc"

Sample Input 3: s = "2[abc]3[cd]ef"
Expected Output 3: "abcabccdcdcdef"
```

- *Hint 1*: Use two separate stacks: one for repeating multipliers (`countStack`) and one for buffered character sequences (`stringStack`).
- *Hint 2*: Numbers can span multiple digits (e.g. `12[a]`), so accumulate digit characters until `'['` is met.
- *Hint 3*: When `']'` is reached, pop the last multiplier and the previous string buffer, then append the repeated current string onto the previous buffer.

### 6.3 Basic Calculator II
Given a string `s` representing a valid arithmetic expression consisting of non-negative integers, `'+'`, `'-'`, `'*'`, `'/'`, and empty spaces, evaluate the expression and return its value.

The integer division should truncate toward zero. You may not use built-in `eval()`.

```text
Sample Input 1: s = "3+2*2"
Expected Output 1: 7

Sample Input 2: s = " 3/2 "
Expected Output 2: 1

Sample Input 3: s = " 3+5 / 2 "
Expected Output 3: 5
```

- *Hint 1*: Maintain a number buffer and a `currentSign` tracker initialized to `'+'`.
- *Hint 2*: Multiplication and division have higher precedence than addition and subtraction. When encountering `*` or `/`, immediately pop the top number from the stack, compute the product or quotient, and push the result back.
- *Hint 3*: For `+` and `-`, push the number (or `-number`) directly to the stack. At the end, sum all numbers remaining on the stack.

---

<nav aria-label="Lecture navigation">

[Previous: Linked List Reversals & Cycle Detection](day-12-linked-list-reversals-and-cycle-detection.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Monotonic Stack Patterns](day-14-monotonic-stack-patterns.md)

</nav>
