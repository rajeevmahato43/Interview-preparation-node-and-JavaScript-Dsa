# PostgreSQL Domain Instructions

Teach PostgreSQL through relational data modeling, declarative correctness, query planner mechanics, and transaction ACID guarantees.

Follow the shared rules in [content-rules.md](content-rules.md), [example-rules.md](example-rules.md), and [interview-rules.md](interview-rules.md).

---

## Foundational Philosophy

> **"Never write a SQL query or index recommendation without first understanding the logical SQL execution order, table cardinality, and the query planner's scan cost."**

Teach candidates how PostgreSQL executes queries physically: sequentially scanning heaps, probing B-Tree indexes, executing nested loops vs hash joins, and isolating transactions using Multi-Version Concurrency Control (MVCC).

---

## Required Scope

Cover relational normalization (1NF through BCNF), primary/foreign keys, check constraints, SQL execution order, joins (`INNER`, `LEFT`, `CROSS`, `LATERAL`), grouping and aggregations, window functions, CTEs and recursive queries, indexing strategies (B-Tree, GIN, GiST, BRIN, partial indexes), `EXPLAIN (ANALYZE, BUFFERS)`, ACID transactions, isolation levels, MVCC, row-level locking, connection pooling (`pgBouncer`), and Node.js `pg` driver integration.

---

## Teaching Standards

1. **Basic English Definitions:** Explain every relational and transaction concept in plain, simple English words. Define what it is, what it does, and what it does NOT do before introducing technical jargon.
2. **In-Place Term Callouts:** Define terms like `MVCC`, `Deadlock`, `Idempotency`, `Write-Ahead Log (WAL)`, and `Isolation Level` right where they appear.
3. **Dual-Case Implementations:** Always show `✅ CORRECT / POSITIVE CASE` (e.g., query utilizing a composite index matching left-to-right order) alongside `❌ ANTI-PATTERN / COMMON BUG` (e.g., wrapping an indexed column in a function like `WHERE LOWER(email) = ...` triggering an accidental full sequential table scan) with inline explanations.
4. **No Artificial Line Count Limits:** Never constrain lectures to arbitrary line counts. Lectures can be as long and comprehensive as necessary to deliver exhaustive, world-class depth, line-by-line query derivations, and complete clarity without superficial summaries or forced truncation.
5. **Topic-Appropriate Architecture:** Structure each lecture according to its core discipline (normalization, query planning, ACID transactions, locking) rather than a rigid, robotic template.
6. **Short, Clean Headings:** Headings must be short, direct, and clean with zero fluff (e.g., `## 1. What is MVCC`, `### 1.1 Snapshot Isolation`). Never use long, descriptive subtitles, colons, or parenthetical explanations in headings.
7. **No Preachy Meta-Interview Talk:** Deliver the relational algebra, planner costs, and transaction isolation insights directly without preachy meta-interview commentary.