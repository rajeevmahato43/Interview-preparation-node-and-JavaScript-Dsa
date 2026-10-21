# Day 12: Linked List Reversals & Cycle Detection

<nav aria-label="Lecture navigation">

[Previous: Singly & Doubly Linked Lists](day-11-singly-and-doubly-linked-lists.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Stacks & Expression Parsing](day-13-stacks-and-expression-parsing.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Asymptotic complexity ($O(1)$ auxiliary space constraint).
- [Day 07: Two Pointers: Fast & Slow](day-07-two-pointers-fast-slow-and-partitioning.md) — Relative speed and cycle convergence fundamentals.
- [Day 11: Singly & Doubly Linked Lists](day-11-singly-and-doubly-linked-lists.md) — Node references, pointer rewiring, and dummy sentinel nodes.

---

## 1. What is Linked List Reversal and Cycle Detection?

In a singly linked list, each node points only forward. **Reversal** is the process of inverting every `next` pointer so that the original tail becomes the new head, and the original head points to `null`.
A **Cycle** occurs when a node's `next` pointer points back to a previously visited node instead of terminating at `null`, causing any standard traversal loop to run infinitely.

> **Pointer Inversion**: Changing a node's `next` reference to point to its predecessor rather than its successor.

> **Floyd's Tortoise and Hare Algorithm**: A cycle detection algorithm that uses two pointers moving at different speeds ($1\times$ and $2\times$) to detect loops in $O(n)$ time and $O(1)$ space.

> **Cycle Entry Point**: The specific node in a cyclic linked list where the loop begins (the target of the backward-pointing cycle pointer).

### Everyday Physical Analogies

#### Reversal: Turning Around a Conga Line
Imagine people in a conga line holding the shoulders of the person in front of them:
1. Person 1 holds Person 2's shoulders, Person 2 holds Person 3's shoulders.
2. To reverse the line without anyone moving from their spots:
   - Person 1 lets go and places their hands at their sides (points to `null`).
   - Person 2 turns around and holds Person 1's shoulders.
   - Person 3 turns around and holds Person 2's shoulders.
3. The person formerly at the back is now the leader (**New Head**)!

#### Cycle Detection: Two Runners on a Circular Track
Imagine two runners on a circular stadium track:
- Runner S (Slow) runs at 1 meter per second.
- Runner F (Fast) runs at 2 meters per second.
- If the track is a straight path with a dead end, Runner F reaches the end first, and both stop.
- If the path loops back into itself (a cycle), Runner F will inevitably "lap" Runner S from behind. The moment they occupy the exact same physical spot, a cycle is guaranteed!

```text
REVERSAL FLOW:
Initial:   [ 1 ] ──► [ 2 ] ──► [ 3 ] ──► null
Reversed:  null ◄── [ 1 ] ◄── [ 2 ] ◄── [ 3 ]

CYCLE DETECTION FLOW:
[ Head ] ──► [ Node A ] ──► [ Entry Node ] ──► [ Node B ]
                                  ▲                   │
                                  │                   ▼
                              [ Node D ] ◄──────── [ Node C ]
```

---

## 2. How Reversal & Cycle Detection Work Step-by-Step

### 1. The 3-Pointer Iterative Reversal Engine

To reverse a list in-place without losing references, we maintain three pointers sliding forward together:
- `prev`: Tracks the node behind us (initially `null`).
- `curr`: Tracks the node we are currently inverting (initially `head`).
- `nextTemp`: Temporarily holds `curr.next` so we don't lose the rest of the list when we sever `curr.next`.

#### Step-by-Step Trace: Reversing `1 -> 2 -> 3 -> null`
```text
Initial State:
  prev = null
  curr = Node(1)

Iteration 1:
  1. Save forward path: nextTemp = curr.next (Node 2)
  2. Invert pointer:    curr.next = prev (null)     [ null <- 1 ]
  3. Advance prev:      prev = curr (Node 1)
  4. Advance curr:      curr = nextTemp (Node 2)

Iteration 2:
  1. Save forward path: nextTemp = curr.next (Node 3)
  2. Invert pointer:    curr.next = prev (Node 1)   [ null <- 1 <- 2 ]
  3. Advance prev:      prev = curr (Node 2)
  4. Advance curr:      curr = nextTemp (Node 3)

Iteration 3:
  1. Save forward path: nextTemp = curr.next (null)
  2. Invert pointer:    curr.next = prev (Node 2)   [ null <- 1 <- 2 <- 3 ]
  3. Advance prev:      prev = curr (Node 3)
  4. Advance curr:      curr = nextTemp (null)

Termination:
  curr is null. Return prev (Node 3 is the new Head)!
```

```javascript
// Definition of a ListNode
class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

// ✅ CORRECT: Iterative 3-pointer reversal
function reverseList(head) {
  let prev = null;
  let curr = head;

  while (curr !== null) {
    const nextTemp = curr.next; // 1. Save forward link
    curr.next = prev;           // 2. Reverse link
    prev = curr;                // 3. Slide prev forward
    curr = nextTemp;            // 4. Slide curr forward
  }

  return prev; // New head
}

// ❌ ANTI-PATTERN: Forgetting to save forward link creates an infinite loop
function buggyReverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    curr.next = prev; // Severed link!
    prev = curr;
    curr = curr.next; // BUG: curr.next was just set to prev! Infinite loop!
  }
  return prev;
}
```

---

### 2. Floyd's Cycle Detection Mechanics

Floyd's algorithm uses two pointers:
- `slow` advances 1 node per iteration (`slow = slow.next`).
- `fast` advances 2 nodes per iteration (`fast = fast.next.next`).

#### Why They Must Meet
1. If no cycle exists, `fast` or `fast.next` hits `null` in $O(n/2)$ steps.
2. If a cycle exists, both pointers will eventually enter the cycle.
3. Once both are inside a cycle of length $C$, the relative distance between `fast` and `slow` decreases by exactly **1 node per step**:
   $$\text{Relative Speed} = 2 - 1 = 1 \text{ node/tick}$$
4. Because the gap decreases by 1 on every iteration, `fast` cannot skip over `slow`. They must land on the exact same node within at most $C$ iterations.

```text
CYCLIC CONVERGENCE:
Tick 0: Distance = d
Tick 1: Distance = d - 1
Tick 2: Distance = d - 2
...
Tick d: Distance = 0  --> Collision! (slow === fast)
```

```javascript
// ✅ CORRECT: Floyd's Cycle Detection with null safety
function hasCycle(head) {
  let slow = head;
  let fast = head;

  while (fast !== null && fast.next !== null) {
    slow = slow.next;       // 1 step
    fast = fast.next.next;  // 2 steps

    if (slow === fast) {
      return true; // Cycle detected
    }
  }

  return false; // Reached end of list; no cycle
}

// ❌ ANTI-PATTERN: Unsafe fast.next.next check crashes on odd-length lists
function buggyHasCycle(head) {
  let slow = head, fast = head;
  // BUG: If fast.next is null, fast.next.next throws TypeError!
  while (fast !== null) {
    slow = slow.next;
    fast = fast.next.next; // CRASH!
    if (slow === fast) return true;
  }
  return false;
}
```

---

### 3. Finding the Cycle Entry Point

Detecting a cycle tells you *that* a cycle exists. But *where* does the cycle start?

#### The Mathematical Derivation
Let:
- $L$ = Distance from `head` to the cycle entry node.
- $x$ = Distance from the cycle entry node to the meeting point.
- $C$ = Total length of the cycle loop.

When `slow` and `fast` collide:
- Distance traveled by `slow` = $L + x$.
- Distance traveled by `fast` = $L + x + k \cdot C$ (where $k \ge 1$ is the number of full loops `fast` completed).

Because `fast` travels at twice the speed of `slow`:
$$2(L + x) = L + x + k \cdot C$$
$$L + x = k \cdot C$$
$$L = k \cdot C - x = (k - 1)C + (C - x)$$

#### The Intuition:
$(C - x)$ is the remaining distance from the meeting point back to the cycle entry node!
Therefore, the distance from `head` to the entry node ($L$) equals the distance from the meeting point to the entry node ($C - x$).
- **The Procedure**:
  1. Once `slow === fast`, leave `slow` at the meeting point.
  2. Reset another pointer `ptr` back to `head`.
  3. Move both `ptr` and `slow` forward at the **same speed of 1 step per tick**.
  4. The exact node where they collide is the **Cycle Entry Node**!

```text
HEAD TO ENTRY EQUIVALENCE:
head ─── L steps ───► [ Entry ] ─── x steps ───► [ Meeting Point ]
                           ▲                               │
                           └─────── (C - x) steps ─────────┘
```

---

## 3. Pattern Recognition of Reversals & Cycles

### Problem Triggers and Keywords

| Problem Keyword | Underlying Requirement | Recommended Strategy |
| :--- | :--- | :--- |
| **"Reverse linked list"** | Invert direction of links. | 3-pointer iterative (`prev`, `curr`, `nextTemp`). |
| **"Reverse sublist from M to N"** | Invert specific window. | Sentinel Dummy + In-place sublist head insertion. |
| **"Palindrome linked list"** | Compare first half with reversed second half. | Fast/slow to find middle $\to$ reverse second half. |
| **"Detect circular dependency"** | Detect closed loops without hash maps. | Floyd's Tortoise and Hare (`slow`, `fast`). |
| **"Find beginning of cycle"** | Find entry node in $O(1)$ space. | Floyd's Phase 1 (collision) + Phase 2 (walk from head). |
| **"Find duplicate number ($1$ to $n$)"** | Array indices mapped as pointers. | Floyd's cycle detection on virtual array graph. |

### The $10^7$ Rule for Cycles
- Traversing a list of $n = 10^5$ nodes with Floyd's algorithm takes at most $2n$ steps ($\approx 2 \times 10^5$ operations), running in under $10\text{ms}$ in Node.js.
- Using a `Set` to store visited node references takes $O(n)$ heap memory. For $10^6$ nodes, this allocates $\approx 80\text{MB}$ of heap memory. Floyd's algorithm uses **$O(1)$ space** (zero memory allocation).

---

## 4. Problem 1: Reverse Linked List (LeetCode 206)

### Problem Statement
Given the `head` of a singly linked list, reverse the list, and return the reversed list's head.

```text
Input: head = [1, 2, 3, 4, 5]
Output: [5, 4, 3, 2, 1]

Input: head = [1, 2]
Output: [2, 1]

Input: head = []
Output: []
```

### Step 1: Physical Simulation
Imagine 5 index cards placed on a desk: `[ 1 ] -> [ 2 ] -> [ 3 ] -> [ 4 ] -> [ 5 ] -> null`.
1. You have a marker labeled `prev` pointing to nothing (`null`).
2. Your left hand points to Card `1` (`curr`).
3. If you immediately draw an arrow from `1` to `prev`, you disconnect Card `1` from Card `2`, losing the rest of the cards!
4. **Fix**: Before changing Card `1`'s arrow, put your right hand on Card `2` (`nextTemp = curr.next`).
5. Now safely draw Card `1`'s arrow backward to `prev`.
6. Slide `prev` to Card `1`. Slide `curr` to Card `2` (where your right hand was waiting).
7. Repeat until your left hand falls off the end of the desk (`curr === null`).
8. The card under `prev` is Card `5` — your new head!

### Step 2: Brute Force Approach
Push all node values into an array, reverse the array, then overwrite the linked list's node values:

```javascript
function reverseListBrute(head) {
  const vals = [];
  let curr = head;
  while (curr) { vals.push(curr.val); curr = curr.next; }
  vals.reverse();
  curr = head;
  for (const v of vals) { curr.val = v; curr = curr.next; }
  return head;
}
```
- **Time Complexity**: $O(n)$ — Two linear passes over $n$ items.
- **Space Complexity**: $O(n)$ — Auxiliary array buffer. Fails if node objects themselves must be preserved.

### Step 3: Bottleneck
Where is the CPU sweating?
We are allocating an $O(n)$ auxiliary array buffer simply to remember order. The nodes already exist and hold references; we only need to reverse the links in place.

### Step 4: The Pattern Discovery
A sliding 3-pointer window (`prev`, `curr`, `nextTemp`) reverses links in a single pass using **$O(1)$ memory**.

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: In-place iterative 3-pointer reversal
function reverseList(head) {
  let prev = null;
  let curr = head;

  // Invariant: 'prev' is the head of the reversed prefix; 'curr' is the head of the unreversed suffix
  while (curr !== null) {
    const nextTemp = curr.next; // Preserve remaining list
    curr.next = prev;           // Invert pointer backward
    prev = curr;                // Advance prev to current
    curr = nextTemp;            // Advance curr to next
  }

  return prev; // 'prev' now points to the original tail, which is the new head
}

// ❌ ANTI-PATTERN: Recursive reversal causes call stack overflow on large lists
function recursiveReverseList(head) {
  if (!head || !head.next) return head;
  const newHead = recursiveReverseList(head.next);
  head.next.next = head;
  head.next = null;
  return newHead; // BUG on n > 10,000: RangeError: Maximum call stack size exceeded!
}

// Helpers
function createList(arr) {
  let dummy = new ListNode(0), tail = dummy;
  for (const x of arr) { tail.next = new ListNode(x); tail = tail.next; }
  return dummy.next;
}

function toArray(head) {
  const res = [];
  while (head) { res.push(head.val); head = head.next; }
  return res;
}

// Example test runs
console.log(toArray(reverseList(createList([1, 2, 3, 4, 5])))); // [ 5, 4, 3, 2, 1 ]
console.log(toArray(reverseList(createList([1, 2]))));          // [ 2, 1 ]
console.log(toArray(reverseList(createList([]))));              // []
```

- **Time Complexity**: $O(n)$ — Single pass visiting each node exactly once.
- **Space Complexity**: $O(1)$ — Only three reference pointer variables.

---

## 5. Problem 2: Linked List Cycle II (Find Cycle Start - LeetCode 142)

### Problem Statement
Given the `head` of a linked list, return the **node where the cycle begins**. If there is no cycle, return `null`.
Do not modify the linked list. Solve it using **$O(1)$ auxiliary space**.

```text
Input: head = [3, 2, 0, -4], pos = 1 (tail connects to node index 1)
Output: Node with value 2

Input: head = [1, 2], pos = 0 (tail connects to node index 0)
Output: Node with value 1

Input: head = [1], pos = -1 (no cycle)
Output: null
```

### Step 1: Physical Simulation
Imagine an access road leading into a roundabout:
- Road length from gate (`head`) to roundabout entrance (`entry`): 3 km.
- Roundabout circumference: 5 km.
- Runner S (1 km/h) and Runner F (2 km/h) start at the gate.
- They both enter the roundabout and collide at a milestone 2 km past the entrance.
- **How to find the entrance without measuring?**
  - Leave Runner S at the milestone.
  - Send a new walker from the gate at 1 km/h.
  - Advance Runner S forward through the roundabout at 1 km/h.
  - Both reach the roundabout entrance at the exact same moment!

### Step 2: Brute Force Approach
Traverse the list and record every visited node's reference in a `Set`:

```javascript
function detectCycleBrute(head) {
  const visited = new Set();
  let curr = head;
  while (curr !== null) {
    if (visited.has(curr)) return curr; // First repeated reference is the entry!
    visited.add(curr);
    curr = curr.next;
  }
  return null;
}
```
- **Time Complexity**: $O(n)$ — Set lookups are $O(1)$.
- **Space Complexity**: $O(n)$ — Allocates memory for $n$ object references in heap.

### Step 3: Bottleneck
Where is the CPU sweating?
Storing $10^6$ node references in a `Set` wastes dozens of megabytes of heap memory. We must detect the cycle with zero heap allocation.

### Step 4: The Pattern Discovery
Use **Floyd's 2-Phase Algorithm**:
- **Phase 1**: Move `slow` by 1 and `fast` by 2 until they collide. If `fast` hits `null`, there is no cycle.
- **Phase 2**: Reset a pointer `ptr = head`. Move both `ptr` and `slow` by 1 step per tick. Their intersection is the exact cycle entry node.

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: Floyd's 2-Phase Cycle Entry Detection in O(1) space
function detectCycle(head) {
  let slow = head;
  let fast = head;
  let hasCycle = false;

  // Phase 1: Detect cycle and identify meeting point
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) {
      hasCycle = true;
      break;
    }
  }

  if (!hasCycle) return null; // No cycle present

  // Phase 2: Locate cycle entry node
  let ptr = head;
  while (ptr !== slow) {
    ptr = ptr.next;
    slow = slow.next;
  }

  return ptr; // Cycle entrance
}

// ❌ ANTI-PATTERN: Comparing node.val instead of node reference
function buggyDetectCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    // BUG: If distinct nodes have the same value (e.g., [1, 1, 1]),
    // comparing values causes false positive cycle detection!
    if (slow.val === fast.val) return slow;
  }
  return null;
}

// Test build helper for cyclic lists
const node1 = new ListNode(3);
const node2 = new ListNode(2);
const node3 = new ListNode(0);
const node4 = new ListNode(-4);
node1.next = node2;
node2.next = node3;
node3.next = node4;
node4.next = node2; // Cycle back to node2 (value 2)

// Example test runs
console.log(detectCycle(node1).val); // 2 (Entry node identified correctly!)

const acyclic = createList([1, 2, 3]);
console.log(detectCycle(acyclic));   // null
```

- **Time Complexity**: $O(n)$ — Phase 1 takes at most $2n$ steps; Phase 2 takes at most $n$ steps. Overall time is strictly $O(n)$.
- **Space Complexity**: $O(1)$ — Only pointer references are used.

---

## 6. Under the Hood: V8 & Node.js

### Call Stack Limits and Recursive Reversal Pitfalls
Why should you never use recursive linked list reversal in Node.js backend systems?
```javascript
function reverseRecursive(head) {
  if (!head || !head.next) return head;
  const newHead = reverseRecursive(head.next);
  head.next.next = head;
  head.next = null;
  return newHead;
}
```
1. **The V8 Call Stack**:
   - V8 allocates a fixed stack memory budget (typically **10,000 frames** in Node.js).
   - Each recursive call creates a new stack frame holding local variables and return addresses.
   - For a linked list representing 15,000 streaming chunks or database rows, calling `reverseRecursive()` crashes the Node.js process immediately with:
     `RangeError: Maximum call stack size exceeded`.
2. **Absence of Tail Call Optimization (TCO)**:
   - While TC39 standardized proper tail calls in ES2015, major JavaScript engines (including V8) **do not support TCO** due to debugging and error stack trace requirements.
   - **Production Rule**: In Node.js, linked list reversals must **always be iterative** ($O(1)$ stack space).

### Circular Reference Inspection in Node.js
When a linked list has a cycle, passing it to `JSON.stringify(head)` throws:
`TypeError: Converting circular structure to JSON`.
- Node.js's built-in `util.inspect()` utility detects cycles using an internal reference tracking set and prints `[Circular *1]` instead of crashing.
- In backend logging, always sanitize or break circular links before serializing payloads to logging pipelines.

---

## 7. Hands-On Exercise

### The Scenario
You are developing a batch packet re-ordering pipeline for a custom WebSocket protocol in Node.js.
You are given the `head` of a linked list and two integer positions `left` and `right` where `1 <= left <= right <= n`.
You must reverse only the nodes from position `left` to position `right` in a single pass, leaving the rest of the list unchanged.

### The Buggy Code
```javascript
function reverseBetweenBuggy(head, left, right) {
  // Bug 1: Fails when left === 1 (modifying head requires sentinel dummy node!)
  // Bug 2: Reversing by extracting into array and rebuilding destroys original node pointers!
  let curr = head;
  for (let i = 1; i < left; i++) curr = curr.next;
  return head;
}
```

### Acceptance Criteria
1. Reverses nodes between 1-indexed positions `left` and `right` in **$O(n)$ time**.
2. Operates **in-place** using **$O(1)$ extra space**.
3. Correctly handles `left === 1` where the head itself changes.
4. Verified with direct test execution.

### Verified Solution

```javascript
// ✅ CORRECT: In-place sublist reversal using sentinel node
function reverseBetween(head, left, right) {
  if (!head || left === right) return head;

  const dummy = new ListNode(0, head);
  let pre = dummy;

  // Step 1: Advance 'pre' to the node immediately before position 'left'
  for (let i = 1; i < left; i++) {
    pre = pre.next;
  }

  // Step 2: 'start' is the first node of the sublist to reverse
  const start = pre.next;
  let then = start.next;

  // Step 3: Iteratively move 'then' to the front of the sublist
  // Example: 1 -> (2 -> 3 -> 4) -> 5, left = 2, right = 4
  // Pass 1:  1 -> 3 -> 2 -> 4 -> 5
  // Pass 2:  1 -> 4 -> 3 -> 2 -> 5
  for (let i = 0; i < right - left; i++) {
    start.next = then.next;
    then.next = pre.next;
    pre.next = then;
    then = start.next;
  }

  return dummy.next;
}

// Example test runs
const sublistTest1 = createList([1, 2, 3, 4, 5]);
console.log(toArray(reverseBetween(sublistTest1, 2, 4))); // [ 1, 4, 3, 2, 5 ]

const sublistTest2 = createList([5]);
console.log(toArray(reverseBetween(sublistTest2, 1, 1))); // [ 5 ]

const sublistTest3 = createList([1, 2]);
console.log(toArray(reverseBetween(sublistTest3, 1, 2))); // [ 2, 1 ]
```

---

## 8. Tricky Points and Edge Cases

### 1. Pointer Severing Order
When reversing a link, the exact sequence of pointer assignment is critical:
```javascript
const nextTemp = curr.next; // MUST happen first
curr.next = prev;           // Invert
prev = curr;                // Advance prev
curr = nextTemp;            // Advance curr
```
Reordering lines 2 and 3 causes `prev` to point to the wrong node; omitting line 1 causes infinite loops.

### 2. Fast Pointer Boundary Checks
In cycle detection, always check **both** `fast !== null` and `fast.next !== null`:
```javascript
while (fast !== null && fast.next !== null)
```
- If the list has an odd number of nodes without a cycle, `fast.next` will be `null`. Checking `fast.next.next` without validating `fast.next` throws `TypeError: Cannot read properties of null`.

### 3. Edge Cases Checklist
- Empty list (`head === null`).
- Single-node list (`head.next === null`).
- Two-node list.
- Entire list reversed (`left = 1, right = n`).
- Sublist of length 1 (`left === right`).
- Self-referential loop (`head.next === head`).

---

## 9. Comprehensive Summary

- **Iterative 3-Pointer Reversal** slides `prev`, `curr`, and `nextTemp` forward to reverse link directions in $O(n)$ time and $O(1)$ space.
- **Floyd's Cycle Detection** moves `slow` at $1\times$ and `fast` at $2\times$. The relative speed of 1 node/tick guarantees that `fast` collides with `slow` within the cycle in $O(n)$ time.
- **Cycle Entry Discovery**: After collision, resetting one pointer to `head` and walking both at 1 step/tick finds the entry node where $L = (k - 1)C + (C - x)$.
- **Sentinel Dummy Nodes**: Essential when the reversal window includes position 1 (`head`).
- **Engine Realities**: Recursive reversal triggers call stack overflows ($> 10,000$ nodes) in V8. Always use iterative loops for backend linked list manipulation.

---

## 10. Cheat Sheet

### Algorithm Decision Matrix

| Requirement | Recommended Approach | Time Complexity | Space Complexity |
| :--- | :--- | :---: | :---: |
| **Reverse entire list** | 3-pointer iterative (`prev`, `curr`, `nextTemp`) | **$O(n)$** | **$O(1)$** |
| **Reverse sublist $[L \dots R]$** | Sentinel dummy + in-place front insertion | **$O(n)$** | **$O(1)$** |
| **Check if cycle exists** | Floyd's algorithm (`fast = fast.next.next`) | **$O(n)$** | **$O(1)$** |
| **Find cycle entry node** | Floyd's Phase 1 (meet) + Phase 2 (head walk) | **$O(n)$** | **$O(1)$** |
| **Check palindrome list** | Fast/slow split $\to$ reverse 2nd half $\to$ compare | **$O(n)$** | **$O(1)$** |

### Common Pitfalls List
- **Stack Overflow**: Using recursion to reverse long lists in V8.
- **Unsafe Fast Pointer**: Missing `fast.next !== null` in while condition.
- **Value Equality Trap**: Comparing `slow.val === fast.val` instead of `slow === fast` in cycle checks.
- **Lost Head**: Forgetting to return `dummy.next` when `left === 1` in sublist reversal.

---

## 11. Interview Q&A

### 45-Second Technical Pitch
> *"Linked list reversals and cycle detection test a candidate's ability to manipulate pointer invariants without auxiliary memory. To reverse a list in-place, we slide three pointers—prev, curr, and nextTemp—reorienting links in a single O(n) pass with O(1) space, avoiding the call-stack overflow risk of recursion in Node.js. For cycle detection, we apply Floyd's Tortoise and Hare algorithm: moving fast at twice the speed of slow ensures collision within the cycle due to a relative velocity of one node per tick. Resetting a pointer to head after collision mathematically guarantees they will meet at the cycle entry point."*

### 1. Why is Floyd's algorithm mathematically guaranteed to terminate if a cycle exists?
**Answer:**
Let the cycle length be $C$. Once both pointers enter the cycle, `fast` is at some distance $k$ behind `slow` ($0 \le k < C$).
At each iteration, `slow` advances 1 step and `fast` advances 2 steps. The relative speed difference is $2 - 1 = 1$ step per tick.
Because the distance between them decreases by exactly 1 on every step ($k, k-1, k-2, \dots, 0$), `fast` cannot leapfrog or skip over `slow`. It must collide with `slow` in at most $C$ iterations.

### 2. What will the following code output in Node.js, and why?
```javascript
const node = new ListNode(1);
node.next = node;
console.log(hasCycle(node));
```
**Answer:**
It outputs `true`.
This is a self-referential cycle of length 1.
In `hasCycle`:
- Iteration 1: `slow = node.next` (which is `node`). `fast = node.next.next` (which is also `node`).
- `slow === fast` evaluates to `true` on the very first loop iteration, correctly returning `true` in $O(1)$ time.

### 3. Spot and fix the bug in this sublist reversal helper:
```javascript
function reverseSublist(head, k) {
  let prev = null, curr = head;
  for (let i = 0; i < k; i++) {
    curr.next = prev;
    prev = curr;
    curr = curr.next;
  }
  return prev;
}
```
**Answer:**
Two critical bugs:
1. `curr.next = prev` severs the link to the next node before saving it. Calling `curr = curr.next` on line 6 sets `curr` to `prev`, creating an immediate loop.
2. If $k$ is greater than the list length, `curr` becomes `null`, and `curr.next` throws a runtime TypeError.
Fix:
```javascript
let prev = null, curr = head;
for (let i = 0; i < k && curr !== null; i++) {
  const nextTemp = curr.next;
  curr.next = prev;
  prev = curr;
  curr = nextTemp;
}
```

### 4. How can Floyd's Cycle Detection solve the "Find the Duplicate Number" problem in an array of $n + 1$ integers without modifying the array or using extra space?
**Answer:**
The problem states that an array of length $n + 1$ contains integers between $1$ and $n$. By Pigeonhole Principle, at least one duplicate exists.
We map the array to a virtual functional graph where `index -> arr[index]`:
- Because each value is a valid index within $[1 \dots n]$, we can treat array values as pointer targets (`curr = arr[curr]`).
- Because index 0 is never pointed to by any value (values are $\ge 1$), index 0 serves as the list `head`.
- Multiple indices pointing to the duplicate value represent multiple nodes pointing to the same successor node, which forms a **cycle entry point**!
- Applying Floyd's algorithm with `slow = arr[slow]` and `fast = arr[arr[fast]]` detects the cycle entry node in $O(n)$ time and $O(1)$ space without mutating the array.

---

## 12. Practice Problems

### 1. Reverse Linked List - Easy
Given the `head` of a singly linked list, reverse the list and return the new head.
- **Sample Input 1:** `head = [1, 2, 3, 4, 5]`
- **Expected Output 1:** `[5, 4, 3, 2, 1]`
- **Sample Input 2:** `head = [1, 2]`
- **Expected Output 2:** `[2, 1]`
- **Sample Input 3:** `head = []`
- **Expected Output 3:** `[]`

### 2. Linked List Cycle - Easy
Given `head`, determine if the linked list has a cycle in it.
- **Sample Input 1:** `head = [3, 2, 0, -4], pos = 1`
- **Expected Output 1:** `true`
- **Sample Input 2:** `head = [1], pos = -1`
- **Expected Output 2:** `false`

### 3. Linked List Cycle II - Medium
Given the `head` of a linked list, return the node where the cycle begins, or `null` if no cycle exists.
- **Sample Input 1:** `head = [3, 2, 0, -4], pos = 1`
- **Expected Output 1:** `Node with value 2`
- **Sample Input 2:** `head = [1, 2], pos = 0`
- **Expected Output 2:** `Node with value 1`

### 4. Palindrome Linked List - Easy
Given the `head` of a singly linked list, return `true` if it is a palindrome, or `false` otherwise. Solve in $O(n)$ time and $O(1)$ space.
- **Sample Input 1:** `head = [1, 2, 2, 1]`
- **Expected Output 1:** `true`
- **Sample Input 2:** `head = [1, 2]`
- **Expected Output 2:** `false`

---

<nav aria-label="Lecture navigation">

[Previous: Singly & Doubly Linked Lists](day-11-singly-and-doubly-linked-lists.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Stacks & Expression Parsing](day-13-stacks-and-expression-parsing.md)

</nav>
