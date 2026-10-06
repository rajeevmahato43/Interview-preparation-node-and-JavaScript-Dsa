# Day 2: APIs, Data, and Read Paths

## Interfaces and persistence

1. **API contract:** Define resource operations, validation, pagination, error shape, versioning, and retry semantics.
2. **Data modeling:** Start with access patterns and invariants; choose relational/document shape based on relationships, writes, queries, and lifecycle.
3. **Indexes:** Match indexes to real filters/sorts; indexes improve some reads but cost storage and write work. [API](../../SystemDesign/system-design-lectures/day-08-api-and-interface-design.md) | [Modeling](../../SystemDesign/system-design-lectures/day-09-data-modeling-and-storage-choices.md) | [Indexes](../../SystemDesign/system-design-lectures/day-10-indexes-and-query-patterns.md)

## Serving reads

1. **Caching:** Store repeated results near callers; define key, TTL/invalidation, acceptable staleness, and cache-failure behavior.
2. **Load balancing:** Distributes traffic across healthy instances; stateless services avoid dependence on one instance's memory.
3. **Blob delivery:** Keep large objects in object storage and serve through signed access/CDN when appropriate; keep metadata and authorization explicit. [Caching](../../SystemDesign/system-design-lectures/day-11-caching-fundamentals.md) | [Load balancing](../../SystemDesign/system-design-lectures/day-12-load-balancing-and-stateless-services.md) | [Object storage/CDN](../../SystemDesign/system-design-lectures/day-14-object-storage-and-content-delivery.md)

## Tricky points

1. **API and modeling**
	1.1 **Pagination:** Offset pagination can become costly and unstable at depth; cursor order must be deterministic.
	1.2 **Schema choice:** “SQL vs NoSQL” is not a scale slogan; compare constraints, query shapes, and update patterns.
	1.3 **Indexes:** An index is not free and may not be selected by the query planner.
2. **Caching and delivery**
	2.1 **Staleness:** Define how stale data can be and how writes invalidate or refresh it.
	2.2 **Cache failure:** Decide whether to bypass, degrade, or reject; an uncontrolled fallback can overload the database.
	2.3 **Statelessness:** Sticky routing can mask instance-local state rather than solve shared-state requirements.