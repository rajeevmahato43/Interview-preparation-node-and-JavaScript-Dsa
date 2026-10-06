# Day 36: Graph Representations and Modeling

<nav aria-label="Lecture navigation">
  <a href="day-35-lowest-common-ancestor-and-serialization.md">◀ Day 35: Lowest Common Ancestor and Serialization</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-37-graph-traversal-bfs-and-shortest-path.md">Day 37: Graph Traversal: BFS and Shortest Path ▶</a>
</nav>

---

## Learning Outcomes

- Understand core graph theory terminology: vertices ($V$), directed and undirected edges ($E$), edge weights, paths, cycles, degrees, and connected components.
- Implement graph data structures in JavaScript using both **Adjacency Lists** (`Map` and array of arrays) and **Adjacency Matrices** (`2D TypedArray` or regular arrays).
- Formally evaluate time and space complexity tradeoffs ($O(V + E)$ vs. $O(V^2)$) to pick the optimal representation for dense versus sparse topologies.
- Convert raw tabular edge lists (`[u, v, weight]`) into normalized, high-performance graph structures with constant-time neighbor iteration.
- Model production backend domains (microservice call dependency graphs, permission DAGs, social network connections) in Node.js while profiling V8 heap memory overhead.
- Diagnose and prevent graph anti-patterns in JavaScript including shared row references, implicit object string keys, and quadratic memory allocation crashes.

---

## Prerequisites

- [Day 02: Arrays, Sets, Maps, and Hash Tables](day-02-arrays-sets-maps-and-hash-tables.md) — Fundamental key-value lookups, hash collision internals, and `Map`/`Set` memory overhead.
- [Day 31: Binary Tree Fundamentals and DFS](day-31-binary-tree-fundamentals-and-dfs.md) — Node-and-pointer data structures and recursion over connected hierarchical nodes.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
| :--- | :--- | :--- |
| **Vertex / Node ($V$)** | An individual entity or data point within a network. | Determines the space baseline of graph storage and memory allocations. |
| **Edge ($E$)** | A link connecting two vertices; can be directed, undirected, weighted, or unweighted. | Governs traversal bounds and memory consumption; a simple graph has at most $V(V-1)/2$ undirected edges. |
| **Adjacency List** | A collection where each vertex maps directly to a list or array of its adjacent neighbors. | Optimal $O(V + E)$ space for sparse graphs ($E \ll V^2$); standard default in 95% of engineering interviews. |
| **Adjacency Matrix** | A $V \times V$ 2D matrix where cell `[u][v]` stores the boolean existence or numerical weight of edge $(u, v)$. | Provides $O(1)$ edge existence checks, but consumes rigid $O(V^2)$ memory and $O(V)$ neighbor iteration. |
| **Sparse vs. Dense** | A sparse graph has $E \approx O(V)$; a dense graph approaches $E \approx O(V^2)$. | Choosing a matrix for a sparse graph with $V = 100,000$ exhausts V8 heap memory instantly. |
| **In-Degree / Out-Degree** | Number of directed edges entering (in) or leaving (out) a specific vertex. | Fundamental invariant for Kahn's topological sort and dependency resolution engines. |

---

## Core Concepts & Mechanical Architecture

### 1. Mathematical Definitions and Graph Morphologies

A **Graph** $G = (V, E)$ is a non-linear data structure consisting of a finite set of vertices $V$ and a collection of edges $E$ connecting pairs of vertices. Unlike trees—which are restricted to being connected, acyclic, undirected graphs with exactly $|V| - 1$ edges and a single root—general graphs permit arbitrary interconnection topologies, disconnected partitions, self-loops, and cycles.

```text
Graph Topologies:
1. Undirected Graph:            2. Directed Graph (Digraph):     3. Weighted Directed Graph:
   (A) ------- (B)                 (A) -------> (B)                 (A) --(5.2ms)--> (B)
    |           |                   |            |                   |                |
    |           |                   v            v                 (1.1ms)          (3.8ms)
   (C) ------- (D)                 (C) <------- (D)                  v                v
   Edge (A, B) is bidirectional    Edge A -> B is strictly one-way  (C) <--(-0.5ms)- (D)

Key Properties:
- In-Degree of (C) in Digraph: 2 incoming edges (from A, D)
- Out-Degree of (A) in Digraph: 2 outgoing edges (to B, C)
```

In undirected graphs, an edge between $u$ and $v$ denotes a symmetric relationship: $u$ is adjacent to $v$, and $v$ is adjacent to $u$. In directed graphs (digraphs), edge $(u, v)$ originates at source $u$ and terminates at destination $v$.

---

### 2. Adjacency List vs. Adjacency Matrix Tradeoffs

An **Adjacency Matrix** is a 2D grid of dimensions $|V| \times |V|$ where cell `matrix[u][v]` is non-zero if an edge exists from $u$ to $v$. An **Adjacency List** associates each vertex $u$ with an array or linked list containing only its outgoing neighbors.

```text
Graph with 4 vertices V = {0, 1, 2, 3}:
Edges: (0, 1), (0, 2), (1, 3), (2, 3) [Undirected]

Representation A: Adjacency Matrix           Representation B: Adjacency List
         0   1   2   3                           Index / Key -> Neighbors
     0 [[0,  1,  1,  0],                            0  ->  [1, 2]
     1  [1,  0,  0,  1],                            1  ->  [0, 3]
     2  [1,  0,  0,  1],                            2  ->  [0, 3]
     3  [0,  1,  1,  0]]                            3  ->  [1, 2]
```

| Operation | Adjacency List (Array of Arrays) | Adjacency List (`Map<u, Set<v>>`) | Adjacency Matrix (`2D Array`) |
| :--- | :--- | :--- | :--- |
| **Space Complexity** | $O(V + E)$ (Optimal sparse) | $O(V + E)$ (Higher per-node overhead) | $O(V^2)$ (Rigid fixed footprint) |
| **Check Edge $(u, v)$** | $O(\text{deg}(u))$ scan | $O(1)$ average hash lookup | $O(1)$ direct array index |
| **Iterate Out-Neighbors of $u$** | $O(\text{deg}(u))$ exact | $O(\text{deg}(u))$ exact | $O(V)$ (must scan entire row) |
| **Add Vertex** | $O(1)$ amortized push | $O(1)$ amortized map insert | $O(V)$ reallocate row & columns |
| **Add Edge $(u, v)$** | $O(1)$ push | $O(1)$ set insert | $O(1)$ slot assignment |
| **Remove Edge $(u, v)$** | $O(\text{deg}(u))$ splice | $O(1)$ set delete | $O(1)$ slot zeroing |

---

### 3. Sparse vs. Dense Topology and V8 Heap Impact

A graph is **sparse** when $|E| \ll |V|^2$ (typically $|E| \approx O(|V|)$), which describes almost all real-world software graphs: social networks, web page hyper-links, road transport nets, and microservice topologies. A graph is **dense** when $|E| \approx |V|^2$, meaning nearly all possible vertex pairs share an edge.

```javascript
// Node.js code: Memory comparison of Sparse Graph in V8 Heap
// Scenario: V = 50,000 vertices, Average Degree = 4 (E = 100,000 edges)

// ❌ WRONG: Allocating an Adjacency Matrix for a sparse graph
// 50,000 x 50,000 elements = 2,500,000,000 32-bit integers = ~10 GB RAM!
// Crashes immediately with JavaScript heap out of memory.
function createMatrixSparseCrash(V) {
  // Danger: Will throw FATAL ERROR: Reached heap limit Allocation failed
  // const matrix = Array.from({ length: V }, () => new Uint8Array(V));
  return 'Fatal OOM if V >= 50000';
}

// ✅ RIGHT: Allocating an Adjacency List for a sparse graph
// 50,000 vertex arrays + 200,000 integer entries = ~12 MB total RAM!
function createAdjacencyList(V) {
  const adjList = Array.from({ length: V }, () => []);
  return adjList;
}

const list = createAdjacencyList(50000);
list[0].push(1, 2);
list[1].push(0, 3);
console.log(`Sparse list vertices allocated: ${list.length}`);
```

---

### 4. Implementation: Production-Grade Graph Class

An idiomatic, flexible JavaScript graph representation must support both directed and undirected edges, optional edge weights, and string or integer vertex keys using `Map`.

```javascript
// Node.js code: General Adjacency List Graph Class
class Graph {
  /**
   * @param {boolean} isDirected
   */
  constructor(isDirected = false) {
    this.isDirected = isDirected;
    /** @type {Map<string | number, Array<{ node: string | number, weight: number }>>} */
    this.adjacencyList = new Map();
  }

  /**
   * Registers a vertex if it does not already exist.
   * @param {string | number} vertex
   */
  addVertex(vertex) {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, []);
    }
  }

  /**
   * Adds an edge between u and v with an optional weight.
   * @param {string | number} u
   * @param {string | number} v
   * @param {number} [weight=1]
   */
  addEdge(u, v, weight = 1) {
    this.addVertex(u);
    this.addVertex(v);

    this.adjacencyList.get(u).push({ node: v, weight });

    if (!this.isDirected) {
      this.adjacencyList.get(v).push({ node: u, weight });
    }
  }

  /**
   * Retrieves all outgoing adjacent neighbors of vertex u.
   * @param {string | number} u
   * @returns {Array<{ node: string | number, weight: number }>}
   */
  getNeighbors(u) {
    return this.adjacencyList.get(u) || [];
  }

  /**
   * Checks whether a directed edge exists from u to v.
   * Time Complexity: O(deg(u))
   * @param {string | number} u
   * @param {string | number} v
   * @returns {boolean}
   */
  hasEdge(u, v) {
    const neighbors = this.adjacencyList.get(u);
    if (!neighbors) return false;
    return neighbors.some(edge => edge.node === v);
  }

  /**
   * Removes an edge from u to v (and v to u if undirected).
   * @param {string | number} u
   * @param {string | number} v
   */
  removeEdge(u, v) {
    const uList = this.adjacencyList.get(u);
    if (uList) {
      this.adjacencyList.set(u, uList.filter(edge => edge.node !== v));
    }
    if (!this.isDirected) {
      const vList = this.adjacencyList.get(v);
      if (vList) {
        this.adjacencyList.set(v, vList.filter(edge => edge.node !== u));
      }
    }
  }

  /**
   * Removes a vertex and all incoming/outgoing incident edges.
   * Time Complexity: O(V + E)
   * @param {string | number} vertex
   */
  removeVertex(vertex) {
    if (!this.adjacencyList.has(vertex)) return;

    // Remove incident incoming edges from all other vertices
    for (const [u, edges] of this.adjacencyList.entries()) {
      if (u === vertex) continue;
      this.adjacencyList.set(
        u,
        edges.filter(edge => edge.node !== vertex)
      );
    }

    // Delete vertex entry itself
    this.adjacencyList.delete(vertex);
  }
}

// Verification
const network = new Graph(false);
network.addEdge('auth-service', 'user-db', 2.4);
network.addEdge('auth-service', 'redis-cache', 0.8);
console.log('Auth neighbors:', network.getNeighbors('auth-service'));
console.log('Has edge auth -> user-db?', network.hasEdge('auth-service', 'user-db'));
```

---

### 5. Converting Tabular Edge Lists to Adjacency Structures

In interview challenges (LeetCode / HackerRank) and database query results, graphs arrive as a list of edge pairs: `edges = [[0, 1], [0, 2], [1, 2], [2, 3]]`. Converting edge lists to normalized adjacency lists in $O(V + E)$ time is step zero for any graph traversal algorithm.

```javascript
// Node.js code: Normalized Edge List to Adjacency List Converter
/**
 * Converts a raw edge list into an indexed array adjacency list.
 * @param {number} numVertices
 * @param {Array<[number, number]>} edges
 * @param {boolean} [isDirected=false]
 * @returns {number[][]}
 */
function buildGraph(numVertices, edges, isDirected = false) {
  // Allocate V independent empty neighbor arrays
  const adjList = Array.from({ length: numVertices }, () => []);

  for (let i = 0; i < edges.length; i++) {
    const [u, v] = edges[i];
    adjList[u].push(v);
    if (!isDirected) {
      adjList[v].push(u);
    }
  }

  return adjList;
}

// Step-by-Step Execution Trace:
// Input: numVertices = 4, edges = [[0, 1], [1, 2], [2, 3], [3, 0]], isDirected = false
// 1. Initial allocation: [[], [], [], []]
// 2. Edge [0, 1]: adjList[0].push(1), adjList[1].push(0) -> [[1], [0], [], []]
// 3. Edge [1, 2]: adjList[1].push(2), adjList[2].push(1) -> [[1], [0, 2], [1], []]
// 4. Edge [2, 3]: adjList[2].push(3), adjList[3].push(2) -> [[1], [0, 2], [1, 3], [2]]
// 5. Edge [3, 0]: adjList[3].push(0), adjList[0].push(3) -> [[1, 3], [0, 2], [1, 3], [2, 0]]
const graph = buildGraph(4, [[0, 1], [1, 2], [2, 3], [3, 0]], false);
console.log('Normalized AdjList:', graph);
```

---

## Detailed Node.js Relevance

### Microservice Topologies and Blast Radius Analysis

In Node.js enterprise microservices, services communicate over HTTP/gRPC, creating a directed call dependency graph.

```text
Microservice Dependency Graph:
      [API Gateway]
         /     \
        v       v
   [Order Svc]  [Auth Svc]
        |          |
        v          v
   [Inventory]  [Postgres DB]
        |
        v
    [Kafka]
```

1. **Failure Cascade Modeling**: When `[Postgres DB]` degrades, traversing incoming edges (in-degree propagation) in the inverted graph identifies all upstream services that will experience timeout cascade failures (`Auth Svc` and `API Gateway`).
2. **V8 GC and Pointer Chasing**: In an Adjacency List implemented with plain objects `{ [key]: [] }`, keys are coerced to strings, forcing V8 to allocate string shapes and hidden classes (`Map` objects in V8 C++ internals). Using a zero-indexed `Array` of typed arrays (`Int32Array`) keeps integer memory flat, contiguous, and cache-line friendly, preventing garbage collection pauses during high-throughput real-time routing.

---

## Tricky Points & Edge Cases

1. **Array Reference Cloning Trap with `fill()`**:
   ```javascript
   // ❌ CRITICAL BUG: All rows reference the exact same memory array!
   const badMatrix = new Array(3).fill(new Array(3).fill(0));
   badMatrix[0][1] = 1;
   console.log(badMatrix[1][1]); // 1! Mutated every single row simultaneously!

   // ✅ CORRECT: Allocate a fresh array instance for each row
   const goodMatrix = Array.from({ length: 3 }, () => new Array(3).fill(0));
   goodMatrix[0][1] = 1;
   console.log(goodMatrix[1][1]); // 0, correctly isolated.
   ```
2. **0-Indexed vs. 1-Indexed Vertices**: Real-world datasets or interview challenges frequently number vertices from $1$ to $N$. Allocating an array of length $N$ causes an index out-of-bounds crash on vertex $N$. Either allocate length $N + 1$ (ignoring index 0) or normalize all vertex IDs down by 1 (`u - 1`).
3. **Disconnected Components and Isolated Vertices**: Vertices with degree 0 (no incoming or outgoing edges) are valid graph members. An adjacency list must allocate an empty entry `[]` for isolated vertices; otherwise, traversal loops will fail when referencing `adjList[v]`.
4. **Self-Loops and Parallel Edges (Multigraphs)**: An edge `(u, u)` is a self-loop. Multiple edges between the same pair `(u, v)` with different weights are parallel edges. If uniqueness is required, use `Set` instead of `Array` for neighbor storage.

---

## Hands-On Exercise

### Scenario
You are developing an architectural tracing tool for a Node.js microservice mesh. You receive a directed edge list representing service dependencies `[upstreamServiceId, downstreamServiceId]`. You must write a function `calculateServiceMetrics(numServices, edges)` that calculates:
1. `inDegree`: Count of incoming dependencies for each service.
2. `outDegree`: Count of outgoing dependencies for each service.
3. `bottleneckServices`: Services whose `inDegree` is strictly greater than average in-degree across all services.

### Buggy Code
```javascript
function calculateServiceMetrics(numServices, edges) {
  // BUG: Shared array reference via fill
  const inDegree = new Array(numServices).fill(0);
  const outDegree = new Array(numServices).fill(0);

  for (let i = 0; i <= edges.length; i++) {
    const [u, v] = edges[i];
    // BUG: Off-by-one loop boundary and reversed directions
    inDegree[u]++;
    outDegree[v]++;
  }

  const avgIn = inDegree.reduce((a, b) => a + b) / numServices;
  const bottlenecks = inDegree.filter(deg => deg > avgIn); // BUG: Returns degrees, not service IDs

  return { inDegree, outDegree, bottlenecks };
}
```

### Acceptance Criteria
- Return exact arrays for `inDegree` and `outDegree` of length `numServices`.
- Accurately identify bottleneck service indices whose incoming dependencies exceed the system mean.
- Support disconnected nodes (nodes with 0 in-degree and 0 out-degree).
- Must run in $O(V + E)$ time and $O(V)$ auxiliary space.

### Solution Code
```javascript
const assert = require('assert');

// Node.js code: Robust Service Mesh Metric Calculator
/**
 * @param {number} numServices
 * @param {Array<[number, number]>} edges
 * @returns {{ inDegree: number[], outDegree: number[], bottlenecks: number[] }}
 */
function calculateServiceMetrics(numServices, edges) {
  if (numServices <= 0) {
    return { inDegree: [], outDegree: [], bottlenecks: [] };
  }

  const inDegree = new Array(numServices).fill(0);
  const outDegree = new Array(numServices).fill(0);

  // Correct loop bounds: iterate strictly over edges
  for (let i = 0; i < edges.length; i++) {
    const [u, v] = edges[i];
    outDegree[u]++; // u calls v -> out-degree of u increments
    inDegree[v]++;  // v is called by u -> in-degree of v increments
  }

  // Calculate mean in-degree (total incoming edges / V)
  let totalIn = 0;
  for (let i = 0; i < numServices; i++) {
    totalIn += inDegree[i];
  }
  const meanInDegree = totalIn / numServices;

  // Identify service indices whose incoming count exceeds mean
  const bottlenecks = [];
  for (let i = 0; i < numServices; i++) {
    if (inDegree[i] > meanInDegree) {
      bottlenecks.push(i);
    }
  }

  return { inDegree, outDegree, bottlenecks };
}

// Verification & Automated Unit Tests
const testEdges = [
  [0, 2], // Gateway -> DB
  [1, 2], // Auth -> DB
  [3, 2], // Order -> DB
  [0, 1], // Gateway -> Auth
];
const result = calculateServiceMetrics(4, testEdges);

// Assertions
assert.deepStrictEqual(result.inDegree, [0, 1, 3, 0]);
assert.deepStrictEqual(result.outDegree, [2, 1, 0, 1]);
assert.strictEqual(result.bottlenecks.length, 1);
assert.strictEqual(result.bottlenecks[0], 2); // DB (node 2) has inDegree 3 > mean (4/4 = 1.0)

// Test with zero edges
const emptyResult = calculateServiceMetrics(2, []);
assert.deepStrictEqual(emptyResult.inDegree, [0, 0]);
assert.deepStrictEqual(emptyResult.bottlenecks, []);

console.log('✅ All Service Mesh Graph Metric assertions passed successfully!');
```

### Solution Explanation
1. **Directional Semantics**: For a directed edge `(u, v)`, service $u$ calls service $v$. Therefore, $u$'s `outDegree` increments, and $v$'s `inDegree` increments.
2. **Mean Calculation**: The sum of all in-degrees across any directed graph equals the total number of edges $|E|$. The mean is $|E| / |V|$.
3. **Bottleneck Filtering**: We iterate through indices $0 \le i < V$ and push index $i$ (the service ID) when `inDegree[i] > meanInDegree`, avoiding returning raw degree counts.

---

## Summary

- A **Graph** models many-to-many relationships across vertices connected by directed or undirected edges.
- **Adjacency Lists** are the industry standard for sparse graphs ($E \ll V^2$), providing $O(V + E)$ space complexity and optimal neighbor iteration.
- **Adjacency Matrices** provide $O(1)$ edge-existence queries at the cost of $O(V^2)$ space, causing V8 heap exhaustion if used naively for large sparse graphs.
- Edge list normalization (`buildGraph`) requires pre-allocating independent arrays to avoid reference duplication bugs.
- Graph modeling underpins modern Node.js system architectures, including microservice tracing, distributed lock wait-for graphs, and access control lists.

---

## Cheat Sheet & Common Pitfalls

| Scenario / Pattern | Anti-Pattern | Recommended Solution |
| :--- | :--- | :--- |
| **Matrix Allocation** | `new Array(V).fill(new Array(V))` (shared reference) | `Array.from({ length: V }, () => new Array(V).fill(0))` |
| **Sparse Graph Modeling** | Using a 2D matrix for $V = 10^5$ | Adjacency list: array of arrays or `Map<id, number[]>` |
| **Undirected Edges** | Pushing only `adj[u].push(v)` | Symmetric registration: `adj[u].push(v)` AND `adj[v].push(u)` |
| **Object Key Coercion** | Using `{ [v]: [] }` with integer IDs | Use indexed Array or `Map` to avoid string key hashing |
| **Isolated Vertices** | Omitting unvisited vertices from representation | Pre-populate all $0 \dots V-1$ keys with empty array `[]` |

---

## Interview Questions

### 1. When is an Adjacency Matrix preferred over an Adjacency List despite higher memory usage?
**Question:** Under what specific algorithmic conditions and graph properties is an Adjacency Matrix preferred over an Adjacency List?

**Answer:** An Adjacency Matrix is preferred under three concrete conditions:
1. **Dense Topologies**: When the graph is dense ($E \approx V^2$), the asymptotic memory footprint of an adjacency list ($O(V + V^2) = O(V^2)$) matches the matrix, eliminating the space advantage.
2. **Frequent Edge-Existence Queries**: When an algorithm repeatedly checks whether an edge exists between two arbitrary vertices `(u, v)` in $O(1)$ time without needing to iterate neighbors.
3. **Algebraic and Dynamic Programming Graph Algorithms**: Algorithms like Floyd-Warshall All-Pairs Shortest Path require $O(1)$ matrix cell lookups and updates. Similarly, algebraic graph theory (e.g., counting paths of length $K$ by computing matrix power $M^K$) requires dense linear algebra representations.

---

### 2. How do you convert an Adjacency Matrix to an Adjacency List in optimal time?
**Question:** Given a $V \times V$ binary adjacency matrix, write an algorithm to convert it to an adjacency list and analyze its complexity.

**Answer:** We iterate through every row $u$ from $0$ to $V - 1$. For each row, we scan columns $v$ from $0$ to $V - 1$. If `matrix[u][v] !== 0`, we push $v$ into the neighbor list for $u$:
```javascript
function matrixToList(matrix) {
  const V = matrix.length;
  const adjList = Array.from({ length: V }, () => []);

  for (let u = 0; u < V; u++) {
    for (let v = 0; v < V; v++) {
      if (matrix[u][v] !== 0) {
        adjList[u].push(v);
      }
    }
  }

  return adjList;
}
```
**Complexity**:
- **Time Complexity**: $O(V^2)$ because all $V \times V$ matrix entries must be inspected.
- **Space Complexity**: $O(V + E)$ auxiliary memory for the resulting adjacency list.

---

### 3. What V8 garbage collection and memory issues occur when storing large graphs in Node.js?
**Question:** If you model a social graph with 1 million users and 10 million edges as an in-memory JavaScript `Map<string, string[]>`, what performance bottlenecks occur in the Node.js runtime?

**Answer:**
1. **V8 Heap Limit Exhaustion**: The default Node.js V8 heap limit is ~1.4GB on 64-bit systems (configurable up to 4GB via `--max-old-space-size`). Storing 1M string keys, 1M array objects, and 10M string elements with V8 object headers (~32-48 bytes per object) will consume multiple gigabytes of memory, triggering fatal Out-Of-Memory termination.
2. **GC Pause Degradation**: The V8 Scavenger and Mark-Sweep-Compact garbage collector must recursively trace object references. Having tens of millions of small JavaScript heap objects dramatically increases GC pause durations, causing event loop stalls and HTTP request latency spikes.
3. **Optimization Strategy**: Model vertices as 0-indexed integer IDs instead of UUID strings. Store edges in flat contiguous `Int32Array` buffers or offload the graph to an external in-memory data store such as Redis or a dedicated graph database (Neo4j).

---

### 4. How does an undirected graph's Adjacency Matrix differ mathematically from a directed graph?
**Question:** What mathematical invariant holds true for the Adjacency Matrix of an undirected graph that does not hold for a directed graph?

**Answer:** In an undirected graph, an edge between $u$ and $v$ means that vertex $u$ is connected to $v$ and $v$ is connected to $u$. Consequently, `matrix[u][v] === matrix[v][u]` for all $0 \le u, v < V$. This means the adjacency matrix is **strictly symmetric along its main diagonal** ($M = M^T$). In a directed graph, edge $u \to v$ does not imply edge $v \to u$, so the adjacency matrix is generally asymmetric. Furthermore, the sum of row $u$ in an undirected binary matrix equals the degree of $u$, whereas in a directed binary matrix, the row sum is the **out-degree** and the column sum is the **in-degree**.

---

<nav aria-label="Lecture navigation">
  <a href="day-35-lowest-common-ancestor-and-serialization.md">◀ Day 35: Lowest Common Ancestor and Serialization</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-37-graph-traversal-bfs-and-shortest-path.md">Day 37: Graph Traversal: BFS and Shortest Path ▶</a>
</nav>
