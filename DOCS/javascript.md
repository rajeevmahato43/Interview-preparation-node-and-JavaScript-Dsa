# JavaScript Domain Instructions

Teach JavaScript as a language and runtime, not merely as a collection of syntax features. Use the shared rules in [content-rules.md](content-rules.md) and [interview-rules.md](interview-rules.md).

## Required scope

Cover grammar, values and types, coercion, equality, operators, control flow, functions, scope, closures, `this`, objects, prototypes, classes, arrays, iterators, generators, modules, regular expressions, errors, promises, `async` and `await`, the event loop, microtasks, memory, performance, testing, and security-relevant behavior.

## Teaching requirements

- Explain value semantics, mutation, identity, and copying before advanced object patterns.
- Trace lexical scope, closure capture, `this` binding, prototype lookup, and promise scheduling with concrete examples.
- Distinguish ECMAScript language guarantees from host behavior supplied by browsers or Node.js.
- Explain module interoperability and asynchronous error propagation in terms useful to backend development.
- Include edge cases involving coercion, `NaN`, missing properties, sparse arrays, promise rejection, and unhandled errors.
- When a language concept affects backend code, add a short Node.js application connection with a concrete example or consequence.
- When a concept supports algorithmic reasoning, connect it to the relevant DSA pattern without turning the lecture into an unrelated problem set.

## Cheat sheet guidance

Include concise rules for coercion, scope, `this`, prototypes, promise scheduling, module behavior, and common JavaScript interview traps. Keep the cheat sheet useful for revision, but do not use it as a replacement for explaining why the rules work.

## Boundaries

Use [node.md](node.md) for Node APIs and runtime operations, and [express.md](express.md) for HTTP framework behavior. Browser DOM and Web API material is secondary unless requested. Use [dsa.md](dsa.md) for algorithmic problem solving rather than turning language lessons into a problem catalog.