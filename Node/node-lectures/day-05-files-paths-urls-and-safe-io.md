# Day 05: Files, Paths, URLs, and Safe I/O

<nav aria-label="Lecture navigation">

[Previous: Process, Configuration, and Lifecycle](day-04-process-configuration-and-lifecycle.md) | [Roadmap](../node-roadmap.md) | [Next: Buffers, Encodings, and Serialization](day-06-buffers-encodings-and-serialization.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Choose asynchronous filesystem APIs for server work.
- Build paths without trusting user-controlled path text.
- Explain path traversal and how to confine file access.
- Distinguish checking a path from safely opening a resource.
- Clean up temporary files and file descriptors.

## Prerequisites

Read [Day 01: Node.js Runtime and Architecture](day-01-node-runtime-and-architecture.md), [Day 04: Process, Configuration, and Lifecycle](day-04-process-configuration-and-lifecycle.md), and JavaScript Day 19 for asynchronous cleanup patterns.

This lecture uses Node.js `fs/promises`, `path`, and `url` APIs. It does not cover operating-system permissions in full detail, so permission behavior remains platform-dependent.

## Core Concepts

### 1. Asynchronous filesystem work

Node provides promise-based filesystem operations through `node:fs/promises`:

```js
const { readFile } = require("node:fs/promises");

async function readText(filePath) {
  return readFile(filePath, "utf8");
}
```

Avoid synchronous filesystem calls in request handlers. They hold the JavaScript thread while the operating system performs the work.

### 2. Paths are not URLs

A filesystem path describes a location for the operating system. A URL describes a resource identifier and may contain encoding rules. Convert deliberately and use the right API for the job.

`path.join()` combines path parts using the platform separator. `path.resolve()` creates an absolute path. Neither function automatically makes an unsafe user path safe.

### 3. Path traversal

If an application accepts `../private.txt`, a user may escape the intended directory. A safe design resolves the candidate path and verifies that it remains inside a trusted root.

### 4. Check-then-use races

This pattern is unsafe:

```text
check that file exists
later open the file
```

Another process can change the file between the two operations. Prefer opening the resource directly with the required flags and handling the result. The operating system remains the authority.

### 5. Resource ownership

A file handle must have one clear owner. The owner closes it on success, failure, cancellation, and timeout. `try/finally` is the usual shape for cleanup.

### 6. Canonicalization is not the whole security decision

Lexical containment protects against many `..` inputs, but it does not answer every filesystem question:

- A symlink inside the root may point outside it.
- A path can change between validation and use.
- Case sensitivity differs between filesystems.
- Permissions and ownership are enforced by the operating system, not by `path.relative()`.

For high-risk file access, prefer a storage design where the client supplies an opaque identifier and the server maps it to a known record. If a relative path is unavoidable, define symlink policy, use restrictive permissions, and test on the deployment filesystem. A path check is one control, not a complete sandbox.

### 7. Size limits require a byte-level plan

`readFile()` loads the complete file before returning. That is convenient for small configuration files but unsafe for an endpoint whose input size is controlled by a user. A robust design chooses one of these strategies:

| Input shape | Appropriate strategy |
|---|---|
| Small, trusted file | `readFile()` with an explicit maximum |
| Large download | Create a read stream and pipe it with error handling |
| Upload | Stream to a temporary destination while counting bytes |
| Random access | Open a handle and read bounded ranges |

The limit must cover both the source bytes and any decoded or transformed representation. A "10 MB file" can produce more memory pressure when converted to text, parsed as JSON, or copied through several buffers.

### 8. Atomic writes and temporary files

Writing directly to a destination can leave a truncated file if the process crashes halfway through. For configuration or generated artifacts, write to a temporary file in the same directory, flush or close according to the durability requirement, and rename it into place. A same-directory rename is commonly used because it keeps the operation on one filesystem, but durability and atomicity details remain platform and filesystem dependent.

Temporary files need an owner and cleanup policy for success, failure, cancellation, and process restart. Generate names with a secure API rather than concatenating user input. Never use a predictable temporary path for sensitive content.

## Detailed Explanations and Traces

### Confined file access

This is a **Node.js example**:

```js
const path = require("node:path");

function resolveInside(rootDirectory, requestedName) {
  const root = path.resolve(rootDirectory);
  const candidate = path.resolve(root, requestedName);
  const relative = path.relative(root, candidate);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Requested path is outside the allowed directory");
  }

  return candidate;
}

console.log(resolveInside("/srv/public", "images/logo.png"));
// On POSIX: /srv/public/images/logo.png
```

The containment check uses the same path semantics as the platform. A real application should also define whether symlinks are allowed, because a path can appear inside the root while a symlink points elsewhere.

### Safe handle cleanup

```js
const fs = require("node:fs/promises");

async function readWithHandle(filePath) {
  const handle = await fs.open(filePath, "r");

  try {
    return await handle.readFile("utf8");
  } finally {
    await handle.close();
  }
}
```

The handle example is useful for bounded reads, but `fs.open()` followed by a later security decision can still be wrong if the decision is based on mutable metadata. Decide the trust boundary first, then open with the flags and permissions that express the intended operation. Handle `ENOENT`, `EACCES`, `EISDIR`, and `ENOSPC` as different operational categories rather than returning one misleading "file error."

The `finally` block runs after success, a thrown error, or a rejected promise from `readFile`. If closing can fail, the application should decide how to record that failure.

### URL to filesystem path

This is an **ESM-flavored Node.js example**:

```js
import { fileURLToPath } from "node:url";
import path from "node:path";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
console.log(currentDirectory);
```

`import.meta.url` is a URL, not a normal filesystem path. Convert it before passing it to filesystem APIs. The exact path format differs across operating systems.

### Serving a file without buffering it

This is a **Node.js HTTP example** for a trusted server-owned file. `pipeline()` connects stream backpressure and propagates errors more reliably than manually wiring only `data` and `end` handlers:

```js
const http = require("node:http");
const fs = require("node:fs");
const { pipeline } = require("node:stream/promises");

const server = http.createServer(async (request, response) => {
  if (request.url !== "/report") {
    response.writeHead(404).end();
    return;
  }

  try {
    await pipeline(fs.createReadStream("./private/report.pdf"), response);
  } catch (error) {
    if (!response.headersSent) {
      response.writeHead(500).end("Unable to serve report");
    } else {
      response.destroy(error);
    }
  }
});
```

The route still needs authentication, authorization, content headers, and a safe file ownership policy. Streaming reduces peak application memory; it does not make an unauthorized path safe or remove disk and network limits.

## Node.js, JavaScript, and DSA Connections

- **Node connection:** `fs/promises` and file handles are host APIs; `try/finally` is JavaScript control flow used for ownership.
- **Security connection:** Path validation is a trust-boundary problem, not just a string-format problem.
- **DSA connection:** Canonicalization reduces many textual paths to one comparable representation before containment is checked.

## Common Mistakes and Interview Traps

- Using `path.join(root, userInput)` as the only security check.
- Checking existence and opening later without considering races.
- Forgetting to close file handles.
- Using synchronous filesystem calls in request handlers.
- Assuming path separators are the same on every platform.
- Treating a URL string as a filesystem path.
- Returning unlimited file contents into memory.

## Tricky Points

- Symlinks can defeat simple lexical containment checks.
- A file can change after validation but before reading.
- Permission errors, missing files, and directories passed as files have different meanings.
- Large files should usually be streamed rather than loaded into one string or buffer.

## Practical Exercise

**Goal:** Build a confined, size-limited file reader.

**Inputs and outputs:** Accept a trusted root directory and a requested relative name. Return the file contents only when the resolved path stays inside the root and the file is within a configured size limit.

**Constraints:** Use asynchronous APIs, do not use a check-then-open sequence as the security decision, and do not expose absolute paths in client errors.

**Edge cases:** `../` traversal, absolute input, missing file, directory input, symlink, oversized file, permission failure, and cancellation.

**Acceptance criteria:**

- Unsafe paths are rejected.
- Client-facing errors do not reveal server paths.
- File resources are closed on every path.
- Oversized content is rejected before unbounded memory growth.
- Tests cover successful reads and failure cases.

## Summary

- Use asynchronous filesystem APIs in servers.
- Paths, URLs, and user input are different things.
- Resolve and validate paths at a trust boundary.
- Do not rely only on check-then-use logic.
- Own and close file handles with `try/finally`.
- Limit file size and prefer streaming for large content.

## Cheat Sheet

| Problem | Safer direction |
|---|---|
| Server file work | `node:fs/promises` or streams |
| User path | Resolve against a trusted root and check containment |
| URL path | Convert with URL-aware APIs |
| File handle | One owner; close in `finally` |
| Large file | Stream or enforce a size limit |
| Client error | Return a safe category, not an absolute path |

## Interview Questions

1. **Definition:** Why is `path.join(root, userInput)` not enough to prevent traversal?
   - **Expected answer:** Joining constructs a path but does not prove the result remains inside the trusted root or handle symlinks.
   - **Follow-up:** What additional filesystem concerns remain?

2. **Trace:** Which cleanup paths execute in `readWithHandle`?
   - **Expected answer:** The `finally` block runs after success or failure of the read, so the handle is closed.
   - **Follow-up:** What if `close()` itself rejects?

3. **Implementation:** Implement a size-limited asynchronous file read.
   - **Expected answer:** Resolve safely, obtain metadata or stream with a limit, handle errors, and close resources.
   - **Follow-up:** How would streaming change memory behavior?

4. **Debugging [Hard]:** A file endpoint occasionally serves data outside its configured directory. What evidence do you collect?
   - **Expected answer:** Raw input, canonical resolved path, symlink behavior, platform, permissions, race timing, and tests that reproduce traversal.
   - **Follow-up:** How would you avoid logging sensitive path data?

5. **Design [Hard]:** Design a user-upload storage boundary.
   - **Expected answer:** Generate server-side names, enforce size/type limits, isolate storage, use safe permissions, scan or validate content, clean temporary files, and define retention.
   - **Follow-up:** How would you serve large downloads without buffering them in memory?

<nav aria-label="Lecture navigation">

[Previous: Process, Configuration, and Lifecycle](day-04-process-configuration-and-lifecycle.md) | [Roadmap](../node-roadmap.md) | [Next: Buffers, Encodings, and Serialization](day-06-buffers-encodings-and-serialization.md)

</nav>