# Day 1: Foundations and Interview Method

## Requirements and quality

1. **System boundary:** Identify users, external actors, owned components, and explicit exclusions before drawing architecture.
2. **Functional requirements:** State user-visible actions; do not confuse them with a proposed technology.
3. **Quality attributes:** Translate “fast/reliable” into measurable latency, availability, durability, consistency, security, and cost constraints. [Foundations](../../SystemDesign/system-design-lectures/day-01-system-design-foundations.md) | [Requirements](../../SystemDesign/system-design-lectures/day-03-requirements-and-quality-attributes.md)

## Interview method

1. **Sequence:** Clarify scope, estimate, define API/data, draw a simple design, trace critical flows, examine bottlenecks/failures, compare trade-offs, summarize.
2. **Estimation:** Estimate average/peak traffic, read/write ratio, storage growth, and bandwidth; keep assumptions visible.
3. **Latency:** Use percentiles and fan-out reasoning; a few slow dependencies can dominate end-to-end tail latency.
4. **Communication:** Draw components, trust boundaries, and sync/async data flow at the level needed for discussion. [Method](../../SystemDesign/system-design-lectures/day-02-design-interview-method.md) | [Estimation](../../SystemDesign/system-design-lectures/day-04-capacity-estimation.md) | [Latency](../../SystemDesign/system-design-lectures/day-05-latency-throughput-and-queues.md) | [Networking](../../SystemDesign/system-design-lectures/day-06-networking-and-request-lifecycle.md) | [Diagrams](../../SystemDesign/system-design-lectures/day-07-diagrams-and-architecture-communication.md)

## Tricky points

1. **Scope and requirements**
	1.1 **Vague goals:** “Scale” or “high availability” needs a workload and measurable target.
	1.2 **Solutions too early:** Choosing a database/cache before requirements can lock in the wrong constraints.
2. **Estimation and communication**
	2.1 **Averages:** Peak traffic and p95/p99 may be much more important than average load.
	2.2 **Precision:** Rough estimates reveal orders of magnitude; they are not capacity guarantees.
	2.3 **Diagram:** A box diagram without request/data flow does not explain the design.