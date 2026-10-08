# Day 03: Modules, Packages, and Resolution

<nav aria-label="Lecture navigation">

[← Previous: Event Loop and Scheduling](day-02-event-loop-and-scheduling.md) | [Roadmap](../node-roadmap.md) | [Next: Process, Configuration, and Lifecycle](day-04-process-configuration-and-lifecycle.md)

</nav>

## Prerequisites

Before studying this lecture, you should be familiar with:
- **Node.js Runtime & Architecture:** How V8 and Node core interact ([Day 01: Node.js Runtime and Architecture](day-01-node-runtime-and-architecture.md)).
- **Event Loop & Scheduling:** How synchronous code runs to completion on the call stack before microtasks and event loop phases run ([Day 02: Event Loop and Scheduling](day-02-event-loop-and-scheduling.md)).
- **JavaScript Modules:** ECMAScript module syntax, `import`/`export`, and static structures ([JavaScript Day 17: Modules and Module Interoperability](../../Javascript/javascript-lectures/day-17-modules-and-interoperability.md)).

*Upcoming Connections:*
- [Day 04: Process, Configuration, and Lifecycle](day-04-process-configuration-and-lifecycle.md) explores how environment variables and graceful shutdown interact with module initialization.
- [Day 13: Express Application Structure](day-13-express-application-structure.md) uses layered module boundaries to separate routes, controllers, and services.
---

## 1. The Module as an Architectural Boundary

> **Module**: A distinct file or package that encapsulates private code and exposes an explicit public API.

A **module** is an isolated unit of code stored in a file that hides internal implementation details behind an explicit public interface.

In Node.js, every file is treated as its own private scope. Variables, functions, and classes declared inside a file are not accessible to other files unless explicitly exported. This prevents pollution of the global object and allows developers to construct structured, layered architectures:

```text
HTTP Route Module ──> Service Domain Module ──> Database Repository Module
```

The arrow indicates dependency direction: outer layers depend on inner layers, pointing toward a single owner. A well-designed module boundary keeps side effects isolated, makes dependencies explicit, and ensures individual components can be unit-tested without mocking the entire runtime.

### Real-World Analogy: The Embassy and the Diplomatic Pouch

Think of a module like a foreign embassy in a host city:
- The interior of the embassy is sovereign territory (**private module scope**). What happens inside stays hidden from the host city.
- The embassy communicates with the outside world solely through formal diplomatic pouches and designated public reception desks (**`export` / `module.exports`**).
- If an outsider attempts to enter an unauthorized back door (**internal file path not declared in `exports`**), the security guard blocks them (**`ERR_PACKAGE_PATH_NOT_EXPORTED`**).
- When a document is delivered to the city hall, city hall files it in their records office (**`require.cache`**) so they never need to request the same document twice.

```js
// Node.js code
// Demonstrating clean module boundaries vs. global state leaks

// ❌ Anti-pattern: Leaking state onto the process/global object
global.databaseConnection = { host: "localhost", port: 5432 }; // Leaks everywhere; untestable

// ✅ Valid: Clean, encapsulated module contract
class UserService {
  #db; // Private field

  constructor(dbClient) {
    this.#db = dbClient;
  }

  async findUserById(id) {
    return this.#db.query("SELECT * FROM users WHERE id = $1", [id]);
  }
}

// Explicit export keeps implementation details private
module.exports = { UserService };
```

---

## 2. CommonJS (CJS) Mechanics

> **CommonJS (CJS)**: Node's legacy module format using synchronous `require()` and mutable `module.exports`.

**CommonJS** is Node's original module format where `require()` immediately loads, compiles, executes, and caches a file synchronously on the main JavaScript thread.

### 2.1 The Module Wrapper Function

> **Module Wrapper Function**: The hidden function Node wraps around every CJS file to provide scoped variables like `exports`, `require`, `module`, `__filename`, and `__dirname`.

Before Node.js executes any CommonJS file, it wraps the entire file's source code inside a hidden wrapper function:

```js
(function (exports, require, module, __filename, __dirname) {
  // Your module code actually runs here!
});
```

Because of this wrapper:
- Top-level variables (e.g., `const secret = 42;`) are scoped to this function, never leaking into the global scope.
- `__filename` and `__dirname` are provided as local function arguments pointing to the absolute path of the current file and its parent folder.
- `exports`, `require`, and `module` are passed as references into the function scope.

### 2.2 `module.exports` vs. `exports`

> **Exports Map (`exports`)**: A `package.json` field defining explicit, encapsulated public entry points, acting as a firewall against internal file leaks.

In CommonJS, `exports` is simply a local variable initialized to point to the exact same object as `module.exports`:

```js
// Node.js code
// Inside the module wrapper:
// exports = module.exports = {};

// ✅ Valid: Attaching properties works because both point to the same object
exports.name = "BillingService";
module.exports.version = "1.0.0";
// Result: { name: "BillingService", version: "1.0.0" }

// ❌ Anti-pattern / Trap: Reassigning exports breaks the reference!
exports = function () { return "Broken"; };
// Node still returns `module.exports`, which is still an empty object {}!
// The reassigned function is completely lost.

// ✅ Correct way to export a single function/class:
module.exports = function () { return "Working"; };
```

### 2.3 Synchronous Caching via `require.cache`

> **`require.cache`**: An in-memory object where Node stores evaluated CommonJS module exports keyed by absolute file path.

When a file is loaded via `require(specifier)`, Node:
1. Resolves the specifier to an absolute filename on disk (e.g., `/app/src/db.js`).
2. Checks if `/app/src/db.js` already exists as a key in `require.cache`.
3. If cached, it immediately returns the cached `module.exports` object without reading or executing the file again.
4. If not cached, it reads the file, runs the module wrapper, caches the result in `require.cache`, and returns `module.exports`.

```js
// Node.js code
// Demonstrating CommonJS caching mechanics and the mutable state trap

// counter.cjs
let count = 0;
module.exports = {
  increment: () => ++count,
  getCount: () => count,
};

// app.cjs
const counterA = require("./counter.cjs");
const counterB = require("./counter.cjs");

counterA.increment();
console.log("counterA count:", counterA.getCount()); // 1
console.log("counterB count:", counterB.getCount()); // 1

// ✅ Both references point to the exact same cached object in memory
console.log(counterA === counterB); // true

// ❌ Trap: Mutating cached singleton state causes hidden side effects across tests
counterA.customProperty = "mutated";
console.log(counterB.customProperty); // "mutated" - leaks across files!
```

---

## 3. ECMAScript Modules (ESM) Mechanics

> **ECMAScript Modules (ESM)**: The official JavaScript standard module format using static `import` and `export` statements with live bindings.

**ECMAScript Modules (ESM)** is the official JavaScript standard module format that constructs and validates a static dependency graph before executing any module code.

### 3.1 The Three-Phase Loading Pipeline

Unlike CommonJS, which loads and executes files imperatively on the fly, ESM executes in three distinct, sequential phases:

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. Construction (Parsing & Loading)                          │
│    Find all files, download/read, parse into Module Records │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 2. Instantiation (Linking)                                  │
│    Allocate memory slots for all exports and imports        │
│    (Connect live bindings without running JS code)          │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 3. Evaluation                                               │
│    Execute top-level JavaScript code in post-order DFS      │
│    Fill memory slots with computed values                   │
└─────────────────────────────────────────────────────────────┘
```

1. **Construction (Parsing):** Node reads the entry file, inspects all `import` statements, fetches the imported files recursively, and parses them into Module Records. This phase is static: you cannot put an `import` statement inside an `if` block.
2. **Instantiation (Linking):** Node connects the import and export identifiers across files. Memory slots are allocated, but no JavaScript code has executed yet.
3. **Evaluation:** Node runs the JavaScript code top-to-bottom. Memory slots are populated with their actual evaluated values.

### 3.2 Live Bindings vs. Value Copies

> **Live Binding**: An ESM mechanism where imported variables reference the live memory binding of the exporting module rather than a static snapshot.

A critical difference between CJS and ESM is how exported values are shared:
- **CommonJS exports values by copy/assignment:** When you `require()`, you receive whatever value was assigned to `module.exports` at that moment. If the exporting module later updates an internal variable, the consumer does not see the change unless it was an object property.
- **ESM exports live bindings:** Importers receive a direct, read-only pointer to the memory slot in the exporting module. When the exporter updates the variable, all importers see the updated value immediately.

```js
// Node.js code
// Demonstrating ESM Live Bindings

// state.mjs (Exporter)
export let serverStatus = "booting";

export function markHealthy() {
  serverStatus = "healthy";
}

// consumer.mjs (Importer)
import { serverStatus, markHealthy } from "./state.mjs";

console.log("1. Initial status:", serverStatus); // "booting"

markHealthy();
// ✅ The imported identifier automatically reflects the updated value!
console.log("2. Updated status:", serverStatus); // "healthy"

// ❌ Anti-pattern: Importers cannot reassign imported live bindings
try {
  serverStatus = "crashed"; // Throws TypeError: Assignment to constant variable
} catch (err) {
  console.log("❌ Cannot reassign imported binding:", err.name);
}
```

### 3.3 Top-Level Await

In ESM, you can use the `await` keyword at the top level of a module outside of any `async` function:

```js
// Node.js code (ESM)
// config.mjs
import { readFile } from "node:fs/promises";

// ✅ Valid: Top-level await pauses module evaluation until the Promise resolves
const rawConfig = await readFile(new URL("./config.json", import.meta.url), "utf8");
export const config = JSON.parse(rawConfig);
```

While top-level await pauses the evaluation of this module and any modules importing it, **it does not block the libuv event loop**. Other independent tasks, timers, and network requests can continue running while the promise is pending.

---

## 4. Summary Comparison: CommonJS vs. ECMAScript Modules

| Feature | CommonJS (CJS) | ECMAScript Modules (ESM) |
| :--- | :--- | :--- |
| **Specification** | Node.js host-specific legacy standard | Official ECMAScript (JavaScript) standard |
| **Syntax** | `require()` and `module.exports` | `import` and `export` |
| **Loading Model** | Synchronous, on-demand during execution | 3-phase asynchronous graph (Parse $\to$ Link $\to$ Eval) |
| **Export Semantics** | Copied value / object reference | **Live bindings** (read-only references to memory) |
| **File Extensions** | `.cjs`, or `.js` without `"type": "module"` | `.mjs`, or `.js` with `"type": "module"` |
| **Scoping Globals** | Has `__dirname`, `__filename`, `exports` | No `__dirname`/`__filename` (use `import.meta.url`) |
| **Top-Level Await** | ❌ Not supported (SyntaxError) | ✅ Native support |
| **Tree Shaking** | Poor (dynamic nature prevents static pruning) | Excellent (static AST enables dead-code elimination) |
| **Cycle Handling** | Returns partially evaluated object `{}` | Links bindings; throws `ReferenceError (TDZ)` if read early |

---

## 5. `package.json` Configuration: `type`, `exports`, and `imports`

> **Subpath Imports (`imports`)**: A `package.json` field providing package-internal private aliases prefixed with `#`.

The `package.json` file controls how Node's module loader interprets file extensions, exposes public interfaces, and resolves package-internal paths.

### 5.1 The `"type"` Field

The `"type"` field determines how `.js` files within that package boundary are parsed:

```json
{
  "name": "my-backend-app",
  "type": "module"
}
```

- If `"type": "module"` is set: All `.js` files in that directory and its subdirectories are treated as **ESM**.
- If `"type"` is omitted or set to `"commonjs"`: All `.js` files are treated as **CommonJS**.
- Explicit extensions always override `"type"`: `.mjs` is always ESM, and `.cjs` is always CommonJS, regardless of `package.json`.

### 5.2 The `"exports"` Map (API Firewall)

Historically, packages specified an entry point using `"main": "index.js"`. However, `"main"` did not prevent consumers from reaching into arbitrary internal files:

```js
// Unintended access into private files with legacy "main":
const internalHelper = require("auth-lib/src/helpers/crypto-internal.js");
```

The modern `"exports"` map acts as an **API Firewall**: only paths explicitly defined in the map can be imported by external consumers.

```json
{
  "name": "payment-client",
  "type": "module",
  "exports": {
    ".": "./src/index.js",
    "./test-helpers": "./src/testing/helpers.js"
  }
}
```

```js
// Node.js code
// Consumer behavior with exports map:

// ✅ Allowed: Declared public entry points
import { Client } from "payment-client";
import { mockPayment } from "payment-client/test-helpers";

// ❌ Blocked: Any undeclared path is completely inaccessible!
// import { secretKey } from "payment-client/src/internal/keys.js";
// Throws: Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './src/internal/keys.js'
// is not defined by "exports" in package.json
```

### 5.3 Conditional Exports (Supporting Both CJS and ESM)

A dual-format library can define **conditional exports** so Node selects the appropriate build based on whether the consumer uses `import` or `require`:

```json
{
  "name": "utility-belt",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.cjs",
      "types": "./dist/types/index.d.ts"
    }
  }
}
```

### 5.4 Subpath Imports with `"#"`

The `"imports"` field allows a package to define internal aliases prefixed with `#`. These aliases are private to the package and cannot be imported by external consumers:

```json
{
  "name": "my-service",
  "imports": {
    "#db": "./src/infrastructure/database/pool.js",
    "#config": "./src/config/environment.js"
  }
}
```

```js
// Node.js code
// Inside any file in the package (no more fragile relative paths like "../../../db/pool.js"):
import { pool } from "#db";
import { config } from "#config";
```

---

## 6. The Node.js Package Resolution Algorithm

> **Resolution Algorithm**: The deterministic sequence of rules Node follows to map a string specifier to an absolute file path on disk.

The **resolution algorithm** is the deterministic sequence of rules Node follows to map an import/require specifier string to an absolute file path on disk.

```text
                       [Specifier String]
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
     Starts with ./ or ../ or /             Does NOT start with ./
            │                                     │
   [File / Directory Path]                        ▼
   1. Check exact file name              Starts with node: ?
   2. Check .js, .json, .node (CJS)      ├─ Yes ──> Built-in module (node:fs)
   3. Check directory index file         └─ No  ──> Starts with # ?
                                                    ├─ Yes ──> Subpath import (#db)
                                                    └─ No  ──> Package in node_modules
                                                               1. Inspect package.json
                                                               2. Check "exports" map
                                                               3. Fallback to "main"
```

### 6.1 Specifier Families

Node recognizes four distinct categories of specifiers:

1. **Built-in core modules:** Prefixed with `node:` (e.g., `node:fs`, `node:http`, `node:crypto`). Always use the `node:` prefix to avoid collision with npm packages.
2. **Relative specifiers:** Starts with `./` or `../` (e.g., `./routes.js`, `../utils/hash.js`). Resolved relative to the directory of the importing file.
3. **Bare specifiers:** Starts with a package name (e.g., `express`, `lodash/get`). Resolved by walking up the directory tree looking for `node_modules`.
4. **Subpath imports:** Starts with `#` (e.g., `#db`). Resolved against the nearest package's `"imports"` map.

### 6.2 The `node_modules` Hierarchical Tree Walk

When resolving a bare specifier like `require("pg")` from `/var/app/src/services/user.js`, Node traverses parent directories looking for `node_modules`:

```text
/var/app/src/services/node_modules/pg
/var/app/src/node_modules/pg
/var/app/node_modules/pg             <-- Found here!
/var/node_modules/pg
/node_modules/pg
```

If Node reaches the filesystem root without finding `pg`, it throws `MODULE_NOT_FOUND`.

### 6.3 Mandatory File Extensions in ESM

In CommonJS, Node automatically probes for extensions (if you write `require('./math')`, it tests `math.js`, `math.json`, `math.node`, and `math/index.js`).

**In native ESM, automatic extension searching is disabled by default.** You must specify the complete file extension:
```js
// ❌ Fails in native ESM:
// import { add } from "./math"; // Error [ERR_MODULE_NOT_FOUND]

// ✅ Correct in native ESM:
import { add } from "./math.js";
```

---

## 7. Circular Dependencies: CJS vs. ESM

A **circular dependency** occurs when module `A` requires module `B`, and module `B` requires module `A` before either module has finished evaluating.

```text
moduleA.js ──── imports ────> moduleB.js
    ▲                             │
    └────────── imports ──────────┘
```

### 7.1 Circular Dependencies in CommonJS (The Empty Object `{}` Trap)

When CommonJS encounters a cycle:
1. Node begins executing `a.cjs`. It creates an empty `module.exports = {}` in `require.cache`.
2. Before `a.cjs` finishes declaring its exports, it calls `require('./b.cjs')`.
3. Node begins executing `b.cjs`. Inside `b.cjs`, it calls `require('./a.cjs')`.
4. Node notices `a.cjs` is already in `require.cache`. It **does not re-evaluate `a.cjs`**; instead, it immediately returns `a.cjs`'s **current, incomplete** `module.exports` object (which is currently empty `{}`)!
5. `b.cjs` tries to use `a.cjs`'s functions and throws a `TypeError: a.doSomething is not a function`.

```js
// Node.js code
// Demonstrating the CommonJS Circular Dependency Trap

// a.cjs
const b = require("./b.cjs");
console.log("In A, b.value is:", b.value);
module.exports = { value: "A_COMPLETE" };

// b.cjs
const a = require("./a.cjs");
// ❌ At this point, a.cjs has not reached its module.exports assignment!
console.log("In B, a is currently:", a); // Logs: {} (Empty object!)
module.exports = { value: "B_COMPLETE" };

// main.cjs
require("./a.cjs");

// Output:
// In B, a is currently: {}
// In A, b.value is: B_COMPLETE
```

### 7.2 Circular Dependencies in ESM (The TDZ Trap)

In ESM, because bindings are linked during Instantiation before any code runs:
- If `b.mjs` imports `aValue` from `a.mjs` and attempts to access it before `a.mjs` has executed its declaration line, JavaScript throws a `ReferenceError: Cannot access 'aValue' before initialization` (Temporal Dead Zone).
- If the export is a `function` declaration, it is hoisted and can be invoked safely even across a cycle.

### 7.3 How to Architecturally Eliminate Cycles

Do not patch cycles with runtime hacks like delaying execution with `setTimeout()`. Use clean architectural refactoring:
1. **Extract Shared Responsibilities:** Move the shared logic or shared types into a third module (`c.js`) that both `a.js` and `b.js` import.
2. **Dependency Injection:** Pass the dependency as a constructor argument rather than importing it directly.

```text
❌ Cycle:           OrderService <────> PaymentService
✅ Refactored:      OrderService ───┐
                                    ├───> TransactionLogger (Shared)
                    PaymentService ─┘
```

---

## 8. Cross-Module Interoperability and the Dual-Package Hazard

> **Dual-Package Hazard**: A bug where both CJS and ESM builds of the same package are loaded in one runtime, creating duplicate instances with separate state.

Modern Node.js backends often operate in hybrid ecosystems where ESM and CommonJS co-exist.

### 8.1 Importing CommonJS from ESM

You can import CommonJS files from ESM:
```js
// Node.js code (ESM)
// Default import always works:
import pkg from "./legacy-cjs.cjs";

// Named imports work if V8 can statically parse the CJS module.exports keys:
import { calculateTotal } from "./legacy-cjs.cjs";
```

### 8.2 Requiring ESM from CommonJS

- **Historically:** `require('./esm.mjs')` threw `ERR_REQUIRE_ESM`. CJS modules were forced to use asynchronous dynamic import: `import('./esm.mjs').then(...)`.
- **Node.js 22+ (`--experimental-require-module` / native in newer builds):** You can synchronously `require()` an ESM module, provided the target ESM file **does not use top-level await**. If it uses top-level await, it still throws `ERR_REQUIRE_ASYNC_MODULE`.

### 8.3 The Dual-Package Hazard

The **Dual-Package Hazard** occurs when a package is published with both ESM and CJS builds, and an application ends up loading **both builds into the same process**.

Why this breaks applications:
1. ESM consumers load `package/dist/index.mjs`.
2. CommonJS consumers (or third-party dependencies) load `package/dist/index.cjs`.
3. Node treats these as two completely different files.
4. Two separate module instances are created in memory!
5. Singletons break: If the package manages a database connection pool, a cache, or `instanceof` checks (`user instanceof UserClass`), the two instances do not share state, causing duplicate connections and failed type checks.

```text
                  Application Process
                  ┌────────────────────────────────────────┐
                  │ ESM Graph:   loads dist/index.mjs      │──> Instance 1 (State: A)
                  │ CJS Graph:   loads dist/index.cjs      │──> Instance 2 (State: B)
                  └────────────────────────────────────────┘
                   ❌ State is bifurcated across instances!
```

**The Fix (Wrapper Pattern):** One build must act as a thin wrapper around the other so all consumers share a single underlying module instance in memory.

---

## 9. JavaScript, Node.js, and DSA Connections

Understanding module systems requires connecting language semantics, runtime engineering, and graph theory.

- **JavaScript Language Connection:** ECMAScript defines the syntax for `import`/`export`, Module Records, and the formal rules for live bindings and top-level await. The ECMAScript specification intentionally omits *how* files are fetched from disks or networks; that responsibility is left entirely to the host platform.
- **Node.js Platform Connection:** Node.js implements the host loader. It provides the CJS Module Wrapper, the `node_modules` filesystem crawler, `package.json` manifest parsing, and the native C++ module binding subsystem.
- **DSA Connection:**
  - **Directed Acyclic Graphs (DAG):** Module dependencies represent a directed graph where nodes are module files and directed edges are import statements.
  - **Topological Sorting:** Node's ESM loader performs a post-order depth-first traversal (topological sort) on the dependency graph to determine the exact execution order of modules.
  - **Cycle Detection:** During the linking phase, Node uses cycle detection algorithms (tracking visited nodes) to prevent infinite loops when traversing circular imports.

---

## Tricky Points

### 1. The `exports` vs. `module.exports` Assignment Trap
In CommonJS, `exports` is just a local variable pointing to `module.exports`. If you assign `exports = function() {}`, you break the reference, and Node still exports whatever object `module.exports` points to (typically an empty `{}`).

```js
// Node.js code
// ❌ Broken:
exports = { message: "Hello" }; // Exports nothing!

// ✅ Working:
module.exports = { message: "Hello" };
```

### 2. Missing `__dirname` and `__filename` in ESM
In native ESM, the CommonJS wrapper function does not exist, so `__dirname` and `__filename` are `undefined`. You must construct them using `import.meta.url`:

```js
// Node.js code (ESM)
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// ✅ Construct __filename and __dirname in ESM:
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("Current file:", __filename);
console.log("Current directory:", __dirname);
```

### 3. Import-Time Side Effects Destroy Test Isolation
Never start network servers, open database connections, or execute heavy disk operations at the top level of a module. Doing so causes the server to boot up merely because a test runner imported a helper function!

```js
// Node.js code
// ❌ Anti-pattern: Side effect runs immediately on import!
const app = require("express")();
app.listen(3000); // Test runners will crash or hang on import!

// ✅ Valid: Export a factory function
function createServer() {
  const app = require("express")();
  return app;
}
module.exports = { createServer };
```

### 4. Dynamic `import()` Returns a Promise Everywhere
Even inside a synchronous CommonJS file, `import(specifier)` is valid and always returns a **Promise**. You cannot use it to synchronously extract an ESM export into a CJS variable.

---

## Hands-On Exercise

### Scenario: Fixing a Circular Dependency Crash in an Authentication Service

> **Circular Dependency**: A dependency graph where two or more modules depend on each other directly or indirectly.
Your team is deploying an Express microservice. During startup, user authentication fails with a cryptic error: `TypeError: userService.findUserById is not a function`. The team discovered that `authService.cjs` and `userService.cjs` depend on each other cyclically, causing CommonJS to return an incomplete, empty export object.

### Buggy Code

```js
// Node.js code
// BUGGY: Circular dependency causes empty export object

// authService.cjs
const userService = require("./userService.cjs");

function authenticateUser(email, password) {
  // ❌ Crash: userService is {} because of circular resolution!
  const user = userService.findUserByEmail(email);
  return user && user.password === password;
}

module.exports = {
  authenticateUser,
  systemName: "OAuth2Provider",
};

// userService.cjs
const authService = require("./authService.cjs");

const users = [{ id: 1, email: "admin@corp.internal", password: "secret" }];

function findUserByEmail(email) {
  return users.find((u) => u.email === email);
}

function getAuthSystem() {
  return authService.systemName;
}

module.exports = {
  findUserByEmail,
  getAuthSystem,
};
```

### Acceptance Criteria
1. Break the circular dependency without using `setTimeout()` or deferred dynamic imports.
2. Refactor the modules so that both `authenticateUser` and `getAuthSystem` work reliably.
3. Decouple domain logic from shared system configuration.
4. Verify that neither module returns an uninitialized `{}` object.

### Solution Code

```js
// Node.js code
// SOLUTION: Extract shared configuration to a third module and use Dependency Injection

// config.cjs (New Shared Module - No Dependencies)
module.exports = {
  systemName: "OAuth2Provider",
};

// userRepository.cjs (Isolated Domain Layer)
const users = [{ id: 1, email: "admin@corp.internal", password: "secret" }];

function findUserByEmail(email) {
  return users.find((u) => u.email === email);
}

module.exports = { findUserByEmail };

// authService.cjs (Clean Dependency on Repository & Config)
const userRepository = require("./userRepository.cjs");
const config = require("./config.cjs");

function authenticateUser(email, password) {
  // ✅ Works: userRepository is completely evaluated and initialized
  const user = userRepository.findUserByEmail(email);
  return Boolean(user && user.password === password);
}

function getSystemName() {
  return config.systemName;
}

module.exports = {
  authenticateUser,
  getSystemName,
};

// test.cjs (Verification Script)
const authService = require("./authService.cjs");

console.log("System:", authService.getSystemName());
console.log("Auth Success:", authService.authenticateUser("admin@corp.internal", "secret"));
console.log("Auth Failure:", authService.authenticateUser("admin@corp.internal", "wrong"));

// Expected Output:
// System: OAuth2Provider
// Auth Success: true
// Auth Failure: false
```

### Solution Explanation

1. **Why the original code failed:** When `authService.cjs` called `require('./userService.cjs')`, `userService.cjs` immediately called `require('./authService.cjs')`. Because `authService.cjs` was already in the cache but had not yet reached line `module.exports = ...`, Node returned its initial empty export `{}`. When `authenticateUser` was invoked, `userService.findUserByEmail` was `undefined`.
2. **Architectural Decoupling:** We extracted the shared configuration (`systemName`) into `config.cjs`, which has zero outbound dependencies.
3. **Directed Acyclic Graph (DAG):** By separating user data access into `userRepository.cjs`, the dependency graph forms a clean hierarchy: `authService` $\to$ `userRepository` and `authService` $\to$ `config`. No cycles exist.

---

## Summary

- Modules provide scope encapsulation and architectural boundaries, hiding private state behind explicit public interfaces.
- **CommonJS (CJS)** is Node's synchronous module format. It wraps files in a hidden function, passes `exports`, `require`, and `module`, and caches results in `require.cache`.
- **ECMAScript Modules (ESM)** is the language-level standard. It runs in three distinct phases (Parse, Link, Evaluate), provides **live bindings**, and supports top-level await.
- The `package.json` `"type"` field decides whether `.js` files are treated as ESM or CJS.
- The `"exports"` map serves as an API firewall, explicitly exposing public subpaths and blocking external consumers from importing private internal files.
- The `"imports"` field allows package-private aliases beginning with `#` for clean internal dependency resolution.
- Circular dependencies in CommonJS return partially initialized `{}` objects, while in ESM they can trigger Temporal Dead Zone (`ReferenceError`) crashes. Always break cycles by extracting shared modules or using dependency injection.
- The **Dual-Package Hazard** occurs when an application loads both ESM and CJS versions of a singleton library, duplicating memory state.

---

## Cheat Sheet

### CommonJS vs. ESM Quick Reference

| Feature | CommonJS | ESM |
| :--- | :--- | :--- |
| **Syntax** | `const pkg = require('./pkg')` | `import pkg from './pkg.js'` |
| **Exporting** | `module.exports = { fn }` | `export const fn = ...` |
| **Default File Extension** | `.cjs` (or `.js` with `"type": "commonjs"`) | `.mjs` (or `.js` with `"type": "module"`) |
| **File Extension Rule** | Optional (auto-probes `.js`, `.json`) | **Mandatory** explicit extension (`.js`) |
| **Execution Timing** | Synchronous during execution | Static graph parsed before evaluation |
| **Values** | Static copy / reference snapshot | **Live bindings** (reflects runtime updates) |
| **Top-Level Scope** | Wrapper function (`__dirname`, `__filename`) | Module lexical scope (use `import.meta.url`) |
| **Top-Level Await** | ❌ Not supported | ✅ Supported natively |

### Resolution Precedence Order
1. Built-in core modules prefixed with `node:` (e.g., `node:fs`).
2. Relative files starting with `./` or `../`.
3. Subpath private imports starting with `#`.
4. Bare specifiers: Node walks up `node_modules/` to the filesystem root.
5. If found, inspect `package.json`: check `"exports"` map $\to$ check `"main"`.

### Common Pitfalls
- **Assigning to `exports` instead of `module.exports`:** Reassigning `exports = fn` breaks the reference and exports an empty object.
- **Omitting file extensions in ESM:** Native ESM throws `ERR_MODULE_NOT_FOUND` if `./math.js` is written as `./math`.
- **Assuming CommonJS caches are isolated per caller:** `require()` caches module state across the entire Node.js process; mutating exported objects pollutes all callers.
- **Relying on circular dependencies:** In CommonJS, cycles return incomplete `{}` objects without warning.
- **Import-time side effects:** Starting an HTTP server on file import breaks test runners and prevents modular instantiation.

---

## Interview Questions

### 1. What is the fundamental difference between CommonJS and ESM execution pipelines?
**Question:** Compare how Node.js loads, resolves, and executes a CommonJS module versus an ECMAScript Module (ESM). Specifically explain how ESM live bindings differ from CommonJS exported values.

**Answer:**
CommonJS and ESM differ in their execution architecture, parsing guarantees, and export bindings:

1. **Execution Model:** CommonJS is synchronous and imperative. When `require()` is called, Node synchronously reads the file from disk, wraps it in the CJS module wrapper function, evaluates it immediately on the call stack, caches the result in `require.cache`, and returns `module.exports`. In contrast, ESM uses a three-phase asynchronous pipeline:
   - **Construction:** Statically parses all `import` statements and builds a Module Record graph without running any JavaScript code.
   - **Instantiation:** Links export and import identifiers by allocating memory slots across the graph.
   - **Evaluation:** Executes the code in a post-order depth-first traversal, populating the allocated memory slots.
2. **Export Semantics (Live Bindings vs Copies):** In CommonJS, `module.exports` returns a snapshot or object reference. If a primitive variable is exported and later updated internally by the module, the importer retains the old copied value. In ESM, exports are **live bindings**: the importer holds a direct, read-only pointer to the exporter's memory slot. When the exporter mutates the variable, all importing modules observe the updated value immediately.

---

### 2. Predict the Output: Circular Dependency in CommonJS vs. ESM
**Question:** What happens when two modules have a circular dependency in CommonJS? How does the runtime behave, and how does ESM differ? Trace the following CommonJS example:

```js
// a.cjs
exports.done = false;
const b = require('./b.cjs');
exports.bValue = b.done;
exports.done = true;

// b.cjs
exports.done = false;
const a = require('./a.cjs');
exports.aValue = a.done;
exports.done = true;

// main.cjs
const a = require('./a.cjs');
console.log('main:', a.bValue, a.done);
```

**Answer:**
**Execution Output:**
```text
main: true true
```

**Step-by-Step Trace:**
1. `main.cjs` requires `a.cjs`. Node creates an entry for `a.cjs` in `require.cache` with `exports = { done: false }`.
2. `a.cjs` reaches `require('./b.cjs')`. Execution of `a.cjs` is paused.
3. Node loads `b.cjs`, setting `b.cjs` in `require.cache` with `exports = { done: false }`.
4. `b.cjs` calls `require('./a.cjs')`. Node detects `a.cjs` is already in `require.cache`! Instead of re-evaluating `a.cjs`, it returns `a.cjs`'s **current, incomplete** exports object (`{ done: false }`).
5. `b.cjs` assigns `exports.aValue = a.done` (which is `false`), then sets `exports.done = true`, and completes evaluation.
6. Execution resumes in `a.cjs`. `b` is now `{ done: true, aValue: false }`. `a.cjs` assigns `exports.bValue = b.done` (which is `true`), then sets `exports.done = true`.
7. `main.cjs` receives the completed `a.cjs` object: `a.bValue` is `true`, and `a.done` is `true`.

**Difference in ESM:** If modules access uninitialized `let` or `const` variables across an ESM cycle before their declaration line runs, JavaScript throws a `ReferenceError` due to the Temporal Dead Zone (TDZ). Function declarations, however, are hoisted and can be invoked across cycles.

---

### 3. Diagnosing `ERR_PACKAGE_PATH_NOT_EXPORTED` and the Dual-Package Hazard
**Question:** A production Node.js service crashes with `Error [ERR_PACKAGE_PATH_NOT_EXPORTED]`. Meanwhile, another team reports that a shared stateful caching library is failing `instanceof` checks after migrating to ESM. Explain the root causes and how to systematically resolve both issues.

**Answer:**
**1. Resolving `ERR_PACKAGE_PATH_NOT_EXPORTED`:**
- **Root Cause:** The package being imported has defined a modern `"exports"` map in its `package.json`. Unlike legacy packages that allowed direct access to any file via deep paths (e.g., `import 'pkg/lib/cache.js'`), the `"exports"` field encapsulates the package and acts as a firewall. Any subpath not explicitly listed in `"exports"` is blocked by Node's loader.
- **Fix:** Update the consuming code to use only public entry points declared in the package's documentation. If you author the package, add the missing subpath to `"exports"`:
  ```json
  "exports": {
    ".": "./index.js",
    "./cache": "./lib/cache.js"
  }
  ```

**2. Resolving the Dual-Package Hazard:**
- **Root Cause:** The caching package ships both CommonJS and ESM builds. If part of the application imports `pkg` via ESM (`import`) and another part (or a transitive dependency) requires it via CJS (`require`), Node loads **both** `dist/index.mjs` and `dist/index.cjs` into memory as separate module instances. Singletons break, connection pools duplicate, and `instanceof` fails because the classes exist at two different memory references.
- **Fix (The CJS Wrapper Pattern):** Ensure that one format serves as a thin wrapper around the other. In the package's CJS build, delegate directly to the ESM instance, or author the core logic in CJS and have the ESM build re-export it:
  ```js
  // index.mjs (Wrapper)
  import cjsPkg from './index.cjs';
  export const Cache = cjsPkg.Cache;
  export default cjsPkg;
  ```

---

### 4. Architectural Tradeoff: Static Package Exports vs. Dynamic `import()`
**Question:** When architecting a high-throughput backend API, compare the architectural tradeoffs of using static module imports versus dynamic `import()` statements for loading plugins or optional features.

**Answer:**

| Feature | Static Imports (`import x from '...'`) | Dynamic Imports (`await import('...')`) |
| :--- | :--- | :--- |
| **Loading Timing** | Process startup / module evaluation phase. | On-demand at runtime during request execution. |
| **Startup Latency** | Higher initial startup time (parses entire graph). | Fast startup (defers parsing heavy modules). |
| **Memory Footprint** | All modules loaded into V8 heap immediately. | Memory allocated only when feature is invoked. |
| **Error Handling** | Process crashes immediately at startup if invalid. | Errors caught gracefully at runtime via `try/catch`. |
| **Request Latency** | **Zero runtime overhead**; already in memory. | **Higher p99 latency** on first call (disk read & parse). |

**Decision Rule:**
- Use **Static Imports** for core application logic, database drivers, route handlers, and middleware that are always required. Failing fast at startup is vastly preferable to failing during a user's HTTP request.
- Use **Dynamic `import()`** for optional features, expensive computational plugins (e.g., PDF generation, heavy image processors), feature flags, or conditional driver loading (e.g., loading AWS S3 driver only when cloud storage is enabled in configuration).

---

<nav aria-label="Lecture navigation">

[← Previous: Event Loop and Scheduling](day-02-event-loop-and-scheduling.md) | [Roadmap](../node-roadmap.md) | [Next: Process, Configuration, and Lifecycle](day-04-process-configuration-and-lifecycle.md)

</nav>