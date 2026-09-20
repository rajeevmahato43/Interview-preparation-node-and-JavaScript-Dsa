# Day 39: Cycle Detection in Directed and Undirected Graphs

## 1. Learning Outcomes
- Master the fundamental difference between cycles in **undirected** graphs versus **directed** graphs.
- Implement cycle detection in undirected graphs using DFS with a **parent tracking pointer**.
- Solve the **Graph Valid Tree** problem combining edge count invariants ($E = V - 1$) with cycle detection.
- Master the **3-Color State Machine** (White/Gray/Black) for detecting back-edges and directed cycles.
- Understand how cycle detection prevents distributed deadlocks and circular dependency freezes in Node.js architectures.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 36 (Graph Representations), Day 38 (Graph DFS & Connected Components).
- **Navigation**:
  - [Previous: Day 38 - Graph Traversal: DFS and Connected Components](day-38-graph-traversal-dfs-and-components.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 40 - Topological Sort: Kahn's Algorithm & DFS](day-40-topological-sort-kahns-and-dfs.md)

---

## 3. Core Concepts & Mental Models
An undirected edge $(u, v)$ is inherently bidirectional ($u \rightarrow v$ and $v \rightarrow u$). In an undirected graph, encountering the node you just arrived from is not a cycle; it is simply traversing the same edge backwards. In a directed graph, edges have strict orientation.

```text
Undirected Cycle vs. Directed Cycle:
Undirected Graph:                       Directed Graph (Back-Edge):
(0) --- (1)                             (0) ----> (1)
 |     /                                 ^         |
 |   /   (0-1-2-0 forms cycle)           |         v
(2)                                     (3) <---- (2)
                                        Path 0->1->2->3->0 forms directed cycle!

3-Coloring State Machine (Directed Graphs):
State 0 (WHITE): Unvisited
State 1 (GRAY):  Visiting (Currently on active DFS recursion call stack)
State 2 (BLACK): Visited (Completely explored, all descendants verified cycle-free)

Rule: Hitting a GRAY node during DFS indicates a BACK-EDGE = DIRECTED CYCLE!
```

---

## 4. Detailed Technical Explanations

### 4.1 Undirected Graph Cycle Detection: The Parent Pointer
When recursing from $u$ to neighbor $v$:
- If $v$ is already visited and $v \ne \text{parent}$, a cycle exists.
- If $v = \text{parent}$, it is the trivial back-link of the undirected edge; simply skip it.

### 4.2 Directed Graph Cycle Detection: Why Parent Pointer Fails
In a directed graph, two independent paths can converge on the same node without creating a cycle (e.g., $A \rightarrow C$ and $B \rightarrow C$, a diamond pattern). Hitting a visited node is only a cycle if that node is an ancestor on the **current active recursion stack**.

### 4.3 Node.js Relevance: Deadlock & Circular Dependency Detection
In Node.js enterprise microservices, distributed database locks (e.g., two transactions locking resources in opposite order: Tx1 holds Table A, waits for B; Tx2 holds Table B, waits for A) form a directed wait-for-graph. Cycle detection algorithms run periodically to detect deadlocks and abort one transaction to release the lock.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 Cycle Detection in Undirected Graph (Graph Valid Tree)
```javascript
/**
 * Determines if undirected graph forms a valid tree.
 * A tree must be: 1) connected, 2) acyclic (edges == n - 1).
 * Time: O(V + E), Space: O(V)
 */
function validTree(n, edges) {
  // Invariant: A tree with n nodes MUST have exactly n - 1 edges
  if (edges.length !== n - 1) return false;

  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const visited = new Set();

  function hasCycle(node, parent) {
    visited.add(node);

    for (const neighbor of adj[node]) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor, node)) return true;
      } else if (neighbor !== parent) {
        // Visited neighbor that is NOT parent means cross/cycle edge
        return true;
      }
    }

    return false;
  }

  // Check for cycle starting from node 0
  if (hasCycle(0, -1)) return false;

  // Must also verify all nodes are connected
  return visited.size === n;
}
```

### 5.2 Cycle Detection in Directed Graph (3-Color DFS)
```javascript
/**
 * Detects if a directed graph contains a cycle.
 * Time Complexity: O(V + E)
 * Space Complexity: O(V)
 */
function hasDirectedCycle(numCourses, prerequisites) {
  const adj = Array.from({ length: numCourses }, () => []);
  for (const [course, prereq] of prerequisites) {
    adj[prereq].push(course);
  }

  // 0 = UNVISITED (White), 1 = VISITING (Gray), 2 = VISITED (Black)
  const state = new Uint8Array(numCourses);

  function dfs(node) {
    state[node] = 1; // Mark as VISITING (on active stack)

    for (const neighbor of adj[node]) {
      // Hit a node currently on the recursion stack -> CYCLE!
      if (state[neighbor] === 1) return true;

      // Unvisited neighbor: recurse
      if (state[neighbor] === 0) {
        if (dfs(neighbor)) return true;
      }
      // If state[neighbor] === 2 (BLACK), already verified safe, skip!
    }

    state[node] = 2; // Mark as VISITED (safe)
    return false;
  }

  // Check every vertex to handle disconnected components
  for (let i = 0; i < numCourses; i++) {
    if (state[i] === 0) {
      if (dfs(i)) return true; // Cycle found
    }
  }

  return false;
}
```

### 5.3 Execution Trace: 3-Coloring Directed Graph `0 -> 1 -> 2 -> 0`
```text
States: [0: White, 1: White, 2: White]
1. Start dfs(0): state[0] = 1 (Gray).
   - Neighbor 1 is state 0. Launch dfs(1).
2. Inside dfs(1): state[1] = 1 (Gray).
   - Neighbor 2 is state 0. Launch dfs(2).
3. Inside dfs(2): state[2] = 1 (Gray).
   - Neighbor 0: state[0] === 1 (Gray)!
   - Collision with active recursion stack ancestor -> BACK-EDGE DETECTED!
4. Returns TRUE. Directed cycle confirmed!
```

---

## 6. Common Mistakes & Anti-Patterns
- **Using a Single Boolean Visited Array for Directed Graphs**: Marking a node as visited and never distinguishing between "visiting" (active stack) and "visited" (finished) falsely flags diamond DAGs ($A \rightarrow B, A \rightarrow C, B \rightarrow D, C \rightarrow D$) as cycles.
- **Forgetting Parent in Undirected Graphs**: Failing to pass `parent` causes the algorithm to immediately flag the undirected return edge `u -> v -> u` as a cycle on the first iteration.
- **Skipping Disconnected Components**: Only running DFS starting from node 0 misses cycles located in isolated subgraphs. Always loop over all $0 \dots V-1$.

---

## 7. Tricky Points & Edge Cases
- **Tree Edge Condition**: For an undirected graph to be a tree, it must satisfy two conditions simultaneously: `edges.length === n - 1` AND connected. Checking `edges.length === n - 1` upfront immediately filters out many invalid graphs in $O(1)$ time.
- **Self-Loops (`u -> u`)**: A node with an edge to itself is an immediate cycle; in 3-coloring, `state[u] = 1` immediately checks neighbor `u` which is state 1, correctly identifying the self-loop.
- **Diamond DAG Pattern**: Vertices 0 to 1, 0 to 2, 1 to 3, 2 to 3. Vertex 3 is reached twice, but it is already Black (state 2), so no cycle is reported.

---

## 8. Practical Engineering Exercises
1. Implement **Course Schedule I** (LeetCode 207) returning whether a student can finish all courses given prerequisite pairs.
2. Implement cycle detection using **Union-Find (Disjoint Set Union)** for an undirected graph in $O(E \cdot \alpha(V))$ time.

---

## 9. Key Takeaways & Summary
- Undirected cycle detection checks if a visited neighbor is different from the immediate `parent`.
- Directed cycle detection requires 3-state tracking (White/Gray/Black) to identify back-edges to active recursion ancestors.
- Diamond DAG structures are acyclic despite multiple paths converging on the same node.
- A valid undirected tree with $N$ vertices must have exactly $N-1$ edges and no cycles.

---

## 10. Quick Reference Cheat Sheet
| Graph Type | Detection Method | Cycle Condition |
| :--- | :--- | :--- |
| **Undirected** | DFS with `parent` | `visited.has(v) && v !== parent` |
| **Undirected** | Union-Find | `find(u) === find(v)` on new edge |
| **Directed** | 3-Color DFS | `state[neighbor] === 1` (Gray / on stack) |
| **Directed** | Kahn's Algorithm (BFS) | Processed count $< V$ |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: Why does simple two-state boolean visited tracking work for cycle detection in undirected graphs, but fail for directed graphs?  
**Hint**: Consider a diamond graph where two paths lead to the same destination.  
**Expected Answer Shape**: In an undirected graph, any visited node encountered other than the immediate parent indicates an alternate path connecting two vertices, which proves a cycle. In a directed graph, multiple paths can reach the same vertex without forming a loop (e.g., $A \rightarrow B \rightarrow D$ and $A \rightarrow C \rightarrow D$). A two-state boolean tracker would encounter $D$ twice and falsely declare a cycle. A 3-state machine distinguishes between active ancestors on the call stack (Gray) and completed independent branches (Black).

### 2. Code-Writing
**Question**: Write a cycle detection function for an undirected graph using the Disjoint Set Union (Union-Find) data structure.  
**Hint**: An edge between two nodes already in the same connected component creates a cycle.  
**Expected Answer Shape**: Initialize parent array where `parent[i] = i`. For each edge `[u, v]`: find roots `rootU = find(u)` and `rootV = find(v)`. If `rootU === rootV`, adding edge `(u, v)` creates a cycle, so return true. Otherwise, `union(rootU, rootV)`. If all edges processed without collision, return false.

### 3. Debugging
**Question**: Identify why this directed cycle detection code produces false positives:  
```javascript
function hasCycle(adj, n) {
  const visited = new Set();
  function dfs(node) {
    if (visited.has(node)) return true;
    visited.add(node);
    for (const next of adj[node]) {
      if (dfs(next)) return true;
    }
    return false;
  }
  for (let i = 0; i < n; i++) {
    if (dfs(i)) return true;
  }
  return false;
}
```  
**Hint**: What happens when `node` is visited from another independent branch?  
**Expected Answer Shape**: `visited` is never backtracked or separated into call-stack vs. finished states. When DFS starts from a new component or checks an alternate branch converging on an already-processed node, `visited.has(node)` evaluates true, incorrectly flagging valid DAGs as cyclic. Fix by removing `node` from an `onStack` set upon returning from `dfs`, or by using 3-color states.

### 4. System Design / Tradeoff
**Question**: How would you design a distributed deadlock detector in a Node.js microservice architecture that manages distributed database transactions?  
**Hint**: Build a wait-for-graph from transaction lock requests.  
**Expected Answer Shape**: Maintain a directed wait-for-graph in Redis or an orchestration service where nodes are active transaction IDs and directed edges represent $Tx_A \rightarrow Tx_B$ ($Tx_A$ waiting on a resource held by $Tx_B$). A background Node.js worker runs 3-color cycle detection every few seconds. If a directed cycle is detected, the worker aborts the youngest transaction in the cycle and returns an error to the client, breaking the deadlock.

### 5. Tricky / Edge Case
**Question**: In an undirected graph, can an edge with a self-loop `(u, u)` be caught by `neighbor !== parent`?  
**Hint**: What is `parent` when visiting `u`'s neighbors?  
**Expected Answer Shape**: Yes. When exploring $u$, `parent` is the node that invoked $u$ (which is not $u$). Because $u$ is already visited (`visited.has(u)` is true) and $u \ne \text{parent}$, the condition `neighbor !== parent` evaluates true, correctly flagging the self-loop as a cycle.

### 6. Real-World Node.js Context
**Question**: How does `npm` or `yarn` detect circular package dependencies (e.g., Package A depends on B, B depends on A)?  
**Hint**: Directed dependency graph during package resolution.  
**Expected Answer Shape**: During `npm install`, the resolver builds a directed dependency graph from `package.json` manifests. As it resolves packages recursively, it tracks the resolution chain using a stack (Gray state). If it attempts to resolve a package currently active on the dependency stack, it flags a circular dependency, logs a warning, and reuses the existing hoarded package reference rather than recursing indefinitely.
