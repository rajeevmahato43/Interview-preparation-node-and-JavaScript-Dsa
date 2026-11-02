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
1. **The 5 Success Criteria:** Basic everyday English intuition before code, independent brute-force derivation, structured 45-second pitches, pattern recognition via constraint triggers, and V8/Node.js production application.
2. **Topic-Appropriate Architecture:** Reject rigid, one-size-fits-all templates. Foundational theory lectures (such as Big O & Complexity Analysis, JavaScript Execution Model, Event Loop, or System Architecture) must focus 100% on their core subject matter—teaching line-by-line calculation, memory behavior, runtime internals, and analysis problems—without forcing artificial pattern-recognition tables or unrelated LeetCode problem walkthroughs.
3. **The 8-Part Logic-Building Problem Blueprint:** For coding problems, strictly follow the 8-part progression (`X.Y.1 Problem Statement` to `X.Y.8 Complexity Derivation`).
4. **No Artificial Line Count Limits:** Never constrain lectures to arbitrary line counts. Lectures can be as long and comprehensive as necessary to deliver exhaustive, world-class depth, line-by-line mathematical derivations, and complete clarity without superficial summaries or forced truncation.
5. **Short, Clean Headings:** Headings must be short, direct, and clean with zero fluff (e.g., `## 1. What is Big O`, `### 1.1 Linear Search`). Never use long, descriptive subtitles, colons, or parenthetical explanations in headings.
6. **No Preachy Meta-Interview Talk:** Avoid writing meta-interview filler like "In technical interviews, you must distinguish between...", "Interviewers will test you on...", or "A common interview trick is...". Deliver the engineering, computational, and systems insights directly.
7. **Basic English Mandate:** Always write in simple, direct, Basic Everyday English. Avoid heavy words, stiff academic speech, or confusing jargon. Break long sentences into short, punchy statements and use everyday vocabulary that any non-native English speaker can easily understand.
8. **Dual-Case Implementations:** Always show `✅ CORRECT / POSITIVE CASE` alongside `❌ ANTI-PATTERN / COMMON BUG`.
9. **Direct Clean Runnable Code:** Code blocks must be self-contained Node.js functions with example calls (`console.log`) without requiring `assert` imports.

---

## Instruction Precedence

1. Root [AGENTS.md](../AGENTS.md) defines workspace boundaries.
2. The shared rules below apply to all interview-preparation content.
3. The relevant domain file adds topic-specific requirements.
4. A user request may narrow the requested output, but it does not remove safety, accuracy, originality, or repository-boundary requirements.

---

## Shared Rules

- [content-rules.md](content-rules.md): Role & philosophy, 5 success criteria, core standards, 8-part logic-building blueprint, topic-appropriate architecture, short headings, and simple English guidelines.
- [interview-rules.md](interview-rules.md): 45-second pitches, trade-off matrices, interview Q&A progression, and practice problems formatting.
- [example-rules.md](example-rules.md): Self-contained code, dual-case examples (`✅` and `❌`), and direct `console.log` example execution.
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