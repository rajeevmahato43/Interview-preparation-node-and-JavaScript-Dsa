# Day 41: Case Study - File Storage and Sharing

<nav aria-label="Lecture navigation">
  <a href="../system-design-roadmap.md">Roadmap</a> ·
  <a href="day-40-case-study-messaging.md">Previous: Day 40</a> ·
  <a href="day-42-capstone-and-interview-review.md">Next: Day 42</a>
</nav>

## What You Will Learn Today

Design a file-sharing service that moves large bytes directly between clients and object storage while keeping authorization, scan state, and lifecycle metadata under application control. You will handle multipart transfer, interrupted uploads, signed access, malware scanning, deletion, and the consistency gap between metadata and object storage.

## Prerequisites

- [Day 08: API and Interface Design](day-08-api-and-interface-design.md)
- [Day 09: Data Modeling and Storage Choices](day-09-data-modeling-and-storage-choices.md)
- [Day 11: Caching Fundamentals](day-11-caching-fundamentals.md)
- [Day 14: Object Storage, CDN, and Content Delivery](day-14-object-storage-and-content-delivery.md)
- [Day 20: Data Lifecycle, Retention, and Backups](day-20-data-lifecycle-backup-and-recovery.md)
- [Day 28: Security and Abuse Resistance](day-28-security-and-threat-modeling.md)

## Quick Vocabulary Card

- **Object storage:** A service for durable binary objects addressed by keys, separate from relational metadata.
- **Multipart upload:** A large object is sent as independently retryable parts and finalized after all required parts arrive.
- **Signed URL:** A time-limited authorization token embedded in a URL that grants a narrowly scoped storage operation.
- **Quarantine:** A state or location where uploaded content is not yet available to other users.
- **Orphan object:** A stored object with no valid metadata reference, often left by interrupted workflows.

## Core Concepts

### Define the lifecycle before drawing components

Assume authenticated users upload files, scan them before sharing, set private or invited-user access, download/version them, and delete them. Exclude collaborative editing and public anonymous write access. The key invariant is that no user can download content unless metadata says the object is published and the caller is authorized. Object storage owns bytes; the application database owns owner, ACL, version, scan status, and lifecycle state.

Use a state machine such as `PENDING_UPLOAD -> QUARANTINED -> SCANNING -> AVAILABLE`, with terminal `REJECTED`, `DELETE_PENDING`, and `DELETED` states. A client upload completing is not the same as content becoming shareable. State transitions should be explicit and idempotent.

### Estimate transfer and storage

Assume 5 million files/day at 20 MB: 100 TB/day, or 3 PB over 30 days if nothing expires. Retention and quotas dominate cost. Proxying every byte through API servers adds huge network load, so upload directly to storage after authorization.

### API and metadata model

An API can separate control plane from byte transfer:

```text
POST   /v1/files/uploads              create upload session
POST   /v1/files/{id}/complete        finalize and request scan
GET    /v1/files/{id}                 authorized metadata
POST   /v1/files/{id}/download-link   issue short-lived read access
DELETE /v1/files/{id}                 request deletion
```

Return a scoped, short-lived upload URL. Store owner, generated object key/version, size, checksum, type, state, and timestamps; keep independent grants in an ACL table. Enforce access in the service and never trust client-chosen keys. Validate actual size and detected type after upload; checksums establish consistency, not safety.

### Upload and download flow

The service authenticates, checks quota, creates `PENDING_UPLOAD`, and issues multipart credentials scoped to a generated key. The client uploads/retries parts directly. Completion verifies object, size, checksum, and version, then queues scanning in quarantine. An idempotent scanner marks clean content `AVAILABLE`; only then can download access be issued.

Authorize against current metadata before signing a short-lived URL for the exact version. Anyone holding the bearer URL can use it until expiry; avoid leaking it. CDN use needs private-cache and deletion controls.

### Failure paths and consistency

1. **Client stops midway:** The upload record remains pending and parts consume storage. Expire abandoned sessions and run a cleanup job. Do not expose the object; allow safe resume only while the session and credentials remain valid.
2. **Object upload succeeds but completion call fails:** The object is an orphan relative to metadata. The client can retry completion idempotently; a reconciler compares aged objects and sessions, then attaches valid content or deletes it after a grace period.
3. **Metadata commits but object finalization fails:** Keep state pending, retry or mark failed, and never issue a download link. A periodic verifier can detect missing object versions.
4. **Scanner is delayed or unavailable:** Keep content quarantined and report processing status. Apply queue-age alerts and bounded retries; never fail open to `AVAILABLE` because the scan queue is unhealthy.
5. **Delete request races with download link:** Mark deletion pending and deny new links immediately, then remove object versions and CDN entries asynchronously. Previously issued signed links may remain usable until expiry unless the storage layer supports stronger revocation. Retain a tombstone long enough to prevent stale metadata from resurrecting access.

Metadata and object storage usually do not share one transaction. Use a durable state machine, outbox events, idempotent transitions, and reconciliation rather than pretending the two commits are atomic. For versioning, bind each metadata record to an exact object version so a later overwrite cannot silently change content behind an existing authorization decision.

### Operations and security

Measure upload/part retries, orphan bytes, scan age, download latency, storage by retention class, and deletion delay. Audit sharing without logging content or signed tokens. Defend against guessed keys, broad URLs, malicious/decompression-bomb files, public buckets, ACL errors, and abandoned parts. Use least privilege, encryption, private defaults, scanning, and limits. Define deletion across versions, CDN, replicas, backups, and legal holds honestly.

## Common Mistakes and Interview Traps

- Proxying all large bytes through application servers without a measured reason.
- Treating a successful upload as a safe, published file.
- Using a client filename or object key as an authorization boundary.
- Issuing long-lived signed URLs and claiming deletion instantly revokes them.
- Ignoring multipart cleanup, object versions, and orphan reconciliation.
- Assuming metadata and blob writes participate in one transaction.

## Tricky Points

A signed URL moves authorization into a bearer token: access control is evaluated when issuing it, while actual use may occur later. Short expiry limits exposure but does not make a link single-use. Similarly, deletion has multiple meanings: deny future metadata reads, invalidate CDN delivery, remove current object, purge versions, and expire backup copies. Define which deadline applies to each layer.

## Practical Exercise

**Goal:** Design secure upload, scan, share, download, and deletion for large files.

**Input/context:** Assume 5 million daily uploads averaging 20 MB, multipart support, private-by-default access, invited-user sharing, and a malware-scanning queue.

**Constraints:** Keep bytes off application servers, use short-lived scoped credentials, define states and quotas, and include a deletion/retention policy.

**Edge cases:** Interrupted multipart upload, duplicate completion request, mismatched checksum, scanner outage, metadata/object divergence, ACL revoked after URL issuance, and deletion with cached content.

**Acceptance criteria:** Provide storage estimates, APIs and metadata, upload/download state flows, at least two failure traces, trust boundaries, cleanup/reconciliation, and an honest signed-link revocation guarantee.

## Summary

Keep file bytes in object storage and authorization/lifecycle metadata in a transactional control plane. Direct multipart transfer avoids routing large payloads through API servers, while quarantine prevents unscanned content from becoming available. Since metadata and object writes are not one transaction, use explicit states, idempotency, cleanup, and reconciliation. Signed links, versions, caches, and backups all affect the real deletion and access contract.

## Cheat Sheet

- **Control plane:** ownership, ACL, state, version, quota.
- **Data plane:** direct multipart bytes to private object storage.
- **Publish:** Verify -> quarantine -> scan -> mark available.
- **Delete:** Deny new links first; asynchronously remove versions and cached copies.
- **Reconcile:** Find orphan, missing, stale, and incomplete objects.
- **Common Pitfalls:** Public-by-default keys; trusting declared MIME type; unbounded signed URLs; no abandoned-part cleanup; claiming atomic metadata/blob updates.

## Interview Questions

1. **Hard:** Why store metadata separately from file bytes? **Expected answer shape:** Compare access patterns, size, transactions, transfer path, and lifecycle. **Follow-up:** Which metadata belongs in the application database?
2. **Hard:** Trace an upload whose bytes arrive but whose completion request is lost. **Expected answer shape:** Explain idempotent completion, pending state, object verification, and orphan cleanup. **Follow-up:** How do you prevent cleanup racing a slow client?
3. **Very Hard:** Design deletion when signed URLs and CDN caches may still exist. **Expected answer shape:** Separate deny-new-access, URL expiry, cache purge, object versions, tombstones, and backup retention. **Follow-up:** Which guarantees can the application enforce immediately?
4. **Very Hard:** The scanner is unavailable while uploads continue. **Expected answer shape:** Keep quarantine, bound storage/backlog, apply admission control, expose status, and define recovery/replay. **Follow-up:** What evidence allows safe transition to available?