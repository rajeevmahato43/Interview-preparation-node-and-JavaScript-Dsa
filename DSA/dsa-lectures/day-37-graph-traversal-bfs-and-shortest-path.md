# Day 37: Graph Traversal: BFS and Shortest Path

<nav aria-label="Lecture navigation">
  <a href="day-36-graph-representations-and-modeling.md">◀ Day 36: Graph Representations and Modeling</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-38-graph-traversal-dfs-and-components.md">Day 38: Graph Traversal: DFS and Connected Components ▶</a>
</nav>

---

## Learning Outcomes

- Master **Breadth-First Search (BFS)** traversal on arbitrary directed and undirected graphs using an explicit FIFO queue and `visited` tracking set.
- Mathematically prove why BFS guarantees finding the **Shortest Path** (minimum edge count) in unweighted graphs.
- Implement **Clone Graph** to deep-copy complex cyclic graphs without infinite recursion using object-to-clone hash maps.
- Solve multi-state transformation problems such as **Word Ladder** by modeling intermediate wildcard bucket transitions.
- Eliminate JavaScript queue performance bottlenecks by replacing $O(N)$ `Array.prototype.shift()` with pointer-based deques in high-throughput graph traversals.
- Apply BFS algorithms to real-world backend architectures: peer-to-peer (P2P) network discovery, crawl frontiers, and route-distance calculation in Node.js services.

---

## Prerequisites

- [Day 19: Queue and Deque Implementations](day-19-queue-and-deque-implementations.md) — FIFO queue invariants and amortized array vs. pointer performance.
- [Day 32: Level Order Traversal, BFS, and Tree Views](day-32-level-order-traversal-bfs-and-views.md) — Sized-batch queue processing and breadth exploration invariants.
- [Day 36: Graph Representations and Modeling](day-36-graph-representations-and-modeling.md) — Adjacency lists and vertex degree fundamentals.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
| :--- | :--- | :--- |
| **Breadth-First Search (BFS)** | A graph traversal algorithm that explores all neighbor nodes at current depth $d$ before proceeding to depth $d + 1$. | Fundamental algorithm for finding the shortest path in unweighted graphs in $O(V + E)$ time. |
| **Visited Timing Invariant** | Marking a node as visited immediately when it is **enqueued**, rather than when dequeued. | Crucial bug prevention; marking on dequeue causes duplicate queue insertions and exponential memory blowup. |
| **Shortest Path (Unweighted)** | The minimum number of edge transitions required to travel from source vertex $S$ to target vertex $T$. | Solved in $O(V + E)$ by BFS; Dijkstra's algorithm is only necessary when edges have variable non-negative weights. |
| **Clone Graph** | Constructing a deep copy of a graph with identical topology while ensuring no references point to original nodes. | Tests handling of cycles and back-edges using `Map<OriginalNode, ClonedNode>`. |
| **Intermediate State Bucketing** | Pre-computing wildcard transformation patterns (e.g., `*ot` for `hot`, `dot`, `lot`) to find neighbors in $O(L)$ instead of $O(N \cdot L)$. | Core optimization for Word Ladder; reduces neighbor discovery time from quadratic to linear. |
| **Queue Head Pointer** | Maintaining an integer index pointer to the current front of an array queue instead of invoking `shift()`. | Prevents $O(N^2)$ traversal degradation caused by V8 array memory re-indexing. |

---

## Core Concepts & Mechanical Architecture

### 1. BFS Mechanics and the Shortest Path Guarantee

**Breadth-First Search (BFS)** on a graph systematically expands outward in concentric rings or layers from an initial source vertex $S$. Because each step transitions across exactly one edge, all vertices at distance $k$ are explored before any vertex at distance $k + 1$.

```text
BFS Concentric Layers (Shortest Path Invariant):
Source: [0]
Distance 0 (Layer 0):             (0)
                                /     \
Distance 1 (Layer 1):         (1)     (2)
                             /   \       \
Distance 2 (Layer 2):      (3)   (4)     (5)
                                   \     /
Distance 3 (Layer 3):                (6)

Queue Evolution:
Initial:           [0]
Pop 0, Push 1, 2:  [1, 2]
Pop 1, Push 3, 4:  [2, 3, 4]
Pop 2, Push 5:     [3, 4, 5]
Pop 3 (no new):    [4, 5]
Pop 4, Push 6:     [5, 6]
Pop 5 (6 visited): [6]
Pop 6:             Target reached! Distance = 3 edges.
```

**Shortest Path Theorem**: Let $d(S, v)$ denote the shortest distance from source $S$ to vertex $v$. When BFS dequeues vertex $v$, the current layer counter equals $d(S, v)$. Because edges have uniform unit weight, no path explored later can reach $v$ with fewer edges.

---

### 2. The Visited Timing Invariant: Enqueue vs. Dequeue

The most dangerous pitfall in graph BFS is marking nodes as visited upon dequeue instead of enqueue.

```text
Graph with diamond topology:
      (A)
     /   \
   (B)   (C)
     \   /
      (D)

❌ MARK ON DEQUEUE (Incorrect):
1. Pop A -> Enqueue B, Enqueue C.
2. Pop B -> D is not marked yet! Enqueue D.
3. Pop C -> D is STILL not marked! Enqueue D a SECOND time!
Result: Duplicate processing, queue explodes exponentially on dense graphs.

✅ MARK ON ENQUEUE (Correct):
1. Enqueue A, mark A.
2. Pop A -> Check B (unvisited -> mark B, enqueue B).
           -> Check C (unvisited -> mark C, enqueue C).
3. Pop B -> Check D (unvisited -> mark D, enqueue D).
4. Pop C -> Check D (ALREADY VISITED! Skip).
Result: Every node is pushed to queue at most once. Exactly O(V) space.
```

```javascript
// Node.js code: Standard BFS Shortest Path Implementation
/**
 * Computes shortest path distance between source and target in unweighted graph.
 * Time Complexity: O(V + E)
 * Space Complexity: O(V)
 * @param {number[][]} adjList
 * @param {number} startNode
 * @param {number} targetNode
 * @returns {number} Minimum edge count, or -1 if unreachable
 */
function bfsShortestPath(adjList, startNode, targetNode) {
  if (startNode === targetNode) return 0;

  const visited = new Set();
  const queue = [startNode];
  let head = 0; // Pointer-based queue: O(1) dequeue without shift()

  visited.add(startNode);
  let distance = 0;

  while (head < queue.length) {
    const levelSize = queue.length - head;

    for (let i = 0; i < levelSize; i++) {
      const current = queue[head++];

      if (current === targetNode) {
        return distance;
      }

      for (const neighbor of adjList[current]) {
        if (!visited.has(neighbor)) {
          // ✅ INVARIANT: Mark visited immediately upon ENQUEUE
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    distance++;
  }

  return -1; // Unreachable
}

const graph = [
  [1, 2],    // 0 -> 1, 2
  [0, 3, 4], // 1 -> 0, 3, 4
  [0, 5],    // 2 -> 0, 5
  [1],       // 3 -> 1
  [1, 6],    // 4 -> 1, 6
  [2, 6],    // 5 -> 2, 6
  [4, 5]     // 6 -> 4, 5
];
console.log('Shortest path 0 to 6:', bfsShortestPath(graph, 0, 6)); // 3
```

---

### 3. Deep Copying Cyclic Graphs: Clone Graph

In **Clone Graph** (LeetCode 133), we must construct an exact duplicate of an undirected, connected graph where vertices contain cyclic references.

```text
Original Graph:           Cloned Graph:
 (1) -------- (2)          (1') ------- (2')
  |            |             |            |
  |            |    ===>     |            |
 (4) -------- (3)          (4') ------- (3')

Problem: A naive recursion will loop infinitely on 1 -> 2 -> 3 -> 4 -> 1.
Solution: Maintain a Map<OriginalNode, ClonedNode>.
When inspecting neighbor V:
- If V is in map: attach existing cloned node map.get(V).
- If V is NOT in map: instantiate new clone V', record in map, enqueue original V.
```

```javascript
// Node.js code: Clone Graph via BFS
class Node {
  constructor(val = 0, neighbors = []) {
    this.val = val;
    this.neighbors = neighbors;
  }
}

/**
 * Deep clones an undirected graph with potential cycles.
 * Time Complexity: O(V + E)
 * Space Complexity: O(V)
 * @param {Node} rootNode
 * @returns {Node|null}
 */
function cloneGraph(rootNode) {
  if (!rootNode) return null;

  // Map stores: Original Node Instance -> Cloned Node Instance
  const clonedMap = new Map();
  const queue = [rootNode];
  let head = 0;

  // Clone root and record
  clonedMap.set(rootNode, new Node(rootNode.val));

  while (head < queue.length) {
    const current = queue[head++];
    const currentClone = clonedMap.get(current);

    for (const neighbor of current.neighbors) {
      if (!clonedMap.has(neighbor)) {
        // Clone neighbor on discovery and enqueue for exploration
        clonedMap.set(neighbor, new Node(neighbor.val));
        queue.push(neighbor);
      }

      // Link cloned neighbor to cloned current node
      currentClone.neighbors.push(clonedMap.get(neighbor));
    }
  }

  return clonedMap.get(rootNode);
}
```

---

### 4. Multi-State Transition Search: Word Ladder

In **Word Ladder** (LeetCode 127), we are given `beginWord`, `endWord`, and a `wordList`. A transition between two words is valid if and only if they differ by exactly one character. We must find the minimum number of words in the transformation sequence.

```text
Word Ladder Graph State Exploration:
beginWord: "hit", endWord: "cog", wordList: ["hot","dot","dog","lot","log","cog"]

Transformation Tree:
                  "hit" (Length 1)
                    |
                  "hot" (Length 2)
                 /     \
           "dot"         "lot" (Length 3)
             |             |
           "dog"         "log" (Length 4)
             \             /
              "cog" (Length 5) -> Terminate! Minimum sequence = 5 words.
```

**Optimization via Wildcard Buckets**: Comparing all pairs of words takes $O(N^2 \cdot L)$ time. By pre-grouping words into intermediate wildcard patterns (e.g., `*ot` -> `[hot, dot, lot]`), each word has $L$ patterns, reducing neighbor lookup time to $O(N \cdot L^2)$.

```javascript
// Node.js code: Word Ladder Shortest Transformation Sequence
/**
 * @param {string} beginWord
 * @param {string} endWord
 * @param {string[]} wordList
 * @returns {number} Sequence length or 0 if unreachable
 */
function ladderLength(beginWord, endWord, wordList) {
  const wordSet = new Set(wordList);
  if (!wordSet.has(endWord)) return 0;

  const L = beginWord.length;
  // Wildcard map: pattern -> list of matching words
  const comboDict = new Map();

  for (const word of wordList) {
    for (let i = 0; i < L; i++) {
      const pattern = word.slice(0, i) + '*' + word.slice(i + 1);
      if (!comboDict.has(pattern)) {
        comboDict.set(pattern, []);
      }
      comboDict.get(pattern).push(word);
    }
  }

  const queue = [beginWord];
  let head = 0;
  const visited = new Set([beginWord]);
  let steps = 1;

  while (head < queue.length) {
    const levelSize = queue.length - head;

    for (let i = 0; i < levelSize; i++) {
      const word = queue[head++];

      if (word === endWord) {
        return steps;
      }

      for (let j = 0; j < L; j++) {
        const pattern = word.slice(0, j) + '*' + word.slice(j + 1);
        const candidates = comboDict.get(pattern) || [];

        for (const candidate of candidates) {
          if (!visited.has(candidate)) {
            visited.add(candidate);
            queue.push(candidate);
          }
        }
      }
    }

    steps++;
  }

  return 0;
}

console.log(
  'Word ladder steps:',
  ladderLength('hit', 'cog', ['hot', 'dot', 'dog', 'lot', 'log', 'cog'])
); // 5
```

---

## Detailed Node.js Relevance

### Distributed Node Discovery & P2P Gossip Protocols

In distributed Node.js clusters (e.g., decentralized discovery in Libp2p, Cassandra cluster nodes, or microservice service discovery):

```text
Node.js P2P Gossip Broadcast:
[Seed Node] (hop 0)
    |--- ping ---> [Peer 1] (hop 1)
    |--- ping ---> [Peer 2] (hop 1)
                      |--- ping ---> [Peer 3] (hop 2)
```

1. **Hop Count TTL (Time-To-Live)**: When broadcasting peer discovery heartbeat messages, BFS hop limits prevent network flood storms. A message with `TTL = 3` is forwarded using BFS level order until the counter reaches zero.
2. **Crawl Frontier Queue Design**: Web crawlers or indexers built in Node.js store URLs in a queue. If implemented using JavaScript's native `Array.shift()`, popping 100,000 URLs degrades to $O(N^2)$ quadratic latency due to V8 array element re-indexing. Using a ring buffer or two-pointer deque keeps crawl scheduling strictly $O(1)$ per request.

---

## Tricky Points & Edge Cases

1. **`Array.prototype.shift()` Quadratic Trap**:
   In V8, `array.shift()` shifts all remaining elements left by 1 in memory. For a graph with $100,000$ vertices, $100,000$ shifts will trigger $10^{10}$ memory operations, causing seconds of event loop freeze. Always use an index pointer (`let head = 0`) or an explicit circular buffer.
2. **Disconnected Graphs**:
   If the target vertex belongs to a separate connected component, the queue will deplete without reaching the target. Always ensure your BFS handles the loop termination condition and returns a sentinel value (such as `-1` or `0`).
3. **Weights on Edges**:
   BFS **only** computes shortest paths when all edges have uniform weight. If edges have variable weights (e.g., network latency values), BFS may discover a sub-optimal path earlier in terms of hop count, whereas a higher-hop path could have a smaller cumulative weight. Use Dijkstra's algorithm for weighted graphs.
4. **Bidirectional BFS for State Space Explosion**:
   In problems like Word Ladder with large branching factors $B$ and depth $D$, standard BFS explores $O(B^D)$ states. Running **Bidirectional BFS** simultaneously from `beginWord` and `endWord` meets in the middle at $D/2$, reducing states to $O(2 \cdot B^{D/2})$.

---

## Hands-On Exercise

### Scenario
You are building an API route in Node.js for an access control system. Given a user role hierarchy represented as an adjacency list of allowed privilege transfers, write `findShortestAuditChain(rolesGraph, initialRole, targetRole)` to return the **exact path** of role names (not just the count) from `initialRole` to `targetRole`. If no path exists, return `null`.

### Buggy Code
```javascript
function findShortestAuditChain(rolesGraph, initialRole, targetRole) {
  const queue = [[initialRole]];
  const visited = new Set(); // BUG: Visited only checked on dequeue

  while (queue.length > 0) {
    const path = queue.shift(); // BUG: shift() is O(N)
    const current = path[path.length - 1];

    if (current === targetRole) return path;

    visited.add(current); // BUG: Multiple parallel branches enqueue current before it is marked

    for (const neighbor of rolesGraph[current] || []) {
      if (!visited.has(neighbor)) {
        queue.push([...path, neighbor]); // BUG: Cloning path on every edge is O(V^2) memory
      }
    }
  }

  return null;
}
```

### Acceptance Criteria
- Return the full array of role names from start to end (e.g., `['guest', 'user', 'moderator', 'admin']`).
- Use parent tracking (`Map<child, parent>`) to reconstruct the path in $O(V)$ time instead of copying path arrays at every queue step.
- Must use pointer-based queue dequeuing ($O(1)$) to avoid `shift()` performance degradation.
- Mark nodes visited immediately on enqueue.

### Solution Code
```javascript
const assert = require('assert');

// Node.js code: Optimized BFS Path Reconstruction
/**
 * Finds shortest sequence of roles from initialRole to targetRole.
 * Time Complexity: O(V + E)
 * Space Complexity: O(V)
 * @param {Record<string, string[]>} rolesGraph
 * @param {string} initialRole
 * @param {string} targetRole
 * @returns {string[] | null}
 */
function findShortestAuditChain(rolesGraph, initialRole, targetRole) {
  if (initialRole === targetRole) {
    return [initialRole];
  }

  const queue = [initialRole];
  let head = 0;

  // Parent map stores: node -> predecessor node that discovered it
  // Acts simultaneously as visited tracking!
  const parentMap = new Map();
  parentMap.set(initialRole, null);

  let targetFound = false;

  while (head < queue.length) {
    const current = queue[head++];

    if (current === targetRole) {
      targetFound = true;
      break;
    }

    const neighbors = rolesGraph[current] || [];
    for (let i = 0; i < neighbors.length; i++) {
      const neighbor = neighbors[i];
      if (!parentMap.has(neighbor)) {
        // Enqueue and record parent immediately
        parentMap.set(neighbor, current);
        queue.push(neighbor);

        if (neighbor === targetRole) {
          targetFound = true;
          head = queue.length; // Break outer loop
          break;
        }
      }
    }
  }

  if (!targetFound) return null;

  // Reconstruct path backward from targetRole to initialRole
  const path = [];
  let curr = targetRole;
  while (curr !== null) {
    path.push(curr);
    curr = parentMap.get(curr);
  }

  path.reverse();
  return path;
}

// Verification & Automated Unit Tests
const rolesGraph = {
  guest: ['user'],
  user: ['guest', 'contributor', 'billing_viewer'],
  contributor: ['user', 'moderator'],
  billing_viewer: ['billing_admin'],
  billing_admin: ['superadmin'],
  moderator: ['admin'],
  admin: ['superadmin'],
  superadmin: []
};

// Test 1: Shortest path to moderator
const path1 = findShortestAuditChain(rolesGraph, 'guest', 'moderator');
assert.deepStrictEqual(path1, ['guest', 'user', 'contributor', 'moderator']);

// Test 2: Shortest path to superadmin (guest -> user -> billing_viewer -> billing_admin -> superadmin: 4 hops vs admin: 4 hops)
const path2 = findShortestAuditChain(rolesGraph, 'guest', 'superadmin');
assert.strictEqual(path2[0], 'guest');
assert.strictEqual(path2[path2.length - 1], 'superadmin');
assert.strictEqual(path2.length, 5); // 4 hops = 5 nodes

// Test 3: Unreachable target
const path3 = findShortestAuditChain(rolesGraph, 'superadmin', 'guest');
assert.strictEqual(path3, null);

// Test 4: Same initial and target
const path4 = findShortestAuditChain(rolesGraph, 'user', 'user');
assert.deepStrictEqual(path4, ['user']);

console.log('✅ All BFS Path Reconstruction assertions passed successfully!');
```

### Solution Explanation
1. **Parent Tracking Pattern**: Instead of allocating and copying an array of path vertices for every queue item (which consumes $O(V \cdot E)$ memory), we maintain a single `parentMap`. The map serves dual duty: it acts as the `visited` set and records the predecessor of each discovered vertex.
2. **Constant Time Dequeue**: Using `head` pointer avoids $O(N)$ element copying in JavaScript's internal array buffer.
3. **Backtracking Reconstruction**: Once `targetRole` is hit, walking up `parentMap` reconstructs the shortest path in $O(\text{path length}) \le O(V)$ time.

---

## Summary

- **BFS** explores a graph level by level, providing an $O(V + E)$ guarantee for finding the shortest path in unweighted graphs.
- **Enqueue Timing**: Marking vertices as visited at the time of insertion into the queue is mathematically required to prevent duplicate exploration and exponential memory blowup.
- **Clone Graph**: Employs a hash map mapping original references to cloned instances to navigate cycles without infinite recursion.
- **Word Ladder Optimization**: Pre-computes wildcard patterns to discover string transitions in $O(N \cdot L^2)$ instead of quadratic $O(N^2 \cdot L)$ pairwise comparisons.
- **Queue Implementation**: High-performance Node.js BFS must avoid `Array.prototype.shift()`, favoring pointer indices or circular deques to eliminate event loop blocking.

---

## Cheat Sheet & Common Pitfalls

| Scenario / Pattern | Anti-Pattern | Recommended Solution |
| :--- | :--- | :--- |
| **Visited Timing** | `visited.add(node)` on dequeue | `visited.add(neighbor)` immediately on enqueue |
| **Path Recording** | Storing `[...path, neighbor]` in queue | Maintain `parentMap` and backtrack from target |
| **Queue Dequeue** | `queue.shift()` inside $O(V)$ loop | Pointer index `queue[head++]` |
| **Weighted Edges** | Using BFS for minimum latency | Use Dijkstra's algorithm with a Min-Priority Queue |
| **State Explosion** | Unidirectional BFS with high branch factor | Bidirectional BFS starting simultaneously from both ends |

---

## Interview Questions

### 1. Why does BFS fail to find the shortest path in weighted graphs?
**Question:** Explain mathematically why BFS guarantees the shortest path in unweighted graphs, and provide a counter-example showing why it fails when edges have arbitrary positive weights.

**Answer:** BFS guarantees the shortest path in unweighted graphs because it explores vertices in strictly non-decreasing order of **edge count**. Because every edge has equal weight (cost = 1), the first time vertex $T$ is dequeued, no unvisited path with fewer edges can exist, and thus no path with a smaller cumulative cost exists.

When edges have variable weights, a path with **fewer edges** may have a **higher cumulative cost** than an alternative path with more edges.
**Counter-example**:
Consider vertices $A, B, C$:
- Edge $(A, C)$ has weight $10$.
- Edge $(A, B)$ has weight $2$.
- Edge $(B, C)$ has weight $3$.

BFS starting at $A$ visits $C$ in step 1 directly via $(A, C)$ with distance $10$ (1 hop). The two-hop path $A \to B \to C$ has total weight $2 + 3 = 5$. BFS would incorrectly declare $10$ as the shortest path because it prioritizes hop count over cumulative weight. For weighted graphs, **Dijkstra's Algorithm** is required.

---

### 2. How does Bidirectional BFS optimize search time complexity?
**Question:** Analyze the time and space complexity advantages of Bidirectional BFS compared to standard BFS in large state space search problems.

**Answer:**
Let $b$ be the branching factor (average neighbors per vertex) and $d$ be the shortest path distance between source $S$ and target $T$.
- **Standard BFS**: Explores states outward from $S$ up to depth $d$. Total vertices expanded is $O(b^d)$.
- **Bidirectional BFS**: Simultaneously runs two BFS searches—one forward from $S$ and one backward from $T$. The search terminates when the frontiers intersect at depth $d / 2$.
Total vertices expanded is:
$$O(b^{d/2} + b^{d/2}) = O(2 \cdot b^{d/2})$$

**Concrete Impact**:
If $b = 10$ and $d = 8$:
- Standard BFS expands $10^8 = 100,000,000$ states.
- Bidirectional BFS expands $2 \times 10^4 = 20,000$ states.
This represents a $5,000\times$ reduction in CPU and memory consumption.

---

### 3. What is the memory leak risk of storing graph nodes in a standard `Set` during BFS?
**Question:** In a continuous Node.js service running periodic graph traversals on dynamic object nodes, what memory issue arises from using `Set` for visited tracking, and how is it mitigated?

**Answer:**
If graph vertices are represented as persistent JavaScript objects (e.g., active user connection sessions or DOM nodes) and stored in a standard `Set(visited)`:
1. **Strong Reference Retainment**: A standard `Set` holds strong references to all inserted vertex objects. If the `Set` remains in scope (e.g., cached or attached to an outer context), the V8 garbage collector cannot reclaim those objects even if they are disconnected from the rest of the application, causing a gradual memory leak.
2. **Mitigation**:
   - For scoped traversals, ensure local structures are garbage collected immediately upon function completion.
   - For persistent object tracking where you must not prevent GC, use a `WeakSet` or attach an integer epoch marker directly onto vertex objects (`vertex.visitedEpoch = currentRunId`) to track visitation in $O(1)$ space without holding collection references.
   - For numeric vertex IDs, use a pre-allocated flat `Uint8Array` as a bitmask or byte array.

---

### 4. How do you implement Clone Graph iteratively to avoid call stack limits?
**Question:** Write an iterative BFS implementation of Clone Graph and explain why it is superior to recursive DFS in production Node.js systems.

**Answer:**
Recursive DFS stores activation frames on the V8 call stack. In Node.js, the call stack limit is approximately 10,000 frames. A long, linear graph of $50,000$ nodes will trigger a fatal `RangeError: Maximum call stack size exceeded`. An iterative BFS stores pending vertices in an array on the V8 heap, which is bounded only by the available process memory (hundreds of megabytes to gigabytes).

```javascript
function cloneGraphIterative(root) {
  if (!root) return null;

  const clones = new Map();
  clones.set(root, new Node(root.val));

  const queue = [root];
  let head = 0;

  while (head < queue.length) {
    const original = queue[head++];
    const clone = clones.get(original);

    for (const neighbor of original.neighbors) {
      if (!clones.has(neighbor)) {
        clones.set(neighbor, new Node(neighbor.val));
        queue.push(neighbor);
      }
      clone.neighbors.push(clones.get(neighbor));
    }
  }

  return clones.get(root);
}
```
This guarantees stack safety regardless of graph depth.

---

<nav aria-label="Lecture navigation">
  <a href="day-36-graph-representations-and-modeling.md">◀ Day 36: Graph Representations and Modeling</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-38-graph-traversal-dfs-and-components.md">Day 38: Graph Traversal: DFS and Connected Components ▶</a>
</nav>
