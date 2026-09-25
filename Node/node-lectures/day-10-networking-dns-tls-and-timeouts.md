# Day 10: Networking, DNS, TLS, and Timeouts

<nav aria-label="Lecture navigation">

[Previous: Node HTTP Fundamentals](day-09-node-http-fundamentals.md) | [Roadmap](../node-roadmap.md) | [Next: Worker Threads and Child Processes](day-11-worker-threads-and-child-processes.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Separate DNS, connection, TLS, response, and total request deadlines.
- Explain TCP connection reuse and socket ownership.
- Use abortable outbound requests safely.
- Design retries without creating retry storms.
- Distinguish transient, permanent, and unknown network failures.

## Prerequisites

Read [Day 06: Buffers, Encodings, and Serialization](day-06-buffers-encodings-and-serialization.md), [Day 09: Node HTTP Fundamentals](day-09-node-http-fundamentals.md), and JavaScript Day 19 on cleanup.

## Core Concepts

An outbound request crosses several stages:

```text
DNS lookup -> TCP connect -> TLS handshake -> request write -> response headers -> response body
```

Each stage can fail or wait. One total timeout is useful, but stage-specific evidence makes diagnosis possible.

| Stage | Typical problem |
|---|---|
| DNS | Resolver delay or lookup failure |
| TCP | Refused, unreachable, connect timeout |
| TLS | Certificate, protocol, or handshake failure |
| Headers | Upstream queueing or application delay |
| Body | Slow response or stalled stream |
| Reuse | Pool exhaustion or stale connection |

TCP is a byte stream, not a message protocol. HTTP defines message framing above it. TLS provides encryption and peer authentication when certificate verification is correctly configured; it does not make an application authorized.

### Deadlines and cancellation

A request should have a deadline that is shorter than the caller's deadline when it is one dependency inside a larger operation. Cancel work when the deadline expires:

```js
async function getJson(url, milliseconds) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), milliseconds);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`upstream status ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}
```

The Node version must support the API used. Cancellation is cooperative and should be propagated to downstream streams and work.

### Connection reuse

Keep-alive and connection pools reduce handshake cost, but a pool is a bounded resource. If callers create a new client or socket for every request, connection count and TLS/DNS work can grow rapidly. Reuse a configured client, limit concurrency, and close it during shutdown.

### Retry policy

Retry only when the operation is safe to repeat or has an idempotency key. Use a bounded attempt count, exponential backoff with jitter, a total deadline, and a circuit or load-shedding policy where appropriate.

```text
retryable: timeout, connection reset, selected 5xx
usually not retryable: invalid input, authentication failure, 4xx
unknown: preserve evidence and avoid unlimited retries
```

A retry multiplies load when the dependency is already failing. The caller, service, and queue must coordinate retry ownership.

## Detailed Explanations and Traces

### Timeout layers

A useful request budget is:

```text
caller deadline: 2 s
  DNS/connect/TLS budget: 400 ms
  response-header budget: 800 ms
  body budget: remaining time
  cleanup: bounded and observable
```

Do not set every inner timeout to two seconds. Nested timeouts can outlive the caller and waste resources. Pass a deadline or abort signal through the call graph.

### URL and host validation

Use the `URL` class, allow only expected protocols and hosts, and do not build outbound URLs by concatenating untrusted text. Server-side request forgery risks include user-controlled hosts, private network targets, redirects, and DNS rebinding. Network policy belongs alongside input validation.

### DNS and address families

A hostname can resolve to multiple addresses and address families. Resolution behavior, caching, and connection selection depend on Node and operating-system configuration. Do not diagnose every connection problem as "the server is down"; record hostname, selected address, timing, and error code without logging secrets.

## Node.js, JavaScript, and DSA Connections

- **JavaScript:** `AbortSignal` carries cancellation through promise-based APIs.
- **Node:** `http`, `https`, `net`, `dns`, and `tls` expose different networking layers.
- **DSA:** Backoff and bounded retries are scheduling algorithms; unbounded retry queues create load amplification.

## Common Mistakes and Interview Traps

- Using only a total timeout with no stage timing.
- Retrying non-idempotent writes automatically.
- Creating a new HTTP client per request.
- Disabling TLS verification to "fix" certificates.
- Treating DNS failure, refusal, reset, timeout, and HTTP 500 as the same error.
- Following redirects to unvalidated destinations.
- Forgetting to consume or close an unsuccessful response body.
- Letting nested calls outlive the original request.

## Tricky Points

- A successful TCP connection does not prove the application is healthy.
- A response status is not a transport success or failure by itself; the contract decides.
- A timeout does not prove the upstream did not complete the operation; retries can duplicate side effects.
- Keep-alive sockets can fail after being idle and must be recreated safely.

## Practical Exercise

**Goal:** Wrap an outbound JSON call with a total deadline and bounded retry policy.

**Inputs and outputs:** Return parsed data or a categorized error with attempt and timing metadata.

**Constraints:** Retry only selected transient failures, add jitter, stop at the deadline, and never log credentials.

**Acceptance criteria:** Tests cover timeout, connection failure, 500, 400, success after retry, and cancellation.

## Summary

- Network calls have multiple waiting and failure stages.
- Use deadlines, abort signals, connection reuse, and bounded concurrency.
- Retry only safe operations with backoff and jitter.
- TLS protects transport; it does not replace authorization.
- Record stage timing and error categories for diagnosis.

## Cheat Sheet

| Decision | Rule |
|---|---|
| Timeout | Use a deadline, not an unlimited wait |
| Retry | Safe/idempotent operation, bounded attempts, jitter |
| Client | Reuse configured pools/agents |
| TLS | Verify certificates; do not disable validation casually |
| URL | Parse and allowlist protocol/host |
| Error | Preserve DNS/connect/TLS/HTTP/body distinctions |

## Interview Questions

1. **Definition:** What stages can make an outbound request slow?
   - **Expected answer:** DNS, connect, TLS, request write, headers, body, pool wait, and application processing.
   - **Follow-up:** Which metrics separate them?

2. **Trace [Hard]:** Why can a timed-out write still be processed by the upstream?
   - **Expected answer:** The caller's observation timed out; the remote side may already have received or committed the operation.
   - **Follow-up:** How do idempotency keys help?

3. **Implementation:** Implement a deadline-aware retry wrapper.
   - **Expected answer:** Propagate abort, bound attempts and total time, classify errors, add jitter, and clean timers.
   - **Follow-up:** How do you test timing without flaky sleeps?

4. **Debugging [Hard]:** Latency rises while CPU is low and sockets are near the pool limit.
   - **Expected answer:** Suspect connection/pool wait, DNS, upstream latency, or stalled bodies; inspect per-stage timings.
   - **Follow-up:** What is the risk of increasing the pool without measuring the dependency?

5. **Design [Very Hard]:** Design a reliable payment call over an unreliable network.
   - **Expected answer:** Idempotency, durable request state, deadlines, reconciliation, safe retry ownership, audit evidence, and manual recovery.
   - **Follow-up:** Why is "retry on every error" unsafe?

<nav aria-label="Lecture navigation">

[Previous: Node HTTP Fundamentals](day-09-node-http-fundamentals.md) | [Roadmap](../node-roadmap.md) | [Next: Worker Threads and Child Processes](day-11-worker-threads-and-child-processes.md)

</nav>