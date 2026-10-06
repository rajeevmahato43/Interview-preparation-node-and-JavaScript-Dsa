# Day 38: Case Study - Notification Service

<nav aria-label="Lecture navigation">
  <a href="../system-design-roadmap.md">Roadmap</a> ·
  <a href="day-37-case-study-rate-limiter.md">Previous: Day 37</a> ·
  <a href="day-39-case-study-social-feed.md">Next: Day 39</a>
</nav>

## What You Will Learn Today

Design a notification service that accepts business events, respects user preferences, and sends through external email and push providers. You will separate acceptance from delivery, model attempts and deduplication, handle provider limits and outages, and state exactly what delivery guarantees the system can and cannot offer.

## Prerequisites

- [Day 13: Asynchronous Processing and Message Queues](day-13-queues-and-asynchronous-processing.md)
- [Day 22: Timeouts, Deadlines, Retries, and Backoff](day-22-timeouts-retries-and-deadlines.md)
- [Day 23: Idempotency, Deduplication, and Exactly-Once Claims](day-23-idempotency-and-message-delivery.md)
- [Day 25: Circuit Breakers, Bulkheads, and Load Shedding](day-25-resilience-patterns.md)
- [Day 26: Sagas and Distributed Workflows](day-26-sagas-and-workflows.md)
- [Day 27: Observability and Incident Diagnosis](day-27-observability-and-diagnosis.md)

## Quick Vocabulary Card

- **Notification intent:** A durable record that the product wants a particular message delivered to a recipient over a channel.
- **Provider acceptance:** The external provider accepted a request; it does not prove a human saw or read it.
- **At-least-once processing:** Work may be attempted again after uncertainty, so duplicate side effects are possible unless handled.
- **Deduplication key:** A stable key that identifies repeated delivery intent within a defined scope and retention window.
- **Dead-letter queue:** A holding area for work that exhausted automatic processing and needs inspection or an explicit later action.

## Core Concepts

### Define scope and service contract

Assume internal product services submit notification intents for email and mobile push. The service loads preferences and templates, prioritizes security messages over marketing, and exposes delivery status. Exclude SMS, campaign audience selection, rich template design, and guaranteed inbox placement. The guarantee is that accepted intents are durably recorded and retried according to policy, not that every message reaches a device or inbox.

Clarify whether preference changes apply at enqueue time or send time. For privacy and user control, this design checks current channel preferences shortly before sending, while recording the policy decision. Some legal or transactional messages may have distinct rules; those must be defined by product and compliance requirements rather than hidden in generic code.

### Workload and capacity sketch

Assume 20 million intents daily and 1.5 channel jobs per intent: about 350 jobs/second on average, or 7,000 at an assumed 20x campaign peak. At 2 KB per intent/status history, that is roughly 40 GB daily before indexes and replicas. Queue retention and provider quotas may constrain the design before worker compute does.

### API, events, and data ownership

An internal API could be:

```text
POST /v1/notifications
  { recipientId, eventType, eventId, templateData, priority, channels? }
GET  /v1/notifications/{notificationId}
```

The producer owns the business fact; this service owns intent and attempts. A crash between business commit and event publication can lose or duplicate a message. A producer-side transactional outbox commits the fact and event row together; publication may still repeat, so consumers deduplicate by producer and event ID.

Model durable state along these lines:

```text
Notification(id, producer, event_id, recipient_id, event_type,
             priority, created_at, status)
Delivery(id, notification_id, channel, provider, state,
         attempt_count, next_attempt_at, provider_reference)
Preference(recipient_id, channel, enabled, updated_at)
```

Enforce a unique constraint on `(producer, event_id, channel)` for the delivery intents that should not duplicate. Store minimal personal data, encrypt sensitive fields, and define retention and deletion behavior. The model must preserve an auditable attempt history without storing unnecessary message content forever.

### Components and normal flow

The intake API validates, stores the intent and channel jobs, then returns an ID. A durable priority queue feeds workers, which check preferences, render a versioned template, enforce provider quotas, and call an adapter with a deadline. Normalize results as accepted, transient, permanent, or uncertain; callbacks can later refine status where supported.

Retry only transient failures, with exponential backoff and jitter, maximum attempt or age bounds, and provider-specific quotas. A permanent invalid-address response should not be retried forever. For an uncertain timeout, the provider may have accepted the message despite the missing response. Retrying can duplicate delivery unless the provider supports a stable idempotency key. If it does not, the honest guarantee is at-least-once attempts with possible duplicate messages, plus application-side suppression where feasible.

Order only where the product requires it. Partitioning by recipient can preserve local order but lets one slow send block that recipient's later jobs. Priority queues need fairness or reserved capacity so bulk work is neither starved nor allowed to delay critical alerts.

### Failure paths and trade-offs

1. **Provider outage or throttling:** Open a circuit breaker after evidence of failure, reduce concurrency, and delay retryable jobs with jitter. Keep critical and bulk traffic isolated. Do not retry immediately in every worker, which can amplify the outage. If queue age exceeds the product's usefulness window, expire or suppress stale notifications according to event type.
2. **Worker crashes after provider acceptance but before recording success:** The job may be redelivered. Use provider idempotency if available; otherwise duplicates remain possible. Record provider references and reconcile callbacks, but do not claim those solve the lost-ack ambiguity in all integrations.
3. **Queue backlog grows:** Scale workers only within provider quotas and downstream capacity. Apply admission controls to low-priority producers, expose oldest-job age, and alert on time-to-expiry. Queue depth alone can mislead if job service times vary.
4. **Preference change or bad template:** Check preferences immediately before sending, define that race boundary, and provide per-event pause switches. Validate template versions before rollout; replay must skip completed deliveries and respect current consent and expiry.

### Operations and security

Track durable acceptance, queue age by priority, delivery latency, attempts, provider throttles, permanent failures, dedupe hits, and callback delay. Correlate events without logging addresses, credentials, or message bodies. Restrict payload access, validate signed callbacks, and escape untrusted template content. Define separate SLOs for acceptance, provider acceptance, and status freshness; test failover and safe replay.

## Common Mistakes and Interview Traps

- Equating an HTTP 200 from a provider with inbox or device delivery.
- Claiming exactly-once delivery across a database, broker, worker, and external provider.
- Retrying every error at once and creating a provider retry storm.
- Putting bulk campaigns and urgent security messages in one FIFO queue.
- Forgetting that producer DB commit and event publish can fail independently.
- Treating provider failover as transparent when templates, consent, or deduplication semantics differ.

## Tricky Points

The hard ambiguity is “provider accepted, response lost.” A database transaction cannot include that external side effect. Provider idempotency helps only within the provider's documented scope and retention; otherwise reconcile or accept duplicate risk. A preference check also cannot be atomic with a concurrent external call, so define its boundary.

## Practical Exercise

**Goal:** Design email and push delivery for order and account-security events.

**Input/context:** Assume 20 million daily intents, variable campaign bursts, user channel preferences, at least two providers for email, provider throttles, and a status API.

**Constraints:** Separate acceptance from delivery guarantees; include idempotency, retry classes, priorities, retention, and provider credential controls.

**Edge cases:** Producer publishes twice; worker crashes after provider acceptance; user disables push while queued; provider throttles; template deployment is faulty; stale campaign job remains in backlog.

**Acceptance criteria:** Show sequence and data model, dedupe key, retry and permanent-failure traces, outage behavior, status and metrics; name possible duplicates or losses.

## Summary

Treat notification intake as durable intent, then process channel deliveries asynchronously under explicit preference, priority, retry, and expiry policies. A transactional outbox and consumer deduplication protect internal event handoffs, but external delivery still has uncertain outcomes. Provider quotas, outages, and privacy constraints shape capacity and operations as much as worker count does.

## Cheat Sheet

- **Accept:** Persist intent before acknowledging.
- **Bridge:** Producer outbox plus consumer deduplication.
- **Deliver:** Queue, preference check, render, provider quota, bounded call.
- **Retry:** Transient only; backoff, jitter, cap, expiry, dead-letter path.
- **Guarantee:** Provider acceptance is not user receipt; external exactly-once is not assumed.
- **Common Pitfalls:** Shared FIFO priority; unbounded retries; sensitive payload logs; replay that ignores consent or expiry.

## Interview Questions

1. **Hard:** What does a successful notification API response guarantee? **Expected answer shape:** Separate durable acceptance, provider acceptance, and end-user receipt; name persistence and status contract. **Follow-up:** How should the client learn about later delivery failure?
2. **Hard:** Trace a worker timeout when the provider may already have accepted a message. **Expected answer shape:** Explain ambiguity, idempotency-key limits, duplicate risk, state transitions, and reconciliation. **Follow-up:** What if provider keys expire before your retry window?
3. **Very Hard:** A major email provider throttles during a large campaign while security alerts continue to arrive. **Expected answer shape:** Isolate queues and quotas, prioritize, back off, protect critical capacity, control backlog age, and identify operational metrics. **Follow-up:** How do you prevent low-priority starvation after recovery?
4. **Very Hard:** Design a migration between providers without sending duplicates or violating consent. **Expected answer shape:** Define cutover ownership, idempotency scope, preference checks, status reconciliation, rollback and uncertainty handling. **Follow-up:** Which requirement changes if the old provider offers no reliable delivery callbacks?