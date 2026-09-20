# Day 36: Graph Representations and Modeling

## 1. Learning Outcomes
- Master fundamental graph theory concepts: vertices ($V$), edges ($E$), directed vs. undirected, weighted vs. unweighted, cyclic vs. acyclic.
- Implement graph representations in JavaScript: **Adjacency List** (using `Map` or Array of Arrays) and **Adjacency Matrix**.
- Compare time and space complexities ($O(V + E)$ vs. $O(V^2)$) and determine when to use each representation.
- Model real-world software entities (social graphs, microservice dependencies, route networks) into graph structures.
- Analyze graph memory overhead and V8 garbage collection behavior in Node.js backend services.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 02 (Arrays, Sets, Maps), Day 31 (Tree Fundamentals).
- **Navigation**:
  - [Previous: Day 35 - Lowest Common Ancestor and Serialization](day-35-lowest-common-ancestor-and-serialization.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 37 - Graph Traversal: BFS & Shortest Path](day-37-graph-traversal-bfs-and-shortest-path.md)

---

## 3. Core Concepts & Mental Models
A **Graph** $G = (V, E)$ consists of a set of vertices (nodes) and edges (connections). Trees are simply connected, acyclic, undirected graphs with $V - 1$ edges.

```text
Graph Types:
Undirected Graph:           Directed Graph (Digraph):      Weighted Graph:
  (A) --- (B)                 (A) ---> (B)                   (A) --(5)--> (B)
   |       |                   |        |                     |            |
   |       |                   v        v                    (2)          (8)
  (C) --- (D)                 (C) <--- (D)                    v            v
                                                             (C) --(3)--> (D)

Graph Representations for V = {0, 1, 2, 3}:
1. Adjacency Matrix (4x4):     2. Adjacency List:
     0  1  2  3                   0 -> [1, 2]
  0 [0, 1, 1, 0]                  1 -> [0, 3]
  1 [1, 0, 0, 1]                  2 -> [0, 3]
  2 [1, 0, 0, 1]                  3 -> [1, 2]
  3 [0, 1, 1, 0]
```

---

## 4. Detailed Technical Explanations

### 4.1 Adjacency List vs. Adjacency Matrix Tradeoffs
| Feature | Adjacency List | Adjacency Matrix |
| :--- | :--- | :--- |
| **Space Complexity** | $O(V + E)$ (Optimal for sparse graphs) | $O(V^2)$ (Heavy memory consumption) |
| **Edge Lookup `(u, v)`** | $O(\text{deg}(u))$ (or $O(1)$ with Set) | $O(1)$ direct array index |
| **Iterate Neighbors of $u$** | $O(\text{deg}(u))$ | $O(V)$ (must scan entire row) |
| **Add Vertex** | $O(1)$ | $O(V)$ (or $O(V^2)$ reallocation) |
| **Add Edge** | $O(1)$ | $O(1)$ |

### 4.2 Dense vs. Sparse Graphs
- **Sparse Graphs** ($E \ll V^2$): Most real-world graphs (social networks, web page links, road networks). Adjacency List is universally superior.
- **Dense Graphs** ($E \approx V^2$): Almost all pairs of vertices share an edge. Adjacency Matrix is compact and cache-friendly.

### 4.3 Node.js Relevance: Service Meshes & Dependency Topologies
In modern Node.js cloud backends, microservice communications (e.g., in Kubernetes or Istio) form a directed graph. Adjacency lists model which services call which endpoints. When analyzing network latency or failure blast radius, graph models allow automated dependency tracing and circuit breaker routing.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 Adjacency List Graph Class (Weighted & Directed/Undirected)
```javascript
class Graph {
  constructor(isDirected = false) {
    this.isDirected = isDirected;
    // Map of vertex -> Array of { node, weight }
    this.adjacencyList = new Map();
  }

  addVertex(vertex) {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, []);
    }
  }

  addEdge(u, v, weight = 1) {
    this.addVertex(u);
    this.addVertex(v);

    this.adjacencyList.get(u).push({ node: v, weight });

    if (!this.isDirected) {
      this.adjacencyList.get(v).push({ node: u, weight });
    }
  }

  getNeighbors(vertex) {
    return this.adjacencyList.get(vertex) || [];
  }

  hasEdge(u, v) {
    const neighbors = this.adjacencyList.get(u);
    if (!neighbors) return false;
    return neighbors.some(edge => edge.node === v);
  }
}
```

### 5.2 Converting Edge List to Adjacency List
In technical interviews, input is usually given as an Edge List `[[0, 1], [0, 2], [1, 2]]`:
```javascript
/**
 * Builds adjacency list from edge list.
 * Time: O(V + E), Space: O(V + E)
 */
function buildGraph(numVertices, edges, isDirected = false) {
  const adjList = Array.from({ length: numVertices }, () => []);

  for (const [u, v] of edges) {
    adjList[u].push(v);
    if (!isDirected) {
      adjList[v].push(u);
    }
  }

  return adjList;
}
```

### 5.3 Execution Trace: Building Adjacency List
```text
Input: n = 4, edges = [[0, 1], [1, 2], [2, 3], [3, 0]], isDirected = false
Initial: adjList = [[], [], [], []]
Edge [0, 1]: adjList[0].push(1), adjList[1].push(0)
Edge [1, 2]: adjList[1].push(2), adjList[2].push(1)
Edge [2, 3]: adjList[2].push(3), adjList[3].push(2)
Edge [3, 0]: adjList[3].push(0), adjList[0].push(3)
Final adjList:
  0: [1, 3]
  1: [0, 2]
  2: [1, 3]
  3: [2, 0]
```

---

## 6. Common Mistakes & Anti-Patterns
- **Allocating $O(V^2)$ Matrices for Sparse Graphs**: When $V = 100,000$ and $E = 200,000$, an adjacency matrix requires $100,000 \times 100,000 = 10^{10}$ cells (~10GB RAM), instantly crashing V8 with Out-Of-Memory. Use an Adjacency List.
- **Forgetting Bidirectional Edges**: When modeling an undirected graph, failing to push `u` into `v`'s neighbor list creates a directed disconnected graph.
- **String vs. Integer Key Identity**: Using plain JavaScript objects `{}` with integer keys coerces numbers to strings (`obj[1]` becomes key `"1"`), inducing hidden class reallocations. Use a `Map` or indexed array for numeric IDs.

---

## 7. Tricky Points & Edge Cases
- **Self-Loops and Parallel Edges**: An edge `(u, u)` is a self-loop. Two edges `(u, v)` with different weights are parallel edges (multigraph). Ensure representations guard or support multiple edges if required.
- **Disconnected Components**: A graph may have multiple isolated islands of nodes. Traversals must iterate over all vertices $0 \dots V-1$ to ensure unvisited components are not skipped.
- **Node Zero vs. 1-Indexed**: Check if problems use 0-indexed or 1-indexed vertices to avoid off-by-one array allocation errors.

---

## 8. Practical Engineering Exercises
1. Implement a method `removeVertex(vertex)` on the `Graph` class that cleanly removes a node and all incoming/outgoing edges.
2. Given an adjacency matrix, write a function that converts it into a normalized adjacency list in $O(V^2)$ time.

---

## 9. Key Takeaways & Summary
- Graphs model non-linear many-to-many relationships using vertices and edges.
- Adjacency Lists are space-optimal ($O(V + E)$) and preferred for almost all real-world sparse graphs.
- Adjacency Matrices consume $O(V^2)$ space but provide $O(1)$ edge-existence lookups.
- Undirected graphs require bidirectional edge registration (`u -> v` and `v -> u`).

---

## 10. Quick Reference Cheat Sheet
| Graph Metric | Sparse Graph ($E \approx V$) | Dense Graph ($E \approx V^2$) |
| :--- | :--- | :--- |
| **Best Representation** | Adjacency List | Adjacency Matrix |
| **Memory Cost** | $O(V + E)$ | $O(V^2)$ |
| **Degree Calculation** | `list[u].length` ($O(1)$) | Loop row ($O(V)$) |
| **Check Edge $(u, v)$** | $O(\text{deg}(u))$ | Matrix `[u][v] === 1` ($O(1)$) |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: When would an Adjacency Matrix be preferred over an Adjacency List despite higher space complexity?  
**Hint**: Consider graph density and the frequency of edge-existence queries.  
**Expected Answer Shape**: An Adjacency Matrix is preferred when: (1) the graph is dense ($E \approx V^2$), meaning memory usage is asymptotically equivalent to an adjacency list; (2) the primary algorithm frequently checks whether an edge exists between two arbitrary vertices `(u, v)` in $O(1)$ time; (3) the algorithm requires matrix multiplication (e.g., counting paths of length $K$ using algebraic graph theory or Floyd-Warshall all-pairs shortest paths).

### 2. Code-Writing
**Question**: Write a function to calculate the in-degree and out-degree of all vertices in a directed graph given as an edge list.  
**Hint**: In-degree is incoming edges; out-degree is outgoing edges.  
**Expected Answer Shape**: Initialize two arrays `inDegree = new Array(V).fill(0)` and `outDegree = new Array(V).fill(0)`. For each edge `[u, v]`, increment `outDegree[u]++` and `inDegree[v]++`. Return `{ inDegree, outDegree }` in $O(V + E)$ time and $O(V)$ space.

### 3. Debugging
**Question**: Identify the memory issue in this graph constructor:  
```javascript
function createMatrix(V) {
  return new Array(V).fill(new Array(V).fill(0));
}
```  
**Hint**: How does `Array.prototype.fill()` handle object/array references?  
**Expected Answer Shape**: `fill()` copies the exact same inner array reference across all outer rows. Mutating `matrix[0][1] = 1` mutates every single row simultaneously (`matrix[i][1] = 1` for all $i$). Use `Array.from({ length: V }, () => new Array(V).fill(0))` to allocate independent row arrays.

### 4. System Design / Tradeoff
**Question**: You are designing a follower recommendation feature in Node.js for a platform with 50 million users. How would you store and query the social graph?  
**Hint**: Single-machine memory limits vs. distributed graph databases.  
**Expected Answer Shape**: 50M users with an average of 200 followers yields 10 billion edges. Storing this in Node.js V8 heap is impossible (exceeds heap limits). Store the graph in a distributed graph database (e.g., Neo4j) or key-value store (e.g., Redis `Set` per user: `SADD user:100:following 200`). Common followers are queried using Redis `SINTER` operations offloaded from the Node.js event loop.

### 5. Tricky / Edge Case
**Question**: How does an undirected graph's Adjacency Matrix differ from that of a directed graph?  
**Hint**: Symmetry along the main diagonal.  
**Expected Answer Shape**: In an undirected graph, an edge between $u$ and $v$ means `matrix[u][v] === matrix[v][u]`. Therefore, the Adjacency Matrix is strictly symmetric along the main diagonal ($M = M^T$). In a directed graph, the matrix is generally asymmetric.

### 6. Real-World Node.js Context
**Question**: How does Node.js's module loader (`require()` / ES modules) represent module circularity using a graph?  
**Hint**: Module cache and loading states.  
**Expected Answer Shape**: Node.js maintains an internal module graph (`require.cache`). When module A requires B and B requires A, Node creates an entry for A with `loaded: false`. When B loads A, Node returns A's unfinished `module.exports` object reference rather than recursing infinitely, resolving the circular dependency graph cleanly without stack overflow.
