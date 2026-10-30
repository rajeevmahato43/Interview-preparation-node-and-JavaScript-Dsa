# Node.js Domain Instructions

Teach Node.js as a high-performance, single-threaded, event-driven backend platform from first principles.

Follow the shared rules in [content-rules.md](content-rules.md), [example-rules.md](example-rules.md), and [interview-rules.md](interview-rules.md).

---

## Foundational Philosophy

> **"Never teach a Node.js API or mechanism without first teaching how the single thread, libuv event loop, and OS thread pool interact under load."**

Strictly reject superficial API memorization. Explain how incoming network packets turn into events, why synchronous loops block the event loop, how stream backpressure protects server memory, and how worker threads offload CPU-heavy computation.

---

## Required Scope

Cover the Node.js architecture (V8 + libuv), the 6 phases of the event loop (timers, pending callbacks, idle/prepare, poll, check, close), `process.nextTick` vs `setImmediate`, CommonJS vs ESM, Buffers and binary encodings, Streams and backpressure pipelines, EventEmitter lifecycle, child processes and worker threads, clustering, graceful shutdown, diagnostic memory snapshots, and security realities.

---

## Teaching Standards

1. **Basic English Definitions:** Explain every runtime mechanism in simple, clear everyday words. Explain what it is, what it does, and what it does NOT do.
2. **In-Place Term Callouts:** Define every specialized term (like `Backpressure`, `libuv`, `Thread Pool`, `Worker Thread`) right where it appears using a 1-line callout block.
3. **Event Loop State Diagrams:** Use clean ASCII diagrams showing phase transitions and queue drainage.
4. **Dual-Case Implementations:** Always show `✅ CORRECT / POSITIVE CASE` (e.g., non-blocking stream pipeline) alongside `❌ ANTI-PATTERN / COMMON BUG` (e.g., loading 500MB into memory with `fs.readFileSync`) with inline explanations.
5. **Production Systems Reality:** Detail how latency spikes happen when the main thread is blocked, and how Kubernetes health checks fail when synchronous code starves the event loop.
6. **No Artificial Line Count Limits:** Never constrain lectures to arbitrary line counts. Lectures can be as long and comprehensive as necessary to deliver exhaustive, world-class depth, line-by-line runtime derivations, and complete clarity without superficial summaries or forced truncation.
7. **Topic-Appropriate Architecture:** Structure each lecture according to its core discipline (event loop mechanics, stream pipelines, system clustering) rather than a rigid, robotic template.
8. **Short, Clean Headings:** Headings must be short, direct, and clean with zero fluff (e.g., `## 1. What is the Event Loop`, `### 1.1 Poll Phase`). Never use long, descriptive subtitles, colons, or parenthetical explanations in headings.
9. **No Preachy Meta-Interview Talk:** Deliver the computational, libuv, and backend architecture insights directly without preachy meta-interview commentary.