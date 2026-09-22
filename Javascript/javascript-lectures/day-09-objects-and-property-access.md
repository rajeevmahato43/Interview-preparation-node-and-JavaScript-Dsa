# Day 09: Objects and Property Access

<nav aria-label="Lecture navigation">

[Previous: Closures, Execution Context, and `this`](day-08-closures-execution-context-and-this.md) | [Roadmap](../javascript-roadmap.md) | [Next: Prototypes, Classes, and Inheritance](day-10-prototypes-classes-and-inheritance.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Create objects using all object literal features: shorthand properties, shorthand methods, and computed keys.
- Use `Object.create()` to set a prototype explicitly and explain when a null-prototype object is the right choice.
- Read or write properties with dot, bracket, and computed access.
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

### 1. Object literals and their shorthand features

An **object literal** is the `{ }` syntax used to create an object inline. It is the most common way to create ordinary objects in JavaScript. The literal form supports several shorthand features introduced in ES2015 that appear constantly in interviews and production code.

#### Basic literal

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

#### Shorthand properties

When a variable name matches the property key you want, you can omit the `: value` part:

```js
const name = "Asha";
const age = 24;

// Verbose form
const userVerbose = { name: name, age: age };

// Shorthand form — identical result
const userShort = { name, age };

console.log(userShort); // { name: "Asha", age: 24 }
```

This is purely a syntax convenience. The runtime value is the same object.

#### Shorthand methods

A method can be defined without the `function` keyword or a colon:

```js
// Verbose form
const cart = {
  items: [10, 20],
  total: function () {
    return this.items.reduce((sum, item) => sum + item, 0);
  },
};

// Shorthand form
const cart2 = {
  items: [10, 20],
  total() {
    return this.items.reduce((sum, item) => sum + item, 0);
  },
};

console.log(cart2.total()); // 30
```

Shorthand methods also support `async` and generator syntax:

```js
const api = {
  async fetchUser(id) {
    // await fetch(...)
  },
  *range(from, to) {
    for (let i = from; i <= to; i++) yield i;
  },
};
```

#### Computed property keys

Wrap any expression in `[ ]` inside an object literal to use its value as the key:

```js
const field = "status";
const record = {
  [field]: "ready",
  [`${field}_code`]: 200,
};

console.log(record.status);      // "ready"
console.log(record.status_code); // 200
```

Computed keys evaluate once at object creation time. They can use any expression: variables, function calls, template literals, or symbols.

```js
const PREFIX = "user";
const config = {
  [`${PREFIX}_id`]: "u1",
  [`${PREFIX}_role`]: "admin",
};
// { user_id: "u1", user_role: "admin" }
```

All three shorthands can be mixed freely in one literal:

```js
const role = "admin";
const id = "u1";
const CACHE_KEY = Symbol("cache");

const record = {
  id,              // shorthand property
  role,            // shorthand property
  [CACHE_KEY]: {},  // computed symbol key
  describe() {     // shorthand method
    return `${this.role}:${this.id}`;
  },
};

console.log(record.describe()); // "admin:u1"
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

### 10. `Object.create()` — explicit prototype delegation

`Object.create(proto)` creates a new, empty object whose prototype is `proto`. It gives you direct control over the prototype chain without using a class or a constructor function.

#### Basic usage

```js
const animalMethods = {
  describe() {
    return `${this.name} makes a sound`;
  },
};

const dog = Object.create(animalMethods);
dog.name = "Rex";

console.log(dog.describe()); // "Rex makes a sound"
console.log(Object.getPrototypeOf(dog) === animalMethods); // true
```

`dog` has no own `describe` property. The engine finds it by walking up to `animalMethods`.

#### Second argument: property descriptors

`Object.create(proto, descriptors)` also accepts a property-descriptor map as its second argument (same format as `Object.defineProperties`):

```js
const base = { greet() { return `Hello, ${this.name}`; } };

const user = Object.create(base, {
  name: { value: "Asha", writable: true, enumerable: true, configurable: true },
});

console.log(user.greet()); // "Hello, Asha"
console.log(Object.hasOwn(user, "name")); // true
```

#### Null-prototype objects

Passing `null` creates an object with **no prototype at all** — not even `Object.prototype`:

```js
const clean = Object.create(null);
clean.key = "value";

console.log(clean.key);           // "value"
console.log(clean.toString);      // undefined — no inherited method
console.log("key" in clean);      // true
console.log(Object.hasOwn(clean, "key")); // true
```

A null-prototype object is useful as a safe dictionary or lookup table because keys such as `constructor` or `__proto__` have no special meaning on it. Libraries that accept arbitrary user keys (caches, registries, option maps) often use this pattern to avoid prototype pollution.

#### When to prefer `Object.create()` over an object literal

| Goal | Preferred approach |
|---|---|
| Quick plain data object | Object literal `{}` |
| Safe dictionary with no prototype baggage | `Object.create(null)` |
| Inherit shared methods without a class | `Object.create(methodsObject)` |
| Full class-based inheritance | `class` syntax (Day 10) |

Object.create() is a lower-level tool. You will mostly meet it in interview prototype-chain questions or in code that deliberately manages prototype delegation without classes.

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

### 10. `Object.create()` — explicit prototype delegation

`Object.create(proto)` creates a new, empty object whose prototype is `proto`. It gives you direct control over the prototype chain without using a class or a constructor function.

#### Basic usage

```js
const animalMethods = {
  describe() {
    return `${this.name} makes a sound`;
  },
};

const dog = Object.create(animalMethods);
dog.name = "Rex";

console.log(dog.describe()); // "Rex makes a sound"
console.log(Object.getPrototypeOf(dog) === animalMethods); // true
```

`dog` has no own `describe` property. The engine finds it by walking up to `animalMethods`.

#### Second argument: property descriptors

`Object.create(proto, descriptors)` also accepts a property-descriptor map as its second argument (same format as `Object.defineProperties`):

```js
const base = { greet() { return `Hello, ${this.name}`; } };

const user = Object.create(base, {
  name: { value: "Asha", writable: true, enumerable: true, configurable: true },
});

console.log(user.greet()); // "Hello, Asha"
console.log(Object.hasOwn(user, "name")); // true
```

#### Null-prototype objects

Passing `null` creates an object with **no prototype at all** — not even `Object.prototype`:

```js
const clean = Object.create(null);
clean.key = "value";

console.log(clean.key);           // "value"
console.log(clean.toString);      // undefined — no inherited method
console.log("key" in clean);      // true
console.log(Object.hasOwn(clean, "key")); // true
```

A null-prototype object is useful as a safe dictionary or lookup table because keys such as `constructor` or `__proto__` have no special meaning on it. Libraries that accept arbitrary user keys (caches, registries, option maps) often use this pattern to avoid prototype pollution.

#### When to prefer `Object.create()` over an object literal

| Goal | Preferred approach |
|---|---|
| Quick plain data object | Object literal `{}` |
| Safe dictionary with no prototype baggage | `Object.create(null)` |
| Inherit shared methods without a class | `Object.create(methodsObject)` |
| Full class-based inheritance | `class` syntax (Day 10) |

Object.create() is a lower-level tool. You will mostly meet it in interview prototype-chain questions or in code that deliberately manages prototype delegation without classes.

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

`Map` and its full API (`set`, `get`, `has`, `delete`, `size`, iteration, object keys, `WeakMap`) are covered in depth in [Day 12: Built-in Data Structures](day-12-built-in-data-structures-and-serialization.md).

## Node.js Connection

Parsed request data is ordinary object data, so own-property checks, normalization, and unsafe-key rejection belong at service boundaries.

## Compare & Recall

| Concept A | Concept B | Key difference |
|---|---|---|
| Object literal `{}` | `Object.create(proto)` | `{}` automatically inherits from `Object.prototype`. `Object.create(proto)` lets you choose the prototype explicitly. `Object.create(null)` gives a prototype-free dictionary. |
| `object.key` | `object[key]` | Dot notation is for **fixed, known** property names. Bracket notation is for **dynamic** keys, computed values, or names that aren't valid identifiers. |
| `in` operator | `Object.hasOwn(obj, key)` | `in` checks the **entire prototype chain**. `Object.hasOwn` checks only **direct (own) properties**. Use `hasOwn` for input validation. |
| Shorthand property `{ name }` | Destructuring `const { name } = obj` | Both look similar but do the **opposite**. `{ name }` **packs** a value from scope into an object. `const { name }` **unpacks** a value from an object into scope. |
| Object spread `{ ...obj }` | Deep clone | Spread copies only **enumerable own properties** one level deep. Nested objects still share the same reference. |
| Plain object `{}` as a map | `Map` | Plain objects inherit prototype keys (risk of conflicts), only support string/symbol keys, and have no size. `Map` has arbitrary keys, insertion-order iteration, and a `.size` property. Full `Map` API in [Day 12](day-12-built-in-data-structures-and-serialization.md). |

> **Cross-day links:** Prototype chain in detail is [Day 10](day-10-prototypes-classes-and-inheritance.md). Property descriptors (writable, enumerable, configurable) are [Day 11](day-11-property-descriptors-and-immutability.md). `Map` and `Set` full API is [Day 12](day-12-built-in-data-structures-and-serialization.md).

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
- Confusing shorthand property syntax `{ name }` with destructuring `const { name } = obj` — they look similar but operate in opposite directions (one packs a value into an object, the other unpacks it).
- Forgetting that the second argument of `Object.create()` is a property-descriptor map, not a plain value map. Missing `enumerable: true` makes the property invisible to `for...in` and `Object.keys`.
- Using a computed key `[expr]` and assuming it always produces a string — symbols are also valid and survive as symbol-keyed properties.

## Tricky Points

1. `in` includes inherited properties; `Object.hasOwn` does not.
2. A missing property and a present `undefined` property read the same but behave differently under existence checks and serialization.
3. Object spread is shallow and copies enumerable own properties only.
4. Getters can execute code during a read, so copying or inspecting objects may have side effects.
5. A dynamic property path is executable mutation logic at a trust boundary, not just a string lookup.
6. `Object.create(null)` produces an object with no `toString`, no `hasOwnProperty`, and no other `Object.prototype` methods. Calling `obj.hasOwnProperty(key)` on a null-prototype object throws a `TypeError`. Use `Object.hasOwn(obj, key)` instead.
7. The shorthand method syntax `total() {}` and a function expression `total: function() {}` look equivalent, but only the shorthand form can use `super` — a difference that matters in classes and prototype-delegation patterns.
8. Computed keys with symbol values produce **symbol-keyed** properties that are invisible to `Object.keys()`, `Object.entries()`, and `for...in`. Use `Object.getOwnPropertySymbols()` to find them.

## Practical Exercise

**Goal:** Safely normalize a profile update object.

**Input:** An untrusted object that may contain `displayName`, `timezone`, `preferences`, unknown keys, and nested values.

**Task:** Accept only allowed top-level fields, distinguish missing fields from explicit `undefined`, avoid mutating the caller's object, and document whether nested preferences are copied or retained.

**Edge cases:** `null`, arrays, inherited properties, `__proto__`, getters, empty strings, and nested objects shared by two references.

**Acceptance criteria:** The function rejects invalid input, ignores or reports unknown keys according to a stated policy, uses own-property checks, proves the original object is not unexpectedly mutated, and explains shallow versus deep ownership.

## Summary

- An object literal supports shorthand properties `{ name }`, shorthand methods `{ total() {} }`, and computed keys `{ [expr]: value }` — all usable together.
- Objects store string and symbol keyed properties.
- Dot notation is fixed-name access; bracket notation supports dynamic keys.
- Missing property reads usually return `undefined`, but a nullish base throws.
- `in` checks the prototype chain; `Object.hasOwn` checks direct ownership.
- Prototype lookup affects reads, while writes commonly create an own property.
- `Object.create(proto)` creates an object with an explicit prototype. `Object.create(null)` creates one with no prototype, useful as a safe dictionary.
- Methods depend on their receiver; getters and setters run code behind property syntax.
- Object spread and destructuring are useful but have shallow and `undefined`-specific behavior.
- Untrusted property names and paths can become security problems, especially in server code.
- `Map` is covered in full in [Day 12](day-12-built-in-data-structures-and-serialization.md).

## Cheat Sheet

| Question | Tool or rule |
| --- | --- |
| Shorthand property | `{ name }` instead of `{ name: name }` |
| Shorthand method | `{ total() {} }` instead of `{ total: function() {} }` |
| Dynamic key at creation | `{ [expr]: value }` |
| Create object with chosen prototype | `Object.create(proto)` |
| Safe prototype-free dictionary | `Object.create(null)` |
| Read fixed key | `object.key` |
| Read dynamic key | `object[key]` |
| Is key anywhere in chain? | `key in object` |
| Is key directly on object? | `Object.hasOwn(object, key)` |
| Avoid nullish base failure | `object?.key`, only when absence is valid |
| Copy top-level enumerable own properties | `{ ...object }` |
| Copy nested data | Choose an explicit domain-appropriate strategy |
| Iterate own key-value pairs | `Object.entries(object)` |
| Count arbitrary keys | `Map` — see Day 12 |
| Handle untrusted keys | Prefer allowlists and validate paths |

**vs. quick reference**

| | `in` | `Object.hasOwn` | Direct read |
|---|---|---|---|
| Checks prototype chain | ✓ Yes | ✗ No | ✗ No |
| Returns for missing own | true (if inherited) | false | `undefined` |
| Recommended for input validation | ✗ | ✓ | ✗ |

| Object creation method | Prototype | When to use |
|---|---|---|
| `{}` | `Object.prototype` | Default for everyday objects |
| `Object.create(proto)` | Chosen proto | Deliberate prototype chain |
| `Object.create(null)` | None | Safe dictionaries, caches, lookup tables |

## Interview Questions

> Difficulty guide: **[Beginner]** = entry-level, **[Mid]** = requires understanding of internals, **[Senior]** = design and tradeoff thinking expected.

1. **[Mid] Mental model:** Explain property lookup through an object's prototype chain and compare `in`, `Object.hasOwn`, and a direct read.
   - **Expected answer shape:** Trace own lookup, inherited lookup, missing lookup, and the result of each operation.
   - **Follow-up:** How can a write change later reads without changing the prototype?

2. **[Mid] Predict the output:** Compare an object with a missing property and one with an own property set to `undefined` using direct read, `in`, `Object.hasOwn`, destructuring defaults, and JSON serialization.
   - **Expected answer shape:** Give each result and explain why read equality does not mean structural equality.
   - **Follow-up:** How should an API represent "clear this value" versus "do not update this value"?

3. **[Mid] Implementation:** Implement a safe field picker for untrusted input with an allowlist and explain why it is safer than copying every key.
   - **Expected answer shape:** Show validation, own-key iteration, output ownership, and treatment of accessors or nested values.
   - **Follow-up:** How would you handle nested allowlisted paths without accepting arbitrary traversal?

4. **[Senior] Debugging:** A supposedly copied request object changes when a nested object is modified by a service. Diagnose the alias and propose shallow, deep, and immutable alternatives.
   - **Expected answer shape:** Draw or describe the object graph, identify the shared reference, and state performance and correctness tradeoffs.
   - **Follow-up:** Which values make generic deep cloning unsafe or incomplete?

5. **[Senior] Design:** Design a server-side update boundary that prevents prototype pollution, rejects unknown fields, distinguishes omitted fields from explicit `undefined`, and remains observable.
   - **Expected answer shape:** Cover parsing, validation, ownership, key policy, error reporting, logging/redaction, and tests.
   - **Follow-up:** How would you review a third-party merge utility before allowing it on this boundary?

6. **[Beginner] Object literals:** What are all the shorthand forms available in an object literal? Write one object that demonstrates shorthand properties, a shorthand method, a computed key, and a symbol key.
   - **Expected answer shape:** Show all four forms in one literal and explain how the runtime treats each. State which are visible to `Object.keys()` and which are not.
   - **Follow-up:** When does the shorthand method form behave differently from storing an arrow function in the same key?

7. **[Mid] `Object.create()`:** When would you use `Object.create(null)` instead of `{}` or a `class`? What breaks on a null-prototype object that works on a plain `{}`?
   - **Expected answer shape:** Explain the prototype chain difference, give a concrete use case (safe dictionary, registry, or cache), name at least two inherited methods that become unavailable, and show the correct alternative (`Object.hasOwn` over `obj.hasOwnProperty`).
   - **Follow-up:** How would you share methods across multiple objects without using a class, and how is that different from using a class internally?
