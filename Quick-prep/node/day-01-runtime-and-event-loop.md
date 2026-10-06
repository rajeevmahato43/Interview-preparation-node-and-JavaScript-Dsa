# Day 1: Runtime, Modules, and Core APIs

## Runtime and scheduling

**1. Runtime layers**

V8 executes JavaScript; Node supplies APIs; libuv and the OS coordinate I/O and event-loop work.

```js
import { readFile } from "node:fs/promises"; // Node host API, not ECMAScript
```

**2. Concurrency and parallelism**

Async I/O overlaps waiting; worker threads/processes can run CPU work separately. Synchronous CPU work blocks the current JavaScript event loop.

**3. Event loop and scheduling**

Node advances through event-loop phases and runs promise/`nextTick` work; exact ordering depends on context and Node version.

```js
console.log("sync");
Promise.resolve().then(() => console.log("promise job"));
```

[Runtime](../../Node/node-lectures/day-01-node-runtime-and-architecture.md) | [Scheduling](../../Node/node-lectures/day-02-event-loop-and-scheduling.md)

## Modules and process

**1. CommonJS and ESM**

CommonJS uses `require`/`module.exports`; ESM uses `import`/`export`. `package.json`, extensions, and exports affect resolution and interoperability.

**2. Process configuration**

Read CLI arguments and environment variables at startup; validate required values before opening the server.

```js
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port)) throw new Error("Invalid PORT");
```

**3. Process lifecycle**

On `SIGTERM`, stop intake, drain bounded work, close resources, then exit. Handle uncaught failures and exit codes deliberately.

[Modules](../../Node/node-lectures/day-03-modules-packages-and-resolution.md) | [Process lifecycle](../../Node/node-lectures/day-04-process-configuration-and-lifecycle.md)

## Files and bytes

**1. Filesystem and paths**

Use async filesystem APIs in request paths; resolve user paths and verify they remain under an allowed root.

**2. Buffers and encodings**

Buffers hold bytes; decoding depends on encoding and chunk boundaries. Use initialized buffers for untrusted data.

```js
const safe = Buffer.alloc(16); // initialized bytes
```

**3. Serialization**

JSON represents fewer types than JavaScript; define how binary, `BigInt`, and unsupported values cross boundaries.

[Files](../../Node/node-lectures/day-05-files-paths-urls-and-safe-io.md) | [Buffers](../../Node/node-lectures/day-06-buffers-encodings-and-serialization.md)

## Tricky points

1. **Runtime**

**1.1 “Single-threaded”**

JavaScript callbacks commonly run on one main thread per isolate, but Node/OS also use threads and worker resources.

**1.2 CPU work**

Wrapping a synchronous loop in a Promise does not unblock the event loop.

**1.3 Scheduling**

A timer is eligible after a threshold, not guaranteed to run at an exact time.

2. **Modules and process**

**2.1 Interop**

Do not assume every CommonJS/ESM import shape works identically; check Node version and package metadata.

**2.2 Shutdown**

`process.exit()` can truncate pending I/O; close resources within a bounded grace period.

3. **Files and data**

**3.1 Paths**

String concatenation is not path validation; resolve and verify containment within the allowed root.

**3.2 Buffers**

A Buffer view may share memory; consider lifetime and mutation before retaining it.