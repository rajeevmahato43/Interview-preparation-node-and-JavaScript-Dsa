# Day 34: Binary Search Trees: CRUD and Validation

## 1. Learning Outcomes
- Master the **Binary Search Tree (BST)** invariant: for every node, all left subtree keys $< \text{node.val} <$ all right subtree keys.
- Implement BST Search and Insertion in $O(h)$ time ($O(\log n)$ average, $O(n)$ worst-case).
- Master BST Deletion covering all 3 structural cases: leaf node, single child, and two children with **In-Order Successor** replacement.
- Implement the **Validate BST** algorithm using both the valid-range boundary $(min, max)$ pattern and monotonic in-order traversal.
- Connect BST operations to real-world database indexing (B-Tree indexing foundations in PostgreSQL/MongoDB) in Node.js architectures.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 26 (Binary Search Fundamentals), Day 31 (Binary Tree DFS & In-Order Traversal).
- **Navigation**:
  - [Previous: Day 33 - Tree Depth, Diameter, and Path Sums](day-33-tree-depth-diameter-and-path-sums.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 35 - Lowest Common Ancestor and Serialization](day-35-lowest-common-ancestor-and-serialization.md)

---

## 3. Core Concepts & Mental Models
A Binary Search Tree maintains a strict global ordering across all subtrees. It is not sufficient for a node to be larger than its immediate left child; it must be strictly larger than **all** nodes in its entire left subtree.

```text
Valid BST:                    INVALID BST (Subtree Violation):
        [10]                                [10]
       /    \                              /    \
     [5]    [15]                         [5]    [15]
    /   \       \                              /    \
  [2]   [7]     [20]                         [6]    [20]
                                              ^
                      6 is in right subtree of 10, but 6 < 10!
```

### Deletion Case 3: Two Children
When deleting a node with two children, replace its value with its **In-Order Successor** (the smallest value in its right subtree), then delete that successor from the right subtree.

```text
Deleting [10] (Two Children):
       [10]                       [12] (Successor)
      /    \                     /    \
    [5]    [15]       ===>     [5]    [15]
          /    \                     /    \
        [12]   [20]                null   [20]
```

---

## 4. Detailed Technical Explanations

### 4.1 Search and Insert Invariants
- If `val === curr.val`: Found (or duplicate handling).
- If `val < curr.val`: Recurse/advance to `curr.left`.
- If `val > curr.val`: Recurse/advance to `curr.right`.
- **Complexity**: $O(h)$ where $h = \log n$ for balanced trees, but degenerates to $O(n)$ if values are inserted in sorted order (unbalanced stick).

### 4.2 Deleting a Node (The 3 Cases)
1. **Node is a Leaf** (`!left && !right`): Simply return `null` to the parent pointer.
2. **Node has One Child**: Return the non-null child to the parent pointer.
3. **Node has Two Children**: Find the minimum node in the right subtree (`findMin(node.right)`). Copy its value to `node.val`. Then delete the successor: `node.right = deleteNode(node.right, minVal)`.

### 4.3 Validation: Why Local Checks Fail
Checking `node.val > node.left.val && node.val < node.right.val` fails because a deep left descendant might violate an ancestor's bound. The correct approach propagates valid ranges `(min, max)` downwards:
- Left child constraint: `(min, node.val)`.
- Right child constraint: `(node.val, max)`.

### 4.4 Node.js Relevance: In-Memory Indexing & B-Trees
Databases (PostgreSQL, MongoDB) implement B-Trees (multi-way balanced search trees) for index lookups. In Node.js in-memory stores (e.g., Redis zsets or local red-black trees in caching engines), BST principles provide logarithmic searches for range queries (`score >= 100 AND score <= 500`).

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 BST Insertion & Deletion
```javascript
class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

/**
 * Inserts a value into BST.
 * Time: O(h), Space: O(h) recursion stack
 */
function insertIntoBST(root, val) {
  if (!root) return new TreeNode(val);

  if (val < root.val) {
    root.left = insertIntoBST(root.left, val);
  } else if (val > root.val) {
    root.right = insertIntoBST(root.right, val);
  }

  return root;
}

/**
 * Deletes a value from BST handling 3 structural cases.
 * Time: O(h), Space: O(h)
 */
function deleteNode(root, key) {
  if (!root) return null;

  if (key < root.val) {
    root.left = deleteNode(root.left, key);
  } else if (key > root.val) {
    root.right = deleteNode(root.right, key);
  } else {
    // Found node to delete
    // Case 1 & 2: 0 or 1 child
    if (!root.left) return root.right;
    if (!root.right) return root.left;

    // Case 3: 2 children. Find in-order successor (min in right subtree)
    let successor = root.right;
    while (successor.left !== null) {
      successor = successor.left;
    }

    root.val = successor.val; // Replace value
    root.right = deleteNode(root.right, successor.val); // Delete successor
  }

  return root;
}
```

### 5.2 Validate Binary Search Tree (LeetCode 98)
```javascript
/**
 * Validates BST using range constraints.
 * Time Complexity: O(n)
 * Space Complexity: O(h)
 */
function isValidBST(root) {
  function validate(node, min, max) {
    if (!node) return true;

    // Must be strictly greater than min and strictly less than max
    if (min !== null && node.val <= min) return false;
    if (max !== null && node.val >= max) return false;

    // Left child bounded by (min, node.val), Right child bounded by (node.val, max)
    return validate(node.left, min, node.val) && 
           validate(node.right, node.val, max);
  }

  return validate(root, null, null);
}
```

### 5.3 Execution Trace: `isValidBST` on Invalid Tree `[10, 5, 15, null, null, 6, 20]`
```text
validate(10, null, null)
├── validate(5, null, 10): 5 is in (-inf, 10) -> true
└── validate(15, 10, null): 15 is in (10, inf)
    ├── validate(6, 10, 15):
    │   Check: node.val (6) <= min (10) evaluates TRUE!
    │   Violation! Returns FALSE!
Returns false immediately to root. Tree is correctly flagged as INVALID BST.
```

---

## 6. Common Mistakes & Anti-Patterns
- **Local-Only Child Validation**: Checking only `root.left.val < root.val` without passing ancestor boundaries.
- **Handling Equal Values Incorrectly**: Standard BST definition requires strictly less (`<`) and strictly greater (`>`). Using `<=` permits duplicates that break binary search guarantees unless explicitly specified.
- **Forgetting Parent Pointer Rewiring**: In deletion, writing `root = root.right` without returning `root` to update the parent's `parent.left` or `parent.right` reference.

---

## 7. Tricky Points & Edge Cases
- **32-Bit Integer Limits (`-Infinity`, `Infinity`)**: In JavaScript, using `-Infinity` and `Infinity` handles edge cases where node values equal `Number.MIN_SAFE_INTEGER` or `Number.MAX_SAFE_INTEGER`. Using `null` guards avoids precision overflow.
- **Duplicate Keys**: If duplicate keys are allowed, design must specify whether duplicates route strictly to the left or right subtree.
- **Degenerate Trees**: Inserting sorted elements `[1, 2, 3, 4, 5]` results in a linked list structure where search degrades from $O(\log n)$ to $O(n)$. Self-balancing trees (AVL / Red-Black) solve this.

---

## 8. Practical Engineering Exercises
1. Implement `kthSmallest(root, k)` that returns the $k$-th smallest value in a BST in $O(h + k)$ time using iterative In-Order traversal.
2. Given a sorted array, implement `sortedArrayToBST(nums)` that constructs a height-balanced BST in $O(n)$ time.

---

## 9. Key Takeaways & Summary
- In a valid BST, In-order traversal produces a strictly increasing sorted sequence.
- Deletion handles 3 cases: leaf nodes, nodes with 1 child, and nodes with 2 children (substituting the in-order successor).
- Tree validation requires propagating `(min, max)` boundaries downward across every recursion frame.
- Unbalanced BSTs degenerate to $O(n)$ linked lists under sorted insertions.

---

## 10. Quick Reference Cheat Sheet
| Operation | Average Case | Worst Case (Degenerate) | Space |
| :--- | :--- | :--- | :--- |
| **Search** | $O(\log n)$ | $O(n)$ | $O(h)$ |
| **Insert** | $O(\log n)$ | $O(n)$ | $O(h)$ |
| **Delete** | $O(\log n)$ | $O(n)$ | $O(h)$ |
| **Validate** | $O(n)$ | $O(n)$ | $O(h)$ |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: Why does In-Order traversal of a Binary Search Tree always yield values in ascending sorted order?  
**Hint**: Connect the traversal step order ($L-N-R$) with the BST property.  
**Expected Answer Shape**: In a BST, by definition, all keys in `node.left` are smaller than `node.val`, and all keys in `node.right` are larger. In-Order traversal visits all left subtree keys first, then processes the current `node.val`, and finally visits all right subtree keys. By structural induction, every value is visited in strictly non-decreasing order.

### 2. Code-Writing
**Question**: Write a function to find the $k$-th smallest element in a BST.  
**Hint**: Stop In-Order traversal as soon as $k$ nodes are visited.  
**Expected Answer Shape**: Use iterative In-Order traversal with an explicit stack. Traverse left, push nodes. Pop node, decrement $k$. When $k === 0$, return popped node's value immediately without traversing the rest of the tree ($O(h + k)$ time, $O(h)$ space).

### 3. Debugging
**Question**: What is wrong with this attempt to validate a BST?  
```javascript
function isValid(root) {
  if (!root) return true;
  if (root.left && root.left.val >= root.val) return false;
  if (root.right && root.right.val <= root.val) return false;
  return isValid(root.left) && isValid(root.right);
}
```  
**Hint**: Consider a root with value 10, right child 15, and right child's left child 6.  
**Expected Answer Shape**: This code only checks immediate parent-child relationships. It fails to catch deep subtree violations. For example, if root is 10, right child is 15, and 15's left child is 6: 6 is locally valid for 15 ($6 < 15$), but invalid globally because $6 < 10$. Must pass running `(min, max)` boundaries downwards.

### 4. System Design / Tradeoff
**Question**: In building a high-volume leaderboard in Node.js, would you choose an unconstrained BST, an AVL/Red-Black Tree, or a Redis Sorted Set?  
**Hint**: Unbalanced degradation vs. self-balancing complexity vs. out-of-process store.  
**Expected Answer Shape**: An unconstrained BST degrades to $O(n)$ if user scores arrive in sorted or clustered order, blocking the Node.js event loop. An in-memory Red-Black tree guarantees $O(\log n)$ lookups and updates via rotations. However, for scalable Node.js deployments across multiple instances, Redis Sorted Sets (backed by Skip Lists and Hash Tables) provide $O(\log n)$ updates with persistence and shared distributed state.

### 5. Tricky / Edge Case
**Question**: When deleting a node with two children, does choosing the In-Order Predecessor instead of the In-Order Successor alter the correctness of the BST?  
**Hint**: Where is the predecessor located and does it satisfy BST invariants?  
**Expected Answer Shape**: No, both are fully valid. The In-Order Predecessor is the maximum element in the left subtree. It is strictly greater than all other left subtree nodes and strictly less than all right subtree nodes, so placing it at the deleted node's position preserves all BST ordering invariants.

### 6. Real-World Node.js Context
**Question**: How does MongoDB's wiredTiger storage engine utilize B-Tree principles to handle high write/read throughput from Node.js drivers?  
**Hint**: Page-level branching factor and disk I/O reduction.  
**Expected Answer Shape**: MongoDB uses B-Trees rather than binary BSTs for index storage. A B-Tree has a high branching factor (hundreds of keys per node), matching disk block/page sizes. When a Node.js query executes with an indexed filter, wiredTiger loads index pages in $O(\log_B n)$ disk seeks, minimizing disk I/O and returning data asynchronously to the Node.js driver.
