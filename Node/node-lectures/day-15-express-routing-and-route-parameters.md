# Day 15: Express Routing and Route Parameters

<nav aria-label="Lecture navigation">

[← Previous: Express Middleware and Request Flow](day-14-express-middleware-and-request-flow.md) | [Roadmap](../node-roadmap.md) | [Next: Express Input Validation and Serialization](day-16-express-input-validation-and-serialization.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Deconstruct the `path-to-regexp` engine powering Express routing, compiling route patterns into deterministic regular expressions.
- Eliminate route shadowing bugs by enforcing strict route registration precedence (literal paths before parameterized paths).
- Hydrate and validate route parameters efficiently using `router.param()` lifecycle middleware without duplicating database lookups.
- Architect deeply nested RESTful hierarchies using `express.Router({ mergeParams: true })` without losing access to parent path parameters.
- Differentiate semantic responsibilities between Path Parameters (Resource Identity & Hierarchy) and Query Strings (Filtering, Sorting, Pagination, and Projection).
- Configure case-sensitivity and strict trailing slash routing settings (`strict routing` and `case sensitive routing`) to maintain deterministic API contracts.

---

## Prerequisites

Before diving into routing architecture, review:
- [Day 09: Node HTTP Fundamentals](day-09-node-http-fundamentals.md) for URL path parsing and query strings.
- [Day 13: Express Application Structure](day-13-express-application-structure.md) for router composition and modular layouts.
- [Day 14: Express Middleware and Request Flow](day-14-express-middleware-and-request-flow.md) for middleware traversal and `next('route')`.

---

## Quick Vocabulary Card

| Term | Programming Definition | Anti-Pattern / Misconception |
| :--- | :--- | :--- |
| **`path-to-regexp`** | The underlying library used by Express to compile route pattern strings into RegExp matchers with named capture groups. | Assuming route matching uses simple string prefix matching; dynamic patterns compile into regular expressions. |
| **Route Shadowing** | An ordering bug where a generic parameterized route (`/users/:id`) matches before a specific literal route (`/users/me`), intercepting the request. | Registering `/users/:id` before `/users/me`; Express executes the first matching route in registration order, treating `"me"` as an `:id`. |
| **`mergeParams: true`** | An `express.Router` option that preserves and propagates `req.params` from parent router mount paths to nested child routers. | Wondering why `req.params.userId` is `undefined` inside `/users/:userId/posts/:postId` child router; forgetting `mergeParams: true`. |
| **`router.param()`** | Parameter middleware that executes once per parameter name whenever that parameter is present in the matched route path. | Fetching the same database record repeatedly in every route middleware instead of pre-hydrating `req.entity` via `router.param`. |
| **Path Parameter** | A named URL segment (e.g. `/orders/:orderId`) defining the unique identity and hierarchical ownership of a resource. | Using path parameters for optional filters or search terms (e.g. `/users/:status/:page` instead of `/users?status=active&page=2`). |
| **Strict Routing** | Express setting where `/users` and `/users/` are treated as distinct, non-identical routes. | Assuming Express always treats trailing slashes identically; unconfigured routing can cause SEO duplication and routing mismatches. |

---

## Core Concepts

### 1. The Route Matching Engine (`path-to-regexp`)

Express route matching is governed by the `path-to-regexp` library, which converts route pattern strings into regular expressions with named capturing groups.

When you register a route:
```js
app.get('/users/:userId/posts/:postId', handler);
```
Express compiles this path into a regular expression:
```text
/^\/users\/(?:([^\/#\?]+?))\/posts\/(?:([^\/#\?]+?))\/?$/i
```
When a request arrives (e.g., `/users/102/posts/55`):
1. The regex executes against `req.path`.
2. Captured groups are extracted and mapped to the declared parameter keys (`userId = "102"`, `postId = "55"`).
3. The resulting string values are assigned to `req.params`.

> **CRITICAL**: All extracted parameters in `req.params` are **strings**. Even if the URL is `/users/42`, `typeof req.params.id` is `'string'`, not `'number'`. Explicit numeric casting or schema coercion is mandatory.

---

### 2. Route Shadowing and Precedence Rules

Express evaluates routes in **exact registration order**. It does not perform "longest prefix matching" or "most specific path first" heuristics.

```text
Registration Order:
1. app.get('/users/:id', ...)    ◄── Dynamic Parameter Matcher
2. app.get('/users/me', ...)     ◄── Specific Literal Matcher

Incoming Request: GET /users/me
┌─────────────────────────────────────────────────────────────┐
│ 1. Matches Layer 1: /users/:id                             │
│    req.params.id becomes "me"!                              │
│    Controller queries DB: findById("me") -> 404 or CastError│
├─────────────────────────────────────────────────────────────┤
│ 2. Layer 2: /users/me is NEVER REACHED! (Shadowed!)         │
└─────────────────────────────────────────────────────────────┘
```

#### The Universal Precedence Rule:
Always declare routes in order from **most specific literal** to **most generic parameterized**, ending with **wildcard catch-alls**:

```text
1. Literal Exact Paths:        /users/me, /users/active, /users/export
2. Regex-Constrained Paths:    /users/:id(\\d+)
3. Generic Parameter Paths:    /users/:id
4. Sub-collection Paths:       /users/:id/settings
5. Wildcard Fallback Paths:    /users/*
```

---

### 3. Parameter Middleware Preprocessing (`router.param()`)

The `router.param(name, callback)` method registers middleware that automatically executes whenever a route matches a specified path parameter name.

```text
Request: GET /users/42
   │
   ▼
router.param('userId', async (req, res, next, id) => {
   // 1. Validate ID format (UUID / integer)
   // 2. Fetch user from DB once
   // 3. Attach req.user = user
   // 4. If not found, call next(new NotFoundError())
})
   │
   ▼
router.get('/users/:userId', (req, res) => {
   // User is ALREADY fetched and verified!
   res.json(req.user);
})
```

- **Execution Guarantee**: Parameter middleware runs **exactly once per request-response cycle** for each matching parameter, even if the parameter appears across multiple middleware handlers in the same route.
- **Callback Signature**: `(req, res, next, value, name)`:
  - `req`, `res`, `next`: Standard Express transport objects.
  - `value`: The extracted string value of the parameter (`"42"`).
  - `name`: The parameter key name (`"userId"`).

---

### 4. Nested Routers and `mergeParams: true`

In enterprise REST APIs, resources naturally form parent-child ownership hierarchies:
```text
/organizations/:orgId/projects/:projectId/environments/:envId
```

By default, an `express.Router()` has an isolated parameter scope. If you mount a child router onto a parent route that contains parameters, the child router **cannot see** the parent parameters:

```js
// ❌ BROKEN: req.params.userId is UNDEFINED in child router!
const userRouter = express.Router();
const postRouter = express.Router(); // mergeParams is false by default!

postRouter.get('/:postId', (req, res) => {
  console.log(req.params.userId); // undefined!
  console.log(req.params.postId); // "10"
});

userRouter.use('/:userId/posts', postRouter);
```

#### The Fix: Explicit `mergeParams: true`
Configuring `mergeParams: true` instructs the child router to merge the parent router's `req.params` dictionary into its own:

```js
// ✅ CORRECT: Both userId and postId are available
const postRouter = express.Router({ mergeParams: true });

postRouter.get('/:postId', (req, res) => {
  console.log(req.params.userId); // "42" (From parent mount!)
  console.log(req.params.postId); // "10" (From child route!)
});
```

---

### 5. Path Parameters vs Query Parameters in REST Design

A clear REST contract separates the identity of a resource from how that resource is queried or presented:

| Aspect | Path Parameters (`req.params`) | Query Parameters (`req.query`) |
| :--- | :--- | :--- |
| **Semantic Meaning** | **Resource Identity & Hierarchy** | **Selection, Filtering, & Presentation** |
| **Cardinality** | Identifies a specific unique entity | Filters a collection of entities |
| **Requirement** | Mandatory; omitting it changes URL path | Optional; sensible defaults apply if omitted |
| **HTTP Caching** | Cached as a distinct resource URI | Can participate in query-string cache keys |
| **Example Pattern** | `/teams/:teamId/members/:memberId` | `/teams/:teamId/members?role=admin&limit=20` |

---

## Code Snippets and Demonstrations

### 1. Route Shadowing Prevention and Regex-Constrained Parameters

Demonstrating how to prevent route collisions using strict ordering and inline regular expression parameter constraints.

```js
// Node.js code
// filename: route-precedence-demo.mjs
import express from 'express';

export function createRoutingApp() {
  const app = express();
  app.use(express.json());

  // ✅ RULE 1: Literal routes declared BEFORE parameterized routes
  app.get('/users/me', (req, res) => {
    res.json({ id: 'current_user', type: 'literal_me' });
  });

  app.get('/users/active', (req, res) => {
    res.json({ type: 'literal_active' });
  });

  // ✅ RULE 2: Regex-constrained parameter (Matches numeric IDs ONLY)
  // Non-numeric strings (like "/users/invalid-slug") will NOT match this route!
  app.get('/users/:id(\\d+)', (req, res) => {
    res.json({ id: Number(req.params.id), type: 'numeric_id' });
  });

  // ✅ RULE 3: Generic slug or UUID parameter declared AFTER constrained routes
  app.get('/users/:slug', (req, res) => {
    res.json({ slug: req.params.slug, type: 'generic_slug' });
  });

  return app;
}
```

---

### 2. Automated Entity Hydration via `router.param()`

Using parameter middleware to validate UUID formatting, fetch domain records, and handle 404s centrally.

```js
// Node.js code
// filename: entity-hydration.mjs
import express from 'express';

export function createHydratedRouter(userDatabase) {
  const router = express.Router();

  // Parameter middleware for :userId
  router.param('userId', async (req, res, next, id) => {
    try {
      // 1. Format validation
      if (!id || id.trim().length === 0) {
        return res.status(400).json({ error: 'Malformed user ID' });
      }

      // 2. Database lookup
      const user = await userDatabase.findById(id);
      if (!user) {
        return res.status(404).json({ error: `User with ID "${id}" not found` });
      }

      // 3. Attach pre-fetched entity to request context
      req.userEntity = user;
      next();
    } catch (err) {
      next(err);
    }
  });

  // All downstream routes can immediately access req.userEntity
  router.get('/:userId', (req, res) => {
    res.json({ user: req.userEntity });
  });

  router.put('/:userId', (req, res) => {
    // No need to query DB to check if user exists!
    Object.assign(req.userEntity, req.body);
    res.json({ updated: req.userEntity });
  });

  router.delete('/:userId', (req, res) => {
    userDatabase.delete(req.userEntity.id);
    res.status(204).end();
  });

  return router;
}
```

---

### 3. Multi-Tier Hierarchical Routing with `mergeParams: true`

Constructing an enterprise resource hierarchy: Organizations -> Projects -> Tasks.

```js
// Node.js code
// filename: hierarchical-router.mjs
import express from 'express';

export function createHierarchicalApi() {
  const app = express();
  app.use(express.json());

  // 1. Task Router (Grandchild)
  // Must set mergeParams: true to inherit :orgId and :projectId
  const taskRouter = express.Router({ mergeParams: true });
  
  taskRouter.get('/:taskId', (req, res) => {
    const { orgId, projectId, taskId } = req.params;
    res.json({
      hierarchy: {
        organization: orgId,
        project: projectId,
        task: taskId
      },
      message: 'Successfully extracted full 3-tier hierarchy'
    });
  });

  // 2. Project Router (Child)
  // Must set mergeParams: true to inherit :orgId
  const projectRouter = express.Router({ mergeParams: true });

  projectRouter.get('/:projectId', (req, res) => {
    const { orgId, projectId } = req.params;
    res.json({ organization: orgId, project: projectId });
  });

  // Mount Task router onto Project router
  projectRouter.use('/:projectId/tasks', taskRouter);

  // 3. Organization Router (Parent)
  const orgRouter = express.Router();
  orgRouter.get('/:orgId', (req, res) => {
    res.json({ organization: req.params.orgId });
  });

  // Mount Project router onto Org router
  orgRouter.use('/:orgId/projects', projectRouter);

  // Mount Org router onto App
  app.use('/api/v1/organizations', orgRouter);

  return app;
}
```

---

## Edge Cases and Tricky Scenarios

### 1. Case-Sensitivity and Trailing Slash Normalization

By default, Express treats URL routing as case-insensitive and ignores trailing slashes:
- `/Users/123` matches `app.get('/users/:id')`
- `/users/123/` matches `app.get('/users/:id')`

In high-compliance or strict REST environments, you can enforce strict URL semantics:

```js
// Node.js code
const app = express();

// Treat /users and /users/ as completely distinct routes
app.set('strict routing', true);

// Treat /Users and /users as completely distinct routes
app.set('case sensitive routing', true);
```
- **The Gotcha**: When `strict routing` is enabled, a client calling `GET /users/` receives a 404 if the route was registered as `app.get('/users')`. Ensure reverse proxies (Nginx/Cloudflare) or middleware normalize trailing slashes before hitting strict router rules.

### 2. URL-Encoded Characters in Path Parameters

When path parameters contain special characters (such as emails or encoded slashes):
- A request to `/users/john%2Bdoe%40gmail.com`
- Express automatically decodes path parameters using `decodeURIComponent`. Inside the handler, `req.params.email` is `"john+doe@gmail.com"`.
- However, encoded slashes (`%2F`) are often rejected or normalized by reverse proxies or Node's HTTP parser before reaching Express. Never pass arbitrary paths as raw path parameters; use base64 encoding or pass them in query parameters.

---

## Node.js, JavaScript, and Systems Connections

```text
┌──────────────────────────────────────────────────────────────┐
│ V8 RegExp Engine                                             │
│ - path-to-regexp compiles route paths to optimized RegExp    │
│ - RegExp Named Capturing Groups match URL segments           │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Express Router Hierarchy                                     │
│ - Parent Router (Mount: /api/v1/teams/:teamId)               │
│   └── Child Router (mergeParams: true preserves scope)       │
│       └── Grandchild Route (req.params contains full union)  │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Node.js Native HTTP URL Parsing                              │
│ - req.url divided into pathname and search parameters        │
│ - decodeURIComponent cleans parameter payloads              │
└──────────────────────────────────────────────────────────────┘
```

- **V8 Regular Expressions**: Route patterns are compiled once when the application boots and cached as native regular expressions inside each `Layer` object, ensuring fast $O(N)$ path matching per request.
- **Scope Inheritance**: `mergeParams: true` uses JavaScript's `Object.assign()` to shallow-copy the parent's `req.params` dictionary into the child router's context at the moment of sub-router dispatch.

---

## Hands-On Exercise

### Scenario
An e-commerce API has two severe routing bugs in production:
1. When users call `GET /products/trending`, the server returns a 400 Bad Request error stating `"Invalid product ID: trending"`, because `/products/:id` was registered before `/products/trending`.
2. When mobile clients request `/categories/:catId/products/:prodId`, the controller crashes with `TypeError: Cannot read properties of undefined` because `catId` is missing inside the nested router.

### Buggy Code

```js
// Node.js code
// filename: buggy-routing.mjs
const express = require('express');
const app = express();

// ❌ BUG 1: Broad route registered before literal route shadows /products/trending!
app.get('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID: ' + req.params.id });
  }
  res.json({ id, name: 'Sample Product' });
});

app.get('/products/trending', (req, res) => {
  res.json({ items: ['Product A', 'Product B'] });
});

// ❌ BUG 2: Child router instantiated WITHOUT mergeParams: true!
const nestedProductRouter = express.Router(); // Missing { mergeParams: true }

nestedProductRouter.get('/:prodId', (req, res) => {
  // req.params.catId is undefined!
  const catId = req.params.catId.toUpperCase();
  res.json({ category: catId, product: req.params.prodId });
});

app.use('/categories/:catId/products', nestedProductRouter);

module.exports = app;
```

### Acceptance Criteria
1. Re-order product routes so `/products/trending` executes without being shadowed by `/products/:id`.
2. Constrain `/products/:id` so it only matches valid numeric IDs.
3. Configure the nested product router with `mergeParams: true` so parent category parameters are accessible.
4. Provide a test suite using `node:test` verifying that `/products/trending` returns trending items, `/products/100` returns the item, and nested `/categories/tech/products/45` extracts both parameters cleanly.

### Solution Code

```js
// Node.js code
// filename: solution-routing.mjs
import express from 'express';

export function createFixedRoutingApp() {
  const app = express();
  app.use(express.json());

  // ✅ FIX 1: Literal route placed BEFORE parameterized routes
  app.get('/products/trending', (req, res) => {
    res.json({ items: ['Product A', 'Product B'] });
  });

  // ✅ FIX 2: Constrained to digits only via regex
  app.get('/products/:id(\\d+)', (req, res) => {
    res.json({ id: Number(req.params.id), name: 'Sample Product' });
  });

  // ✅ FIX 3: mergeParams: true enables parent parameter inheritance
  const nestedProductRouter = express.Router({ mergeParams: true });

  nestedProductRouter.get('/:prodId', (req, res) => {
    const { catId, prodId } = req.params;
    if (!catId) {
      return res.status(500).json({ error: 'catId missing from routing context' });
    }
    res.json({ category: catId.toUpperCase(), product: prodId });
  });

  app.use('/categories/:catId/products', nestedProductRouter);

  return app;
}
```

Accompanying test suite:
```js
// Node.js code
// filename: solution-routing.test.mjs
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createFixedRoutingApp } from './solution-routing.mjs';

describe('Express Routing Precedence and Parameter Tests', () => {
  it('correctly serves literal route without shadowing', async () => {
    const app = createFixedRoutingApp();
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      // 1. Test /products/trending
      const res = await fetch(`http://127.0.0.1:${port}/products/trending`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.deepEqual(body, { items: ['Product A', 'Product B'] });

      // 2. Test /products/123
      const numRes = await fetch(`http://127.0.0.1:${port}/products/123`);
      assert.equal(numRes.status, 200);
      const numBody = await numRes.json();
      assert.equal(numBody.id, 123);

      // 3. Test nested parameters with mergeParams: true
      const nestedRes = await fetch(`http://127.0.0.1:${port}/categories/electronics/products/prod_99`);
      assert.equal(nestedRes.status, 200);
      const nestedBody = await nestedRes.json();
      assert.deepEqual(nestedBody, {
        category: 'ELECTRONICS',
        product: 'prod_99'
      });
    } finally {
      server.close();
    }
  });
});
```

### Solution Explanation
1. **Precedence Inversion**: Registering `/products/trending` above the parameterized route guarantees that requests for `"trending"` are matched directly by the literal handler before any pattern evaluations occur.
2. **Regex Constraint**: Adding `(\\d+)` ensures that non-numeric segments do not accidentally trigger the numeric product handler.
3. **`mergeParams: true` Activation**: Passing `{ mergeParams: true }` to `express.Router` forces Express to merge the parent mount's `:catId` with the child's `:prodId`, making both parameters available on `req.params`.

---

## Summary

- Express translates route patterns into regular expressions via `path-to-regexp`, capturing named segments into `req.params` as strings.
- Routes are evaluated strictly in registration order. Literal routes must always be registered before parameterized routes to prevent route shadowing.
- `router.param(name, callback)` provides automatic, deduplicated entity hydration and parameter validation across route handlers.
- Nested routers require `express.Router({ mergeParams: true })` to inherit parent mount parameters.
- Path parameters define resource identity and hierarchy; query parameters provide optional filtering, sorting, and pagination.

---

## Cheat Sheet

| Feature / Setting | Syntax | Primary Use Case |
| :--- | :--- | :--- |
| **Numeric Param** | `/users/:id(\\d+)` | Restrict parameter matching strictly to numeric characters |
| **Optional Param** | `/reports/:year/:month?` | Make trailing route segments optional |
| **Parameter Preprocessing** | `router.param('id', fn)` | Hydrate and validate entity once for all matching routes |
| **Nested Param Merge** | `express.Router({ mergeParams: true })` | Inherit parent route parameters in sub-routers |
| **Strict Routing** | `app.set('strict routing', true)` | Treat `/users` and `/users/` as distinct paths |
| **Case-Sensitive Routing**| `app.set('case sensitive routing', true)` | Differentiate uppercase and lowercase URL paths |

### Common Pitfalls
- **Registering `:id` before literal paths**: Causes `/users/:id` to intercept `/users/me` and `/users/export`.
- **Forgetting `mergeParams: true`**: Leaves parent path parameters `undefined` inside nested child routers.
- **Assuming `req.params` values are numbers**: All path parameters are strings; `typeof req.params.id === 'string'`.
- **Using path parameters for search queries**: Pollutes URL paths and breaks standard REST caching conventions.

---

## Interview Questions

### 1. What is route shadowing in Express, what causes it, and how do you prevent it in large API codebases?

Route shadowing occurs when an overly broad or parameterized route is registered in the routing table before a more specific or literal route, causing the broad route to intercept matching requests.

Because Express evaluates routes in strict registration order through its internal `app._router.stack` array, it executes the first route whose regular expression matches the incoming path. For example, if `app.get('/users/:id')` is registered before `app.get('/users/me')`, an incoming request for `/users/me` satisfies the regular expression for `/users/:id` (with `req.params.id` assigned the string value `"me"`). Express dispatches the handler for `:id`, preventing `/users/me` from ever executing.

To prevent route shadowing:
1. **Strict Declaration Order**: Always declare literal/static routes (`/users/me`, `/users/summary`) prior to dynamic parameterized routes (`/users/:id`).
2. **Regex Constraints**: Add regular expression constraints to dynamic parameters (e.g., `/users/:id(\\d+)` or `/users/:id([0-9a-fA-F-]{36})`) so non-conforming literal strings do not match.
3. **Automated Linting**: Use architectural linters or organized route manifest modules to enforce route ordering standards.

### 2. How does `router.param()` work, and what are its architectural advantages over standard route middleware?

`router.param(name, callback)` registers parameter middleware that executes whenever an incoming request matches a route containing the specified parameter name. Its signature is `(req, res, next, value, name)`.

Key architectural advantages include:
1. **Single Execution Guarantee**: Parameter middleware executes **exactly once per request** for each matching parameter, even if that parameter is part of a route that contains multiple chained middleware functions.
2. **Centralized Entity Hydration**: Instead of querying the database to find the entity in every route handler (e.g. `GET /users/:id`, `PUT /users/:id`, `DELETE /users/:id`), the lookup logic is centralized in one place. If the record is found, it is attached to `req.userEntity`; if not found, it immediately responds with a 404 or invokes `next(new NotFoundError())`.
3. **Format Validation**: It acts as a gatekeeper, verifying that parameter formats (like UUIDs or MongoDB ObjectIDs) are structurally valid before reaching any business controllers.

### 3. Why is `mergeParams: true` necessary when designing nested Express routers, and what happens under the hood if it is omitted?

When an Express application mounts a sub-router using a parameterized path:
```js
app.use('/organizations/:orgId/projects', projectRouter);
```
Express creates two separate routing layers: the parent router stack and the child `projectRouter` stack.

By default, an `express.Router()` has an isolated parameter dictionary. When a request matches `/organizations/10/projects/50`, the parent router matches `/organizations/:orgId` and populates `req.params.orgId = "10"`. However, when control transitions into the child `projectRouter`, Express instantiates a fresh `req.params` dictionary for the sub-router. If `mergeParams` is not explicitly set to `true`, the parent's parameters are discarded from that scope, and `req.params.orgId` becomes `undefined` inside the child router handlers.

Setting `mergeParams: true` instructs Express to merge the parent's `req.params` dictionary into the child router's dictionary via `Object.assign()`, ensuring that all path parameters across the entire nested hierarchy remain accessible to child route handlers.

### 4. What are the key criteria for deciding whether a parameter belongs in `req.params` versus `req.query` in REST API design?

The decision between Path Parameters (`req.params`) and Query Parameters (`req.query`) is governed by resource identity versus presentation semantics:

1. **Use Path Parameters (`req.params`) for Identity and Hierarchy**:
   - Path parameters uniquely identify a specific resource or define hierarchical ownership (e.g., `/departments/:deptId/employees/:empId`).
   - Path parameters are mandatory parts of the URL; omitting them fundamentally alters the destination resource.
   - They represent resources that can be uniquely addressed and cached independently by CDNs and HTTP proxies.

2. **Use Query Parameters (`req.query`) for Modifiers and Selection**:
   - Query parameters specify operations on a collection, such as filtering (`?status=active`), pagination (`?page=2&limit=50`), sorting (`?sort=-createdAt`), and search (`?q=keyword`).
   - Query parameters are optional; omitting them yields a default representation of the collection.
   - They do not represent resource identity, but rather how the resource data should be shaped, filtered, or projected for the client.

---

<nav aria-label="Lecture navigation">

[← Previous: Express Middleware and Request Flow](day-14-express-middleware-and-request-flow.md) | [Roadmap](../node-roadmap.md) | [Next: Express Input Validation and Serialization](day-16-express-input-validation-and-serialization.md)

</nav>