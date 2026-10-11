# Day 12: Linked List Reversals & Cycles

<nav aria-label="Lecture navigation">

[Previous: Singly & Doubly Linked Lists](day-11-singly-and-doubly-linked-lists.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Stacks & Expression Parsing](day-13-stacks-and-expression-parsing.md)

</nav>

## Prerequisites

- [Day 07: Two Pointers: Fast & Slow](day-07-two-pointers-fast-slow-and-partitioning.md) — Floyd's cycle detection principle.
- [Day 11: Singly & Doubly Linked Lists](day-11-singly-and-doubly-linked-lists.md) — `ListNode` definition and pointer references.

---

## 1. Reversing a Linked List In-Place

To reverse a linked list in $O(1)$ space, we reverse each node's `next` pointer to point backwards.

We maintain **three pointers**:
- `prev`: The node before `curr` (starts as `null`).
- `curr`: The node currently being processed (starts as `head`).
- `nextTemp`: Temporarily holds `curr.next` so we don't lose the rest of the list when we flip the arrow!

```text
Before reversal:
null ◄── [ 1 ] ──► [ 2 ] ──► [ 3 ] ──► null
 prev     curr    nextTemp

Flip arrow: curr.next = prev
null ◄── [ 1 ] ◄── [ 2 ] ──► [ 3 ] ──► null
          prev     curr    nextTemp
```

```javascript
// Node.js code: Standard In-Place Reversal
function reverseList(head) {
  let prev = null;
  let curr = head;

  while (curr !== null) {
    const nextTemp = curr.next; // 1. Save next node
    curr.next = prev;           // 2. Reverse arrow
    prev = curr;                // 3. Move prev forward
    curr = nextTemp;            // 4. Move curr forward
  }

  return prev; // prev is now the new head!
}
```
- **Time Complexity:** $O(n)$ — Single pass through list.
- **Extra Space:** $O(1)$ — Only three pointers used.

---

## 2. Finding the Middle of a Linked List

To find the middle node in a single pass without counting nodes first, use **Fast and Slow Pointers**:
- `slow` advances **1 step**: `slow = slow.next`
- `fast` advances **2 steps**: `fast = fast.next.next`
- When `fast` reaches the end, `slow` is sitting **exactly at the middle**!

```javascript
// Node.js code
function middleNode(head) {
  let slow = head;
  let fast = head;

  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }

  return slow;
}
```
- **Time Complexity:** $O(n)$
- **Extra Space:** $O(1)$

---

## 3. Detecting Cycles (Floyd's Tortoise and Hare)

Given `head`, determine if the list has a cycle (a node points back to a previous node).

### The Algorithm:
- `slow` moves 1 step; `fast` moves 2 steps.
- If there is no cycle, `fast` reaches `null`.
- If there is a cycle, `fast` will eventually loop around and **catch up to `slow`**!

```javascript
// Node.js code: Cycle Detection
function hasCycle(head) {
  let slow = head;
  let fast = head;

  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) {
      return true; // Cycle detected!
    }
  }

  return false;
}
```
- **Time Complexity:** $O(n)$
- **Extra Space:** $O(1)$ — Zero extra memory (no Set required).

---

## 4. Problem: Palindrome Linked List

Check if a singly linked list reads the same forward and backward in $O(n)$ time and $O(1)$ space.

### The 3-Step Plan:
1. Find the middle node using Fast & Slow pointers.
2. Reverse the second half of the list.
3. Compare the first half and reversed second half node-by-node.

```javascript
// Node.js code
function isPalindrome(head) {
  if (!head || !head.next) return true;

  // 1. Find middle
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }

  // 2. Reverse second half
  let prev = null, curr = slow;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }

  // 3. Compare halves
  let p1 = head, p2 = prev;
  while (p2) {
    if (p1.val !== p2.val) return false;
    p1 = p1.next;
    p2 = p2.next;
  }

  return true;
}
```
- **Time Complexity:** $O(n)$
- **Extra Space:** $O(1)$

---

## 5. Tricky Points and Common Traps

1. **Forgetting to save `curr.next` before reversing:** If you do `curr.next = prev` before saving `curr.next`, the rest of the list is lost forever.
2. **Loop condition for fast pointer:** Always check `while (fast !== null && fast.next !== null)`. If you only check `fast.next`, calling `fast.next.next` throws a TypeError when `fast` is `null`!
3. **Empty list or single node:** Always test `if (!head || !head.next)` as your base case.

---

## 6. Hands-On Exercises

Run this script in Node.js to test list reversal:

```javascript
// Node.js code
const assert = require("node:assert");

class Node {
  constructor(val, next = null) { this.val = val; this.next = next; }
}

function testRev(head) {
  let prev = null, cur = head;
  while (cur) {
    const nxt = cur.next;
    cur.next = prev;
    prev = cur;
    cur = nxt;
  }
  return prev;
}

const list = new Node(1, new Node(2, new Node(3)));
let rev = testRev(list);
const res = [];
while (rev) { res.push(rev.val); rev = rev.next; }

assert.deepEqual(res, [3, 2, 1]);
console.log("✅ Reversal assertions passed!");
```

---

## 7. Summary

- **In-place reversal** uses 3 pointers (`prev`, `curr`, `nextTemp`) in $O(n)$ time and $O(1)$ space.
- **Middle of list** is found in one pass by moving `slow` 1 step and `fast` 2 steps.
- **Floyd's Tortoise & Hare** detects cycles without using an extra Set.
- **Palindrome list** combines finding the middle, reversing the second half, and comparing halves in $O(1)$ space.

---

## 8. Cheat Sheet

| Task | Core Pointer Logic | Complexity |
| :--- | :--- | :---: |
| **Reverse List** | `next = c.next; c.next = p; p = c; c = next;` | $O(n)$ time, $O(1)$ space |
| **Find Middle** | `slow = slow.next; fast = fast.next.next;` | $O(n)$ time, $O(1)$ space |
| **Detect Cycle** | If `slow === fast` $\to$ cycle exists! | $O(n)$ time, $O(1)$ space |

---

## 9. Interview Q&A

### 45-Second Explanation
> *"To reverse a linked list in-place without extra memory, we use three pointers: prev, curr, and a temporary next pointer. In each step, we store curr.next, redirect curr.next to point backward to prev, advance prev to curr, and advance curr to the saved next node. When curr reaches null, prev points to the new head of the reversed list, running in $O(n)$ time and $O(1)$ auxiliary space."*

---

## 10. Practice Problems

### 1. Reverse Linked List - Easy
Given the `head` of a singly linked list, reverse the list, and return the reversed list.
- **Input:** `head = [1,2,3,4,5]`
- **Expected Output:** `[5,4,3,2,1]`
- **Input:** `head = [1,2]`
- **Expected Output:** `[2,1]`

### 2. Linked List Cycle - Easy
Given `head`, the head of a linked list, determine if the linked list has a cycle in it.
- **Input:** `head = [3,2,0,-4], pos = 1`
- **Expected Output:** `true`
- **Input:** `head = [1,2], pos = 0`
- **Expected Output:** `true`
- **Input:** `head = [1], pos = -1`
- **Expected Output:** `false`

### 3. Palindrome Linked List - Easy
Given the `head` of a singly linked list, return `true` if it is a palindrome or `false` otherwise.
- **Input:** `head = [1,2,2,1]`
- **Expected Output:** `true`
- **Input:** `head = [1,2]`
- **Expected Output:** `false`

---

<nav aria-label="Lecture navigation">

[Previous: Singly & Doubly Linked Lists](day-11-singly-and-doubly-linked-lists.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Stacks & Expression Parsing](day-13-stacks-and-expression-parsing.md)

</nav>
