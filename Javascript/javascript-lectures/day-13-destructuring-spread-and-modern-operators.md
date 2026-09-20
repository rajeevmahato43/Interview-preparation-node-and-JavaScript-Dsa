# Day 13: Destructuring, Spread, Rest, and Modern Operators

<nav aria-label="Lecture navigation">

[Previous: Arrays, Strings, Numbers, `Map`, `Set`, and JSON](day-12-built-in-data-structures-and-serialization.md) | [Roadmap](../javascript-roadmap.md) | [Next: Iterables, Iterators, Generators, and Symbols](day-14-iterables-iterators-generators-and-symbols.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Read values with array and object destructuring.
- Use defaults, renaming, nested patterns, rest, and spread.
- Explain why spread creates shallow copies.
- Use optional chaining and nullish coalescing without hiding bugs.
- Preserve meaningful falsy values during input normalization.
- Explain evaluation order and common invalid forms.

## Prerequisites

Read [Day 09: Objects and Property Access](day-09-objects-and-property-access.md), [Day 12: Built-in Data Structures and Serialization](day-12-built-in-data-structures-and-serialization.md), and [Day 04: Coercion, Equality, and Operators](day-04-coercion-equality-and-operators.md).

## Core Concepts

### Array destructuring

```js
const coordinates = [10, 20, 30];
const [x, y] = coordinates;
const [, , z] = coordinates;
console.log(x, y, z); // 10 20 30
```

Destructuring reads positions. A missing position produces `undefined`.

### Object destructuring

```js
const user = { name: "Asha", role: "admin" };
const { name, role: accessLevel } = user;
console.log(name, accessLevel); // "Asha" "admin"
```

Object patterns use property names. Renaming changes the local binding, not the object property.

### Defaults apply only to `undefined`

```js
const input = { limit: null, offset: 0 };
const { limit = 20, offset = 5 } = input;
console.log(limit, offset); // null 0
```

Defaults do not replace `null`, `false`, `0`, or an empty string. This is useful when those values have meaning.

### Rest and spread

Rest collects remaining values. Spread expands values into a new array, object, or argument list.

```js
const [first, ...remaining] = [1, 2, 3];
const copy = { ...{ name: "Asha" }, active: true };
console.log(first, remaining); // 1 [2, 3]
console.log(copy); // { name: "Asha", active: true }
```

Object spread copies enumerable own properties. It is shallow.

## Detailed Explanations and Traces

### Evaluation order and defaults

```js
function readValue() {
  console.log("default evaluated");
  return 10;
}

const { present = readValue(), missing = readValue() } = { present: 0 };
console.log(present, missing); // 0 10
```

The default for `present` is not evaluated because `0` is not `undefined`. The default for `missing` is evaluated.

### Nested destructuring needs safe input

```js
const request = { user: { name: "Mina" } };
const { user: { name } } = request;
console.log(name); // "Mina"
```

This throws if `request.user` is `null` or `undefined`. For external input, normalize first or use optional chaining where absence is allowed.

### Spread does not deep-copy

```js
const original = { options: { retries: 2 } };
const copy = { ...original };
copy.options.retries = 5;
console.log(original.options.retries); // 5
```

The outer object is new, but `options` is the same nested object. Use a deliberate nested copy for known shapes.

### Optional chaining and nullish coalescing

```js
const response = { body: { count: 0 } };
const count = response.body?.count ?? 10;
console.log(count); // 0
```

`?.` stops a property, call, or index operation when the value before it is `null` or `undefined`. `??` uses the fallback only for `null` or `undefined`; `||` also treats `0`, `false`, and `""` as missing.

Do not combine `??` with `||` or `&&` without parentheses because the grammar rejects ambiguous mixing.

```js
const value = (input ?? fallback) || finalFallback;
```

### Logical assignment

```js
const settings = { retries: 0 };
settings.retries ??= 3;
settings.timeout ||= 1000;
console.log(settings); // { retries: 0, timeout: 1000 }
```

`??=` preserves `0`; `||=` replaces it because `0` is falsy. Choose based on the meaning of the input.

### Template literals are expressions

```js
const name = "Asha";
const message = `Hello, ${name}!`;
console.log(message); // "Hello, Asha!"
```

Interpolation evaluates an expression. Template literals do not automatically escape HTML, SQL, shell commands, or logs; output safety still belongs to the target context.

## Examples and Traces

### Normalizing request input

```js
function normalizeOptions(input = {}) {
  const {
    limit = 20,
    offset = 0,
    filters: { status = "all" } = {},
  } = input;

  return {
    limit,
    offset,
    status,
  };
}

console.log(normalizeOptions({ limit: 0, filters: {} }));
// { limit: 0, offset: 0, status: "all" }
```

The nested default handles a missing `filters` object. Validation is still needed for negative limits or incorrect types.

### Safe update with a computed key

```js
function updateField(record, field, value) {
  return { ...record, [field]: value };
}

const original = { name: "Asha", active: true };
const updated = updateField(original, "active", false);
console.log(original.active, updated.active); // true false
```

This is a shallow immutable update. If `record` has nested mutable values, those nested references remain shared.

## Node.js Connection

Destructuring and spread are common in service code, but their shallow ownership behavior can share mutable request or configuration state.

## Common Mistakes and Interview Traps

- Thinking defaults replace every falsy value.
- Calling nested destructuring on possibly null input.
- Believing spread is a deep clone.
- Using `||` for numeric settings where `0` is valid.
- Forgetting parentheses when mixing `??` with `||` or `&&`.
- Assuming optional chaining validates that a value exists.
- Spreading untrusted objects into privileged configuration.
- Confusing rest syntax with spread syntax; their position and direction differ.

## Tricky Points

- Destructuring assignment into existing variables needs parentheses because `{}` can be parsed as a block.
- A default expression runs only when the matched value is `undefined`.
- Optional chaining short-circuits one continuous chain; grouping can change behavior.
- Object spread invokes property reads and can interact with getters.

## Practical Exercise

**Goal:** Normalize search options.

**Inputs and outputs:** Accept optional `{ page, pageSize, filters, includeArchived }` and return validated, normalized values.

**Constraints:** Preserve `page: 0` and `includeArchived: false` until validation rejects them if the domain disallows them. Do not mutate input.

**Edge cases:** `null`, missing nested filters, empty strings, zero, false, and extra fields.

**Acceptance criteria:** Use destructuring and nullish operators deliberately, explain every default, and show that nested input is not accidentally mutated.

## Summary

- Destructuring reads array positions or object properties into bindings.
- Defaults apply only when the matched value is `undefined`.
- Rest collects remaining values; spread expands values.
- Spread copies only one level of object or array structure.
- Optional chaining handles allowed nullish absence; it is not validation.
- `??` preserves meaningful falsy values such as `0` and `false`.
- Modern syntax remains subject to evaluation order and getter side effects.

## Cheat Sheet

| Syntax | Main meaning |
|---|---|
| `const { name } = user` | Read object property |
| `const { name: displayName }` | Rename local binding |
| `{ limit = 20 }` | Default only for `undefined` |
| `[first, ...rest]` | Collect remaining array values |
| `{ ...record }` | Shallow object copy |
| `value?.name` | Stop on nullish base |
| `value ?? fallback` | Fallback only for null/undefined |
| `value || fallback` | Fallback for any falsy value |
| `value ??= fallback` | Nullish logical assignment |

## Interview Questions

1. **Definition:** Explain the difference between rest and spread with array and object examples.
   - Expected answer: Rest collects remaining values in a pattern; spread expands an iterable or enumerable object into a new context.
   - Follow-up: Why does object spread not copy inherited properties?

2. **Trace:** Predict the output:

   ```js
   const value = { count: 0, name: "" };
   const { count = 10, name = "unknown" } = value;
   console.log(count, name);
   ```
   - Expected answer: `0 ""`; defaults are not used for defined falsy values.
   - Follow-up: What would `value.count || 10` return?

3. **Implementation:** Normalize a nested request without throwing when optional sections are absent.
   - Expected answer: Use safe defaults, explicit validation, preserve valid falsy values, and avoid mutating or blindly spreading input.
   - Follow-up: How would you prevent prototype-related keys from entering the result?

4. **Debugging:** A spread-based update unexpectedly changes the old state. Find the alias and repair only the necessary level.
   - Expected answer: Identify the shared nested reference and copy that nested object or use a chosen immutable update strategy.
   - Follow-up: What is the cost of recursively copying the whole input?

5. **Design:** Review a configuration loader using `||` for every default. Explain production bugs it can cause and propose tests.
   - Expected answer: Discuss false, zero, empty strings, nullish semantics, validation, compatibility, and table-driven tests.
   - Follow-up: Which values should be rejected rather than defaulted?

