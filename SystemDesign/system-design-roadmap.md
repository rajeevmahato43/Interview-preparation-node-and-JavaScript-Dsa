# System Design Roadmap: Beginner to Advanced

A 42-day, interview-focused system design curriculum for engineers building backend and distributed-systems judgment from first principles. It develops a repeatable approach to requirements, architecture, data, scale, reliability, and operational trade-offs, then applies that approach to end-to-end design interviews.

**Audience:** Developers who know basic programming and HTTP concepts. The examples lean toward backend services and complement the [Node.js roadmap](../Node/node-roadmap.md); prior Node.js specialization is not required.

**Primary references:** [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html), [Google SRE books](https://sre.google/books/), [Google Cloud Architecture Framework](https://cloud.google.com/architecture/framework), [HTTP Semantics, RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), [PostgreSQL documentation](https://www.postgresql.org/docs/), [Redis documentation](https://redis.io/docs/latest/), [Apache Kafka documentation](https://kafka.apache.org/documentation/), and [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/). Use vendor references to understand documented behaviors, not as proof that one provider's product choices fit every design.

## How to Use This Roadmap

- Study one day at a time; draw the design and explain your assumptions before reading additional material.
- Treat prerequisites as dependencies. If a concept is unfamiliar, revisit its foundation before adding more components.
- Each day links to its lecture under [`system-design-lectures/`](system-design-lectures/). Complete the lesson and its exercise before moving to the next day.
- Complete the exercise by producing a tangible artifact: a diagram, estimate, decision record, failure analysis, or timed design explanation.
- Practice with explicit workload assumptions. There is rarely one universally correct architecture independent of requirements, scale, consistency, cost, and team constraints.
- For interview drills, clarify requirements, estimate scale, define APIs and data, draw the simplest viable design, trace important flows and failures, then state trade-offs.

## Course Goals

By the end of this roadmap, the learner should be able to:

- Turn ambiguous product prompts into functional and non-functional requirements with measurable constraints.
- Estimate traffic, storage, bandwidth, and capacity while making assumptions visible.
- Design API, data, and component boundaries that fit the workload and consistency needs.
- Explain caching, replication, partitioning, queues, and distributed coordination, including their failure modes.
- Design for security, resilience, observability, deployability, and cost rather than treating them as afterthoughts.
- Compare monoliths, modular services, and distributed architectures using operational and organizational constraints.
- Communicate a complete design in a structured interview and defend alternatives without claiming a universal answer.

## Recommended Order

1. **Phase 1: Foundations and Design Method** (Days 01–07)
2. **Phase 2: Core System Building Blocks** (Days 08–14)
3. **Phase 3: Data, Scaling, and Consistency** (Days 15–21)
4. **Phase 4: Distributed Reliability and Security** (Days 22–28)
5. **Phase 5: Architecture and Production Operations** (Days 29–35)
6. **Phase 6: Design Cases and Interview Capstones** (Days 36–42)

---

## Phase 1: Foundations and Design Method

### Day 01: What System Design Is
- **Topics:** System boundaries; users and actors; requirements versus solutions; functional and non-functional requirements; assumptions; constraints; architecture as a set of decisions
- **Lecture:** [Day 01: What System Design Is](system-design-lectures/day-01-system-design-foundations.md)
- **Prerequisites:** Basic programming and familiarity with web applications
- **Backend relevance:** Prevents designing components before understanding user-visible behavior and operating constraints
- **References:** [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- **Exercise:** Convert a vague file-sharing product prompt into a one-page scope with core use cases, exclusions, and measurable quality goals
- **Interview focus:** How do you clarify an open-ended prompt before proposing architecture?

### Day 02: A Repeatable Design Interview Method
- **Topics:** Clarification; scope selection; requirements; rough estimates; API and data; high-level design; bottlenecks; deep dives; trade-off summary; time management
- **Lecture:** [Day 02: A Repeatable Design Interview Method](system-design-lectures/day-02-design-interview-method.md)
- **Prerequisites:** Day 01
- **Backend relevance:** Gives the candidate a reliable sequence for exploring an unfamiliar problem without rushing into technology choices
- **References:** [Google SRE books](https://sre.google/books/)
- **Exercise:** Run a 30-minute design drill and record time spent on requirements, design, failure analysis, and summary
- **Interview focus:** How do you decide which part of the design deserves a deeper discussion?

### Day 03: Functional Requirements, Quality Attributes, and Constraints
- **Topics:** Use cases; latency; throughput; availability; durability; consistency; privacy; security; maintainability; budget; compliance; measurable targets
- **Lecture:** [Day 03: Functional Requirements, Quality Attributes, and Constraints](system-design-lectures/day-03-requirements-and-quality-attributes.md)
- **Prerequisites:** Days 01–02
- **Backend relevance:** Turns broad goals such as "fast" or "highly available" into constraints that influence design choices
- **References:** [Google Cloud Architecture Framework](https://cloud.google.com/architecture/framework)
- **Exercise:** Write measurable quality targets for a notification service and mark hard requirements versus preferences
- **Interview focus:** Which requirements conflict, and how would you resolve the conflict with the interviewer?

### Day 04: Estimation and Back-of-the-Envelope Math
- **Topics:** Requests per second; peak versus average load; read/write ratios; payload size; storage growth; retention; bandwidth; headroom; order-of-magnitude estimates
- **Lecture:** [Day 04: Estimation and Back-of-the-Envelope Math](system-design-lectures/day-04-capacity-estimation.md)
- **Prerequisites:** Day 03; basic arithmetic and units
- **Backend relevance:** Helps identify whether a simple service, database, cache, or network link is likely to be the first constraint
- **References:** [AWS Well-Architected Framework: Performance Efficiency](https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/welcome.html)
- **Exercise:** Estimate daily storage and average/peak requests for a messaging workload; list assumptions and show the calculation
- **Interview focus:** Which assumptions change the design most, and how would you validate them?

### Day 05: Latency, Throughput, and Tail Behavior
- **Topics:** Latency versus throughput; service time; queueing intuition; percentiles; p50/p95/p99; fan-out; concurrency; utilization and saturation
- **Lecture:** [Day 05: Latency, Throughput, and Tail Behavior](system-design-lectures/day-05-latency-throughput-and-queues.md)
- **Prerequisites:** Days 03–04
- **Backend relevance:** Explains why average latency can look healthy while users experience slow requests and why saturated queues amplify delays
- **References:** [Google SRE: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- **Exercise:** Trace a request that calls four dependencies and identify how dependency latency and fan-out affect end-to-end tail latency
- **Interview focus:** Why is p99 latency useful, and what can make it worse as a system grows?

### Day 06: Networking and Request Lifecycle
- **Topics:** DNS; TCP connection setup; TLS; HTTP request/response; connection reuse; proxies; timeouts; request boundaries; network partitions and partial failure
- **Lecture:** [Day 06: Networking and Request Lifecycle](system-design-lectures/day-06-networking-and-request-lifecycle.md)
- **Prerequisites:** Days 01–05; basic HTTP familiarity
- **Backend relevance:** Makes network cost and failure visible in designs that otherwise treat service calls as instantaneous and reliable
- **References:** [HTTP Semantics, RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), [Node.js HTTP documentation](https://nodejs.org/api/http.html)
- **Exercise:** Draw the network hops for a browser request to an API and database; annotate where latency, timeout, or connection failure can occur
- **Interview focus:** What does a timeout tell you, and what does it not tell you about the remote operation?

### Day 07: Architecture Diagrams and Design Artifacts
- **Topics:** System context; containers and components; data-flow arrows; trust boundaries; synchronous versus asynchronous edges; diagram levels; assumptions and open questions
- **Lecture:** [Day 07: Architecture Diagrams and Design Artifacts](system-design-lectures/day-07-diagrams-and-architecture-communication.md)
- **Prerequisites:** Days 01–06
- **Backend relevance:** Makes a design reviewable by separating components, ownership, data flow, and dependencies
- **References:** [C4 model](https://c4model.com/)
- **Exercise:** Diagram a URL-shortening service at context and component levels; label protocols, data stores, and trust boundaries
- **Interview focus:** What belongs on a high-level diagram, and what detail should wait for a deep dive?

---

## Phase 2: Core System Building Blocks

### Day 08: API and Interface Design
- **Topics:** Resource-oriented HTTP APIs; request/response contracts; pagination; validation; versioning; compatibility; error semantics; idempotent operations
- **Lecture:** [Day 08: API and Interface Design](system-design-lectures/day-08-api-and-interface-design.md)
- **Prerequisites:** Day 06
- **Backend relevance:** Stable interfaces let clients and services evolve independently while making retries and errors explicit
- **References:** [HTTP Semantics, RFC 9110](https://www.rfc-editor.org/rfc/rfc9110)
- **Exercise:** Define endpoints and error responses for creating, reading, and revoking a short link; specify pagination if listing is in scope
- **Interview focus:** How would you evolve an API without breaking existing clients?

### Day 09: Data Modeling and Storage Choices
- **Topics:** Entities and access patterns; relational versus document models; normalization and denormalization; constraints; ownership; data lifecycle; workload fit
- **Lecture:** [Day 09: Data Modeling and Storage Choices](system-design-lectures/day-09-data-modeling-and-storage-choices.md)
- **Prerequisites:** Days 03 and 08
- **Backend relevance:** Storage decisions shape correctness, query cost, transaction boundaries, and future migration complexity
- **References:** [PostgreSQL documentation](https://www.postgresql.org/docs/), [MongoDB data modeling](https://www.mongodb.com/docs/manual/data-modeling/)
- **Exercise:** Model users, links, and click events for a link service; document expected reads, writes, and integrity constraints
- **Interview focus:** When would you normalize, denormalize, or choose a different storage model?

### Day 10: Indexes, Query Patterns, and Data Access
- **Topics:** B-tree index intuition; selectivity; compound indexes; query shape; write amplification; hot keys; query plans; bounded result sets
- **Lecture:** [Day 10: Indexes, Query Patterns, and Data Access](system-design-lectures/day-10-indexes-and-query-patterns.md)
- **Prerequisites:** Day 09
- **Backend relevance:** Connects API access patterns to data-store performance and avoids treating indexes as free improvements
- **References:** [PostgreSQL: Indexes](https://www.postgresql.org/docs/current/indexes.html), [MongoDB: Indexes](https://www.mongodb.com/docs/manual/indexes/)
- **Exercise:** Propose indexes for three known queries and explain write, storage, and query trade-offs
- **Interview focus:** How do indexes help, and when can adding an index make the system worse?

### Day 11: Caching Fundamentals
- **Topics:** Cache-aside; read-through and write-through concepts; TTL; invalidation; stale data; cache keys; hit ratio; cache stampede; bounded caching
- **Lecture:** [Day 11: Caching Fundamentals](system-design-lectures/day-11-caching-fundamentals.md)
- **Prerequisites:** Days 05 and 09
- **Backend relevance:** Improves repeated-read latency and database load when freshness and invalidation rules are explicit
- **References:** [Redis documentation](https://redis.io/docs/latest/)
- **Exercise:** Add a cache to a read-heavy product catalog design; define key format, expiration, invalidation, and behavior during cache failure
- **Interview focus:** What consistency does the cache provide, and how do you prevent stale or overloaded behavior?

### Day 12: Load Balancing and Stateless Services
- **Topics:** Reverse proxies; health checks; layer 4 versus layer 7 concepts; stateless request handling; session placement; sticky sessions; load distribution; draining
- **Lecture:** [Day 12: Load Balancing and Stateless Services](system-design-lectures/day-12-load-balancing-and-stateless-services.md)
- **Prerequisites:** Days 06–07
- **Backend relevance:** Explains how services receive traffic and why shared or externalized state makes horizontal scaling easier
- **References:** [AWS Well-Architected Framework: Reliability](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html)
- **Exercise:** Sketch traffic flow through a load balancer to multiple API instances, including health checks and safe instance removal
- **Interview focus:** What breaks when a supposedly stateless service keeps user state in local memory?

### Day 13: Asynchronous Processing and Message Queues
- **Topics:** Queues versus logs; producers and consumers; buffering; consumer groups; delivery attempts; acknowledgments; dead-letter handling; backpressure
- **Lecture:** [Day 13: Asynchronous Processing and Message Queues](system-design-lectures/day-13-queues-and-asynchronous-processing.md)
- **Prerequisites:** Days 05, 08, and 09
- **Backend relevance:** Separates slow or bursty work from request paths while introducing delivery, ordering, and backlog concerns
- **References:** [Apache Kafka documentation](https://kafka.apache.org/documentation/), [AWS Well-Architected Framework: Reliability](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html)
- **Exercise:** Redesign email delivery to run asynchronously; define the API response, persisted state, and failed-job inspection path
- **Interview focus:** What delivery guarantee do you need, and how will consumers handle duplicate messages?

### Day 14: Object Storage, CDN, and Content Delivery
- **Topics:** Object storage; metadata versus blobs; signed access; content delivery networks; edge caching; cache-control; upload/download paths; large-file transfer
- **Lecture:** [Day 14: Object Storage, CDN, and Content Delivery](system-design-lectures/day-14-object-storage-and-content-delivery.md)
- **Prerequisites:** Days 06, 08, and 11
- **Backend relevance:** Keeps large binary content out of application databases and reduces repeated long-distance transfer
- **References:** [AWS Well-Architected Framework: Performance Efficiency](https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/welcome.html), [HTTP Caching, RFC 9111](https://www.rfc-editor.org/rfc/rfc9111)
- **Exercise:** Design an image upload and delivery flow using object storage and a CDN; identify authorization and cache invalidation boundaries
- **Interview focus:** Which data belongs in object storage, and how do you prevent unauthorized or stale content delivery?

---

## Phase 3: Data, Scaling, and Consistency

### Day 15: Replication and Read Scaling
- **Topics:** Primary/replica; synchronous and asynchronous replication; replication lag; read routing; failover; stale reads; replica recovery
- **Lecture:** [Day 15: Replication and Read Scaling](system-design-lectures/day-15-replication-and-read-scaling.md)
- **Prerequisites:** Days 09–10
- **Backend relevance:** Adds read capacity and resilience while making freshness and failover behavior explicit
- **References:** [PostgreSQL: High Availability, Load Balancing, and Replication](https://www.postgresql.org/docs/current/high-availability.html)
- **Exercise:** Add replicas to a read-heavy service and label which reads may tolerate lag and which must use the primary
- **Interview focus:** How does replication lag affect read-after-write behavior?

### Day 16: Partitioning and Sharding
- **Topics:** Vertical and horizontal partitioning; shard keys; range and hash strategies; skew; hot partitions; cross-partition queries; resharding
- **Lecture:** [Day 16: Partitioning and Sharding](system-design-lectures/day-16-partitioning-and-sharding.md)
- **Prerequisites:** Days 04, 09, and 10
- **Backend relevance:** Provides a path beyond single-node capacity while adding routing and operational complexity
- **References:** [MongoDB: Sharding](https://www.mongodb.com/docs/manual/sharding/)
- **Exercise:** Choose and defend a partition key for an event store; test the choice against skew, range queries, and growth
- **Interview focus:** What makes a shard key poor, and how would you recognize a hot partition?

### Day 17: Transactions and Data Integrity
- **Topics:** Atomicity; constraints; transaction scope; isolation; optimistic concurrency; locking; transaction cost; invariants across records
- **Lecture:** [Day 17: Transactions and Data Integrity](system-design-lectures/day-17-transactions-and-data-integrity.md)
- **Prerequisites:** Day 09
- **Backend relevance:** Preserves domain rules under concurrent writes and clarifies when a distributed workflow cannot use one database transaction
- **References:** [PostgreSQL: Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html), [PostgreSQL: Concurrency Control](https://www.postgresql.org/docs/current/mvcc.html)
- **Exercise:** Define the integrity invariant for transferring funds between two accounts and identify the transaction boundary
- **Interview focus:** Which invariant requires atomicity, and what are the costs or limits of a broader transaction?

### Day 18: Consistency Models and CAP Trade-offs
- **Topics:** Linearizability; strong and eventual consistency; read-your-writes; monotonic reads; quorum intuition; partitions; CAP theorem scope and limits
- **Lecture:** [Day 18: Consistency Models and CAP Trade-offs](system-design-lectures/day-18-consistency-models-and-cap.md)
- **Prerequisites:** Days 15 and 17
- **Backend relevance:** Maps user-visible freshness requirements to data placement and failure behavior without reducing CAP to a simplistic slogan
- **References:** [Jepsen: Consistency Models](https://jepsen.io/consistency), [PostgreSQL: Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- **Exercise:** Compare consistency requirements for a bank balance, social feed, and view counter during a network partition
- **Interview focus:** What does CAP say under a partition, and what design choice remains specific to the operation?

### Day 19: Search, Filtering, and Read Models
- **Topics:** Search indexes; inverted-index intuition; filtering and sorting; autocomplete; indexing delay; read models; database versus search engine responsibilities
- **Lecture:** [Day 19: Search, Filtering, and Read Models](system-design-lectures/day-19-search-and-read-models.md)
- **Prerequisites:** Days 09–11 and 13
- **Backend relevance:** Separates transactional source-of-truth data from query-optimized representations when search needs differ
- **References:** [Elasticsearch Guide](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- **Exercise:** Design product search with filters and ranking; define how updates reach the search index and how indexing lag is exposed
- **Interview focus:** Why not treat a search index as the authoritative transactional database?

### Day 20: Data Lifecycle, Retention, and Backups
- **Topics:** Retention; archival; deletion; backup and restore; point-in-time recovery concepts; recovery objectives; replication versus backup; migration planning
- **Lecture:** [Day 20: Data Lifecycle, Backup, and Recovery](system-design-lectures/day-20-data-lifecycle-backup-and-recovery.md)
- **Prerequisites:** Days 09, 15, and 17
- **Backend relevance:** Protects recoverability and cost as data grows and clarifies that replicas alone do not protect against every data-loss event
- **References:** [AWS Well-Architected Framework: Reliability](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html), [PostgreSQL: Backup and Restore](https://www.postgresql.org/docs/current/backup.html)
- **Exercise:** Set draft recovery point and recovery time objectives for a business-critical service; outline how restoration would be tested
- **Interview focus:** What is the difference between availability, durability, backup, and disaster recovery?

### Day 21: Global and Multi-Region Systems
- **Topics:** Region and zone failure domains; latency-based routing; active-passive and active-active patterns; data residency; replication conflict; failover and failback
- **Lecture:** [Day 21: Global and Multi-Region Systems](system-design-lectures/day-21-multi-region-design.md)
- **Prerequisites:** Days 15, 18, and 20
- **Backend relevance:** Extends availability and user proximity while exposing the cost and consistency limits of geo-distributed writes
- **References:** [AWS Well-Architected Framework: Reliability](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html), [Google Cloud Architecture Framework](https://cloud.google.com/architecture/framework)
- **Exercise:** Design regional failover for a read-heavy service and identify how writes, conflicts, and recovery are handled
- **Interview focus:** What user or business need justifies multi-region complexity?

---

## Phase 4: Distributed Reliability and Security

### Day 22: Timeouts, Deadlines, Retries, and Backoff
- **Topics:** Connection and request timeouts; end-to-end deadlines; bounded retries; exponential backoff; jitter; retry budgets; cancellation; retry amplification
- **Lecture:** [Day 22: Timeouts, Deadlines, Retries, and Backoff](system-design-lectures/day-22-timeouts-retries-and-deadlines.md)
- **Prerequisites:** Days 05–06 and 13
- **Backend relevance:** Prevents slow dependencies from consuming all capacity and reduces synchronized retry storms
- **References:** [Google SRE: Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/)
- **Exercise:** Define a deadline and retry policy for a request with two downstream calls; explain which calls are safe to retry
- **Interview focus:** Why can retries increase an outage, and how do deadlines constrain them?

### Day 23: Idempotency, Deduplication, and Exactly-Once Claims
- **Topics:** Idempotent API operations; idempotency keys; deduplication windows; at-least-once delivery; transactional outbox; exactly-once limits and scoped guarantees
- **Lecture:** [Day 23: Idempotency, Deduplication, and Exactly-Once Claims](system-design-lectures/day-23-idempotency-and-message-delivery.md)
- **Prerequisites:** Days 08, 13, 17, and 22
- **Backend relevance:** Protects user actions and event consumers from duplicate effects caused by retries, redelivery, or uncertain outcomes
- **References:** [Apache Kafka documentation](https://kafka.apache.org/documentation/), [HTTP Semantics, RFC 9110](https://www.rfc-editor.org/rfc/rfc9110)
- **Exercise:** Design a payment-request idempotency record, including key scope, retention, concurrent requests, and replay response
- **Interview focus:** What does "exactly once" mean in a specific workflow, and where must deduplication happen?

### Day 24: Ordering, Coordination, and Distributed Locks
- **Topics:** Per-key ordering; clocks and timestamps; leases; lock expiry; fencing tokens; split-brain risk; coordination costs; avoiding global ordering where possible
- **Lecture:** [Day 24: Ordering, Coordination, and Distributed Locks](system-design-lectures/day-24-ordering-and-coordination.md)
- **Prerequisites:** Days 13, 16, and 18
- **Backend relevance:** Clarifies when concurrent workers can safely operate independently and where coordination becomes a correctness boundary
- **References:** [Apache Kafka documentation](https://kafka.apache.org/documentation/), [Google SRE: Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/)
- **Exercise:** Define ordering needs for account events and explain a partition key that preserves per-account order without requiring global order
- **Interview focus:** Why is a distributed lock not simply a mutex that works across machines?

### Day 25: Circuit Breakers, Bulkheads, and Load Shedding
- **Topics:** Failure detection; open/half-open/closed states; dependency isolation; concurrency limits; admission control; graceful degradation; load shedding
- **Lecture:** [Day 25: Circuit Breakers, Bulkheads, and Load Shedding](system-design-lectures/day-25-resilience-patterns.md)
- **Prerequisites:** Days 05, 12, and 22
- **Backend relevance:** Limits the spread of dependency failures and protects critical work during overload
- **References:** [Google SRE: Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/)
- **Exercise:** Protect a checkout flow from a failing recommendation service; decide what to shed and what must still succeed
- **Interview focus:** How do you distinguish a useful circuit breaker from a mechanism that hides a persistent failure?

### Day 26: Sagas and Distributed Workflows
- **Topics:** Workflow orchestration; choreography; steps and compensations; durable state; timeout and retry semantics; partial completion; reconciliation
- **Lecture:** [Day 26: Sagas and Distributed Workflows](system-design-lectures/day-26-sagas-and-workflows.md)
- **Prerequisites:** Days 13, 17, 22, and 23
- **Backend relevance:** Handles multi-service business processes without pretending a single ACID transaction spans independent systems
- **References:** [AWS Prescriptive Guidance: Saga pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga.html)
- **Exercise:** Model order placement across inventory, payment, and shipping; show failure points and compensating or reconciliation actions
- **Interview focus:** What does compensation mean, and why is it not always a true rollback?

### Day 27: Observability and Incident Diagnosis
- **Topics:** Logs; metrics; traces; correlation identifiers; RED and USE signals; dashboards; alert quality; sampling; cardinality; incident response
- **Lecture:** [Day 27: Observability and Incident Diagnosis](system-design-lectures/day-27-observability-and-diagnosis.md)
- **Prerequisites:** Days 05–06 and 12
- **Backend relevance:** Makes production behavior diagnosable across request and asynchronous boundaries
- **References:** [Google SRE: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/), [OpenTelemetry documentation](https://opentelemetry.io/docs/)
- **Exercise:** Propose service-level dashboards and an alert for rising request latency; identify a trace path through an async job
- **Interview focus:** Which signals help distinguish user impact, saturation, and a single failing dependency?

### Day 28: Security and Abuse Resistance
- **Topics:** Authentication and authorization boundaries; least privilege; secrets; encryption in transit and at rest; input limits; rate limits; abuse controls; auditability; threat modeling
- **Lecture:** [Day 28: Security and Abuse Resistance](system-design-lectures/day-28-security-and-threat-modeling.md)
- **Prerequisites:** Days 03, 06, 08, and 12
- **Backend relevance:** Builds security and abuse controls into system boundaries, data flows, and operational design
- **References:** [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/), [OWASP API Security Project](https://owasp.org/www-project-api-security/)
- **Exercise:** Threat-model a file-sharing API; identify assets, trust boundaries, likely threats, and one mitigation per high-risk path
- **Interview focus:** How do you apply rate limiting when requests can arrive through multiple service instances?

---

## Phase 5: Architecture and Production Operations

### Day 29: Monoliths, Modular Monoliths, and Microservices
- **Topics:** Deployment and data boundaries; module ownership; service autonomy; network cost; distributed transactions; team topology; migration triggers
- **Lecture:** [Day 29: Monoliths, Modular Monoliths, and Microservices](system-design-lectures/day-29-monoliths-and-service-boundaries.md)
- **Prerequisites:** Days 07, 17, and 26
- **Backend relevance:** Helps select architecture based on change, scale, reliability, and team needs instead of defaulting to microservices
- **References:** [Martin Fowler: Monolith First](https://martinfowler.com/bliki/MonolithFirst.html), [Google Cloud Architecture Framework](https://cloud.google.com/architecture/framework)
- **Exercise:** Propose service boundaries for a growing commerce application and name evidence that would justify extracting one module
- **Interview focus:** What problems do microservices add, and when are those costs justified?

### Day 30: Service Discovery, Gateways, and Internal Communication
- **Topics:** Service naming and discovery; API gateways; synchronous RPC; asynchronous messaging; schema contracts; retries; dependency graphs
- **Lecture:** [Day 30: Service Discovery, Gateways, and Internal Communication](system-design-lectures/day-30-service-communication-and-discovery.md)
- **Prerequisites:** Days 06, 08, 12, and 13
- **Backend relevance:** Defines how independently deployed components find and communicate with each other
- **References:** [Google Cloud Architecture Framework](https://cloud.google.com/architecture/framework), [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- **Exercise:** Draw communication paths for a public API and three internal services; identify contract and failure boundaries
- **Interview focus:** When should a workflow use a synchronous call versus an asynchronous event?

### Day 31: Configuration, Feature Flags, and Schema Evolution
- **Topics:** Runtime configuration; secret separation; feature rollout; backward-compatible changes; expand-and-contract migrations; API and event schema evolution
- **Lecture:** [Day 31: Configuration, Feature Flags, and Schema Evolution](system-design-lectures/day-31-configuration-and-evolution.md)
- **Prerequisites:** Days 08–10 and 29–30
- **Backend relevance:** Allows systems and data contracts to change safely while old and new versions may run at the same time
- **References:** [OpenAPI Specification](https://spec.openapis.org/oas/latest.html), [AWS Well-Architected Framework: Operational Excellence](https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/welcome.html)
- **Exercise:** Plan a non-breaking database column migration while two application versions are live
- **Interview focus:** How do you deploy a schema change without requiring every service to update at once?

### Day 32: Deployment, Containers, and Orchestration Concepts
- **Topics:** Build and release; immutable artifacts; containers; health probes; rolling and canary deployment; autoscaling; resource requests and limits; rollback
- **Lecture:** [Day 32: Deployment, Containers, and Orchestration Concepts](system-design-lectures/day-32-deployment-and-orchestration.md)
- **Prerequisites:** Days 12 and 29–31
- **Backend relevance:** Connects architecture to how software is started, scaled, monitored, and safely replaced
- **References:** [Kubernetes documentation](https://kubernetes.io/docs/home/), [AWS Well-Architected Framework: Operational Excellence](https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/welcome.html)
- **Exercise:** Outline a deployment plan for a stateless API and a stateful database migration, including health checks and rollback boundaries
- **Interview focus:** Why does rollback become harder after a change has modified persistent data?

### Day 33: SLOs, SLIs, Error Budgets, and Reliability
- **Topics:** Service-level indicators; objectives; agreements; user journeys; availability windows; error budgets; burn rates; reliability versus feature delivery
- **Lecture:** [Day 33: SLOs, SLIs, Error Budgets, and Reliability](system-design-lectures/day-33-slos-and-error-budgets.md)
- **Prerequisites:** Days 03, 05, and 27
- **Backend relevance:** Connects reliability goals and alerting to user outcomes and makes operational trade-offs explicit
- **References:** [Google SRE: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- **Exercise:** Define an SLI and draft an SLO for a read API; state what the metric excludes and how an error budget would guide release risk
- **Interview focus:** How is an SLO different from an uptime claim, and how should it affect engineering decisions?

### Day 34: Capacity Planning, Autoscaling, and Cost
- **Topics:** Resource utilization; bottleneck analysis; vertical and horizontal scaling; scaling signals; warm-up; limits; cost drivers; capacity headroom
- **Lecture:** [Day 34: Capacity Planning, Autoscaling, and Cost](system-design-lectures/day-34-capacity-cost-and-autoscaling.md)
- **Prerequisites:** Days 04–05, 12, and 27
- **Backend relevance:** Balances performance and resilience with predictable operating costs
- **References:** [AWS Well-Architected Framework: Cost Optimization](https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html), [Google Cloud Architecture Framework](https://cloud.google.com/architecture/framework)
- **Exercise:** Identify the likely bottleneck in a read-heavy API and propose a scaling signal, load test, and cost guardrail
- **Interview focus:** What metric should trigger scaling, and what failure could make that metric misleading?

### Day 35: Disaster Recovery and Operational Readiness
- **Topics:** Failure domains; recovery objectives; runbooks; restore drills; dependency inventory; graceful degradation; failover testing; readiness review
- **Lecture:** [Day 35: Disaster Recovery and Operational Readiness](system-design-lectures/day-35-disaster-recovery-and-readiness.md)
- **Prerequisites:** Days 20–21, 27, and 33
- **Backend relevance:** Ensures recovery and incident response are designed and tested rather than assumed from the presence of replicas
- **References:** [Google SRE: Managing Critical State](https://sre.google/sre-book/managing-critical-state/), [AWS Well-Architected Framework: Reliability](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html)
- **Exercise:** Create a short readiness checklist and recovery drill for a service that depends on a database, cache, and queue
- **Interview focus:** What evidence would demonstrate that a recovery plan works?

---

## Phase 6: Design Cases and Interview Capstones

### Day 36: Design a URL Shortener
- **Topics:** Identifier generation; redirect path; metadata; expiration; abuse prevention; caching; analytics scope; read/write estimation
- **Lecture:** [Day 36: Case Study - URL Shortener](system-design-lectures/day-36-case-study-url-shortener.md)
- **Prerequisites:** Days 01–18
- **Backend relevance:** Integrates API, data modeling, caching, scale, and hot-key reasoning in a compact design
- **References:** [HTTP Semantics, RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), [Redis documentation](https://redis.io/docs/latest/)
- **Exercise:** Complete a 35-minute design with requirements, estimates, data model, redirect flow, failure handling, and two trade-offs
- **Interview focus:** How do identifier choice, popular links, and analytical writes change the design?

### Day 37: Design a Rate Limiter
- **Topics:** Fixed and sliding windows; token and leaky buckets; local versus distributed state; key design; consistency; fairness; fail-open versus fail-closed
- **Lecture:** [Day 37: Case Study - Rate Limiter](system-design-lectures/day-37-case-study-rate-limiter.md)
- **Prerequisites:** Days 11–12, 16, and 18
- **Backend relevance:** Applies shared state, traffic control, latency budgets, and abuse-resistance decisions
- **References:** [OWASP API Security Project](https://owasp.org/www-project-api-security/), [Redis documentation](https://redis.io/docs/latest/)
- **Exercise:** Design per-user and per-IP limits across several API instances; state behavior when the limiter store is unavailable
- **Interview focus:** Which algorithm fits the product requirement, and what consistency does enforcement need?

### Day 38: Design a Notification Service
- **Topics:** Preferences; fan-out; queues; provider adapters; retries; deduplication; delivery status; prioritization; provider outages
- **Lecture:** [Day 38: Case Study - Notification Service](system-design-lectures/day-38-case-study-notification-service.md)
- **Prerequisites:** Days 13, 22–27
- **Backend relevance:** Combines event-driven processing, external dependencies, reliability, and observability
- **References:** [Apache Kafka documentation](https://kafka.apache.org/documentation/), [Google SRE books](https://sre.google/books/)
- **Exercise:** Design delivery for email and push notifications with user preferences, provider failure, and duplicate-event handling
- **Interview focus:** How do you balance delivery guarantees, ordering, latency, and provider rate limits?

### Day 39: Design a Social Feed
- **Topics:** Fan-out-on-write and fan-out-on-read; feed storage; pagination; ranking boundaries; hot users; cache strategy; freshness
- **Lecture:** [Day 39: Case Study - Social Feed](system-design-lectures/day-39-case-study-social-feed.md)
- **Prerequisites:** Days 09–16, 18, and 19
- **Backend relevance:** Exercises workload trade-offs where a single access strategy performs poorly for some user distributions
- **References:** [AWS Well-Architected Framework: Performance Efficiency](https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/welcome.html)
- **Exercise:** Compare feed generation approaches for ordinary and high-follower accounts; specify pagination and stale-data behavior
- **Interview focus:** What workload distribution would make you choose hybrid fan-out?

### Day 40: Design a Chat or Real-Time Messaging System
- **Topics:** Persistent connections; message delivery; ordering scope; online presence; offline queues; history; fan-out; reconnect and synchronization
- **Lecture:** [Day 40: Case Study - Messaging](system-design-lectures/day-40-case-study-messaging.md)
- **Prerequisites:** Days 06, 13, 15, 18, and 24
- **Backend relevance:** Combines long-lived connections, durable data, asynchronous delivery, and per-conversation consistency
- **References:** [Node.js HTTP documentation](https://nodejs.org/api/http.html), [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- **Exercise:** Trace a message from sender through persistence to an online and offline recipient; cover reconnect without duplicate display
- **Interview focus:** What ordering and delivery guarantees are necessary per conversation, and how are they maintained?

### Day 41: Design a File Storage and Sharing Service
- **Topics:** Upload and download; metadata; object storage; multipart transfer; access control; signed access; versioning; scanning; lifecycle and deletion
- **Lecture:** [Day 41: Case Study - File Storage and Sharing](system-design-lectures/day-41-case-study-file-storage.md)
- **Prerequisites:** Days 08–14, 20, and 28
- **Backend relevance:** Brings together large-object handling, metadata consistency, security, and retention policies
- **References:** [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/), [HTTP Caching, RFC 9111](https://www.rfc-editor.org/rfc/rfc9111)
- **Exercise:** Design a secure upload, scan, publish, share, and delete lifecycle; mark trust boundaries and cleanup behavior
- **Interview focus:** How do you prevent metadata and object contents from diverging during failed uploads or deletion?

### Day 42: Advanced Capstone and Interview Review
- **Topics:** Full design loop; explicit assumptions; capacity model; APIs and data; architecture; failure analysis; security; SLOs; alternatives; concise defense
- **Lecture:** [Day 42: Capstone and Interview Review](system-design-lectures/day-42-capstone-and-interview-review.md)
- **Prerequisites:** Days 01–41
- **Backend relevance:** Demonstrates whether the learner can connect product needs to a coherent, operable design under interview time constraints
- **References:** [Google SRE books](https://sre.google/books/), [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- **Exercise:** Complete a 45-minute design of a ticket booking or order-processing system, then write a one-page review of assumptions, risks, and next validation steps
- **Interview focus:** Can you explain the simplest viable design, its bottleneck, its failure behavior, and the evidence that would change your choices?

---

## Progress Checkpoints

- **After Day 07:** Clarify a prompt, define quality goals, estimate a workload, and communicate a legible high-level design.
- **After Day 14:** Explain how APIs, storage, caches, load balancers, queues, and object storage fit a basic backend system.
- **After Day 21:** Defend data, replication, partitioning, consistency, and recovery choices against explicit workload assumptions.
- **After Day 28:** Trace failures across distributed components and propose bounded retries, idempotency, isolation, observability, and security controls.
- **After Day 35:** Connect architecture choices to deployment, SLOs, capacity, cost, and tested recovery operations.
- **After Day 42:** Lead a timed design discussion from requirements through trade-offs and operational risks without relying on a memorized diagram.

## Final Review Checklist

- State assumptions and distinguish requirements from implementation choices.
- Estimate load and identify the dominant read, write, storage, or latency constraint.
- Define APIs, data ownership, and the source of truth.
- Trace one normal request and at least two meaningful failure paths.
- Explain consistency, retry, timeout, and duplicate-effect behavior where they matter.
- Include security, observability, deployment, recovery, and cost in the design.
- Compare a credible alternative and explain what evidence would make you choose it.
- Summarize the design clearly, including its current bottleneck and next validation step.
