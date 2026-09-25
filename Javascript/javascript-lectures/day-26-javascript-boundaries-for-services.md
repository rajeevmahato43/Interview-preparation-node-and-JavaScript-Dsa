# Day 26: JavaScript Boundaries in Services

<nav aria-label="Lecture navigation">

[Previous: Security-Relevant JavaScript Behavior](day-25-security-relevant-javascript.md) | [Roadmap](../javascript-roadmap.md) | [Next: Concurrency and Resource-Safe Async Code](day-27-concurrency-and-resource-safe-async.md)

</nav>

## Learning Outcomes

- Separate pure decisions from side effects.
- Inject dependencies through explicit function or module boundaries.
- Define input, output, mutation, and error contracts.
- Build a service that is easy to test without loading Node APIs.

## Prerequisites and Links

Read [Day 07](day-07-errors-and-exception-flow.md), [Day 09](day-09-objects-and-property-access.md), [Day 17](day-17-modules-and-interoperability.md), [Day 23](day-23-testing-javascript-behavior.md), and [Day 25](day-25-security-relevant-javascript.md).

## Core Concepts

A maintainable service has a pure decision core and explicit side-effect edges. The core accepts normalized data and dependencies as values, then returns a decision. The edge performs persistence, messaging, time, and I/O through injected functions.

This is JavaScript design, not an HTTP or database lesson. The repository and notifier below are contracts represented by functions.

## Detailed Explanations of Difficult Behavior

### Pure decision core

```js
// Node.js or any ECMAScript host
function decideWelcome(user, now) {
  if (!user || typeof user.id !== "string") throw new TypeError("invalid user");
  return { userId: user.id, message: now.getUTCHours() < 12 ? "Good morning" : "Hello" };
}

async function welcomeUser({ userId, repository, clock, notifier }) {
  const user = await repository.findById(userId);
  const decision = decideWelcome(user, clock());
  await notifier.send(decision);
  return decision;
}
```

`decideWelcome` is pure with respect to its inputs. `welcomeUser` owns orchestration and injected effects. The service can be tested with a fixed clock and recording fakes.

## Examples and Traces

```js
const sent = [];
const result = await welcomeUser({
  userId: "u1",
  repository: { findById: async () => ({ id: "u1" }) },
  clock: () => new Date("2026-09-20T08:00:00Z"),
  notifier: { send: async (message) => sent.push(message) },
});
console.log(result.message); // Good morning
console.log(sent.length); // 1
```

**Verification:** Run this in an async-capable Node file and assert the result, notifier call, invalid user behavior, and repository failure propagation.

## Compare & Recall

| Concept A | Concept B | Key difference |
|---|---|---|
| Pure function | Side-effectful function | Pure: given the same inputs, always returns the same output; no external writes. Side-effectful: writes to a database, logs, sends HTTP, modifies shared state. Pure functions are trivially testable; side-effectful ones require test doubles. |
| Dependency injection | Module import | Module import: hard-coded dependency wired at load time. Injection: pass the dependency as a parameter or constructor argument. Injection makes testing and replacement easier without module mocking. |
| Orchestrator layer | Domain logic layer | Domain logic decides **what** to do (business rules, validation). Orchestrator decides **how** to do it (which services to call, in what order, with what error handling). Keep them separate. |
| Owned resource | Borrowed resource | Owned: the current code opens it and must close it. Borrowed: another layer opened it and passes it in. Mixing ownership causes double-close bugs, premature teardown, or leaks. |
| Transparent error | Swallowed error | Transparent: the error propagates to the caller with its cause. Swallowed: caught and converted to a success or a different error without preserving the original. Never swallow errors silently. |
| Observable dependency | Hidden global | Observable: passed explicitly (constructor, parameter, closure). Hidden global: `Date.now()`, `Math.random()`, module-level singleton. Hidden globals make testing non-deterministic. |

> **Cross-day links:** Dependency injection and pure function testing are in [Day 23](day-23-testing-javascript-behavior.md). Error propagation and `cause` are in [Day 07](day-07-errors-and-exception-flow.md) and [Day 19](day-19-async-await-errors-and-cleanup.md). Module structure is in [Day 17](day-17-modules-and-interoperability.md).

## Common Mistakes and Interview Traps

- Reading process state inside the pure decision core.
- Creating clients at module import time without a lifecycle contract.
- Returning mutable internal state directly.
- Catching every error and converting it to success.
- Making dependency injection so abstract that contracts disappear.

## Tricky Points

Dependency injection does not require a framework. Passing a function is often enough. Purity also does not mean the entire application has no side effects; it means the boundary is explicit.

## Practical Exercise

**Goal:** Refactor a stateful service into a pure core and injected edge.

**Inputs:** User data, a clock, repository function, and notifier function.

**Outputs:** A decision object and observable notifier call.

**Constraints:** No hidden global state, normalized input, explicit error taxonomy, and no mutation of caller-owned input.

**Edge cases:** Missing user, invalid ID, repository rejection, notifier rejection, duplicate invocation, and clock boundary.

**Acceptance criteria:** Unit-test the pure core with tables and the edge with fakes; document ownership and failure propagation.

## Summary

Pure cores make language behavior easy to test. Injected edges make side effects and ownership visible. A service contract should define accepted data, returned data, mutation, errors, and dependency failure behavior.

## Cheat Sheet

| Boundary | Question |
|---|---|
| Input | Is it normalized and validated? |
| Core | Can it run without I/O or global state? |
| Dependency | Is the contract injected and testable? |
| Output | Is ownership or copying explicit? |
| Error | Is classification and cause preserved? |
| Lifecycle | Who opens, uses, and closes resources? |

## Interview Questions

> Difficulty guide: **[Beginner]** = entry-level, **[Mid]** = requires understanding of internals, **[Senior]** = design and tradeoff thinking expected.

1. **[Senior] Design:** Separate a service into pure decision logic and effectful orchestration.
2. **[Senior] Testing:** Choose fakes for repository, clock, and notifier and explain what each test proves.
3. **[Senior] Review:** Identify hidden dependencies and ownership violations in a module-based service.
