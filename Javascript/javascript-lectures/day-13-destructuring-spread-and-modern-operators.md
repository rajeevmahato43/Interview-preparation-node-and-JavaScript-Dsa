# Day 13: Destructuring, Spread, and Modern Operators

<nav aria-label="Lecture navigation">

[← Day 12: Built-in Data Structures and Serialization](day-12-built-in-data-structures-and-serialization.md) | [Roadmap](../javascript-roadmap.md) | [Day 14: Iterables, Iterators, Generators, and Symbols →](day-14-iterables-iterators-generators-and-symbols.md)

</nav>

---

## What You Will Learn Today

By the end of this lecture, you should be able to:

- Extract data cleanly using Array Destructuring (positional) and Object Destructuring (key-based with renaming).
- Avoid runtime crashes on missing nested structures using whole-parameter and nested defaults (`= {}`).
- Explain why destructuring defaults trigger only for `undefined` and preserve meaningful falsy values (`0`, `false`, `""`).
- Distinguish Rest syntax (collecting remaining values) from Spread syntax (expanding values).
- Master modern nullish operators: Optional Chaining (`?.`), Nullish Coalescing (`??`), and Logical Assignment (`??=`, `||=`, `&&=`).
- Avoid syntax errors when combining `??` with `&&` or `||` using explicit grouping parentheses.
- Normalize untrusted API request payloads defensively without mutating source data or leaking prototype properties.

**Prerequisites:** [Day 04 – Coercion, Equality, and Operators](day-04-coercion-equality-and-operators.md) (truthiness vs. nullishness) and [Day 09 – Objects and Property Access](day-09-objects-and-property-access.md) (property lookup, shallow copies).  
*Upcoming Connections:* [Day 14](day-14-iterables-iterators-generators-and-symbols.md) explores the Iterable protocol powering array destructuring and spread; [Day 16](day-16-symbols-reflection-and-proxies.md) covers metaprogramming and reflection.

---

## Quick Vocabulary Card

| Term | Definition |
| :--- | :--- |
| **Destructuring Assignment** | A JavaScript syntax expression that unpacks values from arrays or properties from objects into distinct local variables. |
| **Positional Matching** | The array destructuring mechanism where variables are assigned values strictly based on their index order. |
| **Property Renaming** | The object destructuring syntax (`{ oldKey: newVar }`) that extracts a property and binds it to a different local variable name. |
| **Rest Syntax (`...rest`)** | A pattern that collects all remaining, unmatched properties or array elements into a new data structure. |
| **Spread Syntax (`...spread`)** | A syntax that expands an iterable or object's enumerable own properties into a new array, object literal, or function argument list. |
| **Optional Chaining (`?.`)** | An operator that short-circuits evaluation to `undefined` if the reference being dereferenced is nullish (`null` or `undefined`). |
| **Nullish Coalescing (`??`)** | A logical operator that returns its right-hand operand only when its left-hand operand is `null` or `undefined`. |
| **Logical Assignment** | Short-circuiting assignment operators (`??=`, `||=`, `&&=`) combining logical checks with variable reassignment. |

---

## 1. Array and Object Destructuring

**Destructuring** is a syntax pattern that allows you to extract elements from arrays or properties from objects and bind them to local variables in a single declarative statement.

### Array Destructuring: Positional Matching

Array destructuring unpacks values based on **positional index**. Skipping elements is accomplished with an empty comma `,`.

```js
// Node.js code
const coordinates = [10, 20, 30, 40];

// ✅ Extract by position, skip index 2, collect rest
const [latitude, longitude, , altitude = 0, ...metadata] = coordinates;

console.log(latitude, longitude, altitude); // 10 20 40
console.log("Rest array:", metadata);       // []

// ❌ Accessing out-of-bounds positions yields undefined without throwing
const [first, , , , missing] = coordinates;
console.log("Missing index:", missing);      // undefined
```

### Object Destructuring: Key Matching and Renaming

Object destructuring extracts values by **property key**. You can rename the resulting local binding using the `{ sourceKey: targetVariable }` syntax.

```js
// Node.js code
const serviceResponse = {
  status: 200,
  data: { userId: "usr_42" },
  timestamp: 1700000000
};

// ✅ Property matching with renaming and nested extraction
const {
  status: httpStatus,
  data: { userId },
  version = "v1" // Default value for omitted property
} = serviceResponse;

console.log(httpStatus, userId, version); // 200 "usr_42" "v1"

// ❌ Common Mistake: Confusing renaming with key-value assignment
// { status: 200 } is NOT checking if status === 200; it creates a syntax error or binds variable named '200'!
```

---

## 2. Default Values: Preserving Falsy Values

Destructuring defaults trigger **only when the extracted property is missing or strictly `undefined`**.

Unlike the logical OR operator (`||`), defaults do **not** replace other falsy values such as `0`, `false`, `""`, or `null`.

```js
// Node.js code
const userSettings = {
  maxRetries: 0,        // 0 is a valid number, not undefined
  notifications: false, // false is a valid boolean
  nickname: "",         // empty string is valid
  lastLogin: null       // null indicates intentional absence
};

// ✅ Destructuring defaults preserve valid falsy values
const {
  maxRetries = 3,
  notifications = true,
  nickname = "Anonymous",
  lastLogin = Date.now(),
  timeout = 5000 // missing on object -> triggers default!
} = userSettings;

console.log("maxRetries:", maxRetries);         // 0 (preserved!)
console.log("notifications:", notifications);   // false (preserved!)
console.log("nickname:", `"${nickname}"`);      // "" (preserved!)
console.log("lastLogin:", lastLogin);           // null (null is NOT undefined!)
console.log("timeout:", timeout);               // 5000 (applied default)

// ❌ Contrast with logical OR (||): corrupts 0 and false!
console.log("Broken OR fallback:", userSettings.maxRetries || 3); // 3 (corrupted 0!)
```

### Call-Time Default Evaluation

Default expressions are evaluated **at call time**, only if the target property resolves to `undefined`. If the property exists, the default expression is never executed.

```js
// Node.js code
let counter = 0;
const computeFallback = () => ++counter;

const { valA = computeFallback(), valB = computeFallback() } = { valA: 100 };

console.log(valA, valB); // 100 1
console.log("Total computations:", counter); // 1 (computeFallback ran only for valB)
```

---

## 3. Nested Destructuring and The Missing Parent Crash

Destructuring nested properties (e.g., `const { user: { address: { city } } } = data`) assumes that every intermediate parent object exists.

If any intermediate property in the path is `null` or `undefined`, JavaScript attempts to destructure a nullish value and throws an immediate `TypeError`.

```js
// Node.js code
const payloadWithoutUser = {};

// ❌ Fatal Crash: Cannot destructure property 'name' of undefined!
try {
  const { user: { name } } = payloadWithoutUser;
} catch (err) {
  console.log("❌ Nested crash:", err.name); // TypeError: Cannot destructure property 'name' of undefined or null
}

// ✅ Safe Nested Destructuring with Whole-Parameter Defaults
const { user: { name = "Guest" } = {} } = payloadWithoutUser;
console.log("Safe nested name:", name); // "Guest"
```

> **Rule for API Endpoints:** When destructuring nested optional parameters in function signatures or request bodies, always supply a fallback `= {}` at every nested level: `function handle({ filters: { status } = {} } = {})`.

---

## 4. Rest vs. Spread: Collecting vs. Expanding

While both features use the ellipsis syntax (`...`), they operate in opposite directions depending on where they appear:
- **Rest Syntax:** Appears on the **left-hand side** of an assignment (or in parameter lists) to **collect** remaining elements into a new array or object.
- **Spread Syntax:** Appears on the **right-hand side** of an assignment (or in function calls) to **expand** elements into an array, object, or argument list.

```js
// Node.js code

// 1. Rest syntax: Collecting properties
const apiRequest = { id: "req_1", method: "POST", headers: { auth: true }, extra: 123 };
const { id, method, ...restMetadata } = apiRequest;
console.log("Rest metadata:", restMetadata); // { headers: { auth: true }, extra: 123 }

// 2. Spread syntax: Expanding properties
const baseConfig = { timeout: 1000, secure: true };
const mergedConfig = { ...baseConfig, retries: 3, secure: false }; // 'secure' overwritten
console.log("Merged config:", mergedConfig); // { timeout: 1000, secure: false, retries: 3 }

// ⚠️ Remember: Object spread is strictly SHALLOW!
const deepObj = { meta: { env: "prod" } };
const clonedObj = { ...deepObj };
clonedObj.meta.env = "staging";
console.log("Original mutated:", deepObj.meta.env); // "staging" (Shared reference!)
```

---

## 5. Modern Operators: Optional Chaining (`?.`) and Nullish Coalescing (`??`)

### Optional Chaining (`?.`)

The optional chaining operator (`?.`) allows you to safely read properties, invoke methods, or access index elements without throwing an error if the base reference is `null` or `undefined`. If the base is nullish, evaluation **short-circuits** immediately and returns `undefined`.

```js
// Node.js code
const client = {
  profile: null,
  getApiKey() { return "key_9988"; }
};

// 1. Property access
console.log(client.profile?.settings?.theme); // undefined (does not throw!)

// 2. Bracket dynamic key access
const dynamicField = "avatarUrl";
console.log(client.profile?.[dynamicField]);   // undefined

// 3. Optional method invocation
console.log(client.getApiKey?.());            // "key_9988"
console.log(client.nonExistentMethod?.());    // undefined (does not throw!)
```

### Nullish Coalescing (`??`)

The nullish coalescing operator (`??`) returns its right-hand operand **only if** the left-hand operand is strictly `null` or `undefined`.

```js
// Node.js code
const serverConfig = {
  port: 0,
  enableLogs: false,
  apiPrefix: ""
};

// ✅ ?? preserves valid falsy values
console.log(serverConfig.port ?? 3000);        // 0
console.log(serverConfig.enableLogs ?? true);   // false
console.log(serverConfig.apiPrefix ?? "/api");  // ""

// ❌ || overwrites all falsy values
console.log(serverConfig.port || 3000);        // 3000 (Overwrote valid 0!)
```

### Grammar Restriction: Combining `??` with `&&` or `||`

JavaScript grammar explicitly forbids mixing `??` directly with `&&` or `||` without explicit parentheses to prevent logical ambiguity.

```js
// Node.js code
// ❌ SyntaxError: Cannot mix '??' and '||' without parentheses!
// const result = a ?? b || c; // SyntaxError: Unexpected token '||'

// ✅ Explicit grouping resolves grammar ambiguity
const a = null, b = false, c = "fallback";
const validResult = (a ?? b) || c;
console.log("Grouped result:", validResult); // "fallback"
```

---

## 6. Logical Assignment Operators (`??=`, `||=`, `&&=`)

ES2021 introduced **Logical Assignment Operators**, combining logical short-circuiting checks with variable assignment:

1. **`a ??= b` (Nullish assignment):** Assigns `b` to `a` **only if** `a` is `null` or `undefined`.
2. **`a ||= b` (Logical OR assignment):** Assigns `b` to `a` **only if** `a` is falsy (`false`, `0`, `""`, `null`, `undefined`, `NaN`).
3. **`a &&= b` (Logical AND assignment):** Assigns `b` to `a` **only if** `a` is truthy.

```js
// Node.js code
const session = {
  requestCount: 0,
  authToken: null,
  activeUser: { name: "Alice" }
};

// ✅ ??= preserves 0, assigns only when null/undefined
session.requestCount ??= 10;
session.authToken ??= "bearer_token_xyz";
console.log("requestCount:", session.requestCount); // 0 (Preserved!)
console.log("authToken:", session.authToken);       // "bearer_token_xyz" (Assigned!)

// ✅ &&= updates only when currently truthy
session.activeUser &&= { name: "Alice", lastSeen: Date.now() };
console.log("activeUser updated:", session.activeUser.name); // "Alice"
```

---

## Tricky Points

### 1. Destructuring Assignment Without `const`/`let` Requires Parentheses
If you destructure an object into existing variables without declaring them, the leading curly brace `{` is interpreted by the parser as a block statement, throwing a `SyntaxError`. You must wrap the entire expression in parentheses:
```js
// Node.js code
let a, b;
// { a, b } = { a: 1, b: 2 }; // SyntaxError!
({ a, b } = { a: 1, b: 2 });  // ✅ Wrapped in parentheses succeeds
```

### 2. Optional Chaining Does Not Mask Undeclared Variables
`?.` handles nullish properties on declared objects, but accessing an undeclared identifier still throws a `ReferenceError`:
```js
// Node.js code
// undeclaredVariable?.property; // ReferenceError: undeclaredVariable is not defined
```

### 3. Destructuring Defaults Ignore `null`
`const { timeout = 3000 } = { timeout: null }` results in `timeout === null`. If you need to guard against `null`, use the nullish coalescing operator: `const timeout = input.timeout ?? 3000`.

### 4. Object Spread Invokes Getters
When you spread an object `{ ...source }`, JavaScript executes any getter functions defined on `source` and copies the evaluated return values as data properties on the new object.

### 5. Nested Destructuring Defaults
Setting a default for an inner property `{ user: { role = "guest" } = {} }` handles `user === undefined`. But if `user === null`, it still crashes! For complete safety against untrusted API payloads, check nullishness before deep destructuring.

---

## Hands-on Exercise

### Scenario: Resilient API Request Query Normalizer

You are developing an Express middleware utility that normalizes pagination, search filters, and sorting parameters from incoming HTTP requests (`req.query`).

### Buggy Code

```js
// Node.js code (Buggy Implementation)
function normalizeQueryParamsBuggy(query) {
  // Bug 1: Crashes with TypeError if query is null/undefined
  const { page = 1, limit = 10, filters: { status, tags } } = query;

  // Bug 2: || overwrites page = 0 or limit = 0
  const safePage = page || 1;
  const safeLimit = limit || 10;

  // Bug 3: Shallow spread retains references
  return {
    page: safePage,
    limit: safeLimit,
    status: status || "all"
  };
}
```

### Acceptance Criteria

1. **Defensive Parameter Guard:** Safely handle `null`, `undefined`, or non-object query inputs without crashing.
2. **Preserve Valid Zero Values:** Allow `page = 0` and `offset = 0` without overwriting them with defaults.
3. **Safe Nested Extraction:** Safely extract nested `filters` with defaults (`status = "all"`, `tags = []`) even when `filters` is missing or `null`.
4. **Logical Assignment:** Use `??=` to populate missing runtime defaults cleanly.

### Solution

```js
// Node.js code
function normalizeQueryParams(query = {}) {
  // Guard against null or non-object input
  const safeQuery = query && typeof query === "object" ? query : {};

  // Extract pagination preserving 0
  const page = safeQuery.page ?? 1;
  const limit = safeQuery.limit ?? 20;

  // Extract nested filters handling missing or null intermediate objects
  const {
    status = "all",
    tags = []
  } = (safeQuery.filters && typeof safeQuery.filters === "object") ? safeQuery.filters : {};

  // Construct clean normalized configuration
  const normalized = {
    page: Number(page),
    limit: Number(limit),
    filters: {
      status: String(status),
      tags: Array.isArray(tags) ? [...tags] : []
    },
    // Extract remaining arbitrary query parameters safely
    metadata: {}
  };

  // Populate optional tracking metadata using logical assignment
  normalized.metadata.normalizedAt ??= Date.now();

  return normalized;
}

// --- Verification Tests ---

// Test 1: Empty input returns defaults
const res1 = normalizeQueryParams();
console.log("Test 1 Defaults:", res1.page, res1.limit, res1.filters.status); // 1 20 'all'

// Test 2: Valid 0 values preserved
const res2 = normalizeQueryParams({ page: 0, limit: 0, filters: { status: "active" } });
console.log("Test 2 Zero values:", res2.page, res2.limit, res2.filters.status); // 0 0 'active'

// Test 3: Null filters does not crash
const res3 = normalizeQueryParams({ filters: null });
console.log("Test 3 Null filters safe:", res3.filters.status); // 'all'

// Test 4: Extracted tags are cloned, preventing external mutation
const rawTags = ["tech", "node"];
const res4 = normalizeQueryParams({ filters: { tags: rawTags } });
rawTags.push("corrupted");
console.log("Test 4 Array isolation:", res4.filters.tags); // [ 'tech', 'node' ] (Uncorrupted! ✅)
```

---

## Summary

- **Array Destructuring:** Unpacks elements by index position; ignores missing slots unless given defaults.
- **Object Destructuring:** Unpacks elements by property key name; supports renaming (`{ old: newVar }`).
- **Defaults:** Trigger strictly on `undefined` (preserving `0`, `false`, `""`, and `null`).
- **Rest vs. Spread:** Rest collects remaining properties into an object or array; Spread expands properties into a new structure (shallowly).
- **Optional Chaining (`?.`):** Short-circuits property, index, or method lookups to `undefined` when the base reference is nullish.
- **Nullish Coalescing (`??`):** Replaces only `null` and `undefined`, preventing accidental corruption of `0` and `false`.
- **Logical Assignment (`??=`, `||=`, `&&=`):** Combines short-circuit boolean logic with assignment.

---

## Cheat Sheet

### Syntax & Operators Quick Reference

| Syntax | Name | Behavior |
| :--- | :--- | :--- |
| `const [a, , b] = arr` | Array Skip | Extracts index 0 and 2; skips index 1 |
| `const { key: alias } = obj` | Renaming | Binds `obj.key` to local variable `alias` |
| `const { k = def } = obj` | Default Value | Uses `def` only if `obj.k === undefined` |
| `const { a: { b } = {} }`| Safe Nested | Prevents crash if intermediate `a` is missing |
| `obj?.a?.b` | Optional Chaining | Short-circuits to `undefined` if nullish |
| `val ?? fallback` | Nullish Coalescing | Returns `fallback` only if `val` is `null`/`undefined` |
| `val ??= fallback` | Nullish Assignment | Assigns `fallback` only if `val` is `null`/`undefined` |

### Common Pitfalls

- **Mixing `??` and `||` without parentheses** → throws `SyntaxError`. Group explicitly: `(a ?? b) || c`.
- **Using `||` for numeric settings** → `0 || 10` evaluates to `10`, corrupting zero offsets and limits. Use `0 ?? 10`.
- **Assuming spread is a deep clone** → nested objects remain shared references.
- **Destructuring into undeclared variables** → `{ a, b } = obj` throws `SyntaxError`. Use `({ a, b } = obj)`.
- **Expecting optional chaining to validate values** → `obj?.user` suppresses errors, but does not prove `user` is valid.

---

## Interview Questions

### 1. What are the exact behavioral differences between `||` and `??`?

**Question:** Compare the Logical OR (`||`) operator with the Nullish Coalescing (`??`) operator. When does each evaluate its right-hand operand, and why can using `||` cause severe production bugs in API configuration?

**Answer:**
1. **Evaluation Conditions:**
   - **`a || b` (Falsy Check):** Evaluates and returns `b` if `a` is **any falsy value** (`false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`).
   - **`a ?? b` (Nullish Check):** Evaluates and returns `b` **only if** `a` is `null` or `undefined`. All other values (including `0`, `false`, `""`, and `NaN`) are treated as valid and returned.
2. **Production Bug Scenario (API Pagination & Configuration):**
   - In pagination APIs, callers frequently pass `offset: 0` or `page: 0` to request the very first page.
   - If written as `const page = req.query.page || 1;`, passing `0` causes `0 || 1` to evaluate to `1`. The server silently overrides the user's explicit request for page 0, returning page 1 instead.
   - Similarly, boolean feature flags like `enableCache: false` written as `enableCache || true` evaluate to `true`, making it impossible for clients to disable caching.
   - Replacing `||` with `??` (`page ?? 1`, `enableCache ?? true`) preserves valid `0` and `false` inputs.

---

### 2. Predict the Output: Destructuring evaluation order, defaults, and rest

```js
let executionCount = 0;
const getDefault = () => ++executionCount;

const input = {
  a: null,
  b: undefined,
  c: 0
};

const {
  a = getDefault(),
  b = getDefault(),
  c = getDefault(),
  d = getDefault(),
  ...rest
} = input;

console.log(a, b, c, d);
console.log("Executions:", executionCount);
console.log("Rest keys:", Object.keys(rest));
```

**Question:** Predict the values of `a`, `b`, `c`, `d`, the `executionCount`, and the keys in `rest`.

**Answer:**
**Output:**
```text
null 1 0 2
Executions: 2
Rest keys: []
```

**Explanation:**
1. **Evaluation of `a`:** `input.a` is `null`. Destructuring defaults trigger **only on `undefined`**. `null` is a defined value, so `getDefault()` is skipped, and `a` evaluates to `null`.
2. **Evaluation of `b`:** `input.b` is `undefined`. This triggers the default: `getDefault()` runs, `executionCount` becomes `1`, and `b` evaluates to `1`.
3. **Evaluation of `c`:** `input.c` is `0`. Zero is not `undefined`, so `getDefault()` is skipped, and `c` evaluates to `0`.
4. **Evaluation of `d`:** `d` is missing on `input` (evaluates to `undefined`). `getDefault()` runs, `executionCount` becomes `2`, and `d` evaluates to `2`.
5. **`rest` Object:** Rest collects all remaining own properties of `input` that were not explicitly destructured. Because all keys of `input` (`a`, `b`, `c`) were extracted, `rest` is an empty object `{}` with zero keys.

---

### 3. Debugging: Diagnosing a runtime crash in an Express webhook handler

```js
app.post("/webhooks/stripe", (req, res) => {
  const {
    event: {
      data: {
        object: { customerId }
      }
    }
  } = req.body;

  res.json({ received: true, customerId });
});
```

**Question:** In production, certain Stripe webhooks (e.g., ping events or account updates) cause this endpoint to crash with `TypeError: Cannot read properties of undefined (reading 'object')`, restarting the Node.js server. Explain the root cause and provide a defensive refactoring.

**Answer:**
**Diagnosis:**
The handler uses deep nested destructuring without fallback defaults.
When a webhook payload has an event shape where `data` is empty or lacks an `object` property (or if `req.body.event` is undefined), JavaScript attempts to destructure `undefined`, throwing an unhandled `TypeError` that crashes the Express request handler.

**Defensive Refactoring:**
```js
// Node.js code
app.post("/webhooks/stripe", (req, res) => {
  // Option 1: Safe Optional Chaining (Cleanest for simple reads)
  const customerId = req.body?.event?.data?.object?.customerId ?? null;

  // Option 2: Safe Destructuring with nested whole-parameter fallbacks
  const {
    event: {
      data: {
        object: { customerId: destructuredId } = {}
      } = {}
    } = {}
  } = req.body || {};

  res.json({ received: true, customerId: customerId || destructuredId });
});
```

---

### 4. Node.js Backend Scenario: Normalizing Dynamic Microservice Environment Overrides

**Question:** A Node.js backend loads default configuration and merges overrides from environment variables and user JSON input. Write a function, `buildServiceConfig(defaults, envOverrides, userOverrides)`, using modern operators and logical assignments, ensuring that:
1. Environment variables override defaults.
2. User overrides take highest precedence.
3. Falsy values like `0` or `false` are preserved across layers.
4. Input objects are not mutated.

**Answer:**

```js
// Node.js code
function buildServiceConfig(defaults = {}, envOverrides = {}, userOverrides = {}) {
  // Deep clone defaults to avoid mutating source
  const config = structuredClone(defaults);

  // Helper to merge a layer preserving nullish semantics
  function applyLayer(target, source) {
    if (!source || typeof source !== "object") return;

    for (const [key, value] of Object.entries(source)) {
      if (value !== undefined) {
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          target[key] ??= {};
          applyLayer(target[key], value);
        } else {
          // Direct assignment preserves 0, false, "", and null
          target[key] = value;
        }
      }
    }
  }

  // Apply environment layer, then user layer
  applyLayer(config, envOverrides);
  applyLayer(config, userOverrides);

  // Populate runtime defaults using ??=
  config.metadata ??= {};
  config.metadata.builtAt ??= Date.now();
  config.metadata.active ??= true;

  return config;
}

// Example Usage:
const defaultSettings = {
  port: 8080,
  debug: false,
  metrics: { intervalSec: 60 }
};

const envSettings = {
  port: 3000,
  metrics: { intervalSec: 15 } // Overrides intervalSec to 15
};

const userSettings = {
  debug: false // Preserves explicit false!
};

const finalConfig = buildServiceConfig(defaultSettings, envSettings, userSettings);
console.log("Config Result:", finalConfig.port, finalConfig.debug, finalConfig.metrics.intervalSec);
// Output: 3000 false 15
```

---

<nav aria-label="Lecture navigation">

[← Day 12: Built-in Data Structures and Serialization](day-12-built-in-data-structures-and-serialization.md) | [Roadmap](../javascript-roadmap.md) | [Day 14: Iterables, Iterators, Generators, and Symbols →](day-14-iterables-iterators-generators-and-symbols.md)

</nav>
