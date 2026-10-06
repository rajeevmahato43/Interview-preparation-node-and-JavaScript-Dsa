# Day 30: Service Discovery, Gateways, and Internal Communication

<nav aria-label="Lecture navigation">[Roadmap](../system-design-roadmap.md) | [Previous: Day 29](day-29-monoliths-and-service-boundaries.md) | [Next: Day 31](day-31-configuration-and-evolution.md)</nav>

## What You Will Learn Today

- Explain how a caller locates a service without embedding a machine address in application logic.
- Choose between synchronous request/response and asynchronous messaging based on workflow needs.
- Define the responsibilities and limits of an API gateway.
- Reason about contracts, deadlines, retries, and dependency failures across a service graph.

## Prerequisites

- [Day 06: Networking and Request Lifecycle](day-06-networking-and-request-lifecycle.md)
- [Day 08: API and Interface Design](day-08-api-and-interface-design.md)
- [Day 12: Load Balancing and Stateless Services](day-12-load-balancing-and-stateless-services.md)
- [Day 13: Asynchronous Processing and Message Queues](day-13-queues-and-asynchronous-processing.md)

## Quick Vocabulary Card

- **Service discovery:** Resolving a logical service identity to currently usable instances or an intermediary endpoint.
- **API gateway:** An edge component that receives client requests and applies selected routing or cross-cutting policies.
- **Synchronous call:** The caller waits for a response before it can finish its current operation.
- **Asynchronous message:** The producer records or sends work without requiring the consumer to complete before the producer responds.
- **Contract:** The agreed request, response, event, error, and compatibility behavior between components.
- **Dependency graph:** The directed relationships among services and other runtime dependencies.

## Core Concepts

Service discovery separates a stable name such as `inventory` from changeable instance addresses. Configuration, DNS, a registry, or a platform service may resolve that name. Caching, health state, routing, and failover vary by implementation; the requirement is stable naming and a clear endpoint-selection policy, not a particular product.

Discovery does not make a destination healthy or a request safe to retry. The caller still needs a finite deadline, authentication, connection limits, and useful error handling. A successful name lookup only tells the caller where to attempt communication. A service may become unavailable immediately afterward, and an intermediate timeout cannot always tell whether the remote operation committed.

An API gateway is usually an ingress boundary for external clients. Depending on the design, it can centralize routing, TLS termination, size limits, authentication integration, or coarse rate limits. It should not silently own domain rules: extensive business orchestration makes the gateway a central release and availability dependency. Internal traffic may use a different path and identity model.

Use synchronous calls when the caller needs an immediate answer to complete the user-visible operation and the dependency fits the latency and availability budget. For example, a checkout request may need an authoritative inventory reservation result before confirming an order. Keep the call graph short and bounded. If a request synchronously calls A, B, C, and D in sequence, latency accumulates and each dependency can become a failure point. Parallel calls can reduce sequential time but still wait on the slowest required response and add load.

Use asynchronous messaging when work can finish later, must survive a temporary consumer outage, or should be decoupled from the producer's response. For example, an order service can persist an order and an outbox record in one local transaction, return an accepted/pending result, and publish a notification event for a worker. This requires an explicit status model, duplicate-safe consumers, delivery monitoring, and a way to reconcile stuck work. A queue does not make the operation complete merely because a message was accepted.

**Worked scenario: order placement.** A public request arrives at a gateway and is routed to `orders`. The order service validates the request and uses a bounded synchronous call to reserve inventory if the product must be confirmed immediately. It commits order state and an outbox event atomically in its own database. A publisher delivers the event; notification work proceeds asynchronously. If inventory times out, orders must decide whether to fail, remain pending, or return an uncertain state, based on business rules. It must not retry indefinitely. If the event is delivered twice, the consumer deduplicates by stable event identity. The trace identifier follows the request and event so operators can connect the customer action to later processing.

Every boundary needs a contract. For HTTP or RPC, specify required fields, validation, status/error semantics, deadlines, and idempotency expectations. For events, specify schema, event identity, meaning, ordering scope, and whether consumers may see duplicates or delayed delivery. OpenAPI can describe HTTP interfaces, but a syntactically valid document does not define all operational behavior. Consumers and producers must agree on compatibility while multiple versions are running.

Retries belong at a deliberate layer. If a gateway, client library, and service each retry three times, attempts multiply. Retry only bounded transient failures within the remaining deadline; use backoff and jitter where appropriate, and require idempotency for side effects. Do not retry validation failures or overload as network blips. Instrument target, outcome, and duration without raw user IDs as metric labels.

As the dependency graph grows, critical synchronous cycles can prevent independent recovery. Optional capabilities such as recommendations should have a timeout and degraded path rather than block checkout. Make dependency ownership and caller-visible reliability expectations explicit.

## Common Mistakes and Interview Traps

- Hard-coding instance IP addresses into callers or assuming discovery guarantees availability.
- Making every internal interaction synchronous because it is easier to draw.
- Calling a gateway a complete security boundary while internal calls remain unauthenticated or overprivileged.
- Retrying at multiple layers without a shared attempt budget or idempotency story.
- Treating queue acceptance as completion or assuming message delivery means exactly-once effects.

## Tricky Points

- **Timeout is an uncertain outcome.** The caller may time out while the remote side completes. Query by operation identity or use idempotent retry semantics.
- **Async lowers temporal coupling, not total work.** It introduces backlog, replay, duplicate, ordering, and poison-message handling.
- **Health differs by layer.** Name resolution, instance readiness, application correctness, and dependency health answer different questions; one universal “healthy” bit is rarely sufficient.

## Practical Exercise

- **Goal:** Design the communication paths for a public order API.
- **Context/input:** A browser calls an API; the system has gateway, orders, inventory, payment, and notifications. Order confirmation requires payment and inventory decisions, while notification can be delayed. Instances can be replaced during deployments.
- **Constraints:** State discovery assumptions without depending on one provider. Bound every synchronous request with a deadline. Describe contract ownership and duplicate handling for events.
- **Edge cases:** Inventory times out after reservation, a consumer receives an event twice, a service instance becomes unhealthy after discovery, and notification backlog grows.
- **Acceptance criterion:** Draw the public and internal paths, label synchronous/asynchronous edges, identify each contract owner and failure response, and explain which retries are safe. Do not provide a full solution implementation.

## Summary

- Discovery provides a logical route to changing endpoints, not a correctness guarantee.
- Gateways can organize edge policies but should not absorb domain ownership by default.
- Synchronous calls fit immediate decisions; asynchronous messages fit deferred work with durable processing needs.
- Contracts must include compatibility and failure behavior, not only payload shape.
- Bound deadlines and retries, and design for uncertain outcomes, duplicates, and dependency degradation.

## Cheat Sheet

- **Need immediate answer?** Synchronous call, with deadline, bounded fan-out, and failure behavior.
- **Can finish later or survive consumer outage?** Durable asynchronous workflow with visible state and duplicate-safe effects.
- **Need changing instance addresses?** Use logical discovery and health-aware routing appropriate to the platform.
- **Before adding a gateway policy:** Identify its owner, scope, failure impact, and why it belongs at the edge.

**Common Pitfalls**

- Infinite or layered retries.
- Contracts that omit timeouts, idempotency, or compatibility.
- No monitoring for queue age, failed delivery, or dependencies.

## Interview Questions

1. **Hard:** What does service discovery solve, and what does it not solve? **Expected answer shape:** Explain logical naming and endpoint selection, then distinguish reachability from health and operation outcome. **Follow-up:** How can stale discovery data affect rollout?
2. **Hard:** Pick synchronous or asynchronous communication for sending an order receipt. **Expected answer shape:** State user-visible response needs, failure tolerance, persistence, and delivery behavior. **Follow-up:** What changes if regulatory rules require proof of delivery?
3. **Very Hard:** A service graph has retries at gateway, SDK, and service layers. How do you prevent overload amplification? **Expected answer shape:** Trace attempts, establish deadline/attempt budgets, retry classifications, idempotency, backoff, and observability. **Follow-up:** How would you safely handle a timeout after the remote write committed?
4. **Very Hard:** Design discovery and communication for hundreds of services during rolling deploys. **Expected answer shape:** Describe naming/routing abstraction, readiness and draining, compatible contracts, identity, failure isolation, and operational ownership while naming platform-specific assumptions. **Follow-up:** Which signals should stop rollout rather than merely alert?