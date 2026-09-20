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

JavaScript permits many semicolons to be omitted. When the source cannot be parsed under the normal grammar and a line terminator or closing boundary permits it, the language's automatic semicolon insertion rules may conceptually insert a semicolon.

ASI is not a formatter that inserts semicolons after every line. It is part of parsing and interacts with specific grammar rules. The safest practical rule is to write explicit semicolons at statement boundaries and avoid beginning a new line with a token that could continue the previous expression.

Consider:

```js
const first = 1
const second = 2
```

This is commonly parsed as two declaration statements because the next `const` cannot continue the initializer in that position. The same confidence does not apply to every newline.

#### `return` and line terminators

A line terminator immediately after `return` ends the return statement:

```js
function getStatus() {
  return
  {
    status: "ok"
  }
}
```

Manual trace:

1. The parser sees `return` followed by a line terminator.
2. The return statement has no expression.
3. The function returns `undefined`.
4. The following braces are parsed as a separate block, not as the returned object.

Write the intended expression on the same line or wrap it explicitly:

```js
function getStatus() {
  return {
    status: "ok",
  };
}
```

#### A leading parenthesis or bracket

This code is valid but may not represent two independent expressions:

```js
const total = 1
(function logTotal() {
  console.log(total);
})()
```

Without an explicit semicolon, the second line can be parsed as a call applied to the result of `1`. Depending on the exact source, that produces a runtime failure rather than the intended two statements. A defensive boundary is:

```js
const total = 1;
(function logTotal() {
  console.log(total);
})();
```

The same hazard exists with a line beginning with `[`, a template literal, or certain operators. A leading `+`, `-`, `/`, or backtick can continue the previous expression in ways that are difficult to see during review.

#### Restricted productions

Some grammar productions are sensitive to whether a line terminator appears at a specific position. `return`, `throw`, `break`, and `continue` are important examples. The line break after `throw` is especially dangerous:

```js
function fail() {
  throw
  new Error("failed");
}
```

This is not a safe way to write a throw statement. Put the expression on the same line:

```js
function fail() {
  throw new Error("failed");
}
```

ASI rules are language rules, but the consequences seen by a developer can also depend on a formatter, transpiler, parser configuration, or host. Always inspect the actual source that the target runtime receives.

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

## Node.js Connection

Node decides how source files are loaded and supplies host APIs; classify those facts separately from ECMAScript parsing and evaluation.

## Common Mistakes and Interview Traps

1. **Calling ECMAScript an engine.** ECMAScript is a specification; V8 and other engines implement it.
2. **Treating all JavaScript APIs as language features.** `console`, `process`, `document`, and filesystem APIs come from hosts or runtimes.
3. **Saying every newline inserts a semicolon.** ASI is conditional and grammar-driven.
4. **Putting a returned object on the next line.** A line terminator after `return` ends the return statement.
5. **Assuming braces always mean objects.** At statement start, braces usually begin a block.
6. **Using `export` in a source file without checking its grammar goal.** Module syntax requires module parsing.
7. **Calling strict mode a linter.** Strict mode changes ECMAScript parsing and execution semantics.
8. **Calling every failure a runtime error.** Syntax errors happen before evaluation; wrong results may not throw at all.
9. **Treating comments as statement separators.** Comments are generally whitespace and do not automatically terminate an expression.
10. **Assuming a hashbang is an ordinary portable comment.** Its support and placement are runtime/tooling-sensitive.
11. **Over-answering with later topics.** A Day 1 explanation of `const` should not become a full lecture on TDZ, closures, coercion, or prototypes.
12. **Claiming an example was executed without verification.** If it was not run in a stated environment, present a manual trace or a focused verification plan.

## Tricky Points

### A. Parsing context changes punctuation meaning

`{}` may be a block or an object literal. `/` may begin division or a regular-expression literal. `(` can group an expression or begin a call. Interview answers should describe the parser's context instead of assigning one meaning to punctuation everywhere.

### B. ASI can create valid but unintended programs

The most dangerous ASI bugs are not necessarily syntax errors. They are programs that parse and run while changing the intended value or control flow. Explicit semicolons, consistent formatting, and tests around return values reduce this risk.

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

Before accepting a newline as a boundary, check for:

- `return`, `throw`, `break`, or `continue`
- A next line beginning with `(`, `[`, `` ` ``, `+`, `-`, or `/`
- A returned object whose opening `{` is on the next line
- A comment that separates tokens without actually ending an expression
- A formatter or transpiler that changes the source received by the runtime

For Node.js questions, state:

1. The Node/runtime version family if relevant.
2. Whether the file is loaded as a script, CommonJS module, or ECMAScript module.
3. Which behavior is guaranteed by ECMAScript.
4. Which behavior is supplied by Node.js or another host.

## Interview Questions

### 1. Deep Definitions and Mental Models

**ECMAScript versus JavaScript runtime:** Explain the relationship among ECMAScript, a JavaScript engine, Node.js, and a browser. Your answer should classify at least five examples as language behavior or host behavior. Follow-up: How would your answer change when a transpiler transforms the source before the engine receives it?

**Expected answer shape:** Define each layer, give concrete examples, and explain why the distinction affects debugging and portability.

**Expression versus statement:** Define expressions, statements, declarations, and blocks. Explain why `const result = build();` contains both a declaration statement and an expression. Follow-up: Explain why â€œexpressions return values and statements do notâ€ is a useful beginner shortcut but not a complete interview answer.

**Expected answer shape:** Use grammar roles, show a short snippet, and discuss nested constructs and expression statements.

**Script versus module:** Explain how script and module grammar goals differ, why `export` cannot be treated as an ordinary statement, and why module status cannot always be inferred from the source text alone in Node.js. Follow-up: Separate module strictness from Node's CommonJS/ESM loading and interoperability rules.

**Expected answer shape:** Cover grammar goal, strictness, top-level boundaries, and host configuration without treating Node behavior as ECMAScript behavior.

### 2. Predict the Output and Trace Execution

**Return line break:** What does this function return, and why?

```js
function readStatus() {
  return
  { ready: true };
}
```

Follow-up: Rewrite it in two unambiguous ways and classify the original behavior as a syntax error, runtime error, or incorrect result.

**Expected answer shape:** State `undefined`, explain the line terminator after `return`, and provide explicit rewrites.

**Leading bracket:** Analyze this source without running it:

```js
const value = 10
[1, 2].forEach((item) => console.log(item))
```

Explain at least two plausible parser interpretations, what explicit semicolon changes, and what additional host assumption is needed to discuss `console.log`. Follow-up: Give a code-review rule that prevents this class of bug without claiming ASI itself is defective.

**Expected answer shape:** Explain continuation parsing, statement boundaries, possible runtime consequences, semicolon placement, and host API assumptions.

**Block or object:** What is the grammatical role of `{ mode: "test" }` at statement start? Compare it with `const config = { mode: "test" };`. Follow-up: How does this affect a function that intends to return an object?

**Expected answer shape:** Explain statement context, labeled-statement/block parsing, expression context, and return formatting.

### 3. Implementation Exercises

**Source classifier:** Design a small static-analysis rule that flags a newline immediately after `return` when the following token begins a likely object literal. State the inputs, false positives, false negatives, and whether your rule operates on raw text or tokens. Follow-up: Why is a regular expression alone a fragile implementation?

**Expected answer shape:** Describe tokenization/parsing, limits of text matching, examples, and a conservative review strategy.

**Unambiguous source transformation:** Design a formatter rule set that reduces ASI hazards while preserving program meaning. Include leading continuation tokens, restricted productions, comments, and object returns. Follow-up: What must the formatter do when source cannot be parsed, and how would you test semantic preservation?

**Expected answer shape:** Explain parse-first transformation, explicit boundaries, invalid-source handling, differential tests, and known limitations.

### 4. Debugging and Failure Analysis

**Module syntax failure:** A Node process reports an error near `export`. The file contains valid-looking module syntax. Describe your debugging sequence. Follow-up: Which conclusions can you make from ECMAScript alone, and which require inspecting Node configuration and version?

**Expected answer shape:** Check grammar goal, package/file configuration, loader, transformed output, runtime version, and the actual file executed.

**Error classification:** A service starts successfully but later throws when calling a method on `null`. Contrast this with an invalid declaration that prevents startup. Follow-up: Why can a function with a `return` line break be more difficult to detect than either error?

**Expected answer shape:** Distinguish parse/early failure, runtime failure, and valid-but-wrong behavior; include observability and tests.

**Reported location is misleading:** A parser reports an unexpected token near the end of a 300-line file. Give a bounded debugging method using lexical and grammatical boundaries. Follow-up: How can an unterminated block comment, string, or template literal shift the reported location?

**Expected answer shape:** Check unmatched delimiters and lexical terminators backward from the location, reduce to a minimal reproduction, and verify the exact source after tooling transformations.

### 5. Design and Tradeoff Questions

**Semicolon policy:** Should a backend team require semicolons? Give a defensible policy that considers formatter configuration, code review, ASI hazards, generated code, and team consistency. Follow-up: Why is â€œalways use semicolonsâ€ a policy choice rather than proof that ASI is not part of the language?

**Expected answer shape:** State assumptions, identify risk reduction, explain consistency and tooling, and acknowledge valid alternative styles.

**Host boundary in a shared library:** Design the source boundary for a library intended to run in Node.js and browser hosts. Decide what belongs to ECMAScript-only code, what belongs behind adapters, and how module publishing assumptions should be documented. Follow-up: How would you test grammar and host compatibility without claiming universal behavior?

**Expected answer shape:** Separate pure language code from host APIs, define module/build targets, document assumptions, and use environment-specific tests.

### 6. Senior Follow-ups: Scale, Reliability, Security, and Operations

**Source integrity in production:** A production service runs transformed JavaScript, while stack traces point to generated files. Design a process for diagnosing a syntax or ASI-related regression across source, formatter, transpiler, and runtime. Follow-up: What artifacts and version information should be retained for reliable reproduction?

**Expected answer shape:** Cover source maps, exact generated artifacts, runtime/toolchain versions, reproducible builds, minimal reproduction, deployment metadata, and validation gates.

**Unicode identifiers and review risk:** A security-sensitive codebase permits Unicode identifiers. Assess the maintainability and security risks and propose a policy. Follow-up: How would you distinguish a real language limitation from a team policy or tooling limitation?

**Expected answer shape:** Discuss confusable characters, normalization/review/tooling concerns, restricted naming policy, linting, and the ECMAScript-versus-process boundary.

**Syntax validation in a deployment pipeline:** Design a validation stage that catches invalid source, module/script mismatches, and selected ASI hazards before deployment. Follow-up: Which defects can only be found with runtime or integration tests even when parsing succeeds?

**Expected answer shape:** Include parser checks, target-runtime checks, module configuration, formatter/linter policy, focused behavior tests, and the distinction between syntax validity and semantic correctness.

