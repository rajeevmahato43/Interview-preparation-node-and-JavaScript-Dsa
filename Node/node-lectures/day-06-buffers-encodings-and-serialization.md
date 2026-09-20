# Day 06: Buffers, Encodings, and Serialization

<nav aria-label="Lecture navigation">

[Previous: Files, Paths, URLs, and Safe I/O](day-05-files-paths-urls-and-safe-io.md) | [Roadmap](../node-roadmap.md) | [Next: Events, Timers, and Resource Ownership](day-07-events-timers-and-resource-ownership.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain the difference between bytes, characters, and encoded text.
- Use `Buffer` for binary data and understand its memory cost.
- Recognize UTF-8 boundaries that split across chunks.
- Explain why JSON parsing must be bounded at an input boundary.
- Choose safe representations for network and file data.

## Prerequisites

Read [Day 05: Files, Paths, URLs, and Safe I/O](day-05-files-paths-urls-and-safe-io.md), JavaScript Day 03 on values and types, and JavaScript Day 12 on built-in data structures and serialization.

This lecture uses Node.js `Buffer` and `StringDecoder`. It does not claim that every external protocol uses UTF-8; the protocol or file format must define its encoding.

## Core Concepts

### 1. Bytes and characters are different

A byte is a unit of binary data. A character is a human-readable symbol. Encodings map characters to bytes. UTF-8 uses one or more bytes for a character, so the number of bytes is not always the number of characters.

```js
const text = "cafÃƒÆ’Ã‚Â©";
const bytes = Buffer.from(text, "utf8");

console.log(text.length); // 4 JavaScript UTF-16 code units
console.log(bytes.length); // 5 UTF-8 bytes
```

The word contains an accented character that uses two UTF-8 bytes.

### 2. `Buffer`

A `Buffer` is a Node.js object for bytes. Buffers are used by files, sockets, and streams. Converting untrusted large input into a string or parsed object can increase memory use, so boundaries should impose limits.

### 3. Chunk boundaries can split characters

A stream may split a multi-byte UTF-8 character between chunks. Calling `chunk.toString("utf8")` separately on each chunk can produce replacement characters. `StringDecoder` keeps incomplete bytes until the next chunk.

### 4. JSON is text with limits

`JSON.parse()` converts a complete string into JavaScript data. It does not enforce a size limit or protect against deeply expensive input by itself. Read or stream the body with a maximum size before parsing.

### 5. Serialization loses information

JSON cannot represent every JavaScript value directly. `undefined`, functions, symbols, cyclic references, and some special numeric values need deliberate handling. Dates become strings through normal JSON serialization.

### 6. Buffer allocation and memory ownership

`Buffer.from(text)` allocates storage for the encoded bytes. `Buffer.concat(chunks)` allocates a new buffer and copies every chunk, so repeatedly concatenating in a loop can create avoidable $O(n^2)$ copying work. Collect bounded chunks and concatenate once, or stream the data to its destination.

Prefer `Buffer.alloc(size)` when the buffer will contain sensitive or externally visible data because it initializes the memory. `Buffer.allocUnsafe(size)` can be faster for carefully controlled internal use, but every byte must be written before the buffer is read or returned. Never let an untrusted size flow directly into allocation without a maximum.

Base64 is an encoding, not encryption or compression. It commonly increases size by roughly one third, before protocol overhead. Use it only when a text-safe representation is required, and enforce limits on both decoded and encoded forms.

### 7. Streaming text safely

`StringDecoder` preserves an incomplete multi-byte sequence between writes. It does not validate the business meaning of the text, and it does not turn arbitrary bytes into trusted input. The protocol must define the expected encoding, and invalid sequences should be handled according to that protocol rather than silently normalized.

For newline-delimited data, maintain a small text remainder between chunks. A line can be split across chunks, just as a UTF-8 character can. For very large JSON documents, collecting the entire string before parsing is still a memory risk; use a streaming format or a parser designed for bounded incremental processing when the contract permits it.

### 8. JSON boundaries need a complete contract

A safe JSON boundary specifies:

1. Maximum body bytes before parsing.
2. Accepted content type and character encoding.
3. Empty-body behavior.
4. Maximum structural complexity or a parser/resource budget where supported.
5. Duplicate-key policy if duplicate keys affect correctness.
6. Output serialization rules for dates, large integers, and undefined values.
7. Safe error mapping that does not expose parser internals.

`JSON.parse()` accepts a string and builds an object graph. It does not know the application's schema, authorization rules, or memory budget. Parsing and validation are separate steps.

## Detailed Explanations and Traces

### UTF-8 decoding across chunks

This is a **Node.js example**:

```js
const { StringDecoder } = require("node:string_decoder");

const decoder = new StringDecoder("utf8");
const bytes = Buffer.from("ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬", "utf8");

console.log(decoder.write(bytes.subarray(0, 1))); // ""
console.log(decoder.write(bytes.subarray(1))); // "ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬"
console.log(decoder.end()); // ""
```

The first byte is incomplete, so the decoder waits. A decoder is useful when text arrives in arbitrary chunks.

### Bounded JSON body shape

This is a **Node.js HTTP helper example**:

```js
function collectBody(request, maximumBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;

    request.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > maximumBytes) {
        reject(new Error("Request body is too large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
    request.on("aborted", () => reject(new Error("Request was aborted")));
  });
}
```

A production helper also needs to prevent multiple settlement paths and should coordinate destruction, cleanup, and response behavior. The important design is the byte limit before parsing.

A single-settlement version can reject immediately and ignore later terminal events:

```js
function collectBodyOnce(request, maximumBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    let settled = false;

    function fail(error) {
      if (!settled) {
        settled = true;
        reject(error);
      }
    }

    request.on("data", (chunk) => {
      if (settled) {
        return;
      }
      totalBytes += chunk.length;
      if (totalBytes > maximumBytes) {
        fail(new Error("Request body is too large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on("end", () => {
      if (!settled) {
        settled = true;
        resolve(Buffer.concat(chunks).toString("utf8"));
      }
    });
    request.on("error", fail);
    request.on("aborted", () => fail(new Error("Request was aborted")));
  });
}
```

This helper demonstrates a control-flow property, not a complete production body parser. It should be paired with content-type checks, request timeouts, invalid-encoding policy, and a framework or server contract that knows the request was destroyed.

### Serialization trace

```js
const value = {
  name: "Asha",
  missing: undefined,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

console.log(JSON.stringify(value));
// {"name":"Asha","createdAt":"2026-01-01T00:00:00.000Z"}
```

The `missing` property is omitted. The date becomes an ISO string. A database or API contract must define whether that representation is acceptable.

Large integers require special care:

```js
const original = 9_007_199_254_740_993n;
const json = JSON.stringify({ value: original }, (_, currentValue) =>
  typeof currentValue === "bigint" ? currentValue.toString() : currentValue,
);

console.log(json); // {"value":"9007199254740993"}
```

The value is now a string at the wire boundary. That is often safer than silently rounding a number, but the consumer must agree with the contract. JSON serialization is an API design decision, not merely a call to `JSON.stringify()`.

## Node.js, JavaScript, and DSA Connections

- **Node connection:** Buffers are the natural type for file and socket chunks.
- **JavaScript connection:** Strings use JavaScript string semantics; encoding converts them to bytes for external boundaries.
- **DSA connection:** A bounded accumulator stores at most a known amount of data. Without a bound, input size becomes a memory risk.

## Common Mistakes and Interview Traps

- Treating `string.length` as the UTF-8 byte length.
- Converting every incoming chunk to a string independently.
- Parsing JSON before applying a body-size limit.
- Using base64 as if it reduced data size; it normally increases size.
- Assuming JSON preserves `undefined`, dates, functions, or object identity.
- Creating a buffer from untrusted size input without a maximum.
- Confusing `Buffer` byte length with character count.

## Tricky Points

- UTF-8 characters can span chunks.
- `Buffer.alloc()` initializes memory; `Buffer.allocUnsafe()` requires immediate careful initialization before exposure.
- A valid UTF-8 byte sequence can still contain unexpected or dangerous application data.
- Parsing a small byte body can still create a much larger object graph.

## Practical Exercise

**Goal:** Build a bounded JSON body collector.

**Inputs and outputs:** Receive byte chunks, reject bodies over a configured maximum, decode UTF-8 safely, and parse valid JSON.

**Constraints:** Test with multi-byte text split across chunks. Do not expose the raw parser error directly to a client.

**Edge cases:** Empty body, invalid UTF-8, invalid JSON, body exactly at the limit, body one byte over, aborted request, and repeated error events.

**Acceptance criteria:**

- The limit is measured in bytes.
- Multi-byte text is decoded correctly across chunks.
- Oversized input is rejected before unbounded allocation.
- Parsing errors become a safe application error.
- Abort and cleanup behavior is tested.

## Summary

- Bytes and characters are different representations.
- `Buffer` stores bytes used by Node file and network APIs.
- UTF-8 characters can be split across stream chunks.
- `StringDecoder` handles incomplete character sequences.
- JSON input needs a byte limit before parsing.
- Serialization rules can remove or transform JavaScript values.

## Cheat Sheet

| Need | Use |
|---|---|
| Binary data | `Buffer` |
| UTF-8 across chunks | `StringDecoder` |
| Byte count | `buffer.length` |
| Character count | String rules, not buffer length |
| JSON safety | Limit bytes, then parse |
| Base64 | Transport representation, not compression |

## Interview Questions

1. **Definition:** Why can a string's character count differ from its UTF-8 byte count?
   - **Expected answer:** UTF-8 uses variable-width encoding, so some characters require multiple bytes.
   - **Follow-up:** Which count should a network body limit use?

2. **Trace:** Why does the first `decoder.write()` call return an empty string for the euro sign?
   - **Expected answer:** The first byte is an incomplete UTF-8 sequence, so the decoder waits for the remaining bytes.
   - **Follow-up:** What can go wrong with independent `chunk.toString()` calls?

3. **Implementation:** Implement a maximum-size JSON body parser for a Node request.
   - **Expected answer:** Count bytes, reject over the limit, handle abort/error/end, decode correctly, parse after collection, and settle once.
   - **Follow-up:** How would a streaming parser change memory behavior?

4. **Debugging [Hard]:** An API sometimes stores replacement characters in names. What do you inspect?
   - **Expected answer:** Encoding declarations, chunk decoding, buffer boundaries, `StringDecoder` use, database/client encoding, and round-trip tests.
   - **Follow-up:** How do you distinguish bad input from a decoding bug?

5. **Design [Hard]:** Design a file-upload boundary for a Node service.
   - **Expected answer:** Enforce byte limits, content type and signature checks, streaming, temporary-file cleanup, safe names, cancellation, and storage ownership.
   - **Follow-up:** What changes when uploads are several gigabytes?

<nav aria-label="Lecture navigation">

[Previous: Files, Paths, URLs, and Safe I/O](day-05-files-paths-urls-and-safe-io.md) | [Roadmap](../node-roadmap.md) | [Next: Events, Timers, and Resource Ownership](day-07-events-timers-and-resource-ownership.md)

</nav>