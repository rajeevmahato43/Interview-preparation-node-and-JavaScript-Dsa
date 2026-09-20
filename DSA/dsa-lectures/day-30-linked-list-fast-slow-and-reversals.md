# Day 30: Linked List Fast & Slow Pointers and Reversals

## 1. Learning Outcomes
- Master **Floyd's Cycle-Finding Algorithm (Tortoise and Hare)** for $O(n)$ time and $O(1)$ space cycle detection.
- Mathematically prove and implement finding the exact start node of a linked list cycle.
- Find the middle node of a linked list in a single pass without computing length beforehand.
- Implement the **Palindrome Linked List** problem in $O(n)$ time and $O(1)$ auxiliary space.
- Solve **Reorder List** ($L_0 \rightarrow L_n \rightarrow L_1 \rightarrow L_{n-1} \dots$) by composing mid-find, reversal, and merge patterns.
- Apply linked list cycle detection concepts to distributed trace parent-loop debugging in Node.js microservices.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 12 (Two Pointers Fast & Slow), Day 29 (Singly & Doubly Linked Lists, in-place reversal).
- **Navigation**:
  - [Previous: Day 29 - Singly and Doubly Linked Lists](day-29-singly-and-doubly-linked-lists.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 31 - Binary Tree Fundamentals and DFS](day-31-binary-tree-fundamentals-and-dfs.md)

---

## 3. Core Concepts & Mental Models
Fast and slow pointers move through a linear or cyclic node sequence at different velocities (typically $1\times$ and $2\times$).

```text
Floyd's Cycle Detection & Cycle Entry:
  Non-cycle path (a)        Cycle perimeter (c)
[1] ---> [2] ---> [3] ---> [4] ---------> [5]
                   ^                       |
                   |                       v
                  [8] <------------------ [6]
                                 Meeting Point: [6]

Mathematical Invariant:
When slow and fast meet inside the cycle:
Distance traveled by fast = 2 * Distance traveled by slow
=> a + k*c + b = 2(a + b) => a = (k-1)*c + (c - b)
Therefore: Moving one pointer to Head and keeping one at Meeting Point,
advancing both at 1x speed guarantees collision precisely at Cycle Start ([3])!
```

---

## 4. Detailed Technical Explanations

### 4.1 Finding List Middle (Odd vs. Even Nodes)
- **Fast pointer step**: `fast = fast.next.next`
- **Slow pointer step**: `slow = slow.next`
- Condition `while (fast !== null && fast.next !== null)`:
  - For odd length (e.g., 5 nodes): `slow` stops exactly on middle (node 3).
  - For even length (e.g., 4 nodes): `slow` stops on second middle (node 3). If first middle is needed, check `fast.next.next !== null`.

### 4.2 Three-Step Pattern for Complex List Mutations
Problems like **Palindrome Linked List** and **Reorder List** decompose cleanly into three re-usable building blocks:
1. **Find Middle**: Use Fast & Slow pointers to locate the split boundary.
2. **Reverse Sub-list**: In-place reverse the second half.
3. **Merge / Compare**: Traverse both halves concurrently to validate or interleave.

### 4.3 Node.js Relevance: Loop Detection in Object Graphs & Event Handlers
In Node.js systems, recursive object serialization (`JSON.stringify`) throws `TypeError: Converting circular structure to JSON`. WeakSet-based or pointer-based cycle detection mirrors Floyd's algorithm to prune loops before serialization. In event-driven distributed telemetry, tracing `parent_span_id` cycles prevents runaway microservice request amplification.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 Detect Cycle Start Node (LeetCode 142)
```javascript
class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

/**
 * Returns the node where the cycle begins, or null if no cycle.
 * Time Complexity: O(n)
 * Space Complexity: O(1)
 */
function detectCycle(head) {
  if (!head || !head.next) return null;

  let slow = head;
  let fast = head;

  // Phase 1: Determine if a cycle exists
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) {
      // Phase 2: Find cycle entry node
      let entry = head;
      while (entry !== slow) {
        entry = entry.next;
        slow = slow.next;
      }
      return entry; // Cycle entry point
    }
  }

  return null; // Fast reached end: no cycle
}
```

### 5.2 Reorder List ($L_0 \rightarrow L_n \rightarrow L_1 \rightarrow L_{n-1} \dots$)
```javascript
/**
 * Reorders list in-place in O(n) time and O(1) space.
 */
function reorderList(head) {
  if (!head || !head.next || !head.next.next) return;

  // 1. Find the middle node
  let slow = head;
  let fast = head;
  while (fast.next !== null && fast.next.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }

  // 2. Reverse the second half
  let prev = null;
  let curr = slow.next;
  slow.next = null; // Sever first half from second half

  while (curr !== null) {
    const nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }

  // 3. Interleave first half (head) and reversed second half (prev)
  let first = head;
  let second = prev;

  while (second !== null) {
    const tmp1 = first.next;
    const tmp2 = second.next;

    first.next = second;
    second.next = tmp1;

    first = tmp1;
    second = tmp2;
  }
}
```

### 5.3 Execution Trace: `reorderList([1, 2, 3, 4, 5])`
```text
Initial: 1 -> 2 -> 3 -> 4 -> 5 -> null
Step 1 (Find Mid): slow stops at 3. Sever: 1 -> 2 -> 3 -> null.
Step 2 (Reverse 2nd half): 4 -> 5 -> null reversed becomes 5 -> 4 -> null.
Step 3 (Interleave):
  Connect 1 -> 5 -> 2
  Connect 2 -> 4 -> 3
  Connect 3 -> null
Result: 1 -> 5 -> 2 -> 4 -> 3 -> null.
```

---

## 6. Common Mistakes & Anti-Patterns
- **Severing Lists Too Late**: In `reorderList` or `isPalindrome`, forgetting to set `slow.next = null` leaves a circular loop between halves, causing infinite loops during traversal.
- **Null Reference on Fast Advance**: Writing `fast = fast.next.next` without verifying both `fast !== null` AND `fast.next !== null`.
- **Failing to Restore Original List**: In palindrome verification, modifying list references without reversing back before returning can introduce side effects to caller services.

---

## 7. Tricky Points & Edge Cases
- **Two-Node Lists**: For `[1, 2]`, `fast.next.next` is immediately null; algorithms must handle short sequences without extra iterations.
- **Fast Advance Step**: If `fast` moves 3 steps instead of 2, cycle detection may miss the collision point depending on cycle parity. 2 steps guarantees collision.
- **Restoring Palindrome List**: When writing production-grade utilities, always reverse the second half back before returning boolean results to prevent mutating shared data.

---

## 8. Practical Engineering Exercises
1. Implement `isPalindrome(head)` that checks whether a linked list reads the same forwards and backwards, ensuring the list is restored to its original structure before function return.
2. Given a linked list with a cycle, calculate the exact **number of nodes inside the cycle** in $O(1)$ space.

---

## 9. Key Takeaways & Summary
- Floyd's Cycle Detection operates in $O(n)$ time and $O(1)$ space using two pointers moving at $1\times$ and $2\times$ rates.
- Cycle entry point is found by moving one pointer to `head` and advancing both at $1\times$ until they meet.
- Splitting, reversing, and interleaving linked lists form the unified tripartite solution for complex list restructuring problems.

---

## 10. Quick Reference Cheat Sheet
| Task | Pointer Technique | Key Invariant |
| :--- | :--- | :--- |
| **Find Middle** | `slow = slow.next`, `fast = fast.next.next` | Loop: `fast && fast.next` |
| **Detect Cycle** | `slow` (1x), `fast` (2x) | Collision: `slow === fast` |
| **Cycle Start** | Reset pointer to `head`, move both 1x | Meet point == Cycle entry |
| **Reorder List** | Split at mid $\rightarrow$ Reverse 2nd $\rightarrow$ Interleave | sever `slow.next = null` |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: Prove mathematically why resetting one pointer to `head` after Floyd's collision point finds the exact cycle entry node.  
**Hint**: Express distances in terms of non-cycle length $a$, cycle perimeter $c$, and meeting point offset $b$.  
**Expected Answer Shape**: Let $a$ be distance from head to cycle start, $b$ be distance from cycle start to meeting point, and $c$ be cycle perimeter. Slow traveled $a + b$. Fast traveled $a + b + k \cdot c$. Because fast travels twice as fast: $2(a + b) = a + b + k \cdot c \implies a + b = k \cdot c \implies a = k \cdot c - b = (k - 1) \cdot c + (c - b)$. Moving one pointer from head ($a$ steps) and the other from meeting point ($c - b$ steps plus whole cycles) guarantees they meet at cycle start.

### 2. Code-Writing
**Question**: Write a function to check if a singly linked list is a palindrome in $O(n)$ time and $O(1)$ space.  
**Hint**: Find mid, reverse second half, compare node values, restore list.  
**Expected Answer Shape**: Find mid with fast/slow pointers. In-place reverse the second half starting at `slow`. Compare values between `head` and reversed second half. Reverse second half again to restore original list integrity. Return true if all matched, else false.

### 3. Debugging
**Question**: Find the bug in this list middle finder:  
```javascript
function findMiddle(head) {
  let slow = head;
  let fast = head;
  while (fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}
```  
**Hint**: What happens if `fast` itself becomes null or the list has an odd number of elements?  
**Expected Answer Shape**: If `fast` lands on null (or list is even length), `fast.next` throws `TypeError: Cannot read properties of null (reading 'next')`. The while condition must guard both: `while (fast !== null && fast.next !== null)`.

### 4. System Design / Tradeoff
**Question**: When implementing an in-memory session token cleanup queue in Node.js, compare using a cyclic linked list vs. a min-heap.  
**Hint**: Consider whether expiration intervals are fixed or variable.  
**Expected Answer Shape**: If all session tokens have identical TTLs (e.g., 30 minutes), a cyclic or linear linked list offers $O(1)$ push to tail and $O(1)$ pop from head, with zero sorting overhead. If TTLs vary dynamically per user, a linked list requires $O(n)$ insertion or re-traversal, whereas a Min-Heap provides $O(\log n)$ inserts and $O(1)$ inspection of the earliest expiring session.

### 5. Tricky / Edge Case
**Question**: How does `fast = fast.next.next` behave if a cycle consists of only 2 nodes? Trace the pointers.  
**Hint**: Trace initial positions, first iteration, second iteration.  
**Expected Answer Shape**: Suppose nodes are 1 and 2, with $1 \rightarrow 2 \rightarrow 1$. Start: `slow = 1`, `fast = 1`. Iteration 1: `slow` moves to 2, `fast` moves $1 \rightarrow 2 \rightarrow 1$ (lands on 1). Iteration 2: `slow` moves to 1, `fast` moves $1 \rightarrow 2 \rightarrow 1$ (lands on 1). `slow === fast` evaluates true on iteration 2, detecting the cycle in 2 steps without infinite loop.

### 6. Real-World Node.js Context
**Question**: You are streaming JSON logs where each log entry contains `{ id, parentId }`. How do you detect circular log dependencies without exhausting Node.js heap memory?  
**Hint**: Avoid storing full object chains in memory; think of pointer or visited ID tracking.  
**Expected Answer Shape**: Process logs as a directed graph. Store only compact 64-bit integer IDs or string hashes in a `Set` or `Map<id, parentId>`. For each root-path verification, walk parent references using Floyd's cycle detection or a depth limit. To prevent heap exhaustion, use an LRU cache or Redis bloom filter for visited IDs across batches rather than holding all parsed log objects in V8 heap memory.
