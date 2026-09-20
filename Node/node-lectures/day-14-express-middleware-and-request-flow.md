# Day 14: Express Middleware and Request Flow

<nav aria-label="Lecture navigation">

[Previous: Express Application Structure](day-13-express-application-structure.md) | [Roadmap](../node-roadmap.md) | [Next: Express Routing and Route Parameters](day-15-express-routing-and-route-parameters.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain how middleware participates in an Express request.
- Trace request ordering through route, auth, validation, and error steps.
- Distinguish request short-circuiting from error propagation.
- Decide where to put logging, validation, auth, and not-found behavior.

## Prerequisites

- [Day 13: Express Application Structure](day-13-express-application-structure.md)
- [Day 09: Node HTTP Fundamentals](day-09-node-http-fundamentals.md)
- JavaScript lecture on functions and closures

Express is a pipeline. Each middleware function receives the request, can modify it, and may either pass control to the next handler or finish the response.

## Core Concepts

### 1. Middleware runs in order

Middleware functions are executed in registration order until one of these happens:

- it calls `next()` to continue
- it sends a response and returns
- it calls `next(error)` for error handling

```js
app.use((req, res, next) => {
  console.log("first");
  next();
});

app.use((req, res, next) => {
  console.log("second");
  next();
});

app.get("/", (req, res) => {
  res.json({ ok: true });
});
```

If the first middleware does not call `next()`, the request never reaches the handler.

### 2. Error middleware is special

Express recognizes an error middleware by its signature with four arguments:

```js
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "internal" });
});
```

This catches errors from downstream middleware or route handlers. It should not be used to silently swallow issues.

### 3. `next("route")` and `next(error)` are different

- `next("route")` skips the rest of the current route chain and moves to the next matching route.
- `next(error)` passes an error to error middleware.

This is central to request flow control.

### 4. Request and response objects are mutable

Middleware can attach metadata to `req`, e.g. `req.user`, `req.requestId`, or normalized fields. That pattern is common in auth and logging layers.

```js
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  next();
});
```

This is practical, but it depends on clear conventions and the right layer boundaries.

## Detailed Explanations and Traces

### Trace a route

```js
app.use((req, res, next) => {
  console.log("A: start");
  next();
});

app.use((req, res, next) => {
  req.user = { id: 1, role: "admin" };
  console.log("B: attach user");
  next();
});

app.get("/admin", (req, res, next) => {
  console.log("C: route handler");
  res.json({ user: req.user });
});
```

The order is A -> B -> C. If B calls `res.json(...)` without `next()`, C is skipped.

### Auth and guard ordering

```js
function requireAuth(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}

app.use("/admin", requireAuth);
app.get("/admin/metrics", (req, res) => {
  res.json({ ok: true });
});
```

This requires the auth check before the route executes. A later auth check would be too late.

### Error flow

```js
app.get("/broken", async (req, res, next) => {
  try {
    throw new Error("transaction failed");
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
```

Without `next(error)`, the promise rejection or thrown error may not reach the right handler. Express only handles errors in the framework's normal error path if they are passed correctly.

## Common Mistakes and Interview Traps

- Forgetting `next()` in middleware.
- Calling `res.json()` before auth or validation is complete.
- Using `next(error)` without a matching error handler.
- Trusting route order without understanding middleware precedence.
- Putting auth after a route that already responded.

## Tricky Points

- Middleware order is the actual application flow. The route path matters, but so does registration order.
- `next("route")` is not the same as `return next()`; it changes which route gets evaluated next.
- Express error middleware has special meaning, but it is still just another function in the pipeline.

## Practical Exercise

**Goal:** Trace and test the request flow for auth, validation, route execution, and error handling.

**Inputs and outputs:** Build a small middleware chain for `/admin` and `/users`, including unauthorized and invalid requests.

**Constraints:** Use `next()`, `res.status()`, and `next(error)` intentionally. Do not swallow errors silently.

**Acceptance criteria:** Each request ends at the expected stage, and an invalid auth request never reaches the route handler.

## Summary

- Express request handling is a pipeline.
- Middleware decides whether to continue, end, or send error control.
- Order matters, and auth, validation, and not-found logic must be placed carefully.
- Error middleware is how Node async failures become safe HTTP responses.

## Cheat Sheet

| Behavior | Meaning |
|---|---|
| `next()` | continue to next middleware or route |
| `res.send()`/`res.json()` | finish response |
| `next(error)` | pass to error middleware |
| `next("route")` | skip remaining route handlers |
| `app.use()` | add middleware for all paths or a prefix |

## Interview Questions

1. **Definition:** What does middleware do in Express?
   - **Expected answer:** It intercepts and transforms a request or response at a point in the pipeline.
   - **Follow-up:** Why does the order matter?

2. **Trace:** Trace a request sequence with auth middleware and a route that writes JSON.
   - **Expected answer:** Explain which middleware runs first, which one stops the chain, and where error handling fits.
   - **Follow-up:** What if auth is registered after the route?

3. **Implementation:** Write a guard that rejects missing or invalid authorization and calls `next(error)` for unexpected failures.
   - **Expected answer:** Differentiate user-facing 401s from internal 500s.
   - **Follow-up:** When should auth happen relative to parsing and validation?

4. **Design:** Why are auth and validation usually middleware rather than logic buried in a route?
   - **Expected answer:** Reuse, ordering control, observability, and better separation of concerns.
   - **Follow-up:** What causes coupling if they are embedded directly in handlers?

<nav aria-label="Lecture navigation">

[Previous: Express Application Structure](day-13-express-application-structure.md) | [Roadmap](../node-roadmap.md) | [Next: Express Routing and Route Parameters](day-15-express-routing-and-route-parameters.md)

</nav>