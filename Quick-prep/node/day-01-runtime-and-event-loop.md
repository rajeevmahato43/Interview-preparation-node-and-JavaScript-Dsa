# Day 1: Runtime, Modules, Process, Files, and Buffers

Quick review of main-course lectures 1–6. Designed for rapid interview revision: core architecture, event loop scheduling, module systems, process lifecycle, safe I/O, and buffer mechanics with interview-focused examples.

## Runtime architecture and event loop

**1. Runtime components and boundaries**

V8 compiles and executes JavaScript on a single main thread; Node provides host APIs (`process`, `Buffer`, `node:fs`); libuv coordinates asynchronous I/O and manages the thread pool.

```js
// ECMAScript specification value vs Node.js host API
const set = new Set([1, 2]);                       // ECMAScript language feature
const platform = process.platform;                 // Node host global
import { readFile } from "node:fs/promises";       // Node host I/O module
```

**1.1 libuv thread pool**

libuv delegates blocking operations that cannot be handled via OS non-blocking notifications to a background thread pool (default 4 threads, configurable up to 1024 via `UV_THREADPOOL_SIZE`).

```text
Non-blocking OS Kernel (epoll/kqueue/IOCP): TCP/UDP sockets, HTTP, pipes
libuv Thread Pool (default 4 threads): fs.* file calls, dns.lookup, crypto (pbkdf2/scrypt), zlib compression
```

```js
// Thread pool exhaustion: pbkdf2 operations share the 4 threads
import crypto from "node:crypto";
for (let i = 0; i < 4; i++) {
  crypto.pbkdf2("secret", "salt", 100000, 64, "sha512", () => {
    console.log(`Hash ${i + 1} finished`);
  });
}
```

**1.2 Event loop phases and execution order**

The event loop runs in six discrete phases. Before moving to the next phase, Node drains the entire microtask queue (`process.nextTick` runs first, followed by Promise jobs).

```text
   +-----------------------------------+
   |             Timers                | -> setTimeout, setInterval
   +-----------------------------------+
                     |
   +-----------------------------------+
   |        Pending Callbacks          | -> Deferred OS I/O callbacks
   +-----------------------------------+
                     |
   +-----------------------------------+
   |          Idle, Prepare            | -> Internal libuv use only
   +-----------------------------------+
                     |
   +-----------------------------------+
   |              Poll                 | -> Retrieve new I/O events; execute I/O callbacks
   +-----------------------------------+
                     |
   +-----------------------------------+
   |              Check                | -> setImmediate callbacks
   +-----------------------------------+
                     |
   +-----------------------------------+
   |         Close Callbacks           | -> socket.on('close'), handle cleanup
   +-----------------------------------+
   * Microtasks (nextTick -> Promise) drain after every individual callback or phase step!
```

**1.3 Microtasks: `process.nextTick` vs `Promise.then`**

Microtasks run immediately after the currently running JavaScript stack unwinds and before the event loop advances. `process.nextTick` takes priority over Promise jobs.

```js
console.log("1. sync");

setTimeout(() => console.log("4. timer"), 0);
setImmediate(() => console.log("5. immediate"));

Promise.resolve().then(() => console.log("3. promise microtask"));
process.nextTick(() => console.log("2. nextTick microtask"));

// Output order: 1. sync -> 2. nextTick -> 3. promise -> 4. timer -> 5. immediate
```

[Runtime and architecture](../../Node/node-lectures/day-01-node-runtime-and-architecture.md) | [Event loop and scheduling](../../Node/node-lectures/day-02-event-loop-and-scheduling.md)

## Modules and process configuration

**1. CommonJS (CJS) vs ECMAScript Modules (ESM)**

CommonJS evaluates files synchronously on first `require()`, caching the evaluated `module.exports` object. ESM builds a static dependency graph, resolving and linking live bindings before evaluating module code.

```js
// CJS: value copy / snapshot at evaluation time
// counter.cjs
let count = 0;
module.exports = { count, inc: () => count++ };

// ESM: live read-only binding to the exporter's memory slot
// counter.mjs
export let count = 0;
export const inc = () => count++;
```

**1.1 `require.cache` and module isolation**

CommonJS caches module exports by resolved absolute path. Mutating exports in one file leaks state across the entire process unless deleted from `require.cache`.

```js
// Mutating a cached export leaks across files
const db = require("./database.cjs");
db.connected = true; // Every other require('./database.cjs') sees connected: true
```

**1.2 Interoperability and dynamic import**

ESM can import CommonJS modules via default or named exports. CommonJS cannot synchronously `require()` an ESM file; it must use asynchronous `import()`.

```js
// CommonJS consuming an ESM file
async function loadESMModule() {
  const { calculate } = await import("./math.mjs");
  return calculate(10, 20);
}
```

**1.3 `package.json` package boundaries**

`"type": "module"` sets `.js` files to ESM. The `"exports"` field encapsulates package internals and prevents unauthorized file access, while `"imports"` defines internal private aliases.

```json
{
  "name": "my-service",
  "type": "module",
  "exports": {
    ".": "./src/index.js",
    "./utils": "./src/utils.js"
  },
  "imports": {
    "#config": "./src/config/env.js"
  }
}
```

**2. Process environment and graceful shutdown**

Configuration must be validated at process startup. Production services must trap `SIGTERM` and `SIGINT` to drain in-flight HTTP requests and close database connections before exiting.

```js
import http from "node:http";

// 1. Startup validation
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port <= 0) throw new Error("Invalid PORT");

const server = http.createServer((req, res) => res.end("OK")).listen(port);

// 2. Graceful shutdown handler
function shutdown(signal) {
  console.log(`Received ${signal}, starting graceful shutdown...`);
  server.close(() => {
    console.log("HTTP server closed. Exiting.");
    process.exit(0);
  });

  // Force exit if connections hang past 10 seconds
  setTimeout(() => {
    console.error("Forced termination after timeout");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
```

[Modules and packages](../../Node/node-lectures/day-03-modules-packages-and-resolution.md) | [Process and lifecycle](../../Node/node-lectures/day-04-process-configuration-and-lifecycle.md)

## Files, buffers, and data handling

**1. Safe filesystem paths and I/O**

Always use asynchronous filesystem APIs (`node:fs/promises`) in request paths. Validate user-supplied paths against an allowed root directory to prevent directory traversal attacks.

```js
import path from "node:path";
import { readFile } from "node:fs/promises";

// Path traversal defense
function getSafeFilePath(baseDir, userInput) {
  const safeBase = path.resolve(baseDir);
  const target = path.resolve(safeBase, userInput);

  // Invariant: Target must strictly reside inside safeBase
  if (!target.startsWith(safeBase + path.sep)) {
    throw new Error("Forbidden: Directory traversal attempt detected");
  }
  return target;
}
```

**2. Buffers and memory allocation**

Buffers store raw binary octets outside the V8 JavaScript heap in slab-allocated memory. Always use `Buffer.alloc()` for untrusted data to ensure memory is zero-filled; `Buffer.allocUnsafe()` exposes residual uninitialized system memory.

```js
// Correct: Safe zero-filled memory
const safeBuf = Buffer.alloc(16); // <Buffer 00 00 00 ...>

// Incorrect: Leaks residual memory previously freed by other processes
const unsafeBuf = Buffer.allocUnsafe(16); // <Buffer a4 19 8c ...>
```

**2.1 UTF-8 decoding and chunk boundaries**

Multi-byte UTF-8 characters (e.g., emojis or non-ASCII characters) can be sliced across separate binary stream chunks. Use `string_decoder.StringDecoder` rather than `.toString()` to avoid corrupted characters.

```js
import { StringDecoder } from "node:string_decoder";

const decoder = new StringDecoder("utf8");
// 4-byte emoji split into two buffers:
const chunk1 = Buffer.from([0xf0, 0x9f]);
const chunk2 = Buffer.from([0x98, 0x80]);

// Safe: buffers incomplete multi-byte sequences until completed
const text = decoder.write(chunk1) + decoder.write(chunk2); // "😀"
```

**3. Serialization boundaries and edge cases**

`JSON.stringify` drops `undefined`, functions, and symbols, and throws a `TypeError` when encountering `BigInt` or circular object references.

```js
// BigInt requires explicit conversion or custom serializer
const data = { count: 100n };
// JSON.stringify(data); // TypeError: Do not know how to serialize a BigInt

const serialized = JSON.stringify(data, (key, value) =>
  typeof value === "bigint" ? value.toString() : value
); // '{"count":"100"}'
```

[Safe file I/O](../../Node/node-lectures/day-05-files-paths-urls-and-safe-io.md) | [Buffers and serialization](../../Node/node-lectures/day-06-buffers-encodings-and-serialization.md)

## Tricky points

1. **Runtime and event loop**

**1.1 Event loop blocking**
Wrapping synchronous loops or heavy operations (`crypto.pbkdf2Sync`, JSON parsing large payloads) in a Promise does not make them asynchronous; it still blocks the single main thread and delays all concurrent users.

**1.2 Microtask starvation**
Recursive calls to `process.nextTick()` starve the event loop indefinitely because Node continuously drains microtasks before allowing the loop to advance to the Timers or Poll phases.

**1.3 Timer drift**
`setTimeout(fn, 100)` guarantees that the callback will not run *before* 100ms, but execution can be delayed significantly if preceding synchronous code or pending callbacks occupy the thread.

2. **Modules and process**

**2.1 CommonJS circular dependency partial exports**
When two CJS modules cyclically `require()` each other, the dependent module receives an incomplete, partially evaluated `module.exports` object, frequently causing `TypeError: fn is not a function`.

**2.2 ESM top-level await stalls**
A top-level `await` inside an ESM module delays the execution of that module and all parent modules importing it. If the awaited Promise never resolves, process startup hangs indefinitely.

**2.3 Truncated output on `process.exit()`**
Calling `process.exit()` immediately terminates the Node process without waiting for pending asynchronous I/O or flushing `process.stdout`/`process.stderr` write streams.

3. **Files and data**

**3.1 Naive string path sanitization**
Using `filePath.replace("../", "")` does not stop directory traversal; attackers can pass `....//` or encoded `%2e%2e%2f` to bypass regexes. Always use `path.resolve` and check prefix boundaries.

**3.2 Unsafe buffer allocation data leak**
Using `Buffer.allocUnsafe()` to construct responses can transmit sensitive memory passwords, keys, or previous database payloads to external API clients.

**3.3 UTF-8 multibyte stream corruption**
Calling `.toString("utf8")` on individual stream chunks splits characters that straddle chunk boundaries, replacing valid characters with replacement bytes (``).