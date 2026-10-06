# Day 37: Case Study - Rate Limiter

<nav aria-label="Lecture navigation">
  <a href="../system-design-roadmap.md">Roadmap</a> ·
  <a href="day-36-case-study-url-shortener.md">Previous: Day 36</a> ·
  <a href="day-38-case-study-notification-service.md">Next: Day 38</a>
</nav>

## What You Will Learn Today

Design a limiter that enforces useful product and abuse policies across many API instances. You will match an algorithm to a policy, choose a key and state boundary, reason about atomic updates and hot keys, and make a deliberate fail-open or fail-closed decision when shared state degrades.

## Prerequisites

- [Day 11: Caching Fundamentals](day-11-caching-fundamentals.md)
- [Day 12: Load Balancing and Stateless Services](day-12-load-balancing-and-stateless-services.md)
- [Day 16: Partitioning and Sharding](day-16-partitioning-and-sharding.md)
- [Day 18: Consistency Models and CAP](day-18-consistency-models-and-cap.md)
- [Day 22: Timeouts, Deadlines, Retries, and Backoff](day-22-timeouts-retries-and-deadlines.md)
- [Day 25: Circuit Breakers, Bulkheads, and Load Shedding](day-25-resilience-patterns.md)

## Quick Vocabulary Card

- **Quota:** The allowed request volume over a defined scope and interval.
- **Fixed window:** A counter that resets at discrete interval boundaries.
- **Sliding window:** A policy that measures requests over a moving interval or approximates that behavior.
- **Token bucket:** Tokens refill at a configured rate; requests consume tokens, and bucket capacity permits bursts.
- **Atomic update:** A state change that is observed as one indivisible operation, preventing concurrent requests from both using the same allowance.
- **Fail-open / fail-closed:** Allow requests or deny them when enforcement state cannot be consulted.

## Core Concepts

### Clarify what is being limited

Assume account limits for authenticated calls and IP limits for anonymous traffic. Login, password reset, and expensive reports need distinct policies. A limiter is admission control, not authentication, billing enforcement, or a concurrency limit.

Clarify exact cap versus smooth rate, allowed burst, whether denials consume quota, region scope, and client response. HTTP 429 with `Retry-After` is useful when the retry time is meaningful.

### Estimate and choose an algorithm

Assume 2 million active identities averaging 30 requests per minute: about 1 million checks per second. A shared check at that rate is itself a major service. If each identity needs at least 100 bytes of logical key and counter data, state is hundreds of MB before store overhead and replication. Real traffic is bursty and concentrated, so this is only a capacity sketch.

Choose based on semantics:

- **Fixed window:** Cheap, but a client can spend its allowance on both sides of a boundary.
- **Sliding log:** Precise moving window at higher timestamp storage and update cost.
- **Sliding counter:** Lower-cost approximation combining adjacent windows.
- **Token bucket:** Refill rate plus bounded burst; useful when short bursts are allowed.
- **Leaky bucket:** Smooths output, but queueing can increase latency; synchronous APIs may instead reject excess work.

There is no universally best algorithm. Select one from the product's burst and fairness contract, then test boundary and clock behavior.

### API and state model

The limiter is often middleware rather than a public business endpoint. A policy record can be modeled as:

```text
Policy(policy_id, scope, algorithm, capacity, refill_rate,
       window_seconds, enabled, version)
State(key, policy_version, token_count_or_counter,
      last_refill_or_window, expires_at)
```

Include policy scope/version in the key, such as `limit:v4:account:842:export`. Trust forwarded IP only when a trusted proxy overwrites it; normalize addresses and account for NAT. For token buckets, atomically calculate refill, clamp to capacity, decide, and update. Separate reads and writes race across instances. Expire abandoned state, and bound refill despite clock precision or jumps.

### Request flow and distributed placement

At ingress, derive trusted identity, choose policy/key, and request an atomic admission under a strict deadline. Continue on allow; return a denial with useful limit metadata otherwise. Emit aggregate metrics rather than unbounded per-identity labels.

A shared store coordinates instances, but hot keys remain hotspots even when unrelated keys are partitioned. Local counters reduce latency but overshoot. Regional token leases reduce shared operations at the cost of bounded global overshoot; quantify it from lease size and active instances.

### Degraded operation and failure paths

1. **Store timeout:** For low-risk browsing, a bounded local fallback may be safer than blocking. For credential attacks or costly actions, fail closed or use another protected control. Set deadlines, cap local concurrency, and alert.
2. **Partition or failover:** Some instances may see stale/unavailable state. Exact global quotas cannot coexist with unrestricted admission during a partition; state whether you tolerate overshoot or reject uncertainty.
3. **Bad policy rollout or hot key:** Stage versioned policies with rollback, knowing a version change may reset state. Isolate expensive routes or dedicated hot identities rather than spreading one counter and claiming exactness.

Distinguish a 429 quota denial from a limiter dependency error. If a timeout occurs after the store charged the request, retry may consume another token. Business-operation idempotency is separate; a limiter does not provide exactly-once execution.

### Operations and security

Monitor denials by policy, store latency/errors, cardinality, hot partitions, fallback use, and policy version. Test bursts and failover; audit policy changes and make emergency restrictions reversible. Limit key length and guard against spoofed addresses and cardinality attacks. Define privacy and retention for IP-derived identifiers, and document the trusted-proxy boundary.

## Common Mistakes and Interview Traps

- Saying “use Redis” without defining atomicity, key cardinality, timeout, or partition behavior.
- Calling fixed windows smooth and overlooking boundary bursts.
- Assuming a local in-memory counter is global behind a load balancer.
- Using IP as the only identity despite NAT, proxies, and spoofable headers.
- Claiming exact global quotas while allowing requests through during a partition.
- Failing open everywhere without considering expensive or security-sensitive routes.

## Tricky Points

“Fail open” may mean a local emergency budget or unlimited pass-through; only the former bounds damage, and only approximately across instances. Choose per policy tier. Rate limits count requests over time; concurrency limits cap in-flight work, which can exhaust workers even below the rate quota.

## Practical Exercise

**Goal:** Design account and IP limits for a multi-instance API with shared enforcement state.

**Input/context:** Assume 500 API instances, two million active identities, bursty traffic, a credential-reset endpoint, a read-only catalog endpoint, and a limiter-store outage lasting several minutes.

**Constraints:** Select per-route algorithms, define keys and atomic state changes, set a latency budget, and explain fail-open/closed behavior and client responses.

**Edge cases:** Requests straddling a fixed-window boundary, retry after an uncertain store timeout, NAT sharing, forged forwarding headers, hot service account, policy rollout, and regional network partition.

**Acceptance criteria:** Draw the path, estimate state and operation rate, trace an allow and deny, bound tolerated overshoot or reject uncertain requests, and define metrics/fallbacks.

## Summary

A useful limiter starts with a precise policy and identity, not a product choice. Algorithm semantics determine burst behavior; distributed state and atomic updates determine whether multiple instances enforce a coherent budget. Shared enforcement costs latency and can fail, so choose degradation by endpoint risk and state the consistency compromise. Measure hot keys, cardinality, and fallback behavior continuously.

## Cheat Sheet

- **Fixed window:** Cheap; boundary bursts.
- **Sliding log:** Precise moving window; higher state cost.
- **Token bucket:** Refill rate plus bounded burst.
- **Distributed correctness:** One atomic state transition per decision, unless bounded overshoot is accepted.
- **Degradation:** Set fail behavior per risk tier; deadline shared-store calls.
- **Common Pitfalls:** Trusting client IP headers; forgetting cardinality; equating rate with concurrency; promising exact global limits under partitions.

## Interview Questions

1. **Hard:** Which algorithm would you choose for an endpoint allowing steady traffic but brief bursts? **Expected answer shape:** State the policy, explain bucket capacity/refill and alternatives, describe state and edge cases. **Follow-up:** How would a policy change affect existing bucket state?
2. **Hard:** Two API instances concurrently observe one remaining request. How do you prevent both from admitting it? **Expected answer shape:** Explain atomic check-and-update, key placement, timeout semantics, and the store boundary. **Follow-up:** What happens if the client times out after the update?
3. **Very Hard:** Design degraded behavior for a limiter-store outage affecting catalog, login, and report generation. **Expected answer shape:** Classify endpoint risks, compare local fallback and fail-closed, bound overload, and specify observability. **Follow-up:** What bounded overshoot can regional leases introduce?
4. **Very Hard:** Product requires an exact global daily quota across regions and uninterrupted admission during a network partition. **Expected answer shape:** Surface the conflicting requirements, explain coordination/availability tradeoffs, propose a product-level relaxation or reservation model, and define measurable behavior. **Follow-up:** Which invariant would you preserve first and why?