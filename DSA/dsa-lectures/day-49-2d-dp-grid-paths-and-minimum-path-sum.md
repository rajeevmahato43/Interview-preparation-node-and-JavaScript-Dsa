# Day 49: 2D Dynamic Programming: Grid Paths and Minimum Path Sum

## 1. Learning Outcomes
- Master the **2D Grid Dynamic Programming Pattern** where transitions depend on adjacent matrix cells.
- Solve **Unique Paths I** and optimize space from $O(M \times N)$ to $O(N)$ 1D rolling array.
- Handle obstacle boundaries and edge blocking in **Unique Paths II**.
- Implement **Minimum Path Sum** using bottom-up cost minimization.
- Model multi-hop gateway routing, CDN latency optimization, and delivery network cost tables in Node.js.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 25 (Grid Backtracking), Day 46 (Dynamic Programming Fundamentals).
- **Navigation**:
  - [Previous: Day 48 - 1D DP: Longest Increasing Subsequence](day-48-1d-dp-longest-increasing-subsequence.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 50 - 2D DP: Longest Common Subsequence & Knapsack](day-50-2d-dp-longest-common-subsequence-knapsack.md)

---

## 3. Core Concepts & Mental Models
When navigating a grid from top-left $(0, 0)$ to bottom-right $(M-1, N-1)$ moving only **Right** and **Down**:
- Any cell $(r, c)$ can only be entered from the cell above $(r-1, c)$ or the cell to the left $(r, c-1)$.

```text
2D Grid DP Transitions:
      (r-1, c) [From Above]
          |
          v
(r, c-1) ---> [ (r, c) ]
[From Left]

1. Total Ways (Unique Paths):
   dp[r][c] = dp[r - 1][c] + dp[r][c - 1]

2. Minimum Cost (Minimum Path Sum):
   dp[r][c] = grid[r][c] + Math.min(dp[r - 1][c], dp[r][c - 1])
```

### 1D Space Optimization Mental Model
Notice that computing row $r$ only requires the previous row $r - 1$ and the current row's left neighbor.
By maintaining a single 1D array `dp` of size $N$:
```javascript
// dp[c] before update represents cell directly above (r-1, c)
// dp[c - 1] represents cell to the left (r, c-1)
dp[c] = dp[c] + dp[c - 1];
```
This reduces memory from $O(M \times N)$ down to $O(N)$!

---

## 4. Detailed Technical Explanations

### 4.1 Boundary Conditions (First Row and First Column)
- For the first row $(r = 0)$, there is no cell above; you can only arrive from the left.
- For the first column $(c = 0)$, there is no cell to the left; you can only arrive from above.
- In **Unique Paths II**, if an obstacle occurs at `grid[0][c]`, all subsequent cells in that first row become permanently unreachable (`0` paths).

### 4.2 Minimum Path Sum Recurrence
- Base: `dp[0][0] = grid[0][0]`.
- First row: `dp[0][c] = dp[0][c - 1] + grid[0][c]`.
- First col: `dp[r][0] = dp[r - 1][0] + grid[r][0]`.
- Internal cells: `dp[r][c] = grid[r][c] + Math.min(dp[r - 1][c], dp[r][c - 1])`.

### 4.3 Node.js Relevance: Spatial Routing & CDN Transit Costs
In distributed Node.js gateway routers, traffic flows through layered proxy hops or transit networks. Matrix DP calculates the lowest-latency path through multiple geographic edge nodes or computes optimal data transport routes across bandwidth billing tiers.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 Unique Paths (LeetCode 62) - O(N) Space
```javascript
/**
 * Computes unique paths from (0,0) to (m-1, n-1) with 1D space.
 * Time Complexity: O(m * n)
 * Space Complexity: O(n)
 */
function uniquePaths(m, n) {
  // Initialize first row with 1 (only 1 way to travel right along top row)
  const dp = new Uint32Array(n).fill(1);

  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) {
      // dp[c] is from above (r - 1), dp[c - 1] is from left (r)
      dp[c] += dp[c - 1];
    }
  }

  return dp[n - 1];
}
```

### 5.2 Unique Paths II with Obstacles (LeetCode 63)
```javascript
/**
 * Unique paths with obstacles (1 = obstacle, 0 = open path).
 * Time Complexity: O(m * n)
 * Space Complexity: O(n)
 */
function uniquePathsWithObstacles(obstacleGrid) {
  const m = obstacleGrid.length;
  const n = obstacleGrid[0].length;

  // If starting or ending cell is blocked, 0 paths possible
  if (obstacleGrid[0][0] === 1 || obstacleGrid[m - 1][n - 1] === 1) {
    return 0;
  }

  const dp = new Uint32Array(n);
  dp[0] = 1; // Start position

  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (obstacleGrid[r][c] === 1) {
        dp[c] = 0; // Blocked: zero paths pass through an obstacle
      } else if (c > 0) {
        dp[c] += dp[c - 1];
      }
    }
  }

  return dp[n - 1];
}
```

### 5.3 Minimum Path Sum (LeetCode 64) - O(N) Space
```javascript
/**
 * Finds path from top left to bottom right minimizing sum of numbers.
 * Time Complexity: O(m * n)
 * Space Complexity: O(n)
 */
function minPathSum(grid) {
  const m = grid.length;
  const n = grid[0].length;
  const dp = new Array(n);

  dp[0] = grid[0][0];

  // Initialize first row
  for (let c = 1; c < n; c++) {
    dp[c] = dp[c - 1] + grid[0][c];
  }

  for (let r = 1; r < m; r++) {
    dp[0] += grid[r][0]; // First cell of current row can only come from above

    for (let c = 1; c < n; c++) {
      // Minimum between above (dp[c]) and left (dp[c - 1]) + current cell cost
      dp[c] = grid[r][c] + Math.min(dp[c], dp[c - 1]);
    }
  }

  return dp[n - 1];
}
```

### 5.4 Execution Trace: `uniquePaths(3, 3)`
```text
Initial dp (Row 0): [1, 1, 1]

Row 1:
  c = 1: dp[1] = dp[1] (1) + dp[0] (1) = 2.  dp = [1, 2, 1]
  c = 2: dp[2] = dp[2] (1) + dp[1] (2) = 3.  dp = [1, 2, 3]

Row 2:
  c = 1: dp[1] = dp[1] (2) + dp[0] (1) = 3.  dp = [1, 3, 3]
  c = 2: dp[2] = dp[2] (3) + dp[1] (3) = 6.  dp = [1, 3, 6]

Final Result: dp[2] = 6 unique paths!
```

---

## 6. Common Mistakes & Anti-Patterns
- **Allocating Full $M \times N$ Matrices Unnecessarily**: Allocating a $1000 \times 1000$ matrix creates 1,000,000 array objects in V8 heap memory. A 1D array of size 1000 uses only 4KB RAM.
- **Forgetting Obstacle at Start or End**: If `obstacleGrid[0][0] === 1`, the robot cannot even begin moving; return 0 immediately.
- **Off-By-One in First Column Accumulation**: When using 1D space optimization in `minPathSum`, forgetting to update `dp[0] += grid[r][0]` at the start of each row leaves `dp[0]` with the obsolete previous row's cost.

---

## 7. Tricky Points & Edge Cases
- **Single Row or Single Column Grids**: If $M = 1$ or $N = 1$, only 1 path exists (unless an obstacle blocks it).
- **Combinatorics Shortcut for Unique Paths I**: The total steps is $(M - 1) + (N - 1)$. Total paths is mathematically $\binom{M + N - 2}{M - 1}$. However, DP is preferred in interviews to prevent 64-bit integer overflow during factorial multiplications.
- **In-Place Grid Mutation**: If allowed, `grid[r][c]` can be updated in-place as the DP table itself ($O(1)$ space), but this destroys input data.

---

## 8. Practical Engineering Exercises
1. Implement `minPathSum` mutating the grid in-place in $O(1)$ auxiliary space.
2. Implement **Triangle** (LeetCode 120) finding the minimum path sum from top to bottom of a triangular array using bottom-up DP.

---

## 9. Key Takeaways & Summary
- Grid DP transitions combine values from the cell above $(r-1, c)$ and the cell to the left $(r, c-1)$.
- Memory can always be compressed from $O(M \times N)$ to $O(N)$ using a 1D rolling array.
- Obstacles set the state to 0, representing 0 possible path combinations.
- Minimum Path Sum replaces summation with `Math.min(above, left) + cost`.

---

## 10. Quick Reference Cheat Sheet
| Problem | Recurrence | 1D Rolling State | Time | Space |
| :--- | :--- | :--- | :--- | :--- |
| **Unique Paths** | $dp[r][c] = dp[r-1][c] + dp[r][c-1]$ | `dp[c] += dp[c-1]` | $O(M \cdot N)$ | $O(N)$ |
| **Unique Paths II** | If obstacle: $0$; else sum above+left | If obs: `dp[c] = 0`; else `+= dp[c-1]` | $O(M \cdot N)$ | $O(N)$ |
| **Min Path Sum** | $cost + \min(above, left)$ | `dp[c] = grid[r][c] + min(dp[c], dp[c-1])` | $O(M \cdot N)$ | $O(N)$ |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: Explain how the 2D DP matrix for Unique Paths can be compressed into a single 1D array of size $N$.  
**Hint**: Examine the exact lifetime of previous row entries during row iteration.  
**Expected Answer Shape**: When computing `dp[r][c]`, we only need the value directly above it (`dp[r - 1][c]`) and the value to its left in the current row (`dp[r][c - 1]`). In a 1D array of size $N$, before updating index $c$, `dp[c]` holds the value from row $r - 1$. Meanwhile, `dp[c - 1]` has already been updated for row $r$. Thus, `dp[c] = dp[c] + dp[c - 1]` cleanly combines both values in-place without needing any older rows, reducing space from $O(M \times N)$ to $O(N)$.

### 2. Code-Writing
**Question**: Solve **Triangle** (LeetCode 120) where you move from the top of a triangle to adjacent numbers in the row below, finding the minimum path sum.  
**Hint**: Work bottom-up from the base of the triangle to the top.  
**Expected Answer Shape**: Initialize `dp` with the last row of the triangle. Loop backwards from row $M - 2$ up to 0. For each column $c$, update `dp[c] = triangle[r][c] + Math.min(dp[c], dp[c + 1])`. At the end, `dp[0]` holds the minimum path sum. This achieves $O(N^2)$ time and $O(N)$ space.

### 3. Debugging
**Question**: Identify why this Unique Paths II code returns incorrect results when an obstacle is present:  
```javascript
function uniquePathsWithObstacles(grid) {
  const m = grid.length, n = grid[0].length;
  const dp = new Array(n).fill(1);
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] === 1) dp[c] = 0;
      else if (c > 0) dp[c] += dp[c - 1];
    }
  }
  return dp[n - 1];
}
```  
**Hint**: How is the first row handled when initialized with `fill(1)`?  
**Expected Answer Shape**: `dp` is initialized with all 1s. If an obstacle is in the first row at column 1, `dp[1]` is set to 0, but `dp[2]` remains 1 from initialization! In reality, any cell after an obstacle in row 0 must be 0. Furthermore, `dp[0]` can never be set to 0 if an obstacle appears at `grid[r][0]` in later rows. Fix by initializing `dp` with 0s, setting `dp[0] = 1` only if `grid[0][0] === 0`, and updating `dp[0] = 0` whenever `grid[r][0] === 1`.

### 4. System Design / Tradeoff
**Question**: When calculating transit costs in a routing engine in Node.js, when should you use 2D Grid DP versus Dijkstra's Algorithm?  
**Hint**: Directed acyclic moves vs. general cyclic graphs.  
**Expected Answer Shape**: Grid DP is strictly applicable only when movement is acyclic and restricted to forward directions (e.g., strictly Right and Down, forming a DAG) with uniform progression. If movement is permitted in all 4 directions (Up, Down, Left, Right) or arbitrary road networks, cycles are possible and subproblems overlap cyclically, invalidating the DP topological order. In such cyclic weighted networks, Dijkstra's algorithm with a priority queue is required.

### 5. Tricky / Edge Case
**Question**: Why does the mathematical formula $\binom{M + N - 2}{M - 1}$ for Unique Paths risk precision issues in JavaScript for grids like $100 \times 100$?  
**Hint**: IEEE 754 double precision limits.  
**Expected Answer Shape**: For a $100 \times 100$ grid, total steps is 198. The factorial $198!$ exceeds $10^{370}$, far surpassing JavaScript's `Number.MAX_VALUE` ($\approx 1.79 \times 10^{308}$) and overflowing to `Infinity`. While `BigInt` can compute it, tabular DP with addition avoids huge intermediate factorials and runs safely within 32-bit/64-bit integers with modulo arithmetic.

### 6. Real-World Node.js Context
**Question**: How would you optimize memory usage in a Node.js microservice computing a $5000 \times 5000$ cost matrix to prevent garbage collection pauses?  
**Hint**: Array of Arrays vs. flat TypedArray buffer.  
**Expected Answer Shape**: An Array of Arrays for $5000 \times 5000$ creates 5,001 separate V8 heap objects totaling over 200MB, triggering heavy GC mark-and-sweep pauses. Use a single 1D `Float64Array(5000)` rolling buffer (40KB) rather than 2D arrays, or if the full matrix must be preserved, allocate a single flat `Float64Array(5000 * 5000)` indexed via `r * 5000 + c`, which creates exactly 1 contiguous buffer outside the primary GC traversal path.
