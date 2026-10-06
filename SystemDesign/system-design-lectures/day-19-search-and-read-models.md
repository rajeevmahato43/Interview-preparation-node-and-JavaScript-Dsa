# Day 19: Search, Filtering, and Read Models

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> | <a href="day-18-consistency-models-and-cap.md">Previous: Day 18</a> | <a href="day-20-data-lifecycle-backup-and-recovery.md">Next: Day 20</a></nav>

## What You Will Learn Today

- Explain how an inverted index supports text search and why it is distinct from a transactional database index.
- Separate the authoritative write model from a query-optimized search or read model.
- Design an update path that tolerates indexing delay, retries, duplicates, and reindexing.
- Set user-facing behavior for stale search results, filters, sorting, and pagination.

## Prerequisites

- [Day 09: Data Modeling and Storage Choices](../system-design-roadmap.md#day-09-data-modeling-and-storage-choices)
- [Day 10: Indexes, Query Patterns, and Data Access](../system-design-roadmap.md#day-10-indexes-query-patterns-and-data-access)
- [Day 11: Caching Fundamentals](../system-design-roadmap.md#day-11-caching-fundamentals)
- [Day 13: Asynchronous Processing and Message Queues](../system-design-roadmap.md#day-13-asynchronous-processing-and-message-queues)

## Quick Vocabulary Card

- **Search index:** A data structure optimized to find documents matching text or field queries.
- **Inverted index:** A mapping from terms to documents containing those terms, often with positions or other metadata.
- **Read model:** A representation shaped for a query or read workload, potentially derived from authoritative records.
- **Indexing lag:** Delay from a source update to the corresponding searchable representation.
- **Relevance ranking:** An ordering score that estimates which matches are most useful for a query; it is a product and model choice, not a universal truth.
- **Reindexing:** Rebuilding or refreshing an index from source data or a durable change history.

## Core Concepts

Search combines text matching, filters, ranking, facets, autocomplete, and pagination. Database indexes support many exact, range, and ordered queries; full-text search may need tokenization, term lookup, and relevance scoring. Choose a separate search engine only when query needs, scale, latency, and operating capacity justify it.

An inverted index turns a document such as “green wool jacket” into term entries that point back to that document. A query for “wool jacket” can find candidates through the terms, intersect or otherwise combine candidate sets, then score and filter them. Actual analyzers, ranking, language handling, storage layout, and consistency behavior are product-specific. The Elasticsearch guide documents its own index and search behavior; use it to verify version-sensitive details rather than assume all engines behave identically ([Elasticsearch index](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)).

### Source of truth and read model

In many systems, the transactional database owns the authoritative product, user, or order state. The search index stores a derived representation with fields chosen for search, filtering, sorting, and display. This duplication is deliberate: one representation is optimized for writes and constraints, another for discovery. The index can be rebuilt, but only if source data or a durable event history contains enough information.

Updates are commonly delivered asynchronously. The service commits the source record and an event/outbox record in one database transaction, then a worker publishes or applies changes to the search index. Without a reliable handoff, the classic dual-write failure occurs: the database commits but the process crashes before indexing, leaving the search result stale indefinitely. Consumers should be idempotent, events should carry a stable entity/version identifier, and failures should be retryable and visible. Deletions require tombstones or durable delete events; otherwise a later replay can resurrect a removed document.

Indexing is often near-real-time rather than immediately searchable. A successful source write therefore does not necessarily mean the next search returns the new state. The API can set expectations: show a “recently updated” detail page from the source database, return a freshness indicator, delay final confirmation until indexing completes when the use case requires it, or tolerate bounded staleness and monitor it. Do not claim read-your-writes from a search index unless the engine and write path provide a documented mechanism and it is used correctly.

### Worked scenario: product search

Assume a catalog has 5 million products, 20 edits/s, and peak 3,000 search requests/s. Users search title and description, filter by category and availability, sort by relevance or price, and paginate. Product detail pages must show the latest saved price; search results may lag by at most five seconds.

The catalog database validates and commits edits. A durable change event includes product ID, version, searchable fields, availability, and a deletion marker. An indexing worker applies events, rejects an older version if a newer one is already indexed, retries transient errors, and sends poison events to an inspectable failure path. Search queries use the index, while detail pages read authoritative data or a freshness-safe cache. The five-second target is monitored as event-to-search visibility lag, not inferred from worker health alone.

Availability may change faster than descriptions, so checkout must revalidate authoritative stock; search is discovery, not permission to sell. Evaluate relevance with representative queries because technical matches may still be poor results.

Offset pagination can be unstable as results change. Cursor-based pagination needs stable sort fields; changing relevance scores do not guarantee a stable snapshot.

### Rebuilds and schema evolution

Rebuilding is a production operation. Backfill a new index from a source snapshot, catch up later changes, validate representative data and queries, then shift traffic. Cutover is product-specific. Budget for both indexes during backfill and keep a rollback path. Version mapping/analyzer definitions; do not make the index the only copy of business-critical records.

## Common Mistakes and Interview Traps

- Treating the search engine as the transactional authority without explaining constraints, update conflicts, and recovery.
- Assuming an index update is immediately searchable or that the queue being empty proves freshness.
- Losing changes between database commit and event publication through a dual write.
- Forgetting deletes, duplicate events, out-of-order versions, or replay after rebuild.
- Treating search matches as final business validation for price, access control, or inventory.

## Tricky Points

- A search index can be healthy and still stale because of backlog, refresh behavior, failed documents, or source-event gaps. Monitor end-to-end freshness and indexing errors.
- Rebuild correctness depends on the relationship between the snapshot and concurrent updates; document how changes during backfill are captured and ordered.
- Denormalized read models simplify queries but create update fan-out and schema evolution costs. Include the owner and repair process for each projection.

## Practical Exercise

**Goal:** Design a product-search read model and its update flow.

**Input/context:** A catalog contains 5 million products. Search supports text, category, availability, price sorting, and relevance ranking. Product detail and checkout require current authoritative values; search may lag no more than five seconds under normal operation.

**Constraints:** Keep the source of truth explicit. Define how an edit and delete reach the index, how duplicates and stale events are handled, and how a reindex works while traffic continues.

**Edge cases:** Worker outage creates backlog; a deletion arrives before an older update; backfill overlaps live changes; one malformed record repeatedly fails; index is unavailable during checkout.

**Acceptance criteria:** Draw the source-to-index flow, specify the user-visible stale-data behavior, name three freshness/repair signals, and define how checkout avoids trusting stale search data. No full implementation is required.

## Summary

Search indexes and read models trade immediate consistency and write simplicity for query-specific access. Keep the source of truth clear, publish changes durably, make projection updates idempotent and version-aware, and measure end-to-end indexing lag. Search results are a discovery interface; critical decisions such as authorization, price, or stock should be revalidated against their authority.

## Cheat Sheet

- **Inverted index:** Terms point to matching documents; ranking and analyzers vary by engine.
- **Read model:** Derived representation for a specific query workload.
- **Update path:** Commit source + durable event, consume idempotently, track version, retry failures.
- **Freshness:** Measure source-change-to-search-visible lag; define acceptable stale behavior.
- **Rebuild:** Snapshot + concurrent-change capture + validation + controlled cutover + rollback.
- **Common Pitfalls:** Dual-write loss; assuming immediate search; forgetting deletion/replay; using search as a transactional gate.

## Interview Questions

1. **[Hard]** Why might a product edit succeed while a search for that product still returns old data? **Expected answer shape:** Trace source commit, event path, indexing delay, and search visibility; distinguish correctness from freshness. **Follow-up:** What signal proves the user-visible indexing SLO is met?
2. **[Hard]** Design the update flow for search documents when events can be duplicated or arrive out of order. **Expected answer shape:** Cover stable IDs, versions, idempotency, deletes, retries, and poison events. **Follow-up:** How do you safely rebuild while updates continue?
3. **[Very Hard]** Decide whether a catalog should use its primary database for search or a dedicated search read model. **Expected answer shape:** Compare query requirements, scale, latency, freshness, operational cost, and source-of-truth boundaries under stated workload. **Follow-up:** Which measurements or query failures would trigger the migration?