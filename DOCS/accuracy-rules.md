# Accuracy Rules & Technical Correctness

Getting the technical facts right is always more important than sounding confident.

---

## Simple Language Policy

- **Basic English First:** Explain technical accuracy in simple, clear words. Never use heavy academic words or confusing jargon.
- **Explain Version Differences:** Do not lock explanations to one single version. When behavior changes across versions (such as Node.js 18 vs Node.js 20, or ES2015 vs ES2023), state that clearly with the version number.
- **Use Authoritative Sources:** Base all claims on official documentation:
  - ECMAScript and MDN for JavaScript language rules.
  - Node.js documentation for Node runtime and event loop behavior.
  - Express documentation for HTTP framework behavior.
  - MongoDB documentation for document storage and queries.
  - PostgreSQL documentation for SQL, indexes, and transactions.

---

## Separating Language Rules from Engine Behavior

- Always separate what the ECMAScript standard guarantees from how specific engines (like V8) optimize code.
- Say clearly when a behavior depends on the engine, the operating system, the database query planner, or memory garbage collection.
- Never make up benchmark numbers, fake method signatures, or broken documentation links.

---

## Correcting Inaccuracies

- When an older note or example is incorrect, explain the correction clearly with a concrete code demonstration.
- Never copy an unverified claim into new study material.