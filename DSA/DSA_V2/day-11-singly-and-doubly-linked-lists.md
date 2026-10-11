# Day 11: Singly & Doubly Linked Lists

<nav aria-label="Lecture navigation">

[Previous: Prefix Sum & Subarray Totals](day-10-prefix-sum-and-subarray-totals.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Linked List Reversals & Cycles](day-12-linked-list-reversals-and-cycle-detection.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Asymptotic complexity.
- Basic JavaScript classes, objects, and reference pointers.

---

## 1. What is a Linked List?

A **Linked List** is a linear data structure where elements (called **Nodes**) are stored in scattered memory locations and connected using **pointers**.

> **Node**: A simple JavaScript object with two properties: `val` (the data) and `next` (a reference pointing to the next node).

```text
Singly Linked List:
[ 10 | next ] ──► [ 20 | next ] ──► [ 30 | next ] ──► null
  (Head)                                (Tail)
```

### Linked List vs Array

| Feature | Array | Linked List |
| :--- | :---: | :---: |
| **Memory layout** | Contiguous (single block) | Scattered across heap memory |
| **Access by index (`[i]`)** | **$O(1)$** (instant offset) | **$O(n)$** (must traverse from head) |
| **Insert / Delete at Head** | $O(n)$ (shifts all elements) | **$O(1)$** (rewires 1 pointer) |
| **Memory overhead** | Low (values only) | Higher (stores pointer per node) |

---

## 2. The Standard `ListNode` Definition

```javascript
// Node.js code
class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

// Creating: 1 -> 2 -> 3
const head = new ListNode(1, new ListNode(2, new ListNode(3)));
```

---

## 3. The Dummy (Sentinel) Node Trick

In linked list problems, modifying the `head` node often requires messy `if (head === null)` or special case checks.
A **Dummy Node** is a fake node placed before the head:

```text
[ Dummy: 0 ] ──► [ Head: 10 ] ──► [ 20 ] ──► null
```
With a dummy node:
- The head node can be deleted or changed just like any normal interior node.
- You simply return **`dummy.next`** at the end!

---

## 4. Problem 1: Remove Elements from Linked List

Given the `head` of a linked list and an integer `val`, remove all nodes with `node.val === val`.

```javascript
// Node.js code
function removeElements(head, val) {
  // Create a dummy node before head
  const dummy = new ListNode(0, head);
  let current = dummy;

  while (current.next !== null) {
    if (current.next.val === val) {
      // Skip the target node by pointing past it
      current.next = current.next.next;
    } else {
      current = current.next;
    }
  }

  return dummy.next;
}

// Test: 1 -> 2 -> 6 -> 3 -> 6, remove 6
const list = new ListNode(1, new ListNode(2, new ListNode(6, new ListNode(3, new ListNode(6)))));
let res = removeElements(list, 6);

const values = [];
while (res) {
  values.push(res.val);
  res = res.next;
}
console.log(values); // [1, 2, 3]
```
- **Time Complexity:** $O(n)$ — Single pass through list.
- **Extra Space:** $O(1)$ — Only a pointer reference.

---

## 5. Problem 2: Merge Two Sorted Lists

Merge two sorted linked lists and return it as a single sorted list.

```javascript
// Node.js code
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

  // Attach whatever remains of the non-empty list
  tail.next = list1 !== null ? list1 : list2;

  return dummy.next;
}
```
- **Time Complexity:** $O(n + m)$ — Where $n$ and $m$ are list lengths.
- **Extra Space:** $O(1)$ — Reuses existing nodes by rewiring pointers.

---

## 6. Doubly Linked Lists: Forward and Backward

A **Doubly Linked List** node has two pointers: `prev` and `next`:

```text
null ◄── [ prev | 10 | next ] ◄══► [ prev | 20 | next ] ──► null
```
- **Benefit:** Can delete a given node in $O(1)$ without needing to search from the head.
- **Tradeoff:** Uses more memory per node (2 pointers instead of 1).

---

## 7. Tricky Points and Common Traps

1. **Losing the head reference:** Never do `head = head.next` inside a loop without keeping a pointer variable, or the entire list becomes unreachable!
2. **Accessing `.val` on `null`:** Calling `curr.next.val` when `curr.next === null` throws `TypeError: Cannot read properties of null`. Always check `while (curr && curr.next)`.
3. **Always use a dummy node:** Whenever removing nodes or creating a new merged list, a dummy node prevents edge cases when the head itself changes.

---

## 8. Hands-On Exercises

Run this script in Node.js to verify list merging:

```javascript
// Node.js code
const assert = require("node:assert");

class Node {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

function testMerge(l1, l2) {
  const d = new Node(0);
  let cur = d;
  while (l1 && l2) {
    if (l1.val <= l2.val) { cur.next = l1; l1 = l1.next; }
    else { cur.next = l2; l2 = l2.next; }
    cur = cur.next;
  }
  cur.next = l1 || l2;
  return d.next;
}

const a = new Node(1, new Node(3));
const b = new Node(2, new Node(4));
let merged = testMerge(a, b);
const out = [];
while (merged) { out.push(merged.val); merged = merged.next; }

assert.deepEqual(out, [1, 2, 3, 4]);
console.log("✅ Linked list merge assertions passed!");
```

---

## 9. Summary

- **Linked Lists** connect items using node references (`next`).
- **Insertion/Deletion at head** is $O(1)$; search by index is $O(n)$.
- **Dummy Node (`dummy.next = head`)** simplifies head updates and eliminates edge cases.
- **Merging lists** takes $O(n + m)$ time by rewiring existing node pointers.

---

## 10. Cheat Sheet

| Operation | Linked List | Array |
| :--- | :---: | :---: |
| Access index `i` | $O(n)$ | **$O(1)$** |
| Prepend at head | **$O(1)$** | $O(n)$ |
| Append at tail (with tail ptr) | **$O(1)$** | $O(1)$ amortized |
| Delete head | **$O(1)$** | $O(n)$ |

---

## 11. Interview Q&A

### 45-Second Explanation
> *"A Linked List stores elements in scattered memory connected by pointer links. To merge two sorted lists in $O(1)$ extra space, we create a dummy head node. We then compare the current nodes of both lists, attach the smaller node to our merged tail pointer, and advance. Finally, we attach any remaining nodes directly. Returning `dummy.next` gives the merged sorted list in $O(n + m)$ time."*

---

## 12. Practice Problems

### 1. Remove Linked List Elements - Easy
Given the `head` of a linked list and an integer `val`, remove all the nodes of the linked list that has `Node.val == val`, and return the new head.
- **Input:** `head = [1,2,6,3,4,5,6]`, `val = 6`
- **Expected Output:** `[1,2,3,4,5]`
- **Input:** `head = []`, `val = 1`
- **Expected Output:** `[]`
- **Input:** `head = [7,7,7,7]`, `val = 7`
- **Expected Output:** `[]`

### 2. Merge Two Sorted Lists - Easy
You are given the heads of two sorted linked lists `list1` and `list2`. Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists. Return the head of the merged linked list.
- **Input:** `list1 = [1,2,4]`, `list2 = [1,3,4]`
- **Expected Output:** `[1,1,2,3,4,4]`
- **Input:** `list1 = []`, `list2 = []`
- **Expected Output:** `[]`
- **Input:** `list1 = []`, `list2 = [0]`
- **Expected Output:** `[0]`

### 3. Middle of the Linked List - Easy
Given the `head` of a singly linked list, return the middle node of the linked list. If there are two middle nodes, return the second middle node.
- **Input:** `head = [1,2,3,4,5]`
- **Expected Output:** `[3,4,5]`
- **Input:** `head = [1,2,3,4,5,6]`
- **Expected Output:** `[4,5,6]`

---

<nav aria-label="Lecture navigation">

[Previous: Prefix Sum & Subarray Totals](day-10-prefix-sum-and-subarray-totals.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Linked List Reversals & Cycles](day-12-linked-list-reversals-and-cycle-detection.md)

</nav>
