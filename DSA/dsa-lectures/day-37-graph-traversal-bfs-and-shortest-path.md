# Day 37: Graph Traversal: BFS and Shortest Path

## 1. Learning Outcomes
- Master **Breadth-First Search (BFS)** on unweighted graphs using a FIFO queue and a `visited` set.
- Prove why BFS guarantees the **Shortest Path** (minimum number of edges) in unweighted graphs.
- Implement **Clone Graph** (deep copying a graph with cycles using a pointer map).
- Master word transformation state transitions in **Word Ladder** using BFS.
- Understand how BFS powers peer-to-peer (P2P) discovery and network hop discovery in Node.js backends.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 19 (Queue & Deque), Day 32 (Tree BFS), Day 36 (Graph Representations).
- **Navigation**:
  - [Previous: Day 36 - Graph Representations and Modeling](day-36-graph-representations-and-modeling.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 38 - Graph Traversal: DFS and Connected Components](day-38-graph-traversal-dfs-and-components.md)

---

## 3. Core Concepts & Mental Models
In a tree, each node has a unique parent, making cycle prevention automatic. In a graph, edges can point backwards or circularly; a **`visited` tracking structure** is mandatory to prevent infinite loops.

```text
BFS Shortest Path (Level by Level):
Source: [0]
Level 0:          (0)               Distance = 0
                /     \
Level 1:      (1)     (2)           Distance = 1
             /   \       \
Level 2:   (3)   (4)     (5)        Distance = 2
                   \     /
Level 3:             (6)            Distance = 3 (Shortest path to 6 is 3 hops)

Invariant:
Every vertex is visited at the earliest possible step count from the source.
Therefore, the first time BFS reaches target vertex T, it is guaranteed to be
the shortest path in an unweighted graph!
```

---

## 4. Detailed Technical Explanations

### 4.1 Visited Set Timing Invariant
A critical BFS bug is marking a node as visited *after* dequeuing it (`visited.add(node)` inside the loop body). In graphs with shared neighbors, multiple nodes can enqueue the same unvisited neighbor before it is popped, causing exponential duplicate queue entries.
**Golden Rule**: Always mark a neighbor as visited **immediately upon enqueuing it**:
```javascript
if (!visited.has(neighbor)) {
  visited.add(neighbor); // MARK HERE!
  queue.push(neighbor);
}
```

### 4.2 Clone Graph Deep-Copy Pattern
When cloning a cyclic graph, recursive copying can cause infinite loops. Use a `Map<originalNode, cloneNode>`:
- If a neighbor already exists in the map, attach the existing clone.
- If it does not exist, create the clone, store in map, and enqueue for processing.

### 4.3 Node.js Relevance: Network Hop Analysis & P2P Discovery
In distributed Node.js networks (e.g., BitTorrent clients, WebRTC mesh topologies, Redis Cluster gossip protocols), nodes communicate with immediate peers. BFS determines the minimum network latency hops between nodes and limits broadcast message flooding using Time-To-Live (TTL) hop limits.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 Shortest Path in Unweighted Graph
```javascript
/**
 * Finds shortest distance and path from start to target.
 * Time Complexity: O(V + E)
 * Space Complexity: O(V)
 */
function shortestPathBFS(adjList, start, target) {
  if (start === target) return { distance: 0, path: [start] };

  const visited = new Set([start]);
  const queue = [start];
  const parent = new Map(); // Tracks predecessors to reconstruct path
  let distance = 0;

  while (queue.length > 0) {
    const levelSize = queue.length;
    distance++;

    for (let i = 0; i < levelSize; i++) {
      const curr = queue.shift();

      for (const neighbor of (adjList[curr] || [])) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parent.set(neighbor, curr);

          if (neighbor === target) {
            // Reconstruct path backwards
            const path = [target];
            let step = target;
            while (step !== start) {
              step = parent.get(step);
              path.push(step);
            }
            return { distance, path: path.reverse() };
          }

          queue.push(neighbor);
        }
      }
    }
  }

  return { distance: -1, path: [] }; // Target unreachable
}
```

### 5.2 Clone Graph (LeetCode 133)
```javascript
class Node {
  constructor(val = 0, neighbors = []) {
    this.val = val;
    this.neighbors = neighbors;
  }
}

/**
 * Deep copies an undirected connected graph.
 * Time Complexity: O(V + E)
 * Space Complexity: O(V)
 */
function cloneGraph(startNode) {
  if (!startNode) return null;

  const clones = new Map(); // original -> clone
  clones.set(startNode, new Node(startNode.val));

  const queue = [startNode];

  while (queue.length > 0) {
    const curr = queue.shift();

    for (const neighbor of curr.neighbors) {
      if (!clones.has(neighbor)) {
        clones.set(neighbor, new Node(neighbor.val));
        queue.push(neighbor);
      }
      // Attach cloned neighbor to current cloned node
      clones.get(curr).neighbors.push(clones.get(neighbor));
    }
  }

  return clones.get(startNode);
}
```

### 5.3 Execution Trace: `cloneGraph` on 3-Node Triangle `(1-2, 2-3, 3-1)`
```text
1. clones: { 1: 1' }. queue: [1].
2. Dequeue 1:
   - neighbor 2 not in clones: create 2', clones: { 1: 1', 2: 2' }, enqueue 2.
     1'.neighbors.push(2')
   - neighbor 3 not in clones: create 3', clones: { 1: 1', 2: 2', 3: 3' }, enqueue 3.
     1'.neighbors.push(3')
3. Dequeue 2:
   - neighbor 1 in clones: 2'.neighbors.push(1')
   - neighbor 3 in clones: 2'.neighbors.push(3')
4. Dequeue 3:
   - neighbor 1 in clones: 3'.neighbors.push(1')
   - neighbor 2 in clones: 3'.neighbors.push(2')
Result: Exact deep clone created with full cyclic pointers preserved!
```

---

## 6. Common Mistakes & Anti-Patterns
- **Marking Visited on Dequeue**: Forgetting to mark visited at enqueue time causes the queue to explode with duplicate nodes when multiple neighbors connect to the same vertex.
- **Using BFS for Weighted Graphs**: BFS only guarantees shortest path if all edge weights are uniform ($1$). If edges have variable positive weights, use **Dijkstra's Algorithm**.
- **Infinite Loops from Cycles**: Omitting the `visited` set immediately turns any cyclic graph traversal into an infinite loop and crash.

---

## 7. Tricky Points & Edge Cases
- **Start Node Equals Target Node**: Handled explicitly at top of function (`return { distance: 0, path: [start] }`).
- **Disconnected Graphs / Target Unreachable**: Queue empties without finding target; return `-1` or empty path.
- **Word Ladder Optimization**: In Word Ladder, iterating through word list takes $O(N \cdot L)$ per word ($L$ = word length). Generating 26 single-letter variations of the current word and checking against a hash set is dramatically faster when the word dictionary is large.

---

## 8. Practical Engineering Exercises
1. Implement **Word Ladder** (LeetCode 127) returning the minimum number of transformation steps from `beginWord` to `endWord`.
2. Implement **01 Matrix** (LeetCode 542) using Multi-Source BFS starting simultaneously from all zero cells.

---

## 9. Key Takeaways & Summary
- BFS on unweighted graphs computes the shortest path in $O(V + E)$ time.
- Nodes must be marked as `visited` at the exact moment they are pushed to the queue.
- Reconstructing paths requires storing parent/predecessor pointers in a map during traversal.
- Graph cloning requires a map from original nodes to cloned nodes to resolve cycles and shared references.

---

## 10. Quick Reference Cheat Sheet
| BFS Variant | Queue Initialization | Visited Timing | Invariant |
| :--- | :--- | :--- | :--- |
| **Single-Source** | `[startNode]` | At `push()` time | Level $k$ = distance $k$ |
| **Multi-Source** | All sources `[s1, s2, ..]` | At `push()` time | Simultaneous expansion |
| **Path Tracking** | `parent.set(v, u)` | At `push()` time | Backtrack target $\rightarrow$ start |
| **Graph Cloning** | `clones.set(u, new Node(u))` | Map lookup | Prevents cyclic duplicates |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: Why does BFS guarantee the shortest path in an unweighted graph, but DFS does not?  
**Hint**: Compare how the search frontier expands.  
**Expected Answer Shape**: BFS expands outward uniformly like a ripple in water, visiting all vertices at distance 1 before any at distance 2, and all at distance $k$ before distance $k+1$. The first time a target vertex is reached, the path length is guaranteed to be minimal. In contrast, DFS dives deeply along an arbitrary single branch first and may reach the target via a convoluted, high-hop path before ever backtracking.

### 2. Code-Writing
**Question**: Write a multi-source BFS function to calculate the minimum distance from each cell in a binary matrix to the nearest `0`.  
**Hint**: Enqueue all cells containing `0` at distance 0, then expand outwards.  
**Expected Answer Shape**: Initialize `dist` matrix with $\infty$. Push all `(r, c)` where `matrix[r][c] === 0` into queue and set `dist[r][c] = 0`. Pop cells, explore 4 cardinal directions. If `dist[nr][nc] === Infinity`, set `dist[nr][nc] = dist[r][c] + 1` and enqueue. Return `dist` in $O(R \times C)$ time.

### 3. Debugging
**Question**: Spot the critical bug in this BFS search:  
```javascript
function bfs(adj, start, target) {
  const queue = [start];
  const visited = new Set();
  while (queue.length) {
    const node = queue.shift();
    visited.add(node);
    if (node === target) return true;
    for (const neighbor of adj[node]) {
      if (!visited.has(neighbor)) queue.push(neighbor);
    }
  }
  return false;
}
```  
**Hint**: Look at when `visited.add()` is invoked.  
**Expected Answer Shape**: `visited.add(node)` is called after popping from the queue. If multiple nodes share the same neighbor, that neighbor will be pushed into the queue multiple times before any one of them pops and marks it visited, leading to exponential redundant queue growth. Fix by marking `visited.add(neighbor)` immediately before `queue.push(neighbor)`.

### 4. System Design / Tradeoff
**Question**: In building a "Degrees of Separation" feature (LinkedIn/Facebook) in Node.js, why is Bidirectional BFS preferred over standard Single-Source BFS?  
**Hint**: Compare search space area: $b^d$ vs $2 \cdot b^{d/2}$.  
**Expected Answer Shape**: If average branching factor is $b = 100$ and target distance is $d = 6$, standard BFS explores $100^6 = 10^{12}$ nodes, overwhelming server memory. Bidirectional BFS expands two simultaneous search frontiers from both the source and target. They meet in the middle at $d/2 = 3$, exploring only $2 \cdot 100^3 = 2 \cdot 10^6$ nodes—a $500,000\times$ reduction in time and memory.

### 5. Tricky / Edge Case
**Question**: How does BFS behave on a graph with negative edge weights? Can it find the shortest path?  
**Hint**: Does edge weight matter in standard BFS?  
**Expected Answer Shape**: Standard BFS ignores edge weights and only counts edge counts (hops). If edge weights vary (whether positive or negative), BFS cannot find the shortest path. For graphs with arbitrary weights, Dijkstra (non-negative) or Bellman-Ford (negative weights) must be used.

### 6. Real-World Node.js Context
**Question**: How would you implement a distributed crawl depth limiter in a Node.js web scraper using BFS?  
**Hint**: Level tracking in queue items or snapshot loops.  
**Expected Answer Shape**: Wrap each queue item with `{ url, depth }`. Before processing an item, check `if (depth > MAX_DEPTH) continue`. For outgoing URLs parsed from HTML, if `depth + 1 <= MAX_DEPTH` and URL is not in a shared Redis/in-memory Bloom Filter visited set, add to visited set and push `{ url, depth: depth + 1 }` to the worker queue.
