# Day 6: Architecture, Resilience, Caching, Queues, and Observability

Quick review of main-course lectures 33–38. Designed for rapid interview revision: Layered backend architecture, timeouts with AbortSignal, exponential backoff with jitter, Cache-Aside pattern, BullMQ job queues, structured logging, and health probes.

## Layered architecture and service boundaries

**1. Separation of concerns: Controller, Service, Repository**

Decouple HTTP protocol concerns from core business logic and database drivers.
- **Controller:** Inspects HTTP request, validates schema, delegates to service, formats HTTP status and headers.
- **Service:** Implements business rules, transaction orchestration, domain validation. Agnostic of Express `req` and `res`.
- **Repository:** Manages database queries, persistence queries, and entity mapping.

```js
// Service layer: Pure business logic, unit-testable without Express
export class OrderService {
  constructor(private orderRepo, private paymentGateway) {}

  async placeOrder(userId, items) {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await this.orderRepo.create({ userId, total, status: "PENDING" });
    await this.paymentGateway.charge(userId, total);
    return this.orderRepo.updateStatus(order.id, "PAID");
  }
}
```

[Layered backend architecture](../../Node/node-lectures/day-33-layered-backend-architecture.md)

## Resilience: Deadlines, retries, and circuit breakers

**1. Upstream timeouts via `AbortSignal`**

Never execute unbounded network requests. Use `AbortSignal.timeout(ms)` to terminate hanging outbound HTTP calls and release sockets.

```js
async function fetchWithDeadline(url, timeoutMs = 3000) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return await res.json();
  } catch (err) {
    if (err.name === "TimeoutError") {
      throw new Error(`Upstream request to ${url} exceeded deadline of ${timeoutMs}ms`);
    }
    throw err;
  }
}
```

**2. Exponential backoff with jitter**

When retrying transient failures (e.g., 503, connection drops), apply exponential backoff combined with randomized jitter to prevent "thundering herd" retry storms from overwhelming struggling downstream dependencies.

```js
async function retryWithBackoff(fn, retries = 3, baseDelayMs = 100) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries - 1) throw err;
      // Exponential delay + Full Jitter
      const delay = Math.random() * (baseDelayMs * Math.pow(2, attempt));
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
```

[Deadlines, retries, and idempotency](../../Node/node-lectures/day-34-deadlines-retries-and-idempotency.md)

## Caching and rate limiting

**1. Cache-Aside pattern and cache stampede defense**

Query cache first; on miss, fetch from database and populate cache with a Time-To-Live (TTL). To prevent cache stampede (hundreds of concurrent requests hitting DB simultaneously when cache expires), use a distributed lock or early probabilistic expiration.

```js
async function getCachedUser(userId) {
  const cacheKey = `user:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Cache miss: Acquire brief lock to prevent stampede
  const user = await userRepo.findById(userId);
  if (user) {
    await redis.set(cacheKey, JSON.stringify(user), "EX", 300); // 5 min TTL
  }
  return user;
}
```

**2. Sliding window rate limiting**

Rate limiters protect API resources against brute force and DoS. Implement sliding window counters using Redis sorted sets (`ZADD`, `ZREMRANGEBYSCORE`, `ZCARD`) to avoid fixed-window boundary burst spikes.

```js
async function isRateLimited(userId, limit = 100, windowSec = 60) {
  const key = `ratelimit:${userId}`;
  const now = Date.now();
  const windowStart = now - windowSec * 1000;

  const multi = redis.multi();
  multi.zremrangebyscore(key, 0, windowStart); // Evict timestamps outside window
  multi.zadd(key, now, `${now}-${Math.random()}`); // Record current hit
  multi.zcard(key); // Count hits in window
  multi.expire(key, windowSec);

  const results = await multi.exec();
  const currentHits = results[2][1];
  return currentHits > limit;
}
```

[Caching and rate limiting](../../Node/node-lectures/day-35-caching-and-rate-limiting.md)

## Background queues and observability

**1. Asynchronous job queues (BullMQ)**

Offload heavy or latency-sensitive work (emails, image processing, webhook delivery) from HTTP request loops to persistent Redis-backed queues.

```js
import { Queue, Worker } from "bullmq";

const emailQueue = new Queue("emails", { connection: redisConnection });

// In HTTP request controller: Fast enqueue (<5ms)
await emailQueue.add("sendWelcome", { email: "user@example.com" }, {
  attempts: 5,
  backoff: { type: "exponential", delay: 1000 },
  removeOnComplete: true
});

// In background worker process:
const worker = new Worker("emails", async (job) => {
  await mailer.send(job.data.email, "Welcome!");
}, { connection: redisConnection, concurrency: 10 });
```

**2. Production health probes and structured logging**

Separate Kubernetes health probes into **Liveness** (is the process alive or deadlocked?) and **Readiness** (are database connection pools and caches ready to accept user traffic?).

```js
// Liveness probe: Immediate lightweight check
app.get("/healthz/liveness", (req, res) => res.status(200).send("OK"));

// Readiness probe: Checks dependencies before routing traffic to this replica
app.get("/healthz/readiness", async (req, res) => {
  try {
    await pool.query("SELECT 1"); // Verify PostgreSQL connection pool
    await redis.ping();          // Verify Redis connection
    res.status(200).send("READY");
  } catch (err) {
    res.status(503).json({ error: "Dependency Unavailable", message: err.message });
  }
});
```

[Queues and background work](../../Node/node-lectures/day-36-queues-and-background-work.md) | [Observability and operations](../../Node/node-lectures/day-37-observability-and-production-operations.md) | [Security review](../../Node/node-lectures/day-38-security-review-of-a-node-backend.md)

## Tricky points

1. **Architecture and retries**

**1.1 Retrying non-idempotent operations**
Blindly retrying non-idempotent endpoints (e.g., `POST /orders/checkout` after a socket timeout) when the server actually processed the initial payment causes duplicate charges. Only retry safe idempotent queries or endpoints protected by idempotency keys.

**1.2 Thundering herd during cache invalidation**
Invalidating a high-traffic cache key simultaneously causes hundreds of concurrent requests to experience cache misses, overwhelming the underlying database with identical queries and causing cascading outages.

2. **Queues and workers**

**2.1 Missing job deduplication**
Enqueueing duplicate jobs during network retries without setting unique `jobId` parameters produces redundant background work (e.g., sending multiple emails or double-processing billing runs).

**2.2 Memory exhaustion from unbounded queue producers**
When background workers process jobs slower than incoming HTTP traffic enqueues them, the queue buffer in Redis grows indefinitely, ultimately triggering Redis Out-Of-Memory eviction.

3. **Observability and health probes**

**3.1 Coupling readiness probes to third-party APIs**
Checking third-party external services (e.g., Stripe, Twilio) inside the `/healthz/readiness` probe causes your entire microservice cluster to fail readiness checks and reboot whenever the external vendor suffers downtime.