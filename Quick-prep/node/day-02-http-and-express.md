# Day 2: Events, Streams, HTTP, Networking, and Workers

Quick review of main-course lectures 7–12. Designed for rapid interview revision: EventEmitter mechanics, stream backpressure, low-level HTTP servers, networking timeouts, Worker Threads vs Child Processes, and production diagnostics.

## Events, timers, and resource lifecycle

**1. EventEmitter synchronous dispatch and error handling**

`EventEmitter.emit()` invokes all registered listeners synchronously on the main thread in registration order. Emitting an `"error"` event without an active listener crashes the Node process with an unhandled exception.

```js
import { EventEmitter } from "node:events";

const emitter = new EventEmitter();

// Unhandled error event crashes the entire process!
emitter.on("error", (err) => {
  console.error("Caught operational event error:", err.message);
});

emitter.emit("error", new Error("Database connection dropped"));
```

**1.1 Listener cleanup and memory leak prevention**

Node warns (`MaxListenersExceededWarning`) when more than 10 listeners are attached to a single event. Use `emitter.once()` or pass an `AbortSignal` for automatic cleanup.

```js
const ac = new AbortController();
emitter.on("data", (chunk) => console.log(chunk), { signal: ac.signal });

// Later: cleans up listener automatically without manual removeListener
ac.abort();
```

**1.2 Active handles and timer lifetime**

Timers and open sockets keep the Node process running by maintaining active libuv handles. Calling `.unref()` instructs Node to exit even if the timer or handle is still active.

```js
const heartbeat = setInterval(() => {
  console.log("Health ping");
}, 5000);

// Allows the process to terminate naturally if no other work remains
heartbeat.unref();
```

[Events and timers](../../Node/node-lectures/day-07-events-timers-and-resource-ownership.md)

## Streams and backpressure

**1. Stream primitives and lifecycle**

Node provides four stream types: `Readable` (source), `Writable` (sink), `Duplex` (both independent), and `Transform` (duplex where output is computed from input).

```js
import { Transform } from "node:transform";

const upperCaseTransform = new Transform({
  transform(chunk, encoding, callback) {
    callback(null, chunk.toString().toUpperCase());
  }
});
```

**1.1 Backpressure and the drain contract**

Backpressure occurs when a fast readable stream overwhelms a slow writable stream. When `writable.write(chunk)` returns `false`, the internal buffer exceeds `highWaterMark` (default 16KB for byte streams, 16 objects for objectMode). The producer must pause and wait for the `"drain"` event.

```js
import { once } from "node:events";

async function writeWithBackpressure(readable, writable) {
  for await (const chunk of readable) {
    const canAcceptMore = writable.write(chunk);
    if (!canAcceptMore) {
      // Pause reading until writable finishes flushing to disk/network
      await once(writable, "drain");
    }
  }
  writable.end();
}
```

**1.2 Safe composition: `pipeline` vs `pipe`**

Never use `readable.pipe(writable)` in production request paths; `pipe()` does not forward errors or destroy streams if an intermediate stream fails, leaking file descriptors. Always use `stream.pipeline` or `stream/promises`.

```js
import { pipeline } from "node:stream/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { createGzip } from "node:zlib";

// Safe: Automatically destroys all streams and closes file descriptors on error
await pipeline(
  createReadStream("access.log"),
  createGzip(),
  createWriteStream("access.log.gz")
);
```

[Streams and backpressure](../../Node/node-lectures/day-08-streams-and-backpressure.md)

## HTTP servers, networking, and timeouts

**1. Core `node:http` request-response flow**

`http.IncomingMessage` is a `Readable` stream representing the client request body; `http.ServerResponse` is a `Writable` stream. Status codes and headers must be sent before writing the response body.

```js
import http from "node:http";

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/data") {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const body = Buffer.concat(chunks).toString();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ receivedBytes: body.length }));
    });
    return;
  }
  res.writeHead(404).end();
});
```

**1.1 Socket timeouts and Keep-Alive pooling**

By default, an inactive client socket can hang indefinitely if not bounded by timeouts. Set `server.headersTimeout`, `server.requestTimeout`, and `server.keepAliveTimeout` to mitigate Slowloris Denial-of-Service attacks.

```js
server.headersTimeout = 5000;    // Time allowed for client to transmit headers
server.requestTimeout = 30000;   // Max time allowed for entire HTTP request
server.keepAliveTimeout = 5000;  // Idle socket keep-alive window
```

**1.2 DNS resolution: `dns.lookup` vs `dns.resolve`**

`dns.lookup()` uses the operating system's `getaddrinfo` system call, executing synchronously inside the 4-thread libuv thread pool. `dns.resolve()` uses c-ares, executing completely asynchronously over the network without blocking worker threads.

```js
import dns from "node:dns";

// Thread pool bound (UV_THREADPOOL_SIZE): respects /etc/hosts and OS nsswitch
dns.lookup("api.internal", (err, address) => { /* ... */ });

// Truly asynchronous network call: bypasses OS thread pool entirely
dns.resolve4("api.internal", (err, addresses) => { /* ... */ });
```

[HTTP fundamentals](../../Node/node-lectures/day-09-node-http-fundamentals.md) | [Networking and timeouts](../../Node/node-lectures/day-10-networking-dns-tls-and-timeouts.md)

## Multitasking: Workers and child processes

**1. Worker Threads vs Child Processes**

Use `worker_threads` to run CPU-bound JavaScript within the same OS process (shared memory via `SharedArrayBuffer`, separate V8 isolates). Use `child_process` to execute external OS binaries or achieve complete operating system memory isolation.

```text
Worker Threads: Same OS process, separate V8 isolate, fast messaging, shared memory support
Child Processes: Separate OS process, higher memory overhead (30MB+ per process), OS sandboxing
```

```js
// Worker thread execution: CPU-heavy hashing without blocking main event loop
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";

if (isMainThread) {
  const worker = new Worker(new URL(import.meta.url), { workerData: { n: 40 } });
  worker.on("message", (result) => console.log("Calculated:", result));
} else {
  function fib(n) { return n <= 1 ? n : fib(n - 1) + fib(n - 2); }
  parentPort.postMessage(fib(workerData.n));
}
```

**2. AsyncLocalStorage and request context propagation**

`AsyncLocalStorage` preserves request-scoped state (e.g., Trace ID, User Context) across asynchronous continuations without threading variables through every function signature.

```js
import { AsyncLocalStorage } from "node:async_hooks";

const asyncLocalStorage = new AsyncLocalStorage();

function logWithTraceId(message) {
  const traceId = asyncLocalStorage.getStore()?.traceId ?? "unknown";
  console.log(`[Trace: ${traceId}] ${message}`);
}

asyncLocalStorage.run({ traceId: "req-abc-123" }, async () => {
  logWithTraceId("Starting database query..."); // [Trace: req-abc-123] Starting database query...
  await Promise.resolve();
  logWithTraceId("Query finished.");            // [Trace: req-abc-123] Query finished.
});
```

[Worker threads and processes](../../Node/node-lectures/day-11-worker-threads-and-child-processes.md) | [Diagnostics and observability](../../Node/node-lectures/day-12-testing-diagnostics-observability-and-shutdown.md)

## Tricky points

1. **Events and streams**

**1.1 Unhandled `error` events crash the process**
Emitting an `error` on any `EventEmitter` or stream without a listener throws an uncaught exception, terminating the Node process even inside a `try/catch` block if emitted asynchronously.

**1.2 Memory exhaustion from ignored backpressure**
If a fast file read pipes into a slow network response using `readable.on("data", chunk => res.write(chunk))` without pausing, memory grows until Node crashes with Out-Of-Memory (OOM).

**1.3 File descriptor leaks with `.pipe()`**
If a downstream stream errors while using `source.pipe(dest)`, the source stream remains open, leaking file descriptors. Always prefer `stream.pipeline()`.

2. **Networking and parallelism**

**2.1 DNS lookup thread pool starvation**
Concurrent HTTP requests to external hostnames using default `node:http` call `dns.lookup()`, saturating the 4-thread libuv pool and stalling subsequent file system I/O.

**2.2 Worker Thread startup overhead**
Spinning up a new `Worker` per incoming HTTP request costs 20–40ms of V8 isolate boot time. Always use a warm, pre-allocated worker pool (e.g., `piscina`).

**2.3 SharedArrayBuffer race conditions**
Modifying `SharedArrayBuffer` memory across threads without `Atomics` operations (`Atomics.add`, `Atomics.compareExchange`) introduces nondeterministic memory corruption.

3. **HTTP and diagnostics**

**3.1 Cannot set headers after they are sent**
Writing response body data implicitly commits HTTP headers. Subsequent calls to `res.setHeader()` or `res.writeHead()` fail with `ERR_HTTP_HEADERS_SENT`.

**3.2 Context loss in `AsyncLocalStorage`**
Bridging old callback-based libraries that invoke callbacks outside asynchronous contexts can disconnect the `AsyncLocalStorage` store unless wrapped with `asyncLocalStorage.run()`.