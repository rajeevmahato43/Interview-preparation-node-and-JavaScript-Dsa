# Day 6: Architecture, Reliability, and Operations

## Service architecture

**1. Layered architecture**

Separate transport/controllers, business services, and repositories; inject dependencies rather than importing hidden singletons.

```text
HTTP route -> service/use case -> repository -> database
```

**2. Deadlines and retries**

Bound total request time; retry transient failures with backoff/jitter only when the operation is safe or idempotent.

**3. Caching and rate limits**

Cache repeated reads with freshness/invalidation rules; rate-limit by a defined identity/key and shared state when distributed.

**4. Queues and background work**

Move slow/bursty work off request paths; handle redelivery, bounded backlog, dead letters, and worker shutdown.

[Architecture](../../Node/node-lectures/day-33-layered-backend-architecture.md) | [Retries](../../Node/node-lectures/day-34-deadlines-retries-and-idempotency.md) | [Cache/rate limits](../../Node/node-lectures/day-35-caching-and-rate-limiting.md) | [Queues](../../Node/node-lectures/day-36-queues-and-background-work.md)

## Operations and security

**1. Observability**

Use correlated structured logs, metrics, and traces to connect requests to latency/errors/saturation; redact secrets and PII.

**2. Security review**

Validate input, authorize resources, protect secrets, bound resource use, and return safe errors.

**3. Dependency failure behavior**

Define degraded responses and recovery for cache, database, and queue failures rather than assuming dependencies are infallible.

[Operations](../../Node/node-lectures/day-37-observability-and-production-operations.md) | [Security](../../Node/node-lectures/day-38-security-review-of-a-node-backend.md)

## Tricky points

1. **Architecture**

**1.1 Layers**

A repository/service split helps only when responsibilities and dependency direction are clear.

**1.2 Retries**

Retrying all errors or retrying without a deadline can amplify an outage.

**1.3 Cache**

A cache is a performance layer, not the source of truth unless deliberately designed as one.

**1.4 Queues**

Enqueue acceptance does not mean a job completed; expose job state and failure handling.

2. **Operations and security**

**2.1 Secrets**

Logs and exception messages can leak credentials or personal data.

**2.2 Metrics**

Average latency hides tail latency; monitor percentiles and saturation signals.

**2.3 Rate limits**

A per-process counter does not enforce a global limit across multiple instances.