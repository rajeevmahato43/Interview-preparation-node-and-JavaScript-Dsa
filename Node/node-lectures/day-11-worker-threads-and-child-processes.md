# Day 11: Worker Threads and Child Processes

<nav aria-label="Lecture navigation">

[Previous: Networking, DNS, TLS, and Timeouts](day-10-networking-dns-tls-and-timeouts.md) | [Roadmap](../node-roadmap.md) | [Next: Testing, Diagnostics, Observability, and Shutdown](day-12-testing-diagnostics-observability-and-shutdown.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Identify CPU-bound work that blocks the event loop.
- Compare worker threads, child processes, and separate services.
- Design message passing, limits, cancellation, and failure handling.
- Avoid command injection and unsafe process spawning.
- Explain why parallelism has memory and coordination costs.

## Prerequisites

Read [Day 01: Node.js Runtime and Architecture](day-01-node-runtime-and-architecture.md), [Day 02: Event Loop and Scheduling](day-02-event-loop-and-scheduling.md), and [Day 04: Process, Configuration, and Lifecycle](day-04-process-configuration-and-lifecycle.md).

## Core Concepts

Promises do not make CPU work parallel. A long JavaScript calculation blocks the main event loop until it returns.

| Primitive | Best fit | Main tradeoff |
|---|---|---|
| Worker thread | CPU-bound JavaScript with shared process deployment | Message and memory overhead |
| Child process | Stronger isolation or external executable | IPC and process startup cost |
| Cluster/multiple processes | Multiple server processes across cores | Coordination and shared-state complexity |
| Separate worker service | Durable, scalable background workload | Deployment and network boundary |

Choose according to CPU cost, isolation, memory limits, crash behavior, workload duration, and operational ownership.

### Worker threads

A worker has its own JavaScript execution thread and event loop. Data normally crosses the boundary through structured cloning; transfer lists can move ownership of transferable memory.

```js
// main.cjs
const { Worker } = require("node:worker_threads");

function runWorker(input) {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./worker.cjs", { workerData: input });
    worker.once("message", resolve);
    worker.once("error", reject);
    worker.once("exit", (code) => {
      if (code !== 0) reject(new Error(`worker exited with ${code}`));
    });
  });
}
```

A production pool usually reuses a bounded number of workers rather than creating one per request.

### Child processes

Use `spawn` or `execFile` with an argument array when invoking a command. Avoid passing untrusted text to a shell:

```js
const { spawn } = require("node:child_process");
const child = spawn("node", ["script.cjs", "--input", inputPath], {
  shell: false,
});
```

`exec` is convenient for small output but invokes a shell and buffers output; it needs strict input controls and output limits. `spawn` streams output and is usually safer for larger or untrusted workloads.

## Detailed Explanations and Traces

### Worker lifecycle

```text
submit job -> admission limit -> send data -> running
                                      |       |
                                  cancel   result/error
                                      |       |
                                  terminate <- cleanup
```

A worker can fail, hang, or return invalid output. The owner needs a job deadline, termination policy, result validation, and a way to replace a failed worker. Terminating a worker does not automatically undo external side effects.

### Pool sizing

More workers do not automatically increase throughput. If there are $C$ CPU cores and $W$ CPU-heavy workers, values much larger than available CPU can cause context switching and memory pressure. The right limit depends on workload, other process work, and latency targets; measure queue age, utilization, and failure rate.

### Cancellation

Cancellation is cooperative while code is running. A worker can listen for a message or abort signal at safe points. If it cannot stop promptly, terminate it and classify the job as interrupted. Make retries idempotent because termination can happen after partial work.

### Structured clone and shared memory

Structured cloning copies many values but does not preserve every class, prototype, or resource. Functions, sockets, and open file handles are not ordinary message data. `SharedArrayBuffer` can share memory but introduces synchronization and race concerns; use it only with a clear ownership protocol.

## Node.js, JavaScript, and DSA Connections

- **JavaScript:** Worker code has a separate global scope and event loop.
- **Node:** Processes provide stronger failure and memory isolation than threads.
- **DSA:** A bounded worker pool is a queueing system; admission control protects service latency.

## Common Mistakes and Interview Traps

- Creating a worker per request.
- Expecting workers to share normal JavaScript objects.
- Sending huge messages and ignoring copy cost.
- Running `exec` with user-controlled shell text.
- Assuming killing a process rolls back side effects.
- Using workers for ordinary I/O-bound work.
- Omitting worker error, exit, timeout, and replacement handling.
- Sharing mutable state without synchronization.

## Tricky Points

- Worker threads improve CPU parallelism but still consume process memory.
- A child process can protect the main process from a native crash or memory fault better than a worker, but IPC is more expensive.
- `process.exit()` in a child can abandon buffered output and cleanup.
- A worker result can arrive after the request that created it has been cancelled; correlate jobs and discard stale results.

## Practical Exercise

**Goal:** Move a CPU-heavy calculation into a bounded worker pool.

**Inputs and outputs:** Submit jobs, return results, and report timeout/error states.

**Constraints:** Limit concurrent workers, validate input, support cancellation, and shut down workers cleanly.

**Acceptance criteria:** HTTP responsiveness remains stable during jobs, failed workers are replaced, and a timed-out job cannot resolve the original request later.

## Summary

- CPU-bound JavaScript blocks the main event loop.
- Workers provide parallel JavaScript; child processes provide stronger isolation.
- Pools, deadlines, message limits, and cleanup are required.
- Spawning commands safely means avoiding untrusted shell construction.
- Parallel execution introduces memory, coordination, and side-effect risks.

## Cheat Sheet

| Workload | Prefer |
|---|---|
| I/O-bound | Async Node API |
| CPU-bound JavaScript | Bounded worker pool |
| Untrusted/native executable | Child process with strict args |
| Durable long jobs | Separate worker service/queue |
| Large data transfer | Streaming or transfer ownership |
| Cancellation | Cooperative signal plus forced deadline |

## Interview Questions

1. **Definition:** Why do promises not solve CPU blocking?
   - **Expected answer:** Promise continuations still execute on the main JavaScript thread.
   - **Follow-up:** Which runtime primitive provides parallel JavaScript?

2. **Comparison [Hard]:** Choose between a worker thread and a child process for image conversion.
   - **Expected answer:** Discuss CPU cost, library safety, memory isolation, IPC, crash containment, and deployment model.
   - **Follow-up:** When would a separate service be better?

3. **Debugging [Hard]:** A worker pool increases latency after adding more workers.
   - **Expected answer:** Measure CPU saturation, context switching, memory pressure, queue age, and downstream limits; reduce or bound concurrency.
   - **Follow-up:** Which metric defines success?

4. **Security [Very Hard]:** A feature runs a user-selected command.
   - **Expected answer:** Do not pass raw input to a shell; use an allowlist and fixed executable/arguments, isolate permissions, limit resources, and audit.
   - **Follow-up:** What does process isolation not protect against?

5. **Design [Very Hard]:** Design a cancellable document conversion service.
   - **Expected answer:** Durable job state, bounded workers, deadlines, idempotency, temporary files, cleanup, retries, observability, and result ownership.
   - **Follow-up:** How do you recover after process termination midway through conversion?

<nav aria-label="Lecture navigation">

[Previous: Networking, DNS, TLS, and Timeouts](day-10-networking-dns-tls-and-timeouts.md) | [Roadmap](../node-roadmap.md) | [Next: Testing, Diagnostics, Observability, and Shutdown](day-12-testing-diagnostics-observability-and-shutdown.md)

</nav>