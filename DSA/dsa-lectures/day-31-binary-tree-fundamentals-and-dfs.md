# Day 31: Binary Tree Fundamentals and Depth-First Search (DFS)

## 1. Learning Outcomes
- Master hierarchical tree structures, terminology (root, leaf, parent, child, depth, height), and binary tree constraints.
- Implement the three classic **Depth-First Search (DFS)** traversals: **Pre-order**, **In-order**, and **Post-order**.
- Understand both recursive and explicit stack-based iterative traversal mechanics in V8 memory.
- Identify how In-order traversal produces sorted output in Binary Search Trees.
- Connect binary tree hierarchy to real-world Node.js concepts: ASTs (Babel/ESLint), DOM parsing, and JSON nested tree processing.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 04 (Recursion & Call Stack), Day 16 (Stack Fundamentals & LIFO), Day 29 (Node Pointer Structures).
- **Navigation**:
  - [Previous: Day 30 - Linked List Fast & Slow Pointers and Reversals](day-30-linked-list-fast-slow-and-reversals.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 32 - Level-Order Traversal (BFS) and Tree Views](day-32-level-order-traversal-bfs-and-views.md)

---

## 3. Core Concepts & Mental Models
A **Binary Tree** is a hierarchical node structure where every node has at most two children (`left` and `right`).

```text
Binary Tree DFS Orders:
         [1]
        /   \
      [2]   [3]
      / \
    [4] [5]

Traversals:
1. Pre-Order  (Root -> Left -> Right): [1, 2, 4, 5, 3]  (Cloning, AST serialization)
2. In-Order   (Left -> Root -> Right): [4, 2, 5, 1, 3]  (Sorted order in BST)
3. Post-Order (Left -> Right -> Root): [4, 5, 2, 3, 1]  (Bottom-up aggregation, deletion)
```

### Call Stack vs. Explicit Stack
Recursive DFS relies on the JavaScript engine's internal execution call stack. For a tree of depth $h$, maximum stack memory is $O(h)$ (where $h = O(\log n)$ for balanced trees, $O(n)$ for skewed/degenerated trees). In deep trees ($>10,000$ depth), recursion causes `RangeError: Maximum call stack size exceeded`; explicit stack arrays on the V8 heap prevent call-stack overflow.

---

## 4. Detailed Technical Explanations

### 4.1 Traversal Invariants
- **Pre-order ($N \rightarrow L \rightarrow R$)**: Processes current node before subtrees. Ideal for deep-copying trees and building prefix expressions.
- **In-order ($L \rightarrow N \rightarrow R$)**: Flattens binary search trees into monotonic ascending order.
- **Post-order ($L \rightarrow R \rightarrow N$)**: Evaluates children before parent. Essential for bottom-up computation (calculating subtree heights, directory disk size, garbage collection).

### 4.2 Iterative In-Order Traversal Pattern
Instead of recursion, simulate the call stack:
1. Push all left children onto stack until hitting `null`.
2. Pop node, process value.
3. Advance pointer to `node.right` and repeat.

### 4.3 Node.js Relevance: Abstract Syntax Trees (ASTs) & File Trees
In Node.js developer tooling (Babel transforms, ESLint rules, TypeScript compiler), source code is parsed into an AST (e.g., ESTree spec). AST visitors execute depth-first traversals using `enter` (pre-order) and `leave` (post-order) hooks to analyze variable scopes, enforce lint rules, or emit transpiled code.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 TreeNode & Recursive DFS Traversals
```javascript
class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// 1. Recursive Pre-Order: Root -> Left -> Right
function preorderTraversal(root) {
  const result = [];
  function dfs(node) {
    if (!node) return;
    result.push(node.val);
    dfs(node.left);
    dfs(node.right);
  }
  dfs(root);
  return result;
}

// 2. Recursive In-Order: Left -> Root -> Right
function inorderTraversal(root) {
  const result = [];
  function dfs(node) {
    if (!node) return;
    dfs(node.left);
    result.push(node.val);
    dfs(node.right);
  }
  dfs(root);
  return result;
}

// 3. Recursive Post-Order: Left -> Right -> Root
function postorderTraversal(root) {
  const result = [];
  function dfs(node) {
    if (!node) return;
    dfs(node.left);
    dfs(node.right);
    result.push(node.val);
  }
  dfs(root);
  return result;
}
```

### 5.2 Iterative In-Order Traversal (Stack-Based)
```javascript
/**
 * Iterative In-order traversal using an explicit stack.
 * Time Complexity: O(n)
 * Space Complexity: O(h) where h is tree height
 */
function inorderIterative(root) {
  const result = [];
  const stack = [];
  let curr = root;

  while (curr !== null || stack.length > 0) {
    // 1. Traverse all the way to the leftmost node
    while (curr !== null) {
      stack.push(curr);
      curr = curr.left;
    }

    // 2. Process node from top of stack
    curr = stack.pop();
    result.push(curr.val);

    // 3. Move to right subtree
    curr = curr.right;
  }

  return result;
}
```

### 5.3 Execution Trace: `inorderIterative` on `[1, 2, 3, 4, 5]`
```text
Tree:
      1
     / \
    2   3
   / \
  4   5

1. Push 1, push 2, push 4. curr hits null. Stack: [1, 2, 4].
2. Pop 4 -> push 4 to result. result: [4]. curr = 4.right (null).
3. Pop 2 -> push 2 to result. result: [4, 2]. curr = 2.right (5).
4. Push 5. curr hits null. Stack: [1, 5].
5. Pop 5 -> push 5 to result. result: [4, 2, 5]. curr = null.
6. Pop 1 -> push 1 to result. result: [4, 2, 5, 1]. curr = 1.right (3).
7. Push 3. curr hits null.
8. Pop 3 -> push 3 to result. result: [4, 2, 5, 1, 3]. Stack empty, curr null. Done!
```

---

## 6. Common Mistakes & Anti-Patterns
- **Stack Overflow via Deep Skewed Trees**: Using recursive DFS on skewed lists ($N = 10^5$) overflows V8's ~10,000 call stack limit. Use iterative stacks when tree height is unbounded.
- **Null Node Checking After Call**: Calling `dfs(node.left)` without checking if `node` is null inside the function body creates repeated branching boilerplate. Maintain `if (!node) return;` at top of function.
- **Accidental O(n^2) Array Concatenation**: Writing `return [...dfs(node.left), node.val, ...dfs(node.right)]` creates intermediate arrays at every step, degrading time to $O(n^2)$. Use a shared accumulator array passed by reference.

---

## 7. Tricky Points & Edge Cases
- **Empty Tree (`root === null`)**: Iterative loops must handle initial `root === null` returning `[]` without error.
- **Single Node Tree**: Stack pushes root, pops immediately, visits null children, returns single-element array.
- **Skewed Line Trees (Degenerate Trees)**: In a degenerate right-skewed tree, tree height $h = n$. Time remains $O(n)$, but memory space becomes $O(n)$ instead of $O(\log n)$.

---

## 8. Practical Engineering Exercises
1. Implement iterative Pre-order traversal using an explicit stack in $O(n)$ time.
2. Implement iterative Post-order traversal using either two stacks or a single stack with a `lastVisited` tracking pointer.

---

## 9. Key Takeaways & Summary
- Binary trees represent hierarchical relationships with at most 2 children per node.
- Pre-order ($N-L-R$), In-order ($L-N-R$), and Post-order ($L-R-N$) dictate node evaluation sequence.
- In-order traversal visits nodes of a Binary Search Tree in strictly ascending order.
- Iterative DFS replaces V8 call stack frames with an array stack on the heap to prevent stack overflow.

---

## 10. Quick Reference Cheat Sheet
| Traversal | Sequence | Primary Use Case | Time | Space (balanced) |
| :--- | :--- | :--- | :--- | :--- |
| **Pre-Order** | Root $\rightarrow$ Left $\rightarrow$ Right | Serialization, AST cloning | $O(n)$ | $O(\log n)$ |
| **In-Order** | Left $\rightarrow$ Root $\rightarrow$ Right | BST sorting, verification | $O(n)$ | $O(\log n)$ |
| **Post-Order** | Left $\rightarrow$ Right $\rightarrow$ Root | Bottom-up calculations, subtree sizing | $O(n)$ | $O(\log n)$ |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: What are the operational differences between traversing a tree using recursion vs. an explicit stack array in Node.js?  
**Hint**: Compare V8 stack frame size and limits to heap object arrays.  
**Expected Answer Shape**: Recursion utilizes the V8 C++ execution call stack. Each frame stores arguments, local variables, and return addresses (~hundreds of bytes), with a fixed limit (typically ~10,000 frames) before throwing `RangeError: Maximum call stack size exceeded`. An explicit stack array allocates references on the V8 dynamic heap, bounded only by available RAM (1.4GB–4GB), allowing traversal of arbitrarily deep trees without stack overflow.

### 2. Code-Writing
**Question**: Write an iterative Post-order traversal using a single stack without allocating a second reverse stack.  
**Hint**: Track a `lastVisited` node pointer to distinguish between ascending from a left child vs. ascending from a right child.  
**Expected Answer Shape**: Push nodes down left path. Look at `stack[stack.length - 1]`. If right child exists and was not just visited (`peek.right !== null && peek.right !== lastVisited`), move `curr = peek.right`. Otherwise, pop node, append `val` to result, set `lastVisited = popped`, and keep `curr = null`.

### 3. Debugging
**Question**: Why does this recursive tree traversal consume quadratic $O(n^2)$ time?  
```javascript
function traverse(node) {
  if (!node) return [];
  return [...traverse(node.left), node.val, ...traverse(node.right)];
}
```  
**Hint**: Consider array spread copying at each recursive frame.  
**Expected Answer Shape**: Array spread (`[...]`) copies every element from left and right sub-arrays into a newly allocated array. For a skewed tree of size $N$, summing $1 + 2 + \dots + N$ copies yields $O(N^2)$ time and massive GC pressure. Pass a shared mutable `result` array or accumulate into an output buffer to maintain linear $O(n)$ time.

### 4. System Design / Tradeoff
**Question**: When building an asynchronous file system crawler in Node.js, would you use DFS or BFS to index 500,000 directories?  
**Hint**: Consider memory footprint for wide shallow trees vs. deep narrow trees.  
**Expected Answer Shape**: In file systems with broad fan-outs (e.g., thousands of subdirectories per parent), BFS holds the entire level in a queue, causing peak memory spikes. DFS memory is proportional to maximum directory depth (usually $<50$), requiring orders of magnitude less memory ($O(h)$ vs $O(w)$). DFS paired with controlled worker concurrency or stream pipelines is preferred for deep tree traversal.

### 5. Tricky / Edge Case
**Question**: Can a binary tree be uniquely reconstructed given only its Pre-order and Post-order traversal arrays? Explain why or why not.  
**Hint**: Consider single-child nodes.  
**Expected Answer Shape**: No. Pre-order and Post-order cannot distinguish whether a single child is a left child or a right child (e.g., parent 1 with child 2: Pre-order is `[1, 2]`, Post-order is `[2, 1]` for both left and right child orientations). A binary tree can only be uniquely reconstructed if given In-order + Pre-order, In-order + Post-order, or if it is a strictly Full Binary Tree where every node has either 0 or 2 children.

### 6. Real-World Node.js Context
**Question**: How does the ESLint AST traversal engine use Depth-First Search to trigger rule callbacks for Node.js projects?  
**Hint**: Think about entering a node and exiting a node.  
**Expected Answer Shape**: ESLint performs DFS over the ESTree AST. As it enters each AST node (Pre-order), it invokes registered visitor methods (e.g., `FunctionDeclaration(node)`). Once all descendants of the node are traversed, it executes the exit hook (Post-order, e.g., `FunctionDeclaration:exit(node)`). This allows rules to collect scope or variable definitions on the way down and validate them on the way up.
