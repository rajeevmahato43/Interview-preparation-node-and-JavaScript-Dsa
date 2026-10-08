# Day 54: Union-Find: Disjoint Set Union (DSU)

<nav aria-label="Lecture navigation">
  <a href="day-53-trie-construction-and-prefix-search.md">◀ Day 53: Trie Construction and Prefix Search</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-55-union-find-graph-applications.md">Day 55: Union-Find: Graph Applications and Minimum Spanning Tree (MST) ▶</a>
</nav>

---
## Prerequisites

- [Day 36: Graph Representations and Modeling](day-36-graph-representations-and-modeling.md) — Vertices, edges, and connectivity.
- [Day 38: Graph Traversal: DFS and Connected Components](day-38-graph-traversal-dfs-and-components.md) — Connected components in static graphs.
---

## 1. The Disjoint Set Mechanics and Forest Representation

> **Disjoint Set**: A collection of sets where no two sets share a common element (pairwise intersection is empty).

A **Disjoint Set Union (DSU)** maintains elements $0 \dots N - 1$ grouped into disjoint sets. It supports two primary operations:
1. **`find(x)`**: Finds the representative root of the set containing element $x$.
2. **`union(x, y)`**: Merges the set containing $x$ with the set containing $y$.

```text
DSU Initialization (N = 5 elements):
Each element is its own root!
  (0)   (1)   (2)   (3)   (4)
parent = [0, 1, 2, 3, 4]
rank   = [0, 0, 0, 0, 0]
Components count = 5

After union(0, 1) and union(1, 2):
      (0) [Root]       (3)   (4)
     /   \
   (1)   (2)
parent = [0, 0, 0, 3, 4]
Components count = 3
```

---

## 2. Dual Optimizations: Path Compression and Union by Rank

> **Union by Rank**: Attaching the root of the shallower tree under the root of the deeper tree when merging two sets.

> **Path Compression**: Updating the parent pointer of every node along the lookup path directly to the root during `find`.

#### A. The Naive Stick Degradation Problem:
Without balancing, successive unions can create a linear chain: $(4) \to (3) \to (2) \to (1) \to (0)$. In this degenerate tree, calling `find(4)` takes $O(n)$ linear time.

#### B. Optimization 1: Path Compression
When traversing upward from node $x$ to find the root, we rewire every visited node's parent pointer directly to the root:
```javascript
find(x) {
  if (this.parent[x] === x) return x;
  return (this.parent[x] = this.find(this.parent[x])); // Path compression!
}
```

```text
Path Compression Visualization:
Before find(3):              After find(3):
      (0) [Root]                   (0) [Root]
       |                         /  |  \
      (1)                      (1) (2) (3)
       |                     All descendants now point directly to root!
      (2)                    Tree height permanently collapses to 1.
       |
      (3)
```

#### C. Optimization 2: Union by Rank / Size
Maintain a `rank` array (representing upper bound on tree height). When uniting two roots:
- Attach the root with the smaller rank under the root with the larger rank.
- Only if both ranks are identical do we attach one under the other and increment its rank by 1.

```text
Union by Rank Attachment:
Tree A (Rank 2):         Tree B (Rank 1):
      (A)                      (B)
     /   \                      |
   (1)   (2)                   (3)

Attach B under A (Rank of A remains 2! Tree does not grow taller!)
         (A)
       /  |  \
     (1) (2) (B)
              |
             (3)
```

---

## 3. Implementation: Production-Grade DSU Class

```javascript
// Node.js code: Complete Disjoint Set Union (DSU) Class
class DisjointSetUnion {
  /**
   * @param {number} size
   */
  constructor(size) {
    this.parent = new Int32Array(size);
    this.rank = new Uint8Array(size);
    this.componentsCount = size;

    for (let i = 0; i < size; i++) {
      this.parent[i] = i; // Every node is its own parent initially
      this.rank[i] = 0;
    }
  }

  /**
   * Finds the representative root of element x with Path Compression.
   * Amortized Time Complexity: O(alpha(N)) ≈ O(1)
   * @param {number} x
   * @returns {number}
   */
  find(x) {
    if (this.parent[x] === x) {
      return x;
    }
    // Path compression: flatten tree directly to root
    this.parent[x] = this.find(this.parent[x]);
    return this.parent[x];
  }

  /**
   * Unites sets containing x and y using Union by Rank.
   * Amortized Time Complexity: O(alpha(N)) ≈ O(1)
   * @param {number} x
   * @param {number} y
   * @returns {boolean} true if merged, false if already in same set
   */
  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) {
      return false; // Already in the same set (cycle / redundant edge)
    }

    // Attach smaller rank tree under larger rank tree
    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
    } else {
      this.parent[rootY] = rootX;
      this.rank[rootX]++;
    }

    this.componentsCount--;
    return true;
  }

  /**
   * Checks whether x and y are in the same set.
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  connected(x, y) {
    return this.find(x) === this.find(y);
  }

  /**
   * Returns current total number of disjoint components.
   * @returns {number}
   */
  getComponentsCount() {
    return this.componentsCount;
  }
}

// Verification
const dsu = new DisjointSetUnion(5);
dsu.union(0, 1);
dsu.union(1, 2);
console.log('Is 0 connected to 2?', dsu.connected(0, 2)); // true
console.log('Is 0 connected to 3?', dsu.connected(0, 3)); // false
console.log('Remaining components:', dsu.getComponentsCount()); // 3: {0,1,2}, {3}, {4}
```

---

## 4. Complexity and the Inverse Ackermann Function $\alpha(n)$

When both Path Compression and Union by Rank are applied together:
- Any sequence of $M$ operations on $N$ elements executes in $O(M \cdot \alpha(N))$ time.
- The **Ackermann function** $A(m, n)$ grows at a staggering rate ($A(4, 2) \approx 2^{65536}$, a number with nearly 20,000 digits).
- The **Inverse Ackermann function $\alpha(N)$** is defined as the value of $k$ such that $A(k, 1) \ge N$.
- For all practical computer science inputs ($N < 10^{80}$, the estimated number of atoms in the observable universe), $\alpha(N) \le 4$.
- Therefore, for all engineering and interview purposes, each DSU operation runs in **amortized $O(1)$ constant time**.

---

## Detailed Node.js Relevance

### Dynamic Cluster Partitioning & Split-Brain Detection

In Node.js distributed cluster systems (e.g., node mesh discovery in Raft consensus engines, Redis Sentinel monitoring):

```text
Cluster Mesh Connectivity:
[Node-0] <--- heartbeat ---> [Node-1]
   ^                            ^
   |                            |
[Node-2]                    [Node-3] <--- network split ---> [Node-4]
```

1. **Dynamic Edge Ingestion**: As nodes send UDP heartbeat pings to each other, a cluster controller in Node.js streams edge updates `dsu.union(nodeA, nodeB)`.
2. **Split-Brain Detection**: If `dsu.getComponentsCount() > 1`, a network partition has severed the cluster into isolated components. The partition containing fewer than the majority quorum ($N / 2 + 1$) immediately enters read-only mode, preventing data divergence and split-brain corruption.

---

## Tricky Points & Edge Cases

1. **Missing Path Compression Assignment**:
   ```javascript
   // ❌ COMMON BUG: Forgetting to assign the compressed parent!
   find(x) {
     if (this.parent[x] === x) return x;
     return this.find(this.parent[x]); // Traverses to root, but DOES NOT compress!
   }
   // ✅ FIX: Assign to this.parent[x]
   return (this.parent[x] = this.find(this.parent[x]));
   ```
2. **Unioning Children Instead of Roots**:
   In `union(x, y)`, always call `rootX = this.find(x)` and `rootY = this.find(y)`. Attempting to link `this.parent[x] = y` without finding the root corrupts the tree structure.
3. **0-Indexed vs. 1-Indexed Inputs**:
   If problem vertices are numbered $1$ to $N$, allocate `new DisjointSetUnion(N + 1)` or normalize indices down by 1 (`u - 1, v - 1`).
4. **Typed Arrays for Zero GC Pressure**:
   Using `new Int32Array(size)` and `new Uint8Array(size)` prevents V8 object allocation overhead, ensuring millions of unions execute without triggering garbage collection pauses.

---

## Hands-On Exercise

### Scenario
You are building a peer-to-peer (P2P) network coordinator in Node.js. Given an integer $n$ (total peers $0 \dots n - 1$) and a dynamic stream of connection events `[[peerA, peerB], ...]`, write `auditP2PNetwork(n, connections)`:
1. Returns `{ isFullyConnected: boolean, cycleEdges: Array<[number, number]>, finalClusters: number }`.
2. Identify all **redundant connections** (connections where both peers were already in the same cluster before the edge was added).
3. Determine whether the entire network is fully connected into a single cluster at the end.

### Buggy Code
```javascript
function auditP2PNetwork(n, connections) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const cycles = [];

  for (let [u, v] of connections) {
    // BUG: Missing path compression causes linear degradation
    // BUG: Links u directly without finding roots!
    if (parent[u] === parent[v]) {
      cycles.push([u, v]);
    } else {
      parent[u] = v; // Corrupts set representation!
    }
  }

  return { isFullyConnected: false, cycleEdges: cycles, finalClusters: 0 };
}
```

### Acceptance Criteria
- Use a complete DSU with Path Compression and Union by Rank.
- Correctly isolate cycle edges without modifying valid spanning edges.
- Report accurate cluster counts and total network connectivity.
- Pass automated unit test assertions.

### Solution Code
```javascript
const assert = require('assert');

// Node.js code: Robust P2P Network DSU Auditor
/**
 * @param {number} n
 * @param {Array<[number, number]>} connections
 * @returns {{ isFullyConnected: boolean, cycleEdges: Array<[number, number]>, finalClusters: number }}
 */
function auditP2PNetwork(n, connections) {
  if (n <= 0) {
    return { isFullyConnected: true, cycleEdges: [], finalClusters: 0 };
  }

  const dsu = new DisjointSetUnion(n);
  const cycleEdges = [];

  for (let i = 0; i < connections.length; i++) {
    const [u, v] = connections[i];
    const merged = dsu.union(u, v);

    if (!merged) {
      // Both nodes were already connected; this edge creates a cycle
      cycleEdges.push([u, v]);
    }
  }

  const finalClusters = dsu.getComponentsCount();

  return {
    isFullyConnected: finalClusters === 1,
    cycleEdges: cycleEdges,
    finalClusters: finalClusters
  };
}

// Verification & Automated Unit Tests
// Test 1: Spanning tree with 1 redundant cycle edge
// 4 peers, connections: [0, 1], [1, 2], [2, 0] (cycle!), [2, 3]
const res1 = auditP2PNetwork(4, [
  [0, 1],
  [1, 2],
  [2, 0], // Redundant cycle edge
  [2, 3]
]);

assert.strictEqual(res1.isFullyConnected, true);
assert.strictEqual(res1.finalClusters, 1);
assert.deepStrictEqual(res1.cycleEdges, [[2, 0]]);

// Test 2: Disconnected network
const res2 = auditP2PNetwork(5, [
  [0, 1],
  [2, 3]
]);
assert.strictEqual(res2.isFullyConnected, false);
assert.strictEqual(res2.finalClusters, 3); // Clusters: {0,1}, {2,3}, {4}
assert.deepStrictEqual(res2.cycleEdges, []);

// Test 3: Fully isolated peers
const res3 = auditP2PNetwork(3, []);
assert.strictEqual(res3.isFullyConnected, false);
assert.strictEqual(res3.finalClusters, 3);

console.log('✅ All auditP2PNetwork DSU assertions passed successfully!');
```

### Solution Explanation
1. **Accurate Cycle Detection**: `dsu.union(u, v)` returns `false` if and only if $u$ and $v$ already share the same representative root. This isolates cycle-forming edges in $O(1)$ amortized time.
2. **Component Tracking**: `this.componentsCount--` inside `union` decrements the cluster counter each time two previously disconnected sets merge, providing $O(1)$ component counts.
3. **Optimized V8 Memory**: Pre-allocated typed arrays eliminate garbage collection pauses during real-time streaming analysis.

---

## Summary

- **Disjoint Set Union (DSU)** maintains non-overlapping subsets and dynamically checks connectivity.
- **Path Compression** flattens the tree during `find`, updating pointers directly to the root.
- **Union by Rank** attaches the shallower tree under the deeper tree, preventing unbalanced chains.
- Combining both optimizations achieves $O(\alpha(N)) \approx O(1)$ amortized runtime per operation.
- DSU is the primary algorithm for dynamic cycle detection, connected component counting, and cluster partition detection in Node.js backends.

---

## Cheat Sheet & Common Pitfalls

| Method | Implementation Rule | Pitfall |
| :--- | :--- | :--- |
| **`find(x)`** | `this.parent[x] = this.find(this.parent[x])` | Forgetting assignment breaks path compression |
| **`union(x, y)`** | Find `rootX` and `rootY` first | Uniting child indices directly corrupts tree |
| **Cycle Check** | If `find(x) === find(y)` before union $\implies$ Cycle | Misinterpreting disconnected nodes as cycles |
| **Components** | Decrement `count--` on successful merge | Decrementing when `rootX === rootY` |

---

## Interview Questions

### 1. What is the difference between Path Compression and Union by Rank?
**Question:** Explain the individual roles of Path Compression and Union by Rank in DSU, and what time complexity is achieved if you use only one of them.

**Answer:**
- **Path Compression**:
  - Applied during `find(x)`. It points all visited nodes directly to the root.
  - If used alone without Union by Rank, any sequence of $M$ operations takes $O(M \log N)$ worst-case time.
- **Union by Rank / Size**:
  - Applied during `union(x, y)`. It attaches the shallower tree under the root of the deeper tree to keep the tree balanced.
  - If used alone without Path Compression, operations take $O(\log N)$ time because the maximum tree height is strictly bounded by $\lfloor \log_2 N \rfloor$.
- **Combined**: Using both optimizations simultaneously achieves near-constant $O(\alpha(N))$ amortized time per operation.

---

### 2. Can Union-Find be used to detect cycles in directed graphs?
**Question:** Can standard Disjoint Set Union be used to detect cycles in directed graphs? Why or why not?

**Answer:**
No. Standard DSU **cannot** be used to detect cycles in directed graphs.
- DSU is inherently **symmetric and undirected**: `union(u, v)` represents an undirected relationship where $u$ and $v$ belong to the same mutual component.
- In directed graphs, edge orientation matters. For example, in a diamond DAG ($A \to B, A \to C, B \to D, C \to D$), DSU would union all 4 nodes. When processing the edge $C \to D$, DSU would see that $C$ and $D$ are already connected (via $A$) and falsely declare a cycle!
- Directed graphs require the **3-Color State Machine (DFS)** or **Kahn's Algorithm (in-degrees)** to distinguish between cross-edges and back-edges.

---

### 3. How does DSU compare to BFS/DFS for finding connected components?
**Question:** Compare DSU against BFS/DFS for computing connected components in terms of suitability for dynamic vs. static graphs.

**Answer:**
- **Static Graph (All edges known upfront)**:
  - BFS / DFS takes $O(V + E)$ time and $O(V)$ space.
  - It is straightforward, requires no special data structures, and allows extracting full component paths easily.
- **Dynamic Graph (Edges arrive as a stream one-by-one)**:
  - If using BFS/DFS, adding a new edge would require re-running a traversal ($O(V + E)$ per edge), resulting in $O(E \cdot (V + E))$ time.
  - DSU handles each newly arriving edge in $O(\alpha(V)) \approx O(1)$ time, maintaining connected components dynamically in $O(E \cdot \alpha(V))$ total time.
- **Conclusion**: DFS/BFS is best for static graphs; DSU is strictly superior for dynamic edge streams.

---

### 4. What is the physical meaning of the Inverse Ackermann Function in computer science?
**Question:** Why do computer scientists state that the Inverse Ackermann Function $\alpha(N)$ is a practical constant in real-world software engineering?

**Answer:**
The Ackermann function $A(m, n)$ is a rapidly growing function in computability theory:
- $A(1, n) = 2n + 3$
- $A(2, n) = 2^{n+1} - 1$
- $A(3, n) = 2^{2^{\dots 2}}$ (a tower of exponents of height $n + 3$)
- $A(4, 1) = 16$
- $A(4, 2) = 2^{65536} \approx 10^{19729}$
The Inverse Ackermann function $\alpha(N)$ represents the smallest $k$ such that $A(k, 1) \ge N$.
Because $A(4, 2)$ already exceeds the number of particles in the universe by thousands of orders of magnitude, $\alpha(N)$ will never exceed $4$ for any dataset that can physically exist on Earth. Thus, $\alpha(N) \le 4$ is considered a constant upper bound in all software systems.

---

<nav aria-label="Lecture navigation">
  <a href="day-53-trie-construction-and-prefix-search.md">◀ Day 53: Trie Construction and Prefix Search</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-55-union-find-graph-applications.md">Day 55: Union-Find: Graph Applications and Minimum Spanning Tree (MST) ▶</a>
</nav>
