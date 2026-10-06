# Day 35: Lowest Common Ancestor and Tree Serialization

<nav aria-label="Lecture navigation">

[Previous: Binary Search Trees: CRUD and Validation](day-34-binary-search-trees-crud-and-validation.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Graph Representations and Modeling](day-36-graph-representations-and-modeling.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Master the definition and structural properties of the **Lowest Common Ancestor (LCA)** in trees.
- Implement LCA in a general Binary Tree using bottom-up post-order DFS in $O(n)$ time.
- Implement LCA in a Binary Search Tree (BST) exploiting key ordering in $O(h)$ time and $O(1)$ space.
- Master **Binary Tree Serialization and Deserialization** (LeetCode 297) using Pre-Order encoding with explicit null markers.
- Eliminate $O(n^2)$ deserialization performance bugs by replacing `Array.shift()` with pointer-based index advancement.
- Evaluate tree serialization trade-offs in Node.js distributed architectures: JSON vs delimited strings vs binary Buffer packing in Redis.

---

## Prerequisites

- [Day 31: Binary Tree Fundamentals and DFS](day-31-binary-tree-fundamentals-and-dfs.md) — Pre-Order and Post-Order DFS mechanics.
- [Day 32: Level-Order Traversal (BFS) and Tree Views](day-32-level-order-traversal-bfs-and-views.md) — Level-order serialization mappings.
- [Day 34: Binary Search Trees: CRUD and Validation](day-34-binary-search-trees-crud-and-validation.md) — BST directional properties.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
| :--- | :--- | :--- |
| **Lowest Common Ancestor (LCA)** | The deepest node $T$ in a tree that has both nodes $p$ and $q$ as descendants (allowing a node to be a descendant of itself). | Solves hierarchical access control, organizational unit permissions, and network routing divergence points. |
| **Split Point** | In a BST, the unique node where $p$ and $q$ branch into opposite subtrees (or one equals the current node). | Identifies the LCA in a BST in $O(h)$ time without traversing irrelevant subtrees. |
| **Tree Serialization** | Converting a non-linear node graph into a flat linear string or binary buffer. | Essential for transmitting tree data structures across process boundaries, network sockets, and distributed caches. |
| **Explicit Null Sentinel** | Encoding missing children with a distinguished character (`'#'`) in the serialized stream. | Mandated to resolve topological ambiguity during deserialization. |
| **Pointer-Based Deserialization** | Advancing a scalar index through an array of tokens rather than invoking `Array.prototype.shift()`. | Eliminates $O(n^2)$ element copying during string reconstruction. |

---

## Core Concepts

### 1. Lowest Common Ancestor in General Binary Trees (LeetCode 236)

The **Lowest Common Ancestor (LCA)** of two nodes $p$ and $q$ in a general binary tree is the lowest node that contains both $p$ and $q$ within its descendant subtrees.

#### The Bottom-Up DFS Pattern
Using post-order traversal:
1. Base Case: If `root === null || root === p || root === q`, return `root`.
2. Recurse down `left` and `right` subtrees.
3. Decision Logic:
   - If both `left !== null` and `right !== null`: $p$ and $q$ were found in opposite subtrees. Therefore, **`root` is the LCA**!
   - If only one child returns non-null: Propagate that non-null node upwards to the caller.
   - If both are null: Return `null`.

```text
General Tree LCA:
             [ 3 ]             <-- LCA of 5 and 1 is 3 (left=5, right=1)
           /       \
        [ 5 ]     [ 1 ]
       /     \   /     \
     [ 6 ]   [ 2 ][ 0 ] [ 8 ]
            /   \
          [ 7 ] [ 4 ]          <-- LCA of 5 and 4 is 5 (5 is ancestor of 4)
```

```javascript
// Node.js code: LCA in General Binary Tree (LeetCode 236)

class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function lowestCommonAncestor(root, p, q) {
  // Base case: hit null or found one of the targets
  if (!root || root === p || root === q) {
    return root;
  }

  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);

  // If p and q were found in opposite subtrees, current root is the LCA
  if (left !== null && right !== null) {
    return root;
  }

  // Otherwise, return whichever subtree discovered a target
  return left !== null ? left : right;
}
```

---

### 2. LCA in Binary Search Trees: Exploiting Key Ordering (LeetCode 235)

In a **Binary Search Tree**, we do not need to search both subtrees. We can use key comparisons to identify the LCA in **$O(h)$ time and $O(1)$ space**:
- If both $p$ and $q$ values are smaller than `curr.val`: The LCA must reside strictly in the left subtree (`curr = curr.left`).
- If both $p$ and $q$ values are larger than `curr.val`: The LCA must reside strictly in the right subtree (`curr = curr.right`).
- **The Split Point**: The moment $p$ and $q$ diverge on opposite sides of `curr`, or when `curr` matches $p$ or $q$, **`curr` is guaranteed to be the LCA**!

```javascript
// Node.js code: LCA in BST in O(1) Auxiliary Space

function lowestCommonAncestorBST(root, p, q) {
  let curr = root;

  while (curr !== null) {
    if (p.val < curr.val && q.val < curr.val) {
      curr = curr.left; // Both targets in left subtree
    } else if (p.val > curr.val && q.val > curr.val) {
      curr = curr.right; // Both targets in right subtree
    } else {
      // Split point or exact match: found LCA!
      return curr;
    }
  }

  return null;
}
```

---

### 3. Binary Tree Serialization and Deserialization (LeetCode 297)

Serialization transforms a hierarchical node graph into a flat linear string. Deserialization reconstructs the original tree topology from that string.

#### Why Null Sentinels Are Mandatory
Without explicit null markers, multiple distinct tree topologies produce identical pre-order arrays:
```text
Tree A: [ 1 -> left: 2 ]  ===> Pre-order: [ 1, 2 ]
Tree B: [ 1 -> right: 2 ] ===> Pre-order: [ 1, 2 ]
AMBIGUOUS!

With Explicit Null Sentinels ('#'):
Tree A: "1,2,#,#,#"
Tree B: "1,#,2,#,#"
UNAMBIGUOUS!
```

#### Avoiding the $O(n^2)$ `shift()` Performance Bug
Calling `tokens.shift()` during deserialization reindexes all remaining elements on every node reconstruction. On a tree with 50,000 nodes, repeated `shift()` calls take $O(n^2)$ time, freezing the Node.js event loop.
Using a scalar tracking pointer `let index = 0` guarantees **optimal $O(n)$ linear execution**.

```javascript
// Node.js code: Linear Tree Serialization & Deserialization

function serialize(root) {
  const tokens = [];

  function buildString(node) {
    if (!node) {
      tokens.push("#");
      return;
    }
    tokens.push(node.val);
    buildString(node.left);
    buildString(node.right);
  }

  buildString(root);
  return tokens.join(",");
}

function deserialize(data) {
  const tokens = data.split(",");
  let index = 0; // Use pointer instead of tokens.shift()

  function buildTree() {
    if (index >= tokens.length) return null;

    const val = tokens[index++];
    if (val === "#") return null;

    const node = new TreeNode(Number(val));
    node.left = buildTree();
    node.right = buildTree();
    return node;
  }

  return buildTree();
}
```

---

### 4. Data Serialization Trade-offs in Node.js Distributed Architectures

In Node.js enterprise microservices, complex trees (e.g., ASTs, organizational charts, category taxonomies) must be shared across processes or cached in Redis:

```text
Serialization Format Tradeoffs in Node.js:

Format 1: Standard JSON.stringify(tree)
- Stores redundant keys: {"val":1,"left":{"val":2,"left":null,"right":null}...}
- Memory Expansion: 6x-10x larger payload! High GC churn.

Format 2: Delimited Pre-Order String ("1,2,#,#,3,#,#")
- Compact plain text: ~3x smaller than JSON.
- Fast string parsing via split and index pointers.

Format 3: Packed Binary Buffer (Node.js Buffer.alloc)
- Encodes node value and child bitmasks as 32-bit integers.
- Zero string decoding overhead; optimal for Redis and IPC sockets.
```

---

## Tricky Points & Edge Cases

1. **Node as Ancestor of Itself**:
   If node $p$ is the direct parent of node $q$, the general LCA algorithm returns $p$ immediately upon encountering `root === p`. It does not need to search beneath $p$ because whether $q$ is beneath $p$ or not, $p$ is the valid LCA.
2. **Missing Nodes in General LCA**:
   Standard LCA assumes that both $p$ and $q$ exist in the tree. If node $q$ is absent from the tree entirely, the standard algorithm will falsely return $p$ as the LCA! In production code, perform a two-pass verification or maintain a visited counter.
3. **Delimiter Collision in Tree Values**:
   When nodes store string text rather than integers, ensure the separator delimiter (e.g., `,`) does not collide with text values. Use length-prefixed strings or Protocol Buffers.

---

## Hands-On Exercise

### Scenario: Safe Binary Buffer Tree Serializer

Implement a production-grade serialization and deserialization utility that validates tree reconstruction fidelity using strict assertions, and handles negative values, empty trees, and single-node trees.

### Buggy Code

```javascript
// ❌ BUGGY: Uses shift(), corrupts negative numbers, and fails on empty trees
function buggyDeserialize(data) {
  if (!data) return null;
  const tokens = data.split(",");
  // BUG 1: shift() causes O(n^2) runtime on large trees!
  const val = tokens.shift();
  if (val === "#") return null;
  const root = new TreeNode(parseInt(val));
  // BUG 2: Re-slices or fails to synchronize tokens across recursive calls!
  root.left = buggyDeserialize(tokens.join(","));
  return root;
}
```

### Acceptance Criteria

1. Serializes binary trees into compact comma-delimited strings with `#` null markers.
2. Deserializes in linear $O(n)$ time using an incremental index pointer.
3. Successfully serializes and deserializes trees with negative numbers, unbalanced branches, and null roots.
4. Verified with comprehensive assertions confirming identical tree structures.

### Solution Code

```javascript
// Node.js code: Robust Tree Serialization Suite
const assert = require("assert");

class Codec {
  serialize(root) {
    const tokens = [];

    function dfs(node) {
      if (!node) {
        tokens.push("#");
        return;
      }
      tokens.push(String(node.val));
      dfs(node.left);
      dfs(node.right);
    }

    dfs(root);
    return tokens.join(",");
  }

  deserialize(data) {
    if (!data) return null;
    const tokens = data.split(",");
    let index = 0;

    function build() {
      if (index >= tokens.length) return null;

      const token = tokens[index++];
      if (token === "#") return null;

      const node = new TreeNode(Number(token));
      node.left = build();
      node.right = build();
      return node;
    }

    return build();
  }
}

// Verification Tests
const codec = new Codec();

// Tree: [1, -2, 3, null, null, 4, 5]
const original = new TreeNode(
  1,
  new TreeNode(-2),
  new TreeNode(3, new TreeNode(4), new TreeNode(5))
);

const serializedStr = codec.serialize(original);
assert.strictEqual(serializedStr, "1,-2,#,#,3,4,#,#,5,#,#");

const reconstructed = codec.deserialize(serializedStr);
assert.strictEqual(reconstructed.val, 1);
assert.strictEqual(reconstructed.left.val, -2);
assert.strictEqual(reconstructed.right.val, 3);
assert.strictEqual(reconstructed.right.left.val, 4);
assert.strictEqual(reconstructed.right.right.val, 5);

// Edge cases
assert.strictEqual(codec.serialize(null), "#");
assert.strictEqual(codec.deserialize("#"), null);

console.log("✅ All Tree Serialization assertions passed successfully.");
```

### Solution Explanation

1. **Pre-Order Determinism**: Visiting $N \to L \to R$ guarantees that the root appears first in the token array, allowing linear left-to-right reconstruction.
2. **Index Pointer**: Incrementing `index++` reads each token in $O(1)$ time, yielding an optimal $O(n)$ deserializer that scales to large trees without event loop blocking.

---

## Summary

- **General LCA**: Evaluated via bottom-up post-order DFS. If left and right subtrees both return non-null, the current node is the LCA ($O(n)$ time).
- **BST LCA**: Exploit key ordering to locate the split point where $p$ and $q$ branch in opposite directions ($O(h)$ time, $O(1)$ space).
- **Serialization Invariant**: Null sentinels (`#`) are mandatory to eliminate topological ambiguity during tree reconstruction.
- **Deserialization Complexity**: Replace `Array.shift()` with a tracking index pointer to achieve $O(n)$ performance instead of $O(n^2)$.
- **Node.js Caching**: Compact delimited strings and packed binary buffers dramatically reduce Redis memory and IPC network payloads compared to verbose JSON.

---

## Cheat Sheet & Common Pitfalls

### LCA & Serialization Templates
```javascript
// BST LCA (O(1) Space)
while (curr) {
  if (p.val < curr.val && q.val < curr.val) curr = curr.left;
  else if (p.val > curr.val && q.val > curr.val) curr = curr.right;
  else return curr; // Split point
}

// General LCA
if (!root || root === p || root === q) return root;
const L = lca(root.left, p, q), R = lca(root.right, p, q);
return L && R ? root : (L || R);
```

### Common Pitfalls

| Mistake | Consequence | Correct Pattern |
| :--- | :--- | :--- |
| **Full DFS for BST LCA** | Wastes $O(n)$ time when $O(h)$ is possible. | Follow key ordering toward the split point. |
| **Omitting null markers `#`** | Ambiguous string; cannot reconstruct tree shape. | Encode null leaves explicitly as `#`. |
| **`tokens.shift()` in deserialize** | $O(n^2)$ array element copying in V8. | Advance a scalar index pointer `index++`. |
| **Assuming both nodes exist** | Returns false-positive LCA if one node is missing. | Verify both nodes exist if not guaranteed. |

---

## Interview Questions

### 1. Why does tree deserialization require explicit null markers, whereas array sorting does not?

**Question:** Explain why serializing a binary tree requires encoding explicit null markers (e.g., `'#'`), whereas flat arrays can be serialized and sorted without sentinels.

**Answer:** 
A flat array is a one-dimensional linear sequence. Every index has exactly one predecessor and one successor; there are no branching structural variations.

In contrast, a binary tree is a non-linear two-dimensional branching graph. Multiple completely distinct tree structures produce the exact same sequence of node values during pre-order traversal:
- **Left-Skewed Tree**: Root `2` with left child `1` produces pre-order: `[2, 1]`.
- **Right-Skewed Tree**: Root `2` with right child `1` produces pre-order: `[2, 1]`.

Without explicit null markers, a deserializer reading `[2, 1]` cannot know whether `1` is a left child, a right child, or if `2` has other missing branches.
By appending explicit null markers:
- Left-skewed tree serializes to: `"2,1,#,#,#"`
- Right-skewed tree serializes to: `"2,#,1,#,#"`

The null sentinels strictly determine when a branch terminates, enabling unique topological reconstruction.

---

### 2. How do you implement an iterative $O(1)$ auxiliary space solution for LCA in a Binary Search Tree?

**Question:** Implement `lowestCommonAncestor(root, p, q)` for a Binary Search Tree in $O(h)$ time and $O(1)$ auxiliary space without recursion.

**Answer:** 

```javascript
// Node.js code
function lowestCommonAncestorBST(root, p, q) {
  let curr = root;

  while (curr !== null) {
    // If both values are smaller, LCA must lie in the left subtree
    if (p.val < curr.val && q.val < curr.val) {
      curr = curr.left;
    }
    // If both values are larger, LCA must lie in the right subtree
    else if (p.val > curr.val && q.val > curr.val) {
      curr = curr.right;
    }
    // Found the split point or an exact match: this is the LCA!
    else {
      return curr;
    }
  }

  return null;
}
```

**Complexity Analysis**:
- **Time Complexity**: $O(h)$ where $h$ is tree height ($O(\log n)$ balanced).
- **Space Complexity**: $O(1)$ auxiliary space because it reassigns a single pointer in a `while` loop with zero call stack overhead.

---

### 3. What is the performance flaw in using `Array.prototype.shift()` inside a deserializer, and how do you fix it?

**Question:** Spot the performance flaw in this deserializer implementation and provide the optimized fix:
```javascript
function deserialize(data) {
  const tokens = data.split(",");
  function build() {
    const val = tokens.shift();
    if (val === "#") return null;
    const node = new TreeNode(Number(val));
    node.left = build();
    node.right = build();
    return node;
  }
  return build();
}
```

**Answer:** 
**Performance Flaw**:
In JavaScript engines (V8), arrays are stored as contiguous memory buffers.
`Array.prototype.shift()` removes the element at index 0 and reindexes all remaining elements by shifting them one slot to the left in memory, taking $O(k)$ time where $k$ is the current length of `tokens`.
For a tree of $n$ nodes, invoking `shift()` $n$ times results in:
$$\sum_{k=1}^n O(k) = O(n^2) \text{ operations}$$
For large trees ($n \ge 50,000$), quadratic memory copying blocks the single-threaded Node.js event loop for multiple seconds.

**Optimized Fix**:
Replace `tokens.shift()` with a tracking index pointer that advances in $O(1)$ constant time:
```javascript
function deserialize(data) {
  const tokens = data.split(",");
  let index = 0;
  function build() {
    if (index >= tokens.length) return null;
    const val = tokens[index++]; // O(1) read and pointer advance
    if (val === "#") return null;
    const node = new TreeNode(Number(val));
    node.left = build();
    node.right = build();
    return node;
  }
  return build();
}
```
This restores optimal linear $O(n)$ time complexity.

---

### 4. In a multi-tenant Node.js backend using organizational unit trees, how does LCA resolve permission inheritance?

**Question:** In an enterprise Node.js authorization service where departments and user groups are structured as a hierarchical tree, explain how the Lowest Common Ancestor algorithm determines access permissions between collaborative actors.

**Answer:** 
In enterprise Role-Based Access Control (RBAC), organizations are structured as an Organizational Unit (OU) tree where parent units delegate permissions downward to sub-departments:
1. **The Shared Permission Boundary**:
   When User A (in Department A) attempts to perform a shared collaborative action on an asset owned by User B (in Department B), the system must determine the most specific administrative domain that governs both users.
2. **LCA Calculation**:
   Computing $\text{LCA}(\text{Dept}_A, \text{Dept}_B)$ identifies the lowest common managerial node in the organization tree where both users converge.
3. **Authorization Check**:
   The authorization service evaluates policies attached to that LCA node. If the LCA node permits cross-department sharing or if an administrator possesses delegation authority at or above that LCA node, the action is permitted; otherwise, it is denied.
4. **Efficiency**:
   Because organization trees are read-heavy and relatively shallow ($h < 15$), computing LCA executes in microseconds, avoiding expensive recursive database joins across multi-tenant schemas.

---

<nav aria-label="Lecture navigation">

[Previous: Binary Search Trees: CRUD and Validation](day-34-binary-search-trees-crud-and-validation.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Graph Representations and Modeling](day-36-graph-representations-and-modeling.md)

</nav>
