# Day 13: Asynchronous Processing and Message Queues

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> | Previous: <a href="day-12-load-balancing-and-stateless-services.md">Day 12</a> | Next: <a href="day-14-object-storage-and-content-delivery.md">Day 14</a></nav>

## What You Will Learn Today

- Decide when to move work off a synchronous request path.
- Compare a work queue with a retained event log at the level of consumer behavior.
- Trace delivery attempts, acknowledgments, retries, and duplicate effects.
- Design bounded consumers, dead-letter handling, and an explicit ordering scope.

## Prerequisites

- [Day 05: Latency, Throughput, and Tail Behavior](day-05-latency-throughput-and-queues.md)
- [Day 08: API and Interface Design](day-08-api-and-interface-design.md)
- [Day 09: Data Modeling and Storage Choices](day-09-data-modeling-and-storage-choices.md)

## Quick Vocabulary Card

- **Producer:** A component that publishes a message or event for later processing.
- **Consumer:** A component that receives and processes work.
- **Acknowledgment:** A signal to the broker that a delivery has been handled to the configured stage.
- **At-least-once delivery:** A delivery model that can redeliver until acknowledged, so a consumer must tolerate duplicates.
- **Dead-letter queue (DLQ):** A separate holding path for messages that exhausted or failed ordinary processing policy.
- **Backpressure:** A way to slow or bound production/consumption when downstream capacity is insufficient.

## Core Concepts

Asynchronous processing lets a request accept durable work and return before that work is complete. It can absorb bursts and isolate slow dependencies, but it changes the user-visible contract: acceptance is not completion. The API should return an operation identifier or status and explain how the caller can observe later success or failure. The roadmap’s [Day 13 entry](../system-design-roadmap.md#day-13-asynchronous-processing-and-message-queues) links [Apache Kafka documentation](https://kafka.apache.org/documentation/) and the [AWS Reliability pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html). Queue retention, acknowledgment, ordering, and consumer semantics vary by technology and configuration.

### Queue and log are different models

A work queue commonly assigns a delivery to a worker and removes or advances it after acknowledgment, making competing workers useful for distributing tasks. A retained log preserves ordered records for a configured period, allowing consumer groups to track positions and potentially replay data. Some systems combine features; the labels alone do not specify durability, retention, redelivery, or ordering guarantees. Verify the broker’s documented contract and settings.

Use a queue-like task for “send this email once the job succeeds.” Use a retained event stream when multiple independent consumers need to observe or replay facts such as `LinkCreated`. Even a log can drive competing work; the distinction is about retention and consumer position as well as distribution. Neither form makes a side effect exactly once by itself.

### Delivery and acknowledgment trace

Suppose an email worker receives a message, sends the email, then crashes before acknowledging. The broker may redeliver because it cannot know whether the external provider accepted the first send. If the worker acknowledges before sending, a crash can lose the email. Acknowledgment placement trades loss risk against duplicate risk. For at-least-once delivery, acknowledge only after the effect is safely completed or durably recorded, and make the consumer effect idempotent where possible. External providers may have their own idempotency features, but do not assume they do.

A robust consumer stores a stable message or business-operation identifier and an outcome atomically with its local state change when the same database transaction can cover both. If the side effect is external, use an idempotency key supported by the provider, a durable local state machine, or reconciliation; there may remain an uncertainty window. Acknowledgment, database commit, and external effects are not one atomic event merely because they happen in one handler.

### Retries, poison messages, and backlog

Transient failures can be retried with a bounded policy and delay; permanent invalid input should not be retried forever. Define maximum attempts or age, exponential backoff with jitter where suitable, and what moves to a DLQ. A DLQ needs ownership, alerting, inspection tools, redrive policy, and safeguards against replaying harmful effects. “Put it in a DLQ” is not a resolution by itself.

Track queue age and backlog, not only message count: old messages can violate user latency targets even when the queue is shrinking. Scale consumers only if downstream capacity can grow too. Bound in-flight work and concurrency, and slow or reject production when capacity is exhausted. Otherwise a queue may hide overload by converting a fast failure into a growing delay and eventual storage exhaustion.

### Ordering has a scope and cost

Global ordering can constrain throughput and parallelism. Many systems preserve order only within a partition, session, or key, and even that depends on broker and producer configuration. Choose a key that places related operations together, such as account ID, if per-account order is required. Parallel processing can reorder completion even if messages were delivered in order. If consumers need ordering, serialize effects per key or validate sequence/version at the state boundary.

## Common Mistakes and Interview Traps

- Returning “success” when the API only enqueued work, without exposing pending/failure state.
- Assuming broker acknowledgment and a database/external side effect commit atomically.
- Claiming at-least-once delivery means an effect occurs once.
- Acknowledging before durable handling or after an external call with no duplicate strategy.
- Retrying permanent failures indefinitely or making a DLQ an unowned dumping ground.
- Scaling consumers without checking the database/provider bottleneck.
- Saying messages are ordered without defining key, partition, delivery, and completion scope.

## Tricky Points

Queue backlog is both a buffer and a delayed failure signal. A queue can protect the request path temporarily, but sustained arrival above service capacity means backlog grows without bound unless work is rejected, shed, or capacity changes. Also, an event being durably published and a database update being durably committed are separate operations unless coordinated; a transactional outbox is one common pattern, with its own publisher retries and duplicate handling.

## Practical Exercise

**Goal:** Move email delivery out of a user-facing request path.

**Inputs/context:** An API accepts an invitation, persists it, and sends an email through a provider with variable latency. The caller needs to know whether the invitation was accepted and later inspect delivery status.

**Constraints:** Define message identity, status lifecycle, acknowledgment point, bounded retries, DLQ/redrive ownership, consumer concurrency, and what order (if any) matters. State broker-specific assumptions to verify.

**Edge cases:** Worker crashes after provider accepts; provider times out with unknown outcome; invalid address; database unavailable; backlog grows faster than workers drain it; duplicate message arrives.

**Acceptance criterion:** Draw the request and worker paths, define externally visible statuses, explain duplicate handling and retry exhaustion, and name backlog/age/consumer metrics. Do not implement the queue consumer.

## Summary

Queues decouple acceptance from completion and buffer bursts, but delivery, acknowledgment, side effects, ordering, and backlog require explicit policies. At-least-once systems can duplicate delivery; consumers need idempotency or reconciliation. Bound retries and in-flight work, make DLQ ownership real, and never let a queue conceal sustained overload.

## Cheat Sheet

- API acceptance is not job completion; expose operation status when needed.
- Acknowledge only after safe handling, but plan for redelivery and duplicates.
- At-least-once delivery implies duplicate-tolerant effects, not exactly-once effects.
- Retry transient errors within a bound; route permanent/exhausted failures for owned review.
- Monitor backlog age, depth, processing rate, attempts, and downstream saturation.
### Common Pitfalls

- Ack/effect gap; infinite retries; unowned DLQ; unstated order; unbounded consumer concurrency.

## Interview Questions

1. **[Hard]** When does a queue improve a request-serving system, and what contract changes for the caller? **Expected answer shape:** Burst/latency isolation, durable acceptance, pending status, eventual result, and backlog limits. **Follow-up:** What should the API return if enqueue succeeds but status persistence fails?
2. **[Hard]** Trace a worker crash after sending an email but before acknowledgment. **Expected answer shape:** Broker uncertainty, redelivery, duplicate effect, idempotency or reconciliation, and acknowledgment trade-off. **Follow-up:** What if the provider has no idempotency support?
3. **[Hard]** Contrast a task queue and retained event log for email and analytics consumers. **Expected answer shape:** Work distribution, retention, replay, consumer positions, and actual guarantee/configuration caveats. **Follow-up:** Can a log still be used for competing work?
4. **[Very Hard]** The queue depth falls but oldest-message age keeps rising, and the email provider rate-limits workers. Diagnose and redesign. **Expected answer shape:** Arrival/service rates, age SLO, bounded concurrency, retry delay, provider capacity, admission control, prioritization, and DLQ. **Follow-up:** Which work would you shed first and how would you preserve auditability?