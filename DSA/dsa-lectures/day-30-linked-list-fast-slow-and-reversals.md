# Day 30: Linked List Fast & Slow Pointers and Reversals

<nav aria-label="Lecture navigation">

[Previous: Singly and Doubly Linked Lists](day-29-singly-and-doubly-linked-lists.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Tree Fundamentals and DFS](day-31-binary-tree-fundamentals-and-dfs.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Master **Floyd's Cycle-Finding Algorithm (Tortoise and Hare)** for $O(n)$ time and $O(1)$ space cycle detection.
- Mathematically derive and implement finding the exact start node of a linked list cycle (LeetCode 142).
- Find the middle node of a linked list in a single pass across odd and even lengths without computing length beforehand.
- Implement **Palindrome Linked List** (LeetCode 234) in $O(n)$ time and $O(1)$ space while restoring the original list structure.
- Solve **Reorder List** (LeetCode 143) by composing middle-finding, in-place reversal, and alternating pointer interleaving.
- Apply cycle detection principles to distributed trace loops and circular JSON serialization in Node.js backends.

---

## Prerequisites

- [Day 12: Two Pointers: Same-Direction / Fast & Slow](day-12-two-pointers-fast-and-slow.md) — Two pointers with different velocities.
- [Day 29: Singly and Doubly Linked Lists](day-29-singly-and-doubly-linked-lists.md) — Node references and in-place list reversal.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
| :--- | :--- | :--- |
| **Floyd's Cycle Algorithm** | A pointer algorithm where two pointers traverse a sequence at $1\times$ and $2\times$ speeds to detect cyclic loops in $O(1)$ space. | Detects circular references without allocating secondary HashSets that consume memory. |
| **Cycle Entry Point** | The unique node where the linear non-cyclic prefix transitions into the circular loop. | Identified by resetting one pointer to `head` after collision and advancing both at $1\times$ speed. |
| **Midpoint Severing** | Setting `slow.next = null` after locating the middle node to disconnect the first half from the second half. | Prevents circular cross-links and infinite loops when reversing or reordering sublists. |
| **List Interleaving** | Alternating next pointers between two disjoint linked chains ($A_0 \to B_0 \to A_1 \to B_1$). | Solves topological zipper problems like Reorder List without extra array buffers. |
| **Structural Invariant Restoration** | Re-reversing a mutated sublist back to its original configuration before returning from a function. | Prevents unintended side effects when inspecting shared in-memory data structures in production. |

---

## Core Concepts

### 1. Floyd's Cycle-Finding Algorithm & Cycle Entry Proof

**Floyd's Cycle Detection Algorithm** (the Tortoise and Hare) advances two pointers—`slow` at $1$ step per iteration and `fast` at $2$ steps per iteration.
- If the list is acyclic, `fast` reaches `null` in $O(n)$ time.
- If a cycle exists, `fast` enters the cycle first. Since `fast` closes the distance to `slow` by $1$ node on every step, `fast` is mathematically guaranteed to collide with `slow` within one full cycle loop.

```text
Cycle Topology:
Non-cycle length: a       Cycle perimeter: c
[ Head ] ──► ... ──► [ Entry ] ──► ... ──► [ Collision ] ──► ... ──► [ Entry ]
                         ▲                        │
                         └────────────────────────┘
Distance from Entry to Collision: b
Distance from Collision back to Entry: c - b
```

#### The Mathematical Proof of Cycle Entry
1. Let $a$ be the distance from `head` to the cycle entry point.
2. Let $b$ be the distance from cycle entry to the meeting collision point.
3. Let $c$ be the total length (perimeter) of the cycle loop.
4. Total distance traveled by `slow` upon collision:
   $$D_{\text{slow}} = a + b$$
5. Total distance traveled by `fast` upon collision (where $k \ge 1$ is complete loops made by `fast`):
   $$D_{\text{fast}} = a + b + k \cdot c$$
6. Because `fast` moves twice as fast as `slow`:
   $$D_{\text{fast}} = 2 \cdot D_{\text{slow}} \implies a + b + k \cdot c = 2(a + b)$$
   $$a + b = k \cdot c \implies a = k \cdot c - b = (k - 1) \cdot c + (c - b)$$

**The Invariant Result**:
The distance from `head` to the cycle entry point ($a$) is identical to the distance from the collision point to the cycle entry point ($c - b$), plus $(k - 1)$ full cycle loops!
Therefore:
> **If you reset one pointer to `head` and leave the other pointer at the collision point, and then advance both at $1\times$ speed, they are mathematically guaranteed to meet at the exact cycle entry node!**

```javascript
// Node.js code: Linked List Cycle II (LeetCode 142)

class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

function detectCycle(head) {
  if (!head || !head.next) return null;

  let slow = head;
  let fast = head;

  // Phase 1: Detect if a cycle exists
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) {
      // Phase 2: Locate cycle entry node
      let entry = head;
      while (entry !== slow) {
        entry = entry.next;
        slow = slow.next;
      }
      return entry; // Cycle entry point
    }
  }

  return null; // Acyclic: fast reached null
}
```

---

### 2. Finding the Middle Node (Odd vs Even Lengths)

Given a linked list, return the middle node using Fast & Slow pointers in a single pass:
- `slow = slow.next` (1 step)
- `fast = fast.next.next` (2 steps)

```text
Odd-Length List (5 Nodes):
[ 1 ] ──► [ 2 ] ──► [ 3 ] ──► [ 4 ] ──► [ 5 ] ──► null
                      ▲                             ▲
                    slow                           fast
When fast lands on tail [5] (fast.next === null), slow is exactly at [3] (middle)!

Even-Length List (4 Nodes):
[ 1 ] ──► [ 2 ] ──► [ 3 ] ──► [ 4 ] ──► null
                      ▲                   ▲
                    slow                 fast
When fast lands on null, slow is at [3] (second middle)!
```

```javascript
// Node.js code: Middle of the Linked List (LeetCode 876)

function middleNode(head) {
  let slow = head;
  let fast = head;

  // Invariant: fast and fast.next must be non-null before advancing fast.next.next
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }

  return slow;
}
```

---

### 3. Palindrome Linked List: The Three-Step Composition

Given the head of a singly linked list, determine whether it is a palindrome in $O(n)$ time and $O(1)$ space.

```text
The Tripartite Composition Architecture:
Step 1: Find Middle -> Use Fast & Slow pointers to locate midpoint.
Step 2: Reverse 2nd Half -> In-place reverse the sublist starting from midpoint.
Step 3: Compare & Restore -> Walk head and reversed sublist in parallel.
                            Re-reverse sublist before returning to preserve data!
```

```javascript
// Node.js code: Palindrome Linked List with State Restoration (LeetCode 234)

function isPalindrome(head) {
  if (!head || !head.next) return true;

  // Step 1: Find midpoint
  let slow = head;
  let fast = head;
  while (fast.next !== null && fast.next.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }

  // Step 2: Reverse the second half
  let prev = null;
  let curr = slow.next;
  while (curr !== null) {
    const nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }

  // Step 3: Compare first half and reversed second half
  let first = head;
  let second = prev;
  let isPal = true;

  while (second !== null) {
    if (first.val !== second.val) {
      isPal = false;
      break;
    }
    first = first.next;
    second = second.next;
  }

  // Step 4: Restore original list structure (Engineering Best Practice)
  curr = prev;
  prev = null;
  while (curr !== null) {
    const nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }
  slow.next = prev;

  return isPal;
}
```

---

### 4. Reorder List: Interleaving Split Halves (LeetCode 143)

Given a singly linked list:
$$L_0 \to L_1 \to \dots \to L_{n-1} \to L_n$$
Reorder it to:
$$L_0 \to L_n \to L_1 \to L_{n-1} \to L_2 \to L_{n-2} \dots$$
You must mutate nodes in-place without altering node values.

```text
Reorder Pipeline for [ 1, 2, 3, 4, 5 ]:
1. Find Mid & Sever:
   First Half:  [ 1 ] ──► [ 2 ] ──► [ 3 ] ──► null
   Second Half: [ 4 ] ──► [ 5 ] ──► null

2. In-Place Reverse Second Half:
   Reversed:    [ 5 ] ──► [ 4 ] ──► null

3. Interleave Pointers:
   Step 1: Connect 1 -> 5 -> 2
   Step 2: Connect 2 -> 4 -> 3
   Step 3: Connect 3 -> null
Result: 1 -> 5 -> 2 -> 4 -> 3 -> null!
```

```javascript
// Node.js code: Reorder List (LeetCode 143)

function reorderList(head) {
  if (!head || !head.next || !head.next.next) return;

  // 1. Locate midpoint
  let slow = head;
  let fast = head;
  while (fast.next !== null && fast.next.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }

  // 2. Sever first half from second half
  let curr = slow.next;
  slow.next = null; // Invariant: Disconnect list halves to prevent cycles!

  // 3. Reverse second half
  let prev = null;
  while (curr !== null) {
    const nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }

  // 4. Interleave first half (head) and reversed second half (prev)
  let p1 = head;
  let p2 = prev;

  while (p2 !== null) {
    const temp1 = p1.next;
    const temp2 = p2.next;

    p1.next = p2;
    p2.next = temp1;

    p1 = temp1;
    p2 = temp2;
  }
}
```

---

## Detailed Node.js Relevance: Cycle Detection in Microservice Telemetry

In distributed tracing systems (e.g., OpenTelemetry in Node.js), spans maintain references to `parent_span_id`:

```text
Circular Span Reference Bug:
Span A (id: 1, parentId: 3) ◄─── Span C (id: 3, parentId: 2)
           │                                 ▲
           ▼                                 │
Span B (id: 2, parentId: 1) ─────────────────┘
```

- **Production Failure**: If a buggy RPC client introduces a circular trace loop, an aggregator attempting to build the distributed trace tree recursively loops forever, exhausting call stack memory and stalling the event loop.
- **Cycle Detection Application**: Running pointer cycle detection or maintaining a `Set` of visited span IDs intercepts loops before tree aggregation. Similarly, in recursive serialization (`JSON.stringify`), cycle detection prevents `TypeError: Converting circular structure to JSON` crashes.

---

## Tricky Points & Edge Cases

1. **Forgetting to Sever the List at the Midpoint**:
   In `reorderList` and `isPalindrome`, failing to set `slow.next = null` leaves the first half pointing into the second half. When the second half is reversed, this creates a circular loop between halves, causing infinite loops during subsequent traversals.
2. **Missing `fast.next !== null` Guard**:
   Writing `while (fast !== null)` and calling `fast = fast.next.next` throws `TypeError: Cannot read properties of null (reading 'next')` when `fast.next` is null on even-length lists. Both `fast !== null` AND `fast.next !== null` are mandatory.
3. **Two-Node Lists**:
   For `[1, 2]`, `fast.next.next` is immediately null. Ensure edge conditions do not index out of bounds.

---

## Hands-On Exercise

### Scenario: Cycle Length and Entry Node Calculator

In a Node.js message broker, an internal linked buffer may become corrupt and form a cycle. Write a diagnostic utility `analyzeCycle(head)` that detects if a cycle exists, and if so, returns an object containing `{ hasCycle: true, entryNodeVal: X, cycleLength: K }` in $O(1)$ auxiliary space.

### Buggy Code

```javascript
// ❌ BUGGY: Fails on acyclic lists and loops infinitely when calculating length
function buggyAnalyze(head) {
  let slow = head;
  let fast = head;

  // BUG 1: Missing fast.next null guard!
  while (fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) break;
  }

  // BUG 2: Throws if no cycle exists!
  let entry = head;
  while (entry !== slow) {
    entry = entry.next;
    slow = slow.next;
  }

  return { hasCycle: true, entryNodeVal: entry.val };
}
```

### Acceptance Criteria

1. Accurately detects whether a cycle exists without throwing null pointer errors on acyclic lists.
2. If acyclic, returns `{ hasCycle: false, entryNodeVal: null, cycleLength: 0 }`.
3. If cyclic, computes the exact cycle entry node and the exact count of nodes in the cycle.
4. Uses strictly $O(1)$ auxiliary space and verified with Node.js assertions.

### Solution Code

```javascript
// Node.js code: Cycle Analysis Diagnostic Utility
const assert = require("assert");

function analyzeCycle(head) {
  if (!head || !head.next) {
    return { hasCycle: false, entryNodeVal: null, cycleLength: 0 };
  }

  let slow = head;
  let fast = head;
  let collision = null;

  // Phase 1: Detect cycle collision
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) {
      collision = slow;
      break;
    }
  }

  // If fast reached null, list is acyclic
  if (!collision) {
    return { hasCycle: false, entryNodeVal: null, cycleLength: 0 };
  }

  // Phase 2: Find cycle entry node
  let entry = head;
  while (entry !== slow) {
    entry = entry.next;
    slow = slow.next;
  }

  // Phase 3: Calculate cycle length by walking around the cycle once
  let length = 1;
  let walker = entry.next;
  while (walker !== entry) {
    length++;
    walker = walker.next;
  }

  return {
    hasCycle: true,
    entryNodeVal: entry.val,
    cycleLength: length
  };
}

// Verification Tests
// Test 1: Acyclic list: 1 -> 2 -> 3 -> null
const n1 = new ListNode(1, new ListNode(2, new ListNode(3)));
assert.deepStrictEqual(analyzeCycle(n1), { hasCycle: false, entryNodeVal: null, cycleLength: 0 });

// Test 2: Cyclic list: 1 -> 2 -> 3 -> 4 -> points back to 2 (cycle length 3)
const c1 = new ListNode(1);
const c2 = new ListNode(2);
const c3 = new ListNode(3);
const c4 = new ListNode(4);
c1.next = c2;
c2.next = c3;
c3.next = c4;
c4.next = c2; // Cycle back to 2

const analysis = analyzeCycle(c1);
assert.strictEqual(analysis.hasCycle, true);
assert.strictEqual(analysis.entryNodeVal, 2);
assert.strictEqual(analysis.cycleLength, 3);

console.log("✅ All Cycle Analysis assertions passed successfully.");
```

### Solution Explanation

1. **Phase 1 (Collision)**: Fast & slow pointers identify the existence of a cycle using Floyd's algorithm.
2. **Phase 2 (Entry Identification)**: Resetting `entry = head` and moving both `entry` and `slow` at $1\times$ speed converges on the cycle entry point via the $a = (k - 1)c + (c - b)$ invariant.
3. **Phase 3 (Length Count)**: Freezing `entry` and walking `walker` until it completes one full revolution counts the exact number of nodes inside the loop in $O(1)$ space.

---

## Summary

- **Floyd's Algorithm**: Detects cycles in $O(n)$ time and $O(1)$ space by advancing `slow` by 1 and `fast` by 2.
- **Cycle Entry Invariant**: Moving one pointer to `head` and one from collision at $1\times$ rate locates the entry node.
- **Midpoint Detection**: `while (fast && fast.next)` stops `slow` on the exact middle (odd) or second middle (even).
- **Three-Step Composition**: Complex mutations (Palindrome List, Reorder List) decompose into: Find Middle $\to$ Reverse Sublist $\to$ Interleave / Compare.
- **List Severing**: Always set `slow.next = null` after locating the midpoint to prevent circular loops during reordering.

---

## Cheat Sheet & Common Pitfalls

### Fast & Slow Invariants
```javascript
// Find Middle
let slow = head, fast = head;
while (fast !== null && fast.next !== null) {
  slow = slow.next;
  fast = fast.next.next;
}

// Cycle Detection & Entry
while (fast && fast.next) {
  slow = slow.next; fast = fast.next.next;
  if (slow === fast) {
    let entry = head;
    while (entry !== slow) { entry = entry.next; slow = slow.next; }
    return entry;
  }
}
return null;
```

### Common Pitfalls

| Mistake | Consequence | Correct Pattern |
| :--- | :--- | :--- |
| **Omitting `slow.next = null`** | Circular loops and infinite traversal in reorder/palindrome. | Sever the first half: `slow.next = null`. |
| **Missing `fast.next !== null` guard** | `TypeError: Cannot read properties of null` on even lists. | `while (fast !== null && fast.next !== null)`. |
| **Mutating list permanently in Palindrome** | Leaves input list corrupted for caller services. | Re-reverse second half back before returning. |
| **Advancing fast by 3 steps** | May skip collision depending on cycle length parity. | Always advance fast by exactly 2 steps. |

---

## Interview Questions

### 1. Why does resetting one pointer to `head` after collision mathematically find the cycle entry node?

**Question:** Mathematically prove why resetting one pointer to `head` and advancing both pointers at $1\times$ speed after Floyd's collision point guarantees they will meet at the cycle entry node.

**Answer:** 
Let:
- $a = \text{distance from head to cycle entry node}$
- $b = \text{distance from cycle entry to collision point}$
- $c = \text{total circumference (perimeter) of the cycle}$

When `slow` and `fast` collide:
1. `slow` has traveled distance:
   $$D_{\text{slow}} = a + b$$
2. `fast` has traveled distance:
   $$D_{\text{fast}} = a + b + k \cdot c \quad (\text{where } k \ge 1 \text{ is total loops executed by fast})$$
3. Because `fast` travels at twice the speed of `slow`:
   $$D_{\text{fast}} = 2 \cdot D_{\text{slow}} \implies a + b + k \cdot c = 2(a + b)$$
   $$a + b = k \cdot c \implies a = k \cdot c - b = (k - 1) \cdot c + (c - b)$$

**Interpretation:**
The distance $a$ (from `head` to cycle entry) is mathematically identical to $(c - b)$ (the remaining distance from the collision point to the cycle entry), plus $(k - 1)$ complete circular loops.
Therefore, if we place pointer $P_1$ at `head` and pointer $P_2$ at the collision point, and advance both at identical $1\times$ speed, $P_1$ walks $a$ steps to reach the entry point, while $P_2$ walks $(c - b)$ steps (plus optional full cycles) to arrive at the exact same entry node simultaneously.

---

### 2. How do you verify whether a linked list is a palindrome in $O(1)$ space without destroying the list structure?

**Question:** Implement palindrome verification for a singly linked list in $O(n)$ time and $O(1)$ auxiliary space, ensuring that the original linked list is fully restored before returning.

**Answer:** 

```javascript
// Node.js code
function isPalindrome(head) {
  if (!head || !head.next) return true;

  // 1. Locate middle
  let slow = head;
  let fast = head;
  while (fast.next !== null && fast.next.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }

  // 2. Reverse second half
  let prev = null;
  let curr = slow.next;
  while (curr !== null) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }

  // 3. Compare values
  let p1 = head;
  let p2 = prev;
  let isPal = true;
  while (p2 !== null) {
    if (p1.val !== p2.val) {
      isPal = false;
      break;
    }
    p1 = p1.next;
    p2 = p2.next;
  }

  // 4. Restore original list by re-reversing
  curr = prev;
  prev = null;
  while (curr !== null) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  slow.next = prev;

  return isPal;
}
```

---

### 3. What happens if `fast = fast.next.next` is evaluated on a cycle containing only 2 nodes?

**Question:** Trace the exact pointer steps of Floyd's Cycle Detection when the cycle consists of only 2 nodes: $1 \to 2 \to 1$.

**Answer:** 
Let nodes be $N_1$ and $N_2$ where $N_1.\text{next} = N_2$ and $N_2.\text{next} = N_1$.
1. **Initial State (Iteration 0)**:
   - `slow` = $N_1$
   - `fast` = $N_1$
2. **Iteration 1**:
   - `slow` advances $1$ step: `slow` = $N_1.\text{next} = N_2$.
   - `fast` advances $2$ steps: $N_1 \to N_2 \to N_1$. Thus, `fast` = $N_1$.
   - Check `slow === fast`: $N_2 === N_1$ is `false`.
3. **Iteration 2**:
   - `slow` advances $1$ step: `slow` = $N_2.\text{next} = N_1$.
   - `fast` advances $2$ steps: $N_1 \to N_2 \to N_1$. Thus, `fast` = $N_1$.
   - Check `slow === fast`: $N_1 === N_1$ is `true`!

**Outcome**:
Collision occurs on Iteration 2. Even for the minimum cycle length of 2, the algorithm detects the cycle without infinite loops or null reference exceptions.

---

### 4. How do you prevent circular dependency loops in streaming JSON logs without exhausting Node.js heap memory?

**Question:** A Node.js microservice streams millions of log events containing `{ id, parentId }`. How do you detect circular log dependencies without allocating full graph models in V8 memory?

**Answer:** 
Allocating an entire in-memory graph of 10 million logs creates millions of V8 heap objects, triggering GC pressure and Out-Of-Memory crashes.

**Production Solution:**
1. **Compact Key Map**: Store only primitive 64-bit integer IDs or string hashes in a `Map<id, parentId>` or Redis hash instead of buffering full log payload objects.
2. **Floyd's Algorithm on Ad-Hoc Chains**: When validating an event chain, follow parent pointers using Tortoise and Hare:
   ```javascript
   let slow = event.parentId;
   let fast = event.parentId ? parentMap.get(event.parentId) : null;
   while (fast && parentMap.has(fast)) {
     if (slow === fast) throw new Error("Circular dependency detected");
     slow = parentMap.get(slow);
     const nextFast = parentMap.get(fast);
     fast = nextFast ? parentMap.get(nextFast) : null;
   }
   ```
3. **Bounded Depth & LRU Cache**: Enforce a maximum hierarchy depth (e.g., depth 50) and evict ancient completed event paths from an LRU cache, keeping active heap allocations bounded to $O(1)$ space.

---

<nav aria-label="Lecture navigation">

[Previous: Singly and Doubly Linked Lists](day-29-singly-and-doubly-linked-lists.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Tree Fundamentals and DFS](day-31-binary-tree-fundamentals-and-dfs.md)

</nav>
