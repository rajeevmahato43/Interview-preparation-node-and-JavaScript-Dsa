# Day 03: Values, Types, and Literals

<nav aria-label="Lecture navigation">

[Previous: Variables, Declarations, and Scope Foundations](day-02-variables-scope-and-hoisting.md) | [Roadmap](../javascript-roadmap.md) | [Next: Coercion, Equality, and Operators](day-04-coercion-equality-and-operators.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain the difference between a value, a type, a variable binding, and an object identity.
- Name JavaScript's primitive types and explain how object values differ from primitives.
- Use `typeof`, `Array.isArray`, and `instanceof` with the right expectations.
- Explain why `typeof null` is a historical surprise and why it should not be used alone for validation.
- Compare values by value or by identity, depending on their type.
- Explain the important limits of JavaScript numbers and the purpose of `bigint`.
- Choose a sensible representation for data crossing a Node.js service boundary.

## Prerequisites

Read [Day 01: JavaScript Execution Model and Grammar](day-01-execution-model-and-syntax.md) and [Day 02: Variables, Declarations, and Scope Foundations](day-02-variables-scope-and-hoisting.md) first. Day 1 introduced literals and syntax. Day 2 introduced bindings and scope. This lecture explains the values stored in those bindings.

Day 4 uses these types to explain conversion and equality. Day 9 later returns to object properties and prototypes in more depth.

## Core Concepts

### 1. A value is data; a binding is a name

A value is a piece of data such as `42`, `"ready"`, or an object. A variable is a binding that gives a name to a value.

```js
const firstScore = 80;
let secondScore = firstScore;

secondScore = 90;

console.log(firstScore);  // 80
console.log(secondScore); // 90
```

For the number `80`, assigning to another binding copies the value. Changing `secondScore` does not change `firstScore`.

Objects work differently because the value is an object identity. The binding stores a reference-like connection to that object:

```js
const firstUser = { name: "Asha" };
const secondUser = firstUser;

secondUser.name = "Mina";

console.log(firstUser.name);  // "Mina"
console.log(secondUser.name); // "Mina"
console.log(firstUser === secondUser); // true
```

The two bindings point to the same object. This is not because `const` copies or shares objects in a special way. It is because object identity is preserved when the value is assigned.

### 2. JavaScript has primitive and object values

JavaScript values are commonly divided into two groups:

- **Primitive values** are single, immutable values.
- **Objects** are collections of properties and have identity.

The primitive types are:

| Type | Examples | Important idea |
| --- | --- | --- |
| `undefined` | `undefined` | A value often used for a missing result or uninitialized `let` binding |
| `null` | `null` | An intentional empty value; the program chose "no object" |
| `boolean` | `true`, `false` | A logical value |
| `number` | `0`, `3.14`, `NaN`, `Infinity` | IEEE 754 double-precision numbers |
| `bigint` | `123n` | Integers larger than safe `number` precision can represent |
| `string` | `"hello"` | Immutable text |
| `symbol` | `Symbol("id")` | A unique symbol value, often used as a property key |

Everything else that is not a primitive is an object. Functions are objects too, even though `typeof` reports them as `"function"` for convenience.

```js
const values = [
  undefined,
  null,
  true,
  42,
  123n,
  "hello",
  Symbol("id"),
  { ready: true },
  [1, 2],
  function greet() {},
];

for (const value of values) {
  console.log(typeof value);
}
```

A typical output is:

```text
undefined
object
boolean
number
bigint
string
symbol
object
object
function
```

The result for `null` is `"object"`. This is a long-standing language behavior, not a useful description of `null`.

### 3. Primitive values are immutable

Immutable means the value itself cannot be changed. A new value can be created, and a variable can be rebound, but the old primitive does not change internally.

```js
let message = "cat";
message.toUpperCase();

console.log(message); // "cat"

message = "CAT";
console.log(message); // "CAT"
```

`toUpperCase()` returns a new string. It does not edit the original string in place.

The same idea applies to numbers and booleans. There is no operation that changes the internal number value `10` into `11`; an assignment changes the binding to a different number.

Objects are mutable by default:

```js
const account = { balance: 100 };
account.balance += 25;

console.log(account.balance); // 125
```

`const` protects the binding from being replaced. It does not deeply freeze the object. A later lecture covers shallow immutability and defensive copying.

### 4. Literals create values

A literal is source code that directly describes a value:

```js
const count = 12;              // number literal
const title = "JavaScript";    // string literal
const enabled = true;          // boolean literal
const empty = null;            // null literal
const largeId = 9_007_199_254_740_991n; // bigint literal
const items = ["a", "b"];      // array literal
const user = { name: "Ravi" }; // object literal
const pattern = /ready/i;      // regular-expression literal
```

The literal is not the same thing as the resulting value. For example, two separate object literals create two separate object identities:

```js
const left = {};
const right = {};

console.log(left === right); // false
```

Two primitive literals with the same value compare as equal under strict equality:

```js
console.log(10 === 10);       // true
console.log("ok" === "ok"); // true
```

### 5. `typeof` is useful but limited

`typeof` returns a string describing a broad category of a value:

```js
console.log(typeof 10);        // "number"
console.log(typeof "10");      // "string"
console.log(typeof false);      // "boolean"
console.log(typeof undefined); // "undefined"
console.log(typeof 10n);        // "bigint"
console.log(typeof Symbol());   // "symbol"
console.log(typeof {});         // "object"
console.log(typeof null);       // "object"
console.log(typeof (() => {})); // "function"
```

Use it as a first question, not as a complete validation system. It cannot distinguish arrays from ordinary objects, and it cannot distinguish `null` from other objects.

```js
function describe(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

console.log(describe(null));       // "null"
console.log(describe([1, 2]));     // "array"
console.log(describe({}));         // "object"
console.log(describe("ready"));   // "string"
```

For an object created by a particular constructor, `instanceof` checks whether that constructor's prototype appears in the object's prototype chain:

```js
const createdAt = new Date();

console.log(createdAt instanceof Date);   // true
console.log([] instanceof Array);          // true
console.log({} instanceof Array);          // false
```

`instanceof` depends on the prototype chain and can be affected by multiple realms or custom prototype changes. It is not a universal â€œwhat exact type is this?â€ operator.

### 6. Numbers have a safe integer boundary

JavaScript's ordinary `number` type uses double-precision floating-point representation. It can represent many values, but not every integer exactly.

```js
console.log(Number.MAX_SAFE_INTEGER); // 9007199254740991
console.log(Number.MAX_SAFE_INTEGER + 1 === Number.MAX_SAFE_INTEGER + 2); // true
```

The second result can surprise people: two different mathematical integers are rounded to the same representable `number`.

Use `Number.isSafeInteger` when exact integer identity matters:

```js
console.log(Number.isSafeInteger(42)); // true
console.log(Number.isSafeInteger(Number.MAX_SAFE_INTEGER + 1)); // false
```

`bigint` represents integers with arbitrary precision within practical memory limits:

```js
const first = 9_007_199_254_740_992n;
const second = first + 1n;

console.log(second); // 9007199254740993n
```

Do not mix `number` and `bigint` in arithmetic without an explicit conversion:

```js
// console.log(1n + 1); // TypeError
console.log(1n + BigInt(1)); // 2n
```

Converting a large `bigint` to `number` can lose precision. Converting a non-integer number to `bigint` throws.

### 7. `NaN`, `Infinity`, and signed zero

`NaN` means "not a number result." Despite its name, it has the `number` type:

```js
const invalid = Number("not a number");

console.log(invalid);          // NaN
console.log(typeof invalid);   // "number"
console.log(invalid === NaN);  // false
console.log(Number.isNaN(invalid)); // true
```

Use `Number.isNaN` when you want to test the actual `NaN` value without first converting other values.

`Infinity` and `-Infinity` are also numbers:

```js
console.log(1 / 0); // Infinity
console.log(-1 / 0); // -Infinity
```

JavaScript also has `-0`:

```js
console.log(0 === -0);           // true
console.log(Object.is(0, -0));   // false
console.log(1 / -0);             // -Infinity
```

Most application code does not need to distinguish the two zero values, but interview questions and numerical algorithms sometimes do.

### 8. Symbols are unique primitive values

A symbol is a unique primitive value. Two symbols with the same description are still different:

```js
const firstKey = Symbol("id");
const secondKey = Symbol("id");

console.log(firstKey === secondKey); // false
```

Symbols can be used as object property keys without colliding with normal string keys:

```js
const internalId = Symbol("internalId");
const record = {
  name: "Asha",
  [internalId]: 42,
};

console.log(record[internalId]); // 42
console.log(Object.keys(record)); // ["name"]
```

The symbol property is still present; it is simply not returned by `Object.keys`. Reflection APIs can discover symbol keys. Treat symbols as a language feature, not as a security boundary.

## Detailed Explanations and Traces

### Value equality versus object identity

Strict equality compares primitive values directly. For objects, it compares identity:

```js
const first = { count: 1 };
const second = { count: 1 };
const same = first;

console.log(first === second); // false: two objects
console.log(first === same);   // true: one object, two bindings
```

The objects have equal-looking properties, but they are not the same object. If an application needs structural equality, it must define what that means and how nested values are compared. `JSON.stringify` is not a universal structural equality function because property order, unsupported values, prototypes, and cycles complicate the result.

### A type table is not a data contract

A check such as `typeof input === "object"` accepts `null`, arrays, dates, maps, and many other objects. A service receiving external data needs a stronger contract:

```js
function isPlainRecord(value) {
  if (value === null || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

console.log(isPlainRecord({ name: "Asha" })); // true
console.log(isPlainRecord(null));              // false
console.log(isPlainRecord([]));                // false
```

This is only one possible policy. Validation should match the data contract rather than relying on a generic type label.

### Node.js application connection

In a Node.js service, values cross boundaries when a request is parsed, configuration is read, a database result is returned, or a response is serialized. At each boundary, ask:

1. What representations are allowed?
2. Are numbers exact enough for this identifier or amount?
3. Is `null` different from a missing value?
4. Is the value safe to mutate, or should it be copied?
5. Will serialization preserve the value?

For example, JSON does not represent `bigint` directly:

```js
const payload = { id: 123n };

// JSON.stringify(payload); // TypeError: BigInt value cannot be serialized
```

A service must choose a policy, such as sending a string ID, converting only values known to be safe, or using a serializer that explicitly supports the chosen representation.

## Node.js Connection

Node service boundaries must validate values before storing, mutating, or serializing them.

## Common Mistakes and Interview Traps

- Saying that `const` makes an object immutable. It only prevents rebinding the variable.
- Treating `typeof null === "object"` as a useful object validation result.
- Using `instanceof` as if it were a complete type system.
- Assuming every integer is exact as a `number`.
- Mixing `number` and `bigint` in arithmetic.
- Comparing two separately created objects with `===` and expecting property-based equality.
- Treating `NaN` as equal to itself. Use `Number.isNaN` or understand `Object.is`.
- Assuming a symbol's hidden appearance in `Object.keys` makes it private or secure.
- Forgetting that arrays, dates, maps, and functions are objects with different behavior.

## Tricky Points

1. `typeof null` is `"object"` for historical compatibility. Always check `value === null` before a broad object check.
2. `NaN` is the only JavaScript value that is not equal to itself under `===`.
3. `Object.is` differs from `===` for `NaN` and signed zero: `Object.is(NaN, NaN)` is true, while `Object.is(0, -0)` is false.
4. `BigInt` is exact for integers but cannot be mixed implicitly with `number` and is not accepted by standard JSON serialization.
5. `instanceof` follows prototypes, so it can give unexpected results when values come from another realm or when prototypes are changed.

## Practical Exercise

**Goal:** Build a small type-inspection report.

**Input:** Create an array containing `undefined`, `null`, booleans, safe and unsafe integers, `NaN`, a string, a symbol, an array, a date, a plain object, and a function.

**Task:** For every value, report its `typeof` result, whether it is an array, whether it is `null`, and whether it is a safe integer when that question applies.

**Edge cases:** Include `-0`, `Number.MAX_SAFE_INTEGER + 1`, and two separate objects with the same properties.

**Acceptance criteria:** The report must not label `null` as a normal object, must not claim all numbers are safe integers, and must explain why the two equal-looking objects are not strictly equal. Do not use `JSON.stringify` on a value that may be a `bigint` without choosing a conversion policy.

## Summary

- JavaScript values are primitive or object values.
- A binding names a value; assigning an object preserves its identity.
- Primitive values are immutable. Objects are mutable unless code applies a separate protection strategy.
- `typeof` is useful for broad categories but has known limits, especially for `null` and arrays.
- `number` cannot represent every large integer exactly. `bigint` handles large integers but has separate arithmetic and serialization rules.
- `NaN`, `Infinity`, and `-0` are special `number` values worth recognizing.
- Strict equality compares primitive values by value and objects by identity.
- Node services should define value and serialization contracts at boundaries.

## Cheat Sheet

| Need | Useful rule |
| --- | --- |
| Detect `null` | `value === null` |
| Detect an array | `Array.isArray(value)` |
| Detect actual `NaN` | `Number.isNaN(value)` |
| Check safe integer | `Number.isSafeInteger(value)` |
| Compare `0` and `-0` distinctly | `Object.is(left, right)` |
| Compare two object references | `left === right` checks identity, not contents |
| Keep large integers exact | Use `bigint`, then handle conversion and serialization explicitly |
| Remember `const` | It prevents rebinding, not nested mutation |
| Broad type check | `typeof value`, followed by domain-specific checks |

## Interview Questions

1. **Mental model:** Explain the difference between a primitive value, an object identity, a binding, and a shallow copy. Use a nested object to show which changes are shared.
   - **Expected answer shape:** Define each term, trace assignments, and identify the exact alias that causes shared mutation.
   - **Follow-up:** How would you design a copy policy for request data containing dates, maps, and nested arrays?

2. **Predict the output:** What do these expressions return, and why: `typeof null`, `NaN === NaN`, `Object.is(NaN, NaN)`, `0 === -0`, and `Object.is(0, -0)`?
   - **Expected answer shape:** Give the result of each expression and distinguish historical behavior from deliberate equality semantics.
   - **Follow-up:** Which comparison would you use for a cache key and why?

3. **Implementation:** Design a validator for an API field that accepts either a safe integer or a decimal string representing an integer larger than the safe-number range.
   - **Expected answer shape:** State the accepted grammar, validation order, representation after validation, and rejected inputs.
   - **Follow-up:** Explain how you would serialize the normalized result in JSON.

4. **Failure analysis:** A production service compares two IDs after parsing them with `Number`, and distinct large database IDs occasionally match. Diagnose the failure.
   - **Expected answer shape:** Explain precision loss, identify the safe-integer boundary, and propose a representation that preserves identity.
   - **Follow-up:** What tests would catch this before deployment?

5. **Design:** A Node.js service accepts user-provided JSON and passes it through several modules. Decide where type validation, copying, and serialization rules should live.
   - **Expected answer shape:** Describe boundary ownership, mutation policy, error behavior, and how to keep internal assumptions explicit.
   - **Follow-up:** How would your design change if performance pressure made deep copying too expensive?

