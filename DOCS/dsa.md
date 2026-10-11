# Data Structures and Algorithms Domain Instructions

Teach DSA as a reasoning and pattern-recognition process for solving constrained problems, from beginner fundamentals to master-level interview depth.

## Course structure and consolidation

- Organize the curriculum into **30 comprehensive master lecture files** (`day-01-topic.md` through `day-30-topic.md`), consolidating multiple connected topics per file.
- The 30-day file division represents self-contained study units, regardless of whether a learner completes them over 30 days, 6 weeks, or 6 months.
- Never compromise depth when consolidating: every file must provide exhaustive explanations, diagrams, concrete code, edge cases, and interview preparation spanning beginner to senior level.

## Required scope

Cover asymptotic analysis, arrays and strings, hashing, linked lists, stacks, queues, trees, heaps, tries, graphs, sorting, searching, recursion, backtracking, greedy methods, dynamic programming, intervals, and common problem-solving patterns.

## Lecture progression structure (Basics First, Advanced at End)

To keep lectures beginner-accessible while achieving senior depth, strictly structure the core content in three progressive phases:

### Phase 1: Absolute basics, intuition & pattern recognition (Top of Lecture)
1. **Mental model & everyday intuition**: Begin with clear, everyday analogies and visual ASCII diagrams. Explain what the concept does and why it exists in plain, jargon-free English.
2. **How the algorithm works**: Walk through the step-by-step mechanics conceptually before writing complex code.
3. **Instant pattern recognition ("How to spot this pattern")**: Teach the candidate how to immediately recognize when to use this pattern upon seeing a new problem:
   - Diagnostic triggers: *Is this hashing? Sliding window? Two pointers? Monotonic stack?*
   - Problem statement keywords (e.g., "contiguous subarray" $\to$ sliding window; "sorted pair" $\to$ two pointers).
   - Constraint-to-complexity hints (e.g., $N \le 10^5 \implies O(n)$ or $O(n \log n)$).

### Phase 2: Clean problem solving & complexity derivation (Middle)
4. **Brute-force baseline**: Start with the naive solution ($O(n^2)$), explaining why it works and why it fails at scale.
5. **The optimized insight**: Identify the wasted work eliminated by the pattern.
6. **Clean JavaScript solution**: Write production-grade, readable JavaScript with descriptive variable names and loop invariant comments.
7. **Step-by-step complexity derivation**: Show how to count time steps and auxiliary memory allocations, including call-stack frames.

### Phase 3: Deep-dive engine mechanics, tricky points & practice (End of Lecture)
8. **Under the Hood: Engine & Runtime Mechanics**: Place low-level engine details (packed vs holey arrays, SMI vs double, hidden classes, garbage collection) and Node.js concurrency realities (event loop blocking, worker threads) here so beginners are not blocked upfront.
9. **Tricky points and edge cases**: Substantially expanded section detailing subtle traps, off-by-one errors, type coercion surprises, mutation hazards, and adversarial inputs.
10. **Hands-on exercises**: Provide 3 scaffolded problem tiers: Warm-Up (Easy), Core Challenge (Medium), and Scaled Follow-Up (Hard).
11. **Comprehensive summary & cheat sheet**: Exhaustive recaps, decision matrices, reusable code skeletons, and quick-scan invariants.
12. **Technical Discussion & Deep Q&A**: Include 45-second technical walkthroughs, trade-off evaluations, and conceptual discussion questions with deep answers.
13. **LeetCode Practice Problems**: A dedicated section at the very end listing curated practice problems with problem statement, difficulty, sample input, and expected output **without answers or code**, allowing learners to practice independently.

## Problem explanation format

For each problem in the core concepts, avoid using "LeetCode XX" in the main section title (use clean names like `Problem 1: Valid Palindrome`). Require: restated goal, assumptions, examples, baseline, insight, algorithm, proof sketch or invariant, implementation, complexity, tests, and follow-up variations. Keep domain knowledge separate from [javascript.md](javascript.md), while still explaining JavaScript details that affect the solution.

## Cheat sheet requirements

Every DSA lecture cheat sheet should include:
- Pattern-recognition cues and signals in the problem statement.
- When to choose each relevant data structure.
- Common operation time and space complexity.
- Reusable algorithm or implementation templates.
- Invariants, proof reminders, or correctness checks.
- Important edge cases and failure cases.
- JavaScript pitfalls such as mutation, numeric limits, sorting, recursion depth, and reference behavior.
- Common very hard follow-up variations.

## Boundaries

Use database-specific files for query planning and data modeling. Use [node.md](node.md) for runtime performance and production concurrency. DSA examples may support backend interview preparation but should not be presented as production architecture by themselves.