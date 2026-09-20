# Day 21: MongoDB Driver Lifecycle and BSON

<nav aria-label="Lecture navigation">

[Previous: Express Security and HTTP Testing](day-20-express-security-and-http-testing.md) | [Roadmap](../node-roadmap.md) | [Next: MongoDB CRUD from Node](day-22-mongodb-crud-from-node.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain the role of MongoDB's Node.js driver in a backend application.
- Manage one client or a pool correctly in a long-lived Node process.
- Understand BSON and why object IDs, binary data, and native types matter.
- Separate driver, ORM/ODM, application logic, and database-specific concerns.

## Prerequisites

- [Day 04: Process, Configuration, and Lifecycle](day-04-process-configuration-and-lifecycle.md)
- [Day 06: Buffers, Encodings, and Serialization](day-06-buffers-encodings-and-serialization.md)
- [Day 12: Testing, Diagnostics, Observability, and Shutdown](day-12-testing-diagnostics-observability-and-shutdown.md)

## Core Concepts

### 1. MongoDB is a data store, not a Node.js concept

The MongoDB Node driver is a library that lets a Node service speak to MongoDB. It is not the same as the database design or the application service layer.

```js
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI);

async function connect() {
  await client.connect();
  return client.db("app");
}
```

A real service should manage that lifecycle carefully and reuse the client instead of creating a fresh connection for every request.

### 2. BSON is the wire format

MongoDB stores data in BSON, a binary JSON-like format. It supports types such as `ObjectId`, `Date`, `Decimal128`, and binary data that JSON cannot represent directly.

```js
const { ObjectId } = require("mongodb");
const id = new ObjectId();
```

This matters because a document representation in MongoDB is not exactly the same as a plain JavaScript object you might `JSON.stringify()`.

### 3. Client lifecycle and shutdown

The driver should be created once and closed when the process exits or the application is tearing down.

```js
process.on("SIGINT", async () => {
  await client.close();
  process.exit(0);
});
```

A reusable client is much safer than connecting independently per route.

## Detailed Explanations and Traces

### Repository boundary

```js
function createUserRepository({ db }) {
  return {
    async findById(id) {
      return db.collection("users").findOne({ _id: new ObjectId(id) });
    },
  };
}
```

This repository pattern separates database logic from route logic.

### Why driver lifecycle matters

If the app creates a new client per request, it can exhaust connections, increase latency, and complicate shutdown. A shared client with a pool is usually the right design.

## Common Mistakes and Interview Traps

- Creating a MongoClient in every request handler.
- Confusing document shape with JSON shape.
- Assuming every database value survives a plain JSON round-trip unchanged.
- Forgetting shutdown or close behavior under test or process exit.

## Tricky Points

- MongoDB documents are not limited to JSON types.
- `ObjectId` values are not plain strings; they have meaning and are often used as identifiers.
- Mongoose or an ODM is a convenience layer, not a replacement for understanding the driver and the database.

## Practical Exercise

**Goal:** Build a repository factory around a MongoDB client and test graceful shutdown behavior.

**Inputs and outputs:** A repository that finds a user by `_id` and returns a plain public record.

**Constraints:** Reuse a client, close resources carefully, and avoid leaking connections during tests.

**Acceptance criteria:** One client handles repeated repository calls and shutdown closes resources without hanging.

## Summary

- The Node driver connects the application to MongoDB.
- BSON supports types beyond JSON and affects how data is stored and read.
- Driver lifecycle, pooling, and shutdown matter for reliability.
- Repository boundaries keep Node service code maintainable.

## Cheat Sheet

| Concern | Rule |
|---|---|
| Client lifetime | share a client or pool |
| IDs | `ObjectId` is a BSON type |
| Document shape | consider MongoDB-specific types |
| Repository | keep DB logic out of routes |
| Shutdown | close client during graceful stop |

## Interview Questions

1. **Definition:** What is BSON and why do MongoDB drivers care about it?
   - **Expected answer:** BSON is the binary encoding for MongoDB documents and supports types like `ObjectId` and dates.
   - **Follow-up:** Why is this different from plain JSON?

2. **Debugging:** A service suddenly fails under load with many DB connections. What do you check first?
   - **Expected answer:** Client creation per request, pool sizing, and shutdown behavior.
   - **Follow-up:** What makes a shared client safer than per-request clients?

3. **Implementation:** Build a repository module that opens one DB client and exposes a `findById` method.
   - **Expected answer:** It should connect once, use a collection, and map BSON IDs carefully.
   - **Follow-up:** How would you keep the module test-friendly?

4. **Design:** Should an application route directly call the MongoDB driver?
   - **Expected answer:** Usually no; route code should interact with a repository or service boundary.
   - **Follow-up:** What is the cost of hiding the database behind the wrong boundary?

<nav aria-label="Lecture navigation">

[Previous: Express Security and HTTP Testing](day-20-express-security-and-http-testing.md) | [Roadmap](../node-roadmap.md) | [Next: MongoDB CRUD from Node](day-22-mongodb-crud-from-node.md)

</nav>