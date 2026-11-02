# Day 30: Advanced Systems DSA & Capstone

<nav aria-label="Lecture navigation">

[Previous: Dynamic Programming: 1D & 2D](day-29-dynamic-programming-1d-and-2d.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Back to Day 01: Big O & Problem Solving](day-01-big-o-complexity-and-problem-solving.md)

</nav>

---

## 1. Systems Data Structures Fundamentals

In real backend systems, we often connect two or more data structures together to make our code super fast. These combined structures power web frameworks, routers, and caching layers:

- **LRU Cache (Least Recently Used):** A cache with a set size limit. When full, it throws out the item that has not been used in the longest time, in fast $O(1)$ time.
- **Trie (Prefix Tree):** A tree made of letters. It lets you search prefixes, run autocomplete, and match URL routes in $O(L)$ time (where $L$ is word length), no matter how many millions of words exist in your database.
- **Interval Sweep-Line:** Handling time ranges `[start, end]`. We sort ranges by their start time to spot overlapping calendar meetings or scheduled jobs.

Imagine an office desk with room for only 3 open books (Capacity = 3):
- Whenever you open and read a book, you place it right in front of you (**Most Recently Used**).
- When you want to open a 4th book, your desk has no room. You do not throw away a random book; you take the book that has been sitting untouched at the far corner of your desk the longest (**Least Recently Used**) and put it back on the shelf.
- Both finding a book and moving it to the front must run in fast $O(1)$ time!

Now imagine dialing a phone number:
When someone dials `+1` (USA) $\to$ `415` (San Francisco) $\to$ `555` $\to$ `0199`, the phone system does not search through a flat list of 8 billion people. It walks down a letter tree: `Root -> '1' -> '4' -> '1' -> '5'`. Each number narrows the search down immediately in $O(1)$ time per digit.

```javascript
// Baseline demonstration of LRU Cache using Map + Doubly Linked List
class DListNode {
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
    this.head = new DListNode();
    this.tail = new DListNode();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    const node = this.map.get(key);
    this._moveToHead(node);
    return node.val;
  }

  put(key, value) {
    if (this.map.has(key)) {
      const node = this.map.get(key);
      node.val = value;
      this._moveToHead(node);
    } else {
      const newNode = new DListNode(key, value);
      this.map.set(key, newNode);
      this._addNode(newNode);
      if (this.map.size > this.capacity) {
        const lru = this._popTail();
        this.map.delete(lru.key);
      }
    }
  }

  _addNode(node) {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next.prev = node;
    this.head.next = node;
  }

  _removeNode(node) {
    const prev = node.prev;
    const next = node.next;
    prev.next = next;
    next.prev = prev;
  }

  _moveToHead(node) {
    this._removeNode(node);
    this._addNode(node);
  }

  _popTail() {
    const lru = this.tail.prev;
    this._removeNode(lru);
    return lru;
  }
}

const cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
console.log("get(1):", cache.get(1)); // Output: 1 (promotes 1, 2 is now LRU)
cache.put(3, 3);                      // Evicts 2
console.log("get(2):", cache.get(2)); // Output: -1
```

### 1.1 Doubly Linked List with Sentinel Dummy Nodes

Writing a doubly linked list without sentinel dummy nodes requires null-checking `head` and `tail` on every insertion and deletion. Using `dummyHead` and `dummyTail` guarantees that the target node always has valid non-null `prev` and `next` pointers:

```text
Sentinel Architecture:
[ dummyHead ] <===> [ Node A ] <===> [ Node B ] <===> [ dummyTail ]
      ^                                                     ^
Most Recently Used                                   Least Recently Used
(Inserted here)                                      (Evicted from here)
```

> [!NOTE]
> Self-Check: Why MUST the node in an LRU cache store both `key` and `value`?
> Answer: When evicting `dummyTail.prev`, we must delete that item from `this.map`. If the linked list node only stored `value`, we would have no way to look up its corresponding key in the Map in $O(1)$ time.

### 1.2 The Trie (Prefix Tree) Node Architecture

In a Trie, every node contains:
1. `children`: A Map (or fixed array of size 26) pointing to child Trie nodes.
2. `isEndOfWord`: A boolean flag indicating whether a complete word terminates at this node.

```text
Trie for "app" and "apple":
                 (Root: "")
                     | 'a'
                    (a)
                     | 'p'
                    (p)
                     | 'p'
                   [ p ]  <-- isEndOfWord = true ("app")
                     | 'l'
                    (l)
                     | 'e'
                   [ e ]  <-- isEndOfWord = true ("apple")
```

### 1.3 Operations Reference Table

| Data Structure / Pattern | Core Components | Lookup Complexity | Insertion Complexity | Eviction Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **LRU Cache** | Map + Doubly Linked List | $O(1)$ | $O(1)$ | $O(1)$ |
| **Trie (Prefix Tree)** | Tree of Character Maps | $O(L)$ (word length) | $O(L)$ | $O(L)$ |
| **Interval Sweep** | Array + Sort by Start | $O(N \log N)$ sort | $O(N)$ scan | N/A |
| **LFU Cache** | Two Maps + DLL Buckets | $O(1)$ | $O(1)$ | $O(1)$ |

---

## 2. Systems Data Structure Patterns

### 2.1 Pattern Family

Systems data structures solve high-throughput infrastructure challenges:

- **Key-Value Cache with Eviction Policies:** Combining hash tables for constant-time lookups with ordered lists (DLL) for chronological tracking (LRU) or frequency buckets (LFU).
- **Prefix Path Indexing (Trie):** Indexing strings character-by-character for fast search, routing, and dictionary validation.
- **Interval Collision Resolution:** Ordering 1D continuous ranges by start coordinates to identify and merge overlapping time spans.

### 2.2 Pattern Recognition Table

| Problem Keyword Signal | Underlying Systems Need | Recommended Approach |
| :--- | :--- | :--- |
| "Design cache with $O(1)$ get, put, and capacity eviction" | Track access recency with constant time updates | Map + Doubly Linked List (LRU) |
| "Autocomplete / prefix lookup / word search" | Character-by-character shared prefix walk | Trie (Prefix Tree) |
| "Merge overlapping intervals / meeting conflicts" | 1D range collisions | Sort by start coordinate + linear scan |
| "HTTP router URL path matching" | Compressed prefix string matching | Radix Tree (Compressed Trie) |
| "Evict item with lowest access frequency" | Count frequency with LRU tie-breaking | LFU Cache (Two Maps + DLL Buckets) |

### 2.3 When to Use vs When NOT to Use

- **Use an LRU Cache when:**
  - You need an in-memory cache bounded by memory capacity to protect the V8 heap from out-of-memory crashes.
  - Recency of access is the best predictor of future queries.
- **Use a Trie when:**
  - You have a large dictionary of strings and must execute prefix queries (`startsWith`) frequently.
  - Shared prefixes allow compressing memory across millions of words.
- **When NOT to use a Trie:**
  - You only need exact string equality matches. A standard JavaScript `Set` or `Map` is faster and uses less memory.

### 2.4 The 10^7 Operations Rule

In an LRU cache, both `get()` and `put()` run in strict $O(1)$ time. An LRU cache can easily process 10,000,000 queries in under a second in Node.js. If an LRU cache were naively built using array scans ($O(N)$ search), processing 10,000,000 queries on a cache of size 1,000 would take $10^{10}$ operations, locking the Node.js event loop for tens of seconds.

---

## 3. Problem Walkthroughs

### 3.1 LRU Cache

#### 3.1.1 Problem Statement
Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.
Implement the `LRUCache` class:
- `LRUCache(int capacity)`: Initialize the LRU cache with positive size `capacity`.
- `int get(int key)`: Return the value of `key` if it exists, otherwise return `-1`. Accessing the key marks it as most recently used.
- `void put(int key, int value)`: Update the value if `key` exists. Otherwise, add the key-value pair. If keys exceed `capacity`, evict the least recently used key.
Both `get` and `put` must run in $O(1)$ average time complexity.

- **Input:**
  `["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]`
  `[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]`
- **Output:** `[null, null, null, 1, null, -1, null, -1, 3, 4]`
- **Constraints:** $1 \le capacity \le 3,000$, $0 \le key \le 10^4$, $0 \le value \le 10^5$, at most $2 \times 10^5$ calls to `get` and `put`.

#### 3.1.2 How to Think About It
Imagine a shelf that can hold only 2 books. Book 1 and Book 2 are placed on the shelf. You read Book 1. Because you just read Book 1, it is fresh in your mind, making Book 2 the oldest untouched book. When Book 3 arrives, the shelf is full. You discard Book 2 and place Book 3 on the shelf.

#### 3.1.3 Brute Force Approach & Bottleneck
Store items in an array with timestamps. On every `get()` or `put()`, search the array for the key in $O(N)$ time. When capacity is exceeded, scan all $N$ items to find the smallest timestamp.
In a high-throughput backend handling 50,000 requests per second, an $O(N)$ scan per cache operation saturates the CPU.

#### 3.1.4 The Pattern Insight
Combine a **Hash Map** with a **Doubly Linked List**:
- Hash Map provides $O(1)$ key-to-node lookup.
- Doubly Linked List provides $O(1)$ node detachment (`removeNode`) and $O(1)$ insertion at the head (`addNode`).
- Sentinel nodes `dummyHead` and `dummyTail` eliminate null-pointer edge cases.
- Eviction targets `dummyTail.prev` in $O(1)$ time.

#### 3.1.5 Pseudocode
```text
class LRUCache:
    capacity, map, head, tail

    function get(key):
        if key not in map: return -1
        node = map.get(key)
        moveToHead(node)
        return node.val

    function put(key, value):
        if key in map:
            node = map.get(key)
            node.val = value
            moveToHead(node)
        else:
            node = new Node(key, value)
            map.set(key, node)
            addNode(node)
            if map.size > capacity:
                lru = popTail()
                map.delete(lru.key)
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(1) LRU Cache with Sentinel Nodes
class DListNode {
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
    this.map = new Map(); // key -> DListNode

    // Sentinel dummy nodes
    this.head = new DListNode();
    this.tail = new DListNode();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key) {
    if (!this.map.has(key)) {
      return -1;
    }

    const node = this.map.get(key);
    this._moveToHead(node);
    return node.val;
  }

  put(key, value) {
    if (this.map.has(key)) {
      const node = this.map.get(key);
      node.val = value;
      this._moveToHead(node);
    } else {
      const newNode = new DListNode(key, value);
      this.map.set(key, newNode);
      this._addNode(newNode);

      if (this.map.size > this.capacity) {
        const lru = this._popTail();
        this.map.delete(lru.key);
      }
    }
  }

  _addNode(node) {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next.prev = node;
    this.head.next = node;
  }

  _removeNode(node) {
    const prev = node.prev;
    const next = node.next;
    prev.next = next;
    next.prev = prev;
  }

  _moveToHead(node) {
    this._removeNode(node);
    this._addNode(node);
  }

  _popTail() {
    const lru = this.tail.prev;
    this._removeNode(lru);
    return lru;
  }
}

const lruTest = new LRUCache(2);
lruTest.put(1, 1);
lruTest.put(2, 2);
console.log("get(1):", lruTest.get(1)); // Output: 1
lruTest.put(3, 3);                      // Evicts 2
console.log("get(2):", lruTest.get(2)); // Output: -1
lruTest.put(4, 4);                      // Evicts 1
console.log("get(1):", lruTest.get(1)); // Output: -1
console.log("get(3):", lruTest.get(3)); // Output: 3
console.log("get(4):", lruTest.get(4)); // Output: 4
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Forgetting to delete key from Map upon eviction
const lru = this._popTail();
// Missing: this.map.delete(lru.key);
// Map retains zombie reference, causing map.size to exceed capacity!
```

Failing to delete `lru.key` from `this.map` leaks memory and leaves stale keys that falsely report hits.

#### 3.1.8 Complexity Derivation
- **Time Complexity:** $O(1)$ strictly for both `get` and `put`. Hash map operations and doubly linked list pointer adjustments run in constant time.
- **Auxiliary Space Complexity:** $O(\text{capacity})$ for the hash map entries and linked list nodes.

---

### 3.2 Implement Trie (Prefix Tree)

#### 3.2.1 Problem Statement
A trie (prefix tree) is a tree data structure used to store and retrieve keys in a dataset of strings. Implement the `Trie` class:
- `Trie()`: Initializes the trie object.
- `void insert(String word)`: Inserts `word` into the trie.
- `boolean search(String word)`: Returns `true` if `word` exists in the trie.
- `boolean startsWith(String prefix)`: Returns `true` if there is a previously inserted string that has prefix `prefix`.

- **Input:**
  `["Trie", "insert", "search", "search", "startsWith", "insert", "search"]`
  `[[], ["apple"], ["apple"], ["app"], ["app"], ["app"], ["app"]]`
- **Output:** `[null, null, true, false, true, null, true]`
- **Constraints:** $1 \le word.length, prefix.length \le 2,000$, words consist of lowercase English letters, at most $3 \times 10^4$ total calls.

#### 3.2.2 How to Think About It
Imagine a paper dictionary with thumb tabs on the edge. You open to tab 'a', then follow section 'p', then sub-entry 'p', then 'l', then 'e'. At 'apple', there is a black checkmark showing it is a real word. If you search for 'app', you find the path 'a-p-p', but unless there is a checkmark on 'p', 'app' is just the start of another word, not a word itself.

#### 3.2.3 Brute Force Approach & Bottleneck
Storing words in an array or Set:
A `Set` provides $O(1)$ exact search, but `startsWith(prefix)` requires linearly scanning all $N$ words and checking `w.startsWith(prefix)`, which runs in $O(N \cdot L)$ time.

#### 3.2.4 The Pattern Insight
In a Trie, shared prefixes share nodes. Searching for a prefix walks character by character. If a character branch is missing, the prefix does not exist. Runtime depends only on the length of the string $L$, completely independent of the total dictionary size $N$.

#### 3.2.5 Pseudocode
```text
class TrieNode:
    children = Map()
    isEndOfWord = false

class Trie:
    root = new TrieNode()

    function insert(word):
        curr = root
        for char in word:
            if char not in curr.children:
                curr.children.set(char, new TrieNode())
            curr = curr.children.get(char)
        curr.isEndOfWord = true

    function search(word):
        node = traverse(word)
        return node != null and node.isEndOfWord == true

    function startsWith(prefix):
        return traverse(prefix) != null
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal Production Trie Implementation
class TrieNode {
  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let curr = this.root;
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if (!curr.children.has(char)) {
        curr.children.set(char, new TrieNode());
      }
      curr = curr.children.get(char);
    }
    curr.isEndOfWord = true;
  }

  search(word) {
    const node = this._traverse(word);
    return node !== null && node.isEndOfWord === true;
  }

  startsWith(prefix) {
    return this._traverse(prefix) !== null;
  }

  _traverse(str) {
    let curr = this.root;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (!curr.children.has(char)) {
        return null;
      }
      curr = curr.children.get(char);
    }
    return curr;
  }
}

const trie = new Trie();
trie.insert("apple");
console.log("search('apple'):", trie.search("apple"));     // Output: true
console.log("search('app'):", trie.search("app"));         // Output: false
console.log("startsWith('app'):", trie.startsWith("app")); // Output: true
trie.insert("app");
console.log("search('app'):", trie.search("app"));         // Output: true
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Forgetting to check isEndOfWord in search()
search(word) {
  return this._traverse(word) !== null; // BUG: Identical to startsWith!
}
```

Failing to verify `isEndOfWord === true` in `search()` causes prefixes of existing words to be falsely returned as complete words.

#### 3.2.8 Complexity Derivation
- **Time Complexity:**
  - `insert`: $O(L)$, where $L$ is word length.
  - `search`: $O(L)$.
  - `startsWith`: $O(P)$, where $P$ is prefix length.
- **Auxiliary Space Complexity:** $O(N \cdot L)$ worst case for total TrieNode allocations, where $N$ is word count and $L$ is average word length. Shared prefixes reduce practical memory.

---

### 3.3 Merge Intervals

#### 3.3.1 Problem Statement
Given an array of `intervals` where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.

- **Input:** `intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]`
- **Output:** `[[1, 6], [8, 10], [15, 18]]` (Since `[1, 3]` and `[2, 6]` overlap, they merge into `[1, 6]`)
- **Constraints:** $1 \le intervals.length \le 10^4$, $intervals[i].length == 2$, $0 \le start_i \le end_i \le 10^4$.

#### 3.3.2 How to Think About It
Imagine booking meetings on a calendar. If Meeting A is from 1:00 to 3:00, and Meeting B is from 2:00 to 6:00, the meeting room is occupied continuously from 1:00 to 6:00. The meetings merge into a single block `[1, 6]`. The next meeting starts at 8:00, which has no conflict with 6:00, so it remains a separate booking.

#### 3.3.3 Brute Force Approach & Bottleneck
Comparing every interval with every other interval to detect overlaps:
Evaluating all pairs takes $O(N^2)$ time and requires managing dynamic array deletions and merges.

#### 3.3.4 The Pattern Insight
Use **Sweep-Line sorting by start coordinate**:
1. Sort `intervals` ascending by start time: `intervals.sort((a, b) => a[0] - b[0])`.
2. Initialize `merged = [intervals[0]]`.
3. Iterate through intervals from index 1 to $N - 1$:
   - Let `prev = merged[merged.length - 1]`, `curr = intervals[i]`.
   - If `curr[0] <= prev[1]`, they overlap! Expand `prev[1] = Math.max(prev[1], curr[1])`.
   - Otherwise, push `curr` as a new non-overlapping interval.

#### 3.3.5 Pseudocode
```text
function merge(intervals):
    if intervals.length <= 1: return intervals
    sort intervals ascending by start time: intervals[0]

    merged = [intervals[0]]
    for i from 1 to intervals.length - 1:
        prev = merged[merged.length - 1]
        curr = intervals[i]
        if curr[0] <= prev[1]:
            prev[1] = max(prev[1], curr[1])
        else:
            merged.push(curr)

    return merged
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(N log N) Merge Intervals
function merge(intervals) {
  if (!intervals || intervals.length <= 1) return intervals;

  // 1. Sort ascending by start coordinate
  intervals.sort((a, b) => a[0] - b[0]);

  const merged = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const curr = intervals[i];
    const prev = merged[merged.length - 1];

    // If current interval starts before or when previous ends, they overlap
    if (curr[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], curr[1]);
    } else {
      merged.push(curr);
    }
  }

  return merged;
}

const intervals = [[1, 3], [2, 6], [8, 10], [15, 18]];
console.log("Merged Intervals:", merge(intervals));
// Output: [ [ 1, 6 ], [ 8, 10 ], [ 15, 18 ] ]

const unsorted = [[2, 6], [1, 3], [15, 18], [8, 10]];
console.log("Unsorted input merged:", merge(unsorted));
// Output: [ [ 1, 6 ], [ 8, 10 ], [ 15, 18 ] ]
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Forgetting to sort intervals upfront
function badMerge(intervals) {
  // If intervals are [[2, 6], [1, 3]], checking sequentially without sorting
  // fails to merge them because [2, 6] cannot look back at [1, 3]!
}
```

Sorting by start coordinate is the mandatory foundation of interval sweep algorithms.

#### 3.3.8 Complexity Derivation
- **Time Complexity:** $O(N \log N)$ dominated by sorting the intervals. The subsequent linear sweep takes $O(N)$ time.
- **Auxiliary Space Complexity:** $O(N)$ for storing the output `merged` array (or $O(\log N)$ sorting stack space).

---

## 4. Tricky Edge Cases

- **Sentinel Dummy Nodes:** In doubly linked lists, forgetting dummy nodes requires multiple nested `null` checks on `this.head` and `this.tail` on every insert and delete.
- **LRU Update on Existing Key:** In `put(key, value)`, if `key` already exists, update its value and promote it to the head. Do not increment size or trigger eviction.
- **Complete Eviction in LRU:** When evicting an LRU item, unlink it from the doubly linked list and delete its key from `this.map`.
- **Interval Fully Contained:** An interval like `[1, 10]` and `[2, 5]` results in `prev[1] = Math.max(10, 5) = 10`. Always use `Math.max()` rather than overwriting with `curr[1]`.

---

## 5. Summary Cheat Sheet

- **LRU Cache:** Combines a Hash Map for $O(1)$ lookups with a Doubly Linked List for $O(1)$ recency promotion and eviction.
- **Trie (Prefix Tree):** Character-by-character tree structure providing $O(L)$ search and prefix validation independent of dictionary size.
- **Interval Sweeping:** Sort by start coordinate, then merge overlapping ranges in a single $O(N)$ linear pass.
- **Sentinel Nodes:** `dummyHead` and `dummyTail` eliminate pointer edge cases in linked lists.
- **In-Memory Cache Bounds:** Every production cache must enforce an eviction policy (like LRU) to protect the V8 heap from out-of-memory crashes.

---

## 6. Practice Problems

### 6.1 Meeting Rooms II

- **Input:** `intervals = [[0, 30], [5, 10], [15, 20]]`.
- **Output:** `2` (Minimum conference rooms required).
- **Constraint:** $1 \le intervals.length \le 10^4$.
- **Hint 1:** Separate start times and end times into two arrays and sort both.
- **Hint 2:** Use two pointers: if `start[i] < end[j]`, a new room is needed (increment room count); otherwise, a meeting finished (advance `j`).
- **Hint 3:** Or maintain a Min-Heap of meeting end times.

### 6.2 Design In-Memory File System

- **Commands:** `ls(path)`, `mkdir(path)`, `addContentToFile(path, content)`, `readContentFromFile(path)`.
- **Output:** File system results.
- **Constraint:** Paths are slash-delimited strings (`"/a/b/c"`).
- **Hint 1:** Implement using a Trie where each node represents a directory or file.
- **Hint 2:** Split paths by `'/'` to step through the Trie.
- **Hint 3:** Store directory entries in a `Map` and file content in a string property.

### 6.3 LFU Cache

- **Requirement:** Design and implement a Least Frequently Used (LFU) cache with $O(1)$ `get` and `put`.
- **Constraint:** Evict the least frequently accessed item; break ties using LRU.
- **Hint 1:** Maintain two maps: `keyMap` (`key -> Node`) and `freqMap` (`frequency -> DoublyLinkedList`).
- **Hint 2:** Track `minFreq` to know which frequency list to evict from in $O(1)$.
- **Hint 3:** When a node is accessed, increment its frequency and move it to the next frequency bucket list.

---

<nav aria-label="Lecture navigation">

[Previous: Dynamic Programming: 1D & 2D](day-29-dynamic-programming-1d-and-2d.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Back to Day 01: Big O & Problem Solving](day-01-big-o-complexity-and-problem-solving.md)

</nav>
