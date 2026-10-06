# Day 4: Async Work, Distributed Coordination, and Resilience

Quick review of main-course lectures 21–26. Covers multi-region replication, exponential backoff with full jitter, circuit breaker state machines, the transactional outbox pattern, distributed locks with fencing tokens, and saga orchestration.

## Multi-region design, retries, and coordination

**1. Multi-region topologies and GeoDNS**

- *Active-Passive:* One primary region serves writes; secondary standby region receives async replication. Fast failover via DNS switch, but idle hardware cost is high and cross-region RPO $> 0$.
- *Active-Active:* Both regions accept reads and writes concurrently. Requires conflict resolution strategies (e.g. CRDTs or Last-Write-Wins based on synchronized clocks) and handles regional data residency (GDPR).

**2. Timeouts, exponential backoff, and circuit breakers**

Prevent cascading system collapse by binding calls with deadlines and avoiding thundering retry stampedes:

```text
-- Exponential Backoff with Full Jitter:
sleep = random_between(0, min(max_backoff, base_backoff * (2 ^ attempt)))
```

- *Circuit Breaker State Machine:*
  - *Closed:* Traffic flows normally; failure rate tracked.
  - *Open:* Failure rate exceeds threshold (e.g. 50%); requests fail fast immediately without calling downstream service.
  - *Half-Open:* After sleep window, limited probe requests are allowed through; if successful, resets to *Closed*; if failed, reverts to *Open*.

```text
[Closed] --(Failure Rate > 50%)--> [Open] --(Timeout Elapsed)--> [Half-Open]
    ^                                                                   |
    +------------------(Probe Requests Succeed)-------------------------+
```

**3. Distributed locks and fencing tokens**

A distributed lock in Redis (`SET lock_key client_uuid NX PX 30000`) is vulnerable if a client pauses during garbage collection (GC pause) while its lock lease expires. Protect backend storage with a monotonic *fencing token*: storage rejects writes if the incoming token is smaller than the highest token observed.

```text
1. Client 1 acquires Lock (Token: 41) -> GC Pause occurs...
2. Lock expires; Client 2 acquires Lock (Token: 42) -> Writes data with Token 42 (OK)
3. Client 1 wakes up -> Attempts write with Token 41 -> Storage rejects (41 < 42)!
```

[Multi-region design](../../SystemDesign/system-design-lectures/day-21-multi-region-design.md) | [Timeouts and retries](../../SystemDesign/system-design-lectures/day-22-timeouts-retries-and-deadlines.md) | [Ordering and coordination](../../SystemDesign/system-design-lectures/day-24-ordering-and-coordination.md)

## Idempotency, outbox patterns, and sagas

**1. The Dual-Write Problem and the Transactional Outbox Pattern**

Writing to a local database and publishing to a message broker in sequence cannot guarantee atomicity: if the application crashes after DB commit but before message publish, data is inconsistent.
*Solution:* Write the domain change and an outbox event into the same database transaction. A separate relay process (or CDC Debezium) tails the outbox table and reliably publishes to the message broker.

```text
BEGIN TRANSACTION;
  INSERT INTO orders (id, user_id, amount) VALUES (101, 1, 99.00);
  INSERT INTO outbox_events (event_id, payload) VALUES ('evt_101', '{"order": 101}');
COMMIT;
-- Dedicated CDC / Polling Relay reads outbox_events -> Publishes to Kafka
```

**2. Rate limiting algorithms and bulkheads**

- *Token Bucket:* Refills tokens at constant rate $R$; bursts allowed up to capacity $B$. Simple and memory efficient.
- *Leaky Bucket:* Discharges requests at fixed outflow rate; smooths out bursts into steady stream.
- *Bulkhead Pattern:* Isolates connection pools, CPU, and thread pools across distinct services so exhaustion in one downstream client does not starve others.

**3. Sagas: Choreography vs Orchestration**

Maintains data consistency across microservices without 2PC locking.
- *Choreography:* Services publish and subscribe to domain events independently. Simple for 2–3 steps, but difficult to track and debug at scale.
- *Orchestration:* A central Saga Orchestrator executes steps sequentially, triggers compensating actions (e.g. `refundPayment()`) if a step fails, and maintains full workflow state in a persistent state machine.

[Idempotency and message delivery](../../SystemDesign/system-design-lectures/day-23-idempotency-and-message-delivery.md) | [Resilience patterns](../../SystemDesign/system-design-lectures/day-25-resilience-patterns.md) | [Sagas and workflows](../../SystemDesign/system-design-lectures/day-26-sagas-and-workflows.md)

## Tricky points

1. **Retries and coordination**
   **1.1 Retry storm amplification:** Retrying non-idempotent operations without jitter or circuit breakers multiplies server load precisely when backends are struggling, causing complete outages.
   **1.2 Distributed locks without fencing:** Relying solely on lock lease timeouts without fencing tokens fails under long VM stalls, GC pauses, or network delays.
   **1.3 Deadline propagation:** If an API gateway sets a 1000ms client timeout, downstream services must pass the remaining deadline; executing work on an already-timed-out request wastes CPU.

2. **Workflows and messaging**
   **2.1 Exactly-once myth:** Message brokers provide *at-least-once* delivery over real networks; consumer handlers must enforce idempotency via unique deduplication keys.
   **2.2 Compensating transaction failure:** Compensating actions in a Saga (e.g. `cancelReservation`) can also fail; compensations must be retryable indefinitely until successful.