# Day 07: Events, Timers, and Resource Ownership

<nav aria-label="Lecture navigation">

[Previous: Buffers, Encodings, and Serialization](day-06-buffers-encodings-and-serialization.md) | [Roadmap](../node-roadmap.md) | [Next: Streams and Backpressure](day-08-streams-and-backpressure.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain how `EventEmitter` delivers events and errors.
- Design listener contracts with clear ownership and cleanup.
- Cancel timers and subscriptions without leaks.
- Distinguish events from promises and callbacks.
- Diagnose duplicate listeners, missed errors, and shutdown races.

## Prerequisites

Read [Day 02: Event Loop and Scheduling](day-02-event-loop-and-scheduling.md), [Day 04: Process, Configuration, and Lifecycle](day-04-process-configuration-and-lifecycle.md), and JavaScript Day 08 on closures and `this`.

## Core Concepts

### EventEmitter contract

`EventEmitter` is a Node API for synchronous event delivery. `emit(name, value)` calls registered listeners for that event in registration order. A listener runs on the current JavaScript stack; emitting an event does not create a background task.

```js
const { EventEmitter } = require("node:events");

const service = new EventEmitter();
service.on("ready", (name) => console.log(`${name} is ready`));
service.emit("ready", "worker");
```

Expected output: `worker is ready`.

Use events for repeated notifications or many observers. Use a promise for one eventual result. Use a callback when an API has one completion path.

### The special `error` event

If an emitter emits `error` without an `error` listener, Node throws and the process may terminate. Treat this as a process-safety rule:

```js
service.on("error", (error) => {
  console.error("service failed", error);
});
```

An error listener does not automatically make the service healthy. It must record the failure, reject affected work, or trigger a controlled shutdown according to the resource contract.

### Listener ownership

Every subscription needs an owner and a removal path:

| Resource | Start action | Stop action |
|---|---|---|
| Event listener | `on` / `once` | `off` / `removeListener` |
| Timeout | `setTimeout` | `clearTimeout` |
| Interval | `setInterval` | `clearInterval` |
| Abort subscription | `signal.addEventListener` | remove listener or abort owner |
| Socket/stream | connect/open | close/destroy |

A common leak is registering a listener inside a request handler on a process-wide emitter. The listener survives the request unless it is removed.

### `on`, `once`, and listener identity

`once` removes itself after its first call. `off` needs the same function reference used by `on`:

```js
function handleUpdate(update) {
  console.log(update);
}

service.on("update", handleUpdate);
service.off("update", handleUpdate);
```

An inline function cannot be removed later unless its reference is stored. Avoid using `setMaxListeners()` to hide a leak; it changes a warning threshold, not ownership.

### Timers are resources

Timers keep work scheduled and can keep a process alive. Store timer handles, clear them during shutdown, and decide whether repeated work may overlap. A timer callback that starts asynchronous work can outlive the timer itself, so cleanup must also cover the started operation.

## Detailed Explanations and Traces

### Synchronous emission and re-entrancy

```js
const emitter = new EventEmitter();

emitter.on("step", () => console.log("listener"));
console.log("before");
emitter.emit("step");
console.log("after");
```

Output is `before`, `listener`, `after`. If a listener calls `emit` again, events can become re-entrant. Protect state transitions and avoid assuming that `emit` merely queues work.

### Start/stop with an AbortSignal

```js
function startHeartbeat(signal, notify) {
  const timer = setInterval(() => notify(Date.now()), 1000);

  function stop() {
    clearInterval(timer);
  }

  if (signal.aborted) {
    stop();
  } else {
    signal.addEventListener("abort", stop, { once: true });
  }

  return stop;
}
```

The returned `stop` function gives the owner explicit cleanup. `{ once: true }` prevents the abort listener from remaining after cancellation.

### Events and errors across async boundaries

A listener may start asynchronous work, but `emit()` does not await it:

```js
emitter.on("job", async () => {
  throw new Error("failed");
});

emitter.emit("job");
```

The emitter does not receive that rejected promise as an event error. If async listeners are required, define a wrapper or use a promise-based API that aggregates and awaits results.

## Node.js, JavaScript, and DSA Connections

- **JavaScript:** Listener closures retain captured state; forgotten listeners can retain large object graphs.
- **Node:** Events are synchronous delivery around asynchronous resources.
- **DSA:** An emitter is a one-to-many observer list; listener count and cleanup determine memory growth.

## Common Mistakes and Interview Traps

- Forgetting an `error` listener.
- Assuming `emit()` is asynchronous.
- Adding process-wide listeners per request.
- Calling `removeListener` with a different function object.
- Treating `setMaxListeners` as a memory-leak fix.
- Starting intervals without a shutdown path.
- Assuming an async listener's rejection is caught by `EventEmitter`.

## Tricky Points

- Listener order is observable and can create hidden coupling.
- `once` removes the listener after invocation, but work started by that listener may continue.
- Removing a listener during emission does not necessarily change the listeners already selected for that emission.
- A resource can emit an error and close almost together; cleanup must be idempotent.

## Practical Exercise

**Goal:** Build a start/stop service that emits `tick`, `error`, and `stopped`.

**Inputs and outputs:** Start it twice, stop it twice, and record events without duplicate timers or listeners.

**Constraints:** Use only built-in Node APIs. Accept an `AbortSignal` and make stop idempotent.

**Acceptance criteria:** No timer remains after stop, no listener is duplicated, errors are handled, and repeated stop calls are safe.

## Summary

- `EventEmitter` listeners run synchronously in registration order.
- `error` is a special event requiring deliberate handling.
- Every listener, timer, socket, and subscription needs an owner and cleanup path.
- Promises represent one result; events represent repeated notifications.
- Async listener failures need an explicit error strategy.

## Cheat Sheet

| Need | Use |
|---|---|
| One eventual result | Promise |
| Repeated notifications | `EventEmitter` |
| One listener only | `once` |
| Remove listener | Same function reference with `off` |
| Stop timer | `clearTimeout` / `clearInterval` |
| Stop a group of operations | `AbortController` |
| Process safety | Handle `error` explicitly |

## Interview Questions

1. **Definition:** Why is the `error` event special?
   - **Expected answer:** An unhandled emitter error can throw and terminate the process; the listener must define recovery or shutdown behavior.
   - **Follow-up:** Why is logging alone often insufficient?

2. **Trace [Hard]:** What is the output order when an emitter listener calls another `emit`?
   - **Expected answer:** Emission is synchronous and can be re-entrant; trace the current call stack before discussing timers or promises.
   - **Follow-up:** How would you prevent recursive state transitions?

3. **Debugging [Hard]:** Listener warnings appear after traffic increases.
   - **Expected answer:** Find subscriptions created per request, inspect listener identity and lifecycle, and fix ownership rather than raising the listener limit.
   - **Follow-up:** What objects might leaked closures retain?

4. **Design [Very Hard]:** Design a reconnecting client with events and shutdown.
   - **Expected answer:** Define state transitions, one owner, backoff, timer cancellation, error handling, abort behavior, and idempotent close.
   - **Follow-up:** How do you prevent stale connection events from changing new connection state?

<nav aria-label="Lecture navigation">

[Previous: Buffers, Encodings, and Serialization](day-06-buffers-encodings-and-serialization.md) | [Roadmap](../node-roadmap.md) | [Next: Streams and Backpressure](day-08-streams-and-backpressure.md)

</nav>