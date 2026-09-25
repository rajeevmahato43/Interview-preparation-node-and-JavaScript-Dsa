# Day 34: Deadlines, Retries, and Idempotency

<nav aria-label="Lecture navigation">

[Previous: Layered Backend Architecture](day-33-layered-backend-architecture.md) | [Roadmap](../node-roadmap.md) | [Next: Caching and Rate Limiting](day-35-caching-and-rate-limiting.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain the difference between timeout, cancellation, and retry.
- Design a retry policy that respects service correctness.
- Recognize when an operation is safe to retry and when it is not.
- Build idempotency into client or server flows without hiding real failure.

## Prerequisites

- [Day 10: Networking, DNS, TLS, and Timeouts](day-10-networking-dns-tls-and-timeouts.md)
- [Day 18: API Contracts, Pagination, and Idempotency](day-18-api-contracts-pagination-and-idempotency.md)
- [Day 25: MongoDB Atomicity, Transactions, and Retries](day-25-mongodb-atomicity-transactions-and-retries.md)

## Core Concepts

### 1. Timeout is not cancellation

A timeout means the caller gave up waiting; it does not necessarily mean the downstream work stopped. This is a major point in Node and distributed systems.

```js
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);
```

This cancels the request at the client side, but the downstream operation may still continue if it is not designed to respond to cancellation.

### 2. Retry is a policy, not a reflex

Retries are useful for transient failures, but not for every error. A retry on a `POST` that creates a payment can cause duplicate charges unless the system is idempotent.

### 3. Idempotency is the correctness tool

A safe retry flow is either:

- naturally idempotent
- protected by an idempotency key
- controlled by a state machine with deduplication

## Detailed Explanations and Traces

### Example of a dangerous retry

```js
POST /payments
```

If the request times out after the server already created a charge, retrying blindly can double-charge the customer. The server must deduplicate by request key or make the operation safe to repeat.

### Safe retry pattern

```js
POST /payments
Idempotency-Key: 9a8d...
```

The server stores the key and returns the original result if the same key is seen again.

## Common Mistakes and Interview Traps

- Treating timeout as completion.
- Retrying non-idempotent writes without a deduplication strategy.
- Using fixed retry loops without exponential backoff and jitter.
- Assuming cancellation means the downstream machine also stopped work.

## Tricky Points

- A timeout is a policy decision at the boundary. It does not prove the backend stopped processing.
- A retry can be safe only if the operation or the result is idempotent.
- Backoff is partly about preventing retry storms, not just about being "patient."

## Practical Exercise

**Goal:** Design a safe retry policy for a write-heavy API.

**Inputs and outputs:** A payment or order creation request with a timeout and retry flow.

**Constraints:** Include a retry budget, exponential backoff, idempotency key handling, and a clear boundary for when not to retry.

**Acceptance criteria:** The design identifies which errors are retryable and explains why the operation remains safe under duplicate delivery.

## Summary

- Timeout and cancellation are different decisions.
- Retry must follow a correctness policy, not a blanket rule.
- Idempotency is the key to reliable retries.

## Cheat Sheet

| Concern | Decision |
|---|---|
| Timeout | stop waiting, not necessarily stop work |
| Cancellation | ask downstream process to stop if it supports it |
| Retry | only for transient, safe operations |
| Idempotency | safe deduplication or same-result semantics |

## Interview Questions

1. **Definition:** What is the difference between a timeout and cancellation?
   - **Expected answer:** A timeout decides the caller stops waiting; cancellation actively requests the operation to stop when supported.
   - **Follow-up:** Why is this distinction important in Node backends?

2. **Design:** Design a retry strategy for a service that can receive duplicate `POST` requests.
   - **Expected answer:** Use idempotency keys and only retry safe, transient errors.
   - **Follow-up:** What errors are not safe to retry?

3. **Implementation:** Write a tiny retry helper with exponential backoff and jitter.
   - **Expected answer:** Only retry on transient errors and stop after a budget or max attempts.
   - **Follow-up:** Why is jitter useful?

4. **Engineering judgment:** When should the server not retry an operation even if the network is noisy?
   - **Expected answer:** When the operation is non-idempotent and a duplicate write would cause incorrect state.
   - **Follow-up:** How do you protect system correctness then?

<nav aria-label="Lecture navigation">

[Previous: Layered Backend Architecture](day-33-layered-backend-architecture.md) | [Roadmap](../node-roadmap.md) | [Next: Caching and Rate Limiting](day-35-caching-and-rate-limiting.md)

</nav>