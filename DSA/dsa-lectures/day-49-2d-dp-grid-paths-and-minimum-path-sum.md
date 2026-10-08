# Day 49: 2D Dynamic Programming: Grid Paths and Minimum Path Sum

<nav aria-label="Lecture navigation">
  <a href="day-48-1d-dp-longest-increasing-subsequence.md">◀ Day 48: 1D DP: Longest Increasing Subsequence</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-50-2d-dp-longest-common-subsequence-knapsack.md">Day 50: 2D DP: Longest Common Subsequence and Knapsack ▶</a>
</nav>

---
## Prerequisites

- [Day 25: Grid Backtracking and N-Queens](day-25-grid-backtracking-and-n-queens.md) — 2D matrix coordinate navigation and boundary checks.
- [Day 46: Dynamic Programming: Memoization and Tabulation](day-46-dynamic-programming-memo-and-tabulation.md) — Tabulation and space optimization fundamentals.
---

## 1. Spatial Transitions in Grid DP

> **Grid DP**: Dynamic programming where states represent coordinates $(r, c)$ on an $M \times N$ matrix.

When an agent moves on an $M \times N$ grid from top-left $(0, 0)$ to bottom-right $(M - 1, N - 1)$ moving strictly **Right** and **Down**:
- Any cell $(r, c)$ can only be reached from two possible predecessors:
  1. From the cell directly above: $(r - 1, c)$
  2. From the cell directly to the left: $(r, c - 1)$

```text
2D Grid DP Spatial Transitions:
            (r - 1, c) [From Above]
                 |
                 v
(r, c - 1) ---> [ (r, c) ]
[From Left]

1. Counting Distinct Paths (Unique Paths):
   dp[r][c] = dp[r - 1][c] + dp[r][c - 1]

2. Minimizing Cumulative Weight (Minimum Path Sum):
   dp[r][c] = grid[r][c] + Math.min(dp[r - 1][c], dp[r][c - 1])
```

---

## 2. Space Optimization: The 1D Rolling Array Pattern

> **1D Rolling Array**: Maintaining a single array of size $N$ where `dp[c]` holds the state from the previous row before being updated with the left cell.

In standard 2D DP, allocating an $M \times N$ table takes $O(M \times N)$ space.
Notice that computing row $r$ **only** references:
- The cell directly above in row $r - 1$ (`dp[r - 1][c]`)
- The cell to the left in the current row $r$ (`dp[r][c - 1]`)

By using a single 1D array `dp` of size $N$:
- Before updating index $c$, `dp[c]` still holds the value from the **row above** ($r - 1, c$).
- `dp[c - 1]` has already been updated for the current row, holding the value from the **cell to the left** ($r, c - 1$).
Therefore, the recurrence collapses into:
$$dp[c] = dp[c] + dp[c - 1]$$

```text
1D Rolling Array Mechanics:
Row 0: [ 1,  1,  1,  1 ] (Initialized to 1)

Row 1 processing:
c = 1: dp[1] = dp[1] (above) + dp[0] (left) = 1 + 1 = 2
c = 2: dp[2] = dp[2] (above) + dp[1] (left) = 1 + 2 = 3
c = 3: dp[3] = dp[3] (above) + dp[2] (left) = 1 + 3 = 4
State becomes: [ 1, 2, 3, 4 ]

Row 2 processing:
c = 1: dp[1] = 2 + 1 = 3
c = 2: dp[2] = 3 + 3 = 6
c = 3: dp[3] = 4 + 6 = 10
State becomes: [ 1, 3, 6, 10 ]
Space reduced from O(M * N) down to O(N)!
```

```javascript
// Node.js code: Unique Paths I with O(N) Space
/**
 * @param {number} m
 * @param {number} n
 * @returns {number}
 */
function uniquePaths(m, n) {
  // Allocate 1D array of size n initialized to 1 (representing row 0)
  const dp = new Array(n).fill(1);

  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) {
      dp[c] = dp[c] + dp[c - 1];
    }
  }

  return dp[n - 1];
}

console.log('Unique paths for 3x7 grid:', uniquePaths(3, 7)); // 28
```

---

## 3. Unique Paths II: Obstacles and Path Termination

> **Unique Paths**: The total number of distinct monotonic paths from top-left $(0, 0)$ to bottom-right $(M-1, N-1)$ moving only Right and Down.

In **Unique Paths II** (LeetCode 63), cells with `obstacleGrid[r][c] === 1` represent walls that cannot be traversed.

```text
Obstacle Grid:
[
  [0, 0, 0],
  [0, 1, 0],  <-- Cell (1, 1) is blocked!
  [0, 0, 0]
]

Rules:
1. If obstacleGrid[r][c] === 1: dp[c] = 0 (No paths can traverse this cell!)
2. If c === 0: dp[0] remains its previous value unless blocked; if blocked, dp[0] = 0!
```

```javascript
// Node.js code: Unique Paths II with O(N) Space
/**
 * @param {number[][]} obstacleGrid
 * @returns {number}
 */
function uniquePathsWithObstacles(obstacleGrid) {
  if (!obstacleGrid || obstacleGrid.length === 0 || obstacleGrid[0].length === 0) return 0;
  if (obstacleGrid[0][0] === 1) return 0; // Starting point is blocked

  const m = obstacleGrid.length;
  const n = obstacleGrid[0].length;
  const dp = new Array(n).fill(0);

  dp[0] = 1; // Start position

  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (obstacleGrid[r][c] === 1) {
        dp[c] = 0; // Wall: zero paths
      } else if (c > 0) {
        dp[c] = dp[c] + dp[c - 1];
      }
      // If c === 0, dp[0] either carries down from previous row or becomes 0 if blocked
    }
  }

  return dp[n - 1];
}

console.log('Paths with obstacle:', uniquePathsWithObstacles([[0,0,0],[0,1,0],[0,0,0]])); // 2
```

---

## 4. Minimum Path Sum (LeetCode 64)

> **Minimum Path Sum**: The minimum cumulative cell weight encountered traveling from top-left to bottom-right.

Given an $M \times N$ grid filled with non-negative numbers, find a path from $(0, 0)$ to $(M - 1, N - 1)$ minimizing the sum of all numbers along its path.

```javascript
// Node.js code: Minimum Path Sum with O(N) Space
/**
 * @param {number[][]} grid
 * @returns {number}
 */
function minPathSum(grid) {
  if (!grid || grid.length === 0) return 0;
  const m = grid.length;
  const n = grid[0].length;

  const dp = new Array(n);
  dp[0] = grid[0][0];

  // Initialize first row
  for (let c = 1; c < n; c++) {
    dp[c] = dp[c - 1] + grid[0][c];
  }

  // Iterate remaining rows
  for (let r = 1; r < m; r++) {
    dp[0] = dp[0] + grid[r][0]; // First column can only come from above

    for (let c = 1; c < n; c++) {
      dp[c] = grid[r][c] + Math.min(dp[c], dp[c - 1]);
    }
  }

  return dp[n - 1];
}

console.log(
  'Min path sum:',
  minPathSum([
    [1, 3, 1],
    [1, 5, 1],
    [4, 2, 1]
  ])
); // 7 (1 -> 3 -> 1 -> 1 -> 1)
```

---

## Detailed Node.js Relevance

### Multi-Hop Cloud Routing and Latency Minimization Tables

In Node.js cloud gateway microservices routing traffic across geographical edge locations and regional VPCs:

```text
Cross-Region Routing Matrix:
[Client] ---> Edge Node (r) ---> Internal Transit VPC (c) ---> [Target DB]
Cost table represents cumulative latency in milliseconds.
```

1. **V8 Heap Cache Lines**: In JavaScript, a 2D array `const matrix = Array.from({length: M}, () => new Array(N))` creates $M + 1$ distinct array objects scattered across heap memory. Accessing `matrix[r][c]` requires double pointer dereferencing. Using a flat 1D typed array (`new Float64Array(M * N)`) with index arithmetic `r * N + c` keeps all cells contiguous, maximizing CPU cache line hits and eliminating garbage collection churn during real-time route calculations.
2. **Deterministic Route Caching**: Because cloud route latency tables change infrequently (every few minutes), computing the minimum cost path via 2D DP once and caching the 1D cost table in memory serves thousands of API routing decisions per second with sub-microsecond latency.

---

## Tricky Points & Edge Cases

1. **Top-Left or Bottom-Right Starting Obstacle**:
   In Unique Paths II, if `obstacleGrid[0][0] === 1` or `obstacleGrid[m - 1][n - 1] === 1`, no valid path can ever start or finish! Return 0 immediately.
2. **First Column Obstacle Blocking**:
   In Unique Paths II, if `obstacleGrid[i][0] === 1`, all subsequent cells in that first column (`obstacleGrid[j][0]` for $j > i$) are completely cut off and must have $dp = 0$.
3. **In-Place Grid Mutation Pitfall**:
   While overwriting `grid[r][c]` in-place achieves $O(1)$ auxiliary memory, it permanently corrupts caller data. In production Node.js services where data might be shared across concurrent asynchronous callbacks, always use a separate 1D array to guarantee immutability.
4. **Dimensions $1 \times 1$**:
   A grid of size $1 \times 1$ requires 0 moves. Total unique paths is 1 (if no obstacle) or 0 (if blocked). Minimum path sum is simply `grid[0][0]`.

---

## Hands-On Exercise

### Scenario
You are developing a route latency optimizer in Node.js for an API gateway. The network grid is an $M \times N$ matrix where `grid[r][c]` represents latency in milliseconds. Certain nodes are designated as offline maintenance zones (`-1` indicates an impassable node).
Implement `findCheapestSafeRoute(grid)`:
1. Returns the **minimum latency** from $(0, 0)$ to $(M - 1, N - 1)$.
2. If no valid path exists without touching maintenance nodes (`-1`), return `-1`.
3. Must execute in $O(M \times N)$ time and $O(N)$ auxiliary space.

### Buggy Code
```javascript
function findCheapestSafeRoute(grid) {
  // BUG: Uses 0 instead of -1 check; treats unreachable cells as 0 latency
  const dp = new Array(grid[0].length).fill(0);
  dp[0] = grid[0][0];

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      // Missing proper boundary checks for impassable cells (-1)
      dp[c] = grid[r][c] + Math.min(dp[c], dp[c - 1] || 0);
    }
  }
  return dp[grid[0].length - 1];
}
```

### Acceptance Criteria
- Treat `-1` as completely impassable walls.
- Return `-1` if start cell or destination cell is blocked.
- Use `Infinity` sentinel values to prevent unreachable branches from contaminating the minimum calculation.
- Memory usage must be strictly $O(N)$ without mutating the input grid.

### Solution Code
```javascript
const assert = require('assert');

// Node.js code: Robust Route Latency Optimizer with Impassable Nodes
/**
 * @param {number[][]} grid
 * @returns {number}
 */
function findCheapestSafeRoute(grid) {
  if (!grid || grid.length === 0 || grid[0].length === 0) return -1;
  const m = grid.length;
  const n = grid[0].length;

  if (grid[0][0] === -1 || grid[m - 1][n - 1] === -1) return -1;

  const dp = new Array(n).fill(Infinity);
  dp[0] = grid[0][0];

  // Initialize first row
  for (let c = 1; c < n; c++) {
    if (grid[0][c] === -1 || dp[c - 1] === Infinity) {
      dp[c] = Infinity;
    } else {
      dp[c] = dp[c - 1] + grid[0][c];
    }
  }

  // Process remaining rows
  for (let r = 1; r < m; r++) {
    // Update first column
    if (grid[r][0] === -1 || dp[0] === Infinity) {
      dp[0] = Infinity;
    } else {
      dp[0] = dp[0] + grid[r][0];
    }

    for (let c = 1; c < n; c++) {
      if (grid[r][c] === -1) {
        dp[c] = Infinity;
      } else {
        const fromAbove = dp[c];
        const fromLeft = dp[c - 1];
        const minPrev = Math.min(fromAbove, fromLeft);

        if (minPrev === Infinity) {
          dp[c] = Infinity;
        } else {
          dp[c] = grid[r][c] + minPrev;
        }
      }
    }
  }

  return dp[n - 1] === Infinity ? -1 : dp[n - 1];
}

// Verification & Automated Unit Tests
// Test 1: Valid path navigating around -1 obstacle
const grid1 = [
  [1, 3, 1],
  [1, -1, 1],
  [4, 2, 1]
];
// Path: (0,0)->(1,0)->(2,0)->(2,1)->(2,2) = 1 + 1 + 4 + 2 + 1 = 9
// Or: (0,0)->(0,1)->(0,2)->(1,2)->(2,2) = 1 + 3 + 1 + 1 + 1 = 7 (Optimal!)
assert.strictEqual(findCheapestSafeRoute(grid1), 7);

// Test 2: Completely blocked grid
const gridBlocked = [
  [1, -1],
  [-1, 1]
];
assert.strictEqual(findCheapestSafeRoute(gridBlocked), -1);

// Test 3: Start blocked
assert.strictEqual(findCheapestSafeRoute([[-1, 5], [2, 1]]), -1);

// Test 4: Single cell
assert.strictEqual(findCheapestSafeRoute([[42]]), 42);
assert.strictEqual(findCheapestSafeRoute([[-1]]), -1);

console.log('✅ All findCheapestSafeRoute assertions passed successfully!');
```

### Solution Explanation
1. **`Infinity` Sentinel Propagation**: By initializing inaccessible paths to `Infinity`, any cell whose only predecessors are impassable automatically evaluates to `grid[r][c] + Infinity = Infinity`, correctly pruning invalid routes.
2. **Boundary Safeguards**: Cells in row 0 or column 0 immediately become permanently unreachable if a `-1` precedes them.
3. **Memory Economy**: Operating on a single 1D array of length $N$ caps space at $O(N)$ while leaving input arrays untouched.

---

## Summary

- **2D Grid DP** computes path metrics on an $M \times N$ matrix where moves are restricted to cardinal directions (typically Right and Down).
- **Unique Paths** accumulates options: $dp[r][c] = dp[r - 1][c] + dp[r][c - 1]$.
- **Minimum Path Sum** minimizes cost: $dp[r][c] = \text{grid}[r][c] + \min(dp[r - 1][c], dp[r][c - 1])$.
- **1D Rolling Array Pattern**: Because each row depends only on the row directly above and the left cell, space can always be compressed from $O(M \times N)$ to $O(N)$.
- In Node.js networking and cloud services, 1D array DP enables fast latency minimization and packet routing without garbage collection penalties.

---

## Cheat Sheet & Common Pitfalls

| Problem | Recurrence | Base Case | Space Optimization |
| :--- | :--- | :--- | :--- |
| **Unique Paths** | $dp[c] = dp[c] + dp[c - 1]$ | `dp.fill(1)` | $O(N)$ 1D array |
| **Unique Paths II** | If obstacle: $dp[c] = 0$; else add left | `dp[0] = 1` if no obstacle | $O(N)$ 1D array |
| **Min Path Sum** | $dp[c] = \text{val} + \min(dp[c], dp[c - 1])$ | Cumulative sum of row 0 | $O(N)$ 1D array |
| **Impassable Cells** | Assign `Infinity` | Propagate sentinel | Guard `minPrev !== Infinity` |

---

## Interview Questions

### 1. How does the 1D rolling array optimization work in 2D Grid DP without data corruption?
**Question:** Explain how a single 1D array of size $N$ can replace an $M \times N$ matrix in Unique Paths without the new values overwriting needed data.

**Answer:**
When updating the 1D array `dp` for row $r$:
1. At any column $c$, we need two values: the value from the row above ($r - 1, c$) and the value from the cell to the left ($r, c - 1$).
2. In our 1D array `dp`, before we overwrite `dp[c]`, the value currently stored at `dp[c]` was placed there during the calculation of row $r - 1$. Therefore, `dp[c]` **is** the value from above!
3. The value at `dp[c - 1]` was already updated in the current loop iteration at step $c - 1$. Therefore, `dp[c - 1]` **is** the value from the left!
4. By evaluating `dp[c] = dp[c] + dp[c - 1]`, we read the previous row's value from `dp[c]` and the current row's left neighbor from `dp[c - 1]`, perfectly mirroring the 2D recurrence without any intermediate buffer.

---

### 2. Can Unique Paths I be solved in $O(1)$ space using combinatorics?
**Question:** Explain how Unique Paths can be solved in $O(M + N)$ time and $O(1)$ space using mathematical combinations instead of Dynamic Programming.

**Answer:**
To travel from $(0, 0)$ to $(M - 1, N - 1)$:
1. The robot must make exactly $M - 1$ Down moves and $N - 1$ Right moves.
2. The total number of moves is always fixed at $T = (M - 1) + (N - 1) = M + N - 2$.
3. Any path is uniquely determined by choosing which $M - 1$ of the total $T$ steps are Down moves.
4. Therefore, the total number of unique paths is the mathematical combination:
   $$\binom{M + N - 2}{M - 1} = \frac{(M + N - 2)!}{(M - 1)! \cdot (N - 1)!}$$
5. This can be computed iteratively in $O(\min(M, N))$ time and $O(1)$ auxiliary space without allocating any DP arrays.

---

### 3. What is the danger of in-place grid mutation in Node.js asynchronous APIs?
**Question:** Why is mutating the input grid directly (e.g., `grid[r][c] += Math.min(...)`) considered an anti-pattern in Node.js backend services, despite saving memory?

**Answer:**
1. **Shared Memory Concurrency**: In Node.js, functions that receive nested objects or arrays receive them by reference. If the input grid is cached, passed from a shared service, or referenced across multiple asynchronous callbacks/event listeners, mutating it in-place corrupts the original data for other callers.
2. **Hidden Class De-Optimization in V8**: If the input matrix contains mixed types or if properties are reassigned in ways that alter their V8 hidden shapes, V8's optimizing compiler (TurboFan) may de-optimize subsequent array operations.
3. **Best Practice**: Use an independent $O(N)$ 1D array or flat typed array (`Int32Array`) to preserve caller immutability with negligible memory cost.

---

### 4. How would you solve Minimum Path Sum if movement was allowed in 4 directions instead of 2?
**Question:** If movement in the grid was permitted in all 4 orthogonal directions (Up, Down, Left, Right) with arbitrary positive weights, why does Dynamic Programming fail and what algorithm must be used?

**Answer:**
1. **Why DP Fails**: Dynamic Programming requires a Directed Acyclic Graph (DAG) structure with a clear topological ordering of subproblems. When movement is allowed in all 4 directions, cycles can form (e.g., $(r, c) \to (r, c + 1) \to (r + 1, c + 1) \to (r + 1, c) \to (r, c)$). State $A$ would depend on state $B$, which depends on state $C$, which depends on state $A$, creating circular dependencies that break DP recurrence relations.
2. **Algorithm Required**: This becomes a classic shortest path problem on a weighted directed graph. We must use **Dijkstra's Algorithm** with a Min-Priority Queue, which explores paths in order of cumulative weight in $O(V \log V) = O((M \cdot N) \log(M \cdot N))$ time.

---

<nav aria-label="Lecture navigation">
  <a href="day-48-1d-dp-longest-increasing-subsequence.md">◀ Day 48: 1D DP: Longest Increasing Subsequence</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-50-2d-dp-longest-common-subsequence-knapsack.md">Day 50: 2D DP: Longest Common Subsequence and Knapsack ▶</a>
</nav>
