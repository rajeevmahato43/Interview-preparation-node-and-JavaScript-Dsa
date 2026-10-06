# Day 11: Caching Fundamentals

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> | Previous: <a href="day-10-indexes-and-query-patterns.md">Day 10</a> | Next: <a href="day-12-load-balancing-and-stateless-services.md">Day 12</a></nav>

## What You Will Learn Today

- Explain cache-aside and compare it with read-through and write-through concepts.
- Define cache keys, expiration, and freshness in relation to an authoritative store.
- Choose invalidation and failure behavior that fits the consequences of stale data.
- Reduce cache stampedes and recognize that a high hit ratio does not prove correctness.

## Prerequisites

- [Day 05: Latency, Throughput, and Tail Behavior](day-05-latency-throughput-and-queues.md)
- [Day 09: Data Modeling and Storage Choices](day-09-data-modeling-and-storage-choices.md)

## Quick Vocabulary Card

- **Cache-aside:** The application checks a cache, loads a miss from the source, then populates the cache.
- **TTL:** Time-to-live; a cache entry's configured expiration interval, not necessarily a guarantee about end-to-end data freshness.
- **Invalidation:** Removing or changing cached data after its source changes.
- **Stampede:** A surge of concurrent cache misses that overloads the source while many callers recompute or fetch the same item.
- **Negative caching:** Briefly caching that a lookup had no result to reduce repeated work, with care around newly created data.

## Core Concepts

A cache keeps a reusable copy close to a caller to reduce latency or source load. It is useful when repeated reads justify the cost of stale copies, cache management, and an additional failure mode. It does not replace the authoritative store unless the product explicitly makes that store disposable. The [Day 11 roadmap entry](../system-design-roadmap.md#day-11-caching-fundamentals) links the [Redis documentation](https://redis.io/docs/latest/); Redis features and eviction behavior are specific to its configuration and deployment.

### Cache-aside flow

In cache-aside, the application owns the lookup sequence:

1. Build a key from the resource identity and relevant representation context.
2. Read the cache. If an entry exists and is acceptable, return it.
3. On a miss, read the authoritative store.
4. Populate the cache with a bounded expiration and return the source result.

For a public product page, a key might include product ID and locale because the response differs by locale. Omitting locale can return the wrong representation; including irrelevant user-specific fields can destroy reuse or expose private data if authorization is bypassed. Keys should be canonical, versioned when representation changes require separation, and free of raw secrets or unnecessary personal data.

### Freshness needs a policy

A TTL limits how long an entry may remain without refresh under the cache's rules, but it does not guarantee that a reader sees the latest committed source value. Writes, invalidation delays, replica lag, clock behavior, and an in-flight miss can all affect visibility. Define a freshness target per data type: a public description may tolerate a short stale window; an access-control decision generally should use an authoritative or strongly controlled path.

One common write sequence updates the source and then deletes the cache entry. If deletion fails after the source commit, stale data remains until expiration. Deleting first is also tricky: a concurrent read can miss, load the old source value before the write commits, and repopulate stale data. Alternatives include versioned keys, transactional outbox-driven invalidation, short TTLs, or write-through behavior, but each has costs and failure modes. There is no universal invalidation order that removes every race without coordinating the source and cache.

### Worked trace: stale refill race

Assume the cache holds product price `$10`. A writer changes the source to `$12` and deletes the cache key. At nearly the same time, a reader misses and reads the source before the write commits, receiving `$10`; it then stores `$10` with a fresh TTL. The writer commits `$12`, and the cache is now stale until another invalidation or expiry. The trace shows why TTL is a bound on configured entry lifetime, not proof that invalidation races cannot occur. If the business cannot accept the stale interval, use a stronger read path or a coordinated version mechanism and state its guarantees.

### Stampedes, failure, and boundedness

When a popular key expires, thousands of requests may simultaneously miss and overload the database. Request coalescing or single-flight lets one caller refresh while others wait briefly. Probabilistic early refresh, jittered TTLs, and stale-while-revalidate can spread work or serve a permitted stale value. These techniques change latency and freshness behavior, so apply them only when the product allows it. Bound cache memory with an eviction policy and capacity plan. Eviction is not a durable delete: a cache miss must remain correct.

If the cache is unavailable, decide whether to bypass it, serve a safe stale copy, or fail. Bypassing during a large outage can move all traffic to the database and create a cascading failure. Admission limits, rate controls, and degraded responses may protect the source. Measure hit ratio alongside latency, source QPS, evictions, memory pressure, stale age where measurable, and errors. A high hit ratio can hide a harmful stale value or skewed misses on the most expensive keys.

## Common Mistakes and Interview Traps

- Treating TTL as a guarantee that all clients observe data no older than that duration.
- Assuming cache invalidation and a source write are atomic when they are separate systems.
- Using a cache for authorization without a defined revocation/freshness contract.
- Choosing keys that omit tenant, locale, version, or other response-defining context.
- Letting every request refresh an expired hot key at once.
- Failing open to the source without checking source capacity during cache failure.
- Optimizing hit ratio while ignoring tail latency, stale data, eviction, and miss cost.

## Tricky Points

Negative caching has a special invalidation problem: a cached “not found” can hide a newly created resource. Use short bounded lifetimes or invalidate on creation. Also distinguish a stale cache value from a stale source read; invalidating a key and then refilling it from a lagging replica may immediately reintroduce old data. Freshness is a property of the whole read path, not just the cache entry.

## Practical Exercise

**Goal:** Add a cache to a read-heavy product catalog.

**Inputs/context:** Product detail is read much more often than it is changed. Price changes must be visible within a stated short freshness target; inventory used to authorize checkout must not be accepted from an uncontrolled stale cache.

**Constraints:** Define key shape, TTL, invalidation path, cache-outage behavior, memory bound, and stampede mitigation. State source-of-truth and replica assumptions.

**Edge cases:** Cache unavailable; hot key expires; source write succeeds but invalidation fails; negative lookup followed by creation; cache refill reads from a lagging replica.

**Acceptance criterion:** Produce a read/write flow, freshness statement for product detail and checkout inventory, failure policy, four metrics, and a test for stale refill races. Do not implement a cache client.

## Summary

Caching can reduce repeat-read latency and source load, but introduces duplicated state and failure modes. Choose keys from response semantics, set freshness per operation, and treat invalidation as a distributed consistency problem. Bound memory and miss traffic; plan stampede and outage behavior. TTL and hit ratio alone do not describe correctness.

## Cheat Sheet

- Cache-aside: cache lookup, source on miss, then bounded population.
- TTL is an expiration setting, not an end-to-end freshness guarantee.
- Every cached value needs a key scope, source, freshness budget, invalidation, and failure policy.
- Prevent hot-key stampedes with coalescing, jitter, or permitted stale refresh.
- Cache failure can overload the source; model bypass capacity and shed work if needed.
### Common Pitfalls

- Caching authorization blindly; unsafe key reuse; stale refill races; equating hit ratio with success.

## Interview Questions

1. **[Hard]** Trace a cache-aside read and identify what happens on a miss. **Expected answer shape:** Key construction, authoritative lookup, population, TTL, and error behavior. **Follow-up:** How does tenant identity affect the key?
2. **[Hard]** Why does a 60-second TTL not necessarily mean users see data at most 60 seconds stale? **Expected answer shape:** Invalidation races, refill from stale source, timing/replication, and whole-path freshness. **Follow-up:** Which guarantee could a versioned key provide?
3. **[Hard]** A popular product key expires and database load spikes. Propose mitigations. **Expected answer shape:** Coalescing, jitter/early refresh, stale-while-revalidate if acceptable, source capacity, and metrics. **Follow-up:** What if the value is an authorization decision?
4. **[Very Hard]** Design cache behavior for detail reads, checkout inventory, and cache outage. **Expected answer shape:** Different freshness contracts, authoritative critical path, bounded bypass, overload handling, and measured source capacity. **Follow-up:** How would you test the failed-invalidation and lagging-refill cases?