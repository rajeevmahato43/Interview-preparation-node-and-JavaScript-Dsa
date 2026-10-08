# Day 4: MongoDB Driver Lifecycle, Modeling, Indexes, and Transactions

Quick review of main-course lectures 21–26. Designed for rapid interview revision: MongoClient connection pooling, BSON types, atomic mutations, schema design (embed vs reference), aggregation pipelines, ESR index rule, and multi-document ACID transactions.

## Driver lifecycle, connection pooling, and BSON

**1. MongoClient singleton and connection pooling**

Initialize `MongoClient` once during application bootstrap and share the instance. Creating a new client per HTTP request exhausts database socket limits and degrades performance. Configure `maxPoolSize` and `minPoolSize`.

```js
import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI, {
  maxPoolSize: 50, // Max concurrent sockets in the connection pool
  minPoolSize: 10, // Maintain warm sockets to avoid connection latency spikes
  serverSelectionTimeoutMS: 5000
});

await client.connect();
export const db = client.db("production");
```

**1.1 BSON types and `ObjectId` conversion**

MongoDB uses BSON (Binary JSON). The default primary key `_id` is an `ObjectId` (12-byte binary). Querying `_id` with a raw string fails to match records; wrap it explicitly with `new ObjectId(id)`.

```js
// Correct: Converted to BSON ObjectId
const user = await db.collection("users").findOne({ _id: new ObjectId(req.params.id) });

// Incorrect: Raw string matches nothing!
const notFound = await db.collection("users").findOne({ _id: req.params.id }); // null
```

[Driver lifecycle and BSON](../../Node/node-lectures/day-21-mongodb-driver-lifecycle-and-bson.md) | [CRUD from Node](../../Node/node-lectures/day-22-mongodb-crud-from-node.md)

## Atomic mutations and schema modeling

**1. Atomic update operators vs Read-Modify-Write**

Never fetch a document, modify it in JavaScript, and save it back; concurrent requests will overwrite each other (lost updates). Use MongoDB's atomic operators: `$set`, `$inc`, `$push`, and `$addToSet`.

```js
// Atomic counter increment: Thread-safe across concurrent API instances
const result = await db.collection("products").findOneAndUpdate(
  { _id: new ObjectId(productId), stock: { $gte: quantity } }, // Optimistic guard
  { $inc: { stock: -quantity } },
  { returnDocument: "after" }
);
if (!result) throw new Error("Insufficient stock or product missing");
```

**2. Embedding vs Referencing (Schema Design)**

Balance read performance against document boundaries. MongoDB imposes a strict **16MB limit** per document.

```text
Embed (1:few, bounded): User profile addresses, line items on an immutable invoice
Reference (1:many, unbounded): E-commerce product reviews, system activity logs
```

```js
// Unbounded 1:N reference pattern (prevents exceeding 16MB document ceiling)
// Logs stored in their own collection with parent ID reference
await db.collection("audit_logs").insertOne({
  accountId: new ObjectId(accountId),
  action: "LOGIN",
  timestamp: new Date()
});
```

[Access patterns and schema shape](../../Node/node-lectures/day-23-mongodb-access-patterns-and-document-shape.md)

## Aggregation pipelines and indexing strategies

**1. Aggregation pipeline optimization**

An aggregation pipeline processes documents through stages: `$match`, `$project`, `$group`, `$sort`, `$lookup`. Always place `$match` and `$sort` at the start of the pipeline to leverage database indexes and filter data early.

```js
// High-efficiency aggregation: filters with index before grouping
const revenuePerCustomer = await db.collection("orders").aggregate([
  { $match: { status: "COMPLETED", createdAt: { $gte: new Date("2026-01-01") } } },
  { $group: { _id: "$customerId", totalSpent: { $sum: "$totalAmount" } } },
  { $sort: { totalSpent: -1 } },
  { $limit: 10 }
]).toArray();
```

**2. Compound indexes and the ESR Rule**

To create optimal compound indexes, order your index keys using the **ESR Rule**:
1. **E**quality: Fields queried with exact matches (`status: "ACTIVE"`).
2. **S**ort: Fields used for ordering (`sort({ createdAt: -1 })`).
3. **R**ange: Fields queried with range operators (`age: { $gte: 21 }`).

```js
// Query: find active users aged >= 21 sorted by createdAt descending
// Optimal Compound Index based on ESR rule:
await db.collection("users").createIndex({
  status: 1,      // 1. Equality
  createdAt: -1,  // 2. Sort
  age: 1          // 3. Range
});
```

**3. Profiling queries with `explain()`**

Verify index utilization using `.explain("executionStats")`. Ensure `stage` reports `IXSCAN` (Index Scan) rather than `COLLSCAN` (Full Collection Scan), and ensure `totalDocsExamined` is close to `nReturned`.

[Aggregation and indexes](../../Node/node-lectures/day-24-mongodb-aggregation-and-index-awareness.md)

## Transactions, write concerns, and Express integration

**1. Multi-document ACID transactions**

MongoDB supports ACID transactions across multiple documents and collections on replica sets using client sessions. Use `session.withTransaction()` for automatic retry on transient commit errors.

```js
const session = client.startSession();
try {
  await session.withTransaction(async () => {
    // Both operations must pass the active session
    await db.collection("accounts").updateOne(
      { _id: fromId },
      { $inc: { balance: -amount } },
      { session }
    );
    await db.collection("accounts").updateOne(
      { _id: toId },
      { $inc: { balance: amount } },
      { session }
    );
  }, {
    readPreference: "primary",
    readConcern: { level: "snapshot" },
    writeConcern: { w: "majority" }
  });
} finally {
  await session.endSession();
}
```

**2. Express repository pattern and teardown**

Decouple Express route handlers from database queries via repository classes. Wire connection teardown to process termination signals (`SIGTERM`).

```js
// Graceful database disconnection
process.on("SIGTERM", async () => {
  console.log("Closing MongoDB connection pool...");
  await client.close();
  process.exit(0);
});
```

[Transactions and atomicity](../../Node/node-lectures/day-25-mongodb-atomicity-transactions-and-retries.md) | [MongoDB in Express](../../Node/node-lectures/day-26-mongodb-in-express.md)

## Tricky points

1. **Driver and queries**

**1.1 String `_id` lookup failure**
Passing `{ _id: "60c72b2f9b1d8b2bad7b4d1a" }` to `findOne()` will return `null` because BSON stores the key as an `ObjectId`. Always convert with `new ObjectId(id)`.

**1.2 Exhausting socket pool on unshared clients**
Calling `new MongoClient()` inside route middleware creates hundreds of separate socket connection pools, rapidly crashing the MongoDB cluster with connection spikes.

2. **Modeling and indexes**

**2.1 The 16MB document size limit crash**
Pushing unbounded activity items or customer messages into an embedded array inside a single document eventually causes updates to throw `BSONObjectTooLarge` once the 16MB ceiling is breached.

**2.2 ESR rule violations causing in-memory sorts**
Placing range fields before sort fields in a compound index prevents MongoDB from using the index for sorting, forcing the database to perform an expensive in-memory sort (`SORT` stage) that fails if memory exceeds 100MB.

3. **Transactions and concurrency**

**3.1 Standalone MongoDB instances reject transactions**
Multi-document transactions require a replica set. Executing `session.withTransaction()` against a standalone local MongoDB instance throws `MongoServerError: Transaction numbers are only allowed on a replica set member`.

**3.2 Write conflicts during concurrent transactions**
If two concurrent transactions modify the same document simultaneously, one will fail with a `WriteConflict` error. Always use `session.withTransaction()` which automatically retries transient write conflicts.