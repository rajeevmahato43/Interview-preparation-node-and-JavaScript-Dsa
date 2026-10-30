# Data Structures and Algorithms Domain Instructions

Teach Data Structures and Algorithms (DSA) as a first-principles problem-solving and logic-building process, building from raw human intuition to mid-to-senior technical interview mastery in a world-class book style.

Follow the shared standards in [content-rules.md](content-rules.md), [example-rules.md](example-rules.md), and [interview-rules.md](interview-rules.md).

---

## Foundational Philosophy

> **"Never teach what the solution is without first teaching how to arrive at that solution from scratch using raw human intuition, brute-force reasoning, and bottleneck diagnosis."**

Strictly reject:
- Rote memorization of code templates.
- "Magic trick" algorithms presented without derivation.
- Rigid, repetitive templates that feel robotic or machine-generated.
- Artificial meta-labels in headings (e.g. `### Definition`, `### Basic Example`).

The goal is to forge an autonomous engineer who can walk up to an unfamiliar problem on a whiteboard, break it down using simple human intuition, discover the optimal pattern independently, and defend system-level trade-offs.

---

## Course Architecture: The 30-Day Master Curriculum

- Organize the curriculum into **30 comprehensive master lecture files** (`day-01-topic.md` through `day-30-topic.md`) in `DSA/DSA_V2/`.
- Each numbered day represents a complete, self-contained master study unit written in clean, authoritative book style.
- **No Artificial Line Count Limits:** Never constrain lectures to arbitrary line counts. Lectures can be as long and comprehensive as necessary to deliver exhaustive, world-class depth, line-by-line mathematical derivations, and complete clarity without superficial summaries or forced truncation.
- **Topic-Appropriate Architecture:** Not every lecture follows a rigid, one-size-fits-all template. Foundational theory lectures (such as Day 01: Big O Complexity & Performance Analysis) must focus 100% on their core subject matter—teaching line-by-line calculation, memory behavior, runtime internals, and analysis problems—without forcing artificial pattern overviews or unrelated algorithmic walkthroughs onto topics where they do not belong.
- **Short, Clean Headings:** Headings must be short, direct, and clean with zero fluff (e.g., `## 1. What is Big O`, `### 1.1 Linear Search`, `### 3.1 Search Insert Position`). Never use long, descriptive subtitles, colons, or parenthetical explanations in headings (e.g., do NOT write `What Big O Actually Measures: Operations vs. Wall-Clock Time` or `Linear Search (The Linear Scan)`).
- **No Preachy Meta-Interview Talk:** Avoid writing meta-interview filler like "In technical interviews, you must distinguish between...", "Interviewers will test you on...", or "A common interview trick is...". Deliver the engineering, computational, and systems insights directly.
- **Strict Scope Discipline (Prevent Concept Bleed):** Keep each lecture strictly focused on its intended day's scope. Do not prematurely introduce complex mechanisms that belong in later dedicated lectures (e.g., recursion call stack memory belongs to Day 18; dynamic array resizing in V8 belongs to Day 2).
- **Data Structures First, Patterns Second:** When a unit covers both data structures and patterns (e.g. `Map & Set` and `Frequency Counter`), always teach the data structures thoroughly first before introducing the pattern that utilizes them.

---

## The 8-Part Logic-Building Problem Blueprint

Every problem explained inside a lecture MUST follow this exact 8-part progression with clean sub-numbering (`X.Y.1` – `X.Y.8`):

1. **`X.Y.1 Problem Statement`**
   - State the problem clearly with concrete examples, edge constraints, and expected return format.
2. **`X.Y.2 How to Think About It`**
   - Physical human eye & hand simulation (cards on a table, books on a shelf). Zero code. Zero data structures.
3. **`X.Y.3 Brute Force Approach & Bottleneck`**
   - Translate raw human instinct into simple naive code using basic nested loops or straightforward recursion.
   - Pinpoint the exact wasted work: Is the CPU scanning the same list repeatedly? Is memory constantly being shifted?
4. **`X.Y.4 The Pattern Insight`**
   - Present the algorithmic pattern as the natural mathematical cure for that specific bottleneck (why this approach makes logical sense).
5. **`X.Y.5 Pseudocode`**
   - Provide clean, language-agnostic pseudocode so the logic is crystal clear before touching language-specific syntax.
6. **`X.Y.6 Optimal Solution`**
   - Implement the clean, production-grade JavaScript solution with descriptive variable names, inline comments, and direct `console.log` example runs.
7. **`X.Y.7 Common Anti-Pattern`**
   - Show the common mistake, off-by-one trap, or memory-heavy anti-pattern (e.g. using `splice()` in loops or allocating `new Set()`) with comments explaining why it fails.
8. **`X.Y.8 Complexity Derivation`**
   - Provide separate, rigorous derivations for Time Complexity and Auxiliary Space Complexity.

---

## Lecture File Structure Blueprint

Every DSA lecture must follow this clean, topic-oriented book structure:

1. **Title & Top Navigation:** `# Day XX: <Topic Title>` and `<nav aria-label="Lecture navigation">`.
2. **## 1. <Primary Data Structure or Core Concept>**
   - Core concept explained in plain English.
   - Physical analogy woven directly into text without an artificial heading.
   - Clean, runnable basic example.
   - Numbered Sub-Topics (`1.1`, `1.2`, `1.3`, ...) with focused explanations, ASCII traces, and interactive `> [!NOTE]` Self-Check callouts.
   - **Essential Methods Reference Table:** Operations, time complexity ($O(1)$ vs $O(n)$), mutability, and quick code examples.
3. **## 2. <Secondary Data Structure or Pattern Overview>**
   - Follows identical clean sub-topic and methods table hierarchy (if covering a secondary data structure).
   - Pattern Family formatted as clean bullet points.
   - Pattern Recognition Table (`Problem Keyword` $\to$ `What It Asks` $\to$ `Recommended Approach`).
   - Point-based "When to Use" vs. "When NOT to Use".
   - The $10^7$ operations constraint rule.
4. **## 3. Problem Walkthroughs**
   - Problems (`3.1`, `3.2`, `3.3`) strictly following the 8-Part Logic-Building Blueprint (`X.Y.1` – `X.Y.8`).
5. **## 4. Tricky Edge Cases**
   - Clean, punchy bullet points covering boundary traps, off-by-one errors, empty/single-element inputs, and all-match/all-unique cases.
6. **## 5. Summary Cheat Sheet**
   - High-density bullet list summarizing mechanics, complexity rules, and core pitfalls.
7. **## 6. Practice Problems**
   - 3 curated challenges (`6.1 Easy/Warm-Up`, `6.2 Medium`, `6.3 Hard/Advanced`) with sample inputs, expected outputs, and 2-3 progressive Socratic hints.
8. **Bottom Navigation:** `<nav aria-label="Lecture navigation">`.

---

## Language & Presentation Standards

- **Basic English Only:** Write in simple, direct English. Avoid heavy words, fancy vocabulary, and confusing academic speech.
- **Interactive Self-Check Callouts:** Include strategic 1-sentence questions formatted as `> [!NOTE]` callouts under key concepts and problems to test active recall.
- **Dual-Case Implementations:** Every code example must show both:
  - `✅ CORRECT`: Clean, working solution with descriptive variables.
  - `❌ ANTI-PATTERN / COMMON BUG`: The common mistake or performance trap, with inline comments explaining why it fails.
- **Direct Clean Runnable Code:** All code must run directly in Node.js with clear `console.log` example calls showing expected outputs without requiring `assert` imports.
