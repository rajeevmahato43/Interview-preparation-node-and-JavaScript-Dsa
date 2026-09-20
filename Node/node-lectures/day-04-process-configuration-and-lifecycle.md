# Day 04: Process, Configuration, and Lifecycle

<nav aria-label="Lecture navigation">

[Previous: Modules, Packages, and Resolution](day-03-modules-packages-and-resolution.md) | [Roadmap](../node-roadmap.md) | [Next: Files, Paths, URLs, and Safe I/O](day-05-files-paths-urls-and-safe-io.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Read command-line arguments and environment variables safely.
- Separate configuration loading from configuration validation.
- Explain standard input, output, and error streams.
- Use exit codes and signals as part of a process contract.
- Distinguish expected startup failure from unexpected runtime failure.
- Describe a basic graceful-shutdown sequence.

## Prerequisites

Read [Day 03: Modules, Packages, and Resolution](day-03-modules-packages-and-resolution.md), [JavaScript Day 07: Errors and Exception Flow](../../Javascript/javascript-lectures/day-07-errors-and-exception-flow.md), and [JavaScript Day 25: JavaScript Security and Trust Boundaries](../../Javascript/javascript-roadmap.md).

The final JavaScript prerequisite is planned in this workspace but may not have a lecture file yet. This Node lecture focuses on process APIs and application lifecycle, not on deployment-platform-specific behavior.

## Core Concepts

### 1. A process has a lifecycle

A Node process usually follows this shape:

```text
read configuration
      |
validate configuration
      |
create resources
      |
serve work
      |
receive stop signal
      |
stop new work, finish or cancel active work
      |
release resources and exit
```

A service should fail early when it cannot start safely. It should not start listening and discover later that a required secret, port, or database connection is missing.

### 2. Command-line arguments

`process.argv` contains the command used to start the process and the arguments passed to the program. It is useful for CLI tools and startup switches. Treat all values as untrusted strings and validate them before use.

### 3. Environment variables

`process.env` exposes environment variables as strings or undefined values. It does not automatically convert `"false"` to `false` or `"3000"` to the number `3000`.

```js
const portText = process.env.PORT ?? "3000";
const port = Number(portText);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port");
}
```

Do not log secrets. Validate required configuration and make the result available through a controlled configuration object.

### 4. Standard streams

A process normally has:

- `stdin` for input.
- `stdout` for normal output.
- `stderr` for errors and diagnostic output.

Use structured logs in services so important fields can be searched. Remember that writes to streams can have buffering and backpressure behavior; logging is not automatically free.

### 5. Exit codes

An exit code communicates a result to the parent process or operating system. Conventionally, `0` means success and a non-zero value means failure. Do not use an exit code as a substitute for a useful error message or a cleanup strategy.

### 6. Signals and shutdown

Operating systems can send signals such as `SIGTERM` when a process should stop. A graceful shutdown handler should stop accepting new work, allow a bounded amount of time for active work to finish, close owned resources, and then exit.

A shutdown handler must also be idempotent: receiving two stop signals should not run cleanup twice in conflicting ways.

### 7. Configuration is typed at the application boundary

Environment variables are a transport format, not an application configuration model. Parse each value once and reject ambiguous input rather than allowing every caller to interpret it differently:

```js
function readBoolean(environment, name, defaultValue) {
  const value = environment[name];
  if (value === undefined) {
    return defaultValue;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  throw new Error(`${name} must be true or false`);
}
```

Be deliberate about empty strings, whitespace, duplicate configuration sources, and precedence between command-line flags and environment variables. A configuration object should contain validated values, not raw strings and repeated parsing logic.

### 8. A real shutdown sequence

For an HTTP service, a useful sequence is:

```text
running
  -> mark not-ready
  -> stop accepting new connections
  -> let bounded in-flight work finish
  -> cancel or fail remaining work
  -> close database, queue, file, and telemetry resources
  -> exit with an explicit status
```

Readiness should change before resource closure so traffic is drained while the process still has the ability to finish existing work. A deadline is essential because a dependency can hang during cleanup. The deadline policy should say what is abandoned and what data may need recovery after restart.

### 9. Fatal errors and restart policy

An uncaught exception or unhandled rejection is different from a handled request error. The process may have violated an invariant, so continuing to accept traffic can be less safe than terminating. Log a redacted error with a correlation or crash identifier, stop new work, attempt bounded cleanup, and let a supervisor restart the process.

Do not build an infinite in-process restart loop. Repeated startup failure should be visible to the deployment system, and retry policy should include backoff. The exact signal behavior and supervisor contract depend on the operating system and deployment environment, so document those assumptions.

## Detailed Explanations and Traces

### Configuration as a boundary

This is a **Node.js example**:

```js
function readConfig(environment) {
  const port = Number(environment.PORT ?? 3000);
  const environmentName = environment.NODE_ENV ?? "development";

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer from 1 to 65535");
  }

  if (!environmentName.trim()) {
    throw new Error("NODE_ENV cannot be empty");
  }

  return Object.freeze({ port, environmentName });
}

console.log(readConfig({ PORT: "4000", NODE_ENV: "test" }));
```

Expected output:

```text
{ port: 4000, environmentName: 'test' }
```

The function accepts an object so it can be tested without changing the real process environment. It converts and validates values once, then returns a stable configuration object.

### Startup failure

```js
function requireEnvironment(environment, name) {
  const value = environment[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing required configuration: ${name}`);
  }
  return value;
}

try {
  const databaseUrl = requireEnvironment(process.env, "DATABASE_URL");
  console.log(`Database configuration loaded: ${databaseUrl.length} characters`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
```

This example avoids printing the actual value. Setting `process.exitCode` requests a non-zero exit after current work finishes. Calling `process.exit()` immediately can interrupt pending output and cleanup, so it should not be the default way to finish a process.

### Graceful shutdown shape

This is a **Node.js example** with a fake resource:

```js
let stopping = false;

async function closeResources() {
  console.log("Closing resources");
}

async function shutdown(signal) {
  if (stopping) {
    return;
  }

  stopping = true;
  console.log(`Received ${signal}`);

  try {
    await closeResources();
    process.exitCode = 0;
  } catch (error) {
    console.error("Shutdown failed", error);
    process.exitCode = 1;
  }
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
```

A real server would first stop accepting new connections, then wait with a deadline for active requests, then close HTTP, database, queue, and telemetry resources. If cleanup exceeds the deadline, the process needs a documented forced-stop policy.

The following deadline wrapper illustrates the control flow. It is a **Node.js example**; the resource's actual close method and idempotency guarantees must be verified in its own documentation:

```js
async function closeWithin(resource, milliseconds) {
  let timeoutId;
  const deadline = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("close deadline exceeded")), milliseconds);
  });

  try {
    await Promise.race([resource.close(), deadline]);
  } finally {
    clearTimeout(timeoutId);
  }
}
```

`Promise.race()` does not cancel the losing promise. If `resource.close()` continues after the deadline, the resource owner needs a separate cancellation or forced-termination policy.

### Expected and unexpected failures

Expected startup failures include invalid configuration, an unavailable required dependency, or a port that cannot be bound. These should produce a clear message and a non-zero exit.

Unexpected failures such as an uncaught exception or unhandled rejection indicate that the process may no longer be trustworthy. A production service should log enough context, stop accepting new work, and let a supervisor restart it according to an explicit policy. Continuing blindly can produce corrupted state.

## Node.js, JavaScript, and DSA Connections

- **JavaScript connection:** Configuration parsing uses normal string, number, and error behavior; environment variables are not typed by JavaScript.
- **Node connection:** `process`, signals, standard streams, and exit behavior are Node/platform features.
- **DSA connection:** Shutdown can be viewed as a state machine: `running -> stopping -> stopped`, with invalid repeated transitions handled safely.

## Common Mistakes and Interview Traps

- Treating environment variables as booleans or numbers without conversion.
- Logging passwords, tokens, or full connection strings.
- Starting the server before validating configuration.
- Calling `process.exit()` immediately and losing buffered logs or cleanup.
- Assuming a signal handler automatically closes sockets, database pools, and timers.
- Installing a shutdown handler that runs cleanup more than once.
- Treating every exception as safe to ignore and continue.

## Tricky Points

- `process.env.MISSING` is undefined, while `process.env.FLAG = "false"` is still a non-empty string.
- A signal may arrive while startup or shutdown is already in progress.
- Setting `process.exitCode` does not stop current JavaScript immediately.
- A process may remain alive because an active server, socket, timer, or stream still owns the event loop.
- Shutdown needs a deadline. Waiting forever is another form of failure.

## Practical Exercise

**Goal:** Build a startup and shutdown wrapper for a small Node server.

**Inputs and outputs:** Read `PORT` and `NODE_ENV`, validate them, start an HTTP server, and print a safe startup message. On `SIGTERM`, stop accepting new work, close the server, and print a completion message.

**Constraints:** Use only built-in Node.js modules. Do not print secrets. Keep configuration parsing as a separately testable function.

**Edge cases:** Missing variables, invalid ports, repeated shutdown signals, server-start failure, and a request that is still active during shutdown.

**Acceptance criteria:**

- Invalid configuration prevents the server from listening.
- The startup message does not contain secret values.
- Shutdown cleanup runs at most once.
- The process reports failure with a non-zero exit code when startup or cleanup fails.
- The server does not wait forever for a resource that cannot close.

## Summary

- A Node process should validate configuration before opening resources.
- `process.env` values are strings and must be parsed deliberately.
- Standard streams, exit codes, and signals form part of a process contract.
- Graceful shutdown stops new work, handles active work within a deadline, and releases owned resources.
- Cleanup should be idempotent and observable.
- Unexpected fatal failures should be handled by a deliberate restart and recovery policy.

## Cheat Sheet

| Concern | Decision cue |
|---|---|
| Environment values | Parse and validate once; do not trust string types |
| Secrets | Read from protected configuration and never log values |
| Startup | Validate before listening or opening dependent resources |
| Exit status | `0` for success; non-zero for failure |
| Shutdown | Stop new work, finish/cancel active work, close resources |
| Repeated signals | Make cleanup idempotent |
| Forced stop | Use a bounded deadline and document what may be abandoned |

## Interview Questions

1. **Definition:** What belongs in a Node process lifecycle?
   - **Expected answer:** Configuration, validation, resource creation, serving, signal handling, cleanup, and exit reporting.
   - **Follow-up:** Why should configuration validation happen before listening?

2. **Trace:** What happens when `PORT` is set to `"false"` or `"abc"` in the configuration example?
   - **Expected answer:** Numeric conversion produces `NaN`, validation throws, and startup must fail rather than using an invalid port.
   - **Follow-up:** How would you validate a boolean environment variable?

3. **Implementation:** Write an idempotent shutdown function that closes an HTTP server and a database pool.
   - **Expected answer:** Guard repeated calls, stop new work, await close operations, apply a deadline, and set an appropriate exit status.
   - **Follow-up:** How would you handle one close operation rejecting?

4. **Debugging [Hard]:** A process receives `SIGTERM` but remains alive. What do you inspect?
   - **Expected answer:** Active handles, open sockets, timers, streams, database clients, unresolved shutdown promises, and whether the handler actually closes owned resources.
   - **Follow-up:** How would you prove which resource keeps the event loop alive?

5. **Design [Hard]:** Design startup behavior for a service whose database is unavailable.
   - **Expected answer:** Decide whether the database is required, fail fast if it is required, validate configuration, expose a clear readiness state if degraded startup is intentional, and avoid accepting requests that cannot succeed.
   - **Follow-up:** How should a supervisor react to repeated startup failures?

<nav aria-label="Lecture navigation">

[Previous: Modules, Packages, and Resolution](day-03-modules-packages-and-resolution.md) | [Roadmap](../node-roadmap.md) | [Next: Files, Paths, URLs, and Safe I/O](day-05-files-paths-urls-and-safe-io.md)

</nav>