# Day 33: SLOs, SLIs, Error Budgets, and Reliability

<nav aria-label="Lecture navigation">[Roadmap](../system-design-roadmap.md) | [Previous: Day 32](day-32-deployment-and-orchestration.md) | [Next: Day 34](day-34-capacity-cost-and-autoscaling.md)</nav>

## What You Will Learn Today

- Define an SLI from a user-visible outcome and make its measurement scope explicit.
- Calculate a request-based error budget and distinguish it from time-based availability.
- Use SLOs to guide alerting, release risk, and reliability investment without treating them as guarantees.
- Recognize how aggregation can hide failures for a particular user journey or dependency.

## Prerequisites

- [Day 03: Functional Requirements, Quality Attributes, and Constraints](day-03-requirements-and-quality-attributes.md)
- [Day 05: Latency, Throughput, and Tail Behavior](day-05-latency-throughput-and-queues.md)
- [Day 27: Observability and Incident Diagnosis](day-27-observability-and-diagnosis.md)

## Quick Vocabulary Card

- **SLI:** A measured indicator of service behavior, such as the fraction of eligible requests that succeed.
- **SLO:** A target for an SLI over a stated window and scope.
- **SLA:** An external or contractual commitment, often with consequences if a target is missed.
- **Error budget:** The allowed amount of bad or unavailable behavior under an SLO.
- **Burn rate:** The rate at which observed bad events consume the budget relative to the target.
- **Measurement scope:** The users, operations, locations, and time window included in a metric.

## Core Concepts

Reliability is whether a system delivers the behavior users need, under stated conditions. “99.9% uptime” is incomplete unless uptime is defined, the measurement window is clear, and the affected user journey is named. An SLI turns a quality goal into an observable measurement. For an API, a request-based availability SLI might be good eligible responses divided by all eligible requests. A latency SLI might be the fraction of eligible requests completing below a stated threshold. The denominator matters as much as the numerator.

Define eligibility explicitly. Do client cancellations count? Do invalid requests count as failures? Are health checks excluded? Do internal retries count as separate attempts or does the user request count once? Does a multi-region product measure globally or per region? Exclusions should reflect the promised service behavior, not be introduced after an incident to improve the chart. An SLI should be close enough to user experience that teams can act on it, and stable enough that the definition does not shift whenever implementation changes.

An SLO is the target for that SLI over a window. For example: “At least 99.9% of eligible read requests return a valid response within 300 ms over a rolling 30-day window.” This combines success and latency; some teams instead track separate SLIs to diagnose trade-offs. If the target is 99.9% good requests, the error budget is 0.1% of eligible requests in that window. With 10,000,000 eligible requests, that is 10,000 requests outside the objective. This is request-based math: it cannot be converted directly into “43.2 minutes of downtime” unless the SLI is time-based and its measurement model supports that conversion. A low-traffic outage and a high-traffic outage consume very different portions of a request-based budget.

The SLO target is an engineering decision, not a claim that a system is inherently capable of that reliability. A stricter objective may require redundancy, testing, on-call coverage, and capacity that cost more and constrain feature work. A looser objective may permit faster change but can harm trust or business outcomes. An SLA may be a contractual commitment with defined measurement and remedies; it is not simply another name for an internal SLO. Do not promise an SLO externally without aligning scope, exclusions, and operational capability.

**Worked scenario: read API.** For 2 million eligible reads, a 99.9% target permits 2,000 bad requests. Three thousand failed or over-threshold requests yield 99.85%, missing the objective. The SLI must say whether slow successes count as bad. Track excluded synthetic checks separately, and segment results to find concentrated failures without changing the top-level definition.

Error budgets make risk trade-offs explicit. Rapid burn may justify pausing high-risk releases, prioritizing reliability, or reducing traffic. Agree the response with product and engineering partners; an automatic permanent freeze may not fix the cause. A healthy budget is not permission to deploy recklessly, but can indicate room for measured change.

Alert on user symptoms and budget burn, not every error. Multi-window burn policies can catch fast incidents and sustained degradation; thresholds depend on the objective. Pair alerts with volume, tail latency, saturation, dependencies, and traces. Low-volume rates need sample context or complementary synthetic checks, which also do not prove all users are healthy.

For a multi-step user journey, a per-service SLO may miss interaction failures. Checkout might require API, inventory, and payment behavior to all succeed. Measure the user-facing outcome as well as component indicators, and avoid mechanically multiplying service availability unless independence and measurement assumptions are justified. SLO guidance and examples are available in the [Google SRE book on Service Level Objectives](https://sre.google/sre-book/service-level-objectives/).

## Common Mistakes and Interview Traps

- Stating an SLO without numerator, denominator, window, latency threshold, or exclusions.
- Converting request-based budget into minutes without changing the measurement model.
- Treating SLA, SLO, and SLI as interchangeable.
- Excluding failures after they happen or hiding a regional/user-segment failure in a global average.
- Alerting on every error instead of actionable user impact or rapid budget consumption.

## Tricky Points

- **Averages conceal tails and segments.** Pair a top-level SLO with diagnostic slices that do not redefine success opportunistically.
- **Low volume distorts rates.** One failed request can create a large percentage change; add sample context.
- **Retries complicate counting.** Decide whether the SLI counts attempts or the final user operation, and use consistent instrumentation.
- **Error budgets are a policy tool.** They do not identify root cause or dictate one universal release policy.

## Practical Exercise

- **Goal:** Draft an SLI and SLO for a customer-facing read API.
- **Context/input:** The API serves product detail reads across two regions. Requests may be invalid, cancelled, or retried; one region has much lower traffic. The business says the service should be “fast and reliable.”
- **Constraints:** Choose a 30-day objective, define eligible requests and latency threshold, and explain how the budget affects release risk. State assumptions rather than inventing business requirements.
- **Edge cases:** Low sample count in one region, synthetic probe failures, retries, and a partial outage affecting one endpoint.
- **Acceptance criterion:** Write an unambiguous SLI/SLO statement, show the budget calculation for a supplied or stated request volume, name diagnostic metrics and alert intent, and defend at least one exclusion. Do not provide a universal target as the solution.

## Summary

- An SLI measures behavior; an SLO sets a target over a defined scope and window; an SLA is an external commitment.
- An error budget is the allowed bad portion of the selected measurement, and its units follow the SLI.
- Request-based budgets are not downtime minutes.
- Useful objectives describe user-visible behavior, eligibility, thresholds, and aggregation.
- Budget burn informs release and reliability decisions but does not replace diagnosis or judgment.

## Cheat Sheet

- Define **what is measured**, **who/what is eligible**, **good threshold**, **window**, and **aggregation**.
- Request budget = eligible requests × allowed bad fraction.
- Time-based downtime conversion applies only to an appropriately time-based SLI.
- Alert on actionable symptoms and burn rate; use slices for diagnosis.
- Let budget policy guide risk, not automatically dictate every release.

**Common Pitfalls**

- Vague “uptime” objectives.
- Hidden denominator changes.
- Budget reporting without a response policy.
- Global success rate masking a broken region or journey.

## Interview Questions

1. **Hard:** Define SLI, SLO, and SLA, then give one API example. **Expected answer shape:** Distinguish measurement, internal target, and external commitment; specify scope and window. **Follow-up:** What changes if the SLO is contractual?
2. **Hard:** A 99.9% request SLO covers 5 million eligible requests. Compute its error budget and explain why it is not a downtime allowance. **Expected answer shape:** Calculate the allowed bad-request count and relate units to the measurement model. **Follow-up:** How do retries affect the denominator?
3. **Very Hard:** Global SLO is healthy but one region has severe latency and low traffic. How should monitoring and policy respond? **Expected answer shape:** Preserve the SLO definition, add statistically meaningful diagnostics, assess user impact, and choose a targeted response. **Follow-up:** When would a regional SLO be warranted?
4. **Very Hard:** Product wants a stricter objective while the current budget is already burning quickly. Defend an engineering response. **Expected answer shape:** Verify measurement, quantify causes/costs, propose immediate containment and longer-term investment, and communicate delivery trade-offs. **Follow-up:** What evidence would support loosening or tightening the objective?