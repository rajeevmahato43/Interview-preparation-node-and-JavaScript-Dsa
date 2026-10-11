# Day 22: Grid Backtracking & Mazes

<nav aria-label="Lecture navigation">

[Previous: Subsets, Permutations & Combinations](day-21-subsets-permutations-and-combinations.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Trees: DFS & Properties](day-23-binary-trees-dfs-and-properties.md)

</nav>

## Prerequisites

- [Day 20: Recursion Trees & Backtracking](day-20-recursion-trees-and-backtracking-core.md) — Choose, explore, and unchoose.
- 2D array coordinates (`matrix[row][col]`).

---

## 1. Navigating a 2D Grid

When searching through a 2D matrix, we navigate across adjacent cells in **4 directions**:
- Up: `[r - 1, c]`
- Down: `[r + 1, c]`
- Left: `[r, c - 1]`
- Right: `[r, c + 1]`

```javascript
// Clean 4-Direction Offset Array
const DIRECTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
```

### Boundary & Safety Check
Before visiting a cell, verify it is inside the grid:
```javascript
function inBounds(r, c, rows, cols) {
  return r >= 0 && r < rows && c >= 0 && c < cols;
}
```

---

## 2. In-Place Visited Marking (Zero Extra Memory)

Instead of maintaining a large visited matrix, temporarily mark the current cell with a special character like `'#'`, and **restore it when unwinding**:

```javascript
const temp = board[r][c];
board[r][c] = '#';        // CHOOSE (Mark visited)

// EXPLORE 4 directions...

board[r][c] = temp;       // UNCHOOSE (Restore original character)
```

---

## 3. Problem 1: Word Search

Given an $m \times n$ grid of characters `board` and a string `word`, return `true` if `word` exists in the grid.

```javascript
// Node.js code: Word Search
function exist(board, word) {
  const rows = board.length;
  const cols = board[0].length;

  function dfs(r, c, charIndex) {
    // Goal reached: matched all letters!
    if (charIndex === word.length) return true;

    // Boundary & mismatch checks
    if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] !== word[charIndex]) {
      return false;
    }

    // 1. Choose: Mark cell as visited
    const originalChar = board[r][c];
    board[r][c] = "#";

    // 2. Explore: Try all 4 directions
    const found = (
      dfs(r + 1, c, charIndex + 1) ||
      dfs(r - 1, c, charIndex + 1) ||
      dfs(r, c + 1, charIndex + 1) ||
      dfs(r, c - 1, charIndex + 1)
    );

    // 3. Unchoose: Backtrack and restore original char
    board[r][c] = originalChar;

    return found;
  }

  // Scan every cell as a starting candidate
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (dfs(r, c, 0)) return true;
    }
  }

  return false;
}

const board = [
  ['A','B','C','E'],
  ['S','F','C','S'],
  ['A','D','E','E']
];
console.log(exist(board, "ABCCED")); // true
console.log(exist(board, "ABCB"));   // false
```
- **Time Complexity:** $O(m \cdot n \cdot 4^L)$ where $L$ is word length.
- **Extra Space:** $O(L)$ recursion call stack depth.

---

## 4. Problem 2: N-Queens

Place $n$ non-attacking queens on an $n \times n$ chessboard such that no two queens share the same row, column, or diagonal.

### The $O(1)$ Diagonal Check:
- Column clash: Track `cols = new Set()`
- Major diagonal clash ($r - c$ is constant): `diag1 = new Set()`
- Minor diagonal clash ($r + c$ is constant): `diag2 = new Set()`

```javascript
// Node.js code: N-Queens
function solveNQueens(n) {
  const result = [];
  const cols = new Set();
  const diag1 = new Set(); // r - c
  const diag2 = new Set(); // r + c
  const board = Array.from({ length: n }, () => new Array(n).fill('.'));

  function backtrack(row) {
    if (row === n) {
      result.push(board.map(r => r.join('')));
      return;
    }

    for (let col = 0; col < n; col++) {
      const d1 = row - col;
      const d2 = row + col;

      if (cols.has(col) || diag1.has(d1) || diag2.has(d2)) continue;

      // Choose
      board[row][col] = 'Q';
      cols.add(col);
      diag1.add(d1);
      diag2.add(d2);

      // Explore next row
      backtrack(row + 1);

      // Unchoose
      board[row][col] = '.';
      cols.delete(col);
      diag1.delete(d1);
      diag2.delete(d2);
    }
  }

  backtrack(0);
  return result;
}

console.log(solveNQueens(4).length); // 2 solutions
```
- **Time Complexity:** $O(n!)$
- **Extra Space:** $O(n)$

---

## 5. Tricky Points and Common Traps

1. **Forgetting to unmark the cell:** If you set `board[r][c] = '#'` and forget to restore it upon returning, subsequent searches cannot use that cell!
2. **Boundary check order:** Always check `r < 0 || r >= rows || c < 0 || c >= cols` **before** inspecting `board[r][c]`, otherwise JavaScript throws an out-of-bounds error.
3. **Revisiting the same cell:** A word cannot reuse the same grid letter twice in one path; in-place marking (`'#'`) guarantees this.

---

## 6. Hands-On Exercises

Run this script in Node.js to verify word search:

```javascript
// Node.js code
const assert = require("node:assert");

const b = [
  ['A', 'B'],
  ['C', 'D']
];

function testExist(grid, w) {
  function dfs(r, c, i) {
    if (i === w.length) return true;
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] !== w[i]) return false;
    const ch = grid[r][c];
    grid[r][c] = '#';
    const found = dfs(r+1,c,i+1) || dfs(r-1,c,i+1) || dfs(r,c+1,i+1) || dfs(r,c-1,i+1);
    grid[r][c] = ch;
    return found;
  }
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) if (dfs(r, c, 0)) return true;
  }
  return false;
}

assert.equal(testExist(b, "ABDC"), true);
assert.equal(testExist(b, "ABCD"), false);

console.log("✅ Word search assertions passed!");
```

---

## 7. Summary

- **2D Grid backtracking** navigates in 4 directions using row and column offsets.
- **In-place marking** (`board[r][c] = '#'`) prevents cell reuse without allocating extra visited memory.
- **Always unmark** before returning so other branches can explore the cell.
- **Diagonals** in a matrix are tracked using $r - c$ and $r + c$.

---

## 8. Cheat Sheet

| Task | Pattern |
| :--- | :--- |
| **4 Directions** | `[[-1, 0], [1, 0], [0, -1], [0, 1]]` |
| **In-place visited** | `temp = b[r][c]; b[r][c] = '#'; ... b[r][c] = temp;` |
| **Major Diagonal** | `row - col` is identical |
| **Minor Diagonal** | `row + col` is identical |

---

## 9. Interview Q&A

### 45-Second Explanation
> *"For Word Search, we treat the grid as a state graph and perform a 4-directional depth-first search from each cell. When a cell matches the current character of the word, we temporarily mark it with a sentinel character to avoid using it twice in the same word. We then recursively explore up, down, left, and right. Once exploration completes, we restore the cell's original character. This uses $O(L)$ stack memory for a word of length $L$."*

---

## 10. Practice Problems

### 1. Word Search - Medium
Given an `m x n` grid of characters `board` and a string `word`, return `true` if `word` exists in the grid. The word can be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once.
- **Input:** `board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"`
- **Expected Output:** `true`
- **Input:** `board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "SEE"`
- **Expected Output:** `true`
- **Input:** `board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCB"`
- **Expected Output:** `false`

### 2. N-Queens - Hard
The **n-queens** puzzle is the problem of placing `n` queens on an `n x n` chessboard such that no two queens attack each other. Given an integer `n`, return all distinct solutions to the n-queens puzzle. You may return the answer in any order.
- **Input:** `n = 4`
- **Expected Output:** `[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]`
- **Input:** `n = 1`
- **Expected Output:** `[["Q"]]`

### 3. Word Search II - Hard
Given an `m x n` `board` of characters and a list of strings `words`, return all words on the board. Each word must be constructed from letters of sequentially adjacent cells.
- **Input:** `board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"]`
- **Expected Output:** `["eat","oath"]`
- **Input:** `board = [["a","b"],["c","d"]], words = ["abcb"]`
- **Expected Output:** `[]`

---

<nav aria-label="Lecture navigation">

[Previous: Subsets, Permutations & Combinations](day-21-subsets-permutations-and-combinations.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Trees: DFS & Properties](day-23-binary-trees-dfs-and-properties.md)

</nav>
