# Day 3: Express APIs, Validation, Error Handling, Auth, and Security

Quick review of main-course lectures 13–20. Designed for rapid interview revision: Express middleware pipeline, schema validation, centralized async errors, cursor pagination, JWT vs Session authentication, and OWASP security hardening.

## Express pipeline, routing, and middleware

**1. Middleware chain execution model**

Express processes requests through an ordered chain of middleware functions. Each function must call `next()`, send a response (`res.json()`), or forward an error (`next(err)`). Calling `next("route")` skips remaining middleware in the current route stack.

```js
import express from "express";
const app = express();

// Global body parser with size limit to prevent memory exhaustion DoS
app.use(express.json({ limit: "100kb" }));

// Request logging middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} (${Date.now() - req.startTime}ms)`);
  });
  next();
});
```

**1.1 Route parameters and modular routers**

Use `express.Router()` to segment domain routes. Route parameters (`:id`) are accessible via `req.params`. Validate and coerce types before passing to services.

```js
const userRouter = express.Router();

userRouter.get("/:id(\\d+)", (req, res) => {
  const userId = Number(req.params.id); // coerced safely due to regex \\d+
  res.json({ id: userId });
});

app.use("/api/v1/users", userRouter);
```

[Express application structure](../../Node/node-lectures/day-13-express-application-structure.md) | [Middleware flow](../../Node/node-lectures/day-14-express-middleware-and-request-flow.md) | [Routing](../../Node/node-lectures/day-15-express-routing-and-route-parameters.md)

## Input validation and centralized error handling

**1. Schema validation at API boundaries**

Validate incoming requests (`params`, `query`, `body`) at the controller entry point using a schema library (e.g., Zod). Never trust raw client input.

```js
import { z } from "zod";

const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    age: z.number().int().min(18)
  })
});

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
  if (!result.success) {
    return res.status(400).json({ error: "Validation Failed", details: result.error.issues });
  }
  req.validated = result.data;
  next();
};
```

**2. Centralized async error handler**

In Express 4, unhandled promise rejections inside async route handlers must be forwarded via `next(err)` or an async wrapper. The centralized error middleware must declare all **four arguments** `(err, req, res, next)`.

```js
// Async controller wrapper for Express 4 (Express 5 handles promise rejections natively)
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 4-argument centralized error middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode ?? 500;
  const isProduction = process.env.NODE_ENV === "production";

  // Never leak internal stack traces to public clients in production
  res.status(statusCode).json({
    error: err.name || "InternalServerError",
    message: statusCode === 500 && isProduction ? "An unexpected error occurred" : err.message,
    ...(isProduction ? {} : { stack: err.stack })
  });
});
```

[Input validation](../../Node/node-lectures/day-16-express-input-validation-and-serialization.md) | [Async errors](../../Node/node-lectures/day-17-async-express-and-centralized-errors.md)

## API design: Pagination and idempotency

**1. Offset vs Cursor-based pagination**

Offset pagination (`LIMIT 20 OFFSET 100000`) scans and discards 100,000 rows in the database, causing severe latency spikes on deep pages and returning duplicate rows if items are inserted during paging. Cursor pagination uses indexed keyset filters (`WHERE id > :cursor LIMIT 20`), maintaining stable $O(1)$ database execution.

```text
Offset Pagination: SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 100000; -- O(N) DB scan
Cursor Pagination: SELECT * FROM orders WHERE id > 'ord_987' ORDER BY id LIMIT 20; -- O(1) Index seek
```

**2. Idempotent mutations**

For non-idempotent operations like payment processing (`POST /charges`), require an `Idempotency-Key` header. Store the result in Redis with an atomic lock (`SET key val NX EX 300`) to guarantee safe retries.

```js
async function handleCharge(req, res) {
  const key = req.headers["idempotency-key"];
  if (!key) return res.status(400).json({ error: "Idempotency-Key header required" });

  const cached = await redis.get(`idemp:${key}`);
  if (cached) return res.status(200).json(JSON.parse(cached)); // Replay original response

  const chargeResult = await paymentService.charge(req.body);
  await redis.set(`idemp:${key}`, JSON.stringify(chargeResult), "EX", 86400);
  return res.status(201).json(chargeResult);
}
```

[API contracts and pagination](../../Node/node-lectures/day-18-api-contracts-pagination-and-idempotency.md)

## Authentication, authorization, and security

**1. JWT vs Session Cookies**

Store sensitive auth tokens in `HttpOnly`, `Secure`, `SameSite=Strict` cookies to eliminate Cross-Site Scripting (XSS) token theft. Never store JWTs in browser `localStorage`.

```js
// Setting a secure session cookie
res.cookie("refreshToken", token, {
  httpOnly: true, // Inaccessible to client JavaScript (prevents XSS theft)
  secure: true,   // Transmitted exclusively over HTTPS
  sameSite: "strict", // Mitigates Cross-Site Request Forgery (CSRF)
  maxAge: 7 * 24 * 60 * 60 * 1000
});
```

**2. Role-Based Access Control (RBAC) middleware**

Verify authorization policies immediately after authentication. Decouple permissions from concrete routes using declarative middleware guards.

```js
const requireRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden: Insufficient privileges" });
  }
  next();
};

app.delete("/api/v1/users/:id", authenticateUser, requireRoles("ADMIN"), deleteUserHandler);
```

**3. OWASP hardening and timing attacks**

Use `helmet` to inject protective HTTP headers. When verifying API tokens or HMAC signatures, use `crypto.timingSafeEqual` to prevent side-channel timing attacks.

```js
import crypto from "node:crypto";
import helmet from "helmet";

app.use(helmet()); // Sets CSP, HSTS, X-Content-Type-Options, etc.

// Timing-safe string comparison
function verifySecret(providedKey, expectedKey) {
  const bufA = Buffer.from(providedKey);
  const bufB = Buffer.from(expectedKey);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB); // Constant-time comparison
}
```

[Auth boundaries](../../Node/node-lectures/day-19-authentication-and-authorization-boundaries.md) | [Express security](../../Node/node-lectures/day-20-express-security-and-http-testing.md)

## Tricky points

1. **Routing and middleware**

**1.1 Unhandled `next()` calls leading to multiple response errors**
Forgetting to `return` after `res.json()` allows the function to keep running and invoke subsequent middleware, resulting in `ERR_HTTP_HEADERS_SENT`.

**1.2 Arity-dependent error middleware**
Express identifies error-handling middleware exclusively by checking `fn.length === 4`. If you remove the unused `next` parameter from `(err, req, res)`, Express treats it as regular middleware and bypasses it during errors.

2. **Validation and errors**

**2.1 Express 4 async errors vanishing into unhandled rejection**
If an async route handler throws an error in Express 4 without `try/catch` or an async wrapper, the request hangs until the client socket times out.

**2.2 Leaking database schemas via unhandled errors**
Returning raw database errors (`PostgresError: relation "users" does not exist`) directly in API responses reveals internal infrastructure details to attackers.

3. **Authentication and security**

**3.1 Timing attacks on secret comparisons**
Using `providedToken === secretToken` short-circuits on the first mismatched byte, allowing attackers to reconstruct valid tokens byte-by-byte by measuring response latencies.

**3.2 Wildcard CORS with credentials vulnerability**
Setting `Access-Control-Allow-Origin: *` while also enabling `Access-Control-Allow-Credentials: true` is rejected by browsers; setting dynamic origin reflection without whitelist validation permits arbitrary origins to steal authenticated session cookies.