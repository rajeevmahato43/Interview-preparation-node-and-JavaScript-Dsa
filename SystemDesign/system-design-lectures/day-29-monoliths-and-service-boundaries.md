# Day 29: Monoliths, Modular Monoliths, and Microservices

<nav aria-label="Lecture navigation">[Roadmap](../system-design-roadmap.md) | [Previous: Day 28](day-28-security-and-threat-modeling.md) | [Next: Day 30](day-30-service-communication-and-discovery.md)</nav>

## What You Will Learn Today

- Distinguish a deployment shape from the quality of its internal boundaries.
- Compare a monolith, modular monolith, and microservices using technical, organizational, and operational costs.
- Identify evidence that a boundary should become a separately deployed service.
- Explain why splitting code does not automatically reduce complexity.

## Prerequisites

- [Day 07: Architecture Diagrams and Design Artifacts](day-07-diagrams-and-architecture-communication.md)
- [Day 17: Transactions and Data Integrity](day-17-transactions-and-data-integrity.md)
- [Day 26: Sagas and Distributed Workflows](day-26-sagas-and-workflows.md)

## Quick Vocabulary Card

- **Monolith:** An application delivered as one deployable unit. It may still contain many internal modules.
- **Modular monolith:** One deployable application whose modules have explicit interfaces and controlled dependencies.
- **Microservice:** An independently deployable service with a bounded responsibility and an explicit communication contract.
- **Service boundary:** A line of ownership around behavior and data, ideally aligned with a cohesive domain capability.
- **Coordination cost:** Time and risk spent aligning teams, releases, contracts, and operations.

## Core Concepts

Architecture is not a maturity ladder. A monolith can be well organized, and a collection of services can still be tightly coupled. Choose boundaries that reduce the cost of changing and operating the product for its workload and team.

A monolith packages multiple capabilities into one deployable application. Calls between modules can often be ordinary in-process calls, and a single database transaction can protect an invariant when data shares a transactional store. A release may require coordinated deployment of the whole application, and one faulty component can compete for the same process resources. Still, one build, one deployment pipeline, and direct debugging can be valuable advantages for a small team.

A modular monolith keeps that deployment simplicity while treating modules as boundaries. For example, a commerce application can define `Catalog`, `Orders`, and `Payments` modules. The order module calls a published payment interface instead of querying payment tables directly. Each module owns its rules and data access. A shared database may remain physically shared, but ownership should prevent one module from silently depending on another module's tables. This discipline makes the architecture testable and can reveal whether a boundary is coherent before a network is added.

Microservices turn some boundaries into separate deployable processes. This can allow a team to scale, release, secure, or choose storage for one capability independently. It also changes the failure model: a call now crosses a network, can time out after the remote side completed work, and needs deadlines, observability, authentication, and retry rules. Data that was once updated in one transaction may need an asynchronous workflow, an outbox, compensating actions, or reconciliation. Deployments also need service discovery, compatible contracts, and a plan for mixed versions.

**Worked scenario: commerce growth.** One application handles product browsing, checkout, and email. Checkout traffic rises while email delivery is slow. Inspect the cause first: moving email to a queue and isolated worker may remove resource contention without creating a full service. If checkout and catalog teams repeatedly block each other's releases, need different availability targets, and can define stable contracts, independent services may be justified. But if checkout then requires synchronous reads across five services, latency and failure exposure may increase. Keep critical invariants and user journeys explicit.

Boundaries should usually follow cohesive domain behavior and data ownership, not technical layers such as “all controllers” or “all database code.” A service that owns a capability should ideally own the authoritative changes to its data. Shared tables with multiple writers create hidden coupling: schema changes and invariants require coordination even when deployments are separate. Conversely, forcing every capability into its own database too early can make normal reporting, transactions, and local development expensive.

Judge extraction by evidence, not fashion. Useful signals include a stable capability with a clear owner; persistent release or scaling contention; a genuinely different security or reliability boundary; independently meaningful traffic patterns; or a team that can operate the service and its on-call obligations. Measure the current bottleneck and change lead time before extracting. “The codebase is large” alone does not identify a useful service boundary.

Organizational cost matters as much as runtime cost. Each service adds release pipelines, alerts, access policies, capacity planning, incident ownership, and runbooks. Clear ownership can improve team autonomy; frequent cross-team changes can instead turn services into handoff points. A small organization may get more from a modular monolith than distributed deployment.

## Common Mistakes and Interview Traps

- Claiming microservices are inherently more scalable. A monolith can scale horizontally; service boundaries change independent scaling, not the laws of capacity.
- Treating separate repositories or processes as proof of loose coupling. Shared schemas and synchronized releases can preserve tight coupling.
- Splitting by nouns or organizational chart without tracing user workflows, invariants, and data ownership.
- Ignoring the cost of on-call, deployment, observability, and cross-service debugging.
- Saying a service extraction is reversible without considering data migration and clients already depending on the new contract.

## Tricky Points

- **Independent deployment is conditional.** It requires backward-compatible interfaces and data evolution while old and new versions overlap.
- **A database boundary is not the same as a process boundary.** A modular monolith can enforce ownership before services move data to separate stores.
- **Transactions change shape.** A distributed workflow is not equivalent to one ACID transaction; partial completion and reconciliation become visible product states.

## Practical Exercise

- **Goal:** Recommend a boundary strategy for a growing commerce product.
- **Context/input:** One 8-person team owns catalog, cart, checkout, payment authorization, and email. Releases are weekly. Checkout has a strict reliability target, email can be delayed, and the current application uses one relational database. Traffic is growing, but no measured component bottleneck is provided.
- **Constraints:** Do not assume microservices are the goal. State missing facts that could change your recommendation. Preserve correct payment and order behavior during partial failures.
- **Edge cases:** Email backlog grows; catalog changes frequently; one module needs a risky deployment; a payment provider times out after authorization may have succeeded.
- **Acceptance criterion:** Draw proposed boundaries, identify module and data owners, explain one candidate extraction and one reason to keep a capability in-process, and name measurable evidence that would change your decision. Do not write a full implementation solution.

## Summary

- Monolith, modular monolith, and microservices describe different deployment and boundary choices, not a universal quality ranking.
- Strong module ownership can reduce coupling before network distribution is necessary.
- Service extraction trades some release or scaling independence for network failure, data coordination, and operational work.
- Team capacity, ownership, user journeys, reliability needs, and measured constraints should drive the choice.

## Cheat Sheet

- **Choose a monolith** when one deployment and shared transactions fit the team's change patterns.
- **Choose a modular monolith** when internal boundaries are needed but independent operations are not yet worth their cost.
- **Consider a service** when a cohesive capability needs durable ownership, independent scaling/release, or a distinct security/reliability boundary.
- Before extraction, map data ownership, synchronous calls, failure behavior, migration, and on-call responsibility.

**Common Pitfalls**

- Architecture by trend or codebase size alone.
- Service boundaries that split one invariant across owners.
- Counting infrastructure cost but not team coordination, incident load, and developer workflow.

## Interview Questions

1. **Hard:** What is the difference between a monolith and a modular monolith? **Expected answer shape:** Define deployment unit versus internal boundaries, then describe dependency and data-ownership rules. **Follow-up:** How would you detect a module that is only nominally independent?
2. **Hard:** An email module is slowing checkout. What would you investigate before extracting it? **Expected answer shape:** Trace resource use and request flow, identify queueing/isolation options, quantify impact, and compare operational cost. **Follow-up:** What evidence would show a separate worker is sufficient?
3. **Very Hard:** Design service boundaries for orders, payments, inventory, and notifications. **Expected answer shape:** State invariants and ownership, sketch normal and failure flows, address partial completion and contracts, and defend an alternative. **Follow-up:** How would you migrate without stopping order creation?
4. **Very Hard:** The organization has 40 services but releases still require five teams to coordinate. Diagnose the architectural and organizational causes. **Expected answer shape:** Examine shared data, contract churn, ownership, dependencies, and release coupling; propose measurements and a staged correction. **Follow-up:** What would you consolidate, and what evidence would justify it?