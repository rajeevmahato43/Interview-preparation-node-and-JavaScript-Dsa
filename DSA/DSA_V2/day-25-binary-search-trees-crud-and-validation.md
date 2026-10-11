# Day 25: Binary Search Trees

<nav aria-label="Lecture navigation">

[Previous: Binary Trees: BFS & Views](day-24-binary-trees-bfs-views-and-lca.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Graphs: BFS & DFS](day-26-graphs-bfs-shortest-path-and-dfs-components.md)

</nav>

## Prerequisites

- [Day 23: Binary Trees: DFS & Properties](day-23-binary-trees-dfs-and-properties.md) — DFS traversals and tree nodes.

---

## 1. What is a Binary Search Tree (BST)?

A **Binary Search Tree** is a binary tree where every node obeys this strict rule:
- All values in the **left subtree** are **strictly smaller** than the node's value.
- All values in the **right subtree** are **strictly larger** than the node's value.

```text
               [ 5 ]
              /     \
           [ 3 ]   [ 8 ]
           /   \   /   \
         [ 1 ] [4][7]  [9]
```

### The In-Order Superpower
An **In-Order Traversal (Left $\to$ Root $\to$ Right)** of a BST always visits nodes in **strictly ascending sorted order**:
`1, 3, 4, 5, 7, 8, 9`!

---

## 2. Searching and Inserting in a BST ($O(\log n)$)

Because of the sorted rule, searching a BST works just like binary search:

```javascript
// Node.js code: Search in BST
function searchBST(root, val) {
  if (!root || root.val === val) return root;

  // If target is smaller, search left; else search right
  if (val < root.val) {
    return searchBST(root.left, val);
  } else {
    return searchBST(root.right, val);
  }
}
```
- **Time Complexity:** $O(\log n)$ average (balanced tree), $O(n)$ worst-case (skewed tree).

---

## 3. Problem 1: Validate Binary Search Tree

Given `root`, determine if it is a valid BST.

### The Range Trap (Common Mistake):
Checking only that `node.left.val < node.val < node.right.val` is **wrong**!
Every single node in the entire left subtree must be smaller than the root.
We must pass an allowable range `(min, max)` down to each node:

```javascript
// Node.js code: Validate BST
function isValidBST(root) {
  function validate(node, min, max) {
    if (!node) return true; // Empty node is valid

    // Must be strictly within (min, max)
    if ((min !== null && node.val <= min) || (max !== null && node.val >= max)) {
      return false;
    }

    // Left child cannot exceed current node value (max = node.val)
    // Right child must exceed current node value (min = node.val)
    return validate(node.left, min, node.val) && validate(node.right, node.val, max);
  }

  return validate(root, null, null);
}
```
- **Time Complexity:** $O(n)$ — Visits each node once.
- **Extra Space:** $O(h)$ stack space.

---

## 4. Problem 2: Lowest Common Ancestor of a BST

In a BST, finding the LCA is fast because values tell us which way to go!
- If both `p` and `q` are **smaller** than `root.val`: LCA is in the **left subtree**.
- If both `p` and `q` are **larger** than `root.val`: LCA is in the **right subtree**.
- If they split (one is smaller, one is larger): **current node is the LCA**!

```javascript
// Node.js code: LCA in BST
function lowestCommonAncestorBST(root, p, q) {
  while (root) {
    if (p.val < root.val && q.val < root.val) {
      root = root.left; // Both on left
    } else if (p.val > root.val && q.val > root.val) {
      root = root.right; // Both on right
    } else {
      return root; // Split point is the LCA!
    }
  }
  return null;
}
```
- **Time Complexity:** $O(h)$ where $h$ is tree height.
- **Extra Space:** $O(1)$ iterative traversal!

---

## 5. Problem 3: Kth Smallest Element in a BST

Find the $k$-th smallest value in a BST.

### The Algorithm:
An in-order traversal visits nodes from smallest to largest. Stop at the $k$-th node!

```javascript
// Node.js code
function kthSmallest(root, k) {
  let count = 0;
  let result = null;

  function inOrder(node) {
    if (!node || result !== null) return;

    inOrder(node.left);

    count++;
    if (count === k) {
      result = node.val;
      return;
    }

    inOrder(node.right);
  }

  inOrder(root);
  return result;
}
```
- **Time Complexity:** $O(h + k)$ — Halts as soon as $k$ nodes are visited.
- **Extra Space:** $O(h)$

---

## 6. Tricky Points and Common Traps

1. **Duplicate values in BST:** Classic BST definitions require *strictly* smaller (`<`) and *strictly* larger (`>`). Equal values violate standard BST rules.
2. **Local vs Global validity:** Remember that a node's children may satisfy the local `<` and `>`, but violate an ancestor higher up. Always validate with min and max bounds!

---

## 7. Hands-On Exercises

Run this script in Node.js to verify BST validation:

```javascript
// Node.js code
const assert = require("node:assert");

class Node {
  constructor(v, l=null, r=null) { this.val = v; this.left = l; this.right = r; }
}

function testBST(root, min=null, max=null) {
  if (!root) return true;
  if ((min !== null && root.val <= min) || (max !== null && root.val >= max)) return false;
  return testBST(root.left, min, root.val) && testBST(root.right, root.val, max);
}

const valid = new Node(5, new Node(3), new Node(7));
const invalid = new Node(5, new Node(1), new Node(4, new Node(3), new Node(6)));

assert.equal(testBST(valid), true);
assert.equal(testBST(invalid), false);

console.log("✅ BST validation assertions passed!");
```

---

## 8. Summary

- **BST rule**: Left subtree $<$ Root $<$ Right subtree.
- **In-Order Traversal** visits BST nodes in sorted order.
- **Validating a BST** requires passing allowable `(min, max)` ranges down.
- **LCA in BST** takes $O(h)$ time and $O(1)$ space by comparing values against `root.val`.

---

## 9. Cheat Sheet

| Task | Core Technique | Complexity |
| :--- | :--- | :---: |
| **Validate BST** | Check `min < val < max` recursively | $O(n)$ time, $O(h)$ space |
| **LCA in BST** | Move left if both $<$, right if both $>$, else stop | **$O(h)$ time, $O(1)$ space** |
| **Kth Smallest** | In-order traversal counter up to $k$ | $O(h + k)$ time |

---

## 10. Interview Q&A

### 45-Second Explanation
> *"A Binary Search Tree maintains the invariant that all nodes in a node's left subtree are smaller than its value, and all nodes in its right subtree are larger. This allows logarithmic search and insertion. When validating a BST, it is insufficient to only compare a node with its immediate children; we must pass valid lower and upper boundary constraints down the recursion tree. In-order traversal visits BST elements in ascending sorted order in $O(n)$ time."*

---

## 11. Practice Problems

### 1. Validate Binary Search Tree - Medium
Given the `root` of a binary tree, determine if it is a valid binary search tree (BST). A valid BST is defined as follows: the left subtree of a node contains only nodes with keys strictly less than the node's key; the right subtree of a node contains only nodes with keys strictly greater than the node's key; both the left and right subtrees must also be binary search trees.
- **Input:** `root = [2,1,3]`
- **Expected Output:** `true`
- **Input:** `root = [5,1,4,null,null,3,6]`
- **Expected Output:** `false`

### 2. Lowest Common Ancestor of a BST - Medium
Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes `p` and `q` in the BST.
- **Input:** `root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8`
- **Expected Output:** `6`
- **Input:** `root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 4`
- **Expected Output:** `2`
- **Input:** `root = [2,1], p = 2, q = 1`
- **Expected Output:** `2`

### 3. Kth Smallest Element in a BST - Medium
Given the `root` of a binary search tree, and an integer `k`, return the $k^{\text{th}}$ smallest value (1-indexed) of all the values of the nodes in the tree.
- **Input:** `root = [3,1,4,null,2], k = 1`
- **Expected Output:** `1`
- **Input:** `root = [5,3,6,2,4,null,null,1], k = 3`
- **Expected Output:** `3`

---

<nav aria-label="Lecture navigation">

[Previous: Binary Trees: BFS & Views](day-24-binary-trees-bfs-views-and-lca.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Graphs: BFS & DFS](day-26-graphs-bfs-shortest-path-and-dfs-components.md)

</nav>
