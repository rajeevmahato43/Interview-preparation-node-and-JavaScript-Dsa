# Day 03: Functional Requirements, Quality Attributes, and Constraints

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> · Previous: <a href="day-02-design-interview-method.md">Day 02</a> · Next: <a href="day-04-capacity-estimation.md">Day 04</a></nav>

## What You Will Learn Today

By the end of this lesson, you can:

- Write functional requirements as observable user or system behavior.
- Turn broad quality words into measurable targets with scope and conditions.
- Distinguish availability, latency, throughput, durability, consistency, privacy, and maintainability.
- Identify conflicts and ask stakeholders to rank requirements rather than hiding trade-offs.

## Prerequisites

- [Day 01: What System Design Is](day-01-system-design-foundations.md)
- [Day 02: A Repeatable Design Interview Method](day-02-design-interview-method.md)

## Quick Vocabulary Card

- **Service-level indicator (SLI):** A measurement of a service property, such as successful requests or latency.
- **Service-level objective (SLO):** A target value or range for an indicator over a stated window.
- **Availability:** Whether a defined operation is usable when requested, under a stated measurement rule.
- **Durability:** Whether acknowledged data remains preserved against defined failures.
- **Consistency:** What values or ordering users can observe across operations and replicas.
- **Constraint:** A fixed boundary that acceptable designs must respect.
- **Preference:** A desirable property that can be traded against higher-priority needs.

## Core Concepts

Requirements are inputs to design, not paperwork to finish before “real engineering.” They decide what correctness means, what failures matter, and which trade-offs are acceptable. The [Google Cloud Architecture Framework](https://cloud.google.com/architecture/framework) groups concerns such as reliability, security, and cost; use such frameworks as prompts for discussion, not as a substitute for product-specific priorities.

### Functional requirements describe outcomes

Write a functional requirement so someone can tell whether it works. “The notification service supports users” is too broad. “A user can subscribe to an account event and later receive an in-app notification containing the event type and a link to the relevant record” is testable. It still needs detail: who can subscribe, when delivery counts as successful, and whether notifications can be duplicated.

A useful scope distinguishes:

- **Primary flows:** The few actions the design must support, such as create, read, update, and acknowledge.
- **Supporting behavior:** Authentication, authorization, validation, and audit needs that make those actions safe.
- **Explicit exclusions:** Features not addressed in this iteration, such as user-configurable quiet hours or cross-region failover.

The exclusion list guards against accidental scope growth. It does not mean the feature is unimportant; it means the current design has a boundary.

### Quality goals need a measurement contract

An adjective is not a target. A useful target identifies the operation, the measurement, the population or conditions, and the time window. For example: “For authenticated notification reads below 10 KB, p95 server-side response latency is under 200 ms during normal regional operation.” This identifies a percentile, a boundary, a request class, and a condition. The team must still define where timing begins and ends and how errors are treated.

Some common attributes are easy to confuse:

| Attribute | Question it answers | Example of a useful statement |
| --- | --- | --- |
| Latency | How long does an operation take? | p99 acknowledgment latency under 1 second at the API boundary |
| Throughput | How much work completes per unit time? | Sustain 2,000 notification writes per second for the stated payload mix |
| Availability | Can the defined operation succeed? | At least 99.9% successful reads per month, excluding planned client errors |
| Durability | Does acknowledged data survive? | Accepted notifications are retained through a single application-process failure |
| Consistency | What ordering or freshness can callers observe? | A user sees their own subscription change on the next read |
| Security/privacy | Who can access what, and how is sensitive data handled? | Only the owning user and authorized administrators can read notification content |
| Maintainability | Can the team change and operate the service safely? | Schema changes are deployable without a coordinated client outage |

Durability needs a failure model; “never lose data” is not measurable without clear boundaries. Availability needs a denominator and window. Throughput needs a payload and operation mix.

### Find conflicts before architecture

Requirements can pull in different directions. A notification must appear instantly, yet delivery should continue through a regional outage. Strongly coordinated writes can improve some consistency guarantees but add latency and reduce operation during network partitions. Retaining every event simplifies audit but increases storage and privacy risk. A low budget may constrain redundancy or operational staffing.

Resolve conflicts by asking which user or business outcome is more important and what degradation is acceptable. Record a priority order, not just a list. A useful design can then state a mode of operation: “During a provider outage, persist notification intent and show it in-app; delay email delivery rather than blocking the primary account update.” This describes behavior under a real conflict.

### Separate hard constraints from negotiable goals

Examples of hard constraints include a mandated data residency region, a contractually fixed API, or a required retention period. Preferences might include using an existing language or minimizing operational burden. Ask whether a stated preference is truly fixed. The answer changes the solution space.

Requirements have owners: product defines outcomes, security and legal may set constraints, and operators define support needs.

## Common Mistakes and Interview Traps

- Treating “real time” as self-explanatory. Ask for a latency bound and what happens when it is missed.
- Mixing availability and durability, or response latency and end-to-end user-perceived latency.
- Giving an SLO without its operation, error treatment, measurement window, or operating conditions.
- Listing every attribute as equally important; priorities are needed when goals conflict.
- Claiming a system is secure without defining assets, actors, and authorization boundaries.
- Assuming requirements are permanent. Designs need to state how likely change affects the chosen boundary.

## Tricky Points

An SLO is a target, not proof that the implementation meets it. A target also does not specify the mechanism. “99.9% available” does not imply active-active deployment; a simpler architecture may meet the need at lower cost. Conversely, a design that looks redundant is not necessarily available if all replicas share a failure domain.

## Practical Exercise

**Goal:** Write measurable requirements for a notification service.

**Inputs:** A product asks users to receive important account notifications through an in-app inbox and optionally email.

**Constraints:** State whether email is required for the core action; do not assume vendor behavior. Separate hard requirements from preferences.

**Edge cases:** Duplicate source events, user unsubscribe, provider outage, delayed delivery, and unauthorized inbox access.

**Acceptance criteria:** Write at least five functional requirements and four quality goals covering latency, availability, durability or retention, and privacy/security. For each quality goal, state operation, measure, target or unresolved question, and conditions. Identify two conflicts and ask how to prioritize them; do not propose a full architecture.

## Summary

Functional requirements define observable behavior. Quality attributes constrain the behavior and need an explicit measure, scope, and conditions. Availability, durability, latency, throughput, and consistency are distinct. Prioritize requirements, expose conflicts, and distinguish binding constraints from preferences before selecting architecture.

## Cheat Sheet

- Requirement = actor + observable behavior + relevant conditions.
- Quality target = operation + measure + boundary + population/conditions + window.
- Ask what success, failure, and acceptable degradation mean to users.
- Rank conflicting goals; do not pretend all can be maximized at once.
- **Common Pitfalls:** vague “fast/reliable/secure”; unscoped percentages; attribute confusion; treating preference as mandate; architecture choices presented as requirements.

## Interview Questions

1. **[Hard]** Distinguish latency, throughput, and availability using one notification operation. **Expected answer shape:** define each independently and give a measurable example with boundary and conditions. **Follow-up:** Can throughput improve while p99 latency gets worse? Explain a plausible cause.
2. **[Hard]** Turn “deliver notifications quickly and reliably” into interview-ready requirements. **Expected answer shape:** clarify channel, operation, percentile or success rate, measurement window, failure behavior, and unresolved target ownership. **Follow-up:** What should happen during an email provider outage?
3. **[Very Hard]** The product wants immediate delivery, strict privacy, low cost, and continued service through a regional outage. How do you reason about conflicts? **Expected answer shape:** identify affected user outcomes, hard constraints, degradation choices, failure model, and decision owners; state trade-offs rather than claiming all goals are fully met. **Follow-up:** Which requirement would you relax first if the budget cannot support the original target, and how would you communicate the risk?