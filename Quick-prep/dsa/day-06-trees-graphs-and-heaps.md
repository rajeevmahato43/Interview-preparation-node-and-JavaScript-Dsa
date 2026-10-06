# Day 6: Dynamic Programming, Greedy, and Advanced Structures

Quick review of main-course lectures 46–55. Focuses on recurrence relations, memoization vs tabulation, greedy exchange proofs, prefix tries, and Disjoint Set Union (DSU).

## Dynamic programming: 1D and 2D patterns

**1. DP formulation: Memoization vs Tabulation**

Identify optimal substructure and overlapping subproblems. Define state $dp[i]$, base cases, recurrence relation, and direction of iteration.

**2. 1D DP: Coin change and state reduction (House Robber)**

In Coin Change, $dp[a]$ is min coins for amount $a$. In House Robber, reduce $O(n)$ space to $O(1)$ by keeping only the two prior states: `curr = Math.max(prev1, prev2 + nums[i])`.

```js
function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let i = 1; i <= amount; i++) {
    for (const c of coins) {
      if (i - c >= 0) dp[i] = Math.min(dp[i], dp[i - c] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
```

**3. Longest Increasing Subsequence (LIS)**

$dp[i]$ stores the length of LIS ending at index $i$. Tabulation compares with all $j < i$ where $nums[j] < nums[i]$ in $O(n^2)$ time.

```js
function lengthOfLIS(nums) {
  const dp = new Array(nums.length).fill(1);
  let max = 1;
  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
    }
    max = Math.max(max, dp[i]);
  }
  return max;
}
```

**4. 2D DP: Unique paths and Longest Common Subsequence (LCS)**

For grid paths: `dp[r][c] = dp[r - 1][c] + dp[r][c - 1]`. For LCS: if characters match, take diagonal $+ 1$; otherwise take max of top and left cells.

```js
function longestCommonSubsequence(text1, text2) {
  const m = text1.length, n = text2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) dp[i][j] = 1 + dp[i - 1][j - 1];
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}
```

[DP fundamentals](../../DSA/dsa-lectures/day-46-dynamic-programming-memo-and-tabulation.md) | [1D DP](../../DSA/dsa-lectures/day-47-1d-dp-house-robber-and-coin-change.md) | [LIS](../../DSA/dsa-lectures/day-48-1d-dp-longest-increasing-subsequence.md) | [Grid DP](../../DSA/dsa-lectures/day-49-2d-dp-grid-paths-and-minimum-path-sum.md) | [LCS and Knapsack](../../DSA/dsa-lectures/day-50-2d-dp-longest-common-subsequence-knapsack.md)

## Greedy algorithms and advanced structures

**1. Greedy intervals: Merge overlapping intervals**

Sort intervals by start time. Iterate through intervals; if `curr.start <= prev.end`, merge by extending `prev.end = Math.max(prev.end, curr.end)`; otherwise push new interval ($O(n \log n)$).

```js
function mergeIntervals(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  const res = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const prev = res[res.length - 1], curr = intervals[i];
    if (curr[0] <= prev[1]) prev[1] = Math.max(prev[1], curr[1]);
    else res.push(curr);
  }
  return res;
}
```

**2. Greedy reachability: Jump Game**

Maintain the furthest reachable index `maxReach`. At index $i$, if $i > maxReach$, return false; otherwise update `maxReach = Math.max(maxReach, i + nums[i])` in $O(n)$ time.

```js
function canJump(nums) {
  let maxReach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > maxReach) return false;
    maxReach = Math.max(maxReach, i + nums[i]);
  }
  return true;
}
```

**3. Trie (Prefix Tree)**

Tree where each node holds children maps and an `isEnd` flag. Provides $O(L)$ word insertion, search, and prefix matching where $L$ is word length.

```js
class TrieNode { constructor() { this.children = {}; this.isEnd = false; } }
class Trie {
  constructor() { this.root = new TrieNode(); }
  insert(word) {
    let curr = this.root;
    for (const ch of word) {
      if (!curr.children[ch]) curr.children[ch] = new TrieNode();
      curr = curr.children[ch];
    }
    curr.isEnd = true;
  }
  startsWith(prefix) {
    let curr = this.root;
    for (const ch of prefix) {
      if (!curr.children[ch]) return false;
      curr = curr.children[ch];
    }
    return true;
  }
}
```

**4. Disjoint Set Union (DSU / Union-Find)**

Tracks non-overlapping sets. Path compression flattens tree during `find`; union by rank attaches smaller tree beneath larger, achieving nearly $O(1)$ ($\alpha(n)$) amortized time.

```js
class DSU {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }
  find(i) {
    if (this.parent[i] !== i) this.parent[i] = this.find(this.parent[i]); // Path compression
    return this.parent[i];
  }
  union(x, y) {
    const rootX = this.find(x), rootY = this.find(y);
    if (rootX === rootY) return false; // Already connected (cycle detected)
    if (this.rank[rootX] < this.rank[rootY]) this.parent[rootX] = rootY;
    else if (this.rank[rootX] > this.rank[rootY]) this.parent[rootY] = rootX;
    else { this.parent[rootY] = rootX; this.rank[rootX]++; }
    return true;
  }
}
```

[Greedy intervals](../../DSA/dsa-lectures/day-51-greedy-interval-scheduling.md) | [Greedy traversal](../../DSA/dsa-lectures/day-52-greedy-traversal-jump-game-gas-station.md) | [Trie construction](../../DSA/dsa-lectures/day-53-trie-construction-and-prefix-search.md) | [Union-Find DSU](../../DSA/dsa-lectures/day-54-union-find-disjoint-set-union.md) | [DSU graph applications](../../DSA/dsa-lectures/day-55-union-find-graph-applications.md)

## Tricky points

1. **Dynamic programming pitfalls**
   **1.1 Unbounded table sizes:** Preallocating a full 2D matrix of $M \times N$ when only the preceding row is needed wastes memory; use rolling 1D arrays ($O(N)$ space).
   **1.2 Base case initialization:** For minimization DP (e.g. Coin Change), initialize with `Infinity` and set `dp[0] = 0`. Setting `dp[0] = Infinity` causes all states to evaluate to `Infinity`.
   **1.3 Subproblem dependency order:** Tabulation loop directions must strictly match subproblem dependencies (e.g., in 0/1 knapsack without 2D table, iterate capacity backward to prevent using an item multiple times).

2. **Greedy and connectivity**
   **2.1 Greedy vs DP trap:** Greedy choices are only valid when local optimal choices never need to be reconsidered (satisfying the greedy-choice property and optimal substructure). If future constraints restrict choices, DP is required.
   **2.2 Interval sorting order:** Merging intervals requires sorting by *start* time; interval scheduling (maximizing non-overlapping intervals) requires sorting by *end* time.
   **2.3 DSU path compression omission:** Omitting path compression degrades DSU tree depth to $O(n)$, causing operations to become $O(n)$ instead of amortized $\alpha(n) \approx O(1)$.