# Day 16: Express Input Validation and Serialization

<nav aria-label="Lecture navigation">

[← Previous: Express Routing and Route Parameters](day-15-express-routing-and-route-parameters.md) | [Roadmap](../node-roadmap.md) | [Next: Async Express and Centralized Errors](day-17-async-express-and-centralized-errors.md)

</nav>

## Prerequisites

Before diving into validation and serialization, review:
- [Day 06: Buffers, Encodings, and Serialization](day-06-buffers-encodings-and-serialization.md) for JSON payload limits and UTF-8 encoding traps.
- [Day 09: Node HTTP Fundamentals](day-09-node-http-fundamentals.md) for HTTP request streaming and bounded body ingestion.
- [Day 14: Express Middleware and Request Flow](day-14-express-middleware-and-request-flow.md) for middleware traversal and short-circuiting.
---

## Core Concepts

### 1. The Four Pillars of the Data Perimeter

An enterprise API boundary enforces four distinct operations in strict sequence:

```text
[Incoming Wire Bytes]
         │
         ▼
1. PARSING           ──► Decodes raw Buffer to JavaScript object (express.json)
         │
         ▼
2. VALIDATION        ──► Asserts types, regex, presence, and bounds (Zod / Joi)
         │
         ▼
3. NORMALIZATION     ──► Trims whitespace, lowercases emails, casts integers
         │
         ▼
[Domain Processing]  ──► Core Service execution on sanitized DTO
         │
         ▼
4. SERIALIZATION     ──► Projects domain entity into explicit public response DTO
         │
         ▼
[Outgoing Wire Bytes]
```

| Phase | Responsibility | Failure Outcome | Typical Code / Library |
| :--- | :--- | :--- | :--- |
| **Parsing** | Converts raw binary stream to JS object | HTTP 400 Bad Request (SyntaxError) | `express.json({ limit: '100kb' })` |
| **Validation** | Enforces business contracts and invariants | HTTP 422 Unprocessable Entity | Zod (`schema.parse()`), TypeBox |
| **Normalization** | Coerces values to canonical internal format | N/A (Transforms data) | `.trim()`, `.toLowerCase()`, `.strip()` |
| **Serialization** | Filters and formats outbound response JSON | N/A (Guarantees safety) | `toPublicUserDTO(user)`, `fast-json-stringify` |

---

### 2. Body Parser Limits and Malformed JSON Handling

By default, Node's `express.json()` parses inbound JSON payloads. In production, unconfigured parsers expose applications to denial-of-service attacks:

1. **Unbounded Payload Size**: A malicious client can stream a 100MB JSON payload, exhausting V8 heap memory. Always set an explicit byte limit: `express.json({ limit: '100kb' })`.
2. **`strict: true`**: When enabled, the parser only accepts arrays and objects (conforming to RFC 7159), rejecting raw primitives like strings or numbers as root values.
3. **Malformed JSON SyntaxError**: When a client sends malformed JSON (e.g. `{ name: "Alice", `), `express.json()` throws a `SyntaxError` with status `400` and `type: 'entity.parse.failed'`. If not intercepted by custom error middleware, Express prints an ugly raw stack trace to the client.

```js
// Custom interceptor for body-parser syntax errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Malformed JSON payload',
      details: err.message
    });
  }
  next(err);
});
```

---

### 3. Critical Security Hazards: Mass Assignment & Parameter Pollution

> **Parameter Pollution (HPP)**: Supplying duplicate keys in a query string (`?id=1&id=2`), converting a string into an array (`['1', '2']`).

> **Mass Assignment**: An exploit where an attacker passes unexpected attributes in a request body that are blindly persisted to the database.

#### Hazard A: Mass Assignment
Mass assignment occurs when client input is passed directly to database models without allowlisting:

```text
Attacker Request Body:
{ "email": "attacker@evil.com", "role": "admin", "isVerified": true }

Vulnerable Code:
await User.create(req.body); // Directly persists role: "admin"!
```
**Defense**: Always enforce strict schema stripping or map explicit properties into domain DTOs before persistence.

#### Hazard B: HTTP Parameter Pollution (HPP)
When a query parameter is specified multiple times in a URL:
```text
GET /search?tag=javascript&tag=node
```
Express's query parser parses `req.query.tag` as an Array: `['javascript', 'node']`. If your application code expects a string:
```js
// ❌ CRASH: TypeError: req.query.tag.trim is not a function!
const sanitized = req.query.tag.trim();
```
An attacker can intentionally submit duplicate query parameters to crash server handlers or bypass SQL filters.

---

### 4. Schema-Driven Validation Architecture (Zod / TypeBox)

> **Validation**: Verifying that a structured object conforms to expected domain types, constraints, ranges, and invariants.

Handwritten `if (!req.body.email) ...` validation logic is error-prone, verbose, and difficult to keep synchronized with API documentation.

Modern architectures use schema validation libraries (such as **Zod**) to parse and validate input simultaneously:
- **`z.string().email()`**: Enforces string type and email structure.
- **`z.coerce.number()`**: Safely coerces URL string parameters into numbers.
- **`.strip()`**: Automatically drops undeclared keys, neutralizing Mass Assignment.
- **`.strict()`**: Throws a validation error if unexpected keys are detected.

```text
Incoming Request -> validateRequest(UserSchema) -> Validated & Sanitized Data -> Controller
                         │
                         └── Validation Fails? ──► HTTP 422 with structured field errors
```

---

### 5. Outbound Response Serialization (DTO Mappers)

A database entity should **never** be passed directly to `res.json()`. Database rows routinely contain sensitive or internal attributes:
- `password_hash`, `salt`, `reset_token`, `mfa_secret`
- Internal billing status, fraud risk scores, soft-delete flags (`deleted_at`)
- Database primary keys that leak enumeration sequences

#### Projection Mappers:
Create explicit serializer functions that construct a new object containing only public fields:
```js
export function toPublicUserDTO(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString()
  };
}
```

---

## Code Snippets and Demonstrations

### 1. Robust Schema Validation Middleware with Zod

Building a generic, type-safe middleware that validates `body`, `query`, and `params` against Zod schemas.

```js
// Node.js code
// filename: validate-request.mjs

/**
 * Higher-order middleware factory that validates request segments against Zod schemas.
 */
export function validateRequest(schemas = {}) {
  return async (req, res, next) => {
    try {
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      // If validation error from Zod
      if (error.errors && Array.isArray(error.errors)) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          rule: err.code
        }));

        return res.status(422).json({
          error: 'Validation Failed',
          details: formattedErrors
        });
      }

      next(error);
    }
  };
}
```

---

### 2. Guarding Against HTTP Parameter Pollution (HPP)

Implementing an HPP protection middleware that flattens duplicated query parameters into single strings.

```js
// Node.js code
// filename: hpp-guard.mjs

/**
 * Middleware that protects against HTTP Parameter Pollution.
 * Flattens array parameters into their first or last scalar value unless allowlisted.
 */
export function hppGuard(options = {}) {
  const allowlist = new Set(options.allowlist || []);

  return (req, res, next) => {
    if (req.query && typeof req.query === 'object') {
      for (const [key, value] of Object.entries(req.query)) {
        if (Array.isArray(value)) {
          if (!allowlist.has(key)) {
            // Disallowed array: Take only the last scalar value to prevent pollution
            req.query[key] = value[value.length - 1];
          }
        }
      }
    }
    next();
  };
}
```

---

### 3. Outbound DTO Serialization and Sensitive Field Masking

> **Outbound DTO**: A Data Transfer Object explicitly defining the public contract of an HTTP response, isolating public fields from internal database models.

Demonstrating how to serialize domain entities safely and prevent information leakage.

```js
// Node.js code
// filename: user-serializer.mjs

export class UserSerializer {
  /**
   * Projects a raw database user record into a safe, client-facing DTO.
   */
  static toPublic(user) {
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      verified: Boolean(user.is_verified),
      createdAt: user.created_at ? new Date(user.created_at).toISOString() : null
      // Explicitly EXCLUDES:
      // password_hash, salt, reset_token, internal_risk_score, stripe_customer_id
    };
  }

  /**
   * Serializes a collection of users.
   */
  static toPublicCollection(users) {
    return users.map(user => UserSerializer.toPublic(user));
  }
}
```

---

### 4. Complete Secure Endpoint Assembly

Integrating parsing limits, HPP protection, schema validation, and outbound DTO mapping into an Express application.

```js
// Node.js code
// filename: secure-app.mjs
import express from 'express';
import { z } from 'zod';
import { validateRequest } from './validate-request.mjs';
import { hppGuard } from './hpp-guard.mjs';
import { UserSerializer } from './user-serializer.mjs';

// Schemas
const CreateUserSchema = {
  body: z.object({
    email: z.string().email().transform(e => e.trim().toLowerCase()),
    name: z.string().min(2).max(50).transform(n => n.trim()),
    age: z.coerce.number().int().min(18).max(120)
  }).strict() // Rejects unknown fields!
};

const QueryUsersSchema = {
  query: z.object({
    role: z.enum(['member', 'admin']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
};

export function createSecureApp(db) {
  const app = express();

  // 1. Strict parser with byte limits
  app.use(express.json({ limit: '50kb', strict: true }));

  // 2. Intercept body parser syntax errors
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({ error: 'Invalid JSON payload syntax' });
    }
    next(err);
  });

  // 3. HTTP Parameter Pollution Guard
  app.use(hppGuard({ allowlist: ['filter'] }));

  // 4. Secure POST /users
  app.post('/api/users', validateRequest(CreateUserSchema), async (req, res, next) => {
    try {
      // req.body is already validated, normalized, and stripped of extra fields
      const newUser = await db.insertUser({
        ...req.body,
        password_hash: 'secret_hash_value',
        internal_risk_score: 0.12
      });

      // Serialize outbound DTO
      res.status(201).json({ data: UserSerializer.toPublic(newUser) });
    } catch (err) {
      next(err);
    }
  });

  // 5. Secure GET /users
  app.get('/api/users', validateRequest(QueryUsersSchema), async (req, res, next) => {
    try {
      const { role, page, limit } = req.query;
      const users = await db.findUsers({ role, page, limit });
      res.json({
        data: UserSerializer.toPublicCollection(users),
        pagination: { page, limit }
      });
    } catch (err) {
      next(err);
    }
  });

  return app;
}
```

---

## Edge Cases and Tricky Scenarios

### 1. Prototype Pollution via URL-Encoded Extended Parsers

When configuring URL-encoded body parsing, Express allows choosing between `extended: false` (uses Node's native `querystring`) and `extended: true` (uses the `qs` library):

```js
// Node.js code
// ⚠️ CAUTION: extended: true parses rich nested objects
app.use(express.urlencoded({ extended: true }));
```
- **The Risk**: Older versions of `qs` allowed malicious payloads like `__proto__[isAdmin]=true` or `constructor[prototype][isAdmin]=true` to pollute the global `Object.prototype`, injecting properties across all objects in the Node.js runtime.
- **The Defense**: Always use the latest patch versions of body parsers, prefer `extended: false` when rich nested forms are not strictly required, and validate all inputs with strict schema validators that discard or reject prototype properties.

### 2. Silent Type Coercion Bugs in Query Strings

All parameters in `req.query` arrive from the URL as raw strings:
- Client calls: `GET /items?isActive=false`
- In JavaScript: `Boolean("false") === true`!
- **The Bug**: If an author writes `const isActive = Boolean(req.query.isActive)`, the variable evaluates to `true` because `"false"` is a non-empty string!
- **The Solution**: Use explicit schema parsers (like Zod's `z.enum(['true', 'false']).transform(v => v === 'true')`) instead of naive native `Boolean()` casting.

---

## Node.js, JavaScript, and Systems Connections

```text
┌──────────────────────────────────────────────────────────────┐
│ V8 Heap & Native Garbage Collection                          │
│ - express.json({ limit: '50kb' }) bounds Buffer allocation   │
│ - Object allocation churn during recursive schema parsing    │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Express Processing Pipeline                                  │
│ - Body Parser (Stream consumer, emits SyntaxError on failure)│
│ - HPP Guard (Protects query dictionary types)                │
│ - Schema Validation Layer (Zod parseAsync)                   │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Outbound Serialization Boundary                              │
│ - Projection Mapping (DTO transforms, hides password_hash)   │
│ - JSON.stringify() stream formatting                         │
└──────────────────────────────────────────────────────────────┘
```

- **V8 Heap Memory**: Setting low payload limits (`50kb`) prevents untrusted users from buffering multi-megabyte payloads in RAM, avoiding V8 heap exhaustion and garbage collection thrashing.
- **JavaScript Truthiness**: Query string values are always strings; understanding JavaScript's truthiness rules prevents severe authorization and filtering bypass bugs.

---

## Hands-On Exercise

### Scenario
A healthcare appointment booking API allows patients to register and book slots. In production:
1. Attackers are escalating privileges by sending `"role": "admin"` in the registration body (Mass Assignment).
2. The registration endpoint crashes with an unhandled exception when clients send malformed JSON syntax.
3. The API accidentally leaks patients' internal `ssn_hash` and `insurance_policy_key` in the registration response.
4. An attacker submits duplicate query parameters (`?status=open&status=closed`), crashing the appointments search endpoint with `TypeError: status.toLowerCase is not a function`.

### Buggy Code

```js
// Node.js code
// filename: buggy-patient-api.mjs
const express = require('express');
const app = express();

app.use(express.json()); // No byte limit!

const db = {
  users: [],
  appointments: [{ id: 1, status: 'open' }]
};

// ❌ BUG 1 & 3: Mass Assignment allows 'role: admin'; leaks ssn_hash in response!
app.post('/patients', (req, res) => {
  const patient = {
    id: db.users.length + 1,
    ...req.body, // Directly spreads untrusted req.body!
    ssn_hash: 'secret_ssn_hash_999'
  };
  db.users.push(patient);
  res.status(201).json(patient); // Returns entire record including secrets!
});

// ❌ BUG 4: HTTP Parameter Pollution crashes handler when status is an Array!
app.get('/appointments', (req, res) => {
  const status = req.query.status;
  // If ?status=open&status=closed, status is ['open', 'closed'] -> TypeError!
  const filtered = db.appointments.filter(a => a.status === status.toLowerCase());
  res.json(filtered);
});

module.exports = app;
```

### Acceptance Criteria
1. Add strict body parsing with a 25KB limit and custom handling for malformed JSON syntax errors.
2. Implement schema validation that allows only `name` and `email`, rejecting or stripping unexpected fields like `role`.
3. Protect the appointments search route against HTTP Parameter Pollution, ensuring `status` is safely treated as a scalar string.
4. Implement an outbound DTO serializer that strips `ssn_hash` and internal metadata from responses.
5. Provide a test suite using `node:test` verifying that Mass Assignment is blocked, malformed JSON returns a 400 error, and sensitive hashes are never leaked.

### Solution Code

```js
// Node.js code
// filename: solution-patient-api.mjs
import express from 'express';

// 1. Outbound Serializer
export function toPublicPatientDTO(patient) {
  return {
    id: patient.id,
    name: patient.name,
    email: patient.email
    // ssn_hash is strictly omitted
  };
}

export function createFixedPatientApp() {
  const app = express();

  // Strict 25kb body limit
  app.use(express.json({ limit: '25kb', strict: true }));

  // Intercept malformed JSON
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({ error: 'Malformed JSON syntax' });
    }
    next(err);
  });

  const db = {
    users: [],
    appointments: [{ id: 1, status: 'open' }]
  };

  // POST /patients with strict allowlisting
  app.post('/patients', (req, res) => {
    const { name, email } = req.body || {};

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(422).json({ error: 'Invalid name provided' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(422).json({ error: 'Invalid email provided' });
    }

    // Normalization & Mass Assignment Defense: Construct new object with ONLY expected fields
    const newPatient = {
      id: db.users.length + 1,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'patient', // Force default role; ignores any injected req.body.role!
      ssn_hash: 'secret_ssn_hash_999'
    };

    db.users.push(newPatient);

    // Outbound serialization
    res.status(201).json({ data: toPublicPatientDTO(newPatient) });
  });

  // GET /appointments with HPP protection
  app.get('/appointments', (req, res) => {
    let rawStatus = req.query.status;

    // Defend against HPP: If array, take the last scalar value
    if (Array.isArray(rawStatus)) {
      rawStatus = rawStatus[rawStatus.length - 1];
    }

    if (!rawStatus || typeof rawStatus !== 'string') {
      return res.json(db.appointments);
    }

    const normalizedStatus = rawStatus.trim().toLowerCase();
    const filtered = db.appointments.filter(a => a.status === normalizedStatus);
    res.json({ data: filtered });
  });

  return app;
}
```

Accompanying test suite:
```js
// Node.js code
// filename: solution-patient-api.test.mjs
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createFixedPatientApp } from './solution-patient-api.mjs';

describe('Patient API Validation and Security Tests', () => {
  it('blocks mass assignment and hides internal secrets in response', async () => {
    const app = createFixedPatientApp();
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Doe',
          email: 'jane@example.com',
          role: 'admin' // Attempted mass assignment!
        })
      });

      assert.equal(res.status, 201);
      const body = await res.json();

      // Verify mass assignment was neutralized
      assert.equal(body.data.name, 'Jane Doe');
      assert.equal(body.data.role, undefined); // role is NOT returned
      assert.equal(body.data.ssn_hash, undefined); // secret ssn_hash is NOT leaked
    } finally {
      server.close();
    }
  });

  it('handles HTTP parameter pollution without crashing', async () => {
    const app = createFixedPatientApp();
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      // Send duplicate status params: ?status=closed&status=open
      const res = await fetch(`http://127.0.0.1:${port}/appointments?status=closed&status=open`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.data.length, 1);
      assert.equal(body.data[0].status, 'open');
    } finally {
      server.close();
    }
  });

  it('returns clean 400 on malformed JSON payload', async () => {
    const app = createFixedPatientApp();
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"name": "Broken JSON, ' // Malformed
      });

      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.error, 'Malformed JSON syntax');
    } finally {
      server.close();
    }
  });
});
```

### Solution Explanation
1. **Neutralized Mass Assignment**: The handler explicitly constructs `newPatient` by picking only `name` and `email`, forcing `role: 'patient'` regardless of what attributes were submitted.
2. **Secret Leakage Elimination**: `toPublicPatientDTO()` serializes only public fields, ensuring `ssn_hash` is never included in the JSON response.
3. **HPP Guarding**: The query handler checks `Array.isArray(rawStatus)` and extracts the scalar string, preventing crashes from duplicate query keys.
4. **Graceful Malformed JSON Interception**: The error middleware intercepts `SyntaxError` from `express.json()` and formats a clean 400 response without leaking the server stack trace.

---

## Summary

- The data boundary comprises four discrete phases: Parsing (byte decoding), Validation (contract verification), Normalization (sanitization), and Serialization (projection).
- Always enforce bounded payload limits on `express.json({ limit: '50kb' })` and intercept `SyntaxError` parse failures to prevent server stack trace leakage.
- Protect against Mass Assignment by using strict schema allowlists and never spreading `req.body` into database creation queries.
- Protect against HTTP Parameter Pollution (HPP) by verifying that query string parameters are scalar strings before calling string methods like `.toLowerCase()` or `.trim()`.
- Never return raw database records directly in `res.json()`. Use explicit DTO projection serializers to safeguard internal hashes, tokens, and sensitive columns.

---

## Cheat Sheet

| Concern | Recommended Defense | Primary Threat Mitigated |
| :--- | :--- | :--- |
| **Payload Bombs** | `express.json({ limit: '50kb' })` | Denial of Service / V8 Heap Exhaustion |
| **Malformed JSON** | Intercept `err instanceof SyntaxError` | Stack trace information disclosure |
| **Mass Assignment** | Zod `.strict()` or manual DTO construction | Unauthorized privilege escalation (`role: admin`) |
| **Parameter Pollution** | Array scalar flattening middleware | Runtime crashes and filter bypasses (`?id=1&id=2`) |
| **Secret Leakage** | Explicit Outbound DTO Mappers | Exposing `password_hash`, salts, internal flags |
| **Boolean Query Params**| Explicit string comparison (`=== 'true'`) | False-positive truthiness bug (`Boolean("false") === true`) |

### Common Pitfalls
- **Spreading `req.body` into database models**: Directly exposes the database schema to arbitrary client tampering.
- **Assuming query parameters are always strings**: Duplicate query keys convert parameters into arrays, crashing string methods.
- **Using `Boolean(req.query.flag)`**: Strings like `"false"` evaluate to `true`, causing unexpected logical errors.
- **Returning raw ORM/Mongoose models**: Serializes hidden internal columns and credentials directly to clients.

---

## Interview Questions

### 1. What is the fundamental difference between Input Parsing and Input Validation, and why does one not replace the other?

> **Parsing**: Decoding raw byte streams into structured JavaScript objects (e.g. `express.json()`).

**Input Parsing** is the mechanical process of decoding an inbound stream of raw bytes into an in-memory JavaScript data structure. For example, `express.json()` reads HTTP chunk streams, decodes them according to UTF-8, and invokes `JSON.parse()` to produce a JavaScript object on `req.body`. A successful parse guarantees only that the payload conforms to JSON grammar syntax.

**Input Validation**, by contrast, is the semantic evaluation of that parsed data structure against domain business rules, types, and invariants. A payload such as `{"age": -500, "email": "not-an-email", "role": "superadmin"}` is 100% syntactically valid JSON and parses without error, but is completely invalid according to domain requirements. Parsing without validation leaves applications vulnerable to type errors, injection attacks, and logic flaws. Conversely, validation cannot execute until parsing has successfully hydrated the raw bytes into a queryable object.

### 2. How does the Mass Assignment vulnerability manifest in Node.js backends, and what architectural pattern guarantees protection?

The **Mass Assignment** vulnerability manifests when an application takes client-supplied request properties (`req.body`) and passes them directly to an internal data layer or ORM persistence call without filtering:
```js
// Vulnerable:
const user = await UserModel.create(req.body);
```
If an attacker inspects the API or database schema and sends unexpected attributes—such as `{"role": "admin"}`, `{"isVerified": true}`, or `{"balance": 1000000}`—the ORM blindly persists those properties to the database, allowing unauthorized privilege escalation or data tampering.

The architectural patterns that guarantee protection are:
1. **Strict Input DTO Schemas**: Using schema validators (like Zod with `.strict()` or Joi with `stripUnknown: true`) that actively reject or strip any property not explicitly defined in the input contract.
2. **Explicit Property Picking**: In controllers, avoid object spreading (`{ ...req.body }`). Instead, explicitly pick declared properties:
   ```js
   const { name, email } = req.body;
   await UserModel.create({ name, email, role: 'member' });
   ```

### 3. What is HTTP Parameter Pollution (HPP), how can it crash an Express application, and how do you mitigate it?

**HTTP Parameter Pollution (HPP)** occurs when an HTTP client passes multiple query parameters with the identical key name in the URL query string:
```text
GET /api/search?category=books&category=electronics
```
By default, Express's internal query parser parses duplicate parameters as an **Array** rather than a string:
```js
req.query.category = ['books', 'electronics'];
```
If application code assumes the query parameter is always a string and invokes string methods:
```js
const sanitizedCategory = req.query.category.trim().toLowerCase();
```
The application immediately crashes with an unhandled exception: `TypeError: req.query.category.trim is not a function`. Attackers can exploit this to execute denial-of-service attacks or bypass SQL/WAF filtering rules.

To mitigate HPP:
1. Install an HPP protection middleware that inspects `req.query` and flattens unexpected arrays to their last scalar string value.
2. Use strict schema validation on `req.query` (e.g. `z.string()`), which will cleanly reject array inputs with an HTTP 422 error before reaching application code.

### 4. Why should backend services never return raw database models directly to clients, and how does the Outbound DTO pattern solve this?

Returning raw database records (e.g. `res.json(dbUser)`) creates severe security and architectural liabilities:
1. **Information Leakage**: Database models routinely contain internal or sensitive columns such as `password_hash`, `salt`, `mfa_secret`, `internal_risk_score`, or soft-delete timestamps (`deleted_at`). Spreading or returning the entire record risks exposing sensitive data to clients.
2. **Accidental Schema Coupling**: The public API contract becomes tightly coupled to the database schema. Renaming an internal database column immediately breaks external API clients.
3. **Leaked Object Metadata**: Mongoose documents and ORM models contain prototype helpers, internal flags (`__v`), and circular references that degrade serialization performance.

The **Outbound DTO (Data Transfer Object)** pattern solves this by passing domain models through explicit serializer functions (e.g., `toPublicUserDTO(user)`). The serializer acts as a strict projection filter, mapping only explicitly declared public attributes to a new object, guaranteeing that internal database changes and sensitive credentials never leak across the network boundary.

---

<nav aria-label="Lecture navigation">

[← Previous: Express Routing and Route Parameters](day-15-express-routing-and-route-parameters.md) | [Roadmap](../node-roadmap.md) | [Next: Async Express and Centralized Errors](day-17-async-express-and-centralized-errors.md)

</nav>