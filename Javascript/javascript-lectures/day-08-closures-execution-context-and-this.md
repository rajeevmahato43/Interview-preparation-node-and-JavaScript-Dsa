# Day 08: Closures, Execution Context, and `this`

<nav aria-label="Lecture navigation">

[← Day 07: Errors and Exception Flow](day-07-errors-and-exception-flow.md) | [Roadmap](../javascript-roadmap.md) | [Day 09: Objects and Property Access →](day-09-objects-and-property-access.md)

</nav>

---

## What You Will Learn Today

By the end of this lecture, you should be able to:

- Master lexical scope and how JavaScript traverses the scope chain to resolve identifiers.
- Understand what an Execution Context is and how the call stack tracks active execution.
- Define a closure accurately as a function bundled with live references to its outer lexical environment.
- Explain why closures capture variable bindings rather than static snapshots.
- Master the 4 rules governing `this` in regular functions: Default, Implicit, Explicit, and `new` binding.
- Explain why arrow functions bypass call-site rules and inherit `this` lexically.
- Diagnose and fix the classic method extraction bug (lost receiver) using arrow functions, `.bind()`, or class fields.
- Prevent memory leaks in Node.js caused by accidental closure retention in long-lived event listeners and caches.
- Implement robust factory functions and middleware decorators leveraging private closure state.

**Prerequisites:** [Day 02 – Variables, Scope, and Hoisting](day-02-variables-scope-and-hoisting.md) (block vs. function scope, TDZ) and [Day 06 – Functions, Parameters, and Callbacks](day-06-functions-parameters-and-callbacks.md) (first-class functions, HOFs, arrow functions).  
*Upcoming Connections:* [Day 09](day-09-objects-and-property-access.md) applies method calls and property descriptors to object models; [Day 10](day-10-prototypes-classes-and-inheritance.md) connects `this` and `new` binding to prototypal inheritance.

---

## Quick Vocabulary Card

| Term | Definition |
| :--- | :--- |
| **Lexical Scope** | A scoping model where variable resolution depends strictly on the physical placement of declarations in the source code at author time. |
| **Scope Chain** | The hierarchical cascade of nested lexical environments searched from innermost to outermost when resolving a variable name. |
| **Execution Context** | An internal environment created by the engine to manage the execution of a piece of code (tracks local variables, the scope chain, and `this`). |
| **Call Stack** | A LIFO (Last In, First Out) stack data structure that tracks active execution contexts as functions are called and returned. |
| **Closure** | The combination of a function bundled together with references to its surrounding lexical environment, allowing it to access outer variables even after the outer function returns. |
| **Call-Site** | The exact location and syntax pattern in code where a function is invoked (determines `this` for regular functions). |
| **`this` Binding** | A keyword whose value represents the current execution receiver, determined dynamically at runtime based on how a regular function is invoked. |
| **Method Extraction** | The act of copying or passing an object method reference without invoking it directly on the object, causing the method to lose its receiver (`this`). |
| **Explicit Binding** | Manually forcing a function's `this` context using `.call()`, `.apply()`, or `.bind()`. |
| **Lexical `this`** | An arrow function feature where `this` is not bound dynamically, but is permanently resolved from the enclosing lexical scope. |
| **Closure Retention** | When an active, reachable closure holds references to memory (objects, arrays), preventing the garbage collector from reclaiming that memory. |

---

## 1. Lexical Scope and the Scope Chain

**Lexical Scope** means that variable accessibility is determined strictly by the physical location of variables and blocks in the authored source code.

JavaScript does **not** use dynamic scoping: a function resolves variables based on where it was **defined**, never based on where or by whom it was **called**.

```
                         Lexical Scope Chain
┌────────────────────────────────────────────────────────┐
│ Global Scope: const appName = "AuthService"            │
│   ┌──────────────────────────────────────────────────┐ │
│   │ Outer Function Scope: const version = "v1"       │ │
│   │   ┌────────────────────────────────────────────┐ │ │
│   │   │ Inner Function Scope: const port = 3000    │ │ │
│   │   │ Lookup 'port'     ──► Found in Inner Scope │ │ │
│   │   │ Lookup 'version'  ──► Found in Outer Scope │ │ │
│   │   │ Lookup 'appName'  ──► Found in Global      │ │ │
│   │   │ Lookup 'unknown'  ──► ReferenceError!      │ │ │
│   │   └────────────────────────────────────────────┘ │ │
│   └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### Identifier Lookup

When JavaScript encounters an identifier, it searches the current local scope. If not found, it steps outward to the enclosing parent scope, continuing up the chain until it reaches the Global scope. If the variable is still not found:
- In strict mode, reading an undeclared variable throws a `ReferenceError`.
- In sloppy mode, assigning to an undeclared variable implicitly creates a global property (an anti-pattern prevented by `"use strict"`).

```js
// Node.js code
"use strict";

const serviceName = "BillingGateway";

function createService() {
  const version = "2.4.0";

  function getInfo() {
    // ✅ Resolves 'version' from parent scope and 'serviceName' from global scope
    return `${serviceName} [${version}]`;
  }

  return getInfo;
}

function clientCaller() {
  const serviceName = "FakeGateway"; // ❌ Shadowing in caller scope has ZERO effect
  const infoFn = createService();
  return infoFn();
}

console.log(clientCaller()); // "BillingGateway [2.4.0]" (resolved where defined!)
```

---

## 2. Execution Context and the Call Stack

An **Execution Context** is the internal data structure that JavaScript creates to manage code execution. It contains:
1. **Lexical Environment:** Tracks local identifiers (`let`, `const`, `function`).
2. **Variable Environment:** Tracks legacy `var` declarations.
3. **Outer Environment Reference:** The link pointing to the parent lexical environment (forming the scope chain).
4. **`this` Binding:** The value assigned to `this` for the current frame.

The **Call Stack** is the engine's LIFO stack that holds these execution contexts. Calling a function pushes a new context; returning pops it.

```js
// Node.js code
function computeDiscount(price) {
  // Call stack: [GlobalContext, checkoutContext, computeDiscountContext]
  return price * 0.1;
}

function checkout(item, price) {
  // Call stack: [GlobalContext, checkoutContext]
  const discount = computeDiscount(price);
  return price - discount;
}

// Call stack: [GlobalContext]
const finalTotal = checkout("Book", 50);
console.log("Final total:", finalTotal); // 45
```

---

## 3. What is a Closure?

A **closure** is a function bundled together with references to its surrounding lexical environment. In JavaScript, every function forms a closure at creation time, capturing access to any outer variables it references.

Even when the outer function completes and its execution context is popped off the call stack, the captured variables **remain alive in memory** as long as the inner function remains reachable.

> **Analogy:** Think of an outer function as an office where a project was born. When the creator leaves the office and closes the door (the function returns), the inner function doesn't lose its files. It carries a backpack containing all the documents and tools (`variables`) it needs. Wherever that function travels, it opens its backpack and reads or edits those live documents.

```js
// Node.js code
function createRateLimiter(maxRequests) {
  // 'maxRequests' and 'tokens' live in the outer lexical environment
  let tokens = maxRequests;

  return function request() {
    if (tokens > 0) {
      tokens -= 1;
      return { allowed: true, remaining: tokens };
    }
    return { allowed: false, remaining: 0 };
  };
}

// ✅ Factory call creates a brand new, isolated closure
const limiterA = createRateLimiter(2);
console.log(limiterA()); // { allowed: true, remaining: 1 }
console.log(limiterA()); // { allowed: true, remaining: 0 }
console.log(limiterA()); // { allowed: false, remaining: 0 }

// ✅ Second factory call creates completely independent private state
const limiterB = createRateLimiter(5);
console.log(limiterB()); // { allowed: true, remaining: 4 } (limiterA's state does not affect limiterB!)
```

### Encapsulation and Data Privacy

Closures provide true private state in JavaScript without classes or special symbols:

```js
// Node.js code
function createBankAccount(initialBalance) {
  let balance = initialBalance; // Completely private: unreachable from outside!

  return {
    deposit(amount) {
      if (amount <= 0) throw new Error("Deposit must be positive");
      balance += amount;
      return balance;
    },
    withdraw(amount) {
      if (amount > balance) throw new Error("Insufficient funds");
      balance -= amount;
      return balance;
    },
    getBalance() {
      return balance;
    }
  };
}

const account = createBankAccount(100);
account.deposit(50);
console.log("Balance:", account.getBalance()); // 150

// ❌ Cannot access or mutate balance directly
console.log(account.balance); // undefined
```

---

## 4. Closures Capture Bindings, Not Snapshots

A critical mental model rule: **closures capture a live reference to the variable binding, not a static copy or snapshot of its value**.

If the variable’s value changes after the closure was created, the closure sees the updated value upon invocation.

```js
// Node.js code
let serverStatus = "BOOTING";

const checkStatus = () => `Server is: ${serverStatus}`;

console.log(checkStatus()); // "Server is: BOOTING"

// Update the variable binding
serverStatus = "READY";

// ✅ Closure reads the LIVE updated value, not the value at creation time!
console.log(checkStatus()); // "Server is: READY"
```

### The Classic Loop Trap: `var` vs. `let`

When closures are created inside loops, understanding whether the loop shares a single binding or creates a new binding per iteration is crucial:

```js
// Node.js code

// ❌ The 'var' Trap: 'var' is function-scoped; all 3 closures share ONE binding
const varCallbacks = [];
for (var i = 0; i < 3; i++) {
  varCallbacks.push(() => i);
}
// By the time callbacks run, loop finished and shared 'i' is 3
console.log(varCallbacks.map(fn => fn())); // [ 3, 3, 3 ]

// ✅ The 'let' Solution: 'let' creates a BRAND-NEW lexical binding per iteration!
const letCallbacks = [];
for (let j = 0; j < 3; j++) {
  letCallbacks.push(() => j);
}
// Each closure closed over its own distinct 'j' binding
console.log(letCallbacks.map(fn => fn())); // [ 0, 1, 2 ]

// ✅ Pre-ES2015 Solution: IIFE (Immediately Invoked Function Expression)
const iifeCallbacks = [];
for (var k = 0; k < 3; k++) {
  (function (capturedK) {
    iifeCallbacks.push(() => capturedK);
  })(k);
}
console.log(iifeCallbacks.map(fn => fn())); // [ 0, 1, 2 ]
```

---

## 5. Understanding `this`: The 4 Call-Site Rules

In JavaScript regular functions, **`this` is not determined by lexical scope**. Instead, it is determined dynamically by **how the function is called** (its **call-site**).

There are four systematic rules that determine what `this` points to:

```
                           The 4 Call-Site Rules
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
1. new Binding              2. Explicit Binding         3. Implicit Binding
   new Constructor()           fn.call(obj), apply, bind   obj.method()
   this = new instance         this = passed object        this = obj
                                     │
                                     ▼
                            4. Default Binding
                               standalone: fn()
                               Strict: undefined | Sloppy: global
```

### Rule 1: Default Binding (Standalone Function Call)

When a regular function is invoked as a plain, standalone call (`fn()`), JavaScript applies default binding:
- In **strict mode** (`"use strict"`): `this` is `undefined`.
- In **sloppy mode**: `this` refers to the global object (`global` in Node.js, `window` in browsers).

```js
// Node.js code
"use strict";

function showReceiver() {
  return this;
}

// ✅ In strict mode, standalone call binds this to undefined
console.log("Default binding (strict):", showReceiver()); // undefined
```

### Rule 2: Implicit Binding (Method Call)

When a function is called as a property of an object (`object.method()`), the object preceding the dot is implicitly bound as `this`.

```js
// Node.js code
const database = {
  host: "db.production.local",
  getHost() {
    return this.host;
  }
};

// ✅ Invoked via 'database.' -> this is database
console.log(database.getHost()); // "db.production.local"
```

### Rule 3: Explicit Binding (`call`, `apply`, `bind`)

You can explicitly force a function to execute with a specific receiver object:
- **`fn.call(thisArg, arg1, arg2)`**: Invokes immediately with arguments passed individually.
- **`fn.apply(thisArg, [args])`**: Invokes immediately with arguments passed as an array.
- **`fn.bind(thisArg, arg1, arg2)`**: Returns a **brand-new function** permanently bound to `thisArg`.

```js
// Node.js code
function formatQuery(table, limit) {
  return `SELECT * FROM ${this.prefix}_${table} LIMIT ${limit}`;
}

const tenantConfig = { prefix: "tenant_42" };

// ✅ call: arguments listed individually
console.log(formatQuery.call(tenantConfig, "users", 10));
// "SELECT * FROM tenant_42_users LIMIT 10"

// ✅ apply: arguments listed in an array
console.log(formatQuery.apply(tenantConfig, ["orders", 5]));
// "SELECT * FROM tenant_42_orders LIMIT 5"

// ✅ bind: returns a new, permanently bound function
const tenantQuery = formatQuery.bind(tenantConfig, "invoices");
console.log(tenantQuery(20));
// "SELECT * FROM tenant_42_invoices LIMIT 20"
```

### Rule 4: `new` Binding (Constructor Calls)

When a regular function is invoked with the `new` operator:
1. A brand-new empty object is created.
2. The object’s internal `[[Prototype]]` is linked to the function’s `.prototype`.
3. The function executes with `this` bound to the newly created object.
4. If the function doesn't return its own object, `this` is returned automatically.

```js
// Node.js code
function Microservice(name, port) {
  this.name = name;
  this.port = port;
}

const serviceInstance = new Microservice("Auth", 8080);
console.log(serviceInstance.name, serviceInstance.port); // "Auth" 8080
```

### Rule Precedence

When multiple rules could apply, JavaScript evaluates them in this strict order:
$$\mathbf{new\text{ Binding}} \;\;>\;\; \mathbf{Explicit\text{ (bind/call/apply)}} \;\;>\;\; \mathbf{Implicit\text{ (obj.method())}} \;\;>\;\; \mathbf{Default\text{ Binding}}$$

---

## 6. Arrow Functions and Lexical `this`

**Arrow functions completely ignore the four call-site rules.** 

An arrow function does not have its own `this`. Instead, it resolves `this` lexically—inheriting whatever `this` value exists in the enclosing function or module scope where the arrow function was defined.

### Arrow Functions Ignore `.call()`, `.apply()`, and `.bind()`

Passing a `thisArg` to an arrow function via `.call()`, `.apply()`, or `.bind()` has **no effect**. The receiver is ignored.

```js
// Node.js code
const outerContext = { id: "CORRECT_RECEIVER" };

const regularFn = function() { return this.id; };
const arrowFn = () => this?.id;

// ✅ Explicit binding works on regular functions
console.log(regularFn.call(outerContext)); // "CORRECT_RECEIVER"

// ❌ Explicit binding IGNORED by arrow functions
console.log(arrowFn.call(outerContext));    // undefined (inherits module/global this)
```

### Arrow Functions as Callbacks vs. Object Methods

```js
// Node.js code
const metricCollector = {
  service: "PaymentGateway",
  metrics: [10, 20, 30],

  // ✅ Good: regular method provides dynamic 'this' to metricCollector
  generateReport() {
    // ✅ Good: arrow callback inherits 'this' from generateReport()
    return this.metrics.map(val => `${this.service}: ${val}ms`);
  },

  // ❌ Bad: arrow function used directly as an object method
  brokenSummary: () => {
    // 'this' is NOT metricCollector; it resolves to module.exports / global
    return `Service: ${this?.service}`;
  }
};

console.log(metricCollector.generateReport()); 
// [ 'PaymentGateway: 10ms', 'PaymentGateway: 20ms', 'PaymentGateway: 30ms' ]

console.log(metricCollector.brokenSummary()); 
// "Service: undefined"
```

---

## 7. The Method Extraction Trap (Lost Receiver)

The most frequent `this` bug in JavaScript occurs when extracting a method reference and passing it as a callback.

When you pass `obj.method` to a function, you are **not** passing a method bound to `obj`. You are passing a bare reference to the function value itself. When the receiver invokes it, it invokes a standalone call, triggering **Default Binding** (`this === undefined`).

```js
// Node.js code
"use strict";

class RedisClient {
  constructor(clusterName) {
    this.clusterName = clusterName;
  }

  ping() {
    if (!this) {
      throw new TypeError("Cannot read clusterName of undefined (this is lost!)");
    }
    return `PONG from ${this.clusterName}`;
  }
}

const client = new RedisClient("redis-primary-01");

// Helper simulating an event emitter or callback consumer
function executeCallback(callback) {
  return callback();
}

// ❌ Trap: Passing method reference directly loses the receiver
try {
  executeCallback(client.ping);
} catch (err) {
  console.log("❌ Extracted method error:", err.message);
}

// --- The 3 Solutions ---

// ✅ Solution 1: Arrow function wrapper (Simple, clear, preserves prototype)
const res1 = executeCallback(() => client.ping());
console.log("Solution 1 (Arrow wrapper):", res1);

// ✅ Solution 2: Explicit .bind() (Reliable, returns new bound function)
const res2 = executeCallback(client.ping.bind(client));
console.log("Solution 2 (.bind):", res2);

// ✅ Solution 3: Class field arrow property (Auto-binds per instance)
class AutoBoundRedisClient {
  constructor(clusterName) {
    this.clusterName = clusterName;
  }
  // Arrow property auto-binds to the instance during construction
  ping = () => `PONG from ${this.clusterName}`;
}
const autoClient = new AutoBoundRedisClient("redis-replica-02");
const res3 = executeCallback(autoClient.ping);
console.log("Solution 3 (Class field arrow):", res3);
```

### Tradeoffs of the 3 Solutions

| Solution | Prototype Sharing | Memory Footprint | Cleanup / Identity |
| :--- | :--- | :--- | :--- |
| **Arrow Wrapper `() => obj.m()`** | ✅ Method on prototype | Lowest (reusable method) | Unique wrapper per call |
| **Explicit `.bind(obj)`** | ✅ Method on prototype | Moderate (creates bound wrapper) | Creates new function reference |
| **Class Field `m = () => {}`** | ❌ Recreated on every instance | Highest (new copy per instance) | Stable instance reference |

---

## 8. Memory Retention and Closure Leaks

A closure keeps every variable in its outer lexical scope **reachable** as long as the closure itself is reachable. If a closure is stored in a long-lived structure (such as a global cache, a singleton, or an event emitter), the captured data cannot be garbage collected.

```js
// Node.js code
const globalListeners = [];

function registerDataListener(eventId) {
  // 10 MB payload allocated inside request scope
  const heavyPayload = Buffer.alloc(10 * 1024 * 1024, "X");

  // ❌ Accidental memory leak: closure captures heavyPayload forever in globalListeners
  globalListeners.push(function onEvent() {
    console.log(`Event ${eventId} handled! Payload size: ${heavyPayload.length}`);
  });
}

// Simulating multiple requests
registerDataListener("REQ_101");
registerDataListener("REQ_102");
console.log("Registered listeners retaining memory:", globalListeners.length);
```

### Prevention Strategies

1. **Extract only necessary primitive fields:** Do not close over an entire large response object or request payload if you only need an ID or status string.
2. **Explicit Nullification:** Clear the reference (`heavyPayload = null`) once the long-lived work finishes.
3. **Lifecycle Unsubscription:** Always provide an explicit unsubscribe/cleanup function that removes callbacks from event emitters.

```js
// Node.js code
// ✅ Safe implementation: captures only the primitive ID, not the 10MB Buffer
function registerSafeListener(eventId) {
  const heavyPayload = Buffer.alloc(10 * 1024 * 1024, "X");
  const payloadSize = heavyPayload.length; // Capture primitive number

  const listener = function onEvent() {
    console.log(`Event ${eventId} handled! Payload size: ${payloadSize}`);
  };

  globalListeners.push(listener);

  // Return unsubscribe handler to ensure cleanup
  return function unsubscribe() {
    const idx = globalListeners.indexOf(listener);
    if (idx !== -1) globalListeners.splice(idx, 1);
  };
}
```

---

## Tricky Points

### 1. `this` in Node.js Module Top-Level vs. Functions
In Node.js CommonJS files, top-level `this` refers to `module.exports` (`{}`). In an ES Module, top-level `this` is `undefined`. Inside a standalone non-strict function in Node.js, `this` is the `global` object.
```js
// Node.js CommonJS
console.log(this === module.exports); // true
function check() { return this; }
console.log(check() === global); // true (sloppy mode)
```

### 2. Method Extraction Losing Receiver
Assigning `const fn = obj.method` detaches the method from `obj`. Invoking `fn()` in strict mode passes `this = undefined`, throwing a `TypeError` when reading instance properties.

### 3. Arrow Functions Cannot Be Constructors
Arrow functions do not have an internal `[[Construct]]` method or a `.prototype` property. Calling `new ArrowFn()` throws `TypeError: ArrowFn is not a constructor`.

### 4. Arrow Functions Ignore `.bind()`
Calling `.bind(newReceiver)` on an arrow function returns a function, but calling it continues using the original lexical `this`.

### 5. `bind` Creates a Brand-New Function Identity
Calling `.bind()` creates a new function reference. If you register `emitter.on('event', obj.method.bind(obj))`, you cannot remove it with `emitter.off('event', obj.method.bind(obj))` because the two `.bind()` calls produce different object references!

### 6. Closures in Loops With `var`
Using `var i` in a loop shares a single variable binding across all callback closures. All closures log the final terminal value of `i`. Use `let` to give each loop iteration its own fresh lexical binding.

### 7. Overriding `this` With `null` or `undefined` in Non-Strict Mode
In non-strict mode, calling `fn.call(null)` or `fn.call(undefined)` causes JavaScript to substitute the global object. In strict mode, `this` remains strictly `null` or `undefined`.

---

## Hands-on Exercise

### Scenario: Building a Callback-Safe, Memory-Clean Event Registry

You are building an event subscription registry for a high-throughput Node.js microservice. You must implement `createEventHub()`, a factory function managing listener subscriptions.

### Buggy Code

A developer wrote the following subscription hub, but it has critical bugs:
1. It shares subscriber arrays across all hub instances (state leak).
2. It loses `this` context when subscribers are invoked.
3. Listener removal fails because callers bind functions dynamically.
4. It leaks memory by holding onto unbounded event payloads.

```js
// Node.js code (Buggy Implementation)
const sharedSubscribers = {}; // Bug 1: Shared across all hub instances!

function createBuggyEventHub() {
  return {
    on(event, handler) {
      if (!sharedSubscribers[event]) sharedSubscribers[event] = [];
      sharedSubscribers[event].push(handler);
    },
    emit(event, data) {
      const handlers = sharedSubscribers[event] || [];
      handlers.forEach(fn => {
        // Bug 2: Invokes as standalone call; loses subscriber's 'this'
        fn(data);
      });
    },
    // Bug 3: No way to unsubscribe safely without reference equality
  };
}
```

### Acceptance Criteria

1. **Instance Isolation:** Every call to `createEventHub()` must maintain completely private, isolated listener maps using closures.
2. **Subscription Token / Safe Unsubscribe:** `hub.subscribe(event, handler, receiver)` must return an unsubscribe function `() => void` to avoid identity/bind mismatch issues.
3. **Preserved Receiver (`this`):** If a `receiver` object is supplied, invoke the handler with that receiver; otherwise, execute as standard callback.
4. **Memory Leak Protection:** The hub must support an `.unsubscribeAll()` or clean teardown mechanism, and must not retain event payload references after emission.

### Solution

```js
// Node.js code
function createEventHub() {
  // Private listener registry isolated to this closure instance
  const registry = new Map();

  return {
    subscribe(event, handler, receiver = null) {
      if (typeof handler !== "function") {
        throw new TypeError("Handler must be a function");
      }

      if (!registry.has(event)) {
        registry.set(event, new Set());
      }

      // Store a structured subscription entry
      const subscription = { handler, receiver };
      registry.get(event).add(subscription);

      // ✅ Return an idempotent unsubscribe function
      let unsubscribed = false;
      return function unsubscribe() {
        if (unsubscribed) return;
        unsubscribed = true;

        const eventSet = registry.get(event);
        if (eventSet) {
          eventSet.delete(subscription);
          if (eventSet.size === 0) {
            registry.delete(event);
          }
        }
      };
    },

    emit(event, payload) {
      const eventSet = registry.get(event);
      if (!eventSet || eventSet.size === 0) return;

      // Iterate a snapshot of current handlers to avoid mutation during emission
      for (const { handler, receiver } of Array.from(eventSet)) {
        try {
          if (receiver) {
            handler.call(receiver, payload);
          } else {
            handler(payload);
          }
        } catch (err) {
          console.error(`Error in event handler for '${event}':`, err.message);
        }
      }
    },

    listenerCount(event) {
      const eventSet = registry.get(event);
      return eventSet ? eventSet.size : 0;
    }
  };
}

// --- Verification Tests ---

const hub1 = createEventHub();
const hub2 = createEventHub();

class MetricsService {
  constructor(name) {
    this.name = name;
    this.recorded = 0;
  }
  record(metric) {
    this.recorded += metric.value;
    console.log(`[${this.name}] Recorded ${metric.value}, Total: ${this.recorded}`);
  }
}

const service = new MetricsService("ProductionMetrics");

// Test 1: Subscribe with explicit receiver preservation
const unsubscribe = hub1.subscribe("METRIC_ADDED", service.record, service);

hub1.emit("METRIC_ADDED", { value: 10 }); // [ProductionMetrics] Recorded 10, Total: 10
hub1.emit("METRIC_ADDED", { value: 25 }); // [ProductionMetrics] Recorded 25, Total: 35

// Test 2: Verify instance isolation
console.log("Hub 1 listener count:", hub1.listenerCount("METRIC_ADDED")); // 1
console.log("Hub 2 listener count:", hub2.listenerCount("METRIC_ADDED")); // 0

// Test 3: Unsubscribe safely
unsubscribe();
hub1.emit("METRIC_ADDED", { value: 50 }); // Nothing emitted
console.log("Hub 1 listener count after unsubscribe:", hub1.listenerCount("METRIC_ADDED")); // 0
```

---

## Summary

- **Lexical Scope:** Variables are resolved based on the authored location of code, walking outward along the scope chain to the global environment.
- **Execution Context:** Internal engine frame holding local variables, scope links, and `this`. The Call Stack manages execution contexts via LIFO.
- **Closures:** A function retains live references to its outer lexical scope even after the outer function finishes execution.
- **Live Bindings:** Closures capture live variable bindings, not static copies. Changes to variables are observed dynamically by active closures.
- **The 4 `this` Rules:** Regular functions determine `this` at the call-site via Default Binding (`undefined` in strict mode), Implicit Binding (`obj.method()`), Explicit Binding (`call`, `apply`, `bind`), or `new` Binding.
- **Arrow Functions:** Bypass call-site binding completely, resolving `this` lexically from the enclosing scope. They cannot be constructors and ignore `.call()`/`.bind()` receivers.
- **Method Extraction:** Extracting an object method and passing it as a callback severs `this`. Fix it with arrow wrappers, `.bind()`, or class field arrow properties.
- **Memory Retention:** Long-lived closures hold captured objects in memory. Prevent leaks by capturing primitives, clearing unused references, and providing unsubscribe hooks.

---

## Cheat Sheet

### The 4 `this` Binding Rules

| Rule | Syntax | Resulting `this` |
| :--- | :--- | :--- |
| **Default Binding** | `fn()` | `undefined` (in strict mode); `global` (in non-strict mode) |
| **Implicit Binding** | `obj.fn()` | `obj` (the object preceding the dot) |
| **Explicit Binding** | `fn.call(ctx)`, `fn.apply(ctx)`, `fn.bind(ctx)` | `ctx` (the explicitly passed context) |
| **`new` Binding** | `new Constructor()` | Newly instantiated object |
| **Arrow Function** | `() => {}` | Lexical `this` (copied from enclosing scope; ignores rules above) |

### Regular Function vs. Arrow Function vs. `.bind()`

| Property | Regular Function | Arrow Function | Bound Function (`.bind`) |
| :--- | :--- | :--- | :--- |
| **`this` Origin** | Dynamic (call-site) | Lexical (enclosing scope) | Fixed receiver object |
| **Can use `new`** | ✅ Yes | ❌ `TypeError` | ✅ Yes (ignores bound `this`) |
| **Own `arguments`** | ✅ Yes | ❌ Lexical (from parent) | ✅ Yes |
| **Object Methods** | ✅ Recommended | ❌ Loses object receiver | ✅ Works (adds wrapper) |
| **Callback Handlers**| ⚠️ Risks lost receiver | ✅ Preserves outer `this` | ✅ Preserves receiver |

### Common Pitfalls

- **Extracting methods without binding** → `const fn = obj.method; fn()` passes `this = undefined`, breaking property access.
- **Using arrow functions for object methods** → `const obj = { m: () => this.x }` resolves `this` to global/module scope.
- **Using `var` in loops with closures** → all closures share a single variable binding and log the final terminal value. Use `let`.
- **Calling `.bind()` inside an add/remove listener pair** → `.bind()` creates a new function identity each time; `removeEventListener` silently fails to remove it.
- **Retaining heavy objects in long-lived closures** → callbacks stored in global arrays or event emitters prevent garbage collection of captured buffers.

---

## Interview Questions

### 1. What is the fundamental difference between Lexical Scope, Closures, and `this`?

**Question:** Compare Lexical Scope, Closures, and `this`. How does JavaScript resolve variable identifiers compared to resolving the `this` keyword?

**Answer:**
1. **Lexical Scope (Static & Author-Time):**
   - Resolves variable identifiers based strictly on where functions and blocks were physically written in the source code.
   - The engine searches from the innermost local environment outwards through enclosing parent environments to the global scope.
   - It is fixed at author time and does not change regardless of how or where a function is called.
2. **Closures (Live Environment Retention):**
   - A closure is created when an inner function retains references to variables declared in an enclosing lexical scope.
   - Even after the outer function finishes execution and leaves the call stack, the variables remain alive in memory because the inner function's `[[Environment]]` internal slot keeps them reachable.
   - Closures capture live variable bindings, not frozen snapshots.
3. **`this` Binding (Dynamic & Call-Time):**
   - Unlike lexical scope, `this` in a regular function is **not** determined by where the function was written.
   - It is determined dynamically at runtime based on the function’s **call-site** (Default, Implicit, Explicit, or `new` binding).
4. **The Exception (Arrow Functions):**
   - Arrow functions bridge this divide by treating `this` as a lexical variable: they do not have their own `this` binding and resolve `this` strictly through the lexical scope chain like any regular variable.

---

### 2. Predict the output of this mixed `this` and closure snippet

```js
const client = {
  name: "ApiClient",
  tags: ["auth", "billing"],

  printTagsRegular() {
    this.tags.forEach(function(tag) {
      console.log(`${this?.name || "none"}: ${tag}`);
    });
  },

  printTagsArrow() {
    this.tags.forEach((tag) => {
      console.log(`${this.name}: ${tag}`);
    });
  }
};

client.printTagsRegular();
client.printTagsArrow();
```

**Question:** What does this code print when executed in strict mode, and why do the regular callback and arrow callback behave differently?

**Answer:**
**Output:**
```text
none: auth
none: billing
ApiClient: auth
ApiClient: billing
```

**Explanation:**
1. **`client.printTagsRegular()`:**
   - `printTagsRegular` is called as a method (`client.printTagsRegular()`), so inside `printTagsRegular`, `this` is `client`.
   - However, the callback passed to `forEach` is an anonymous regular function (`function(tag) { ... }`).
   - When `Array.prototype.forEach` invokes this callback, it invokes it as a standalone function call without specifying a receiver.
   - In strict mode, a standalone call defaults to `this = undefined`. Evaluating `this?.name` yields `undefined`, falling back to `"none"`.
2. **`client.printTagsArrow()`:**
   - The callback passed to `forEach` is an arrow function (`(tag) => { ... }`).
   - Arrow functions do not create their own `this`; they inherit `this` lexically from the enclosing function (`printTagsArrow`).
   - Because `printTagsArrow` was called on `client`, its `this` is `client`. The arrow function captures this `client` reference and logs `"ApiClient: auth"` and `"ApiClient: billing"`.

---

### 3. Debugging: Diagnosing a memory leak caused by retained closure scope

```js
// Express-style request handler
function handleUserUpload(req, res) {
  const requestBuffer = Buffer.alloc(50 * 1024 * 1024, "A"); // 50 MB
  const uploadId = req.headers["x-upload-id"];

  // Register telemetry callback in a global monitoring registry
  monitoringSystem.on("healthCheck", function reportHealth() {
    console.log(`Upload ${uploadId} status check: OK`);
  });

  res.send("Upload completed");
}
```

**Question:** Under load, this Node.js process rapidly exhausts available RAM and crashes with `JavaScript heap out of memory`. Diagnose why the 50 MB buffer is not being garbage collected and provide a fix.

**Answer:**
**Diagnosis:**
1. In V8/Node.js, when a closure (`reportHealth`) references an identifier from an outer lexical environment (`uploadId`), the entire lexical scope object (the Lexical Environment record) for that invocation of `handleUserUpload` is retained in memory.
2. Even though `reportHealth` only accesses `uploadId`, V8's scope retention rules keep the scope containing `requestBuffer` alive as long as `reportHealth` is reachable.
3. Because `reportHealth` is registered with the long-lived `monitoringSystem` event emitter, it is never garbage collected.
4. Each incoming HTTP request permanently leaks 50 MB of RAM, quickly triggering an Out-of-Memory (OOM) crash.

**Fix:**
Decouple the callback from the request's lexical scope, or store only the required primitive data and ensure listeners are removed:
```js
// Node.js code (Safe implementation)
function handleUserUploadSafe(req, res) {
  const requestBuffer = Buffer.alloc(50 * 1024 * 1024, "A");
  const uploadId = String(req.headers["x-upload-id"]);

  // Option 1: Clean up listener after response completes
  const onHealthCheck = () => {
    console.log(`Upload ${uploadId} status check: OK`);
  };

  monitoringSystem.on("healthCheck", onHealthCheck);

  res.on("finish", () => {
    monitoringSystem.off("healthCheck", onHealthCheck);
  });

  res.send("Upload completed");
}
```

---

### 4. Node.js Backend Scenario: Designing a Dependency-Injected Middleware Factory

**Question:** In production Node.js applications, middleware often requires external configuration (e.g., database clients, allowed roles, rate limits) without using global state. Design a higher-order middleware factory using closures that enforces role-based access control (RBAC), and explain how closure encapsulation benefits testing.

**Answer:**

```js
// Node.js code
function createAuthorizeMiddleware(allowedRoles, auditLogger) {
  // Defensive validation of configuration at initialization time
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    throw new Error("allowedRoles must be a non-empty array");
  }
  if (!auditLogger || typeof auditLogger.log !== "function") {
    throw new Error("A valid auditLogger instance is required");
  }

  // Pre-process roles into a Set for O(1) lookup
  const roleSet = new Set(allowedRoles);

  // Return the actual Express middleware closure
  return function authorize(req, res, next) {
    const user = req.user;

    if (!user || !user.role) {
      auditLogger.log({ event: "AUTH_DENIED", reason: "NO_USER_CONTEXT", ip: req.ip });
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roleSet.has(user.role)) {
      auditLogger.log({ event: "AUTH_DENIED", userId: user.id, role: user.role, ip: req.ip });
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }

    auditLogger.log({ event: "AUTH_GRANTED", userId: user.id, role: user.role });
    next();
  };
}

// --- Usage & Testing Benefits ---

// Mock logger for unit testing without network or disk I/O
const mockLogger = { logs: [], log(entry) { this.logs.push(entry); } };

// Instantiate middleware with test dependencies
const adminOnlyMiddleware = createAuthorizeMiddleware(["admin", "superadmin"], mockLogger);

// Test Mock Request
const mockReq = { user: { id: "u_101", role: "guest" }, ip: "127.0.0.1" };
const mockRes = {
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(payload) { this.body = payload; return this; }
};

adminOnlyMiddleware(mockReq, mockRes, () => {});

console.log("Status:", mockRes.statusCode); // 403
console.log("Audit Entry:", mockLogger.logs[0].event, mockLogger.logs[0].reason || mockLogger.logs[0].role); 
// AUTH_DENIED guest
```

**Testing & Architectural Benefits:**
1. **Zero Global State:** The middleware does not import a singleton database or config file; dependencies (`allowedRoles`, `auditLogger`) are passed into the factory.
2. **Encapsulation:** The internal `roleSet` is private and protected from mutation after initialization.
3. **High Performance:** Computing the `new Set(allowedRoles)` happens once during setup, not on every incoming HTTP request.
4. **Effortless Unit Testing:** Stubs and mocks (like `mockLogger`) can be injected directly into the factory function without using mock libraries or monkey-patching globals.

---

<nav aria-label="Lecture navigation">

[← Day 07: Errors and Exception Flow](day-07-errors-and-exception-flow.md) | [Roadmap](../javascript-roadmap.md) | [Day 09: Objects and Property Access →](day-09-objects-and-property-access.md)

</nav>
