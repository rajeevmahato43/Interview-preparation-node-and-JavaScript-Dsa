# Day 15: Express Routing and Route Parameters

<nav aria-label="Lecture navigation">

[Previous: Express Middleware and Request Flow](day-14-express-middleware-and-request-flow.md) | [Roadmap](../node-roadmap.md) | [Next: Express Input Parsing, Validation, and Serialization](day-16-express-input-validation-and-serialization.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain how Express matches HTTP methods and routes.
- Use path parameters, route nesting, and router modules correctly.
- Understand how route precedence and mounting affect request handling.
- Decide when to use query parameters versus path parameters.

## Prerequisites

- [Day 09: Node HTTP Fundamentals](day-09-node-http-fundamentals.md)
- [Day 14: Express Middleware and Request Flow](day-14-express-middleware-and-request-flow.md)

## Core Concepts

### 1. Routing maps HTTP requests to handlers

Express matches the request method and path. A route can look like this:

```js
app.get("/users/:id", (req, res) => {
  res.json({ id: req.params.id });
});
```

The path parameter is available on `req.params`.

### 2. Query strings are not path params

```js
app.get("/users", (req, res) => {
  const { page, limit } = req.query;
  res.json({ page, limit });
});
```

Use query parameters for filters, pagination, and optional modifiers. Use path parameters for resource identity.

### 3. Router modules keep APIs organized

```js
const express = require("express");
const router = express.Router();

router.get("/users/:id", (req, res) => {
  res.json({ id: req.params.id });
});

module.exports = router;
```

Then mount it on the main app:

```js
const userRouter = require("./routes/users");
app.use("/api", userRouter);
```

The path becomes `/api/users/:id`.

### 4. Route ordering matters

Express checks routes in the order they are registered. A broad route can shadow more specific routes if it is mounted first.

```js
app.get("/users/:id", ...);
app.get("/users/me", ...);
```

The more specific route may still match depending on ordering and path semantics. Route precedence is a real source of surprising behavior in APIs.

## Detailed Explanations and Traces

### Parameter extraction

```js
app.get("/orders/:orderId/items/:itemId", (req, res) => {
  const { orderId, itemId } = req.params;
  res.json({ orderId, itemId });
});
```

This is common in nested resource APIs. The order and route pattern determine membership. `req.params` is available inside the route handler.

### Prefixing with subrouters

```js
const accountRouter = express.Router({ mergeParams: true });
accountRouter.get("/settings", (req, res) => {
  res.json({ userId: req.params.userId });
});

app.use("/users/:userId", accountRouter);
```

`mergeParams` keeps parent params visible to nested routes. This is useful, but it can make nested behavior harder to reason about if the route graph grows large.

### Query vs path decisions

```js
GET /users/42
GET /users?page=2&limit=10
```

The first indicates a specific resource. The second indicates a collection listing. A correct API contract should make this distinction clear.

## Common Mistakes and Interview Traps

- Treating query strings as path params or vice versa.
- Registering a broad route before a specific one.
- Forgetting that `req.params` is a separate object from `req.query`.
- Using poorly named route params like `:id` across unrelated resources.

## Tricky Points

- Express path matching is not magic; it follows a route pattern and a request method.
- `mergeParams` can be powerful but easy to misuse when nested routers become complex.
- Route precedence and mount paths are part of the contract, not just implementation detail.

## Practical Exercise

**Goal:** Build a versioned nested router for users and accounts.

**Inputs and outputs:** Support `/api/v1/users/:userId/accounts/:accountId` and a list route under `/api/v1/users`.

**Constraints:** Use path params for IDs and query params for pagination and filtering. Keep route order intentional.

**Acceptance criteria:** IDs are correctly extracted, nested params are visible where needed, and query params do not confuse the path contract.

## Summary

- Routes map HTTP method and path to handlers.
- Path params identify resources; query params describe selection or pagination.
- Router modules improve structure and can be nested under a mount path.
- Route precedence and path semantics matter in production APIs.

## Cheat Sheet

| Concern | Use |
|---|---|
| Resource identity | path param like `/users/:id` |
| Filtering/pagination | query string like `?page=2&limit=50` |
| Nested routes | `express.Router()` |
| Parent params in child routes | `mergeParams: true` |
| Matching | method + path pattern + order |

## Interview Questions

1. **Definition:** What is the difference between `req.params` and `req.query`?
   - **Expected answer:** `params` are named components of a route path; `query` is the parsed URL search string.
   - **Follow-up:** Which should represent a user ID and which a filter?

2. **Trace:** A route with `/users/:id` and `/users/me` is defined in a particular order. What happens when a request hits `/users/me`?
   - **Expected answer:** The answer depends on route order and whether the specific route is registered before a broader param route.
   - **Follow-up:** What would you do to make behavior intentional?

3. **Implementation:** Build a nested router where parent and child params need to be visible.
   - **Expected answer:** Use subrouters and `mergeParams` or pass the parent param explicitly.
   - **Follow-up:** Why avoid hiding parent IDs in a nested route?

4. **Design:** When should you prefer a list route with query filters over a more complex path structure?
   - **Expected answer:** When the request is selection, sorting, liming, or pagination rather than identity.
   - **Follow-up:** What makes a contract easier to cache or reason about?

<nav aria-label="Lecture navigation">

[Previous: Express Middleware and Request Flow](day-14-express-middleware-and-request-flow.md) | [Roadmap](../node-roadmap.md) | [Next: Express Input Parsing, Validation, and Serialization](day-16-express-input-validation-and-serialization.md)

</nav>