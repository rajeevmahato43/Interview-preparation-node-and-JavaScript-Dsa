# Day 25: MongoDB Atomicity, Transactions, and Retries

<nav aria-label="Lecture navigation">

[Previous: MongoDB Aggregation and Index Awareness](day-24-mongodb-aggregation-and-index-awareness.md) | [Roadmap](../node-roadmap.md) | [Next: MongoDB in Express](day-26-mongodb-in-express.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain single-document atomicity and why it matters.
- Decide when a transaction is necessary for multi-document correctness.
- Understand retry and session behavior for MongoDB operations.
- Distinguish application-level idempotency from database atomicity guarantees.

## Prerequisites

- [Day 22: MongoDB CRUD from Node](day-22-mongodb-crud-from-node.md)
- [Day 17: Async Express and Centralized Errors](day-17-async-express-and-centralized-errors.md)
- [Day 18: API Contracts, Pagination, and Idempotency](day-18-api-contracts-pagination-and-idempotency.md)

## Core Concepts

### 1. Single-document write is atomic

MongoDB guarantees that a single document write is atomic at the document level. This means a write either applies as one change or does not apply at all.

### 2. Multi-document correctness needs a transaction

If you need a consistent update across multiple documents, a transaction is often the correct boundary. Examples include money movement, order creation with inventory reduction, or a multi-collection audit record.

```js
const session = client.startSession();

await session.withTransaction(async () => {
  await orders.insertOne({ ... }, { session });
  await inventory.updateOne({ sku }, { $inc: { stock: -1 } }, { session });
});
```

### 3. Retries are not magic

Transient errors and network retries are common. A retry should be safe for the operation. A retry that writes the same side effect twice can be incorrect unless the system is idempotent.

## Detailed Explanations and Traces

### Why atomicity is not the same as full application correctness

A single document can be safely updated, but a service that adds an order and decrements stock in two documents may still be wrong if the second step fails. A transaction is the right boundary when multiple documents must move together.

### Idempotency keys and retry-safe writes

If a client retries a payment request, the server should not create duplicate charges unless the system intentionally deduplicates them. This is an application-level design problem, even in a database that supports transactions.

## Common Mistakes and Interview Traps

- Assuming one write means the whole workflow is safe.
- Retrying non-idempotent writes after a timeout without deduplication.
- Ignoring transaction boundaries or missing session propagation.
- Using a transaction for every operation when a single-document update is enough.

## Tricky Points

- A transaction increases cost, latency, and lock duration.
- Not every multi-step workflow needs a transaction if the system can be designed with compensating writes or idempotent operations.
- Retry safety and transaction safety are related but different concerns.

## Practical Exercise

**Goal:** Design a safe multi-step order creation workflow.

**Inputs and outputs:** Accept an order payload and write both the order and inventory updates.

**Constraints:** Ensure atomicity when both need to succeed together and define retry behavior.

**Acceptance criteria:** The workflow either commits both changes or leaves the system consistent with a clear failure path.

## Summary

- Single-doc writes are atomic; multi-doc workflow correctness needs a deliberate boundary.
- Transactions protect cross-document consistency, while idempotency protects retries.
- Safe retries require a designed operation model, not just automatic reconnection.

## Cheat Sheet

| Concern | Rule |
|---|---|
| Single document | atomic |
| Multi-document correctness | use transaction if needed |
| Retry | safe only when idempotent or deduplicated |
| Sessions | pass through transaction operations |

## Interview Questions

1. **Definition:** What does atomicity mean in MongoDB?
   - **Expected answer:** A single-document write is atomic; the document is either updated or not updated.
   - **Follow-up:** Is that enough for a multi-step order workflow?

2. **Design:** When should a service use a transaction rather than multiple independent writes?
   - **Expected answer:** When multiple documents must change together or the system must maintain a consistent state.
   - **Follow-up:** What is the cost of that tradeoff?

3. **Implementation:** Write a transaction that updates inventory and creates an order record.
   - **Expected answer:** Use a session and `withTransaction`, and handle retries carefully.
   - **Follow-up:** What happens if the second write fails after the first succeeds?

4. **Engineering judgment:** A payment retry arrives after a network timeout. Should the system always retry the database write?
   - **Expected answer:** No. It must deduplicate or make the operation idempotent.
   - **Follow-up:** What if the request is not idempotent by design?

<nav aria-label="Lecture navigation">

[Previous: MongoDB Aggregation and Index Awareness](day-24-mongodb-aggregation-and-index-awareness.md) | [Roadmap](../node-roadmap.md) | [Next: MongoDB in Express](day-26-mongodb-in-express.md)

</nav>