# Day 11: Property Descriptors, Enumerability, and Immutability

<nav aria-label="Lecture navigation">

[← Day 10: Prototypes, Classes, and Inheritance](day-10-prototypes-classes-and-inheritance.md) | [Roadmap](../javascript-roadmap.md) | [Day 12: Built-in Data Structures and Serialization →](day-12-built-in-data-structures-and-serialization.md)

</nav>

---

## What You Will Learn Today

By the end of this lecture, you should be able to:

- Inspect and configure property descriptors using `Object.getOwnPropertyDescriptor` and `Object.defineProperty`.
- Master the three core property attributes: `writable`, `enumerable`, and `configurable`.
- Recognize the dangerous descriptor default trap: omitted attributes in `Object.defineProperty` default to `false`.
- Distinguish the three progressive levels of object immutability: `Object.preventExtensions()`, `Object.seal()`, and `Object.freeze()`.
- Explain why `Object.freeze()` is strictly shallow and how to implement a cycle-safe `deepFreeze()` algorithm.
- Understand why freezing native collections (`Map`, `Set`, `Buffer`) fails to prevent internal mutation.
- Master JavaScript's deterministic property enumeration order across integer indices, strings, and symbols.
- Design defensive copying boundaries to safeguard shared state in high-throughput Node.js microservices.

**Prerequisites:** [Day 09 – Objects and Property Access](day-09-objects-and-property-access.md) (own vs. inherited properties, accessors) and [Day 10 – Prototypes, Classes, and Inheritance](day-10-prototypes-classes-and-inheritance.md) (class elements, method sharing).  
*Upcoming Connections:* [Day 12](day-12-built-in-data-structures-and-serialization.md) explores built-in collections (`Map`, `Set`) and JSON serialization; [Day 13](day-13-destructuring-spread-and-modern-operators.md) covers spread syntax and shallow vs. deep operations.

---

## Quick Vocabulary Card

| Term | Definition |
| :--- | :--- |
| **Property Descriptor** | A JavaScript object that describes the configuration and internal attributes of a specific object property. |
| **Data Descriptor** | A property descriptor holding a concrete value along with `writable`, `enumerable`, and `configurable` flags. |
| **Accessor Descriptor** | A property descriptor holding `get` and/or `set` functions along with `enumerable` and `configurable` flags. |
| **`writable`** | An attribute determining whether an assignment (`obj.prop = val`) can alter the property's value. |
| **`enumerable`** | An attribute determining whether the property is exposed during iteration (`for...in`, `Object.keys`, spread). |
| **`configurable`** | An attribute determining whether the property can be deleted from the object or have its attributes modified. |
| **`preventExtensions`** | An object-level restriction preventing the addition of any new own properties. |
| **`seal`** | An object-level restriction that prevents property addition and marks all existing properties as non-configurable. |
| **`freeze`** | The strongest shallow restriction: seals the object and makes all existing data properties non-writable. |
| **Shallow Immutability** | An immutability state protecting only the top-level property bindings of an object, leaving nested objects mutable. |
| **Deep Freeze** | A recursive routine that walks an object graph to freeze every nested object and array. |

---

## 1. Property Descriptors: More Than Just a Value

In JavaScript, properties are not merely variable names mapped to values. Every property has an underlying **Property Descriptor** record that governs how the runtime allows you to interact with that property.

### Inspecting Descriptors

You inspect property descriptors using `Object.getOwnPropertyDescriptor(obj, prop)` for a single property, or `Object.getOwnPropertyDescriptors(obj)` for all own properties:

```js
// Node.js code
const serviceConfig = { port: 8080 };

// Inspect property descriptor
const descriptor = Object.getOwnPropertyDescriptor(serviceConfig, "port");
console.log(descriptor);
// {
//   value: 8080,
//   writable: true,
//   enumerable: true,
//   configurable: true
// }
```

### The Two Types of Descriptors

1. **Data Descriptors:** Contain `value` and a boolean `writable` attribute.
2. **Accessor Descriptors:** Contain `get` and/or `set` functions (never `value` or `writable`).
3. **Shared Attributes:** Both types always feature `enumerable` and `configurable`.

```js
// Node.js code
// ❌ Mutual Exclusivity Trap: Cannot mix data and accessor attributes!
try {
  Object.defineProperty({}, "invalidProp", {
    value: "hello",
    get() { return "hello"; } // TypeError: Invalid property descriptor!
  });
} catch (err) {
  console.log("❌ Descriptor Error:", err.message);
  // Invalid property descriptor. Cannot both specify accessors and a value or writable attribute
}
```

---

## 2. Defining Properties: The Critical Default Trap

When you create a property using standard object literal syntax `{ key: value }` or direct assignment `obj.key = value`, JavaScript defaults all descriptor attributes to `true`.

However, when you define a property using **`Object.defineProperty()`**, any omitted boolean attributes default to **`false`**, and omitted values default to **`undefined`**!

```js
// Node.js code
"use strict";

const config = {};

// ✅ Created via Object.defineProperty with omitted attributes
Object.defineProperty(config, "environment", {
  value: "production"
  // writable: false (omitted -> false!)
  // enumerable: false (omitted -> false!)
  // configurable: false (omitted -> false!)
});

console.log(config.environment); // "production"

// ❌ 1. Non-writable: Cannot modify value
try {
  config.environment = "development";
} catch (err) {
  console.log("❌ Cannot write:", err.name); // TypeError: Cannot assign to read only property 'environment'
}

// ❌ 2. Non-enumerable: Hidden from Object.keys() and spread {...obj}
console.log("Keys:", Object.keys(config)); // [] (Empty!)
console.log("Spread:", { ...config });     // {} (Empty!)

// ❌ 3. Non-configurable: Cannot delete or redefine
try {
  delete config.environment;
} catch (err) {
  console.log("❌ Cannot delete:", err.name); // TypeError: Cannot delete property 'environment'
}
```

### Descriptor Defaults Comparison

| Attribute | Literal Syntax `{ prop: val }` | Direct Assignment `obj.p = v` | `Object.defineProperty` (Omitted) |
| :--- | :--- | :--- | :--- |
| **`value`** | Assigned Value | Assigned Value | `undefined` |
| **`writable`** | `true` | `true` | **`false`** |
| **`enumerable`** | `true` | `true` | **`false`** |
| **`configurable`**| `true` | `true` | **`false`** |

---

## 3. The Three Flags in Action: `writable`, `enumerable`, and `configurable`

### 1. `writable`: Assignment Protection

The `writable` attribute dictates whether the value can be modified via an assignment operator (`=`).
- In strict mode (`"use strict"`), assigning to a non-writable property throws a `TypeError`.
- In non-strict mode, the assignment fails silently without changing the value.

```js
// Node.js code
"use strict";
const app = {};
Object.defineProperty(app, "version", {
  value: "1.0.0",
  writable: false,
  configurable: true // Still configurable!
});

// ❌ Cannot assign:
// app.version = "2.0.0"; // TypeError

// ✅ But can be redefined because configurable is true:
Object.defineProperty(app, "version", { value: "2.0.0" });
console.log("Redefined version:", app.version); // "2.0.0"
```

### 2. `enumerable`: Iteration Visibility

The `enumerable` attribute dictates whether the property appears during general enumeration:
- **Included:** `for...in` loops, `Object.keys()`, `Object.values()`, `Object.entries()`, `JSON.stringify()`, and object spread (`{ ...obj }`).
- **Always Visible:** Direct property reads (`obj.prop`), `Object.hasOwn(obj, prop)`, and `Object.getOwnPropertyNames(obj)`.

```js
// Node.js code
const userRecord = { id: 101, username: "alice_dev" };

Object.defineProperty(userRecord, "internalHash", {
  value: "0xdeadbeef",
  enumerable: false // Hide from logs and serialization
});

console.log("Object.keys():", Object.keys(userRecord)); // [ 'id', 'username' ]
console.log("JSON:", JSON.stringify(userRecord));        // {"id":101,"username":"alice_dev"}

// ✅ Non-enumerable does NOT mean private:
console.log("Direct read:", userRecord.internalHash);    // "0xdeadbeef"
console.log("Names:", Object.getOwnPropertyNames(userRecord)); // [ 'id', 'username', 'internalHash' ]
```

### 3. `configurable`: The One-Way Lock

The `configurable` attribute controls whether a property can be removed via `delete` or have its descriptor modified.
- Once a property is set to `configurable: false`, it **cannot** be changed back to `configurable: true`.
- It cannot be switched between a data property and an accessor property.
- **The One Exception:** If `configurable: false` and `writable: true`, you can still modify `value`, and you can transition `writable` from `true` to `false` (locking it down forever).

```js
// Node.js code
"use strict";
const token = {};
Object.defineProperty(token, "jwt", {
  value: "initial_token",
  writable: true,
  configurable: false // Irreversible lock!
});

// ✅ Value can still be changed because writable is true
token.jwt = "updated_token";
console.log(token.jwt); // "updated_token"

// ✅ Writable can be transitioned from true to false
Object.defineProperty(token, "jwt", { writable: false });

// ❌ Attempting to make it configurable again throws TypeError!
try {
  Object.defineProperty(token, "jwt", { configurable: true });
} catch (err) {
  console.log("❌ Cannot reconfigure:", err.name); // TypeError: Cannot redefine property: jwt
}
```

---

## 4. Object-Level Immutability: The Three Levels

JavaScript provides three progressively restrictive static methods on `Object` to lock down entire objects:

```
                           Object Restriction Levels
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         ▼                            ▼                            ▼
1. preventExtensions()          2. seal()                    3. freeze()
   - No new properties          - No new properties          - No new properties
   - Can delete existing        - No deleting properties     - No deleting properties
   - Can update values          - Can update values          - NO updating values
```

### Level 1: `Object.preventExtensions(obj)`
- Prevents adding new own properties.
- Existing properties **can** be modified and deleted.
- Verification: `Object.isExtensible(obj)` returns `false`.

```js
// Node.js code
"use strict";
const extObj = { status: "ACTIVE" };
Object.preventExtensions(extObj);

// ✅ Existing properties can be updated and deleted
extObj.status = "PAUSED";
delete extObj.status;
console.log(extObj.status); // undefined

// ❌ Cannot add new properties
try {
  extObj.newKey = 123;
} catch (err) {
  console.log("❌ Cannot extend:", err.name); // TypeError: Cannot add property newKey, object is not extensible
}
```

### Level 2: `Object.seal(obj)`
- Runs `preventExtensions()` + marks all existing own properties as `configurable: false`.
- Properties **cannot** be added or deleted.
- Existing writable properties **can still be updated**.
- Verification: `Object.isSealed(obj)` returns `true`.

```js
// Node.js code
"use strict";
const sealedObj = { timeout: 5000 };
Object.seal(sealedObj);

// ✅ Modifying existing writable property works
sealedObj.timeout = 10000;
console.log(sealedObj.timeout); // 10000

// ❌ Deleting throws TypeError
try {
  delete sealedObj.timeout;
} catch (err) {
  console.log("❌ Cannot delete sealed:", err.name); // TypeError: Cannot delete property 'timeout'
}
```

### Level 3: `Object.freeze(obj)`
- Runs `seal()` + marks all existing data properties as `writable: false`.
- Properties cannot be added, deleted, reconfigured, or modified.
- Verification: `Object.isFrozen(obj)` returns `true`.

```js
// Node.js code
"use strict";
const frozenObj = { maxConnections: 100 };
Object.freeze(frozenObj);

// ❌ Modifying throws TypeError in strict mode
try {
  frozenObj.maxConnections = 200;
} catch (err) {
  console.log("❌ Cannot modify frozen:", err.name); // TypeError: Cannot assign to read only property 'maxConnections'
}
```

### Comparison Matrix of Restriction Levels

| Operation | Can Add New Keys? | Can Delete Existing Keys? | Can Modify Existing Values? | Can Reconfigure Flags? |
| :--- | :--- | :--- | :--- | :--- |
| **Normal Object** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **`preventExtensions()`** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **`seal()`** | ❌ No | ❌ No | ✅ Yes | ❌ No |
| **`freeze()`** | ❌ No | ❌ No | ❌ No | ❌ No |

---

## 5. The Shallow Freeze Trap & Deep Immutability

The most dangerous pitfall with `Object.freeze()` is assuming that it freezes an entire object graph.

**`Object.freeze()` is strictly shallow.** It locks down only the top-level property references of the immediate object. If a property references an array or nested object, the nested object remains completely mutable!

```js
// Node.js code
"use strict";

const serviceCluster = {
  region: "us-east-1",
  database: {
    host: "db.internal",
    poolSize: 10
  }
};

Object.freeze(serviceCluster);

// ❌ Top-level property is protected:
// serviceCluster.region = "eu-west-1"; // TypeError

// ⚠️ NESTED OBJECT IS FULLY MUTABLE! (Shallow freeze trap)
serviceCluster.database.poolSize = 999;
console.log("Mutated nested poolSize:", serviceCluster.database.poolSize); // 999 (Mutated!)
```

### Freezing Native Collections (`Map`, `Set`, `Buffer`)

Freezing a native collection does **not** protect its stored data. `Object.freeze(myMap)` freezes only the map instance properties, but `myMap.set(...)` mutates internal engine slots!

```js
// Node.js code
const cacheMap = new Map();
Object.freeze(cacheMap);

// ✅ Mutation still succeeds!
cacheMap.set("session_123", "active");
console.log(cacheMap.get("session_123")); // "active"
```

### Writing a Cycle-Safe `deepFreeze()` Utility

To achieve true deep immutability on complex configuration trees, write a recursive deep-freeze utility that uses a `WeakSet` to avoid infinite loops on circular references:

```js
// Node.js code
function deepFreeze(target, seen = new WeakSet()) {
  // If target is null or not an object, return immediately
  if (target === null || typeof target !== "object") {
    return target;
  }

  // Prevent infinite recursion on circular object graphs
  if (seen.has(target)) {
    return target;
  }
  seen.add(target);

  // Freeze all nested properties first (depth-first)
  for (const key of Reflect.ownKeys(target)) {
    const val = target[key];
    if (val !== null && (typeof val === "object" || typeof val === "function")) {
      deepFreeze(val, seen);
    }
  }

  // Freeze current target
  return Object.freeze(target);
}

// Verification with nested objects and arrays
const deepConfig = {
  db: { host: "localhost", ports: [5432, 5433] }
};

deepFreeze(deepConfig);

// ❌ Nested mutations now throw in strict mode
try {
  deepConfig.db.ports.push(5434);
} catch (err) {
  console.log("❌ Deep freeze protected array:", err.name); // TypeError: Cannot add property 2, object is not extensible
}
```

---

## 6. Deterministic Property Traversal Order

Historically, JavaScript object key iteration order was unpredictable. Since ES2015, the ECMAScript specification guarantees a **strictly deterministic property traversal order** for operations like `Reflect.ownKeys()`, `Object.getOwnPropertyNames()`, and `Object.keys()`:

1. **Integer Index Keys:** Strings parsed as 32-bit unsigned integers (e.g., `"0"`, `"1"`, `"42"`), sorted in **ascending numeric order**.
2. **String Keys:** All other string keys, sorted in **chronological insertion order**.
3. **Symbol Keys:** All Symbol keys, sorted in **chronological insertion order**.

```js
// Node.js code
const s1 = Symbol("first");
const s2 = Symbol("second");

const orderedObj = {
  b: "string b",
  "100": "int 100",
  a: "string a",
  "2": "int 2",
  [s1]: "symbol 1",
  "1": "int 1",
  [s2]: "symbol 2"
};

// Reflect.ownKeys() reveals the exact spec traversal order:
console.log(Reflect.ownKeys(orderedObj));
// [
//   '1', '2', '100',          // 1. Integer keys in numeric ascending order
//   'b', 'a',                 // 2. Other string keys in insertion order
//   Symbol(first),            // 3. Symbol keys in insertion order
//   Symbol(second)
// ]
```

> **Design Warning:** Never rely on numeric string key insertion order in business logic. If strict insertion order is required for all key types (including numbers), use a **`Map`**.

---

## 7. Defensive Copying vs. Immutability at API Boundaries

In backend Node.js microservices, managing shared state across modules is critical:

- **Defensive Copying:** Duplicate the data when accepting it into a service or returning it to a caller. This isolates internal state from external tampering.
- **Deep Freezing:** Enforce read-only invariants on static configuration or dictionary objects loaded at startup.

```js
// Node.js code
class SecurityContext {
  #permissions;

  constructor(permissions = []) {
    // ✅ Defensive copy on ingestion + freeze to guarantee immutability
    this.#permissions = Object.freeze([...permissions]);
  }

  getPermissions() {
    // ✅ Defensive copy on export: caller cannot mutate internal state
    return [...this.#permissions];
  }
}

const perms = ["READ", "WRITE"];
const context = new SecurityContext(perms);

// External tampering attempt on input array
perms.push("DELETE_ALL");
console.log("Internal permissions isolated:", context.getPermissions()); // [ 'READ', 'WRITE' ]
```

---

## Tricky Points

### 1. `const` Does Not Mean Immutable
`const` creates an immutable variable binding (you cannot reassign `x = newObj`), but the object referenced by `x` remains fully mutable (`x.prop = 42`). `Object.freeze()` controls object mutability; `const` controls variable reassignment.

### 2. Deleting Non-Writable Properties
A non-writable property (`writable: false`) can still be **deleted** if it is `configurable: true`. Writable controls assignment; configurable controls deletion.
```js
// Node.js code
const obj = {};
Object.defineProperty(obj, "data", { value: 123, writable: false, configurable: true });
delete obj.data; // Succeeds!
console.log(obj.data); // undefined
```

### 3. Modifying Non-Configurable Properties
A non-configurable property (`configurable: false`) can still have its value changed if it was created with `writable: true`.

### 4. Non-Enumerable Properties in Cloning and Merging
`Object.assign()` and spread `{ ...obj }` copy **only enumerable own properties**. Non-enumerable properties are silently omitted during shallow copies.

### 5. `Object.freeze()` Fails on Accessor Properties Without Setters
If an object has a getter without a setter, it is already read-only. Calling `Object.freeze()` leaves getters intact because accessors do not have a `writable` attribute to modify.

---

## Hands-on Exercise

### Scenario: Safe Production Configuration Registry

You are building a configuration manager for a multi-tenant Node.js microservice. You must implement `createProtectedConfig(rawConfig)`, ensuring that:
1. Top-level and nested settings are completely immutable.
2. Sensitive keys are marked non-enumerable to prevent accidental leaks in logs.
3. The original input object is left untouched.

### Buggy Code

```js
// Node.js code (Buggy Implementation)
function createBuggyConfig(raw) {
  // Bug 1: Mutates the caller's input object directly!
  raw.readTime = Date.now();
  
  // Bug 2: Shallow freeze allows nested database mutation!
  Object.freeze(raw);

  // Bug 3: Sensitive apiKey is enumerable; leaks in JSON.stringify()
  return raw;
}
```

### Acceptance Criteria

1. **Zero Input Mutation:** The incoming `rawConfig` object must not be modified in any way.
2. **Cycle-Safe Deep Immutability:** All nested objects and arrays must be frozen.
3. **Sensitive Key Redaction:** Properties named `apiKey` or `secretToken` must have their descriptor configured as `enumerable: false`.
4. **Strict Mode Safety:** Demonstrates throwing `TypeError` when any property at any depth is modified.

### Solution

```js
// Node.js code
function createProtectedConfig(rawConfig) {
  if (!rawConfig || typeof rawConfig !== "object" || Array.isArray(rawConfig)) {
    throw new TypeError("Configuration must be a non-null object");
  }

  // 1. Deep clone input to isolate from caller
  const cloned = structuredClone(rawConfig);

  // 2. Hide sensitive keys before freezing
  const SENSITIVE_KEYS = new Set(["apiKey", "secretToken", "password"]);

  function redactAndFreeze(target, seen = new WeakSet()) {
    if (target === null || typeof target !== "object") return target;
    if (seen.has(target)) return target;
    seen.add(target);

    for (const key of Reflect.ownKeys(target)) {
      // Redact sensitive keys
      if (SENSITIVE_KEYS.has(key)) {
        Object.defineProperty(target, key, {
          enumerable: false, // Hidden from Object.keys() & JSON.stringify()
          configurable: false
        });
      }

      const val = target[key];
      if (val !== null && typeof val === "object") {
        redactAndFreeze(val, seen);
      }
    }

    return Object.freeze(target);
  }

  return redactAndFreeze(cloned);
}

// --- Verification Tests ---
"use strict";

const raw = {
  appName: "OrderService",
  database: { host: "db.prod", poolSize: 20 },
  apiKey: "secret_live_key_9988"
};

const protectedConfig = createProtectedConfig(raw);

// Test 1: Top-level freeze protection
try {
  protectedConfig.appName = "HackedService";
} catch (err) {
  console.log("Test 1 Passed (Top-level protected):", err.name); // TypeError
}

// Test 2: Nested object freeze protection
try {
  protectedConfig.database.poolSize = 100;
} catch (err) {
  console.log("Test 2 Passed (Nested protected):", err.name); // TypeError
}

// Test 3: Sensitive key hidden from JSON and Object.keys
console.log("Keys:", Object.keys(protectedConfig)); // [ 'appName', 'database' ] (apiKey hidden! ✅)
console.log("JSON:", JSON.stringify(protectedConfig)); // {"appName":"OrderService","database":{"host":"db.prod","poolSize":20}}
console.log("Direct Secret Read:", protectedConfig.apiKey); // "secret_live_key_9988" (Accessible directly ✅)

// Test 4: Caller input unmutated
raw.appName = "ChangedLocally";
console.log("Original unmutated:", protectedConfig.appName); // "OrderService" ✅
```

---

## Summary

- **Property Descriptors:** Dictate how properties behave using data attributes (`value`, `writable`) or accessor attributes (`get`, `set`), combined with `enumerable` and `configurable`.
- **The `defineProperty` Default Trap:** Properties defined via `Object.defineProperty` default omitted flags to `false`, whereas object literals default them to `true`.
- **`writable` vs. `configurable`:** `writable` controls assignment; `configurable` controls deletion and redefinition. Non-writable properties can be deleted if configurable.
- **Three Immutability Levels:**
  - `preventExtensions()`: Disallows new properties.
  - `seal()`: Disallows adding or deleting properties.
  - `freeze()`: Disallows adding, deleting, or updating properties.
- **Shallow Immutability:** `Object.freeze()` only protects the immediate object. Deep immutability requires recursive traversal handling circular references.
- **Deterministic Property Order:** Integer keys sort ascending numerically first, followed by string keys in insertion order, followed by symbol keys in insertion order.

---

## Cheat Sheet

### Immutability Methods Quick Reference

| Method | Can Add Keys? | Can Delete Keys? | Can Modify Values? | Affects Nested Objects? |
| :--- | :--- | :--- | :--- | :--- |
| **`Object.preventExtensions(obj)`** | ❌ No | ✅ Yes | ✅ Yes | ❌ No (Shallow) |
| **`Object.seal(obj)`** | ❌ No | ❌ No | ✅ Yes | ❌ No (Shallow) |
| **`Object.freeze(obj)`** | ❌ No | ❌ No | ❌ No | ❌ No (Shallow) |
| **`deepFreeze(obj)`** | ❌ No | ❌ No | ❌ No | ✅ Yes (Recursive) |

### Descriptor Attribute Flags

| Attribute | When `true` | When `false` |
| :--- | :--- | :--- |
| **`writable`** | `obj.key = val` updates value | Assignment throws `TypeError` in strict mode |
| **`enumerable`** | Visible in `Object.keys()`, `for...in`, spread | Hidden from iteration; visible in `getOwnPropertyNames` |
| **`configurable`**| Can delete property and reconfigure flags | `delete` fails; flags locked permanently (one-way lock) |

### Common Pitfalls

- **Assuming `Object.freeze` protects nested objects** → nested arrays/objects remain completely mutable. Use recursive deep freeze.
- **Forgetting defaults in `Object.defineProperty`** → omitting `enumerable: true` hides the property from `Object.keys()`.
- **Confusing `const` with `freeze`** → `const` prevents variable reassignment; `freeze` prevents object mutation.
- **Expecting `Object.freeze` to lock down `Map` or `Set`** → collection methods (`.set()`, `.add()`) continue mutating internal state.
- **Relying on integer key insertion order** → integer-like keys are always enumerated in numeric ascending order first.

---

## Interview Questions

### 1. What are the exact behavioral differences between `writable: false` and `configurable: false`?

**Question:** Explain how `writable` and `configurable` operate independently. Can you delete a non-writable property? Can you change the value of a non-configurable property?

**Answer:**
`writable` and `configurable` govern completely separate aspects of property behavior:
1. **`writable` controls assignment:**
   - When `writable: true`, assignment (`obj.prop = val`) succeeds.
   - When `writable: false`, assignment throws a `TypeError` in strict mode (or fails silently in non-strict mode).
2. **`configurable` controls deletion and metadata modification:**
   - When `configurable: true`, you can remove the property with `delete obj.prop`, and you can modify its descriptor attributes using `Object.defineProperty()`.
   - When `configurable: false`, calling `delete` throws a `TypeError` in strict mode, and you cannot reconfigure its descriptor flags.
3. **Can you delete a non-writable property?**
   - **Yes.** As long as `configurable: true`, running `delete obj.prop` succeeds, even if `writable: false`. Deletion removes the entire property slot from the object, which is distinct from overwriting its value.
4. **Can you change the value of a non-configurable property?**
   - **Yes, under one condition:** If the property was defined with `writable: true`, you can still modify its value via assignment (`obj.prop = newValue`), even if `configurable: false`. Furthermore, you can transition `writable` from `true` to `false` on a non-configurable property, but never back from `false` to `true`.

---

### 2. Predict the Output: Property enumeration order and descriptor defaults

```js
const user = {};

user["2"] = "Two";
user["b"] = "B";
user["1"] = "One";

Object.defineProperty(user, "hidden", {
  value: "Secret",
  configurable: true
});

user["a"] = "A";

console.log(Object.keys(user));
console.log(Object.getOwnPropertyNames(user));
console.log(delete user.hidden);
console.log(delete user["2"]);
```

**Question:** What does this code print in strict mode? Explain the order of keys in both arrays and the result of the `delete` operations.

**Answer:**
**Output:**
```text
[ '1', '2', 'b', 'a' ]
[ '1', '2', 'b', 'hidden', 'a' ]
true
true
```

**Explanation:**
1. **`Object.keys(user)`:**
   - Traversal order mandates that integer index keys are visited first in numeric ascending order: `"1"`, `"2"`.
   - String keys follow in chronological insertion order: `"b"`, `"a"`.
   - The property `"hidden"` was defined using `Object.defineProperty()` without specifying `enumerable`. Therefore, `enumerable` defaulted to `false`. Non-enumerable properties are excluded from `Object.keys()`.
   - Result: `[ '1', '2', 'b', 'a' ]`.
2. **`Object.getOwnPropertyNames(user)`:**
   - Follows the exact same spec ordering (numeric ascending, then string insertion order), but **includes non-enumerable properties**.
   - Because `"hidden"` was defined after `"b"` and before `"a"`, the non-integer string insertion sequence is `"b"`, `"hidden"`, `"a"`.
   - Result: `[ '1', '2', 'b', 'hidden', 'a' ]`.
3. **`delete user.hidden`:**
   - `"hidden"` was explicitly defined with `configurable: true`. Deleting it succeeds and returns `true`.
4. **`delete user["2"]`:**
   - Properties created via bracket assignment default to `configurable: true`. Deleting `"2"` succeeds and returns `true`.

---

### 3. Debugging: Diagnosing a production bug with frozen configuration and `Map` caches

```js
const APP_SETTINGS = Object.freeze({
  env: "production",
  cacheLimits: { maxItems: 500 },
  featureFlags: new Map([["enableBeta", false]])
});

function applyRuntimeOverrides(overrides) {
  if (overrides.maxItems) {
    APP_SETTINGS.cacheLimits.maxItems = overrides.maxItems;
  }
  if (overrides.enableBeta !== undefined) {
    APP_SETTINGS.featureFlags.set("enableBeta", overrides.enableBeta);
  }
}

applyRuntimeOverrides({ maxItems: 1000, enableBeta: true });
console.log("maxItems:", APP_SETTINGS.cacheLimits.maxItems);
console.log("enableBeta:", APP_SETTINGS.featureFlags.get("enableBeta"));
```

**Question:** An engineer believed `APP_SETTINGS` was completely immutable because of `Object.freeze()`. However, both runtime overrides succeeded in mutating state. Explain why `Object.freeze()` failed to protect both fields and provide a robust fix.

**Answer:**
**Diagnosis:**
1. **Shallow Immutability:** `Object.freeze()` freezes only top-level properties of `APP_SETTINGS` (`env`, `cacheLimits`, `featureFlags`). The object referenced by `cacheLimits` was never frozen, allowing `APP_SETTINGS.cacheLimits.maxItems = 1000` to succeed.
2. **Native Collection Slots:** `Object.freeze()` locks down object properties, but `Map` stores entries in private engine slots. Calling `featureFlags.set()` does not modify object properties; it mutates internal `Map` state, completely bypassing `Object.freeze()`.

**Fix:**
Implement recursive deep freezing for plain objects, and wrap or clone collections so external callers cannot mutate internal state:
```js
// Node.js code (Hardened configuration)
function buildImmutableSettings() {
  const settings = {
    env: "production",
    cacheLimits: Object.freeze({ maxItems: 500 }),
    // Use a read-only wrapper or frozen plain object for flags
    featureFlags: Object.freeze({ enableBeta: false })
  };

  return Object.freeze(settings);
}

const SECURE_SETTINGS = buildImmutableSettings();
// Any attempt to mutate SECURE_SETTINGS.cacheLimits or SECURE_SETTINGS.featureFlags throws TypeError in strict mode!
```

---

### 4. Node.js Backend Scenario: Designing a Tamper-Proof Plugin Registry

**Question:** You are designing a plugin architecture for a Node.js API framework. Third-party plugins must be able to register hooks, but malicious or buggy plugins must not be able to overwrite or delete core framework hooks once registered. Design a tamper-proof hook registry using property descriptors and explain your design.

**Answer:**

```js
// Node.js code
class HookRegistry {
  #hooks = Object.create(null); // Null-prototype dictionary to prevent prototype pollution

  registerCoreHook(name, handler) {
    if (typeof handler !== "function") {
      throw new TypeError("Hook handler must be a function");
    }
    if (Object.hasOwn(this.#hooks, name)) {
      throw new Error(`Hook '${name}' is already registered and locked`);
    }

    // Define property as permanent, read-only, and non-deletable
    Object.defineProperty(this.#hooks, name, {
      value: handler,
      writable: false,      // Cannot overwrite with another function
      enumerable: true,      // Visible during hook inspection
      configurable: false    // Cannot delete or redefine descriptor
    });
  }

  executeHook(name, ...args) {
    const handler = this.#hooks[name];
    if (!handler) {
      throw new Error(`Hook '${name}' not found`);
    }
    return handler(...args);
  }

  getRegisteredHooks() {
    return Object.keys(this.#hooks);
  }
}

// Verification:
const registry = new HookRegistry();
registry.registerCoreHook("onAuth", (user) => console.log(`Authenticating: ${user}`));

// 1. Hook executes normally
registry.executeHook("onAuth", "Alice"); // "Authenticating: Alice"

// 2. Malicious plugin attempts to overwrite hook -> Throws Error or TypeError
try {
  registry.registerCoreHook("onAuth", () => console.log("Hacked auth!"));
} catch (err) {
  console.log("Security barrier caught duplicate:", err.message); // Hook 'onAuth' is already registered and locked
}

// 3. Deletion attempt fails in strict mode
"use strict";
try {
  delete registry.getRegisteredHooks().onAuth; // Cannot delete from sealed internal descriptor
} catch (err) {
  // Safe
}
```

**Architectural Rationale:**
- **`configurable: false`:** Guarantees that neither `delete this.#hooks[name]` nor `Object.defineProperty` can ever detach or redefine the registered hook.
- **`writable: false`:** Prevents accidental reassignment `this.#hooks[name] = newHandler`.
- **`Object.create(null)`:** Eliminates prototype pollution and key collisions with built-in `Object.prototype` methods (like `toString` or `constructor`).

---

<nav aria-label="Lecture navigation">

[← Day 10: Prototypes, Classes, and Inheritance](day-10-prototypes-classes-and-inheritance.md) | [Roadmap](../javascript-roadmap.md) | [Day 12: Built-in Data Structures and Serialization →](day-12-built-in-data-structures-and-serialization.md)

</nav>
