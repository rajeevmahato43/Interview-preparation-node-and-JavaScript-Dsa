# Day 29: Relational Correctness for APIs

<nav aria-label="Lecture navigation">

[Previous: Parameterized SQL CRUD](day-28-parameterized-sql-crud.md) | [Roadmap](../node-roadmap.md) | [Next: SQL Composition and Performance Awareness](day-30-sql-composition-and-performance-awareness.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain how primary keys, foreign keys, unique constraints, and checks support correct API behavior.
- Distinguish database validation from application validation.
- Design a relational schema that protects invariants under concurrent requests.
- Understand why migration order and constraint design matter in production systems.

## Prerequisites

- [Day 28: Parameterized SQL CRUD](day-28-parameterized-sql-crud.md)
- [Day 16: Express Input Parsing, Validation, and Serialization](day-16-express-input-validation-and-serialization.md)

## Core Concepts

### 1. A database is a correctness boundary

Applications are imperfect. Database constraints enforce invariants at the storage boundary.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin'))
);
```

This prevents broken rows even when the API is lax.

### 2. Foreign keys protect relations

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0)
);
```

The relation cannot point to a missing user.

### 3. Application validation is not enough

The API should validate input for consistent UX, but the database should be the final guarantee. Validation belongs in both places for different reasons.

## Detailed Explanations and Traces

### Schema and API contract

A route may accept an order body with `user_id`, but an application validation alone cannot guarantee the user still exists when the request is processed later. A foreign key provides that guarantee.

### Migrations and compatibility

Changing a schema needs a safe sequence:

- add columns with defaults where feasible
- add indexes before heavy use
- backfill data carefully
- add constraints only when data is clean enough

A migration that adds a strict constraint to dirty data may fail or create a disruptive rollout.

## Common Mistakes and Interview Traps

- Treating application checks as the only protection.
- Building relational models without constraints or key relationships.
- Forgetting that validation must account for races and delayed writes.
- Thinking a migration can always be applied in place without data cleanup.

## Tricky Points

- A relation can be valid at one moment and invalid later due to deletes or changes.
- `NOT NULL` and `CHECK` constraints are not transactions by themselves; they are part of the schema contract.
- Database constraints are a powerful safety net, but they are not a substitute for a thoughtful domain model.

## Practical Exercise

**Goal:** Design a relational schema for users and orders.

**Inputs and outputs:** Define tables, constraints, and migration order for new records and updates.

**Constraints:** Keep invariants strong even when multiple requests race.

**Acceptance criteria:** The schema prevents invalid user references and enforces business rules at the database boundary.

## Summary

- SQL databases are built around correctness and relational invariants.
- Constraints and keys protect the API contract.
- Application validation is necessary for UX, but database constraints provide the durable guarantee.

## Cheat Sheet

| Concern | Database feature |
|---|---|
| unique identity | `PRIMARY KEY` |
| optional but fixed semantics | `NOT NULL`, `CHECK` |
| relationship integrity | `FOREIGN KEY` |
| uniqueness of value | `UNIQUE` |
| schema evolution | careful migration plan |

## Interview Questions

1. **Definition:** Why does a relational API need database constraints if the application already validates input?
   - **Expected answer:** The database is the last line of defense against invalid or stale data and concurrent mistakes.
   - **Follow-up:** What can still happen without those constraints?

2. **Design:** Design a users and orders schema with correct constraints.
   - **Expected answer:** Use user ID as a primary key, orders linked by foreign key, and checks for valid non-negative totals.
   - **Follow-up:** What about a user being deleted while orders remain?

3. **Implementation:** Write a migration that adds a `CHECK` constraint safely.
   - **Expected answer:** Validate existing data, add the constraint only once the data is compliant, and prepare rollback strategy.
   - **Follow-up:** Why does migration order matter?

4. **Engineering judgment:** When is a database constraint too strict or too weak?
   - **Expected answer:** Too strict blocks valid business states; too weak allows inconsistent data under concurrent or delayed workflows.
   - **Follow-up:** Which side is more dangerous in production?

<nav aria-label="Lecture navigation">

[Previous: Parameterized SQL CRUD](day-28-parameterized-sql-crud.md) | [Roadmap](../node-roadmap.md) | [Next: SQL Composition and Performance Awareness](day-30-sql-composition-and-performance-awareness.md)

</nav>