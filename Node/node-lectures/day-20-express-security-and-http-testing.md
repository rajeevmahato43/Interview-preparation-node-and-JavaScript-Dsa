# Day 20: Express Security and HTTP Testing

<nav aria-label="Lecture navigation">

[Previous: Authentication and Authorization Boundaries](day-19-authentication-and-authorization-boundaries.md) | [Roadmap](../node-roadmap.md) | [Next: MongoDB Driver Lifecycle and BSON](day-21-mongodb-driver-lifecycle-and-bson.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain how security controls and HTTP tests fit into the Express boundary.
- Apply CORS, security headers, request limits, and rate limiting without breaking legitimate traffic.
- Test the success and failure paths for a public API with integration-level checks.
- Separate application correctness from transport-level protections.

## Prerequisites

- [Day 14: Express Middleware and Request Flow](day-14-express-middleware-and-request-flow.md)
- [Day 16: Express Input Parsing, Validation, and Serialization](day-16-express-input-validation-and-serialization.md)
- [Day 19: Authentication and Authorization Boundaries](day-19-authentication-and-authorization-boundaries.md)

## Core Concepts

### 1. The HTTP boundary is a trust boundary

Express runs at the edge of the application. It receives browser, mobile, proxy, and internal client requests. A route should enforce transport safety, but the server must not assume the client is trustworthy.

### 2. Common controls

- CORS restricts which origins can call the API.
- Security headers help reduce browser-side risk.
- Body size limits prevent denial-of-service by oversized requests.
- Rate limiting prevents abuse and protects downstream dependencies.
- Request IDs and redacted logs make debugging and incident response easier.

### 3. HTTP testing should cover real behavior

Tests for an API should validate actual HTTP status codes, response bodies, and boundary behaviors. A pure unit test can verify a validator, but an HTTP integration test proves the route pipeline behaves correctly.

```js
const request = require("supertest");
const { createApp } = require("../src/app");

test("GET /health returns ok", async () => {
  const app = createApp({ logger: { info() {} } });
  const response = await request(app).get("/health");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { ok: true });
});
```

## Detailed Explanations and Traces

### CORS and cross-origin risk

CORS is a browser-enforced policy. It is not a substitute for authentication or authorization. A server may allow a specific origin, but still reject requests after establishing identity.

### Rate limiting and abuse prevention

A token bucket or fixed window limiter should sit near the edge to keep repeated calls from overwhelming downstream services. Rate limits should degrade gracefully and return actionable errors, not a vague crash.

### Security headers

Headers such as `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, and `X-Frame-Options` reduce browser-facing risk. Their value depends on the layer and use case; they are not a replacement for server validation.

## Common Mistakes and Interview Traps

- Treating CORS as security.
- Relying only on frontend checks.
- Logging raw tokens or secrets.
- Not testing invalid authorization and rate-limit responses.
- Using one huge middleware chain without clear responsibility boundaries.

## Tricky Points

- A rate limit should protect the service, but internal queue and database limits matter too.
- A middleware chain can block attack traffic early, but it does not fix business logic bugs.
- Security best practices are part of an end-to-end API contract.

## Practical Exercise

**Goal:** Add security and HTTP integration tests for a small API.

**Inputs and outputs:** Test successful requests, invalid auth, validation errors, and rate-limited requests.

**Constraints:** Keep routes separate from startup and use a small app factory for testability.

**Acceptance criteria:** Tests prove the expected status codes and body shapes for each scenario.

## Summary

- The HTTP boundary is a trust boundary and needs explicit protections.
- Security headers, CORS, limits, and logs help, but they do not replace authorization.
- HTTP tests should verify route behavior rather than only library-level helpers.

## Cheat Sheet

| Concern | Practice |
|---|---|
| CORS | allow only required origins |
| Security headers | add minimal browser protections |
| Rate limits | protect the edge and downstream services |
| Logs | redact tokens and high-cardinality payloads |
| Tests | verify status codes and contract responses |

## Interview Questions

1. **Definition:** Why is the Express layer a trust boundary?
   - **Expected answer:** Requests come from clients, proxies, and browsers, so the server must validate before trusting them.
   - **Follow-up:** What is the difference between CORS and auth?

2. **Debugging:** An API continues to receive abuse despite a frontend rate-limiter. Where should the fix be?
   - **Expected answer:** At the server edge, with real request throttling and backed by API-level metrics.
   - **Follow-up:** Why is a frontend limit insufficient?

3. **Implementation:** Write a test suite for a route that includes validation, auth, and a success path.
   - **Expected answer:** Cover status codes, request payloads, and body contracts for each scenario.
   - **Follow-up:** How do you keep tests deterministic?

4. **Design:** What is the minimum security posture for an internal API with no public browser clients?
   - **Expected answer:** Still validate input, enforce identity and authorization, set safe headers, and control access at the network boundary.
   - **Follow-up:** Which checks are still required even for trusted internal traffic?

<nav aria-label="Lecture navigation">

[Previous: Authentication and Authorization Boundaries](day-19-authentication-and-authorization-boundaries.md) | [Roadmap](../node-roadmap.md) | [Next: MongoDB Driver Lifecycle and BSON](day-21-mongodb-driver-lifecycle-and-bson.md)

</nav>