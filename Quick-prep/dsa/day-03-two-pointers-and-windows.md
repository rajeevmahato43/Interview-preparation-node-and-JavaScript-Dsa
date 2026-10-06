# Day 3: Recursion, Backtracking, Search, and Linked Lists

## Recursion and search spaces

**1. Recursion**

Each call adds a stack frame; define a base case and ensure every call makes progress toward it.

```js
function countDown(n) {
	if (n === 0) return;
	countDown(n - 1);
}
```

**2. Backtracking**

Choose, recurse, then undo shared state; subsets, combinations, permutations, and grid paths often enumerate exponentially many answers.

**3. Pruning**

Stop a branch only when it cannot produce a valid/better answer; the pruning condition needs a correctness reason.

[Recursion](../../DSA/dsa-lectures/day-21-recursion-mechanics-and-call-stack.md) | [Backtracking](../../DSA/dsa-lectures/day-22-backtracking-fundamentals.md) | [Subsets](../../DSA/dsa-lectures/day-23-subsets-and-power-sets.md) | [Combinations/permutations](../../DSA/dsa-lectures/day-24-combinations-and-permutations.md) | [Grid search](../../DSA/dsa-lectures/day-25-grid-backtracking-and-n-queens.md)

## Binary search and lists

**1. Binary search**

Sorted input or a monotone predicate lets each comparison discard half the range; choose closed or half-open bounds and keep them consistent.

**2. Search on answer**

Binary-search a candidate result when feasibility changes monotonically across the answer range.

```text
minimum feasible capacity: false false false true true
```

**3. Linked lists**

Nodes hold links rather than indexes; traversal is `O(n)`, while a known node can be rewired in `O(1)`.

**4. Fast/slow list patterns**

Different pointer speeds detect cycles, find a midpoint, or locate an item from the end.

[Bounds](../../DSA/dsa-lectures/day-26-binary-search-bounds-and-intervals.md) | [Rotated arrays/peaks](../../DSA/dsa-lectures/day-27-binary-search-rotated-arrays-and-peaks.md) | [Search on answer](../../DSA/dsa-lectures/day-28-binary-search-on-solution-space.md) | [Linked lists](../../DSA/dsa-lectures/day-29-singly-and-doubly-linked-lists.md) | [List patterns](../../DSA/dsa-lectures/day-30-linked-list-fast-slow-and-reversals.md)

## Tricky points

1. **Recursion and backtracking**

**1.1 Base case**

Missing or unreachable base cases recurse until stack failure.

**1.2 Undo**

Shared path/board mutations must be reversed before exploring another branch.

**1.3 Complexity**

Enumeration can be exponential; state output cost and input limits.

2. **Binary search**

**2.1 Bounds**

Mixing `[left, right]` and `[left, right)` conventions creates off-by-one errors.

**2.2 Answer search**

A monotone feasibility predicate is required; arbitrary predicates cannot be binary-searched.

3. **Linked lists**

**3.1 Reversal**

Save `next` before rewiring, or the remaining nodes become unreachable.

**3.2 Cycle detection**

Compare node identity, not node values.