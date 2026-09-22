# Day 17: Modules and Module Interoperability

<nav aria-label="Lecture navigation">

[Previous: Symbols, Reflection, Proxies, and Metaprogramming](day-16-symbols-reflection-and-proxies.md) | [Roadmap](../javascript-roadmap.md) | [Next: Promises and Promise Composition](day-18-promises-and-composition.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain module scope and named versus default exports.
- Describe live bindings and module evaluation order.
- Recognize circular dependency problems.
- Explain dynamic `import()` and top-level `await` as language features.
- Distinguish ECMAScript module semantics from Node package resolution.
- Identify CommonJS and ESM interoperability tradeoffs.

## Prerequisites

Read [Day 02: Variables, Declarations, and Scope Foundations](day-02-variables-scope-and-hoisting.md), [Day 06: Functions, Parameters, and Callbacks](day-06-functions-parameters-and-callbacks.md), and [Day 08: Closures, Execution Context, and `this`](day-08-closures-execution-context-and-this.md).

## Core Concepts

A module is a file with its own scope and explicit imports and exports. In an ECMAScript module, top-level variables are not automatically global.

```js
// math.mjs - ECMAScript module
export const taxRate = 0.18;
export function add(left, right) {
  return left + right;
}
```

```js
// app.mjs - ECMAScript module
import { add, taxRate } from "./math.mjs";
console.log(add(2, 3), taxRate); // 5 0.18
```

A named export is imported by its exported name. A default export is one chosen value:

```js
export default function createId() {
  return "id-1";
}
```

The importing name for a default export is chosen by the importer.

## Detailed Explanations and Traces

### Imports are live bindings

An imported binding reflects the exported binding; it is not a copied snapshot.

```js
// counter.mjs
export let count = 0;
export function increment() {
  count += 1;
}
```

```js
// app.mjs
import { count, increment } from "./counter.mjs";
console.log(count); // 0
increment();
console.log(count); // 1
```

The importer cannot reassign the imported binding directly, but the exporting module can change its own binding.

### Evaluation order

Dependencies are loaded and evaluated before the dependent module can finish evaluation. Side effects at module top level therefore matter.

```js
// config.mjs
console.log("config first");
export const mode = "test";

// app.mjs
import { mode } from "./config.mjs";
console.log("app", mode);
```

Expected output:

```text
config first
app test
```

The exact loading and resolution process is host-connected, but the module dependency and evaluation model is part of ECMAScript modules.

### Cyclic dependencies

Cycles are allowed, but a module may read an imported binding before the exporting module has initialized it.

```js
// a.mjs
import { valueB } from "./b.mjs";
export const valueA = `A sees ${valueB}`;

// b.mjs
import { valueA } from "./a.mjs";
export const valueB = `B sees ${valueA}`;
```

This can produce a temporal-dead-zone error during evaluation. Avoid cycles by moving shared constants or behavior into a third module and keeping dependency direction clear.

### Dynamic import

`import()` returns a promise and loads a module when the expression runs.

```js
async function loadFormatter() {
  const module = await import("./formatter.mjs");
  return module.format;
}
```

This is useful for optional features and lazy loading. It is asynchronous even when the module is already available.

### Top-level `await`

In supported ECMAScript module environments, a module can use `await` at top level. Dependent module evaluation waits for it.

```js
// settings.mjs
export const settings = await Promise.resolve({ mode: "test" });
```

Top-level await can make startup order and failure behavior less obvious. Use it only when module initialization genuinely depends on asynchronous work.

### CommonJS and ESM concepts

CommonJS commonly uses `require()` and `module.exports`; ESM uses `import` and `export`. Node supports both through runtime configuration and file/package conventions. Resolution rules, package fields, file extensions, and interop details are Node behavior, not pure ECMAScript semantics.

Do not assume that every CommonJS value has a perfect named-export mapping in ESM or that every ESM module can be synchronously loaded with `require`. Check the supported Node version and project configuration.

## Examples and Traces

### Keep module boundaries testable

```js
// pricing.mjs
export function calculateTotal(price, taxRate) {
  return price + price * taxRate;
}
```

The pure function can be tested without loading a database or reading process state. A module should expose clear inputs and outputs instead of hiding all work in top-level side effects.

## Node.js Connection

Node selects and connects CommonJS or ESM modules through host configuration; package resolution remains in the Node curriculum.

---

## Compare & Recall

| Concept A | Concept B | Key difference |
|---|---|---|
| ESM `import` | CommonJS `require` | `import` is static (resolved at parse time, live bindings). `require` is dynamic (resolved at call time, returns a copied snapshot). ESM is the standard; CommonJS is Node's legacy system. |
| Named export | Default export | Named: `export { x }` — imported as `import { x } from`. Default: `export default y` — imported as `import y from`. A module can have both, but only one default. |
| Live binding | Copied value | ESM `import` observes the **exporter's current value**. CommonJS `require` gets a snapshot at call time. If the exporter reassigns, ESM importers see it; CJS importers do not. |
| Static import | Dynamic `import()` | Static: top-level, analyzed at parse time, no conditions. Dynamic: `import('path')` returns a Promise, can be inside `if` blocks, lazy-loaded. |
| Module scope | Global scope | Variables declared at module top level are **not global**. They are scoped to that module. Two modules can have a variable `count` without conflict. |
| Top-level `await` | Async wrapper | Top-level `await` pauses the module evaluation itself (blocks dependents). An async wrapper function doesn't block evaluation, but the top-level export may not be ready. |

> **Cross-day links:** Promises (the return type of `import()`) are in [Day 18](day-18-promises-and-composition.md). `async`/`await` syntax is in [Day 19](day-19-async-await-errors-and-cleanup.md). Module loading in Node.js (CJS vs. ESM configuration) is in the Node curriculum.

## Common Mistakes and Interview Traps

- Treating imported bindings as ordinary reassignable local variables.
- Assuming a default export and a named export are interchangeable.
- Ignoring top-level side effects and evaluation order.
- Creating a cycle through a convenience import.
- Confusing `import()` with a synchronous function call.
- Explaining Node package resolution as if it were an ECMAScript guarantee.
- Assuming CommonJS and ESM interoperate identically in every Node version.

## Tricky Points

- A cycle can be syntactically valid but fail during initialization.
- Top-level await delays dependents and can reject module evaluation.
- Module scope is separate even when two modules export the same variable name.
- Dynamic import returns a module namespace object, not the default export directly.

## Practical Exercise

**Goal:** Split a small pricing service into modules.

**Inputs and outputs:** Create modules for validation, pricing, and formatting; expose named functions and one default formatter.

**Constraints:** Keep imports one-directional and avoid top-level side effects except constants.

**Edge cases:** A missing export, a circular import introduced deliberately, a rejected dynamic import, and a changed live binding.

**Acceptance criteria:** Trace evaluation order, explain the cycle failure, and remove the cycle by extracting shared code.

## Summary

- Modules have their own scope and explicit dependency boundaries.
- Named and default exports have different import rules.
- Imports are live bindings, not simple copied values.
- Dependencies evaluate before dependents, so top-level side effects matter.
- Cycles can expose uninitialized bindings.
- Dynamic import is asynchronous, and top-level await can delay dependents.
- CommonJS and ESM semantics must be separated from Node resolution rules.

## Cheat Sheet

| Concept | Rule |
|---|---|
| Named export | Import by exported name |
| Default export | One chosen module value |
| Module scope | Top-level names are module-local |
| Live binding | Import observes exporter changes |
| `import()` | Returns a promise for a module namespace |
| Top-level `await` | Delays module evaluation |
| Cycle | May expose uninitialized bindings |
| CommonJS | Node module system with `require`/`module.exports` |

**vs. quick reference**

| | ESM `import` | CommonJS `require` |
|---|---|---|
| Resolved at | Parse time (static) | Call time (dynamic) |
| Binding type | Live binding | Copied snapshot |
| Synchronous? | ✗ (parse-time analysis) | ✓ (blocks until loaded) |
| Supports top-level await | ✓ | ✗ |
| Default export syntax | `export default x` | `module.exports = x` |

| Export type | Syntax | Import syntax |
|---|---|---|
| Named | `export const x = 1` | `import { x } from '...'` |
| Default | `export default y` | `import y from '...'` |
| Both | Both above | `import y, { x } from '...'` |
| Dynamic | `export { z }` | `const m = await import('...')` |

## Interview Questions

> Difficulty guide: **[Beginner]** = entry-level, **[Mid]** = requires understanding of internals, **[Senior]** = design and tradeoff thinking expected.

1. **[Mid] Definition:** Explain live bindings with a counter module.
   - Expected answer: The exporter owns the binding; importers observe its current value but cannot reassign it.
   - Follow-up: How does this differ from copying an object value?

2. **[Mid] Trace:** Two modules import each other and read exported `const` values during initialization. Explain the likely failure.
   - Expected answer: Evaluation follows the dependency graph, and a binding can be accessed before initialization, causing a TDZ error.
   - Follow-up: How would you remove the cycle?

3. **[Senior] Implementation:** Design module boundaries for a service with validation, database access, and formatting.
   - Expected answer: Show dependency direction, pure boundaries, side-effect ownership, test seams, and error flow.
   - Follow-up: Where should configuration be loaded?

4. **[Mid] Debugging:** An ESM module works in development but fails when loaded through CommonJS. Diagnose without assuming a universal interop rule.
   - Expected answer: Check Node version, package configuration, file type, sync/async loading, and export shape.
   - Follow-up: What compatibility contract should the package document?

5. **[Senior] Design:** Review a module graph with several cycles and top-level network calls.
   - Expected answer: Discuss initialization order, failure recovery, testability, startup latency, dependency inversion, and migration.
   - Follow-up: How would you observe startup failures in production?

