# Day 10: Prototypes, Classes, and Inheritance

<nav aria-label="Lecture navigation">

[← Day 09: Objects and Property Access](day-09-objects-and-property-access.md) | [Roadmap](../javascript-roadmap.md) | [Day 11: Property Descriptors, Enumerability, and Immutability →](day-11-property-descriptors-and-immutability.md)

</nav>

---

## What You Will Learn Today

By the end of this lecture, you should be able to:

- Explain how JavaScript resolves property access along the prototype chain (`[[Prototype]]`).
- Trace the exact 4-step execution algorithm of the `new` operator.
- Demystify ES2015+ `class` syntax as declarative syntactic sugar over prototypal delegation.
- Distinguish instance methods (on `Class.prototype`) from static methods (on `Class`) and public/private fields.
- Use `extends` and `super` correctly, recognizing why `super()` must precede `this` in derived constructors.
- Understand how constructor return values behave when returning objects vs. primitives.
- Encapsulate internal state using truly private fields (`#field`) and explain how they differ from symbol or underscore conventions.
- Evaluate the tradeoffs between Class Inheritance ("is-a") and Composition ("has-a") for Node.js backend services.

**Prerequisites:** [Day 08 – Closures, Execution Context, and this](day-08-closures-execution-context-and-this.md) (`this` binding rules, `new` binding) and [Day 09 – Objects and Property Access](day-09-objects-and-property-access.md) (own vs. inherited properties, `Object.create`).  
*Upcoming Connections:* [Day 11](day-11-property-descriptors-and-immutability.md) explores property descriptors (`writable`, `enumerable`, `configurable`) and immutability; [Day 12](day-12-built-in-data-structures-and-serialization.md) covers built-in collections and JSON serialization.

---

## Quick Vocabulary Card

| Term | Definition |
| :--- | :--- |
| **`[[Prototype]]`** | The internal, hidden link present on every JavaScript object pointing to its parent prototype object or `null`. |
| **`prototype` Property** | An ordinary object property present on regular functions and classes used as the blueprint for `[[Prototype]]` on instances created via `new`. |
| **Constructor Function** | A regular function designed to be invoked with `new` to initialize and return a new object instance. |
| **`new` Operator** | A language operator that creates a fresh object, links its prototype, executes the constructor with `this`, and returns the instance. |
| **Prototypal Delegation** | A language design where objects delegate property lookups up a chain of prototype objects rather than copying behaviors. |
| **Class** | An ES2015 syntax construct providing a clean, declarative syntax for constructor functions, prototype methods, and inheritance. |
| **Instance Method** | A method defined on `Class.prototype` shared by all instances, receiving the instance as `this`. |
| **Static Method** | A method defined directly on the class constructor itself, callable as `Class.method()` without creating an instance. |
| **Private Field (`#field`)** | A class property prefixed with `#` whose access is strictly restricted by the engine to the class body. |
| **`extends` Keyword** | A syntax keyword establishing inheritance links between subclass and superclass prototypes and constructors. |
| **`super` Keyword** | A keyword used in derived classes to call the parent constructor (`super()`) or access parent methods (`super.method()`). |
| **Composition** | An architectural pattern where complex functionality is achieved by assembling smaller, independent collaborators ("has-a") rather than inheriting ("is-a"). |

---

## 1. The Prototype Chain and `[[Prototype]]`

In JavaScript, **inheritance is prototypal, not classical**. Every ordinary object possesses an internal pointer—referred to in the ECMAScript specification as **`[[Prototype]]`**—that points to another object or `null`.

When you read a property on an object, JavaScript first inspects the object's **own properties**. If the property is absent, it follows `[[Prototype]]` to the parent object, continuing up the chain until it finds the property or reaches `null` (the end of the prototype chain).

```
                            The Prototype Chain
┌────────────────────────┐
│ dog instance           │
│ own properties:        │
│   name: "Rex"          │
│ [[Prototype]]          │───┐
└────────────────────────┘   │
                             ▼
                ┌────────────────────────┐
                │ Animal.prototype       │
                │ shared methods:        │
                │   eat() { ... }        │
                │ [[Prototype]]          │───┐
                └────────────────────────┘   │
                                             ▼
                                ┌────────────────────────┐
                                │ Object.prototype       │
                                │ base methods:          │
                                │   toString()           │
                                │   valueOf()            │
                                │ [[Prototype]] ──► null │
                                └────────────────────────┘
```

### Inspecting and Setting Prototypes

- **`Object.getPrototypeOf(obj)`:** The standard, safe way to read an object's prototype.
- **`Object.setPrototypeOf(obj, newProto)`:** Mutates an object's prototype (use sparingly; this degrades engine JIT optimizations).
- **`__proto__`:** A legacy accessor property exposed on `Object.prototype`. Standardized for web compatibility, but `Object.getPrototypeOf()` is preferred in modern code.

```js
// Node.js code
const baseWorker = {
  role: "general",
  performTask() {
    return `${this.name} performing ${this.role} task`;
  }
};

// Create an instance delegating to baseWorker
const workerAlice = Object.create(baseWorker);
workerAlice.name = "Alice";

console.log(workerAlice.name);          // "Alice" (own property)
console.log(workerAlice.role);          // "general" (delegated to baseWorker)
console.log(workerAlice.performTask()); // "Alice performing general task"

// ✅ Inspecting prototypes standardly
console.log(Object.getPrototypeOf(workerAlice) === baseWorker); // true
console.log(Object.hasOwn(workerAlice, "role"));                // false
console.log("role" in workerAlice);                             // true
```

---

## 2. Constructor Functions and the `new` Operator

Before classes were introduced in ES2015, constructor functions were the primary mechanism for creating instances with shared prototype methods.

### The 4-Step Algorithm of `new`

When a function is called with the `new` keyword (e.g., `new DatabaseClient(config)`), the JavaScript engine executes the following steps:

1. **Creates a brand-new empty object:** A new plain object `{}` is allocated in memory.
2. **Sets prototype linkage:** The new object’s internal `[[Prototype]]` is set to the constructor function’s `.prototype` property.
3. **Executes the constructor:** The constructor function is executed with `this` bound to the newly created object.
4. **Returns the instance:** If the constructor returns an object, that object is returned. Otherwise, the newly created object (`this`) is returned.

```js
// Node.js code
function User(name, email) {
  // Step 3: 'this' points to the newly allocated object
  this.name = name;
  this.email = email;
}

// Attach shared methods to the function's .prototype property
User.prototype.sendEmail = function(subject) {
  return `Sending '${subject}' to ${this.email}`;
};

// Instantiate via 'new'
const user1 = new User("Alice", "alice@example.com");
const user2 = new User("Bob", "bob@example.com");

console.log(user1.sendEmail("Welcome!")); // "Sending 'Welcome!' to alice@example.com"

// ✅ Shared prototype identity: methods are NOT duplicated in memory
console.log(user1.sendEmail === user2.sendEmail); // true
console.log(Object.getPrototypeOf(user1) === User.prototype); // true

// ❌ Calling without 'new' in non-strict mode pollutes global; in strict mode throws TypeError
// const brokenUser = User("Charlie", "charlie@example.com"); // TypeError in strict mode!
```

---

## 3. ES2015+ Classes: Syntactic Sugar Over Prototypes

ES2015 introduced the **`class`** keyword. Classes do **not** introduce a new object-oriented inheritance model to JavaScript; under the hood, classes still compile directly to constructor functions and prototype delegation.

```js
// Node.js code
class CacheStore {
  // Constructor: runs when 'new CacheStore()' is invoked
  constructor(defaultTtl = 60) {
    this.defaultTtl = defaultTtl;
    this.store = new Map();
  }

  // Instance method: stored on CacheStore.prototype
  set(key, val) {
    this.store.set(key, val);
  }

  get(key) {
    return this.store.get(key);
  }
}

const cache = new CacheStore(300);
cache.set("session_1", { userId: 42 });

console.log(cache.get("session_1")); // { userId: 42 }
console.log(typeof CacheStore);      // "function" (a class is still a function!)
console.log(cache.get === CacheStore.prototype.get); // true (stored on prototype)
```

### Key Differences Between Classes and Constructor Functions

| Feature | Constructor Function | ES2015+ `class` |
| :--- | :--- | :--- |
| **Invocation without `new`** | Allowed in non-strict mode (pollutes `global`) | Throws `TypeError: Class constructor cannot be invoked without 'new'` |
| **Hoisting** | Fully hoisted (callable before declaration) | Lives in the Temporal Dead Zone (TDZ); not hoisted |
| **Execution Mode** | Can run in sloppy mode | Entire class body runs in **strict mode** automatically |
| **Method Enumerability** | Prototype methods are enumerable by default | Prototype methods are **non-enumerable** by default |
| **Syntax** | Verbose: `fn.prototype.method = ...` | Clean, consolidated declaration block |

---

## 4. Class Elements: Instance, Static, and Private

Modern ECMAScript provides distinct syntax for configuring instance properties, static class properties, and truly private fields.

```js
// Node.js code
class OrderService {
  // 1. Static field: stored on OrderService constructor itself
  static MAX_PENDING_ORDERS = 1000;

  // 2. Private field (ES2022+): accessible ONLY within this class body
  #encryptionKey;
  #orderCount = 0;

  constructor(encryptionKey) {
    // 3. Public instance field
    this.serviceName = "OrdersMicroservice";
    this.#encryptionKey = encryptionKey;
  }

  // 4. Instance method: stored on OrderService.prototype
  createOrder(item) {
    this.#orderCount++;
    return `Order for ${item} secured with key ${this.#encryptionKey.slice(0, 4)}***`;
  }

  // 5. Static method: called as OrderService.isOperational()
  static isOperational() {
    return true;
  }

  getOrderStats() {
    return { count: this.#orderCount };
  }
}

const service = new OrderService("secret_production_key_9988");

// ✅ Instance method access
console.log(service.createOrder("Server Rack")); 
// "Order for Server Rack secured with key secr***"

// ✅ Static method access via constructor
console.log("Operational:", OrderService.isOperational()); // true

// ❌ Calling static method on instance returns undefined or throws TypeError
// service.isOperational(); // TypeError: service.isOperational is not a function

// ❌ Attempting to read private field outside class throws SyntaxError
// console.log(service.#encryptionKey); // SyntaxError: Private field '#encryptionKey' must be declared in an enclosing class
```

### Why `#private` Fields Matter

Prior to `#private` syntax, developers relied on naming conventions (`_secret`) or Symbols. However:
- `_secret` is merely a convention; external callers can still read or mutate it.
- Symbols can be inspected and retrieved via `Object.getOwnPropertySymbols(instance)`.
- `#field` is **hard privacy** enforced by the JavaScript engine: it cannot be inspected with `Object.keys()`, `Reflect.ownKeys()`, or dynamic bracket notation (`this[#field]`).

---

## 5. Inheritance with `extends` and `super`

The **`extends`** keyword creates a subclass, establishing two distinct prototype linkages:
1. **Instance linkage:** `SubClass.prototype.__proto__ === SuperClass.prototype` (inherits instance methods).
2. **Static linkage:** `SubClass.__proto__ === SuperClass` (inherits static methods and properties!).

The **`super`** keyword has two usages:
- In derived constructors: `super(...args)` invokes the parent class constructor.
- In derived methods: `super.method()` delegates to the parent method while keeping `this` bound to the current instance.

```js
// Node.js code
class BaseTransport {
  constructor(host, port) {
    this.host = host;
    this.port = port;
  }

  connect() {
    return `Connecting to ${this.host}:${this.port}`;
  }

  static getProtocol() {
    return "tcp";
  }
}

class HttpTransport extends BaseTransport {
  constructor(host, port, secure = true) {
    // ⚠️ MUST call super() before accessing 'this'!
    super(host, port);
    this.secure = secure;
  }

  // Override connect() method
  connect() {
    const baseConn = super.connect(); // Call parent implementation
    return `${baseConn} via ${this.secure ? "HTTPS" : "HTTP"}`;
  }
}

const client = new HttpTransport("api.service.local", 443);
console.log(client.connect()); 
// "Connecting to api.service.local:443 via HTTPS"

// ✅ Static methods are inherited automatically via static prototype linkage
console.log("Protocol:", HttpTransport.getProtocol()); // "tcp"

// ✅ instanceof walks the prototype chain
console.log(client instanceof HttpTransport); // true
console.log(client instanceof BaseTransport); // true
console.log(client instanceof Object);        // true
```

### The `super()` Ordering Rule

In a derived class constructor, you **cannot use `this` before calling `super()`**. 

In classical engines, the derived class constructor does not initialize the instance's `this` binding; the base class constructor creates and initializes `this`. Calling `this` before `super()` throws `ReferenceError: Must call super constructor in derived class before accessing 'this'`.

---

## 6. Constructor Return Value Behavior

A constructor usually returns the instance `this` implicitly. However, if an explicit `return` statement is written inside a constructor:

- **Returning an Object / Function:** The explicitly returned object **replaces** `this`. The caller receives the returned object.
- **Returning a Primitive (`number`, `string`, `boolean`, `null`, `undefined`):** The primitive is **ignored**, and `this` is returned normally.

```js
// Node.js code
class RegularClass {
  constructor(id) {
    this.id = id;
    return "primitive_string"; // ⚠️ Ignored!
  }
}

class OverridingClass {
  constructor(id) {
    this.id = id;
    // ⚠️ Explicit object replacement!
    return { hijacked: true, customId: `custom_${id}` };
  }
}

const regular = new RegularClass(101);
console.log("Regular return:", regular.id); // 101 (returned 'this')

const overridden = new OverridingClass(202);
console.log("Overridden return:", overridden); // { hijacked: true, customId: 'custom_202' }
console.log("Is instance of OverridingClass?", overridden instanceof OverridingClass); // false!
```

---

## 7. Composition vs. Inheritance

A fundamental software engineering design decision is choosing between **Class Inheritance** and **Object Composition**.

```
    Inheritance ("is-a")                      Composition ("has-a")
┌───────────────────────────┐        ┌───────────────────────────────────┐
│        BaseService        │        │          PaymentService           │
└─────────────┬─────────────┘        ├───────────────────────────────────┤
              │ extends              │ - validator: CardValidator        │
              ▼                      │ - gateway: StripeGateway          │
┌───────────────────────────┐        │ - logger: AuditLogger             │
│       StripePayment       │        └───────────────────────────────────┘
│ tightly coupled to base   │          Dependencies injected;
│ hard to test in isolation │          easily mocked and replaced.
└───────────────────────────┘
```

### Comparing the Two Models

- **Inheritance ("is-a"):** Best when entities share a deep, fixed behavioral hierarchy with strict substitutability. Fragile when parent classes evolve or when subclasses require only a subset of parent functionality.
- **Composition ("has-a"):** Assembles behavior from small, focused collaborator objects. Dependencies can be injected dynamically, making unit testing and swapping implementations trivial.

```js
// Node.js code
// ✅ COMPOSITION PATTERN (Recommended for Node.js services)

class EmailSender {
  send(to, body) {
    return `Email sent to ${to}: ${body}`;
  }
}

class SmsSender {
  send(to, body) {
    return `SMS sent to ${to}: ${body}`;
  }
}

class NotificationService {
  // Collaborator is injected via constructor (Dependency Injection)
  constructor(sender) {
    this.sender = sender;
  }

  notifyUser(user, message) {
    return this.sender.send(user.contact, message);
  }
}

// Easily swap strategies at runtime without changing NotificationService:
const emailService = new NotificationService(new EmailSender());
console.log(emailService.notifyUser({ contact: "alice@test.com" }, "Order shipped"));

const smsService = new NotificationService(new SmsSender());
console.log(smsService.notifyUser({ contact: "+1234567890" }, "Your code is 1234"));
```

---

## Tricky Points

### 1. Prototype Array Mutation Pitfall
Placing a mutable array or object directly on a constructor’s prototype or class body shares that single reference across **all** instances.
```js
// Node.js code
function Account(name) { this.name = name; }
Account.prototype.transactions = []; // ❌ Bug: Shared across all instances!

const a1 = new Account("Alice");
const a2 = new Account("Bob");
a1.transactions.push(100);
console.log(a2.transactions); // [ 100 ] (Bob's account was mutated!)

// ✅ Fix: Always initialize mutable state inside the constructor (on 'this')
function SafeAccount() { this.transactions = []; }
```

### 2. Method Overriding Without Calling `super`
If a subclass overrides a parent method and omits `super.method()`, the parent logic is completely skipped. Ensure omission is intentional.

### 3. Calling `super()` in Derived Constructors
Accessing `this` before `super()` in a derived class throws an immediate `ReferenceError`.

### 4. `instanceof` Fails Across Isolated Contexts
`instanceof` checks if `Constructor.prototype` exists anywhere on the instance's prototype chain. If an object is created in a different Node.js `vm` context, worker thread, or duplicate npm package version, its prototype references a different memory address, causing `instanceof` to return `false`.

### 5. Private Fields Cannot Be Accessed Dynamically
You cannot access private fields using dynamic strings: `this[#field]` or `this["#field"]` throws a `SyntaxError`.

### 6. Static Methods are Not Inherited by Instances
Static methods live on the constructor (`Class.method()`), not on `Class.prototype`. Calling `instance.staticMethod()` returns `undefined` or throws `TypeError`.

---

## Hands-on Exercise

### Scenario: Refactoring Fragile Payment Processing with Composition

You are maintaining a payment gateway integration in an Express service. The legacy system used deep inheritance, resulting in fragile base class bugs and testability issues.

### Buggy Code

```js
// Node.js code (Buggy Legacy Architecture)
class LegacyPaymentService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.logs = []; // Shared mutation risk if on prototype
  }

  process(amount) {
    if (!this.apiKey) throw new Error("Missing API Key");
    this.logs.push(`Processing $${amount}`);
    return { success: true, amount };
  }
}

class CryptoPaymentService extends LegacyPaymentService {
  constructor(apiKey, network) {
    // Bug 1: Accessing 'this' before super()
    this.network = network;
    super(apiKey);
  }

  process(amount) {
    // Bug 2: Returns primitive; hides parent validation
    return "crypto-processed"; 
  }
}
```

### Acceptance Criteria

1. **Fix Constructor Initialization:** Correct the derived class initialization order so `super()` runs before any `this` property assignments.
2. **Refactor to Composition:** Replace the inheritance hierarchy with a `PaymentProcessor` class that accepts a pluggable `PaymentStrategy` collaborator (`StripeStrategy`, `CryptoStrategy`).
3. **Encapsulate Secrets:** Secure API keys and private wallet credentials using ES2022 `#private` class fields.
4. **Mockable Unit Testing:** Demonstrate testing the processor with a mock strategy that records payments without external calls.

### Solution

```js
// Node.js code

// 1. Payment Strategies (Collaborators)
class StripeStrategy {
  #apiKey;
  constructor(apiKey) {
    if (!apiKey) throw new Error("Stripe API key required");
    this.#apiKey = apiKey;
  }

  executePayment(amount, recipient) {
    return {
      provider: "Stripe",
      status: "COMPLETED",
      txId: `ch_${Math.random().toString(36).substring(2, 9)}`,
      amount,
      recipient
    };
  }
}

class CryptoStrategy {
  #walletKey;
  constructor(walletKey, network = "Polygon") {
    if (!walletKey) throw new Error("Wallet key required");
    this.#walletKey = walletKey;
    this.network = network;
  }

  executePayment(amount, recipient) {
    return {
      provider: `Crypto (${this.network})`,
      status: "CONFIRMED",
      txId: `0x${Math.random().toString(36).substring(2, 12)}`,
      amount,
      recipient
    };
  }
}

// 2. High-Level Service Built with Composition
class PaymentProcessor {
  #strategy;
  #auditLog = [];

  constructor(strategy) {
    this.setStrategy(strategy);
  }

  setStrategy(strategy) {
    if (!strategy || typeof strategy.executePayment !== "function") {
      throw new TypeError("Strategy must implement executePayment()");
    }
    this.#strategy = strategy;
  }

  process(amount, recipient) {
    if (typeof amount !== "number" || amount <= 0) {
      throw new RangeError("Payment amount must be a positive number");
    }

    const receipt = this.#strategy.executePayment(amount, recipient);
    this.#auditLog.push({ timestamp: Date.now(), txId: receipt.txId, amount });
    return receipt;
  }

  getAuditLogs() {
    // Return a shallow copy to prevent external mutation of audit log
    return [...this.#auditLog];
  }
}

// --- Verification & Testing ---

// Test 1: Process Stripe Payment
const stripeProcessor = new PaymentProcessor(new StripeStrategy("sk_live_12345"));
const stripeTx = stripeProcessor.process(150, "merchant_99");
console.log("Test 1 Result:", stripeTx.provider, stripeTx.status, stripeTx.txId);

// Test 2: Swap strategy to Crypto
stripeProcessor.setStrategy(new CryptoStrategy("priv_wallet_key_abc", "Ethereum"));
const cryptoTx = stripeProcessor.process(2.5, "0xUserWalletAddress");
console.log("Test 2 Result:", cryptoTx.provider, cryptoTx.status, cryptoTx.txId);

// Test 3: Unit Testing with Mock Strategy (Zero external network dependencies)
const mockStrategy = {
  calls: [],
  executePayment(amount, recipient) {
    this.calls.push({ amount, recipient });
    return { provider: "Mock", status: "MOCKED", txId: "mock_001" };
  }
};

const testProcessor = new PaymentProcessor(mockStrategy);
testProcessor.process(500, "test_recipient");
console.log("Test 3 Mock Verification:", mockStrategy.calls.length === 1); // true
console.log("Audit log count:", testProcessor.getAuditLogs().length);     // 1
```

---

## Summary

- **Prototypes Under the Hood:** JavaScript objects inherit properties via the `[[Prototype]]` chain ending at `null`. Property reads traverse upward; property writes create own properties.
- **The `new` Keyword Algorithm:** Creates an empty object, links its prototype to `Constructor.prototype`, executes the function with `this`, and returns the instance.
- **Classes are Syntactic Sugar:** Classes compile to constructor functions and prototypes. They run in strict mode, cannot be called without `new`, and live in the TDZ.
- **Instance vs. Static Methods:** Instance methods reside on `Class.prototype` and are shared by all instances. Static methods reside on the constructor function itself.
- **Inheritance with `extends`:** Connects both instance prototypes and static constructor prototypes. `super()` must execute before accessing `this` in derived constructors.
- **Hard Privacy with `#`:** Private fields (`#field`) are strictly isolated by the engine and cannot be accessed from outside the class body or through bracket notation.
- **Favor Composition Over Inheritance:** Assembling services from small, injected collaborator objects creates resilient, testable Node.js architectures that avoid brittle inheritance hierarchies.

---

## Cheat Sheet

### Class Elements Quick Reference

| Element | Syntax | Stored On | Invocation / Access |
| :--- | :--- | :--- | :--- |
| **Instance Method** | `method() {}` | `Class.prototype` | `instance.method()` |
| **Static Method** | `static method() {}` | `Class` constructor | `Class.method()` |
| **Instance Field** | `prop = val;` | `instance` (own) | `instance.prop` |
| **Private Field** | `#prop = val;` | Engine private slot | `this.#prop` (class body only) |
| **Static Private Field** | `static #prop = val;` | Engine private slot | `Class.#prop` (class body only) |

### Inheritance vs. Composition

| Dimension | Inheritance (`extends`) | Composition |
| :--- | :--- | :--- |
| **Relationship** | "is-a" | "has-a" |
| **Coupling** | Tight (subclass depends on base internals) | Loose (interacts via public API) |
| **Runtime Swapping** | Difficult (class hierarchy fixed) | Trivial (swap collaborator instance) |
| **Testability** | Harder (requires mocking base class) | Simple (inject mock stubs directly) |

### Common Pitfalls

- **Accessing `this` before `super()` in a subclass** → throws `ReferenceError: Must call super constructor in derived class before accessing 'this'`.
- **Calling static methods on instances** → `instance.staticMethod()` is `undefined` because static methods live on the class constructor, not on `Class.prototype`.
- **Storing mutable arrays on prototypes** → mutates state across all instances. Initialize arrays and objects inside the constructor.
- **Assuming `class` creates a new object model** → `typeof Class === "function"`. Classes use standard prototype delegation.
- **Forgetting constructor return rules** → returning an explicit object replaces `this`, while returning a primitive has no effect.

---

## Interview Questions

### 1. What exact sequence of operations occurs when a function is called with the `new` keyword?

**Question:** Explain the step-by-step internal algorithm executed by JavaScript when the `new` operator is invoked with a constructor function.

**Answer:**
When `new Constructor(...args)` is called, the JavaScript engine executes the following steps:
1. **Object Allocation:** A new plain JavaScript object is created in memory (conceptually equivalent to `{}`).
2. **Prototype Linkage:** The engine sets the new object’s internal `[[Prototype]]` property to point to `Constructor.prototype`. (If `Constructor.prototype` is not an object, it defaults to `Object.prototype`).
3. **Execution with `this` Binding:** The `Constructor` function is invoked with its `this` context bound to the newly created object, passing along all provided arguments (`...args`).
4. **Return Value Resolution:**
   - If the constructor explicitly returns a non-primitive value (an `Object`, `Array`, or `Function`), that returned object becomes the result of the `new` expression, and the newly created `this` object is discarded.
   - If the constructor returns a primitive value (like a `number`, `string`, `boolean`, `null`, or `undefined`), or has no return statement, the newly created `this` object is returned to the caller.

---

### 2. Predict the Output: Prototype Shadowing and Constructor Return Overrides

```js
function Vehicle(wheels) {
  this.wheels = wheels;
  return { customWheels: wheels * 2 };
}

Vehicle.prototype.getWheels = function() {
  return this.wheels;
};

const v1 = new Vehicle(4);
console.log(v1.wheels);
console.log(v1.customWheels);
console.log(v1 instanceof Vehicle);
```

**Question:** What does this code print to the console? Explain why `v1 instanceof Vehicle` evaluates to `false`.

**Answer:**
**Output:**
```text
undefined
8
false
```

**Explanation:**
1. Inside `Vehicle`, `this.wheels` is initially assigned `4` on the newly created instance.
2. However, the constructor explicitly returns an object: `{ customWheels: 4 * 2 }`.
3. In accordance with the `new` operator algorithm, returning an object replaces the newly created `this` instance. `v1` is assigned the returned object literal `{ customWheels: 8 }`.
4. As a result:
   - `v1.wheels` is `undefined` because the returned object does not have a `wheels` property.
   - `v1.customWheels` evaluates to `8`.
   - `v1 instanceof Vehicle` checks whether `Vehicle.prototype` exists in `v1`'s prototype chain. Because `v1` is a plain object literal, its prototype is `Object.prototype`, not `Vehicle.prototype`. Thus, `instanceof` evaluates to `false`.

---

### 3. Debugging: Diagnosing a Subclass Constructor Crash and Shared Prototype State

```js
class CacheItem {
  constructor(key) {
    this.key = key;
  }
}

class TimedCacheItem extends CacheItem {
  constructor(key, ttl) {
    this.ttl = ttl;
    super(key);
  }
}

TimedCacheItem.prototype.tags = [];

const item1 = new TimedCacheItem("session", 60);
const item2 = new TimedCacheItem("auth", 120);

item1.tags.push("secure");
console.log("Item 2 tags:", item2.tags);
```

**Question:** Running this code immediately throws a runtime error. If that error is resolved, a severe data corruption bug occurs. Identify both issues and provide the corrected code.

**Answer:**
**Issue 1 (Runtime Error):**
In `TimedCacheItem`, `this.ttl = ttl` is evaluated before calling `super(key)`. In JavaScript derived classes, accessing `this` before `super()` throws `ReferenceError: Must call super constructor in derived class before accessing 'this'`.

**Issue 2 (Shared State Mutation):**
`TimedCacheItem.prototype.tags = []` defines the `tags` array on the prototype object rather than on instance objects. When `item1.tags.push("secure")` runs, it finds `tags` on the prototype and mutates the shared array, causing `item2.tags` to also reflect `["secure"]`.

**Corrected Code:**
```js
// Node.js code
class CacheItem {
  constructor(key) {
    this.key = key;
  }
}

class TimedCacheItem extends CacheItem {
  constructor(key, ttl) {
    // 1. Call super() first
    super(key);
    this.ttl = ttl;
    // 2. Initialize mutable state per instance
    this.tags = [];
  }
}

const item1 = new TimedCacheItem("session", 60);
const item2 = new TimedCacheItem("auth", 120);

item1.tags.push("secure");
console.log("Item 1 tags:", item1.tags); // [ 'secure' ]
console.log("Item 2 tags:", item2.tags); // [] (Completely isolated! ✅)
```

---

### 4. Node.js Backend Scenario: Refactoring Deep Inheritance into Pluggable Composition

**Question:** An enterprise Node.js microservice models database repositories using deep inheritance: `Repository` $\rightarrow$ `CachedRepository` $\rightarrow$ `AuditedRepository` $\rightarrow$ `PostgresAuditedRepository`. Explain why deep inheritance hierarchies become fragile in production services, and refactor this structure into a modular design using composition (Decorator or Strategy pattern).

**Answer:**
**Why Deep Inheritance Fails in Production:**
1. **Fragile Base Class Problem:** Changes made to `Repository` or `CachedRepository` can inadvertently break assumptions and methods in `PostgresAuditedRepository`.
2. **Combinatorial Explosion:** If a team later needs `MongoAuditedRepository` or `PostgresNonCachedRepository`, they must duplicate classes or build deeply convoluted inheritance trees.
3. **Rigid Unit Testing:** Testing `PostgresAuditedRepository` requires setting up database connections, cache connections, and audit logging simultaneously.

**Refactoring with Composition (Decorator Pattern):**

```js
// Node.js code

// 1. Base Repository Contract / Implementation
class PostgresUserRepository {
  async findById(id) {
    // Simulating database query
    return { id, name: "Alice", role: "admin" };
  }
}

// 2. Decorator 1: Caching Layer
class CachedUserRepository {
  constructor(innerRepository, cacheClient) {
    this.inner = innerRepository;
    this.cache = cacheClient;
  }

  async findById(id) {
    const cacheKey = `user:${id}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const data = await this.inner.findById(id);
    this.cache.set(cacheKey, data);
    return data;
  }
}

// 3. Decorator 2: Audit Logging Layer
class AuditedUserRepository {
  constructor(innerRepository, logger) {
    this.inner = innerRepository;
    this.logger = logger;
  }

  async findById(id) {
    this.logger.log(`AUDIT: Accessing user ${id}`);
    const result = await this.inner.findById(id);
    this.logger.log(`AUDIT: Successfully retrieved user ${id}`);
    return result;
  }
}

// --- Composing Layers Cleanly ---
const baseRepo = new PostgresUserRepository();
const memoryCache = new Map();
const cachedRepo = new CachedUserRepository(baseRepo, memoryCache);
const auditedCachedRepo = new AuditedUserRepository(cachedRepo, console);

// Execution:
auditedCachedRepo.findById(42).then(user => console.log("Retrieved:", user.name));
```

**Benefits:**
- **Single Responsibility:** Each class has exactly one job (storage, caching, or auditing).
- **Infinite Flexibility:** Layers can be assembled in any order or conditionally enabled based on environment flags (e.g., omitting cache in development).
- **Effortless Mocking:** Each decorator can be tested in total isolation using lightweight mock objects.

---

<nav aria-label="Lecture navigation">

[← Day 09: Objects and Property Access](day-09-objects-and-property-access.md) | [Roadmap](../javascript-roadmap.md) | [Day 11: Property Descriptors, Enumerability, and Immutability →](day-11-property-descriptors-and-immutability.md)

</nav>
