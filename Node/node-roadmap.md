# Node.js Backend Developer Roadmap

A 42-day, interview-focused Node.js backend curriculum for developers preparing for mid-to-senior backend engineering roles. This roadmap treats Node.js as an asynchronous runtime, platform, and networking environment—not just a library runner—and builds the core mental models required to design, debug, optimize, and defend production systems.

**Primary references:** [Node.js Official Documentation](https://nodejs.org/docs/latest/api/), [Express Guides & API](https://expressjs.com/), [MongoDB Node Driver Manual](https://www.mongodb.com/docs/drivers/node/current/), and [node-postgres (`pg`) Documentation](https://node-postgres.com/). This roadmap assumes language semantics covered in the [JavaScript Roadmap](../Javascript/javascript-roadmap.md).

---

## How to Read This Roadmap

- Study one day at a time.
- All lecture files reside under [`Node/node-lectures/`](node-lectures/) with stable names (`day-01-node-runtime-and-architecture.md` through `day-42-senior-integration-review-and-capstone.md`).
- **Course Indexing Note:** Following the repository standard across JavaScript, Node.js, and DSA, the course starts at **Day 01** (`day-01-node-runtime-and-architecture.md`). There is no Day 00 file; Day 01 serves as the comprehensive platform and architecture foundation.
- Treat prerequisites as real dependencies, not optional suggestions.
- Master the runtime and HTTP layers before moving into database drivers and distributed reliability patterns.
- Keep clear mental boundaries: separate JavaScript language rules from Node runtime APIs, Node runtime APIs from Express framework abstractions, and framework routing from database storage engines.
- Complete the hands-on exercise and internalize failure modes before reading the interview questions.

---

## Course Goals

By the end of this roadmap, the learner should be able to:

- Explain the Node.js runtime, V8 boundaries, libuv architecture, and event loop phases at senior depth.
- Write non-blocking, memory-efficient backend code utilizing Streams, Buffers, and worker offloading appropriately.
- Design and implement production-ready Express HTTP APIs with strict validation, centralized error handling, and robust middleware pipelines.
- Integrate MongoDB and PostgreSQL via native drivers (`mongodb` and `pg`) with connection pooling, transactional integrity, index optimization, and graceful teardown.
- Implement production-grade resiliency patterns: timeouts, deadlines, exponential backoff with jitter, idempotency keys, and circuit breakers.
- Architect scalable background job processing with queues, at-least-once delivery guarantees, and graceful process shutdown.
- Diagnose and debug event loop lag, memory leaks, connection pool starvation, and unhandled promise rejections.
- Confidently answer and defend architectural trade-offs in mid-to-senior technical interviews.

---

## Recommended Order

1. **Phase 1: Runtime and Platform Fundamentals** (Days 01–12)
2. **Phase 2: Express and HTTP APIs** (Days 13–20)
3. **Phase 3: MongoDB from Node.js** (Days 21–26)
4. **Phase 4: PostgreSQL from Node.js** (Days 27–32)
5. **Phase 5: Service Reliability, Architecture, and Operations** (Days 33–38)
6. **Phase 6: Testing, Debugging, and Interview Integration** (Days 39–42)

---

## Phase 1: Runtime and Platform Fundamentals

### Day 01: Node.js Runtime and Architecture
- **Topics:** What Node.js is; V8 engine vs. Node APIs vs. libuv; main JavaScript thread; concurrency vs. parallelism; waiting vs. blocking; event loop offloading; request path mental model; worker thread intro
- **Lecture:** [Day 01: Node.js Runtime and Architecture](node-lectures/day-01-node-runtime-and-architecture.md)
- **Prerequisites:** JavaScript values, async fundamentals ([JS Day 18–20](../Javascript/javascript-roadmap.md))
- **Node relevance:** Distinguishes language guarantees from runtime host features; prevents catastrophic event-loop-blocking mistakes in web servers
- **Official references:** [Node.js About](https://nodejs.org/en/about), [V8 Engine](https://v8.dev/)
- **Exercise:** Build an HTTP server with fast and slow routes; prove how CPU loops block unrelated incoming requests and measure the latency impact
- **Interview focus:** Is Node truly single-threaded? Concurrency vs. parallelism, libuv thread pool vs. OS epoll/kqueue, and handling CPU-intensive operations

### Day 02: Event Loop and Scheduling
- **Topics:** Libuv event loop phases (timers, pending callbacks, idle/prepare, poll, check, close); microtask queues (`process.nextTick`, Promise jobs); scheduling precedence; starvation; event loop delay monitoring
- **Lecture:** [Day 02: Event Loop and Scheduling](node-lectures/day-02-event-loop-and-scheduling.md)
- **Prerequisites:** Day 01; [JS Day 20](../Javascript/javascript-lectures/day-20-jobs-microtasks-and-scheduling.md)
- **Node relevance:** Core scheduling mechanism dictating latency, execution order, and async responsiveness across all backend operations
- **Official references:** [Node.js Event Loop Guide](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)
- **Exercise:** Trace complex interleavings of `setImmediate`, `setTimeout(0)`, `process.nextTick`, and Promises across I/O poll cycles
- **Interview focus:** `process.nextTick` vs `setImmediate`, timer precision guarantees, microtask queue starvation, and libuv loop phases

### Day 03: Modules, Packages, and Resolution
- **Topics:** CommonJS (`require`, `module.exports`, caching) vs. ECMAScript Modules (`import`, `export`, async graphs); package resolution algorithm; `package.json` (`exports`, `type`, `imports`); circular dependencies; dual-package hazard
- **Lecture:** [Day 03: Modules, Packages, and Resolution](node-lectures/day-03-modules-packages-and-resolution.md)
- **Prerequisites:** Day 01; [JS Day 17](../Javascript/javascript-lectures/day-17-modules-and-interoperability.md)
- **Node relevance:** Dictates module boundaries, tree shaking, package authoring, configuration isolation, and startup latency
- **Official references:** [Node.js Modules: CommonJS](https://nodejs.org/api/modules.html), [Node.js Modules: ECMAScript](https://nodejs.org/api/esm.html)
- **Exercise:** Resolve a circular dependency issue in CJS; implement dual-package exports supporting both `import` and `require`
- **Interview focus:** CJS sync loading vs. ESM async compilation graph, module caching mechanics, handling circular imports, and `package.json` exports map

### Day 04: Process Configuration and Lifecycle
- **Topics:** `process` global object; standard I/O streams; command-line arguments (`process.argv`); environment variables (`process.env`) and validation; OS signals (`SIGINT`, `SIGTERM`); uncaught exceptions, unhandled rejections, exit codes
- **Lecture:** [Day 04: Process Configuration and Lifecycle](node-lectures/day-04-process-configuration-and-lifecycle.md)
- **Prerequisites:** Day 01, Day 03
- **Node relevance:** Robust server startup, fail-fast configuration validation, twelve-factor app standards, and graceful shutdown orchestration
- **Official references:** [Node.js Process API](https://nodejs.org/api/process.html)
- **Exercise:** Build a startup schema validator that halts process on missing env vars and registers a graceful teardown handler for `SIGTERM`
- **Interview focus:** `uncaughtException` vs `unhandledRejection`, exit codes, why the process should crash after unhandled errors, and signal traps

### Day 05: Files, Paths, URLs, and Safe I/O
- **Topics:** `node:fs` module (sync, callback, promises); `node:path` and `node:url` APIs; path traversal vulnerabilities; TOCTOU file races; directory creation; atomic file writes; safe permissions
- **Lecture:** [Day 05: Files, Paths, URLs, and Safe I/O](node-lectures/day-05-files-paths-urls-and-safe-io.md)
- **Prerequisites:** Day 01, Day 04
- **Node relevance:** Safe disk operations without blocking the event loop or introducing path injection and arbitrary file disclosure risks
- **Official references:** [Node.js File System](https://nodejs.org/api/fs.html), [Node.js Path](https://nodejs.org/api/path.html)
- **Exercise:** Write a safe file server utility that resolves paths within an allowed directory root, preventing `../` traversal attacks
- **Interview focus:** Why sync fs methods kill server throughput, TOCTOU file races, path traversal defenses, and atomic write strategies

### Day 06: Buffers, Encodings, and Serialization
- **Topics:** Binary data in Node; `Buffer` class; memory allocation (`Buffer.alloc` vs `Buffer.allocUnsafe`); character encodings (`utf8`, `base64`, `hex`); JSON serialization limits; binary slicing vs copying
- **Lecture:** [Day 06: Buffers, Encodings, and Serialization](node-lectures/day-06-buffers-encodings-and-serialization.md)
- **Prerequisites:** Day 01; [JS Day 03](../Javascript/javascript-lectures/day-03-values-types-and-literals.md)
- **Node relevance:** Efficient handling of network packets, file chunks, crypto payloads, and binary protocols outside V8's heap
- **Official references:** [Node.js Buffer API](https://nodejs.org/api/buffer.html)
- **Exercise:** Safely process binary payloads without leaking uninitialized memory; parse multi-byte Unicode strings across chunk boundaries
- **Interview focus:** `Buffer.allocUnsafe` security hazards, V8 heap vs Buffer off-heap memory, string-to-buffer encoding costs, and JSON payload limits

### Day 07: Events, Timers, and Resource Ownership
- **Topics:** `EventEmitter` pattern; listener management; synchronous event dispatching; memory leak detection (`setMaxListeners`); error handling with events; `node:timers/promises`; resource lifecycle and unref/ref
- **Lecture:** [Day 07: Events, Timers, and Resource Ownership](node-lectures/day-07-events-timers-and-resource-ownership.md)
- **Prerequisites:** Day 02; [JS Day 08](../Javascript/javascript-lectures/day-08-closures-execution-context-and-this.md)
- **Node relevance:** Event-driven foundations for streams, HTTP requests, database sockets, and message dispatchers
- **Official references:** [Node.js Events API](https://nodejs.org/api/events.html), [Node.js Timers API](https://nodejs.org/api/timers.html)
- **Exercise:** Implement an EventEmitter wrapper with automatic timeout cancellation, error propagation, and listener cleanup
- **Interview focus:** Are EventEmitters synchronous or asynchronous? Detecting listener memory leaks, the special `error` event, and `timer.unref()`

### Day 08: Streams and Backpressure
- **Topics:** Stream types (Readable, Writable, Duplex, Transform); stream modes (flowing vs. paused); highWaterMark; backpressure handling; `pipeline()` vs `pipe()`; async iteration over streams; memory consumption
- **Lecture:** [Day 08: Streams and Backpressure](node-lectures/day-08-streams-and-backpressure.md)
- **Prerequisites:** Day 05, Day 06, Day 07; [JS Day 14](../Javascript/javascript-lectures/day-14-iterables-iterators-generators-and-symbols.md)
- **Node relevance:** Processing massive files and HTTP payloads with low, constant memory footprint without crashing due to OOM
- **Official references:** [Node.js Streams API](https://nodejs.org/api/stream.html)
- **Exercise:** Transform a multi-gigabyte CSV into JSON using streams and `pipeline()`, ensuring memory usage remains under 50MB
- **Interview focus:** What is backpressure and how is it signaled (`write() === false` / `drain`)? Why `pipe()` leaks errors vs `pipeline()`, and highWaterMark tuning

### Day 09: Node HTTP Fundamentals
- **Topics:** `node:http` module; `http.createServer`; `IncomingMessage` (Readable Stream) and `ServerResponse` (Writable Stream); HTTP headers, status codes, socket lifecycle; keep-alive; connection reuse
- **Lecture:** [Day 09: Node HTTP Fundamentals](node-lectures/day-09-node-http-fundamentals.md)
- **Prerequisites:** Day 06, Day 07, Day 08
- **Node relevance:** Understand the low-level HTTP primitives that frameworks like Express, Fastify, and NestJS build on
- **Official references:** [Node.js HTTP API](https://nodejs.org/api/http.html)
- **Exercise:** Build a bare Node.js HTTP server handling routing, reading POST bodies with backpressure, setting headers, and returning JSON
- **Interview focus:** Request and response stream ownership, keep-alive socket reuse, chunked transfer encoding, and HTTP header injection

### Day 10: Networking, DNS, TLS, and Timeouts
- **Topics:** TCP sockets (`node:net`); DNS resolution and thread pool impact; TLS/HTTPS (`node:https`); client timeouts (`connect`, `socket`, `response`); `AbortController` cancellation; transient error recovery
- **Lecture:** [Day 10: Networking, DNS, TLS, and Timeouts](node-lectures/day-10-networking-dns-tls-and-timeouts.md)
- **Prerequisites:** Day 04, Day 09
- **Node relevance:** Prevents hanging outgoing HTTP/database connections, socket leaks, and thread pool exhaustion from DNS lookups
- **Official references:** [Node.js Net API](https://nodejs.org/api/net.html), [Node.js DNS API](https://nodejs.org/api/dns.html)
- **Exercise:** Create an outgoing HTTP client with strict connection, socket, and idle timeouts, wired to an `AbortSignal`
- **Interview focus:** DNS lookup blocking the libuv thread pool, socket timeout vs request timeout, TLS handshake overhead, and connection reuse

### Day 11: Worker Threads and Child Processes
- **Topics:** CPU-bound processing; `node:worker_threads` (MessageChannel, SharedArrayBuffer, worker pool); `node:child_process` (`spawn`, `fork`, `exec`); IPC channels; memory isolation; worker crash handling
- **Lecture:** [Day 11: Worker Threads and Child Processes](node-lectures/day-11-worker-threads-and-child-processes.md)
- **Prerequisites:** Day 01, Day 04
- **Node relevance:** Offloading CPU-heavy algorithms (crypto, compression, image transformation) without starving HTTP request throughput
- **Official references:** [Node.js Worker Threads](https://nodejs.org/api/worker_threads.html), [Node.js Child Processes](https://nodejs.org/api/child_process.html)
- **Exercise:** Create a thread pool dispatcher that routes CPU hashing tasks to workers and balances workload across active threads
- **Interview focus:** Worker threads vs child processes vs clustering, memory sharing tradeoffs, IPC serialization costs, and failure containment

### Day 12: Testing, Diagnostics, Observability, and Shutdown
- **Topics:** Built-in test runner (`node:test`); `node:assert`; diagnostics and metrics (`perf_hooks`, `diagnostics_channel`); event loop delay (`monitorEventLoopDelay`); memory snapshots; graceful shutdown orchestration
- **Lecture:** [Day 12: Testing, Diagnostics, Observability, and Shutdown](node-lectures/day-12-testing-diagnostics-observability-and-shutdown.md)
- **Prerequisites:** Days 01–11
- **Node relevance:** Operational health, diagnosing production latency incidents, and clean zero-downtime server deployments
- **Official references:** [Node.js Test Runner](https://nodejs.org/api/test.html), [Node.js Perf Hooks](https://nodejs.org/api/perf_hooks.html)
- **Exercise:** Implement an end-to-end graceful shutdown sequence that stops accepting requests, drains open connections, and flushes logs within a deadline
- **Interview focus:** Measuring event loop lag in production, heap snapshot analysis, zero-downtime termination, and native test mocking

---

## Phase 2: Express and HTTP APIs

### Day 13: Express Application Structure
- **Topics:** App factory pattern; separation of server initialization and app logic; dependency injection; controller/service/repository layering; testability
- **Lecture:** [Day 13: Express Application Structure](node-lectures/day-13-express-application-structure.md)
- **Prerequisites:** Days 09, 12
- **Node relevance:** Establishes maintainable, testable architectural boundaries for production web services
- **Official references:** [Express Guide: Routing](https://expressjs.com/en/guide/routing.html)
- **Exercise:** Refactor a single-file Express script into an app factory with injected dependencies and isolated HTTP testing
- **Interview focus:** Why app factories prevent port collisions in tests, circular dependencies, and separating transport from business logic

### Day 14: Middleware and Request Flow
- **Topics:** Middleware pipeline; `(req, res, next)` contract; middleware execution order; short-circuiting; error passing (`next(err)`); async middleware hazards; third-party middleware
- **Lecture:** [Day 14: Middleware and Request Flow](node-lectures/day-14-express-middleware-and-request-flow.md)
- **Prerequisites:** Day 13; [JS Day 08](../Javascript/javascript-lectures/day-08-closures-execution-context-and-this.md)
- **Node relevance:** The foundational request pipeline of Express; understanding how errors propagate or get silently dropped
- **Official references:** [Express Guide: Writing Middleware](https://expressjs.com/en/guide/writing-middleware.html)
- **Exercise:** Create an async middleware pipeline with request tagging, timing, and error isolation
- **Interview focus:** What happens if `next()` is called twice? Async middleware unhandled rejections, and middleware order traps

### Day 15: Routing and Route Parameters
- **Topics:** Router instances; path pattern matching; route parameters (`req.params`); query parameters (`req.query`); router composition; parameter pre-conditions (`router.param`)
- **Lecture:** [Day 15: Routing and Route Parameters](node-lectures/day-15-express-routing-and-route-parameters.md)
- **Prerequisites:** Day 14
- **Node relevance:** Modular endpoint declaration and parameter validation before entering application logic
- **Official references:** [Express Guide: Router](https://expressjs.com/en/guide/routing.html#express-router)
- **Exercise:** Build a nested router hierarchy with shared parameter validation and clean route separation
- **Interview focus:** Route ordering precedence, query parameter type hazards (strings vs arrays), and route handler reusability

### Day 16: Input Parsing, Validation, and Serialization
- **Topics:** `express.json()` and body parsing limits; schema validation (Zod / Joi concepts); sanitization; input normalization; API output serialization (DTOs); preventing mass assignment
- **Lecture:** [Day 16: Input Parsing, Validation, and Serialization](node-lectures/day-16-express-input-validation-and-serialization.md)
- **Prerequisites:** Day 06, Day 15
- **Node relevance:** Eliminates prototype pollution, DoS via oversized payloads, and unauthorized data leakage in responses
- **Official references:** [Express Body Parser](https://expressjs.com/en/resources/middleware/body-parser.html)
- **Exercise:** Implement validation middleware that rejects oversized or schema-violating JSON and strips private fields from outputs
- **Interview focus:** Body parser DoS protection, mass assignment vulnerabilities, and validating vs sanitizing inputs

### Day 17: Async Express and Centralized Errors
- **Topics:** Promise rejection in route handlers; Express 4 vs 5 async error behavior; async wrapper utility; centralized error handling middleware `(err, req, res, next)`; HTTP error status mapping; operational vs programmer errors
- **Lecture:** [Day 17: Async Express and Centralized Errors](node-lectures/day-17-async-express-and-centralized-errors.md)
- **Prerequisites:** Day 14; [JS Day 07](../Javascript/javascript-lectures/day-07-errors-and-exception-flow.md), [JS Day 19](../Javascript/javascript-lectures/day-19-async-await-errors-and-cleanup.md)
- **Node relevance:** Eliminates hanging requests and process crashes resulting from unhandled rejected promises in route handlers
- **Official references:** [Express Guide: Error Handling](https://expressjs.com/en/guide/error-handling.html)
- **Exercise:** Build a centralized error hierarchy and error-handling middleware that maps business domain exceptions to RFC 7807 problem details
- **Interview focus:** Why unhandled promise rejections hung in Express 4, 4-argument error middleware signature, and exposing internal stack traces

### Day 18: API Contracts, Pagination, and Idempotency
- **Topics:** RESTful resource design; pagination models (offset vs cursor-based); sort order stability; idempotency keys for mutation endpoints; HTTP status semantics (201, 204, 400, 409, 422)
- **Lecture:** [Day 18: API Contracts, Pagination, and Idempotency](node-lectures/day-18-api-contracts-pagination-and-idempotency.md)
- **Prerequisites:** Day 16, Day 17
- **Node relevance:** Robust distributed API contracts capable of safe retries without creating duplicate orders, charges, or records
- **Official references:** [RFC 7231 HTTP Semantics](https://datatracker.ietf.org/doc/html/rfc7231)
- **Exercise:** Implement cursor-based pagination and an idempotency key cache for a transaction creation route
- **Interview focus:** Offset vs cursor pagination scalability, retry-safe writes, idempotency storage, and race conditions on duplicate requests

### Day 19: Authentication and Authorization Boundaries
- **Topics:** Auth boundaries; session cookies vs stateless JWTs; token verification and decoding pitfalls; authorization checks (role-based, attribute-based, resource ownership); least privilege; context passing via `res.locals`
- **Lecture:** [Day 19: Authentication and Authorization Boundaries](node-lectures/day-19-authentication-and-authorization-boundaries.md)
- **Prerequisites:** Day 14, Day 17
- **Node relevance:** Secures endpoints against IDOR (Insecure Direct Object Reference) and unauthorized data modification
- **Official references:** [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- **Exercise:** Implement an auth middleware pipeline verifying JWT signatures and enforcing resource-level ownership permissions
- **Interview focus:** Authentication vs authorization, JWT revocation challenges, horizontal privilege escalation (IDOR), and safe token storage

### Day 20: Express Security and HTTP Testing
- **Topics:** Security headers (`helmet`); Cross-Origin Resource Sharing (CORS) mechanics and misconfigurations; rate limiting; HTTP parameter pollution; integration testing with `supertest` / native `fetch`
- **Lecture:** [Day 20: Express Security and HTTP Testing](node-lectures/day-20-express-security-and-http-testing.md)
- **Prerequisites:** Days 13–19
- **Node relevance:** Hardens HTTP services against common web attacks and verifies application behavior via automated integration tests
- **Official references:** [Express Production Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- **Exercise:** Write a full integration test suite testing authenticated routes, rate-limit thresholds, and CORS headers
- **Interview focus:** CORS preflight mechanics (`OPTIONS`), common CORS misconfigurations (`*` with credentials), and rate-limiting distributed IP spoofing

---

## Phase 3: MongoDB from Node.js

### Day 21: MongoDB Driver Lifecycle and BSON
- **Topics:** MongoDB Node.js driver architecture; `MongoClient` connection lifecycle; connection pool management; BSON data types; `ObjectId` mechanics and validation; driver error categories
- **Lecture:** [Day 21: MongoDB Driver Lifecycle and BSON](node-lectures/day-21-mongodb-driver-lifecycle-and-bson.md)
- **Prerequisites:** Day 04, Day 06, Day 13
- **Node relevance:** Proper database connection pooling, preventing memory leaks, and avoiding connection exhaustion under high concurrency
- **Official references:** [MongoDB Node.js Driver Quick Start](https://www.mongodb.com/docs/drivers/node/current/quick-start/)
- **Exercise:** Create a singleton database client module with graceful connection pooling, ping verification, and shutdown hooks
- **Interview focus:** Creating `MongoClient` per request vs application singleton, BSON serialization boundaries, and validating `ObjectId` inputs

### Day 22: MongoDB CRUD from Node
- **Topics:** Safe query execution; `insertOne`, `insertMany`, `findOne`, `find` with cursors; update operators (`$set`, `$inc`, `$push`); write options; write concerns (`w: 1`, `w: "majority"`); read concerns
- **Lecture:** [Day 22: MongoDB CRUD from Node](node-lectures/day-22-mongodb-crud-from-node.md)
- **Prerequisites:** Day 21
- **Node relevance:** Writing predictable, high-performance database queries while handling cursor streaming and write acknowledgments
- **Official references:** [MongoDB CRUD Operations](https://www.mongodb.com/docs/manual/crud/)
- **Exercise:** Implement a driver repository performing atomic updates with `$set` and `$inc`, returning updated document states
- **Interview focus:** Streaming cursor memory consumption, write concern trade-offs (durability vs latency), and update operator atomicity

### Day 23: MongoDB Access Patterns and Document Shape
- **Topics:** Document modeling; embedding vs referencing (normalized vs denormalized); 1:1, 1:N, N:M patterns; document growth and unbounded arrays; schema versioning pattern; bucket pattern for time series
- **Lecture:** [Day 23: MongoDB Access Patterns and Document Shape](node-lectures/day-23-mongodb-access-patterns-and-document-shape.md)
- **Prerequisites:** Day 22
- **Node relevance:** Designing document structures around application read/write query patterns to avoid expensive application-side joins
- **Official references:** [MongoDB Data Model Design](https://www.mongodb.com/docs/manual/core/data-model-design/)
- **Exercise:** Design a schema for an e-commerce order system that prevents the 16MB document size limit and unbounded array growth
- **Interview focus:** When to embed vs when to reference, unbounded array anti-patterns, and schema migration without downtime

### Day 24: MongoDB Aggregation and Index Awareness
- **Topics:** Aggregation pipeline stages (`$match`, `$project`, `$group`, `$sort`, `$limit`, `$lookup`, `$unwind`); single-field and compound indexes; index prefix rule; ESR (Equality, Sort, Range) rule; `explain("executionStats")` plans; covered queries
- **Lecture:** [Day 24: MongoDB Aggregation and Index Awareness](node-lectures/day-24-mongodb-aggregation-and-index-awareness.md)
- **Prerequisites:** Day 22, Day 23
- **Node relevance:** Complex data transformation and reporting inside the database engine without transferring raw data over the network
- **Official references:** [MongoDB Aggregation](https://www.mongodb.com/docs/manual/aggregation/), [MongoDB Indexes](https://www.mongodb.com/docs/manual/indexes/)
- **Exercise:** Optimize a slow aggregation pipeline by reordering stages, applying the ESR indexing rule, and verifying via executionStats
- **Interview focus:** ESR indexing rule, in-memory sort limits (`100MB`), covered queries, and interpreting `COLLSCAN` vs `IXSCAN`

### Day 25: MongoDB Atomicity, Transactions, and Retries
- **Topics:** Single-document atomic guarantees; optimistic concurrency control (`versionKey`); multi-document ACID transactions; client sessions; write conflicts; transient transaction errors; retry logic
- **Lecture:** [Day 25: MongoDB Atomicity, Transactions, and Retries](node-lectures/day-25-mongodb-atomicity-transactions-and-retries.md)
- **Prerequisites:** Day 10, Day 21, Day 22
- **Node relevance:** Enforcing business invariants across documents (e.g., account balance transfers) while managing transaction overhead
- **Official references:** [MongoDB Transactions](https://www.mongodb.com/docs/manual/core/transactions/)
- **Exercise:** Build a multi-document balance transfer workflow with client session management, conflict detection, and retry wrappers
- **Interview focus:** Single-document atomicity vs distributed transactions, transaction timeout limits, and handling write conflict retries

### Day 26: MongoDB in Express
- **Topics:** Express repository layer integration; mapping HTTP query filters to safe MongoDB queries; injection prevention (`$where`, operator injection); transaction management across services; health checks
- **Lecture:** [Day 26: MongoDB in Express](node-lectures/day-26-mongodb-in-express.md)
- **Prerequisites:** Days 13–20, Days 21–25
- **Node relevance:** Seamlessly integrating MongoDB repositories into layered Express backends with clean separation of concerns
- **Official references:** [Express & MongoDB Integration](https://www.mongodb.com/docs/drivers/node/current/integrations/)
- **Exercise:** Build a production CRUD resource in Express using repository pattern, input sanitization against operator injection, and pagination
- **Interview focus:** NoSQL query injection prevention (disallowing object inputs for keys), controller decoupling, and database health probes

---

## Phase 4: PostgreSQL from Node.js

### Day 27: PostgreSQL and `pg` Pool Lifecycle
- **Topics:** PostgreSQL client-server architecture; `pg` library; `pg.Pool` vs `pg.Client`; connection pool configuration (`max`, `idleTimeoutMillis`, `connectionTimeoutMillis`); acquiring and releasing clients; pool error handling; graceful teardown
- **Lecture:** [Day 27: PostgreSQL and `pg` Pool Lifecycle](node-lectures/day-27-postgresql-and-pg-pool-lifecycle.md)
- **Prerequisites:** Day 04, Day 10, Day 12
- **Node relevance:** Managing expensive relational database connections safely without leaking clients or exhausting database connection limits
- **Official references:** [node-postgres Pooling](https://node-postgres.com/features/pooling)
- **Exercise:** Create a resilient PostgreSQL pool module with client checkout/release safety, query timing metrics, and graceful drain
- **Interview focus:** Leaked pool clients, pool size tuning, `pool.query()` vs `pool.connect()`, and handling unexpected client errors

### Day 28: Parameterized SQL CRUD
- **Topics:** SQL syntax; parameterized queries (`$1`, `$2`); SQL injection mechanisms; `RETURNING` clause; handling NULLs, types, and JSONB columns; parsing row results; batch inserts
- **Lecture:** [Day 28: Parameterized SQL CRUD](node-lectures/day-28-parameterized-sql-crud.md)
- **Prerequisites:** Day 16, Day 27
- **Node relevance:** Writing performant, secure relational database operations completely immune to SQL injection vulnerabilities
- **Official references:** [node-postgres Queries](https://node-postgres.com/features/queries)
- **Exercise:** Implement a relational repository performing parameterized CRUD with `RETURNING`, handling JSONB fields and nullable columns
- **Interview focus:** Why parameterized queries defeat SQL injection, dynamic column/table name hazards, and batch insert strategies

### Day 29: Relational Correctness for APIs
- **Topics:** Relational schemas; primary and foreign keys; constraints (`UNIQUE`, `CHECK`, `NOT NULL`); foreign key actions (`ON DELETE CASCADE`, `RESTRICT`); schema migrations; handling PostgreSQL error codes (`23505`, `23503`)
- **Lecture:** [Day 29: Relational Correctness for APIs](node-lectures/day-29-relational-correctness-for-apis.md)
- **Prerequisites:** Day 28; [JS Day 07](../Javascript/javascript-lectures/day-07-errors-and-exception-flow.md)
- **Node relevance:** Enforcing data integrity at the database layer and translating relational constraint violations into meaningful HTTP responses
- **Official references:** [PostgreSQL Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
- **Exercise:** Model an inventory and order schema with constraints; map PostgreSQL foreign key and unique constraint errors to HTTP 409/400
- **Interview focus:** Database constraints vs application validation, zero-downtime migrations (adding non-null columns), and error code mapping

### Day 30: Query Composition and Performance Awareness
- **Topics:** SQL query execution order; `JOIN` types (INNER, LEFT, RIGHT, FULL); aggregation (`GROUP BY`, `HAVING`); subqueries and Common Table Expressions (CTEs); B-tree indexes; compound indexes; `EXPLAIN (ANALYZE, BUFFERS)`
- **Lecture:** [Day 30: Query Composition and Performance Awareness](node-lectures/day-30-sql-composition-and-performance-awareness.md)
- **Prerequisites:** Day 24, Day 29
- **Node relevance:** Identifying and resolving slow relational queries before they exhaust database CPU and connection pool resources
- **Official references:** [PostgreSQL Performance Tips](https://www.postgresql.org/docs/current/performance-tips.html), [Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
- **Exercise:** Rewrite an N+1 query pattern into an optimized single join/aggregation query and verify the query plan using `EXPLAIN ANALYZE`
- **Interview focus:** N+1 query problem, Seq Scan vs Index Scan, index selectivity, and CTE materialization in modern PostgreSQL

### Day 31: Transactions, MVCC, Isolation, and Locks
- **Topics:** ACID properties; `BEGIN`, `COMMIT`, `ROLLBACK`; checkout client transaction ownership; MVCC (Multi-Version Concurrency Control); transaction isolation levels (Read Committed, Repeatable Read, Serializable); row-level locking (`FOR UPDATE`, `SKIP LOCKED`); deadlock prevention
- **Lecture:** [Day 31: Transactions, MVCC, Isolation, and Locks](node-lectures/day-31-postgresql-transactions-mvcc-and-locks.md)
- **Prerequisites:** Day 10, Days 27–30
- **Node relevance:** Managing concurrent data modifications without race conditions, lost updates, or locking out entire tables
- **Official references:** [PostgreSQL Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html), [Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- **Exercise:** Implement a transactional money transfer with client checkout, explicit rollback on error, and row-level locking to prevent race conditions
- **Interview focus:** Why `pool.query('BEGIN')` fails catastrophically, transaction isolation anomalies (dirty reads, non-repeatable reads, phantom reads), and `FOR UPDATE SKIP LOCKED` for job queues

### Day 32: PostgreSQL in Express
- **Topics:** Express repository and service layering for relational DBs; transaction management helper; connection pool exhaustion prevention; database timeouts (`statement_timeout`); unit testing with mocked repositories vs integration testing with test databases
- **Lecture:** [Day 32: PostgreSQL in Express](node-lectures/day-32-postgresql-in-express.md)
- **Prerequisites:** Days 13–20, Days 27–31
- **Node relevance:** Architecting robust Express APIs on top of PostgreSQL with clean service boundaries and safe transaction propagation
- **Official references:** [node-postgres Transactions](https://node-postgres.com/features/transactions)
- **Exercise:** Implement a reusable `withTransaction` utility function that manages client checkout, begin, commit, rollback, and release for Express services
- **Interview focus:** Transaction boundaries in controllers vs services, statement timeout configuration, and isolation during concurrent integration tests

---

## Phase 5: Service Reliability, Architecture, and Operations

### Day 33: Layered Backend Architecture
- **Topics:** Clean architecture principles; Controllers (transport), Services (business rules), Repositories (data access); Domain models; Dependency Injection; isolating business logic from Express and DB drivers; testability
- **Lecture:** [Day 33: Layered Backend Architecture](node-lectures/day-33-layered-backend-architecture.md)
- **Prerequisites:** Days 13, 26, 32; [JS Day 26](../Javascript/javascript-lectures/day-26-javascript-boundaries-for-services.md)
- **Node relevance:** Keeps enterprise Node applications maintainable, modular, and easy to unit test without database dependencies
- **Official references:** [Node.js Application Architecture Guides](https://nodejs.org/en/learn/)
- **Exercise:** Refactor a monolithic Express route containing validation, business calculations, and raw database queries into three distinct architectural layers
- **Interview focus:** Fat controllers vs fat models vs domain services, dependency inversion, and how layering isolates third-party dependency breaking changes

### Day 34: Deadlines, Retries, and Idempotency
- **Topics:** Distributed failure modes; transient vs permanent errors; deadline propagation with `AbortController`; exponential backoff with full jitter; retry budgets; idempotency key patterns; preventing retry storms
- **Lecture:** [Day 34: Deadlines, Retries, and Idempotency](node-lectures/day-34-deadlines-retries-and-idempotency.md)
- **Prerequisites:** Days 10, 18, 25, 31
- **Node relevance:** Prevents cascading outages and stampedes when downstream services experience latency or temporary degradation
- **Official references:** [AWS Exponential Backoff & Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- **Exercise:** Write a generic HTTP fetch wrapper featuring configurable retries with jitter, deadline cancellation, and idempotency headers
- **Interview focus:** Why naive retries cause thundering herds, calculating exponential backoff with jitter, and deadline propagation across HTTP hops

### Day 35: Caching and Rate Limiting
- **Topics:** Cache strategies (cache-aside, write-through); cache keys and TTLs; cache stampede/dogpiling mitigation (mutex locks, probabilistic early expiration); in-memory vs distributed Redis caches; rate limiting algorithms (token bucket, leaky bucket, sliding window); header contracts
- **Lecture:** [Day 35: Caching and Rate Limiting](node-lectures/day-35-caching-and-rate-limiting.md)
- **Prerequisites:** Day 18, Day 20, Day 33
- **Node relevance:** Protects core databases from extreme read traffic spikes and defends public APIs against abusive bursts and brute-force attacks
- **Official references:** [Redis Caching Best Practices](https://redis.io/docs/manual/client-side-caching/)
- **Exercise:** Implement a cache-aside service with a mutual exclusion lock to prevent cache stampedes when keys expire under high load
- **Interview focus:** Cache invalidation difficulties, cache stampede prevention, token bucket vs sliding window rate limiters, and handling distributed cache outages

### Day 36: Queues and Background Work
- **Topics:** Asynchronous task processing; message queue architecture (BullMQ / RabbitMQ concepts); job lifecycles; producer-consumer pattern; at-least-once delivery; idempotent consumers; job retries and backoff; dead-letter queues (DLQ); graceful worker shutdown
- **Lecture:** [Day 36: Queues and Background Work](node-lectures/day-36-queues-and-background-work.md)
- **Prerequisites:** Day 11, Day 12, Day 34
- **Node relevance:** Decouples heavy or slow operations (emails, webhooks, report exports) from interactive HTTP request threads
- **Official references:** [BullMQ Guide](https://docs.bullmq.io/)
- **Exercise:** Build a background queue consumer with job acknowledgement, exponential retry backoff, DLQ routing, and shutdown signal draining
- **Interview focus:** Why exactly-once delivery is impossible in distributed systems, handling duplicate job deliveries, and poison pill message isolation

### Day 37: Observability and Production Operations
- **Topics:** The three pillars: Structured logging (Pino/Winston, correlation/request IDs), Metrics (Prometheus, latency percentiles p50/p95/p99, error rates), Tracing (OpenTelemetry); health checks (liveness vs readiness probes); event loop lag tracking
- **Lecture:** [Day 37: Observability and Production Operations](node-lectures/day-37-observability-and-production-operations.md)
- **Prerequisites:** Day 04, Day 12, Day 20
- **Node relevance:** Provides visibility into live production systems, enabling fast incident detection, root-cause triage, and capacity planning
- **Official references:** [OpenTelemetry Node.js](https://opentelemetry.io/docs/languages/js/), [Pino Logger](https://getpino.io/)
- **Exercise:** Set up structured JSON logging with request correlation IDs and an endpoint exposing Prometheus metrics and readiness status
- **Interview focus:** Why `console.log` degrades event loop throughput in production, liveness vs readiness probe failure behaviors, and measuring p99 latency

### Day 38: Security Review of a Node Backend
- **Topics:** OWASP Top 10 for Node.js APIs; Server-Side Request Forgery (SSRF); command injection; prototype pollution in libraries; ReDoS (Regular Expression Denial of Service); secret management; dependency auditing (`npm audit`); secure session cookies
- **Lecture:** [Day 38: Security Review of a Node Backend](node-lectures/day-38-security-review-of-a-node-backend.md)
- **Prerequisites:** Days 04, 05, 10, 16, 19, 20
- **Node relevance:** Systematic defense against data breaches, privilege escalation, and infrastructure compromise across the entire backend stack
- **Official references:** [OWASP Top 10 API Security](https://owasp.org/www-project-api-security/), [Node.js Security Best Practices](https://nodejs.org/en/learn/getting-started/security-best-practices)
- **Exercise:** Audit a vulnerable Node.js backend snippet, exploit SSRF and prototype pollution flaws, and write verified security patches
- **Interview focus:** SSRF prevention with private IP blacklisting, ReDoS detection and mitigation, prototype pollution mechanics, and defending against compromised npm dependencies

---

## Phase 6: Testing, Debugging, and Senior Integration

### Day 39: Testing Strategy Across Boundaries
- **Topics:** Testing pyramid for Node.js; fast unit testing of business services; integration testing of HTTP and database boundaries; test database isolation and transactions; test fixtures; mocking external HTTP dependencies (nock / MSW); avoiding test pollution
- **Lecture:** [Day 39: Testing Strategy Across Boundaries](node-lectures/day-39-testing-strategy-across-boundaries.md)
- **Prerequisites:** Day 12, Day 20, Day 26, Day 32, Day 33
- **Node relevance:** Ensures reliable continuous delivery with confidence that database queries, middleware, and domain logic function correctly together
- **Official references:** [Node.js Test Runner](https://nodejs.org/api/test.html)
- **Exercise:** Write a comprehensive test suite for a purchase endpoint containing unit tests for business logic and integration tests against real test DBs
- **Interview focus:** Over-mocking pitfalls, isolating parallel database tests, testing transient network failures, and deterministic test teardown

### Day 40: Performance and Debugging Case Studies
- **Topics:** Real-world incident debugging; event loop blocking diagnosis; microtask starvation; memory leak detection and heap snapshot comparison; database connection pool starvation; slow query identification; cascading timeout storms; post-mortem writing
- **Lecture:** [Day 40: Performance and Debugging Case Studies](node-lectures/day-40-performance-and-debugging-case-studies.md)
- **Prerequisites:** Days 02, 08, 10, 24, 30, 31, Days 34–37
- **Node relevance:** Diagnosing and resolving critical high-latency or crashing production incidents under pressure using systematic evidence
- **Official references:** [Node.js Diagnostics Channel](https://nodejs.org/api/diagnostics_channel.html), [V8 Heap Profiler](https://v8.dev/docs/profile)
- **Exercise:** Analyze a heap dump and event loop trace from a crashing service to locate a closure memory leak and apply a verified fix
- **Interview focus:** Distinguishing slow database I/O from event loop CPU blocking, debugging retained memory leaks in closures/event listeners, and post-mortem incident RCA

### Day 41: Designing a Reliable Backend System
- **Topics:** System design interview framework for Node.js; clarifying requirements; defining API contracts; data modeling (relational vs document tradeoffs); scaling read vs write heavy workloads; caching strategies; queueing; fault tolerance; capacity estimation
- **Lecture:** [Day 41: Designing a Reliable Backend System](node-lectures/day-41-designing-a-reliable-backend-system.md)
- **Prerequisites:** Days 01–40
- **Node relevance:** Synthesizes runtime, API, database, and reliability knowledge into cohesive system design solutions for senior technical interviews
- **Official references:** Official Node.js, Express, MongoDB, and PostgreSQL documentation
- **Exercise:** Design a high-throughput webhook delivery service or URL shortener, detailing schema, caching, queueing, retries, and shutdown
- **Interview focus:** Clarifying questions, identifying the single bottleneck, defending database choices, and handling cascading failure scenarios

### Day 42: Senior Integration Review and Capstone
- **Topics:** Comprehensive senior architecture review; end-to-end audit of an enterprise Node.js microservice; verifying security, observability, connection pooling, graceful teardown, and error contracts; senior interview roleplay and risk registers
- **Lecture:** [Day 42: Senior Integration Review and Capstone](node-lectures/day-42-senior-integration-review-and-capstone.md)
- **Prerequisites:** Days 01–41
- **Node relevance:** Demonstrates senior engineering judgment, articulating nuanced trade-offs across the entire software development lifecycle
- **Official references:** Node.js, Express, MongoDB, and PostgreSQL comprehensive references
- **Exercise:** Conduct an architectural risk audit on a full-stack Node.js backend codebase and create an actionable remediation roadmap
- **Interview focus:** Defending trade-offs without dogma, handling technical debt, trade-offs between consistency and availability, and mentoring junior engineers

---

## Course Boundaries

This roadmap focuses deeply on:
- Node.js runtime mechanics, scheduling, and system APIs
- Express HTTP application development, security, and integration
- Production database access through the native MongoDB and PostgreSQL drivers
- Service reliability, resilience, queueing, caching, observability, and operations
- Rigorous technical interview reasoning and senior trade-off analysis

It explicitly links to and does not replace:
- The [Pure JavaScript Roadmap](../Javascript/javascript-roadmap.md) for core ECMAScript language semantics, prototypes, closures, and async primitives.
- The [DSA Roadmap](../DSA/javascript-dsa-roadmap.md) for algorithmic problem solving and data structure implementations.
- Dedicated database administration topics (physical disk replication, sharding, WAL tuning, and multi-region failover).

---

## Node.js Coverage Matrix

| Area | Roadmap Days | Primary Focus |
| :--- | :--- | :--- |
| **Runtime & Platform** | Days 01–12 | V8, libuv, event loop, modules, process, files, buffers, events, streams, HTTP, network, workers, diagnostics |
| **Express & Web APIs** | Days 13–20 | Architecture, middleware, routing, validation, error boundaries, contracts, auth, security, HTTP tests |
| **MongoDB Integration** | Days 21–26 | Driver lifecycle, BSON, CRUD, document modeling, aggregation pipelines, indexes, transactions, Express repos |
| **PostgreSQL Integration**| Days 27–32 | Connection pools, parameterized CRUD, relational constraints, joins/indexes, MVCC/locks, Express repos |
| **Reliability & Ops** | Days 33–38 | Layered architecture, retries/idempotency, caching/rate limiting, job queues, observability, security audit |
| **Integration & Interviews**| Days 39–42 | Testing across boundaries, performance debugging, system design, senior capstone review |

---

## Source & Accuracy Policy

- Runtime APIs, scheduling, and event loop behavior are verified against the canonical [Node.js Official Documentation](https://nodejs.org/docs/latest/api/).
- Framework practices follow the [Express Guide & API](https://expressjs.com/).
- Database behaviors reflect current driver specifications for [MongoDB Node Driver](https://www.mongodb.com/docs/drivers/node/current/) and [node-postgres (`pg`)](https://node-postgres.com/).
- All explanations use original, clear language, distinguish language specifications from host runtime implementations, and avoid presenting experimental features as universal guarantees.
