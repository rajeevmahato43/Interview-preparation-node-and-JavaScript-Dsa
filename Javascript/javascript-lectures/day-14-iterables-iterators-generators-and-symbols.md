# Day 14: Iterables, Iterators, Generators, and Symbols

<nav aria-label="Lecture navigation">

[Previous: Destructuring, Spread, Rest, and Modern Operators](day-13-destructuring-spread-and-modern-operators.md) | [Roadmap](../javascript-roadmap.md) | [Next: Regular Expressions and Text Processing](day-15-regular-expressions-and-text-processing.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Distinguish an iterable from an iterator.
- Explain the `Symbol.iterator` protocol.
- Build a custom iterable and a generator.
- Trace `yield`, `next`, `return`, and `throw`.
- Use lazy evaluation when all values should not be created at once.
- Explain cleanup when iteration stops early.

## Prerequisites

Read [Day 05: Control Flow and Loops](day-05-control-flow-and-loops.md), [Day 06: Functions, Parameters, and Callbacks](day-06-functions-parameters-and-callbacks.md), [Day 12: Built-in Data Structures and Serialization](day-12-built-in-data-structures-and-serialization.md), and [Day 13: Destructuring, Spread, and Modern Operators](day-13-destructuring-spread-and-modern-operators.md).

## Core Concepts

### Iterable versus iterator

An iterable is a value that can produce an iterator. An iterator is an object with a `next()` method that returns `{ value, done }`.

```js
const numbers = [10, 20];
const iterator = numbers[Symbol.iterator]();

console.log(iterator.next()); // { value: 10, done: false }
console.log(iterator.next()); // { value: 20, done: false }
console.log(iterator.next()); // { value: undefined, done: true }
```

Arrays are iterable. The iterator remembers its current position.

### `for...of` uses the protocol

```js
for (const number of [10, 20]) {
  console.log(number); // 10, then 20
}
```

Conceptually, `for...of` gets an iterator and repeatedly calls `next()` until `done` is true. The actual specification includes cleanup behavior for abrupt exits.

### Custom iterable

```js
const range = {
  start: 2,
  end: 4,
  [Symbol.iterator]() {
    let current = this.start;
    return {
      next: () => current <= this.end
        ? { value: current++, done: false }
        : { value: undefined, done: true },
    };
  },
};

console.log([...range]); // [2, 3, 4]
```

The iterable creates a fresh iterator each time, so two loops start independently.

## Detailed Explanations and Traces

### Generators pause and resume

A generator function uses `function*` and `yield`.

```js
function* steps() {
  yield "first";
  yield "second";
  return "finished";
}

const generator = steps();
console.log(generator.next()); // { value: "first", done: false }
console.log(generator.next()); // { value: "second", done: false }
console.log(generator.next()); // { value: "finished", done: true }
console.log(generator.next()); // { value: undefined, done: true }
```

Calling the generator function does not run the body fully. Each `next()` runs until the next `yield` or completion.

The final `return` value is observable through `next()`, but `for...of` ignores it.

### Values can be sent into a generator

```js
function* conversation() {
  const answer = yield "What is your name?";
  return `Hello, ${answer}`;
}

const dialogue = conversation();
console.log(dialogue.next().value); // "What is your name?"
console.log(dialogue.next("Asha")); // { value: "Hello, Asha", done: true }
```

The first `next()` starts the generator; its argument is ignored. Later `next(value)` becomes the result of the paused `yield` expression.

### `yield*` delegates

```js
function* combined() {
  yield* [1, 2];
  yield* [3, 4];
}

console.log([...combined()]); // [1, 2, 3, 4]
```

`yield*` forwards values and supports delegation of completion and errors.

### Generator cleanup

A generator can define `finally` cleanup. Closing it with `return()` runs the cleanup block.

```js
function* resourceValues() {
  try {
    yield "value";
    yield "another value";
  } finally {
    console.log("cleanup");
  }
}

const values = resourceValues();
console.log(values.next().value); // "value"
values.return(); // logs "cleanup"
```

A `for...of` loop that exits early attempts iterator cleanup when the iterator provides `return`.

Errors can enter a paused generator through `throw()`. A `finally` block still owns cleanup:

```js
function* guardedValues() {
  try {
    yield "ready";
  } catch (error) {
    yield `handled: ${error.message}`;
  } finally {
    console.log("released");
  }
}

const guarded = guardedValues();
console.log(guarded.next()); // { value: "ready", done: false }
console.log(guarded.throw(new Error("stop"))); // handled value, then done: false
console.log(guarded.return("closed")); // logs "released", then done: true
```

The exact sequence is part of the iterator contract: `throw()` resumes at the suspended `yield`, while `return()` requests completion and runs `finally`.

### Lazy work and bounded generation

```js
function* positiveNumbers() {
  let number = 1;
  while (true) {
    yield number;
    number += 1;
  }
}

const firstThree = [];
for (const number of positiveNumbers()) {
  firstThree.push(number);
  if (firstThree.length === 3) break;
}
console.log(firstThree); // [1, 2, 3]
```

The infinite generator is safe here because the loop stops. Spreading it without a limit would never finish.

## Examples and Traces

### A reusable page generator

```js
function* pages(items, pageSize) {
  for (let index = 0; index < items.length; index += pageSize) {
    yield items.slice(index, index + pageSize);
  }
}

console.log([...pages([1, 2, 3, 4, 5], 2)]);
// [[1, 2], [3, 4], [5]]
```

The generator creates one page when requested instead of building every intermediate result before the consumer starts.

## Node.js Connection

Iteration protocols explain lazy application data and provide language context for Node stream iteration without teaching stream APIs here.

---

## Compare & Recall

| Concept A | Concept B | Key difference |
|---|---|---|
| **Iterable** | **Iterator** | An iterable **can create** an iterator (it has `[Symbol.iterator]()`). An iterator **does the work** (it has `next()`). Arrays are iterable; calling `[Symbol.iterator]()` on them gives you an iterator. |
| Generator function `function*` | Regular function | Regular function runs to completion and returns once. Generator function pauses at `yield`, returns a value, then resumes on the next `next()` call. |
| `yield` | `return` | `yield` **pauses** and produces a value (done: false). `return` **ends** the generator (done: true). The final return value is visible only if you call `next()` after the last yield. |
| `yield*` | Manually iterating | `yield*` delegates to another iterable, yielding each of its values as if they were your own. Equivalent to a `for...of` that yields each item. |
| Lazy evaluation | Eager evaluation | Lazy (generators): compute the next value only when asked. Eager (arrays): compute all values up front. Lazy saves memory for large/infinite sequences. |
| Synchronous iterator | Async iterator | Synchronous: `next()` returns `{ value, done }` synchronously. Async: `next()` returns a **Promise** of `{ value, done }`. Used with `for await...of` and `Symbol.asyncIterator`. |

> **Cross-day links:** `for...of` and iteration over arrays/Maps/Sets are in [Day 05](day-05-control-flow-and-loops.md) and [Day 12](day-12-built-in-data-structures-and-serialization.md). Async iteration and `for await...of` are introduced in [Day 19](day-19-async-await-errors-and-cleanup.md).

## Common Mistakes and Interview Traps

- Calling an iterable itself as if it were an iterator.
- Forgetting that `next()` returns an object, not just the value.
- Passing a value to the first `next()` and expecting it to enter the first `yield`.
- Spreading an infinite generator.
- Confusing the generator's final return value with a yielded value.
- Assuming a generator automatically runs concurrently.
- Forgetting cleanup when a custom iterator owns resources.

## Tricky Points

- An iterable can create many independent iterators; an iterator is usually stateful.
- `for...of` consumes values and ignores the final `return` value.
- `yield` pauses the generator body, but it does not pause unrelated JavaScript execution globally.
- Async iterables use `Symbol.asyncIterator` and `next()` results that resolve promises; that is introduced here only as a concept.

## Practical Exercise

**Goal:** Create a lazy range and paginated iterator.

**Inputs and outputs:** Accept a start, end, and page size; produce values and pages only when requested.

**Constraints:** Do not allocate the full range. Stop safely when the consumer breaks early.

**Edge cases:** Start greater than end, zero or negative page size, and an extremely large end value.

**Acceptance criteria:** Show the `next()` trace, explain when computation happens, and demonstrate cleanup with a `finally` block.

## Summary

- An iterable can produce an iterator through `Symbol.iterator`.
- An iterator exposes `next()` and returns `{ value, done }`.
- Generators make iterator code easier to write and pause at `yield`.
- `yield*` delegates to another iterable.
- Generators are lazy, but unlimited generators must have bounded consumers.
- Early termination should trigger cleanup when an iterator supports it.

## Cheat Sheet

| Term | Meaning |
|---|---|
| Iterable | Can produce an iterator |
| Iterator | Has `next()` |
| `Symbol.iterator` | Standard synchronous iteration hook |
| `function*` | Generator function syntax |
| `yield` | Produce a value and pause |
| `yield*` | Delegate to another iterable |
| `{ done: true }` | Iteration is complete |
| `return()` | Request iterator cleanup/completion |

**vs. quick reference**

| | `yield` | `return` (in generator) |
|---|---|---|
| `done` in result | `false` | `true` |
| Visible to `for...of` | ✓ Yes | ✗ No |
| Visible to `.next()` | ✓ Yes | ✓ Yes (last call) |
| Pauses the function | ✓ | Ends the function |

| | Iterable | Iterator |
|---|---|---|
| Has `[Symbol.iterator]()` | ✓ | (may be its own iterator) |
| Has `next()` | ✗ | ✓ |
| Reusable (can iterate again) | Usually | Usually not |
| Example | Array, Set, Map, String | Array iterator, generator object |

## Interview Questions

> Difficulty guide: **[Beginner]** = entry-level, **[Mid]** = requires understanding of internals, **[Senior]** = design and tradeoff thinking expected.

1. **[Mid] Definition:** Explain iterable and iterator with a custom object.
   - Expected answer: State the separate responsibilities and show `Symbol.iterator`, `next`, `value`, and `done`.
   - Follow-up: Why can the same iterable be consumed twice while an iterator often cannot?

2. **[Beginner] Trace:** What does this print?

   ```js
   function* values() {
     yield 1;
     return 2;
   }
   console.log([...values()]);
   ```
   - Expected answer: `[1]`; `for...of` and spread ignore the final return value.
   - Follow-up: How can you observe `2`?

3. **[Senior] Implementation:** Build a lazy breadth-first traversal interface for a tree.
   - Expected answer: Define node shape, queue state, yield timing, memory complexity, and early termination.
   - Follow-up: How would an async source change the protocol?

4. **[Mid] Debugging:** A generator-backed report hangs in production. Find the unbounded consumer and add a safe limit.
   - Expected answer: Identify infinite generation or missing termination, add explicit bounds or cancellation, and test large inputs.
   - Follow-up: How would you expose progress without materializing all results?

5. **[Senior] Design:** Compare a generator pipeline with eager arrays for a large Node data flow.
   - Expected answer: Discuss memory, latency, backpressure boundaries, cleanup, error handling, and observability.
   - Follow-up: Which parts require async iteration rather than synchronous iteration?

