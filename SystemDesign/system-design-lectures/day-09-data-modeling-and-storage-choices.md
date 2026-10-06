# Day 09: Data Modeling and Storage Choices

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> | Previous: <a href="day-08-api-and-interface-design.md">Day 08</a> | Next: <a href="day-10-indexes-and-query-patterns.md">Day 10</a></nav>

## What You Will Learn Today

- Start a data model from entities, access patterns, and invariants rather than a favorite database.
- Compare relational and document models by workload and correctness requirements.
- Choose where normalization, denormalization, and ownership reduce total complexity.
- Account for lifecycle, consistency, and migration costs in storage decisions.

## Prerequisites

- [Day 03: Functional Requirements, Quality Attributes, and Constraints](day-03-requirements-and-quality-attributes.md)
- [Day 08: API and Interface Design](day-08-api-and-interface-design.md)

## Quick Vocabulary Card

- **Entity:** A domain object with identity and a lifecycle, such as a user or link.
- **Access pattern:** A specific read or write the application must perform, including filters, sort, and freshness expectations.
- **Normalization:** Separating facts to reduce duplication and preserve update consistency.
- **Denormalization:** Storing a derived or repeated representation to make a read cheaper, accepting synchronization work.
- **Source of truth:** The authoritative representation from which other copies or projections can be repaired.

## Core Concepts

Data modeling translates product behavior into durable facts and allowed operations. A database choice affects constraints, query shape, transaction boundaries, failure handling, and future change. Start by listing reads and writes with their frequency, filters, ordering, freshness, and invariants. Only then compare storage models. The roadmap’s [Day 09 entry](../system-design-roadmap.md#day-09-data-modeling-and-storage-choices) points to [PostgreSQL documentation](https://www.postgresql.org/docs/) and [MongoDB data modeling guidance](https://www.mongodb.com/docs/manual/data-modeling/); these describe product capabilities, not an automatic answer for a particular workload.

### Derive the model from access patterns

For a link service, likely entities include owners, links, and click events. Candidate operations are: create a link; look up a code during redirect; list one owner's links newest-first; revoke a link; and aggregate clicks over time. Record the important invariant: a code is unique, and only its owner or an authorized operator can revoke the link. That invariant should be enforced at the appropriate authoritative boundary, not merely assumed by application code.

An access-pattern table makes design assumptions visible:

| Operation | Data needed | Correctness need |
| --- | --- | --- |
| Redirect by code | Destination, status, expiry | Code uniqueness; disabled links not served |
| Owner list | Link summary by owner, ordered by creation | Stable paging; owner isolation |
| Revoke | Link status and owner | Authorized, race-safe update |
| Click reporting | Event facts grouped over time | Delayed aggregation may be acceptable |

The table often reveals multiple shapes of data. A redirect lookup is latency-sensitive and narrow. Click events can grow without bound and may be better retained or aggregated separately from mutable link metadata. Keeping every click embedded in one document would make the document grow continuously and create write contention; a separate event stream or analytics store may fit better, depending on volume and reporting needs.

### Relational and document models fit different constraints

A relational model represents entities in tables and relationships with keys. It is a strong fit when relationships, constraints, joins, and multi-row transactions are important. A unique constraint on a short code can arbitrate concurrent creates; a foreign key can express ownership if the chosen schema needs that relationship. SQL databases also support flexible querying, but query and transaction cost still depend on indexes, data size, and isolation.

A document model groups data that is commonly read and updated together into a document. Embedding a small, bounded set of fields can reduce read coordination. Referencing separately managed or unbounded data avoids duplicating large or rapidly changing collections. Document databases differ in their query, indexing, transaction, and consistency capabilities; do not assume all are schemaless or that multi-document operations have identical guarantees. Validate the chosen product's documented behavior and deployment configuration.

Neither model wins by slogan. A relational database can store JSON and a document store can enforce some constraints; compare the actual query and integrity features needed. Consider operator expertise, backup and restore, tooling, expected growth, and whether the system needs transactions across related records.

### Normalize facts; denormalize measured reads

If an owner's display name is copied into every link record, renaming the owner requires updating many rows or accepting stale copies. Normalizing owner identity avoids repeated authoritative facts. But a read-heavy list might benefit from a snapshot field or precomputed summary. Such duplication introduces a consistency rule: which value is authoritative, when is the copy refreshed, and can it be rebuilt?

For example, keep `links` as authoritative link metadata and record click events separately. If the owner list needs a click count, a derived counter can be asynchronously updated. Then the product must accept a lagging count or use a different synchronous path. If the count is financially or legally significant, an eventually updated cache counter may not be sufficient as the only record. Match the representation to the consequence of error.

### Ownership and lifecycle are part of the schema

For each fact, identify its owner, mutation authority, retention period, deletion policy, and whether it is recoverable from another source. A user deletion may require removing metadata, expiring objects, and suppressing or deleting event records under policy. Keep data with different retention or access patterns separable when doing so simplifies enforcement and operations. Lifecycle rules must also cover backups and derived data; deleting one primary row does not automatically erase every copy.

## Common Mistakes and Interview Traps

- Choosing SQL or NoSQL before naming the workload and invariants.
- Optimizing only the most frequent read while ignoring write contention and update anomalies.
- Embedding an unbounded event list in a record because one screen shows the events together.
- Denormalizing without identifying the authoritative field, refresh behavior, and repair path.
- Treating a document model as constraint-free or assuming every relational query requires joins.
- Forgetting ownership, retention, deletion, and migration when drawing entities.
- Claiming a database enforces an invariant without confirming the actual schema and configuration.

## Tricky Points

Data duplication is not inherently wrong; ungoverned duplication is. The right trade-off depends on mutation frequency, staleness tolerance, rebuildability, and the cost of inconsistency. Likewise, a transaction can enforce a local invariant only within its actual transactional boundary and configured isolation semantics. Cross-service workflows require a separate coordination design rather than an assumption that two databases commit together.

## Practical Exercise

**Goal:** Model users, short links, and click events for a link service.

**Inputs/context:** Users create unique codes, list their own links, revoke links, and view click counts. Redirects look up code and must not serve expired or revoked links.

**Constraints:** Compare one relational and one document-oriented representation. State expected read/write volume qualitatively, consistency needs, and what data may grow without bound.

**Edge cases:** Two users choose the same code concurrently; owner is deleted; link is revoked during a redirect; analytics ingestion is delayed; a click event must be retained for a different period than link metadata.

**Acceptance criterion:** Provide entity/document shapes, access-pattern table, at least three integrity rules, source-of-truth ownership, retention assumptions, and one justified denormalization with a repair strategy. Do not write a full schema implementation.

## Summary

Model the operations and invariants before picking storage. Relational models are useful where relationships and constraints matter; document models can fit aggregates commonly accessed together. Workload shape, transactional boundaries, operational capability, and data lifecycle decide the fit. Denormalization is a deliberate consistency obligation, not a free read optimization.

## Cheat Sheet

- List read/write patterns, filters, ordering, volume, freshness, and invariants first.
- Separate bounded aggregates from unbounded event history.
- Relational: relationships, constraints, flexible queries, and transactions when supported/configured.
- Document: group data read and changed together; separate independent or unbounded data.
- Every denormalized field needs an authority, freshness rule, and repair path.
### Common Pitfalls

- Database-by-fashion; unbounded embedding; duplicate facts without ownership; missing retention/deletion rules.

## Interview Questions

1. **[Hard]** How do you decide whether a short-link service should use relational or document storage? **Expected answer shape:** Workload and access patterns, constraints, transaction scope, data growth, operations, and assumptions; avoid universal claims. **Follow-up:** What evidence would change the choice?
2. **[Hard]** Two concurrent requests attempt to claim the same short code. Where should uniqueness be enforced? **Expected answer shape:** Authoritative atomic constraint or equivalent, conflict response, retry policy, and why application-only prechecks race. **Follow-up:** What does the caller observe after a timeout during creation?
3. **[Hard]** Would you embed click events in each link record? **Expected answer shape:** Boundedness, write rate/contention, retrieval pattern, retention, aggregation, and alternative event storage. **Follow-up:** How would you rebuild a delayed click-count projection?
4. **[Very Hard]** A denormalized owner name improves a hot list query but owner renames must appear promptly. Defend a model. **Expected answer shape:** Authority, update fan-out or lookup alternative, freshness objective, failure/reconciliation strategy, and workload evidence. **Follow-up:** How do backup retention and deletion policy affect the design?