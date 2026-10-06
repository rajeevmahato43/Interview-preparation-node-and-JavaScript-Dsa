# Day 14: Object Storage, CDN, and Content Delivery

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> | Previous: <a href="day-13-queues-and-asynchronous-processing.md">Day 13</a> | Next: <a href="day-15-replication-and-read-scaling.md">Day 15</a></nav>

## What You Will Learn Today

- Separate blob bytes from queryable metadata and model their ownership and lifecycle.
- Design upload and download paths that avoid routing large payloads through application servers unnecessarily.
- Use short-lived signed access without confusing possession of a URL with identity or revocation.
- Apply CDN caching rules that respect privacy, freshness, and object versioning.

## Prerequisites

- [Day 06: Networking and Request Lifecycle](day-06-networking-and-request-lifecycle.md)
- [Day 08: API and Interface Design](day-08-api-and-interface-design.md)
- [Day 11: Caching Fundamentals](day-11-caching-fundamentals.md)

## Quick Vocabulary Card

- **Object storage:** A service that stores and retrieves whole objects addressed by keys, often suited to large binary data.
- **Metadata:** Queryable facts about an object, such as owner, size, media type, visibility, and lifecycle status.
- **Signed URL:** A time-limited capability URL granting a specific operation on a resource under defined conditions.
- **CDN:** A content delivery network that caches or serves content from locations closer to clients.
- **Lifecycle policy:** Rules for retention, transition, archival, or deletion of objects over time.

## Core Concepts

Large files usually have different access and scaling needs from transactional records. Store the bytes as objects and keep ownership, authorization, status, and searchable fields in a database. The database row does not prove that the object exists, and the object key does not automatically provide the product's authorization model. The roadmap’s [Day 14 entry](../system-design-roadmap.md#day-14-object-storage-cdn-and-content-delivery) links the [AWS Performance Efficiency pillar](https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/welcome.html) and [HTTP Caching, RFC 9111](https://www.rfc-editor.org/rfc/rfc9111); actual object and CDN semantics depend on the provider and configuration.

### Upload without turning the API into a file pipe

A common path is: the client asks the API to begin an upload; the API authenticates and authorizes, creates a pending metadata record, and issues a short-lived upload capability scoped to one object key and method; the client uploads directly to object storage; then a completion callback or client request records that the upload finished. The application verifies the object using a trusted mechanism before marking it available. Large uploads may need multipart transfer and resumability; checksums and size limits can help detect incomplete or unexpected content. Exact integrity features differ by provider, so verify what checksum is computed and when it is validated.

Do not mark an object published merely because the client claims an upload succeeded. A callback may be duplicated or delayed, and the metadata write can fail after bytes arrive. Use a state machine such as `pending`, `uploaded`, `scanning`, `available`, `rejected`, and `deleting`; make transitions conditional and idempotent. A reconciler can find old pending rows and orphaned objects. Keep object keys unguessable where appropriate, but secrecy of a key is not authorization.

### Metadata and blob lifecycle

Metadata should identify the owner, object key or version, declared and verified size/type, creation time, publication state, and retention policy. The object store holds bytes and may expose tags or custom metadata, but authorization and query needs often belong in the application database. Decide whether object versions are immutable, overwritten, or retained. Immutable versioned keys simplify cache correctness and audit, but require cleanup of obsolete versions.

Deletion spans separate systems and is not automatically atomic. A product may first revoke access in metadata, then asynchronously delete the object and CDN copies. If object deletion fails, access should still be denied while cleanup retries. If metadata is removed first, retain enough tombstone or outbox state to finish deletion and prove completion. Legal retention, backups, lifecycle rules, and derived thumbnails must be included. A lifecycle rule may delete bytes independently of metadata, so reconciliation should detect missing objects as well as orphans.

### Signed access and trust boundaries

A signed URL is a bearer capability: anyone holding it may be able to use it until it expires or another control blocks it. Scope it to one object, operation, and short validity period; avoid placing it in logs, analytics, referrer-bearing pages, or support tickets. Do not sign an unrestricted bucket path. For sensitive content, a CDN cache key and authorization model must not allow one user's private response to be served to another. Whether a CDN can validate tokens or signed cookies is product-specific.

Revoking a user does not necessarily invalidate an already issued capability immediately. Short expiration, object-specific version changes, an authorization proxy, or provider-supported revocation can reduce exposure, each with latency and cost. State the maximum revocation delay as a requirement. Public immutable assets can be cached for long periods; private or mutable content needs carefully scoped caching or revalidation.

### CDN freshness and content delivery

Cache-Control directives, validators, and CDN configuration affect whether a response is reused and revalidated. A long-lived immutable URL is easy to cache; when content changes, publish a new versioned URL rather than overwrite in place. If mutable URLs are required, define freshness lifetime and invalidation behavior, including propagation delay and failure. A purge request is not necessarily instantaneous at every edge. Large downloads can use range requests if supported end-to-end, but test behavior through the entire proxy/CDN path.

## Common Mistakes and Interview Traps

- Storing large blobs inside a transactional database by default without evaluating workload and operational impact.
- Treating metadata and object bytes as one atomic record across independent services.
- Publishing based only on a client completion claim or declared MIME type.
- Assuming an unguessable object key or signed URL is permanent authorization.
- Forgetting that signed URLs can leak and usually remain usable until expiry.
- Caching private content under a key that does not include its authorization context.
- Overwriting mutable content at a long-cached URL and expecting every CDN edge to refresh immediately.
- Deleting the database row but leaving bytes, derivatives, versions, and backups unaccounted for.

## Tricky Points

An upload URL generally grants the holder a capability, not an authenticated user session. Authorization is checked when issuing it; a later role change may not revoke it. Also distinguish transport success from validation and publication: bytes can be fully uploaded yet unsafe, malformed, or owned by a now-disabled account. Treat the upload lifecycle as a distributed state machine with cleanup and reconciliation.

## Practical Exercise

**Goal:** Design an image upload, scan, publish, and delivery flow.

**Inputs/context:** Users upload private images, can share selected images publicly, and may replace or delete them. The system creates thumbnails and serves public views through a CDN.

**Constraints:** Keep blobs out of the main metadata database, limit upload size/type, use short-lived scoped access, define CDN cache policy, and state object-version and deletion behavior.

**Edge cases:** Upload interrupted; completion callback duplicated; scanning fails; metadata commit fails after bytes arrive; user revoked while a URL remains valid; CDN retains a deleted image; orphan thumbnail.

**Acceptance criterion:** Draw upload and download paths, define metadata states and authority, document signed-capability scope, freshness/revocation bound, and reconciliation tasks for orphaned or missing objects. Do not implement provider-specific APIs.

## Summary

Object storage holds large bytes; an application database commonly holds ownership, access policy, and lifecycle metadata. Upload, verification, publication, CDN delivery, and deletion cross failure boundaries. Signed URLs are bearer capabilities with exposure and revocation limits. Versioned immutable content simplifies caching; mutable and private content requires explicit freshness and authorization rules.

## Cheat Sheet

- Metadata and blob bytes are separate resources with a reconciliation boundary.
- Upload state should distinguish pending, uploaded, validated, published, and deleted.
- Signed URLs are scoped, expiring bearer capabilities; protect them from leakage.
- Use immutable versioned URLs for long-lived caching when content changes.
- Define deletion across source object, versions, derivatives, CDN, lifecycle policy, and backup retention.
### Common Pitfalls

- Atomicity assumptions; unsafe publication; private-cache leakage; undeclared revocation delay; orphaned bytes.

## Interview Questions

1. **[Hard]** Why keep file bytes separate from file metadata? **Expected answer shape:** Workload, payload size, queryability, durability, access pattern, and cross-system consistency trade-offs. **Follow-up:** Which metadata must remain authoritative?
2. **[Hard]** Trace a direct-to-object-storage upload. **Expected answer shape:** Authorization, pending state, scoped capability, completion verification, scanning/publication, and cleanup. **Follow-up:** What if bytes arrive but the metadata commit fails?
3. **[Hard]** How should a CDN serve private files without leaking one user's content to another? **Expected answer shape:** Cache key/authorization boundary, signed access or proxy, TTL, revocation, and sensitive URL handling. **Follow-up:** What does the product promise after account revocation?
4. **[Very Hard]** Design replacement and deletion for a public image with thumbnails and long-lived edge caches. **Expected answer shape:** Immutable versions, metadata state, invalidation limits, tombstones, cleanup/reconciliation, and retention policy. **Follow-up:** How would you prove deletion completed across replicas and backups?