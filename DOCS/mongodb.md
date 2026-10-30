# MongoDB Domain Instructions

Teach MongoDB through first-principles data-access decisions: document shape, query patterns, indexing, consistency guarantees, and operational trade-offs.

Follow the shared rules in [content-rules.md](content-rules.md), [example-rules.md](example-rules.md), and [interview-rules.md](interview-rules.md).

---

## Foundational Philosophy

> **"Never recommend a MongoDB document schema without first analyzing the read/write workload, query access patterns, and growth bounds."**

Reject the myth that MongoDB is "schemaless". Teach candidates that schema design in document databases requires strict engineering discipline around document size limits (16MB), embedding vs referencing trade-offs, and index selectivity.

---

## Required Scope

Cover BSON data types, embedding vs referencing, schema validation, CRUD operations, query and projection operators, aggregation pipelines, single and compound indexes, `explain("executionStats")`, replica sets, read and write concerns, multi-document ACID transactions, change streams, and Node.js Mongoose/driver integration.

---

## Teaching Standards

1. **Basic English Definitions:** Explain every database concept in plain, simple English words. Define what it is, what it does, and what it does NOT do before introducing technical jargon.
2. **In-Place Term Callouts:** Define terms like `Write Concern`, `BSON`, `Covered Query`, and `Read Preference` right where they appear using 1-line callouts.
3. **Dual-Case Implementations:** Always show `✅ CORRECT / POSITIVE CASE` (e.g., covered index query, bounded arrays) alongside `❌ ANTI-PATTERN / COMMON BUG` (e.g., unbounded array growth causing document-moving reallocations) with inline explanations.
4. **No Artificial Line Count Limits:** Never constrain lectures to arbitrary line counts. Lectures can be as long and comprehensive as necessary to deliver exhaustive, world-class depth, line-by-line query derivations, and complete clarity without superficial summaries or forced truncation.
5. **Topic-Appropriate Architecture:** Structure each lecture according to its core discipline (schema design, indexing, aggregation pipelines) rather than a rigid, robotic template.
6. **Short, Clean Headings:** Headings must be short, direct, and clean with zero fluff (e.g., `## 1. What is an Index`, `### 1.1 Compound Index`). Never use long, descriptive subtitles, colons, or parenthetical explanations in headings.
7. **No Preachy Meta-Interview Talk:** Deliver the database mechanics, document limits, and query plan insights directly without preachy meta-interview commentary.