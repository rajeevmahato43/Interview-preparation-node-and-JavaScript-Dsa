# Day 3: Express APIs and Security

## Application and request flow

**1. App structure**

Separate app creation from listening so tests can construct routes without binding a port.

```js
const app = createApp({ userService }); // testable without app.listen()
```

**2. Middleware**

Runs in registration order; it may enrich the request, end the response, call `next()`, or forward an error.

**3. Routing**

Route parameters identify path resources; query/body values are untrusted and need parsing and validation.

**4. Validation and serialization**

Check shape, size, and allowed fields at the boundary; return explicit DTOs while domain logic enforces business invariants.

[App](../../Node/node-lectures/day-13-express-application-structure.md) | [Middleware](../../Node/node-lectures/day-14-express-middleware-and-request-flow.md) | [Routing](../../Node/node-lectures/day-15-express-routing-and-route-parameters.md) | [Validation](../../Node/node-lectures/day-16-express-input-validation-and-serialization.md)

## Errors and API contracts

**1. Async errors**

Forward rejected route work to centralized error middleware; automatic forwarding differs between Express 4 and 5.

**2. API contracts and pagination**

Choose stable status/response shapes; cursor pagination uses a stable ordering and avoids scanning deep offsets in many workloads.

**3. Idempotency**

An idempotency key can return a prior mutation result rather than apply a second side effect on retry.

```text
same key + same request -> replay saved result
same key + different request -> reject conflict
```

[Errors](../../Node/node-lectures/day-17-async-express-and-centralized-errors.md) | [Contracts](../../Node/node-lectures/day-18-api-contracts-pagination-and-idempotency.md)

## Identity and security

**1. Authentication and authorization**

Authentication establishes identity; authorization checks permission for a specific action/resource.

```text
valid token does not imply access to every /users/:id
```

**2. Web security**

Use secure session/token handling, rate/body limits, safe errors, and context-aware output handling; CORS is not authorization.

**3. HTTP testing**

Test routes and security boundaries, including invalid input, forbidden access, and dependency failures.

[Auth](../../Node/node-lectures/day-19-authentication-and-authorization-boundaries.md) | [Security and HTTP tests](../../Node/node-lectures/day-20-express-security-and-http-testing.md)

## Tricky points

1. **Request pipeline**

**1.1 Order**

Register parsing before handlers that read parsed data; a response-ending middleware should not continue the chain.

**1.2 `next`**

Calling `next()` twice or responding and then continuing can trigger duplicate handling or headers-sent errors.

**1.3 Async route errors**

Verify Express major version; a started but unreturned promise can escape error middleware.

2. **Contracts and identity**

**2.1 Input types**

Query values are commonly strings and may be repeated/arrays; validate before numeric comparisons.

**2.2 Authentication is not authorization**

A valid token does not grant access to every resource ID.

**2.3 CORS**

Browser access policy does not stop direct API clients.

**2.4 Idempotency**

A timeout does not prove a write failed; store key/result with the effect where possible.