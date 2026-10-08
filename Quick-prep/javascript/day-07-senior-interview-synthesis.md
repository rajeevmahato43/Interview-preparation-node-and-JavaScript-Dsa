# Day 7: Security, Service Boundaries, Concurrency, and Senior Synthesis

Quick review of main-course lectures 25–28. Designed for rapid interview revision: Prototype Pollution defense, ReDoS catastrophic backtracking, Server-Side Request Forgery (SSRF), boundary serialization traps, asynchronous race conditions, and senior architectural trade-offs.

## Security vulnerabilities and defense

**1. Prototype Pollution defense**

Prototype pollution occurs when unvalidated nested user objects overwrite properties on `Object.prototype`, affecting all objects across the runtime. Always block forbidden keys (`__proto__`, `constructor`, `prototype`) or use `Object.create(null)`.

```js
// Secure deep merge defense
function safeMerge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue; // Block pollution vectors
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      target[key] = safeMerge(target[key] || {}, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}
```

**2. Regular Expression Denial of Service (ReDoS)**

Regex patterns with overlapping greedy quantifiers (e.g., `/^(a+)+$/`) trigger exponential backtracking ($O(2^n)$) when evaluated against non-matching inputs, freezing the single-threaded JavaScript runtime. Always enforce input length limits and avoid nested repetition.

```js
// Vulnerable to ReDoS: catastrophic backtracking on "aaaaaaaaaaaaaaaax"
const badRegex = /^(a+)+$/;

// Safe: linear time regex with bounded length validation
const safeRegex = /^a+$/;
```

**3. Server-Side Request Forgery (SSRF) prevention**

When fetching user-specified URLs from a backend service, attackers can target internal private networks (e.g., AWS metadata at `169.254.169.254` or internal microservices at `10.0.0.0/8`). Validate hostnames and block private RFC 1918 IP ranges before issuing requests.

[Security and injection](../../Javascript/javascript-lectures/day-25-security-relevant-javascript.md)

## Service boundaries, contracts, and serialization

**1. Boundary validation and safe serialization**

Never allow untyped payloads to enter service layers. Define strict contracts using validation schemas. Beware of JavaScript serialization boundaries:
- **`BigInt`:** Throws `TypeError` in `JSON.stringify`.
- **Large Integers (Snowflake IDs):** Numbers larger than `Number.MAX_SAFE_INTEGER` ($9,007,199,254,740,991$) silently lose precision; represent them as strings across boundaries.
- **`Date` objects:** Serialized to ISO strings; deserialization requires explicit string-to-Date transformation.

```js
// Snowflake ID safety: preserve 64-bit IDs as strings
const payload = {
  orderId: "178293849182391823", // String avoids floating-point precision loss
  amountCents: 2500
};
```

[Service boundaries](../../Javascript/javascript-lectures/day-26-javascript-boundaries-for-services.md)

## Concurrency patterns and async race conditions

**1. Asynchronous race conditions in single-threaded JavaScript**

Even though JavaScript executes on a single main thread, asynchronous operations interleave execution at `await` boundaries. If two asynchronous operations perform read-modify-write sequences on shared state, they can overwrite each other (lost update race condition).

```js
let accountBalance = 100;

// Vulnerable to race condition:
async function deductBalance(amount) {
  const current = accountBalance; // 1. Read
  await fakeDelay();              // Interleaved async tick!
  accountBalance = current - amount; // 2. Overwrite based on stale read
}

// Two concurrent calls of deductBalance(80) will result in accountBalance = 20 rather than -60!
```

**2. Mitigating race conditions: Mutexes and atomic pipelines**

Coordinate concurrent operations through an async lock (Mutex) or serialize operations through an in-memory queue.

```js
class AsyncMutex {
  private queue = Promise.resolve();

  dispatch(task) {
    const next = this.queue.then(() => task());
    this.queue = next.catch(() => {});
    return next;
  }
}

const mutex = new AsyncMutex();
await Promise.all([
  mutex.dispatch(() => deductBalance(80)),
  mutex.dispatch(() => deductBalance(80))
]);
```

[Concurrency patterns](../../Javascript/javascript-lectures/day-27-concurrency-and-resource-safe-async.md)

## Senior interview architecture and synthesis

**1. Senior engineering interview communication**

In senior interviews, your goal is to demonstrate technical depth, architectural reasoning, and calm trade-off analysis:
1. **Clarify Constraints Upfront:** Ask about data volume, read/write ratios, latency SLAs, and consistency requirements.
2. **Lead with Trade-offs:** Every architectural decision has a drawback (e.g., "Choosing Redis caching speeds reads to <2ms, but introduces cache invalidation complexity and potential stale reads").
3. **Address Failure Modes First:** Proactively discuss how the system behaves under network partitions, memory pressure, or external service outages.
4. **Defend Decisions with Data:** Discuss metrics, p99 latency, garbage collection impact, and operational monitoring.

[Senior interview synthesis](../../Javascript/javascript-lectures/day-28-senior-javascript-interview-integration.md)

## Tricky points

1. **Security**

**1.1 Prototype pollution via `JSON.parse` object merging**
Merging deeply parsed JSON into existing system configurations without filtering `__proto__` can modify default methods on all objects, enabling Remote Code Execution (RCE) in libraries that execute dynamic shell commands.

**1.2 ReDoS locking the main thread completely**
A single catastrophic regular expression match triggered by a malicious HTTP query freezes the entire Node.js event loop, preventing all concurrent users from receiving responses until the process is restarted.

2. **Serialization and boundary data**

**2.1 Snowflake ID precision truncation**
Allowing a numeric 64-bit ID from Twitter, Discord, or PostgreSQL (`162391029381029381`) to be parsed as a standard JavaScript `Number` silently rounds the last few digits to `162391029381029380`, corrupting records and foreign keys.

3. **Concurrency and async state**

**2.2 False sense of safety from single-threaded model**
Developers frequently assume that single-threaded execution guarantees thread safety; however, any asynchronous operation involving `await` yields the thread, allowing interleaved mutations to corrupt in-flight business calculations.