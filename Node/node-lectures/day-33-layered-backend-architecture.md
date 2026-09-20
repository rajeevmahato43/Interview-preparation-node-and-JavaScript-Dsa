# Day 33: Layered Backend Architecture

<nav aria-label="Lecture navigation">

[Previous: PostgreSQL in Express](day-32-postgresql-in-express.md) | [Roadmap](../node-roadmap.md) | [Next: Deadlines, Retries, and Idempotency](day-34-deadlines-retries-and-idempotency.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Design a layered backend around routes, services, and repositories.
- Distinguish business rules from transport concerns and persistence concerns.
- Explain why dependency direction matters in a maintainable Node service.
- Avoid the most common ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œfat controllerÃƒÂ¢Ã¢â€šÂ¬Ã‚Â mistakes.

## Prerequisites

- [Day 13: Express Application Structure](day-13-express-application-structure.md)
- [Day 26: MongoDB in Express](day-26-mongodb-in-express.md)
- [Day 32: PostgreSQL in Express](day-32-postgresql-in-express.md)

## Core Concepts

### 1. Layers provide separation of concerns

A common pattern is:

- route/controller: HTTP details
- service: business rules
- repository: data access
- configuration and infrastructure: env, logger, DB pools, queues

This is not about ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œtoo much abstractionÃƒÂ¢Ã¢â€šÂ¬Ã‚Â; it is about keeping decisions in the correct place.

### 2. Dependency direction matters

The service layer should depend on repository interfaces or concrete implementations, not the reverse. The route should depend on the service, not on the database client directly.

### 3. Pure domain logic is easier to test

If the business decision can be expressed independently of HTTP and DB details, it should be. That makes it measurable, portable, and easier to evolve.

## Detailed Explanations and Traces

### Example service boundary

```js
function createUserService({ userRepo, logger }) {
  return {
    async createUser(input) {
      if (!input.email) {
        throw new Error("missing email");
      }

      const user = await userRepo.create({ email: input.email.trim() });
      logger.info("user created", { userId: user.id });
      return user;
    },
  };
}
```

This code owns the business rule and uses the repository only for persistence.

### When layer boundaries fail

If the route checks business rules, calls the DB directly, and writes the response, the service becomes hard to test and easy to break. This kind of coupling becomes painful as the app grows.

## Common Mistakes and Interview Traps

- Putting validation, DB access, and response logic in one route.
- Creating layers that are not real boundaries.
- Sharing mutable globals for config or repositories.
- Writing broad abstractions before the real coupling is visible.

## Tricky Points

- Layering is not about adding ceremony. It is about keeping steady boundaries.
- A ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œgoodÃƒÂ¢Ã¢â€šÂ¬Ã‚Â architecture is one that changes predictably when requirements change.
- The right boundary depends on the actual service, not on a framework default.

## Practical Exercise

**Goal:** Refactor a monolithic route into a layered service architecture.

**Inputs and outputs:** Create a user through HTTP, with validation and persistence separated.

**Constraints:** Keep the route thin, the service responsible for business logic, and the repository responsible for storage.

**Acceptance criteria:** The route has minimal logic, and the service is separately testable.

## Summary

- Layered backend architecture makes change easier and decisions clearer.
- Clean boundaries keep transport, business logic, and storage distinct.
- The best architecture is the one that reduces accidental coupling without creating needless abstraction.

## Cheat Sheet

| Layer | Responsibility |
|---|---|
| Route/controller | HTTP parsing and response |
| Service | business rules and orchestration |
| Repository | data access |
| Config/infrastructure | env, logger, DB pools, queues |

## Interview Questions

1. **Definition:** What is a ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œfat controllerÃƒÂ¢Ã¢â€šÂ¬Ã‚Â and why is it a problem?
   - **Expected answer:** It mixes HTTP concerns, business logic, and persistence too tightly, making the code hard to test and maintain.
   - **Follow-up:** What are the symptoms?

2. **Design:** Draw the layer boundaries for a create-user API.
   - **Expected answer:** Route validates input, service enforces business rules, repository persists data, infrastructure provides dependencies.
   - **Follow-up:** Which concerns should not leak upward?

3. **Implementation:** Refactor a route that writes to a database and checks validation directly.
   - **Expected answer:** Move business checks to the service and repository methods to a separate layer.
   - **Follow-up:** How do you keep the route testable?

4. **Engineering judgment:** When does an abstraction become harmful?
   - **Expected answer:** When it hides actual complexity without creating stable seams or reducing coupling.
   - **Follow-up:** What is the difference between a useful abstraction and a ceremony layer?

<nav aria-label="Lecture navigation">

[Previous: PostgreSQL in Express](day-32-postgresql-in-express.md) | [Roadmap](../node-roadmap.md) | [Next: Deadlines, Retries, and Idempotency](day-34-deadlines-retries-and-idempotency.md)

</nav>