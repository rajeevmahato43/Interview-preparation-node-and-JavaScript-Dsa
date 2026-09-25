# Day 02: Variables, Declarations, and Scope Foundations

<nav aria-label="Lecture navigation">

[Previous: Execution Model and Grammar](day-01-execution-model-and-syntax.md) | [Roadmap](../javascript-roadmap.md) | [Next: Values, Types, and Literals](day-03-values-types-and-literals.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain the difference between a declaration, initialization, assignment, and reassignment.
- Choose between `var`, `let`, and `const` for a normal JavaScript program.
- Explain block scope, function scope, script scope, and module scope.
- Predict what happens when a variable is used before its declaration.
- Explain hoisting without saying that JavaScript literally moves code to the top.
- Explain the temporal dead zone (TDZ) in simple terms.
- Distinguish shadowing from reassignment.
- Explain why `const` prevents rebinding but does not make an object or array deeply immutable.
- Separate global bindings, global-object properties, `globalThis`, and Node.js module-local variables.
- Trace variable-related code and classify the result as normal output, a syntax error, or a runtime error.

## Prerequisites

You should know the basic ideas from [Day 01: JavaScript Execution Model and Grammar](day-01-execution-model-and-syntax.md), especially:

- JavaScript source is parsed before it runs.
- A declaration is a kind of statement.
- A block is code inside `{ ... }`.
- Scripts and modules are different ways to interpret source code.
- A syntax error happens before normal execution.

Day 3 builds on this lecture by explaining values and types. Day 8 later gives a deeper treatment of closures and execution contexts. This lecture introduces scope, but it does not try to become the full closures lecture.

The examples are JavaScript examples. When an example uses Node.js behavior, that assumption is stated clearly. ECMAScript defines the language rules; Node.js supplies its own module system, globals, and runtime APIs.

## Core Concepts

### 1. A variable is a named binding

A variable is best understood as a **binding**: a connection between a name and a value.

```js
let score = 80;
```

This line creates a binding named `score` and gives it the value `80`.

The name and the value are related, but they are not the same thing:

- `score` is the name.
- The binding is the place where the name can be looked up.
- `80` is the current value associated with that binding.

This way of thinking is useful because different declarations control whether the binding may be changed later.

```js
let score = 80;
score = 90; // The same binding now has a different value.
```

With `const`, the binding cannot be changed to point to another value:

```js
const passingScore = 40;
// passingScore = 50; // TypeError: assignment to a constant binding
```

The exact wording of an error can differ between runtimes, but the rule is the same: a `const` binding cannot be reassigned.

### 2. Declaration, initialization, assignment, and reassignment

These four words are related, but they do not mean the same thing.

#### Declaration

A **declaration** introduces a name to JavaScript.

```js
let username;
```

The name `username` has been declared. For `let`, the declaration is not yet initialized until execution reaches this line. After the line finishes, its value is `undefined` because no initial value was provided.

For `var`, the binding is initialized to `undefined` during setup of its function or script scope. This difference matters later in the lecture.

#### Initialization

**Initialization** gives a binding its first value.

```js
let username = "Mina";
```

The declaration introduces `username`, and the initializer gives it its first value.

A `const` declaration must include an initializer:

```js
const country = "India";
// const language; // SyntaxError: const declarations must be initialized
```

#### Assignment

**Assignment** puts a value into an already-created writable binding.

```js
let count;
count = 1;
```

The first line declares and later initializes `count` to `undefined`. The second line assigns `1` to it.

#### Reassignment

**Reassignment** changes the value of a binding after it already had a value.

```js
let count = 1;
count = 2; // Reassignment
```

A `const` binding allows initialization but not reassignment:

```js
const maximum = 10;
// maximum = 11; // TypeError
```

A simple memory aid is:

| Action | Meaning |
| --- | --- |
| Declaration | Create or introduce a name |
| Initialization | Give the name its first value |
| Assignment | Put a value into an existing writable binding |
| Reassignment | Assign again after the first value |

These words describe bindings, not whether the value itself is mutable. An object can change internally even when the binding pointing to it cannot change. That difference is covered below.

### 3. Identifiers

An **identifier** is a name used for a variable, function, class, parameter, or other named language item.

Good identifiers tell the reader what the value means:

```js
const requestTimeoutMs = 5_000;
let pendingRequestCount = 0;
```

JavaScript identifiers are case-sensitive:

```js
const userId = 10;
const UserId = 20;

console.log(userId);  // 10
console.log(UserId);  // 20
```

An identifier can contain letters, digits, `_`, and `$`, but it cannot start with a digit. JavaScript also supports many Unicode identifier characters. In production code, simple names are usually easier to review.

```js
const item2 = "valid";
const _internalValue = "valid";
const $element = "valid";
// const 2items = "invalid"; // SyntaxError
```

Reserved words cannot be used freely as identifiers in positions where the grammar reserves them:

```js
// const class = "beginner"; // SyntaxError
```

Day 1 covered the grammar details. The important Day 2 connection is that an identifier is only useful when it can be resolved to a binding in the current scope or one of its outer scopes.

### 4. `var`, `let`, and `const` at a glance

| Declaration | Scope | Must have initializer? | Can reassign? | Can redeclare in the same scope? |
| --- | --- | --- | --- | --- |
| `var` | Function or certain script-level scope | No | Yes | Usually yes |
| `let` | Block | No | Yes | No |
| `const` | Block | Yes | No | No |

"Usually" appears for `var` because the exact global behavior depends on whether the code is a script, a module, or a host such as Node.js. The basic local rule is that `var` is function-scoped and may be redeclared in the same function scope.

Modern application code normally prefers `const` when a binding should not be reassigned, and `let` when it must be reassigned. `var` still appears in older code and interview questions, so understanding it is important.

### 5. Scope means where a name can be used

A **scope** is the region of code where a name can be found.

```js
const outside = "outer";

{
  const inside = "inner";
  console.log(outside); // The outer name is visible here.
  console.log(inside);  // The inner name is visible here.
}

// console.log(inside); // ReferenceError: inside is not defined
```

The inner block can use names from the outer scope. The outer scope cannot use a name that exists only inside the inner block.

JavaScript searches from the current scope outward:

1. Look in the current scope.
2. If the name is not there, look in the nearest outer scope.
3. Continue outward until the name is found or no scope remains.
4. If no binding is found, a `ReferenceError` occurs when the name is evaluated.

This is a basic lexical-scope rule. "Lexical" means the scopes are determined by where code is written, not by which function happened to call another function.

## Detailed Explanations of Scope and Declaration Behavior

### 6. Block scope

A block is usually the code inside curly braces. `let` and `const` are block-scoped.

```js
{
  let message = "inside";
  const limit = 3;
  console.log(message, limit); // inside 3
}

// console.log(message); // ReferenceError
// console.log(limit);   // ReferenceError
```

An `if`, loop, or standalone pair of braces can create a block scope:

```js
if (true) {
  const status = "ready";
  console.log(status); // ready
}

for (let index = 0; index < 2; index += 1) {
  console.log(index); // 0, then 1
}

// console.log(index); // ReferenceError
```

The `index` binding belongs to the `for` loop's scope. It is not available after the loop.

Block scope helps prevent accidental name collisions. A temporary name can stay inside the small area where it is needed.

### 7. Function scope

`var` is function-scoped. A `var` binding belongs to the nearest function body, not to an ordinary nested block.

```js
function showStatus() {
  if (true) {
    var status = "ready";
  }

  console.log(status); // ready
}

showStatus();
// console.log(status); // ReferenceError: status is local to showStatus
```

The `if` block did not keep `status` inside the block because `status` was declared with `var`.

Compare this with `let`:

```js
function showStatus() {
  if (true) {
    let status = "ready";
  }

  // console.log(status); // ReferenceError
}
```

A function itself creates a new scope for its local names:

```js
const outerName = "outside";

function printNames() {
  const innerName = "inside";
  console.log(outerName); // A function can read an outer binding.
  console.log(innerName); // It can read its own binding.
}

printNames();
// console.log(innerName); // ReferenceError
```

The full behavior of functions, closures, and retained scope is covered on Day 8. For now, remember that a function can see its outer lexical scopes, while its local names stay inside the function.

### 8. `var`: function scope, `undefined`, and redeclaration

A `var` declaration can omit its initializer:

```js
var total;
console.log(total); // undefined
total = 25;
console.log(total); // 25
```

Inside a function, `var` declarations are prepared when the function starts. This is one reason the following code does not fail with a TDZ error:

```js
function readValue() {
  console.log(value); // undefined
  var value = 10;
  console.log(value); // 10
}

readValue();
```

A useful mental model is similar to this:

```js
function readValue() {
  var value;
  console.log(value);
  value = 10;
  console.log(value);
}
```

This is only a teaching model. JavaScript does not literally rewrite the source file before running it. The actual language behavior comes from how bindings are created and initialized during execution setup.

`var` can be redeclared in the same function scope:

```js
function configure() {
  var port = 3000;
  var port = 4000;
  console.log(port); // 4000
}

configure();
```

The second declaration does not create a useful second local name. It refers to the same function-scoped binding and assigns a new value because it has an initializer.

This permissive behavior can hide mistakes:

```js
function calculate() {
  var result = 10;
  // Many lines later...
  var result = 20;
  return result;
}
```

For this reason, `let` and `const` are generally easier to review in new code.

### 9. `let`: block scope and the temporal dead zone

A `let` binding is block-scoped and can be reassigned:

```js
let level = 1;
level = 2;
console.log(level); // 2
```

A `let` declaration without an initializer is valid:

```js
let result;
console.log(result); // undefined
```

However, using a `let` name before execution reaches its declaration is different from reading a declared variable whose value is `undefined`:

```js
{
  // console.log(score); // ReferenceError
  let score = 80;
  console.log(score); // 80
}
```

The period from entering the scope until the declaration is evaluated is called the **temporal dead zone**, usually shortened to **TDZ**.

The word "temporal" means time: the problem exists during a part of execution. The word "dead zone" means the binding exists in the scope but cannot be used yet.

A simple timeline is:

1. The block starts.
2. JavaScript knows that a `let score` binding belongs to this block.
3. The binding is uninitialized.
4. Reading `score` now throws a `ReferenceError`.
5. Execution reaches `let score = 80`.
6. The binding is initialized with `80`.
7. Later reads work normally.

The TDZ is about accessing the binding, not merely about the declaration text appearing later:

```js
{
  if (false) {
    console.log(value);
  }

  let value = 10;
  console.log(value); // 10
}
```

The code inside the `if` does not execute, so it does not attempt to read `value`. The declaration is still reached and initialized.

A `typeof` check does not make a lexical binding safe during the TDZ:

```js
{
  // typeof count; // ReferenceError because count is in the TDZ
  let count = 1;
}
```

This surprises people who remember that `typeof` is often safe for an undeclared name:

```js
console.log(typeof completelyUnknownName); // "undefined"
```

These are different cases:

- `completelyUnknownName` has no binding in the visible scopes.
- `count` has a lexical binding in the current scope, but it is not initialized yet.

### 10. `const`: no rebinding, not deep immutability

A `const` binding must be initialized at the declaration:

```js
const language = "JavaScript";
```

It cannot be reassigned:

```js
const language = "JavaScript";
// language = "TypeScript"; // TypeError
```

The rule applies to the binding. It does not freeze the value stored in the binding.

#### Objects can still be mutated

```js
const user = { name: "Asha" };
user.name = "Ravi";

console.log(user.name); // Ravi
```

The `user` binding still points to the same object. We changed a property inside that object; we did not make `user` point to a different object.

This is not allowed:

```js
const user = { name: "Asha" };
// user = { name: "Ravi" }; // TypeError
```

#### Arrays can still be mutated

```js
const numbers = [1, 2];
numbers.push(3);

console.log(numbers); // [1, 2, 3]
```

This is not allowed:

```js
const numbers = [1, 2];
// numbers = [4, 5]; // TypeError
```

You can describe the rule precisely like this:

> `const` prevents reassignment of the binding. It does not automatically make the referenced object immutable.

`Object.freeze()` can prevent some direct changes to an object, but it is shallow and belongs to a later lecture. Even freezing does not change the meaning of `const` itself.

### 11. Hoisting: a useful but incomplete word

People often say "variables are hoisted." This sentence is too broad unless we explain what kind of variable and what operation is being discussed.

A better explanation is:

> Before normal statements execute, JavaScript creates the bindings required by the current script, module, function, or block. Different declarations give those bindings different setup behavior.

For example:

- A `var` binding is initialized to `undefined` during the relevant setup phase.
- A `let` or `const` binding is created but remains uninitialized until its declaration is evaluated. Access during that time throws a `ReferenceError` because of the TDZ.
- A `const` declaration also requires an initializer when the declaration is written.

Consider these two examples:

```js
console.log(varValue); // undefined
var varValue = "var";
```

```js
// console.log(letValue); // ReferenceError
let letValue = "let";
```

It is common to show the first one as if it were rewritten to:

```js
var varValue;
console.log(varValue);
varValue = "var";
```

That rewrite is a teaching model, not a literal source transformation. It helps explain the observable result, but it should not be used to claim that all code is physically moved.

Hoisting also does not mean that a variable's value is available before the code that computes it:

```js
var first = getFirstValue();
var second = first + 1;

function getFirstValue() {
  return 10;
}
```

The function declaration behavior is a separate topic. The important point here is that binding setup and value assignment are separate ideas.

### 12. Shadowing

**Shadowing** happens when an inner scope declares a name that has the same spelling as a name in an outer scope.

```js
const color = "blue";

{
  const color = "green";
  console.log(color); // green
}

console.log(color); // blue
```

The inner `color` does not change the outer `color`. It hides the outer binding while code inside the inner scope is using the same name.

A trace makes this clearer:

1. Outside the block, `color` resolves to the outer binding: `"blue"`.
2. Inside the block, JavaScript finds the inner binding first.
3. The outer binding still exists and still contains `"blue"`.
4. After leaving the block, the inner binding is no longer available.
5. `color` again resolves to the outer binding.

Shadowing can be intentional, but too much of it makes code harder to read:

```js
const user = { name: "Asha" };

function formatUser(user) {
  return user.name.toUpperCase();
}
```

The function parameter shadows the outer `user`. This is legal, but a clearer parameter name may reduce confusion:

```js
const currentUser = { name: "Asha" };

function formatUser(userRecord) {
  return userRecord.name.toUpperCase();
}
```

#### Shadowing versus reassignment

These are different:

```js
let count = 1;
count = 2; // Reassignment: same binding, new value

{
  let count = 3; // Shadowing: a new inner binding
  console.log(count); // 3
}

console.log(count); // 2
```

#### Illegal shadowing

Some combinations are rejected by the language's declaration rules. A common example is a `let` declaration in an inner block that conflicts with an outer `var` binding in a way that would create an invalid scope relationship:

```js
var value = "outer";
{
  // let value = "inner"; // SyntaxError in this scope relationship
}
```

The exact rules depend on the nesting and declaration kinds. Do not memorize one slogan such as "shadowing is always allowed." Instead, ask:

1. What is the outer declaration kind?
2. What is the inner declaration kind?
3. Are the declarations in the same scope or nested scopes?
4. Does the language permit those two bindings to coexist?

A safer everyday rule is to avoid unnecessary reuse of names across nearby scopes.

### 13. Same-scope redeclaration rules

`let` and `const` cannot be declared twice in the same lexical scope:

```js
let status = "pending";
// let status = "done"; // SyntaxError
```

```js
const port = 3000;
// const port = 4000; // SyntaxError
```

A `let` or `const` can have the same name in a nested block because that is shadowing, not same-scope redeclaration:

```js
let status = "outer";
{
  let status = "inner";
  console.log(status); // inner
}
console.log(status); // outer
```

`var` has more permissive rules within a function scope:

```js
var mode = "development";
var mode = "test";
console.log(mode); // test
```

Mixing declaration kinds can produce early errors:

```js
var name = "first";
// let name = "second"; // SyntaxError: conflicting declarations
```

An early error means the source is rejected before normal evaluation. If a file contains such a conflict, later `console.log` calls do not run.

### 14. Global, script, and module scope

The word "global" is often used too casually. There are several related ideas:

- A **global binding** is a name available at the outermost level of a script environment.
- The **global object** is an object supplied by the host environment.
- `globalThis` is the standard way to obtain the host's global object reference.
- A **module binding** belongs to one module and is not automatically a property of the global object.
- A Node.js CommonJS file is wrapped by Node in a module-local function, so top-level local declarations are not ordinary application-wide globals.

The exact behavior of a top-level declaration depends on whether the source is a classic script, an ECMAScript module, or a Node.js module format.

#### `globalThis`

`globalThis` gives code a standard reference to the host-provided global object:

```js
console.log(typeof globalThis); // "object" in common JavaScript hosts
```

The global object can have host-provided properties. For example, Node.js provides `process` as a runtime global in its supported module environments. Browser hosts provide different objects. The list is host-dependent.

Do not use `globalThis` as proof that every top-level name is a property of the global object.

#### Classic script example

In a browser-like classic script, top-level `var` commonly creates or interacts with a property of the global object, while top-level `let` and `const` create global lexical bindings that are not properties of that object:

```js
var scriptCount = 1;
let scriptName = "demo";
const scriptMode = "test";

console.log(globalThis.scriptCount); // Common classic-script behavior: 1
console.log(globalThis.scriptName);  // undefined
console.log(globalThis.scriptMode);  // undefined
```

This example is intentionally labeled as classic-script behavior. Do not copy it into a Node module and assume the same result.

#### ECMAScript module example

A module has its own top-level module scope:

```js
// example.mjs or a file loaded as an ECMAScript module
const moduleValue = 42;

console.log(moduleValue); // 42
console.log(globalThis.moduleValue); // Usually undefined
```

The module can use its own top-level binding, but that binding is not automatically a global-object property.

#### Node.js module example

Node.js module behavior depends on whether the project uses CommonJS or ECMAScript modules. In CommonJS, Node wraps each file so that top-level local declarations are local to that module:

```js
// config.cjs
const configuration = {
  port: 3000,
};

module.exports = configuration;
```

Another file does not automatically see the local name `configuration`; it receives the exported value according to the CommonJS module system.

This is a Node host behavior, not a general ECMAScript rule. Full CommonJS and ESM loading behavior belongs to the Node.js runtime section and the later modules lecture.

### 15. A scope lookup trace

Consider this example:

```js
const message = "outer";

function printMessage() {
  const message = "function";

  if (true) {
    const message = "block";
    console.log(message);
  }

  console.log(message);
}

printMessage();
console.log(message);
```

The output is:

```text
block
function
outer
```

Trace it from the inside outward:

1. The block's `message` is found first, so the first output is `block`.
2. After the block ends, the function's `message` is the nearest available binding, so the second output is `function`.
3. After the function returns, the outer `message` is used, so the third output is `outer`.

The three bindings have the same spelling, but they are separate bindings.

## Examples and Execution Traces

### Example 1: Declaration and assignment

```js
let temperature;
console.log(temperature); // undefined

temperature = 25;
console.log(temperature); // 25

temperature = 30;
console.log(temperature); // 30
```

Trace:

1. `temperature` is declared and initialized to `undefined` when the declaration executes.
2. The first output is `undefined`.
3. The value `25` is assigned.
4. The value `30` replaces `25` through reassignment.

### Example 2: `var` versus `let` before the declaration

```js
function compareDeclarations() {
  console.log(varValue); // undefined
  var varValue = "var";

  // console.log(letValue); // ReferenceError
  let letValue = "let";

  return [varValue, letValue];
}

console.log(compareDeclarations()); // ["var", "let"]
```

The `var` binding is available with the value `undefined` during the relevant setup. The `let` binding exists but is uninitialized until its declaration is reached, so accessing it during the TDZ throws.

If the commented `letValue` line is uncommented, the function throws before it can return the array.

### Example 3: `const` and mutation

```js
const settings = {
  retries: 2,
};

settings.retries = 3;
console.log(settings.retries); // 3

// settings = { retries: 4 }; // TypeError
```

The object property changes, but the `settings` binding still points to the same object.

### Example 4: `var` inside a loop block

```js
for (var index = 0; index < 2; index += 1) {
  console.log(index);
}

console.log(index); // 2
```

The `var` binding is not limited to the loop block. It remains available in the surrounding function or script scope.

Compare:

```js
for (let index = 0; index < 2; index += 1) {
  console.log(index);
}

// console.log(index); // ReferenceError
```

The `let` loop binding is scoped to the loop.

### Example 5: Shadowing does not change the outer value

```js
let status = "outside";

{
  let status = "inside";
  console.log(status); // inside
}

console.log(status); // outside
```

The inner declaration creates a new binding. It does not assign to the outer binding.

### Example 6: A TDZ caused by shadowing

```js
const price = 100;

function showPrice() {
  // console.log(price); // ReferenceError
  const price = 200;
  console.log(price); // 200
}

showPrice();
```

It may look as if the first `console.log` should read the outer `price`. It does not. The inner `const price` creates a binding for the whole function block. Before that declaration is evaluated, the inner binding is in its TDZ. The outer binding is shadowed during this scope.

This is a very important interview example: a later declaration can block access to an outer name before the declaration line is reached.

### Example 7: The loop declaration is a separate scope

```js
const values = [10, 20, 30];

for (let index = 0; index < values.length; index += 1) {
  const value = values[index];
  console.log(value);
}

// console.log(value); // ReferenceError
// console.log(index); // ReferenceError
```

Both `index` and `value` are limited to the loop's scope. This prevents temporary loop names from leaking into later code.

### Example 8: A whole-file early error

```js
let accountStatus = "pending";
// let accountStatus = "approved"; // SyntaxError

console.log("This line is not reached if the duplicate declaration is active.");
```

The duplicate lexical declaration is rejected before normal execution. This is different from a runtime `ReferenceError`, which occurs when already-parsed code tries to evaluate an unavailable or uninitialized binding.

## Compare & Recall

This table is a quick cheat for the most commonly confused pairs. Full explanations are in the sections above.

| Concept A | Concept B | Key difference |
|---|---|---|
| `var` | `let` / `const` | `var` is function-scoped and silently available before its line (as `undefined`); `let`/`const` are block-scoped and throw if read before their line (TDZ). |
| `let` | `const` | Both are block-scoped. `let` allows reassignment; `const` does not. |
| `const` | Deep immutability | `const` prevents the binding from pointing to a new value. It does **not** freeze the object the binding points to. Use `Object.freeze()` (shallow) for that — covered in [Day 11](day-11-property-descriptors-and-immutability.md). |
| Hoisting | Source rewriting | JavaScript doesn't move your code. "Hoisting" means bindings are created before execution starts — but `let`/`const` stay uninitialised until their line runs (TDZ). |
| Shadowing | Reassignment | Shadowing creates a **new** inner binding with the same name. Reassignment changes the value stored in an **existing** binding. |
| TDZ (Temporal Dead Zone) | `undefined` | `var` gives you `undefined` before its line. `let`/`const` throw a `ReferenceError` before their line — a very different outcome. |
| Function scope | Block scope | `var` leaks out of `if` blocks and loops into the surrounding function. `let`/`const` stay inside the block. |

> **Cross-day links:** Object mutation vs binding immutability is deepened in [Day 11](day-11-property-descriptors-and-immutability.md). Closures that capture variables are covered in [Day 08](day-08-closures-execution-context-and-this.md). Module scope and `import`/`export` are in [Day 17](day-17-modules-and-interoperability.md).

## Common Mistakes and Interview Traps

1. **Saying `let` and `const` are not hoisted.** Their bindings are created during setup, but they remain uninitialized in the TDZ until execution reaches the declaration.
2. **Saying hoisting literally moves source code.** Hoisting is a helpful informal word for binding setup and declaration behavior; it is not a source-code rewrite rule.
3. **Treating `var` as block-scoped.** `var` is function-scoped, so a block does not normally contain it.
4. **Treating `const` as deep immutability.** `const` prevents rebinding. It does not automatically freeze objects or arrays.
5. **Confusing shadowing with reassignment.** An inner declaration creates a new binding; assignment changes an existing binding.
6. **Assuming `typeof` is always safe.** It is often safe for a completely undeclared name, but it throws for a lexical binding currently in the TDZ.
7. **Assuming an outer variable is used before an inner declaration.** A later inner `let` or `const` can shadow the outer binding for the whole scope and cause a TDZ error before its declaration line.
8. **Assuming every top-level variable is global.** Script, module, CommonJS, and ESM boundaries behave differently.
9. **Calling every declaration conflict a runtime error.** Duplicate lexical declarations are syntax or early errors detected before normal execution.
10. **Using `var` redeclaration as a feature.** It is legal in many function-scope cases but can hide accidental duplicate declarations.
11. **Ignoring loop scope.** `let` and `const` keep loop variables local; `var` can leak the loop variable into the surrounding scope.
12. **Thinking a `const` array is safe shared state.** The binding cannot be replaced, but another part of the program may still push, remove, or edit elements.
13. **Using browser global examples as universal Node rules.** Global-object behavior depends on the host and source loading mode.
14. **Claiming an output was tested without running it.** Give a manual trace when the example was not executed, and state the runtime when it was executed.

## Tricky Points

### A. `var` and `let` can have the same spelling but different behavior

```js
console.log(typeof varName); // "undefined"
var varName = 1;

// console.log(typeof letName); // ReferenceError
let letName = 2;
```

The difference is not that one name exists and the other does not. Both declarations create bindings. The difference is the initialization state before the declaration is evaluated.

### B. TDZ applies to reads, including hidden-looking reads

The TDZ can appear in places that do not look like a simple `console.log`:

```js
let amount = 10;

function addTax(amount = amount * 0.1) {
  return amount;
}
```

The parameter named `amount` shadows the outer `amount`. The default expression tries to read the parameter before it has received an argument, so this pattern causes a `ReferenceError`. Use a different name when the default depends on an outer binding:

```js
const taxRate = 0.1;

function addTax(amount = 0) {
  return amount + amount * taxRate;
}
```

The parameter-initialization details are connected to function semantics and will be revisited later, but the scope rule is already visible here.

### C. `const` can protect a reference while the referenced value changes

```js
const account = { balance: 100 };
account.balance += 50;

console.log(account.balance); // 150
```

A reviewer should ask whether mutation is intended, not assume that `const` answers that question.

### D. Shadowing can make code look like it uses the wrong variable

```js
let timeout = 1_000;

function createOptions(timeout) {
  return { timeout };
}
```

This is legal. The parameter shadows the outer variable. Whether it is clear depends on context. Names such as `defaultTimeout` and `timeout` can make the relationship more obvious.

### E. Global object and global bindings are related but not identical

A host may expose a global object, but not every top-level declaration becomes a property on that object. In particular, module bindings are module-local, and top-level `let` and `const` are not treated like top-level `var` in classic scripts.

Always identify the source type and host before answering a global-scope question.

### F. Scope and lifetime are not the same question

A name may be unavailable by scope rules after a block ends, while the value it referred to may remain reachable through another reference. Conversely, a name may be available in a long-lived module scope and accidentally keep a large object alive. Scope tells you where a name can be used; it does not alone answer every memory-lifetime question.

## Practical Exercise: Trace Variables and Scope

### Goal

Trace a JavaScript program containing `var`, `let`, `const`, shadowing, and access before initialization. Explain each output and each error without relying on the vague phrase "it is hoisted."

### Input

Analyze this program first by hand:

```js
var applicationName = "billing";

function inspectConfiguration() {
  console.log(applicationName);

  if (true) {
    var applicationName = "payments";
    let region = "asia";
    const settings = { retries: 2 };

    settings.retries = 3;
    console.log(applicationName);
    console.log(region);
    console.log(settings.retries);
  }

  console.log(applicationName);
  // console.log(region);
  // console.log(settings);
}

inspectConfiguration();

const environment = "production";

{
  const environment = "test";
  console.log(environment);
}

console.log(environment);

function readBeforeDeclaration() {
  console.log(varValue);
  var varValue = "ready";

  // console.log(letValue);
  let letValue = "safe";
  console.log(letValue);
}

readBeforeDeclaration();
```

### Required outputs

1. State the output order for every active `console.log` call.
2. Explain why the first `applicationName` inside `inspectConfiguration` does not read the outer global-looking binding.
3. Identify the scope of each `applicationName`, `region`, `settings`, and `environment` binding.
4. Explain why changing `settings.retries` is allowed even though `settings` is declared with `const`.
5. Uncomment the `region` and `settings` logs and classify the resulting failures.
6. Uncomment the `letValue` log and classify the resulting failure.
7. Change the loop or block declarations to `var` in a small additional example and explain what leaks into the surrounding scope.
8. Add a deliberate duplicate `let` declaration and explain why the file is rejected before normal execution.

### Expected active output

```text
undefined
payments
asia
3
payments

test
production
undefined
safe
```

The blank line above is only visual separation between the end of `inspectConfiguration()` and the later block output. It is not produced unless the program explicitly logs an empty line.

### Explanation of the surprising first output

Inside `inspectConfiguration`, this declaration exists:

```js
var applicationName = "payments";
```

Because `var` is function-scoped, the function has its own `applicationName` binding. That binding is initialized to `undefined` during function setup. Therefore the first log inside the function prints `undefined`; it does not use the outer `applicationName` binding.

### Constraints

- Use the terms declaration, initialization, assignment, reassignment, scope, shadowing, and TDZ correctly.
- Separate syntax or early errors from runtime errors.
- Do not describe the program as if JavaScript moved every line to the top.
- State which behavior is ECMAScript behavior and which global behavior would depend on the host.
- Do not change the program's behavior by deleting the confusing declarations.

### Edge cases to test

- A `let` declaration without an initializer.
- A `const` declaration without an initializer.
- A `typeof` check for a completely undeclared name.
- A `typeof` check for a lexical binding in its TDZ.
- A `const` object property mutation.
- A `const` object reassignment.
- A nested block that shadows an outer name.

### Acceptance criteria

The exercise is complete when you can:

- Produce the active output in the correct order.
- Explain why the function-scoped `var` hides the outer binding before its declaration line.
- Identify all block and function boundaries.
- Explain the `const` mutation result without calling `const` deep immutability.
- Predict the error type for every uncommented failure.
- Explain why duplicate lexical declarations are rejected before execution.
- Verify the examples in a stated JavaScript runtime or clearly label the result as a manual trace.

### Focused verification plan

Use a current Node.js runtime or another JavaScript runtime available to you. Put each error case in a separate small file or run it separately so one failure does not prevent unrelated cases from being observed. Record:

- Runtime and version.
- Source form: script, CommonJS, or ECMAScript module.
- Exact output or error class.
- Whether the result is guaranteed by ECMAScript or depends on the host.

## Summary

A variable is a named binding to a value. A declaration introduces the name, initialization gives it its first value, assignment puts a value into an existing binding, and reassignment changes that value later.

`var` is function-scoped, can be used without an initializer, is initialized to `undefined` during the relevant setup, and can often be redeclared in the same function scope. It does not stay inside ordinary blocks.

`let` is block-scoped and can be reassigned. A `let` declaration without an initializer is allowed, but the binding cannot be read before its declaration is evaluated. That waiting period is the temporal dead zone.

`const` is block-scoped and must have an initializer. It prevents reassignment of the binding, but it does not make an object or array deeply immutable. Properties and elements can still change unless another rule prevents that mutation.

Hoisting is a short informal word for declaration and binding setup behavior. It does not mean that JavaScript literally moves every declaration to the top of the source file. `var`, `let`, and `const` have different setup and initialization rules.

Scope determines where a name can be found. JavaScript normally searches from the current scope outward. Shadowing creates a new inner binding with the same name as an outer binding; it is different from reassignment.

Global behavior depends on the source form and host. `globalThis` refers to the host-provided global object, but top-level module bindings and Node.js module-local bindings are not automatically global-object properties.

In Node.js applications, scope affects whether state is request-specific, module-specific, or shared across requests. A `const` reference can still point to mutable shared state, so declaration choice alone does not solve state-management problems.

## Cheat Sheet

| Topic | Rule |
| --- | --- |
| Binding | A connection between a name and a value |
| Declaration | Introduces a name |
| Initialization | Gives a binding its first value |
| Assignment | Puts a value into an existing writable binding |
| Reassignment | Assigns a new value after initialization |
| `var` | Function-scoped; initialized to `undefined`; redeclaration often allowed |
| `let` | Block-scoped; reassignable; TDZ before initialization |
| `const` | Block-scoped; initializer required; binding cannot be reassigned |
| `const` object | Object properties may still be mutated |
| Block scope | Scope created by `{ ... }`, `if`, loops, and similar constructs for `let`/`const` |
| Function scope | Scope created by a function; `var` belongs here |
| Hoisting | Informal term for declaration/binding setup behavior |
| TDZ | Time before a lexical binding is initialized; access throws `ReferenceError` |
| Shadowing | Inner binding uses the same name as an outer binding |
| Redeclaration | Declaring the same name again in one scope; rules depend on declaration kind |
| `globalThis` | Host-provided reference to the global object |
| Module scope | Top-level bindings local to one ECMAScript module |
| Node module scope | Top-level local declarations are module-local according to Node's module system |

**vs. quick reference**

| | `var` | `let` | `const` |
|---|---|---|---|
| Scope | Function | Block | Block |
| Before its line | `undefined` | ReferenceError (TDZ) | ReferenceError (TDZ) |
| Reassignable | ✓ Yes | ✓ Yes | ✗ No |
| Initializer required | ✗ No | ✗ No | ✓ Yes |
| Can redeclare | Usually yes | ✗ No | ✗ No |

| Term | Plain-English meaning |
|---|---|
| TDZ | "The binding exists but hasn't been given a value yet — don't touch it." |
| Shadowing | "I'm making a new variable with the same name in a smaller box." |
| Hoisting | "The name is registered before any code runs, but `let`/`const` stay locked until their line." |

For a variable question, ask:

1. What declaration kind is being used?
2. What is the nearest scope boundary?
3. Has the binding been created, initialized, or only declared in the source?
4. Is the code reading, assigning, or reassigning the binding?
5. Is there an inner binding shadowing an outer one?
6. Is the value itself mutable even if the binding is `const`?
7. Is the source a script, CommonJS module, or ECMAScript module?
8. Is the behavior supplied by ECMAScript or by the host runtime?

## Interview Questions

> Difficulty guide: **[Beginner]** = entry-level, **[Mid]** = requires understanding of internals, **[Senior]** = design and tradeoff thinking expected.

### 1. Deep Definitions and Mental Models

**[Beginner] Declaration vocabulary:** Explain declaration, initialization, assignment, and reassignment using one short example. Follow-up: Why does this vocabulary matter when explaining `const`?

**Expected answer shape:** Define all four terms, show the order in a small snippet, and explain that `const` allows initialization but not reassignment.

**[Mid] Scope lookup:** Explain how JavaScript resolves a name when it is used inside a nested block. Follow-up: What is the difference between lexical scope and a caller-dependent lookup rule?

**Expected answer shape:** Describe current-scope lookup followed by outer scopes, define lexical scope, and show a shadowing example.

**[Mid] Hoisting without folklore:** Give a precise explanation of hoisting for `var`, `let`, and `const`. Follow-up: Why is "`let` is not hoisted" incomplete?

**Expected answer shape:** Explain binding setup, `var` initialization to `undefined`, lexical TDZ behavior, required `const` initializer, and why literal source movement is only a teaching model.

### 2. Predict the Output and Trace Execution

**[Beginner] Function-scoped `var`:** What does this print and why?

```js
var label = "outer";

function readLabel() {
  console.log(label);
  var label = "inner";
}

readLabel();
```

Follow-up: Rewrite the behavior using an explicit setup model without claiming that JavaScript physically rewrites the source.

**Expected answer shape:** State `undefined`, identify the function-scoped `var` binding, explain its initialization state, and distinguish the model from literal source transformation.

**[Mid] TDZ and shadowing:** What happens here?

```js
const limit = 10;

function checkLimit() {
  console.log(limit);
  const limit = 20;
}

checkLimit();
```

Follow-up: What small rename would make the intended outer-variable read clear?

**Expected answer shape:** State that the call throws `ReferenceError`, explain that the inner `const` shadows the outer binding for the function scope and is in the TDZ before initialization, then provide a corrected version.

**[Beginner] Mutation versus reassignment:** Predict the output and classify the commented line.

```js
const profile = { active: false };
profile.active = true;
console.log(profile.active);
// profile = { active: true };
```

Follow-up: What additional operation would be needed to protect the property from direct mutation, and what limitation would remain?

**Expected answer shape:** State `true`, distinguish property mutation from binding reassignment, and explain that shallow freezing does not automatically protect nested objects.

**[Mid] Mixed scope trace:** Trace every output and error in this program without running it:

```js
let state = "outer";

function inspect() {
  console.log(state);
  if (true) {
    let state = "block";
    console.log(state);
  }
}

inspect();
console.log(state);
```

Follow-up: Change only the inner declaration to `var`. How does the answer change, and why?

**Expected answer shape:** Identify the TDZ error caused by the block's lexical binding before any successful output from the function, then explain how `var` changes the scope and initialization behavior.

### 3. Implementation and Verification Exercises

**[Senior] Scope checker design:** Design a small static-analysis rule that reports use-before-declaration for `let` and `const` within a lexical scope. State the information the tool must collect and two cases where a text-only regular expression would fail.

Follow-up: How would you avoid incorrectly reporting a name that appears inside a function which is never called?

**Expected answer shape:** Describe tokenization or an AST, lexical scope construction, declaration/reference tracking, TDZ-sensitive ordering, nested functions, and limitations of text matching.

**[Mid] Safe configuration boundary:** Design a JavaScript configuration module for a Node.js service. The configuration should be loaded once, passed to request handlers, avoid accidental global state, and prevent handlers from changing the original configuration accidentally.

Follow-up: Compare a shallow copy, deep copy, `Object.freeze`, and schema validation. Which guarantees does each provide?

**Expected answer shape:** State assumptions, show module and handler boundaries, discuss shared references, immutability depth, validation, startup failure, and operational tradeoffs.

### 4. Debugging and Failure Analysis

**[Beginner] Unexpected `undefined`:** A developer says, "The variable is declared, so it cannot be `undefined`." Give at least three different ways a declared variable can produce `undefined` without the same explanation applying to all of them.

Follow-up: How would you distinguish an uninitialized `var` from a missing property on an object?

**Expected answer shape:** Discuss `var` setup, a declaration without an initializer, a function that returns no value, and missing object properties; explain that binding state and property lookup are different questions.

**[Senior] Cross-request state bug:** A Node.js handler stores the current user's ID in a top-level `let` variable. Requests sometimes return another user's ID. Diagnose the scope and concurrency design problem and propose a corrected ownership model.

Follow-up: What additional test would detect the bug reliably instead of passing with one request at a time?

**Expected answer shape:** Identify module-level shared mutable state, move request-specific data into the handler or request context, explain overlapping requests, and propose concurrent or interleaved request tests.

### 5. Design and Tradeoff Questions

**[Mid] Choosing declaration forms:** Give a decision rule for choosing `const`, `let`, and `var` in new backend code. Follow-up: When might a codebase still contain `var` without that automatically meaning the code is broken?

**Expected answer shape:** Prefer `const` for non-reassigned bindings, `let` for deliberate reassignment, avoid new `var` unless compatibility or legacy conventions require it, and judge behavior rather than syntax alone.

**[Senior] Module state and ownership:** Design a small in-memory cache used by several service functions. Explain where the binding lives, who may mutate it, how it is bounded, how it is tested, and how it behaves when multiple requests use it.

Follow-up: When should the cache move out of process memory into an external store?

**Expected answer shape:** Cover ownership, module scope, mutation control, maximum size or TTL, invalidation, concurrent access assumptions, observability, process restart behavior, and consistency tradeoffs.

### 6. Senior-Level Node.js Follow-ups

**[Senior] Global state review:** A team proposes putting configuration and a service registry on `globalThis` so every module can access them. Review the design. Discuss test isolation, hidden dependencies, accidental mutation, module loading, worker or process boundaries, and observability.

Follow-up: Give a lower-coupling alternative that still avoids repeatedly constructing expensive resources.

**Expected answer shape:** Explain the convenience and risks, distinguish host global state from module scope, propose explicit dependency passing or a controlled composition root, and discuss lifecycle and test cleanup.

**[Mid] CommonJS and ESM boundary:** Explain why a top-level `const` in one Node.js module is not automatically available as a variable in another module. Compare explicit exports/imports with global state.

Follow-up: Which details must be checked in the Node project configuration before making a claim about how a file is loaded?

**Expected answer shape:** Explain module-local bindings, explicit module interfaces, CommonJS/ESM host loading assumptions, package configuration or file conventions, and why hidden globals weaken dependency boundaries.

**[Senior] Scope, memory, and reliability:** A long-running Node.js service has a module-level array declared with `const` that grows after every request. Explain why the declaration is legal, why `const` does not solve the problem, how scope differs from object reachability, and how you would redesign and monitor the state.

Follow-up: What evidence would distinguish a real retained-reference problem from a short-lived allocation spike?

**Expected answer shape:** Discuss mutable shared state, retention, bounded ownership, eviction or external storage, heap and allocation measurements, request volume, and a testable remediation plan.

