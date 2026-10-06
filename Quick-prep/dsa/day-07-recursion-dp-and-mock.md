# Day 7: Mixed Patterns and Interview Practice

## Pattern selection and communication

**1. Constraints and pattern selection**

Input size, value range, ordering, and output shape narrow valid time/space costs and data structures.

**2. Mixed patterns**

Hashing, windows, binary search, traversal, heaps, DP, and greedy are candidates; justify from the problem's properties.

**3. Interview sequence**

Restate, clarify, baseline, invariant, implementation, complexity, and adversarial tests.

**4. Unsticking**

Use a small example to reveal state; preserve a correct baseline while searching for an optimization.

[Mixed strategy](../../DSA/dsa-lectures/day-56-mixed-pattern-strategy-and-constraints.md) | [High-frequency problems](../../DSA/dsa-lectures/day-57-high-frequency-senior-interview-problems.md) | [Live interview framework](../../DSA/dsa-lectures/day-59-live-interview-framework-and-unsticking.md)

## Production and revision

**1. Production constraints**

Include input bounds, memory, predictable latency, and JavaScript stack/numeric limits in implementation choices.

**2. Revision**

Review structures, complexity, invariants, and language pitfalls rather than memorizing isolated solutions.

[Backend use](../../DSA/dsa-lectures/day-58-dsa-in-production-nodejs-backends.md) | [Master review](../../DSA/dsa-lectures/day-60-comprehensive-dsa-master-cheat-sheet.md)

## Tricky points

1. **Pattern choice**

**1.1 Recognize, then prove**

A familiar label does not prove a pattern applies; state the property that makes it valid.

**1.2 Complexity**

Include output construction, recursion stack, and auxiliary structures.

2. **JavaScript implementation**

**2.1 Numeric range**

`Number` integers are exact only through `Number.MAX_SAFE_INTEGER`; state assumptions or use `BigInt` where appropriate.

**2.2 Recursion**

Deep inputs can overflow the call stack; consider iterative traversal.

**2.3 Mutation**

State whether input order/content may change, especially when sorting.

3. **Interview execution**

**3.1 Tests**

Check empty, singleton, duplicates, boundaries, and adversarial cases.

**3.2 Communication**

Explain why each pointer/state transition is safe, not just what the code does.