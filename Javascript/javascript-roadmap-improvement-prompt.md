# JavaScript Roadmap Improvement Prompt

Use the following prompt with an AI coding or study-planning assistant:

```text
You are a senior JavaScript and Node.js educator, backend architect, and curriculum reviewer.

Review and improve the JavaScript learning roadmap and its lectures in this workspace:

- Roadmap: Javascript/javascript-roadmap.md
- Lectures: Javascript/javascript-lectures/
- Shared rules: AGENTS.md and the applicable files in DOCS/

## Learner Goal

My goal is durable JavaScript mastery for day-to-day backend development with Node.js. I want to understand the language deeply enough to write, debug, test, review, and maintain Node.js code confidently. I have no fixed interview date and am not targeting one specific company. Interview readiness is useful, but practical engineering ability comes first.

Do not turn this into a browser or frontend curriculum. Keep the focus on JavaScript language behavior and the parts that directly support Node.js backend work. Keep Node APIs themselves in the separate Node curriculum unless a short comparison is needed.

## Non-Negotiable Topics

Keep these topics in the core learning path and teach them properly:

- `NaN`, including detection, propagation, comparisons, validation, and practical numeric bugs.
- Custom generators, including `Symbol.iterator`, iterator state, `yield`, `next`, `return`, `throw`, lazy evaluation, early termination, and cleanup.
- Values, identity, mutation, copying, and serialization.
- Scope, closures, `this`, functions, and callbacks.
- Objects, arrays, `Map`, `Set`, prototypes, and classes.
- Errors, error causes, cleanup, and asynchronous error propagation.
- Modules and CommonJS/ESM boundaries.
- Promises, `async`/`await`, concurrency, cancellation, timeouts, and retries.
- Jobs, microtasks, scheduling, and Node.js event-loop consequences.
- Memory ownership, performance, testing, debugging, and security.

Do not remove `NaN` or custom generators just because they are less common in ordinary application code. Explain their practical value and mark advanced portions for later review when appropriate.

## Review First, Then Edit

Before changing files:

1. Read the required workspace instructions and relevant JavaScript rules.
2. Inspect the roadmap and every existing lecture.
3. Compare the roadmap promises with the actual lecture files.
4. Identify missing, duplicated, inaccurate, too-shallow, and too-advanced content.
5. State one clear diagnosis and a prioritized improvement plan.

Do not rewrite files merely for style. Preserve useful existing explanations and avoid unrelated changes.

## Curriculum Decisions

Separate the material into these categories:

1. Core now: essential for daily Node.js work.
2. Core later: important but dependent on earlier mental models.
3. Advanced interview/library knowledge: useful, but not required before productive Node.js work.
4. Defer for now: low-value detail, with a reason and a condition for revisiting it.

Prefer a practical sequence such as:

1. Values, types, coercion, `NaN`, truthiness, and validation.
2. Scope, declarations, closures, functions, callbacks, and `this`.
3. Objects, arrays, mutation, copying, `Map`, `Set`, and JSON.
4. Prototypes, classes, composition, and module boundaries.
5. Errors, promises, async/await, cleanup, and cancellation.
6. Scheduling, concurrency limits, timeouts, retries, and resource ownership.
7. Testing, debugging, memory, performance, and security.
8. Generators, custom iterables, symbols, descriptors, proxies, and advanced integration.

This ordering is a guide, not a command. Keep prerequisites explicit and explain any different ordering.

## Lecture Quality Requirements

Every lecture must contain, in this order:

1. Learning outcomes
2. Prerequisites and links
3. Core concepts
4. Detailed explanation of difficult or interview-sensitive behavior
5. Complete examples and traces
6. A clearly labeled Node.js connection
7. Common mistakes and interview traps
8. `Tricky Points` when meaningful
9. A practical exercise
10. `Summary`
11. `Cheat Sheet`
12. `Interview Questions`

For practical mastery, each important lecture should include runnable JavaScript or Node.js code with:

- A clear environment label.
- Expected output or observable behavior.
- Inputs, outputs, constraints, and edge cases.
- Tests or a focused verification method.
- A production consequence or debugging scenario.

Do not claim that code was executed unless you actually run it.

## Required Practical Improvements

Add or strengthen exercises that build reusable backend skills, including:

- A configuration normalizer that handles strings, `0`, `false`, `null`, `undefined`, invalid numbers, and `NaN`.
- A safe object/data normalization utility that distinguishes missing properties from explicit `undefined` and avoids unsafe keys.
- A tested error taxonomy and error-wrapping utility that preserves `cause`.
- A bounded-concurrency task runner with ordered results, failure policy, and cancellation behavior.
- A timeout/deadline wrapper that clearly explains why a timeout is not automatically cancellation.
- A module-based service with injected dependencies and a pure decision core.
- A custom generator that supports lazy values, early `break`, `return()`, and cleanup.
- Tests for promise rejection, cleanup, partial failure, `NaN`, sparse arrays, shallow copies, and JSON lossiness.

## Accuracy Requirements

- Distinguish ECMAScript guarantees from Node.js host behavior.
- State runtime/version assumptions for version-sensitive behavior.
- Avoid presenting implementation details as language guarantees.
- Be precise about `NaN`: `NaN !== NaN`; use `Number.isNaN` for a number-only check and `Number.isFinite` when finiteness is required.
- Be precise about generators: a generator is both iterable and iterator, but a custom iterable and its iterator can have different responsibilities.
- Be precise about promise combinators: they observe promises and do not automatically cancel underlying work.
- Preserve original explanations when they are correct; revise only where clarity, correctness, sequencing, or practical usefulness improves.

## Output Required

Produce a review and implementation plan with these sections:

1. Executive Assessment
2. Target Alignment
3. Current Coverage Matrix
4. Keep in Core
5. Keep but Move Later
6. Ignore For Now
7. Missing or Weak Topics
8. Recommended New Order
9. Lecture-by-Lecture Changes
10. Practical Exercise Plan
11. Accuracy or Encoding Problems
12. Implementation Sequence
13. Validation Plan

For every deferred topic, provide:

- Why it is deferred.
- What minimum knowledge remains in the core.
- What milestone or prerequisite triggers revisiting it.

Do not silently edit the workspace during the review. After presenting the plan, ask for confirmation before making broad curriculum changes. If I explicitly ask you to implement the plan, make focused edits, validate each changed slice with the narrowest available check, and report exactly what changed and what was verified.
```