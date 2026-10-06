# Day 05: Files, Paths, URLs, and Safe I/O

<nav aria-label="Lecture navigation">

[← Previous: Process, Configuration, and Lifecycle](day-04-process-configuration-and-lifecycle.md) | [Roadmap](../node-roadmap.md) | [Next: Buffers, Encodings, and Serialization](day-06-buffers-encodings-and-serialization.md)

</nav>

---

## What You Will Learn Today

By the end of this lecture, you should be able to:

- Select the appropriate filesystem API (`node:fs/promises`, streams, or file handles) for backend workloads without blocking the libuv event loop.
- Contrast URL parsing (`node:url`) with filesystem path resolution (`node:path`) and safely convert between them across POSIX and Windows.
- Defend against Path Traversal vulnerabilities by strictly confining candidate file access within a designated root directory.
- Eliminate Time-of-Check to Time-of-Use (TOCTOU) file race conditions using atomic file open flags (`wx`, `r`).
- Implement atomic file persistence patterns using same-filesystem temporary files and `fs.rename` to prevent partial write corruption.
- Manage file descriptors safely to prevent `EMFILE` (Too many open files) leaks using RAII-style `try/finally` blocks.
- Stream large files with backpressure using `stream.pipeline` instead of loading entire files into V8 heap memory with `fs.readFile()`.

---

## Prerequisites

Before studying this lecture, you should be comfortable with:
- **Node.js Runtime & Architecture:** Thread pool delegation for file I/O operations ([Day 01: Node.js Runtime and Architecture](day-01-node-runtime-and-architecture.md)).
- **Event Loop & Scheduling:** Why synchronous file APIs (`fs.readFileSync`) freeze all concurrent requests ([Day 02: Event Loop and Scheduling](day-02-event-loop-and-scheduling.md)).
- **Process Lifecycle:** Safe configuration boundaries and environment variable validation ([Day 04: Process, Configuration, and Lifecycle](day-04-process-configuration-and-lifecycle.md)).

*Upcoming Connections:*
- [Day 06: Buffers, Encodings, and Serialization](day-06-buffers-encodings-and-serialization.md) explores binary data chunks, memory allocation, and byte encodings.
- [Day 08: Streams and Backpressure](day-08-streams-and-backpressure.md) covers deep backpressure mechanics, transform streams, and highWaterMark tuning.

---

## Quick Vocabulary Card

| Term | Definition |
| :--- | :--- |
| **Path Traversal** | A security vulnerability where malicious input (e.g., `../../etc/passwd`) escapes the intended directory boundary to access sensitive system files. |
| **TOCTOU Race** | Time-of-Check to Time-of-Use; a concurrency flaw where file state changes between when it is inspected (`fs.access`) and when it is operated on (`fs.open`). |
| **Atomic Write** | A persistence pattern that writes data to a temporary file first, flushes disk buffers (`fsync`), and atomically renames it to guarantee no corrupted partial files exist. |
| **File Descriptor (FD)** | An integer assigned by the OS kernel representing an open file, socket, or pipe handle. |
| **`EMFILE` Error** | An OS kernel error indicating the current process has exceeded its allocated maximum number of open file descriptors. |
| **Canonical Path** | The absolute, fully resolved file path with all symbolic links, relative segments (`..`), and redundant slashes resolved (`fs.realpath`). |
| **`path.resolve()`** | Resolves a sequence of path segments into an absolute path, processing segments from right to left until an absolute path is formed. |
| **`path.join()`** | Joins all given path segments together using the platform-specific separator and normalizes the resulting path. |
| **`fileURLToPath()`** | Converts a `file://` URL object or string into a fully qualified, platform-compliant operating system file path. |
| **Stream Backpressure** | A flow-control signal where a slow consumer instructs a fast producer to pause reading from disk until outgoing buffers drain. |

---

## 1. Asynchronous Filesystem Architecture in Node.js

The **`node:fs` module** is Node's core filesystem API, providing synchronous, callback-based, and Promise-based methods for interacting with the host operating system disk.

JavaScript executes on a single main thread. Operating system disk operations, however, are inherently blocking at the kernel level. To avoid freezing your entire application while waiting for disk heads or NVMe controllers, Node delegates filesystem requests to libuv's background **thread pool** (default 4 threads, configurable via `UV_THREADPOOL_SIZE`).

```text
[Main JS Thread] fs.readFile('data.json')
       │
       ▼ (Dispatches request)
[libuv Thread Pool] ── Thread 1: Blocking open() & read() on OS disk
       │
       ▼ (Notifies event loop on completion)
[Poll Phase] Dispatches JavaScript callback or resolves Promise
```

### Real-World Analogy: The Public Library Vault and the Courier

Imagine a research library with a public study desk (**Main JavaScript Call Stack**) and a high-security document vault (**Operating System Disk**):
- If the head librarian leaves the desk to walk deep into the vault to find a book (**Synchronous `fs.readFileSync`**), all students waiting at the desk are frozen in line. No one can ask questions, check in, or leave (**Event Loop Freezes**).
- Instead, the librarian hands a retrieval slip to a courier (**libuv Thread Pool**) and immediately helps the next student in line (**Non-blocking Asynchronous I/O**).
- When the courier returns with the book, the librarian calls the student when the desk is clear (**Callback Dispatch**).
- If an unauthorized student submits a slip requesting `../../vault/master_keys.key` (**Path Traversal**), the security officer checks the destination against the perimeter boundary before dispatching the courier (**Path Containment Check**).

```js
// Node.js code
// Demonstrating the catastrophic impact of Synchronous vs. Asynchronous File I/O

const fs = require("node:fs");
const fsPromises = require("node:fs/promises");

// ❌ Anti-pattern: Blocking the event loop in high-throughput servers
function readConfigSync() {
  // Freezes ALL incoming HTTP requests, timers, and active sockets while reading disk!
  return fs.readFileSync("./config.json", "utf8");
}

// ✅ Valid: Asynchronous file read via fs/promises delegates to libuv thread pool
async function readConfigAsync() {
  // Allows other concurrent requests to process while disk I/O runs in background
  return await fsPromises.readFile("./config.json", "utf8");
}
```

---

## 2. Paths vs. URLs: Safe Conversion Boundaries

A **filesystem path** describes a physical or virtual location within an operating system's directory hierarchy, whereas a **URL** (`Uniform Resource Identifier`) is a standardized network resource locator governed by RFC 3986.

A common bug in modern Node.js backends arises when developers mix file paths and URLs.

### 2.1 The `import.meta.url` Trap in ESM

In ECMAScript Modules, `import.meta.url` returns a string formatted as a `file://` URL (e.g., `file:///C:/app/server.js` on Windows or `file:///var/app/server.js` on Linux). Passing this string directly to `fs.readFile()` can cause subtle path corruption or outright crashes.

You must convert between URLs and OS paths using `node:url`:

```js
// Node.js code (ESM)
// Demonstrating URL to Path conversion

import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";

// ❌ Trap: Passing import.meta.url directly to path manipulation functions
// path.dirname(import.meta.url); // Returns "file:///var/app" on Linux, breaks path.join!

// ✅ Correct: Convert file URL to an absolute OS filesystem path first
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("OS Path:", __filename);
// Linux:   /var/app/src/server.js
// Windows: C:\var\app\src\server.js

// Reverse: Convert an OS path back to a valid file URL
const fileUrl = pathToFileURL(__filename).href;
console.log("File URL:", fileUrl);
```

### 2.2 `path.join()` vs. `path.resolve()`

| Feature | `path.join([...paths])` | `path.resolve([...paths])` |
| :--- | :--- | :--- |
| **Core Purpose** | Concatenates segments and normalizes separators | Resolves segments into an **absolute path** |
| **Root Anchor** | Does not anchor unless a segment begins with `/` | Always returns an absolute path anchored to `process.cwd()` |
| **Leading Slash** | Preserves relative paths if no leading `/` exists | Treats the first absolute segment as the new root |
| **Primary Use Case** | Building subpaths inside an already known directory | Resolving configuration or user inputs to absolute paths |

```js
// Node.js code
// Demonstrating path.join vs path.resolve

const path = require("node:path");

// path.join merely concatenates and cleans up redundant separators
console.log(path.join("users", "lotus", "data.txt")); 
// Returns: "users/lotus/data.txt" (Relative)

// path.resolve prepends current working directory if not absolute
console.log(path.resolve("users", "lotus", "data.txt"));
// Returns: "/current/working/dir/users/lotus/data.txt" (Absolute)

// Leading absolute path resets resolution in path.resolve:
console.log(path.resolve("/first", "/second", "file.txt"));
// Returns: "/second/file.txt" (First root was discarded!)
```

---

## 3. Path Traversal Attacks & Strict Containment

A **path traversal attack** (or directory traversal) is an exploit where an attacker inputs characters like `../` or encoded representations to force the server to read or overwrite files outside the intended root directory.

### 3.1 The Vulnerability: Naive Concatenation

Many applications attempt to serve user-uploaded or public assets like this:

```js
// Node.js code
// ❌ CRITICAL SECURITY VULNERABILITY: Naive Path Joining
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const PUBLIC_DIR = "/var/www/public";

http.createServer(async (req, res) => {
  // If attacker requests: /static/../../../../etc/passwd
  const userFile = req.url.replace("/static/", "");
  const targetPath = path.join(PUBLIC_DIR, userFile); 
  // Resolves to: /etc/passwd!

  try {
    const data = await fs.readFile(targetPath); // Attacker steals system passwords!
    res.writeHead(200).end(data);
  } catch {
    res.writeHead(404).end("Not found");
  }
});
```

### 3.2 The Defense: Relative Containment Verification

To definitively prevent directory escape:
1. Resolve the trusted root to an absolute path.
2. Resolve the candidate path against that root.
3. Calculate the relative path from the root to the candidate using `path.relative()`.
4. If the relative path starts with `..` or is an absolute path, **reject the request immediately**.

```js
// Node.js code
// Production Path Confinement Validator

const path = require("node:path");

function safeResolveInside(rootDirectory, requestedPath) {
  // 1. Convert root directory to strict absolute path
  const safeRoot = path.resolve(rootDirectory);

  // 2. Resolve requested path relative to safeRoot
  const candidatePath = path.resolve(safeRoot, requestedPath);

  // 3. Compute relative relationship
  const relativePath = path.relative(safeRoot, candidatePath);

  // 4. Verification Check:
  // - If relativePath starts with '..', it escaped above safeRoot.
  // - If relativePath is absolute, candidate was on a different Windows drive!
  const isContained = !relativePath.startsWith("..") && !path.isAbsolute(relativePath);

  if (!isContained) {
    const err = new Error("Security Alert: Path Traversal Attempt Blocked");
    err.code = "ERR_PATH_TRAVERSAL";
    throw err;
  }

  return candidatePath;
}

// Verification:
const ROOT = "/var/www/uploads";

console.log("✅ Valid:", safeResolveInside(ROOT, "avatars/user_1.png"));
// Returns: /var/www/uploads/avatars/user_1.png

try {
  safeResolveInside(ROOT, "../../etc/shadow");
} catch (err) {
  console.log("❌ Blocked Attack:", err.message);
  // Logs: Security Alert: Path Traversal Attempt Blocked
}
```

### 3.3 The Symlink Bypass Hazard

Even if lexical path containment passes, **symbolic links** can defeat simple string checks! If an attacker uploads or creates a symlink `public/docs -> /etc`, opening `public/docs/passwd` passes lexical containment but reads `/etc/passwd`.

To defend against symlink escapes, resolve the real physical path using **`fs.realpath()`**:

```js
// Node.js code
// Defense against Symlink Traversal
const fs = require("node:fs/promises");

async function verifyRealpathContainment(safeRoot, candidatePath) {
  const realRoot = await fs.realpath(safeRoot);
  const realCandidate = await fs.realpath(candidatePath);

  const relative = path.relative(realRoot, realCandidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Symlink traversal escape detected!");
  }
  return realCandidate;
}
```

---

## 4. TOCTOU Races and Atomic File Flags

A **TOCTOU race** (Time-of-Check to Time-of-Use) occurs when a program checks the state of a resource (e.g., checking if a file exists) and performs an operation on it later, under the assumption that the state has not changed.

### 4.1 The Flawed Pattern: `fs.access()` followed by `fs.writeFile()`

```text
Time t0: Process A checks: Does 'lock.txt' exist? (fs.access -> NO)
Time t1: Process B checks: Does 'lock.txt' exist? (fs.access -> NO)
Time t2: Process A creates 'lock.txt' and acquires lock
Time t3: Process B creates 'lock.txt' and OVERWRITES Process A's lock!
```

Both processes believe they obtained an exclusive lock because the check and the write were two separate, non-atomic steps!

### 4.2 The Solution: Exclusive Creation with the `'wx'` Flag

The operating system kernel provides atomic file opening flags. The `'wx'` flag (write-exclusive) combines checking and creating into a single atomic kernel syscall:
- If the file **does not exist**, the OS creates it and returns an open file descriptor.
- If the file **already exists**, the OS call immediately fails with error code **`EEXIST`**.

```js
// Node.js code
// Demonstrating Atomic File Locking via 'wx' flag

const fs = require("node:fs/promises");

async function acquireLockFile(lockPath) {
  try {
    // 'wx' flag: Open for writing; fails if file already exists (O_CREAT | O_EXCL)
    const handle = await fs.open(lockPath, "wx");
    console.log("✅ Exclusive lock acquired successfully!");
    return handle;
  } catch (err) {
    if (err.code === "EEXIST") {
      // ❌ Another concurrent process already holds the lock!
      throw new Error(`Lock already held: ${lockPath}`);
    }
    throw err;
  }
}
```

### Summary Comparison: Common Node.js File Open Flags

| Flag | Meaning | Behavior if File Exists | Behavior if File Missing |
| :--- | :--- | :--- | :--- |
| `'r'` | Read-only | Opens for reading | Fails with `ENOENT` |
| `'w'` | Write-truncate | Truncates file length to 0 | Creates new file |
| `'wx'` | Write-exclusive | **Fails with `EEXIST`** | **Creates new file atomically** |
| `'a'` | Append | Writes to end of file | Creates new file |
| `'ax'` | Append-exclusive | **Fails with `EEXIST`** | **Creates new file atomically** |

---

## 5. Atomic File Writes & Durability Patterns

An **atomic write** guarantees that a file is updated completely or not at all, preventing half-written, corrupted files if the server process crashes or loses power mid-write.

### 5.1 The Crash-Vulnerability of Direct Writes

If you update a configuration file by calling `fs.writeFile('config.json', newData)`, Node opens the file, truncates it to 0 bytes, and writes chunks sequentially. If the process is killed by Kubernetes or power fails after 50% of the bytes are written, `config.json` is permanently corrupted with invalid, half-formed data!

### 5.2 The 4-Step Atomic Replacement Pattern

To achieve atomic durability:
1. **Write to a Temporary File:** Create a unique temporary file in the **same filesystem directory** (`config.json.tmp.<pid>.<timestamp>`).
2. **Flush to Disk (`fsync`):** Force the operating system kernel to flush write caches to physical storage.
3. **Close Handle:** Close the temporary file descriptor cleanly.
4. **Atomic Rename (`fs.rename`):** Rename the temporary file over the destination file. On POSIX filesystems, `rename()` is an atomic kernel operation that swaps the directory entry instantaneously.

```text
[Step 1] Write data   ──> config.json.tmp.12345
[Step 2] fsync        ──> Flush kernel buffers to physical NVMe/SSD
[Step 3] Close handle ──> Release OS file descriptor
[Step 4] fs.rename    ──> Atomically replace config.json (Zero window of corruption!)
```

> **Why the Temporary File Must Be in the Same Directory:** Renaming across different disks or mount partitions causes the OS to fail with `EXDEV` (Cross-device link). Creating the temporary file in the exact same directory guarantees it resides on the same filesystem.

```js
// Node.js code
// Production Atomic File Write Pattern with fsync Durability

const fs = require("node:fs/promises");
const path = require("node:path");

async function writeAtomic(targetFilePath, data) {
  const dir = path.dirname(targetFilePath);
  const baseName = path.basename(targetFilePath);
  
  // Unique temporary file in the exact same directory
  const tempPath = path.join(dir, `.${baseName}.tmp.${process.pid}.${Date.now()}`);

  let handle;
  try {
    // 1. Open temporary file exclusively
    handle = await fs.open(tempPath, "wx");

    // 2. Write complete payload
    await handle.writeFile(data, "utf8");

    // 3. Force kernel write cache to commit to physical disk (Durability)
    await handle.sync();

    // 4. Close the file handle before renaming
    await handle.close();
    handle = null;

    // 5. Atomic rename replaces target instantly
    await fs.rename(tempPath, targetFilePath);
    console.log(`✅ Atomic write succeeded: ${targetFilePath}`);
  } catch (err) {
    // Clean up temporary file on failure
    if (handle) {
      await handle.close().catch(() => {});
    }
    await fs.unlink(tempPath).catch(() => {});
    throw err;
  }
}
```

---

## 6. Resource Ownership & File Descriptor Leaks (`EMFILE`)

A **file descriptor (FD)** is a low-level integer handle allocated by the OS kernel for every open file, socket, or pipe in a process.

Operating systems place strict limits on how many file descriptors a single process may hold concurrently (often 1024 by default, viewable via `ulimit -n`). If your application opens files without closing them, it will eventually crash with **`EMFILE: too many open files`**, rendering the entire server unable to accept new HTTP connections or query databases!

### 6.1 RAII-Style Handle Lifecycle Management

Whenever you work with low-level `fs.open()`, you must wrap handle usage in a strict `try/finally` block to ensure `handle.close()` executes under all circumstances:

```js
// Node.js code
// Safe Resource Ownership: Guaranteed Handle Teardown

const fs = require("node:fs/promises");

async function readSpecificHeader(filePath) {
  let fileHandle;

  try {
    // Acquire file descriptor
    fileHandle = await fs.open(filePath, "r");

    const buffer = Buffer.alloc(16);
    const { bytesRead } = await fileHandle.read(buffer, 0, 16, 0);

    return buffer.subarray(0, bytesRead);
  } finally {
    // ✅ GUARANTEED: File descriptor is always released, even if read() throws!
    if (fileHandle) {
      await fileHandle.close();
    }
  }
}
```

---

## 7. Streaming vs. Memory Buffering (`stream.pipeline`)

**`fs.readFile()`** loads an entire file into V8's heap memory as a single `Buffer` or `string` before returning.

### The Memory Exhaustion Trap
If an endpoint serves an 800MB video or a 2GB database dump using `fs.readFile()`:
1. Node allocates an 800MB buffer in memory.
2. If 10 users request the file simultaneously, memory spikes by **8 GB**, triggering V8 Garbage Collection stalls or fatal Out-Of-Memory (OOM) container crashes.

### The Production Solution: Streaming with `stream.pipeline`
Use **`fs.createReadStream()`** combined with **`stream.pipeline`** from `node:stream/promises`. Streams process data in small, configurable chunks (default `64KB`), maintaining constant, bounded memory usage (< 1MB) regardless of whether the file is 100MB or 100GB!

```js
// Node.js code
// Production Streaming File Server with Backpressure & Error Propagation

const http = require("node:http");
const fs = require("node:fs");
const { pipeline } = require("node:stream/promises");

const server = http.createServer(async (req, res) => {
  if (req.url === "/download") {
    const filePath = "./media/large_video.mp4";

    try {
      // Inspect file metadata to provide accurate content headers
      const stat = await fs.promises.stat(filePath);

      res.writeHead(200, {
        "Content-Type": "video/mp4",
        "Content-Length": stat.size,
      });

      // ✅ Stream with automatic backpressure & error forwarding
      // Memory usage stays under ~64KB even for multi-gigabyte files!
      await pipeline(fs.createReadStream(filePath), res);
    } catch (err) {
      console.error("Stream pipeline failed:", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {
        // Destroy connection if headers already sent
        res.destroy(err);
      }
    }
  } else {
    res.writeHead(404).end("Not Found");
  }
});

server.listen(3000);
```

---

## 8. JavaScript, Node.js, and DSA Connections

- **JavaScript Language Connection:** `try/finally` control flow provides the foundational cleanup guarantee for asynchronous resources. Promises and `async/await` coordinate asynchronous handle lifecycles across V8 call stack ticks.
- **Node.js Platform Connection:** Node delegates `fs` operations to libuv's thread pool, abstracting POSIX system calls (`open`, `read`, `write`, `fsync`, `rename`, `stat`) across Windows and Unix platforms.
- **DSA Connection:**
  - **Tree Traversal & Canonicalization:** Path containment verification relies on converting relative graph walks into canonical absolute directed trees. `fs.realpath` resolves directed symbolic link graphs, terminating upon encountering cycles or boundary violations.
  - **Stream Buffer Queues:** Streams manage chunks using bounded FIFO ring buffers. Backpressure activates when the internal queue length reaches `highWaterMark`, applying flow control algorithms to balance read and write rates ($R_{\text{read}} \approx R_{\text{write}}$).

---

## Tricky Points

### 1. `path.resolve()` Discards Preceding Paths Upon Finding a Root
If any argument passed to `path.resolve()` begins with a root slash (`/` on Linux or `C:\` on Windows), `path.resolve()` immediately discards all preceding path segments:

```js
// Node.js code
const path = require("node:path");

// ❌ Trap:
const safeRoot = "/var/www/uploads";
const userPath = "/etc/passwd";
console.log(path.resolve(safeRoot, userPath)); 
// Output: "/etc/passwd" (safeRoot was completely discarded!)
```

### 2. Windows vs. POSIX Path Separators
POSIX uses `/` exclusively. Windows supports `\` as the native separator but accepts `/` in many Win32 APIs. Never split paths using string `.split('/')` or `.split('\\')`. Always use **`path.sep`** or higher-level path functions like `path.normalize()`.

### 3. Cross-Device `EXDEV` on `fs.rename`
If your temporary file is written to `/tmp` (often an in-memory `tmpfs` mount) and your target file is in `/var/data` (a separate disk partition), `fs.rename()` will fail with `EXDEV: cross-device link not permitted`. Always create temporary files in the same directory as the target destination.

### 4. `fs.stat()` Followed by Action is Always a TOCTOU Vulnerability
Never check if a user has access or if a file exists using `fs.stat()` or `fs.access()` before reading or writing. The file can be modified, deleted, or replaced with a symlink between the check and the read!

---

## Hands-On Exercise

### Scenario: Building a Secure, Size-Limited File Server
Your team is building an internal microservice to serve user-uploaded PDF invoices. The existing prototype suffers from two major flaws:
1. It is vulnerable to path traversal, allowing users to read files outside the invoices directory.
2. It uses `fs.readFile()` without size validation, allowing users to trigger Out-Of-Memory crashes by requesting massive 500MB files.

### Buggy Code

```js
// Node.js code
// BUGGY: Path traversal vulnerability + memory exhaustion risk

const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const INVOICE_DIR = "./invoices";

const server = http.createServer(async (req, res) => {
  // Extract file parameter (e.g., /download?file=invoice_101.pdf)
  const url = new URL(req.url, "http://localhost:3000");
  const fileName = url.searchParams.get("file");

  if (!fileName) {
    res.writeHead(400).end("Missing file parameter");
    return;
  }

  // ❌ Vulnerability 1: Traversal! User can pass ?file=../../package.json
  const filePath = path.join(INVOICE_DIR, fileName);

  try {
    // ❌ Vulnerability 2: Buffers entire file into memory with zero size limit!
    const data = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": "application/pdf" });
    res.end(data);
  } catch (err) {
    res.writeHead(500).end("Error: " + err.message);
  }
});

server.listen(3000);
```

### Acceptance Criteria
1. Confine file resolution strictly within `INVOICE_DIR`. Reject any traversal attempt with `403 Forbidden` without leaking server directory structures.
2. Enforce a maximum file size limit of **10 MB**. Reject oversized files with `413 Payload Too Large`.
3. Use `fs.open()` with handle management and stream the response to avoid buffering large payloads into memory.
4. Guarantee that all file handles are closed even if network connections abort mid-flight.

### Solution Code

```js
// Node.js code
// SOLUTION: Strict path confinement, size validation, and stream pipeline

const http = require("node:http");
const fs = require("node:fs");
const fsPromises = require("node:fs/promises");
const path = require("node:path");
const { pipeline } = require("node:stream/promises");

const INVOICE_ROOT = path.resolve("./invoices");
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit

function getSafeInvoicePath(userFileName) {
  // 1. Lexical confinement verification
  const candidate = path.resolve(INVOICE_ROOT, userFileName);
  const relative = path.relative(INVOICE_ROOT, candidate);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    const err = new Error("Access Denied: Path outside invoice repository");
    err.code = "FORBIDDEN";
    throw err;
  }

  return candidate;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname !== "/download") {
    res.writeHead(404).end("Not Found");
    return;
  }

  const requestedFile = url.searchParams.get("file");
  if (!requestedFile) {
    res.writeHead(400).end("Bad Request: 'file' parameter is required");
    return;
  }

  let fileHandle;

  try {
    // Step 1: Validate path confinement
    const safePath = getSafeInvoicePath(requestedFile);

    // Step 2: Open handle in read-only mode (Atomic OS check)
    fileHandle = await fsPromises.open(safePath, "r");

    // Step 3: Inspect file metadata via the open handle (Prevents TOCTOU)
    const stats = await fileHandle.stat();

    if (!stats.isFile()) {
      res.writeHead(400).end("Bad Request: Target is not a regular file");
      return;
    }

    // Step 4: Enforce size limit
    if (stats.size > MAX_FILE_SIZE_BYTES) {
      res.writeHead(413).end("Payload Too Large: File exceeds 10MB limit");
      return;
    }

    // Step 5: Stream file contents with backpressure
    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Length": stats.size,
    });

    // Create stream from open file handle
    const readStream = fileHandle.createReadStream();
    await pipeline(readStream, res);
  } catch (err) {
    if (err.code === "FORBIDDEN") {
      res.writeHead(403).end("Forbidden: Access denied");
    } else if (err.code === "ENOENT") {
      res.writeHead(404).end("Not Found: Invoice does not exist");
    } else {
      console.error("Internal Server Error:", err.message);
      if (!res.headersSent) {
        res.writeHead(500).end("Internal Server Error");
      } else {
        res.destroy(err);
      }
    }
  } finally {
    // Step 6: Guarantee file handle closure
    if (fileHandle) {
      await fileHandle.close().catch(() => {});
    }
  }
});

server.listen(3000, () => {
  console.log("Secure Invoice Server listening on http://localhost:3000");
});
```

### Solution Explanation

1. **Path Confinement:** `getSafeInvoicePath` uses `path.resolve()` and `path.relative()` to verify that the target path remains inside `INVOICE_ROOT`. If `../` is passed, it throws a `FORBIDDEN` error without revealing the server's internal file path.
2. **Preventing TOCTOU:** Rather than calling `fs.stat(path)` and later calling `fs.open()`, the solution calls `fsPromises.open()` first and then executes `fileHandle.stat()` directly on the active file descriptor. This guarantees the file being examined is the exact file being streamed.
3. **Bounding Memory via Streaming:** Instead of loading up to 10MB into memory with `fs.readFile()`, `fileHandle.createReadStream()` streams chunks using `pipeline()`, maintaining constant memory usage under ~64KB.
4. **Guaranteed Teardown:** The `finally` block ensures `fileHandle.close()` is invoked whether the download completes, the client aborts early, or an error is thrown.

---

## Summary

- Node.js filesystem operations run on libuv's background thread pool, keeping the single JavaScript thread free to process network events.
- Never use synchronous filesystem methods (`fs.readFileSync`, `fs.writeFileSync`) in web request lifecycles.
- Always convert `import.meta.url` to an OS path using `fileURLToPath()` before invoking `path` or `fs` functions.
- Defend against Path Traversal by resolving candidate paths against a trusted root and confirming with `path.relative()` that the result does not begin with `..`.
- Use the exclusive `'wx'` flag to perform atomic file creation and eliminate Time-of-Check to Time-of-Use (TOCTOU) race conditions.
- Implement atomic writes using same-directory temporary files, `fsync` flushing, and atomic `fs.rename` replacement to prevent partial write corruption.
- Prevent file descriptor leaks (`EMFILE`) by wrapping all open file handles in `try/finally` blocks with `handle.close()`.
- Stream large files using `stream.pipeline` to maintain bounded memory and propagate backpressure safely.

---

## Cheat Sheet

### Filesystem & Path APIs at a Glance

| API | Type | Responsibility | Primary Use Case |
| :--- | :--- | :--- | :--- |
| `path.resolve([...paths])` | Path | Resolves absolute path from right to left | Rooting paths to known directories |
| `path.relative(from, to)` | Path | Computes relative difference | Confinement & traversal validation |
| `fileURLToPath(url)` | URL | Converts `file://` URL to OS path | ESM `import.meta.url` resolution |
| `fs.open(path, 'wx')` | File | Opens file exclusively; fails if exists | Atomic lock files, race prevention |
| `handle.sync()` | File | Flushes OS kernel cache to physical disk | Ensuring write durability before rename |
| `fs.rename(old, new)` | File | Atomically replaces target on same filesystem | Atomic file updates |
| `pipeline(read, write)` | Stream | Pipes streams with backpressure & cleanup | Large file transfers without heap bloat |

### Common Pitfalls
- **Using `path.join()` as a security filter:** `path.join("/root", "../etc/passwd")` still traverses up and breaks containment.
- **Cross-device rename errors (`EXDEV`):** Writing temporary files in `/tmp` and renaming them into `/var/data` fails across partition boundaries.
- **Checking existence before writing:** `if (await fs.exists(p)) await fs.write(...)` is an unsafe TOCTOU race; use `'wx'` flags.
- **Leaking file descriptors:** Opening handles without `try/finally` exhausts OS file limits (`EMFILE`).
- **Loading large files into memory:** `fs.readFile()` on multi-megabyte files triggers V8 heap memory exhaustion under load.

---

## Interview Questions

### 1. Why does `path.join(trustedRoot, userInput)` fail to prevent directory traversal?
**Question:** Explain why `path.join(trustedRoot, userInput)` is insufficient to secure file endpoints against path traversal attacks. What exact steps must be taken to verify that a file path is safely confined?

**Answer:**
`path.join()` is a pure string-manipulation utility that normalizes slashes and resolves `.` and `..` segments lexically. It has no security awareness and does not constrain the output to the base path:
- If `trustedRoot` is `/var/app/public` and `userInput` is `../../etc/passwd`, `path.join()` evaluates to `/var/etc/passwd`.
- If `userInput` contains sufficient `../` sequences, it traverses all the way to the filesystem root (`/etc/passwd`).

**Complete Confinement Algorithm:**
1. **Resolve Root:** Convert the trusted directory to an absolute canonical path using `path.resolve(trustedRoot)`.
2. **Resolve Candidate:** Resolve the user-supplied path against the root using `path.resolve(trustedRoot, userInput)`.
3. **Compute Relative Difference:** Call `path.relative(safeRoot, candidate)`.
4. **Enforce Boundary Check:**
   - If `relative.startsWith('..')`, the candidate navigated above the root.
   - If `path.isAbsolute(relative)`, the candidate resides on a different Windows drive volume.
   - Reject the request if either condition is true.
5. **Symlink Verification:** In environments allowing symlinks, execute `fs.realpath()` on the resolved path to ensure the target does not point outside the designated boundary.

---

### 2. What is a TOCTOU file race condition, and how do atomic flags eliminate it?
**Question:** Explain what a Time-of-Check to Time-of-Use (TOCTOU) file race condition is in Node.js. Provide an example of how a naive implementation fails, and show how atomic kernel flags resolve it.

**Answer:**
A TOCTOU race condition occurs when an application checks the state of a file in one operation (e.g., checking if a file exists or checking permissions) and acts upon it in a subsequent operation, assuming the state remained static.

**The Failure:**
```js
// Naive implementation:
try {
  await fs.access('lock.file'); // Time of Check: File exists?
  // RACE WINDOW: Another process deletes or creates the file here!
} catch {
  await fs.writeFile('lock.file', 'locked'); // Time of Use: Writes lock
}
```
If two processes execute this simultaneously, both find the file missing during `fs.access()`, and both write `lock.file`, violating exclusivity.

**The Resolution:**
Eliminate the gap between check and use by combining them into a single atomic kernel system call using the `'wx'` (write-exclusive) flag:
```js
// Atomic resolution:
const handle = await fs.open('lock.file', 'wx');
```
The OS kernel executes `O_CREAT | O_EXCL` at the kernel level: it creates the file only if it does not already exist. If it exists, the call immediately throws an `EEXIST` error, guaranteeing mutual exclusivity with zero race window.

---

### 3. How do you implement atomic file writes in Node.js, and why is `fsync` necessary?
**Question:** Why does writing directly to a configuration file with `fs.writeFile()` introduce corruption risks during server crashes? Detail the atomic write replacement pattern and explain the role of `fsync`.

**Answer:**
**The Corruption Risk:**
When `fs.writeFile('config.json', data)` executes, the file is truncated to 0 bytes and written in chunks. If the Node process crashes, Kubernetes evicts the pod, or power is lost halfway through writing, the file remains in a corrupted, half-written state.

**The Atomic Replacement Pattern:**
1. **Create Temporary File:** Open a unique temporary file (`.config.json.tmp.<pid>.<time>`) in the **same directory** as the destination file (to avoid cross-device `EXDEV` errors).
2. **Write Payload:** Write the full data payload to the temporary file.
3. **Flush Kernel Caches (`fsync`):** Call `handle.sync()` (or `fs.fsync()`). Modern operating systems cache disk writes in RAM buffers. Calling `sync()` instructs the OS to force all dirty buffers to physical non-volatile storage (NVMe/SSD). Without `fsync`, a server crash immediately after renaming can still leave empty or corrupted files on disk.
4. **Close Handle:** Close the file descriptor.
5. **Atomic Rename (`fs.rename`):** Call `fs.rename(tempPath, targetPath)`. On POSIX systems, `rename()` is an atomic directory metadata update: it swaps the directory pointer to the new inode instantly. Readers either see the complete old file or the complete new file—never a partial state.

---

### 4. What causes `EMFILE: too many open files`, and how do you prevent it?
**Question:** Under heavy production load, your Node.js API crashes with `Error: EMFILE, too many open files`. What does this error signify at the OS level, what causes it in Node.js, and how do you architecturally prevent it?

**Answer:**
**OS Level Meaning:**
Every open file, network socket, and pipe consumes an operating system **file descriptor (FD)**. The OS kernel enforces a per-process resource limit (`ulimit -n`). When a process attempts to open a new file or accept a new TCP connection and exceeds this limit, the kernel rejects the syscall with `EMFILE`.

**Root Causes in Node.js:**
1. **Unclosed File Handles:** Using low-level `fs.open()` without wrapping in `try/finally` blocks causes abandoned file handles whenever operations throw exceptions.
2. **Concurrent Request Flooding:** An endpoint executing `fs.readFile()` on thousands of concurrent incoming requests can open thousands of file handles simultaneously, exhausting OS limits.
3. **Leaked Keep-Alive Sockets:** Inactive client sockets that are not properly drained during shutdown.

**Architectural Defenses:**
1. **RAII-Style Handle Teardown:** Always close handles in `finally` blocks:
   ```js
   const handle = await fs.open(path, 'r');
   try { /* work */ } finally { await handle.close(); }
   ```
2. **Concurrency Throttling:** Limit concurrent file operations using a concurrency semaphore (e.g., `p-limit` or bounded queues) so no more than 50 files are opened simultaneously.
3. **Streaming Instead of Buffering:** Use streams with `pipeline()` so descriptors are open only for the duration of the chunked transfer and automatically reclaimed upon stream completion.

---

<nav aria-label="Lecture navigation">

[← Previous: Process, Configuration, and Lifecycle](day-04-process-configuration-and-lifecycle.md) | [Roadmap](../node-roadmap.md) | [Next: Buffers, Encodings, and Serialization](day-06-buffers-encodings-and-serialization.md)

</nav>