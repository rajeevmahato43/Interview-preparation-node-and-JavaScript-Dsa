# Day 4: MongoDB from Node.js

## Driver and CRUD

**1. Driver lifecycle**

Reuse one configured `MongoClient` and its pool; close it at shutdown rather than creating one per request.

```js
const client = new MongoClient(uri); // initialize once, reuse across requests
```

**2. BSON and CRUD**

BSON has values beyond JSON; use explicit filters/projections and validate application inputs.

**3. API integration**

Keep persistence behind a repository/service boundary and map database errors to safe API responses.

[Driver](../../Node/node-lectures/day-21-mongodb-driver-lifecycle-and-bson.md) | [CRUD](../../Node/node-lectures/day-22-mongodb-crud-from-node.md) | [Express integration](../../Node/node-lectures/day-26-mongodb-in-express.md)

## Modeling and query performance

**1. Document modeling**

Embed bounded data read/updated with its parent; reference shared, unbounded, or independently queried data.

```text
order + bounded line items -> embed
unbounded event history -> separate collection/reference
```

**2. Aggregation**

Pipeline stages filter, project, group, join, and sort documents; filter early when semantics allow.

**3. Indexes and plans**

Match key order to query filters/sorts; indexes cost storage and write work, and `explain` verifies actual plans.

[Modeling](../../Node/node-lectures/day-23-mongodb-access-patterns-and-document-shape.md) | [Aggregation and indexes](../../Node/node-lectures/day-24-mongodb-aggregation-and-index-awareness.md)

## Atomicity and retries

**1. Atomic writes**

A single-document write is atomic; co-locate fields when access patterns and growth make that model suitable.

**2. Transactions**

Use multi-document transactions when an invariant spans documents; keep the boundary short and database-only.

**3. Retries and concurrency**

Use version checks or transaction retries for conflicts; distinguish transient errors from invalid input/business conflicts.

[Transactions and retries](../../Node/node-lectures/day-25-mongodb-atomicity-transactions-and-retries.md)

## Tricky points

1. **Driver and BSON**

**1.1 Pools**

Creating a client per request defeats connection reuse and can exhaust sockets.

**1.2 BSON types**

Do not assume BSON values serialize exactly like plain JSON values.

2. **Model and query**

**2.1 Unbounded arrays**

Growing embedded lists can exceed size/working-set expectations; use references or bounded subsets.

**2.2 Indexes**

Presence does not guarantee use; check query shape and explain output.

**2.3 Pagination**

Use a stable indexed ordering for cursors; offset pagination cost rises with skipped rows.

3. **Correctness**

**3.1 Atomicity**

Single-document atomicity does not make a multi-document workflow atomic.

**3.2 Transactions**

Do not add them by default; they add coordination and runtime cost.

**3.3 Retrying**

A retry after an uncertain write needs idempotent effect handling, not blind repetition.