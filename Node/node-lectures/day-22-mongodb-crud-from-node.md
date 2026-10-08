# Day 22: MongoDB CRUD from Node

<nav aria-label="Lecture navigation">

[← Previous: MongoDB Driver Lifecycle and BSON](day-21-mongodb-driver-lifecycle-and-bson.md) | [Roadmap](../node-roadmap.md) | [Next: MongoDB Access Patterns and Document Shape](day-23-mongodb-access-patterns-and-document-shape.md)

</nav>

## Prerequisites

Before diving into CRUD operations, review:
- [Day 08: Streams and Backpressure](day-08-streams-and-backpressure.md) for async iterators and stream processing.
- [Day 16: Express Input Validation and Serialization](day-16-express-input-validation-and-serialization.md) for input sanitization and DTO projection.
- [Day 21: MongoDB Driver Lifecycle and BSON](day-21-mongodb-driver-lifecycle-and-bson.md) for `MongoClient` pooling, BSON `ObjectId`, and `Decimal128`.
---

## Core Concepts

### 1. Document Creation: `insertOne()` vs `insertMany()`

Inserting documents into MongoDB involves considerations of network latency, write acknowledgment, and batch error semantics:

```text
insertMany([docA, docB, docC], { ordered: true })
   docA (Success) ──► docB (FAILS: Duplicate Key) ──► docC (ABORTED! Never executed!)

insertMany([docA, docB, docC], { ordered: false })
   docA (Success) ──► docB (FAILS: Duplicate Key) ──► docC (EXECUTED & SUCCEEDS!)
```

- **`insertOne(doc)`**: Inserts a single document. If `_id` is omitted, the driver generates a fresh 12-byte `ObjectId` locally before serializing to wire BSON.
- **`insertMany(docs, { ordered: true })` (Default)**: Executes insertions sequentially on the server. If document 4 triggers an error (e.g. duplicate key `E11000`), the operation halts immediately; remaining documents (5..N) are **not inserted**.
- **`insertMany(docs, { ordered: false })`**: Executes insertions in parallel batches. If any document fails, execution continues for all remaining documents. A `MongoBulkWriteError` is thrown containing an array of specific write errors alongside `insertedCount`.

---

### 2. Document Reading: Cursors vs Memory Buffering

When executing `collection.find(filter)`, MongoDB does **not** return an array of documents. It returns an instance of **`FindCursor`**.

> **`FindCursor`**: A pointer to the result set of a query that streams documents on-demand from the server in batches.

```text
Node.js Application Process                      MongoDB Server Node
┌─────────────────────────────────┐              ┌─────────────────────────────┐
│ collection.find(filter)         │ ───────────► │ Executes query index scan   │
│ Returns FindCursor immediately  │ ◄─────────── │ Returns initial batch (101) │
│                                 │              │                             │
│ for await (const doc of cursor) │              │                             │
│ - Reads from local batch buffer │              │                             │
│ - When batch empties:           │              │                             │
│   Sends getMore command         │ ───────────► │ Fetches next batch (batchSize)│
│                                 │ ◄─────────── │ Stream continues...         │
└─────────────────────────────────┘              └─────────────────────────────┘
```

#### The `cursor.toArray()` Trap:
Calling `await cursor.toArray()` loads every matching document from the database into a single JavaScript array in V8 heap memory.
- If a collection matches 50,000 documents (e.g. 200MB of data), `toArray()` allocates huge memory spikes, freezes the event loop with garbage collection pauses, and crashes containers under memory limits.
- **Rule**: For large or unbounded datasets, consume cursors using **asynchronous iteration** (`for await (const doc of cursor)`) or pipe them directly via `cursor.stream()`.

---

### 3. Update Operators vs Full Document Replacement

> **Document Replacement**: Completely overwriting an existing document with a new document shape using `replaceOne()`.

Updating data in MongoDB requires choosing between partial atomic mutations and full document replacement:

```text
Original Document:
{ _id: 1, name: "Alice", role: "admin", department: "Security", score: 10 }

replaceOne({ _id: 1 }, { name: "Alice Smith", score: 12 })
Result: { _id: 1, name: "Alice Smith", score: 12 }
⚠️ DANGER: "role" and "department" were completely ERASED!

updateOne({ _id: 1 }, { $set: { name: "Alice Smith" }, $inc: { score: 2 } })
Result: { _id: 1, name: "Alice Smith", role: "admin", department: "Security", score: 12 }
✅ SAFE: Only targeted fields were modified; existing fields preserved!
```

#### Essential Field Update Operators:
- **`$set`**: Sets field values without modifying other document attributes.
- **`$unset`**: Deletes a specific field from the document (`{ $unset: { temporaryToken: "" } }`).
- **`$inc`**: Atomically increments or decrements a numeric field (`{ $inc: { balance: -25, attempts: 1 } }`).
- **`$currentDate`**: Sets a field to the current database server timestamp (`{ $currentDate: { updatedAt: true } }`).

#### Essential Array Mutation Operators:
- **`$push`**: Appends an element to an array.
- **`$pull`**: Removes all instances matching a condition from an array.
- **`$addToSet`**: Appends a value only if it does not already exist in the array (set semantics).

---

### 4. Eliminating Race Conditions with `findOneAndUpdate()`

A classic concurrency failure in database applications is the **Read-Modify-Write Race Condition**:

```text
Thread A: findOne(item_1) ──► balance is 100
Thread B: findOne(item_1) ──► balance is 100
Thread A: updates balance to (100 - 40 = 60)
Thread B: updates balance to (100 - 30 = 70) ──► Overwrites Thread A! Lost Update!
```

`collection.findOneAndUpdate()` executes the query and mutation **atomically inside the database engine**:

```js
const result = await collection.findOneAndUpdate(
  { _id: itemId, balance: { $gte: withdrawalAmount } }, // Invariant check!
  { $inc: { balance: -withdrawalAmount } },              // Atomic decrement!
  { returnDocument: 'after' }                           // Returns updated state!
);
```
- If the balance was insufficient or another thread decremented it first, the filter fails to match, and `result` returns `null`.
- Zero application locks are required; atomicity is guaranteed at the single-document level by MongoDB's WiredTiger storage engine.

---

### 5. Optimistic Concurrency Control (OCC)

> **Optimistic Concurrency (OCC)**: A concurrency control pattern where an update filter checks a document version (`version: currentVersion`) and increments it atomically.

When multiple users can edit different fields of the same entity simultaneously (e.g. updating a customer profile or wiki page), applying updates without concurrency validation results in silent data overwrites.

```text
Client A fetches Document (version = 1)
Client B fetches Document (version = 1)

Client A saves changes:
UPDATE WHERE _id = id AND version = 1 SET ..., version = 2 (Success! Version is now 2)

Client B saves changes:
UPDATE WHERE _id = id AND version = 1 SET ..., version = 2
(Matches 0 documents! Throws ConcurrencyConflictError!)
```

By adding a `version` integer to the document and requiring it in the update predicate, the second write is rejected cleanly with an HTTP 409 Conflict rather than silently destroying the first user's modifications.

---

## Code Snippets and Demonstrations

### 1. High-Performance Streaming Cursor Consumption

Streaming large datasets without buffering using native asynchronous iteration.

```js
// Node.js code
// filename: streaming-cursor-demo.mjs

/**
 * Streams millions of records with constant low memory footprint.
 */
export async function streamExportOrders(ordersCollection, filter, outputStream) {
  // Configure cursor with tuned batch size (e.g. 500 documents per network round-trip)
  const cursor = ordersCollection.find(filter, {
    batchSize: 500,
    projection: { _id: 1, customerId: 1, total: 1, createdAt: 1 }
  });

  let processedCount = 0;
  outputStream.write('[\n');

  try {
    // ✅ Asynchronous iterator streams documents without allocating full array
    for await (const order of cursor) {
      const jsonLine = JSON.stringify({
        id: order._id.toHexString(),
        customerId: order.customerId,
        total: order.total ? order.total.toString() : '0.00',
        createdAt: order.createdAt
      });

      if (processedCount > 0) outputStream.write(',\n');
      outputStream.write(`  ${jsonLine}`);
      processedCount++;
    }

    outputStream.write('\n]\n');
    console.log(`[Export] Successfully streamed ${processedCount} orders without memory spikes.`);
  } finally {
    // Ensure cursor is closed if iteration was interrupted early
    await cursor.close();
  }
}
```

---

### 2. Atomic Bank Account Withdrawal via `findOneAndUpdate()`

Implementing atomic invariant enforcement without distributed locks.

```js
// Node.js code
// filename: atomic-bank-transfer.mjs
import { ObjectId, Decimal128 } from 'mongodb';

export class InsufficientFundsError extends Error {
  constructor(msg) { super(msg); this.name = 'InsufficientFundsError'; }
}

export async function withdrawFundsAtomically(accountsCollection, accountId, amount) {
  const objectId = new ObjectId(accountId);
  const decrementValue = Decimal128.fromString(String(-amount));
  const thresholdValue = Decimal128.fromString(String(amount));

  // ✅ Atomic Find-And-Modify: checks condition and updates in a single atomic step
  const updatedAccount = await accountsCollection.findOneAndUpdate(
    {
      _id: objectId,
      // Invariant: Balance must be greater than or equal to requested amount
      balance: { $gte: thresholdValue }
    },
    {
      $inc: { balance: decrementValue },
      $currentDate: { updatedAt: true },
      $push: {
        transactions: {
          type: 'WITHDRAWAL',
          amount: Decimal128.fromString(String(amount)),
          timestamp: new Date()
        }
      }
    },
    {
      returnDocument: 'after' // Return updated document state
    }
  );

  // If no document matched, account either doesn't exist OR balance is insufficient!
  if (!updatedAccount) {
    const accountExists = await accountsCollection.countDocuments({ _id: objectId });
    if (!accountExists) {
      throw new Error(`Account "${accountId}" not found`);
    }
    throw new InsufficientFundsError('Withdrawal rejected: Insufficient funds');
  }

  return {
    id: updatedAccount._id.toHexString(),
    newBalance: updatedAccount.balance.toString(),
    updatedAt: updatedAccount.updatedAt
  };
}
```

---

### 3. Production Enterprise CRUD Repository with Optimistic Locking

Building a full-featured CRUD repository with Optimistic Concurrency Control, projection mapping, and duplicate-key error translation.

```js
// Node.js code
// filename: product-mongo-repository.mjs
import { ObjectId } from 'mongodb';

export class ConcurrencyConflictError extends Error {
  constructor(msg) { super(msg); this.name = 'ConcurrencyConflictError'; }
}
export class DuplicateSkuError extends Error {
  constructor(msg) { super(msg); this.name = 'DuplicateSkuError'; }
}

export class ProductMongoRepository {
  constructor(db) {
    this.collection = db.collection('products');
  }

  async createProduct({ sku, title, price, inventory }) {
    const doc = {
      sku: sku.trim().toUpperCase(),
      title: title.trim(),
      price: Number(price),
      inventory: Number(inventory || 0),
      version: 1, // Initialize OCC version
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const res = await this.collection.insertOne(doc);
      return { id: res.insertedId.toHexString(), ...doc };
    } catch (err) {
      if (err.code === 11000) {
        throw new DuplicateSkuError(`Product with SKU "${sku}" already exists`);
      }
      throw err;
    }
  }

  async findById(idString, options = {}) {
    if (!ObjectId.isValid(idString)) return null;

    const query = { _id: new ObjectId(idString), isDeleted: false };
    const findOptions = {};

    // Support field projection
    if (options.fields) {
      findOptions.projection = options.fields.reduce((acc, f) => ({ ...acc, [f]: 1 }), {});
    }

    const doc = await this.collection.findOne(query, findOptions);
    if (!doc) return null;

    return { id: doc._id.toHexString(), ...doc };
  }

  /**
   * Updates product details with Optimistic Concurrency Control.
   */
  async updateWithVersion(idString, currentVersion, patchData) {
    if (!ObjectId.isValid(idString)) return false;

    // Remove immutable fields from patch
    const sanitizedPatch = { ...patchData };
    delete sanitizedPatch._id;
    delete sanitizedPatch.id;
    delete sanitizedPatch.version;

    const res = await this.collection.updateOne(
      {
        _id: new ObjectId(idString),
        version: currentVersion, // OCC Invariant check!
        isDeleted: false
      },
      {
        $set: sanitizedPatch,
        $inc: { version: 1 }, // Atomically bump version
        $currentDate: { updatedAt: true }
      }
    );

    if (res.matchedCount === 0) {
      // Check if document exists with a different version
      const existing = await this.collection.findOne({ _id: new ObjectId(idString) });
      if (existing) {
        throw new ConcurrencyConflictError(
          `Update conflict: Product was modified concurrently (Current version: ${existing.version}, Expected: ${currentVersion})`
        );
      }
      return null; // Document not found
    }

    return true;
  }

  async softDelete(idString) {
    if (!ObjectId.isValid(idString)) return false;

    const res = await this.collection.updateOne(
      { _id: new ObjectId(idString), isDeleted: false },
      {
        $set: { isDeleted: true },
        $currentDate: { deletedAt: true }
      }
    );

    return res.modifiedCount > 0;
  }
}
```

---

## Edge Cases and Tricky Scenarios

### 1. The `matchedCount: 1` vs `modifiedCount: 0` Misconception

When calling `updateOne()`, developers often inspect `result.modifiedCount` to confirm success:
```js
// Node.js code
const res = await users.updateOne({ _id: id }, { $set: { status: 'ACTIVE' } });
if (res.modifiedCount === 0) {
  // ⚠️ TRAP: Developer assumes the user does NOT exist!
  throw new NotFoundError('User not found');
}
```
- **The Pitfall**: If the user's `status` was **already** `'ACTIVE'`, MongoDB evaluates the document, sees that no byte values actually changed, and returns:
  `matchedCount: 1`, `modifiedCount: 0`.
- **The Correct Check**: To verify that a document exists and was targeted, always evaluate **`res.matchedCount > 0`**, not `modifiedCount`.

### 2. Accidental Array Replacement vs Atomic Array Appending

When updating a document's tags array:
```js
// ❌ ANTI-PATTERN: Overwrites the entire array, wiping concurrent additions!
await posts.updateOne({ _id: id }, { $set: { tags: ['tech', 'node'] } });

// ✅ CORRECT: Atomically appends unique tags without modifying existing entries
await posts.updateOne({ _id: id }, { $addToSet: { tags: { $each: ['tech', 'node'] } } });
```

---

## Node.js, JavaScript, and Systems Connections

```text
┌──────────────────────────────────────────────────────────────┐
│ V8 Heap Memory Management                                    │
│ - cursor.toArray() buffers all BSON objects in V8 Heap       │
│ - for await (const doc of cursor) streams one object at a time│
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ MongoDB Driver Wire Protocol (OP_MSG)                        │
│ - find command requests initial batch (101 docs)             │
│ - getMore command pulls subsequent batches (batchSize)       │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ WiredTiger Storage Engine (Server)                           │
│ - findOneAndUpdate locks single document record in memory    │
│ - Atomically evaluates filter predicate & applies mutations   │
└──────────────────────────────────────────────────────────────┘
```

- **V8 Heap Protection**: Consuming cursors via async iterators leverages Node's backpressure; the driver halts sending `getMore` requests until the application finishes processing the current batch.
- **WiredTiger Concurrency**: Single-document mutations in MongoDB are atomic. WiredTiger uses optimistic multi-version concurrency control (MVCC) at the document level, avoiding collection-wide table locks.

---

## Hands-On Exercise

### Scenario
An inventory warehouse management API handles order reservations. Under peak flash-sale concurrency:
1. Two customers checkout the last item simultaneously; both read `inventory = 1` and both checkout, resulting in overselling (`inventory = -1`).
2. An order export endpoint calls `collection.find().toArray()`, triggering out-of-memory container restarts during large exports.
3. Updating item titles accidentally wipes out existing `tags` and `price` fields because `replaceOne` was used instead of `updateOne`.

### Buggy Code

```js
// Node.js code
// filename: buggy-inventory.mjs
const { ObjectId } = require('mongodb');

// ❌ BUG 1: Read-then-write race condition causes overselling!
async function reserveStock(db, itemId, quantity) {
  const item = await db.collection('items').findOne({ _id: new ObjectId(itemId) });
  if (!item || item.stock < quantity) {
    throw new Error('Out of stock');
  }

  // Window of vulnerability: Another thread reserves stock right here!
  const newStock = item.stock - quantity;
  await db.collection('items').updateOne({ _id: new ObjectId(itemId) }, { $set: { stock: newStock } });
  return true;
}

// ❌ BUG 2: replaceOne erases all fields not present in the update payload!
async function updateTitle(db, itemId, newTitle) {
  await db.collection('items').replaceOne(
    { _id: new ObjectId(itemId) },
    { title: newTitle } // Wipes out stock, sku, price, tags!
  );
}

// ❌ BUG 3: toArray buffers entire dataset in memory, causing OOM crashes!
async function getAllOrders(db) {
  return await db.collection('orders').find({}).toArray();
}
```

### Acceptance Criteria
1. Re-implement `reserveStock` using `findOneAndUpdate()` to guarantee atomic stock deduction and prevent overselling below 0.
2. Fix `updateTitle` using `updateOne()` with `$set` to preserve unmentioned fields.
3. Implement `streamOrders` using `for await...of` to process orders sequentially without memory bloat.
4. Provide a test suite using `node:test` verifying atomic deduction and proper field preservation.

### Solution Code

```js
// Node.js code
// filename: solution-inventory.mjs
import { ObjectId } from 'mongodb';

export class OutOfStockError extends Error {
  constructor(msg) { super(msg); this.name = 'OutOfStockError'; }
}

export async function reserveStockAtomically(itemsCollection, itemId, quantity) {
  const objectId = new ObjectId(itemId);

  // ✅ FIX 1: Atomic check and decrement in a single command
  const updatedItem = await itemsCollection.findOneAndUpdate(
    {
      _id: objectId,
      stock: { $gte: quantity } // Invariant: Must have enough stock
    },
    {
      $inc: { stock: -quantity },
      $currentDate: { updatedAt: true }
    },
    {
      returnDocument: 'after'
    }
  );

  if (!updatedItem) {
    throw new OutOfStockError(`Item ${itemId} has insufficient stock for reservation.`);
  }

  return updatedItem;
}

export async function updateTitleSafely(itemsCollection, itemId, newTitle) {
  // ✅ FIX 2: updateOne with $set preserves all other document fields
  const res = await itemsCollection.updateOne(
    { _id: new ObjectId(itemId) },
    {
      $set: { title: newTitle },
      $currentDate: { updatedAt: true }
    }
  );

  return res.matchedCount > 0;
}

export async function countOrdersStreaming(ordersCollection) {
  // ✅ FIX 3: Stream cursor batches without toArray memory spikes
  const cursor = ordersCollection.find({}, { batchSize: 100 });
  let count = 0;

  for await (const order of cursor) {
    count++;
  }

  return count;
}
```

Accompanying test suite:
```js
// Node.js code
// filename: solution-inventory.test.mjs
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';

// Mock Collection implementation
class MockItemsCollection {
  constructor() {
    this.items = new Map();
  }
  async insertOne(doc) {
    const id = new ObjectId();
    this.items.set(id.toHexString(), { _id: id, ...doc });
    return { insertedId: id };
  }
  async findOneAndUpdate(filter, update, options) {
    const idStr = filter._id.toHexString();
    const item = this.items.get(idStr);
    if (!item) return null;

    // Check $gte invariant
    if (filter.stock && filter.stock.$gte && item.stock < filter.stock.$gte) {
      return null; // Invariant failed!
    }

    if (update.$inc && update.$inc.stock) {
      item.stock += update.$inc.stock;
    }
    return item;
  }
  async updateOne(filter, update) {
    const idStr = filter._id.toHexString();
    const item = this.items.get(idStr);
    if (!item) return { matchedCount: 0, modifiedCount: 0 };

    if (update.$set) {
      Object.assign(item, update.$set);
    }
    return { matchedCount: 1, modifiedCount: 1 };
  }
}

describe('MongoDB Atomic CRUD Tests', () => {
  it('atomically deducts stock and rejects overselling', async () => {
    const collection = new MockItemsCollection();
    const insertRes = await collection.insertOne({
      title: 'Ergonomic Keyboard',
      sku: 'KBD_01',
      stock: 5,
      price: 120
    });
    const itemId = insertRes.insertedId.toHexString();

    // 1. Reserve 3 items -> Stock becomes 2
    const res1 = await collection.findOneAndUpdate(
      { _id: new ObjectId(itemId), stock: { $gte: 3 } },
      { $inc: { stock: -3 } }
    );
    assert.ok(res1);
    assert.equal(res1.stock, 2);

    // 2. Attempt to reserve 3 more items (Only 2 left) -> Rejection!
    const res2 = await collection.findOneAndUpdate(
      { _id: new ObjectId(itemId), stock: { $gte: 3 } },
      { $inc: { stock: -3 } }
    );
    assert.equal(res2, null); // Blocked overselling!

    // 3. Update title safely preserving existing fields
    await collection.updateOne(
      { _id: new ObjectId(itemId) },
      { $set: { title: 'Mechanical Keyboard' } }
    );
    const item = collection.items.get(itemId);
    assert.equal(item.title, 'Mechanical Keyboard');
    assert.equal(item.sku, 'KBD_01'); // Preserved!
    assert.equal(item.price, 120);    // Preserved!
  });
});
```

### Solution Explanation
1. **Atomic Invariant Check**: `findOneAndUpdate` tests `stock: { $gte: quantity }` and executes `$inc: { stock: -quantity }` simultaneously, preventing race conditions.
2. **Partial Update Safety**: Using `updateOne` with `$set` modifies only `title`, preserving `sku`, `price`, and `tags`.
3. **Memory Bounded Streaming**: `for await...of` streams cursor documents in small chunks, eliminating out-of-memory heap exhaustion.

---

## Summary

- Use `insertMany(docs, { ordered: false })` when executing batch inserts to ensure partial errors do not halt the entire batch.
- Never call `cursor.toArray()` on unbounded datasets; consume `FindCursor` using `for await...of` to preserve low memory usage.
- Prefer atomic partial updates (`$set`, `$inc`, `$push`, `$addToSet`) over destructive full document replacement (`replaceOne`).
- Eliminate Read-Modify-Write race conditions using `findOneAndUpdate()` with atomic condition predicates.
- Differentiate `matchedCount` from `modifiedCount` in write results; verify `matchedCount > 0` to confirm document existence.
- Implement Optimistic Concurrency Control (OCC) with version keys to prevent concurrent overwrites.

---

## Cheat Sheet

| Operation | Syntax Pattern | Key Advantage |
| :--- | :--- | :--- |
| **Unordered Insert** | `insertMany(docs, { ordered: false })` | Batch insert continues even if some documents fail |
| **Stream Cursor** | `for await (const doc of cursor)` | $O(1)$ memory streaming; prevents V8 heap overflow |
| **Atomic Find/Modify**| `findOneAndUpdate(filter, update, { returnDocument: 'after' })` | Eliminates read-then-write race conditions |
| **Atomic Inc** | `updateOne(f, { $inc: { balance: -20 } })` | Thread-safe numeric adjustments |
| **Set Push** | `updateOne(f, { $addToSet: { tags: 'node' } })` | Appends to array without creating duplicates |
| **OCC Update** | `updateOne({ _id, version }, { $inc: { version: 1 } })` | Prevents concurrent lost updates |

### Common Pitfalls
- **Buffering entire collections with `cursor.toArray()`**: Causes V8 heap out-of-memory container crashes.
- **Using `replaceOne` for partial updates**: Erases all existing fields not declared in the replacement object.
- **Checking `modifiedCount === 0` to determine not-found**: Emits false negatives when updated values match existing data.
- **Read-Modify-Write without locking**: Creates race conditions and lost updates under concurrency.

---

## Interview Questions

### 1. What is the fundamental difference between `updateOne()` and `replaceOne()` in MongoDB, and what catastrophic bug can occur if they are confused?

`updateOne()` executes **partial atomic modifications** on a document. It requires update operator expressions (such as `$set`, `$unset`, `$inc`, or `$push`). Only the specific fields declared in the operators are modified; all other existing attributes, nested objects, and arrays within the document remain completely untouched.

`replaceOne()`, in contrast, performs a **complete document replacement**. It takes a raw document shape (without update operators) and completely replaces the entire existing document in storage with the new object, preserving **only** the immutable `_id` field.

The catastrophic bug occurs when a developer building an API endpoint (e.g. `PATCH /users/:id` to update an email address) calls `replaceOne()` with `{ email: "new@example.com" }`. The database wipes out all other fields in the user document—deleting their password hash, roles, profile settings, and creation timestamps—leaving a broken document with only an `_id` and an `email`. Partial updates must always use `updateOne()` with `$set`.

### 2. How does `findOneAndUpdate()` eliminate Read-Modify-Write race conditions in financial or inventory workflows?

A Read-Modify-Write race condition occurs when two concurrent threads attempt to update the same document:
1. Thread A queries `findOne()` and reads `inventory: 1`.
2. Thread B queries `findOne()` simultaneously and also reads `inventory: 1`.
3. Thread A computes `1 - 1 = 0` and writes `updateOne({ stock: 0 })`.
4. Thread B computes `1 - 1 = 0` and writes `updateOne({ stock: 0 })`.
Both customers receive a purchase confirmation, but only one physical item existed (overselling).

`collection.findOneAndUpdate()` eliminates this by executing both the condition evaluation and the data mutation **atomically within MongoDB's WiredTiger storage engine**:
```js
const result = await collection.findOneAndUpdate(
  { _id: itemId, stock: { $gte: 1 } },
  { $inc: { stock: -1 } },
  { returnDocument: 'after' }
);
```
Under the hood, WiredTiger acquires a write lock on that single document. Thread A checks `stock >= 1` (true), decrements stock to 0, and commits. When Thread B executes, it evaluates the condition against the committed state: `stock >= 1` evaluates to **false**. MongoDB modifies zero rows and returns `null`. The race condition is eliminated without distributed Redis locks.

### 3. Why is calling `cursor.toArray()` considered a severe operational hazard on large collections, and how should Node.js applications process queries instead?

When `collection.find()` executes, the MongoDB driver returns an instance of `FindCursor`. The cursor communicates with the database using batch chunking (by default, requesting batches of 101 documents over wire protocol `getMore` commands).

Calling `await cursor.toArray()` instructs the driver to drain every single batch over the network, deserialize the binary BSON into JavaScript objects, and buffer all of them simultaneously into a single, continuous V8 JavaScript array in memory.
- If the collection contains 100,000 records, this can consume hundreds of megabytes or gigabytes of RAM.
- It triggers aggressive V8 garbage collection cycles, freezing the event loop.
- In containerized environments (Kubernetes, AWS ECS), the memory surge exceeds container cgroup limits, causing the kernel to terminate the process via an **OOM (Out-of-Memory) Kill**.

The correct approach is **streaming consumption**:
```js
for await (const doc of cursor) {
  // Processes one document at a time with constant O(1) memory usage
}
```
Async iteration processes documents sequentially, maintaining backpressure so the driver only fetches new batches from the database as previous documents are consumed.

### 4. What is Optimistic Concurrency Control (OCC), and how do you implement it in MongoDB using the Node.js driver?

**Optimistic Concurrency Control (OCC)** is a concurrency management pattern used in high-throughput environments where conflicts are rare, but silent data overwrites must be prevented. Instead of locking database records while a user edits them in a UI, OCC allows concurrent reads and validates version consistency at the moment of update.

Implementation in MongoDB:
1. Every document includes an integer `version` field (e.g. `{ _id: 1, title: "Draft", version: 1 }`).
2. When a client reads the document, the client receives the current version number (`version: 1`).
3. When the client submits an update, the repository includes the version in the update query predicate while atomically incrementing it:
   ```js
   const result = await collection.updateOne(
     { _id: id, version: clientVersion },
     {
       $set: updatedData,
       $inc: { version: 1 }
     }
   );
   ```
4. If another user modified the document in the meantime, the stored `version` is already `2`. The filter `version: 1` fails to match any document (`matchedCount === 0`).
5. The repository detects that the document exists but failed to match, throwing a `ConcurrencyConflictError` that maps to an **HTTP 409 Conflict**, prompting the user to refresh and merge their changes.

---

<nav aria-label="Lecture navigation">

[← Previous: MongoDB Driver Lifecycle and BSON](day-21-mongodb-driver-lifecycle-and-bson.md) | [Roadmap](../node-roadmap.md) | [Next: MongoDB Access Patterns and Document Shape](day-23-mongodb-access-patterns-and-document-shape.md)

</nav>