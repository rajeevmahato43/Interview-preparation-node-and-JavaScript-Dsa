---
name: lecture-review
description: Rewrite an interview-preparation lecture applying all formatting, definition, and structure rules. Use when the user asks to review, rewrite, or improve any day-wise lecture file.
---

# Lecture Review & Rewrite Skill

When the user asks to review or rewrite a lecture, apply **every** rule below in a single pass. Do not ask for clarification — apply all rules.

## Definitions & Language
1. Every topic and sub-topic must start with a **very simple, plain English definition** — explain what it is, what it does, and what it does NOT do in normal, everyday words. Avoid academic theory or internal engine jargon.
   - Example: "Big O notation is a way to describe how the performance of an algorithm changes as the input size grows. It does not calculate the code execution time, because time fluctuates based on CPU speed, background operating system processes, memory garbage collection, and runtime compiler optimizations."
2. Keep core definitions direct and easy to grasp. Prefer "JavaScript does X" over "the engine's behavior of X".
3. **In-place terminology callouts (No Vocabulary Cards):**
   - Do NOT add a standalone "Quick Vocabulary Card" table.
   - Instead, whenever a technical, specialized, or unfamiliar term appears (e.g., `Amortized`, `Auxiliary Space`, `Idempotency`, `Backpressure`), define it right there at that moment using a 1-line callout block:
     ```markdown
     > **Amortized**: The average time per operation across a long sequence of operations, even if one operation is occasionally slow.
     ```
   - Or add an inline plain-language explanation in parentheses:
     `Auxiliary (Extra) Space`
     `asynchronous (non-blocking / runs in background)`
4. **Intuition callouts:** Add a simple question or intuition callout for key mental models:
   ```markdown
   > When the input size $n$ doubles, by what factor does the total work increase?
   ```
5. **Keep it practical and example-based:** Add more small code examples and structured mini-tables rather than dense text blocks. Focus on: *What happens*, *Why it happens*, *How it breaks in real code*, and *How to fix it*.

## Headings & Hierarchy Structure
6. **Simple and direct headings:** Use clear, self-explanatory headings (e.g., `## 1. What Big O Actually Measures` or `## 1. What is Big O`, `### Time Complexity`, `#### O(1) — Constant Time`). Avoid vague, overly fancy, or cryptic titles.
7. **Consistent heading hierarchy:** Maintain a single, clean hierarchy across the entire lecture:
   - `# Day XX: <Topic Title>`
   - `## <Major Topic>`
   - `### <Subtopic>`
   - `#### <Further Subtopic / Specific Type / Complexity>`
   - `## Tricky Points and Edge Cases`
   - `## Hands-On Exercise`
   - `## Summary`
   - `## Cheat Sheet`
   - `## Interview Questions`

## Analogies
8. Add a real-world analogy ONLY for genuinely complex or confusing concepts (e.g., hoisting, closures, TDZ, event loop, prototypes). Do NOT add analogies for simple concepts (e.g., variable, scope, function, array). The analogy must come AFTER the plain-language definition, never replace it.

## Topic Coverage & Structure — Zero Omission Policy
9. **Preserve ALL existing topics:** Never drop, remove, or silently merge away any concept, sub-topic, trace, or section from the original lecture.
   - Before rewriting, take a complete inventory of every section and sub-topic in the original file.
   - Verify that 100% of the original concepts (e.g., "Literals create values", "Overloaded addition", "Mutation during iteration", "DSA complexity connection") exist as dedicated, prominent sections in the rewrite.
   - Check the file title and roadmap: if a keyword is in the lecture title (e.g., "Literals" in "Values, Types, and Literals"), it MUST have its own dedicated core section.
10. Every parent topic must fully cover all its relevant sub-types as separate sub-sections with their own definition and code example.
11. Add a summary comparison table within any section that covers multiple related items (e.g., Common Big O Complexities table).

## Code Examples — Show What Works AND What Breaks
12. Every code block must show BOTH ✅ what works and ❌ what doesn't — merged in the same code block, not in separate sections. Emphasize the negative/tricky/breaking cases for interview prep.
13. Code examples must be minimal, complete, runnable, and well-commented.
14. Label every code block with its environment: `// Node.js code`, `// Browser code`, etc.
15. Show expected output or error for non-obvious examples.
16. Include sufficient examples across all subtopics so every concept is grounded in code.

## Tricky Points & Summary — Rich, Detailed Recap
17. **Detailed Tricky Points:** Must include thorough breakdowns of edge cases, subtle gotchas, and performance traps covered in the lecture, paired with code snippets and clear explanations of runtime consequences.
18. **Detailed Summary:** Must be a **comprehensive recap** covering all important mechanisms, rules, formulas, complexity numbers, and behaviors taught in the lecture. Do not reduce it to superficial 1-liners; a learner should be able to review the entire lecture from the summary.

## Interview Questions
19. End with an `Interview Questions` section. Format:
    - Heading: the question itself (e.g., "### 1. What does Big O notation actually measure?")
    - **Question:** the full question
    - **Answer:** the full answer (merge follow-ups directly into the answer)
    - NO difficulty tags (`Hard`, `Very Hard`, `[Beginner]`, `[Mid]`, `[Senior]`, etc.)
    - NO "Expected answer shape" — just "Answer"
    - 3–4 questions covering: concept check, predict-the-output, debugging/failure, Node.js backend scenario.

## Required Sections (in order)
20. The lecture must contain:
    1. Navigation links (`<nav>`)
    2. Title: `# Day XX: <Topic Title>`
    3. Prerequisites (link to earlier lectures)
    4. Core concepts — plain English definition first, sub-topics broken out with consistent `###` and `####` headers, in-place term callouts, and ✅/❌ code examples
    5. Tricky Points and Edge Cases — detailed gotchas with code
    6. Hands-on exercise (scenario → buggy code → acceptance criteria → solution)
    7. Summary — detailed, comprehensive bullet recap of all covered concepts
    8. Cheat Sheet — quick-reference tables + Common Pitfalls list
    9. Interview Questions — Q&A format
    10. Navigation links (`<nav>`)

## What to Remove vs. What to Keep
21. **REMOVE Learning Outcomes / "What You Will Learn Today" section.**
22. **REMOVE "Quick Vocabulary Card" table.** (Replace with in-place term callouts).
23. Remove any "Notes on Changes" section.
24. Remove exact duplicate sentences or paragraphs — use cross-references instead.
25. Remove generic/filler sentences that add no technical value.
26. **NEVER remove core topics, concepts, code traces, or real-world backend scenarios.** Only prune filler words and meta-commentary.

## Tone & Length
27. Friendly, direct language. Use "you", "your code", "JavaScript does X".
28. Readable in ≤ 30 minutes.
29. Mention exact versions where behavior is version-specific (e.g., "ES2015+", "Node.js ≥ 16").

## Quality
30. Accuracy first. Separate spec guarantees from runtime behavior.
31. Cheat sheet must include a "Common Pitfalls" bullet list.
32. Edge cases must be demonstrated with runnable code, not just mentioned in passing.

