# Day 12: Testing, Diagnostics, Observability, and Shutdown

<nav aria-label="Lecture navigation">

[← Previous: Worker Threads and Child Processes](day-11-worker-threads-and-child-processes.md) | [Roadmap](../node-roadmap.md) | [Next: Express Application Structure](day-13-express-application-structure.md)

</nav>

## Prerequisites

Before diving into diagnostics and shutdown architecture, review:
- [Day 02: Event Loop and Scheduling](day-02-event-loop-and-scheduling.md) for event-loop latency and microtask queue mechanics.
- [Day 04: Process, Configuration, and Lifecycle](day-04-process-configuration-and-lifecycle.md) for OS signals (`SIGTERM`, `SIGINT`), exit codes, and process teardown.
- [Day 07: Events, Timers, and Resource Ownership](day-07-events-timers-and-resource-ownership.md) for active handle leaks and unref timers.
- [Day 09: Node HTTP Fundamentals](day-09-node-http-fundamentals.md) for `server.close()` and `server.closeIdleConnections()`.
---

## Core Concepts

### 1. Modern Testing Architecture: Separation of Concerns & `node:test`

A testable Node.js architecture isolates HTTP route handling and application assembly from network socket binding.

If an application binds a port immediately upon file execution (`app.listen(3000)` inside `server.js`), tests cannot import the application without colliding on ports, leaking socket handles, and introducing network dependencies.

```text
┌─────────────────────────────────┐
│ app.js                          │ ──► Used in Unit / Integration Tests
│ export function createApp(deps) │     (In-memory, supertest, or ephemeral port 0)
└────────────────┬────────────────┘
                 │
┌────────────────▼────────────────┐
│ server.js                       │ ──► Executed in Production Dockerfile
│ const app = createApp(prodDeps)│     (Only binds port 3000 when executed as main)
│ app.listen(process.env.PORT)    │
└─────────────────────────────────┘
```

The native `node:test` module (Node 18+ LTS, stable in Node 20+) eliminates heavy external testing dependencies like Jest or Mocha:
- Executes asynchronously with native Promise and `async/await` support.
- Provides subtest structuring via `describe()` and `it()`.
- Built-in mocking via `mock.fn()` and `mock.method()`.
- Fake timers via `mock.timers.enable()` for deterministic scheduling assertions.

---

### 2. Event-Loop Latency vs Upstream Latency

When diagnosing latency degradation, distinguishing between local CPU starvation and downstream I/O blocking is critical:

```text
High Response Latency (e.g. 2500ms p99)
      │
      ├── High Event-Loop Delay (>50ms p99)? ──► CPU Blocked: Sync JSON parsing, regex ReDoS, crypto, massive loops
      │
      └── Low Event-Loop Delay (<2ms p99)? ────► I/O Blocked: Slow database queries, unindexed scans, pool starvation
```

Node's `perf_hooks.monitorEventLoopDelay({ resolution: 20 })` samples the delay between consecutive ticks using a high-resolution timer. It tracks a histogram of event-loop stalls:
- **`mean`**: Average delay in nanoseconds.
- **`percentile(50)` (p50)**: Median event loop responsiveness.
- **`percentile(99)` (p99)**: Tail latency identifying micro-freezes.
- **`max`**: The longest continuous freeze of the single JavaScript thread.

---

### 3. Memory Profiling, Heap Snapshots, and Handle Leaks

Memory leaks in Node.js occur when object references remain reachable through global variables, event listener closures, or un-drained buffers.

```text
V8 Process Memory
┌─────────────────────────────────────────────────────────────┐
│ Resident Set Size (RSS)                                     │
│ ┌───────────────────────────┬─────────────────────────────┐ │
│ │ V8 Managed Heap           │ Native C++ / Buffer Memory   │ │
│ │ - New Space (Young gen)   │ - Node.js Buffer pool       │ │
│ │ - Old Space (Long-lived)  │ - Libuv threadpool tasks    │ │
│ │ - Code & Map metadata     │ - Sockets & SSL context     │ │
│ └───────────────────────────┴─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Diagnostic Artifacts:
1. **Heap Snapshot (`v8.writeHeapSnapshot()`)**: Captures every object on the V8 heap with retainer trees. Inspecting two snapshots in Chrome DevTools using the "Comparison" view reveals which constructor holds accumulating memory.
2. **Diagnostic Report (`process.report.writeReport()`)**: Dumps a complete JSON report of native memory, environment variables, loaded modules, OS resource limits, and all active libuv handles without crashing the process.
3. **Open Handles Tracking**: Unclosed sockets, unref timers, and worker channels prevent the Node.js process from exiting cleanly. Inspecting `process._getActiveHandles()` pinpoints dangling resources holding the event loop open during test teardown.

---

### 4. Enterprise Observability: Logs, Metrics, and Context Propagation

Production observability combines structured logging, distributed context, and aggregate metrics:

| Observability Pillar | Primary Responsibility | Best Practice / Implementation |
| :--- | :--- | :--- |
| **Structured Logs** | Machine-readable discrete event records (JSON). | Log NDJSON to `stdout`. Correlate via `traceId`. Never log passwords, tokens, or PII. |
| **Context Propagation**| Maintaining contextual request IDs across async boundaries. | Use `AsyncLocalStorage` to store `traceId` and user context without parameter drilling. |
| **Metrics** | Real-time aggregate telemetry (Counters, Histograms). | Use Prometheus/OpenTelemetry format. Normalize route paths to prevent cardinality explosion. |
| **Distributed Traces**| End-to-end request latency breakdown across microservices. | Propagate W3C `traceparent` headers across all outbound network boundaries. |

---

### 5. High-Availability Health Checks: Liveness vs Readiness

> **Liveness vs Readiness**: Liveness determines if the container process is alive and should not be killed; Readiness determines if the instance should receive inbound traffic.

In containerized environments (Kubernetes, ECS), misconfigured health check probes frequently cause catastrophic cluster-wide outages.

```text
Incoming Traffic (Ingress / ALB)
      │
      ▼
┌──────────────┐   Readiness Probe (/readyz) === FAIL
│ Pod Replica 1│ ──► [Traffic Detached! Pod kept alive to drain/recover]
└──────────────┘
┌──────────────┐   Liveness Probe (/livez) === FAIL
│ Pod Replica 2│ ──► [SIGKILL Issued! Container rebooted immediately!]
└──────────────┘
```

- **Liveness Probe (`/livez`)**: Asks: *"Is the Node.js process deadlocked, in an infinite loop, or unable to run the event loop?"*
  - **Contract**: Check only internal runtime health (e.g. event-loop responsiveness, memory threshold).
  - **Rule**: **NEVER check external dependencies (DB, Redis, upstream APIs)**. If your database becomes momentarily unavailable, every container fails liveness simultaneously. Kubernetes kills all pods at once, compounding the database outage with a massive thundering-herd restart surge.
- **Readiness Probe (`/readyz`)**: Asks: *"Is this specific instance capable of processing incoming HTTP traffic right now?"*
  - **Contract**: Check initialization completion, local dependency availability, and whether graceful shutdown has begun.
  - **Rule**: If the database is unreachable or the pod is shutting down, return HTTP 503. The load balancer removes the pod from the routing table without restarting the container.

---

### 6. Production Graceful Shutdown State Machine

Graceful shutdown ensures in-flight requests finish cleanly and pending database transactions commit before the container process terminates.

```text
[SIGTERM / SIGINT Received]
          │
          ▼
1. Mark Instance NOT READY (readiness probe returns 503)
          │
          ▼
2. Wait Kubernetes Endpoint Propagation Buffer (e.g. 5 seconds)
          │
          ▼
3. Stop Ingress: server.close() & server.closeIdleConnections()
          │
          ▼
4. Drain In-Flight Work: Wait for active requests with hard deadline (e.g. 15s)
          │
          ▼
5. Close Data Resources: Drain DB connection pools, close message brokers
          │
          ▼
6. Flush Telemetry: Flush log buffers & metrics
          │
          ▼
7. Terminate: process.exit(0)
```

- **Idempotence**: A second `SIGTERM` or `SIGINT` received while shutdown is in progress must not launch parallel teardown routines; it should escalate to immediate forced termination.
- **Hard Deadline Budget**: An uncooperative client streaming data must not keep the container alive indefinitely. Enforce a hard timeout (e.g., 20 seconds) after which all sockets are forcibly destroyed via `socket.destroy()` and `process.exit(1)` is triggered.

---

## Code Snippets and Demonstrations

### 1. Zero-Dependency HTTP Testing with Native `node:test`

Demonstrating an application factory tested via Node's native test runner without port conflicts or mocking bloat.

```js
// Node.js code
// filename: app-and-test.mjs
import http from 'node:http';
import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

// Application Factory: Decoupled from listen()
export function createApp(databaseService) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === '/users' && req.method === 'GET') {
      try {
        const users = await databaseService.listUsers();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ data: users }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    }

    res.writeHead(404);
    res.end();
  });
}

// Integration Test Suite
describe('User API Integration Tests', () => {
  let server;
  let testPort;

  // Mock database dependency
  const mockDb = {
    listUsers: async () => [{ id: 'usr_1', name: 'Alice' }]
  };

  before((done) => {
    const app = createApp(mockDb);
    // Bind to port 0 to let OS assign an ephemeral unused port!
    server = app.listen(0, () => {
      testPort = server.address().port;
      done();
    });
  });

  after((done) => {
    server.close(done); // Ensure socket handles close cleanly
  });

  it('GET /users returns 200 with user data', async () => {
    const response = await fetch(`http://127.0.0.1:${testPort}/users`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'application/json');

    const body = await response.json();
    assert.deepEqual(body, { data: [{ id: 'usr_1', name: 'Alice' }] });
  });

  it('GET /unmatched returns 404', async () => {
    const response = await fetch(`http://127.0.0.1:${testPort}/not-found`);
    assert.equal(response.status, 404);
  });
});
```

---

### 2. High-Precision Event-Loop Latency Monitoring

Instrumenting event-loop delay histograms and exporting percentiles to detect main thread stalls.

> **Event-Loop Delay**: The extra latency between when a timer or I/O callback was scheduled to run and when the event loop actually executes it.

```js
// Node.js code
// filename: event-loop-monitor.mjs
import { monitorEventLoopDelay } from 'node:perf_hooks';

export class EventLoopMetricsCollector {
  constructor(options = {}) {
    const { resolutionMs = 20, sampleIntervalMs = 5000 } = options;
    // Monitor event loop delay in nanoseconds
    this.histogram = monitorEventLoopDelay({ resolution: resolutionMs });
    this.sampleIntervalMs = sampleIntervalMs;
    this.timer = null;
  }

  start() {
    this.histogram.enable();
    this.timer = setInterval(() => {
      const p50Ms = (this.histogram.percentile(50) / 1e6).toFixed(2);
      const p99Ms = (this.histogram.percentile(99) / 1e6).toFixed(2);
      const maxMs = (this.histogram.max / 1e6).toFixed(2);
      const meanMs = (this.histogram.mean / 1e6).toFixed(2);

      console.log(`[EventLoop Telemetry] Mean: ${meanMs}ms | p50: ${p50Ms}ms | p99: ${p99Ms}ms | Max: ${maxMs}ms`);

      if (parseFloat(p99Ms) > 50.0) {
        console.warn(`[ALERT] Event-loop stall detected! p99 delay is ${p99Ms}ms`);
      }

      // Reset histogram for next sample window
      this.histogram.reset();
    }, this.sampleIntervalMs);

    // Don't keep event loop open solely for metric reporting
    this.timer.unref();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.histogram.disable();
  }
}
```

---

### 3. Context-Correlated Structured Logging via `AsyncLocalStorage`

Providing traceable request context without passing a logger parameter across every service layer.

```js
// Node.js code
// filename: context-logger.mjs
import { AsyncLocalStorage } from 'node:async_hooks';
import crypto from 'node:crypto';

export const requestContext = new AsyncLocalStorage();

export class StructuredLogger {
  static format(level, message, metadata = {}) {
    const context = requestContext.getStore() || {};
    
    // Mask sensitive fields
    const sanitizedMeta = { ...metadata };
    for (const key of ['password', 'token', 'authorization', 'secret']) {
      if (key in sanitizedMeta) sanitizedMeta[key] = '[REDACTED]';
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      traceId: context.traceId || 'none',
      userId: context.userId || null,
      ...sanitizedMeta
    };

    // Output strictly formatted NDJSON to stdout
    process.stdout.write(JSON.stringify(logEntry) + '\n');
  }

  static info(message, metadata) { this.format('INFO', message, metadata); }
  static warn(message, metadata) { this.format('WARN', message, metadata); }
  static error(message, metadata) { this.format('ERROR', message, metadata); }
}

// HTTP Middleware wrapper
export function withRequestContext(req, res, next) {
  const traceId = req.headers['x-request-id'] || crypto.randomUUID();
  const store = { traceId, startTime: Date.now() };

  requestContext.run(store, () => {
    StructuredLogger.info('Inbound HTTP request started', {
      method: req.method,
      path: req.url
    });
    next();
  });
}
```

---

### 4. Enterprise-Grade Idempotent Graceful Shutdown Manager

A battle-tested graceful shutdown coordinator managing HTTP connections, database pools, and forced deadlines.

```js
// Node.js code
// filename: graceful-shutdown-manager.mjs

export class GracefulShutdownCoordinator {
  constructor(options = {}) {
    this.options = {
      drainTimeoutMs: 15000,
      k8sPropagationDelayMs: 2000,
      ...options
    };
    this.state = 'RUNNING'; // 'RUNNING' | 'SHUTTING_DOWN' | 'TERMINATED'
    this.resources = [];
    this.shutdownPromise = null;
  }

  registerResource(name, closeFunction) {
    this.resources.push({ name, close: closeFunction });
  }

  isShuttingDown() {
    return this.state !== 'RUNNING';
  }

  initiate(signal) {
    if (this.shutdownPromise) {
      console.warn(`[Shutdown] Second signal (${signal}) received! Forcing immediate termination.`);
      process.exit(1);
    }

    console.log(`[Shutdown] Initiating graceful shutdown via ${signal}...`);
    this.state = 'SHUTTING_DOWN';

    this.shutdownPromise = (async () => {
      // Force exit safeguard
      const forceTimer = setTimeout(() => {
        console.error(`[Shutdown] Forced shutdown: Exceeded hard timeout of ${this.options.drainTimeoutMs}ms`);
        process.exit(1);
      }, this.options.drainTimeoutMs);
      forceTimer.unref();

      try {
        // Step 1: Wait for Kubernetes ingress propagation
        if (this.options.k8sPropagationDelayMs > 0) {
          console.log(`[Shutdown] Waiting ${this.options.k8sPropagationDelayMs}ms for ingress endpoint removal...`);
          await new Promise((r) => setTimeout(r, this.options.k8sPropagationDelayMs));
        }

        // Step 2: Teardown registered resources in reverse order
        for (const resource of [...this.resources].reverse()) {
          console.log(`[Shutdown] Closing resource: ${resource.name}...`);
          try {
            await resource.close();
            console.log(`[Shutdown] Successfully closed: ${resource.name}`);
          } catch (err) {
            console.error(`[Shutdown] Error closing ${resource.name}: ${err.message}`);
          }
        }

        console.log('[Shutdown] All resources drained cleanly. Exiting.');
        clearTimeout(forceTimer);
        this.state = 'TERMINATED';
        process.exit(0);
      } catch (err) {
        console.error(`[Shutdown] Fatal error during cleanup: ${err.message}`);
        process.exit(1);
      }
    })();

    return this.shutdownPromise;
  }

  installSignalHandlers() {
    process.on('SIGTERM', () => void this.initiate('SIGTERM'));
    process.on('SIGINT', () => void this.initiate('SIGINT'));
  }
}
```

---

## Edge Cases and Tricky Scenarios

### 1. Dangling Test Handles and CI Timeouts

In CI environments, test runners often pass all assertions but hang indefinitely until killed by a 10-minute CI timeout.
- **The Cause**: Unclosed resources with active event-loop handles:
  1. An un-cleared `setInterval()` without `.unref()`.
  2. An open database connection pool with idle keep-alive sockets.
  3. A persistent HTTP agent socket waiting for reuse.
- **The Diagnostic**: Log active handles during test teardown:
  ```js
  // Node.js code
  after(() => {
    // Inspect what is keeping the event loop alive
    const handles = process._getActiveHandles();
    console.log(`Active handles count: ${handles.length}`);
    for (const h of handles) {
      console.log('Open handle type:', h.constructor.name);
    }
  });
  ```

### 2. The Slowloris Keep-Alive Trap During `server.close()`

When `server.close()` is invoked, Node stops accepting *new* incoming TCP connections, but **existing connections remain open**. If an HTTP/1.1 client holds an idle Keep-Alive socket, or a malicious client trickles 1 byte every 10 seconds, `server.close()` never invokes its completion callback.
- **The Fix**: Call `server.closeIdleConnections()` (Node.js 18.2+) immediately upon receiving a shutdown signal, and destroy any connection that does not conclude its request before the drain timeout.

---

## Node.js, JavaScript, and Systems Connections

```text
┌──────────────────────────────────────────────────────────────┐
│ Operating System & Container Runtime                         │
│ - POSIX Signals: SIGTERM (kill -15), SIGINT (Ctrl+C), SIGKILL│
│ - OS Resources: File descriptors, ephemeral ports, RSS memory│
│ - Kubernetes Controller: Kubelet Liveness/Readiness probes   │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ Node.js Core Infrastructure                                  │
│ - libuv Handles: Sockets, timers, pipes, watchers            │
│ - AsyncLocalStorage: Execution context tracking across ticks │
│ - perf_hooks: monitorEventLoopDelay histogram                │
│ - v8 / process.report: Memory dumps and diagnostic snapshots │
└──────────────┬───────────────────────────────┬───────────────┘
               │                               │
┌──────────────▼──────────────┐ ┌──────────────▼───────────────┐
│ Application Testing Layer   │ │ Observability & Lifecycle    │
│ - node:test & node:assert   │ │ - NDJSON structured logs     │
│ - Ephemeral port binding    │ │ - Cardinality-safe metrics   │
│ - Mock timers and functions │ │ - Idempotent shutdown state  │
└─────────────────────────────┘ └──────────────────────────────┘
```

- **JavaScript Engine (V8)**: V8's heap contains JavaScript objects, but large binary `Buffer` allocations and TLS crypto contexts reside in native C++ memory outside the JS heap, visible in RSS but not in `v8.getHeapStatistics().used_heap_size`.
- **Node Runtime**: `AsyncLocalStorage` hooks into V8 promise execution hooks to maintain asynchronous context without manual callback forwarding.
- **Container Infrastructure**: Kubernetes polls `/livez` to determine if the container should be restarted via `SIGKILL`, and `/readyz` to determine if the pod's IP should be added or removed from the CoreDNS service endpoints.

---

## Hands-On Exercise

### Scenario
A production API service crashes periodically under high traffic. Under investigation:
1. Tests hang in CI because the database connection pool remains open.
2. The service exposes a single `/health` endpoint that pings the Postgres database; when Postgres suffers high connection load, Kubernetes kills all API pods simultaneously, causing cascading restarts.
3. During deployments, in-flight customer orders are dropped because `process.exit(0)` is executed immediately upon `SIGTERM`.

### Buggy Code

```js
// Node.js code
// filename: buggy-service.mjs
import http from 'http';

// Database stub
const dbPool = {
  activeConnections: 5,
  query: async () => 'ok',
  end: () => {} // Never called!
};

// ❌ ANTI-PATTERN 1: Immediately binds port on import
const server = http.createServer(async (req, res) => {
  // ❌ ANTI-PATTERN 2: Checking database in liveness causes pod restarts during DB lag!
  if (req.url === '/health') {
    try {
      await dbPool.query();
      res.writeHead(200);
      res.end('OK');
    } catch (e) {
      res.writeHead(500); // Kubernetes restarts container!
      res.end('DEAD');
    }
    return;
  }

  if (req.url === '/order' && req.method === 'POST') {
    setTimeout(() => {
      res.writeHead(201);
      res.end(JSON.stringify({ orderId: 'ord_123' }));
    }, 2000);
  }
});

server.listen(3000);

// ❌ ANTI-PATTERN 3: Brutal shutdown drops in-flight /order requests!
process.on('SIGTERM', () => {
  console.log('SIGTERM received, exiting immediately');
  process.exit(0);
});
```

### Acceptance Criteria
1. Decouple `createApp(dbPool)` factory from `server.listen()`.
2. Implement separated `/livez` (process health only) and `/readyz` (dependency check & shutdown state awareness) endpoints.
3. Track active in-flight requests and drain them cleanly during `SIGTERM`.
4. Close idle sockets via `server.closeIdleConnections()` and close the database pool before exiting.
5. Provide a test suite using `node:test` that runs to completion without hanging open handles.

### Solution Code

```js
// Node.js code
// filename: solution-service.mjs
import http from 'node:http';

export function createApp(dbPool, shutdownState = { isStopping: false }) {
  let activeRequestCount = 0;

  const server = http.createServer(async (req, res) => {
    // 1. Kubernetes Liveness: Checks only event loop / process health
    if (req.url === '/livez') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      return res.end('OK');
    }

    // 2. Kubernetes Readiness: Checks shutdown state and database health
    if (req.url === '/readyz') {
      if (shutdownState.isStopping) {
        res.writeHead(503, { 'Content-Type': 'text/plain' });
        return res.end('SHUTTING_DOWN');
      }

      try {
        await dbPool.query('SELECT 1');
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end('READY');
      } catch (err) {
        res.writeHead(503, { 'Content-Type': 'text/plain' });
        return res.end('DATABASE_UNAVAILABLE');
      }
    }

    // Reject new business requests if shutdown started
    if (shutdownState.isStopping) {
      res.writeHead(503, { 'Connection': 'close' });
      return res.end('Server is shutting down');
    }

    // Track in-flight request
    activeRequestCount++;
    res.on('finish', () => {
      activeRequestCount--;
    });

    if (req.url === '/order' && req.method === 'POST') {
      setTimeout(() => {
        if (!res.writableEnded) {
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ orderId: 'ord_123' }));
        }
      }, 1000);
      return;
    }

    res.writeHead(404);
    res.end();
  });

  server.getActiveRequestCount = () => activeRequestCount;
  return server;
}

export async function gracefulShutdown(server, dbPool, shutdownState, timeoutMs = 10000) {
  shutdownState.isStopping = true;
  console.log('[Shutdown] Readiness probe marked 503. Stopping server ingress...');

  return new Promise((resolve, reject) => {
    const hardTimer = setTimeout(() => {
      reject(new Error('Graceful shutdown timeout exceeded'));
    }, timeoutMs);

    // Stop accepting new connections and close idle keep-alive sockets
    server.close(async (err) => {
      if (err) console.error('[Shutdown] Server close error:', err);

      try {
        console.log('[Shutdown] Draining database pool...');
        await dbPool.end();
        clearTimeout(hardTimer);
        console.log('[Shutdown] Teardown complete.');
        resolve();
      } catch (dbErr) {
        clearTimeout(hardTimer);
        reject(dbErr);
      }
    });

    if (typeof server.closeIdleConnections === 'function') {
      server.closeIdleConnections();
    }
  });
}
```

Accompanying test suite:
```js
// Node.js code
// filename: solution-service.test.mjs
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp, gracefulShutdown } from './solution-service.mjs';

describe('Resilient Service & Shutdown Tests', () => {
  it('handles in-flight request while shutting down and cleans up completely', async () => {
    let poolClosed = false;
    const mockDb = {
      query: async () => 'ok',
      end: async () => { poolClosed = true; }
    };

    const shutdownState = { isStopping: false };
    const app = createApp(mockDb, shutdownState);

    await new Promise((resolve) => app.listen(0, resolve));
    const port = app.address().port;

    // 1. Verify Liveness and Readiness
    const liveRes = await fetch(`http://127.0.0.1:${port}/livez`);
    assert.equal(liveRes.status, 200);

    const readyRes = await fetch(`http://127.0.0.1:${port}/readyz`);
    assert.equal(readyRes.status, 200);

    // 2. Dispatch an order request that takes 1000ms
    const orderPromise = fetch(`http://127.0.0.1:${port}/order`, { method: 'POST' });

    // Give request 50ms to enter handler
    await new Promise((r) => setTimeout(r, 50));
    assert.equal(app.getActiveRequestCount(), 1);

    // 3. Initiate graceful shutdown while order is still in-flight
    const shutdownPromise = gracefulShutdown(app, mockDb, shutdownState, 5000);

    // 4. Verify that readiness now reports 503
    const readyDuringShutdown = await fetch(`http://127.0.0.1:${port}/readyz`);
    assert.equal(readyDuringShutdown.status, 503);

    // 5. In-flight order completes successfully
    const orderRes = await orderPromise;
    assert.equal(orderRes.status, 201);
    const orderBody = await orderRes.json();
    assert.equal(orderBody.orderId, 'ord_123');

    // 6. Shutdown concludes and DB pool is closed
    await shutdownPromise;
    assert.equal(poolClosed, true);
  });
});
```

### Solution Explanation
1. **Decoupled Factory**: `createApp` creates an instance without binding ports, enabling automated testing via ephemeral OS ports (`listen(0)`).
2. **Probe Isolation**: `/livez` only confirms the Node.js process is active. `/readyz` validates the database connection and reports HTTP 503 during shutdown, gracefully detaching ingress traffic.
3. **In-Flight Draining**: `activeRequestCount` tracks ongoing operations. `server.close()` stops incoming traffic while existing handlers complete their responses.
4. **Leak-Free Teardown**: `server.closeIdleConnections()` eliminates idle Keep-Alive socket hangs, and `dbPool.end()` drains database connections, allowing test runners and production processes to terminate with zero leaked handles.

---

## Summary

- Isolate application creation from network port binding (`app.listen(0)`) to allow isolated, collision-free testing using `node:test`.
- Event-loop delay histograms (`monitorEventLoopDelay`) reveal CPU bottlenecks; low delay with high response latency points directly to slow I/O or pool contention.
- Pinpoint memory leaks using `v8.writeHeapSnapshot()` comparison views and track dangling asynchronous handles via `process._getActiveHandles()`.
- Production logs must use NDJSON with correlation IDs propagated via `AsyncLocalStorage`, and metrics must strictly avoid high-cardinality labels.
- Separate `/livez` (process survival) from `/readyz` (traffic eligibility) to prevent database glitches from triggering Kubernetes pod restart cascades.
- Graceful shutdown must be idempotent, stop ingress, close idle keep-alive connections, drain in-flight transactions, close database pools, and enforce a hard termination timeout.

---

## Cheat Sheet

| Concern | Pattern / Primitive | Production Rule |
| :--- | :--- | :--- |
| **Testing** | `node:test` + `server.listen(0)` | Run tests concurrently on ephemeral OS ports without collisions |
| **Event Loop Delay** | `monitorEventLoopDelay({ resolution: 20 })` | Alert if p99 latency exceeds 50ms |
| **Leak Investigation** | `v8.writeHeapSnapshot()` | Compare snapshots taken 10 minutes apart under constant load |
| **Context Tracking** | `AsyncLocalStorage` | Propagate `traceId` and user metadata without function parameter bloat |
| **Metrics Labels** | Normalized path `/api/users/:id` | Never use raw user IDs or UUIDs as metric labels |
| **K8s Liveness** | Shallow `/livez` | Never query databases or third-party APIs inside liveness probes |
| **Graceful Drain** | `server.closeIdleConnections()` | Evict idle Keep-Alive sockets to prevent shutdown hangs |

### Common Pitfalls
- **Binding production ports inside imported modules**: Collides during parallel test runs and prevents ephemeral port testing.
- **Querying databases in Liveness checks**: Causes all pods to be killed and restarted during database hiccups, turning small glitches into full outages.
- **Calling `process.exit(0)` on `SIGTERM` without draining**: Abruptly severs TCP sockets, dropping customer orders and generating client 502 Bad Gateway errors.
- **Unbounded Prometheus metric labels**: Generating labels from dynamic URLs causes memory exhaustion in time-series databases.

---

## Interview Questions

### 1. Why is coupling database connectivity checks to a Kubernetes Liveness probe considered a critical architectural anti-pattern?

A Kubernetes **Liveness probe (`/livez`)** has one specific responsibility: answering whether the container's main process is healthy and capable of executing its loop. If a liveness probe fails consecutively, the Kubernetes Kubelet forcibly terminates the container (`SIGKILL`) and restarts it.

If an application checks database connectivity inside its liveness probe and the database experiences a temporary latency spike, connection pool saturation, or restart, every API container's liveness check fails at the same time. The Kubernetes orchestrator immediately kills and restarts **every container across the entire cluster**. When all pods restart simultaneously, they flood the struggling database with connection requests during initialization, prolonging the outage and creating a catastrophic **cascading restart storm**.

The correct architecture decouples liveness from readiness:
- The **Liveness probe (`/livez`)** checks only internal process health (event loop responsiveness and memory thresholds).
- The **Readiness probe (`/readyz`)** checks database availability and dependency health. When the database lags, readiness fails, causing Kubernetes to remove the pods from the ingress load balancer without restarting them, giving the database time to recover.

### 2. How does `perf_hooks.monitorEventLoopDelay()` differ from measuring HTTP response latency, and how do you use both to diagnose performance bottlenecks?

HTTP response latency measures the total elapsed time between when an HTTP request enters the server and when the final byte of the response is written back to the client. This metric includes network transmission time, database query latency, third-party API waits, and thread scheduling delays.

In contrast, `monitorEventLoopDelay()` measures **microsecond-level scheduling delay of the JavaScript event loop itself**. It uses a high-resolution native timer that records how long the event loop takes to execute scheduled turns. If no synchronous JavaScript is blocking the thread, the delay is nearly zero (<1–2ms).

By comparing the two metrics, you can immediately identify the root cause of an outage:
1. **High HTTP Latency + High Event Loop Delay (p99 > 50ms)**: The bottleneck is **CPU-bound JavaScript**. The main thread is frozen by intensive synchronous computation, massive JSON serialization, regex backtracking (ReDoS), or heavy synchronous loops.
2. **High HTTP Latency + Low Event Loop Delay (p99 < 2ms)**: The JavaScript runtime is completely idle. The bottleneck is **I/O blocking**. The application is waiting on slow database queries, connection pool exhaustion, lock contention, or slow external third-party microservices.

### 3. What is the root cause of test suites hanging after all assertions pass, and how do you diagnose and prevent it?

A Node.js process exits when its libuv event loop has **zero active handles and zero active requests**. If a test suite passes every assertion but fails to terminate, at least one asynchronous resource is holding an active handle open on the event loop.

> **Active Handle**: An open libuv reference (TCP socket, server listener, active timer, child process pipe) that keeps the Node.js event loop alive.

Common culprits include:
1. **Dangling Intervals**: A `setInterval()` called in an imported utility or metric reporter that was never cleared with `clearInterval()` or detached with `.unref()`.
2. **Database Connection Pools**: Open TCP sockets in database connection pools (such as `pg.Pool` or `MongoClient`) maintaining persistent Keep-Alive connections.
3. **HTTP Server Listeners**: Failing to invoke `server.close()` in an `after()` lifecycle hook.
4. **Persistent Message Queues / Workers**: Active Redis clients or Worker Thread `MessagePort` channels remaining open.

To diagnose the dangling handle, developers inspect `process._getActiveHandles()` in test teardown hooks, which returns an array of live libuv handles (`Socket`, `Timer`, `Pipe`, `Server`). The prevention rule is to strictly isolate application creation into factories, register cleanup hooks in `after()` blocks, and ensure all background monitors call `.unref()` on their internal timers.

### 4. Walk through the necessary steps for an enterprise-grade graceful shutdown of a Node.js microservice upon receiving a `SIGTERM`.

An enterprise graceful shutdown must execute a carefully choreographed, multi-phase sequence:

1. **Idempotency Guard & Deadline Arming**: Record that shutdown has begun. If a duplicate signal arrives, force immediate exit. Start a global termination timer (e.g., 20 seconds) configured to call `process.exit(1)` if cleanup exceeds the deadline.
2. **Fail Readiness Probes**: Update internal state so `/readyz` immediately returns HTTP 503. This informs the Kubernetes Ingress / AWS ALB to stop routing new traffic to this container pod.
3. **Wait Ingress Propagation Buffer**: Pause for 2–5 seconds (`setTimeout`). In cloud environments, there is a delay between when a pod becomes unready and when external proxy routing tables finish updating; this brief sleep prevents dropping requests routed during that propagation window.
4. **Stop HTTP Ingress & Evict Idle Connections**: Call `server.close()`, which stops accepting new TCP connections. Immediately call `server.closeIdleConnections()` to terminate open HTTP Keep-Alive connections that are not actively serving a request.
5. **Drain In-Flight Requests**: Allow active, in-flight requests to complete their execution and return responses to clients.
6. **Drain Data and Messaging Resources**: Sequentially or concurrently close background queue consumers (stop acknowledging new jobs), drain database connection pools (`await pool.end()`), and disconnect Redis/cache clients.
7. **Flush Telemetry and Exit**: Flush remaining asynchronous logging buffers (NDJSON streams) and OpenTelemetry spans, then invoke `process.exit(0)`.

---

<nav aria-label="Lecture navigation">

[← Previous: Worker Threads and Child Processes](day-11-worker-threads-and-child-processes.md) | [Roadmap](../node-roadmap.md) | [Next: Express Application Structure](day-13-express-application-structure.md)

</nav>