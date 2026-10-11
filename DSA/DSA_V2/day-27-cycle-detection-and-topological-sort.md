# Day 27: Directed Graphs & Topological Sort

<nav aria-label="Lecture navigation">

[Previous: Graphs: BFS & DFS](day-26-graphs-bfs-shortest-path-and-dfs-components.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Heaps & Priority Queues](day-28-binary-heaps-and-priority-queues.md)

</nav>

## Prerequisites

- [Day 15: Queues & Circular Buffers](day-15-queues-circular-buffers-and-design.md) — BFS Queues.
- [Day 26: Graphs: BFS & DFS](day-26-graphs-bfs-shortest-path-and-dfs-components.md) — Adjacency lists.

---

## 1. Directed Graphs and Topological Sort

A **Directed Graph** has edges with arrows pointing one way ($A \to B$ means $A$ must happen before $B$).

> **Topological Sort**: A linear ordering of tasks where every prerequisite comes before the task itself.

```text
Prerequisites:
  Task 0 ──► Task 1 ──► Task 2
Valid Order: [ 0, 1, 2 ]
```

### The Golden Rule: Cycles Break Topological Sort
If a directed graph has a **cycle** ($A \to B \to C \to A$), no task can start first!
> **Topological sort is possible IF AND ONLY IF the graph has NO cycles (it is a DAG - Directed Acyclic Graph).**

---

## 2. Cycle Detection: 3-Color DFS

In directed graphs, a simple boolean `visited` is not enough (two paths can reach the same node without a cycle, like a diamond).
To detect true cycles, we track whether a node is **currently active on the recursion stack**:

- **0 (Unvisited):** Haven't touched yet.
- **1 (Visiting / On Stack):** Currently exploring this branch. Seeing a `1` again means we hit our own tail $\implies$ **CYCLE!**
- **2 (Finished):** Completely explored and safe.

```javascript
// 3-Color Cycle Detection DFS
function hasCycle(node, adj, state) {
  state[node] = 1; // Mark active on recursion stack

  for (const neighbor of adj[node] || []) {
    if (state[neighbor] === 1) return true; // Cycle detected!
    if (state[neighbor] === 0 && hasCycle(neighbor, adj, state)) return true;
  }

  state[node] = 2; // Finished exploring
  return false;
}
```

---

## 3. Problem 1: Course Schedule I

There are `numCourses` courses to take. You are given `prerequisites = [[a, b]]` (must take `b` before `a`). Return `true` if you can finish all courses (no cycle exists).

```javascript
// Node.js code: Course Schedule (Cycle Detection)
function canFinish(numCourses, prerequisites) {
  // Build adjacency list: b -> a
  const adj = Array.from({ length: numCourses }, () => []);
  for (const [course, prereq] of prerequisites) {
    adj[prereq].push(course);
  }

  // 0 = unvisited, 1 = visiting (on stack), 2 = finished
  const state = new Uint8Array(numCourses);

  function hasCycle(node) {
    state[node] = 1;

    for (const nextCourse of adj[node]) {
      if (state[nextCourse] === 1) return true; // Cycle!
      if (state[nextCourse] === 0 && hasCycle(nextCourse)) return true;
    }

    state[node] = 2;
    return false;
  }

  for (let i = 0; i < numCourses; i++) {
    if (state[i] === 0) {
      if (hasCycle(i)) return false; // Found cycle!
    }
  }

  return true;
}

console.log(canFinish(2, [[1, 0]]));         // true (take 0, then 1)
console.log(canFinish(2, [[1, 0], [0, 1]])); // false (deadlock cycle!)
```
- **Time Complexity:** $O(V + E)$
- **Extra Space:** $O(V + E)$

---

## 4. Problem 2: Course Schedule II (Kahn's BFS Algorithm)

Return the actual order of courses you should take.

### Kahn's In-Degree Algorithm (BFS):
1. **In-Degree**: Count how many prerequisites each course requires.
2. Push all courses with **0 prerequisites** (`inDegree === 0`) into a Queue.
3. While Queue is not empty:
   - Dequeue course, add to order.
   - For each dependent course, decrement its `inDegree`.
   - When a course's `inDegree` reaches `0`, enqueue it!
4. If the final order length equals `numCourses`, return the order. Otherwise, return `[]` (cycle detected).

```javascript
// Node.js code: Kahn's Algorithm
function findOrder(numCourses, prerequisites) {
  const adj = Array.from({ length: numCourses }, () => []);
  const inDegree = new Array(numCourses).fill(0);

  for (const [course, prereq] of prerequisites) {
    adj[prereq].push(course);
    inDegree[course]++; // course requires 1 more prerequisite
  }

  // Enqueue courses with 0 prerequisites
  const queue = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }

  const order = [];

  while (queue.length > 0) {
    const course = queue.shift();
    order.push(course);

    for (const nextCourse of adj[course]) {
      inDegree[nextCourse]--;
      if (inDegree[nextCourse] === 0) {
        queue.push(nextCourse);
      }
    }
  }

  return order.length === numCourses ? order : [];
}

console.log(findOrder(4, [[1,0],[2,0],[3,1],[3,2]]));
// Output: [0, 1, 2, 3] (or [0, 2, 1, 3])
```
- **Time Complexity:** $O(V + E)$
- **Extra Space:** $O(V + E)$

---

## 5. Tricky Points and Common Traps

1. **Prerequisite order direction:** In `prerequisites = [[a, b]]`, you must take `b` before `a`. The directed edge goes **from `b` to `a`** (`adj[b].push(a)`).
2. **Disconnected graphs:** Courses might be split into independent clusters. You must loop through all vertices $0 \dots V - 1$ to check each component.

---

## 6. Hands-On Exercises

Run this script in Node.js to verify course scheduling:

```javascript
// Node.js code
const assert = require("node:assert");

function testCanFinish(n, pre) {
  const adj = Array.from({ length: n }, () => []);
  const deg = new Array(n).fill(0);
  for (const [a, b] of pre) { adj[b].push(a); deg[a]++; }
  const q = [];
  for (let i = 0; i < n; i++) if (deg[i] === 0) q.push(i);
  let count = 0;
  while (q.length) {
    const u = q.shift();
    count++;
    for (const v of adj[u]) if (--deg[v] === 0) q.push(v);
  }
  return count === n;
}

assert.equal(testCanFinish(2, [[1, 0]]), true);
assert.equal(testCanFinish(2, [[1, 0], [0, 1]]), false);

console.log("✅ Topological sort assertions passed!");
```

---

## 7. Summary

- **Topological Sort** arranges directed tasks in valid dependency order.
- **Cycles break topological sort**; cycles indicate circular dependencies.
- **3-Color DFS** detects cycles by checking if a neighbor is currently on the recursion stack (`state === 1`).
- **Kahn's Algorithm (BFS)** builds the order by processing nodes with `inDegree === 0`.

---

## 8. Cheat Sheet

| Technique | How It Works | Use Case |
| :--- | :--- | :--- |
| **3-Color DFS** | State 0 (white), 1 (gray/stack), 2 (black/done) | Cycle detection |
| **Kahn's BFS** | In-degrees array + Queue of 0-degree nodes | Generating order |
| **Complexity** | **$O(V + E)$ time**, **$O(V + E)$ space** | Universal |

---

## 9. Interview Q&A

### 45-Second Explanation
> *"To determine if all courses can be completed, we model the prerequisites as a directed graph where an edge points from prerequisite to course. A valid completion order exists if and only if the graph has no directed cycles. Using Kahn's algorithm, we compute the in-degree of each course and enqueue those with zero prerequisites. We iteratively process the queue, decrementing the in-degrees of dependent courses. If the number of processed courses equals the total courses, no cycle exists; otherwise, a circular dependency is present."*

---

## 10. Practice Problems

### 1. Course Schedule - Medium
There are a total of `numCourses` courses you have to take, labeled from `0` to `numCourses - 1`. You are given an array `prerequisites` where `prerequisites[i] = [a_i, b_i]` indicates that you must take course `b_i` first if you want to take course `a_i`. Return `true` if you can finish all courses. Otherwise, return `false`.
- **Input:** `numCourses = 2, prerequisites = [[1,0]]`
- **Expected Output:** `true`
- **Input:** `numCourses = 2, prerequisites = [[1,0],[0,1]]`
- **Expected Output:** `false`

### 2. Course Schedule II - Medium
There are a total of `numCourses` courses you have to take, labeled from `0` to `numCourses - 1`. You are given an array `prerequisites` where `prerequisites[i] = [a_i, b_i]` indicates that you must take course `b_i` first if you want to take course `a_i`. Return the ordering of courses you should take to finish all courses. If there are many valid answers, return any of them. If it is impossible to finish all courses, return an empty array.
- **Input:** `numCourses = 2, prerequisites = [[1,0]]`
- **Expected Output:** `[0,1]`
- **Input:** `numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]`
- **Expected Output:** `[0,2,1,3]`
- **Input:** `numCourses = 1, prerequisites = []`
- **Expected Output:** `[0]`

### 3. Minimum Height Trees - Medium
A tree is an undirected graph in which any two vertices are connected by exactly one path. In other words, any connected graph without simple cycles is a tree. Given a tree of `n` nodes labelled from `0` to `n - 1`, and an array of `n - 1` `edges`, return a list of all MHTs' root labels. You can return the answer in any order.
- **Input:** `n = 4, edges = [[1,0],[1,2],[1,3]]`
- **Expected Output:** `[1]`
- **Input:** `n = 6, edges = [[3,0],[3,1],[3,2],[3,4],[5,4]]`
- **Expected Output:** `[3,4]`

---

<nav aria-label="Lecture navigation">

[Previous: Graphs: BFS & DFS](day-26-graphs-bfs-shortest-path-and-dfs-components.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Heaps & Priority Queues](day-28-binary-heaps-and-priority-queues.md)

</nav>
