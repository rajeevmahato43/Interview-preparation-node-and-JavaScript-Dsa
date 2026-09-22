# Day 11: Property Descriptors, Enumerability, and Immutability

<nav aria-label="Lecture navigation">

[Previous: Prototypes, Classes, and Inheritance](day-10-prototypes-classes-and-inheritance.md) | [Roadmap](../javascript-roadmap.md) | [Next: Arrays, Strings, Numbers, `Map`, `Set`, and JSON](day-12-built-in-data-structures-and-serialization.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain writable, enumerable, and configurable property attributes.
- Inspect and define properties safely.
- Compare preventing extensions, sealing, and freezing.
- Explain why `Object.freeze` is shallow.
- Choose between mutation, copying, and defensive boundaries.
- Describe JavaScript property-order rules without relying on vague folklore.

## Prerequisites

Read [Day 09: Objects and Property Access](day-09-objects-and-property-access.md) and [Day 10: Prototypes, Classes, and Inheritance](day-10-prototypes-classes-and-inheritance.md).

## Core Concepts

### 1. A property has more than a value

For a normal data property, JavaScript stores a value and attributes:

- `writable`: whether assignment may change the value.
- `enumerable`: whether common enumeration includes the property.
- `configurable`: whether the property can be deleted or reconfigured.

```js
const account = { name: "Asha" };
console.log(Object.getOwnPropertyDescriptor(account, "name"));
// { value: "Asha", writable: true, enumerable: true, configurable: true }
```

The exact object display can differ between tools, but the attributes have these meanings.

### 2. Define properties explicitly

```js
const settings = {};
Object.defineProperty(settings, "environment", {
  value: "production",
  writable: false,
  enumerable: true,
  configurable: false,
});

console.log(settings.environment); // "production"
console.log(Object.keys(settings)); // ["environment"]
```

When `Object.defineProperty` creates a property, unspecified descriptor attributes default to `false` for a data property. This is a common interview trap.

### 3. Accessor descriptors

A property can use `get` and `set` instead of storing a direct value.

```js
const user = {
  firstName: "Asha",
  lastName: "Roy",
};

Object.defineProperty(user, "fullName", {
  enumerable: true,
  configurable: true,
  get() {
    return `${this.firstName} ${this.lastName}`;
  },
});

console.log(user.fullName); // "Asha Roy"
```

A descriptor cannot mix a data value such as `value` with accessor fields such as `get` and `set`.

## Detailed Explanations and Traces

### Writable is about assignment, not deep immutability

```js
const profile = {};
Object.defineProperty(profile, "name", {
  value: "Asha",
  writable: false,
  enumerable: true,
  configurable: true,
});

profile.name = "Mina";
console.log(profile.name); // "Asha" in non-strict code; strict code throws
```

In strict mode, assigning to a non-writable property throws a `TypeError`. In non-strict code, the assignment may be ignored. Do not depend on silent failure; strict mode gives a clearer signal.

### Enumerable controls common listing and copying

```js
const record = { visible: 1 };
Object.defineProperty(record, "hidden", {
  value: 2,
  enumerable: false,
});

console.log(Object.keys(record)); // ["visible"]
console.log({ ...record }); // { visible: 1 }
console.log(Object.getOwnPropertyNames(record)); // ["visible", "hidden"]
```

Non-enumerable does not mean private or inaccessible. It only changes particular enumeration operations.

### Configurable is a one-way boundary

A non-configurable property cannot normally be deleted or redefined. It may still be writable if it was created that way.

```js
const item = {};
Object.defineProperty(item, "id", {
  value: 10,
  writable: true,
  enumerable: true,
  configurable: false,
});

item.id = 11;
console.log(item.id); // 11
// delete item.id; // false in non-strict code; TypeError in strict code
```

Making a property non-configurable is a strong decision. Libraries should avoid surprising consumers with irreversible property changes.

### Preventing extensions, sealing, and freezing

```js
const first = { nested: { enabled: true } };
Object.preventExtensions(first);
// first.extra = 1; // rejected or ignored depending on strictness

const second = { value: 1 };
Object.seal(second);
// delete second.value; // rejected or ignored
second.value = 2; // existing writable property can change

const third = { value: 1 };
Object.freeze(third);
// third.value = 2; // rejected or ignored
```

- `preventExtensions` stops new own properties.
- `seal` also makes existing properties non-configurable.
- `freeze` also makes data properties non-writable.

All three are shallow operations.

### Shallow freeze and nested state

```js
const configuration = {
  port: 3000,
  database: { host: "localhost" },
};

Object.freeze(configuration);
configuration.database.host = "db.internal";

console.log(configuration.database.host); // "db.internal"
```

The outer object is frozen, but the nested object was not frozen. A deep-freeze helper must handle cycles, special objects, and policy decisions. Blindly freezing every reachable object can break libraries or make legitimate updates impossible.

### Property order

For ordinary own-property enumeration, integer-index-like string keys are generally listed first in ascending numeric order, then other string keys in insertion order, then symbol keys in insertion order.

```js
const values = { b: 1, 2: "two", 1: "one", a: 3 };
console.log(Object.keys(values)); // ["1", "2", "b", "a"]
```

Use this as a language rule for ordinary enumeration, but do not design important business logic around object ordering when a `Map` communicates ordered entries more clearly.

## Examples and Traces

### Defensive copying at an API boundary

```js
function createOptions(input) {
  const options = {
    retries: input.retries ?? 3,
    headers: { ...(input.headers ?? {}) },
  };
  return Object.freeze(options);
}

const input = { retries: 2, headers: { trace: "on" } };
const options = createOptions(input);
input.headers.trace = "off";

console.log(options.headers.trace); // "on"
```

The top-level object is frozen and the nested headers object is copied. This is a deliberate shallow boundary for this particular shape, not a universal deep-freeze solution.

## Node.js Connection

Configuration and shared service state need explicit ownership because freezing is shallow and does not freeze collection contents.

---

## Compare & Recall

| Concept A | Concept B | Key difference |
|---|---|---|
| `const` binding | `Object.freeze` | `const` prevents the variable from pointing to a new object. `freeze` prevents the object's **own properties** from being changed. They are independent. |
| `Object.freeze` | Deep freeze | `Object.freeze` is **shallow** — it freezes only the object itself, not nested objects. `nested.property` can still change. |
| `preventExtensions` | `seal` | `preventExtensions`: no new properties added. `seal`: no new properties AND no deleting or reconfiguring existing ones. Both still allow changing writable values. |
| `seal` | `freeze` | `seal` = no adding/deleting. `freeze` = seal + no value changes. `freeze` is the strongest of the three. |
| `enumerable: false` | Private / inaccessible | Non-enumerable is **not** private. `Object.getOwnPropertyDescriptor` and direct access still work. It just hides from `Object.keys`, `for...in`, and spread. |
| `writable: false` | `configurable: false` | `writable` controls assignment. `configurable` controls deletion and redefinition. A property can be writable but not configurable, or vice versa. |
| Descriptor defaults (literal) | Descriptor defaults (defineProperty) | Properties created via `{ key: value }` get `writable/enumerable/configurable = true`. Properties created via `Object.defineProperty` with omitted attrs get **false** for each omitted one. |

> **Cross-day links:** `const` binding vs mutation is in [Day 02](day-02-variables-scope-and-hoisting.md). `Object.create` and object structures are in [Day 09](day-09-objects-and-property-access.md). Prototype chain effects on property lookup are in [Day 10](day-10-prototypes-classes-and-inheritance.md).

## Common Mistakes and Interview Traps

- Assuming `Object.freeze` recursively freezes nested objects.
- Forgetting descriptor defaults when using `Object.defineProperty`.
- Confusing non-enumerable with private.
- Believing a non-writable property cannot be deleted when it is still configurable.
- Using `Object.seal` when updates to existing values should be prohibited.
- Treating a frozen object as safe when it contains mutable class instances, maps, sets, or buffers.
- Assuming all objects have the same property-order behavior as `Map`.

## Tricky Points

- Strict and non-strict assignment failures differ.
- A property can be non-configurable but still writable.
- Accessor properties have `get` and `set`, not `value` and `writable`.
- Freezing a `Map` does not make entries immutable; the map can still be mutated through `.set`.

## Practical Exercise

**Goal:** Build a protected configuration object.

**Inputs and outputs:** A function receives `{ port, database: { host, poolSize } }` and returns a configuration object that cannot have its top-level fields reassigned or removed.

**Constraints:** Preserve the nested database values through a defensive copy. Do not mutate the input.

**Edge cases:** Missing `database`, `poolSize: 0`, extra input properties, and attempted mutation in strict mode.

**Acceptance criteria:** Show descriptors for the top-level fields, demonstrate what `freeze` protects, and explain what remains mutable.

## Summary

- Property descriptors control writing, listing, and reconfiguration.
- `defineProperty` has strict defaults when attributes are omitted.
- `preventExtensions`, `seal`, and `freeze` provide progressively stronger shallow restrictions.
- Freezing the outer object does not freeze nested objects or collection contents.
- Defensive copying and immutability are ownership decisions, not magic security guarantees.
- Ordinary property enumeration has defined ordering rules, but `Map` is often clearer for ordered data.

## Cheat Sheet

| Operation | Main effect |
|---|---|
| `preventExtensions` | No new own properties |
| `seal` | No new properties; no deletion/reconfiguration |
| `freeze` | Sealed plus non-writable data properties |
| `enumerable: false` | Hidden from common enumeration, not private |
| `writable: false` | Assignment cannot change the value |
| `configurable: false` | Cannot normally delete/reconfigure |
| `Object.keys` | Enumerable own string keys |
| `Object.getOwnPropertyNames` | Own string keys, including non-enumerable |
| `Object.getOwnPropertySymbols` | Own symbol keys |

**vs. quick reference**

| | `preventExtensions` | `seal` | `freeze` |
|---|---|---|---|
| No new properties | ✓ | ✓ | ✓ |
| No deletion | ✗ | ✓ | ✓ |
| No reconfiguration | ✗ | ✓ | ✓ |
| No value change | ✗ | ✗ | ✓ |
| Nested objects affected | ✗ | ✗ | ✗ |

| Descriptor attribute | Default via `{}` literal | Default via `defineProperty` (if omitted) |
|---|---|---|
| `writable` | `true` | `false` |
| `enumerable` | `true` | `false` |
| `configurable` | `true` | `false` |

## Interview Questions

> Difficulty guide: **[Beginner]** = entry-level, **[Mid]** = requires understanding of internals, **[Senior]** = design and tradeoff thinking expected.

1. **[Beginner] Definition:** Compare `writable`, `enumerable`, and `configurable` using one property descriptor.
   - Expected answer: Define each attribute and explain assignment, enumeration, deletion, and redefinition separately.
   - Follow-up: Which attributes are created as `false` by `defineProperty` when omitted?

2. **[Mid] Trace:** What happens here in strict mode?

   ```js
   "use strict";
   const value = { nested: { count: 1 } };
   Object.freeze(value);
   value.nested.count = 2;
   value.extra = true;
   ```
   - Expected answer: Nested mutation succeeds because the nested object is not frozen; adding `extra` throws.
   - Follow-up: What changes after freezing `value.nested` too?

3. **[Senior] Implementation:** Design a deep-freeze helper for plain objects that handles cycles.
   - Expected answer: State supported value types, use a visited set, explain arrays and descriptors, and identify cases not covered.
   - Follow-up: Why might deep freezing be the wrong production default?

4. **[Mid] Debugging:** A library breaks after the application freezes a shared `Map`. Explain why freezing did not prevent `.set` and why the library might still fail after a different freeze strategy.
   - Expected answer: Internal collection state is not ordinary enumerable properties; discuss ownership and API contracts.
   - Follow-up: Would copying the map solve the ownership problem?

5. **[Senior] Design:** Choose between mutable state, shallow copies, deep copies, and persistent data structures for a high-throughput Node request pipeline.
   - Expected answer: Compare allocation cost, aliasing risk, payload size, concurrency, observability, and workload assumptions.
   - Follow-up: Which measurements would validate the decision?

