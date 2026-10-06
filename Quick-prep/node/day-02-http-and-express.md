# Day 2: Events, Streams, HTTP, and Networking

## Events and timers

**1. EventEmitter**

`emit()` calls listeners synchronously; remove listeners when finished and handle the special `error` event.

```js
emitter.once("done", cleanup); // listener runs during emit("done")
```

**2. Timers and resource ownership**

Timers schedule callbacks; `ref()`/`unref()` control whether a timer keeps the process alive. [Full topic](../../Node/node-lectures/day-07-events-timers-and-resource-ownership.md)

## Streams and HTTP

**1. Stream types**

Readable supplies chunks; Writable consumes them; Duplex does both; Transform changes data as it passes.

**2. Backpressure and pipeline**

When `write()` returns `false`, pause until `drain`; `pipeline()` coordinates errors and teardown.

```js
if (!writable.write(chunk)) await once(writable, "drain");
```

**3. HTTP server**

Incoming requests are readable streams; responses are writable streams. Headers/status/body and socket lifetime form the contract.

```js
response.writeHead(200, { "content-type": "text/plain" });
response.end("ok");
```

[Streams](../../Node/node-lectures/day-08-streams-and-backpressure.md) | [HTTP](../../Node/node-lectures/day-09-node-http-fundamentals.md)

## Networking and parallel work

**1. Networking and timeouts**

DNS, TCP, TLS, and connection reuse each add latency/failure boundaries; set bounded timeouts and use cancellation where supported.

**2. Workers and child processes**

Workers suit CPU-heavy JavaScript; child processes offer stronger isolation with IPC and lifecycle costs.

**3. Diagnostics and shutdown**

Test behavior, measure event-loop delay/memory, and drain work before closing resources.

[Networking](../../Node/node-lectures/day-10-networking-dns-tls-and-timeouts.md) | [Workers](../../Node/node-lectures/day-11-worker-threads-and-child-processes.md) | [Diagnostics](../../Node/node-lectures/day-12-testing-diagnostics-observability-and-shutdown.md)

## Tricky points

1. **Events and streams**

**1.1 Emitter timing**

`emit()` invokes listeners synchronously; do not assume it queues them.

**1.2 Backpressure**

Ignoring `write() === false` can grow memory without bound.

**1.3 Errors**

`pipe()` alone does not provide all `pipeline()` teardown/error guarantees.

2. **Networking and workers**

**2.1 Timers**

`setTimeout(fn, 0)` is not immediate and is not an exact deadline.

**2.2 Timeout outcome**

A client timeout does not prove the remote operation did not complete.

**2.3 Worker choice**

Spinning one worker per request can cost more than a bounded reusable pool; measure and cap concurrency.

3. **Process lifecycle**

**3.1 Shutdown**

Stop accepting new work before closing pools and sockets.

**3.2 Metrics**

A healthy average can hide poor p95/p99 latency or event-loop stalls.