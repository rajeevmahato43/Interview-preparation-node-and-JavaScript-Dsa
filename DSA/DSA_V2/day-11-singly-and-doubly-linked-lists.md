# Day 11: Singly & Doubly Linked Lists

<nav aria-label="Lecture navigation">

[Previous: Prefix Sum & Subarray Totals](day-10-prefix-sum-and-subarray-totals.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Linked List Reversals & Cycle Detection](day-12-linked-list-reversals-and-cycle-detection.md)

</nav>

---

## 1. Singly Linked Lists

A **Singly Linked List** is a linear data structure where elements are not stored in contiguous memory slots. Instead, each element is an independent object called a **Node** that contains its own data payload and a reference pointer (`next`) pointing to the succeeding node.

To picture this physically, imagine a city-wide scavenger hunt:
1. You receive a card containing a clue and an address: *"Go to 42 Oak Street"* (The **Head**).
2. You travel to 42 Oak Street. There you find a clue box and the next card: *"Go to 108 Pine Lane"* (The **Next Pointer**).
3. You cannot jump directly to clue #5 because you do not know its address until you visit clue #4. You must visit each location sequentially in $O(n)$ time.
4. The final clue box contains a card that reads *"The End"* (`null`).

```text
SINGLY LINKED LIST:
[ Head: 10 | next ] ──► [ 20 | next ] ──► [ Tail: 30 | null ]
```

```javascript
// Node.js code
"use strict";

// Baseline Singly Linked List Node definition
class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

// Baseline traversal and insertion
function printList(head) {
  const result = [];
  let curr = head;
  while (curr !== null) {
    result.push(curr.val);
    curr = curr.next;
  }
  return result;
}

const node3 = new ListNode(30);
const node2 = new ListNode(20, node3);
const head = new ListNode(10, node2);

console.log(printList(head)); // [ 10, 20, 30 ]
```

---

### 1.1 Node Reference Anatomy & Memory Layout

In JavaScript, nodes are allocated as objects on the V8 heap:

```text
┌───────────────────────────────────────┐
│              NODE IN RAM              │
├───────────────────┬───────────────────┤
│ val: 10           │ next: 0x7fff4820  │ ──► [ Next Node Object at 0x7fff4820 ]
└───────────────────┴───────────────────┘
```

Unlike array elements stored side-by-side in contiguous memory buffers, linked list nodes can reside at non-adjacent heap addresses. Traversing a linked list requires **pointer chasing**: fetching an address, waiting for RAM, and jumping to the next memory location.

---

### 1.2 Insertion and Deletion Mechanics

* **Insertion at Head ($O(1)$):**
  1. Create `newNode = new ListNode(val)`.
  2. Point `newNode.next = head`.
  3. Reassign `head = newNode`.
  *(No elements are shifted in memory!)*
* **Deletion of Next Node ($O(1)$ given predecessor):**
  1. Wire `curr.next = curr.next.next`.
  2. The bypassed node is orphaned from the list and reclaimed by V8 garbage collection.

```text
INSERTION AT HEAD (Value 5):
[ 5 | next ]──┐
              ▼
          [ 10 | next ] ──► [ 20 | null ]

DELETION OF NODE 20:
              ┌───────────────────────────┐
              │                           ▼
[ 10 | next ]─┴─► [ 20 | next ] ──► [ 30 | null ]
  (curr)            (bypassed)
```

> [!NOTE]
> **Self-Check:** Why does deleting an item from the start of an array take $O(n)$ time, while deleting from the head of a linked list takes $O(1)$ time?  
> *Answer:* An array is a contiguous memory block; removing index 0 forces the engine to shift all remaining $n - 1$ items left in memory. A linked list simply reassigns the `head` pointer to `head.next` in one instruction without moving any data.

---

### 1.3 Essential Singly Linked List Methods

| Method | What It Does | Mutates List? | Time Complexity | Quick Example |
| :--- | :--- | :---: | :---: | :--- |
| `prepend(val)` | Inserts new node at head | ✅ Yes | **$O(1)$** | `head = new ListNode(val, head)` |
| `append(val)` | Inserts new node at tail | ✅ Yes | **$O(1)$** (with tail) / $O(n)$ | Traverse to end, wire `tail.next` |
| `deleteNext(node)` | Deletes node after current | ✅ Yes | **$O(1)$** | `node.next = node.next.next` |
| `get(index)` | Finds value at index $i$ | ❌ No | **$O(n)$** | Walk $i$ steps from head |
| `contains(val)` | Checks if value exists | ❌ No | **$O(n)$** | Sequential scan until match/null |

---

## 2. Doubly Linked Lists

A **Doubly Linked List** links nodes bidirectionally. Each node stores two pointers: `next` pointing forward and `prev` pointing backward.

To picture this physically, imagine freight railcars linked together on a track:
* Each car has a mechanical coupler to the car ahead (`next`) and a coupler to the car behind (`prev`).
* A conductor can walk forward from engine to caboose, or backward from caboose to engine.
* To remove a car in the middle, you disconnect its two couplers and hook the neighbor cars together directly in $O(1)$ time without moving any other train cars.

```text
DOUBLY LINKED LIST:
null ◄── [ null | 10 | next ] ◄──► [ prev | 20 | next ] ◄──► [ prev | 30 | null ] ──► null
             (Head)                      (Middle)                     (Tail)
```

```javascript
class DoublyNode {
  constructor(val = 0, prev = null, next = null) {
    this.val = val;
    this.prev = prev;
    this.next = next;
  }
}
```

---

### 2.1 The Sentinel (Dummy) Node Pattern

When modifying linked lists, edge cases involving empty lists, single-node lists, or deleting the `head` require tedious conditional checks.

A **Sentinel (Dummy) Node** is an artificial node created with an arbitrary value (`0`) whose `.next` points to the real `head`:

```text
[ Dummy: 0 | next ] ──► [ Head: 10 | next ] ──► [ 20 | null ]
```

* **Uniform Deletions:** Deleting the very first real node is identical to deleting an interior node (`dummy.next = dummy.next.next`).
* **Permanent Anchor:** You never lose track of the list start. When the algorithm finishes, always return **`dummy.next`**.

---

### 2.2 Array vs Linked List Complexity Comparison

| Operation | Array (Contiguous) | Singly Linked List | Doubly Linked List |
| :--- | :---: | :---: | :---: |
| **Index Access (`get(i)`)** | **$O(1)$** | $O(n)$ | $O(n)$ |
| **Insert / Delete at Head** | $O(n)$ (memory shift) | **$O(1)$** | **$O(1)$** |
| **Insert / Delete at Tail** | $O(1)$ amortized | **$O(1)$** (with tail) | **$O(1)$** |
| **Delete Given Known Node** | $O(n)$ (memory shift) | $O(n)$ (needs predecessor) | **$O(1)$** |
| **CPU Cache Locality** | **Excellent (Sequential)** | Poor (Pointer Chasing) | Poor (Pointer Chasing) |

---

### 2.3 Pattern Family
* **Dummy Sentinel Anchor:** Placing a dummy node before `head` to handle head deletions and empty boundary edge cases.
* **Two-Pointer Splicing:** Weaving two sorted lists together by comparing values and updating pointer links.
* **Gap Pointers (Lead/Follow):** Maintaining a fixed gap of $N$ nodes between two pointers to locate nodes relative to the end.

### 2.4 Pattern Recognition Table

| Problem Keyword | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| **"Delete nodes matching condition"** | Remove values where head might be deleted. | Dummy Sentinel Node (`dummy.next = head`). |
| **"Merge two sorted lists"** | Splicing nodes in sorted order. | Two pointers + Dummy head accumulator. |
| **"Remove Nth node from end"** | Single pass distance deletion. | Two pointers separated by gap of $N$. |
| **"Implement LRU Cache"** | $O(1)$ node promotion and eviction. | Doubly Linked List + Hash Map (`Map<key, Node>`). |

### 2.5 When to Use vs When NOT to Use
* **When to Use**:
  * You need guaranteed **$O(1)$ insertions or deletions at the boundaries** without shifting array memory.
  * The collection size is dynamic and you want to avoid dynamic array resizing copies.
  * Implementing low-level buffers like LRU caches, browser history, or job queues.
* **When NOT to Use**:
  * You require frequent random access by index ($O(1)$ index access is impossible; use an **Array**).
  * Memory efficiency is paramount (each node adds 16-24 bytes of pointer overhead in 64-bit V8).
  * High-volume sequential number crunching (arrays leverage hardware CPU cache prefetching; linked lists cause cache misses).

### 2.6 The 10^7 Operations Rule
* Iterating through $10^6$ linked list nodes takes $\approx 15\text{ms}$ in Node.js.
* Because of CPU cache misses from pointer chasing, a linked list iteration runs **3x to 5x slower** than iterating an array of identical size, even though both are asymptotically $O(n)$.

---

## 3. Problem Walkthroughs

---

### 3.1 Remove Linked List Elements

#### 3.1.1 Problem Statement
Given the `head` of a linked list and an integer `val`, remove all nodes of the linked list that have `Node.val === val`, and return the new head.

* **Sample Input 1:** `head = [1, 2, 6, 3, 4, 5, 6]`, `val = 6` $\to$ **Expected Output:** `[1, 2, 3, 4, 5]`
* **Sample Input 2:** `head = [7, 7, 7, 7]`, `val = 7` $\to$ **Expected Output:** `[]`
* **Sample Input 3:** `head = []`, `val = 1` $\to$ **Expected Output:** `[]`
* **Constraints:** The number of nodes in the list is in the range $[0, 10^4]$, $1 \le Node.val \le 50$, $0 \le val \le 50$.

#### 3.1.2 How to Think About It
Toy train cars linked on a track: `[ 1 ] -> [ 2 ] -> [ 6 ] -> [ 3 ] -> [ 6 ] -> null`, target `val = 6`.
1. Place a dummy engine car before the head: `[ dummy: 0 ] -> [ 1 ] -> [ 2 ] -> [ 6 ] -> [ 3 ] -> [ 6 ]`.
2. Stand on `dummy`. Look at the car directly in front of you (`curr.next`):
   - In front of `dummy` is `1`. Does `1 === 6`? No. Step forward to `1`.
   - In front of `1` is `2`. Does `2 === 6`? No. Step forward to `2`.
   - In front of `2` is `6`. Does `6 === 6`? **Yes!**
     Unhook car `6` by rewiring car `2`'s coupler directly to car `3` (`curr.next = curr.next.next`).
     **Do not step forward yet!** You must check the new car now standing in front of you.
   - In front of `2` is `3`. Does `3 === 6`? No. Step forward to `3`.
   - In front of `3` is `6`. Does `6 === 6`? **Yes!**
     Unhook car `6` by rewiring car `3` to `null`.
3. Return `dummy.next` (`[ 1 -> 2 -> 3 ]`).

#### 3.1.3 Brute Force Approach & Bottleneck
Extracting all node values into an array, filtering out `val`, and building brand new `ListNode` instances:

```javascript
function removeElementsBrute(head, val) {
  const vals = [];
  let curr = head;
  while (curr) { if (curr.val !== val) vals.push(curr.val); curr = curr.next; }
  const dummy = new ListNode(0);
  let tail = dummy;
  for (const v of vals) { tail.next = new ListNode(v); tail = tail.next; }
  return dummy.next;
}
```

* **The Bottleneck:** Allocates $O(n)$ auxiliary memory for arrays and duplicate heap objects when existing node pointers can simply be rewired in-place with zero memory allocation.

#### 3.1.4 The Pattern Insight
Use a **Sentinel Dummy Node**:
* Initialize `dummy = new ListNode(0, head)`.
* Set `curr = dummy`.
* While `curr.next !== null`:
  - If `curr.next.val === val`: rewire `curr.next = curr.next.next`.
  - Else: advance `curr = curr.next`.
* Advancing `curr` *only* when no deletion occurs ensures consecutive target nodes (e.g. `[6, 6]`) are handled safely.

#### 3.1.5 Pseudocode

```text
FUNCTION RemoveElements(head, val):
  dummy = ListNode(0, head)
  curr = dummy

  WHILE curr.next != null:
    IF curr.next.val == val:
      curr.next = curr.next.next
    ELSE:
      curr = curr.next

  RETURN dummy.next
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(1) space sentinel pointer rewiring
function removeElements(head, val) {
  const dummy = new ListNode(0, head);
  let curr = dummy;

  // Invariant: all nodes up to curr have val !== target
  while (curr.next !== null) {
    if (curr.next.val === val) {
      // Bypass target node
      curr.next = curr.next.next;
    } else {
      // Advance only when curr.next is verified safe
      curr = curr.next;
    }
  }

  return dummy.next;
}

// Helpers for test execution
function createList(arr) {
  const dummy = new ListNode(0);
  let tail = dummy;
  for (const x of arr) { tail.next = new ListNode(x); tail = tail.next; }
  return dummy.next;
}

function toArray(head) {
  const res = [];
  let curr = head;
  while (curr) { res.push(curr.val); curr = curr.next; }
  return res;
}

// Example runs
console.log(toArray(removeElements(createList([1, 2, 6, 3, 4, 5, 6]), 6))); // [ 1, 2, 3, 4, 5 ]
console.log(toArray(removeElements(createList([7, 7, 7, 7]), 7)));          // []
console.log(toArray(removeElements(createList([]), 1)));                   // []
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Advancing curr on deletion (skips consecutive target values)
function buggyRemoveElements(head, val) {
  const dummy = new ListNode(0, head);
  let curr = dummy;
  while (curr.next !== null) {
    if (curr.next.val === val) {
      curr.next = curr.next.next;
    }
    curr = curr.next; // BUG: Advancing immediately skips the replacement node!
  }
  return dummy.next;
}
```
* **Why it fails:** For `[6, 6, 1]` with `val = 6`, deleting the first `6` and immediately executing `curr = curr.next` moves `curr` onto the second `6` without checking it, returning `[6, 1]`.

#### 3.1.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The loop traverses each node in the list exactly once.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. Only one sentinel node object is created on the stack.

---

### 3.2 Merge Two Sorted Lists

#### 3.2.1 Problem Statement
You are given the heads of two sorted linked lists `list1` and `list2`.
Merge the two lists into one **sorted** linked list by splicing together the nodes of the first two lists. Return the head of the merged linked list.

* **Sample Input 1:** `list1 = [1, 2, 4]`, `list2 = [1, 3, 4]` $\to$ **Expected Output:** `[1, 1, 2, 3, 4, 4]`
* **Sample Input 2:** `list1 = []`, `list2 = [0]` $\to$ **Expected Output:** `[0]`
* **Sample Input 3:** `list1 = []`, `list2 = []` $\to$ **Expected Output:** `[]`
* **Constraints:** The number of nodes in both lists is in the range $[0, 50]$, $-100 \le Node.val \le 100$, both lists are sorted in non-decreasing order.

#### 3.2.2 How to Think About It
Two stacks of sorted cards face-up on a table:
* Stack A: `1 -> 2 -> 4`
* Stack B: `1 -> 3 -> 4`
1. Place an empty base card on the table (`dummy`). Your finger points to `tail = dummy`.
2. Look at the top of both stacks:
   - Stack A has `1`, Stack B has `1`. Pick Stack A's `1`: wire `tail.next = 1`, advance Stack A to `2`, move `tail`.
   - Stack A has `2`, Stack B has `1`. Stack B's `1` is smaller: wire `tail.next = 1`, advance Stack B to `3`, move `tail`.
   - Stack A has `2`, Stack B has `3`. Stack A's `2` is smaller: wire `tail.next = 2`, advance Stack A to `4`, move `tail`.
3. Once Stack A runs out, wire `tail.next` directly to the entire remaining tail of Stack B in one step ($O(1)$)!
4. Return `dummy.next`.

#### 3.2.3 Brute Force Approach & Bottleneck
Extracting all values into an array, sorting using `arr.sort((a, b) => a - b)`, and constructing brand new nodes:

```javascript
function mergeTwoListsBrute(l1, l2) {
  const vals = [];
  while (l1) { vals.push(l1.val); l1 = l1.next; }
  while (l2) { vals.push(l2.val); l2 = l2.next; }
  vals.sort((a, b) => a - b);
  const dummy = new ListNode(0);
  let tail = dummy;
  for (const v of vals) { tail.next = new ListNode(v); tail = tail.next; }
  return dummy.next;
}
```

* **The Bottleneck:** Sorting takes $O((n + m) \log(n + m))$ time and wastes memory, ignoring the fact that both inputs are already sorted.

#### 3.2.4 The Pattern Insight
Use a **Two-Pointer Splicing Loop** with a dummy head:
* Compare `list1.val` and `list2.val`.
* Wire `tail.next` to the smaller node and advance that list's pointer.
* When one list reaches `null`, attach the remaining non-empty list in one line: `tail.next = list1 !== null ? list1 : list2`.
* Runs in $O(n + m)$ time with strictly $O(1)$ auxiliary space.

#### 3.2.5 Pseudocode

```text
FUNCTION MergeTwoLists(list1, list2):
  dummy = ListNode(0)
  tail = dummy

  WHILE list1 != null AND list2 != null:
    IF list1.val <= list2.val:
      tail.next = list1
      list1 = list1.next
    ELSE:
      tail.next = list2
      list2 = list2.next
    tail = tail.next

  tail.next = (list1 != null) ? list1 : list2

  RETURN dummy.next
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n + m) time, O(1) space two-pointer splicing
function mergeTwoLists(list1, list2) {
  const dummy = new ListNode(0);
  let tail = dummy;

  while (list1 !== null && list2 !== null) {
    if (list1.val <= list2.val) {
      tail.next = list1;
      list1 = list1.next;
    } else {
      tail.next = list2;
      list2 = list2.next;
    }
    tail = tail.next;
  }

  // Attach remaining chain in O(1) time
  tail.next = list1 !== null ? list1 : list2;

  return dummy.next;
}

// Example runs
const m1 = mergeTwoLists(createList([1, 2, 4]), createList([1, 3, 4]));
console.log(toArray(m1)); // [ 1, 1, 2, 3, 4, 4 ]

const m2 = mergeTwoLists(createList([]), createList([0]));
console.log(toArray(m2)); // [ 0 ]
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Looping over remaining elements instead of O(1) tail attachment
function slowMergeTwoLists(list1, list2) {
  const dummy = new ListNode(0);
  let tail = dummy;
  while (list1 && list2) {
    if (list1.val <= list2.val) { tail.next = list1; list1 = list1.next; }
    else { tail.next = list2; list2 = list2.next; }
    tail = tail.next;
  }
  // MISTAKE: Pointless linear iterations when remaining list is already fully linked!
  while (list1) { tail.next = list1; list1 = list1.next; tail = tail.next; }
  while (list2) { tail.next = list2; list2 = list2.next; tail = tail.next; }
  return dummy.next;
}
```
* **Why it fails:** Traversing the remainder of `list1` or `list2` node-by-node executes unnecessary instructions when the entire remaining segment can be attached in one assignment.

#### 3.2.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n + m)}$. Each loop iteration advances either `list1` or `list2`.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. Done strictly in-place by updating pointer references.

---

### 3.3 Remove Nth Node From End of List

#### 3.3.1 Problem Statement
Given the `head` of a linked list, remove the $n$-th node from the end of the list and return its head. Solve this in **one pass**.

* **Sample Input 1:** `head = [1, 2, 3, 4, 5]`, `n = 2` $\to$ **Expected Output:** `[1, 2, 3, 5]`  
  *(The 2nd node from the end is 4)*
* **Sample Input 2:** `head = [1]`, `n = 1` $\to$ **Expected Output:** `[]`
* **Sample Input 3:** `head = [1, 2]`, `n = 1` $\to$ **Expected Output:** `[1]`
* **Constraints:** The number of nodes in the list is in the range $[1, 30]$, $0 \le Node.val \le 100$, $1 \le n \le \text{length of list}$.

#### 3.3.2 How to Think About It
Imagine two runners tied together with a rope of length $n + 1$:
* Place a `dummy` node before `head`.
* Position both `fast` and `slow` runners at `dummy`.
* Advance the `fast` runner forward by $n + 1$ steps. Now there is an exact gap of $n + 1$ nodes between them.
* Now move both runners forward together at the same speed (1 step per tick).
* When `fast` reaches the end of the track (`null`), `slow` will be standing **immediately before** the node that needs to be deleted!
* Wire `slow.next = slow.next.next` to remove the target node.

#### 3.3.3 Brute Force Approach & Bottleneck
A two-pass approach traverses the list to count total length $L$, then traverses again $L - n$ steps to locate and remove the node:

```javascript
function removeNthFromEndTwoPass(head, n) {
  let len = 0;
  let curr = head;
  while (curr) { len++; curr = curr.next; }

  const dummy = new ListNode(0, head);
  curr = dummy;
  for (let i = 0; i < len - n; i++) curr = curr.next;
  curr.next = curr.next.next;
  return dummy.next;
}
```

* **The Bottleneck:** Requires two full traversals over the linked list. While asymptotically $O(n)$, systems interviews specifically require solving this in a **single pass**.

#### 3.3.4 The Pattern Insight
Use **Gap Two Pointers (Lead/Follow)**:
* Place `dummy` before `head`.
* Initialize `fast = dummy` and `slow = dummy`.
* Advance `fast` forward $n + 1$ times.
* Walk `fast` and `slow` forward together until `fast === null`.
* `slow` is guaranteed to land on the predecessor of the target node.
* Rewire `slow.next = slow.next.next` in one pass!

#### 3.3.5 Pseudocode

```text
FUNCTION RemoveNthFromEnd(head, n):
  dummy = ListNode(0, head)
  fast = dummy
  slow = dummy

  FOR i FROM 0 TO n:
    fast = fast.next

  WHILE fast != null:
    fast = fast.next
    slow = slow.next

  slow.next = slow.next.next

  RETURN dummy.next
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal single-pass O(n) time, O(1) space gap two-pointers
function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head);
  let fast = dummy;
  let slow = dummy;

  // Advance fast by n + 1 steps to create gap
  for (let i = 0; i <= n; i++) {
    fast = fast.next;
  }

  // Move both pointers until fast reaches null
  while (fast !== null) {
    fast = fast.next;
    slow = slow.next;
  }

  // slow is at predecessor of target; bypass target node
  slow.next = slow.next.next;

  return dummy.next;
}

// Example runs
console.log(toArray(removeNthFromEnd(createList([1, 2, 3, 4, 5]), 2))); // [ 1, 2, 3, 5 ]
console.log(toArray(removeNthFromEnd(createList([1]), 1)));             // []
console.log(toArray(removeNthFromEnd(createList([1, 2]), 1)));          // [ 1 ]
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Forgetting dummy node (fails when deleting the head)
function buggyRemoveNthFromEnd(head, n) {
  let fast = head;
  let slow = head;
  for (let i = 0; i < n; i++) fast = fast.next;
  // BUG: If fast is null, the target to delete is head itself, causing crash or lost references!
  while (fast.next !== null) {
    fast = fast.next;
    slow = slow.next;
  }
  slow.next = slow.next.next;
  return head;
}
```
* **Why it fails:** For `head = [1], n = 1`, `fast` advances to `null`. Checking `fast.next` throws a `TypeError: Cannot read properties of null`. Using a dummy node guarantees `fast` can always safely advance $n + 1$ steps.

#### 3.3.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The list is traversed in a single pass.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. Uses two pointer variables and one dummy node.

---

## 4. Tricky Edge Cases

* **Deleting the Head Node:** When the node to delete is the head (e.g. `removeElements` where `head.val === val`), using a dummy sentinel node ensures you never have null reference crashes.
* **Consecutive Target Nodes:** When deleting nodes matching a target, never advance `curr = curr.next` in the deletion branch. Only advance when `curr.next.val !== val`.
* **Single-Node Lists (`[1]`):** Operations like removing the 1st node from end should cleanly return `null` (`[]`).
* **Dangling Pointers in Doubly Linked Lists:** When unhooking a doubly linked node, always disconnect both `node.prev = null` and `node.next = null` so garbage collection can clean it up.

---

## 5. Summary Cheat Sheet

* **Singly Linked Lists:** Nodes contain `val` and `next`. Provide $O(1)$ head insertions and deletions, but $O(n)$ index lookups.
* **Doubly Linked Lists:** Nodes contain `val`, `prev`, and `next`. Enable true $O(1)$ deletion of any node whose reference is already known.
* **Dummy Sentinel Pattern:** `dummy = new ListNode(0, head)`. Eliminates edge cases when mutating or deleting the head; always return `dummy.next`.
* **Two-Pointer Splicing:** Merges sorted lists in $O(n + m)$ time by rewiring existing node links.
* **Gap Pointers:** Maintaining an $(n + 1)$ gap between `fast` and `slow` locates the $n$-th node from the end in a single pass.

---

## 6. Practice Problems

### 6.1 Middle of the Linked List

Given the `head` of a singly linked list, return the middle node of the linked list. If there are two middle nodes, return the second middle node.

* **Difficulty:** Easy | **Focus:** Tortoise & Hare Velocity Differential
* **Sample Input 1:** `head = [1, 2, 3, 4, 5]` $\to$ **Expected Output:** `[3, 4, 5]`
* **Sample Input 2:** `head = [1, 2, 3, 4, 5, 6]` $\to$ **Expected Output:** `[4, 5, 6]`
* **Constraints:** Number of nodes is in range $[1, 100]$, $1 \le Node.val \le 100$.
* **Hint 1:** Initialize two pointers: `slow = head` and `fast = head`.
* **Hint 2:** In each step, advance `slow` by 1 node and `fast` by 2 nodes.
* **Hint 3:** When `fast === null` or `fast.next === null`, `slow` is at the midpoint.

---

### 6.2 Delete Node in a Linked List

There is a singly-linked list and you want to delete a node in it. You are given the node to be deleted `node`. You will **not** be given access to the first node of the list (`head`).

* **Difficulty:** Medium | **Focus:** In-Place Value Overwrite
* **Sample Input 1:** `head = [4, 5, 1, 9]`, `node = 5` $\to$ **Expected Output:** `[4, 1, 9]`
* **Sample Input 2:** `head = [4, 5, 1, 9]`, `node = 1` $\to$ **Expected Output:** `[4, 5, 9]`
* **Constraints:** The node to be deleted is in the list and is not a tail node.
* **Hint 1:** You do not have access to the predecessor node. Can you copy the next node's value into the current node?
* **Hint 2:** Set `node.val = node.next.val`, then bypass the next node: `node.next = node.next.next`.

---

### 6.3 Design Browser History

You have a browser of one tab where you start on the `homepage` and you can visit another `url`, get back in the history number of `steps` or forward in the history number of `steps`. Implement `BrowserHistory` using a Doubly Linked List.

* **Difficulty:** Medium | **Focus:** Doubly Linked List Navigation
* **Sample Input:**
  ```javascript
  const bh = new BrowserHistory("leetcode.com");
  bh.visit("google.com");
  bh.visit("facebook.com");
  bh.back(1);    // -> "google.com"
  bh.forward(1); // -> "facebook.com"
  ```
* **Constraints:** $1 \le homepage.length, url.length \le 20$, at most $5000$ calls to `visit`, `back`, and `forward`.
* **Hint 1:** Represent each visited URL as a `DoublyNode` with `prev` and `next` pointers.
* **Hint 2:** When `visit(url)` is called, clear all forward history by setting `curr.next = newNode`, `newNode.prev = curr`, then advance `curr = newNode`.
* **Hint 3:** `back(steps)` walks backward using `.prev` up to `steps` times while `curr.prev !== null`.

---

<nav aria-label="Lecture navigation">

[Previous: Prefix Sum & Subarray Totals](day-10-prefix-sum-and-subarray-totals.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Linked List Reversals & Cycle Detection](day-12-linked-list-reversals-and-cycle-detection.md)

</nav>
