# Pure JavaScript Roadmap for Node.js Developers

A 28-day, interview-oriented JavaScript curriculum for backend developers. This roadmap uses MDN and the ECMAScript specification as primary references, while selecting topics that directly affect JavaScript running in Node.js.

This is a JavaScript roadmap, not a Node.js API roadmap. The separate Node roadmap should build on this one.

## How to Use This Roadmap

- Study one day as one focused unit.
- Create the matching lecture file under `Javascript/javascript-lectures/` when the day is expanded.
- Follow prerequisites in order; later topics depend heavily on the language mental models built earlier.
- For each day, write the lecture before attempting the interview questions.
- Use MDN for API details and the ECMAScript specification when a language guarantee needs to be distinguished from host behavior.
- Mark runtime-version-sensitive claims when writing the lecture. Do not treat browser behavior or Node APIs as ECMAScript language guarantees.

## Lecture File Convention

Future lecture files should use this pattern:

`Javascript/javascript-lectures/day-01-execution-model-and-syntax.md`

Each lecture should contain:

1. Learning outcomes
2. Prerequisites and links to earlier days
3. Core concepts
4. Detailed explanations of confusing or interview-sensitive behavior
5. JavaScript examples and execution traces
6. Node.js relevance without turning the lecture into a Node API lesson
7. Common mistakes and interview traps
8. `Tricky Points` when meaningful edge cases exist
9. A practical exercise with acceptance criteria
10. `Summary`
11. `Cheat Sheet`
12. Interview questions with follow-ups

# Phase 1: Foundations

## Day 01: JavaScript Execution Model and Grammar

- **Topics:** What JavaScript is; ECMAScript versus host environments; scripts and modules; source text; Unicode; identifiers; reserved words; literals; statements; expressions; blocks; comments; semicolon insertion; strict mode; syntax errors.
- **Prerequisites:** Basic programming concepts.
- **Future lecture:** `day-01-execution-model-and-syntax.md`
- **Node relevance:** Helps distinguish language behavior from behavior supplied by Node.js and prevents incorrect assumptions about execution order and syntax.
- **MDN:** [JavaScript Guide: Grammar and types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types), [Lexical grammar](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar), [Strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode)
- **Exercise:** Classify a mixed file of declarations, expressions, blocks, and comments; identify ASI-sensitive lines and rewrite them unambiguously.
- **Interview focus:** Statements versus expressions, strict mode, ASI hazards, and syntax errors versus runtime errors.

## Day 02: Variables, Declarations, and Scope Foundations

- **Topics:** `var`, `let`, and `const`; declaration versus initialization; reassignment; identifiers; block scope; function scope; global and module scope; hoisting; temporal dead zone; shadowing; `globalThis` as a host-provided concept.
- **Prerequisites:** Day 01.
- **Future lecture:** `day-02-variables-scope-and-hoisting.md`
- **Node relevance:** Scope and declaration behavior directly affect module state, request handlers, configuration values, and accidental shared state.
- **MDN:** [Declaring variables](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#declarations), [`let`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let), [`const`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const), [`var`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var)
- **Exercise:** Trace a program containing `var`, `let`, `const`, shadowing, and access before initialization; explain every output or error.
- **Interview focus:** Hoisting, TDZ, block versus function scope, and why `const` prevents rebinding but not object mutation.

## Day 03: Values, Types, and Literals

- **Topics:** Primitive values; objects; strings; numbers; `bigint`; booleans; `undefined`; `null`; symbols; object values; functions as objects; array and object literals; regular-expression literals; `typeof`; `instanceof`; value identity.
- **Prerequisites:** Days 01-02.
- **Future lecture:** `day-03-values-types-and-literals.md`
- **Node relevance:** Type assumptions influence validation, serialization, IDs, configuration, and data received from external systems.
- **MDN:** [Data structures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures), [`typeof`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof), [Literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#literals)
- **Exercise:** Build a type-inspection table for primitives, arrays, functions, dates, and custom objects, including surprising `typeof` results.
- **Interview focus:** Primitive versus object values, `typeof null`, identity, and why type checks need context.

## Day 04: Coercion, Truthiness, Equality, and Operators

- **Topics:** Explicit conversion; implicit coercion; `ToPrimitive`; string and numeric conversion; truthy and falsy values; `==`; `===`; relational comparison; arithmetic; assignment; logical operators; nullish coalescing; optional chaining; ternaries; `NaN`; `Object.is`.
- **Prerequisites:** Day 03.
- **Future lecture:** `day-04-coercion-equality-and-operators.md`
- **Node relevance:** Coercion bugs commonly affect validation, authorization checks, pagination, feature flags, and environment-derived values.
- **MDN:** [Type coercion](https://developer.mozilla.org/en-US/docs/Glossary/Type_coercion), [Truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy), [Equality comparisons](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness), [Operators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators)
- **Exercise:** Predict and then verify a coercion matrix involving empty strings, zero, `false`, `null`, `undefined`, arrays, and objects.
- **Interview focus:** `NaN`, `-0`, loose equality, `||` versus `??`, and short-circuit evaluation.

# Phase 2: Control Flow and Functions

## Day 05: Conditions, Loops, and Control Transfer

- **Topics:** `if`; `switch`; `for`; `while`; `do...while`; `for...in`; `for...of`; `break`; `continue`; labels; block behavior; loop variable scope; infinite loops.
- **Prerequisites:** Days 01-04.
- **Future lecture:** `day-05-control-flow-and-loops.md`
- **Node relevance:** Correct control flow prevents request-path bugs and clarifies synchronous work that can block a Node event loop.
- **MDN:** [Control flow and error handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling), [Loops and iteration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration)
- **Exercise:** Implement the same data-processing task with indexed loops, `for...of`, and `forEach`; compare control transfer and early exit behavior.
- **Interview focus:** `for...in` versus `for...of`, closure capture in loops, and mutation during iteration.

## Day 06: Functions and Parameters

- **Topics:** Function declarations; expressions; arrow functions; parameters; default parameters; rest parameters; return values; first-class functions; higher-order functions; callbacks; `arguments`; function names; pure functions.
- **Prerequisites:** Days 02 and 05.
- **Future lecture:** `day-06-functions-parameters-and-callbacks.md`
- **Node relevance:** Node services are composed of functions passed into routers, event handlers, utilities, and asynchronous APIs.
- **MDN:** [Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions), [Arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions), [Rest parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters)
- **Exercise:** Write a higher-order function that validates callback arguments and preserves useful error context.
- **Interview focus:** Declaration hoisting, arrow-function differences, callback contracts, `arguments`, and parameter evaluation.

## Day 07: Errors and Exceptions

- **Topics:** Syntax errors; runtime errors; `Error`; built-in error types; `throw`; `try`; `catch`; `finally`; error identity; cause chains; rethrowing; cleanup; partial failure; validation errors versus programmer errors.
- **Prerequisites:** Days 04 and 06.
- **Future lecture:** `day-07-errors-and-exception-flow.md`
- **Node relevance:** Error boundaries and cleanup decisions are essential in request handlers and asynchronous service code, even though Node-specific error APIs belong elsewhere.
- **MDN:** [Control flow and error handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling), [`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error), [`try...catch`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch)
- **Exercise:** Design an error taxonomy for a small service function and test which errors are handled, transformed, rethrown, or allowed to escape.
- **Interview focus:** `finally` return behavior, preserving causes, thrown non-Errors, and synchronous versus asynchronous error boundaries.

## Day 08: Scope, Closures, Execution Context, and `this`

- **Topics:** Lexical environments; scope chain; closures; closure capture; execution context; function invocation; method calls; plain calls; constructor calls; explicit binding; arrow `this`; `call`; `apply`; `bind`; strict mode effects.
- **Prerequisites:** Days 02 and 06.
- **Future lecture:** `day-08-closures-execution-context-and-this.md`
- **Node relevance:** Closures and `this` affect middleware factories, dependency injection, callbacks, class-based services, and retained memory.
- **MDN:** [Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures), [`this`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this), [Function binding](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)
- **Exercise:** Trace a callback-heavy program and explain which variables remain reachable after the outer function returns.
- **Interview focus:** Closure capture in loops, lost method receivers, arrow `this`, and memory retained by closures.

# Phase 3: Objects and Core Data Structures

## Day 09: Objects and Property Access

- **Topics:** Object creation; property keys; dot and bracket access; computed properties; own versus inherited properties; missing properties; `undefined`; getters; setters; method shorthand; object spread; destructuring basics.
- **Prerequisites:** Days 03-04 and 08.
- **Future lecture:** `day-09-objects-and-property-access.md`
- **Node relevance:** Most Node application data crosses object boundaries; defensive property access prevents malformed input from becoming incorrect behavior.
- **MDN:** [Working with objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects), [Property accessors](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_accessors), [Optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)
- **Exercise:** Safely read nested input with explicit defaults while distinguishing a missing property from a present property whose value is `undefined`.
- **Interview focus:** Prototype-chain lookup, `in`, `hasOwn`, getters, computed keys, and prototype pollution risk.

## Day 10: Prototypes, Classes, and Inheritance

- **Topics:** Prototype chains; `[[Prototype]]`; constructor functions; `new`; classes; constructors; instance methods; static methods; private fields; `extends`; `super`; overriding; composition versus inheritance.
- **Prerequisites:** Day 09.
- **Future lecture:** `day-10-prototypes-classes-and-inheritance.md`
- **Node relevance:** Class and prototype behavior appears in libraries, domain models, errors, and framework integrations used by Node applications.
- **MDN:** [Inheritance and the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain), [Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)
- **Exercise:** Implement the same domain object with composition and inheritance; document which behavior is shared and which state is per instance.
- **Interview focus:** Class syntax versus prototype behavior, `super`, private fields, constructor return values, and inheritance tradeoffs.

## Day 11: Property Descriptors, Enumerability, and Immutability

- **Topics:** Writable, enumerable, and configurable attributes; `Object.defineProperty`; `Object.getOwnPropertyDescriptor`; sealing; freezing; preventing extensions; shallow immutability; defensive copying; property order rules.
- **Prerequisites:** Day 09.
- **Future lecture:** `day-11-property-descriptors-and-immutability.md`
- **Node relevance:** Descriptor and copying choices affect configuration objects, public API boundaries, caches, and protection of shared state.
- **MDN:** [Working with objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects), [`Object.defineProperty`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty), [`Object.freeze`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)
- **Exercise:** Create a configuration object with read-only top-level settings and demonstrate what freezing does and does not protect.
- **Interview focus:** Shallow versus deep freeze, descriptor defaults, enumeration, and mutation through nested references.

## Day 12: Arrays, Strings, Numbers, `Map`, `Set`, and JSON

- **Topics:** Array indexing and length; sparse arrays; mutation; iteration methods; sorting; strings and Unicode; number precision; `NaN`; `BigInt` boundaries; `Map`; `Set`; weak collections overview; JSON serialization and loss of information.
- **Prerequisites:** Days 03-04 and 09.
- **Future lecture:** `day-12-built-in-data-structures-and-serialization.md`
- **Node relevance:** These types are used for request data, in-memory indexes, IDs, logs, and serialization at service boundaries.
- **MDN:** [Indexed collections](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections), [Keyed collections](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Keyed_collections), [Numbers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Numbers_and_strings), [JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON)
- **Exercise:** Compare an array, object, `Map`, and `Set` for a lookup task; test duplicates, insertion order, sparse slots, and JSON output.
- **Interview focus:** Sparse arrays, default lexicographic sort, `NaN`, numeric precision, `Map` key identity, and JSON limitations.

# Phase 4: Modern JavaScript and Metaprogramming

## Day 13: Destructuring, Spread, Rest, and Modern Operators

- **Topics:** Array and object destructuring; defaults; renaming; nested patterns; rest properties; spread syntax; shallow copies; optional chaining; nullish coalescing; logical assignment; template literals.
- **Prerequisites:** Days 09 and 12.
- **Future lecture:** `day-13-destructuring-spread-and-modern-operators.md`
- **Node relevance:** These features are common in service-layer code, but shallow-copy behavior can accidentally share mutable request or configuration state.
- **MDN:** [Destructuring assignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment), [Spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax), [Nullish coalescing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)
- **Exercise:** Normalize a partially populated input object without overwriting meaningful falsy values or sharing nested mutable state unintentionally.
- **Interview focus:** Evaluation order, defaults only for `undefined`, shallow spread, and invalid optional-chaining forms.

## Day 14: Iterables, Iterators, Generators, and Symbols

- **Topics:** Iterable protocol; iterator protocol; `Symbol.iterator`; custom iterables; generator functions; `yield`; `yield*`; lazy evaluation; generator errors; async iterables as a language concept.
- **Prerequisites:** Days 05, 06, and 12.
- **Future lecture:** `day-14-iterables-iterators-generators-and-symbols.md`
- **Node relevance:** These protocols explain how application code consumes lazy sequences and later support understanding of Node stream iteration without teaching streams here.
- **MDN:** [Iteration protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols), [ yield ](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield), [Generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator)
- **Exercise:** Build a bounded generator and a custom iterable; trace when each value is computed and how early termination invokes cleanup.
- **Interview focus:** Iterable versus iterator, lazy versus eager work, generator return values, and cleanup with `return`.

## Day 15: Regular Expressions and Text Processing

- **Topics:** Pattern syntax; character classes; anchors; groups; captures; named groups; quantifiers; greediness; flags; `exec`; `match`; replacement; Unicode behavior; catastrophic backtracking risks.
- **Prerequisites:** Days 03, 04, and 12.
- **Future lecture:** `day-15-regular-expressions-and-text-processing.md`
- **Node relevance:** Regex is often used in validation, routing, parsing, and log processing; unsafe patterns can create denial-of-service risk.
- **MDN:** [Regular expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions), [RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)
- **Exercise:** Validate a constrained identifier and benchmark a safe pattern against an intentionally backtracking-prone pattern using bounded input.
- **Interview focus:** Global regex state, captures, greediness, Unicode flags, and when regex should be replaced with a parser.

## Day 16: Symbols, Reflection, Proxies, and Metaprogramming

- **Topics:** Symbols; well-known symbols; property keys; `Reflect`; proxy traps; invariants; proxy limitations; custom behavior; `toStringTag`; inspection boundaries.
- **Prerequisites:** Days 09-11 and 14.
- **Future lecture:** `day-16-symbols-reflection-and-proxies.md`
- **Node relevance:** Understanding metaprogramming helps when reading libraries and decorators, while avoiding unnecessary proxy complexity in hot or security-sensitive paths.
- **MDN:** [Symbols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol), [Reflect](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect), [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- **Exercise:** Wrap an object with a proxy that validates writes and document which invariants prevent the proxy from lying about non-configurable properties.
- **Interview focus:** Symbols versus strings, proxy invariants, `Reflect`, and observable behavior changes introduced by traps.

# Phase 5: Modules and Asynchronous JavaScript

## Day 17: Modules and Module Interoperability

- **Topics:** Module scope; exports and imports; named versus default exports; live bindings; cyclic dependencies; dynamic import; top-level await as a language feature; CommonJS interoperability concepts; evaluation order.
- **Prerequisites:** Days 02, 06, and 08.
- **Future lecture:** `day-17-modules-and-interoperability.md`
- **Node relevance:** Module boundaries determine dependency direction, initialization behavior, testability, and compatibility between ESM and CommonJS Node code.
- **MDN:** [JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules), [import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import), [export](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export)
- **Exercise:** Split a small service into modules, introduce a cycle deliberately, and explain the observable initialization behavior before removing the cycle.
- **Interview focus:** Live bindings, circular dependencies, default export interop, module evaluation, and why package resolution belongs to the Node roadmap.

## Day 18: Promises and Promise Composition

- **Topics:** Promise states; settlement; thenables; `then`; `catch`; `finally`; chaining; flattening; return values; rejection propagation; `Promise.all`; `allSettled`; `race`; `any`; concurrency versus sequential composition.
- **Prerequisites:** Days 06-07 and 17.
- **Future lecture:** `day-18-promises-and-composition.md`
- **Node relevance:** Promise composition controls service latency, failure propagation, parallel work, and accidental unhandled rejections.
- **MDN:** [Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises), [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- **Exercise:** Implement sequential and bounded-parallel versions of a task runner; specify how failures and partial results are represented.
- **Interview focus:** Promise resolution procedure, missing `return`, rejection propagation, combinator semantics, and accidental parallelism.

## Day 19: `async`/`await` and Asynchronous Error Propagation

- **Topics:** Async functions; awaited values; suspension and resumption; `try`/`catch` around await; sequential awaits; parallel promise creation; cancellation as a cooperative design; timeouts as a boundary pattern; cleanup with `finally`.
- **Prerequisites:** Days 07 and 18.
- **Future lecture:** `day-19-async-await-errors-and-cleanup.md`
- **Node relevance:** This is the dominant style for modern Node service logic, and incorrect await placement can cause latency or reliability bugs.
- **MDN:** [async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function), [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await), [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- **Exercise:** Write an async workflow with a deadline, cooperative cancellation signal, cleanup, and explicit handling of partial failure.
- **Interview focus:** Async function return values, synchronous throws before the first await, parallel versus sequential awaits, and unhandled rejection paths.

## Day 20: Jobs, Microtasks, and Observable Scheduling

- **Topics:** Call stack; execution jobs; promise reactions; microtasks; `queueMicrotask`; timers as host behavior; scheduling guarantees versus host-specific event-loop behavior; starvation; ordering traces.
- **Prerequisites:** Days 05, 08, and 18-19.
- **Future lecture:** `day-20-jobs-microtasks-and-scheduling.md`
- **Node relevance:** Promise scheduling affects ordering, latency, batching, and whether synchronous work or microtask chains delay other work in Node.
- **MDN:** [Microtask guide](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide), [Execution model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model)
- **Exercise:** Trace a scheduling example and label language-guaranteed ordering separately from ordering supplied by a host environment.
- **Interview focus:** Synchronous code versus promise reactions, microtask starvation, and why browser event-loop explanations cannot be copied wholesale to Node.

# Phase 6: Performance, Correctness, and Security

## Day 21: Memory, Reachability, and Garbage Collection Concepts

- **Topics:** Reachability; object lifetime; allocation; garbage collection as implementation behavior; closures and retained references; caches; weak references; `WeakMap`; `WeakSet`; memory leaks; finalization caveats.
- **Prerequisites:** Days 08-12 and 18-20.
- **Future lecture:** `day-21-memory-reachability-and-garbage-collection.md`
- **Node relevance:** Long-lived Node processes expose retained references, unbounded caches, listener closures, and large object graphs over time.
- **MDN:** [Memory management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management), [WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)
- **Exercise:** Diagnose a deliberately retained object graph and propose a bounded ownership or eviction strategy without relying on finalizers.
- **Interview focus:** Reachability versus scope, closure retention, weak collections, and why garbage collection timing is not a correctness contract.

## Day 22: Performance and Algorithmic JavaScript

- **Topics:** Big-O reasoning; time and space costs; mutation versus copying; array and map access; hidden assumptions; hot loops; batching; lazy versus eager work; recursion depth; numeric limits.
- **Prerequisites:** Days 05, 12, 14, and 21.
- **Future lecture:** `day-22-performance-and-algorithmic-reasoning.md`
- **Node relevance:** JavaScript algorithm choices directly affect request latency, memory use, and event-loop responsiveness.
- **MDN:** [Indexed collections](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections), [Keyed collections](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Keyed_collections)
- **Exercise:** Compare two implementations of a lookup and aggregation task; state complexity, allocation behavior, mutation risks, and adversarial inputs.
- **Interview focus:** Complexity with real assumptions, `sort` behavior, recursion depth, memory amplification, and when a `Map` is preferable to an object.

## Day 23: Testing JavaScript Behavior

- **Topics:** Unit boundaries; pure versus stateful code; assertions; test fixtures; table-driven tests; property-based thinking; async tests; fake time concept; mocking tradeoffs; testing errors and cleanup.
- **Prerequisites:** Days 06-07 and 18-20.
- **Future lecture:** `day-23-testing-javascript-behavior.md`
- **Node relevance:** Reliable Node services depend on tests that verify async ordering, error propagation, validation, and side-effect boundaries.
- **MDN:** [Testing guide](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing), [Assertions](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Cross_browser_testing/JavaScript)
- **Exercise:** Test a promise-based function for success, rejection, timeout, cleanup, and repeated invocation without relying on real external services.
- **Interview focus:** Testing behavior instead of implementation details, async test completion, mock leakage, and deterministic time.

## Day 24: Debugging and Observability of Language Behavior

- **Topics:** Reproducing failures; minimal examples; stack traces; source locations; inspecting values; tracing async boundaries; logging safely; assertions; debugging mutation and scheduling; distinguishing symptoms from causes.
- **Prerequisites:** Days 07, 18-20, and 23.
- **Future lecture:** `day-24-debugging-and-language-failures.md`
- **Node relevance:** Debugging language-level failures is prerequisite to using Node diagnostics effectively; Node tooling itself belongs in the Node roadmap.
- **MDN:** [JavaScript debugging](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/Introduction/debugging)
- **Exercise:** Reduce a failing asynchronous trace to a minimal reproducible example and document the causal sequence rather than only the final error.
- **Interview focus:** Reading stack traces, lost error context, race-like ordering, mutable shared state, and minimal reproduction design.

## Day 25: Security-Relevant JavaScript Behavior

- **Topics:** Prototype pollution; unsafe property paths; object injection; code evaluation hazards; regex denial of service; sensitive data in errors and logs; untrusted input; serialization assumptions; dependency boundary awareness.
- **Prerequisites:** Days 09-16 and 21-24.
- **Future lecture:** `day-25-security-relevant-javascript.md`
- **Node relevance:** JavaScript object and evaluation behavior can become server-side vulnerabilities when applied to untrusted request data or configuration.
- **MDN:** [Prototype pollution](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Prototype_pollution), [Eval](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval), [Regular expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions)
- **Exercise:** Harden a nested-object merge and validation function against unsafe keys, unexpected prototypes, and pathological input sizes.
- **Interview focus:** Prototype pollution, `eval`, regex denial of service, trust boundaries, and secure defaults.

# Phase 7: Integrated JavaScript for Node Applications

## Day 26: Designing JavaScript Boundaries in Services

- **Topics:** Module boundaries; pure core and side-effect edges; input normalization; domain objects; error contracts; dependency injection through functions; ownership of mutable state; API shape.
- **Prerequisites:** Days 09-11, 17-19, and 23-25.
- **Future lecture:** `day-26-javascript-boundaries-for-services.md`
- **Node relevance:** This day applies pure JavaScript concepts to service design without teaching HTTP, filesystem, databases, or other Node APIs.
- **MDN:** [Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules), [Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions), [Working with objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects)
- **Exercise:** Refactor a stateful service function into a pure decision core plus an injected side-effect boundary; define its error and data contracts.
- **Interview focus:** Testability, dependency direction, mutation ownership, error contracts, and module design.

## Day 27: Concurrency Reasoning and Resource-Safe Async Code

- **Topics:** Sequential versus concurrent work; bounded concurrency as a design problem; shared mutable state; idempotency at the function level; cancellation propagation; timeout ownership; cleanup; retry hazards; promise lifecycle.
- **Prerequisites:** Days 18-22 and 26.
- **Future lecture:** `day-27-concurrency-and-resource-safe-async.md`
- **Node relevance:** These are language-level foundations for reliable Node services; transport, process, and resource APIs are intentionally deferred to the Node roadmap.
- **MDN:** [Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises), [async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function), [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- **Exercise:** Design a bounded async coordinator with cancellation, timeout ownership, cleanup, and explicit treatment of partial completion.
- **Interview focus:** Race conditions, promise leaks, retrying non-idempotent work, cancellation limits, and concurrency caps.

## Day 28: Senior JavaScript Interview Integration

- **Topics:** End-to-end output tracing; language guarantees versus host behavior; choosing data structures; module and async design; performance and memory tradeoffs; security review; maintainability; explaining assumptions and alternatives.
- **Prerequisites:** Days 01-27.
- **Future lecture:** `day-28-senior-javascript-interview-integration.md`
- **Node relevance:** Consolidates the JavaScript knowledge expected before studying Node architecture and APIs, without duplicating the separate Node roadmap.
- **MDN:** [JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide), [JavaScript Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference)
- **Exercise:** Review a small service module for correctness, async behavior, memory retention, security, testability, and performance; propose changes with explicit tradeoffs.
- **Interview focus:** Deep definition checks, output traces, implementation constraints, debugging, design tradeoffs, scale assumptions, and senior follow-ups.

# Node Roadmap Boundary

The separate [Node.js backend roadmap](../Node/node-roadmap.md) should begin after this curriculum and cover host/runtime topics such as:

- Node.js architecture, V8 integration, and Node event-loop phases
- Package resolution, `package.json`, loaders, and runtime module configuration
- `process`, environment configuration, signals, and process lifecycle
- Filesystem APIs, buffers, streams, backpressure, and binary data
- Node events, timers, HTTP, networking, and server APIs
- Worker threads, child processes, and failure isolation
- Node testing tools, profiling, diagnostics, observability, and graceful shutdown

This roadmap only teaches the JavaScript concepts needed to understand those subjects: functions, closures, modules, promises, scheduling, iterables, memory, errors, performance, testing, and security.

The following are separate curricula and should not be added to this file:

- Express routing and middleware
- MongoDB data modeling and driver behavior
- PostgreSQL, SQL, transactions, and query planning
- Full DSA problem catalog
- Deployment, containers, cloud architecture, and operations

# JavaScript Coverage Matrix

| Required JavaScript area | Roadmap days |
| --- | --- |
| Grammar, values, types, coercion, equality, operators | 1-4 |
| Control flow, functions, callbacks, recursion, errors | 5-7 |
| Scope, closures, execution context, `this` | 2, 8 |
| Objects, identity, mutation, copying, descriptors | 9-11, 13 |
| Prototypes, classes, inheritance | 10 |
| Arrays, strings, numbers, `NaN`, `Map`, `Set`, JSON | 12 |
| Iterators and generators | 14 |
| Regular expressions | 15, 25 |
| Symbols, reflection, proxies | 16 |
| Modules and interoperability | 17, 26 |
| Promises, `async`/`await`, async errors | 18-19, 27 |
| Event loop connection, microtasks, scheduling | 20, 27 |
| Memory and performance | 21-22, 27-28 |
| Testing and debugging | 23-24 |
| Security-relevant behavior | 25, 28 |
| Node-relevant integration and tradeoffs | 26-28 |

# Source Policy

- Use [MDN's JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide) for organized explanations.
- Use [MDN's JavaScript Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference) for API and syntax details.
- Use the [ECMAScript specification](https://tc39.es/ecma262/) when a claim depends on a language-level guarantee or abstract operation.
- Use Node.js documentation only when a lecture explicitly compares JavaScript behavior with the Node host. Node APIs remain outside this roadmap.
- Rewrite explanations in original language. Do not copy MDN prose.
- Identify behavior that depends on engine, host, runtime version, configuration, or implementation rather than presenting it as universal JavaScript behavior.

# Lecture Quality Checklist

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
