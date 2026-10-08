# Day 41: Binary Heap and Array Representation

<nav aria-label="Lecture navigation">
  <a href="day-40-topological-sort-kahns-and-dfs.md">◀ Day 40: Topological Sort: Kahn's Algorithm and DFS</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-42-min-heap-and-max-heap-implementation.md">Day 42: Min-Heap and Max-Heap Implementation ▶</a>
</nav>

---
## Prerequisites

- [Day 02: Arrays, Sets, Maps, and Hash Tables](day-02-arrays-sets-maps-and-hash-tables.md) — Contiguous array allocation, cache lines, and memory buffers.
- [Day 31: Binary Tree Fundamentals and DFS](day-31-binary-tree-fundamentals-and-dfs.md) — Tree terminology, depth, height, and complete vs. full binary trees.
- [Day 40: Topological Sort: Kahn's Algorithm and DFS](day-40-topological-sort-kahns-and-dfs.md) — Dependency hierarchies and queue-driven traversal.
---

## 1. Complete Binary Tree and Implicit Array Mapping

> **Complete Binary Tree**: A binary tree where every level except possibly the last is completely filled, and all leaf nodes on the last level are as far left as possible.

A **Binary Heap** is a complete binary tree stored implicitly inside a flat, contiguous 1D array. Because a complete binary tree has no missing intermediate nodes at any level and fills its bottom level strictly from left to right, its nodes can be mapped 1-to-1 to array indices without storing left or right child pointers.

```text
Complete Binary Tree vs. Flat Array Representation:

Tree Structure:
                Index 0: [ 2 ]
                       /       \
         Index 1: [ 4 ]         Index 2: [ 7 ]
                 /     \               /
   Index 3: [ 10 ]     Index 4: [ 8 ]  Index 5: [ 15 ]

Flat Contiguous Array View:
+----+----+----+----+----+----+
| 2  | 4  | 7  | 10 | 8  | 15 |
+----+----+----+----+----+----+
  0    1    2    3    4    5

Notice: No holes, no gaps, no null pointers!
```

---

## 2. 0-Indexed Arithmetic Indexing Formulas

In JavaScript, arrays are natively 0-indexed. Given a node located at array index $i$:
1. **Parent Index**:
   $$\text{parent}(i) = \lfloor \frac{i - 1}{2} \rfloor = (i - 1) \gg 1$$
2. **Left Child Index**:
   $$\text{left}(i) = 2i + 1 = (i \ll 1) + 1$$
3. **Right Child Index**:
   $$\text{right}(i) = 2i + 2 = (i \ll 1) + 2$$

```text
Index Calculation Verification:
Node at Index 1 (Value = 4):
- Parent:      Math.floor((1 - 1) / 2) = 0   -> Value = 2
- Left Child:  2 * 1 + 1 = 3                 -> Value = 10
- Right Child: 2 * 1 + 2 = 4                 -> Value = 8

Node at Index 2 (Value = 7):
- Parent:      Math.floor((2 - 1) / 2) = 0   -> Value = 2
- Left Child:  2 * 2 + 1 = 5                 -> Value = 15
- Right Child: 2 * 2 + 2 = 6 (Out of Bounds! No right child exists)
```

---

## 3. Min-Heap vs. Max-Heap vs. Binary Search Tree (BST)

A common interview trap is confusing a Binary Heap with a Binary Search Tree (BST).
- **BST Invariant**: For every node $x$, all keys in the left subtree are smaller than $x$, and all keys in the right subtree are larger than $x$. Searching takes $O(\log n)$ average time.
- **Heap Invariant**: There is **no ordering relationship** between the left child and right child! In a Min-Heap, both children are simply $\ge$ the parent. Searching for an arbitrary key requires an exhaustive $O(n)$ scan.

```text
BST (Sorted In-Order) vs. Min-Heap (Weak Partial Order):

Valid BST:                              Valid Min-Heap:
          (5)                                     (2)
        /     \                                 /     \
      (2)     (8)                             (4)     (3)
     /   \       \                           /   \   /
   (1)   (4)     (9)                       (8)  (10)(7)

In-order traversal of BST:              In-order traversal of Heap:
1, 2, 4, 5, 8, 9 (Strictly Sorted)      8, 4, 10, 2, 7, 3 (NOT Sorted!)
```

| Property | Binary Search Tree (BST) | Binary Heap |
| :--- | :--- | :--- |
| **Ordering** | Total horizontal order: $\text{left} < \text{root} < \text{right}$ | Partial vertical order: $\text{parent} \le \text{children}$ |
| **Underlying Storage** | Linked nodes `{ val, left, right }` | Flat contiguous array `[val, val, ...]` |
| **Root Value** | Median or arbitrary insertion order | Strictly Minimum (Min-Heap) or Maximum (Max-Heap) |
| **Arbitrary Search** | $O(\log n)$ average | $O(n)$ exhaustive linear scan |
| **Find Min/Max** | $O(\log n)$ traverse left/right spine | $O(1)$ inspect index 0 |

---

## 4. Cache Locality and V8 Heap Architecture

In Node.js, storing 1,000,000 nodes as objects:
```javascript
// ❌ Pointer-based tree node:
class TreeNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}
```
Each object requires a 32-to-48 byte V8 object header, plus pointers to left and right children. Traversing the tree requires pointer chasing across disjoint memory addresses, causing frequent CPU L1/L2 cache misses.

In contrast, an array-backed heap stored in an `Int32Array`:
```javascript
// ✅ Array-backed heap in flat memory:
const heap = new Int32Array(1000000);
```
Consumes exactly 4 bytes per element. Elements are contiguous in physical RAM, allowing CPU hardware prefetchers to load entire cache lines (typically 64 bytes = 16 integers) in a single CPU memory cycle.

---

## 5. Linear Time Heap Validation

Validating whether an array represents a valid Min-Heap requires checking that for every node $i$, its children (if they exist) are $\ge \text{heap}[i]$.
**Optimization**: Leaf nodes have no children. Any node with index $i \ge \lfloor n / 2 \rfloor$ is guaranteed to be a leaf node! Thus, we only need to inspect parent nodes from index $0$ to $\lfloor n / 2 \rfloor - 1$.

```javascript
// Node.js code: Binary Heap Property Validator
/**
 * Verifies if an array satisfies the Min-Heap property.
 * Time Complexity: O(n)
 * Space Complexity: O(1)
 * @param {number[]} arr
 * @returns {boolean}
 */
function isValidMinHeap(arr) {
  const n = arr.length;
  if (n <= 1) return true;

  // Last parent node is at index Math.floor((n - 2) / 2)
  const lastParent = (n - 2) >> 1;

  for (let i = 0; i <= lastParent; i++) {
    const left = (i << 1) + 1;
    const right = (i << 1) + 2;

    // Check left child
    if (left < n && arr[left] < arr[i]) {
      return false;
    }

    // Check right child
    if (right < n && arr[right] < arr[i]) {
      return false;
    }
  }

  return true;
}

console.log('Is valid [2, 4, 7, 10, 8, 15]:', isValidMinHeap([2, 4, 7, 10, 8, 15])); // true
console.log('Is valid [10, 4, 7]:', isValidMinHeap([10, 4, 7])); // false (root 10 > child 4)
```

---

## Detailed Node.js Relevance

### `libuv` Timer Heap Architecture in the Node.js Event Loop

In Node.js, thousands of timers (`setTimeout`, `setInterval`) can be created concurrently across active network requests.

```text
Node.js libuv Timer Min-Heap:
                     [Expires: 10:00:01] (Index 0)
                        /             \
    [Expires: 10:00:04]                 [Expires: 10:00:02]
         /         \
[Expires: 10:00:08] [Expires: 10:00:05]
```

1. **Event Loop Timers Phase**: At the start of every event loop tick, `libuv` checks `heap[0].dueTime`.
   - If `heap[0].dueTime > now`, no timer has expired. The runtime immediately advances to the I/O polling phase in $O(1)$ time without scanning thousands of other scheduled timers!
   - If `heap[0].dueTime <= now`, it extracts the root, fires the timer callback, and repeats until the next scheduled timer is in the future.
2. **Insertion Cost**: Registering a new `setTimeout` takes $O(\log n)$ to insert into the binary heap, ensuring scalable timer management even under tens of thousands of concurrent network connections.

---

## Tricky Points & Edge Cases

1. **The 0-Indexed Bitwise Division Pitfall**:
   ```javascript
   // ❌ SUBTLE BUG: When i = 0, (0 - 1) >> 1 in JavaScript bitwise arithmetic:
   // -1 >> 1 evaluates to -1, NOT 0!
   const parent = (0 - 1) >> 1; // -1
   // Always guard root: if (i === 0) return;
   ```
2. **Array Slicing / Subtree Isolation**:
   In a pointer tree, subtrees are isolated object references. In an array heap, a node's left subtree is **interleaved** with other nodes across the array. You cannot simply slice `arr.slice(left, right)` to extract a subtree.
3. **Array Out-Of-Bounds Checks on Children**:
   Always verify `(2 * i + 1) < n` before accessing `arr[2 * i + 1]`. In JavaScript, accessing an out-of-bounds index returns `undefined`. Comparing `undefined < arr[i]` evaluates to `false`, which can silently hide invalid heap violations!

---

## Hands-On Exercise

### Scenario
You are building an event scheduling engine for a Node.js microservice. You receive an array representing a scheduled event heap where each event is `{ id: string, runAt: number }`. Write a validation utility `auditTimerHeap(events)` that:
1. Returns `{ isValid: boolean, violationIndex: number | null }`.
2. If invalid, identifies the **first** array index where the Min-Heap ordering property is violated (i.e., child `runAt` is strictly less than parent `runAt`).
3. Handles empty arrays and single-event arrays as valid.

### Buggy Code
```javascript
function auditTimerHeap(events) {
  // BUG: Inspects beyond leaf nodes, accesses undefined
  for (let i = 0; i < events.length; i++) {
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    // BUG: Missing bounds check leads to undefined comparison bugs
    if (events[left].runAt < events[i].runAt) {
      return { isValid: false, violationIndex: left };
    }
    if (events[right].runAt < events[i].runAt) {
      return { isValid: false, violationIndex: right };
    }
  }
  return { isValid: true, violationIndex: null };
}
```

### Acceptance Criteria
- Guard against accessing indices $\ge \text{events.length}$.
- Correctly identify violations without crashing on leaf nodes.
- Maintain $O(n)$ time complexity and $O(1)$ auxiliary space.

### Solution Code
```javascript
const assert = require('assert');

// Node.js code: Timer Min-Heap Auditor
/**
 * @param {Array<{ id: string, runAt: number }>} events
 * @returns {{ isValid: boolean, violationIndex: number | null }}
 */
function auditTimerHeap(events) {
  const n = events.length;
  if (n <= 1) {
    return { isValid: true, violationIndex: null };
  }

  // Only check internal parent nodes up to (n - 2) >> 1
  const lastParent = (n - 2) >> 1;

  for (let i = 0; i <= lastParent; i++) {
    const parentTime = events[i].runAt;
    const left = (i << 1) + 1;
    const right = (i << 1) + 2;

    // Validate left child
    if (left < n) {
      if (events[left].runAt < parentTime) {
        return { isValid: false, violationIndex: left };
      }
    }

    // Validate right child
    if (right < n) {
      if (events[right].runAt < parentTime) {
        return { isValid: false, violationIndex: right };
      }
    }
  }

  return { isValid: true, violationIndex: null };
}

// Verification & Automated Unit Tests
// Test 1: Valid Min-Heap
const validSchedule = [
  { id: 'job-1', runAt: 100 },
  { id: 'job-2', runAt: 200 },
  { id: 'job-3', runAt: 150 },
  { id: 'job-4', runAt: 300 },
  { id: 'job-5', runAt: 250 }
];
assert.deepStrictEqual(auditTimerHeap(validSchedule), { isValid: true, violationIndex: null });

// Test 2: Left child violation (index 1 has runAt 50 < root 100)
const invalidScheduleLeft = [
  { id: 'job-1', runAt: 100 },
  { id: 'job-2', runAt: 50 },
  { id: 'job-3', runAt: 150 }
];
assert.deepStrictEqual(auditTimerHeap(invalidScheduleLeft), { isValid: false, violationIndex: 1 });

// Test 3: Right child violation (index 2 has runAt 80 < root 100)
const invalidScheduleRight = [
  { id: 'job-1', runAt: 100 },
  { id: 'job-2', runAt: 120 },
  { id: 'job-3', runAt: 80 }
];
assert.deepStrictEqual(auditTimerHeap(invalidScheduleRight), { isValid: false, violationIndex: 2 });

// Test 4: Single element and empty arrays
assert.deepStrictEqual(auditTimerHeap([]), { isValid: true, violationIndex: null });
assert.deepStrictEqual(auditTimerHeap([{ id: 'a', runAt: 10 }]), { isValid: true, violationIndex: null });

console.log('✅ All Timer Heap Auditor assertions passed successfully!');
```

### Solution Explanation
1. **Parent Boundary Invariant**: Because any index $> \lfloor (n - 2) / 2 \rfloor$ is guaranteed to be a leaf node with no children, stopping the loop at `lastParent` guarantees no unneeded checks are performed.
2. **Explicit Bounds Protection**: `if (left < n)` and `if (right < n)` prevent accessing out-of-bounds indices, avoiding `TypeError: Cannot read properties of undefined (reading 'runAt')`.
3. **$O(n)$ Linear Bound**: Inspects each internal node once, achieving strict $O(n)$ time complexity.

---

## Summary

- A **Binary Heap** is a complete binary tree implemented as a flat contiguous 1D array.
- **Index Arithmetic**: For any index $i$, its parent is $\lfloor (i - 1) / 2 \rfloor$, left child is $2i + 1$, and right child is $2i + 2$.
- **Heap Invariants**: In a Min-Heap, every parent is $\le$ its children. Unlike BSTs, there is no relative ordering between left and right siblings.
- **Memory & Cache Locality**: Flat arrays eliminate object pointer overhead, minimize V8 heap fragmentation, and maximize CPU cache line efficiency.
- **Node.js Internals**: The `libuv` event loop uses a Min-Heap to query timer expirations in $O(1)$ time at the start of each tick.

---

## Cheat Sheet & Common Pitfalls

| Concept | Formula / Property | Pitfall |
| :--- | :--- | :--- |
| **Parent Index** | `(i - 1) >> 1` | At root $i = 0$, formula evaluates to `-1` |
| **Left Child** | `(i << 1) + 1` | Forgetting to verify `left < array.length` |
| **Right Child** | `(i << 1) + 2` | Forgetting to verify `right < array.length` |
| **Internal Nodes Count** | Indices $0 \dots \lfloor (n - 2) / 2 \rfloor$ | Looping through all $n$ indices causes undefined reads |
| **BST vs. Heap** | Heap does NOT sort horizontally | Assuming in-order traversal of heap yields sorted order |

---

## Interview Questions

### 1. Why does an array-backed binary heap require the tree to be complete?
**Question:** Why must a binary tree be complete in order to be represented efficiently as an array without explicit child pointers?

**Answer:**
A binary tree must be **complete** because completeness guarantees that there are no gaps or missing nodes between the root and the final element on the bottom level.
1. When a tree is complete, mapping nodes level-by-level from left to right yields a contiguous sequence of array indices $0, 1, 2, \dots, n - 1$.
2. The index arithmetic formulas ($\text{left} = 2i + 1$, $\text{right} = 2i + 2$) rely directly on this contiguous packing.
3. If the tree were incomplete (e.g., a skewed tree where each node only has a right child), representing it in an array would require empty "gap" slots (`null` or `undefined`) for all missing nodes. A skewed tree of depth $h$ would require an array of size $2^h - 1$ to store just $h$ nodes—wasting exponential $O(2^h)$ memory.

---

### 2. Can you perform an arbitrary search in a Binary Heap in $O(\log n)$ time?
**Question:** Can you search for an arbitrary target value in a Binary Min-Heap in $O(\log n)$ time? Why or why not?

**Answer:**
No. Searching for an arbitrary value in a Binary Heap takes **$O(n)$ linear time**.
- A Binary Search Tree maintains a total horizontal order ($\text{left} < \text{root} < \text{right}$), which allows you to discard half of the remaining tree at each step.
- A Binary Heap only enforces a vertical partial order ($\text{parent} \le \text{children}$). There is no ordering relationship between the left child and right child, nor between nodes on the same level.
- Knowing that target $X > \text{root}$ provides zero information about whether $X$ resides in the left subtree, the right subtree, or neither. Consequently, an algorithm must inspect all nodes in the worst case, requiring an exhaustive $O(n)$ search.

---

### 3. How does `libuv` handle timer cancellation in its Min-Heap?
**Question:** When you call `clearTimeout(timerId)` in Node.js, how does `libuv` remove a timer from the middle of its Min-Heap, and what is the time complexity?

**Answer:**
When an active timer is canceled via `clearTimeout`:
1. `libuv` locates the timer's node within its internal Min-Heap. Because timer handle objects store their current array index directly (`timer->heap_index`), finding the node takes $O(1)$ time without searching.
2. The node is removed by swapping it with the **last element** in the heap array and decrementing the heap size.
3. Depending on the swapped value relative to its new neighbors, the node either bubbles up or bubbles down to restore the Min-Heap property.
4. **Complexity**: Total removal time is strictly $O(\log n)$.

---

### 4. What are the trade-offs of 0-indexed vs. 1-indexed heap arrays?
**Question:** Compare 0-indexed and 1-indexed array representations for binary heaps in terms of formula simplicity and JavaScript language semantics.

**Answer:**
- **1-Indexed Representation**:
  - Formulas: $\text{parent}(i) = \lfloor i / 2 \rfloor$, $\text{left}(i) = 2i$, $\text{right}(i) = 2i + 1$.
  - Pros: Slightly cleaner arithmetic (no `i - 1` offset).
  - Cons: Index 0 is left empty (dummy slot). In typed arrays (e.g., `Int32Array`), this wastes 1 element.
- **0-Indexed Representation**:
  - Formulas: $\text{parent}(i) = \lfloor (i - 1) / 2 \rfloor$, $\text{left}(i) = 2i + 1$, $\text{right}(i) = 2i + 2$.
  - Pros: Aligns natively with standard 0-indexed JavaScript arrays and typed arrays without wasting slot 0 or risking off-by-one errors when interfacing with external libraries.
  - Standard in JavaScript production code and interview questions.

---

<nav aria-label="Lecture navigation">
  <a href="day-40-topological-sort-kahns-and-dfs.md">◀ Day 40: Topological Sort: Kahn's Algorithm and DFS</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-42-min-heap-and-max-heap-implementation.md">Day 42: Min-Heap and Max-Heap Implementation ▶</a>
</nav>
