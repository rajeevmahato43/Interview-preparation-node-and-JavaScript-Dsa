# Day 23: MongoDB Access Patterns and Document Shape

<nav aria-label="Lecture navigation">

[Previous: MongoDB CRUD from Node](day-22-mongodb-crud-from-node.md) | [Roadmap](../node-roadmap.md) | [Next: MongoDB Aggregation and Index Awareness](day-24-mongodb-aggregation-and-index-awareness.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain how document shape follows read and write patterns.
- Compare embedding and referencing for common data access patterns.
- Recognize document-growth and schema-evolution tradeoffs.
- Make a defensible choice for a data model under workload assumptions.

## Prerequisites

- [Day 22: MongoDB CRUD from Node](day-22-mongodb-crud-from-node.md)
- [Day 18: API Contracts, Pagination, and Idempotency](day-18-api-contracts-pagination-and-idempotency.md)

## Core Concepts

### 1. MongoDB is schema-flexible, not schema-free

MongoDB allows flexible documents, but that does not mean the application can ignore shape. Good data modeling still matters.

### 2. Embedding vs referencing

Embedding is useful when the data is closely related and frequently read together, such as a product with a small set of attributes or a user profile with a few nested fields.

Reference patterns are useful when documents grow or different contexts need distinct access patterns.

```js
// embedded example
{
  _id: 1,
  name: "Alice",
  addresses: [{ city: "NYC", type: "home" }]
}
```

```js
// referenced example
{
  _id: 1,
  userId: 42,
  orderTotal: 59.99
}
```

### 3. Document growth and bounded arrays

Large arrays can cause document growth problems, expensive updates, and less predictable behavior. Good schema design often prefers bounded arrays or separate collections for large or fast-changing nested sets.

### 4. Access patterns drive data design

The data model should match the read-mostly or write-mostly access patterns: frequent nested reads, fan-out writes, cross-collection joins by application logic, and pagination constraints.

## Detailed Explanations and Traces

### Example decision

A user profile with a few small fields is a good candidate for embedding, but a user with a large history of orders or events may be a poor fit for a single giant document. A separate collection with references keeps the main record smaller and easier to update.

This is not a universal rule. The right model depends on query frequency, writes, data volatility, and consistency needs.

### Schema evolution

MongoDB okay flexibility makes schema evolution easy, but it can also hide data quality issues. The service should define which fields are required, optional, defaulted, or versioned.

## Common Mistakes and Interview Traps

- Thinking "schema-less" means "no design needed."
- Embedding everything to simplify code, ignoring growth and update costs.
- Using deep nesting without considering query patterns and indexing.
- Ignoring validation and application invariants.

## Tricky Points

- A document shape that is convenient for one query can be expensive for another.
- Embedded documents are not free; they affect writes, growth, and consistency.
- Document modeling is a workload tradeoff, not a dogma.

## Practical Exercise

**Goal:** Choose a document shape for a user and orders system.

**Inputs and outputs:** Describe the access patterns, choose either embedding or references, and justify the decision.

**Constraints:** Consider growth, update frequency, and list query behavior.

**Acceptance criteria:** The design explains why the chosen shape fits the expected workload.

## Summary

- MongoDB data modeling is guided by workload and query patterns.
- Embedding and referencing are tradeoffs, not absolutes.
- Document growth and update behavior are as important as query convenience.

## Cheat Sheet

| Concern | Typical choice |
|---|---|
| Related, frequently-read data | embed |
| Large or volatile data | reference |
| Fast-changing nested lists | keep bounded or separate |
| Query-heavy access | design for indexable paths |

## Interview Questions

1. **Definition:** Why is MongoDB schema design not the same as no schema design?
   - **Expected answer:** The database allows document flexibility, but the app still needs predictable arrays, keys, and access patterns.
   - **Follow-up:** What happens when embedded arrays become too large?

2. **Design:** Choose between embedding and referencing for user orders.
   - **Expected answer:** Explain read frequency, write frequency, growth, and whether the order list is bounded.
   - **Follow-up:** What changes if orders are updated frequently?

3. **Implementation:** Design a profile document that can evolve over time without breaking reads.
   - **Expected answer:** Use a versioned or optional field strategy and data validation.
   - **Follow-up:** How do you avoid silent schema drift?

4. **Tradeoff:** When is a large nested array a real smell?
   - **Expected answer:** When the array grows without bound, causes expensive updates, or changes read patterns significantly.
   - **Follow-up:** What would you do instead?

<nav aria-label="Lecture navigation">

[Previous: MongoDB CRUD from Node](day-22-mongodb-crud-from-node.md) | [Roadmap](../node-roadmap.md) | [Next: MongoDB Aggregation and Index Awareness](day-24-mongodb-aggregation-and-index-awareness.md)

</nav>