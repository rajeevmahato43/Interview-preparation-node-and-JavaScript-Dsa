# Day 27: Observability and Incident Diagnosis

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> | Previous: <a href="day-26-sagas-and-workflows.md">Day 26</a> | Next: <a href="day-28-security-and-threat-modeling.md">Day 28</a></nav>

## What You Will Learn Today

- Use metrics, logs, and traces to answer different diagnostic questions.
- Follow a request across synchronous and asynchronous boundaries with correlation context.
- Apply RED and USE signals and design alerts around user impact.
- Control cardinality, sampling, retention, and sensitive data exposure.

## Prerequisites

- [Day 05: Latency, Throughput, and Tail Behavior](day-05-latency-throughput-and-queues.md)
- [Day 06: Networking and Request Lifecycle](day-06-networking-and-request-lifecycle.md)
- [Day 12: Load Balancing and Stateless Services](day-12-load-balancing-and-stateless-services.md)

## Quick Vocabulary Card

- **Metric:** A numeric measurement aggregated over time, often used for trends and alerting.
- **Log:** A timestamped event record with context useful for investigating a specific occurrence.
- **Trace:** A linked representation of work across operations or services, often composed of spans.
- **Cardinality:** The number of distinct values or combinations represented by a metric label set.
- **RED:** Request rate, errors, and duration for a service.
- **USE:** Utilization, saturation, and errors for a resource.

## Core Concepts

Observability is the ability to infer system behavior from emitted signals. No one signal explains every incident: metrics show aggregate symptoms, logs record events, and traces connect spans along a path. The roadmap’s [Day 27 entry](../system-design-roadmap.md#day-27-observability-and-incident-diagnosis) links Google's [Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/) and [OpenTelemetry documentation](https://opentelemetry.io/docs/), which describe concepts and instrumentation conventions; exported data quality and backend behavior depend on implementation and configuration.

### Choose signals for the question

For a request-serving API, RED metrics show request rate, error rate, and latency distributions. A high p99 with normal average latency suggests a tail problem; an error ratio rising only for one operation may indicate a dependency or input-specific failure. USE metrics help inspect resources: utilization, saturation such as queue depth or pool wait, and errors. These are lenses, not complete taxonomies. A dashboard should connect user outcomes to likely constraints rather than collect every possible metric.

Metrics are aggregated and comparatively cheap for broad trends, but labels create time series. A label such as route template is usually bounded; raw user ID, request ID, or full URL can create unbounded cardinality and cost. Keep high-cardinality identifiers in sampled traces or controlled logs, not metric labels. Verify whether a telemetry backend's cardinality and retention behavior matches its documented model.

### Logs and traces need safe context

Structured logs can include event name, service, environment, operation, outcome, and a trace or correlation identifier. Avoid logging credentials, signed URLs, payment details, unnecessary personal data, or raw request bodies. Redaction must apply at the point data enters telemetry, and access, retention, and deletion should follow policy. A correlation ID helps locate related records; it should not be treated as an authorization token or as proof two events belong to the same causal operation unless propagated deliberately.

Distributed traces connect spans across service calls. Propagate trace context through HTTP headers and, where supported, message metadata. An asynchronous consumer span may happen seconds later and on a different process; preserve a link to the publishing operation rather than pretending the worker ran synchronously inside the original request. Sampling controls volume, but head sampling may miss rare errors; tail-based sampling can retain traces after observing an error but requires backend capacity and configuration. Traces can be incomplete due to dropped context, sampling, instrumentation gaps, or queue boundaries.

### Diagnose by narrowing the failure domain

Start with user impact and time window. Compare request rate, error rate, latency percentiles, and saturation before and after the change. Segment by bounded dimensions such as endpoint, region, status class, and dependency. Use traces to locate slow spans, then logs for detailed events around representative failures. Check whether the symptom is broad or isolated, whether a recent deployment or traffic shift correlates, and whether downstream errors or resource exhaustion precede it. Do not assume temporal correlation proves root cause.

For a queued workflow, instrument producer acceptance, message age, attempt count, consumer duration, and terminal outcome. Preserve identifiers across asynchronous handoffs while avoiding sensitive payloads. Alert on actionable symptoms and error-budget/SLO impact rather than every internal fluctuation. Every alert needs an owner and a first diagnostic step; dashboards without a response path create noise, not reliability.

## Common Mistakes and Interview Traps

- Using logs as the only signal and discovering overload only after storage or search becomes expensive.
- Putting user IDs, request IDs, or raw paths in metric labels and causing cardinality growth.
- Treating sampled traces as a complete record of all requests.
- Losing trace context at queue boundaries or generating unrelated IDs in each service.
- Logging tokens, signed URLs, personal data, or entire request bodies by default.
- Alerting on every dependency blip without linking it to user impact or an actionable owner.
- Assuming a trace identifies root cause rather than showing observed timing and instrumentation.

## Tricky Points

Trace context and correlation IDs are observability metadata, not trusted identity. Validate and constrain externally supplied values to avoid spoofing, log injection, or excessive cardinality. Sampling can bias what an investigator sees; preserve error and slow-request evidence intentionally, while respecting sensitive-data controls. More telemetry is not automatically more observability if fields are inconsistent or no one can interpret them.

## Practical Exercise

**Goal:** Design dashboards and a diagnostic path for a slow API that publishes asynchronous work.

**Inputs/context:** An API writes a record and publishes a job; a worker calls an external provider. Users report delays but do not know whether requests or jobs are stuck.

**Constraints:** Include RED signals, relevant USE signals, queue age, correlation across the handoff, sampling/cardinality limits, and sensitive-data policy.

**Edge cases:** Trace context missing; high-cardinality tenant values; provider timeout; queue backlog with low request latency; telemetry backend unavailable; signed access token appears in a URL.

**Acceptance criterion:** Propose a dashboard and one actionable alert, trace one request through eventual worker outcome, name fields safe for metrics/logs/traces, and explain how you would diagnose which stage caused the delay. Do not assume complete trace coverage.

## Summary

Metrics expose aggregate trends, logs provide event detail, and traces connect work across boundaries. Combine them around user impact and resource saturation. Propagate context through asynchronous handoffs, control metric cardinality, understand sampling gaps, and protect sensitive data. Telemetry should lead to a diagnostic action, not just a larger dashboard.

## Cheat Sheet

- RED for service requests; USE for resource pressure.
- Metrics: bounded labels; logs/traces: controlled high-detail context.
- Propagate trace context through services and messages; async work is a separate span/lifecycle.
- Sampling creates gaps; preserve rare errors/slow paths deliberately.
- Treat trace IDs as correlation, never authorization; minimize sensitive telemetry.
### Common Pitfalls

- Unbounded labels; secrets in logs; missing async context; alert noise; treating traces as complete proof.

## Interview Questions

1. **[Hard]** When would you use a metric, log, or trace? **Expected answer shape:** Aggregate trends, event detail, and cross-operation path; limitations and appropriate diagnostic questions. **Follow-up:** Which signal would you inspect first for rising p99 latency?
2. **[Hard]** Why is a raw user ID usually a poor metric label? **Expected answer shape:** Cardinality, storage/query cost, privacy, and alternative trace/log correlation. **Follow-up:** How can you preserve tenant-specific debugging safely?
3. **[Hard]** Trace an API request through a queued worker that runs later. **Expected answer shape:** Propagation metadata, producer/consumer spans, message identity, timing gap, outcome, and sampling caveat. **Follow-up:** What if the queue cannot preserve trace context?
4. **[Very Hard]** Users see slow completion, but API RED metrics are healthy and queue depth is moderate. Design diagnosis. **Expected answer shape:** Queue age, per-stage latency, retries, provider saturation, sampling gaps, cohort/operation segmentation, and actionable alerting. **Follow-up:** How would you avoid exposing signed URLs or personal data during investigation?