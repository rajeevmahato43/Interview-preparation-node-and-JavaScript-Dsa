# Day 02: Arrays, Objects, Sets, and Maps

<nav aria-label="Lecture navigation">

[Previous: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Strings and Text Patterns](day-03-strings-and-text-patterns.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Distinguish the asymptotic performance and memory characteristics of JavaScript's core collection types: Array, plain Object, `Map`, and `Set`.
- Choose the optimal data structure given algorithmic constraints (order, lookup speed, uniqueness, key typing).
- Explain V8 internal array representations: Packed vs Holey elements, and Fast vs Dictionary-mode elements.
- Avoid critical JavaScript interview traps: the Object prototype collision trap, non-string key coercion, and the Reference Equality trap in Sets and Maps.
- Solve the classic **Two Sum** problem in a single $O(n)$ pass using a hash complement map.
- Implement efficient queues without introducing $O(n)$ `Array.prototype.shift()` event-loop bottlenecks in Node.js.

---

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Complexity classes ($O(1)$, $O(n)$, $O(n^2)$) and asymptotic analysis.
- [JS Day 09: Objects and Property Access](../../Javascript/javascript-lectures/day-09-objects-and-property-access.md) — Prototype chains and property descriptors.
- [JS Day 12: Built-in Data Structures](../../Javascript/javascript-lectures/day-12-built-in-data-structures-and-serialization.md) — ES2015 `Map` and `Set` specifications.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
|---|---|---|
| **Contiguous Memory** | Memory allocated in an unbroken physical block where element addresses can be calculated via index offsets: $\text{Base} + i \times \text{Size}$. | Enables $O(1)$ constant-time random access by index in JavaScript arrays. |
| **Packed vs Holey Arrays** | V8 array optimizations: Packed arrays have elements at every index; Holey arrays contain unassigned gaps (`[1, , 3]`). | Accessing holey arrays forces V8 to traverse the prototype chain, causing 10x slower access times. |
| **Prototype Pollution Trap** | The hazard where plain `{}` objects inherit built-in properties (`toString`, `valueOf`, `constructor`) from `Object.prototype`. | Causes counter bugs when data keys collide with built-in names unless `Map` or `Object.create(null)` is used. |
| **Reference Equality** | The JavaScript equality model where two objects or arrays are equal (`===`) only if they reference the identical memory pointer. | In Sets and Maps, `set.has([1, 2])` always returns `false` for new array instances regardless of identical contents. |
| **Amortized Append** | Appending to a dynamic array takes $O(1)$ time on average, despite occasional $O(n)$ buffer reallocation and copying. | Explains why `arr.push()` is scalable, whereas `arr.unshift()` is permanently $O(n)$. |

---

## Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          JAVASCRIPT CORE COLLECTIONS TAXONOMY                               │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  1. ARRAY (Ordered, Positional)
     [ 0: "cat" | 1: "dog" | 2: "rabbit" ]
     • Read by index: O(1)
     • Push/Pop (tail): O(1) amortized
     • Shift/Unshift (head): O(n) ⚠️ (Forces elements to shift memory offsets)

  2. PLAIN OBJECT (String-Keyed Record)
     { "name": "Alice", "role": "admin" }
     • Read/Write by key: O(1) average
     • Keys: Coerced to Strings / Symbols only
     • Trap: Inherits Object.prototype properties!

  3. MAP (Key-Value Hash Table)
     Map( [42 => "answer"], [{id:1} => "user"] )
     • Read/Write by key: O(1) average
     • Keys: Any type (primitives, objects, functions)
     • Safe: Zero prototype inheritance; O(1) .size property

  4. SET (Unique Value Collection)
     Set( 1, 2, 3 )
     • Add/Has/Delete: O(1) average
     • Enforces uniqueness; ignores duplicates
     • Compares objects by reference address, not value!
```

### 1. Arrays — Positional Storage and V8 Element Kinds

A JavaScript Array is an ordered collection of elements accessible by numeric indices.

In low-level runtimes (like V8), JavaScript arrays are optimized into **Elements Kinds**:
1. **PACKED_SMI_ELEMENTS:** Arrays containing only Small Integers without holes. Fastest access.
2. **PACKED_DOUBLE_ELEMENTS:** Arrays containing floating-point numbers.
3. **HOLEY_ELEMENTS:** Arrays created with empty slots (e.g., `const a = []; a[100] = 1;`). When reading an unassigned index, V8 cannot return `undefined` immediately; it must perform an expensive walk up the prototype chain to verify `Object.prototype` did not define that property.
4. **Dictionary Elements (Slow Mode):** If you delete elements or create massive index gaps ($> 10,000$), V8 downgrades the array from contiguous memory into a slow hash map dictionary.

| Operation | Method / Syntax | Time Complexity | Engine Mechanism |
|---|---|---|---|
| **Read by Index** | `arr[i]` | **$O(1)$** | Direct memory offset computation: $\text{Base} + i \times \text{Size}$ |
| **Append (Tail)** | `arr.push(val)` | **$O(1)$ amortized** | Writes to next allocated buffer slot |
| **Pop (Tail)** | `arr.pop()` | **$O(1)$** | Decrements internal length pointer |
| **Prepend (Head)** | `arr.unshift(val)` | **$O(n)$** | Every element in memory must shift 1 index to the right |
| **Remove (Head)** | `arr.shift()` | **$O(n)$** | Every remaining element must shift 1 index to the left |
| **Value Search** | `arr.indexOf(val)` | **$O(n)$** | Scans sequentially from index 0 |

```javascript
// Node.js code
// ❌ ANTI-PATTERN: Using arr.shift() inside a loop (O(n^2) total!)
function processQueueSlow(tasks) {
  const processed = [];
  while (tasks.length > 0) {
    // shift() forces all remaining n elements to copy 1 index to the left!
    // For 50,000 items: 50,000 * 25,000 = ~1.25 billion memory copies!
    const task = tasks.shift();
    processed.push(task * 2);
  }
  return processed;
}

// ✅ PATTERN: Using a head pointer or reverse array pop (O(n) total!)
function processQueueFast(tasks) {
  const processed = [];
  let head = 0;
  while (head < tasks.length) {
    const task = tasks[head++]; // O(1) read + index increment!
    processed.push(task * 2);
  }
  return processed;
}
```

---

### 2. Plain Objects vs ES2015 Maps

A plain object (`{}`) is a record storing key-value pairs where keys are restricted to Strings and Symbols. A `Map` is an explicit hash map data structure supporting arbitrary keys and predictable ordering.

```javascript
// Node.js code
// ❌ THE PROTOTYPE INHERITANCE TRAP IN PLAIN OBJECTS:
const frequency = {};
const words = ['hello', 'world', 'toString', 'hello'];

for (const w of words) {
  // toString already exists on Object.prototype!
  // frequency['toString'] is initially: function toString() { [native code] }
  // (function || 0) evaluates to truthy function!
  // Result becomes: "[object Function]1" -> CORRUPT DATA!
  frequency[w] = (frequency[w] || 0) + 1;
}
console.log(frequency['toString']); // Output: "[Function: toString]1" (Bug!)

// ✅ FIX 1: Using Map (Guaranteed clean state, arbitrary keys)
const safeMap = new Map();
for (const w of words) {
  safeMap.set(w, (safeMap.get(w) || 0) + 1);
}
console.log(safeMap.get('toString')); // Output: 1 (Correct!)

// ✅ FIX 2: Using Object.create(null) (No prototype chain)
const nullProtoObj = Object.create(null);
for (const w of words) {
  nullProtoObj[w] = (nullProtoObj[w] || 0) + 1;
}
console.log(nullProtoObj['toString']); // Output: 1 (Correct!)
```

#### The Key Coercion Trap in Plain Objects
Plain objects coerce all non-string keys into strings:
```javascript
// Node.js code
const obj = {};
const keyA = { id: 1 };
const keyB = { id: 2 };

obj[keyA] = 'Data A';
// keyA is converted to "[object Object]"
obj[keyB] = 'Data B';
// keyB is ALSO converted to "[object Object]" -> OVERWRITES Data A!

console.log(obj[keyA]); // Output: "Data B" ❌ (Silent Data Loss!)

// In Map: Keys are compared by identity, preserving independent entries
const safeKeyMap = new Map();
safeKeyMap.set(keyA, 'Data A');
safeKeyMap.set(keyB, 'Data B');
console.log(safeKeyMap.get(keyA)); // Output: "Data A" ✅
```

| Feature | Plain Object `{}` | ES2015 `Map` |
|---|---|---|
| **Key Types** | Strings and Symbols only | **Any value** (Numbers, Objects, Functions, Primitives) |
| **Prototype Poisoning** | Susceptible (`toString`, `constructor`) | **Immune** (Contains no default keys) |
| **Size Computation** | $O(n)$ via `Object.keys(obj).length` | **$O(1)$** via `map.size` |
| **Iteration Order** | Integer keys sorted first, then string keys | **Strict insertion order** always |
| **Garbage Collection** | Strong reference to keys/values | Strong reference (use `WeakMap` for weak references) |
| **JSON Serialization** | Direct via `JSON.stringify(obj)` | Requires custom array serialization |

---

### 3. Sets — Unique Value Collections

A `Set` is an ordered collection of unique values where duplicate insertions are silently ignored.

```javascript
// Node.js code
const set = new Set();
set.add(10);
set.add(20);
set.add(10); // Duplicate: ignored

console.log(set.size);      // 2
console.log(set.has(20));    // true (O(1) average lookup)
console.log(set.delete(10)); // true (O(1) deletion)
```

#### The Reference Equality Trap in Sets and Maps
JavaScript evaluates equality between objects and arrays by **memory reference address**, never by structural content:

```javascript
// Node.js code
const visitedCoordinates = new Set();

const coord1 = [10, 20];
const coord2 = [10, 20]; // Identical values, distinct memory address!

visitedCoordinates.add(coord1);
visitedCoordinates.add(coord2);

console.log(visitedCoordinates.size); // Output: 2 ❌ (Both stored!)
console.log(visitedCoordinates.has([10, 20])); // Output: false ❌ (New array instance!)

// ✅ PATTERN: Serialize objects to composite strings for Set uniqueness
const serializedSet = new Set();
const serializeCoord = (x, y) => `${x},${y}`;

serializedSet.add(serializeCoord(10, 20));
serializedSet.add(serializeCoord(10, 20));

console.log(serializedSet.size); // Output: 1 ✅
console.log(serializedSet.has(serializeCoord(10, 20))); // Output: true ✅
```

---

## Detailed Explanations and Traces

### The Two Sum Pattern: Brute Force vs Hash Complement

Given an array of integers `nums` and an integer `target`, return indices of the two numbers that add up to `target`. Assume exactly one solution exists.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          TWO SUM COMPLEMENT HASH LOOKUP TRACE                               │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Input: nums = [2, 11, 7, 15],  target = 9
  Complement Formula: complement = target - nums[i]

  Step 1 (i = 0): num = 2
  • Complement needed: 9 - 2 = 7
  • Is 7 in Map? NO.
  • Store in Map: Map { 2 => 0 }

  Step 2 (i = 1): num = 11
  • Complement needed: 9 - 11 = -2
  • Is -2 in Map? NO.
  • Store in Map: Map { 2 => 0, 11 => 1 }

  Step 3 (i = 2): num = 7
  • Complement needed: 9 - 7 = 2
  • Is 2 in Map? YES! Index = 0.
  • MATCH FOUND! Return [0, 2] in O(n) single pass!
```

```javascript
// Node.js code
// Time Complexity: O(n) | Auxiliary Space: O(n)
export function twoSum(nums, target) {
  const complementMap = new Map(); // Stores: value => index

  for (let i = 0; i < nums.length; i++) {
    const current = nums[i];
    const complement = target - current;

    // O(1) average lookup
    if (complementMap.has(complement)) {
      return [complementMap.get(complement), i];
    }

    complementMap.set(current, i);
  }

  return [];
}
```

---

## Tricky Points & Edge Cases

### 1. Modifying Arrays While Iterating
Mutating an array (`splice`, `shift`, `pop`) inside a forward `for` loop changes the indices of subsequent elements, leading to skipped items:
```javascript
// Node.js code
// ❌ WRONG: Removing items alters iteration index
const nums = [1, 2, 2, 3];
for (let i = 0; i < nums.length; i++) {
  if (nums[i] === 2) {
    nums.splice(i, 1); // Mutates array! nums becomes [1, 2, 3], but i advances to 2!
    // The second 2 is skipped completely!
  }
}
console.log(nums); // Output: [1, 2, 3] (Bug!)

// ✅ CORRECT: Iterate backwards or use Array.prototype.filter()
const filtered = nums.filter(x => x !== 2); // [1, 3]
```

### 2. Iterating Maps and Sets
In JavaScript, `Map.prototype.forEach` and `for...of` iterate in **exact insertion order**. However, plain `{}` objects iterate non-negative integer keys in numerical sorted order first, followed by string keys in insertion order. When interviewers ask for strict FIFO key iteration, always use `Map`.

---

## Hands-On Exercise: Implementing an LRU Cache Eviction Simulator

### Scenario

You are implementing a memory-efficient cache eviction mechanism for a high-traffic microservice.
The initial implementation uses an array, causing $O(n)$ search and eviction overhead that degrades API throughput.

### Buggy Code

```javascript
// Node.js code
// ❌ Inefficient O(n) implementation with memory leaks
export class BuggyCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.items = []; // Array of { key, value }
  }

  get(key) {
    // BUG 1: O(n) linear search
    const index = this.items.findIndex(item => item.key === key);
    if (index === -1) return null;
    const item = this.items[index];
    // BUG 2: O(n) splice and push
    this.items.splice(index, 1);
    this.items.push(item);
    return item.value;
  }

  put(key, value) {
    const index = this.items.findIndex(item => item.key === key);
    if (index !== -1) {
      this.items.splice(index, 1);
    } else if (this.items.length >= this.capacity) {
      // BUG 3: O(n) shift operation
      this.items.shift();
    }
    this.items.push({ key, value });
  }
}
```

### Acceptance Criteria

1. Implement `OptimizedLRUCache` providing **$O(1)$ average time** for both `get(key)` and `put(key, value)`.
2. Exploit JavaScript's native `Map` insertion-order iteration property to move accessed items to the tail.
3. Automatically evict the least recently used (oldest) key when capacity is exceeded.
4. Verify using native assertions.

### Solution Code

```javascript
// Node.js code
import assert from 'node:assert/strict';

/**
 * High-Performance O(1) LRU Cache exploiting Map insertion-order mechanics
 */
export class OptimizedLRUCache {
  /**
   * @param {number} capacity
   */
  constructor(capacity) {
    if (capacity <= 0) throw new Error('Capacity must be positive');
    this.capacity = capacity;
    this.cache = new Map();
  }

  /**
   * Retrieves value and marks key as most recently used
   * @param {*} key
   * @returns {*}
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    // Refresh key to the tail (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * Inserts or updates key, evicting oldest item if capacity is exceeded
   * @param {*} key
   * @param {*} value
   */
  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Evict least recently used (first key in insertion order)
      // Map.prototype.keys().next().value is O(1)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, value);
  }
}

// Verification Tests
const lru = new OptimizedLRUCache(2);
lru.put('a', 1);
lru.put('b', 2);
assert.equal(lru.get('a'), 1); // Access 'a' -> 'b' is now least recently used

lru.put('c', 3); // Capacity exceeded: 'b' should be evicted!
assert.equal(lru.get('b'), null); // 'b' was evicted
assert.equal(lru.get('a'), 1);    // 'a' remains
assert.equal(lru.get('c'), 3);    // 'c' remains

console.log('✅ LRU Cache tests passed with O(1) performance.');
```

### Solution Explanation

1. **Map Insertion-Order Exploitation:** In JavaScript, a `Map` iterates keys in the exact order they were inserted. Deleting a key and immediately setting it again (`this.cache.delete(key); this.cache.set(key, val);`) moves that key to the very end (tail) of the Map in $O(1)$ time.
2. **Instant $O(1)$ Eviction:** Calling `this.cache.keys().next().value` retrieves the oldest key (the head of the Map) in $O(1)$ time without scanning or shifting an array.

---

## Summary

- **Arrays** offer $O(1)$ index access and $O(1)$ tail operations (`push`/`pop`), but head operations (`shift`/`unshift`) are $O(n)$ memory shifts.
- **Plain Objects (`{}`)** coerce keys to strings and suffer from prototype inheritance collisions (`toString`); use `Map` or `Object.create(null)` for dynamic data dictionaries.
- **ES2015 Maps** support arbitrary key types, protect against prototype pollution, preserve strict insertion order, and provide $O(1)$ `.size`.
- **Sets** store unique values in $O(1)$ time, but compare non-primitives by reference address, requiring serialization for object uniqueness.
- The **Two Sum Hash Complement** pattern reduces $O(n^2)$ nested pair scans to a single $O(n)$ pass.

---

## Cheat Sheet

| Data Structure | Best Used For | Fast Operations ($O(1)$) | Slow Operations ($O(n)$) | Critical Trap |
|---|---|---|---|---|
| **Array** | Ordered lists, numeric index lookups | `arr[i]`, `push()`, `pop()` | `shift()`, `unshift()`, `indexOf()` | `shift()` in loops causes $O(n^2)$ event-loop freezes |
| **Object (`{}`)** | Static JSON payloads, known fixed keys | Property access (`obj.key`) | `Object.keys()`, `delete obj.key` | Inherits `Object.prototype.toString` |
| **Map** | Dynamic key-value lookups, non-string keys | `get()`, `set()`, `has()`, `delete()`, `size` | Iterating all entries ($O(n)$) | Not directly serializable to JSON |
| **Set** | Deduplication, fast membership checks | `add()`, `has()`, `delete()`, `size` | Iterating all elements ($O(n)$) | `set.has([1, 2])` checks pointer, not value |

---

## Interview Questions

### 1. What are the key differences between a plain JavaScript object and an ES2015 `Map`, and when should each be used?

**Question:** Compare plain JavaScript objects (`{}`) with ES2015 `Map` instances across key typing, prototype safety, size complexity, and performance.

**Answer:** 
1. **Key Types:** Plain objects restrict keys strictly to Strings and Symbols; any other type (numbers, objects, booleans) is implicitly coerced to a string (`{ [1]: 'val' }` stores `"1"`). A `Map` accepts any value as a key, including numbers, functions, and object references without coercion.
2. **Prototype Safety:** Plain objects inherit built-in properties from `Object.prototype` (`toString`, `valueOf`, `constructor`). If user-controlled data matches these names, it causes silent bugs or prototype pollution. A `Map` contains zero default keys.
3. **Size Complexity:** Obtaining the number of entries in a plain object requires `Object.keys(obj).length`, which executes in $O(n)$ time. A `Map` exposes `.size` in $O(1)$ constant time.
4. **Key Order:** A plain object iterates non-negative integer keys in ascending numerical order first, followed by strings in insertion order. A `Map` guarantees strict insertion order across all keys.
- **Usage Recommendation:** Use plain objects for static configuration, DTOs, and JSON payloads. Use `Map` for dynamic dictionaries, frequency counters, caches, and when keys are added/removed frequently.

---

### 2. What is the Reference Equality trap in JavaScript Sets and Maps, and how do you resolve it when storing composite data like coordinates?

**Question:** Why does `new Set([[1, 2]]).has([1, 2])` return `false`, and how do you store unique 2D coordinates in a `Set`?

**Answer:** JavaScript evaluates non-primitive types (objects, arrays, functions) by **reference equality** (memory address identity), not by structural content. When you write:
```javascript
const set = new Set();
set.add([1, 2]);
set.has([1, 2]); // returns false!
```
The array literal `[1, 2]` passed to `set.has()` allocates a brand-new array instance at a distinct memory address from the array instance passed to `set.add()`. Because the memory pointers differ, the `Set` does not match them.

**Resolution:** Convert the composite data into a canonical primitive string representation before storing:
```javascript
// Node.js code
const set = new Set();
const serialize = (x, y) => `${x},${y}`;

set.add(serialize(1, 2));
console.log(set.has(serialize(1, 2))); // true!
```
Alternatively, for complex objects, sort object keys and serialize via `JSON.stringify()`, or use an in-memory Trie/spatial map structure.

---

### 3. Why is using `Array.prototype.shift()` inside a loop an anti-pattern in Node.js, and how does it degrade server throughput?

**Question:** What is the asymptotic time complexity of building a queue using `arr.push()` and `arr.shift()`, and how does it affect the Node.js event loop?

**Answer:** A JavaScript array is allocated as a contiguous block of memory. While `arr.push()` appends an item to the end in $O(1)$ amortized time, `arr.shift()` removes the element at index 0. To maintain zero-based contiguous indexing, the JavaScript engine must copy and shift every remaining element in the array one index position to the left. Therefore, `arr.shift()` is an **$O(n)$ linear operation**.

If an application dequeues $n$ tasks using `while (queue.length) queue.shift()`, each dequeue takes $O(n)$ time, resulting in **$O(n^2)$ total operations**. For a batch of 50,000 tasks, this triggers over 1.25 billion memory copies. Because Node.js runs JavaScript on a single thread, this synchronous CPU loop completely freezes the libuv event loop for seconds, blocking concurrent HTTP request handling and triggering health check failures.

**Fix:** Maintain an index pointer (`head = 0; queue[head++]`) to achieve true $O(1)$ dequeues, or use a proper Doubly Linked List queue structure.

---

### 4. Given an array of integers, how do you find two numbers that sum to a target value in a single $O(n)$ pass, and what are the trade-offs compared to the two-pointer approach?

**Question:** Explain the single-pass Hash Complement approach for Two Sum and compare its time and space trade-offs against the sorted Two-Pointer technique.

**Answer:** The **Hash Complement approach** uses a `Map` (or `Set`) to store elements as they are visited. On each iteration $i$, it computes the required complement: $\text{complement} = \text{target} - \text{nums}[i]$.
1. Check if `complement` exists in the `Map` ($O(1)$ average time).
2. If yes, the pair is found and their indices are returned immediately.
3. If no, store `nums[i] => i` in the `Map` and proceed.
- **Complexity:** $O(n)$ time, $O(n)$ auxiliary space.

**Trade-off Comparison:**
- **Hash Complement:** Runs in $O(n)$ time on unsorted arrays, but consumes $O(n)$ auxiliary memory to store the hash map.
- **Two-Pointer Approach:** Requires the array to be sorted first. Sorting takes $O(n \log n)$ time, followed by an $O(n)$ two-pointer inward scan (`left` and `right`).
  - *Advantage:* If the input array is already sorted, the two-pointer approach runs in $O(n)$ time with **$O(1)$ auxiliary space**, saving memory. If modifying or sorting the original array is prohibited, preserving original indices requires creating an index-tuple array, eliminating the space advantage.

---

<nav aria-label="Lecture navigation">

[Previous: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Strings and Text Patterns](day-03-strings-and-text-patterns.md)

</nav>
