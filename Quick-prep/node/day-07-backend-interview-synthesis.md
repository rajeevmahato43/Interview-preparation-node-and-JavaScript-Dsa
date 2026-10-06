# Day 7: Testing, Performance, and Integration

## Verification and performance

**1. Test boundaries**

Unit-test business rules, integration-test database/adapters, and test HTTP contracts; mocks alone do not verify SQL or driver behavior.

**2. Performance diagnosis**

Profile before optimizing; inspect event-loop delay, CPU, memory, pool waits, query latency, and downstream waits.

```js
// Slow response + low CPU? Check pool wait/downstream latency, not only JS CPU.
```

**3. Incident debugging**

Trace one request with correlation data, reproduce with bounded inputs, and distinguish symptom from cause.

[Testing](../../Node/node-lectures/day-39-testing-strategy-across-boundaries.md) | [Performance/debugging](../../Node/node-lectures/day-40-performance-and-debugging-case-studies.md)

## Reliable backend design

**1. End-to-end reliable flow**

State request path, data owner, invariants, transaction boundary, timeout/retry behavior, and user-visible failure result.

**2. Capstone review**

Explain assumptions, database choice, API/security, observability, shutdown, and which trade-off needs real workload data.

[Reliable design](../../Node/node-lectures/day-41-designing-a-reliable-backend-system.md) | [Integration review](../../Node/node-lectures/day-42-senior-integration-review-and-capstone.md)

## Tricky points

1. **Testing**

**1.1 Test boundaries**

Mocking every layer can hide integration errors; retain tests against actual adapters/contracts.

**1.2 Async tests**

Await requests and cleanup, or failures may happen after the test reports success.

2. **Performance**

**2.1 Bottlenecks**

High latency may come from pool saturation or downstream waits, not JavaScript CPU.

**2.2 Optimization**

Measure representative workload and verify the change did not move cost or worsen tail latency.

3. **System integration**

**3.1 Atomicity**

A database transaction cannot atomically include an external payment call.

**3.2 Delivery**

Queues commonly redeliver; consumers need idempotent effects or deduplication.

**3.3 Availability**

State graceful degradation, recovery, and user-visible behavior for each critical dependency failure.