# Day 55: Union-Find: Graph Applications and Minimum Spanning Tree (MST)

## 1. Learning Outcomes
- Apply Union-Find to detect cycles and solve **Redundant Connection** in undirected graphs.
- Solve the **Accounts Merge** problem combining string indexing with DSU set clustering.
- Master **Kruskal's Algorithm** for finding the **Minimum Spanning Tree (MST)** in weighted graphs.
- Compare Kruskal's Algorithm with Prim's Algorithm for sparse vs. dense graphs.
- Model multi-VPC cloud peering costs, fiber-optic network routing, and profile merging in Node.js.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 36 (Graph Representations), Day 51 (Greedy Algorithms), Day 54 (Disjoint Set Union).
- **Navigation**:
  - [Previous: Day 54 - Union-Find: Disjoint Set Union (DSU)](day-54-union-find-disjoint-set-union.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 56 - Mixed Pattern Strategy & Constraints](day-56-mixed-pattern-strategy-and-constraints.md)

---

## 3. Core Concepts & Mental Models
A tree with $V$ vertices must have exactly $V - 1$ edges and contain **zero cycles**. Adding any single edge between two already connected vertices inevitably creates a cycle:

```text
Redundant Connection Invariant:
(1) --- (2)
 |     /
 |   /      Adding edge (1, 3):
(3)         find(1) === 1, find(3) === 1 (Already connected!).
            Therefore, (1, 3) creates the cycle! Return [1, 3]!

Kruskal's Minimum Spanning Tree (MST):
Goal: Connect all V vertices with minimum total edge weight using exactly V - 1 edges.
1. Sort all edges ascending by weight.
2. Greedily pick edges from smallest to largest.
3. If endpoints are already connected (find(u) === find(v)), DISCARD (avoids cycles).
4. Otherwise, UNION endpoints and include edge in MST!
```

---

## 4. Detailed Technical Explanations

### 4.1 Redundant Connection Pattern
Given an undirected graph with $N$ vertices that started as a tree with 1 extra edge added ($N$ edges total):
- Process edges sequentially using `dsu.union(u, v)`.
- The very first edge where `dsu.union(u, v) === false` (meaning both endpoints already share the same root) is the redundant cycle edge that can be removed.

### 4.2 Accounts Merge Pattern
Given user accounts with names and lists of emails:
- Two accounts belong to the same person if they share at least one email.
- **Mapping Protocol**:
  1. Assign a unique integer ID to each unique email.
  2. Map each email to the person's name: `emailToName.set(email, name)`.
  3. For each account, `union` the first email's ID with all subsequent emails in that account.
  4. Group emails by their representative root (`find(emailId)`).
  5. Sort emails alphabetically within each group and format the output.

### 4.3 Kruskal's vs. Prim's Algorithm
| Algorithm | Approach | Time Complexity | Best For |
| :--- | :--- | :--- | :--- |
| **Kruskal's** | Edge-based greedy + Union-Find | $O(E \log E)$ | Sparse graphs ($E \ll V^2$) |
| **Prim's** | Vertex-based greedy + Min-Heap | $O(E \log V)$ | Dense graphs ($E \approx V^2$) |

### 4.4 Node.js Relevance: Cloud VPC Peering & Network Topology Optimization
In cloud infrastructure tooling written in Node.js (e.g., Terraform CDK, AWS CloudFormation generators), interconnecting 50 Virtual Private Clouds (VPCs) with dedicated fiber links incurs direct bandwidth and peering connection costs. Kruskal's MST algorithm determines the minimum set of 49 peering connections required to fully interconnect all VPCs with the lowest possible monthly infrastructure bill.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 Redundant Connection (LeetCode 684)
```javascript
import { DisjointSet } from './day-54-union-find-disjoint-set-union.js';

/**
 * Finds edge that can be removed so graph becomes a valid tree.
 * Time Complexity: O(E * alpha(V)) ≈ O(E)
 * Space Complexity: O(V)
 */
function findRedundantConnection(edges) {
  const n = edges.length;
  // Vertices are 1-indexed (1 to n)
  const dsu = new DisjointSet(n + 1);

  for (const [u, v] of edges) {
    // If u and v already in the same set, this edge forms a cycle!
    if (!dsu.union(u, v)) {
      return [u, v];
    }
  }

  return [];
}
```

### 5.2 Kruskal's Minimum Spanning Tree
```javascript
/**
 * Computes minimum cost to connect all nodes.
 * @param {number} n - Number of vertices (0 to n - 1)
 * @param {Array<[number, number, number]>} edges - [u, v, weight]
 * Time Complexity: O(E log E)
 * Space Complexity: O(V + E)
 */
function kruskalMST(n, edges) {
  // 1. Sort edges ascending by weight
  edges.sort((a, b) => a[2] - b[2]);

  const dsu = new DisjointSet(n);
  let totalCost = 0;
  const mstEdges = [];

  // 2. Greedily pick smallest edges
  for (const [u, v, weight] of edges) {
    if (dsu.union(u, v)) {
      totalCost += weight;
      mstEdges.push([u, v, weight]);

      // Optimization: A spanning tree has exactly n - 1 edges
      if (mstEdges.length === n - 1) {
        break;
      }
    }
  }

  // If graph is not fully connected
  if (mstEdges.length !== n - 1) {
    return { cost: -1, edges: [] };
  }

  return { cost: totalCost, edges: mstEdges };
}
```

### 5.3 Execution Trace: Kruskal's MST on 4 Nodes
```text
Nodes: 0, 1, 2, 3
Edges: [[0,1,1], [1,2,2], [0,2,4], [2,3,3], [0,3,5]]
Sorted by weight: [0,1,1], [1,2,2], [2,3,3], [0,2,4], [0,3,5]

Edge [0, 1, 1]: union(0, 1) -> Success. Cost = 1. mstEdges = 1.
Edge [1, 2, 2]: union(1, 2) -> Success. Cost = 3. mstEdges = 2.
Edge [2, 3, 3]: union(2, 3) -> Success. Cost = 6. mstEdges = 3 (equals 4 - 1 = 3!).
Terminates early! Edge [0, 2, 4] and [0, 3, 5] skipped.
MST Cost: 6. Edges: [[0,1,1], [1,2,2], [2,3,3]].
```

---

## 6. Common Mistakes & Anti-Patterns
- **Forgetting 1-Based Indexing**: Many graph interview problems (like LeetCode 684) use 1-indexed nodes. Allocating a DSU of size $N$ causes out-of-bounds errors on node $N$. Allocate $N + 1$.
- **Sorting Edges Wrongly in Kruskal's**: Sorting descending instead of ascending constructs a *Maximum* Spanning Tree rather than a *Minimum* Spanning Tree.
- **Missing Disconnection Check in MST**: If the graph has disconnected components, an MST cannot span all nodes. Always verify `mstEdges.length === n - 1`.

---

## 7. Tricky Points & Edge Cases
- **Multiple Valid MSTs**: If edges have identical weights, multiple different spanning trees can have the same minimum total weight.
- **Accounts with Identical Names**: Two distinct people can have the same name (e.g., John Smith). Grouping must be driven by email connectivity, not name strings.
- **Dense Graphs ($E \approx V^2$)**: On dense graphs, Kruskal's $O(E \log E)$ sorts $V^2$ edges. Prim's algorithm with an adjacency matrix ($O(V^2)$) can outperform Kruskal's on dense graphs.

---

## 8. Practical Engineering Exercises
1. Implement **Accounts Merge** (LeetCode 721) using DisjointSet with email strings mapped to integer IDs.
2. Implement **Min Cost to Connect All Points** (LeetCode 1584) by generating Manhattan distance edges and running Kruskal's algorithm.

---

## 9. Key Takeaways & Summary
- Redundant connection detection uses `dsu.union(u, v)`: the edge that fails union is the cycle-causing edge.
- Kruskal's Algorithm pairs Greedy edge sorting ($O(E \log E)$) with Union-Find cycle detection ($O(\alpha(V))$).
- An MST connects all $V$ nodes using exactly $V - 1$ edges with minimum total weight.
- Accounts Merge groups entities by transitively connected identifiers.

---

## 10. Quick Reference Cheat Sheet
| Application | Algorithm Core | Termination Condition | Complexity |
| :--- | :--- | :--- | :--- |
| **Redundant Connection** | Return edge where `union(u, v) === false` | First failure | $O(E \cdot \alpha(V))$ |
| **Kruskal's MST** | Sort edges $\rightarrow$ Greedy `union` | `mstEdges.length === V - 1` | $O(E \log E)$ |
| **Accounts Merge** | Union email IDs $\rightarrow$ Group by root | All accounts mapped | $O(N \log N)$ (sorting emails) |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: How does Kruskal's Algorithm prevent cycles while building a Minimum Spanning Tree?  
**Hint**: What does `find(u) === find(v)` indicate?  
**Expected Answer Shape**: Kruskal's maintains a Disjoint Set Union of connected vertices. Before adding any candidate edge $(u, v)$, it queries `find(u)` and `find(v)`. If both vertices share the same representative root, a path already connects them within the growing spanning forest. Adding $(u, v)$ would introduce an alternate path, creating a cycle. The algorithm simply discards that edge, ensuring the resulting structure remains strictly a tree.

### 2. Code-Writing
**Question**: Write `minCostConnectPoints(points)` that computes the minimum cost to connect all 2D points where cost is Manhattan distance $|x_1 - x_2| + |y_1 - y_2|$.  
**Hint**: Generate all $N(N-1)/2$ edges and run Kruskal's algorithm.  
**Expected Answer Shape**: Generate edge list of all pairs `[i, j, |xi - xj| + |yi - yj|]`. Sort edges ascending by distance. Use DSU on indices $0 \dots N-1$. Iterate through sorted edges, summing weight whenever `dsu.union(i, j)` succeeds. Stop when $N-1$ edges are added. Returns total cost in $O(N^2 \log N)$ time.

### 3. Debugging
**Question**: Identify why this Accounts Merge code groups unrelated users with the same name:  
```javascript
const nameToEmails = new Map();
for (const [name, ...emails] of accounts) {
  nameToEmails.set(name, [...(nameToEmails.get(name) || []), ...emails]);
}
```  
**Hint**: What if two different people share the name "John"?  
**Expected Answer Shape**: Keying by person name assumes names are unique identifiers. If two different customers named "John" have distinct emails (`john_smith@gmail.com` and `john_doe@gmail.com`), this code merges their accounts into a single person, leaking private email data. Accounts must only merge when they share an *email address*. Use DSU to union email nodes, and attach the name to the unified component root.

### 4. System Design / Tradeoff
**Question**: In designing a distributed mesh VPN in Node.js (e.g., WireGuard mesh topology), why would you use Kruskal's MST to select active network tunnels?  
**Hint**: Routing loops and tunnel latency costs.  
**Expected Answer Shape**: In a mesh network with $N$ nodes, establishing all $N(N-1)/2$ peer tunnels creates routing loops (broadcast storms) and high idle keep-alive overhead. Kruskal's MST calculates the minimum spanning tree of active tunnels weighted by ping latency. This guarantees every node can communicate with every other node with zero routing loops and minimum global network delay.

### 5. Tricky / Edge Case
**Question**: Can Kruskal's Algorithm handle graphs with negative edge weights?  
**Hint**: Does greedy choice by minimum weight depend on positive numbers?  
**Expected Answer Shape**: Yes. Unlike Dijkstra's shortest path algorithm (which assumes non-negative weights), Kruskal's Algorithm works correctly with negative edge weights. Sorting edges from most negative to positive simply ensures the algorithm greedily picks negative edges first, which further minimizes the total spanning tree weight while Union-Find prevents cycles.

### 6. Real-World Node.js Context
**Question**: How does a Node.js monorepo dependency analyzer use Redundant Connection to find unnecessary transitive package dependencies?  
**Hint**: Direct dependency already satisfied by a transitive path.  
**Expected Answer Shape**: In large monorepos, if Package A imports Package B, and Package B imports Package C, a direct import of Package C inside Package A is often redundant. DSU or transitive reduction identifies redundant edges that connect already-connected dependency components, allowing automated cleanup tools to prune bloated `package.json` dependency lists.
