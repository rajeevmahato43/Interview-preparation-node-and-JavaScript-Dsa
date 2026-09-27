# Day 25: Security-Relevant JavaScript Behavior

<nav aria-label="Lecture navigation">

[← Previous Day: Day 24 - Debugging and Language Failures](day-24-debugging-and-language-failures.md) | [Roadmap](../javascript-roadmap.md) | [Next Day: Day 26 - JavaScript Boundaries in Services →](day-26-javascript-boundaries-for-services.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Identify and audit the primary JavaScript language behaviors that introduce security vulnerabilities at system trust boundaries.
- Explain the mechanics, execution paths, and systemic dangers of Prototype Pollution.
- Implement defense-in-depth strategies against prototype pollution (`Object.create(null)`, `Map`, key allowlisting, and `Object.freeze(Object.prototype)`).
- Prevent code injection vectors arising from `eval()`, `new Function()`, and flawed Node.js `node:vm` sandbox configurations.
- Eliminate Timing Attacks on cryptographic signatures and tokens using `crypto.timingSafeEqual()`.
- Mitigate input parsing vulnerabilities: numeric coercion bypasses (`NaN`), unbounded `JSON.parse` CPU exhaustion, and ReDoS.
- Prevent sensitive data leakage in HTTP response payloads, error stack traces, and centralized logs.

---

## Vocabulary Card

| Term | Plain Definition | Everyday Analogy |
| :--- | :--- | :--- |
| **Trust Boundary** | The perimeter separating trusted internal system components from untrusted external inputs (HTTP payloads, query strings, headers, third-party APIs). | The border passport checkpoint where all incoming travelers must declare contents and present credentials before entering the country. |
| **Prototype Pollution** | A vulnerability where an attacker injects properties into `Object.prototype`, causing the injected properties to appear automatically on all JavaScript objects throughout the runtime. | Poisoning the central municipal water reservoir; every home tap in the entire city suddenly dispenses tainted water. |
| **Timing Attack** | A side-channel attack where an attacker infers secret values by measuring microscopic variations in how long an algorithm takes to compare strings. | A safe cracker listening with a stethoscope to the click intervals of a dial to guess individual combination tumblers. |
| **ReDoS** | Regular Expression Denial of Service: locking the single-threaded event loop by triggering catastrophic backtracking with adversarial input strings. | Giving an automated sorting robot an endless mirror reflection loop that spins its robotic arm until its motor burns out. |
| **Allowlist (Whitelist)** | An explicit security policy that accepts only known-safe inputs and rejects everything else by default. | A VIP guest list at a private club; if your name is not on the paper list, you are denied entry regardless of what you say. |

---

## Core Concepts

### 1. Prototype Pollution: The Universal Exploit Path

Because JavaScript objects inherit properties from `Object.prototype`, mutating `__proto__`, `constructor.prototype`, or prototype chains during recursive object merging corrupts every existing and future object in the Node.js process:

```javascript
// Node.js code
// ❌ VULNERABLE DEEP MERGE:
function mergeUnsafe(target, source) {
  for (const key of Object.keys(source)) {
    if (typeof source[key] === "object" && source[key] !== null) {
      if (!target[key]) target[key] = {};
      mergeUnsafe(target[key], source[key]); // Recursive merge
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Adversarial JSON payload:
const maliciousPayload = JSON.parse('{"__proto__": {"isAdmin": true}}');

const emptyConfig = {};
mergeUnsafe(emptyConfig, maliciousPayload);

// ⚠️ SYSTEM CORRUPTED:
const regularUser = {};
console.log("Is normal user an admin?", regularUser.isAdmin); // true!
// Every object in the runtime now has isAdmin = true!
```

#### Defenses Against Prototype Pollution:
1. **Key Filtering (Deny Dangerous Keys):** Explicitly reject `__proto__`, `constructor`, and `prototype`.
2. **Prototype-Free Dictionaries:** Use `Object.create(null)` for dynamic key maps.
3. **Use `Map`:** Standard `Map` instances are completely immune to prototype pollution.
4. **Hardening at Startup:** Call `Object.freeze(Object.prototype)` during service boot to prevent prototype mutations.

### 2. Code Injection: `eval()`, `new Function()`, and `node:vm`

Passing untrusted strings into dynamic evaluation APIs allows attackers to execute arbitrary code with the full OS permissions of the Node.js process:

```javascript
// Node.js code
// ❌ DANGEROUS: Evaluating dynamic math formulas or templates via eval or new Function
function calculateExpressionUnsafe(userFormula, a, b) {
  // If userFormula is: "process.exit(1)" or "require('child_process').execSync('rm -rf /')"
  const fn = new Function("a", "b", `return ${userFormula};`);
  return fn(a, b);
}

// calculateExpressionUnsafe("process.mainModule.require('child_process').execSync('whoami')", 1, 2);
```

**The `node:vm` Trap:** Node.js documentation explicitly states: *`node:vm` is not a security sandbox. Do not use it to run untrusted code.* Attackers can easily break out of `vm` contexts by traversing constructor prototypes back to the host process (`this.constructor.constructor('return process')().exit()`).

### 3. Timing Attacks and Constant-Time Comparison

Standard string comparison (`a === b`) short-circuits on the **first mismatched character**. An attacker measuring microsecond request latency over thousands of calls can guess secrets (API keys, webhook HMAC signatures, reset tokens) character-by-character:

```javascript
// Node.js code
const crypto = require("node:crypto");

// ❌ VULNERABLE: Short-circuit string comparison leaks timing information
function verifyTokenUnsafe(userSuppliedToken, secretToken) {
  return userSuppliedToken === secretToken;
}

// ✅ SAFE: Constant-time comparison using crypto.timingSafeEqual
function verifyTokenSafe(userSuppliedToken, secretToken) {
  const userBuf = Buffer.from(userSuppliedToken, "utf8");
  const secretBuf = Buffer.from(secretToken, "utf8");

  // Buffers MUST be of identical length to use timingSafeEqual:
  if (userBuf.length !== secretBuf.length) {
    // Perform dummy comparison to prevent length timing leaks:
    crypto.timingSafeEqual(secretBuf, secretBuf);
    return false;
  }

  return crypto.timingSafeEqual(userBuf, secretBuf);
}
```

### 4. Input Validation & Numeric Coercion Traps

Relying on implicit coercion or loose `Number()` parsing creates subtle authorization and logic bypasses:

```javascript
// Node.js code
function transferCreditsUnsafe(amount) {
  const numericAmount = Number(amount);

  // ❌ FLAWED: If amount is "NaN" or invalid string, numericAmount is NaN!
  // In JavaScript: (NaN < 0) is false, (NaN === 0) is false, (NaN > 1000) is false!
  if (numericAmount < 0 || numericAmount > 1000) {
    throw new Error("Invalid transfer amount");
  }

  // Bypasses the guard completely!
  console.log(`Transferred ${numericAmount} credits!`); // Transferred NaN credits!
}

transferCreditsUnsafe("invalid_number");

// ✅ SAFE: Strict finite integer verification:
function transferCreditsSafe(amount) {
  const val = Number(amount);
  if (!Number.isFinite(val) || !Number.isInteger(val) || val <= 0 || val > 1000) {
    throw new RangeError("Amount must be a positive integer between 1 and 1000");
  }
  return val;
}
```

### 5. Sensitive Data Exposure

1. **Stack Trace Leaks:** Catch errors at the top-level HTTP handler. Never return `err.stack` or raw SQL query strings to API clients in production.
2. **JSON Leaks:** Ensure internal security flags (e.g. `user.passwordHash`, `user.mfaSecret`) are excluded before serialization. Use explicit DTO (Data Transfer Object) mapping.

---

## Detailed Explanations and Traces

### Trace 1: The Prototype Pollution Exploitation Chain

Let's trace how prototype pollution in an innocent configuration merge leads to authorization bypass:

```javascript
// Node.js code
// Application codebase:
class UserSession {
  constructor(username) {
    this.username = username;
  }

  checkAdminPrivileges() {
    // If 'isAdmin' is not an own property, JavaScript walks up to Object.prototype!
    return Boolean(this.isAdmin);
  }
}

// Attacker sends HTTP PATCH to /api/settings:
// Payload: { "__proto__": { "isAdmin": true } }
function handlePatchSettings(body) {
  const settings = {};
  for (const [k, v] of Object.entries(body)) {
    settings[k] = v; // In sloppy merges, target['__proto__'] assigns to Object.prototype!
    Object.assign(Object.prototype, { [k]: v }); // Equivalent pollution
  }
}

handlePatchSettings(JSON.parse('{"isAdmin": true}'));

// Legitimate standard user logs in:
const normalUser = new UserSession("bob");
console.log("Bob is admin?", normalUser.checkAdminPrivileges()); // true! Access granted!
```

```
Prototype Chain Traversal:
[ normalUser (instance) ]
        |
        v [[Prototype]]
[ UserSession.prototype ]
        |
        v [[Prototype]]
[ Object.prototype ]  <-- Attacker injected: { isAdmin: true }
        |
        v
      null
```

When `normalUser.isAdmin` is read, V8 checks `normalUser` (not found), checks `UserSession.prototype` (not found), and checks `Object.prototype`. It finds `isAdmin: true`!

---

## Code Examples

### 1. Hardened, Prototype-Pollution-Proof Deep Merge

```javascript
// Node.js code
function deepMergeHardened(target, source, maxDepth = 10) {
  if (maxDepth < 0) {
    throw new RangeError("Payload exceeds allowable object nesting depth");
  }

  // Dangerous keys that must never be merged:
  const BLOCKED_KEYS = new Set(["__proto__", "prototype", "constructor"]);

  for (const key of Object.keys(source)) {
    if (BLOCKED_KEYS.has(key)) {
      continue; // Silently skip or throw error
    }

    const sourceVal = source[key];
    const targetVal = target[key];

    if (
      sourceVal !== null &&
      typeof sourceVal === "object" &&
      !Array.isArray(sourceVal)
    ) {
      // Ensure target property is a clean own object:
      if (
        targetVal === null ||
        typeof targetVal !== "object" ||
        Array.isArray(targetVal)
      ) {
        target[key] = Object.create(null);
      }
      deepMergeHardened(target[key], sourceVal, maxDepth - 1);
    } else if (Array.isArray(sourceVal)) {
      // Clone array cleanly:
      target[key] = [...sourceVal];
    } else {
      // Primitive assignment
      target[key] = sourceVal;
    }
  }

  return target;
}

// Verification:
const base = {};
const malicious = JSON.parse('{"__proto__": {"vulnerable": true}, "settings": {"theme": "dark"}}');

deepMergeHardened(base, malicious);
console.log("Was prototype polluted?", ({}).vulnerable); // undefined (Clean!)
console.log("Target merged cleanly:", base.settings.theme); // "dark"
```

### 2. Secure Error Serializer for API Gateways

```javascript
// Node.js code
function formatErrorForClient(error, isProduction = process.env.NODE_ENV === "production") {
  // If production, return sanitized safe response
  if (isProduction) {
    const isClientError = error.statusCode && error.statusCode >= 400 && error.statusCode < 500;
    return {
      success: false,
      statusCode: isClientError ? error.statusCode : 500,
      message: isClientError ? error.message : "Internal Server Error",
      correlationId: error.correlationId ?? "unknown",
    };
  }

  // Development: Include full stack for debugging
  return {
    success: false,
    statusCode: error.statusCode ?? 500,
    message: error.message,
    stack: error.stack,
    cause: error.cause ? error.cause.message : undefined,
  };
}
```

---

## Tricky Points and Gotchas

### 1. `Object.assign()` Does NOT Protect Against Prototype Pollution

`Object.assign()` copies properties using ordinary `[[Set]]` semantics. If the source object contains an own property named `__proto__`, `Object.assign(target, source)` **triggers the prototype setter on the target**!

```javascript
// Node.js code
const untrustedJSON = '{"__proto__": {"polluted": true}}';
const parsed = JSON.parse(untrustedJSON);

// ❌ FLAW: Object.assign copies __proto__ and mutates Object.prototype!
Object.assign({}, parsed);
console.log("Polluted via Object.assign?", ({}).polluted); // true!
```

### 2. `JSON.parse` Reviver Traversal

The optional `reviver` function in `JSON.parse(text, reviver)` is called for every parsed key-value pair from the leaves inward. If not guarded, malicious payloads can inject keys during parsing before validation runs.

### 3. Large Payloads Freeze Node.js Thread During `JSON.parse`

`JSON.parse()` is synchronous. Parsing a 50MB JSON payload submitted by an attacker locks the V8 event loop for hundreds of milliseconds, creating a zero-effort Denial of Service attack. Always enforce an HTTP body size limit (e.g. 100KB or 1MB) at the reverse proxy or middleware layer before parsing.

---

## Hands-on Exercise: Building a Secure Webhook Signature Validator

### Problem Statement

You are building a payment webhook verification endpoint. It receives an HTTP header `X-Signature`, the raw request body Buffer, and a timestamp. Attackers are attempting:
1. Replay attacks using old captured webhooks.
2. Timing attacks on the HMAC hex string comparison.
3. Prototype pollution via parsed body metadata.

### Buggy Implementation

```javascript
// Node.js code
// ❌ BUGS:
// 1. Insecure string comparison (timing attack)
// 2. No timestamp validation (vulnerable to replay attacks)
// 3. Merges metadata directly onto global app config
const crypto = require("node:crypto");

function verifyWebhookUnsafe(rawBody, signature, secret, appConfig) {
  const hmac = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  // Bug 1: Timing attack
  if (hmac !== signature) {
    throw new Error("Invalid signature");
  }

  const payload = JSON.parse(rawBody);
  // Bug 2: Prototype pollution vulnerability!
  Object.assign(appConfig, payload.metadata);
  return payload;
}
```

### Edge Cases to Address

1. Replay attack window: Reject webhooks older than 5 minutes.
2. Constant-time signature verification using `crypto.timingSafeEqual`.
3. Safe extraction of metadata into an isolated prototype-free object.

### Verified Solution

```javascript
// Node.js code
const crypto = require("node:crypto");

function verifyWebhookSecure(rawBody, headerSignature, timestampHeader, secret) {
  // 1. Guard against Replay Attacks: Enforce 5-minute deadline
  const currentTime = Math.floor(Date.now() / 1000);
  const webhookTime = parseInt(timestampHeader, 10);

  if (Number.isNaN(webhookTime) || Math.abs(currentTime - webhookTime) > 300) {
    throw new Error("Webhook timestamp expired or invalid");
  }

  // 2. Compute expected HMAC
  const signedPayload = `${timestampHeader}.${rawBody.toString("utf8")}`;
  const expectedHmac = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

  // 3. Constant-Time Signature Comparison
  const expectedBuf = Buffer.from(expectedHmac, "utf8");
  const providedBuf = Buffer.from(headerSignature, "utf8");

  if (
    expectedBuf.length !== providedBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, providedBuf)
  ) {
    throw new Error("Invalid webhook signature");
  }

  // 4. Safe Payload Extraction
  const parsed = JSON.parse(rawBody.toString("utf8"));
  const safeMetadata = Object.create(null);

  if (parsed.metadata && typeof parsed.metadata === "object") {
    for (const [key, value] of Object.entries(parsed.metadata)) {
      if (key !== "__proto__" && key !== "constructor" && key !== "prototype") {
        safeMetadata[key] = value;
      }
    }
  }

  return { event: parsed.event, metadata: safeMetadata };
}

// Verification:
const secretKey = "webhook_secret_key_prod_8819";
const now = Math.floor(Date.now() / 1000);
const rawData = Buffer.from(JSON.stringify({ event: "charge.succeeded", metadata: { txId: "tx_123" } }));

const validHmac = crypto
  .createHmac("sha256", secretKey)
  .update(`${now}.${rawData.toString("utf8")}`)
  .digest("hex");

const verified = verifyWebhookSecure(rawData, validHmac, String(now), secretKey);
console.log("Verified Webhook Payload:", verified);
// Output: { event: 'charge.succeeded', metadata: [Object: null prototype] { txId: 'tx_123' } }
```

---

## Summary

- Treat all external input (HTTP bodies, query strings, headers, external configs) as untrusted.
- Prototype pollution occurs when unsafe keys (`__proto__`, `constructor`, `prototype`) are merged into plain objects, corrupting `Object.prototype`.
- Defend against prototype pollution using `Object.create(null)`, `Map`, key allowlisting, and `Object.freeze(Object.prototype)`.
- Never execute arbitrary strings using `eval()` or `new Function()`; remember that `node:vm` is not a security sandbox.
- Use `crypto.timingSafeEqual` with equal-length buffers to protect secrets from side-channel timing attacks.
- Guard against numeric parsing flaws by asserting `Number.isFinite()` and `Number.isInteger()`.
- Enforce strict request body size limits to prevent synchronous `JSON.parse` event-loop starvation attacks.

---

## Cheat Sheet

### Vulnerability Defense Matrix

| Vulnerability | Attack Vector | Robust Defense |
| :--- | :--- | :--- |
| **Prototype Pollution** | Recursive merge of `{"__proto__": ...}` | Block `__proto__`/`constructor`; use `Object.create(null)` or `Map` |
| **Timing Attacks** | Measuring `===` comparison latency on tokens | Use `crypto.timingSafeEqual(bufA, bufB)` |
| **ReDoS** | Nested quantifiers `(a+)+` on non-matching text | Strict input length bounds; eliminate ambiguous nested quantifiers |
| **Code Injection** | `eval(str)`, `new Function(str)` | Avoid dynamic evaluation; use formal AST parsers |
| **Numeric Bypass** | `Number("abc")` yielding `NaN` | Explicitly check `Number.isFinite(val)` |
| **Data Leakage** | Returning raw database errors | Sanitize errors in gateway; redact sensitive log properties |

---

## Interview Questions & Deep Dives

### 1. What is Prototype Pollution, how does it lead to Remote Code Execution (RCE) in Node.js, and how is it prevented?

**Question:** Walk through the step-by-step mechanism of Prototype Pollution, explain how mutating `Object.prototype` can escalate to RCE in a Node backend, and describe the defenses.

**Answer:**
Prototype pollution occurs when untrusted input containing properties named `__proto__`, `constructor`, or `prototype` is recursively merged into a target object without filtering. Because ordinary JavaScript objects inherit from `Object.prototype`, writing `target["__proto__"]["evil"] = true` mutates `Object.prototype.evil = true`.

**Escalation to RCE:**
In Node.js backends, many internal libraries and child-process spawning utilities look for optional configuration properties on options objects (e.g. `child_process.fork(script, options)`). If an attacker pollutes `Object.prototype.shell = "/bin/sh"` or `Object.prototype.execArgv = ["--inspect=0.0.0.0"]`:
1. When the server later invokes a legitimate child process spawn without explicitly specifying `shell` or `execArgv`, V8 traverses up to `Object.prototype`.
2. It picks up the attacker's polluted `shell` or `execArgv` properties.
3. The child process launches with attacker-specified shell commands or debugger ports exposed, resulting in full Remote Code Execution.

**Defenses:**
1. Reject keys: `if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;`
2. Use prototype-free objects: `Object.create(null)`
3. Use native `Map` instead of object hash maps.
4. Freeze prototypes at startup: `Object.freeze(Object.prototype)`.

---

### 2. Why is standard string equality (`===`) dangerous for verifying API tokens and webhook signatures, and how does `crypto.timingSafeEqual` resolve it?

**Question:** Explain what a Timing Attack is, why `a === b` is vulnerable, and what requirements must be met before calling `crypto.timingSafeEqual`.

**Answer:**
**The Vulnerability:**
The standard JavaScript equality operator (`===`) optimizes string comparison by evaluating character-by-character from left to right and terminating immediately upon finding the **first mismatching character** (short-circuit evaluation).
- If an attacker guesses a token whose first character is wrong, comparison takes ~10 nanoseconds.
- If the first character is correct but the second is wrong, comparison takes ~20 nanoseconds.
By measuring response latency over statistical samples across thousands of requests, an attacker can determine character-by-character validity without ever knowing the full secret.

**The Solution:**
`crypto.timingSafeEqual(bufferA, bufferB)` executes in constant time: it inspects every byte regardless of where mismatches occur, preventing timing leakage.

**Pre-condition Requirement:**
Both input buffers **must have the exact same byte length** (`bufferA.length === bufferB.length`). Passing buffers of different lengths throws a `RangeError`. To prevent leaking length information, perform a dummy comparison against a known buffer if lengths differ.

---

### 3. Why is Node's built-in `node:vm` module NOT a safe sandbox for executing untrusted user code?

**Question:** An engineer suggests running user-submitted JavaScript snippets inside `vm.runInContext()`. Why is this insecure, and how can an attacker escape the sandbox?

**Answer:**
The Node.js documentation explicitly states: *The `node:vm` module is not a security mechanism. Do not use it to run untrusted code.*

`vm` creates a separate V8 context (global scope), but objects passed into or returned from the context still share prototype chains with the host process. An attacker can escape the sandbox in one line of code:
```javascript
const foreignObj = this.constructor.constructor("return process")();
foreignObj.mainModule.require("child_process").execSync("id");
```
**Mechanism:**
1. Any object in the sandbox (including functions or `this`) inherits from the host's `Function` prototype.
2. Accessing `this.constructor.constructor` retrieves the root `Function` constructor from the host environment.
3. Invoking it generates a function that executes outside the VM context, granting direct access to the host's `process` object and allowing arbitrary command execution.

To run truly untrusted code safely, you must use isolated OS-level containers (Docker, gVisor) or V8 process isolates (like Cloudflare Workers / Isolated-VM) with separate memory heaps.

---

### 4. How can `JSON.parse()` be weaponized to cause a Denial of Service on a Node.js server, and how do you protect against it?

**Question:** What are the Denial of Service vectors associated with `JSON.parse()`, and what architectural layers should defend against them?

**Answer:**
**DoS Vectors:**
1. **Event Loop Starvation:** `JSON.parse()` is a synchronous, blocking C++ binding in V8. Parsing an excessively large payload (e.g. 50MB–200MB containing deeply nested objects or long string keys) consumes 100% of the CPU core for hundreds of milliseconds or seconds, stalling all other concurrent HTTP traffic.
2. **Memory Exhaustion (OOM):** Parsing deeply nested arrays or repetitive large strings expands into massive heap object graphs, triggering V8 out-of-memory crashes (`JavaScript heap out of memory`).

**Defenses:**
1. **Payload Size Bounding:** Enforce strict body-size limits at the reverse proxy (e.g. Nginx `client_max_body_size 1m`) and in Express middleware (`express.json({ limit: '100kb' })`) *before* `JSON.parse` is ever called.
2. **Schema Compilation:** Validate the shape immediately after parsing using high-performance schema validators like TypeBox or Zod with strict property bounds.
3. **Streaming Parsers:** If large JSON payloads are legitimate (e.g. bulk data imports), use asynchronous streaming JSON parsers (e.g. `stream-json`) or offload parsing to Worker Threads.

---

<nav aria-label="Lecture navigation">

[← Previous Day: Day 24 - Debugging and Language Failures](day-24-debugging-and-language-failures.md) | [Roadmap](../javascript-roadmap.md) | [Next Day: Day 26 - JavaScript Boundaries in Services →](day-26-javascript-boundaries-for-services.md)

</nav>
