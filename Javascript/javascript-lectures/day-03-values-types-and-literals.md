# Day 03: Values, Types, and Literals

<nav aria-label="Lecture navigation">

[← Day 02: Variables, Scope, and Hoisting](day-02-variables-scope-and-hoisting.md) | [Roadmap](../javascript-roadmap.md) | [Day 04: Coercion, Equality, and Operators →](day-04-coercion-equality-and-operators.md)

</nav>

---

## What You Will Learn Today

By the end of this lecture you should be able to:

- Explain the difference between a value, a variable binding, and an object identity.
- Categorize JavaScript's 7 primitive types and explain why primitives are strictly immutable.
- Understand how literals create values and why two identical object literals produce different identities.
- Inspect types safely using `typeof`, `Array.isArray()`, and prototype guards without falling into historical traps.
- Handle numeric boundaries, floating-point precision, `NaN`, `Infinity`, and `-0`.
- Understand when and why to use `BigInt` for large database IDs and timestamps.
- Use `Symbol` for unique, non-colliding object property keys.
- Prevent data loss and serialization crashes when passing data across Node.js service boundaries.

**Prerequisites:** [Day 02 – Variables, Scope, and Hoisting](day-02-variables-scope-and-hoisting.md) (variable bindings, declaration keywords, mutability vs. rebinding).

---

## Quick Vocabulary Card

| Term | Definition |
| :--- | :--- |
| **Value** | A concrete piece of data stored in memory (e.g., `42`, `"active"`, `{ id: 1 }`). |
| **Type** | A category that defines what kind of data a value is and what operations you can perform on it. |
| **Binding** | A named identifier (variable) that points to a specific memory slot holding a value. |
| **Primitive** | A single, immutable value stored directly on the stack that has no methods or mutable properties. |
| **Object Identity** | The unique memory address of an object on the heap; two objects are equal only if they share the exact same address. |
| **Literal** | Source code syntax that directly describes and creates a fixed value (e.g., `42`, `"hello"`, `[]`, `{}`). |
| **Safe Integer** | An integer between `-(2^53 - 1)` and `2^53 - 1` that JavaScript numbers can represent without rounding errors. |
| **Immutability** | The guarantee that a value's internal data cannot be modified after it is created. |

---

## 1. A Value Is Data; a Binding Is a Name

A **value** is the actual piece of data in memory (such as `80`, `"hello"`, or `{ user: "Asha" }`). A **binding** is a variable name that points to that value.

### Primitives Are Copied by Value

When you assign a primitive value from one variable to another, JavaScript copies the raw value into a brand-new, independent memory slot. Changing one variable never affects the other.

```js
// Node.js code
let firstScore = 80;
let secondScore = firstScore; // ✅ Value copied: secondScore gets its own independent 80

secondScore = 90;             // Rebinding secondScore does not alter firstScore
console.log(firstScore);      // 80 (untouched)
console.log(secondScore);     // 90
```

### Objects Are Copied by Reference (Shared Identity)

When a variable holds an object, it does not store the object data directly inside the variable. Instead, the variable stores an **object identity**—a reference pointer to the location in heap memory where that object lives.

When you assign an object variable to another variable, JavaScript copies only the *reference pointer*, not the object data. Both variables now point to the exact same object in memory.

> **Analogy for Object Identity vs. Primitive Copying:**
> Handing someone a photocopy of a $10 bill is like copying a primitive: they have their own independent copy. If they tear it up, your bill is untouched. Handing someone your house address written on a note is like copying an object reference: both of you now have directions to the exact same house. If your friend paints the front door yellow, you will see a yellow door when you arrive home.

```js
// Node.js code
const firstUser = { name: "Asha" };
const secondUser = firstUser; // ✅ Copies the reference pointer, NOT the object data

secondUser.name = "Mina";     // ❌ Mutates the shared object in memory!
console.log(firstUser.name);  // "Mina" — firstUser is affected!
console.log(firstUser === secondUser); // true — both point to the exact same memory address

const thirdUser = { name: "Mina" };
console.log(firstUser === thirdUser); // ❌ false — distinct objects with identical properties!
```

### Summary Comparison: Primitive Value vs. Object Reference

| Feature | Primitive Value | Object / Reference |
| :--- | :--- | :--- |
| **Memory location** | Stored directly on the call stack | Stored on the heap (variable holds reference pointer) |
| **Assignment (`b = a`)** | Copies raw value into an independent slot | Copies reference pointer; both variables point to the same object |
| **Equality (`a === b`)** | Compares value contents | Compares memory reference addresses |
| **Internal mutability** | Strictly immutable | Mutable by default |

---

## 2. JavaScript's 7 Primitive Types & Objects

JavaScript has exactly **7 primitive types**. Every value that is not a primitive is an **Object** (including plain objects, arrays, functions, dates, regexes, and maps).

### The 7 Primitive Types

1. **`undefined`**: Represents a variable that has been declared but never assigned a value, or a non-existent object property.
2. **`null`**: Represents an intentional, explicit absence of any object value.
3. **`boolean`**: Represents a logical value: either `true` or `false`.
4. **`number`**: Double-precision 64-bit IEEE 754 floating-point number.
5. **`bigint`**: Arbitrary-precision integer for whole numbers larger than `number` can safely represent.
6. **`string`**: Sequence of 16-bit code units representing immutable text.
7. **`symbol`**: A unique and immutable token, primarily used as non-colliding object property keys.

### Primitives Are Strictly Immutable

**Immutable** means the value itself cannot be changed internally. You can reassign a variable to point to a new primitive, but the existing primitive value cannot be modified.

Any method called on a primitive (like `str.toUpperCase()`) returns a brand-new primitive; it does not change the original string in place.

```js
// Node.js code
"use strict";

let message = "cat";
message.toUpperCase();     // Returns "CAT", but does not modify message in place
console.log(message);      // "cat" — original string remains unchanged

message[0] = "b";          // ❌ Silent failure in non-strict mode, TypeError in strict mode
console.log(message);      // "cat" — characters cannot be modified in place

let count = 10;
count + 1;                 // Returns 11, but count is still 10
console.log(count);        // 10
```

### Objects Are Mutable Collections

Objects are mutable by default. You can add, modify, or delete properties at any time. Declaring an object with `const` protects the variable binding from being reassigned, but it does **not** freeze the properties inside the object.

```js
// Node.js code
const account = { balance: 100 };
account.balance += 25;     // ✅ Allowed: modifies property inside the object
account.owner = "Alex";    // ✅ Allowed: adds new property
delete account.balance;    // ✅ Allowed: removes property
console.log(account);      // { owner: 'Alex' }

// account = { balance: 200 }; // ❌ TypeError: Assignment to constant variable
```

### Summary Comparison: All 8 JavaScript Types

| Type | Kind | Example Literal | `typeof` Result | Mutable? |
| :--- | :--- | :--- | :--- | :--- |
| `undefined` | Primitive | `undefined` | `"undefined"` | No |
| `null` | Primitive | `null` | `"object"` *(legacy bug)* | No |
| `boolean` | Primitive | `true`, `false` | `"boolean"` | No |
| `number` | Primitive | `42`, `3.14`, `NaN`, `Infinity` | `"number"` | No |
| `bigint` | Primitive | `123n` | `"bigint"` | No |
| `string` | Primitive | `"hello"`, `'hello'`, \`hello\` | `"string"` | No |
| `symbol` | Primitive | `Symbol("id")` | `"symbol"` | No |
| `object` | Reference | `{}`, `[]`, `new Date()`, `() => {}` | `"object"` *(or `"function"`)* | Yes (by default) |

---

## 3. Literals Create Values

A **literal** is source code syntax that directly represents and creates a fixed value. It is how you write values directly into your JavaScript programs.

```js
// Node.js code
const count = 12;                       // Number literal
const title = "JavaScript";             // String literal
const enabled = true;                   // Boolean literal
const empty = null;                     // Null literal
const largeId = 9_007_199_254_740_991n; // BigInt literal (with readable numeric separator `_`)
const items = ["a", "b"];               // Array literal
const user = { name: "Ravi" };          // Object literal
const pattern = /ready/i;               // Regular expression literal
```

### The Literal Is Not the Resulting Value

The literal syntax in your editor is not the value itself—it is an instruction that produces a value when executed:

1. **Primitive Literals:** When JavaScript evaluates a primitive literal, it produces a primitive value. Because primitives are compared by value, two identical primitive literals are strictly equal:
   ```js
   // Node.js code
   console.log(10 === 10);       // ✅ true — identical numeric values
   console.log("ok" === "ok");   // ✅ true — identical string values
   ```

2. **Object Literals:** Each time an object or array literal runs, JavaScript allocates a **brand-new object identity in memory**. Even if two object literals have identical properties, they are distinct objects in memory:
   ```js
   // Node.js code
   const left = {};
   const right = {};

   console.log(left === right); // ❌ false — two distinct object identities!

   const listA = [1, 2];
   const listB = [1, 2];
   console.log(listA === listB); // ❌ false — distinct array identities!
   ```

### Numeric Literals & Modern Syntax

JavaScript supports several numeric literal notations:

```js
// Node.js code
const decimal = 1000000;
const readable = 1_000_000; // ✅ Numeric separator for readability (ES2021)
const hex = 0xFF;           // Hexadecimal (255)
const binary = 0b1010;      // Binary (10)
const octal = 0o77;         // Octal (63)

console.log(decimal === readable); // true
console.log(hex, binary, octal);   // 255 10 63
```

---

## 4. Type Inspection: `typeof`, `Array.isArray()`, and `instanceof`

JavaScript provides operators and utility functions to inspect the type of a value at runtime.

### `typeof` and Its Known Limitations

The `typeof` operator returns a string indicating the type category of an operand.

```js
// Node.js code
console.log(typeof 10);        // "number"
console.log(typeof "10");      // "string"
console.log(typeof false);     // "boolean"
console.log(typeof undefined); // "undefined"
console.log(typeof 10n);       // "bigint"
console.log(typeof Symbol());  // "symbol"
console.log(typeof (() => {})); // "function"
console.log(typeof {});        // "object"
console.log(typeof []);        // "object" (cannot distinguish arrays from objects!)
console.log(typeof null);      // "object" (historical bug!)
```

### The `typeof null === "object"` Trap

In the original 1995 JavaScript implementation, values were stored with a type tag and a value pointer. The type tag for object references was `000`. Because `null` was represented as a NULL pointer (`0x00`), the engine saw the `000` tag and incorrectly labeled it `"object"`.

This bug cannot be fixed because changing it would break millions of legacy web applications.

```js
// Node.js code
const input = null;

// ❌ Dangerous check: allows null through and crashes later!
if (typeof input === "object") {
  // console.log(input.name); // ❌ Throws TypeError: Cannot read properties of null
}

// ✅ Correct check: explicitly rule out null
if (input !== null && typeof input === "object") {
  console.log("Safe non-null object access");
}
```

### Inspecting Arrays and Plain Objects

Because `typeof []` returns `"object"`, always use `Array.isArray()` to check if a value is an array.

```js
// Node.js code
const list = [1, 2];
const dict = { a: 1 };

console.log(Array.isArray(list)); // ✅ true
console.log(Array.isArray(dict)); // ❌ false

// ✅ Reliable type inspection helper
function describeType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

console.log(describeType(null));   // "null"
console.log(describeType([1, 2])); // "array"
console.log(describeType({}));     // "object"
```

### `instanceof` and Cross-Realm Caveats

The `instanceof` operator tests whether a constructor's prototype appears in an object's prototype chain.

```js
// Node.js code
const today = new Date();
console.log(today instanceof Date);   // ✅ true
console.log([] instanceof Array);     // ✅ true
console.log({} instanceof Array);     // ❌ false
```

*Caveat:* `instanceof` can give false negatives when objects originate from different global execution realms (such as browser `<iframe>` elements or Node.js `node:vm` sandboxes), because each realm has its own distinct `Array.prototype` object. `Array.isArray()` works reliably across all realms.

---

## 5. Numbers, Safe Integers, and `BigInt`

JavaScript's standard `number` type represents 64-bit IEEE 754 floating-point numbers. It uses 53 bits for precision, meaning it can only represent integers exactly within a safe boundary.

### The Safe Integer Boundary

The largest integer that JavaScript can safely represent without rounding error is `Number.MAX_SAFE_INTEGER` (`2^53 - 1`, or `9,007,199,254,740,991`). Beyond this limit, consecutive integers collide because there are not enough bits to represent every individual number:

```js
// Node.js code
const maxSafe = Number.MAX_SAFE_INTEGER; // 9007199254740991

console.log(maxSafe + 1 === maxSafe + 2); // ❌ true! Silent precision loss!
console.log(Number.isSafeInteger(maxSafe));     // ✅ true
console.log(Number.isSafeInteger(maxSafe + 1)); // ❌ false
```

### `BigInt` (ES2020+)

A `bigint` represents integers with arbitrary precision. You create a `bigint` by appending an `n` suffix or by calling `BigInt()`.

Key rules for `BigInt`:
1. **No implicit mixing:** You cannot mix `BigInt` and `Number` in arithmetic operations without explicit conversion.
2. **Division truncates:** BigInt only represents integers; division drops any fractional remainder.
3. **JSON serialization:** Standard `JSON.stringify()` cannot serialize a `BigInt` and throws a `TypeError`.

```js
// Node.js code
const big1 = 9_007_199_254_740_992n;
const big2 = big1 + 1n; // ✅ Exact arithmetic
console.log(big2);      // 9007199254740993n

// console.log(big1 + 5); // ❌ TypeError: Cannot mix BigInt and other types
console.log(big1 + BigInt(5)); // ✅ 9007199254740997n
console.log(5n / 2n);          // ✅ 2n (fraction truncated, not 2.5n)

// ❌ JSON serialization trap:
try {
  JSON.stringify({ id: 100n });
} catch (err) {
  console.log(err.message); // "Do not know how to serialize a BigInt"
}
```

### Floating-Point Precision (`0.1 + 0.2`)

Computers store floating-point numbers in binary (base-2). Fractions like `0.1` and `0.2` cannot be represented with finite binary digits, just like `1/3` cannot be represented with finite decimal digits (`0.333...`).

```js
// Node.js code
console.log(0.1 + 0.2); // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3); // ❌ false!

// ✅ Safe float comparison using Number.EPSILON
function areFloatsEqual(a, b) {
  return Math.abs(a - b) < Number.EPSILON;
}
console.log(areFloatsEqual(0.1 + 0.2, 0.3)); // ✅ true
```

---

## 6. Special Numbers: `NaN`, `Infinity`, and Signed Zero

JavaScript has three special numeric values used to represent limits and calculation errors.

### `NaN` ("Not-a-Number")

`NaN` indicates that an arithmetic or conversion operation failed to produce a valid number. Despite its name, `typeof NaN` is `"number"`.

`NaN` is the **only value in JavaScript that is not equal to itself**.

```js
// Node.js code
const invalid = Number("not_a_number");
console.log(invalid);        // NaN
console.log(typeof invalid); // "number"

console.log(invalid === invalid); // ❌ false! NaN is never equal to NaN

// ❌ Global isNaN() coerces strings first:
console.log(isNaN("hello")); // true — converts "hello" to NaN, misleading!

// ✅ Number.isNaN() checks without coercion (ES2015+):
console.log(Number.isNaN("hello"));   // false — "hello" is a string, not NaN
console.log(Number.isNaN(invalid));   // true — genuinely the NaN value
```

### `Infinity` and `-Infinity`

Produced when an operation overflows `Number.MAX_VALUE` or when dividing a non-zero number by zero.

```js
// Node.js code
console.log(1 / 0);          // Infinity
console.log(-1 / 0);         // -Infinity
console.log(typeof Infinity); // "number"
console.log(Number.isFinite(1 / 0)); // false
```

### Signed Zero: `+0` vs `-0`

IEEE 754 numbers maintain a sign bit for zero. While `+0 === -0` evaluates to `true`, division by zero reveals the sign:

```js
// Node.js code
console.log(0 === -0);           // true
console.log(Object.is(0, -0));   // ❌ false! Object.is distinguishes signed zero

console.log(1 / 0);   // Infinity
console.log(1 / -0);  // -Infinity
```

### Comparison Matrix: `===` vs. `Object.is()`

| Comparison | `===` | `Object.is()` |
| :--- | :--- | :--- |
| `NaN === NaN` | `false` | `true` |
| `0 === -0` | `true` | `false` |
| `'abc' === 'abc'` | `true` | `true` |
| `{}` === `{}` | `false` | `false` |

---

## 7. Symbols: Unique Primitive Identifiers

A **Symbol** is a guaranteed unique primitive token created via `Symbol("description")`. Two symbols created with the same description are still completely distinct values.

Symbols are commonly used as object property keys that will never collide with standard string keys.

```js
// Node.js code
const firstKey = Symbol("id");
const secondKey = Symbol("id");

console.log(firstKey === secondKey); // ❌ false — each Symbol() is unique!

const record = {
  name: "Asha",
  [firstKey]: 42
};

console.log(record[firstKey]); // 42
console.log(Object.keys(record)); // ["name"] — symbols are omitted from standard key lists!
console.log(Object.getOwnPropertySymbols(record)); // [ Symbol(id) ] — symbols are not private!
```

---

## 8. Value Equality vs. Object Identity & Schema Contracts

Strict equality (`===`) compares primitive values directly by their contents. For objects, it compares **reference identity** (whether they point to the exact same memory address).

```js
// Node.js code
const first = { count: 1 };
const second = { count: 1 };
const same = first;

console.log(first === second); // ❌ false: two distinct objects in memory
console.log(first === same);   // ✅ true: both point to the same object
```

### A Type Check Is Not a Data Contract

A broad check like `typeof input === "object"` accepts `null`, arrays, dates, and maps. In Node.js backend services accepting external JSON, validate against a strict data contract rather than relying on a loose type label:

```js
// Node.js code
function isPlainRecord(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

console.log(isPlainRecord({ name: "Asha" })); // ✅ true
console.log(isPlainRecord(null));              // ❌ false
console.log(isPlainRecord([]));                // ❌ false
```

---

## 9. Node.js Backend Application Connection: Service Boundaries & 64-Bit IDs

In Node.js backends, data arrives across network boundaries through JSON payloads, environment variables, Redis caches, and SQL databases.

### The 64-Bit Database ID Pitfall

Databases like PostgreSQL, MySQL, and distributed systems (Twitter Snowflake IDs) use 64-bit integer IDs. Because these IDs often exceed `Number.MAX_SAFE_INTEGER` (`9,007,199,254,740,991`), parsing them into JavaScript `Number` values silently rounds the lower bits, corrupting foreign keys and updating the wrong rows!

```js
// Node.js code
// ❌ Dangerous: parsing a 64-bit database ID as a Number
const dbRow = { id_str: "9007199254740995" };
const corruptedId = Number(dbRow.id_str);
console.log(corruptedId); // 9007199254740996 (Rounded and corrupted!)

// ✅ Safe: keep 64-bit IDs as string or BigInt
const safeBigIntId = BigInt(dbRow.id_str);
console.log(safeBigIntId.toString()); // "9007199254740995" (Exact!)
```

---

## Tricky Points

### 1. `typeof null === "object"` Can Cause Runtime Server Crashes

If your API validation relies solely on `typeof req.body === "object"`, an incoming HTTP POST with a payload of `null` passes the check. Subsequent property accesses like `req.body.userId` throw an unhandled `TypeError: Cannot read properties of null`, crashing the request handler.

```js
// Node.js code
function validateBody(body) {
  // ❌ Broken check:
  // if (typeof body === "object") { return body.userId; } // Throws on null!

  // ✅ Safe check:
  if (body !== null && typeof body === "object" && !Array.isArray(body)) {
    return body.userId;
  }
  throw new Error("Invalid request body");
}
```

### 2. Global `isNaN()` Coerces; `Number.isNaN()` Does Not

Global `isNaN()` first coerces its argument to a number. Non-numeric values like `"test"`, `undefined`, and `{}` produce `true`, even though they are not the `NaN` value. Always use `Number.isNaN()` to check if a computed result is strictly `NaN`.

```js
// Node.js code
console.log(isNaN("invalid_string"));        // true (coerced "invalid_string" to NaN)
console.log(Number.isNaN("invalid_string")); // false (checks type first: it's a string, not NaN)
```

### 3. `JSON.stringify()` Crashes on `BigInt`

If your backend code attaches a `BigInt` to a response object, calling `JSON.stringify(resData)` throws an unhandled `TypeError: Do not know how to serialize a BigInt`. You must provide a custom serializer or serialize bigints as strings.

```js
// Node.js code
const payload = { userId: 9007199254740995n };

// ✅ Safe serialization with replacer:
const json = JSON.stringify(payload, (key, value) =>
  typeof value === "bigint" ? value.toString() : value
);
console.log(json); // '{"userId":"9007199254740995"}'
```

### 4. Floating-Point Financial Math Creates Phantom Cents

Writing `const total = 19.99 * 3` produces `59.970000000000006`. In financial transactions, always store balances and prices in the smallest integer currency unit (e.g., cents instead of dollars: `1999 * 3 = 5997` cents).

---

## Hands-On Exercise: Fix the Payment Transaction Ingestion Engine

A junior engineer wrote a webhook consumer for incoming bank settlement events. The code contains multiple type-related bugs that cause crashes, corrupted account balances, and lost transaction IDs.

### Buggy Code

```js
// Node.js code — payment-consumer.js
function processSettlement(rawEvent) {
  // Bug 1: typeof rawEvent === "object" allows null through, crashing on rawEvent.txId
  if (typeof rawEvent !== "object") {
    throw new Error("Invalid event payload");
  }

  // Bug 2: 64-bit bank settlement ID converted with Number() loses precision
  const txId = Number(rawEvent.txId);

  // Bug 3: Using global isNaN() causes valid numbers in string form or objects to misbehave
  if (isNaN(rawEvent.amount)) {
    throw new Error("Invalid transaction amount");
  }

  // Bug 4: JSON.stringify crashes if internal ledger attaches a BigInt fee
  const record = {
    txId: txId,
    amount: rawEvent.amount,
    internalFee: 150000000000000000n // BigInt fee in wei/satoshi
  };

  return JSON.stringify(record); // Throws TypeError!
}
```

### Acceptance Criteria

1. Reject `null`, arrays, and primitives with an explicit error before reading properties.
2. Preserve exact transaction IDs larger than `Number.MAX_SAFE_INTEGER` without rounding.
3. Validate that `amount` is a genuine finite number greater than zero without using global `isNaN()`.
4. Serialize the transaction record into valid JSON without throwing `TypeError: Do not know how to serialize a BigInt`.

### Solution

```js
// Node.js code — payment-consumer.js
"use strict";

function processSettlement(rawEvent) {
  // Fix 1: Explicit guard checking for non-null, non-array object
  if (rawEvent === null || typeof rawEvent !== "object" || Array.isArray(rawEvent)) {
    throw new TypeError("Payload must be a non-null plain object");
  }

  // Fix 2: Keep large IDs as BigInt or validate string to prevent IEEE 754 precision loss
  if (typeof rawEvent.txId !== "string" || !/^\d+$/.test(rawEvent.txId)) {
    throw new TypeError("txId must be a numeric string representing an exact ID");
  }
  const txId = BigInt(rawEvent.txId);

  // Fix 3: Strict numeric type check using Number.isFinite
  const amount = rawEvent.amount;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    throw new RangeError("amount must be a positive finite number");
  }

  const record = {
    txId: txId.toString(), // Fix 4a: Store BigInt as string for safe JSON compatibility
    amount: amount,
    internalFee: 150000000000000000n
  };

  // Fix 4b: Provide a replacer function to guarantee BigInt serialization safety
  return JSON.stringify(record, (key, value) =>
    typeof value === "bigint" ? value.toString() : value
  );
}

// Verification
const result = processSettlement({
  txId: "9007199254740995",
  amount: 250.50
});

console.log("Processed JSON:", result);
// Output: {"txId":"9007199254740995","amount":250.5,"internalFee":"150000000000000000"}
```

---

## Summary

- JavaScript has **7 primitive types** (`undefined`, `null`, `boolean`, `number`, `bigint`, `string`, `symbol`) and **Objects**.
- Primitives are stored on the stack, copied by value, and are **completely immutable**.
- Objects are stored on the heap and variables hold **references**. Assignment copies the reference pointer, preserving object identity.
- **Literals** are source code notations that produce values. Two identical primitive literals evaluate to the same value (`10 === 10`), but two identical object literals produce distinct objects in memory (`{} !== {}`).
- `typeof null === "object"` is a legacy runtime bug. Always verify `val !== null && typeof val === "object"` when testing for objects.
- Use `Array.isArray()` to detect arrays; `typeof []` returns `"object"`.
- `number` is an IEEE 754 64-bit float with an exact integer limit of `Number.MAX_SAFE_INTEGER` (`9,007,199,254,740,991`). Use `BigInt` for arbitrary integer precision.
- `NaN` is of type `"number"` and is the only value in JavaScript where `x !== x`. Test for it with `Number.isNaN()`, not global `isNaN()`.
- Standard `JSON.stringify()` cannot serialize `BigInt` values and throws a `TypeError`.

---

## Cheat Sheet

### Type Inspection Reference

| Target Type | Correct Inspection Pattern | Avoid |
| :--- | :--- | :--- |
| **`null`** | `val === null` | `typeof val === "object"` |
| **`undefined`** | `val === undefined` or `typeof val === "undefined"` | `val == null` (matches `null` too) |
| **Array** | `Array.isArray(val)` | `typeof val === "object"`, `val instanceof Array` |
| **Plain Object** | `val !== null && typeof val === "object" && !Array.isArray(val)` | `typeof val === "object"` alone |
| **`NaN`** | `Number.isNaN(val)` | `isNaN(val)` (coerces strings), `val === NaN` |
| **Integer / Safe Int** | `Number.isSafeInteger(val)` | `typeof val === "number"` |
| **`BigInt`** | `typeof val === "bigint"` | Mixing directly with numbers |

### `===` vs `Object.is()` Quick-Reference

| Comparison | `===` | `Object.is()` |
| :--- | :--- | :--- |
| `NaN` and `NaN` | `false` | `true` |
| `+0` and `-0` | `true` | `false` |
| `1` and `1` | `true` | `true` |
| `null` and `undefined` | `false` | `false` |

### Common Pitfalls

- **Testing for objects with `typeof val === "object"` without checking for `null`** → crashes on property lookup when `val` is `null`.
- **Parsing 64-bit database IDs with `Number()` or `parseInt()`** → causes silent precision loss and overwrites unrelated rows.
- **Using `NaN === NaN` to check for invalid numbers** → always evaluates to `false`. Use `Number.isNaN()`.
- **Using global `isNaN("hello")`** → coerces the string to `NaN` and returns `true`. Use `Number.isNaN()`.
- **Calling `JSON.stringify()` on payloads containing `BigInt`** → throws an uncaught `TypeError: Do not know how to serialize a BigInt`.
- **Comparing objects with `===` expecting deep value equality** → `{} === {}` is always `false` because they have distinct reference addresses.

---

## Interview Questions

### 1. What is the difference between Primitive Immutability and `const`?

**Question:** If a variable is declared with `const`, does that make its value immutable? Explain the difference between variable binding and value immutability.

**Answer:** No. `const` creates an immutable *binding* (the variable identifier cannot be reassigned to a new memory address). However, `const` does not make the underlying *value* immutable.

If a `const` variable holds a primitive (such as a string or number), the primitive itself is already immutable by language specification, and the binding cannot be changed. But if `const` holds an object, array, or map, the variable stores a reference pointer to a heap address. The pointer cannot be reassigned, but the properties inside that heap object can be freely mutated, added, or deleted. To make an object's properties immutable, you must use `Object.freeze()` (shallow) or a deep-freeze utility.

---

### 2. What will this code output and why?

```js
console.log(typeof null);
console.log(NaN === NaN);
console.log(Object.is(NaN, NaN));
console.log(0 === -0);
console.log(Object.is(0, -0));
console.log(Number.MAX_SAFE_INTEGER + 1 === Number.MAX_SAFE_INTEGER + 2);
```

**Question:** Predict the output of these six statements and explain the underlying language mechanism for each.

**Answer:**
1. `"object"` — A historical 1995 bug where `null` shared the binary type tag `000` with object references.
2. `false` — IEEE 754 specifies that `NaN` represents an undefined numerical result; it cannot be equal to any value, including another `NaN`.
3. `true` — `Object.is` implements the ECMAScript `SameValue` algorithm, which treats two `NaN` values as identical.
4. `true` — IEEE 754 and JavaScript strict equality treat signed zero `+0` and `-0` as equal.
5. `false` — `Object.is` distinguishes signed zero by comparing sign bits (`1 / +0 === Infinity`, while `1 / -0 === -Infinity`).
6. `true` — `Number.MAX_SAFE_INTEGER` is `2^53 - 1`. Numbers beyond this limit cannot be represented uniquely in double-precision 64-bit binary floats, so both expressions round to `9007199254740992`.

---

### 3. Why did this production payment webhook crash?

```js
app.post("/webhook", (req, res) => {
  if (typeof req.body === "object") {
    const txId = req.body.txId;
    saveToDb({ txId, raw: req.body });
    return res.status(200).send("OK");
  }
  res.status(400).send("Bad Request");
});
```

**Question:** Under what conditions will this Express endpoint crash with an unhandled exception, and how do you fix it?

**Answer:** If a client sends an HTTP request with an empty body, a `Content-Type: application/json` header, and a payload of literal `null`, body parsers (like `express.json()`) parse `req.body` as `null`.

Because `typeof null === "object"`, the `if` check evaluates to `true`. Execution enters the block and attempts to read `req.body.txId`, throwing an unhandled `TypeError: Cannot read properties of null (reading 'txId')`.

**Fix:** Harden the type guard to reject `null` and arrays:
```js
if (req.body !== null && typeof req.body === "object" && !Array.isArray(req.body)) {
  const txId = req.body.txId;
  // ...
}
```

---

### 4. How do you handle 64-bit Database IDs and BigInt serialization in Node.js?

**Question:** You are building a Node.js microservice that reads Twitter-style 64-bit Snowflake IDs from PostgreSQL (`BIGINT`) and returns them in a JSON REST API. What problems occur if you use standard JavaScript numbers or `BigInt`, and how do you design a robust solution?

**Answer:**
Snowflake IDs (e.g., `1543219876543210987`) exceed `Number.MAX_SAFE_INTEGER` (`9,007,199,254,740,991`).
1. **Precision Loss:** If the PostgreSQL client parses the column into a JavaScript `Number`, the lower bits are rounded. Different IDs collide or become corrupted, causing queries by ID to fail or update incorrect rows.
2. **Serialization Crash:** If the database client driver returns a native `BigInt`, attempting to run `res.json({ id: row.id })` triggers `JSON.stringify()`, which immediately crashes the process with `TypeError: Do not know how to serialize a BigInt`.

**Solution:**
Configure the PostgreSQL driver (e.g., `pg`) to return `BIGINT` columns as plain strings (`String`). If arithmetic or bitwise masking is required inside the service, convert them to `BigInt(idStr)`, perform calculations, and convert back to `id.toString()` before serializing the outgoing HTTP response.

---

<nav aria-label="Lecture navigation">

[← Day 02: Variables, Scope, and Hoisting](day-02-variables-scope-and-hoisting.md) | [Roadmap](../javascript-roadmap.md) | [Day 04: Coercion, Equality, and Operators →](day-04-coercion-equality-and-operators.md)

</nav>
