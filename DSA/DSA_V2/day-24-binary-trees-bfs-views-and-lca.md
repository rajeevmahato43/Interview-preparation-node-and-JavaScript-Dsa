# Day 24: Binary Trees: BFS & Views

<nav aria-label="Lecture navigation">

[Previous: Binary Trees: DFS & Properties](day-23-binary-trees-dfs-and-properties.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search Trees](day-25-binary-search-trees-crud-and-validation.md)

</nav>

## Prerequisites

- [Day 15: Queues & Circular Buffers](day-15-queues-circular-buffers-and-design.md) — FIFO queue mechanics.
- [Day 23: Binary Trees: DFS & Properties](day-23-binary-trees-dfs-and-properties.md) — `TreeNode` structure.

---

## 1. What is Breadth-First Search (BFS)?

**Breadth-First Search (BFS)**, also called **Level Order Traversal**, visits all nodes level by level from top to bottom, left to right.

Unlike DFS which uses recursion (call stack), BFS uses a **Queue**:

```text
Tree:
        [ 1 ]          <-- Level 0: [ 1 ]
       /     \
    [ 2 ]   [ 3 ]      <-- Level 1: [ 2, 3 ]
    /   \       \
  [ 4 ] [ 5 ]   [ 6 ]  <-- Level 2: [ 4, 5, 6 ]

Order visited by Queue: 1 -> 2 -> 3 -> 4 -> 5 -> 6
```

---

## 2. Problem 1: Level Order Traversal

Given `root`, return the values level by level as a 2D array: `[[1], [2, 3], [4, 5, 6]]`.

### The Core Pattern: Freezing `levelSize`
At the start of each level, capture `const levelSize = queue.length`. Only process that many nodes for the current level!

```javascript
// Node.js code: BFS Level Order
function levelOrder(root) {
  if (!root) return [];

  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    const levelSize = queue.length; // Freeze current level count
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
- **Time Complexity:** $O(n)$ — Every node processed once.
- **Extra Space:** $O(w)$ — Where $w$ is the maximum width of the tree (at most $n/2$ leaf nodes).

---

## 3. Problem 2: Binary Tree Right Side View

Return the values of the nodes you can see when standing on the right side of the tree.

### The Insight: Last Node of Each Level
In BFS, the **last node processed** in each level's loop is the rightmost visible node!

```javascript
// Node.js code
function rightSideView(root) {
  if (!root) return [];

  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    const levelSize = queue.length;

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();

      // If this is the last node in the current level, record it
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
- **Time Complexity:** $O(n)$
- **Extra Space:** $O(w)$

---

## 4. Problem 3: Lowest Common Ancestor (LCA)

Find the lowest common ancestor of two nodes `p` and `q` in a binary tree.

### The Recursive Post-Order Rule:
- If current node is `p` or `q`, return it.
- Look in left subtree and right subtree.
- If **both left and right return a node**, the current node is their **Lowest Common Ancestor**!
- If only one side returns a node, pass that node up.

```javascript
// Node.js code: Lowest Common Ancestor
function lowestCommonAncestor(root, p, q) {
  if (!root || root === p || root === q) {
    return root;
  }

  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);

  // If p and q were found in different subtrees, current node is the LCA!
  if (left && right) {
    return root;
  }

  // Otherwise, return whichever side found a node
  return left ? left : right;
}
```
- **Time Complexity:** $O(n)$
- **Extra Space:** $O(h)$

---

## 5. Tricky Points and Common Traps

1. **Forgetting to freeze `levelSize`:** If you do `for (let i = 0; i < queue.length; i++)` directly, `queue.length` changes as you push children, mixing levels together!
2. **Empty tree base case:** Always check `if (!root) return [];` upfront.
3. **Queue performance:** In huge trees ($100,000$ nodes), `queue.shift()` is $O(n)$. For production, use an index pointer (`let head = 0`) or a custom queue.

---

## 6. Hands-On Exercises

Run this script in Node.js to test level order traversal:

```javascript
// Node.js code
const assert = require("node:assert");

class Node {
  constructor(v, l=null, r=null) { this.val = v; this.left = l; this.right = r; }
}

function testLevel(root) {
  if (!root) return [];
  const res = [], q = [root];
  while (q.length) {
    const sz = q.length, lvl = [];
    for (let i = 0; i < sz; i++) {
      const n = q.shift();
      lvl.push(n.val);
      if (n.left) q.push(n.left);
      if (n.right) q.push(n.right);
    }
    res.push(lvl);
  }
  return res;
}

const t = new Node(1, new Node(2), new Node(3));
assert.deepEqual(testLevel(t), [[1], [2, 3]]);

console.log("✅ Level order assertions passed!");
```

---

## 7. Summary

- **BFS** explores trees level-by-level using a **Queue**.
- **`levelSize = queue.length`** snapshots the number of nodes on the current level.
- **Right side view** grabs the last node of each level.
- **Lowest Common Ancestor** returns the node where `left` and `right` searches both find targets.

---

## 8. Cheat Sheet

| Task | Core BFS Technique |
| :--- | :--- |
| **Level Order** | Snapshot `size = q.length`, push current level array |
| **Right Side View** | Push `node.val` when `i === size - 1` |
| **LCA** | If `left && right` $\to$ return `root`; else return non-null side |

---

## 9. Interview Q&A

### 45-Second Explanation
> *"To traverse a binary tree level by level, we use Breadth-First Search with a FIFO queue. At each level, we measure the queue length to process all nodes at that depth in a single batch, enqueuing their left and right children for the next level. For the Right Side View, we simply record the last node evaluated in each level's batch. This runs in $O(n)$ time with $O(w)$ extra space where $w$ is the maximum width of the tree."*

---

## 10. Practice Problems

### 1. Binary Tree Level Order Traversal - Medium
Given the `root` of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level).
- **Input:** `root = [3,9,20,null,null,15,7]`
- **Expected Output:** `[[3],[9,20],[15,7]]`
- **Input:** `root = [1]`
- **Expected Output:** `[[1]]`
- **Input:** `root = []`
- **Expected Output:** `[]`

### 2. Binary Tree Right Side View - Medium
Given the `root` of a binary tree, imagine yourself standing on the right side of it, return the values of the nodes you can see ordered from top to bottom.
- **Input:** `root = [1,2,3,null,5,null,4]`
- **Expected Output:** `[1,3,4]`
- **Input:** `root = [1,null,3]`
- **Expected Output:** `[1,3]`
- **Input:** `root = []`
- **Expected Output:** `[]`

### 3. Lowest Common Ancestor of a Binary Tree - Medium
Given a binary tree, find the lowest common ancestor (LCA) of two given nodes `p` and `q`. The lowest common ancestor is defined between two nodes `p` and `q` as the lowest node in `T` that has both `p` and `q` as descendants (where we allow a node to be a descendant of itself).
- **Input:** `root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1`
- **Expected Output:** `3`
- **Input:** `root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 4`
- **Expected Output:** `5`
- **Input:** `root = [1,2], p = 1, q = 2`
- **Expected Output:** `1`

---

<nav aria-label="Lecture navigation">

[Previous: Binary Trees: DFS & Properties](day-23-binary-trees-dfs-and-properties.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search Trees](day-25-binary-search-trees-crud-and-validation.md)

</nav>
