# Day 40: Topological Sort: Kahn's Algorithm and DFS

## 1. Learning Outcomes
- Understand **Directed Acyclic Graphs (DAGs)** and the definition of a **Topological Sort**.
- Implement **Kahn's Algorithm** (BFS with In-Degrees) for linear ordering and cycle detection in $O(V + E)$ time.
- Implement **DFS Post-Order Topological Sort** (reverse of post-order finishing times).
- Solve **Course Schedule I** (cycle verification) and **Course Schedule II** (ordering extraction).
- Model task execution pipelines, monorepo build orders (Turborepo/Nx), and job schedulers in Node.js.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 19 (Queue & BFS), Day 36 (Graph Representations), Day 39 (Directed Cycle Detection).
- **Navigation**:
  - [Previous: Day 39 - Cycle Detection: Directed & Undirected Graphs](day-39-cycle-detection-directed-and-undirected.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 41 - Binary Heap and Array Representation](day-41-binary-heap-array-representation.md)

---

## 3. Core Concepts & Mental Models
A **Topological Sort** of a directed graph is a linear ordering of vertices such that for every directed edge $u \rightarrow v$, vertex $u$ comes before vertex $v$ in the ordering.
A graph can have a topological sort **if and only if it is a DAG** (Directed Acyclic Graph). If a graph contains even a single cycle, topological ordering is impossible.

```text
Directed Acyclic Graph (DAG):
      [0] -------> [1]
       |          /   \
       v         v     v
      [2] ----> [3] -> [4]

In-Degrees:
  Node 0: 0 incoming edges (Ready immediately)
  Node 1: 1 incoming edge (from 0)
  Node 2: 1 incoming edge (from 0)
  Node 3: 2 incoming edges (from 1, 2)
  Node 4: 2 incoming edges (from 1, 3)

Valid Topological Orderings:
  [0, 1, 2, 3, 4]  OR  [0, 2, 1, 3, 4]
```

---

## 4. Detailed Technical Explanations

### 4.1 Kahn's Algorithm (BFS with In-Degrees)
1. **Compute In-Degrees**: Array storing the count of incoming edges for every vertex.
2. **Initialize Queue**: Enqueue all vertices with `inDegree === 0` (nodes with zero prerequisites).
3. **Process Vertices**:
   - Dequeue vertex $u$, append to `topologicalOrder`.
   - For each neighbor $v$ of $u$, decrement `inDegree[v]--`.
   - If `inDegree[v] === 0`, enqueue $v$ (all prerequisites are fulfilled!).
4. **Cycle Invariant**: If `topologicalOrder.length !== V`, a cycle exists preventing some nodes from ever reaching 0 in-degree.

### 4.2 DFS Post-Order Approach
1. Perform standard DFS on unvisited nodes.
2. After all descendants of a node $u$ are completely visited (post-order exit point), push $u$ onto a results stack.
3. The topological order is the reverse of this post-order sequence (or unshifted into an array).
4. Combine with 3-color states (White/Gray/Black) to detect cycles during DFS.

### 4.3 Node.js Relevance: Monorepo Build Pipelines & Task Runners
In monorepo tools like Turborepo, Nx, or Lerna running on Node.js, packages depend on one another (e.g., `web` depends on `ui`, `ui` depends on `utils`). Kahn's algorithm parses `package.json` dependencies into a DAG, builds independent libraries with 0 in-degree in parallel using worker threads, and releases dependent builds as prerequisites complete.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 Course Schedule II (Kahn's Algorithm - LeetCode 210)
```javascript
/**
 * Returns valid course order, or empty array if cycle exists.
 * Time Complexity: O(V + E)
 * Space Complexity: O(V + E)
 */
function findOrder(numCourses, prerequisites) {
  const adj = Array.from({ length: numCourses }, () => []);
  const inDegree = new Uint32Array(numCourses);

  // 1. Build adjacency list and calculate in-degrees
  // prerequisite [a, b] means b -> a (must take b before a)
  for (const [course, prereq] of prerequisites) {
    adj[prereq].push(course);
    inDegree[course]++;
  }

  // 2. Enqueue all courses with no prerequisites (in-degree 0)
  const queue = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) {
      queue.push(i);
    }
  }

  const order = [];

  // 3. Process BFS queue
  while (queue.length > 0) {
    const curr = queue.shift();
    order.push(curr);

    for (const nextCourse of adj[curr]) {
      inDegree[nextCourse]--;
      // When all prerequisites are cleared, add to queue
      if (inDegree[nextCourse] === 0) {
        queue.push(nextCourse);
      }
    }
  }

  // 4. If all courses are in order, return order; else graph has cycle!
  return order.length === numCourses ? order : [];
}
```

### 5.2 Topological Sort via DFS
```javascript
/**
 * DFS Topological Sort with 3-color cycle detection.
 */
function topologicalSortDFS(numCourses, prerequisites) {
  const adj = Array.from({ length: numCourses }, () => []);
  for (const [course, prereq] of prerequisites) {
    adj[prereq].push(course);
  }

  const state = new Uint8Array(numCourses); // 0=Unvisited, 1=Visiting, 2=Visited
  const order = [];

  function dfs(node) {
    state[node] = 1; // Mark Visiting

    for (const neighbor of adj[node]) {
      if (state[neighbor] === 1) return false; // Cycle detected!
      if (state[neighbor] === 0) {
        if (!dfs(neighbor)) return false;
      }
    }

    state[node] = 2; // Mark Visited
    order.push(node); // Push at post-order exit
    return true;
  }

  for (let i = 0; i < numCourses; i++) {
    if (state[i] === 0) {
      if (!dfs(i)) return []; // Return empty on cycle
    }
  }

  return order.reverse(); // Reverse post-order to get topological sequence
}
```

### 5.3 Execution Trace: Kahn's Algorithm on `numCourses = 4`, `prerequisites = [[1,0],[2,0],[3,1],[3,2]]`
```text
Graph: 0 -> 1, 0 -> 2, 1 -> 3, 2 -> 3
inDegrees: [0:0, 1:1, 2:1, 3:2]

Step 1: Node 0 has inDegree 0. queue = [0]. order = [].
Step 2: Dequeue 0. order = [0].
        Decrement neighbors 1 and 2:
        inDegree[1] = 0 -> queue.push(1)
        inDegree[2] = 0 -> queue.push(2)
        queue = [1, 2].
Step 3: Dequeue 1. order = [0, 1].
        Decrement neighbor 3: inDegree[3] = 1 (not zero yet).
Step 4: Dequeue 2. order = [0, 1, 2].
        Decrement neighbor 3: inDegree[3] = 0 -> queue.push(3).
Step 5: Dequeue 3. order = [0, 1, 2, 3].
order.length (4) === numCourses (4).
Valid schedule returned: [0, 1, 2, 3]!
```

---

## 6. Common Mistakes & Anti-Patterns
- **Reversing Prerequisite Direction**: In Course Schedule, `[a, b]` means $b \rightarrow a$ ($b$ must be taken before $a$). Modeling edge as $a \rightarrow b$ reverses the dependency chain and fails tests.
- **Forgetting Cycle Check**: Returning `order` directly without verifying `order.length === numCourses` produces partial sequences when cycles exist.
- **Using `Array.unshift()` Repeatedly in DFS**: Calling `order.unshift(node)` inside DFS adds an $O(k)$ copy on every node ($O(V^2)$ total). Call `order.push(node)` and reverse the array once at the end ($O(V)$).

---

## 7. Tricky Points & Edge Cases
- **Multiple Valid Topological Orders**: A DAG can have multiple valid topological sorts. Any ordering that respects edge dependencies is correct.
- **Disconnected Vertices**: Nodes with 0 incoming and 0 outgoing edges are immediately pushed into the queue and can appear anywhere in the topological sequence.
- **Self-Dependencies (`[1, 1]`)**: Kahn's algorithm handles self-loops naturally: node 1 starts with `inDegree = 1`, but nobody can decrement it, so it is never added to the queue, and `order.length < numCourses` detects the cycle.

---

## 8. Practical Engineering Exercises
1. Implement **Alien Dictionary** (LeetCode 269) deriving character order from a sorted dictionary of alien words.
2. Given a build dependency graph, group jobs into parallel execution batches where all tasks in batch $k$ can execute concurrently.

---

## 9. Key Takeaways & Summary
- Topological sort exists if and only if a directed graph is a DAG.
- Kahn's algorithm uses BFS with in-degrees, repeatedly processing nodes with zero dependencies.
- A cycle is detected if the final topological sort contains fewer nodes than $V$.
- DFS post-order traversal reversed yields an identical valid topological order.

---

## 10. Quick Reference Cheat Sheet
| Approach | Data Structure | Cycle Detection Invariant | Complexity |
| :--- | :--- | :--- | :--- |
| **Kahn's (BFS)** | In-degree array + Queue | `order.length !== V` | $O(V + E)$ time, $O(V)$ space |
| **DFS Post-Order** | Recursion stack + 3-color state | Back-edge to Gray node | $O(V + E)$ time, $O(V)$ space |
| **Parallel Stages** | Level-order queue snapshot | Items in same level run concurrently | $O(V + E)$ time |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: How does Kahn's algorithm simultaneously generate a valid topological sort and detect cycles?  
**Hint**: What happens to nodes involved in a directed cycle?  
**Expected Answer Shape**: Kahn's algorithm only enqueues nodes when their in-degree reaches 0. In a directed cycle, every node has at least one incoming edge from another node in the cycle. Because none of these nodes can ever reach an in-degree of 0, they are never enqueued. If `order.length < V` after the queue is empty, the unprocessed nodes belong to or depend on a cycle, confirming cycle existence.

### 2. Code-Writing
**Question**: Modify Kahn's algorithm to partition tasks into parallel execution stages (batches of tasks that can run simultaneously).  
**Hint**: Use level-order BFS snapshot sizing on the queue.  
**Expected Answer Shape**: While `queue.length > 0`, snapshot `levelSize = queue.length`. Allocate `stage = []`. Loop `levelSize` times: pop node, push to `stage`, decrement neighbors, and enqueue if in-degree hits 0. Push `stage` to `allStages`. Each stage array represents independent tasks that can execute concurrently in parallel worker threads.

### 3. Debugging
**Question**: Identify why this topological sort crashes on large graphs:  
```javascript
function topoDFS(adj, n) {
  const visited = new Set();
  const order = [];
  function dfs(u) {
    visited.add(u);
    for (const v of adj[u]) {
      if (!visited.has(v)) dfs(v);
    }
    order.unshift(u);
  }
  for (let i = 0; i < n; i++) if (!visited.has(i)) dfs(i);
  return order;
}
```  
**Hint**: Check array operation complexity and recursion depth.  
**Expected Answer Shape**: 1) `order.unshift(u)` reindexes the array on every insertion, causing $O(V^2)$ time instead of $O(V)$. 2) For large graphs ($V > 10,000$), deep dependency chains cause call stack overflow in V8. 3) It lacks cycle detection; if a cycle exists, it fails to terminate or produces an invalid topological order.

### 4. System Design / Tradeoff
**Question**: In designing a CI/CD build pipeline in Node.js (e.g., GitHub Actions / Jenkins DAG runner), why is Kahn's algorithm preferred over DFS for task dispatching?  
**Hint**: Think about real-time streaming of ready jobs.  
**Expected Answer Shape**: DFS explores one branch to completion before backtracking, which is inherently sequential. Kahn's algorithm identifies *all* tasks with 0 pending dependencies at any given instant. As worker tasks finish on remote build nodes, their completed event decrements downstream task dependencies in Node.js; whenever a task's in-degree drops to 0, it can be immediately dispatched to an idle worker for maximum parallelism.

### 5. Tricky / Edge Case
**Question**: Can an undirected graph have a topological sort? Why or why not?  
**Hint**: Consider the formal definition of topological ordering.  
**Expected Answer Shape**: No. In an undirected graph, every edge $(u, v)$ can be traversed in both directions ($u \rightarrow v$ and $v \rightarrow u$). This creates a mutual dependency cycle between every pair of connected nodes, violating the strict prerequisite ordering required by topological sorting.

### 6. Real-World Node.js Context
**Question**: How does a tool like Webpack or Vite use topological sort when generating bundled JavaScript chunks?  
**Hint**: Evaluation order of ES modules (`import`/`export`).  
**Expected Answer Shape**: ES modules must be executed in dependency order: imported dependencies must initialize before the importing module runs. Webpack constructs a module dependency DAG and executes a topological sort to arrange chunks in the output HTML/bundle so that runtime dependencies evaluate in strict topological sequence, avoiding `ReferenceError: Cannot access variable before initialization`.
