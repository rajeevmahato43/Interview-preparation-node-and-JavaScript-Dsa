# Day 12: Load Balancing and Stateless Services

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> | Previous: <a href="day-11-caching-fundamentals.md">Day 11</a> | Next: <a href="day-13-queues-and-asynchronous-processing.md">Day 13</a></nav>

## What You Will Learn Today

- Trace how a reverse proxy or load balancer routes requests to service instances.
- Distinguish layer 4 and layer 7 routing concepts without assuming one product's implementation.
- Explain why shared/external state makes horizontal scaling and replacement easier.
- Design health checks, connection draining, and session behavior with their limitations in view.

## Prerequisites

- [Day 06: Networking and Request Lifecycle](day-06-networking-and-request-lifecycle.md)
- [Day 07: Architecture Diagrams and Design Artifacts](day-07-diagrams-and-architecture-communication.md)

## Quick Vocabulary Card

- **Load balancer:** A component that selects a destination for incoming traffic according to routing and health policy.
- **Reverse proxy:** A server that accepts a client's request and forwards it to an upstream service, often terminating or managing connections.
- **Health check:** A probe used to decide whether a target should receive traffic or be restarted; its exact purpose depends on the check type.
- **Connection draining:** Allowing existing work to finish while preventing new work from being sent to an instance being removed.
- **Sticky session:** A routing policy that tries to send one client's requests to the same instance.

## Core Concepts

Multiple service instances add capacity only when requests can reach healthy instances and state does not trap a user on one machine. A load balancer commonly sits between clients and a pool of targets. It can distribute new connections or requests, terminate TLS, apply routing rules, and report target health; the exact capabilities depend on its layer and product. The roadmap’s [Day 12 entry](../system-design-roadmap.md#day-12-load-balancing-and-stateless-services) references the [AWS Well-Architected Reliability pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html), whose patterns should be applied with the chosen environment's behavior verified.

### Routing and balancing are not the same thing

At layer 4, a balancer routes based primarily on transport-level connection information such as addresses and ports. At layer 7, it can inspect application protocol details such as HTTP host, path, or headers. That can enable path routing or request-aware policy but requires protocol handling and may change TLS termination and privacy boundaries. A “round robin” policy does not guarantee equal work: requests vary in duration, payload, and backend cost. Least-connections or load-aware policies can help some workloads but need accurate signals. Connection reuse also means the distribution unit may be a connection rather than each individual request, depending on the proxy and protocol.

### Stateless request handling

A service is operationally stateless when any healthy instance can handle a request without depending on private, irreplaceable local state from an earlier request. The process can still hold disposable caches and in-flight work. Durable session or workflow state belongs in a shared store or in a client credential that is validated on each request. For example, if a login session exists only in instance A's memory, a later request routed to B may appear logged out. Sticky sessions can hide this problem while A is healthy, but do not make that state durable or transferable.

Externalizing state makes replacement, autoscaling, and rolling deployment simpler, at the cost of shared-store latency, availability, and consistency requirements. Statelessness does not mean “no state anywhere”; it means no indispensable user state is stranded on one replaceable process.

### Health checks are signals, not truth

A routing health check asks whether an instance should receive traffic, but one probe cannot prove all operations will succeed. A shallow process check may pass while database operations fail; a check that synchronously calls every dependency can mark the entire fleet unhealthy during a dependency outage and make recovery harder. Separate the question “is this process alive?” from “should this instance receive new work?” and define dependency behavior deliberately. Thresholds, intervals, timeouts, and failure aggregation affect detection delay and false positives.

Health checks are sampled observations. A target can fail immediately after a successful probe, or recover before it is marked healthy. They do not replace request-level timeouts, error handling, or monitoring. Avoid a feedback loop where a brief overload causes probes to fail, targets are removed, remaining instances overload, and the fleet collapses.

### Safe removal and sessions

During deployment or scaling in, stop sending new requests to a target and allow in-flight requests to finish within a bounded drain period. Long-lived connections and streaming responses need explicit limits and reconnect behavior; forceful termination can interrupt them. The application should handle termination signals, stop accepting new work, finish or safely abandon requests, and close resources within its configured deadline.

Sticky sessions can reduce repeated session lookups or support legacy in-memory behavior, but they reduce flexibility and do not solve failover: the selected instance may disappear. Prefer portable session tokens or shared session storage where the security and revocation model permits. A signed token can be stateless for the server, but revocation and key rotation still require design; never put secrets in a merely encoded token.

## Common Mistakes and Interview Traps

- Assuming every request is balanced independently even when connection reuse or long-lived connections change routing behavior.
- Calling a service stateless because it has no database while keeping indispensable sessions in process memory.
- Treating sticky sessions as a durability or failover strategy.
- Making readiness depend on every downstream dependency without considering fleet-wide removal during an outage.
- Assuming a successful health probe guarantees the next user request succeeds.
- Removing an instance immediately and interrupting in-flight requests or persistent connections.
- Assuming equal request counts mean equal CPU, latency, or backend work.

## Tricky Points

Health-check design is a control loop: probe results change routing, routing changes load on remaining targets, and load affects subsequent probe results. A probe can be too shallow to protect callers or too deep to preserve capacity during a shared dependency failure. Specify the purpose of each probe, its timeout and thresholds, and whether dependency failure should remove one instance, degrade one feature, or be handled at request time.

## Practical Exercise

**Goal:** Sketch safe traffic flow through a load balancer to several API instances.

**Inputs/context:** An HTTP API stores sessions in one instance's memory today. Deployments must remove instances without dropping ordinary requests; some clients maintain long-lived connections.

**Constraints:** Specify L4 or L7 needs, health-check purpose, bounded draining, externalized session state, and the behavior if a shared session store is unhealthy.

**Edge cases:** Instance fails after a passing probe; database outage; rolling deploy with slow requests; sticky target disappears; long-lived client reconnects.

**Acceptance criterion:** Draw and label the request path, show the state boundary, define probe and drain behavior, and state one limitation and fallback for each. Do not assume a specific cloud balancer's undocumented defaults.

## Summary

Load balancing routes traffic; it does not guarantee equal work or healthy outcomes. Layer 4 and layer 7 expose different routing context. Keep indispensable state portable so instances can be replaced, use health checks for a clear purpose, and drain bounded in-flight work. Sticky sessions can preserve locality but do not provide resilience.

## Cheat Sheet

- L4 routes with transport context; L7 can apply application-aware rules.
- Stateless instances keep no irreplaceable user state locally.
- Health checks are sampled signals with false positives/negatives and control-loop effects.
- Drain new work first; give in-flight and long-lived work an explicit bounded exit path.
- Sticky sessions provide affinity, not durability or failover.
### Common Pitfalls

- Local sessions; health checks that remove the whole fleet; assuming one probe predicts future success.

## Interview Questions

1. **[Hard]** Why does in-memory session state complicate horizontal scaling? **Expected answer shape:** Request routing, instance failure/replacement, externalized state options, and their costs. **Follow-up:** What new risks come with a shared session store?
2. **[Hard]** Compare layer 4 and layer 7 load balancing for an HTTP API. **Expected answer shape:** Available routing context, protocol/TLS implications, connection/request distribution, and trade-offs. **Follow-up:** Why might round robin still create uneven load?
3. **[Hard]** What should happen when a service instance is removed during a slow request? **Expected answer shape:** Stop new traffic, bounded drain, cancellation/termination behavior, client retry safety, and long-lived connection handling. **Follow-up:** How does a deadline constrain draining?
4. **[Very Hard]** A database outage makes every readiness probe fail and the balancer removes all API targets. Diagnose and redesign the feedback loop. **Expected answer shape:** Probe purpose, dependency coupling, overload dynamics, degraded behavior, request-level handling, and recovery validation. **Follow-up:** Which dependency failure should make an instance unready versus merely degrade one endpoint?