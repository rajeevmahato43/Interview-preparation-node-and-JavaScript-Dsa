# Day 07: Architecture Diagrams and Design Artifacts

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> · Previous: <a href="day-06-networking-and-request-lifecycle.md">Day 06</a></nav>

## What You Will Learn Today

By the end of this lesson, you can:

- Choose a diagram level that matches the question being discussed.
- Draw a context view and a component view with clear ownership and boundaries.
- Label data-flow arrows with direction, protocol, and synchronous or asynchronous behavior.
- Use assumptions, open questions, and a short decision record to make a design reviewable.

## Prerequisites

- [Day 01: What System Design Is](day-01-system-design-foundations.md)
- [Day 02: A Repeatable Design Interview Method](day-02-design-interview-method.md)
- [Day 03: Functional Requirements, Quality Attributes, and Constraints](day-03-requirements-and-quality-attributes.md)
- [Day 04: Estimation and Back-of-the-Envelope Math](day-04-capacity-estimation.md)
- [Day 05: Latency, Throughput, and Tail Behavior](day-05-latency-throughput-and-queues.md)
- [Day 06: Networking and Request Lifecycle](day-06-networking-and-request-lifecycle.md)

## Quick Vocabulary Card

- **System context:** A view of the system, its users, and external dependencies.
- **Container:** In the C4 model, a separately runnable or deployable part of a software system; it need not be a container image.
- **Component:** A logical part inside a container that has a focused responsibility.
- **Data flow:** A labeled path showing information moving between actors or components.
- **Trust boundary:** A boundary across which identity, authorization, or data-handling assumptions change.
- **Decision record:** A concise description of a choice, context, alternatives, and consequences.

## Core Concepts

A diagram is a communication tool, not the architecture itself. Its purpose is to help another person understand system scope, responsibilities, data movement, and important risks. The [C4 model](https://c4model.com/) provides context, container, component, and code-level views; it is one useful vocabulary, not a requirement to draw every level in every interview.

### Choose the level for the question

A **context diagram** answers: who uses the system, what system is being designed, and which external systems matter? It is useful early because it clarifies the boundary. A **container-level diagram** shows separately running or deployable units and major data stores. A **component-level diagram** opens one container to show internal responsibilities. A **code-level view** is rarely useful in a system design interview unless implementation structure itself is under discussion.

Do not confuse the word “container” in C4 with Docker or another packaging technology. A C4 container is a logical runtime or deployable unit, such as a web application, API process, or database.

### Make arrows carry meaning

An arrow should tell the reader more than “these boxes are related.” Label its direction and, when useful, protocol or operation: `HTTPS: create short link`, `SQL: persist mapping`, or `event: link-created`. Mark whether the caller waits for a response. A synchronous call lies on the current request path and can contribute latency or failure to that caller. An asynchronous edge usually means the producer can hand off work and continue, but the design must then explain persistence, delivery state, retries, and eventual processing.

Use different line styles or labels consistently if distinguishing control flow from data flow. Avoid relying on color alone; labels remain readable in monochrome and help when diagrams are copied into text-based tools.

### Show ownership and trust boundaries

Group components by the system or organization that owns them. Draw a boundary around the product and separate third-party identity, payment, or email systems. Mark a trust boundary where credentials or sensitive data cross into a different security context. The picture should prompt questions such as: where is a token verified, who can read this data, and what happens if the external provider is unavailable?

For a URL-shortening service, a context view might show a visitor and an administrator using the service, with an external identity provider if administration is authenticated. A container view could show a redirect API, a management API, a mapping store, and an optional analytics path. The redirect request may synchronously look up a code and return a redirect response; click analytics could be sent asynchronously if the product permits delayed counts. That choice changes loss tolerance and freshness, so the arrow label should not conceal it.

### Keep an interview diagram legible

Start with only the components required to trace the main use case. Add a box when it has distinct responsibility, a meaningful failure boundary, or a decision the interviewer can evaluate. Do not draw every replica or internal library at the first pass. Use a nearby note for scale assumptions, consistency expectations, or unresolved choices.

Pair the diagram with small artifacts when they reduce ambiguity: a list of core APIs, a data entity sketch, a workload estimate, or a decision record. For example: “Use an asynchronous analytics event because redirect latency is the priority; accepted events may be delayed, and the first version tolerates some analytics loss.” This sentence communicates a requirement, decision, consequence, and a question for later validation.

## Common Mistakes and Interview Traps

- Making a large diagram before choosing a user flow to explain.
- Drawing arrows without direction, protocol, data, or synchronous/asynchronous meaning.
- Putting third-party services inside the product boundary and implying control over their uptime.
- Treating every box as a microservice or confusing logical C4 containers with deployment packaging.
- Showing only happy-path data flow while hiding authorization, timeouts, or failure behavior.
- Using color or unexplained symbols as the only way to communicate meaning.

## Tricky Points

Diagram detail should increase only when it answers a question. A high-level view that omits a database index is not incomplete if the discussion is about system boundaries; a component view that omits a trust boundary may be incomplete if authorization is central. The right level depends on the decision being reviewed.

## Practical Exercise

**Goal:** Diagram a URL-shortening service at context and component levels.

**Inputs:** An authenticated owner creates and disables short links; visitors follow short links; the product records click counts.

**Constraints:** Assume a single region and no custom analytics dashboard. Keep vendor names out of the diagram.

**Edge cases:** Unknown or disabled code, store timeout, unauthorized management action, and delayed/lost analytics event.

**Acceptance criteria:** Produce a context diagram and a separate component view. Label actors, system boundary, components, stores, data direction, protocol or operation, synchronous versus asynchronous edges, and at least one trust boundary. Add a short decision record for analytics delivery and list two open questions. Do not provide deployment-level detail unless needed to defend a choice.

## Summary

Choose diagram detail to fit the decision under discussion. Context views establish actors and boundaries; container and component views expose runtime responsibilities and internal structure. Label arrows and trust boundaries so flow, protocol, and failure implications are visible. Use assumptions and decision records to explain why the diagram is shaped as shown.

## Cheat Sheet

- Context: system, users, external dependencies.
- Container: separately runnable/deployable units and major stores; not necessarily an OS container.
- Component: internal responsibility within a container.
- Label every important arrow with direction, operation/data, protocol, and sync/async behavior.
- Show ownership and trust boundaries; annotate assumptions and open questions.
- **Common Pitfalls:** detail before scope; unlabeled arrows; hidden external dependencies; diagrams as decoration; unresolved async delivery semantics; color-only notation.

## Interview Questions

1. **[Hard]** What belongs on a high-level system diagram, and what should wait for a deep dive? **Expected answer shape:** select by responsibility, boundary, key flow, risk, and decision value; distinguish context/container/component detail. **Follow-up:** When would a database schema belong in the discussion?
2. **[Hard]** A diagram has an API, queue, worker, and database. What must its arrows communicate? **Expected answer shape:** direction, payload or operation, protocol, sync/async behavior, and important delivery/failure implication. **Follow-up:** What operational questions arise from an asynchronous edge?
3. **[Very Hard]** Review a design diagram that places a third-party identity provider inside the product boundary and routes authenticated traffic directly to a data store. Explain what you would change and why. **Expected answer shape:** ownership and trust boundaries, authentication/authorization responsibilities, data path, exposure risks, and assumptions to verify. **Follow-up:** How would the diagram change if the provider is unavailable during an existing user session?