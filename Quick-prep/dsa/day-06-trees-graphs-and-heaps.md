# Day 6: Dynamic Programming, Greedy, and Advanced Structures

## Dynamic programming

**1. DP model**

Define state, recurrence, base cases, and evaluation order for overlapping subproblems.

```text
ways[n] = ways[n - 1] + ways[n - 2]
```

**2. Memoization and tabulation**

Memoization caches recursive states; tabulation computes dependencies in order and can reduce call-stack use.

**3. 1D and 2D patterns**

House Robber, coin change, LIS, grid paths, LCS, and knapsack use states matching prior choices/positions.

[DP basics](../../DSA/dsa-lectures/day-46-dynamic-programming-memo-and-tabulation.md) | [1D](../../DSA/dsa-lectures/day-47-1d-dp-house-robber-and-coin-change.md) | [LIS](../../DSA/dsa-lectures/day-48-1d-dp-longest-increasing-subsequence.md) | [Grid](../../DSA/dsa-lectures/day-49-2d-dp-grid-paths-and-minimum-path-sum.md) | [LCS/knapsack](../../DSA/dsa-lectures/day-50-2d-dp-longest-common-subsequence-knapsack.md)

## Greedy and connectivity structures

**1. Greedy choice**

A locally best choice is correct only with a proof such as exchange or stays-ahead; interval scheduling often sorts by finish time.

**2. Trie**

Stores prefixes as paths through nodes, trading memory for prefix lookup.

**3. Union-find**

`find` returns a component representative; `union` merges components. Path compression/rank make operations near-constant amortized.

[Greedy](../../DSA/dsa-lectures/day-51-greedy-interval-scheduling.md) | [Greedy variants](../../DSA/dsa-lectures/day-52-greedy-traversal-jump-game-gas-station.md) | [Trie](../../DSA/dsa-lectures/day-53-trie-construction-and-prefix-search.md) | [Union-find](../../DSA/dsa-lectures/day-54-union-find-disjoint-set-union.md) | [Graph applications](../../DSA/dsa-lectures/day-55-union-find-graph-applications.md)

## Tricky points

1. **Dynamic programming**

**1.1 State**

If state omits information needed for future choices, the recurrence is invalid.

**1.2 Complexity**

Count states times transition work; table dimensions can dominate memory.

**1.3 Initialization**

Incorrect base cases or iteration order can produce plausible wrong answers.

2. **Greedy and structures**

**2.1 Greedy proof**

Sample success is not proof; explain why a local choice can belong to a global optimum.

**2.2 Trie**

Prefix lookup may use more memory than a hash set; choose for the query pattern.

**2.3 Union-find**

Supports connectivity under merges, not arbitrary path queries or deletions.