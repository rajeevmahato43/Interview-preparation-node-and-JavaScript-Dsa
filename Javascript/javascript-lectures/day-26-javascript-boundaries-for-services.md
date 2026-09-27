# Day 26: JavaScript Boundaries in Services

<nav aria-label="Lecture navigation">

[← Previous Day: Day 25 - Security-Relevant JavaScript Behavior](day-25-security-relevant-javascript.md) | [Roadmap](../javascript-roadmap.md) | [Next Day: Day 27 - Concurrency and Resource-Safe Async Code →](day-27-concurrency-and-resource-safe-async.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Architect backend JavaScript services using the "Functional Core, Imperative Shell" (Hexagonal/Clean Architecture) paradigm.
- Separate deterministic business decisions from asynchronous I/O and side effects.
- Implement Dependency Injection in idiomatic JavaScript using higher-order factory functions and parameter destructuring without heavy reflection containers.
- Delineate resource ownership contracts between "owned" (caller lifecycle) and "borrowed" (callee lifecycle) references.
- Define a domain-driven error taxonomy that cleanly differentiates validation errors, domain rule violations, and infrastructure failures.
- Enforce immutability and defensive copying at public API boundaries to prevent caller state corruption.

---

## Vocabulary Card

| Term | Plain Definition | Everyday Analogy |
| :--- | :--- | :--- |
| **Functional Core** | The innermost layer of an application containing pure, deterministic business logic with zero I/O, network calls, or clock dependencies. | An accountant’s ledger formula; given income and deduction numbers, it calculates exact tax owed without caring what bank holds the cash. |
| **Imperative Shell** | The outer orchestration layer that handles network I/O, database queries, file systems, and time, passing clean data into the functional core. | The customer service representative who collects forms from clients, hands them to the accountant, and mails back the finalized checks. |
| **Dependency Injection (DI)** | A design pattern where a function or class receives its external dependencies as parameters rather than importing or creating them internally. | A power tool designed with a standardized removable battery slot rather than a battery permanently soldered inside the casing. |
| **Borrowed Resource** | An external resource handle (e.g. database client, socket) passed into a function where the function is **forbidden** from closing or destroying it. | A book borrowed from a library; you may read and reference it, but you must not throw it into an incinerator when done. |
| **Owned Resource** | A resource allocated directly by a component that carries the strict responsibility of lifecycle cleanup and teardown. | A rental car company owning a vehicle fleet; it must service, clean, and decommission cars it purchased. |

---

## Core Concepts

### 1. Functional Core, Imperative Shell

In high-reliability Node.js architectures, services are divided into two distinct responsibilities:
1. **The Core (Pure):** Computes *what* should happen. Given identical inputs, it always returns identical outputs without side effects.
2. **The Shell (Impure/Async):** Executes *how* it happens. Gathers inputs from databases, calls external APIs, queries clocks, and persists results.

```javascript
// Node.js code
// ✅ FUNCTIONAL CORE: 100% Pure, 0% I/O, trivially testable!
function calculateSubscriptionDiscount(subscription, now) {
  if (!subscription || typeof subscription.tier !== "string") {
    throw new TypeError("Invalid subscription record");
  }

  const isAnniversary = now.getUTCMonth() === 11; // December promotion
  const isVip = subscription.tier === "enterprise" && subscription.tenureYears >= 2;

  let discountPercent = 0;
  if (isVip) discountPercent += 20;
  if (isAnniversary) discountPercent += 10;

  return {
    discountPercent: Math.min(discountPercent, 25), // Cap at 25%
    eligibleForGift: isVip,
  };
}

// ✅ IMPERATIVE SHELL: Orchestrates I/O and delegates decisions to the pure core
async function applyDiscountService({ subscriptionId, dbClient, clock = () => new Date() }) {
  // 1. I/O: Retrieve data
  const sub = await dbClient.findSubscription(subscriptionId);
  if (!sub) throw new Error("Subscription not found");

  // 2. Pure Core: Make business decision
  const decision = calculateSubscriptionDiscount(sub, clock());

  // 3. I/O: Persist decision
  await dbClient.updateDiscount(subscriptionId, decision.discountPercent);

  return decision;
}
```

### 2. Idiomatic Dependency Injection in JavaScript

JavaScript does not require heavy, reflection-based dependency injection frameworks. Clean DI is achieved via simple parameter destructuring or factory functions:

```javascript
// Node.js code
// Factory Pattern DI:
function createBillingService({ paymentGateway, userRepo, logger }) {
  // Enforce required dependencies at boot time:
  if (!paymentGateway || !userRepo) {
    throw new Error("Missing required service dependencies");
  }

  return {
    async processMonthlyBill(userId, amount) {
      logger?.info(`Processing bill for user: ${userId}`);
      const user = await userRepo.findById(userId);
      const receipt = await paymentGateway.charge(user.billingToken, amount);
      return receipt;
    },
  };
}

// In production:
// const service = createBillingService({ paymentGateway: stripeClient, userRepo: pgRepo, logger: winston });

// In unit tests:
// const service = createBillingService({ paymentGateway: mockGateway, userRepo: fakeRepo });
```

### 3. Resource Ownership Contracts: Owned vs. Borrowed

A frequent cause of production crashes is resource ownership confusion (e.g. a middleware closing a database connection that subsequent handlers still need):

```javascript
// Node.js code
// ❌ FLAWED: Callee closes a borrowed resource!
async function generateReport(dbClient) { // dbClient is BORROWED!
  try {
    const data = await dbClient.query("SELECT * FROM reports");
    return processData(data);
  } finally {
    // ⚠️ FATAL BUG: Closing a connection owned by the caller pool!
    await dbClient.close();
  }
}

// ✅ CORRECT: The component that OPENS the resource must CLOSE the resource:
async function runReportJob(connectionPool) {
  // connection is OWNED by runReportJob
  const connection = await connectionPool.acquire();
  try {
    // Pass connection as BORROWED to report generator
    return await generateReportSafe(connection);
  } finally {
    await connectionPool.release(connection); // Owner releases it!
  }
}

async function generateReportSafe(borrowedClient) {
  const data = await borrowedClient.query("SELECT * FROM reports");
  return data.rows; // Does NOT touch connection lifecycle!
}
```

### 4. Structured Error Taxonomy

A production service must structure errors into explicit, actionable domain layers:

```javascript
// Node.js code
// 1. Root Domain Error
class DomainError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

// 2. Validation Error (HTTP 400 Bad Request)
class ValidationError extends DomainError {
  constructor(fields, message = "Validation failed") {
    super(message);
    this.fields = fields; // { email: 'Invalid format' }
    this.statusCode = 400;
  }
}

// 3. Entity Not Found Error (HTTP 404 Not Found)
class NotFoundError extends DomainError {
  constructor(entityName, id) {
    super(`${entityName} with id "${id}" was not found`);
    this.statusCode = 404;
  }
}

// 4. Infrastructure Error (HTTP 502/503 Gateway Failure)
class InfrastructureError extends DomainError {
  constructor(serviceName, options) {
    super(`Downstream service "${serviceName}" failed to respond`, options);
    this.statusCode = 502;
  }
}
```

---

## Detailed Explanations and Traces

### Trace 1: Tracing the Boundary Flow of an Order Service

```
[ External HTTP Request ]
          |
          v
[ Boundary 1: Validation & DTO Mapping ]  --> Drops unallowed keys; normalizes strings
          |
          v
[ Imperative Shell: OrderService.checkout() ]
     ├─ 1. I/O: Injected repo fetches User & Inventory
     ├─ 2. Pure Core: calculateTotalAndTaxes(cart, userCountry)  <-- Pure computation!
     ├─ 3. I/O: Injected PaymentGateway.charge()
     ├─ 4. I/O: Injected repo updates database
     └─ 5. Return immutable clean DTO to client
```

Because the tax and discount calculations (`calculateTotalAndTaxes`) reside in a pure functional core:
1. They require **zero mocks** to test.
2. They execute in microseconds.
3. They can be tested against hundreds of edge-case tax jurisdictions with simple table-driven tests.

---

## Code Examples

### 1. Freezing Public API Return Boundaries

Prevent callers from corrupting internal service state or caches by returning shallow or deep-frozen objects:

```javascript
// Node.js code
class FeatureFlagRegistry {
  #flags = new Map();

  setFlag(name, config) {
    // Store deep clone internally
    this.#flags.set(name, structuredClone(config));
  }

  getFlag(name) {
    const config = this.#flags.get(name);
    if (!config) return null;

    // ✅ DO: Return frozen object to prevent callers from mutating the cache!
    return Object.freeze(structuredClone(config));
  }
}

const registry = new FeatureFlagRegistry();
registry.setFlag("darkMode", { enabled: true, rolloutPercent: 50 });

const clientConfig = registry.getFlag("darkMode");
// ❌ Mutating the returned view fails or throws in strict mode:
try {
  clientConfig.rolloutPercent = 100;
} catch (err) {
  console.log("Mutation blocked by boundary freeze:", err.message);
}
// Internal registry remains safely at 50%:
console.log("Registry value:", registry.getFlag("darkMode").rolloutPercent); // 50
```

---

## Tricky Points and Gotchas

### 1. Hidden Globals Destroying Test Determinism

Reading `Date.now()`, `Math.random()`, or `process.env` directly inside business calculations makes code non-deterministic and difficult to unit test:

```javascript
// Node.js code
// ❌ FLAWED: Depends on system clock global!
function isTrialExpired(user) {
  const now = Date.now(); // Hidden global!
  return now - user.createdAt > 30 * 24 * 60 * 60 * 1000;
}

// ✅ FIXED: Pass time explicitly as a parameter (Clock abstraction):
function isTrialExpiredSafe(user, nowMs = Date.now()) {
  return nowMs - user.createdAt > 30 * 24 * 60 * 60 * 1000;
}
```

### 2. The Over-Abstracted DI Container Antipattern

Importing heavy reflection-based enterprise IoC (Inversion of Control) containers into Node.js often results in thousands of lines of boilerplate decorator code, slow startup times, and obscured stack traces. Plain JavaScript factory functions and module parameter injection provide full testability with zero runtime overhead.

---

## Hands-on Exercise: Refactoring a Monolithic Billing Service

### Problem Statement

You have inherited a monolithic billing handler. It reads directly from globals, connects to Stripe inside the logic, mutates the caller's cart object, and catches errors by returning `null`.

### Buggy Implementation

```javascript
// Node.js code
// ❌ BUGS:
// 1. Direct dependency on global Stripe singleton
// 2. Direct read of system clock (Date.now())
// 3. Mutates input cart directly
// 4. Swallows payment errors, returning null
const stripe = require("stripe")("sk_test_fake");

async function checkoutMonolith(cart, user) {
  // Mutates input!
  cart.total = cart.items.reduce((s, i) => s + i.price, 0);

  // Hidden global clock
  if (new Date().getDay() === 0) {
    cart.total *= 0.9; // Sunday discount
  }

  try {
    const charge = await stripe.charges.create({
      amount: cart.total,
      customer: user.stripeId,
    });
    return charge;
  } catch (e) {
    return null; // Swallows error!
  }
}
```

### Edge Cases to Address

1. Extract the pricing calculation into a 100% pure function.
2. Inject payment gateway and clock dependencies.
3. Preserve input immutability.
4. Distinguish between validation errors and gateway errors.

### Verified Solution

```javascript
// Node.js code
// 1. Pure Functional Core:
function calculateCartTotal(cartItems, dayOfWeek) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new TypeError("Cart must contain at least one item");
  }

  const rawTotal = cartItems.reduce((sum, item) => {
    if (typeof item.price !== "number" || item.price <= 0) {
      throw new RangeError(`Invalid item price: ${item.price}`);
    }
    return sum + item.price;
  }, 0);

  const isSunday = dayOfWeek === 0;
  const finalTotal = isSunday ? Math.round(rawTotal * 0.9) : rawTotal;

  return {
    rawTotal,
    discountApplied: isSunday,
    finalTotal,
  };
}

// 2. Imperative Shell Service:
function createCheckoutService({ paymentGateway, clock = () => new Date() }) {
  if (!paymentGateway) throw new Error("PaymentGateway dependency required");

  return {
    async checkout({ cart, user }) {
      if (!user || !user.stripeId) {
        throw new Error("Valid user with stripeId required");
      }

      // Calculate price using pure core (Passing current day deterministically)
      const currentDay = clock().getDay();
      const pricing = calculateCartTotal(cart.items, currentDay);

      try {
        const receipt = await paymentGateway.charge({
          amount: pricing.finalTotal,
          customerId: user.stripeId,
        });

        // Return clean, immutable result DTO:
        return Object.freeze({
          success: true,
          chargeId: receipt.id,
          amountPaid: pricing.finalTotal,
          discountApplied: pricing.discountApplied,
        });
      } catch (gatewayErr) {
        throw new Error("Payment gateway transaction rejected", { cause: gatewayErr });
      }
    },
  };
}

// Verification:
const mockGateway = {
  async charge({ amount, customerId }) {
    return { id: "ch_99812", status: "succeeded" };
  },
};

const service = createCheckoutService({
  paymentGateway: mockGateway,
  clock: () => new Date("2026-09-20T12:00:00Z"), // Sunday!
});

const sampleCart = { items: [{ name: "Widget", price: 100 }] };
service.checkout({ cart: sampleCart, user: { stripeId: "cus_123" } })
  .then((receipt) => {
    console.log("Clean Checkout Receipt:", receipt);
    // 10% Sunday discount applied: { success: true, chargeId: 'ch_99812', amountPaid: 90, discountApplied: true }
    console.log("Original cart unmutated:", sampleCart.total); // undefined (Safe!)
  });
```

---

## Summary

- Structure backend services using the **Functional Core, Imperative Shell** pattern to maximize testability and minimize complexity.
- Pure decision functions accept data and return values; they perform no I/O, throw well-defined domain errors, and never read hidden globals.
- Implement Dependency Injection using factory functions and parameter destructuring rather than complex reflection containers.
- Clearly distinguish between **Owned resources** (which must be cleaned up by the allocating function) and **Borrowed resources** (which must not be closed by the callee).
- Implement an explicit error hierarchy (`ValidationError`, `NotFoundError`, `InfrastructureError`) to map domain outcomes to HTTP status codes cleanly.
- Defend service boundaries by freezing or cloning outputs before returning them to callers.

---

## Cheat Sheet

### Service Architecture Checklist

| Boundary Layer | Responsibility | Allowed Operations | Forbidden Operations |
| :--- | :--- | :--- | :--- |
| **Data Transfer (DTO)** | Input normalization & schema validation | Type coercion, allowlisting | Business decision making |
| **Functional Core** | Business logic & calculation | Pure logic, math, array mapping | Database I/O, `fetch()`, `Date.now()` |
| **Imperative Shell** | Orchestration & lifecycle | Calling repositories, clock injection | Complex branching calculation |
| **Persistence / API** | Protocol mapping | SQL queries, HTTP calls, socket writes | Direct client request handling |

---

## Interview Questions & Deep Dives

### 1. What is the "Functional Core, Imperative Shell" design pattern, and why does it excel in Node.js backend services?

**Question:** How does separating a service into a pure functional core and an imperative shell improve testability and reduce production bugs?

**Answer:**
**The Pattern:**
- **Functional Core:** Contains pure business rules, validation calculations, and state transitions. It takes plain input data and returns decision data. It has zero external side effects and does not perform I/O.
- **Imperative Shell:** Acts as the outer wrapper. It coordinates I/O: reading from databases, fetching from external APIs, reading the clock, invoking the functional core, and persisting results.

**Why It Excels in Node.js:**
1. **Frictionless Testing:** Testing business rules in the functional core requires zero mocking, zero database setups, and zero asynchronous boilerplate. Tests run in microseconds with 100% determinism.
2. **Simplified Concurrency:** Because the core is pure, it does not hold or mutate shared asynchronous state, eliminating race conditions.
3. **Isolated Side Effects:** All I/O failures (network drops, database timeouts) are confined to the thin imperative shell, making error recovery, retries, and transaction rollbacks localized and clean.

---

### 2. How do you implement Dependency Injection in Node.js without using heavyweight frameworks?

**Question:** In TypeScript or modern JavaScript, why do senior engineers often favor factory functions or parameter injection over decorator-based IoC containers?

**Answer:**
In compiled languages like Java or C#, IoC containers are often used because types are static and reflection is required to decouple classes. In JavaScript:
1. **Functions are First-Class Citizens:** You can pass functions, objects, and modules directly as arguments.
2. **Factory Functions Provide Native Closures:** Wrapping service functions inside a factory (`function createService({ db, mailer })`) binds dependencies to private closure scope with zero runtime reflection overhead.
3. **Transparent Debugging:** Reflection/decorator containers produce deep, unreadable call stacks (`Reflect.metadata`, container resolution loops). Factory functions preserve clean, direct call stacks.
4. **Zero-Setup Testing:** In a unit test, you instantiate the service simply by passing an object of mock/fake functions: `createService({ db: fakeDb, mailer: fakeMailer })`.

---

### 3. What is the difference between an "Owned" and a "Borrowed" resource, and what failure occurs when this contract is violated?

**Question:** Explain resource ownership in JavaScript backend design. What happens when a service function inadvertently tears down a borrowed database client?

**Answer:**
- **Owned Resource:** A component that creates or acquires a resource (e.g. acquiring a client from a connection pool, opening a file descriptor) is its **owner**. The owner has the sole responsibility to monitor its lifecycle, handle top-level errors, and guarantee teardown in a `finally` block.
- **Borrowed Resource:** When an owner passes that resource handle to helper functions or domain services, those callees **borrow** the resource. They are granted permission to perform operations (e.g. execute queries, write bytes), but are strictly **forbidden from destroying or closing it**.

**Failure on Violation:**
If a callee closes a borrowed database connection, the caller's connection pool becomes corrupt. If the caller attempts to commit a transaction or release the client back to the pool, the pool crashes with `Error: Connection terminated unexpectedly` or attempts to hand a closed socket to the next incoming HTTP request, triggering cascading service-wide failures.

---

### 4. How should an enterprise Node.js microservice structure its error taxonomy across boundaries?

**Question:** Design a clean error class hierarchy that allows an Express or Fastify error-handling middleware to automatically translate internal service exceptions into appropriate HTTP status codes.

**Answer:**
A clean architecture establishes a root `DomainError` from which semantic sub-classes inherit:
1. **`DomainError` (Base):** Extends native `Error`. Sets `this.name = this.constructor.name` and captures stack traces.
2. **`ValidationError` (400 Bad Request):** Carries an array or dictionary of invalid schema fields (`err.fields`).
3. **`UnauthorizedError` (401) / `ForbiddenError` (403):** Carries authentication and permission details.
4. **`NotFoundError` (404 Not Found):** Identifies the missing entity name and ID.
5. **`ConflictError` (409 Conflict):** Identifies unique constraint collisions (e.g. duplicate email).
6. **`InfrastructureError` (502 / 503 Bad Gateway):** Wraps third-party network, database, or timeout failures using `Error.cause`.

**Boundary Middleware Translation:**
The central error middleware checks:
```javascript
if (err instanceof DomainError) {
  res.status(err.statusCode).json({ error: err.name, message: err.message, details: err.fields });
} else {
  // Unhandled programmer bug / crash (500)
  logger.error("Unhandled internal error:", err);
  res.status(500).json({ error: "InternalServerError", message: "An unexpected error occurred" });
}
```
This guarantees internal implementation details never leak while domain errors translate to correct REST semantics automatically.

---

<nav aria-label="Lecture navigation">

[← Previous Day: Day 25 - Security-Relevant JavaScript Behavior](day-25-security-relevant-javascript.md) | [Roadmap](../javascript-roadmap.md) | [Next Day: Day 27 - Concurrency and Resource-Safe Async Code →](day-27-concurrency-and-resource-safe-async.md)

</nav>
