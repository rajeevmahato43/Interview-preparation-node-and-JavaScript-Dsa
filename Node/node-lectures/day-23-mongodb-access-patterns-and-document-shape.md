# Day 23: MongoDB Access Patterns and Document Shape

<nav aria-label="Lecture navigation">

[← Previous: MongoDB CRUD from Node](day-22-mongodb-crud-from-node.md) | [Roadmap](../node-roadmap.md) | [Next: MongoDB Aggregation and Index Awareness](day-24-mongodb-aggregation-and-index-awareness.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Apply the core NoSQL data modeling rule: **Data that is queried together should be stored together**.
- Evaluate the technical tradeoffs between **Embedding** (denormalized, single-document atomicity) and **Referencing** (normalized, cross-collection links) across 1-to-1, 1-to-Few, 1-to-Many, and 1-to-Squillions relationships.
- Guard against the **Unbounded Array Anti-Pattern** and prevent hitting MongoDB's hard 16MB BSON document limit.
- Implement production schema patterns: the **Subset Pattern**, the **Extended Reference Pattern**, the **Bucket Pattern**, and the **Schema Versioning Pattern**.
- Architect non-blocking, zero-downtime schema evolution in Node.js using polymorphic document adapters and `$jsonSchema` collection validation.
- Minimize WiredTiger cache churn and document fragmentation caused by dynamic document growth.

---

## Prerequisites

Before diving into document design, review:
- [Day 18: API Contracts, Pagination, and Idempotency](day-18-api-contracts-pagination-and-idempotency.md) for cursor pagination and sub-resource modeling.
- [Day 21: MongoDB Driver Lifecycle and BSON](day-21-mongodb-driver-lifecycle-and-bson.md) for BSON size limits, `ObjectId`, and `Decimal128`.
- [Day 22: MongoDB CRUD from Node](day-22-mongodb-crud-from-node.md) for `$push`, `$addToSet`, and atomic single-document updates.

---

## Quick Vocabulary Card

| Term | Programming Definition | Anti-Pattern / Misconception |
| :--- | :--- | :--- |
| **Embedding** | Storing related sub-entities directly inside the parent document as nested BSON objects or arrays. | Embedding unbounded collections (e.g. storing all user activity logs in an array inside the `User` document). |
| **Referencing** | Storing the `_id` of a related document in another collection, resolved via application joins or `$lookup`. | Normalizing all entities into separate tables (3NF style) as if MongoDB were a relational database, requiring multiple round-trips for every query. |
| **Unbounded Array** | An array within a document that grows indefinitely over time without a fixed maximum capacity. | Pushing comments or audit entries into a document array forever; eventually breaches the 16MB BSON limit and causes severe WiredTiger cache thrashing. |
| **16MB BSON Limit** | The hard maximum size limit for any single document in MongoDB, designed to prevent RAM monopolization. | Assuming documents can be arbitrarily large; large documents degrade disk I/O, network bandwidth, and memory caches. |
| **Subset Pattern** | Embedding only the most frequently accessed subset of data (e.g. top 5 reviews) in the main document, storing the rest in a separate collection. | Loading a product document containing 10,000 embedded customer reviews just to display the product title and price. |
| **Extended Reference** | Denormalizing a few immutable or slow-changing fields from a referenced entity directly into the host document. | Executing a separate database lookup to fetch a customer's name for every order in a dashboard listing. |

---

## Core Concepts

### 1. Relational vs Document Modeling Philosophy

In relational modeling, schemas are designed to mirror entity relationships in Third Normal Form (3NF), independent of specific application queries. In MongoDB, schemas are designed **exclusively around application access patterns**:

```text
Relational (3NF Normalization):
┌────────────┐        ┌─────────────┐        ┌────────────┐
│ Users      │ ───►   │ UserRoles   │  ◄───  │ Roles      │
└────────────┘        └─────────────┘        └────────────┘
Requires 2 SQL JOINs on every read!

MongoDB Document Modeling:
┌─────────────────────────────────────────────────────────┐
│ User Document                                           │
│ { _id: 1, name: "Alice", roles: ["admin", "editor"] }   │
└─────────────────────────────────────────────────────────┘
Single B-Tree index seek! Entire user profile read in 1ms!
```

#### The Cardinal Rules of Document Design:
1. **Model for Read/Write Frequency**: If you read data together in 90% of requests, store it together in one document.
2. **Single-Document Atomicity**: MongoDB guarantees ACID transactions on single documents out-of-the-box. Designing documents to contain the entire transactional boundary eliminates the need for expensive multi-document distributed transactions.
3. **Avoid Duplicating Volatile Data**: Denormalize data only if it is immutable or rarely updated. Denormalizing fields that change every second creates massive write amplification.

---

### 2. The Relationship Cardinality Decision Matrix

Choosing between Embedding and Referencing is determined by relationship cardinality and data lifecycle:

```text
Relationship Cardinality Guide:
├── 1-to-1 (e.g. User -> Preferences) ──────────────► EMBED
├── 1-to-Few (bounded, < 50 items, e.g. Post -> Tags) ─► EMBED
├── 1-to-Many (100–1000 items, e.g. Order -> Items) ─► EMBED (if bounded) OR REFERENCE
└── 1-to-Squillions (unbounded, e.g. Sensor -> Logs) ──► PARENT REFERENCE (Child points to Parent)
```

| Relationship Type | Example | Recommended Pattern | Architectural Rationale |
| :--- | :--- | :--- | :--- |
| **One-to-One** | User & UserSettings | **Embed** | Loaded together on every session; single read operation. |
| **One-to-Few** | Product & ImageURLs | **Embed** | Fixed small array (<10 items); bounded size. |
| **One-to-Many** | Order & LineItems | **Embed** | Orders have bounded items (<100); frozen snapshot at time of sale. |
| **One-to-Squillions**| Device & SensorReadings | **Parent Reference** | Unbounded stream; readings store `{ deviceId: id }`. Avoids 16MB document cap. |
| **Many-to-Many** | Authors & Books | **Two-Way Reference** | Store array of IDs on both sides: `authorIds: []`, `bookIds: []`. |

---

### 3. The 16MB Limit and the Unbounded Array Anti-Pattern

MongoDB enforces a strict **16MB limit per BSON document**. 

While 16MB sounds large for text, embedding arrays that grow continuously over time (such as comments, notification logs, chat messages, or analytics events) causes catastrophic performance degradation long before hitting 16MB:

```text
WiredTiger Storage Engine
┌─────────────────────────────────────────────────────────────┐
│ Document (Initial Size: 2KB)                                │
│ Appending items via $push causes document to grow:           │
│ 2KB -> 4KB -> 16KB -> 64KB -> 256KB -> 2MB...                │
│                                                             │
│ Every growth cycle:                                         │
│ 1. Allocates new disk space and copies existing bytes       │
│ 2. Causes memory fragmentation in WiredTiger cache          │
│ 3. Rewrites index pointers                                  │
│ 4. Slows down all concurrent readers and writers            │
└─────────────────────────────────────────────────────────────┘
```

#### Production Rule:
If an array can grow without an explicit, enforced upper bound, **never embed it**. Store the items in a separate collection where each item contains a reference to the parent document (`parentId`).

---

### 4. Advanced Production Design Patterns

#### Pattern A: The Subset Pattern
Addresses the problem of large documents with cold data (e.g., e-commerce products with 5,000 reviews):
- **The Design**: Embed only the **10 most recent reviews** inside the product document.
- **The Benefit**: The product page renders in a single database read without loading 5,000 reviews.
- **Handling Overflow**: When a user clicks "View All Reviews", query the dedicated `reviews` collection with cursor pagination.

#### Pattern B: The Extended Reference Pattern
Avoids expensive joins for frequently accessed, slow-changing metadata:
- **The Design**: Instead of storing just `customerId: ObjectId("...")` in an Order document, store an embedded snapshot:
  ```json
  {
    "_id": "ord_101",
    "total": 150.00,
    "customer": {
      "id": "usr_99",
      "name": "Jane Doe",
      "shippingAddress": "123 Main St, New York, NY"
    }
  }
  ```
- **The Benefit**: Invoices and order history dashboards load instantly without querying the `users` collection. Even if Jane Doe changes her name next year, historical orders retain the legal recipient at the time of purchase.

#### Pattern C: The Schema Versioning Pattern
Supports continuous, zero-downtime application deployments without running blocking offline database migration scripts:
- **The Design**: Add a `schemaVersion: 1` field to every document.
- **The Migration Strategy**: When an API reads a document with `schemaVersion === 1`, a Node.js adapter mutates it in memory to version 2, and asynchronously updates the database record with the new format and `schemaVersion: 2` (Lazy Migration).

---

## Code Snippets and Demonstrations

### 1. The Extended Reference Pattern for E-Commerce Orders

Storing an immutable customer snapshot inside an order document.

```js
// Node.js code
// filename: extended-reference-order.mjs
import { ObjectId, Decimal128 } from 'mongodb';

export class OrderService {
  constructor(db) {
    this.orders = db.collection('orders');
    this.users = db.collection('users');
  }

  async placeOrder(userId, lineItems) {
    // 1. Fetch user to obtain current snapshot
    const user = await this.users.findOne({ _id: new ObjectId(userId) });
    if (!user) throw new Error('User not found');

    // Calculate total
    let totalCents = 0;
    for (const item of lineItems) {
      totalCents += Math.round(item.price * 100) * item.quantity;
    }

    // 2. ✅ Extended Reference Pattern:
    // Embed only the critical, slow-changing customer attributes needed by the order
    const orderDocument = {
      createdAt: new Date(),
      total: Decimal128.fromString((totalCents / 100).toFixed(2)),
      customerSnapshot: {
        userId: user._id,
        name: user.name,
        email: user.email,
        shippingAddress: user.defaultShippingAddress
      },
      items: lineItems.map(item => ({
        productId: new ObjectId(item.productId),
        title: item.title,
        unitPrice: Decimal128.fromString(item.price.toFixed(2)),
        quantity: item.quantity
      })),
      status: 'PLACED'
    };

    const res = await this.orders.insertOne(orderDocument);
    return { orderId: res.insertedId.toHexString(), ...orderDocument };
  }
}
```

---

### 2. The Subset Pattern: Bounded Embedded Reviews

Embedding the 5 most recent reviews in the Product document while storing all historical reviews in a separate collection.

```js
// Node.js code
// filename: subset-pattern-reviews.mjs
import { ObjectId } from 'mongodb';

export class ReviewService {
  constructor(db) {
    this.products = db.collection('products');
    this.reviews = db.collection('reviews');
  }

  async addReview(productId, { author, rating, comment }) {
    const prodId = new ObjectId(productId);
    const newReview = {
      _id: new ObjectId(),
      productId: prodId,
      author,
      rating: Number(rating),
      comment,
      createdAt: new Date()
    };

    // 1. Persist full review in dedicated unbounded collection
    await this.reviews.insertOne(newReview);

    // 2. ✅ Subset Pattern: Maintain a bounded array of the 5 most recent reviews in Product
    await this.products.updateOne(
      { _id: prodId },
      {
        $inc: { reviewCount: 1, ratingSum: newReview.rating },
        $push: {
          recentReviews: {
            $each: [{
              reviewId: newReview._id,
              author: newReview.author,
              rating: newReview.rating,
              comment: newReview.comment.slice(0, 150), // Trim preview
              createdAt: newReview.createdAt
            }],
            $sort: { createdAt: -1 }, // Keep newest first
            $slice: 5                 // Strictly cap array at 5 elements!
          }
        }
      }
    );

    return newReview;
  }
}
```

---

### 3. Non-Blocking Schema Versioning Adapter in Node.js

Handling multiple document schema generations simultaneously without breaking legacy data.

```js
// Node.js code
// filename: schema-versioning-adapter.mjs

export class UserDocumentAdapter {
  /**
   * Adapts documents of any historical schema version to the current V2 application contract.
   */
  static toCurrentDomainEntity(rawDoc) {
    const version = rawDoc.schemaVersion || 1;

    if (version === 1) {
      // Version 1 had separate 'firstName' and 'lastName'
      return {
        id: rawDoc._id.toHexString(),
        fullName: `${rawDoc.firstName || ''} ${rawDoc.lastName || ''}`.trim(),
        email: rawDoc.email,
        tier: rawDoc.isVip ? 'PREMIUM' : 'STANDARD',
        schemaVersion: 2 // Upgraded in memory
      };
    }

    if (version === 2) {
      // Version 2 already has 'fullName' and 'tier'
      return {
        id: rawDoc._id.toHexString(),
        fullName: rawDoc.fullName,
        email: rawDoc.email,
        tier: rawDoc.tier,
        schemaVersion: 2
      };
    }

    throw new Error(`Unsupported document schema version: ${version}`);
  }

  /**
   * Lazy Migration: Upgrades document in database asynchronously upon read.
   */
  static async lazyUpgradeIfNecessary(usersCollection, rawDoc) {
    if ((rawDoc.schemaVersion || 1) < 2) {
      const modernized = UserDocumentAdapter.toCurrentDomainEntity(rawDoc);
      
      // Fire-and-forget update or await in background
      usersCollection.updateOne(
        { _id: rawDoc._id, schemaVersion: rawDoc.schemaVersion || 1 },
        {
          $set: {
            fullName: modernized.fullName,
            tier: modernized.tier,
            schemaVersion: 2
          },
          $unset: { firstName: '', lastName: '', isVip: '' }
        }
      ).catch(err => console.error('[Migration] Lazy upgrade failed:', err.message));
    }
  }
}
```

---

## Edge Cases and Tricky Scenarios

### 1. Document Relocation Thrashing in WiredTiger

When an embedded array expands:
- WiredTiger initially allocates disk space based on document size.
- If repeated `$push` operations cause the document to outgrow its allocated page slot, the storage engine must allocate a new chunk of disk, copy the entire document over, update all B-Tree collection index pointers, and free the old slot.
- **The Symptom**: A write that should take 0.5ms suddenly takes 50ms, causing database CPU spikes and checkpoint stalls.
- **The Defense**: Always use `$slice` to keep embedded arrays strictly bounded (e.g. `$slice: 10`), or use parent-referencing in a separate collection.

### 2. Multi-Document Data Inconsistency in Extended References

When using the Extended Reference Pattern (e.g. embedding `customer.name` inside `orders`):
- If the customer later changes their legal name, should all historical orders be updated?
- **The Business Decision**: In e-commerce, historical invoices **should not** be updated; the invoice is a historical legal snapshot.
- However, if the denormalized data represents live state (e.g. `productTitle`), you must either run an asynchronous worker to update existing references or avoid denormalizing that specific field.

---

## Node.js, JavaScript, and Systems Connections

```text
┌──────────────────────────────────────────────────────────────┐
│ V8 Memory Management                                         │
│ - Compact document schemas minimize Node.js heap consumption │
│ - Bounded array slices prevent large object allocations      │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ MongoDB Wire Protocol & BSON Parser                          │
│ - Enforces strict 16MB per-document size limit               │
│ - Skips unprojected fields via length-prefixed BSON bytes    │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ WiredTiger Storage Engine                                    │
│ - Single-document MVCC write locks                           │
│ - B-Tree leaf allocation & fragmentation churn               │
└──────────────────────────────────────────────────────────────┘
```

- **WiredTiger Cache**: Reading a 16MB document occupies 16MB of precious WiredTiger cache memory, evicting hundreds of smaller index pages and degrading entire cluster performance.
- **Network Bandwidth**: Embedding large arrays forces every simple `findOne()` to transfer megabytes of wire bytes over the network unless explicit field projections are applied.

---

## Hands-On Exercise

### Scenario
A social blog platform experiences severe database degradation as posts become popular:
1. Every time a user comments, the API `$push`es the comment into a `comments` array inside the `posts` collection. Viral posts with 20,000 comments breach 10MB in size, slowing down homepage article listings and risking the 16MB limit.
2. In user profile queries, fetching a user requires 4 separate database round-trips to look up address, preferences, and social links from 4 different normalized collections.

### Buggy Code

```js
// Node.js code
// filename: buggy-blog-schema.mjs
const { ObjectId } = require('mongodb');

// ❌ ANTI-PATTERN 1: Unbounded array inside post document!
async function addComment(db, postId, commentData) {
  // Pushes into an array that can grow to thousands of elements!
  await db.collection('posts').updateOne(
    { _id: new ObjectId(postId) },
    { $push: { comments: { id: new ObjectId(), text: commentData.text, author: commentData.author } } }
  );
}

// ❌ ANTI-PATTERN 2: Relational over-normalization requires 4 separate queries for 1 user!
async function getCompleteUserProfile(db, userId) {
  const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
  const address = await db.collection('addresses').findOne({ userId: new ObjectId(userId) });
  const preferences = await db.collection('preferences').findOne({ userId: new ObjectId(userId) });
  const social = await db.collection('social_links').findOne({ userId: new ObjectId(userId) });

  return { ...user, address, preferences, social };
}
```

### Acceptance Criteria
1. Re-model the blog post and comments architecture:
   - Separate full comments into a dedicated `comments` collection (Parent Referencing).
   - Use the **Subset Pattern** on `posts`, capping embedded `recentComments` at 3 items using `$push`, `$slice`, and `$sort`.
2. Consolidate the 1-to-1 user profile collections (address, preferences, social) into an **embedded** document structure to satisfy the query in a single database read.
3. Provide a test suite using `node:test` verifying that `recentComments` stays capped at 3 while the full comments collection records all items.

### Solution Code

```js
// Node.js code
// filename: solution-blog-schema.mjs
import { ObjectId } from 'mongodb';

export class BlogDataService {
  constructor(db) {
    this.posts = db.collection('posts');
    this.comments = db.collection('comments');
    this.users = db.collection('users');
  }

  // ✅ FIX 1: Subset Pattern + Separate Collection
  async addComment(postIdStr, { author, text }) {
    const postId = new ObjectId(postIdStr);
    const commentDoc = {
      _id: new ObjectId(),
      postId,
      author,
      text,
      createdAt: new Date()
    };

    // 1. Store in unbounded collection
    await this.comments.insertOne(commentDoc);

    // 2. Maintain bounded subset of 3 newest comments in Post
    await this.posts.updateOne(
      { _id: postId },
      {
        $inc: { commentCount: 1 },
        $push: {
          recentComments: {
            $each: [{
              commentId: commentDoc._id,
              author: commentDoc.author,
              text: commentDoc.text,
              createdAt: commentDoc.createdAt
            }],
            $sort: { createdAt: -1 },
            $slice: 3 // Cap array at 3 items!
          }
        }
      }
    );

    return commentDoc;
  }

  // ✅ FIX 2: Consolidate 1-to-1 data into single embedded document
  async createProfile(userIdStr, { name, email, address, preferences, socialLinks }) {
    const doc = {
      _id: new ObjectId(userIdStr),
      name,
      email,
      // Embedded 1-to-1 subdocuments
      address: {
        street: address.street,
        city: address.city,
        country: address.country
      },
      preferences: {
        theme: preferences.theme || 'dark',
        notificationsEnabled: Boolean(preferences.notificationsEnabled)
      },
      socialLinks: {
        github: socialLinks.github || null,
        twitter: socialLinks.twitter || null
      },
      createdAt: new Date()
    };

    await this.users.insertOne(doc);
    return doc;
  }

  async getCompleteUserProfile(userIdStr) {
    // Single index seek retrieves entire profile!
    return await this.users.findOne({ _id: new ObjectId(userIdStr) });
  }
}
```

Accompanying test suite:
```js
// Node.js code
// filename: solution-blog-schema.test.mjs
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { BlogDataService } from './solution-blog-schema.mjs';

// In-Memory mock database for unit testing
class MockDb {
  constructor() {
    this.postsStore = new Map();
    this.commentsStore = [];
    this.usersStore = new Map();
  }

  collection(name) {
    if (name === 'posts') {
      return {
        updateOne: async (filter, update) => {
          const post = this.postsStore.get(filter._id.toHexString()) || { recentComments: [], commentCount: 0 };
          post.commentCount = (post.commentCount || 0) + (update.$inc?.commentCount || 0);

          if (update.$push?.recentComments) {
            const each = update.$push.recentComments.$each;
            post.recentComments.unshift(...each);
            post.recentComments = post.recentComments.slice(0, 3); // Emulate $slice: 3
          }
          this.postsStore.set(filter._id.toHexString(), post);
        },
        findOne: async (filter) => this.postsStore.get(filter._id.toHexString())
      };
    }
    if (name === 'comments') {
      return {
        insertOne: async (doc) => { this.commentsStore.push(doc); return { insertedId: doc._id }; }
      };
    }
    if (name === 'users') {
      return {
        insertOne: async (doc) => { this.usersStore.set(doc._id.toHexString(), doc); },
        findOne: async (filter) => this.usersStore.get(filter._id.toHexString())
      };
    }
  }
}

describe('MongoDB Access Patterns & Schema Tests', () => {
  it('caps embedded subset at 3 comments while saving all in comments collection', async () => {
    const mockDb = new MockDb();
    const service = new BlogDataService(mockDb);

    const postId = new ObjectId().toHexString();

    // Add 5 comments sequentially
    for (let i = 1; i <= 5; i++) {
      await service.addComment(postId, { author: `User ${i}`, text: `Comment ${i}` });
    }

    // Verify full comments collection has all 5 records
    assert.equal(mockDb.commentsStore.length, 5);

    // Verify post's embedded subset has exactly 3 records
    const post = await mockDb.collection('posts').findOne({ _id: new ObjectId(postId) });
    assert.equal(post.commentCount, 5);
    assert.equal(post.recentComments.length, 3);
    assert.equal(post.recentComments[0].text, 'Comment 5'); // Newest first
  });

  it('retrieves complete embedded user profile in a single read', async () => {
    const mockDb = new MockDb();
    const service = new BlogDataService(mockDb);
    const userId = new ObjectId().toHexString();

    await service.createProfile(userId, {
      name: 'Alice',
      email: 'alice@example.com',
      address: { street: '10th Ave', city: 'Seattle', country: 'USA' },
      preferences: { theme: 'light', notificationsEnabled: true },
      socialLinks: { github: 'alice-dev' }
    });

    const profile = await service.getCompleteUserProfile(userId);
    assert.ok(profile);
    assert.equal(profile.address.city, 'Seattle');
    assert.equal(profile.preferences.theme, 'light');
    assert.equal(profile.socialLinks.github, 'alice-dev');
  });
});
```

### Solution Explanation
1. **Unbounded Growth Prevented**: Full comments are stored as independent documents in `comments`, eliminating the risk of exceeding the 16MB document limit.
2. **Subset Capping**: The `posts` document maintains `recentComments` using `$slice: 3`, allowing instant preview loading without page fragmentation.
3. **Consolidated 1-to-1 Schema**: Storing address, preferences, and social links embedded within the user record reduces database round-trips from 4 to 1.

---

## Summary

- Design MongoDB schemas around application access patterns: data queried together should be stored together.
- Use **Embedding** for 1-to-1 and 1-to-Few bounded relationships. Use **Referencing** for 1-to-Squillions or rapidly growing data.
- Avoid the **Unbounded Array Anti-Pattern**; unbounded growth degrades WiredTiger memory cache and risks breaching the 16MB document limit.
- Apply the **Subset Pattern** to embed a small preview (e.g. 5 recent reviews) while storing full historical lists in a separate collection.
- Apply the **Extended Reference Pattern** to denormalize slow-changing fields, eliminating cross-collection lookups for common reads.
- Use the **Schema Versioning Pattern** (`schemaVersion: 2`) with lazy upgrades in Node.js to achieve zero-downtime database migrations.

---

## Cheat Sheet

| Relationship / Pattern | Modeling Decision | Primary Benefit |
| :--- | :--- | :--- |
| **1-to-1** | Embed in parent document | Eliminates joins; single index seek reads entire entity |
| **1-to-Few (<50)** | Embed array with `$slice` | Bounded size; fast retrieval |
| **1-to-Squillions** | Parent reference in child doc | Prevents document growth and avoids 16MB limit |
| **Subset Pattern** | Embed top $N$ items; rest in separate col | Fast initial page loads without unbounded bloat |
| **Extended Reference** | Denormalize slow-changing keys | Eliminates application joins in dashboard listings |
| **Schema Versioning** | Include `schemaVersion: N` in doc | Zero-downtime, non-blocking lazy schema evolution |

### Common Pitfalls
- **Normalizing into 3NF relational tables**: Destroys MongoDB read performance by requiring multiple network round-trips.
- **Pushing into unbounded arrays indefinitely**: Causes document relocation thrashing and crashes on the 16MB cap.
- **Denormalizing highly volatile data**: Triggers massive write amplification to keep duplicated data in sync.
- **Running offline blocking migration scripts**: Locks database tables and causes downtime during deployments.

---

## Interview Questions

### 1. What is the fundamental difference between relational (3NF) schema design and MongoDB document schema design?

Relational schema design is **entity-driven and normalized** according to Third Normal Form (3NF). Its primary goal is to eliminate data redundancy and prevent update anomalies by ensuring every piece of data is stored in exactly one place, independent of which application queries will read it. When relationships exist, they are resolved via foreign keys and dynamic SQL `JOIN` operations at query time.

MongoDB document design is **access-pattern-driven and denormalized**. The guiding principle is: **"Data that is accessed together should be stored together."** 
- In MongoDB, document boundaries define transactional and operational units.
- Rather than executing multiple joins across tables, related data is embedded directly into a single document so the entire business view can be retrieved from disk and serialized over the network in a **single B-Tree index seek**.
- Redundancy is strategically accepted for immutable or slow-changing data to maximize read throughput and minimize network round-trips.

### 2. What is the "Unbounded Array Anti-Pattern" in MongoDB, and what operational consequences occur when a document grows dynamically?

The **Unbounded Array Anti-Pattern** occurs when an application models a 1-to-Many relationship by continuously appending items (such as log entries, comments, chat messages, or audit trails) into an embedded array inside a single document using `$push` without a hard upper bound.

Operational consequences:
1. **Breaching the 16MB Limit**: MongoDB enforces a hard ceiling of 16MB per BSON document. If the array continues growing, writes eventually throw a fatal `BSONObjectTooLarge` error, permanently corrupting the ability to write to that entity.
2. **Document Relocation Thrashing**: When a document expands beyond its initial allocation on disk, MongoDB's WiredTiger storage engine must allocate a new chunk of disk, copy the entire multi-megabyte document over, update all collection index pointers, and deallocate the old slot. This causes severe disk I/O spikes and checkpoint freezes.
3. **WiredTiger Cache Eviction**: Reading a 10MB document requires loading 10MB into the database RAM cache, prematurely evicting thousands of smaller, high-frequency index pages and degrading overall cluster throughput.

The solution is **Parent Referencing**: store each array element as an independent document in a separate collection referencing the parent ID (`{ parentId: id }`).

### 3. How does the "Subset Pattern" resolve the conflict between fast initial page loads and unbounded historical data?

In high-volume applications like e-commerce or social feeds, users frequently access the main document (e.g. a Product) and only need to see the most recent data (e.g. the 5 newest reviews), while rarely inspecting all 10,000 historical reviews.

The **Subset Pattern** splits the data into two locations:
1. **The Embedded Subset**: Inside the main `Product` document, maintain a strictly bounded array of the **5 most recent reviews** using `$push` with `$slice: 5` and `$sort: { createdAt: -1 }`.
2. **The Complete Collection**: In a dedicated `reviews` collection, persist every review ever submitted, with each review document holding a reference to `productId`.

Benefits:
- The initial product page loads in a single database read, fetching product details and top reviews instantly while keeping the `Product` document small and fast.
- The 16MB limit is never at risk because the embedded array is capped at 5 elements.
- When a user requests "View All Reviews", the application queries the dedicated `reviews` collection using cursor-based pagination.

### 4. How does the "Schema Versioning Pattern" enable zero-downtime database migrations in Node.js backends?

In traditional relational databases, changing a schema (e.g. renaming columns or restructuring relationships) often requires running an offline migration script (`ALTER TABLE`) that can lock tables for hours and require application downtime.

The **Schema Versioning Pattern** enables non-blocking, continuous migrations:
1. **Version Tagging**: Every document includes a `schemaVersion` integer field (e.g. `{ _id: 1, name: "Alice", schemaVersion: 1 }`).
2. **Polymorphic Adapters in Node.js**: When the application deploys version 2 (which changes `name` to `{ first: "Alice", last: "" }`), the Node.js repository includes an adapter function that inspects `schemaVersion`. If it reads a version 1 document, it transforms the data in memory to match the version 2 contract before returning it to the domain service.
3. **Lazy Upgrades**: Upon reading an outdated document, the repository can asynchronously issue an update command (`updateOne({ _id: doc._id }, { $set: { ...v2Fields, schemaVersion: 2 }, $unset: { ...v1Fields } })`) to upgrade the document in the background.

Both legacy and modern documents coexist seamlessly in the same collection, allowing deployments to occur instantly with zero maintenance windows.

---

<nav aria-label="Lecture navigation">

[← Previous: MongoDB CRUD from Node](day-22-mongodb-crud-from-node.md) | [Roadmap](../node-roadmap.md) | [Next: MongoDB Aggregation and Index Awareness](day-24-mongodb-aggregation-and-index-awareness.md)

</nav>