# Day 22: Grid Backtracking & N-Queens

<nav aria-label="Lecture navigation">

[Previous: Subsets, Permutations & Combinations](day-21-subsets-permutations-and-combinations.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Trees: DFS & Properties](day-23-binary-trees-dfs-and-properties.md)

</nav>

---

## 1. Grid Backtracking & Spatial Constraints

Before this, we made choices along a single flat line of numbers. In **Grid Backtracking**, we move across a 2D grid like a chess board or a map ($M \times N$). At each step, we can move in 4 directions: Up, Down, Left, or Right. We must stay inside the grid walls and never walk in circles.

In puzzle problems like N-Queens or Sudoku, we also follow strict board rules: no two pieces can sit on the same row, column, or diagonal line.

Physical visual analogies:
1. **Stepping Stones in a Pond (Word Search):** You must spell out a secret word by walking on labeled stones across a pond. When you step on a stone, your weight pushes it under the water (Choose: `board[r][c] = '#'`). That way, you cannot step on it twice for the same word. You can only step to neighbor stones (Up, Down, Left, Right). If you hit a stone that has the wrong letter, you pull your foot back, and the stone floats back up to the top of the water (Unchoose: `board[r][c] = originalChar`). Now other paths can use that stone!
2. **Laser Beams on a Chessboard (N-Queens):** A queen in chess attacks across its row, column, and diagonals. Instead of looking across all 8 directions every time you place a queen, imagine shining three laser beams from each queen: one down the column, one along the main diagonal (\), and one along the reverse diagonal (/). If any laser beam is already shining on a square, you know right away that the square is not safe!

```javascript
// Baseline demonstration of 4-directional grid movement with in-place rollback
function countReachableCells(grid, startR, startC) {
  const rows = grid.length;
  const cols = grid[0].length;
  let count = 0;

  function dfs(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== 0) {
      return;
    }

    // 1. CHOOSE: Temporarily mark cell as visited
    grid[r][c] = 2;
    count++;

    // 2. EXPLORE 4 orthogonal directions
    dfs(r - 1, c); // UP
    dfs(r + 1, c); // DOWN
    dfs(r, c - 1); // LEFT
    dfs(r, c + 1); // RIGHT

    // 3. UNCHOOSE: Rollback state (if pathfinding requires backtrack)
    grid[r][c] = 0;
  }

  dfs(startR, startC);
  return count;
}

const sampleGrid = [
  [0, 0, 1],
  [1, 0, 0],
  [0, 0, 0]
];
console.log("Reachable cells from (0,0):", countReachableCells(sampleGrid, 0, 0));
// Output: 7
```

### 1.1 In-Place Grid Masking

In an $M \times N$ grid, making a whole new 2D `visited` array wastes memory and slows down Node.js. 

Instead, change the grid directly in-place:
1. Save the current letter: `const temp = board[r][c];`
2. Mark it as visited using a special character like `'#'`: `board[r][c] = '#';` (Choose)
3. Step to the 4 neighbor cells recursively (Explore)
4. Put the original letter back: `board[r][c] = temp;` (Unchoose / Rollback)

```text
Walking across cells:
Initial:   [ 'A', 'B' ]
Step 1:    [ '#', 'B' ]   (Visiting 'A', exploring neighbors)
Step 2:    [ '#', '#' ]   (Visiting 'B')
Backtrack: [ '#', 'B' ]   (Restoring 'B')
Finish:    [ 'A', 'B' ]   (Restoring 'A' - Board restored to pristine state)
```

> [!NOTE]
> Self-Check: Why is changing the grid in-place faster than keeping a `visited` Set of string keys `"r,c"`?
> Answer: Making strings like `"r,c"` inside a deep recursive loop creates thousands of tiny objects in memory. Changing the grid directly uses zero extra heap memory.

### 1.2 Diagonal Mathematical Invariants

On an $N \times N$ board, you can check whether a queen attacks cell `(r, c)` on a diagonal in fast $O(1)$ time with simple math:

```text
=============================================================================
                       DIAGONAL MATHEMATICAL FORMULAS
=============================================================================
1. MAIN DIAGONAL (\) - Top-Left to Bottom-Right:
   (row - col) is invariant across the entire diagonal line!
   (0, 0) -> 0 - 0 =  0
   (1, 1) -> 1 - 1 =  0
   (2, 2) -> 2 - 2 =  0
   (1, 3) -> 1 - 3 = -2
   Formula: diag1 = row - col

2. ANTI-DIAGONAL (/) - Top-Right to Bottom-Left:
   (row + col) is invariant across the entire diagonal line!
   (0, 2) -> 0 + 2 =  2
   (1, 1) -> 1 + 1 =  2
   (2, 0) -> 2 + 0 =  2
   Formula: diag2 = row + col
=============================================================================
```

By storing active `row - col` and `row + col` values inside two small sets (`mainDiags`, `antiDiags`), safety checks take instant $O(1)$ time.

### 1.3 Operations Reference Table

| Technique | State Representation | Collision Check | Rollback Action | Memory Footprint |
| :--- | :--- | :--- | :--- | :--- |
| **In-Place Grid Masking** | Sentinel character (`'#'`) | `board[r][c] === '#'` | `board[r][c] = origChar` | $O(1)$ heap, $O(L)$ stack |
| **N-Queens Set Tracking** | `cols`, `mainDiags`, `antiDiags` | `set.has(val)` | `set.delete(val)` | $O(N)$ auxiliary |
| **N-Queens Bitmasking** | 3 integer bitmasks | `fullMask & ~(c \| d1 \| d2)` | Shift and clear bit | $O(1)$ auxiliary |
| **Direction Vectors** | `[[-1,0],[1,0],[0,-1],[0,1]]` | Boundary check `0 <= r < M` | Loop iteration advance | $O(1)$ auxiliary |

---

## 2. Spatial Backtracking Patterns

### 2.1 Pattern Family

Grid backtracking patterns fall into three main categories:

- **Orthogonal Path Exploration with Visited Masking:** Traverse 2D grids in 4 cardinal directions (Up, Down, Left, Right) to match strings or find paths. Each cell must be unvisited during that specific path.
- **Row-by-Row Constraint Satisfaction (N-Queens):** Explores choices row by row, placing one piece per row and using mathematical sets to prune conflicts in columns and diagonals in $O(1)$ time.
- **Cell-by-Cell Grid Filling (Sudoku):** Scans for empty cells and attempts values 1 through 9 while checking row, column, and $3 \times 3$ sub-box validity before continuing.

### 2.2 Pattern Recognition Table

| Problem Keyword Signal | Underlying Problem Need | Recommended Approach |
| :--- | :--- | :--- |
| "Word exists along adjacent cells in grid" | Search connected sequence without cell reuse | In-place masking DFS (`board[r][c] = '#'`) |
| "Place $N$ queens such that none attack each other" | Place 1 queen per row, avoid diagonals | Row-by-row DFS with `r - c` and `r + c` sets |
| "Find all paths from start to destination in maze" | Explore all non-cyclic paths | 4-directional DFS with unchoose rollback |
| "Fill 9x9 grid with unique digits per row/col/box" | Incremental cell assignment with constraint checking | Cell-by-cell Sudoku backtracking |
| "Shortest path visiting all non-obstacle cells" | Hamiltonian path across 2D grid | In-place DFS tracking visited count |

### 2.3 When to Use vs When NOT to Use

- **Use Grid Backtracking when:**
  - You must find whether a path exists where cells cannot be reused in the same path.
  - You must generate all valid board configurations satisfying complex non-local rules (N-Queens, Sudoku).
  - Grid size is small ($M \times N \le 100$ for path search, $N \le 12$ for N-Queens).
- **When NOT to use Grid Backtracking:**
  - You only need the **shortest path in an unweighted grid**. Use Breadth-First Search (BFS) in $O(M \cdot N)$ time. Backtracking will cause exponential branch explosion ($O(4^{M \cdot N})$).
  - The problem only asks for **number of unique paths moving only Right and Down**. Use 2D Dynamic Programming in $O(M \cdot N)$ time.

### 2.4 The 10^7 Operations Rule

In a 4-directional grid search, branching factor is at most 3 at each step (since the parent cell is blocked). For a path of length $L$, the maximum search space is $3^L$:
- $L = 10 \implies 3^{10} \approx 59,049$ operations (under 5 milliseconds).
- $L = 15 \implies 3^{15} \approx 14,348,907$ operations (around 30 milliseconds).
- $L = 20 \implies 3^{20} \approx 3,486,784,401$ operations (will lock the thread for multiple seconds).

Pruning must discard non-matching prefixes immediately.

---

## 3. Problem Walkthroughs

### 3.1 Word Search

#### 3.1.1 Problem Statement
Given an $m \times n$ grid of characters `board` and a string `word`, return `true` if `word` exists in the grid. The word can be constructed from letters of sequentially adjacent cells (horizontally or vertically). The same letter cell may not be used more than once in a single word.

- **Input:** `board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]`, `word = "ABCCED"`
- **Output:** `true`
- **Constraints:** $1 \le m, n \le 6$, $1 \le word.length \le 15$.

#### 3.1.2 How to Think About It
Imagine spelling a word across stepping stones in a pond. You scan the pond for the first letter `'A'`. Once found, you stand on it (pushing it underwater so you do not step on it twice). You look around in the four directions for the next letter `'B'`. When found, you step to `'B'`. If you get stuck and no neighbor stone has the next letter, you step back and let the stone float back up.

#### 3.1.3 Brute Force Approach & Bottleneck
The naive approach clones a 2D boolean `visited` matrix on every step:

```javascript
function existNaive(board, word) {
  function dfs(r, c, idx, visited) {
    if (idx === word.length) return true;
    if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) return false;
    if (visited[r][c] || board[r][c] !== word[idx]) return false;

    // Clones entire 2D matrix on every step!
    const nextVisited = visited.map(row => [...row]);
    nextVisited[r][c] = true;

    return dfs(r + 1, c, idx + 1, nextVisited) ||
            dfs(r - 1, c, idx + 1, nextVisited) ||
            dfs(r, c + 1, idx + 1, nextVisited) ||
            dfs(r, c - 1, idx + 1, nextVisited);
  }
  // ...
}
```

The bottleneck is memory churn. Cloning an array of arrays at each of the $4^L$ branch steps creates millions of temporary objects on the V8 heap, triggering heavy garbage collection pauses.

#### 3.1.4 The Pattern Insight
1. **In-Place Board Masking:** Save `board[r][c]`, overwrite with `'#'`, recurse into the 4 neighbors, and restore `board[r][c]` upon return. Auxiliary memory drops to $O(L)$ stack frames with zero heap allocations.
2. **Frequency Pruning & Reverse Search:** If the board contains fewer occurrences of any letter than `word` requires, return `false` immediately. If the word's last letter is rarer on the board than its first letter, reverse `word` before searching to prune top-level branching.

#### 3.1.5 Pseudocode
```text
function exist(board, word):
    check letter frequencies; return false if board lacks required characters
    if frequency(word[0]) > frequency(word[last]):
        word = reverse(word)

    function dfs(r, c, index):
        if index == word.length: return true
        if outOfBounds(r, c) or board[r][c] != word[index]:
            return false

        temp = board[r][c]
        board[r][c] = '#' // mark visited

        found = dfs(r+1, c, index+1) or dfs(r-1, c, index+1) or
                dfs(r, c+1, index+1) or dfs(r, c-1, index+1)

        board[r][c] = temp // unmark rollback
        return found

    for r from 0 to rows - 1:
        for c from 0 to cols - 1:
            if board[r][c] == word[0] and dfs(r, c, 0):
                return true
    return false
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal Word Search with In-Place Masking and Frequency Pruning
function exist(board, word) {
  const rows = board.length;
  const cols = board[0].length;

  // 1. Frequency Pruning: Check if board has enough characters
  const boardCounts = new Map();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = board[r][c];
      boardCounts.set(ch, (boardCounts.get(ch) || 0) + 1);
    }
  }

  const wordCounts = new Map();
  for (const ch of word) {
    wordCounts.set(ch, (wordCounts.get(ch) || 0) + 1);
    if ((boardCounts.get(ch) || 0) < wordCounts.get(ch)) {
      return false; // Board lacks required letter count
    }
  }

  // 2. Direction Optimization: Start from rarer end of word
  let targetWord = word;
  if ((boardCounts.get(word[0]) || 0) > (boardCounts.get(word[word.length - 1]) || 0)) {
    targetWord = word.split('').reverse().join('');
  }

  // 3. In-Place Grid Backtracking
  function dfs(r, c, index) {
    if (index === targetWord.length) return true;

    if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] !== targetWord[index]) {
      return false;
    }

    // CHOOSE: Mask cell in-place
    const originalChar = board[r][c];
    board[r][c] = '#';

    // EXPLORE: Check all 4 directions
    const found =
      dfs(r + 1, c, index + 1) || // DOWN
      dfs(r - 1, c, index + 1) || // UP
      dfs(r, c + 1, index + 1) || // RIGHT
      dfs(r, c - 1, index + 1);   // LEFT

    // UNCHOOSE: Rollback cell to original character
    board[r][c] = originalChar;

    return found;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] === targetWord[0] && dfs(r, c, 0)) {
        return true;
      }
    }
  }

  return false;
}

const testBoard = [
  ['A', 'B', 'C', 'E'],
  ['S', 'F', 'C', 'S'],
  ['A', 'D', 'E', 'E']
];

console.log("Word 'ABCCED' exists:", exist(testBoard, "ABCCED")); // Output: true
console.log("Word 'SEE' exists:", exist(testBoard, "SEE"));       // Output: true
console.log("Word 'ABCB' exists:", exist(testBoard, "ABCB"));     // Output: false
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Forgetting to unchoose on failure
const originalChar = board[r][c];
board[r][c] = '#';
const found = dfs(r + 1, c, index + 1) || dfs(r - 1, c, index + 1);
if (found) {
  board[r][c] = originalChar;
}
return found;
```

If `found` is false, `board[r][c]` remains `'#'` forever. This corrupts the board and prevents other paths from ever using this cell, returning false negatives.

#### 3.1.8 Complexity Derivation
- **Time Complexity:** $O(M \cdot N \cdot 3^L)$, where $M \times N$ is board size and $L$ is word length. At each cell after the first, we explore at most 3 directions because the previous cell is marked `'#'`.
- **Auxiliary Space Complexity:** $O(L)$ for the recursion call stack. Auxiliary heap memory is $O(1)$ due to in-place masking.

---

### 3.2 N-Queens

#### 3.2.1 Problem Statement
The $n$-queens puzzle asks to place $n$ queens on an $n \times n$ chessboard such that no two queens attack each other. Given an integer $n$, return all distinct solutions. Each solution contains a distinct board configuration where `'Q'` and `'.'` indicate a queen and an empty space.

- **Input:** `n = 4`
- **Output:** `[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]`
- **Constraints:** $1 \le n \le 9$.

#### 3.2.2 How to Think About It
On an $n \times n$ board, two queens can never sit on the same row. That means every single row must have exactly one queen. We can go row by row: row 0, row 1, down to row $n - 1$. In each row, we try columns from 0 to $n - 1$. A square is safe only if no queen already sits in that column, main diagonal ($r - c$), or anti-diagonal ($r + c$).

#### 3.2.3 Brute Force Approach & Bottleneck
Placing $n$ queens randomly across $n^2$ positions creates $\binom{n^2}{n}$ configurations. For $n = 8$, this is $\approx 4.4 \times 10^9$ possibilities. Furthermore, scanning the board in 8 directions to verify safety takes $O(n)$ time per cell.

#### 3.2.4 The Pattern Insight
1. **Row-by-Row Placement:** Recurse row-by-row `backtrack(row)`. This guarantees rows never conflict and reduces the search space to $n!$.
2. **$O(1)$ Diagonal Set Lookups:**
   - Column conflict: `cols.has(c)`
   - Main diagonal (\) conflict: `mainDiags.has(row - c)`
   - Anti-diagonal (/) conflict: `antiDiags.has(row + c)`
   Checking and updating safety takes strict $O(1)$ time.

#### 3.2.5 Pseudocode
```text
function solveNQueens(n):
    result = []
    cols = Set(), mainDiags = Set(), antiDiags = Set()
    queens = array of size n (queens[row] = col)

    function backtrack(row):
        if row == n:
            result.push(renderBoard(queens))
            return

        for col from 0 to n - 1:
            d1 = row - col
            d2 = row + col
            if cols.has(col) or mainDiags.has(d1) or antiDiags.has(d2):
                continue // attacked

            cols.add(col); mainDiags.add(d1); antiDiags.add(d2)
            queens[row] = col

            backtrack(row + 1)

            cols.delete(col); mainDiags.delete(d1); antiDiags.delete(d2)

    backtrack(0)
    return result
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal N-Queens with O(1) Mathematical Diagonal Sets
function solveNQueens(n) {
  const result = [];
  const cols = new Set();
  const mainDiags = new Set(); // row - col
  const antiDiags = new Set(); // row + col
  const queens = new Array(n); // queens[row] = col

  function buildBoard() {
    const board = [];
    for (let r = 0; r < n; r++) {
      const rowChars = new Array(n).fill('.');
      rowChars[queens[r]] = 'Q';
      board.push(rowChars.join(''));
    }
    return board;
  }

  function backtrack(row) {
    if (row === n) {
      result.push(buildBoard());
      return;
    }

    for (let col = 0; col < n; col++) {
      const d1 = row - col;
      const d2 = row + col;

      if (cols.has(col) || mainDiags.has(d1) || antiDiags.has(d2)) {
        continue; // Position under attack
      }

      // 1. CHOOSE
      cols.add(col);
      mainDiags.add(d1);
      antiDiags.add(d2);
      queens[row] = col;

      // 2. EXPLORE
      backtrack(row + 1);

      // 3. UNCHOOSE
      cols.delete(col);
      mainDiags.delete(d1);
      antiDiags.delete(d2);
    }
  }

  backtrack(0);
  return result;
}

const solutions = solveNQueens(4);
console.log(`N = 4 has ${solutions.length} solutions:`);
console.log("Solution 1:\n" + solutions[0].join("\n"));
console.log("Solution 2:\n" + solutions[1].join("\n"));
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Iterating over board with nested while loops for diagonal checks
function isSafe(board, row, col, n) {
  // Loops up-left, up-right, up checking for 'Q'
  // Takes O(n) per candidate placement instead of O(1) set lookup
}
```

Performing $O(n)$ ray scans across the board per candidate slows down execution by a factor of 10 compared to $O(1)$ set arithmetic.

#### 3.2.8 Complexity Derivation
- **Time Complexity:** $O(N!)$ upper bound. The first row has $N$ choices, second has at most $N - 2$, third has at most $N - 4$. For $N = 8$, only 2,056 states are evaluated to find all 92 solutions.
- **Auxiliary Space Complexity:** $O(N)$ auxiliary space for `queens`, the three sets, and the call stack.

---

### 3.3 Rat in a Maze

#### 3.3.1 Problem Statement
Consider a rat placed at `(0, 0)` in a square matrix `m` of order $n \times n$. It has to reach destination at `(n - 1, n - 1)`. The path can contain 4 directions: `'D'` (down), `'U'` (up), `'L'` (left), `'R'` (right). In the matrix, `0` represents a blocked cell and `1` represents an open cell. Find all sorted paths the rat can take to reach the destination without visiting any cell more than once in a path.

- **Input:** `m = [[1, 0, 0, 0], [1, 1, 0, 1], [1, 1, 0, 0], [0, 1, 1, 1]]`, `n = 4`
- **Output:** `["DDRDRR", "DRDDRR"]`
- **Constraints:** $2 \le n \le 5$, cells are `0` or `1`.

#### 3.3.2 How to Think About It
The rat starts at the top-left corner `(0, 0)`. From any open square, it can step in 4 directions: Down, Left, Right, or Up. To list the paths in alphabetical order (`'D'`, `'L'`, `'R'`, `'U'`), we try moves in that exact order. When the rat enters a square, it closes the door behind it (`0`) so it does not walk in circles. When backing out, it opens the door (`1`) again.

#### 3.3.3 Brute Force Approach & Bottleneck
Naive path generation without marking visited cells creates infinite ping-pong cycles between adjacent open cells (`D -> U -> D -> U`), crashing with call stack overflow.

#### 3.3.4 The Pattern Insight
Use a single `path` array. When entering `(r, c)`, mark `m[r][c] = 0`. Iterate through the 4 directions in lexicographical order:
- `'D'` $\to (r + 1, c)$
- `'L'` $\to (r, c - 1)$
- `'R'` $\to (r, c + 1)$
- `'U'` $\to (r - 1, c)$
After all 4 directions are explored, restore `m[r][c] = 1`.

#### 3.3.5 Pseudocode
```text
function findPath(m, n):
    if m[0][0] == 0 or m[n-1][n-1] == 0: return []
    result = []
    path = []
    directions = [['D', 1, 0], ['L', 0, -1], ['R', 0, 1], ['U', -1, 0]]

    function dfs(r, c):
        if r == n - 1 and c == n - 1:
            result.push(join(path))
            return

        m[r][c] = 0 // mark visited
        for [dir, dr, dc] in directions:
            nr = r + dr, nc = c + dc
            if 0 <= nr < n and 0 <= nc < n and m[nr][nc] == 1:
                path.push(dir)
                dfs(nr, nc)
                path.pop()
        m[r][c] = 1 // rollback
    dfs(0, 0)
    return result
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal Rat in a Maze with Lexicographical Exploration
function findPath(m, n) {
  // If start or destination is blocked, no path can exist
  if (!m || m.length === 0 || m[0][0] === 0 || m[n - 1][n - 1] === 0) {
    return [];
  }

  const result = [];
  const currentPath = [];

  // Strictly ordered alphabetically: D, L, R, U
  const moves = [
    { dir: 'D', dr: 1, dc: 0 },
    { dir: 'L', dr: 0, dc: -1 },
    { dir: 'R', dr: 0, dc: 1 },
    { dir: 'U', dr: -1, dc: 0 }
  ];

  function dfs(r, c) {
    if (r === n - 1 && c === n - 1) {
      result.push(currentPath.join(''));
      return;
    }

    // CHOOSE: Mark current cell visited
    m[r][c] = 0;

    for (const { dir, dr, dc } of moves) {
      const nr = r + dr;
      const nc = c + dc;

      if (nr >= 0 && nr < n && nc >= 0 && nc < n && m[nr][nc] === 1) {
        currentPath.push(dir); // CHOOSE move
        dfs(nr, nc);           // EXPLORE
        currentPath.pop();     // UNCHOOSE move
      }
    }

    // UNCHOOSE: Restore cell state
    m[r][c] = 1;
  }

  dfs(0, 0);
  return result;
}

const maze = [
  [1, 0, 0, 0],
  [1, 1, 0, 1],
  [1, 1, 0, 0],
  [0, 1, 1, 1]
];
console.log("Paths in maze:", findPath(maze, 4));
// Output: [ 'DDRDRR', 'DRDDRR' ]
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Forgetting start or destination blocked checks
function badFindPath(m, n) {
  // If m[0][0] === 0, the rat starts inside a solid stone wall!
  // It should immediately return [], not attempt to move.
}
```

Failing to validate that `m[0][0] === 1` and `m[n-1][n-1] === 1` upfront will produce incorrect paths when endpoints are blocked.

#### 3.3.8 Complexity Derivation
- **Time Complexity:** $O(4^{n^2})$ worst-case theoretical upper bound. In practice, blocked cells and visited marking keep operations below $O(4^L)$, where $L$ is path length.
- **Auxiliary Space Complexity:** $O(n^2)$ for the call stack and `currentPath` buffer.

---

## 4. Tricky Edge Cases

- **Blocked Start or Goal:** In grid pathfinding, always verify that `board[0][0]` and `board[rows-1][cols-1]` are open before recursing.
- **Negative Diagonal Array Indices:** In JavaScript, `row - col` can be negative. If using an array instead of a `Set`, accessing `arr[row - col]` creates an object string property, slowing down V8 lookups. Always add an offset: `(row - col) + (n - 1)`.
- **Permanent Cell Corruption:** If an unhandled exception occurs before unchoosing, cells marked with `'#'` remain on the grid permanently. Ensure all rollback operations execute unconditionally.
- **Word Search with Insufficient Grid Letters:** Check letter frequencies upfront before initiating DFS to avoid wasting time on impossible searches.

---

## 5. Summary Cheat Sheet

- **In-Place Grid Masking** (`board[r][c] = '#'`) eliminates the need for expensive 2D boolean matrices and avoids heap memory allocations.
- **Diagonal Invariants:** Main diagonals (\) have constant `row - col`; anti-diagonals (/) have constant `row + col`.
- **Always Unchoose Unconditionally:** Restore `board[r][c] = origChar` after exploring all directions.
- **Prefix Pruning:** Verify boundaries and match criteria before making recursive calls.
- **Direction Offsets:** Use a structured array of direction objects to keep movement code concise and maintainable.

---

## 6. Practice Problems

### 6.1 Word Search II

- **Input:** $M \times N$ board and word list `words = ["oath", "pea", "eat", "rain"]`
- **Output:** All words from the list that exist on the board.
- **Constraint:** $1 \le words.length \le 3 \times 10^4$.
- **Hint 1:** Do not run single-word search for each word individually.
- **Hint 2:** Build a Trie from the word list.
- **Hint 3:** Traverse the board and Trie simultaneously, pruning branches as soon as board characters diverge from Trie prefixes.

### 6.2 Sudoku Solver

- **Input:** $9 \times 9$ board with empty cells marked `'.'`
- **Output:** Solved board modified in-place.
- **Constraint:** Exactly one unique solution exists.
- **Hint 1:** Find an empty cell `'.'`.
- **Hint 2:** Try digits `'1'` through `'9'`. Verify that the digit does not already exist in the row, column, or $3 \times 3$ sub-box (`Math.floor(r/3) * 3 + Math.floor(c/3)`).
- **Hint 3:** If valid, place the digit and recurse. If the recursive call returns false, reset the cell back to `'.'` and try the next digit.

### 6.3 Unique Paths III

- **Input:** Grid with `1` = start, `2` = end, `0` = empty, `-1` = obstacle.
- **Output:** Number of paths from start to end that visit every non-obstacle square exactly once.
- **Constraint:** $1 \le m \times n \le 20$.
- **Hint 1:** Count the total number of non-obstacle cells upfront.
- **Hint 2:** In DFS, increment your visited count and mark cells with `-1`.
- **Hint 3:** When reaching `2`, only increment total solutions if `visitedCount === targetCount`. Backtrack cells before returning.

---

<nav aria-label="Lecture navigation">

[Previous: Subsets, Permutations & Combinations](day-21-subsets-permutations-and-combinations.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Trees: DFS & Properties](day-23-binary-trees-dfs-and-properties.md)

</nav>
