# Day 09: Node HTTP Fundamentals

<nav aria-label="Lecture navigation">

[← Previous: Streams and Backpressure](day-08-streams-and-backpressure.md) | [Roadmap](../node-roadmap.md) | [Next: Networking, DNS, TLS, and Timeouts](day-10-networking-dns-tls-and-timeouts.md)

</nav>

---

## What You Will Learn Today

By the end of this lecture, you should be able to:

- Trace the end-to-end lifecycle of an HTTP transaction from TCP connection through HTTP parsing to response termination.
- Master the streaming nature of `http.IncomingMessage` (Readable) and `http.ServerResponse` (Writable).
- Diagnose and eliminate the ubiquitous `ERR_HTTP_HEADERS_SENT: Cannot set headers after they are sent to the client` runtime error.
- Ingest and parse HTTP request bodies safely without third-party frameworks, enforcing strict byte limits, content-type checks, and single-settlement error policies.
- Configure critical production timeouts (`headersTimeout`, `requestTimeout`, `keepAliveTimeout`) to prevent Slowloris attacks.
- Intercept client disconnections cleanly (`req.on('close')`) and abort backend database queries when clients cancel requests.
- Contrast Node's raw HTTP module with the abstractions provided by Express and Fastify.

---

## Prerequisites

Before studying this lecture, you should be comfortable with:
- **Event Loop & Scheduling:** How Poll phase retrieves incoming TCP packets ([Day 02: Event Loop and Scheduling](day-02-event-loop-and-scheduling.md)).
- **Buffers & Encodings:** Reading binary chunks and calculating UTF-8 byte lengths ([Day 06: Buffers, Encodings, and Serialization](day-06-buffers-encodings-and-serialization.md)).
- **Streams & Backpressure:** How Readable and Writable streams manage chunks and backpressure ([Day 08: Streams and Backpressure](day-08-streams-and-backpressure.md)).

*Upcoming Connections:*
- [Day 10: Networking, DNS, TLS, and Timeouts](day-10-networking-dns-tls-and-timeouts.md) covers underlying TCP sockets, DNS resolution, and TLS encryption.
- [Day 13: Express Application Structure](day-13-express-application-structure.md) builds high-level API routers and middleware layers on top of Node's raw HTTP primitives.

---

## Quick Vocabulary Card

| Term | Definition |
| :--- | :--- |
| **`http.createServer()`** | Factory function that instantiates an HTTP server bound to an underlying TCP socket listener. |
| **`IncomingMessage`** | A Readable stream representing an incoming HTTP request, containing headers, method, URL, and streamed body chunks. |
| **`ServerResponse`** | A Writable stream representing the outgoing HTTP response, managing headers, status codes, and body serialization. |
| **`headersSent`** | A boolean property on `ServerResponse` indicating whether HTTP status and headers have already been transmitted over the socket. |
| **`ERR_HTTP_HEADERS_SENT`** | A fatal runtime error thrown when code attempts to set headers or status codes after headers were already dispatched. |
| **HTTP Keep-Alive** | A persistence mechanism that reuses a single underlying TCP connection across multiple consecutive HTTP requests. |
| **`headersTimeout`** | The maximum time (default 60s) allowed for an incoming client to finish sending all HTTP request headers. |
| **`requestTimeout`** | The maximum time (default 5m in modern Node) allowed for an entire request (headers + body) to be transmitted. |
| **Slowloris Attack** | A Denial-of-Service exploit where clients open thousands of TCP connections and transmit headers byte-by-byte to exhaust server sockets. |
| **Chunked Transfer (`Transfer-Encoding: chunked`)** | An HTTP/1.1 streaming mechanism allowing data to be transmitted in sized chunks without knowing the total `Content-Length` upfront. |

---

## 1. The Anatomy of an HTTP Transaction in Node.js

The **`node:http` module** is Node's built-in networking layer that implements the HTTP/1.1 protocol parser and transport abstraction.

Unlike application frameworks where requests appear magically as fully parsed JSON objects (`req.body`), Node's HTTP engine is **100% stream-driven**:

```text
1. Client establishes TCP connection ──► Handled by OS Kernel
2. OS alerts libuv Poll phase        ──► Libuv allocates socket handle
3. C++ HTTP parser parses headers    ──► Emits 'request' event on http.Server
4. Node constructs:
   - req: http.IncomingMessage (Readable Stream for Request Body)
   - res: http.ServerResponse  (Writable Stream for Response Body)
5. Request handler executes          ──► Streams chunks, writes headers, calls res.end()
```

### Real-World Analogy: The Tube Delivery System and the Two-Way Capsule

Imagine an executive desk equipped with a pneumatic tube station (**HTTP Server**):
- When a document arrives, the tube opens and dispenses a one-way listening capsule (**`IncomingMessage` / `req`**). You read the header slip first (**`req.headers`**), and then the memo text arrives paragraph by paragraph (**Streamed Chunks**).
- At the same time, the station provides a blank outgoing capsule (**`ServerResponse` / `res`**).
- You write the formal letterhead and destination stamp (**`res.writeHead()`**). Once you drop that letterhead into the outgoing tube (**`res.headersSent === true`**), you cannot reach into the tube to change the recipient or stamp!
- You stream the response body and seal the capsule (**`res.end()`**). If you attempt to stamp another letterhead after the capsule has departed, the tube alarms with an error (**`ERR_HTTP_HEADERS_SENT`**).

```js
// Node.js code
// Demonstrating the Raw Node.js HTTP Server

const http = require("node:http");

const server = http.createServer((req, res) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);

  // Inspect headers (all lowercase in Node.js!)
  console.log("User-Agent:", req.headers["user-agent"]);

  // 1. Send status code and response headers
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
    "X-Server": "NodeJS-Raw",
  });

  // 2. Write body payload
  res.write("Hello, World!\n");

  // 3. Finalize and seal the response stream
  res.end();
});

server.listen(3000, () => {
  console.log("HTTP server listening on http://localhost:3000");
});
```

---

## 2. Request Streaming: Why `req.body` Does NOT Exist in Node.js

In raw Node.js, **`req.body` is completely undefined**.

`req` (`http.IncomingMessage`) is a **Readable Stream**. When the `'request'` event fires, only the HTTP headers have arrived from the network! The request body is still traveling across the internet as a sequence of raw TCP packets.

### The Correct Way to Ingest a Request Body
To read the body, you must listen to stream chunks, enforce a strict byte limit, and buffer chunks safely:

```js
// Node.js code
// Production-Grade Bounded Request Body Parser

function parseJsonBody(req, maxBytes = 1024 * 1024) { // Default 1 MB limit
  return new Promise((resolve, reject) => {
    // 1. Verify Content-Type header
    const contentType = req.headers["content-type"];
    if (!contentType || !contentType.includes("application/json")) {
      const err = new Error("Unsupported Media Type: Expected application/json");
      err.statusCode = 415;
      return reject(err);
    }

    const chunks = [];
    let receivedBytes = 0;
    let settled = false;

    function fail(err) {
      if (!settled) {
        settled = true;
        req.destroy(); // Close client stream immediately
        reject(err);
      }
    }

    // 2. Ingest stream chunks
    req.on("data", (chunk) => {
      if (settled) return;

      receivedBytes += chunk.length;
      // Enforce strict byte ceiling to prevent memory bombs
      if (receivedBytes > maxBytes) {
        const err = new Error(`Payload Too Large: Maximum allowed is ${maxBytes} bytes`);
        err.statusCode = 413;
        fail(err);
        return;
      }

      chunks.push(chunk);
    });

    // 3. Complete and parse
    req.on("end", () => {
      if (settled) return;
      settled = true;

      try {
        const rawString = Buffer.concat(chunks).toString("utf8");
        const parsedData = rawString.trim() ? JSON.parse(rawString) : {};
        resolve(parsedData);
      } catch {
        const parseErr = new Error("Malformed JSON Syntax");
        parseErr.statusCode = 400;
        reject(parseErr);
      }
    });

    // 4. Handle stream errors and client cancellation
    req.on("error", fail);
    req.on("aborted", () => fail(new Error("Client aborted request")));
  });
}
```

---

## 3. The Response Lifecycle & `ERR_HTTP_HEADERS_SENT`

The most common error encountered by Node.js developers is:
`Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`.

### 3.1 Why Does This Error Occur?

An HTTP response consists of two discrete sections sent in strict sequential order:
1. **The Header Block:** Status code (`200 OK`) and HTTP headers (`Content-Type`, `Set-Cookie`).
2. **The Body Block:** Raw payload bytes (HTML, JSON, binary).

The moment your code calls:
- `res.writeHead(...)`
- `res.write(chunk)`
- `res.flushHeaders()`
- `res.end(chunk)`

...Node serializes the status code and headers into the TCP socket. The boolean flag **`res.headersSent`** becomes `true`.

If code subsequently attempts to:
- Call `res.writeHead()` or `res.setHeader()`
- Call `res.status()` or `res.redirect()`
- Send another response in an un-returned `if/else` branch

...Node throws **`ERR_HTTP_HEADERS_SENT`** because it is physically impossible to rewrite the headers on an established HTTP packet stream!

```js
// Node.js code
// Demonstrating the ERR_HTTP_HEADERS_SENT bug and its fix

const http = require("node:http");

const server = http.createServer((req, res) => {
  // ❌ Anti-pattern: Missing return statement causes double execution!
  if (req.url === "/profile") {
    res.writeHead(401, { "Content-Type": "text/plain" });
    res.end("Unauthorized");
    // MISSING RETURN! Execution falls through to the next lines!
  }

  // ❌ CRASH: Throws ERR_HTTP_HEADERS_SENT because headers were sent above!
  try {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Welcome to Profile");
  } catch (err) {
    console.error("❌ Caught Fatal Mistake:", err.code); // ERR_HTTP_HEADERS_SENT
  }
});
```

```js
// ✅ The Golden Rule: ALWAYS use 'return' when completing an HTTP response!
if (req.url === "/profile") {
  res.writeHead(401, { "Content-Type": "text/plain" });
  return res.end("Unauthorized"); // 'return' halts function execution immediately!
}
```

---

## 4. HTTP Keep-Alive & Production Timeouts

In HTTP/1.1, TCP connections are kept open by default (`Connection: keep-alive`) so that browsers and microservices can reuse the same established socket for subsequent requests, eliminating the overhead of repeated TCP 3-way handshakes and TLS negotiations.

However, poorly configured keep-alive connections leave servers open to **Slowloris Denial-of-Service attacks**, where malicious clients open connections and transmit single bytes every 20 seconds to hold open thousands of sockets.

### 4.1 Critical Node.js HTTP Server Timeouts

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        TCP Connection Established                       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 │ headersTimeout (default 60,000ms)     │ Time allowed to receive
                 │ (Must be > keepAliveTimeout)          │ all HTTP headers
                 └───────────────────┬───────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 │ requestTimeout (default 300,000ms)    │ Time allowed to receive
                 │                                       │ entire request (incl body)
                 └───────────────────┬───────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 │ keepAliveTimeout (default 5,000ms)    │ Inactivity pause between
                 │                                       │ consecutive requests
                 └───────────────────────────────────────┘
```

```js
// Node.js code
// Configuring Production-Safe Server Timeouts

const http = require("node:http");
const server = http.createServer((req, res) => res.end("OK"));

// 1. Time to wait for headers to finish arriving
server.headersTimeout = 20000; // 20 seconds

// 2. Time to wait for complete request (headers + body)
server.requestTimeout = 30000; // 30 seconds

// 3. How long to keep socket idle between requests before closing
server.keepAliveTimeout = 5000; // 5 seconds (Must match load balancer settings)

// Golden Rule: headersTimeout MUST be greater than keepAliveTimeout!
// Recommended: server.headersTimeout = server.keepAliveTimeout + 1000;
```

---

## 5. Client Disconnection & Abort Propagation

When an end-user navigates away, closes a browser tab, or their mobile connection drops, the client terminates the TCP socket.

If your server endpoint is in the middle of executing a 5-second heavy database calculation or generating an expensive PDF, **Node does not stop running the code automatically!** Unless you explicitly listen for client disconnects, your server wastes precious CPU and database connections processing results that will be discarded.

### Catching Disconnects via `req.on('close')` and `AbortController`

```js
// Node.js code
// Production Abort Propagation Pattern

const http = require("node:http");

const server = http.createServer(async (req, res) => {
  // 1. Create an AbortController tied to the client request
  const ac = new AbortController();

  // 2. Listen for socket termination before response completes
  req.on("close", () => {
    if (!res.writableEnded) {
      console.log("Client aborted connection! Halting backend tasks...");
      ac.abort(); // Propagates cancellation signal
    }
  });

  try {
    // 3. Pass signal to database queries or external API fetches
    const data = await queryDatabaseWithCancellation(ac.signal);

    if (!res.writableEnded) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    }
  } catch (err) {
    if (ac.signal.aborted) {
      console.warn("Database query aborted successfully.");
    } else {
      res.writeHead(500).end("Internal Server Error");
    }
  }
});

// Mock query accepting AbortSignal
async function queryDatabaseWithCancellation(signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve({ result: "Success" }), 3000);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new Error("QueryAborted"));
    });
  });
}
```

---

## 6. What Express & Fastify Add Over Raw Node HTTP

Frameworks like Express and Fastify do not replace Node's HTTP server—they build on top of `IncomingMessage` and `ServerResponse`.

| Feature | Raw Node.js HTTP (`node:http`) | Express.js / Fastify |
| :--- | :--- | :--- |
| **Routing** | Manual inspection of `req.url` & `req.method` | Robust pattern routing (`/users/:id`, wildcard paths) |
| **Body Parsing** | Manual streaming, buffer concat, JSON parsing | Middleware (`express.json()`, multipart parsers) |
| **Response Helpers**| Raw `res.write()`, `res.writeHead()`, `res.end()` | `res.json()`, `res.status()`, `res.send()`, `res.redirect()` |
| **Middleware Chain**| Manual function chaining | Structured execution pipeline (`(req, res, next)`) |
| **Error Handling** | Uncaught errors crash or hang requests | Centralized 4-argument error middleware `(err, req, res, next)` |

---

## 7. JavaScript, Node.js, and DSA Connections

- **JavaScript Language Connection:** HTTP headers and URLs are modeled using standard ECMAScript Maps, Objects, and the `URL` global. Headers are normalized to lowercase strings (`req.headers['content-type']`).
- **Node.js Platform Connection:** Node's HTTP parser is implemented in native C++ (`llhttp`). When network packets arrive at a socket via libuv, `llhttp` parses the HTTP stream incrementally, translating byte streams into JavaScript event emissions.
- **DSA Connection:**
  - **Trie / Radix Tree Routing:** Frameworks like Fastify and Express compile route paths into Radix Trees for $O(K)$ route matching based on URL path segment length rather than $O(N)$ linear array searching.
  - **Socket Connection Pooling:** Keep-alive connections are managed using FIFO free-lists in Node's HTTP Agent (`http.Agent`), matching outgoing client requests to available keep-alive sockets.

---

## Tricky Points

### 1. `req.headers` Normalization
All incoming HTTP header keys in `req.headers` are converted to **lowercase** by Node.js (`Accept-Encoding` becomes `accept-encoding`). Never look up uppercase headers like `req.headers['Content-Type']`; it will return `undefined`.

### 2. Calling `res.end()` Does Not Halt Code Execution
`res.end()` seals the HTTP response, but **it does not act like a `return` keyword**. Any JavaScript lines placed after `res.end()` continue executing on the call stack:

```js
// Node.js code
res.end("Done");
console.log("This STILL PRINTS!"); // Continues running!
```

### 3. Setting Headers After `res.write()`
The very first call to `res.write(chunk)` implicitly dispatches status and headers to the client. Any subsequent call to `res.setHeader()` throws `ERR_HTTP_HEADERS_SENT`.

### 4. Client Disconnects Don't Stop Timers
If you start a `setTimeout()` inside a request handler, it will fire even if the client disconnects immediately, unless you explicitly clear it in `req.on('close')`.

---

## Hands-On Exercise

### Scenario: Building a Resilient Raw HTTP REST Endpoint with Cancellation & Limits
Your team is building a high-performance webhook receiver without heavy third-party framework dependencies. The webhook receives JSON payment notifications. The prototype currently crashes under malformed JSON, hangs indefinitely when clients stream slowly, and continues querying PostgreSQL even when the client aborts the request.

### Buggy Code

```js
// Node.js code
// BUGGY: Unbounded body, no timeout handling, client disconnect ignored

const http = require("node:http");

const server = http.createServer((req, res) => {
  if (req.url === "/webhook" && req.method === "POST") {
    let body = "";

    // ❌ BUG 1: Unbounded string concatenation (Memory Bomb!)
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      // ❌ BUG 2: Unhandled JSON.parse crash!
      const data = JSON.parse(body);

      // Simulate 3-second database transaction
      await new Promise((r) => setTimeout(r, 3000));

      // ❌ BUG 3: Double send / missing return if client aborted!
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "PROCESSED", id: data.id }));
    });
  } else {
    res.writeHead(404).end();
  }
});

server.listen(3000);
```

### Acceptance Criteria
1. Restrict `/webhook` strictly to `POST` requests with `Content-Type: application/json`.
2. Enforce a strict **512 KB** body size limit. If exceeded, terminate immediately with `413 Payload Too Large`.
3. Safely catch malformed JSON and respond with `400 Bad Request`.
4. Listen for client disconnection (`req.on('close')`). If the client aborts, cancel the simulated database operation and halt execution.
5. Set `headersTimeout` and `keepAliveTimeout` on the HTTP server to prevent connection starvation.

### Solution Code

```js
// Node.js code
// SOLUTION: Robust, safe webhook receiver with abort signal and bounded memory

const http = require("node:http");

const MAX_BODY_BYTES = 512 * 1024; // 512 KB limit

function parseBoundedJson(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers["content-type"];
    if (!contentType || !contentType.includes("application/json")) {
      const err = new Error("Invalid Content-Type: Expected application/json");
      err.statusCode = 415;
      return reject(err);
    }

    const chunks = [];
    let receivedBytes = 0;
    let isSettled = false;

    function fail(err) {
      if (!isSettled) {
        isSettled = true;
        req.destroy();
        reject(err);
      }
    }

    req.on("data", (chunk) => {
      if (isSettled) return;

      receivedBytes += chunk.length;
      if (receivedBytes > maxBytes) {
        const err = new Error(`Payload Too Large: Max size is ${maxBytes} bytes`);
        err.statusCode = 413;
        fail(err);
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (isSettled) return;
      isSettled = true;

      try {
        const text = Buffer.concat(chunks).toString("utf8");
        const parsed = JSON.parse(text);
        resolve(parsed);
      } catch {
        const err = new Error("Malformed JSON Syntax");
        err.statusCode = 400;
        reject(err);
      }
    });

    req.on("error", fail);
  });
}

// Simulated database operation with AbortSignal cancellation
function processPaymentDatabase(data, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      console.log(`[DB] Payment recorded successfully for ID: ${data.id}`);
      resolve({ status: "PROCESSED", id: data.id });
    }, 2500);

    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      console.warn(`[DB] Payment operation aborted for ID: ${data?.id}`);
      reject(new Error("OperationAborted"));
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/webhook" && req.method === "POST") {
    const ac = new AbortController();

    // Intercept client disconnect
    req.on("close", () => {
      if (!res.writableEnded) {
        console.log("Client dropped socket connection; signaling abort.");
        ac.abort();
      }
    });

    try {
      // 1. Ingest and parse bounded JSON body
      const payload = await parseBoundedJson(req, MAX_BODY_BYTES);

      // 2. Process work with cancellation signal
      const result = await processPaymentDatabase(payload, ac.signal);

      // 3. Complete response cleanly
      if (!res.writableEnded) {
        const responseBody = JSON.stringify(result);
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(responseBody, "utf8"),
        });
        return res.end(responseBody);
      }
    } catch (err) {
      if (ac.signal.aborted) {
        console.warn("Request cleanly aborted after client disconnect.");
        return;
      }

      const statusCode = err.statusCode || 500;
      const errorResponse = JSON.stringify({ error: err.message });

      if (!res.headersSent) {
        res.writeHead(statusCode, {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(errorResponse, "utf8"),
        });
        return res.end(errorResponse);
      } else {
        res.destroy(err);
      }
    }
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not Found");
  }
});

// Configure production timeouts
server.headersTimeout = 10000;  // 10s
server.requestTimeout = 15000;  // 15s
server.keepAliveTimeout = 5000; // 5s

server.listen(3000, () => {
  console.log("Webhook receiver listening on http://localhost:3000");
});
```

### Solution Explanation

1. **Defending Against Memory Exhaustion:** `parseBoundedJson` validates `Content-Type` before processing chunks and tallies bytes progressively. If a client transmits $> 512\text{ KB}$, the stream destroys the request immediately and returns `413 Payload Too Large`.
2. **Safe JSON Parsing:** Synchronous `JSON.parse` is wrapped in `try/catch`. Syntax errors are cleanly mapped to `400 Bad Request` without leaking Node runtime stack traces.
3. **Cancellation via `AbortSignal`:** An `AbortController` listens for `req.on('close')`. If the client closes the connection mid-processing, the database timer is cleared immediately, saving backend resources.
4. **Guaranteed Return Control:** Every completion branch (`res.end()`) uses an explicit `return` statement, preventing fall-through execution and eliminating `ERR_HTTP_HEADERS_SENT`.

---

## Summary

- Node HTTP is completely stream-driven: `IncomingMessage` is a Readable stream for the request body, and `ServerResponse` is a Writable stream for the response body.
- `req.body` does not exist natively in Node. You must read chunks asynchronously and enforce a strict byte limit before parsing JSON.
- `ERR_HTTP_HEADERS_SENT` occurs when code attempts to set headers after headers have already been sent to the network socket. Always `return` when calling `res.end()`.
- HTTP Keep-Alive reuses TCP connections across multiple requests. Configure `headersTimeout`, `requestTimeout`, and `keepAliveTimeout` to defend against Slowloris attacks.
- Intercept client disconnections via `req.on('close')` and propagate cancellation to database queries using `AbortController`.
- All incoming header keys in `req.headers` are normalized to lowercase by Node.js.

---

## Cheat Sheet

### HTTP Server APIs at a Glance

| API | Responsibility | Primary Use Case |
| :--- | :--- | :--- |
| `res.writeHead(status, headers)` | Sends HTTP status code and header block | Finalizing response metadata |
| `res.setHeader(name, val)` | Queues header to be sent with next write | Setting individual headers |
| `res.headersSent` | Boolean; true if headers already transmitted | Guarding against `ERR_HTTP_HEADERS_SENT` |
| `res.end([data])` | Writes optional chunk and finishes response | Completing the HTTP transaction |
| `req.on('close')` | Emitted when client abruptly drops connection | Aborting ongoing backend work |
| `server.headersTimeout` | Maximum time allowed to receive headers | Defending against Slowloris attacks |

### Common Pitfalls
- **Missing `return` after `res.end()`:** Allows execution to fall through and triggers `ERR_HTTP_HEADERS_SENT`.
- **Looking up uppercase headers:** `req.headers['Content-Type']` is `undefined`; use lowercase `req.headers['content-type']`.
- **Parsing JSON without byte limits:** Leaves server vulnerable to memory exhaustion attacks.
- **Ignoring client disconnects:** Continuing long database queries after a user has cancelled the request wastes server CPU.
- **Setting `Content-Length` via `.length`:** Corrupts payloads containing multi-byte characters; always use `Buffer.byteLength()`.

---

## Interview Questions

### 1. What is `ERR_HTTP_HEADERS_SENT`, and how do you systematically prevent it?
**Question:** Explain what causes `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client` in Node.js. How does the HTTP protocol enforce this constraint, and what coding pattern prevents it?

**Answer:**
**The Architectural Cause:**
Under the HTTP/1.1 specification, every HTTP response is divided into two sequential sections: the **Header Block** (containing status line and headers) followed by the **Body Block**.
In Node.js, calling `res.writeHead()`, `res.write()`, or `res.end()` immediately flushes the Header Block onto the underlying TCP socket stream. At that moment, Node sets `res.headersSent = true`.
Once headers are transmitted over the wire, the protocol does not allow changing the status code or adding headers. If application code later attempts to call `res.setHeader()`, `res.writeHead()`, or another response completion method, Node throws `ERR_HTTP_HEADERS_SENT`.

**The Root Coding Bug:**
The error almost always occurs due to missing `return` statements in conditional logic or asynchronous callback chains:
```js
if (notAuthenticated) {
  res.status(401).send("Unauthorized");
  // MISSING RETURN!
}
res.status(200).send("Profile"); // Throws ERR_HTTP_HEADERS_SENT!
```

**The Solution:**
1. **Always Return Response Calls:** Standardize on returning the response call: `return res.end(...)`.
2. **Defensive Guarding:** If multiple asynchronous handlers interact with a response, check `if (!res.headersSent)` before attempting to send errors.

---

### 2. Predict the Output: Execution After `res.end()`
**Question:** What will the following HTTP handler log to the server console and send to the client? Explain why:

```js
// Node.js code
const http = require("node:http");

const server = http.createServer((req, res) => {
  console.log("1. Request received");
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello Client");
  console.log("2. After res.end()");
  res.write("More Data");
});
```

**Answer:**
**Client Output:**
Receives `200 OK` with body `"Hello Client"`.

**Server Console Output:**
```text
1. Request received
2. After res.end()
[Error [ERR_STREAM_WRITE_AFTER_END]: write after end]
```

**Reasoning:**
1. `res.end("Hello Client")` dispatches the response body and closes the outgoing Writable stream.
2. However, **`res.end()` does NOT halt JavaScript execution on the call stack**. Execution continues sequentially, printing `2. After res.end()`.
3. The next line attempts to call `res.write("More Data")` on a Writable stream that has already ended. Node throws a fatal `ERR_STREAM_WRITE_AFTER_END` exception because writing to an ended stream violates Node stream contracts.

---

### 3. How do you defend a Node.js HTTP server against Slowloris attacks?
**Question:** Explain what a Slowloris Denial-of-Service attack is and how it exploits Node's default event loop architecture. Which HTTP server timeout properties must be configured to defend against it?

**Answer:**
**The Slowloris Exploit:**
In a Slowloris attack, an attacker opens hundreds of TCP connections to a Node.js HTTP server and sends HTTP headers at an agonizingly slow rate (e.g., sending 1 header byte every 15 seconds: `X-Header: a\r\n...`).
Because Node's single-threaded event loop handles thousands of concurrent connections efficiently, it keeps these sockets open in the Poll phase. However, each open TCP connection consumes a file descriptor and memory. If the attacker opens enough slow sockets, the server reaches its maximum file descriptor limit (`EMFILE`) or memory threshold, preventing legitimate clients from connecting.

**Defenses in Node.js:**
Configure explicit server timeouts on `http.Server`:
1. **`server.headersTimeout` (e.g., set to 10–20 seconds):** Limits the maximum duration allowed between establishing a TCP socket and receiving the complete HTTP header block. If an attacker streams headers too slowly, Node abruptly destroys the socket with `408 Request Timeout`.
2. **`server.requestTimeout` (e.g., set to 30 seconds):** Limits the total time allowed for the complete request (headers and body) to arrive.
3. **`server.keepAliveTimeout` (e.g., set to 5 seconds):** Limits how long an idle keep-alive connection remains open waiting for the next request.
4. **Golden Rule:** Ensure `server.headersTimeout > server.keepAliveTimeout` so that keep-alive sockets have sufficient time to begin their next request without race conditions.

---

### 4. Architectural Tradeoff: Raw `node:http` vs. Express / Fastify Frameworks
**Question:** When architecting a high-performance backend, compare the architectural tradeoffs of writing an API using raw `node:http` versus using an abstraction framework like Express or Fastify.

**Answer:**

| Dimension | Raw `node:http` | Framework (Express / Fastify) |
| :--- | :--- | :--- |
| **Throughput / Overhead** | **Maximum possible throughput**; zero routing or middleware layer abstraction. | Small performance overhead due to routing regex and middleware chains. |
| **Routing Complexity** | Hand-rolled URL string matching (`if (req.url === '/users')`). Prone to bugs. | Declarative Radix Tree routing with params (`/users/:id`), query validation. |
| **Body Handling** | Must manually stream buffers, count bytes, and handle `JSON.parse` errors. | Out-of-the-box parsing middleware (`express.json()`, multipart). |
| **Code Maintainability** | High boilerplate; repetitive error handling and status code boilerplate. | Clean separation of concerns (Controllers, Middlewares, Error Handlers). |

**Decision Rule:**
- Use **Raw `node:http`** only for extremely simple, performance-critical micro-proxies, custom mock servers, or embedded IoT scripts where dependencies must be zero.
- Use **Express or Fastify** for standard production web applications, enterprise REST APIs, and microservices. The developer ergonomics, community plugins (authentication, validation, CORS), centralized error pipelines, and security protections vastly outweigh the negligible raw microbenchmark throughput difference.

---

<nav aria-label="Lecture navigation">

[← Previous: Streams and Backpressure](day-08-streams-and-backpressure.md) | [Roadmap](../node-roadmap.md) | [Next: Networking, DNS, TLS, and Timeouts](day-10-networking-dns-tls-and-timeouts.md)

</nav>