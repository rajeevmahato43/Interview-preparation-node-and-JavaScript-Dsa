# Day 17: Transactions and Data Integrity

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> | <a href="day-16-partitioning-and-sharding.md">Previous: Day 16</a> | <a href="day-18-consistency-models-and-cap.md">Next: Day 18</a></nav>

## What You Will Learn Today

- State a business invariant and identify which writes must succeed or fail atomically to preserve it.
- Explain transaction boundaries and the roles of constraints, isolation, locks, and optimistic concurrency.
- Recognize that isolation levels and transactional capabilities vary by database and configuration.
- Keep transactions appropriately scoped and describe alternatives when a workflow crosses independent services.

## Prerequisites

- [Day 09: Data Modeling and Storage Choices](../system-design-roadmap.md#day-09-data-modeling-and-storage-choices)
- [Day 16: Partitioning and Sharding](day-16-partitioning-and-sharding.md)

## Quick Vocabulary Card

- **Transaction:** A bounded group of database operations treated according to the database's atomicity and isolation rules.
- **Invariant:** A condition that must remain true for every valid committed state, such as a non-negative balance.
- **Atomicity:** Within the database's transaction contract, either the transaction's changes commit together or they do not.
- **Isolation:** Rules that determine which concurrent changes a transaction can observe and how concurrent operations interact.
- **Constraint:** A database-enforced rule such as uniqueness, referential integrity, or a check condition.
- **Optimistic concurrency:** Detecting conflicting changes, often with a version or conditional update, instead of locking a record for the whole workflow.

## Core Concepts

Transactions prevent related changes from becoming visible as an invalid partial result. Start with the invariant: a transfer of 40 currency units must debit A and credit B together, and A cannot become negative. Separate operations can violate this if a process fails or requests interleave.

An invariant should be enforced as close as practical to the authoritative data. Application validation can give friendly errors, but two concurrent requests can both pass a check before either writes. A database constraint, conditional update, row lock, or serializable transaction may provide the required protection, depending on the invariant and database. Constraints are valuable because they apply to every writer, not just one application path. PostgreSQL's transaction and concurrency documentation describes its own model; do not assume identical isolation or locking semantics in another engine ([PostgreSQL transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html), [PostgreSQL concurrency control](https://www.postgresql.org/docs/current/mvcc.html)).

### A transfer trace

Assume integer-cent balances and a unique transfer request ID. In a relational database, claim the ID, conditionally debit A if funds suffice, credit B, record the transfer, and commit. If a step fails, roll back. The unique ID protects retries; atomicity alone does not deduplicate separate attempts.

Concurrent transfers can deadlock if they lock accounts in opposite orders. The database may abort one; handle that failure and retry only when safe. Consistent lock ordering reduces risk. Keep transactions short and never hold locks while waiting on a remote provider.

### Atomicity is not a complete correctness guarantee

Atomicity concerns all-or-nothing commit of a transaction's changes. It does not by itself guarantee that the business rule was correctly expressed, that a duplicate request will not repeat a successful operation, or that a downstream event was delivered. Isolation defines interactions among concurrent transactions, but available levels and anomalies differ. Under weaker isolation, the application may need conditional updates, unique constraints, or retry logic. Stronger isolation can increase blocking, conflict aborts, or serialization failures.

Read the database's exact isolation contract. A label such as “repeatable read” should not be assumed to mean precisely the same anomaly set across all products. For a predicate invariant such as “at most 100 active reservations,” locking the rows currently found may not stop another transaction from inserting a new matching row. A constraint, a lockable coordination row, or an isolation mode that protects the relevant predicate may be needed.

### Optimistic concurrency and lost updates

Suppose an API reads a document with version 7, changes one field, and writes a full replacement. Another request may have updated the document to version 8 in between; the stale replacement can silently erase that update. Optimistic concurrency adds a condition such as “update where version = 7 and set version = 8.” If no row matches, the caller knows the data changed and can reload, merge, or report a conflict. This is useful when conflicts are relatively rare and short transactions are preferred. It is not a substitute for carefully defining what should happen on conflict.

### Transaction boundaries across services

A database transaction controls work within that database. Writing a user row and publishing to a separate broker is not automatically atomic: a process can fail between the two. An outbox, durable workflow state, idempotent consumers, or reconciliation make that boundary explicit.

Cross-shard or cross-service transactions may exist, but add coordination and failure complexity. Keep tightly coupled invariants within one ownership boundary; otherwise define intermediate states and repair actions.

## Common Mistakes and Interview Traps

- Saying “use a transaction” without naming the invariant or transaction boundary.
- Assuming application-level read-then-write checks are safe under concurrency.
- Assuming atomic commit also provides deduplication, external message delivery, or business correctness.
- Holding locks while performing slow network calls or user interaction.
- Claiming a specific isolation level eliminates an anomaly without checking the database's documented semantics.

## Tricky Points

- A transaction can fail at commit through conflict, deadlock, timeout, or connection loss. On connection loss the outcome may be unknown, so use an idempotency key or lookup before retrying.
- The right invariant may need multiple mechanisms. For example, a unique constraint prevents duplicate transfer records, while a conditional balance update prevents overdraft.
- Database atomicity does not include another service unless a distributed transaction protocol and its availability/failure implications are explicitly part of the system.

## Practical Exercise

**Goal:** Define the transaction boundary for a money transfer.

**Input/context:** A request transfers an amount in integer cents between two accounts. Concurrent requests may target the same account; clients retry after timeouts. Account balances must never become negative, and each request ID may cause at most one completed transfer.

**Constraints:** Identify the invariant, authoritative storage, required constraints or conditional writes, and what is inside the transaction. State what the API returns for insufficient funds, duplicate request IDs, deadlocks, and uncertain commit outcomes.

**Edge cases:** Same source and destination; non-positive amount; concurrent debits; process crash after commit but before response; retry with the same or a different request ID.

**Acceptance criteria:** Draw the operation sequence, show which failures roll back, explain how retry safety works, and name one isolation behavior to verify in the selected database. Do not provide a full implementation.

## Summary

Start transaction design with explicit invariants. Use database constraints and conditional writes to close races that application-only checks leave open. Atomicity, isolation, deduplication, and external side effects are separate concerns. Keep transaction scope short, handle aborts and uncertain outcomes, and use explicit workflow patterns when state crosses service boundaries.

## Cheat Sheet

- **Invariant first:** What must always be true after commit?
- **Atomicity:** Related database changes commit together or roll back under the database contract.
- **Concurrency:** Constraints, conditional updates, locks, versions, or isolation protect different kinds of invariants.
- **Retry:** A transaction abort may be retryable; an uncertain commit needs deduplication or outcome lookup.
- **Cross-service:** Use durable workflow/outbox patterns; a local DB transaction does not cover a broker or remote API.
- **Common Pitfalls:** Read-then-write races; long-held locks; assuming atomicity means exactly once; treating isolation labels as portable guarantees.

## Interview Questions

1. **[Hard]** Which invariant must a transfer preserve, and which operations belong in its transaction? **Expected answer shape:** State balance and uniqueness rules, order the debit/credit/record changes, and explain rollback. **Follow-up:** Why does a transaction not prevent a client retry from creating a second transfer?
2. **[Hard]** Two requests read the same version of an account and then update it. How do you prevent a lost update? **Expected answer shape:** Compare locking, version-conditional writes, and isolation; state conflict behavior. **Follow-up:** Which approach fits low versus high conflict rates?
3. **[Very Hard]** A service commits an order and must publish an event to a broker, but no distributed transaction is available. **Expected answer shape:** Explain the dual-write failure, propose durable publication/outbox and idempotent consumption, and cover repair/observability. **Follow-up:** What does the user see if the order commits but publication is delayed?