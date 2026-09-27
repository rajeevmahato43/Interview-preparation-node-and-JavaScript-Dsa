# Day 02: Variables, Scope, and Hoisting

<nav aria-label="Lecture navigation">

[← Day 01: Execution Model and Syntax](day-01-execution-model-and-syntax.md) | [Roadmap](../javascript-roadmap.md) | [Day 03: Values, Types, and Literals →](day-03-values-types-and-literals.md)

</nav>

---

## What You Will Learn Today

By the end of this lecture you should be able to:

- Choose correctly between `var`, `let`, and `const` and explain *why*.
- Predict where a variable is visible using the four JavaScript scope types.
- Explain how `var`, `let`, `const`, function declarations, and function expressions each behave during hoisting.
- Understand the Temporal Dead Zone (TDZ) and why it causes `ReferenceError`.
- Spot and fix accidental-global bugs in Node.js servers.

**Prerequisites:** [Day 01 – Execution Model and Syntax](day-01-execution-model-and-syntax.md) (parsing vs. runtime, strict mode basics).

---

## Quick Vocabulary Card

| Term | Definition |
| :--- | :--- |
| **Binding** | The engine's internal link between a name and a memory slot. |
| **Scope** | The region of source code where a binding can be accessed. |
| **Scope chain** | The ordered list of enclosing scopes the engine searches, from innermost to outermost, when resolving a name. |
| **Hoisting** | JavaScript reads all your `var`, `let`, `const`, and `function` declarations first, before running any code. |
| **TDZ** | Temporal Dead Zone — the time between entering a block and reaching the `let`/`const` line. Touching the variable here throws `ReferenceError`. |
| **Shadowing** | When an inner scope declares a variable with the same name as an outer scope variable, hiding the outer one within that inner scope. |

---

## 1. What Is a Variable?

A **variable** is a named binding that associates an identifier with a memory location holding a value. It lets you store, read, and update data by name during program execution.

### Variable Lifecycle (4 Stages)

Every variable moves through four stages:

| Stage | What happens | When it happens |
| :--- | :--- | :--- |
| **Declaration** | Name registered in the current scope | Before any code runs (during the engine's setup pass) |
| **Initialization** | Memory allocated and prepared for a value | `var`: during setup (`undefined`). `let`/`const`: when the engine *reaches* the declaration line |
| **Assignment** | Actual value written into the slot | When the `=` expression runs |
| **Reassignment** | Slot overwritten with a new value | Any subsequent `=` (not allowed for `const`) |

```js
// Node.js code
let status;          // Declaration + initialization (value: undefined)
status = "active";   // Assignment — first value written
status = "inactive"; // Reassignment — value overwritten
console.log(status); // "inactive"
```

---

## 2. `var` vs `let` vs `const`

JavaScript provides three declaration keywords (ES2015+). Each has distinct scoping, hoisting, and reassignment rules.

| Feature | `var` | `let` | `const` |
| :--- | :--- | :--- | :--- |
| **Scope** | Function / Global | Block `{}` | Block `{}` |
| **Hoisted state** | Initialized as `undefined` | Uninitialized (TDZ) | Uninitialized (TDZ) |
| **Re-declaration** | Allowed (silent) | `SyntaxError` | `SyntaxError` |
| **Reassignment** | Yes | Yes | `TypeError` |
| **Initial value** | Optional (defaults to `undefined`) | Optional (defaults to `undefined`) | **Required** |

### `var` — Function-Scoped, Legacy

`var` declares a variable scoped to the nearest function (or global if no function exists). It is hoisted with an initial value of `undefined` and allows re-declaration.

```js
// Node.js code
var count = 1;
var count = 2;         // ✅ Re-declaration — silently overwrites
console.log(count);    // 2
count = 99;            // ✅ Reassignment — allowed

function demo() {
  var x = 10;
}
// console.log(x);      // ❌ ReferenceError — var can't escape its function

if (true) {
  var leaked = "oops"; // ❌ var ignores block scope — this leaks out!
}
console.log(leaked);   // "oops" — var doesn't respect {}
```

### `let` — Block-Scoped, Reassignable

`let` declares a variable scoped to the nearest `{}` block. It is hoisted but stays in the TDZ until the declaration line runs. Re-declaration in the same scope is a `SyntaxError`.

```js
// Node.js code
let score = 10;
score = 20;            // ✅ Reassignment — allowed
console.log(score);    // 20

// let score = 30;     // ❌ SyntaxError: can't re-declare in the same scope

{
  let inner = "safe";
  console.log(inner);  // ✅ "safe" — visible inside this block
}
// console.log(inner); // ❌ ReferenceError — let can't escape its block

// console.log(x);     // ❌ ReferenceError — let is in TDZ before its declaration
// let x = 5;
```

### `const` — Block-Scoped, No Reassignment

`const` declares a block-scoped binding that **cannot be reassigned** after initialization. An initial value is mandatory. Like `let`, it sits in the TDZ until the engine reaches its line.

```js
// Node.js code
const API_PORT = 3000;
console.log(API_PORT);    // ✅ 3000 — reading is fine

// API_PORT = 4000;       // ❌ TypeError: can't reassign a const
// const noInit;          // ❌ SyntaxError: const must have an initial value
// const API_PORT = 5000; // ❌ SyntaxError: can't re-declare in the same scope

const user = { name: "Ali" };
user.name = "Bob";        // ✅ Mutating a property — allowed (see Section 3)
// user = { name: "Eve" }; // ❌ TypeError: can't reassign the binding itself
```

**Rule of thumb:** Default to `const`. Use `let` only when you must rebind (loop counters, accumulators). Avoid `var` in modern code (ES2015+/Node.js ≥ 6).

---

## 3. `const` — Immutable Binding vs Mutable Value

`const` creates an **immutable binding** (the identifier cannot point to a different memory address), but it does **not** make the stored value immutable. If the value is an object or array, its properties/elements can still be changed.

> **Analogy — Name-tag on a box:** `const` super-glues the name-tag to *one specific box*. You can't move the tag to another box (rebinding), but you can still reach inside and rearrange the items (mutating properties).

```js
// Node.js code
const config = { port: 3000 };
config.port = 8080;           // ✅ Mutation — changing a property inside the object
// config = { port: 9000 };   // ❌ TypeError — reassigning the binding itself

// To make the value immutable too, use Object.freeze():
const locked = Object.freeze({ port: 3000 });
locked.port = 8080;           // Silently ignored (TypeError in strict mode)
console.log(locked.port);     // 3000 — unchanged
```

**Key takeaway:** `const` = immutable *binding*. `Object.freeze()` = immutable *value* (shallow — nested objects are not frozen).

---

## 4. The Four Scopes

**Scope** is the region of source code where a declared identifier can be resolved. JavaScript has four scope types.

### 4.1 Global Scope

Identifiers declared at the top level (outside any function or module) live in global scope and are accessible everywhere in the program.

```js
// Node.js code
globalThis.serviceName = "AuthService";
console.log(globalThis.serviceName); // "AuthService" — visible everywhere
```

### 4.2 Function Scope

Identifiers declared inside a function body are visible only within that function. This is the only scope boundary that `var` respects.

```js
// Node.js code
function createToken() {
  var secret = "shh"; // Only visible inside createToken
  return secret.length;
}
// console.log(secret); // ReferenceError: secret is not defined
```

### 4.3 Block Scope (`{}`)

Any pair of curly braces (`if`, `for`, `while`, `switch`, or a standalone `{}`) creates a block scope for `let` and `const`. `var` ignores block boundaries entirely.

```js
// Node.js code
if (true) {
  var leaked = "escaped";  // var ignores the block — leaks to function/global scope
  let trapped = "safe";    // let is confined to this block
}
console.log(leaked);       // "escaped"
// console.log(trapped);   // ReferenceError: trapped is not defined
```

### 4.4 Module Scope (CommonJS / ESM)

Every module file gets its own top-level scope. Variables do not attach to the global object unless explicitly assigned to `globalThis`.

```js
// Node.js CommonJS file
const dbPassword = "root_pwd"; // Scoped to this file only — not global
module.exports = { ok: true }; // Only exported values are public
```

**One rule to remember:** `var` only respects function and global boundaries. `let`/`const` respect *every* `{}` block.

---

## 5. Scope Chain and Shadowing

### 5.1 Scope Chain

When the engine encounters an identifier, it searches the **scope chain** — starting from the current (innermost) scope and walking outward through each enclosing scope until it finds a match or reaches global scope (and throws `ReferenceError` if not found).

```js
// Node.js code
const appName = "MyApp"; // Global scope

function outer() {
  const version = "1.0"; // outer() scope

  function inner() {
    console.log(appName); // Found in global scope → "MyApp"
    console.log(version); // Found in outer() scope → "1.0"
  }
  inner();
}
outer();
```

**Key point:** Scope chain resolution is **lexical** — determined by where the code is *written*, not where it is *called*.

### 5.2 Variable Shadowing

When an inner scope declares a variable with the same name as an outer scope variable, the inner declaration **shadows** (hides) the outer one within that scope. The outer variable is unaffected.

> **Analogy — Name badges at a conference:** If two people named "Alex" are in the same room, you talk to the nearest one. The other "Alex" still exists in the hallway — just hidden from your view.

```js
// Node.js code
const role = "viewer";              // Outer scope

function dashboard() {
  const role = "admin";             // Shadows the outer 'role'
  console.log(role);                // "admin" — nearest match wins
}

dashboard();
console.log(role);                  // "viewer" — outer value unchanged
```

---

## 6. Hoisting

**Hoisting** means JavaScript reads through your code and picks up all declarations **before running anything**. So if you write a `var`, `let`, `const`, or `function` anywhere in a scope, JavaScript already knows about it from the very first line. The difference is what value each one starts with:

> **Analogy — Seating chart:** A wedding planner reads the entire guest list and assigns seats *before* anyone walks in. Every name is registered — but some seats have a placeholder guest (`var` → `undefined`), some have a name card only with nobody sitting yet (`let`/`const` → TDZ), and some seats have the guest already seated and ready (`function` declarations → fully callable).

### 6.1 `var` Hoisting

`var` declarations are moved to the top of their function (or global scope) and **auto-initialized to `undefined`**. You can access them before the declaration line — no error — but the value is `undefined`, not the assigned value.

```js
// Node.js code
console.log(greeting); // ✅ undefined — var is known, but value isn't assigned yet
var greeting = "hello";
console.log(greeting); // ✅ "hello" — now the assignment has run
```

**What the engine effectively does:**
```js
var greeting = undefined; // Setup: var hoisted and set to undefined
console.log(greeting);    // undefined
greeting = "hello";       // Run: assignment happens now
console.log(greeting);    // "hello"
```

### 6.2 `let` and `const` Hoisting

`let` and `const` are also hoisted — the engine knows they exist from the top of the block. But they are **not initialized**. Accessing them before the declaration line throws a `ReferenceError` (this is the TDZ, covered in Section 7).

```js
// Node.js code
{
  // console.log(name); // ❌ ReferenceError: Cannot access 'name' before initialization
  let name = "Alice";
  console.log(name);    // ✅ "Alice" — after the declaration, access works
}
```

```js
// Node.js code
{
  // console.log(MAX); // ❌ ReferenceError: Cannot access 'MAX' before initialization
  const MAX = 100;
  console.log(MAX);    // ✅ 100
}
```

### 6.3 Function Declaration Hoisting

Function declarations are hoisted **completely** — both the name and the entire function body are available from the top of the scope. You can call them before their declaration line.

```js
// Node.js code
console.log(greet()); // ✅ "hi!" — fully hoisted, callable before the declaration

function greet() {
  return "hi!";
}

// ❌ Don't confuse with function expressions — they are NOT fully hoisted:
// greet2(); // ❌ TypeError: greet2 is not a function (it's undefined right now)
var greet2 = function () { return "hi!"; };
console.log(greet2()); // ✅ "hi!" — works after the assignment line
```

### 6.4 Function Expression and Arrow Function Hoisting

Function expressions and arrow functions follow the hoisting rules of the **keyword used to declare them** (`var`, `let`, or `const`). Only the variable name is hoisted — the function body is *not*.

```js
// Node.js code — function expression with var
console.log(typeof sayHi); // ✅ "undefined" — name is hoisted, but it's not a function yet
// sayHi();                 // ❌ TypeError: sayHi is not a function
var sayHi = function () { return "hi!"; };
console.log(sayHi());      // ✅ "hi!" — now the assignment has run
```

```js
// Node.js code — arrow function with const
// add(1, 2);              // ❌ ReferenceError — const is in TDZ, can't access at all
const add = (a, b) => a + b;
console.log(add(1, 2));    // ✅ 3 — after the declaration, works fine
```

### 6.5 Hoisting Summary Table

| Declaration type | What gets hoisted | Pre-execution value | Can call/access before declaration line? |
| :--- | :--- | :--- | :--- |
| `var` | Name + initialization | `undefined` | ✅ (value is `undefined`) |
| `let` | Name only | ❌ Uninitialized (TDZ) | ❌ `ReferenceError` |
| `const` | Name only | ❌ Uninitialized (TDZ) | ❌ `ReferenceError` |
| `function` declaration | Name + entire body | Fully callable | ✅ |
| Function expression (`var`) | Name + initialization | `undefined` (not callable) | ❌ `TypeError` |
| Function expression (`let`/`const`) | Name only | ❌ Uninitialized (TDZ) | ❌ `ReferenceError` |

---

## 7. The Temporal Dead Zone (TDZ)

The **TDZ** is the time between entering a block and reaching the `let` or `const` line. JavaScript knows the variable exists (it was hoisted), but it hasn't been given a value yet — so any attempt to read, write, or even `typeof` it throws a `ReferenceError`.

> **Analogy — Package in transit:** Your parcel (variable) is registered in the tracking system (hoisted) but hasn't been delivered yet (uninitialized). If you try to open it before the courier arrives, the system errors out.

```js
// Node.js code
{
  // --- TDZ for 'apiKey' starts here (block entry) ---
  // console.log(apiKey); // ReferenceError: Cannot access 'apiKey' before initialization
  let apiKey = "secret_123";
  // --- TDZ for 'apiKey' ends here (declaration executed) ---
  console.log(apiKey); // "secret_123"
}
```

### 7.1 TDZ in Default Parameters

Function parameters are evaluated left-to-right, each in their own temporal order. A later parameter cannot be referenced by an earlier parameter's default value.

```js
// Node.js code
// ❌ 'b' is not yet initialized when 'a' tries to use it
// const broken = (a = b, b = 2) => a + b;
// broken(); // ReferenceError: Cannot access 'b' before initialization

// ✅ 'b' is initialized first, so 'a' can read it
const working = (b = 2, a = b) => a + b;
console.log(working()); // 4
```

### 7.2 Three TDZ Facts Interviewers Love

1. **`typeof` is NOT safe in the TDZ.** `typeof myLet` still throws a `ReferenceError` if `myLet` is declared with `let`/`const` in the same scope. (It *is* safe for completely undeclared names — returns `"undefined"`.)
2. **TDZ is temporal (time-based), not spatial (position-based).** Code written *above* a `let` line can reference it safely — as long as that code *executes after* the declaration runs.
3. **`var` has no TDZ.** It is always initialized to `undefined` during the setup pass, so accessing it early gives `undefined` instead of an error.

```js
// Node.js code — temporal TDZ demo
function logPort() {
  console.log(port); // Safe — this line RUNS after port is initialized
}

let port = 8080;     // port initialized here
logPort();           // 8080 — called after initialization, no TDZ violation
```

---

## 8. Node.js Relevance: Module Wrapper and Global Leaks

Node.js wraps every CommonJS file in an invisible function (`(function(exports, require, module, __filename, __dirname) { ... })`), giving each file its own function scope. However, if you assign to an undeclared identifier in non-strict mode, JavaScript creates a property on `globalThis`, leaking the variable across the entire process.

```js
// Node.js CommonJS — what the engine actually sees (simplified):
// (function(exports, require, module, __filename, __dirname) {
const safe = "scoped"; // stays inside the wrapper function
// })();
```

### Why Global Leaks Cause Real Production Bugs

In a Node.js server, all concurrent HTTP requests share the same `globalThis`. An accidental global variable means one request can overwrite another request's data.

```js
// Node.js code — BUG: 'userId' leaks to globalThis
function handleRequest(req) {
  userId = req.headers["x-user-id"]; // No keyword → creates globalThis.userId
}
// Under concurrent requests, Request B overwrites Request A's userId!
```

```js
// Node.js code — FIX
"use strict"; // or use ESM (strict by default)
function handleRequest(req) {
  const userId = req.headers["x-user-id"]; // Properly scoped to this call
}
```

**Key takeaway:** Always use `"use strict"` or ESM modules (which are strict by default). Never rely on implicit globals — they cause cross-request data leaks in servers.

---

## Tricky Points

### 1. Function Declaration vs `var` Hoisting Priority

When a `var` and a function declaration share the same name, the function wins during setup. But once the code runs, the `var` assignment overwrites it.

```js
// Node.js code
console.log(typeof compute); // "function" — function declaration hoisted first
var compute = 100;
console.log(typeof compute); // "number" — var assignment overwrites during execution
function compute() { return 1; }
```

### 2. Global `let` Does Not Attach to `globalThis`

Top-level `var` in a global script becomes a property of `globalThis`, but `let` and `const` live in a separate internal scope — they are never properties of `globalThis`.

```js
// Browser global scope (not inside a module)
var a = "attached";
let b = "detached";

console.log(globalThis.a); // "attached"
console.log(globalThis.b); // undefined — let never attaches to globalThis
```

### 3. The Classic `var`-in-a-Loop Trap

`var` creates a **single binding** shared across all loop iterations. Closures (e.g., callbacks) created inside the loop all capture the same variable — and read its final value when they execute.

`let` creates a **fresh binding per iteration**, so each closure captures its own copy.

```js
// Node.js code
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log("var:", i), 10);
}
// Output: "var: 3", "var: 3", "var: 3" — all callbacks read the final value

for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log("let:", j), 10);
}
// Output: "let: 0", "let: 1", "let: 2" — each callback has its own binding
```

---

## Hands-On Exercise: Fix the Leaky Request Tracker

A junior developer wrote a Node.js rate-limiter with three bugs. Find and fix them.

### Buggy Code

```js
// tracker.js — non-strict mode, Node.js code
function trackRequests(limit = max, max = 100) {
  clientIp = "127.0.0.1"; // Bug 1: leaks to globalThis

  for (var step = 0; step < 3; step++) { // Bug 2: var shares binding
    setTimeout(function () {
      console.log(`Step ${step} for ${clientIp}`);
    }, 10);
  }
}
```

### Acceptance Criteria

1. `trackRequests()` runs without `ReferenceError` (fix the parameter TDZ).
2. `clientIp` cannot leak to `globalThis`.
3. The timer logs `0`, `1`, `2` — not `3`, `3`, `3`.

### Solution

```js
// tracker.js — Node.js code
"use strict";

function trackRequests(max = 100, limit = max) { // Fix 1: valid parameter order (left-to-right)
  const clientIp = "127.0.0.1";                  // Fix 2: block-scoped, no global leak

  for (let step = 0; step < 3; step++) {          // Fix 3: let = fresh binding per iteration
    setTimeout(function () {
      console.log(`Step ${step} for ${clientIp}`);
    }, 10);
  }
}

trackRequests();
// Output:
// Step 0 for 127.0.0.1
// Step 1 for 127.0.0.1
// Step 2 for 127.0.0.1
```

---

## Summary

- A **variable** is a named binding that links an identifier to a memory slot. It progresses through **declaration → initialization → assignment → reassignment**.
- **`var`** is function-scoped, hoisted with `undefined`, and allows re-declaration. **`let`** is block-scoped, hoisted into the TDZ, and allows reassignment. **`const`** is block-scoped, hoisted into the TDZ, and forbids reassignment.
- `const` locks the *binding* (you can't reassign), but object/array *contents* remain mutable unless you use `Object.freeze()`.
- **Hoisting** registers all declarations before the first line runs. `var` gets `undefined`; `let`/`const` get the TDZ; function declarations are fully available; function expressions follow the keyword rule.
- **Scope chain** resolves identifiers from innermost to outermost scope. **Shadowing** hides outer variables without modifying them.
- In Node.js, each CommonJS file is wrapped in a function — but omitting a declaration keyword in non-strict mode creates a global leak that can cause **cross-request data corruption**.

---

## Cheat Sheet

### Declaration Quick-Reference

| Rule | `var` | `let` | `const` |
| :--- | :--- | :--- | :--- |
| Scope | Function / global | Block `{}` | Block `{}` |
| Hoisted as | `undefined` | TDZ | TDZ |
| Re-declaration | ✅ silent | ❌ `SyntaxError` | ❌ `SyntaxError` |
| Reassignment | ✅ | ✅ | ❌ `TypeError` |
| Attaches to `globalThis` | ✅ (global scope) | ❌ | ❌ |

### Hoisting Quick-Reference

| Declaration | Hoisted? | Value before declaration line |
| :--- | :--- | :--- |
| `var x = ...` | ✅ | `undefined` |
| `let x = ...` | ✅ (TDZ) | ❌ `ReferenceError` |
| `const x = ...` | ✅ (TDZ) | ❌ `ReferenceError` |
| `function f() {}` | ✅ fully | Callable |
| `var f = function() {}` | ✅ | `undefined` (not callable → `TypeError`) |
| `const f = () => {}` | ✅ (TDZ) | ❌ `ReferenceError` |

### When to Use What

| Situation | Use |
| :--- | :--- |
| Constants, configs, imports, function expressions | `const` (default) |
| Loop counters, accumulators, flags that change | `let` |
| Deeply frozen objects | `const` + `Object.freeze()` |
| Legacy code you haven't refactored yet | `var` (plan to migrate) |

### Common Pitfalls

- **Forgetting `const`/`let` inside an async handler** → global leak → cross-request data corruption.
- **Using `var` in a `for` loop with async callbacks** → all callbacks see the final value.
- **Assuming `typeof` is always safe** → it throws inside the TDZ for `let`/`const`.
- **Thinking `const` means immutable data** → it only prevents *rebinding*; object properties are still mutable.
- **Function expressions don't hoist like declarations** → `var f = function(){}` is `undefined` before the line, not callable.

---

## Interview Questions

### 1. What is the Temporal Dead Zone (TDZ)?

**Question:** What is the TDZ, why does it exist, and how does `typeof` behave inside it?

**Answer:** The TDZ is the period from entering a block to reaching the `let`/`const` declaration line. It exists because `let`/`const` are hoisted (JavaScript knows about them) but not initialized until the declaration runs — this catches use-before-define bugs that `var` silently hides with `undefined`. Inside the TDZ, even `typeof` throws a `ReferenceError`. For completely undeclared names, `typeof` safely returns `"undefined"` — but not for TDZ variables.

The TDZ also applies to default parameters: parameters are evaluated left-to-right, so an earlier default can't reference a later parameter.

---

### 2. What does this code output?

```js
let count = 10;
function run() {
  console.log(count);
  let count = 20;
}
run();
```

**Answer:** It throws `ReferenceError`. The inner `let count` is hoisted to the top of `run()`, which shadows the outer `count = 10`. But the inner `count` is in its TDZ until the `let count = 20` line, so `console.log(count)` throws.

If you change `let` to `var`, it would print `undefined` instead — because `var` hoists with auto-initialization to `undefined`.

---

### 3. Why does this Express middleware leak user data?

```js
app.use((req, res, next) => {
  sessionCtx = { userId: req.headers["x-user-id"] };
  next();
});
```

**Answer:** `sessionCtx` has no `const`/`let`/`var`, so in non-strict mode it becomes `globalThis.sessionCtx`. Node.js is single-threaded but handles requests concurrently via the event loop — so Request B can overwrite `globalThis.sessionCtx` before Request A finishes its async work, causing A to read B's data.

**Fix:** Use `const` to scope it locally, or attach state to `req` directly (`req.sessionCtx = { ... }`). Enable strict mode or use ESM (strict by default) so undeclared assignments throw `ReferenceError`. Detect this pattern with ESLint rules `no-undef` and `no-implicit-globals`.

---

### 4. What does `test()` return?

```js
var x = 10;
function test() {
  if (!x) {
    var x = 20;
  }
  return x;
}
console.log(test());
```

**Answer:** It returns `20`. The inner `var x` is hoisted to the top of `test()` and initialized to `undefined`, which shadows the outer `x = 10`. When execution reaches `if (!x)`, `!undefined` is `true`, so the `if` body runs and assigns `20`.

If you replace `var x = 20` with `let x = 20`, the outer `x = 10` is no longer shadowed at the `if (!x)` check. `!10` is `false`, the body is skipped, and `test()` returns `10`.

---

<nav aria-label="Lecture navigation">

[← Day 01: Execution Model and Syntax](day-01-execution-model-and-syntax.md) | [Roadmap](../javascript-roadmap.md) | [Day 03: Values, Types, and Literals →](day-03-values-types-and-literals.md)

</nav>


