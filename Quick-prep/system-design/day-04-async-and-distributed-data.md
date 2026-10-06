# Day 4: Async Work, Reliability, and Security

## Async workflows

1. **Queues:** Decouple producers/consumers and buffer bursts; define acknowledgment, delivery attempts, ordering, dead-letter handling, and backlog limits.
2. **Idempotency and coordination:** Duplicate delivery is common; deduplicate side effects and define ordering/ownership where concurrency matters.
3. **Sagas/workflows:** Coordinate multi-step work across service boundaries with explicit success, compensation, and recovery states. [Queues](../../SystemDesign/system-design-lectures/day-13-queues-and-asynchronous-processing.md) | [Idempotency](../../SystemDesign/system-design-lectures/day-23-idempotency-and-message-delivery.md) | [Ordering](../../SystemDesign/system-design-lectures/day-24-ordering-and-coordination.md) | [Sagas](../../SystemDesign/system-design-lectures/day-26-sagas-and-workflows.md)

## Reliability and security

1. **Timeouts and retries:** Bound calls by a deadline; retry transient failures with backoff/jitter only when safe.
2. **Resilience patterns:** Bulkheads/circuit breakers/fallbacks limit failure propagation but add their own states and trade-offs.
3. **Observability and threat modeling:** Track latency, errors, saturation, and trust boundaries; identify assets, threats, abuse, and mitigations. [Deadlines](../../SystemDesign/system-design-lectures/day-22-timeouts-retries-and-deadlines.md) | [Resilience](../../SystemDesign/system-design-lectures/day-25-resilience-patterns.md) | [Observability](../../SystemDesign/system-design-lectures/day-27-observability-and-diagnosis.md) | [Security](../../SystemDesign/system-design-lectures/day-28-security-and-threat-modeling.md)

## Tricky points

1. **Async processing**
	1.1 **Exactly once:** A broker guarantee does not automatically make external side effects exactly once; use idempotency at the effect boundary.
	1.2 **Ordering:** Ordering often holds only within a partition/key, not globally.
	1.3 **Saga compensation:** Compensation is a new operation, not a time reversal; it can also fail and needs recovery.
2. **Reliability and security**
	2.1 **Retries:** Unbounded retries amplify load during outages; use budgets, jitter, and deadlines.
	2.2 **Circuit breakers:** They do not fix the dependency; define half-open recovery and fallback correctness.
	2.3 **Observability:** Logs without correlation and service-level signals make distributed incidents hard to diagnose.
	2.4 **Security:** A trust boundary needs explicit authentication, authorization, data handling, and abuse controls.