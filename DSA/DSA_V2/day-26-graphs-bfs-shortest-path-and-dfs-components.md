# Day 26: Graphs: BFS & DFS

<nav aria-label="Lecture navigation">

[Previous: Binary Search Trees](day-25-binary-search-trees-crud-and-validation.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Directed Graphs & Topological Sort](day-27-cycle-detection-and-topological-sort.md)

</nav>

## Prerequisites

- [Day 15: Queues & Circular Buffers](day-15-queues-circular-buffers-and-design.md) — BFS Queues.
- [Day 22: Grid Backtracking & Mazes](day-22-grid-backtracking-and-n-queens.md) — 2D Matrix traversal.

---

## 1. What is a Graph?

A **Graph** is a network of **Vertices** (nodes) connected by **Edges** (links).

Unlike trees:
- Graphs can have **cycles** (loops).
- Nodes can have any number of connections.
- We must track visited nodes with a `Set` to prevent infinite loops!

```text
Graph:
  (0) ────── (1)
   │        /   \
   │       /     \
  (2) ── (3) ─── (4)
```

### How Graphs are Stored: Adjacency List
The standard way to store a graph in JavaScript is an **Adjacency List** (a Map or array of lists):

```javascript
// Adjacency List representation
const graph = {
  0: [1, 2],
  1: [0, 3, 4],
  2: [0, 3],
  3: [1, 2, 4],
  4: [1, 3]
};
```
- **Memory:** $O(V + E)$ where $V$ is vertices and $E$ is edges.

---

## 2. Graph Traversal: BFS vs DFS

| Algorithm | Data Structure | Best Used For |
| :--- | :--- | :--- |
| **BFS (Breadth-First)** | **Queue** | **Shortest path** in an unweighted graph |
| **DFS (Depth-First)** | **Recursion / Stack** | Exploring all connected components, cycle checks |

```javascript
// BFS Template (Shortest Path)
function bfs(start, graph) {
  const queue = [start];
  const visited = new Set([start]);

  while (queue.length > 0) {
    const node = queue.shift();
    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
}
```

---

## 3. Problem 1: Number of Islands

Given an $m \times n$ 2D grid of `'1'`s (land) and `'0'`s (water), return the count of islands (connected horizontally or vertically).

### The Algorithm: DFS Sink Technique
Whenever we find a `'1'`, increment our island count, then run DFS to "sink" all connected `'1'`s by turning them into `'0'`:

```javascript
// Node.js code: Number of Islands
function numIslands(grid) {
  if (!grid || grid.length === 0) return 0;

  const rows = grid.length;
  const cols = grid[0].length;
  let count = 0;

  function dfs(r, c) {
    // Stop if out of bounds or water
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] === '0') {
      return;
    }

    grid[r][c] = '0'; // Sink current land!

    // Sink adjacent neighbors in 4 directions
    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        count++;
        dfs(r, c); // Sink entire island
      }
    }
  }

  return count;
}

const map = [
  ["1","1","0","0","0"],
  ["1","1","0","0","0"],
  ["0","0","1","0","0"],
  ["0","0","0","1","1"]
];
console.log(numIslands(map)); // 3
```
- **Time Complexity:** $O(m \times n)$ — Each cell visited at most once.
- **Extra Space:** $O(m \times n)$ worst case recursion stack.

---

## 4. Problem 2: Shortest Path in Unweighted Graph

Find the minimum number of steps to reach `target` from `start`.

### Why BFS Finds the Shortest Path:
BFS explores outward in expanding rings ($1$ step away, then $2$ steps away, then $3$). The first time BFS reaches the target, it is **guaranteed to be the shortest path**!

```javascript
// Node.js code: BFS Shortest Path
function shortestPath(graph, start, target) {
  const queue = [[start, 0]]; // [currentNode, distance]
  const visited = new Set([start]);

  while (queue.length > 0) {
    const [node, dist] = queue.shift();

    if (node === target) return dist; // Found shortest path!

    for (const neighbor of graph[node] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, dist + 1]);
      }
    }
  }

  return -1; // Unreachable
}
```
- **Time Complexity:** $O(V + E)$
- **Extra Space:** $O(V)$

---

## 5. Tricky Points and Common Traps

1. **Forgetting `visited.add()` when enqueuing in BFS:** If you add to `visited` when popping from the queue instead of when pushing, duplicate nodes get added to the queue repeatedly, causing memory exhaustion!
2. **Infinite cycles:** Graphs can have loops. Never write a graph traversal without a `visited` Set or in-place marking.
3. **Graph building:** If a graph is **undirected**, every edge `(u, v)` must be added in **both directions**: `adj[u].push(v)` and `adj[v].push(u)`.

---

## 6. Hands-On Exercises

Run this script in Node.js to verify island counting:

```javascript
// Node.js code
const assert = require("node:assert");

function testIslands(grid) {
  let cnt = 0;
  function sink(r, c) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] !== '1') return;
    grid[r][c] = '0';
    sink(r+1,c); sink(r-1,c); sink(r,c+1); sink(r,c-1);
  }
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === '1') { cnt++; sink(r, c); }
    }
  }
  return cnt;
}

const g = [
  ['1', '1', '0'],
  ['0', '1', '0'],
  ['0', '0', '1']
];
assert.equal(testIslands(g), 2);

console.log("✅ Graph DFS assertions passed!");
```

---

## 7. Summary

- **Graphs** connect vertices with edges; can contain cycles.
- **BFS (Queue)** finds the **shortest path** in unweighted networks.
- **DFS (Recursion)** identifies **connected components** (like islands).
- **Visited tracking** is mandatory to prevent infinite loops.

---

## 8. Cheat Sheet

| Algorithm | Structure | Key Rule |
| :--- | :--- | :--- |
| **Graph BFS** | Queue | Mark visited **upon enqueue**; gives shortest path |
| **Graph DFS** | Recursion | Sink land / mark visited upon entry |
| **Adjacency List**| Map / Object | Stores `node -> [neighbors]` in $O(V + E)$ space |

---

## 9. Interview Q&A

### 45-Second Explanation
> *"A Graph consists of vertices connected by edges. For Number of Islands, we scan the 2D grid. Whenever we encounter an unvisited land cell, we increment our island count and trigger a depth-first search to sink all connected land cells by marking them as water. This guarantees every connected component is explored once, running in $O(m \times n)$ time where $m$ and $n$ are the matrix dimensions."*

---

## 10. Practice Problems

### 1. Number of Islands - Medium
Given an `m x n` 2D binary grid `grid` which represents a map of `'1'`s (land) and `'0'`s (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.
- **Input:** `grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]`
- **Expected Output:** `1`
- **Input:** `grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]`
- **Expected Output:** `3`

### 2. Clone Graph - Medium
Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph. Each node in the graph contains a value (`int`) and a list (`List[Node]`) of its neighbors.
- **Input:** `adjList = [[2,4],[1,3],[2,4],[1,3]]`
- **Expected Output:** `[[2,4],[1,3],[2,4],[1,3]]`
- **Input:** `adjList = [[]]`
- **Expected Output:** `[[]]`
- **Input:** `adjList = []`
- **Expected Output:** `[]`

### 3. Rotting Oranges - Medium
You are given an `m x n` grid where each cell can have one of three values: `0` representing an empty cell, `1` representing a fresh orange, or `2` representing a rotten orange. Every minute, any fresh orange that is 4-directionally adjacent to a rotten orange becomes rotten. Return the minimum number of minutes that must elapse until no cell has a fresh orange. If this is impossible, return `-1`.
- **Input:** `grid = [[2,1,1],[1,1,0],[0,1,1]]`
- **Expected Output:** `4`
- **Input:** `grid = [[2,1,1],[0,1,1],[1,0,1]]`
- **Expected Output:** `-1`
- **Input:** `grid = [[0,2]]`
- **Expected Output:** `0`

---

<nav aria-label="Lecture navigation">

[Previous: Binary Search Trees](day-25-binary-search-trees-crud-and-validation.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Directed Graphs & Topological Sort](day-27-cycle-detection-and-topological-sort.md)

</nav>
