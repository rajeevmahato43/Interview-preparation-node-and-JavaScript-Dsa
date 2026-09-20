# Day 22: MongoDB CRUD from Node

<nav aria-label="Lecture navigation">

[Previous: MongoDB Driver Lifecycle and BSON](day-21-mongodb-driver-lifecycle-and-bson.md) | [Roadmap](../node-roadmap.md) | [Next: MongoDB Access Patterns and Document Shape](day-23-mongodb-access-patterns-and-document-shape.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Perform CRUD operations through MongoDB's Node driver.
- Distinguish filter, update, replacement, and projection choices.
- Map application errors to driver results without losing information.
- Write safe, readable repository methods.

## Prerequisites

- [Day 21: MongoDB Driver Lifecycle and BSON](day-21-mongodb-driver-lifecycle-and-bson.md)
- [Day 16: Express Input Parsing, Validation, and Serialization](day-16-express-input-validation-and-serialization.md)

## Core Concepts

### 1. CRUD means create, read, update, delete

The MongoDB Node driver exposes collection methods such as `insertOne`, `findOne`, `find`, `updateOne`, `replaceOne`, and `deleteOne`.

```js
const { ObjectId } = require("mongodb");

async function createUser(db, userInput) {
  const result = await db.collection("users").insertOne({
    email: userInput.email,
    createdAt: new Date(),
  });

  return result.insertedId;
}
```

### 2. Filter carefully

The filter object decides which documents match. A weak filter can update or delete the wrong records.

```js
await users.updateOne(
  { _id: new ObjectId(userId), deletedAt: null },
  { $set: { lastLoginAt: new Date() } }
);
```

### 3. Replacement vs update operators

- `replaceOne` replaces the whole document, which can remove fields.
- `updateOne` with `$set` makes a partial update.
- `updateMany` can affect many records and must be used carefully.

### 4. Projections keep payloads small

```js
const user = await users.findOne(
  { _id: new ObjectId(id) },
  { projection: { email: 1, createdAt: 1 } }
);
```

This is important for API performance, not just for convenience.

## Detailed Explanations and Traces

### Example repository

```js
function createUserRepository(db) {
  const users = db.collection("users");

  return {
    async create(input) {
      const result = await users.insertOne({ ...input, createdAt: new Date() });
      return { id: result.insertedId, ...input };
    },

    async findById(id) {
      return users.findOne({ _id: new ObjectId(id) });
    },

    async updateProfile(id, patch) {
      const result = await users.updateOne(
        { _id: new ObjectId(id) },
        { $set: patch, $currentDate: { updatedAt: true } }
      );
      return result.modifiedCount;
    },
  };
}
```

The app layer should decide business semantics; the repository should only manage storage-level operations.

## Common Mistakes and Interview Traps

- Using a user-supplied ID without converting or validating it.
- Replacing a document when a partial update is intended.
- Forgetting a filter that excludes soft-deleted or archived records.
- Not checking write result counts or duplicate-key errors.

## Tricky Points

- A successful write is not necessarily the correct write.
- `find` returns a cursor; it is not the full result set until consumed.
- `updateOne` and `replaceOne` have different consequences for fields and indexes.

## Practical Exercise

**Goal:** Implement a repository with create, read, and update methods.

**Inputs and outputs:** Accept a user payload and return the created or updated document with a safe public representation.

**Constraints:** Use filters that require the right document state and no broad update without a precise selection.

**Acceptance criteria:** The repository updates only the intended record and returns meaningful results.

## Summary

- MongoDB CRUD operations are simple to call but require careful filters and semantics.
- Projection, update operators, and document selection decide correctness.
- The app layer should map storage results to API behavior, not hide them.

## Cheat Sheet

| Operation | Use |
|---|---|
| `insertOne` | create a new document |
| `findOne` | fetch one document |
| `find` | iterate many documents |
| `updateOne` | partial update |
| `replaceOne` | full-document replacement |
| `deleteOne` | remove a document |

## Interview Questions

1. **Definition:** What is the difference between `replaceOne` and `updateOne`?
   - **Expected answer:** Replacement deletes the previous document shape; update modifies only provided fields.
   - **Follow-up:** When would a full replace be dangerous?

2. **Trace:** A query updates the wrong record because it used a broad filter. What went wrong?
   - **Expected answer:** The filter was too permissive, so the update matched extra documents.
   - **Follow-up:** How do you guard against that in production code?

3. **Implementation:** Write a safe repository method for updating only a user's profile.
   - **Expected answer:** Use a filter on identity and an update object with `$set`.
   - **Follow-up:** Should you allow arbitrary keys from the request body?

4. **Design:** When should you project fields in MongoDB reads?
   - **Expected answer:** When the client does not need all document fields, to reduce bandwidth and risk.
   - **Follow-up:** What is the tradeoff when you need more data later?

<nav aria-label="Lecture navigation">

[Previous: MongoDB Driver Lifecycle and BSON](day-21-mongodb-driver-lifecycle-and-bson.md) | [Roadmap](../node-roadmap.md) | [Next: MongoDB Access Patterns and Document Shape](day-23-mongodb-access-patterns-and-document-shape.md)

</nav>