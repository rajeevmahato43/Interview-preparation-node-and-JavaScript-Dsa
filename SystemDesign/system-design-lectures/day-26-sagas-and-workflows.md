# Day 26: Sagas and Distributed Workflows

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> | Previous: <a href="day-25-resilience-patterns.md">Day 25</a> | Next: <a href="day-27-observability-and-diagnosis.md">Day 27</a></nav>

## What You Will Learn Today

- Model a multi-service business process as durable steps and explicit state transitions.
- Compare orchestration and choreography as workflow ownership choices.
- Explain compensating actions and why they are not database rollback.
- Handle timeouts, duplicate events, partial completion, and reconciliation.

## Prerequisites

- [Day 13: Asynchronous Processing and Message Queues](day-13-queues-and-asynchronous-processing.md)
- [Day 17: Transactions and Data Integrity](day-17-transactions-and-data-integrity.md)
- [Day 22: Timeouts, Deadlines, and Retries](day-22-timeouts-retries-and-deadlines.md)
- [Day 23: Idempotency, Deduplication, and Exactly-Once Claims](day-23-idempotency-and-message-delivery.md)

## Quick Vocabulary Card

- **Saga:** A sequence of local transactions coordinated across services, with actions for handling later failure.
- **Orchestration:** A coordinator records workflow state and tells participants which step to execute.
- **Choreography:** Participants react to events and advance the process without one central coordinator issuing every step.
- **Compensation:** A business action intended to mitigate or counter an earlier completed step.
- **Reconciliation:** A process that compares intended workflow state with actual participant state and repairs or escalates mismatches.

## Core Concepts

A normal database transaction can atomically protect work within its supported boundary. A workflow spanning independent services usually cannot hold one ACID transaction open across network calls and providers. A saga breaks the process into local commits and defines how to respond when a later step fails. The roadmap’s [Day 26 entry](../system-design-roadmap.md#day-26-sagas-and-distributed-workflows) links [AWS Prescriptive Guidance on the Saga pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga.html); its implementation details are guidance, not a guarantee that every workflow should use a saga.

### Design the state machine before choosing coordination style

Consider an order that reserves inventory, authorizes payment, and requests shipment. Name the workflow states: `pending`, `inventory_reserved`, `payment_authorized`, `shipment_requested`, `completed`, `compensating`, `cancelled`, and `needs_reconciliation`. Persist each transition with an operation or correlation ID. A step should have a clear input, durable outcome, timeout policy, retry identity, and terminal/error state. Clients should be able to distinguish accepted, progressing, completed, and failed/cancelled states.

An orchestrator stores the workflow state and commands the next step. This makes the sequence and failure paths visible in one place, which can simplify complex workflows and operator tools. It also introduces a coordinator that must scale, be durable, and avoid becoming an unowned central dependency. Choreography distributes progression through events; participants are more independent, but it can be harder to see the full process, reason about cycles, and debug missing transitions. Choose based on workflow complexity, ownership, audit needs, and team boundaries, not ideology.

### Compensation is a new action, not time travel

If shipment cannot be arranged after payment authorization, a compensation might void the authorization. If the charge has already settled, the action may be a refund that takes time and can fail. If inventory was reserved, release it; if the item has already shipped, cancellation may be impossible. A compensation creates a new business event and can have its own latency, errors, duplicates, and audit record. It does not erase the fact that the original action happened.

Compensations may run in reverse order when that matches dependencies, but this is not universal. Some actions are irreversible and require a manual path, alternate fulfillment, or a customer-visible state. Define compensation semantics with the domain owner, including financial and legal effects.

### Durable transitions, retries, and reconciliation

Persist a step result before advancing, and make commands and event handlers idempotent because delivery and coordinator recovery can repeat work. Each participant should enforce its own operation identity and return a stable outcome. A timeout during a step is uncertain: query the participant's operation status or retry with the same identity instead of assuming failure. Record attempt count and next retry time; use bounded retries and alert on stuck states.

Reconciliation scans workflows whose state is older than expected, compares participant state, and either safely replays, compensates, or escalates for human review. Without reconciliation, a saga can remain stuck forever after an unusual failure. The workflow store itself needs backup, monitoring, schema evolution, access control, and a retention policy for audit and sensitive data.

### Worked trace: order flow

1. The order service commits `pending` and an outbox command to reserve inventory.
2. Inventory reserves units and returns a stable reservation ID; duplicate reserve commands return the same result.
3. The coordinator records `inventory_reserved` and requests payment authorization with a stable operation key.
4. The payment response times out. The coordinator queries or repeats the same operation identity rather than creating a second authorization.
5. If payment is declined, the workflow issues inventory release and records its outcome. If release fails, state becomes `needs_reconciliation`, not falsely `cancelled`.
6. If payment succeeds, shipment is requested; a later shipment failure may trigger void/refund and release, each with explicit business semantics.

Each local transaction is atomic only within its participant. The overall saga is a durable state machine that may expose intermediate states and eventual compensation.

## Common Mistakes and Interview Traps

- Claiming a saga gives the same atomicity or isolation as one database transaction.
- Calling compensation a rollback that erases the earlier side effect.
- Omitting durable workflow state, idempotency, or participant operation identities.
- Treating timeout as definite step failure and issuing a new operation.
- Assuming every action has a valid automatic compensation.
- Choosing choreography without considering end-to-end visibility and missing-event diagnosis.
- Marking a workflow cancelled before compensation has actually completed.
- Having no reconciliation or human escalation path for stuck/irreversible work.

## Tricky Points

Workflow progress can be non-monotonic from the customer's perspective: an order may be accepted, then payment authorized, then cancelled while a refund is pending. Status names must not imply that all side effects are already undone. Also, choreography still has coordination through event contracts and shared business rules; removing a coordinator does not remove the need to manage timeouts, duplicates, ordering, and recovery.

## Practical Exercise

**Goal:** Model order placement across inventory, payment, and shipping.

**Inputs/context:** A customer submits an order. Inventory reservation and payment authorization are separate services; shipping can fail after payment succeeds.

**Constraints:** Choose orchestration or choreography, persist state, define per-step identities and retry/deadline policy, and describe compensation and reconciliation. State which actions are irreversible or delayed.

**Edge cases:** Duplicate event; timeout after provider success; inventory release failure; payment authorization expires; shipment already dispatched; coordinator restarts between commit and publish.

**Acceptance criterion:** Provide a state diagram/table with normal and failure transitions, identify each local transaction, define customer-visible statuses and operator alert conditions, and explain why one compensation is not a rollback. Do not provide a full workflow implementation.

## Summary

Sagas coordinate local transactions across independent services. Model durable states, stable operation identities, retries, and partial completion before choosing orchestration or choreography. Compensation is a new business action that can fail; some outcomes require reconciliation or human intervention. Report truthful intermediate states rather than claiming global atomicity.

## Cheat Sheet

- Define workflow states, local transaction boundaries, and participant operation IDs.
- Orchestration centralizes sequence visibility; choreography distributes progression and can obscure the whole flow.
- Compensation mitigates an effect; it does not erase history or guarantee reversal.
- Timeouts are uncertain; query or retry with the same idempotent identity.
- Reconcile stuck state against participant truth; escalate irreversible cases.
### Common Pitfalls

- Fake global transaction; assuming compensation always succeeds; no durable state; false terminal status.

## Interview Questions

1. **[Hard]** What is a saga and when is it useful? **Expected answer shape:** Local transactions, independent services, durable workflow state, failure handling, and comparison with a single transaction. **Follow-up:** What new consistency behavior do users observe?
2. **[Hard]** Why is a refund not a rollback of a settled charge? **Expected answer shape:** Separate business action, timing, failure, audit, and external consequences. **Follow-up:** What state should the order expose while refund is pending?
3. **[Hard]** Compare orchestration and choreography for an order with three steps. **Expected answer shape:** Visibility, coupling, ownership, complexity, failure diagnosis, and operational burden. **Follow-up:** How will an operator find a missing transition in choreography?
4. **[Very Hard]** Payment times out after possible authorization, inventory release fails, and the customer retries. Design recovery. **Expected answer shape:** Stable idempotency keys, participant status query, durable state, bounded retry, compensation state, reconciliation, and truthful response. **Follow-up:** Which condition requires manual intervention?