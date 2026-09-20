# Day 08: Streams and Backpressure

<nav aria-label="Lecture navigation">

[Previous: Events, Timers, and Resource Ownership](day-07-events-timers-and-resource-ownership.md) | [Roadmap](../node-roadmap.md) | [Next: Node HTTP Fundamentals](day-09-node-http-fundamentals.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Distinguish readable, writable, duplex, and transform streams.
- Explain chunks, buffering, `highWaterMark`, and backpressure.
- Use `pipeline()` for error-aware stream composition.
- Handle slow consumers, aborts, and partial failures.
- Choose streaming over whole-input buffering when memory matters.

## Prerequisites

Read [Day 05: Files, Paths, URLs, and Safe I/O](day-05-files-paths-urls-and-safe-io.md), [Day 06: Buffers, Encodings, and Serialization](day-06-buffers-encodings-and-serialization.md), and JavaScript Day 14 on iterables and generators.

## Core Concepts

A stream moves data incrementally instead of requiring the whole value in memory:

| Type | Reads | Writes | Typical use |
|---|---:|---:|---|
| Readable | Yes | No | File or request body |
| Writable | No | Yes | File or response |
| Duplex | Yes | Yes | TCP socket |
| Transform | Yes | Yes | Compression or parsing |

A chunk is one piece of data. For binary streams it is usually a `Buffer`; object-mode streams may carry JavaScript values.

### Backpressure

Backpressure is the signal that downstream cannot accept data as quickly as upstream produces it. Without it, a fast producer can fill memory with queued chunks.

For a writable stream, `write(chunk)` returns:

- `true`: keep writing for now.
- `false`: pause the producer and wait for `drain`.

`highWaterMark` is a buffering threshold, not a hard global memory limit and not a guarantee that exactly that many bytes are stored.

### `pipe()` and `pipeline()`

`pipe()` connects streams and applies backpressure, but complex applications should prefer `pipeline()` from `node:stream/promises` because it propagates errors and completion across the chain:

```js
const { pipeline } = require("node:stream/promises");
const fs = require("node:fs");
const { createGzip } = require("node:zlib");

await pipeline(
  fs.createReadStream("input.log"),
  createGzip(),
  fs.createWriteStream("input.log.gz"),
);
```

The promise resolves only after the pipeline finishes and rejects when a stage fails.

## Detailed Explanations and Traces

### Manual backpressure

```js
function writeAll(readable, writable) {
  return new Promise((resolve, reject) => {
    function onData(chunk) {
      if (!writable.write(chunk)) {
        readable.pause();
        writable.once("drain", () => readable.resume());
      }
    }

    readable.on("data", onData);
    readable.once("end", () => {
      writable.end();
      resolve();
    });
    readable.once("error", reject);
    writable.once("error", reject);
  });
}
```

This demonstrates the signal, but it is incomplete for production because completion and error races need careful single-settlement handling. Prefer `pipeline()` unless manual control is necessary.

### Async iteration

Readable streams can be consumed with `for await...of`:

```js
for await (const chunk of readable) {
  await processChunk(chunk);
}
```

The `await` naturally limits the consumer to its processing rate. It does not make `processChunk` parallel; use bounded concurrency if parallel processing is safe.

### Memory comparison

For input size $N$:

- Whole-input buffering usually needs $O(N)$ input memory plus parsing/output objects.
- A correctly backpressured byte pipeline aims for bounded in-flight data, approximately $O(B)$ where $B$ is the configured buffering and transform state.

Streaming reduces memory pressure; it does not remove disk, CPU, network, or malicious-input limits.

### Cancellation and failure

A pipeline can fail because the source, transform, destination, client connection, or abort signal fails. Decide whether the destination should be deleted after partial output. For uploads, write to a temporary path and rename only after successful completion.

## Node.js, JavaScript, and DSA Connections

- **JavaScript:** Async iteration provides sequential consumption with explicit `await` points.
- **Node:** Streams connect operating-system I/O to application processing.
- **DSA:** Backpressure is bounded-queue control; throughput without a capacity limit becomes memory growth.

## Common Mistakes and Interview Traps

- Ignoring the boolean result of `write()`.
- Assuming `highWaterMark` caps total process memory.
- Using `readFile()` for unbounded uploads or downloads.
- Handling only `end` and forgetting `error` or client abort.
- Resolving a pipeline when the source ends instead of when the destination finishes.
- Calling `Buffer.concat()` repeatedly in a loop.
- Running unlimited parallel chunk processing.

## Tricky Points

- A readable stream can pause, but already queued chunks still consume memory.
- `finish`, `end`, `close`, and `error` mean different things; use the API contract for the specific stream.
- Destroying one stream may cause other stages to fail; cleanup must be idempotent.
- Compression changes throughput and CPU cost; it is not free memory reduction.

## Practical Exercise

**Goal:** Stream a large file through gzip into a destination.

**Inputs and outputs:** Use a source file, transform, and destination; report bytes and duration.

**Constraints:** Use `pipeline()`, no whole-file buffer, and an abort signal.

**Acceptance criteria:** The destination is removed after failure, memory does not grow with file size, and a slow destination does not cause unbounded writes.

## Summary

- Streams process chunks and can keep memory bounded.
- Backpressure is the producer/consumer speed-control mechanism.
- `write(false)` means wait for `drain`.
- `pipeline()` is the default composition tool for error and completion handling.
- Stream completion, failure, abort, and partial output need separate policies.

## Cheat Sheet

| Question | Answer |
|---|---|
| Large file? | Stream it |
| `write()` returns false? | Stop writing; wait for `drain` |
| Multiple stream stages? | Use `pipeline()` |
| Upload fails halfway? | Abort and remove temporary output |
| Need parallel processing? | Bound concurrency and preserve ordering if required |
| Memory guarantee? | `highWaterMark` is a threshold, not a process-wide cap |

## Interview Questions

1. **Definition:** What is backpressure?
   - **Expected answer:** A downstream capacity signal that prevents a producer from creating unbounded buffered work.
   - **Follow-up:** What does `write(false)` require the producer to do?

2. **Trace [Hard]:** Explain the lifecycle of a file-to-gzip-to-file pipeline.
   - **Expected answer:** Source emits chunks, transform processes them, destination applies backpressure, and completion waits for the destination.
   - **Follow-up:** What happens if gzip or the destination fails?

3. **Implementation:** Stream an upload with a byte limit.
   - **Expected answer:** Count bytes, abort over-limit input, clean temporary output, and use `pipeline()`.
   - **Follow-up:** How do you avoid trusting the filename?

4. **Debugging [Hard]:** Memory grows while downloading a large report.
   - **Expected answer:** Look for whole-body buffering, ignored `write()` results, repeated concatenation, slow consumers, and missing cleanup.
   - **Follow-up:** Which metrics would prove backpressure is working?

5. **Design [Very Hard]:** Design a multi-stage stream processor with retries.
   - **Expected answer:** Define replayability, partial-output cleanup, bounded queues, idempotency, cancellation, ordering, and failure ownership.
   - **Follow-up:** When is a durable external queue better than an in-process stream?

<nav aria-label="Lecture navigation">

[Previous: Events, Timers, and Resource Ownership](day-07-events-timers-and-resource-ownership.md) | [Roadmap](../node-roadmap.md) | [Next: Node HTTP Fundamentals](day-09-node-http-fundamentals.md)

</nav>