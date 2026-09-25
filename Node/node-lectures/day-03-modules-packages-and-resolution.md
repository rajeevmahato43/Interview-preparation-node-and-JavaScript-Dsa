# Day 03: Modules, Packages, and Resolution

<nav aria-label="Lecture navigation">

[Previous: Event Loop and Scheduling](day-02-event-loop-and-scheduling.md) | [Roadmap](../node-roadmap.md) | [Next: Process, Configuration, and Lifecycle](day-04-process-configuration-and-lifecycle.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain why modules are useful in a Node.js application.
- Compare CommonJS and ECMAScript modules (ESM).
- Describe the role of `package.json`, `type`, `exports`, and `imports`.
- Recognize common resolution, caching, interop, and circular-dependency problems.
- Choose a module boundary that keeps dependencies understandable.

## Prerequisites

Read [JavaScript Day 17: Modules and Module Interoperability](../../Javascript/javascript-lectures/day-17-modules-and-interoperability.md) and [Day 01: Node.js Runtime and Architecture](day-01-node-runtime-and-architecture.md).

JavaScript defines the module concepts. Node.js decides how files are discovered and how CommonJS and ESM are loaded. Node behavior can depend on the Node.js version and the nearest `package.json` configuration.

## Core Concepts

### 1. A module is a boundary

A module is a file or package that owns some code and exposes a deliberate interface. A good module hides implementation details and makes dependencies visible.

```text
route module -> service module -> repository module
```

The arrow means the first module depends on the second. A dependency should point toward a clear owner rather than forming a hidden global connection.

### 2. CommonJS

CommonJS commonly uses `require()` and `module.exports`:

```js
// math.cjs
function add(firstNumber, secondNumber) {
  return firstNumber + secondNumber;
}

module.exports = { add };
```

```js
// app.cjs
const { add } = require("./math.cjs");
console.log(add(2, 3)); // 5
```

`require()` is synchronous from the caller's point of view. Node loads and evaluates the dependency, then returns its exported value. CommonJS modules are cached after loading in a process.

### 3. ESM

ESM uses `export` and `import`:

```js
// math.mjs
export function add(firstNumber, secondNumber) {
  return firstNumber + secondNumber;
}
```

```js
// app.mjs
import { add } from "./math.mjs";

console.log(add(2, 3)); // 5
```

ESM has static import syntax, live bindings, and an asynchronous-capable loading model. Use file extensions or package configuration consistently with the selected module mode.

### 4. `package.json` controls important behavior

A package file can describe metadata, scripts, dependencies, and module behavior. The `type` field affects how `.js` files are interpreted within that package boundary:

```json
{
  "type": "module"
}
```

With `type: module`, `.js` files are treated as ESM by default. Without that setting, `.js` files are commonly treated as CommonJS unless another configuration or extension changes the result. `.mjs` and `.cjs` make the intent explicit.

Do not copy a module example without checking the package configuration around it.

### 5. Package resolution

When code imports `./local-file`, a package name, or a built-in such as `node:fs`, Node follows different resolution rules. Package fields such as `exports` can define which paths are public:

```json
{
  "name": "example-package",
  "exports": {
    ".": "./src/index.js",
    "./client": "./src/client.js"
  }
}
```

Consumers should use the documented public paths. `exports` can prevent accidental imports of internal files.

### 6. Dynamic import

`import()` loads a module dynamically and returns a promise. It is useful when a feature is optional, expensive, or selected from configuration. The promise can reject for resolution or evaluation errors, so the caller needs an error policy.

### 7. Resolution is a dependency-graph operation

Node does not search every file in the project randomly. The spelling of the specifier selects a resolution family:

| Specifier | Meaning |
|---|---|
| `node:fs` | A Node built-in module |
| `./logger.js` | A relative file or directory under the importing module |
| `../config.js` | A relative path from the importing module's directory |
| `some-package` | A package found through package lookup rules |
| `some-package/client` | A package subpath controlled by `exports` when present |
| `#internal` | A package-private alias declared by `imports` |

The importing file's location and the nearest package configuration matter. A package dependency is not resolved relative to the process working directory in the way many beginners assume. This is why a command can work from one project directory and fail after a package is moved or published.

When debugging a resolution failure, record the exact specifier, importing file, module mode, Node version, package boundary, and installed dependency tree. "The file exists" is not enough: the resolver may intentionally hide it behind `exports`.

### 8. `exports` is an API firewall

Without an explicit public boundary, consumers may reach into paths that were never intended to be stable. An `exports` map makes the supported surface explicit:

```json
{
  "name": "billing-client",
  "type": "module",
  "exports": {
    ".": "./src/index.js",
    "./testing": "./src/testing.js"
  }
}
```

With this map, `billing-client` and `billing-client/testing` are public entry points. A consumer importing `billing-client/src/internal.js` should fail even if that file exists. This protects refactoring freedom and prevents accidental dependency on internals.

The `imports` field provides private aliases beginning with `#` for files inside the same package. It is useful for avoiding fragile relative paths, but it is not a mechanism for exposing an alias to external consumers.

### 9. Loading, evaluation, and caching are separate questions

When a module is used, ask three separate questions:

1. **Resolution:** Which file or package entry point does the specifier identify?
2. **Evaluation:** What top-level code runs, and can it throw or start side effects?
3. **Reuse:** What value or namespace does a later import receive in this process?

CommonJS exposes a cached export value after its first evaluation. ESM also avoids evaluating the same resolved module repeatedly, but its module record exposes bindings and participates in the ESM linking/evaluation process. Do not reduce the difference to "one is cached and the other is not."

For testability, keep module evaluation cheap: export factories, avoid opening servers during import, and pass external clients into functions. Import-time side effects make test order, startup failures, and shutdown ownership harder to reason about.

## Detailed Explanations and Traces

### CommonJS caching

This is a **Node.js CommonJS example**:

```js
// counter.cjs
let count = 0;

module.exports = function nextCount() {
  count += 1;
  return count;
};
```

```js
// app.cjs
const firstReference = require("./counter.cjs");
const secondReference = require("./counter.cjs");

console.log(firstReference()); // 1
console.log(secondReference()); // 2
console.log(firstReference === secondReference); // true
```

Both calls receive the same cached module export in this process. This can be useful for shared configuration or a client factory, but hidden mutable module state can make tests order-dependent.

### ESM live bindings

This is an **ESM example**:

```js
// state.mjs
export let status = "starting";

export function markReady() {
  status = "ready";
}
```

```js
// app.mjs
import { markReady, status } from "./state.mjs";

console.log(status); // starting
markReady();
console.log(status); // ready
```

The importer observes the exported binding. It cannot assign directly to the imported binding, but the exporting module can update it.

### Circular dependencies

A cycle exists when module A imports module B and module B imports module A. The modules may observe partially initialized exports because evaluation cannot complete both modules in a simple top-to-bottom order.

Cycles are sometimes valid, but they often signal unclear ownership. Move shared types or pure helpers into a third module, or change the dependency direction. Test cycles explicitly because behavior differs between CommonJS and ESM.

### Interoperability

CommonJS and ESM can interoperate, but the shape of the imported value may not be what a developer expects. Default exports, named exports, and `module.exports` do not map perfectly in every direction. Prefer one module style per application boundary and verify the behavior on the supported Node.js versions.

### Circular dependencies as partially initialized graphs

Consider a CommonJS cycle:

```text
a.cjs -> b.cjs -> a.cjs
```

Node must return something while the first module is still evaluating. A consumer may therefore observe an empty object, an incomplete export, or a warning depending on exactly when the value is read. ESM detects cycles as part of linking, but top-level initialization can still observe a temporal-dead-zone or an unfinished evaluation path.

The practical fix is usually not "make the import dynamic." Identify the ownership cycle, move shared policy into a lower-level module, or inject the dependency at the call boundary. A cycle that is intentional should have a test that proves the initialization order.

## Node.js and DSA Connections

- **Node connection:** Module resolution is part of application startup. A wrong `exports` path can stop the process before the server listens.
- **JavaScript connection:** ESM imports and exports build on bindings, while CommonJS usually exposes an object value.
- **DSA connection:** A dependency graph should be close to a directed acyclic graph. Cycles make initialization order harder to reason about.

## Common Mistakes and Interview Traps

- Mixing `require` and `import` without understanding the package mode.
- Assuming every `.js` file is CommonJS.
- Importing internal package paths that are not public API.
- Treating CommonJS cached state as if each `require()` created a fresh instance.
- Assuming ESM named imports are copied values rather than live bindings.
- Hiding a circular dependency with a dynamic import without understanding the initialization problem.
- Starting the HTTP server as a side effect during module import, which makes tests and reuse harder.

## Tricky Points

- A package's nearest `package.json` can change how a `.js` file is interpreted.
- Built-in imports such as `node:fs` clearly identify Node's built-in module and avoid ambiguity with a package name.
- Changing `package.json` module configuration can affect every `.js` file below that package boundary.
- A module cache is process-local; restarting the process creates a new module instance.

## Practical Exercise

**Goal:** Build the same small utility as a CommonJS module and an ESM module.

**Inputs and outputs:** Export an `add` function and a `formatResult` function. Import them from a small application and print a result.

**Constraints:** Use explicit `.cjs` and `.mjs` files first. Then create a separate package configuration using `.js` and explain how `type` changes interpretation.

**Edge cases:** Add a missing export, an invalid import path, a circular dependency, and a dynamic import failure.

**Acceptance criteria:**

- You can identify the module mode of every file.
- You can explain which values are public and which are internal.
- You can describe CommonJS caching and ESM live bindings.
- You can document one safe way to avoid or break a cycle.
- The application does not open a server merely because a module is imported.

## Summary

- Modules create boundaries around code and dependencies.
- CommonJS uses `require` and `module.exports`; ESM uses `import` and `export`.
- `package.json`, `type`, file extensions, and `exports` affect Node resolution.
- CommonJS modules are cached within a process.
- ESM imports use live bindings and have different loading behavior.
- Cycles can expose partially initialized values and should be designed deliberately.
- Module configuration should be consistent and tested on the supported Node.js versions.

## Cheat Sheet

| Concern | CommonJS | ESM |
|---|---|---|
| Import | `require()` | `import` / `import()` |
| Export | `module.exports` | `export` |
| Common file marker | `.cjs` | `.mjs` |
| `.js` behavior | Usually CommonJS without `type: module` | ESM with `type: module` |
| Cache/binding idea | Cached exported value | Live imported binding |
| Main risk | Hidden state and interop confusion | Mode/configuration and interop confusion |

## Interview Questions

1. **Definition:** Compare CommonJS and ESM in Node.js.
   - **Expected answer:** Cover syntax, package configuration, loading behavior, caching/bindings, and compatibility assumptions.
   - **Follow-up:** Why should a project document its module mode?

2. **Trace:** Why does the CommonJS counter return `1` and then `2` from two references?
   - **Expected answer:** `require()` returns the cached module export after the first evaluation.
   - **Follow-up:** How would you get isolated state for each caller?

3. **Implementation:** Create a package with a public root export and one public subpath using `exports`.
   - **Expected answer:** Define explicit export mappings and verify that an internal path is not importable.
   - **Follow-up:** How would you support both CommonJS and ESM consumers?

4. **Debugging [Hard]:** A deployment fails with a module syntax error even though the code worked locally. What do you inspect?
   - **Expected answer:** Node version, nearest `package.json`, `type`, file extensions, package exports, build output, and start command.
   - **Follow-up:** Which assumption should be recorded in the project documentation?

5. **Design [Hard]:** A service has a circular dependency between authentication and user modules. How would you redesign it?
   - **Expected answer:** Identify ownership, extract stable interfaces or pure shared code, reverse a dependency, and test initialization order.
   - **Follow-up:** When might a dependency-injection boundary be better than another shared module?

<nav aria-label="Lecture navigation">

[Previous: Event Loop and Scheduling](day-02-event-loop-and-scheduling.md) | [Roadmap](../node-roadmap.md) | [Next: Process, Configuration, and Lifecycle](day-04-process-configuration-and-lifecycle.md)

</nav>