# Day 17: Async Express and Centralized Errors

<nav aria-label="Lecture navigation">

[Previous: Express Input Parsing, Validation, and Serialization](day-16-express-input-validation-and-serialization.md) | [Roadmap](../node-roadmap.md) | [Next: API Contracts, Pagination, and Idempotency](day-18-api-contracts-pagination-and-idempotency.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Handle async route handlers correctly in Express.
- Understand why promise rejections must be passed to Express error middleware.
- Design a centralized error layer for validation, auth, not-found, and unexpected failures.
- Avoid common issues like double responses and lost stack traces.

## Prerequisites

- [Day 14: Express Middleware and Request Flow](day-14-express-middleware-and-request-flow.md)
- [Day 16: Express Input Parsing, Validation, and Serialization](day-16-express-input-validation-and-serialization.md)
- JavaScript lecture on async/await and promises

Express does not magically catch async failures. The application must route them to the error pipeline in a consistent way.

## Core Concepts

### 1. Async handlers need special care

This is common:

```js
app.get("/users/:id", async (req, res) => {
  const user = await service.getUser(req.params.id);
  res.json(user);
});
```

This will work for the happy path, but if `service.getUser()` rejects, the rejection can escape the Express pipeline unless it is handled.

### 2. Wrap async code or use a helper

```js
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

app.get("/users/:id", asyncHandler(async (req, res) => {
  const user = await service.getUser(req.params.id);
  res.json(user);
}));
```

This keeps promise rejection flowing into Express error handling.

### 3. Centralized error handlers map failures to HTTP responses

```js
app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ error: "unauthorized" });
  }

  console.error(err);
  res.status(500).json({ error: "internal server error" });
});
```

This separation makes responses consistent and easier to test.

### 4. Not-found and conflict types should be explicit

Not all failures are 500s. A missing resource, duplicate username, or validation issue should produce a specific error class or status code.

```js
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
  }
}
```

Then map that error in the centralized error handler.

## Detailed Explanations and Traces

### Why async rejection escapes without a wrapper

```js
app.get("/users/:id", async (req, res) => {
  const user = await Promise.reject(new Error("boom"));
  res.json(user);
});
```

In Express, async route handlers are not automatically converted to a normal `next(error)` flow in all versions or patterns. The application must explicitly handle the rejection. A bare `try/catch` inside the handler is one valid option; a helper wrapper is often cleaner for repeated use.

### Double response bugs

```js
app.get("/users/:id", async (req, res) => {
  const user = await db.getUser(req.params.id);
  res.json(user);
  next(); // incorrect: route can no longer respond cleanly
});
```

This can cause headers already sent errors or weird response states. A route should either respond or pass control to the next middleware, not both.

### Error classification

An error middleware is not just a catch-all. Good error handling often uses classes or markers to separate:

- validation failure
- authorization failure
- not found
- duplicate resource
- transient dependency failure
- unknown internal error

This matters for API clients, retries, and monitoring.

## Common Mistakes and Interview Traps

- Returning `500` for all errors.
- Forgetting to call `next(error)` or `catch(next)` in async middleware.
- Calling `res.json()` and `next()` in the same route.
- Throwing raw database errors without mapping to a public API contract.
- Swallowing errors in `catch` blocks without logging or classifying them.

## Tricky Points

- Express's error middleware is designed for exactly this flow; if errors are never forwarded, the framework cannot handle them uniformly.
- A timeout or cancellation signal is a separate concern from an error object. Not every failure should become a 500.
- Logging without classification can hide the difference between client misuse and backend outage.

## Practical Exercise

**Goal:** Create a central error layer for a small user API.

**Inputs and outputs:** Support create, fetch, and missing-user routes with meaningful HTTP responses.

**Constraints:** Use async handlers, map validation, unauthorized, not-found, and internal errors, and never write two responses for a single request.

**Acceptance criteria:** Different error types produce distinct status codes and a consistent JSON response contract.

## Summary

- Async behavior in Express must be handled intentionally.
- Promise rejections should reach centralized error middleware.
- A good error layer distinguishes client error, not-found, auth failure, and internal failure.
- Consistent error contracts are part of API reliability and user experience.

## Cheat Sheet

| Error type | Typical status |
|---|---|
| validation | 400 |
| auth | 401 or 403 |
| not found | 404 |
| conflict | 409 |
| internal | 500 |
| dependency timeout | 504 or 503 |

## Interview Questions

1. **Definition:** Why is Express async error handling different from synchronous route logic?
   - **Expected answer:** Promise rejections need explicit forwarding to the error pipeline; thrown errors may be caught only if passed correctly.
   - **Follow-up:** What would happen if an async route handler rejects and no one calls `next(error)`?

2. **Trace:** Trace a request that fails validation and then is handled by centralized error middleware.
   - **Expected answer:** The route or middleware throws or rejects, the rejection is passed to `next(error)`, and the error handler maps it to a status and body.
   - **Follow-up:** Why map at the boundary instead of in each route?

3. **Implementation:** Write a clean async wrapper around a route handler and error-mapping logic.
   - **Expected answer:** Use a helper that resolves the promise and calls `next` on rejection.
   - **Follow-up:** What should happen to logs and user-facing messages?

4. **Design:** Should a database `not found` error become a 404 or a 500?
   - **Expected answer:** Usually 404 on a resource lookup, unless the server failed to query the database or the error is actually infrastructure-related.
   - **Follow-up:** Why does classification matter for clients and monitoring?

<nav aria-label="Lecture navigation">

[Previous: Express Input Parsing, Validation, and Serialization](day-16-express-input-validation-and-serialization.md) | [Roadmap](../node-roadmap.md) | [Next: API Contracts, Pagination, and Idempotency](day-18-api-contracts-pagination-and-idempotency.md)

</nav>