# Day 6: Design Case Studies

## URL shortener and rate limiter

1. **URL shortener:** Create unique mappings, redirect quickly, and define expiration/revocation, abuse protection, and analytics.
2. **Rate limiter:** Define identity, window/algorithm, distributed state, burst behavior, and whether limits are strict or approximate. [URL shortener](../../SystemDesign/system-design-lectures/day-36-case-study-url-shortener.md) | [Rate limiter](../../SystemDesign/system-design-lectures/day-37-case-study-rate-limiter.md)

## Notifications and social feed

1. **Notifications:** Track accepted/queued/attempted/delivered/failed states; providers can fail and retry can duplicate.
2. **Social feed:** Choose fanout-on-write/read or hybrid from follower distribution, freshness, and read/write workload. [Notifications](../../SystemDesign/system-design-lectures/day-38-case-study-notification-service.md) | [Social feed](../../SystemDesign/system-design-lectures/day-39-case-study-social-feed.md)

## Tricky points

1. **URL and rate limit**
	1.1 **Identifier collision:** Uniqueness needs a constraint/retry strategy even with random IDs.
	1.2 **Redirect caching:** Cache policy affects revocation and stale destination behavior.
	1.3 **Distributed limits:** Per-instance counters do not enforce one global quota.
2. **Notifications and feeds**
	2.1 **Delivery state:** Queue acceptance is not proof of delivery; distinguish provider acknowledgment from user receipt.
	2.2 **Duplicate effects:** Retries require idempotent provider requests or deduplication where supported.
	2.3 **Hot users:** Celebrity/fanout distributions can make one uniform feed strategy expensive.