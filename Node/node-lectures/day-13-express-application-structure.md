# Day 13: Express Application Structure

<nav aria-label="Lecture navigation">

[Previous: Testing, Diagnostics, Observability, and Shutdown](day-12-testing-diagnostics-observability-and-shutdown.md) | [Roadmap](../node-roadmap.md) | [Next: Express Middleware and Request Flow](day-14-express-middleware-and-request-flow.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain what Express adds on top of Node's HTTP layer.
- Separate app construction from server startup.
- Structure a Node backend around routes, controllers, services, and repositories.
- Spot common issues caused by starting a server during module import.
- Choose a clean boundary for config, database, and external dependencies.

## Prerequisites

- [Day 09: Node HTTP Fundamentals](day-09-node-http-fundamentals.md)
- [Day 12: Testing, Diagnostics, Observability, and Shutdown](day-12-testing-diagnostics-observability-and-shutdown.md)
- JavaScript lecture on modules and async behavior

Express is a framework for HTTP applications. It does not replace Node's runtime, request lifecycle, streams, or event loop. It adds routing, middleware, response helpers, and a strong convention for organizing request handling.

## Core Concepts

### 1. Express sits on Node HTTP

An Express app is still a Node process with an HTTP server underneath it. Express builds on the standard `http` module and adds convenient APIs for requests, responses, routing, and middleware.

```js
const express = require("express");

const app = express();

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

module.exports = app;
```

This is not a running server yet. It only defines the application. A separate `listen()` call starts the HTTP server and binds a port.

### 2. App factory pattern

A production service should usually export a factory function so tests and different environments can create an app without side effects.

```js
function createApp({ logger, db }) {
  const app = express();

  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({ ok: true, db: db.isConnected() });
  });

  return app;
}

module.exports = { createApp };
```

This keeps module import safe and makes test setup easier.

### 3. Use layers, not one giant handler

A request should usually move through clear boundaries:

- route or controller: parse request and map it to domain intent
- service: apply business rules and cross-cutting behavior
- repository: query or persist data
- config and infrastructure: database connections, logger, secret access, queue clients

Good layering means one layer depends on the layer below it, but not back upward.

### 4. Dependency injection helps testability

A route should not reach into global state to get a database client or logger. It is better to construct the app with dependencies at startup and pass them through function arguments or instance fields.

```js
function createUserRouter({ userService }) {
  const router = express.Router();

  router.post("/users", async (req, res, next) => {
    try {
      const user = await userService.create(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
```

This shapes better tests and simpler changes when the database or logger changes.

## Detailed Explanations and Traces

### The import-time problem

A common mistake is to start the server as soon as a module is imported:

```js
const express = require("express");
const app = express();

app.listen(3000);
module.exports = app;
```

This makes tests and module reuse awkward. It also risks opening ports during import, which can create random side effects in worker processes or test suites.

The safer form is:

```js
const express = require("express");

function createApp() {
  const app = express();
  app.get("/health", (req, res) => res.json({ ok: true }));
  return app;
}

if (require.main === module) {
  const app = createApp();
  app.listen(3000);
}

module.exports = { createApp };
```

The exact `require.main === module` check is a Node runtime pattern. It means "only start listening when this file is the entry point, not when it is imported by tests or other modules."

### Request flow in a layered app

A typical Express app may look like this:

```js
const express = require("express");
const { createUserService } = require("./services/userService");
const { createUserRepo } = require("./repositories/userRepo");

function createApp({ db, logger }) {
  const app = express();
  const userRepo = createUserRepo({ db });
  const userService = createUserService({ userRepo, logger });

  app.use(express.json());

  app.post("/users", async (req, res, next) => {
    try {
      const user = await userService.create(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  });

  return app;
}
```

This keeps HTTP-specific code near the route boundary while the service owns business rules.

### Why app structure matters in Node

Node processes can be long-lived. If the application mixes HTTP concerns, business logic, and database connections in one place, debugging becomes harder and every tiny change can alter request flow or startup order. A clear structure keeps operational issues easier to isolate.

## Common Mistakes and Interview Traps

- Starting the server when the module is imported.
- Injecting globals instead of passing dependencies.
- Putting database queries directly in route handlers.
- Mixing HTTP error translation with domain validation.
- Creating a single giant `app.js` file that does everything.

## Tricky Points

- `app.listen()` starts the network server; it does not magically make the app more testable.
- An Express app object is just a request handler pipeline; it is not a database or service container by itself.
- The right boundary depends on your app size. Small apps may keep things compact, but the same principles still apply.

## Practical Exercise

**Goal:** Build an app factory for a small user API.

**Inputs and outputs:** Accept a JSON body for user creation, return a JSON result, and support a `/health` route.

**Constraints:** Keep configuration and database dependencies injected, make module import side-effect free, and export app creation separately from startup.

**Acceptance criteria:** The app can be created in tests without opening a port, and the route creates a user via a service layer.

## Summary

- Express is a framework over Node's HTTP capabilities.
- Exporting app factories keeps code testable and side-effect free.
- Routes should delegate to services, which delegate to repositories or external systems.
- The right structure avoids hidden global state and makes failure handling predictable.

## Cheat Sheet

| Concern | Pattern |
|---|---|
| Start server | `app.listen()` only in entry point |
| App creation | `createApp({ deps })` |
| Request handling | route -> service -> repository |
| Dependency access | inject, do not reach into globals |
| Error path | pass to centralized Express error middleware |

## Interview Questions

1. **Definition:** Why is app factory structure useful in a Node service?
   - **Expected answer:** It prevents import-time side effects, improves tests, and isolates startup from configuration.
   - **Follow-up:** What breaks if `listen()` runs on import?

2. **Design:** What is the difference between a route and a service in a backend application?
   - **Expected answer:** A route handles transport details and request mapping; a service holds business logic and uses repositories.
   - **Follow-up:** Where should validation live?

3. **Debugging:** You see tests opening random ports or failing because the app starts multiple times.
   - **Expected answer:** Export a factory and avoid server startup at import time.
   - **Follow-up:** Why is this more important in Node than in a browser app?

4. **Architectural tradeoff:** When is a single-file app acceptable and when is it a smell?
   - **Expected answer:** Small prototypes are fine; long-lived services need boundaries and dependency injection.
   - **Follow-up:** How do you decide the right boundary for a repository?

<nav aria-label="Lecture navigation">

[Previous: Testing, Diagnostics, Observability, and Shutdown](day-12-testing-diagnostics-observability-and-shutdown.md) | [Roadmap](../node-roadmap.md) | [Next: Express Middleware and Request Flow](day-14-express-middleware-and-request-flow.md)

</nav>