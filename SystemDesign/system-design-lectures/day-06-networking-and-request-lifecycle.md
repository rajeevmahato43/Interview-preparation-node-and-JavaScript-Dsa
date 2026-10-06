# Day 06: Networking and Request Lifecycle

<nav aria-label="Lecture navigation"><a href="../system-design-roadmap.md">Roadmap</a> · Previous: <a href="day-05-latency-throughput-and-queues.md">Day 05</a> · Next: <a href="day-07-diagrams-and-architecture-communication.md">Day 07</a></nav>

## What You Will Learn Today

By the end of this lesson, you can:

- Trace a browser request through DNS, connection setup, TLS, HTTP, proxies, an application, and a database.
- Explain what connection reuse saves and which costs remain.
- Distinguish a timeout from proof that a remote operation did not happen.
- Identify partial-failure boundaries and make network assumptions visible in a design.

## Prerequisites

- [Day 01: What System Design Is](day-01-system-design-foundations.md)
- [Day 02: A Repeatable Design Interview Method](day-02-design-interview-method.md)
- [Day 03: Functional Requirements, Quality Attributes, and Constraints](day-03-requirements-and-quality-attributes.md)
- [Day 04: Estimation and Back-of-the-Envelope Math](day-04-capacity-estimation.md)
- [Day 05: Latency, Throughput, and Tail Behavior](day-05-latency-throughput-and-queues.md)
- Basic HTTP familiarity.

## Quick Vocabulary Card

- **DNS:** A naming system used to find address information for a host name.
- **TCP connection:** A transport connection that provides ordered, reliable byte-stream delivery while it remains established.
- **TLS:** A protocol layer used to authenticate peers and protect traffic in transit when correctly configured.
- **HTTP:** An application protocol for request and response semantics; HTTP/1.1 and HTTP/2 commonly run over TCP, while HTTP/3 uses QUIC over UDP.
- **Proxy:** An intermediary that forwards or handles requests between endpoints.
- **Timeout:** A local limit on how long a caller waits for some phase or operation.
- **Partial failure:** A situation where some components or communication paths work while others fail or their outcomes are unknown.

## Core Concepts

A service call crosses process and network boundaries with setup costs, queues, limits, and failure modes. Its path depends on protocol version, connection state, proxies, and deployment. The [HTTP Semantics specification, RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) defines HTTP semantics; the [Node.js HTTP documentation](https://nodejs.org/api/http.html) describes Node's APIs.

### Trace one browser request

For a browser opening `https://api.example.test/items/42`, a simplified cold-connection path is:

1. The client resolves the host name through its configured resolver. Results may be cached at several layers, so a lookup is not necessarily performed for every request.
2. It establishes transport connectivity to an address. For TCP-based HTTP, this normally includes a TCP handshake. HTTP/3 has different connection setup because it uses QUIC.
3. For HTTPS, TLS negotiation establishes encryption and authenticates the server according to certificate and client policy.
4. The client sends an HTTP request. A CDN, gateway, or reverse proxy may terminate or forward the connection and apply routing, limits, or authentication checks.
5. An application instance validates and authorizes the operation, then may call a database or another service over additional connections.
6. The response travels back through the relevant intermediaries to the client, which interprets the status and body.

This is a conceptual trace, not a promise that every hop creates a new connection. Existing connections may be reused; a proxy can terminate one connection and create another; a database call can use a pool.

### Reuse removes setup, not distance

Keeping a connection open can avoid repeating DNS lookup, TCP setup, and TLS negotiation for later requests, depending on cache and protocol state. It does not eliminate propagation delay, server queues, packet loss recovery, congestion, or the work of processing each request. Connection pools improve reuse and bound concurrent connections, but a pool that is too small can queue callers and one that is too large can overload a dependency.

Network distance also matters. A request crossing regions or traversing several proxies pays for more than application computation. The right model includes both the number of round trips on the critical path and the conditions of those links; avoid assigning universal millisecond costs without a measured environment.

### Timeouts bound waiting but leave outcome uncertainty

A caller timeout means the caller stopped waiting at its configured boundary. It does not prove the remote service stopped work or failed to commit. The request might not have arrived; it might be executing; it may have completed and its response was lost; or the response may simply have arrived after the deadline.

This matters especially for writes. If a client times out creating an order and retries, the first operation may already have committed. The system needs a deliberate retry and deduplication policy; a timeout alone cannot make a non-idempotent operation safe to repeat. Distinguish connection-establishment, request, idle, and end-to-end deadlines where the platform exposes them, and propagate an overall budget so nested calls do not wait longer than the user request permits.

### Expect partial failure

Networks can delay, drop, or partition communication. A health check from one location does not prove every caller can reach a service. An application process can be healthy while its database path is broken. Design boundaries should state what happens when a dependency is slow, unreachable, or returns an error: fail the request, serve a safe partial response, use a cached value, or enqueue work for later. The behavior depends on correctness and product requirements.

## Common Mistakes and Interview Traps

- Treating a timeout as proof that the server did not perform the operation.
- Counting one “network call” while ignoring DNS, connection reuse, proxy hops, and nested dependency calls.
- Assuming HTTPS removes all security risk; it protects a transport path, not authorization or a compromised endpoint.
- Ignoring connection-pool queues and downstream limits when increasing concurrency.
- Describing DNS, TCP, and TLS as a mandatory sequence for every request even when connections are reused or protocol differs.
- Using a single timeout value for connect, idle, and total request duration without explaining the policy.

## Tricky Points

HTTP semantics do not guarantee application-level success merely because a transport connection worked. A response can be an error, and a dropped response can leave a write's outcome uncertain. Also, “server unavailable” can mean different things to clients in different network locations; failures are often asymmetric.

## Practical Exercise

**Goal:** Draw the network hops for a browser request to an API and database.

**Inputs:** A browser requests an authenticated account page from an API behind a gateway. The API reads account data from a database.

**Constraints:** Mark a cold connection and then show what connection reuse changes. Include TLS termination assumptions and do not assume every hop shares one connection.

**Edge cases:** DNS failure, TLS validation failure, gateway timeout after the API commits, broken API-to-database connection, and a pool with no free connections.

**Acceptance criteria:** Label each hop and protocol family where known; annotate at least four latency or failure points; state what a timeout tells the caller and what remains unknown; propose one safe retry condition and one operation that needs deduplication or status lookup. Do not claim a single universal request path.

## Summary

Requests cross layered protocols and intermediaries, and their exact path depends on protocol and connection state. Reuse avoids some setup work but not network delay or processing. A timeout is a limit on local waiting, not evidence of remote non-execution. Model partial failure, connection pools, and retry safety at each boundary.

## Cheat Sheet

- Request path: naming → transport/security setup as needed → HTTP → intermediaries → application → data/dependencies → response.
- Reused connections reduce setup; they do not remove latency, queues, or failures.
- A timeout means “no result before my deadline,” not “the remote side did nothing.”
- Separate connect, request, idle, and end-to-end timeout concepts where relevant.
- **Common Pitfalls:** assuming every call is cold; assuming one connection across proxies; retrying uncertain writes blindly; ignoring pools; treating TLS as complete application security.

## Interview Questions

1. **[Hard]** Trace a cold HTTPS request from browser to API and name where reuse can remove work. **Expected answer shape:** ordered conceptual path with protocol caveats and intermediary boundaries. **Follow-up:** What changes if the connection is reused?
2. **[Hard]** A client times out while creating a payment. What can it conclude? **Expected answer shape:** explain uncertain remote execution and response loss; propose status lookup or idempotency rather than blind retry. **Follow-up:** What record or key would make retry behavior safe?
3. **[Very Hard]** The API's p99 is high, but application CPU is low. Explain how you would investigate networking and request lifecycle causes. **Expected answer shape:** define timing boundaries, inspect queues/pools, DNS and connection state, proxy spans, downstream timings, errors, and location-specific reachability. **Follow-up:** How can a healthy dependency probe coexist with failed user requests?