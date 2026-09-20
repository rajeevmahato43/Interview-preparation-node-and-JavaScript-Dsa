# Day 01: Node.js Runtime and Architecture

<nav aria-label="Lecture navigation">

Previous | [Roadmap](../node-roadmap.md) | [Next: Event Loop and Scheduling](day-02-event-loop-and-scheduling.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain what Node.js is and how it runs JavaScript outside a browser.
- Describe the jobs of V8, Node.js APIs, and libuv.
- Explain why Node.js can handle many waiting I/O operations without creating one JavaScript thread per request.
- Distinguish concurrency from parallelism.
- Identify work that blocks the event loop and explain its effect on other requests.
- Choose a basic strategy for moving CPU-heavy work away from the main request path.

## Prerequisites

Read the JavaScript lectures on functions, errors, promises, and scheduling, especially [Day 18: Promises and Promise Composition](../../Javascript/javascript-lectures/day-18-promises-and-composition.md), [Day 19: Async/Await, Errors, and Cleanup](../../Javascript/javascript-lectures/day-19-async-await-errors-and-cleanup.md), and [Day 20: Jobs, Microtasks, and Scheduling](../../Javascript/javascript-lectures/day-20-jobs-microtasks-and-scheduling.md).

This lecture explains the Node.js host environment. Promise behavior belongs to JavaScript; file, network, process, and timer APIs are provided by Node.js and its runtime implementation.

## Core Concepts

### 1. What Node.js is

Node.js is a runtime that lets JavaScript programs run outside a browser. A Node program can read files, open network connections, create servers, start child processes, and communicate with the operating system.

Node.js is not a programming language and not a web framework. JavaScript is the language. Node.js is the runtime and its built-in APIs. Express is a separate framework that can be built on top of Node's HTTP APIs.

A useful picture is:

```text
Your JavaScript application
          |
          v
Node.js APIs: fs, http, timers, process, streams
          |
          v
Runtime systems: V8 + libuv + operating system
```

### 2. V8 runs JavaScript

V8 is the JavaScript engine used by Node.js. It parses JavaScript, creates objects, runs functions, manages the JavaScript heap, and performs garbage collection.

V8 does not know how to open a TCP socket by itself. Node.js exposes APIs such as `http.createServer()` and `fs.readFile()`. Those APIs connect JavaScript code to operating-system capabilities.

### 3. Node.js APIs connect code to the operating system

Node provides modules and global objects for common backend work:

- `fs` reads and writes files.
- `http` creates HTTP servers and clients.
- `process` exposes arguments, environment variables, signals, and standard streams.
- `Buffer` represents bytes.
- `stream` processes data in chunks.
- `worker_threads` and `child_process` provide ways to run work outside the main JavaScript execution path.

These are Node.js features, not core JavaScript language features.

### 4. The main JavaScript thread

A Node.js process normally runs application JavaScript on one main JavaScript thread. Only one JavaScript function is actively executing on that thread at a time.

This does not mean that Node.js can perform only one operation at a time. While JavaScript is waiting for a file, socket, or timer, the runtime can manage other work. When an operation is ready, Node schedules a callback or promise continuation to run on the JavaScript thread.

This is why a server can make progress on many I/O operations without creating a JavaScript thread for every request.

### 5. libuv and asynchronous work

libuv is a library used by Node.js for its event loop and many operating-system operations. It helps Node manage sockets, timers, filesystem work, and a pool of worker threads used by some APIs.

The exact internal implementation can vary by API and platform. The important application-level rule is simpler:

> Starting an asynchronous Node operation does not mean the JavaScript thread is blocked until the operation finishes.

When the operation completes, its callback or promise continuation is placed into a queue. JavaScript runs that continuation later.

### 6. Concurrency and parallelism

**Concurrency** means that multiple tasks are in progress during the same period. They may take turns making progress.

**Parallelism** means that multiple tasks are executing at the same moment on different execution resources, such as CPU cores or worker threads.

A Node server can be concurrent while its application JavaScript runs on one main thread:

```text
Request A starts file read and waits
Request B starts file read and waits
Request C runs a short JavaScript callback
Request A's file result becomes ready
Request A's callback runs
```

The requests overlap in time, but their JavaScript callbacks do not run simultaneously on the same thread.

### 7. Waiting is different from blocking

Waiting for asynchronous I/O is usually acceptable because the JavaScript thread can run other callbacks. Blocking work keeps the JavaScript thread busy and prevents other callbacks from starting.

Examples of potentially blocking work include:

- A very large synchronous loop.
- A CPU-heavy parser or calculation.
- Synchronous filesystem calls inside a request handler.
- An accidental infinite loop.
- A large amount of promise or `process.nextTick` work that never gives other queues a chance.

A short blocking operation may be harmless in a startup script. The same operation inside a busy HTTP server can create high latency for every request sharing that process.

## Detailed Explanations and Traces

### A small Node HTTP server

The following is a **Node.js example**. It uses the built-in `http` module, not Express.

```js
const http = require("node:http");

const server = http.createServer((request, response) => {
  response.writeHead(200, { "content-type": "text/plain" });
  response.end("Hello from Node.js\n");
});

server.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});
```

Expected observable behavior:

```text
Listening on http://localhost:3000
```

A request arrives, the callback receives request and response objects, and `response.end()` completes the response. The process remains alive because the listening server is an active resource.

### Asynchronous I/O lets another callback run

This is a **Node.js example** using the filesystem API:

```js
const fs = require("node:fs");

console.log("A: before read");

fs.readFile(__filename, "utf8", (error, text) => {
  if (error) {
    console.error(error.message);
    return;
  }

  console.log(`C: read ${text.length} characters`);
});

console.log("B: after starting read");
```

The stable ordering is:

```text
A: before read
B: after starting read
C: read <some number> characters
```

The exact character count depends on the file contents. `readFile` starts an asynchronous operation and returns before its callback runs.

### Blocking work delays unrelated requests

This is a **Node.js example**. The loop is intentionally slow and should not be used in a real request handler:

```js
const http = require("node:http");

function blockFor(milliseconds) {
  const endTime = Date.now() + milliseconds;
  while (Date.now() < endTime) {
    // Intentionally occupy the JavaScript thread.
  }
}

const server = http.createServer((request, response) => {
  if (request.url === "/slow") {
    blockFor(200);
  }

  response.end("done\n");
});

server.listen(3000);
```

If `/slow` is being processed, a request for another route in the same process may wait behind it. The second request is not necessarily slow because its own work is difficult; it is slow because the JavaScript thread is occupied.

### A request path mental model

For each request, ask these questions:

1. **Boundary:** How did the input enter the program?
2. **Work:** Is the work I/O-bound or CPU-bound?
3. **Scheduling:** Does the code return to the event loop while waiting?
4. **Ownership:** Which function owns the socket, file, timer, or database client?
5. **Failure:** What happens if the operation rejects, times out, or is aborted?
6. **Cleanup:** Who closes or releases the resource?
7. **Evidence:** Which log, metric, trace, or test proves the behavior?

This model will be reused for files, streams, HTTP, databases, queues, and graceful shutdown.

### CPU-heavy work and worker threads

For CPU-heavy JavaScript, Node provides `worker_threads`. A worker has its own JavaScript execution environment. Moving work to a worker can protect the main event loop, but it has costs: startup time, message passing, memory, and more complicated failure handling.

Use a worker when the work is CPU-bound and large enough to justify the overhead. Do not create a worker for every tiny function call without measuring the workload. Worker details are covered in Day 11.

## Node.js, JavaScript, and DSA Connections

- **JavaScript connection:** Promises and callbacks describe how a result is delivered later. Node supplies the I/O operation that eventually produces that result.
- **DSA connection:** Event queues behave like queues: work is added, and callbacks are removed according to scheduling rules. Queue length and service time affect latency.
- **Performance connection:** If one callback takes time $T$ on the main thread, other callbacks sharing that thread cannot begin during that interval. The impact becomes larger as request volume increases.

## Common Mistakes and Interview Traps

- Saying that Node.js is completely single-threaded. Application JavaScript normally runs on one main thread, but Node and the operating system may use other threads for specific work.
- Saying that asynchronous means parallel. Asynchronous work may overlap in time without running JavaScript in parallel.
- Calling Node.js a framework. Node.js is a runtime; Express is a framework.
- Assuming every asynchronous API uses the same internal mechanism. The implementation depends on the API and platform.
- Using synchronous filesystem or CPU-heavy work inside a request handler.
- Starting work without deciding who owns cancellation, timeout handling, and cleanup.
- Claiming that adding more promises makes CPU work faster. Promises do not create additional CPU execution resources.

## Tricky Points

- `fs.readFile()` avoids blocking the JavaScript thread while the read is in progress, but processing a huge returned string can still consume significant memory and CPU.
- A callback can be asynchronous even when an operation finishes quickly. Do not write code that depends on a fast operation completing before the next statement.
- A server can have low CPU usage but high latency because it is waiting on a slow database or network dependency.
- A server can have healthy network connections but high latency because one callback blocks the event loop.
- More concurrency is not always better. It can overload a database, increase memory use, or create retry storms.

## Practical Exercise

**Goal:** Observe the effect of blocking the main JavaScript thread.

**Inputs and outputs:** Create a Node HTTP server with `/fast` and `/slow` routes. `/fast` should respond immediately. `/slow` should perform an intentionally controlled CPU loop, such as 200 milliseconds. Record the response times while sending requests to both routes.

**Constraints:** Use only built-in Node.js modules. Keep the blocking delay short and clearly label it as a demonstration. Do not use synchronous filesystem work to simulate the delay.

**Edge cases:** Send two `/fast` requests, a `/slow` request followed by `/fast`, and several concurrent requests. Stop the server with a signal and make sure it exits cleanly.

**Acceptance criteria:**

- You can explain why `/fast` may become slow while `/slow` is running.
- You record the order in which requests start and finish.
- You explain whether the observed work is concurrent, parallel, or both.
- You can identify one design that keeps CPU-heavy work away from the main request path.
- You do not claim a fixed benchmark number; results depend on the machine and Node.js version.

## Summary

- Node.js runs JavaScript outside the browser and provides APIs for operating-system and network work.
- V8 runs JavaScript; Node.js APIs expose files, sockets, processes, buffers, and streams.
- The main JavaScript thread runs one callback at a time, while asynchronous I/O can remain in progress.
- Concurrency means tasks overlap in time. Parallelism means tasks execute at the same time on separate resources.
- Blocking JavaScript delays unrelated callbacks and increases request latency.
- CPU-heavy work may need worker threads or another process, but the overhead and failure behavior must be considered.
- Every asynchronous operation needs a clear owner, failure policy, cleanup path, and observable evidence.

## Cheat Sheet

| Question | Useful answer |
|---|---|
| What is Node.js? | A JavaScript runtime with APIs for backend and operating-system work. |
| What does V8 do? | Parses and executes JavaScript and manages the JavaScript heap. |
| What does libuv help with? | Event-loop operations and many asynchronous operating-system tasks. |
| Is Node single-threaded? | Application JavaScript normally uses one main thread; the runtime may use other threads. |
| Concurrency or parallelism? | Concurrency is overlapping progress; parallelism is simultaneous execution. |
| What hurts the event loop? | Long CPU callbacks, synchronous I/O, infinite loops, and queue starvation. |
| How can CPU work be isolated? | Worker threads or child processes, chosen according to isolation and workload needs. |
| What must async code define? | Ownership, errors, cancellation, timeouts, cleanup, and observability. |

## Interview Questions

1. **Definition:** What is Node.js, and how is it different from JavaScript and Express?
   - **Expected answer:** Explain JavaScript as the language, V8 as the engine, Node.js as the runtime with system APIs, and Express as a separate HTTP framework.
   - **Follow-up:** Which parts of a Node HTTP server are provided by Node rather than by JavaScript itself?

2. **Trace:** Predict the ordering of the logs in the filesystem example.
   - **Expected answer:** `A` appears first, `B` appears next, and the file callback appears later after the read completes. The character count is environment-dependent.
   - **Follow-up:** What would make the callback fail, and where should the error be handled?

3. **Implementation:** Build a small Node server with one fast route and one intentionally CPU-heavy route.
   - **Expected answer:** Use `node:http`, keep the demonstration bounded, record request timing, and explain that both routes share the main JavaScript thread.
   - **Follow-up:** How would you move the expensive calculation to a worker thread?

4. **Debugging [Hard]:** A service has low CPU usage but slow responses. What would you measure before changing the architecture?
   - **Expected answer:** Check dependency latency, event-loop delay, request timing, connection-pool waits, error rates, and workload assumptions. Low CPU alone does not prove the event loop is healthy.
   - **Follow-up:** How would you distinguish slow database I/O from event-loop blocking?

5. **Design [Hard]:** Design a Node service that accepts image-processing jobs without blocking normal API requests.
   - **Expected answer:** Define an intake endpoint, durable job state, bounded workers, status reporting, timeouts, retries, idempotency, resource limits, observability, and graceful shutdown.
   - **Follow-up:** When would you choose worker threads, child processes, or a separate worker service?

6. **Senior follow-up [Very Hard]:** A team wants to increase concurrency by launching thousands of promises for an external API. What risks do you identify?
   - **Expected answer:** Discuss memory growth, remote rate limits, connection limits, queueing latency, retry amplification, cancellation, deadlines, partial failure, and bounded concurrency.
   - **Follow-up:** What measurements would determine a safe concurrency limit?

<nav aria-label="Lecture navigation">

Previous | [Roadmap](../node-roadmap.md) | [Next: Event Loop and Scheduling](day-02-event-loop-and-scheduling.md)

</nav>