# Day 07: Errors and Exception Flow

<nav aria-label="Lecture navigation">

[← Day 06: Functions, Parameters, and Callbacks](day-06-functions-parameters-and-callbacks.md) | [Roadmap](../javascript-roadmap.md) | [Day 08: Closures, Execution Context, and this →](day-08-closures-execution-context-and-this.md)

</nav>

---

## What You Will Learn Today

By the end of this lecture, you should be able to:

- Distinguish the three fundamental failure modes: syntax errors, runtime exceptions, and logical bugs.
- Master control transfer during stack unwinding using `throw`, `try`, `catch`, and `finally`.
- Understand why throwing non-`Error` primitives degrades debugging and how to defensively normalize unknown errors.
- Use built-in error classes (`TypeError`, `RangeError`, `ReferenceError`, `SyntaxError`, `URIError`, `AggregateError`) accurately.
- Build clean, extensible custom error hierarchies using ES2022 `Error.cause` and Node.js `Error.captureStackTrace`.
- Avoid the critical trap of using `return` or `throw` inside `finally` blocks (abrupt completion suppression).
- Structure application failures into a clear three-tier taxonomy: validation errors, operational failures, and programmer bugs.
- Explain why synchronous `try/catch` blocks cannot trap asynchronous callback exceptions.
- Implement multi-resource cleanup in reverse acquisition order without leaking handles or suppressing errors.
- Build production-safe error boundaries that shield sensitive credentials while preserving actionable internal traces.

**Prerequisites:** [Day 04 – Coercion, Equality, and Operators](day-04-coercion-equality-and-operators.md) (truthiness, operators) and [Day 06 – Functions, Parameters, and Callbacks](day-06-functions-parameters-and-callbacks.md) (higher-order functions, call stack, callback contracts).  
*Upcoming Connections:* [Day 08](day-08-closures-execution-context-and-this.md) details closures and execution contexts; [Days 18–19](day-18-promises-and-composition.md) advance exception flow into Promise rejection chains and `async/await` error boundaries.

---

## Quick Vocabulary Card

| Term | Definition |
| :--- | :--- |
| **Exception** | An abnormal event or error condition that disrupts the normal sequential execution of statements. |
| **Stack Unwinding** | The process where JavaScript halts execution in the current function and walks backwards down the call stack until it finds an active `catch` block. |
| **`throw` Statement** | A language keyword that interrupts normal execution and initiates stack unwinding with a specified value. |
| **`catch` Block** | A block of code executed only when an exception occurs in its corresponding `try` block, receiving the thrown value. |
| **`finally` Block** | A block of code guaranteed to execute after `try` and `catch` finish, regardless of whether an exception occurred or was handled. |
| **Abrupt Completion** | Any control transfer that prematurely breaks standard linear execution (e.g., `return`, `throw`, `break`, `continue`). |
| **`Error.cause`** | An ES2022 property that links a higher-level custom error to the lower-level error that triggered it, preserving the root diagnosis. |
| **Validation Error** | An expected operational failure caused by caller input failing to satisfy domain constraints (maps to HTTP 4xx). |
| **Operational Error** | A runtime failure occurring during normal system operations (e.g., database network timeout, disk full) where recovery or retry may be possible. |
| **Programmer Error** | A bug in the code itself (e.g., syntax errors, `TypeError` from dereferencing `null`, broken invariants) requiring code remediation. |

---

## 1. Three Kinds of Failure

In JavaScript, failures fall into three fundamentally distinct categories: **Syntax Errors**, **Runtime Errors**, and **Logic Errors**.

```
                           Kinds of Failure
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
   Syntax Errors            Runtime Errors            Logic Errors
  (Parsing Phase)         (Execution Phase)         (Correctness Bug)
  Source code invalid.    Exception thrown at run   Code runs cleanly,
  Execution never starts. time. Stack unwinds.      computes wrong answer.
```

### Syntax Errors

A **Syntax Error** occurs when the JavaScript engine cannot parse source code according to ECMAScript grammar rules. Syntax errors prevent the entire script or module from beginning execution.

```js
// Node.js code
// ❌ SyntaxError: Cannot parse the source code; execution never starts for this file
// const let = 42; // SyntaxError: Unexpected token 'let'
// function () {}  // SyntaxError: Function statements require a function name
```

### Runtime Errors (Exceptions)

A **Runtime Error** occurs while syntactically valid code is executing. An unexpected condition interrupts normal flow, creates an exception, and begins unwinding the call stack until caught.

```js
// Node.js code
const account = null;

// ❌ Runtime TypeError: code is valid syntax, but fails during execution
try {
  account.getBalance();
} catch (err) {
  console.log("Caught runtime error:", err.name); // TypeError
}
```

### Logic Errors (Incorrect Results)

A **Logic Error** is a flaw in program reasoning where code runs cleanly to completion without throwing, but produces an incorrect, unexpected, or insecure result.

```js
// Node.js code
function calculateDiscount(price, percentage) {
  // ❌ Logic error: dividing percentage instead of multiplying discount
  return price - percentage; // Should be: price - (price * (percentage / 100))
}

console.log(calculateDiscount(100, 20)); // 80 by accident, but calculateDiscount(50, 10) = 40 (wrong!)
```

---

## 2. The `Error` Object and Built-in Error Types

An **`Error` object** is a built-in data structure that encapsulates a failure description, including a human-readable message, an error type name, and a snapshot of the execution call stack.

### Standard Error Properties

1. **`message`**: A string describing the failure.
2. **`name`**: The type of error (e.g., `"Error"`, `"TypeError"`).
3. **`stack`**: A V8/Node.js host-provided string showing the sequence of function calls active when the error was instantiated.
4. **`cause`** (ES2022+): An optional property referencing the underlying error that triggered this failure.

```js
// Node.js code
const baseError = new Error("Database query failed", {
  cause: new Error("Connection reset by peer")
});

console.log("Name:", baseError.name);          // "Error"
console.log("Message:", baseError.message);    // "Database query failed"
console.log("Cause:", baseError.cause.message);// "Connection reset by peer"
```

### Built-in Error Types

JavaScript provides specialized error subclasses to communicate specific categories of runtime failure:

```js
// Node.js code

// 1. TypeError: value is not of the expected type or operation is invalid
function invoke(fn) {
  if (typeof fn !== "function") {
    throw new TypeError(`Expected function, received ${typeof fn}`);
  }
  return fn();
}

// 2. RangeError: numeric value is outside its valid range
function setPort(port) {
  if (port < 1 || port > 65535) {
    throw new RangeError(`Port must be 1-65535, received ${port}`);
  }
}

// 3. ReferenceError: attempting to access a variable that has not been declared
function checkRef() {
  try {
    console.log(nonExistentVariable);
  } catch (err) {
    console.log("Caught:", err.name); // ReferenceError
  }
}

// 4. URIError: malformed URI encoding or decoding
function decodeToken(token) {
  try {
    decodeURIComponent("%"); // Malformed percent-encoding
  } catch (err) {
    console.log("Caught:", err.name); // URIError
  }
}

checkRef();
decodeToken();
```

### Comparison of Built-in Error Types

| Error Class | Typical Trigger | Common Example |
| :--- | :--- | :--- |
| **`Error`** | Generic base application errors | `new Error("Something failed")` |
| **`TypeError`** | Invalid type or non-callable invocation | `null.property`, `notAFunction()` |
| **`RangeError`** | Numeric value outside bounds | `new Array(-1)`, `num.toFixed(101)` |
| **`ReferenceError`** | Accessing undeclared variables or TDZ variables | `console.log(undeclaredVar)` |
| **`SyntaxError`** | Malformed code passed to `JSON.parse` or `eval` | `JSON.parse("{ bad json }")` |
| **`URIError`** | Invalid parameters to `encodeURI`/`decodeURI` | `decodeURIComponent("%")` |
| **`AggregateError`** | Multiple errors grouped together (ES2021+) | `Promise.any()` when all promises reject |

---

## 3. Throwing and Catching Exceptions

Exception flow in JavaScript relies on four keywords: `throw`, `try`, `catch`, and `finally`.

### How Control Transfers During `throw`

When `throw` executes, JavaScript immediately stops the current block and inspects the call stack for the nearest enclosing `try/catch` block. If the current function has no handler, JavaScript unwinds the stack to the calling function, repeating this check until a handler is found or the process crashes.

```js
// Node.js code
function parseUserAge(input) {
  const age = Number(input);
  if (Number.isNaN(age)) {
    throw new TypeError("Age must be a valid number");
  }
  if (age < 0 || age > 150) {
    throw new RangeError("Age out of human range");
  }
  return age;
}

// ✅ Proper try/catch handling with type-specific inspection
try {
  const age = parseUserAge("not-a-number");
  console.log("User age:", age);
} catch (err) {
  if (err instanceof TypeError) {
    console.log("❌ Formatting error:", err.message);
  } else if (err instanceof RangeError) {
    console.log("❌ Range error:", err.message);
  } else {
    throw err; // Re-throw unknown errors!
  }
}
```

### Optional Catch Binding (ES2019+)

If you do not need to inspect the thrown error object, you can omit the catch variable `(err)`:

```js
// Node.js code
function isValidJson(raw) {
  try {
    JSON.parse(raw);
    return true;
  } catch {
    // ✅ Optional catch binding: no unused error variable declared
    return false;
  }
}

console.log(isValidJson('{"status": "ok"}')); // true
console.log(isValidJson("invalid json string")); // false
```

> **Warning:** Do not use empty catch blocks to silently suppress unexpected errors. Only swallow errors when the fallback is safe, deliberate, and observable.

---

## 4. Throwing Non-Errors: A Critical Anti-Pattern

JavaScript allows you to `throw` any expression, including strings, numbers, booleans, and plain objects. However, **throwing anything other than an `Error` object is a severe anti-pattern in production code**.

### Why Throwing Non-Errors Breaks Applications

1. **No Stack Trace:** Primitives (`"failed"`, `500`) do not carry a `.stack` property, making it impossible to determine where the error originated.
2. **Breaks `instanceof Error`:** Middleware and error routers expecting `err instanceof Error` fail to recognize the object, causing crashes in error handlers.
3. **No Standard Properties:** Primitives lack standard properties (`.message`, `.name`), leading to `err.message is undefined` bugs.

```js
// Node.js code

// ❌ Anti-pattern: throwing a string or plain object
function riskyQuery(id) {
  if (!id) throw "Missing ID"; // No stack trace!
  if (id === 13) throw { code: "UNLUCKY", status: 400 }; // Not an Error instance!
}

// ✅ Defensive error normalizer for production error boundaries
function normalizeError(caught) {
  if (caught instanceof Error) {
    return caught;
  }
  // Convert strings or plain objects into genuine Error objects
  const message = typeof caught === "string" 
    ? caught 
    : (caught && caught.message) || JSON.stringify(caught) || "Unknown error";
  
  const normalized = new Error(message);
  if (caught && typeof caught === "object") {
    Object.assign(normalized, caught);
  }
  return normalized;
}

try {
  riskyQuery(13);
} catch (rawErr) {
  const safeErr = normalizeError(rawErr);
  console.log("Safe Error:", safeErr.message, "| Instance of Error:", safeErr instanceof Error);
}
```

---

## 5. `finally` for Guaranteed Cleanup

A **`finally` block** is guaranteed to execute after the `try` block and any executed `catch` block finish. It runs under all conditions:
- When the `try` block completes successfully.
- When an error is thrown and caught in `catch`.
- When an error is thrown and **not** caught in `catch` (before the stack continues unwinding).
- When a `return`, `break`, or `continue` statement executes inside `try` or `catch`.

```js
// Node.js code
function processFile(filePath) {
  let fileDescriptor = null;
  try {
    console.log("1. Opening file:", filePath);
    fileDescriptor = 42; // simulated descriptor
    if (filePath === "corrupted.txt") {
      throw new Error("File corrupted on disk");
    }
    return "File processed successfully";
  } catch (err) {
    console.log("2. Handling read failure:", err.message);
    throw err; // Re-throw after logging
  } finally {
    // ✅ Guaranteed cleanup runs on both success and re-throw
    if (fileDescriptor !== null) {
      console.log("3. Closing file descriptor:", fileDescriptor);
      fileDescriptor = null;
    }
  }
}

try {
  processFile("corrupted.txt");
} catch (err) {
  console.log("4. Top-level caught:", err.message);
}
```

### The Dangerous `return` in `finally` Trap

If a `finally` block executes an **abrupt completion** (such as `return` or `throw`), it **silently discards and overwrites** any prior `return` value or thrown exception from the `try` or `catch` blocks!

```js
// Node.js code

// ❌ Catastrophic bug: 'return' in finally suppresses thrown exceptions!
function authenticateUser(token) {
  try {
    if (!token) {
      throw new Error("Invalid authorization token");
    }
    return { authenticated: true, user: "admin" };
  } catch (err) {
    throw err; // Intending to reject authentication
  } finally {
    // ⚠️ Overwrites the thrown error and returns false as normal completion!
    return { authenticated: false }; 
  }
}

// The caller receives a value instead of an exception!
console.log("Auth result:", authenticateUser(null)); // { authenticated: false } (Error completely swallowed!)
```

> **Rule:** Never use `return`, `throw`, `break`, or `continue` inside a `finally` block unless your explicit, documented goal is to override prior control flow.

---

## 6. Rethrowing and Error Chaining (`Error.cause`)

When lower-level operations fail (e.g., a file system read or a raw database query), higher-level modules should translate the low-level failure into a domain-meaningful error while preserving the original cause.

### ES2022 `Error.cause`

Before ES2022, wrapping an error often lost the original stack trace. With ES2022, `new Error(message, { cause: originalError })` preserves the full diagnostic tree.

```js
// Node.js code
class DatabaseError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "DatabaseError";
  }
}

function fetchUserProfile(userId) {
  try {
    // Simulate low-level socket disconnect
    throw new Error("ECONNRESET: socket hang up");
  } catch (rawError) {
    // ✅ Wrap into high-level domain error while preserving cause
    throw new DatabaseError(`Failed to fetch user profile for ID ${userId}`, {
      cause: rawError
    });
  }
}

try {
  fetchUserProfile(101);
} catch (err) {
  console.log("Domain Error:", err.message);        // Domain Error: Failed to fetch user profile for ID 101
  console.log("Root Cause:", err.cause.message);     // Root Cause: ECONNRESET: socket hang up
}
```

### Writing Custom Error Classes in Node.js

When creating domain error classes in Node.js, set `this.name` explicitly and use `Error.captureStackTrace` (V8 API) to exclude the constructor call from the stack trace:

```js
// Node.js code
class AppError extends Error {
  constructor(message, { statusCode = 500, code = "INTERNAL_ERROR", cause } = {}) {
    super(message, { cause });
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Distinguishes operational errors from programmer bugs

    // V8 specific: keeps constructor out of the stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

class ValidationError extends AppError {
  constructor(message, fields = {}) {
    super(message, { statusCode: 400, code: "VALIDATION_FAILED" });
    this.fields = fields;
  }
}

const err = new ValidationError("Invalid email address", { email: "Malformed domain" });
console.log(err.name, err.statusCode, err.fields); // ValidationError 400 { email: 'Malformed domain' }
```

---

## 7. Error Taxonomy: Validation, Operational, and Programmer Errors

In backend Node.js applications, robust architecture requires grouping errors into three clear operational tiers:

```
                            Application Error Taxonomy
                                        │
         ┌──────────────────────────────┼──────────────────────────────┐
         ▼                              ▼                              ▼
  Validation Errors              Operational Errors             Programmer Errors
  (Client Input Flaws)           (Runtime System Failures)      (Bugs in Application Code)
  - Missing body fields          - Database timeout             - Dereferencing null/undefined
  - Invalid UUID format          - Redis cache unavailable      - Passing wrong argument types
  - Action: Return 4xx           - Action: Retry / 503 / Alert  - Action: Log 500 / Alert / Restart
```

### 1. Validation Errors
- **Cause:** External input fails schema or business rules.
- **Handling:** Return an informative HTTP 4xx response to the client. Do not alert on-call engineers.

### 2. Operational Errors
- **Cause:** External dependencies or resources fail during standard operation (e.g., network partitions, socket hang-ups).
- **Handling:** Execute retry policies (with exponential backoff and jitter), fall back to cached data, or return HTTP 503. Record metrics for SLO tracking.

### 3. Programmer Errors
- **Cause:** Bugs in the source code (e.g., unhandled edge cases, calling non-functions, broken invariants).
- **Handling:** Fail fast. In Node.js, catching a programmer error and continuing execution often leaves the process in an undefined, corrupted state. Log complete diagnostics and restart the process safely.

---

## 8. Stack Unwinding Trace

To understand how JavaScript resolves exceptions, trace this multi-layered execution:

```js
// Node.js code
function stepC() {
  console.log("Entering stepC");
  throw new Error("Crash in stepC");
  console.log("Exiting stepC"); // Unreachable
}

function stepB() {
  console.log("Entering stepB");
  try {
    stepC();
  } finally {
    // ✅ finally runs during stack unwinding even though there is no catch here!
    console.log("Cleanup in stepB");
  }
  console.log("Exiting stepB"); // Unreachable
}

function stepA() {
  console.log("Entering stepA");
  try {
    stepB();
  } catch (err) {
    console.log("Caught in stepA:", err.message);
  }
  console.log("Exiting stepA"); // Resumes normal execution
}

stepA();
```

### Execution Output:
```text
Entering stepA
Entering stepB
Entering stepC
Cleanup in stepB
Caught in stepA: Crash in stepC
Exiting stepA
```

**Walkthrough:**
1. `stepA` calls `stepB`, which calls `stepC`.
2. `stepC` throws an `Error`. Normal execution in `stepC` halts immediately.
3. JavaScript checks `stepC` for a `catch` block (none found).
4. Stack unwinds to `stepB`. `stepB` has a `finally` block, so `Cleanup in stepB` executes. Because `stepB` has no `catch`, unwinding continues.
5. Stack unwinds to `stepA`. `stepA` contains a matching `catch`, which handles the error.
6. Normal linear execution resumes in `stepA`, logging `Exiting stepA`.

---

## 9. Synchronous vs. Asynchronous Error Boundaries

A classic pitfall in JavaScript is attempting to wrap asynchronous operations in a synchronous `try/catch` block.

```js
// Node.js code

// ❌ Fatal mistake: try/catch CANNOT catch asynchronous errors
function readConfigAsyncBroken() {
  try {
    setTimeout(() => {
      // ⚠️ This exception runs on a brand-new call stack on a future event loop tick!
      // The outer try/catch finished and exited milliseconds ago!
      throw new Error("Disk read failed");
    }, 50);
  } catch (err) {
    console.log("This line NEVER executes!");
  }
}

// In Node.js, this crashes the process via the 'uncaughtException' event.
```

### The Rule for Asynchronous Error Handling
Every asynchronous operation must deliver its error through an **asynchronous error channel**:
- **Callbacks:** Pass the error as the first argument: `callback(err, null)`.
- **Promises / Async-Await:** Reject the promise: `reject(err)` or `await` inside a `try/catch`.

```js
// Node.js code
// ✅ Correct asynchronous error delivery via error-first callback
function readConfigAsyncSafe(callback) {
  setTimeout(() => {
    try {
      // Simulate file reading that fails
      throw new Error("Disk read failed");
    } catch (err) {
      callback(err, null); // Pass error through callback channel
    }
  }, 50);
}

readConfigAsyncSafe((err, config) => {
  if (err) {
    console.log("✅ Safely received async error:", err.message);
  }
});
```

---

## 10. Multi-Resource Acquisition and Cleanup Order

When allocating multiple resources (e.g., database connections, temporary files, network sockets), resources must be released in **reverse order of acquisition**.

Furthermore, if the acquisition of the second resource fails, the first resource must still be closed safely.

```js
// Node.js code
function executeWithResources(openSource, openTarget, transform) {
  const source = openSource();
  try {
    const target = openTarget();
    try {
      return transform(source, target);
    } finally {
      // Target closed first
      console.log("Closing target resource");
      target.close();
    }
  } finally {
    // Source closed second (even if openTarget() threw an error!)
    console.log("Closing source resource");
    source.close();
  }
}

const mockResource = (name) => ({ name, close: () => console.log(`Closed: ${name}`) });

executeWithResources(
  () => mockResource("SourceDB"),
  () => mockResource("TargetS3"),
  (s, t) => console.log(`Piping ${s.name} to ${t.name}`)
);
```

---

## Tricky Points

### 1. `return` in `finally` Swallows Errors Completely
Any explicit `return` in a `finally` block cancels any pending exception from `try` or `catch`, converting the error into a silent normal return.
```js
// Node.js code
function broken() {
  try { throw new Error("Critical DB failure"); }
  finally { return "All good!"; } // ❌ Silently destroys the Error!
}
console.log(broken()); // "All good!"
```

### 2. Throwing Primitives Strips Stack Traces
Throwing strings, numbers, or plain objects prevents debugging because primitive values have no `.stack` property and fail `instanceof Error` checks.
```js
// Node.js code
try { throw "Network timeout"; } 
catch (e) { console.log(e.stack); } // undefined!
```

### 3. Asynchronous Timer Exceptions Escape `try/catch`
Wrapping `setTimeout` in `try/catch` does nothing for exceptions thrown inside the timer callback. The timer executes on an empty call stack on a later event loop tick.
```js
// Node.js code
try {
  setTimeout(() => { throw new Error("Boom"); }, 10);
} catch (e) {
  // Never caught!
}
```

### 4. Custom Errors and `instanceof` Breakage Across Transpilation
Extending `Error` in older environments without calling `Object.setPrototypeOf(this, CustomError.prototype)` can cause `instanceof` checks to fail. In modern Node.js (ES2015+ classes), `super(message)` handles this natively.

### 5. `Error.captureStackTrace` is V8/Node.js Specific
`Error.captureStackTrace(this, CustomClass)` is not an ECMAScript standard method; it is a V8 engine optimization. Guard it with `if (Error.captureStackTrace)` for universal compatibility.

### 6. Masking Root Errors by Overwriting Messages
Catching an error and throwing `new Error("Operation failed")` without passing `{ cause: originalError }` permanently severs the diagnostic trail.

### 7. Leaking Secrets in Error Payloads
Logging or serializing raw error objects to client HTTP responses can leak database passwords, file paths, connection strings, and authorization tokens. Always sanitize errors before returning them to callers.

---

## Hands-on Exercise

### Scenario: Building a Resilient Profile Service with Error Taxonomy

You are building a profile data provider in a Node.js microservice. You must implement a function, `fetchAndValidateProfile(userId, dataStore, options)`, with explicit error boundaries.

### Buggy Code

A junior developer implemented the service, but it contains severe production flaws:
1. It uses a `return` in `finally` that suppresses validation errors.
2. It throws raw strings when the user is not found.
3. It does not sanitize errors sent to the caller, exposing database credentials.
4. It does not preserve the root cause when dataStore queries fail.

```js
// Node.js code (Buggy Implementation)
function buggyFetchProfile(userId, dataStore) {
  let connection = null;
  try {
    if (typeof userId !== "number" || userId <= 0) {
      throw new Error("Invalid user ID");
    }
    connection = dataStore.connect("postgres://admin:supersecret@db:5432/users");
    const user = connection.query(userId);
    if (!user) {
      throw "User not found"; // Bug 2: Throwing raw string
    }
    return user;
  } catch (err) {
    // Bug 3: Leaks raw err containing database URL to caller
    throw new Error(`Profile fetch failed: ${err}`);
  } finally {
    if (connection) connection.close();
    // Bug 1: Overwrites all exceptions with null!
    return null; 
  }
}
```

### Acceptance Criteria

1. **Custom Error Hierarchy:** Define `ValidationError` (400), `NotFoundError` (404), and `DatabaseError` (500) extending a base `AppError`.
2. **Preserve Root Causes:** If low-level database operations fail, wrap them in `DatabaseError` with `{ cause: rawError }`.
3. **Guaranteed Handle Cleanup Without Suppression:** Ensure `connection.close()` executes inside `finally` without using `return` in `finally`.
4. **Secret Redaction:** Strip sensitive database connection strings from public error messages while preserving them in internal diagnostic logging.

### Solution

```js
// Node.js code

// 1. Base Application Error Class
class AppError extends Error {
  constructor(message, { statusCode = 500, code = "INTERNAL_ERROR", isOperational = true, cause } = {}) {
    super(message, { cause });
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// 2. Specific Domain Error Classes
class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, { statusCode: 400, code: "INVALID_INPUT" });
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(entity, id) {
    super(`${entity} with ID ${id} not found`, { statusCode: 404, code: "NOT_FOUND" });
  }
}

class DatabaseError extends AppError {
  constructor(message, { cause } = {}) {
    super(message, { statusCode: 500, code: "DB_FAILURE", cause });
  }
}

// 3. Resilient Service Function
function fetchAndValidateProfile(userId, dataStore) {
  // Input validation
  if (typeof userId !== "number" || !Number.isInteger(userId) || userId <= 0) {
    throw new ValidationError("User ID must be a positive integer", { userId });
  }

  let connection = null;
  try {
    try {
      connection = dataStore.connect("postgres://admin:supersecret@db:5432/users");
      const user = connection.query(userId);

      if (!user) {
        throw new NotFoundError("User", userId);
      }

      return { id: user.id, username: user.username };
    } catch (rawErr) {
      // Re-throw our known domain errors
      if (rawErr instanceof AppError) {
        throw rawErr;
      }
      // Wrap unexpected database errors, redacting credentials
      const sanitizedMessage = "Database operation failed during profile lookup";
      throw new DatabaseError(sanitizedMessage, { cause: rawErr });
    }
  } finally {
    // Guaranteed cleanup without abrupt return
    if (connection) {
      connection.close();
    }
  }
}

// --- Verification Tests ---

const mockDbSuccess = {
  connect: () => ({
    query: (id) => ({ id, username: "dev_alice" }),
    close: () => console.log("Connection closed safely")
  })
};

const mockDbCrash = {
  connect: () => ({
    query: () => { throw new Error("Socket timeout on host db:5432 with pass supersecret"); },
    close: () => console.log("Connection closed after crash")
  })
};

// Test 1: Validation failure
try {
  fetchAndValidateProfile(-5, mockDbSuccess);
} catch (e) {
  console.log("Test 1 (Validation):", e.name, "| Code:", e.code, "| Status:", e.statusCode);
}

// Test 2: Success
const profile = fetchAndValidateProfile(42, mockDbSuccess);
console.log("Test 2 (Success):", profile.username);

// Test 3: Database failure with cause preservation and secret sanitization
try {
  fetchAndValidateProfile(42, mockDbCrash);
} catch (e) {
  console.log("Test 3 (DB Failure):", e.name, "| Message:", e.message);
  console.log("Root Cause Preserved:", e.cause.message.includes("Socket timeout"));
}
```

---

## Summary

- **Failure Categories:** Syntax errors prevent code from parsing; runtime exceptions halt normal execution and unwind the stack; logic errors produce incorrect behavior without throwing.
- **Built-in Errors:** Use standard classes (`TypeError`, `RangeError`, `ReferenceError`, `SyntaxError`) to signal specific failure reasons.
- **The Throw Anti-pattern:** Always throw `Error` objects or custom subclasses. Throwing strings or primitives strips stack traces and breaks `instanceof` checks.
- **`finally` Execution:** Guaranteed to run after `try` and `catch` under all conditions. Never execute a `return` or `throw` inside `finally` because it overrides and swallows pending exceptions.
- **Error Chaining:** Use ES2022 `{ cause }` to preserve root diagnostic errors when wrapping lower-level exceptions into high-level domain errors.
- **Async Boundaries:** Synchronous `try/catch` cannot intercept exceptions thrown in asynchronous callbacks (timers, I/O). Asynchronous errors must use callbacks or promise rejection channels.
- **Operational Taxonomy:** Separate client validation errors (HTTP 4xx), operational system failures (HTTP 503/retries), and programmer bugs (log 500 and fail fast).

---

## Cheat Sheet

### Built-in Error Types

| Error Class | When It Throws | Example |
| :--- | :--- | :--- |
| **`TypeError`** | Invalid type or operation | `null.foo()`, `const a = 1; a()` |
| **`RangeError`** | Numeric value out of allowed range | `(-1).toFixed(2)`, `new Array(-5)` |
| **`ReferenceError`** | Variable does not exist or in TDZ | `console.log(undeclaredVar)` |
| **`SyntaxError`** | Code cannot be parsed | `JSON.parse("invalid")` |
| **`AggregateError`** | Multiple errors combined | `Promise.any([p1, p2])` rejection |

### Control Flow Combinations

| Construct | Catches Exceptions | Guaranteed Cleanup | Overrides Previous Return |
| :--- | :--- | :--- | :--- |
| `try/catch` | ✅ Yes | ❌ No | ❌ No |
| `try/finally` | ❌ No (unwinds) | ✅ Yes | ⚠️ Yes (if `finally` returns) |
| `try/catch/finally` | ✅ Yes | ✅ Yes | ⚠️ Yes (if `finally` returns) |

### Common Pitfalls

- **Placing `return` inside `finally`** → silently discards any active exception thrown in `try` or `catch`.
- **Throwing strings (`throw "failed"`)** → strips stack traces and breaks standard error handling middleware.
- **Empty `catch` blocks (`catch {}`)** → silently swallows critical bugs and leaves the system in an unknown state.
- **Attempting to wrap `setTimeout` in `try/catch`** → asynchronous callback runs on a new stack; error escapes uncaught.
- **Exposing raw database error messages to HTTP clients** → leaks internal server paths, database credentials, and SQL queries.
- **Re-throwing without preserving `cause`** → destroys the root diagnostic trail needed for production debugging.

---

## Interview Questions

### 1. What happens when an exception is thrown in a `try` block, caught in `catch`, and both `catch` and `finally` contain `return` statements?

**Question:** Trace the execution order and determine the final return value of this function. Explain how JavaScript engines handle abrupt completions in `finally` blocks.

```js
function testControlFlow() {
  try {
    throw new Error("Initial failure");
  } catch (err) {
    return "Value from catch";
  } finally {
    return "Value from finally";
  }
}

console.log(testControlFlow());
```

**Answer:**
**Output:**
```text
Value from finally
```

**Explanation:**
1. Inside the `try` block, an `Error` is thrown. JavaScript immediately interrupts the `try` block and looks for a matching `catch`.
2. The `catch` block receives the error and evaluates its statement: `return "Value from catch"`.
3. In JavaScript, an abrupt completion (such as a `return` or `throw`) in a `try` or `catch` block **suspends** execution while the engine executes the mandatory `finally` block before returning to the caller.
4. When execution enters the `finally` block, it encounters `return "Value from finally"`.
5. An abrupt completion in a `finally` block **discards** any pending completion from preceding blocks. The suspended `return "Value from catch"` is completely aborted, and the function returns `"Value from finally"`.
6. If the `catch` block had re-thrown an error instead of returning, the `return` in `finally` would have silently swallowed that error as well.

---

### 2. Predict the output: Stack unwinding with multiple `finally` blocks

```js
function levelThree() {
  try {
    throw new Error("Error in levelThree");
  } finally {
    console.log("Finally: levelThree");
  }
}

function levelTwo() {
  try {
    levelThree();
  } finally {
    console.log("Finally: levelTwo");
  }
}

function levelOne() {
  try {
    levelTwo();
  } catch (err) {
    console.log("Caught in levelOne:", err.message);
  } finally {
    console.log("Finally: levelOne");
  }
}

levelOne();
```

**Question:** What does this code print to the console? Trace how the call stack unwinds when no `catch` block exists in intermediate functions.

**Answer:**
**Output:**
```text
Finally: levelThree
Finally: levelTwo
Caught in levelOne: Error in levelThree
Finally: levelOne
```

**Explanation:**
1. `levelOne` calls `levelTwo`, which calls `levelThree`.
2. In `levelThree`, an exception is thrown. Because `levelThree` has no `catch` block, the exception begins unwinding the stack.
3. Before `levelThree` exits its scope, its `finally` block runs: `"Finally: levelThree"` is logged.
4. The exception unwinds into `levelTwo`. `levelTwo` also lacks a `catch` block, so its `finally` block runs: `"Finally: levelTwo"` is logged.
5. The exception unwinds into `levelOne`. `levelOne` has an active `catch` block matching the exception. The `catch` block executes and logs `"Caught in levelOne: Error in levelThree"`.
6. Finally, `levelOne` completes its lifecycle by running its own `finally` block, logging `"Finally: levelOne"`.

---

### 3. Debugging: Diagnosing unhandled exceptions in asynchronous callbacks

```js
// Express / Node.js route handler
app.get("/user-stats", (req, res) => {
  try {
    fetchStatsFromCache(req.query.userId, (err, stats) => {
      if (err) throw err;
      res.json({ success: true, stats });
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load stats" });
  }
});
```

**Question:** In production, when `fetchStatsFromCache` returns an error, the Node.js application crashes completely with an unhandled exception instead of returning HTTP 500. Explain why this happens and rewrite the code safely.

**Answer:**
**Diagnosis:**
`fetchStatsFromCache` is an asynchronous operation whose callback executes on a future event loop tick.
1. The outer `try/catch` block runs synchronously during the initial request dispatch and finishes immediately after initiating `fetchStatsFromCache`.
2. When the callback is invoked later, the `try/catch` block has already finished and no longer exists on the call stack.
3. Executing `throw err` inside an asynchronous callback throws on an empty call stack. Because there is no active `try/catch` above it, the exception escapes to the Node.js process level, emitting an `uncaughtException` event and crashing the server.

**Safe Refactored Code:**
```js
// Node.js code
app.get("/user-stats", (req, res, next) => {
  fetchStatsFromCache(req.query.userId, (err, stats) => {
    if (err) {
      // ✅ Forward error directly to Express centralized error handler or send 500
      return res.status(500).json({ error: "Failed to load stats" });
    }
    res.json({ success: true, stats });
  });
});
```

---

### 4. Node.js Backend Scenario: Designing a Centralized Custom Error Hierarchy

**Question:** In a production Node.js/Express service, database queries, external payment APIs, and incoming JSON payloads can all fail. Design a centralized custom error hierarchy that:
1. Distinguishes operational errors from programmer bugs.
2. Preserves underlying root causes using ES2022 `Error.cause`.
3. Generates safe client-facing responses without leaking database credentials or stack traces.

**Answer:**

```js
// Node.js code

// 1. Base Domain Error
class AppError extends Error {
  constructor(message, { statusCode = 500, code = "INTERNAL_SERVER_ERROR", isOperational = true, cause } = {}) {
    super(message, { cause });
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// 2. Specific Domain Subclasses
class ValidationError extends AppError {
  constructor(message, fields = {}) {
    super(message, { statusCode: 400, code: "VALIDATION_FAILED" });
    this.fields = fields;
  }
}

class ExternalServiceError extends AppError {
  constructor(serviceName, originalError) {
    super(`External dependency '${serviceName}' failed`, {
      statusCode: 502,
      code: "BAD_GATEWAY",
      cause: originalError
    });
  }
}

// 3. Centralized Express Error-Handling Middleware
function errorHandler(err, req, res, next) {
  // A. Internal Diagnostic Logging (Preserves full diagnostic trace and root cause)
  console.error("INTERNAL ERROR LOG:", {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack,
    cause: err.cause ? { message: err.cause.message, stack: err.cause.stack } : undefined
  });

  // B. Client Response Formatting
  if (err instanceof AppError && err.isOperational) {
    // Known operational error: safe to share structured message
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.fields ? { fields: err.fields } : {})
      }
    });
  }

  // C. Programmer Bug or Unknown Failure: Redact details to prevent data leakage
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred. Please contact support."
    }
  });
}
```

---

<nav aria-label="Lecture navigation">

[← Day 06: Functions, Parameters, and Callbacks](day-06-functions-parameters-and-callbacks.md) | [Roadmap](../javascript-roadmap.md) | [Day 08: Closures, Execution Context, and this →](day-08-closures-execution-context-and-this.md)

</nav>
