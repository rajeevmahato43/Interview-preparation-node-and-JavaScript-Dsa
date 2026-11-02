# Day 26: Graphs: BFS, Shortest Path & DFS Components

<nav aria-label="Lecture navigation">

[Previous: Binary Search Trees](day-25-binary-search-trees-crud-and-validation.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Cycle Detection & Topological Sort](day-27-cycle-detection-and-topological-sort.md)

</nav>

---

## 1. Graph Fundamentals

A **Graph** is a collection of points called **Vertices** (nodes) connected by lines called **Edges**. In fact, a tree is just a simple graph that has no closed loops (cycles).

In real-world graphs, connections can go anywhere:
- Graphs can have **cycles** (loops where you can walk around and end up back where you started).
- Graphs can be **directed** (one-way streets, like following someone on social media) or **undirected** (two-way streets, like mutual friends).
- Graphs can be **disconnected** into separate islands or groups.

Imagine an airline flight map:
- Cities are the nodes, and non-stop flights between them are the edges.
- If you want to fly from Seattle to Miami with the fewest flight stops, you use **Breadth-First Search (BFS)**. BFS checks all direct flights first, then flights with 1 layover, then 2 layovers. The very first time you land in Miami, you are guaranteed to have taken the fewest flights!
- Now imagine a separate island airline flying only between cities in Hawaii. A flight search starting in Seattle will never reach Hawaii. To find every airport in the world, you must run a loop over every city on the map to visit all the separate flight groups (**Connected Components**).

```javascript
// Graph representation using an Adjacency List
class Graph {
  constructor() {
    this.adjacencyList = new Map();
  }

  addVertex(vertex) {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, []);
    }
  }

  addEdge(v1, v2, directed = false) {
    this.addVertex(v1);
    this.addVertex(v2);
    this.adjacencyList.get(v1).push(v2);
    if (!directed) {
      this.adjacencyList.get(v2).push(v1);
    }
  }
}

// Basic Breadth-First Search traversal
function bfsGraph(graph, startVertex) {
  const visited = new Set([startVertex]);
  const queue = [startVertex];
  const order = [];
  let head = 0;

  while (head < queue.length) {
    const vertex = queue[head++];
    order.push(vertex);

    for (const neighbor of graph.adjacencyList.get(vertex) || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor); // Mark visited at enqueue time!
        queue.push(neighbor);
      }
    }
  }

  return order;
}

const flightNetwork = new Graph();
flightNetwork.addEdge("Seattle", "Chicago");
flightNetwork.addEdge("Seattle", "San Francisco");
flightNetwork.addEdge("Chicago", "New York");
flightNetwork.addEdge("San Francisco", "Denver");

console.log("BFS Route Order:", bfsGraph(flightNetwork, "Seattle"));
// Output: [ 'Seattle', 'Chicago', 'San Francisco', 'New York', 'Denver' ]
```

### 1.1 Adjacency List vs Adjacency Matrix

Most real-world networks are spread out (sparse):

- **Adjacency Matrix ($V \times V$ 2D Array):** Checking if two nodes are connected is fast (`matrix[u][v]`), but it wastes huge amounts of memory ($O(V^2)$). In a network of $1,000,000$ users where each has 100 friends, an adjacency matrix allocates $10^{12}$ cells ($\approx 1$ TB of RAM), wasting over 99.99% of memory.
- **Adjacency List (Map or Array of Arrays):** Consumes $O(V + E)$ memory, storing only actual edges. Finding neighbors takes $O(\text{degree}(u))$ time, which is optimal for traversal.

### 1.2 The Enqueue-Time Visited Invariant

Because graphs contain cycles ($A \to B \to C \to A$), traversing without tracking visited nodes creates infinite loops.

> [!NOTE]
> Self-Check: Why MUST we mark a node as `visited` the moment it is ADDED to the queue, instead of waiting until it is removed?
> Answer: If you wait until a node is removed from the queue to mark it visited, multiple neighbors can discover and add that same node to the queue over and over again while it sits waiting. This blows up the queue and crashes Node.js with an out-of-memory error.

```text
Enqueue-Time vs Dequeue-Time Marking:
         A
       /   \
      B     C
       \   /
         D

WRONG (Dequeue-Time):
1. Dequeue A. Enqueue B and C.
2. Dequeue B. Looks at D -> D not visited! Enqueues D.
3. Dequeue C. Looks at D -> D not visited! Enqueues D AGAIN! (Duplicate!)

CORRECT (Enqueue-Time):
1. Queue = [ A ], Visited = { A }
2. Pop A. Add B and C to Queue and IMMEDIATELY add to Visited!
3. Pop B. Looks at D -> Enqueue D and IMMEDIATELY mark D in Visited!
4. Pop C. Looks at D -> D is ALREADY in Visited! Skip! (Zero duplicates)
```

### 1.3 Operations Reference Table

| Graph Operation | Representation | Time Complexity | Space Complexity |
| :--- | :--- | :--- | :--- |
| **Add Vertex** | Adjacency List (`Map`) | $O(1)$ | $O(1)$ |
| **Add Edge** | Adjacency List (`Map`) | $O(1)$ | $O(1)$ |
| **BFS Traversal** | Queue + `Set` | $O(V + E)$ | $O(V)$ |
| **DFS Traversal** | Call stack + `Set` | $O(V + E)$ | $O(V)$ |
| **Shortest Path (Unweighted)** | BFS with distance tracker | $O(V + E)$ | $O(V)$ |
| **Connected Components** | Outer loop + DFS flood fill | $O(V + E)$ | $O(V)$ |

---

## 2. Graph Traversal Patterns

### 2.1 Pattern Family

Graph problems group into three foundational archetypes:

- **Wavefront Shortest Path (BFS):** Explores outwards in concentric circles. The first time the destination node is encountered, the path length is mathematically guaranteed to be the shortest in unweighted graphs.
- **Exhaustive Component Flood Fill (DFS):** Traverses an entire connected cluster before returning. Ideal for counting disconnected islands, regions, and territories.
- **Node Clone & Topology Mapping:** Duplicates a cyclic graph structure by maintaining an object map `Map<OldNode, NewNode>` to wire up cyclic edges correctly without infinite recursion.

### 2.2 Pattern Recognition Table

| Problem Keyword Signal | Underlying Graph Need | Recommended Approach |
| :--- | :--- | :--- |
| "Find shortest path / minimum moves / fewest steps" | Unweighted shortest path | Queue-based BFS with distance tracking |
| "Count number of islands / connected groups" | Find all maximal connected components | DFS or BFS Component Flood Fill |
| "Deep copy / clone a graph containing cycles" | Preserve structural pointers with cycles | BFS/DFS with `Map<Original, Clone>` |
| "Shortest path in grid moving 8 directions" | Matrix shortest path | 8-directional BFS with enqueue-time mark |
| "Check if all nodes can be colored with 2 colors" | Bipartite verification | BFS/DFS 2-Coloring check |

### 2.3 When to Use vs When NOT to Use

- **Use BFS when:**
  - You need the shortest path or minimum number of transitions in an unweighted graph.
  - You need to search outward from multiple sources simultaneously (Multi-Source BFS).
- **Use DFS when:**
  - You need to count or label connected components.
  - You need in-place matrix flood filling with low code complexity.
  - You need to detect cycles in directed graphs (via 3-color state tracking).
- **When NOT to use BFS:**
  - Finding shortest paths in **weighted** graphs (where edges have different costs). Use Dijkstra's Algorithm ($O((V + E) \log V)$) or Bellman-Ford instead.

### 2.4 The 10^7 Operations Rule

Graph algorithms traverse vertices and edges in $O(V + E)$ time:
- In sparse graphs where $V = 100,000$ and $E = 200,000$, $V + E = 300,000$ operations execute in roughly 15 milliseconds.
- However, if `visited` marking is deferred to dequeue time or `Array.prototype.shift()` is used on a dense graph, total operations explode to $O(V \cdot E) \approx 2 \times 10^{10}$, freezing the Node.js event loop for seconds.

---

## 3. Problem Walkthroughs

### 3.1 Number of Islands

#### 3.1.1 Problem Statement
Given an $m \times n$ 2D binary grid `grid` which represents a map of `'1'`s (land) and `'0'`s (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically (4 directions).

- **Input:**
  ```text
  grid = [
    ["1","1","0","0","0"],
    ["1","1","0","0","0"],
    ["0","0","1","0","0"],
    ["0","0","0","1","1"]
  ]
  ```
- **Output:** `3`
- **Constraints:** $1 \le m, n \le 300$, `grid[i][j]` is `'0'` or `'1'`.

#### 3.1.2 How to Think About It
Imagine looking down at an ocean with islands from an airplane. You scan the map from top to bottom, left to right. When you spot land (`'1'`), you add 1 to your island counter. Then you immediately sink that entire island into the ocean by turning all connected land cells into water (`'0'`). You keep scanning. Any new land you find later must belong to a completely different island!

#### 3.1.3 Brute Force Approach & Bottleneck
Allocating a separate $M \times N$ boolean `visited` matrix and checking `!visited[r][c]`:

```javascript
function numIslandsNaive(grid) {
  const visited = Array.from({ length: grid.length }, () => new Array(grid[0].length).fill(false));
  // Double indexing: checks both grid[r][c] === '1' and !visited[r][c]
  // Consumes O(M * N) auxiliary heap space
}
```

The bottleneck is auxiliary memory allocation. Creating a 2D array on the V8 heap creates hundreds of array objects, increasing garbage collection overhead.

#### 3.1.4 The Pattern Insight
Change the grid directly in-place: whenever a `'1'` is encountered, run a DFS helper that sets `grid[r][c] = '0'` and recursively sinks all 4 adjacent neighbors. Once sunk, future scans naturally skip those cells. Auxiliary heap memory is strictly $O(1)$.

#### 3.1.5 Pseudocode
```text
function numIslands(grid):
    if grid is empty: return 0
    count = 0

    function sink(r, c):
        if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] == '0':
            return
        grid[r][c] = '0' // sink land
        sink(r + 1, c)
        sink(r - 1, c)
        sink(r, c + 1)
        sink(r, c - 1)

    for r from 0 to rows - 1:
        for c from 0 to cols - 1:
            if grid[r][c] == '1':
                count++
                sink(r, c)

    return count
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal In-Place Component Flood Fill DFS
function numIslands(grid) {
  if (!grid || grid.length === 0) return 0;

  const rows = grid.length;
  const cols = grid[0].length;
  let count = 0;

  function sink(r, c) {
    // Boundary check and water check
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] === '0') {
      return;
    }

    // In-place sinking: mutate land '1' to water '0'
    grid[r][c] = '0';

    // Sink all 4 orthogonal neighbors
    sink(r + 1, c); // Down
    sink(r - 1, c); // Up
    sink(r, c + 1); // Right
    sink(r, c - 1); // Left
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        count++;
        sink(r, c); // Sinks entire connected component
      }
    }
  }

  return count;
}

const mapData = [
  ["1","1","0","0","0"],
  ["1","1","0","0","0"],
  ["0","0","1","0","0"],
  ["0","0","0","1","1"]
];

console.log("Number of Islands:", numIslands(mapData));
// Output: 3
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Allowing diagonal moves in Number of Islands
sink(r + 1, c + 1); // Connecting diagonals violates the 4-direction constraint!
```

Number of Islands strictly specifies horizontal and vertical connections. Including diagonal steps merges distinct islands together.

#### 3.1.8 Complexity Derivation
- **Time Complexity:** $O(M \cdot N)$. Every cell is inspected at most twice: once by the outer scanning loops and once by the DFS sinking process.
- **Auxiliary Space Complexity:** $O(M \cdot N)$ worst case for the recursion call stack if the entire grid is land. Auxiliary heap space is $O(1)$.

---

### 3.2 Shortest Path in Binary Matrix

#### 3.2.1 Problem Statement
Given an $n \times n$ binary matrix `grid`, return the length of the shortest clear path in the matrix. If there is no clear path, return `-1`. A clear path connects the top-left cell `(0, 0)` to the bottom-right cell `(n - 1, n - 1)` such that:
- All visited cells are `0`.
- All adjacent cells are 8-directionally connected (horizontal, vertical, diagonal).
- The length is the number of visited cells along the path.

- **Input:** `grid = [[0, 0, 0], [1, 1, 0], [1, 1, 0]]`
- **Output:** `4` (Path: `(0,0) -> (0,1) -> (1,2) -> (2,2)`)
- **Constraints:** $n == grid.length == grid[i].length$, $1 \le n \le 100$, `grid[i][j]` is `0` or `1`.

#### 3.2.2 How to Think About It
Imagine dropping a splash of water at the top-left square `(0, 0)`. The water spreads outward to all open neighbor squares (`0`) in all 8 directions at a speed of 1 step per second. The very first second that water touches the bottom-right corner `(n - 1, n - 1)`, that time is guaranteed to be the shortest path!

#### 3.2.3 Brute Force Approach & Bottleneck
Using DFS to explore all paths:
DFS wanders deep down winding paths that hit dead ends or take inefficient detours. Finding the minimum length via DFS requires evaluating every possible path ($O(8^{N^2})$), which will freeze or stack-overflow on any matrix larger than $5 \times 5$.

#### 3.2.4 The Pattern Insight
Use Queue-based Breadth-First Search (BFS):
1. Verify `grid[0][0] === 0` and `grid[n-1][n-1] === 0`.
2. Push `[0, 0, 1]` to the queue and immediately mark `grid[0][0] = 1` (enqueue-time visited marking).
3. Dequeue using an advancing `head` pointer.
4. For each cell, check all 8 directional neighbors:
   - If neighbor is in bounds and equals `0`:
     - If neighbor is `(n - 1, n - 1)`, return `dist + 1`.
     - Otherwise, set `grid[nr][nc] = 1` and push `[nr, nc, dist + 1]`.

#### 3.2.5 Pseudocode
```text
function shortestPathBinaryMatrix(grid):
    n = grid.length
    if grid[0][0] != 0 or grid[n-1][n-1] != 0: return -1
    if n == 1: return 1

    queue = [[0, 0, 1]]
    grid[0][0] = 1 // enqueue-time mark
    head = 0

    while head < queue.length:
        [r, c, dist] = queue[head++]
        for [dr, dc] in all 8 directions:
            nr = r + dr, nc = c + dc
            if inBounds(nr, nc) and grid[nr][nc] == 0:
                if nr == n - 1 and nc == n - 1:
                    return dist + 1
                grid[nr][nc] = 1 // enqueue mark
                queue.push([nr, nc, dist + 1])

    return -1
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal 8-Directional Shortest Path BFS
function shortestPathBinaryMatrix(grid) {
  const n = grid.length;

  // Immediate boundary rejection
  if (grid[0][0] !== 0 || grid[n - 1][n - 1] !== 0) {
    return -1;
  }
  if (n === 1) return 1;

  // 8 orthogonal and diagonal direction vectors
  const DIRECTIONS = [
    [-1, -1], [-1,  0], [-1,  1],
    [ 0, -1],           [ 0,  1],
    [ 1, -1], [ 1,  0], [ 1,  1]
  ];

  const queue = [[0, 0, 1]]; // [row, col, distance]
  let head = 0;

  // Enqueue-time visited marking
  grid[0][0] = 1;

  while (head < queue.length) {
    const [r, c, dist] = queue[head++];

    for (const [dr, dc] of DIRECTIONS) {
      const nr = r + dr;
      const nc = c + dc;

      if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] === 0) {
        if (nr === n - 1 && nc === n - 1) {
          return dist + 1; // Shortest path reached
        }

        grid[nr][nc] = 1; // Mark visited immediately at enqueue time!
        queue.push([nr, nc, dist + 1]);
      }
    }
  }

  return -1;
}

const matrix = [
  [0, 0, 0],
  [1, 1, 0],
  [1, 1, 0]
];

console.log("Shortest Clear Path:", shortestPathBinaryMatrix(matrix));
// Output: 4
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Delaying visited marking to dequeue time
const [r, c, dist] = queue[head++];
grid[r][c] = 1; // Too late! Neighbors have already pushed duplicates.
```

Delaying visited marking allows multiple adjacent cells to enqueue the same open coordinate, causing the queue to swell exponentially and slowing down execution.

#### 3.2.8 Complexity Derivation
- **Time Complexity:** $O(N^2)$ strictly. There are $N^2$ cells, each having at most 8 edges. Each cell is enqueued at most once.
- **Auxiliary Space Complexity:** $O(N^2)$ worst case for the queue buffer. Auxiliary heap space is $O(1)$ beyond the queue.

---

### 3.3 Clone Graph

#### 3.3.1 Problem Statement
Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph. Each node in the graph contains a value (`val`) and a list of its neighbors (`neighbors`).

- **Input:** `adjList = [[2,4],[1,3],[2,4],[1,3]]`
- **Output:** Cloned graph with identical topology.
- **Constraints:** Number of nodes is in range $[0, 100]$, $1 \le Node.val \le 100$, values are unique, no self-loops or repeated edges.

#### 3.3.2 How to Think About It
Imagine copying a spiderweb of cards connected by strings in loops. If you copy card 1 and follow its strings, you make card 2. But card 2 has a string pointing right back to card 1! If you blindly make another card 1, you will keep making cards forever in an infinite loop. You need a notebook: whenever you make a clone of a card, write it down (`Map<OriginalCard, ClonedCard>`). When connecting strings, check the notebook first to see if that card was already cloned!

#### 3.3.3 Brute Force Approach & Bottleneck
Recursively copying neighbors without maintaining an original-to-clone hash map:
Because graphs contain cycles, recursing without recording previously cloned instances causes infinite recursion and crashes with `RangeError: Maximum call stack size exceeded`.

#### 3.3.4 The Pattern Insight
Use a `Map` where the key is the original `Node` instance and the value is the newly created cloned `Node` instance.
1. When visiting `node`:
   - If `node` is already in `clonesMap`, return `clonesMap.get(node)`.
2. Otherwise, create `const clone = new Node(node.val)`.
3. Store in map: `clonesMap.set(node, clone)`.
4. Iterate through `node.neighbors`: recursively call clone on each neighbor and push the result into `clone.neighbors`.

#### 3.3.5 Pseudocode
```text
function cloneGraph(node):
    if node is null: return null
    clones = Map()

    function dfs(curr):
        if clones.has(curr):
            return clones.get(curr)

        clone = Node(curr.val)
        clones.set(curr, clone)

        for neighbor in curr.neighbors:
            clone.neighbors.push(dfs(neighbor))

        return clone

    return dfs(node)
```

#### 3.3.6 Optimal Solution

```javascript
// Definition for a Node
class GraphNode {
  constructor(val = 0, neighbors = []) {
    this.val = val;
    this.neighbors = neighbors;
  }
}

// ✅ CORRECT: Optimal Graph Cloning with Map Registry
function cloneGraph(node) {
  if (!node) return null;

  // Map to store reference pairs: OriginalNode -> ClonedNode
  const clones = new Map();

  function dfs(curr) {
    // If node was already cloned, return existing cloned reference
    if (clones.has(curr)) {
      return clones.get(curr);
    }

    // 1. Create shallow clone of current node
    const clone = new GraphNode(curr.val);
    clones.set(curr, clone);

    // 2. Recursively clone and wire up all neighbors
    for (const neighbor of curr.neighbors) {
      clone.neighbors.push(dfs(neighbor));
    }

    return clone;
  }

  return dfs(node);
}

// Test construction: 1 <-> 2
const node1 = new GraphNode(1);
const node2 = new GraphNode(2);
node1.neighbors.push(node2);
node2.neighbors.push(node1);

const cloned = cloneGraph(node1);
console.log("Cloned Root Val:", cloned.val);
console.log("Cloned Neighbor Val:", cloned.neighbors[0].val);
console.log("Preserved Cyclic Link:", cloned.neighbors[0].neighbors[0] === cloned); // Output: true
console.log("Distinct Memory Instance:", cloned !== node1);                          // Output: true
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Using a Set to track visited instead of Map
// A Set tracks if a node was visited, but cannot retrieve
// the corresponding cloned node pointer to link neighbors!
```

A `Set` only records visitation status; a `Map` is strictly necessary to link existing cloned object references to neighbor arrays.

#### 3.3.8 Complexity Derivation
- **Time Complexity:** $O(V + E)$ strictly. Every vertex is visited once and every edge is traversed once.
- **Auxiliary Space Complexity:** $O(V)$ for the `clones` hash map and the DFS call stack.

---

## 4. Tricky Edge Cases

- **Disconnected Components:** If a graph contains unreachable components, a single BFS/DFS from a single source will not visit all nodes. Use an outer loop over all vertices.
- **Blocked Starting/Ending Points:** In grid shortest path searches, verify that `(0, 0)` and `(n - 1, n - 1)` are not blocked before starting BFS.
- **Cycles in Undirected Graphs:** An edge between $u$ and $v$ connects both ways. When checking for cycles, always exclude the immediate `parent` node so two-way edges are not mistaken for cycles.
- **Dense Graph Queue Swelling:** Always mark nodes as visited at enqueue time to prevent identical nodes from being pushed multiple times.

---

## 5. Summary Cheat Sheet

- **BFS** explores in concentric wavefronts. It is the definitive algorithm for unweighted shortest path.
- **DFS** dives deep along one path. It is ideal for component counting and matrix flood fills.
- **Enqueue-Time Marking:** Add to `visited` at the moment of `queue.push()` to prevent $O(2^V)$ duplicate queue swelling.
- **In-Place Sinking:** Mutating grid cells (`'1' -> '0'`) saves $O(M \cdot N)$ auxiliary memory.
- **Adjacency Lists:** Store sparse graphs in $O(V + E)$ memory, outperforming $O(V^2)$ adjacency matrices.

---

## 6. Practice Problems

### 6.1 Max Area of Island

- **Input:** 2D binary grid of `'0'`s and `'1'`s.
- **Output:** Maximum area (count of connected `'1'`s) of an island.
- **Constraint:** $1 \le m, n \le 50$.
- **Hint 1:** Use DFS component flood fill.
- **Hint 2:** The recursive helper sinks the cell and returns $1 + \sum(\text{neighbors})$.
- **Hint 3:** Track the maximum area across all island roots in the outer loops.

### 6.2 Word Ladder

- **Input:** `beginWord = "hit"`, `endWord = "cog"`, `wordList = ["hot","dot","dog","lot","log","cog"]`
- **Output:** `5` (shortest transformation sequence length)
- **Constraint:** Each transformation changes exactly 1 character.
- **Hint 1:** Model this as an unweighted shortest path graph problem.
- **Hint 2:** Use BFS starting from `beginWord`.
- **Hint 3:** Generate all 1-character variations (`hot`, `lot`) and verify existence against a `Set` of words.

### 6.3 Is Graph Bipartite?

- **Input:** Adjacency list `graph`.
- **Output:** `true` if vertices can be split into two sets such that no two adjacent vertices share the same set.
- **Constraint:** Graph may be disconnected.
- **Hint 1:** Maintain an array `colors` initialized to `0` (unvisited).
- **Hint 2:** Color nodes with `1` and `-1` using BFS/DFS.
- **Hint 3:** If a neighbor has the same color as the current node, the graph is not bipartite.

---

<nav aria-label="Lecture navigation">

[Previous: Binary Search Trees](day-25-binary-search-trees-crud-and-validation.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Cycle Detection & Topological Sort](day-27-cycle-detection-and-topological-sort.md)

</nav>
