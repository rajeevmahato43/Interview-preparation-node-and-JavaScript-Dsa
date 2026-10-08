# Day 17: Valid Parentheses and Expression Parsing

<nav aria-label="Lecture navigation">

[Previous: Stack Fundamentals and LIFO Architecture](day-16-stack-fundamentals-and-lifo.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Monotonic Stack Patterns](day-18-monotonic-stack-patterns.md)

</nav>
## Prerequisites

- [Day 02: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md) — JavaScript object mapping and array methods.
- [Day 16: Stack Fundamentals and LIFO Architecture](day-16-stack-fundamentals-and-lifo.md) — LIFO primitives (`push`, `pop`, `peek`).
---

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             LIFO BRACKET MATCHING PIPELINE                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Input String: "{ [ ( ) ] }"

  1. Read '{' ──> Push '{' ──> Stack: [ '{' ]
  2. Read '[' ──> Push '[' ──> Stack: [ '{', '[' ]
  3. Read '(' ──> Push '(' ──> Stack: [ '{', '[', '(' ]
  4. Read ')' ──> Closing bracket: Pop '(' from stack. Match! ──> Stack: [ '{', '[' ]
  5. Read ']' ──> Closing bracket: Pop '[' from stack. Match! ──> Stack: [ '{' ]
  6. Read '}' ──> Closing bracket: Pop '{' from stack. Match! ──> Stack: [ ] (Empty -> VALID!)
```

## 1. The Bracket Matching Invariant

> **Bracket Matching Invariant**: The structural rule that the most recently opened delimiter must be the first delimiter closed.

When parsing nested syntactic tokens (HTML/XML tags, JSON formatting, mathematical expressions, or source code):
> **Every closing delimiter must match the most recently opened, unclosed delimiter.**

Why a counter fails:
A counter can tally that there is one `{` and one `}`, but it cannot detect **interleaved invalid nesting**:
`"{ [ ( ] ) }"` has equal bracket counts, but is syntactically invalid because `]` cannot close before `(`. A LIFO stack preserves exact temporal ordering.

```javascript
// Node.js code
"use strict";

// ✅ PATTERN: Valid Parentheses (LeetCode 20) in O(n) time, O(n) space
function isValid(s) {
  // Guard 1: Odd-length strings can never be balanced
  if (s.length % 2 !== 0) return false;

  const stack = [];
  const matchMap = {
    ")": "(",
    "}": "{",
    "]": "["
  };

  for (let i = 0; i < s.length; i++) {
    const char = s[i];

    if (char in matchMap) {
      // Closing bracket: check if stack top matches expected opening bracket
      if (stack.length === 0 || stack[stack.length - 1] !== matchMap[char]) {
        return false;
      }
      stack.pop();
    } else {
      // Opening bracket: push onto stack
      stack.push(char);
    }
  }

  // Valid only if all opened brackets were successfully matched
  return stack.length === 0;
}

console.log("Is '{[()]}' valid?", isValid("{[()]}")); // true
console.log("Is '{[(])}' valid?", isValid("{[(])}")); // false
```

---

## 2. Path Normalization: Simplify Path (Unix `cd`)

In Unix-style file systems, absolute paths are formatted with directories separated by slashes (`/`):
- `.` represents the current directory $\to$ Ignore.
- `..` represents moving up one level to the parent directory $\to$ Pop from stack (if stack is non-empty).
- Consecutive slashes (`//`) $\to$ Treat as a single slash.
- Any valid directory name $\to$ Push onto stack.

```javascript
// Node.js code
function simplifyPath(path) {
  const stack = [];
  const segments = path.split("/");

  for (const segment of segments) {
    // Ignore empty tokens from consecutive slashes and current directory '.'
    if (segment === "" || segment === ".") {
      continue;
    }

    if (segment === "..") {
      // Navigate to parent directory (pop if not at root)
      if (stack.length > 0) {
        stack.pop();
      }
    } else {
      // Valid directory name
      stack.push(segment);
    }
  }

  // Format canonical absolute path
  return "/" + stack.join("/");
}

console.log(simplifyPath("/a/./b/../../c/")); // "/c"
console.log(simplifyPath("/home//foo/"));     // "/home/foo"
console.log(simplifyPath("/../"));            // "/"
```
- **Time Complexity:** $O(n)$ — splitting and scanning tokens takes linear time.
- **Auxiliary Space:** $O(n)$ — stack holds tokens.

---

## 3. Reverse Polish Notation (RPN) Expression Evaluation

> **Reverse Polish Notation (RPN)**: A postfix mathematical notation where operators strictly follow their operands.

In postfix notation, operators follow their operands: `["2", "1", "+", "3", "*"]` represents $(2 + 1) \times 3 = 9$.

#### The Non-Commutative Operand Rule:
Addition and multiplication are commutative ($A + B = B + A$).
However, **subtraction and division are non-commutative**:
- When an operator is evaluated, the first element popped is the **right operand** ($B$).
- The second element popped is the **left operand** ($A$).
- Evaluation must be: $A - B$ or $A / B$.

```javascript
// Node.js code
function evalRPN(tokens) {
  const stack = [];

  for (const token of tokens) {
    if (token === "+" || token === "-" || token === "*" || token === "/") {
      // Pop right operand first, left operand second
      const right = stack.pop();
      const left = stack.pop();

      if (token === "+") stack.push(left + right);
      else if (token === "-") stack.push(left - right);
      else if (token === "*") stack.push(left * right);
      else if (token === "/") stack.push(Math.trunc(left / right)); // Truncate toward zero
    } else {
      stack.push(Number(token));
    }
  }

  return stack[0];
}

console.log("RPN Result:", evalRPN(["4", "13", "5", "/", "+"])); // 6 (4 + trunc(13/5) = 4 + 2 = 6)
```

#### Trace: `evalRPN(["4", "13", "5", "/", "+"])`

| Token | Token Type | Action Taken | Stack State (Bottom $\to$ Top) |
|---|---|---|---|
| `"4"` | Number | Push `4` | `[ 4 ]` |
| `"13"` | Number | Push `13` | `[ 4, 13 ]` |
| `"5"` | Number | Push `5` | `[ 4, 13, 5 ]` |
| `"/"` | Operator | Pop $R=5, L=13$. `Math.trunc(13 / 5) = 2`. Push `2` | `[ 4, 2 ]` |
| `"+"` | Operator | Pop $R=2, L=4$. $4 + 2 = 6$. Push `6` | `[ 6 ]` |

---

## 4. Node.js Security: Directory Traversal Prevention

In Express.js static file servers, an attacker might request:
`GET /static?file=../../../../etc/passwd`

If the backend naively concatenates `path.join(ROOT_DIR, req.query.file)` without boundary validation, the resolved path escapes the server sandbox.

```javascript
// Node.js code
import path from "node:path";

function safeResolvePath(baseDir, userInput) {
  // Normalize and resolve canonical absolute path
  const safePath = path.resolve(baseDir, "." + path.sep + userInput);

  // Security Invariant: The resolved path MUST start with baseDir!
  if (!safePath.startsWith(baseDir)) {
    throw new Error("Access Denied: Path Traversal Detected!");
  }

  return safePath;
}

const ROOT = "d:/Workplace/public";
console.log(safeResolvePath(ROOT, "images/logo.png")); // "d:/Workplace/public/images/logo.png"

try {
  safeResolvePath(ROOT, "../../../Windows/System32");
} catch (err) {
  console.log("Blocked attack:", err.message);
}
```

---

## Tricky Points and Edge Cases

### 1. Inverting Division and Subtraction Operands
```javascript
// ❌ BUG: Pops right first, then left, but evaluates right - left!
const right = stack.pop();
const left = stack.pop();
stack.push(right - left); // 5 - 10 = -5 instead of 10 - 5 = 5!
```

### 2. `Math.floor` vs `Math.trunc` for Negative Numbers
`Math.floor()` rounds down toward negative infinity:
`Math.floor(-7 / 3)` evaluates to `-3`.
However, programming languages and interview specifications mandate truncation **toward zero**:
`Math.trunc(-7 / 3)` correctly evaluates to `-2`.

### 3. An Elegant Alternative: Pushing Expected Closing Brackets
Instead of maintaining a dictionary and comparing opening brackets, push the **expected closing bracket** directly:
```javascript
// Node.js code
function isValidSlick(s) {
  const stack = [];
  for (const c of s) {
    if (c === '(') stack.push(')');
    else if (c === '{') stack.push('}');
    else if (c === '[') stack.push(']');
    else if (stack.length === 0 || stack.pop() !== c) return false;
  }
  return stack.length === 0;
}
```

---

## Hands-On Exercise

### Scenario
You are building an expression parser for an automated financial spreadsheet engine. You must implement a calculator for basic integer math with parentheses (e.g., `"1 + (2 - (3 + 4))"`). The string contains non-negative integers, `+`, `-`, `(`, `)`, and empty spaces.

### Buggy Code
```javascript
// Node.js code
function calculateBuggy(s) {
  // ❌ Bug: Naive eval() is a catastrophic Remote Code Execution vulnerability!
  // In an interview, using eval() is an automatic failure.
  return eval(s);
}
```

### Acceptance Criteria
1. Execute in $O(n)$ time and $O(n)$ auxiliary space using an explicit stack.
2. Accurately handle parenthesized subexpressions and unary negative signs inside parentheses.
3. Ignore whitespace characters without allocating split arrays.

### Solution Code

```javascript
// Node.js code
import assert from "node:assert/strict";

function calculate(s) {
  const stack = [];
  let currentNum = 0;
  let currentResult = 0;
  let sign = 1; // 1 for +, -1 for -

  for (let i = 0; i < s.length; i++) {
    const char = s[i];

    if (char >= "0" && char <= "9") {
      // Accumulate multi-digit numbers
      currentNum = currentNum * 10 + Number(char);
    } else if (char === "+") {
      currentResult += sign * currentNum;
      currentNum = 0;
      sign = 1;
    } else if (char === "-") {
      currentResult += sign * currentNum;
      currentNum = 0;
      sign = -1;
    } else if (char === "(") {
      // Push accumulated result and current sign onto stack before subexpression
      stack.push(currentResult);
      stack.push(sign);
      // Reset accumulator for inner expression
      currentResult = 0;
      sign = 1;
    } else if (char === ")") {
      // Complete current subexpression
      currentResult += sign * currentNum;
      currentNum = 0;

      // Pop sign preceding the parenthesis
      const prevSign = stack.pop();
      // Pop baseline result preceding the parenthesis
      const prevResult = stack.pop();

      currentResult = prevResult + prevSign * currentResult;
    }
  }

  // Flush remaining number
  currentResult += sign * currentNum;
  return currentResult;
}

// Verification Tests
assert.equal(calculate("1 + 1"), 2);
assert.equal(calculate(" 2-1 + 2 "), 3);
assert.equal(calculate("(1+(4+5+2)-3)+(6+8)"), 23);
assert.equal(calculate("1 - ( -2)"), 3);

console.log("✅ All Parenthesized Expression Calculator assertions passed successfully!");
```

### Solution Explanation

1. **Stacking Context Frames:** When encountering `(`, the function pushes both `currentResult` and `sign` onto the stack, establishing a clean execution frame for the inner expression.
2. **Context Resolution:** When encountering `)`, the subexpression evaluates and multiplies by the popped `prevSign`, adding onto `prevResult` in $O(1)$ time.

---

## Summary

- The **Bracket Matching Pattern** enforces that the most recently opened bracket must be the first bracket closed.
- Odd-length bracket strings are invalid by definition; check `s.length % 2 !== 0` for an immediate $O(1)$ early exit.
- **Simplify Path** normalizes Unix paths by segmenting strings and popping directory tokens on `..`.
- In **Reverse Polish Notation**, operands pop in reverse order ($R$ then $L$), and integer division must truncate toward zero via `Math.trunc()`.
- Defend Node.js file servers against path traversal by combining `path.resolve()` with `startsWith(ROOT_DIR)`.

---

## Cheat Sheet

### Common Parsing Patterns
```javascript
// 1. Bracket Matcher Check
if (stack.length === 0 || stack.pop() !== expectedClosing) return false;

// 2. RPN Evaluation
const right = stack.pop();
const left = stack.pop();
stack.push(Math.trunc(left / right));

// 3. Unix Path Tokenizing
const segments = path.split("/").filter(p => p !== "" && p !== ".");
```

### Common Pitfalls
- **Using `Math.floor` instead of `Math.trunc`:** Rounds negative division results away from zero.
- **Inverted Operand Order:** Writing `right - left` instead of `left - right`.
- **Unclosed Openers:** Forgetting to verify `stack.length === 0` at the conclusion of parsing.
- **Security Path Traversal:** Failing to verify that resolved paths begin with the allowed root directory.

---

## Interview Questions

### 1. Why does a regular expression or a numeric counter fail to validate nested bracket strings with multiple types like `"{[(])}"`?

**Question:** Explain the computational limitations of regular expressions and numeric counters when parsing interleaved bracket strings.

**Answer:** 
1. **The Limitation of Numeric Counters:**
   - A numeric counter increments on opening delimiters and decrements on closing delimiters.
   - For string `"{[(])}"`, there is one `{`, one `}`, one `[`, one `]`, one `(`, and one `)`.
   - Counters for each bracket type all end at 0, falsely concluding that the string is balanced. Counters measure **frequency**, but completely ignore **sequential ordering and nesting hierarchy**.
2. **The Limitation of Regular Expressions:**
   - Standard regular expressions define regular languages (Chomsky hierarchy Type 3), which can be matched using finite state automata with finite memory.
   - Nested balanced brackets represent a **Context-Free Grammar (Type 2)**, which requires an unbounded memory stack (Pushdown Automaton) to pair nested openings with corresponding closings.
   - A LIFO stack provides this pushdown automaton, preserving the exact sequence of open delimiters and detecting that `]` was encountered when `(` was the active top delimiter.

---

### 2. What does this code return for `s = "()[]{}"`, and what is the advantage of pushing expected closing brackets?

**Question:** Walk through the execution of this bracket matcher and explain why pushing expected closing brackets is advantageous:
```javascript
function test(s) {
  const stack = [];
  for (const c of s) {
    if (c === '(') stack.push(')');
    else if (c === '{') stack.push('}');
    else if (c === '[') stack.push(']');
    else if (stack.length === 0 || stack.pop() !== c) return false;
  }
  return stack.length === 0;
}
```

**Answer:**
The function returns `true`.

**Why Pushing Closing Brackets is Advantageous:**
In the standard approach, opening brackets are pushed onto the stack. When a closing bracket is encountered, the algorithm must look up the closing bracket in a dictionary object to find its corresponding opener, read the stack top, and compare:
`matchMap[c] === stack.pop()`.

By pushing the **expected closing bracket** onto the stack upon encountering an opening bracket:
1. When a closing character `c` arrives, the check simplifies to a direct equality comparison: `stack.pop() === c`.
2. This eliminates the dictionary lookup on the closing path, reduces branching logic, and results in cleaner, faster code.

---

### 3. How does Dijkstra's Shunting-Yard algorithm use two stacks to convert standard infix notation (`3 + 4 * 2`) to postfix notation?

**Question:** Explain the mechanics of the Shunting-Yard algorithm for parsing mathematical expressions.

**Answer:** 
Dijkstra's **Shunting-Yard algorithm** parses standard infix expressions (where operators reside between operands, e.g., `3 + 4 * 2`) into postfix Reverse Polish Notation using an **Operator Stack** and an **Output Queue**:
1. **Numbers (Operands):** Sent directly to the Output Queue.
2. **Operators (`+`, `-`, `*`, `/`):**
   - While the Operator Stack has an operator at the top with **greater or equal precedence**, pop it from the stack and send it to the Output Queue.
   - Push the incoming operator onto the Operator Stack.
3. **Left Parenthesis (`(`):** Pushed onto the Operator Stack to establish a sub-expression boundary.
4. **Right Parenthesis (`)`):** Pop operators from the Operator Stack to the Output Queue until a `(` is encountered. Pop and discard the `(`.
5. **Termination:** Flush any remaining operators from the stack to the Output Queue.

**Example: `3 + 4 * 2`**
- `3` $\to$ Output: `[3]`
- `+` $\to$ Stack: `['+']`
- `4` $\to$ Output: `[3, 4]`
- `*` $\to$ Precedence of `*` (2) > `+` (1), push to stack $\to$ Stack: `['+', '*']`
- `2` $\to$ Output: `[3, 4, 2]`
- End of tokens: Pop `*`, then `+` $\to$ Output: `[3, 4, 2, '*', '+']`.
- Postfix expression evaluates unambiguously: $4 \times 2 = 8 \to 3 + 8 = 11$.

---

### 4. In an Express.js API serving user-uploaded files, how does an un-sanitized path concatenation allow an attacker to read `/etc/passwd`, and how do you prevent it?

**Question:** Analyze the Path Traversal vulnerability in Node.js backends and provide the secure mitigation pattern.

**Answer:** 
**The Vulnerability:**
Consider a naive static file handler:
```javascript
app.get("/download", (req, res) => {
  const filePath = path.join("/var/www/uploads", req.query.file);
  res.sendFile(filePath);
});
```
If an attacker sends:
`GET /download?file=../../../../etc/passwd`
`path.join()` resolves the relative segments:
`"/var/www/uploads/../../../../etc/passwd" \to "/etc/passwd"`
Because the server process has read access to the underlying filesystem, `res.sendFile()` serves the sensitive system file directly to the client.

**Secure Defense Pattern:**
1. Use `path.resolve()` with a safe relative prefix to produce a canonical absolute path.
2. Verify that the resolved path strictly begins with the intended root directory:
```javascript
const UPLOADS_DIR = path.resolve("/var/www/uploads");

app.get("/download", (req, res) => {
  // Prevent escaping via leading slashes or relative parent jumps
  const safePath = path.resolve(UPLOADS_DIR, "." + path.sep + req.query.file);

  // Invariant Guard
  if (!safePath.startsWith(UPLOADS_DIR)) {
    return res.status(403).json({ error: "Access Denied: Path Traversal Detected" });
  }

  res.sendFile(safePath);
});
```

---

<nav aria-label="Lecture navigation">

[Previous: Stack Fundamentals and LIFO Architecture](day-16-stack-fundamentals-and-lifo.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Monotonic Stack Patterns](day-18-monotonic-stack-patterns.md)

</nav>
