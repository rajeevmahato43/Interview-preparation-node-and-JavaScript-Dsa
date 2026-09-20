# Day 54: Union-Find: Disjoint Set Union (DSU)

## 1. Learning Outcomes
- Master the **Disjoint Set Union (DSU)** data structure for tracking partitioned elements.
- Implement `find` with **Path Compression** to flatten tree depth during lookups.
- Implement `union` with **Union by Rank/Size** to prevent tree degradation.
- Understand the **Inverse Ackermann Function $\alpha(n)$** and near-$O(1)$ amortized time complexity.
- Count connected components dynamically and model network cluster partitioning in Node.js.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 36 (Graph Representations), Day 38 (Connected Components).
- **Navigation**:
  - [Previous: Day 53 - Trie Construction and Prefix Search](day-53-trie-construction-and-prefix-search.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 55 - Union-Find: Graph Applications and MST](day-55-union-find-graph-applications.md)

---

## 3. Core Concepts & Mental Models
Union-Find maintains a collection of disjoint (non-overlapping) sets. Each set is identified by a unique **representative root** element.

```text
Union-Find Operations:
Initial: 5 disjoint sets
  (0)   (1)   (2)   (3)   (4)   parent = [0, 1, 2, 3, 4]

union(0, 1), union(1, 2):
       (0)            (3)   (4)
      /   \
    (1)   (2)                   parent = [0, 0, 0, 3, 4]

Path Compression Optimization during find(2):
Before: (2) -> (1) -> (0)
After:  (2) points directly to root (0)! Tree height permanently collapses to 1!
```

---

## 4. Detailed Technical Explanations

### 4.1 Path Compression
In a naive tree, successive unions can create a degenerate stick of height $O(n)$, making `find` take $O(n)$ time.
**Path Compression** updates the parent of every visited node directly to the root during the recursive unwind:
```javascript
find(i) {
  if (this.parent[i] === i) return i;
  return this.parent[i] = this.find(this.parent[i]); // Path compression!
}
```

### 4.2 Union by Rank / Size
When uniting two roots `rootX` and `rootY`:
- Without rank: Arbitrary attachment can double tree height.
- **Union by Rank**: Attach the root of the shallower tree under the root of the deeper tree. Only when both ranks are equal does the resulting rank increase by 1.

### 4.3 Complexity: Inverse Ackermann Function $\alpha(n)$
Combining Path Compression with Union by Rank guarantees that any sequence of $M$ operations on $N$ elements takes $O(M \cdot \alpha(N))$ time.
The inverse Ackermann function $\alpha(N)$ grows so slowly that for any conceivable universe size ($N < 10^{80}$ atoms in the universe), $\alpha(N) \le 4$. In practice, Union-Find operations execute in **amortized $O(1)$ constant time**!

### 4.4 Node.js Relevance: Dynamic Cluster Membership & Network Split-Brain
In distributed Node.js clusters (e.g., Redis Sentinel, Raft/Paxos consensus implementations, or Socket.io cluster rooms), servers join and leave networks dynamically. DSU models server partition groups, detects network split-brain partitions, and merges clusters in constant time upon network partition healing.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 Production-Grade DisjointSet Class
```javascript
class DisjointSet {
  constructor(size) {
    this.parent = new Uint32Array(size);
    this.rank = new Uint8Array(size);
    this.numComponents = size;

    // Every node starts as its own parent (rank 0)
    for (let i = 0; i < size; i++) {
      this.parent[i] = i;
    }
  }

  /**
   * Finds the representative root of element i with Path Compression.
   * Amortized Time: O(alpha(n)) ≈ O(1)
   */
  find(i) {
    if (this.parent[i] === i) {
      return i;
    }
    // Path compression: flatten pointer directly to root
    return (this.parent[i] = this.find(this.parent[i]));
  }

  /**
   * Unites the sets containing i and j using Union by Rank.
   * Returns true if merged; false if they were already in the same set.
   * Amortized Time: O(alpha(n)) ≈ O(1)
   */
  union(i, j) {
    const rootI = this.find(i);
    const rootJ = this.find(j);

    // Already in the same set (cycle / redundant edge)
    if (rootI === rootJ) {
      return false;
    }

    // Attach smaller rank tree under larger rank tree
    if (this.rank[rootI] < this.rank[rootJ]) {
      this.parent[rootI] = rootJ;
    } else if (this.rank[rootI] > this.rank[rootJ]) {
      this.parent[rootJ] = rootI;
    } else {
      this.parent[rootJ] = rootI;
      this.rank[rootI]++;
    }

    this.numComponents--;
    return true;
  }

  isConnected(i, j) {
    return this.find(i) === this.find(j);
  }

  getComponentCount() {
    return this.numComponents;
  }
}
```

### 5.2 Number of Connected Components in an Undirected Graph (LeetCode 323)
```javascript
/**
 * Counts total connected components using DSU.
 * Time Complexity: O(V + E * alpha(V)) ≈ O(V + E)
 * Space Complexity: O(V)
 */
function countComponents(n, edges) {
  const dsu = new DisjointSet(n);

  for (const [u, v] of edges) {
    dsu.union(u, v);
  }

  return dsu.getComponentCount();
}
```

### 5.3 Execution Trace: `countComponents(5, [[0,1], [1,2], [3,4]])`
```text
Initial: 5 components: {0}, {1}, {2}, {3}, {4}
Edge [0, 1]: union(0, 1) -> Root 0 adopts 1. Components: 4. Sets: {0,1}, {2}, {3}, {4}
Edge [1, 2]: find(1)=0, find(2)=2. union(0, 2) -> Components: 3. Sets: {0,1,2}, {3}, {4}
Edge [3, 4]: union(3, 4) -> Root 3 adopts 4. Components: 2. Sets: {0,1,2}, {3,4}
Final result: dsu.getComponentCount() = 2!
```

---

## 6. Common Mistakes & Anti-Patterns
- **Omitting Path Compression**: Forgetting `this.parent[i] = this.find(...)` leaves trees tall, degrading operations to linear $O(n)$ time.
- **Uniting Non-Root Elements**: Setting `parent[i] = j` instead of `parent[rootI] = rootJ` corrupts set roots and creates invalid disjoint sets.
- **Using DSU for Directed Graphs**: Standard Union-Find cannot distinguish edge direction ($u \rightarrow v$ vs. $v \rightarrow u$). It only applies to undirected connectivity.

---

## 7. Tricky Points & Edge Cases
- **Dynamic Element Keys (Strings/Objects)**: If elements are strings (e.g., email accounts), map strings to integer IDs $0 \dots N-1$ using a `Map`, or use string keys directly in a Map-backed parent table.
- **Cycle Detection**: If `dsu.union(u, v)` returns `false` (meaning `find(u) === find(v)` before the union), adding edge `(u, v)` forms a cycle!
- **Disconnected Graphs**: Vertices that receive zero edges remain valid individual components with `parent[i] = i`.

---

## 8. Practical Engineering Exercises
1. Implement an iterative version of `find` using two passes to prevent call stack overhead during path compression.
2. Given dynamic queries of `connect(u, v)` and `isConnected(u, v)`, build a real-time connectivity service in Node.js.

---

## 9. Key Takeaways & Summary
- Union-Find manages dynamic set partitions with two operations: `find` and `union`.
- Path Compression flattens trees during `find` so all nodes point directly to the root.
- Union by Rank attaches shallower trees under deeper trees to minimize height growth.
- Combined, operations run in amortized $O(\alpha(n)) \approx O(1)$ near-constant time.

---

## 10. Quick Reference Cheat Sheet
| Operation | Method | Amortized Complexity |
| :--- | :--- | :--- |
| **Find** | Recursive with `parent[i] = find(parent[i])` | $O(\alpha(n)) \approx O(1)$ |
| **Union** | Find roots, attach smaller rank under larger | $O(\alpha(n)) \approx O(1)$ |
| **Is Connected** | `find(u) === find(v)` | $O(\alpha(n)) \approx O(1)$ |
| **Cycle Check** | If `find(u) === find(v)` on new edge, cycle exists! | $O(\alpha(n)) \approx O(1)$ |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: What is the purpose of Path Compression and Union by Rank, and why are both needed to achieve $O(\alpha(n))$ amortized time?  
**Hint**: Analyze what happens if you use only one without the other.  
**Expected Answer Shape**: Union by Rank alone guarantees tree height is bounded by $O(\log n)$, keeping operations $O(\log n)$. Path Compression alone flattens trees, but without rank a pathological sequence of unions can still create linear sticks before paths are compressed. When used together, Union by Rank keeps trees shallow, and Path Compression permanently compresses traversed paths down to height 1, driving amortized complexity down to $O(\alpha(n))$, the Inverse Ackermann function.

### 2. Code-Writing
**Question**: Write an iterative version of `find(i)` with Path Compression without using recursion.  
**Hint**: Find root first, then make a second pass redirecting pointers to root.  
**Expected Answer Shape**: First pass: `let root = i; while (root !== parent[root]) root = parent[root];`. Second pass: `let curr = i; while (curr !== root) { let next = parent[curr]; parent[curr] = root; curr = next; } return root;`. Achieves $O(1)$ space with zero call stack overhead.

### 3. Debugging
**Question**: Identify why this Union-Find implementation produces incorrect sets:  
```javascript
union(i, j) {
  this.parent[i] = this.find(j);
}
```  
**Hint**: What about the rest of `i`'s existing tree?  
**Expected Answer Shape**: This code directly repoints node `i` to `find(j)` instead of repointing `i`'s *root* (`find(i)`). If `i` is already part of an existing tree, only node `i` moves to the new set; all of `i`'s children and siblings remain anchored to `i`'s old root, severing the tree and corrupting set memberships. Must find both roots first: `this.parent[this.find(i)] = this.find(j)`.

### 4. System Design / Tradeoff
**Question**: When determining connected components in a static graph, compare DFS versus Union-Find in a Node.js backend.  
**Hint**: Dynamic streaming edge additions vs. one-time batch traversal.  
**Expected Answer Shape**: For a static graph known in advance, DFS takes $O(V + E)$ time and is simple to implement. However, if edges arrive dynamically over time (e.g., real-time WebSocket connection events), DFS requires re-traversing the entire graph ($O(V + E)$ per new edge). Union-Find processes each newly added edge incrementally in $O(1)$ time, making it vastly superior for real-time streaming topologies.

### 5. Tricky / Edge Case
**Question**: Can Union-Find be used to find the size of the connected component that a specific node belongs to in $O(1)$ time?  
**Hint**: Maintain a `size` array alongside `parent`.  
**Expected Answer Shape**: Yes. Instead of or in addition to `rank`, maintain a `size` array initialized to 1 for all nodes. In `union(i, j)`, when merging `rootJ` into `rootI`, increment `size[rootI] += size[rootJ]`. To find the component size of any node $x$, compute `root = find(x)` and return `size[root]` in $O(\alpha(n)) \approx O(1)$ time.

### 6. Real-World Node.js Context
**Question**: How does a Node.js identity resolution service (e.g., Customer Data Platform) use Union-Find to merge duplicate user profiles across multiple anonymous cookies and emails?  
**Hint**: Accounts Merge problem.  
**Expected Answer Shape**: As users browse with cookies, login with emails, or provide phone numbers, incoming events emit identity pairs `(cookieId, email)`. The Node.js service uses Union-Find where identifiers are graph vertices. Each identity pair triggers `union(id1, id2)`. Querying `find(identifier)` instantly resolves any identifier to a single unified Canonical Customer ID in $O(1)$ time, dynamically aggregating fragmented session histories.
