# Day 02: A Repeatable Design Interview Method

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> · Previous: <a href="day-01-system-design-foundations.md">Day 01</a> · Next: <a href="day-03-requirements-and-quality-attributes.md">Day 03</a></nav>

## What You Will Learn Today

By the end of this lesson, you can:

- Move from an ambiguous prompt to a bounded design using a repeatable sequence.
- Manage a 30-minute interview without letting estimates or diagrams consume all the time.
- Identify which uncertainty or bottleneck deserves a deeper discussion.
- Summarize trade-offs, failure behavior, and unanswered questions clearly.

## Prerequisites

- [Day 01: What System Design Is](day-01-system-design-foundations.md)

## Quick Vocabulary Card

- **Scope:** The behaviors and constraints included in the design exercise.
- **Deep dive:** Focused reasoning about one important component, flow, or failure mode.
- **Bottleneck:** A resource or dependency that limits end-to-end capacity or latency.
- **Trade-off:** A decision that improves one property while making another worse or more costly.
- **Decision record:** A short statement of choice, reason, assumptions, and consequences.

## Core Concepts

A system design interview evaluates how you reason when the prompt is incomplete. The goal is not to recite a memorized architecture. It is to make a sensible sequence of decisions, show the assumptions behind them, and adapt when the interviewer changes a requirement. The [Google SRE books](https://sre.google/books/) offer useful operational context, but an interview answer still needs to fit the prompt rather than reproduce any one organization's systems.

### A practical sequence

Use this sequence as a guide, not a rigid script:

1. **Clarify the prompt.** Identify users, core actions, constraints, expected scale, and the meaning of ambiguous words such as “real time.” Ask a few high-value questions, then state reasonable assumptions to keep moving.
2. **Set scope and requirements.** Separate essential flows from exclusions. Write the most important quality targets in operation-specific terms.
3. **Estimate order of magnitude.** Calculate the traffic, storage, or bandwidth that could change the design. Show assumptions and units; skip arithmetic that does not affect a decision.
4. **Define interfaces and data.** Sketch the main API operations and the minimum data needed to support them. This reveals boundaries and correctness needs.
5. **Draw the simplest viable high-level design.** Show clients, entry point, application responsibilities, storage, and important dependencies. Trace one write and one read.
6. **Find the pressure point.** Use workload and quality goals to choose a bottleneck, critical failure, or consistency question for a deeper discussion.
7. **Compare a meaningful alternative.** Explain why a simpler or different approach might fit, and what condition would justify changing the design.
8. **Close with a summary.** Restate assumptions, key decisions, failure behavior, risks, and open questions.

This order prevents premature commitment while still getting to an architecture. It is normal to revisit an earlier assumption if the design exposes a conflict.

### Manage the clock by information value

For a 30-minute session, a workable allocation might be 4 minutes for clarification and scope, 4 for estimates, 5 for APIs and data, 7 for the high-level design and flow, 7 for one or two deep dives, and 3 for summary. Treat this as a starting point. If the interviewer supplies requirements, use the time saved to trace failure behavior. If an estimate has little chance of changing the architecture, bound it and move on.

The useful question is not “Have I covered every topic?” but “What uncertainty could most change this design?” Suppose a link-shortening system may receive far more reads than writes. The read/write ratio can affect cache and storage discussion. Exact geographic distribution may be less urgent until latency goals or multi-region requirements are known.

### Make trade-offs visible

For each major choice, state four things: the decision, the requirement it serves, the cost or risk it introduces, and the condition that would make you revisit it. For example: “I would begin with one application service and a relational database because the initial scope is small and link creation needs uniqueness. This keeps deployment and data integrity simple, but one database may become a capacity or availability limit. I would measure query and storage pressure before splitting the service or adding replicas.”

This is stronger than naming a fashionable component. It ties a choice to evidence and gives the interviewer a clear path for follow-up.

### Choose a deep dive deliberately

Prefer areas with high user impact, high uncertainty, or a direct link to a stated quality target. If an API depends on four services, trace timeout and partial-failure behavior. If a workload writes large files, inspect the data path and bandwidth estimate. If access revocation must take effect quickly, examine caching and stale authorization. Do not deep-dive every box to equal depth.

## Common Mistakes and Interview Traps

- Starting with “I’ll use microservices” before scope, team constraints, or failure boundaries are understood.
- Asking many low-impact questions instead of stating assumptions and proceeding.
- Drawing components without tracing a concrete request through them.
- Performing precise calculations whose result does not alter a decision.
- Treating every interviewer prompt as a request to discard the whole design; clarify which requirement changed and update only affected choices.
- Ending without a summary, leaving the interviewer to infer what is important.

## Tricky Points

An interview is collaborative. A clarifying question should expose a decision, not test the interviewer’s patience. Ask high-impact questions, state provisional assumptions for the rest, and invite correction. The sequence is repeatable, but the time allocation and depth must respond to the prompt.

## Practical Exercise

**Goal:** Run a 30-minute design drill and assess your time use.

**Inputs:** Design a service that creates short URLs and redirects visitors. Use the Day 01 file-sharing scope exercise only as a model for making assumptions explicit.

**Constraints:** Do not assume a specific cloud vendor. State a read/write workload assumption and one availability or latency target.

**Edge cases:** Duplicate aliases, unavailable storage, cache miss, and destination URL changed or disabled.

**Acceptance criteria:** Record time spent on clarification, requirements, estimates, APIs/data, high-level design, deep dives, and summary. Produce one read trace and one write trace, identify a leading bottleneck, and state one alternative with a condition for adopting it. Do not write a full implementation.

## Summary

Use a flexible sequence: clarify, scope, estimate, define interfaces and data, draw, trace, select a deep dive, compare, and summarize. Spend time according to decision value and user impact. A strong answer makes trade-offs and assumptions visible and adapts locally when requirements change.

## Cheat Sheet

- Ask only questions whose answers can change scope or design.
- Bound unknowns with explicit assumptions.
- Estimate to the precision needed for a decision.
- Trace one important read and write through the design.
- Deep-dive where impact, uncertainty, or risk is highest.
- End with decisions, costs, failure behavior, and open questions.
- **Common Pitfalls:** fixed script with no adaptation; exhaustive question lists; disconnected boxes; false precision; unqualified technology names; no closing summary.

## Interview Questions

1. **[Hard]** Walk through your method for an unfamiliar design prompt. **Expected answer shape:** ordered steps with a reason for each and a note that the sequence adapts. **Follow-up:** What would you skip or compress if the interviewer gives the requirements up front?
2. **[Hard]** You have seven minutes left and have not discussed failures. How do you choose what to cover? **Expected answer shape:** prioritize critical user flows, likely bottlenecks, blast radius, and stated quality targets. **Follow-up:** What would you explicitly defer and record as an open question?
3. **[Very Hard]** Your initial design uses a single data store; the interviewer reveals a much larger read-heavy workload. Explain how you update the design without discarding sound decisions. **Expected answer shape:** identify changed assumptions, estimate impact, trace read path, compare cache/replica/partition options, and explain consistency/operations costs. **Follow-up:** What measurement would tell you which option to evaluate first?