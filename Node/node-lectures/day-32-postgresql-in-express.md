# Day 32: PostgreSQL in Express

<nav aria-label="Lecture navigation">

[Previous: PostgreSQL Transactions, MVCC, and Locks](day-31-postgresql-transactions-mvcc-and-locks.md) | [Roadmap](../node-roadmap.md) | [Next: Layered Backend Architecture](day-33-layered-backend-architecture.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Integrate PostgreSQL access into an Express application cleanly.
- Keep repository logic away from route handlers.
- Handle transactional service operations and database error mapping.
- Understand when PostgreSQL is a better fit than MongoDB for a given workload.

## Prerequisites

- [Day 27: PostgreSQL and `pg` Pool Lifecycle](day-27-postgresql-and-pg-pool-lifecycle.md)
- [Day 31: PostgreSQL Transactions, MVCC, and Locks](day-31-postgresql-transactions-mvcc-and-locks.md)
- [Day 17: Async Express and Centralized Errors](day-17-async-express-and-centralized-errors.md)

## Core Concepts

### 1. API routes should not own SQL details

A route should validate input, call a service, and pass the result to Express. The service or repository handles database work.

```js
app.post("/users", async (req, res, next) => {
  try {
    const user = await userService.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});
```

### 2. Transactional service methods need explicit client ownership

When a route needs a multi-step SQL operation, the service can borrow a client from the pool and keep the transaction explicit.

### 3. Database choice is workload-driven

PostgreSQL is often the better fit when relational correctness, strong constraints, transactions, and complex reporting matter. MongoDB is often a better fit for document-oriented access or flexible data models.

## Detailed Explanations and Traces

### Repository layer pattern

```js
function createUserRepository({ pool }) {
  return {
    async create({ email }) {
      const result = await pool.query(
        "INSERT INTO users (email) VALUES ($1) RETURNING *",
        [email]
      );
      return result.rows[0];
    },
  };
}
```

This keeps the SQL in one place and reduces route complexity.

### Error mapping in Express

A duplicate value or foreign-key issue should become a client-safe 409 or 400, not just a generic internal server error. A connection or timeout issue may need a different mapping.

## Common Mistakes and Interview Traps

- Putting SQL directly into route handlers.
- Not releasing a checked-out SQL client.
- Ignoring database error classifications.
- Choosing a database by trend rather than workload.

## Tricky Points

- A pool is not a free-for-all: connection count and timeouts still require attention.
- A transaction boundary is an application decision, not just a checkbox.
- A service that works under low load may still fail under concurrency unless transaction duration is bounded.

## Practical Exercise

**Goal:** Build a small Express service for user creation and order placement with PostgreSQL-backed repository logic.

**Inputs and outputs:** Accept request data, perform the SQL steps, and return a clear response or error.

**Constraints:** Keep repository logic out of the route, handle transaction errors, and ensure client release.

**Acceptance criteria:** The service correctly commits or rolls back and returns stable API responses.

## Summary

- PostgreSQL in Express should be structured through services and repositories.
- Transaction ownership and pool lifecycle are operational requirements.
- Database choice should follow the workload's correctness and access patterns.

## Cheat Sheet

| Concern | Rule |
|---|---|
| Routes | parse and validate only |
| Service | business logic and DB orchestration |
| Repository | SQL and row mapping |
| Transaction | hold client and release in `finally` |
| Error mapping | classify DB errors before returning API responses |

## Interview Questions

1. **Definition:** Why are repository boundaries useful when using PostgreSQL in Express?
   - **Expected answer:** They keep route logic smaller, make tests easier, and help separate SQL from HTTP decisions.
   - **Follow-up:** What if the route does both query and HTTP logic?

2. **Design:** When would you choose PostgreSQL over MongoDB for a Node service?
   - **Expected answer:** When the workload needs relational integrity, transactional correctness, SQL reporting, or stable constraints.
   - **Follow-up:** What if the access pattern is highly document-oriented?

3. **Implementation:** Write a service that creates a user and an order in one transaction.
   - **Expected answer:** Acquire a client, start transaction, run both writes, then commit or rollback.
   - **Follow-up:** What is the behavior when the second statement fails?

4. **Engineering judgment:** What is the danger of a transaction that stays open for too long?
   - **Expected answer:** It increases lock time, slows throughput, and can trigger deadlocks under concurrency.
   - **Follow-up:** How do you bound that risk?

<nav aria-label="Lecture navigation">

[Previous: PostgreSQL Transactions, MVCC, and Locks](day-31-postgresql-transactions-mvcc-and-locks.md) | [Roadmap](../node-roadmap.md) | [Next: Layered Backend Architecture](day-33-layered-backend-architecture.md)

</nav>