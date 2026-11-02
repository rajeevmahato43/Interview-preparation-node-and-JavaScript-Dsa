# Day 23: Binary Trees: DFS & Properties

<nav aria-label="Lecture navigation">

[Previous: Grid Backtracking & Mazes](day-22-grid-backtracking-and-n-queens.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Trees: BFS & Views](day-24-binary-trees-bfs-views-and-lca.md)

</nav>

---

## 1. Binary Tree Fundamentals

A **Binary Tree** is a data structure made of connected nodes. Each node holds a value and points to at most two children: a `left` child and a `right` child. Unlike a flat array or a single-file line of cards, trees branch out like an upside-down family tree:

- **Root Node:** The very top node. It has no parent above it.
- **Leaf Node:** A node at the bottom with no children (`left === null` and `right === null`).
- **Depth:** How many steps down from the root to a node (the root has depth 0).
- **Height:** How many steps down from a node to its farthest leaf (a leaf has height 0).

Imagine a company org chart:
- The CEO is at the top (**Root Node**).
- The CEO manages two Vice Presidents. Each VP manages two directors.
- Individual engineers sit at the bottom (**Leaf Nodes**).
- When the CEO sends out an email to all staff, the message flows top-down from boss to worker (**Pre-Order**).
- When planning the yearly team budget, each engineer sends their numbers up to their director. Directors combine the numbers and send them up to their VP. Finally, VPs send the combined total up to the CEO (**Post-Order**).
- The CEO cannot know the total company budget until both VPs finish adding up their teams' numbers!

```javascript
// Definition of a standard Binary Tree Node
class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// Basic recursive Depth-First Search traversals
function preOrder(root, result = []) {
  if (!root) return result;
  result.push(root.val);         // 1. Process Parent First
  preOrder(root.left, result);   // 2. Traverse Left
  preOrder(root.right, result);  // 3. Traverse Right
  return result;
}

function inOrder(root, result = []) {
  if (!root) return result;
  inOrder(root.left, result);    // 1. Traverse Left
  result.push(root.val);         // 2. Process Parent
  inOrder(root.right, result);   // 3. Traverse Right
  return result;
}

function postOrder(root, result = []) {
  if (!root) return result;
  postOrder(root.left, result);  // 1. Traverse Left
  postOrder(root.right, result); // 2. Traverse Right
  result.push(root.val);         // 3. Process Parent Last
  return result;
}

const sampleTree = new TreeNode(1,
  new TreeNode(2, new TreeNode(4), new TreeNode(5)),
  new TreeNode(3)
);

console.log("Pre-Order:", preOrder(sampleTree));   // [ 1, 2, 4, 5, 3 ]
console.log("In-Order:", inOrder(sampleTree));     // [ 4, 2, 5, 1, 3 ]
console.log("Post-Order:", postOrder(sampleTree)); // [ 4, 5, 2, 3, 1 ]
```

### 1.1 Traversal Orders and Mental Models

Tree problems usually follow one of two ways of thinking:

- **Top-Down (Pre-Order):** The parent calculates a value (like `currentSum + node.val`) and passes it down to its children in function arguments.
- **Bottom-Up (Post-Order):** The parent asks: *"If my left child gives me its answer, and my right child gives me its answer, how do I combine them to return my answer to my parent?"*

```text
Pre-Order:    Parent -> Left Subtree -> Right Subtree
In-Order:     Left Subtree -> Parent -> Right Subtree
Post-Order:   Left Subtree -> Right Subtree -> Parent
```

> [!NOTE]
> Self-Check: Why is bottom-up post-order the best way to find height or balance?
> Answer: A parent node cannot know its own height until both of its children finish calculating their heights first.

### 1.2 Iterative DFS and V8 Stack Safety

Node.js gives each thread about 10,000 frames of call stack memory. If an unbalanced tree with 15,000 nodes forms a straight line (every node only has a left child), recursive DFS crashes with `RangeError: Maximum call stack size exceeded`.

In production backends where trees might be huge, use an iterative DFS with a regular JavaScript array on the heap as your stack:

```javascript
// Iterative DFS using heap-allocated array to prevent call stack overflow
function maxDepthIterative(root) {
  if (!root) return 0;

  const stack = [{ node: root, depth: 1 }];
  let maxDepth = 0;

  while (stack.length > 0) {
    const { node, depth } = stack.pop();
    if (depth > maxDepth) maxDepth = depth;

    if (node.left) stack.push({ node: node.left, depth: depth + 1 });
    if (node.right) stack.push({ node: node.right, depth: depth + 1 });
  }

  return maxDepth;
}

const deepRoot = new TreeNode(1);
let current = deepRoot;
for (let i = 2; i <= 12000; i++) {
  current.left = new TreeNode(i);
  current = current.left;
}

console.log("Iterative depth of 12,000 skewed nodes:", maxDepthIterative(deepRoot));
// Output: 12000 (Executes safely without call stack overflow)
```

### 1.3 Operations Reference Table

| Traversal Strategy | Visiting Order | Primary Use Cases | Space Complexity |
| :--- | :--- | :--- | :--- |
| **Pre-Order** | Root $\to$ Left $\to$ Right | Serialization, copying trees, prefix expressions | $O(H)$ stack |
| **In-Order** | Left $\to$ Root $\to$ Right | Binary Search Tree sorted traversal | $O(H)$ stack |
| **Post-Order** | Left $\to$ Right $\to$ Root | Height, diameter, subtree deletion, bottom-up metrics | $O(H)$ stack |
| **Top-Down DFS** | Pass arguments down | Path sum validation, root-to-leaf number generation | $O(H)$ stack |
| **Iterative DFS** | Stack on V8 heap | Large trees ($N > 10^4$) to prevent stack overflow | $O(H)$ heap |

---

## 2. Tree DFS Patterns

### 2.1 Pattern Family

Binary tree DFS problems fall into three structural patterns:

- **Bottom-Up Post-Order Aggregation:** Children return values (height, validity, count) up to the parent. The parent combines these values and returns its own result upward.
- **Side-Effect State Tracking:** During a post-order traversal, the function returns one value up the call chain (such as subtree height), while updating an independent variable (such as maximum diameter) as a side effect.
- **Simultaneous Dual-Pointer DFS:** Two pointers walk two separate tree branches in parallel to check symmetry, structural equality, or matching subtrees.

### 2.2 Pattern Recognition Table

| Problem Keyword Signal | Underlying Problem Need | Recommended Approach |
| :--- | :--- | :--- |
| "Find maximum depth / height of binary tree" | Compute longest path to a leaf | Bottom-up Post-Order DFS |
| "Determine if tree is height-balanced" | Check if $\|H_{left} - H_{right}\| \le 1$ everywhere | Bottom-up DFS with `-1` sentinel early exit |
| "Longest path between any two nodes" | Path may or may not pass through root | Post-order with global diameter tracker |
| "Check if tree is a mirror of itself" | Compare `t1.left` with `t2.right` | Dual-pointer simultaneous DFS |
| "Invert / mirror a binary tree" | Swap child pointers at every node | Pre-order or post-order pointer swap |
| "Check if root-to-leaf path equals target sum" | Accumulate sum from root downward | Top-down Pre-Order DFS |

### 2.3 When to Use vs When NOT to Use

- **Use Tree DFS when:**
  - Calculations depend on recursive subtree properties (height, balance, diameter).
  - You need to check paths from the root down to leaves.
  - You want clean, natural recursive code.
- **When NOT to use Tree DFS:**
  - The problem asks for **level-by-level work** (like printing row by row or finding shortest distance). Use Breadth-First Search (BFS) with a queue instead.
  - The tree might have deep recursion ($N > 10,000$) in single-threaded Node.js without iterative heap protections.

### 2.4 The 10^7 Operations Rule

Standard tree DFS visits each of the $N$ nodes once:
- For $N = 100,000$, an $O(N)$ traversal executes in under 15 milliseconds.
- However, naive implementations that recalculate height top-down at every node degrade to $O(N^2)$, performing $\frac{N(N+1)}{2} \approx 5 \times 10^9$ operations on skewed trees, which locks the Node.js event loop for multiple seconds.

---

## 3. Problem Walkthroughs

### 3.1 Maximum Depth of Binary Tree

#### 3.1.1 Problem Statement
Given the `root` of a binary tree, return its maximum depth. A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.

- **Input:** `root = [3, 9, 20, null, null, 15, 7]`
- **Output:** `3`
- **Constraints:** $0 \le \text{number of nodes} \le 10^4$, $-100 \le Node.val \le 100$.

#### 3.1.2 How to Think About It
Imagine standing at a node in a tree. You ask your left child: "How tall are you?" You ask your right child: "How tall are you?" Your own height is simply 1 plus whichever child is taller. If you hit an empty spot (`null`), the height is 0.

#### 3.1.3 Brute Force Approach & Bottleneck
The basic post-order approach is already mathematically optimal at $O(N)$ time. The naive trap is using a global counter outside the function. If you forget to decrement it when walking back up, or if multiple calls run, your counter gives wrong answers.

#### 3.1.4 The Pattern Insight
Use pure functional bottom-up recursion:
$$\text{depth}(node) = 1 + \max(\text{depth}(node.left), \text{depth}(node.right))$$
The base case is `if (!root) return 0`. Each node returns its answer directly to its caller without maintaining external state.

#### 3.1.5 Pseudocode
```text
function maxDepth(root):
    if root is null:
        return 0
    leftDepth = maxDepth(root.left)
    rightDepth = maxDepth(root.right)
    return 1 + max(leftDepth, rightDepth)
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal Pure Bottom-Up DFS for Maximum Depth
function maxDepth(root) {
  if (!root) return 0;

  const leftDepth = maxDepth(root.left);
  const rightDepth = maxDepth(root.right);

  return 1 + Math.max(leftDepth, rightDepth);
}

const testTree = new TreeNode(3,
  new TreeNode(9),
  new TreeNode(20, new TreeNode(15), new TreeNode(7))
);

console.log("Max Depth:", maxDepth(testTree));
// Output: 3
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Mutating shared global counter across calls
let currentDepth = 0;
let maxD = 0;
function badMaxDepth(root) {
  if (!root) return;
  currentDepth++;
  maxD = Math.max(maxD, currentDepth);
  badMaxDepth(root.left);
  badMaxDepth(root.right);
  currentDepth--; // Forgetting this or concurrent calls corrupts state!
}
```

Relying on mutable shared variables outside the function scope creates race conditions and state leakage across repeated invocations.

#### 3.1.8 Complexity Derivation
- **Time Complexity:** $O(N)$. Every node is visited exactly once.
- **Auxiliary Space Complexity:** $O(H)$, where $H$ is the tree height. In the best case (balanced tree), $H = O(\log N)$. In the worst case (skewed tree), $H = O(N)$ call frames on the stack.

---

### 3.2 Balanced Binary Tree

#### 3.2.1 Problem Statement
Given a binary tree, determine if it is height-balanced. A height-balanced binary tree is defined as a binary tree in which the depth of the two subtrees of every node never differs by more than one:
$$\forall \text{ node } u: |\text{height}(u.left) - \text{height}(u.right)| \le 1$$

- **Input:** `root = [3, 9, 20, null, null, 15, 7]`
- **Output:** `true`
- **Constraints:** $0 \le \text{number of nodes} \le 5,000$.

#### 3.2.2 How to Think About It
Imagine a hanging mobile sculpture above a baby's crib. At every wooden crossbar, the left side and right side must hang at almost equal heights (differing by at most 1). If either side is 2 or more steps lower, the mobile tilts and falls over.

#### 3.2.3 Brute Force Approach & Bottleneck
Compute the height of the left and right subtrees from the root, then recursively call `isBalanced` on both children:

```javascript
function isBalancedNaive(root) {
  if (!root) return true;

  function getHeight(node) {
    if (!node) return 0;
    return 1 + Math.max(getHeight(node.left), getHeight(node.right));
  }

  const leftH = getHeight(root.left);
  const rightH = getHeight(root.right);

  if (Math.abs(leftH - rightH) > 1) return false;

  // Re-traverses entire subtrees for every child!
  return isBalancedNaive(root.left) && isBalancedNaive(root.right);
}
```

The bottleneck is repeated work. For a straight-line tree of $N$ nodes, calling `getHeight()` for every single node runs in $O(N^2)$ time. It visits nodes over and over.

#### 3.2.4 The Pattern Insight
Combine height computation and balance verification into a single bottom-up post-order pass.
1. Check the height of `node.left`. If it returns `-1`, propagate `-1` immediately.
2. Check the height of `node.right`. If it returns `-1`, propagate `-1` immediately.
3. If $|H_{left} - H_{right}| > 1$, return sentinel value `-1` indicating failure.
4. Otherwise, return the true height: $1 + \max(H_{left}, H_{right})$.

#### 3.2.5 Pseudocode
```text
function isBalanced(root):
    function check(node):
        if node is null: return 0
        leftH = check(node.left)
        if leftH == -1: return -1
        rightH = check(node.right)
        if rightH == -1: return -1
        if abs(leftH - rightH) > 1: return -1
        return 1 + max(leftH, rightH)

    return check(root) != -1
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(N) Bottom-Up Balance Check with -1 Sentinel
function isBalanced(root) {
  function checkHeight(node) {
    if (!node) return 0;

    // 1. Check left subtree
    const leftHeight = checkHeight(node.left);
    if (leftHeight === -1) return -1; // Propagate failure immediately

    // 2. Check right subtree
    const rightHeight = checkHeight(node.right);
    if (rightHeight === -1) return -1; // Propagate failure immediately

    // 3. Post-order check at current node
    if (Math.abs(leftHeight - rightHeight) > 1) {
      return -1; // Balance invariant violated!
    }

    // Return height to parent
    return 1 + Math.max(leftHeight, rightHeight);
  }

  return checkHeight(root) !== -1;
}

const balanced = new TreeNode(3,
  new TreeNode(9),
  new TreeNode(20, new TreeNode(15), new TreeNode(7))
);

const unbalanced = new TreeNode(1,
  new TreeNode(2,
    new TreeNode(3, new TreeNode(4), null),
    null
  ),
  null
);

console.log("Tree 1 Balanced:", isBalanced(balanced));   // Output: true
console.log("Tree 2 Balanced:", isBalanced(unbalanced)); // Output: false
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Calling getHeight() separately in each recursive frame
function check(node) {
  if (!node) return true;
  if (Math.abs(getHeight(node.left) - getHeight(node.right)) > 1) return false;
  return check(node.left) && check(node.right);
}
```

Calling `getHeight()` separately leads to $O(N^2)$ quadratic slowdown on unbalanced trees.

#### 3.2.8 Complexity Derivation
- **Time Complexity:** $O(N)$ strictly. Each node is visited once during the post-order traversal.
- **Auxiliary Space Complexity:** $O(H)$ for the call stack, where $H$ is the height of the tree ($O(\log N)$ best case, $O(N)$ worst case).

---

### 3.3 Diameter of Binary Tree

#### 3.3.1 Problem Statement
Given the `root` of a binary tree, return the length of the diameter of the tree. The diameter is the length of the longest path between any two nodes in a tree. This path may or may not pass through the root. The length of a path between two nodes is represented by the number of edges between them.

- **Input:** `root = [1, 2, 3, 4, 5]`
- **Output:** `3` (path `[4, 2, 1, 3]` or `[5, 2, 1, 3]`)
- **Constraints:** $1 \le \text{number of nodes} \le 10^4$, $-100 \le Node.val \le 100$.

#### 3.3.2 How to Think About It
Imagine hiking over mountain peaks. The longest path between any two hikers goes up to some highest peak and down the other side. For any node $u$, the longest path turning at $u$ is the height of its left subtree plus the height of its right subtree: $\text{path} = H_{left} + H_{right}$. Crucially, the highest turning peak might not be the root of the whole tree!

#### 3.3.3 Brute Force Approach & Bottleneck
At every node, compute `maxDepth(node.left) + maxDepth(node.right)`. Recursively call the function on `node.left` and `node.right` to find the maximum over all nodes. This repeats depth calculations at every level, running in $O(N^2)$ time.

#### 3.3.4 The Pattern Insight
A single post-order traversal can simultaneously calculate two distinct values:
1. **The Subtree Height (Returned Value):** $1 + \max(H_{left}, H_{right})$, returned upward so the parent can compute its own height.
2. **The Longest Path Turning at Current Node (Side-Effect):** At any node $u$, $\text{Diameter}_{u} = H_{left} + H_{right}$. We track a running `maxDiameter` variable across the traversal.

#### 3.3.5 Pseudocode
```text
function diameterOfBinaryTree(root):
    maxDiameter = 0

    function calculateHeight(node):
        if node is null: return 0
        leftH = calculateHeight(node.left)
        rightH = calculateHeight(node.right)

        maxDiameter = max(maxDiameter, leftH + rightH)

        return 1 + max(leftH, rightH)

    calculateHeight(root)
    return maxDiameter
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(N) Diameter in Single Post-Order Pass
function diameterOfBinaryTree(root) {
  let maxDiameter = 0;

  function calculateHeight(node) {
    if (!node) return 0;

    // 1. Resolve children heights bottom-up
    const leftHeight = calculateHeight(node.left);
    const rightHeight = calculateHeight(node.right);

    // 2. Longest path where current node is highest turning point
    const diameterThroughNode = leftHeight + rightHeight;
    if (diameterThroughNode > maxDiameter) {
      maxDiameter = diameterThroughNode;
    }

    // 3. Return linear height to parent
    return 1 + Math.max(leftHeight, rightHeight);
  }

  calculateHeight(root);
  return maxDiameter;
}

const tree = new TreeNode(1,
  new TreeNode(2, new TreeNode(4), new TreeNode(5)),
  new TreeNode(3)
);

console.log("Diameter:", diameterOfBinaryTree(tree));
// Output: 3
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Returning diameter instead of height from helper
function badHelper(node) {
  // If the helper returns maxDiameter instead of linear height,
  // the parent cannot extend the branch into a valid straight path!
}
```

The recursive function must return the linear height (the longest path going down a single child branch) to its parent, while updating the diameter as a side effect.

#### 3.3.8 Complexity Derivation
- **Time Complexity:** $O(N)$ strictly. Every node is visited once during the post-order traversal.
- **Auxiliary Space Complexity:** $O(H)$ for the call stack ($O(\log N)$ balanced, $O(N)$ skewed).

---

## 4. Tricky Edge Cases

- **Single Node Tree:** When `root = new TreeNode(1)`, maximum depth is 1 node, but diameter is 0 edges. Clarify whether distance metrics count nodes or edges.
- **Diameter Not Passing Through Root:** In an unbalanced tree where one child branches into two long subtrees, the diameter path turns entirely within that child. Always track `maxDiameter` across all nodes.
- **Skewed Degenerate Trees:** Trees that lean entirely in one direction behave like linked lists. Ensure recursive solutions do not exceed the V8 stack limit on $N > 10,000$.
- **Empty Tree:** When `root === null`, depth is 0, diameter is 0, and balanced check returns `true`.

---

## 5. Summary Cheat Sheet

- **Pre-Order:** Top-down information propagation (`Root -> Left -> Right`).
- **In-Order:** In a Binary Search Tree, traverses values in sorted ascending order (`Left -> Root -> Right`).
- **Post-Order:** Bottom-up aggregation (`Left -> Right -> Root`). Standard choice for computing heights, balances, and diameters.
- **Sentinel Returns:** Using `-1` in height checks prevents redundant recalculations across subtrees.
- **Diameter Formula:** The longest path turning at node $u$ is $H_{left} + H_{right}$, while the value returned to the parent is $1 + \max(H_{left}, H_{right})$.

---

## 6. Practice Problems

### 6.1 Invert Binary Tree

- **Input:** `root = [4, 2, 7, 1, 3, 6, 9]`
- **Output:** `[4, 7, 2, 9, 6, 3, 1]`
- **Constraint:** Invert tree in $O(N)$ time.
- **Hint 1:** Use post-order DFS.
- **Hint 2:** Invert the left child and right child recursively, then swap `root.left` and `root.right`.

### 6.2 Symmetric Tree

- **Input:** `root = [1, 2, 2, 3, 4, 4, 3]`
- **Output:** `true`
- **Constraint:** $1 \le \text{number of nodes} \le 1,000$.
- **Hint 1:** Write a helper `isMirror(t1, t2)`.
- **Hint 2:** If both are null, return `true`. If one is null or values differ, return `false`.
- **Hint 3:** Recurse simultaneously on `isMirror(t1.left, t2.right)` and `isMirror(t1.right, t2.left)`.

### 6.3 Path Sum III

- **Input:** `root = [10, 5, -3, 3, 2, null, 11, 3, -2, null, 1]`, `targetSum = 8`
- **Output:** `3`
- **Constraint:** Nodes do not need to start at root or end at leaf, but must go downward.
- **Hint 1:** Combine tree DFS with the Prefix Sum technique using a `Map`.
- **Hint 2:** Maintain running prefix sum. Check if `map.has(runningSum - targetSum)`.
- **Hint 3:** Backtrack prefix sums from the `Map` when unwinding.

---

<nav aria-label="Lecture navigation">

[Previous: Grid Backtracking & Mazes](day-22-grid-backtracking-and-n-queens.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Trees: BFS & Views](day-24-binary-trees-bfs-views-and-lca.md)

</nav>
