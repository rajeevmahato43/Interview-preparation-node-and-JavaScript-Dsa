# Day 37: Observability and Production Operations

<nav aria-label="Lecture navigation">

[Previous: Queues and Background Work](day-36-queues-and-background-work.md) | [Roadmap](../node-roadmap.md) | [Next: Security Review of a Node Backend](day-38-security-review-of-a-node-backend.md)

</nav>

## Prerequisites

- [Day 12: Testing, Diagnostics, Observability, and Shutdown](day-12-testing-diagnostics-observability-and-shutdown.md) — Event-loop delay histograms and diagnostic reporting.
- [Day 20: Express Security and HTTP Testing](day-20-express-security-and-http-testing.md) — Middleware flow and header inspection.
- [Day 36: Queues and Background Work](day-36-queues-and-background-work.md) — Asynchronous background lifecycle and worker health.
---

## Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           THE THREE PILLARS OF OBSERVABILITY                                │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  1. STRUCTURED LOGS (Discrete Events)
     "What happened at a specific instant?"
     {"timestamp":"2026-03-01T12:00:00Z","level":"error","correlationId":"req-99","msg":"DB Timeout"}
     ✓ High detail, high cardinality, searchable event history.

  2. METRICS (Aggregates over Time)
     "How is the system behaving right now in aggregate?"
     http_request_duration_seconds{status="500", route="/orders", quantile="0.99"} = 1.45s
     ✓ Low overhead, fast alerting, trends, capacity planning (RED & USE methods).

  3. DISTRIBUTED TRACES (Request Journeys)
     "Where did the request spend its latency budget across boundaries?"
     [Client ──► API Gateway (12ms) ──► Order Service (85ms) ──► Postgres (72ms)]
     ✓ Maps causality, pinpoints bottleneck services, visualizes network cascades.
```

### 1. Structured Logging and Context Propagation via `AsyncLocalStorage`

> **`AsyncLocalStorage`**: A native Node.js API that stores asynchronous execution context across callbacks and promises without manual parameter passing.

> **Structured Logging**: Emitting log entries as machine-readable JSON objects with standardized schema fields (`timestamp`, `level`, `correlationId`, `message`).

In production, human-readable console strings (`console.log("Error: " + err)`) are an operational liability. They cannot be reliably searched, filtered, or correlated across microservices.

Modern Node.js backends use high-performance JSON loggers (such as `pino`) combined with **`AsyncLocalStorage`**. This guarantees that every log statement automatically includes the active `correlationId`, `userId`, and `tenantId` without passing `req` down through the service and repository layers:

```javascript
// Node.js code
// pattern: Request Context Propagation using AsyncLocalStorage
import { AsyncLocalStorage } from 'node:async_hooks';
import crypto from 'node:crypto';
import pino from 'pino';

export const requestContext = new AsyncLocalStorage();
const rawLogger = pino({ level: process.env.LOG_LEVEL || 'info' });

// Context-aware proxy logger
export const logger = new Proxy(rawLogger, {
  get(target, prop) {
    if (typeof target[prop] === 'function') {
      return (...args) => {
        const store = requestContext.getStore();
        if (store) {
          // Auto-inject correlationId into log metadata object
          if (typeof args[0] === 'object' && args[0] !== null) {
            args[0] = { correlationId: store.correlationId, ...args[0] };
          } else {
            args.unshift({ correlationId: store.correlationId });
          }
        }
        return target[prop](...args);
      };
    }
    return target[prop];
  }
});

// Express Middleware
export function correlationMiddleware(req, res, next) {
  const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  res.setHeader('x-correlation-id', correlationId);

  // Run downstream chain inside isolated async context
  requestContext.run({ correlationId, path: req.path }, () => {
    next();
  });
}
```

---

### 2. Service-Level Monitoring: The RED Method vs The USE Method

> **RED Method**: A service-level monitoring methodology tracking **Rate** (req/s), **Errors** (failed req/s), and **Duration** (latency distribution).

Production systems require two complementary monitoring methodologies:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             RED METHOD VS USE METHOD MATRIX                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  THE RED METHOD (For Services & APIs):
  • RATE: Requests per second (http_requests_total)
  • ERRORS: Number of failed requests (http_requests_total{status=~"5.."})
  • DURATION: Time taken by requests in percentiles (http_request_duration_seconds)

  THE USE METHOD (For Hardware & Infrastructure Resources):
  • UTILIZATION: Percentage of time resource is busy (CPU %, Memory Heap %)
  • SATURATION: Amount of work queued waiting for resource (Event Loop Lag, Pool Waiters)
  • ERRORS: Physical error count (Socket drops, OOM crashes, disk write errors)
```

#### Why Averages Are Dangerous: The p99 Latency Trap
Never alert on or report "Average Latency" (arithmetic mean). If 99 requests take 10ms and 1 request takes 10,000ms:
$$\text{Average Latency} = \frac{(99 \times 10) + 10,000}{100} = \frac{10,990}{100} \approx 110\text{ms}$$
The average hides the disaster. To the operations dashboard, 110ms looks acceptable, but 1 out of every 100 paying customers experienced a catastrophic 10-second timeout! 
- **Rule:** *Always track **p50** (median), **p95**, and **p99** latency histograms.*

---

### 3. Node.js Specific Runtime Metrics

Because Node.js executes JavaScript on a single thread backed by the libuv thread pool, standard OS metrics (like CPU and RAM) fail to reveal runtime health. Three internal metrics must be continuously monitored:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           NODE.JS RUNTIME HEALTH SIGNALS                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  1. EVENT-LOOP DELAY (monitorEventLoopDelay):
     Measures how long callbacks wait on the libuv event loop.
     ✓ Healthy: < 10ms.
     ⚠️ Warning: 20ms - 50ms (Mild event loop congestion).
     💥 Critical: > 100ms (Synchronous blocking code freezing the entire process!).

  2. V8 HEAP USAGE (process.memoryUsage()):
     • heapUsed: Memory actively occupied by JavaScript objects.
     • heapTotal: Memory committed by V8 from OS.
     ✓ If heapUsed continuously climbs after GC without dropping: MEMORY LEAK!

  3. LIBUV ACTIVE HANDLES (process._getActiveHandles()):
     Counts active TCP sockets, open files, timers, and worker ports.
     ✓ If handle count grows linearly with traffic: SOCKET LEAK or UNCLEANED TIMERS!
```

```javascript
// Node.js code
// pattern: Monitoring Event-Loop Delay Histogram
import { monitorEventLoopDelay } from 'node:perf_hooks';

export function startEventLoopMonitoring(promGauge) {
  // Sample event loop delay every 10 milliseconds
  const histogram = monitorEventLoopDelay({ resolution: 10 });
  histogram.enable();

  setInterval(() => {
    // Record 99th percentile event loop delay in milliseconds
    const p99DelayMs = histogram.percentile(99) / 1e6;
    promGauge.set(p99DelayMs);
    histogram.reset();
  }, 5000).unref();
}
```

---

### 4. Decoupling Kubernetes Health Probes

In containerized architectures, configuring health check probes incorrectly leads to catastrophic **Cascading Outages**:

| Probe Type | Kubernetes Question | What It Should Check | Disaster Anti-Pattern |
|---|---|---|---|
| **Startup Probe (`/startupz`)** | "Has the process finished bootstrapping?" | DB connection established, config loaded, cache warmed. | Omitting this probe; causes K8s to kill slow-starting pods prematurely. |
| **Liveness Probe (`/livez`)** | "Is the Node process alive and responsive, or deadlocked?" | Shallow event-loop tick: `res.status(200).send('OK')`. | **Querying the database here!** If Postgres has a 5s blip, K8s restarts every Node pod at once! |
| **Readiness Probe (`/readyz`)** | "Can this instance safely process customer traffic right now?" | Pool health, socket capacity, ping DB with strict timeout. | Marking pod ready before dependencies are verified. |

---

## Detailed Explanations and Traces

### Diagnostic Hierarchy: Triaging a Production Incident

When an alert fires (`P99 Latency > 2000ms`), follow this chronological triage hierarchy to isolate the root cause:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           INCIDENT TRIAGE DECISION TREE                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

                Alert: API p99 Latency > 2,000ms
                               │
                               ▼
               Inspect Event-Loop Delay Histogram
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
    Event-Loop Delay HIGH (>100ms)         Event-Loop Delay LOW (<10ms)
    Cause: Single-threaded CPU block      Event loop is healthy!
    • Heavy crypto/JSON.parse             Latency is OUTSIDE the Node event loop!
    • Unoptimized Regex backtrack                         │
    • Synchronous fs/crypto calls                         ▼
                                           Inspect Dependency Latency Traces
                                                          │
                                ┌─────────────────────────┴─────────────────────────┐
                                ▼                                                   ▼
                        DB Latency HIGH (>1000ms)                       External Gateway HIGH
                        • Missing SQL index                             • Stripe / 3rd-party slow
                        • Connection pool exhaustion                    • Downstream network drop
                        • Lock contention / deadlocks                   • Timeout missing on client
```

---

## Common Mistakes and Interview Traps

### 1. High Cardinality Metric Exploits

A major disaster in Prometheus monitoring is using dynamic, unbounded values as metric labels:
```javascript
// Node.js code
// ❌ CATASTROPHIC MEMORY EXPLOSION (High Cardinality):
// Using userId or orderId as a Prometheus label!
httpRequestDuration.labels(req.method, req.path, req.user.id).observe(duration);
```
If you have 1,000,000 users, Prometheus creates 1,000,000 distinct time-series in RAM, crashing your Prometheus server and exhausting Node.js heap memory.
- **Rule:** *Metric labels must be bounded, low-cardinality enums (e.g., HTTP method, status code, route template `/users/:id`). Never use user IDs, timestamps, or raw URLs.*

### 2. Logging PII and Secrets

Logging raw request bodies (`logger.info({ body: req.body })`) frequently leaks passwords, payment card numbers, and auth tokens into centralized log aggregators, violating GDPR, HIPAA, and PCI-DSS compliance. Always configure automated redaction filters in your logger:
```javascript
// Node.js code
import pino from 'pino';

export const safeLogger = pino({
  redact: ['req.headers.authorization', 'body.password', 'body.creditCard', 'body.token']
});
```

---

## Hands-On Exercise: Building an Observable Express Microservice

### Scenario

You are tasked with bringing production-grade observability to an Express API.
Currently:
1. Logs are raw strings emitted via `console.log` with no correlation IDs.
2. The team cannot tell whether latency spikes are caused by database bottlenecks or Node event-loop blocking.
3. The existing health check queries PostgreSQL on the liveness probe, causing cascading restarts during database maintenance.

### Acceptance Criteria

1. Implement `AsyncLocalStorage` correlation ID middleware using `pino`.
2. Instrument Prometheus metrics using `prom-client`:
   - HTTP request duration histogram (RED method: method, route, status code).
   - Event-loop delay gauge.
   - Decoupled `/livez` and `/readyz` probes.
   - Expose a `/metrics` scrape endpoint.
3. Redact sensitive authorization headers from logging.

### Solution Code

```javascript
// Node.js code
import express from 'express';
import crypto from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import { monitorEventLoopDelay } from 'node:perf_hooks';
import pino from 'pino';
import client from 'prom-client';

// ==========================================
// 1. STRUCTURED LOGGING & CORRELATION ID
// ==========================================

export const asyncLocalStorage = new AsyncLocalStorage();

export const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'body.password'],
    remove: true
  }
});

// Context-aware proxy logger
export const appLogger = new Proxy(baseLogger, {
  get(target, prop) {
    if (typeof target[prop] === 'function') {
      return (arg1, ...rest) => {
        const store = asyncLocalStorage.getStore();
        if (store) {
          if (typeof arg1 === 'object' && arg1 !== null) {
            arg1 = { correlationId: store.correlationId, ...arg1 };
          } else {
            return target[prop]({ correlationId: store.correlationId }, arg1, ...rest);
          }
        }
        return target[prop](arg1, ...rest);
      };
    }
    return target[prop];
  }
});

// ==========================================
// 2. PROMETHEUS METRICS SETUP
// ==========================================

const register = new client.Registry();
client.collectDefaultMetrics({ register });

// HTTP Request Duration Histogram (RED Method)
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2.5, 5] // Bounded latency buckets
});
register.registerMetric(httpRequestDurationSeconds);

// Event Loop Delay Gauge
const eventLoopDelayGauge = new client.Gauge({
  name: 'nodejs_event_loop_lag_p99_seconds',
  help: '99th percentile event loop delay in seconds'
});
register.registerMetric(eventLoopDelayGauge);

// Start Event-Loop Monitor
const elHistogram = monitorEventLoopDelay({ resolution: 10 });
elHistogram.enable();
setInterval(() => {
  const p99Seconds = elHistogram.percentile(99) / 1e9;
  eventLoopDelayGauge.set(p99Seconds);
  elHistogram.reset();
}, 5000).unref();

// ==========================================
// 3. EXPRESS APPLICATION & PROBES
// ==========================================

export function createObservableApp(dbPool) {
  const app = express();
  app.use(express.json());

  // Middleware 1: Correlation ID Context
  app.use((req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
    res.setHeader('x-correlation-id', correlationId);

    asyncLocalStorage.run({ correlationId }, () => {
      next();
    });
  });

  // Middleware 2: Metrics & Access Logging
  app.use((req, res, next) => {
    const startTime = process.hrtime.bigint();

    res.on('finish', () => {
      const durationNs = process.hrtime.bigint() - startTime;
      const durationSec = Number(durationNs) / 1e9;

      // Extract low-cardinality route template (e.g. /users/:id instead of /users/123)
      const route = req.route ? req.baseUrl + req.route.path : req.path;

      httpRequestDurationSeconds
        .labels(req.method, route, String(res.statusCode))
        .observe(durationSec);

      appLogger.info({
        method: req.method,
        route,
        status: res.statusCode,
        durationMs: (durationSec * 1000).toFixed(2)
      }, 'Request completed');
    });

    next();
  });

  // Scraping Endpoint for Prometheus
  app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  });

  // Liveness Probe: Shallow process tick (NEVER queries DB!)
  app.get('/livez', (req, res) => {
    res.status(200).json({ status: 'live', uptime: process.uptime() });
  });

  // Readiness Probe: Deep dependency ping with strict deadline
  app.get('/readyz', async (req, res) => {
    try {
      const ping = dbPool.query('SELECT 1');
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB ping timeout')), 1000)
      );

      await Promise.race([ping, timeout]);
      res.status(200).json({ status: 'ready', database: 'connected' });
    } catch (err) {
      appLogger.error({ error: err.message }, 'Readiness check failed');
      res.status(503).json({ status: 'not_ready', error: err.message });
    }
  });

  // Sample domain endpoint
  app.get('/api/users/:id', (req, res) => {
    appLogger.info({ userId: req.params.id }, 'Fetching user details');
    res.json({ id: req.params.id, name: 'Alice' });
  });

  return app;
}
```

### Solution Explanation

1. **Context-Free Correlation Logging:** `asyncLocalStorage.run()` wraps the request lifecycle. Any invocation of `appLogger.info()` anywhere in the service layer automatically attaches `{ correlationId }` to the JSON log output without passing parameters.
2. **Low-Cardinality Metrics:** In the metrics middleware, `req.route.path` captures route templates (`/api/users/:id`) rather than raw request URLs (`/api/users/9412`), strictly preventing Prometheus cardinality explosions.
3. **Runtime Event-Loop Gauge:** `monitorEventLoopDelay` samples libuv delay every 10ms and exports the p99 delay in seconds to Prometheus every 5 seconds.
4. **Decoupled Probes:** `/livez` verifies purely that Node is executing ticks, protecting the pod from restarts during database issues, while `/readyz` guards ingress traffic via a 1000ms database ping.

---

## Summary

- The Three Pillars of Observability are **Structured Logs** (discrete events), **Metrics** (statistical aggregates), and **Distributed Traces** (cross-service request journeys).
- Propagate Request Correlation IDs across asynchronous call chains using Node.js's native **`AsyncLocalStorage`**.
- Monitor APIs using the **RED Method** (Rate, Errors, Duration) and hardware using the **USE Method** (Utilization, Saturation, Errors).
- Never evaluate latency with arithmetic averages; always use distribution percentiles (**p50, p95, p99**).
- Node.js runtime health requires monitoring **Event-Loop Delay** (`monitorEventLoopDelay`), V8 Heap memory, and libuv active handles.
- Decouple Kubernetes health probes: `/livez` must remain a shallow in-memory check to prevent cascading pod restarts, while `/readyz` monitors database readiness with a strict timeout.

---

## Cheat Sheet

| Concern | Pattern / Command | Key Benefit |
|---|---|---|
| **Correlation ID** | `AsyncLocalStorage.run({ correlationId }, fn)` | Injects trace IDs into all logs without argument drilling |
| **RED Method** | `Histogram.labels(method, route, status)` | Standardized microservice rate, error, and latency metrics |
| **Avoid Cardinality**| Use `req.route.path` (not `req.url`) | Prevents Prometheus memory exhaustion from dynamic IDs |
| **Event Loop Lag** | `monitorEventLoopDelay({ resolution: 10 })` | Detects single-threaded CPU blocking and event-loop freezing |
| **PII Redaction** | `pino({ redact: ['body.password'] })` | Prevents credential and credit card leaks to log collectors |
| **Liveness Check** | `res.status(200).send('OK')` | Prevents cascading pod crashes during database blips |
| **Readiness Check** | `Promise.race([db.ping(), timeout(1000)])` | Stops traffic routing to degraded instances |

---

## Interview Questions

### 1. Why are arithmetic averages misleading when analyzing API latency in production, and how do percentiles (p95, p99) reveal the true user experience?

Arithmetic averages (means) are mathematically distorted by skewed, non-normal distributions. Web application latency does not follow a bell curve (Gaussian distribution); it follows a **long-tailed multimodal distribution** where 95% of requests return quickly, while a small percentage experience database lock waits, garbage collection (GC) pauses, or network re-transmissions.

When calculating an average, the vast mass of fast requests dilutes and obscures the slow outliers:
For example, if 9,990 requests take 10ms and 10 requests take 10,000ms (10 seconds), the arithmetic average is:
$$\frac{(9,990 \times 10) + (10 \times 10,000)}{10,000} = \frac{99,900 + 100,000}{10,000} \approx 20\text{ms}$$
An engineering team monitoring averages would see 20ms and conclude the service is performing exceptionally well. In reality, ten customers experienced a complete 10-second failure.

**Percentiles (p50, p95, p99)** unmask this reality:
- **p50 (Median):** 10ms (reflects typical user experience).
- **p99:** 10,000ms (unmasks the severe tail latency affecting the slowest 1% of users).
Setting Service Level Objectives (SLOs) and alert rules on p99 latency ensures that operations teams are notified when tail latency degrades, regardless of average performance.

---

### 2. How does `AsyncLocalStorage` work in Node.js, and why is it superior to passing request objects through application layers for correlation logging?

`AsyncLocalStorage` is a core module in Node.js (`node:async_hooks`) that allows developers to create asynchronous state stores that persist across the entire lifespan of a web request, surviving promise resolutions, `await` pauses, timer callbacks, and event emitter boundaries.

Before `AsyncLocalStorage`, achieving request correlation (attaching a unique `correlationId` to every log line) required one of two flawed patterns:
1. **Argument Drilling:** Every single service, repository, and utility function had to accept `req` or `correlationId` as its first parameter (`userService.getUser(id, correlationId)`). This polluted clean domain boundaries and tightly coupled business logic to HTTP transport metadata.
2. **Monkey-Patching / Domains:** Legacy workarounds (like the deprecated `domain` module or continuation-local-storage) relied on brittle monkey-patching of core Node APIs, introducing performance overhead and memory leaks.

With `AsyncLocalStorage`:
1. Middleware initializes the store at the start of the request: `asyncLocalStorage.run({ correlationId }, () => next())`.
2. The Node.js V8 runtime automatically propagates the store reference through every microtask and async continuation.
3. Any logger or utility function deep in the repository layer can call `asyncLocalStorage.getStore()` to retrieve the current correlation ID without requiring function signature changes.

---

### 3. If an Express service displays high p99 response times while server CPU utilization is below 15%, what is the most likely bottleneck, and how do you diagnose it?

If response latency is high while CPU utilization is near zero (15%), the Node.js process is **not CPU-bound**. The single-threaded event loop is not occupied with expensive computations; rather, the process is **spending its time waiting for asynchronous I/O operations to complete**.

To diagnose the bottleneck:
1. **Inspect Event-Loop Delay (`monitorEventLoopDelay`):**
   - If event-loop lag is low ($< 5\text{ms}$), it confirms the event loop is idle and unblocked. The bottleneck is strictly external.
2. **Inspect Database Connection Pool Metrics:**
   - Check `pool.waitingCount` and `pool.idleCount`. If all connections are checked out and incoming queries are queuing in memory waiting for a free client socket, API response times skyrocket even though the CPU is doing no work.
3. **Inspect Database Query Execution Times via Distributed Traces:**
   - Look at OpenTelemetry spans or PostgreSQL `pg_stat_statements`. Unindexed queries executing slow sequential table scans or transactions blocked by lock contention (`FOR UPDATE` locks) hold queries open for seconds without consuming client CPU.
4. **Inspect Downstream HTTP Services:**
   - Check third-party API call durations (e.g., Stripe, Sendgrid). Missing request timeouts on outbound HTTP calls will cause requests to stall indefinitely waiting for socket data.

---

### 4. What is a Cardinality Explosion in Prometheus metrics, and how can an Express developer accidentally trigger one?

A **Cardinality Explosion** occurs when a Prometheus metric is configured with labels whose values are unbounded, dynamic, or unique per request. 

Prometheus stores time-series data using a multidimensional data model where every unique combination of metric name and key-value label pairs creates an independent, distinct time-series in memory:
$$\text{Total Series} = \text{Metric} \times \prod (\text{Count of unique values per label})$$

An Express developer triggers a cardinality explosion by using raw URLs or user IDs in metric labels:
```javascript
// CATASTROPHIC CARDINALITY EXPLOSION:
httpRequestsTotal.labels(req.method, req.url, req.user.id).inc();
```
If the application receives 500,000 unique user IDs and requests with dynamic query parameters or UUIDs (`/orders/381a9f...`), Prometheus must allocate memory for millions of new time-series.
- **Production Impact:** Node.js memory usage spikes, Prometheus server runs out of RAM and crashes, scrape requests time out, and all monitoring across the cluster fails.
- **Prevention:** Always normalize labels to bounded, static sets: use route templates (`/orders/:id`) instead of raw URLs, map HTTP status codes to classes (`2xx`, `4xx`, `5xx`), and never include user IDs, email addresses, or timestamps in metric labels.

---

<nav aria-label="Lecture navigation">

[Previous: Queues and Background Work](day-36-queues-and-background-work.md) | [Roadmap](../node-roadmap.md) | [Next: Security Review of a Node Backend](day-38-security-review-of-a-node-backend.md)

</nav>