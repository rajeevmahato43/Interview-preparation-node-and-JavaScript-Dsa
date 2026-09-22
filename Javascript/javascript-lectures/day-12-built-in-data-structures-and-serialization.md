# Day 12: Arrays, Strings, Numbers, `Map`, `Set`, and JSON

<nav aria-label="Lecture navigation">

[Previous: Property Descriptors, Enumerability, and Immutability](day-11-property-descriptors-and-immutability.md) | [Roadmap](../javascript-roadmap.md) | [Next: Destructuring, Spread, and Modern Operators](day-13-destructuring-spread-and-modern-operators.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain dense and sparse arrays and the meaning of `length`.
- Choose array methods while understanding mutation and empty.
- Avoid common number precision and sorting mistakes.
- Compare objects, arrays, `Map`, and `Set` for lookup and uniqueness.
- Explain important string and Unicode edge cases.
- Predict what JSON preserves, changes, or removes.

## Prerequisites

Read [Day 03: Values, Types, and Literals](day-03-values-types-and-literals.md), [Day 04: Coercion, Equality, and Operators](day-04-coercion-equality-and-operators.md), and [Day 09: Objects and Property Access](day-09-objects-and-property-access.md).

## Core Concepts

### 1. Arrays are objects with indexed properties

An array has numeric-index-like properties and a special `length` value.

```js
const colors = ["red", "green"];
colors.push("blue");
console.log(colors.length); // 3
console.log(colors[1]); // "green"
```

Array indexes are property keys. The `length` is one more than the highest valid array index in the usual dense case. Setting a large index can create a sparse array.

```js
const values = [];
values[3] = "fourth";
console.log(values.length); // 4
console.log(0 in values); // false
console.log(values); // [ <3 empty items>, "fourth" ] in common Node output
```

A Empty is different from an element whose value is `undefined`.

### 2. Mutation and iteration methods

Methods such as `push`, `pop`, `splice`, `sort`, and `reverse` mutate an array. Methods such as `map`, `filter`, and `slice` return new arrays, though the values inside may still be shared references.

```js
const numbers = [3, 1, 2];
const sorted = [...numbers].sort((left, right) => left - right);

console.log(numbers); // [3, 1, 2]
console.log(sorted); // [1, 2, 3]
```

Copy before sorting when the original order matters. The default sort compares strings, so `[10, 2].sort()` becomes `[10, 2]` in displayed numeric order? More exactly, it compares `"10"` and `"2"`, producing `[10, 2]`; use a numeric comparator for numeric sorting.

### 3. Strings and Unicode

Strings are sequences of UTF-16 code units. A visible character can use one or more code units.

```js
const word = "\u{1F60A}";
console.log(word.length); // 3: "A" uses 1 code unit; the emoji uses 2
console.log([...word].length); // 2 code points
```

Spread and `for...of` iterate by code point, which is often closer to a user's idea of a character. Grapheme clusters, such as a letter plus a combining mark or an emoji sequence, can still contain multiple code points. User-visible text processing may need a specialized Unicode-aware approach.

### 4. Numbers, `NaN`, and `BigInt`

JavaScript's ordinary `number` uses floating-point representation.

```js
console.log(0.1 + 0.2 === 0.3); // false
console.log(Number.isNaN(NaN)); // true
console.log(Number.isSafeInteger(9007199254740991)); // true
console.log(Number.isSafeInteger(9007199254740992)); // false
```

For integers larger than the safe integer range, use `BigInt` when the surrounding APIs support it.

```js
const largeId = 9007199254740993n;
console.log(largeId + 2n); // 9007199254740995n
// largeId + 2; // TypeError: cannot mix BigInt and number
```

JSON does not directly support `BigInt`; converting it requires a deliberate representation such as a string.

### 5. `Map` and `Set`

Use `Map` for key-value associations and `Set` for unique values.

```js
const visits = new Map();
visits.set("Asha", 3);
visits.set("Mina", 5);
console.log(visits.get("Asha")); // 3
console.log(visits.has("Mina")); // true

const uniqueTags = new Set(["js", "node", "js"]);
console.log([...uniqueTags]); // ["js", "node"]
```

`Map` keys can be objects, functions, or primitives. Object keys use identity:

```js
const firstKey = {};
const secondKey = {};
const values = new Map([[firstKey, "first"]]);
console.log(values.get(secondKey)); // undefined
```

`Set` also uses value identity rules closely related to `SameValueZero`, so `NaN` can be found in a set.

### 6. JSON is a data format, not a full JavaScript clone

```js
const data = {
  name: "Asha",
  missing: undefined,
  calculate() {},
  amount: NaN,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
};

const text = JSON.stringify(data);
console.log(text);
// {"name":"Asha","amount":null,"createdAt":"2025-01-01T00:00:00.000Z"}
```

`undefined` properties and functions are omitted from objects. `NaN` becomes `null`. Dates use their string representation. Prototypes, symbols, `Map`, `Set`, and `BigInt` need special treatment.

## Detailed Explanations and Traces

### Sparse arrays and callback methods

Many array callback methods skip empty.

```js
const sparse = [];
sparse[2] = "value";

const mapped = sparse.map((item, index) => `${index}:${item}`);
console.log(0 in mapped); // false
console.log(2 in mapped); // true
console.log(mapped.length); // 3
```

The result still has a empty at index 0. A `for...of` loop behaves differently because it reads each index position and produces `undefined` for a empty.

```js
for (const item of sparse) {
  console.log(item); // undefined, undefined, "value"
}
```

Do not rely on sparse arrays for ordinary application data; they make iteration and memory behavior less obvious.

### Lookup choices

```js
const users = [
  { id: "u1", name: "Asha" },
  { id: "u2", name: "Mina" },
];

const userById = new Map(users.map((user) => [user.id, user]));
console.log(userById.get("u2").name); // "Mina"
```

Searching the array is $O(n)$ per lookup. Building a map costs $O(n)$ up front and gives expected $O(1)$ lookup under normal hash-table assumptions. The memory cost is higher, and the best choice depends on the number of lookups and update pattern.

### JSON round-trip is lossy

```js
const original = {
  numbers: new Set([1, 2]),
  values: [undefined, NaN],
};
const restored = JSON.parse(JSON.stringify(original));

console.log(restored); // { numbers: {}, values: [null, null] }
```

Do not use JSON cloning as a universal deep-copy method. It loses types, special values, prototypes, undefined values, and possible relationships.

### Replacer and reviver

A replacer can define how values are encoded, and a reviver can rebuild values while parsing.

```js
const payload = { id: 12n };
const text = JSON.stringify(payload, (key, value) =>
  typeof value === "bigint" ? value.toString() : value,
);
const restored = JSON.parse(text, (key, value) =>
  key === "id" ? BigInt(value) : value,
);

console.log(text); // {"id":"12"}
console.log(restored.id); // 12n
```

The schema must tell the parser that the string represents a `BigInt`; blindly converting every numeric-looking string could corrupt normal data.

## Node.js Connection

Arrays, maps, sets, numbers, and JSON shape request payloads, in-memory indexes, identifiers, logs, and service responses.

---

## Compare & Recall

| Concept A | Concept B | Key difference |
|---|---|---|
| Plain object `{}` as lookup | `Map` | Object keys must be strings/symbols; has inherited prototype keys (risk). `Map` accepts any key type (including objects), has `.size`, preserves insertion order cleanly, and no prototype key conflicts. |
| Array | `Set` | Array preserves order and allows duplicates. `Set` stores only unique values (by `SameValueZero`) and gives expected O(1) `.has()`. Use `Set` when uniqueness matters. |
| `Map` | `WeakMap` | `Map` keeps strong references (prevents GC). `WeakMap` uses weak references (allows GC when key has no other references) and is non-iterable. Use `WeakMap` for private data keyed to objects. |
| `sort()` (default) | `sort((a,b) => a-b)` | Default sort converts values to strings (`[10, 2]` sorts as `[10, 2]` not `[2, 10]`!). Always pass a numeric comparator for numbers. |
| `string.length` | `[...string].length` | `.length` counts UTF-16 code units. `[...string].length` counts code points. For emoji/multi-byte characters, they differ: `"\u{1F60A}".length === 2` but `[..."\u{1F60A}"].length === 1`. |
| JSON `undefined` | JSON `null` | JSON omits `undefined` properties from objects and converts `undefined` in arrays to `null`. They are not equivalent after a round-trip. |
| `NaN === NaN` | `Set.has(NaN)` | `NaN !== NaN` under `===`. But `Set` uses `SameValueZero` and **can** store and find `NaN` correctly. |

> **Cross-day links:** Object property rules are in [Day 09](day-09-objects-and-property-access.md). `for...of` iteration across these structures is in [Day 05](day-05-control-flow-and-loops.md). Iterables and custom iteration protocols are in [Day 14](day-14-iterables-iterators-generators-and-symbols.md).

## Common Mistakes and Interview Traps

- Forgetting that default `sort()` compares strings.
- Assuming a empty is the same as an explicit `undefined` element.
- Mixing `BigInt` and `number` in arithmetic.
- Using `Number.isNaN` incorrectly with values that are not numbers.
- Assuming `Map` object keys are compared by object contents instead of identity.
- Treating JSON serialization as a lossless clone.
- Assuming string `.length` equals the number of visible characters.
- Mutating an input array with `sort` when callers expect it to remain unchanged.

## Tricky Points

- `NaN` is not equal to itself with `===`, but `Set` and `Map` can recognize it.
- `-0` and `0` have subtle identity differences in some comparisons.
- `JSON.stringify` can throw for an unhandled `BigInt`.
- A `Map` or `Set` can be frozen as an object while its entries remain mutable.

## Practical Exercise

**Goal:** Build a product lookup and serialization layer.

**Inputs and outputs:** Receive an array of products with `id`, `name`, `tags`, and `price`; remove duplicate IDs, build a lookup map, and serialize a response.

**Constraints:** Preserve insertion order, reject unsafe numeric prices, and avoid mutating the input array.

**Edge cases:** Duplicate IDs, sparse input, `NaN`, unsafe integer IDs, empty tags, and a `BigInt` identifier.

**Acceptance criteria:** Explain the data-structure choices, state expected complexity, show JSON output, and document how unsupported values are represented.

## Summary

- Arrays are objects with indexed properties and a `length` value.
- Empty behave differently from explicit `undefined` values.
- Copy before mutating with methods such as `sort` when the original matters.
- JavaScript numbers have precision limits; `BigInt` has separate arithmetic rules.
- `Map` is for key-value lookup and `Set` is for uniqueness.
- String length counts UTF-16 code units, not always visible characters.
- JSON is a limited interchange format and loses several JavaScript values.

## Cheat Sheet

| Need | Good starting choice |
|---|---|
| Ordered list | Array |
| Unique values | `Set` |
| Key-value lookup with arbitrary key types | `Map` |
| JSON-compatible transport | Plain objects, arrays, strings, numbers, booleans, `null` |
| Numeric sort | `values.sort((left, right) => left - right)` |
| Check `NaN` | `Number.isNaN(value)` |
| Large integer | `BigInt`, with an explicit serialization policy |
| Count code points | `[...text].length` |

**vs. quick reference**

| | Array | `Set` | `Map` | Plain object |
|---|---|---|---|---|
| Keys/index | Numeric index | N/A (values only) | Any type | String or symbol |
| Allows duplicates | ✓ | ✗ | ✓ (keys unique) | ✓ (keys unique) |
| Has `.size` | ✗ (use `.length`) | ✓ | ✓ | ✗ |
| Iterable with `for...of` | ✓ | ✓ | ✓ (.entries/.keys/.values) | ✗ (use Object.entries) |
| Prototype key conflicts | ✗ | N/A | ✗ | ✓ risk |

| Value in JSON | Result after `stringify` |
|---|---|
| `undefined` (object property) | Omitted |
| `undefined` (array element) | `null` |
| `NaN` | `null` |
| `Date` | ISO string |
| `Map`, `Set` | `{}` or `[]` (empty — data lost) |
| `BigInt` | Throws unless replacer handles it |

## Interview Questions

> Difficulty guide: **[Beginner]** = entry-level, **[Mid]** = requires understanding of internals, **[Senior]** = design and tradeoff thinking expected.

1. **[Mid] Definition:** Compare an array, object, `Map`, and `Set` for a product lookup problem.
   - Expected answer: Discuss keys, ordering, uniqueness, lookup assumptions, memory, and mutation.
   - Follow-up: How would the answer change for ten lookups versus ten million lookups?

2. **[Beginner] Trace:** Predict the result:

   ```js
   const values = [];
   values[2] = undefined;
   console.log(values.length, 0 in values, 2 in values);
   console.log(values.map((value) => value ?? "missing").length);
   ```
   - Expected answer: `3 false true`, and the mapped result still has length 3 with empty preserved at skipped positions.
   - Follow-up: What would `Array.from(values, ...)` do differently?

3. **[Senior] Implementation:** Design a serializer for objects containing `BigInt`, `Date`, `Map`, and `Set`.
   - Expected answer: Define a tagged schema, avoid ambiguous strings, handle cycles or reject them, and test round trips.
   - Follow-up: How would you version the schema?

4. **[Beginner] Debugging:** A report is sorted incorrectly because `10` appears before `2`. Diagnose it and preserve the caller's original order.
   - Expected answer: Default sort is string-based and mutating; copy then use a numeric comparator.
   - Follow-up: How should invalid numeric values be handled?

5. **[Senior] Design:** A Node API must return IDs larger than the safe integer range and remain compatible with existing clients.
   - Expected answer: Discuss string representation, schema compatibility, validation, database boundaries, precision, migration, and observability.
   - Follow-up: What tests would detect a client silently converting the string back to a number?

