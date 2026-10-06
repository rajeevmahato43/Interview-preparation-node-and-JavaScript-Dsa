# Day 55: Union-Find: Graph Applications and Minimum Spanning Tree (MST)

<nav aria-label="Lecture navigation">
  <a href="day-54-union-find-disjoint-set-union.md">◀ Day 54: Union-Find: Disjoint Set Union (DSU)</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-56-mixed-pattern-strategy-and-constraints.md">Day 56: Mixed Pattern Strategy and Constraint Decoding ▶</a>
</nav>

---

## Learning Outcomes

- Apply Disjoint Set Union to solve the **Redundant Connection** problem by identifying cycle-creating edges in $O(E \cdot \alpha(V))$ time.
- Implement **Accounts Merge** by indexing arbitrary string emails into integer IDs and grouping equivalence components.
- Master **Kruskal's Algorithm** for constructing the **Minimum Spanning Tree (MST)** in weighted undirected graphs.
- Compare Kruskal's Algorithm against **Prim's Algorithm** to determine optimal usage for sparse versus dense topologies.
- Model multi-region cloud VPC peering topologies, fiber-optic cable routing costs, and profile deduplication in Node.js backend systems.
- Guard against multigraph parallel edge collisions and disconnected graph partition edge cases.

---

## Prerequisites

- [Day 36: Graph Representations and Modeling](day-36-graph-representations-and-modeling.md) — Vertices, edges, weighted graphs, and edge lists.
- [Day 51: Greedy: Interval Scheduling and Overlaps](day-51-greedy-interval-scheduling.md) — The Greedy Choice property and edge weight sorting.
- [Day 54: Union-Find: Disjoint Set Union (DSU)](day-54-union-find-disjoint-set-union.md) — DSU implementation with Path Compression and Union by Rank.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
| :--- | :--- | :--- |
| **Spanning Tree** | A connected subgraph of an undirected graph that includes all $V$ vertices and exactly $V - 1$ edges with no cycles. | The minimal edge backbone needed to keep an entire network connected. |
| **Minimum Spanning Tree (MST)** | A spanning tree whose sum of edge weights is strictly less than or equal to the sum of every other spanning tree. | Solves network cabling, circuit routing, and cloud VPC peering cost minimization. |
| **Kruskal's Algorithm** | A greedy algorithm that sorts edges ascending by weight and adds each edge to the MST using DSU if it does not form a cycle. | Runs in $O(E \log E)$ time; optimal for sparse graphs ($E \ll V^2$). |
| **Redundant Connection** | An edge whose removal restores an undirected connected graph back into a valid tree. | Discovered immediately when `dsu.union(u, v)` evaluates to false. |
| **Accounts Merge** | Grouping user accounts that share at least one common identifier (e.g., email address) into a single unified identity. | Standard identity resolution problem in distributed analytics and authentication backends. |

---

## Core Concepts & Mechanical Architecture

### 1. Redundant Connection (LeetCode 684)

In **Redundant Connection**, a graph of $N$ vertices started as a tree (with $N - 1$ edges), but one extra edge was added, forming an undirected cycle ($N$ edges total). We must find and return the edge that created the cycle.

```text
Redundant Connection Invariant:
Edges: [[1, 2], [1, 3], [2, 3]]
Graph:
    (1) -------- (2)
     |          /
     |         /
    (3) ------'

Step 1: Edge [1, 2] -> dsu.union(1, 2) === true. Sets: {1, 2}, {3}
Step 2: Edge [1, 3] -> dsu.union(1, 3) === true. Sets: {1, 2, 3}
Step 3: Edge [2, 3] -> find(2) === find(3) === 1!
        dsu.union(2, 3) === false! Edge [2, 3] creates the cycle!
        Return [2, 3].
```

```javascript
// Node.js code: Redundant Connection Implementation
/**
 * @param {number[][]} edges
 * @returns {number[]}
 */
function findRedundantConnection(edges) {
  const n = edges.length;
  // Vertices are 1-indexed, allocate n + 1
  const parent = new Int32Array(n + 1);
  for (let i = 1; i <= n; i++) parent[i] = i;

  function find(x) {
    if (parent[x] === x) return x;
    return (parent[x] = find(parent[x]));
  }

  function union(x, y) {
    const rootX = find(x);
    const rootY = find(y);
    if (rootX === rootY) return false; // Cycle!
    parent[rootX] = rootY;
    return true;
  }

  for (let i = 0; i < edges.length; i++) {
    const [u, v] = edges[i];
    if (!union(u, v)) {
      return [u, v]; // The redundant edge that creates the cycle
    }
  }

  return [];
}

console.log('Redundant edge:', findRedundantConnection([[1, 2], [1, 3], [2, 3]])); // [2, 3]
```

---

### 2. Accounts Merge (LeetCode 721)

Given a list of accounts where each entry is `[name, email1, email2, ...]`. Two accounts belong to the same person if they share at least one email. We must merge and return the accounts with sorted emails.

```text
Accounts Merge Workflow:
Input:
["John", "johnsmith@mail.com", "john_newyork@mail.com"],
["John", "johnsmith@mail.com", "john00@mail.com"],
["Mary", "mary@mail.com"],
["John", "johnnybravo@mail.com"]

Step 1: Map each unique email to an integer ID and to the person's name:
  "johnsmith@mail.com"   -> ID 0, Name: "John"
  "john_newyork@mail.com"-> ID 1, Name: "John"
  "john00@mail.com"      -> ID 2, Name: "John"
  "mary@mail.com"        -> ID 3, Name: "Mary"
  "johnnybravo@mail.com" -> ID 4, Name: "John"

Step 2: For each account, union the first email with all others:
  Account 1: union(0, 1) -> {0, 1}
  Account 2: union(0, 2) -> {0, 1, 2} merged into one set!
  Account 3: union(3, 3) -> {3}
  Account 4: union(4, 4) -> {4}

Step 3: Group emails by find(emailId):
  Root 0: ["johnsmith@mail.com", "john_newyork@mail.com", "john00@mail.com"]
  Root 3: ["mary@mail.com"]
  Root 4: ["johnnybravo@mail.com"]

Step 4: Format with sorted emails!
```

```javascript
// Node.js code: Accounts Merge Implementation
/**
 * @param {string[][]} accounts
 * @returns {string[][]}
 */
function accountsMerge(accounts) {
  const emailToId = new Map();
  const emailToName = new Map();
  let emailCount = 0;

  // 1. Assign unique integer ID to each unique email
  for (const account of accounts) {
    const name = account[0];
    for (let i = 1; i < account.length; i++) {
      const email = account[i];
      if (!emailToId.has(email)) {
        emailToId.set(email, emailCount++);
        emailToName.set(email, name);
      }
    }
  }

  // 2. Initialize DSU
  const parent = new Int32Array(emailCount);
  for (let i = 0; i < emailCount; i++) parent[i] = i;

  function find(x) {
    if (parent[x] === x) return x;
    return (parent[x] = find(parent[x]));
  }

  function union(x, y) {
    const rootX = find(x);
    const rootY = find(y);
    if (rootX !== rootY) parent[rootX] = rootY;
  }

  // 3. Union emails within each account
  for (const account of accounts) {
    const firstEmailId = emailToId.get(account[1]);
    for (let i = 2; i < account.length; i++) {
      union(firstEmailId, emailToId.get(account[i]));
    }
  }

  // 4. Group emails by representative root
  const groups = new Map();
  for (const [email, id] of emailToId.entries()) {
    const root = find(id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(email);
  }

  // 5. Sort emails and format output
  const mergedAccounts = [];
  for (const [, emails] of groups.entries()) {
    emails.sort();
    const name = emailToName.get(emails[0]);
    mergedAccounts.push([name, ...emails]);
  }

  return mergedAccounts;
}
```

---

### 3. Kruskal's Minimum Spanning Tree (MST)

Given a connected, undirected, weighted graph $G = (V, E)$, find a spanning tree connecting all $V$ vertices with the **minimum total edge weight**.

```text
Kruskal's Algorithm Mechanics:
1. Extract all edges: [[u, v, weight], ...]
2. Sort edges ascending by weight: O(E log E)
3. Iterate edges greedily:
   - If find(u) !== find(v): Include edge in MST, union(u, v)!
   - If find(u) === find(v): DISCARD (creates cycle!)
4. Stop when MST contains exactly V - 1 edges.
```

```javascript
// Node.js code: Kruskal's MST Implementation
/**
 * @param {number} numVertices
 * @param {Array<[number, number, number]>} edges [u, v, weight]
 * @returns {{ mstEdges: Array<[number, number, number]>, totalWeight: number }}
 */
function kruskalMST(numVertices, edges) {
  // 1. Sort edges ascending by weight: O(E log E)
  edges.sort((a, b) => a[2] - b[2]);

  const parent = new Int32Array(numVertices);
  for (let i = 0; i < numVertices; i++) parent[i] = i;

  function find(x) {
    if (parent[x] === x) return x;
    return (parent[x] = find(parent[x]));
  }

  const mstEdges = [];
  let totalWeight = 0;

  for (let i = 0; i < edges.length; i++) {
    const [u, v, weight] = edges[i];
    const rootU = find(u);
    const rootV = find(v);

    if (rootU !== rootV) {
      parent[rootU] = rootV;
      mstEdges.push([u, v, weight]);
      totalWeight += weight;

      // Spanning tree complete when V - 1 edges are selected
      if (mstEdges.length === numVertices - 1) {
        break;
      }
    }
  }

  return { mstEdges, totalWeight };
}

const weightedGraph = [
  [0, 1, 4],
  [0, 2, 8],
  [1, 2, 2],
  [1, 3, 6],
  [2, 3, 3]
];
const mstResult = kruskalMST(4, weightedGraph);
console.log('MST Weight:', mstResult.totalWeight); // 9 (edges: [1,2,2], [2,3,3], [0,1,4])
```

---

### 4. Kruskal's vs. Prim's Algorithm

| Feature | Kruskal's Algorithm | Prim's Algorithm |
| :--- | :--- | :--- |
| **Approach** | Edge-centric (Global greedy sort + DSU) | Vertex-centric (Local frontier growth + Min-Heap) |
| **Time Complexity** | $O(E \log E)$ | $O(E \log V)$ with binary heap |
| **Data Structure** | Disjoint Set Union (DSU) | Priority Queue (Min-Heap) |
| **Graph Density** | Optimal for **Sparse Graphs** ($E \ll V^2$) | Optimal for **Dense Graphs** ($E \approx V^2$) |
| **Cycle Prevention** | DSU `find(u) === find(v)` | `visited` boolean set |

---

## Detailed Node.js Relevance

### Cloud Multi-Region Peering & Fiber-Optic Topology Cost Optimization

In modern distributed cloud infrastructure managed by Node.js tooling:

```text
Cloud VPC Peering Topology:
[VPC-East (0)] ---- ($15/GB) ---- [VPC-West (1)]
      |                                 |
  ($8/GB)                           ($4/GB)
      |                                 |
[VPC-Central (2)] -- ($2/GB) ---- [VPC-South (3)]
```

1. **Peering Cost Minimization**: Connecting $N$ VPC networks directly with dedicated links requires $N(N-1)/2$ connections, leading to massive bandwidth egress fees. Running Kruskal's algorithm identifies the minimum set of $N - 1$ inter-region transit links that guarantees complete connectivity across all services while minimizing overall network egress costs.
2. **User Identity Resolution**: In analytics and authentication microservices (e.g., identity resolution in customer data platforms like Segment), users interact via disparate cookies, emails, and device IDs. Accounts Merge dynamically joins disconnected profiles into unified customer entities in real time.

---

## Tricky Points & Edge Cases

1. **Disconnected Graphs in MST**:
   If the original graph is disconnected (fewer than $V - 1$ edges can be selected), Kruskal's algorithm will terminate with `mstEdges.length < V - 1`. A production implementation must verify `mstEdges.length === V - 1` and return an error or indication that no single spanning tree exists.
2. **Same Name, Different People in Accounts Merge**:
   Two accounts with the name `"John"` that share zero emails are **different people**! A common interview mistake is unioning accounts that share the same name. Only common **emails** establish identity equivalence.
3. **Lexicographical Email Sorting**:
   LeetCode 721 requires emails in each merged account to be sorted alphabetically (`emails.sort()`). Failing to sort causes test rejections despite correct graph clustering.
4. **Multiple Redundant Connections**:
   In LeetCode 684, if multiple edges create cycles, the problem requires returning the **last** edge appearing in the input. Processing the edge list in original order and updating the candidate automatically satisfies this rule.

---

## Hands-On Exercise

### Scenario
You are building an infrastructure provisioning engine in Node.js for a cloud provider. You receive data center nodes numbered $0 \dots n - 1$ and a list of available inter-datacenter fiber links `[nodeA, nodeB, monthlyCost]`.
Implement `provisionInterconnectNetwork(n, links)`:
1. Returns `{ totalMonthlyCost: number, activeLinks: Array<[number, number, number]> }`.
2. Must guarantee that all $n$ data centers are connected with the minimum possible monthly expense using Kruskal's algorithm.
3. If it is impossible to connect all data centers (the graph is partitioned), throw an `Error('Cannot interconnect all data centers: network partitioned')`.

### Buggy Code
```javascript
function provisionInterconnectNetwork(n, links) {
  // BUG: Does not sort links by cost! Picks arbitrary edges
  const parent = Array.from({ length: n }, (_, i) => i);
  let total = 0;
  const active = [];

  for (let [u, v, cost] of links) {
    if (parent[u] !== parent[v]) {
      parent[u] = parent[v]; // BUG: Direct parent assignment without path compression
      active.push([u, v, cost]);
      total += cost;
    }
  }

  return { totalMonthlyCost: total, activeLinks: active }; // Fails to verify spanning connectivity!
}
```

### Acceptance Criteria
- Sort links ascending by cost to enforce Kruskal's greedy choice property.
- Use complete DSU with Path Compression.
- Verify that exactly $n - 1$ links are provisioned; throw an informative error if disconnected.
- Unit test assertions covering both connected and partitioned scenarios.

### Solution Code
```javascript
const assert = require('assert');

// Node.js code: Production Cloud Network Provisioning Engine
/**
 * @param {number} n
 * @param {Array<[number, number, number]>} links [nodeA, nodeB, monthlyCost]
 * @returns {{ totalMonthlyCost: number, activeLinks: Array<[number, number, number]> }}
 */
function provisionInterconnectNetwork(n, links) {
  if (n <= 1) {
    return { totalMonthlyCost: 0, activeLinks: [] };
  }

  // 1. Sort links ascending by cost: O(E log E)
  const sortedLinks = [...links].sort((a, b) => a[2] - b[2]);

  // 2. DSU with path compression
  const parent = new Int32Array(n);
  const rank = new Uint8Array(n);
  for (let i = 0; i < n; i++) parent[i] = i;

  function find(x) {
    if (parent[x] === x) return x;
    return (parent[x] = find(parent[x]));
  }

  function union(x, y) {
    const rootX = find(x);
    const rootY = find(y);
    if (rootX === rootY) return false;

    if (rank[rootX] < rank[rootY]) {
      parent[rootX] = rootY;
    } else if (rank[rootX] > rank[rootY]) {
      parent[rootY] = rootX;
    } else {
      parent[rootY] = rootX;
      rank[rootX]++;
    }
    return true;
  }

  const activeLinks = [];
  let totalMonthlyCost = 0;

  for (let i = 0; i < sortedLinks.length; i++) {
    const [u, v, cost] = sortedLinks[i];
    if (union(u, v)) {
      activeLinks.push([u, v, cost]);
      totalMonthlyCost += cost;

      if (activeLinks.length === n - 1) {
        break; // Spanning tree complete
      }
    }
  }

  // 3. Partitioned graph validation
  if (activeLinks.length !== n - 1) {
    throw new Error('Cannot interconnect all data centers: network partitioned');
  }

  return { totalMonthlyCost, activeLinks };
}

// Verification & Automated Unit Tests
// Test 1: Optimal MST with 4 nodes
const fiberLinks = [
  [0, 1, 10],
  [0, 2, 6],
  [0, 3, 5],
  [1, 3, 15],
  [2, 3, 4]
];

// Optimal MST: [2, 3, 4], [0, 3, 5], [0, 1, 10] -> Cost = 19
const res1 = provisionInterconnectNetwork(4, fiberLinks);
assert.strictEqual(res1.totalMonthlyCost, 19);
assert.strictEqual(res1.activeLinks.length, 3);

// Test 2: Partitioned network error throwing
const disconnectedLinks = [
  [0, 1, 5],
  [2, 3, 10]
];
assert.throws(() => {
  provisionInterconnectNetwork(4, disconnectedLinks);
}, /network partitioned/);

// Test 3: Trivial single node
const singleNodeRes = provisionInterconnectNetwork(1, []);
assert.strictEqual(singleNodeRes.totalMonthlyCost, 0);
assert.deepStrictEqual(singleNodeRes.activeLinks, []);

console.log('✅ All provisionInterconnectNetwork MST assertions passed successfully!');
```

### Solution Explanation
1. **Greedy Edge Sorting**: Sorting edges by cost guarantees that Kruskal's algorithm always inspects the cheapest links first.
2. **Cycle Rejection via DSU**: Calling `union(u, v)` rejects edges between nodes that are already connected, avoiding redundant loops.
3. **Partition Verification**: Checking `activeLinks.length === n - 1` prevents partial network deployments and throws descriptive errors on partitioned topologies.

---

## Summary

- **Redundant Connection** uses DSU to identify cycle-creating edges: the first edge where `union(u, v) === false` is the redundant link.
- **Accounts Merge** maps emails to unique integer IDs and groups them into equivalence sets via DSU.
- **Kruskal's Algorithm** finds the Minimum Spanning Tree (MST) in $O(E \log E)$ time by sorting edges and greedily uniting disjoint components.
- Kruskal's algorithm is optimal for sparse graphs ($E \ll V^2$), while Prim's algorithm is preferred for dense graphs ($E \approx V^2$).
- In Node.js backend systems, MST algorithms minimize inter-region cloud transit bandwidth fees and resolve distributed identity profiles.

---

## Cheat Sheet & Common Pitfalls

| Application | Core Technique | Termination Condition |
| :--- | :--- | :--- |
| **Redundant Connection** | DSU on edge list | Stop on first `union(u, v) === false` |
| **Accounts Merge** | Email $\to$ ID mapping + DSU | Group by `find(id)`, sort emails |
| **Kruskal's MST** | Sort edges by weight + DSU | Select exactly $V - 1$ edges |
| **Partitioned Graph** | MST verification | If selected edges $< V - 1 \implies$ Error |

---

## Interview Questions

### 1. Why does Kruskal's algorithm sort edges by weight while Prim's algorithm does not?
**Question:** Contrast the algorithmic mechanics of Kruskal's algorithm and Prim's algorithm, explaining why Kruskal's requires global edge sorting.

**Answer:**
- **Kruskal's Algorithm (Global Greedy)**:
  - Considers all edges globally across the entire graph.
  - It sorts all edges upfront in $O(E \log E)$ time and picks edges from smallest to largest, irrespective of where they are in the graph, using DSU to prevent cycles.
  - The tree grows as an arbitrary forest of independent subtrees that eventually merge into a single spanning tree.
- **Prim's Algorithm (Local Greedy / Frontier Growth)**:
  - Starts at a single arbitrary root vertex and grows a single contiguous tree outward.
  - It maintains a Min-Priority Queue of edges connecting the current visited tree to unvisited neighbor vertices.
  - At each step, it extracts the minimum edge from the active frontier in $O(\log V)$ time.
  - It does **not** need to sort all edges upfront; it only extracts the minimum from the local frontier queue.

---

### 2. Can Kruskal's algorithm produce different Minimum Spanning Trees on the same graph?
**Question:** Under what graph conditions is the Minimum Spanning Tree unique, and when can a graph have multiple valid MSTs?

**Answer:**
- **Unique MST**: If all edge weights in the graph are **strictly unique** (no two edges share the same numerical weight), the Minimum Spanning Tree is mathematically guaranteed to be **unique**.
- **Multiple Valid MSTs**: If two or more edges have identical weights, multiple different spanning trees can achieve the exact same minimum total weight. Kruskal's algorithm may select different edges depending on how tied weights are ordered during the sorting step, but all produced spanning trees will have the exact same total minimum weight.

---

### 3. In Accounts Merge, why can't we simply use the person's name as the set identifier in DSU?
**Question:** Why does using the account name as the cluster key in Accounts Merge produce incorrect results?

**Answer:**
1. Names are **not unique identifiers**. Multiple different individuals can share the same common name (e.g., two distinct users named `"John Smith"` with completely unrelated emails `john@work.com` and `john@gmail.com`).
2. If we used names as the set identifier, all users with the name `"John Smith"` would be merged into a single consolidated account, leaking private emails and creating false identity associations.
3. **Correct Protocol**: The email address is the unique primary key. We run DSU strictly on **email IDs**. The name is simply associated with the emails as display metadata.

---

### 4. What is the time complexity of Accounts Merge?
**Question:** Analyze the time complexity of the Accounts Merge algorithm in terms of total accounts $N$ and total emails $E$.

**Answer:**
Let $N$ be the number of accounts and $E$ be the total number of emails across all accounts. Let $L$ be the maximum length of an email string.
1. **ID Mapping & Graph Construction**: Hashing emails and building maps takes $O(E \cdot L)$ time.
2. **DSU Union Operations**: Uniting emails within accounts performs at most $E$ unions. With path compression and rank, this takes $O(E \cdot \alpha(E))$ time.
3. **Grouping**: Grouping emails by root takes $O(E \cdot \alpha(E))$ time.
4. **Sorting Emails**: Sorting the emails within each merged component takes $O(E \log E \cdot L)$ time in the worst case (when all emails belong to a single user).
5. **Total Time Complexity**: Dominated by email string sorting:
   $$O(E \log E \cdot L)$$
6. **Space Complexity**: $O(E \cdot L)$ to store email maps, DSU parent arrays, and output lists.

---

<nav aria-label="Lecture navigation">
  <a href="day-54-union-find-disjoint-set-union.md">◀ Day 54: Union-Find: Disjoint Set Union (DSU)</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-56-mixed-pattern-strategy-and-constraints.md">Day 56: Mixed Pattern Strategy and Constraint Decoding ▶</a>
</nav>
