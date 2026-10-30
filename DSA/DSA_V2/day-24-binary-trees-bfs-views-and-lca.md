# Day 24: Binary Trees: BFS, Views & LCA

<nav aria-label="Lecture navigation">

[Previous: Binary Trees: DFS & Properties](day-23-binary-trees-dfs-and-properties.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search Trees](day-25-binary-search-trees-crud-and-validation.md)

</nav>

## 1. Binary Tree BFS & Views Core Concepts

While Depth-First Search (DFS) traverses deep down a single branch before backtracking, Breadth-First Search (BFS)—also known as Level-Order Traversal—explores nodes horizontally, level by level, from top to bottom and left to right.

BFS guarantees that every node at depth $d$ is visited strictly before any node at depth $d + 1$. This property makes BFS the standard approach for finding shortest paths in unweighted trees, determining minimum tree depths, and capturing directional tree views (e.g., viewing a tree from its right or left facade).

- **Level-Order BFS:** Visiting nodes layer by layer using a First-In, First-Out (FIFO) queue.
- **Tree View:** The set of visible nodes observed when looking at a tree structure from a specific vantage point (Right View, Left View, Top View).
- **Lowest Common Ancestor (LCA):** The deepest node in a tree that has both target nodes $p$ and $q$ as descendants (where a node can be a descendant of itself).

Imagine an apartment building. In Level-Order BFS, a building inspector inspects Floor 0 (the penthouse), then Floor 1, then Floor 2, checking every room on a floor before taking the stairs down. In Right-Side View, an observer stands on the sidewalk looking at the right facade of the building at dusk. On each floor, only the rightmost room's window is visible; inner rooms and leftmost rooms are blocked from view by the rightmost room.

```javascript
// Definition of a standard Binary Tree Node
class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// Basic Level-Order Traversal using an advancing-pointer queue
function levelOrderBasic(root) {
  if (!root) return [];

  const result = [];
  const queue = [root];
  let head = 0; // O(1) read pointer to avoid O(N) array.shift() re-indexing

  while (head < queue.length) {
    const levelSize = queue.length - head; // Freeze level size
    const currentLevel = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue[head++];
      currentLevel.push(node.val);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(currentLevel);
  }

  return result;
}

const sampleTree = new TreeNode(3,
  new TreeNode(9),
  new TreeNode(20, new TreeNode(15), new TreeNode(7))
);

console.log("Level-Order:", levelOrderBasic(sampleTree));
// Output: [ [ 3 ], [ 9, 20 ], [ 15, 7 ] ]
```

### 1.1 The Level-Order BFS Pattern and Frozen Size

The defining mechanic of level-order BFS is freezing the queue length at the start of each level:
```javascript
const levelSize = queue.length - head;
```
Because child nodes are pushed to the back of the queue as parents are processed, without snapshotting `levelSize`, the loop would not know where the current depth ends and the next depth begins. Freezing `levelSize` isolates depth layers cleanly.

> [!NOTE]
> Why is `queue.shift()` considered an anti-pattern in Node.js interviews? Because `shift()` re-indexes every remaining element in the array, turning an $O(N)$ traversal into a quadratic $O(N^2)$ algorithm for large inputs. Using an advancing `head` pointer provides true $O(1)$ dequeues.

### 1.2 Lowest Common Ancestor Mechanics

In a general binary tree, finding the Lowest Common Ancestor (LCA) of nodes $p$ and $q$ uses a bottom-up post-order search:

```text
LCA Decision Matrix at Node u:
        u
       / \
    left  right

Case 1: left != null && right != null  ==> Node u is the point of divergence (LCA!)
Case 2: left != null && right == null  ==> Targets reside in left subtree (bubble left up)
Case 3: left == null && right != null  ==> Targets reside in right subtree (bubble right up)
Case 4: left == null && right == null  ==> Neither target found below (return null)
```

If the current node matches $p$ or $q$, it returns itself upward. When a parent receives non-null returns from both its left and right subtrees, that parent is the LCA.

### 1.3 Operations Reference Table

| Algorithm / Pattern | Primary Data Structure | Traversal Direction | Time Complexity | Auxiliary Space |
| :--- | :--- | :--- | :--- | :--- |
| **Level-Order Traversal** | Queue with `head` pointer | Horizontal (Level-by-Level) | $O(N)$ | $O(W)$ ($W \le N/2$) |
| **Right Side View (BFS)**| Queue with boundary check | Level-by-Level | $O(N)$ | $O(W)$ queue width |
| **Right Side View (DFS)**| Call stack with depth track| Root $\to$ Right $\to$ Left | $O(N)$ | $O(H)$ tree height |
| **LCA (Generic Binary Tree)**| Call stack (Post-Order) | Bottom-Up | $O(N)$ | $O(H)$ stack frames |
| **LCA (Binary Search Tree)** | Pointer iteration | Directional comparison | $O(H)$ | $O(1)$ auxiliary |

---

## 2. Tree BFS and View Patterns

### 2.1 Pattern Family

Tree BFS and directional view problems fall into three main operational patterns:

- **Level-by-Level Queue Processing:** Grouping nodes strictly by depth using frozen `levelSize` snapshots.
- **Directional Perimeter Views:** Extracting exterior nodes of a tree (e.g. rightmost or leftmost elements) either via BFS level boundaries or depth-indexed DFS.
- **Ancestral Divergence Tracking (LCA):** Identifying the deepest node from which two target nodes branch out.

### 2.2 Pattern Recognition Table

| Problem Keyword Signal | Underlying Problem Need | Recommended Approach |
| :--- | :--- | :--- |
| "Return values level by level" | Group nodes by their depth layer | BFS with frozen `levelSize` snapshot |
| "Minimum depth to nearest leaf" | Shortest path from root | BFS (terminates at very first leaf) |
| "Right side view / Left side view" | Extract boundary node on each level | BFS boundary check or Depth DFS |
| "Zigzag / Spiral level order" | Alternate left-to-right and right-to-left | BFS with level array index placement |
| "Lowest common ancestor in binary tree" | Deepest shared parent node | Bottom-Up Post-Order DFS |
| "Lowest common ancestor in BST" | Exploit sorted value ordering | $O(H)$ iterative value comparison |

### 2.3 When to Use vs When NOT to Use

- **Use Tree BFS when:**
  - You need to process nodes level by level or group them by depth.
  - You need the shortest distance to a leaf node (BFS finds it first without exploring deeper paths).
- **When NOT to use Tree BFS:**
  - Finding maximum depth or tree diameter. DFS is more direct and uses less memory on wide trees.
  - Memory is strictly limited on very wide trees. In a balanced tree of $10^6$ nodes, BFS holds $500,000$ nodes in memory at the leaf level, whereas DFS holds only $\approx 20$ stack frames.

### 2.4 The 10^7 Operations Rule

Both BFS and DFS visit each node once, taking $O(N)$ operations. For $N = 100,000$, an $O(N)$ traversal takes roughly 10 milliseconds. However, using `array.shift()` inside a BFS loop on 100,000 items takes $\sum_{i=1}^{100,000} i \approx 5 \times 10^9$ operations, freezing the Node.js event loop for several seconds. Always use pointer-based or circular queues.

---

## 3. Problem Walkthroughs

### 3.1 Binary Tree Level Order Traversal

#### 3.1.1 Problem Statement
Given the `root` of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level).

- **Input:** `root = [3, 9, 20, null, null, 15, 7]`
- **Output:** `[[3], [9, 20], [15, 7]]`
- **Constraints:** $0 \le \text{number of nodes} \le 2,000$, $-1,000 \le Node.val \le 1,000$.

#### 3.1.2 How to Think About It
Imagine a company directory organized by management tier. You place the CEO in a waiting line. When you process the CEO, you note their name on the Tier 0 list and invite their direct reports into the line. You then process all direct reports, noting their names on the Tier 1 list and inviting their subordinates. Each tier is completed before the next tier begins.

#### 3.1.3 Brute Force Approach & Bottleneck
The naive approach uses an array as a queue and calls `queue.shift()` to dequeue each element:

```javascript
function levelOrderNaive(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    const size = queue.length;
    const level = [];
    for (let i = 0; i < size; i++) {
      const node = queue.shift(); // O(N) shift operation!
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}
```

The bottleneck is `queue.shift()`. Every call shifts all remaining elements in the array to the left in memory, turning an $O(N)$ algorithm into an $O(N^2)$ operation on larger inputs.

#### 3.1.4 The Pattern Insight
Maintain an integer pointer `let head = 0` to track the current queue index. Accessing `queue[head++]` runs in $O(1)$ time without shifting elements. At each level, the number of nodes belonging to that level is `queue.length - head`.

#### 3.1.5 Pseudocode
```text
function levelOrder(root):
    if root is null: return []
    result = []
    queue = [root]
    head = 0

    while head < queue.length:
        levelSize = queue.length - head
        currentLevel = []
        for i from 0 to levelSize - 1:
            node = queue[head++]
            currentLevel.push(node.val)
            if node.left: queue.push(node.left)
            if node.right: queue.push(node.right)
        result.push(currentLevel)

    return result
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(N) Level Order Traversal with Index Pointer Queue
function levelOrder(root) {
  if (!root) return [];

  const result = [];
  const queue = [root];
  let head = 0; // O(1) dequeue pointer

  while (head < queue.length) {
    const levelSize = queue.length - head; // Snapshot current level size
    const currentLevel = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue[head++];
      currentLevel.push(node.val);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(currentLevel);
  }

  return result;
}

const testTree = new TreeNode(3,
  new TreeNode(9),
  new TreeNode(20, new TreeNode(15), new TreeNode(7))
);

console.log("Level Order:", levelOrder(testTree));
// Output: [ [ 3 ], [ 9, 20 ], [ 15, 7 ] ]
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Using queue.length directly in loop condition
for (let i = 0; i < queue.length; i++) {
  // queue.length expands when children are pushed!
  // Mixing parent and child levels corrupts level groupings.
}
```

Because `queue.length` changes as children are enqueued, failing to snapshot `levelSize` upfront causes all nodes across all depths to merge into a single flat array.

#### 3.1.8 Complexity Derivation
- **Time Complexity:** $O(N)$. Every node is pushed and dequeued exactly once.
- **Auxiliary Space Complexity:** $O(N)$ for the queue array and result containers. The maximum number of nodes in the queue corresponds to the maximum width of the tree, which is $\lceil N/2 \rceil$ for a balanced binary tree.

---

### 3.2 Binary Tree Right Side View

#### 3.2.1 Problem Statement
Given the `root` of a binary tree, imagine standing on the right side of it. Return the values of the nodes you can see ordered from top to bottom.

- **Input:** `root = [1, 2, 3, null, 5, null, 4]`
- **Output:** `[1, 3, 4]`
- **Constraints:** $0 \le \text{number of nodes} \le 100$, $-100 \le Node.val \le 100$.

#### 3.2.2 How to Think About It
Imagine a building where you view the right side. On each floor, you only see the rightmost room with an outside window. If a floor's right wing has no rooms, a room in the left wing on that floor becomes visible because nothing blocks it from the right.

#### 3.2.3 Brute Force Approach & Bottleneck
Run a full level-order traversal, collecting every node on each level into sub-arrays, then extract the last element from each sub-array:

```javascript
function rightSideViewNaive(root) {
  if (!root) return [];
  const levels = levelOrder(root);
  return levels.map(level => level[level.length - 1]);
}
```

While correct, collecting and allocating arrays for all nodes when only one node per level is needed wastes heap memory.

#### 3.2.4 The Pattern Insight
We can solve this using two clean approaches:
1. **BFS with Boundary Extraction:** In a level-order traversal, the node where `i === levelSize - 1` is the rightmost node of that level. Push only that value to `result`.
2. **Right-First DFS:** Traverse in `Root -> Right -> Left` order, tracking `depth`. If `depth === result.length`, this is the first time we have reached this depth. Because we visit right children before left children, this node is guaranteed to be the rightmost visible node.

#### 3.2.5 Pseudocode
```text
function rightSideViewDFS(root):
    result = []
    function dfs(node, depth):
        if node is null: return
        if depth == result.length:
            result.push(node.val)
        dfs(node.right, depth + 1) // right first
        dfs(node.left, depth + 1)

    dfs(root, 0)
    return result
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal Right-First DFS (O(H) Auxiliary Space)
function rightSideView(root) {
  const result = [];

  function dfs(node, depth) {
    if (!node) return;

    // If visiting this depth for the first time, this is the rightmost node
    if (depth === result.length) {
      result.push(node.val);
    }

    // Traverse right child first, then left child
    dfs(node.right, depth + 1);
    dfs(node.left, depth + 1);
  }

  dfs(root, 0);
  return result;
}

const tree = new TreeNode(1,
  new TreeNode(2, null, new TreeNode(5)),
  new TreeNode(3, null, new TreeNode(4))
);

console.log("Right Side View:", rightSideView(tree));
// Output: [ 1, 3, 4 ]
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Merely following right pointers
let curr = root;
while (curr) {
  result.push(curr.val);
  curr = curr.right; // FAILS when left subtree is deeper than right subtree!
}
```

If the right subtree ends at depth 1 but the left subtree extends to depth 5, merely following right pointers misses the deeper left-subtree nodes that are visible from the right side.

#### 3.2.8 Complexity Derivation
- **Time Complexity:** $O(N)$ strictly. Every node is visited once.
- **Auxiliary Space Complexity:** $O(H)$ for the call stack, where $H$ is the tree height ($O(\log N)$ balanced, $O(N)$ skewed).

---

### 3.3 Lowest Common Ancestor of a Binary Tree

#### 3.3.1 Problem Statement
Given a binary tree, find the lowest common ancestor (LCA) of two given nodes `p` and `q`. The lowest common ancestor is defined between two nodes `p` and `q` as the lowest node in $T$ that has both `p` and `q` as descendants (where a node can be a descendant of itself).

- **Input:** `root = [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4]`, `p = 5`, `q = 1`
- **Output:** `3`
- **Constraints:** Number of nodes is in range $[2, 10^5]$, all node values are unique, $p \neq q$, and both $p$ and $q$ exist in the tree.

#### 3.3.2 How to Think About It
Imagine tracing the family tree of two cousins. You trace the lineage of cousin $p$ up to the root, and the lineage of cousin $q$ up to the root. The lowest person where both family lines meet is their lowest common ancestor. If one person is the direct parent of the other, that parent is the ancestor.

#### 3.3.3 Brute Force Approach & Bottleneck
Find the path from the root to node $p$ (e.g. `[3, 5]`) and store it in an array. Find the path from the root to node $q$ (e.g. `[3, 1]`) and store it in an array. Compare both arrays element by element until they diverge. Storing paths takes two full traversals and allocates extra arrays on the heap.

#### 3.3.4 The Pattern Insight
Use a single bottom-up post-order traversal:
1. If `root === null || root === p || root === q`, return `root`.
2. Recurse into left and right subtrees: `left = lca(root.left, p, q)`, `right = lca(root.right, p, q)`.
3. If both `left` and `right` are non-null, $p$ and $q$ reside in different subtrees under `root`. Thus, `root` is their Lowest Common Ancestor!
4. If only one side is non-null, return that non-null node upward.

#### 3.3.5 Pseudocode
```text
function lowestCommonAncestor(root, p, q):
    if root is null or root == p or root == q:
        return root

    left = lowestCommonAncestor(root.left, p, q)
    right = lowestCommonAncestor(root.right, p, q)

    if left is not null and right is not null:
        return root

    return left if left is not null else right
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(N) Post-Order LCA Traversal
function lowestCommonAncestor(root, p, q) {
  // Base case: null or found target node
  if (!root || root === p || root === q) {
    return root;
  }

  // Post-order: search both subtrees
  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);

  // If both subtrees return non-null, current node is the point of divergence (LCA)
  if (left && right) {
    return root;
  }

  // Otherwise, bubble whichever node was found
  return left ? left : right;
}

const n7 = new TreeNode(7);
const n4 = new TreeNode(4);
const n2 = new TreeNode(2, n7, n4);
const n6 = new TreeNode(6);
const n5 = new TreeNode(5, n6, n2);
const n0 = new TreeNode(0);
const n8 = new TreeNode(8);
const n1 = new TreeNode(1, n0, n8);
const treeRoot = new TreeNode(3, n5, n1);

console.log("LCA of 5 and 1:", lowestCommonAncestor(treeRoot, n5, n1).val); // Output: 3
console.log("LCA of 5 and 4:", lowestCommonAncestor(treeRoot, n5, n4).val); // Output: 5
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Comparing node values instead of reference identities
if (root.val === p.val || root.val === q.val) {
  // If tree contains duplicate values or custom objects,
  // value comparisons return incorrect node references!
}
```

Always compare object references (`root === p`), not values, to ensure the correct instance is returned.

#### 3.3.8 Complexity Derivation
- **Time Complexity:** $O(N)$ in the worst case, as every node may be visited.
- **Auxiliary Space Complexity:** $O(H)$ for the call stack ($O(\log N)$ balanced, $O(N)$ skewed).

---

## 4. Tricky Edge Cases

- **Empty Tree:** Ensure `root === null` returns `[]` or `null` gracefully.
- **LCA Where Node is Descendant of Itself:** When $p$ is an ancestor of $q$, the algorithm encounters $p$ first and immediately returns $p$ without searching deeper. This is mathematically correct because $p$ contains $q$ in its subtree.
- **Left Subtree Deeper Than Right Subtree in Views:** In Right Side View, when the right subtree has fewer levels than the left, left-subtree nodes emerge into view on deeper levels.
- **Large Balanced Trees in BFS:** Peak memory in BFS occurs at the leaf level ($\lceil N/2 \rceil$ nodes in the queue). For large datasets, Right-First DFS is significantly more memory-efficient.

---

## 5. Summary Cheat Sheet

- **Level-Order BFS:** Requires a FIFO queue and freezing `levelSize` at the start of each level.
- **Pointer Queue:** Use `let head = 0` and `queue[head++]` to avoid the $O(N^2)$ `shift()` performance trap.
- **Right Side View:** Can be solved with BFS by taking the last element at each level (`i === levelSize - 1`), or with Right-First DFS (`Root -> Right -> Left`) tracking depth.
- **Lowest Common Ancestor:** Post-order traversal where a node returns itself when matched. A node receiving non-null from both children is the LCA.

---

## 6. Practice Problems

### 6.1 Binary Tree Zigzag Level Order Traversal

- **Input:** `root = [3, 9, 20, null, null, 15, 7]`
- **Output:** `[[3], [20, 9], [15, 7]]`
- **Constraint:** $0 \le \text{number of nodes} \le 2,000$.
- **Hint 1:** Use standard level-order BFS with a boolean flag `leftToRight`.
- **Hint 2:** Enqueue children in standard left-to-right order.
- **Hint 3:** When filling the level array, place elements at `i` if `leftToRight` is true, or at `levelSize - 1 - i` if false.

### 6.2 Populating Next Right Pointers in Each Node

- **Input:** Perfect binary tree where each node has a `next` pointer initialized to `null`.
- **Output:** Populate each `next` pointer to point to its next right neighbor.
- **Constraint:** Solve with $O(1)$ auxiliary space.
- **Hint 1:** Use existing `next` pointers established on level $L$ to connect children on level $L + 1$.
- **Hint 2:** `node.left.next = node.right`.
- **Hint 3:** If `node.next` exists, `node.right.next = node.next.left`.

### 6.3 Lowest Common Ancestor of a Binary Search Tree

- **Input:** BST `root = [6, 2, 8, 0, 4, 7, 9]`, `p = 2`, `q = 8`
- **Output:** Node `6`
- **Constraint:** All node values are unique; $p \neq q$.
- **Hint 1:** Do not use general post-order search. Exploit BST value ordering.
- **Hint 2:** If both values are smaller than `root.val`, move to `root.left`.
- **Hint 3:** If both values are larger than `root.val`, move to `root.right`. Otherwise, `root` is the split point (LCA).

---

<nav aria-label="Lecture navigation">

[Previous: Binary Trees: DFS & Properties](day-23-binary-trees-dfs-and-properties.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search Trees](day-25-binary-search-trees-crud-and-validation.md)

</nav>
