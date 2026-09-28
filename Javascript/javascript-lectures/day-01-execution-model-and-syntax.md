# Day 01: JavaScript Execution Model and Grammar

<nav aria-label="Lecture navigation">

Previous | [Roadmap](../javascript-roadmap.md) | [Next: Variables, Declarations, and Scope Foundations](day-02-variables-scope-and-hoisting.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain the difference between ECMAScript, a JavaScript engine, and a host environment.
- Distinguish source text, lexical elements, expressions, statements, declarations, and blocks.
- Explain how scripts and modules differ at the language and host boundaries.
- Recognize JavaScript identifiers, keywords, reserved words, literals, comments, and line terminators.
- Predict when automatic semicolon insertion (ASI) can change parsing or behavior.
- Explain the purpose and basic consequences of strict mode.
- Distinguish a syntax error or early error from a runtime error and an incorrect result.
- Classify mixed JavaScript code and rewrite ambiguous code so its intent is explicit.

## Prerequisites

The only prerequisite is basic programming knowledge: values, variables, functions, conditionals, and the idea that a program is parsed before it runs.

This lecture introduces grammar and execution boundaries before later lectures explore variables and scope, values and types, and control flow.

The preserved informal notes referenced during the original review are not part of the canonical lecture. This page keeps Day 1 focused on source grammar, parsing, and host boundaries.

## Core Concepts

### 1. JavaScript, ECMAScript, engines, and hosts

People often use "JavaScript" for several related things. Keeping these names separate makes many interview questions easier:

- **ECMAScript** is the rule book for the language.
- A **JavaScript engine** is the program that reads and runs JavaScript code.
- A **host environment** is the program around the engine that provides extra features.

These terms answer different questions:

| Term | Meaning | Example |
| --- | --- | --- |
| ECMAScript | The language specification: grammar, values, objects, functions, modules, and semantic rules | `if`, `const`, `class`, `Promise`, `import` |
| JavaScript engine | Software that parses and executes ECMAScript | V8, SpiderMonkey, JavaScriptCore |
| Host environment | The surrounding program that embeds the engine and supplies APIs or loading rules | Node.js, a browser, a worker runtime |
| Runtime API | A host-provided capability, not automatically part of ECMAScript | Node's `fs`, browser `document`, a host timer API |

This difference matters because the same JavaScript code can run in different hosts. Each host can provide different global objects, file-loading rules, and APIs. The basic language rules come from ECMAScript, but not everything you can call from JavaScript comes from ECMAScript.

For example, `const answer = 42;` is normal JavaScript language code. `fs.readFile()` is provided by Node.js. `document.querySelector()` is provided by a browser. These APIs are not part of the JavaScript language itself.

### 2. Source text and lexical grammar

A JavaScript program starts as text. Before the engine can run it, it must first understand how that text is organized.

The **lexical grammar** is the part of the language rules that explains how characters form pieces of code such as:

- Identifiers and keywords
- Numeric, string, template, boolean, `null`, BigInt, array, object, and regular-expression literals
- Punctuators such as `{`, `}`, `(`, `)`, `;`, and `=>`
- Whitespace and line terminators
- Comments

The parser then uses those pieces to recognize larger parts of a program, such as expressions, statements, declarations, functions, and modules.

JavaScript understands Unicode characters. This means that some valid identifiers can contain characters outside basic English letters. A team may still choose simple ASCII names for readability. JavaScript is case-sensitive: `total`, `Total`, and `TOTAL` are three different names.

New lines usually act like spaces, but not always. Some rules, especially ASI and `return`, care about a line break. Also, two characters can look similar but be different Unicode characters, so unusual copied identifiers can be confusing.

### 3. Scripts and modules

JavaScript code is commonly loaded in one of two forms:

- A **script** is parsed as a script goal.
- A **module** is parsed as a module goal.

The form changes which syntax is allowed and how the code is evaluated. `import` and `export` belong to modules. They cannot simply be added to a classic script.

A module is strict by definition. A script can opt into strict mode with a directive prologue such as:

```js
"use strict";
```

The host decides how a file is loaded. In Node.js, project configuration, file extensions, and loader rules can affect whether a file is treated as a module. For now, remember that JavaScript syntax and the host's file-loading decision are separate things.

Modules also have their own top-level boundary. Do not assume that a name written at the top of a module automatically becomes a property of the global object. Node's CommonJS wrapper and ESM loader explain more details later.

### 4. Expressions, statements, declarations, and blocks

These words describe different kinds of JavaScript code.

An **expression** is code that can produce a value. Examples include:

```js
42
"ready"
user.name
calculateTotal(order)
condition ? "yes" : "no"
```

A **statement** is a complete instruction. Examples include:

```js
if (isReady) {
  start();
}

return result;
throw error;
```

A **declaration** creates a name for something. Examples include:

```js
const port = 3000;
function startServer() {}
class RequestError extends Error {}
```

A declaration is also treated as a statement in the larger grammar. We give it a separate name because declarations affect names, initialization, and modules. Those details are covered later.

A **block** is code between a pair of curly braces. It can contain one or more statements:

```js
{
  logStart();
  logFinish();
}
```

Blocks are often attached to `if`, loops, functions, or classes, but a standalone block is valid too. Curly braces are context-sensitive: at the beginning of a statement, `{ name: "Ada" }` is normally parsed as a block containing a labeled statement, not as an object expression. This is one reason expression statements and object literals need careful formatting.

A useful interview answer is not simply "statements do things and expressions return values." The grammar is more precise: expressions are value-producing syntactic forms, while statements are execution-level forms. Some constructs contain both, such as `const result = calculate();`, where the declaration is a statement and `calculate()` is an expression.

### 5. Literals

Literals are the syntax we use to write values directly in JavaScript code.

For example:

```js
42                  // number literal
"hello"             // string literal
true                // boolean literal
null                // null literal
[1, 2, 3]           // array literal
{ name: "Asha" }    // object literal
/hello/i            // regular-expression literal
```

They are a short and convenient way to create values. You do not need to call a constructor such as `new Array()` or `new Object()` for the common cases:

```js
const numbers = [1, 2, 3];
const user = { name: "Asha" };
```

The same examples written with constructors would be longer:

```js
const numbers = new Array(1, 2, 3);
const user = new Object();
user.name = "Asha";
```

Common literal forms include:

```js
const text = "hello";              // string literal
const message = `ready`;           // template literal
const count = 42;                  // number literal
const exactId = 9007199254740993n; // BigInt literal
const enabled = true;              // boolean literal
const missing = null;              // null literal
const tags = ["js", "node"];       // array literal
const config = { mode: "test" };   // object literal
const pattern = /ready/i;           // regular-expression literal
```

For now, focus on recognizing the syntax. Later lectures explain how these values behave, how objects are stored and compared, how arrays work, and how coercion can change a value's type.

One important grammar detail is that punctuation can mean different things in different places:

- `{}` at the beginning of a statement can be a block, not an object.
- `{}` after `=` is an object literal.
- `/` can mean division or start a regular-expression literal, depending on the surrounding code.

For example:

```js
const config = { port: 3000 + 1 };
```

Here, `{ port: ... }` is an object literal, and `3000 + 1` is an expression inside it.

### 6. Comments

JavaScript supports line comments and block comments:

```js
// This comment ends at a line terminator.

/* This comment can span multiple lines. */
```

Comments are removed from the meaningful program input during lexical processing and generally behave like whitespace. They are not executable instructions. Block comments cannot be nested reliably as block comments:

```js
/* outer /* inner */ outer text */
```

The first `*/` closes the block comment. The remaining text can then cause a syntax error.

A hashbang such as `#!/usr/bin/env node` is a special first-line form supported by many JavaScript runtimes and tools. It is useful for executable files, but it should not be described casually as an ordinary ECMAScript comment. Its acceptance depends on the parser/runtime context and placement rules. Treat it as a host/tooling-sensitive source feature.

Comments can still affect parsing indirectly by removing or separating tokens:

```js
const first = 1 /* explanation */ + 2;
```

This remains one expression. A comment is not a guaranteed statement separator.

### 7. Automatic semicolon insertion

**Automatic Semicolon Insertion (ASI)** is an ECMAScript parsing mechanism that automatically inserts virtual semicolons into the token stream when a statement is missing a semicolon and encounters an offending token, a closing brace `}`, or the end of the input stream.

ASI is **not** a code formatter, preprocessor, or beautifier that adds a semicolon at every line break. It is a set of fallback parser rules that only run when the current token violates expected statement grammar. If the grammar can validly continue parsing across the line break, **no semicolon is inserted**.

```js
// Node.js code
// ✅ ASI works here: 'const' cannot legally follow '1' in an expression, so ASI inserts ';'
const first = 1
const second = 2
console.log(first + second); // 3
```

However, relying on ASI causes severe interview pitfalls. There are specific, spec-defined scenarios where **ASI does NOT apply** or where it causes surprising logic failures.

#### When ASI does NOT apply: 5 critical rules

##### Rule 1: When grammar allows continuation (the parser can interpret the next line as part of the current statement)

If line 1 looks like a complete statement to a developer, but line 2 begins with a token that can syntactically continue the expression, the parser will **never** insert a semicolon. The parser greedily consumes the next line as part of the ongoing statement.

Common continuation tokens include:
- `(` (leading parenthesis) — parsed as a function call on the previous expression.
- `[` (leading bracket) — parsed as computed property lookup (member access) with the comma operator.
- `+` and `-` (leading operators) — parsed as binary addition or subtraction continuing the previous expression.
- `/` (leading slash) — parsed as division rather than starting a regular expression literal.
- `` ` `` (leading backtick) — parsed as a tagged template literal applied to the previous expression.

```js
// Node.js code

// ❌ Pitfall 1: Leading '(' is parsed as calling the preceding expression
const computeTotal = () => 100
(function logBanner() {
  console.log("Running banner");
})()
// Parser sees: const computeTotal = () => 100(function logBanner() { ... })()
// Output: TypeError: 100(...) is not a function

// ❌ Pitfall 2: Leading '[' is parsed as array index access with the comma operator
const items = [1, 2]
[3, 4].forEach((n) => console.log(n))
// Parser sees: items[3, 4].forEach(...) -> evaluates comma (3, 4) -> items[4] (undefined)
// Output: TypeError: Cannot read properties of undefined (reading 'forEach')

// ❌ Pitfall 3: Leading '+' continues binary addition across lines
const baseAmount = 50
+ 25
console.log("Base amount:", baseAmount); // Base amount: 75 (not two separate statements!)

// ✅ Correct: Use explicit semicolons (or defensive leading semicolons ';(')
const safeComputeTotal = () => 100;
(function safeBanner() {
  console.log("Running safe banner"); // Logs: Running safe banner
})();

const safeItems = [1, 2];
[3, 4].forEach((n) => console.log(n)); // Logs: 3, 4
```

##### Rule 2: Restricted productions: After `return`, `break`, `continue`, `yield`, and `throw` (newline = semicolon inserted immediately)

ECMAScript defines specific grammar rules called **Restricted Productions** marked with `[no LineTerminator here]`. If a line break occurs between these keywords and their trailing expressions or labels, ASI **forces** an immediate semicolon right after the keyword.

The parser will **not** look ahead to connect the expression on the next line:
- `return \n expression` -> becomes `return;`, returning `undefined`. The expression on the next line is either dead code or an isolated block.
- `break \n label` -> becomes `break;`, breaking the innermost loop instead of the intended label.
- `continue \n label` -> becomes `continue;`, continuing the innermost loop instead of the intended label.
- `yield \n value` -> becomes `yield;`, yielding `{ value: undefined, done: false }`. The next line is evaluated as an orphaned statement upon resumption.
- `throw \n Error` -> becomes `throw;`. Because ECMAScript requires an expression after `throw`, an immediate `SyntaxError: Illegal newline after throw` is raised before code executes.

```js
// Node.js code

// ❌ Pitfall 1: return with newline returns undefined; braces become an isolated block
function getUserPayload() {
  return
  {
    username: "alex"
  };
}
console.log("Returned:", getUserPayload()); // Returned: undefined

// ❌ Pitfall 2: break with newline breaks inner loop, ignoring outer label
let iterations = 0;
outerLoop: for (let i = 0; i < 2; i++) {
  for (let j = 0; j < 2; j++) {
    iterations++;
    break
    outerLoop; // ASI inserts ';' after break. 'outerLoop;' is an unused identifier statement!
  }
}
console.log("Iterations:", iterations); // 2 (outerLoop did NOT break, ran twice!)

// ❌ Pitfall 3: yield with newline yields undefined
function* generateIds() {
  yield
  999; // ASI inserts ';' after yield. Yields undefined; 999 is evaluated later.
}
const iterator = generateIds();
console.log("Yielded:", iterator.next()); // { value: undefined, done: false }

// ❌ Pitfall 4: throw with newline is a fatal early SyntaxError
// function fail() {
//   throw
//   new Error("Boom"); // SyntaxError: Illegal newline after throw
// }

// ✅ Correct: Keep expressions and labels on the same line as restricted keywords
function getCorrectUserPayload() {
  return {
    username: "alex"
  };
}
console.log("Correct user:", getCorrectUserPayload()); // { username: 'alex' }

function* generateCorrectIds() {
  yield 999;
}
console.log("Correct yield:", generateCorrectIds().next()); // { value: 999, done: false }
```

##### Rule 3: In `do...while` loops (semicolon required by statement grammar)

Unlike `while (cond) { ... }` or `for (...) { ... }` which terminate with a closing block brace `}`, the formal grammar of a `do...while` loop is:

```
IterationStatement : do Statement while ( Expression ) ;
```

Because it ends with parentheses `( Expression )`, the grammar demands a terminating semicolon. While ASI can supply a semicolon when followed by a newline, omitting the semicolon creates ambiguity in single-line statements, minified bundles, or when concatenated with subsequent statements.

```js
// Node.js code

let retryCount = 0;

// ❌ Bad practice / Pitfall: Omitting semicolon in do...while creates concatenation & parsing hazards
// In single-line minified code: do { retryCount++; } while (retryCount < 1) console.log("done");
// Depending on following tokens and toolchains, omitting ';' can trigger syntax or formatting ambiguity.
do {
  retryCount++;
} while (retryCount < 1) // ⚠️ Valid only via ASI newline fallback, but hazardous
console.log("Retried:", retryCount); // Retried: 1

// ✅ Correct: Always terminate do...while statements with an explicit semicolon
let safeRetries = 0;
do {
  safeRetries++;
} while (safeRetries < 2);

console.log("Safe retries:", safeRetries); // Safe retries: 2
```

##### Rule 4: In `for` loop headers (semicolons required — explicit ECMAScript spec overriding rule)

The ECMAScript specification defines an explicit overriding rule:

> *"A semicolon is never inserted automatically if that semicolon would become one of the two semicolons in the header of a `for` statement."*

Even if you insert newlines between the initialization, test condition, and final expression inside `for (init; test; update)`, **ASI will NEVER insert the semicolons**. Omitting them produces an immediate `SyntaxError`.

```js
// Node.js code

// ❌ Pitfall: Multi-line for loop header without semicolons throws SyntaxError
/*
for (
  let i = 0
  i < 3
  i++
) {
  console.log(i); // SyntaxError: Unexpected identifier 'i' (ASI NEVER triggers here!)
}
*/

// ✅ Correct: Both semicolons must be explicitly provided in the for loop header
for (
  let i = 0;
  i < 3;
  i++
) {
  console.log("Loop item:", i); // Logs: 0, 1, 2
}
```

##### Rule 5: Empty statements prohibition (overriding rule)

The ECMAScript specification also forbids ASI if the inserted semicolon would become an **empty statement**.

For example, when writing an `if`, `while`, or `for` statement with a multiline body, ASI will never insert a semicolon directly after the condition parenthesis:

```js
// Node.js code

let isAuthorized = true;

// ✅ ASI does NOT insert an empty ';' after the if condition
if (isAuthorized)
  console.log("Access granted"); // Logs: Access granted
// If ASI inserted a semicolon, it would be: 'if (isAuthorized);' (an empty statement),
// leaving console.log to run unconditionally. The spec explicitly forbids this!
```

#### ASI behavior comparison table

| Scenario | Trigger / Leading token | Parser behavior | Observed consequence | Safe remedy |
|---|---|---|---|---|
| **Continuation token** | Line begins with `(`, `[`, `+`, `-`, `/`, `` ` `` | No semicolon inserted; expression continues across newline | `TypeError: x is not a function`, property lookup failure, or arithmetic join | Place explicit `;` at end of prior line or use defensive `;(` |
| **Restricted production** | Newline after `return`, `break`, `continue`, `yield`, `throw` | Virtual `;` inserted immediately after keyword | Silent return of `undefined`, broken loop logic, or `SyntaxError` after `throw` | Keep returned expression or target label on the same line |
| **`do...while` loop** | Trailing `while (condition)` | Grammar demands terminating `;` | Minification/parsing ambiguity if omitted | Always append explicit `;` after `while (...)` |
| **`for` loop header** | Missing `;` in `for (init; cond; step)` | **Never inserted** (overriding spec rule) | Immediate `SyntaxError: Unexpected identifier` | Write both semicolons explicitly in the `for (...)` header |
| **Empty statement** | Newline after `if (cond)`, `while (cond)` | **Never inserted** (overriding spec rule) | Body stays bound to header; no rogue empty statement | Always use `{ ... }` blocks for control flow clarity |

### 8. Strict mode

**Strict mode** enables stricter parsing and runtime rules for a script or function body. A script can opt in with a directive prologue:

```js
"use strict";
```

A directive prologue is a sequence of string-literal expression statements at the beginning of a script or function body. The exact string `"use strict"` activates strict mode. Modules are strict automatically.

Strict mode catches or changes several historically permissive behaviors. A small example is assignment to an undeclared identifier:

```js
function strictExample() {
  "use strict";
  accidentalGlobal = 1;
}
```

This parses, but calling `strictExample()` throws a `ReferenceError` instead of silently creating an accidental global in environments where sloppy behavior would permit that assignment.

Strict mode also affects details such as duplicate parameter restrictions, octal escape syntax, deletion of certain bindings, and `this` behavior in plain function calls. Those topics depend on later lectures, so Day 1 uses them only as examples of why strictness is a semantic mode rather than a style preference.

Strict mode is not the same as:

- A linter rule
- TypeScript's type checker
- A formatter setting
- A security sandbox
- A guarantee that all runtime APIs are safe

It is an ECMAScript language mode with defined parsing and execution consequences.

### 9. Syntax errors, early errors, runtime errors, and wrong results

These failure categories must be separated in an interview:

- A **syntax error** means the source cannot be parsed as valid code in the selected grammar goal.
- An **early error** is a specification-defined static restriction that rejects source before normal evaluation, such as an invalid duplicate declaration in a context where it is forbidden. Developers commonly observe it as a syntax error during parsing or module loading.
- A **runtime error** occurs after parsing succeeds, while the program is executing. Examples include calling a non-function or reading a property from `null`.
- An **incorrect result** occurs when the code is valid and runs without throwing, but its logic or interpretation is not what the author intended. ASI-related bugs frequently fall into this category.

Examples:

```js
const = 1;
```

This is invalid source and produces a syntax error before the program runs.

```js
const value = null;
value.run();
```

This parses, but evaluating `value.run()` throws at runtime.

```js
function status() {
  return
  { ready: true };
}
```

This can parse and run while returning `undefined`, which is an incorrect result if the author intended to return an object.

When diagnosing a failure, first ask whether the engine accepted the source. Then ask whether evaluation threw. Only after those questions should you inspect the resulting values and application logic.

### 10. Source references and accuracy boundaries

The main language references for this lecture are:

- [MDN: Grammar and types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types)
- [MDN: Lexical grammar](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar)
- [MDN: Statements and declarations](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements)
- [MDN: Expressions and operators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators)
- [MDN: Strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode)
- [ECMAScript specification](https://tc39.es/ecma262/)

## Compare & Recall

These concepts are easy to mix up. Full explanations are in the sections above; this table is for quick recall.

| Concept A | Concept B | Key difference |
|---|---|---|
| **Script** | **Module** | Script has no `import`/`export` and is not strict by default; module is always strict and uses `import`/`export`. |
| **Strict mode** | **Linter / TypeScript** | Strict mode is a language-level runtime rule; a linter/TS checker runs on source text before execution and enforces different things. |
| **Syntax error** | **Runtime error** | Syntax error stops parsing — no code runs. Runtime error happens during execution after parsing succeeded. |
| **Syntax error** | **Incorrect result** | An incorrect result is a program that runs fine but silently produces the wrong value (e.g. `return` on its own line). |
| **ECMAScript** | **Node.js / Browser** | ECMAScript defines the language; Node.js/browser are *host environments* that embed an engine and add their own APIs. |
| **Expression** | **Statement** | An expression produces a value; a statement is an instruction (often containing expressions). |

> **When studying other days:** Variables and scope live in [Day 02](day-02-variables-scope-and-hoisting.md). Types and values live in [Day 03](day-03-values-types-and-literals.md). Modules and `import`/`export` are covered deeply in [Day 17](day-17-modules-and-interoperability.md).

The ECMAScript specification is the authority for language-level guarantees. MDN is useful for organized explanations and compatibility notes. Node.js documentation becomes authoritative when the question concerns Node's module selection, executable-file handling, loader behavior, or runtime APIs.

## Examples and Execution Traces

### Example 1: Classifying a mixed source file

**Environment:** JavaScript source; classification is language-level.

```js
// A comment
const limit = 3;                 // declaration statement; 3 is a numeric literal
limit + 1;                       // expression statement
{
  console.log("inside block");   // block containing an expression statement
}
```

Classification:

- `// A comment`: comment, not executable code.
- `const limit = 3;`: declaration statement.
- `3`: numeric literal and initializer expression.
- `limit + 1;`: expression statement.
- `{ ... }`: standalone block statement.
- `console.log("inside block");`: expression statement inside the block. `console` itself is supplied by the host, so its availability is not an ECMAScript guarantee.

### Example 2: Block versus object literal

**Environment:** JavaScript source; the first form is intentionally surprising.

```js
{ status: "ready" }
```

At the beginning of a statement, this is parsed as a block containing a labeled statement. It does not create or return an object value.

To make an object expression unambiguous, place it in an expression context:

```js
const response = { status: "ready" };
```

Or return it with the opening brace on the same line as `return`:

```js
function createResponse() {
  return { status: "ready" };
}
```

### Example 3: ASI and a leading token

**Environment:** JavaScript source; manual trace.

```js
const number = 10
[1, 2, 3].forEach((item) => console.log(item))
```

Do not assume the newline ends the first statement. The next line begins with `[`, which can be interpreted as continuing the preceding expression. An explicit semicolon communicates the intended boundary:

```js
const number = 10;
[1, 2, 3].forEach((item) => console.log(item));
```

The general lesson is not "ASI is always wrong." The lesson is that a newline is not always a statement boundary.

### Example 4: Strict mode changes execution

**Environment:** JavaScript source; behavior is language-level.

```js
function sloppyCandidate() {
  accidentalName = "created by assignment";
}

function strictCandidate() {
  "use strict";
  accidentalName = "rejected by strict mode";
}
```

Both function bodies can be parsed. Calling `sloppyCandidate()` may create or modify an unintended global in a permissive script context, while calling `strictCandidate()` throws a `ReferenceError`. Exact global-object observations can vary by host, but strict mode rejects the undeclared assignment.

### Example 5: Script versus module syntax

**Environment:** host-dependent loading; grammar distinction is language-level.

```js
export const mode = "module";
```

When parsed as a module, this is valid module syntax. When parsed as a classic script, `export` is not valid there and parsing fails. Whether a file is loaded as a module is decided by the host or toolchain. Do not answer a Node interview question about a file's module type using only the source text; inspect the runtime's module configuration too.

### Example 6: Three kinds of failure

**Environment:** JavaScript source; expected behavior is determined by the selected grammar and runtime.

```js
// A. Syntax error: the parser cannot form a valid declaration.
const = 42;
```

The program is rejected before evaluation.

```js
// B. Runtime error: parsing succeeds, evaluation fails.
const service = null;
service.start();
```

The property access/call fails while the program runs.

```js
// C. Incorrect result: parsing and evaluation can succeed.
function getPayload() {
  return
  { ok: true };
}
```

The function returns `undefined`, not the intended object. This is a correctness bug rather than necessarily a syntax or runtime error.

## Common Mistakes and Interview Traps

1. **Calling ECMAScript an engine.** ECMAScript is a specification; V8 and other engines implement it.
2. **Treating all JavaScript APIs as language features.** `console`, `process`, `document`, and filesystem APIs come from hosts or runtimes.
3. **Saying every newline inserts a semicolon.** ASI is conditional and grammar-driven. When grammar allows continuation (such as a leading `(`, `[`, `+`, `-`, `/`, or `` ` ``), no semicolon is inserted, causing the parser to treat the next line as part of the current expression.
4. **Putting a returned object or restricted operand on the next line.** A line terminator after `return`, `break`, `continue`, or `yield` forces an immediate semicolon. This silently returns `undefined`, breaks/continues the inner loop instead of a labeled loop, or yields `undefined`. A line terminator after `throw` causes an immediate compile-time `SyntaxError`.
5. **Expecting ASI to insert semicolons in `for` loop headers.** The ECMAScript specification explicitly forbids ASI from inserting semicolons in `for (init; cond; step)` headers. Omitting them throws a fatal `SyntaxError`.
6. **Omitting the required semicolon in `do...while` loops.** Unlike block-based loops (`for`, `while`) that end with `}`, `do...while` ends with parentheses `while (condition)` and grammatically requires a terminating semicolon.
7. **Assuming braces always mean objects.** At statement start, braces usually begin a block.
8. **Using `export` in a source file without checking its grammar goal.** Module syntax requires module parsing.
9. **Calling strict mode a linter.** Strict mode changes ECMAScript parsing and execution semantics.
10. **Calling every failure a runtime error.** Syntax errors happen before evaluation; wrong results may not throw at all.
11. **Treating comments as statement separators.** Comments are generally whitespace and do not automatically terminate an expression.
12. **Assuming a hashbang is an ordinary portable comment.** Its support and placement are runtime/tooling-sensitive.
13. **Over-answering with later topics.** A Day 1 explanation of `const` should not become a full lecture on TDZ, closures, coercion, or prototypes.
14. **Claiming an example was executed without verification.** If it was not run in a stated environment, present a manual trace or a focused verification plan.

## Tricky Points

### A. Parsing context changes punctuation meaning

`{}` may be a block or an object literal. `/` may begin division or a regular-expression literal. `(` can group an expression or begin a call. Interview answers should describe the parser's context instead of assigning one meaning to punctuation everywhere.

### B. ASI can create valid but unintended programs

The most dangerous ASI bugs are not syntax errors—they are programs that parse and run cleanly while changing the intended value or control flow:
1. **Continuation across lines:** When a line begins with `(`, `[`, `+`, `-`, `/`, or `` ` ``, the engine treats it as part of the previous statement instead of inserting a semicolon. This turns array index lookups into property accesses on previous results (`items[3, 4]`) or converts parentheses into function invocations (`1(...) -> TypeError`).
2. **Restricted productions cutting off statements:** A line break after `return`, `break`, `continue`, or `yield` causes ASI to insert a virtual semicolon immediately, silently returning `undefined` or ignoring loop labels without throwing a runtime error.

Writing explicit semicolons, placing opening braces on the same line as `return`, and avoiding leading continuation tokens at the start of lines prevent these silent failures.

### C. Modules are strict, but strict scripts are not modules

Adding `"use strict"` to a script does not add import/export capability. Conversely, a module is strict without needing the directive. Strictness and module status are related but distinct concepts.

### D. Source support is not the same as host loading

A runtime may support module syntax but still load a particular file as a script because of project configuration. When debugging a module syntax error, inspect how the host classified the file before questioning the grammar itself.

### E. A syntax error may be reported far from its cause

An unmatched brace, unterminated string, or unterminated block comment can cause the parser to report an error at a later token. Read backward from the reported location and check lexical boundaries first.

### F. Unicode can make identifiers look alike

Unicode-aware identifiers are valid in the language, but visually similar characters can be different code points. Teams should use a clear naming policy and review unusual identifiers carefully, especially in security-sensitive code.

## Practical Exercise: Classify and Rewrite a Source File

### Goal

Classify a mixed JavaScript source file, predict whether each section parses and runs, identify ASI-sensitive boundaries, and rewrite ambiguous code explicitly.

### Input

Analyze the following source manually before testing it:

```js
// Section 1
const limit = 3
limit + 1

// Section 2
{
  status: "ready"
}

// Section 3
function getResult() {
  return
  {
    ok: true
  }
}

// Section 4
const count = 10
["a", "b"].forEach((value) => console.log(value))

// Section 5
function strictOnly() {
  "use strict"
  accidentalValue = 1
}

// Section 6
export const moduleName = "day-1"
```

### Required outputs

For each section:

1. Label each line or construct as a comment, literal, expression, statement, declaration, or block where applicable.
2. State whether the source is expected to parse as a script, a module, both, or neither.
3. Identify whether any failure is a syntax/early error, runtime error, or incorrect result.
4. Provide a manual trace for the `return` section and the leading-bracket section.
5. Rewrite every ambiguous or ASI-sensitive boundary using explicit semicolons and unambiguous braces.
6. Label behavior that depends on the host, such as `console` availability and module loading.

### Constraints and edge cases

- Do not solve the exercise by deleting the difficult lines.
- Explain why Section 2 is not automatically an object value.
- Preserve the intended return value in Section 3 when rewriting it.
- Consider both script parsing and module parsing for Section 6.
- Explain why Section 5 can parse but fail when the function is called.
- State that exact behavior of undeclared assignment outside strict mode depends on the host context; do not rely on creating a global as a test strategy.
- Include at least one example of a syntax error that is rejected before execution, such as an invalid declaration.

### Acceptance criteria

The exercise is complete when your answer:

- Correctly separates ECMAScript rules from host/tooling behavior.
- Distinguishes all four categories: comment, literal, expression, and statement, while identifying declarations and blocks where relevant.
- Correctly explains why ASI is conditional rather than line-based.
- Correctly identifies the `return` line-terminator behavior.
- Correctly identifies the object-literal/block ambiguity.
- Correctly classifies syntax/early errors, runtime errors, and incorrect results.
- Produces a rewrite that uses explicit statement boundaries and is understandable without relying on ASI.
- Includes a short verification plan using the target JavaScript runtime without claiming execution that was not performed.

### Hints

- Start by choosing the grammar goal: script or module.
- For each newline, ask whether the next token can continue the previous expression.
- For each brace, ask whether the parser is currently expecting a statement or an expression.
- Parse first, then evaluate. A source file rejected during parsing never reaches its later statements.

## Summary

JavaScript source is parsed according to ECMAScript grammar, then evaluated by an engine embedded in a host environment. ECMAScript defines language behavior; Node.js and browsers add loading rules, globals, and APIs.

Source text is Unicode-aware and case-sensitive. Lexical grammar turns characters into identifiers, keywords, literals, punctuators, whitespace, comments, and line terminators. Those elements form expressions, statements, declarations, blocks, scripts, and modules.

Expressions produce values. Statements represent executable instructions or control structures. Declarations introduce bindings or named constructs. Blocks group statements, and braces can mean a block or an object literal depending on parsing context.

Scripts and modules use different grammar goals. Module syntax such as `import` and `export` requires module parsing, and modules are strict by definition. The host decides how source files are loaded and interpreted.

Comments are not executable code and generally behave like whitespace. Hashbang handling is runtime/tooling-sensitive. ASI is conditional grammar behavior, not a rule that ends every line. `return`, `throw`, `break`, `continue`, and lines beginning with continuation-friendly tokens require special care.

Strict mode is an ECMAScript semantic mode. It can be enabled in scripts or function bodies with a directive, while modules are strict automatically. It is not a formatter, linter, type checker, or security sandbox.

A syntax or early error prevents normal evaluation. A runtime error occurs after parsing during execution. A valid program can also produce an incorrect result without throwing, as with an unintended `return` line break.

## Cheat Sheet

| Concept | Revision rule |
| --- | --- |
| ECMAScript | Language specification, not an engine or host |
| Engine | Parses and executes ECMAScript, such as V8 |
| Host | Embeds the engine and supplies APIs/loading behavior |
| Source text | Unicode-aware, case-sensitive input to the parser |
| Lexical element | Identifier, keyword, literal, punctuator, comment, whitespace, or line terminator |
| Expression | Syntax evaluated to produce a value |
| Statement | Execution-level grammatical form |
| Declaration | Introduces a binding or named construct |
| Block | `{ ... }` containing statements; context is important |
| Literal | Direct source notation for a value or structure |
| Script | Source parsed with the script grammar goal |
| Module | Source parsed with the module grammar goal; strict by definition |
| Comment | Non-executable source that generally behaves like whitespace |
| ASI | Conditional semicolon insertion during parsing, not newline termination |
| Strict mode | ECMAScript mode with stricter parsing/runtime rules |
| Syntax error | Source rejected before evaluation |
| Runtime error | Evaluation fails after parsing succeeds |
| Incorrect result | Valid code runs but does not produce intended behavior |

**vs. quick reference**

| vs. | Script | Module |
|---|---|---|
| `import`/`export` | ✗ Not allowed | ✓ Allowed |
| Strict by default | ✗ No | ✓ Yes |
| Top-level `this` | Global object (host-dependent) | `undefined` |

| Error type | When it happens |
|---|---|
| Syntax / early error | Before any code runs — engine rejected the source |
| Runtime error | During execution — source was valid, evaluation failed |
| Incorrect result | No error thrown — wrong value silently returned |

### When ASI Does NOT Apply (Quick Rules)

1. **Grammar allows continuation:** When a line starts with `(`, `[`, `+`, `-`, `/`, or `` ` ``, the parser treats it as continuing the previous statement. No semicolon is inserted (`TypeError` or arithmetic combination).
2. **Restricted productions:** Newlines after `return`, `break`, `continue`, `yield`, or `throw` force a virtual semicolon immediately, cutting off following operands.
3. **In `do...while` loops:** A semicolon is grammatically required after `while (condition);`.
4. **In `for` loop headers:** ASI is strictly forbidden by the ECMAScript spec from inserting semicolons in `for (init; cond; step)`. Missing them produces an immediate `SyntaxError`.
5. **Empty statements:** ASI is forbidden from creating an empty statement after `if`, `while`, or `for` condition headers.

### Common Pitfalls Checklist

- **Leading `(` or `[`:** Always precede IIFEs or array expressions with an explicit semicolon (or defensive `;(...)` / `;[...]`) if not using semicolons everywhere.
- **Object after `return`:** Always put the opening brace `{` on the same line as `return { ... }`.
- **Labels after `break` / `continue`:** Keep loop labels on the same line as `break label;` or `continue label;`.
- **Generator `yield`:** Keep yielded values on the same line as `yield value;`.
- **`do...while` loop termination:** Always terminate `do { ... } while (cond);` with a semicolon.
- **Transpilers & Bundlers:** Formatters and minifiers can alter whitespace; relying on explicit semicolons avoids parser surprises.

For Node.js questions, state:

1. The Node/runtime version family if relevant.
2. Whether the file is loaded as a script, CommonJS module, or ECMAScript module.
3. Which behavior is guaranteed by ECMAScript.
4. Which behavior is supplied by Node.js or another host.

## Interview Questions & Deep Dives

### 1. Explain the fundamental difference between ECMAScript, a JavaScript engine, and a host environment.

**Question:** How do ECMAScript, a JavaScript engine (like V8), and a host environment (like Node.js or Chrome) relate to each other? Provide concrete examples of APIs belonging to each layer.

**Answer:**
- **ECMAScript:** The formal language specification (ECMA-262) managed by TC39. It defines the grammar, syntax, core primitives, prototype inheritance, memory semantics, and standard built-in objects (`Object`, `Array`, `Promise`, `Map`, `Reflect`, `Proxy`, control flow keywords).
- **JavaScript Engine (e.g. V8, SpiderMonkey, JavaScriptCore):** The software that parses source code text, compiles it to bytecode (via Ignition in V8), executes it on a call stack, optimizes hot code to machine instructions (via TurboFan), and manages the memory heap and garbage collector.
- **Host Environment (e.g. Node.js, Chromium):** The embedding application providing the event loop, operating system interface, and platform-specific capabilities. 

**Categorization Examples:**
- *ECMAScript:* `const`, `class`, `async/await`, `Promise.all()`, `JSON.parse()`.
- *Node.js Host APIs:* `node:fs`, `node:http`, `process.nextTick()`, `setImmediate()`, `Buffer`.
- *Browser Host APIs:* `document.querySelector()`, `window.localStorage`, `fetch()` (historically), Web Workers.

---

### 2. What is Automatic Semicolon Insertion (ASI), when does it NOT apply, and what restricted productions cause silent logic bugs?

**Question:** What is ASI in JavaScript, in which specific scenarios does ASI NOT apply, which keywords form "restricted productions", and what silent bugs does ASI produce? Provide a code example.

**Answer:**
Automatic Semicolon Insertion (ASI) is an ECMAScript grammar mechanism where the parser automatically inserts virtual semicolons into the token stream when an unexpected token, newline, or end of input prevents normal parsing.

**1. When ASI Does NOT Apply:**
- **Grammar allows continuation:** If the next line begins with a token that can legally continue the expression (such as `(`, `[`, `+`, `-`, `/`, or `` ` ``), the parser continues the expression across the newline instead of inserting a semicolon. For example, `[1, 2] \n [3, 4].forEach(...)` attempts computed member access `[1, 2][3, 4]` and throws a `TypeError`.
- **`for` loop headers:** The ECMAScript specification explicitly forbids ASI from inserting either of the two required semicolons inside `for (init; test; update)`. Omitting them throws an immediate `SyntaxError`.
- **`do...while` loops:** The grammar production `do Statement while ( Expression ) ;` requires a terminating semicolon. Omitting it creates ambiguity in inline or minified scripts.
- **Empty statements:** ASI will never insert a semicolon if it would become an empty statement (e.g., `if (condition) \n doAction()` will not become `if (condition);`).

**2. Restricted Productions:**
Certain statements have a strict `[no LineTerminator here]` specification rule. If a newline appears immediately after the keyword, ASI forces a virtual semicolon right away:
- `return`: Semicolon inserted after `return;`. Returns `undefined`; any object on the next line is treated as an unreachable block.
- `break`: Semicolon inserted after `break;`. Breaks the inner loop, ignoring the outer label on the next line.
- `continue`: Semicolon inserted after `continue;`. Continues the inner loop, ignoring the outer label on the next line.
- `yield`: Semicolon inserted after `yield;`. Yields `{ value: undefined, done: false }`.
- `throw`: Throws an immediate `SyntaxError: Illegal newline after throw` because `throw;` is invalid syntax.

**Silent Bug Code Example:**

```javascript
// Node.js code
function getConfiguration() {
  return
  {
    status: "active"
  };
}
console.log(getConfiguration()); // undefined (silent logic bug!)
```

Trace:
1. The parser encounters `return` followed immediately by a newline.
2. Because `return` is a restricted production, ASI inserts a semicolon immediately: `return;`.
3. The function returns `undefined`.
4. The subsequent block `{ status: "active" };` is parsed as an isolated code block containing an unused statement label `status:` and expression statement `"active"`, which is never reached.

**Fix:** Keep the opening brace on the same line as `return`: `return { status: "active" };`.

---

### 3. How does ECMAScript distinguish scripts from modules at the parsing and execution level?

**Question:** How does an ECMAScript Module (ESM) differ from a classical Script in terms of lexical scoping, strict mode, and parser grammar goals?

**Answer:**
The ECMAScript specification parses source text according to distinct top-level **Grammar Goals**:
1. **Module Grammar Goal:**
   - **Strict Mode:** Executed in strict mode (`"use strict"`) automatically and permanently; cannot be disabled.
   - **Lexical Isolation:** Top-level declarations (`const`, `let`, `var`, `function`) are scoped strictly to the module file; they do NOT pollute the global object.
   - **Top-Level `this`:** Evaluates strictly to `undefined` (unlike scripts where `this` refers to `globalThis` or `window`).
   - **Keywords:** `import` and `export` statements are only syntactically valid in a Module grammar goal; using them in a Script throws a `SyntaxError: Cannot use import statement outside a module`.
2. **Script Grammar Goal:**
   - Defaults to sloppy mode unless `"use strict"` is explicitly declared.
   - Top-level `var` and `function` declarations pollute the global object (`window` or `global`).
   - Top-level `this` refers to the global object.

---

### 4. What is the difference between an Expression Statement and a Block statement in ambiguous grammar positions?

**Question:** Why does `{ test: 1 }` behave completely differently depending on whether it appears as a statement at the start of a line versus inside parentheses `({ test: 1 })`?

**Answer:**
JavaScript grammar is context-sensitive regarding curly braces `{}`:
- At the start of a statement, an opening brace `{` is parsed as a **Block statement**, not an object literal. In `{ test: 1 }`, `test:` is parsed as a statement label (like in a loop), and `1` is parsed as an expression statement.
- When enclosed in parentheses `({ test: 1 })`, the parentheses force an **Expression context**. Inside an expression context, `{ test: 1 }` is parsed as an object literal with key `test` and value `1`.

This ambiguity is the primary reason why arrow functions returning an object literal must wrap the object in parentheses:
- `() => { count: 1 }`: Parsed as a block with a label `count:`, returning `undefined`!
- `() => ({ count: 1 })`: Parsed as an expression returning an object `{ count: 1 }`.

---

<nav aria-label="Lecture navigation">

Previous | [Roadmap](../javascript-roadmap.md) | [Next: Variables, Declarations, and Scope Foundations](day-02-variables-scope-and-hoisting.md)

</nav>

