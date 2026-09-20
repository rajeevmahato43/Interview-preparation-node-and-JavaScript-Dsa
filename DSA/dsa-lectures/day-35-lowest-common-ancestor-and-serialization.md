# Day 35: Lowest Common Ancestor and Tree Serialization

## 1. Learning Outcomes
- Understand the definition and properties of the **Lowest Common Ancestor (LCA)** in trees.
- Implement LCA in a general Binary Tree using bottom-up post-order DFS in $O(n)$ time.
- Implement LCA in a Binary Search Tree (BST) exploiting key ordering in $O(h)$ time and $O(1)$ space.
- Master **Tree Serialization and Deserialization** (converting node graphs to flat strings and reconstructing them).
- Analyze data serialization tradeoffs in Node.js: JSON vs. string delimiters, binary buffers, and IPC transmission overhead.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 31 (Tree DFS), Day 32 (Tree BFS), Day 34 (BST CRUD & Validation).
- **Navigation**:
  - [Previous: Day 34 - Binary Search Trees: CRUD & Validation](day-34-binary-search-trees-crud-and-validation.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 36 - Graph Representations and Modeling](day-36-graph-representations-and-modeling.md)

---

## 3. Core Concepts & Mental Models
The **Lowest Common Ancestor (LCA)** of two nodes $p$ and $q$ is defined as the deepest node in tree $T$ that has both $p$ and $q$ as descendants (where a node can be a descendant of itself).

```text
Lowest Common Ancestor:
         [3]
       /     \
     [5]     [1]
    /   \   /   \
  [6]   [2] [0]  [8]
       /   \
     [7]   [4]

LCA of 5 and 1: [3]  (Splits into left and right subtrees)
LCA of 5 and 4: [5]  (5 is an ancestor of 4; a node is an ancestor of itself)
```

### Tree Serialization Mental Model
Because trees are non-linear, a flat array or string can only be unambiguously deserialized if null pointers (empty children) are explicitly encoded:
```text
Tree: [1, 2, 3, null, null, 4, 5]
Pre-order String: "1,2,#,#,3,4,#,#,5,#,#" (where '#' represents null)
```

---

## 4. Detailed Technical Explanations

### 4.1 LCA in Binary Search Tree vs. General Binary Tree
- **In a BST**: If both $p$ and $q$ values are smaller than `curr.val`, LCA must be in the left subtree. If both are larger, LCA must be in the right subtree. The very first node where $p$ and $q$ split (one $\le$ and one $\ge$), or where `curr` matches $p$ or $q$, is the LCA! This requires zero full-tree traversal ($O(h)$ time, $O(1)$ space).
- **In a General Tree**: We must search both subtrees bottom-up. If left returns non-null and right returns non-null, current node is the LCA. If only one returns non-null, propagate that non-null node upwards.

### 4.2 Serialization Strategies: Pre-Order vs. Level-Order
1. **Pre-order DFS**: Root is always first token. When deserializing, read tokens sequentially using an iterator or array queue; if token is `#`, return null, otherwise construct node and recurse for left and right.
2. **Level-order BFS**: Uses standard queue. Natural mapping to standard LeetCode array representation.

### 4.3 Node.js Relevance: Serialization Across Processes & Redis
In Node.js clustering and microservice architectures, complex data structures cannot share memory across processes. They must be serialized into JSON, Protocol Buffers, or delimiter-separated strings to be cached in Redis or transferred over Unix sockets. Explicit serialization algorithms prevent circular reference errors and minimize payload sizes.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 LCA in General Binary Tree (LeetCode 236)
```javascript
class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

/**
 * Finds LCA of p and q in general binary tree.
 * Time Complexity: O(n)
 * Space Complexity: O(h) recursion stack
 */
function lowestCommonAncestor(root, p, q) {
  // Base case: hit null, or found one of the targets
  if (!root || root === p || root === q) {
    return root;
  }

  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);

  // If p and q found in opposite subtrees, current node is LCA
  if (left !== null && right !== null) {
    return root;
  }

  // Otherwise return whichever subtree found a target
  return left !== null ? left : right;
}
```

### 5.2 LCA in Binary Search Tree (LeetCode 235)
```javascript
/**
 * Finds LCA in BST using key comparisons.
 * Time Complexity: O(h)
 * Space Complexity: O(1) iterative
 */
function lowestCommonAncestorBST(root, p, q) {
  let curr = root;

  while (curr !== null) {
    if (p.val < curr.val && q.val < curr.val) {
      curr = curr.left; // Both targets in left subtree
    } else if (p.val > curr.val && q.val > curr.val) {
      curr = curr.right; // Both targets in right subtree
    } else {
      return curr; // Split point or direct match: this is LCA!
    }
  }

  return null;
}
```

### 5.3 Serialize and Deserialize Binary Tree (LeetCode 297)
```javascript
/**
 * Serializes tree to a single string using Pre-Order DFS.
 */
function serialize(root) {
  const tokens = [];

  function buildString(node) {
    if (!node) {
      tokens.push('#');
      return;
    }
    tokens.push(node.val);
    buildString(node.left);
    buildString(node.right);
  }

  buildString(root);
  return tokens.join(',');
}

/**
 * Deserializes string back to binary tree.
 */
function deserialize(data) {
  const tokens = data.split(',');
  let index = 0;

  function buildTree() {
    if (index >= tokens.length) return null;

    const val = tokens[index++];
    if (val === '#') return null;

    const node = new TreeNode(Number(val));
    node.left = buildTree();
    node.right = buildTree();
    return node;
  }

  return buildTree();
}
```

### 5.4 Execution Trace: BST LCA on `p = 2`, `q = 8`
```text
Tree: Root is 6. Left subtree: [2, 0, 4]. Right subtree: [8, 7, 9].
curr = 6:
  p.val = 2 (< 6), q.val = 8 (> 6)
  Condition: p and q split on opposite sides of 6.
  Return 6 immediately!
Total comparisons: 1 step! Time: O(1).
```

---

## 6. Common Mistakes & Anti-Patterns
- **Searching BST Like a General Tree**: Using $O(n)$ full DFS traversal for BST LCA wastes the BST ordering invariant; BST LCA runs in $O(h)$ without visiting irrelevant subtrees.
- **Missing Null Delimiters in Serialization**: Attempting to deserialize a tree without null markers `#` creates ambiguity because multiple distinct tree topologies produce identical pre-order number sequences.
- **Using `Array.shift()` in Deserialization**: Calling `tokens.shift()` while deserializing creates $O(N^2)$ execution time due to repeated array element reindexing. Use an incremental pointer `let index = 0`.

---

## 7. Tricky Points & Edge Cases
- **Node as Its Own Ancestor**: If $p$ is the parent of $q$, LCA is $p$. The general tree algorithm returns $p$ immediately when `root === p` without needing to search below $p$, because $q$ is either in $p$'s subtree or not.
- **Nodes Not Present in Tree**: Standard LCA assumes both $p$ and $q$ exist in the tree. If one or both might be absent, a two-pass verification or counter must verify both targets were actually discovered.
- **Delimiter Collisions**: When serializing trees with string values, ensure the delimiter (e.g., `,`) does not collide with node values.

---

## 8. Practical Engineering Exercises
1. Implement serialization and deserialization using BFS Level-Order traversal with a queue.
2. Extend the general LCA function to return `null` if either node $p$ or node $q$ does not exist in the tree.

---

## 9. Key Takeaways & Summary
- LCA is the highest shared ancestor where paths to $p$ and $q$ diverge.
- BST LCA checks values against `curr.val` to branch left, branch right, or identify the split point in $O(h)$ time and $O(1)$ space.
- General Binary Tree LCA uses post-order DFS, identifying the node where left and right subtrees both return non-null.
- Tree serialization requires explicit encoding of null children (`#`) to uniquely reconstruct topology.

---

## 10. Quick Reference Cheat Sheet
| Task | Tree Type | Algorithm | Time | Auxiliary Space |
| :--- | :--- | :--- | :--- | :--- |
| **LCA** | BST | Value split comparison | $O(h)$ | $O(1)$ |
| **LCA** | General Binary Tree | Post-order DFS | $O(n)$ | $O(h)$ |
| **Serialize** | Any | Pre-order DFS with `#` | $O(n)$ | $O(n)$ |
| **Deserialize** | Any | Pointer-based Pre-order recursion | $O(n)$ | $O(n)$ |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: Why does tree deserialization require explicit null markers, whereas array sorting does not?  
**Hint**: Consider whether the shape of a tree is uniquely determined by node values alone.  
**Expected Answer Shape**: Different tree structures can produce identical node sequences. For example, a left-skewed tree `[2 -> 1]` and a right-skewed tree `[2 -> 1]` both have pre-order `[2, 1]`. By including explicit null markers (`[2, 1, #, #, #]` vs. `[2, #, 1, #, #]`), the degree and branch terminations of every node are strictly defined, enabling unique topological reconstruction.

### 2. Code-Writing
**Question**: Write an iterative $O(1)$ auxiliary space solution for LCA in a Binary Search Tree.  
**Hint**: While loop updating `curr` pointer based on `curr.val`.  
**Expected Answer Shape**: While `curr`: if `p.val < curr.val && q.val < curr.val`, `curr = curr.left`. Else if `p.val > curr.val && q.val > curr.val`, `curr = curr.right`. Else return `curr`. Returns in $O(h)$ time and $O(1)$ space.

### 3. Debugging
**Question**: Identify the performance flaw in this deserializer:  
```javascript
function deserialize(data) {
  const list = data.split(',');
  function helper() {
    const val = list.shift();
    if (val === '#') return null;
    const node = new TreeNode(Number(val));
    node.left = helper();
    node.right = helper();
    return node;
  }
  return helper();
}
```  
**Hint**: What is the time complexity of `Array.prototype.shift()` in V8?  
**Expected Answer Shape**: In JavaScript, `Array.prototype.shift()` is an $O(k)$ operation because it reindexes all subsequent array elements. Calling `shift()` $N$ times leads to $O(N^2)$ deserialization time. Fix by replacing `shift()` with a tracking index pointer (`let i = 0; const val = list[i++];`) to achieve optimal $O(N)$ time.

### 4. System Design / Tradeoff
**Question**: You need to cache millions of tree structures in Redis from Node.js services. Would you store them as serialized strings or nested JSON objects, and how would you optimize memory?  
**Hint**: Consider JSON verbosity vs. compact delimited strings vs. Protocol Buffers.  
**Expected Answer Shape**: Standard JSON includes repeated keys (`"val"`, `"left"`, `"right"`), inflating memory 5–10x. Serializing into compact delimiter-separated strings (e.g., `1,2,#,#,3`) or binary Buffers (using Node.js `Buffer.alloc` with packed 32-bit integers) dramatically shrinks Redis memory footprints and speeds up network transmission across the Node.js event loop.

### 5. Tricky / Edge Case
**Question**: In general binary tree LCA, what happens if node $p$ is in the tree but node $q$ is completely absent? What does the standard algorithm return, and how do you fix it?  
**Hint**: What does the function return when `root === p`?  
**Expected Answer Shape**: The standard algorithm returns node $p$, falsely reporting it as LCA because it terminates search down that branch upon discovering $p$. To fix this, either perform a preliminary existence check or maintain a counter during traversal that ensures both $p$ and $q$ were visited before confirming the LCA result.

### 6. Real-World Node.js Context
**Question**: In a multi-tenant Node.js backend using nested organization unit (OU) trees, how does LCA resolve permission inheritance?  
**Hint**: Finding the nearest common managerial unit for two users.  
**Expected Answer Shape**: When two users from different departments attempt to collaborate on a restricted resource, their permissions are governed by their Lowest Common Ancestor organization node. Computing LCA identifies the shared administrative parent node, allowing the Node.js authorization service to verify if the actor has managerial delegation rights over both entities.
