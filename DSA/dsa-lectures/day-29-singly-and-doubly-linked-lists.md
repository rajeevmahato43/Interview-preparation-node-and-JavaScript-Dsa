# Day 29: Singly and Doubly Linked Lists

## 1. Learning Outcomes
- Understand pointer-based dynamic node structures versus contiguous array layouts in V8 memory.
- Implement Singly Linked List and Doubly Linked List with core operations ($O(1)$ head/tail mutation, $O(n)$ access).
- Master the **Dummy Head (Sentinel) Pattern** to eliminate head-boundary null pointer exceptions.
- Implement in-place list reversal ($O(n)$ time, $O(1)$ auxiliary space) without allocating new nodes.
- Solve the two-pointer offset technique: removing the $N$-th node from the end of a list in a single pass.
- Analyze Node.js backend tradeoffs: pointer chasing cache misses vs. array element shifting in high-throughput buffer queues.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 02 (Arrays & Object References), Day 11 (Two Pointers), Day 26–28 (Binary Search).
- **Navigation**:
  - [Previous: Day 28 - Binary Search on Solution Space](day-28-binary-search-on-solution-space.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 30 - Linked List Fast & Slow Pointers and Reversals](day-30-linked-list-fast-slow-and-reversals.md)

---

## 3. Core Concepts & Mental Models
An Array allocates contiguous memory slots; accessing `arr[i]` requires instant arithmetic indexing (`base + i * size`), but `unshift()` shifts $n$ items ($O(n)$). In contrast, a **Linked List** links disconnected heap object nodes via reference pointers.

```text
Singly Linked List:
[Head: 10] ---> [Node: 20] ---> [Node: 30] ---> null

Doubly Linked List:
null <--- [Node: 10] <=====> [Node: 20] <=====> [Node: 30] ---> null
             (prev/next)         (prev/next)        (prev/next)

Dummy Head Technique (Sentinel Node):
[Dummy (val:0)] ---> [Head: 10] ---> [Node: 20] ---> null
  ^ sentinel pointer simplifies deletion of first node
```

### V8 Engine Memory Implication
Each JavaScript object node `{ val, next }` requires V8 heap allocation (~32–48 bytes due to object header, hidden class pointer, and field slots). Iterating through linked lists causes CPU L1/L2 cache misses ("pointer chasing") compared to flat typed arrays. However, linked lists provide guaranteed $O(1)$ insertions/deletions once a node pointer is held.

---

## 4. Detailed Technical Explanations

### 4.1 The Sentinel (Dummy Head) Pattern
When deleting or inserting the head node, normal code requires conditional checks (`if (head === target)`). A dummy head initialized before the real head (`dummy.next = head`) standardizes operations so the target node always has a non-null predecessor (`curr.next = curr.next.next`).

### 4.2 Singly vs. Doubly Linked List Tradeoffs
| Metric | Array | Singly Linked List | Doubly Linked List |
| :--- | :--- | :--- | :--- |
| **Index Access** | $O(1)$ | $O(n)$ | $O(n)$ |
| **Insert/Delete at Head** | $O(n)$ | $O(1)$ | $O(1)$ |
| **Insert/Delete at Tail** | $O(1)$ amortized | $O(1)$ (with tail pointer) | $O(1)$ |
| **Delete Arbitrary Node** | $O(n)$ | $O(n)$ (need predecessor) | $O(1)$ (if node given) |
| **Memory per Element** | Compact contiguous | 1 pointer overhead | 2 pointer overhead |

### 4.3 Node.js Relevance: Connection Pools & LRU Caches
Node.js core libraries (such as `lib/internal/priority_queue.js` or LRU caches) rely on Doubly Linked Lists combined with hash maps. When a network socket or cached database record is accessed, removing and re-attaching it to the head of the list must execute in strictly deterministic $O(1)$ time without reindexing arrays on the event loop.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 ListNode Definition & In-Place Reversal
```javascript
class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

/**
 * Reverses a singly linked list in-place.
 * Time Complexity: O(n) - visits each node once.
 * Space Complexity: O(1) - auxiliary pointers only.
 */
function reverseList(head) {
  let prev = null;
  let curr = head;

  while (curr !== null) {
    const nextTemp = curr.next; // 1. Preserve forward reference
    curr.next = prev;           // 2. Reverse pointer direction
    prev = curr;                // 3. Advance prev
    curr = nextTemp;            // 4. Advance curr
  }

  return prev; // New head of reversed list
}
```

### 5.2 Remove N-th Node From End (One-Pass Fast/Slow Window)
```javascript
/**
 * Removes the nth node from the end of the list using a dummy head.
 * Time Complexity: O(n) single pass
 * Space Complexity: O(1)
 */
function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head);
  let fast = dummy;
  let slow = dummy;

  // Advance fast pointer by n + 1 steps
  for (let i = 0; i <= n; i++) {
    fast = fast.next;
  }

  // Move both until fast hits end; slow stops right before target node
  while (fast !== null) {
    fast = fast.next;
    slow = slow.next;
  }

  // Unlink target node
  slow.next = slow.next.next;

  return dummy.next;
}
```

### 5.3 Execution Trace: `removeNthFromEnd([1, 2, 3, 4, 5], 2)`
```text
List: [dummy:0] -> [1] -> [2] -> [3] -> [4] -> [5] -> null
Target: 2nd from end (node '4')

Step 1: Move fast n+1 = 3 steps -> fast is at [3].
Step 2: Advance fast and slow in tandem:
  fast at [4], slow at [1]
  fast at [5], slow at [2]
  fast at null, slow at [3]
Step 3: slow.next = slow.next.next ([3].next = [5]). Node [4] unlinked.
Result: [1] -> [2] -> [3] -> [5] -> null.
```

---

## 6. Common Mistakes & Anti-Patterns
- **Losing the Next Reference**: Setting `curr.next = prev` before capturing `const nextTemp = curr.next` severs the remaining chain, causing memory leaks and infinite loops.
- **Null Reference on Empty or Single-Node Lists**: Forgetting to check `head === null || head.next === null` before accessing `head.next.val`.
- **Failing to Update Tail in Doubly Linked List**: Updating `next` pointers while omitting `prev` pointers or forgetting `node.prev.next = node.next`.

---

## 7. Tricky Points & Edge Cases
- **Deleting the Head Node**: Handled cleanly with `dummy = new ListNode(0, head); return dummy.next;`.
- **$N$ Equals List Length**: When removing the 1st element of length $N$, `fast` reaches null right after the initial loop; dummy head cleanly unlinks `dummy.next = dummy.next.next`.
- **Circular Reference Garbage Collection**: While modern V8 mark-and-sweep cleans up isolated circular linked lists, active closures retaining any single node will keep the entire chain alive in heap memory.

---

## 8. Practical Engineering Exercises
1. Implement a `DoublyLinkedList` class with `insertHead(val)`, `removeNode(node)`, and `moveToHead(node)` methods.
2. Given two sorted linked lists, implement `mergeTwoLists(l1, l2)` iteratively using a sentinel node in $O(n + m)$ time and $O(1)$ space.

---

## 9. Key Takeaways & Summary
- Arrays offer $O(1)$ index access but costly $O(n)$ front insertions; linked lists offer $O(1)$ pointer rewiring at any known location.
- Always employ a Sentinel (Dummy) Head node whenever list operations might delete or mutate the head reference.
- In-place reversal requires three tracking pointers: `prev`, `curr`, and `nextTemp`.
- Two-pointer offset ($n + 1$ gap) allows single-pass identification of the $N$-th node from the end.

---

## 10. Quick Reference Cheat Sheet
| Operation | Singly Linked List | Doubly Linked List | Standard Array |
| :--- | :--- | :--- | :--- |
| Prepend (`unshift`) | $O(1)$ | $O(1)$ | $O(n)$ |
| Append (`push`) | $O(1)$ (with tail pointer) | $O(1)$ | $O(1)$ amortized |
| Remove Head (`shift`) | $O(1)$ | $O(1)$ | $O(n)$ |
| Remove Given Node | $O(n)$ (needs prev) | $O(1)$ | $O(n)$ |
| Memory Locality | Low (Pointer chasing) | Low (Two pointers) | High (Contiguous cache) |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: Why would you use a Doubly Linked List over an Array in building an LRU Cache in Node.js?  
**Hint**: Focus on node eviction and repositioning time complexities.  
**Expected Answer Shape**: In an LRU Cache, accessing an item requires moving it to the most-recently-used position, and inserting at capacity requires evicting the least-recently-used item. With an Array, removing or shifting an element is $O(n)$ due to reindexing. With a Doubly Linked List paired with a `Map` storing node references, unlinking any node and appending to head/tail is strictly $O(1)$ pointer manipulation.

### 2. Code-Writing
**Question**: Write a function to reverse a singly linked list between positions `left` and `right` (1-indexed) in a single pass.  
**Hint**: Locate the node immediately preceding `left`, then iteratively move subsequent nodes to `left`'s position.  
**Expected Answer Shape**: Use a dummy node. Walk `prev` to node `left - 1`. Set `curr = prev.next`. Over `right - left` iterations: save `next = curr.next`, rewire `curr.next = next.next`, `next.next = prev.next`, `prev.next = next`. Return `dummy.next`.

### 3. Debugging
**Question**: Identify the bug in this code attempting to delete a node given only a direct reference to it (not head):  
```javascript
function deleteNode(node) {
  node = node.next;
}
```  
**Hint**: Reassigning a local variable in JavaScript does not alter the caller's linked list structure.  
**Expected Answer Shape**: In JavaScript, arguments are passed by value of reference. Reassigning `node` only changes local pointer scope. To delete the node without the predecessor: copy the next node's value and bridge over it: `node.val = node.next.val; node.next = node.next.next;` (cannot delete if `node` is the tail).

### 4. System Design / Tradeoff
**Question**: What are the performance and GC implications of managing 1,000,000 items in a JavaScript Linked List versus a TypedArray in Node.js?  
**Hint**: Consider V8 object headers, hidden classes, and GC mark-and-sweep traversal.  
**Expected Answer Shape**: 1,000,000 linked list nodes create 1,000,000 separate V8 heap objects, consuming 32–48MB+ with significant object overhead. During garbage collection, the mark-and-sweep collector must traverse 1,000,000 pointers, inducing latency spikes. A `Float64Array` or `Int32Array` allocates a single contiguous buffer outside the primary GC traversal path with zero per-element pointer overhead and optimal CPU cache prefetching.

### 5. Tricky / Edge Case
**Question**: How do you detect if a singly linked list has a cycle without modifying node values or using auxiliary hash sets?  
**Hint**: Think of two runners moving at different speeds on a circular track.  
**Expected Answer Shape**: Floyd's Cycle-Finding Algorithm (Tortoise and Hare). Initialize `slow = head` and `fast = head`. Advance `slow` by 1 step and `fast` by 2 steps. If `fast` or `fast.next` is null, there is no cycle ($O(n)$ time, $O(1)$ space). If `slow === fast`, a cycle exists.

### 6. Real-World Node.js Context
**Question**: How does Node.js's internal timer list (`setTimeout` / `setInterval`) manage millions of active timers without degrading event loop performance?  
**Hint**: Timers with the exact same timeout duration can be bucketed.  
**Expected Answer Shape**: Node.js groups timers with identical timeouts into linked lists (`TimersList`) indexed by expiration time in a hash table. When a timer fires or is cancelled via `clearTimeout`, removing it from the doubly linked list is $O(1)$. New timers with the same duration are appended to the tail in $O(1)$.
