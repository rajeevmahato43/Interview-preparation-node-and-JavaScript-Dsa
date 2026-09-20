# Day 19: Authentication and Authorization Boundaries

<nav aria-label="Lecture navigation">

[Previous: API Contracts, Pagination, and Idempotency](day-18-api-contracts-pagination-and-idempotency.md) | [Roadmap](../node-roadmap.md) | [Next: Express Security and HTTP Testing](day-20-express-security-and-http-testing.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Distinguish authentication from authorization.
- Explain common identity mechanisms in a Node backend.
- Design access checks around user identity, roles, ownership, and resource scoping.
- Avoid common flaws where a client-provided ID or role is trusted too much.

## Prerequisites

- [Day 14: Express Middleware and Request Flow](day-14-express-middleware-and-request-flow.md)
- [Day 17: Async Express and Centralized Errors](day-17-async-express-and-centralized-errors.md)
- JavaScript lecture on object trust, validation, and security

Authentication answers, ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œWho is this caller?ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Authorization answers, ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œIs this caller allowed to do that?ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â These are different checks and should be treated separately.

## Core Concepts

### 1. Authentication proves identity

A user may authenticate by session, token, mTLS, or another verified mechanism. The backend should validate the credential and produce a trusted identity object.

```js
function requireAuth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    return next(new Error("unauthorized"));
  }

  req.user = { id: 42, role: "user" };
  next();
}
```

This is a simplified example. Real systems verify a signed token, session, or external identity provider response.

### 2. Authorization checks permission

```js
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: "forbidden" });
    }
    next();
  };
}
```

This checks the caller's permission, not just whether they are signed in.

### 3. Ownership is separate from role checks

A user may be allowed to edit their own record but not other records:

```js
app.patch("/users/:id", requireAuth, async (req, res, next) => {
  if (req.user.id !== Number(req.params.id)) {
    return res.status(403).json({ error: "forbidden" });
  }
  // proceed
});
```

This is a common backend decision point and a serious source of bugs if the server trusts a user-supplied ID.

### 4. Trust boundaries need explicit checks

The request path, route parameters, and request body are all untrusted unless verified. An attacker can manipulate headers, URLs, and body data.

## Detailed Explanations and Traces

### Sequence of checks

```text
request -> parse -> auth -> role/ownership -> business logic -> response
```

The auth step should happen before business logic and before any resource mutation is attempted.

### Common auth mistake

```js
app.get("/users/:id", async (req, res) => {
  const userId = Number(req.params.id);
  const user = await repo.getUser(userId);
  res.json(user);
});
```

This route may leak data if the caller is not authorized to read that user. The server must verify identity and authorization before reading or returning that resource.

### Role versus scope

A role is a broad permission label. Scope is a narrower condition like ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œuser can read only their own orders.ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Both are useful, but they answer different questions.

## Common Mistakes and Interview Traps

- Checking auth but not authorization.
- Trusting a user-provided ID without checking ownership.
- Mixing claims from tokens with untrusted request data.
- Logging token-bearing data or secrets in request logs.

## Tricky Points

- A valid token is not enough to authorize every action.
- Ownership checks can be more important than roles in many APIs.
- Authorization should be evaluated on the server, not in the browser or client code.

## Practical Exercise

**Goal:** Design an access-control layer for a user API.

**Inputs and outputs:** Support login or token validation, role-based routes, and ownership-protected updates.

**Constraints:** Separate auth from authorization and enforce ownership checks on protected resources.

**Acceptance criteria:** Unauthenticated requests fail, unauthorized role requests fail with 403, and non-owner edits are rejected.

## Summary

- Authentication proves identity; authorization decides allowed actions.
- User-controlled input must never be trusted for permission checks.
- Roles and ownership both matter, and they are checked at different layers.
- Good access control is explicit and testable.

## Cheat Sheet

| Concern | Check |
|---|---|
| Authenticated user | token/session validated server-side |
| Role check | `req.user.role` vs required role |
| Ownership check | compare identity to resource owner |
| Forbidden action | 403 |
| Missing identity | 401 |

## Interview Questions

1. **Definition:** What is the difference between authentication and authorization?
   - **Expected answer:** Authentication identifies the caller; authorization decides if that identity is allowed to act.
   - **Follow-up:** Can a person be authenticated but still forbidden?

2. **Design:** How should a server check if a user may update another user's profile?
   - **Expected answer:** Verify the token, then compare the authenticated user ID to the target resource owner or check a role-based permission.
   - **Follow-up:** Why is a client-supplied `userId` not enough?

3. **Implementation:** Write a middleware that rejects unauthenticated or unauthorized requests with clear status codes.
   - **Expected answer:** Differentiate 401 for missing/invalid identity and 403 for insufficient permission.
   - **Follow-up:** What about ownership checks?

4. **Security judgment:** Why do auth and authorization boundaries matter in a Node backend even when the frontend is already enforcing something?
   - **Expected answer:** Client-side checks are not security boundaries; the server must enforce them.
   - **Follow-up:** What are the operational consequences of trusting the client?

<nav aria-label="Lecture navigation">

[Previous: API Contracts, Pagination, and Idempotency](day-18-api-contracts-pagination-and-idempotency.md) | [Roadmap](../node-roadmap.md) | [Next: Express Security and HTTP Testing](day-20-express-security-and-http-testing.md)

</nav>