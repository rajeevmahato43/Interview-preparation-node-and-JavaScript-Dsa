# Day 12: Testing, Diagnostics, Observability, and Shutdown

<nav aria-label="Lecture navigation">

[Previous: Worker Threads and Child Processes](day-11-worker-threads-and-child-processes.md) | [Roadmap](../node-roadmap.md) | [Next: Express Application Structure](day-13-express-application-structure.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Test Node services without binding unnecessary ports or real dependencies.
- Choose unit, integration, and end-to-end boundaries.
- Diagnose event-loop delay, CPU use, memory growth, and open handles.
- Design useful logs, metrics, health, and readiness signals.
- Shut down a service without losing ownership of active work.

## Prerequisites

Read [Day 04: Process, Configuration, and Lifecycle](day-04-process-configuration-and-lifecycle.md), [Day 07: Events, Timers, and Resource Ownership](day-07-events-timers-and-resource-ownership.md), and [Day 09: Node HTTP Fundamentals](day-09-node-http-fundamentals.md).

## Core Concepts

### Test boundaries

A useful test pyramid is:

| Test | Proves | Typical cost |
|---|---|---:|
| Unit | One function or module contract | Low |
| Integration | Real module/resource boundary | Medium |
| HTTP integration | Routes, parsing, status, errors | Medium |
| End-to-end | Deployed workflow | High |

Export an app factory separately from `listen()` so HTTP tests can use the app without opening a production port. Inject clocks, clients, and storage boundaries where deterministic tests need control.

Node's built-in test runner and `node:assert` are available in supported modern Node versions; verify the minimum version before relying on a specific feature.

```js
const test = require("node:test");
const assert = require("node:assert/strict");

test("adds values", () => {
  assert.equal(2 + 3, 5);
});
```

### Diagnostics

| Symptom | First evidence |
|---|---|
| Slow requests, high event-loop delay | CPU profile, synchronous work, microtask starvation |
| Slow requests, low event-loop delay | Dependency and pool timings |
| Memory growth | Heap snapshot, allocation profile, queue/listener counts |
| High CPU | CPU profile and request/job correlation |
| Process will not exit | Open servers, sockets, timers, streams, workers |

A metric is useful when it has a question behind it. Track request duration, status, event-loop delay, active handles, queue depth, dependency latency, retries, and memory with bounded labels.

### Logs, metrics, and traces

Structured logs should include timestamp, level, service, request/job ID, operation, outcome, and duration. Redact tokens, passwords, authorization headers, and personal data. Metrics aggregate behavior; traces connect one request across dependencies. Do not put unbounded URLs, user input, or error text directly into metric label names.

### Health and readiness

- **Liveness:** Is the process able to run its basic loop?
- **Readiness:** Should this instance receive traffic?
- **Dependency health:** Can a required dependency perform the needed operation?

Do not make liveness depend on every downstream system; that can cause restart storms. Readiness can reflect startup, shutdown, and required dependency state.

## Detailed Explanations and Traces

### Graceful shutdown

```text
running
  -> mark not-ready
  -> stop accepting new connections/jobs
  -> finish or cancel active work before deadline
  -> close HTTP, database, queue, worker, and telemetry resources
  -> exit with a status
```

Shutdown must be idempotent. A second signal should shorten or escalate the deadline, not start a competing cleanup sequence. The process must have a forced-stop policy for resources that do not close.

```js
let shutdownPromise;

function shutdown(signal) {
  if (!shutdownPromise) {
    shutdownPromise = closeAllResources(signal).catch((error) => {
      console.error("shutdown failed", error);
      process.exitCode = 1;
    });
  }
  return shutdownPromise;
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
```

`closeAllResources` must stop new work first and apply its own bounded deadlines. Do not assume setting `process.exitCode` closes sockets.

### Testing async failures

Test both success and failure paths:

- dependency rejects;
- request aborts;
- timeout fires;
- response has already started;
- cleanup rejects;
- process receives a second shutdown signal;
- retry reaches its limit;
- worker or stream exits unexpectedly.

Fake timers can help with deterministic timer tests, but test at least one real integration path because scheduling, streams, and sockets have runtime behavior mocks can hide.

### Event-loop measurement

`perf_hooks.monitorEventLoopDelay()` measures delay distribution, not request latency. Combine it with CPU, garbage-collection, request, and dependency metrics. A high percentile is usually more useful than an average for detecting blocked periods.

## Node.js, JavaScript, and DSA Connections

- **JavaScript:** Tests observe promises, exceptions, closures, and cleanup contracts.
- **Node:** Diagnostics cover runtime resources, event-loop delay, streams, sockets, and signals.
- **DSA:** Metrics such as queue depth and age reveal queueing behavior; bounded queues protect memory.

## Common Mistakes and Interview Traps

- Starting a real server or database during module import.
- Mocking every dependency and never testing a real boundary.
- Logging secrets or high-cardinality user input.
- Using a liveness check to restart every dependency outage.
- Closing the HTTP server but forgetting database pools, workers, timers, or queues.
- Calling `process.exit()` before logs and cleanup complete.
- Treating a passing health endpoint as proof of business correctness.
- Measuring only average latency.

## Tricky Points

- A server can stop accepting new connections while existing keep-alive requests remain active.
- A shutdown promise does not stop new work unless the application checks a stopping state.
- A test can pass while a timer or listener leaks; use cleanup assertions and isolated processes where useful.
- Error logs can become a denial-of-service vector if an attacker controls repeated input or message size.

## Practical Exercise

**Goal:** Add tests, diagnostics, and bounded shutdown to a small HTTP service.

**Inputs and outputs:** Test success, validation failure, dependency timeout, and shutdown while a request is active.

**Constraints:** Separate app creation from listening, use structured logs, avoid secrets, and close every resource.

**Acceptance criteria:** Tests run repeatedly without open-handle leaks, readiness changes during shutdown, active work has a deadline, and failures produce actionable evidence.

## Summary

- Test at the boundary that matters; do not rely only on mocks.
- Measure event-loop delay, latency, dependencies, queues, CPU, and memory together.
- Logs, metrics, and traces answer different operational questions.
- Liveness and readiness have different purposes.
- Graceful shutdown stops new work, bounds active work, closes owned resources, and escalates when necessary.

## Cheat Sheet

| Concern | Decision cue |
|---|---|
| App tests | Export factory; keep `listen()` separate |
| Slow service | Check event-loop delay and dependency timing |
| Memory growth | Heap/allocation profile and queue/listener counts |
| Health | Liveness for process; readiness for traffic eligibility |
| Shutdown | Stop new work, drain/cancel, close, deadline |
| Logs | Structured, correlated, redacted |
| Metrics | Bounded labels and useful percentiles |

## Interview Questions

1. **Definition:** Compare unit, integration, and end-to-end tests for a Node service.
   - **Expected answer:** Explain boundary, confidence, cost, and what should remain real.
   - **Follow-up:** Why separate app creation from `listen()`?

2. **Debugging [Hard]:** Requests are slow but CPU is low.
   - **Expected answer:** Compare event-loop delay with dependency, pool, queue, and network timings before changing code.
   - **Follow-up:** What would high event-loop delay change?

3. **Implementation:** Write an idempotent shutdown handler.
   - **Expected answer:** Guard one cleanup promise, mark not-ready, stop new work, close resources with deadlines, and set status.
   - **Follow-up:** What if one cleanup step rejects?

4. **Operations [Hard]:** Design liveness and readiness checks for a service with a database.
   - **Expected answer:** Keep liveness shallow; make readiness reflect startup, shutdown, and required dependency state.
   - **Follow-up:** How do you avoid restart storms?

5. **Design [Very Hard]:** A service leaks handles only under test load.
   - **Expected answer:** Inspect timers, listeners, sockets, streams, workers, and pools; use cleanup hooks, open-handle diagnostics, repeated tests, and process isolation.
   - **Follow-up:** Which evidence distinguishes a test leak from an application leak?

<nav aria-label="Lecture navigation">

[Previous: Worker Threads and Child Processes](day-11-worker-threads-and-child-processes.md) | [Roadmap](../node-roadmap.md) | [Next: Express Application Structure](day-13-express-application-structure.md)

</nav>