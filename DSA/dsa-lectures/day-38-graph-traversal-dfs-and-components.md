# Day 38: Graph Traversal: DFS and Connected Components

<nav aria-label="Lecture navigation">
  <a href="day-37-graph-traversal-bfs-and-shortest-path.md">◀ Day 37: Graph Traversal: BFS and Shortest Path</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-39-cycle-detection-directed-and-undirected.md">Day 39: Cycle Detection in Directed and Undirected Graphs ▶</a>
</nav>

---

## Learning Outcomes

- Master **Depth-First Search (DFS)** graph exploration using both recursive call stack winding and iterative explicit heap stacks.
- Enumerate, count, and isolate **Connected Components** across arbitrary disconnected undirected graphs using outer-loop sweeps.
- Map implicit 2D matrices to graph models to solve grid traversal problems: **Number of Islands**, **Max Area of Island**, and **Flood Fill**.
- Apply standardized direction offset vectors (`[[-1, 0], [1, 0], [0, -1], [0, 1]]`) with defensive out-of-bounds guards.
- Weigh in-place matrix mutation ("sinking islands") against immutability and auxiliary memory allocations in high-concurrency Node.js microservices.
- Model multi-tenant cloud blast radius boundaries and service partition isolation using connected component clustering.

---

## Prerequisites

- [Day 21: Recursion Mechanics and Call Stack](day-21-recursion-mechanics-and-call-stack.md) — Call stack limits, stack frames, and recursive winding/unwinding.
- [Day 25: Grid Backtracking and N-Queens](day-25-grid-backtracking-and-n-queens.md) — 2D matrix coordinate navigation and boundary conditions.
- [Day 36: Graph Representations and Modeling](day-36-graph-representations-and-modeling.md) — Adjacency list representation and vertex degrees.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
| :--- | :--- | :--- |
| **Depth-First Search (DFS)** | A traversal strategy that plunges as deep as possible along each branch before backtracking. | Foundation for component discovery, topological ordering, and path-finding in $O(V + E)$ time. |
| **Connected Component** | A maximal subgraph in an undirected graph where any two vertices are connected to each other by paths. | Enumerating components reveals isolated sub-networks and disconnected partitions. |
| **Implicit Grid Graph** | Modeling an $M \times N$ matrix where each cell is a vertex and orthogonal adjacent cells are connected by edges. | Converts spatial matrix problems directly into graph traversal algorithms with $|V| = M \cdot N$. |
| **Direction Offsets** | Constant coordinate delta tuples (`[[ -1, 0 ], [ 1, 0 ], [ 0, -1 ], [ 0, 1 ]]`) representing up, down, left, right. | Eliminates repetitive nested conditionals; standard clean code pattern in technical interviews. |
| **In-Place Sinking** | Mutating visited cell values (e.g., `'1'` to `'0'`) to eliminate the auxiliary memory required by a `visited` set. | Reduces space from $O(M \cdot N)$ to $O(\text{call stack})$, but risks data corruption in concurrent architectures. |
| **Outer Loop Sweep** | Iterating through all vertices $0 \le v < V$ and initiating a DFS only when $v$ is unvisited. | Necessary to visit every isolated component in disconnected graphs. |

---

## Core Concepts & Mechanical Architecture

### 1. DFS Traversal Mechanics on General Graphs

**Depth-First Search (DFS)** traverses a graph by exploring outward along an edge until it hits a vertex with no unvisited outgoing edges, at which point it backtracks to explore remaining alternative paths. Unlike trees, graphs may contain multiple paths to the same node as well as cycles; an explicit **`visited` set or lookup table** is mandatory.

```text
DFS Traversal Step-by-Step:
Graph:
    (0) ------- (1)
     |           |
     |           |
    (2) ------- (3) ------- (4)

Trace starting at Vertex 0:
1. Visit 0 -> Mark visited: {0}. Recurse to neighbor 1.
2. Visit 1 -> Mark visited: {0, 1}. Recurse to neighbor 3.
3. Visit 3 -> Mark visited: {0, 1, 3}.
   - Neighbor 1 is visited. Skip.
   - Recurse to neighbor 2.
4. Visit 2 -> Mark visited: {0, 1, 3, 2}.
   - Neighbor 0 is visited. Neighbor 3 is visited. Dead end! Backtrack to 3.
5. Back at 3 -> Recurse to unvisited neighbor 4.
6. Visit 4 -> Mark visited: {0, 1, 3, 2, 4}. Dead end! Backtrack.
All reachable nodes explored!
```

---

### 2. Identifying Connected Components via the Outer Loop Sweep

A single DFS call from a starting vertex $v$ only explores the connected component containing $v$. If a graph consists of disconnected partitions, an outer loop must sweep through every vertex $0 \dots V - 1$.

```text
Disconnected Graph with 3 Connected Components:
Component 1:          Component 2:          Component 3:
   (0) --- (1)           (3) --- (4)           (5)
    |     /
   (2) --'

Outer Loop Sweep:
v = 0: Unvisited! Call dfs(0). Marks {0, 1, 2}. ComponentCount = 1.
v = 1: Already visited in Component 1. Skip.
v = 2: Already visited in Component 1. Skip.
v = 3: Unvisited! Call dfs(3). Marks {3, 4}. ComponentCount = 2.
v = 4: Already visited in Component 2. Skip.
v = 5: Unvisited! Call dfs(5). Marks {5}. ComponentCount = 3.
Total Connected Components: 3
```

```javascript
// Node.js code: Connected Components Counter
/**
 * Counts the number of connected components in an undirected graph.
 * Time Complexity: O(V + E)
 * Space Complexity: O(V)
 * @param {number} numVertices
 * @param {Array<[number, number]>} edges
 * @returns {number}
 */
function countComponents(numVertices, edges) {
  // 1. Build Adjacency List
  const adjList = Array.from({ length: numVertices }, () => []);
  for (let i = 0; i < edges.length; i++) {
    const [u, v] = edges[i];
    adjList[u].push(v);
    adjList[v].push(u);
  }

  const visited = new Uint8Array(numVertices);
  let componentCount = 0;

  function dfs(node) {
    visited[node] = 1;
    const neighbors = adjList[node];
    for (let i = 0; i < neighbors.length; i++) {
      const neighbor = neighbors[i];
      if (visited[neighbor] === 0) {
        dfs(neighbor);
      }
    }
  }

  // 2. Outer Loop Sweep over all vertices
  for (let v = 0; v < numVertices; v++) {
    if (visited[v] === 0) {
      componentCount++;
      dfs(v);
    }
  }

  return componentCount;
}

const edges = [[0, 1], [1, 2], [3, 4]];
console.log('Component count:', countComponents(6, edges)); // 3 (Components: {0,1,2}, {3,4}, {5})
```

---

### 3. The 2D Grid as an Implicit Graph: Number of Islands

In **Number of Islands** (LeetCode 200), we are given an $M \times N$ 2D binary grid of `'1'`s (land) and `'0'`s (water). An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.

```text
2D Grid Transformation:
[
  ['1', '1', '0', '0', '0'],
  ['1', '1', '0', '0', '0'],
  ['0', '0', '1', '0', '0'],
  ['0', '0', '0', '1', '1']
]

Analysis:
- Island 1: [(0,0), (0,1), (1,0), (1,1)]
- Island 2: [(2,2)]
- Island 3: [(3,3), (3,4)]
Total Islands = 3
```

```javascript
// Node.js code: Number of Islands via Grid DFS
/**
 * Computes the number of distinct islands in a 2D binary grid.
 * Time Complexity: O(M * N)
 * Space Complexity: O(M * N) worst-case recursion stack
 * @param {string[][]} grid
 * @returns {number}
 */
function numIslands(grid) {
  if (!grid || grid.length === 0 || grid[0].length === 0) return 0;

  const rows = grid.length;
  const cols = grid[0].length;
  let islandCount = 0;

  // 4-directional offsets: [rowDelta, colDelta]
  const DIRECTIONS = [
    [-1, 0], // Up
    [1, 0],  // Down
    [0, -1], // Left
    [0, 1]   // Right
  ];

  function sinkIsland(r, c) {
    // 1. Boundary & water guards
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== '1') {
      return;
    }

    // 2. Mark visited in-place by "sinking" land to water
    grid[r][c] = '0';

    // 3. Recurse into all 4 orthogonal neighbors
    for (let i = 0; i < DIRECTIONS.length; i++) {
      const [dr, dc] = DIRECTIONS[i];
      sinkIsland(r + dr, c + dc);
    }
  }

  // Sweep entire matrix
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        islandCount++;
        sinkIsland(r, c); // Sinks entire connected landmass
      }
    }
  }

  return islandCount;
}

const map = [
  ['1', '1', '0', '0', '0'],
  ['1', '1', '0', '0', '0'],
  ['0', '0', '1', '0', '0'],
  ['0', '0', '0', '1', '1']
];
console.log('Total islands found:', numIslands(map)); // 3
```

---

### 4. Flood Fill and Max Area of Island

1. **Max Area of Island** (LeetCode 695): Instead of just sinking the island, the recursive DFS returns the sum of all land cells in the component:
   $$\text{area}(r, c) = 1 + \sum_{(dr, dc)} \text{area}(r + dr, c + dc)$$
2. **Flood Fill** (LeetCode 733): Given a starting coordinate $(sr, sc)$ and a `newColor`, mutate the cell and all connected cells of the original starting color to `newColor`. Guard condition: if `grid[sr][sc] === newColor`, return immediately to avoid infinite recursion loops.

```javascript
// Node.js code: Max Area of Island Implementation
/**
 * @param {number[][]} grid
 * @returns {number}
 */
function maxAreaOfIsland(grid) {
  if (!grid || grid.length === 0) return 0;
  const rows = grid.length;
  const cols = grid[0].length;
  let maxArea = 0;

  function dfs(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== 1) {
      return 0;
    }

    grid[r][c] = 0; // Sink cell
    let area = 1;

    area += dfs(r - 1, c);
    area += dfs(r + 1, c);
    area += dfs(r, c - 1);
    area += dfs(r, c + 1);

    return area;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        maxArea = Math.max(maxArea, dfs(r, c));
      }
    }
  }

  return maxArea;
}
```

---

## Detailed Node.js Relevance

### Cloud Multi-Tenant Blast Radius Partitioning

In Node.js cloud infrastructure platforms, microservices and tenant resources form an interconnected relationship graph.

```text
Tenant Isolation Graph:
Tenant Alpha Cluster:           Tenant Beta Cluster:
[Auth-Svc]                     [Auth-Svc]
    |                              |
[Billing-DB-Alpha]             [Billing-DB-Beta]
```

1. **Blast Radius Quarantine**: When a security vulnerability or critical latency degradation hits a database instance, running connected component analysis on the infrastructure graph discovers the exact set of microservices affected. Services outside that connected component are guaranteed to be isolated, allowing targeted partial failovers instead of full cluster restarts.
2. **V8 Stack Limits on Large Grids**: A $1000 \times 1000$ matrix has $1,000,000$ cells. A snake-like island can cause a single DFS recursion path of depth $1,000,000$. Because the Node.js V8 call stack size limit is ~10,000 frames, a recursive grid DFS will crash with `RangeError: Maximum call stack size exceeded`. For production-scale grids, an **iterative DFS** using an array-based stack allocated on the heap is mandatory.

---

## Tricky Points & Edge Cases

1. **In-Place Mutation Data Corruption**: Mutating the input grid (`grid[r][c] = '0'`) destroys caller state. If the caller requires the original grid intact, either allocate a `visited` 2D array or restore the grid values after traversal.
2. **Infinite Recursion on Flood Fill**: In `floodFill(image, sr, sc, newColor)`, if the starting cell already has color equal to `newColor`, a naive DFS without a visited set will loop infinitely between neighbor cells. Always guard: `if (originalColor === newColor) return image;`.
3. **Diagonal vs. Orthogonal Connectivity**: By standard graph convention, grid cells connect only along cardinal directions (horizontal and vertical). If a problem specifies 8-directional connectivity (including diagonals), add `[[-1,-1], [-1,1], [1,-1], [1,1]]` to your offset array.
4. **Disconnected Nodes with Degree Zero**: Isolated nodes are valid components of size 1. An algorithm that iterates only through the edge list will overlook nodes that have no incident edges. Always sweep from $0$ to $V - 1$.

---

## Hands-On Exercise

### Scenario
You are building an image processing module in a Node.js microservice. You receive a black-and-white mask grid (`1` = foreground object, `0` = background). You must implement an iterative (stack-safe) function `getComponentMetrics(grid)` that calculates:
1. `totalObjects`: Count of connected foreground objects (islands).
2. `largestArea`: Pixel count of the largest object.
3. `mustNotCrashOnDeepStack`: The algorithm must not crash even on deeply nested serpentine grids.

### Buggy Code
```javascript
function getComponentMetrics(grid) {
  let count = 0;
  let maxArea = 0;

  // BUG: Uses naive recursion that crashes on deep serpentine grids
  function dfs(r, c) {
    if (grid[r][c] !== 1) return 0;
    grid[r][c] = 0;
    // Missing boundary guards! Will throw undefined access on boundaries
    return 1 + dfs(r - 1, c) + dfs(r + 1, c) + dfs(r, c - 1) + dfs(r, c + 1);
  }

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === 1) {
        count++;
        maxArea = Math.max(maxArea, dfs(r, c));
      }
    }
  }

  return { totalObjects: count, largestArea: maxArea };
}
```

### Acceptance Criteria
- Return `{ totalObjects, largestArea }` matching exact counts.
- Protect against out-of-bounds array reads.
- Implement iterative heap-allocated stack traversal to guarantee call stack safety.
- Preserve original grid data without destructive mutation (using a visited bitmask).

### Solution Code
```javascript
const assert = require('assert');

// Node.js code: Stack-Safe Iterative Grid Component Metrics
/**
 * @param {number[][]} grid
 * @returns {{ totalObjects: number, largestArea: number }}
 */
function getComponentMetrics(grid) {
  if (!grid || grid.length === 0 || grid[0].length === 0) {
    return { totalObjects: 0, largestArea: 0 };
  }

  const rows = grid.length;
  const cols = grid[0].length;

  // Visited lookup allocated in flat typed array to avoid grid mutation
  // Cell (r, c) maps to index: r * cols + c
  const visited = new Uint8Array(rows * cols);
  let totalObjects = 0;
  let largestArea = 0;

  const DIRECTIONS = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
  ];

  // Iterative DFS using explicit heap stack
  function exploreComponentIterative(startR, startC) {
    const stack = [[startR, startC]];
    const startIdx = startR * cols + startC;
    visited[startIdx] = 1;
    let currentArea = 0;

    while (stack.length > 0) {
      const [r, c] = stack.pop();
      currentArea++;

      for (let i = 0; i < DIRECTIONS.length; i++) {
        const nr = r + DIRECTIONS[i][0];
        const nc = c + DIRECTIONS[i][1];

        // Boundary checks
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          const neighborIdx = nr * cols + nc;
          if (grid[nr][nc] === 1 && visited[neighborIdx] === 0) {
            visited[neighborIdx] = 1;
            stack.push([nr, nc]);
          }
        }
      }
    }

    return currentArea;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (grid[r][c] === 1 && visited[idx] === 0) {
        totalObjects++;
        const area = exploreComponentIterative(r, c);
        if (area > largestArea) {
          largestArea = area;
        }
      }
    }
  }

  return { totalObjects, largestArea };
}

// Verification & Automated Unit Tests
const testGrid = [
  [1, 1, 0, 0, 0],
  [1, 1, 0, 1, 1],
  [0, 0, 0, 1, 1],
  [0, 0, 0, 0, 0],
  [1, 0, 1, 1, 1]
];

const metrics = getComponentMetrics(testGrid);

// Assertions
assert.strictEqual(metrics.totalObjects, 4); // [4-cells], [4-cells], [1-cell], [3-cells]
assert.strictEqual(metrics.largestArea, 4);

// Test grid immutability: testGrid must not be mutated
assert.strictEqual(testGrid[0][0], 1);
assert.strictEqual(testGrid[1][1], 1);

// Test empty grid
const emptyMetrics = getComponentMetrics([]);
assert.strictEqual(emptyMetrics.totalObjects, 0);
assert.strictEqual(emptyMetrics.largestArea, 0);

console.log('✅ All Stack-Safe Grid DFS assertions passed successfully!');
```

### Solution Explanation
1. **Explicit Heap Stack**: By replacing recursion with `const stack = [[startR, startC]]` and `stack.pop()`, pending nodes reside in the V8 heap, which can handle millions of items without overflowing the call stack.
2. **Flat Typed Array Memory**: `new Uint8Array(rows * cols)` uses 1 byte per cell, creating a compact contiguous memory buffer that prevents caller grid mutation and garbage collection churn.
3. **Coordinate Flattening**: Indexing via `r * cols + c` enables $O(1)$ flat array reads and writes without managing arrays of arrays.

---

## Summary

- **DFS** dives to the deepest point of each path before backtracking, making it the primary tool for connected components and cycle detection.
- **Outer Loop Sweeps** across all vertices $0 \dots V - 1$ guarantee that disconnected partitions are discovered.
- An $M \times N$ grid is an implicit graph of $M \cdot N$ vertices where each cell connects to up to 4 orthogonal neighbors.
- Standard direction delta arrays `[[-1,0], [1,0], [0,-1], [0,1]]` clean up traversal code and reduce out-of-bounds boundary errors.
- Deep or serpentine grid graphs in Node.js must use **iterative DFS** to avoid V8's call stack overflow limit.

---

## Cheat Sheet & Common Pitfalls

| Scenario / Pattern | Anti-Pattern | Recommended Solution |
| :--- | :--- | :--- |
| **Grid Boundary Checks** | Accessing `grid[r][c]` before `r >= 0 && r < rows` | Check index bounds first to avoid `TypeError` |
| **Call Stack Overflow** | Recursive DFS on large $1000 \times 1000$ matrices | Iterative DFS with array stack on heap |
| **Caller State Mutation** | In-place overwrite (`grid[r][c] = 0`) when caller expects purity | Use flat `Uint8Array` visited bitmask |
| **Flood Fill Loops** | Calling DFS when `image[sr][sc] === newColor` | Early exit: `if (image[sr][sc] === newColor) return image` |
| **Disconnected Vertices** | Looping only through edge list | Iterate over all vertices $0 \le v < V$ |

---

## Interview Questions

### 1. How does DFS differ from BFS in terms of memory complexity on a graph?
**Question:** Compare the space complexity of DFS and BFS when traversing an arbitrary graph with maximum branching factor $B$ and depth $D$.

**Answer:**
- **BFS Space Complexity**: Stores vertices in a FIFO queue. At depth $d$, the queue holds all vertices in the frontier level. For a graph with branching factor $B$, the widest level has $O(B^D)$ vertices. In wide, shallow graphs, BFS memory can be enormous.
- **DFS Space Complexity**: Stores only the current active path from source to leaf on the stack. The memory bound is proportional to the maximum path depth: $O(D)$ or $O(V)$ in the worst-case linear path.
- **Summary**: DFS is significantly more memory-efficient than BFS when searching deep graphs with high branching factors, but does not provide the shortest path guarantee for unweighted edges.

---

### 2. Why is iterative DFS preferred over recursive DFS in Node.js backend services?
**Question:** What architectural danger does recursive DFS introduce in a production Node.js environment, and how does the iterative alternative eliminate it?

**Answer:**
1. **The V8 Call Stack Limitation**: In Node.js, the execution call stack size is fixed (typically ~10,000 frames). If a graph contains a long unbranched chain of $20,000$ vertices (or a serpentine 2D grid path), recursive DFS creates an activation record for each step, causing a fatal `RangeError: Maximum call stack size exceeded` and terminating the Node.js process.
2. **Iterative Stack Architecture**: Iterative DFS maintains an explicit array stack in JavaScript heap memory:
   ```javascript
   const stack = [startNode];
   while (stack.length > 0) {
     const curr = stack.pop();
     // explore neighbors...
   }
   ```
   Heap memory can grow to hundreds of megabytes, allowing DFS to traverse millions of nodes safely without overflowing the call stack.

---

### 3. How do you find the total number of connected components in an undirected graph given an edge list?
**Question:** Outline the optimal algorithm to count connected components given vertex count $N$ and edge list `edges`, stating time and space complexity.

**Answer:**
1. Construct an Adjacency List array of size $N$ in $O(N + E)$ time.
2. Allocate a `visited` boolean array of size $N$ initialized to false.
3. Initialize `components = 0`.
4. Loop through each vertex $i$ from $0$ to $N - 1$:
   - If `!visited[i]`, increment `components++` and launch a DFS/BFS traversal starting from $i$ to mark all reachable nodes in that component as visited.
5. Return `components`.

**Complexity**:
- **Time Complexity**: $O(V + E)$ because each vertex and each edge is processed exactly once.
- **Space Complexity**: $O(V + E)$ to store the adjacency list and $O(V)$ for the visited array.

---

### 4. What is the difference between 4-directional and 8-directional connected components on a grid?
**Question:** Explain how neighbor definitions affect connected component calculations on a 2D matrix, and provide the respective direction offset configurations.

**Answer:**
- **4-Directional Connectivity (von Neumann Neighborhood)**: Two cells are adjacent only if they share a common edge (horizontal or vertical):
  ```javascript
  const DIRS_4 = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  ```
  Diagonally touching land cells are considered disconnected, producing a higher count of smaller components.
- **8-Directional Connectivity (Moore Neighborhood)**: Two cells are adjacent if they share either a common edge or a common corner (including diagonals):
  ```javascript
  const DIRS_8 = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1]
  ];
  ```
  Diagonally touching cells merge into a single component, resulting in fewer, larger components.

---

<nav aria-label="Lecture navigation">
  <a href="day-37-graph-traversal-bfs-and-shortest-path.md">◀ Day 37: Graph Traversal: BFS and Shortest Path</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-39-cycle-detection-directed-and-undirected.md">Day 39: Cycle Detection in Directed and Undirected Graphs ▶</a>
</nav>
