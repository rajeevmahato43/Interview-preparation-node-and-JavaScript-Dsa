# Day 57: High-Frequency Senior Interview Problems

## 1. Learning Outcomes
- Master the implementation of **LRU Cache** combining a Hash Map with a Doubly Linked List for strict $O(1)$ operations.
- Solve **Trapping Rain Water** in $O(n)$ time and $O(1)$ auxiliary space using Two Pointers.
- Compare Two Pointers vs. Monotonic Stack for elevation and geometric water retention problems.
- Master production-grade error handling, sentinel nodes, and state isolation expected in Senior/Staff interviews.
- Connect LRU and pointer buffers to memory management in Node.js caches and buffer pooling.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 11 (Two Pointers), Day 18 (Monotonic Stack), Day 29 (Doubly Linked Lists).
- **Navigation**:
  - [Previous: Day 56 - Mixed Pattern Strategy & Constraints](day-56-mixed-pattern-strategy-and-constraints.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 58 - DSA in Production Node.js Backends](day-58-dsa-in-production-nodejs-backends.md)

---

## 3. Core Concepts & Mental Models

### Problem 1: LRU Cache (Least Recently Used)
Requirements: Both `get(key)` and `put(key, value)` must execute in **strictly $O(1)$ time**.
- **Hash Map**: Provides $O(1)$ key-to-node lookup.
- **Doubly Linked List**: Maintains chronological access order with $O(1)$ node removal and head insertion.
- **Sentinel Nodes**: `head` and `tail` dummy nodes eliminate all edge cases for empty lists.

```text
LRU Cache Structure:
[Head Dummy] <=====> [Most Recent] <=====> [Node B] <=====> [Least Recent] <=====> [Tail Dummy]
       ^                                                                ^
       |                                                                |
   Add new nodes here                                           Evict from here (at capacity)

Map: { key1: NodeRef1, key2: NodeRef2 }
```

### Problem 2: Trapping Rain Water
At any index $i$, the height of water trapped above $i$ is determined by:
$$\text{Water at } i = \max(0, \min(\text{maxLeft}, \text{maxRight}) - \text{height}[i])$$
Using **Two Pointers** moving inwards, if `maxLeft < maxRight`, the water trapped at `left` is strictly bounded by `maxLeft` regardless of what happens in between!

---

## 4. Detailed Technical Explanations

### 4.1 LRU Cache Invariant Management
- When a key is accessed via `get(key)`: If present, remove the node from its current position and re-insert immediately after `head` (marking it as most recently used).
- When a key is inserted via `put(key, value)`:
  - If key exists: update value and move to head.
  - If new key: create node, insert after `head`, add to map.
  - If `map.size > capacity`: evict `tail.prev` (least recently used node), delete its key from map, unlink from list.

### 4.2 Trapping Rain Water Two-Pointer Invariant
- Maintain `left = 0`, `right = n - 1`, `leftMax = 0`, `rightMax = 0`.
- While `left < right`:
  - If `height[left] < height[right]`:
    - If `height[left] >= leftMax`: update `leftMax = height[left]`.
    - Else: `trappedWater += leftMax - height[left]`.
    - `left++`.
  - Else:
    - If `height[right] >= rightMax`: update `rightMax = height[right]`.
    - Else: `trappedWater += rightMax - height[right]`.
    - `right--`.
- Space: Strictly $O(1)$ auxiliary memory!

### 4.3 Node.js Relevance: In-Memory Caching & Packet Buffer Aggregation
In high-throughput Node.js microservices, LRU caches (e.g., `lru-cache` npm package) prevent memory exhaustion by bounding heap allocations for session stores and database query results. Trapping rain water models network packet deficit accumulation between bursty producers and constrained socket consumers.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 LRU Cache Implementation (LeetCode 146)
```javascript
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

    // Sentinel dummy head and tail
    this.head = new DNode();
    this.tail = new DNode();
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
      const newNode = new DNode(key, value);
      this.map.set(key, newNode);
      this._addNode(newNode);

      if (this.map.size > this.capacity) {
        const lru = this._popTail();
        this.map.delete(lru.key);
      }
    }
  }

  // Helper methods for O(1) list manipulation
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
```

### 5.2 Trapping Rain Water (LeetCode 42)
```javascript
/**
 * Computes trapped water in O(n) time and O(1) space.
 */
function trap(height) {
  if (!height || height.length <= 2) return 0;

  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let trappedWater = 0;

  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) {
        leftMax = height[left];
      } else {
        trappedWater += leftMax - height[left];
      }
      left++;
    } else {
      if (height[right] >= rightMax) {
        rightMax = height[right];
      } else {
        trappedWater += rightMax - height[right];
      }
      right--;
    }
  }

  return trappedWater;
}
```

### 5.3 Execution Trace: `trap([0,1,0,2,1,0,1,3,2,1,2,1])`
```text
Initial: left=0 (0), right=11 (1). trapped = 0.
left < right: height[left] (0) < height[right] (1)
  height[0] (0) >= leftMax (0) -> leftMax = 0. left++ (1)
height[1] (1) == height[11] (1):
  height[11] (1) >= rightMax (0) -> rightMax = 1. right-- (10)
height[1] (1) < height[10] (2):
  height[1] (1) >= leftMax (0) -> leftMax = 1. left++ (2)
height[2] (0) < height[10] (2):
  height[2] (0) < leftMax (1) -> trapped += 1 - 0 = 1! left++ (3)
...
Pointers converge at maximum peak (3 at index 7).
Total trapped water accumulated = 6 units!
```

---

## 6. Common Mistakes & Anti-Patterns
- **Using Native `Map` Key Iteration for LRU**: In JavaScript, `Map.prototype.keys()` preserves insertion order, leading some candidates to implement LRU via `map.delete(key); map.set(key, val)`. While valid in JS, interviewers explicitly ask for the Doubly Linked List implementation to test pointer manipulation and language-agnostic data structures.
- **Forgetting to Store `key` on `DNode`**: When evicting the least recently used node (`tail.prev`), you must delete its key from the Map. If `DNode` only stores `val`, you cannot find which map key to delete!
- **Off-By-One in Trapping Water**: Calculating water without guarding `leftMax` and `rightMax` updates can add negative numbers if the current height exceeds previous maximums.

---

## 7. Tricky Points & Edge Cases
- **Capacity = 1 in LRU**: Setting capacity to 1 evicts the previous node on every single insertion; sentinel nodes prevent null pointer crashes.
- **Elevation Plateaus**: If height has flat peaks (`[2, 0, 2]`), water trapped between them is calculated correctly ($2 - 0 = 2$).
- **Monotonic Stack Alternative for Trapping Water**: Trapping water can also be solved using a Monotonic Decreasing Stack ($O(n)$ time, $O(n)$ space), which calculates water horizontally in bounded layers rather than vertically by column.

---

## 8. Practical Engineering Exercises
1. Implement **LFU Cache (Least Frequently Used)** (LeetCode 460) with $O(1)$ operations using two Hash Maps and a collection of Doubly Linked Lists.
2. Solve **Trapping Rain Water II** (LeetCode 407) on a 3D elevation map using a Priority Queue (Min-Heap) and BFS boundary expansion.

---

## 9. Key Takeaways & Summary
- LRU Cache achieves $O(1)$ lookup and mutation by combining a Hash Map with a Doubly Linked List.
- Sentinel head and tail nodes eliminate null pointer branching when inserting and deleting list nodes.
- Trapping Rain Water is solved in $O(n)$ time and $O(1)$ space using Two Pointers bounded by the smaller of `leftMax` and `rightMax`.

---

## 10. Quick Reference Cheat Sheet
| Problem | Core Data Structure | Time | Space |
| :--- | :--- | :--- | :--- |
| **LRU Cache** | Hash Map + Doubly Linked List | $O(1)$ per op | $O(\text{capacity})$ |
| **LFU Cache** | Maps + Frequency Linked Lists | $O(1)$ per op | $O(\text{capacity})$ |
| **Trapping Rain Water** | Two Pointers (opposing) | $O(n)$ | $O(1)$ |
| **Trapping Water (Stack)** | Monotonic Decreasing Stack | $O(n)$ | $O(n)$ |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: Why is a Singly Linked List insufficient for achieving $O(1)$ removal of the least recently used node in an LRU Cache?  
**Hint**: What pointer is required to delete a node in a linked list?  
**Expected Answer Shape**: To delete a node from a linked list in $O(1)$ time, you must rewire its predecessor's `next` pointer (`prev.next = node.next`). In a Singly Linked List, given only a reference to the target node (stored in the Hash Map), finding its predecessor requires traversing the list from the head, which takes $O(n)$ time. A Doubly Linked List stores a direct `prev` reference on each node, enabling instantaneous $O(1)$ unlinking.

### 2. Code-Writing
**Question**: Show how to implement a quick LRU Cache in modern JavaScript using the native `Map` property of insertion order retention.  
**Hint**: Delete and re-set keys on access; delete `map.keys().next().value` on overflow.  
**Expected Answer Shape**: In `get(key)`: if present, `const val = map.get(key); map.delete(key); map.set(key, val); return val;`. In `put(key, value)`: if present, `map.delete(key)`. If `map.size >= capacity`, `map.delete(map.keys().next().value)`. `map.set(key, value)`. Mention to the interviewer that while this is idiomatic JavaScript, the canonical Doubly Linked List pattern is language-agnostic.

### 3. Debugging
**Question**: Identify why this LRU `put` implementation leaks memory when updating an existing key:  
```javascript
put(key, value) {
  if (this.map.has(key)) {
    this.map.get(key).val = value;
    this._moveToHead(this.map.get(key));
  } else {
    const node = new DNode(key, value);
    this._addNode(node);
    this.map.set(key, node);
    if (this.map.size > this.capacity) {
      this._popTail();
    }
  }
}
```  
**Hint**: What happens to `this.map` when `_popTail()` executes?  
**Expected Answer Shape**: When capacity is exceeded, `this._popTail()` unlinks the tail node from the doubly linked list, but it does *not* delete the corresponding key from `this.map`! As new keys are inserted, `this.map` continues growing indefinitely, causing `this.map.size > this.capacity` to trigger on every subsequent insert while old keys remain stranded in the map, leaking memory. Fix: `const lru = this._popTail(); this.map.delete(lru.key);`.

### 4. System Design / Tradeoff
**Question**: How would you implement an LRU cache in a clustered Node.js environment where 8 worker processes run behind a load balancer?  
**Hint**: Local process cache vs. shared distributed cache.  
**Expected Answer Shape**: If each Node.js process maintains an in-memory LRU cache, cache state is fragmented: user requests routed to worker A will experience cache misses even if worker B already cached the data, and cached updates will cause inconsistency. For multi-process architectures, use a distributed cache like **Redis** (which natively supports LRU eviction via `maxmemory-policy: allkeys-lru`), or use a two-tier caching strategy (tiny in-memory L1 cache with 1-second TTL + shared Redis L2 cache).

### 5. Tricky / Edge Case
**Question**: In Trapping Rain Water, why does `if (height[left] < height[right])` allow us to safely process `left` without knowing the exact maximum to the right of `left`?  
**Hint**: We only care whether `leftMax` or `rightMax` is smaller.  
**Expected Answer Shape**: Because `height[left] < height[right]`, we know that `height[right]` is already greater than `height[left]`, which guarantees that the global maximum to the right of `left` is at least `height[right] > leftMax`. Since the water level at `left` is determined by $\min(\text{leftMax}, \text{rightMax})$, and we know $\text{rightMax} > \text{leftMax}$, `leftMax` is unequivocally the limiting bottleneck. The exact height of the tallest bar on the right is completely irrelevant.

### 6. Real-World Node.js Context
**Question**: How does Node.js core optimize memory allocation in buffer pools using principles similar to LRU pointer retention?  
**Hint**: `Buffer.allocUnsafe` and internal 8KB slab allocation.  
**Expected Answer Shape**: Node.js allocates small Buffers ($<4\text{KB}$) from a pre-allocated 8KB slab (`Buffer.poolSize`). When slices are created, they share the underlying `ArrayBuffer` memory. If long-lived objects retain a small 10-byte slice of an 8KB buffer, the entire 8KB slab is prevented from being garbage collected. Senior Node.js engineers use `Buffer.copy()` to isolate small long-lived data, ensuring large buffer slabs are promptly recycled.
