# Day 05: Conditions, Loops, and Control Transfer

<nav aria-label="Lecture navigation">

[Previous: Coercion, Equality, and Operators](day-04-coercion-equality-and-operators.md) | [Roadmap](../javascript-roadmap.md) | [Next: Functions, Parameters, and Callbacks](day-06-functions-parameters-and-callbacks.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Choose between `if`, `switch`, loops, and array iteration methods for a task.
- Explain how conditions use truthiness and why explicit checks matter.
- Distinguish `for...in` from `for...of`.
- Explain `break`, `continue`, labels, and early exit.
- Predict loop-variable scope with `var`, `let`, and `const`.
- Identify mutation-during-iteration bugs and accidental infinite loops.
- Recognize when synchronous iteration can hurt a Node.js server.

## Prerequisites

Read [Day 04: Coercion, Equality, and Operators](day-04-coercion-equality-and-operators.md) for truthiness, equality, and short-circuiting. Day 6 builds on this lecture by putting functions and callbacks inside these control-flow patterns.

The examples are JavaScript examples. A synchronous loop runs on the current JavaScript thread; Node.js consequences are discussed near the end.

## Core Concepts

### 1. Conditions choose a path

An `if` statement evaluates a condition and chooses one branch:

```js
const score = 72;

if (score >= 90) {
  console.log("excellent");
} else if (score >= 40) {
  console.log("pass");
} else {
  console.log("retry");
}
```

The conditions are evaluated from top to bottom. Once one branch is selected, later branches are skipped.

Use braces even for one-line branches. Braces make the controlled region visible and prevent accidental bugs when another statement is added later.

```js
if (isAuthorized) {
  audit("allowed");
  return;
}
```

### 2. `switch` compares cases with strict equality

A `switch` is useful when one value is compared against several known cases:

```js
function describeStatus(status) {
  switch (status) {
    case "queued":
      return "Waiting";
    case "running":
      return "In progress";
    case "done":
      return "Finished";
    default:
      return "Unknown";
  }
}
```

Cases do not create automatic stopping points. Without `break` or `return`, execution falls through into the next case:

```js
function classify(value) {
  switch (value) {
    case 1:
      console.log("one");
      // Intentional fall-through.
    case 2:
      console.log("one or two");
      break;
    default:
      console.log("other");
  }
}

classify(1); // one, then one or two
```

Intentional fall-through should be obvious and tested. For complex conditions, `if` or a lookup object may be clearer.

### 3. `for`, `while`, and `do...while`

A `for` loop is useful when initialization, a condition, and an update form one clear progression:

```js
let total = 0;

for (let index = 1; index <= 3; index += 1) {
  total += index;
}

console.log(total); // 6
```

A `while` loop checks before each iteration:

```js
let remaining = 3;
while (remaining > 0) {
  console.log(remaining);
  remaining -= 1;
}
```

A `do...while` loop runs at least once because it checks after the body:

```js
let attempt = 0;
do {
  attempt += 1;
} while (attempt < 0);

console.log(attempt); // 1
```

An infinite loop is not always wrong, but it must have a clear exit or a controlled lifetime. A loop without progress or cancellation can hang a Node.js process.

### 4. `for...of` consumes values

`for...of` uses the iterable protocol to get values:

```js
const names = ["Asha", "Mina"];

for (const name of names) {
  console.log(name);
}
```

It works with arrays, strings, sets, maps, generators, and other iterables. For a map, each value is a two-item entry:

```js
const scores = new Map([
  ["Asha", 90],
  ["Mina", 85],
]);

for (const [name, score] of scores) {
  console.log(name, score);
}
```

`for...of` does not work on every object. A plain object is not iterable by default:

```js
const settings = { retries: 3 };
// for (const value of settings) {} // TypeError
```

Use `Object.keys`, `Object.values`, or `Object.entries` when a plain object's properties are intended.

### 5. `for...in` consumes enumerable property keys

`for...in` iterates over enumerable string keys, including inherited enumerable keys:

```js
const user = { name: "Asha", role: "admin" };

for (const key in user) {
  console.log(key, user[key]);
}
```

It is usually a poor choice for arrays because it gives keys, can include inherited properties, and does not express â€œiterate these valuesâ€:

```js
const colors = ["red", "blue"];

for (const key in colors) {
  console.log(key); // "0", then "1"
}

for (const color of colors) {
  console.log(color); // "red", then "blue"
}
```

If you must use `for...in` with an object, consider checking own properties:

```js
for (const key in user) {
  if (Object.hasOwn(user, key)) {
    console.log(key, user[key]);
  }
}
```

`Object.hasOwn` is available in modern runtimes. Older supported runtimes may use `Object.prototype.hasOwnProperty.call`.

### 6. `break`, `continue`, and labels

`break` exits the nearest loop or `switch`. `continue` skips the rest of the current loop body and starts the next iteration:

```js
for (let number = 1; number <= 5; number += 1) {
  if (number === 3) {
    continue;
  }
  if (number === 5) {
    break;
  }
  console.log(number); // 1, 2, 4
}
```

A label can name a statement, usually a loop, so `break` or `continue` can target an outer loop:

```js
outerLoop:
for (const row of [[1, 2], [3, 4]]) {
  for (const value of row) {
    if (value === 3) {
      break outerLoop;
    }
    console.log(value); // 1, 2
  }
}
```

Labels are valid, but a helper function or a clearer algorithm is often easier to maintain. They should be used only when they make the exit rule clearer.

### 7. Loop scope and closures

`let` and `const` are block-scoped. A `for` loop with `let` creates a per-iteration binding that callbacks can capture:

```js
const tasks = [];

for (let index = 0; index < 3; index += 1) {
  tasks.push(() => index);
}

console.log(tasks.map((task) => task())); // [0, 1, 2]
```

With `var`, there is one function-scoped binding shared by all callbacks:

```js
const tasks = [];

for (var index = 0; index < 3; index += 1) {
  tasks.push(() => index);
}

console.log(tasks.map((task) => task())); // [3, 3, 3]
```

This is a scope and closure issue, not a timer issue. Day 8 explains the retained bindings in more detail.

### 8. Array iteration methods

Methods such as `map`, `filter`, `find`, `some`, `every`, and `reduce` express common data-processing patterns:

```js
const prices = [10, 20, 30];
const discounted = prices.map((price) => price * 0.9);
const expensive = prices.filter((price) => price >= 20);

console.log(discounted); // [9, 18, 27]
console.log(expensive);   // [20, 30]
```

`some` and `every` can stop early:

```js
console.log(prices.some((price) => price > 25)); // true
console.log(prices.every((price) => price > 0)); // true
```

`forEach` does not provide a normal way to break out of the iteration. A `return` returns from the callback, not from the outer function:

```js
function findFirstEven(numbers) {
  let found;
  numbers.forEach((number) => {
    if (number % 2 === 0) {
      found = number;
      return;
    }
  });
  return found;
}
```

This works for the small example, but `find` states the intent better and can stop early:

```js
function findFirstEven(numbers) {
  return numbers.find((number) => number % 2 === 0);
}
```

Do not use `map` only for side effects; use a loop or `forEach` when no transformed array is needed.

## Detailed Explanations and Traces

### Mutation during iteration

Changing a collection while iterating can skip elements or create surprising work:

```js
const pending = [1, 2, 3, 4];

for (let index = 0; index < pending.length; index += 1) {
  if (pending[index] % 2 === 0) {
    pending.splice(index, 1);
    index -= 1;
  }
}

console.log(pending); // [1, 3]
```

The manual index correction makes this version work, but filtering into a new array is often easier to reason about:

```js
const oddNumbers = pending.filter((number) => number % 2 !== 0);
```

The correct choice depends on memory requirements and whether mutation is part of the contract. State the choice instead of assuming mutation is free.

### Complexity and the DSA connection

A loop over `n` values is usually $O(n)$ time. A nested loop over two independent lists may be $O(nm)$. Repeatedly using an operation that shifts many array elements can turn an apparently simple loop into $O(n^2)$ work.

A lookup task often becomes faster when a `Set` or `Map` is built once:

```js
function hasDuplicate(numbers) {
  const seen = new Set();

  for (const number of numbers) {
    if (seen.has(number)) return true;
    seen.add(number);
  }

  return false;
}
```

This uses $O(n)$ additional space and has expected $O(n)$ time under normal hash-table assumptions. A nested comparison uses $O(1)$ extra space but $O(n^2)$ time. Interview answers should state the tradeoff and the assumptions.

### Node.js connection: synchronous work blocks progress

A JavaScript loop runs synchronously. While a long loop is running, the current Node.js process cannot run other JavaScript callbacks on that thread. This can delay unrelated requests and timers.

```js
function expensiveWork(limit) {
  let total = 0;
  for (let number = 0; number < limit; number += 1) {
    total += number;
  }
  return total;
}
```

The exact time depends on the machine, runtime, optimization, and workload. The reliable point is that the loop occupies the current execution path. For large CPU work, consider smaller chunks, a worker thread, a separate process, or an algorithmic improvement. Do not promise that `setTimeout` automatically makes the work parallel; it only changes when a callback may run.

## Node.js Connection

Synchronous control flow occupies the current Node execution path, so unbounded loops can delay unrelated callbacks.

## Common Mistakes and Interview Traps

- Using `for...in` to iterate array values.
- Forgetting `break` in a `switch` and creating accidental fall-through.
- Expecting `return` inside `forEach` to return from the containing function.
- Using `map` for side effects and discarding its result.
- Mutating an array while walking forward without adjusting the index.
- Creating an infinite loop because the loop condition never changes.
- Capturing one `var` loop binding in several callbacks.
- Assuming `for...of` works on every object.
- Ignoring inherited enumerable properties in `for...in`.
- Treating an `async` callback passed to `forEach` as something the loop will await.

## Tricky Points

1. `for...in` returns enumerable property keys as strings; `for...of` consumes values from an iterable.
2. `forEach` does not wait for promises returned by its callback.
3. `switch` uses strict comparison for case matching and still permits fall-through.
4. `break` exits only the nearest target unless a label is used.
5. A synchronous loop can block Node.js even when the surrounding function is marked `async`.

## Practical Exercise

**Goal:** Process a list of orders and stop safely on invalid input.

**Input:** An array of objects containing `id`, `amount`, and `status`.

**Task:** Produce the IDs of paid orders with positive amounts, skip cancelled orders, and stop with a validation error when an order is missing a required field.

**Edge cases:** Empty input, an invalid order in the middle, duplicate IDs, inherited properties on an input object, and a status that is not one of the accepted strings.

**Acceptance criteria:** Explain why you chose a loop or an array method; do not use `for...in` for array values; demonstrate whether the function returns partial results or throws on invalid input; state the time and space complexity.

## Summary

- Conditions choose paths using truthiness and comparisons.
- `switch` is useful for known values, but fall-through must be intentional.
- `for`, `while`, and `do...while` differ in setup and when they check the condition.
- `for...of` iterates values; `for...in` iterates enumerable keys.
- `break`, `continue`, and labels control where execution continues.
- `let` creates per-iteration bindings that behave differently from a shared `var` binding.
- Array methods express common transformations and searches, but `forEach` does not support normal early exit or awaiting.
- Algorithm choice and synchronous work affect both complexity and Node.js latency.

## Cheat Sheet

| Task | Good default |
| --- | --- |
| Iterate array values | `for...of` |
| Iterate object own entries | `Object.entries(object)` with `for...of` |
| Transform every item | `map` |
| Keep matching items | `filter` |
| Find one item | `find` |
| Test whether any match | `some` |
| Test whether all match | `every` |
| Need `break` or `continue` | `for`, `for...of`, or `while` |
| Avoid accidental loop capture | Prefer `let` or `const` over `var` |
| Prevent blocking | Improve the algorithm, split work, or move CPU work off the main thread |

## Interview Questions

1. **Mental model:** Compare `for...in`, `for...of`, `Object.keys`, and `Object.entries` for arrays and plain objects.
   - **Expected answer shape:** State what each produces, whether inherited keys are possible, and when each is appropriate.
   - **Follow-up:** What changes when the object has a custom iterator?

2. **Predict the output:** Explain the result of callbacks created inside a `var` loop versus a `let` loop.
   - **Expected answer shape:** Identify the binding count, closure capture, and values observed after the loop ends.
   - **Follow-up:** Give two fixes that do not rely on changing `var` to `let`.

3. **Implementation:** Find duplicate values in an array while meeting expected $O(n)$ time, then design a version using $O(1)$ extra space when the input constraints permit it.
   - **Expected answer shape:** Give both algorithms, assumptions, complexity, and mutation tradeoffs.
   - **Follow-up:** How do `NaN`, object identity, and duplicate strings affect the design?

4. **Debugging:** A developer changes `array.forEach(async item => await save(item))` to â€œmake it concurrent,â€ but the API returns before saves finish and errors are missed. Diagnose it.
   - **Expected answer shape:** Explain that `forEach` does not await callback promises, then propose sequential and concurrent alternatives with failure behavior.
   - **Follow-up:** How would you add a concurrency limit rather than launching all work at once?

5. **Design:** A Node endpoint scans ten million records synchronously and causes request latency spikes. Analyze algorithmic, event-loop, memory, and operational options.
   - **Expected answer shape:** Discuss complexity, batching, backpressure or pagination, worker isolation, cancellation, and observability.
   - **Follow-up:** What evidence would distinguish a bad algorithm from insufficient CPU capacity?

