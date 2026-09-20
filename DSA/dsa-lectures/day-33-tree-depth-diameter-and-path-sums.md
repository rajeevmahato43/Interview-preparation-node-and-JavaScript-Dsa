# Day 33: Tree Depth, Diameter, and Path Sums

## 1. Learning Outcomes
- Calculate **Maximum Depth** and **Minimum Depth** of a binary tree using bottom-up recursion.
- Solve the **Diameter of a Binary Tree** using post-order subtree height aggregation in $O(n)$ time.
- Implement **Path Sum I** (boolean existence) and **Path Sum II** (path backtracking).
- Master **Path Sum III** (arbitrary downward paths) using the **Prefix Sum Hash Map** technique on tree nodes.
- Understand how tree depth and path accumulation model hierarchical access control (RBAC) and routing pipelines in Node.js.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 15 (Prefix Sum), Day 22 (Backtracking Fundamentals), Day 31 (Tree DFS).
- **Navigation**:
  - [Previous: Day 32 - Level-Order Traversal (BFS) and Tree Views](day-32-level-order-traversal-bfs-and-views.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 34 - Binary Search Trees: CRUD & Validation](day-34-binary-search-trees-crud-and-validation.md)

---

## 3. Core Concepts & Mental Models
Tree problems that aggregate metrics along vertical or branching paths fall into two primary recursion paradigms:
1. **Top-Down (Pre-order)**: Passing values downwards from parent to child (e.g., target sum subtraction).
2. **Bottom-Up (Post-order)**: Calculating values at leaves and combining them upwards to the parent (e.g., height and diameter).

```text
Diameter of Binary Tree:
Longest path between any two nodes (number of edges).
         [1]
        /   \
      [2]   [3]
     /   \
   [4]   [5]
   /       \
 [6]       [7]

Subtree Heights at Node 2: Left height = 2 ([4]->[6]), Right height = 2 ([5]->[7])
Diameter passing through Node 2: Left height + Right height = 2 + 2 = 4 edges!
Note: The diameter does NOT need to pass through root [1]!
```

---

## 4. Detailed Technical Explanations

### 4.1 Maximum Depth vs. Minimum Depth
- **Max Depth**: `1 + Math.max(maxDepth(root.left), maxDepth(root.right))`.
- **Min Depth Trap**: The minimum depth is the number of nodes along the shortest path from root to the nearest **leaf node** (a node with no children). If a node has only one child, you cannot take `Math.min(left, right)` because the missing child ($0$) is not a leaf; you must take the non-null child's path!

### 4.2 Diameter Calculation Pattern (Global State in Post-Order)
The diameter at any node $N$ is `leftHeight + rightHeight`. The height returned to $N$'s parent is `1 + Math.max(leftHeight, rightHeight)`. By running a post-order traversal, we calculate height upwards while updating a global `maxDiameter` variable at every node.

### 4.3 Path Sum III: Prefix Sum Map on Trees
Finding paths that sum to $K$ starting and ending anywhere (as long as they move downwards) naively takes $O(n^2)$ by testing every node as root.
By porting **Day 15's Prefix Sum + Hash Map** pattern to DFS:
- Store running prefix sum frequencies in a `Map`.
- At current node: if `map.has(currentSum - target)`, add count.
- **Crucial Backtracking Step**: When returning from recursive call, decrement `map.get(currentSum)` so subtrees on different branches do not see this branch's prefix sum!

### 4.4 Node.js Relevance: Hierarchical Middleware & RBAC Cost Trees
In Node.js enterprise backends, nested route definitions (e.g., nested Express routers) form an AST-like tree. Path sums evaluate route middleware execution latency or verify permissions along inherited RBAC role hierarchies.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 Diameter of Binary Tree (LeetCode 543)
```javascript
class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

/**
 * Calculates length of the longest path between any two nodes.
 * Time Complexity: O(n)
 * Space Complexity: O(h) recursion stack
 */
function diameterOfBinaryTree(root) {
  let maxDiameter = 0;

  function getHeight(node) {
    if (!node) return 0;

    const leftHeight = getHeight(node.left);
    const rightHeight = getHeight(node.right);

    // Update global diameter (edges = leftHeight + rightHeight)
    maxDiameter = Math.max(maxDiameter, leftHeight + rightHeight);

    // Return height of current node to its parent
    return 1 + Math.max(leftHeight, rightHeight);
  }

  getHeight(root);
  return maxDiameter;
}
```

### 5.2 Path Sum III (Prefix Sum on Tree - LeetCode 437)
```javascript
/**
 * Counts paths summing to targetSum starting and ending at arbitrary nodes downwards.
 * Time Complexity: O(n) single pass
 * Space Complexity: O(h) map entries
 */
function pathSum(root, targetSum) {
  const prefixMap = new Map();
  prefixMap.set(0, 1); // Base case: 1 path with prefix sum 0

  function dfs(node, currentSum) {
    if (!node) return 0;

    currentSum += node.val;
    // Number of valid paths ending at this node
    let count = prefixMap.get(currentSum - targetSum) || 0;

    // Record current prefix sum
    prefixMap.set(currentSum, (prefixMap.get(currentSum) || 0) + 1);

    // Recurse into children
    count += dfs(node.left, currentSum);
    count += dfs(node.right, currentSum);

    // BACKTRACK: Remove current node's prefix sum before returning to parent
    prefixMap.set(currentSum, prefixMap.get(currentSum) - 1);

    return count;
  }

  return dfs(root, 0);
}
```

### 5.3 Execution Trace: Path Sum III Backtracking
```text
Tree: [10, 5, -3], targetSum = 8
Root: 10 -> currentSum = 10. Map: {0:1, 10:1}. count += map.get(10-8=2) -> 0.
Left child: 5 -> currentSum = 15. Map: {0:1, 10:1, 15:1}. count += map.get(15-8=7) -> 0.
Leaves of 5 return.
BACKTRACK: prefixMap.set(15, 0).
Right child: -3 -> currentSum = 7. Map: {0:1, 10:1}. Notice sum 15 is GONE!
count += map.get(7-8=-1) -> 0.
Root finishes. Backtracks 10. Map returns to base state {0:1}.
```

---

## 6. Common Mistakes & Anti-Patterns
- **Minimum Depth One-Child Bug**: Writing `return 1 + Math.min(minDepth(root.left), minDepth(root.right))`. If `root.left` is null and `root.right` has 5 nodes, this returns 1, which is incorrect because the root has no left leaf!
- **Forgetting to Backtrack in Path Sum III**: Leaving the current node's sum in `prefixMap` causes sibling or uncle subtrees to falsely match ancestor prefix sums that do not exist on their branch.
- **Assuming Diameter Must Pass Through Root**: Calculating `maxDepth(root.left) + maxDepth(root.right)` at the root alone fails when the longest path is contained entirely within a deep, wide subtree.

---

## 7. Tricky Points & Edge Cases
- **Negative Values in Path Sum**: When nodes have negative values, path sums can increase and decrease along a branch; prefix sum maps seamlessly handle negatives without requiring sorted paths.
- **Single Node Tree**: For `root = TreeNode(1)`, diameter is 0 (0 edges), max depth is 1, min depth is 1.
- **Empty Tree**: Guard `if (!root) return 0;` at the entry point of all depth and path calculations.

---

## 8. Practical Engineering Exercises
1. Implement **Path Sum II** returning all full root-to-leaf paths as arrays of node values matching `targetSum`.
2. Implement **Binary Tree Maximum Path Sum** (LeetCode 124) where paths can move from child up through a parent and down into another child (handling negative node sums).

---

## 9. Key Takeaways & Summary
- Tree heights are computed bottom-up via post-order traversal (`1 + Math.max(left, right)`).
- Tree diameter is tracked as a running maximum of `leftHeight + rightHeight` across all nodes.
- For Minimum Depth, if one subtree is null, you must traverse into the non-null subtree.
- Path Sum III combines Tree DFS with the Prefix Sum Hash Map technique, requiring backtracking to isolate branches.

---

## 10. Quick Reference Cheat Sheet
| Problem | Key Formula | Complexity |
| :--- | :--- | :--- |
| **Max Depth** | `1 + Math.max(left, right)` | $O(n)$ time, $O(h)$ space |
| **Min Depth** | If one child null: `1 + left + right`; else `1 + Math.min(left, right)` | $O(n)$ time, $O(h)$ space |
| **Diameter** | `maxDiameter = Math.max(max, left + right)` | $O(n)$ time, $O(h)$ space |
| **Path Sum III** | `prefixMap.get(currSum - target)` + backtrack | $O(n)$ time, $O(h)$ space |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: Why does the Minimum Depth algorithm require checking whether one of the children is null, while Maximum Depth does not?  
**Hint**: Focus on the formal definition of a leaf node.  
**Expected Answer Shape**: A leaf node is defined as a node with no children (`left === null && right === null`). For Maximum Depth, `Math.max(left, right)` naturally selects the deeper active branch. For Minimum Depth, if a node has only one child (e.g., left is null, right has nodes), `Math.min(0, rightDepth)` returns 0, falsely treating the non-leaf parent as a leaf. Therefore, if one child is null, we must recurse exclusively on the non-null child.

### 2. Code-Writing
**Question**: Write `hasPathSum(root, targetSum)` that returns true if there is a root-to-leaf path whose values sum to `targetSum`.  
**Hint**: Subtract node value as you descend; check leaf condition.  
**Expected Answer Shape**: If `!root` return false. Subtract: `targetSum -= root.val`. If `!root.left && !root.right`, return `targetSum === 0`. Otherwise, return `hasPathSum(root.left, targetSum) || hasPathSum(root.right, targetSum)`.

### 3. Debugging
**Question**: Identify the bug in this Diameter function:  
```javascript
function diameter(root) {
  if (!root) return 0;
  const left = maxDepth(root.left);
  const right = maxDepth(root.right);
  return left + right;
}
```  
**Hint**: What happens if the longest path is deep within the left subtree?  
**Expected Answer Shape**: This code assumes the longest path must pass through `root`. In an unbalanced tree (e.g., massive left subtree, tiny right subtree), the longest path may exist entirely within `root.left`. The diameter must be evaluated at every node using a running maximum, and computing `maxDepth` separately at each node degrades overall time to $O(n^2)$.

### 4. System Design / Tradeoff
**Question**: When calculating the total weight or latency of deeply nested JSON configuration objects in Node.js, how do you prevent call stack overflow on payloads with 20,000 nested levels?  
**Hint**: Compare recursion to iterative post-order traversal or trampolining.  
**Expected Answer Shape**: V8 call stack throws `RangeError` around 10,000 frames. For 20,000 nested levels, replace recursive DFS with iterative post-order traversal using an explicit stack on the heap, or implement an asynchronous chunked traversal yielding to `setImmediate()` to clear stack frames between batches.

### 5. Tricky / Edge Case
**Question**: In Path Sum III, what would happen if you initialize the prefix map without `prefixMap.set(0, 1)`?  
**Hint**: What if a valid path starts directly at the root node?  
**Expected Answer Shape**: If `prefixMap.set(0, 1)` is missing, any path whose sum from the root exactly equals `targetSum` will have `currentSum - targetSum = 0`. Because key `0` is not in the map, the algorithm will fail to count valid paths originating at the root node.

### 6. Real-World Node.js Context
**Question**: How does a build tool like Vite or Webpack use path depth and cycle detection to calculate bundle dependency depth?  
**Hint**: Module dependency graphs with imported modules.  
**Expected Answer Shape**: Build tools model module imports as a directed graph. Depth calculation determines the bundling order and chunk splitting levels. If a module path depth exceeds configured thresholds or circular imports occur, the builder flags circular dependencies or bundles modules into common vendor chunks to prevent runtime initialization loops in Node.js modules.
