# Day 06: Functions, Parameters, and Callbacks

<nav aria-label="Lecture navigation">

[Previous: Conditions, Loops, and Control Transfer](day-05-control-flow-and-loops.md) | [Roadmap](../javascript-roadmap.md) | [Next: Errors and Exception Flow](day-07-errors-and-exception-flow.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain why functions are values and how JavaScript passes them around.
- Distinguish function declarations, function expressions, and arrow functions.
- Use default, rest, and destructured parameters correctly.
- Explain return values, callback contracts, and higher-order functions.
- Understand the important differences between arrow functions and normal functions.
- Recognize `arguments`, parameter evaluation order, and accidental shared state.
- Design callback APIs that are clear about errors, results, and asynchronous behavior.

## Prerequisites

Read [Day 02: Variables, Declarations, and Scope Foundations](day-02-variables-scope-and-hoisting.md) and [Day 05: Conditions, Loops, and Control Transfer](day-05-control-flow-and-loops.md). Day 8 expands the closure and `this` ideas introduced here. Promises and `async` functions are covered later in Days 18"“19.

The examples use JavaScript. A callback can be synchronous or asynchronous; the function receiving it must state which contract it expects.

## Core Concepts

### 1. Functions are values

A function can be stored in a variable, passed as an argument, returned from another function, and stored in an object:

```js
function add(left, right) {
  return left + right;
}

const operation = add;
console.log(operation(2, 3)); // 5

function runOperation(first, second, chosenOperation) {
  return chosenOperation(first, second);
}

console.log(runOperation(4, 5, add)); // 9
```

A function call uses parentheses. Referring to the function without parentheses refers to the function value itself:

```js
console.log(typeof add); // "function"
console.log(add);        // the function value
console.log(add(1, 2));  // the returned number 3
```

This is the foundation of callbacks, middleware factories, event handlers, and functional array methods.

### 2. Function declaration, expression, and arrow function

A function declaration names a function directly:

```js
function greet(name) {
  return `Hello, ${name}`;
}
```

A function expression creates a function as part of an expression:

```js
const greet = function (name) {
  return `Hello, ${name}`;
};
```

An arrow function is another expression form:

```js
const greet = (name) => `Hello, ${name}`;
```

These forms can all produce callable behavior, but they differ in hoisting, `this`, `arguments`, constructor behavior, and syntax. Do not describe them as interchangeable in every context.

Function declarations are available earlier in their scope than a function expression assigned to `let` or `const`:

```js
console.log(declared()); // "ready"

function declared() {
  return "ready";
}

// assigned(); // ReferenceError if called before this line executes
const assigned = function () {
  return "also ready";
};
```

The declaration behavior does not mean the engine simply moves source text. It reflects how declarations are instantiated during setup.

### 3. Parameters and arguments

Parameters are local names in a function definition. Arguments are the values supplied by the caller:

```js
function multiply(first, second) {
  return first * second;
}

console.log(multiply(3, 4)); // 12
```

JavaScript does not require the argument count to match the parameter count:

```js
function show(first, second) {
  return [first, second];
}

console.log(show(1));       // [1, undefined]
console.log(show(1, 2, 3)); // [1, 2]
```

A function should decide whether missing or extra arguments are valid. Important application code should validate its contract instead of silently accepting an accidental call shape.

### 4. Default parameters

A default parameter is used when the corresponding argument is `undefined`:

```js
function connect(timeoutMs = 1_000) {
  return timeoutMs;
}

console.log(connect());           // 1000
console.log(connect(undefined));  // 1000
console.log(connect(null));       // null
console.log(connect(0));          // 0
```

The default does not replace every falsy value. This is the same distinction as `??` versus `||`.

Default expressions are evaluated when the function is called, from left to right:

```js
function createRange(start = 0, end = start + 10) {
  return [start, end];
}

console.log(createRange(5)); // [5, 15]
```

A later parameter can use an earlier parameter. A default parameter also changes some `arguments` behavior, so avoid depending on old aliasing details.

### 5. Rest parameters

A rest parameter gathers remaining arguments into a real array:

```js
function sum(first, ...remaining) {
  return [first, remaining];
}

console.log(sum(1, 2, 3)); // [1, [2, 3]]
```

Only one rest parameter is allowed, and it must be last. Rest parameters are clearer than manually reading `arguments` when the function intentionally accepts a variable number of values.

### 6. Destructured parameters

Parameters can unpack an object or array at the function boundary:

```js
function formatUser({ name, role = "member" }) {
  return `${name} (${role})`;
}

console.log(formatUser({ name: "Asha" })); // "Asha (member)"
```

The object itself must be supplied. The default for `role` does not make a missing whole argument valid:

```js
// formatUser(); // TypeError: cannot destructure undefined
```

Use a whole-parameter default when absence is valid:

```js
function formatOptionalUser({ name, role = "member" } = {}) {
  return name ? `${name} (${role})` : "anonymous";
}
```

### 7. Return values and side effects

A function can return a value or perform a side effect. A function without a return expression returns `undefined`:

```js
function logMessage(message) {
  console.log(message);
}

console.log(logMessage("ready")); // prints ready, then undefined
```

A useful design question is whether the function should calculate and return a result or change external state. Pure functions depend only on their inputs and do not change outside state:

```js
function addTax(amount, rate) {
  return amount + amount * rate;
}
```

A function that writes to a database, sends a message, or changes a shared object has side effects. Side effects are necessary in applications, but clear boundaries make testing and failure handling easier.

### 8. Higher-order functions and callbacks

A higher-order function accepts a function, returns a function, or both:

```js
function withLogging(operation) {
  return (...args) => {
    console.log("starting");
    const result = operation(...args);
    console.log("finished");
    return result;
  };
}

const loggedAdd = withLogging((left, right) => left + right);
console.log(loggedAdd(2, 3)); // logs start, finish, then 5
```

A callback contract should answer:

- When is the callback called?
- How many times can it be called?
- What arguments does it receive?
- Is it called synchronously or later?
- What happens if it throws?
- Does the caller wait for a returned promise?

Without these answers, a callback API is difficult to use safely.

### 9. Arrow function differences

Arrow functions have concise syntax and lexical `this`. They do not create their own `this`, `arguments`, or `super`, and they cannot be used with `new`:

```js
const object = {
  value: 10,
  normal() {
    return this.value;
  },
  arrow: () => this.value,
};

console.log(object.normal()); // 10
console.log(object.arrow());  // usually undefined; outer this is used
```

The exact outer `this` depends on the surrounding script or module host. The reliable point is that `object.arrow()` does not bind `this` to `object`.

Use arrows for callbacks when lexical `this` is wanted. Use a normal method or function when the call receiver should determine `this`.

### 10. The `arguments` object

Normal functions have an `arguments` object representing supplied arguments:

```js
function listArguments() {
  return Array.from(arguments);
}

console.log(listArguments("a", "b")); // ["a", "b"]
```

Arrow functions do not have their own `arguments`; an arrow reads from an outer function if one exists. Prefer named parameters and rest parameters in new code because they make the contract visible and provide real arrays.

## Detailed Explanations and Traces

### Parameter evaluation order

Arguments are evaluated before the function body runs and from left to right:

```js
let calls = 0;
function nextValue() {
  calls += 1;
  return calls;
}

function pair(first, second) {
  return [first, second];
}

console.log(pair(nextValue(), nextValue())); // [1, 2]
```

Default parameter expressions are evaluated only when needed:

```js
let defaultsUsed = 0;
function makeDefault() {
  defaultsUsed += 1;
  return "default";
}

function read(value = makeDefault()) {
  return value;
}

read("provided");
console.log(defaultsUsed); // 0
read();
console.log(defaultsUsed); // 1
```

This matters when a default expression performs work, reads state, or throws.

### Callback errors and asynchronous boundaries

A synchronous callback error can be caught by the function that calls it:

```js
function runNow(callback) {
  try {
    return callback();
  } catch (error) {
    return { ok: false, error };
  }
}
```

A callback scheduled to run later is outside the original `try` block:

```js
function runLater(callback) {
  try {
    setTimeout(callback, 0);
  } catch (error) {
    console.log("This does not catch a later callback error");
  }
}
```

The timer API is host behavior, and detailed scheduling belongs to later Node.js and async lectures. The function-design lesson is stable: document where errors go and how completion is reported.

## Compare & Recall

| Concept A | Concept B | Key difference |
|---|---|---|
| Function declaration | Function expression | Declarations are available before their line (hoisted fully). Expressions are only available after their line executes. |
| Arrow function | Regular function | Arrow: no own `this`, no `arguments`, can't use `new`. Regular: all of those exist. Use arrow for callbacks; use regular/method for objects and constructors. |
| Default parameter | `||` fallback | Default applies only when the argument is `undefined`. `||` applies for any falsy value (including `0`, `false`, `""`). |
| Rest parameter `...rest` | `arguments` | `rest` is a real array, works in arrows, and only collects remaining args. `arguments` is array-like, not available in arrows, and always holds all args. |
| Higher-order function | Callback | A higher-order function **accepts or returns** a function. A callback is the function **passed in**. Every callback is used by a higher-order function. |
| Synchronous callback | Asynchronous callback | Synchronous: runs immediately inside the same call stack — a `try/catch` around the call can catch its errors. Async: runs later (after event loop turn) — the original `try/catch` is already gone. |

> **Cross-day links:** `this` binding rules for functions (especially lost receivers) are the main topic of [Day 08](day-08-closures-execution-context-and-this.md). Promise and async/await function patterns are in [Days 18–19](day-18-promises-and-event-loop.md).

## Common Mistakes and Interview Traps

- Calling a function value when the API expects the function itself, or passing `operation()` instead of `operation`.
- Expecting default parameters to replace `null`, `0`, or `false`.
- Destructuring an absent argument without a whole-parameter default.
- Using an arrow function as an object method while expecting dynamic `this`.
- Using `arguments` inside an arrow and accidentally reading an outer function's arguments.
- Assuming a callback API automatically waits for a returned promise.
- Believing `return` inside a callback returns from the outer function.
- Designing a callback that may call completion twice.
- Sharing a mutable default object between calls. JavaScript evaluates default expressions per call, but a module-level object used as a default can still be shared.
- Hiding important side effects inside a function that looks like a pure calculation.

## Tricky Points

1. A default parameter is used for `undefined`, not for all missing-looking values.
2. Arrow functions capture `this` lexically and cannot be constructors.
3. Function declarations and function expressions have different initialization timing.
4. `arguments` is not an array and does not exist as a new binding inside an arrow function.
5. A callback's error and completion behavior depends on whether the callback is called now or later.

## Practical Exercise

**Goal:** Build a reusable callback adapter for a validation operation.

**Input:** A value, a validator function, and a completion callback.

**Task:** Call the validator exactly once, pass either `(null, result)` or `(error)` to the completion callback exactly once, and document whether synchronous throws are caught.

**Edge cases:** Missing validator, validator returning `false`, validator throwing, completion callback throwing, and a validator that returns a promise.

**Acceptance criteria:** State whether promise-returning validators are supported; if they are not, reject them clearly; if they are, provide a separate async version. Tests prove single completion and preserve the original error cause.

## Summary

- Functions are first-class values that can be stored, passed, and returned.
- Declarations, expressions, and arrows differ in initialization and behavior.
- Defaults apply to `undefined`; rest parameters gather remaining values into an array.
- Destructured parameters need a whole-argument default when absence is valid.
- Higher-order functions are useful only when their callback contract is clear.
- Arrow functions capture `this` and do not have their own `arguments`.
- Return values and side effects should be separated when possible.
- Synchronous and asynchronous callback errors cross different boundaries.

## Cheat Sheet

| Feature | Key rule |
| --- | --- |
| Function declaration | Named declaration with distinct initialization behavior |
| Function expression | Function created as an expression and assigned or passed |
| Arrow function | Lexical `this`, no own `arguments`, not constructible |
| Default parameter | Used when argument is `undefined` |
| Rest parameter | Real array of remaining arguments; must be last |
| Destructured parameter | Unpacks input; whole argument may need `= {}` |
| `arguments` | Array-like object in normal functions, not arrows |
| Higher-order function | Accepts or returns a function |
| Callback contract | Define timing, arguments, errors, count, and completion |

**vs. quick reference**

| | Arrow function | Regular function | Method shorthand |
|---|---|---|---|
| Own `this` | ✗ (lexical) | ✓ (call-site) | ✓ (call-site) |
| Own `arguments` | ✗ | ✓ | ✓ |
| Can use `new` | ✗ | ✓ | ✗ |
| Hoisted fully | ✗ | Declaration only | ✗ |
| Good for callbacks | ✓ | ✓ | ✗ |
| Good for methods | ✗ | ✓ | ✓ |

## Interview Questions

> Difficulty guide: **[Beginner]** = entry-level, **[Mid]** = requires understanding of internals, **[Senior]** = design and tradeoff thinking expected.

1. **[Beginner] Mental model:** Compare a function declaration, a function expression, and an arrow function in terms of hoisting, `this`, `arguments`, `new`, and return syntax.
   - **Expected answer shape:** Use a comparison table and give one example where the difference changes behavior.
   - **Follow-up:** Which form would you choose for a class method, a collection callback, and a constructor replacement?

2. **[Mid] Predict the output:** Trace a function with default parameters, a rest parameter, and side-effecting argument expressions.
   - **Expected answer shape:** Show argument evaluation order, which defaults run, the final parameter values, and the returned value.
   - **Follow-up:** How would a destructured parameter change the failure mode for `undefined`?

3. **[Senior] Implementation:** Design both synchronous and promise-aware versions of a callback adapter that guarantees completion exactly once.
   - **Expected answer shape:** Define accepted inputs, error normalization, completion ownership, and behavior when user code throws.
   - **Follow-up:** How would you prevent a malicious or buggy callback from causing duplicate completion?

4. **[Mid] Debugging:** A class method is passed directly as a callback and later fails because `this` is `undefined`. Diagnose and provide at least three fixes with tradeoffs.
   - **Expected answer shape:** Explain method extraction and call-site binding, then compare `bind`, wrapper arrows, and class-field arrows.
   - **Follow-up:** Which fix changes allocation or prototype behavior?

5. **[Senior] Design:** Design a service API that can run independent validation rules concurrently but returns deterministic errors.
   - **Expected answer shape:** Define callback or promise contract, ordering policy, failure aggregation, cancellation, and complexity.
   - **Follow-up:** What changes if one rule has a side effect and must not run concurrently?

