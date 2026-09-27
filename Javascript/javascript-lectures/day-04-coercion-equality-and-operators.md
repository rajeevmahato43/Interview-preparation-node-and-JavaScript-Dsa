# Day 04: Coercion, Equality, and Operators

<nav aria-label="Lecture navigation">

[← Day 03: Values, Types, and Literals](day-03-values-types-and-literals.md) | [Roadmap](../javascript-roadmap.md) | [Day 05: Control Flow and Loops →](day-05-control-flow-and-loops.md)

</nav>

---

## What You Will Learn Today

By the end of this lecture you should be able to:

- Distinguish explicit type conversion from implicit coercion in JavaScript.
- Master the 8 falsy values and avoid bugs caused by confusing falsy with nullish.
- Understand how addition (`+`) is overloaded for strings and numbers, and predict arithmetic coercion.
- Use logical operators (`||`, `&&`, `??`) and optional chaining (`?.`) correctly without wiping out valid `0` or `""` values.
- Explain the exact mechanics of `===`, `==`, and `Object.is()`, including the step-by-step `[] == ![]` trace.
- Predict relational comparisons between numbers and strings (such as `"20" < "3"`).
- Prevent security vulnerabilities and data corruption caused by string-based query parameters and environment variables in Node.js.

**Prerequisites:** [Day 03 – Values, Types, and Literals](day-03-values-types-and-literals.md) (primitive types, `NaN`, floating-point numbers, object identity).

---

## Quick Vocabulary Card

| Term | Definition |
| :--- | :--- |
| **Explicit Conversion** | Intentionally converting a value from one type to another using built-in functions (e.g., `Number(val)`, `String(val)`). |
| **Implicit Coercion** | JavaScript automatically converting a value's type behind the scenes to fulfill an operation (e.g., `"4" - 2`). |
| **Truthiness** | The boolean value produced when an arbitrary value is evaluated in a boolean context. |
| **Falsy** | A value that converts to `false` in a boolean context. There are exactly 8 falsy values in JavaScript. |
| **Nullish** | A value that is strictly either `null` or `undefined`. |
| **Short-Circuiting** | Stopping the evaluation of a logical expression as soon as the final result is determined. |
| **Strict Equality (`===`)** | Compares operands without type conversion. Returns `true` only if both type and value match. |
| **Loose Equality (`==`)** | Converts operands to a common type before comparing them according to language rules. |

---

## 1. Explicit Conversion vs. Implicit Coercion

**Explicit conversion** occurs when you intentionally cast a value using language primitives like `Number()`, `String()`, or `Boolean()`. **Implicit coercion** occurs when JavaScript automatically converts a type under the hood during operations like addition, subtraction, or condition evaluation.

> **Analogy for Implicit Coercion:**
> Implicit coercion is like a cheap universal power adapter that attempts to bend, file down, or jam any electrical plug into any wall socket. Occasionally it works, but more often it sparks, damages the appliance, or blows a fuse without warning. Explicit conversion is like verifying the voltage on the label before plugging it in.

### Explicit String, Number, and Boolean Conversion

Using explicit conversion functions makes your intentions clear to anyone reading your code:

```js
// Node.js code
// ✅ Explicit String conversion
console.log(String(123));         // "123"
console.log(String(null));        // "null"
console.log(String(undefined));   // "undefined"
console.log(String([1, 2, 3]));    // "1,2,3"

// ✅ Explicit Number conversion
console.log(Number("42"));        // 42
console.log(Number("   42   "));  // 42 (trims whitespace)
console.log(Number("42px"));      // ❌ NaN (Number requires the entire string to be numeric)
console.log(parseInt("42px", 10)); // ✅ 42 (reads digits until first non-digit character)

// ⚠️ Number conversion edge cases to remember:
console.log(Number(""));          // 0 (empty string converts to zero!)
console.log(Number(null));        // 0 (null converts to zero!)
console.log(Number(undefined));   // NaN (undefined becomes NaN!)
console.log(Number(false));       // 0
console.log(Number(true));        // 1

// ✅ Explicit Boolean conversion
console.log(Boolean(1));          // true
console.log(Boolean(0));          // false
console.log(Boolean(""));         // false
console.log(Boolean("0"));        // ⚠️ true (any non-empty string is truthy!)
console.log(Boolean([]));         // ⚠️ true (all objects and arrays are truthy!)
```

### Summary Comparison: Conversion of Common Values

| Value | `String(val)` | `Number(val)` | `Boolean(val)` |
| :--- | :--- | :--- | :--- |
| `undefined` | `"undefined"` | `NaN` | `false` |
| `null` | `"null"` | `0` *(trap)* | `false` |
| `true` / `false` | `"true"` / `"false"` | `1` / `0` | `true` / `false` |
| `""` (empty string) | `""` | `0` *(trap)* | `false` |
| `"0"` | `"0"` | `0` | `true` *(trap)* |
| `"42"` | `"42"` | `42` | `true` |
| `"42px"` | `"42px"` | `NaN` | `true` |
| `[]` (empty array) | `""` | `0` *(via `""`)* | `true` *(trap)* |
| `{}` (empty object) | `"[object Object]"` | `NaN` | `true` *(trap)* |

---

## 2. Boolean Conversion and Truthiness

Every value in JavaScript is either **truthy** or **falsy** when evaluated in a boolean context (like an `if` condition).

### The Exactly 8 Falsy Values

Only **8 values** in JavaScript evaluate to `false`:

1. `false`
2. `0`
3. `-0`
4. `0n` (`BigInt` zero)
5. `""` (empty string)
6. `null`
7. `undefined`
8. `NaN`

**Every other value in JavaScript is truthy.** This includes empty arrays `[]`, empty plain objects `{}`, whitespace strings `" "`, the string `"0"`, and the string `"false"`.

### Falsy vs. Nullish

- **Falsy:** Any of the 8 values listed above.
- **Nullish:** Specifically and only `null` or `undefined`.

```js
// Node.js code
const pageSize = 0;

// ❌ Flawed: treating 0 as falsy when 0 is an intended valid input
if (!pageSize) {
  console.log("Defaulting page size..."); // Triggers even though pageSize was provided as 0!
}

// ✅ Correct: checking for nullish values
if (pageSize === undefined || pageSize === null) {
  console.log("Missing page size");
}
```

---

## 3. Overloaded Addition & Arithmetic Coercion

In JavaScript, the binary `+` operator is **overloaded**: it performs either numeric addition or string concatenation.

### How the `+` Operator Decides

1. If **either operand is a string**, JavaScript converts the other operand to a string and **concatenates** them.
2. If **neither operand is a string**, JavaScript converts both to numbers (or primitives) and performs **numeric addition**.

Evaluation proceeds strictly **left to right**, which can produce surprising results:

```js
// Node.js code
console.log(2 + 3);       // 5 (numeric addition)
console.log("2" + 3);     // "23" (string concatenation)
console.log(2 + "3");     // "23" (string concatenation)

// ⚠️ Left-to-right evaluation:
console.log(1 + 2 + "3"); // "33" (1 + 2 = 3, then 3 + "3" = "33")
console.log("1" + 2 + 3); // "123" ("1" + 2 = "12", then "12" + 3 = "123")
```

### Other Arithmetic Operators (`-`, `*`, `/`, `%`)

Unlike `+`, the other arithmetic operators **always convert their operands to numbers**:

```js
// Node.js code
console.log("6" - 2);   // 4 ("6" converted to number 6)
console.log("6" * "2"); // 12 (both converted to numbers)
console.log("6" / 2);   // 3
console.log("6" % 4);   // 2
console.log("foo" - 1); // NaN (cannot convert "foo" to a valid number)
```

### A Step-by-Step Coercion Trace

Consider this common interview expression:
```js
const result = "5" + 2 * "3";
```

How JavaScript evaluates it:
1. **Operator Precedence:** Multiplication (`*`) has higher precedence than addition (`+`).
2. **Multiplication Evaluation:** `2 * "3"` runs first. The `*` operator coerces `"3"` to the number `3`. `2 * 3` produces the number `6`.
3. **Addition Evaluation:** The expression is now `"5" + 6`.
4. **String Concatenation:** Because the left operand is a string, `+` coerces `6` to `"6"` and concatenates.
5. **Final Result:** The string `"56"`.

---

## 4. Short-Circuit Operators: `||`, `&&`, and `??`

JavaScript logical operators do **not** return booleans; they return the **actual operand value** that resolved the expression, evaluating strictly from left to right.

### Logical OR (`||`)

Returns the **first truthy operand**, or the last operand if all are falsy.

```js
// Node.js code
console.log("hello" || "world"); // "hello"
console.log("" || "fallback");   // "fallback"
console.log(0 || 100);           // ⚠️ 100 — wipes out valid zero!
console.log(false || true);      // true
console.log(null || undefined);  // undefined (both falsy, returns last)
```

### Logical AND (`&&`)

Returns the **first falsy operand**, or the last operand if all are truthy. Commonly used as a guard to execute code only when a condition holds.

```js
// Node.js code
console.log(true && "user_ready"); // "user_ready"
console.log(0 && "user_ready");    // 0 (short-circuits immediately)
console.log(null && undefined);    // null (first falsy)
```

### Nullish Coalescing (`??`) (ES2020+)

Returns the right-hand operand **only if the left-hand operand is nullish (`null` or `undefined`)**. If the left-hand operand is `0`, `""`, `false`, or `NaN`, `??` preserves it.

```js
// Node.js code
const config = {
  port: 0,
  timeoutMs: null,
  debug: false
};

// ❌ Using || replaces valid 0 and false:
console.log(config.port || 3000);    // 3000 (wrong! port 0 was intentionally set)
console.log(config.debug || true);   // true (wrong! debug was explicitly set to false)

// ✅ Using ?? preserves valid 0, false, and empty strings:
console.log(config.port ?? 3000);      // 0 (correct!)
console.log(config.debug ?? true);     // false (correct!)
console.log(config.timeoutMs ?? 5000); // 5000 (defaults because it is null)
```

### Mixing `??` with `||` or `&&` Requires Explicit Parentheses

Because JavaScript forbids ambiguous operator precedence between nullish coalescing and logical AND/OR, combining them without parentheses throws a compile-time `SyntaxError`.

```js
// Node.js code
const fallback = "default";
const a = null;
const b = "alt";

// const bad = a ?? b || fallback; // ❌ SyntaxError: Cannot use '??' unparenthesized with '||'

const good1 = (a ?? b) || fallback; // ✅ Explicit precedence
const good2 = a ?? (b || fallback); // ✅ Explicit precedence
```

### Comparison Matrix: `||` vs `??`

| Left Operand | Expression `val \|\| 'default'` | Expression `val ?? 'default'` |
| :--- | :--- | :--- |
| `null` | `'default'` | `'default'` |
| `undefined` | `'default'` | `'default'` |
| `0` | `'default'` *(trap!)* | `0` *(preserved)* |
| `""` | `'default'` *(trap!)* | `""` *(preserved)* |
| `false` | `'default'` *(trap!)* | `false` *(preserved)* |
| `NaN` | `'default'` | `NaN` *(preserved)* |

---

## 5. Optional Chaining (`?.`) (ES2020+)

Optional chaining (`?.`) allows safe reading of nested properties or calling methods without throwing a `TypeError` if an intermediate reference is `null` or `undefined`. If the target is nullish, evaluation stops and returns `undefined`.

### Syntax Forms

1. **Property access:** `obj?.prop`
2. **Bracket access:** `obj?.[expr]`
3. **Function call:** `fn?.()`

```js
// Node.js code
const response = {
  body: {
    user: {
      name: "Asha"
    }
  }
};

// ✅ Safely navigates nested properties
console.log(response.body?.user?.name);    // "Asha"
console.log(response.missing?.user?.name); // undefined (no crash!)

const handlers = {};
// handlers.onSuccess();    // ❌ TypeError: handlers.onSuccess is not a function
console.log(handlers.onSuccess?.()); // ✅ undefined (safely skipped)
```

### What `?.` Does NOT Protect Against

1. **Undeclared Variables:** `undeclaredVar?.prop` throws `ReferenceError`. The root variable must be declared.
2. **Non-Callable Existing Properties:** If `user.role` is a string (`"admin"`), writing `user.role?.()` throws `TypeError: user.role is not a function` because `role` is not nullish.
3. **Root Assignment:** You cannot use optional chaining on the left side of an assignment (`user?.name = "Alex"` throws `SyntaxError`).

---

## 6. Equality: `===` vs. `==` vs. `Object.is()`

JavaScript offers three mechanisms for comparing values.

### Strict Equality (`===`)

Strict equality checks both **type and value** without performing any coercion. If the operands have different types, it returns `false`.

```js
// Node.js code
console.log(42 === "42");        // false (number vs string)
console.log(0 === false);         // false (number vs boolean)
console.log(null === undefined);  // false
console.log({} === {});           // false (different heap identities)
```

### Loose Equality (`==`) and the Coercion Algorithm

Loose equality allows comparison between different types by coercing operands according to defined language rules:

1. **`null == undefined` evaluates to `true`** (and neither equals any other value under `==`).
2. **Number vs. String:** Converts the string to a number (`"42" == 42` becomes `42 == 42` → `true`).
3. **Boolean vs. Non-Boolean:** **The boolean is converted to a number first!** (`true` becomes `1`, `false` becomes `0`).
4. **Object vs. Primitive:** The object is converted to a primitive using its `valueOf()` and `toString()` methods.

```js
// Node.js code
console.log("1" == 1);          // ✅ true (string "1" -> number 1)
console.log(false == 0);        // ✅ true (boolean false -> number 0)
console.log(null == undefined); // ✅ true (special specification rule)
console.log("0" == false);      // ✅ true (false -> 0, then "0" -> 0, so 0 == 0!)
```

### The Infamous `[] == ![]` Trace

Why does `[] == ![]` evaluate to `true`? Trace each step:

```js
// Node.js code
console.log([] == ![]); // true

// Step-by-step breakdown:
// 1. Logical NOT (!) has higher precedence than ==.
//    [] is an object, which is truthy. Therefore, ![] becomes false.
//    Expression is now: [] == false
// 2. Boolean-to-number coercion:
//    When comparing an object to a boolean, the boolean coerces to a number.
//    false becomes 0.
//    Expression is now: [] == 0
// 3. Object-to-primitive coercion:
//    Comparing an object to a number calls [].toString(), producing "".
//    Expression is now: "" == 0
// 4. String-to-number coercion:
//    Comparing a string to a number coerces Number("") to 0.
//    Expression is now: 0 == 0
// 5. 0 == 0 evaluates to true!
```

### `Object.is()` (SameValue Comparison)

`Object.is()` behaves identically to `===` except for two edge cases:

1. `Object.is(NaN, NaN)` is `true` (`NaN === NaN` is `false`).
2. `Object.is(+0, -0)` is `false` (`+0 === -0` is `true`).

### Summary Comparison: Equality Operators

| Expression | `===` | `==` | `Object.is()` |
| :--- | :--- | :--- | :--- |
| `5 === '5'` | `false` | `true` | `false` |
| `null === undefined` | `false` | `true` | `false` |
| `0 === false` | `false` | `true` | `false` |
| `NaN === NaN` | `false` | `false` | **`true`** |
| `+0 === -0` | `true` | `true` | **`false`** |
| `[1] === [1]` | `false` | `false` | `false` |

---

## 7. Relational Operators: Number Math vs. Lexicographical Strings

The relational comparison operators (`<`, `>`, `<=`, `>=`) evaluate operands as numbers **unless both operands are strings**.

If both operands are strings, JavaScript performs a **lexicographical comparison** based on Unicode code-point values (character by character, like a dictionary).

```js
// Node.js code
// ✅ Numeric comparison:
console.log(20 < 30);       // true
console.log("20" < 30);     // true (one operand is a number, so "20" becomes 20)

// ❌ String lexicographical comparison:
console.log("20" < "3");    // ⚠️ true! Because character '2' (Unicode 50) < '3' (Unicode 51)
console.log("100" < "20");  // ⚠️ true! '1' < '2'
```

### The `null` Comparison Paradox

```js
// Node.js code
console.log(null > 0);  // false (null coerced to number 0: 0 > 0 is false)
console.log(null == 0); // false (null only loosely equals undefined, not numbers!)
console.log(null >= 0); // ⚠️ true! (evaluated as !(null < 0), and 0 < 0 is false -> !false is true)
```

---

## 8. Node.js Backend Application Connection: Queries & Env Variables

In Node.js backends (Express, Fastify, NestJS), incoming data from URL query parameters (`req.query`) and environment variables (`process.env`) **always arrives as strings**.

### The Vulnerability of Loose Query Checks

```js
// Node.js code
// Express route handler simulation: GET /users?isAdmin=false&limit=0
const query = {
  isAdmin: "false",
  limit: "0"
};

// ❌ Trap 1: Truthiness check on query string
if (query.isAdmin) {
  // Bug: "false" is a non-empty string, which is truthy!
  // Normal users gain admin privileges!
  console.log("Admin privilege granted!");
}

// ❌ Trap 2: Default fallback using ||
const limit = query.limit || 25;
console.log(limit); // 25 (User explicitly requested 0, but || wiped it out!)

// ✅ Correct validation and parsing:
const isActualAdmin = query.isAdmin === "true";
const sanitizedLimit = query.limit !== undefined ? Number(query.limit) : 25;
console.log({ isActualAdmin, sanitizedLimit }); // { isActualAdmin: false, sanitizedLimit: 0 }
```

---

## Tricky Points

### 1. `[] == false` is `true`, but `Boolean([])` is `true`

`Boolean([])` checks the truthiness of the array reference directly (all objects are truthy). However, `[] == false` triggers loose equality coercion, where `false` becomes `0`, `[]` becomes `""`, and `""` becomes `0`, yielding `0 == 0` (`true`).

```js
// Node.js code
if ([]) {
  console.log("Arrays are truthy!"); // ✅ This runs
}

console.log([] == false); // ✅ This is also true due to coercion!
```

### 2. `Number("")` Returns `0` While `Number(" ")` Also Returns `0`

An empty string or a whitespace-only string converts to `0` when passed to `Number()`. If an API requires a positive integer, validating via `Number(req.query.age)` allows empty strings to pass as `0`. Always check that strings contain actual non-whitespace digits before converting.

```js
// Node.js code
console.log(Number(""));    // 0
console.log(Number("   ")); // 0
console.log(Number(null));  // 0
```

### 3. String Lexicographical Comparison on Ports or User IDs

Comparing unparsed port strings like `req.query.port > "1024"` will fail because `"2"` is lexicographically greater than `"1024"`. Always parse inputs with `Number(x)` or `parseInt(x, 10)` before relational comparisons.

### 4. `defaultPort = process.env.PORT || 8080` Wipes Out Port `0`

In operating systems and test environments, port `0` instructs the OS to bind to any randomly available free port. Using `||` overrides `0` with `8080`. Always use `??` for numeric configurations.

---

## Hands-On Exercise: Fix the Flawed API Query & Config Parser

A junior developer implemented an API search and pagination handler. The service has three severe bugs:
1. Passing `?active=false` treats the filter as `true` (enabling inactive records).
2. Passing `?limit=0` resets the limit to `50`.
3. Passing `?minPrice=100&maxPrice=20` fails to detect that `minPrice > maxPrice` due to string comparisons.

### Buggy Code

```js
// Node.js code — search-parser.js
function parseSearchParams(query) {
  // Bug 1: Truthiness check treats "false" as true
  const isActive = query.active ? Boolean(query.active) : true;

  // Bug 2: || wipes out explicit limit of 0
  const limit = query.limit || 50;

  // Bug 3: String comparison ("100" < "20") causes invalid price range logic
  if (query.minPrice && query.maxPrice) {
    if (query.minPrice > query.maxPrice) {
      throw new Error("minPrice cannot exceed maxPrice");
    }
  }

  return { isActive, limit, minPrice: query.minPrice, maxPrice: query.maxPrice };
}
```

### Acceptance Criteria

1. `parseSearchParams({ active: "false" })` returns `{ isActive: false }`.
2. `parseSearchParams({ limit: "0" })` returns `{ limit: 0 }`.
3. `parseSearchParams({ minPrice: "100", maxPrice: "20" })` throws an error because numeric `100` exceeds numeric `20`.
4. Empty or missing parameters fall back cleanly to safe defaults.

### Solution

```js
// Node.js code — search-parser.js
"use strict";

function parseSearchParams(query = {}) {
  // Fix 1: Explicit string comparison for boolean query parameters
  let isActive = true;
  if (query.active !== undefined) {
    if (query.active === "true") isActive = true;
    else if (query.active === "false") isActive = false;
    else throw new TypeError("Parameter 'active' must be 'true' or 'false'");
  }

  // Fix 2: Nullish coalescing + explicit numeric parsing preserves 0
  let limit = 50;
  if (query.limit !== undefined && query.limit !== "") {
    const parsedLimit = Number(query.limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 0 || parsedLimit > 100) {
      throw new RangeError("limit must be an integer between 0 and 100");
    }
    limit = parsedLimit;
  }

  // Fix 3: Explicit numeric conversion before relational comparison
  let minPrice, maxPrice;
  if (query.minPrice !== undefined && query.minPrice !== "") {
    minPrice = Number(query.minPrice);
    if (!Number.isFinite(minPrice) || minPrice < 0) throw new TypeError("minPrice must be a valid number");
  }
  if (query.maxPrice !== undefined && query.maxPrice !== "") {
    maxPrice = Number(query.maxPrice);
    if (!Number.isFinite(maxPrice) || maxPrice < 0) throw new TypeError("maxPrice must be a valid number");
  }

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new RangeError("minPrice cannot exceed maxPrice");
  }

  return { isActive, limit, minPrice, maxPrice };
}

// Verification
console.log(parseSearchParams({ active: "false", limit: "0", minPrice: "10", maxPrice: "50" }));
// Output: { isActive: false, limit: 0, minPrice: 10, maxPrice: 50 }

try {
  parseSearchParams({ minPrice: "100", maxPrice: "20" });
} catch (err) {
  console.log("Validation caught:", err.message);
  // Output: Validation caught: minPrice cannot exceed maxPrice
}
```

---

## Summary

- **Explicit conversion** (`Number()`, `String()`, `Boolean()`) is clear, maintainable, and safe; **implicit coercion** introduces subtle edge cases.
- Exactly **8 values are falsy** (`false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`). All other values—including `[]`, `{}`, `"0"`, and `"false"`—are truthy.
- The `+` operator is **overloaded**: if either operand is a string, it concatenates; otherwise it performs numeric addition. Other arithmetic operators (`-`, `*`, `/`) strictly perform numeric calculations.
- **`??` (nullish coalescing)** only falls back for `null` and `undefined`, preserving valid falsy values like `0`, `""`, and `false`.
- **`?.` (optional chaining)** safely halts property evaluation if the target is nullish, but will not protect against undeclared variables or non-callable values.
- **`===`** checks type and value without coercion. **`==`** coerces types using the abstract equality algorithm, leading to anomalies like `[] == ![]`.
- Relational operators (`<`, `>`, `<=`, `>=`) compare strings character-by-character (lexicographically) when both operands are strings. Always parse numbers explicitly before comparing.

---

## Cheat Sheet

### Falsy vs. Nullish Reference

| Value | Falsy? | Nullish? | Notes |
| :--- | :--- | :--- | :--- |
| `false` | ✅ Yes | ❌ No | Boolean false |
| `0`, `-0`, `0n` | ✅ Yes | ❌ No | Zero numeric values |
| `""` | ✅ Yes | ❌ No | Empty string |
| `null` | ✅ Yes | ✅ Yes | Explicit missing object |
| `undefined` | ✅ Yes | ✅ Yes | Uninitialized / missing property |
| `NaN` | ✅ Yes | ❌ No | Invalid numeric result |
| `"0"`, `"false"` | ❌ No (Truthy) | ❌ No | Non-empty strings are always truthy |
| `[]`, `{}` | ❌ No (Truthy) | ❌ No | All objects/arrays are truthy |

### Logical Operators Quick-Reference

| Operator | Left Operand Condition to Return Right Operand | Use Case |
| :--- | :--- | :--- |
| `a \|\| b` | When `a` is falsy (`false`, `0`, `""`, `null`, `undefined`, `NaN`) | Fallback when *any* invalid/falsy value is unacceptable |
| `a && b` | When `a` is truthy | Conditional guard execution |
| `a ?? b` | When `a` is strictly `null` or `undefined` | Default configuration where `0`, `""`, or `false` are valid |
| `a?.b` | When `a` is not nullish | Safe navigation of nested objects |

### Common Pitfalls

- **Using `query.isAdmin` as a boolean check** → `"false"` evaluates to `true` because it is a non-empty string.
- **Using `value || defaultVal` for numeric settings** → wipes out `0` (e.g., port 0, limit 0, retryCount 0). Use `??`.
- **Comparing string numbers with `<` or `>`** → `"100" < "20"` is `true` because string comparison is alphabetical.
- **Assuming `[] == false` means `[]` is falsy** → `Boolean([])` is `true`. The equality operator coerces the array to `""` and then `0`.
- **Relying on `Number("")` for strict number validation** → converts empty strings to `0` instead of rejecting them.

---

## Interview Questions

### 1. Step-by-Step Trace: Why is `[] == ![]` True?

**Question:** Explain step-by-step why `[] == ![]` evaluates to `true`, while `Boolean([])` also evaluates to `true`.

**Answer:**
`Boolean([])` evaluates to `true` because in JavaScript, every object (including plain objects, arrays, and functions) is truthy by specification.

In `[] == ![]`, the expression undergoes multi-step operator evaluation and coercion:
1. **Logical NOT (`!`):** Has higher operator precedence than `==`. Since `[]` is truthy, `![]` evaluates to `false`. The expression becomes `[] == false`.
2. **Boolean-to-Number Coercion:** The specification dictates that when a boolean is compared with any value using `==`, the boolean converts to a number. `false` becomes `0`. The expression becomes `[] == 0`.
3. **Object-to-Primitive Coercion:** An object compared with a number calls the object's internal conversion. For an empty array, `[].toString()` produces the empty string `""`. The expression becomes `"" == 0`.
4. **String-to-Number Coercion:** When a string is compared with a number using `==`, the string is converted to a number. `Number("")` evaluates to `0`. The expression becomes `0 == 0`.
5. **Comparison:** `0 == 0` evaluates to `true`.

---

### 2. Predict the Output: Coercion & Operators

```js
console.log(1 + 2 + "3");
console.log("1" + 2 + 3);
console.log("10" - 1);
console.log("20" < "3");
console.log(null == undefined);
console.log(null == 0);
console.log(null >= 0);
```

**Question:** Predict the output of these statements and explain the rules governing them.

**Answer:**
1. `"33"` — Left-to-right evaluation: `1 + 2` is numeric addition (`3`), followed by `3 + "3"` which triggers string concatenation.
2. `"123"` — `"1" + 2` evaluates to string `"12"`, and `"12" + 3` evaluates to string `"123"`.
3. `9` — The `-` operator is strictly arithmetic, coercing `"10"` to the number `10`.
4. `true` — Both operands are strings, triggering lexicographical comparison. Character `"2"` (Unicode 50) has a smaller code point than `"3"` (Unicode 51).
5. `true` — By specification, `null` and `undefined` loosely equal each other and nothing else.
6. `false` — `null` does not loosely equal numeric `0` (it only loosely equals `undefined` or `null`).
7. `true` — Relational operator `>=` evaluates as `!(null < 0)`. Under `<` comparison, `null` is converted to number `0`. Since `0 < 0` is `false`, `!false` yields `true`.

---

### 3. Debugging a Security Failure in Feature Flags

```js
app.get("/premium-data", (req, res) => {
  const isPremiumUser = req.query.isPremium || false;
  if (isPremiumUser) {
    return res.json({ secret: "PRO_DATA" });
  }
  res.status(403).send("Forbidden");
});
```

**Question:** A non-paying user accesses `/premium-data?isPremium=false` and successfully receives the secret data. What caused this vulnerability, and how do you fix it?

**Answer:**
All HTTP query parameters arrive as strings. `req.query.isPremium` contains the string `"false"`.
1. In `req.query.isPremium || false`, the string `"false"` is non-empty, which makes it truthy.
2. The `||` operator returns the first truthy operand, so `isPremiumUser` is assigned `"false"`.
3. In `if (isPremiumUser)`, the string `"false"` is evaluated in a boolean context, which evaluates to `true`.

**Fix:** Never evaluate raw query strings with truthiness. Explicitly check for the string `"true"` or parse against an allowlist:
```js
const isPremiumUser = req.query.isPremium === "true";
```

---

### 4. Designing a Production Query Parameter Sanitizer for Node.js

**Question:** Write a function that safely extracts pagination parameters (`page` and `limit`) from `req.query`. It must support `limit=0`, reject non-numeric inputs, enforce maximum limits, and handle missing parameters with safe defaults.

**Answer:**
```js
// Node.js code
function sanitizePagination(query = {}) {
  // Safe default: page 1
  let page = 1;
  if (query.page !== undefined && query.page !== "") {
    const parsedPage = Number(query.page);
    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
      throw new RangeError("Page must be an integer >= 1");
    }
    page = parsedPage;
  }

  // Safe default: limit 20, allows explicit limit 0 up to 100
  let limit = 20;
  if (query.limit !== undefined && query.limit !== "") {
    const parsedLimit = Number(query.limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 0 || parsedLimit > 100) {
      throw new RangeError("Limit must be an integer between 0 and 100");
    }
    limit = parsedLimit;
  }

  return { page, limit };
}
```

---

<nav aria-label="Lecture navigation">

[← Day 03: Values, Types, and Literals](day-03-values-types-and-literals.md) | [Roadmap](../javascript-roadmap.md) | [Day 05: Control Flow and Loops →](day-05-control-flow-and-loops.md)

</nav>
