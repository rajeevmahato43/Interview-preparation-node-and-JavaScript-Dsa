# Day 23: Idempotency, Deduplication, and Exactly-Once Claims

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> | Previous: <a href="day-22-timeouts-retries-and-deadlines.md">Day 22</a> | Next: <a href="day-24-ordering-and-coordination.md">Day 24</a></nav>

## What You Will Learn Today

- Scope idempotency keys to an actor and operation, and bind them to request content.
- Handle duplicate requests concurrently and define what an expired key means.
- Explain why at-least-once message delivery often causes duplicate consumption.
- State precisely where an “exactly-once” guarantee begins and ends.

## Prerequisites

- [Day 08: API and Interface Design](day-08-api-and-interface-design.md)
- [Day 13: Asynchronous Processing and Message Queues](day-13-queues-and-asynchronous-processing.md)
- [Day 17: Transactions and Data Integrity](day-17-transactions-and-data-integrity.md)
- [Day 22: Timeouts, Deadlines, Retries, and Backoff](day-22-timeouts-retries-and-deadlines.md)

## Quick Vocabulary Card

- **Idempotent effect:** Repeating an operation leaves the relevant state as if it had been applied once.
- **Idempotency key:** A caller-supplied identifier used to associate retries with one logical operation.
- **Deduplication:** Recognizing a previously handled operation or message and suppressing a repeated effect.
- **Transactional outbox:** A pattern that writes domain state and a message-to-publish record in one local database transaction.
- **Exactly-once claim:** A guarantee that must name its boundary, state, failure model, and retention period to be meaningful.

## Core Concepts

Distributed calls can fail after a receiver commits an effect but before the sender observes the response. Retries and broker redelivery then present the same logical work again. Idempotency makes repetition safe within a defined scope. The roadmap’s [Day 23 entry](../system-design-roadmap.md#day-23-idempotency-deduplication-and-exactly-once-claims) links the [HTTP Semantics specification](https://www.rfc-editor.org/rfc/rfc9110) and [Apache Kafka documentation](https://kafka.apache.org/documentation/); each describes behavior within its own contract and configuration, not an end-to-end business transaction across arbitrary systems.

### API idempotency records

For a payment-like operation, an idempotency key should be scoped by authenticated principal (or account), operation, and key value. Persist a request fingerprint so accidental or malicious reuse with a different amount or currency is rejected. The record should track state such as `in_progress`, `completed`, or a defined terminal failure, along with the response or operation identifier needed for replay. Sensitive data should not be copied into the record unnecessarily.

An application-level flow is: atomically claim a unique scoped key; if already completed with the same fingerprint, replay the stored outcome; if the same key is in progress, wait briefly or return a stable in-progress result; if the fingerprint differs, reject; otherwise execute the domain mutation and record its result. The claim, business effect, and completed record should share a transaction when they are in one transactional database. A unique constraint or equivalent atomic primitive is required to arbitrate concurrent claims; checking first and inserting later has a race.

If the effect occurs in an external payment processor, a local transaction cannot make the processor call atomic with the idempotency row. Pass a stable key to the processor if its contract supports it, then reconcile uncertain outcomes. Define whether a retry receives the original response, a current resource representation, or an operation-status reference. Retain keys long enough to cover realistic retries and client behavior. Once the record expires, a request may be treated as new; communicate that boundary and avoid an overly short window for high-consequence operations.

### Consumer deduplication and the atomicity boundary

An at-least-once broker can redeliver if acknowledgment is lost or delayed. A consumer can record `(consumer, message_id)` in a deduplication table and apply its local state change in the same transaction. If that transaction commits and the worker crashes before acknowledging, redelivery finds the record and avoids repeating the effect. If the dedupe marker commits separately from the state change, crashes between them can either duplicate or lose work.

This gives an effectively-once local state transition within the transaction and retained deduplication scope, not exactly-once execution across all side effects. If the handler sends an email or charges an external provider, the local database transaction cannot atomically include that provider. Use provider idempotency, an outbox/inbox state machine, durable operation status, or reconciliation. State what can still be duplicated and how to detect it.

### Outbox and message delivery

Suppose a service writes an order and publishes `OrderCreated`. If it commits the database row and then crashes before publishing, downstream consumers never hear about the order. Publishing first can create an event for a transaction that later rolls back. The outbox pattern writes the order and an outbox row in one local transaction; a publisher later sends pending rows and marks them delivered. Publisher failure can publish the same row more than once, so consumers still need stable event identifiers and duplicate-safe effects. The outbox closes the database-to-publication gap under its assumptions; it does not create one atomic transaction across every downstream consumer.

### Precisely scope “exactly once”

A broker may document exactly-once behavior for a specific producer/consumer workflow or transaction boundary. That does not automatically cover a database write, email provider, or business process outside that boundary. Ask: exactly once where, for which state transition, under which failures, and for how long is deduplication retained? A defensible design often promises at-least-once delivery plus idempotent state transitions and reconciliation, rather than claiming an impossible global guarantee.

## Common Mistakes and Interview Traps

- Treating an idempotency key as globally unique without principal and operation scope.
- Replaying a stored result when the same key is reused with different request data.
- Checking for a key and then performing work without atomic concurrency control.
- Expiring deduplication state before delayed retries or redelivery can occur.
- Recording a dedupe marker separately from the local business update.
- Claiming a broker's exactly-once feature makes external side effects exactly once.
- Assuming a transactional outbox prevents duplicate publishing or makes consumers atomic.
- Returning success for an in-progress operation without exposing its state or identity.

## Tricky Points

The retention window is part of correctness. If a queue can redeliver a message for seven days but the dedupe record expires after one day, a late delivery can repeat the effect. Likewise, a client retry after an idempotency record expires may create a second operation. Choose retention based on maximum retry/redelivery horizon, business consequences, storage cost, and privacy policy. Concurrent duplicates need an explicit result, not just duplicate suppression after completion.

## Practical Exercise

**Goal:** Design idempotent payment-request handling and an event publication path.

**Inputs/context:** A client submits a payment request and may retry after timeout. On success, the service updates a local order and publishes an event for fulfillment. A provider may accept a charge while its response is lost.

**Constraints:** Define key scope, fingerprint, concurrent request behavior, record retention, local transaction boundary, outbox identity, consumer deduplication, and provider assumptions.

**Edge cases:** Same key/different body; simultaneous requests; timeout after provider charge; crash after database commit before publish; duplicate publication; redelivery after dedupe expiry.

**Acceptance criterion:** Draw state transitions and transaction boundaries, identify every duplicate window, specify caller-visible replay behavior and retention rationale, and state exactly which local effect is idempotent. Do not claim global exactly-once execution.

## Summary

Idempotency makes retries safe only within a defined operation, identity scope, and retention window. Use atomic claims for concurrent requests and bind keys to request content. Consumers can atomically deduplicate local state changes, while external effects still require provider support or reconciliation. An outbox makes local state plus publication intent atomic, but publish and consume can still repeat.

## Cheat Sheet

- Scope key by actor/account + operation + key; store a payload fingerprint.
- Atomically arbitrate concurrent requests and define in-progress behavior.
- Commit dedupe marker with local state change; acknowledge after safe handling.
- Set retention beyond realistic retry/redelivery horizon.
- Outbox makes local mutation + publication intent atomic; publisher remains retryable.
### Common Pitfalls

- Global keys; body mismatch; expired dedupe; outbox equals exactly-once; external side effects inside assumed local transaction.

## Interview Questions

1. **[Hard]** Design the fields and behavior for an API idempotency record. **Expected answer shape:** Scope, fingerprint, state, stored outcome, unique claim, concurrency response, retention. **Follow-up:** How should the same key with a changed amount behave?
2. **[Hard]** A consumer commits a database update but crashes before acknowledging. Trace redelivery. **Expected answer shape:** Stable message ID, atomic dedupe/state transaction, acknowledgment timing, and retention. **Follow-up:** What failure appears if the marker is in a separate transaction?
3. **[Hard]** What does a transactional outbox solve and what does it not solve? **Expected answer shape:** Local state/publication-intent atomicity, publisher retry/duplicates, consumer dedupe, external boundaries. **Follow-up:** How would you monitor stuck outbox rows?
4. **[Very Hard]** Explain whether a payment workflow can be exactly once across an API, database, queue, and external processor. **Expected answer shape:** Define guarantee boundary and failures; combine scoped keys, transactions, provider behavior, and reconciliation; identify residual uncertainty. **Follow-up:** What retention and audit evidence would make the claim defensible?