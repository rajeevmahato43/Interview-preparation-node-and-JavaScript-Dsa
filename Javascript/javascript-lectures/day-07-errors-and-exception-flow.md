# Day 07: Errors and Exception Flow

<nav aria-label="Lecture navigation">

[Previous: Functions, Parameters, and Callbacks](day-06-functions-parameters-and-callbacks.md) | [Roadmap](../javascript-roadmap.md) | [Next: Closures, Execution Context, and `this`](day-08-closures-execution-context-and-this.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Distinguish syntax errors, runtime errors, and incorrect results.
- Explain how `throw`, `try`, `catch`, and `finally` transfer control.
- Create useful `Error` objects and preserve causes when wrapping failures.
- Separate validation errors, expected operational failures, and programmer bugs.
- Understand cleanup and the danger of returning from `finally`.
- Explain why a synchronous `try` block does not automatically catch a later asynchronous failure.
- Design error boundaries suitable for Node.js service code without leaking secrets.

## Prerequisites

Read [Day 04: Coercion, Equality, and Operators](day-04-coercion-equality-and-operators.md) and [Day 06: Functions, Parameters, and Callbacks](day-06-functions-parameters-and-callbacks.md). Day 8 uses errors as an example of objects, prototypes, and stack context. Promise rejection and `async`/`await` error flow are covered in Days 18"“19.

This lecture teaches language-level exception behavior. Node-specific process events and graceful shutdown are outside this language-level scope.

## Core Concepts

### 1. Three kinds of failure

A **syntax error** means the source cannot be parsed as valid JavaScript. Normal execution does not start for that source:

```js
// const = 10; // SyntaxError
```

A **runtime error** occurs while valid code is running:

```js
const user = null;
// user.name; // TypeError at runtime
```

An **incorrect result** is code that runs without throwing but computes the wrong answer:

```js
function addTax(amount) {
  return amount + 18; // A logic error, not necessarily a runtime error.
}
```

The distinction helps debugging. A parser problem needs a source fix; a runtime problem needs a control-flow or input fix; a wrong result needs a correctness investigation.

### 2. `Error` objects

An error object describes a failure. `Error` includes a message and normally a stack trace. JavaScript also provides types such as `TypeError`, `RangeError`, and `SyntaxError`:

```js
function setPercentage(value) {
  if (!Number.isFinite(value)) {
    throw new TypeError("percentage must be a finite number");
  }
  if (value < 0 || value > 100) {
    throw new RangeError("percentage must be between 0 and 100");
  }
}
```

The error class should help a caller decide what happened. Do not use an error type as a replacement for a complete application error taxonomy.

### 3. Throwing and catching

`throw` stops the current normal execution path and looks for the nearest matching `catch` in the call stack:

```js
function parseCount(text) {
  const count = Number(text);
  if (!Number.isInteger(count) || count < 0) {
    throw new TypeError("count must be a non-negative integer");
  }
  return count;
}

try {
  console.log(parseCount("bad"));
} catch (error) {
  console.log(error.name);    // "TypeError"
  console.log(error.message); // "count must be a non-negative integer"
}
```

The `catch` block receives the thrown value. Modern JavaScript supports optional catch binding when the error is intentionally ignored:

```js
try {
  riskyOperation();
} catch {
  useFallback();
}
```

A catch block should not silently hide an error unless the fallback is deliberate and observable.

### 4. JavaScript allows throwing non-Errors

This is legal but usually a bad application practice:

```js
// throw "failed";
// throw { code: "BAD_INPUT" };
```

Thrown strings and plain objects may have no stack, consistent name, or reliable metadata. Throw `Error` objects, preferably with a meaningful message and optional structured fields.

### 5. `finally` is for cleanup

`finally` runs after the `try` body and after a matching `catch`, whether the code succeeds or throws:

```js
function readWithCleanup(read) {
  let resource;
  try {
    resource = read();
    return resource.value;
  } finally {
    if (resource) {
      resource.close();
    }
  }
}
```

Cleanup should happen even when the main operation fails. The exact resource API is host-specific; the language rule is about control flow.

Avoid `return` inside `finally`:

```js
function dangerous() {
  try {
    throw new Error("original failure");
  } finally {
    return "success";
  }
}

console.log(dangerous()); // "success"; the error was suppressed
```

A return, throw, or other abrupt completion from `finally` can replace the earlier result or error. This makes debugging and reliability much harder.

### 6. Rethrowing and transforming errors

A catch block may handle an error, rethrow the same error, or create a higher-level error:

```js
class ConfigurationError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "ConfigurationError";
  }
}

function loadConfiguration(load) {
  try {
    return load();
  } catch (error) {
    throw new ConfigurationError("configuration could not be loaded", {
      cause: error,
    });
  }
}
```

`cause` lets the higher-level error preserve the original failure without forcing callers to parse the message. Support for the `cause` option depends on the runtime version; current Node.js versions support it, but a project that supports older runtimes should verify compatibility.

Do not expose internal paths, tokens, SQL, or user data in a public response merely because they appear in an error message or cause chain.

### 7. Error categories

A service often benefits from distinguishing:

- **Validation errors:** Input does not satisfy the public contract. The caller may fix it.
- **Expected operational errors:** A dependency is unavailable, a resource is missing, or a timeout occurred. The caller may retry or receive a controlled response.
- **Programmer errors:** An invariant was broken or code used an API incorrectly. These need investigation and should not be disguised as normal user input failures.

The categories are design choices, not universal JavaScript classes. State how the application maps them to logs, metrics, responses, retries, and shutdown decisions.

## Detailed Explanations and Traces

### How stack unwinding works

Consider:

```js
function levelOne() {
  return levelTwo();
}

function levelTwo() {
  return levelThree();
}

function levelThree() {
  throw new Error("broken");
}

try {
  levelOne();
} catch (error) {
  console.log(error.message); // "broken"
}
```

Trace:

1. `levelOne` calls `levelTwo`.
2. `levelTwo` calls `levelThree`.
3. `levelThree` throws and stops its normal path.
4. No handler exists inside `levelThree` or `levelTwo`, so the stack unwinds.
5. The outer `catch` receives the error.

A `finally` block encountered during unwinding still runs. If that block throws a new error, the new error can replace the original one.

### Synchronous and asynchronous boundaries

This catches a synchronous throw:

```js
try {
  throw new Error("now");
} catch (error) {
  console.log("caught", error.message);
}
```

A callback scheduled for later runs after the `try` statement has finished:

```js
try {
  setTimeout(() => {
    throw new Error("later");
  }, 0);
} catch (error) {
  console.log("not reached for the later throw");
}
```

This is why asynchronous APIs need their own error channel, such as a callback argument or a rejected promise. Later lectures show how `await` lets a surrounding `try` handle a promise rejection when the await occurs inside that block.

### Cleanup order and ownership

When several operations acquire resources, cleanup should happen in reverse acquisition order where that is required by the resource relationship:

```js
function useTwoResources(openFirst, openSecond) {
  const first = openFirst();
  try {
    const second = openSecond();
    try {
      return [first, second];
    } finally {
      second.close();
    }
  } finally {
    first.close();
  }
}
```

This example returns resources only to show the control flow; a real function would usually perform work before closing them. The important design question is: which function owns each resource and is responsible for cleanup on every path?

## Compare & Recall

| Concept A | Concept B | Key difference |
|---|---|---|
| `throw` value | `throw new Error(...)` | You can throw anything, but only `Error` objects carry a `.stack` trace. Always throw `Error` objects or subclasses in application code. |
| `catch` block | `finally` block | `catch` handles errors. `finally` always runs (success or failure). Never `return` from `finally` — it silently replaces the original result. |
| Synchronous error | Asynchronous error | A `try/catch` around `setTimeout(fn, 0)` **won't catch** errors that `fn` throws. The original `try` block is already done by then. |
| Validation error | Programmer error | Validation: bad data from outside (recoverable, return 4xx). Programmer: bug in your own code (not recoverable, let it crash or log + alert). |
| `error.message` | `error.cause` | `.message` is the human-readable summary. `.cause` links to the original lower-level error you wrapped — preserving the full error chain for debugging. |
| `Error` (base) | Custom error class | Use base `Error` for generic failures. Subclass for domain errors you need to `instanceof`-check and route differently (e.g. `ValidationError`, `NotFoundError`). |

> **Cross-day links:** Async error handling (`try/catch` with `await`) is in [Day 19](day-19-async-await-and-error-handling.md). Promise rejection chains are in [Day 18](day-18-promises-and-event-loop.md). Node process-level error events are in the Node lectures.

## Common Mistakes and Interview Traps

- Calling every failure an exception without distinguishing syntax, runtime, and logic errors.
- Throwing strings and losing stack or structured error information.
- Returning from `finally` and suppressing a real error.
- Catching an error, replacing it with a message, and losing the original cause.
- Catching asynchronous callback errors with a `try` block that has already finished.
- Logging secrets, tokens, passwords, or personal data from error objects.
- Retrying every error without classifying idempotency and failure type.
- Catching programmer errors and pretending the system is healthy.
- Assuming an error name alone is enough to decide whether an operation is safe to retry.

## Tricky Points

1. A `finally` block runs during both success and stack unwinding, but its own abrupt completion can replace the earlier result.
2. `throw` accepts any value, although `Error` objects are the reliable application convention.
3. A synchronous `try` does not catch a later callback throw.
4. Wrapping an error should preserve the original cause and useful context.
5. A caught error is not automatically handled; the catch block must restore a safe state or deliberately propagate failure.

## Practical Exercise

**Goal:** Design an error taxonomy for a small service function that reads and validates a user profile.

**Task:** Define at least one validation error, one expected dependency error, and one programmer/invariant error. Write a function that either returns a valid profile or throws an appropriate `Error` object.

**Edge cases:** Missing input, malformed input, dependency rejection, cleanup that itself fails, and a failure containing sensitive data.

**Acceptance criteria:** Tests verify error class or stable error code, preserved cause where wrapping occurs, no error suppression through `finally`, and safe public messages separate from internal diagnostic details.

## Summary

- Syntax errors prevent parsing; runtime errors happen during execution; logic errors may produce wrong results without throwing.
- `throw` transfers control to the nearest compatible `catch` while unwinding the stack.
- Use `Error` objects with meaningful types, messages, and causes.
- `finally` is for cleanup and should not return or throw unless replacing the earlier outcome is intentional.
- Error handling should classify validation, operational, and programmer failures.
- A synchronous `try` does not catch a later asynchronous callback error.
- Error boundaries should preserve diagnosis internally while preventing sensitive data from leaking externally.

## Cheat Sheet

| Situation | Recommended behavior |
| --- | --- |
| Invalid public input | Throw or return a stable validation error according to the API contract |
| Low-level failure | Add context and preserve `{ cause }` when wrapping |
| Cleanup | Put it in `finally` or the resource API's explicit cleanup mechanism |
| Need to ignore an error | Use an explicit fallback and record enough context |
| Callback fails later | Use the callback's error channel or a promise rejection |
| Public response | Map internal errors to safe, stable messages |
| `finally` | Never return there casually; it can suppress the original result or error |

**vs. quick reference**

| | `try/catch` | `try/finally` | `try/catch/finally` |
|---|---|---|---|
| Catches errors | ✓ | ✗ | ✓ |
| Runs cleanup always | ✗ | ✓ | ✓ |
| `return` in `finally` replaces result | ✓ | ✓ | ✓ |

| Error category | Who should handle it |
|---|---|
| Validation error | Caller — return a 4xx-like response |
| Operational error (e.g. DB timeout) | Service layer — retry or wrap and rethrow |
| Programmer error (bug) | Let it propagate / log and alert; don't swallow |

## Interview Questions

> Difficulty guide: **[Beginner]** = entry-level, **[Mid]** = requires understanding of internals, **[Senior]** = design and tradeoff thinking expected.

1. **[Beginner] Mental model:** Distinguish syntax errors, runtime errors, logic errors, validation errors, operational failures, and programmer errors.
   - **Expected answer shape:** Define each category, give a small example, and explain who should handle it.
   - **Follow-up:** Which categories should normally trigger process termination, and why can the answer depend on architecture?

2. **[Mid] Predict the output:** Trace a function with a `throw` in `try`, a `catch`, and a `return` in `finally`.
   - **Expected answer shape:** State the returned value or thrown error and explain how abrupt completion from `finally` replaces earlier control flow.
   - **Follow-up:** What code review rule would prevent this bug?

3. **[Senior] Implementation:** Build an error hierarchy for a service that parses input, calls a dependency, and maps failures to an HTTP-facing result without exposing secrets.
   - **Expected answer shape:** Define classes or stable codes, causes, safe messages, logging fields, and mapping boundaries.
   - **Follow-up:** How do you preserve useful context when an error is not an `Error` object?

4. **[Mid] Debugging:** A `try/catch` around a timer callback never catches a thrown error, and a process-level failure occurs. Explain the causal timeline and repair the API.
   - **Expected answer shape:** Show when the original `try` ends, identify the missing asynchronous error channel, and propose callback or promise handling.
   - **Follow-up:** How would you test that the error is observed exactly once?

5. **[Senior] Design:** A database timeout is wrapped three times by different layers. Design a cause and logging policy that keeps diagnosis possible without duplicating noisy stack traces or leaking query data.
   - **Expected answer shape:** Discuss ownership, stable classification, cause chains, redaction, retry policy, and observability.
   - **Follow-up:** How should metrics distinguish dependency failure from invalid caller input?

