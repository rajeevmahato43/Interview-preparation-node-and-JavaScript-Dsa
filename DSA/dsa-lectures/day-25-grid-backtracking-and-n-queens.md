# Day 25: Grid Backtracking: Word Search, Maze Paths, and N-Queens

<nav aria-label="Lecture navigation">

[Previous: Combinations and Permutations](day-24-combinations-and-permutations.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search Bounds and Intervals](day-26-binary-search-bounds-and-intervals.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Master **2D Grid Backtracking** with directional offsets (`dr = [-1, 1, 0, 0]`, `dc = [0, 0, -1, 1]`).
- Apply **In-Place Visited Marking** (`board[r][c] = '#'`) with state restoration to achieve $O(1)$ extra space beyond recursion depth.
- Solve **Word Search** in a 2D matrix in $O(m \cdot n \cdot 4^L)$ time.
- Solve **N-Queens** by tracking occupied columns and diagonal collision equations ($r + c$ and $r - c$).
- Model grid navigation and constraint satisfaction problems in backend services.

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md)
- [Day 22: Backtracking Core: Decision State, Choices, and Undo](day-22-backtracking-fundamentals.md)

---

## Core Concepts

### 1. The 2D Grid Backtracking Pattern

When searching a 2D grid of size $m \times n$:
1. Check **boundary guards** first (`r < 0 || r >= m || c < 0 || c >= n`).
2. Check if the current cell matches the required character or is already visited.
3. **Choose**: Mark current cell as visited.
4. **Explore**: Recurse in 4 cardinal directions (Up, Down, Left, Right).
5. **Unchoose (Backtrack)**: Restore the cell's original character!

```text
Grid:
[ 'A', 'B', 'C', 'E' ]
[ 'S', 'F', 'C', 'S' ]
[ 'A', 'D', 'E', 'E' ]

Looking for "ABCCED":
At (0, 0) 'A':
  Mark (0, 0) as '#'
  Move Right -> (0, 1) 'B'
  Mark (0, 1) as '#'
  Move Right -> (0, 2) 'C'
  Mark (0, 2) as '#'
  Move Down  -> (1, 2) 'C' ...
If path fails later:
  Unwind and restore (0, 0) back to 'A'!
```

---

### 2. N-Queens Diagonal Mathematics

In the classic N-Queens problem, placing a Queen at $(r, c)$ threatens:
1. Column $c$.
2. Positive Diagonal ($\nearrow$): Cells where **$r + c$ is constant**.
3. Negative Diagonal ($\searrow$): Cells where **$r - c$ is constant**.

```text
Board (4x4):
   c=0  c=1  c=2  c=3
r=0  .    Q    .    .   (r=0, c=1) -> col=1, diag1 (r+c)=1, diag2 (r-c)=-1
r=1  .    .    .    Q   (r=1, c=3) -> col=3, diag1 (r+c)=4, diag2 (r-c)=-2
r=2  Q    .    .    .   (r=2, c=0) -> col=0, diag1 (r+c)=2, diag2 (r-c)=2
r=3  .    .    Q    .   (r=3, c=2) -> col=2, diag1 (r+c)=5, diag2 (r-c)=1
```
By using three Sets (`cols`, `posDiags`, `negDiags`), we can test if a position is under attack in **$O(1)$ instant lookup**!

---

## Detailed Explanations & Node.js Relevance

### In-Place Marking vs Visited 2D Matrix

Instead of allocating a separate $m \times n$ boolean matrix `visited[r][c]` which requires $O(m \cdot n)$ memory allocations:
```js
// IN-PLACE MARKING TRICK:
const temp = board[r][c];
board[r][c] = "#"; // Mark as visited (using an impossible character)

const found = dfs(r + 1, c) || dfs(r - 1, c) || dfs(r, c + 1) || dfs(r, c - 1);

board[r][c] = temp; // Restore original character (Backtrack)
```
This reduces auxiliary space strictly to the call stack depth $O(L)$, where $L$ is word length, generating **zero heap allocations** in Node.js.

---

## JavaScript Implementation & Tracing

### 1. Word Search (LeetCode 79)

```js
function exist(board, word) {
  const m = board.length;
  const n = board[0].length;

  function dfs(r, c, index) {
    // Base Case: entire word matched
    if (index === word.length) return true;

    // Boundary & mismatch checks
    if (r < 0 || r >= m || c < 0 || c >= n || board[r][c] !== word[index]) {
      return false;
    }

    // 1. CHOOSE (Mark in-place)
    const temp = board[r][c];
    board[r][c] = "#";

    // 2. EXPLORE (4 directions)
    const found =
      dfs(r + 1, c, index + 1) ||
      dfs(r - 1, c, index + 1) ||
      dfs(r, c + 1, index + 1) ||
      dfs(r, c - 1, index + 1);

    // 3. UNCHOOSE (Restore state)
    board[r][c] = temp;

    return found;
  }

  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (dfs(r, c, 0)) return true;
    }
  }

  return false;
}
```

### 2. N-Queens (LeetCode 51)

```js
function solveNQueens(n) {
  const result = [];
  const cols = new Set();
  const posDiags = new Set(); // r + c
  const negDiags = new Set(); // r - c

  // Board initialized with dots
  const board = Array.from({ length: n }, () => new Array(n).fill("."));

  function backtrack(r) {
    if (r === n) {
      result.push(board.map(row => row.join("")));
      return;
    }

    for (let c = 0; c < n; c++) {
      if (cols.has(c) || posDiags.has(r + c) || negDiags.has(r - c)) {
        continue; // Under attack!
      }

      // 1. CHOOSE
      cols.add(c);
      posDiags.add(r + c);
      negDiags.add(r - c);
      board[r][c] = "Q";

      // 2. EXPLORE (Next row)
      backtrack(r + 1);

      // 3. UNCHOOSE (UNDO)
      cols.delete(c);
      posDiags.delete(r + c);
      negDiags.delete(r - c);
      board[r][c] = ".";
    }
  }

  backtrack(0);
  return result;
}
```

### Trace: Word Search on `board = [["A","B"],["C","D"]]`, `word = "ABDC"`

| Step | Call `(r, c)` | `index` | `char` | Action | `board` State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `(0, 0)` | 0 | `'A'` | Matches `'A'` $\to$ mark `#` | `[["#","B"],["C","D"]]` |
| 2 | `(0, 1)` | 1 | `'B'` | Matches `'B'` $\to$ mark `#` | `[["#","#"],["C","D"]]` |
| 3 | `(1, 1)` | 2 | `'D'` | Matches `'D'` $\to$ mark `#` | `[["#","#"],["C","#"]]` |
| 4 | `(1, 0)` | 3 | `'C'` | Matches `'C'` $\to$ `index = 4` | **Word Complete! Returns `true`** |

- **Time Complexity**: $O(m \cdot n \cdot 4^L)$ where $L$ is word length.
- **Auxiliary Space**: $O(L)$ for the recursive call stack.

---

## Common Mistakes & Interview Traps

1. **Forgetting to Restore the Cell**:
   If you set `board[r][c] = '#'` and return `false` without restoring `board[r][c] = temp`, the board remains permanently corrupted for subsequent searches starting from other cells!
2. **Incorrect Diagonal Math in N-Queens**:
   Remember:
   - Sum ($r + c$) is constant along the **positive diagonal** ($\nearrow$).
   - Difference ($r - c$) is constant along the **negative diagonal** ($\searrow$).
3. **Checking All Rows in N-Queens**:
   Because we place exactly one Queen per row and advance `r + 1`, we **never** need a `rows` set. Rows are guaranteed unique by structure.

---

## Tricky Points & Edge Cases

- **Word Longer than Board Cells**:
  If `word.length > m * n`, return `false` immediately in $O(1)$ time.
- **Character Frequency Pre-Check**:
  Before running DFS in Word Search, count total occurrences of characters in `board` and `word`. If the board has fewer of any required character, return `false` instantly to skip the entire exponential search!

---

## Practical Exercise

Implement **Rat in a Maze**:
Given an $N \times N$ grid where `0` means blocked and `1` means open, find all possible paths from top-left $(0, 0)$ to bottom-right $(N-1, N-1)$ returning directional strings (e.g. `"DDRR"` for Down-Down-Right-Right).
- **Acceptance Criterion**: Must run using 2D grid backtracking and restore visited cells upon return.

---

## Summary

- 2D Grid Backtracking explores 4 cardinal directions using index offsets.
- In-place marking (`board[r][c] = '#'`) eliminates the memory overhead of a 2D visited matrix.
- Always restore state during the unwinding phase to keep the board valid for other paths.
- N-Queens constraints are tracked in $O(1)$ time using column and diagonal index sets ($r + c$ and $r - c$).

---

## Cheat Sheet

### 2D Grid Backtracking Skeleton
```js
function dfs(r, c, idx) {
  if (idx === word.length) return true;
  if (r < 0 || r >= m || c < 0 || c >= n || board[r][c] !== word[idx]) return false;

  const temp = board[r][c];
  board[r][c] = '#'; // Mark
  const found = dfs(r+1,c,idx+1) || dfs(r-1,c,idx+1) || dfs(r,c+1,idx+1) || dfs(r,c-1,idx+1);
  board[r][c] = temp; // Restore

  return found;
}
```

---

## Interview Questions

### 1. Deep Definitions and Mental Models
**Question:** In N-Queens, why does $r + c$ represent one diagonal direction and $r - c$ represent the perpendicular diagonal direction?
- **Expected answer shape:** Moving one step down-left increases row by 1 and decreases column by 1: $(r + 1) + (c - 1) = r + c$. Thus, the sum remains constant for all cells on that anti-diagonal ($\nearrow$). Moving one step down-right increases both row and column by 1: $(r + 1) - (c + 1) = r - c$. Thus, the difference remains constant for all cells on that main diagonal ($\searrow$).

### 2. Predict the Output and Trace Execution
**Question:** How many distinct solutions exist for $N = 4$ in the N-Queens problem?
- **Expected answer shape:** Exactly 2 distinct solutions:
- Solution 1: `[".Q..", "...Q", "Q...", "..Q."]`
- Solution 2: `["..Q.", "Q...", "...Q", ".Q.."]`

### 3. Implementation Exercise
**Question:** Implement a function that returns the total count of N-Queens solutions (LeetCode 52) without building the string board.
- **Expected answer shape:**
```js
function totalNQueens(n) {
  let count = 0;
  const cols = new Set(), pos = new Set(), neg = new Set();
  function dfs(r) {
    if (r === n) { count++; return; }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || pos.has(r + c) || neg.has(r - c)) continue;
      cols.add(c); pos.add(r + c); neg.add(r - c);
      dfs(r + 1);
      cols.delete(c); pos.delete(r + c); neg.delete(r - c);
    }
  }
  dfs(0);
  return count;
}
```

### 4. Debugging and Failure Analysis
**Question:** A candidate’s Word Search solution works on small tests but times out on tests where `board` has 400 `'a'`s and `word = "aaaaaab"`. How do you optimize it?
- **Expected answer shape:** The search starts from every `'a'` and explores deeply until failing at `'b'`. Optimization: Check the frequency of `word[0]` vs `word[word.length - 1]`. If the last letter is rarer than the first letter, reverse `word` before searching (`word.split('').reverse().join('')`). This prunes the search tree at the very root instead of at maximum depth.

### 5. Design and Tradeoff Questions
**Question:** Why does Breadth-First Search (BFS) fail for Word Search while Depth-First Search (Backtracking) succeeds?
- **Expected answer shape:** Word Search requires maintaining a distinct path of visited cells per exploration branch. In BFS, each queue element would need to store its own copy of the entire $m \times n$ visited grid, resulting in exponential memory explosion ($O(m \cdot n \cdot 4^L)$). DFS reuses a single shared 2D board in memory with $O(1)$ in-place marking and unmarking.

### 6. Senior Follow-ups: Node.js Maze Routing
**Question:** In an autonomous warehouse robot routing service, a 2D grid pathfinder must find a route without blocking the Node.js event loop. How would you design this?
- **Expected answer shape:** Backtracking on large grids is CPU-intensive. (1) Use $A^*$ search or BFS with a priority queue rather than raw backtracking to guarantee the shortest path. (2) If backtracking is required for complex constraint satisfaction, run the calculation in a Node.js `worker_threads` worker, returning the solution path asynchronously to the main thread via IPC message channels.

<nav aria-label="Lecture navigation">

[Previous: Combinations and Permutations](day-24-combinations-and-permutations.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search Bounds and Intervals](day-26-binary-search-bounds-and-intervals.md)

</nav>
