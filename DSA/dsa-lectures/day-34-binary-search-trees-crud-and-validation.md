# Day 34: Binary Search Trees: CRUD and Validation

<nav aria-label="Lecture navigation">

[Previous: Tree Depth, Diameter, and Path Sums](day-33-tree-depth-diameter-and-path-sums.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Lowest Common Ancestor and Tree Serialization](day-35-lowest-common-ancestor-and-serialization.md)

</nav>
## Prerequisites

- [Day 26: Binary Search Bounds and Intervals](day-26-binary-search-bounds-and-intervals.md) — Binary search comparison principles.
- [Day 31: Binary Tree Fundamentals and DFS](day-31-binary-tree-fundamentals-and-dfs.md) — Recursive and iterative In-Order traversals.
---

## 1. The Binary Search Tree Global Invariant

> **Binary Search Tree (BST)**: A binary tree where for every node, all keys in its left subtree are strictly smaller, and all keys in its right subtree are strictly larger.

A **Binary Search Tree (BST)** is an ordered hierarchical data structure where every node satisfies a strict global ordering constraint across its entire left and right subtrees:
$$\forall x \in \text{LeftSubtree}(N): \text{key}(x) < \text{key}(N)$$
$$\forall y \in \text{RightSubtree}(N): \text{key}(y) > \text{key}(N)$$

It is **not** sufficient for a node to be larger than its immediate left child and smaller than its immediate right child. It must be strictly larger than **all** nodes in its left subtree and strictly smaller than **all** nodes in its right subtree.

```text
Valid BST:                          INVALID BST (Subtree Violation):
        [ 10 ]                                   [ 10 ]
       /      \                                 /      \
    [ 5 ]    [ 15 ]                          [ 5 ]    [ 15 ]
   /    \        \                                   /      \
 [ 2 ]  [ 7 ]   [ 20 ]                            [ 6 ]    [ 20 ]
                                                    ▲
                             Node 6 is in the right subtree of 10,
                             but 6 < 10! Violates Global Invariant!
```

---

## 2. BST Search and Insertion in $O(h)$ Time

Because keys are partitioned, search and insertion discard half the remaining tree at each decision node:
- If `val === curr.val`: Target found.
- If `val < curr.val`: Recurse left: `curr = curr.left`.
- If `val > curr.val`: Recurse right: `curr = curr.right`.

```javascript
// Node.js code: BST Search and Insertion

class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function searchBST(root, val) {
  let curr = root;
  while (curr !== null) {
    if (curr.val === val) return curr;
    if (val < curr.val) curr = curr.left;
    else curr = curr.right;
  }
  return null;
}

function insertIntoBST(root, val) {
  if (!root) return new TreeNode(val);

  if (val < root.val) {
    root.left = insertIntoBST(root.left, val);
  } else if (val > root.val) {
    root.right = insertIntoBST(root.right, val);
  }

  return root; // Return unchanged pointer
}
```

---

## 3. BST Deletion: The Three Structural Cases

Deleting a node from a BST (LeetCode 450) must preserve the global ordering invariant. It breaks down into three distinct structural cases:

#### Case 1: The Node is a Leaf (`!left && !right`)
Simply return `null` to the caller, unlinking the node from its parent.

#### Case 2: The Node has One Child
Return the non-null child directly to the parent pointer, bypassing the deleted node.

#### Case 3: The Node has Two Children
1. Locate the **In-Order Successor**: the minimum node in the right subtree (`let succ = root.right; while (succ.left) succ = succ.left;`).
2. Overwrite `root.val = succ.val`.
3. Recursively delete the successor from the right subtree: `root.right = deleteNode(root.right, succ.val)`.

```text
Deleting Node [ 10 ] (Case 3: Two Children):
Initial Tree:                      Step 1: Replace 10 with Successor (12):
        [ 10 ]                                     [ 12 ]
       /      \                                   /      \
    [ 5 ]    [ 15 ]                            [ 5 ]    [ 15 ]
            /      \                                   /      \
         [ 12 ]   [ 20 ]       ==========>          [ 12 ]   [ 20 ]
                                                       │ (Delete old 12)
                                                       ▼
Final Tree:                                        [ 12 ]
                                                  /      \
                                               [ 5 ]    [ 15 ]
                                                           \
                                                           [ 20 ]
```

```javascript
// Node.js code: BST Deletion (LeetCode 450)

function deleteNode(root, key) {
  if (!root) return null;

  if (key < root.val) {
    root.left = deleteNode(root.left, key);
  } else if (key > root.val) {
    root.right = deleteNode(root.right, key);
  } else {
    // Found node to delete!
    // Cases 1 & 2: 0 or 1 child
    if (!root.left) return root.right;
    if (!root.right) return root.left;

    // Case 3: 2 children. Find in-order successor (min in right subtree)
    let successor = root.right;
    while (successor.left !== null) {
      successor = successor.left;
    }

    // Copy successor value
    root.val = successor.val;
    // Delete the successor from right subtree
    root.right = deleteNode(root.right, successor.val);
  }

  return root;
}
```

---

## 4. Validate Binary Search Tree: Why Local Checks Fail

A common interview mistake is checking only immediate child relationships:
```javascript
// ❌ BROKEN LOCAL CHECK:
if (root.left && root.left.val >= root.val) return false;
if (root.right && root.right.val <= root.val) return false;
```
This fails to catch deep subtree violations (e.g., node `6` in the right subtree of `10`).

#### The Boundary Propagation Pattern
Every node must fall within an open interval $(min, max)$:
- The root is bounded by $(-\infty, +\infty)$.
- Descending left narrows the upper bound: $(min, \text{node.val})$.
- Descending right narrows the lower bound: $(\text{node.val}, max)$.

```javascript
// Node.js code: Validate Binary Search Tree (LeetCode 98)

function isValidBST(root) {
  function validate(node, min, max) {
    if (!node) return true;

    // Strict inequalities: duplicates are invalid in standard BST
    if (min !== null && node.val <= min) return false;
    if (max !== null && node.val >= max) return false;

    // Propagate updated boundaries downward
    return (
      validate(node.left, min, node.val) &&
      validate(node.right, node.val, max)
    );
  }

  return validate(root, null, null);
}
```

---

## Detailed Node.js Relevance: B-Tree Indexing in PostgreSQL and MongoDB

In production Node.js applications querying databases (e.g., PostgreSQL with `pg` or MongoDB with `mongoose`), index lookups are powered by **B-Trees** (balanced multi-way search trees):

```text
Disk-Optimized B-Tree Index (PostgreSQL):
[ Page Header | Key: 100 | Key: 500 | Key: 1000 ]
      │               │              │
      ▼               ▼              ▼
[ Page < 100 ] [ Page 100-500 ] [ Page 500-1000 ]
```

- **Branching Factor**: While binary trees have at most 2 children per node, B-Trees feature branching factors of hundreds of keys per node, matching the operating system disk page size (typically 4 KB–16 KB).
- **Logarithmic Disk Seeks**: When a Node.js query executes `SELECT * FROM users WHERE age BETWEEN 20 AND 30`, the database engine navigates the B-Tree in $O(\log_B n)$ disk seeks rather than scanning millions of rows sequentially, returning records asynchronously to the Node.js event loop in under a millisecond.

---

## Tricky Points & Edge Cases

1. **Strict Inequality vs Duplicates**:
   Standard BST definitions require strictly less (`<`) and strictly greater (`>`). If duplicate values are inserted, the validation algorithm must return `false` unless the system explicitly defines left-or-right duplicate conventions.
2. **JavaScript 64-Bit Float Boundaries**:
   Using `Number.MIN_SAFE_INTEGER` or `Number.MAX_SAFE_INTEGER` as initial bounds fails if tree nodes contain values equal to those extremes. Using `null` guards (`min !== null && node.val <= min`) handles all 64-bit integer values safely.
3. **Degenerate Trees from Sorted Arrays**:
   Inserting an already-sorted array `[1, 2, 3, 4, 5]` into a naive BST produces a right-skewed list of height $n$. Self-balancing trees (AVL / Red-Black) apply pointer rotations to maintain $O(\log n)$ height.

---

## Hands-On Exercise

### Scenario: K-th Smallest Element in a BST (LeetCode 230)

Given the root of a binary search tree and an integer $k$, return the $k$-th smallest value (1-indexed) in the tree. Because an In-Order traversal of a BST produces a strictly increasing sequence, you should find the $k$-th element in $O(h + k)$ time without traversing the entire tree.

### Buggy Code

```javascript
// ❌ BUGGY: Traverses the entire tree into an array and sorts it unnecessarily
function buggyKthSmallest(root, k) {
  const vals = [];
  function dfs(node) {
    if (!node) return;
    vals.push(node.val);
    dfs(node.left);
    dfs(node.right);
  }
  dfs(root);
  vals.sort((a, b) => a - b); // Wastes O(n log n) time!
  return vals[k - 1];
}
```

### Acceptance Criteria

1. Solves the problem in $O(h + k)$ time complexity using iterative In-Order traversal.
2. Terminates immediately upon visiting the $k$-th node without touching remaining nodes.
3. Uses $O(h)$ auxiliary stack memory.
4. Verified with assertions testing left-heavy trees, balanced trees, and $k = 1$.

### Solution Code

```javascript
// Node.js code: K-th Smallest Element in BST (LeetCode 230)
const assert = require("assert");

function kthSmallest(root, k) {
  const stack = [];
  let curr = root;

  while (curr !== null || stack.length > 0) {
    // 1. Descend left as far as possible
    while (curr !== null) {
      stack.push(curr);
      curr = curr.left;
    }

    // 2. Process node in increasing sorted order
    curr = stack.pop();
    k--;

    // 3. Early termination: Found k-th smallest element!
    if (k === 0) {
      return curr.val;
    }

    // 4. Move to right subtree
    curr = curr.right;
  }

  return -1;
}

// Verification Tests
// Tree 1: [3, 1, 4, null, 2], k = 1 => 1
const t1 = new TreeNode(3, new TreeNode(1, null, new TreeNode(2)), new TreeNode(4));
assert.strictEqual(kthSmallest(t1, 1), 1);
assert.strictEqual(kthSmallest(t1, 2), 2);
assert.strictEqual(kthSmallest(t1, 3), 3);

// Tree 2: Single node
assert.strictEqual(kthSmallest(new TreeNode(42), 1), 42);

console.log("✅ All K-th Smallest Element assertions passed successfully.");
```

### Solution Explanation

1. **In-Order Monotonicity**: Because In-Order traversal visits nodes in strictly increasing order, popping $k$ times isolates the $k$-th smallest element directly.
2. **Early Termination**: Halting as soon as `k === 0` prevents traversing remaining branches, running in $O(h + k)$ time instead of full-tree $O(n)$ time.

---

## Summary

- **Global Invariant**: Left subtree $< \text{node.val} <$ Right subtree across all transitive descendants.
- **In-Order Traversal**: Always flattens a valid BST into a strictly increasing sorted sequence.
- **Deletion Cases**: Leaf returns null; single-child returns child; two-child replaces with in-order successor and deletes successor from right subtree.
- **Validation**: Propagate open interval bounds `(min, max)` downward across each frame; checking only immediate children fails deep violations.
- **B-Trees**: Relational database storage engines scale BST principles to multi-way pages to minimize disk I/O.

---

## Cheat Sheet & Common Pitfalls

### BST Core Templates
```javascript
// Validate BST
function validate(node, min, max) {
  if (!node) return true;
  if (min !== null && node.val <= min) return false;
  if (max !== null && node.val >= max) return false;
  return validate(node.left, min, node.val) && validate(node.right, node.val, max);
}

// In-Order Successor Deletion
let succ = root.right;
while (succ.left) succ = succ.left;
root.val = succ.val;
root.right = deleteNode(root.right, succ.val);
```

### Common Pitfalls

| Mistake | Consequence | Correct Pattern |
| :--- | :--- | :--- |
| **Local child check only** | Fails deep ancestor bounds in validation. | Propagate running `(min, max)` bounds. |
| **Permitting `<=` in validation** | Breaks strict binary search guarantees. | Enforce strict inequalities (`<` and `>`). |
| **Omitting parent return in delete** | Fails to rewire parent pointers. | Return updated subtree root to parent. |
| **Sorting full tree for K-th element** | Wastes $O(n \log n)$ time and memory. | Terminate In-Order traversal at $k$ steps. |

---

## Interview Questions

### 1. Why does In-Order traversal of a Binary Search Tree always yield values in ascending sorted order?

**Question:** Mathematically prove why an In-Order traversal ($L \to N \to R$) of a Binary Search Tree produces an array of values sorted in strictly increasing order.

**Answer:** 
The proof proceeds by structural induction on tree height:
1. **Base Case ($h = 0$, leaf node)**: An In-Order traversal of a single node visits its empty left child, processes `node.val`, and visits its empty right child, producing `[node.val]`, which is trivially sorted.
2. **Inductive Step**:
   - By the definition of a BST, for every node $N$:
     $$\forall x \in \text{LeftSubtree}(N): x < N < \forall y \in \text{RightSubtree}(N): y$$
   - By the induction hypothesis, In-Order traversal of `N.left` produces a sorted sequence $S_{\text{left}}$ where all values are $< N$.
   - By the induction hypothesis, In-Order traversal of `N.right` produces a sorted sequence $S_{\text{right}}$ where all values are $> N$.
   - In-Order traversal concatenates:
     $$S_{\text{left}} \circ [N] \circ S_{\text{right}}$$
   - Because every element in $S_{\text{left}} < N$ and $N <$ every element in $S_{\text{right}}$, the combined sequence is strictly increasing across the entire domain.

---

### 2. When deleting a node with two children, why is the In-Order Successor guaranteed to have at most one child?

> **In-Order Successor**: The node with the smallest value that is strictly greater than the current node's value (the leftmost node in its right subtree).

**Question:** In BST deletion, explain why the In-Order Successor (the smallest node in the right subtree) is mathematically guaranteed to have at most one child, and identify which child that can be.

**Answer:** 
The In-Order Successor is found by moving once to the right child (`root.right`) and then following left pointers until no further left child exists (`while (succ.left) succ = succ.left`).
- By construction, the successor node has **no left child** (`succ.left === null`). If it had a left child, that left child would be smaller than `succ`, contradicting the premise that `succ` is the minimum element in that subtree.
- Therefore, the successor can have at most one child: an optional **right child** (`succ.right`).
- Consequently, recursively deleting the successor node from the right subtree is trivial: it always falls into **Case 1** (leaf node) or **Case 2** (single child), never triggering a recursive two-child deletion.

---

### 3. What is the bug in this BST validation function, and what test case exposes it?

**Question:** Spot the algorithmic flaw in this validation function and provide a concrete binary tree test case that exposes it:
```javascript
function isValid(root) {
  if (!root) return true;
  if (root.left && root.left.val >= root.val) return false;
  if (root.right && root.right.val <= root.val) return false;
  return isValid(root.left) && isValid(root.right);
}
```

**Answer:** 
**Algorithmic Flaw**: The function performs only **local checks** between immediate parents and their direct children. It fails to enforce the global invariant that all nodes in a right subtree must be greater than all ancestral roots above them.

**Counter-Example**:
Consider tree:
```text
       10
      /  \
     5   15
        /  \
       6   20
```
- At root `10`: Left is `5` ($5 < 10$), Right is `15` ($15 > 10$) $\to$ local check passes.
- At node `15`: Left is `6` ($6 < 15$), Right is `20` ($20 > 15$) $\to$ local check passes.
- The function returns `true`.

**Why it fails**: Node `6` resides in the right subtree of root `10`. By the global BST invariant, all nodes in the right subtree must be $> 10$. Because $6 < 10$, this tree is completely invalid, but the code falsely marks it valid.

---

### 4. How does MongoDB's WiredTiger storage engine use B-Tree principles to handle high write/read throughput from Node.js drivers?

**Question:** Contrast the architectural design of in-memory Binary Search Trees with disk-based B-Trees used in database engines like MongoDB WiredTiger or PostgreSQL.

**Answer:** 
1. **Branching Factor & Disk Block Alignment**:
   - A standard BST has a branching factor of 2. For $10^9$ documents, height is $\approx 30$. Storing this on disk would require 30 sequential disk seek operations per read, causing severe I/O bottlenecks.
   - B-Trees have branching factors of hundreds to thousands of keys per node, matching operating system page sizes (e.g., 4 KB to 64 KB). For $10^9$ documents, B-Tree height is only 3 to 4 levels.
2. **Cache-Line Efficiency in Memory**:
   - B-Tree pages are stored contiguously in memory buffers, maximizing CPU L1/L2 cache prefetching when searching inside a page.
3. **Concurrency and Node.js Drivers**:
   - WiredTiger uses multi-version concurrency control (MVCC) and latch-free in-memory skip lists/B-Trees. When Node.js dispatches asynchronous queries, WiredTiger locates indexed document pointers with at most 3–4 cached page inspections, completing queries in microseconds without stalling Node.js socket pools.

---

<nav aria-label="Lecture navigation">

[Previous: Tree Depth, Diameter, and Path Sums](day-33-tree-depth-diameter-and-path-sums.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Lowest Common Ancestor and Tree Serialization](day-35-lowest-common-ancestor-and-serialization.md)

</nav>
