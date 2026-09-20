# Day 16: Express Input Parsing, Validation, and Serialization

<nav aria-label="Lecture navigation">

[Previous: Express Routing and Route Parameters](day-15-express-routing-and-route-parameters.md) | [Roadmap](../node-roadmap.md) | [Next: Async Express and Centralized Errors](day-17-async-express-and-centralized-errors.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Parse JSON, URL-encoded, and multipart request inputs safely.
- Explain why validation is distinct from parsing.
- Sanitize and normalize untrusted data before using it in business logic.
- Serialize a response in a way that preserves API contracts without exposing internals.

## Prerequisites

- [Day 06: Buffers, Encodings, and Serialization](day-06-buffers-encodings-and-serialization.md)
- [Day 09: Node HTTP Fundamentals](day-09-node-http-fundamentals.md)
- [Day 15: Express Routing and Route Parameters](day-15-express-routing-and-route-parameters.md)

## Core Concepts

### 1. Parsing and validation are different steps

A parser converts bytes into a JavaScript structure. A validator checks whether the structure is acceptable for the business operation.

```js
app.use(express.json({ limit: "1mb" }));
```

This makes JSON available on `req.body`, but it does not guarantee that the data is valid or safe.

### 2. Body limits matter

A server should reject oversized or malformed payloads early. Without limits, a malicious or accidental client can consume memory or slow the service.

```js
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
```

The exact limit depends on the product and expected payload size.

### 3. Validate inputs, then normalize

A good API can accept flexible input but normalize it to a strict internal format. For example, string trimming, integer coercion, and known field whitelists.

```js
function normalizeUserInput(body) {
  return {
    email: String(body.email || "").trim().toLowerCase(),
    age: Number.parseInt(body.age, 10),
    role: body.role === "admin" ? "admin" : "user",
  };
}
```

This still requires checks for invalid values and missing fields.

### 4. Serialization is part of the API contract

HTTP response bodies are not just raw objects. They should match the contract the client expects and avoid leaking database internals or secrets.

```js
const response = {
  id: user.id,
  email: user.email,
  role: user.role,
};
```

Do not return full `user` objects with password hashes, internal flags, or connection details.

## Detailed Explanations and Traces

### JSON request flow

```js
app.use(express.json({ limit: "1mb" }));

app.post("/users", (req, res) => {
  const { email, age } = req.body;

  if (typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "invalid email" });
  }

  const numericAge = Number.parseInt(age, 10);
  if (!Number.isInteger(numericAge) || numericAge < 0) {
    return res.status(400).json({ error: "invalid age" });
  }

  res.status(201).json({ email, age: numericAge });
});
```

The parser converts JSON text into an object. Validation then decides if the object is acceptable.

### Why unknown fields matter

Suppose a client sends `"admin": true` in a create-user request. If you trust the object blindly, you may accidentally create a privileged user. A validated input contract should allow only expected fields, with an explicit allowlist.

### Safe response serialization

```js
function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  };
}
```

This pattern keeps the API stable even if internal fields change later.

## Common Mistakes and Interview Traps

- Calling validation after a database write.
- Trusting `req.body` without checking type and allowed keys.
- Returning raw database rows with secrets or metadata.
- Setting huge body limits because it seems convenient.
- Not differentiating parsing failures from validation errors.

## Tricky Points

- JSON parsing is not validation. A valid JSON object can still be invalid business input.
- Content-type mismatches matter; a request may not have a body parsed the way you expect.
- `express.json()` only handles JSON; it does not magically sanitize nested objects.

## Practical Exercise

**Goal:** Build a create-user endpoint with parsing, validation, normalization, and serialization.

**Inputs and outputs:** Accept JSON for email, age, and role, validate them, and return a public user object.

**Constraints:** Reject unknown fields, reject invalid age and email, and protect response output from internal secrets.

**Acceptance criteria:** Invalid body values return 400, valid values return a cleaned public representation, and no internal secrets are returned.

## Summary

- Parsing, validation, normalization, and serialization are distinct responsibilities.
- Servers should reject oversized and malformed inputs early.
- Trust boundaries are real: client input is not safe by default.
- API responses should be shaped deliberately, not by returning internal data blindly.

## Cheat Sheet

| Concern | Best practice |
|---|---|
| JSON body | `express.json({ limit: ... })` |
| URL form body | `express.urlencoded()` |
| Validation | check type, presence, range, allowed keys |
| Normalization | trim, coerce, lowercase, whitelist |
| Response | serialize a public contract only |

## Interview Questions

1. **Definition:** What is the difference between parsing and validation?
   - **Expected answer:** Parsing turns bytes into a structure; validation decides whether the structure satisfies the contract.
   - **Follow-up:** Can a JSON document be valid but still invalid for the application?

2. **Debugging:** A request with a very large body causes memory pressure. What should the service do?
   - **Expected answer:** Reject with a strict limit, set a cap, and handle rejection cleanly.
   - **Follow-up:** Why does this protect both the service and the user?

3. **Implementation:** Write a validator that rejects missing email, invalid age, and malicious extra fields.
   - **Expected answer:** Use allowlists, type checks, and explicit conversion.
   - **Follow-up:** What is the difference between coercion and validation?

4. **Design tradeoff:** Should you trust the client to send only the fields you expect?
   - **Expected answer:** No. Always validate expected fields and reject unknown or malformed data.
   - **Follow-up:** Why is this especially important for auth and role fields?

<nav aria-label="Lecture navigation">

[Previous: Express Routing and Route Parameters](day-15-express-routing-and-route-parameters.md) | [Roadmap](../node-roadmap.md) | [Next: Async Express and Centralized Errors](day-17-async-express-and-centralized-errors.md)

</nav>