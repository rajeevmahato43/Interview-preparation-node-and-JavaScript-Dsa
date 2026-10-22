# Data Structures and Algorithms Domain Instructions

Teach Data Structures and Algorithms (DSA) as a first-principles problem-solving and pattern-recognition process, building from raw human intuition to mid-to-senior technical interview mastery.

Follow the shared standards in [content-rules.md](content-rules.md), [example-rules.md](example-rules.md), and [interview-rules.md](interview-rules.md).

---

## Foundational Philosophy

> **"Never teach what the solution is without first teaching how to arrive at that solution from scratch using raw human intuition, brute-force reasoning, and bottleneck diagnosis."**

Strictly reject:
- Rote memorization of code templates.
- Unexplained "magic trick" algorithms.
- Solutions presented without showing the naive brute-force first.

The goal is to forge an autonomous engineer who can walk up to an unfamiliar problem on a whiteboard, break it down using basic human intuition, discover the optimal pattern independently, and defend system-level trade-offs.

---

## Course Structure: The 30-Day Master Curriculum

- Organize the curriculum into **30 comprehensive master lecture files** (`day-01-topic.md` through `day-30-topic.md`) in `DSA/DSA_V2/`.
- Each numbered day represents a complete, self-contained master study unit.
- **Moderate length target (~650–850 lines):** Balance deep technical rigor with student focus. Do not write shallow summaries (<300 lines) and avoid overwhelming walls of text (>1,000 lines).
- Balanced topic coverage: When a day covers multiple subjects (e.g., `Objects, Maps, Sets & Hash Tables`), cover all named topics thoroughly rather than narrowing focus to just one algorithm.

---

## Universal 5-Step "Logic Discovery Engine"

Every problem explained inside a lecture MUST follow this 5-step progression:

1. **Step 1: Physical Simulation**
   - State the problem using small concrete numbers or physical items (playing cards, coins, blocks, books).
   - Trace what human eyes and hands naturally do to solve it. Write zero code and mention zero data structures.
2. **Step 2: Brute Force Approach**
   - Translate raw human instinct into simple code using basic nested loops or straightforward recursion.
   - Explain why it works and calculate its time and space bounds ($O(n^2)$ or $O(2^n)$).
3. **Step 3: Why not use the brute force? (The Bottleneck)**
   - Point out the exact wasted work in natural whiteboard language: Is the CPU scanning the same list again and again ($O(n)$ search)? Is it recalculating the same subproblem? Is it sorting data that was already sorted?
4. **Step 4: The Pattern Discovery**
   - Present the algorithm or data structure not as a clever trick, but as the natural mathematical cure for that specific bottleneck:
     - Repeated lookup bottleneck? $\to$ Need instant recall $\to$ Hash Map / Set ($O(1)$).
     - Range recalculation bottleneck? $\to$ Move boundaries $\to$ Sliding Window.
     - Sorted search space bottleneck? $\to$ Cut search space in half $\to$ Binary Search.
     - Nearest smaller/greater element bottleneck? $\to$ Monotonic Stack.
5. **Step 5: Solution using <Pattern Name>**
   - Implement the clean, production-grade JavaScript solution with descriptive variable names, dual cases (`✅ CORRECT` vs `❌ ANTI-PATTERN`), loop invariant comments, complexity analysis, and direct `console.log` example runs.

---

## Required Streamlined 11-Section Lecture Blueprint

Every DSA lecture must follow this exact section sequence:

1. **Title & Top Navigation:** `# Day XX: <Topic Title>` and `<nav aria-label="Lecture navigation">`.
2. **Prerequisites:** Clear bullet links to prior days or required baseline concepts.
3. **1. What is <Topic>?:** Simplified core definition, Pattern Family Tree taxonomy, optional high-yield Mermaid diagram, physical analogy & ASCII trace.
4. **2. How <Topic> Works:** Pointer movement / state transition rules table, the invariant principle contract, language-agnostic pseudocode.
5. **3. Pattern Recognition of <Topic>:** Diagnostic triggers, problem keywords, when to use vs. when NOT to use.
6. **4. Problem 1: <Name>:** Follows the 5-Step Logic Discovery Engine from physical simulation to optimal code.
7. **5. Problem 2: <Name>:** Follows the 5-Step Logic Discovery Engine for a scaled challenge or secondary variation.
8. **6. Hands-On Exercise: <Scenario Name>:** Realistic scenario under load, buggy code with memory/CPU flaw, acceptance criteria, verified solution, runnable differential stress-testing / fuzzing harness (500+ iterations).
9. **7. Tricky Points:** Subtle boundary traps, duplicate handling, degenerate inputs, language-specific safe integer/type boundaries.
10. **8. Cheat Sheet:** Algorithm decision table, common pitfalls list, reusable code template skeleton.
11. **9. Summary:** High-density recap covering mechanics, monotonic pruning, V8 register/memory Smis, cache locality, and systems alignment.
12. **10. Interview Q&A:** Structured 45-second technical pitch + 4 deep questions (mental model, trace/output, debugging, backend scale trade-off).
13. **11. Practice Problems:** 3 curated challenges (Easy, Medium, Hard) with sample inputs/outputs AND 3-tier Socratic hint ladders (Nudge $\to$ Invariant $\to$ State transition skeleton).
Ending with:
- **Bottom Navigation:** `<nav aria-label="Lecture navigation">`.

---

## Language & Definition Standards

- **Basic English Only:** Write in simple, direct English. Avoid heavy words, fancy vocabulary, and confusing academic speech.
- **In-Place Term Callouts:** Define every specialized term right where it appears using:
  ```markdown
  > **Term**: 1-line plain definition explaining what it is and what it does.
  ```
- **Dual-Case Implementations:** Every code example must show both:
  - `✅ CORRECT / POSITIVE CASE`: The clean, working solution.
  - `❌ ANTI-PATTERN / COMMON BUG`: The common mistake or performance trap, with inline comments explaining why it fails.
- **Direct Clean Runnable Code:** All code must run directly in Node.js with clear `console.log` example calls showing expected outputs without requiring `assert` imports.

---

## Scope Boundaries

- DSA examples should use JavaScript and connect to Node.js backend realities (memory usage, event loop blocking).
- Advanced database query optimization belongs in [postgresql.md](postgresql.md) and [mongodb.md](mongodb.md).
- Distributed system architecture belongs in system design documentation, not individual DSA unit lectures.