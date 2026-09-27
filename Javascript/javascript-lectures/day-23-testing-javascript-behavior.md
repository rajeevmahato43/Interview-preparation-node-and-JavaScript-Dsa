# Day 23: Testing JavaScript Behavior

<nav aria-label="Lecture navigation">

[← Previous Day: Day 22 - Performance and Algorithmic Reasoning](day-22-performance-and-algorithmic-reasoning.md) | [Roadmap](../javascript-roadmap.md) | [Next Day: Day 24 - Debugging and Language Failures →](day-24-debugging-and-language-failures.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Structure unit and integration tests around observable behavioral contracts rather than internal implementation details.
- Write robust, deterministic test suites using Node.js's built-in test runner (`node:test`) and assertion library (`node:assert/strict`).
- Accurately assert synchronous errors (`assert.throws`) and asynchronous promise rejections (`assert.rejects`).
- Detect and prevent "floating promise" false passes where asynchronous assertions finish after the test runner exits.
- Differentiate between test doubles: Dummies, Stubs, Spies, Mocks, and Fakes, avoiding the "over-mocking" brittle test antipattern.
- Build exhaustive regression test matrices for tricky JavaScript language edge cases (`NaN`, sparse arrays, shallow copy mutations, and JSON serialization lossiness).
- Isolate flaky tests by injecting deterministic time abstractions instead of relying on real-world wall-clock timers.

---

## Vocabulary Card

| Term | Plain Definition | Everyday Analogy |
| :--- | :--- | :--- |
| **Observable Contract** | The external inputs, outputs, and side effects of a system, independent of how internal code achieves the result. | Ordering a meal at a restaurant; you care that a hot pizza arrives in 20 minutes, not which chef turned on the oven. |
| **Floating Promise** | An asynchronous Promise that is initiated inside a test but never returned or `await`ed, causing the test runner to finish prematurely. | Dropping a letter in a mailbox without watching to verify it slid down the chute; it might bounce out after you walk away. |
| **Test Double** | Any generic replacement object used in place of a production dependency during testing. | A stunt double in a movie scene standing in for the lead actor. |
| **Stub** | A test double that returns hard-coded, canned responses to calls without recording detailed invocation history. | An automated phone answering machine that plays the same recorded message regardless of who calls. |
| **Mock** | A test double pre-programmed with specific behavioral expectations that asserts *how* and *how many times* it was invoked. | A security audit checklist verifying a guard checked exactly three badges in five minutes. |
| **Fake** | A test double that has a working, simplified implementation (e.g. an in-memory Map mimicking a PostgreSQL database). | A toy cash register that accepts plastic coins and calculates real change correctly. |

---

## Core Concepts

### 1. Observable Behavior vs. Implementation Testing

Tests that assert private state, internal helper functions, or exact variable names break whenever the codebase is refactored—even when the software continues to work perfectly.

```javascript
// Node.js code
// ✅ DO: Test observable public inputs and outputs
import test from "node:test";
import assert from "node:assert/strict";

class BankAccount {
  #balance = 0; // Private field

  deposit(amount) {
    if (amount <= 0) throw new RangeError("Deposit amount must be positive");
    this.#balance += amount;
  }

  get balance() {
    return this.#balance;
  }
}

test("BankAccount increments balance on valid deposit", () => {
  const account = new BankAccount();
  account.deposit(50);
  // Observable contract: balance property reflects deposit
  assert.equal(account.balance, 50);
});

// ❌ DON'T: Inspect internal private fields or rewrite methods to inspect call counters
```

### 2. Testing Synchronous Errors vs. Asynchronous Rejections

- Use `assert.throws(fn, regexOrClass)` for synchronous functions.
- Always use `await assert.rejects(promiseOrAsyncFn, regexOrClass)` for asynchronous functions.

```javascript
// Node.js code
// 1. Synchronous Exception:
test("synchronous validation throws", () => {
  function validateAge(age) {
    if (age < 0) throw new RangeError("Age cannot be negative");
  }

  // ✅ Wraps synchronous invocation in a function
  assert.throws(() => validateAge(-5), {
    name: "RangeError",
    message: /negative/,
  });
});

// 2. Asynchronous Rejection:
test("asynchronous payment gateway rejects on network drop", async () => {
  async function chargeCard(amount) {
    if (amount > 10000) {
      throw new Error("Fraudulent charge limit exceeded");
    }
    return { status: "approved" };
  }

  // ❌ BROKEN: assert.throws does NOT catch asynchronous rejections!
  // assert.throws(() => chargeCard(20000)); // Passes erroneously or crashes runner!

  // ✅ FIXED: Must AWAIT assert.rejects:
  await assert.rejects(
    async () => chargeCard(20000),
    {
      name: "Error",
      message: /Fraudulent charge/,
    }
  );
});
```

### 3. The "Floating Promise" False Pass Disaster

If a test initiates an asynchronous promise but fails to `await` it, the test runner marks the test as **passed** immediately because no error was thrown during the initial synchronous turn. Seconds later, the promise rejects as an unhandled rejection, crashing the CI process:

```javascript
// Node.js code
// ❌ FALSE POSITIVE: Test passes even though assertion fails!
test("flawed async test passing falsely", () => {
  // Missing 'async' and 'await'!
  Promise.resolve(10).then((val) => {
    // This assertion runs LATER, long after test() reported success!
    // assert.equal(val, 999); // Unhandled rejection outside test scope!
  });
});

// ✅ PROPER: Async test explicitly awaits all asynchronous paths
test("correct async test", async () => {
  const val = await Promise.resolve(10);
  assert.equal(val, 10);
});
```

### 4. Taxonomy of Test Doubles

Understanding test doubles prevents brittle over-mocking:

| Double Type | Purpose | Example |
| :--- | :--- | :--- |
| **Dummy** | Passed solely to fill parameter lists; never actually inspected or invoked. | Passing `null` or `{}` to an unused logger argument. |
| **Stub** | Returns fixed, canned data to satisfy a test branch. | `userRepo.findById = async () => ({ id: 1, name: "Alice" });` |
| **Spy** | Wraps a real or stubbed function to record arguments, call counts, and return values. | Checking if `mailer.send` was called with the user's email. |
| **Mock** | Configured with strict expectations upfront; fails if calls deviate from the script. | `mock.expects("save").once().withArgs(...)` |
| **Fake** | Functional shortcut implementation that operates in-memory. | `new InMemoryDatabase()` backed by a JavaScript `Map`. |

**Senior Rule:** Prefer **Fakes** over Mocks. Fakes implement the real interface in memory, allowing you to test complex workflows without coupling your test code to arbitrary function call order.

### 5. JavaScript Language Edge-Case Regression Suites

Production bugs frequently stem from subtle JavaScript type coercion and serialization behaviors. Bulletproof suites test these edge cases explicitly:

```javascript
// Node.js code
test("JavaScript type and serialization edge cases", () => {
  // 1. NaN checking:
  const badCalculation = 0 / 0;
  assert.ok(Number.isNaN(badCalculation));
  assert.notEqual(badCalculation, badCalculation); // NaN !== NaN!

  // 2. Sparse Arrays vs Dense Arrays:
  const sparse = [];
  sparse[2] = "data";
  // .map() SKIPS empty holes!
  const mapped = sparse.map((x) => x.toUpperCase());
  assert.equal(mapped.length, 3);
  assert.equal(0 in mapped, false); // Index 0 was skipped!

  // 3. Shallow Object Mutation:
  const original = { user: { role: "viewer" } };
  const clone = { ...original };
  clone.user.role = "admin"; // Mutates ORIGINAL nested object!
  assert.equal(original.user.role, "admin");

  // 4. JSON Serialization Data Loss:
  const payload = {
    valid: 123,
    erasedUndefined: undefined, // Dropped
    erasedSymbol: Symbol("secret"), // Dropped
    erasedFunc: () => {}, // Dropped
    convertedNaN: NaN, // Becomes null
    convertedDate: new Date("2026-09-27T00:00:00Z"), // Becomes string
  };
  const serialized = JSON.parse(JSON.stringify(payload));
  assert.deepEqual(serialized, {
    valid: 123,
    convertedNaN: null,
    convertedDate: "2026-09-27T00:00:00.000Z",
  });
});
```

---

## Detailed Explanations and Traces

### Trace 1: The Anatomy of a Resource Cleanup Test

When testing code that acquires and releases resources (e.g. database connections, temp files), the test must verify that cleanup occurs on **both** fulfillment and rejection paths:

```javascript
// Node.js code
async function withManagedLock(lockService, resourceId, actionFn) {
  const lock = await lockService.acquire(resourceId);
  try {
    return await actionFn(lock);
  } finally {
    await lockService.release(lock);
  }
}

test("withManagedLock guarantees release even if actionFn rejects", async () => {
  const auditLog = [];

  const fakeLockService = {
    async acquire(id) {
      auditLog.push(`acquired:${id}`);
      return { id, token: "tok_123" };
    },
    async release(lock) {
      auditLog.push(`released:${lock.id}`);
    },
  };

  // Execute failure path:
  await assert.rejects(
    async () => {
      await withManagedLock(fakeLockService, "res_42", async () => {
        auditLog.push("executing_action");
        throw new Error("Action failed mid-flight");
      });
    },
    /Action failed mid-flight/
  );

  // Verify the exact operational sequence:
  assert.deepEqual(auditLog, [
    "acquired:res_42",
    "executing_action",
    "released:res_42", // Cleanup verified!
  ]);
});
```

---

## Code Examples

### 1. Table-Driven Testing Pattern

Table-driven tests define a clear matrix of inputs, expected outputs, and error states, making edge cases trivially visible:

```javascript
// Node.js code
import test from "node:test";
import assert from "node:assert/strict";

function parseSlug(input) {
  if (typeof input !== "string") throw new TypeError("Slug must be a string");
  const cleaned = input.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!cleaned) throw new Error("Slug cannot be empty");
  return cleaned;
}

test("parseSlug handles comprehensive edge-case matrix", () => {
  const cases = [
    { input: "Hello World", expected: "hello-world", description: "standard spaces" },
    { input: "  Node.JS & Microservices!  ", expected: "node-js-microservices", description: "special chars" },
    { input: "---multiple--hyphens---", expected: "multiple-hyphens", description: "leading/trailing hyphens" },
    { input: "Already-Valid-Slug-123", expected: "already-valid-slug-123", description: "alphanumeric" },
  ];

  for (const { input, expected, description } of cases) {
    assert.equal(parseSlug(input), expected, `Failed on case: ${description}`);
  }

  // Error cases:
  const errorCases = [
    { input: null, errorClass: TypeError, desc: "null input" },
    { input: 12345, errorClass: TypeError, desc: "number input" },
    { input: "   !@#$%^&*()   ", errorClass: Error, desc: "symbols only" },
  ];

  for (const { input, errorClass, desc } of errorCases) {
    assert.throws(() => parseSlug(input), { name: errorClass.name }, `Failed on error case: ${desc}`);
  }
});
```

### 2. Deterministic Clock Injection (Eliminating Flaky Timers)

Never use `setTimeout` with real wall-clock delays in unit tests; real delays make suites slow and cause flaky race conditions in CI:

```javascript
// Node.js code
class RateLimiter {
  constructor(maxRequests, windowMs, clock = () => Date.now()) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.clock = clock;
    this.timestamps = [];
  }

  tryAcquire() {
    const now = this.clock();
    // Filter timestamps within current window
    this.timestamps = this.timestamps.filter((ts) => now - ts < this.windowMs);

    if (this.timestamps.length < this.maxRequests) {
      this.timestamps.push(now);
      return true;
    }
    return false;
  }
}

test("RateLimiter enforces window with simulated clock", () => {
  let simulatedTime = 100000;
  const mockClock = () => simulatedTime;

  const limiter = new RateLimiter(2, 1000, mockClock); // 2 requests per 1000ms

  assert.equal(limiter.tryAcquire(), true); // Req 1 @ 100000ms
  assert.equal(limiter.tryAcquire(), true); // Req 2 @ 100000ms
  assert.equal(limiter.tryAcquire(), false); // Rejected! Exceeds limit

  // Advance clock by 1001ms instantly without waiting!
  simulatedTime += 1001;

  assert.equal(limiter.tryAcquire(), true); // Allowed! Window expired
});
```

---

## Tricky Points and Gotchas

### 1. `assert.equal` vs. `assert.deepEqual`

`assert.equal` performs loose scalar equality (`==`) or reference equality on objects. For structural comparisons of objects and arrays, always use `assert.deepEqual`:

```javascript
// Node.js code
// ❌ GOTCHA:
// assert.equal({ a: 1 }, { a: 1 }); // FAILS! Different object references!

// ✅ USE:
assert.deepEqual({ a: 1 }, { a: 1 }); // PASSES! Deep structural equality
```

### 2. Over-Mocking Antipattern

If a test mocks internal helpers `_validate()`, `_calculateTax()`, and `_saveRecord()`, the test is not verifying that the module actually calculates tax or saves records; it is merely asserting that the author copied the function body into the mock setup. When refactoring internal logic, these tests fail while real bugs pass undetected.

**Best Practice:** Only mock at true **architectural boundaries** (HTTP clients, file systems, third-party payment gateways, database drivers).

### 3. Shared Mutable Test Fixtures

Defining a shared object at the top of a test file causes tests to pass or fail depending on execution order:

```javascript
// Node.js code
// ❌ FRAGILE: Shared mutable fixture across tests
const sharedState = { count: 0 };

test("test A mutates state", () => {
  sharedState.count += 5;
  assert.equal(sharedState.count, 5);
});

test("test B assumes clean state", () => {
  // If test A ran first, sharedState.count is 5, NOT 0!
  assert.equal(sharedState.count, 0); // FLAKY FAILURE!
});
```

**Fix:** Use `beforeEach()` or a factory function (`function createFixture() { ... }`) to generate fresh, isolated state per test.

---

## Hands-on Exercise: Building a Resilient Test Suite for a Retry Client

### Problem Statement

You are tasked with writing a comprehensive test suite for an asynchronous exponential-backoff retry utility. The tests must verify retry counts, backoff timing, final failure, and non-retryable error handling without using real wall-clock delays.

### Implementation Under Test

```javascript
// Node.js code
async function retryOperation(operationFn, maxRetries = 3, sleepFn = (ms) => new Promise((r) => setTimeout(r, ms))) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operationFn(attempt);
    } catch (err) {
      attempt++;
      if (err.fatal || attempt >= maxRetries) {
        throw err;
      }
      await sleepFn(attempt * 50); // Linear backoff
    }
  }
}
```

### Edge Cases to Test

1. Immediate success on first attempt (0 retries).
2. Transients failures that succeed on the 3rd attempt.
3. Exceeding max retries throws the last encountered error.
4. Fatal error (`err.fatal = true`) aborts retries immediately.
5. Backoff delay calculation matches expectations.

### Verified Test Suite

```javascript
// Node.js code
import test from "node:test";
import assert from "node:assert/strict";

test("retryOperation test suite", async (t) => {
  await t.test("succeeds on first attempt without delay", async () => {
    let calls = 0;
    const result = await retryOperation(async () => {
      calls++;
      return "OK";
    });
    assert.equal(result, "OK");
    assert.equal(calls, 1);
  });

  await t.test("retries transient failures and tracks sleep delays", async () => {
    let attemptsMade = 0;
    const delaysRecorded = [];
    const fakeSleep = async (ms) => delaysRecorded.push(ms);

    const result = await retryOperation(
      async (attempt) => {
        attemptsMade++;
        if (attemptsMade < 3) throw new Error("Transient 503");
        return "Recovered";
      },
      3,
      fakeSleep
    );

    assert.equal(result, "Recovered");
    assert.equal(attemptsMade, 3);
    assert.deepEqual(delaysRecorded, [50, 100]); // attempt 1 (1*50), attempt 2 (2*50)
  });

  await t.test("throws final error when max retries exceeded", async () => {
    const fakeSleep = async () => {};
    await assert.rejects(
      async () => {
        await retryOperation(
          async () => {
            throw new Error("Persistent Crash");
          },
          2,
          fakeSleep
        );
      },
      /Persistent Crash/
    );
  });

  await t.test("immediately aborts retries on fatal error", async () => {
    let calls = 0;
    const fakeSleep = async () => {};

    const fatalErr = new Error("Invalid Credentials");
    fatalErr.fatal = true;

    await assert.rejects(
      async () => {
        await retryOperation(
          async () => {
            calls++;
            throw fatalErr;
          },
          5,
          fakeSleep
        );
      },
      /Invalid Credentials/
    );

    assert.equal(calls, 1); // Never retried!
  });
});
```

---

## Summary

- Structure test suites around **observable behavioral contracts** rather than private implementation details to keep tests refactor-friendly.
- Use `node:test` and `node:assert/strict` for zero-dependency, fast, native testing in modern Node.js.
- Synchronous exceptions require `assert.throws(() => fn())`; asynchronous rejections require `await assert.rejects(async () => fn())`.
- Avoid floating promises by strictly returning or awaiting all asynchronous operations in test files.
- Prefer **Fakes** (working in-memory implementations) over brittle Mocks.
- Explicitly test JavaScript language pitfalls: `NaN`, sparse array gaps, shallow copy mutations, and JSON serialization loss.
- Inject fake clocks and time abstractions to keep async suites fast, reliable, and completely deterministic.

---

## Cheat Sheet

### Native Node.js Assertions (`node:assert/strict`)

| Assertion Method | Use Case | Example |
| :--- | :--- | :--- |
| `assert.equal(actual, expected)` | Scalar primitives (`===`) | `assert.equal(count, 5)` |
| `assert.deepEqual(actual, expected)`| Structural object/array check | `assert.deepEqual(res, { ok: true })` |
| `assert.throws(fn, validator)` | Synchronous exceptions | `assert.throws(() => parse(null), /TypeError/)` |
| `await assert.rejects(promise, val)`| Asynchronous rejections | `await assert.rejects(fetchUser(99), /NotFound/)` |
| `assert.ok(value)` | Truthy check | `assert.ok(user.isActive)` |

### Test Double Quick Reference

| Type | Has Logic? | Records Calls? | Best Used For |
| :--- | :--- | :--- | :--- |
| **Dummy** | No | No | Unused required parameters |
| **Stub** | No (hardcoded) | No | Returning fixed test inputs |
| **Spy** | Wraps target | Yes | Verifying callback interactions |
| **Mock** | Strict script | Yes | Strict interaction protocols |
| **Fake** | Yes (simplified) | Optional | In-memory DBs, virtual filesystems |

---

## Interview Questions & Deep Dives

### 1. Why does an asynchronous test in Node.js pass erroneously if `assert.rejects` is not `await`ed?

**Question:** Explain what happens when a developer forgets the `await` keyword before `assert.rejects(...)`, and how modern test runners behave.

**Answer:**
`assert.rejects` is inherently asynchronous because it must wait for the passed Promise to settle before evaluating whether it rejected with the expected error. It returns a Promise that fulfills if the assertion passes, or rejects if the assertion fails.

If `await` is omitted:
1. `assert.rejects(...)` starts evaluating in the background and returns a pending Promise.
2. The outer test function (having finished its synchronous statements) exits immediately.
3. The test runner marks the test as **PASSED** because the test function completed without throwing any synchronous error.
4. When the awaited operation eventually settles, if it did not reject as expected, `assert.rejects` rejects its Promise.
5. Because the test runner has already moved on, this unhandled rejection surfaces as a global `unhandledRejection` event, potentially crashing the entire test process with an unmapped error.

Always declare test functions `async` and prefix `assert.rejects` with `await`.

---

### 2. What is the "Over-Mocking" antipattern, and how does it compromise software quality?

**Question:** What problems arise when an engineering team mocks every internal module dependency in unit tests, and what architectural pattern should be used instead?

**Answer:**
**The Antipattern:**
Over-mocking occurs when developers mock internal implementation details (e.g. mocking private methods, database query builders, or helper algorithms) rather than external architectural boundaries.

**Consequences:**
1. **False Positives:** Mocks are configured to return what developers *assume* the dependency returns. If the real dependency updates its API or behavior, the unit tests continue to pass green, but the application crashes in production.
2. **Brittle Tests:** When developers refactor internal code (e.g. renaming an internal helper or optimizing an algorithm) without altering the public API, tests break because their rigid mock call expectations (`mock.expects('helper').once()`) are violated. This discourages code refactoring.

**Proper Architecture:**
- **Test at System Boundaries:** Only mock dependencies that cross external trust or process boundaries (network HTTP calls, third-party payment gateways, OS filesystem).
- **Use Fakes:** Implement lightweight in-memory versions of repositories (e.g., an `InMemoryUserRepository` backed by a `Map`). Fakes test the entire domain logic and state transitions deterministically without mocking internal queries.

---

### 3. How do you test time-dependent logic (e.g. token expiration, timeouts) deterministically without introducing test flakiness?

**Question:** Why are real `setTimeout` calls considered an antipattern in test suites, and how do you architect time-sensitive code for testability?

**Answer:**
**Why Real Timers Fail in CI:**
1. **Sluggishness:** A test suite containing hundreds of tests that wait 100ms–500ms takes minutes to run.
2. **Flakiness (Race Conditions):** In CI environments under heavy CPU load, a `setTimeout(..., 100)` might fire at 160ms. If tests make assertions expecting strict timing tolerances, they fail unpredictably.

**Architectural Solutions:**
1. **Clock Injection (Dependency Inversion):** Design classes and functions to accept an optional `clock` function (e.g. `clock = () => Date.now()`). In unit tests, pass a simulated clock variable that you can manually increment instantly:
   ```javascript
   let currentTime = 1000;
   const service = new TokenService({ clock: () => currentTime });
   currentTime += 3600000; // Fast-forward 1 hour instantly!
   ```
2. **Mock Timers API:** Use test runner fake timer APIs (such as Node.js's `context.mock.timers.enable()` or Sinon.js) which intercept `setTimeout`, `setInterval`, and `Date.now()`, allowing the test to advance time synchronously via `time.tick(1000)`.

---

### 4. What subtle JavaScript edge cases must be explicitly covered when testing data transformation and serialization pipelines?

**Question:** Name four JavaScript data-handling edge cases that behave counterintuitively, and describe the regression tests required for them.

**Answer:**
1. **`NaN` Equality:**
   - *Behavior:* `NaN === NaN` evaluates to `false`.
   - *Test Requirement:* Use `assert.ok(Number.isNaN(val))` or `Object.is(val, NaN)`.
2. **Sparse Array Holes:**
   - *Behavior:* Array methods like `.map()`, `.filter()`, and `.forEach()` skip unassigned slots (holes), whereas `for...of` and `[...sparse]` yield `undefined`.
   - *Test Requirement:* Assert array length and verify whether `'0' in arr` returns false for holes.
3. **Shallow Copy Object Reference Sharing:**
   - *Behavior:* Object spread (`{ ...obj }`) and `Object.assign()` only create shallow copies. Mutating nested properties on the clone corrupts the original object.
   - *Test Requirement:* Mutate the nested clone property and assert that the original object remained unaffected (or test deep cloning with `structuredClone`).
4. **JSON Serialization Data Loss:**
   - *Behavior:* `JSON.stringify()` drops keys with values of `undefined`, functions, or `Symbol`. It converts `NaN` and `Infinity` into `null`, and serializes `Date` instances to ISO strings without restoring them to `Date` objects on parse.
   - *Test Requirement:* Serialize and deserialize payloads, asserting the exact shape and types of the reconstructed schema.

---

<nav aria-label="Lecture navigation">

[← Previous Day: Day 22 - Performance and Algorithmic Reasoning](day-22-performance-and-algorithmic-reasoning.md) | [Roadmap](../javascript-roadmap.md) | [Next Day: Day 24 - Debugging and Language Failures →](day-24-debugging-and-language-failures.md)

</nav>
