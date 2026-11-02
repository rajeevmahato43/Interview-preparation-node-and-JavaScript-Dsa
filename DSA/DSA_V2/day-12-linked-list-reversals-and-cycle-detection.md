# Day 12: Linked List Reversals & Cycle Detection

<nav aria-label="Lecture navigation">

[Previous: Singly & Doubly Linked Lists](day-11-singly-and-doubly-linked-lists.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Stacks & Expression Parsing](day-13-stacks-and-expression-parsing.md)

</nav>

---

## 1. Linked List Reversals

In a singly linked list, each node points only forward. **Reversing** means turning every `next` pointer backward so the last node becomes the new head, and the first node points to `null`.

To picture this physically, imagine a conga line where people hold the shoulders of the person in front of them:
1. Person 1 holds Person 2's shoulders, and Person 2 holds Person 3's shoulders.
2. To turn the line around without anyone moving to a different spot on the floor:
   * Person 1 lets go and drops their hands (points to `null`).
   * Person 2 turns around and places their hands on Person 1's shoulders.
   * Person 3 turns around and places their hands on Person 2's shoulders.
3. The person who was at the back is now the new leader (**New Head**)!

```text
REVERSAL FLOW:
Initial:   [ 1 ] ──► [ 2 ] ──► [ 3 ] ──► null
Reversed:  null ◄── [ 1 ] ◄── [ 2 ] ◄── [ 3 ]
```

```javascript
// Node.js code
"use strict";

class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

// Baseline 3-pointer iterative reversal
function reverseList(head) {
  let prev = null;
  let curr = head;

  while (curr !== null) {
    const nextTemp = curr.next; // 1. Save forward path
    curr.next = prev;           // 2. Invert link backward
    prev = curr;                // 3. Advance prev
    curr = nextTemp;            // 4. Advance curr
  }

  return prev; // prev is the new head
}

const n3 = new ListNode(3);
const n2 = new ListNode(2, n3);
const n1 = new ListNode(1, n2);

let rev = reverseList(n1);
const output = [];
while (rev) { output.push(rev.val); rev = rev.next; }
console.log(output); // [ 3, 2, 1 ]
```

---

### 1.1 The 3-Pointer Iterative Reversal Engine

To reverse a list in-place without losing any nodes, move three pointers forward together:
* `prev`: Points to the node behind us (starts as `null`).
* `curr`: Points to the node we are currently turning around (starts as `head`).
* `nextTemp`: Temporarily holds `curr.next` so we don't lose the rest of the list when we turn `curr.next` around.

```text
Step 1: Save next:    nextTemp = curr.next
Step 2: Turn around:  curr.next = prev
Step 3: Move prev:    prev = curr
Step 4: Move curr:    curr = nextTemp
```

---

### 1.2 Why Loops are Better Than Recursion

In production Node.js systems, always reverse linked lists with **loops, not recursion**:
* V8 allows only a limited number of function calls on the call stack (usually ~10,000 frames).
* A recursive reversal adds one function call per node. If a list has 15,000 nodes, it crashes immediately with `RangeError: Maximum call stack size exceeded`.
* A `while` loop runs in **$O(1)$ constant memory** and will never run out of stack space.

> [!NOTE]
> **Self-Check:** What happens if you run `curr.next = prev` before saving `const nextTemp = curr.next`?  
> *Answer:* You cut your only bridge to the rest of the list. All remaining nodes are lost and become unreachable in memory.

---

## 2. Cycle Detection Mechanics

A **Cycle** happens when a node's `next` pointer points back to an earlier node instead of ending at `null`. If a cycle exists, a normal `while (curr !== null)` loop will run forever.

To picture this physically, imagine two runners on a circular track:
* **Runner S (Slow):** Runs at 1 lap per hour.
* **Runner F (Fast):** Runs at 2 laps per hour.
* If the track is straight and ends at a wall (`null`), Runner F reaches the end first.
* If the track loops into a circle, Runner F enters the circle and catches up to Runner S from behind. Because the fast runner closes the gap by 1 step in every round ($2 - 1 = 1$), they are guaranteed to meet!

```text
CYCLE DETECTION (Floyd's Tortoise & Hare):
[ Head ] ──► [ Node A ] ──► [ Entry Node ] ──► [ Node B ]
                                  ▲                   │
                                  │                   ▼
                               [ Node D ] ◄──────── [ Node C ]
```

---

### 2.1 Finding the Cycle Start Node

When `slow` (1 step) and `fast` (2 steps) meet inside a cycle:
* Let $L$ = Distance from `head` to the start of the cycle.
* Let $x$ = Distance from cycle start to the meeting point.
* Let $C$ = Total length around the loop.

Because `fast` moves twice as fast as `slow`:
$$2(L + x) = L + x + k \cdot C \implies L + x = k \cdot C \implies L = (k - 1)C + (C - x)$$

**The Core Insight:** $(C - x)$ is the remaining distance from the meeting point back to the start of the cycle!  
This means the distance from `head` to the cycle start ($L$) is mathematically identical to the distance from the meeting point to the cycle start.
* **Algorithm:** Once they collide, put one pointer back at `head` and leave the other pointer at the collision spot. Move both forward by 1 step at a time. They will collide exactly at the **Cycle Entry Node**!

---

### 2.2 Pattern Family
* **3-Pointer Inversion:** Sliding `prev`, `curr`, and `nextTemp` to reverse links in $O(1)$ space.
* **Floyd's Tortoise & Hare:** 1-step vs 2-step speeds to find loops and find midpoints in $O(1)$ space.
* **Phase 2 Entry Discovery:** Resetting one pointer to `head` after collision to locate the loop start.
* **Midpoint Split & Merge:** Using fast/slow pointers to split a list in half, reversing the second half to check palindromes.

### 2.3 Pattern Recognition Table

| Problem Keyword | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| **"Reverse linked list"** | Turn pointer directions around. | 3-pointer iterative loop (`prev`, `curr`, `nextTemp`). |
| **"Detect cycle / circular list"** | Check if a loop exists in $O(1)$ space. | Floyd's Tortoise & Hare (`slow`, `fast`). |
| **"Find beginning of cycle"** | Find the exact node where loop starts. | Phase 1 (collision) + Phase 2 (walk from head). |
| **"Palindrome linked list"** | Check if list reads same forwards and backwards. | Split at middle $\to$ reverse second half $\to$ compare. |

### 2.4 When to Use vs When NOT to Use
* **When to Use**:
  * You need to reverse a whole list or part of a list using $O(1)$ extra space.
  * You need to check for loops or find the middle node in one pass.
  * Checking if a linked list is a palindrome without making extra arrays.
* **When NOT to Use**:
  * The list already has backward pointers (Doubly Linked List; just swap `next` and `prev` on each node).
  * You are working with a normal indexed array (use Opposing Two Pointers).

### 2.5 The 10^7 Operations Rule
* Walking through $n = 100,000$ nodes with Floyd's algorithm takes at most $2n = 200,000$ steps, finishing in **under 2 milliseconds** in Node.js.
* Storing nodes in a `Set` to check for cycles takes $O(n)$ extra memory ($\approx 8\text{MB}$). Floyd's algorithm uses **$O(1)$ extra space** (zero extra memory allocations).

---

## 3. Problem Walkthroughs

---

### 3.1 Reverse Linked List

#### 3.1.1 Problem Statement
Given the `head` of a singly linked list, reverse the list, and return the reversed list's head.

* **Sample Input 1:** `head = [1, 2, 3, 4, 5]` $\to$ **Expected Output:** `[5, 4, 3, 2, 1]`
* **Sample Input 2:** `head = [1, 2]` $\to$ **Expected Output:** `[2, 1]`
* **Sample Input 3:** `head = []` $\to$ **Expected Output:** `[]`
* **Constraints:** The number of nodes in the list is in the range $[0, 5000]$, $-5000 \le Node.val \le 5000$.

#### 3.1.2 How to Think About It
5 numbered cards on a desk: `[ 1 ] -> [ 2 ] -> [ 3 ] -> [ 4 ] -> [ 5 ] -> null`.
* Put a marker `prev` pointing to `null`.
* Put your left hand on Card `1` (`curr`).
* Before changing Card `1`, put your right hand on Card `2` (`nextTemp = curr.next`) so the rest of the cards aren't lost.
* Now turn Card `1`'s arrow backward to point to `prev`.
* Slide `prev` to Card `1`. Slide `curr` to Card `2` (where your right hand was waiting).
* Keep going until your left hand falls off the desk (`curr === null`).
* The card under `prev` is Card `5` — your new head!

#### 3.1.3 Brute Force Approach & Bottleneck
Copying all node values into an array, reversing the array, and overwriting node values:

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

* **The Bottleneck:** Wastes $O(n)$ extra memory. It fails if the actual node objects themselves must be kept and rewired.

#### 3.1.4 The Pattern Insight
Use a **3-Pointer Iterative Slide** (`prev`, `curr`, `nextTemp`):
* `nextTemp = curr.next`
* `curr.next = prev`
* `prev = curr`
* `curr = nextTemp`
* Every node pointer is reversed in a single pass using $O(1)$ memory.

#### 3.1.5 Pseudocode

```text
FUNCTION ReverseList(head):
  prev = null
  curr = head

  WHILE curr != null:
    nextTemp = curr.next
    curr.next = prev
    prev = curr
    curr = nextTemp

  RETURN prev
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(1) space iterative pointer reversal
function reverseList(head) {
  let prev = null;
  let curr = head;

  while (curr !== null) {
    const nextTemp = curr.next; // Preserve remaining forward path
    curr.next = prev;           // Invert link backward
    prev = curr;                // Advance prev to current node
    curr = nextTemp;            // Advance curr to next node
  }

  return prev; // prev points to the new head
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

// Example runs
console.log(toArray(reverseList(createList([1, 2, 3, 4, 5])))); // [ 5, 4, 3, 2, 1 ]
console.log(toArray(reverseList(createList([1, 2]))));          // [ 2, 1 ]
console.log(toArray(reverseList(createList([]))));              // []
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Recursive reversal risking call stack overflow
function recursiveReverse(head) {
  // BUG: On lists with > 10,000 nodes, throws RangeError: Maximum call stack size exceeded!
  if (!head || !head.next) return head;
  const newHead = recursiveReverse(head.next);
  head.next.next = head;
  head.next = null;
  return newHead;
}
```
* **Why it fails:** Recursion uses $O(n)$ stack memory. In Node.js, large linked lists crash the engine with maximum call stack size exceeded.

#### 3.1.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The loop checks each node once.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. We only use three simple pointer variables.

---

### 3.2 Linked List Cycle II

#### 3.2.1 Problem Statement
Given the `head` of a linked list, return the **node where the cycle begins**. If there is no cycle, return `null`.

Do not modify the linked list. Solve it using **$O(1)$ auxiliary space**.

* **Sample Input 1:** `head = [3, 2, 0, -4]`, `pos = 1` $\to$ **Expected Output:** `Node with value 2`
* **Sample Input 2:** `head = [1, 2]`, `pos = 0` $\to$ **Expected Output:** `Node with value 1`
* **Sample Input 3:** `head = [1]`, `pos = -1` $\to$ **Expected Output:** `null`
* **Constraints:** The number of nodes in the list is in the range $[0, 10^4]$, $-10^5 \le Node.val \le 10^5$.

#### 3.2.2 How to Think About It
A road leading to a roundabout:
* Road from start (`head`) to roundabout entrance: length $L$.
* Around the roundabout: length $C$.
* Runner S (1 step) and Runner F (2 steps) start at the entrance.
* They run into the roundabout and meet at a collision point.
* Leave Runner S at the collision point. Put a new runner `ptr` at `head`.
* Walk both forward at the exact same speed (1 step each).
* Because the distance from `head` to entrance equals the distance from collision point to entrance, **both runners will meet right at the roundabout entrance**!

#### 3.2.3 Brute Force Approach & Bottleneck
Storing visited nodes in a `Set`:

```javascript
function detectCycleBrute(head) {
  const visited = new Set();
  let curr = head;
  while (curr !== null) {
    if (visited.has(curr)) return curr;
    visited.add(curr);
    curr = curr.next;
  }
  return null;
}
```

* **The Bottleneck:** Uses $O(n)$ extra memory. For $10^5$ nodes, holding node references in a `Set` wastes megabytes of memory.

#### 3.2.4 The Pattern Insight
Use **Floyd's 2-Phase Cycle Detection**:
* **Phase 1 (Find Meeting Point):** Move `slow` by 1 and `fast` by 2 until `slow === fast`. If `fast` hits `null`, there is no cycle.
* **Phase 2 (Find Entrance):** Put `ptr = head`. Move both `ptr` and `slow` by 1 step. The node where `ptr === slow` is the start of the cycle.

#### 3.2.5 Pseudocode

```text
FUNCTION DetectCycle(head):
  slow = head
  fast = head
  hasCycle = false

  WHILE fast != null AND fast.next != null:
    slow = slow.next
    fast = fast.next.next
    IF slow == fast:
      hasCycle = true
      BREAK

  IF NOT hasCycle RETURN null

  ptr = head
  WHILE ptr != slow:
    ptr = ptr.next
    slow = slow.next

  RETURN ptr
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(1) space Floyd's 2-phase cycle entry detection
function detectCycle(head) {
  let slow = head;
  let fast = head;
  let hasCycle = false;

  // Phase 1: Determine if cycle exists and find collision point
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) {
      hasCycle = true;
      break;
    }
  }

  if (!hasCycle) return null;

  // Phase 2: Find cycle entrance
  let ptr = head;
  while (ptr !== slow) {
    ptr = ptr.next;
    slow = slow.next;
  }

  return ptr;
}

// Test cyclic list helper
const node1 = new ListNode(3);
const node2 = new ListNode(2);
const node3 = new ListNode(0);
const node4 = new ListNode(-4);
node1.next = node2;
node2.next = node3;
node3.next = node4;
node4.next = node2; // Cycle back to node2

console.log(detectCycle(node1).val); // 2
console.log(detectCycle(createList([1, 2, 3]))); // null
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Comparing node values instead of node references
function buggyDetectCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    // BUG: If list has duplicate values (e.g. [1, 1, 1]), comparing values creates false cycles!
    if (slow.val === fast.val) return slow;
  }
  return null;
}
```
* **Why it fails:** In JavaScript, nodes must be compared by **reference identity** (`slow === fast`), not by their value (`slow.val === fast.val`). Comparing values triggers false cycle alerts when different nodes hold the same number.

#### 3.2.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. Phase 1 takes $\le 2n$ steps. Phase 2 takes $\le n$ steps. Total operations: $O(n)$.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. We only use three simple pointer variables.

---

### 3.3 Palindrome Linked List

#### 3.3.1 Problem Statement
Given the `head` of a singly linked list, return `true` if it is a palindrome or `false` otherwise. Solve it in **$O(n)$ time and $O(1)$ auxiliary space**.

* **Sample Input 1:** `head = [1, 2, 2, 1]` $\to$ **Expected Output:** `true`
* **Sample Input 2:** `head = [1, 2]` $\to$ **Expected Output:** `false`
* **Sample Input 3:** `head = [1]` $\to$ **Expected Output:** `true`
* **Constraints:** The number of nodes in the list is in the range $[1, 10^5]$, $0 \le Node.val \le 9$.

#### 3.3.2 How to Think About It
A palindrome word like `"racecar"` is checked from both sides toward the center.  
In a singly linked list, we cannot walk backward from the tail.  
1. Find the middle node using fast and slow pointers.
2. Reverse the second half of the list in-place using our 3-pointer reversal method.
3. Walk two pointers together: one starting at `head`, the other starting at the head of the reversed second half.
4. Compare values step-by-step. If all values match, the list is a palindrome!

#### 3.3.3 Brute Force Approach & Bottleneck
Copying values into an array and using two pointers:

```javascript
function isPalindromeBrute(head) {
  const vals = [];
  let curr = head;
  while (curr) { vals.push(curr.val); curr = curr.next; }
  let l = 0, r = vals.length - 1;
  while (l < r) {
    if (vals[l++] !== vals[r--]) return false;
  }
  return true;
}
```

* **The Bottleneck:** Uses $O(n)$ extra memory for the array. For $10^5$ nodes, this breaks the strict $O(1)$ memory requirement.

#### 3.3.4 The Pattern Insight
Combine the two main patterns of this lecture:
1. **Find Midpoint:** Move `slow` by 1 and `fast` by 2. When `fast.next === null || fast.next.next === null`, `slow` is at the end of the first half.
2. **Reverse Second Half:** Invert the sub-list starting from `slow.next`.
3. **Compare Halves:** Walk both halves side-by-side.

#### 3.3.5 Pseudocode

```text
FUNCTION IsPalindrome(head):
  IF head == null OR head.next == null RETURN true

  slow = head
  fast = head

  WHILE fast.next != null AND fast.next.next != null:
    slow = slow.next
    fast = fast.next.next

  secondHalf = ReverseList(slow.next)

  p1 = head
  p2 = secondHalf
  isPalin = true

  WHILE p2 != null:
    IF p1.val != p2.val:
      isPalin = false
      BREAK
    p1 = p1.next
    p2 = p2.next

  RETURN isPalin
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(1) space palindrome check combining fast/slow and reversal
function isPalindrome(head) {
  if (!head || !head.next) return true;

  // 1. Find end of first half
  let slow = head;
  let fast = head;
  while (fast.next !== null && fast.next.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }

  // 2. Reverse second half
  let secondHalf = reverse(slow.next);

  // 3. Compare first half and reversed second half
  let p1 = head;
  let p2 = secondHalf;
  let result = true;

  while (p2 !== null) {
    if (p1.val !== p2.val) {
      result = false;
      break;
    }
    p1 = p1.next;
    p2 = p2.next;
  }

  return result;
}

function reverse(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    const nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }
  return prev;
}

// Example runs
console.log(isPalindrome(createList([1, 2, 2, 1]))); // true
console.log(isPalindrome(createList([1, 2])));       // false
console.log(isPalindrome(createList([1])));          // true
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Stringifying node values
function buggyIsPalindrome(head) {
  let s = "";
  let curr = head;
  while (curr) {
    s += curr.val; // BUG: If node values have multiple digits (e.g. 10 and 1 vs 1 and 01), string concatenation creates false matches!
    curr = curr.next;
  }
  return s === s.split("").reverse().join("");
}
```
* **Why it fails:** Turning numbers into strings fails when values have multiple digits (e.g. `[1, 10]` vs `[11, 0]`). It also creates extra garbage collection memory overhead.

#### 3.3.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. Finding the midpoint takes $n / 2$ steps. Reversing the second half takes $n / 2$ steps. Comparing halves takes $n / 2$ steps. Total: $\frac{3n}{2} \implies O(n)$.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. We rewire pointers directly in place.

---

## 4. Tricky Edge Cases

* **Order of Changing Pointers:** When inverting pointers, always save `const nextTemp = curr.next` before running `curr.next = prev`.
* **Checking Fast Pointers for Null:** Always check `while (fast !== null && fast.next !== null)`. Accessing `fast.next.next` on an odd-length list without checking `fast.next` causes a null pointer crash.
* **Comparing Reference vs Value:** In cycle detection, always test `slow === fast` (exact object), never `slow.val === fast.val`.
* **Single Node or Empty Lists:** Reversals and cycle checks on `[]` or `[1]` must exit safely right away.

---

## 5. Summary Cheat Sheet

* **Iterative Reversal:** `nextTemp = curr.next; curr.next = prev; prev = curr; curr = nextTemp;`. Runs in $O(n)$ time and $O(1)$ space.
* **Floyd's Tortoise and Hare:** Move `slow` by 1 and `fast` by 2. The 1-step relative difference guarantees they meet inside any cycle.
* **Cycle Start Formula:** Distance from `head` to loop start equals distance from collision to loop start. Put one pointer at `head` and walk both at 1x speed to find the entrance.
* **Palindrome Pattern:** Fast/slow to find midpoint $\to$ 3-pointer reversal of second half $\to$ compare halves in $O(n)$ time and $O(1)$ space.

---

## 6. Practice Problems

### 6.1 Linked List Cycle

Given `head`, the head of a linked list, determine if the linked list has a cycle in it. Return `true` if there is a cycle, and `false` otherwise.

* **Difficulty:** Easy | **Focus:** Floyd's Collision Detection
* **Sample Input 1:** `head = [3, 2, 0, -4]`, `pos = 1` $\to$ **Expected Output:** `true`
* **Sample Input 2:** `head = [1]`, `pos = -1` $\to$ **Expected Output:** `false`
* **Constraints:** Number of nodes is in range $[0, 10^4]$, $-10^5 \le Node.val \le 10^5$.
* **Hint 1:** Set `slow = head` and `fast = head`.
* **Hint 2:** In each step, move `slow = slow.next` and `fast = fast.next.next`. If `slow === fast`, return `true`.

---

### 6.2 Reverse Linked List II

Given the `head` of a singly linked list and two integers `left` and `right` where `left <= right`, reverse the nodes of the list from position `left` to position `right`, and return the reversed list.

* **Difficulty:** Medium | **Focus:** Sublist In-Place Inversion
* **Sample Input 1:** `head = [1, 2, 3, 4, 5]`, `left = 2`, `right = 4` $\to$ **Expected Output:** `[1, 4, 3, 2, 5]`
* **Sample Input 2:** `head = [5]`, `left = 1`, `right = 1` $\to$ **Expected Output:** `[5]`
* **Constraints:** Number of nodes is in range $[1, 500]$, $1 \le left \le right \le n$.
* **Hint 1:** Use a dummy node `dummy = new ListNode(0, head)` to handle the case where `left === 1`.
* **Hint 2:** Move a pointer `pre` to the node right before position `left`. Let `start = pre.next`.
* **Hint 3:** For `right - left` times, take `then = start.next` and move it directly after `pre`.

---

### 6.3 Reorder List

You are given the head of a singly linked list: $L_0 \to L_1 \to \dots \to L_{n-1} \to L_n$. Reorder the list to be: $L_0 \to L_n \to L_1 \to L_{n-1} \to L_2 \to L_{n-2} \to \dots$. You must do this in-place without altering node values.

* **Difficulty:** Medium | **Focus:** Midpoint Split, Reversal & Weave
* **Sample Input 1:** `head = [1, 2, 3, 4]` $\to$ **Expected Output:** `[1, 4, 2, 3]`
* **Sample Input 2:** `head = [1, 2, 3, 4, 5]` $\to$ **Expected Output:** `[1, 5, 2, 4, 3]`
* **Constraints:** Number of nodes is in range $[1, 5 \times 10^4]$.
* **Hint 1:** Step 1: Use fast and slow pointers to find the middle of the list.
* **Hint 2:** Step 2: Reverse the second half of the list starting from `slow.next`. Disconnect `slow.next = null`.
* **Hint 3:** Step 3: Weave the two halves together by alternating nodes from the first half and the reversed second half.

---

<nav aria-label="Lecture navigation">

[Previous: Singly & Doubly Linked Lists](day-11-singly-and-doubly-linked-lists.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Stacks & Expression Parsing](day-13-stacks-and-expression-parsing.md)

</nav>
