# Day 39: Cycle Detection in Directed and Undirected Graphs

<nav aria-label="Lecture navigation">
  <a href="day-38-graph-traversal-dfs-and-components.md">◀ Day 38: Graph Traversal: DFS and Connected Components</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-40-topological-sort-kahns-and-dfs.md">Day 40: Topological Sort: Kahn's Algorithm and DFS ▶</a>
</nav>

---

## Learning Outcomes

- Distinguish the mathematical and structural mechanics of cycles in **undirected** versus **directed** graphs.
- Implement undirected graph cycle detection using DFS with **parent pointer tracking** to prevent false trivial back-traversals.
- Validate tree structures (**Graph Valid Tree**) by combining the edge count invariant ($|E| = |V| - 1$) with cycle-free connectivity tests.
- Master the **3-Color State Machine** (White/Gray/Black or 0/1/2) for detecting back-edges in directed graphs.
- Solve **Course Schedule I** to verify the validity of prerequisite DAGs before job pipeline execution.
- Model and prevent circular deadlocks and wait-for graph freezes in Node.js event-driven services and distributed transaction managers.

---

## Prerequisites

- [Day 36: Graph Representations and Modeling](day-36-graph-representations-and-modeling.md) — Adjacency list construction and directed vs. undirected edges.
- [Day 38: Graph Traversal: DFS and Connected Components](day-38-graph-traversal-dfs-and-components.md) — DFS recursion, backtracking, and visited state management.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
| :--- | :--- | :--- |
| **Cycle** | A closed path in a graph where a non-empty sequence of edges starts and ends at the same vertex with no repeated edges. | Indicates fatal deadlocks, infinite loops, or invalid tree structures. |
| **Parent Pointer** | Tracking the immediate predecessor vertex during undirected DFS to avoid misinterpreting the bidirectional reverse edge as a cycle. | Without this, every single undirected edge `(u, v)` would register as a false cycle. |
| **Back-Edge** | An edge in a directed DFS tree that points from a descendant node back to an active ancestor on the recursion stack. | The definitive indicator of a directed cycle; discovered when encountering a **Gray** node. |
| **3-Color States** | A vertex classification tri-state: 0 (White/Unvisited), 1 (Gray/Visiting on Stack), 2 (Black/Fully Explored). | Standard algorithm for directed cycle detection in $O(V + E)$ time without duplicate exploration. |
| **Graph Valid Tree** | A connected, undirected graph with no cycles, which strictly satisfies $|E| = |V| - 1$. | Verifies whether a network topology forms a valid hierarchical tree. |
| **Wait-For Graph** | A directed graph modeling resource allocations where edge $A \to B$ means transaction $A$ waits for transaction $B$. | A directed cycle in a wait-for graph indicates an unresolvable distributed deadlock. |

---

## Core Concepts & Mechanical Architecture

### 1. Undirected vs. Directed Cycle Mechanics

In an **undirected graph**, an edge between $u$ and $v$ allows bidirectional movement. When traversing from $u$ to $v$, vertex $v$ naturally contains $u$ in its neighbor list. Encountering $u$ is not a cycle; it is simply looking backward along the edge you just crossed. A cycle only occurs if you encounter an already-visited vertex $w$ that is **not your parent**.

In a **directed graph**, edges have strict orientation. Re-encountering an already-visited node does **not** necessarily indicate a cycle. Two independent branches can converge on the same node (a diamond pattern). A cycle only occurs if an edge points back to an ancestor that is currently active on the **call stack**.

```text
Undirected Cycle vs. Directed Diamond vs. Directed Cycle:

1. Undirected Cycle:             2. Directed Diamond (NO Cycle!):  3. Directed Cycle (Back-Edge):
   (0) -------- (1)                    (0)                            (0) --------> (1)
    |          /                      /   \                            ^             |
    |         /                      v     v                           |             v
   (2) ------'                     (1)     (2)                        (3) <-------- (2)
   Trace: 0 -> 1 -> 2 -> 0           \     /                           Edge 3 -> 0 points to
   From 2, node 0 is visited          v   v                            active ancestor 0!
   and parent(2) is 1 (0 != 1).       (3)                              (State: GRAY -> GRAY)
   CYCLE DETECTED!                 Paths converge at 3. Acyclic!       CYCLE DETECTED!
```

---

### 2. Undirected Cycle Detection via Parent Tracking

When exploring vertex $u$:
1. Mark $u$ as visited.
2. For each neighbor $v$ of $u$:
   - If $v$ is not visited: recursively call `dfs(v, u)` with $u$ as the parent.
   - If $v$ is already visited AND $v \ne \text{parent}$: **a cycle exists**.
   - If $v$ is already visited AND $v = \text{parent}$: this is the trivial reverse edge; ignore it.

```javascript
// Node.js code: Undirected Graph Cycle Detection
/**
 * Detects if an undirected graph contains any cycles.
 * Time Complexity: O(V + E)
 * Space Complexity: O(V)
 * @param {number} numVertices
 * @param {number[][]} adjList
 * @returns {boolean}
 */
function hasUndirectedCycle(numVertices, adjList) {
  const visited = new Uint8Array(numVertices);

  function dfs(curr, parent) {
    visited[curr] = 1;

    for (const neighbor of adjList[curr]) {
      if (visited[neighbor] === 0) {
        if (dfs(neighbor, curr)) return true;
      } else if (neighbor !== parent) {
        // Visited neighbor that is NOT parent => Cycle!
        return true;
      }
    }

    return false;
  }

  // Check all components
  for (let v = 0; v < numVertices; v++) {
    if (visited[v] === 0) {
      if (dfs(v, -1)) return true;
    }
  }

  return false;
}
```

---

### 3. Graph Valid Tree Invariant

In **Graph Valid Tree** (LeetCode 261), we are given $n$ nodes labeled $0$ to $n-1$ and a list of undirected edges. We must determine if these edges form a valid tree.

**Mathematical Theorem**: A graph of $V$ vertices is a valid tree if and only if:
1. It contains exactly $|E| = |V| - 1$ edges.
2. It is fully connected (has exactly 1 connected component).
3. It contains no cycles.

Any two of these conditions mathematically imply the third! Therefore, checking $|E| === V - 1$ and testing whether all $V$ nodes are reachable in a single DFS from node $0$ is sufficient to prove both acyclicity and connectivity.

```javascript
// Node.js code: Graph Valid Tree
/**
 * @param {number} n
 * @param {number[][]} edges
 * @returns {boolean}
 */
function validTree(n, edges) {
  // A tree with N vertices must have exactly N - 1 edges
  if (edges.length !== n - 1) return false;

  const adjList = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adjList[u].push(v);
    adjList[v].push(u);
  }

  const visited = new Uint8Array(n);

  function dfs(curr, parent) {
    visited[curr] = 1;

    for (const neighbor of adjList[curr]) {
      if (visited[neighbor] === 0) {
        if (!dfs(neighbor, curr)) return false;
      } else if (neighbor !== parent) {
        return false; // Cycle detected
      }
    }

    return true;
  }

  // Must have no cycle starting from node 0
  if (!dfs(0, -1)) return false;

  // Must be fully connected (all nodes visited)
  for (let i = 0; i < n; i++) {
    if (visited[i] === 0) return false;
  }

  return true;
}

console.log('Is valid tree [5, 4 edges]:', validTree(5, [[0, 1], [0, 2], [0, 3], [1, 4]])); // true
console.log('Is valid tree [5, cycle]:', validTree(5, [[0, 1], [1, 2], [2, 3], [1, 3], [1, 4]])); // false
```

---

### 4. Directed Cycle Detection: The 3-Color State Machine

To detect cycles in directed graphs (e.g., **Course Schedule I**, LeetCode 207), we assign each vertex one of three states:
- **0 (WHITE)**: Unvisited. Not yet explored.
- **1 (GRAY)**: Visiting. Currently active on the recursion call stack.
- **2 (BLACK)**: Visited. Fully explored along all descendant paths with no cycles found.

**Cycle Rule**: If DFS visits an edge leading to a **GRAY (1)** vertex, that vertex is an active ancestor. This edge is a **back-edge**, proving the existence of a directed cycle.

```text
3-Color State Machine Transitions:
[WHITE (0)]  --- DFS starts --->  [GRAY (1)]  --- Children done --->  [BLACK (2)]
     ^                                 |
     |                                 | Encounter another GRAY (1)
     |                                 v
     '---------------------------- CYCLE DETECTED! (Back-edge found)
```

```javascript
// Node.js code: Course Schedule I (Directed Cycle Detection)
/**
 * Determines if all courses can be finished without circular dependencies.
 * Time Complexity: O(V + E)
 * Space Complexity: O(V + E)
 * @param {number} numCourses
 * @param {Array<[number, number]>} prerequisites
 * @returns {boolean}
 */
function canFinish(numCourses, prerequisites) {
  // adjList: course -> list of dependent courses
  const adjList = Array.from({ length: numCourses }, () => []);
  for (const [course, prereq] of prerequisites) {
    adjList[prereq].push(course);
  }

  // 0 = WHITE, 1 = GRAY, 2 = BLACK
  const state = new Uint8Array(numCourses);

  function hasCycle(curr) {
    state[curr] = 1; // Mark GRAY: entering recursion stack

    for (const neighbor of adjList[curr]) {
      if (state[neighbor] === 1) {
        // Hit an ancestor currently on the stack => Cycle!
        return true;
      }
      if (state[neighbor] === 0) {
        if (hasCycle(neighbor)) return true;
      }
      // If state[neighbor] === 2 (BLACK), it is already fully verified safe.
    }

    state[curr] = 2; // Mark BLACK: exiting recursion stack safe
    return false;
  }

  // Check every course in case the graph is disconnected
  for (let c = 0; c < numCourses; c++) {
    if (state[c] === 0) {
      if (hasCycle(c)) {
        return false; // Cycle detected: cannot finish courses
      }
    }
  }

  return true;
}

console.log('Can finish [no cycle]:', canFinish(2, [[1, 0]])); // true
console.log('Can finish [cycle 1<->0]:', canFinish(2, [[1, 0], [0, 1]])); // false
```

---

## Detailed Node.js Relevance

### Distributed Wait-For Graphs and Deadlock Resolution

In enterprise Node.js microservices handling distributed transactions (e.g., orchestrating PostgreSQL row locks across multiple tables):

```text
Wait-For Deadlock Graph:
[Txn 1] --- holds Lock A, waits for ---> [Txn 2]
   ^                                        |
   |                                        | holds Lock B, waits for
   '----------------------------------------'
```

1. **Deadlock Detection Daemon**: When transactions hold resources and block on others, a background worker in Node.js periodically builds a directed wait-for graph. Running the 3-color DFS cycle detector identifies cycles in $O(V + E)$ time.
2. **Victim Selection**: Once a cycle is detected, the transaction orchestrator aborts the youngest transaction in the cycle, releasing its locks and allowing remaining transactions to proceed.
3. **Module Circular Dependency Resolution**: The Node.js CommonJS loader uses an internal cycle detection mechanism (`require.cache`). When module A requires B and B requires A, Node returns A's incomplete exports object rather than recursing indefinitely, breaking the dependency cycle.

---

## Tricky Points & Edge Cases

1. **Treating Directed Graphs Like Undirected Graphs**: Attempting to detect directed cycles using a parent pointer fails because diamond patterns ($A \to B, A \to C, B \to D, C \to D$) visit $D$ twice from different parents without forming a cycle. Directed cycle detection strictly requires 3-color or recursion stack tracking.
2. **Disconnected Components**: A graph may contain several independent cycles in disconnected subgraphs. Always wrap your cycle detection in an outer loop over all vertices $0 \dots V-1$.
3. **Self-Loops and Direct Feedback**: An edge `[u, u]` is a cycle of length 1. In undirected graphs with parent tracking, a self-loop is detected immediately because `neighbor === curr !== parent`.
4. **The Tree Edge Count Trap**: Having $V - 1$ edges is a necessary but **insufficient** condition for a valid tree. A disconnected graph with a cycle in one component (e.g., triangle of 3 nodes + 1 isolated node = 4 nodes, 3 edges) satisfies $E = V - 1$ but is not a valid tree. Connectivity must be validated!

---

## Hands-On Exercise

### Scenario
You are developing a background job runner for a Node.js ETL pipeline. Job tasks specify dependencies as pairs `[taskId, dependsOnTaskId]`. Before running the pipeline, you must validate that the job topology is a Directed Acyclic Graph (DAG) with **no circular deadlocks**. Write `validateJobPipeline(taskCount, dependencies)` which returns `{ isValid: boolean, cyclePath: number[] | null }`. If a cycle exists, return the exact cycle sequence (e.g., `[1, 2, 3, 1]`).

### Buggy Code
```javascript
function validateJobPipeline(taskCount, dependencies) {
  const adj = Array.from({ length: taskCount }, () => []);
  for (const [u, v] of dependencies) {
    adj[u].push(v);
  }

  const visited = new Set();
  // BUG: Uses simple visited set; cannot distinguish cross-edges from back-edges
  function dfs(curr) {
    if (visited.has(curr)) return true; // False positive on diamond dependencies!
    visited.add(curr);
    for (const next of adj[curr]) {
      if (dfs(next)) return true;
    }
    return false;
  }

  for (let i = 0; i < taskCount; i++) {
    if (dfs(i)) return { isValid: false, cyclePath: [] };
  }
  return { isValid: true, cyclePath: null };
}
```

### Acceptance Criteria
- Distinguish between legitimate multi-path diamond DAG dependencies and actual circular deadlocks.
- When a cycle is detected, reconstruct and return the exact loop path of task IDs starting and ending with the duplicate node.
- Return `{ isValid: true, cyclePath: null }` for valid acyclic pipelines.
- Time complexity must be strictly $O(V + E)$.

### Solution Code
```javascript
const assert = require('assert');

// Node.js code: Robust Directed Cycle Detection with Path Reconstruction
/**
 * @param {number} taskCount
 * @param {Array<[number, number]>} dependencies
 * @returns {{ isValid: boolean, cyclePath: number[] | null }}
 */
function validateJobPipeline(taskCount, dependencies) {
  // adj[prereq] -> list of dependent tasks
  const adjList = Array.from({ length: taskCount }, () => []);
  for (let i = 0; i < dependencies.length; i++) {
    const [task, prereq] = dependencies[i];
    adjList[prereq].push(task);
  }

  // 0: WHITE (unvisited), 1: GRAY (on recursion stack), 2: BLACK (explored safe)
  const state = new Uint8Array(taskCount);
  const parentMap = new Map();
  let cycleStart = -1;
  let cycleEnd = -1;

  function dfs(curr) {
    state[curr] = 1; // Mark GRAY

    for (let i = 0; i < adjList[curr].length; i++) {
      const neighbor = adjList[curr][i];

      if (state[neighbor] === 1) {
        // Back-edge discovered: neighbor is on current recursion stack!
        cycleStart = neighbor;
        cycleEnd = curr;
        return true;
      }

      if (state[neighbor] === 0) {
        parentMap.set(neighbor, curr);
        if (dfs(neighbor)) return true;
      }
    }

    state[curr] = 2; // Mark BLACK
    return false;
  }

  for (let i = 0; i < taskCount; i++) {
    if (state[i] === 0) {
      if (dfs(i)) {
        // Reconstruct cycle path from cycleEnd back to cycleStart
        const cycle = [cycleStart];
        let p = cycleEnd;
        while (p !== cycleStart && p !== undefined) {
          cycle.push(p);
          p = parentMap.get(p);
        }
        cycle.push(cycleStart);
        cycle.reverse();

        return { isValid: false, cyclePath: cycle };
      }
    }
  }

  return { isValid: true, cyclePath: null };
}

// Verification & Automated Unit Tests
// Test 1: Diamond DAG (0 -> 1, 0 -> 2, 1 -> 3, 2 -> 3) - Valid!
const diamondDeps = [
  [1, 0],
  [2, 0],
  [3, 1],
  [3, 2]
];
const result1 = validateJobPipeline(4, diamondDeps);
assert.strictEqual(result1.isValid, true);
assert.strictEqual(result1.cyclePath, null);

// Test 2: Circular Dependency (0 -> 1 -> 2 -> 0) - Invalid!
const cycleDeps = [
  [1, 0],
  [2, 1],
  [0, 2]
];
const result2 = validateJobPipeline(3, cycleDeps);
assert.strictEqual(result2.isValid, false);
assert.notStrictEqual(result2.cyclePath, null);
assert.strictEqual(result2.cyclePath[0], result2.cyclePath[result2.cyclePath.length - 1]); // Must loop

// Test 3: Disconnected pipeline with cycle in second component
const multiComponentDeps = [
  [1, 0], // Safe component
  [3, 2], // Cycle component: 2 -> 3 -> 4 -> 2
  [4, 3],
  [2, 4]
];
const result3 = validateJobPipeline(5, multiComponentDeps);
assert.strictEqual(result3.isValid, false);

console.log('✅ All Pipeline Cycle Detection assertions passed successfully!');
```

### Solution Explanation
1. **3-Color Classification**: Using `state[curr] = 1` for visiting and `state[curr] = 2` for completed nodes guarantees that cross-edges in diamond DAGs do not trigger false cycle warnings.
2. **Cycle Path Extraction**: When a back-edge `curr -> neighbor` is found, `neighbor` is `cycleStart` and `curr` is `cycleEnd`. We backtrack along `parentMap` from `cycleEnd` to `cycleStart` to rebuild the loop sequence.
3. **Zero Allocation Heap State**: Using a single flat `Uint8Array(taskCount)` avoids creating millions of object wrappers in the V8 heap.

---

## Summary

- **Undirected Cycles**: Detected via DFS with parent pointer tracking. Encountering a visited node other than the immediate parent confirms a cycle.
- **Tree Invariants**: A graph with $V$ vertices is a valid tree if and only if it has $V - 1$ edges and is fully connected with no cycles.
- **Directed Cycles**: Require tracking active recursion ancestors using the 3-Color State Machine (White = 0, Gray = 1, Black = 2). A back-edge to a Gray node indicates a cycle.
- **Diamond Structures**: Common in directed graphs; two branches merging into one destination is legal in a DAG and must not be flagged as a cycle.
- **Production Systems**: Cycle detection prevents deadlocks in database wait-for graphs, validates build task ordering in monorepos, and ensures job pipeline integrity.

---

## Cheat Sheet & Common Pitfalls

| Graph Type | Cycle Detection Method | Cycle Condition |
| :--- | :--- | :--- |
| **Undirected** | DFS with `parent` pointer | Visited neighbor `v !== parent` |
| **Undirected (Tree Check)** | Edge count + DFS reachability | $E === V - 1$ and all $V$ visited from node 0 |
| **Directed** | 3-Color State Machine | Neighbor state is `GRAY (1)` (back-edge) |
| **Directed (Alternative)** | Kahn's Algorithm (BFS) | Processed nodes $< V$ at end |
| **Diamond DAG** | 3-Color State Machine | Neighbor state is `BLACK (2)` $\implies$ Safe cross-edge |

---

## Interview Questions

### 1. Why does parent-pointer tracking fail to detect cycles in directed graphs?
**Question:** Explain why passing a `parent` argument during DFS works for undirected graphs but produces both false positives and false negatives in directed graphs.

**Answer:**
1. **False Positives (Diamond Patterns)**: In a directed graph, two independent paths can reach the same vertex $D$ (e.g., $A \to B \to D$ and $A \to C \to D$). When DFS arrives at $D$ via $C$, vertex $D$ was already visited via $B$. Since $D$'s parent on the current path is $C$ (and $D \ne C$), an undirected check would falsely declare a cycle, even though the graph is a valid acyclic DAG.
2. **False Negatives (Indirect Cycles)**: In a directed cycle of length 3 ($A \to B \to C \to A$), when inspecting edge $C \to A$, vertex $A$ was not the parent of $C$ (parent was $B$). While an undirected check might catch this edge by accident, it cannot properly verify whether $A$ is an ancestor on the current stack or a finished node in another branch. Directed graphs strictly require tracking active recursion stack membership (3-color method).

---

### 2. Can you detect cycles in an undirected graph using Breadth-First Search (BFS)?
**Question:** How do you detect cycles in an undirected graph using BFS instead of DFS, and what is the underlying invariant?

**Answer:**
Yes. Cycle detection with BFS uses a queue of `[currentNode, parentNode]` pairs:
1. Enqueue `[startNode, -1]` and mark `visited.add(startNode)`.
2. While queue is non-empty:
   - Dequeue `[curr, parent]`.
   - For each neighbor of `curr`:
     - If neighbor is not visited: mark visited and enqueue `[neighbor, curr]`.
     - If neighbor is already visited AND `neighbor !== parent`: a cycle exists!
3. Repeat for all unvisited components.

**Invariant**: If BFS encounters an already-visited node that is not the immediate parent, an alternative path has already reached that node, forming a closed cycle.

---

### 3. How do you prove that a graph is a valid tree in LeetCode 261?
**Question:** What is the most concise, optimal approach to verify whether an undirected graph forms a valid tree?

**Answer:**
A graph of $V$ vertices is a valid tree if and only if:
1. **Edge Count**: $|E| === V - 1$.
2. **Connectivity**: All $V$ vertices form a single connected component.

**Optimal Verification**:
```javascript
function validTree(n, edges) {
  if (edges.length !== n - 1) return false;

  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const visited = new Set();
  const queue = [0];
  visited.add(0);

  while (queue.length > 0) {
    const node = queue.pop();
    for (const neighbor of adj[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return visited.size === n;
}
```
If $|E| === V - 1$ and all $V$ nodes are reachable from node 0, it is mathematically guaranteed to be connected and cycle-free in $O(V + E)$ time.

---

### 4. How does Kahn's algorithm detect cycles compared to DFS 3-coloring?
**Question:** Compare Kahn's algorithm and DFS 3-coloring for directed cycle detection in terms of implementation mechanics and suitability for Node.js job runners.

**Answer:**
- **DFS 3-Coloring**: Explores deep branches recursively or with an explicit stack. Identifies cycles the moment a **back-edge** (neighbor in state `GRAY`) is encountered. It excels when you need to reconstruct the exact cycle path for debugging or error logging.
- **Kahn's Algorithm**: A BFS-based approach that processes vertices with `inDegree === 0`. Nodes involved in a cycle will never have their in-degree reach zero, so they are never enqueued. If the total number of processed nodes at termination is less than $V$, a cycle exists.
- **Node.js Production Suitability**: Kahn's algorithm is typically preferred in job schedulers because it is naturally iterative (preventing stack overflows) and directly outputs the execution order of valid jobs while isolating unexecutable cyclical jobs.

---

<nav aria-label="Lecture navigation">
  <a href="day-38-graph-traversal-dfs-and-components.md">◀ Day 38: Graph Traversal: DFS and Connected Components</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-40-topological-sort-kahns-and-dfs.md">Day 40: Topological Sort: Kahn's Algorithm and DFS ▶</a>
</nav>
