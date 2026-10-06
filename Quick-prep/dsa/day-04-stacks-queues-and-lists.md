# Day 4: Trees and Graphs

Quick review of main-course lectures 31–40. Covers binary tree traversals, BST invariants, graph modeling, shortest paths, connected components, and topological ordering.

## Trees, BSTs, and hierarchies

**1. Tree DFS traversals and depth**

Preorder (`N-L-R`), Inorder (`L-N-R`, yields sorted order in BST), Postorder (`L-R-N`, useful for bottom-up subtree aggregations like height and diameter).

```js
function maxDepth(root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

**2. Level-order traversal (BFS) and tree views**

Process trees level by level using a queue. Snapshot `queue.length` at each iteration to delimit current level before pushing child nodes.

```js
function levelOrder(root) {
  if (!root) return [];
  const res = [], queue = [root];
  while (queue.length) {
    const levelSize = queue.length, level = [];
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    res.push(level);
  }
  return res;
}
```

**3. BST validation**

A valid BST requires all nodes in the left subtree to be strictly less than the root, and all nodes in the right subtree to be strictly greater. Pass valid `[min, max]` intervals down the call stack.

```js
function isValidBST(root, min = -Infinity, max = Infinity) {
  if (!root) return true;
  if (root.val <= min || root.val >= max) return false;
  return isValidBST(root.left, min, root.val) && isValidBST(root.right, root.val, max);
}
```

**4. Lowest Common Ancestor (LCA)**

Bottom-up postorder search. If the current node matches $P$ or $Q$, return it. If both left and right subtrees return non-null matches, the current node is the LCA.

```js
function lowestCommonAncestor(root, p, q) {
  if (!root || root === p || root === q) return root;
  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);
  if (left && right) return root;
  return left ?? right;
}
```

[Binary tree basics](../../DSA/dsa-lectures/day-31-binary-tree-fundamentals-and-dfs.md) | [BFS and views](../../DSA/dsa-lectures/day-32-level-order-traversal-bfs-and-views.md) | [Depth and diameter](../../DSA/dsa-lectures/day-33-tree-depth-diameter-and-path-sums.md) | [BST validation and CRUD](../../DSA/dsa-lectures/day-34-binary-search-trees-crud-and-validation.md) | [LCA and serialization](../../DSA/dsa-lectures/day-35-lowest-common-ancestor-and-serialization.md)

## Graphs, connectivity, and topological sorting

**1. Graph representation**

Model edges using an adjacency list (`Map<Node, Node[]>`), consuming $O(V + E)$ space compared to $O(V^2)$ for an adjacency matrix.

```js
const adj = new Map();
function addEdge(u, v) {
  if (!adj.has(u)) adj.set(u, []);
  adj.get(u).push(v);
}
```

**2. BFS shortest path in unweighted graphs**

Use a queue and mark nodes visited immediately upon enqueueing. The first time the target node is visited guarantees minimum step distance.

```js
function shortestPath(start, target, adj) {
  const queue = [[start, 0]], visited = new Set([start]);
  while (queue.length) {
    const [curr, dist] = queue.shift();
    if (curr === target) return dist;
    for (const neighbor of (adj.get(curr) ?? [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, dist + 1]);
      }
    }
  }
  return -1;
}
```

**3. DFS and connected components (Number of Islands)**

Scan each cell in a grid; on finding land (`'1'`), increment component count and recursively sink adjacent land cells to `'0'` (or mark visited).

```js
function numIslands(grid) {
  let count = 0;
  function sink(r, c) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] !== '1') return;
    grid[r][c] = '0'; // sink land
    sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1);
  }
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === '1') { count++; sink(r, c); }
    }
  }
  return count;
}
```

**4. Cycle detection in directed graphs (3-color DFS)**

Track 3 states per node: `0` (unvisited), `1` (currently visiting in call stack), and `2` (completely explored). Encountering state `1` proves a back-edge cycle.

```js
function hasCycleDirected(n, edges) {
  const state = new Array(n).fill(0); // 0: unvisited, 1: visiting, 2: visited
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v);

  function dfs(u) {
    state[u] = 1;
    for (const v of adj[u]) {
      if (state[v] === 1) return true; // cycle detected
      if (state[v] === 0 && dfs(v)) return true;
    }
    state[u] = 2;
    return false;
  }
  for (let i = 0; i < n; i++) if (state[i] === 0 && dfs(i)) return true;
  return false;
}
```

**5. Topological sort (Kahn's BFS algorithm)**

Compute in-degrees for each vertex. Seed queue with vertices having `inDegree === 0`. Dequeue nodes, append to result order, and decrement neighbor in-degrees; if result size $< V$, a cycle exists.

```js
function topoSort(numCourses, prerequisites) {
  const inDegree = new Array(numCourses).fill(0);
  const adj = Array.from({ length: numCourses }, () => []);
  for (const [course, pre] of prerequisites) {
    adj[pre].push(course);
    inDegree[course]++;
  }
  const queue = [], order = [];
  for (let i = 0; i < numCourses; i++) if (inDegree[i] === 0) queue.push(i);
  while (queue.length) {
    const u = queue.shift();
    order.push(u);
    for (const v of adj[u]) {
      if (--inDegree[v] === 0) queue.push(v);
    }
  }
  return order.length === numCourses ? order : []; // empty if cycle
}
```

[Graph modeling](../../DSA/dsa-lectures/day-36-graph-representations-and-modeling.md) | [BFS shortest path](../../DSA/dsa-lectures/day-37-graph-traversal-bfs-and-shortest-path.md) | [DFS components](../../DSA/dsa-lectures/day-38-graph-traversal-dfs-and-components.md) | [Cycle detection](../../DSA/dsa-lectures/day-39-cycle-detection-directed-and-undirected.md) | [Topological sort](../../DSA/dsa-lectures/day-40-topological-sort-kahns-and-dfs.md)

## Tricky points

1. **Tree invariants**
   **1.1 BST validation traps:** Checking only direct children (`node.left.val < node.val`) fails when a left grandchild is larger than the root. Propagate global `min` and `max` limits down recursion.
   **1.2 Diameter calculation:** The longest path (diameter) does not necessarily pass through the tree root; calculate diameter as `leftDepth + rightDepth` at every node while returning subtree depth `1 + Math.max(leftDepth, rightDepth)`.

2. **Graph traversals**
   **2.1 BFS visited timing:** Mark nodes visited when pushing into the queue, *not* when popping; late marking allows duplicate enqueueing, inflating memory to $O(V^2)$.
   **2.2 Directed vs undirected cycles:** Undirected cycle checks require passing the parent node to avoid mistaking the incoming edge for a cycle; directed graphs require 3-color or explicit path tracking.
   **2.3 Disconnected components:** Graphs are not guaranteed to be fully connected; always run outer loops over all vertices $0..V-1$ to catch isolated nodes and components.