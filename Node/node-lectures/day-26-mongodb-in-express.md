# Day 26: MongoDB in Express

<nav aria-label="Lecture navigation">

[Previous: MongoDB Atomicity, Transactions, and Retries](day-25-mongodb-atomicity-transactions-and-retries.md) | [Roadmap](../node-roadmap.md) | [Next: PostgreSQL and `pg` Pool Lifecycle](day-27-postgresql-and-pg-pool-lifecycle.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Put MongoDB access behind a repository or service boundary in an Express app.
- Design request handling that keeps database concerns out of routes.
- Manage timeouts, error mapping, and graceful shutdown in a Node + MongoDB service.
- Compare MongoDB and PostgreSQL choices at the application level.

## Prerequisites

- [Day 21: MongoDB Driver Lifecycle and BSON](day-21-mongodb-driver-lifecycle-and-bson.md)
- [Day 24: MongoDB Aggregation and Index Awareness](day-24-mongodb-aggregation-and-index-awareness.md)
- [Day 25: MongoDB Atomicity, Transactions, and Retries](day-25-mongodb-atomicity-transactions-and-retries.md)

## Core Concepts

### 1. Database code should not live inside route handlers

A route should parse, validate, and call a service. The service should call a repository. The repository should issue MongoDB operations.

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

This keeps business logic and database concerns separate.

### 2. Timeouts and error mapping matter

MongoDB queries can hang or fail. The service should map database errors into consistent API responses, and the client layer should have bounded timeouts.

### 3. MongoDB is a good fit for document-oriented access patterns

A document database works well for flexible data, nested entities, and read-heavy operations designed around document shape. It is not automatically the best choice for every workload.

## Detailed Explanations and Traces

### Repository and service split

```js
function createUserService({ userRepo }) {
  return {
    async createUser(input) {
      const user = await userRepo.create(input);
      return user;
    },
  };
}
```

This keeps the route free of database details and makes the code easier to test with fake repositories.

### Database choices at the API level

MongoDB is attractive for flexible event and document-heavy data. PostgreSQL remains strong for relational integrity and complex transactional logic. The right choice depends on access patterns and correctness guarantees.

## Common Mistakes and Interview Traps

- Putting the driver directly in the route.
- Letting a DB failure bubble as an unhelpful 500.
- Not setting operation timeouts or cancellation at the service boundary.
- Choosing a database by slogan instead of workload.

## Tricky Points

- A repository boundary reduces coupling but adds an abstraction layer that must still be chosen carefully.
- Good Express code is not "database-agnostic" by default; it is explicit about where DB work happens.
- A database user interface that is too broad can hide important semantics.

## Practical Exercise

**Goal:** Connect a MongoDB-backed repository to an Express API and map errors clearly.

**Inputs and outputs:** One resource with list, create, and update routes.

**Constraints:** Keep the app testable, use a service boundary, and validate error mapping for not found and conflict cases.

**Acceptance criteria:** The API responds consistently for success, validation, and database failure cases.

## Summary

- Express request handlers should not own MongoDB operations directly.
- Repositories and services keep database concerns where they belong.
- Database choice and API design should be tied to access patterns, not hype.

## Cheat Sheet

| Concern | Ideal boundary |
|---|---|
| Route | HTTP and validation |
| Service | business logic |
| Repository | MongoDB driver operations |
| Error mapping | centralized middleware |

## Interview Questions

1. **Definition:** Why keep MongoDB logic out of Express route handlers?
   - **Expected answer:** It reduces coupling, improves testability, and keeps the API boundary clear.
   - **Follow-up:** What happens when the route directly mixes DB logic and HTTP logic?

2. **Design:** How should an API map a MongoDB duplicate-key error to a user response?
   - **Expected answer:** Classify the error and return a client-safe 409 or validation error rather than a generic 500.
   - **Follow-up:** When is a retry appropriate?

3. **Implementation:** Build a small Express service that creates a user from a repository.
   - **Expected answer:** Validate input, call the service, catch errors, and pass them to Express error middleware.
   - **Follow-up:** How would you test it without a live MongoDB database?

4. **Tradeoff:** When would you choose MongoDB over PostgreSQL for a backend API?
   - **Expected answer:** When flexible document access patterns, nested data, or fast iteration patterns dominate and the workload fits.
   - **Follow-up:** What does "fit" really mean in practice?

<nav aria-label="Lecture navigation">

[Previous: MongoDB Atomicity, Transactions, and Retries](day-25-mongodb-atomicity-transactions-and-retries.md) | [Roadmap](../node-roadmap.md) | [Next: PostgreSQL and `pg` Pool Lifecycle](day-27-postgresql-and-pg-pool-lifecycle.md)

</nav>