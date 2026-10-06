# Day 7: JavaScript Security and Integration

## Security and service boundaries

**1. Prototype pollution and unsafe property paths**

Merging attacker-controlled keys can alter object prototypes or privileged fields; allowlist writable keys.

```js
const allowed = { displayName: input.displayName }; // do not spread all input fields
```

**2. Code evaluation and ReDoS**

Never execute untrusted text as code; ambiguous backtracking regexes on long input can exhaust CPU.

**3. Service boundaries**

Normalize inputs, validate domain shapes, define error contracts, and keep mutable-state ownership clear. Serialization may lose or reject values.

[Security](../../Javascript/javascript-lectures/day-25-security-relevant-javascript.md) | [Service boundaries](../../Javascript/javascript-lectures/day-26-javascript-boundaries-for-services.md)

## Concurrency and integrated reasoning

**1. Bounded concurrency**

Independent work can overlap; cap in-flight tasks to protect memory and dependencies. Shared mutable state needs coordination.

**2. Cancellation, timeout, cleanup, retries**

Cancellation is cooperative; pass signals where supported, define who owns timeouts, always release resources, and retry only safe operations.

```js
try { await request({ signal }); }
finally { releaseResource(); }
```

**3. Integrated design**

Separate language guarantees from host/library behavior; state assumptions and trade-offs for modules, data structures, async, memory, and security.

[Concurrency and cleanup](../../Javascript/javascript-lectures/day-27-concurrency-and-resource-safe-async.md) | [Integration review](../../Javascript/javascript-lectures/day-28-senior-javascript-interview-integration.md)

## Tricky points

1. **Security**
	1.1 **Object merging:** Copying arbitrary request keys can overwrite privileged fields or prototypes; allowlist writable properties.
	1.2 **Regular expressions:** Test long near-matching inputs, not only valid examples; pathological failures can block a server thread.
	1.3 **Serialization:** Validate what crosses process/network boundaries; `JSON.stringify` is not lossless for all JavaScript values.
2. **Async concurrency**
	2.1 **Promise ownership:** Return or await work so callers can observe errors and completion.
	2.2 **Cancellation:** A timeout wrapper does not stop work unless the operation receives and honors cancellation.
	2.3 **Resource cleanup:** Releasing a promise does not automatically close the socket, stream, timer, or listener it owns.