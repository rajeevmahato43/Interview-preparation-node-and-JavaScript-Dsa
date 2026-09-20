# Day 39: Testing Strategy Across Boundaries

<nav aria-label="Lecture navigation">

[Previous: Security Review of a Node Backend](day-38-security-review-of-a-node-backend.md) | [Roadmap](../node-roadmap.md) | [Next: Performance and Debugging Case Studies](day-40-performance-and-debugging-case-studies.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Choose the right test level for a feature at the Node service boundary.
- Distinguish unit tests, HTTP tests, repository tests, and end-to-end checks.
- Understand when mocks are useful and when they hide the real failure mode.
- Test failure behavior, resource cleanup, and timeout paths without relying on brittle implementation details.

## Prerequisites

- [Day 12: Testing, Diagnostics, Observability, and Shutdown](day-12-testing-diagnostics-observability-and-shutdown.md)
- [Day 20: Express Security and HTTP Testing](day-20-express-security-and-http-testing.md)
- [Day 32: PostgreSQL in Express](day-32-postgresql-in-express.md)

## Core Concepts

### 1. Tests should prove behavior at the right boundary

A good test answers: ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œWhat contract is being checked?ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â

- unit test: pure function behavior
- HTTP integration: request/response contract
- repository test: database behavior under realistic inputs
- end-to-end: selected workflow across services

### 2. Mocks must preserve behavior, not replace it

A mock is useful when it represents the dependency boundary clearly, but a mock can hide real timing, error, or lifecycle behavior. It should not become a fake implementation that passes without proving the real contract.

### 3. Cleanup is part of correctness

Tests that leak timers, open handles, or connections are not trustworthy. A Node service must clean up resources in setup and teardown.

## Detailed Explanations and Traces

### A service boundary test example

```js
const { createApp } = require("../src/app");
const request = require("supertest");

it("returns 400 for invalid user input", async () => {
  const app = createApp({ userService: { create: async () => { throw new Error("bad input"); } } });
  const response = await request(app).post("/users").send({});
  expect(response.status).toBe(400);
});
```

This verifies the HTTP contract without needing a live database dependency.

### When integration tests matter

A repository or database test ensures the storage layer still respects constraints and transaction behavior. This is where mocks would be too clean to trust.

## Common Mistakes and Interview Traps

- Mocking everything and never testing a real boundary.
- Testing internal implementation details instead of behavior.
- Forgetting cleanup in async tests.
- Using a fake timer to cover all async behavior and missing real network behavior.

## Tricky Points

- A test suite is a product of its boundaries. A wrong boundary means a wrong confidence level.
- The need to mock is not the same as the need to fake the behavior completely.
- ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œIt passes locallyÃƒÂ¢Ã¢â€šÂ¬Ã‚Â is not the same as ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œthe contract is reliable in production.ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â

## Practical Exercise

**Goal:** Build a small test plan for a user API across unit, HTTP, and repository boundaries.

**Inputs and outputs:** Validate success, validation failure, duplicate-user failure, and service error behavior.

**Constraints:** Keep the tests behavior-focused and clean up resources.

**Acceptance criteria:** The suite covers the real API contract and fails when a boundary changes.

## Summary

- Test the behavior that matters, not the implementation details that happen to be nearby.
- Use mocks carefully and test real boundaries where the risk is real.
- Cleanup and failure-path assertions are essential for Node services.

## Cheat Sheet

| Level | Best for |
|---|---|
| unit | pure logic and validation |
| HTTP integration | request/response contract |
| repository/integration | real DB or dependency behavior |
| end-to-end | critical workflow verification |

## Interview Questions

1. **Definition:** Why do tests need boundaries?
   - **Expected answer:** A test is only valuable when it checks the behavior that matters at the correct abstraction level.
   - **Follow-up:** What does a mock do wrong if it replaces too much?

2. **Design:** How would you test an invalid login flow without relying on a real auth service?
   - **Expected answer:** Use HTTP integration tests for the route, a mock or stub at the auth boundary, and assert the API response contract.
   - **Follow-up:** What is the missing layer if you only test a function call?

3. **Implementation:** Write a test that ensures a service cleans up after itself under failure.
   - **Expected answer:** Assert timeouts, resource release, or listener teardown under failure conditions.
   - **Follow-up:** Why is this harder in async Node code?

4. **Engineering judgment:** When should you prefer an integration test over a mock-heavy unit test?
   - **Expected answer:** When the boundary is where correctness and failure behavior actually matter, especially with network, timing, or databases.
   - **Follow-up:** What is the risk of skipping that evidence?

<nav aria-label="Lecture navigation">

[Previous: Security Review of a Node Backend](day-38-security-review-of-a-node-backend.md) | [Roadmap](../node-roadmap.md) | [Next: Performance and Debugging Case Studies](day-40-performance-and-debugging-case-studies.md)

</nav>