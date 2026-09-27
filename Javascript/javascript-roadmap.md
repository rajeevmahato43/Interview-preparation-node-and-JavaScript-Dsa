# Pure JavaScript Roadmap for Node.js Developers

A 28-day, interview-focused JavaScript curriculum for backend developers preparing for mid-to-senior roles. This roadmap treats JavaScript as a language and runtime — not just syntax — and builds the mental models you need before studying Node.js APIs.

**Primary references:** [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide) and the [ECMAScript specification](https://tc39.es/ecma262/) (ES2025). This is a *JavaScript* roadmap; the separate [Node.js roadmap](../Node/node-roadmap.md) covers host/runtime APIs.

## How to Use This Roadmap

- Study one day at a time.
- Keep the lecture files under `Javascript/javascript-lectures/` with stable names.
- Treat prerequisites as real requirements, not suggestions.
- Follow the order; later topics build heavily on earlier mental models (e.g., Day 18 Promises assumes Day 08 Closures).
- Write the lecture before the questions — study the material, then attempt the interview section.
- Use MDN for API specifics and the ECMAScript spec for language guarantees. Don't treat browser behavior or Node APIs as language guarantees.

## Course Goals

By the end of this roadmap, the learner should be able to:

- explain JavaScript values, types, coercion, and equality at a level that supports debugging and interview reasoning
- trace scope, closures, `this`, and prototype lookup with confidence
- compose promises and async/await correctly with proper error propagation
- reason about microtask scheduling, memory reachability, and performance tradeoffs
- design testable, secure, and maintainable JavaScript boundaries for Node services
- defend language-level choices in a senior backend interview without pretending there is a universal answer

## Recommended Order

1. Foundations (grammar, values, types, coercion)
2. Control flow and functions
3. Objects and core data structures
4. Modern JavaScript and metaprogramming
5. Modules and asynchronous JavaScript
6. Performance, correctness, and security
7. Integrated JavaScript for Node applications

## Phase 1: Foundations

### Day 01: JavaScript Execution Model and Grammar
- **Topics:** What JavaScript is; ECMAScript versus host environments; scripts and modules; source text; Unicode; identifiers; reserved words; literals; statements; expressions; blocks; comments; semicolon insertion; strict mode; syntax errors
- **Lecture:** `day-01-execution-model-and-syntax.md`
- **Prerequisites:** Basic programming concepts
- **Node relevance:** Helps distinguish language behavior from behavior supplied by Node.js and prevents incorrect assumptions about execution order and syntax
- **MDN:** [Grammar and types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types), [Lexical grammar](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar), [Strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode)
- **Exercise:** Classify a mixed file of declarations, expressions, blocks, and comments; identify ASI-sensitive lines and rewrite them unambiguously
- **Interview focus:** Statements versus expressions, strict mode, ASI hazards, and syntax errors versus runtime errors

### Day 02: Variables, Declarations, and Scope Foundations
- **Topics:** `var`, `let`, and `const`; declaration versus initialization; reassignment; identifiers; block scope; function scope; global and module scope; hoisting; temporal dead zone; shadowing; `globalThis`
- **Lecture:** `day-02-variables-scope-and-hoisting.md`
- **Prerequisites:** Day 01
- **Node relevance:** Scope and declaration behavior directly affect module state, request handlers, configuration values, and accidental shared state
- **MDN:** [Declaring variables](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#declarations), [`let`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let), [`const`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const), [`var`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var)
- **Exercise:** Trace a program containing `var`, `let`, `const`, shadowing, and access before initialization; explain every output or error
- **Interview focus:** Hoisting, TDZ, block versus function scope, and why `const` prevents rebinding but not object mutation

### Day 03: Values, Types, and Literals
- **Topics:** Primitive values; objects; strings; numbers; `bigint`; booleans; `undefined`; `null`; symbols; object values; functions as objects; array and object literals; regular-expression literals; `typeof`; `instanceof`; value identity
- **Lecture:** `day-03-values-types-and-literals.md`
- **Prerequisites:** Days 01–02
- **Node relevance:** Type assumptions influence validation, serialization, IDs, configuration, and data received from external systems
- **MDN:** [Data structures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures), [`typeof`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof), [Literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#literals)
- **Exercise:** Build a type-inspection table for primitives, arrays, functions, dates, and custom objects, including surprising `typeof` results
- **Interview focus:** Primitive versus object values, `typeof null`, identity, and why type checks need context

### Day 04: Coercion, Truthiness, Equality, and Operators
- **Topics:** Explicit conversion; implicit coercion; `ToPrimitive`; string and numeric conversion; truthy and falsy values; `==`; `===`; relational comparison; arithmetic; assignment; logical operators; nullish coalescing; optional chaining; ternaries; `NaN`; `Object.is`
- **Lecture:** `day-04-coercion-equality-and-operators.md`
- **Prerequisites:** Day 03
- **Node relevance:** Coercion bugs commonly affect validation, authorization checks, pagination, feature flags, and environment-derived values
- **MDN:** [Type coercion](https://developer.mozilla.org/en-US/docs/Glossary/Type_coercion), [Truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy), [Equality comparisons](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness), [Operators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators)
- **Exercise:** Predict and then verify a coercion matrix involving empty strings, zero, `false`, `null`, `undefined`, arrays, and objects
- **Interview focus:** `NaN`, `-0`, loose equality, `||` versus `??`, and short-circuit evaluation

## Phase 2: Control Flow and Functions

### Day 05: Conditions, Loops, and Control Transfer
- **Topics:** `if`; `switch`; `for`; `while`; `do...while`; `for...in`; `for...of`; `break`; `continue`; labels; block behavior; loop variable scope; infinite loops
- **Lecture:** `day-05-control-flow-and-loops.md`
- **Prerequisites:** Days 01–04
- **Node relevance:** Correct control flow prevents request-path bugs and clarifies synchronous work that can block a Node event loop
- **MDN:** [Control flow and error handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling), [Loops and iteration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration)
- **Exercise:** Implement the same data-processing task with indexed loops, `for...of`, and `forEach`; compare control transfer and early exit behavior
- **Interview focus:** `for...in` versus `for...of`, closure capture in loops, and mutation during iteration

### Day 06: Functions and Parameters
- **Topics:** Function declarations; expressions; arrow functions; parameters; default parameters; rest parameters; return values; first-class functions; higher-order functions; callbacks; `arguments`; function names; pure functions
- **Lecture:** `day-06-functions-parameters-and-callbacks.md`
- **Prerequisites:** Days 02 and 05
- **Node relevance:** Node services are composed of functions passed into routers, event handlers, utilities, and asynchronous APIs
- **MDN:** [Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions), [Arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions), [Rest parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters)
- **Exercise:** Write a higher-order function that validates callback arguments and preserves useful error context
- **Interview focus:** Declaration hoisting, arrow-function differences, callback contracts, `arguments`, and parameter evaluation

### Day 07: Errors and Exceptions
- **Topics:** Syntax errors; runtime errors; `Error`; built-in error types; `throw`; `try`; `catch`; `finally`; error identity; cause chains; rethrowing; cleanup; partial failure; validation errors versus programmer errors
- **Lecture:** `day-07-errors-and-exception-flow.md`
- **Prerequisites:** Days 04 and 06
- **Node relevance:** Error boundaries and cleanup decisions are essential in request handlers and asynchronous service code, even though Node-specific error APIs belong elsewhere
- **MDN:** [Control flow and error handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling), [`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error), [`try...catch`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch)
- **Exercise:** Design an error taxonomy for a small service function and test which errors are handled, transformed, rethrown, or allowed to escape
- **Interview focus:** `finally` return behavior, preserving causes, thrown non-Errors, and synchronous versus asynchronous error boundaries

### Day 08: Scope, Closures, Execution Context, and `this`
- **Topics:** Lexical environments; scope chain; closures; closure capture; execution context; function invocation; method calls; plain calls; constructor calls; explicit binding; arrow `this`; `call`; `apply`; `bind`; strict mode effects
- **Lecture:** `day-08-closures-execution-context-and-this.md`
- **Prerequisites:** Days 02 and 06
- **Node relevance:** Closures and `this` affect middleware factories, dependency injection, callbacks, class-based services, and retained memory
- **MDN:** [Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures), [`this`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this), [Function binding](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)
- **Exercise:** Trace a callback-heavy program and explain which variables remain reachable after the outer function returns
- **Interview focus:** Closure capture in loops, lost method receivers, arrow `this`, and memory retained by closures

## Phase 3: Objects and Core Data Structures

### Day 09: Objects and Property Access
- **Topics:** Object creation; property keys; dot and bracket access; computed properties; own versus inherited properties; missing properties; `undefined`; getters; setters; method shorthand; object spread; destructuring basics
- **Lecture:** `day-09-objects-and-property-access.md`
- **Prerequisites:** Days 03–04 and 08
- **Node relevance:** Most Node application data crosses object boundaries; defensive property access prevents malformed input from becoming incorrect behavior
- **MDN:** [Working with objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects), [Property accessors](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_accessors), [Optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)
- **Exercise:** Safely read nested input with explicit defaults while distinguishing a missing property from a present property whose value is `undefined`
- **Interview focus:** Prototype-chain lookup, `in`, `hasOwn`, getters, computed keys, and prototype pollution risk

### Day 10: Prototypes, Classes, and Inheritance
- **Topics:** Prototype chains; `[[Prototype]]`; constructor functions; `new`; classes; constructors; instance methods; static methods; private fields; `extends`; `super`; overriding; composition versus inheritance
- **Lecture:** `day-10-prototypes-classes-and-inheritance.md`
- **Prerequisites:** Day 09
- **Node relevance:** Class and prototype behavior appears in libraries, domain models, errors, and framework integrations used by Node applications
- **MDN:** [Inheritance and the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain), [Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)
- **Exercise:** Implement the same domain object with composition and inheritance; document which behavior is shared and which state is per instance
- **Interview focus:** Class syntax versus prototype behavior, `super`, private fields, constructor return values, and inheritance tradeoffs

### Day 11: Property Descriptors, Enumerability, and Immutability
- **Topics:** Writable, enumerable, and configurable attributes; `Object.defineProperty`; `Object.getOwnPropertyDescriptor`; sealing; freezing; preventing extensions; shallow immutability; defensive copying; property order rules
- **Lecture:** `day-11-property-descriptors-and-immutability.md`
- **Prerequisites:** Day 09
- **Node relevance:** Descriptor and copying choices affect configuration objects, public API boundaries, caches, and protection of shared state
- **MDN:** [Working with objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects), [`Object.defineProperty`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty), [`Object.freeze`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)
- **Exercise:** Create a configuration object with read-only top-level settings and demonstrate what freezing does and does not protect
- **Interview focus:** Shallow versus deep freeze, descriptor defaults, enumeration, and mutation through nested references

### Day 12: Arrays, Strings, Numbers, `Map`, `Set`, and JSON
- **Topics:** Array indexing and length; sparse arrays; mutation; iteration methods; sorting; strings and Unicode; number precision; `NaN`; `BigInt` boundaries; `Map`; `Set`; weak collections overview; JSON serialization and loss of information
- **Lecture:** `day-12-built-in-data-structures-and-serialization.md`
- **Prerequisites:** Days 03–04 and 09
- **Node relevance:** These types are used for request data, in-memory indexes, IDs, logs, and serialization at service boundaries
- **MDN:** [Indexed collections](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections), [Keyed collections](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Keyed_collections), [Numbers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Numbers_and_strings), [JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON)
- **Exercise:** Compare an array, object, `Map`, and `Set` for a lookup task; test duplicates, insertion order, sparse slots, and JSON output
- **Interview focus:** Sparse arrays, default lexicographic sort, `NaN`, numeric precision, `Map` key identity, and JSON limitations

## Phase 4: Modern JavaScript and Metaprogramming

### Day 13: Destructuring, Spread, Rest, and Modern Operators
- **Topics:** Array and object destructuring; defaults; renaming; nested patterns; rest properties; spread syntax; shallow copies; optional chaining; nullish coalescing; logical assignment; template literals
- **Lecture:** `day-13-destructuring-spread-and-modern-operators.md`
- **Prerequisites:** Days 09 and 12
- **Node relevance:** These features are common in service-layer code, but shallow-copy behavior can accidentally share mutable request or configuration state
- **MDN:** [Destructuring assignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment), [Spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax), [Nullish coalescing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)
- **Exercise:** Normalize a partially populated input object without overwriting meaningful falsy values or sharing nested mutable state unintentionally
- **Interview focus:** Evaluation order, defaults only for `undefined`, shallow spread, and invalid optional-chaining forms

### Day 14: Iterables, Iterators, Generators, and Symbols
- **Topics:** Iterable protocol; iterator protocol; `Symbol.iterator`; custom iterables; generator functions; `yield`; `yield*`; lazy evaluation; generator errors; async iterables as a language concept
- **Lecture:** `day-14-iterables-iterators-generators-and-symbols.md`
- **Prerequisites:** Days 05, 06, and 12
- **Node relevance:** These protocols explain how application code consumes lazy sequences and later support understanding of Node stream iteration without teaching streams here
- **MDN:** [Iteration protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols), [yield](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield), [Generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator)
- **Exercise:** Build a bounded generator and a custom iterable; trace when each value is computed and how early termination invokes cleanup
- **Interview focus:** Iterable versus iterator, lazy versus eager work, generator return values, and cleanup with `return`

### Day 15: Regular Expressions and Text Processing
- **Topics:** Pattern syntax; character classes; anchors; groups; captures; named groups; quantifiers; greediness; flags; `exec`; `match`; replacement; Unicode behavior; catastrophic backtracking risks
- **Lecture:** `day-15-regular-expressions-and-text-processing.md`
- **Prerequisites:** Days 03, 04, and 12
- **Node relevance:** Regex is often used in validation, routing, parsing, and log processing; unsafe patterns can create denial-of-service risk
- **MDN:** [Regular expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions), [RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)
- **Exercise:** Validate a constrained identifier and benchmark a safe pattern against an intentionally backtracking-prone pattern using bounded input
- **Interview focus:** Global regex state, captures, greediness, Unicode flags, and when regex should be replaced with a parser

### Day 16: Symbols, Reflection, Proxies, and Metaprogramming
- **Topics:** Symbols; well-known symbols; property keys; `Reflect`; proxy traps; invariants; proxy limitations; custom behavior; `toStringTag`; inspection boundaries
- **Lecture:** `day-16-symbols-reflection-and-proxies.md`
- **Prerequisites:** Days 09–11 and 14
- **Node relevance:** Understanding metaprogramming helps when reading libraries and decorators, while avoiding unnecessary proxy complexity in hot or security-sensitive paths
- **MDN:** [Symbols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol), [Reflect](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect), [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- **Exercise:** Wrap an object with a proxy that validates writes and document which invariants prevent the proxy from lying about non-configurable properties
- **Interview focus:** Symbols versus strings, proxy invariants, `Reflect`, and observable behavior changes introduced by traps

## Phase 5: Modules and Asynchronous JavaScript

### Day 17: Modules and Module Interoperability
- **Topics:** Module scope; exports and imports; named versus default exports; live bindings; cyclic dependencies; dynamic import; top-level await as a language feature; CommonJS interoperability concepts; evaluation order
- **Lecture:** `day-17-modules-and-interoperability.md`
- **Prerequisites:** Days 02, 06, and 08
- **Node relevance:** Module boundaries determine dependency direction, initialization behavior, testability, and compatibility between ESM and CommonJS Node code
- **MDN:** [JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules), [import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import), [export](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export)
- **Exercise:** Split a small service into modules, introduce a cycle deliberately, and explain the observable initialization behavior before removing the cycle
- **Interview focus:** Live bindings, circular dependencies, default export interop, module evaluation, and why package resolution belongs to the Node roadmap

### Day 18: Promises and Promise Composition
- **Topics:** Promise states; settlement; thenables; `then`; `catch`; `finally`; chaining; flattening; return values; rejection propagation; `Promise.all`; `allSettled`; `race`; `any`; concurrency versus sequential composition
- **Lecture:** `day-18-promises-and-composition.md`
- **Prerequisites:** Days 06–07 and 17
- **Node relevance:** Promise composition controls service latency, failure propagation, parallel work, and accidental unhandled rejections
- **MDN:** [Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises), [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- **Exercise:** Implement sequential and bounded-parallel versions of a task runner; specify how failures and partial results are represented
- **Interview focus:** Promise resolution procedure, missing `return`, rejection propagation, combinator semantics, and accidental parallelism

### Day 19: `async`/`await` and Asynchronous Error Propagation
- **Topics:** Async functions; awaited values; suspension and resumption; `try`/`catch` around await; sequential awaits; parallel promise creation; cancellation as a cooperative design; timeouts as a boundary pattern; cleanup with `finally`
- **Lecture:** `day-19-async-await-errors-and-cleanup.md`
- **Prerequisites:** Days 07 and 18
- **Node relevance:** This is the dominant style for modern Node service logic, and incorrect await placement can cause latency or reliability bugs
- **MDN:** [async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function), [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await), [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- **Exercise:** Write an async workflow with a deadline, cooperative cancellation signal, cleanup, and explicit handling of partial failure
- **Interview focus:** Async function return values, synchronous throws before the first await, parallel versus sequential awaits, and unhandled rejection paths

### Day 20: Jobs, Microtasks, and Observable Scheduling
- **Topics:** Call stack; execution jobs; promise reactions; microtasks; `queueMicrotask`; timers as host behavior; scheduling guarantees versus host-specific event-loop behavior; starvation; ordering traces
- **Lecture:** `day-20-jobs-microtasks-and-scheduling.md`
- **Prerequisites:** Days 05, 08, and 18–19
- **Node relevance:** Promise scheduling affects ordering, latency, batching, and whether synchronous work or microtask chains delay other work in Node
- **MDN:** [Microtask guide](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide), [Execution model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model)
- **Exercise:** Trace a scheduling example and label language-guaranteed ordering separately from ordering supplied by a host environment
- **Interview focus:** Synchronous code versus promise reactions, microtask starvation, and why browser event-loop explanations cannot be copied wholesale to Node

## Phase 6: Performance, Correctness, and Security

### Day 21: Memory, Reachability, and Garbage Collection Concepts
- **Topics:** Reachability; object lifetime; allocation; garbage collection as implementation behavior; closures and retained references; caches; weak references; `WeakMap`; `WeakSet`; memory leaks; finalization caveats
- **Lecture:** `day-21-memory-reachability-and-garbage-collection.md`
- **Prerequisites:** Days 08–12 and 18–20
- **Node relevance:** Long-lived Node processes expose retained references, unbounded caches, listener closures, and large object graphs over time
- **MDN:** [Memory management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management), [WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)
- **Exercise:** Diagnose a deliberately retained object graph and propose a bounded ownership or eviction strategy without relying on finalizers
- **Interview focus:** Reachability versus scope, closure retention, weak collections, and why garbage collection timing is not a correctness contract

### Day 22: Performance and Algorithmic JavaScript
- **Topics:** Big-O reasoning; time and space costs; mutation versus copying; array and map access; hidden assumptions; hot loops; batching; lazy versus eager work; recursion depth; numeric limits
- **Lecture:** `day-22-performance-and-algorithmic-reasoning.md`
- **Prerequisites:** Days 05, 12, 14, and 21
- **Node relevance:** JavaScript algorithm choices directly affect request latency, memory use, and event-loop responsiveness
- **MDN:** [Indexed collections](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections), [Keyed collections](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Keyed_collections)
- **Exercise:** Compare two implementations of a lookup and aggregation task; state complexity, allocation behavior, mutation risks, and adversarial inputs
- **Interview focus:** Complexity with real assumptions, `sort` behavior, recursion depth, memory amplification, and when a `Map` is preferable to an object

### Day 23: Testing JavaScript Behavior
- **Topics:** Unit boundaries; pure versus stateful code; assertions; test fixtures; table-driven tests; property-based thinking; async tests; fake time concept; mocking tradeoffs; testing errors and cleanup
- **Lecture:** `day-23-testing-javascript-behavior.md`
- **Prerequisites:** Days 06–07 and 18–20
- **Node relevance:** Reliable Node services depend on tests that verify async ordering, error propagation, validation, and side-effect boundaries
- **MDN:** [Testing guide](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing)
- **Exercise:** Test a promise-based function for success, rejection, timeout, cleanup, and repeated invocation without relying on real external services
- **Interview focus:** Testing behavior instead of implementation details, async test completion, mock leakage, and deterministic time

### Day 24: Debugging and Observability of Language Behavior
- **Topics:** Reproducing failures; minimal examples; stack traces; source locations; inspecting values; tracing async boundaries; logging safely; assertions; debugging mutation and scheduling; distinguishing symptoms from causes
- **Lecture:** `day-24-debugging-and-language-failures.md`
- **Prerequisites:** Days 07, 18–20, and 23
- **Node relevance:** Debugging language-level failures is prerequisite to using Node diagnostics effectively; Node tooling itself belongs in the Node roadmap
- **MDN:** [JavaScript debugging](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/Introduction/debugging)
- **Exercise:** Reduce a failing asynchronous trace to a minimal reproducible example and document the causal sequence rather than only the final error
- **Interview focus:** Reading stack traces, lost error context, race-like ordering, mutable shared state, and minimal reproduction design

### Day 25: Security-Relevant JavaScript Behavior
- **Topics:** Prototype pollution; unsafe property paths; object injection; code evaluation hazards; regex denial of service; sensitive data in errors and logs; untrusted input; serialization assumptions; dependency boundary awareness
- **Lecture:** `day-25-security-relevant-javascript.md`
- **Prerequisites:** Days 09–16 and 21–24
- **Node relevance:** JavaScript object and evaluation behavior can become server-side vulnerabilities when applied to untrusted request data or configuration
- **MDN:** [Prototype pollution](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Prototype_pollution), [Eval](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval), [Regular expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions)
- **Exercise:** Harden a nested-object merge and validation function against unsafe keys, unexpected prototypes, and pathological input sizes
- **Interview focus:** Prototype pollution, `eval`, regex denial of service, trust boundaries, and secure defaults

## Phase 7: Integrated JavaScript for Node Applications

### Day 26: Designing JavaScript Boundaries in Services
- **Topics:** Module boundaries; pure core and side-effect edges; input normalization; domain objects; error contracts; dependency injection through functions; ownership of mutable state; API shape
- **Lecture:** `day-26-javascript-boundaries-for-services.md`
- **Prerequisites:** Days 09–11, 17–19, and 23–25
- **Node relevance:** This day applies pure JavaScript concepts to service design without teaching HTTP, filesystem, databases, or other Node APIs
- **MDN:** [Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules), [Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions), [Working with objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects)
- **Exercise:** Refactor a stateful service function into a pure decision core plus an injected side-effect boundary; define its error and data contracts
- **Interview focus:** Testability, dependency direction, mutation ownership, error contracts, and module design

### Day 27: Concurrency Reasoning and Resource-Safe Async Code
- **Topics:** Sequential versus concurrent work; bounded concurrency as a design problem; shared mutable state; idempotency at the function level; cancellation propagation; timeout ownership; cleanup; retry hazards; promise lifecycle
- **Lecture:** `day-27-concurrency-and-resource-safe-async.md`
- **Prerequisites:** Days 18–22 and 26
- **Node relevance:** These are language-level foundations for reliable Node services; transport, process, and resource APIs are intentionally deferred to the Node roadmap
- **MDN:** [Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises), [async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function), [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- **Exercise:** Design a bounded async coordinator with cancellation, timeout ownership, cleanup, and explicit treatment of partial completion
- **Interview focus:** Race conditions, promise leaks, retrying non-idempotent work, cancellation limits, and concurrency caps

### Day 28: Senior JavaScript Interview Integration
- **Topics:** End-to-end output tracing; language guarantees versus host behavior; choosing data structures; module and async design; performance and memory tradeoffs; security review; maintainability; explaining assumptions and alternatives
- **Lecture:** `day-28-senior-javascript-interview-integration.md`
- **Prerequisites:** Days 01–27
- **Node relevance:** Consolidates the JavaScript knowledge expected before studying Node architecture and APIs, without duplicating the separate Node roadmap
- **MDN:** [JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide), [JavaScript Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference)
- **Exercise:** Review a small service module for correctness, async behavior, memory retention, security, testability, and performance; propose changes with explicit tradeoffs
- **Interview focus:** Deep definition checks, output traces, implementation constraints, debugging, design tradeoffs, scale assumptions, and senior follow-ups

## Course Boundary

This roadmap covers JavaScript language semantics, async patterns, memory, performance, security, testing, and service-design foundations. It intentionally does not replace the separate Node.js, Express, MongoDB, PostgreSQL, DSA, or deployment courses.

The separate [Node.js roadmap](../Node/node-roadmap.md) picks up after Day 28 and covers host/runtime topics:

- Node.js architecture, V8 integration, event-loop phases
- Package resolution, `package.json`, loaders, runtime module config
- `process`, environment config, signals, process lifecycle
- Filesystem APIs, buffers, streams, backpressure, binary data
- Node events, timers, HTTP, networking, server APIs
- Worker threads, child processes, failure isolation
- Node testing, profiling, diagnostics, observability, graceful shutdown

The following are separate curricula and should not be added to this file:

- Express routing and middleware
- MongoDB data modeling and driver behavior
- PostgreSQL, SQL, transactions, and query planning
- Full DSA problem catalog
- Deployment, containers, cloud architecture, and operations

## Coverage Map

- Grammar, values, types, coercion, equality, operators: Days 01–04
- Control flow, functions, callbacks, recursion, errors: Days 05–07
- Scope, closures, execution context, `this`: Days 02, 08
- Objects, identity, mutation, copying, descriptors: Days 09–11, 13
- Prototypes, classes, inheritance: Day 10
- Arrays, strings, numbers, `NaN`, `Map`, `Set`, JSON: Day 12
- Iterators and generators: Day 14
- Regular expressions: Days 15, 25
- Symbols, reflection, proxies: Day 16
- Modules and interoperability: Days 17, 26
- Promises, `async`/`await`, async errors: Days 18–19, 27
- Event loop connection, microtasks, scheduling: Days 20, 27
- Memory and performance: Days 21–22, 27–28
- Testing and debugging: Days 23–24
- Security-relevant behavior: Days 25, 28
- Node-relevant integration and tradeoffs: Days 26–28

## Use This Course as a Real Checklist

A learner is ready to move on when they can:

- explain values, types, coercion, and equality without notes
- trace scope, closures, `this`, and prototype lookup confidently
- compose promises and async/await with correct error propagation
- reason about microtask scheduling and memory reachability
- design testable, secure JavaScript boundaries for services
- defend language-level choices in a senior interview with honest tradeoffs

## Source Policy

- Use [MDN's JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide) for organized explanations.
- Use [MDN's JavaScript Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference) for API and syntax details.
- Use the [ECMAScript specification](https://tc39.es/ecma262/) (ES2025) when a claim depends on a language-level guarantee or abstract operation.
- Use Node.js documentation only when a lecture explicitly compares JavaScript behavior with the Node host. Node APIs remain outside this roadmap.
- Rewrite explanations in original language. Do not copy MDN prose.
- Identify behavior that depends on engine, host, runtime version, configuration, or implementation rather than presenting it as universal JavaScript behavior.

## Lecture Quality Checklist

Before considering a future day lecture complete, verify that it has:

- Clear learning outcomes and prerequisites
- Basic material kept concise and difficult behavior explained deeply
- At least one complete example for important concepts
- A trace, comparison, or failure case for confusing behavior
- Node relevance clearly separated from ECMAScript guarantees
- Common mistakes and interview traps
- A practical exercise with inputs, outputs, constraints, edge cases, and acceptance criteria
- A complete summary and compact cheat sheet
- Hard and very hard questions in definition, trace, implementation, debugging, design, and senior follow-up forms
- Accurate source links and explicit version assumptions where needed

## Notes on Changes

This section documents every major adjustment made during the Professor CodeMaster review.

### 1. Converted Table Format to Bullet-Point Format
- **Before:** Each day entry used a two-column table for topics, prerequisites, lecture file, etc.
- **After:** Switched to the same bullet-point structure used by the Node.js roadmap (`- **Topics:**`, `- **Lecture:**`, `- **Prerequisites:**`, etc.) for consistency across both roadmaps.

### 2. Added Course Goals Section
- Matched the Node roadmap's "Course goals" section listing what the learner should be able to do after completing the curriculum.

### 3. Added Recommended Order Section
- Matched the Node roadmap's numbered phase summary for quick orientation.

### 4. Added Use This Course as a Real Checklist
- Matched the Node roadmap's readiness checklist that tells learners when they are ready to move on.

### 5. Converted Coverage Matrix from Table to Bullet List
- Changed from a Markdown table to a simple bullet-point "Coverage map" section matching the Node roadmap style.

### 6. Simplified Section Headers
- Changed `# Phase N:` to `## Phase N:` and `## Day NN —` to `### Day NN:` to match the Node roadmap heading hierarchy.

### 7. Streamlined Introduction
- Kept the 2-sentence core definition. Moved "How to Use" into a concise bullet list matching the Node roadmap's style.

### 8. Removed Horizontal Rules Between Days
- The Node roadmap does not use `---` separators between day entries, so they have been removed for consistency.

### 9. Preserved All Content
- All 28 days, all topics, exercises, interview focus areas, MDN links, the coverage matrix, source policy, and quality checklist are preserved. Only the presentation format changed.
