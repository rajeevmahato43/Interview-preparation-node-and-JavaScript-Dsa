# Day 08: Closures, Execution Context, and `this`

<nav aria-label="Lecture navigation">

[Previous: Errors and Exception Flow](day-07-errors-and-exception-flow.md) | [Roadmap](../javascript-roadmap.md) | [Next: Objects and Property Access](day-09-objects-and-property-access.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain lexical scope and the scope chain.
- Describe a closure as a function plus the bindings it can still reach.
- Trace closure capture in loops and asynchronous callbacks.
- Explain how a function call determines `this` for normal functions.
- Distinguish method calls, plain calls, constructor calls, and explicit binding.
- Explain why arrow functions use lexical `this`.
- Recognize closure-retained memory and lost method receivers in Node.js code.

## Prerequisites

Read [Day 02: JavaScript Variables, Declarations, and Scope Foundations](day-02-variables-scope-and-hoisting.md) and [Day 06: Functions, Parameters, and Callbacks](day-06-functions-parameters-and-callbacks.md). Day 7 explains thrown errors that may travel through these call stacks. Day 9 applies scope and receiver ideas to object property access.

This lecture uses the language concept of lexical scope and the call-site rules for `this`. Host differences, such as module wrappers and timer APIs, are called out where they matter.

## Core Concepts

### 1. Lexical scope

Lexical scope means a name is resolved based on where code is written. JavaScript does not normally choose a variable by looking at the caller's local variables.

```js
const outside = "outer";

function readOutside() {
  return outside;
}

function callReader() {
  const outside = "caller";
  return readOutside();
}

console.log(callReader()); // "outer"
```

`readOutside` was written where the outer `outside` exists, so it uses that binding. The caller's local variable does not replace it.

When JavaScript evaluates a name, it searches the current lexical environment, then the nearest outer environment, and continues outward. If no binding is found, evaluating the name produces a `ReferenceError`.

### 2. A closure keeps access to bindings

A closure is a function together with access to the lexical bindings from its surrounding code. The outer function can finish, but an inner function can keep using the binding:

```js
function createCounter() {
  let count = 0;

  return function next() {
    count += 1;
    return count;
  };
}

const nextCount = createCounter();
console.log(nextCount()); // 1
console.log(nextCount()); // 2
```

`count` is not a global variable. It is private to the returned function and remains reachable because `nextCount` can still access it.

Two calls to the factory create separate bindings:

```js
const firstCounter = createCounter();
const secondCounter = createCounter();

console.log(firstCounter());  // 1
console.log(secondCounter()); // 1
```

Closures are useful for factories, private state, dependency injection, memoization, and callbacks. They are not magic copies of values; they retain access to bindings.

### 3. Closures capture bindings, not always snapshots

A callback sees the current value of the binding it captured:

```js
let status = "pending";
const readStatus = () => status;

status = "done";
console.log(readStatus()); // "done"
```

The callback captured the `status` binding. It did not copy the string at the time the arrow was created.

A new binding can be created for each iteration with `let`:

```js
const readers = [];
for (let index = 0; index < 3; index += 1) {
  readers.push(() => index);
}

console.log(readers.map((reader) => reader())); // [0, 1, 2]
```

With `var`, the callbacks share one function-scoped binding:

```js
const readers = [];
for (var index = 0; index < 3; index += 1) {
  readers.push(() => index);
}

console.log(readers.map((reader) => reader())); // [3, 3, 3]
```

### 4. `this` is not lexical scope

For a normal function, `this` is determined mainly by how the function is called. It is not chosen simply by where the function was written.

```js
const user = {
  name: "Asha",
  sayName() {
    return this.name;
  },
};

console.log(user.sayName()); // "Asha"
```

The call has the form `object.method()`, so `this` is the object before the dot.

Extracting the method changes the call form:

```js
const sayName = user.sayName;
// sayName(); // In strict-mode code, this is undefined and access fails.
```

The function still has the same code, but it no longer receives `user` as its receiver.

### 5. Plain calls and strict mode

In strict-mode code, a normal function called without a receiver gets `this === undefined`:

```js
"use strict";

function inspectThis() {
  return this;
}

console.log(inspectThis()); // undefined
```

In non-strict functions, a plain call may substitute the global object. The exact global object is host-provided. Modules are strict, and Node module behavior also depends on whether the file is ESM or CommonJS. Do not rely on accidental global substitution in application code.

### 6. Explicit binding: `call`, `apply`, and `bind`

`call` invokes a function immediately with a chosen receiver and individual arguments:

```js
function introduce(greeting) {
  return `${greeting}, ${this.name}`;
}

const user = { name: "Mina" };
console.log(introduce.call(user, "Hello")); // "Hello, Mina"
```

`apply` is similar but receives arguments as an array-like value:

```js
console.log(introduce.apply(user, ["Hi"])); // "Hi, Mina"
```

`bind` creates a new function with a fixed receiver and optionally fixed leading arguments:

```js
const introduceMina = introduce.bind(user, "Welcome");
console.log(introduceMina()); // "Welcome, Mina"
```

Binding is useful when passing a method as a callback, but it creates a new function identity. Repeatedly binding during add/remove listener operations can make removal fail if the exact bound function is not retained.

### 7. Arrow functions capture lexical `this`

An arrow function does not create its own `this`. It reads `this` from the surrounding scope:

```js
const user = {
  name: "Asha",
  getName: () => this.name,
};

console.log(user.getName()); // usually undefined
```

The exact result of the outer `this` depends on the surrounding host and module form, but it is not dynamically changed to `user` by the method call.

An arrow is useful inside a method when the method's `this` should be retained:

```js
const service = {
  prefix: "log",
  createLogger() {
    return (message) => `${this.prefix}: ${message}`;
  },
};

const logger = service.createLogger();
console.log(logger("ready")); // "log: ready"
```

The returned arrow captures the `this` from `createLogger`.

### 8. Constructor calls and classes

Calling a function with `new` creates a new object, links its prototype, and calls the function with that object as `this`, subject to constructor rules:

```js
function User(name) {
  this.name = name;
}

const user = new User("Ravi");
console.log(user.name); // "Ravi"
```

Arrow functions cannot be constructors:

```js
const UserArrow = (name) => ({ name });
// new UserArrow("Ravi"); // TypeError
```

Classes use constructor calls and prototype methods, but the detailed prototype behavior belongs to Day 10.

## Detailed Explanations and Traces

### A closure trace

```js
function makePrefixer(prefix) {
  return function addPrefix(value) {
    return `${prefix}:${value}`;
  };
}

const addLog = makePrefixer("log");
console.log(addLog("ready")); // "log:ready"
```

Trace:

1. `makePrefixer("log")` creates a local `prefix` binding with value `"log"`.
2. The inner function is created and refers to `prefix`.
3. `makePrefixer` returns the inner function.
4. The outer call finishes, but the `prefix` binding remains reachable through `addLog`.
5. Calling `addLog("ready")` reads that retained binding.

### Method extraction in a service

```js
const metrics = {
  count: 0,
  increment() {
    this.count += 1;
  },
};

function runCallback(callback) {
  callback();
}

// runCallback(metrics.increment); // receiver lost
runCallback(metrics.increment.bind(metrics));
console.log(metrics.count); // 1
```

Alternatives include a wrapper arrow, a class-field arrow, or redesigning `increment` to accept state explicitly. The best choice depends on API ownership, allocation, testability, and whether the receiver should be dynamic.

### Closure retention and memory

A closure keeps every outer binding it needs reachable. If a long-lived object stores a callback that closes over a large object, that large object may remain reachable longer than expected:

```js
function createHandler(largeData) {
  return function handle() {
    return largeData.length;
  };
}

const handler = createHandler(new Array(1_000_000).fill("item"));
```

This does not prove a leak by itself. The object may be intentionally owned by `handler`. A leak happens when ownership is accidental or the handler is retained without a bound lifetime. Diagnose with allocation and retention evidence rather than assuming garbage collection is broken.

### Node.js connection: request handlers and listeners

Node applications frequently create closures inside request handlers, event listeners, timers, and dependency factories. Check:

- Does the callback need the entire request object or only a small value?
- Is a listener removed with the same function identity used to add it?
- Does a cache retain closures forever?
- Does a handler accidentally share mutable state across requests?
- Does a method lose its receiver when passed to a framework?

These are JavaScript ownership and call-site questions, even when the host API is Node.js.

## Node.js Connection

Request handlers, listeners, timers, and dependency factories can retain closures or lose method receivers in long-lived Node processes.

---

## Compare & Recall

| Concept A | Concept B | Key difference |
|---|---|---|
| Closure | Copy of values | A closure **retains a live reference to the binding**. If that variable changes later, the closure sees the new value. It is *not* a snapshot. |
| Lexical scope | `this` | Lexical scope is determined by **where the code is written**. `this` is determined by **how the function is called**. Arrow functions inherit lexical `this`; regular functions get a new `this` per call. |
| Arrow function `this` | Regular function `this` | Arrow: `this` is fixed at definition — cannot be changed by `.call`, `.apply`, or `.bind`. Regular: `this` is set at the call site. |
| `bind(obj)` | Arrow function | Both can "lock" the receiver. `bind` creates a **new function** (different identity). Arrow captures lexical `this` (no new identity). Matters for listener removal. |
| `call(obj, a, b)` | `apply(obj, [a, b])` | Same result — both set receiver temporarily. `call` takes args individually; `apply` takes an array. |
| `var` loop variable | `let` loop variable | `var` shares **one binding** across all iterations. `let` creates a **new binding per iteration**. Callbacks created in the loop see different values with `let`. |

> **Cross-day links:** `this` is also critical in class methods — covered in [Day 10](day-10-classes-and-prototypal-inheritance.md). Memory leaks from retained closures are diagnosed in detail in the Node memory-leak section.

## Common Mistakes and Interview Traps

- Saying a closure copies every outer value at creation time.
- Treating `this` as the same mechanism as lexical variable lookup.
- Passing a method as a callback without preserving its receiver.
- Using an arrow function as an object method and expecting dynamic `this`.
- Assuming `bind` mutates the original function; it creates a new function.
- Binding a method repeatedly and then being unable to remove the listener.
- Keeping large objects alive through long-lived callbacks without an ownership plan.
- Fixing a lost receiver by using an arrow when dynamic receiver behavior was actually required.
- Assuming every `this` result is identical in scripts, CommonJS, and ESM.

## Tricky Points

1. Closures retain access to bindings, not necessarily frozen snapshots.
2. `this` for normal functions comes from the call form; lexical scope comes from the source location.
3. Arrow `this` cannot be changed by `call`, `apply`, or `bind`.
4. A bound function has a new identity, which matters for listener removal and equality checks.
5. A closure may retain memory intentionally or accidentally; reachability and ownership must be measured.

## Practical Exercise

**Goal:** Implement a counter factory and a callback-safe service object.

**Task:** Create independent counters with `increment`, `read`, and `reset` methods. Then pass a service method to a generic callback runner without losing its receiver.

**Edge cases:** Two counters must not share state, a detached method call, repeated `bind`, and a callback that runs after the factory function has returned.

**Acceptance criteria:** Explain which bindings each closure retains; prove counter independence; preserve method identity when cleanup is needed; include a memory-ownership note for any captured large data.

## Summary

- Lexical scope is determined by where code is written.
- A closure is a function that retains access to needed outer bindings.
- Closures capture bindings, so later changes may be visible.
- Normal-function `this` depends on the call form; arrow `this` is lexical.
- `call`, `apply`, and `bind` explicitly control normal-function receivers, but arrows ignore those receiver changes.
- Method extraction can lose `this`; binding or a wrapper can restore it.
- Long-lived callbacks can retain memory, so closure ownership matters in Node applications.

## Cheat Sheet

| Call form | Normal-function `this` |
| --- | --- |
| `object.method()` | `object` |
| `method()` in strict code | `undefined` |
| `method.call(value)` | `value` |
| `method.apply(value, args)` | `value` |
| `method.bind(value)()` | bound `value` |
| `new Constructor()` | newly created instance |
| Arrow function | Captured outer `this`; call form does not replace it |

**vs. quick reference**

| | Arrow | Regular function | `.bind(obj)` |
|---|---|---|---|
| `this` source | Lexical (outer scope) | Call site | Permanently bound |
| Can change with `.call`/`.apply` | ✗ | ✓ | ✗ |
| New identity created | No | No | ✓ Yes |
| Good for object method | ✗ | ✓ | ✓ |
| Good for callback | ✓ | Depends | ✓ |

Other rules:

- `let` in a loop gives callbacks per-iteration bindings.
- `var` commonly gives callbacks one shared function-scoped binding.
- `bind` returns a new function identity.
- Closures can keep data alive while a callback remains reachable.

## Interview Questions

> Difficulty guide: **[Beginner]** = entry-level, **[Mid]** = requires understanding of internals, **[Senior]** = design and tradeoff thinking expected.

1. **[Mid] Mental model:** Explain the difference between lexical scope, a closure, and dynamic `this`.
   - **Expected answer shape:** Define each mechanism, show the lookup or call rule, and use one example where their results differ.
   - **Follow-up:** Why can an arrow function preserve `this` but still access variables through lexical scope?

2. **[Beginner] Predict the output:** Trace a loop that creates callbacks with `var` and then rewrite it using `let`.
   - **Expected answer shape:** Identify the shared versus per-iteration binding and give the final output.
   - **Follow-up:** Give an IIFE-based fix and explain what binding it creates.

3. **[Senior] Implementation:** Design a listener registry that can add, invoke, and remove callbacks while preserving method receivers and avoiding accidental duplicate registrations.
   - **Expected answer shape:** Define function identity, binding strategy, cleanup ownership, and data-structure complexity.
   - **Follow-up:** How would you prevent a registry from retaining callbacks after their owner is gone?

4. **[Mid] Debugging:** A Node service's memory grows after each request because a global array stores request handlers. Diagnose the retained object graph and propose tests or measurements.
   - **Expected answer shape:** Explain closure reachability, identify captured data, bound lifetime, eviction or cleanup, and evidence needed.
   - **Follow-up:** Why is forcing garbage collection not a complete fix?

5. **[Senior] Design:** Compare class methods, bound methods, arrow fields, and explicit-state functions for a callback-heavy service.
   - **Expected answer shape:** Discuss receiver behavior, prototype sharing, per-instance allocation, testability, identity, and memory.
   - **Follow-up:** Which option would you choose for a hot path and what measurements would support the choice?

