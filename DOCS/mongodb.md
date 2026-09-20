# MongoDB Domain Instructions

Teach MongoDB through data-access decisions: document shape, query patterns, indexes, consistency, and operational tradeoffs.

## Required scope

Cover documents and BSON types, embedding versus referencing, schema evolution, CRUD, query operators, projections, aggregation, indexes, explain plans, replication, read and write concerns, transactions, concurrency, atomicity, change streams, validation, security, backups, and Node.js integration.

## Teaching requirements

- Start from access patterns and workload assumptions before recommending a schema.
- Explain how indexes affect reads, writes, memory, sort behavior, and query plans.
- Distinguish single-document atomicity from multi-document transactions and distributed consistency choices.
- Discuss denormalization, document growth, pagination, retryable operations, and failure handling.
- Identify whether an example uses the MongoDB driver, a shell, or an ODM, and do not blur their guarantees.

## Boundaries

Use [node.md](node.md) for runtime and driver lifecycle concerns, [express.md](express.md) for HTTP integration, and [postgresql.md](postgresql.md) for relational alternatives. Do not claim MongoDB is schema-free; explain where schema rules are enforced and what tradeoffs follow.