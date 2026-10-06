# Day 39: Case Study - Social Feed

<nav aria-label="Lecture navigation">
  <a href="../system-design-roadmap.md">Roadmap</a> ·
  <a href="day-38-case-study-notification-service.md">Previous: Day 38</a> ·
  <a href="day-40-case-study-messaging.md">Next: Day 40</a>
</nav>

## What You Will Learn Today

Design a home feed that combines posts from followed accounts while balancing freshness, read latency, write amplification, and ranking flexibility. You will compare fan-out-on-write with fan-out-on-read, explain why celebrity accounts create skew, and define what pagination and deletion mean in a changing feed.

## Prerequisites

- [Day 09: Data Modeling and Storage Choices](day-09-data-modeling-and-storage-choices.md)
- [Day 11: Caching Fundamentals](day-11-caching-fundamentals.md)
- [Day 13: Asynchronous Processing and Message Queues](day-13-queues-and-asynchronous-processing.md)
- [Day 15: Replication and Read Scaling](day-15-replication-and-read-scaling.md)
- [Day 16: Partitioning and Sharding](day-16-partitioning-and-sharding.md)
- [Day 18: Consistency Models and CAP](day-18-consistency-models-and-cap.md)
- [Day 19: Search, Filtering, and Read Models](day-19-search-and-read-models.md)

## Quick Vocabulary Card

- **Fan-out-on-write:** When a creator publishes, place that post ID into each follower's feed inbox.
- **Fan-out-on-read:** When a reader requests a feed, fetch recent posts from followed creators and merge them.
- **Hybrid fan-out:** Use write fan-out for ordinary creators and read-time merge for accounts whose follower count makes writes expensive.
- **Cursor pagination:** Continue from a stable ordering key instead of a numeric offset.
- **Ranking:** A policy that orders eligible content; it is separate from the storage mechanism that retrieves candidates.

## Core Concepts

### Bound the product and freshness contract

Assume users publish text-and-media posts, follow accounts, and request a reverse-chronological home feed. The first version excludes recommendations, full-text search, comments, and complex machine-learning ranking. A feed page should be fast and should usually include recent eligible posts, but a newly published post need not appear instantly on every device. Define an initial freshness target with the interviewer; “real time” is not a measurable requirement.

The post service owns canonical post content and visibility. A feed is a derived read model: it can be rebuilt from posts and follow relationships, though rebuilding may be expensive. This boundary means the feed cache must not become the authority for whether a post is private, deleted, or blocked.

### Estimate read and write pressure

Assume 100 million daily users request ten pages: one billion reads/day, about 11,600/second average or 116,000 at a 10x peak. Ten million daily posts with 200 followers each create two billion naive inbox writes. This exposes write amplification; follower distribution is heavy-tailed, so averages hide celebrity spikes.

### API and data model

An API might provide:

```text
POST   /v1/posts                 create a post
GET    /v1/feed?cursor=...       read the next page
POST   /v1/follows/{accountId}   follow an account
DELETE /v1/follows/{accountId}  unfollow an account
```

Use a canonical model such as `Post(post_id, author_id, created_at, visibility, body_ref, state)` and `Follow(follower_id, followed_id, created_at)`. Index follow relationships for both “who do I follow?” and, where needed, “who follows this creator?” A fan-out inbox may store `(viewer_id, sort_key, post_id)` with an index beginning with viewer and descending sort key. Keep media blobs in object storage and refer to them by controlled identifiers; do not put large payloads in feed rows.

For reverse chronology, use a stable cursor containing the last ordering tuple, such as `(created_at, post_id)`, not just a timestamp, since many posts can share a timestamp. Sign or otherwise validate opaque cursors so clients cannot alter internal query state. Offset pagination becomes expensive and unstable as new posts arrive.

### Choose a feed assembly strategy

**Write fan-out** makes reads cheap by asynchronously inserting post IDs into follower inboxes. It fits moderate follower counts and read-heavy use. Commit and enqueue through an outbox; never block publication on millions of inbox writes.

**Read fan-out** stores each post once and merges followed creators' posts on demand. It avoids huge writes but increases work for users following many active accounts. Bound candidate windows; caches may add staleness.

A hybrid fans out ordinary creators and merges high-follower/high-rate accounts at read time. Choose the threshold from backlog, follower distribution, read latency, and merge cost. Ranking should reorder bounded candidates, not trigger an unbounded scan.

### Request and event flows

On publish, authorize and persist the post plus outbox event transactionally. Workers batch followers and insert IDs idempotently. Reads merge inbox items with recent read-fan-out posts, filter visibility, rank bounded candidates, and return a cursor. Re-check access-sensitive state if prompt revocation is required.

Follow and unfollow changes need a stated boundary. A new follow may include only posts after the follow time, or may backfill recent posts. Unfollow should stop future visibility promptly; deleting every old inbox row synchronously is expensive. A relationship filter at read time can hide stale inbox entries while asynchronous cleanup runs.

### Failure paths and operations

1. **Fan-out backlog:** A busy creator's post appears late. Bound queue age, batch inserts, and isolate celebrity posts from normal fan-out. If latency exceeds the freshness target, use read-time merge for affected creators or show a temporary freshness indicator rather than blocking post creation.
2. **Duplicate or reordered events:** Retries can enqueue a post more than once. Use idempotent inbox writes keyed by viewer and post. Do not infer post order from queue arrival; use the post's canonical sort key.
3. **Feed store or cache failure:** Rebuild a page from canonical posts and follows where feasible, but cap work and protect the source database. A stale cached page may be acceptable for ordinary posts but not for private or removed content.
4. **Post deletion or privacy change:** Update canonical state first, then propagate tombstones or invalidate derived entries. Define the maximum stale-visibility window; cache purge alone is not a durable correctness mechanism.

Track feed latency, fan-out backlog age, writes per post, cache hits, merge size, duplicate pages, and takedown delay. Avoid logging content; authorize follow/post operations and isolate media access.

## Common Mistakes and Interview Traps

- Declaring fan-out-on-write or fan-out-on-read universally best.
- Multiplying average followers by posts while ignoring the heavy-tailed creator distribution.
- Doing fan-out synchronously before acknowledging a post.
- Using mutable numeric offsets for a feed that changes while paging.
- Treating a feed inbox as canonical permission state.
- Mixing ranking quality with retrieval capacity without bounding candidate work.

## Tricky Points

A cursor stabilizes the continuation boundary, but does not freeze the feed snapshot. New posts may appear above the cursor, while deletions and visibility changes may remove items between pages. If the product needs a consistent snapshot, it must carry a snapshot/version boundary or accept additional storage and complexity. For most home feeds, stable keyset pagination plus documented freshness is a better trade-off than pretending the result is a database snapshot.

## Practical Exercise

**Goal:** Design a home feed for a service with ordinary accounts and a small number of very large creators.

**Input/context:** Use 100 million daily users, ten feed reads per user daily, 10 million posts per day, and a highly skewed follower distribution.

**Constraints:** Compare write, read, and hybrid fan-out; include cursor semantics, follow changes, cache behavior, and prompt moderation/removal needs.

**Edge cases:** Duplicate fan-out event, celebrity post burst, unfollow while inbox work is queued, newly private post in a cached page, and a user paging while new posts arrive.

**Acceptance criteria:** Estimate read and inbox-write pressure, draw publish and read paths, choose a hybrid rule with metrics, trace two failures, and state the staleness users may observe.

## Summary

Feed design trades read cost against write amplification. Fan-out-on-write favors cheap reads for ordinary creators; fan-out-on-read avoids massive writes for celebrity accounts but increases query work. A hybrid strategy follows the workload distribution. Keep canonical content and visibility authoritative, use idempotent asynchronous fan-out, stable keyset cursors, and explicit staleness and deletion behavior.

## Cheat Sheet

- **Read-heavy ordinary feed:** Write fan-out can make reads predictable.
- **Very large creator:** Read-time merge avoids unbounded inbox writes.
- **Hybrid decision:** Follower count, post rate, backlog, and merge cost.
- **Paging:** `(created_at, post_id)` keyset cursor; offset is unstable under inserts.
- **Correctness:** Canonical post and relationship state govern visibility.
- **Common Pitfalls:** Synchronous fan-out; duplicate inbox rows; stale private posts; unbounded merge scans; assuming pagination is a frozen snapshot.

## Interview Questions

1. **Hard:** Estimate the cost difference between write fan-out and read fan-out for the given workload. **Expected answer shape:** Show assumptions and read/write arithmetic, identify distribution skew, and state likely bottleneck. **Follow-up:** Which measurement would change your strategy first?
2. **Hard:** How do you paginate a feed while new posts are arriving? **Expected answer shape:** Define a compound key cursor, describe continuation behavior, and state snapshot limitations. **Follow-up:** How would moderation deletion affect a cursor page?
3. **Very Hard:** A creator with 30 million followers posts during a peak. **Expected answer shape:** Trace hybrid routing, bound queue and merge work, cover idempotency and freshness, and name metrics. **Follow-up:** What if many such creators post at once?
4. **Very Hard:** A user unfollows an account while millions of inbox writes for that account are queued. **Expected answer shape:** Define relationship authority, read-time filtering, async cleanup, and privacy/freshness boundary. **Follow-up:** When would you backfill content on a new follow?