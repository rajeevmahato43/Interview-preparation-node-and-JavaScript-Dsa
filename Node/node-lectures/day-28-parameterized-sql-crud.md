# Day 28: Parameterized SQL CRUD

<nav aria-label="Lecture navigation">

[Previous: PostgreSQL and `pg` Pool Lifecycle](day-27-postgresql-and-pg-pool-lifecycle.md) | [Roadmap](../node-roadmap.md) | [Next: Relational Correctness for APIs](day-29-relational-correctness-for-apis.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Write safe CRUD operations in PostgreSQL from Node.
- Use parameterized queries instead of string concatenation.
- Distinguish `SELECT`, `INSERT`, `UPDATE`, `DELETE`, and `RETURNING` semantics.
- Handle nulls, conflicts, and result interpretation without losing correctness.

## Prerequisites

- [Day 27: PostgreSQL and `pg` Pool Lifecycle](day-27-postgresql-and-pg-pool-lifecycle.md)
- [Day 16: Express Input Parsing, Validation, and Serialization](day-16-express-input-validation-and-serialization.md)

## Core Concepts

### 1. Parameterized SQL is the default safe choice

```js
const result = await pool.query(
  "SELECT id, email FROM users WHERE id = $1",
  [userId]
);
```

This keeps the SQL structure fixed and the values separate. It prevents injection and makes intent clear.

### 2. `RETURNING` is valuable for API work

```js
const result = await pool.query(
  `
    INSERT INTO users (email, created_at)
    VALUES ($1, NOW())
    RETURNING id, email, created_at
  `,
  [email]
);
```

`RETURNING` gives the newly created row directly, which is often easier than querying again.

### 3. Update and delete semantics are driven by filters and row count

```js
const result = await pool.query(
  "UPDATE users SET email = $1 WHERE id = $2 RETURNING *",
  [email, userId]
);
```

This is safer and more explicit than building SQL from raw input.

## Detailed Explanations and Traces

### Query execution flow

A Node service sends a SQL statement and parameter array to the pool. PostgreSQL parses the statement, binds the values, and executes it. The driver returns rows and metadata. The application then maps those rows to API responses.

### Nulls and defaults

`NULL` is not the same as empty string, zero, or missing. A query may accept `NULL` for optional values but should not assume all missing data is equivalent.

### Conflict handling

```js
try {
  await pool.query("INSERT INTO users (email) VALUES ($1)", [email]);
} catch (error) {
  if (error.code === "23505") {
    // unique constraint violation
  }
}
```

This matches application behavior to the database-level constraint and lets the API respond appropriately.

## Common Mistakes and Interview Traps

- Building SQL by string concatenation.
- Ignoring `RETURNING` and reading the row back separately.
- Treating `NULL` as an empty value.
- Forgetting to handle unique or foreign key constraint failures.

## Tricky Points

- SQL injection is mostly about mixing data and query structure; parameterization fixes that.
- A `DELETE` can succeed with zero rows, which is not automatically an error.
- A query result may have no rows, one row, or many rows depending on the statement.

## Practical Exercise

**Goal:** Build a repository for a user resource with CRUD methods.

**Inputs and outputs:** Create, fetch, update, and delete a user by id.

**Constraints:** Use parameterized queries, `RETURNING`, and handle not-found and duplicate-email cases.

**Acceptance criteria:** The service returns correct results and database constraint errors are mapped clearly.

## Summary

- Parameterized SQL is the standard safe pattern.
- `RETURNING` makes insert/update flows simpler and more accurate.
- SQL CRUD correctness includes row matching, row counts, and constraint handling.

## Cheat Sheet

| Concern | Pattern |
|---|---|
| Safe values | `pool.query("... $1 ...", [value])` |
| Insert result | `RETURNING *` |
| Update result | `RETURNING *` |
| Constraint errors | inspect `error.code` |
| Null handling | treat as distinct from empty values |

## Interview Questions

1. **Definition:** Why should Node services use parameterized SQL?
   - **Expected answer:** It keeps values separate from the SQL structure and prevents injection.
   - **Follow-up:** What is the risk if you interpolate untrusted input?

2. **Trace:** A `UPDATE` statement returns row count zero. What should the service do?
   - **Expected answer:** It should interpret that as "no matching row," not necessarily a database failure.
   - **Follow-up:** What if the update also changed a unique field and violated a constraint?

3. **Implementation:** Write a safe `INSERT ... RETURNING` statement for a users table.
   - **Expected answer:** Use placeholders and return the created row.
   - **Follow-up:** How do you distinguish duplicate-key from low-level failure?

4. **Design:** Why is `RETURNING` valuable for an API repository?
   - **Expected answer:** It lets the database return the exact row the server created or updated, reducing race conditions and extra queries.
   - **Follow-up:** What if the application expects a different shape?

<nav aria-label="Lecture navigation">

[Previous: PostgreSQL and `pg` Pool Lifecycle](day-27-postgresql-and-pg-pool-lifecycle.md) | [Roadmap](../node-roadmap.md) | [Next: Relational Correctness for APIs](day-29-relational-correctness-for-apis.md)

</nav>