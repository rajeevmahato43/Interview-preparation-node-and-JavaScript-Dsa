# Day 02: Arrays, Objects, Sets, and Maps

<nav aria-label="Lecture navigation">

[Previous: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Strings and Text Patterns](day-03-strings-and-text-patterns.md)

</nav>

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Complexity classes ($O(1)$, $O(n)$, $O(n^2)$) and auxiliary space.
- Basic familiarity with JavaScript objects, arrays, and ES2015 `Map` and `Set` collections.

---

## 1. Arrays and Memory Layout in V8

A JavaScript Array is an ordered list where each element has a numeric index starting at 0.

> **Contiguous Memory**: Memory allocated in one continuous, unbroken block. This lets the engine look up any index `arr[i]` instantly in $O(1)$ time by jumping straight to $\text{BaseAddress} + i \times \text{ElementSize}$.

In the V8 engine (Node.js and Chrome), arrays are optimized into different internal types depending on what values they hold:

> **Packed vs Holey Arrays**: A **packed** array has items at every single index (`[1, 2, 3]`). A **holey** array has empty gaps (like `const a = []; a[100] = 5;`). Reading a missing index in a holey array forces V8 to look through the prototype chain to check if `Object.prototype` defined it, making reads up to 10x slower!

### Core Array Operations and Complexities

| Operation | Method / Syntax | Time Complexity | Why it Takes this Time |
|---|---|---|---|
| **Read by Index** | `arr[i]` | **$O(1)$** | Direct memory offset calculation |
| **Append (End)** | `arr.push(val)` | **$O(1)$ amortized** | Writes to the next pre-allocated buffer slot |
| **Remove (End)** | `arr.pop()` | **$O(1)$** | Decreases array length by 1 |
| **Prepend (Start)** | `arr.unshift(val)` | **$O(n)$** | Every element in memory must shift 1 index to the right |
| **Remove (Start)** | `arr.shift()` | **$O(n)$** | Every remaining element must shift 1 index to the left |
| **Find Value** | `arr.indexOf(val)` | **$O(n)$** | Scans items sequentially from index 0 |

```javascript
// Node.js code
// ❌ ANTI-PATTERN: Using arr.shift() inside a loop creates an O(n^2) bottleneck!
function processQueueSlow(tasks) {
  const results = [];
  while (tasks.length > 0) {
    // shift() forces all remaining n elements to slide over 1 slot in memory!
    // For 50,000 tasks: ~1.25 billion memory copy operations!
    const task = tasks.shift();
    results.push(task * 2);
  }
  return results;
}

// ✅ PATTERN: Use a head pointer to achieve O(n) total time
function processQueueFast(tasks) {
  const results = [];
  let head = 0; // Simple index tracker (O(1) per step)
  while (head < tasks.length) {
    const task = tasks[head++];
    results.push(task * 2);
  }
  return results;
}
```

---

## 2. Plain Objects vs ES2015 Maps

A plain object (`{}`) is a record used to store key-value pairs where keys are strings or Symbols. A `Map` is a specialized hash map data structure designed for dynamic key-value storage.

> **Prototype Collision Trap**: Plain objects inherit built-in methods (like `toString` and `valueOf`) from `Object.prototype`. If you store user data with a key called `"toString"`, it collides with the built-in function, creating bugs!

```javascript
// Node.js code
// ❌ TRAP: Prototype collision with plain objects
const wordCounts = {};
const words = ['apple', 'banana', 'toString', 'apple'];

for (const w of words) {
  // wordCounts['toString'] initially points to function Object.prototype.toString!
  // (function || 0) evaluates to the function itself, corrupting numbers!
  wordCounts[w] = (wordCounts[w] || 0) + 1;
}
console.log(wordCounts['toString']); // "[Function: toString]1" (Corrupted data!)

// ✅ FIX 1: Use Map (completely free of default prototype keys)
const safeMap = new Map();
for (const w of words) {
  safeMap.set(w, (safeMap.get(w) || 0) + 1);
}
console.log(safeMap.get('toString')); // 1 (Accurate!)

// ✅ FIX 2: Use Object.create(null) (pure dictionary with no prototype)
const cleanDict = Object.create(null);
for (const w of words) {
  cleanDict[w] = (cleanDict[w] || 0) + 1;
}
console.log(cleanDict['toString']); // 1 (Accurate!)
```

### The Key Coercion Trap in Plain Objects

Plain objects always convert non-string keys into strings:

```javascript
// Node.js code
const obj = {};
const userA = { id: 1 };
const userB = { id: 2 };

// ❌ Both keys get coerced into "[object Object]"!
obj[userA] = 'Admin Profile';
obj[userB] = 'Guest Profile'; // Overwrites userA silently!

console.log(obj[userA]); // "Guest Profile" (Data loss!)

// ✅ In Map: Keys are preserved by identity (distinct memory references)
const userMap = new Map();
userMap.set(userA, 'Admin Profile');
userMap.set(userB, 'Guest Profile');

console.log(userMap.get(userA)); // "Admin Profile" (Safe!)
```

### Direct Comparison: Object vs Map

| Feature | Plain Object `{}` | ES2015 `Map` |
|---|---|---|
| **Allowed Keys** | Strings and Symbols only | **Any data type** (Numbers, Objects, Functions) |
| **Prototype Safety** | Can collide with `Object.prototype` | **Immune** (Contains zero default keys) |
| **Size Lookup** | $O(n)$ using `Object.keys(obj).length` | **$O(1)$** using `map.size` |
| **Key Order** | Numbers sorted first, then insertion order | **Strict insertion order** always |
| **Frequent Add/Delete** | Slower (engine shape transitions) | **Optimized** for frequent insertions and deletions |

---

## 3. Sets for Fast Unique Values

A `Set` is an ordered collection that stores **only unique values**. Inserting a duplicate value is ignored.

> **Set Lookup Speed**: `set.has(val)`, `set.add(val)`, and `set.delete(val)` all run in **$O(1)$ average time**.

```javascript
// Node.js code
const tags = new Set();
tags.add('nodejs');
tags.add('backend');
tags.add('nodejs'); // Duplicate ignored!

console.log(tags.size);        // 2
console.log(tags.has('nodejs')); // true (Instant O(1) check)
```

### The Reference Equality Trap in Sets and Maps

JavaScript compares non-primitives (objects and arrays) by their **memory address**, not their contents:

> **Reference Equality**: Two objects or arrays are equal (`===`) only if they point to the exact same location in computer memory.

```javascript
// Node.js code
const visitedCoordinates = new Set();

const coordA = [10, 20];
const coordB = [10, 20]; // Same numbers, but different memory address!

visitedCoordinates.add(coordA);
visitedCoordinates.add(coordB);

console.log(visitedCoordinates.size); // 2 (Both stored because memory pointers differ!)
console.log(visitedCoordinates.has([10, 20])); // false! (Fresh array created at new memory address)

// ✅ SOLUTION: Convert complex items into unique primitive strings
const safeCoords = new Set();
const serialize = (x, y) => `${x},${y}`;

safeCoords.add(serialize(10, 20));
safeCoords.add(serialize(10, 20));

console.log(safeCoords.size); // 1 (Properly deduplicated!)
console.log(safeCoords.has(serialize(10, 20))); // true!
```

---

## 4. The Two Sum Pattern with Hash Complements

Given an array of numbers `nums` and a `target`, return the indices of the two numbers that add up to `target`.

### The Core Idea:
Instead of checking every pair with nested loops ($O(n^2)$), compute what number you need:
$$\text{complement} = \text{target} - \text{current}$$
If that complement is already in your `Map`, you found the answer in a single pass ($O(n)$)!

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          TWO SUM COMPLEMENT HASH LOOKUP TRACE                               │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Input: nums = [2, 11, 7, 15],  target = 9
  Formula: complement = target - nums[i]

  Step 1 (i = 0): num = 2
  • Needed: 9 - 2 = 7
  • Is 7 in Map? NO.
  • Store in Map: Map { 2 => 0 }

  Step 2 (i = 1): num = 11
  • Needed: 9 - 11 = -2
  • Is -2 in Map? NO.
  • Store in Map: Map { 2 => 0, 11 => 1 }

  Step 3 (i = 2): num = 7
  • Needed: 9 - 7 = 2
  • Is 2 in Map? YES! Index = 0.
  • MATCH FOUND! Return [0, 2] in a single O(n) pass!
```

```javascript
// Node.js code
// Time Complexity: O(n) | Auxiliary Space: O(n)
export function twoSum(nums, target) {
  const complementMap = new Map(); // Stores: number => index

  for (let i = 0; i < nums.length; i++) {
    const current = nums[i];
    const complement = target - current;

    // O(1) average lookup in hash map
    if (complementMap.has(complement)) {
      return [complementMap.get(complement), i];
    }

    complementMap.set(current, i);
  }

  return [];
}
```

---

## Common Mistakes and Interview Traps

### 1. Modifying Arrays While Iterating
Mutating an array (`splice`, `shift`, `pop`) inside a forward `for` loop shifts the remaining elements, causing you to accidentally skip items:
```javascript
// Node.js code
// ❌ WRONG: Removing items alters the index of remaining items
const nums = [1, 2, 2, 3];
for (let i = 0; i < nums.length; i++) {
  if (nums[i] === 2) {
    nums.splice(i, 1); // nums becomes [1, 2, 3], but i advances to 2!
    // The second 2 is skipped completely!
  }
}
console.log(nums); // [1, 2, 3] (Bug!)

// ✅ CORRECT: Use Array.prototype.filter() or iterate backwards
const cleanNums = nums.filter(x => x !== 2); // [1, 3]
```

### 2. Using `Object.keys().length` for Size in a Loop
Checking an object's size with `Object.keys(obj).length` runs in **$O(n)$ time** because it allocates an array of all keys. If you call this inside a loop, your code silently degrades to $O(n^2)$. Use `Map.prototype.size`, which is always **$O(1)$**.

---

## Tricky Points and Edge Cases

### 1. Key Iteration Order Differences
- **`Map`**: Guarantees strict **insertion order** for all keys.
- **Plain Object `{}`**: Automatically sorts non-negative integer keys in ascending numerical order first, followed by string keys in insertion order. When you need a predictable FIFO order, always use `Map`.

### 2. Amortized Append vs Constant Push
- When you `push()` to an array, it writes to the end in $O(1)$ time.
- When the allocated memory chunk fills up, V8 doubles the buffer size and copies all $n$ items over ($O(n)$ work).
- Because this copy happens rarely, the average cost over many pushes remains $O(1)$ (amortized). However, `unshift()` and `shift()` always force an $O(n)$ memory copy on **every single call**.

### 3. Storing Objects as Keys in Sets
In a `Set`, two objects with identical values are treated as different items unless they point to the exact same memory reference:
```javascript
// Node.js code
const s = new Set();
s.add({ a: 1 });
s.add({ a: 1 });
console.log(s.size); // 2!
```

---

## Hands-On Exercise: Implementing an LRU Cache

### Scenario
You are designing an in-memory cache for a high-traffic Node.js API. The cache has a fixed capacity. When full, it must evict the **Least Recently Used (LRU)** item. Both `get(key)` and `put(key, value)` must run in **$O(1)$ average time**.

### Buggy Code
```javascript
// Node.js code
// ❌ Buggy: Array-based implementation with slow O(n) searches and shifts
export class BuggyCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.items = []; // Array of { key, value }
  }

  get(key) {
    // BUG 1: O(n) search
    const index = this.items.findIndex(item => item.key === key);
    if (index === -1) return null;
    const item = this.items[index];
    // BUG 2: O(n) splice
    this.items.splice(index, 1);
    this.items.push(item);
    return item.value;
  }

  put(key, value) {
    const index = this.items.findIndex(item => item.key === key);
    if (index !== -1) {
      this.items.splice(index, 1);
    } else if (this.items.length >= this.capacity) {
      // BUG 3: O(n) shift
      this.items.shift();
    }
    this.items.push({ key, value });
  }
}
```

### Acceptance Criteria
1. Implement `OptimizedLRUCache` providing **$O(1)$ time** for both `get` and `put`.
2. Use JavaScript's native `Map` insertion-order feature to move accessed keys to the end.
3. Automatically delete the oldest key when capacity is exceeded.
4. Verify using Node.js assertions.

### Solution Code
```javascript
// Node.js code
import assert from 'node:assert/strict';

/**
 * High-Performance O(1) LRU Cache using Map insertion-order mechanics
 */
export class OptimizedLRUCache {
  constructor(capacity) {
    if (capacity <= 0) throw new Error('Capacity must be positive');
    this.capacity = capacity;
    this.cache = new Map();
  }

  /**
   * Retrieves value and marks key as most recently used
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
   * Inserts or updates key, evicting the oldest item if capacity is exceeded
   */
  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Map.prototype.keys().next().value retrieves the oldest key in O(1) time
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
assert.equal(lru.get('a'), 1); // Access 'a' -> 'b' is now oldest

lru.put('c', 3); // Capacity exceeded: 'b' should be evicted!
assert.equal(lru.get('b'), null); // 'b' was evicted
assert.equal(lru.get('a'), 1);    // 'a' remains
assert.equal(lru.get('c'), 3);    // 'c' remains

console.log('✅ LRU Cache tests passed with O(1) performance.');
```

---

## Summary

- **Arrays**: Provide instant $O(1)$ index access and $O(1)$ tail appends (`push`/`pop`). However, head operations (`shift`/`unshift`) are $O(n)$ memory copies that can freeze the Node.js event loop when used in loops.
- **V8 Elements**: Packed arrays (no gaps) are up to 10x faster than holey arrays (empty slots), which force prototype chain lookups.
- **Plain Objects (`{}`)**: Coerce all keys to strings and are susceptible to prototype collisions (`toString`). Best used for static configurations and JSON payloads.
- **ES2015 Maps**: Support any key type without coercion, protect against prototype collisions, preserve strict insertion order, and provide $O(1)$ `.size`.
- **Sets**: Provide $O(1)$ deduplication and membership checks (`has()`), but compare objects by memory reference rather than structural contents.
- **Two Sum Complement Pattern**: Reduces an $O(n^2)$ pair search down to a single $O(n)$ pass by checking if $\text{target} - \text{current}$ exists in a `Map`.
- **LRU Cache with `Map`**: Deleting and re-setting a key moves it to the end in $O(1)$ time; `map.keys().next().value` retrieves the oldest key in $O(1)$ time.

---

## Cheat Sheet

| Data Structure | Best Used For | Fast Operations ($O(1)$) | Slow Operations ($O(n)$) | Critical Trap |
|---|---|---|---|---|
| **Array** | Ordered lists, numeric index lookups | `arr[i]`, `push()`, `pop()` | `shift()`, `unshift()`, `indexOf()` | `shift()` in loops causes $O(n^2)$ event-loop freezes |
| **Object (`{}`)** | Static JSON payloads, known fixed keys | Property access (`obj.key`) | `Object.keys()`, `delete obj.key` | Inherits `Object.prototype.toString` |
| **Map** | Dynamic key-value lookups, non-string keys | `get()`, `set()`, `has()`, `delete()`, `size` | Iterating all entries ($O(n)$) | Not directly serializable to JSON |
| **Set** | Fast uniqueness checks, deduplication | `add()`, `has()`, `delete()`, `size` | Iterating all elements ($O(n)$) | `set.has([1, 2])` checks memory pointer, not value |

### Common Pitfalls
- [ ] Using `arr.shift()` to implement a queue instead of a head pointer or linked list.
- [ ] Using a plain `{}` object as a counter dictionary with user input keys (`toString` bug).
- [ ] Expecting `set.has({ id: 1 })` to find an object created separately in memory.
- [ ] Mutating an array with `splice()` while iterating over it in a forward `for` loop.

---

## Interview Questions

### 1. What are the key differences between a plain JavaScript object and an ES2015 `Map`, and when should each be used?

**Question:** Compare plain JavaScript objects (`{}`) with ES2015 `Map` instances across key typing, prototype safety, size complexity, and performance.

**Answer:** 
1. **Key Types:** Plain objects restrict keys strictly to Strings and Symbols; any other type is converted to a string (`{ [1]: 'val' }` stores `"1"`). A `Map` accepts any value as a key, including numbers, functions, and objects without coercion.
2. **Prototype Safety:** Plain objects inherit built-in properties from `Object.prototype` (`toString`, `valueOf`, `constructor`). If user-controlled data matches these names, it causes silent bugs or prototype pollution. A `Map` contains zero default keys.
3. **Size Complexity:** Finding the size of a plain object requires `Object.keys(obj).length`, which takes $O(n)$ time. A `Map` provides `.size` in $O(1)$ constant time.
4. **Key Order:** A plain object iterates non-negative integer keys in numerical order first, followed by strings in insertion order. A `Map` guarantees strict insertion order across all keys.

*Recommendation:* Use plain objects for static configurations, DTOs, and JSON data. Use `Map` for dynamic dictionaries, frequency counters, caches, and frequently modified collections.

---

### 2. What is the Reference Equality trap in JavaScript Sets and Maps, and how do you resolve it when storing composite data like coordinates?

**Question:** Why does `new Set([[1, 2]]).has([1, 2])` return `false`, and how do you store unique 2D coordinates in a `Set`?

**Answer:** JavaScript evaluates objects and arrays by **memory reference address**, not by value. When you write:
```javascript
const set = new Set();
set.add([1, 2]);
set.has([1, 2]); // returns false!
```
The array literal `[1, 2]` passed to `set.has()` creates a brand new array instance at a different memory address from the array passed to `set.add()`. Because the memory pointers are different, the `Set` does not consider them equal.

**Resolution:** Convert composite data into a primitive string before storing:
```javascript
// Node.js code
const set = new Set();
const serialize = (x, y) => `${x},${y}`;

set.add(serialize(1, 2));
console.log(set.has(serialize(1, 2))); // true!
```

---

### 3. Why is using `Array.prototype.shift()` inside a loop an anti-pattern in Node.js, and how does it degrade server throughput?

**Question:** What is the asymptotic time complexity of building a queue using `arr.push()` and `arr.shift()`, and how does it affect the Node.js event loop?

**Answer:** A JavaScript array is stored in contiguous memory. While `arr.push()` adds an item to the end in $O(1)$ amortized time, `arr.shift()` removes the element at index 0. To maintain zero-based indexing, the JavaScript engine must copy and shift every remaining element one position to the left. Therefore, `arr.shift()` is an **$O(n)$ linear operation**.

If an application dequeues $n$ tasks using `while (queue.length) queue.shift()`, each dequeue takes $O(n)$ time, resulting in **$O(n^2)$ total operations**. For a batch of 50,000 tasks, this triggers over 1.25 billion memory copy operations. Because Node.js runs JavaScript on a single thread, this synchronous CPU loop freezes the libuv event loop for seconds, blocking concurrent HTTP request handling and triggering `504 Gateway Timeout` errors.

**Fix:** Maintain a head index pointer (`head = 0; queue[head++]`) to achieve true $O(1)$ dequeues, or use a proper Queue data structure.

---

### 4. Given an array of integers, how do you find two numbers that sum to a target value in a single $O(n)$ pass, and what are the trade-offs compared to the two-pointer approach?

**Question:** Explain the single-pass Hash Complement approach for Two Sum and compare its time and space trade-offs against the sorted Two-Pointer technique.

**Answer:** The **Hash Complement approach** uses a `Map` (or `Set`) to store numbers as they are visited. On each iteration $i$, it computes the required complement: $\text{complement} = \text{target} - \text{nums}[i]$.
1. Check if `complement` exists in the `Map` ($O(1)$ average time).
2. If yes, return the pair of indices immediately.
3. If no, store `nums[i] => i` in the `Map` and continue.
- **Complexity:** $O(n)$ time, $O(n)$ auxiliary space.

**Trade-off Comparison:**
- **Hash Complement:** Runs in $O(n)$ time on unsorted arrays, but requires $O(n)$ auxiliary memory to store the hash map.
- **Two-Pointer Approach:** Requires the array to be sorted first ($O(n \log n)$ time), followed by an $O(n)$ inward scan. If the input array is already sorted, it runs in $O(n)$ time with **$O(1)$ auxiliary space**, saving memory.

---

<nav aria-label="Lecture navigation">

[Previous: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Strings and Text Patterns](day-03-strings-and-text-patterns.md)

</nav>
