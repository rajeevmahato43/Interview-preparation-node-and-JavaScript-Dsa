# Day 04: Objects, Maps, Sets & Hash Tables

<nav aria-label="Lecture navigation">

[Previous: Searching & Elementary Sorting](day-03-searching-and-sorting-algorithms.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Hash Patterns: Frequency & Duplicates](day-05-hash-patterns-frequency-counting-and-duplicates.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Asymptotic complexity ($O(1)$ amortized vs $O(n)$ worst case).
- [Day 02: Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md) — Contiguous memory indexing and element access.
- Basic JavaScript syntax: variables, functions, loops, and object literals.

---

## 1. What is a Hash Table, Map, and Set?

A **Hash Table** (or Hash Map) is a data structure that maps arbitrary **keys** to **values**. It provides **$O(1)$ average time complexity** for insertion, lookup, and deletion.

> **Hash Table**: A data structure that stores key-value pairs by using a mathematical hash function to map keys to integer indices in an underlying bucket array.

> **Hash Function**: A deterministic algorithm that converts an arbitrary key (string, number, object) into a numeric integer hash code.

> **Hash Collision**: An event occurring when two distinct keys produce the exact same array bucket index.

> **Load Factor ($\alpha$)**: The ratio of stored entries $n$ to total bucket capacity $k$ ($\alpha = n / k$), used to decide when to resize the bucket array.

### Everyday Physical Analogies

#### The Coat Check Room
Imagine checking your winter jacket at a theater:
1. You hand the clerk your coat.
2. The clerk hands you a ticket with a stamped number (the **Hash Code**).
3. The clerk places your coat directly onto the hook matching that exact number (the **Bucket**).
4. When leaving, you present the ticket. The clerk walks directly to that hook and retrieves your coat in $O(1)$ instant time, regardless of whether 10 people or 10,000 people attended the show.

#### Plain Objects vs Map vs Set vs WeakMap
- **Plain Object (`{}`)**: A paper address book with pre-printed section letters. Works fine for simple records, but coerces all names to strings and contains default pre-printed legal text on every page (**prototype inheritance**).
- **ES6 `Map`**: A purpose-built, high-speed electronic filing cabinet. Accepts any item as a label (objects, numbers, functions), maintains insertion order, and tracks item count in $O(1)$.
- **ES6 `Set`**: A guest list with a strict "no duplicate names" rule. If someone is already on the list, adding them again does nothing.
- **`WeakMap`**: A temporary badge registry where badges automatically dissolve the moment the visitor leaves the building, preventing memory leaks.

```text
┌────────────────┐     ┌───────────────┐     ┌──────────────────────┐     ┌────────────────────────┐
│  Key: "apple"  │ ──► │ Hash Function │ ──► │ Hash Code: 93029210  │ ──► │ Index = Hash % Capacity│ ──► Bucket [3]
└────────────────┘     └───────────────┘     └──────────────────────┘     └────────────────────────┘
```

---

## 2. How Hash Tables, Maps & Sets Work Step-by-Step

### 1. Hash Table Mechanics: From Key to Bucket

A Hash Table operates across four steps:
1. **Key Input**: An identifier such as `"username"` or `1042`.
2. **Hash Function Computation**: Converts key into an integer hash code deterministically.
3. **Index Compression**: Maps large hash code to valid bucket index: $\text{Index} = |\text{HashCode}| \pmod{\text{Capacity}}$.
4. **Bucket Storage**: Key and value are stored in that array slot.

```text
Underlying Bucket Array (Capacity = 8):
Index:     0        1        2        3              4        5        6        7
Slots:  [ null |  null  |  null  | ["apple", $1.50] |  null  |  null  |  null  | ["banana", $0.75] ]
                                         ▲                                             ▲
"apple" hashes to index 3 ───────────────┘                                             │
"banana" hashes to index 7 ────────────────────────────────────────────────────────────┘
```

### 2. Collision Resolution Strategies

Because possible keys are infinite and array buckets are finite, collisions are mathematically guaranteed (**Pigeonhole Principle**).

```text
Key 1: "apple"  ──► Hash Function ──► Index 3 ──┐
                                                ├──► COLLISION! Both target Index 3.
Key 2: "orange" ──► Hash Function ──► Index 3 ──┘
```

#### Strategy A: Separate Chaining (Standard in JavaScript Engines)
Each bucket stores a reference to a linked list or dynamic array of key-value pairs:
- To insert: Hash key to bucket index, append `[key, value]` to that bucket's chain.
- To lookup: Hash key to bucket index, scan the bucket's short chain comparing keys with `===`.

```text
Index 3: [ "apple", $1.50 ] ──► [ "orange", $2.00 ] ──► null
```

#### Strategy B: Open Addressing (Linear Probing)
All entries are stored directly in the main array. On collision at index $k$, probe $k+1, k+2, \dots$ until an empty slot is found.
- Drawback: Suffers from **clustering**, where occupied slots group together and slow down searches.

### 3. Load Factor and Dynamic Resizing (Rehashing)
When $\alpha = \frac{n}{k} \ge 0.75$ (75% capacity), bucket chains lengthen and lookup slows.
- The Hash Table allocates a new array of **double capacity** ($2k$).
- It rehashes every stored key and re-inserts each pair into the new array.
- Because doubling occurs geometrically, insertion runs in **$O(1)$ amortized time**.

### 4. Plain JavaScript Objects (`{}`)

#### How Plain Objects Work Step-by-Step
A plain JavaScript object `{}` is a hash-like dictionary, but with prototype inheritance attached:
1. When you access `obj[key]`, JavaScript first checks if `key` exists directly on the object.
2. If `key` is absent, the runtime traverses upward along the **prototype chain** (`Object.prototype`) until it hits `null`. This means properties like `"toString"` or `"valueOf"` exist by default even on an empty object `{}`!
3. All non-string keys (numbers, booleans, objects) are automatically coerced to strings via `.toString()`. For example, `{ id: 1 }` becomes `"[object Object]"`, causing different object keys to overwrite each other.

```javascript
const config = { timeout: 0, debug: false };

// ❌ ANTI-PATTERN: Falsy checks fail on 0, false, ""
if (config.timeout) { /* Never runs! 0 is falsy */ }

// ❌ ANTI-PATTERN: 'in' operator checks prototype chain
console.log("toString" in config); // true (Inherited from Object.prototype!)

// ❌ ANTI-PATTERN: Object keys coerce non-strings to strings
const keyA = { id: 1 }, keyB = { id: 2 };
const cache = {};
cache[keyA] = "User A";
cache[keyB] = "User B"; // Overwrites keyA because both coerce to "[object Object]"!
console.log(cache[keyA]); // "User B" (Data corruption!)

// ✅ CORRECT: Object.hasOwn() safely checks direct properties
console.log(Object.hasOwn(config, "timeout"));  // true
console.log(Object.hasOwn(config, "toString")); // false

// ✅ PATTERN: Prototype-free dictionary
const cleanDict = Object.create(null);
console.log("toString" in cleanDict); // false
```

---

### 5. The ES6 `Map` Collection

#### How `Map` Works Step-by-Step
`Map` is JavaScript's dedicated Hash Table implementation designed specifically for key-value lookups:
1. **Arbitrary Keys**: Uses `SameValueZero` equality to store objects, primitives, or functions as distinct keys without string coercion.
2. **Dedicated Internal Table**: Key references are stored directly without any prototype inheritance or risk of prototype pollution.
3. **$O(1)$ Size Tracking**: Maintains an internal counter that increments on `.set()` and decrements on `.delete()`, returning `.size` instantly in $O(1)$ time without scanning.
4. **Guaranteed Order**: Iteration traverses entries strictly in insertion order.

```javascript
const map = new Map();
const userObj = { id: 42 };

map.set(userObj, "Admin");
map.set("status", 200);

console.log(map.get(userObj)); // "Admin" (Retains object reference identity!)
console.log(map.has("status")); // true (O(1))
console.log(map.size);          // 2 (O(1))

// Conversion helpers:
const record = Object.fromEntries(map); // Map to plain object
const restoredMap = new Map(Object.entries(record)); // Plain object to Map
```

---

### 6. The ES6 `Set` Collection

#### How `Set` Works Step-by-Step
`Set` stores unique values of any type by enforcing hash uniqueness:
1. When `set.add(value)` is called, the value is hashed.
2. The runtime checks if the value already exists in the set using `SameValueZero`.
3. If the value is present, `set.add()` exits silently without duplicating the item.
4. If absent, the value is appended to the set's internal storage in $O(1)$ average time.

```javascript
// ✅ PATTERN: O(n) array deduplication
const numbers = [1, 2, 2, 3, 4, 4, 5];
const unique = [...new Set(numbers)]; // [1, 2, 3, 4, 5]

// Mathematical Set Operations (Native in Node.js 22+, or polyfilled via Set/filter):
const setA = new Set([1, 2, 3]);
const setB = new Set([2, 3, 4]);

const intersection = new Set([...setA].filter(x => setB.has(x))); // [2, 3]
const union = new Set([...setA, ...setB]);                         // [1, 2, 3, 4]
const difference = new Set([...setA].filter(x => !setB.has(x)));    // [1]
```

---

### 7. `WeakMap` and `WeakSet` (Memory-Safe Collections)

#### How `WeakMap` Works Step-by-Step
Standard `Map` and `Set` maintain **strong references** to their keys, preventing the V8 garbage collector from reclaiming memory:
1. A `WeakMap` holds **weak references** exclusively to object keys.
2. When your application drops all normal references to an object, V8 automatically reclaims both the object and its associated `WeakMap` value during garbage collection.
3. Because entries can disappear asynchronously at any moment when garbage collection runs, `WeakMap` is non-iterable and has no `.size` property.

```javascript
const reqMetadata = new WeakMap();

function handleRequest(req) {
  reqMetadata.set(req, { startTime: Date.now() });
  // When HTTP request completes and Node.js destroys 'req',
  // reqMetadata automatically frees the entry without server memory leaks!
}
```

---

## 3. Pattern Recognition of Hash Tables, Maps & Sets

### Problem Triggers and Keywords

| Problem Keyword | What the Interviewer Means | Recommended Structure |
| :--- | :--- | :--- |
| **"Find pair with sum $K$"** | Look up complement $K - \text{current}$ instantly. | `Map<number, index>` |
| **"Find most frequent element"**| Count occurrences of items. | `Map<item, count>` |
| **"Contains duplicate"** | Verify if item was seen before. | `Set` ($O(1)$ membership) |
| **"Group anagrams"** | Categorize strings by sorted signature. | `Map<signature, string[]>` |
| **"Subarray sum equals $K$"** | Running prefix sum difference lookup. | `Map<prefixSum, count>` |

### The $10^7$ Rule for Hashing
Converting an $O(n^2)$ nested-loop lookup into an $O(1)$ Hash Map lookup drops execution from $10^{10}$ steps to $10^5$ steps, enabling algorithms with $n = 10^5$ to pass within milliseconds.

---

## 4. Problem 1: Two Sum (Hash Map Complement Search)

### Problem Statement
Given an array of integers `nums` and an integer `target`, return **indices** of the two numbers such that they add up to `target`.
Each input has exactly one valid solution, and you may not use the same element twice.

```text
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1] (Because nums[0] + nums[1] == 2 + 7 == 9)
```

### Step 1: Physical Simulation
Imagine numbered cards on a table: `[ 2 | 7 | 11 | 15 ]`, `target = 9`.
1. Pick up Card 0 (`2`). You ask yourself: "What partner card do I need to reach 9?"
2. Partner needed is $9 - 2 = 7$ (the **complement**).
3. You check your notepad of previously seen cards. The notepad is empty.
4. You write down: `"I have seen number 2 at index 0"`.
5. Pick up Card 1 (`7`). Partner needed is $9 - 7 = 2$.
6. You check your notepad. Number `2` is in your notepad at index 0!
7. You stop immediately and return `[0, 1]`.

### Step 2: Brute Force Approach
Compare every possible pair with nested loops:

```javascript
// Brute Force O(n^2)
function twoSumBrute(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }
  return [];
}
```
- **Time Complexity**: $O(n^2)$ — Checks all $\frac{n(n-1)}{2}$ pairs.
- **Space Complexity**: $O(1)$.

### Step 3: Bottleneck
Where is the CPU sweating?
The inner loop repeatedly scans forward across the array searching for the complement value. An array cannot answer "Do you have value $X$?" in $O(1)$ time; it requires an $O(n)$ linear scan. We need instant recall.

### Step 4: The Pattern Discovery
Replace the linear search with a **Hash Map**:
- Key = number value
- Value = index position
As we iterate through the array, we compute $\text{complement} = \text{target} - \text{nums}[i]$.
We query `map.has(complement)` in $O(1)$ time. If present, we return `[map.get(complement), i]`. If absent, we store `nums[i] => i` and continue.

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: One-Pass Hash Map Complement Lookup
function twoSum(nums, target) {
  const seen = new Map(); // Key: number, Value: index

  // Invariant: 'seen' contains all elements from nums[0 ... i - 1] mapped to their indices
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];

    if (seen.has(complement)) {
      return [seen.get(complement), i]; // Positive match found
    }

    seen.set(nums[i], i);
  }

  return []; // Negative case: no two numbers sum to target
}

// ❌ ANTI-PATTERN: Using a plain object with key string coercion and prototype traps
function buggyTwoSumObject(nums, target) {
  const seen = {};
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    // BUG: If seen[complement] is index 0, Boolean check evaluates to false!
    if (seen[complement]) {
      return [seen[complement], i];
    }
    seen[nums[i]] = i;
  }
  return [];
}

// Example test runs
console.log(twoSum([2, 7, 11, 15], 9)); // [ 0, 1 ]
console.log(twoSum([3, 2, 4], 6));       // [ 1, 2 ]
console.log(twoSum([3, 3], 6));          // [ 0, 1 ]
console.log(twoSum([1, 2, 3], 10));      // []
console.log(buggyTwoSumObject([3, 2, 4], 6)); // [ 1, 2 ] (fails if complement is index 0)
```

- **Time Complexity**: $O(n)$ — Single pass over $n$ items with $O(1)$ map lookups.
- **Space Complexity**: $O(n)$ — Auxiliary map stores at most $n$ items.

---

## 5. Problem 2: Contains Duplicate & Unique Intersection

### Problem Statement: Contains Duplicate
Given an integer array `nums`, return `true` if any value appears at least twice in the array, and `false` if every element is distinct.

```text
Input: nums = [1, 2, 3, 1] -> Output: true
Input: nums = [1, 2, 3, 4] -> Output: false
```

### Step 1: Physical Simulation
You are handed a deck of cards. You flip cards one by one onto a table.
Before placing a card down, you look at the table: "Have I placed a card with this number before?"
If yes, shout "Duplicate!" and stop. If you exhaust the deck without duplicates, all cards are distinct.

### Step 2: Brute Force Approach
Compare every element with all preceding elements ($O(n^2)$) or sort the array first ($O(n \log n)$).

```javascript
// Brute Force: O(n^2)
function containsDuplicateBrute(nums) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] === nums[j]) return true;
    }
  }
  return false;
}
```

### Step 3: Bottleneck
Where is the CPU sweating?
Scanning previous items takes $O(n)$ time per item. We only need a binary check: "Has value $X$ been seen before?"

### Step 4: The Pattern Discovery
A **Hash Set** provides $O(1)$ membership checks (`set.has(x)`). We iterate through `nums`. If `set.has(num)` is true, return `true` immediately (early exit). Otherwise, `set.add(num)`.

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: Hash Set Early-Exit Duplicate Detection
function containsDuplicate(nums) {
  const seen = new Set();

  // Invariant: 'seen' contains only distinct numbers from nums[0 ... i - 1]
  for (let i = 0; i < nums.length; i++) {
    if (seen.has(nums[i])) {
      return true; // Duplicate found early
    }
    seen.add(nums[i]);
  }

  return false; // All elements distinct
}

// Problem 2 Variation: Unique Intersection of Two Arrays
function intersection(nums1, nums2) {
  const set1 = new Set(nums1);
  const result = [];

  for (const num of nums2) {
    if (set1.has(num)) {
      result.push(num);
      set1.delete(num); // Deletion guarantees uniqueness without secondary sets!
    }
  }

  return result;
}

// Example test runs
console.log(containsDuplicate([1, 2, 3, 1])); // true
console.log(containsDuplicate([1, 2, 3, 4])); // false
console.log(containsDuplicate([1, 1, 1, 3, 3, 4, 3, 2, 4, 2])); // true
console.log(intersection([1, 2, 2, 1], [2, 2])); // [ 2 ]
console.log(intersection([4, 9, 5], [9, 4, 9, 8, 4])); // [ 9, 4 ]
```

- **Time Complexity**: $O(n)$ for duplicate detection; $O(n + m)$ for array intersection.
- **Space Complexity**: $O(n)$ auxiliary memory to store elements in the Set.

---

## 6. Under the Hood: V8 & Node.js

### Fast Properties vs Dictionary Mode in V8
In V8, plain JavaScript objects start in **Fast Properties Mode**:
- Properties are backed by **Hidden Classes (Shapes)** that assign properties to fixed memory offsets in C++ structs.
- Lookups are compiled to single machine instructions.

However:
- When you delete properties using `delete obj.prop` or add dozens of dynamic keys, V8 abandons hidden classes and demotes the object to **Dictionary Mode (Normalized Mode)**.
- In Dictionary Mode, the object is backed by a slow internal hash table, degrading property lookup by **2x to 5x**.
- **Rule**: Never use plain `{}` as a dynamic key-value cache. Always use `new Map()`.

### Hash DoS (Denial of Service) Attacks
When a web server parses HTTP query parameters or JSON bodies into a hash table:
- If the hashing algorithm is predictable, an attacker can craft 50,000 keys designed to produce the **exact same bucket index**.
- This collapses the hash table from $O(1)$ to $O(n)$ linear chaining.
- Inserting 50,000 colliding keys requires $\approx \frac{n^2}{2} \approx 1.25 \times 10^9$ operations, freezing the single-threaded Node.js event loop and taking down the server.
- **Defense**: Modern V8 uses **SipHash** with a randomized seed generated per process startup, preventing attackers from predicting hash collisions.

### `WeakMap` Garbage Collection Mechanics
In Node.js, storing request context in a global `Map` requires manual cleanup upon request completion. If an uncaught error prevents cleanup, memory leaks accumulate until an Out-Of-Memory (OOM) crash occurs.
A `WeakMap` associates metadata with the `req` object. When the request ends and Node.js drops the `req` reference, V8 automatically reclaims both the object and its WeakMap entry.

---

## 7. Hands-On Exercise

### The Scenario
You are tasked with building a high-performance **Custom Hash Table** from scratch in Node.js for an embedded caching microservice.
The hash table must handle string keys, resolve collisions via **Separate Chaining**, and dynamically resize when the load factor reaches or exceeds $0.75$.

### Acceptance Criteria
1. Implements `set(key, value)`, `get(key)`, and `delete(key)`.
2. Hashing function computes an integer bucket index within `[0 ... capacity - 1]`.
3. Dynamically doubles capacity and rehashes all entries when $\text{size} / \text{capacity} \ge 0.75$.
4. Verified with direct test execution.

### Verified Solution

```javascript
class CustomHashTable {
  constructor(capacity = 4) {
    this.capacity = capacity;
    this.buckets = new Array(capacity).fill(null).map(() => []);
    this.size = 0;
  }

  // Deterministic polynomial rolling hash function
  _hash(key) {
    const str = String(key);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash) % this.capacity;
  }

  set(key, value) {
    // Dynamic resizing check
    if (this.size / this.capacity >= 0.75) {
      this._resize(this.capacity * 2);
    }

    const index = this._hash(key);
    const bucket = this.buckets[index];

    // Check if key already exists in bucket chain
    for (const pair of bucket) {
      if (pair[0] === key) {
        pair[1] = value; // Update value
        return;
      }
    }

    // Insert new key-value pair
    bucket.push([key, value]);
    this.size++;
  }

  get(key) {
    const index = this._hash(key);
    const bucket = this.buckets[index];
    for (const [k, v] of bucket) {
      if (k === key) return v;
    }
    return undefined;
  }

  delete(key) {
    const index = this._hash(key);
    const bucket = this.buckets[index];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket.splice(i, 1);
        this.size--;
        return true;
      }
    }
    return false;
  }

  _resize(newCapacity) {
    const oldBuckets = this.buckets;
    this.capacity = newCapacity;
    this.buckets = new Array(newCapacity).fill(null).map(() => []);
    this.size = 0;

    for (const bucket of oldBuckets) {
      for (const [k, v] of bucket) {
        this.set(k, v);
      }
    }
  }
}

// Example test runs
const ht = new CustomHashTable(4);
ht.set("apple", 10);
ht.set("banana", 20);
ht.set("orange", 30); // 3/4 = 0.75 -> triggers dynamic resize to 8 buckets!
ht.set("grape", 40);

console.log(ht.get("apple")); // 10
console.log(ht.get("banana")); // 20
console.log(ht.get("orange")); // 30
console.log(ht.get("grape")); // 40
console.log(ht.get("nonexistent")); // undefined

console.log(ht.delete("banana")); // true
console.log(ht.get("banana")); // undefined
console.log(ht.size); // 3
```

---

## 8. Tricky Points and Edge Cases

### 1. Object Reference Equality in `Set` and `Map`
In JavaScript, objects are compared by memory address, not by property values:

```javascript
const map = new Map();
map.set([1, 2], "Coords");
console.log(map.get([1, 2])); // undefined! Distinct memory allocation.

// ✅ FIX: Retain original reference or serialize to string
const keyRef = [1, 2];
map.set(keyRef, "Coords");
console.log(map.get(keyRef)); // "Coords"
```

### 2. Number vs String Key Coercion in Plain Objects
Plain objects convert integer keys to strings (`obj[1]` becomes `obj["1"]`). `Map` preserves distinct types:

```javascript
const map = new Map();
map.set(1, "number");
map.set("1", "string");
console.log(map.get(1));   // "number"
console.log(map.get("1")); // "string"
```

### 3. The `delete` Operator Performance Penalty
Using `delete obj.prop` mutates the hidden class shape and transitions the object into slow dictionary mode. In `Map`, calling `map.delete(key)` is an optimized $O(1)$ native operation with zero deoptimizations.

---

## 9. Comprehensive Summary

- **Hash Tables** use a deterministic hash function and modulo compression ($\text{hash} \pmod{\text{capacity}}$) to achieve $O(1)$ average-time read, write, and delete.
- **Collisions** are resolved via **Separate Chaining** (linked lists/arrays in buckets) or **Open Addressing** (probing empty slots).
- **Load Factor ($\alpha = n / k$)**: When $\alpha \ge 0.75$, the table doubles capacity and rehashes all elements in $O(1)$ amortized time.
- **Plain Objects (`{}`)** coerce keys to strings, inherit prototype properties, and deoptimize into Dictionary Mode when keys are deleted. Always use `Object.hasOwn()` instead of `hasOwnProperty`.
- **ES6 `Map`** supports arbitrary key types, preserves insertion order, tracks `.size` in $O(1)$, and maintains stable V8 engine performance.
- **ES6 `Set`** stores unique values and provides $O(1)$ membership checks.
- **`WeakMap`** holds weak references to objects, enabling automatic garbage collection to prevent backend memory leaks.
- **Two Sum**: Store history in a Hash Map; querying `target - nums[i]` solves the problem in $O(n)$ time rather than $O(n^2)$.

---

## 10. Cheat Sheet

### Data Structure Selection Matrix

| Capability | Plain Object (`{}`) | ES6 `Map` | ES6 `Set` | `WeakMap` |
| :--- | :---: | :---: | :---: | :---: |
| **Key Types** | Strings / Symbols | **Any type** | Values only | **Objects only** |
| **Lookup Time** | $O(1)$ avg | **$O(1)$ avg** | **$O(1)$ avg** | **$O(1)$ avg** |
| **Size Tracking** | $O(n)$ (`Object.keys`) | **$O(1)$ (`.size`)** | **$O(1)$ (`.size`)** | None |
| **Garbage Collection**| Strong reference | Strong reference | Strong reference | **Weak reference** |
| **Safe Deletions** | ❌ Causes deopt | ✅ Native $O(1)$ | ✅ Native $O(1)$ | ✅ Native $O(1)$ |
| **Iteration Order** | Complex/Arbitrary | **Insertion Order** | **Insertion Order** | Non-iterable |

### Common Pitfalls List
- **Falsy Key Lookups**: Checking `if (seen[val])` fails when stored value is `0` or `false`.
- **Object Key Stringification**: Using `{}` as a cache with object keys collapses all keys into `"[object Object]"`.
- **Prototype Pollution**: Using `key in obj` returns `true` for built-in prototype methods like `"toString"`.
- **Non-Primitive Set Matching**: `new Set().add([1]).has([1])` returns `false` due to reference equality.

---

## 11. Interview Q&A

### 45-Second Technical Pitch
> *"A Hash Table stores key-value pairs by passing keys through a deterministic hash function and modulo compression to index directly into an underlying bucket array in $O(1)$ average time. In JavaScript, ES6 Map is preferred over plain objects for dynamic key-value storage because Map accepts arbitrary key types, avoids prototype pollution, tracks size in $O(1)$, and maintains stable V8 hidden classes without deoptimizing into dictionary mode. For algorithmic problems like Two Sum, tracking past elements in a Map allows us to look up complements in $O(1)$ time, reducing quadratic nested loops to linear time."*

### 1. Why is `new Map()` preferred over plain `{}` for dynamic key-value caches in Node.js?
**Answer:**
1. **Arbitrary Key Types**: Plain objects coerce all non-string keys to strings (objects become `"[object Object]"`). `Map` supports objects, functions, and numbers as distinct keys.
2. **Prototype Safety**: Plain objects inherit properties from `Object.prototype` (such as `toString` and `constructor`), causing security vulnerabilities (prototype pollution) and false positives with the `in` operator.
3. **Performance & Deoptimization**: Adding dynamic keys or using the `delete` operator transitions plain objects from fast V8 Hidden Classes into slow Dictionary Mode. `Map` is specifically optimized for high-churn additions and deletions.
4. **$O(1)$ Size**: `map.size` is an instant property lookup, whereas calculating plain object size requires `Object.keys(obj).length` ($O(n)$ array allocation).

### 2. What will the following code output in Node.js, and why?
```javascript
const cache = new Map();
cache.set({ id: 1 }, "Active");
console.log(cache.has({ id: 1 }));
console.log(cache.get({ id: 1 }));
```
**Answer:**
It outputs `false` and `undefined`.
In JavaScript, non-primitive objects and arrays are compared by **reference identity** (memory address), not by structural equality.
The object `{ id: 1 }` passed to `.has()` is allocated at a brand-new memory address in the heap, which does not match the memory address of the object passed to `.set()`.
To retrieve the value, you must pass the exact same object reference:
```javascript
const key = { id: 1 };
cache.set(key, "Active");
console.log(cache.has(key)); // true!
```

### 3. Spot and fix the bug in this frequency counter:
```javascript
function getFrequencies(arr) {
  const counts = {};
  for (let i = 0; i < arr.length; i++) {
    if (counts[arr[i]]) {
      counts[arr[i]] += 1;
    } else {
      counts[arr[i]] = 1;
    }
  }
  return counts;
}
```
**Answer:**
There is a critical bug when `arr` contains keys that collide with `Object.prototype` methods (such as `arr = ["toString", "valueOf"]`).
When `arr[i]` is `"toString"`, `counts["toString"]` resolves to the built-in function `Function: toString`. Because functions are truthy, JavaScript executes `counts["toString"] += 1`, converting the function to the corrupted string `"function toString() { [native code] }1"`.
The fix is to use `new Map()`:
```javascript
function getFrequenciesFixed(arr) {
  const counts = new Map();
  for (const item of arr) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }
  return counts;
}
```

### 4. How does an adversarial Hash DoS attack impact a Node.js server, and how does V8 mitigate it?
**Answer:**
A Hash DoS (Denial of Service) attack occurs when an attacker submits an HTTP POST body with thousands of crafted parameter keys designed to generate the **exact same hash code**.
If all keys land in the same bucket, the hash table's collision resolution degrades from $O(1)$ to an $O(n)$ linear chain. Inserting $n$ keys degrades to $O(n^2)$ time.
Because Node.js executes JavaScript on a single thread, parsing this payload monopolizes the CPU for tens of seconds, freezing the event loop and dropping all other concurrent user connections.
V8 mitigates this by using **SipHash** with a randomized cryptographic seed generated randomly on every Node.js process boot. Because the attacker cannot guess the seed, they cannot craft predictable collisions.

---

## 12. Practice Problems

### 1. Two Sum - Easy
Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.
- **Sample Input 1:** `nums = [2, 7, 11, 15]`, `target = 9`
- **Expected Output 1:** `[0, 1]`
- **Sample Input 2:** `nums = [3, 2, 4]`, `target = 6`
- **Expected Output 2:** `[1, 2]`
- **Sample Input 3:** `nums = [3, 3]`, `target = 6`
- **Expected Output 3:** `[0, 1]`

### 2. Contains Duplicate - Easy
Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.
- **Sample Input 1:** `nums = [1, 2, 3, 1]`
- **Expected Output 1:** `true`
- **Sample Input 2:** `nums = [1, 2, 3, 4]`
- **Expected Output 2:** `false`

### 3. Intersection of Two Arrays - Easy
Given two integer arrays `nums1` and `nums2`, return an array of their intersection. Each element in the result must be unique.
- **Sample Input 1:** `nums1 = [1, 2, 2, 1]`, `nums2 = [2, 2]`
- **Expected Output 1:** `[2]`
- **Sample Input 2:** `nums1 = [4, 9, 5]`, `nums2 = [9, 4, 9, 8, 4]`
- **Expected Output 2:** `[9, 4]`

### 4. First Unique Character in a String - Easy
Given a string `s`, find the first non-repeating character and return its index. If it does not exist, return `-1`.
- **Sample Input 1:** `s = "leetcode"`
- **Expected Output 1:** `0`
- **Sample Input 2:** `s = "loveleetcode"`
- **Expected Output 2:** `2`
- **Sample Input 3:** `s = "aabb"`
- **Expected Output 3:** `-1`

### 5. Valid Anagram - Easy
Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.
- **Sample Input 1:** `s = "anagram"`, `t = "nagaram"`
- **Expected Output 1:** `true`
- **Sample Input 2:** `s = "rat"`, `t = "car"`
- **Expected Output 2:** `false`

---

<nav aria-label="Lecture navigation">

[Previous: Searching & Elementary Sorting](day-03-searching-and-sorting-algorithms.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Hash Patterns: Frequency & Duplicates](day-05-hash-patterns-frequency-counting-and-duplicates.md)

</nav>
