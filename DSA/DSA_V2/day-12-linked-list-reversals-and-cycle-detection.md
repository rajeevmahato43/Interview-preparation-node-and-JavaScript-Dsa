# Day 12: Linked List Reversals & Cycle Detection

<nav aria-label="Lecture navigation">

[Previous: Singly & Doubly Linked Lists](day-11-singly-and-doubly-linked-lists.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Stacks & Expression Parsing](day-13-stacks-and-expression-parsing.md)

</nav>

---

## 1. Linked List Reversals

In a singly linked list, each node points only forward. **Reversal** is the process of inverting every `next` pointer so that the original tail becomes the new head, and the original head points to `null`.

To picture this physically, imagine people in a conga line holding the shoulders of the person in front of them:
1. Person 1 holds Person 2's shoulders, Person 2 holds Person 3's shoulders.
2. To reverse the line without anyone moving from their floor spots:
   * Person 1 lets go and places their hands at their sides (points to `null`).
   * Person 2 turns around and holds Person 1's shoulders.
   * Person 3 turns around and holds Person 2's shoulders.
3. The person formerly at the back is now the leader (**New Head**)!

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

To reverse a list in-place without losing references, maintain three pointers sliding forward together:
* `prev`: Tracks the node behind us (initially `null`).
* `curr`: Tracks the node currently being inverted (initially `head`).
* `nextTemp`: Temporarily holds `curr.next` so the rest of the list is not lost when `curr.next` is severed.

```text
Step 1: Save next:    nextTemp = curr.next
Step 2: Invert link:  curr.next = prev
Step 3: Advance prev: prev = curr
Step 4: Advance curr: curr = nextTemp
```

---

### 1.2 Iterative Invariant vs Recursion Stack Hazards

In production Node.js backends, linked list reversals must **always be iterative**:
* V8 allocates a fixed call-stack memory budget (typically ~10,000 frames).
* A recursive reversal creates a new stack frame per node. A list with 15,000 nodes crashes immediately with `RangeError: Maximum call stack size exceeded`.
* The iterative 3-pointer method operates in strictly **$O(1)$ stack space**.

> [!NOTE]
> **Self-Check:** What happens if you execute `curr.next = prev` before saving `const nextTemp = curr.next`?  
> *Answer:* You immediately sever the only reference to the rest of the list. The remaining nodes become unreachable and are lost forever in memory.

---

## 2. Cycle Detection Mechanics

A **Cycle** occurs when a node's `next` pointer points back to a previously visited node instead of terminating at `null`, causing any naive traversal loop to run indefinitely.

To picture this physically, imagine two runners on a circular stadium track:
* **Runner S (Slow):** Runs at 1 meter per second.
* **Runner F (Fast):** Runs at 2 meters per second.
* If the track is straight and ends at a wall (`null`), Runner F reaches the end first.
* If the track loops into a circle, Runner F enters the loop and laps Runner S from behind. The relative velocity difference is $2 - 1 = 1$ meter per second. The gap shrinks by 1 meter on every step, guaranteeing collision without skipping!

```text
CYCLE DETECTION (Floyd's Tortoise & Hare):
[ Head ] ──► [ Node A ] ──► [ Entry Node ] ──► [ Node B ]
                                  ▲                   │
                                  │                   ▼
                              [ Node D ] ◄──────── [ Node C ]
```

---

### 2.1 Cycle Entry Point Mathematical Derivation

When `slow` ($1\times$) and `fast` ($2\times$) collide in a cycle:
* Let $L$ = Distance from `head` to cycle entry.
* Let $x$ = Distance from cycle entry to collision point.
* Let $C$ = Total cycle circumference.

$$\text{Distance by Slow} = L + x$$
$$\text{Distance by Fast} = L + x + k \cdot C \quad (k \ge 1)$$

Because `fast` runs at twice the speed of `slow`:
$$2(L + x) = L + x + k \cdot C \implies L + x = k \cdot C \implies L = (k - 1)C + (C - x)$$

**The Core Insight:** $(C - x)$ is the remaining distance from the collision point back to the cycle entry!
Therefore, the distance from `head` to the entry node ($L$) is mathematically equal to the distance from the collision point to the entry node.
* **Algorithm:** Once collision occurs, reset one pointer to `head` and walk both at 1 step per tick. They will meet at the **Cycle Entry Node**.

---

### 2.2 Pattern Family
* **3-Pointer Inversion:** Sliding `prev`, `curr`, and `nextTemp` to reverse link direction in $O(1)$ space.
* **Floyd's Tortoise & Hare:** 1x vs 2x velocities to detect loops and find midpoints in $O(1)$ space.
* **Phase 2 Entry Discovery:** Resetting one pointer to `head` post-collision to find the cycle start node.
* **Midpoint Split & Merge:** Fast/slow to split list at midpoint, reversing the second half for palindrome and reorder checks.

### 2.3 Pattern Recognition Table

| Problem Keyword | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| **"Reverse linked list"** | Invert direction of links. | 3-pointer iterative (`prev`, `curr`, `nextTemp`). |
| **"Detect cycle / circular dependency"** | Determine if loop exists in $O(1)$ space. | Floyd's Tortoise & Hare (`slow`, `fast`). |
| **"Find beginning of cycle"** | Locate cycle entry node in $O(1)$ space. | Floyd's Phase 1 (collision) + Phase 2 (walk from head). |
| **"Palindrome linked list"** | Verify symmetrical sequence. | Midpoint split $\to$ reverse second half $\to$ compare. |

### 2.4 When to Use vs When NOT to Use
* **When to Use**:
  * You need to reverse full lists or sub-ranges in strictly $O(1)$ auxiliary space.
  * Detecting circular loops or finding list midpoints without knowing total length $n$.
  * Symmetrical list comparisons without allocating array buffers.
* **When NOT to Use**:
  * The list contains backward pointers (Doubly Linked List; simply swap `next` and `prev` on each node).
  * The data structure is an indexed array (use Opposing Two Pointers).

### 2.5 The 10^7 Operations Rule
* Iterating through $n = 100,000$ nodes with Floyd's algorithm takes at most $2n = 200,000$ steps, finishing in **under 2 milliseconds** in Node.js.
* Storing nodes in a `Set` to check cycles takes $O(n)$ heap space ($\approx 8\text{MB}$ memory). Floyd's algorithm uses **$O(1)$ space** (zero heap allocations).

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
* Your left hand points to Card `1` (`curr`).
* Before rewiring Card `1`, put your right hand on Card `2` (`nextTemp = curr.next`) so the rest of the list isn't lost.
* Now safely rewire Card `1`'s arrow backward to `prev`.
* Slide `prev` to Card `1`. Slide `curr` to Card `2` (where your right hand was waiting).
* Repeat until your left hand falls off the desk (`curr === null`).
* The card under `prev` is Card `5` — your new head!

#### 3.1.3 Brute Force Approach & Bottleneck
Extracting all node values into an array, reversing the array, and overwriting node values:

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

* **The Bottleneck:** Allocates an $O(n)$ auxiliary array buffer. Fails completely if node objects themselves must be preserved and reoriented.

#### 3.1.4 The Pattern Insight
Use a **3-Pointer Iterative Slide** (`prev`, `curr`, `nextTemp`):
* `nextTemp = curr.next`
* `curr.next = prev`
* `prev = curr`
* `curr = nextTemp`
* Every node link is inverted in a single pass in $O(1)$ memory.

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
* **Why it fails:** Recursion consumes $O(n)$ stack frames. In single-threaded Node.js, large linked lists crash the engine with maximum call stack exhaustion.

#### 3.1.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The loop visits each node exactly once.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. Only three reference pointer variables are stored.

---

### 3.2 Linked List Cycle II

#### 3.2.1 Problem Statement
Given the `head` of a linked list, return the **node where the cycle begins**. If there is no cycle, return `null`.
Do not modify the linked list. Solve it using **$O(1)$ auxiliary space**.

* **Sample Input 1:** `head = [3, 2, 0, -4]`, `pos = 1` (tail connects to node index 1) $\to$ **Expected Output:** `Node with value 2`
* **Sample Input 2:** `head = [1, 2]`, `pos = 0` $\to$ **Expected Output:** `Node with value 1`
* **Sample Input 3:** `head = [1]`, `pos = -1` (no cycle) $\to$ **Expected Output:** `null`
* **Constraints:** The number of nodes in the list is in the range $[0, 10^4]$, $-10^5 \le Node.val \le 10^5$.

#### 3.2.2 How to Think About It
An access road leading to a circular roundabout:
* Road from gate (`head`) to entrance (`entry`): length $L$.
* Roundabout circumference: $C$.
* Runner S ($1\times$) and Runner F ($2\times$) start at the gate.
* They enter the roundabout and collide at a milestone.
* Leave Runner S at the collision milestone. Send a new walker from the gate (`head`).
* Move both forward at the same speed ($1\times$).
* Because the distance from `head` to `entry` equals the distance from collision point to `entry`, **both walkers meet at the roundabout entrance**!

#### 3.2.3 Brute Force Approach & Bottleneck
Recording visited nodes in a `Set`:

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

* **The Bottleneck:** Allocates $O(n)$ heap memory. For $10^5$ nodes, storing object references in a `Set` wastes megabytes of heap and triggers GC pauses.

#### 3.2.4 The Pattern Insight
Use **Floyd's 2-Phase Cycle Detection**:
* **Phase 1 (Collision):** Move `slow` by 1 and `fast` by 2 until `slow === fast`. If `fast` hits `null`, no cycle exists.
* **Phase 2 (Entry Find):** Set `ptr = head`. Advance both `ptr` and `slow` by 1 step. The node where `ptr === slow` is the exact cycle entry node.

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
* **Why it fails:** In JavaScript, linked list nodes must be compared by **object identity** (`slow === fast`), not by their value (`slow.val === fast.val`). Comparing values causes false positive cycle detection when different nodes hold identical numbers.

#### 3.2.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. Phase 1 runs in $\le 2n$ steps. Phase 2 runs in $\le n$ steps. Total operations: $O(n)$.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. Uses three reference pointer variables.

---

### 3.3 Palindrome Linked List

#### 3.3.1 Problem Statement
Given the `head` of a singly linked list, return `true` if it is a palindrome or `false` otherwise. Solve it in **$O(n)$ time and $O(1)$ auxiliary space**.

* **Sample Input 1:** `head = [1, 2, 2, 1]` $\to$ **Expected Output:** `true`
* **Sample Input 2:** `head = [1, 2]` $\to$ **Expected Output:** `false`
* **Sample Input 3:** `head = [1]` $\to$ **Expected Output:** `true`
* **Constraints:** The number of nodes in the list is in the range $[1, 10^5]$, $0 \le Node.val \le 9$.

#### 3.3.2 How to Think About It
A string palindrome like `"racecar"` is checked from both ends moving inward.
In a singly linked list, we cannot walk backward from the tail.
1. Find the middle node of the list using a Tortoise and Hare runner.
2. Invert the second half of the list in-place using the 3-pointer reversal engine.
3. Walk two pointers: one starting at `head`, the other starting at the head of the reversed second half.
4. Compare node values step-by-step. If all match, it is a palindrome!

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

* **The Bottleneck:** Allocates $O(n)$ heap space for the array. For $10^5$ nodes, this violates the strict $O(1)$ auxiliary memory constraint.

#### 3.3.4 The Pattern Insight
Combine the two core techniques of this lecture:
1. **Find Midpoint:** Advance `slow` by 1 and `fast` by 2. When `fast.next === null || fast.next.next === null`, `slow` is at the first half's end.
2. **Reverse Second Half:** Invert the sublist starting from `slow.next`.
3. **Compare Halves:** Traverse both halves simultaneously.

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
* **Why it fails:** String concatenation fails when values are larger than 9 (e.g. `[1, 10]` becomes `"110"`, reversed `"011"`, incorrectly treated as mismatch; or `[10, 1]` vs `[1, 01]`). Also creates $O(n)$ heap string churn.

#### 3.3.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. Finding the midpoint takes $n / 2$ steps. Reversing the second half takes $n / 2$ steps. Comparing halves takes $n / 2$ steps. Total operations: $\frac{3n}{2} \implies O(n)$.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. Pointer manipulation is performed entirely in-place.

---

## 4. Tricky Edge Cases

* **Order of Pointer Severing:** When inverting pointers, always save `const nextTemp = curr.next` before executing `curr.next = prev`.
* **Fast Pointer Null Guard:** Always check `while (fast !== null && fast.next !== null)`. Checking `fast.next.next` on an odd-length acyclic list will crash with a null property exception.
* **Comparing Node Identity vs Value:** In cycle detection, always test `slow === fast` (identity), never `slow.val === fast.val`.
* **Single Node or Empty Lists:** Reversal and cycle checks on `[]` or `[1]` must exit cleanly without executing loop bodies.

---

## 5. Summary Cheat Sheet

* **Iterative Reversal:** `nextTemp = curr.next; curr.next = prev; prev = curr; curr = nextTemp;`. Runs in $O(n)$ time and $O(1)$ space.
* **Floyd's Tortoise and Hare:** Advance `slow` by 1 and `fast` by 2. Relative speed of 1 node/tick guarantees collision inside any cycle.
* **Cycle Entrance Formula:** Distance from `head` to entry equals distance from collision to entry. Reset one pointer to `head` and walk both at 1x speed to find entrance.
* **Palindrome Pattern:** Fast/slow to find midpoint $\to$ 3-pointer reversal of second half $\to$ compare halves in $O(n)$ time and $O(1)$ space.

---

## 6. Practice Problems

### 6.1 Linked List Cycle

Given `head`, the head of a linked list, determine if the linked list has a cycle in it. Return `true` if there is a cycle, and `false` otherwise.

* **Difficulty:** Easy | **Focus:** Floyd's Collision Detection
* **Sample Input 1:** `head = [3, 2, 0, -4]`, `pos = 1` $\to$ **Expected Output:** `true`
* **Sample Input 2:** `head = [1]`, `pos = -1` $\to$ **Expected Output:** `false`
* **Constraints:** Number of nodes is in range $[0, 10^4]$, $-10^5 \le Node.val \le 10^5$.
* **Hint 1:** Initialize `slow = head` and `fast = head`.
* **Hint 2:** In each step, move `slow = slow.next` and `fast = fast.next.next`. If `slow === fast`, return `true`.

---

### 6.2 Reverse Linked List II

Given the `head` of a singly linked list and two integers `left` and `right` where `left <= right`, reverse the nodes of the list from position `left` to position `right`, and return the reversed list.

* **Difficulty:** Medium | **Focus:** Sublist In-Place Inversion
* **Sample Input 1:** `head = [1, 2, 3, 4, 5]`, `left = 2`, `right = 4` $\to$ **Expected Output:** `[1, 4, 3, 2, 5]`
* **Sample Input 2:** `head = [5]`, `left = 1`, `right = 1` $\to$ **Expected Output:** `[5]`
* **Constraints:** Number of nodes is in range $[1, 500]$, $1 \le left \le right \le n$.
* **Hint 1:** Use a dummy node `dummy = new ListNode(0, head)` to handle `left === 1`.
* **Hint 2:** Advance `pre` to the node before position `left`. Let `start = pre.next`.
* **Hint 3:** For `right - left` times, pluck `then = start.next` and move it directly after `pre`.

---

### 6.3 Reorder List

You are given the head of a singly linked-list: $L_0 \to L_1 \to \dots \to L_{n-1} \to L_n$. Reorder the list to be: $L_0 \to L_n \to L_1 \to L_{n-1} \to L_2 \to L_{n-2} \to \dots$. You must do this in-place without altering node values.

* **Difficulty:** Medium | **Focus:** Midpoint Split, Reversal & Weave
* **Sample Input 1:** `head = [1, 2, 3, 4]` $\to$ **Expected Output:** `[1, 4, 2, 3]`
* **Sample Input 2:** `head = [1, 2, 3, 4, 5]` $\to$ **Expected Output:** `[1, 5, 2, 4, 3]`
* **Constraints:** Number of nodes is in range $[1, 5 \times 10^4]$.
* **Hint 1:** Step 1: Use fast and slow pointers to find the middle of the list.
* **Hint 2:** Step 2: Reverse the second half of the list starting from `slow.next`. Disconnect `slow.next = null`.
* **Hint 3:** Step 3: Weave the two halves together by alternating nodes from the first and reversed second half.

---

<nav aria-label="Lecture navigation">

[Previous: Singly & Doubly Linked Lists](day-11-singly-and-doubly-linked-lists.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Stacks & Expression Parsing](day-13-stacks-and-expression-parsing.md)

</nav>
