# Day 28: Senior JavaScript Integration and Review

<nav aria-label="Lecture navigation">

[Previous: Concurrency and Resource-Safe Async Code](day-27-concurrency-and-resource-safe-async.md) | [Roadmap](../javascript-roadmap.md) | Next

</nav>

## Learning Outcomes

- Review a JavaScript service for correctness, reliability, and maintainability.
- Trace values, errors, promises, scheduling, and ownership together.
- Identify memory, performance, security, and testability risks.
- Explain assumptions and tradeoffs instead of giving universal answers.

## Prerequisites and Links

Review Days 1–27, especially [Day 07](day-07-errors-and-exception-flow.md), [Day 17](day-17-modules-and-interoperability.md), [Day 20](day-20-jobs-microtasks-and-scheduling.md), [Day 25](day-25-security-relevant-javascript.md), and [Day 27](day-27-concurrency-and-resource-safe-async.md).

## Core Concepts

Senior JavaScript review connects language rules to system consequences. Start with contracts and trust boundaries, then inspect identity/mutation, errors and causes, async control flow, scheduling, ownership, concurrency, performance, tests, and security. Separate what ECMAScript guarantees from what Node or a dependency supplies.

## Detailed Explanations of Difficult or Interview-Sensitive Behavior

### Review checklist

1. Are values validated, including `NaN`, finiteness, ranges, and missing properties?
2. Is caller-owned data mutated or shallow-copied accidentally?
3. Are errors classified, wrapped with `cause`, and mapped safely?
4. Are promises returned and awaited deliberately?
5. Are concurrency, timeout, cancellation, retry, and cleanup contracts explicit?
6. Can long-lived references grow without bounds?
7. Are unsafe keys, regex work, and sensitive logs controlled?
8. Can the pure decision core be tested without Node APIs?

## Examples and Traces

**Environment:** Node.js or another modern ECMAScript runtime.

```js
async function reviewableOperation(input, dependencies) {
  if (!Number.isFinite(input.amount) || input.amount < 0) {
    throw new RangeError("amount must be finite and non-negative");
  }

  const decision = { accepted: input.amount <= dependencies.limit };
  if (!decision.accepted) return decision;

  await dependencies.persist(decision);
  return decision;
}
```

Observable contract: invalid numeric input rejects; rejected persistence propagates; accepted decisions are persisted once; the input is not mutated. A complete review still asks who owns retries, timeout, cancellation, and persistence cleanup.

## Node.js Connection

This final review prepares the learner for the separate Node curriculum. Node supplies loaders, timers, I/O, diagnostics, and process behavior; JavaScript supplies values, functions, objects, promises, scheduling jobs, and ownership patterns that determine how those APIs are used.

## Common Mistakes and Interview Traps

- Optimizing before identifying the contract and workload.
- Calling a design “thread-safe” without discussing Node workers or shared state boundaries.
- Assuming a promise combinator cancels work.
- Treating `JSON.stringify` as a deep clone or complete audit.
- Ignoring operational behavior because a unit test passes.

## Tricky Points

There may be several defensible designs. A strong answer states workload, consistency, failure, security, and runtime assumptions, then explains the tradeoff. ECMAScript behavior alone cannot answer a Node package-resolution or event-loop-phase question.

## Practical Exercise

**Goal:** Conduct a senior code review of a small service module.

**Inputs:** A module containing normalization, a pure decision, persistence, notifications, retries, and logging.

**Constraints:** Identify correctness, async, memory, performance, security, and testability findings; classify severity and propose focused fixes.

**Edge cases:** `NaN`, explicit `undefined`, shallow copies, rejected dependencies, timeout without cancellation, partial failure, unsafe keys, and repeated calls.

**Acceptance criteria:** Produce findings with evidence, assumptions, behavioral tests, and a clear list of what belongs in the Node curriculum instead.

## Summary

Senior JavaScript mastery is the ability to connect language behavior to backend consequences. Review contracts first, then values, identity, errors, async flow, scheduling, ownership, performance, testing, and security. State assumptions whenever behavior depends on Node, a library, or a workload.

## Cheat Sheet

- Validate before branching.
- Treat identity and mutation as explicit design decisions.
- Preserve error causes.
- Return and await promises deliberately.
- Bound concurrency and memory.
- Timeout is not cancellation.
- Retry only classified, safe work.
- Test behavior and cleanup.
- Separate ECMAScript from Node behavior.

## Interview Questions

1. **Hard - Trace:** Review a service that mixes mutation, promise chains, and a timer. Identify the first incorrect observable behavior.
2. **Very Hard - Design:** Design a reliable JavaScript service boundary with validation, injected dependencies, bounded concurrency, cancellation, retries, and safe errors.
3. **Very Hard - Review:** Give prioritized findings for correctness, security, memory, performance, and maintainability, including tests that would prove each fix.
