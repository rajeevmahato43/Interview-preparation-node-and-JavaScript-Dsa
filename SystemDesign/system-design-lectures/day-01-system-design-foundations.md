# Day 01: What System Design Is

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> · Next: <a href="day-02-design-interview-method.md">Day 02</a></nav>

## What You Will Learn Today

By the end of this lesson, you can:

- Describe a system boundary and name the people or external systems that interact with it.
- Separate user-visible requirements from implementation choices.
- Turn vague goals into assumptions, constraints, and measurable quality goals.
- Explain why an architecture is a set of explicit decisions rather than a universal diagram.

## Prerequisites

Basic programming and familiarity with web applications are enough. No previous system design lecture is required.

## Quick Vocabulary Card

- **System boundary:** The line around the product or service being designed; dependencies outside it are external actors or systems.
- **Actor:** A person, client, or external system that interacts with the system.
- **Functional requirement:** A capability the system must provide.
- **Quality attribute:** A measurable property of that capability, such as latency, availability, or durability.
- **Constraint:** A limit or obligation that narrows acceptable designs, such as a budget, regulation, or existing dependency.
- **Assumption:** A provisional statement used to make progress when a fact is unknown.
- **Architecture:** The important components, their responsibilities, and the decisions governing how they interact.

## Core Concepts

System design is the work of deciding how software components and their operating environment should cooperate to meet stated needs. It is not simply selecting a database, drawing boxes, or predicting traffic. A useful design explains what users can do, what the system promises, where its boundaries lie, and why the chosen structure is suitable under explicit conditions.

### Start with the boundary

Consider a file-sharing product. Its actors might include an uploader, a recipient, an administrator, an identity provider, and an email service. The product may own upload authorization, file metadata, link expiry, and access auditing. It may rely on an external identity provider for sign-in and an external mail provider for delivery.

The boundary matters because it tells us what we must design and what we may treat as a dependency. “The system sends a notification” is not the same as “the system guarantees that a recipient reads it.” A mail provider can accept a message while delivery is delayed or rejected later. Naming the boundary prevents an interview design from promising behavior it cannot control.

### Describe behavior before choosing solutions

“Use object storage” is a design decision, not a requirement. “An authorized user can upload a file up to 2 GB and share it with a named recipient” is behavior. Keeping these separate allows alternatives to be compared against the same need.

A compact first scope for the file-sharing prompt could be:

| Kind | Example |
| --- | --- |
| Actor | Authenticated owner and invited recipient |
| Functional requirement | Owner uploads a file and grants a recipient time-limited access |
| Quality goal | For files up to 100 MB, 99% of authorized downloads begin within 2 seconds, excluding client transfer time |
| Constraint | The service must retain file metadata for audit for 1 year |
| Assumption | Initial launch serves one region and files are not edited collaboratively |
| Exclusion | Public search across all users' files is out of scope |

The numbers are illustrative targets, not recommendations. In a real discussion, ask whether they match user expectations and business obligations. A target without a defined measurement boundary can be misleading: does “download within 2 seconds” mean time to first byte, or completion of the full transfer?

### Functional needs and quality attributes interact

Functional requirements state what operations exist: upload, list, share, download, revoke. Quality attributes constrain how those operations behave: response time, availability, access control, durability, maintainability, and cost. They are not interchangeable. A file can be durable but temporarily unavailable; a service can return quickly while returning stale data; a highly available endpoint can still be insecure.

Quality goals become useful when attached to an operation, a population, and a measurement window. “Fast” could become “p95 metadata lookup latency below 150 ms at 500 requests per second.” “Reliable” could mean “monthly successful authorized-download availability of at least 99.9%.” These figures need stakeholder agreement and measurement definitions. Do not invent precise targets merely to make an answer sound senior.

### Constraints and assumptions are different

A constraint is an established boundary: a legal retention requirement, a fixed cloud provider, or a maximum infrastructure budget. An assumption fills a gap temporarily: perhaps the prompt does not say whether files are public or private. State assumptions so the interviewer can correct the ones that alter the design. Revisit them when new information arrives; an assumption should not silently harden into a fact.

Architecture then becomes a record of choices under these conditions. A single service and a distributed set of services may both be defensible at different scale, team size, and operational maturity. The [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html) is one provider's organized set of design considerations; it is a useful checklist, not a universal blueprint.

## Common Mistakes and Interview Traps

- Naming technologies before clarifying user behavior. A database choice cannot repair an undefined product scope.
- Treating the cloud or a third-party API as if it were inside your reliability boundary.
- Listing “scalable, secure, fast” without defining the operation, target, or conditions.
- Confusing a requirement with a proposed solution: “must use Kafka” may be a constraint only if the prompt or organization truly requires it.
- Designing every imaginable feature. Explicit exclusions keep the discussion answerable.
- Presenting an assumption as certainty. Mark uncertain facts and ask which ones the interviewer wants to resolve.

## Tricky Points

Availability, durability, and correctness describe different outcomes. A durable file can be temporarily unreachable. An available endpoint can accept an invalid permission change. Define which user-visible operation and failure condition each quality goal covers.

## Practical Exercise

**Goal:** Convert a vague file-sharing product prompt into a one-page scope.

**Inputs:** “Design a service that lets people store and share files.” Assume an initial web product unless you state otherwise.

**Constraints:** Keep the first release to one region; do not choose specific vendors or products.

**Edge cases:** Include revoked access, expired links, a failed upload, and an unavailable email dependency.

**Acceptance criteria:** Identify at least three actors, five functional requirements, three measurable quality goals, two constraints, two assumptions, and three explicit exclusions. Mark which assumptions would most change the design. Do not draw the architecture yet.

## Summary

System design begins by defining the boundary, actors, behavior, and operating conditions. Functional requirements say what users can do; quality attributes define measurable properties of those operations. Constraints are known limits, while assumptions are provisional. Architecture is a set of choices justified against this context, not a single answer that works for every workload.

## Cheat Sheet

- Clarify: **who** acts, **what** they need, and **what is outside** the system.
- Separate behavior from implementation.
- Make quality goals measurable and attach them to a specific operation.
- Label assumptions and constraints; ask about high-impact uncertainty.
- Keep initial scope small and name exclusions.
- **Common Pitfalls:** technology-first design; undefined “fast/reliable”; hidden assumptions; treating external dependencies as controllable; equating availability with correctness or durability.

## Interview Questions

1. **[Hard]** What is a system boundary, and why does it change how you discuss a third-party email service? **Expected answer shape:** define ownership, actors, dependency behavior, and guarantees the product can or cannot make. **Follow-up:** What observable signal would show that the provider accepted a message but delivery later failed?
2. **[Hard]** The prompt is “build a file-sharing system.” What would you clarify before choosing architecture? **Expected answer shape:** actors, core workflows, access rules, scale, quality goals, constraints, and explicit assumptions. **Follow-up:** Which single unanswered question could reverse your first design choice?
3. **[Very Hard]** A stakeholder says the service must be “highly available and secure.” Turn this into useful design input without inventing requirements. **Expected answer shape:** ask for operation-specific measures, threat boundaries, failure windows, and business priorities; distinguish agreed targets from assumptions. **Follow-up:** How would a conflict between availability and revocation correctness be exposed and resolved?