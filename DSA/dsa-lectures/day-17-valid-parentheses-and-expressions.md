# Day 17: Valid Parentheses and Expression Parsing

<nav aria-label="Lecture navigation">

[Previous: Stack Fundamentals and LIFO Architecture](day-16-stack-fundamentals-and-lifo.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Monotonic Stack Patterns](day-18-monotonic-stack-patterns.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Master the **Bracket Matching Pattern** using a LIFO stack and hash map lookup.
- Implement **Valid Parentheses** in $O(n)$ time with immediate early-return failure detection.
- Solve **Simplify Path** (Unix filesystem path normalization) using stack segmenting.
- Evaluate expressions in **Reverse Polish Notation (RPN)** without operator precedence ambiguity.
- Build safe expression parsers and URL/file-path sanitizers in Node.js backend services.

## Prerequisites

- [Day 02: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md)
- [Day 16: Stack Fundamentals and LIFO Architecture](day-16-stack-fundamentals-and-lifo.md)

---

## Core Concepts

### 1. The Bracket Matching Invariant

When parsing nested structures (HTML/XML tags, mathematical formulas, JSON delimiters, code blocks):
> **The most recently opened bracket must be the first bracket closed.**

This is a pure LIFO requirement:
1. When encountering an **opening bracket** (`(`, `{`, `[`): Push it (or its corresponding closing bracket) onto the stack.
2. When encountering a **closing bracket** (`)`, `}`, `]`):
   - If the stack is empty $\to$ Invalid! (Closing bracket with no opening counterpart).
   - If the top of the stack does not match $\to$ Invalid! (Mismatched bracket types).
   - If it matches $\to$ Pop from the stack and continue.
3. At the end of the input:
   - If the stack is empty $\to$ **Valid!**
   - If items remain $\to$ **Invalid!** (Unclosed opening brackets).

```text
String: "{ [ ( ) ] }"
Read '{' -> Stack: [ '{' ]
Read '[' -> Stack: [ '{', '[' ]
Read '(' -> Stack: [ '{', '[', '(' ]
Read ')' -> Top is '(' -> MATCH! Pop '(' -> Stack: [ '{', '[' ]
Read ']' -> Top is '[' -> MATCH! Pop '[' -> Stack: [ '{' ]
Read '}' -> Top is '{' -> MATCH! Pop '{' -> Stack: [ ] (Empty -> VALID!)
```

---

### 2. Path Normalization: Simplify Path (Unix `cd`)

A Unix-style file path consists of directories separated by slashes (`/`):
- `.` represents the current directory $\to$ Do nothing (ignore).
- `..` represents the parent directory $\to$ Move up one level (pop from stack).
- Multiple consecutive slashes (`//`) $\to$ Treat as a single slash.
- Any valid directory name $\to$ Push onto the stack.

```text
Path: "/a/./b/../../c/"
Split by '/': ["", "a", ".", "b", "..", "..", "c", ""]
Process segments:
"a"  -> push("a")  -> Stack: ["a"]
"."  -> ignore     -> Stack: ["a"]
"b"  -> push("b")  -> Stack: ["a", "b"]
".." -> pop()      -> Stack: ["a"]
".." -> pop()      -> Stack: [] (Root level reached)
"c"  -> push("c")  -> Stack: ["c"]

Result: "/" + stack.join("/") = "/c"
```

---

## Detailed Explanations & Node.js Relevance

### Node.js Security: Directory Traversal Prevention

In Node.js web servers, users often request static files via URL paths: `GET /files?path=../../etc/passwd`.
If your backend naively concatenates user input to the file root without normalizing, an attacker can escape the web root and read sensitive system files (Path Traversal Attack).
The internal implementation of Node.js's native `path.normalize()` and `path.resolve()` uses the exact stack segmenting algorithm taught today to strip malicious `..` segments.

---

## JavaScript Implementation & Tracing

### 1. Valid Parentheses (LeetCode 20)

```js
function isValid(s) {
  // Odd length strings can never be fully paired
  if (s.length % 2 !== 0) return false;

  const stack = [];
  // Map closing brackets to their expected opening counterparts
  const matchMap = {
    ")": "(",
    "}": "{",
    "]": "["
  };

  for (let i = 0; i < s.length; i++) {
    const char = s[i];

    if (char in matchMap) {
      // Closing bracket: check if stack matches expected opening bracket
      if (stack.length === 0 || stack[stack.length - 1] !== matchMap[char]) {
        return false;
      }
      stack.pop();
    } else {
      // Opening bracket: push onto stack
      stack.push(char);
    }
  }

  // Valid only if all opened brackets were closed
  return stack.length === 0;
}
```

### 2. Evaluate Reverse Polish Notation (LeetCode 150)

In Reverse Polish Notation (postfix notation), operators follow their operands: `["2", "1", "+", "3", "*"]` = $(2 + 1) \times 3 = 9$.

```js
function evalRPN(tokens) {
  const stack = [];

  for (const token of tokens) {
    if (token === "+" || token === "-" || token === "*" || token === "/") {
      // Pop operands in reverse order: second popped is left operand!
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
```

### Trace: `evalRPN(["4", "13", "5", "/", "+"])`

| Token | Type | Action | Stack State (Bottom $\to$ Top) |
| :--- | :--- | :--- | :--- |
| `"4"` | Number | Push `4` | `[4]` |
| `"13"` | Number | Push `13` | `[4, 13]` |
| `"5"` | Number | Push `5` | `[4, 13, 5]` |
| `"/"` | Operator | `R=5, L=13`. `Math.trunc(13 / 5) = 2`. Push `2` | `[4, 2]` |
| `"+"` | Operator | `R=2, L=4`. `4 + 2 = 6`. Push `6` | `[6]` |

Final result: `6`.
- **Time Complexity**: $O(n)$ where $n$ is `tokens.length`.
- **Auxiliary Space**: $O(n)$ to hold numbers on the stack.

---

## Common Mistakes & Interview Traps

1. **Operand Order in Subtraction and Division**:
   ```js
   // WRONG:
   const right = stack.pop();
   const left = stack.pop();
   stack.push(right - left); // INVERTED! Division and subtraction are NOT commutative!
   // CORRECT:
   stack.push(left - right);
   ```
2. **Division Truncation in JavaScript**:
   `Math.floor(-3 / 2)` evaluates to `-2` (rounds down toward $-\infty$).
   LeetCode and standard programming languages specify truncation **toward zero**: `Math.trunc(-3 / 2)` correctly evaluates to `-1`.
3. **Missing the Odd Length Check**:
   Adding `if (s.length % 2 !== 0) return false;` at the beginning of Valid Parentheses provides an instant $O(1)$ early exit for odd-length strings.

---

## Tricky Points & Edge Cases

- **Popping on Root Directory in Simplify Path**:
  When path is `"../../"` and stack is empty, popping does nothing because you cannot navigate above root directory `/`.
- **Unclosed Opening Brackets**:
  `s = "((("`: Every bracket is validly pushed, but stack length at the end is 3. Always return `stack.length === 0`.

---

## Practical Exercise

Implement **Simplify Path** (LeetCode 71):
Given an absolute Unix file path string, transform it into the simplified canonical path:
- No trailing slashes.
- Single slashes between directories.
- Must start with a slash `/`.
- **Acceptance Criterion**: Must run in $O(n)$ time using an array stack.

---

## Summary

- The LIFO bracket matching invariant guarantees that the most recent unclosed opening bracket is paired first.
- In Reverse Polish Notation, the first popped element is the right operand, and the second popped is the left operand.
- Path normalization splits on slashes and uses a stack to handle directory navigations and `..` rollbacks.
- In Node.js, stack-based path normalization protects web applications against path traversal security vulnerabilities.

---

## Cheat Sheet

### Bracket Matcher Pattern
```js
const map = { ')': '(', '}': '{', ']': '[' };
for (const c of s) {
  if (c in map) {
    if (stack.pop() !== map[c]) return false;
  } else {
    stack.push(c);
  }
}
return stack.length === 0;
```

### RPN Division Rule
```js
const right = stack.pop();
const left = stack.pop();
stack.push(Math.trunc(left / right)); // Always use Math.trunc
```

---

## Interview Questions

### 1. Deep Definitions and Mental Models
**Question:** Why does a regular expression or a single counter fail to validate nested bracket strings with multiple types like `"{[(])}"`?
- **Expected answer shape:** A simple numeric counter only tracks counts, not sequential ordering; it sees equal counts of brackets and assumes validity. Regular expressions cannot match arbitrary recursive nesting without grammar parsing. A Stack preserves the exact LIFO sequence of open brackets, detecting that `)` was encountered when `[` was expected on top.

### 2. Predict the Output and Trace Execution
**Question:** What does this code return for `s = "()[]{}"`?
```js
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
- **Expected answer shape:** Returns `true`. By pushing the *expected closing bracket* onto the stack when an opening bracket is seen, the closing check simplifies to `stack.pop() !== c`. This elegant pattern reduces dictionary lookups.

### 3. Implementation Exercise
**Question:** Write `simplifyPath(path)` in $O(n)$ time and $O(n)$ space.
- **Expected answer shape:**
```js
function simplifyPath(path) {
  const stack = [];
  const parts = path.split("/");
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      if (stack.length > 0) stack.pop();
    } else {
      stack.push(part);
    }
  }
  return "/" + stack.join("/");
}
```

### 4. Debugging and Failure Analysis
**Question:** An engineer implements RPN division using `stack.push(Math.floor(left / right))`. For input `["4", "-2", "/"]`, the test fails. Why?
- **Expected answer shape:** $4 / -2 = -2$. `Math.floor(-2)` is `-2`. But for `["7", "-3", "/"]`, $7 / -3 = -2.333$. `Math.floor(-2.333)` evaluates to `-3`, but the problem requires truncation toward zero (`-2`). `Math.trunc()` must be used.

### 5. Design and Tradeoff Questions
**Question:** How does Dijkstra’s Shunting-Yard algorithm use two stacks to convert standard infix notation (`3 + 4 * 2`) to postfix notation?
- **Expected answer shape:** It uses an **operator stack** and an **output queue**. Operands are sent directly to output. Operators are pushed onto the operator stack after popping any operators of higher or equal precedence. Parentheses enforce precedence: `(` is pushed, and `)` triggers popping operators to output until `(` is reached.

### 6. Senior Follow-ups: Node.js Security
**Question:** In an Express.js API serving user-uploaded files, how does an un-sanitized path concatenation allow an attacker to read `/etc/shadow`?
- **Expected answer shape:** If the code uses `fs.readFile(ROOT_DIR + req.query.file)`, an attacker sending `../../../../etc/shadow` navigates out of `ROOT_DIR`. To fix: use `path.resolve(ROOT_DIR, req.query.file)` and verify that the resolved path starts with the base directory (`resolvedPath.startsWith(ROOT_DIR)`).

<nav aria-label="Lecture navigation">

[Previous: Stack Fundamentals and LIFO Architecture](day-16-stack-fundamentals-and-lifo.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Monotonic Stack Patterns](day-18-monotonic-stack-patterns.md)

</nav>
