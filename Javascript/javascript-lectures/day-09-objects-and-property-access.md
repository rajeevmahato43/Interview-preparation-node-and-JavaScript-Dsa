# Day 09: Objects and Property Access

<nav aria-label="Lecture navigation">

[Previous: Closures, Execution Context, and `this`](day-08-closures-execution-context-and-this.md) | [Roadmap](../javascript-roadmap.md) | [Next: Prototypes, Classes, and Inheritance](day-10-prototypes-classes-and-inheritance.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Create objects and read or write properties with dot, bracket, and computed access.
- Distinguish own properties from inherited properties.
- Explain why a missing property usually evaluates to `undefined`.
- Use `in`, `Object.hasOwn`, and descriptor-aware checks for different questions.
- Use getters, setters, method shorthand, spread, and destructuring carefully.
- Explain shallow copying and shared nested references.
- Recognize unsafe property paths and prototype pollution risks at a basic interview level.

## Prerequisites

Read [Day 03: Values, Types, and Literals](day-03-values-types-and-literals.md), [Day 04: Coercion, Equality, and Operators](day-04-coercion-equality-and-operators.md), and [Day 08: Closures, Execution Context, and `this`](day-08-closures-execution-context-and-this.md). Day 10 covers prototypes and classes in greater detail. Day 11 covers descriptors and immutability more deeply.

This lecture focuses on ordinary objects and property access. It introduces the prototype chain only enough to explain lookup and security boundaries.

## Core Concepts

### 1. Objects store keyed properties

An object is a collection of properties. A property has a key and a value, and a key is normally a string or symbol:

```js
const user = {
  name: "Asha",
  age: 24,
};

console.log(user.name);    // "Asha"
console.log(user["age"]);  // 24
```

Dot notation is convenient when the property name is a fixed identifier. Bracket notation is required for dynamic keys or names that are not valid identifier syntax:

```js
const field = "name";
console.log(user[field]); // "Asha"

const response = {
  "display-name": "Asha",
};
console.log(response["display-name"]); // "Asha"
```

A computed property name creates a key from an expression:

```js
const key = "status";
const record = {
  [key]: "ready",
};

console.log(record.status); // "ready"
```

### 2. Reading a missing property

Reading a missing ordinary property normally returns `undefined`; it does not immediately throw:

```js
const user = { name: "Asha" };

console.log(user.role); // undefined
```

The result does not tell you whether the property is absent or present with the value `undefined`:

```js
const first = {};
const second = { role: undefined };

console.log(first.role);  // undefined
console.log(second.role); // undefined
console.log("role" in first);  // false
console.log("role" in second); // true
```

If the base value is `null` or `undefined`, property access throws:

```js
const user = null;
// user.name; // TypeError
```

Optional chaining handles an accepted nullish base:

```js
console.log(user?.name); // undefined
```

It should not hide a required invariant. If a user must exist, fail with a clear validation or domain error instead of silently continuing.

### 3. Own properties and inherited properties

An **own property** belongs directly to the object. An inherited property is found through its prototype chain:

```js
const user = { name: "Asha" };

console.log(Object.hasOwn(user, "name"));      // true
console.log(Object.hasOwn(user, "toString"));  // false
console.log("toString" in user);               // true
```

`in` asks whether a property exists anywhere in the object or its prototype chain. `Object.hasOwn` asks only whether it is an own property.

When iterating user-controlled keys, own-property checks matter because inherited properties may not be part of the input data you intended to process.

### 4. Property lookup and the prototype chain

If an object does not have an own property, JavaScript looks at its prototype, then that prototype's prototype, until it finds a property or reaches `null`:

```js
const parent = { shared: "from parent" };
const child = Object.create(parent);
child.own = "from child";

console.log(child.own);    // "from child"
console.log(child.shared); // "from parent"
console.log(child.missing); // undefined
```

Assignment usually creates or changes an own property on the receiver:

```js
child.shared = "now on child";
console.log(child.shared); // "now on child"
console.log(parent.shared); // "from parent"
```

This is a preview of Day 10. The immediate lesson is that a read and a write can involve different objects in the chain.

### 5. Adding, updating, and deleting properties

Assignment adds a new own property or updates an existing writable property:

```js
const settings = {};
settings.retries = 3;
settings.retries = 4;

console.log(settings); // { retries: 4 }
```

`delete` removes an own property when it is configurable:

```js
delete settings.retries;
console.log(settings.retries); // undefined
```

Deleting a property is not the same as assigning `undefined`:

```js
const first = { value: undefined };
const second = { value: 1 };
delete second.value;

console.log(Object.hasOwn(first, "value"));  // true
console.log(Object.hasOwn(second, "value")); // false
```

Whether deletion is allowed depends on property descriptors. Day 11 explains that boundary.

### 6. Methods and `this`

Method shorthand creates a function-valued property:

```js
const cart = {
  items: [10, 20],
  total() {
    return this.items.reduce((sum, item) => sum + item, 0);
  },
};

console.log(cart.total()); // 30
```

The receiver is supplied by the call form. Extracting `cart.total` can lose `this`, as Day 8 explained. An arrow stored as an object property does not receive dynamic `this`:

```js
const incorrectCart = {
  items: [10, 20],
  total: () => this.items,
};
```

Use an ordinary method when the object should be the receiver, or pass state explicitly when that makes ownership clearer.

### 7. Getters and setters

A getter looks like a property read but runs a function:

```js
const account = {
  balance: 100,
  get isPositive() {
    return this.balance > 0;
  },
};

console.log(account.isPositive); // true
```

A setter runs when a property is assigned:

```js
const profile = {
  _name: "Asha",
  get name() {
    return this._name;
  },
  set name(value) {
    if (typeof value !== "string" || value.length === 0) {
      throw new TypeError("name must be a non-empty string");
    }
    this._name = value;
  },
};

profile.name = "Mina";
console.log(profile.name); // "Mina"
```

Getters and setters can hide work, throw errors, or mutate state behind property syntax. Use them when the property-like behavior is clear; otherwise an explicit method can be easier to review.

### 8. Spread creates a shallow copy

Object spread copies enumerable own properties into a new object:

```js
const original = {
  name: "Asha",
  preferences: { theme: "light" },
};

const copy = { ...original };
copy.name = "Mina";
copy.preferences.theme = "dark";

console.log(original.name); // "Asha"
console.log(original.preferences.theme); // "dark"
console.log(original === copy); // false
```

The top-level object is new, but the nested `preferences` object is shared. This is a shallow copy, not a deep clone.

Spread also does not copy non-enumerable properties, prototype identity, or all special internal state. Choose a copy strategy according to the values and ownership rules.

### 9. Destructuring and property defaults

Object destructuring reads properties into local bindings:

```js
const request = { id: "r1", limit: 20 };
const { id, limit = 10, missing = "fallback" } = request;

console.log(id, limit, missing); // "r1" 20 "fallback"
```

A destructuring default is used when the property value is `undefined`, not for every falsy value:

```js
const { count = 10 } = { count: 0 };
console.log(count); // 0
```

Renaming avoids collisions:

```js
const { id: requestId } = request;
console.log(requestId); // "r1"
```

Destructuring is convenient, but it can hide the exact property access point. Use explicit checks when missing and undefined have different meanings.

## Detailed Explanations and Traces

### Dynamic property access and safe allowlists

A function that copies arbitrary user-provided keys needs an allowlist when only certain fields are valid:

```js
const allowedFields = new Set(["displayName", "timezone"]);

function pickAllowed(input) {
  const result = {};
  for (const [key, value] of Object.entries(input)) {
    if (allowedFields.has(key)) {
      result[key] = value;
    }
  }
  return result;
}
```

An allowlist is clearer than trying to blacklist every dangerous key. If a function supports nested paths such as `profile.name`, it must parse and validate each segment rather than blindly assigning a path supplied by a caller.

### Prototype pollution connection

Unsafe merging code can accidentally modify an object's prototype or create unexpected inherited behavior when it accepts special keys such as `__proto__`, `constructor`, or `prototype`. The exact impact depends on the merge implementation and runtime behavior.

Defensive rules include:

- Validate keys against an allowlist where possible.
- Avoid dynamic assignment of untrusted nested paths.
- Use `Object.hasOwn` for input checks.
- Decide whether null-prototype objects fit the data structure.
- Keep dependencies updated and understand their merge behavior.

This is not a replacement for security testing. It is a reminder that object property access is a trust-boundary operation in a server.

### Node.js connection: request objects and data ownership

A Node.js handler often receives an object parsed from external input and passes parts of it into services. Decide whether the service:

- Reads the object without mutating it.
- Creates a shallow copy and owns only top-level changes.
- Deeply normalizes selected fields.
- Rejects unknown keys.
- Preserves or removes `undefined` values before serialization.

Do not assume `{ ...input }` makes untrusted data safe or independent. It copies only enumerable own properties and keeps nested references.

### DSA connection: maps, objects, and lookup

Objects can act as key-value stores, but `Map` may better express arbitrary key identity, frequent insertion and deletion, and non-string keys. A `Set` is often clearer for membership checks.

```js
const counts = new Map();
for (const word of ["a", "b", "a"]) {
  counts.set(word, (counts.get(word) ?? 0) + 1);
}

console.log(counts.get("a")); // 2
```

The expected lookup complexity of `Map` is commonly treated as $O(1)$, but this is an implementation and workload assumption, not a universal mathematical guarantee. State what the algorithm needs and why the chosen structure fits.

## Node.js Connection

Parsed request data is ordinary object data, so own-property checks, normalization, and unsafe-key rejection belong at service boundaries.

## Common Mistakes and Interview Traps

- Assuming a missing property and an own property with `undefined` are identical.
- Using `in` when only own input fields should count.
- Using `for...in` on untrusted objects without an own-property check.
- Treating object spread as a deep clone.
- Expecting a getter to be a passive stored value.
- Using an arrow function as an object method and expecting dynamic `this`.
- Dynamically assigning user-controlled property paths.
- Treating `Object.create(null)` as interchangeable with an ordinary object; it has no normal object prototype methods.
- Assuming JSON serialization preserves prototypes, symbols, functions, `undefined`, or `bigint` values.

## Tricky Points

1. `in` includes inherited properties; `Object.hasOwn` does not.
2. A missing property and a present `undefined` property read the same but behave differently under existence checks and serialization.
3. Object spread is shallow and copies enumerable own properties only.
4. Getters can execute code during a read, so copying or inspecting objects may have side effects.
5. A dynamic property path is executable mutation logic at a trust boundary, not just a string lookup.

## Practical Exercise

**Goal:** Safely normalize a profile update object.

**Input:** An untrusted object that may contain `displayName`, `timezone`, `preferences`, unknown keys, and nested values.

**Task:** Accept only allowed top-level fields, distinguish missing fields from explicit `undefined`, avoid mutating the caller's object, and document whether nested preferences are copied or retained.

**Edge cases:** `null`, arrays, inherited properties, `__proto__`, getters, empty strings, and nested objects shared by two references.

**Acceptance criteria:** The function rejects invalid input, ignores or reports unknown keys according to a stated policy, uses own-property checks, proves the original object is not unexpectedly mutated, and explains shallow versus deep ownership.

## Summary

- Objects store string and symbol keyed properties.
- Dot notation is fixed-name access; bracket notation supports dynamic keys.
- Missing property reads usually return `undefined`, but a nullish base throws.
- `in` checks the prototype chain; `Object.hasOwn` checks direct ownership.
- Prototype lookup affects reads, while writes commonly create an own property.
- Methods depend on their receiver; getters and setters run code behind property syntax.
- Object spread and destructuring are useful but have shallow and `undefined`-specific behavior.
- Untrusted property names and paths can become security problems, especially in server code.

## Cheat Sheet

| Question | Tool or rule |
| --- | --- |
| Read fixed key | `object.key` |
| Read dynamic key | `object[key]` |
| Is key anywhere in chain? | `key in object` |
| Is key directly on object? | `Object.hasOwn(object, key)` |
| Avoid nullish base failure | `object?.key`, only when absence is valid |
| Copy top-level enumerable own properties | `{ ...object }` |
| Copy nested data | Choose an explicit domain-appropriate strategy |
| Iterate own key-value pairs | `Object.entries(object)` |
| Count arbitrary keys | `Map` often makes intent clearer |
| Handle untrusted keys | Prefer allowlists and validate paths |

## Interview Questions

1. **Mental model:** Explain property lookup through an object's prototype chain and compare `in`, `Object.hasOwn`, and a direct read.
   - **Expected answer shape:** Trace own lookup, inherited lookup, missing lookup, and the result of each operation.
   - **Follow-up:** How can a write change later reads without changing the prototype?

2. **Predict the output:** Compare an object with a missing property and one with an own property set to `undefined` using direct read, `in`, `Object.hasOwn`, destructuring defaults, and JSON serialization.
   - **Expected answer shape:** Give each result and explain why read equality does not mean structural equality.
   - **Follow-up:** How should an API represent â€œclear this valueâ€ versus â€œdo not update this valueâ€?

3. **Implementation:** Implement a safe field picker for untrusted input with an allowlist and explain why it is safer than copying every key.
   - **Expected answer shape:** Show validation, own-key iteration, output ownership, and treatment of accessors or nested values.
   - **Follow-up:** How would you handle nested allowlisted paths without accepting arbitrary traversal?

4. **Debugging:** A supposedly copied request object changes when a nested object is modified by a service. Diagnose the alias and propose shallow, deep, and immutable alternatives.
   - **Expected answer shape:** Draw or describe the object graph, identify the shared reference, and state performance and correctness tradeoffs.
   - **Follow-up:** Which values make generic deep cloning unsafe or incomplete?

5. **Design:** Design a server-side update boundary that prevents prototype pollution, rejects unknown fields, distinguishes omitted fields from explicit `undefined`, and remains observable.
   - **Expected answer shape:** Cover parsing, validation, ownership, key policy, error reporting, logging/redaction, and tests.
   - **Follow-up:** How would you review a third-party merge utility before allowing it on this boundary?

