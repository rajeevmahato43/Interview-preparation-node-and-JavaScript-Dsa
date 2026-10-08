# Day 26: MongoDB in Express

<nav aria-label="Lecture navigation">

[← Previous: MongoDB Atomicity, Transactions, and Retries](day-25-mongodb-atomicity-transactions-and-retries.md) | [Roadmap](../node-roadmap.md) | [Next: PostgreSQL and `pg` Pool Lifecycle](day-27-postgresql-and-pg-pool-lifecycle.md)

</nav>

## Prerequisites

Before diving into Express + MongoDB integration, review:
- [Day 13: Express Application Structure](day-13-express-application-structure.md) for 4-layer backend architecture and App Factories.
- [Day 17: Async Express and Centralized Errors](day-17-async-express-and-centralized-errors.md) for RFC 7807 problem details and driver error translation.
- [Day 21: MongoDB Driver Lifecycle and BSON](day-21-mongodb-driver-lifecycle-and-bson.md) for `MongoClient` pooling and BSON `ObjectId` mechanics.
- [Day 25: MongoDB Atomicity, Transactions, and Retries](day-25-mongodb-atomicity-transactions-and-retries.md) for transactions and session management.
---

## Core Concepts

### 1. End-to-End Architectural Layering

In a production Express + MongoDB application, dependencies flow strictly inward. HTTP concepts never enter repositories, and database objects never escape controllers:

```text
[HTTP Ingress: POST /api/v1/articles]
                │
                ▼
┌──────────────────────────────────────┐
│ Express Router & Controller Layer    │  - Extracts req.body, req.params
│                                      │  - Enforces schema validation (Zod)
└──────────────────┬───────────────────┘  - Never imports MongoClient or collection!
                   │ Plain Domain DTO ({ title, body, authorId })
                   ▼
┌──────────────────────────────────────┐
│ Domain Service Layer                 │  - Enforces business rules & invariants
│                                      │  - Orchestrates transactions
└──────────────────┬───────────────────┘  - Agnostic to Express and MongoDB!
                   │ Calls repository methods (create, findById)
                   ▼
┌──────────────────────────────────────┐
│ MongoDB Repository Layer             │  - Converts IDs to BSON ObjectId
│                                      │  - Issues MongoDB driver commands
└──────────────────┬───────────────────┘  - Applies maxTimeMS deadlines
                   │ Translates E11000 -> Domain ConflictError
                   ▼
[MongoDB Replica Set (Wire Protocol)]
```

---

### 2. Guarding Connection Pools with `maxTimeMS` Deadlines

> **`maxTimeMS`**: A MongoDB query option instructing the database server to abort query execution if processing exceeds a specified time budget.

A critical stability pattern when using MongoDB in web applications is enforcing database-side query deadlines:

```text
HTTP Client Request (5000ms Total Budget)
  │
  ├── Controller Timeout: 4500ms (AbortSignal)
  │
  └── Database maxTimeMS: 3000ms
        │
        ▼
  If unindexed query scans 5,000,000 documents:
  Server aborts query after 3000ms!
  Returns MongoServerError: operation exceeded time limit
  Socket returns to pool immediately!
```

- When an un-indexed query or aggregation runs slowly, client-side timeouts (like `setTimeout`) only stop the client from waiting; the database server continues scanning documents for minutes, keeping WiredTiger cache pinned and consuming database CPU.
- Passing `.maxTimeMS(3000)` instructs the MongoDB server to actively terminate query execution if it exceeds 3 seconds, preserving cluster resources.

---

### 3. Centralized MongoDB Driver Error Translation

When database errors occur, the repository layer catches low-level driver exceptions and translates them into domain errors:

| Driver Error / Code | Root Cause | Target Domain Error | Target HTTP Status |
| :--- | :--- | :--- | :--- |
| **`code: 11000`** (`E11000`) | Unique index violation (duplicate key) | `ConflictError` | **HTTP 409 Conflict** |
| **`BSONTypeError`** | Malformed 24-character hexadecimal ID | `ValidationError` | **HTTP 422 Unprocessable Entity** |
| **`MongoServerSelectionError`**| Cannot locate reachable primary node | `ServiceUnavailableError` | **HTTP 503 Service Unavailable** |
| **`MongoNetworkError`** | TCP socket severed / connection timeout | `ServiceUnavailableError` | **HTTP 503 Service Unavailable** |
| **`MongoExecutionTimeout`** | Query exceeded `maxTimeMS` deadline | `GatewayTimeoutError` | **HTTP 504 Gateway Timeout** |

---

### 4. Health Checks: Liveness vs Readiness with MongoDB

Kubernetes and load balancers must be informed whether a specific container instance is ready to process traffic:

```text
Incoming Ingress Checks:
├── /livez  (Liveness Probe)  ──► Checks ONLY Node.js event loop (res.send('OK'))
│                                 ⚠️ NEVER pings MongoDB! (Prevents pod restart storms!)
│
└── /readyz (Readiness Probe) ──► Pings MongoDB: db.command({ ping: 1 })
                                  - If ping succeeds -> 200 OK (Pod receives traffic)
                                  - If DB unreachable -> 503 Service Unavailable
                                    (Pod detached from ingress; NOT restarted!)
```

---

### 5. MongoDB vs PostgreSQL: The Architectural Selection Matrix

When designing a new service, deciding between MongoDB and PostgreSQL is an architectural tradeoff:

```text
Decision Guide:
├── Highly polymorphic, nested, or evolving document shapes? ────► MONGODB
├── Read-heavy workloads modeled around single document views? ──► MONGODB
├── Sharded massive write throughput across distributed nodes? ─► MONGODB
│
├── Strict foreign keys, cascade constraints, relational joins? ─► POSTGRESQL
├── High-concurrency financial ledgers with complex relations? ──► POSTGRESQL
└── Advanced SQL window functions, CTEs, and relational schemas? ─► POSTGRESQL
```

| Dimension | MongoDB | PostgreSQL |
| :--- | :--- | :--- |
| **Primary Data Model** | Hierarchical BSON Documents | Relational Tables & Tuples |
| **Schema Enforcement** | Dynamic / Application-Level / JSON Schema | Strict DDL Schema Definitions |
| **Joins** | `$lookup` (Coarse aggregation joins) | Advanced Relational Hash/Merge Joins |
| **Transactions** | Single-Doc (Native) / Multi-Doc (Replica sets) | Full ACID Multi-Table Transactions |
| **Scaling Strategy** | Horizontal Native Sharding | Vertical Scaling / Read Replicas / Partitioning |

---

## Code Snippets and Demonstrations

### 1. Enterprise MongoDB Article Repository

Implementing CRUD operations with BSON mapping, `maxTimeMS` protection, and error translation.

```js
// Node.js code
// filename: article-mongo-repository.mjs
import { ObjectId } from 'mongodb';

export class DomainError extends Error {
  constructor(msg, code, status) { super(msg); this.code = code; this.statusCode = status; }
}
export class DuplicateSlugError extends DomainError {
  constructor(slug) { super(`Article with slug "${slug}" already exists`, 'SLUG_CONFLICT', 409); }
}
export class ArticleNotFoundError extends DomainError {
  constructor(id) { super(`Article with ID "${id}" was not found`, 'NOT_FOUND', 404); }
}
export class InvalidIdError extends DomainError {
  constructor(id) { super(`Invalid identifier format: "${id}"`, 'INVALID_ID', 422); }
}

export class ArticleMongoRepository {
  constructor(db) {
    this.collection = db.collection('articles');
  }

  static toObjectId(idStr) {
    if (!idStr || !/^[0-9a-fA-F]{24}$/.test(idStr)) {
      throw new InvalidIdError(idStr);
    }
    return new ObjectId(idStr);
  }

  async createArticle({ slug, title, body, authorId, tags = [] }) {
    const doc = {
      slug: slug.toLowerCase().trim(),
      title: title.trim(),
      body,
      authorId: ArticleMongoRepository.toObjectId(authorId),
      tags: [...new Set(tags)],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const res = await this.collection.insertOne(doc);
      return { id: res.insertedId.toHexString(), ...doc };
    } catch (err) {
      if (err.code === 11000) {
        throw new DuplicateSlugError(slug);
      }
      throw err;
    }
  }

  async findById(idStr, timeoutMs = 2500) {
    const objectId = ArticleMongoRepository.toObjectId(idStr);

    // Apply maxTimeMS to guard against server-side hangs
    const doc = await this.collection.findOne(
      { _id: objectId },
      { maxTimeMS: timeoutMs }
    );

    if (!doc) throw new ArticleNotFoundError(idStr);

    return {
      id: doc._id.toHexString(),
      slug: doc.slug,
      title: doc.title,
      body: doc.body,
      authorId: doc.authorId.toHexString(),
      tags: doc.tags,
      createdAt: doc.createdAt
    };
  }

  async listRecentArticles(limit = 20, timeoutMs = 3000) {
    const cursor = this.collection
      .find({}, { projection: { body: 0 }, maxTimeMS: timeoutMs })
      .sort({ createdAt: -1 })
      .limit(limit);

    const docs = await cursor.toArray();
    return docs.map(d => ({
      id: d._id.toHexString(),
      slug: d.slug,
      title: d.title,
      tags: d.tags,
      createdAt: d.createdAt
    }));
  }
}
```

---

### 2. Express Controller and Route Wiring

Mapping domain service methods to HTTP endpoints with clean parameter extraction.

```js
// Node.js code
// filename: article-controller.mjs
import express from 'express';

export function createArticleRouter({ articleRepo }) {
  const router = express.Router();

  // POST /api/articles
  router.post('/', async (req, res, next) => {
    try {
      const { slug, title, body, authorId, tags } = req.body || {};

      if (!slug || !title || !authorId) {
        return res.status(400).json({ error: 'slug, title, and authorId are required' });
      }

      const created = await articleRepo.createArticle({ slug, title, body, authorId, tags });
      res.status(201).json({ data: created });
    } catch (err) {
      next(err); // Centralized error handler maps DomainError
    }
  });

  // GET /api/articles/:id
  router.get('/:id', async (req, res, next) => {
    try {
      const article = await articleRepo.findById(req.params.id);
      res.json({ data: article });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/articles
  router.get('/', async (req, res, next) => {
    try {
      const limit = Number(req.query.limit) || 20;
      const articles = await articleRepo.listRecentArticles(limit);
      res.json({ data: articles });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
```

---

### 3. Production Composition Root and Server Bootstrap

> **Composition Root**: The single location in the application where the `MongoClient` is initialized and injected into repositories, services, and controllers.

Initializing MongoDB pooling, wiring routes, handling health checks, and orchestrating graceful shutdown.

```js
// Node.js code
// filename: server-bootstrap.mjs
import express from 'express';
import http from 'node:http';
import { MongoClient } from 'mongodb';
import { ArticleMongoRepository, DomainError } from './article-mongo-repository.mjs';
import { createArticleRouter } from './article-controller.mjs';

export function createApp({ db, isShuttingDownRef }) {
  const app = express();
  app.use(express.json({ limit: '50kb' }));

  // 1. Kubernetes Liveness Probe: Never checks database
  app.get('/livez', (req, res) => res.status(200).send('OK'));

  // 2. Kubernetes Readiness Probe: Checks shutdown state & pings database
  app.get('/readyz', async (req, res) => {
    if (isShuttingDownRef.value) {
      return res.status(503).send('SHUTTING_DOWN');
    }

    try {
      // Execute lightweight administrative ping command
      await db.command({ ping: 1 }, { maxTimeMS: 1500 });
      res.status(200).send('READY');
    } catch (err) {
      res.status(503).send('DATABASE_UNAVAILABLE');
    }
  });

  // 3. Mount Business Routers
  const articleRepo = new ArticleMongoRepository(db);
  app.use('/api/articles', createArticleRouter({ articleRepo }));

  // 4. Centralized RFC 7807 Error Handler
  app.use((err, req, res, next) => {
    if (err instanceof DomainError) {
      return res.status(err.statusCode).json({
        type: `https://api.example.com/errors/${err.code.toLowerCase()}`,
        title: err.name,
        status: err.statusCode,
        detail: err.message,
        code: err.code
      });
    }

    console.error('[UNHANDLED_ERROR]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}

export async function bootstrap(mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017') {
  const isShuttingDownRef = { value: false };

  console.log('[Bootstrap] Initializing MongoClient...');
  const client = new MongoClient(mongoUri, {
    maxPoolSize: 50,
    minPoolSize: 10,
    serverSelectionTimeoutMS: 5000
  });

  await client.connect();
  const db = client.db('production_db');

  // Ensure unique index on slug
  await db.collection('articles').createIndex({ slug: 1 }, { unique: true });

  const app = createApp({ db, isShuttingDownRef });
  const server = http.createServer(app);

  // Graceful Shutdown Coordinator
  const shutdown = async (signal) => {
    if (isShuttingDownRef.value) return;
    isShuttingDownRef.value = true;
    console.log(`[Shutdown] Received ${signal}. Draining HTTP server...`);

    server.close(async () => {
      console.log('[Shutdown] HTTP ingress stopped. Draining MongoDB connection pool...');
      try {
        await client.close();
        console.log('[Shutdown] Teardown complete. Exiting.');
        process.exit(0);
      } catch (err) {
        console.error('[Shutdown] Error during client close:', err);
        process.exit(1);
      }
    });

    if (server.closeIdleConnections) server.closeIdleConnections();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  return { server, client, db };
}
```

---

## Edge Cases and Tricky Scenarios

### 1. The Broken Slug Duplicate Check Race Condition

A common beginner mistake in Express controllers is checking if a slug exists before inserting:
```js
// ❌ ANTI-PATTERN: Read-then-write race condition!
const existing = await articles.findOne({ slug });
if (existing) throw new ConflictError();
await articles.insertOne({ slug, ...data });
```
- **The Bug**: If two identical requests arrive within 5ms of each other, both find nothing, and both proceed to insert.
- **The Correct Architecture**: Rely on a unique database index (`createIndex({ slug: 1 }, { unique: true })`). Attempt the insert directly and catch the driver's `E11000` duplicate key exception, mapping it cleanly to an HTTP 409 Conflict.

### 2. Client Disconnect While Streaming Large MongoDB Cursors

When an Express route streams a massive collection to a client:
```js
// Node.js code
app.get('/export', async (req, res) => {
  const cursor = db.collection('data').find({});
  for await (const doc of cursor) {
    if (res.writableEnded || req.destroyed) {
      await cursor.close(); // MUST explicitly close cursor on client disconnect!
      break;
    }
    res.write(JSON.stringify(doc) + '\n');
  }
  res.end();
});
```
- If the user closes their browser tab mid-download and the application does not listen to `req.on('close')`, the MongoDB driver continues fetching batches over the network, wasting server memory and database bandwidth.

---

## Node.js, JavaScript, and Systems Connections

```text
┌──────────────────────────────────────────────────────────────┐
│ V8 Execution Context                                         │
│ - Lexical Closures (Dependency injection via App Factory)    │
│ - DomainError Prototypes (Centralized status code routing)   │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Express Framework Pipeline                                   │
│ - Router Controllers (Decoupled from Mongo driver)           │
│ - Centralized RFC 7807 Error Middleware                      │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ MongoDB Driver Protocol & Storage Engine                     │
│ - maxTimeMS (Cancels server execution on deadline expiry)    │
│ - Unique Index B-Trees (Throws code 11000 on collisions)     │
│ - db.command({ ping: 1 }) (Validates cluster health)         │
└──────────────────────────────────────────────────────────────┘
```

- **Kernel Socket Draining**: `server.close()` allows in-flight HTTP responses to finish transmitting before `client.close()` terminates the database TCP sockets.
- **WiredTiger Deadlines**: `maxTimeMS` communicates over the wire protocol, instructing WiredTiger's query executor to interrupt B-Tree scans without waiting for full query completion.

---

## Hands-On Exercise

### Scenario
An article publishing API suffers from multiple production issues:
1. When authors submit articles with duplicate slugs, the API crashes with an unhandled 500 error leaking raw MongoDB `E11000 duplicate key` database strings.
2. When users request invalid article IDs (e.g. `/api/articles/invalid-slug`), the driver throws a `BSONTypeError` that crashes the endpoint with an unhandled exception.
3. The Kubernetes liveness probe executes a slow aggregation query on the database; when the database experiences high load, Kubernetes restarts all API pods simultaneously.

### Buggy Code

```js
// Node.js code
// filename: buggy-articles-express.mjs
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();
app.use(express.json());

let db;

// ❌ ANTI-PATTERN 1: Liveness probe queries database! Causes pod restart cascades!
app.get('/health', async (req, res) => {
  const count = await db.collection('articles').countDocuments();
  res.json({ status: 'ok', count });
});

// ❌ ANTI-PATTERN 2: Direct driver calls in route + unhandled 11000 duplicate key crash!
app.post('/articles', async (req, res, next) => {
  try {
    const { slug, title } = req.body;
    const doc = await db.collection('articles').insertOne({ slug, title });
    res.status(201).json(doc);
  } catch (err) {
    // Leaks raw MongoDB E11000 stack trace in 500 response!
    res.status(500).json({ error: err.message });
  }
});

// ❌ ANTI-PATTERN 3: new ObjectId() throws unhandled BSONTypeError on malformed strings!
app.get('/articles/:id', async (req, res) => {
  const doc = await db.collection('articles').findOne({ _id: new ObjectId(req.params.id) });
  res.json(doc);
});

module.exports = app;
```

### Acceptance Criteria
1. Separate Liveness (`/livez`) and Readiness (`/readyz`), ensuring liveness checks only the Node.js process and readiness uses `db.command({ ping: 1 })`.
2. Abstract database operations into an `ArticleMongoRepository`.
3. Catch MongoDB code `11000` and map it to an HTTP 409 Conflict error with a clear message.
4. Validate that `id` parameters are 24-character hex strings before creating `ObjectId`, returning HTTP 422 on invalid formats.
5. Provide a test suite using `node:test` verifying that duplicate slugs return 409 and malformed IDs return 422.

### Solution Code

```js
// Node.js code
// filename: solution-articles-express.mjs
import express from 'express';
import { ObjectId } from 'mongodb';

export class DomainError extends Error {
  constructor(msg, code, status) { super(msg); this.code = code; this.statusCode = status; }
}

export function createFixedArticleApp(db) {
  const app = express();
  app.use(express.json());

  // ✅ FIX 1: Decoupled Liveness & Readiness Probes
  app.get('/livez', (req, res) => res.status(200).send('OK'));
  app.get('/readyz', async (req, res) => {
    try {
      await db.command({ ping: 1 });
      res.status(200).send('READY');
    } catch {
      res.status(503).send('UNAVAILABLE');
    }
  });

  // ✅ FIX 2 & 3: Safe Repository with Duplicate Key Handling
  const collection = db.collection('articles');

  app.post('/articles', async (req, res, next) => {
    try {
      const { slug, title } = req.body || {};
      if (!slug || !title) return res.status(400).json({ error: 'slug and title are required' });

      try {
        const doc = { slug: slug.trim().toLowerCase(), title: title.trim(), createdAt: new Date() };
        const result = await collection.insertOne(doc);
        res.status(201).json({ id: result.insertedId.toHexString(), ...doc });
      } catch (dbErr) {
        if (dbErr.code === 11000) {
          throw new DomainError(`Slug "${slug}" already exists`, 'SLUG_CONFLICT', 409);
        }
        throw dbErr;
      }
    } catch (err) {
      next(err);
    }
  });

  // ✅ FIX 4: Parameter Validation Before ObjectId Construction
  app.get('/articles/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new DomainError(`Invalid article ID format: "${id}"`, 'INVALID_ID', 422);
      }

      const doc = await collection.findOne({ _id: new ObjectId(id) });
      if (!doc) {
        throw new DomainError(`Article "${id}" not found`, 'NOT_FOUND', 404);
      }

      res.json({ id: doc._id.toHexString(), slug: doc.slug, title: doc.title });
    } catch (err) {
      next(err);
    }
  });

  // Centralized Error Handling
  app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.message,
      code: err.code || 'INTERNAL_ERROR'
    });
  });

  return app;
}
```

Accompanying test suite:
```js
// Node.js code
// filename: solution-articles-express.test.mjs
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { ObjectId } from 'mongodb';
import { createFixedArticleApp } from './solution-articles-express.mjs';

// Mock DB
class MockArticlesDb {
  constructor() {
    this.articles = new Map();
    this.slugs = new Set();
  }
  command() { return Promise.resolve({ ok: 1 }); }
  collection() {
    return {
      insertOne: async (doc) => {
        if (this.slugs.has(doc.slug)) {
          const err = new Error('E11000 duplicate key error');
          err.code = 11000;
          throw err;
        }
        const id = new ObjectId();
        this.slugs.add(doc.slug);
        this.articles.set(id.toHexString(), { _id: id, ...doc });
        return { insertedId: id };
      },
      findOne: async (filter) => {
        return this.articles.get(filter._id.toHexString()) || null;
      }
    };
  }
}

describe('Express + MongoDB Boundary Integration Tests', () => {
  it('translates duplicate slug error into HTTP 409 Conflict', async () => {
    const mockDb = new MockArticlesDb();
    const app = createFixedArticleApp(mockDb);
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      // 1. First article creation succeeds
      const res1 = await fetch(`http://127.0.0.1:${port}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: 'nodejs-guide', title: 'Node.js Guide' })
      });
      assert.equal(res1.status, 201);

      // 2. Duplicate article creation returns 409 Conflict
      const res2 = await fetch(`http://127.0.0.1:${port}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: 'nodejs-guide', title: 'Duplicate Guide' })
      });
      assert.equal(res2.status, 409);
      const body = await res2.json();
      assert.equal(body.code, 'SLUG_CONFLICT');
    } finally {
      server.close();
    }
  });

  it('rejects malformed ObjectId format with HTTP 422', async () => {
    const mockDb = new MockArticlesDb();
    const app = createFixedArticleApp(mockDb);
    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/articles/not-a-valid-hex-id`);
      assert.equal(res.status, 422);
      const body = await res.json();
      assert.equal(body.code, 'INVALID_ID');
    } finally {
      server.close();
    }
  });
});
```

### Solution Explanation
1. **Decoupled Probes**: `/livez` verifies local process health without touching the database, while `/readyz` safely evaluates cluster reachability via `db.command({ ping: 1 })`.
2. **Deterministic Error Mapping**: Catching `dbErr.code === 11000` maps database-level unique violations into clean HTTP 409 Conflict responses.
3. **Format Pre-Validation**: Verifying that `id` matches `^[0-9a-fA-F]{24}$` eliminates `BSONTypeError` exceptions, returning HTTP 422 before touching the driver.

---

## Summary

- Structure Express + MongoDB applications using the 4-layer architecture: Routes handle HTTP transport, Services enforce domain rules, and Repositories encapsulate MongoDB driver commands.
- Use `maxTimeMS` on queries to prevent unindexed queries from consuming server CPU and blocking connection pools.
- Translate low-level MongoDB driver exceptions (`E11000`, `BSONTypeError`, `MongoNetworkError`) into standard RFC 7807 status codes (409, 422, 503).
- Implement lightweight `/readyz` probes using administrative `db.command({ ping: 1 })`; never ping databases inside `/livez` probes.
- Wire database connections and repositories at the Composition Root, ensuring clean connection pooling and graceful SIGTERM teardown.

---

## Cheat Sheet

| Concern | Pattern / Primitive | Production Standard |
| :--- | :--- | :--- |
| **Duplicate Index Error**| Catch `err.code === 11000` | Return HTTP 409 Conflict |
| **Malformed ID Format** | Regex `/^[0-9a-fA-F]{24}$/` | Return HTTP 422 Unprocessable Entity |
| **Query Deadline** | `find(q, { maxTimeMS: 3000 })` | Prevents runaway database queries |
| **Readiness Probe** | `db.command({ ping: 1 })` | Verifies cluster connection without overhead |
| **Liveness Probe** | `res.send('OK')` | Never query database inside liveness checks |
| **Graceful Teardown** | `server.close() -> client.close()` | Stop HTTP ingress before draining database sockets |

### Common Pitfalls
- **Importing `MongoClient` directly in route files**: Bypasses the repository layer, making unit testing impossible.
- **Pinging the database in Kubernetes Liveness probes**: Causes cluster-wide container restart storms during DB lag.
- **Returning raw MongoDB errors in HTTP 500s**: Leaks database schema constraints and table names to clients.
- **Omitting `maxTimeMS` on user-filtered queries**: Allows expensive queries to hang database connection pools indefinitely.

---

## Interview Questions

### 1. How should a production Express application map MongoDB's `E11000` Duplicate Key error to an HTTP client response?

MongoDB's storage engine throws a `MongoServerError` with `code: 11000` (commonly referenced as `E11000`) whenever an insert or update command violates a unique index constraint (such as a duplicate email, username, or order slug).

In a production Express backend:
1. **Repository Boundary Catch**: The repository layer must catch the error, inspect `err.code === 11000`, and extract the conflicting field and value from `err.keyValue` (e.g., `{ email: "user@example.com" }`).
2. **Domain Error Translation**: The repository should throw a domain-specific `ConflictError` or `DuplicateEntityError` rather than letting the raw database driver error bubble up.
3. **HTTP Transport Mapping**: The centralized Express error middleware catches the domain error and returns an **HTTP 409 Conflict** (or HTTP 422) conforming to the RFC 7807 standard:
   ```json
   {
     "type": "https://api.example.com/errors/conflict",
     "title": "Conflict",
     "status": 409,
     "detail": "An account with the email 'user@example.com' already exists.",
     "code": "DUPLICATE_ENTITY"
   }
   ```
Returning a generic 500 error is a severe defect because it falsely implies a server crash rather than an invalid client request, distorting reliability metrics and confusing frontend form handling.

### 2. Why is configuring `maxTimeMS` on MongoDB queries critical for backend stability in high-traffic Express APIs?

When a Node.js client issues a query to MongoDB:
- If the query is un-indexed or runs against a massive collection (e.g. searching unindexed logs), the database server may scan millions of disk pages.
- If the Node.js application sets a client-side timeout (e.g. using `AbortSignal` or `setTimeout` to abandon the request after 3 seconds), Node stops waiting and sends an HTTP 504 to the user.
- **The Critical Problem**: The MongoDB server **does not know the client stopped waiting**. The database engine continues scanning documents, consuming server CPU, thrashing the WiredTiger memory cache, and holding locks for minutes.
- When dozens of clients trigger this endpoint concurrently, the database server CPU hits 100%, causing a complete cluster outage.

Configuring `.maxTimeMS(3000)` solves this by sending the deadline **directly over the wire protocol to the MongoDB server**. The database engine's internal execution engine checks elapsed time between document scans; once the deadline expires, MongoDB server-side forcibly terminates the query, releases memory, and frees the execution thread immediately.

### 3. Walk through the architectural decision criteria for choosing between MongoDB and PostgreSQL for a high-volume Node.js microservice.

The choice between MongoDB and PostgreSQL depends on data shape, relational coupling, and access patterns:

1. **Choose MongoDB when**:
   - **Document-Centric Access Patterns**: The application reads and writes complete, self-contained business entities (e.g., product catalogs, user profiles with embedded settings, content management articles) that can be retrieved in a single B-Tree index seek without joins.
   - **Polymorphic / Evolving Schemas**: Entities vary dynamically in structure (e.g., IoT sensor telemetry, custom form submissions, or third-party webhooks) where rigid SQL migrations would impede deployment velocity.
   - **Horizontal Scalability**: The dataset is expected to grow into tens of terabytes where native horizontal sharding across multi-node clusters is required.

2. **Choose PostgreSQL when**:
   - **Relational Integrity & Normalization**: The data model consists of highly interconnected entities with complex foreign key constraints (e.g. accounting ledgers, ERP systems, multi-party billing).
   - **Complex Relational Analytics**: Workloads require advanced SQL capabilities like recursive Common Table Expressions (CTEs), window functions, full outer joins, and multi-table constraints.
   - **Strict Financial ACID Guarantees**: Workloads require multi-table transactional consistency across deeply normalized tables without the overhead of distributed NoSQL transactions.

### 4. How should an Express application structure its Kubernetes Liveness and Readiness probes when connected to a MongoDB cluster?

The probes must serve two completely separate operational contracts:

1. **Liveness Probe (`/livez`)**:
   - **Contract**: Answers whether the Node.js process is alive, unblocked, and capable of processing its event loop.
   - **Implementation**: Returns a simple `200 OK` directly from memory without performing any asynchronous I/O:
     ```js
     app.get('/livez', (req, res) => res.status(200).send('OK'));
     ```
   - **Rule**: **NEVER query MongoDB in `/livez`**. If MongoDB experiences temporary network lag or a replica election, a database check will fail. Kubernetes will kill and reboot every API pod simultaneously, compounding the database issue with a massive thundering-herd restart surge.

2. **Readiness Probe (`/readyz`)**:
   - **Contract**: Answers whether this specific container instance is ready to receive incoming HTTP traffic from the load balancer.
   - **Implementation**: Verifies that the application is not currently shutting down, and executes an administrative ping to MongoDB:
     ```js
     app.get('/readyz', async (req, res) => {
       if (isShuttingDown) return res.status(503).send('SHUTTING_DOWN');
       try {
         await db.command({ ping: 1 }, { maxTimeMS: 1500 });
         res.status(200).send('READY');
       } catch {
         res.status(503).send('DB_UNAVAILABLE');
       }
     });
     ```
   - **Result**: If MongoDB lags, `/readyz` fails with 503. The load balancer removes the pod from the routing table without killing the container, allowing the pod to recover gracefully once the database stabilizes.

---

<nav aria-label="Lecture navigation">

[← Previous: MongoDB Atomicity, Transactions, and Retries](day-25-mongodb-atomicity-transactions-and-retries.md) | [Roadmap](../node-roadmap.md) | [Next: PostgreSQL and `pg` Pool Lifecycle](day-27-postgresql-and-pg-pool-lifecycle.md)

</nav>