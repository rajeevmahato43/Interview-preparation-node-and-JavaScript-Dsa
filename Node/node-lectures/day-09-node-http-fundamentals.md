# Day 09: Node HTTP Fundamentals

<nav aria-label="Lecture navigation">

[Previous: Streams and Backpressure](day-08-streams-and-backpressure.md) | [Roadmap](../node-roadmap.md) | [Next: Networking, DNS, TLS, and Timeouts](day-10-networking-dns-tls-and-timeouts.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain the lifecycle of a Node HTTP request and response.
- Read method, URL, headers, and streamed body chunks safely.
- Complete responses exactly once with correct status and headers.
- Handle body limits, client aborts, timeouts, and streaming responses.
- Explain what Express adds on top of Node HTTP.

## Prerequisites

Read [Day 06: Buffers, Encodings, and Serialization](day-06-buffers-encodings-and-serialization.md), [Day 08: Streams and Backpressure](day-08-streams-and-backpressure.md), and JavaScript Day 19 on async cleanup.

## Core Concepts

`http.createServer()` receives an `IncomingMessage` request and a `ServerResponse` response. The request is a readable stream; the response is a writable stream.

```js
const http = require("node:http");

const server = http.createServer((request, response) => {
  response.writeHead(200, { "content-type": "text/plain" });
  response.end("ok\n");
});

server.listen(3000);
```

### Request data

- `request.method`: HTTP method.
- `request.url`: path and query text, not a validated route object.
- `request.headers`: normalized header names with untrusted values.
- `request` body: arrives in chunks and may be empty, partial, or aborted.

Parse URLs with `new URL(request.url, origin)` and enforce a body-size limit before parsing JSON.

### Response lifecycle

A response is not sent until `end()` or a stream pipeline completes. `writeHead()` sends status and headers; headers may also be inferred from the first body write. After `headersSent`, changing status or headers throws or has no intended effect.

Use one owner for response completion. Every branch must either finish the response, pass control to another owner, or destroy the connection.

### Keep-alive and timeouts

HTTP keep-alive reuses a TCP connection for multiple requests. It is separate from request processing time. Configure appropriate headers and server timeouts for the supported Node version and workload. A timeout should produce a clear failure path, not leave a promise waiting forever.

## Detailed Explanations and Traces

### Bounded JSON body

```js
function readJson(request, maximumBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let settled = false;

    function fail(error) {
      if (!settled) {
        settled = true;
        reject(error);
      }
    }

    request.on("data", (chunk) => {
      if (settled) return;
      total += chunk.length;
      if (total > maximumBytes) {
        fail(new Error("body too large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("aborted", () => fail(new Error("client aborted")));
    request.on("error", fail);
    request.on("end", () => {
      if (settled) return;
      settled = true;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });
  });
}
```

This is a teaching helper. Production code also checks content type, request timeout, invalid encoding, and safe error mapping.

### Status and method handling

Validate the method before doing work and return a status that describes the result:

| Situation | Typical status |
|---|---:|
| Successful read | 200 |
| Successful creation | 201 |
| No response body | 204 |
| Invalid input | 400 or 422, by contract |
| Unauthenticated | 401 |
| Forbidden | 403 |
| Missing resource | 404 |
| Conflict | 409 |
| Unexpected server failure | 500 |

Status codes are part of the API contract. Do not expose stack traces or internal paths in client responses.

### Streaming a response

```js
const { pipeline } = require("node:stream/promises");
const fs = require("node:fs");

async function sendReport(response) {
  response.writeHead(200, { "content-type": "application/pdf" });
  await pipeline(fs.createReadStream("./report.pdf"), response);
}
```

If the client disconnects, the pipeline can fail. Do not continue expensive generation after the request is gone unless the work is deliberately detached.

### Node HTTP versus Express

Express provides routing, middleware, parsing helpers, and response conveniences. It still runs on Node's request and response streams. Understanding the raw lifecycle explains body-parser limits, `next()`, `headersSent`, streaming behavior, and hanging requests.

## Node.js, JavaScript, and DSA Connections

- **JavaScript:** Async handlers must settle success or failure exactly once.
- **Node:** HTTP bodies and responses are streams.
- **DSA:** Body limits and bounded queues protect memory from input size $N$.

## Common Mistakes and Interview Traps

- Assuming the request body is available as one string.
- Parsing JSON before checking size.
- Calling `end()` twice or sending after headers were sent.
- Trusting `Host`, URL, or content-type values without validation.
- Forgetting client abort and request timeout paths.
- Buffering large downloads in memory.
- Treating keep-alive as a request timeout.
- Saying Express replaces Node HTTP fundamentals.

## Tricky Points

- `request.url` is not automatically decoded, routed, or validated.
- A client can disconnect after the server starts work.
- `204` responses must not contain a response body.
- A response can be writable while the client is no longer interested; monitor the stream lifecycle.
- Request and socket timeouts are different deadlines.

## Practical Exercise

**Goal:** Build a small raw Node HTTP API with `GET /health` and `POST /echo`.

**Inputs and outputs:** Return JSON, enforce a 1 KiB body limit, and return useful status codes.

**Constraints:** Handle malformed JSON, unsupported methods, client abort, and a slow request.

**Acceptance criteria:** No route hangs, oversized bodies are rejected, responses finish once, and tests cover status/header/body behavior.

## Summary

- Node HTTP requests and responses are streams.
- Bodies require limits, incremental collection, and abort handling.
- Headers must be set before the body commits the response.
- `end()` completes a response; ownership must be unambiguous.
- Express builds on these same Node primitives.

## Cheat Sheet

| Concern | Rule |
|---|---|
| Body | Stream and limit bytes |
| URL | Parse with `URL` |
| Headers | Set before `write`/`end` |
| Completion | Exactly one response owner |
| Large output | Stream with `pipeline` |
| Client disconnect | Abort or deliberately detach work |
| Timeout | Define a deadline and failure response |

## Interview Questions

1. **Definition:** How does a Node HTTP request move through the server?
   - **Expected answer:** Connection/request events, streamed headers/body, handler work, response headers, body writes, and completion or abort.
   - **Follow-up:** Where does Express fit?

2. **Trace [Hard]:** Why can a body parser receive several chunks for one JSON document?
   - **Expected answer:** HTTP transports bytes over a stream; packet and chunk boundaries do not equal application-message boundaries.
   - **Follow-up:** Why is `data` event count not a message count?

3. **Implementation:** Build a size-limited JSON endpoint.
   - **Expected answer:** Count bytes, handle end/error/abort once, parse after the limit, and map errors safely.
   - **Follow-up:** How would you stream a large upload instead?

4. **Debugging [Hard]:** A route occasionally throws `headers already sent`.
   - **Expected answer:** Find multiple response owners, missing `return` after sending, late async failures, and middleware that continues after completion.
   - **Follow-up:** How does `response.headersSent` help and what does it not solve?

5. **Design [Very Hard]:** Design a raw Node endpoint for a long-running export.
   - **Expected answer:** Define deadlines, disconnect behavior, streaming/backpressure, job detachment, status tracking, cancellation, and cleanup.
   - **Follow-up:** When should the export become an asynchronous job instead of an HTTP request?

<nav aria-label="Lecture navigation">

[Previous: Streams and Backpressure](day-08-streams-and-backpressure.md) | [Roadmap](../node-roadmap.md) | [Next: Networking, DNS, TLS, and Timeouts](day-10-networking-dns-tls-and-timeouts.md)

</nav>