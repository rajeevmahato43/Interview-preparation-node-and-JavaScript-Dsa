# Day 1: Foundations, Interview Method, and Capacity Estimation

Quick review of main-course lectures 1–7. Covers the 4-step interview communication framework, functional vs non-functional scoping, back-of-the-envelope estimation math, tail latency percentiles, and networking request lifecycles.

## Requirements, scoping, and the 4-step framework

**1. Functional vs Non-Functional requirements**

Functional requirements specify user-visible capabilities (e.g. "Create shortened link", "Redirect short URL"). Non-functional requirements (NFRs) quantify constraints: availability (99.99%), latency (p99 < 50ms), consistency model, and data retention duration.

**2. The 4-step interview roadmap (45-minute breakdown)**

- *Step 1: Scope & Clarify (5–7 min):* Establish boundaries, scale numbers, read/write ratios, and explicit out-of-scope features.
- *Step 2: High-Level Architecture & APIs (10–12 min):* Define core endpoints, data models, and block diagrams showing end-to-end flow.
- *Step 3: Deep Dive Core Components (15–18 min):* Address bottlenecks, database selection, partitioning keys, and caching policies.
- *Step 4: Resilience & Bottlenecks (5–7 min):* Handle failover, rate limiting, monitoring, and single points of failure (SPOFs).

**3. System boundaries and architectural diagrams (C4 model)**

Clearly separate client tier, edge layer (DNS/CDN), API gateway, stateless microservices, async message queues, and persistent storage engines.

```text
[Client] -> [DNS/CDN] -> [Load Balancer] -> [API Gateway] -> [Stateless App Servers]
                                                                    |          |
                                                            [Cache / Redis]  [DB Primary/Replica]
```

[System design foundations](../../SystemDesign/system-design-lectures/day-01-system-design-foundations.md) | [Design interview method](../../SystemDesign/system-design-lectures/day-02-design-interview-method.md) | [Requirements and quality attributes](../../SystemDesign/system-design-lectures/day-03-requirements-and-quality-attributes.md) | [Diagrams and architecture communication](../../SystemDesign/system-design-lectures/day-07-diagrams-and-architecture-communication.md)

## Capacity estimation, latency, and networking

**1. Back-of-the-envelope calculation formulas**

Convert scale metrics using standard powers of ten approximations: 1 day $\approx 86,400 \text{ s} \approx 10^5 \text{ s}$.

```text
QPS (Queries Per Second) = Total Daily Requests / 86,400 s
Peak QPS                 = Average QPS * Peak Multiplier (typically 2x - 5x)
Storage per Year         = Daily Writes * Average Payload Size * 365 days
Bandwidth In/Out         = QPS * Request/Response Size
```

**2. Latency percentiles and Little's Law**

Average latency conceals slow outlier requests. Monitor p95, p99, and p99.9 percentiles. Little's Law determines concurrent requests in flight: $L = \lambda \times W$ (Concurrency = Arrival Rate $\times$ Average Latency).

```text
Example: 10,000 QPS with 200ms (0.2s) average response time
In-flight concurrent connections = 10,000 * 0.2 = 2,000 connections
```

**3. Networking protocols and request lifecycle**

- *DNS:* Resolves domain name to IP; Anycast routes traffic to closest geographic point of presence.
- *TCP / TLS 1.3:* Handshake establishes encrypted channel (1 RTT in TLS 1.3 vs 2 RTT in TLS 1.2).
- *HTTP/1.1 vs HTTP/2 vs HTTP/3:* HTTP/1.1 suffers head-of-line blocking; HTTP/2 introduces binary multiplexing over single TCP connection; HTTP/3 uses QUIC (UDP) to eliminate TCP HOL blocking on packet loss.
- *WebSockets:* Full-duplex persistent bidirectional TCP connection for real-time streaming.

[Capacity estimation](../../SystemDesign/system-design-lectures/day-04-capacity-estimation.md) | [Latency and queues](../../SystemDesign/system-design-lectures/day-05-latency-throughput-and-queues.md) | [Networking and request lifecycle](../../SystemDesign/system-design-lectures/day-06-networking-and-request-lifecycle.md)

## Tricky points

1. **Scoping and communication**
   **1.1 Premature technology picking:** Choosing Kafka or Cassandra in the first 2 minutes before establishing write volume or data relations flags shallow engineering judgment.
   **1.2 Unvalidated assumptions:** Never guess user traffic without verifying; say "Assuming 10M DAU with 10 reads per user per day, is this in line with your expectations?".

2. **Estimation traps**
   **2.1 Peak multiplier omission:** Provisioning hardware strictly for average daily QPS causes service outages during diurnal traffic spikes; always factor 2x to 5x peak multiplier.
   **2.2 Secondary index storage:** Raw data storage is not total disk usage; add 20–50% overhead for B-tree indexes, replication copies (typically 3x), and database write-ahead logs (WAL).
   **2.3 Tail latency amplification:** In fan-out microservice architectures, querying 50 backends in parallel means the client's p99 latency approaches the 99th percentile of the slowest single backend: $P(\text{all fast}) = 0.99^{50} \approx 60.5\%$.