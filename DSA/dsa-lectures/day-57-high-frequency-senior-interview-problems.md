# Day 57: High-Frequency Senior Interview Problems

<nav aria-label="Lecture navigation">
  <a href="day-56-mixed-pattern-strategy-and-constraints.md">◀ Day 56: Mixed Pattern Strategy and Constraint Decoding</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-58-dsa-in-production-nodejs-backends.md">Day 58: DSA in Production Node.js Backends ▶</a>
</nav>

---
## Prerequisites

- [Day 11: Two Pointers: Opposite and Same Direction](day-11-two-pointers-opposite-and-same-direction.md) — Converging two-pointer bounds.
- [Day 18: Monotonic Stack: Next Greater and Temperatures](day-18-monotonic-stack-next-greater-and-temperatures.md) — Monotonic stack for histogram geometry.
- [Day 29: Singly and Doubly Linked Lists](day-29-singly-and-doubly-linked-lists.md) — Node unlinking and sentinel pointer splicing.
---

## 1. LRU Cache: Hash Map + Doubly Linked List

> **LRU Cache**: A fixed-capacity cache that evicts the least recently accessed item when capacity is reached.

An **LRU Cache** (Least Recently Used) must support two operations in strictly $O(1)$ time:
1. `get(key)`: Returns the value if key exists, and marks it as most recently used. Otherwise returns `-1`.
2. `put(key, value)`: Inserts or updates the key-value pair. If capacity is exceeded, evicts the least recently used key.

#### Why Neither Structure Works Alone:
- An Array/List provides $O(1)$ reordering, but finding a key takes $O(n)$ search.
- A Hash Map provides $O(1)$ lookups, but does not maintain sequential access order.
- **The Composite Solution**: A **Hash Map** stores `key -> NodeReference` ($O(1)$ access). A **Doubly Linked List** stores nodes in recency order ($O(1)$ detach and head insertion).

```text
LRU Cache Architecture with Sentinel Dummies:

[ Head Dummy ] <======> [ Node A (MRU) ] <======> [ Node B ] <======> [ Node C (LRU) ] <======> [ Tail Dummy ]
      ^                                                                      ^
      |                                                                      |
  Most Recently Used                                                 Least Recently Used
  (Inserted here)                                                    (Evicted from here)

Hash Map: { "A": Ref(A), "B": Ref(B), "C": Ref(C) }

Operations:
- get("B"): Detach Node B from between A and C; splice B immediately after Head Dummy. O(1)!
- put("D", val) at capacity: Remove Node C (tail.prev); delete "C" from Map; insert D after Head. O(1)!
```

```javascript
// Node.js code: Production LRU Cache Implementation
class DListNode {
  constructor(key = 0, val = 0) {
    this.key = key;
    this.val = val;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  /**
   * @param {number} capacity
   */
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map(); // key -> DListNode

    // Sentinel dummy nodes
    this.head = new DListNode();
    this.tail = new DListNode();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * Detaches a node from its current linked list position.
   * Time Complexity: O(1)
   * @private
   */
  _removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  /**
   * Inserts a node immediately after the head sentinel (MRU position).
   * Time Complexity: O(1)
   * @private
   */
  _addNodeToHead(node) {
    node.prev = this.head;
    node.next = this.head.next;

    this.head.next.prev = node;
    this.head.next = node;
  }

  /**
   * Moves an existing node to the MRU position.
   * Time Complexity: O(1)
   * @private
   */
  _moveToHead(node) {
    this._removeNode(node);
    this._addNodeToHead(node);
  }

  /**
   * @param {number} key
   * @returns {number}
   */
  get(key) {
    const node = this.map.get(key);
    if (!node) return -1;

    this._moveToHead(node);
    return node.val;
  }

  /**
   * @param {number} key
   * @param {number} value
   */
  put(key, value) {
    const existingNode = this.map.get(key);

    if (existingNode) {
      existingNode.val = value;
      this._moveToHead(existingNode);
    } else {
      const newNode = new DListNode(key, value);
      this.map.set(key, newNode);
      this._addNodeToHead(newNode);

      if (this.map.size > this.capacity) {
        // Evict least recently used (node before tail dummy)
        const lruNode = this.tail.prev;
        this._removeNode(lruNode);
        this.map.delete(lruNode.key);
      }
    }
  }
}

// Verification
const cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
console.log('Get 1:', cache.get(1)); // 1 (1 becomes MRU)
cache.put(3, 3);                    // Evicts key 2!
console.log('Get 2 (evicted):', cache.get(2)); // -1
```

---

## 2. Trapping Rain Water: Optimal Two Pointers

> **Trapping Rain Water**: Calculating the volume of water retained between vertical elevation bars after rainfall.

In **Trapping Rain Water** (LeetCode 42), given $n$ non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.

```text
Elevation Geometry:
Height: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]

Water Level Invariant:
At index i:
Trapped Water = max(0, min(leftMax, rightMax) - height[i])

The Two-Pointer Invariant:
Pointers start at left = 0, right = n - 1.
If leftMax < rightMax:
  The water trapped at 'left' is STRICTLY BOUNDED by leftMax, regardless of how tall
  any unknown bars in the middle might be!
  Therefore, we can safely compute water at 'left' and increment left++.
Similarly, if rightMax <= leftMax:
  Water at 'right' is strictly bounded by rightMax. Compute water and decrement right--.
```

```javascript
// Node.js code: Trapping Rain Water with O(1) Space Two Pointers
/**
 * @param {number[]} height
 * @returns {number}
 */
function trap(height) {
  if (!height || height.length <= 2) return 0;

  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let totalWater = 0;

  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) {
        leftMax = height[left];
      } else {
        totalWater += leftMax - height[left];
      }
      left++;
    } else {
      if (height[right] >= rightMax) {
        rightMax = height[right];
      } else {
        totalWater += rightMax - height[right];
      }
      right--;
    }
  }

  return totalWater;
}

console.log('Trapped water:', trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1])); // 6
```

---

## 3. Comparison Matrix: Approaches to Trapping Rain Water

| Approach | Time Complexity | Auxiliary Space | Architectural Mechanism |
| :--- | :--- | :--- | :--- |
| **Brute Force** | $O(n^2)$ | $O(1)$ | Scans entire left and right arrays for every bar |
| **Dynamic Programming** | $O(n)$ | $O(n)$ | Pre-computes `leftMax[]` and `rightMax[]` arrays |
| **Monotonic Stack** | $O(n)$ | $O(n)$ | Computes water horizontally layer-by-layer |
| **Two Pointers** | $O(n)$ | $O(1)$ | Squeezes inward; computes water vertically bar-by-bar |

---

## Detailed Node.js Relevance

### In-Memory Cache Sizing and Buffer Pool Allocation

In Node.js enterprise microservices:

```text
High-Throughput Node.js Caching Architecture:
[ Incoming HTTP Queries ] ---> [ In-Memory LRU Cache ] ---> [ Database Query ]
Max Memory Budget: 500MB        Bounded by Capacity            Evicts Old Keys
```

1. **V8 Old Space Memory Leaks**: An unbounded in-memory cache implemented with a plain JavaScript object or `Map` without an LRU eviction policy will continuously allocate heap memory until V8 triggers `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed`. Implementing a strict LRU cache guarantees an upper bound on heap usage.
2. **Buffer Pooling in Node.js Core**: Node.js allocates small `Buffer` instances from an internal 8KB memory pool (`Buffer.poolSize`). When small chunks are sliced, they share an underlying `ArrayBuffer`. Understanding pointer offsets and node references prevents keeping entire parent buffers alive in memory when only small slices are needed.

---

## Tricky Points & Edge Cases

1. **Missing Key in Map on LRU Eviction**:
   When evicting the least recently used node from the doubly linked list, you must delete its entry from `this.map` using `this.map.delete(lruNode.key)`. Forgetting to store `key` inside the `DListNode` object prevents locating the key to delete from the map!
2. **Updating Existing Keys in `put()`**:
   If a key already exists, `put(key, value)` must **update the value** and move the node to the MRU position **without incrementing the cache size count**.
3. **Empty / Skewed Elevations in Rain Water**:
   If all heights are strictly increasing (`[1, 2, 3, 4]`) or strictly decreasing (`[4, 3, 2, 1]`), no water can be trapped. The algorithm should cleanly return 0.
4. **Elevation Heights with Zero**:
   Pointers must handle zero heights without division errors or negative subtraction bugs.

---

## Hands-On Exercise

### Scenario
You are developing a high-performance session cache for an authentication gateway in Node.js. Sessions have `{ token: string, userId: string, role: string }`.
Implement `SessionLRUCache`:
1. `getSession(token)`: Returns the session object in $O(1)$ time and marks it as recently active. Returns `null` if expired or missing.
2. `setSession(token, sessionData)`: Stores session in $O(1)$ time. If capacity is exceeded, evicts the least recently used session.
3. `removeSession(token)`: Manually invalidates and removes a session (e.g., user logout) in $O(1)$ time.
4. Guard against re-insertion bugs and capacity overflows.

### Buggy Code
```javascript
class SessionLRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  getSession(token) {
    // BUG: Plain Map lookup does NOT update access recency!
    return this.cache.get(token) || null;
  }

  setSession(token, data) {
    // BUG: If key exists, it doesn't move to end before checking capacity
    if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(token, data);
  }

  removeSession(token) {
    this.cache.delete(token);
  }
}
```

### Acceptance Criteria
- Implement true $O(1)$ LRU behavior with Doubly Linked List nodes and Hash Map lookups.
- Handle `removeSession` in $O(1)$ time by detaching the node directly.
- Support updating existing keys without prematurely evicting other keys.
- Complete automated unit tests with `assert`.

### Solution Code
```javascript
const assert = require('assert');

// Node.js code: Production Session LRU Cache with Explicit Node Splicing
class SessionNode {
  constructor(token = '', data = null) {
    this.token = token;
    this.data = data;
    this.prev = null;
    this.next = null;
  }
}

class SessionLRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map(); // token -> SessionNode

    // Sentinels
    this.head = new SessionNode();
    this.tail = new SessionNode();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  _remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _addHead(node) {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next.prev = node;
    this.head.next = node;
  }

  getSession(token) {
    const node = this.map.get(token);
    if (!node) return null;

    // Refresh recency
    this._remove(node);
    this._addHead(node);
    return node.data;
  }

  setSession(token, sessionData) {
    const existing = this.map.get(token);

    if (existing) {
      existing.data = sessionData;
      this._remove(existing);
      this._addHead(existing);
    } else {
      const newNode = new SessionNode(token, sessionData);
      this.map.set(token, newNode);
      this._addHead(newNode);

      if (this.map.size > this.capacity) {
        const lru = this.tail.prev;
        this._remove(lru);
        this.map.delete(lru.token);
      }
    }
  }

  removeSession(token) {
    const node = this.map.get(token);
    if (!node) return false;

    this._remove(node);
    this.map.delete(token);
    return true;
  }

  size() {
    return this.map.size;
  }
}

// Verification & Automated Unit Tests
const sessionStore = new SessionLRUCache(2);

sessionStore.setSession('tok-1', { userId: 'u1', role: 'admin' });
sessionStore.setSession('tok-2', { userId: 'u2', role: 'user' });

// Access tok-1 to make it most recently used
assert.strictEqual(sessionStore.getSession('tok-1').userId, 'u1');

// Adding 3rd session should evict least recently used (tok-2)
sessionStore.setSession('tok-3', { userId: 'u3', role: 'guest' });

assert.strictEqual(sessionStore.getSession('tok-2'), null); // tok-2 evicted!
assert.notStrictEqual(sessionStore.getSession('tok-1'), null); // tok-1 kept!
assert.strictEqual(sessionStore.getSession('tok-3').userId, 'u3');

// Manual logout / invalidation
assert.strictEqual(sessionStore.removeSession('tok-1'), true);
assert.strictEqual(sessionStore.getSession('tok-1'), null);
assert.strictEqual(sessionStore.size(), 1);

console.log('✅ All SessionLRUCache assertions passed successfully!');
```

### Solution Explanation
1. **Sentinel Encapsulation**: `_remove` and `_addHead` use sentinel nodes `head` and `tail`, eliminating null checks during node pointer rewiring.
2. **Explicit Key Deletion**: Storing `node.token` inside each node allows deleting the token from `this.map` when `this.tail.prev` is evicted.
3. **Constant Time Invalidation**: Manual deletion operates in $O(1)$ time by directly unlinking the node and removing it from the map.

---

## Summary

- **LRU Cache** combines a Hash Map ($O(1)$ lookup) with a Doubly Linked List ($O(1)$ recency reordering) using sentinel dummy nodes.
- Storing keys inside linked list nodes is mandatory to enable reverse deletion from the map upon LRU eviction.
- **Trapping Rain Water** uses the two-pointer invariant: water height at the shorter boundary is strictly bounded by that boundary's historical maximum, allowing $O(n)$ time and $O(1)$ space calculation.
- In Node.js backend infrastructure, bounded LRU caches protect V8 heap memory from fatal out-of-memory exhaustion during traffic surges.

---

## Cheat Sheet & Common Pitfalls

| Problem | Core Pattern | Time Complexity | Auxiliary Space | Key Pitfall |
| :--- | :--- | :--- | :--- | :--- |
| **LRU Cache** | Map + Doubly Linked List | $O(1)$ get/put | $O(\text{capacity})$ | Forgetting `node.key` for map deletion on eviction |
| **Trapping Water** | Opposing Two Pointers | $O(n)$ | $O(1)$ | Slicing arrays instead of moving pointers |
| **LRU Update** | Move to head | $O(1)$ | $O(1)$ | Treating key updates as capacity insertions |
| **Water Geometry** | Calculate by boundary | $O(n)$ | $O(1)$ | Updating both pointers simultaneously |

---

## Interview Questions

### 1. Why must the nodes in an LRU Cache store both the key and the value?
**Question:** In the Doubly Linked List used in an LRU Cache, why must each node store the `key` in addition to the `value`?

**Answer:**
When the cache reaches capacity and needs to evict the least recently used item:
1. The node to be evicted is identified at the tail of the list in $O(1)$ time: `lruNode = tail.prev`.
2. To remove this item from the cache completely, it must be removed from both the linked list AND the hash map: `map.delete(lruNode.key)`.
3. If the node only stored the `value`, there would be no direct way to know which key maps to this node in the hash map without performing a linear $O(n)$ scan across all map entries.
4. Storing the `key` directly on the node enables instantaneous $O(1)$ deletion from the hash map.

---

### 2. Can you implement an LRU Cache in JavaScript using built-in language features without a custom Doubly Linked List?
**Question:** How can JavaScript's native `Map` object be used to implement an LRU Cache in very few lines of code, and what are its caveats?

**Answer:**
In JavaScript (ECMAScript 2015+), the built-in `Map` object preserves **insertion order** of its keys.
```javascript
class ConciseLRU {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }
  get(key) {
    if (!this.map.has(key)) return -1;
    const val = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, val); // Re-inserting puts it at the end (MRU)
    return val;
  }
  put(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      // First key is the least recently used
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
  }
}
```
**Caveat in Interviews**: Interviewers typically ask candidates to implement the Doubly Linked List manually to test pointer manipulation, sentinel node architecture, and data structure composition. Mentioning this concise approach first demonstrates deep language knowledge, followed by offering to code the linked list manually.

---

### 3. How does the Monotonic Stack approach to Trapping Rain Water differ conceptually from Two Pointers?
**Question:** Explain the difference in mental model between the Two Pointers approach and the Monotonic Stack approach for Trapping Rain Water.

**Answer:**
- **Two Pointers (Vertical Column-by-Column Computation)**:
  - Traverses from outside inward.
  - At each index $i$, computes the full vertical column of water trapped directly above that bar: $\min(\text{leftMax}, \text{rightMax}) - \text{height}[i]$.
  - Runs in $O(n)$ time and $O(1)$ space.
- **Monotonic Stack (Horizontal Layer-by-Layer Computation)**:
  - Maintains a strictly decreasing stack of bar indices.
  - When a taller bar arrives, it acts as a right boundary for the shorter bars on the stack.
  - It pops the middle "valley" bar, calculates the distance between the left and right boundaries, and computes a horizontal bounded strip of water: $(\min(\text{leftHeight}, \text{rightHeight}) - \text{valleyHeight}) \times \text{distance}$.
  - Runs in $O(n)$ time and $O(n)$ stack space.

---

### 4. What happens if a Node.js process stores millions of items in an in-memory LRU cache without configuring `--max-old-space-size`?
**Question:** What runtime failure occurs if a Node.js service continuously adds items to an in-memory cache without capacity bounds?

**Answer:**
1. By default, Node.js allocates approximately 1.4GB of V8 old-space heap memory on 64-bit systems.
2. If an in-memory cache grows without bound, the number of allocated JavaScript objects increases into the millions.
3. As memory consumption approaches the heap limit, V8's Garbage Collector spends increasing amounts of CPU time running full "Stop-The-World" Mark-Sweep-Compact cycles attempting to reclaim memory.
4. This causes severe event loop latency spikes (hundreds of milliseconds of thread freezes).
5. Once memory exceeds the heap threshold, the V8 runtime aborts the process with:
   `FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory`.
6. Implementing a bounded LRU cache prevents heap exhaustion by strictly limiting the maximum number of retained entries.

---

<nav aria-label="Lecture navigation">
  <a href="day-56-mixed-pattern-strategy-and-constraints.md">◀ Day 56: Mixed Pattern Strategy and Constraint Decoding</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-58-dsa-in-production-nodejs-backends.md">Day 58: DSA in Production Node.js Backends ▶</a>
</nav>
