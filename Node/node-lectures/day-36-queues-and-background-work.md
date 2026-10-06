# Day 36: Queues and Background Work

<nav aria-label="Lecture navigation">

[Previous: Caching and Rate Limiting](day-35-caching-and-rate-limiting.md) | [Roadmap](../node-roadmap.md) | [Next: Observability and Production Operations](day-37-observability-and-production-operations.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Decouple synchronous HTTP request/response lifecycles from long-running, CPU-bound, or external I/O tasks using asynchronous background queues.
- Explain the distributed systems reality of **At-Least-Once Delivery** and design idempotent consumers to achieve logical exactly-once execution.
- Implement the **Transactional Outbox Pattern** in PostgreSQL to eliminate the dual-write race condition between database mutations and message enqueuing.
- Configure queue lifecycles: Visibility Timeouts (leases), Exponential Backoff retries with Jitter, Poison Pill detection, and Dead-Letter Queues (DLQ).
- Architect production-grade background worker processes in Node.js (e.g., BullMQ / PostgreSQL `SKIP LOCKED`) with worker concurrency throttling and resource limits.
- Implement zero-loss graceful worker shutdowns that pause queue ingestion, allow active jobs to finish or re-lease cleanly, and close broker connections on `SIGTERM`.

---

## Prerequisites

- [Day 11: Worker Threads and Child Processes](day-11-worker-threads-and-child-processes.md) — CPU isolation, event-loop offloading, and IPC.
- [Day 31: PostgreSQL Transactions, MVCC, and Locks](day-31-postgresql-transactions-mvcc-and-locks.md) — Row locks and worker polling via `FOR UPDATE SKIP LOCKED`.
- [Day 34: Deadlines, Retries, and Idempotency](day-34-deadlines-retries-and-idempotency.md) — Idempotent state machines and retry policies.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Production Impact |
|---|---|---|
| **At-Least-Once Delivery** | A messaging guarantee where the broker ensures a message is delivered to a consumer one or more times until explicitly acknowledged (`ACK`). | Network partitions or worker crashes cause message re-deliveries; consumers **must** be idempotent. |
| **Visibility Timeout** | The duration a message is hidden from other workers after being picked up by a consumer, acting as an active processing lease. | If a worker crashes or exceeds the timeout without renewing its lease, the broker redelivers the message to another worker. |
| **Dead-Letter Queue (DLQ)** | A secondary queue storing messages that have exceeded their maximum retry limit without successful acknowledgment. | Isolates poison pill messages, preventing continuous worker retry loops from exhausting cluster capacity. |
| **Transactional Outbox** | Storing outgoing background events directly in an `outbox` database table within the exact same atomic transaction as business data. | Eliminates the dual-write problem: guarantees that an event is queued if and only if the database transaction commits. |
| **Poison Pill Message** | A malformed or unprocessable message that causes worker code to crash or throw an unhandled exception every time it is attempted. | Can crash entire worker clusters in a loop unless bounded retries and DLQs isolate the message. |
| **`SKIP LOCKED` Poller** | A database queue pattern using PostgreSQL's `SELECT ... FOR UPDATE SKIP LOCKED` to lock and retrieve pending jobs concurrently. | Allows building simple, ACID-compliant, zero-dependency background task queues directly inside PostgreSQL. |

---

## Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           SYNCHRONOUS VS ASYNCHRONOUS REQUEST PATH                          │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  1. SYNCHRONOUS ANTI-PATTERN (Tightly Coupled, Fragile, Slow):
  Client ──► HTTP POST /orders ──► Write DB ──► Send Stripe ──► Generate PDF ──► Send Email ──► 200 OK
  [Total Latency: 4,500ms | If Email fails: Entire Order Placement crashes!]

  2. ASYNCHRONOUS DECOUPLED ARCHITECTURE (Resilient, Sub-50ms):
  Client ──► HTTP POST /orders ──► Atomic DB Write (Order + Outbox Event) ──► 202 Accepted
  [Total Latency: 25ms]
                                          │
                                          ▼
                               Background Queue (BullMQ / SQS / Kafka)
                                          │
                ┌─────────────────────────┼─────────────────────────┐
                ▼                         ▼                         ▼
         Worker 1 (Billing)       Worker 2 (Reports)       Worker 3 (Mailer)
         Charges Payment          Generates PDF Invoice    Sends Email Receipt
```

### 1. Request Path vs Background Path

In high-concurrency Node.js APIs, the synchronous HTTP request path must be reserved strictly for operations required to validate and persist the immediate state transition:
- **Keep in the Request Path ($< 50\text{ms}$):** Input parsing, authentication, relational database transaction, state persistence.
- **Move to Background Queues:** Sending emails/SMS, generating PDF invoices, resizing images, third-party webhook dispatching, search engine index updates, and data warehouse analytics syncing.

When moving operations to the background, the HTTP layer returns **`202 Accepted`** with an envelope containing the job ID or resource locator:
```http
HTTP/1.1 202 Accepted
Location: /api/v1/jobs/job_98412
Content-Type: application/json

{
  "status": "ACCEPTED",
  "jobId": "job_98412",
  "message": "Invoice generation queued."
}
```

---

### 2. The Fallacy of Exactly-Once Delivery

A universal misconception in distributed computing is the expectation of "Exactly-Once Message Delivery." 

Due to the **Two Generals' Problem** and network partitions:
1. Worker A pulls Job #101.
2. Worker A executes the job (e.g., charges a credit card).
3. Worker A sends an acknowledgment (`ACK`) message back to the broker.
4. **The network drops!** The broker never receives the `ACK`.
5. The broker's Visibility Timeout expires. The broker assumes Worker A crashed.
6. The broker delivers Job #101 to Worker B!

**Every production queue provides At-Least-Once Delivery.** Achieving logical "Exactly-Once Execution" requires an **Idempotent Consumer**. The consumer must check a persistent idempotency table or unique constraint *before* executing side-effects:

```javascript
// Node.js code
// pattern: Idempotent Consumer Pattern
export async function processOrderJob(job, db) {
  const { orderId, amountCents } = job.data;

  // Step 1: Atomic Check-and-Lock in Database
  const lockAcquired = await db.acquireJobLock(job.id);
  if (!lockAcquired) {
    console.log(`Job ${job.id} already processed or currently locked. Skipping duplicate.`);
    return; // Safe early return: Prevents duplicate execution!
  }

  // Step 2: Execute Side Effect
  await chargePaymentGateway({ orderId, amountCents });

  // Step 3: Mark Job Completed
  await db.markJobCompleted(job.id);
}
```

---

### 3. The Dual-Write Problem and the Transactional Outbox Pattern

A critical vulnerability occurs when an API handler updates the database and immediately calls an external message queue:

```javascript
// Node.js code
// anti-pattern: The Dual-Write Race Condition
export async function placeOrderUnsafe(db, queue, orderData) {
  // Write 1: Database
  const order = await db.insertOrder(orderData);

  // 💥 FAILURE POINT 1: If Node crashes or network drops here:
  // Order is committed to database, but message is NEVER queued!
  // Customer was charged, but invoice/email is never triggered!

  // Write 2: Queue Broker
  await queue.add('SEND_CONFIRMATION', { orderId: order.id });
}
```

The reverse is equally flawed: if `queue.add()` succeeds but `db.insertOrder()` rolls back due to a constraint violation, an email is sent for an order that does not exist.

#### The Transactional Outbox Pattern
The solution is eliminating the dual-write by storing outgoing events in the **same database transaction** as the business mutation:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          THE TRANSACTIONAL OUTBOX PATTERN                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Express API Handler
         │
         ▼
  Single Atomic PostgreSQL Transaction:
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │ 1. INSERT INTO orders (id, customer_id, total) VALUES (...);                           │
  │ 2. INSERT INTO outbox_events (id, aggregate_type, payload, status)                      │
  │    VALUES (gen_random_uuid(), 'ORDER', '{"orderId":"..."}', 'PENDING');                │
  │ 3. COMMIT;                                                                              │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼ (Transaction is 100% ACID compliant and durable)
  Outbox Dispatcher Worker (or CDC Debezium)
         │ Polls 'outbox_events' WHERE status = 'PENDING' FOR UPDATE SKIP LOCKED
         ▼
  Publishes to Queue (BullMQ / RabbitMQ / SQS)
         │ On successful broker ACK:
         ▼
  UPDATE outbox_events SET status = 'PUBLISHED' WHERE id = ...;
```

---

### 4. Queue Lifecycle: Visibility Timeouts and Dead-Letter Queues

A message queue coordinates four distinct lifecycle states:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              MESSAGE QUEUE STATE MACHINE                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  [PUBLISHED] ──► Available in Queue
                       │
                       │ Worker pulls message
                       ▼
                 [PROCESSING] ── (Visibility Timeout Clock Running: e.g. 30s)
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
    Job Succeeds             Job Fails / Throws Error
         │                           │
    Send ACK                         │ Attempt Count < MaxRetries?
         │                    ┌──────┴──────┐
         ▼                    ▼             ▼
    [COMPLETED]            [YES]           [NO]
                     Exponential Backoff    Move to
                     Re-queued in Queue     [DEAD-LETTER QUEUE (DLQ)]
```

1. **Visibility Timeout:** A safety lease. If a worker process abruptly dies (OOM crash or network severed) while processing a job, the visibility timer expires, making the job visible to surviving workers automatically.
2. **Exponential Backoff with Jitter:** Retrying failed jobs immediately will fail repeatedly if an external API is down. Retries must back off: $\text{delay} = \text{base} \times 2^{\text{attempt}} + \text{jitter}$.
3. **Dead-Letter Queue (DLQ):** After $N$ failed attempts (e.g., 5 attempts), the message is evicted to a DLQ. This prevents poison pills from clogging the queue while alerting site reliability engineers to inspect the bug.

---

### 5. PostgreSQL as a Zero-Dependency Queue: `FOR UPDATE SKIP LOCKED`

Before adopting external queue infrastructure (such as RabbitMQ or Kafka), high-scale applications can leverage PostgreSQL directly as an ACID queue using `SKIP LOCKED`:

```javascript
// Node.js code
// pattern: High-throughput job consumer using PostgreSQL SKIP LOCKED
export async function claimNextJob(client) {
  const query = `
    WITH next_job AS (
      SELECT id
      FROM job_queue
      WHERE status = 'PENDING' 
        AND scheduled_at <= NOW()
      ORDER BY priority DESC, scheduled_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    UPDATE job_queue
    SET status = 'PROCESSING',
        locked_at = NOW(),
        attempts = attempts + 1
    FROM next_job
    WHERE job_queue.id = next_job.id
    RETURNING job_queue.id, job_queue.payload, job_queue.attempts;
  `;

  // Multiple concurrent Node.js worker processes can execute this simultaneously:
  // Each worker atomically claims a unique job with ZERO blocking or lock contention!
  const { rows } = await client.query(query);
  return rows[0] ?? null;
}
```

---

## Detailed Explanations and Traces

### Graceful Worker Shutdown Lifecycle

When a worker container is terminated (`SIGTERM`), it must not terminate abruptly mid-job. It must follow a strict drain protocol:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          GRACEFUL WORKER SHUTDOWN SEQUENCE                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

 Step 1: Process intercepts SIGTERM signal.
 Step 2: Pause Queue Consumer:
         - worker.pause() stops polling new messages from Redis/Postgres.
 Step 3: Wait for Active Jobs to Complete:
         - Await active job promises (subject to a grace period, e.g. 25 seconds).
 Step 4: If active jobs cannot finish before grace period:
         - Worker issues NACK or releases visibility lease so another worker picks it up.
 Step 5: Close Broker Connections:
         - await queue.close() terminates Redis/Postgres sockets.
 Step 6: Process exits cleanly with code 0:
         - process.exit(0).
```

---

## Common Mistakes and Interview Traps

### 1. The In-Memory Queue Trap (`EventEmitter` in Production)

Developers often use Node's `EventEmitter` or in-memory arrays as a background queue:
```javascript
// Node.js code
// ❌ CATASTROPHIC PRODUCTION RISK:
app.post('/orders', (req, res) => {
  orderEvents.emit('process-order', req.body); // In-memory!
  res.status(202).send();
});
```
**Production Reality:** If the Node.js process crashes, restarts during deployment, or runs out of memory, **every in-memory event is permanently lost**. Never use in-memory queues for critical business operations. Queues must be durably backed by Redis, PostgreSQL, RabbitMQ, or SQS.

### 2. Holding Database Transactions Across External Network Calls

In queue workers, developers frequently open a database transaction before calling an external HTTP API (e.g., Stripe, Sendgrid). If the external API takes 10 seconds to respond, that database connection remains checked out and holding locks for 10 seconds, quickly exhausting connection pools.
- **Rule:** *Never make external HTTP calls inside an open database transaction.*

---

## Hands-On Exercise: Building a Resilient Background Worker with DLQ

### Scenario

You are implementing a background notification service.
The legacy worker has critical defects:
1. It crashes on poison pill messages, getting stuck in an infinite retry loop.
2. It has no idempotency protection; duplicate job deliveries send duplicate emails.
3. It has no graceful shutdown; redeploying containers terminates active jobs mid-flight and leaves locks dangling.

### Acceptance Criteria

1. Implement an asynchronous queue consumer with:
   - At-Least-Once Delivery and database-backed idempotency verification.
   - Exponential Backoff with Jitter for transient network errors.
   - Maximum attempt threshold (3 attempts); failures beyond 3 must be written to a `dead_letter_queue` table.
2. Implement a `GracefulWorker` class supporting `SIGTERM` interception, pausing ingestion, and awaiting active jobs up to a 10-second timeout.

### Solution Code

```javascript
// Node.js code
import EventEmitter from 'events';

// ==========================================
// 1. RESILIENT BACKGROUND WORKER
// ==========================================

export class BackgroundWorker extends EventEmitter {
  /**
   * @param {import('pg').Pool} pool
   * @param {Object} mailerGateway
   * @param {Object} [logger]
   */
  constructor(pool, mailerGateway, logger = console) {
    super();
    this.pool = pool;
    this.mailer = mailerGateway;
    this.logger = logger;
    this.isRunning = false;
    this.activeJobs = new Set();
  }

  /**
   * Start polling loop
   */
  start() {
    this.isRunning = true;
    this.logger.info('Background worker started polling.');
    this._poll();
  }

  async _poll() {
    while (this.isRunning) {
      try {
        const job = await this._claimNextJob();
        if (!job) {
          // Queue empty: Sleep for 500ms before checking again
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }

        // Track active job execution promise for graceful shutdown
        const jobPromise = this._processJobWithSafety(job);
        this.activeJobs.add(jobPromise);
        jobPromise.finally(() => this.activeJobs.delete(jobPromise));

        await jobPromise;
      } catch (err) {
        this.logger.error('Worker loop encountered error:', err);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  /**
   * Atomically claims next job using SKIP LOCKED
   */
  async _claimNextJob() {
    const query = `
      WITH next_item AS (
        SELECT id
        FROM email_outbox
        WHERE status = 'PENDING' 
          AND (scheduled_at IS NULL OR scheduled_at <= NOW())
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE email_outbox
      SET status = 'PROCESSING',
          attempts = attempts + 1,
          updated_at = NOW()
      FROM next_item
      WHERE email_outbox.id = next_item.id
      RETURNING email_outbox.id, email_outbox.payload, email_outbox.attempts;
    `;
    const { rows } = await this.pool.query(query);
    return rows[0] ?? null;
  }

  /**
   * Safe execution wrapper with idempotency, backoff, and DLQ routing
   */
  async _processJobWithSafety(job) {
    const payload = job.payload;
    const maxAttempts = 3;

    try {
      this.logger.info(`Processing job ${job.id} (Attempt ${job.attempts})`);

      // Step 1: Idempotency Check (Verify email not already sent)
      const idempotencyRes = await this.pool.query(
        `INSERT INTO processed_emails (job_id, recipient, sent_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (job_id) DO NOTHING
         RETURNING job_id;`,
        [job.id, payload.to]
      );

      if (idempotencyRes.rowCount === 0) {
        this.logger.warn(`Job ${job.id} was already processed. Acknowledging immediately.`);
        await this._markJobStatus(job.id, 'COMPLETED');
        return;
      }

      // Step 2: Execute Side-Effect (Network call outside DB transaction)
      await this.mailer.sendEmail({
        to: payload.to,
        subject: payload.subject,
        body: payload.body
      });

      // Step 3: Success Acknowledgement
      await this._markJobStatus(job.id, 'COMPLETED');
      this.logger.info(`Job ${job.id} completed successfully.`);
    } catch (err) {
      this.logger.error(`Job ${job.id} failed on attempt ${job.attempts}:`, err.message);

      if (job.attempts >= maxAttempts) {
        // Exceeded retries: Evict to Dead-Letter Queue
        await this._moveToDeadLetterQueue(job, err.message);
      } else {
        // Retry with Exponential Backoff + Full Jitter
        const baseDelayMs = 1000;
        const exponentialLimit = baseDelayMs * Math.pow(2, job.attempts);
        const jitterDelayMs = Math.floor(Math.random() * exponentialLimit);
        
        await this.pool.query(
          `UPDATE email_outbox
           SET status = 'PENDING',
               scheduled_at = NOW() + ($1 || ' milliseconds')::interval,
               last_error = $2
           WHERE id = $3`,
          [jitterDelayMs, err.message, job.id]
        );
      }
    }
  }

  async _markJobStatus(jobId, status) {
    await this.pool.query(
      `UPDATE email_outbox SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, jobId]
    );
  }

  async _moveToDeadLetterQueue(job, failureReason) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO dead_letter_queue (original_job_id, payload, attempts, failure_reason, failed_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [job.id, job.payload, job.attempts, failureReason]
      );
      await client.query(
        `UPDATE email_outbox SET status = 'FAILED', last_error = $1 WHERE id = $2`,
        [failureReason, job.id]
      );
      await client.query('COMMIT');
      this.logger.warn(`Job ${job.id} moved to DEAD-LETTER QUEUE.`);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Graceful Shutdown Handler
   */
  async stop(timeoutMs = 10000) {
    this.logger.info('Stopping worker. Draining in-flight jobs...');
    this.isRunning = false; // Stop accepting new jobs

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Graceful worker drain timed out')), timeoutMs)
    );

    try {
      // Wait for all currently executing jobs to finish
      await Promise.race([
        Promise.all(Array.from(this.activeJobs)),
        timeoutPromise
      ]);
      this.logger.info('All in-flight jobs completed cleanly.');
    } catch (err) {
      this.logger.error('Worker shutdown timeout forced exit with active jobs:', err.message);
    }
  }
}
```

### Solution Explanation

1. **Deterministic Locking with `SKIP LOCKED`:** The worker fetches and claims pending jobs in a single query using `FOR UPDATE SKIP LOCKED`. Multiple worker processes can run in parallel without blocking each other or claiming duplicate jobs.
2. **Idempotent Side-Effect Guard:** Before sending the email, the worker executes `INSERT INTO processed_emails (...) ON CONFLICT (job_id) DO NOTHING`. If a crash occurred after the email was sent but before completion was recorded, a redelivered job observes that the ID already exists and returns safely without sending a duplicate email.
3. **Dead-Letter Queue Isolation:** When a poison pill job fails 3 times, it is atomically moved to `dead_letter_queue` and marked `'FAILED'` in `email_outbox`, preventing it from blocking subsequent jobs in the queue.
4. **Graceful Draining:** The `stop()` method flips `this.isRunning = false`, preventing new job checkouts, and uses `Promise.all(this.activeJobs)` guarded by a 10-second timeout to allow running jobs to finish cleanly during deployments.

---

## Summary

- Long-running, external, and CPU-intensive work must be offloaded from the synchronous HTTP request path to background queues, responding with `202 Accepted`.
- Distributed queues provide **At-Least-Once Delivery**. Logical exactly-once execution requires **Idempotent Consumers**.
- Solve the dual-write race condition between databases and queues by adopting the **Transactional Outbox Pattern**.
- Manage queue lifecycles using **Visibility Timeouts** (leases), **Exponential Backoff with Full Jitter** on retries, and **Dead-Letter Queues (DLQ)** for poison pills.
- PostgreSQL can operate as a high-concurrency queue using `SELECT ... FOR UPDATE SKIP LOCKED` without adding external broker infrastructure.
- Implement graceful worker shutdowns by pausing queue polling, draining active jobs, and respecting termination deadlines.

---

## Cheat Sheet

| Mechanism | Implementation / Concept | Key Benefit |
|---|---|---|
| **Asynchronous Response** | Return `202 Accepted` with job ID | Sub-50ms API responses; isolates slow work |
| **At-Least-Once Delivery** | Broker redelivers on missing ACK | Prevents lost messages during network drops |
| **Idempotent Consumer** | `INSERT ... ON CONFLICT DO NOTHING` | Prevents duplicate actions when jobs are redelivered |
| **Transactional Outbox** | Insert job in same DB transaction as entity | Eliminates dual-write desync between DB and queue |
| **Visibility Timeout** | Temporary lease (e.g. 30s) on message | Automatically re-queues jobs if worker crashes |
| **Dead-Letter Queue** | Route jobs exceeding max retries to DLQ | Isolates poison pill messages; prevents queue blockage |
| **PostgreSQL Queue** | `SELECT ... FOR UPDATE SKIP LOCKED` | Zero-dependency ACID queue in existing database |
| **Graceful Shutdown** | Set `isRunning = false` $\to$ await active jobs | Prevents partial jobs or dangling locks on deployment |

---

## Interview Questions

### 1. Why is "Exactly-Once Message Delivery" impossible in distributed systems, and how do senior engineers achieve "Logical Exactly-Once Execution"?

In distributed systems, physical "Exactly-Once Message Delivery" is proven impossible due to network unreliability, known as the **Two Generals' Problem**. When a worker node finishes processing a message from a queue, it must send an acknowledgment (`ACK`) back over the network to the broker. If a network partition occurs, a router fails, or the worker process runs out of memory before the broker receives the `ACK`, the broker cannot distinguish between:
1. The worker crashed before starting the job.
2. The worker completed the job, but the network dropped the `ACK`.

To guarantee that messages are never lost, production message brokers default to **At-Least-Once Delivery**. If an acknowledgment is not received within the **Visibility Timeout**, the broker redelivers the message to another worker.

Engineers achieve **Logical Exactly-Once Execution** by pairing At-Least-Once Delivery with an **Idempotent Consumer**:
1. Every message is assigned a globally unique `idempotency_key` or `job_id`.
2. When the consumer receives the message, it attempts to insert this key into an atomic unique store (such as a database unique table: `INSERT INTO processed_jobs (id) VALUES ($1) ON CONFLICT DO NOTHING`).
3. If the insert succeeds, the consumer proceeds to execute the side-effect.
4. If the key already exists, the consumer knows the work was previously executed; it skips the side-effect and acknowledges the message immediately.

---

### 2. What is the Dual-Write Problem when integrating an Express API with an external message queue, and how does the Transactional Outbox Pattern solve it?

The Dual-Write Problem occurs when an application must update a database and publish an event to a message queue within the same logical business action:
```javascript
await db.createOrder(order);
await queue.publish('ORDER_CREATED', order);
```
Because the database and the message queue are two separate distributed systems without a shared distributed transaction coordinator (2PC), it is impossible to commit to both atomically:
- If the database write succeeds, but the application crashes or the network to the queue fails before `queue.publish()` executes, the order exists in the database, but downstream fulfillment services never receive the event.
- If the order is reversed and the event is published first, but the database write fails due to a unique constraint violation, the fulfillment service processes an event for an order that was never created.

The **Transactional Outbox Pattern** solves this by consolidating the action into a single distributed system:
1. An `outbox_events` table is created in the primary database.
2. When the application creates an order, it inserts the order row **and** the event row into `outbox_events` within the **exact same ACID database transaction**.
3. If the transaction commits, both the order and the event are guaranteed to be stored durably. If it rolls back, neither is stored.
4. A separate asynchronous process (an Outbox Poller using `SKIP LOCKED` or a Change Data Capture connector like Debezium reading the database Write-Ahead Log) reads unpublished events from the table, publishes them to the queue, and marks them as published upon receiving broker acknowledgment.

---

### 3. How does PostgreSQL's `SELECT ... FOR UPDATE SKIP LOCKED` enable building a queue, and why was this pattern impractical in older SQL systems?

In older SQL systems or naive relational queries, implementing a task queue required:
```sql
SELECT id FROM jobs WHERE status = 'PENDING' LIMIT 1 FOR UPDATE;
```
If multiple concurrent worker processes executed this query simultaneously, every worker tried to lock the very first row. Worker 1 acquired the lock, while Workers 2, 3, and 4 **blocked and waited** until Worker 1 completed its transaction. This caused severe lock contention, serialized all worker execution, and eliminated concurrency. Attempting to avoid locks by using standard `SELECT` followed by `UPDATE jobs SET status = 'PROCESSING' WHERE id = ...` caused race conditions where multiple workers claimed the same job.

`SELECT ... FOR UPDATE SKIP LOCKED` fundamentally changes this behavior:
When PostgreSQL encounters a row that is already locked by another concurrent transaction, it **silently skips that row** and evaluates the next matching row in the index or table scan.
- Worker 1 executes the query and locks Job 1.
- Worker 2 executes the query simultaneously; it sees Job 1 is locked, skips it, and locks Job 2.
- Worker 3 skips Jobs 1 and 2, locking Job 3.
All workers claim unique jobs concurrently with zero blocking, zero lock contention, and zero race conditions, turning PostgreSQL into a high-throughput, ACID-compliant message queue.

---

### 4. What is a Poison Pill message in a queue architecture, and how does a Dead-Letter Queue (DLQ) protect worker infrastructure?

A **Poison Pill message** is a message whose payload contains unexpected data, corrupted syntax, or edge-case parameters that trigger an unhandled runtime error or crash (e.g., `TypeError`, unhandled JSON parse exception, or out-of-memory error) whenever a worker attempts to process it.

Without protective queue mechanisms, a poison pill causes a devastating failure loop:
1. Worker A claims the message and crashes.
2. Because Worker A crashed, the message is never acknowledged.
3. The broker's Visibility Timeout expires, and the message returns to the queue.
4. Worker B claims the message and crashes.
5. The cycle repeats continuously across every worker in the fleet, causing 100% CPU usage, filling log storage, and starving healthy messages from being processed.

A **Dead-Letter Queue (DLQ)** protects the system:
1. Every message tracks an `attempts` or `delivery_count` integer in its metadata.
2. Each time a worker fails or nacks the message, the broker increments the attempt count.
3. The queue is configured with a maximum retry threshold (e.g., `maxAttempts = 5`).
4. When `attempts >= 5`, the broker moves the poison pill into a dedicated Dead-Letter Queue and removes it from the primary processing queue.
5. Healthy messages continue processing normally, and an automated monitoring alert notifies engineers to inspect the failed message in the DLQ.

---

<nav aria-label="Lecture navigation">

[Previous: Caching and Rate Limiting](day-35-caching-and-rate-limiting.md) | [Roadmap](../node-roadmap.md) | [Next: Observability and Production Operations](day-37-observability-and-production-operations.md)

</nav>