# Day 12: Built-in Data Structures and Serialization

<nav aria-label="Lecture navigation">

[← Day 11: Property Descriptors, Enumerability, and Immutability](day-11-property-descriptors-and-immutability.md) | [Roadmap](../javascript-roadmap.md) | [Day 13: Destructuring, Spread, and Modern Operators →](day-13-destructuring-spread-and-modern-operators.md)

</nav>

---

## What You Will Learn Today

By the end of this lecture, you should be able to:

- Distinguish dense arrays from sparse arrays (empty slots vs. `undefined`) and master the mechanics of the `length` property.
- Choose accurately between mutating array methods (`splice`, `sort`) and modern non-mutating alternatives (`toSpliced`, `toSorted`).
- Avoid the classic default `sort()` trap by implementing numeric and custom comparators.
- Understand strings as UTF-16 code units, and navigate surrogate pairs and emoji code points with `[...str]`.
- Navigate floating-point math limitations (`0.1 + 0.2`), safe integer boundaries (`Number.MAX_SAFE_INTEGER`), and `BigInt` operations.
- Master `Map` and `Set` for $O(1)$ lookups, and know when to leverage `WeakMap` to prevent memory leaks in caches.
- Predict and handle JSON serialization loss: omitted `undefined` properties, `null` conversions in arrays, and `BigInt` serialization crashes.
- Implement robust custom serialization using `JSON.stringify` replacers and `JSON.parse` revivers.

**Prerequisites:** [Day 03 – Values, Types, and Literals](day-03-values-types-and-literals.md), [Day 04 – Coercion, Equality, and Operators](day-04-coercion-equality-and-operators.md), and [Day 09 – Objects and Property Access](day-09-objects-and-property-access.md).  
*Upcoming Connections:* [Day 13](day-13-destructuring-spread-and-modern-operators.md) expands collections into modern destructuring and rest/spread syntax; [Day 14](day-14-iterables-iterators-generators-and-symbols.md) details the Iterable and Iterator protocols.

---

## Quick Vocabulary Card

| Term | Definition |
| :--- | :--- |
| **Dense Array** | An array where every index from `0` to `length - 1` contains an assigned value (even if that value is `undefined`). |
| **Sparse Array (Holes)** | An array containing unallocated index slots ("empty items") where the index does not exist as an own property. |
| **Lexicographical Sort** | Sorting elements alphabetically based on their UTF-16 code-unit values (the default behavior of `Array.prototype.sort()`). |
| **Code Unit vs. Code Point** | A UTF-16 code unit is a 16-bit value; a Unicode code point represents a single abstract character (which may require two code units). |
| **Safe Integer** | An integer exactly representable in double-precision floating point without rounding (from $-2^{53} + 1$ to $2^{53} - 1$). |
| **`BigInt`** | An arbitrary-precision integer primitive capable of representing values beyond the safe integer limit. |
| **`Map`** | A keyed collection associating keys of any type with values, maintaining strict insertion order. |
| **`Set`** | A collection of unique values of any type where duplicates are automatically rejected. |
| **`WeakMap`** | A specialized key-value collection whose keys must be objects or symbols and are held weakly, allowing garbage collection. |
| **Lossy Serialization** | A data conversion process (like standard `JSON.stringify`) where specific types or values are modified, omitted, or stripped. |

---

## 1. Arrays: Indexing, `length`, and Sparse Arrays (Holes)

In JavaScript, **arrays are specialized objects** whose keys are numeric-string property names, bound to an automatically synchronized **`length`** property.

The `length` property is always equal to the **highest numeric index plus one**.

```js
// Node.js code
const items = ["alpha", "beta"];
console.log(items.length); // 2

// Truncating length deletes elements immediately:
items.length = 1;
console.log(items); // [ 'alpha' ]

// Expanding length creates sparse empty slots:
items.length = 3;
console.log(items); // [ 'alpha', <2 empty items> ]
```

### Dense Arrays vs. Sparse Arrays (Holes)

An **empty slot (hole)** in a sparse array is fundamentally different from an index containing the value `undefined`. A hole has no allocated property on the array object (`index in array` evaluates to `false`).

```js
// Node.js code
const denseArray = [undefined];
const sparseArray = [];
sparseArray[0] = undefined; // Dense at index 0
sparseArray[3] = "fourth";  // Indices 1 and 2 are empty holes!

console.log("Dense index exists:", 0 in denseArray);    // true
console.log("Sparse hole index 1:", 1 in sparseArray);   // false (Hole!)
console.log("Sparse filled index 3:", 3 in sparseArray); // true

// ❌ Array methods (.forEach, .map, .filter) SKIP holes completely!
let mappedCount = 0;
sparseArray.map(item => {
  mappedCount++;
  return item;
});
console.log("Mapped count (skipped holes):", mappedCount); // 2 (Only indices 0 and 3 ran!)

// ✅ for...of and Array.from() treat holes as undefined
const holesToUndefined = [];
for (const val of sparseArray) {
  holesToUndefined.push(val);
}
console.log("for...of values:", holesToUndefined); 
// [ undefined, undefined, undefined, 'fourth' ]
```

---

## 2. Array Mutating vs. Non-Mutating Methods

Understanding which array methods mutate in place versus return a new array is essential for writing predictable backend code.

### Mutating vs. Non-Mutating (ES2023+)

| Mutating (In-Place) | Non-Mutating Equivalent (ES2023+) | Classic Non-Mutating Alternative |
| :--- | :--- | :--- |
| `arr.sort(cmp)` | `arr.toSorted(cmp)` | `[...arr].sort(cmp)` |
| `arr.reverse()` | `arr.toReversed()` | `[...arr].reverse()` |
| `arr.splice(start, count, ...items)` | `arr.toSpliced(start, count, ...items)` | Custom slice & concat |
| `arr[index] = val` | `arr.with(index, val)` | `[...arr.slice(0, i), val, ...arr.slice(i+1)]` |

### The Default `sort()` Trap

By default, `Array.prototype.sort()` converts elements to strings and compares them **lexicographically in UTF-16 order**. It does **not** sort numbers numerically!

```js
// Node.js code
const scores = [10, 5, 2, 100, 25];

// ❌ Default sort compares as strings: "10", "100", "2", "25", "5"
scores.sort();
console.log("❌ Default string sort:", scores); // [ 10, 100, 2, 25, 5 ]

// ✅ Numeric comparator: (a, b) => a - b
const safeSorted = [...scores].sort((a, b) => a - b);
console.log("✅ Numeric ascending sort:", safeSorted); // [ 2, 5, 10, 25, 100 ]
```

---

## 3. Strings and Unicode: Code Units vs. Code Points

JavaScript strings are sequences of **16-bit UTF-16 code units**. Characters outside the Basic Multilingual Plane (BMP)—such as emojis and certain historical symbols—require two 16-bit code units, known as a **surrogate pair**.

```js
// Node.js code
const smile = "😊"; // Code point U+1F60A

// ❌ .length counts UTF-16 code units, NOT visible characters!
console.log("String length (code units):", smile.length); // 2

// ❌ Character indexing splits the surrogate pair into garbage
console.log("First code unit:", smile[0]); // '\uD83D' (Lone high surrogate!)

// ✅ Array spread and for...of iterate by Unicode code points
console.log("Code point length:", [...smile].length); // 1
console.log("Iterated character:", [...smile][0]);     // "😊"
```

> **Production Tip:** When validating user input length (such as usernames, passwords, or SMS character limits), use `[...str].length` or `Intl.Segmenter` to count visual characters rather than raw `str.length`.

---

## 4. Numbers, Floating-Point Precision, and `BigInt`

### The 64-Bit Float (IEEE 754) Precision Problem

JavaScript represents all standard numbers as double-precision 64-bit floating-point values. Because binary fractions cannot represent numbers like $0.1$ or $0.2$ exactly, floating-point rounding errors occur.

```js
// Node.js code
console.log(0.1 + 0.2 === 0.3); // false
console.log(0.1 + 0.2);         // 0.30000000000000004

// ✅ Safe floating-point comparison using Number.EPSILON
function areFloatsEqual(a, b) {
  return Math.abs(a - b) < Number.EPSILON;
}
console.log("Safe float check:", areFloatsEqual(0.1 + 0.2, 0.3)); // true

// ✅ Financial calculation best practice: Store currency as integer cents!
const priceInCents = 1099; // $10.99
```

### Safe Integers vs. `BigInt`

Standard JavaScript numbers can accurately represent integers only between `Number.MIN_SAFE_INTEGER` ($-2^{53} + 1$) and `Number.MAX_SAFE_INTEGER` ($2^{53} - 1$, or $9,007,199,254,740,991$). 

Integers exceeding this boundary lose precision. For large database primary keys (e.g., Snowflake IDs, 64-bit SQL IDs, crypto hashes), use **`BigInt`**.

```js
// Node.js code
const unsafeId = 9007199254740991 + 2;
console.log("Lost precision:", unsafeId); // 9007199254740992 (Wrong!)

// ✅ BigInt primitive: append 'n' to integer literal or use BigInt()
const safeBigInt = 9007199254740991n + 2n;
console.log("BigInt precision preserved:", safeBigInt); // 9007199254740993n

// ❌ Cannot mix BigInt and Number in arithmetic
try {
  const sum = safeBigInt + 1; // TypeError!
} catch (err) {
  console.log("❌ Mixing error:", err.message); // Cannot mix BigInt and other types
}
```

---

## 5. Keyed Collections: `Map` and `Set`

Introduced in ES2015, `Map` and `Set` provide dedicated, collision-safe data structures for key-value associations and unique item tracking.

### `Map`: Key-Value Collections with Arbitrary Keys

Unlike plain objects, `Map` accepts any value as a key (including objects, functions, and primitives) and maintains strict insertion order.

```js
// Node.js code
const sessionMap = new Map();

const userObj1 = { id: 101 };
const userObj2 = { id: 102 };

// ✅ Object references as distinct keys
sessionMap.set(userObj1, { role: "admin", loggedIn: true });
sessionMap.set(userObj2, { role: "editor", loggedIn: false });

console.log(sessionMap.get(userObj1).role); // "admin"
console.log(sessionMap.size);               // 2 (O(1) size property)

// ❌ Object keys are compared by reference identity, NOT shape:
console.log(sessionMap.get({ id: 101 }));   // undefined (Different object reference!)
```

### `Set`: High-Performance Uniqueness

`Set` stores unique values. It uses the `SameValueZero` equality algorithm, meaning `NaN` is correctly deduplicated and equal to `NaN`.

```js
// Node.js code
const activeTags = new Set(["node", "express", "node", NaN, NaN]);
console.log([...activeTags]); // [ 'node', 'express', NaN ] (Duplicates and extra NaN removed)
console.log(activeTags.has("node")); // true (O(1) lookup!)
```

### `WeakMap` and `WeakSet`: Preventing Memory Leaks

`WeakMap` and `WeakSet` hold **weak references** to their object keys:
- Keys **must** be objects (or non-registered symbols).
- If an object key has no other references in memory, it can be garbage collected, and its entry in the `WeakMap` is removed automatically.
- They are **non-iterable** and have no `.size` property.

```js
// Node.js code
const requestMetadataCache = new WeakMap();

function processUserRequest(req) {
  // Associate private telemetry data with the request object
  requestMetadataCache.set(req, { startTime: Date.now(), ip: req.ip });
}

// When 'req' is destroyed after the HTTP response completes, 
// its cached metadata in requestMetadataCache is garbage collected automatically!
```

---

## 6. JSON Serialization: Lossy Conversions and Boundaries

`JSON.stringify()` serializes JavaScript values into JSON text. However, JSON is a limited language-agnostic data format, leading to significant **lossy conversions**:

```
                              JSON Serialization Behavior
┌───────────────────────────────┬───────────────────────────────┐
│ JavaScript Value              │ Result in JSON.stringify()    │
├───────────────────────────────┼───────────────────────────────┤
│ Object property: undefined    │ Omitted completely            │
│ Object property: Function     │ Omitted completely            │
│ Object property: Symbol       │ Omitted completely            │
│ Array element: undefined      │ Converted to null             │
│ Array element: Function       │ Converted to null             │
│ NaN / Infinity / -Infinity    │ Converted to null             │
│ Date object                   │ Serialized to ISO string      │
│ Map / Set                     │ Serialized to empty object {} │
│ BigInt                        │ Throws TypeError!             │
│ Circular reference            │ Throws TypeError!             │
└───────────────────────────────┴───────────────────────────────┘
```

```js
// Node.js code
const complexPayload = {
  name: "ServiceReport",
  invalidNumber: NaN,
  optionalSetting: undefined,
  timestamp: new Date("2026-01-01T00:00:00.000Z"),
  cache: new Map([["key", "value"]]),
  calculateRate() { return 42; }
};

const jsonString = JSON.stringify(complexPayload);
console.log(jsonString);
// {"name":"ServiceReport","invalidNumber":null,"timestamp":"2026-01-01T00:00:00.000Z","cache":{}}

// ❌ BigInt throws TypeError without a custom replacer:
try {
  JSON.stringify({ balance: 1000n });
} catch (err) {
  console.log("❌ BigInt JSON Error:", err.message); // Do not know how to serialize a BigInt
}
```

### Implementing Custom Replacers and Revivers

To serialize unsupported types like `BigInt` or `Map`, provide a custom **replacer** function to `JSON.stringify()` and a **reviver** function to `JSON.parse()`:

```js
// Node.js code
const transaction = {
  txId: 9876543210123456789n,
  createdAt: new Date()
};

// ✅ Serialize with BigInt tagging
const serialized = JSON.stringify(transaction, (key, value) => {
  if (typeof value === "bigint") {
    return { __type: "BigInt", value: value.toString() };
  }
  return value;
});

// ✅ Deserialize with BigInt restoration
const restored = JSON.parse(serialized, (key, value) => {
  if (value && value.__type === "BigInt") {
    return BigInt(value.value);
  }
  return value;
});

console.log("Restored BigInt:", restored.txId, typeof restored.txId); 
// 9876543210123456789n 'bigint'
```

---

## Tricky Points

### 1. The `sort()` Mutates and Defaults to Strings
`[10, 2].sort()` returns `[10, 2]`. It mutates the input array and compares as strings. Always use `[...arr].sort((a, b) => a - b)`.

### 2. Holes in Arrays vs. `undefined` Elements
An empty slot in a sparse array is skipped by `map()` and `forEach()`, whereas an index containing `undefined` is processed.

### 3. Floating-Point Arithmetic
Never perform financial or high-precision equality checks directly on floats (`0.1 + 0.2 === 0.3` is `false`). Use integer cents or `Number.EPSILON`.

### 4. `NaN` Equality Nuances
`NaN === NaN` is `false`, but `Set.has(NaN)` and `Map.get(NaN)` return `true` because they use `SameValueZero`.

### 5. `JSON.stringify` Drops Object Keys with `undefined`
Serializing `{ a: undefined }` produces `"{}"`. However, in an array, `[undefined]` produces `"[null]"`.

### 6. `BigInt` Serialization Crash
Passing a `BigInt` to `JSON.stringify` throws `TypeError: Do not know how to serialize a BigInt`. You must provide a custom replacer.

### 7. String `.length` is Not Visual Character Count
`"🔥".length` is `2`. Counting visual characters requires `[...str].length`.

---

## Hands-on Exercise

### Scenario: High-Volume Catalog Ingestion, Deduplication, and Serialization

You are building a product ingestion pipeline for an e-commerce microservice. The pipeline must ingest an array of raw product records, deduplicate them by product ID, sort them by price, and serialize the payload safely without losing 64-bit database IDs or crashing on sparse data.

### Buggy Code

```js
// Node.js code (Buggy Implementation)
function processProductsBuggy(rawProducts) {
  // Bug 1: Default sort mutates input and sorts lexicographically
  rawProducts.sort();

  // Bug 2: Naive array deduplication is O(N^2)
  const unique = [];
  for (const item of rawProducts) {
    if (!unique.some(u => u.id === item.id)) unique.push(item);
  }

  // Bug 3: Crashes if any product has a BigInt ID during JSON serialization
  return JSON.stringify(unique);
}
```

### Acceptance Criteria

1. **Non-Mutating Numeric Sorting:** Sort products ascending by price without mutating the caller's input array.
2. **$O(n)$ Deduplication:** Deduplicate products by `id` using a `Map` or `Set` to ensure optimal performance.
3. **Sparse Array & NaN Protection:** Skip sparse holes and filter out invalid prices (`NaN` or non-numeric).
4. **Safe BigInt Serialization:** Safely serialize 64-bit integer IDs (`BigInt`) as strings in the resulting JSON payload.

### Solution

```js
// Node.js code
function processProductsClean(rawProducts) {
  if (!Array.isArray(rawProducts)) {
    throw new TypeError("rawProducts must be an array");
  }

  // 1. $O(n)$ Deduplication and Hole Elimination via Map
  const productMap = new Map();

  for (const product of rawProducts) {
    // Skip empty holes and nullish elements
    if (!product || typeof product !== "object") continue;

    const { id, price, name } = product;

    // Reject invalid numeric prices
    if (typeof price !== "number" || Number.isNaN(price) || price < 0) {
      continue;
    }

    // Preserve latest record by id
    productMap.set(id, { id, name, price });
  }

  // 2. Extract values and sort without mutating original input
  const validProducts = Array.from(productMap.values());
  validProducts.sort((a, b) => a.price - b.price);

  // 3. Safe JSON Serialization handling BigInt IDs
  return JSON.stringify(validProducts, (key, value) => {
    return typeof value === "bigint" ? value.toString() : value;
  });
}

// --- Verification Tests ---

// Raw input with sparse hole, duplicates, BigInt IDs, and invalid prices
const rawInput = [];
rawInput[0] = { id: 101n, name: "Keyboard", price: 79.99 };
rawInput[1] = { id: 102n, name: "Broken Item", price: NaN }; // Should be rejected
// rawInput[2] is a sparse hole!
rawInput[3] = { id: 101n, name: "Keyboard Pro", price: 89.99 }; // Duplicate: overwrites
rawInput[4] = { id: 103n, name: "Mouse", price: 29.99 };

const outputJson = processProductsClean(rawInput);
console.log("Processed JSON Output:\n", outputJson);

// Parsed Output Verification
const parsed = JSON.parse(outputJson);
console.log("Count (expected 2):", parsed.length);
console.log("First item (lowest price, Mouse):", parsed[0].name, parsed[0].price);
console.log("Second item (Keyboard Pro):", parsed[1].name, parsed[1].price);
console.log("BigInt serialized as string:", typeof parsed[0].id === "string"); // true
```

---

## Summary

- **Arrays & Holes:** Arrays are objects with indexed keys and a dynamic `length`. Sparse array holes are skipped by iteration methods (`map`, `forEach`) but evaluated as `undefined` by `for...of`.
- **Default Sort Trap:** Default `sort()` converts elements to strings. Always pass a numeric comparator `(a, b) => a - b` for numbers.
- **Unicode Code Points:** Strings are encoded as UTF-16 code units. Use `[...str].length` to count full Unicode code points and emojis.
- **Numbers & Precision:** Double-precision floats cannot represent $0.1 + 0.2$ exactly. Integers beyond $2^{53} - 1$ require `BigInt`.
- **`Map` and `Set`:** Provide expected $O(1)$ lookups with arbitrary keys and `SameValueZero` equality (handling `NaN`). Use `WeakMap` for cache keys that must not leak memory.
- **JSON Serialization Limits:** Drops `undefined`, functions, and symbols in objects; converts them to `null` in arrays; and throws on `BigInt` without a custom replacer.

---

## Cheat Sheet

### Data Structure Selection Matrix

| Need | Best Choice | Key Advantage |
| :--- | :--- | :--- |
| **Ordered Indexed Sequence** | `Array` | Direct index access, comprehensive iteration methods |
| **Unique Values Tracking** | `Set` | $O(1)$ `.has()` checks, automatic deduplication |
| **Arbitrary Key-Value Cache** | `Map` | Any key type allowed, $O(1)$ `.size`, no prototype interference |
| **Leak-Free Object Metadata**| `WeakMap` | Keys garbage-collected automatically when unreferenced |
| **Large 64-Bit Integers** | `BigInt` | Arbitrary integer precision beyond $2^{53}-1$ |

### JSON Serialization Conversions

| Type / Value | In Object Property | In Array Element |
| :--- | :--- | :--- |
| `undefined` | Omitted completely | `null` |
| `NaN` / `Infinity` | `null` | `null` |
| `Function` | Omitted completely | `null` |
| `Date` | ISO 8601 string | ISO 8601 string |
| `BigInt` | Throws `TypeError` | Throws `TypeError` |

### Common Pitfalls

- **Calling `.sort()` without a comparator** → `[10, 2].sort()` results in `[10, 2]`.
- **Assuming string `.length` counts emojis** → `"🚀".length` is `2`. Use `[..."🚀"].length`.
- **Comparing floats directly** → `0.1 + 0.2 === 0.3` is `false`.
- **Serializing `BigInt` to JSON directly** → crashes with `TypeError`. Use a replacer function.
- **Comparing `Map` object keys by value** → `map.get({ id: 1 })` fails because objects compare by reference.

---

## Interview Questions

### 1. What is the fundamental difference between an empty slot (hole) in a sparse array and an element set to `undefined`?

**Question:** Compare a sparse array hole with an explicit `undefined` element. How do `0 in arr`, `arr.forEach()`, `arr.map()`, and `for...of` handle holes?

**Answer:**
1. **Property Existence:**
   - In a sparse array (`const arr = []; arr[1] = "val";`), index `0` is an **unallocated hole**. The property does not exist on the array object (`0 in arr` is `false`, `Object.hasOwn(arr, 0)` is `false`).
   - In a dense array (`const arr = [undefined];`), index `0` is an own property holding the value `undefined` (`0 in arr` is `true`).
2. **Behavior Under Array Callback Methods (`forEach`, `map`, `filter`):**
   - Higher-order iteration methods verify property existence before invoking their callback. They **skip holes completely**.
   - If an element is explicitly `undefined`, the callback is invoked with `undefined`.
3. **Behavior Under `for...of` and `Array.from()`:**
   - The iterable protocol reads array indices sequentially from `0` to `length - 1`.
   - Accessing a hole via direct index read (`arr[0]`) returns `undefined`. Therefore, `for...of` and `Array.from()` yield `undefined` for empty slots rather than skipping them.

---

### 2. Predict the Output: Default sorting, `Map` key equality, and JSON serialization

```js
const numbers = [10, 2, 20, 1];
numbers.sort();

const map = new Map();
map.set(NaN, "not-a-number");
map.set({ id: 1 }, "first");

const payload = {
  numbers,
  mapVal: map.get(NaN),
  objVal: map.get({ id: 1 }),
  unassigned: undefined,
  list: [undefined, NaN]
};

console.log(payload.numbers);
console.log(payload.mapVal, payload.objVal);
console.log(JSON.stringify(payload));
```

**Question:** What does this code print to the console? Explain why `payload.objVal` evaluates to `undefined` and how JSON handles `unassigned` vs. `list`.

**Answer:**
**Output:**
```text
[ 1, 10, 2, 20 ]
not-a-number undefined
{"numbers":[1,10,2,20],"mapVal":"not-a-number","list":[null,null]}
```

**Explanation:**
1. **`numbers.sort()`:**
   - Default sort compares elements lexicographically as strings: `"1"`, `"10"`, `"2"`, `"20"`. It mutates `numbers` into `[1, 10, 2, 20]`.
2. **`map.get(NaN)`:**
   - `Map` uses the `SameValueZero` algorithm. Unlike `===` (where `NaN === NaN` is `false`), `SameValueZero` treats `NaN` as equal to `NaN`. Therefore, `map.get(NaN)` returns `"not-a-number"`.
3. **`map.get({ id: 1 })`:**
   - Objects are compared by reference identity. The object literal passed to `.get({ id: 1 })` is a newly allocated object in memory, distinct from the object passed to `.set()`. Hence, it returns `undefined`.
4. **`JSON.stringify(payload)`:**
   - `unassigned` is an object property with value `undefined`; JSON omits it completely.
   - `list` is an array containing `undefined` and `NaN`. In JSON arrays, both `undefined` and `NaN` are coerced to `null`: `[null, null]`.

---

### 3. Debugging: Diagnosing a high-precision financial report API crash

```js
// Node.js Express service
app.get("/ledger-summary", async (req, res) => {
  const transactions = await getLedgerTransactions();
  // transactions contains: [{ txId: 9007199254740995n, amount: 150.50 }]

  transactions.sort((a, b) => a.amount - b.amount);

  res.json({
    count: transactions.length,
    data: transactions
  });
});
```

**Question:** In production, this endpoint crashes with `TypeError: Do not know how to serialize a BigInt`. Furthermore, sorting sometimes produces incorrect orders if amounts are formatted improperly. Diagnose both issues and write a robust fix.

**Answer:**
**Diagnosis:**
1. **BigInt Serialization:** Standard `JSON.stringify()` (called internally by `res.json()`) cannot serialize `BigInt` primitives and throws an unhandled `TypeError`.
2. **Subtraction Comparator with Floats:** If `a.amount` or `b.amount` contains `NaN` or invalid inputs, `a.amount - b.amount` evaluates to `NaN`, which breaks the sort algorithm's transitivity and leaves the array inconsistently sorted.

**Safe Refactored Code:**
```js
// Node.js code
app.get("/ledger-summary", async (req, res, next) => {
  try {
    const transactions = await getLedgerTransactions();

    // 1. Safe numeric sorting
    const sorted = [...transactions].sort((a, b) => {
      const amtA = Number(a.amount) || 0;
      const amtB = Number(b.amount) || 0;
      return amtA - amtB;
    });

    // 2. Custom replacer to serialize BigInt as string
    const jsonPayload = JSON.stringify({
      count: sorted.length,
      data: sorted
    }, (key, value) => {
      return typeof value === "bigint" ? value.toString() : value;
    });

    res.setHeader("Content-Type", "application/json");
    res.send(jsonPayload);
  } catch (err) {
    next(err);
  }
});
```

---

### 4. Node.js Backend Scenario: Designing a Zero-Leak In-Memory Request Cache with `WeakMap`

**Question:** In a high-throughput Node.js web server, you want to attach pre-computed authentication and permission metadata to incoming HTTP request objects (`req`). Explain why using a standard `Map` causes an unbounded memory leak, and implement a zero-leak caching service using `WeakMap`.

**Answer:**
**Why a Standard `Map` Leaks Memory:**
In a standard `Map`, keys are held with **strong references**. As long as the `Map` exists (e.g., in a long-lived module or singleton service), the request object `req` remains reachable in memory through the `Map`'s key table. Even after the HTTP request has finished and the response is sent to the client, the garbage collector **cannot reclaim** the request object or its associated headers, body buffers, and sockets, causing a catastrophic memory leak.

**Solution with `WeakMap`:**
A `WeakMap` holds its keys **weakly**. When the Node.js HTTP server finishes handling a request and drops its internal references to `req`, the `WeakMap` does not prevent garbage collection. The request object and its associated cached metadata are automatically freed.

```js
// Node.js code
class RequestAuthCache {
  // Private WeakMap: keys must be objects and are held weakly
  #cache = new WeakMap();

  setAuthData(req, authData) {
    if (!req || typeof req !== "object") {
      throw new TypeError("Request must be a valid object");
    }
    this.#cache.set(req, {
      userId: authData.userId,
      roles: Object.freeze([...authData.roles]),
      cachedAt: Date.now()
    });
  }

  getAuthData(req) {
    return this.#cache.get(req) || null;
  }

  hasAuthData(req) {
    return this.#cache.has(req);
  }
}

// Export singleton instance
const authCache = new RequestAuthCache();

// Usage in Express Middleware:
function authMiddleware(req, res, next) {
  const token = req.headers["authorization"];
  const user = verifyToken(token);

  // Cache user data linked to req lifecycle
  authCache.setAuthData(req, user);
  next();
}

function roleCheckMiddleware(req, res, next) {
  // Retrieve cached auth data in O(1) without re-parsing token
  const auth = authCache.getAuthData(req);
  if (!auth || !auth.roles.includes("admin")) {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
}
```

---

<nav aria-label="Lecture navigation">

[← Day 11: Property Descriptors, Enumerability, and Immutability](day-11-property-descriptors-and-immutability.md) | [Roadmap](../javascript-roadmap.md) | [Day 13: Destructuring, Spread, and Modern Operators →](day-13-destructuring-spread-and-modern-operators.md)

</nav>
