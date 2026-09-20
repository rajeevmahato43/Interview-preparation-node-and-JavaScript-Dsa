# Day 38: Graph Traversal: DFS and Connected Components

## 1. Learning Outcomes
- Master **Depth-First Search (DFS)** on graphs using recursion and explicit visited tracking.
- Count and label **Connected Components** in disconnected undirected graphs.
- Solve 2D grid graph traversals: **Number of Islands**, **Max Area of Island**, and **Flood Fill**.
- Understand grid boundaries, direction vectors `[[-1,0], [1,0], [0,-1], [0,1]]`, and in-place mutation tradeoffs.
- Apply connected component analysis to blast-radius isolation and multi-tenant resource partitioning in Node.js microservices.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 21 (Recursion & Call Stack), Day 25 (Grid Backtracking), Day 36 (Graph Representations).
- **Navigation**:
  - [Previous: Day 37 - Graph Traversal: BFS & Shortest Path](day-37-graph-traversal-bfs-and-shortest-path.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 39 - Cycle Detection: Directed & Undirected Graphs](day-39-cycle-detection-directed-and-undirected.md)

---

## 3. Core Concepts & Mental Models
While BFS expands symmetrically outward in layers, **DFS** plunges along an edge chain until reaching a dead end or a previously visited vertex, then backtracks.

```text
Connected Components & 2D Grid DFS:
Graph with 3 Components:       2D Grid as Graph (4-directional edges):
Component 1: (0)---(1)         ['1', '1', '0', '0']   ('1' = Land, '0' = Water)
                     \         ['1', '1', '0', '0']
                     (2)       ['0', '0', '1', '0']
Component 2: (3)---(4)         ['0', '0', '0', '1']
Component 3: (5)               Total Islands (Connected Components) = 3!
```

### Grid-as-Graph Mental Model
A 2D matrix of dimensions $M \times N$ represents an implicit graph of $V = M \cdot N$ vertices. Each cell $(r, c)$ connects to up to 4 neighbors: $(r-1, c)$, $(r+1, c)$, $(r, c-1)$, $(r, c+1)$.

---

## 4. Detailed Technical Explanations

### 4.1 Outer Loop Component Counting
A single DFS only traverses nodes reachable within the same connected component. To traverse a potentially disconnected graph:
```javascript
let count = 0;
for (let v = 0; v < numVertices; v++) {
  if (!visited.has(v)) {
    dfs(v); // Traverses entire component
    count++; // Increments component count
  }
}
```

### 4.2 Grid Boundary Guards & Mutation
When exploring 2D matrices, prevent `TypeError: Cannot read properties of undefined` with strict boundary guards:
```javascript
if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== '1') {
  return;
}
```
**In-Place Mutation**: Marking `grid[r][c] = '0'` (sinking the island) avoids allocating an $M \times N$ `visited` array, saving $O(M \cdot N)$ memory, but mutates caller data.

### 4.3 Node.js Relevance: Blast-Radius & Tenant Partitioning
In distributed architectures, microservices or database tables connected by direct foreign keys or RPC contracts form connected components. If Service X crashes, only services within its connected component are impacted. Connected component algorithms quantify blast radiuses and partition tenants across isolated database shards.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 Number of Islands (LeetCode 200)
```javascript
/**
 * Counts total number of islands in a 2D binary grid.
 * Time Complexity: O(M * N) - visits every cell at most twice.
 * Space Complexity: O(M * N) worst case recursion stack.
 */
function numIslands(grid) {
  if (!grid || grid.length === 0) return 0;

  const rows = grid.length;
  const cols = grid[0].length;
  let islandCount = 0;

  function dfs(r, c) {
    // 1. Boundary checks and water verification
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== '1') {
      return;
    }

    // 2. Mark as visited by "sinking" the land
    grid[r][c] = '0';

    // 3. Traverse all 4 cardinal directions
    dfs(r + 1, c); // Down
    dfs(r - 1, c); // Up
    dfs(r, c + 1); // Right
    dfs(r, c - 1); // Left
  }

  // Iterate over every cell in the grid
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        islandCount++;
        dfs(r, c); // Sinks entire connected island
      }
    }
  }

  return islandCount;
}
```

### 5.2 Max Area of Island (LeetCode 695)
```javascript
/**
 * Returns the maximum area of any island in the grid.
 * Time: O(M * N), Space: O(M * N)
 */
function maxAreaOfIsland(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  let maxArea = 0;

  function getArea(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== 1) {
      return 0;
    }

    grid[r][c] = 0; // Mark visited

    // 1 (current cell) + sum of connected areas in 4 directions
    return 1 + getArea(r + 1, c) + 
               getArea(r - 1, c) + 
               getArea(r, c + 1) + 
               getArea(r, c - 1);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        maxArea = Math.max(maxArea, getArea(r, c));
      }
    }
  }

  return maxArea;
}
```

### 5.3 Execution Trace: `numIslands` on 3x3 Grid
```text
Grid:
['1', '1', '0']
['0', '1', '0']
['0', '0', '1']

1. (0, 0) is '1': islandCount = 1. Launch dfs(0, 0):
   - Sink (0, 0) to '0'.
   - Recurse (0, 1): '1' -> sink to '0'.
     - Recurse (1, 1): '1' -> sink to '0'.
   - Island 1 completely sunk to '0'.
2. Cells (0, 1), (0, 2), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1) are all '0'.
3. Cell (2, 2) is '1': islandCount = 2. Launch dfs(2, 2):
   - Sink (2, 2) to '0'.
Final islandCount = 2.
```

---

## 6. Common Mistakes & Anti-Patterns
- **Call Stack Overflow on Large Grids**: For a grid of $1000 \times 1000$, a snake-shaped island has depth $10^6$. V8 crashes with `RangeError: Maximum call stack size exceeded`. Use an explicit array stack for iterative DFS or BFS for massive grids.
- **Checking Boundaries in Incorrect Order**: Writing `grid[r][c] !== '1' || r < 0` throws an error because `grid[r]` is evaluated before checking if `r` is valid. Always place range bounds first.
- **Forgetting to Mark Visited Before Recursing**: Forgetting to mutate `grid[r][c] = '0'` (or add to `visited`) causes two adjacent '1' cells to ping-pong back and forth infinitely.

---

## 7. Tricky Points & Edge Cases
- **Diagonal Connections**: Standard island problems only consider 4-way cardinal connectivity (up, down, left, right). If 8-way connectivity is required, include diagonal direction vectors `[-1, -1]`, `[-1, 1]`, `[1, -1]`, `[1, 1]`.
- **Empty or 1x1 Matrix**: Guard for `grid.length === 0 || grid[0].length === 0`.
- **Read-Only Data Constraint**: If the interviewer forbids mutating the input grid, allocate an explicit `visited` 2D boolean array or a `Set` of string coordinate keys `"${r},${c}"`.

---

## 8. Practical Engineering Exercises
1. Implement **Flood Fill** (LeetCode 733) updating connected pixels matching `startingColor` to `newColor`.
2. Implement **Surrounded Regions** (LeetCode 130) capturing all 'O' regions completely enclosed by 'X' by running boundary-first DFS.

---

## 9. Key Takeaways & Summary
- DFS traverses deeply along adjacent edges, making it ideal for exhaustively exploring connected components.
- The outer loop over all vertices ensures disconnected components are identified.
- 2D grids are implicit graphs where each cell connects to 4 cardinal neighbors.
- In-place grid sinking (`'1' -> '0'`) provides $O(1)$ auxiliary space beyond the recursion stack.

---

## 10. Quick Reference Cheat Sheet
| Pattern | Visited Mechanism | Boundary Check | Time | Auxiliary Space |
| :--- | :--- | :--- | :--- | :--- |
| **Graph DFS** | `visited.add(v)` | `!visited.has(n)` | $O(V + E)$ | $O(V)$ |
| **Grid DFS (In-place)** | `grid[r][c] = '0'` | `r < 0 \|\| r >= R \|\| c < 0 \|\| c >= C` | $O(R \times C)$ | $O(R \times C)$ |
| **Grid DFS (Non-mutating)** | `visited[r][c] = true` | `!visited[r][c]` | $O(R \times C)$ | $O(R \times C)$ |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: When analyzing a 2D matrix, what is the maximum possible recursion depth for DFS, and how does it compare to BFS?  
**Hint**: Consider a spiral or snake-like landmass filling the matrix.  
**Expected Answer Shape**: In a matrix of dimensions $M \times N$, a single connected island can wind snake-like through every cell, resulting in a maximum DFS recursion depth of $M \cdot N$. For a $1000 \times 1000$ grid, this requires $1,000,000$ stack frames, easily exceeding V8's call stack limit. BFS queue size is bounded by the perimeter/frontier width (at most $2 \cdot \min(M, N)$), which prevents stack overflow and limits peak heap memory.

### 2. Code-Writing
**Question**: Write a non-mutating version of `numIslands` using a boolean 2D array without modifying the input grid.  
**Hint**: Initialize `visited = Array.from({length: rows}, () => new Uint8Array(cols))`.  
**Expected Answer Shape**: Allocate `visited = Array.from({length: rows}, () => new Uint8Array(cols))`. In DFS: check `visited[r][c] === 1 || grid[r][c] !== '1'`. Set `visited[r][c] = 1`. Recurse on 4 neighbors. Iterate all cells; when `grid[r][c] === '1' && !visited[r][c]`, increment count and invoke DFS.

### 3. Debugging
**Question**: Identify why this grid DFS throws `TypeError: Cannot read properties of undefined (reading '0')`:  
```javascript
function dfs(grid, r, c) {
  if (grid[r][c] !== 1 || r < 0 || r >= grid.length) return;
  dfs(grid, r + 1, c);
}
```  
**Hint**: Evaluation order of short-circuit logical operators.  
**Expected Answer Shape**: JavaScript evaluates conditions left-to-right. When `r = -1` or `r = grid.length`, `grid[r][c]` is evaluated first before checking `r < 0`. Because `grid[-1]` is `undefined`, attempting to index `undefined[c]` throws a TypeError. Put boundary checks before array index accesses: `if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] !== 1)`.

### 4. System Design / Tradeoff
**Question**: In a Node.js microservice architecture, how would you determine if a database migration failure will cascade across independent backend services?  
**Hint**: Model service-to-service and service-to-database RPC dependencies as a graph.  
**Expected Answer Shape**: Construct a directed graph where nodes are microservices and databases, and directed edges represent RPC/REST/DB dependencies. Run DFS starting from the failing database node in reverse (or on the transposed graph) to identify all ancestor services that depend on this database. The resulting connected component represents the exact cascade blast radius.

### 5. Tricky / Edge Case
**Question**: In `maxAreaOfIsland`, how do you prevent counting a cell twice if two adjacent recursive calls hit the same neighbor?  
**Hint**: Where is the visited assignment made relative to recursive calls?  
**Expected Answer Shape**: Assign `grid[r][c] = 0` immediately at the very beginning of `getArea(r, c)` before making recursive calls into the 4 neighbors. Because the current cell is sunk to 0 immediately, any subsequent branch that looks back at it will immediately terminate via the base case check `grid[r][c] !== 1`, guaranteeing each cell contributes exactly 1 to the area.

### 6. Real-World Node.js Context
**Question**: You are implementing an image processing endpoint in Node.js (e.g., bucket-fill or magic-wand tool on raw pixel buffers). Why must you avoid recursive DFS?  
**Hint**: V8 call stack size vs. image resolution ($1920 \times 1080$).  
**Expected Answer Shape**: A standard 1080p image contains $1920 \times 1080 \approx 2.07 \times 10^6$ pixels. A bucket-fill on a uniform background will recurse millions of times, immediately crashing the Node.js process with a maximum call stack error. In production image processing (e.g., Sharp or custom C++ addons), flood fill is implemented iteratively using a scanline algorithm or a queue/stack buffer on the heap.
