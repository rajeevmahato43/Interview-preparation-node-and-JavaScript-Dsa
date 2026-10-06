# Day 36: Case Study - URL Shortener

<nav aria-label="Lecture navigation">
  <a href="../system-design-roadmap.md">Roadmap</a> ·
  <a href="day-35-disaster-recovery-and-readiness.md">Previous: Day 35</a> ·
  <a href="day-37-case-study-rate-limiter.md">Next: Day 37</a>
</nav>

## What You Will Learn Today

Design a link-shortening service by separating its write path from its much hotter redirect path. You will make identifier generation and collision behavior explicit, estimate read-heavy traffic, choose a source of truth and cache strategy, and keep analytics or abuse controls from silently weakening redirect reliability.

## Prerequisites

- [Day 04: Capacity Estimation](day-04-capacity-estimation.md)
- [Day 08: API and Interface Design](day-08-api-and-interface-design.md)
- [Day 09: Data Modeling and Storage Choices](day-09-data-modeling-and-storage-choices.md)
- [Day 11: Caching Fundamentals](day-11-caching-fundamentals.md)
- [Day 17: Transactions and Data Integrity](day-17-transactions-and-data-integrity.md)
- [Day 18: Consistency Models and CAP](day-18-consistency-models-and-cap.md)

## Quick Vocabulary Card

- **Slug:** The short identifier in the public URL, such as `aB31xQ`.
- **Redirect:** An HTTP response that tells a client to request another URL. A permanent or temporary redirect communicates different caching intent; choose deliberately for product behavior.
- **Collision:** Two creation requests produce the same slug. The mapping must not be overwritten.
- **Hot key:** A disproportionately popular mapping that receives far more requests than other records.
- **Cache-aside:** The application checks a cache, reads from the source of truth on a miss, then populates the cache.

## Core Concepts

### Start with a bounded product

Assume authenticated users can create, inspect, and revoke links; anonymous visitors can resolve active links. A link may expire, and the service records aggregate click counts. Exclude custom branded domains, malware scanning, detailed attribution, and global multi-region writes from the first design. These are plausible extensions, not free requirements.

Assume creation is durable before success, redirects are low-latency in-region, revocation is prompt at origin, and analytics may lag. A collision must never expose another user's destination.

### Workload and first bottleneck

Assume 10 million new links monthly and 100 redirects per link over its lifetime: a 100:1 read/write ratio. This is about 400 redirects/second on average, or 4,000 at an assumed 10x peak. At 1 KB per mapping including basic index overhead, creation adds roughly 10 GB monthly before replicas, backups, and analytics. These are sizing assumptions, not forecasts. Redirects dominate; popular links skew load, so measure per-key distribution as well as average QPS.

### API and data model

Possible endpoints:

```text
POST   /v1/links                 authenticated create; accepts targetUrl, expiresAt?
GET    /v1/links/{slug}          owner-only metadata lookup
DELETE /v1/links/{slug}          owner-only revocation
GET    /{slug}                   public resolution
```

Creation validates scheme and length, applies abuse limits, and may use an idempotency key for retry safety. Return the URL only after commit. A relational model fits ownership and uniqueness requirements:

```text
Link(slug PRIMARY KEY, owner_id, target_url, created_at,
     expires_at NULL, revoked_at NULL, status)
```

Index `slug` uniquely. Add `(owner_id, created_at)` only if owner listings are in scope. Keep click events separate; a synchronous counter update creates hot writes and slows redirects.

### Identifier generation

Random URL-safe slugs hide creation volume and can be generated independently, but still require a unique constraint and bounded retry on collision. A database sequence encoded in base 62 simplifies allocation but can expose order and create an allocator dependency; preallocated ranges trade allocator traffic for range management. Choose entropy using alphabet size and expected volume, then rely on uniqueness as the correctness guard. Destination hashes are a poor default when identical URLs need distinct ownership or expiry, and may leak equality.

### Components and redirect flow

Use stateless API instances, a durable mapping store, distributed cache, and asynchronous click pipeline. `GET /{slug}` checks cache, then source of truth on miss; return a redirect only for active mappings. Bound active-entry TTL. Short negative caching can protect against random probes but must not hide a newly created slug.

Revoke durable state first, then invalidate cache. These operations are not atomic, so failed invalidation can leave a stale redirect. If stronger revocation is required, use short TTLs plus a revocation check or a synchronous denylist, accepting added read cost.

Do not wait for analytics on the redirect path. Publish a compact event asynchronously; on pipeline failure, explicitly drop, sample, or buffer within a strict bound. Click counts may be approximate and eventually consistent if the product accepts it.

### Failure paths and trade-offs

1. **Cache unavailable:** Continue to the database with concurrency limits and load shedding. The database may saturate under a redirect spike; a circuit breaker alone does not create capacity. Consider serving only known cached entries while protecting the source of truth, but communicate the resulting availability behavior.
2. **Database timeout after a cache miss:** Return a retryable server error rather than redirecting to an unknown destination. Apply a short deadline; the client can retry. Never turn a timeout into a fabricated not-found response because the record may exist.
3. **Analytics queue full:** Preserve redirect success under the chosen loss or bounded-buffer policy; track drops and backlog age.

Start with one relational primary and a cache if measured volume fits. Add read replicas or partitioning only when observed workload requires them; replicas can serve stale mappings and therefore need a read-after-create routing rule. A CDN may help for public redirects, but edge caching complicates revocation and expiry. Use it only with explicit cache directives and a tolerable stale window.

### Operations and security

Track redirect percentiles, cache hit rate, database latency, collisions, revocations, and analytics lag. Redact destination URLs and client IPs from logs and metrics; restrict metadata access. Validate schemes, cap creation rates, and make abuse takedown possible. Any preview/scanning fetcher needs SSRF defenses against private addresses and redirect chains. The public redirect service should direct the client, not fetch the target itself.

## Common Mistakes and Interview Traps

- Ignoring a viral hot key or treating average QPS as peak load.
- Assuming cache invalidation or CDN revocation is instantaneous.
- Updating analytics synchronously or acknowledging creation before durable commit.
- Choosing IDs without collision/privacy reasoning, or caching without a freshness contract.

## Tricky Points

Negative caching can race creation: invalidate a negative entry after commit or use a very short TTL. Revocation can also lag in browser, intermediary, CDN, and application caches, not just Redis; state a guarantee that includes those layers.

## Practical Exercise

**Goal:** Design a URL shortener for a single region that may later serve global traffic.

**Input/context:** Assume 10 million new links each month, 100:1 redirect-to-create ratio, custom slugs for paid users, optional expiry, and a tenfold peak over average traffic.

**Constraints:** Explain collision handling, authorization, revocation freshness, and analytics loss policy. Keep the initial design small-team operable.

**Edge cases:** Concurrent requests for the same custom slug, retry after a lost create response, expired link with a stale cache entry, popular link causing skew, and database outage during cache misses.

**Acceptance criteria:** Provide estimates, API/data model, create and redirect flows, two failure traces, security controls, and a defended choice among database-only, cache-aside, and CDN reads. Do not assume exact click counts.

## Summary

The design is driven by a read-heavy redirect path, uniqueness and revocation requirements, and skewed popularity. A durable mapping store owns correctness; caches accelerate reads but introduce bounded staleness. Keep analytics asynchronous, define what happens during cache and database failures, and treat destination handling as an abuse boundary. Add replicas, sharding, or CDN behavior only when the workload and freshness contract justify them.

## Cheat Sheet

- **Source of truth:** durable unique `slug` mapping.
- **Write:** validate and authorize, create idempotently if required, commit before success.
- **Read:** cache, authoritative lookup on miss, reject expired/revoked, redirect.
- **Analytics:** asynchronous, bounded, loss policy explicit.
- **Scaling:** estimate peak and key skew; consider replicas/CDN with freshness trade-offs.
- **Common Pitfalls:** collision-free claims without a uniqueness constraint; synchronous click writes; instant-revocation promises that ignore caches; SSRF-prone preview fetches.

## Interview Questions

1. **Hard:** Compare random slugs with sequence-derived base-62 identifiers. **Expected answer shape:** State scale and privacy assumptions, discuss allocation, collisions, enumeration, and operational dependency. **Follow-up:** How would you move to a second region without allocating duplicate IDs?
2. **Hard:** Trace a create request whose database commit succeeds but whose HTTP response is lost. **Expected answer shape:** Explain retry behavior, idempotency-key storage, uniqueness, and response replay. **Follow-up:** What is the retention policy for idempotency records?
3. **Very Hard:** A viral slug causes p99 latency and database CPU to rise despite a high overall cache hit ratio. **Expected answer shape:** Diagnose per-key skew and cache behavior, propose bounded mitigations, and name metrics and risks. **Follow-up:** When could a CDN make revocation unacceptable?
4. **Very Hard:** Define the strongest revocation guarantee the design can honestly offer across application and intermediary caches. **Expected answer shape:** Set a freshness boundary, trace invalidation failure, compare TTL, denylist, and edge purge options, and state cost. **Follow-up:** Which requirement would make you reject edge caching?