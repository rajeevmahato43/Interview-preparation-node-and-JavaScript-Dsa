# Day 32: Level-Order Traversal (BFS) and Tree Views

<nav aria-label="Lecture navigation">

[Previous: Binary Tree Fundamentals and DFS](day-31-binary-tree-fundamentals-and-dfs.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Tree Depth, Diameter, and Path Sums](day-33-tree-depth-diameter-and-path-sums.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Master **Breadth-First Search (BFS)** across binary trees using an explicit FIFO Queue.
- Apply the **Snapshot Sizing Invariant** (`const levelSize = queue.length`) to isolate generation boundaries.
- Implement **Binary Tree Right Side View** and **Left Side View** in $O(n)$ time.
- Implement **Zigzag Level-Order Traversal** with optimal array placement, eliminating $O(n^2)$ `unshift()` overhead.
- Analyze BFS space complexity ($O(w)$ where max width $w \approx n/2$ for balanced trees) and compare against DFS stack depth ($O(h)$).
- Apply level-order scheduling to microservice boot sequencing and package dependency trees in Node.js.

---

## Prerequisites

- [Day 19: Queue Fundamentals, Circular Queues, and Deque](day-19-queue-circular-queue-and-deque.md) — FIFO queue mechanics and `shift()` performance hazards.
- [Day 31: Binary Tree Fundamentals and DFS](day-31-binary-tree-fundamentals-and-dfs.md) — Node structures, root, left, and right pointers.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
| :--- | :--- | :--- |
| **Breadth-First Search (BFS)** | A tree traversal strategy that visits all nodes at horizontal distance $d$ from the root before exploring nodes at distance $d + 1$. | Used for shortest-path calculations, level grouping, and hierarchical generation boundaries. |
| **Snapshot Sizing** | Capturing the queue length before processing a level (`levelSize = queue.length`) and iterating exactly that many times. | Ensures newly enqueued child nodes do not contaminate the active generation loop. |
| **Maximum Tree Width ($w$)** | The maximum number of nodes existing at any single horizontal level of a binary tree. | Governs the auxiliary queue memory footprint ($w \le \lceil n/2 \rceil$ for complete binary trees). |
| **Right Side View** | The sequence of nodes visible when looking at a binary tree from the right, corresponding to the final element of each BFS level. | Solved cleanly via BFS (`i === levelSize - 1`) or DFS with depth indexing. |
| **Zigzag Traversal** | Level-order traversal where node values alternate between left-to-right and right-to-left order on consecutive depths. | Models alternating generation scheduling and bi-directional scan pipelines. |

---

## Core Concepts

### 1. Breadth-First Search (BFS) and FIFO Queue Architecture

A **Breadth-First Search (BFS)** explores a binary tree horizontally, level by level, in order of increasing depth from the root node.

While Depth-First Search uses a LIFO Stack (call stack or heap array) to plunge to leaves, Breadth-First Search uses a **FIFO Queue** to process nodes in the order they were discovered:
1. Initialize a queue containing the `root` node.
2. While the queue is non-empty, dequeue the front node.
3. Enqueue the node's non-null `left` and `right` children.

```text
Level-Order Traversal Geometry:
Level 0:          [ 1 ]
                /       \
Level 1:      [ 2 ]     [ 3 ]
             /     \       \
Level 2:   [ 4 ]   [ 5 ]   [ 6 ]

Queue Progression:
Initial:   [ 1 ]
Pop 1:     Enqueue 2, 3 -> [ 2, 3 ]
Pop 2:     Enqueue 4, 5 -> [ 3, 4, 5 ]
Pop 3:     Enqueue 6    -> [ 4, 5, 6 ]
Pop 4,5,6: Leaves       -> [ ] (Done!)
Output:    [[1], [2, 3], [4, 5, 6]]
```

---

### 2. The Snapshot Sizing Invariant: Level Grouping

In problems like **Binary Tree Level Order Traversal** (LeetCode 102), nodes must be segmented into nested arrays grouping elements by depth: `[[1], [2, 3], [4, 5, 6]]`.

#### The Dynamic Queue Length Trap
If you write `for (let i = 0; i < queue.length; i++)`, enqueuing child nodes extends `queue.length` during iteration, blending parents and children into a continuous unsegmented stream.

#### The Snapshot Solution
At the start of each level, capture `const levelSize = queue.length`. Loop exactly `levelSize` times. This guarantees that exactly one full generation is dequeued while all newly discovered children wait in the queue for the subsequent generation:

```javascript
// Node.js code: Binary Tree Level Order Traversal (LeetCode 102)

class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function levelOrder(root) {
  if (!root) return [];

  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    // Invariant: Snapshot level size before enqueuing children!
    const levelSize = queue.length;
    const currentLevel = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift(); // Dequeue
      currentLevel.push(node.val);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(currentLevel);
  }

  return result;
}
```

---

### 3. Binary Tree Right and Left Side Views (LeetCode 199)

The **Right Side View** represents the sequence of nodes visible when looking at the tree from the right-hand side.

#### The Common Fallacy
A frequent interview trap is assuming that the right side view simply follows the tree's right child pointers.
If a node lacks a right child, its **left child is visible from the right**!

```text
Tree Example:
       1            <-- Right view: 1
      / \
     2   3          <-- Right view: 3
      \
       5            <-- Right view: 5 (Node 2 has no right child, but 5 is visible!)

BFS Right View Rule:
Inside the level loop (i from 0 to levelSize - 1):
- If i === levelSize - 1: This is the LAST node in the level -> Push to rightSideView!
- If i === 0: This is the FIRST node in the level -> Push to leftSideView!
```

```javascript
// Node.js code: Binary Tree Right Side View (LeetCode 199)

function rightSideView(root) {
  if (!root) return [];

  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    const levelSize = queue.length;

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();

      // The last node processed in the current level is visible from the right
      if (i === levelSize - 1) {
        result.push(node.val);
      }

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }

  return result;
}
```

---

### 4. Zigzag Level-Order Traversal (LeetCode 103)

In **Zigzag Level Order Traversal**, nodes are read left-to-right on even levels and right-to-left on odd levels.

#### Avoiding the $O(n^2)$ `unshift()` Performance Trap
Using `currentLevel.unshift(node.val)` shifts existing elements in memory on every insertion.
Instead, allocate a pre-sized array for the level `new Array(levelSize)` and populate values by index:
- If left-to-right: `currentLevel[i] = node.val;`
- If right-to-left: `currentLevel[levelSize - 1 - i] = node.val;`
This delivers strictly linear $O(n)$ performance with zero element shifting.

```javascript
// Node.js code: Optimized Zigzag Level Order Traversal (LeetCode 103)

function zigzagLevelOrder(root) {
  if (!root) return [];

  const result = [];
  const queue = [root];
  let isLeftToRight = true;

  while (queue.length > 0) {
    const levelSize = queue.length;
    // Pre-allocate array of exact capacity
    const currentLevel = new Array(levelSize);

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();

      // Determine placement index without unshift shifting overhead
      const index = isLeftToRight ? i : levelSize - 1 - i;
      currentLevel[index] = node.val;

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(currentLevel);
    isLeftToRight = !isLeftToRight; // Toggle direction for next generation
  }

  return result;
}
```

---

## Detailed Node.js Relevance: Staged Microservice Boot Sequencing

In Node.js enterprise microservices and workflow engines (e.g., BullMQ task graphs, package dependency loaders), system dependencies form an acyclic dependency hierarchy:

```text
Boot Sequencing Pipeline:
Level 0:  [ Database Pool ]          <- Tier 1: Must boot and accept sockets
               /         \
Level 1:  [ Redis Cache ] [ Auth RPC ] <- Tier 2: Can boot concurrently once DB is healthy
             /
Level 2:  [ HTTP API Gateway ]        <- Tier 3: Only opens port once dependencies ready
```

- **Level-Order Scheduling**: Booting all Tier 1 services concurrently and awaiting their health checks before initiating Tier 2 prevents race conditions and cascading connection timeouts.
- **Queue Memory in Node.js**: While `queue.shift()` works for small interview trees, in high-throughput streaming systems processing 500,000 tasks, calling `shift()` repeatedly degrades performance to $O(n^2)$. Use a head-pointer queue (`let head = 0`) or linked list queue to maintain true $O(1)$ dequeues.

---

## Tricky Points & Edge Cases

1. **Space Complexity Asymmetry (BFS vs DFS)**:
   - For a full binary tree with $n$ nodes, the leaf level contains $\lceil n/2 \rceil$ nodes. BFS queue space is $O(w) \approx O(n)$, consuming far more memory than DFS stack space ($O(\log n)$).
   - For a degenerate stick tree ($h = n$), BFS queue holds at most 1 node ($O(1)$ space), whereas DFS consumes $O(n)$ stack frames.
2. **Right Side View via DFS**:
   Right Side View can also be solved using DFS by visiting `node.right` before `node.left` and checking `if (depth === result.length) result.push(node.val)`. This runs in $O(h)$ space instead of $O(w)$.
3. **Empty Root Guard**:
   Calling `queue = [root]` when `root === null` initializes `queue.length = 1` with an `undefined` node, causing immediate runtime errors on `node.left`. Always guard `if (!root) return [];`.

---

## Hands-On Exercise

### Scenario: Find Bottom Left Tree Value in Single-Pass BFS

Implement `findBottomLeftValue(root)` (LeetCode 513): Given the root of a binary tree, return the leftmost value in the last row of the tree. Can you solve it in a single pass using BFS without maintaining multi-dimensional level arrays?

### Buggy Code

```javascript
// ❌ BUGGY: Fails on single nodes and traverses in wrong order
function buggyBottomLeft(root) {
  let queue = [root];
  let ans = null;

  while (queue.length > 0) {
    const node = queue.shift();
    ans = node.val;
    // BUG: Enqueues Left then Right, causing ans to end up at the bottom RIGHT node!
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }

  return ans;
}
```

### Acceptance Criteria

1. Returns the leftmost value of the deepest row in $O(n)$ time and $O(w)$ space.
2. Implements the **Right-to-Left BFS trick**: enqueuing `right` before `left` ensures the final node dequeued in the entire traversal is the bottom-left node!
3. Avoids nested level array allocations.
4. Verified with assertions testing single nodes, left-heavy trees, and right-heavy trees.

### Solution Code

```javascript
// Node.js code: Single-Pass Bottom-Left Value Finder
const assert = require("assert");

function findBottomLeftValue(root) {
  // Invariant: Enqueue RIGHT child before LEFT child!
  const queue = [root];
  let node = null;

  while (queue.length > 0) {
    node = queue.shift();

    // Enqueue right first, then left
    if (node.right) queue.push(node.right);
    if (node.left) queue.push(node.left);
  }

  // The very last node dequeued is guaranteed to be the bottom-left node!
  return node.val;
}

// Verification Tests
// Tree:
//      2
//     / \
//    1   3
const t1 = new TreeNode(2, new TreeNode(1), new TreeNode(3));
assert.strictEqual(findBottomLeftValue(t1), 1);

// Tree with deep left branch:
//        1
//       / \
//      2   3
//     /   / \
//    4   5   6
//       /
//      7
const t2 = new TreeNode(
  1,
  new TreeNode(2, new TreeNode(4)),
  new TreeNode(3, new TreeNode(5, new TreeNode(7)), new TreeNode(6))
);
assert.strictEqual(findBottomLeftValue(t2), 7);

// Single node
assert.strictEqual(findBottomLeftValue(new TreeNode(99)), 99);

console.log("✅ All Bottom Left Tree Value assertions passed successfully.");
```

### Solution Explanation

1. **Right-to-Left Traversal Invariant**: By enqueuing `node.right` before `node.left`, nodes at each level are processed from right to left.
2. **Zero Level Grouping Overhead**: The very last node processed across the entire tree is the leftmost node of the deepest level, completely eliminating the need to track level boundaries or store nested arrays.

---

## Summary

- **BFS Mechanism**: Explores nodes layer-by-layer using a FIFO queue.
- **Snapshot Invariant**: Capture `levelSize = queue.length` to freeze parent generation boundaries before enqueuing children.
- **Side Views**: The right side view captures the last node of each level (`i === levelSize - 1`); the left side view captures the first (`i === 0`).
- **Zigzag Optimization**: Alternate placement via `currentLevel[isLeftToRight ? i : levelSize - 1 - i]` to avoid $O(n^2)$ array shifts.
- **Memory Tradeoff**: In balanced trees, BFS consumes $O(w) \approx O(n)$ memory (widest bottom layer), while DFS consumes $O(\log n)$ memory.

---

## Cheat Sheet & Common Pitfalls

### BFS Level Order Template
```javascript
if (!root) return [];
const queue = [root], result = [];

while (queue.length > 0) {
  const levelSize = queue.length;
  const currentLevel = [];

  for (let i = 0; i < levelSize; i++) {
    const node = queue.shift();
    currentLevel.push(node.val);

    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  result.push(currentLevel);
}
```

### Common Pitfalls

| Mistake | Consequence | Correct Pattern |
| :--- | :--- | :--- |
| **`for (let i = 0; i < queue.length; i++)`** | Children extend loop length, breaking levels. | Snapshot `const levelSize = queue.length`. |
| **`Array.shift()` on massive trees** | Degrades runtime to $O(n^2)$ due to reindexing. | Use a two-pointer head index queue. |
| **Assuming right child = right view** | Misses left children visible from the right. | Inspect the final node in the BFS level. |
| **Omitting `if (!root) return []`** | Enqueues null, triggering property read crash. | Guard null roots at function entry. |

---

## Interview Questions

### 1. Why is BFS space complexity $O(w)$ while DFS space complexity is $O(h)$, and when is BFS more memory-efficient?

**Question:** Compare the auxiliary space complexity of Breadth-First Search ($O(w)$) versus Depth-First Search ($O(h)$) on binary trees. Under what tree topology is BFS strictly more memory-efficient than DFS?

**Answer:** 
1. **Space Comparison**:
   - **DFS Space ($O(h)$)**: Bounded by the height of the tree, representing the maximum number of activation frames concurrently active on the call stack along a root-to-leaf path.
   - **BFS Space ($O(w)$)**: Bounded by the maximum width of the tree, representing the maximum number of sibling nodes concurrently held in the FIFO queue at any horizontal level.
2. **Balanced Binary Trees**:
   - In a balanced tree of $n$ nodes, height is $h = \log_2 n$, while the widest bottom leaf layer contains $w = \lceil n/2 \rceil$ nodes.
   - DFS consumes $O(\log n)$ space (e.g., 20 frames for $10^6$ nodes), whereas BFS consumes $O(n)$ space (holding 500,000 nodes in the queue). Here, DFS is vastly superior in memory efficiency.
3. **Degenerate (Skewed) Stick Trees**:
   - If every node has only a single child, height is $h = n$, while width is $w = 1$.
   - DFS consumes $O(n)$ stack memory, risking call stack overflow.
   - BFS never holds more than 1 node in the queue at any time, executing in strictly **$O(1)$ constant memory**.
   - Under degenerate topologies, BFS is strictly more memory-efficient than DFS.

---

### 2. Can Right Side View be solved using DFS instead of BFS? What is the traversal order and space complexity?

**Question:** Implement Binary Tree Right Side View using Depth-First Search rather than Breadth-First Search, and explain its traversal order.

**Answer:** 

```javascript
// Node.js code
function rightSideViewDFS(root) {
  const result = [];

  function dfs(node, depth) {
    if (!node) return;

    // If depth equals result.length, this is the FIRST node encountered at this depth
    if (depth === result.length) {
      result.push(node.val);
    }

    // Invariant: Visit RIGHT child before LEFT child!
    dfs(node.right, depth + 1);
    dfs(node.left, depth + 1);
  }

  dfs(root, 0);
  return result;
}
```

**Traversal Order and Complexity**:
- By visiting `node.right` before `node.left`, the rightmost branch at each level is explored first.
- The condition `depth === result.length` records the first node discovered at each depth (the rightmost node), ignoring any subsequent leftward nodes visited at that same depth.
- **Time Complexity**: $O(n)$ single pass.
- **Space Complexity**: $O(h)$ call stack depth ($O(\log n)$ balanced), which is strictly superior to BFS's $O(n)$ queue memory.

---

### 3. What is the performance defect in using `Array.prototype.shift()` inside a Node.js BFS queue?

**Question:** Why does using `queue.shift()` inside a BFS loop degrade performance on trees with 200,000 nodes in Node.js, and how is it resolved?

**Answer:** 
In the V8 engine, standard JavaScript arrays are backed by contiguous memory blocks.
When `queue.shift()` executes:
1. The element at index `0` is removed.
2. The engine must shift all remaining $k - 1$ elements in memory one slot to the left to maintain zero-based indexing.
3. Over $n$ nodes, performing shifts on a queue of average size $k$ yields:
   $$\sum_{i=1}^n O(k) \approx O(n^2) \text{ operations}$$
4. For 200,000 nodes, quadratic element copying freezes the single-threaded Node.js event loop for several seconds.

**Production Solution**: Use a Head-Index Pointer to achieve $O(1)$ dequeues:
```javascript
let head = 0;
while (head < queue.length) {
  const node = queue[head++]; // O(1) dequeue without shifting
  if (node.left) queue.push(node.left);
  if (node.right) queue.push(node.right);
}
```

---

### 4. How would you distribute a large binary tree traversal across multiple worker threads in Node.js using BFS?

**Question:** In a Node.js service analyzing a binary tree containing 10,000,000 nodes, how can BFS be leveraged to partition the computation across multiple CPU cores?

**Answer:** 
Because Node.js runs JavaScript on a single thread, traversing 10 million nodes monopolizes the CPU. We can use BFS to fan out subtrees to a pool of `worker_threads`:
1. **Master Thread BFS Phase**:
   The main thread runs a shallow BFS starting from the root down to level $k$ until the queue contains $M$ independent subtree root nodes (where $M \ge \text{available CPU cores}$, e.g., level 4 yields 16 subtrees).
2. **Worker Dispatch**:
   The master thread serializes each subtree root descriptor and dispatches them across the worker pool using `worker.postMessage()`.
3. **Parallel Traversal**:
   Each worker thread receives a disjoint subtree and executes an iterative DFS/BFS independently in parallel across separate CPU cores.
4. **Aggregation**:
   Workers post partial summaries back to the master thread, which combines the results. This achieves near-linear multi-core speedup without event loop starvation.

---

<nav aria-label="Lecture navigation">

[Previous: Binary Tree Fundamentals and DFS](day-31-binary-tree-fundamentals-and-dfs.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Tree Depth, Diameter, and Path Sums](day-33-tree-depth-diameter-and-path-sums.md)

</nav>
