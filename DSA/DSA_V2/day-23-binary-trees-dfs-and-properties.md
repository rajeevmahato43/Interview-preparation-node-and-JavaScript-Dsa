# Day 23: Binary Trees: DFS & Properties

<nav aria-label="Lecture navigation">

[Previous: Grid Backtracking & Mazes](day-22-grid-backtracking-and-n-queens.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Trees: BFS & Views](day-24-binary-trees-bfs-views-and-lca.md)

</nav>

## Prerequisites

- [Day 11: Singly & Doubly Linked Lists](day-11-singly-and-doubly-linked-lists.md) — Node classes and reference pointers.
- [Day 18: Recursion & Call Stack](day-18-recursion-fundamentals-and-call-stack.md) — Recursive tree traversal.

---

## 1. What is a Binary Tree?

A **Binary Tree** is a hierarchical data structure where each node has at most **two children**, labeled `left` and `right`.

```text
                  [ 1 ]            <-- Root Node (Depth 0)
                 /     \
              [ 2 ]   [ 3 ]        <-- Internal Nodes (Depth 1)
              /   \
            [ 4 ] [ 5 ]            <-- Leaf Nodes (No children)
```

### The Standard `TreeNode` Class
```javascript
// Node.js code
class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}
```

---

## 2. The 3 Depth-First (DFS) Traversals

DFS explores as deep as possible down each branch before backtracking. The 3 traversals differ strictly in **when the parent is processed**:

```text
1. Pre-Order  (Root -> Left -> Right): Process parent first (Cloning, serialization)
2. In-Order   (Left -> Root -> Right): Gives sorted order in a Binary Search Tree (BST)
3. Post-Order (Left -> Right -> Root): Process children first (Bottom-up calculation, deletion)
```

```javascript
// Pre-order traversal
function preOrder(root) {
  if (!root) return;
  console.log(root.val); // Root
  preOrder(root.left);    // Left
  preOrder(root.right);   // Right
}
```

---

## 3. Problem 1: Maximum Depth of Binary Tree

Find the number of nodes along the longest path from the root down to the farthest leaf.

```javascript
// Node.js code: Maximum Depth (DFS)
function maxDepth(root) {
  // Base case: empty node has depth 0
  if (root === null) return 0;

  // 1 + maximum of left and right child depths
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}

const tree = new TreeNode(3, new TreeNode(9), new TreeNode(20, new TreeNode(15), new TreeNode(7)));
console.log(maxDepth(tree)); // 3
```
- **Time Complexity:** $O(n)$ — Visits every node once.
- **Extra Space:** $O(h)$ where $h$ is tree height ($O(\log n)$ balanced, $O(n)$ skewed).

---

## 4. Problem 2: Invert Binary Tree

Invert (mirror) a binary tree by swapping every node's left and right children.

```javascript
// Node.js code: Invert Binary Tree
function invertTree(root) {
  if (root === null) return null;

  // Swap children
  const temp = root.left;
  root.left = invertTree(root.right);
  root.right = invertTree(temp);

  return root;
}
```
- **Time Complexity:** $O(n)$
- **Extra Space:** $O(h)$

---

## 5. Problem 3: Diameter of Binary Tree

The diameter is the length of the longest path between any two nodes. (The path does not need to pass through the root).

### The Insight: Post-Order Height Computation
At each node, the longest path passing through that node is `leftHeight + rightHeight`:

```javascript
// Node.js code: Tree Diameter
function diameterOfBinaryTree(root) {
  let maxDiameter = 0;

  function getHeight(node) {
    if (node === null) return 0;

    const left = getHeight(node.left);
    const right = getHeight(node.right);

    // Update global diameter
    maxDiameter = Math.max(maxDiameter, left + right);

    // Return height of current node
    return 1 + Math.max(left, right);
  }

  getHeight(root);
  return maxDiameter;
}
```
- **Time Complexity:** $O(n)$
- **Extra Space:** $O(h)$

---

## 6. Tricky Points and Common Traps

1. **Base case check:** Always check `if (root === null) return 0;` (or `return null;`) before reading `root.left` or `root.val`.
2. **Skewed tree call stack:** In a skewed tree (looks like a linked list), the tree height is $n$, taking $O(n)$ stack space.
3. **Diameter vs Height:** Height counts edges on the single longest branch down. Diameter counts the combined length of the two longest branches through a common ancestor.

---

## 7. Hands-On Exercises

Run this script in Node.js to verify depth and inverting:

```javascript
// Node.js code
const assert = require("node:assert");

class Node {
  constructor(v, l=null, r=null) { this.val = v; this.left = l; this.right = r; }
}

function testDepth(root) {
  if (!root) return 0;
  return 1 + Math.max(testDepth(root.left), testDepth(root.right));
}

const t = new Node(1, new Node(2, new Node(4)), new Node(3));
assert.equal(testDepth(t), 3);
assert.equal(testDepth(null), 0);

console.log("✅ Binary tree DFS assertions passed!");
```

---

## 8. Summary

- **Binary Tree**: Each node has at most two children (`left`, `right`).
- **DFS Traversals**: Pre-Order (Root first), In-Order (Root middle), Post-Order (Root last).
- **Tree Depth**: `1 + Math.max(leftDepth, rightDepth)`.
- **Space complexity**: Bounded by tree height $O(h)$.

---

## 9. Cheat Sheet

| Traversal | Order | Common Use |
| :--- | :--- | :--- |
| **Pre-Order** | Root $\to$ Left $\to$ Right | Copying tree, serialization |
| **In-Order** | Left $\to$ Root $\to$ Right | Sorted order in BST |
| **Post-Order** | Left $\to$ Right $\to$ Root | Deletion, diameter, bottom-up calculation |

---

## 10. Interview Q&A

### 45-Second Explanation
> *"To calculate the maximum depth of a binary tree, we use a post-order depth-first search. The depth of any node is 1 plus the maximum depth of its left and right subtrees. Our base case returns 0 when encountering a null node. This visits each node exactly once in $O(n)$ time, utilizing $O(h)$ auxiliary stack memory where $h$ is the height of the tree."*

---

## 11. Practice Problems

### 1. Maximum Depth of Binary Tree - Easy
Given the `root` of a binary tree, return its maximum depth. A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.
- **Input:** `root = [3,9,20,null,null,15,7]`
- **Expected Output:** `3`
- **Input:** `root = [1,null,2]`
- **Expected Output:** `2`

### 2. Invert Binary Tree - Easy
Given the `root` of a binary tree, invert the tree, and return its root.
- **Input:** `root = [4,2,7,1,3,6,9]`
- **Expected Output:** `[4,7,2,9,6,3,1]`
- **Input:** `root = [2,1,3]`
- **Expected Output:** `[2,3,1]`
- **Input:** `root = []`
- **Expected Output:** `[]`

### 3. Diameter of Binary Tree - Easy
Given the `root` of a binary tree, return the length of the diameter of the tree. The diameter of a binary tree is the length of the longest path between any two nodes in a tree. This path may or may not pass through the root.
- **Input:** `root = [1,2,3,4,5]`
- **Expected Output:** `3`
- **Input:** `root = [1,2]`
- **Expected Output:** `1`

---

<nav aria-label="Lecture navigation">

[Previous: Grid Backtracking & Mazes](day-22-grid-backtracking-and-n-queens.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Trees: BFS & Views](day-24-binary-trees-bfs-views-and-lca.md)

</nav>
