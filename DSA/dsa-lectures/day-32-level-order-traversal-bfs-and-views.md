# Day 32: Level-Order Traversal (BFS) and Tree Views

## 1. Learning Outcomes
- Master **Breadth-First Search (BFS)** on binary trees using an explicit FIFO Queue.
- Implement level-by-level batch processing using snapshot queue sizing (`queue.length` at level start).
- Implement **Zigzag Level-Order Traversal** alternating left-to-right and right-to-left directions.
- Compute the **Right Side View** and **Left Side View** of a binary tree in $O(n)$ time.
- Analyze BFS queue space complexity ($O(w)$ where $w \approx n/2$ for balanced trees) and V8 garbage collection implications in Node.js.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 19 (Queue, Circular Queue, Deque), Day 31 (Binary Tree Fundamentals & DFS).
- **Navigation**:
  - [Previous: Day 31 - Binary Tree Fundamentals and DFS](day-31-binary-tree-fundamentals-and-dfs.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 33 - Tree Depth, Diameter, and Path Sums](day-33-tree-depth-diameter-and-path-sums.md)

---

## 3. Core Concepts & Mental Models
While DFS plunges down leaf paths first, **Breadth-First Search (BFS)** explores trees horizontally, layer by layer, in increasing order of distance from the root.

```text
Level-Order Traversal & Views:
Level 0:          [1]            <-- Left View: 1  |  Right View: 1
                /     \
Level 1:      [2]     [3]        <-- Left View: 2  |  Right View: 3
             /   \       \
Level 2:   [4]   [5]     [6]     <-- Left View: 4  |  Right View: 6

Level-Order Output:
[[1], [2, 3], [4, 5, 6]]

Zigzag Output:
[[1], [3, 2], [4, 5, 6]]
```

### Snapshot Sizing Invariant
To group nodes by their hierarchical depth, capture the queue length before processing a level:
```javascript
const levelSize = queue.length;
for (let i = 0; i < levelSize; i++) {
  const node = queue.shift(); // process node
  // enqueue children for NEXT level
}
```
This isolates the current level from newly enqueued child nodes.

---

## 4. Detailed Technical Explanations

### 4.1 Queue Implementation in JavaScript: `Array.shift()` vs. Head Pointer
In standard JavaScript coding interviews, `queue.shift()` is commonly used for simplicity, but in V8 it is an $O(k)$ operation because it reindexes array elements. For production Node.js systems processing large trees ($N > 10^5$), an explicit head-index pointer (`let head = 0`) or a linked list queue provides true $O(1)$ dequeues, reducing execution time from $O(n^2)$ to $O(n)$.

### 4.2 Right and Left Side Views
- **Right Side View**: The last node visited in each level's BFS iteration (`i === levelSize - 1`).
- **Left Side View**: The first node visited in each level's BFS iteration (`i === 0`).
- Both can also be found via DFS with level tracking: traverse Right-first for Right View, recording the first node seen at each depth.

### 4.3 Node.js Relevance: Level-by-Level Microservice Dependency Resolution
In Node.js package managers (npm/yarn dependency trees) or workflow orchestration engines (e.g., BullMQ, temporal job DAGs), tasks must be processed in topological or level-order stages. All services at Depth 1 must be booted and healthy before spawning dependents at Depth 2.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 Level-Order Traversal (LeetCode 102)
```javascript
class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

/**
 * Level-order traversal grouping nodes by depth.
 * Time Complexity: O(n)
 * Space Complexity: O(w) where w is max width (up to n/2)
 */
function levelOrder(root) {
  if (!root) return [];

  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    const levelSize = queue.length; // Capture snapshot size
    const currentLevel = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      currentLevel.push(node.val);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(currentLevel);
  }

  return result;
}
```

### 5.2 Binary Tree Right Side View (LeetCode 199)
```javascript
/**
 * Returns values visible looking at tree from right side.
 * Time Complexity: O(n)
 * Space Complexity: O(w)
 */
function rightSideView(root) {
  if (!root) return [];

  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    const levelSize = queue.length;

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();

      // If last node in current level, it is visible from the right
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

### 5.3 Execution Trace: `rightSideView` on `[1, 2, 3, null, 5, null, 4]`
```text
Tree:
      1
     / \
    2   3
     \   \
      5   4

Level 0: queue=[1], levelSize=1.
  i=0: node 1 (i == 0 == levelSize-1) -> result.push(1).
  Enqueue children: queue=[2, 3].
Level 1: queue=[2, 3], levelSize=2.
  i=0: node 2. Enqueue 5. queue=[3, 5].
  i=1: node 3 (i == 1 == levelSize-1) -> result.push(3). Enqueue 4. queue=[5, 4].
Level 2: queue=[5, 4], levelSize=2.
  i=0: node 5. queue=[4].
  i=1: node 4 (i == 1 == levelSize-1) -> result.push(4). queue=[].
Result: [1, 3, 4].
```

---

## 6. Common Mistakes & Anti-Patterns
- **Dynamic Queue Length in Loop Condition**: Writing `for (let i = 0; i < queue.length; i++)` without snapshotting `levelSize = queue.length`. Enqueuing children during the loop continuously extends `queue.length`, breaking level segmentation.
- **Using `Array.shift()` on Massive Trees**: For trees with $10^6$ nodes, calling `shift()` repeatedly induces $O(n^2)$ array element copies in V8. Use a two-pointer queue index.
- **Assuming Right Child Equals Right Side View**: If a node lacks a right child, its left child is visible from the right. Side views depend on horizontal visibility across the entire level, not local right branches.

---

## 7. Tricky Points & Edge Cases
- **Null Root**: Always guard `if (!root) return [];` before initializing `queue = [root]`.
- **Zigzag Level Alternation**: Toggle a boolean flag `isLeftToRight = !isLeftToRight` after each level. When inserting into `currentLevel`, use `unshift()` or index assignment (`level[levelSize - 1 - i] = node.val`) to avoid full array reversals.
- **Deeply Skewed vs. Full Trees**: In a degenerate tree, max queue size is 1 ($O(1)$ space). In a full complete tree, leaf level contains $\lceil n/2 \rceil$ nodes, requiring $O(n)$ queue memory.

---

## 8. Practical Engineering Exercises
1. Implement `zigzagLevelOrder(root)` where values alternate reading left-to-right on even levels and right-to-left on odd levels.
2. Implement `findBottomLeftValue(root)` which returns the leftmost value in the last row of a binary tree in single-pass BFS.

---

## 9. Key Takeaways & Summary
- BFS traverses tree layers using a FIFO queue.
- Capturing `levelSize = queue.length` freezes the boundary between parent and child generations.
- Tree views (Right/Left) are solved cleanly by capturing the first (`i === 0`) or last (`i === levelSize - 1`) element of each level.
- Maximum queue space occurs at the deepest complete level ($W \approx n/2$).

---

## 10. Quick Reference Cheat Sheet
| Problem | Key Check in Level Loop | Space Complexity |
| :--- | :--- | :--- |
| **Level Order** | `currentLevel.push(node.val)` | $O(w)$ (up to $n/2$) |
| **Right Side View** | `if (i === levelSize - 1) result.push(node.val)` | $O(w)$ |
| **Left Side View** | `if (i === 0) result.push(node.val)` | $O(w)$ |
| **Zigzag** | If reversed: `level.unshift(node.val)` | $O(w)$ |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: Explain why BFS space complexity for a binary tree is $O(w)$ while DFS space complexity is $O(h)$. When is BFS more memory-efficient than DFS?  
**Hint**: Compare complete binary trees vs. tall, narrow skewed trees.  
**Expected Answer Shape**: In a balanced tree, height $h = \log_2 n$ and maximum width $w \approx n/2$. DFS stores the call stack path to leaves ($O(\log n)$ memory), whereas BFS stores the entire bottom level ($O(n)$ memory). However, in a degenerate "stick" tree where every node has only one child, $h = n$ (DFS uses $O(n)$ stack frames) and $w = 1$ (BFS queue never holds more than 1 node, using $O(1)$ space).

### 2. Code-Writing
**Question**: Write a function to calculate the average value of nodes on each level of a binary tree.  
**Hint**: Accumulate the sum of values at each level divided by `levelSize`.  
**Expected Answer Shape**: Standard level-order BFS loop. At each level, maintain `let sum = 0`. Iterate $i$ from 0 to `levelSize - 1`, adding `node.val` to `sum`. Push `sum / levelSize` into the results array. Return results array.

### 3. Debugging
**Question**: Spot the memory leak / performance bug in this BFS queue implementation:  
```javascript
function bfs(root) {
  const queue = [root];
  let head = 0;
  while (head < queue.length) {
    const node = queue[head++];
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
}
```  
**Hint**: What happens to elements at indices prior to `head` in V8 heap memory?  
**Expected Answer Shape**: Even though `head` increments, the underlying `queue` array retains references to every visited node throughout the entire traversal. V8 garbage collection cannot free processed nodes until `bfs` returns. For large trees ($10^7$ nodes), this triggers Out-Of-Memory. Use a circular buffer, linked queue, or slice/splice periodically to release references.

### 4. System Design / Tradeoff
**Question**: You are designing a web scraper crawler in Node.js. Should the crawler discover links using BFS or DFS, and how do you prevent event loop blocking?  
**Hint**: Think about breadth of domain links vs. depth of pagination loops.  
**Expected Answer Shape**: BFS is preferred for web crawlers to discover high-level authoritative pages across domains evenly and avoid getting trapped in deep pagination traps or crawler honeypots. To prevent event loop blocking, scrape asynchronously using a bounded queue (e.g., `p-queue` with concurrency limit of 10) yielding back to Node's libuv event loop between HTTP fetches.

### 5. Tricky / Edge Case
**Question**: Can Right Side View be solved using DFS instead of BFS? What would be the traversal order and space complexity?  
**Hint**: Visit Right child before Left child and check current depth against `result.length`.  
**Expected Answer Shape**: Yes. Perform DFS with a `(node, depth)` signature, visiting `node.right` before `node.left`. If `depth === result.length`, this node is the first node encountered at this level from the right side, so push `node.val`. Space complexity is $O(h)$ (call stack), which is strictly superior to BFS ($O(w)$) for balanced trees.

### 6. Real-World Node.js Context
**Question**: In Node.js clustering or worker threads, how would you distribute a large binary tree traversal across multiple CPU cores using BFS?  
**Hint**: Enqueue nodes until you reach a level with enough subtrees to parallelize.  
**Expected Answer Shape**: Run single-threaded BFS on the main thread down to level $k$ until `queue.length >= numWorkers` (e.g., level 3 yields 8 subtrees for 8 CPU cores). Serialize and dispatch each subtree root to a separate Worker Thread via `workerData` or `parentPort.postMessage()`. Workers execute DFS/BFS independently in parallel and return partial results to be aggregated by the master thread.
