# Day 25: Binary Search Trees: CRUD & Validation

<nav aria-label="Lecture navigation">

[Previous: Binary Trees: BFS & Views](day-24-binary-trees-bfs-views-and-lca.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Graphs: BFS & DFS](day-26-graphs-bfs-shortest-path-and-dfs-components.md)

</nav>

---

## 1. Binary Search Tree Fundamentals

A normal binary tree puts numbers wherever it wants without any order. A **Binary Search Tree (BST)** follows one strict rule that makes finding, adding, and deleting items run in fast $O(\log n)$ average time:

- **The Core BST Rule:** For every single node:
  1. Every number in its **left subtree** must be **strictly smaller** than the node's number.
  2. Every number in its **right subtree** must be **strictly larger** than the node's number.
  3. All subtrees below it must also follow these exact same rules.
- **Sorted Walk (In-Order):** Walking through a BST in In-Order (`Left -> Node -> Right`) visits numbers in sorted order, from smallest to biggest.

Imagine an alphabetical filing cabinet organized with drawers:
- The top main drawer is labeled "M".
- If you are looking for the letter "P", you know "P" comes after "M" in the alphabet. You immediately pull open the right drawer.
- You can completely ignore the left drawers ("A" through "L") without looking at a single folder inside!
- At the next drawer ("T"), "P" comes before "T", so you open the left side.
- You find "P" in just two steps instead of searching through the whole cabinet!
- This rule applies to the whole tree: a folder labeled "W" can never sit on the left side of "M", even if it is to the right of "F".

```javascript
// Definition of a Binary Tree Node
class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// Basic BST Search and Insert Operations
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

  let curr = root;
  while (true) {
    if (val < curr.val) {
      if (!curr.left) {
        curr.left = new TreeNode(val);
        break;
      }
      curr = curr.left;
    } else {
      if (!curr.right) {
        curr.right = new TreeNode(val);
        break;
      }
      curr = curr.right;
    }
  }

  return root;
}

const bst = new TreeNode(4, new TreeNode(2), new TreeNode(7));
insertIntoBST(bst, 5);
console.log("Search for 5 found:", searchBST(bst, 5) !== null); // Output: true
console.log("Search for 9 found:", searchBST(bst, 9) !== null); // Output: false
```

### 1.1 The Universal BST Invariant and In-Order Property

The most crucial property of a BST is that In-Order traversal produces values in sorted ascending sequence.

```text
Tree:
         [ 4 ]
        /     \
     [ 2 ]   [ 7 ]
    /    \   /
  [ 1 ] [ 3 ][ 5 ]

In-Order Walk (Left -> Root -> Right):
Visit 1 -> Visit 2 -> Visit 3 -> Visit 4 -> Visit 5 -> Visit 7
Result: [ 1, 2, 3, 4, 5, 7 ] (Strictly ascending!)
```

> [!NOTE]
> Self-Check: Why is checking only immediate children (`node.left.val < node.val && node.right.val > node.val`) not enough to prove a tree is a valid BST?
> Answer: Checking only immediate children misses rules set by ancestors higher up. A node deep down in the right subtree of 10 could be 6. Even if 6 is smaller than its parent 15, it still breaks the rule that everything under 10's right side must be greater than 10.

### 1.2 BST Deletion Cases

Deleting a node from a BST is trickier than inserting because we must keep the tree sorted. There are three cases:

- **Case 1 (No Children / Leaf Node):** The node has no children. Just remove it by setting the parent's pointer to `null`.
- **Case 2 (One Child):** The node has only one child. Bypass the node by connecting the parent directly to that single child.
- **Case 3 (Two Children):** The node has two subtrees. You cannot simply delete it without breaking the tree apart. Instead:
  1. Find the **In-Order Successor** (the smallest node in its right subtree).
  2. Copy that successor's number into the target node.
  3. Delete the successor node from the right subtree (since it was the smallest, it has at most one child, which is easy to delete).

```text
Deleting Node 5 (has two children: left subtree root 3, right subtree root 8):
        [ 5 ] <--- Target
       /     \
    [ 3 ]   [ 8 ]
           /     \
        [ 6 ]   [ 9 ]  <--- In-order successor is 6 (smallest in right subtree)

Step 1: Overwrite target's value with successor value 6:
        [ 6 ]
       /     \
    [ 3 ]   [ 8 ]
           /     \
        [ 6 ]   [ 9 ]

Step 2: Delete duplicate successor node 6 from right subtree:
        [ 6 ]
       /     \
    [ 3 ]   [ 8 ]
                 \
                [ 9 ]
Invariant preserved! In-order sequence remains: [ 3, 6, 8, 9 ]
```

### 1.3 Operations Reference Table

| Operation | Average Time Complexity | Worst-Case Time (Skewed) | Auxiliary Space Complexity |
| :--- | :--- | :--- | :--- |
| **Search** | $O(\log n)$ | $O(n)$ | $O(1)$ iterative |
| **Insert** | $O(\log n)$ | $O(n)$ | $O(1)$ iterative |
| **Delete** | $O(\log n)$ | $O(n)$ | $O(H)$ recursion stack |
| **Validation** | $O(n)$ | $O(n)$ | $O(H)$ stack |
| **K-th Smallest** | $O(H + k)$ | $O(n)$ | $O(H)$ stack |
| **LCA in BST** | $O(H)$ | $O(n)$ | $O(1)$ iterative |

---

## 2. Binary Search Tree Patterns

### 2.1 Pattern Family

BST problems divide into three primary architectural patterns:

- **Range Boundary Propagation (Validation):** Carry allowable $(min, max)$ intervals down the tree, narrowing boundaries on left and right turns.
- **In-Order Sequential Processing ($K$-th Rank):** Exploit the sorted property of in-order traversal, using an iterative stack with early exit once $k$ elements are reached.
- **Directional Descent (LCA & Search):** Compare query keys directly with current node values to make deterministic binary decisions without exploring both subtrees.

### 2.2 Pattern Recognition Table

| Problem Keyword Signal | Underlying BST Property | Recommended Approach |
| :--- | :--- | :--- |
| "Validate whether tree is a BST" | Every node must satisfy $(min, max)$ range | Range propagation DFS or In-Order check |
| "Find $K$-th smallest/largest element" | In-order sequence is sorted | Iterative in-order traversal with early exit |
| "Find lowest common ancestor in BST" | Divergence point where $p \le node \le q$ | $O(H)$ iterative value comparison |
| "Convert sorted array to balanced BST" | Middle element forms balanced root | Divide & conquer midpoint recursion |
| "Delete node in BST" | Maintain sorted invariant after removal | 3-case deletion with in-order successor |

### 2.3 When to Use vs When NOT to Use

- **Use BSTs when:**
  - You need dynamic ordered data with $O(\log n)$ average insertions, deletions, and lookups.
  - You need range queries (e.g. all values between 20 and 50).
  - You need order statistics ($K$-th minimum/maximum).
- **When NOT to use BSTs:**
  - You only need exact key-value lookups with no ordering requirements. Use a Hash Table (`Map`) for $O(1)$ average time.
  - Keys arrive in pre-sorted order. A naive BST becomes an $O(n)$ degenerate linked list. Use self-balancing trees (AVL or Red-Black).

### 2.4 The 10^7 Operations Rule

In a balanced BST with $N = 1,000,000$ nodes, the tree height is $H \approx \log_2(10^6) \approx 20$. Operations take roughly 20 steps, running in microseconds. However, if elements were inserted in sorted order without balancing, the tree height becomes $N = 1,000,000$. A linear search then takes $1,000,000$ operations, and recursion crashes with call stack overflow.

---

## 3. Problem Walkthroughs

### 3.1 Validate Binary Search Tree

#### 3.1.1 Problem Statement
Given the `root` of a binary tree, determine if it is a valid binary search tree (BST). A valid BST satisfies:
- The left subtree of a node contains only nodes with keys strictly less than the node's key.
- The right subtree of a node contains only nodes with keys strictly greater than the node's key.
- Both the left and right subtrees must also be binary search trees.

- **Input:** `root = [5, 1, 4, null, null, 3, 6]`
- **Output:** `false` (Node 4's left child is 3, but 4 is in the right subtree of 5, where 3 < 5 violates the root invariant).
- **Constraints:** $1 \le \text{number of nodes} \le 10^4$, $-2^{31} \le Node.val \le 2^{31} - 1$.

#### 3.1.2 How to Think About It
Imagine a club bouncer checking IDs. The main bouncer at the door (age 50) says: anyone going to the left room must be younger than 50. In that left room, another bouncer (age 30) says: anyone going to the right room must be older than 30. That means anyone entering that inner room must be between 30 and 50 years old. Checking only the nearest bouncer is not enough; you must satisfy all the limits set by every bouncer above you.

#### 3.1.3 Brute Force Approach & Bottleneck
Checking only immediate parent-child relationships locally:

```javascript
function isValidBSTLocal(root) {
  if (!root) return true;
  if (root.left && root.left.val >= root.val) return false;
  if (root.right && root.right.val <= root.val) return false;
  return isValidBSTLocal(root.left) && isValidBSTLocal(root.right);
}
```

The bottleneck is blindness to ancestor constraints. If node 6 is the left child of 15, it passes the local check $6 < 15$. But if 15 is in the right subtree of root 10, the value 6 violates the root constraint ($6 > 10$).

#### 3.1.4 The Pattern Insight
Pass allowable range boundaries `(low, high)` top-down:
- The root begins with range $(-\infty, +\infty)$.
- When traversing **left**, the upper bound becomes `node.val`: `(low, node.val)`.
- When traversing **right**, the lower bound becomes `node.val`: `(node.val, high)`.
If any node's value is $\le low$ or $\ge high$, return `false` immediately.

#### 3.1.5 Pseudocode
```text
function isValidBST(root):
    function validate(node, low, high):
        if node is null: return true
        if node.val <= low or node.val >= high:
            return false
        return validate(node.left, low, node.val) and
               validate(node.right, node.val, high)

    return validate(root, -Infinity, Infinity)
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal Top-Down Range Propagation
function isValidBST(root) {
  function validate(node, low, high) {
    if (!node) return true;

    // Strict inequality required
    if (node.val <= low || node.val >= high) {
      return false;
    }

    return (
      validate(node.left, low, node.val) &&
      validate(node.right, node.val, high)
    );
  }

  return validate(root, -Infinity, Infinity);
}

const validBST = new TreeNode(5,
  new TreeNode(3, new TreeNode(1), new TreeNode(4)),
  new TreeNode(8, new TreeNode(7), new TreeNode(9))
);

const invalidBST = new TreeNode(10,
  new TreeNode(5),
  new TreeNode(15, new TreeNode(6), new TreeNode(20))
);

console.log("Valid BST Check:", isValidBST(validBST));     // Output: true
console.log("Invalid BST Check:", isValidBST(invalidBST)); // Output: false
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Using Number.MIN_SAFE_INTEGER instead of -Infinity
validate(root, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
```

If a tree contains a node whose value equals `-2147483648` or `Number.MIN_SAFE_INTEGER`, using fixed integer constants triggers a false negative on the initial boundary check `node.val <= low`. Always use `-Infinity` and `Infinity`.

#### 3.1.8 Complexity Derivation
- **Time Complexity:** $O(N)$ strictly. Every node is visited at most once.
- **Auxiliary Space Complexity:** $O(H)$ for the call stack, where $H$ is the tree height ($O(\log N)$ balanced, $O(N)$ skewed).

---

### 3.2 Kth Smallest Element in a BST

#### 3.2.1 Problem Statement
Given the `root` of a binary search tree and an integer `k`, return the $k$-th smallest value (1-indexed) of all the node values in the tree.

- **Input:** `root = [3, 1, 4, null, 2]`, `k = 1`
- **Output:** `1`
- **Constraints:** $1 \le k \le \text{number of nodes} \le 10^4$, $0 \le Node.val \le 10^4$.

#### 3.2.2 How to Think About It
Because an In-Order traversal visits BST nodes in strictly ascending numerical order, the $1^{\text{st}}$ smallest element is the first node processed in an in-order walk, the $2^{\text{nd}}$ smallest is the second, and the $k$-th smallest is the $k$-th node processed. As soon as you process the $k$-th node, you can stop immediately without visiting the rest of the tree.

#### 3.2.3 Brute Force Approach & Bottleneck
Run a full recursive in-order traversal, store all values in an array, and access `arr[k - 1]`:

```javascript
function kthSmallestNaive(root, k) {
  const values = [];
  function inOrder(node) {
    if (!node) return;
    inOrder(node.left);
    values.push(node.val);
    inOrder(node.right);
  }
  inOrder(root);
  return values[k - 1];
}
```

The bottleneck is wasted work and memory. For a tree with $100,000$ nodes where $k = 1$, the naive approach visits all 100,000 nodes and allocates an array of 100,000 integers on the heap when only the first element was needed.

#### 3.2.4 The Pattern Insight
Use an iterative in-order traversal with an explicit stack:
1. Traverse as far left as possible, pushing nodes onto the stack.
2. Pop the top node (the current minimum unvisited node).
3. Decrement `k`. If `k === 0`, return `node.val` immediately.
4. Move to `node.right` and repeat.
Total nodes visited is bounded strictly to $H + k$.

#### 3.2.5 Pseudocode
```text
function kthSmallest(root, k):
    stack = []
    curr = root

    while curr is not null or stack is not empty:
        while curr is not null:
            stack.push(curr)
            curr = curr.left

        curr = stack.pop()
        k = k - 1
        if k == 0:
            return curr.val

        curr = curr.right

    return -1
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal Iterative In-Order Traversal with Early Exit
function kthSmallest(root, k) {
  const stack = [];
  let curr = root;
  let remaining = k;

  while (curr !== null || stack.length > 0) {
    // 1. Traverse left down to smallest available node
    while (curr !== null) {
      stack.push(curr);
      curr = curr.left;
    }

    // 2. Pop the current smallest element
    curr = stack.pop();
    remaining--;

    // 3. Early return when k-th smallest is reached
    if (remaining === 0) {
      return curr.val;
    }

    // 4. Move to right subtree
    curr = curr.right;
  }

  return -1;
}

const bstTree = new TreeNode(5,
  new TreeNode(3,
    new TreeNode(2, new TreeNode(1), null),
    new TreeNode(4)
  ),
  new TreeNode(6)
);

console.log("1st Smallest:", kthSmallest(bstTree, 1)); // Output: 1
console.log("3rd Smallest:", kthSmallest(bstTree, 3)); // Output: 3
console.log("5th Smallest:", kthSmallest(bstTree, 5)); // Output: 5
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Continuing traversal after k reaches 0
function badInOrder(node) {
  if (!node) return;
  badInOrder(node.left);
  count++;
  if (count === k) ans = node.val; // Keeps recursing unnecessarily!
  badInOrder(node.right);
}
```

Failing to terminate or return immediately forces the recursion to complete traversals across the entire remainder of the tree.

#### 3.2.8 Complexity Derivation
- **Time Complexity:** $O(H + k)$, where $H$ is the tree height. In a balanced BST, $H = \log_2 N$. Finding the $1^{\text{st}}$ smallest takes $O(\log N)$ time rather than $O(N)$.
- **Auxiliary Space Complexity:** $O(H)$ for the explicit stack.

---

### 3.3 Lowest Common Ancestor of a BST

#### 3.3.1 Problem Statement
Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes `p` and `q`.

- **Input:** `root = [6, 2, 8, 0, 4, 7, 9]`, `p = 2`, `q = 8`
- **Output:** `6`
- **Constraints:** Number of nodes is in range $[2, 10^5]$, all node values are unique, $p \neq q$, and both exist in the BST.

#### 3.3.2 How to Think About It
In a standard binary tree, you must search both subtrees because values are unordered. In a BST, the values themselves guide navigation:
- If both $p$ and $q$ are smaller than the current node, both must lie in the left subtree.
- If both $p$ and $q$ are larger than the current node, both must lie in the right subtree.
- If one is on the left and the other is on the right, or one equals the current node, the paths diverge here. The current node is their Lowest Common Ancestor.

#### 3.3.3 Brute Force Approach & Bottleneck
Using the generic binary tree post-order search:

```javascript
function lcaGeneric(root, p, q) {
  if (!root || root === p || root === q) return root;
  const left = lcaGeneric(root.left, p, q);
  const right = lcaGeneric(root.right, p, q);
  if (left && right) return root;
  return left ? left : right;
}
```

The generic approach ignores the BST sorted invariant, searching both branches in $O(N)$ time and allocating $O(H)$ call stack frames.

#### 3.3.4 The Pattern Insight
Use a simple iterative loop:
- If `p.val < curr.val && q.val < curr.val`, set `curr = curr.left`.
- If `p.val > curr.val && q.val > curr.val`, set `curr = curr.right`.
- Otherwise, return `curr`.
This runs in $O(H)$ time with $O(1)$ auxiliary space.

#### 3.3.5 Pseudocode
```text
function lowestCommonAncestor(root, p, q):
    curr = root
    while curr is not null:
        if p.val < curr.val and q.val < curr.val:
            curr = curr.left
        else if p.val > curr.val and q.val > curr.val:
            curr = curr.right
        else:
            return curr
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal Iterative O(H) BST LCA with O(1) Auxiliary Space
function lowestCommonAncestor(root, p, q) {
  let curr = root;

  while (curr !== null) {
    if (p.val < curr.val && q.val < curr.val) {
      curr = curr.left; // Both targets reside in left subtree
    } else if (p.val > curr.val && q.val > curr.val) {
      curr = curr.right; // Both targets reside in right subtree
    } else {
      // Divergence point found (or curr matches p or q)
      return curr;
    }
  }

  return null;
}

const n0 = new TreeNode(0);
const n4 = new TreeNode(4);
const n2 = new TreeNode(2, n0, n4);
const n7 = new TreeNode(7);
const n9 = new TreeNode(9);
const n8 = new TreeNode(8, n7, n9);
const bstRoot = new TreeNode(6, n2, n8);

console.log("LCA of 2 and 8:", lowestCommonAncestor(bstRoot, n2, n8).val); // Output: 6
console.log("LCA of 2 and 4:", lowestCommonAncestor(bstRoot, n2, n4).val); // Output: 2
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Unnecessary full tree post-order recursion
function badBSTLCA(root, p, q) {
  // Re-traversing subtrees without checking numerical bounds wastes O(N) operations
}
```

Writing full recursive DFS on a BST forfeits the $O(\log n)$ advantage of the BST invariant.

#### 3.3.8 Complexity Derivation
- **Time Complexity:** $O(H)$, where $H$ is the tree height ($O(\log N)$ average, $O(N)$ worst case).
- **Auxiliary Space Complexity:** $O(1)$ strictly, as the traversal is completely iterative without recursive call frames or stack arrays.

---

## 4. Tricky Edge Cases

- **32-Bit Integer Extremes:** When validating trees with values like $-2^{31}$ or $2^{31} - 1$, setting validation range bounds to `-2147483648` causes false rejections. Always use `-Infinity` and `Infinity`.
- **Duplicate Values in BST:** Standard BST definitions require strict inequality (`left.val < node.val < right.val`). If duplicate values are present, equality checks (`<=` vs `<`) must be applied consistently.
- **Degenerate Linked List Collapse:** Inserting presorted data into a naive BST produces an unbalanced tree of height $N$. Deletion, search, and insertion collapse to $O(n)$ time.
- **Deletion of Two-Child Node:** Deleting a node with two children requires identifying its in-order successor, copying the successor's value, and deleting the successor node from the right subtree.

---

## 5. Summary Cheat Sheet

- **BST Invariant:** For every node, all left subtree descendants are strictly smaller, and all right subtree descendants are strictly greater.
- **In-Order Traversal:** Yields values in strictly ascending numerical order.
- **Top-Down Validation:** Pass range boundaries `(low, high)` and update bounds on left and right turns.
- **Early Exit in $K$-th Smallest:** Use iterative stack-based in-order traversal to stop after visiting $k$ elements.
- **Iterative LCA in BST:** Navigate using value comparisons; the divergence point is the LCA in $O(H)$ time and $O(1)$ space.

---

## 6. Practice Problems

### 6.1 Delete Node in a BST

- **Input:** `root = [5, 3, 6, 2, 4, null, 7]`, `key = 3`
- **Output:** Valid BST with node 3 removed.
- **Constraint:** $0 \le \text{number of nodes} \le 10^4$.
- **Hint 1:** Search for the node using binary search comparison.
- **Hint 2:** If the node has 0 or 1 child, return the non-null child (or null).
- **Hint 3:** If the node has 2 children, replace its value with the minimum value of its right subtree (the in-order successor), then recursively delete that successor from the right subtree.

### 6.2 Convert Sorted Array to Balanced BST

- **Input:** `nums = [-10, -3, 0, 5, 9]`
- **Output:** Height-balanced BST `[0, -3, 9, -10, null, 5]`
- **Constraint:** $1 \le nums.length \le 10^4$.
- **Hint 1:** Use divide and conquer recursion.
- **Hint 2:** Pick `mid = Math.floor((left + right) / 2)` as the root node.
- **Hint 3:** Recurse on `(left, mid - 1)` for the left child and `(mid + 1, right)` for the right child.

### 6.3 Binary Search Tree Iterator

- **Input:** BST Root
- **Methods:** `next()` returns next smallest element; `hasNext()` returns boolean.
- **Constraint:** `next()` and `hasNext()` must run in $O(1)$ amortized time with $O(H)$ memory.
- **Hint 1:** Maintain an explicit stack of ancestor nodes.
- **Hint 2:** In the constructor, push all left children down to the leftmost leaf.
- **Hint 3:** In `next()`, pop the top node and push all left children of its right subtree.

---

<nav aria-label="Lecture navigation">

[Previous: Binary Trees: BFS & Views](day-24-binary-trees-bfs-views-and-lca.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Graphs: BFS & DFS](day-26-graphs-bfs-shortest-path-and-dfs-components.md)

</nav>
