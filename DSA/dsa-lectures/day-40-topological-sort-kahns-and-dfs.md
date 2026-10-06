# Day 40: Topological Sort: Kahn's Algorithm and DFS

<nav aria-label="Lecture navigation">
  <a href="day-39-cycle-detection-directed-and-undirected.md">◀ Day 39: Cycle Detection in Directed and Undirected Graphs</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-41-binary-heap-array-representation.md">Day 41: Binary Heap and Array Representation ▶</a>
</nav>

---

## Learning Outcomes

- Understand the mathematical definition and prerequisites of a **Topological Sort** on **Directed Acyclic Graphs (DAGs)**.
- Implement **Kahn's Algorithm** (in-degree BFS queue) for linear ordering and cycle detection in $O(V + E)$ time.
- Implement **DFS Post-Order Reversal** with 3-color visited states for dependency sorting and cycle rejection.
- Solve **Course Schedule I** (cycle verification) and **Course Schedule II** (complete order extraction).
- Leverage Kahn's level-by-level BFS queue batches to execute parallel task waves in Node.js job schedulers and monorepo build tools (Turborepo/Nx).
- Contrast BFS versus DFS topological sort approaches regarding memory usage, recursion overhead, and streaming compatibility.

---

## Prerequisites

- [Day 19: Queue and Deque Implementations](day-19-queue-and-deque-implementations.md) — FIFO queues and level-by-level queue sizing.
- [Day 36: Graph Representations and Modeling](day-36-graph-representations-and-modeling.md) — Adjacency lists and in-degree / out-degree definitions.
- [Day 39: Cycle Detection in Directed and Undirected Graphs](day-39-cycle-detection-directed-and-undirected.md) — 3-color state machine and back-edge cycle detection.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
| :--- | :--- | :--- |
| **Topological Sort** | A linear ordering of vertices in a directed graph such that for every directed edge $u \to v$, $u$ comes before $v$. | Essential for build systems, database migration order, and asynchronous workflow runners. |
| **Directed Acyclic Graph (DAG)** | A directed graph containing zero cycles. | A graph has at least one topological sort **if and only if** it is a DAG. |
| **In-Degree** | The count of directed incoming edges terminating at a vertex. | Vertices with `inDegree === 0` have no pending prerequisites and are ready to execute. |
| **Kahn's Algorithm** | An iterative BFS-like algorithm that repeatedly removes vertices with in-degree 0 and decrements neighbor in-degrees. | Natural fit for job schedulers; detects cycles if final processed count $< V$. |
| **Post-Order Reversal** | Collecting vertices as they finish their DFS exploration and reversing the resulting list. | The classical alternative to Kahn's; generates valid topological order in $O(V + E)$. |
| **Parallel Execution Waves** | Grouping all nodes with in-degree 0 in the same BFS queue level to run concurrently. | Enables concurrent task execution in Node.js via `Promise.all()`. |

---

## Core Concepts & Mechanical Architecture

### 1. Topological Ordering Invariants

A **Topological Sort** orders vertices linearly such that dependencies are guaranteed to be resolved before dependent tasks run. If edge $u \to v$ exists, vertex $u$ must appear before vertex $v$ in the final sequence.

```text
Directed Acyclic Graph (DAG) with Multiple Valid Topo Orders:
      (0) --------> (1)
       |           /   \
       v          v     v
      (2) ------> (3) -> (4)

Dependencies:
- Task 0 has in-degree 0 (can start immediately)
- Task 1 requires 0
- Task 2 requires 0
- Task 3 requires 1 AND 2
- Task 4 requires 1 AND 3

Valid Topological Order 1: [0, 1, 2, 3, 4]
Valid Topological Order 2: [0, 2, 1, 3, 4]
Both are mathematically correct! Topo sorts are not necessarily unique.
```

If a graph contains a cycle (e.g., $3 \to 0$), no vertex in the cycle can ever have its dependencies fulfilled first. Consequently, **cyclic graphs cannot be topologically sorted**.

---

### 2. Kahn's Algorithm (In-Degree BFS)

**Algorithm Mechanics**:
1. **Calculate In-Degrees**: Initialize an array `inDegree` of size $V$. For every directed edge $u \to v$, increment `inDegree[v]++`.
2. **Seed Queue**: Enqueue every vertex $v$ that has `inDegree[v] === 0`.
3. **Process Vertices**:
   - Dequeue vertex $u$ and append it to `order`.
   - For each neighbor $v$ of $u$:
     - Decrement `inDegree[v]--`.
     - If `inDegree[v] === 0`, enqueue $v$.
4. **Cycle Invariant**: If `order.length !== V`, the graph contains a cycle that prevented some vertices from ever reaching 0 in-degree.

```text
Kahn's Algorithm Step-by-Step Trace:
Graph: 0 -> 1, 0 -> 2, 1 -> 3, 2 -> 3
Initial In-Degrees: {0: 0, 1: 1, 2: 1, 3: 2}

Step 1: In-Degree 0 Queue: [0]
Step 2: Pop 0 -> Order: [0]
        Decrement neighbors: inDegree[1]=0, inDegree[2]=0
        Enqueue 1, 2 -> Queue: [1, 2]
Step 3: Pop 1 -> Order: [0, 1]
        Decrement neighbor 3: inDegree[3]=1
Step 4: Pop 2 -> Order: [0, 1, 2]
        Decrement neighbor 3: inDegree[3]=0 -> Enqueue 3! Queue: [3]
Step 5: Pop 3 -> Order: [0, 1, 2, 3]
Queue empty. Processed 4 of 4 vertices. Valid DAG!
```

```javascript
// Node.js code: Kahn's Algorithm Implementation
/**
 * Computes topological sort using Kahn's algorithm.
 * Time Complexity: O(V + E)
 * Space Complexity: O(V + E)
 * @param {number} numVertices
 * @param {Array<[number, number]>} edges [u, v] where u -> v
 * @returns {number[] | null} Topological order or null if cycle exists
 */
function kahnsTopologicalSort(numVertices, edges) {
  const adjList = Array.from({ length: numVertices }, () => []);
  const inDegree = new Uint32Array(numVertices);

  for (let i = 0; i < edges.length; i++) {
    const [u, v] = edges[i];
    adjList[u].push(v);
    inDegree[v]++;
  }

  const queue = [];
  let head = 0;

  // Enqueue all nodes with zero dependencies
  for (let i = 0; i < numVertices; i++) {
    if (inDegree[i] === 0) {
      queue.push(i);
    }
  }

  const order = [];

  while (head < queue.length) {
    const curr = queue[head++];
    order.push(curr);

    const neighbors = adjList[curr];
    for (let i = 0; i < neighbors.length; i++) {
      const neighbor = neighbors[i];
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  // Cycle check: If order has fewer than V vertices, a cycle exists
  return order.length === numVertices ? order : null;
}

const testEdges = [[0, 1], [0, 2], [1, 3], [2, 3]];
console.log('Kahn topo order:', kahnsTopologicalSort(4, testEdges)); // [0, 1, 2, 3] or [0, 2, 1, 3]
```

---

### 3. DFS Post-Order Topological Sort

In DFS, a vertex is marked "finished" only after all vertices reachable from it have been completely explored. The vertex that finishes last has no unvisited dependencies, meaning reversing the post-order finishing times yields a valid topological sort.

```text
DFS Topological Sort:
Graph: 0 -> 1 -> 2
DFS Call:
dfs(0)
  dfs(1)
    dfs(2) -> Reaches end! Finishes first. Stack: [2]
  Finishes second. Stack: [2, 1]
Finishes last. Stack: [2, 1, 0]

Reverse Stack: [0, 1, 2] -> Valid Topological Order!
```

```javascript
// Node.js code: DFS Post-Order Topological Sort
/**
 * @param {number} numVertices
 * @param {Array<[number, number]>} edges
 * @returns {number[] | null}
 */
function dfsTopologicalSort(numVertices, edges) {
  const adjList = Array.from({ length: numVertices }, () => []);
  for (const [u, v] of edges) {
    adjList[u].push(v);
  }

  // 0: WHITE (unvisited), 1: GRAY (visiting), 2: BLACK (finished)
  const state = new Uint8Array(numVertices);
  const order = [];
  let hasCycle = false;

  function dfs(u) {
    state[u] = 1; // Mark GRAY

    for (const v of adjList[u]) {
      if (state[v] === 1) {
        hasCycle = true; // Back-edge detected!
        return;
      }
      if (state[v] === 0) {
        dfs(v);
        if (hasCycle) return;
      }
    }

    state[u] = 2; // Mark BLACK
    order.push(u); // Post-order append
  }

  for (let i = 0; i < numVertices; i++) {
    if (state[i] === 0) {
      dfs(i);
      if (hasCycle) return null;
    }
  }

  // Topological order is the reverse of DFS post-order finishing sequence
  return order.reverse();
}
```

---

### 4. Course Schedule II (Ordering Extraction)

In **Course Schedule II** (LeetCode 210), prerequisites are formatted as `[course, prereq]`, meaning edge `prereq -> course`. We must return any valid course completion order, or `[]` if impossible.

```javascript
// Node.js code: Course Schedule II Solution
/**
 * @param {number} numCourses
 * @param {number[][]} prerequisites
 * @returns {number[]}
 */
function findOrder(numCourses, prerequisites) {
  const adjList = Array.from({ length: numCourses }, () => []);
  const inDegree = new Uint32Array(numCourses);

  for (let i = 0; i < prerequisites.length; i++) {
    const [course, prereq] = prerequisites[i];
    adjList[prereq].push(course); // prereq must be taken BEFORE course
    inDegree[course]++;
  }

  const queue = [];
  let head = 0;

  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) {
      queue.push(i);
    }
  }

  const order = [];

  while (head < queue.length) {
    const curr = queue[head++];
    order.push(curr);

    for (let i = 0; i < adjList[curr].length; i++) {
      const dependent = adjList[curr][i];
      inDegree[dependent]--;
      if (inDegree[dependent] === 0) {
        queue.push(dependent);
      }
    }
  }

  return order.length === numCourses ? order : [];
}

console.log('Course Order:', findOrder(4, [[1, 0], [2, 0], [3, 1], [3, 2]])); // [0, 1, 2, 3] or [0, 2, 1, 3]
```

---

## Detailed Node.js Relevance

### Monorepo Build Schedulers & Asynchronous Parallel Waves

In modern Node.js monorepo tooling (such as Turborepo, Nx, and Lerna) and job pipelines, packages depend on one another.

```text
Package Dependency DAG:
    [Core Utils]
       /     \
      v       v
   [UI-Kit]  [Auth-Client]
      \       /
       v     v
    [Web-App]
```

**Parallel Task Batching with Kahn's Algorithm**:
Rather than running tasks strictly sequentially, Kahn's algorithm reveals which tasks can run **in parallel**:
1. **Wave 1**: All packages with in-degree 0 (`[Core Utils]`). Run concurrently using `Promise.all()`.
2. When Wave 1 resolves, decrement downstream in-degrees.
3. **Wave 2**: All packages that now have in-degree 0 (`[UI-Kit, Auth-Client]`). Run concurrently in parallel workers.
4. **Wave 3**: `[Web-App]`.

This reduces total monorepo build time from the sum of all task durations to the duration of the critical dependency path!

---

## Tricky Points & Edge Cases

1. **Reversed Edge Orientation**: The most common interview bug in Course Schedule is reversing edge direction. Prerequisite `[a, b]` means $b$ must be taken before $a$, so edge direction is $b \to a$. Reversing this inverts the entire graph, producing backwards results.
2. **Disconnected Components**: In a graph with isolated nodes or independent subgraphs, Kahn's algorithm naturally enqueues all independent nodes with in-degree 0. No special outer loop is needed because all in-degree 0 nodes are queued initially.
3. **Tie-Breaking / Lexicographical Ordering**: If an interview problem requires the lexicographically smallest topological sort (e.g., Alien Dictionary or LeetCode variations), replace the standard FIFO queue with a **Min-Heap (Priority Queue)**.
4. **Array `unshift()` Degradation in DFS**: In DFS post-order topo sort, calling `order.unshift(u)` after every node finishes introduces an $O(V)$ shift penalty per node, degrading total time to $O(V^2 + E)$. Always `order.push(u)` and reverse the array once at the end in $O(V)$ time.

---

## Hands-On Exercise

### Scenario
You are building an asynchronous workflow executor for a Node.js microservice. You receive tasks and dependencies, and you must schedule them in **concurrent parallel waves**.
Implement `buildExecutionWaves(taskCount, dependencies)`:
1. Returns an array of waves `number[][]` where each sub-array contains tasks that can execute in parallel.
2. If the dependency graph has a cycle, throw an `Error('Circular dependency detected')`.
3. Within each wave, task IDs must be sorted in ascending order for deterministic output.

### Buggy Code
```javascript
function buildExecutionWaves(taskCount, dependencies) {
  const adj = Array.from({ length: taskCount }, () => []);
  const inDegree = new Array(taskCount).fill(0);

  for (const [task, prereq] of dependencies) {
    adj[task].push(prereq); // BUG: Reversed edge direction!
    inDegree[prereq]++;
  }

  const waves = [];
  let queue = [];
  // BUG: Does not partition into discrete parallel levels
  for (let i = 0; i < taskCount; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }

  while (queue.length > 0) {
    waves.push(queue); // BUG: Pushes entire remaining queue rather than snapshot level
    const curr = queue.shift();
    for (const next of adj[curr]) {
      if (--inDegree[next] === 0) queue.push(next);
    }
  }

  return waves;
}
```

### Acceptance Criteria
- Group tasks into discrete sequential execution stages (waves).
- Support independent parallel execution within each stage.
- Accurately detect circular dependencies and throw descriptive errors.
- Ensure time complexity is $O(V + E)$ (excluding sorting inside waves).

### Solution Code
```javascript
const assert = require('assert');

// Node.js code: Parallel Execution Wave Scheduler
/**
 * @param {number} taskCount
 * @param {Array<[number, number]>} dependencies [task, dependsOn]
 * @returns {number[][]}
 */
function buildExecutionWaves(taskCount, dependencies) {
  const adjList = Array.from({ length: taskCount }, () => []);
  const inDegree = new Uint32Array(taskCount);

  // Directed edge: dependsOn -> task
  for (let i = 0; i < dependencies.length; i++) {
    const [task, dependsOn] = dependencies[i];
    adjList[dependsOn].push(task);
    inDegree[task]++;
  }

  let currentWave = [];
  for (let i = 0; i < taskCount; i++) {
    if (inDegree[i] === 0) {
      currentWave.push(i);
    }
  }

  const waves = [];
  let processedCount = 0;

  while (currentWave.length > 0) {
    // Sort deterministically
    currentWave.sort((a, b) => a - b);
    waves.push([...currentWave]);
    processedCount += currentWave.length;

    const nextWave = [];

    // Process all tasks in current concurrent wave
    for (let i = 0; i < currentWave.length; i++) {
      const task = currentWave[i];
      const dependents = adjList[task];

      for (let j = 0; j < dependents.length; j++) {
        const dependent = dependents[j];
        inDegree[dependent]--;
        if (inDegree[dependent] === 0) {
          nextWave.push(dependent);
        }
      }
    }

    currentWave = nextWave;
  }

  if (processedCount !== taskCount) {
    throw new Error('Circular dependency detected');
  }

  return waves;
}

// Verification & Automated Unit Tests
// Test 1: Linear chain 0 -> 1 -> 2
const waves1 = buildExecutionWaves(3, [[1, 0], [2, 1]]);
assert.deepStrictEqual(waves1, [[0], [1], [2]]);

// Test 2: Diamond DAG with parallel wave (0 -> 1, 0 -> 2, then 1, 2 -> 3)
const waves2 = buildExecutionWaves(4, [
  [1, 0],
  [2, 0],
  [3, 1],
  [3, 2]
]);
assert.deepStrictEqual(waves2, [
  [0],       // Wave 1
  [1, 2],    // Wave 2: 1 and 2 run concurrently!
  [3]        // Wave 3
]);

// Test 3: Circular dependency detection
assert.throws(() => {
  buildExecutionWaves(3, [
    [1, 0],
    [2, 1],
    [0, 2] // Cycle: 0 -> 1 -> 2 -> 0
  ]);
}, /Circular dependency detected/);

console.log('✅ All Parallel Execution Wave assertions passed successfully!');
```

### Solution Explanation
1. **Level-by-Level Invariant**: By swapping `currentWave` with `nextWave` at the end of each iteration, we group all tasks whose prerequisites are simultaneously resolved into a discrete parallel batch.
2. **Cycle Safety Check**: If `processedCount !== taskCount`, one or more tasks remained trapped in a cycle with in-degree $> 0$. An error is thrown immediately to prevent invalid execution.
3. **Correct Edge Orientation**: `[task, dependsOn]` maps to `dependsOn -> task`, ensuring upstream dependencies finish before dependents are unlocked.

---

## Summary

- **Topological Sort** arranges DAG vertices into a linear sequence preserving all directed dependency edges ($u \to v \implies u \text{ appears before } v$).
- Topological sorting is possible **if and only if** the directed graph is acyclic.
- **Kahn's Algorithm** uses in-degree counting and a BFS queue to peel away dependency-free nodes. It runs in $O(V + E)$ time and cleanly identifies cycles if fewer than $V$ nodes are processed.
- **DFS Post-Order** topological sort records finished nodes and reverses the result, detecting back-edges via the 3-color state machine.
- In Node.js backend development, Kahn's algorithm powers monorepo build orchestrators and parallel workflow engines by executing tasks in concurrent waves.

---

## Cheat Sheet & Common Pitfalls

| Feature | Kahn's Algorithm (BFS) | DFS Post-Order |
| :--- | :--- | :--- |
| **Data Structure** | In-Degree array + Queue | Call stack + 3-color states + Output stack |
| **Cycle Detection** | `processedCount !== V` | Back-edge to `GRAY (1)` node |
| **Execution Style** | Iterative, queue-driven | Recursive (or explicit stack) |
| **Parallel Batching** | Trivial (process queue level by level) | Difficult (requires extra post-processing) |
| **Lexicographical Sort** | Min-Heap Priority Queue | Inapplicable directly |

---

## Interview Questions

### 1. How does Kahn's algorithm detect cycles in a directed graph?
**Question:** Explain the mechanism by which Kahn's algorithm determines whether a directed graph contains a cycle.

**Answer:**
Kahn's algorithm relies on the mathematical fact that every finite Directed Acyclic Graph (DAG) must contain at least one vertex with in-degree 0.
1. The algorithm enqueues all vertices with `inDegree === 0`.
2. As vertices are dequeued and processed, incoming edges to their neighbors are removed by decrementing neighbor in-degrees.
3. If a graph contains a cycle (e.g., $A \to B \to C \to A$), none of the vertices in that cycle will ever have their in-degree reduced to 0 because every node in the cycle is waiting on another node in the cycle.
4. Consequently, no node from the cycle will ever be enqueued.
5. At the conclusion of the algorithm, if `processedCount < V`, the unprocessed nodes are trapped in one or more cycles, proving the graph is not a DAG.

---

### 2. Can a directed graph have more than one valid topological sort?
**Question:** Under what graph conditions does a DAG have multiple valid topological sorts, and when is the topological sort unique?

**Answer:**
- **Multiple Topo Sorts**: A DAG has multiple valid topological sorts whenever there are two or more independent vertices ready to be processed at the same step (i.e., at some point, the BFS queue contains $\ge 2$ nodes with in-degree 0). Any ordering among these independent vertices yields a valid topological sort.
- **Unique Topo Sort**: A DAG has a **unique** topological sort if and only if there is a directed Hamiltonian path through the graph (a directed path that visits every vertex exactly once). In Kahn's algorithm, this manifests as the queue containing **strictly one element at every single step**. If the queue ever has size $> 1$, multiple orderings are possible.

---

### 3. Why should you avoid `Array.prototype.unshift()` in DFS topological sort?
**Question:** What is the performance penalty of prepending elements using `unshift()` during DFS topological sort, and what is the optimal alternative?

**Answer:**
In JavaScript, arrays are backed by contiguous memory buffers in V8. Calling `array.unshift(element)` prepends an element to index 0, requiring V8 to shift all $N$ existing elements right by one slot in memory ($O(N)$ work).
- If done for all $V$ vertices during DFS post-order completion, the total time complexity degrades from $O(V + E)$ to:
  $$\sum_{i=1}^V O(i) = O(V^2)$$
- **Optimal Alternative**: Append each finished vertex to the end of the array using `order.push(u)` ($O(1)$ amortized), and then call `order.reverse()` once at the end ($O(V)$ time). This maintains strict $O(V + E)$ linear performance.

---

### 4. How do you implement lexicographical topological sort?
**Question:** If an interview problem requires you to find the lexicographically smallest topological sort of a DAG, how do you adapt Kahn's algorithm?

**Answer:**
In standard Kahn's algorithm, any available node with in-degree 0 can be processed. To guarantee the lexicographically smallest order:
1. Replace the standard FIFO queue with a **Min-Priority Queue (Min-Heap)**.
2. Initially, insert all vertices with in-degree 0 into the Min-Heap.
3. At each step, extract the **minimum value** vertex from the Min-Heap.
4. Decrement the in-degrees of its neighbors. Any neighbor whose in-degree becomes 0 is inserted into the Min-Heap.
5. **Complexity**:
   - Time Complexity increases from $O(V + E)$ to $O((V + E) \log V)$ due to heap push and extraction operations.
   - Space Complexity remains $O(V + E)$.

---

<nav aria-label="Lecture navigation">
  <a href="day-39-cycle-detection-directed-and-undirected.md">◀ Day 39: Cycle Detection in Directed and Undirected Graphs</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-41-binary-heap-array-representation.md">Day 41: Binary Heap and Array Representation ▶</a>
</nav>
