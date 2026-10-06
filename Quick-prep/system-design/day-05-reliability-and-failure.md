# Day 5: Service Architecture, Observability, and Production Operations

Quick review of main-course lectures 27–35. Covers the three pillars of observability, STRIDE security modeling, bounded contexts, the Strangler Fig pattern, service meshes, zero-downtime deployment strategies, and SLO error budget calculations.

## Observability, security, and service boundaries

**1. The three pillars of observability and RED/USE metrics**

- *Metrics:* Aggregated numerical measurements over time. Use **RED** for request-driven services (Rate, Errors, Duration); use **USE** for hardware resources (Utilization, Saturation, Errors).
- *Structured Logs:* Machine-readable JSON logs tagged with distributed `trace_id` and `span_id`.
- *Distributed Tracing (OpenTelemetry):* Injects W3C `traceparent` headers across HTTP/gRPC boundaries to visualize request latency across microservices.

**2. Security architecture: STRIDE and zero-trust mTLS**

- *STRIDE Threat Modeling:* Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege.
- *Authentication: JWT vs Server Sessions:* JWTs are stateless and self-contained (difficult to revoke immediately without blocklist); server sessions stored in Redis enable immediate instant revocation.
- *Mutual TLS (mTLS):* Cryptographically verifies both client and server identities within the cluster, establishing Zero-Trust network boundaries.

**3. Monolith vs microservices: Bounded contexts and Strangler Fig**

Avoid decomposing prematurely. Start with a Modular Monolith. When team boundaries or independent scaling demand separation, use the **Strangler Fig Pattern**: place an API gateway in front of the monolith and route new or rewritten routes to microservices incrementally.

```text
                  +---> [API Gateway] ---> [New Microservice]
[Client Requests] |            | (Default fallback)
                  +------------+---------> [Legacy Monolith]
```

**4. Service communication: gRPC and the Service Mesh (Envoy/Istio)**

Instead of hardcoding discovery, retries, and mTLS in application code, deploy a Service Mesh. Envoy proxy sidecars run beside each application container to handle service discovery, connection pooling, mutual TLS, and health checking transparently.

[Observability and diagnosis](../../SystemDesign/system-design-lectures/day-27-observability-and-diagnosis.md) | [Security and threat modeling](../../SystemDesign/system-design-lectures/day-28-security-and-threat-modeling.md) | [Monoliths and service boundaries](../../SystemDesign/system-design-lectures/day-29-monoliths-and-service-boundaries.md) | [Service communication and discovery](../../SystemDesign/system-design-lectures/day-30-service-communication-and-discovery.md)

## Deployment, SLOs, and disaster recovery

**1. Zero-downtime deployment strategies**

- *Rolling Deployment:* Replaces instances gradually. Low resource overhead, but old and new versions run concurrently; requires backward-compatible database schemas.
- *Blue-Green Deployment:* Deploys new version (Green) to complete identical staging cluster; switches router/load balancer instantly. Zero downtime and immediate rollback, but doubles infrastructure cost during deployment.
- *Canary Deployment:* Routes a tiny percentage of live user traffic (e.g. 1%, then 5%, then 25%) to the new build; monitors error rates and latency before full rollout.

```text
[Router] --(99% Traffic)--> [Blue Fleet (v1.0)]
         --( 1% Traffic)--> [Green Fleet (v1.1)] (Canary: Error / latency checks)
```

**2. SLOs, SLAs, and error budgets**

- *SLA (Service Level Agreement):* Legal commitment with customers with financial penalties for breach.
- *SLO (Service Level Objective):* Internal target for engineering health (e.g. 99.9% successful requests).
- *Error Budget:* $100\% - \text{SLO}$. If 99.9% SLO is exceeded ($> 0.1\%$ errors), feature releases are halted and sprint priorities pivot to stability and bug fixes.

```text
Availability Downtime Math:
99.9%  ("Three Nines")  = 8.76 hours downtime / year
99.99% ("Four Nines")   = 52.6 minutes downtime / year
99.999% ("Five Nines")  = 5.26 minutes downtime / year
```

**3. Database schema evolution (Expand-Contract pattern)**

Never rename a column in a single migration.
1. *Expand:* Add new column alongside old; application writes to both columns, reads from old.
2. *Backfill:* Asynchronously populate historical rows in new column.
3. *Switch:* Update application to read and write from new column.
4. *Contract:* Safely drop old column in subsequent release.

[Configuration and evolution](../../SystemDesign/system-design-lectures/day-31-configuration-and-evolution.md) | [Deployment and orchestration](../../SystemDesign/system-design-lectures/day-32-deployment-and-orchestration.md) | [SLOs and error budgets](../../SystemDesign/system-design-lectures/day-33-slos-and-error-budgets.md) | [Capacity and cost](../../SystemDesign/system-design-lectures/day-34-capacity-cost-and-autoscaling.md) | [Disaster recovery](../../SystemDesign/system-design-lectures/day-35-disaster-recovery-and-readiness.md)

## Tricky points

1. **Architecture and deployment**
   **1.1 Breaking DB schema changes:** Dropping or renaming a column while old application pods are still servicing requests triggers immediate production HTTP 500 errors; always follow Expand-Contract.
   **1.2 JWT revocation gap:** Once signed, a JWT is valid until its expiration timestamp; revoking a compromised user token immediately requires maintaining a distributed Redis blocklist or short token lifetimes (e.g. 15 minutes) paired with refresh tokens.

2. **Operations and reliability**
   **2.1 Autoscaling lag:** Autoscaling based on CPU metrics has a 2–5 minute initialization delay (pod provisioning, image pull, application warmup); autoscaling cannot protect against instantaneous traffic spikes without over-provisioned headroom.
   **2.2 Uncorrelated logging:** Logging millions of lines without a unified correlation/trace ID makes debugging distributed microservice failures across containers impossible.