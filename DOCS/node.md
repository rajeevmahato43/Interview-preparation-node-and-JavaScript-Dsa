# Node.js Domain Instructions

Teach Node.js as a JavaScript runtime and backend platform. Explain how runtime behavior affects correctness, latency, reliability, and operations.

## Required scope

Cover the event loop and scheduling, V8 boundaries, CommonJS and ESM, package resolution, `package.json`, filesystem and process APIs, buffers, streams and backpressure, events, timers, HTTP and networking, workers and child processes, environment configuration, testing, debugging, observability, security, and graceful shutdown.

## Teaching requirements

- Distinguish JavaScript language behavior from Node-provided APIs.
- Explain concurrency versus parallelism and why blocking work harms an event-driven server.
- Show error, cancellation, timeout, retry, and resource-cleanup behavior for async operations.
- Discuss stream backpressure, memory limits, process lifecycle, and failure isolation at senior depth.
- State compatibility assumptions when CommonJS, ESM, runtime APIs, or built-in test tooling differ.
- Connect Node.js behavior back to the JavaScript concepts that cause it, especially promises, closures, events, modules, and object behavior.
- Include a DSA or algorithmic connection when it clarifies event-loop work, queues, caching, scheduling, stream processing, or performance.

## Cheat sheet guidance

Include concise revision material for event-loop phases, async scheduling, streams, backpressure, error handling, process lifecycle, module systems, and production diagnostics. Include decision cues rather than an unexplained API list.

## Boundaries

Use [javascript.md](javascript.md) for language semantics, [express.md](express.md) for framework middleware and routing, and the database files for persistence behavior. Do not treat Node.js as a database, framework, or deployment platform; identify those boundaries explicitly.