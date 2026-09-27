---
name: lecture-review
description: Rewrite an interview-preparation lecture applying all formatting, definition, and structure rules. Use when the user asks to review, rewrite, or improve any day-wise lecture file.
---

# Lecture Review & Rewrite Skill

When the user asks to review or rewrite a lecture, apply **every** rule below in a single pass. Do not ask for clarification — apply all rules.

## Definitions & Language
1. Every topic and sub-topic must start with a **clear programming definition** — what it is, what it does, in plain words. No engine-internal jargon like "creation phase", "execution phase", "Environment Record". Just describe what actually happens (e.g., "JavaScript reads all declarations before running any code").
2. Keep core definitions short (1–2 sentences). Prefer "JavaScript does X" over "the engine's behavior of X".
3. Define technical terms at first use and keep them consistent throughout.
4. **Keep it simple and practical:** Do NOT over-complicate topics with dense academic theory, deep bit-level math, or engine-internal minutiae unless strictly necessary. Focus on: *What happens*, *Why it happens*, *How it breaks in real code*, and *How to fix it*.

## Analogies
5. Add a real-world analogy ONLY for genuinely complex or confusing concepts (e.g., hoisting, closures, TDZ, event loop, prototypes). Do NOT add analogies for simple concepts (e.g., variable, scope, function, array). The analogy must come AFTER the programming definition, never replace it.

## Topic Coverage & Structure — Zero Omission Policy
6. **Preserve ALL existing topics:** Never drop, remove, or silently merge away any concept, sub-topic, trace, or section from the original lecture.
   - Before rewriting, take a complete inventory of every section and sub-topic in the original file.
   - Verify that 100% of the original concepts (e.g., "Literals create values", "Overloaded addition", "Mutation during iteration", "DSA complexity connection") exist as dedicated, prominent sections in the rewrite.
   - Check the file title and roadmap: if a keyword is in the lecture title (e.g., "Literals" in "Values, Types, and Literals"), it MUST have its own dedicated core section.
7. Every parent topic must fully cover all its relevant sub-types as separate sub-sections with their own definition and code example. For example:
   - "Hoisting" → sub-sections for var, let/const, function declaration, function expression/arrow hoisting, plus a summary table.
   - "Scope" → sub-sections for global, function, block, module scope.
   - "Literals" → sub-sections for primitive literals vs object/array literals, numeric separators, and evaluation differences.
8. Add a summary comparison table at the end of any section that covers multiple related items.

## Code Examples — Show What Works AND What Breaks
9. Every code block must show BOTH ✅ what works and ❌ what doesn't — merged in the same code block, not in separate sections. Emphasize the negative/tricky/breaking cases for interview prep.
10. Code examples must be minimal, complete, runnable, and well-commented.
11. Label every code block with its environment: `// Node.js code`, `// Browser code`, etc.
12. Show expected output or error for non-obvious examples.
13. Keep one strong example per behavior. Don't repeat the same point with multiple examples.

## Interview Questions
14. End with an `Interview Questions` section. Format:
    - Heading: the question itself (e.g., "### 1. What is the TDZ?")
    - **Question:** the full question
    - **Answer:** the full answer (merge follow-ups directly into the answer)
    - NO difficulty tags (`Hard`, `Very Hard`, `[Beginner]`, `[Mid]`, `[Senior]`, etc.)
    - NO "Expected answer shape" — just "Answer"
    - 3–4 questions covering: concept check, predict-the-output, debugging/failure, Node.js backend scenario.

## Required Sections (in order)
15. The lecture must contain:
    1. Title and learning outcomes (`## What You Will Learn Today`)
    2. Prerequisites (link to earlier lectures)
    3. Quick Vocabulary Card (table)
    4. Core concepts — definition first, sub-topics broken out, ✅/❌ examples
    5. Tricky Points — edge cases, gotchas
    6. Hands-on exercise (buggy code → criteria → solution)
    7. Summary — bullet points
    8. Cheat Sheet — quick-reference tables + Common Pitfalls list
    9. Interview Questions — Q&A format
    10. Navigation links

## What to Remove vs. What to Keep
16. Remove any "Notes on Changes" section.
17. Remove exact duplicate sentences or paragraphs — use cross-references instead.
18. Remove generic/filler sentences that add no technical value.
19. **NEVER remove core topics, concepts, code traces, or real-world backend scenarios.** Only prune filler words and meta-commentary.

## Tone & Length
20. Friendly, direct language. Use "you", "your code", "JavaScript does X".
21. Readable in ≤ 30 minutes.
22. Mention exact versions where behavior is version-specific (e.g., "ES2015+", "Node.js ≥ 16").

## Quality
23. Accuracy first. Separate spec guarantees from runtime behavior.
24. Cheat sheet must include a "Common Pitfalls" bullet list.
25. Edge cases must be demonstrated with runnable code, not just mentioned in passing.
