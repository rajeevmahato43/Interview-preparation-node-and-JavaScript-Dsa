# Data Structures and Algorithms Domain Instructions

Teach DSA as a reasoning process for solving constrained problems, not as memorized templates.

## Required scope

Cover asymptotic analysis, arrays and strings, hashing, linked lists, stacks, queues, trees, heaps, tries, graphs, sorting, searching, recursion, backtracking, greedy methods, dynamic programming, intervals, and common problem-solving patterns.

## Teaching requirements

- Begin with problem clarification, constraints, invariants, and a brute-force baseline.
- Derive the optimized approach and explain why it is correct before presenting code.
- State time and space complexity, including auxiliary space and recursion depth where relevant.
- Trace representative and adversarial cases, including empty input, duplicates, extremes, cycles, and overflow-like concerns.
- Use JavaScript implementations with descriptive names and explain language-specific concerns such as mutation, numeric limits, maps, sets, and sorting behavior.
- Compare alternatives when the choice depends on constraints rather than presenting one pattern as universal.
- Connect algorithms to JavaScript implementation details and, when useful, to Node.js concerns such as memory, queues, streams, scheduling, or request-time limits.

## Interview format

For each problem, require: restated goal, assumptions, examples, baseline, insight, algorithm, proof sketch or invariant, implementation, complexity, tests, and follow-up variations. Keep domain knowledge separate from [javascript.md](javascript.md), while still explaining JavaScript details that affect the solution.

## Cheat sheet requirements

Every DSA lecture cheat sheet should include the parts relevant to that day's topic:

- Pattern-recognition cues and signals in the problem statement.
- When to choose each relevant data structure.
- Common operation time and space complexity.
- Reusable algorithm or implementation templates.
- Invariants, proof reminders, or correctness checks.
- Important edge cases and failure cases.
- JavaScript pitfalls such as mutation, numeric limits, sorting, recursion depth, and reference behavior.
- Common very hard follow-up variations.

Do not force every item into every day. Include the items that genuinely match the day's algorithms and data structures.

## Boundaries

Use database-specific files for query planning and data modeling. Use [node.md](node.md) for runtime performance and production concurrency. DSA examples may support backend interview preparation but should not be presented as production architecture by themselves.