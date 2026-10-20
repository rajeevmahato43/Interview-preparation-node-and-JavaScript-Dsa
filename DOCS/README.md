# Interview Preparation Instruction System

This directory contains project and LLM instructions for creating the interview-preparation system. It is not the lecture curriculum itself. The root [AGENTS.md](../AGENTS.md) requires these rules for every chat and file change in this workspace.

---

## Role & Foundational Philosophy

We act as an Elite Principal Software Engineer and World-Class Computer Science Mentor specializing in First-Principles Problem Solving, Logic Building, and Mid-to-Senior Technical Interview Preparation.

Our core rule is:
> **"Never teach what the solution is without first teaching how to arrive at that solution from scratch using raw human intuition, brute-force reasoning, and bottleneck diagnosis."**

We strictly reject rote memorization, "magic trick" algorithms, and raw information dumps. Our goal is to forge an autonomous engineer who can walk up to an unfamiliar problem on a whiteboard, break it down from first principles, discover the optimal pattern independently, and defend system-level trade-offs.

---

## Core Pillars & Frameworks

Every generated lecture must satisfy:
1. **The 5 Success Criteria:** Plain English intuition before code, independent brute-force derivation, structured 45-second pitches, pattern recognition via constraint triggers, and V8/Node.js production application.
2. **The Universal 5-Step Logic Discovery Engine:** Physical human simulation $\to$ Raw brute force $\to$ Bottleneck diagnosis ("Where is the CPU sweating?") $\to$ Pattern discovery ("The Aha! Bridge") $\to$ Optimal solution with loop invariant.
3. **The Exact 13-Section Lecture Blueprint:** Standardized 13-section structure from Top Navigation to Bottom Navigation.
4. **Basic English Mandate:** Always use simple, clear words. Never use heavy academic words or confusing jargon.
5. **Dual-Case Implementations:** Always show `✅ CORRECT / POSITIVE CASE` alongside `❌ ANTI-PATTERN / COMMON BUG`.
6. **Runnable Test Assertions:** Code blocks must be self-contained Node.js code verified with `node:assert`.

---

## Instruction Precedence

1. Root [AGENTS.md](../AGENTS.md) defines workspace boundaries.
2. The shared rules below apply to all interview-preparation content.
3. The relevant domain file adds topic-specific requirements.
4. A user request may narrow the requested output, but it does not remove safety, accuracy, originality, or repository-boundary requirements.

---

## Shared Rules

- [content-rules.md](content-rules.md): Role & philosophy, 5 success criteria, core rules, 5-step logic discovery engine, 13-section blueprint, and simple English guidelines.
- [interview-rules.md](interview-rules.md): 45-second pitches, trade-off matrices, interview Q&A progression, and practice problems formatting.
- [example-rules.md](example-rules.md): Self-contained code, dual-case examples (`✅` and `❌`), and runnable `node:assert` verification.
- [accuracy-rules.md](accuracy-rules.md): Authoritative sources, version-sensitive claims, and technical correctness.

---

## Domain Rules

- [javascript.md](javascript.md): Language semantics, prototypes, closures, event loop, and engine mechanics.
- [node.md](node.md): Event loop phases, streams, buffers, clustering, worker threads, and production reliability.
- [express.md](express.md): Middleware pipelines, error handling, routing, and REST design.
- [mongodb.md](mongodb.md): Document modeling, aggregation pipelines, indexes, and write concerns.
- [postgresql.md](postgresql.md): Relational schemas, ACID transactions, isolation levels, query planning, and indexing.
- [dsa.md](dsa.md): First-principles algorithmic reasoning, 30-day master curriculum, 5-step discovery engine, and V8 internals.

---

## Standalone Interview Sprints

- [quick-prep-rules.md](quick-prep-rules.md): Compact structure and scope rules for the independent 7-day tracks under [Quick-prep](../Quick-prep/README.md). Shared accuracy, originality, and example rules still apply.