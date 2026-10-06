# Day 1: JavaScript Foundations

Quick review of main-course lectures 1–4. Topic labels are numbered for quick scanning; each definition and example is on its own line. Follow the linked full lecture when you need detail.

## Language and syntax

**1. Runtime layers**

**1.1 ECMAScript**

Defines JavaScript syntax and behavior.

**1.2 Engine**

Parses and executes JavaScript, for example V8.

**1.3 Host**

Supplies environment APIs, such as Node.js `node:fs` or browser `document`.

```js
Promise.resolve(1); // JavaScript language API
// import fs from "node:fs"; // Node.js host API
```

**2. Source grammar**

**2.1 Identifiers**

Names identify bindings; JavaScript is case-sensitive, so `userId` differs from `userid`.

**2.2 Keywords and reserved words**

Grammar-control words such as `return` are not ordinary variable names.

**2.3 Lexical tokens**

Identifiers, literals, punctuators, whitespace, line breaks, and comments form the source tokens.

**2.4 Unicode**

Identifiers can contain Unicode; visually similar symbols may be different characters. Prefer clear, consistent names.

**3. Expressions and statements**

An expression produces a value; a statement performs an instruction.

```js
2 + 3;                    // expression: evaluates to 5
const total = 2 + 3;       // declaration statement containing an expression
```

**4. Declarations, blocks, and literals**

A declaration introduces a binding; a block groups statements. Literals directly represent values.

```js
const object = {};          // object literal
if (true) { run(); }       // block statement
const message = "ready";   // string literal
```

**5. Scripts and modules**

Scripts and modules are different parse goals. Modules support `import`/`export`, have module scope, and are strict by default; file loading is host-specific.

```js
export const mode = "module"; // valid in a module, not a classic script
```

**6. Strict mode**

Strict mode rejects some silent mistakes; modules enable it automatically.

```js
"use strict";
// accidentalGlobal = 1; // ReferenceError: undeclared assignment
```

**7. Automatic semicolon insertion (ASI)**

ASI inserts semicolons only in defined situations. A line break after `return` changes the result.

```js
function wrong() {
  return
  5; // returns undefined
}
function right() {
  return 5;
}
```

**8. Error categories**

Syntax/early errors prevent parsing; runtime errors occur during execution; incorrect output can happen without an error.

```js
// const = 1;          // syntax error: cannot parse
JSON.parse("{");       // runtime SyntaxError when executed
```

**Full lecture:** [Execution model and grammar](../../Javascript/javascript-lectures/day-01-execution-model-and-syntax.md)

## Variables and scope

**1. Binding lifecycle**

Declaration creates a name; initialization gives it its first value; assignment and reassignment write values later.

```js
let status;              // declared and initialized to undefined
status = "ready";        // assigned
status = "done";         // reassigned
```

**2. Declaration keywords**

**2.1 `let`**

Block-scoped and reassignable; choose it when the binding must change.

**2.2 `const`**

Block-scoped and cannot be rebound; the referenced object can still mutate.

**2.3 `var`**

Function-scoped, redeclarable, and initialized to `undefined`; it is not contained by an `if` block.

```js
let retries = 0;
retries++;                    // allowed

const user = {};
user.name = "Mina";           // allowed: object mutation
// user = {};                 // TypeError: cannot rebind const

if (true) { var leaked = 1; }
console.log(leaked);          // 1: var escaped the block
```

**3. Scope types**

**3.1 Global scope**

A binding in the global environment is visible through that environment; top-level behavior differs between scripts, modules, and hosts.

**3.2 Function scope**

A name declared inside a function is available within that function; `var` follows this boundary.

**3.3 Block scope**

`let` and `const` are limited to the nearest `{...}` block.

**3.4 Module scope**

A module's top-level bindings stay in that module; ESM `secret` does not create `globalThis.secret`.

```js
const moduleSetting = "module scope";
globalThis.sharedName = "explicit global";
function checkScopes() {
  var functionValue = 1;
  if (true) {
    let blockValue = 2;
    console.log(moduleSetting, functionValue, blockValue, globalThis.sharedName);
  }
  console.log(functionValue); // still visible: function scope
  // console.log(blockValue); // ReferenceError: block scope ended
}
// console.log(functionValue); // ReferenceError: function scope ended
console.log(globalThis.sharedName); // explicit global property
```

The example runs inside a module: `moduleSetting` is visible in the function but is not global; only the explicit `globalThis` assignment creates a global property.

**4. Scope chain and shadowing**

Lookup moves from the current lexical scope outward. A same-named inner binding shadows the outer one.

```js
const role = "user";
{ const role = "admin"; console.log(role); } // admin
console.log(role);                           // user
```

**5. Hoisting and temporal dead zone (TDZ)**

`var` is readable as `undefined` before its line; `let`/`const` exist but cannot be read before initialization, which throws `ReferenceError`.

```js
console.log(oldValue); // undefined
var oldValue = 1;

// console.log(newValue); // ReferenceError: TDZ
let newValue = 1;
```

**6. Function declaration versus expression**

Function declarations are initialized before their source line; a function expression stored in a lexical binding is not.

```js
run();
function run() {} // works

// start();
// const start = () => {}; // cannot call before initialization
```

**7. Node module boundary**

CommonJS wraps each file and ESM has module scope. Use `globalThis` only when process-wide shared state is deliberate.

**Full lecture:** [Variables, scope, and hoisting](../../Javascript/javascript-lectures/day-02-variables-scope-and-hoisting.md)

## Values and types

**1. Primitive types**

**1.1 `undefined`**

Default absence for an uninitialized binding or missing property; `({}).x` is `undefined`.

**1.2 `null`**

Explicitly represents no object value; test with `value === null`.

**1.3 `boolean`**

Logical `true` or `false`; `Boolean(0)` is `false`.

**1.4 `number`**

IEEE-754 numeric values, including fractions, `NaN`, and infinities.

**1.5 `bigint`**

Arbitrary-size integer written with `n`, for example `9007199254740993n`.

**1.6 `string`**

Immutable UTF-16 code-unit sequence; string methods return new strings.

**1.7 `symbol`**

Unique primitive, often used as a non-colliding property key.

```js
"cat".toUpperCase();             // returns "CAT"; original remains "cat"
Symbol("id") === Symbol("id");   // false: each Symbol() is unique
```

**2. Primitive assignment**

Assigning a primitive copies its value; changing one binding does not change the other.

```js
let first = 3;
const second = first;
first = 4;
console.log(second); // 3
```

**3. Objects and identity**

Object assignment copies a reference, so both variables reach the same mutable object.

```js
const original = { count: 0 };
const alias = original;
alias.count++;
console.log(original.count); // 1
```

**4. Literals**

Numeric, string, boolean, `null`, array, object, and regexp literal syntax creates values. Each object/array literal evaluation has a fresh identity.

```js
{} === {}; // false: two different objects
```

**5. Type inspection**

**5.1 `typeof`**

Returns broad type labels; historical exception: `typeof null` is `"object"`.

**5.2 `Array.isArray`**

Identifies arrays directly; `Array.isArray([])` is `true`.

**5.3 `instanceof`**

Checks prototype relationships and can fail for objects created in another realm.

**5.4 Schema validation**

A type label does not prove fields or field types; validate external data such as `{ id: "x" }`.

**6. Number range and precision**

Safe integers end at `Number.MAX_SAFE_INTEGER`; decimal fractions may round.

```js
0.1 + 0.2 === 0.3; // false
```

**7. `BigInt`**

`BigInt` represents large integers exactly, but cannot mix directly with `number`; JSON needs an explicit conversion policy.

```js
1n + 1n; // 2n
// 1n + 1; // TypeError
```

**8. `NaN`, infinities, and signed zero**

`NaN` is unequal to itself; infinities represent unbounded results; `+0` and `-0` compare equal with `===` but differ under `Object.is`.

```js
Number.isNaN(NaN);       // true
Object.is(+0, -0);       // false
```

**9. Backend data and serialization**

Preserve 64-bit database IDs without lossy `number` conversion; JSON does not serialize every JavaScript value directly (`JSON.stringify(1n)` throws).

**Full lecture:** [Values, types, and literals](../../Javascript/javascript-lectures/day-03-values-types-and-literals.md)

## Conversion and operators

**1. Explicit conversion**

`Number`, `String`, and `Boolean` make conversion intentional; validate converted external data.

```js
Number("12");     // 12
Number("12px");   // NaN
```

**2. Numeric parsing**

`Number` requires a fully numeric string; `parseInt` reads the initial integer portion.

```js
Number("12px");       // NaN
parseInt("12px", 10);  // 12
```

**3. Truthiness and nullish values**

Falsy values are `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, and `NaN`; nullish means only `null` or `undefined`.

```js
Boolean([]); // true
Boolean(""); // false
```

**4. `+` and primitive conversion**

Addition converts objects to primitives; it concatenates if a string results, otherwise adds numerically.

```js
2 + 3;       // 5
"2" + 3;     // "23"
```

**5. Other arithmetic operators**

`-`, `*`, `/`, and `%` coerce operands toward numbers.

```js
"6" - 2; // 4
```

**6. Logical OR `||`**

Returns the first truthy operand; often used for a fallback, but replaces valid falsy values.

```js
0 || 5; // 5: zero is replaced
```

**7. Logical AND `&&`**

Returns the first falsy operand or the last operand; commonly guards an expression.

```js
ready && start(); // start runs only when ready is truthy
```

**8. Nullish coalescing `??`**

Uses the fallback only for `null` or `undefined`, preserving `0`, `false`, and `""`.

```js
0 ?? 5; // 0
```

**9. Optional chaining `?.`**

Stops property/call access when the receiver is nullish; it does not validate the result's type or shape.

```js
user?.name; // undefined if user is nullish
```

**10. Ternary and short-circuit evaluation**

The ternary selects one of two expressions; logical operators skip evaluating the unused side.

```js
ready ? "yes" : "no";
```

**11. Equality operators**

**11.1 `===`:** Compares without ordinary type conversion; `0 === false` is `false`.

**11.2 `==`:** Applies conversion rules; `0 == false` and `null == undefined` are `true`.

**11.3 `Object.is`:** Treats `NaN` as equal to itself and distinguishes signed zero.

```js
NaN === NaN;                  // false
Object.is(NaN, NaN);          // true
Object.is(+0, -0);            // false
```

**12. Relational comparison**

Two strings compare lexicographically, not numerically; validate and convert numeric text first.

```js
"20" < "3"; // true as text
```

**13. Backend input**

Query parameters and environment variables arrive as strings; parse and validate before numeric, authorization, or configuration decisions.

**Full lecture:** [Coercion, truthiness, equality, and operators](../../Javascript/javascript-lectures/day-04-coercion-equality-and-operators.md)

## Tricky points

1. **Language and parsing**
  **1.1 Host versus language**

  `node:fs` and file-loading rules are Node behavior, not ECMAScript guarantees.

  **1.2 ASI**

  A newline after `return` ends the return statement; continuation tokens such as `(` or `[` can also change parsing.
2. **Variables and scope**
  **2.1 `let`/`const`**

  They are unavailable before initialization; access in the TDZ throws rather than yielding `undefined`.

  **2.2 `const`**

  Prevents rebinding, not nested mutation; `Object.freeze` is shallow too.

  **2.3 `var`**

  Ignores block scope and can leak state beyond an `if` or loop block.

  **2.4 Scope types**

  Global is global-environment visibility; function is inside a function; block is inside `{...}` for lexical declarations; module is file-local.
3. **Values and types**
  **3.1 References**

  `const copy = original` aliases the object; spread copies only the outer layer.

  **3.2 Type checks**

  `typeof null === "object"`; `instanceof` may fail across realms; validate the expected data shape too.

  **3.3 Numbers**

  `NaN !== NaN`; use `Number.isNaN`. Binary floating point is unsuitable for exact money without a deliberate representation.

  **3.4 BigInt**

  Do not mix it with `number`; `JSON.stringify(1n)` throws unless converted.
4. **Conversion and operators**
  **4.1 Falsy versus nullish**

  Empty arrays/objects are truthy; `0` is falsy but not nullish.

  **4.2 Loose equality**

  `0 == false` and `null == undefined` are true; prefer `===` unless coercion is intentional.

  **4.3 String comparisons**

  Numeric-looking strings still compare lexicographically against strings.

  **4.4 Defaults**

  `||` overwrites valid `0`/`false`/`""`; `??` preserves them.

  **4.5 Untrusted input**

  Coercion is not validation; reject malformed values before queries or business rules.
