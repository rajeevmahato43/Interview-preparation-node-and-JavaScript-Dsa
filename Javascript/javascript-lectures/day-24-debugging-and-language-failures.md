# Day 24: Debugging and Language Failures

<nav aria-label="Lecture navigation">

[Previous: Testing JavaScript Behavior](day-23-testing-javascript-behavior.md) | [Roadmap](../javascript-roadmap.md) | [Next: Security-Relevant JavaScript Behavior](day-25-security-relevant-javascript.md)

</nav>

## Learning Outcomes

- Reduce a failure to a minimal reproducible example.
- Read stack traces and preserved error causes as a causal sequence.
- Debug mutation, promise propagation, and scheduling without guessing.
- Log useful context without leaking sensitive data.

## Prerequisites and Links

Read [Day 07](day-07-errors-and-exception-flow.md), [Day 18](day-18-promises-and-composition.md), [Day 20](day-20-jobs-microtasks-and-scheduling.md), and [Day 23](day-23-testing-javascript-behavior.md).

## Core Concepts

Debugging is hypothesis testing. Reproduce the failure, minimize inputs, observe state transitions, identify the first incorrect event, and verify the smallest repair. The final exception is often downstream of the first wrong value or missing `await`.

A useful error has a stable classification, safe context, and a cause chain. A log should identify operation, correlation context, and relevant bounded values without dumping credentials or user secrets.

## Detailed Explanations of Difficult Behavior

### Promise propagation

```js
// Node.js or any ECMAScript host
function broken(load) {
  return Promise.resolve().then(() => {
    load(); // missing return
  });
}

broken(() => Promise.reject(new Error("dependency failed")))
  .then((value) => console.log(value)); // prints undefined; rejection may escape
```

A minimal reproduction makes the missing `return` visible. Repair it by returning the promise, then test rejection explicitly.

### Mutation diagnosis

When an output changes unexpectedly, log identity and ownership: `Object.is`, reference equality, own keys, and a focused snapshot. Do not rely on a serialized snapshot to explain prototypes, symbols, cycles, or shared references.

## Examples and Traces

**Environment:** Node.js or another ECMAScript runtime.

```js
const events = [];
Promise.resolve()
  .then(() => events.push("first"))
  .then(() => events.push("second"));
console.log(events); // [] before promise jobs run

queueMicrotask(() => console.log(events)); // [ "first", "second" ]
```

The trace separates synchronous observation from later jobs. Exact timer/I/O ordering remains host behavior and should be reproduced in the target Node runtime.

## Node.js Connection

Node provides stack inspection, logging, test, and diagnostic tools, but the debugging method begins with JavaScript semantics: scope, identity, promise chains, and scheduling. Keep the language failure separate from Node's event-loop or API behavior while investigating.

## Common Mistakes and Interview Traps

- Starting with a large production trace instead of a minimal reproduction.
- Logging the final error while discarding its cause.
- Adding arbitrary delays to hide ordering bugs.
- Serializing objects and assuming the snapshot preserves identity.
- Logging tokens, passwords, full request bodies, or unbounded payloads.

## Tricky Points

The stack where a promise is created is not always the same as the operation that later rejects. Preserve causes and add operation context at boundaries rather than wrapping every layer with the same message.

## Practical Exercise

**Goal:** Reduce and repair a failing asynchronous workflow.

**Inputs:** A function with a missing promise return, a shared mutable object, and an ordering assertion.

**Constraints:** Produce a minimal reproduction, record the causal event sequence, and make the smallest repair.

**Edge cases:** Synchronous throw, rejected promise, repeated invocation, and concurrent calls.

**Acceptance criteria:** The reproduction fails deterministically before the fix, passes afterward, and includes a safe diagnostic record with no secret data.

## Summary

Debugging is controlled observation. Minimize failures, find the first incorrect transition, preserve causes, and distinguish synchronous state from later promise jobs. Safe, bounded context is more useful than indiscriminate logging.

## Cheat Sheet

1. Reproduce.
2. Minimize.
3. Observe inputs, identity, and event order.
4. Find the first incorrect transition.
5. Repair one cause.
6. Add a regression test.

## Interview Questions

1. **Hard - Debugging:** A function resolves successfully even though its dependency rejects. Trace the promise chain and identify the missing operation.
2. **Hard - Trace:** Explain why a synchronous log sees an empty array before a promise reaction mutates it.
3. **Very Hard - Design:** Define safe async diagnostics for a service with causes, retries, and sensitive input.
