# Day 25: MongoDB Atomicity, Transactions, and Retries

<nav aria-label="Lecture navigation">

[← Previous: MongoDB Aggregation and Index Awareness](day-24-mongodb-aggregation-and-index-awareness.md) | [Roadmap](../node-roadmap.md) | [Next: MongoDB in Express](day-26-mongodb-in-express.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Differentiate single-document atomicity guarantees from multi-document ACID transactions across replica sets.
- Execute multi-document transactions using `ClientSession` and the `session.withTransaction()` helper with automatic retry handling.
- Propagate the `{ session }` context parameter reliably to every database operation within a transactional boundary.
- Configure Read Concern (`snapshot`, `majority`) and Write Concern (`w: 'majority'`, `j: true`) to balance consistency and latency.
- Handle transient concurrency conflicts (`TransientTransactionError`) and commit timeouts (`UnknownTransactionCommitResult`) gracefully.
- Bridge the architectural gap between database-level ACID transactions and application-level HTTP request idempotency.

---

## Prerequisites

Before diving into transactions and atomicity, review:
- [Day 18: API Contracts, Pagination, and Idempotency](day-18-api-contracts-pagination-and-idempotency.md) for idempotency key lifecycles.
- [Day 21: MongoDB Driver Lifecycle and BSON](day-21-mongodb-driver-lifecycle-and-bson.md) for replica sets and `MongoClient` pooling.
- [Day 22: MongoDB CRUD from Node](day-22-mongodb-crud-from-node.md) for single-document atomic update operators.

---

## Quick Vocabulary Card

| Term | Programming Definition | Anti-Pattern / Misconception |
| :--- | :--- | :--- |
| **Single-Document Atomicity**| A guarantee that any write operation modifying a single document (including nested subdocuments and arrays) is fully atomic in WiredTiger. | Wrapping simple single-document updates in multi-document transactions, incurring unnecessary lock and network latency overhead. |
| **`ClientSession`** | A driver abstraction representing an active logical session on the MongoDB cluster, required for tracking transactions. | Omitting `{ session }` in one of the queries inside a transaction callback, causing that write to execute outside the transaction. |
| **`withTransaction()`** | A higher-order driver helper that manages transaction start, commit, abort, and automatic retries for transient errors. | Writing manual `startTransaction()` / `commitTransaction()` loops without handling `TransientTransactionError` retries. |
| **Read Concern `snapshot`** | A read isolation level providing a consistent, point-in-time snapshot view across multiple collections in a transaction. | Using dirty reads inside financial transactions; reading data modified by concurrent in-flight transactions. |
| **Write Concern `w: 'majority'`**| A write guarantee that the transaction will not acknowledge until written to a majority of replica set nodes. | Committing transactions with `w: 1` in mission-critical billing flows; risking data rollback if the primary node crashes before replication. |
| **`TransientTransactionError`**| An error label indicating that a transaction was aborted due to temporary lock contention or primary election, and can be safely retried. | Treating write conflicts as permanent failures and returning 500 errors to clients instead of retrying the transaction. |

---

## Core Concepts

### 1. Single-Document Atomicity vs Multi-Document Transactions

In MongoDB's WiredTiger storage engine, any modification affecting a single document is **naturally atomic**:

```text
Single Document:
{
  _id: "order_1",
  status: "PAID",
  items: [{ sku: "A", qty: 2 }],
  auditLog: [{ event: "CREATED" }]
}

updateOne(
  { _id: "order_1" },
  {
    $set: { status: "SHIPPED" },
    $push: { auditLog: { event: "SHIPPED", at: new Date() } }
  }
)
▲ WiredTiger guarantees that BOTH 'status' and 'auditLog' update atomically or neither does!
```

However, when business workflows span **multiple independent documents or collections** (e.g. creating an Order record in `orders` and deducting quantity in `inventory`), independent writes lack cross-document atomicity:

```text
Without Transactions:
1. orders.insertOne(order)       ──► SUCCESS (Order created)
2. inventory.updateOne(stock -1) ──► NETWORK DROP / CRASH!
Result: Order exists, but inventory was NEVER decremented! Data is corrupt!
```

---

### 2. Multi-Document ACID Transactions (`session.withTransaction`)

Multi-document transactions (introduced in MongoDB 4.0 for replica sets and 4.2 for sharded clusters) provide full ACID guarantees:

```text
Application Process                                MongoDB Replica Set
┌─────────────────────────────────┐                ┌─────────────────────────────┐
│ 1. client.startSession()        │ ─────────────► │ Allocates Logical Session   │
│                                 │                │                             │
│ 2. session.withTransaction()    │                │                             │
│    ├── orders.insertOne(session)│ ─────────────► │ Staged in WiredTiger memory │
│    └── stock.updateOne(session) │ ─────────────► │ Document locks acquired     │
│                                 │                │                             │
│ 3. Commit Transaction           │ ─────────────► │ All changes written to      │
│                                 │ ◄───────────── │ journal & majority replicas!│
└─────────────────────────────────┘                └─────────────────────────────┘
```

#### Why `withTransaction()` is Mandatory:
Writing manual transaction logic using `session.startTransaction()` and `session.commitTransaction()` requires complex boilerplate to handle transient errors.

The `withTransaction()` helper executes a user callback with automated resilience:
1. If the transaction encounters a **`TransientTransactionError`** (e.g. transient network glitch, primary election, or write conflict), it **automatically restarts the callback from the beginning**.
2. If the commit command fails with an **`UnknownTransactionCommitResult`**, it **automatically retries the commit operation** without re-executing the callback.
3. Automatically rolls back (aborts) the transaction and cleans up the session if unhandled exceptions occur.

---

### 3. The Forgotten Session Parameter Hazard

The single most common bug in MongoDB transactions is omitting the `{ session }` options object on an individual database call:

```js
// ❌ CRITICAL BUG: Missing { session } on inventory update!
await session.withTransaction(async () => {
  // 1. Executed INSIDE transaction:
  await ordersCollection.insertOne(newOrder, { session });

  // 2. ⚠️ Executed OUTSIDE transaction (session omitted!):
  await inventoryCollection.updateOne({ _id: itemId }, { $inc: { stock: -1 } });

  // 3. Simulated error occurs:
  throw new Error('Payment gateway declined');
});
```

- When the error is thrown, the transaction aborts and `ordersCollection.insertOne` is rolled back.
- However, because `inventoryCollection.updateOne` was invoked without `{ session }`, it executed as an independent write that **committed immediately**.
- **Result**: The order was rolled back, but inventory was permanently deducted!
- **Rule**: Every single database call inside a transaction must explicitly pass `{ session }`.

---

### 4. Read Concern & Write Concern in Transactions

Transactions allow fine-grained tuning of consistency and durability guarantees:

```js
const transactionOptions = {
  readPreference: 'primary',
  readConcern: { level: 'snapshot' },
  writeConcern: { w: 'majority', j: true }
};
```

| Setting | Configuration | Guarantees |
| :--- | :--- | :--- |
| **`readConcern: 'snapshot'`** | Snapshot Isolation | Reads a synchronized, point-in-time snapshot of the database across all collections. Prevents dirty reads and non-repeatable reads. |
| **`writeConcern: 'majority'`**| Majority Acknowledgment | Guarantees changes are committed to a majority of replica set nodes before acknowledging. Prevents data loss during failovers. |
| **`j: true`** | On-Disk Journaling | Ensures data is written to the on-disk write-ahead journal before responding, guaranteeing crash durability. |

---

### 5. Transactions vs Application-Level Idempotency

A fundamental architectural principle: **ACID transactions do not solve HTTP network retries**.

```text
Client Application                       API Server                       MongoDB
┌────────────────────┐                   ┌────────────────┐               ┌─────────┐
│ POST /orders       │ ────────────────► │ Executes       │ ────────────► │ COMMITS │
│                    │                   │ Transaction    │ ◄──────────── │ OK!     │
│                    │   Network Drop!   │                │               └─────────┘
│ Client Times Out!  │ ◄───────X──────── │ Response lost! │
│                    │                   └────────────────┘
│ Client Retries:    │
│ POST /orders       │ ────────────────► Executes SECOND Transaction!
│                    │                   Creates DUPLICATE Order!
└────────────────────┘
```

- Even with a 100% ACID transaction, if the network drops before the server can return the HTTP response, the client will retry the request.
- If the server does not enforce an **Idempotency Layer** (using an `Idempotency-Key` or database unique constraint), the retried request will execute a second transaction, creating duplicate orders or billing charges.
- **Rule**: Transactions guarantee database consistency; Idempotency keys guarantee at-most-once business execution.

---

## Code Snippets and Demonstrations

### 1. Robust Multi-Document Transaction Implementation

Implementing an order placement workflow that coordinates orders, inventory, and ledger balances with full retry safety.

```js
// Node.js code
// filename: order-checkout-transaction.mjs
import { ObjectId, Decimal128 } from 'mongodb';

export class CheckoutTransactionService {
  constructor(mongoClient, dbName = 'shop') {
    this.client = mongoClient;
    this.db = mongoClient.db(dbName);
    this.orders = this.db.collection('orders');
    this.inventory = this.db.collection('inventory');
    this.accounts = this.db.collection('accounts');
  }

  /**
   * Executes a multi-document ACID transaction coordinating order creation,
   * inventory deduction, and customer balance withdrawal.
   */
  async executeOrderCheckout({ customerId, itemId, quantity, unitPrice }) {
    const custId = new ObjectId(customerId);
    const itmId = new ObjectId(itemId);
    const totalCost = Decimal128.fromString((unitPrice * quantity).toFixed(2));
    const negativeCost = Decimal128.fromString((-unitPrice * quantity).toFixed(2));

    // 1. Allocate a logical client session
    const session = this.client.startSession();

    const transactionOptions = {
      readPreference: 'primary',
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority', j: true }
    };

    try {
      let createdOrder = null;

      // 2. ✅ withTransaction manages start, commit, abort, and transient retries
      await session.withTransaction(async () => {
        // Step A: Deduct customer balance atomically inside transaction
        const updatedAccount = await this.accounts.findOneAndUpdate(
          { _id: custId, balance: { $gte: totalCost } },
          { $inc: { balance: negativeCost }, $currentDate: { updatedAt: true } },
          { session, returnDocument: 'after' } // MUST PASS { session }!
        );

        if (!updatedAccount) {
          throw new Error('Checkout Failed: Insufficient customer balance');
        }

        // Step B: Deduct inventory stock atomically inside transaction
        const updatedStock = await this.inventory.findOneAndUpdate(
          { _id: itmId, availableStock: { $gte: quantity } },
          { $inc: { availableStock: -quantity }, $currentDate: { updatedAt: true } },
          { session, returnDocument: 'after' } // MUST PASS { session }!
        );

        if (!updatedStock) {
          throw new Error('Checkout Failed: Insufficient inventory stock');
        }

        // Step C: Create order record inside transaction
        const orderDoc = {
          customerId: custId,
          itemId: itmId,
          quantity,
          totalCost,
          status: 'CONFIRMED',
          createdAt: new Date()
        };

        const insertRes = await this.orders.insertOne(orderDoc, { session });
        createdOrder = { id: insertRes.insertedId.toHexString(), ...orderDoc };
      }, transactionOptions);

      console.log(`[Transaction] Order ${createdOrder.id} successfully committed!`);
      return createdOrder;
    } catch (err) {
      console.error('[Transaction] Transaction aborted and rolled back:', err.message);
      throw err;
    } finally {
      // 3. Always release session resources back to pool
      await session.endSession();
    }
  }
}
```

---

### 2. Handling Write Conflicts and Transient Concurrency Errors

Handling lock contention when multiple workers compete for the same document in a transaction.

```js
// Node.js code
// filename: transaction-retry-handler.mjs

/**
 * Demonstrates manual retry loop for transient transaction conflicts
 * when not using session.withTransaction().
 */
export async function executeManualRetryTransaction(client, transactionWorkFn) {
  const session = client.startSession();
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      session.startTransaction({
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' }
      });

      // Execute workload
      const result = await transactionWorkFn(session);

      // Commit transaction
      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction().catch(() => {});

      // Inspect if error has TransientTransactionError label
      const isTransient = err.hasErrorLabel && err.hasErrorLabel('TransientTransactionError');
      if (isTransient && attempt < maxRetries) {
        console.warn(`[Transaction] Transient conflict on attempt ${attempt}. Retrying in 100ms...`);
        await new Promise(r => setTimeout(r, 100));
        continue;
      }

      throw err; // Terminal error or retries exhausted
    } finally {
      if (attempt === maxRetries) {
        await session.endSession();
      }
    }
  }
}
```

---

## Edge Cases and Tricky Scenarios

### 1. The 60-Second Transaction Lifetime Limit

By default, MongoDB enforces a hard maximum transaction lifetime limit of **60 seconds** (`transactionLifetimeLimitSeconds`).
- **The Failure**: If a transaction performs slow third-party HTTP calls, external image processing, or email sending inside the `withTransaction` callback:
  The database engine terminates the transaction, releases all locks, and throws `TransactionExceededLifetimeLimitError`.
- **The Architectural Rule**: **Never perform external network I/O inside a database transaction**. Perform all third-party API calls before initiating the transaction, or defer them to post-commit queue tasks.

### 2. Large Transactions and WiredTiger Cache Pinning

A transaction holds uncommitted write states in the WiredTiger memory cache.
- If a transaction inserts 500,000 documents or updates 50MB of data in a single transaction:
  It pins memory in the WiredTiger cache, preventing dirty pages from being evicted to disk and causing checkpoint stalls for the entire database cluster.
- Keep transactions short, focused, and limited to a few dozen documents. For bulk data operations, process data in bounded batches.

---

## Node.js, JavaScript, and Systems Connections

```text
┌──────────────────────────────────────────────────────────────┐
│ V8 Execution Environment                                     │
│ - Lexical Scopes: session object passed across async ticks   │
│ - Async Exception Propagation (withTransaction catch/retry)  │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ MongoDB Driver Protocol Layer                                │
│ - Logical Session ID (lsid) injected into OP_MSG headers     │
│ - txnNumber: Monotonically increasing transaction sequence   │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ WiredTiger Storage Engine (Replica Set Cluster)              │
│ - MVCC Snapshot Isolation (Point-in-time consistent view)    │
│ - Majority Journaling (j: true, w: 'majority')               │
│ - Two-Phase Commit across cluster primary nodes              │
└──────────────────────────────────────────────────────────────┘
```

- **Logical Session Protocol**: Under the hood, the driver injects an internal `lsid` (Logical Session ID) and a sequential `txnNumber` into the BSON header of every command sent to MongoDB, allowing the server to correlate operations to the active transaction.
- **WiredTiger MVCC**: Snapshot isolation uses Multi-Version Concurrency Control. Reading data does not block writing data, but two concurrent transactions attempting to modify the *same* document will trigger a write conflict.

---

## Hands-On Exercise

### Scenario
A digital wallet API transfers money between two accounts. In production:
1. When transferring $100 from Alice to Bob, the service debits Alice's account, but crashes before crediting Bob's account, causing money to vanish.
2. An engineer attempts to wrap the operations in a transaction, but forgets to pass `{ session }` to the credit operation, causing inconsistent partial rollbacks.
3. When network glitches occur, the system crashes instead of retrying transient write conflicts.

### Buggy Code

```js
// Node.js code
// filename: buggy-wallet-transfer.mjs
const { ObjectId, Decimal128 } = require('mongodb');

// ❌ ANTI-PATTERN: Independent non-transactional writes cause data loss on failure!
async function transferMoney(db, senderId, receiverId, amount) {
  const decAmount = Decimal128.fromString(String(amount));
  const negAmount = Decimal128.fromString(String(-amount));

  // 1. Debit sender
  await db.collection('wallets').updateOne(
    { _id: new ObjectId(senderId) },
    { $inc: { balance: negAmount } }
  );

  // ⚠️ CRASH OCCURS HERE! (Network drop, process killed, or invalid receiver ID)
  if (receiverId === 'invalid') {
    throw new Error('Receiver account invalid');
  }

  // 2. Credit receiver
  await db.collection('wallets').updateOne(
    { _id: new ObjectId(receiverId) },
    { $inc: { balance: decAmount } }
  );
}
```

### Acceptance Criteria
1. Re-implement `transferMoney` using a multi-document ACID transaction via `client.startSession()`.
2. Use `session.withTransaction()` with `readConcern: 'snapshot'` and `writeConcern: 'majority'`.
3. Pass `{ session }` to both the debit and credit database operations.
4. Verify that if the receiver operation fails, the sender's balance remains completely un-debited.
5. Provide a test suite using `node:test` verifying atomic rollback upon simulated failure.

### Solution Code

```js
// Node.js code
// filename: solution-wallet-transfer.mjs
import { ObjectId, Decimal128 } from 'mongodb';

export class WalletTransferService {
  constructor(mongoClient, dbName = 'banking') {
    this.client = mongoClient;
    this.wallets = mongoClient.db(dbName).collection('wallets');
  }

  async transferMoney(senderIdStr, receiverIdStr, amount) {
    const senderId = new ObjectId(senderIdStr);
    const receiverId = new ObjectId(receiverIdStr);
    const decAmount = Decimal128.fromString(String(amount));
    const negAmount = Decimal128.fromString(String(-amount));

    // 1. Allocate Session
    const session = this.client.startSession();

    try {
      // 2. ✅ withTransaction coordinates atomic boundary and auto-retries
      await session.withTransaction(async () => {
        // Step A: Debit sender with invariant check
        const sender = await this.wallets.findOneAndUpdate(
          { _id: senderId, balance: { $gte: decAmount } },
          { $inc: { balance: negAmount }, $currentDate: { updatedAt: true } },
          { session, returnDocument: 'after' } // MUST PASS { session }!
        );

        if (!sender) {
          throw new Error('Transfer aborted: Sender has insufficient funds');
        }

        // Simulate potential business validation failure
        if (receiverIdStr === 'invalid_receiver') {
          throw new Error('Transfer aborted: Receiver account is invalid');
        }

        // Step B: Credit receiver
        const receiver = await this.wallets.findOneAndUpdate(
          { _id: receiverId },
          { $inc: { balance: decAmount }, $currentDate: { updatedAt: true } },
          { session, returnDocument: 'after' } // MUST PASS { session }!
        );

        if (!receiver) {
          throw new Error('Transfer aborted: Receiver account not found');
        }
      }, {
        readPreference: 'primary',
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority', j: true }
      });

      return { success: true };
    } finally {
      // Always cleanup session
      await session.endSession();
    }
  }
}
```

Accompanying test suite:
```js
// Node.js code
// filename: solution-wallet-transfer.test.mjs
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId, Decimal128 } from 'mongodb';
import { WalletTransferService } from './solution-wallet-transfer.mjs';

// Mock Transactional Database Driver
class MockTransactionalClient {
  constructor() {
    this.wallets = new Map();
  }

  db() {
    return {
      collection: () => ({
        findOneAndUpdate: async (filter, update, options) => {
          assert.ok(options.session, 'Missing required { session } parameter!');
          const id = filter._id.toHexString();
          const wallet = this.wallets.get(id);
          if (!wallet) return null;

          if (filter.balance && filter.balance.$gte) {
            if (parseFloat(wallet.balance) < parseFloat(filter.balance.$gte.toString())) {
              return null; // Insufficient funds
            }
          }

          if (update.$inc && update.$inc.balance) {
            wallet.balance = (parseFloat(wallet.balance) + parseFloat(update.$inc.balance.toString())).toFixed(2);
          }
          return wallet;
        }
      })
    };
  }

  startSession() {
    return {
      withTransaction: async (fn) => {
        // Create rollback snapshot
        const snapshot = new Map([...this.wallets.entries()].map(([k, v]) => [k, { ...v }]));
        try {
          await fn();
        } catch (err) {
          // Rollback to snapshot!
          this.wallets = snapshot;
          throw err;
        }
      },
      endSession: async () => {}
    };
  }
}

describe('MongoDB Transaction & Rollback Tests', () => {
  it('rolls back sender debit completely when receiver operation fails', async () => {
    const mockClient = new MockTransactionalClient();
    const service = new WalletTransferService(mockClient);

    const aliceId = new ObjectId().toHexString();
    mockClient.wallets.set(aliceId, { balance: '100.00' });

    // Execute transfer with invalid receiver -> Should throw and rollback!
    await assert.rejects(
      async () => {
        await service.transferMoney(aliceId, 'invalid_receiver', 40);
      },
      /Transfer aborted: Receiver account is invalid/
    );

    // Verify Alice's balance was NOT decremented (Atomic Rollback succeeded!)
    const aliceWallet = mockClient.wallets.get(aliceId);
    assert.equal(aliceWallet.balance, '100.00');
  });
});
```

### Solution Explanation
1. **Atomic Multi-Document Scope**: `session.withTransaction()` guarantees that if an error occurs while crediting the receiver, the sender's debit is rolled back automatically.
2. **Session Parameter Enforcement**: Both `findOneAndUpdate()` calls pass `{ session }`, ensuring they share the same transactional context.
3. **Snapshot Isolation & Majority Durability**: Configuring `snapshot` and `w: majority` prevents dirty reads and protects data against primary failovers.

---

## Summary

- Single-document modifications in MongoDB are naturally atomic in WiredTiger; multi-document consistency across collections requires ACID transactions.
- Use `session.withTransaction()` to manage transaction lifecycle, automatic rollback, and retries for transient errors.
- Every database operation within a transaction must explicitly receive `{ session }`; omitting it causes non-transactional execution.
- Never execute external network I/O (Stripe, HTTP calls) inside a transaction; transactions have a hard 60-second execution limit.
- Database transactions provide ACID isolation but do not solve client network retries; pair transactions with an application-level Idempotency Key.

---

## Cheat Sheet

| Directive / Option | Configuration | Primary Responsibility |
| :--- | :--- | :--- |
| **Start Session** | `const session = client.startSession()` | Allocates logical session for transaction tracking |
| **Transaction Helper** | `session.withTransaction(fn, opts)` | Automatic commit, rollback, and transient error retry |
| **Session Parameter** | `{ session }` in options | Links individual query to active transaction boundary |
| **Snapshot Isolation** | `readConcern: { level: 'snapshot' }` | Point-in-time consistent view across collections |
| **Majority Durability** | `writeConcern: { w: 'majority', j: true }` | Commits to majority nodes and journal before ACK |
| **End Session** | `await session.endSession()` | Frees session resources back to driver pool |

### Common Pitfalls
- **Omitting `{ session }` on queries**: Causes operations to execute outside the transaction, breaking atomicity.
- **Executing external API calls inside transactions**: Risk aborts due to the 60-second transaction lifetime limit.
- **Assuming transactions eliminate double charges**: Transactions do not prevent duplicate retried HTTP requests; pair with idempotency keys.
- **Using transactions where single-document updates suffice**: Introduces unnecessary lock contention and latency.

---

## Interview Questions

### 1. What does "Single-Document Atomicity" mean in MongoDB, and in what scenarios does an application require multi-document transactions?

In MongoDB, **Single-Document Atomicity** means that any write operation modifying a single document—regardless of whether it updates top-level fields, embedded subdocuments, or arrays—is guaranteed to be completely atomic by the WiredTiger storage engine. Either all modifications within that single document are committed, or none are. Readers with `readConcern: "local"` or `"majority"` will never observe partial updates to a single document.

An application requires **Multi-Document ACID Transactions** when a business invariant spans **multiple independent documents or separate collections** that must change together:
- **Financial Ledger Transfers**: Debiting Account A in the `accounts` collection and crediting Account B in the same collection.
- **Order Placement with Inventory**: Inserting a new order in `orders` while decrementing stock in `inventory`.
- **Relational Integrity**: Deleting a user in `users` and cascading removal across `posts` and `comments`.
If any operation in the sequence fails, transactions guarantee that all changes are rolled back, preventing orphaned or inconsistent records.

### 2. What happens if a developer omits the `{ session }` parameter on a database query inside `session.withTransaction()`?

If `{ session }` is omitted from any database query inside a transaction callback:
```js
await session.withTransaction(async () => {
  await collectionA.insertOne(docA, { session });
  await collectionB.insertOne(docB); // OMITTED!
  throw new Error();
});
```
The query without `{ session }` executes as an **independent, non-transactional write operation** outside the logical session.
1. It immediately commits to the database independently of the transaction.
2. When the error is thrown, the transaction aborts and rolls back `collectionA.insertOne`.
3. However, `collectionB.insertOne` was already permanently committed and **cannot be rolled back**.
This results in silent data corruption and broken invariants. Every single database command within `withTransaction` must explicitly include `{ session }`.

### 3. What is the difference between a `TransientTransactionError` and an `UnknownTransactionCommitResult`, and how does `session.withTransaction()` handle them?

Both error labels represent transient failure modes in distributed MongoDB transactions:

1. **`TransientTransactionError`**:
   - **Cause**: Occurs *during* the execution of operations inside the transaction before the commit is acknowledged. Common causes include temporary write conflicts (two transactions updating the same document concurrently), primary node step-downs, or momentary network dropouts.
   - **Handling**: The transaction is aborted. `withTransaction()` intercepts this label and **automatically restarts the entire transaction callback from the beginning**, re-fetching data and re-applying modifications up to a default timeout.

2. **`UnknownTransactionCommitResult`**:
   - **Cause**: Occurs *during* the commit phase (`commitTransaction`). The client sent the commit command, but the network connection dropped before the server could acknowledge the response. The client does not know whether the primary committed the transaction or crashed before doing so.
   - **Handling**: `withTransaction()` intercepts this label and **safely retries the `commitTransaction` command** against the replica set. Because commits are idempotent at the server level, retrying the commit confirms whether the transaction was committed without re-running the application callback.

### 4. Why is executing an external third-party API call (e.g. Stripe payment request) inside a MongoDB transaction considered a severe architectural defect?

Executing third-party HTTP calls inside a database transaction creates two major system risks:

1. **Transaction Lifetime Exceeded (60-Second Limit)**:
   - MongoDB enforces a default `transactionLifetimeLimitSeconds` of **60 seconds**.
   - If the third-party payment gateway experiences network lag or takes 65 seconds to respond, MongoDB's server automatically aborts the transaction, rolls back all database modifications, and releases locks.
   - When the HTTP call finally succeeds, the database state was already rolled back, resulting in a customer being charged with no corresponding order in the database.

2. **WiredTiger Lock Contention and Cache Pinning**:
   - While a transaction is open waiting on the external HTTP request, it holds write locks on modified documents and pins dirty pages in the WiredTiger RAM cache.
   - Any other concurrent user or background worker attempting to update those same documents is blocked, causing massive connection pool exhaustion and cascading API latency across the entire cluster.

**The Solution**: Execute the external payment call first, or commit the order in a `PENDING_PAYMENT` state within a fast transaction (<10ms), and handle payment processing asynchronously via background workers or webhooks.

---

<nav aria-label="Lecture navigation">

[← Previous: MongoDB Aggregation and Index Awareness](day-24-mongodb-aggregation-and-index-awareness.md) | [Roadmap](../node-roadmap.md) | [Next: MongoDB in Express](day-26-mongodb-in-express.md)

</nav>