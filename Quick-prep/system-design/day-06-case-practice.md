# Day 6: High-Frequency System Design Case Studies

Quick review of main-course lectures 36–39. Covers deep-dive architectural trade-offs, schemas, algorithms, and failure handling for URL Shorteners, Distributed Rate Limiters, Multi-Channel Notification Engines, and Social Timeline Feeds.

## URL shortener and distributed rate limiter

**1. URL Shortener (TinyURL architecture)**

- *Short Key Generation:* 7 characters of Base62 (`[0-9a-zA-Z]`) yields $62^7 \approx 3.5 \text{ trillion}$ unique URLs.
- *Collision Prevention:* Avoid hashing long URLs with MD5/SHA256 (causes collision retries). Use a dedicated **Key Generation Service (KGS)** that pre-generates random 7-character strings in a database and loads batches into memory.
- *Redirect Types:*
  - *HTTP 301 Moved Permanently:* Browser caches redirect locally; reduces server load but bypasses click analytics.
  - *HTTP 302 Found / 307 Temporary:* Browser queries server on every click; enables real-time click telemetry and geographic tracking.
- *Read Path Caching:* 80/20 rule: cache top 20% hot links in Redis with LRU eviction for sub-millisecond redirect latency.

```text
[User GET /xyz789] ---> [Load Balancer] ---> [Web Server]
                                                  |
                         +------------------------+------------------------+
                         | (Cache Hit: 302 Found)                           | (Cache Miss)
                         v                                                 v
                   [Redis Cache]                                     [PostgreSQL DB]
```

**2. Distributed Rate Limiter (Redis Lua sliding window counter)**

Enforce quotas (e.g. 100 req/min per user) across a distributed cluster. Use Redis Sorted Sets (`ZSET`) or atomic sliding window counters executed via Lua script to prevent race conditions:

```lua
-- Redis Lua Script: Sliding Window Counter
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local clearBefore = now - window

redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)
local currentRequests = redis.call('ZCARD', key)
if currentRequests < limit then
    redis.call('ZADD', key, now, now)
    redis.call('EXPIRE', key, window)
    return 1 -- Allowed
else
    return 0 -- Throttled (HTTP 429)
end
```

[URL shortener case study](../../SystemDesign/system-design-lectures/day-36-case-study-url-shortener.md) | [Rate limiter case study](../../SystemDesign/system-design-lectures/day-37-case-study-rate-limiter.md)

## Notification engine and social timeline feeds

**1. Multi-channel notification engine**

- *Ingestion & Prioritization:* API receives notification requests; separates into high-priority queues (OTP, transaction alerts via SMS) and low-priority queues (marketing newsletters via Email).
- *Worker Fleet & Vendor Fallback:* Dedicated workers pull from queues, format templates, check user opt-out preferences, and call third-party gateways (APNs, FCM, Twilio, SendGrid). If Twilio fails or rate-limits, circuit breaker fails over to secondary SMS vendor (MessageBird).
- *Deduplication:* Store `notification_id` with state in DB (`PENDING`, `SENT`, `FAILED`) to prevent sending duplicate SMS charges on network retry.

**2. Social timeline feed: Fanout-on-write vs Fanout-on-read**

- *Fanout-on-Write (Push Model):* When author posts, worker fetches author's follower list and writes post ID into every follower's Redis timeline list.
  - *Pros:* Home feed read is $O(1)$ (`LRANGE timeline:user_id 0 19`).
  - *Cons:* Huge write amplification if author has 50M followers (50 million Redis writes!).
- *Fanout-on-Read (Pull Model):* On feed request, system queries recent posts from all followed users and merge-sorts them in memory.
  - *Pros:* Zero write fan-out overhead.
  - *Cons:* Feed generation is slow and CPU-heavy ($O(F \log F)$ where $F$ is followed accounts).
- *Hybrid Model (Celebrity Solution):* Use Fanout-on-Write for normal users ($< 25,000$ followers). For high-profile accounts (celebrities), skip write fanout; pull celebrity posts dynamically at read time and merge into user's cached timeline.

```text
[Normal User Posts] ---> [Push Worker] ---> Injects into each follower's [Redis Timeline]
[Celebrity Posts]   ---> Saves to [Author Post DB] only
[User Reads Feed]   ---> Reads [Redis Timeline] + Pulls [Celebrity Posts] -> Merges & Returns
```

[Notification service case study](../../SystemDesign/system-design-lectures/day-38-case-study-notification-service.md) | [Social feed case study](../../SystemDesign/system-design-lectures/day-39-case-study-social-feed.md)

## Tricky points

1. **URL shortening and rate limiting**
   **1.1 Hash truncation collisions:** Taking first 7 chars of `MD5(url)` leads to birthday paradox collisions within thousands of entries; pre-allocated sequential IDs encoded in Base62 eliminate collisions completely.
   **1.2 Distributed rate limit race conditions:** Doing `GET counter` followed by `SET counter + 1` in application code produces race conditions under concurrent requests; operations must be atomic in Redis via Lua scripts or `INCR` + `EXPIRE`.

2. **Feeds and notifications**
   **2.1 The Celebrity write stampede:** Pushing a tweet from a user with 80M followers to 80M Redis queues exhausts memory and creates massive message lag for millions of regular users.
   **2.2 Third-party vendor outages:** External SMS and email providers experience outages; a notification architecture without dead-letter queues (DLQ) and secondary provider fallbacks will drop critical user OTPs.