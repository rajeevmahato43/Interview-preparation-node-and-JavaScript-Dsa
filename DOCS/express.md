# Express Domain Instructions

Teach Express as an HTTP application framework whose behavior emerges from routing, middleware ordering, request state, and error propagation.

## Required scope

Cover application structure, routers, middleware order, request and response lifecycle, route parameters, validation, serialization, async handlers, error middleware, authentication and authorization boundaries, input limits, CORS, security headers, logging, testing, graceful failure, and production organization.

## Teaching requirements

- Trace a request through middleware, route matching, handler execution, response completion, and error handling.
- Explain ordering and control transfer, including `next`, short-circuit responses, and async failures.
- Separate transport concerns from domain logic, persistence, validation, and configuration.
- Discuss status codes, idempotency, timeouts, rate limits, observability, and safe error responses.
- Label behavior that depends on the Express major version or surrounding middleware.

## Boundaries

Use [node.md](node.md) for runtime and HTTP primitives, [javascript.md](javascript.md) for language semantics, and [mongodb.md](mongodb.md) or [postgresql.md](postgresql.md) for persistence. Do not present authentication, validation, or database access as Express features when they are provided by separate libraries or application layers.