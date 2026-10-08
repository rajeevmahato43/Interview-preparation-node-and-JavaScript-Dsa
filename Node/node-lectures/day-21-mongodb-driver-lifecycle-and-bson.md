# Day 21: MongoDB Driver Lifecycle and BSON

<nav aria-label="Lecture navigation">

[← Previous: Express Security and HTTP Testing](day-20-express-security-and-http-testing.md) | [Roadmap](../node-roadmap.md) | [Next: MongoDB CRUD from Node](day-22-mongodb-crud-from-node.md)

</nav>

## Prerequisites

Before diving into MongoDB driver internals, review:
- [Day 04: Process, Configuration, and Lifecycle](day-04-process-configuration-and-lifecycle.md) for OS process teardown and shutdown signals.
- [Day 06: Buffers, Encodings, and Serialization](day-06-buffers-encodings-and-serialization.md) for raw binary allocation and byte serialization.
- [Day 12: Testing, Diagnostics, Observability, and Shutdown](day-12-testing-diagnostics-observability-and-shutdown.md) for handle management and resource draining.
- [Day 13: Express Application Structure](day-13-express-application-structure.md) for Repository and Composition Root patterns.
---

## Core Concepts

### 1. Driver Topology & Server Discovery and Monitoring (SDAM)

> **SDAM**: Server Discovery and Monitoring; the driver's background protocol that continuously monitors replica set heartbeats and handles primary elections.

A `MongoClient` is an active cluster management engine rather than a passive database connection.

When an application invokes `const client = new MongoClient(uri)`:
1. **Topology Discovery**: The driver connects to seed nodes, executes the `hello` (or `isWritablePrimary`) command, and learns the complete replica set topology (primary node, secondary replicas, arbiter).
2. **Background Heartbeats**: Dedicated monitoring sockets continuously poll each cluster member (every 10 seconds by default) to detect primary step-downs, network partitions, or replica elections.
3. **Connection Pooling**: For every reachable MongoDB server node, the driver maintains an independent connection pool of reusable TCP sockets.

```text
Node.js Application Process
┌─────────────────────────────────────────────────────────────┐
│ MongoClient (Singleton)                                     │
│   │                                                         │
│   ├── SDAM Topology Monitor (Heartbeat polls every 10s)     │
│   │                                                         │
│   ├── Pool: Primary Node (10.0.0.1:27017) [Sockets 1..N]    │
│   │                                                         │
│   ├── Pool: Secondary A  (10.0.0.2:27017) [Sockets 1..N]    │
│   │                                                         │
│   └── Pool: Secondary B  (10.0.0.3:27017) [Sockets 1..N]    │
└─────────────────────────────────────────────────────────────┘
```

#### The Per-Request Client Anti-Pattern
If an application creates `new MongoClient()` inside every HTTP request handler:
- Each client launches background monitoring timers and opens a fresh pool of TCP sockets.
- The operating system quickly exhausts file descriptors (`EMFILE`).
- TCP handshakes and TLS negotiations introduce 100ms+ latency penalties to every request.
- **Rule**: Instantiate `MongoClient` **once** at application bootstrap and share the instance across all repositories.

---

### 2. Connection Pool Tuning

The driver's connection pool controls the throughput and memory footprint of database operations:

| Parameter | Recommended Default | Production Responsibility |
| :--- | :--- | :--- |
| **`maxPoolSize`** | `50` – `100` | Maximum number of concurrent connections allowed per node. Prevents overwhelming database memory. |
| **`minPoolSize`** | `10` – `20` | Pre-warmed idle sockets kept open to eliminate connection latency during sudden traffic spikes. |
| **`maxIdleTimeMS`** | `30000` (30s) | Duration an idle connection above `minPoolSize` remains open before being closed by the pool. |
| **`waitQueueTimeoutMS`**| `2500` (2.5s) | Time a query waits for an available socket when `maxPoolSize` is saturated before throwing a timeout. |
| **`serverSelectionTimeoutMS`**| `5000` (5s) | Maximum time the driver spends searching for a suitable server node during network partitions or elections. |

---

### 3. BSON Architecture and the Anatomy of an `ObjectId`

> **`ObjectId`**: A 12-byte unique BSON identifier consisting of a 4-byte timestamp, 5-byte random process value, and a 3-byte incrementing counter.

> **BSON**: Binary JSON; a length-prefixed, type-annotated binary serialization format used on the wire between Node.js and MongoDB.

BSON was created for three primary reasons:
1. **Lightweight**: Optimized binary format with low overhead.
2. **Traversable**: Each element is prefixed with its byte length and data type byte, allowing the storage engine to skip unneeded fields without parsing the entire document.
3. **Rich Data Types**: Represents types that native JSON lacks.

```text
Anatomy of a 12-Byte BSON ObjectId (24 Hex Characters)
┌──────────────────────┬──────────────────────────────┬──────────────────────┐
│ 4-Byte Unix Seconds  │ 5-Byte Random Value          │ 3-Byte Counter       │
│ Timestamp            │ (Unique to Machine/Process)  │ (Incrementing)       │
├──────────────────────┼──────────────────────────────┼──────────────────────┤
│ Bytes 0 – 3          │ Bytes 4 – 8                  │ Bytes 9 – 11         │
│ Example: 66 11 2E 10 │ Example: A1 B2 C3 D4 E5      │ Example: 00 00 01    │
└──────────────────────┴──────────────────────────────┴──────────────────────┘
```

#### Key Characteristics of `ObjectId`:
- **Natural Time Ordering**: Because the first 4 bytes represent an epoch timestamp, `ObjectId`s are roughly chronological, serving as naturally indexed B-Tree keys.
- **Timestamp Extraction**: You can extract the creation date directly from any `ObjectId` without storing a separate `created_at` field: `id.getTimestamp()`.
- **Query Type Mismatch Hazard**: In MongoDB queries, types must match strictly. Querying `{ _id: "66112e10a1b2c3d4e5000001" }` will **never** match a document stored with an `ObjectId`! You must query `{ _id: new ObjectId("66112e10...") }`.

---

### 4. BSON Extended Types vs Native JavaScript

JavaScript numbers are 64-bit binary floating-point values (IEEE 754). This creates severe accuracy hazards for financial and large integer systems:

```text
In JavaScript:
0.1 + 0.2 === 0.30000000000000004   <-- Floating point corruption!
9007199254740991 + 2 === 9007199254740992 <-- Number.MAX_SAFE_INTEGER overflow!
```

BSON introduces dedicated native types to solve these limitations:

| BSON Type | Node.js Class | Primary Purpose |
| :--- | :--- | :--- |
| **Decimal128** | `new Decimal128(string)` | Exact 34-decimal-digit precision for currency, billing, and accounting. |
| **Long** | `Long.fromString(string)` | Signed 64-bit integer for tracking high-cardinality counters or external IDs. |
| **Binary** | `new Binary(buffer)` | Raw byte arrays for image data, cryptographic hashes, or UUIDv4 storage. |
| **Date** | Native JavaScript `Date` | 64-bit integer representing milliseconds since Unix epoch (NOT an ISO string). |

---

### 5. Extended JSON (EJSON): Canonical vs Relaxed

When serializing BSON documents to JSON for external HTTP consumption, standard `JSON.stringify()` strips BSON type information:

```js
// Native JSON.stringify on Decimal128 yields empty object or converts to unsafe float!
JSON.stringify({ price: Decimal128.fromString('19.99') }); 
// Might yield: '{"price":{}}' or loss of precision!
```

MongoDB provides **Extended JSON (`mongodb.EJSON`)** to serialize and parse BSON deterministically:

1. **Canonical Mode (`EJSON.stringify(doc, { relaxed: false })`)**: Preserves complete, lossless type metadata:
   ```json
   {
     "_id": { "$oid": "66112e10a1b2c3d4e5000001" },
     "balance": { "$numberDecimal": "19.99" },
     "createdAt": { "$date": { "$numberLong": "1712431632000" } }
   }
   ```
2. **Relaxed Mode (`EJSON.stringify(doc, { relaxed: true })`)**: Converts types to standard JSON where possible, using Extended syntax only when precision would be lost:
   ```json
   {
     "_id": "66112e10a1b2c3d4e5000001",
     "balance": { "$numberDecimal": "19.99" },
     "createdAt": "2026-04-06T12:47:12.000Z"
   }
   ```

---

## Code Snippets and Demonstrations

### 1. Robust `MongoClient` Lifecycle and Connection Manager

> **`MongoClient`**: The root client managing background topology discovery, replica set monitoring, and connection pooling to a MongoDB cluster.

Managing client bootstrap, pool configuration, ping verification, and graceful shutdown.

```js
// Node.js code
// filename: mongo-connection-manager.mjs
import { MongoClient } from 'mongodb';

export class MongoDatabaseManager {
  constructor(uri, options = {}) {
    this.uri = uri;
    this.client = new MongoClient(uri, {
      maxPoolSize: options.maxPoolSize || 50,
      minPoolSize: options.minPoolSize || 10,
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 3000,
      serverSelectionTimeoutMS: 5000,
      ...options
    });
    this.dbName = options.dbName || 'production_app';
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return this.client.db(this.dbName);

    try {
      console.log('[MongoDB] Connecting to cluster and discovering topology...');
      await this.client.connect();

      // Verify connection by issuing administrative ping
      await this.client.db('admin').command({ ping: 1 });
      this.isConnected = true;
      console.log('[MongoDB] Successfully established connection and validated ping.');

      return this.client.db(this.dbName);
    } catch (err) {
      console.error('[MongoDB] Failed to connect to cluster:', err.message);
      throw err;
    }
  }

  getDb() {
    if (!this.isConnected) {
      throw new Error('Database not connected. Call connect() before accessing database.');
    }
    return this.client.db(this.dbName);
  }

  async close(force = false) {
    if (!this.isConnected) return;

    console.log('[MongoDB] Draining connection pool and closing client...');
    try {
      await this.client.close(force);
      this.isConnected = false;
      console.log('[MongoDB] Client and background monitors terminated cleanly.');
    } catch (err) {
      console.error('[MongoDB] Error during client teardown:', err.message);
      throw err;
    }
  }
}
```

---

### 2. BSON Types and Precision Financial Math

Demonstrating `ObjectId` timestamp extraction, `Decimal128` financial math, and `EJSON` serialization.

```js
// Node.js code
// filename: bson-types-demo.mjs
import { ObjectId, Decimal128, Long, EJSON } from 'mongodb';

export function demonstrateBsonCapabilities() {
  // 1. ObjectId Generation and Timestamp Extraction
  const orderId = new ObjectId();
  console.log(`Generated ObjectId: ${orderId.toHexString()}`);
  console.log(`Creation Timestamp: ${orderId.getTimestamp().toISOString()}`);

  // 2. High-Precision Financial Math using Decimal128
  // ❌ NATIVE JS FLOAT CORRUPTION: 0.1 + 0.2 = 0.30000000000000004
  const floatSum = 0.1 + 0.2;
  console.log(`Native Float Sum: ${floatSum} (Loss of precision!)`);

  // ✅ BSON Decimal128: Exact 34-digit precision representation
  const itemPrice = Decimal128.fromString('19.99');
  const taxAmount = Decimal128.fromString('1.60');

  // 3. 64-bit Integer Tracking
  const bigCounter = Long.fromString('9007199254740995'); // Beyond JS Number.MAX_SAFE_INTEGER

  const document = {
    _id: orderId,
    orderNumber: bigCounter,
    itemPrice,
    taxAmount,
    createdAt: new Date()
  };

  // 4. Extended JSON Serialization
  const canonicalJson = EJSON.stringify(document, { relaxed: false });
  const relaxedJson = EJSON.stringify(document, { relaxed: true });

  console.log('\n--- Canonical Extended JSON ---');
  console.log(canonicalJson);

  console.log('\n--- Relaxed Extended JSON ---');
  console.log(relaxedJson);

  return { orderId, canonicalJson, relaxedJson };
}
```

---

### 3. Decoupled User Repository with Safe BSON Parameter Mapping

Encapsulating BSON `ObjectId` parsing and database queries behind a domain interface.

```js
// Node.js code
// filename: user-mongo-repository.mjs
import { ObjectId, Decimal128 } from 'mongodb';

export class UserMongoRepository {
  constructor(db) {
    this.collection = db.collection('users');
  }

  /**
   * Safely parses a string into an ObjectId without throwing unhandled exceptions.
   */
  static parseObjectId(idString) {
    if (!idString || !ObjectId.isValid(idString)) {
      return null;
    }
    return new ObjectId(idString);
  }

  async findById(idString) {
    const objectId = UserMongoRepository.parseObjectId(idString);
    if (!objectId) return null; // Invalid ID format immediately returns null

    const doc = await this.collection.findOne({ _id: objectId });
    if (!doc) return null;

    return this.mapToDomain(doc);
  }

  async createAccount(userData) {
    const newDoc = {
      email: userData.email.toLowerCase().trim(),
      name: userData.name.trim(),
      balance: Decimal128.fromString(String(userData.initialBalance || '0.00')),
      createdAt: new Date()
    };

    const result = await this.collection.insertOne(newDoc);
    return this.mapToDomain({ _id: result.insertedId, ...newDoc });
  }

  mapToDomain(doc) {
    return {
      id: doc._id.toHexString(),
      email: doc.email,
      name: doc.name,
      balance: doc.balance ? doc.balance.toString() : '0.00',
      createdAt: doc.createdAt
    };
  }
}
```

---

## Edge Cases and Tricky Scenarios

### 1. `ObjectId.isValid()` False-Positive Gotcha

A notorious pitfall in the MongoDB driver is `ObjectId.isValid()`:
```js
// Node.js code
console.log(ObjectId.isValid('123456789012')); // true!
console.log(ObjectId.isValid('hello-world!')); // true!
```
- **Why**: `ObjectId.isValid()` returns true if the input is *either* a 24-character hexadecimal string **or** a 12-byte raw string. Passing random 12-character ASCII strings passes validation but constructs malformed binary IDs.
- **The Solution**: Enforce a strict 24-character hexadecimal regex check alongside `ObjectId.isValid()`:
  ```js
  export function isValidHexObjectId(str) {
    return typeof str === 'string' && /^[0-9a-fA-F]{24}$/.test(str) && ObjectId.isValid(str);
  }
  ```

### 2. Unhandled Rejection During Server Re-Election

When a replica set primary steps down (e.g. during a rolling database upgrade or failover), the driver experiences a momentary socket drop.
- **The Trap**: If your application does not catch driver errors or relies on deprecated legacy options, queries throw `MongoServerSelectionError` or `MongoNetworkError`.
- **The Mitigation**: Modern MongoDB drivers (v4+) enable `retryWrites: true` by default in connection strings. The driver automatically buffers and retries failed write commands on the newly elected primary within `serverSelectionTimeoutMS`.

---

## Node.js, JavaScript, and Systems Connections

```text
┌──────────────────────────────────────────────────────────────┐
│ V8 Execution Environment                                     │
│ - JS IEEE 754 Floating Point (0.1 + 0.2 !== 0.3)             │
│ - JS Number.MAX_SAFE_INTEGER Limit (9,007,199,254,740,991)   │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ MongoDB Driver (BSON Serializer)                             │
│ - Decimal128 (Exact 34-digit financial decimal representation)│
│ - Long (64-bit signed integer representation)                │
│ - ObjectId (12-byte binary struct: Timestamp + Random + Seq) │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ OS Network Layer & Sockets                                   │
│ - Connection Pool (TCP Sockets, maxPoolSize, minPoolSize)     │
│ - SDAM Background Heartbeat Timers (every 10s)               │
└──────────────────────────────────────────────────────────────┘
```

- **Binary Serialization**: BSON is compiled and parsed directly via native C++ addons (`bson-ext`) or highly optimized TypedArray buffers in JS, avoiding JSON UTF-8 string decoding overhead.
- **Socket Pooling**: Each socket in the driver's pool is a Node `net.Socket` managed by libuv. Closing the client tears down these open handles, allowing process exit.

---

## Hands-On Exercise

### Scenario
An e-commerce accounting microservice crashes intermittently under load:
1. Every time a customer views their profile, the handler executes `new MongoClient(uri).connect()`, rapidly exhausting open file descriptors (`EMFILE`).
2. Currency balances stored as JavaScript numbers drift by fractional cents, failing daily accounting audits.
3. Tests hang indefinitely during CI teardown because the database connection is never closed.

### Buggy Code

```js
// Node.js code
// filename: buggy-mongo-service.mjs
const { MongoClient } = require('mongodb');

// ❌ BUG 1: Fresh MongoClient created on every request!
async function getUserBalance(userId) {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('shop');
  
  // ❌ BUG 2: Querying string directly against BSON ObjectId! Matches nothing!
  const user = await db.collection('users').findOne({ _id: userId });
  
  // ❌ BUG 3: Client is never closed! Sockets leak indefinitely!
  return user ? user.balance : 0;
}

// ❌ BUG 4: Naive float addition introduces rounding errors!
async function creditAccount(db, userId, amount) {
  const user = await db.collection('users').findOne({ _id: userId });
  const newBalance = user.balance + amount; // 0.1 + 0.2 = 0.30000000000000004
  await db.collection('users').updateOne({ _id: userId }, { $set: { balance: newBalance } });
}
```

### Acceptance Criteria
1. Implement a singleton `MongoDatabaseManager` that maintains a single, reusable connection pool.
2. Ensure queries convert string IDs into valid BSON `ObjectId`s.
3. Use `Decimal128` to represent currency balances, preventing floating-point rounding errors.
4. Implement a graceful teardown function that drains the connection pool without leaking sockets.
5. Provide a test suite using `node:test` verifying that multiple repository calls reuse the same client and close cleanly.

### Solution Code

```js
// Node.js code
// filename: solution-mongo-service.mjs
import { MongoClient, ObjectId, Decimal128 } from 'mongodb';

export class MongoDatabaseManager {
  constructor(uri, dbName = 'shop') {
    this.client = new MongoClient(uri, {
      maxPoolSize: 20,
      minPoolSize: 5
    });
    this.dbName = dbName;
    this.connected = false;
  }

  async connect() {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
    }
    return this.client.db(this.dbName);
  }

  async close() {
    if (this.connected) {
      await this.client.close();
      this.connected = false;
    }
  }
}

export class AccountRepository {
  constructor(db) {
    this.collection = db.collection('accounts');
  }

  async createAccount(email, initialBalanceStr = '0.00') {
    const doc = {
      email,
      // Store exact Decimal128
      balance: Decimal128.fromString(initialBalanceStr),
      createdAt: new Date()
    };
    const res = await this.collection.insertOne(doc);
    return { id: res.insertedId.toHexString(), ...doc, balance: doc.balance.toString() };
  }

  async getAccount(idString) {
    // Validate and convert to BSON ObjectId
    if (!idString || !/^[0-9a-fA-F]{24}$/.test(idString)) {
      return null;
    }

    const doc = await this.collection.findOne({ _id: new ObjectId(idString) });
    if (!doc) return null;

    return {
      id: doc._id.toHexString(),
      email: doc.email,
      balance: doc.balance.toString()
    };
  }
}
```

Accompanying test suite:
```js
// Node.js code
// filename: solution-mongo-service.test.mjs
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId, Decimal128 } from 'mongodb';

// Mock DB implementation to allow test execution without a live MongoDB instance
class MockCollection {
  constructor() { this.store = new Map(); }
  async insertOne(doc) {
    const id = new ObjectId();
    const stored = { _id: id, ...doc };
    this.store.set(id.toHexString(), stored);
    return { insertedId: id };
  }
  async findOne(query) {
    if (query._id instanceof ObjectId) {
      return this.store.get(query._id.toHexString()) || null;
    }
    return null;
  }
}

describe('MongoDB Driver & BSON Lifecycle Tests', () => {
  it('correctly maps BSON ObjectId and preserves Decimal128 precision', async () => {
    const mockColl = new MockCollection();
    const mockDb = { collection: () => mockColl };

    // 1. Create account with exact decimal balance: "100.10"
    const account = {
      email: 'finance@example.com',
      balance: Decimal128.fromString('100.10'),
      createdAt: new Date()
    };
    const insertRes = await mockColl.insertOne(account);
    const accountId = insertRes.insertedId.toHexString();

    // 2. Retrieve account using valid 24-hex ObjectId query
    const retrieved = await mockColl.findOne({ _id: new ObjectId(accountId) });
    assert.ok(retrieved);
    assert.equal(retrieved.balance.toString(), '100.10');

    // 3. Verify timestamp extraction from generated ObjectId
    const timestamp = retrieved._id.getTimestamp();
    assert.ok(timestamp instanceof Date);
    assert.ok(Date.now() - timestamp.getTime() < 5000);
  });
});
```

### Solution Explanation
1. **Singleton Client**: `MongoDatabaseManager` maintains a single `MongoClient` with bounded pooling (`maxPoolSize: 20`), eliminating per-request connection overhead.
2. **Proper Type Conversion**: Queries strictly instantiate `new ObjectId(idString)`, ensuring binary types match database index keys.
3. **Exact Currency Representation**: `Decimal128` stores currency with 34 digits of decimal precision, eliminating IEEE 754 floating-point rounding bugs.
4. **Idempotent Cleanup**: Calling `client.close()` terminates libuv sockets and SDAM monitors, allowing clean test and process exits.

---

## Summary

- `MongoClient` is an active cluster manager running SDAM heartbeats; instantiate it once as an application singleton, never per-request.
- Tune connection pools using `maxPoolSize`, `minPoolSize`, and `waitQueueTimeoutMS` to match server concurrency.
- BSON provides native types beyond JSON, including 12-byte `ObjectId`s, 64-bit `Long`s, and high-precision `Decimal128`s.
- Queries against `_id` must use `new ObjectId(hexString)`; querying with a raw string fails to match BSON `ObjectId` fields.
- Use `Decimal128` for financial calculations to prevent JavaScript floating-point rounding errors.
- Serialize documents via Extended JSON (`EJSON`) when exact BSON type preservation is required across APIs.

---

## Cheat Sheet

| BSON / Driver Feature | Syntax / Usage | Primary Purpose |
| :--- | :--- | :--- |
| **Singleton Client** | `new MongoClient(uri, { maxPoolSize: 50 })` | Prevents file descriptor exhaustion |
| **BSON ID Match** | `{ _id: new ObjectId(idStr) }` | Query by primary key |
| **Extract Creation Date**| `objectId.getTimestamp()` | Get document creation time without extra column |
| **Financial Math** | `Decimal128.fromString('99.99')` | Prevents floating-point precision corruption |
| **64-bit Integer** | `Long.fromString('9007199254740995')` | Supports integers larger than $2^{53} - 1$ |
| **EJSON Serialization**| `EJSON.stringify(doc, { relaxed: true })` | Preserves BSON types in JSON transport |
| **Graceful Teardown** | `await client.close()` | Closes pool sockets and SDAM timers |

### Common Pitfalls
- **Instantiating `MongoClient` per request**: Exhausts file descriptors (`EMFILE`) and adds massive connection latency.
- **Querying `_id` with a raw string**: `{ _id: "66112e..." }` fails to match BSON `ObjectId` records.
- **Relying on `ObjectId.isValid()` alone**: Returns true for arbitrary 12-character strings; pair with a 24-character hex regex check.
- **Storing currency as native floats**: Causes fractional cent calculation errors (`0.1 + 0.2 !== 0.3`).

---

## Interview Questions

### 1. What is the internal architecture of `MongoClient`, and why is creating a client instance per HTTP request a severe architectural anti-pattern?

A `MongoClient` in the official MongoDB Node.js driver is not a simple TCP socket; it is a complex, distributed **Cluster Orchestration Engine**.

When initialized, `MongoClient` performs several background operations:
1. **Server Discovery and Monitoring (SDAM)**: It connects to the cluster seed list, maps the topology (discovering primary, secondary, and arbiter nodes), and establishes dedicated background monitoring sockets that send `hello` heartbeat pings every 10 seconds.
2. **Connection Pools**: It creates and manages an independent connection pool (bounded by `minPoolSize` and `maxPoolSize`) for *every reachable server node* in the replica set.
3. **Authentication & Handshakes**: Every new connection negotiates TLS and executes SCRAM/MONGODB-CR authentication handshakes.

If an application instantiates `new MongoClient()` inside every HTTP request handler:
- Each incoming request opens dozens of new TCP sockets and starts independent SDAM timer threads on the event loop.
- The operating system quickly exhausts available file descriptors, throwing `EMFILE: too many open files` errors.
- Handshake negotiation adds 50–150ms of latency to every single database query.
- The correct architecture is to instantiate `MongoClient` **once** at application startup, share the client instance across all repositories, and close it cleanly during process shutdown.

### 2. Deconstruct the internal 12-byte binary structure of a BSON `ObjectId`. What operational advantages does this design provide?

A BSON `ObjectId` is a 12-byte (96-bit) binary value, traditionally displayed as a 24-character hexadecimal string. Its internal layout is divided into three distinct segments:

1. **Bytes 0–3 (4 bytes)**: A 32-bit unsigned integer representing seconds since the Unix epoch (big-endian).
2. **Bytes 4–8 (5 bytes)**: A random 40-bit value generated once per process upon driver initialization, unique to the host machine and process PID.
3. **Bytes 9–11 (3 bytes)**: An incrementing 24-bit counter, initialized to a random value and incremented sequentially for each new ID generated.

Operational advantages:
- **Decentralized Generation**: IDs can be generated locally by client application threads without requiring a centralized database sequence coordinator or round-trip network network latency, ensuring high-throughput distributed inserts.
- **Natural Chronological Sorting**: Because the first 4 bytes represent an epoch timestamp, `ObjectId`s are roughly chronological. They append naturally to the end of B-Tree index pages, minimizing index page splits.
- **Embedded Timestamp**: Applications can extract the exact creation time of a record using `id.getTimestamp()` without storing or indexing a separate `created_at` timestamp column.

### 3. Why does storing financial data using native JavaScript `Number` types cause balance discrepancies, and how does BSON `Decimal128` solve this?

> **`Decimal128`**: A 128-bit decimal floating-point format supporting 34 decimal digits of precision for exact financial calculations.

Native JavaScript numbers are implemented according to the **IEEE 754 Binary Floating-Point standard** (Double Precision / 64-bit). In binary floating-point representations, base-10 fractional decimals like `0.1`, `0.2`, or `0.05` cannot be represented exactly; they are stored as repeating binary approximations:
```text
0.1 + 0.2 === 0.30000000000000004
```
In billing, accounting, and banking systems, performing arithmetic across thousands of transactions using floating-point numbers accumulates rounding errors. This results in missing fractional cents, tax reconciliation failures, and regulatory compliance violations.

BSON `Decimal128` resolves this by implementing the **IEEE 754-2008 Decimal Floating-Point standard**. Unlike binary floats, `Decimal128` operates in **base-10 arithmetic**, providing:
- Exact representation of base-10 decimal fractions without approximation errors.
- 34 decimal digits of precision (emulating standard financial calculator hardware).
- Emulation in Node.js via the `Decimal128` class, ensuring that storing and querying `$19.99` remains mathematically exact throughout persistence and database aggregations.

### 4. What is the difference between Canonical and Relaxed Extended JSON (`EJSON`), and when should you choose each format?

Standard `JSON.stringify()` cannot natively represent specialized BSON data types like `ObjectId`, `Decimal128`, `Long`, or `Binary`, serializing them either as plain strings, numbers, or empty objects (`{}`). Extended JSON (EJSON) defines standard JSON schemas that represent BSON data without ambiguity.

1. **Canonical Extended JSON (`{ relaxed: false }`)**:
   - **Contract**: Prioritizes **lossless type preservation**. Every BSON type is mapped to a strict JSON object with type wrappers:
     - `ObjectId` -> `{ "$oid": "66112e10..." }`
     - `Decimal128` -> `{ "$numberDecimal": "19.99" }`
     - `Date` -> `{ "$date": { "$numberLong": "1712431632000" } }`
   - **Use Case**: Database backup exports, replication streams, audit logs, and inter-service communication where receiving systems must parse the JSON back into exact native BSON types without type coercion.

2. **Relaxed Extended JSON (`{ relaxed: true }`)**:
   - **Contract**: Prioritizes **human readability and frontend client ergonomics**. It converts BSON types into native JSON primitives wherever precision is not lost:
     - `ObjectId` -> `"66112e10..."` (plain hex string)
     - `Date` -> `"2026-04-06T12:47:12.000Z"` (ISO string)
     - `Decimal128` -> `{ "$numberDecimal": "19.99" }` (retains type wrapper only because native JSON numbers would lose precision).
   - **Use Case**: Public REST API response payloads, frontend dashboards, and client-facing web applications.

---

<nav aria-label="Lecture navigation">

[← Previous: Express Security and HTTP Testing](day-20-express-security-and-http-testing.md) | [Roadmap](../node-roadmap.md) | [Next: MongoDB CRUD from Node](day-22-mongodb-crud-from-node.md)

</nav>