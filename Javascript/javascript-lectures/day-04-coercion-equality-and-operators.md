# Day 04: Coercion, Equality, and Operators

<nav aria-label="Lecture navigation">

[Previous: Values, Types, and Literals](day-03-values-types-and-literals.md) | [Roadmap](../javascript-roadmap.md) | [Next: Conditions, Loops, and Control Transfer](day-05-control-flow-and-loops.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain explicit conversion and implicit coercion.
- Predict common string, number, boolean, `null`, and `undefined` conversions.
- Explain the main behavior of `==`, `===`, `Object.is`, and relational comparison.
- Use `||`, `&&`, `??`, and optional chaining without confusing their purposes.
- Recognize `NaN`, `-0`, empty strings, and other edge cases.
- Protect Node.js validation, pagination, configuration, and authorization code from coercion bugs.

## Prerequisites

Read [Day 03: Values, Types, and Literals](day-03-values-types-and-literals.md). You should already know the primitive types, object identity, `NaN`, and the safe integer boundary. The next lecture, [Day 05: Conditions, Loops, and Control Transfer](day-05-control-flow-and-loops.md), uses truthiness and comparison in control flow.

This lecture covers language operators. It does not replace a schema validator or explain framework-specific request parsing.

## Core Concepts

### 1. Conversion versus coercion

**Conversion** is changing a value from one representation to another. When the program asks for the change directly, it is explicit conversion:

```js
const text = "42";
const count = Number(text);

console.log(count);        // 42
console.log(typeof count); // "number"
```

**Coercion** is an implicit conversion performed as part of another operation:

```js
console.log("4" + 2); // "42": number becomes a string
console.log("4" - 2); // 2: string becomes a number
```

Both results follow language rules, but they may surprise a reader. At input boundaries, explicit conversion plus validation is easier to review.

### 2. Boolean conversion and truthiness

When JavaScript needs a boolean, it applies a truthiness rule. The following values are falsy:

- `false`
- `0`, `-0`, and `0n`
- `NaN`
- `""` (the empty string)
- `null`
- `undefined`

Most other values are truthy, including empty arrays and empty objects:

```js
console.log(Boolean([])); // true
console.log(Boolean({})); // true
console.log(Boolean("0")); // true
```

This is why a check for â€œdid the caller provide a value?â€ must be chosen carefully:

```js
function oldStyleLimit(input) {
  return input || 10;
}

console.log(oldStyleLimit(0)); // 10, even though 0 was provided
```

If only `null` and `undefined` mean â€œmissing,â€ use nullish coalescing:

```js
function limitOrDefault(input) {
  return input ?? 10;
}

console.log(limitOrDefault(0)); // 0
console.log(limitOrDefault(null)); // 10
```

### 3. String conversion

Explicit string conversion is usually clear:

```js
console.log(String(42));       // "42"
console.log(String(null));     // "null"
console.log(String(undefined)); // "undefined"
console.log(String([1, 2]));    // "1,2"
```

The last result is one reason not to use implicit string conversion as a data serialization format. Arrays and objects have conversion behavior that may not match the data contract you intended.

Template literals also convert interpolated values to strings:

```js
const userId = 42;
console.log(`user-${userId}`); // "user-42"
```

### 4. Number conversion

`Number(value)` uses JavaScript's number conversion rules:

```js
console.log(Number("42"));       // 42
console.log(Number(" 42 "));     // 42
console.log(Number(""));         // 0
console.log(Number("  "));       // 0
console.log(Number("42px"));     // NaN
console.log(Number(null));       // 0
console.log(Number(undefined));  // NaN
console.log(Number(false));      // 0
console.log(Number(true));       // 1
```

This is useful but dangerous if accepted input should not allow an empty string to mean zero. Validate the original representation and the converted result when the distinction matters.

`parseInt` and `parseFloat` parse a prefix rather than requiring the entire string to be a valid number:

```js
console.log(parseInt("42px", 10));   // 42
console.log(Number("42px"));         // NaN
console.log(parseInt("10", 2));      // 2
console.log(parseInt("08", 10));     // 8
```

Always provide the radix to `parseInt`, and choose the parser based on the input contract. Neither function is a complete validation policy by itself.

### 5. Addition is overloaded

The `+` operator can perform numeric addition or string concatenation:

```js
console.log(2 + 3);       // 5
console.log("2" + 3);     // "23"
console.log(2 + "3");     // "23"
console.log("2" + "3");   // "23"
```

Evaluation proceeds left to right, and the current operands influence the next step:

```js
console.log(1 + 2 + "3"); // "33"
console.log("1" + 2 + 3); // "123"
```

Other arithmetic operators generally convert operands to numbers:

```js
console.log("6" * 2); // 12
console.log("6" - 2); // 4
console.log("6" / 2); // 3
```

Do not depend on this as a clever way to validate external input. It is better to make the intended conversion visible.

### 6. Equality operators

#### Strict equality: `===`

Strict equality does not perform ordinary type coercion. Values of different types are not equal:

```js
console.log(1 === "1"); // false
console.log(false === 0); // false
console.log(null === undefined); // false
```

For primitives, it compares values with special behavior for `NaN` and signed zero. For objects, it compares identity:

```js
console.log({} === {}); // false
```

#### Loose equality: `==`

Loose equality may convert operands before comparing them:

```js
console.log("1" == 1);       // true
console.log(false == 0);     // true
console.log(null == undefined); // true
```

Its full algorithm has many branches. A practical rule is to prefer `===` unless you deliberately want a documented loose-equality behavior. One narrow pattern is useful when checking only for nullish values:

```js
if (value == null) {
  // true only for null or undefined
}
```

A team should choose whether this pattern is allowed and apply it consistently. It is not a reason to use `==` everywhere.

#### `Object.is`

`Object.is` compares values with SameValue semantics:

```js
console.log(Object.is(NaN, NaN)); // true
console.log(Object.is(0, -0));    // false
console.log(Object.is(1, 1));     // true
```

It is not a deep comparison function. Two separately created objects remain different.

### 7. Relational comparison

The `<`, `>`, `<=`, and `>=` operators can compare strings lexicographically or convert values numerically, depending on the operands:

```js
console.log("20" < "3"); // true: string comparison, like dictionary order
console.log("20" < 3);    // false: numeric comparison
```

If values represent numbers, convert and validate them before comparing. Otherwise, a string such as `"100"` may sort before `"20"`.

### 8. Short-circuit operators

Logical operators return one of their operands, not necessarily a boolean.

- `left && right` returns the first falsy operand, or the last operand if all are truthy.
- `left || right` returns the first truthy operand, or the last operand if all are falsy.
- `left ?? right` returns `right` only when `left` is `null` or `undefined`.

```js
console.log("ready" && 42); // 42
console.log(0 && 42);       // 0
console.log("" || "fallback"); // "fallback"
console.log(0 || 10);       // 10
console.log(0 ?? 10);       // 0
```

These operators also short-circuit evaluation:

```js
let calls = 0;
function nextValue() {
  calls += 1;
  return "done";
}

const result = true || nextValue();
console.log(result); // true
console.log(calls);  // 0
```

Do not mix `??` directly with `||` or `&&` without parentheses. JavaScript rejects ambiguous combinations:

```js
// value ?? fallback || otherFallback; // SyntaxError
const chosen = (value ?? fallback) || otherFallback;
```

### 9. Optional chaining

Optional chaining stops a property access or call when the value on its left is `null` or `undefined`:

```js
const response = { body: { user: { name: "Asha" } } };

console.log(response.body?.user?.name); // "Asha"
console.log(response.missing?.user?.name); // undefined
```

It does not treat every falsy value as absent:

```js
const settings = { retries: 0 };
console.log(settings.retries?.toString()); // "0"
```

Optional chaining is not validation. It can turn a missing required field into `undefined`, so use it when absence is an accepted outcome.

## Detailed Explanations and Traces

### A coercion trace

Consider:

```js
const result = "5" + 2 * "3";
```

Trace it from operator precedence:

1. Multiplication has higher precedence than addition.
2. `2 * "3"` converts `"3"` to the number `3`, producing `6`.
3. The expression becomes `"5" + 6`.
4. Because one side is a string, `+` concatenates.
5. The final result is the string `"56"`.

A good interview answer shows the intermediate expression instead of only giving the final output.

### Default values in a Node.js configuration

Environment variables arrive as strings in Node.js. A common mistake is to test only truthiness or forget conversion:

```js
function readPort(environment) {
  const rawPort = environment.PORT ?? "3000";
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer from 1 to 65535");
  }

  return port;
}

console.log(readPort({ PORT: "8080" })); // 8080
```

The function makes the missing-value policy, conversion, and range validation explicit. A production application may use a schema library, but the reasoning remains the same.

### Truthiness is not authorization

Never use a loose truthy check for security-sensitive meaning:

```js
function canDelete(input) {
  return Boolean(input.isAdmin);
}
```

This may be acceptable only if `isAdmin` has already been validated as a boolean. If a boundary accepts strings, `"false"` is truthy:

```js
console.log(Boolean("false")); // true
```

Validate the type and allowed values before making an authorization decision.

## Node.js Connection

Configuration, authorization, pagination, and request validation should use explicit types and finite-number checks rather than accidental coercion.

---

## Compare & Recall

| Concept A | Concept B | Key difference |
|---|---|---|
| `||` (OR) | `??` (nullish coalescing) | `||` uses the right side for any *falsy* value (`0`, `""`, `false` included). `??` uses the right side only when the left is `null` or `undefined`. |
| `===` (strict) | `==` (loose) | `===` never coerces. `==` may convert types before comparing, which creates surprises. Prefer `===` by default. |
| `===` | `Object.is` | `===` says `NaN !== NaN` and `0 === -0`. `Object.is` says `NaN === NaN` and `0 !== -0`. Use `Object.is` when those edge cases matter (e.g. cache keys). |
| Falsy | Nullish | Falsy: `false`, `0`, `""`, `null`, `undefined`, `NaN`. Nullish: only `null` and `undefined`. |
| Optional chaining `?.` | Validation | `?.` silently returns `undefined` for nullish access — it does **not** validate. Use it only when absence is a valid, expected outcome. |
| `Number("")` | missing/empty | `Number("")` returns `0`, not `NaN`. An empty field is often not the same as zero. Validate the original string first. |
| `parseInt(x, 10)` | `Number(x)` | `parseInt` reads a prefix (stops at first non-digit). `Number` requires the whole string to be a valid number. `Number("42px")` → `NaN`; `parseInt("42px", 10)` → `42`. |

> **Cross-day links:** Truthiness in `if`/loops is used in [Day 05](day-05-control-flow-and-loops.md). The full type system is in [Day 03](day-03-values-types-and-literals.md). Coercion edge cases in objects and arrays appear in [Day 12](day-12-built-in-data-structures-and-serialization.md).

## Common Mistakes and Interview Traps

- Using `||` when `0`, `false`, or `""` are valid values.
- Believing `??` handles every falsy value. It handles only `null` and `undefined`.
- Comparing numbers as strings.
- Using `parseInt` without a radix or as a complete input validator.
- Assuming `===` performs deep object comparison.
- Saying `==` is always wrong without understanding its conversion rules or narrow nullish-check use.
- Forgetting that `+` can concatenate after earlier arithmetic has completed.
- Mixing `bigint` and `number` arithmetic.
- Treating optional chaining as proof that a required property exists.
- Trusting truthiness for authorization or feature flags from unvalidated text.

## Tricky Points

1. `Number("")` is `0`, so empty input needs a policy before conversion.
2. `null == undefined` is true, but `null === undefined` is false.
3. `NaN` is falsy, yet it is a `number` and often signals invalid input.
4. `[]` and `{}` are truthy even though they contain no application data.
5. `a || b` and `a ?? b` differ exactly when `a` is falsy but not nullish.
6. The order of evaluation and operator precedence can produce a string after earlier numeric operations.

## Practical Exercise

**Runnable Node.js example:**

```js
function normalizeConfig(raw) {
  const source = raw ?? {};
  const port = source.port === undefined ? 3000 : Number(source.port);
  if (!Number.isFinite(port) || !Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new RangeError("port must be a finite integer from 1 to 65535");
  }

  if (source.enabled === undefined) return { port, enabled: true };
  if (source.enabled === true || source.enabled === "true") return { port, enabled: true };
  if (source.enabled === false || source.enabled === "false") return { port, enabled: false };
  throw new TypeError("enabled must be boolean-like");
}

console.log(normalizeConfig({ port: "3000", enabled: false })); // { port: 3000, enabled: false }
```

Test separately with `0`, `false`, `null`, `undefined`, invalid numeric text, and `NaN`. `Number.isFinite` rejects `NaN` and infinities without coercing unrelated values.

**Goal:** Normalize a pagination query safely.

**Input:** An object with optional `page`, `limit`, and `includeArchived` fields. Values may arrive as strings because they came from a request query or environment-like source.

**Task:** Return `{ page, limit, includeArchived }` with integer `page >= 1`, integer `limit` between 1 and 100, and a real boolean for `includeArchived`.

**Edge cases:** Handle missing fields, empty strings, `"0"`, `"false"`, `"true"`, invalid numeric text, and actual boolean values. Do not let `"false"` become true just because it is a non-empty string.

**Acceptance criteria:** Invalid input produces a clear validation error; valid `0` is not silently replaced by a default before the range check; no loose equality is required to make the function work; tests cover at least eight input cases.

## Summary

- Explicit conversion is easier to review than accidental coercion.
- Truthiness includes many values that are not â€œmissingâ€; empty arrays and objects are truthy.
- `Number`, `String`, and `Boolean` follow defined conversion rules, including surprising cases.
- `===` avoids ordinary coercion, while `==` may convert values.
- `Object.is` differs from `===` for `NaN` and signed zero.
- Relational operators may compare strings lexicographically, so normalize numeric data first.
- `||` uses truthiness; `??` uses nullishness; optional chaining handles nullish access.
- Input validation must happen before authorization, pagination, configuration, and other decisions.

## Cheat Sheet

| Expression or rule | Meaning |
| --- | --- |
| `Boolean(value)` | Explicit truthiness conversion |
| `Number(value)` | Explicit number conversion; validate result and original input policy |
| `String(value)` | Explicit string conversion |
| `left === right` | Strict equality; no ordinary type coercion |
| `left == right` | Loose equality; conversion may happen |
| `Object.is(left, right)` | SameValue comparison; handles `NaN` and `-0` differently |
| `a || b` | Use `b` for any falsy `a` |
| `a ?? b` | Use `b` only for `null` or `undefined` |
| `a?.b` | Stop access for nullish `a` |
| `parseInt(text, 10)` | Parse an integer prefix, not necessarily the whole string |

**vs. quick reference**

| Operator | Triggers on | Common trap |
|---|---|---|
| `\|\|` | Any falsy value (0, "", false, null, undefined, NaN) | Replaces `0` and `false` unintentionally |
| `??` | Only null or undefined | Leaves `0`, `""`, `false` unchanged |
| `?.` | Only null or undefined | Not a validation tool — silently swallows errors |

| Comparison | `NaN === NaN` | `0 === -0` | Coerces types? |
|---|---|---|---|
| `===` | false | true | No |
| `==` | false | true | Yes |
| `Object.is` | **true** | **false** | No |

## Interview Questions

> Difficulty guide: **[Beginner]** = entry-level, **[Mid]** = requires understanding of internals, **[Senior]** = design and tradeoff thinking expected.

1. **[Beginner] Mental model:** Explain why `"0"`, `0`, `""`, `null`, `undefined`, `[]`, and `{}` behave differently in an `if` statement.
   - **Expected answer shape:** Classify each value as truthy or falsy and connect the result to Boolean conversion.
   - **Follow-up:** Which of these should mean "missing page size" in an API, and why?

2. **[Beginner] Predict the output:** Trace `1 + 2 + "3"`, `"1" + 2 + 3`, `"10" - 1`, and `"10" < "2"`.
   - **Expected answer shape:** Show operator order, conversions, intermediate values, final values, and final types.
   - **Follow-up:** Rewrite each expression so a reviewer can see the intended operation without relying on coercion.

3. **[Mid] Implementation:** Implement a strict parser for a query parameter that accepts only decimal digits and returns a bounded integer.
   - **Expected answer shape:** Define the grammar, reject whitespace and signs if required, convert explicitly, and check safe range and bounds.
   - **Follow-up:** How would you support a negative range without accidentally accepting `-0` when it has special meaning?

4. **[Mid] Debugging:** A feature flag stored as the string `"false"` enables a dangerous feature in production. Diagnose the exact language behavior and design the boundary fix.
   - **Expected answer shape:** Explain string truthiness, show explicit accepted representations, and place validation before use.
   - **Follow-up:** How would you handle configuration reloads without creating inconsistent decisions across requests?

5. **[Senior] Design:** Compare `||`, `??`, a schema validator, and explicit conditional logic for configuration defaults.
   - **Expected answer shape:** Discuss semantics, readability, invalid input handling, observability, and operational failure policy.
   - **Follow-up:** When is failing startup better than silently applying a default?
