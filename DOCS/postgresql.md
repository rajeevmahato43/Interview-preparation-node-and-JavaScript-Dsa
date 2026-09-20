# PostgreSQL Domain Instructions

Teach PostgreSQL through relational modeling, declarative correctness, query planning, and transaction behavior.

## Required scope

Cover tables and relationships, keys and constraints, normalization, SQL expressions, joins, grouping, window functions, subqueries, common table expressions, indexes, `EXPLAIN`, transactions, isolation, locking, MVCC, concurrency, migrations, roles and permissions, backups, performance, and Node.js integration.

## Teaching requirements

- Explain the logical order of SQL processing before discussing query rewrites.
- Use constraints to express correctness and discuss why application-only validation is insufficient.
- Distinguish index usefulness from index presence; relate recommendations to selectivity, ordering, write cost, and query plans.
- Trace transaction anomalies and explain isolation and locking with concrete timelines.
- State assumptions about nullability, cardinality, data volume, and workload for performance claims.

## Boundaries

Use [node.md](node.md) for connection pools and runtime behavior, [express.md](express.md) for API integration, and [mongodb.md](mongodb.md) for document-model comparisons. Label SQL, `psql`, and Node client examples precisely and never hide transaction boundaries.