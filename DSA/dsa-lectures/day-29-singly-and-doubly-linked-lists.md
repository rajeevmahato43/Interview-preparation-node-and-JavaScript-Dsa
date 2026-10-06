# Day 29: Singly and Doubly Linked Lists

<nav aria-label="Lecture navigation">

[Previous: Binary Search on Solution Space](day-28-binary-search-on-solution-space.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Linked List Fast & Slow Pointers and Reversals](day-30-linked-list-fast-slow-and-reversals.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Contrast heap-allocated dynamic node structures with contiguous array layouts in V8 engine memory.
- Implement Singly and Doubly Linked Lists with $O(1)$ head/tail mutations and understand $O(n)$ access limitations.
- Master the **Dummy Head (Sentinel) Pattern** to eliminate head-boundary null pointer exceptions.
- Implement in-place list reversal ($O(n)$ time, $O(1)$ space) without allocating new nodes.
- Solve the two-pointer offset window pattern: removing the $N$-th node from the end in a single pass.
- Evaluate Node.js backend performance trade-offs: pointer chasing cache misses vs array shifts in LRU caches and connection pools.

---

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Reference vs value semantics and memory.
- [Day 02: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md) — Contiguous array allocations in V8.
- [Day 11: Two Pointers: Opposing Pointers](day-11-two-pointers-opposing.md) — Multi-pointer movement patterns.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
| :--- | :--- | :--- |
| **Singly Linked List** | A linear data structure composed of distinct heap nodes where each node contains a value and a forward reference pointer (`next`). | Enables $O(1)$ insertions and deletions at known pointer locations without shifting elements. |
| **Doubly Linked List** | A linked node structure where each node maintains two pointer references: one to its predecessor (`prev`) and one to its successor (`next`). | Enables $O(1)$ arbitrary node deletion and bi-directional traversal, forming the backbone of LRU caches. |
| **Sentinel (Dummy Head)** | An auxiliary node prepended before the actual head node whose value is arbitrary and never read. | Unifies edge-case operations by ensuring that every valid node—including the real head—always possesses a valid predecessor. |
| **Pointer Chasing** | Iteratively dereferencing scattered memory addresses across the heap to traverse a linked structure. | Induces CPU L1/L2 cache misses, making linked lists substantially slower than flat arrays for sequential iteration. |
| **Offset Window** | Maintaining two pointers separated by an invariant distance of $k$ nodes. | Allows locating elements positioned relative to the end of a list in a single pass without knowing list length. |

---

## Core Concepts

### 1. Pointer-Based Dynamic Structures vs Contiguous Arrays in V8

A **Linked List** is a linear collection of data elements whose order is not dictated by physical memory placement, but rather by explicit reference links stored within each independent node object.

In contrast, JavaScript arrays allocate contiguous backing stores in V8 memory:
- **Array**: `arr[i]` computes memory addresses instantly via direct arithmetic: $\text{Base} + i \times \text{ElementSize}$ in $O(1)$ time. However, prepending an element via `unshift()` forces the engine to shift all $n$ subsequent elements in memory ($O(n)$).
- **Linked List**: Prepending a node is an $O(1)$ pointer assignment (`newNode.next = head; head = newNode`). However, accessing the $i$-th element requires sequentially chasing $i$ object reference pointers across the heap ($O(n)$).

```text
Contiguous Array in V8 Memory:
[ Index 0 (10) ][ Index 1 (20) ][ Index 2 (30) ] -> Contiguous cache line (Fast!)

Singly Linked List in V8 Heap Memory:
Node at 0x1A04 { val: 10, next: 0x4F88 }
                    │
                    ▼ (Pointer chase across heap)
Node at 0x4F88 { val: 20, next: 0x9B12 }
                    │
                    ▼ (Pointer chase across heap)
Node at 0x9B12 { val: 30, next: null }
```

#### V8 Memory Overhead Comparison

In Node.js, each JavaScript object `{ val, next }` consumes ~32–48 bytes due to object headers, hidden class (map) pointers, and property slots. A linked list of 1,000,000 integers consumes ~40 MB of memory and creates 1,000,000 heap objects, stressing V8 mark-and-sweep garbage collection. A typed array (`Int32Array`) of 1,000,000 integers allocates a single contiguous 4 MB buffer with zero GC traversal overhead.

---

### 2. The Sentinel (Dummy Head) Pattern

When modifying a linked list, operations at the `head` node frequently require conditional branches (`if (head === target)`) because the head has no predecessor.
A **Dummy Head (Sentinel Node)** is an artificial node created prior to the real head (`dummy.next = head`).

By prepending a sentinel node:
1. Every valid list node (including the initial head) is guaranteed to have a non-null predecessor.
2. Deleting or inserting the head node uses the exact same pointer assignment logic as any interior node: `prev.next = curr.next`.
3. Returning the updated list is standardized: `return dummy.next;`.

```text
Deleting Head Node (Node 10) Without Dummy:
Must check: if (head.val === 10) head = head.next;

Deleting Head Node With Dummy:
[ Dummy: 0 ] ──────► [ Node: 10 ] ──────► [ Node: 20 ] ──────► null
     ▲                     ▲
    prev                  curr

curr.val === 10 -> prev.next = curr.next ([Dummy].next = [Node 20])
Return dummy.next -> [Node 20] cleanly returned!
```

---

### 3. In-Place Reversal of a Singly Linked List (LeetCode 206)

Given the head of a singly linked list, reverse the list in-place and return the new head.

Reversal requires a **three-pointer coordination dance**:
- `prev`: Tracks the node behind `curr` (initially `null`).
- `curr`: The node currently being redirected.
- `nextTemp`: Caches the forward link before it is overwritten.

```text
Reversal Pointer Lifecycle:
Initial:  null    [ 1 ] ───► [ 2 ] ───► [ 3 ] ───► null
           ▲        ▲
          prev     curr

Step 1: Cache next:      nextTemp = curr.next ([2])
Step 2: Reverse link:    curr.next = prev (null)
Step 3: Advance prev:    prev = curr ([1])
Step 4: Advance curr:    curr = nextTemp ([2])

State after 1 step:
null ◄─── [ 1 ]   [ 2 ] ───► [ 3 ] ───► null
            ▲       ▲
          prev    curr
```

```javascript
// Node.js code: In-Place Singly Linked List Reversal

class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

// ❌ WRONG: Overwriting curr.next before caching nextTemp severs the list!
function brokenReverse(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    curr.next = prev; // FATAL: Rest of the list is lost forever!
    prev = curr;
    curr = curr.next; // Moves curr back to prev (null)!
  }
  return prev;
}

// ✅ CORRECT: Cache forward link before pointer redirection
function reverseList(head) {
  let prev = null;
  let curr = head;

  while (curr !== null) {
    const nextTemp = curr.next; // 1. Cache forward pointer
    curr.next = prev;           // 2. Reverse link
    prev = curr;                // 3. Step prev forward
    curr = nextTemp;            // 4. Step curr forward
  }

  return prev; // New head of reversed list
}
```

---

### 4. The Two-Pointer Offset Window: Remove N-th Node From End (LeetCode 19)

Given the head of a linked list, remove the $n$-th node from the end of the list and return its head in a single pass.

#### The Offset Invariant
1. Create a `dummy` node pointing to `head`.
2. Initialize two pointers: `fast = dummy` and `slow = dummy`.
3. Advance `fast` forward by **$n + 1$ steps**.
4. Advance both `fast` and `slow` together at identical $1\times$ speed until `fast === null`.
5. Because `fast` is exactly $n + 1$ nodes ahead, when `fast` reaches `null`, `slow` stops **immediately before the target node to be deleted**!
6. Unlink the target: `slow.next = slow.next.next`.

```text
List: [Dummy] -> [ 1 ] -> [ 2 ] -> [ 3 ] -> [ 4 ] -> [ 5 ] -> null, n = 2
Target from end: Node 4

1. Advance fast n + 1 = 3 steps:
   [Dummy] -> [ 1 ] -> [ 2 ] -> [ 3 ] -> [ 4 ] -> [ 5 ] -> null
      ▲                           ▲
    slow                         fast

2. Advance fast and slow in tandem until fast reaches null:
   fast at [4], slow at [1]
   fast at [5], slow at [2]
   fast at null, slow at [3]

3. Unlink: slow.next = slow.next.next ([3].next = [5])
Result: [ 1 ] -> [ 2 ] -> [ 3 ] -> [ 5 ] -> null
```

```javascript
// Node.js code: Remove N-th Node From End

function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head);
  let fast = dummy;
  let slow = dummy;

  // Advance fast pointer by n + 1 positions
  for (let i = 0; i <= n; i++) {
    fast = fast.next;
  }

  // Move both until fast passes the tail
  while (fast !== null) {
    fast = fast.next;
    slow = slow.next;
  }

  // Unlink target node
  slow.next = slow.next.next;

  return dummy.next;
}
```

---

## Detailed Node.js Relevance: LRU Caches & Connection Pool Schedulers

In high-concurrency Node.js infrastructure, Doubly Linked Lists paired with Hash Maps form the foundation of **Least Recently Used (LRU) Caches** and **Database Connection Pools**:

```text
LRU Cache Architecture:
HashMap: Key -> DoublyLinkedList Node Pointer (O(1) Access)

Doubly Linked List (Ordering):
[ Head Sentinel ] <===> [ Most Recent ] <===> [ ... ] <===> [ Least Recent ] <===> [ Tail Sentinel ]
```

- **Why Arrays Fail for LRU Caches**:
  Evicting an element from the front of an Array or splicing an element to move it to the tail requires $O(n)$ element copying. In a cache storing 50,000 database records, $O(n)$ shifts on every cache hit block the Node.js event loop.
- **Why Doubly Linked Lists Succeed**:
  With a Doubly Linked List, unlinking any node and prepending it to the head requires updating exactly 4 pointer references (`node.prev.next = node.next; node.next.prev = node.prev; ...`), running in **strictly deterministic $O(1)$ constant time** with zero event-loop blocking.

---

## Tricky Points & Edge Cases

1. **Deleting a Node Given Only Direct Node Reference**:
   In LeetCode 237, you are given only `node` (no `head`). You cannot delete it by modifying predecessor pointers. Instead, copy the next node's data over:
   `node.val = node.next.val; node.next = node.next.next;`. Note: This technique cannot delete the tail node.
2. **Deleting the Head Node When $N = \text{Length}$**:
   Without a dummy node, removing the head requires special handling. With `dummy = new ListNode(0, head)`, removing the head is handled identically to interior nodes.
3. **Circular Reference Closure Leaks**:
   In Node.js, if closures hold active references to a node in a doubly linked list, V8 cannot garbage collect the node or any adjacent nodes connected via `prev` and `next`, creating subtle memory leaks. Always set unlinked node pointers (`node.prev = null; node.next = null;`) to assist garbage collection.

---

## Hands-On Exercise

### Scenario: LRU Cache Doubly Linked List Engine

Build a bare-metal `DoublyLinkedList` container supporting $O(1)$ operations: `addToHead(node)`, `removeNode(node)`, and `removeTail()`. The container must use Sentinel Head and Sentinel Tail nodes to eliminate all null checks.

### Buggy Code

```javascript
// ❌ BUGGY: Missing sentinels causes null pointer exceptions on empty lists
class BuggyDoublyList {
  constructor() {
    this.head = null;
    this.tail = null;
  }

  addToHead(node) {
    // BUG: Fails when list is empty!
    node.next = this.head;
    this.head.prev = node;
    this.head = node;
  }

  removeNode(node) {
    // BUG: Throws TypeError if node is head or tail!
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }
}
```

### Acceptance Criteria

1. Initializes sentinel `head` and sentinel `tail` nodes connected to each other.
2. Implements `addToHead(node)` in $O(1)$ time.
3. Implements `removeNode(node)` in $O(1)$ time without conditional null checks.
4. Implements `removeTail()` returning the evicted node.
5. Verified with strict Node.js assertions testing empty lists, additions, and removals.

### Solution Code

```javascript
// Node.js code: Sentinel Doubly Linked List for LRU Cache
const assert = require("assert");

class DNode {
  constructor(key = 0, val = 0) {
    this.key = key;
    this.val = val;
    this.prev = null;
    this.next = null;
  }
}

class DoublyLinkedList {
  constructor() {
    // Initialize dummy head and dummy tail sentinels
    this.head = new DNode();
    this.tail = new DNode();
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.size = 0;
  }

  addToHead(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
    this.size++;
  }

  removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
    this.size--;
    // Clear references to prevent memory retention
    node.prev = null;
    node.next = null;
    return node;
  }

  removeTail() {
    if (this.size === 0) return null;
    // The least recently used node is immediately before the tail sentinel
    return this.removeNode(this.tail.prev);
  }
}

// Verification Tests
const list = new DoublyLinkedList();
const n1 = new DNode(1, 100);
const n2 = new DNode(2, 200);

list.addToHead(n1);
list.addToHead(n2);
assert.strictEqual(list.size, 2);

// Head's next should be n2 (most recently added)
assert.strictEqual(list.head.next, n2);
assert.strictEqual(list.head.next.next, n1);

// Remove specific node n2
list.removeNode(n2);
assert.strictEqual(list.size, 1);
assert.strictEqual(list.head.next, n1);

// Remove tail
const evicted = list.removeTail();
assert.strictEqual(evicted.key, 1);
assert.strictEqual(list.size, 0);
assert.strictEqual(list.head.next, list.tail);

console.log("✅ All Doubly Linked List assertions passed successfully.");
```

### Solution Explanation

1. **Sentinels**: `head` and `tail` sentinels eliminate all special-case branch logic for empty lists, single-node lists, or boundary mutations.
2. **Zero-Allocation Dereferencing**: `removeNode` unlinks nodes by reassignment alone, guaranteeing $O(1)$ performance and consistent V8 memory usage.

---

## Summary

- **Array vs Linked List**: Arrays offer $O(1)$ index access; Linked Lists offer $O(1)$ pointer insertion/deletion at known nodes.
- **V8 Cache Realities**: Linked lists suffer from pointer chasing cache misses and consume 32–48 bytes per node, while contiguous arrays maximize CPU cache utilization.
- **Dummy Head Pattern**: Always prepend a sentinel node to standardize head mutations and eliminate null boundary bugs.
- **In-Place Reversal**: Cache `nextTemp = curr.next` before redirecting `curr.next = prev`, walking `prev` and `curr` forward.
- **Two-Pointer Offset**: An offset gap of $n + 1$ between `fast` and `slow` locates the predecessor of the $N$-th node from the end in a single pass.

---

## Cheat Sheet & Common Pitfalls

### Linked List Core Patterns
```javascript
// In-Place Reversal
let prev = null, curr = head;
while (curr) {
  const next = curr.next;
  curr.next = prev;
  prev = curr;
  curr = next;
}
return prev;

// Remove N-th from End
const dummy = new ListNode(0, head);
let fast = dummy, slow = dummy;
for (let i = 0; i <= n; i++) fast = fast.next;
while (fast) { fast = fast.next; slow = slow.next; }
slow.next = slow.next.next;
return dummy.next;
```

### Common Pitfalls

| Mistake | Consequence | Correct Pattern |
| :--- | :--- | :--- |
| **Overwriting `curr.next` early** | Severs remaining list; causes infinite loop. | Cache `const next = curr.next` first. |
| **No dummy head on head deletion** | Requires complex edge-case `if` statements. | Prepend `dummy = new ListNode(0, head)`. |
| **Reassigning parameter in deleteNode** | Only modifies local variable; list unchanged. | Copy next node value and skip over it. |
| **Array `shift()` in LRU caches** | $O(n)$ event loop blocking on high cache hits. | Use Doubly Linked List with $O(1)$ pointer unlinking. |

---

## Interview Questions

### 1. Why would you use a Doubly Linked List over an Array in building an LRU Cache in Node.js?

**Question:** In designing an LRU Cache for a Node.js microservice, explain why a Doubly Linked List combined with a Hash Map is preferred over a standard JavaScript Array.

**Answer:** 
An LRU (Least Recently Used) cache requires two primary operations:
1. `get(key)`: Access a cached value and promote it to the most-recently-used position.
2. `put(key, value)`: Insert a new key-value pair, evicting the least-recently-used item if capacity is exceeded.

**Using an Array:**
- Moving an accessed item to the head/tail requires locating it and splicing: `arr.splice(index, 1); arr.push(item);`.
- Splicing requires shifting elements in memory, costing $O(n)$ time.
- For a cache holding 100,000 items, repeated $O(n)$ shifts under high request concurrency block the single-threaded Node.js event loop, causing severe latency spikes.

**Using a Doubly Linked List + Map:**
- The `Map` maps `key` directly to a Doubly Linked List `Node` pointer ($O(1)$ lookup).
- With a direct node reference, unlinking the node from its current position and prepending it to the head sentinel requires updating exactly 4 pointer references (`prev.next` and `next.prev`), executing in strictly deterministic $O(1)$ time.
- Evicting the tail item is also $O(1)$ (`removeNode(tail.prev)`).
- This guarantees $O(1)$ worst-case time for both reads and writes, keeping event loop latency flat.

---

### 2. How do you reverse a singly linked list between positions `left` and `right` in a single pass?

**Question:** Write a function to reverse a singly linked list between positions `left` and `right` (1-indexed, LeetCode 92) in a single pass.

**Answer:** 

```javascript
// Node.js code
function reverseBetween(head, left, right) {
  if (!head || left === right) return head;

  const dummy = new ListNode(0, head);
  let prev = dummy;

  // Step 1: Reach node at position left - 1
  for (let i = 1; i < left; i++) {
    prev = prev.next;
  }

  // curr points to the start of the sublist to reverse
  const curr = prev.next;

  // Step 2: Iteratively insert subsequent nodes directly after prev
  for (let i = 0; i < right - left; i++) {
    const next = curr.next;
    curr.next = next.next;
    next.next = prev.next;
    prev.next = next;
  }

  return dummy.next;
}
```

**Complexity:**
- **Time Complexity**: $O(n)$ single pass.
- **Space Complexity**: $O(1)$ auxiliary pointers.

---

### 3. What is the bug in this attempt to delete a node given only a direct reference to it?

**Question:** Identify the flaw in this code attempting to delete a node from a singly linked list when given only a direct reference to that node:
```javascript
function deleteNode(node) {
  node = node.next;
}
```

**Answer:** 
In JavaScript, object references are passed by value of reference. Reassigning `node = node.next` merely rebinds the local parameter variable `node` inside the function scope to point to the next node object in memory. It makes zero modifications to the actual linked list structure on the heap. The predecessor node still points to the target node.

**Correct Solution:**
Because we do not have a reference to the predecessor node, we cannot unlink the target node directly. Instead, we copy the value from the subsequent node into the current node, and unlink the subsequent node:
```javascript
function deleteNode(node) {
  node.val = node.next.val;
  node.next = node.next.next;
}
```
*Limitation*: This technique cannot delete the tail node, as `node.next` would be `null`.

---

### 4. What are the memory and Garbage Collection implications of storing 1,000,000 items in a Linked List versus a TypedArray in Node.js?

**Question:** Analyze the memory layout and V8 Garbage Collector impact of managing 1,000,000 data items in a Linked List versus an `Int32Array` in a production Node.js service.

**Answer:** 
1. **Memory Footprint**:
   - **Linked List**: Each node is an independent JavaScript object containing a value, a pointer reference, an object header, and a hidden class (map) descriptor. In 64-bit V8, each node consumes approximately 32 to 48 bytes. Storing 1,000,000 items consumes ~40 MB to 48 MB of RAM.
   - **TypedArray (`Int32Array`)**: Allocates raw binary memory. Each 32-bit integer consumes exactly 4 bytes. Storing 1,000,000 items consumes exactly 4 MB of memory ($10\times$ less memory).
2. **Garbage Collection (GC) Pressure**:
   - **Linked List**: Creates 1,000,000 individual heap objects. During V8's Mark-and-Sweep garbage collection cycles, the GC engine must traverse 1,000,000 distinct object pointers to assess reachability, causing major Garbage Collection pauses that stall the event loop.
   - **TypedArray**: Represents a single contiguous ArrayBuffer object. The GC marks a single buffer pointer, reducing GC pause times to sub-millisecond durations.
3. **CPU Cache Locality**:
   - Linked list nodes are scattered across the heap, triggering CPU L1/L2 cache misses on iteration ("pointer chasing").
   - TypedArrays are stored contiguously in memory, maximizing hardware CPU prefetching.

---

<nav aria-label="Lecture navigation">

[Previous: Binary Search on Solution Space](day-28-binary-search-on-solution-space.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Linked List Fast & Slow Pointers and Reversals](day-30-linked-list-fast-slow-and-reversals.md)

</nav>
