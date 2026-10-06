# Day 2: Control Flow, Functions, and Scope

## Control flow

**1. Branches**

`if` chooses by condition; `switch` compares cases and continues into later cases unless stopped.

```js
if (count > 0) run();
switch (kind) { case "ok": run(); break; }
```

**2. Loops and control transfer**

`for`, `while`, and `do...while` repeat work; `break` exits and `continue` skips to the next iteration.

```js
for (const id of ids) {
	if (!id) continue;
	save(id);
}
```

**3. Iteration modes**

`for...of` visits iterable values; `for...in` visits enumerable string keys.

```js
for (const value of ["a", "b"]) {} // values
for (const key in { a: 1 }) {}      // keys
```

**4. Loop scope**

`let` creates a per-iteration binding; `var` shares one function binding.

```js
for (let i = 0; i < 2; i++) callbacks.push(() => i); // 0, 1
```

[Full topic](../../Javascript/javascript-lectures/day-05-control-flow-and-loops.md)

## Functions and lexical behavior

**1. Function forms**

Declarations define functions; expressions and arrows are values stored in bindings.

```js
function add(a, b) { return a + b; }
const addArrow = (a, b) => a + b;
```

**2. Parameters and return**

Defaults apply to `undefined`; rest gathers remaining arguments into an array; `return` supplies the result.

```js
function label(name = "guest", ...tags) { return [name, tags]; }
```

**3. First-class and higher-order functions**

Functions can be passed or returned; a higher-order function accepts/returns another function. `items.map(format)` passes `format` as a callback.

**4. Callback contracts and purity**

State when a callback runs and how errors propagate. A pure function returns the same result for the same inputs without changing outside state.

```js
const sum = (a, b) => a + b; // pure
```

**5. Lexical scope and closures**

A closure retains access to bindings from where it was created, even after the outer call returns.

```js
function counter() { let n = 0; return () => ++n; }
```

**6. `this` and binding methods**

A regular function's receiver follows its call form; `call`/`apply` invoke with a receiver, and `bind` fixes one.

```js
read.call({ x: 2 });
```

**7. Arrow functions**

Arrows inherit `this` and have no own `arguments`; use rest parameters to collect arguments.

```js
const countArgs = (...args) => args.length;
```

**8. Errors and cleanup**

`throw` transfers control to `catch`; `finally` runs cleanup. `Error.cause` can preserve a lower-level failure.

```js
try { work(); } finally { release(); }
```

[Functions](../../Javascript/javascript-lectures/day-06-functions-parameters-and-callbacks.md) | [Errors](../../Javascript/javascript-lectures/day-07-errors-and-exception-flow.md) | [Closures and `this`](../../Javascript/javascript-lectures/day-08-closures-execution-context-and-this.md)

## Tricky points

1. **Control flow**

**1.1 `for...in`**

Visits enumerable keys, including inherited ones; use `for...of` for iterable values.

**1.2 `switch`**

Missing `break` falls through and may run an unintended case.

2. **Functions**

**2.1 Hoisting**

Function declarations can be called earlier; a `const` function expression cannot be read before initialization.

**2.2 Arrow `this`**

Arrows have lexical `this`; use a regular method when call-site receiver behavior is required.

**2.3 Defaults**

Parameter defaults replace only `undefined`, not `null`, `0`, or `""`.

3. **Scope and errors**

**3.1 Loop closures**

Callbacks created with `var` share one binding; `let` in a loop creates per-iteration bindings.

**3.2 Detached methods**

`const read = account.read; read()` loses `account` as receiver unless bound.

**3.3 `finally`**

A `return` or throw inside `finally` can replace the earlier result/error.