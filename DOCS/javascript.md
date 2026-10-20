# JavaScript Domain Instructions

Teach JavaScript from first principles as a core programming language and runtime engine, not merely as a list of syntax features.

Follow the shared rules in [content-rules.md](content-rules.md), [example-rules.md](example-rules.md), and [interview-rules.md](interview-rules.md).

---

## Foundational Philosophy

> **"Never teach what a JavaScript syntax feature does without first teaching why it exists, what problem it solves, and how the engine executes it step-by-step."**

Strictly reject rote memorization of language tricks. Teach candidates how memory is allocated, how scopes are linked, how prototypes look up properties, and how the event loop schedules microtasks.

---

## Required Scope

Cover primitives and objects, type coercion and equality, variable scoping (`var`, `let`, `const`), closures, `this` binding, prototype chains, ES6 classes, arrays and collection methods, iterators and generators, asynchronous flow (callbacks, promises, `async`/`await`), microtasks, the event loop, garbage collection, and V8 optimization traps.

---

## Teaching Standards

1. **Basic English Definitions:** Explain every concept in simple, clear everyday words. Explain what it is, what it does, and what it does NOT do before introducing technical terms.
2. **In-Place Term Callouts:** Define every specialized term (like `TDZ`, `Lexical Scope`, `Microtask`, `Hoisting`) right where it appears using a 1-line callout block.
3. **Step-by-Step Visual Traces:** Walk through execution line-by-line using ASCII diagrams for call-stack frames, heap memory references, and prototype chains.
4. **Dual-Case Implementations:** Always show `✅ CORRECT / POSITIVE CASE` alongside `❌ ANTI-PATTERN / COMMON BUG` with inline comments explaining why it fails.
5. **Backend Node.js Connection:** Connect language concepts directly to backend Node.js realities (memory leaks in closures, unhandled promise rejections, event loop blocking).
6. **13-Section Blueprint:** Follow the exact 13-section lecture blueprint from Top Navigation to Bottom Navigation. Target ~650–850 lines per lecture.