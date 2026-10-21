# Day 11: Singly & Doubly Linked Lists

<nav aria-label="Lecture navigation">

[Previous: Prefix Sum & Subarray Totals](day-10-prefix-sum-and-subarray-totals.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Linked List Reversals & Cycle Detection](day-12-linked-list-reversals-and-cycle-detection.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Asymptotic time and auxiliary space complexity.
- [Day 02: Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md) — Contiguous array memory vs heap object references.
- Basic familiarity with JavaScript classes and object references.

---

## 1. What is a Linked List?

A **Linked List** is a linear data structure where elements are not stored in contiguous memory slots. Instead, each element is an independent object called a **Node** that contains its own data payload and one or more memory references (**pointers**) pointing to neighboring nodes.

> **Node**: An object in heap memory storing a data value (`val`) and a reference pointer (`next`) to the succeeding node.

> **Singly Linked List**: A unidirectional sequence of nodes where each node points only forward to the next node, terminating at `null`.

> **Doubly Linked List**: A bidirectional sequence where each node maintains two pointer references: `next` pointing forward and `prev` pointing backward.

> **Sentinel (Dummy) Node**: An artificial helper node placed at the head or tail of a list that holds no business data but eliminates boundary edge cases during pointer mutations.

### Everyday Physical Analogies

#### The Scavenger Hunt (Singly Linked List)
Imagine a treasure hunt across a city:
1. You are given a slip of paper containing a riddle and an address: *"Go to 42 Oak Street"* (The **Head**).
2. You travel to 42 Oak Street. There you find a clue box containing your reward and a new slip of paper: *"Go to 108 Pine Lane"* (The **Next Pointer**).
3. You cannot jump directly to clue #5 because you do not know its address until you visit clue #4. You must visit each station in order ($O(n)$ access).
4. The final station contains a slip saying *"The End"* (`null`).

#### The Train of Railcars (Doubly Linked List)
Imagine freight railcars linked together on a track:
- Each car has a mechanical coupler connecting to the car ahead (`next`) and a coupler connecting to the car behind (`prev`).
- A conductor can walk forward from engine to caboose, or backward from caboose to engine.
- To remove a damaged car in the middle, you disconnect its two couplers and link the neighbor cars together directly in $O(1)$ instant time without moving any other train cars!

```text
SINGLY LINKED LIST:
[ Head: 10 | * ] ──► [ 20 | * ] ──► [ Tail: 30 | null ]

DOUBLY LINKED LIST:
null ◄── [ null | 10 | * ] ◄──► [ * | 20 | * ] ◄──► [ * | 30 | null ] ──► null
          (Head)                 (Middle)            (Tail)
```

---

## 2. How Linked Lists Work Step-by-Step

### 1. Node Definition & Memory Layout

In JavaScript, a linked list node is represented as an instance of a class:

```javascript
class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}
```

When you execute `new ListNode(10)`, the V8 engine allocates an object in the V8 heap. Unlike contiguous arrays, two sequentially created nodes can reside at completely different, non-adjacent physical memory addresses.

### 2. Singly Linked List: Insertion & Deletion Mechanics

#### How Insertion at Head Works Step-by-Step
To insert a new value `5` at the beginning of `10 -> 20 -> null`:
1. Allocate a new node: `newNode = new ListNode(5)`.
2. Point `newNode.next` to the current `head` node (`10`).
3. Update `head` to reference `newNode`.
- **Time Complexity**: **$O(1)$** instant pointer update.
- **Contrast with Arrays**: Inserting at index 0 of an array requires shifting all $n$ items rightward ($O(n)$ work).

#### How Deletion of a Node Works Step-by-Step
To delete node `20` from `10 -> 20 -> 30 -> null`:
1. Position a pointer `prev` at the node immediately before the target (node `10`).
2. Update `prev.next` to point directly to `prev.next.next` (node `30`).
3. Node `20` is now unreferenced and will be automatically reclaimed by V8's garbage collector.
- **Time Complexity**: $O(1)$ if the preceding node is already known; $O(n)$ if we must search from `head` to locate it.

```text
DELETING NODE 20:
              ┌───────────────────────────┐
              │                           ▼
[ 10 | next ]─┴─► [ 20 | next ] ──► [ 30 | null ]
  (prev)            (bypassed)
```

```javascript
// ✅ CORRECT: Head insertion in O(1) time
function prepend(head, val) {
  const newNode = new ListNode(val);
  newNode.next = head;
  return newNode; // New head
}

// ❌ ANTI-PATTERN: Losing the rest of the list by overwriting pointer prematurely
function buggyPrepend(head, val) {
  const newNode = new ListNode(val);
  head = newNode; // BUG! The original head and all its children are disconnected and lost!
  return head;
}

// Example test run
let list = new ListNode(10, new ListNode(20));
list = prepend(list, 5); // 5 -> 10 -> 20
console.log(list.val); // 5
console.log(list.next.val); // 10
```

---

### 3. Doubly Linked List Mechanics

A doubly linked list node holds references to both its successor and predecessor:

```javascript
class DoublyListNode {
  constructor(val = 0, prev = null, next = null) {
    this.val = val;
    this.prev = prev;
    this.next = next;
  }
}
```

#### How $O(1)$ Middle Deletion Works
In a singly linked list, deleting a node requires finding its preceding node ($O(n)$ scan). In a doubly linked list, given a direct reference to `targetNode`:
1. Connect predecessor to successor: `targetNode.prev.next = targetNode.next`.
2. Connect successor to predecessor: `targetNode.next.prev = targetNode.prev`.
3. Clear `targetNode.prev = null` and `targetNode.next = null`.
- **Time Complexity**: **Strict $O(1)$** without any traversal! This is why Doubly Linked Lists are the core engine behind **LRU Caches** and **Job Schedulers**.

```javascript
// ✅ CORRECT: In-place O(1) removal of an interior doubly-linked node
function removeDoublyNode(node) {
  if (node.prev !== null) {
    node.prev.next = node.next;
  }
  if (node.next !== null) {
    node.next.prev = node.prev;
  }
  node.prev = null;
  node.next = null;
}
```

---

### 4. The Dummy (Sentinel) Node Pattern

When solving linked list interview problems, modifying or deleting the `head` node requires tedious `if (head === null)` edge cases.
A **Dummy Node** is an artificial node created with an arbitrary value (`0` or `-1`) whose `.next` points to the real `head`:

```text
[ Dummy: 0 ] ──► [ Head: 10 ] ──► [ 20 ] ──► [ 30 ] ──► null
```

#### Advantages of the Dummy Node:
1. **Unified Deletions**: Deleting the first real node is identical to deleting an interior node (`dummy.next = dummy.next.next`).
2. **Stable Anchor**: You never lose the start of the list. When finished, you always return **`dummy.next`**.

---

### Array vs Linked List Complexity Comparison

| Operation | Array (Contiguous) | Singly Linked List | Doubly Linked List |
| :--- | :---: | :---: | :---: |
| **Access element by index (`get(i)`)** | **$O(1)$** | $O(n)$ | $O(n)$ |
| **Insert / Delete at Head** | $O(n)$ (shifts items) | **$O(1)$** | **$O(1)$** |
| **Insert / Delete at Tail (with tail pointer)** | $O(1)$ amortized | **$O(1)$** | **$O(1)$** |
| **Insert / Delete at Known Middle Reference** | $O(n)$ (shifts items) | $O(n)$ (needs predecessor) | **$O(1)$** |
| **Memory Locality & CPU Cache** | **Excellent (Sequential)** | Poor (Pointer Chasing) | Poor (Pointer Chasing) |

---

## 3. Pattern Recognition of Linked Lists

### Problem Triggers and Keywords

| Problem Trigger | Underlying Requirement | Recommended Strategy |
| :--- | :--- | :--- |
| **"Delete nodes matching condition"** | Head itself might be deleted. | Dummy Sentinel Node (`dummy.next = head`). |
| **"Merge two sorted collections"** | Splicing nodes in-place without copying. | Two pointers + Dummy head accumulator. |
| **"Implement LRU Cache"** | $O(1)$ eviction and constant promotion. | Doubly Linked List + Hash Map (`Map<key, Node>`). |
| **"Find middle node / detect cycle"** | Traversing list without knowing length $n$. | Fast & Slow Two Pointers (Floyd's algorithm). |
| **"Remove Nth node from end"** | Single pass distance maintenance. | Two pointers separated by gap of $N$. |

### The $10^7$ Rule for Linked Lists
- Linked list traversals are strictly linear ($O(n)$). A single pass over $10^6$ nodes takes $\approx 15\text{ms}$ in Node.js.
- However, pointer chasing causes CPU cache misses. An $O(n)$ traversal over a linked list is typically **3x to 5x slower** than iterating an array of identical size.

---

## 4. Problem 1: Remove Linked List Elements (LeetCode 203)

### Problem Statement
Given the `head` of a linked list and an integer `val`, remove all nodes of the linked list that have `Node.val === val`, and return the new head.

```text
Input: head = [1, 2, 6, 3, 4, 5, 6], val = 6
Output: [1, 2, 3, 4, 5]

Input: head = [7, 7, 7, 7], val = 7
Output: []
```

### Step 1: Physical Simulation
Imagine toy train cars linked on a track:
`[ 1 ] -> [ 2 ] -> [ 6 ] -> [ 3 ] -> [ 6 ] -> null`, target `val = 6`.

1. Place an engine car at the very front (`dummy: 0`).
   `[ dummy: 0 ] -> [ 1 ] -> [ 2 ] -> [ 6 ] -> [ 3 ] -> [ 6 ] -> null`.
2. Stand on `dummy`. Look at the car immediately in front of you (`curr.next`):
   - In front of `dummy` is `1`. Is `1 === 6`? No. Step forward to `1`.
   - In front of `1` is `2`. Is `2 === 6`? No. Step forward to `2`.
   - In front of `2` is `6`. Is `6 === 6`? **Yes!**
     Unhook car `6` by rewiring car `2`'s coupler directly to car `3` (`curr.next = curr.next.next`).
     **Do not step forward yet!** You must inspect the new car now standing in front of you.
   - In front of `2` is `3`. Is `3 === 6`? No. Step forward to `3`.
   - In front of `3` is `6`. Is `6 === 6`? **Yes!**
     Unhook car `6` by rewiring car `3`'s coupler to `null`.
3. Return `dummy.next` (`[ 1 -> 2 -> 3 ]`).

### Step 2: Brute Force Approach
Copy all node values into an array, filter out values equal to `val`, then construct brand new `ListNode` instances:

```javascript
function removeElementsBrute(head, val) {
  const values = [];
  let curr = head;
  while (curr !== null) {
    if (curr.val !== val) values.push(curr.val);
    curr = curr.next;
  }
  const dummy = new ListNode(0);
  let tail = dummy;
  for (const v of values) {
    tail.next = new ListNode(v);
    tail = tail.next;
  }
  return dummy.next;
}
```
- **Time Complexity**: $O(n)$ — Multiple linear passes.
- **Space Complexity**: $O(n)$ — Allocates an auxiliary array and duplicate node objects.

### Step 3: Bottleneck
Where is the CPU sweating?
We are allocating brand new heap memory for nodes that already exist! Linked lists allow rewiring existing pointers in-place using **$O(1)$ auxiliary space**.

### Step 4: The Pattern Discovery
By using a **Dummy Node** (`dummy = new ListNode(0, head)`), we treat head deletions identically to middle deletions. We check `curr.next.val === val`. If matched, skip via `curr.next = curr.next.next`. Only advance `curr` when no deletion occurs.

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: In-place pointer rewiring with sentinel dummy node
function removeElements(head, val) {
  const dummy = new ListNode(0, head);
  let curr = dummy;

  // Invariant: All nodes from dummy to curr have value !== val
  while (curr.next !== null) {
    if (curr.next.val === val) {
      // Bypass the target node
      curr.next = curr.next.next;
      // Note: Do NOT advance curr! The replacement node at curr.next must be checked.
    } else {
      curr = curr.next; // Advance only when curr.next is safe
    }
  }

  return dummy.next;
}

// ❌ ANTI-PATTERN: Advancing pointer on deletion skips consecutive targets
function buggyRemoveElements(head, val) {
  const dummy = new ListNode(0, head);
  let curr = dummy;
  while (curr.next !== null) {
    if (curr.next.val === val) {
      curr.next = curr.next.next;
    }
    curr = curr.next; // BUG! If input is [6, 6], skipping forward misses the second 6!
  }
  return dummy.next;
}

// Helper to convert array to linked list
function createList(arr) {
  const dummy = new ListNode(0);
  let tail = dummy;
  for (const x of arr) {
    tail.next = new ListNode(x);
    tail = tail.next;
  }
  return dummy.next;
}

// Helper to convert linked list to array for easy verification
function toArray(head) {
  const result = [];
  let curr = head;
  while (curr !== null) {
    result.push(curr.val);
    curr = curr.next;
  }
  return result;
}

// Example test runs
console.log(toArray(removeElements(createList([1, 2, 6, 3, 4, 5, 6]), 6))); // [ 1, 2, 3, 4, 5 ]
console.log(toArray(removeElements(createList([7, 7, 7, 7]), 7)));          // []
console.log(toArray(removeElements(createList([]), 1)));                   // []
console.log(toArray(buggyRemoveElements(createList([6, 6, 1]), 6)));       // [ 6, 1 ] (BUG: missed consecutive 6!)
```

- **Time Complexity**: $O(n)$ — Single pass visiting each node exactly once.
- **Space Complexity**: $O(1)$ — Only a single dummy node reference is allocated.

---

## 5. Problem 2: Merge Two Sorted Lists (LeetCode 21)

### Problem Statement
You are given the heads of two sorted linked lists `list1` and `list2`.
Merge the two lists into one **sorted** linked list. The list should be made by splicing together the nodes of the first two lists.
Return the head of the merged linked list.

```text
Input: list1 = [1, 2, 4], list2 = [1, 3, 4]
Output: [1, 1, 2, 3, 4, 4]

Input: list1 = [], list2 = [0]
Output: [0]
```

### Step 1: Physical Simulation
Imagine two separate stacks of sorted playing cards face-up on a table:
- Stack A: `1 -> 2 -> 4`
- Stack B: `1 -> 3 -> 4`
You want to assemble a single merged chain:
1. Place an empty cardboard base on the table (`dummy`). Your finger points to `dummy` as the current tail (`tail = dummy`).
2. Look at the top card of both stacks:
   - Stack A has `1`, Stack B has `1`. They are equal. Pick Stack A's `1`.
   - Wire `tail.next` to Stack A's `1`. Advance Stack A to `2`. Move `tail` to `1`.
3. Compare next tops: Stack A has `2`, Stack B has `1`:
   - Stack B's `1` is smaller. Wire `tail.next` to Stack B's `1`. Advance Stack B to `3`. Move `tail` to `1`.
4. Compare next tops: Stack A has `2`, Stack B has `3`:
   - Stack A's `2` is smaller. Wire `tail.next` to Stack A's `2`. Advance Stack A to `4`. Move `tail` to `2`.
5. Repeat until one stack is empty.
6. Once Stack A is empty, immediately wire `tail.next` to the entire remaining tail of Stack B in one single pointer step ($O(1)$)!
7. Return `dummy.next`.

### Step 2: Brute Force Approach
Extract all values from both lists into an array, sort the array using `arr.sort((a, b) => a - b)`, and build a completely new list:

```javascript
function mergeTwoListsBrute(l1, l2) {
  const vals = [];
  while (l1) { vals.push(l1.val); l1 = l1.next; }
  while (l2) { vals.push(l2.val); l2 = l2.next; }
  vals.sort((a, b) => a - b);
  const dummy = new ListNode(0);
  let curr = dummy;
  for (const v of vals) { curr.next = new ListNode(v); curr = curr.next; }
  return dummy.next;
}
```
- **Time Complexity**: $O((n + m) \log(n + m))$ — Sorting ignores that the inputs are already sorted!
- **Space Complexity**: $O(n + m)$ — Extra array and duplicate node allocations.

### Step 3: Bottleneck
Where is the CPU sweating?
Re-sorting pre-sorted data wastes $(n + m) \log(n + m)$ time. Furthermore, allocating new nodes wastes memory when we can rewire the original pointers in-place.

### Step 4: The Pattern Discovery
Use a **Dummy Head** and a **Two-Pointer Splicing Loop**:
- Compare `l1.val` and `l2.val`.
- Append the smaller node to `tail.next`.
- Advance the pointer of the chosen list.
- When one list is exhausted, attach the non-empty list directly: `tail.next = l1 || l2`.

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: In-place two-pointer splicing with dummy anchor
function mergeTwoLists(list1, list2) {
  const dummy = new ListNode(0);
  let tail = dummy;

  // Invariant: dummy.next through tail is a sorted list of merged nodes
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

  // Attach remaining tail in O(1) time
  tail.next = list1 !== null ? list1 : list2;

  return dummy.next;
}

// ❌ ANTI-PATTERN: Iterating through remaining elements one-by-one instead of O(1) splice
function slowMergeTwoLists(list1, list2) {
  const dummy = new ListNode(0);
  let tail = dummy;
  while (list1 && list2) {
    if (list1.val <= list2.val) { tail.next = list1; list1 = list1.next; }
    else { tail.next = list2; list2 = list2.next; }
    tail = tail.next;
  }
  // MISTAKE: Pointless loop when we can attach remaining chain in one statement!
  while (list1) { tail.next = list1; list1 = list1.next; tail = tail.next; }
  while (list2) { tail.next = list2; list2 = list2.next; tail = tail.next; }
  return dummy.next;
}

// Example test runs
const merged1 = mergeTwoLists(createList([1, 2, 4]), createList([1, 3, 4]));
console.log(toArray(merged1)); // [ 1, 1, 2, 3, 4, 4 ]

const merged2 = mergeTwoLists(createList([]), createList([0]));
console.log(toArray(merged2)); // [ 0 ]

const merged3 = mergeTwoLists(createList([]), createList([]));
console.log(toArray(merged3)); // []
```

- **Time Complexity**: $O(n + m)$ — At each iteration, exactly one node from either `list1` or `list2` is attached.
- **Space Complexity**: $O(1)$ — Rewires existing pointers in-place with zero memory allocation.

---

## 6. Under the Hood: V8 & Node.js

### Memory Fragmentation & Pointer Chasing
Why are JavaScript arrays almost always faster than linked lists for sequential data processing?
1. **CPU Cache Lines (L1/L2)**:
   - An array stores numbers or object references in contiguous memory. When the CPU reads `arr[0]`, hardware prefetchers load the entire 64-byte **cache line** into L1 CPU cache. Iterating `arr[1]`, `arr[2]`, `arr[3]` results in near-instant **cache hits**.
2. **Pointer Chasing in Linked Lists**:
   - Each `ListNode` is allocated independently in V8's Young Generation heap. Node addresses are scattered. Following `node.next` requires fetching new, distant memory addresses, causing frequent **CPU cache misses** and memory stalls.

### V8 Garbage Collector & Circular References
When a node is disconnected from a linked list:
```javascript
prev.next = target.next; // target is disconnected
```
- If no other variable references `target`, it becomes unreachable from the **GC Root** (global scope, active call stack).
- V8's **Scavenger collector** cleans up unreachable short-lived nodes during minor GC passes in microseconds.
- **Warning for Doubly Linked Lists**: In circular doubly linked lists, forgetting to disconnect `prev` and `next` when releasing a sub-chain can prevent references from dropping to zero in non-tracing environments. Modern V8 uses mark-and-sweep, but holding a stray reference to even one node in a chain keeps the entire chain alive in RAM!

### When Do Node.js Backends Use Linked Lists?
Despite CPU cache penalties, Linked Lists are the gold standard when:
1. **$O(1)$ FIFO Queues**: Array `shift()` is $O(n)$ because it re-indexes the internal buffer. A linked queue provides true $O(1)$ enqueue and dequeue.
2. **Internal Libuv Timers**: Node.js maintains internal linked lists of active timers (`setTimeout`) grouped by timeout duration to achieve constant-time insertions and cancellations.

---

## 7. Hands-On Exercise

### The Scenario
You are developing an in-memory undo buffer for a real-time collaborative text editor in Node.js.
You must implement a `DoublyLinkedListBuffer` class that supports:
1. `push(val)`: Appends an action to the tail.
2. `pop()`: Removes and returns the action from the tail.
3. `shift()`: Evicts the oldest action from the head in $O(1)$ time when buffer limit is exceeded.
4. `toArray()`: Returns an array of values from head to tail.

### The Buggy Code
```javascript
class BuggyBuffer {
  constructor() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  shift() {
    if (!this.head) return null;
    const val = this.head.val;
    // Bug: Fails to update head.next.prev to null, leaving dangling pointers!
    // Bug: When list has only 1 node, fails to reset this.tail to null!
    this.head = this.head.next;
    this.length--;
    return val;
  }
}
```

### Acceptance Criteria
1. `shift()` must execute in **$O(1)$ time** and properly clean up both `head` and `tail` pointers.
2. Empty buffer operations must return `null` safely without runtime crashes.
3. Correctly handles transitions from 1 element to 0 elements.
4. Verified with direct test execution.

### Verified Solution

```javascript
class DoublyNode {
  constructor(val) {
    this.val = val;
    this.prev = null;
    this.next = null;
  }
}

class DoublyLinkedListBuffer {
  constructor() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  push(val) {
    const node = new DoublyNode(val);
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail.next = node;
      node.prev = this.tail;
      this.tail = node;
    }
    this.length++;
  }

  pop() {
    if (!this.tail) return null;
    const val = this.tail.val;

    if (this.head === this.tail) {
      this.head = null;
      this.tail = null;
    } else {
      this.tail = this.tail.prev;
      this.tail.next = null;
    }
    this.length--;
    return val;
  }

  shift() {
    if (!this.head) return null;
    const val = this.head.val;

    if (this.head === this.tail) {
      this.head = null;
      this.tail = null;
    } else {
      this.head = this.head.next;
      this.head.prev = null; // Clean up backward pointer
    }
    this.length--;
    return val;
  }

  toArray() {
    const result = [];
    let curr = this.head;
    while (curr) {
      result.push(curr.val);
      curr = curr.next;
    }
    return result;
  }
}

// Example test runs
const buffer = new DoublyLinkedListBuffer();
buffer.push("Action 1");
buffer.push("Action 2");
buffer.push("Action 3");
console.log(buffer.toArray()); // [ 'Action 1', 'Action 2', 'Action 3' ]

console.log(buffer.shift());   // 'Action 1'
console.log(buffer.toArray()); // [ 'Action 2', 'Action 3' ]

console.log(buffer.pop());     // 'Action 3'
console.log(buffer.toArray()); // [ 'Action 2' ]

console.log(buffer.shift());   // 'Action 2'
console.log(buffer.toArray()); // []
console.log(buffer.shift());   // null
```

---

## 8. Tricky Points and Edge Cases

### 1. The Head Overwrite Trap
Writing `head = head.next` inside a function reassigns the local variable `head`, but does **not** mutate the caller's list or update any node references. Always maintain a traversal pointer: `let curr = head`.

### 2. Deleting Consecutive Target Nodes
If input is `[6, 6, 3]` and target is `6`:
If you advance `curr = curr.next` inside the deletion branch, you bypass the second `6` without inspecting it!
- **Rule**: Only advance `curr = curr.next` when `curr.next.val !== val`.

### 3. Edge Cases Checklist for Every Linked List Problem
- Empty list (`head === null`).
- Single-node list (`head.next === null`).
- Two-node list.
- Target is at the very `head`.
- Target is at the very `tail`.
- All nodes in list match the target value.

---

## 9. Comprehensive Summary

- **Linked Lists** trade cache-friendly contiguous indexing for constant-time $O(1)$ insertions and deletions at known pointer positions.
- **Singly Linked Lists** navigate via `next`; **Doubly Linked Lists** navigate both `next` and `prev`, enabling true $O(1)$ removal of middle nodes.
- **The Dummy Node Pattern** places a sentinel before the head (`dummy = new ListNode(0, head)`), unifying head and interior node modifications.
- **Remove Elements**: Use `curr.next = curr.next.next` to bypass matching nodes; advance `curr` only when no deletion occurs.
- **Merge Two Sorted Lists**: Use two pointers and a dummy head to weave nodes together in $O(n + m)$ time and $O(1)$ space without re-sorting.
- **Under the Hood**: Linked lists incur CPU cache miss overhead due to heap fragmentation. In Node.js, use them for high-churn queues and LRU caches rather than general-purpose random-access data.

---

## 10. Cheat Sheet

### Time Complexity Decision Matrix

| Operation | Array | Singly Linked List | Doubly Linked List |
| :--- | :---: | :---: | :---: |
| **Prepend (Insert Head)** | $O(n)$ | **$O(1)$** | **$O(1)$** |
| **Append (Insert Tail)** | $O(1)$ amortized | **$O(1)$** (with tail pointer) | **$O(1)$** |
| **Delete Head** | $O(n)$ | **$O(1)$** | **$O(1)$** |
| **Delete Middle (Given Node)** | $O(n)$ | $O(n)$ (must find predecessor) | **$O(1)$** |
| **Random Access (`nodeAt(i)`)**| **$O(1)$** | $O(n)$ | $O(n)$ |

### Common Pitfalls List
- **Dangling Pointer Bug**: Forgetting to set `node.prev = null` or `node.next = null` when removing doubly-linked nodes.
- **Premature Pointer Increment**: Advancing `curr = curr.next` on deletion, skipping duplicate consecutive items.
- **Null Reference Crash**: Calling `curr.next.val` when `curr.next` is `null`. Always check `while (curr && curr.next)`.
- **Losing the Head**: Returning `curr` instead of `dummy.next` after traversal finishes.

---

## 11. Interview Q&A

### 45-Second Technical Pitch
> *"A Linked List is a linear collection of heap-allocated nodes connected by pointers rather than contiguous memory. While arrays provide instant O(1) random indexing, they incur O(n) overhead when shifting elements at the head. Linked lists solve this by enabling O(1) head insertions, deletions, and middle-node splices. In technical interviews, we use a Sentinel Dummy Node to eliminate boundary edge cases when modifying heads. In high-traffic Node.js backend systems, linked lists power LRU eviction caches and asynchronous FIFO queues where O(1) shift performance outweighs CPU cache locality."*

### 1. Why does `Array.prototype.shift()` degrade performance in high-throughput Node.js queues, and how does a Linked List fix it?
**Answer:**
In V8, JavaScript arrays are backed by contiguous memory buffers. When you call `arr.shift()`, index 0 is removed, forcing the engine to shift all remaining $n - 1$ elements to the left by one position. For an array of 100,000 items, every single `shift()` requires 100,000 memory moves ($O(n)$ time), freezing the event loop.
A Linked List implements `dequeue` by simply pointing `this.head = this.head.next` and updating references in strictly **$O(1)$ constant time**, regardless of queue size.

### 2. What will the following code output in Node.js, and why?
```javascript
function deleteNode(node) {
  node = node.next;
}

const a = new ListNode(1);
const b = new ListNode(2);
a.next = b;
deleteNode(a);
console.log(a.val, a.next ? a.next.val : null);
```
**Answer:**
It outputs `1 2`.
In JavaScript, arguments are **passed by value**. When object references are passed into a function, the parameter `node` receives a copy of the pointer pointing to object `a`.
Executing `node = node.next` merely reassigns the local parameter variable `node` to point to object `b`. It does **not** mutate object `a` in the heap, nor does it alter `a.next`. The caller's list remains completely unchanged.

### 3. Spot and fix the bug in this list reversal attempt:
```javascript
function reverseListBuggy(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    curr.next = prev;
    prev = curr;
    curr = curr.next;
  }
  return prev;
}
```
**Answer:**
The bug is on line 7: `curr = curr.next;`.
On line 5, `curr.next` was already rewired to `prev`! Calling `curr = curr.next` immediately steps backward to `prev`, creating an **infinite loop**.
The fix requires saving the original forward reference in a temporary variable before mutating `curr.next`:
```javascript
const nextTemp = curr.next; // Save forward link
curr.next = prev;           // Reverse link
prev = curr;                // Advance prev
curr = nextTemp;            // Advance curr using saved link
```

### 4. How does CPU cache locality impact arrays versus linked lists on modern 64-bit server architectures?
**Answer:**
Modern CPUs retrieve memory in 64-byte chunks called **Cache Lines**.
Because arrays occupy contiguous memory, accessing `arr[0]` automatically pulls `arr[1]` through `arr[7]` into high-speed L1/L2 CPU cache, giving sequential iterations a near 100% cache hit rate.
Linked list nodes are allocated dynamically at scattered heap locations. Following `curr = curr.next` forces the CPU memory controller to perform **pointer chasing**, jumping to unpredictable memory addresses. This triggers frequent cache misses, requiring stalls while data is fetched from slower main RAM. Consequently, linear array scans often run 3x–5x faster than linked list traversals despite having the same Big O complexity.

---

## 12. Practice Problems

### 1. Remove Linked List Elements - Easy
Given the `head` of a linked list and an integer `val`, remove all nodes with `Node.val === val` and return the new head.
- **Sample Input 1:** `head = [1, 2, 6, 3, 4, 5, 6]`, `val = 6`
- **Expected Output 1:** `[1, 2, 3, 4, 5]`
- **Sample Input 2:** `head = [7, 7, 7, 7]`, `val = 7`
- **Expected Output 2:** `[]`
- **Sample Input 3:** `head = []`, `val = 1`
- **Expected Output 3:** `[]`

### 2. Merge Two Sorted Lists - Easy
Merge two sorted linked lists into one sorted list by splicing together existing nodes.
- **Sample Input 1:** `list1 = [1, 2, 4]`, `list2 = [1, 3, 4]`
- **Expected Output 1:** `[1, 1, 2, 3, 4, 4]`
- **Sample Input 2:** `list1 = []`, `list2 = [0]`
- **Expected Output 2:** `[0]`
- **Sample Input 3:** `list1 = []`, `list2 = []`
- **Expected Output 3:** `[]`

### 3. Middle of the Linked List - Easy
Given the `head` of a singly linked list, return the middle node. If there are two middle nodes, return the second middle node.
- **Sample Input 1:** `head = [1, 2, 3, 4, 5]`
- **Expected Output 1:** `[3, 4, 5]`
- **Sample Input 2:** `head = [1, 2, 3, 4, 5, 6]`
- **Expected Output 2:** `[4, 5, 6]`

### 4. Delete Node in a Linked List - Medium
Given access only to a node to be deleted in a singly linked list (not given the head), delete the node.
- **Sample Input 1:** `head = [4, 5, 1, 9]`, `node = 5`
- **Expected Output 1:** `[4, 1, 9]`

---

<nav aria-label="Lecture navigation">

[Previous: Prefix Sum & Subarray Totals](day-10-prefix-sum-and-subarray-totals.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Linked List Reversals & Cycle Detection](day-12-linked-list-reversals-and-cycle-detection.md)

</nav>
