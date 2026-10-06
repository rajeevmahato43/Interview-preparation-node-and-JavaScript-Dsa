# Day 25: Grid Backtracking: Word Search, Maze Paths, and N-Queens

<nav aria-label="Lecture navigation">

[Previous: Combinations and Permutations](day-24-combinations-and-permutations.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search Bounds and Intervals](day-26-binary-search-bounds-and-intervals.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Master **2D Grid Backtracking** using coordinate offsets and strict boundary condition guards.
- Apply **In-Place Visited Marking** (`board[r][c] = '#'`) with state restoration to achieve $O(1)$ auxiliary memory beyond call stack depth.
- Solve **Word Search** (LeetCode 79) in $O(m \cdot n \cdot 4^L)$ time and implement prefix frequency pruning to defeat pathological test cases.
- Derive the mathematical collision equations for **N-Queens** ($r + c$ and $r - c$) to test diagonal threats in $O(1)$ time.
- Implement **Rat in a Maze** returning lexicographically ordered movement paths.
- Architect CPU-intensive 2D spatial search algorithms in Node.js using `worker_threads` to avoid event loop stalls.

---

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Grid dimensions and exponential state branching.
- [Day 21: Recursion Mechanics and Call Stack](day-21-recursion-mechanics-and-call-stack.md) — Auxiliary stack depth and unwinding.
- [Day 22: Backtracking Core: Decision State, Choices, and Undo](day-22-backtracking-fundamentals.md) — State mutation and rollback.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
| :--- | :--- | :--- |
| **Grid Backtracking** | A depth-first traversal across 2D matrix coordinates exploring adjacent cells and reverting visited marks upon failure. | Standard technique for pathfinding, word searches, and constraint satisfaction over planar grids. |
| **In-Place Marking** | Temporarily overwriting a matrix cell with a sentinel character (`'#'`) during exploration and restoring the original value during unwinding. | Eliminates the $O(m \times n)$ heap allocation of a secondary `visited` boolean matrix. |
| **Cardinal Direction Vectors** | Paired delta arrays (`dr = [-1, 1, 0, 0]`, `dc = [0, 0, -1, 1]`) representing Up, Down, Left, and Right spatial steps. | Encapsulates geometric movement cleanly inside a 4-iteration loop, eliminating duplicate code. |
| **Anti-Diagonal Invariant** | A geometric property of 2D grids where all cells on a forward-slanted diagonal ($\nearrow$) share an identical coordinate sum: $r + c = k$. | Allows testing top-right to bottom-left queen threats in $O(1)$ time. |
| **Main Diagonal Invariant** | A geometric property of 2D grids where all cells on a backward-slanted diagonal ($\searrow$) share an identical coordinate difference: $r - c = k$. | Allows testing top-left to bottom-right queen threats in $O(1)$ time. |

---

## Core Concepts

### 1. The 2D Grid Backtracking Pattern: Vectors and Boundary Guards

A **2D Grid Backtracking** algorithm traverses a matrix of dimensions $m \times n$ by treating each coordinate cell $(r, c)$ as a decision node that can branch into four adjacent orthogonal directions: Up, Down, Left, and Right.

Every step in grid exploration must validate three defensive criteria before committing to deeper descent:
1. **Boundary Guard**: Verify that $(r, c)$ lies within matrix bounds: `r >= 0 && r < m && c >= 0 && c < n`.
2. **Visited Guard**: Verify that the cell has not already been visited along the active search path.
3. **Constraint Guard**: Verify that the cell content satisfies matching rules (e.g., character matches `word[index]`).

```text
Grid Navigation Pipeline:
              (-1, 0) [Up]
                   ▲
                   │
(-1, 0) [Left] ◄─ (r, c) ─► (0, +1) [Right]
                   │
                   ▼
              (+1, 0) [Down]

Direction Offset Vectors:
dr = [ -1, 1,  0, 0 ]   // Row changes: Up, Down, Left, Right
dc = [  0, 0, -1, 1 ]   // Col changes: Up, Down, Left, Right
```

---

### 2. In-Place Visited Marking vs Secondary Matrices

Allocating a separate $m \times n$ boolean matrix `visited[r][c]` creates an $O(m \cdot n)$ memory footprint on every search or requires manual resets between queries.

By leveraging **In-Place Sentinel Marking**:
1. Read and cache the original cell character: `const temp = board[r][c];`
2. Mutate the cell to an impossible sentinel character: `board[r][c] = "#";`
3. Recurse into adjacent coordinates.
4. **Unchoose (Backtrack)**: Revert the cell to its original character during unwinding: `board[r][c] = temp;`

```text
Board Mutation Lifecycle (Looking for "ABCCED"):
Step 1: board[0][0] is 'A' -> Mark as '#' -> Recurse Right
Step 2: board[0][1] is 'B' -> Mark as '#' -> Recurse Right
Step 3: board[0][2] is 'C' -> Mark as '#' -> Recurse Down
... If branch hits a dead end:
Step N: Restore board[0][2] = 'C' -> Restore board[0][1] = 'B' -> Restore board[0][0] = 'A'
```

```javascript
// Node.js code: In-Place Marking vs Visited Matrix

// ❌ WRONG: Forgetting to restore the board cell corrupts subsequent searches
function brokenDfs(board, r, c, word, index) {
  if (index === word.length) return true;
  if (r < 0 || r >= board.length || c < 0 || c >= board[0].length || board[r][c] !== word[index]) {
    return false;
  }
  board[r][c] = "#"; // Marked
  const found = brokenDfs(board, r + 1, c, word, index + 1);
  // BUG: Returns without restoring board[r][c]! Cell remains '#' permanently.
  return found;
}

// ✅ CORRECT: In-place marking with guaranteed state restoration
function safeDfs(board, r, c, word, index) {
  if (index === word.length) return true;
  if (r < 0 || r >= board.length || c < 0 || c >= board[0].length || board[r][c] !== word[index]) {
    return false;
  }

  const temp = board[r][c];
  board[r][c] = "#"; // 1. Choose

  const found =
    safeDfs(board, r + 1, c, word, index + 1) ||
    safeDfs(board, r - 1, c, word, index + 1) ||
    safeDfs(board, r, c + 1, word, index + 1) ||
    safeDfs(board, r, c - 1, word, index + 1); // 2. Explore

  board[r][c] = temp; // 3. Unchoose (Guaranteed Rollback)
  return found;
}
```

---

### 3. Word Search: Frequency Pre-Checks and Word Inversion

In **Word Search** (LeetCode 79), we determine whether a given word exists in an $m \times n$ character grid. A path may not revisit the same cell twice.

#### Pathological Interview Test Case: The "All A's" Trap
Consider a $20 \times 20$ grid filled entirely with the character `'A'`, and the search target is `"AAAAAAAAAAAAAAB"`.
A standard DFS starts at every cell, recursively branching in 4 directions to maximum depth before failing at the final letter `'B'`. This performs $O(m \cdot n \cdot 3^L)$ operations, triggering a Time Limit Exceeded (TLE) timeout.

#### Optimization Heuristics:
1. **Board Capacity Check**: If `word.length > m * n`, return `false` instantly.
2. **Frequency Pre-Check**: Count character frequencies across the board. If the board contains fewer occurrences of any character in `word`, return `false` in $O(m \cdot n)$ time before running any recursion.
3. **Word Inversion Optimization**: Compare the frequency of `word[0]` vs `word[word.length - 1]`. If the last letter is rarer on the board than the first letter, reverse `word` before searching:
   `word = word.split("").reverse().join("")`. The search will fail at depth 1 instead of depth $L$!

```javascript
// Node.js code: Word Search with Frequency Optimization (LeetCode 79)

function exist(board, word) {
  const m = board.length;
  const n = board[0].length;

  if (word.length > m * n) return false;

  // 1. Frequency Pre-Check
  const boardCounts = new Map();
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      boardCounts.set(board[r][c], (boardCounts.get(board[r][c]) || 0) + 1);
    }
  }

  const wordCounts = new Map();
  for (const ch of word) {
    wordCounts.set(ch, (wordCounts.get(ch) || 0) + 1);
  }

  for (const [ch, count] of wordCounts.entries()) {
    if ((boardCounts.get(ch) || 0) < count) {
      return false; // Prune immediately: Board lacks required characters
    }
  }

  // 2. Word Inversion Heuristic: Start from the rarer end character
  if ((boardCounts.get(word[0]) || 0) > (boardCounts.get(word[word.length - 1]) || 0)) {
    word = word.split("").reverse().join("");
  }

  function dfs(r, c, index) {
    if (index === word.length) return true;
    if (r < 0 || r >= m || c < 0 || c >= n || board[r][c] !== word[index]) {
      return false;
    }

    const temp = board[r][c];
    board[r][c] = "#"; // Mark visited

    const found =
      dfs(r + 1, c, index + 1) ||
      dfs(r - 1, c, index + 1) ||
      dfs(r, c + 1, index + 1) ||
      dfs(r, c - 1, index + 1);

    board[r][c] = temp; // Backtrack
    return found;
  }

  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (board[r][c] === word[0] && dfs(r, c, 0)) {
        return true;
      }
    }
  }

  return false;
}
```

---

### 4. N-Queens: Diagonal Collision Mathematics

The **N-Queens** problem requires placing $n$ non-attacking queens on an $n \times n$ chessboard such that no two queens share the same row, column, or diagonal.

Because we place exactly one queen per row and advance row-by-row (`r + 1`), **row conflicts are physically impossible by structure**. We only need to check columns and diagonals.

```text
4x4 Board Coordinate Geometry:
    c=0   c=1   c=2   c=3
r=0  .     Q     .     .     Placed at (0, 1):
r=1  .     .     .     Q     - Column: c = 1
r=2  Q     .     .     .     - Anti-Diagonal (r + c): 0 + 1 = 1  (Constant along ↗)
r=3  .     .     Q     .     - Main Diagonal (r - c): 0 - 1 = -1 (Constant along ↘)
```

#### The Diagonal Invariant Proof
- **Anti-Diagonal ($\nearrow$)**: Moving one step down-left adds $1$ to row and subtracts $1$ from col: $(r + 1) + (c - 1) = r + c$. The sum $r + c$ remains constant for all cells on that anti-diagonal line.
- **Main Diagonal ($\searrow$)**: Moving one step down-right adds $1$ to row and adds $1$ to col: $(r + 1) - (c + 1) = r - c$. The difference $r - c$ remains constant for all cells on that main diagonal line.

By maintaining three hash sets (`cols`, `posDiags`, `negDiags`), we can evaluate whether any coordinate $(r, c)$ is threatened in **strict $O(1)$ constant time**:

```javascript
// Node.js code: N-Queens (LeetCode 51)

function solveNQueens(n) {
  const result = [];
  const cols = new Set();
  const posDiags = new Set(); // r + c
  const negDiags = new Set(); // r - c

  // Initialize board representation
  const board = Array.from({ length: n }, () => new Array(n).fill("."));

  function backtrack(r) {
    if (r === n) {
      result.push(board.map(row => row.join("")));
      return;
    }

    for (let c = 0; c < n; c++) {
      // O(1) conflict detection
      if (cols.has(c) || posDiags.has(r + c) || negDiags.has(r - c)) {
        continue; // Under attack!
      }

      // 1. Choose
      cols.add(c);
      posDiags.add(r + c);
      negDiags.add(r - c);
      board[r][c] = "Q";

      // 2. Explore: Advance to next row
      backtrack(r + 1);

      // 3. Unchoose (Rollback all sets and board state)
      cols.delete(c);
      posDiags.delete(r + c);
      negDiags.delete(r - c);
      board[r][c] = ".";
    }
  }

  backtrack(0);
  return result;
}

console.log(solveNQueens(4));
// Returns 2 distinct solutions for 4-Queens
```

---

## Detailed Node.js Relevance: Spatial Pathfinding & Worker Threads

In production backend logistics (e.g., warehouse robotics grid routing, autonomous vehicle fleet dispatchers), constraint-based 2D grid pathfinding algorithms run frequently under strict SLAs.

```text
Client Route Request -> Express Server -> Synchronous 2D Backtracking (100x100 Grid)
                                        |
                                        V
                      [ Event Loop Blocked for 800ms! ]
                                        |
                      Health Check Timeout -> Pod Restart!
```

To prevent event loop degradation:
1. **Offload to Worker Threads**: Delegate CPU-intensive grid calculations to `worker_threads` so the Node.js event loop remains responsive to incoming HTTP queries.
2. **Pathfinding Algorithm Selection**: For unconstrained shortest-path problems on weighted/unweighted grids, use **BFS** or **A\*** instead of backtracking. Use backtracking specifically when paths must visit specific combinations of intermediate constraint tokens.

---

## Tricky Points & Edge Cases

1. **Forgetting to Restore Cells on Failed Paths**:
   If an exploration returns `false` without executing `board[r][c] = temp`, that cell remains `#` permanently, causing subsequent searches starting from other cells to fail erroneously.
2. **Redundant Row Tracking in N-Queens**:
   Allocating a `rows` set in N-Queens is redundant because the recursion advances `r + 1` monotonically, guaranteeing at most one queen per row by design.
3. **Array Matrix Sizing**:
   Always verify $m > 0$ and $n > 0$ before accessing `board[0].length`. An empty grid `[]` causes `TypeError: Cannot read properties of undefined`.

---

## Hands-On Exercise

### Scenario: Rat in a Maze with Lexicographical Path Strings

In an automated warehouse simulation, a robot at top-left $(0, 0)$ must navigate an $N \times N$ binary grid to reach destination $(N - 1, N - 1)$. Open cells are marked `1`; blocked obstacles are marked `0`. The robot can move in four directions: Down (`'D'`), Left (`'L'`), Right (`'R'`), and Up (`'U'`). Return all valid paths sorted in lexicographical order.

### Buggy Code

```javascript
// ❌ BUGGY: Fails to restore visited cells and explores in non-lexicographical order
function ratInMazeBuggy(grid) {
  const result = [];
  const n = grid.length;

  function dfs(r, c, path) {
    if (r === n - 1 && c === n - 1) {
      result.push(path);
      return;
    }

    grid[r][c] = 0; // Mark visited

    // BUG 1: Order is U, D, L, R instead of D, L, R, U (violates lexicographical sort!)
    // BUG 2: Boundary check is performed AFTER mutating the cell!
    // BUG 3: Forgets to restore grid[r][c] = 1 upon return!
    if (r - 1 >= 0 && grid[r - 1][c] === 1) dfs(r - 1, c, path + "U");
    if (r + 1 < n && grid[r + 1][c] === 1) dfs(r + 1, c, path + "D");
    if (c - 1 >= 0 && grid[r][c - 1] === 1) dfs(r, c - 1, path + "L");
    if (c + 1 < n && grid[r][c + 1] === 1) dfs(r, c + 1, path + "R");
  }

  if (grid[0][0] === 1) dfs(0, 0, "");
  return result;
}
```

### Acceptance Criteria

1. Navigates from $(0, 0)$ to $(N - 1, N - 1)$ through cells with value `1`.
2. Explores directions in alphabetical order: **`'D'` (Down), `'L'` (Left), `'R'` (Right), `'U'` (Up)** to produce lexicographically sorted paths naturally.
3. Performs in-place marking and guarantees state restoration.
4. Tested with Node.js assertions verifying blocked starts, open grids, and multi-path mazes.

### Solution Code

```javascript
// Node.js code: Robust Lexicographical Rat in a Maze
const assert = require("assert");

function findMazePaths(grid) {
  const n = grid.length;
  const result = [];

  // Edge case: Start or end cell is blocked
  if (grid[0][0] === 0 || grid[n - 1][n - 1] === 0) {
    return result;
  }

  // Directions in strict lexicographical order: D -> L -> R -> U
  const directions = [
    { dir: "D", dr: 1, dc: 0 },
    { dir: "L", dr: 0, dc: -1 },
    { dir: "R", dr: 0, dc: 1 },
    { dir: "U", dr: -1, dc: 0 }
  ];

  function backtrack(r, c, currentPath) {
    // Base Case: Reached destination
    if (r === n - 1 && c === n - 1) {
      result.push(currentPath);
      return;
    }

    // 1. Choose (Mark current cell visited)
    grid[r][c] = 0;

    // 2. Explore: Iterate directions in lexicographical order
    for (const { dir, dr, dc } of directions) {
      const nextR = r + dr;
      const nextC = c + dc;

      // Defensive boundary and open-cell check
      if (nextR >= 0 && nextR < n && nextC >= 0 && nextC < n && grid[nextR][nextC] === 1) {
        backtrack(nextR, nextC, currentPath + dir);
      }
    }

    // 3. Unchoose (Restore cell state for alternative paths)
    grid[r][c] = 1;
  }

  backtrack(0, 0, "");
  return result;
}

// Verification Tests
const maze = [
  [1, 0, 0, 0],
  [1, 1, 0, 1],
  [1, 1, 0, 0],
  [0, 1, 1, 1]
];

const paths = findMazePaths(maze);
assert.deepStrictEqual(paths, ["DDRDRR", "DRDDRR"]);

// Edge case: Blocked start
const blockedMaze = [
  [0, 1],
  [1, 1]
];
assert.deepStrictEqual(findMazePaths(blockedMaze), []);

console.log("✅ All Rat in a Maze assertions passed successfully.");
```

### Solution Explanation

1. **Direction Ordering**: Iterating through `[{dir: "D"}, {dir: "L"}, {dir: "R"}, {dir: "U"}]` naturally orders the recursion tree so that generated path strings are lexicographically sorted without requiring post-processing sorting.
2. **In-Place Cell Toggling**: Marking `grid[r][c] = 0` prevents infinite cyclic loops between adjacent open cells, and resetting `grid[r][c] = 1` preserves grid structure for alternative routes.

---

## Summary

- **2D Grid Navigation**: Explore 4 directions using coordinate offsets `dr` and `dc`, enforcing boundary checks before accessing array indices.
- **In-Place Marking**: Avoid $O(m \times n)$ auxiliary matrices by temporarily mutating `board[r][c] = '#'` and restoring it during unwinding.
- **Frequency Pruning in Word Search**: Prevent pathological timeouts on uniform grids by pre-checking character frequency maps and searching from the rarer end character.
- **N-Queens Diagonal Invariants**: Anti-diagonals share constant $r + c$; Main diagonals share constant $r - c$. Check attacks in $O(1)$ time with sets.
- **Node.js Concurrency**: Offload combinatorial grid searches to `worker_threads` to keep the main event loop responsive.

---

## Cheat Sheet & Common Pitfalls

### Grid Backtracking Template
```javascript
function dfs(r, c, index) {
  if (index === word.length) return true;
  if (r < 0 || r >= m || c < 0 || c >= n || board[r][c] !== word[index]) return false;

  const temp = board[r][c];
  board[r][c] = "#"; // 1. Choose

  const found = dfs(r+1,c,index+1) || dfs(r-1,c,index+1) || dfs(r,c+1,index+1) || dfs(r,c-1,index+1); // 2. Explore

  board[r][c] = temp; // 3. Unchoose (Rollback)
  return found;
}
```

### Common Pitfalls

| Mistake | Consequence | Correct Pattern |
| :--- | :--- | :--- |
| **Omitting state restoration** | Board permanently corrupted for future branches. | Cache `temp` and restore `board[r][c] = temp`. |
| **Allocating `visited` matrix** | High memory allocation and GC latency in V8. | Overwrite the cell with a sentinel in-place. |
| **Re-checking row in N-Queens** | Redundant work; rows are unique by design. | Track only `cols`, `posDiags`, and `negDiags`. |
| **Running DFS without frequency check** | TLE on pathological uniform grids. | Check character frequency counts before recursing. |

---

## Interview Questions

### 1. In N-Queens, why does $r + c$ identify one diagonal while $r - c$ identifies the perpendicular diagonal?

**Question:** Mathematically explain why coordinate sums ($r + c$) and coordinate differences ($r - c$) uniquely identify the two orthogonal diagonals on a 2D chessboard.

**Answer:** 
On a 2D Cartesian or matrix grid:
1. **Anti-Diagonal ($\nearrow$, bottom-left to top-right)**:
   Moving one step along this diagonal moves down one row ($+1$) and left one column ($-1$).
   $$(r + 1) + (c - 1) = r + c$$
   The sum of the coordinates remains invariant for every cell along that diagonal line. On an $n \times n$ board, $r + c$ ranges from $0$ to $2n - 2$.
2. **Main Diagonal ($\searrow$, top-left to bottom-right)**:
   Moving one step along this diagonal moves down one row ($+1$) and right one column ($+1$).
   $$(r + 1) - (c + 1) = r - c$$
   The difference between row and column remains invariant for every cell along that diagonal line. On an $n \times n$ board, $r - c$ ranges from $-(n - 1)$ to $n - 1$.

Storing these constant scalar keys in two hash sets allows checking whether an existing queen threatens candidate coordinate $(r, c)$ in $O(1)$ constant time.

---

### 2. How many distinct solutions exist for $N = 4$ in the N-Queens problem, and what are they?

**Question:** State the total number of solutions for the 4-Queens problem and write out the board configurations.

**Answer:** 
There are exactly **2 distinct solutions** for $N = 4$:

**Solution 1:**
```text
. Q . .   (r=0, c=1)
. . . Q   (r=1, c=3)
Q . . .   (r=2, c=0)
. . Q .   (r=3, c=2)
```

**Solution 2:**
```text
. . Q .   (r=0, c=2)
Q . . .   (r=1, c=0)
. . . Q   (r=2, c=3)
. Q . .   (r=3, c=1)
```

Both configurations place 4 queens such that no two queens share the same column, positive diagonal, or negative diagonal.

---

### 3. How do you optimize Word Search against pathological test cases where the board contains hundreds of identical letters?

**Question:** A standard Word Search solution encounters Time Limit Exceeded when searching for `"AAAAAAAAB"` on a $20 \times 20$ board containing only `'A'`s. How do you optimize the algorithm to pass in minimal time?

**Answer:** 
The slowdown occurs because DFS starts from all 400 `'A'`s and branches in 4 directions to maximum depth before failing at the missing `'B'`, resulting in exponential wasted work.

**Two Key Optimizations:**
1. **Character Frequency Pruning**: Build frequency tables of the board and word. If the board contains fewer instances of any character than the word requires, return `false` immediately in $O(m \cdot n)$ time without executing any DFS.
2. **Word Reversal Heuristic**: Compare the frequency of `word[0]` with `word[word.length - 1]`. If the last character is less frequent on the board than the first character, reverse the target word before initiating search:
   ```javascript
   if (boardCounts.get(word[0]) > boardCounts.get(word[word.length - 1])) {
     word = word.split("").reverse().join("");
   }
   ```
   When reversed, the search begins looking for `'B'`. Because `'B'` does not exist or is extremely rare, the search terminates at depth 1 across all cells, reducing runtime from seconds to under a millisecond.

---

### 4. Why is Depth-First Search (Backtracking) preferred over Breadth-First Search (BFS) for Word Search?

**Question:** In 2D grid path problems, why is Breadth-First Search preferred for finding the shortest path, but Backtracking (DFS) preferred for Word Search?

**Answer:** 
The distinction depends on whether path state can be shared or must be independently copied:
1. **Breadth-First Search (BFS)**:
   BFS explores all paths level-by-level. In Word Search, a path cannot revisit any previously visited cell. To maintain this constraint in BFS, every queue element must store its own isolated copy of the visited coordinates. At depth $L$, the queue holds up to $4^L$ exploration states, consuming $O(m \cdot n \cdot 4^L)$ memory, quickly causing Out-Of-Memory heap crashes in Node.js.
2. **Depth-First Search (Backtracking)**:
   DFS explores one path at a time to maximum depth. Because only one active path exists at any instant, all branches share a **single 2D matrix in memory**. Visited cells are marked in-place with $O(1)$ operations and immediately restored upon return. Auxiliary memory is strictly bounded to the recursion call stack depth $O(L)$, resulting in minimal memory overhead.

---

<nav aria-label="Lecture navigation">

[Previous: Combinations and Permutations](day-24-combinations-and-permutations.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search Bounds and Intervals](day-26-binary-search-bounds-and-intervals.md)

</nav>
