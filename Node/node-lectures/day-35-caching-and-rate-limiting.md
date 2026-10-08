# Day 35: Caching and Rate Limiting

<nav aria-label="Lecture navigation">

[Previous: Deadlines, Retries, and Idempotency](day-34-deadlines-retries-and-idempotency.md) | [Roadmap](../node-roadmap.md) | [Next: Queues and Background Work](day-36-queues-and-background-work.md)

</nav>

## Prerequisites

- [Day 18: API Contracts, Pagination, and Idempotency](day-18-api-contracts-pagination-and-idempotency.md) — HTTP header specifications and response contracts.
- [Day 20: Express Security and HTTP Testing](day-20-express-security-and-http-testing.md) — Defense-in-depth, IP spoofing, and middleware order.
- [Day 33: Layered Backend Architecture](day-33-layered-backend-architecture.md) — Infrastructure abstractions and repository boundaries.
---

## Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                       MULTI-TIER (L1 / L2) CACHING ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Incoming HTTP Request
            │
            ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │ L1 CACHE: In-Memory Node.js Heap (e.g., lru-cache)                                      │
  │ • Latency: < 5 microseconds (Zero network I/O)                                          │
  │ • Capacity: Bounded (e.g., 50MB, 5,000 keys)                                            │
  │ • Scope: Local to single Node process                                                   │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
            │ Miss (Not found in L1)
            ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │ L2 CACHE: Distributed Shared Cache (Redis Cluster)                                      │
  │ • Latency: 0.5 - 2 milliseconds (TCP socket roundtrip)                                  │
  │ • Capacity: Large (Gigabytes / Terabytes)                                               │
  │ • Scope: Shared across all Node.js cluster replicas                                     │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
            │ Miss (Not found in L2)
            ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │ PRIMARY DATASTORE: PostgreSQL / MongoDB                                                 │
  │ • Latency: 5 - 50 milliseconds (Disk / B-Tree seek / query engine)                       │
  │ • Capacity: Durable source of truth                                                     │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. Caching Topologies: In-Memory vs Distributed Shared Cache

Selecting a caching topology requires balancing access latency against memory bounds and multi-instance consistency:

| Dimension | In-Memory Heap Cache (L1) | Distributed Shared Cache (Redis - L2) |
|---|---|---|
| **Access Latency** | **Sub-microsecond** (Direct V8 pointer dereference) | **0.5ms – 2ms** (TCP serialization and socket network I/O) |
| **Storage Capacity** | Strictly bounded by Node.js V8 heap (`--max-old-space-size`) | Vast (gigabytes to terabytes on dedicated Redis nodes) |
| **Multi-Node Consistency** | **Inconsistent**: Instance A may hold stale data while Instance B holds fresh data | **Consistent**: All Node.js instances read the exact same shared state |
| **Process Crash Impact** | Cold cache on process restart; increases startup database load | Persistent: Survives application process restarts and deployments |
| **Garbage Collection (GC)** | High risk of GC pause spikes if caching millions of small objects | Zero impact on Node.js GC; memory managed in C on Redis process |

#### Senior Multi-Tier Strategy (L1 + L2)
High-throughput microservices deploy a hybrid pattern:
1. Check process-local L1 cache (TTL: 5 seconds). Protects Redis from hot-key saturation.
2. If L1 misses, check Redis L2 cache (TTL: 10 minutes).
3. If L2 misses, fetch from primary database, populate L2, and populate L1.

---

### 2. Cache Failure Modes and Mitigation Strategies

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          CACHE FAILURE MODES & DEFENSE MECHANISMS                           │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  1. CACHE STAMPEDE (Thundering Herd)
     Symptom: Hot key expires -> 10,000 concurrent requests miss simultaneously -> DB crashes!
     Defense: Single-Flight Promise Coalescing OR Probabilistic Early Recomputation (XFetch).

  2. CACHE PENETRATION
     Symptom: Attacker requests non-existent IDs (e.g. /users/-999) -> Always misses cache & DB!
     Defense: Cache sentinel empty values: SET key "null" EX 30 OR evaluate Bloom Filter first.

  3. CACHE AVALANCHE
     Symptom: 100,000 keys inserted at midnight with 24hr TTL expire at the exact same second!
     Defense: Add random TTL Jitter: TTL = base_ttl + Math.floor(Math.random() * jitter_window).
```

#### Mitigating Cache Stampede via Single-Flight Coalescing
When a key expires under heavy load, multiple Node.js event-loop ticks attempt to fetch the same data from the database. **Single-Flight Coalescing** deduplicates in-flight promises so that only one database query executes while all concurrent callers wait on the same promise:

```javascript
// Node.js code
// pattern: In-Memory Single-Flight Promise Coalescer
export class SingleFlight {
  constructor() {
    this.inFlight = new Map();
  }

  /**
   * Guarantees only one execution of fn() per key concurrently
   */
  async do(key, fn) {
    if (this.inFlight.has(key)) {
      // Re-use active in-flight promise for concurrent callers!
      return await this.inFlight.get(key);
    }

    const promise = (async () => {
      try {
        return await fn();
      } finally {
        this.inFlight.delete(key); // Clean up immediately upon resolution
      }
    })();

    this.inFlight.set(key, promise);
    return await promise;
  }
}
```

---

### 3. The Dual-Write Inconsistency Trap

When an application updates data, it must update both the database and the cache. The order of operations introduces critical consistency hazards:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          THE DUAL-WRITE RACE CONDITION HAZARD                               │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Anti-Pattern: Updating Cache Directly (Write-Update)
  Thread A: Writes DB (val = 1)
  Thread B: Writes DB (val = 2)
  Thread B: Sets Cache (val = 2)
  Thread A: Sets Cache (val = 1)  <-- Thread A's network was slow!
  Outcome: DB has val = 2, but Cache permanently holds val = 1! CRITICAL DATA DESYNC!
```

#### The Golden Rule of Cache Invalidation: Delete, Don't Update!
To prevent out-of-order write desynchronization:
1. **Commit database write first.**
2. **Evict (delete) the cache key second:** `await redis.del(key)`.
3. Allow the next read request to lazily reload the fresh value from the database (Cache-Aside).
4. If cache eviction fails due to a network glitch, configure short TTLs (e.g., 5 minutes) as a safety net so data does not remain stale indefinitely.

---

### 4. Rate Limiting Algorithms Compared

Rate limiting restricts the number of requests a client can submit within a given time frame to protect server availability, prevent brute-force attacks, and enforce monetization tiers.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           RATE LIMITING ALGORITHMS EVALUATION                               │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  1. FIXED WINDOW COUNTER
     Bucket: 12:00:00 - 12:00:59 (Limit: 100 reqs)
     Flaw: 100 reqs at 12:00:59 + 100 reqs at 12:01:00 = 200 reqs in 2 seconds! (2x Burst Hole)

  2. SLIDING WINDOW LOG
     Maintains sorted set of every request timestamp in Redis.
     Pros: 100% mathematically accurate.
     Cons: Massive memory consumption! Storing 1,000 timestamps per user exhausts Redis RAM.

  3. SLIDING WINDOW COUNTER (Senior Industry Standard)
     Estimates rate by weighting previous and current window counters:
     Rate = Previous_Window_Count * (1 - elapsed_fraction) + Current_Window_Count
     Pros: Eliminates the 2x boundary burst; requires only 2 counter keys in Redis!

  4. TOKEN BUCKET
     Tokens added at constant fill rate up to capacity. Each request consumes 1 token.
     Pros: Natively supports burst traffic while strictly enforcing sustained throughput limits.
```

---

### 5. Atomic Distributed Rate Limiting via Redis Lua Scripts

Executing rate-limiting logic across distributed Node.js instances requires atomicity. Issuing `redis.get()`, checking the limit in JavaScript, and calling `redis.incr()` introduces a **Check-Then-Act Race Condition (TOCTOU)**. Under concurrent load, multiple requests read the counter before it increments, allowing clients to exceed their limit.

Redis executes Lua scripts **atomically in a single single-threaded execution step**, preventing race conditions:

```lua
-- sliding_window_limiter.lua
-- KEYS[1]: Current window key (e.g. rate:user123:171000)
-- KEYS[2]: Previous window key (e.g. rate:user123:170940)
-- ARGV[1]: Max requests allowed
-- ARGV[2]: Window size in seconds
-- ARGV[3]: Fraction of current window elapsed (0.0 to 1.0)

local current_count = tonumber(redis.call('GET', KEYS[1]) or '0')
local previous_count = tonumber(redis.call('GET', KEYS[2]) or '0')
local limit = tonumber(ARGV[1])
local window_size = tonumber(ARGV[2])
local elapsed_fraction = tonumber(ARGV[3])

-- Calculate estimated rolling request count
local estimated_rate = math.floor(previous_count * (1 - elapsed_fraction) + current_count)

if estimated_rate >= limit then
  -- Rate exceeded: Return 0 (Blocked), remaining tokens, current rate
  return { 0, 0, estimated_rate }
else
  -- Increment current counter and set TTL to 2 * window_size
  current_count = redis.call('INCR', KEYS[1])
  if current_count == 1 then
    redis.call('EXPIRE', KEYS[1], window_size * 2)
  end
  local remaining = math.max(0, limit - (estimated_rate + 1))
  return { 1, remaining, estimated_rate + 1 }
end
```

---

## Detailed Explanations and Traces

### Rate Limiting HTTP Response Headers (IETF Draft Standard)

When rate limiting API clients, Express applications must emit standardized headers so consumers can adapt their request pacing:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/problem+json
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 28
Retry-After: 28

{
  "type": "https://api.domain.com/errors/rate-limit-exceeded",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit quota exceeded. Please retry in 28 seconds."
}
```

- `RateLimit-Limit`: Maximum permitted request quota in the active time window.
- `RateLimit-Remaining`: Number of remaining allowed calls before being throttled.
- `RateLimit-Reset`: Number of seconds until the current quota resets.
- `Retry-After`: Required on `429` responses; indicates how long the client must back off.

---

## Common Mistakes and Interview Traps

### 1. Rate Limiting Purely by Client IP (`req.ip`)

Relying exclusively on `req.ip` for rate limiting creates two catastrophic production bugs:
1. **Collateral Damage (Corporate NAT / VPNs):** An entire office building or university campus sharing a single outbound NAT gateway shares the same IP address. One aggressive scraper throttles every user in the entire corporation!
2. **IP Spoofing via `X-Forwarded-For`:** If Express `trust proxy` is misconfigured (as covered in Day 20), attackers can spoof arbitrary IPs on every request, completely bypassing IP rate limiters.
- **Rule:** *Rate limit authenticated requests by user/organization ID (`req.user.id`). Use IP-based limits only as a coarse secondary defense on public unauthenticated endpoints (`/login`, `/register`).*

---

## Hands-On Exercise: Resilient Cache-Aside and Sliding Window Middleware

### Scenario

You are tasked with hardening an Express product catalog service experiencing severe stability issues:
1. When a popular product's cache expires, 5,000 concurrent requests miss the cache simultaneously, crashing PostgreSQL (Cache Stampede).
2. Malicious scrapers are issuing requests for non-existent product IDs, causing continuous sequential scans on the database (Cache Penetration).
3. The existing rate limiter uses a fixed window in Node.js process memory, permitting double-rate bursts across window boundaries and failing to synchronize across cluster replicas.

### Acceptance Criteria

1. Implement `CacheAsideManager`:
   - Single-Flight Promise Coalescing to guarantee exactly 1 database fetch per missing key.
   - Sentinel empty caching (`null` with 30s TTL) to prevent Cache Penetration.
   - Randomized TTL Jitter ($\pm 10\%$) to eliminate Cache Avalanches.
2. Implement `createSlidingWindowRateLimiter` Express middleware:
   - Redis-backed Sliding Window Counter algorithm using atomic Lua execution.
   - Rate limit by `req.user.id` when authenticated, falling back to verified client IP.
   - Set standard headers: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`.
   - Respond with RFC 7807 `429 Too Many Requests` and `Retry-After` header when throttled.

### Solution Code

```javascript
// Node.js code
import crypto from 'crypto';

// ==========================================
// 1. RESILIENT CACHE-ASIDE MANAGER
// ==========================================

export class CacheAsideManager {
  /**
   * @param {Object} redisClient
   * @param {Object} [logger]
   */
  constructor(redisClient, logger = console) {
    this.redis = redisClient;
    this.logger = logger;
    this.inFlight = new Map(); // Single-flight promise registry
  }

  /**
   * Safe fetch with stampede coalescing, penetration defense, and TTL jitter
   */
  async getOrSet(key, fetcherFn, options = {}) {
    const { baseTtlSeconds = 300, emptyTtlSeconds = 30, jitterPercent = 0.1 } = options;

    // Step 1: Check Redis Cache
    const cachedVal = await this.redis.get(key);
    if (cachedVal !== null) {
      if (cachedVal === '__NULL_SENTINEL__') {
        return null; // Cache penetration shield hit!
      }
      return JSON.parse(cachedVal);
    }

    // Step 2: Single-Flight Coalescing (Prevents Stampedes)
    if (this.inFlight.has(key)) {
      return await this.inFlight.get(key);
    }

    const fetchPromise = (async () => {
      try {
        const freshData = await fetcherFn();

        if (freshData === null || freshData === undefined) {
          // Cache Penetration Defense: Cache sentinel for short duration
          await this.redis.set(key, '__NULL_SENTINEL__', 'EX', emptyTtlSeconds);
          return null;
        }

        // Cache Avalanche Defense: Add randomized TTL jitter
        const jitter = Math.floor(baseTtlSeconds * jitterPercent * (Math.random() * 2 - 1));
        const finalTtl = Math.max(10, baseTtlSeconds + jitter);

        await this.redis.set(key, JSON.stringify(freshData), 'EX', finalTtl);
        return freshData;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, fetchPromise);
    return await fetchPromise;
  }

  /**
   * Cache Invalidation: Delete, don't update!
   */
  async invalidate(key) {
    await this.redis.del(key);
  }
}

// ==========================================
// 2. ATOMIC REDIS SLIDING WINDOW RATE LIMITER
// ==========================================

const SLIDING_WINDOW_LUA = `
  local current_key = KEYS[1]
  local previous_key = KEYS[2]
  local limit = tonumber(ARGV[1])
  local window_size = tonumber(ARGV[2])
  local elapsed_fraction = tonumber(ARGV[3])

  local current_count = tonumber(redis.call('GET', current_key) or '0')
  local previous_count = tonumber(redis.call('GET', previous_key) or '0')

  local estimated_rate = math.floor(previous_count * (1 - elapsed_fraction) + current_count)

  if estimated_rate >= limit then
    return { 0, 0, estimated_rate }
  else
    current_count = redis.call('INCR', current_key)
    if current_count == 1 then
      redis.call('EXPIRE', current_key, window_size * 2)
    end
    local remaining = math.max(0, limit - (estimated_rate + 1))
    return { 1, remaining, estimated_rate + 1 }
  end
`;

export function createSlidingWindowRateLimiter({ redis, limit = 100, windowSeconds = 60 }) {
  return async (req, res, next) => {
    // 1. Identify client: Authenticated user takes precedence over IP
    const clientId = req.user?.id ? `usr:${req.user.id}` : `ip:${req.ip}`;

    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const currentWindowIdx = Math.floor(now / windowMs);
    const previousWindowIdx = currentWindowIdx - 1;

    const currentKey = `ratelimit:${clientId}:${currentWindowIdx}`;
    const previousKey = `ratelimit:${clientId}:${previousWindowIdx}`;

    // Fraction of current window elapsed (0.0 to 1.0)
    const elapsedFraction = (now % windowMs) / windowMs;
    const secondsRemaining = Math.ceil((windowMs - (now % windowMs)) / 1000);

    try {
      // Execute atomic Redis Lua script
      const [allowed, remaining, currentRate] = await redis.eval(
        SLIDING_WINDOW_LUA,
        2,
        currentKey,
        previousKey,
        limit,
        windowSeconds,
        elapsedFraction
      );

      // 2. Set Standard RateLimit Headers
      res.setHeader('RateLimit-Limit', limit);
      res.setHeader('RateLimit-Remaining', remaining);
      res.setHeader('RateLimit-Reset', secondsRemaining);

      if (allowed === 0) {
        // 3. Quota Exceeded: Set Retry-After and respond with RFC 7807 429
        res.setHeader('Retry-After', secondsRemaining);
        return res.status(429).json({
          type: 'https://api.domain.com/errors/rate-limit-exceeded',
          title: 'Too Many Requests',
          status: 429,
          detail: `Rate limit quota exceeded. Please wait ${secondsRemaining} seconds before retrying.`,
          retryAfterSeconds: secondsRemaining
        });
      }

      next();
    } catch (err) {
      console.error('Rate limiter Redis failure. Failing open to protect traffic:', err);
      // Operational Decision: Fail Open so cache/rate-limiter outages do not take down the API
      next();
    }
  };
}
```

### Solution Explanation

1. **Single-Flight Concurrency Control:** In `CacheAsideManager`, incoming concurrent requests for an expired key check `this.inFlight.has(key)`. If a database fetch is already pending, subsequent requests attach to the existing promise. Only one database query executes, completely eliminating Cache Stampedes.
2. **Sentinel Value for Penetration Defense:** When `fetcherFn()` returns `null`, the manager writes `'__NULL_SENTINEL__'` with a 30-second TTL to Redis. Subsequent attacker queries for bogus IDs hit Redis and return `null` immediately, shielding the database from sequential scans.
3. **TTL Jitter for Avalanche Defense:** Adding $\pm 10\%$ random jitter to the TTL ensures keys created in batches expire at staggered times rather than all at once.
4. **Atomic Sliding Window Lua Script:** The rate limiter evaluates both current and previous window counts inside a single atomic Redis Lua script. This eliminates TOCTOU race conditions and prevents boundary bursts without the excessive memory overhead of Sliding Window Logs.
5. **Fail-Open Resilience:** If Redis becomes temporarily unreachable, the `try/catch` block logs the error and calls `next()`, ensuring that a Redis outage does not cascade into a total application failure.

---

## Summary

- Caching optimizes read latency and offloads database capacity; rate limiting protects services from overload and abuse.
- In-memory process caches (L1) offer microsecond latency but lack multi-instance consistency; distributed caches (Redis L2) provide shared consistency at millisecond network latency.
- Protect systems from cache failure modes: use **Single-Flight Coalescing** for Cache Stampedes, sentinel `null` values for Cache Penetration, and randomized TTL Jitter for Cache Avalanches.
- Always invalidate caches by **deleting** keys rather than updating them, preventing dual-write race conditions.
- The **Sliding Window Counter** algorithm balances burst prevention with low Redis memory overhead.
- Distributed rate limiters must execute via **atomic Redis Lua scripts** to eliminate Check-Then-Act concurrency race conditions.

---

## Cheat Sheet

| Concern | Pattern / Technique | Key Benefit |
|---|---|---|
| **Cache Stampede** | Single-Flight Promise Coalescer | Exactly 1 DB query executed across concurrent misses |
| **Cache Penetration**| Cache `'__NULL_SENTINEL__'` for 30s | Stops denial-of-service queries for non-existent records |
| **Cache Avalanche** | `TTL = base_ttl + rand(-jitter, +jitter)` | Staggers expirations; prevents synchronized load spikes |
| **Dual-Write Safety**| Update DB $\to$ `await redis.del(key)` | Eliminates out-of-order write desynchronization |
| **Sliding Window** | Lua script blending current & previous counts | Prevents 2x boundary bursts with minimal memory |
| **Rate Limit Headers**| `RateLimit-Limit`, `Remaining`, `Reset`, `Retry-After`| Standardized machine-readable client throttling feedback |
| **Fail-Open Policy** | Wrap limiter in `try/catch`, call `next()` on error | Prevents Redis hiccups from causing total API outages |

---

## Interview Questions

### 1. What is a Cache Stampede (or Thundering Herd), and what are the architectural trade-offs between Single-Flight Coalescing and Probabilistic Early Recomputation (XFetch)?

> **Single-Flight Coalescing**: An in-memory concurrency pattern where duplicate concurrent requests for an identical missing key share a single in-flight Promise.

> **Cache Stampede (Thundering Herd)**: A failure mode where the expiration of a hot cache key causes thousands of concurrent requests to miss simultaneously and overwhelm the primary database.

A **Cache Stampede** occurs when a heavily accessed cache key (such as the homepage catalog or trending articles) expires under high concurrent traffic. When thousands of requests arrive in the same millisecond and observe a cache miss, all of them bypass the cache and query the underlying database simultaneously. This sudden wave of identical complex queries causes CPU spikes, exhausts the connection pool, and can crash the primary database.

Two primary patterns mitigate this:
1. **Single-Flight Promise Coalescing:** When a cache miss occurs, the Node.js process checks whether a promise for that key is already in flight. If so, concurrent callers wait on that exact same promise.
   - *Pros:* Simple to implement; zero extra database queries; guaranteed exact 1:1 request mapping per Node instance.
   - *Cons:* Scoped per Node.js process; if you run 50 container replicas, 50 queries still hit the database simultaneously.
2. **Probabilistic Early Recomputation (XFetch Algorithm):** Instead of waiting for a key to strictly expire at $T_{\text{expiry}}$, the read path computes an expiration probability based on the remaining TTL, the time it takes to compute the value ($\Delta$), and an aggressive beta constant ($\beta$):
   $$\Delta \times \beta \times (-\ln(\text{random}())) > (\text{expiry} - \text{now})$$
   As the expiration time approaches, read requests have an increasing probability of triggering a background recomputation *before* the key expires.
   - *Pros:* Works seamlessly across distributed clusters; the cache never actually becomes cold.
   - *Cons:* Slightly higher background write load; requires tracking calculation duration ($\Delta$).

---

### 2. Why is updating a cache directly after a database write (Write-Update) considered an anti-pattern compared to cache eviction (Write-Delete)?

Updating the cache directly after writing to the database introduces an unavoidable **Out-of-Order Concurrency Race Condition**:
Consider two concurrent processes updating the same user profile:
1. Request A updates the database with `name = 'Alice'`.
2. Request B updates the database with `name = 'Bob'`.
3. Request B writes to the cache: `cache.set('user:1', 'Bob')`.
4. Request A, having experienced a minor network delay, arrives later and writes to the cache: `cache.set('user:1', 'Alice')`.
The database permanently holds the correct value (`Bob`), but the cache permanently holds the stale value (`Alice`). Every subsequent read serves corrupt, out-of-sync data until the TTL expires.

In contrast, the **Write-Delete (Eviction) pattern**:
1. Request A writes to DB, then calls `cache.del('user:1')`.
2. Request B writes to DB, then calls `cache.del('user:1')`.
Regardless of network order, the cache key remains deleted. The very next read request lazily reads the authoritative state from the database and repopulates the cache, guaranteeing eventual consistency.

---

### 3. What is the boundary burst vulnerability of the Fixed Window rate limiter, and how does the Sliding Window Counter resolve it?

> **Sliding Window Counter**: A rate limiting algorithm that calculates an estimated request count by blending the previous window's count with the current window's count based on elapsed time.

A **Fixed Window Counter** tracks request counts within fixed calendar buckets (e.g., 12:00:00 to 12:00:59 with a limit of 100 requests).
The boundary burst vulnerability occurs when a client concentrates traffic around the window boundary:
- The client sends 100 requests at 12:00:59 (the end of Window 1).
- The client sends 100 requests at 12:01:00 (the start of Window 2).
Both requests are fully permitted by the limiter because they belong to distinct calendar windows. However, the system just absorbed **200 requests in 2 seconds**—effectively doubling the intended traffic rate and potentially crashing downstream dependencies.

The **Sliding Window Counter** resolves this by estimating a rolling request count that smooths over window boundaries. It tracks two adjacent windows (Previous and Current) and weights the previous window based on elapsed time:
$$\text{Rate} = \text{Count}_{\text{prev}} \times (1 - \text{elapsed\_fraction}) + \text{Count}_{\text{curr}}$$
If a client makes 100 calls in the last second of Window 1 and attempts another call at the first second of Window 2, $\text{elapsed\_fraction}$ is $\approx 0.01$. The calculated rate is $100 \times 0.99 + 1 = 100$, and the limiter immediately blocks further requests, completely eliminating the 2x boundary burst while requiring only two simple counters in Redis.

---

### 4. Why must distributed rate limiting in Redis be implemented using Lua scripts rather than multiple sequential Redis commands from Node.js?

In a distributed Node.js architecture with multiple server instances, rate limiting involves three logical steps:
1. Fetch current counter: `GET key`
2. Evaluate if counter exceeds limit: `if (count >= limit)`
3. Increment and set expiry: `INCR key` and `EXPIRE key`

If these commands are sent as individual sequential commands over network sockets from Node.js, the system is exposed to the **Check-Then-Act Race Condition (TOCTOU)**. When hundreds of requests hit different Node.js instances simultaneously:
- Multiple instances execute `GET key` at the same time; all observe that the count is at 99 (under the 100 limit).
- All instances evaluate the check as permitted.
- All instances execute `INCR key`, pushing the final counter to 150.
Clients easily breach rate limits during high concurrency spikes.

Furthermore, executing multiple sequential round-trips over the network adds significant latency (3 socket round-trips $\approx 3\text{ms}-6\text{ms}$).

Executing the logic inside a **Redis Lua script** resolves both issues:
1. **Absolute Atomicity:** Redis is single-threaded and executes Lua scripts as a single atomic unit. No other command or script can run concurrently while a Lua script executes, making race conditions impossible.
2. **Single Roundtrip:** The entire transaction executes in a single network round-trip from Node.js to Redis, minimizing API latency overhead.

---

<nav aria-label="Lecture navigation">

[Previous: Deadlines, Retries, and Idempotency](day-34-deadlines-retries-and-idempotency.md) | [Roadmap](../node-roadmap.md) | [Next: Queues and Background Work](day-36-queues-and-background-work.md)

</nav>