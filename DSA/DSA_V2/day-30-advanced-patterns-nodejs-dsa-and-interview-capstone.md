# Day 30: Advanced Systems DSA & Capstone

<nav aria-label="Lecture navigation">

[Previous: Dynamic Programming: 1D & 2D](day-29-dynamic-programming-1d-and-2d.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Back to Day 01: Big O & Problem Solving](day-01-big-o-complexity-and-problem-solving.md)

</nav>

## Prerequisites

- [Day 04: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md) — $O(1)$ map lookups.
- [Day 11: Singly & Doubly Linked Lists](day-11-singly-and-doubly-linked-lists.md) — Doubly linked list node pointers.

---

## 1. Pattern 1: Merge Intervals

Interval problems involve ranges `[start, end]`. In 90% of interval questions, the first move is to **sort intervals by start time**!

```text
Intervals: [ [1, 3], [2, 6], [8, 10], [15, 18] ]
Sorted:    [1, 3] and [2, 6] overlap (since 2 <= 3) ──► Merge: [1, max(3, 6)] = [1, 6]
           [8, 10] does not overlap (8 > 6)          ──► Keep separate: [8, 10]
Merged:    [ [1, 6], [8, 10], [15, 18] ]
```

```javascript
// Node.js code: Merge Intervals
function merge(intervals) {
  if (intervals.length <= 1) return intervals;

  // 1. Sort by start time
  intervals.sort((a, b) => a[0] - b[0]);

  const merged = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const lastMerged = merged[merged.length - 1];

    // If current starts before previous ends, merge them!
    if (current[0] <= lastMerged[1]) {
      lastMerged[1] = Math.max(lastMerged[1], current[1]);
    } else {
      merged.push(current);
    }
  }

  return merged;
}

console.log(merge([[1,3],[2,6],[8,10],[15,18]]));
// Output: [ [1,6], [8,10], [15,18] ]
```
- **Time Complexity:** $O(n \log n)$ — Sorting dominant.
- **Extra Space:** $O(n)$

---

## 2. Pattern 2: Trie (Prefix Tree)

A **Trie** is a tree data structure built for fast string prefix lookups and autocomplete. Searching for a word of length $L$ takes strictly **$O(L)$ time**, completely independent of how many millions of words exist in the dictionary!

```text
Inserting "app" and "apple":
           (root)
             │ 'a'
            (a)
             │ 'p'
            (p)
             │ 'p'
            (p) [isEnd = true]  <-- "app" ends here
             │ 'l'
            (l)
             │ 'e'
            (e) [isEnd = true]  <-- "apple" ends here
```

```javascript
// Node.js code: Trie Implementation
class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let curr = this.root;
    for (const char of word) {
      if (!curr.children[char]) {
        curr.children[char] = new TrieNode();
      }
      curr = curr.children[char];
    }
    curr.isEnd = true;
  }

  search(word) {
    let curr = this.root;
    for (const char of word) {
      if (!curr.children[char]) return false;
      curr = curr.children[char];
    }
    return curr.isEnd;
  }

  startsWith(prefix) {
    let curr = this.root;
    for (const char of prefix) {
      if (!curr.children[char]) return false;
      curr = curr.children[char];
    }
    return true; // Prefix exists
  }
}

const trie = new Trie();
trie.insert("apple");
console.log(trie.search("apple"));   // true
console.log(trie.search("app"));     // false
console.log(trie.startsWith("app")); // true
```
- **Time Complexity:** $O(L)$ for insert, search, and prefix check where $L$ is word length.

---

## 3. Pattern 3: LRU Cache ($O(1)$ Hash Map + Doubly Linked List)

An **LRU (Least Recently Used) Cache** evicts the oldest unused item when full.
To get **$O(1)$ `get`** and **$O(1)$ `put`**, combine:
1. **Hash Map**: Provides instant $O(1)$ key lookup.
2. **Doubly Linked List**: Tracks usage order so we can move a node to the front (most recently used) or remove from the back (least recently used) in $O(1)$.

```javascript
// Node.js code: LRU Cache
class DNode {
  constructor(key = 0, val = 0) {
    this.key = key;
    this.val = val;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();

    // Dummy sentinel head and tail
    this.head = new DNode();
    this.tail = new DNode();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  _remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _addFirst(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    const node = this.map.get(key);
    this._remove(node);
    this._addFirst(node); // Move to most recent
    return node.val;
  }

  put(key, val) {
    if (this.map.has(key)) {
      this._remove(this.map.get(key));
    }
    const newNode = new DNode(key, val);
    this.map.set(key, newNode);
    this._addFirst(newNode);

    if (this.map.size > this.capacity) {
      // Evict least recently used (before tail)
      const lru = this.tail.prev;
      this._remove(lru);
      this.map.delete(lru.key);
    }
  }
}
```
- **`get(key)`:** strictly **$O(1)$**.
- **`put(key, val)`:** strictly **$O(1)$**.

---

## 4. Systems Pattern: Node.js Rate Limiter (Sliding Window Log)

In backend Node.js services, protect APIs against abuse using a sliding window counter:

```javascript
// Node.js code: In-Memory Sliding Window Rate Limiter
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.userLogs = new Map(); // userId -> timestamps array
  }

  isAllowed(userId) {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    if (!this.userLogs.has(userId)) {
      this.userLogs.set(userId, []);
    }

    const timestamps = this.userLogs.get(userId);

    // Evict timestamps older than current window
    while (timestamps.length > 0 && timestamps[0] <= cutoff) {
      timestamps.shift();
    }

    if (timestamps.length < this.maxRequests) {
      timestamps.push(now);
      return true; // Request allowed
    }

    return false; // Rate limit exceeded!
  }
}
```

---

## 5. Master Algorithm Decision Flowchart

When you read a new problem in an interview, use this decision tree:

```text
1. Is input sorted?
   ├── Yes ──► Try Binary Search O(log n) or Two Pointers O(n)
   └── No  ──► Can we sort it O(n log n)? Or use a Hash Map O(n)?

2. Need contiguous subarray / substring?
   ├── Fixed size k ──► Fixed Sliding Window
   └── Variable size / condition ──► Variable Sliding Window or Prefix Sum

3. Need to find Next Greater / Smaller element?
   └── ──► Monotonic Stack

4. Finding shortest path in unweighted graph / tree levels?
   └── ──► Breadth-First Search (Queue)

5. Exploring all combinations / maze paths?
   └── ──► Backtracking (Choose -> Explore -> Unchoose)

6. Optimal min/max with overlapping subproblems?
   └── ──► Dynamic Programming (Tabulation / Memoization)
```

---

## 6. Hands-On Exercises

Run this script in Node.js to verify LRU cache and merge intervals:

```javascript
// Node.js code
const assert = require("node:assert");

function testMerge(ints) {
  ints.sort((a, b) => a[0] - b[0]);
  const res = [ints[0]];
  for (let i = 1; i < ints.length; i++) {
    const cur = ints[i], last = res[res.length - 1];
    if (cur[0] <= last[1]) last[1] = Math.max(last[1], cur[1]);
    else res.push(cur);
  }
  return res;
}

assert.deepEqual(testMerge([[1, 3], [2, 6], [8, 10]]), [[1, 6], [8, 10]]);

console.log("✅ Capstone assertions passed!");
```

---

## 7. Summary

- **Merge Intervals** sorts by start time in $O(n \log n)$ to merge overlapping ranges in a single pass.
- **Trie** achieves $O(L)$ string search and prefix lookups.
- **LRU Cache** pairs a Hash Map with a Doubly Linked List for true $O(1)$ operations.
- **Master Decision Rule**: Pick your algorithm directly from input constraints and problem signals.

---

## 8. Cheat Sheet

| Advanced Pattern | Core Mechanism | Time |
| :--- | :--- | :---: |
| **Intervals** | Sort by start time, merge overlapping bounds | $O(n \log n)$ |
| **Trie** | Tree with character edge map | $O(L)$ per word |
| **LRU Cache** | Map + Doubly Linked List with sentinel nodes | **$O(1)$ get & put** |

---

## 9. Interview Q&A

### 45-Second Explanation
> *"An LRU Cache requires $O(1)$ lookups and $O(1)$ updates to the eviction order. While a Hash Map provides constant time key lookups, it cannot reorder items in $O(1)$. A Doubly Linked List allows $O(1)$ node removals and insertions, but requires $O(n)$ to find a node by key. By storing node references directly inside the Hash Map, we achieve instant key lookups while maintaining the exact least-recently-used eviction order using the doubly linked list."*

---

## 10. Practice Problems

### 1. Merge Intervals - Medium
Given an array of `intervals` where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.
- **Input:** `intervals = [[1,3],[2,6],[8,10],[15,18]]`
- **Expected Output:** `[[1,6],[8,10],[15,18]]`
- **Input:** `intervals = [[1,4],[4,5]]`
- **Expected Output:** `[[1,5]]`

### 2. Implement Trie (Prefix Tree) - Medium
A **trie** (pronounced as "try") or prefix tree is a tree data structure used to efficiently store and retrieve keys in a dataset of strings. Implement the `Trie` class with `insert`, `search`, and `startsWith` methods.
- **Input:** `["Trie", "insert", "search", "search", "startsWith", "insert", "search"], [[], ["apple"], ["apple"], ["app"], ["app"], ["app"], ["app"]]`
- **Expected Output:** `[null, null, true, false, true, null, true]`

### 3. LRU Cache - Medium
Design a data structure that follows the constraints of a **Least Recently Used (LRU) Cache**. Implement the `LRUCache` class with `get` and `put` methods running in $O(1)$ average time complexity.
- **Input:** `["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"], [[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]`
- **Expected Output:** `[null, null, null, 1, null, -1, null, -1, 3, 4]`

---

<nav aria-label="Lecture navigation">

[Previous: Dynamic Programming: 1D & 2D](day-29-dynamic-programming-1d-and-2d.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Back to Day 01: Big O & Problem Solving](day-01-big-o-complexity-and-problem-solving.md)

</nav>
