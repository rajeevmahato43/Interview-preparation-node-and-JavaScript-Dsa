# Day 06: Buffers, Encodings, and Serialization

<nav aria-label="Lecture navigation">

[← Previous: Files, Paths, URLs, and Safe I/O](day-05-files-paths-urls-and-safe-io.md) | [Roadmap](../node-roadmap.md) | [Next: Events, Timers, and Resource Ownership](day-07-events-timers-and-resource-ownership.md)

</nav>

---

## What You Will Learn Today

By the end of this lecture, you should be able to:

- Explain what binary data is in Node.js and how the `Buffer` class allocates memory outside the V8 garbage-collected heap.
- Contrast `Buffer.alloc()` against `Buffer.allocUnsafe()` and prevent sensitive memory leaks.
- Understand Node's internal 8KB buffer pool (`Buffer.poolSize`) and explain how slicing vs. copying affects memory retention.
- Differentiate between character counts (`string.length`) and byte lengths (`Buffer.byteLength()`) across variable-width encodings like UTF-8.
- Resolve multi-byte character corruption across streaming chunk boundaries using `node:string_decoder`.
- Encode and decode data safely across binary, hexadecimal, and Base64 representations without introducing memory blowup.
- Defend JSON input boundaries against payload bomb attacks, unhandled `BigInt` crashes, and object prototype corruption.

---

## Prerequisites

Before studying this lecture, you should be comfortable with:
- **Node.js Runtime & Architecture:** V8 memory allocation vs. native C++ libuv memory ([Day 01: Node.js Runtime and Architecture](day-01-node-runtime-and-architecture.md)).
- **Event Loop & Scheduling:** Asynchronous chunk processing and memory pressure ([Day 02: Event Loop and Scheduling](day-02-event-loop-and-scheduling.md)).
- **Files, Paths, & Safe I/O:** Reading and streaming file descriptors ([Day 05: Files, Paths, URLs, and Safe I/O](day-05-files-paths-urls-and-safe-io.md)).

*Upcoming Connections:*
- [Day 07: Events, Timers, and Resource Ownership](day-07-events-timers-and-resource-ownership.md) explores `EventEmitter` data events and buffer emission patterns.
- [Day 08: Streams and Backpressure](day-08-streams-and-backpressure.md) covers stream chunk buffers, `highWaterMark`, and objectMode vs. buffer mode.

---

## Quick Vocabulary Card

| Term | Definition |
| :--- | :--- |
| **`Buffer`** | A global Node.js class representing a fixed-length sequence of raw binary bytes allocated outside V8's heap in native memory. |
| **`Buffer.alloc(size)`** | Allocates a zero-initialized buffer of the specified size, ensuring no old memory remnants are exposed. |
| **`Buffer.allocUnsafe(size)`** | Allocates an uninitialized buffer from the internal memory pool; fast, but contains un-cleared memory that may leak secrets. |
| **`Buffer.poolSize`** | The default size (8,192 bytes / 8KB) of Node's pre-allocated internal memory slab used to fast-allocate small buffers. |
| **`Buffer.subarray()`** | Returns a new Buffer that references the exact same memory slice as the original buffer without copying bytes. |
| **Encoding** | A bidirectional mapping between human-readable characters and machine-readable binary bytes (e.g., UTF-8, ASCII, Base64). |
| **`StringDecoder`** | A utility from `node:string_decoder` that preserves incomplete multi-byte UTF-8 sequences across stream chunks. |
| **Replacement Character (``)** | Unicode `U+FFFD`, emitted when an invalid or incomplete byte sequence is incorrectly decoded as UTF-8. |
| **Base64** | A binary-to-text encoding scheme that translates 3 binary bytes into 4 ASCII characters, incurring a ~33% size overhead. |
| **JSON Payload Bomb** | A Denial-of-Service attack where a client sends a massive or deeply nested JSON payload to exhaust server memory and CPU. |

---

## 1. What is a Buffer? Native Memory Allocation

A **Buffer** is a global Node.js object that represents a fixed-length chunk of raw binary data allocated directly in operating system memory outside V8's JavaScript heap.

JavaScript engines were originally designed for web browsers where code interacted strictly with text and DOM strings. Node.js, however, interacts directly with TCP streams, encrypted TLS sockets, and disk storage—all of which operate purely on raw streams of binary octets (bytes).

```text
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│        V8 JavaScript Heap       │       │    Native C++ Memory (libuv)    │
│  - Objects, Arrays, Numbers     │       │  - Network packet buffers       │
│  - Subject to V8 Garbage Col.   │       │  - Disk block buffers           │
│  - Fast allocation, size limits │       │  - Node.js Buffer instances     │
└─────────────────────────────────┘       └─────────────────────────────────┘
```

Because Buffers reside in native memory:
- They do not count toward V8's default `--max-old-space-size` memory limits (though V8 tracks their external memory footprint for GC triggering).
- Memory size cannot be resized after allocation; once a Buffer is created with length 1024, its capacity is strictly 1024 bytes forever.

### Real-World Analogy: The Warehouse Shipping Crates and Packing Peanuts

Imagine a shipping depot:
- **JavaScript Strings & Objects** are like items packed in fragile gift boxes wrapped in tissue paper (**V8 Heap**). The manager must periodically inspect, reorganize, and recycle the tissue paper (**Garbage Collection**).
- **Node.js Buffers** are standardized wooden shipping pallets stacked directly in the raw cargo bay (**Native Memory**).
- If you request a pallet that has been wiped clean (**`Buffer.alloc`**), it arrives empty and safe.
- If you grab an un-cleared pallet left behind by a previous shipment (**`Buffer.allocUnsafe`**), you might find leftover documents or confidential records from the last customer (**Memory Leak Vulnerability**).

```js
// Node.js code
// Demonstrating Buffer creation and inspection

// 1. Create a buffer from an ASCII string
const buf = Buffer.from("Node.js");

console.log("Buffer representation:", buf);
// Logs: <Buffer 4e 6f 64 65 2e 6a 73> (Hexadecimal byte representation)

console.log("Byte length:", buf.length); // 7 bytes
console.log("First byte (ASCII 'N' = 78):", buf[0]); // 78

// ❌ Anti-pattern: Buffers cannot change size after allocation
buf[10] = 99; // Silently ignored or out-of-bounds; does NOT expand the buffer!
console.log("Length remains:", buf.length); // Still 7
```

---

## 2. Allocation Strategies: `Buffer.alloc()` vs. `Buffer.allocUnsafe()`

Node provides two primary methods for allocating fresh memory: `Buffer.alloc()` and `Buffer.allocUnsafe()`.

### 2.1 The Security Hazard of `Buffer.allocUnsafe()`

When you call `Buffer.alloc(100)`, Node allocates 100 bytes and immediately overwrites every single byte with zeroes (`0x00`).

When you call `Buffer.allocUnsafe(100)`, Node skips zero-initialization for speed. It returns a slice of memory that **contains whatever data was previously stored at that RAM address**—which may include database passwords, API tokens, TLS keys, or user sessions!

If an endpoint allocates an unsafe buffer and sends it over the network before writing over every single byte, it exposes a **Severe Information Disclosure Vulnerability**.

```js
// Node.js code
// Demonstrating Buffer.alloc vs Buffer.allocUnsafe

// ✅ Safe: Always zero-filled (clean memory)
const safeBuf = Buffer.alloc(10);
console.log("Safe Buffer:", safeBuf);
// Output: <Buffer 00 00 00 00 00 00 00 00 00 00>

// ❌ Risky: Contains uninitialized dirty memory!
const unsafeBuf = Buffer.allocUnsafe(10);
console.log("Unsafe Buffer (May contain residual secrets!):", unsafeBuf);
// Output: <Buffer 68 74 74 70 5f 73 65 63 72 65> (Old RAM remnants!)

// ✅ If you MUST use allocUnsafe for performance, overwrite it immediately:
unsafeBuf.fill(0); // Zero it out manually before any exposure
```

### 2.2 The 8KB Buffer Pool (`Buffer.poolSize`)

For allocations smaller than half of `Buffer.poolSize` (`8192 / 2 = 4096 bytes`), Node slices small allocations from a single pre-allocated 8KB slab of native memory. This avoids the overhead of making constant `malloc()` system calls for tiny 20-byte buffers.

---

## 3. Buffer Slicing vs. Copying (Memory Retention Traps)

In JavaScript arrays, `.slice()` creates a shallow copy of the data. **In Node.js Buffers, `.subarray()` and legacy `.slice()` do NOT copy data; they return a window over the exact same underlying memory!**

### 3.1 The Memory Leak Trap of Shared Slabs

If you read a 100MB file and extract a 10-byte transaction ID using `.subarray()`, the small 10-byte buffer holds a reference to the **entire 100MB native memory allocation**! The 100MB slab cannot be garbage collected as long as your application retains the 10-byte slice.

```js
// Node.js code
// Demonstrating Buffer subarray vs copy

const largeBuffer = Buffer.alloc(100 * 1024 * 1024); // 100 MB buffer
largeBuffer.write("TRANSACTION_ID_9999", 0);

// ❌ Anti-pattern: subarray shares the memory! Retains the entire 100MB in RAM!
const idSlice = largeBuffer.subarray(0, 19);

// ✅ Solution: Explicitly copy small slices into an independent Buffer
const independentId = Buffer.alloc(19);
idSlice.copy(independentId); 
// Or: const independentId = Buffer.from(idSlice);

// Now largeBuffer can be safely garbage collected when out of scope!
```

### Summary Comparison: `subarray()` vs. `copy()`

| Feature | `buffer.subarray(start, end)` | `Buffer.from(slice)` or `.copy()` |
| :--- | :--- | :--- |
| **Memory Allocation** | Zero new allocation; shares existing pointer | Allocates brand new native memory |
| **Mutation Effect** | Mutating slice **mutates the original** buffer | Mutations are completely isolated |
| **Performance** | Extremely fast ($O(1)$) | Slower ($O(n)$ byte copy) |
| **GC Retention** | Retains entire parent slab in memory | Allows parent slab to be freed |

---

## 4. Characters vs. Bytes: Variable-Width Encodings

A **character** is an abstract human symbol (e.g., `'A'`, `'€'`, `'🚀'`), whereas a **byte** is an 8-bit number (0–255). An **encoding** defines how characters are mapped to bytes.

### 4.1 The Length Fallacy: `string.length` vs. `Buffer.byteLength()`

JavaScript strings are encoded internally in UTF-16 code units. `string.length` counts UTF-16 code units, **NOT** the number of bytes on disk or wire!

- ASCII characters (`A-Z`): 1 byte in UTF-8.
- Latin accented characters (`é`, `ñ`): 2 bytes in UTF-8.
- Symbols and Asian characters (`€`, `文`): 3 bytes in UTF-8.
- Emojis (`🚀`, `🔥`): 4 bytes in UTF-8 (and 2 UTF-16 code units!).

```js
// Node.js code
// Demonstrating Character Count vs. Byte Length

const emoji = "🚀";

console.log("JavaScript string.length:", emoji.length); 
// Output: 2 (UTF-16 surrogate pairs count as 2!)

console.log("UTF-8 Buffer.byteLength:", Buffer.byteLength(emoji, "utf8")); 
// Output: 4 (Consumes 4 bytes in memory, network, and disk!)

// ❌ Critical Trap in HTTP Headers:
// res.setHeader("Content-Length", text.length); // WRONG! Corrupts response if text has emojis!
// ✅ Correct:
// res.setHeader("Content-Length", Buffer.byteLength(text, "utf8"));
```

---

## 5. Chunk Boundaries & Multi-Byte Split Corruption

When streaming UTF-8 data over a network or reading chunks from disk, the stream splits raw bytes at arbitrary buffer boundaries.

### 5.1 The Corruption Bug: Splitting Multi-Byte Characters

The Euro symbol (`€`) is encoded in UTF-8 as 3 distinct bytes: `[0xE2, 0x82, 0xAC]`.

If a network packet boundary splits between byte 1 and byte 2:
- Chunk 1 receives: `[0xE2]`
- Chunk 2 receives: `[0x82, 0xAC]`

If you call `chunk.toString('utf8')` on each chunk independently:
- Chunk 1 cannot decode `[0xE2]` and emits the Unicode Replacement Character: **``**.
- Chunk 2 cannot decode without the leading byte and emits: **``**.
- The original character is permanently destroyed!

### 5.2 The Solution: `node:string_decoder`

Node provides **`StringDecoder`** in the core `node:string_decoder` module. It maintains an internal buffer of incomplete multi-byte sequences, holding back trailing bytes until the subsequent chunk arrives.

```js
// Node.js code
// Demonstrating Multi-Byte Chunk Splitting with and without StringDecoder

const { StringDecoder } = require("node:string_decoder");

const euroBytes = Buffer.from("€", "utf8"); // 3 bytes: <Buffer e2 82 ac>
const chunk1 = euroBytes.subarray(0, 1);     // <Buffer e2>
const chunk2 = euroBytes.subarray(1);        // <Buffer 82 ac>

// ❌ Flawed: Naive toString() destroys character boundaries
console.log("Naive decoding:");
console.log("Chunk 1:", chunk1.toString("utf8")); // Logs: ""
console.log("Chunk 2:", chunk2.toString("utf8")); // Logs: ""

// ✅ Correct: StringDecoder buffers partial bytes seamlessly
console.log("\nSafe StringDecoder decoding:");
const decoder = new StringDecoder("utf8");

console.log("Decoder Chunk 1:", decoder.write(chunk1)); // Logs: "" (Waits for rest!)
console.log("Decoder Chunk 2:", decoder.write(chunk2)); // Logs: "€" (Complete!)
console.log("Decoder Final flush:", decoder.end());    // Logs: ""
```

---

## 6. Binary Encodings: Hexadecimal & Base64

Node supports several native encodings out of the box:

| Encoding | Bits/Char | Description | Overhead |
| :--- | :--- | :--- | :--- |
| **`utf8`** | Variable (8–32) | Standard Unicode character encoding | None for ASCII, up to 4x for emojis |
| **`hex`** | 4 bits | Encodes each byte as two hexadecimal characters (`0-9`, `a-f`) | **+100%** (2x byte size) |
| **`base64`** | 6 bits | Encodes binary into 64 ASCII characters | **+33.3%** ($\frac{4}{3}$ byte size) |
| **`base64url`** | 6 bits | URL-safe Base64 replacing `+` with `-` and `/` with `_` | **+33.3%** |

```js
// Node.js code
// Demonstrating Hex and Base64 Encoding Transformations

const secretBuffer = Buffer.from("SuperSecretKey123");

// 1. Hex encoding (Common in cryptographic hashes)
const hexString = secretBuffer.toString("hex");
console.log("Hex:", hexString); // "53757065725365637265744b6579313233"

// 2. Base64 encoding (Common in HTTP Authorization headers & JWTs)
const base64String = secretBuffer.toString("base64");
console.log("Base64:", base64String); // "U3VwZXJTZWNyZXRLZXkxMjM="

// 3. Decoding back to original Buffer
const restoredBuffer = Buffer.from(base64String, "base64");
console.log("Decoded:", restoredBuffer.toString("utf8")); // "SuperSecretKey123"
```

---

## 7. JSON Boundaries: Traps, Serialization, and Payload Bombs

**`JSON.parse()`** is synchronous and computationally expensive on large payloads. At an application boundary, untrusted JSON input presents multiple security and availability vulnerabilities.

### 7.1 Information Loss in JSON Serialization

JSON cannot serialize all JavaScript data types natively:
- **`undefined` and Functions:** Dropped completely from objects; converted to `null` in arrays.
- **`Date` objects:** Serialized to ISO-8601 strings (`"2026-01-01T..."`), but deserialized as plain strings, NOT Date instances!
- **`BigInt`:** Throws a fatal `TypeError: Do not know how to serialize a BigInt`!
- **`NaN` and `Infinity`:** Coerced to `null`.
- **Circular References:** Throws a fatal `TypeError: Converting circular structure to JSON`.

```js
// Node.js code
// Demonstrating JSON Serialization Traps

const state = {
  active: true,
  missing: undefined,                               // Dropped!
  createdAt: new Date("2026-01-01T00:00:00.000Z"),  // Serialized as string!
  largeId: 9007199254740995n,                       // BigInt crash!
};

// ❌ Crashing without custom replacer:
try {
  JSON.stringify(state);
} catch (err) {
  console.log("❌ BigInt Crash:", err.message);
}

// ✅ Correct: Custom BigInt replacer function
const safeJson = JSON.stringify(state, (key, value) => {
  if (typeof value === "bigint") return value.toString();
  return value;
});
console.log("Safe JSON:", safeJson);
```

### 7.2 Bounded Body Ingestion (Defending Against JSON Bombs)

Never call `JSON.parse()` on unbounded streams. An attacker can stream a 500MB JSON payload to freeze the event loop and trigger Out-Of-Memory crashes.

Enforce a strict byte limit **during ingestion**:

```js
// Node.js code
// Production Bounded Body Collector

function collectBoundedJson(req, maxBytes = 1024 * 1024) { // Default 1 MB limit
  return new Promise((resolve, reject) => {
    const chunks = [];
    let receivedBytes = 0;
    let settled = false;

    function fail(err) {
      if (!settled) {
        settled = true;
        req.destroy(); // Terminate incoming connection
        reject(err);
      }
    }

    req.on("data", (chunk) => {
      if (settled) return;

      receivedBytes += chunk.length;
      if (receivedBytes > maxBytes) {
        const err = new Error(`Payload Too Large: Exceeded ${maxBytes} bytes`);
        err.statusCode = 413;
        fail(err);
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (settled) return;
      settled = true;

      try {
        const rawString = Buffer.concat(chunks).toString("utf8");
        const parsed = JSON.parse(rawString);
        resolve(parsed);
      } catch (err) {
        const parseErr = new Error("Malformed JSON Body");
        parseErr.statusCode = 400;
        reject(parseErr);
      }
    });

    req.on("error", fail);
  });
}
```

---

## 8. JavaScript, Node.js, and DSA Connections

- **JavaScript Language Connection:** ECMAScript specifies `ArrayBuffer`, `Uint8Array`, and strings. In Node.js, `Buffer` is an augmented subclass of `Uint8Array` that adds Node-specific conveniences (`.toString('hex')`, `.write()`, `.copy()`).
- **Node.js Platform Connection:** Buffers interface with native C++ abstractions. Node delegates disk and socket data directly into Buffer memory addresses, bypassing V8 object translation overhead.
- **DSA Connection:**
  - **Memory Slab Allocation:** Node's internal 8KB buffer pool acts as a slab allocator ($O(1)$ sub-allocation), reducing kernel system call frequency.
  - **StringDecoder Finite State Machine:** `StringDecoder` implements a multi-byte UTF-8 state machine that analyzes the leading bits of each byte (`110xxxxx` for 2-byte, `1110xxxx` for 3-byte, `11110xxx` for 4-byte) to determine how many trailing continuation bytes (`10xxxxxx`) must be buffered.

---

## Tricky Points

### 1. `Buffer.byteLength()` is Required for HTTP `Content-Length`
Setting `res.setHeader("Content-Length", body.length)` when `body` is a string will corrupt your HTTP response if the string contains multi-byte characters like emojis or Chinese text. Always use `Buffer.byteLength(body, 'utf8')`.

### 2. Modifying a Buffer Slice Mutates the Original
Unlike JavaScript arrays where `.slice()` clones elements, `buf.subarray()` returns an alias over the original memory. Mutating a slice corrupts the parent buffer in place!

### 3. Base64 Expands Payload Size by ~33%
Never store large files or images in databases as Base64 strings unless strictly required by text-only transport protocols. Base64 encoding inflates a 100MB file into 133MB of ASCII text.

### 4. `Buffer.allocUnsafe()` Can Leak Old TLS Keys
Never expose an uninitialized buffer directly over the wire or to external APIs. Always use `Buffer.alloc()` or overwrite every byte before sending.

---

## Hands-On Exercise

### Scenario: Fixing Multi-Byte UTF-8 Corruption in a Log Ingestion Stream
Your team maintains an HTTP log ingestion service that accepts streaming NDJSON logs from microservices worldwide. Customers complain that log messages containing non-English names (e.g., `José`, ` Müller`, `佐藤`) and emojis are periodically stored in Elasticsearch with corrupt replacement characters (``).

### Buggy Code

```js
// Node.js code
// BUGGY: Naive chunk-to-string conversion corrupts multi-byte UTF-8 characters

const http = require("node:http");

const server = http.createServer((req, res) => {
  if (req.url === "/ingest" && req.method === "POST") {
    let rawText = "";

    // ❌ BUG: Converting each chunk independently splits multi-byte UTF-8 characters!
    req.on("data", (chunk) => {
      rawText += chunk.toString("utf8"); // Corrupts characters split across chunk boundaries!
    });

    req.on("end", () => {
      console.log("Received Logs:", rawText);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "SAVED" }));
    });
  } else {
    res.writeHead(404).end();
  }
});

server.listen(3000);
```

### Acceptance Criteria
1. Guarantee that multi-byte UTF-8 characters split across arbitrary network chunk boundaries decode with 100% fidelity using `StringDecoder`.
2. Enforce a strict maximum payload size of **2 MB** during streaming; abort with `413 Payload Too Large` if exceeded.
3. Parse and validate incoming newline-delimited JSON (NDJSON) lines line-by-line without buffering unbounded strings into memory.
4. Calculate and set the correct `Content-Length` header in bytes on the response.

### Solution Code

```js
// Node.js code
// SOLUTION: Robust StringDecoder streaming with byte limit enforcement

const http = require("node:http");
const { StringDecoder } = require("node:string_decoder");

const MAX_PAYLOAD_BYTES = 2 * 1024 * 1024; // 2 MB limit

const server = http.createServer((req, res) => {
  if (req.url === "/ingest" && req.method === "POST") {
    const decoder = new StringDecoder("utf8");
    let receivedBytes = 0;
    let pendingLine = "";
    const parsedLogs = [];
    let isTerminated = false;

    function abortRequest(statusCode, message) {
      if (!isTerminated) {
        isTerminated = true;
        req.destroy();
        res.writeHead(statusCode, { "Content-Type": "text/plain" });
        res.end(message);
      }
    }

    req.on("data", (chunk) => {
      if (isTerminated) return;

      receivedBytes += chunk.length;
      if (receivedBytes > MAX_PAYLOAD_BYTES) {
        abortRequest(413, "Payload Too Large: Maximum 2MB allowed");
        return;
      }

      // ✅ Safe: StringDecoder buffers incomplete multi-byte sequences across chunks
      pendingLine += decoder.write(chunk);

      // Process complete lines
      const lines = pendingLine.split("\n");
      // Keep the last incomplete fragment in pendingLine
      pendingLine = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          try {
            parsedLogs.push(JSON.parse(trimmed));
          } catch {
            abortRequest(400, "Malformed NDJSON record");
            return;
          }
        }
      }
    });

    req.on("end", () => {
      if (isTerminated) return;

      // Flush any final trailing characters
      pendingLine += decoder.end();
      if (pendingLine.trim()) {
        try {
          parsedLogs.push(JSON.parse(pendingLine.trim()));
        } catch {
          abortRequest(400, "Malformed trailing NDJSON record");
          return;
        }
      }

      const responsePayload = JSON.stringify({
        status: "SAVED",
        recordsProcessed: parsedLogs.length,
      });

      // ✅ Always use Buffer.byteLength for accurate Content-Length
      const responseBytes = Buffer.byteLength(responsePayload, "utf8");

      res.writeHead(200, {
        "Content-Type": "application/json",
        "Content-Length": responseBytes,
      });
      res.end(responsePayload);
    });

    req.on("error", (err) => {
      abortRequest(500, "Stream Error: " + err.message);
    });
  } else {
    res.writeHead(404).end("Not Found");
  }
});

server.listen(3000, () => {
  console.log("Log Ingestion Server listening on port 3000");
});
```

### Solution Explanation

1. **Eliminating Character Corruption:** Instead of calling `chunk.toString('utf8')`, the solution feeds each chunk into a single `StringDecoder('utf8')` instance. Any multi-byte sequence split across network packets is buffered until the remaining bytes arrive.
2. **Streaming NDJSON Line Parsing:** Rather than accumulating the entire 2MB payload into a single massive string before parsing, the code splits lines progressively and parses records as they arrive, significantly reducing peak V8 memory pressure.
3. **Byte-Accurate Content-Length:** The HTTP response header uses `Buffer.byteLength(responsePayload, 'utf8')` rather than `.length`, guaranteeing that client parsers receive the exact byte count even if the JSON response contains special Unicode characters.

---

## Summary

- Buffers represent raw binary byte arrays allocated in native C++ memory outside V8's garbage-collected heap.
- Always use `Buffer.alloc()` for user-facing data. Avoid `Buffer.allocUnsafe()` unless you immediately overwrite all bytes, as it exposes un-cleared RAM remnants.
- `buf.subarray()` returns a window over the exact same underlying memory. Copy data explicitly using `Buffer.from(slice)` or `.copy()` when retaining tiny slices of massive buffers to prevent memory leaks.
- `string.length` measures UTF-16 code units, while `Buffer.byteLength()` measures actual binary bytes. Always use `Buffer.byteLength()` for HTTP `Content-Length`.
- Streams can split multi-byte UTF-8 characters across chunk boundaries. Always use `node:string_decoder` when decoding streamed text.
- JSON cannot serialize `BigInt`, drops `undefined`, and converts `Date` to strings. Enforce strict byte limits on incoming payloads to prevent Denial-of-Service attacks.

---

## Cheat Sheet

### Buffer APIs at a Glance

| API | Return Value | Memory Behavior | Primary Use Case |
| :--- | :--- | :--- | :--- |
| `Buffer.alloc(size)` | Clean Buffer | Zero-initialized native memory | General safe buffer allocation |
| `Buffer.allocUnsafe(size)` | Dirty Buffer | Uninitialized memory from 8KB pool | Performance-critical internal writes |
| `Buffer.from(str, 'utf8')` | Encoded Buffer | Allocates memory and encodes string | Converting text to binary |
| `Buffer.byteLength(str)` | Integer | Calculates byte length without allocating | Setting HTTP `Content-Length` |
| `buf.subarray(start, end)` | Shared Buffer | **Zero copy**; references same memory | Slicing without CPU copy overhead |
| `new StringDecoder('utf8')`| Decoder instance | Preserves incomplete multi-byte sequences | Streaming text decoding |

### Common Pitfalls
- **Using `string.length` for `Content-Length`:** Truncates responses containing multi-byte characters and emojis.
- **Leaking memory via `subarray()`:** Retaining a 10-byte slice prevents a 50MB parent buffer from being garbage collected.
- **Decoding chunks with `chunk.toString()`:** Destroys multi-byte characters split across stream packets, replacing them with ``.
- **Parsing unbounded JSON bodies:** Allows attackers to crash the server with payload memory bombs.
- **Serializing `BigInt` with `JSON.stringify()`:** Throws an uncaught `TypeError` and crashes the request handler.

---

## Interview Questions

### 1. What is the fundamental difference between `Buffer.alloc()` and `Buffer.allocUnsafe()`?
**Question:** Explain how Node.js allocates memory for `Buffer.alloc()` versus `Buffer.allocUnsafe()`. Why is `Buffer.allocUnsafe()` considered a major security risk if used improperly?

**Answer:**
1. **Memory Allocation:**
   - `Buffer.alloc(size)` requests memory from the operating system and explicitly fills every byte with zeroes (`0x00`).
   - `Buffer.allocUnsafe(size)` allocates memory from Node's internal 8KB slab pool (`Buffer.poolSize`) without zero-filling. It is significantly faster because it avoids writing to every memory address during creation.
2. **The Security Risk:**
   Because `Buffer.allocUnsafe()` does not overwrite the allocated memory space, the buffer retains whatever data was previously stored at those physical RAM addresses. If an application allocates an unsafe buffer and transmits it over a network socket or writes it to disk before populating every single byte, it can leak sensitive leftover data—including TLS private keys, user passwords, database credentials, or cached session tokens.
3. **Best Practice:**
   Always use `Buffer.alloc(size)` by default. Only use `Buffer.allocUnsafe()` in high-throughput hot paths where you immediately overwrite 100% of the allocated byte range before any external read or transmission occurs.

---

### 2. Predict the Output: Character Length vs. Byte Length
**Question:** What will the following code output, and why? Explain how this impacts HTTP network communication:

```js
// Node.js code
const text = "Hello 🚀";

console.log("Length A:", text.length);
console.log("Length B:", Buffer.byteLength(text, "utf8"));
console.log("Length C:", Buffer.from(text).length);
```

**Answer:**
**Execution Output:**
```text
Length A: 8
Length B: 10
Length C: 10
```

**Reasoning:**
- **`text.length` (8):** JavaScript strings measure length in UTF-16 code units (16-bit units). `"Hello "` consists of 6 ASCII characters (6 units). The rocket emoji `🚀` (Code point `U+1F680`) cannot fit in 16 bits and is represented as a surrogate pair consisting of two UTF-16 code units. $6 + 2 = 8$.
- **`Buffer.byteLength(text, "utf8")` (10):** In UTF-8, each ASCII character in `"Hello "` consumes 1 byte (6 bytes). The `🚀` emoji requires 4 bytes. $6 + 4 = 10$ bytes.
- **`Buffer.from(text).length` (10):** Creates a Buffer containing the 10 UTF-8 bytes and returns its physical byte length.
- **HTTP Impact:** If a developer sets the HTTP `Content-Length` header using `text.length` (8), the receiving client or proxy expects only 8 bytes, cutting off the last 2 bytes of the emoji and resulting in a truncated, malformed response!

---

### 3. How does `StringDecoder` prevent multi-byte UTF-8 corruption across stream chunks?
**Question:** Why does calling `chunk.toString('utf8')` on stream data chunks risk corrupting text, and how does `node:string_decoder` solve this problem internally?

**Answer:**
**The Corruption Problem:**
UTF-8 is a variable-width encoding where characters take between 1 and 4 bytes. Streams emit data in arbitrary byte chunks (often 64KB or based on TCP packet arrival). If a multi-byte character (such as `€`, which takes 3 bytes: `0xE2, 0x82, 0xAC`) falls across a chunk boundary, Chunk 1 may end with `0xE2` and Chunk 2 may begin with `0x82, 0xAC`.
Calling `chunk.toString('utf8')` on Chunk 1 attempts to decode `0xE2` in isolation. Because `0xE2` is an incomplete sequence without its continuation bytes, the UTF-8 decoder emits the Unicode Replacement Character (``). When Chunk 2 arrives, its orphaned continuation bytes also fail and emit ``, irreversibly corrupting the text.

**How `StringDecoder` Resolves It:**
`StringDecoder` maintains an internal state machine. When `decoder.write(chunk)` is invoked:
1. It analyzes the leading byte of each character sequence.
2. If it encounters a byte indicating a 2-, 3-, or 4-byte character but the chunk ends before all continuation bytes arrive, it **holds back the incomplete bytes in an internal buffer** and returns only the fully decoded characters.
3. When the next chunk arrives, it prepends the buffered bytes to the new chunk and decodes the complete character cleanly.
4. Calling `decoder.end()` flushes any remaining bytes when the stream finishes.

---

### 4. Architectural Tradeoff: Slicing (`.subarray()`) vs. Copying (`Buffer.from()`)
**Question:** Compare the architectural and memory tradeoffs between `buffer.subarray()` and `Buffer.from(slice)` when parsing high-volume binary protocols in Node.js.

**Answer:**

| Feature | `buffer.subarray(start, end)` | `Buffer.from(slice)` or `.copy()` |
| :--- | :--- | :--- |
| **Allocation Overhead** | **$O(1)$ constant time**; creates a lightweight C++ wrapper object. | **$O(n)$ time**; performs a physical memory copy into a new buffer. |
| **Memory Isolation** | **Shared memory**. Mutations to the slice modify the original parent buffer. | **Isolated memory**. The new buffer is completely independent. |
| **V8 Heap Retention** | **Retains the entire parent buffer in memory**. Parent cannot be garbage collected. | **Frees parent buffer**. The parent buffer can be safely garbage collected. |

**Decision Rule:**
- Use **`buffer.subarray()`** for transient, read-only operations where the slice is inspected and discarded immediately within the same function or tick (e.g., inspecting a packet header or validating a magic number).
- Use **`Buffer.from(slice)`** or `.copy()` whenever you need to store the slice long-term (e.g., saving an ID in a cache or pushing to an in-memory queue), because holding a `subarray()` reference will prevent the entire large parent buffer from ever being reclaimed by garbage collection.

---

<nav aria-label="Lecture navigation">

[← Previous: Files, Paths, URLs, and Safe I/O](day-05-files-paths-urls-and-safe-io.md) | [Roadmap](../node-roadmap.md) | [Next: Events, Timers, and Resource Ownership](day-07-events-timers-and-resource-ownership.md)

</nav>