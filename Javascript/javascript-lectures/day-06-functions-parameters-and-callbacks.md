# Day 06: Functions, Parameters, and Callbacks

<nav aria-label="Lecture navigation">

[← Day 05: Control Flow and Loops](day-05-control-flow-and-loops.md) | [Roadmap](../javascript-roadmap.md) | [Day 07: Errors and Exception Flow →](day-07-errors-and-exception-flow.md)

</nav>

---

## What You Will Learn Today

By the end of this lecture, you should be able to:

- Treat functions as first-class values by passing, returning, and assigning them safely.
- Choose accurately between function declarations, function expressions, and arrow functions based on hoisting, `this`, and constructor needs.
- Master parameter features: default parameters, rest parameters (`...rest`), and destructured parameters.
- Avoid the missing-argument crash by providing whole-parameter defaults (`= {}`).
- Contrast the legacy `arguments` object with modern `...rest` parameters and avoid strict-mode aliasing bugs.
- Trace parameter evaluation order, temporal dead zones (TDZ) in parameter lists, and call-time default evaluation.
- Distinguish pure calculations from side-effecting operations to keep backend code testable and predictable.
- Build higher-order functions (HOFs) and define explicit callback contracts (execution timing, arguments, and invocation counts).
- Understand synchronous vs. asynchronous error boundaries and why `try/catch` cannot trap asynchronous callback exceptions.
- Implement resilient Node.js error-first callback patterns (`callback(err, data)`) that guarantee exactly-once invocation.

**Prerequisites:** [Day 02 – Variables, Scope, and Hoisting](day-02-variables-scope-and-hoisting.md) (lexical scope, hoisting, TDZ) and [Day 05 – Control Flow and Loops](day-05-control-flow-and-loops.md) (control transfer, truthiness vs. nullish checks).  
*Upcoming Connections:* [Day 07](day-07-errors-and-exception-flow.md) explores error handling and stack traces; [Day 08](day-08-closures-execution-context-and-this.md) details closures and execution context; [Days 18–19](day-18-promises-and-composition.md) advance callbacks into Promises and `async/await`.

---

## Quick Vocabulary Card

| Term | Definition |
| :--- | :--- |
| **First-Class Function** | A language property where functions are treated as regular values—they can be stored in variables, passed as arguments, and returned from other functions. |
| **Function Declaration** | A statement that defines a named function and registers it throughout its scope before any code runs (hoisted). |
| **Function Expression** | A function created inside an expression (often assigned to a variable) that evaluates only when execution reaches that line. |
| **Arrow Function** | A compact function syntax introduced in ES2015 that binds `this` and `arguments` lexically from its enclosing scope and cannot act as a constructor. |
| **Arity** | The formal number of parameters declared in a function definition (accessible via `fn.length`). |
| **Default Parameter** | A fallback expression evaluated at call time only when an argument is missing or explicitly passed as `undefined`. |
| **Rest Parameter (`...rest`)** | A syntax that aggregates all remaining unbound arguments into a true JavaScript `Array`. |
| **The `arguments` Object** | A legacy array-like object available inside non-arrow functions containing all arguments passed by the caller. |
| **Higher-Order Function (HOF)** | A function that accepts another function as an argument, returns a function, or does both. |
| **Callback** | A function passed as an argument to another function, intended to be executed synchronously or at a later time. |
| **Pure Function** | A function whose return value depends exclusively on its arguments and causes no observable side effects. |
| **Side Effect** | Any state mutation outside a function’s local scope, such as modifying global variables, mutating parameters, disk I/O, network requests, or console logging. |

---

## 1. Functions as First-Class Values

In JavaScript, **functions are first-class citizens**. This means a function is an object value (specifically, a callable object of type `"function"`) that can be used anywhere any other value (like a number, string, or object) can be used.

JavaScript allows you to:
1. Assign functions to variables, object properties, and array elements.
2. Pass functions as arguments to other functions.
3. Return functions from other functions.

### Referencing vs. Invoking

A function identifier without parentheses refers to the **function value itself**. Adding parentheses `()` **invokes** (executes) the function immediately.

```js
// Node.js code
function calculateTax(amount, rate) {
  return amount * rate;
}

// ✅ Storing the function in a variable (referencing without calling)
const computeFee = calculateTax;
console.log(typeof computeFee);        // "function"
console.log(computeFee(100, 0.1));     // 10

// ✅ Passing a function as an argument to another function
function runCalculation(a, b, operation) {
  return operation(a, b);
}
console.log(runCalculation(200, 0.05, calculateTax)); // 10

// ❌ Passing the invoked result instead of the function reference
// Passing calculateTax(200, 0.05) sends 10 (a number), not the function!
try {
  runCalculation(200, 0.05, calculateTax(200, 0.05));
} catch (err) {
  console.log("❌ Error:", err.message); // TypeError: operation is not a function
}
```

### Pure Functions vs. Side Effects

A **pure function** is deterministic: given the same inputs, it always returns the exact same output, and it modifies nothing outside its own local execution. A function has **side effects** if it alters external state, writes to files or databases, triggers network calls, or mutates objects passed by reference.

```js
// Node.js code

// ✅ Pure function: deterministic, no external dependencies, no mutation
function addLineItem(cart, item) {
  // Returns a new array rather than mutating the incoming cart
  return [...cart, { ...item, addedAt: 1700000000000 }];
}

// ❌ Impure function: mutates external state directly (accidental shared state bug)
const globalCart = [];
function impureAddToCart(item) {
  item.addedAt = Date.now(); // Mutates caller's object and relies on system clock
  globalCart.push(item);      // Mutates external array
}
```

---

## 2. Function Forms: Declarations, Expressions, and Arrows

JavaScript provides three primary ways to define functions: **Function Declarations**, **Function Expressions**, and **Arrow Functions**.

### Function Declarations

A **Function Declaration** defines a standalone named function statement. JavaScript reads and instantiates function declarations throughout their entire enclosing scope during setup, making them callable **before** their definition appears in the code.

```js
// Node.js code
// ✅ Callable before definition due to declaration hoisting
console.log(formatGreeting("Alice")); // "Hello, Alice!"

function formatGreeting(name) {
  return `Hello, ${name}!`;
}
```

### Function Expressions

A **Function Expression** defines a function as part of an assignment expression. The function is created only when execution reaches that line. When assigned to `const` or `let`, attempting to call the function beforehand results in a `ReferenceError` (due to the Temporal Dead Zone). If assigned to `var`, the variable is initialized to `undefined`, resulting in a `TypeError: ... is not a function`.

```js
// Node.js code
// ❌ Calling before definition throws ReferenceError
try {
  formatFarewell("Bob");
} catch (err) {
  console.log("❌ Error:", err.name); // ReferenceError: Cannot access 'formatFarewell' before initialization
}

// ✅ Function expression assigned to a const
const formatFarewell = function (name) {
  return `Goodbye, ${name}!`;
};

console.log(formatFarewell("Bob")); // "Goodbye, Bob!"
```

### Named Function Expressions (NFEs)

A **Named Function Expression (NFE)** is a function expression that includes an explicit name between the `function` keyword and its parameter list.

The function's name is available **only inside its own body** (useful for recursive calls without relying on external variable names) and provides clear, descriptive function names in stack traces.

```js
// Node.js code
const calculateFactorial = function factorial(n) {
  // ✅ The name 'factorial' is visible inside for recursion
  if (n <= 1) return 1;
  return n * factorial(n - 1);
};

console.log(calculateFactorial(4)); // 24

// ❌ The internal name is not exposed in the outer scope
console.log(typeof factorial); // "undefined"
```

### Arrow Functions

Introduced in ES2015, an **Arrow Function** provides a concise syntax using the `=>` operator. When the body contains a single expression, the braces and `return` keyword can be omitted for an **implicit return**.

```js
// Node.js code
// ✅ Implicit return with single expression
const square = (x) => x * x;

// ✅ Explicit return with block body
const multiply = (x, y) => {
  const result = x * y;
  return result;
};

// ❌ Returning an object literal without parentheses (interpreted as a code block!)
const makeUserBroken = (id) => { userId: id };
console.log(makeUserBroken(101)); // undefined

// ✅ Wrap object literal in parentheses to disambiguate from a block
const makeUserCorrect = (id) => ({ userId: id });
console.log(makeUserCorrect(101)); // { userId: 101 }
```

### Form Comparison

| Feature | Function Declaration | Function Expression | Named Function Expression | Arrow Function |
| :--- | :--- | :--- | :--- | :--- |
| **Syntax** | `function foo() {}` | `const foo = function() {}` | `const foo = function bar() {}` | `const foo = () => {}` |
| **Hoisting** | Fully hoisted (callable anywhere in scope) | Variable hoisted (TDZ with `const`/`let`) | Variable hoisted (TDZ with `const`/`let`) | Variable hoisted (TDZ with `const`/`let`) |
| **Own `this`** | ✅ Dynamic (call-site) | ✅ Dynamic (call-site) | ✅ Dynamic (call-site) | ❌ Lexical (from outer scope) |
| **Own `arguments`** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Lexical (from outer function) |
| **Can use `new`** | ✅ Yes (constructible) | ✅ Yes (constructible) | ✅ Yes (constructible) | ❌ No (`TypeError`) |
| **`prototype` property** | ✅ Yes (`foo.prototype`) | ✅ Yes (`foo.prototype`) | ✅ Yes (`foo.prototype`) | ❌ No (`undefined`) |
| **Stack Trace Name** | Name of function | Inferred variable name | Explicit inner name | Inferred variable name |

---

## 3. Arrow Function Differences and Limitations

Arrow functions are not just syntactic sugar for regular functions. They have deliberate design boundaries optimized for lightweight callbacks.

> **Analogy:** Think of a regular function as a private conference room: when you step inside, you get your own whiteboard (`this`), your own attendee roster (`arguments`), and your own door key (`new`). An arrow function is like an open glass divider in a bullpen: it has no private whiteboard or door key of its own; it simply looks up and uses whatever whiteboard and roster exist in the outer room.

### 1. Lexical `this` Binding

Arrow functions do not establish their own `this` context. Instead, they capture `this` from the enclosing lexical scope at the time they are defined.

Calling `.bind()`, `.call()`, or `.apply()` on an arrow function has **no effect** on its `this`.

```js
// Node.js code
const invoiceService = {
  currency: "USD",
  items: [100, 200, 300],

  // Method shorthand (regular function) has dynamic 'this'
  printReport() {
    // ✅ Arrow function inherits 'this' from printReport's execution context
    return this.items.map((amount) => `${this.currency} ${amount}`);
  },

  // ❌ Arrow function used directly as an object method inherits the global/module this
  brokenReport: () => {
    return `Currency: ${this?.currency}`; // 'this' is NOT invoiceService
  },
};

console.log(invoiceService.printReport()); // [ 'USD 100', 'USD 200', 'USD 300' ]
console.log(invoiceService.brokenReport()); // "Currency: undefined"
```

### 2. No `arguments` Object

Arrow functions do not create their own `arguments` binding. If an arrow function refers to `arguments`, it resolves to the `arguments` object of the closest non-arrow parent function.

```js
// Node.js code
function outerFunction() {
  // Arrow function borrows outerFunction's arguments!
  const arrowInner = () => {
    return arguments[0];
  };
  return arrowInner();
}

console.log(outerFunction("outer-arg")); // "outer-arg"

// ❌ Top-level arrow function referencing arguments
const topLevelArrow = () => {
  // In Node.js CommonJS modules, 'arguments' refers to the module wrapper's arguments!
  // In ES modules or browsers, it throws a ReferenceError.
  return typeof arguments !== "undefined";
};
console.log("Top-level arrow has own arguments:", topLevelArrow()); // true in CJS (module wrapper), but NOT its own!
```

### 3. Non-Constructible (Cannot use `new`)

Arrow functions lack an internal `[[Construct]]` method and do not have a `.prototype` property. Attempting to instantiate an arrow function with `new` throws an immediate `TypeError`.

```js
// Node.js code
function RegularUser(name) {
  this.name = name;
}
const ArrowUser = (name) => {
  this.name = name;
};

// ✅ Regular functions can be constructors
const user1 = new RegularUser("Dave");
console.log(user1.name); // "Dave"

// ❌ Arrow functions throw TypeError when used with 'new'
try {
  const user2 = new ArrowUser("Eve");
} catch (err) {
  console.log("❌ Error:", err.message); // TypeError: ArrowUser is not a constructor
}
```

---

## 4. Parameters and Arguments

In JavaScript, **parameters** are the variable names specified in a function's definition, while **arguments** are the actual values passed by the caller when invoking the function.

### Arity and Argument Mismatch

JavaScript does not enforce that the number of passed arguments matches the declared parameter count (the function's **arity**):
- If fewer arguments are passed than parameters declared, the unsupplied parameters evaluate to `undefined`.
- If more arguments are passed than parameters declared, the extra arguments are accepted without error and can be captured via rest parameters or the `arguments` object.

```js
// Node.js code
function configureServer(host, port, protocol) {
  console.log(`Configuring: ${protocol || "http"}://${host}:${port}`);
  return { host, port, protocol };
}

// Check arity (declared parameter count)
console.log("Declared arity:", configureServer.length); // 3

// ✅ Exactly matching arguments
configureServer("localhost", 3000, "https");

// ⚠️ Passing fewer arguments: unsupplied parameter 'protocol' defaults to undefined
configureServer("localhost", 8080); // Configuring: http://localhost:8080

// ⚠️ Passing extra arguments: extra values are ignored by declared parameters
configureServer("localhost", 5000, "http", "extra-arg-1", "extra-arg-2");
```

---

## 5. Default Parameters

A **Default Parameter** specifies a fallback expression used only when an argument is missing or passed explicitly as `undefined`.

### Only `undefined` Triggers Defaults

A default parameter does **not** trigger for other falsy values such as `null`, `false`, `0`, `""`, or `NaN`.

```js
// Node.js code
function connect(timeoutMs = 5000, retryCount = 3) {
  return { timeoutMs, retryCount };
}

// ✅ Missing arguments trigger defaults
console.log(connect()); // { timeoutMs: 5000, retryCount: 3 }

// ✅ Explicit 'undefined' triggers defaults
console.log(connect(undefined, undefined)); // { timeoutMs: 5000, retryCount: 3 }

// ❌ Passing 'null' or '0' DOES NOT trigger the default!
console.log(connect(null, 0)); // { timeoutMs: null, retryCount: 0 }
```

### Call-Time Dynamic Evaluation

Default parameter expressions evaluate **at call time**, only when the default is actually required. They are not evaluated when the function is defined.

```js
// Node.js code
let requestCounter = 0;
function generateRequestId() {
  requestCounter += 1;
  return `req_${requestCounter}`;
}

function handleRequest(payload, id = generateRequestId()) {
  return { id, payload };
}

// ✅ Default evaluates each time an argument is omitted
console.log(handleRequest("A")); // { id: 'req_1', payload: 'A' }
console.log(handleRequest("B")); // { id: 'req_2', payload: 'B' }

// ✅ Default expression is NEVER evaluated if an argument is provided
console.log(handleRequest("C", "custom_id")); // { id: 'custom_id', payload: 'C' }
console.log("Total generated IDs:", requestCounter); // 2 (not 3)
```

### Left-to-Right Evaluation and Parameter Scope

Default parameters are evaluated from left to right. Later parameters can reference earlier parameters, but earlier parameters cannot access later parameters because later parameters remain in their Temporal Dead Zone.

```js
// Node.js code
// ✅ Later parameter references earlier parameter
function createDateRange(start, durationDays = 7, end = start + durationDays) {
  return { start, end };
}
console.log(createDateRange(10)); // { start: 10, end: 17 }

// ❌ Earlier parameter references later parameter (TDZ violation)
function brokenRange(start = end - 5, end = 10) {
  return { start, end };
}
try {
  brokenRange();
} catch (err) {
  console.log("❌ Parameter TDZ Error:", err.name); // ReferenceError: Cannot access 'end' before initialization
}
```

---

## 6. Rest Parameters (`...rest`)

A **Rest Parameter** allows a function to collect an indefinite number of arguments into a genuine JavaScript `Array`.

### Rules of Rest Parameters

1. A function can have **only one** rest parameter.
2. The rest parameter must be the **last** parameter in the parameter list.
3. The rest parameter is an instance of `Array`, so array methods (`.map()`, `.filter()`, `.reduce()`) are available directly.

```js
// Node.js code
// ✅ Rest parameter collects all arguments after the first two
function logAudit(action, actor, ...metadata) {
  console.log(`Action: ${action} by ${actor}`);
  // metadata is a real Array
  const tags = metadata.map((item) => String(item).toUpperCase());
  return { action, actor, tags };
}

console.log(logAudit("DELETE", "admin", "orders_table", "ip:127.0.0.1", "urgent"));
// { action: 'DELETE', actor: 'admin', tags: [ 'ORDERS_TABLE', 'IP:127.0.0.1', 'URGENT' ] }

// ❌ Rest parameter not in final position throws SyntaxError
// function invalid(...rest, lastItem) {} // SyntaxError: Rest parameter must be last formal parameter
```

---

## 7. Destructured Parameters

**Destructured Parameters** unpack properties from objects or elements from arrays directly within the function signature. This makes API contracts explicit and eliminates boilerplate property access.

### Combining Property Defaults and Whole-Parameter Defaults

If an argument is completely omitted when calling a function with destructured parameters, JavaScript attempts to destructure `undefined`, throwing a `TypeError`. To make the entire parameter optional, provide a **whole-parameter default** `= {}`.

```js
// Node.js code

// ❌ Destructured parameter without whole-parameter default
function sendNotificationUnsafe({ channel = "email", priority = "normal" }) {
  return `Sending via ${channel} [${priority}]`;
}

// Works when passing an object:
console.log(sendNotificationUnsafe({ channel: "sms" })); // "Sending via sms [normal]"

// ❌ Throws TypeError when called with no arguments!
try {
  sendNotificationUnsafe();
} catch (err) {
  console.log("❌ Crash:", err.message); // TypeError: Cannot destructure property 'channel' of undefined
}

// ✅ Safe destructured parameter with whole-parameter default '= {}'
function sendNotificationSafe({ channel = "email", priority = "normal" } = {}) {
  return `Sending via ${channel} [${priority}]`;
}

console.log(sendNotificationSafe()); // "Sending via email [normal]"
```

---

## 8. The `arguments` Object vs. Rest Parameters

Before ES2015 introduced rest parameters, JavaScript functions used the special local variable `arguments` to inspect variable-length arguments.

### Key Characteristics of `arguments`

- It is **array-like**: it has a `.length` property and numeric indices (`arguments[0]`, `arguments[1]`), but does **not** inherit from `Array.prototype`. Methods like `.map()`, `.forEach()`, and `.filter()` do not exist on it.
- To use array methods, it must be converted: `Array.from(arguments)` or `[...arguments]`.
- In non-strict mode, `arguments` elements are aliased to the named parameters (modifying `arguments[0]` mutates the named parameter). In **strict mode** (`"use strict"`), this confusing aliasing is severed.
- Arrow functions **do not** have their own `arguments` object.

```js
// Node.js code
function legacySum() {
  // 'arguments' is array-like, not an Array
  console.log("Is real array:", Array.isArray(arguments)); // false

  // ❌ arguments.reduce is undefined
  // arguments.reduce((acc, n) => acc + n, 0); // TypeError: arguments.reduce is not a function

  // ✅ Convert to array using Array.from or spread
  const argsArray = Array.from(arguments);
  return argsArray.reduce((acc, n) => acc + n, 0);
}

console.log("Sum:", legacySum(10, 20, 30)); // 60

// ✅ Modern replacement: rest parameter
function modernSum(...numbers) {
  console.log("Is real array:", Array.isArray(numbers)); // true
  return numbers.reduce((acc, n) => acc + n, 0);
}
console.log("Sum:", modernSum(10, 20, 30)); // 60
```

### Comparison: `arguments` vs. `...rest`

| Feature | Legacy `arguments` | Modern `...rest` |
| :--- | :--- | :--- |
| **Type** | Array-like Object (`Object`) | Genuine `Array` instance |
| **Array Methods** | ❌ None (must convert via `Array.from`) | ✅ Built-in (`.map`, `.filter`, etc.) |
| **Arrow Functions** | ❌ Inherited from outer normal function | ✅ Supported directly |
| **Captures** | **All** passed arguments | Only **unbound remaining** arguments |
| **Strict Mode Aliasing** | Aliases parameters in sloppy mode; decoupled in strict mode | Independent bindings always |
| **Best Practice** | Avoid in modern JavaScript | Recommended for variable arguments |

---

## 9. Higher-Order Functions and Callback Contracts

A **Higher-Order Function (HOF)** is a function that does at least one of the following:
1. Takes one or more functions as arguments (callbacks).
2. Returns a new function as its result.

A **Callback** is a function passed to another function with the expectation that the receiver will execute it.

```js
// Node.js code
// Higher-Order Function: accepts an operation callback and returns a timing wrapper
function withTiming(fn) {
  return function timed(...args) {
    const start = performance.now();
    const result = fn(...args);
    const duration = performance.now() - start;
    console.log(`Executed in ${duration.toFixed(3)}ms`);
    return result;
  };
}

const slowOperation = (iterations) => {
  let sum = 0;
  for (let i = 0; i < iterations; i++) sum += i;
  return sum;
};

const timedOperation = withTiming(slowOperation);
timedOperation(1_000_000);
```

### Defining a Clear Callback Contract

Every callback-based API must define an explicit contract:
1. **Execution Timing:** Will the callback run **synchronously** (immediately on the current stack) or **asynchronously** (on a future event-loop tick)?
2. **Invocation Count:** Will the callback be invoked **zero times**, **exactly once**, or **multiple times** (e.g., streaming items)?
3. **Error Protocol:** How are errors reported? In Node.js, the standard is the **error-first callback** (`callback(error, result)`).

```js
// Node.js code
// ✅ Node.js Error-First Callback Contract
function findUserById(id, callback) {
  // Defensive check: ensure callback is callable
  if (typeof callback !== "function") {
    throw new TypeError("Callback must be a function");
  }

  // Simulate async database query
  setImmediate(() => {
    if (id <= 0) {
      // First argument is Error, second argument is undefined
      return callback(new Error("Invalid user ID: must be positive"));
    }
    // First argument is null (no error), second argument is data
    return callback(null, { id, username: `user_${id}` });
  });
}

findUserById(42, (err, user) => {
  if (err) {
    console.error("❌ Failed to fetch user:", err.message);
    return;
  }
  console.log("✅ User found:", user.username);
});
```

---

## 10. Synchronous vs. Asynchronous Error Boundaries

A major architectural trap in JavaScript functions is confusing **synchronous** callback errors with **asynchronous** callback errors.

### Synchronous Callback Errors

When a callback executes synchronously, it runs directly on the caller’s call stack. An enclosing `try/catch` block can intercept any exception thrown by the callback.

```js
// Node.js code
function executeSync(callback) {
  try {
    return { ok: true, data: callback() };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ✅ The enclosing try/catch safely catches the error
const result = executeSync(() => {
  throw new Error("Immediate failure");
});
console.log("Caught sync error:", result.ok, result.error); // Caught sync error: false Immediate failure
```

### Asynchronous Callback Errors

When a callback is scheduled for a future event-loop turn (via `setTimeout`, `setImmediate`, or I/O), the original call stack has already finished and returned. The enclosing `try/catch` **no longer exists** when the callback finally executes.

If an asynchronous callback throws an uncaught exception, it crashes the Node.js process unless an unhandled exception listener catches it.

```js
// Node.js code
function executeAsyncBroken(callback) {
  try {
    setTimeout(() => {
      // ❌ This error executes on a fresh call stack!
      // The outer try/catch is already gone!
      callback();
    }, 10);
  } catch (err) {
    // This block NEVER runs for timer errors
    console.log("This will never log!");
  }
}

// In Node.js, an unhandled throw inside a timer emits 'uncaughtException'
```

---

## Tricky Points

### 1. `null` Does Not Trigger Default Parameters
`null` is a valid, intentional object reference representing "no value". Default parameters evaluate **only** on `undefined`.
```js
// Node.js code
function configure(options = { port: 3000 }) {
  return options;
}
console.log(configure(null));      // null (default NOT applied)
console.log(configure(undefined)); // { port: 3000 }
```

### 2. Parameter Temporal Dead Zone (TDZ)
Defaults are evaluated sequentially. A default cannot reference a parameter declared after it.
```js
// Node.js code
// ❌ Throws ReferenceError: Cannot access 'b' before initialization
function tdzTrap(a = b, b = 2) { return a + b; }
try { tdzTrap(); } catch (e) { console.log("TDZ trap:", e.name); }
```

### 3. Missing Argument Crash on Destructured Parameters
Destructuring an argument without a fallback `= {}` causes a runtime `TypeError` when the function is called with zero arguments.
```js
// Node.js code
// ❌ Crashes if called without arguments: function parse({ mode } = {}) fixes it
function parse({ mode }) { return mode; }
try { parse(); } catch (e) { console.log("Destructure crash:", e.name); }
```

### 4. Arrow Functions as Methods Lose `this`
Arrow functions do not bind `this` to the object they are attached to; they bind to the lexical environment where the object literal was created.
```js
// Node.js code
const counter = {
  count: 0,
  // ❌ 'this' points to module.exports or global, NOT counter
  increment: () => { this.count = (this.count || 0) + 1; }
};
counter.increment();
console.log(counter.count); // 0 (unchanged!)
```

### 5. Passing Object Methods Directly as Callbacks Drops `this`
Extracting an object method and passing it as a callback disconnects the method from its parent object.
```js
// Node.js code
class Database {
  constructor(url) { this.url = url; }
  connect() { return `Connected to ${this.url}`; }
}
const db = new Database("mongodb://localhost:27017");

// ❌ Passing method reference directly: 'this' becomes undefined in strict mode
function runner(fn) {
  try { return fn(); } catch (e) { return e.message; }
}
console.log("Direct extraction:", runner(db.connect)); 
// Cannot read properties of undefined (reading 'url')

// ✅ Fix with arrow function wrapper or .bind()
console.log("Safe wrapper:", runner(() => db.connect())); // "Connected to mongodb://localhost:27017"
```

### 6. Arrow Functions Borrow Enclosing `arguments`
An arrow function has no `arguments` of its own. It silently references the enclosing non-arrow function's arguments.
```js
// Node.js code
function testOuter(outerVal) {
  const innerArrow = () => arguments[0];
  return innerArrow("innerVal");
}
console.log(testOuter("parent")); // "parent" (NOT "innerVal"!)
```

### 7. Shared Mutable Default Reference Trap
If a default parameter references an external object variable rather than instantiating a new literal, mutations to that default persist across calls.
```js
// Node.js code
const DEFAULT_CONFIG = { retries: 3 };

// ❌ Mutates the shared object reference across all callers
function connectWithShared(options = DEFAULT_CONFIG) {
  options.retries += 1;
  return options;
}
connectWithShared();
console.log(DEFAULT_CONFIG.retries); // 4 (shared config corrupted!)

// ✅ Always use inline object literals or factories for defaults
function connectWithSafe(options = { retries: 3 }) {
  options.retries += 1;
  return options;
}
```

### 8. `return` Inside a Callback Does Not Return from the Caller
Placing a `return` statement inside a callback (such as in `.forEach()` or an event listener) exits only that callback iteration, not the parent function.
```js
// Node.js code
function containsNegative(numbers) {
  numbers.forEach((n) => {
    if (n < 0) return true; // ❌ Only returns from this callback, NOT from containsNegative!
  });
  return false;
}
console.log(containsNegative([1, -2, 3])); // false (bug!)
```

---

## Hands-on Exercise

### Scenario: Building an Idempotent Error-First Callback Wrapper

You are building a utility for a Node.js microservice that communicates with third-party legacy APIs using callbacks. You must write a higher-order function, `createSafeCallbackAdapter`, that wraps an asynchronous task.

### Buggy Code

A developer wrote the following adapter, but it has severe production bugs:
1. It can invoke the completion callback multiple times if an error occurs after partial work.
2. It crashes with a `TypeError` if options are omitted.
3. It fails to catch synchronous exceptions thrown by the task.

```js
// Node.js code (Buggy implementation)
function buggyCallbackAdapter(taskFn, userCallback, options) {
  // Bug 1: Throws if options is undefined
  const { timeoutMs = 1000 } = options;

  let timer = setTimeout(() => {
    // Bug 2: Can fire after userCallback was already called
    userCallback(new Error("Operation timed out"));
  }, timeoutMs);

  // Bug 3: If taskFn throws synchronously, timer leaks and error is uncaught
  taskFn((err, result) => {
    clearTimeout(timer);
    // Bug 4: If taskFn invokes callback twice, userCallback runs twice
    userCallback(err, result);
  });
}
```

### Acceptance Criteria

1. **Guaranteed Exactly-Once Execution:** The user's callback must be called at most once, whether by successful completion, task error, synchronous exception, or timeout.
2. **Defensive Parameter Handling:** The `options` parameter must be optional (`= {}`) with a default `timeoutMs` of `1000`.
3. **Synchronous Exception Safety:** If `taskFn` throws synchronously, catch the exception, clear any pending timers, and pass the error to `userCallback`.
4. **Timer Resource Cleanup:** Cancel the timeout timer immediately if the task completes before the deadline to prevent holding the Node.js event loop open.

### Solution

```js
// Node.js code
function createSafeCallbackAdapter(taskFn, userCallback, { timeoutMs = 1000 } = {}) {
  // Validate callback
  if (typeof userCallback !== "function") {
    throw new TypeError("userCallback must be a function");
  }

  // Idempotency flag
  let called = false;
  let timer = null;

  // Single-completion dispatcher
  function complete(err, result) {
    if (called) return;
    called = true;

    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }

    userCallback(err, result);
  }

  // Set timeout deadline
  if (timeoutMs > 0) {
    timer = setTimeout(() => {
      complete(new Error(`Operation timed out after ${timeoutMs}ms`), null);
    }, timeoutMs);

    // Prevent timer from keeping the Node.js process alive if it's the only task
    if (typeof timer.unref === "function") {
      timer.unref();
    }
  }

  // Execute task defending against synchronous throws
  try {
    taskFn((err, result) => {
      complete(err, result);
    });
  } catch (syncError) {
    complete(syncError, null);
  }
}

// --- Verification Tests ---

// Test 1: Successful completion
createSafeCallbackAdapter(
  (done) => setTimeout(() => done(null, { status: "ready" }), 50),
  (err, res) => console.log("Test 1 Result:", err ? err.message : res.status)
);

// Test 2: Double-invoke protection
createSafeCallbackAdapter(
  (done) => {
    done(null, "first-win");
    done(null, "second-ignored");
  },
  (err, res) => console.log("Test 2 Result:", res) // Logs: "first-win" only
);

// Test 3: Synchronous throw protection
createSafeCallbackAdapter(
  () => { throw new Error("Sync crash inside task"); },
  (err) => console.log("Test 3 Result:", err.message) // Logs error safely
);

// Test 4: Timeout protection
createSafeCallbackAdapter(
  (done) => setTimeout(() => done(null, "too late"), 500),
  (err) => console.log("Test 4 Result:", err.message),
  { timeoutMs: 100 }
);
```

---

## Summary

- **First-Class Functions:** Functions are callable objects that can be stored in variables, passed as arguments, and returned from other functions.
- **Declarations vs. Expressions:** Function declarations are hoisted completely throughout their scope; function expressions are bound to variables and evaluate when reached at runtime.
- **Arrow Functions:** Provide concise syntax and lexical `this`/`arguments`. They cannot be constructors (`new`), have no `.prototype`, and should not be used as object methods.
- **Default Parameters:** Evaluated dynamically at call time only when arguments are omitted or passed as `undefined`. `null` does not trigger defaults.
- **Rest Parameters (`...rest`):** Aggregates unbound arguments into a true `Array` instance; must be the last parameter. Replaces the legacy `arguments` object.
- **Destructuring Safety:** Always provide a whole-parameter default (`= {}`) when destructuring parameters to avoid `TypeError: Cannot destructure property... of undefined`.
- **Pure Functions:** Produce predictable, testable software by separating pure calculation logic from state-mutating side effects.
- **Callback Contracts:** Must explicitly declare whether execution is synchronous or asynchronous, specify invocation counts (exactly-once), and adhere to Node.js error-first conventions.
- **Error Boundaries:** `try/catch` traps synchronous callback exceptions but cannot catch errors thrown inside asynchronous callbacks scheduled for future event-loop turns.

---

## Cheat Sheet

### Function Comparison

| Property | Function Declaration | Function Expression | Arrow Function | Method Shorthand |
| :--- | :--- | :--- | :--- | :--- |
| **Example** | `function f() {}` | `const f = function() {}` | `const f = () => {}` | `const o = { f() {} }` |
| **Hoisting** | Complete (callable early) | Variable only (TDZ) | Variable only (TDZ) | None (object property) |
| **Own `this`** | ✅ Dynamic (caller) | ✅ Dynamic (caller) | ❌ Lexical (enclosing) | ✅ Dynamic (caller) |
| **Own `arguments`** | ✅ Yes | ✅ Yes | ❌ Lexical (enclosing) | ✅ Yes |
| **Constructible (`new`)** | ✅ Yes | ✅ Yes | ❌ No (`TypeError`) | ❌ No (`TypeError`) |
| **Has `prototype`** | ✅ Yes | ✅ Yes | ❌ No (`undefined`) | ❌ No (`undefined`) |

### Parameter Handling

| Feature | Syntax | Behavior |
| :--- | :--- | :--- |
| **Default** | `fn(x = 10)` | Triggers **only** when `x === undefined` |
| **Rest** | `fn(first, ...rest)` | Collects remaining args into a genuine `Array` |
| **Destructuring** | `fn({ id } = {})` | Unpacks property; `= {}` prevents crash if argument is missing |
| **Legacy Args** | `arguments` | Array-like object; unbundled from params in strict mode |

### Common Pitfalls

- **Passing `operation()` instead of `operation`** → invokes the function immediately and passes its return value instead of the function itself.
- **Expecting default parameters to replace `null`, `0`, or `false`** → default parameters trigger **only** on `undefined`.
- **Destructuring parameters without `= {}`** → calling the function with zero arguments throws an unhandled `TypeError`.
- **Using arrow functions for object methods** → `this` resolves lexically to outer scope, breaking property access.
- **Extracting methods as callbacks without `.bind()`** → extracting `obj.method` separates it from `obj`, making `this` `undefined` in strict mode.
- **Assuming `try/catch` catches asynchronous callback errors** → the outer stack is gone when the timer/IO callback runs; errors become uncaught exceptions.
- **Calling a callback multiple times** → causes race conditions, double responses in Express, and corrupted state. Always guard callbacks with an idempotency check.

---

## Interview Questions

### 1. What are the key differences between function declarations, function expressions, and arrow functions?

**Question:** Compare function declarations, function expressions, and arrow functions. Focus on hoisting, `this` binding, `arguments`, and suitability as constructors and object methods.

**Answer:**
1. **Hoisting & Initialization:**
   - **Function Declarations:** The entire function definition is hoisted to the top of its enclosing scope before execution. You can safely call it before its line of definition.
   - **Function Expressions & Arrow Functions:** The variable declaring them is hoisted (into the TDZ if declared with `let`/`const`, or initialized to `undefined` if with `var`). Calling them before their assignment line throws a `ReferenceError` or `TypeError`.
2. **`this` Binding:**
   - **Declarations & Expressions:** Have a dynamic `this` determined by how the function is invoked at runtime (e.g., `obj.fn()` binds `this` to `obj`, while a plain call `fn()` binds `this` to `undefined` in strict mode or the global object in non-strict mode).
   - **Arrow Functions:** Do not have their own `this`. They capture `this` lexically from their enclosing scope when defined and cannot be rebound using `.bind()`, `.call()`, or `.apply()`.
3. **`arguments` Object:**
   - Declarations and expressions receive an `arguments` array-like object containing all passed arguments.
   - Arrow functions do not create an `arguments` object; referencing `arguments` inside an arrow function accesses the outer function's `arguments`.
4. **Constructors & Prototypes:**
   - Declarations and expressions have an internal `[[Construct]]` method and a `.prototype` property, allowing them to be instantiated with `new`.
   - Arrow functions lack `[[Construct]]` and `.prototype`. Attempting `new ArrowFn()` throws a `TypeError`.
5. **Practical Selection:**
   - Use **Arrow Functions** for non-method callbacks (e.g., in `.map()`, `.filter()`, promise chains, and timer callbacks) to preserve lexical `this`.
   - Use **Function Declarations** or **Method Shorthand** for top-level utility libraries and object/class methods where `this` should point to the receiver.

---

### 2. Predict the output of this parameter evaluation and TDZ snippet

```js
let count = 0;
const getNext = () => ++count;

function calculate(a = getNext(), b = a * 2, c = getNext()) {
  return [a, b, c];
}

console.log(calculate());
console.log(calculate(10));
console.log(calculate(undefined, null, undefined));
console.log("Final count:", count);
```

**Question:** What does this code print, and what rules govern which default parameter expressions are evaluated?

**Answer:**
**Output:**
```text
[ 1, 2, 2 ]
[ 10, 20, 3 ]
[ 4, null, 5 ]
Final count: 5
```

**Explanation:**
1. **First call `calculate()`:**
   - `a` is omitted (`undefined`), so `getNext()` runs: `count` becomes 1, `a = 1`.
   - `b` is omitted, so `a * 2` runs: `1 * 2 = 2`.
   - `c` is omitted, so `getNext()` runs: `count` becomes 2, `c = 2`.
   - Result: `[1, 2, 2]`.
2. **Second call `calculate(10)`:**
   - `a` is provided (`10`), so its default `getNext()` is skipped.
   - `b` is omitted, so `a * 2` runs: `10 * 2 = 20`.
   - `c` is omitted, so `getNext()` runs: `count` becomes 3, `c = 3`.
   - Result: `[10, 20, 3]`.
3. **Third call `calculate(undefined, null, undefined)`:**
   - `a` is explicitly `undefined`, triggering `getNext()`: `count` becomes 4, `a = 4`.
   - `b` is explicitly `null`. Default parameters trigger **only on `undefined`**, so `b` remains `null`.
   - `c` is explicitly `undefined`, triggering `getNext()`: `count` becomes 5, `c = 5`.
   - Result: `[4, null, 5]`.
4. **Final count:** `getNext()` was executed a total of 5 times, so `count` is 5.

---

### 3. Debugging: Why does passing a class method as a callback fail?

```js
class PaymentGateway {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  processPayment(amount) {
    if (!this.apiKey) {
      throw new Error("Missing API key");
    }
    return `Processed $${amount} with key ${this.apiKey.slice(0, 4)}***`;
  }
}

const gateway = new PaymentGateway("secret_live_key_998877");
const queue = [100, 250, 400];

// ❌ Fails with TypeError
const results = queue.map(gateway.processPayment);
```

**Question:** Why does `queue.map(gateway.processPayment)` fail at runtime? Explain the underlying mechanism and provide three ways to fix it, noting their tradeoffs.

**Answer:**
**The Mechanism:**
`gateway.processPayment` is a method lookup that evaluates to a function reference. Passing it to `queue.map(...)` passes the function reference detached from its object instance (`gateway`).

When `map` invokes the callback, it calls it as a standalone function call (`callback(element, index, array)`), not as a method on `gateway`. In JavaScript classes, code is executed in **strict mode** (`"use strict"`), which causes the standalone call's `this` to be `undefined`. When the function tries to evaluate `this.apiKey`, it throws `TypeError: Cannot read properties of undefined (reading 'apiKey')`.

**Three Fixes:**
1. **Arrow Function Wrapper (Recommended):**
   ```js
   const results = queue.map((amt) => gateway.processPayment(amt));
   ```
   *Tradeoff:* Minimal overhead, clear intent, preserves normal prototype inheritance on `PaymentGateway`.
2. **Explicit `.bind()`:**
   ```js
   const results = queue.map(gateway.processPayment.bind(gateway));
   ```
   *Tradeoff:* Creates a bound function wrapper instance. Works reliably, but slightly more verbose.
3. **Class Field Arrow Property:**
   ```js
   class PaymentGateway {
     constructor(apiKey) {
       this.apiKey = apiKey;
     }
     processPayment = (amount) => {
       return `Processed $${amount} with key ${this.apiKey.slice(0, 4)}***`;
     };
   }
   ```
   *Tradeoff:* Automatically binds `this` to the instance. However, this creates a new copy of the function on every instance rather than sharing a single method on `PaymentGateway.prototype`, increasing memory footprint when creating many instances.

---

### 4. Node.js Scenario: Designing an Idempotent Error-First Callback Wrapper

**Question:** In Node.js backend services, callback-based operations risk invoking the callback multiple times (e.g., if an error occurs after a partial response or a network timeout races with a success event) or failing to catch synchronous exceptions. Design a higher-order wrapper, `onceWithTimeout`, that accepts a callback function and a timeout in milliseconds, ensuring the callback is invoked exactly once.

**Answer:**
To guarantee safe execution in a Node.js callback-based system, the wrapper must:
1. Maintain an internal `called` boolean flag to enforce idempotency.
2. Register a timer via `setTimeout` to enforce the deadline.
3. Clear the timer immediately upon completion so it does not hold the Node.js event loop open.
4. Call `timer.unref()` if supported, allowing the process to exit cleanly if this timer is the only remaining handle.
5. Wrap execution in a `try/catch` to convert synchronous throws into standard error-first callback invocations.

```js
// Node.js code
function onceWithTimeout(fn, timeoutMs, finalCallback) {
  if (typeof finalCallback !== "function") {
    throw new TypeError("finalCallback must be a function");
  }

  let isCompleted = false;
  let timer = null;

  function dispatch(err, data) {
    if (isCompleted) return;
    isCompleted = true;

    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }

    finalCallback(err, data);
  }

  // Setup deadline timeout
  if (timeoutMs > 0) {
    timer = setTimeout(() => {
      dispatch(new Error(`Operation exceeded deadline of ${timeoutMs}ms`), null);
    }, timeoutMs);

    if (typeof timer.unref === "function") {
      timer.unref();
    }
  }

  // Run target function with protected completion
  try {
    fn((err, result) => {
      dispatch(err, result);
    });
  } catch (syncError) {
    dispatch(syncError, null);
  }
}

// Example Usage:
function flakyAsyncService(callback) {
  // Simulates a bug where both error and success might fire
  setTimeout(() => callback(null, { status: 200 }), 50);
  setTimeout(() => callback(new Error("Late error")), 100);
}

onceWithTimeout(
  flakyAsyncService,
  1000,
  (err, res) => {
    if (err) console.error("Request failed:", err.message);
    else console.log("Request succeeded:", res);
  }
);
```

---

<nav aria-label="Lecture navigation">

[← Day 05: Control Flow and Loops](day-05-control-flow-and-loops.md) | [Roadmap](../javascript-roadmap.md) | [Day 07: Errors and Exception Flow →](day-07-errors-and-exception-flow.md)

</nav>
