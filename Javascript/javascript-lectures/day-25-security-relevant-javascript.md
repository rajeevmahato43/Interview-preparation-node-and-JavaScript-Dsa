# Day 25: Security-Relevant JavaScript Behavior

<nav aria-label="Lecture navigation">

[Previous: Debugging and Language Failures](day-24-debugging-and-language-failures.md) | [Roadmap](../javascript-roadmap.md) | [Next: JavaScript Boundaries in Services](day-26-javascript-boundaries-for-services.md)

</nav>

## Learning Outcomes

- Identify JavaScript behaviors that become vulnerabilities at trust boundaries.
- Reject unsafe property keys and prototype-pollution paths.
- Bound regex and input work to reduce denial-of-service risk.
- Keep evaluation, serialization, and error exposure deliberate.

## Prerequisites and Links

Read [Day 09](day-09-objects-and-property-access.md), [Day 12](day-12-built-in-data-structures-and-serialization.md), [Day 15](day-15-regular-expressions-and-text-processing.md), [Day 21](day-21-memory-reachability-and-garbage-collection.md), and [Day 24](day-24-debugging-and-language-failures.md).

## Core Concepts

Security is a boundary problem. Treat request data, configuration files, decoded JSON, and dependency output as untrusted until validated. JavaScript's dynamic property access, prototype inheritance, regex backtracking, dynamic evaluation, and lossy serialization can turn an innocent utility into a server vulnerability.

Prefer allowlists, own-property checks, bounded input, explicit schemas, and safe error mapping. Never use `eval` or `Function` to interpret untrusted data.

## Detailed Explanations of Difficult Behavior

### Unsafe keys

```js
// Node.js or any ECMAScript host
const unsafeKeys = new Set(["__proto__", "prototype", "constructor"]);

function copyAllowed(input, allowedKeys) {
  const output = Object.create(null);
  for (const key of allowedKeys) {
    if (unsafeKeys.has(key)) throw new Error(`unsafe key: ${key}`);
    if (Object.hasOwn(input, key)) output[key] = input[key];
  }
  return output;
}

console.log(copyAllowed({ name: "Asha" }, ["name"])); // [Object: null prototype] { name: 'Asha' }
```

The exact impact of unsafe merging depends on the operation and runtime, but special keys should not be accepted casually. An allowlist also prevents unexpected fields from silently becoming behavior.

### Regex and input limits

A regex with nested ambiguous quantifiers can require excessive backtracking for crafted input. Prefer simple patterns, bounded lengths, or a parser. A timeout cannot reliably rescue a synchronous regex that blocks the JavaScript execution path.

## Examples and Traces

**Environment:** Node.js or another ECMAScript runtime.

```js
function parseFiniteCount(raw) {
  if (typeof raw !== "string" || raw.length > 10) throw new TypeError("invalid count");
  const value = Number(raw);
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new RangeError("count must be a finite non-negative integer");
  }
  return value;
}

console.log(parseFiniteCount("3")); // 3
```

The constraints are part of the security contract: type, length, finiteness, and range.

## Node.js Connection

Node services commonly process untrusted HTTP, environment, file, and dependency data. Node APIs provide the boundary, but JavaScript object semantics determine whether normalization is safe. Keep HTTP parsing, headers, filesystem policy, and deployment controls in the Node curriculum.

---

## Compare & Recall

| Concept A | Concept B | Key difference |
|---|---|---|
| Prototype pollution | Property injection | Prototype pollution: assigning to `__proto__` or `constructor.prototype` affects **all objects** inheriting from `Object.prototype`. Property injection: adding a key to one specific object. Pollution is globally dangerous; injection is locally scoped. |
| Allowlist validation | Blocklist validation | Allowlist: only known-good values pass. Blocklist: only known-bad values fail. Allowlists are safer because you can't predict all possible attacks. Prefer allowlists at trust boundaries. |
| `eval(userInput)` | Template-based output | `eval` executes arbitrary JS. Template literals just format strings. Never evaluate untrusted strings as code. |
| `JSON.parse` | Schema validation | `JSON.parse` converts text to a JavaScript value but does **not** validate its shape, types, or limits. Always validate parsed data against a schema before using it. |
| `Number(input)` | `Number.isFinite(Number(input))` | `Number("abc")` returns `NaN`, which silently breaks comparisons. Always check `Number.isFinite` or `Number.isInteger` after converting user input. |
| `RegExp(userInput)` | Static pattern | Dynamic regex from user input can cause ReDoS (denial of service via backtracking). Always use static patterns and add input length limits at the boundary. |

> **Cross-day links:** Prototype pollution and `Object.create(null)` are in [Day 09](day-09-objects-and-property-access.md). Regex denial-of-service risks are in [Day 15](day-15-regular-expressions-and-text-processing.md). Input validation patterns are in [Day 26](day-26-javascript-boundaries-for-services.md).

## Common Mistakes and Interview Traps

- Merging arbitrary keys into ordinary objects.
- Treating JSON parsing as validation.
- Using `Number()` and accepting `NaN` as a valid numeric result.
- Assuming a timeout interrupts synchronous work.
- Returning raw errors containing paths, queries, tokens, or personal data.
- Using `eval` for configuration or expressions.

## Tricky Points

`Object.create(null)` avoids an inherited prototype, but it does not validate values or make nested data safe. Security requires a complete boundary policy, not one special object constructor.

## Practical Exercise

**Goal:** Harden a nested-object merge utility.

**Inputs:** Untrusted keys, nested objects, arrays, numeric fields, and text fields.

**Constraints:** Allowlist keys, reject unsafe paths, bound depth and input sizes, require finite numbers, and return safe errors.

**Edge cases:** `__proto__`, `constructor`, `prototype`, missing fields, explicit `undefined`, `NaN`, deeply nested input, and duplicate keys.

**Acceptance criteria:** Tests demonstrate that prototypes are not modified, invalid values are rejected, and error output excludes sensitive input.

## Summary

Dynamic JavaScript features are powerful and dangerous at trust boundaries. Validate types and ranges, use allowlists and own-property checks, reject unsafe keys, bound work, avoid dynamic evaluation, and map errors safely.

## Cheat Sheet

| Risk | Control |
|---|---|
| Prototype pollution | Allowlists, unsafe-key rejection, safe merge policy |
| Regex DoS | Simple/bounded patterns or parser |
| Numeric bugs | `Number.isFinite`, integer/range checks |
| Code injection | Never evaluate untrusted text |
| Data leakage | Safe error and log mapping |
| Memory exhaustion | Size/depth/count limits |

## Interview Questions

> Difficulty guide: **[Beginner]** = entry-level, **[Mid]** = requires understanding of internals, **[Senior]** = design and tradeoff thinking expected.

1. **[Mid] Review:** Identify the trust boundaries in an object normalizer.
2. **[Senior] Debugging:** Explain how an unsafe key can create inherited behavior and how to test for it.
3. **[Senior] Design:** Design validation for a public service endpoint with nested data, regex fields, numeric limits, and safe errors.
