# Day 18: API Contracts, Pagination, and Idempotency

<nav aria-label="Lecture navigation">

[Previous: Async Express and Centralized Errors](day-17-async-express-and-centralized-errors.md) | [Roadmap](../node-roadmap.md) | [Next: Authentication and Authorization Boundaries](day-19-authentication-and-authorization-boundaries.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Define a stable API contract for list and create operations.
- Choose between cursor and offset pagination.
- Explain why idempotency matters for repeated requests.
- Separate resilient client behavior from server-side correctness.

## Prerequisites

- [Day 15: Express Routing and Route Parameters](day-15-express-routing-and-route-parameters.md)
- [Day 17: Async Express and Centralized Errors](day-17-async-express-and-centralized-errors.md)
- JavaScript lectures on object shape and validation

A backend API contract is not only the route path. It includes status codes, payload shape, ordering, pagination semantics, retry behavior, and error expectations.

## Core Concepts

### 1. Stable API contracts matter

A route must define expected responses for success and failure. For example:

```json
GET /users?page=2&limit=20

{
  "items": [{"id": 21, "email": "a@test.com"}],
  "page": 2,
  "limit": 20,
  "hasMore": true
}
```

This contract is easy for clients to reason about and easier to change deliberately.

### 2. Offset vs cursor pagination

Offset pagination uses page number and size. It is easy but can become costly and unstable with concurrent inserts or deletes.

```text
GET /users?page=2&limit=20
```

Cursor pagination uses an opaque token or sort-based next cursor. It is more resilient for large or changing datasets.

```text
GET /users?cursor=eyJza2lwIjoyMH0
```

Cursor pagination often scales better when the dataset changes often, but adds complexity to the contract.

### 3. Idempotency is a correctness tool

The same request may be repeated because of network retries or user double clicks. An idempotent operation keeps the final state consistent even if the same request is executed more than once.

- `GET` is naturally idempotent.
- `PUT` usually is idempotent when the client sends the same target state.
- `DELETE` can be idempotent if repeated deletion is harmless.
- `POST` is not naturally idempotent unless you add an idempotency key or deduplicate server-side.

### 4. Stable ordering is part of the contract

If the API returns a list, the ordering should be explicit and stable enough for pagination. Without a deterministic sort, `page=2` can oscillate as new records arrive.

## Detailed Explanations and Traces

### A retry-safe create operation

```js
app.post("/orders", async (req, res, next) => {
  const idempotencyKey = req.headers["idempotency-key"];
  const order = await orderService.create({ ...req.body, idempotencyKey });
  res.status(201).json(order);
});
```

This is common when clients retry a `POST` after a timeout. Without an idempotency key, the server may create duplicate orders.

### Pagination tradeoff

Offset pagination:

- simple to implement
- works well for small/medium datasets
- can skip or duplicate rows when data changes
- may become slow at high offsets

Cursor pagination:

- better for large and dynamic lists
- stable if keyed by a sortable field and consistent order
- requires careful contract and index support

## Common Mistakes and Interview Traps

- Returning unstable ordering in list endpoints.
- Using `POST` for operations that should be idempotent or at least deduplicated.
- Ignoring duplicate client requests after a timeout.
- Mixing path identity with collection filters in one route.

## Tricky Points

- A route can be technically successful and still not be idempotent.
- Pagination is a contract decision, not just a SQL detail.
- A stable ordering key is often more important than the page number itself.

## Practical Exercise

**Goal:** Design a paginated resource list and a retry-safe create operation.

**Inputs and outputs:** Accept filter and cursor inputs for a list route and an idempotency key for create.

**Constraints:** Use a deterministic order and explicit pagination semantics.

**Acceptance criteria:** Repeated create requests with the same idempotency key do not create duplicates, and list ordering stays stable across requests.

## Summary

- API contracts should declare status codes, payload shape, and pagination semantics.
- Offset and cursor patterns each have tradeoffs.
- Idempotency is crucial when clients may retry requests.
- Stable ordering prevents surprising pagination behavior.

## Cheat Sheet

| Concern | Decision guide |
|---|---|
| Resource identity | path param |
| Filter and paging | query params |
| Large dynamic lists | cursor pagination |
| Retry-safe writes | idempotency key or PUT semantics |
| Stable results | deterministic ordering |

## Interview Questions

1. **Definition:** What makes a request idempotent?
   - **Expected answer:** Repeating it does not produce a different state or creates a deduplicated result.
   - **Follow-up:** Which HTTP methods are naturally idempotent and why?

2. **Design:** Design a list endpoint for a large changing dataset.
   - **Expected answer:** Explain cursor vs offset, stable ordering, and how the contract prevents unstable pages.
   - **Follow-up:** What happens if you paginate without a stable sort key?

3. **Implementation:** Add an idempotency key to a `POST /payments` endpoint.
   - **Expected answer:** Deduplicate repeated requests and return the original created result when the key matches.
   - **Follow-up:** What if the original request is still in progress?

4. **Engineering judgment:** A client retries a request after a timeout. Should the server always retry the downstream write?
   - **Expected answer:** No. Retrying blindly may duplicate side effects. Use idempotency keys or safe operation design.
   - **Follow-up:** What if the operation is not naturally idempotent?

<nav aria-label="Lecture navigation">

[Previous: Async Express and Centralized Errors](day-17-async-express-and-centralized-errors.md) | [Roadmap](../node-roadmap.md) | [Next: Authentication and Authorization Boundaries](day-19-authentication-and-authorization-boundaries.md)

</nav>