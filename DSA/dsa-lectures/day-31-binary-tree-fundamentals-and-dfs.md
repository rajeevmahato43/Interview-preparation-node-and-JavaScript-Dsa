# Day 31: Binary Tree Fundamentals and Depth-First Search (DFS)

<nav aria-label="Lecture navigation">

[Previous: Linked List Fast & Slow Pointers and Reversals](day-30-linked-list-fast-slow-and-reversals.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Level-Order Traversal (BFS) and Tree Views](day-32-level-order-traversal-bfs-and-views.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Master hierarchical tree structures, terminologies (root, leaf, ancestor, descendant, depth, height), and binary tree constraints.
- Implement the three fundamental **Depth-First Search (DFS)** traversals: **Pre-Order**, **In-Order**, and **Post-Order**.
- Eliminate V8 call stack limits by converting deep recursive tree traversals into iterative stack-based loops on the heap.
- Explain why In-Order traversal strictly produces monotonic ascending sequences on Binary Search Trees.
- Connect binary tree hierarchy to real-world Node.js infrastructure: Abstract Syntax Trees (ASTs in Babel/ESLint) and directory sizing.
- Avoid performance anti-patterns, including quadratic array spreads (`[...left, val, ...right]`) during tree accumulation.

---

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Asymptotic complexity and tree height bounds.
- [Day 04: Recursion and Call Stack](day-04-recursion-and-call-stack.md) — Winding and unwinding stack frames.
- [Day 16: Stack Fundamentals and LIFO Architecture](day-16-stack-fundamentals-and-lifo.md) — LIFO execution and heap arrays.
- [Day 29: Singly and Doubly Linked Lists](day-29-singly-and-doubly-linked-lists.md) — Reference-based node pointer structures.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
| :--- | :--- | :--- |
| **Binary Tree** | A hierarchical data structure consisting of nodes where each node has at most two disjoint child subtrees (`left` and `right`). | The foundational structure for search trees, expression parsers, and priority queues. |
| **Pre-Order Traversal** | Visiting the current node before traversing its left and right subtrees ($N \to L \to R$). | Used for tree cloning, prefix notation, and AST serialization. |
| **In-Order Traversal** | Traversing the left subtree, visiting the current node, and then traversing the right subtree ($L \to N \to R$). | Visits nodes of a Binary Search Tree in strictly non-decreasing sorted order. |
| **Post-Order Traversal** | Traversing both left and right subtrees before visiting the current node ($L \to R \to N$). | Essential for bottom-up computation (e.g., subtree heights, directory sizing, and node deletion). |
| **Degenerate (Skewed) Tree** | A binary tree where each parent node has only one child, reducing the tree topology to a linear linked list. | Degrades search and traversal operations from $O(\log n)$ to $O(n)$ time and space. |

---

## Core Concepts

### 1. Anatomy of a Binary Tree: Properties, Heights, and Bounds

A **Binary Tree** is a connected, acyclic hierarchical graph where a single distinguished node is designated as the `root`, and every node contains at most two children labeled `left` and `right`.

```text
Binary Tree Geometry:
             [ 1 ]            <-- Root (Depth 0, Height 2)
            /     \
         [ 2 ]   [ 3 ]        <-- Internal Nodes (Depth 1, Height 1)
         /   \
       [ 4 ] [ 5 ]            <-- Leaves (Depth 2, Height 0)

Key Definitions:
- Depth of Node: Number of edges from root to the node.
- Height of Node: Number of edges on the longest path from node to a leaf.
- Height of Tree: Height of the root node.
```

#### Height Bounds and Memory Properties
- **Balanced Binary Tree**: For an $n$-node balanced tree, the height satisfies $h = \lfloor \log_2 n \rfloor$. Tree traversals require $O(\log n)$ auxiliary stack memory.
- **Degenerate (Skewed) Tree**: When elements are inserted in monotonic sorted order without balancing, height degrades to $h = n - 1$. Auxiliary stack memory degrades to $O(n)$, threatening V8 call stack overflow.

---

### 2. The Three DFS Traversal Invariants

Depth-First Search (DFS) systematically visits every node in a binary tree by prioritizing depth over breadth. The three classic traversals differ strictly in **when the parent node is processed relative to its children**:

```text
Binary Tree:
         [ 1 ]
        /     \
      [ 2 ]   [ 3 ]
      /   \
    [ 4 ] [ 5 ]

1. Pre-Order  (Node -> Left -> Right): [ 1, 2, 4, 5, 3 ]  (Top-down serialization)
2. In-Order   (Left -> Node -> Right): [ 4, 2, 5, 1, 3 ]  (Sorted order in BST)
3. Post-Order (Left -> Right -> Node): [ 4, 5, 2, 3, 1 ]  (Bottom-up aggregation)
```

```javascript
// Node.js code: The Three Recursive DFS Traversals

class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// ❌ WRONG: Array spread concatenation degrades traversal to O(n^2) time!
function slowInorder(node) {
  if (!node) return [];
  // Allocates and copies new arrays on every single frame!
  return [...slowInorder(node.left), node.val, ...slowInorder(node.right)];
}

// ✅ CORRECT: Accumulate into a shared array reference in linear O(n) time
function preorderTraversal(root) {
  const result = [];
  function dfs(node) {
    if (!node) return;
    result.push(node.val); // 1. Process current node
    dfs(node.left);        // 2. Recurse left
    dfs(node.right);       // 3. Recurse right
  }
  dfs(root);
  return result;
}

function inorderTraversal(root) {
  const result = [];
  function dfs(node) {
    if (!node) return;
    dfs(node.left);        // 1. Recurse left
    result.push(node.val); // 2. Process current node
    dfs(node.right);       // 3. Recurse right
  }
  dfs(root);
  return result;
}

function postorderTraversal(root) {
  const result = [];
  function dfs(node) {
    if (!node) return;
    dfs(node.left);        // 1. Recurse left
    dfs(node.right);       // 2. Recurse right
    result.push(node.val); // 3. Process current node
  }
  dfs(root);
  return result;
}
```

---

### 3. Iterative In-Order Traversal: Eliminating Call Stack Limits

In production Node.js backends, recursive DFS relies on the engine's internal C++ execution call stack. If a tree degenerates into a skewed list with $20,000$ nodes, the runtime throws:
`RangeError: Maximum call stack size exceeded`.

To safely traverse arbitrarily deep trees, simulate the call stack using a **heap-allocated array stack**:
1. Descend leftward as far as possible, pushing every encountered node onto the stack.
2. When the pointer hits `null`, pop the top node from the stack, process its value.
3. Advance the pointer to the popped node's `right` child and repeat the cycle.

```text
Iterative In-Order Trace on Tree:
      1
     / \
    2   3
   / \
  4   5

Step 1: Push 1, push 2, push 4. curr hits null. Stack: [1, 2, 4].
Step 2: Pop 4 -> process 4. curr = 4.right (null).
Step 3: Pop 2 -> process 2. curr = 2.right (5).
Step 4: Push 5. curr hits null. Stack: [1, 5].
Step 5: Pop 5 -> process 5. curr = null.
Step 6: Pop 1 -> process 1. curr = 1.right (3).
Step 7: Push 3. curr hits null.
Step 8: Pop 3 -> process 3. Stack empty, curr null. Done!
Result: [ 4, 2, 5, 1, 3 ]
```

```javascript
// Node.js code: Iterative In-Order Traversal (LeetCode 94)

function inorderIterative(root) {
  const result = [];
  const stack = [];
  let curr = root;

  while (curr !== null || stack.length > 0) {
    // 1. Traverse to the leftmost available node
    while (curr !== null) {
      stack.push(curr);
      curr = curr.left;
    }

    // 2. Pop and process node from stack
    curr = stack.pop();
    result.push(curr.val);

    // 3. Move to right subtree
    curr = curr.right;
  }

  return result;
}
```

---

### 4. AST Visitors and File System Tree Walkers in Node.js

In Node.js developer tooling (Babel transpilers, ESLint analyzers, TypeScript compilers), source code is parsed into an **Abstract Syntax Tree (AST)** conforming to the ESTree specification:

```text
AST Traversal Hook Lifecycle:
                  FunctionDeclaration
                    /              \
           Identifier ('add')    BlockStatement
                                       |
                               ReturnStatement

Babel / ESLint Visitor:
1. enter(node): Pre-Order execution (analyze scope, declare bindings)
2. Traversal descends to children...
3. leave(node): Post-Order execution (validate dead code, emit transformed JavaScript)
```

- **Pre-Order (`enter`)**: Used when parent context must be pushed to a scope tracker before child expressions evaluate.
- **Post-Order (`leave`)**: Used when aggregate analysis (e.g., verifying that all code paths in a function return a value) requires children to complete first.
- **Directory Sizing**: Calculating the total byte size of a folder requires post-order DFS: recursively sum the sizes of all files in all subdirectories before computing the parent folder's total size.

---

## Tricky Points & Edge Cases

1. **Quadratic Array Spread Trap**:
   Writing `return [...dfs(left), val, ...dfs(right)]` copies array elements repeatedly across each tree level. For a skewed tree of size $N$, summing $1 + 2 + \dots + N$ copies yields $O(N^2)$ time complexity and triggers major garbage collection pauses. Always pass a mutable accumulator array.
2. **Empty Tree Base Conditions**:
   Always guard against `root === null` at function entry. Functions returning arrays must return `[]` cleanly without attempting to access `root.val`.
3. **Reconstructing Trees from Traversals**:
   A binary tree **cannot** be uniquely reconstructed from Pre-Order and Post-Order traversals alone because single-child orientations (left vs right) cannot be resolved. Reconstruction requires In-Order paired with Pre-Order, or In-Order paired with Post-Order.

---

## Hands-On Exercise

### Scenario: Single-Stack Iterative Post-Order Traversal

Implement an iterative Post-Order traversal (`postorderIterative`) using a **single explicit stack** without allocating a second reversal stack. You must track a `lastVisited` node pointer to distinguish between ascending from the left child versus ascending from the right child.

### Buggy Code

```javascript
// ❌ BUGGY: Gets trapped in an infinite loop re-visiting the right child
function buggyPostorder(root) {
  const result = [];
  const stack = [];
  let curr = root;

  while (curr !== null || stack.length > 0) {
    while (curr !== null) {
      stack.push(curr);
      curr = curr.left;
    }

    const peek = stack[stack.length - 1];
    // BUG: If peek.right exists, it revisits peek.right indefinitely!
    if (peek.right !== null) {
      curr = peek.right;
    } else {
      result.push(stack.pop().val);
    }
  }

  return result;
}
```

### Acceptance Criteria

1. Evaluates nodes in strict Post-Order ($L \to R \to N$) sequence.
2. Uses a single explicit heap stack in $O(h)$ auxiliary memory without recursive calls.
3. Tracks `lastVisited` to avoid infinite loops when ascending from a processed right child.
4. Verified with comprehensive Node.js assertions testing empty trees, balanced trees, and skewed trees.

### Solution Code

```javascript
// Node.js code: Single-Stack Iterative Post-Order Traversal
const assert = require("assert");

function postorderIterative(root) {
  if (!root) return [];

  const result = [];
  const stack = [];
  let curr = root;
  let lastVisited = null;

  while (curr !== null || stack.length > 0) {
    // 1. Descend left as deep as possible
    while (curr !== null) {
      stack.push(curr);
      curr = curr.left;
    }

    // Inspect the node at the top of the stack
    const peekNode = stack[stack.length - 1];

    // If right child exists and has NOT just been processed, traverse right
    if (peekNode.right !== null && peekNode.right !== lastVisited) {
      curr = peekNode.right;
    } else {
      // Both left and right subtrees have been processed: process peekNode
      result.push(peekNode.val);
      lastVisited = stack.pop(); // Pop and mark as last processed
      curr = null;               // Keep curr null so next loop pops from stack
    }
  }

  return result;
}

// Verification Tests
// Construct tree:
//        1
//       / \
//      2   3
//     / \
//    4   5
const tree = new TreeNode(
  1,
  new TreeNode(2, new TreeNode(4), new TreeNode(5)),
  new TreeNode(3)
);

// Post-Order: [4, 5, 2, 3, 1]
assert.deepStrictEqual(postorderIterative(tree), [4, 5, 2, 3, 1]);

// Edge cases
assert.deepStrictEqual(postorderIterative(null), []);
assert.deepStrictEqual(postorderIterative(new TreeNode(42)), [42]);

console.log("✅ All Iterative Post-Order assertions passed successfully.");
```

### Solution Explanation

1. **The `lastVisited` Invariant**: When inspecting `peekNode`, we can only process `peekNode` if its right child is `null` OR if its right child was the immediately preceding node processed (`peekNode.right === lastVisited`).
2. **State Reset**: Setting `curr = null` after processing a node prevents the algorithm from re-descending into already-visited left subtrees.

---

## Summary

- **DFS Traversals**: Pre-Order ($N-L-R$) for top-down serialization; In-Order ($L-N-R$) for BST sorting; Post-Order ($L-R-N$) for bottom-up calculation.
- **Heap Stack Simulation**: Iterative DFS prevents V8 call stack overflow crashes (`RangeError`) by storing references in an array on the heap.
- **Accumulator Best Practice**: Accumulate values into a single mutable array passed by reference to avoid $O(n^2)$ array spread performance traps.
- **Single-Stack Post-Order**: Requires maintaining a `lastVisited` reference to identify when returning from a right child.
- **Node.js Systems**: Abstract Syntax Tree (AST) visitors in ESLint and Babel mirror Pre-Order (`enter`) and Post-Order (`leave`) DFS hooks.

---

## Cheat Sheet & Common Pitfalls

### DFS Traversal Summary
```javascript
// Recursive Templates
function dfs(node) {
  if (!node) return;
  // Pre-Order:  action(node.val)
  dfs(node.left);
  // In-Order:   action(node.val)
  dfs(node.right);
  // Post-Order: action(node.val)
}

// Iterative In-Order Template
while (curr || stack.length) {
  while (curr) { stack.push(curr); curr = curr.left; }
  curr = stack.pop();
  result.push(curr.val);
  curr = curr.right;
}
```

### Common Pitfalls

| Mistake | Consequence | Correct Pattern |
| :--- | :--- | :--- |
| **`[...dfs(left), val, ...dfs(right)]`** | Degrades traversal runtime to $O(n^2)$. | Pass a shared mutable `result` array. |
| **Recursive DFS on 20,000 nodes** | `RangeError: Maximum call stack size exceeded`. | Use iterative heap stack `while` loop. |
| **Forgetting `lastVisited` in Post-Order** | Infinite loop re-visiting the right child. | Track `lastVisited` node pointer. |
| **Checking null after child recursion** | Boilerplate code duplication across callers. | Guard `if (!node) return;` at top of function. |

---

## Interview Questions

### 1. What are the operational differences between recursive tree traversal and explicit stack traversal in Node.js?

**Question:** Explain the architectural differences in V8 memory allocation between recursive DFS and explicit stack DFS in Node.js, and describe when recursion becomes hazardous.

**Answer:** 
1. **Recursive Traversal**:
   - Executes on the thread's C++ activation stack.
   - Each recursive call creates a new stack frame storing local variables, function arguments, and return addresses (~hundreds of bytes).
   - V8 restricts the execution stack to approximately 1 MB (translating to roughly 10,000 activation frames).
   - If a binary tree is skewed (e.g., $15,000$ nodes arranged linearly), recursion exceeds the stack boundary and throws an unrecoverable `RangeError: Maximum call stack size exceeded`.
2. **Explicit Stack Traversal**:
   - Executes inside a single iterative loop within one activation frame.
   - Nodes are pushed to a standard JavaScript array residing on the **V8 dynamic heap**.
   - The heap is bounded by the Node.js memory limit (1.4 GB to 4 GB+), allowing the stack to hold millions of node pointers safely.
   - Explicit stack traversals provide deterministic execution and immune protection against call stack overflow crashes in production services.

---

### 2. Can a binary tree be uniquely reconstructed given only its Pre-Order and Post-Order traversal arrays?

**Question:** Can a general binary tree be uniquely reconstructed given only its Pre-Order and Post-Order traversal arrays? Explain why or why not with an example.

**Answer:** 
**No**, a general binary tree cannot be uniquely reconstructed using only Pre-Order and Post-Order traversals.

**Reasoning:**
Pre-Order visits $N \to L \to R$, and Post-Order visits $L \to R \to N$. When a node has only a single child, neither traversal provides structural information to determine whether that child is oriented to the **left** or to the **right**.

**Counter-Example:**
Consider two nodes: parent `1` and child `2`.
- **Tree A (Left Child)**: Node `1` has `left = 2`, `right = null`.
  - Pre-Order: `[ 1, 2 ]`
  - Post-Order: `[ 2, 1 ]`
- **Tree B (Right Child)**: Node `1` has `left = null`, `right = 2`.
  - Pre-Order: `[ 1, 2 ]`
  - Post-Order: `[ 2, 1 ]`

Both distinct tree structures generate identical traversal sequences. Unique reconstruction requires either In-Order paired with Pre-Order, In-Order paired with Post-Order, or the guarantee that the tree is a **Full Binary Tree** (where every node has either 0 or 2 children).

---

### 3. Why does array spreading inside a recursive tree traversal produce quadratic $O(n^2)$ time complexity?

**Question:** Analyze the time complexity and memory overhead of this recursive traversal:
```javascript
function traverse(node) {
  if (!node) return [];
  return [...traverse(node.left), node.val, ...traverse(node.right)];
}
```

**Answer:** 
While visiting each tree node appears to take linear time, the array spread operator (`...`) creates a major performance bottleneck:
1. Spread copying iterates through every element of the left and right sub-arrays, copying them one-by-one into a newly allocated array.
2. For an unbalanced or skewed tree of $n$ nodes, the left or right sub-array at depth $k$ contains $k$ elements.
3. Summing the element copies across all frames yields:
   $$1 + 2 + 3 + \dots + n = \frac{n(n + 1)}{2} = O(n^2) \text{ operations}$$
4. In addition to quadratic time complexity, every frame allocates intermediate arrays that are immediately discarded, producing massive heap churn that triggers frequent Garbage Collection latency spikes in Node.js.

**Remedy**: Pass a single shared accumulator array by reference:
```javascript
function traverse(root, acc = []) {
  if (!root) return acc;
  traverse(root.left, acc);
  acc.push(root.val);
  traverse(root.right, acc);
  return acc;
}
```
This restores true linear $O(n)$ time complexity and minimizes allocations.

---

### 4. How does an ESLint rule utilize Depth-First Search to analyze variable scopes and enforce lint rules?

**Question:** In the Node.js developer ecosystem, explain how ESLint AST traversal utilizes Depth-First Search hooks (`enter` and `leave`) to detect undeclared variables.

**Answer:** 
ESLint parses JavaScript into an Abstract Syntax Tree (AST) and traverses it using Depth-First Search:
1. **Pre-Order Hook (`enter`)**:
   As the DFS traverses down into a `BlockStatement` or `FunctionDeclaration`, it triggers the `enter` hook. ESLint pushes a new `Scope` object onto an internal scope stack, registering all parameter names and `var`/`let`/`const` variable declarations.
2. **Subtree Traversal**:
   The DFS traverses through all expressions and statements within that block. Whenever an `Identifier` node is visited, ESLint looks up the identifier in the current scope or parent scopes.
3. **Post-Order Hook (`leave`)**:
   Once all child nodes within the function or block have been visited, the DFS begins unwinding and triggers the `leave` hook. ESLint pops the `Scope` object off the stack, verifying that all declared variables were referenced (e.g., enforcing `no-unused-vars`).

By mapping Pre-Order to scope initialization and Post-Order to scope validation, ESLint accurately models lexical scoping using standard tree DFS mechanics.

---

<nav aria-label="Lecture navigation">

[Previous: Linked List Fast & Slow Pointers and Reversals](day-30-linked-list-fast-slow-and-reversals.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Level-Order Traversal (BFS) and Tree Views](day-32-level-order-traversal-bfs-and-views.md)

</nav>
