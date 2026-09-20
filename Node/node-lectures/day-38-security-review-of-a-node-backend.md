# Day 38: Security Review of a Node Backend

<nav aria-label="Lecture navigation">

[Previous: Observability and Production Operations](day-37-observability-and-production-operations.md) | [Roadmap](../node-roadmap.md) | [Next: Testing Strategy Across Boundaries](day-39-testing-strategy-across-boundaries.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Review a Node backend at the trust boundaries where real risk appears.
- Explain how input validation, authorization, secrets handling, and dependency safety connect.
- Recognize common backend vulnerability patterns without memorizing a checklist alone.
- Prioritize fixes based on impact and exploitability.

## Prerequisites

- [Day 19: Authentication and Authorization Boundaries](day-19-authentication-and-authorization-boundaries.md)
- [Day 20: Express Security and HTTP Testing](day-20-express-security-and-http-testing.md)
- [Day 33: Layered Backend Architecture](day-33-layered-backend-architecture.md)

## Core Concepts

### 1. Security is about trust boundaries

The server trust boundaries are where untrusted data enters and where privileged operations leave the application. These boundaries include:

- incoming HTTP requests
- filesystem or shell command boundaries
- database queries
- external service calls
- secret and configuration access

### 2. Defense in depth matters

One control is not enough. Validation, transport security, authn/authz, and dependency hygiene all matter.

### 3. The best review is evidence-based

A security review should ask:

- What data enters the system?
- Who is allowed to access it?
- What operations are dangerous?
- What happens if input is malformed or malicious?
- What logs, metrics, and tests capture known failures?

## Detailed Explanations and Traces

### Example: unsafe user input

```js
const fs = require("fs");
const path = req.query.file;
fs.readFile(path, "utf8");
```

This is a classic path traversal or arbitrary local file access risk if the user controls the path.

### Example: authz gap

A route may require a valid token but then trust a client-supplied `userId` without checking the token's user actually owns that resource.

This is a common backend bug and one of the easiest ways to create privilege escalation.

## Common Mistakes and Interview Traps

- Thinking CORS or browser headers are security controls.
- Checking only user identity and not resource ownership.
- Logging secrets or credentials.
- Assuming a dependency is safe because it is ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œofficial.ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â
- Mixing validation and output sanitization without a clear contract.

## Tricky Points

- Security is not a single setting or middleware list; it is a system view across boundaries.
- A vulnerability can be exploited even when the code ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œworksÃƒÂ¢Ã¢â€šÂ¬Ã‚Â for normal use.
- Dependency risk and secret handling are as important as route logic.

## Practical Exercise

**Goal:** Review a small Node service and propose fixes for a vulnerable route.

**Inputs and outputs:** A user-facing endpoint that reads a file, reads a user ID, or performs a command.

**Constraints:** Explain how to fix trust-boundary issues and add a regression test.

**Acceptance criteria:** The review includes root cause, exploit path, fix, and verification strategy.

## Summary

- The backend must protect trust boundaries, not just UI behavior.
- Security reviews should focus on exploit paths and failure modes, not a memorized checklist.
- Authorization, validation, secrets management, and dependency hygiene are all part of the same story.

## Cheat Sheet

| Concern | Control |
|---|---|
| User input | validate and constrain |
| Auth | verify identity |
| Authz | verify permission and ownership |
| Secrets | never log them, use env or secret managers |
| Dependency risk | update, audit, and constrain usage |

## Interview Questions

1. **Definition:** What is a trust boundary in a Node backend?
   - **Expected answer:** It is any place where data or actions cross from an untrusted or less-trusted context into a more privileged one.
   - **Follow-up:** Which parts of a backend are often missed?

2. **Design:** Review a route that fetches a user by `userId` from the URL and returns the full record.
   - **Expected answer:** The service should validate the identity, check authorization, restrict owner access, and never trust the URL alone.
   - **Follow-up:** Why does browser policy not help here?

3. **Implementation:** Explain how you would fix a file path vulnerability in a Node server.
   - **Expected answer:** Normalize paths, restrict to an allowed root directory, validate input, and avoid shell execution on untrusted path data.
   - **Follow-up:** What should the API return on invalid paths?

4. **Engineering judgment:** How do you prioritize security fixes in a live app?
   - **Expected answer:** Start with exploitation path, blast radius, privilege level, and ease of remediation, then add monitoring and tests.
   - **Follow-up:** What if a fix is not trivial but risk is high?

<nav aria-label="Lecture navigation">

[Previous: Observability and Production Operations](day-37-observability-and-production-operations.md) | [Roadmap](../node-roadmap.md) | [Next: Testing Strategy Across Boundaries](day-39-testing-strategy-across-boundaries.md)

</nav>