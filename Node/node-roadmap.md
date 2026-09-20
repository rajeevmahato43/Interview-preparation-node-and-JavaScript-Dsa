# Node.js Backend Developer Roadmap

This is the improved senior Node.js backend roadmap for this workspace. It keeps the focus on Node.js runtime behavior, HTTP APIs, database boundaries, reliability, and interview reasoning. It complements the JavaScript curriculum rather than replacing it.

## How to read this roadmap

- Study one day at a time.
- Keep the lecture files under `Node/node-lectures/` with stable names.
- Treat prerequisites as real requirements, not suggestions.
- Learn the runtime and HTTP model before database and reliability topics.
- Separate runtime concerns from framework concerns, and framework concerns from storage concerns.
- Write the code or at least the mental model for the exercise before using the interview questions.

## Course goals

By the end of this roadmap, the learner should be able to:

- explain the Node runtime and event loop at a level that supports backend reasoning
- build and debug HTTP APIs with Express and proper error boundaries
- choose between Node runtime primitives, database clients, and worker/process isolation correctly
- model MongoDB and PostgreSQL workloads with honest tradeoffs
- reason about retries, timeouts, idempotency, queues, observability, and graceful shutdown
- defend design choices in a senior backend interview without pretending there is a universal answer

## Recommended order

1. Runtime and platform fundamentals
2. HTTP and Express request flow
3. MongoDB through the Node driver
4. PostgreSQL through `pg`
5. Reliability, architecture, and operations
6. Senior integration and interview practice

## Phase 1: Runtime and platform

### Day 01: Node.js Runtime and Architecture
- Focus: V8, Node APIs, libuv, JS thread model, concurrency vs parallelism, blocking work
- Lecture: `day-01-node-runtime-and-architecture.md`
- Prerequisites: JavaScript values, async, and scheduling fundamentals

### Day 02: Event Loop and Scheduling
- Focus: timers, phases, microtasks, `process.nextTick`, ordering, starvation, latency
- Lecture: `day-02-event-loop-and-scheduling.md`

### Day 03: Modules, Packages, and Resolution
- Focus: CommonJS vs ESM, `package.json`, resolution, cycles, exports, loaders, package boundaries
- Lecture: `day-03-modules-packages-and-resolution.md`

### Day 04: Process Configuration and Lifecycle
- Focus: `process.env`, signals, exit codes, startup validation, secrets, graceful shutdown
- Lecture: `day-04-process-configuration-and-lifecycle.md`

### Day 05: Files, Paths, URLs, and Safe I/O
- Focus: fs APIs, path safety, URL handling, file races, traversal, safe file access
- Lecture: `day-05-files-paths-urls-and-safe-io.md`

### Day 06: Buffers, Encodings, and Serialization
- Focus: `Buffer`, text vs bytes, JSON boundaries, encodings, size limits
- Lecture: `day-06-buffers-encodings-and-serialization.md`

### Day 07: Events, Timers, and Resource Ownership
- Focus: `EventEmitter`, listeners, cleanup, cancellation, detaching resource owners
- Lecture: `day-07-events-timers-and-resource-ownership.md`

### Day 08: Streams and Backpressure
- Focus: readable/writable streams, high-water marks, transform pipelines, slow consumers
- Lecture: `day-08-streams-and-backpressure.md`

### Day 09: Node HTTP Fundamentals
- Focus: request/response lifecycle, socket reuse, headers, status, client/server boundaries
- Lecture: `day-09-node-http-fundamentals.md`

### Day 10: Networking, DNS, TLS, and Timeouts
- Focus: TCP, DNS, sockets, TLS, deadlines, aborts, transient errors
- Lecture: `day-10-networking-dns-tls-and-timeouts.md`

### Day 11: Worker Threads and Child Processes
- Focus: CPU-bound work, isolation, IPC, process safety, worker vs child process choice
- Lecture: `day-11-worker-threads-and-child-processes.md`

### Day 12: Testing, Diagnostics, Observability, and Shutdown
- Focus: tests, logs, metrics, liveness vs readiness, event-loop delay, graceful shutdown
- Lecture: `day-12-testing-diagnostics-observability-and-shutdown.md`

## Phase 2: Express and HTTP APIs

### Day 13: Express Application Structure
- Focus: app factory, dependency injection, route/service/repository layering
- Lecture: `day-13-express-application-structure.md`

### Day 14: Middleware and Request Flow
- Focus: order, `next()`, short-circuiting, `next(error)`, route flow
- Lecture: `day-14-express-middleware-and-request-flow.md`

### Day 15: Routing and Route Parameters
- Focus: method routing, path params, query params, nested routers, precedence
- Lecture: `day-15-express-routing-and-route-parameters.md`

### Day 16: Input Parsing, Validation, and Serialization
- Focus: JSON parsing, size limits, validation, normalization, public response contract
- Lecture: `day-16-express-input-validation-and-serialization.md`

### Day 17: Async Express and Centralized Errors
- Focus: rejected promises, wrapper patterns, error middleware, API error mapping
- Lecture: `day-17-async-express-and-centralized-errors.md`

### Day 18: API Contracts, Pagination, and Idempotency
- Focus: resource design, pagination models, ordering, retry-safe writes
- Lecture: `day-18-api-contracts-pagination-and-idempotency.md`

### Day 19: Authentication and Authorization Boundaries
- Focus: identity, roles, ownership, authz checks, least privilege
- Lecture: `day-19-authentication-and-authorization-boundaries.md`

### Day 20: Express Security and HTTP Testing
- Focus: CORS, headers, limits, rate limits, API integration tests
- Lecture: `day-20-express-security-and-http-testing.md`

## Phase 3: MongoDB from Node

### Day 21: MongoDB Driver Lifecycle and BSON
- Focus: driver lifecycle, BSON, ObjectId, MongoClient, repository boundary
- Lecture: `day-21-mongodb-driver-lifecycle-and-bson.md`

### Day 22: MongoDB CRUD from Node
- Focus: `find`, `insert`, `update`, `delete`, filters, projections, results
- Lecture: `day-22-mongodb-crud-from-node.md`

### Day 23: MongoDB Access Patterns and Document Shape
- Focus: embedding, references, document growth, schema evolution, workload matching
- Lecture: `day-23-mongodb-access-patterns-and-document-shape.md`

### Day 24: MongoDB Aggregation and Index Awareness
- Focus: aggregation pipeline, compound indexes, explain plans, sort support
- Lecture: `day-24-mongodb-aggregation-and-index-awareness.md`

### Day 25: MongoDB Atomicity, Transactions, and Retries
- Focus: atomic writes, multi-document transaction boundaries, retry safety
- Lecture: `day-25-mongodb-atomicity-transactions-and-retries.md`

### Day 26: MongoDB in Express
- Focus: repository pattern, Express service integration, error mapping, DB choice tradeoffs
- Lecture: `day-26-mongodb-in-express.md`

## Phase 4: PostgreSQL from Node

### Day 27: PostgreSQL and `pg` Pool Lifecycle
- Focus: `pg` pool, connection reuse, query lifecycle, graceful shutdown
- Lecture: `day-27-postgresql-and-pg-pool-lifecycle.md`

### Day 28: Parameterized SQL CRUD
- Focus: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `RETURNING`, placeholders, injection prevention
- Lecture: `day-28-parameterized-sql-crud.md`

### Day 29: Relational Correctness for APIs
- Focus: constraints, keys, normalization, validation, migrations, API/data mismatch
- Lecture: `day-29-relational-correctness-for-apis.md`

### Day 30: Query Composition and Performance Awareness
- Focus: joins, window functions, queries, `EXPLAIN`, selectivity, index design
- Lecture: `day-30-sql-composition-and-performance-awareness.md`

### Day 31: Transactions, MVCC, Isolation, and Locks
- Focus: transaction boundaries, isolation, locks, deadlocks, release paths
- Lecture: `day-31-postgresql-transactions-mvcc-and-locks.md`

### Day 32: PostgreSQL in Express
- Focus: repository layer, service transactions, pool pressure, error mapping
- Lecture: `day-32-postgresql-in-express.md`

## Phase 5: Service reliability and operations

### Day 33: Layered Backend Architecture
- Focus: controllers, services, repositories, configuration, dependency direction
- Lecture: `day-33-layered-backend-architecture.md`

### Day 34: Deadlines, Retries, and Idempotency
- Focus: AbortController, deadlines, retry budgets, jitter, duplicates, safe side effects
- Lecture: `day-34-deadlines-retries-and-idempotency.md`

### Day 35: Caching and Rate Limiting
- Focus: cache keys, TTL, invalidation, token buckets, shared vs local caches
- Lecture: `day-35-caching-and-rate-limiting.md`

### Day 36: Queues and Background Work
- Focus: job lifecycle, retries, dead-letter handling, workers, at-least-once semantics
- Lecture: `day-36-queues-and-background-work.md`

### Day 37: Observability and Production Operations
- Focus: logs, metrics, traces, health, readiness, event-loop lag, alerts
- Lecture: `day-37-observability-and-production-operations.md`

### Day 38: Security Review of a Node Backend
- Focus: injection, SSRF, traversal, authz gaps, secrets, dependency risk
- Lecture: `day-38-security-review-of-a-node-backend.md`

### Day 39: Testing Strategy Across Boundaries
- Focus: unit, integration, HTTP, database, fake timers, fixtures, cleanup
- Lecture: `day-39-testing-strategy-across-boundaries.md`

### Day 40: Performance and Debugging Case Studies
- Focus: event-loop blocking, pool exhaustion, memory retention, slow queries, incident writing
- Lecture: `day-40-performance-and-debugging-case-studies.md`

### Day 41: Designing a Reliable Backend System
- Focus: requirement framing, boundaries, consistency, failure modes, tradeoffs
- Lecture: `day-41-designing-a-reliable-backend-system.md`

### Day 42: Senior Integration Review and Capstone
- Focus: full-service reasoning, reliability, observability, security, testability
- Lecture: `day-42-senior-integration-review-and-capstone.md`

## Phase 6: Integration and interview readiness

## Course boundary

This roadmap covers Node.js runtime behavior, Express HTTP APIs, Node-facing database integration, reliability, security, testing, and senior interview reasoning. It intentionally does not replace the separate JavaScript, DSA, system-design, or database-deep-dive courses.

## Coverage map

- Runtime, event loop, modules, process, I/O: Days 01-12
- Express and HTTP APIs: Days 13-20
- MongoDB from Node: Days 21-26
- PostgreSQL from Node: Days 27-32
- Reliability, ops, security, and architecture: Days 33-38
- Testing, debugging, and interview integration: Days 39-42

## Use this course as a real checklist

A learner is ready to move on when they can:

- explain the runtime without notes
- trace request flow from HTTP to business logic to database and back
- distinguish Node JavaScript behavior from framework and database behavior
- design a safe shutdown and a retry policy with clear failure assumptions
- defend a data-model choice with workload evidence
- describe operational tradeoffs using logs, metrics, retries, and timeouts

## Source policy

Use the canonical Node, Express, MongoDB, and PostgreSQL documentation for version-sensitive behavior. For this workspace, the important rule is to explain assumptions, not to present a recent feature as universal.

## Day 24: Aggregation and Index Awareness

- **Topics:** Aggregation pipelines, match, project, group, sort, limit, pagination, indexes, compound order, explain plans, selectivity, memory, and write cost
- **Prerequisites:** Days 22-23 and Day 30
- **Future lecture:** `day-24-mongodb-aggregation-and-index-awareness.md`
- **Node relevance:** Query shape and workload determine whether an index helps.
- **Official references:** Aggregation; Indexes; Explain results
- **Exercise:** Compare an aggregation and two candidate indexes using explain assumptions.
- **Interview focus:** Index every field, sort support, and read/write tradeoffs.

## Day 25: MongoDB Atomicity, Transactions, and Retries

- **Topics:** Single-document atomicity, optimistic concurrency, transactions, sessions, read and write concerns, retryable operations, transient errors, idempotency, and partial failure
- **Prerequisites:** Days 10, 17, and 22-24
- **Future lecture:** `day-25-mongodb-atomicity-transactions-and-retries.md`
- **Node relevance:** Correctness depends on the operation boundary, not only on application checks.
- **Official references:** Transactions; Atomicity; Write concern
- **Exercise:** Choose a correctness strategy for a multi-step balance workflow.
- **Interview focus:** Transaction cost, client-side races, and retrying non-idempotent writes.

## Day 26: MongoDB in Express

- **Topics:** Repositories, request-to-filter mapping, connection reuse, timeouts, error mapping, test boundaries, observability, and MongoDB versus PostgreSQL choices
- **Prerequisites:** Days 13-20 and 21-25
- **Future lecture:** `day-26-mongodb-in-express.md`
- **Node relevance:** Database access should be replaceable behind application-facing interfaces.
- **Official references:** MongoDB Node.js driver; Express guide
- **Exercise:** Build one Express resource backed by a driver repository.
- **Interview focus:** Controllers coupled to drivers, lifecycle, and database timeout handling.

# Phase 4: PostgreSQL From Node.js

## Day 27: PostgreSQL and `pg` Pool Lifecycle

- **Topics:** PostgreSQL boundary, pg Pool, pool sizing, parameterized queries, result rows, connection errors, idle errors, configuration, and shutdown
- **Prerequisites:** Days 04, 10, 12, and 13
- **Future lecture:** `day-27-postgresql-and-pg-pool-lifecycle.md`
- **Node relevance:** A bounded pool protects the database and gives the Node service reusable connections.
- **Official references:** node-postgres; Pooling; Pool API
- **Exercise:** Create a pool module with query and shutdown helpers.
- **Interview focus:** Pool per request, leaked clients, and unbounded connections.

## Day 28: Parameterized SQL CRUD

- **Topics:** SELECT, INSERT, UPDATE, DELETE, placeholders, RETURNING, null handling, rows, counts, constraint errors, pagination, and injection prevention
- **Prerequisites:** Day 16 and Day 27
- **Future lecture:** `day-28-parameterized-sql-crud.md`
- **Node relevance:** Parameterized SQL keeps values separate from query structure.
- **Official references:** node-postgres queries; PostgreSQL tutorial; SQL commands
- **Exercise:** Implement a safe repository for one relational resource.
- **Interview focus:** Dynamic identifiers, unsafe sort columns, and affected-row counts.

## Day 29: Relational Correctness for APIs

- **Topics:** Tables, primary and foreign keys, unique, check, not-null, normalization, migrations, and application versus database validation
- **Prerequisites:** Day 28; JavaScript roadmap Day 26
- **Future lecture:** `day-29-relational-correctness-for-apis.md`
- **Node relevance:** Database constraints protect correctness when multiple requests race.
- **Official references:** Constraints; PostgreSQL tutorial; Schema changes
- **Exercise:** Design constrained users and orders tables and map failures to API responses.
- **Interview focus:** Validation races, foreign-key tradeoffs, and migration order.

## Day 30: Query Composition and Performance Awareness

- **Topics:** Logical SQL order, joins, grouping, aggregates, subqueries, CTEs, window functions, indexes, selectivity, ordering, write cost, and EXPLAIN
- **Prerequisites:** Day 29 and Day 24
- **Future lecture:** `day-30-sql-composition-and-performance-awareness.md`
- **Node relevance:** Query plans and workload assumptions matter more than the existence of an index.
- **Official references:** SQL language; Indexes; Using EXPLAIN; Window functions
- **Exercise:** Compare two paginated report queries and state what explain could disprove.
- **Interview focus:** Join multiplication, filtering, cardinality, and benchmark assumptions.

## Day 31: Transactions, MVCC, Isolation, and Locks

- **Topics:** Pool client checkout, BEGIN, COMMIT, ROLLBACK, release, transaction ownership, MVCC, isolation anomalies, row locks, deadlocks, and retry boundaries
- **Prerequisites:** Days 10 and 27-30
- **Future lecture:** `day-31-postgresql-transactions-mvcc-and-locks.md`
- **Node relevance:** A multi-query business operation needs one client and explicit transaction ownership.
- **Official references:** node-postgres transactions; Transaction isolation; Explicit locking
- **Exercise:** Force a failure between statements and verify rollback and release.
- **Interview focus:** pool.query transactions, isolation levels, deadlocks, and retries.

## Day 32: PostgreSQL in Express

- **Topics:** Repositories, services, transaction ownership, pool exhaustion, query timeouts, migrations, constraint errors, integration tests, and database choice
- **Prerequisites:** Days 13-20 and 27-31
- **Future lecture:** `day-32-postgresql-in-express.md`
- **Node relevance:** Express should expose application outcomes without owning SQL mechanics.
- **Official references:** Suggested project structure; Express guide; node-postgres transactions
- **Exercise:** Build one resource and one transaction-backed service operation.
- **Interview focus:** Transactions in controllers, unreleased clients, and hidden database pressure.

# Phase 5: Reliable Backend Integration

## Day 33: Layered Backend Architecture

- **Topics:** Routes, controllers, services, domain decisions, repositories, configuration, dependency direction, pure cores, side-effect edges, error contracts, and database choice
- **Prerequisites:** JavaScript roadmap Day 26; Days 13, 26, and 32
- **Future lecture:** `day-33-layered-backend-architecture.md`
- **Node relevance:** Layering makes changing transports, databases, and business rules less expensive.
- **Official references:** Node modules; Express guide
- **Exercise:** Refactor a database-aware route into explicit layers.
- **Interview focus:** Over-abstraction, fat controllers, and unclear ownership.

## Day 34: Deadlines, Retries, and Idempotency

- **Topics:** Deadlines, cancellation, retryable versus permanent errors, backoff, jitter, retry budgets, idempotency keys, duplicate work, outbox concepts, and cleanup
- **Prerequisites:** Days 10, 17, 18, 25, and 31
- **Future lecture:** `day-34-deadlines-retries-and-idempotency.md`
- **Node relevance:** Failure handling must bound time and prevent duplicate side effects.
- **Official references:** AbortController; Node errors
- **Exercise:** Design a payment-like workflow and define safe retry steps.
- **Interview focus:** Retry storms, uncertain outcomes, and timeout versus cancellation.

## Day 35: Caching and Rate Limiting

- **Topics:** Cache keys, TTL, invalidation, cache-aside, stampede control, process-local versus shared cache, token buckets, distributed limits, and stale data
- **Prerequisites:** JavaScript roadmap Days 21-22; Days 18, 20, and 33-34
- **Future lecture:** `day-35-caching-and-rate-limiting.md`
- **Node relevance:** Caching and rate limiting change consistency and resource ownership assumptions.
- **Official references:** Node memory guidance; OWASP brute-force guidance
- **Exercise:** Design a cache and login rate limit with degraded behavior.
- **Interview focus:** Cache as source of truth, local counters, and invalidation.

## Day 36: Queues and Background Work

- **Topics:** Job lifecycle, enqueue, acknowledge, at-least-once delivery, retries, dead letters, visibility, idempotent consumers, scheduling, workers, and graceful stopping
- **Prerequisites:** Days 11, 12, 34, and 35
- **Future lecture:** `day-36-queues-and-background-work.md`
- **Node relevance:** Background work protects request latency but introduces duplicate and delayed execution.
- **Official references:** Child processes; Worker threads; Streams
- **Exercise:** Design an email or report job with states and retry rules.
- **Interview focus:** Exactly-once assumptions, worker crashes, and shutdown.

## Day 37: Observability and Production Operations

- **Topics:** Structured logs, request IDs, metrics, traces, latency percentiles, error rates, event-loop lag, pool metrics, health, readiness, and degradation
- **Prerequisites:** Days 12, 20, 26, 32, and 36
- **Future lecture:** `day-37-observability-and-production-operations.md`
- **Node relevance:** Observability connects user-visible symptoms to runtime and database causes.
- **Official references:** Performance hooks; Diagnostics channel; Node report
- **Exercise:** Define signals, dashboards, readiness behavior, and one alert for an API.
- **Interview focus:** Average latency, weak health checks, and secret-bearing logs.

## Day 38: Security Review of a Node Backend

- **Topics:** Untrusted input, injection, SSRF, traversal, unsafe child processes, denial of service, secrets, dependency risk, authorization gaps, data exposure, and safe errors
- **Prerequisites:** JavaScript roadmap Day 25; Days 04-06, 16, 19-20, and 33
- **Future lecture:** `day-38-security-review-of-a-node-backend.md`
- **Node relevance:** Security review follows data across trust boundaries rather than checking one middleware list.
- **Official references:** Node security best practices; OWASP Top 10; Express security
- **Exercise:** Review a flawed service, fix one vulnerability, and add a regression test.
- **Interview focus:** Authentication versus authorization, defense in depth, and dependency risk.

# Phase 6: Interview and Capstone Integration

## Day 39: Testing Strategy Across Boundaries

- **Topics:** Unit tests, HTTP tests, repository integration tests, database isolation, contract tests, failure injection, fixtures, fake timers, mocks, and cleanup
- **Prerequisites:** JavaScript roadmap Day 23; Days 12, 20, 26, 32, and 37
- **Future lecture:** `day-39-testing-strategy-across-boundaries.md`
- **Node relevance:** Tests should prove behavior at the boundary where failure matters.
- **Official references:** Node test runner; Express best practices
- **Exercise:** Build pure, HTTP, and database tests for one endpoint.
- **Interview focus:** Over-mocking, brittle implementation tests, and leaked resources.

## Day 40: Performance and Debugging Case Studies

- **Topics:** Event-loop blocking, microtask starvation, stream memory growth, pool exhaustion, slow queries, missing indexes, memory retention, retry storms, timeouts, reproduction, and measurement
- **Prerequisites:** Days 02, 08, 10, 24, 30, 31, and 34-37
- **Future lecture:** `day-40-performance-and-debugging-case-studies.md`
- **Node relevance:** Performance diagnosis needs evidence that separates CPU, I/O, database, network, and memory causes.
- **Official references:** Node diagnostics; Performance hooks; PostgreSQL EXPLAIN
- **Exercise:** Write incident reports with symptom, hypothesis, check, cause, fix, and regression test.
- **Interview focus:** Optimizing before measuring and confusing symptoms with causes.

## Day 41: Backend Design Interview Patterns

- **Topics:** Requirements, API boundaries, data choice, consistency, latency, throughput, failure modes, retries, queues, caching, observability, security, capacity, and tradeoffs
- **Prerequisites:** Days 33-40
- **Future lecture:** `day-41-backend-design-interview-patterns.md`
- **Node relevance:** A strong design answer begins with assumptions and follows data and failure paths.
- **Official references:** Official Node.js, Express, MongoDB, and PostgreSQL references
- **Exercise:** Design a notification or order API and defend each major choice.
- **Interview focus:** Clarifying questions, smallest defensible design, and scale changes.

## Day 42: Senior Node Interview Integration and Capstone Review

- **Topics:** Express composition, Node runtime, MongoDB and PostgreSQL boundaries, transactions, retries, security, performance, observability, testing, shutdown, and maintainability
- **Prerequisites:** Days 01-41
- **Future lecture:** `day-42-senior-node-interview-integration-and-capstone.md`
- **Node relevance:** Senior interviews test whether local decisions remain correct across the full service lifecycle.
- **Official references:** Node.js docs; Express guide; MongoDB driver; node-postgres; PostgreSQL docs
- **Exercise:** Review a complete service and produce a risk register with evidence, fixes, and tests.
- **Interview focus:** End-to-end debugging, competing fixes, and senior reliability follow-ups.

# Roadmap Boundary

This roadmap covers Node.js runtime behavior, Express HTTP applications, Node-facing MongoDB and PostgreSQL integration, backend reliability, security, testing, observability, and interview reasoning. It intentionally does not replace the separate JavaScript, MongoDB, PostgreSQL, DSA, system-design, or deployment courses.

The [JavaScript roadmap](../Javascript/javascript-roadmap.md) is the prerequisite for language semantics. The database courses should contain deep data modeling, administration, query planning, replication, backup, and tuning material.

# Node.js Coverage Matrix

| Required backend area | Roadmap days |
| --- | --- |
| Runtime, event loop, modules, process, filesystem, buffers, events, streams | 1-8 |
| HTTP, networking, workers, diagnostics, testing, and shutdown | 9-12 |
| Express structure, middleware, routing, validation, errors, APIs, security | 13-20 |
| MongoDB Node driver, CRUD, modeling decisions, aggregation, indexes, transactions | 21-26 |
| PostgreSQL `pg`, SQL CRUD, constraints, queries, indexes, transactions | 27-32 |
| Architecture, reliability, caching, queues, operations, and security | 33-38 |
| Testing, debugging, design interviews, and senior integration | 39-42 |

# Source Policy

- Use [Node.js Learn](https://nodejs.org/en/learn/) and the [Node.js API documentation](https://nodejs.org/api/) for runtime behavior.
- Use the [Express guide](https://expressjs.com/en/guide/) and [Express API documentation](https://expressjs.com/en/5x/api.html) for framework behavior.
- Use the [MongoDB Node.js driver documentation](https://www.mongodb.com/docs/drivers/node/current/) for driver examples and the MongoDB manual for linked mastery topics.
- Use [node-postgres](https://node-postgres.com/) for `pg` behavior and the [PostgreSQL documentation](https://www.postgresql.org/docs/current/) for SQL and database behavior.
- Rewrite explanations in original language and identify behavior that depends on runtime, framework, driver, optimizer, configuration, or workload.

