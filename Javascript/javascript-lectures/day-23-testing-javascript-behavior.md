# Day 23: Testing JavaScript Behavior

<nav aria-label="Lecture navigation">

[Previous: Performance and Algorithmic Reasoning](day-22-performance-and-algorithmic-reasoning.md) | [Roadmap](../javascript-roadmap.md) | [Next: Debugging and Language Failures](day-24-debugging-and-language-failures.md)

</nav>

## Learning Outcomes

- Test observable behavior rather than implementation details.
- Write deterministic tests for synchronous and asynchronous failures.
- Verify cleanup, `NaN`, sparse arrays, shallow copies, and JSON lossiness.
- Choose mocks and fakes without hiding important integration behavior.

## Prerequisites and Links

Read [Day 07](day-07-errors-and-exception-flow.md), [Day 18](day-18-promises-and-composition.md), [Day 19](day-19-async-await-errors-and-cleanup.md), and [Day 20](day-20-jobs-microtasks-and-scheduling.md). Examples use the Node.js built-in test runner when a Node version that provides it is selected; verify the project runtime before execution.

## Core Concepts

A useful test names the input, observable result, and contract. Pure functions are cheap to test with tables. Side-effecting code needs an explicit boundary so a fake dependency can record calls and failures. Async tests must await the promise under test; otherwise the test may finish before the failure occurs.

## Detailed Explanations of Difficult Behavior

### Rejection and cleanup

**Environment:** Node.js with `node:test` and `node:assert/strict`.

```js
import test from "node:test";
import assert from "node:assert/strict";

async function withResource(open, close, work) {
  const resource = await open();
  try { return await work(resource); }
  finally { await close(resource); }
}

test("cleanup runs after rejection", async () => {
  const events = [];
  await assert.rejects(
    withResource(
      async () => "resource",
      async () => events.push("close"),
      async () => { throw new Error("failure"); },
    ),
    /failure/,
  );
  assert.deepEqual(events, ["close"]);
});
```

The test observes both rejection and cleanup. It would be incomplete if it asserted only the error.

### Required edge cases

- `Number.isNaN(NaN)` is true, but `Number.isNaN("NaN")` is false.
- Sparse-array methods may skip holes, while `for...of` reads positions.
- Spread creates a shallow copy; nested objects remain shared.
- JSON converts `NaN` to `null` and omits `undefined` object properties.

## Examples and Traces

```js
const sparse = [];
sparse[2] = "value";
console.log(sparse.map(String)); // [ <2 empty items>, "value" ] in Node inspection
console.log([...sparse]); // [ undefined, undefined, "value" ]

const original = { nested: { count: 1 } };
const copy = { ...original };
copy.nested.count = 2;
console.log(original.nested.count); // 2

console.log(JSON.stringify({ invalid: NaN, missing: undefined }));
// {"invalid":null}
```

Verify exact inspection output in the stated Node version; the semantic assertions are the important contract.

## Node.js Connection

The Node test runner, timers, filesystem, and network fakes are host tools. The language-level lesson is to isolate pure decisions and await async work. A test that passes because it never awaits a rejection is not evidence of correctness.

---

## Compare & Recall

| Concept A | Concept B | Key difference |
|---|---|---|
| Mock | Fake | Mock: a test double that verifies **how** it was called (specific interactions). Fake: a simpler working implementation (e.g., in-memory database). Fakes test more of the real behavior; mocks test only the contract call. |
| Unit test | Integration test | Unit: tests one function/module in isolation. Integration: tests two or more units working together. Unit tests are faster and more isolated; integration tests catch wiring bugs. |
| `assert.throws` | `await assert.rejects` | `assert.throws` catches synchronous throws. `await assert.rejects` catches async promise rejections. If you use `assert.throws` for an async function, the test passes even if it rejects. |
| Table-driven test | Ad-hoc tests | Table-driven: one test function, many input/output rows. Easier to add cases, reduces duplication, and makes edge cases visible. Ad-hoc: individual test for each case, more verbose. |
| Real dependency | Injected fake/stub | Real dependencies make tests slow, flaky, and hard to isolate. Injected fakes are fast and deterministic. Inject at a **boundary** (repository, clock, mailer) rather than mocking internal helper functions. |
| `try { await fn() } catch` | Checking result value | `try/catch` is the right pattern for testing rejections inline. Alternatively, `await assert.rejects(fn(), /message/)` is cleaner and avoids the "passes without throwing" pitfall. |

> **Cross-day links:** Async error handling patterns are in [Day 19](day-19-async-await-errors-and-cleanup.md). Debugging JavaScript behavior is in [Day 24](day-24-debugging-and-language-failures.md). Pure function architecture for testability is in [Day 26](day-26-javascript-boundaries-for-services.md).

## Common Mistakes and Interview Traps

- Forgetting `await assert.rejects(...)`.
- Mocking every dependency until no real contract remains.
- Depending on test order or shared mutable fixtures.
- Asserting private implementation calls instead of observable behavior.
- Using real time for a deadline test without a deterministic clock strategy.

## Tricky Points

A rejected promise can become an unhandled rejection if the test does not observe it promptly. Tests should also verify cleanup when the operation succeeds, rejects, times out, and is cancelled.

## Practical Exercise

**Goal:** Build a focused regression suite.

**Inputs:** A normalizer, an async resource wrapper, and a data transformation function.

**Constraints:** Use table-driven cases, await every async assertion, and avoid external services.

**Edge cases:** Rejection, cleanup failure, `NaN`, sparse arrays, shallow copies, JSON lossiness, repeated invocation, and empty input.

**Acceptance criteria:** Tests fail before each bug fix and pass after it; document the contract each test protects. Run with the selected Node test command and report the actual version/output.

## Summary

Tests should make behavior and contracts visible. Await async assertions, test both outcomes and cleanup, and include language edge cases that can silently change data. Keep pure decisions separate from side effects so tests remain deterministic.

## Cheat Sheet

| Test concern | Practice |
|---|---|
| Promise rejection | `await assert.rejects(...)` |
| Cleanup | Assert it on success and failure |
| Tables | One contract, many inputs |
| Time | Inject a clock or use controlled time |
| Mocks | Replace boundaries, not the behavior under test |
| Copies/JSON | Assert nested sharing and lossy conversion explicitly |

## Interview Questions

> Difficulty guide: **[Beginner]** = entry-level, **[Mid]** = requires understanding of internals, **[Senior]** = design and tradeoff thinking expected.

1. **[Mid] Definition:** Explain why an async test can pass while the operation later rejects.
2. **[Senior] Implementation:** Design tests for a timeout wrapper that distinguish rejection from cancellation.
3. **[Senior] Review:** Identify which mocks in a service test hide the real contract and replace them with narrower fakes.
