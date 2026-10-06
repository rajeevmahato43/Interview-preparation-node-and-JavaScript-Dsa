# Day 19: Authentication and Authorization Boundaries

<nav aria-label="Lecture navigation">

[← Previous: API Contracts, Pagination, and Idempotency](day-18-api-contracts-pagination-and-idempotency.md) | [Roadmap](../node-roadmap.md) | [Next: Express Security and HTTP Testing](day-20-express-security-and-http-testing.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Distinguish the security boundaries and HTTP status contracts between **Authentication** (401 Unauthorized) and **Authorization** (403 Forbidden).
- Compare stateful session-based authentication (Redis sessions, HTTP-only cookies) with stateless token authentication (JWT, Asymmetric RS256/EdDSA).
- Implement a Dual-Token Architecture featuring short-lived access tokens, long-lived refresh tokens, and **Refresh Token Rotation with Reuse Detection**.
- Enforce multi-tier authorization including **Role-Based Access Control (RBAC)** and **Attribute-Based Access Control (ABAC)** via composable Express middleware.
- Eliminate **Broken Object Level Authorization (BOLA / IDOR)** by binding resource queries directly to authenticated tenant and user identifiers at the database query layer.
- Prevent timing attacks during signature and credential verification using `crypto.timingSafeEqual()`.

---

## Prerequisites

Before diving into authentication and authorization boundaries, review:
- [Day 06: Buffers, Encodings, and Serialization](day-06-buffers-encodings-and-serialization.md) for binary buffers and Base64URL string encodings.
- [Day 13: Express Application Structure](day-13-express-application-structure.md) for separating transport controllers from domain services.
- [Day 14: Express Middleware and Request Flow](day-14-express-middleware-and-request-flow.md) for pipeline execution and request short-circuiting.
- [Day 17: Async Express and Centralized Errors](day-17-async-express-and-centralized-errors.md) for `UnauthorizedError` (401) and `ForbiddenError` (403).

---

## Quick Vocabulary Card

| Term | Programming Definition | Anti-Pattern / Misconception |
| :--- | :--- | :--- |
| **Authentication (AuthN)** | The process of verifying the claimed identity of a caller (e.g. validating a password, JWT, or session cookie). | Returning HTTP 403 when a token is missing or expired; unauthenticated requests must always return HTTP 401. |
| **Authorization (AuthZ)** | The process of verifying whether an authenticated caller possesses permission to perform a specific action on a resource. | Returning HTTP 401 when an authenticated user lacks admin rights; unauthorized callers must receive HTTP 403 Forbidden. |
| **BOLA / IDOR** | Broken Object Level Authorization (Insecure Direct Object Reference); an exploit where an attacker accesses resources belonging to other users by tampering with an ID. | Querying `SELECT * FROM invoices WHERE id = $id` without scoping the query to `AND user_id = $authenticatedUser.id`. |
| **Refresh Token Rotation** | An auth strategy where every refresh operation issues a brand-new refresh token and invalidates the previous one immediately. | Reusing static refresh tokens indefinitely; if a token is intercepted, the attacker maintains indefinite access. |
| **Token Reuse Detection** | A security mechanism where presenting an already-invalidated refresh token triggers the immediate revocation of all active sessions for that user family. | Silently rejecting a reused token without invalidating the active compromised session. |
| **Constant-Time Comparison**| Comparing cryptographic buffers using `crypto.timingSafeEqual()` so execution duration does not leak secret character positions. | Using standard `===` to compare API keys or cryptographic signatures, opening the system to side-channel timing attacks. |

---

## Core Concepts

### 1. The HTTP Security Boundary: 401 Unauthorized vs 403 Forbidden

The distinction between HTTP 401 and HTTP 403 is a strict protocol contract:

```text
Incoming Request
       │
       ▼
[Authentication Middleware] ──► Identity Verified?
       │ No
       ▼
HTTP 401 Unauthorized
(Headers: WWW-Authenticate: Bearer)
"You must prove who you are before proceeding."
       │ Yes (req.user is attached)
       ▼
[Authorization Middleware] ──► Has Required Permission / Ownership?
       │ No
       ▼
HTTP 403 Forbidden
"I know who you are (User 42), but you are forbidden from accessing this resource."
       │ Yes
       ▼
[Execute Controller Action]
```

- **HTTP 401 Unauthorized**: The request lacks valid authentication credentials. The client can retry the request by supplying a valid token or signing in.
- **HTTP 403 Forbidden**: The caller's identity is known, but the caller lacks sufficient privileges (insufficient role, wrong tenant, or not the resource owner). Retrying with the same credentials will fail.

---

### 2. Identity Mechanisms: Stateful Sessions vs Stateless JWTs

Choosing between sessions and tokens involves significant operational and architectural tradeoffs:

```text
Stateful Sessions (Redis / DB)              Stateless JWT (RS256 / HS256)
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
│ Client sends Session Cookie (SID)    │     │ Client sends Authorization Header    │
│ Server queries Redis for session data│     │ Server verifies crypto signature     │
│ Instant Revocation: DELETE session:id│     │ Cannot revoke without token blacklist│
│ Bounded Memory: Redis RAM scales O(N)│     │ Zero DB lookups: Fast & distributed  │
└──────────────────────────────────────┘     └──────────────────────────────────────┘
```

| Dimension | Stateful Sessions | Stateless JWT |
| :--- | :--- | :--- |
| **Storage Location** | Client: HttpOnly Cookie; Server: Redis/DB | Client: Memory / Cookie; Server: Zero storage |
| **Verification Cost** | Network I/O to Redis (~1ms) | In-memory cryptographic CPU verify (~0.1ms) |
| **Revocation** | **Immediate**: Deleting key in Redis invalidates session | **Difficult**: Token remains valid until expiration (`exp`) |
| **Scalability** | Redis cluster required across multiple instances | Fully decentralized across microservices |
| **Security Surface** | Vulnerable to CSRF (requires SameSite cookies) | Vulnerable to XSS if stored in `localStorage` |

---

### 3. Dual-Token Architecture and Token Rotation

To balance the speed of stateless verification with the control of instant revocation, production systems implement a **Dual-Token Architecture**:

```text
Client Application                                           Auth Server / API
┌──────────────────┐                                        ┌──────────────────┐
│                  │ ──── 1. POST /login ─────────────────► │ Authenticates    │
│                  │ ◄─── 2. Access Token (15 min) ──────── │ Issues tokens    │
│                  │ ◄───    Refresh Token (7 days) ─────── │                  │
│                  │                                        │                  │
│ Uses AccessToken │ ──── 3. GET /api/data (Bearer Token) ─►│ Verifies in-mem  │
│                  │ ◄─── 4. HTTP 200 OK ────────────────── │ Fast, zero I/O   │
│                  │                                        │                  │
│ Access Token Exp │ ──── 5. GET /api/data ───────────────► │ ◄── Returns 401  │
│                  │                                        │                  │
│ Rotate Session   │ ──── 6. POST /refresh (Old Token) ───► │ Invalidates Old  │
│                  │ ◄─── 7. Returns NEW Access & Refresh ─ │ Issues NEW Token │
└──────────────────┘                                        └──────────────────┘
```

#### Token Reuse Detection
If an attacker steals a refresh token and uses it to obtain a new pair, the legitimate client will eventually attempt to refresh using that same old token.
- When the server detects that an **already-used** refresh token is presented, it assumes a token theft has occurred.
- The server immediately invalidates the entire token family, killing all active sessions for that user across all devices and forcing re-authentication.

---

### 4. Broken Object Level Authorization (BOLA / IDOR)

BOLA (formerly IDOR) is ranked by OWASP as the #1 vulnerability in API security. It occurs when an API endpoint relies on user-supplied IDs to locate resources without verifying ownership:

```text
❌ VULNERABLE: In-Memory Ownership Check
app.get('/invoices/:id', authenticate, async (req, res) => {
  const invoice = await db.findInvoice(req.params.id);
  // Fetches ANY invoice from the database!
  if (invoice.userId !== req.user.id) { // Vulnerable to timing & memory leaks
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(invoice);
});

✅ SECURE: Database-Scoped Ownership Check
app.get('/invoices/:id', authenticate, async (req, res) => {
  // Scopes query directly to the authenticated user!
  const invoice = await db.query(
    'SELECT * FROM invoices WHERE id = $1 AND tenant_id = $2 AND user_id = $3',
    [req.params.id, req.user.tenantId, req.user.id]
  );
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' }); // Never leaks existence!
  }
  res.json(invoice);
});
```

> **Security Rule**: Returning `404 Not Found` instead of `403 Forbidden` for inaccessible private resources prevents attackers from enumerating valid resource IDs.

---

### 5. Constant-Time Signature Verification

When verifying raw tokens, webhook signatures, or API keys, using standard JavaScript equality operators (`===` or `==`) introduces **Timing Attack Vulnerabilities**:

```js
// ❌ VULNERABLE: Short-circuits on first mismatched character!
// Leaks character-by-character timing differences to remote attackers!
if (userApiKey === secretApiKey) { ... }
```
JavaScript's string comparison terminates as soon as it discovers a non-matching byte. An attacker measuring HTTP response times with nanosecond precision can deduce the secret character by character.

**Production Defense**: Always convert strings to buffers and compare with `crypto.timingSafeEqual()`:
```js
// ✅ SECURE: Constant-time execution regardless of match position
import crypto from 'node:crypto';

export function timingSafeCompare(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));

  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}
```

---

## Code Snippets and Demonstrations

### 1. Robust JWT Authentication Middleware with Asymmetric Verification

Verifying JWT bearer tokens using `node:crypto` and handling expiration gracefully.

```js
// Node.js code
// filename: jwt-auth.mjs
import crypto from 'node:crypto';

export class UnauthorizedError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

/**
 * Extracts and verifies JWT bearer tokens.
 */
export function createAuthenticateMiddleware(jwtSecret) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Missing or malformed Authorization header'));
    }

    const token = authHeader.slice(7).trim();
    const parts = token.split('.');
    if (parts.length !== 3) {
      return next(new UnauthorizedError('Malformed JWT token structure'));
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    try {
      // 1. Verify Signature using HMAC SHA-256
      const expectedSignature = crypto
        .createHmac('sha256', jwtSecret)
        .update(`${headerB64}.${payloadB64}`)
        .digest('base64url');

      const sigBuf = Buffer.from(signatureB64, 'base64url');
      const expectedBuf = Buffer.from(expectedSignature, 'base64url');

      if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return next(new UnauthorizedError('Invalid token signature'));
      }

      // 2. Decode and Validate Payload
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

      // Check Expiration (exp in seconds)
      const nowSec = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < nowSec) {
        return next(new UnauthorizedError('Token has expired'));
      }

      // 3. Attach trusted identity to request context
      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role || 'member',
        tenantId: payload.tid
      };

      next();
    } catch (err) {
      next(new UnauthorizedError('Invalid token payload'));
    }
  };
}
```

---

### 2. Declarative RBAC and ABAC Authorization Guards

Creating composable authorization middleware that verifies roles and dynamic resource attributes.

```js
// Node.js code
// filename: authorization-guards.mjs

export class ForbiddenError extends Error {
  constructor(message = 'Access forbidden: Insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}

/**
 * Role-Based Access Control (RBAC) Guard
 */
export function requireRole(...allowedRoles) {
  const roleSet = new Set(allowedRoles);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roleSet.has(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        detail: `Required role: [${allowedRoles.join(', ')}]. Caller has: ${req.user.role}`
      });
    }

    next();
  };
}

/**
 * Attribute-Based Access Control (ABAC) / Ownership Guard
 */
export function requireOwnership(resourceIdExtractor) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admins bypass ownership checks
    if (req.user.role === 'admin') {
      return next();
    }

    const targetOwnerId = resourceIdExtractor(req);
    if (String(req.user.id) !== String(targetOwnerId)) {
      return res.status(403).json({
        error: 'Forbidden',
        detail: 'Caller does not own this resource'
      });
    }

    next();
  };
}
```

---

### 3. Refresh Token Rotation with Reuse Detection

Implementing an atomic token family lifecycle in memory/database.

```js
// Node.js code
// filename: token-family-service.mjs
import crypto from 'node:crypto';

export class TokenFamilyManager {
  constructor() {
    // Maps familyId -> { currentToken, userId, isRevoked }
    this.families = new Map();
  }

  issueInitialTokenPair(userId) {
    const familyId = crypto.randomUUID();
    const refreshToken = crypto.randomBytes(32).toString('hex');

    this.families.set(familyId, {
      familyId,
      userId,
      currentToken: refreshToken,
      isRevoked: false
    });

    return { familyId, refreshToken };
  }

  rotateRefreshToken(familyId, presentedToken) {
    const session = this.families.get(familyId);

    if (!session) {
      throw new Error('Invalid session family');
    }

    // ⚠️ REUSE DETECTION TRIGGERED!
    if (session.isRevoked || session.currentToken !== presentedToken) {
      // Attacker or client is presenting an OLD, invalidated token!
      // Revoke the entire family immediately to protect user!
      session.isRevoked = true;
      throw new Error('SECURITY_ALERT: Refresh token reuse detected! All sessions terminated.');
    }

    // Issue new token and invalidate previous token
    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    session.currentToken = newRefreshToken;

    return {
      userId: session.userId,
      newRefreshToken
    };
  }
}
```

---

## Edge Cases and Tricky Scenarios

### 1. Insecure Deserialization of JWT Payload Without Verification

Developers often call `jwt.decode(token)` (which merely base64-decodes the payload) instead of `jwt.verify(token)`:

```js
// Node.js code
// ❌ CATASTROPHIC VULNERABILITY: Decodes without verifying signature!
const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
req.user = decoded; // Attacker can forge { "role": "admin" } with any garbage signature!
```
- **The Exploit**: An attacker can modify the payload to include `"role": "admin"`, sign it with an arbitrary signature, and gain full administrative privileges.
- **The Rule**: Never use decoded claims for authorization or routing until the cryptographic signature has been verified.

### 2. Leaking Credentials in Diagnostic Logs

When logging incoming HTTP traffic, default logging configurations frequently dump all headers:

```js
// ❌ DANGEROUS: Dumps sensitive bearer tokens and session cookies to log aggregators!
console.log('Incoming request:', req.headers);
```
- **The Fix**: Install request sanitizers that redact `authorization`, `cookie`, `set-cookie`, and `x-api-key` headers before outputting structured logs.

---

## Node.js, JavaScript, and Systems Connections

```text
┌──────────────────────────────────────────────────────────────┐
│ V8 Cryptographic Subsystem (node:crypto)                     │
│ - crypto.timingSafeEqual (Constant-time buffer comparison)   │
│ - crypto.createHmac / crypto.verify (Signature validation)   │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Express Security Perimeter                                   │
│ - Authentication Layer: Validates token -> populates req.user│
│ - Authorization Layer: Validates roles / ABAC rules          │
│ - Centralized Error Layer: Maps 401 & 403 status codes       │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Database Query Execution Layer                               │
│ - Multi-Tenant Scoping: WHERE tenant_id = $authTenantId      │
│ - BOLA Prevention: Scopes write & read queries to user_id    │
└──────────────────────────────────────────────────────────────┘
```

- **Cryptographic Timing**: Native Node.js `crypto.timingSafeEqual` operates directly in C++ to prevent branch prediction leaks in the V8 JIT compiler.
- **Database Boundary**: Real security enforcement lives at the database query boundary (`WHERE user_id = $userId`), not in the controller's memory checks.

---

## Hands-On Exercise

### Scenario
A multi-tenant project management SaaS API has two severe security vulnerabilities:
1. In `GET /documents/:docId`, any authenticated user can view any other organization's documents simply by guessing the document ID (BOLA / IDOR).
2. The role verification middleware checks roles with `req.body.role` instead of checking the authenticated JWT token claims, allowing regular users to elevate to admins by sending `{"role": "admin"}` in their request body.

### Buggy Code

```js
// Node.js code
// filename: buggy-saas-api.mjs
const express = require('express');
const app = express();
app.use(express.json());

const db = {
  documents: [
    { id: 'doc_1', tenantId: 'tenant_A', ownerId: 'usr_1', title: 'Confidential M&A' },
    { id: 'doc_2', tenantId: 'tenant_B', ownerId: 'usr_2', title: 'Public Roadmap' }
  ]
};

// Fake auth middleware
app.use((req, res, next) => {
  // Simulates extracted user
  req.user = { id: 'usr_1', tenantId: 'tenant_A', role: 'member' };
  next();
});

// ❌ BUG 1: Insecure Direct Object Reference (BOLA) - Returns document regardless of tenant/owner!
app.get('/documents/:docId', (req, res) => {
  const doc = db.documents.find(d => d.id === req.params.docId);
  if (!doc) return res.status(404).send('Not found');
  res.json(doc); // usr_1 can view doc_2 belonging to tenant_B!
});

// ❌ BUG 2: Role checked from untrusted req.body instead of req.user!
app.post('/admin/settings', (req, res) => {
  if (req.body.role !== 'admin') {
    return res.status(403).send('Forbidden');
  }
  res.json({ status: 'admin setting updated' });
});

module.exports = app;
```

### Acceptance Criteria
1. Fix `GET /documents/:docId` to scope queries strictly to the authenticated caller's `tenantId` and `ownerId`.
2. Return HTTP 404 (not 403) when a document outside the caller's tenant is requested, preventing ID enumeration.
3. Fix `/admin/settings` by attaching an RBAC middleware that inspects `req.user.role` exclusively.
4. Provide a test suite using `node:test` verifying that cross-tenant access is blocked with 404 and unprivileged admin access is blocked with 403.

### Solution Code

```js
// Node.js code
// filename: solution-saas-api.mjs
import express from 'express';
import { requireRole } from './authorization-guards.mjs';

export function createFixedSaaSApp(customUser = null) {
  const app = express();
  app.use(express.json());

  const db = {
    documents: [
      { id: 'doc_1', tenantId: 'tenant_A', ownerId: 'usr_1', title: 'Confidential M&A' },
      { id: 'doc_2', tenantId: 'tenant_B', ownerId: 'usr_2', title: 'Public Roadmap' }
    ]
  };

  // Auth Middleware
  app.use((req, res, next) => {
    req.user = customUser || { id: 'usr_1', tenantId: 'tenant_A', role: 'member' };
    next();
  });

  // ✅ FIX 1: Database query scoped directly to tenantId and ownerId (Eliminates BOLA)
  app.get('/documents/:docId', (req, res) => {
    const { docId } = req.params;
    const { tenantId, id: userId, role } = req.user;

    // In SQL: SELECT * FROM documents WHERE id = $1 AND tenant_id = $2 AND (owner_id = $3 OR $4 = 'admin')
    const doc = db.documents.find(d => {
      const isSameTenant = d.tenantId === tenantId;
      const isOwnerOrAdmin = d.ownerId === userId || role === 'admin';
      return d.id === docId && isSameTenant && isOwnerOrAdmin;
    });

    if (!doc) {
      // Returns 404 to prevent resource existence enumeration!
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ data: doc });
  });

  // ✅ FIX 2: Protected by strict RBAC middleware inspecting req.user.role
  app.post('/admin/settings', requireRole('admin'), (req, res) => {
    res.json({ status: 'admin setting updated' });
  });

  return app;
}
```

Accompanying test suite:
```js
// Node.js code
// filename: solution-saas-api.test.mjs
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createFixedSaaSApp } from './solution-saas-api.mjs';

describe('Authentication and Authorization Boundary Tests', () => {
  it('blocks BOLA cross-tenant access with 404', async () => {
    // Caller is in tenant_A
    const app = createFixedSaaSApp({ id: 'usr_1', tenantId: 'tenant_A', role: 'member' });
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      // Attempt to access doc_2 (belonging to tenant_B)
      const res = await fetch(`http://127.0.0.1:${port}/documents/doc_2`);
      assert.equal(res.status, 404); // Returns 404 rather than leaking doc_2 existence!
    } finally {
      server.close();
    }
  });

  it('blocks regular member from accessing admin settings with 403', async () => {
    const app = createFixedSaaSApp({ id: 'usr_1', tenantId: 'tenant_A', role: 'member' });
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      // Member attempts to send body: { role: 'admin' }
      const res = await fetch(`http://127.0.0.1:${port}/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }) // Untrusted injection attempt!
      });

      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.error, 'Forbidden');
    } finally {
      server.close();
    }
  });
});
```

### Solution Explanation
1. **BOLA Elimination**: In `GET /documents/:docId`, documents are matched against `tenantId` and `ownerId` simultaneously. If the document belongs to another tenant, the query returns null.
2. **Enumeration Defense**: The endpoint responds with `404 Not Found` rather than `403 Forbidden`, preventing attackers from probing valid foreign document IDs.
3. **Rigid RBAC Guard**: `requireRole('admin')` validates the cryptographically authenticated role attached to `req.user`, neutralizing body parameter tampering.

---

## Summary

- Authentication (AuthN) proves identity (401 Unauthorized); Authorization (AuthZ) verifies permissions (403 Forbidden).
- Dual-Token architectures balance stateless in-memory verification (15-min Access Tokens) with centralized session control (Refresh Token Rotation with Reuse Detection).
- Eliminate Broken Object Level Authorization (BOLA/IDOR) by scoping database queries directly to the caller's authenticated `tenantId` and `userId`.
- Return 404 instead of 403 on inaccessible private resources to prevent ID enumeration.
- Always use `crypto.timingSafeEqual()` for secret comparisons to eliminate side-channel timing attacks.

---

## Cheat Sheet

| Concern | HTTP Status / Primitive | Security Rule |
| :--- | :--- | :--- |
| **Missing / Expired Token** | HTTP 401 Unauthorized | Always include `WWW-Authenticate: Bearer` header |
| **Insufficient Role** | HTTP 403 Forbidden | Never elevate roles based on client input |
| **Resource Ownership** | HTTP 404 Not Found | Return 404 to mask cross-tenant resource existence |
| **Signature Compare** | `crypto.timingSafeEqual()` | Constant-time execution eliminates timing attacks |
| **Refresh Rotation** | Token Family Reuse Detection | Revoke all sessions immediately upon token reuse |
| **BOLA Defense** | `WHERE tenant_id = $authTenant` | Enforce multi-tenancy at database query boundary |

### Common Pitfalls
- **Returning 403 for missing tokens**: Violates HTTP standards; missing tokens require 401.
- **Decoding JWTs with `jwt.decode()`**: Extracts claims without verifying the cryptographic signature.
- **Comparing API keys with `===`**: Leaks timing differences, enabling remote side-channel extraction.
- **Checking ownership in memory after fetching from DB**: Leaks data into process memory and risks forgotten if-conditions.

---

## Interview Questions

### 1. What is the fundamental difference between HTTP 401 Unauthorized and HTTP 403 Forbidden in REST API design?

The difference represents two distinct stages in the request security pipeline:

1. **HTTP 401 Unauthorized**:
   - **Meaning**: The request lacks valid authentication credentials, or the provided credentials (e.g. JWT or session cookie) are expired, malformed, or invalid.
   - **Contract**: The server communicates: *"I do not know who you are."* The response must include a `WWW-Authenticate` response header specifying the supported authentication challenge (e.g., `WWW-Authenticate: Bearer realm="api"`). The client can remediate the issue by authenticating and retrying.

2. **HTTP 403 Forbidden**:
   - **Meaning**: The client's identity is authenticated and verified, but the server refuses to authorize the requested action because the caller lacks the required permissions, roles, or ownership rights.
   - **Contract**: The server communicates: *"I know who you are (e.g. User 42), but you do not have permission to perform this operation."* Retrying with the same credentials will produce the identical 403 response.

### 2. How does Broken Object Level Authorization (BOLA / IDOR) occur, and why is database-level query scoping superior to in-memory ownership checks?

BOLA occurs when an API endpoint accepts an identifier from a client URL (e.g., `GET /invoices/:id` or `PATCH /orders/:orderId`) and uses that identifier directly to retrieve or update the record without verifying that the authenticated user actually owns or has permission to access that specific object.

Developers frequently attempt to solve this with **In-Memory Ownership Checks**:
```js
const invoice = await db.findById(req.params.id);
if (invoice.userId !== req.user.id) throw new ForbiddenError();
```
This pattern is fragile and hazardous:
1. **Accidental Exposure**: It loads unauthorized private data into server memory, exposing it to memory dumps, logging middleware, and side-channel leakage.
2. **Forgotten Guards**: If a new endpoint or update mutation forgets to include the manual `if` check, the entire resource becomes vulnerable.
3. **Existence Enumeration**: Returning 403 confirms to an attacker that invoice ID 105 actually exists, enabling automated enumeration attacks.

**Database-Level Query Scoping** solves this by binding ownership directly into the query:
```sql
SELECT * FROM invoices WHERE id = $id AND tenant_id = $authTenantId AND user_id = $authUserId;
```
If the record belongs to another user, the database returns zero rows. The application immediately responds with **404 Not Found**, completely preventing data loading and hiding whether the resource ID exists.

### 3. How does Refresh Token Rotation with Reuse Detection protect applications against token theft in a Dual-Token Architecture?

In a standard JWT system, access tokens are short-lived (e.g. 15 minutes) to limit the blast radius if intercepted. To prevent users from having to log in constantly, the client uses a long-lived Refresh Token (e.g. 7 days) stored in the database.

**Refresh Token Rotation** enhances this by treating refresh tokens as strictly single-use credentials:
1. Whenever the client presents a refresh token to obtain a new access token, the auth server invalidates the presented refresh token and issues a **brand-new refresh token** alongside the access token.
2. The auth server links tokens together in a **Token Family** in the database.

**Reuse Detection** handles the compromise scenario:
- Suppose an attacker intercepts Refresh Token $R_1$. The attacker immediately calls `/refresh` and receives valid Token $R_2$. The database marks $R_1$ as used and records $R_2$ as current.
- When the legitimate client subsequently attempts to refresh using its stored Token $R_1$, the server notices that $R_1$ is an **already-invalidated token**.
- The server recognizes that two distinct parties possess tokens from the same family. It triggers an automatic security alert, **immediately invalidates the entire token family**, and deletes all active sessions for that user. The attacker's token $R_2$ becomes instantly useless, cutting off unauthorized access.

### 4. What is a cryptographic timing attack, and why must backend developers use `crypto.timingSafeEqual()` instead of `===` when verifying secrets?

A **Timing Attack** is a side-channel attack where an attacker deduces secret information by measuring microsecond differences in how long a server takes to execute comparison operations.

In JavaScript, string comparison (`stringA === stringB`) is optimized for speed: it compares strings character by character and **short-circuits (exits early)** as soon as it encounters the first non-matching byte:
- Comparing `"AXXXX"` with `"SECRET"` fails on character 0 (returns in 1 nanosecond).
- Comparing `"SXXXX"` with `"SECRET"` matches character 0 and fails on character 1 (returns in 2 nanoseconds).

By issuing thousands of requests over a local network and measuring round-trip latency distributions, an attacker can determine when the first character is correct, then brute-force the second, third, and fourth characters iteratively, breaking high-entropy secrets in minutes.

`crypto.timingSafeEqual(bufA, bufB)` eliminates this vulnerability by executing a **constant-time comparison**. It iterates through every single byte of both buffers using bitwise XOR operations without early termination, taking the exact same number of CPU cycles regardless of whether zero characters match or all characters match.

---

<nav aria-label="Lecture navigation">

[← Previous: API Contracts, Pagination, and Idempotency](day-18-api-contracts-pagination-and-idempotency.md) | [Roadmap](../node-roadmap.md) | [Next: Express Security and HTTP Testing](day-20-express-security-and-http-testing.md)

</nav>