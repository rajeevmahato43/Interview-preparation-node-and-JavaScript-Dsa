# Day 15: Queues & Circular Buffers

<nav aria-label="Lecture navigation">

[Previous: Monotonic Stacks](day-14-monotonic-stack-patterns.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search: Bounds & Rotated Arrays](day-16-binary-search-bounds-and-rotated-arrays.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — The $O(n)$ cost of `shift()`.
- [Day 11: Singly & Doubly Linked Lists](day-11-singly-and-doubly-linked-lists.md) — Node pointers.

---

## 1. What is a Queue?

A **Queue** is a linear data structure that follows the **FIFO** (First In, First Out) principle.

Think of waiting in line at a movie theater ticket counter:
- The first person in line is the first person served.
- New people join at the **back** (`enqueue`).
- People leave from the **front** (`dequeue`).

```text
Enqueue 10:  [ 10 ]
Enqueue 20:  [ 10, 20 ]
Dequeue():   Removes 10 ──► Queue is now [ 20 ]
```

### The JavaScript Array Queue Trap
In JavaScript, developers often use `arr.push()` to enqueue and `arr.shift()` to dequeue.
- `arr.push()` is $O(1)$.
- **`arr.shift()` is $O(n)$!** It forces every remaining element in memory to slide left by 1 spot.
- Using `shift()` inside a loop makes your code **accidentally $O(n^2)$ slow**!

---

## 2. A Real $O(1)$ Queue in JavaScript

To get true $O(1)$ enqueue and dequeue, use an object map or head pointer:

```javascript
// Node.js code: Production O(1) Queue
class Queue {
  constructor() {
    this.items = {};
    this.head = 0;
    this.tail = 0;
  }

  enqueue(val) {
    this.items[this.tail] = val;
    this.tail++;
  }

  dequeue() {
    if (this.isEmpty()) return null;
    const val = this.items[this.head];
    delete this.items[this.head];
    this.head++;
    return val;
  }

  peek() {
    return this.isEmpty() ? null : this.items[this.head];
  }

  size() {
    return this.tail - this.head;
  }

  isEmpty() {
    return this.size() === 0;
  }
}
```
- **Enqueue:** $O(1)$
- **Dequeue:** $O(1)$

---

## 3. Circular Queue (Circular Buffer)

A **Circular Queue** is a fixed-size array that wraps around to the beginning using the modulo operator (`% capacity`). It is used in network sockets and operating systems where memory is strictly bounded.

```javascript
// Node.js code
class MyCircularQueue {
  constructor(k) {
    this.buffer = new Array(k);
    this.capacity = k;
    this.head = 0;
    this.count = 0;
  }

  enQueue(value) {
    if (this.isFull()) return false;
    const tail = (this.head + this.count) % this.capacity;
    this.buffer[tail] = value;
    this.count++;
    return true;
  }

  deQueue() {
    if (this.isEmpty()) return false;
    this.head = (this.head + 1) % this.capacity; // Wrap around
    this.count--;
    return true;
  }

  Front() {
    return this.isEmpty() ? -1 : this.buffer[this.head];
  }

  Rear() {
    if (this.isEmpty()) return -1;
    const tail = (this.head + this.count - 1) % this.capacity;
    return this.buffer[tail];
  }

  isEmpty() { return this.count === 0; }
  isFull() { return this.count === this.capacity; }
}
```
- **Time Complexity:** All operations strictly **$O(1)$**.
- **Memory:** Fixed $O(k)$ capacity.

---

## 4. Problem: Sliding Window Maximum (Monotonic Deque)

Given an array `nums` and window size $k$, return the maximum value in each sliding window.

### The Insight: Monotonic Decreasing Deque
A **Deque** (double-ended queue) allows adding and removing from both ends in $O(1)$.
We maintain indices of elements in decreasing order:
1. Remove elements that have fallen outside the window (`index <= i - k`).
2. Remove elements from the back that are smaller than the incoming element (they can never be the maximum!).
3. Add current element. The front of the deque is always the **current window maximum**!

```javascript
// Node.js code
function maxSlidingWindow(nums, k) {
  const deque = []; // Stores indices
  const result = [];

  for (let i = 0; i < nums.length; i++) {
    // 1. Remove indices outside window
    if (deque.length > 0 && deque[0] <= i - k) {
      deque.shift();
    }

    // 2. Remove smaller values from back
    while (deque.length > 0 && nums[i] >= nums[deque[deque.length - 1]]) {
      deque.pop();
    }

    deque.push(i);

    // 3. Record maximum once first window is formed
    if (i >= k - 1) {
      result.push(nums[deque[0]]);
    }
  }

  return result;
}

console.log(maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3));
// Output: [3, 3, 5, 5, 6, 7]
```
- **Time Complexity:** $O(n)$ — Each item added and removed at most once.
- **Extra Space:** $O(k)$ for the deque.

---

## 5. Tricky Points and Common Traps

1. **`arr.shift()` in high-traffic Node.js code:** Never use an array with `.shift()` for background job queues. Use an object with pointers or an npm package like `denque`.
2. **Modulo wrap-around in Circular Queue:** The index formula is always `(head + offset) % capacity`.
3. **Queue memory leak:** If using an array with a `head` index pointer without deleting old elements, the array grows forever in memory. Use `delete this.items[head]` or reset pointers when empty.

---

## 6. Hands-On Exercises

Run this script in Node.js to verify circular queue mechanics:

```javascript
// Node.js code
const assert = require("node:assert");

const q = new MyCircularQueue(3);
assert.equal(q.enQueue(1), true);
assert.equal(q.enQueue(2), true);
assert.equal(q.enQueue(3), true);
assert.equal(q.enQueue(4), false); // Full!
assert.equal(q.Rear(), 3);
assert.equal(q.isFull(), true);
assert.equal(q.deQueue(), true);
assert.equal(q.enQueue(4), true); // Wraps around!
assert.equal(q.Rear(), 4);

console.log("✅ Circular queue assertions passed!");
```

---

## 7. Summary

- **Queues** follow FIFO (First In, First Out).
- **`arr.shift()` is $O(n)$**: Replace with a pointer-based queue for true $O(1)$ dequeuing.
- **Circular Queues** reuse a fixed buffer using modulo arithmetic (`% capacity`).
- **Monotonic Deques** solve Sliding Window Maximum in $O(n)$ time.

---

## 8. Cheat Sheet

| Data Structure | Add Operation | Remove Operation | Time |
| :--- | :--- | :--- | :---: |
| **JS Array Queue (Naive)** | `push()` | `shift()` | $O(n)$ remove ⚠️ |
| **Pointer / Map Queue** | `tail++` | `head++` | **$O(1)$** |
| **Circular Queue** | `(head + count) % cap` | `(head + 1) % cap` | **$O(1)$** |
| **Monotonic Deque** | `push()` / `pop()` | `shift()` | **$O(1)$** |

---

## 9. Interview Q&A

### 45-Second Explanation
> *"A Queue is a First-In, First-Out data structure. While JavaScript arrays have an $O(1)$ push method, calling shift to dequeue takes $O(n)$ time because it slides all elements in memory. To achieve true $O(1)$ operations, we track head and tail indices over a hash map or circular buffer. For Sliding Window Maximum, we use a monotonic decreasing deque to track candidate maximums, achieving an optimal $O(n)$ runtime."*

---

## 10. Practice Problems

### 1. Implement Queue using Stacks - Easy
Implement a first in first out (FIFO) queue using only two stacks. The implemented queue should support all the functions of a normal queue (`push`, `peek`, `pop`, and `empty`).
- **Input:** `["MyQueue", "push", "push", "peek", "pop", "empty"], [[], [1], [2], [], [], []]`
- **Expected Output:** `[null, null, null, 1, 1, false]`

### 2. Design Circular Queue - Medium
Design your implementation of the circular queue. The circular queue is a linear data structure in which the operations are performed based on FIFO principle, and the last position is connected back to the first position to make a circle.
- **Input:** `["MyCircularQueue", "enQueue", "enQueue", "enQueue", "enQueue", "Rear", "isFull", "deQueue", "enQueue", "Rear"], [[3], [1], [2], [3], [4], [], [], [], [4], []]`
- **Expected Output:** `[null, true, true, true, false, 3, true, true, true, 4]`

### 3. Sliding Window Maximum - Hard
You are given an array of integers `nums`, there is a sliding window of size `k` which is moving from the very left of the array to the very right. You can only see the `k` numbers in the window. Each time the sliding window moves right by one position. Return the max sliding window.
- **Input:** `nums = [1,3,-1,-3,5,3,6,7], k = 3`
- **Expected Output:** `[3,3,5,5,6,7]`
- **Input:** `nums = [1], k = 1`
- **Expected Output:** `[1]`

---

<nav aria-label="Lecture navigation">

[Previous: Monotonic Stacks](day-14-monotonic-stack-patterns.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search: Bounds & Rotated Arrays](day-16-binary-search-bounds-and-rotated-arrays.md)

</nav>
