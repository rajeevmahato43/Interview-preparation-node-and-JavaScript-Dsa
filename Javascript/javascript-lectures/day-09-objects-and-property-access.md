# Day 09: Objects and Property Access

<nav aria-label="Lecture navigation">

[← Day 08: Closures, Execution Context, and this](day-08-closures-execution-context-and-this.md) | [Roadmap](../javascript-roadmap.md) | [Day 10: Prototypes, Classes, and Inheritance →](day-10-prototypes-classes-and-inheritance.md)

</nav>

---

## What You Will Learn Today

By the end of this lecture, you should be able to:

- Create objects using modern literal features: shorthand properties, shorthand methods, and computed keys.
- Choose accurately between dot notation and bracket notation for fixed vs. dynamic property access.
- Understand property lookup along the prototype chain and distinguish own properties from inherited ones.
- Differentiate an absent property from a property explicitly set to `undefined` across reads, existence operators (`in`, `Object.hasOwn`), and JSON serialization.
- Master `Object.create(proto)` and understand when to use `Object.create(null)` for prototype-free, pollution-safe dictionaries.
- Implement accessor properties (getters and setters) while avoiding hidden recursion and side-effect traps.
- Distinguish shallow copies (`Object.assign()`, spread `{ ...obj }`) from deep clones (`structuredClone()`), avoiding shared reference bugs.
- Recognize and prevent **Prototype Pollution** vulnerabilities caused by recursive merges of untrusted keys (`__proto__`, `constructor`).
- Compare plain objects with `Map` and `Set` to choose the optimal data structure for lookups and caching in Node.js services.

**Prerequisites:** [Day 03 – Values, Types, and Literals](day-03-values-types-and-literals.md) (primitives vs. reference types), [Day 04 – Coercion, Equality, and Operators](day-04-coercion-equality-and-operators.md), and [Day 08 – Closures, Execution Context, and this](day-08-closures-execution-context-and-this.md) (object methods and `this`).  
*Upcoming Connections:* [Day 10](day-10-prototypes-classes-and-inheritance.md) explores prototypes, constructor functions, and classes; [Day 11](day-11-property-descriptors-and-immutability.md) details property descriptors, freezing, and sealing.

---

## Quick Vocabulary Card

| Term | Definition |
| :--- | :--- |
| **Object Literal** | The comma-separated list of zero or more property name-value pairs wrapped in curly braces (`{}`). |
| **Own Property** | A property defined directly on the object instance itself, rather than inherited from its prototype chain. |
| **Inherited Property** | A property accessible on an object through its `[[Prototype]]` linkage up to `Object.prototype`. |
| **Computed Property Key** | An object key evaluated dynamically at creation time from an expression inside brackets `[expr]`. |
| **`Object.hasOwn()`** | A static ES2022 method that checks whether a specified property is an own property of an object (replaces `hasOwnProperty`). |
| **`in` Operator** | An operator that evaluates to `true` if a property exists directly on an object **or anywhere on its prototype chain**. |
| **Accessor Property** | A property governed by a getter (`get`) and/or setter (`set`) function instead of holding a direct value. |
| **Shallow Copy** | A duplicate object whose top-level properties are copied, but whose nested object references are shared with the original. |
| **Deep Clone** | A completely independent copy where all levels of nested objects and arrays are duplicated recursively. |
| **Prototype Pollution** | A security vulnerability where an attacker injects properties into `Object.prototype`, altering the behavior of all objects across the application. |

---

## 1. Object Creation and Modern Literal Features

An **object** in JavaScript is an unordered collection of key-value pairs (properties), where keys are either strings or symbols. 

The **object literal** syntax `{}` is the standard way to create objects inline. Modern ECMAScript (ES2015+) provides three core syntactic conveniences: Shorthand Properties, Shorthand Methods, and Computed Keys.

```js
// Node.js code
const serviceId = "auth_srv";
const port = 8080;
const METRIC_KEY = Symbol("requestCount");

// ✅ Modern Object Literal combining all modern features
const microservice = {
  // 1. Shorthand property: variable name matches property key
  serviceId,
  port,

  // 2. Computed property key: dynamic expression evaluated at creation
  [`url_${process.env.NODE_ENV || "dev"}`]: `http://localhost:${port}`,
  [METRIC_KEY]: 0,

  // 3. Shorthand method: concise function declaration
  start() {
    return `${this.serviceId} listening on ${this.port}`;
  }
};

console.log(microservice.start()); // "auth_srv listening on 8080"
console.log(microservice.url_dev);  // "http://localhost:8080"
console.log(microservice[METRIC_KEY]); // 0

// ❌ Trap: Shorthand method vs. Arrow property
const brokenService = {
  port: 3000,
  // Arrow functions have lexical this; 'this.port' is undefined!
  getPort: () => this?.port
};
console.log("Broken method port:", brokenService.getPort()); // undefined
```

---

## 2. Property Access: Dot Notation vs. Bracket Notation

JavaScript supports two access mechanisms: **Dot notation** (`object.property`) and **Bracket notation** (`object[expression]`).

### Comparison of Access Forms

- **Dot Notation (`obj.key`):** Requires the property name to be a valid JavaScript identifier (no spaces, hyphens, or leading digits). It is static and cannot evaluate variables.
- **Bracket Notation (`obj[expr]`):** Accepts any expression. Non-string expressions are automatically coerced to strings (except Symbols). Required for dynamic keys, invalid identifiers, and symbol properties.

```js
// Node.js code
const userPreferences = {
  "content-type": "application/json",
  "101": "User ID 101",
  theme: "dark"
};

// ✅ Dot notation for valid static identifiers
console.log(userPreferences.theme); // "dark"

// ❌ Dot notation fails for keys with dashes or leading numbers
// userPreferences.content-type; // SyntaxError: Unexpected token '-'
// userPreferences.101;          // SyntaxError: Unexpected number

// ✅ Bracket notation evaluates string keys with special characters
console.log(userPreferences["content-type"]); // "application/json"
console.log(userPreferences[101]);            // "User ID 101" (number 101 coerced to string "101")

// ✅ Bracket notation evaluates variables dynamically
const dynamicKey = "theme";
console.log(userPreferences[dynamicKey]);     // "dark"
```

---

## 3. Reading Missing Properties and Nullish Chaining

Reading a non-existent property on an object does **not** throw an error; JavaScript returns `undefined`.

However, attempting to read a property from `null` or `undefined` throws an immediate `TypeError`.

```js
// Node.js code
const config = { database: { host: "localhost" } };

// ✅ Missing property on valid object returns undefined
console.log(config.database.port); // undefined

// ❌ Accessing property on undefined/null throws TypeError!
try {
  console.log(config.cache.redisPort);
} catch (err) {
  console.log("❌ Base error:", err.name); // TypeError: Cannot read properties of undefined (reading 'redisPort')
}

// ✅ Optional Chaining (?.) short-circuits to undefined when the base is nullish
console.log(config.cache?.redisPort); // undefined
console.log(config.database?.host);   // "localhost"
```

> **Design Tip:** Use optional chaining `?.` only when the property or base is legitimately optional. Do not use `?.` to mask programming bugs or missing configuration invariants.

---

## 4. Missing Property vs. Property Present with `undefined`

In JavaScript, there is a fundamental difference between an object that **lacks a property** and an object that **has a property whose value is `undefined`**.

A direct read (`obj.key === undefined`) is ambiguous because both cases evaluate to `undefined`.

```js
// Node.js code
const objMissing = {};
const objPresentUndefined = { status: undefined };

// Direct reads are identical (ambiguous!)
console.log(objMissing.status);          // undefined
console.log(objPresentUndefined.status); // undefined

// ✅ 1. 'in' operator: checks own properties AND prototype chain
console.log("status" in objMissing);          // false
console.log("status" in objPresentUndefined); // true

// ✅ 2. Object.hasOwn(obj, key): checks OWN properties ONLY
console.log(Object.hasOwn(objMissing, "status"));          // false
console.log(Object.hasOwn(objPresentUndefined, "status")); // true

// ✅ 3. JSON Serialization difference: undefined properties are dropped!
console.log(JSON.stringify(objMissing));          // "{}"
console.log(JSON.stringify(objPresentUndefined)); // "{}" (property stripped during serialization!)

// ✅ 4. Object.keys() / Object.entries()
console.log(Object.keys(objMissing));          // []
console.log(Object.keys(objPresentUndefined)); // [ 'status' ]
```

### Existence Check Comparison Table

| Technique | Checks Own Properties | Checks Prototype Chain | Safe on `Object.create(null)` | Returns for `value: undefined` |
| :--- | :--- | :--- | :--- | :--- |
| `obj.prop !== undefined` | ✅ Yes | ✅ Yes | ✅ Yes | ❌ `false` (Ambiguous) |
| `"prop" in obj` | ✅ Yes | ✅ Yes | ✅ Yes | ✅ `true` |
| `Object.hasOwn(obj, "prop")` | ✅ Yes | ❌ No | ✅ Yes | ✅ `true` |
| `obj.hasOwnProperty("prop")` | ✅ Yes | ❌ No | ❌ Crashes (`TypeError`) | ✅ `true` |

---

## 5. Own Properties vs. Inherited Properties

An **own property** is defined directly on the object instance. An **inherited property** is located on one of the prototypes in the object’s prototype chain.

- **Reads:** Look for an own property first. If not found, JavaScript walks up the `[[Prototype]]` chain until it finds the property or reaches `null`.
- **Writes:** By default, writing a property (`obj.key = value`) creates or mutates an **own property** on `obj`, shadowing any property with the same name on the prototype.

```js
// Node.js code
const systemDefaults = { timeout: 5000, maxRetries: 3 };

// Create client inheriting from systemDefaults
const clientConfig = Object.create(systemDefaults);
clientConfig.timeout = 2000; // Creates an OWN property on clientConfig (shadowing)

console.log(clientConfig.timeout);    // 2000 (read from own property)
console.log(clientConfig.maxRetries); // 3 (read from prototype)

// Own property verification
console.log(Object.hasOwn(clientConfig, "timeout"));    // true
console.log(Object.hasOwn(clientConfig, "maxRetries")); // false
console.log("maxRetries" in clientConfig);              // true (inherited)
```

---

## 6. `Object.create()` and Null-Prototype Objects

`Object.create(proto, [propertiesObject])` creates a new object with its internal `[[Prototype]]` explicitly set to `proto`.

### Creating a Null-Prototype Object (`Object.create(null)`)

When `null` is passed as the prototype, JavaScript creates an object with **no prototype at all**—it does not even inherit from `Object.prototype`.

```js
// Node.js code
// Regular object: inherits toString, hasOwnProperty, constructor from Object.prototype
const regularObj = {};
console.log("toString in regularObj:", "toString" in regularObj); // true

// Null-prototype object: clean slate with ZERO inherited properties
const dictionary = Object.create(null);
dictionary["user_101"] = "Alice";

console.log(dictionary.user_101);         // "Alice"
console.log("toString" in dictionary);     // false
console.log(Object.getPrototypeOf(dictionary)); // null

// ❌ Calling Object.prototype methods on a null-prototype object throws TypeError!
try {
  dictionary.hasOwnProperty("user_101");
} catch (err) {
  console.log("❌ Crash:", err.message); // TypeError: dictionary.hasOwnProperty is not a function
}

// ✅ Always use Object.hasOwn(dict, key) in modern JavaScript
console.log(Object.hasOwn(dictionary, "user_101")); // true
```

### Why Null-Prototype Objects Matter in Production

1. **Immunity to Key Collisions:** A regular object has inherited keys like `"constructor"`, `"toString"`, and `"valueOf"`. Checking `if (obj[key])` for a user-supplied key `"toString"` returns a function instead of `undefined`. A null-prototype object has no inherited keys.
2. **Safe Lookup Tables & Caches:** Perfect for fast key-value lookups when arbitrary user input acts as dictionary keys.

---

## 7. Accessor Properties: Getters and Setters

An **accessor property** does not store a value directly; it binds a property to functions executed when the property is read (`get`) or written (`set`).

### Defining Getters and Setters

```js
// Node.js code
const bankAccount = {
  _balance: 100, // convention for backing field

  // Getter: executed on read (account.balance)
  get balance() {
    return `$${this._balance.toFixed(2)}`;
  },

  // Setter: executed on assignment (account.balance = 250)
  set balance(value) {
    if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
      throw new RangeError("Balance must be a non-negative number");
    }
    this._balance = value;
  }
};

console.log(account.balance); // "$100.00"
account.balance = 250;
console.log(account.balance); // "$250.00"

// ❌ Setting invalid value triggers validation inside setter
try {
  account.balance = -50;
} catch (err) {
  console.log("❌ Setter validation error:", err.message); // RangeError: Balance must be a non-negative number
}
```

> **Warning (The Infinite Recursion Trap):** A setter for `balance` must not assign to `this.balance = value`. Doing so invokes the setter itself again, resulting in `RangeError: Maximum call stack size exceeded`. Always use an internal backing variable (e.g., `this._balance`).

---

## 8. Shallow Copying vs. Deep Cloning

When cloning objects, developers frequently mistake **shallow copying** for **deep copying**.

### Shallow Copying (`Object.assign` & Spread `{ ...obj }`)

Shallow copying copies own enumerable properties. If a property value is a primitive, it is duplicated. If a property value is a reference (object or array), **only the memory address is copied**. Both objects point to the exact same nested instance!

```js
// Node.js code
const originalSession = {
  sessionId: "sess_9988",
  user: { name: "Alice", role: "viewer" }
};

// Shallow copy via spread
const shallowCopy = { ...originalSession };

// Modifying top-level primitive: isolated
shallowCopy.sessionId = "sess_0001";
console.log(originalSession.sessionId); // "sess_9988" (Unchanged ✅)

// ❌ Modifying nested object: MUTATES BOTH OBJECTS!
shallowCopy.user.role = "admin";
console.log(originalSession.user.role); // "admin" (Original corrupted! ❌)
```

### Deep Cloning Solutions

1. **`structuredClone(obj)` (Node.js 17+, Modern Browsers):** Native deep cloning algorithm. Correctly clones nested objects, arrays, `Date`, `Map`, `Set`, `RegExp`, and handles circular references.
2. **`JSON.parse(JSON.stringify(obj))` (Legacy hack):** Drops functions, `undefined`, `Symbol`, and `BigInt`, and converts `Date` instances into strings. Fails on circular references.

```js
// Node.js code
const deepOriginal = {
  id: 1,
  data: { role: "guest" },
  createdAt: new Date("2026-01-01")
};

// ✅ Modern native deep clone
const safeDeepCopy = structuredClone(deepOriginal);
safeDeepCopy.data.role = "superadmin";

console.log(deepOriginal.data.role); // "guest" (Completely isolated! ✅)
console.log(safeDeepCopy.createdAt instanceof Date); // true
```

---

## 9. Prototype Pollution: The Backend Security Threat

**Prototype Pollution** is a severe JavaScript vulnerability where an attacker manipulates the prototype of base objects (typically `Object.prototype`) by injecting properties via recursive merge or path assignment functions.

Because virtually all objects inherit from `Object.prototype`, polluting it injects properties into every object across the entire Node.js runtime!

### The Vulnerable Merge Pattern

```js
// Node.js code (VULNERABLE MERGE IMPLEMENTATION)
function unsafeDeepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (typeof source[key] === "object" && source[key] !== null) {
      if (!target[key]) target[key] = {};
      unsafeDeepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Attacker supplies malicious JSON payload:
const maliciousPayload = JSON.parse('{"__proto__": {"isAdmin": true}}');

const emptyConfig = {};
unsafeDeepMerge(emptyConfig, maliciousPayload);

// ❌ The entire application is compromised!
const normalUser = {};
console.log("Is normal user admin?", normalUser.isAdmin); // true! (Polluted from Object.prototype)

// Cleanup prototype pollution
delete Object.prototype.isAdmin;
```

### How to Prevent Prototype Pollution

1. **Block Dangerous Keys:** Reject keys named `__proto__`, `constructor`, and `prototype`.
2. **Use `Object.hasOwn()`:** Never rely on the `in` operator to inspect untrusted input.
3. **Use `Object.create(null)` or `Map`:** For dictionaries handling user-supplied keys.
4. **Freeze `Object.prototype` (Defensive hardening):** `Object.freeze(Object.prototype)` prevents runtime mutation of the base prototype.

```js
// Node.js code (SECURE MERGE IMPLEMENTATION)
function safeDeepMerge(target, source) {
  for (const key of Object.keys(source)) {
    // ✅ 1. Block dangerous prototype traversal keys
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }

    if (typeof source[key] === "object" && source[key] !== null && !Array.isArray(source[key])) {
      if (!Object.hasOwn(target, key) || typeof target[key] !== "object") {
        target[key] = {};
      }
      safeDeepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
```

---

## 10. DSA Connection: Objects vs. `Map` and `Set`

In algorithm design and high-performance backend code, choose intentionally between plain Objects, `Map`, and `Set`:

```js
// Node.js code
// ✅ Using Map for dynamic, high-frequency key-value lookups
const rateLimitCache = new Map();
rateLimitCache.set("ip_127.0.0.1", { count: 4, resetAt: Date.now() + 60000 });

console.log(rateLimitCache.get("ip_127.0.0.1").count); // 4
console.log(rateLimitCache.size); // 1 (O(1) size check, unlike Object.keys(obj).length which is O(N))
```

### Plain Objects vs. `Map`

| Feature | Plain Object `{}` | `Map` |
| :--- | :--- | :--- |
| **Key Types** | Strings and Symbols only | Any value (objects, functions, primitives) |
| **Key Ordering** | Complex (integers ascending, strings in insertion order) | Strict insertion order |
| **Size Determination**| Manual: `Object.keys(obj).length` ($O(n)$) | Built-in: `map.size` ($O(1)$) |
| **Prototype Inheritance** | Inherits `Object.prototype` (unless `Object.create(null)`) | Clean slate; no default keys |
| **Performance** | Optimized for fixed shapes / records | Optimized for frequent addition & deletion |

---

## Tricky Points

### 1. `Object.hasOwn` vs. `hasOwnProperty`
Calling `obj.hasOwnProperty("key")` fails if `obj` was created via `Object.create(null)` or if the object has an own property named `hasOwnProperty`. `Object.hasOwn(obj, "key")` is universal and safe.

### 2. Deleting a Property vs. Setting to `undefined`
`obj.key = undefined` leaves the property present (`"key" in obj` is `true`, `Object.keys()` includes it). `delete obj.key` removes the key entirely from the hash table.

### 3. Modifying Inherited Properties on the Prototype
Executing `child.inheritedMethod = fn` creates an own property on `child` that shadows the method. It does **not** mutate the prototype object itself.

### 4. Shorthand Method `super` Capability
Shorthand methods `{ method() {} }` possess an internal `[[HomeObject]]` slot allowing them to use `super.method()`. Normal function properties `{ method: function() {} }` cannot use `super`.

### 5. Symbol Properties are Ignored by Standard Iterators
Properties keyed by Symbols are skipped by `Object.keys()`, `Object.values()`, `Object.entries()`, and `for...in` loops. You must use `Object.getOwnPropertySymbols(obj)` or `Reflect.ownKeys(obj)` to access them.

### 6. Destructuring Defaults Trigger Only on `undefined`
`const { timeout = 5000 } = { timeout: null }` results in `timeout === null`! Defaults evaluate **only** when the property value is `undefined`.

### 7. Recursive Setter Stack Overflow
Assigning `this.prop = val` inside a setter for `prop` causes infinite recursion. Always store values in an internal backing property like `this._prop`.

---

## Hands-on Exercise

### Scenario: Safe Dynamic Configuration Normalizer

You are building a configuration ingest service in Node.js that accepts untrusted JSON input from API clients and normalizes it for database updates.

### Buggy Code

A developer wrote the following profile updater, but it contains severe production flaws:
1. It uses a naive shallow merge that allows prototype pollution.
2. It treats properties set to `undefined` the same as omitted properties.
3. It cannot handle null-prototype dictionary lookups safely.

```js
// Node.js code (Buggy Implementation)
function updateSystemProfile(existingConfig, untrustedInput) {
  // Bug 1: Object.assign allows prototype pollution if untrustedInput contains __proto__
  const updated = Object.assign({}, existingConfig, untrustedInput);

  // Bug 2: Missing vs. undefined ambiguity
  if (untrustedInput.status === undefined) {
    updated.status = "ACTIVE"; // Overwrites explicit status: undefined!
  }

  // Bug 3: Using obj.hasOwnProperty crashes on Object.create(null)
  if (untrustedInput.hasOwnProperty("customMetadata")) {
    updated.customMetadata = untrustedInput.customMetadata;
  }

  return updated;
}
```

### Acceptance Criteria

1. **Prototype Pollution Protection:** Explicitly discard `__proto__`, `constructor`, and `prototype` keys from untrusted input.
2. **Strict Field Allowlist:** Only allow known configuration fields (`displayName`, `timezone`, `maxConnections`, `customMetadata`).
3. **Null-Prototype Compatibility:** Use `Object.hasOwn()` rather than `obj.hasOwnProperty()`.
4. **Preserve Explicit `undefined`:** Distinguish an omitted property from one explicitly passed as `undefined`.

### Solution

```js
// Node.js code
const ALLOWED_CONFIG_FIELDS = new Set([
  "displayName",
  "timezone",
  "maxConnections",
  "customMetadata"
]);

function normalizeSystemProfile(existingConfig, untrustedInput) {
  // Validate input types
  if (!existingConfig || typeof existingConfig !== "object") {
    throw new TypeError("existingConfig must be a valid object");
  }
  if (!untrustedInput || typeof untrustedInput !== "object" || Array.isArray(untrustedInput)) {
    throw new TypeError("untrustedInput must be a valid non-array object");
  }

  // Deep clone the existing configuration to ensure isolation
  const result = structuredClone(existingConfig);

  // Read all own keys of untrustedInput (including non-enumerable if needed)
  for (const key of Object.keys(untrustedInput)) {
    // 1. Prototype pollution barrier
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }

    // 2. Strict allowlist enforcement
    if (!ALLOWED_CONFIG_FIELDS.has(key)) {
      continue;
    }

    // 3. Null-prototype safe property existence check
    if (Object.hasOwn(untrustedInput, key)) {
      const incomingVal = untrustedInput[key];

      if (typeof incomingVal === "object" && incomingVal !== null && !Array.isArray(incomingVal)) {
        // Deep clone nested metadata objects to avoid shared references
        result[key] = structuredClone(incomingVal);
      } else {
        // Preserves incoming value, including explicit undefined
        result[key] = incomingVal;
      }
    }
  }

  return result;
}

// --- Verification Tests ---

const baseConfig = {
  displayName: "Default Node",
  timezone: "UTC",
  maxConnections: 100,
  customMetadata: { env: "prod" }
};

// Test 1: Normal clean update
const update1 = { displayName: "Auth Cluster", maxConnections: 500 };
const res1 = normalizeSystemProfile(baseConfig, update1);
console.log("Test 1 Result:", res1.displayName, res1.maxConnections); // "Auth Cluster" 500

// Test 2: Attempted Prototype Pollution
const attackPayload = JSON.parse('{"__proto__": {"polluted": true}, "unknownField": "hacked"}');
const res2 = normalizeSystemProfile(baseConfig, attackPayload);
console.log("Test 2 Result (Pollution blocked):", ({}).polluted); // undefined ✅
console.log("Test 2 Result (Unknown blocked):", res2.unknownField); // undefined ✅

// Test 3: Null-prototype dictionary input
const nullProtoInput = Object.create(null);
nullProtoInput.timezone = "Europe/London";
const res3 = normalizeSystemProfile(baseConfig, nullProtoInput);
console.log("Test 3 Result (Null-proto safe):", res3.timezone); // "Europe/London" ✅

// Test 4: Nested mutation isolation
const res4 = normalizeSystemProfile(baseConfig, { customMetadata: { env: "staging" } });
res4.customMetadata.env = "dev";
console.log("Test 4 Result (Original unmutated):", baseConfig.customMetadata.env); // "prod" ✅
```

---

## Summary

- **Literal Features:** Modern object literals support shorthand properties `{ key }`, shorthand methods `{ m() {} }`, and computed keys `{ [expr]: val }`.
- **Property Access:** Dot notation requires static valid identifiers; bracket notation evaluates dynamic expressions and handles arbitrary string/symbol keys.
- **Missing vs. `undefined`:** Reading missing properties returns `undefined`. Use `Object.hasOwn(obj, key)` to detect direct property ownership and `in` to detect inherited properties.
- **Null-Prototype Objects:** `Object.create(null)` creates dictionaries without `Object.prototype` baggage, protecting against key collisions and prototype pollution.
- **Accessors:** Getters and setters execute custom logic on read/write. Backing variables (`_prop`) prevent infinite recursion.
- **Copying Semantics:** Spread (`...`) and `Object.assign()` perform shallow copies. Use `structuredClone()` for deep copies.
- **Prototype Pollution:** Unvalidated recursive merges that process `__proto__` or `constructor` can compromise all objects across the Node.js runtime. Always block these keys.
- **Objects vs. `Map`:** Use plain objects for structured domain models and fixed shapes. Use `Map` for high-frequency dynamic key-value caches with non-string keys and size tracking.

---

## Cheat Sheet

### Existence Checks

| Syntax | Scope | Safe for `Object.create(null)` | Returns for `prop: undefined` |
| :--- | :--- | :--- | :--- |
| `obj.prop !== undefined` | Own & Inherited | ✅ Yes | ❌ `false` (Ambiguous) |
| `"prop" in obj` | Own & Inherited | ✅ Yes | ✅ `true` |
| `Object.hasOwn(obj, "prop")`| **Own Only** | ✅ Yes | ✅ `true` |
| `obj.hasOwnProperty("prop")`| **Own Only** | ❌ `TypeError` | ✅ `true` |

### Object Creation Mechanisms

| Mechanism | Resulting Prototype | Best Use Case |
| :--- | :--- | :--- |
| `{ prop: val }` | `Object.prototype` | Standard application records and configurations |
| `Object.create(proto)` | Custom `proto` | Explicit prototype delegation without classes |
| `Object.create(null)` | `null` (None) | Safe lookup dictionaries, caches, option maps |

### Common Pitfalls

- **Confusing shallow copy with deep copy** → mutating nested properties on `{ ...obj }` modifies the original object. Use `structuredClone()`.
- **Using `obj.hasOwnProperty(key)`** → crashes on null-prototype objects. Use `Object.hasOwn(obj, key)`.
- **Unsafe recursive merging of untrusted input** → leads to prototype pollution via `__proto__` injection.
- **Infinite recursion in setters** → assigning to `this.prop` inside `set prop(v)` calls the setter recursively until the call stack blows.
- **Assuming `Object.keys()` finds Symbol properties** → symbols are skipped by `Object.keys()` and `for...in`. Use `Object.getOwnPropertySymbols()`.
- **Relying on direct read for optional properties** → `if (!user.settings)` fails if `settings` is present with `false` or `null`.

---

## Interview Questions

### 1. What is the difference between `in`, `Object.hasOwn()`, and a direct property read?

**Question:** Compare `key in obj`, `Object.hasOwn(obj, key)`, and `obj[key] !== undefined`. Provide examples where each produces a different result.

**Answer:**
1. **`key in obj` (Prototype-aware):**
   - Returns `true` if the property exists on the object **or anywhere in its prototype chain**, regardless of the property's value (even if `undefined`).
   - *Example:* `"toString" in {}` returns `true` because `toString` is inherited from `Object.prototype`.
2. **`Object.hasOwn(obj, key)` (Own properties only):**
   - Returns `true` **only** if the property is defined directly on the object instance itself. It completely ignores inherited properties.
   - It is safe to use on null-prototype objects (`Object.create(null)`).
   - *Example:* `Object.hasOwn({}, "toString")` returns `false`.
3. **`obj[key] !== undefined` (Value check):**
   - Evaluates the value of the property.
   - It cannot distinguish between an absent property and a property that exists with the value `undefined`.
   - *Example:* For `{ a: undefined }`, both `a in obj` and `Object.hasOwn(obj, "a")` are `true`, but `obj.a !== undefined` evaluates to `false`.

---

### 2. Predict the Output: Destructuring defaults, missing properties, and JSON serialization

```js
const record = {
  title: "API Gateway",
  active: undefined,
  retryCount: 0
};

const {
  title = "Default",
  active = true,
  retryCount = 3,
  timeout = 1000
} = record;

console.log(title, active, retryCount, timeout);
console.log(JSON.stringify(record));
console.log(Object.keys(record));
```

**Question:** Predict the output of the destructured variables, the JSON string, and the `Object.keys()` array. Explain why `retryCount` and `active` evaluate the way they do.

**Answer:**
**Output:**
```text
API Gateway true 0 1000
{"title":"API Gateway","retryCount":0}
[ 'title', 'active', 'retryCount' ]
```

**Explanation:**
1. **Destructuring Defaults:**
   - Destructuring default values trigger **only when the property value is `undefined`** or missing.
   - `active` is explicitly `undefined`, so its default `true` is evaluated and assigned.
   - `retryCount` is `0`. Zero is a falsy value, but it is **not** `undefined`. Therefore, the default `3` is skipped, and `retryCount` remains `0`.
   - `timeout` is missing on `record`, so its default `1000` is used.
2. **JSON Serialization (`JSON.stringify`):**
   - `JSON.stringify` strips any property whose value is `undefined`.
   - Thus, `"active": undefined` is completely omitted from the resulting JSON string: `{"title":"API Gateway","retryCount":0}`.
3. **`Object.keys(record)`:**
   - `Object.keys()` returns all own enumerable string keys regardless of their value. Because `active` was explicitly defined on `record`, it is included in the array: `['title', 'active', 'retryCount']`.

---

### 3. Debugging: Diagnosing a shared-state mutation in an Express service

```js
const DEFAULT_USER_PERMISSIONS = {
  roles: ["viewer"],
  settings: { emailNotifications: true }
};

function createUserSession(username, customOverrides = {}) {
  // Developer attempted a shallow merge
  const session = {
    username,
    ...DEFAULT_USER_PERMISSIONS,
    ...customOverrides
  };

  return session;
}

const session1 = createUserSession("alice");
const session2 = createUserSession("bob");

session1.roles.push("admin");
session1.settings.emailNotifications = false;

console.log("Bob roles:", session2.roles);
console.log("Bob notifications:", session2.settings.emailNotifications);
```

**Question:** Bob was intended to be a standard user, but logs indicate Bob received `admin` privileges and had notifications disabled. Diagnose the issue and provide two fixes with their tradeoffs.

**Answer:**
**Diagnosis:**
The spread operator (`...`) performs a **shallow copy**.
- It duplicates top-level primitive properties, but for nested object/array references (`roles` array and `settings` object), it copies only the memory reference.
- Both `session1` and `session2` point to the exact same `DEFAULT_USER_PERMISSIONS.roles` array and `DEFAULT_USER_PERMISSIONS.settings` object in memory.
- Mutating `session1.roles` mutates the shared default object, corrupting all future user sessions.

**Two Fixes:**
1. **Native Deep Cloning with `structuredClone()` (Recommended):**
   ```js
   function createUserSession(username, customOverrides = {}) {
     const base = structuredClone(DEFAULT_USER_PERMISSIONS);
     return { username, ...base, ...structuredClone(customOverrides) };
   }
   ```
   *Tradeoff:* Completely isolates nested structures, but incurs slight allocation overhead on every session creation.
2. **Factory Function for Default State:**
   ```js
   const createDefaultPermissions = () => ({
     roles: ["viewer"],
     settings: { emailNotifications: true }
   });

   function createUserSession(username, customOverrides = {}) {
     return { username, ...createDefaultPermissions(), ...customOverrides };
   }
   ```
   *Tradeoff:* Fast and idiomatic, though nested properties inside `customOverrides` must still be cloned carefully if they contain objects.

---

### 4. Node.js Backend Scenario: Preventing Prototype Pollution in a Configuration Deep Merge

**Question:** In a Node.js microservice accepting untrusted JSON configuration payloads from third parties, implement a secure recursive deep merge function that protects against Prototype Pollution while correctly merging nested objects.

**Answer:**

```js
// Node.js code
function secureDeepMerge(target, source) {
  // Ensure both arguments are valid objects
  if (!target || typeof target !== "object" || Array.isArray(target)) {
    throw new TypeError("Target must be a non-null object");
  }
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return target;
  }

  // Iterate over own enumerable properties of source
  for (const key of Object.keys(source)) {
    // 1. Prototype Pollution Defense: Block dangerous prototype traversal keys
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      console.warn(`SECURITY ALERT: Blocked attempted prototype pollution key '${key}'`);
      continue;
    }

    const sourceVal = source[key];

    // If source value is a nested object, recurse safely
    if (sourceVal !== null && typeof sourceVal === "object" && !Array.isArray(sourceVal)) {
      if (!Object.hasOwn(target, key) || typeof target[key] !== "object" || target[key] === null) {
        // Initialize clean sub-object if missing
        target[key] = {};
      }
      secureDeepMerge(target[key], sourceVal);
    } else {
      // Direct primitive or array assignment
      target[key] = sourceVal;
    }
  }

  return target;
}

// Example Security Verification:
const baseConfig = { server: { port: 3000 } };
const maliciousInput = JSON.parse('{"server": {"port": 8080}, "__proto__": {"isAdmin": true}}');

secureDeepMerge(baseConfig, maliciousInput);

console.log("Updated port:", baseConfig.server.port); // 8080
console.log("Global pollution check:", ({}).isAdmin);  // undefined (Clean! ✅)
```

---

<nav aria-label="Lecture navigation">

[← Day 08: Closures, Execution Context, and this](day-08-closures-execution-context-and-this.md) | [Roadmap](../javascript-roadmap.md) | [Day 10: Prototypes, Classes, and Inheritance →](day-10-prototypes-classes-and-inheritance.md)

</nav>
