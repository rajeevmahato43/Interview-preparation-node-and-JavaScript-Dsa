# Day 33: Tree Depth, Diameter, and Path Sums

<nav aria-label="Lecture navigation">

[Previous: Level-Order Traversal (BFS) and Tree Views](day-32-level-order-traversal-bfs-and-views.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search Trees: CRUD and Validation](day-34-binary-search-trees-crud-and-validation.md)

</nav>
## Prerequisites

- [Day 15: Prefix Sum and Cumulative Totals](day-15-prefix-sum-and-range-queries.md) — Prefix sum hash map complement pattern.
- [Day 22: Backtracking Core: Decision State, Choices, and Undo](day-22-backtracking-fundamentals.md) — State mutation and rollback.
- [Day 31: Binary Tree Fundamentals and DFS](day-31-binary-tree-fundamentals-and-dfs.md) — Recursive DFS traversals and tree height definitions.
---

## 1. Maximum Depth vs. Minimum Depth: The Single-Child Trap

> **Minimum Depth**: The number of nodes along the shortest path from the root down to the nearest leaf node.

> **Maximum Depth**: The number of nodes along the longest path from the root down to the farthest leaf node.

The **Maximum Depth** of a binary tree is the length of the longest path from the root to any leaf node:
$$\text{maxDepth}(\text{node}) = 1 + \max(\text{maxDepth}(\text{left}), \text{maxDepth}(\text{right}))$$

The **Minimum Depth** is the length of the shortest path from the root to the nearest **leaf node** (a node with no children: `left === null && right === null`).

#### The Single-Child Fallacy
Writing `1 + Math.min(minDepth(left), minDepth(right))` fails on trees with single-child parents!
If a parent has `left = null` and a deep right subtree, `Math.min(0, rightDepth)` returns `0`. The formula would compute depth $1 + 0 = 1$, falsely treating the non-leaf parent as a leaf!

```text
The Single-Child Trap:
       [ 1 ]
         \
         [ 2 ]
           \
           [ 3 ]

If naive Math.min is used:
minDepth(1) = 1 + Math.min(0, minDepth(2)) = 1!
WRONG: Node 1 is NOT a leaf! True minimum depth is 3.

Rule for Minimum Depth:
- If both children exist: 1 + Math.min(minDepth(left), minDepth(right))
- If one child is null: 1 + Math.max(minDepth(left), minDepth(right)) (Explore the non-null child!)
```

```javascript
// Node.js code: Maximum and Minimum Tree Depth

class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function maxDepth(root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}

// ❌ WRONG: Naive minDepth fails on single-child nodes
function brokenMinDepth(root) {
  if (!root) return 0;
  // BUG: Returns 1 if root has only one child!
  return 1 + Math.min(brokenMinDepth(root.left), brokenMinDepth(root.right));
}

// ✅ CORRECT: Guard single-child nodes to enforce leaf definition
function minDepth(root) {
  if (!root) return 0;

  // If left is null, we must recurse on right
  if (!root.left) return 1 + minDepth(root.right);
  // If right is null, we must recurse on left
  if (!root.right) return 1 + minDepth(root.left);

  // Both children exist
  return 1 + Math.min(minDepth(root.left), minDepth(root.right));
}
```

---

## 2. Diameter of a Binary Tree (LeetCode 543)

The **Diameter of a Binary Tree** is the length of the longest path between any two nodes in a tree, measured in edges. This path may or may not pass through the root.

At any node $N$:
- The longest path passing *through* $N$ has length:
  $$\text{Diameter}(N) = \text{Height}(\text{left}) + \text{Height}(\text{right})$$
- The height returned to $N$'s parent is:
  $$\text{Height}(N) = 1 + \max(\text{Height}(\text{left}), \text{Height}(\text{right}))$$

```text
Diameter Passing Through Internal Node:
             [ 1 ]
            /     \
         [ 2 ]   [ 3 ]
         /   \
       [ 4 ] [ 5 ]
       /       \
     [ 6 ]     [ 7 ]

Subtree Heights at Node 2:
Left height ([4]->[6]): 2 edges
Right height ([5]->[7]): 2 edges
Diameter through Node 2: 2 + 2 = 4 edges ([6]->[4]->[2]->[5]->[7])
Notice: The longest path does NOT pass through root [1]!
```

```javascript
// Node.js code: Diameter of Binary Tree (LeetCode 543)

function diameterOfBinaryTree(root) {
  let maxDiameter = 0;

  function getHeight(node) {
    if (!node) return 0;

    const leftHeight = getHeight(node.left);
    const rightHeight = getHeight(node.right);

    // Update global diameter (sum of left and right branch heights)
    maxDiameter = Math.max(maxDiameter, leftHeight + rightHeight);

    // Return height of current node to its parent
    return 1 + Math.max(leftHeight, rightHeight);
  }

  getHeight(root);
  return maxDiameter;
}
```

---

## 3. Path Sum I & II: Root-to-Leaf Backtracking

- **Path Sum I (LeetCode 112)**: Returns `true` if there exists a root-to-leaf path summing to `targetSum`.
- **Path Sum II (LeetCode 113)**: Returns all root-to-leaf paths as arrays of values summing to `targetSum`.

In both problems, state is propagated downwards:
1. Subtract `node.val` from `targetSum`.
2. When a leaf is reached (`!node.left && !node.right`), check if `remainingSum === 0`.
3. In Path Sum II, maintain an array `currentPath`, pushing on descent and popping on return (**Backtracking**).

```javascript
// Node.js code: Path Sum II (LeetCode 113)

function pathSumII(root, targetSum) {
  const result = [];
  const currentPath = [];

  function dfs(node, remaining) {
    if (!node) return;

    currentPath.push(node.val);
    remaining -= node.val;

    // Check leaf condition
    if (!node.left && !node.right && remaining === 0) {
      result.push([...currentPath]); // Snapshot solution
    } else {
      dfs(node.left, remaining);
      dfs(node.right, remaining);
    }

    currentPath.pop(); // Backtrack
  }

  dfs(root, targetSum);
  return result;
}
```

---

## 4. Path Sum III: Prefix Sum Map on Trees (LeetCode 437)

In **Path Sum III**, paths do not need to start at the root or end at a leaf; they only need to travel downwards from parent to child.

A naive solution runs DFS from every node, taking $O(n^2)$ time.
By porting **Day 15's Prefix Sum + Hash Map pattern** to trees, we solve it in **strictly linear $O(n)$ time**:
1. Maintain `currentSum` along the branch from the root.
2. If `currentSum - targetSum` exists in `prefixMap`, all paths starting after that prefix sum to `targetSum`.
3. **The Essential Backtracking Step**: When returning from the current node to its parent, decrement `prefixMap.get(currentSum)`. Sibling and cousin branches must **never** see prefix sums that only existed on this branch!

```text
Prefix Sum Map Tree Walk:
Path: Root(10) -> Left(5) -> Leaf(3), Target = 8
1. Node 10: currentSum = 10. Map: {0:1, 10:1}.
   Check 10 - 8 = 2 -> not in map.
2. Node 5:  currentSum = 15. Map: {0:1, 10:1, 15:1}.
   Check 15 - 8 = 7 -> not in map.
3. Node 3:  currentSum = 18. Map: {0:1, 10:1, 15:1, 18:1}.
   Check 18 - 8 = 10 -> Found 10 in map! (Subpath 5 -> 3 sums to 8!)
4. Leaf 3 unwinds: DECREMENT 18 from map! Map reverts to {0:1, 10:1, 15:1}.
```

```javascript
// Node.js code: Path Sum III with Prefix Map Backtracking (LeetCode 437)

function pathSumIII(root, targetSum) {
  const prefixMap = new Map();
  prefixMap.set(0, 1); // Base case: 1 path with sum 0 (from root)

  function dfs(node, currentSum) {
    if (!node) return 0;

    currentSum += node.val;
    // Count paths ending at this node
    let pathsEndingHere = prefixMap.get(currentSum - targetSum) || 0;

    // Record current prefix sum
    prefixMap.set(currentSum, (prefixMap.get(currentSum) || 0) + 1);

    // Recurse into children
    const totalPaths =
      pathsEndingHere +
      dfs(node.left, currentSum) +
      dfs(node.right, currentSum);

    // CRITICAL BACKTRACK: Decrement current sum before returning to parent
    prefixMap.set(currentSum, prefixMap.get(currentSum) - 1);

    return totalPaths;
  }

  return dfs(root, 0);
}
```

---

## Detailed Node.js Relevance: Middleware Latency Trees & RBAC

In Node.js enterprise microservices, nested routing trees (e.g., Express routers mounted within routers) form tree hierarchies:

```text
Router Hierarchy:
               [ App Root (Auth MW: 5ms) ]
                 /                      \
    [ Users Router (Audit: 2ms) ]    [ Billing Router (SSL: 4ms) ]
             /                                     \
[ GET /users/:id (DB: 15ms) ]            [ POST /charge (Stripe: 120ms) ]
```

- **Path Sum Routing**: Calculating the total cumulative latency of an endpoint requires summing middleware execution costs along the vertical path from root to leaf handler.
- **Tree Diameter Analysis**: In distributed actor trees or microservice message topologies, the diameter represents the worst-case cross-service communication hop latency between any two peripheral worker nodes.

---

## Tricky Points & Edge Cases

1. **Negative Node Values in Path Sum**:
   When nodes contain negative values, path sums are non-monotonic (sums can decrease and increase). The Prefix Sum Map pattern handles negative numbers naturally, whereas sliding windows fail.
2. **Missing `prefixMap.set(0, 1)`**:
   If the base case is omitted, any valid path starting directly at the root (`currentSum === targetSum`) will check `currentSum - targetSum = 0`. Because key `0` is missing, the algorithm misses all valid paths originating at the root.
3. **Single Node Tree Diameter**:
   For `root = TreeNode(1)`, diameter is `0` edges (height of left = 0, height of right = 0). Do not confuse edge count with node count.

---

## Hands-On Exercise

### Scenario: Binary Tree Maximum Path Sum (LeetCode 124)

A path in a binary tree is a sequence of nodes where each pair of adjacent nodes has an edge connecting them. A node can only appear at most once. The path does not need to pass through the root. Find the **maximum path sum** of any non-empty path.

### Buggy Code

```javascript
// ❌ BUGGY: Fails on negative numbers and confuses path return with full diameter
function buggyMaxPathSum(root) {
  let maxSum = 0; // BUG 1: Initializing to 0 fails when all node values are negative!

  function dfs(node) {
    if (!node) return 0;
    const left = dfs(node.left);
    const right = dfs(node.right);
    // BUG 2: If child sum is negative, it still adds it, worsening the sum!
    maxSum = Math.max(maxSum, node.val + left + right);
    // BUG 3: Returns full diameter to parent instead of a single branch!
    return node.val + left + right;
  }

  dfs(root);
  return maxSum;
}
```

### Acceptance Criteria

1. Evaluates maximum path sum in $O(n)$ time and $O(h)$ space.
2. Handles negative node values correctly by initializing `maxSum = -Infinity`.
3. Prunes negative subtree branches by capping gain at `0` (`Math.max(0, branch)`).
4. Returns only a single branch (`node.val + Math.max(left, right)`) to the parent.
5. Verified with strict Node.js assertions testing negative roots, single nodes, and branching paths.

### Solution Code

```javascript
// Node.js code: Binary Tree Maximum Path Sum (LeetCode 124)
const assert = require("assert");

function maxPathSum(root) {
  let globalMax = -Infinity; // Handle trees containing all negative numbers

  function getGain(node) {
    if (!node) return 0;

    // Prune negative child contributions by taking max with 0
    const leftGain = Math.max(0, getGain(node.left));
    const rightGain = Math.max(0, getGain(node.right));

    // Price of path passing through current node as the highest ancestor
    const currentPathSum = node.val + leftGain + rightGain;
    globalMax = Math.max(globalMax, currentPathSum);

    // Return the maximum single branch that the parent can extend
    return node.val + Math.max(leftGain, rightGain);
  }

  getGain(root);
  return globalMax;
}

// Verification Tests
// Tree 1: 1 -> 2, 3 => Max path = 2 + 1 + 3 = 6
const t1 = new TreeNode(1, new TreeNode(2), new TreeNode(3));
assert.strictEqual(maxPathSum(t1), 6);

// Tree 2: All negative: [-3] => Max path = -3
assert.strictEqual(maxPathSum(new TreeNode(-3)), -3);

// Tree 3: [-10, 9, 20, null, null, 15, 7] => Max path = 15 + 20 + 7 = 42
const t3 = new TreeNode(
  -10,
  new TreeNode(9),
  new TreeNode(20, new TreeNode(15), new TreeNode(7))
);
assert.strictEqual(maxPathSum(t3), 42);

console.log("✅ All Maximum Path Sum assertions passed successfully.");
```

### Solution Explanation

1. **Negative Branch Pruning**: `Math.max(0, getGain(node.left))` ensures that if a subtree's total contribution is negative, we drop it entirely (gain 0).
2. **Branch Return Invariant**: A path cannot branch into both children *and* extend upwards to a parent. Thus, `currentPathSum` evaluates the arch at `node`, but `return node.val + Math.max(left, right)` returns only a linear branch to the parent.

---

## Summary

- **Depth Invariants**: Max depth uses `1 + Math.max(left, right)`; Min depth guards single-child parents to enforce true leaf nodes.
- **Diameter**: The longest path between any two nodes equals `leftHeight + rightHeight` tracked via a global maximum across all nodes.
- **Path Sum II**: Backtracks a mutable `currentPath` array to capture complete root-to-leaf paths.
- **Path Sum III**: Evaluates arbitrary vertical paths in $O(n)$ time using Prefix Sum Maps, decrementing frequencies during unwinding to isolate branches.
- **Max Path Sum**: Prunes negative gains (`Math.max(0, gain)`) and returns a single branch to callers while updating the global arch sum.

---

## Cheat Sheet & Common Pitfalls

### Tree Depth & Path Formulas
```javascript
// Min Depth Single-Child Guard
if (!root.left) return 1 + minDepth(root.right);
if (!root.right) return 1 + minDepth(root.left);
return 1 + Math.min(minDepth(root.left), minDepth(root.right));

// Path Sum III Prefix Template
prefixMap.set(currSum, (prefixMap.get(currSum) || 0) + 1);
count += dfs(node.left, currSum) + dfs(node.right, currSum);
prefixMap.set(currSum, prefixMap.get(currSum) - 1); // Backtrack
```

### Common Pitfalls

| Mistake | Consequence | Correct Pattern |
| :--- | :--- | :--- |
| **`Math.min(left, right)` on single child** | Prematurely terminates on non-leaf node. | Recurse on the non-null child. |
| **Omitting prefix map backtracking** | Sibling branches see unrelated prefix sums. | Decrement map key upon function return. |
| **Assuming diameter hits root** | Fails when longest path is in a deep subtree. | Track `maxDiameter` globally at every node. |
| **`maxSum = 0` in LeetCode 124** | Fails trees containing only negative numbers. | Initialize `maxSum = -Infinity`. |

---

## Interview Questions

### 1. Why does the Minimum Depth algorithm require checking whether one of the children is null, while Maximum Depth does not?

**Question:** Explain why the Minimum Depth algorithm requires special conditional checks when a node has only one child, whereas Maximum Depth requires no such check.

**Answer:** 
The discrepancy stems from the formal definition of a **leaf node**:
A leaf node is defined as a node with **no children** (`node.left === null && node.right === null`).

1. **In Maximum Depth**:
   Evaluating `1 + Math.max(maxDepth(left), maxDepth(right))` naturally selects whichever branch extends deepest. If one child is `null`, `maxDepth(null)` evaluates to `0`, and `Math.max(0, rightDepth)` correctly pursues the active branch.
2. **In Minimum Depth**:
   If a parent node has only a single child (e.g., `left === null` and `right` has 5 descendants), evaluating `1 + Math.min(0, rightDepth)` yields $1 + 0 = 1$. The algorithm treats the parent as a leaf, even though it possesses an active right child!
3. **Correct Invariant**:
   If `root.left === null`, we must recurse exclusively on `root.right`. If `root.right === null`, we must recurse exclusively on `root.left`. We only apply `Math.min(left, right)` when **both** children exist.

---

### 2. How do you implement Path Sum II using backtracking in $O(n)$ time?

**Question:** Implement `pathSum(root, targetSum)` to return all root-to-leaf paths whose values sum to `targetSum`, explaining why backtracking prevents allocating arrays on non-matching paths.

**Answer:** 

```javascript
// Node.js code
function pathSum(root, targetSum) {
  const result = [];
  const currentPath = [];

  function dfs(node, remaining) {
    if (!node) return;

    // 1. Choose
    currentPath.push(node.val);
    remaining -= node.val;

    // 2. Check leaf condition
    if (!node.left && !node.right && remaining === 0) {
      result.push([...currentPath]); // Clone valid snapshot
    } else {
      dfs(node.left, remaining);
      dfs(node.right, remaining);
    }

    // 3. Unchoose (Backtrack)
    currentPath.pop();
  }

  dfs(root, targetSum);
  return result;
}
```

**Backtracking Efficiency**:
Instead of passing newly allocated arrays down every branch (`[...path, node.val]`), the algorithm mutates a single shared `currentPath` array on the heap. Rollback (`pop()`) restores state in $O(1)$ time upon return. Clones are created exclusively when a valid leaf path is reached, keeping auxiliary memory strictly at $O(h)$.

---

### 3. What happens in Path Sum III if you forget to decrement the prefix sum map during the unwinding phase?

**Question:** In Path Sum III, what defect occurs if you omit the backtracking step `prefixMap.set(currentSum, prefixMap.get(currentSum) - 1)`? Provide a concrete tree example.

**Answer:** 
Omitting the prefix map decrement corrupts the invariant that the map only contains prefix sums from the **direct vertical path from the root to the current node**.

**Failure Scenario:**
Consider tree:
```text
      10
     /  \
    5   -3
   /
  3
```
Target sum = 8.
1. When traversing down the left branch (`10 -> 5 -> 3`), prefix sums `10`, `15`, and `18` are recorded.
2. Once the left branch finishes and unwinds back to root `10`, traversal begins down the right branch to `-3`.
3. At node `-3`, `currentSum = 10 + (-3) = 7`.
4. If the left branch's prefix sums were not deleted, the map still contains `15`.
5. The algorithm checks `currentSum - target = 7 - 8 = -1`. If an uncle or sibling had prefix `-1`, it would falsely count it.
6. More critically, if another branch hits `currentSum = 23`, it checks `23 - 8 = 15`. It finds `15` in the map and counts a path—even though that prefix `15` belonged to an entirely different, disconnected left subtree!

Failing to backtrack causes prefix sums to leak horizontally across sibling branches, producing false-positive path counts.

---

### 4. How does a build tool or module bundler calculate the maximum dependency depth and diameter of a Node.js project?

**Question:** In tools like Webpack or Vite, explain how tree depth and diameter algorithms are applied to package dependency graphs to optimize bundling.

**Answer:** 
When compiling a Node.js application, the module bundler analyzes `import` statements to construct a Module Dependency Tree:
1. **Maximum Dependency Depth**:
   Determines the nesting level of imported packages. If depth is excessive (e.g., deeply nested micro-packages), the bundler warns of dependency bloat or flattens module scopes (Scope Hoisting) to reduce runtime module resolution overhead.
2. **Diameter Calculation**:
   The diameter represents the longest chain of transitive dependencies between any two peripheral modules. In synchronous CommonJS environments (`require()`), long dependency chains increase cold-start latency. Bundlers use diameter metrics to identify critical paths and split code into asynchronous chunks (`import()`) that load in parallel across the Node.js event loop.

---

<nav aria-label="Lecture navigation">

[Previous: Level-Order Traversal (BFS) and Tree Views](day-32-level-order-traversal-bfs-and-views.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search Trees: CRUD and Validation](day-34-binary-search-trees-crud-and-validation.md)

</nav>
