# Day 2: APIs, Data Models, Indexes, and Caching

Quick review of main-course lectures 8–14. Covers API contract design, pagination strategies, database paradigm selection, B-Tree vs LSM-Tree indexes, caching topologies, L4/L7 load balancing, and object delivery architectures.

## APIs, data models, and storage engines

**1. API interface paradigms and contracts**

- *REST:* Resource-oriented over HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`). Universal client support.
- *gRPC:* Binary serialization over HTTP/2 using Protocol Buffers; high throughput and low latency for inter-service communication.
- *Idempotency Keys:* Client sends unique `Idempotency-Key: <UUID>` header; server records key in a deduplication store to prevent duplicate charge/write execution on network retry.

**2. Pagination: Cursor vs Offset**

Offset pagination (`OFFSET 100000 LIMIT 20`) requires the database to scan and discard 100,000 rows ($O(n)$) and suffers page drift when rows are inserted. Cursor-based pagination filters on indexed monotonic column ($O(1)$ seek).

```sql
-- Bad: O(N) scan degrades at high offsets
SELECT * FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 50000;

-- Good: O(1) B-tree seek using cursor
SELECT * FROM orders WHERE id < 'cursor_last_id' ORDER BY id DESC LIMIT 20;
```

**3. Database selection paradigm matrix**

- *Relational (PostgreSQL, MySQL):* Structured schema, multi-table joins, ACID guarantees, B-tree indexes. Best for transactional banking, orders.
- *Document (MongoDB):* Polymorphic JSON-like documents, denormalized embedded hierarchies. Best for catalogs, user profiles.
- *Key-Value (Redis):* In-memory sub-millisecond key lookups. Best for sessions, leaderboards, hot caches.
- *Wide-Column (Cassandra, ScyllaDB):* High-throughput writes partitioned across cluster nodes using LSM-Trees. Best for time-series, IoT, telemetry.

**4. Storage engine internals: B-Tree vs LSM-Tree**

- *B-Tree (InnoDB, Postgres):* Balanced search tree optimized for reads ($O(\log n)$ disk page seeks); random writes cause random I/O and page splits.
- *LSM-Tree (Cassandra, RocksDB):* Writes append sequentially to in-memory MemTable and Write-Ahead Log (WAL), flushing immutable SSTables to disk; optimized for massive write throughput at the cost of read amplification.

[API and interface design](../../SystemDesign/system-design-lectures/day-08-api-and-interface-design.md) | [Data modeling and storage](../../SystemDesign/system-design-lectures/day-09-data-modeling-and-storage-choices.md) | [Indexes and query patterns](../../SystemDesign/system-design-lectures/day-10-indexes-and-query-patterns.md)

## Caching, load balancing, and object delivery

**1. Caching patterns and stampede prevention**

- *Cache-Aside (Lazy Loading):* Application reads cache; on miss, reads DB and populates cache. Writes update DB and invalidate cache.
- *Write-Through:* Application writes to cache; cache writes synchronously to DB.
- *Write-Back (Write-Behind):* Writes save to cache immediately and flush asynchronously to DB in batches (high throughput, risk of data loss on crash).
- *Cache Stampede / Thundering Herd:* Hot key expires; thousands of concurrent requests hit the database simultaneously. Solution: distributed mutex lock (`SET key NX EX`) or early refresh via probabilistic early expiration (XFetch algorithm).

**2. Load balancing: L4 vs L7 and consistent hashing**

- *L4 (Transport Layer):* Routes TCP/UDP packets based on IP and port without decrypting TLS or inspecting HTTP headers; extremely fast.
- *L7 (Application Layer):* Inspects HTTP paths, headers, and cookies to route traffic intelligently (e.g. `/api/v1/users` to User Service); handles TLS termination.
- *Consistent Hashing:* Distributes keys across a ring with virtual nodes (e.g. 100–200 replicas per physical node). Adding or removing a server relocates only $K / N$ keys on average.

```text
[Client] ---> [L7 Load Balancer] (TLS Termination, Routing by Path)
                     |
       +-------------+-------------+
       |                           |
[App Server 1]              [App Server 2]
```

**3. Large blob delivery: Object storage and CDNs**

Never stream large files through application web servers. Have the client request a short-lived Pre-Signed S3 Upload URL from the backend; client uploads binary directly to S3. For downloads, distribute static media globally via a Content Delivery Network (CDN) edge cache.

```text
1. Client requests upload ticket -> App Server generates S3 Pre-signed URL
2. Client uploads file (100MB) directly to S3 bucket via PUT pre-signed URL
3. S3 triggers async SQS notification -> Worker processes transcoding/thumbnails
```

[Caching fundamentals](../../SystemDesign/system-design-lectures/day-11-caching-fundamentals.md) | [Load balancing](../../SystemDesign/system-design-lectures/day-12-load-balancing-and-stateless-services.md) | [Queues and async processing](../../SystemDesign/system-design-lectures/day-13-queues-and-asynchronous-processing.md) | [Object storage and CDN](../../SystemDesign/system-design-lectures/day-14-object-storage-and-content-delivery.md)

## Tricky points

1. **APIs and indexes**
   **1.1 Leftmost prefix rule:** A composite index on `(tenant_id, status, created_at)` can accelerate queries on `tenant_id` and `(tenant_id, status)`, but is ignored if the query filters only on `status` or `created_at`.
   **1.2 Over-indexing writes:** Adding indexes speeds up `SELECT` reads but degrades `INSERT`, `UPDATE`, and `DELETE` throughput because every index tree must be updated and rebalanced on disk.

2. **Caching pitfalls**
   **2.1 Cache update vs invalidate:** In cache-aside, prefer *invalidating* the key (`DEL key`) on database write rather than updating the cached value; simultaneous updates can cause race conditions leaving stale data in cache.
   **2.2 Cache penetration:** Requests for non-existent IDs repeatedly bypass cache and strike the DB. Prevent with Bloom filters or by caching `null` values with a short TTL.
   **2.3 Session state on servers:** Storing user session state in local server memory breaks horizontal auto-scaling and forces sticky sessions; store sessions in external distributed stores like Redis.