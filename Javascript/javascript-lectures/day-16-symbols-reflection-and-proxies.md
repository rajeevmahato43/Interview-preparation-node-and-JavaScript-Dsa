# Day 16: Symbols, Reflection, Proxies, and Metaprogramming

<nav aria-label="Lecture navigation">

[Previous: Regular Expressions and Text Processing](day-15-regular-expressions-and-text-processing.md) | [Roadmap](../javascript-roadmap.md) | [Next: Modules and Module Interoperability](day-17-modules-and-interoperability.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain symbols as unique property keys.
- Recognize well-known symbols such as `Symbol.iterator` and `Symbol.toStringTag`.
- Use `Reflect` for ordinary object operations.
- Describe proxy traps and the invariants they must respect.
- Identify when a proxy adds useful behavior and when it adds hidden complexity.

## Prerequisites

Read [Day 09: Objects and Property Access](day-09-objects-and-property-access.md), [Day 11: Property Descriptors and Immutability](day-11-property-descriptors-and-immutability.md), and [Day 14: Iterables, Iterators, Generators, and Symbols](day-14-iterables-iterators-generators-and-symbols.md). Day 14 used `Symbol.iterator`; this lecture focuses on symbols and metaprogramming more broadly.

## Core Concepts

### Symbols are unique primitive values

```js
const first = Symbol("id");
const second = Symbol("id");
console.log(first === second); // false
```

The descriptions are for debugging. They do not make symbols equal. Symbols are useful when a property key should avoid collisions with ordinary string keys.

```js
const internalId = Symbol("internalId");
const user = { name: "Asha", [internalId]: 42 };
console.log(user[internalId]); // 42
console.log(Object.keys(user)); // ["name"]
console.log(Object.getOwnPropertySymbols(user)); // [Symbol(internalId)]
```

A symbol property is not automatically private. Code that receives the object can discover symbols with reflection APIs.

### Well-known symbols customize language behavior

JavaScript defines symbols that protocols use. `Symbol.iterator` controls synchronous iteration. `Symbol.toStringTag` can affect the label returned by `Object.prototype.toString`.

```js
const value = {
  [Symbol.toStringTag]: "Report",
};
console.log(Object.prototype.toString.call(value)); // "[object Report]"
```

Customizing a well-known symbol changes observable behavior, so use it only when the object really follows the promised protocol.

### `Reflect` makes object operations explicit

```js
const user = { name: "Asha" };
Reflect.set(user, "active", true);
console.log(Reflect.get(user, "name")); // "Asha"
console.log(Reflect.has(user, "active")); // true
console.log(Reflect.ownKeys(user)); // ["name", "active"]
```

Many `Reflect` methods return a useful success boolean instead of relying on assignment syntax. They also work naturally inside proxy traps.

## Detailed Explanations and Traces

### A proxy intercepts operations

A proxy wraps a target and a handler. The handler can intercept reads, writes, existence checks, and more.

```js
const target = { count: 1 };
const observed = new Proxy(target, {
  get(object, property, receiver) {
    console.log(`read: ${String(property)}`);
    return Reflect.get(object, property, receiver);
  },
  set(object, property, value, receiver) {
    if (property === "count" && !Number.isInteger(value)) {
      throw new TypeError("count must be an integer");
    }
    return Reflect.set(object, property, value, receiver);
  },
});

console.log(observed.count); // logs read: count, then 1
observed.count = 2;
```

Forwarding with `Reflect` preserves ordinary behavior and receiver details. A trap that forgets to return the expected result can break the language operation.

### Common traps

Important traps include `get`, `set`, `has`, `deleteProperty`, `ownKeys`, `getOwnPropertyDescriptor`, `defineProperty`, `isExtensible`, and `preventExtensions`. A proxy does not magically intercept every internal engine action; it intercepts specified object operations.

### Proxy invariants

Proxies cannot freely lie about non-configurable properties. For example:

```js
const target = {};
Object.defineProperty(target, "id", {
  value: 1,
  configurable: false,
  writable: false,
});

const broken = new Proxy(target, {
  get() {
    return 2;
  },
});

// broken.id; // TypeError: proxy cannot report a different value here
```

The exact error text is runtime-specific, but the invariant is language-defined: a proxy must not contradict certain fixed target descriptors. Similar restrictions apply to `ownKeys`, non-extensibility, and descriptor traps.

### Proxies and identity

```js
const original = { value: 1 };
const wrapped = new Proxy(original, {});
console.log(wrapped === original); // false
console.log(wrapped.value); // 1
```

A proxy is a different identity. Maps, sets, weak collections, and libraries that use identity can observe the difference.

### `Reflect` and receiver behavior

```js
const parent = {
  get label() {
    return this.name;
  },
};
const child = Object.create(parent);
child.name = "child";

console.log(Reflect.get(parent, "label", child)); // "child"
```

The receiver argument determines the `this` value used by an accessor. Proxy traps should normally pass the receiver to `Reflect.get` and `Reflect.set` to preserve this behavior.

## Examples and Traces

### Read-only view

```js
function readOnlyView(target) {
  return new Proxy(target, {
    set() {
      throw new TypeError("read-only view");
    },
    deleteProperty() {
      throw new TypeError("read-only view");
    },
  });
}

const settings = readOnlyView({ mode: "safe" });
console.log(settings.mode); // "safe"
// settings.mode = "fast"; // TypeError
```

This protects writes through the proxy only. Code that still holds the original target can mutate it. A proxy is not a replacement for ownership control.

## Common Mistakes and Interview Traps

## Compare & Recall

| Concept A | Concept B | Key difference |
|---|---|---|
| `Symbol("name")` | String key | Two `Symbol("name")` calls produce **different** unique keys. Two strings `"name"` are always the same key. Use symbols when you need a key that is guaranteed collision-free. |
| Symbol key | "Private" | Symbol keys are not enumerable in `Object.keys` or `for...in`, but `Object.getOwnPropertySymbols()` still finds them. They are **not** truly private — just non-enumerable. Use `#privateField` for real privacy. |
| `Reflect.set(target, key, value, receiver)` | `target[key] = value` | Both do the same thing normally. `Reflect.set` returns a boolean (success/failure) and correctly handles the `receiver` for accessor properties. Always use `Reflect` inside Proxy traps. |
| Proxy | Object wrapper | A Proxy intercepts operations on a **target** object. It changes **identity** (proxy !== target). A plain wrapper is just an object that holds a reference and delegates manually. |
| Proxy invariant | Trap | A Proxy trap handles an operation (like `get`). An invariant is a **rule the trap must not violate** (e.g., you can't lie about a non-configurable property's value). Violations throw `TypeError`. |
| `Symbol.iterator` | Custom iteration | `Symbol.iterator` is the **standard** well-known symbol used by `for...of`. You implement it on your object to make it iterable. |

> **Cross-day links:** Well-known symbols and the iteration protocol are introduced in [Day 14](day-14-iterables-iterators-generators-and-symbols.md). Prototype-level object introspection is in [Day 10](day-10-prototypes-classes-and-inheritance.md). Security implications of Proxy and reflection are in [Day 25](day-25-security-relevant-javascript.md).

## Common Mistakes and Interview Traps

- Calling symbol properties private.
- Forgetting to include symbol keys in a complete property inspection.
- Returning the wrong value from a `set` trap.
- Violating non-configurable property invariants.
- Assuming a proxy preserves object identity.
- Believing a proxy intercepts access to the original target.
- Using a proxy where a normal function would be easier to understand and test.

## Tricky Points

- `Object.keys` excludes symbol keys; `Reflect.ownKeys` includes strings and symbols.
- Proxy traps can trigger other traps through reflective operations, so careless handlers can recurse.
- A proxy cannot make a non-extensible target appear extensible.
- A symbol description is not a stable identifier and can be absent.

## Practical Exercise

**Goal:** Build a validating object view.

**Inputs and outputs:** Wrap an object containing `name` and `age`; reject invalid writes and log reads.

**Constraints:** Forward valid operations with `Reflect`, preserve ordinary getter receiver behavior, and document target access.

**Edge cases:** Symbol keys, non-configurable properties, deleting a property, and writing through the original target.

**Acceptance criteria:** Demonstrate one valid write, one rejected write, one invariant that cannot be violated, and the limits of the wrapper.

## Summary

- Symbols are unique property-key values, not automatic private storage.
- Well-known symbols define language protocols.
- `Reflect` provides explicit, composable object operations.
- Proxies intercept selected operations around a target.
- Proxy handlers must respect invariants for fixed descriptors and extensibility.
- Proxies change identity and can add performance and debugging costs.

## Cheat Sheet

| API or term | Meaning |
|---|---|
| `Symbol("name")` | Creates a unique symbol |
| `Symbol.iterator` | Synchronous iteration hook |
| `Symbol.toStringTag` | Custom object tag |
| `Reflect.get` / `set` | Explicit property operations |
| `Reflect.ownKeys` | Own string and symbol keys |
| `Proxy` | Intercepts selected target operations |
| Proxy invariant | Rule a trap must not violate |
| `Object.getOwnPropertySymbols` | Own symbol keys only |

**vs. quick reference**

| | `Symbol` key | `String` key | `#private` field |
|---|---|---|---|
| Unique per creation | ✓ | ✗ (same string = same key) | N/A (scoped to class) |
| Enumerable in `Object.keys` | ✗ | ✓ | N/A |
| Discoverable with introspection | ✓ (`getOwnPropertySymbols`) | ✓ | ✗ (truly private) |
| Use case | Collision-free meta-keys | Normal data properties | True encapsulation |

| `Reflect` method | Equivalent to | Why prefer `Reflect` |
|---|---|---|
| `Reflect.get(t, k, r)` | `t[k]` | Returns value; consistent receiver |
| `Reflect.set(t, k, v, r)` | `t[k] = v` | Returns boolean (no silent failure) |
| `Reflect.ownKeys(t)` | `Object.keys + symbols` | One call for all own keys |
| `Reflect.has(t, k)` | `k in t` | Same, but function form |

## Interview Questions

> Difficulty guide: **[Beginner]** = entry-level, **[Mid]** = requires understanding of internals, **[Senior]** = design and tradeoff thinking expected.

1. **[Beginner] Definition:** Explain why two symbols with the same description are different.
   - Expected answer: The description is metadata; each symbol creation produces a unique primitive identity.
   - Follow-up: How can symbol properties still be discovered?

2. **[Mid] Trace:** Why does this proxy access fail?

   ```js
   const target = {};
   Object.defineProperty(target, "value", { value: 1, configurable: false });
   const proxy = new Proxy(target, { get: () => 2 });
   proxy.value;
   ```
   - Expected answer: The trap contradicts a fixed non-configurable, non-writable data property and violates a proxy invariant.
   - Follow-up: What if the property were configurable?

3. **[Senior] Implementation:** Create a proxy that validates writes while preserving setters on the target.
   - Expected answer: Use `Reflect.set` with the receiver, define accepted values, return a boolean or throw consistently, and test accessors.
   - Follow-up: Which traps must be coordinated if callers inspect descriptors?

4. **[Mid] Debugging:** A proxied object is missing from a `Map` lookup even though it wraps the original object.
   - Expected answer: Proxy and target have different identities; use a canonical identity policy or avoid wrapping keys.
   - Follow-up: How would weak references affect the design?

5. **[Senior] Design:** Decide whether to use proxies for request validation in a high-throughput Node service.
   - Expected answer: Compare explicit validation, proxy overhead, hidden behavior, target escape, error clarity, observability, and workload measurements.
   - Follow-up: What security boundary must still exist even with a proxy?

