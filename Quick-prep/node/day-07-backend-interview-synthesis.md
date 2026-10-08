# Day 7: Testing Strategy, Performance Profiling, System Design, and Interview Synthesis

Quick review of main-course lectures 39–42. Designed for rapid interview revision: Testing pyramid across service boundaries, memory leak debugging, event loop profiling, Transactional Outbox pattern, and senior architectural trade-offs.

## Testing strategies across boundaries

**1. Testing pyramid: Unit vs Integration tests**

Balance test velocity and execution confidence across architectural layers:
- **Unit Tests:** Fast, isolated testing of pure domain logic and services using mocks/stubs for repositories and external gateways.
- **Integration Tests:** Test HTTP endpoints with `supertest` against real ephemeral database containers (using Testcontainers). Validates real SQL queries, migrations, and constraint enforcement.

```js
import request from "supertest";
import { app } from "../src/app.js";
import { pool } from "../src/db.js";

describe("POST /api/v1/orders", () => {
  beforeEach(async () => {
    await pool.query("TRUNCATE TABLE orders CASCADE;");
  });

  it("enforces database constraints and returns 201 on valid order", async () => {
    const res = await request(app)
      .post("/api/v1/orders")
      .send({ userId: "c7a4b88e-6701-4475-8120-cf6a17b07542", amount: 150.00 });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });
});
```

[Testing strategy across boundaries](../../Node/node-lectures/day-39-testing-strategy-across-boundaries.md)

## Diagnostics and performance profiling

**1. Diagnosing production latency: CPU vs Event Loop vs I/O**

When troubleshooting elevated latency in production:
1. **Event loop lag is high (>50ms):** Synchronous JavaScript execution is blocking the main thread. Run CPU profiler (`node --cpu-prof`).
2. **CPU is low (<20%) but latency is high:** The process is stalled waiting for external I/O (exhausted database connection pool, slow downstream HTTP dependency, or thread pool starvation).

```js
import { monitorEventLoopDelay } from "node:perf_hooks";

const histogram = monitorEventLoopDelay({ resolution: 10 });
histogram.enable();

setInterval(() => {
  console.log(`Event loop delay - p50: ${histogram.percentile(50) / 1e6}ms, p99: ${histogram.percentile(99) / 1e6}ms`);
  histogram.reset();
}, 10000).unref();
```

**2. Memory leak investigation and heap snapshots**

Capture heap snapshots on memory growth using `v8.writeHeapSnapshot()`. Inspect **Retained Size** (memory prevented from garbage collection by this reference) rather than Shallow Size.

```js
import v8 from "node:v8";

// Programmatic heap snapshot capture during elevated memory pressure
function captureHeapSnapshot() {
  const mem = process.memoryUsage();
  if (mem.heapUsed > 500 * 1024 * 1024) { // > 500MB
    const filename = `heap-${Date.now()}.heapsnapshot`;
    v8.writeHeapSnapshot(filename);
    console.warn(`Captured heap snapshot to ${filename}`);
  }
}
```

[Performance and debugging case studies](../../Node/node-lectures/day-40-performance-and-debugging-case-studies.md)

## Architecture blueprint and distributed consistency

**1. The Transactional Outbox pattern**

Never write to a database and publish to a message broker (RabbitMQ/Kafka) as two independent steps; a process crash between the two creates catastrophic data inconsistency (dual-write problem). Instead, write the event to an `outbox` table in the *same* database transaction, and use a separate CDC (Change Data Capture) worker to poll and publish to the broker.

```text
[HTTP Request]
      |
      v
[PostgreSQL Transaction BEGIN]
   |--> 1. INSERT INTO orders (...)
   |--> 2. INSERT INTO outbox_events (topic, payload)
[PostgreSQL Transaction COMMIT]  <-- Guarantees atomic persistence!
      |
      v
[Background Relayer Worker] ---> Reads outbox table ---> Publishes to Kafka/RabbitMQ
```

**2. Resilience checklist for senior backend interviews**

When presenting a backend architecture in interviews, systematically walk through these operational dimensions:
1. **Backpressure:** Are unbounded streams and queues defended by limits?
2. **Deadlines & Timeouts:** Do all network calls have explicit timeouts and cancellation signals?
3. **Idempotency:** Are retried requests protected against duplicate mutations?
4. **Graceful Degradation:** Can the system serve cached or degraded responses if downstream dependencies fail?
5. **Observability:** Are structured logs tagged with correlation trace IDs across service hops?

[Designing a reliable backend system](../../Node/node-lectures/day-41-designing-a-reliable-backend-system.md) | [Senior integration review and capstone](../../Node/node-lectures/day-42-senior-integration-review-and-capstone.md)

## Tricky points

1. **Testing and isolation**

**1.1 Over-mocking masking production failures**
Mocking database query functions in unit tests can hide real SQL syntax errors, missing columns, or foreign key constraint violations that only surface when executing against real database engines.

**1.2 Shared state in parallel integration tests**
Running database integration tests concurrently against the same shared database schema causes race conditions and flakiness as tests truncate or modify rows concurrently. Run tests with transactional rollbacks or separate test schemas.

2. **Profiling and memory**

**2.1 Shallow size vs Retained size confusion**
A root object (such as an array or closure) might have a shallow size of only 32 bytes, but retain hundreds of megabytes of nested user objects in memory. Always sort heap snapshots by Retained Size.

**2.2 Forgotten event listeners and timers**
Attaching `emitter.on("event", fn)` to long-lived objects (like `process` or singleton services) from short-lived HTTP request contexts retains the entire request scope and closures in memory indefinitely.

3. **Distributed architecture**

**3.1 The Dual-Write dilemma**
Attempting to update PostgreSQL and publish a message to a queue in two consecutive `await` statements without the Outbox pattern inevitably drops messages or creates phantom messages whenever network partitions or process crashes occur.