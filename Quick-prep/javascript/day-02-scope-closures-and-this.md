# Day 2: Control Flow, Functions, Scope, Closures, and `this`

Quick review of main-course lectures 5–8. Designed for rapid interview revision: control flow and loop bindings, function forms, lexical environments, Temporal Dead Zone (TDZ), closures in practice, and all four `this` binding rules with concise examples.

## Control flow and iteration mechanics

**1. Branches and switch fall-through**

`if` checks truthiness; `switch` uses strict equality (`===`) without type coercion. Omitting a `break` causes execution to fall through to subsequent cases regardless of their condition.

```js
const status = "warn";
switch (status) {
  case "warn":
    console.log("Warning logged"); // Falls through without break!
  case "error":
    console.log("Error handled");
    break;
}
// Prints both "Warning logged" and "Error handled"
```

**1.1 Iteration protocols: `for...of` vs `for...in`**

`for...of` iterates over iterable values (Arrays, Sets, Maps, Strings). `for...in` iterates over all enumerable string keys, including inherited keys across the prototype chain.

```js
const arr = ["a", "b"];
arr.custom = 123;

// Correct for elements: iterates values
for (const val of arr) console.log(val); // "a", "b"

// Incorrect for elements: includes indices and custom properties
for (const key in arr) console.log(key); // "0", "1", "custom"
```

**1.2 Loop variable scope: `let` vs `var`**

`let` creates a distinct, brand-new binding for each loop iteration. `var` binds a single function-scoped variable shared across all iterations.

```js
// var: all callbacks share the final value (3)
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log("var:", i), 0); // 3, 3, 3
}

// let: each iteration captures its own independent lexical copy
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log("let:", j), 0); // 0, 1, 2
}
```

[Control flow and loops](../../Javascript/javascript-lectures/day-05-control-flow-and-loops.md)

## Functions, parameters, and invocation

**1. Function declarations vs function expressions**

Function declarations are hoisted completely (both identifier and implementation). Function expressions and arrows are hoisted according to their variable declaration (`var` initializes to `undefined`; `let`/`const` enter the TDZ).

```js
// Valid: Function declaration hoisted completely
greet(); // "Hello"
function greet() { return "Hello"; }

// Invalid: Expression cannot be called before assignment
// sayHi(); // TypeError: sayHi is not a function (if var) or ReferenceError (if const)
const sayHi = () => "Hi";
```

**1.1 Default parameters and rest parameters**

Default parameters apply only when arguments are strictly `undefined`, not `null` or `false`. Rest parameters (`...args`) gather trailing arguments into a real Array, unlike the legacy array-like `arguments` object.

```js
function configure(timeout = 1000, ...tags) {
  console.log(timeout, Array.isArray(tags));
}

configure(null);          // null true (default does not trigger on null!)
configure(undefined, "a", "b"); // 1000 true
```

**1.2 Higher-order functions and currying**

Functions in JavaScript are first-class values. Higher-order functions accept functions as arguments or return them, enabling function composition and partial application (currying).

```js
const multiply = (a) => (b) => a * b;
const double = multiply(2);
console.log(double(5)); // 10
```

[Functions and invocation](../../Javascript/javascript-lectures/day-06-functions-parameters-and-callbacks.md)

## Lexical scope, hoisting, and the TDZ

**1. Lexical environment and block scope**

JavaScript uses lexical (static) scoping: variable access is determined by where functions are written in the source code, not where they are called. `let` and `const` are scoped to the nearest enclosing block (`{ ... }`), whereas `var` is scoped to the nearest function or script.

```js
{
  var functionScoped = 1;
  let blockScoped = 2;
}
console.log(functionScoped); // 1
// console.log(blockScoped);    // ReferenceError: blockScoped is not defined
```

**1.1 Temporal Dead Zone (TDZ)**

From the start of a block until a `let` or `const` declaration is evaluated, the variable resides in the TDZ. Accessing the variable before its declaration line throws a `ReferenceError`.

```js
// TDZ Demonstration
const x = "outer";
{
  // Accessing x here throws ReferenceError because inner x shadows outer x in TDZ:
  // console.log(x);
  let x = "inner";
  console.log(x); // "inner"
}
```

[Scope and hoisting](../../Javascript/javascript-lectures/day-07-errors-and-exception-flow.md)

## Closures and the four `this` binding rules

**1. Closures in practice**

A **closure** is the combination of a function bundled together with references to its surrounding state (lexical environment). The function retains access to outer variables even after the outer function has completed execution.

```js
// Private encapsulated state pattern
function createCounter(initial = 0) {
  let count = initial; // Private variable retained by closures
  return {
    increment: () => ++count,
    decrement: () => --count,
    get: () => count
  };
}

const counter = createCounter(10);
counter.increment();
console.log(counter.get()); // 11
```

**2. The four rules of `this` binding**

The value of `this` is determined strictly at **call time** by how the function is invoked:
1. **Default Binding:** Standalone invocation (`fn()`) binds `this` to `undefined` in strict mode (or `globalThis` in sloppy mode).
2. **Implicit Binding:** Method invocation (`obj.fn()`) binds `this` to the object preceding the dot (`obj`).
3. **Explicit Binding:** `.call(obj, ...args)`, `.apply(obj, [args])`, or `.bind(obj)` explicitly set `this`.
4. **`new` Binding:** Calling `new Fn()` binds `this` to the newly allocated instance object.

```js
const user = {
  name: "Alice",
  getName() { return this.name; }
};

// 1. Implicit binding
console.log(user.getName()); // "Alice"

// 2. Losing this on assignment (Default binding takes over)
const extract = user.getName;
// extract(); // TypeError: Cannot read properties of undefined (in strict mode)

// 3. Explicit binding
console.log(extract.call(user)); // "Alice"
const bound = extract.bind(user);
console.log(bound());            // "Alice"
```

**2.1 Arrow functions and lexical `this`**

Arrow functions have no own `this`, `arguments`, `super`, or `new.target`. They inherit `this` directly from the enclosing lexical scope at definition time; calling `.call()`, `.apply()`, or `.bind()` on an arrow function does not change its `this`.

```js
class Timer {
  constructor(seconds) {
    this.seconds = seconds;
  }
  start() {
    // Arrow function captures Timer instance this from start()
    setTimeout(() => {
      console.log("Timer finished:", this.seconds);
    }, 100);
  }
}
new Timer(5).start(); // "Timer finished: 5"
```

[Closures and this](../../Javascript/javascript-lectures/day-08-closures-execution-context-and-this.md)

## Tricky points

1. **Control flow and loops**

**1.1 Iterating objects with `for...in` leaking prototypes**
`for...in` traverses inherited enumerable properties on `Object.prototype`. Always verify with `Object.hasOwn(obj, key)` or use `Object.keys(obj)` instead.

**1.2 Accidental switch fall-through**
Omitting `break` executes the next `case` block even if its value does not match. If intentional, document with `// fallthrough`.

2. **Functions and scope**

**2.1 Default parameter evaluation on `null`**
A default parameter `fn(val = 5)` only activates if `val === undefined`. Passing `fn(null)` assigns `null`, not `5`.

**2.2 Function declaration hoisting inside blocks**
In modern JavaScript strict mode, function declarations inside blocks (`if (cond) { function f() {} }`) are block-scoped; do not rely on legacy browser hoisting quirks outside the block.

3. **Closures and `this`**

**3.1 Detached method callbacks losing `this`**
Passing an object method directly as a callback (e.g., `setTimeout(user.save, 100)` or `button.addEventListener("click", user.save)`) strips implicit binding, causing `this` inside `save` to become `undefined` or the DOM element.

**3.2 Arrow functions as object methods**
Defining object methods with arrow functions (`const obj = { name: "A", get: () => this.name }`) binds `this` to the outer module/global scope, returning `undefined`.

**3.3 Memory leaks through retained closure references**
A small inner closure that outlives its outer function keeps the entire lexical scope environment alive in V8 memory, preventing large unused local variables from being garbage collected.