# Day 42: Capstone and Interview Review

<nav aria-label="Lecture navigation">
  <a href="../system-design-roadmap.md">Roadmap</a> ·
  <a href="day-41-case-study-file-storage.md">Previous: Day 41</a>
</nav>

## What You Will Learn Today

Run a complete design interview for a ticket-booking service while keeping inventory correct under concurrent requests. You will connect requirements, estimates, APIs, data ownership, holds, payment, idempotency, recovery, and operational evidence. The focus is not a prescribed architecture; it is defending a design whose invariants survive retries and races.

## Prerequisites

- [Day 02: A Repeatable Design Interview Method](day-02-design-interview-method.md)
- [Day 04: Estimation and Back-of-the-Envelope Math](day-04-capacity-estimation.md)
- [Day 17: Transactions and Data Integrity](day-17-transactions-and-data-integrity.md)
- [Day 23: Idempotency, Deduplication, and Exactly-Once Claims](day-23-idempotency-and-message-delivery.md)
- [Day 24: Ordering, Coordination, and Distributed Locks](day-24-ordering-and-coordination.md)
- [Day 26: Sagas and Distributed Workflows](day-26-sagas-and-workflows.md)
- [Day 33: SLOs, SLIs, Error Budgets, and Reliability](day-33-slos-and-error-budgets.md)

## Quick Vocabulary Card

- **Invariant:** A condition that must remain true for every valid committed state, including under concurrency.
- **Hold:** A time-limited reservation that temporarily prevents another buyer from acquiring the same inventory.
- **Idempotency key:** A client-supplied identifier that makes retries return one logical result instead of repeating an effect.
- **Compensation:** A new action that counteracts a completed step; it is not necessarily a literal rollback.
- **Reconciliation:** A process that compares records across systems and resolves cases left uncertain by failures.

## Core Concepts

### Interview frame and assumptions

Prompt: design a service for reserving assigned seats and paying for tickets. Assume one region initially, 10 million registered users, a small number of high-demand events, and a sale that may attract 100,000 concurrent buyers. A venue has 20,000 seats. Users can browse availability, hold up to four seats for five minutes, pay, and receive confirmed tickets. Exclude resale, seat recommendations, and multi-region active-active booking.

Requirements: browse, hold/release, pay, confirm, inspect status. Never double-confirm a seat; keep browsing responsive; bound holds; survive retries and payment uncertainty. Browse data may be stale, but holds are authoritative. Start the five-minute clock at commit and define checkout near expiry.

### Capacity and bottleneck estimate

100,000 arrivals over five minutes average 333 requests/second, before repeats and bursts. One event's inventory is a hot key; 20,000 seats are small data volume but high contention. Cache browse reads, never treat them as reservations.

Cache browse views and use transactional inventory for holds. Add a virtual queue/admission control under overload; it supports fairness but does not enforce inventory correctness.

### APIs and data model

```text
GET  /v1/events/{eventId}/availability
POST /v1/holds                 { eventId, seatIds[], idempotencyKey }
POST /v1/bookings/{bookingId}/pay  { paymentMethodToken, idempotencyKey }
GET  /v1/bookings/{bookingId}
POST /v1/holds/{holdId}/release
```

Model `Seat(event_id, seat_id, state, hold_id, hold_expires_at, booking_id)`, `Hold(hold_id, user_id, state, expires_at, idempotency_key)`, `Booking(booking_id, user_id, state, total)`, and `Payment(booking_id, provider_ref, state, idempotency_key)`. Store provider tokens/references, not raw payment credentials.

State the invariants before selecting infrastructure:

1. A seat has at most one active owner: an unexpired hold or a confirmed booking.
2. A confirmed booking references exactly the seats it owns, and each seat references no more than one confirmed booking.
3. Payment capture and booking confirmation are reconciled; a payment is not silently treated as success merely because a client timed out.
4. Retrying a hold or payment request with the same scoped idempotency key does not create a second hold or charge.

Use a relational transaction and unique keys. Atomically claim seats only when available or expired by database time; if any claim fails, roll back the whole set. Persist hold and ownership together. Lock/update syntax depends on database isolation; test concurrency. Never use unprotected read-then-write.

### Hold, payment, and confirmation flow

The service checks the idempotency key, claims all seats transactionally, and persists a five-minute expiry. This hold is authoritative even if cache lags. The expiry worker cleans old holds; every new claim must also test expiry.

Create a pending booking and authorize with a stable provider key. On success, transactionally verify hold owner/expiry and confirm seats. Then capture, or capture earlier if provider semantics require it; each ordering has compensation risk. Authorization-first may require release if capture fails; capture-first may require refund if inventory confirmation fails. No cross-provider/database transaction exists.

Write an outbox event with booking confirmation; ticket/notification consumers dedupe by booking ID. Availability updates asynchronously and remains advisory.

### Concurrency and failure paths

1. **Same seat requested concurrently:** Atomic claim gives one winner; the other gets conflict. Cache never decides the winner.
2. **Hold expires during payment:** Verify ownership/expiry at confirmation. Do not confirm a reclaimed seat; void/refund authorization and report explicit status.
3. **Payment response lost:** Retry/query with the same provider key and reconcile; never blindly charge again. If the hold is gone, compensate.
4. **Crash or delayed expiry worker:** Durable idempotency returns the same hold after commit; uncommitted transactions leave no partial claims. New claims reclaim expired holds even if the sweeper lags.

For general admission, atomically decrement only when `available > 0`. Multi-seat claims should be all-or-nothing. Cross-shard requests require partition constraints or a compensating workflow.

### Operations, security, and trade-offs

Track conflicts, transaction/lock latency, checkout completion, payment mismatches, expired holds, queue delay, reconciliation, and ticket lag. Alert on invariant violations; load-test a hot event and provide a safe sales pause. Authenticate/authorize buyers, limit hold abuse, protect payment tokens, audit inventory changes, and keep personal data out of logs. Reconcile provider records before reopening after restore or outage.

Start with a modular service and relational inventory. Queues/caches help traffic shaping and reads, not seat authority. Shard or add active-active writes only when measured need justifies coordination cost.

## Common Mistakes and Interview Traps

- Treating cached availability as a reservation or using read-then-write without an atomic claim.
- Forgetting all-or-nothing behavior for a multi-seat request.
- Assuming a five-minute expiry worker runs exactly on schedule.
- Claiming payment and inventory can commit atomically across independent providers.
- Retrying payment with a new key after an uncertain result.
- Scaling the whole system before describing the single-event hot key and admission plan.

## Tricky Points

An expired hold is logically reclaimable, but physical cleanup may happen later. Put expiry evaluation in the atomic claim path and use the sweeper only for cleanup. Also, “authorized” and “captured” payment are different provider states. The design must specify what happens when authorization outlives a hold, capture fails after booking confirmation, or a webhook arrives late. Reconciliation is part of correctness, not merely an operations dashboard.

## Practical Exercise

**Goal:** Complete a 45-minute design for a high-demand ticket sale with assigned seats and payment.

**Input/context:** One region, 20,000 seats per venue, 100,000 buyers arriving in five minutes, four-seat maximum, five-minute holds, external payment provider.

**Constraints:** Preserve the stated seat invariant, define idempotency scope, make browsing freshness distinct from hold correctness, and state payment/booking transition semantics.

**Edge cases:** Simultaneous same-seat requests, multi-seat partial claim, hold expiry during payment, lost provider response, delayed expiry worker, and restore/reconciliation after outage.

**Acceptance criteria:** State requirements and estimates; draw read, hold, payment, and confirmation flows; provide data model and invariant-enforcing transaction; trace at least two failures; name metrics and one alternative with trade-offs. Do not provide a design that relies on cache state for allocation.

## Summary

Booking correctness begins with explicit invariants. A transactional conditional claim or lock protects inventory; cached availability is advisory. Idempotency handles uncertain client retries, while a saga and reconciliation handle payment-provider boundaries that cannot share the database transaction. Expiry checks belong in the claim path, not only in a background job. Scale the hot event with admission control and measured partitioning, preserving one clear source of truth.

## Cheat Sheet

- **Invariant:** One active owner per seat; only the hold owner may confirm.
- **Browse:** Cached/replicated and possibly stale.
- **Hold:** Atomic conditional claim, all-or-nothing transaction, durable idempotency.
- **Payment:** Stable provider key; authorize/capture state machine; reconcile uncertainty.
- **Expiry:** Check during claims; sweeper is cleanup, not correctness.
- **Common Pitfalls:** Read-then-write; cache as inventory authority; blind payment retry; cross-system atomicity claims; unhandled partial seat sets.

## Interview Questions

1. **Hard:** State the core inventory invariants and identify where each is enforced. **Expected answer shape:** Name uniqueness/ownership rules, transaction boundary, and tests. **Follow-up:** Which invariant can an availability cache not enforce?
2. **Hard:** Two requests race for the last seat. Explain the winning and losing transaction behavior. **Expected answer shape:** Describe atomic conditional claim or locking, all-or-nothing result, and client response. **Follow-up:** How does the answer change for four seats across partitions?
3. **Very Hard:** Payment authorization succeeds but the database times out before booking confirmation. **Expected answer shape:** Explain idempotent provider calls, durable states, retry/reconciliation, hold expiry, and compensation. **Follow-up:** What if the hold has been reallocated before the provider callback arrives?
4. **Very Hard:** Design overload behavior for a single event with 100,000 buyers arriving in minutes. **Expected answer shape:** Separate admission/fairness, browse scaling, authoritative allocation, hot-key protection, SLOs, and operational pause/recovery. **Follow-up:** What evidence would justify moving inventory to a separate partition or service?