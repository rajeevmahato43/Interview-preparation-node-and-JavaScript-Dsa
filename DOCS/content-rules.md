# Content Rules

Use these rules for every lecture, explanation, review, or study resource created for this project.

## Course planning

Before creating day files, identify the full topic surface, prerequisites, major concepts, advanced areas, practical applications, common mistakes, and likely interview areas. Divide the material into a sensible progression. Do not stop at beginner syntax when the course is intended for mid-to-senior interviews.

Use one course directory with stable Markdown filenames such as `day-01-topic.md`, `day-02-topic.md`, and `day-03-topic.md`. Keep each day focused enough to study in one sitting and link to earlier or later days when concepts depend on one another.

## Required lecture shape

Every day file must follow this exact section structure and order:

1. Day title (`# Day XX: <Topic Title>`) followed by top navigation links (`<nav>`).
2. Prerequisites (links to earlier lectures or required baseline knowledge).
3. Core concepts organized into example-based topics and subtopics with consistent heading levels.
4. Tricky Points and Edge Cases (`## Tricky Points and Edge Cases`).
5. Hands-on exercise (`## Hands-On Exercise`).
6. Comprehensive summary (`## Summary`).
7. Quick cheat sheet (`## Cheat Sheet`).
8. Interview questions (`## Interview Questions`) governed by [interview-rules.md](interview-rules.md).
9. Bottom navigation links (`<nav>`).

### What NOT to include:
- **Do NOT include a "Learning Outcomes" or "What You Will Learn Today" section.** Jump straight from prerequisites into the core concepts.
- **Do NOT include a standalone "Quick Vocabulary Card" table.** Do not dump terminology cards at the top of lectures.

### In-place terminology definitions:
Instead of vocabulary cards, use simple language throughout. Whenever an unfamiliar, technical, or specialized term must be introduced (e.g., `Amortized`, `Lexical Scope`, `Backpressure`, `Idempotency`):
- **Define it right there at that moment** using a 1-line callout block:
  ```markdown
  > **Amortized**: The average time per operation across a long sequence of operations, even if one operation is occasionally slow.
  ```
- **Or add an inline plain-language equivalent** in parentheses:
  `Auxiliary (Extra) Space`
  `asynchronous (non-blocking / runs in background)`
  `idempotent (safe to retry multiple times without changing the result)`

## Definitions and language

- **Use very basic, everyday English for definitions.** Explain what the concept is, what it does, and what it does NOT do in plain words. Avoid academic theory and engine-internal jargon unless strictly needed.
  - Good: "Big O notation is a way to describe how the performance of an algorithm changes as the input size grows. It does not calculate the code execution time, because time fluctuates based on CPU speed, background operating system processes, memory garbage collection, and runtime compiler optimizations."
  - Bad: "Big O is an asymptotic mathematical notation characterizing the limiting behavior of a function when the argument tends towards a particular value or infinity in an execution context."
- Prefer explanations that answer: *What happens? Why does it happen? When does it matter? How does it break in real code?*
- Define concepts with a guiding intuition callout when helpful:
  ```markdown
  > When the input size $n$ doubles, by what factor does the total work increase?
  ```

## Example-based organization and heading structure

- **Example-based teaching:** Teach through concrete, runnable code examples rather than long abstract paragraphs. Keep explanations chunked around code blocks and compact reference tables.
- **Consistent heading hierarchy:** Maintain a single, clean hierarchy across every lecture so content remains easy to scan:
  - `# Day XX: <Topic Title>`
  - `## <Major Topic Heading>` (e.g., `## 1. What Big O Actually Measures` or `## 1. What is Big O`)
  - `### <Subtopic Heading>` (e.g., `### Time Complexity`)
  - `#### <Further Subtopic / Variant>` (e.g., `#### O(1) — Constant Time`)
- **Simple and direct headings:** Use clear, self-explanatory headings (e.g., `What Big O Actually Measures`, `What is Closure`, `How the Event Loop Runs Microtasks`). Avoid vague or cluttered titles.
- **Show both ✅ and ❌ cases:** In code snippets, demonstrate what works alongside what breaks or causes performance traps, using clear inline comments.

## Detailed Tricky Points and Summary

- **Tricky Points and Edge Cases:** Must be detailed and specific to the concepts taught in the lecture. Do not use generic 1-liners. Walk through subtle traps, edge cases, off-by-one errors, type coercion surprises, or runtime pitfalls with code snippets and clear explanations of the failure consequences.
- **Summary:** Must be a **thorough, detailed recap** covering all important mechanisms, rules, numbers, complexities, and behaviors taught in the day's lecture. A learner should be able to review the entire lecture effectively just by reading the summary.

## Depth and audience

Assume the learner knows basic programming but is preparing for mid-to-senior interviews. Keep familiar basics short enough to refresh memory, then spend more space on internals, interactions, tradeoffs, and failure modes. Use plain language and explain unavoidable jargon in-place. Do not use senior-sounding terms as a substitute for causal explanations. When a topic has junior, mid, and senior interpretations, label the depth explicitly.

## Quality bar

Examples must be internally consistent, edge cases must be named, and claims about performance must include the relevant assumptions. Explain complexity as a function of input size where applicable. Call out behavior that differs between browser JavaScript, Node.js, databases, and libraries. The cheat sheet must condense the day's definitions, rules, comparisons, complexity, commands, patterns, or decision points without replacing the full explanation.