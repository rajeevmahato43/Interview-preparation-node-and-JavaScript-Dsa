# Day 35: Caching and Rate Limiting

<nav aria-label="Lecture navigation">

[Previous: Deadlines, Retries, and Idempotency](day-34-deadlines-retries-and-idempotency.md) | [Roadmap](../node-roadmap.md) | [Next: Queues and Background Work](day-36-queues-and-background-work.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain why caching and rate limiting are different mechanisms with different failure modes.
- Choose a cache strategy that matches read patterns and staleness tolerance.
- Design a rate limit that protects the service without causing user-visible pain.
- Understand cache invalidation, stampedes, and local-vs-shared cache choices.

## Prerequisites

- [Day 18: API Contracts, Pagination, and Idempotency](day-18-api-contracts-pagination-and-idempotency.md)
- [Day 20: Express Security and HTTP Testing](day-20-express-security-and-http-testing.md)
- [Day 33: Layered Backend Architecture](day-33-layered-backend-architecture.md)

## Core Concepts

### 1. A cache is not the source of truth

A cache usually stores a copy of data to improve read performance. It must be designed around invalidation and freshness expectations.

### 2. Cache-aside and read-through are common patterns

```js
const user = cache.get(key);
if (user) return user;

const freshUser = await db.getUser(id);
cache.set(key, freshUser, 60_000);
return freshUser;
```

This helps read-heavy workloads, but stale cache entries can become a correctness issue if the data changes often.

### 3. Rate limiting protects the service edge

A rate limit is usually applied near the API boundary to keep a noisy client from overloading the service or downstream dependencies.

A token bucket or fixed-window limiter is a common pattern, but different systems have different tradeoffs in fairness and burst tolerance.

## Detailed Explanations and Traces

### Cache stampede

A cache miss for a hot key can lead to many simultaneous requests hitting the database. Use a single-flight or lock strategy to reduce this burst.

### Invalidation tradeoffs

- short TTL: more freshness, lower hit rate
- long TTL: better hit rate, more stale data
- event-driven invalidation: more complexity but greater freshness

## Common Mistakes and Interview Traps

- Treating a cache as the source of truth.
- Forgetting stale data can break user expectations or business logic.
- Rate limiting only at the frontend.
- Not differentiating per-user and per-IP limits.

## Tricky Points

- Local cache is simpler and fast, but it does not protect all instances.
- Shared cache helps across nodes but introduces central dependency and operational complexity.
- Rate limiting is not only about abuse; it also protects latency and downstream dependency health.

## Practical Exercise

**Goal:** Design a cache and rate-limiting strategy for a user-profile endpoint.

**Inputs and outputs:** Accept a profile request and choose caching TTL plus rate-limit behavior.

**Constraints:** Explain stale-data tolerance, invalidation, and the effect on service load.

**Acceptance criteria:** The design includes a cache strategy, invalidation policy, and request-throttling boundary.

## Summary

- Caching and rate limiting are both ways to protect service health, but they solve different problems.
- Cache correctness depends on freshness and invalidation strategy.
- Rate limiting protects the service from abuse and overload at the API boundary.

## Cheat Sheet

| Concern | Decision |
|---|---|
| Cache | store copies for hot reads |
| Invalidation | TTL or event-driven update |
| Stampede | single-flight / lock around misses |
| Rate limit | enforce at edge or gateway |
| Local vs shared | depend on scale and topology |

## Interview Questions

1. **Definition:** What is the difference between a cache and a rate limiting policy?
   - **Expected answer:** A cache optimizes reads; rate limiting protects service capacity and fairness from abuse or overload.
   - **Follow-up:** Can the same traffic pattern require both?

2. **Design:** Design a cache for user profiles with occasional updates.
   - **Expected answer:** Use a reasonable TTL, invalidation on updates, and a guard against stampedes.
   - **Follow-up:** What if profile changes are frequent?

3. **Implementation:** Write a rate-limiter model for a login endpoint.
   - **Expected answer:** Use a per-user or per-IP window, reject excess requests, and return a clear error.
   - **Follow-up:** Why is a distributed rate limit harder than a local one?

4. **Engineering judgment:** When should a cache be considered a correctness risk instead of a performance optimization?
   - **Expected answer:** When stale data can create wrong permissions, incorrect order totals, or user-facing mismatches.
   - **Follow-up:** What does this imply about invalidation strategy?

<nav aria-label="Lecture navigation">

[Previous: Deadlines, Retries, and Idempotency](day-34-deadlines-retries-and-idempotency.md) | [Roadmap](../node-roadmap.md) | [Next: Queues and Background Work](day-36-queues-and-background-work.md)

</nav>