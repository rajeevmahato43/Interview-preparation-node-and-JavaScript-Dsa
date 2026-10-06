# Day 5: Architecture and Operations

## Architecture choices

1. **Monolith and service boundaries:** A modular monolith can keep deployment simple; split services when ownership, scaling, isolation, or team boundaries justify network costs.
2. **Service communication:** Synchronous calls simplify immediate responses but couple availability/latency; async messages decouple work but add delivery/state complexity.
3. **Configuration and evolution:** Version contracts and roll out compatible changes; design migrations and deployment so old/new versions can overlap safely. [Boundaries](../../SystemDesign/system-design-lectures/day-29-monoliths-and-service-boundaries.md) | [Communication](../../SystemDesign/system-design-lectures/day-30-service-communication-and-discovery.md) | [Evolution](../../SystemDesign/system-design-lectures/day-31-configuration-and-evolution.md)

## Production readiness

1. **Deployment:** Health checks, gradual rollout, rollback, and graceful draining reduce release risk.
2. **SLOs and cost:** Define user-facing reliability targets and error budgets; capacity/autoscaling decisions should include utilization and cost.
3. **Disaster recovery:** Set RPO/RTO and prove restore/failover procedures through practice, not documentation alone. [Deployment](../../SystemDesign/system-design-lectures/day-32-deployment-and-orchestration.md) | [SLOs](../../SystemDesign/system-design-lectures/day-33-slos-and-error-budgets.md) | [Capacity/cost](../../SystemDesign/system-design-lectures/day-34-capacity-cost-and-autoscaling.md) | [Recovery](../../SystemDesign/system-design-lectures/day-35-disaster-recovery-and-readiness.md)

## Tricky points

1. **Architecture**
	1.1 **Microservices:** More services add network failures, deployment coordination, observability, and data ownership costs.
	1.2 **Synchronous calls:** A dependency timeout consumes request budget and may leave operation outcome uncertain.
	1.3 **Compatibility:** A rolling deploy can run old and new versions simultaneously; schema/API changes need compatible sequencing.
2. **Operations**
	2.1 **SLO:** Availability alone omits latency and correctness; choose indicators that reflect user experience.
	2.2 **Autoscaling:** It reacts to signals with delay and cannot instantly solve a hard dependency bottleneck.
	2.3 **Recovery:** Replication and backups are different; test restoring data and service behavior against RPO/RTO.