# Day 04: Objects, Maps, Sets & Hash Tables

<nav aria-label="Lecture navigation">

[Previous: Searching & Elementary Sorting](day-03-searching-and-sorting-algorithms.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Hash Patterns: Frequency & Duplicates](day-05-hash-patterns-frequency-counting-and-duplicates.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Asymptotic complexity ($O(1)$ amortized vs $O(n)$ worst case).
- [Day 02: Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md) — Contiguous memory indexing and element access.
- Basic JavaScript variables, functions, and loops.

---

## 1. What is a Hash Table?

A **Hash Table** (or Hash Map) is a data structure that maps **keys** to **values**. It provides **$O(1)$ average time complexity** for insertion, lookup, and deletion.

Arrays give instant $O(1)$ access only when you already know the numeric integer index (`arr[0]`, `arr[42]`). If your data is indexed by a string or object (such as a username, email address, or SKU), an array requires an $O(n)$ linear scan to find a match. A Hash Table solves this by transforming arbitrary keys into array indices in $O(1)$ time.

> **Hash Table**: A data structure that stores key-value pairs by using a mathematical hash function to compute an integer index into an array of buckets, achieving $O(1)$ average-time lookups.

```text
┌────────────────┐     ┌───────────────┐     ┌──────────────────────┐     ┌────────────────────────┐
│  Key: "apple"  │ ──► │ Hash Function │ ──► │ Hash Code: 93029210  │ ──► │ Index = Hash % Capacity│ ──► Bucket [3]
└────────────────┘     └───────────────┘     └──────────────────────┘     └────────────────────────┘
```

### The Four Core Components

1. **Key**: The identifier used to store and retrieve data (`"username"`, `1042`, `{ id: 1 }`).
2. **Hash Function**: A deterministic mathematical formula that converts an arbitrary key into a large integer called a **hash code**.
3. **Compression**: An operation (typically modulo arithmetic: `hashCode % capacity`) that maps the large hash code into a valid boundary index within the underlying storage array.
4. **Bucket Array**: The underlying contiguous array of fixed size where key-value pairs are stored. Each array slot is called a **bucket**.

```text
Underlying Bucket Array (Capacity = 8):
Index:     0        1        2        3              4        5        6        7
Slots:  [ null |  null  |  null  | ["apple", $1.50] |  null  |  null  |  null  | ["banana", $0.75] ]
                                         ▲                                             ▲
"apple" hashes to index 3 ───────────────┘                                             │
"banana" hashes to index 7 ────────────────────────────────────────────────────────────┘
```

---

## 2. Hash Functions and Collision Resolution

A production hash function must satisfy three requirements:
1. **Deterministic**: The exact same key must always produce the exact same hash code.
2. **Uniform Distribution**: Keys must be evenly distributed across all buckets to minimize collisions.
3. **Fast Computation**: Calculating the hash must take $O(1)$ time for standard keys.

### What is a Hash Collision?

A **collision** occurs when two distinct keys produce the exact same array index.

> **Pigeonhole Principle**: If you have more items than slots, at least one slot must hold more than one item. Because there are infinite possible keys and only a finite number of array buckets, collisions are mathematically guaranteed.

```text
Key 1: "apple"  ──► Hash Function ──► Index 3 ──┐
                                                ├──► COLLISION! Both target Index 3.
Key 2: "orange" ──► Hash Function ──► Index 3 ──┘
```

### Collision Resolution Strategies

#### 1. Separate Chaining
Each bucket in the array holds a reference to a linked list or small array of `[key, value]` pairs. When keys collide, the new pair is appended to the chain at that bucket index.

```text
Index 0:  null
Index 1:  null
Index 2:  null
Index 3:  [ "apple", $1.50 ] ──► [ "orange", $2.00 ] ──► null
Index 4:  null
Index 5:  [ "banana", $0.75 ] ──► null
```

- **Lookup**: Compute `hash(key) % capacity`, jump to that bucket, and scan its short list using equality (`===`) to find the matching key.

#### 2. Open Addressing (Linear Probing)
All entries are stored directly in the main array. When a collision occurs at index $k$, the algorithm probes subsequent slots ($k + 1, k + 2, \dots$) until an empty bucket is found.
- **Drawback**: Causes **Primary Clustering** (contiguous blocks of filled slots), which slows down subsequent searches.

---

### Load Factor and Dynamic Resizing (Rehashing)

> **Load Factor ($\alpha$)**: The ratio of stored items $n$ to total bucket capacity $k$:
> $$\alpha = \frac{n}{k}$$

- When $\alpha \ge 0.75$ (75% full), buckets become crowded and search chains lengthen.
- **Dynamic Resizing (Rehashing)**: The table allocates a new array of double the capacity ($2k$), rehashes every key, and re-inserts them into the new bucket array.
- Because doubling happens infrequently, operations run in **$O(1)$ amortized time**.
- **Worst-Case Degradation**: If an adversarial input causes all $n$ keys to collide into the same bucket, lookups degrade to **$O(n)$ linear time**.

---

## 3. Plain JavaScript Objects (`{}`)

Plain objects in JavaScript are designed primarily as records or structured entities with string and symbol keys.

```javascript
// Basic Object operations
const user = { id: 101, name: "Alice", role: "Engineer" };

// 1. Reading and Writing Properties
user.age = 28;             // Dot notation
user["department"] = "IT"; // Bracket notation (required for dynamic keys)

// 2. Enumerating Keys, Values, and Entries
console.log(Object.keys(user));   // ['id', 'name', 'role', 'age', 'department']
console.log(Object.values(user)); // [101, 'Alice', 'Engineer', 28, 'IT']
console.log(Object.entries(user));// [['id', 101], ['name', 'Alice'], ...]
```

### Checking Property Existence: Common Traps

```javascript
// Node.js code
"use strict";

const config = {
  timeout: 0,
  debugMode: false,
  apiEndpoint: ""
};

// ❌ ANTI-PATTERN: Falsy truthiness check fails on valid values (0, false, "")
if (config.timeout) {
  // Never executes because 0 is falsy!
}
console.log(Boolean(config.timeout)); // false (Bug: 0 is a valid timeout!)

// ❌ ANTI-PATTERN: 'in' operator checks the entire prototype chain
console.log("toString" in config);     // true (Inherited from Object.prototype!)
console.log("constructor" in config);  // true (Inherited!)

// ❌ ANTI-PATTERN: hasOwnProperty can be shadowed or fail on prototype-free objects
const malicious = { hasOwnProperty: () => false, data: "sensitive" };
console.log(malicious.hasOwnProperty("data")); // false (Shadowed!)

// ✅ CORRECT: Object.hasOwn() safely checks direct properties only
console.log(Object.hasOwn(config, "timeout"));     // true (0 is properly recognized!)
console.log(Object.hasOwn(config, "toString"));    // false (Correctly ignores prototype!)
console.log(Object.hasOwn(malicious, "data"));     // true (Immune to shadowing!)

// ✅ PATTERN: Use Object.create(null) for clean, prototype-free dictionaries
const cleanDict = Object.create(null);
console.log("toString" in cleanDict); // false (No prototype chain!)
```

### The Key Coercion Trap

```javascript
// Node.js code
"use strict";

const cache = {};
const keyA = { id: 1 };
const keyB = { id: 2 };

// ❌ ANTI-PATTERN: Plain objects coerce non-string keys to strings
cache[keyA] = "User Data A";
cache[keyB] = "User Data B"; // OVERWRITES keyA!

// Both keyA and keyB were converted to "[object Object]"
console.log(cache); 
// Output: { '[object Object]': 'User Data B' }
console.log(cache[keyA]); // "User Data B" (Data corruption!)

// ✅ CORRECT: Use primitive strings/numbers or switch to Map for object keys
const safeMap = new Map();
safeMap.set(keyA, "User Data A");
safeMap.set(keyB, "User Data B");
console.log(safeMap.get(keyA)); // "User Data A" (Correctly isolated!)
console.log(safeMap.get(keyB)); // "User Data B"
```

---

## 4. The ES6 `Map` Collection

The ES6 `Map` is JavaScript's dedicated, purpose-built Hash Table implementation.

```javascript
// Node.js code
"use strict";

// 1. Initializing and Method Chaining
const map = new Map()
  .set("status", 200)
  .set("active", true)
  .set("retries", 3);

// 2. Core API Operations
console.log(map.get("status")); // 200 (O(1))
console.log(map.has("active"));  // true (O(1))
console.log(map.size);           // 3 (O(1) property, unlike Object.keys().length which is O(n))

map.delete("retries");           // true (O(1))
console.log(map.size);           // 2
```

### Reference Identity and Key Equality

```javascript
// Node.js code
"use strict";

const map = new Map();

// ❌ ANTI-PATTERN: Looking up non-primitive keys with a new reference fails
map.set([1, 2], "Coordinates");
console.log(map.get([1, 2])); // undefined! New array has a different memory address.

// ✅ CORRECT: Retain the exact reference
const coordKey = [1, 2];
map.set(coordKey, "Coordinates");
console.log(map.get(coordKey)); // "Coordinates" (Match found!)

// ✅ CORRECT: Map uses SameValueZero algorithm for NaN and +0/-0
map.set(NaN, "Not a Number");
console.log(map.get(NaN)); // "Not a Number" (NaN equals NaN in Map, unlike regular ===)

map.set(+0, "Zero Value");
console.log(map.get(-0));  // "Zero Value" (+0 and -0 are treated as equal)
```

### Interoperability: Converting Between `Object` and `Map`

```javascript
// Node.js code
"use strict";

// 1. Object to Map
const userRecord = { name: "Sarah", role: "DevOps" };
const userMap = new Map(Object.entries(userRecord));
console.log(userMap.get("role")); // "DevOps"

// 2. Map to Object
userMap.set("active", true);
const restoredObj = Object.fromEntries(userMap);
console.log(restoredObj); // { name: 'Sarah', role: 'DevOps', active: true }

// 3. Iterating a Map (Guaranteed insertion order!)
for (const [key, value] of userMap) {
  console.log(`${key} -> ${value}`);
}
```

---

## 5. The ES6 `Set` Collection

A `Set` is a collection of **unique values**. Duplicate values are silently ignored.

```javascript
// Node.js code
"use strict";

const set = new Set();
set.add(10).add(20).add(10); // Duplicate 10 is ignored

console.log(set.has(20)); // true (O(1))
console.log(set.has(30)); // false (O(1))
console.log(set.size);    // 2 (O(1))
```

### Deduplication and Reference Identity

```javascript
// Node.js code
"use strict";

// ✅ PATTERN: Instant array deduplication in O(n) time
const numbers = [1, 2, 2, 3, 4, 4, 5];
const uniqueNumbers = [...new Set(numbers)];
console.log(uniqueNumbers); // [1, 2, 3, 4, 5]

// ❌ TRAP: Objects with identical contents are NOT deduplicated (compared by reference!)
const pointSet = new Set();
pointSet.add({ x: 1, y: 2 });
pointSet.add({ x: 1, y: 2 });
console.log(pointSet.size); // 2! Distinct object references are treated as separate items.

// ✅ CORRECT: Serialize objects to primitive strings for value deduplication
const coordSet = new Set();
coordSet.add(`${1},${2}`);
coordSet.add(`${1},${2}`);
console.log(coordSet.size); // 1 (Successfully deduplicated!)
```

### Mathematical Set Operations

Modern JavaScript (Node.js 22+) provides built-in methods for mathematical set operations. For compatibility with older environments, simple one-line fallbacks can be used:

```javascript
// Node.js code
"use strict";

const setA = new Set([1, 2, 3]);
const setB = new Set([2, 3, 4]);

// 1. Intersection: Elements present in BOTH sets
// Native ES2024: setA.intersection(setB)
const intersection = new Set([...setA].filter(x => setB.has(x)));
console.log([...intersection]); // [2, 3]

// 2. Union: All unique elements combined
// Native ES2024: setA.union(setB)
const union = new Set([...setA, ...setB]);
console.log([...union]); // [1, 2, 3, 4]

// 3. Difference: Elements in setA but NOT in setB
// Native ES2024: setA.difference(setB)
const difference = new Set([...setA].filter(x => !setB.has(x)));
console.log([...difference]); // [1]

// 4. Symmetric Difference: Elements in either set, but not in both
// Native ES2024: setA.symmetricDifference(setB)
const symDiff = new Set(
  [...setA].filter(x => !setB.has(x)).concat([...setB].filter(x => !setA.has(x)))
);
console.log([...symDiff]); // [1, 4]
```

---

## 6. `WeakMap` and `WeakSet`: Memory-Safe Collections

Standard `Map` and `Set` hold **strong references** to their keys and values. If an object is stored as a key in a standard `Map`, the V8 garbage collector cannot free that object—even if every other part of your application has dropped all references to it. In long-running backend servers, this can cause silent memory leaks.

A `WeakMap` avoids this by holding **weak references**:
- Keys **must be objects** (or non-registered symbols). Primitives throw a `TypeError`.
- When an object key has no remaining strong references elsewhere, it is automatically garbage-collected, and its entry is removed from the `WeakMap`.
- Because garbage collection is non-deterministic, `WeakMap` has **no `.size` property**, **no `.keys()` method**, and **cannot be iterated**.

```javascript
// Node.js code
"use strict";

const sessionCache = new WeakMap();

function processUserRequest(req) {
  // ❌ ANTI-PATTERN: Attempting to use primitive keys throws TypeError
  // sessionCache.set("req_123", { auth: true }); // TypeError: Invalid value used as weak map key

  // ✅ CORRECT: Attach request-scoped metadata directly to the request object
  sessionCache.set(req, {
    startTime: Date.now(),
    role: "Admin"
  });

  console.log(sessionCache.get(req)); // { startTime: ..., role: 'Admin' }
  // When the HTTP request finishes and Node.js destroys 'req',
  // sessionCache automatically cleans up its internal metadata without a memory leak!
}
```

---

## 7. How to Spot the Hashing Pattern

| Diagnostic Trigger | Problem Signal | Recommended Data Structure |
| :--- | :--- | :--- |
| **Replace Nested Loops** | "Find a pair where $A + B = K$ or $A - B = K$." | `Map` (store seen items, look up complement $K - A$). |
| **Frequency Counting** | "Find the most frequent character, check anagrams." | `Map<element, count>`. |
| **Fast Membership / Seen Check**| "Detect duplicates, check if visited before." | `Set` (check `set.has(x)` in $O(1)$). |
| **Grouping & Categorization** | "Group words by anagram or strings by length." | `Map<CategoryKey, Item[]>`. |
| **Running State Tracking** | "Find longest balanced subarray or prefix sum." | `Map<PrefixSum, FirstIndex>`. |

---

## 8. Problem 1: Two Sum (Hash Map Complement Search)

### Problem Statement
Given an array of integers `nums` and an integer `target`, return **indices** of the two numbers such that they add up to `target`. Each input has exactly one solution, and you may not use the same element twice.

```text
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1] (Because nums[0] + nums[1] == 2 + 7 == 9)
```

### The Hash Map Insight ($O(n)$)
Instead of searching forward with an inner loop ($O(n^2)$), compute what value is needed as you iterate:
$$\text{complement} = \text{target} - \text{nums}[i]$$

Check your map for `complement`:
- If found: return `[map.get(complement), i]`.
- If not found: record the current number and index (`map.set(nums[i], i)`) and proceed.

| Step ($i$) | Current `nums[i]` | Complement | `seen.has(complement)`? | Action Taken | Map Contents |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **0** | `2` | $9 - 2 = 7$ | `false` | Store `2 => 0` | `{ 2 => 0 }` |
| **1** | `7` | $9 - 7 = 2$ | `true` (Found at index 0!) | Return `[0, 1]` | Search finishes |

```javascript
// Node.js code
"use strict";

/**
 * Finds two indices whose elements sum to target.
 * @param {number[]} nums
 * @param {number} target
 * @returns {number[]}
 */
function twoSum(nums, target) {
  const seen = new Map(); // stores: value => index

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];

    // ✅ POSITIVE CASE: Complement exists in map
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }

    seen.set(nums[i], i);
  }

  // ❌ NEGATIVE CASE: No valid pair exists
  return [];
}

// Verification
console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1] (Positive match)
console.log(twoSum([3, 2, 4], 6));       // [1, 2] (Positive match)
console.log(twoSum([1, 2, 3], 10));      // []     (Negative case: no pair sums to 10)
```

- **Time Complexity: $O(n)$** — Single pass over $n$ elements with $O(1)$ map lookups.
- **Space Complexity: $O(n)$** — Map stores at most $n$ items.

---

## 9. Problem 2: Contains Duplicate (Set Membership)

### Problem Statement
Given an integer array `nums`, return `true` if any value appears at least twice in the array, and `false` if every element is distinct.

```javascript
// Node.js code
"use strict";

/**
 * Checks for duplicate values in an array.
 * @param {number[]} nums
 * @returns {boolean}
 */
function containsDuplicate(nums) {
  const seen = new Set();

  for (let i = 0; i < nums.length; i++) {
    // ✅ POSITIVE CASE: Value seen before -> duplicate found!
    if (seen.has(nums[i])) {
      return true; // Early exit on first duplicate
    }
    seen.add(nums[i]);
  }

  // ❌ NEGATIVE CASE: Scanned entire array without duplicates
  return false;
}

console.log(containsDuplicate([1, 2, 3, 1])); // true  (Duplicate 1 found)
console.log(containsDuplicate([1, 2, 3, 4])); // false (All elements distinct)
```

- **Time Complexity: $O(n)$** — Single pass with instant early exit.
- **Space Complexity: $O(n)$** — Stores unique items in the Set.

---

## 10. Problem 3: Intersection of Two Arrays (Set Operations)

### Problem Statement
Given two integer arrays `nums1` and `nums2`, return an array of their **intersection**. Each element in the result must be **unique**.

```javascript
// Node.js code
"use strict";

/**
 * Computes unique intersection of two arrays.
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @returns {number[]}
 */
function intersection(nums1, nums2) {
  const set1 = new Set(nums1);
  const result = [];

  for (const num of nums2) {
    // ✅ POSITIVE CASE: Element present in set1
    if (set1.has(num)) {
      result.push(num);
      set1.delete(num); // Deleting ensures output uniqueness without extra sets!
    }
  }

  return result;
}

console.log(intersection([1, 2, 2, 1], [2, 2]));          // [2]    (Positive match)
console.log(intersection([4, 9, 5], [9, 4, 9, 8, 4]));    // [9, 4] (Positive match)
console.log(intersection([1, 2, 3], [4, 5, 6]));          // []     (Negative case: disjoint sets)
```

- **Time Complexity: $O(n + m)$** — Converting `nums1` to a Set takes $O(n)$; scanning `nums2` takes $O(m)$ with $O(1)$ set checks and deletions.
- **Space Complexity: $O(n)$** — `set1` stores unique items from `nums1`.

---

## 11. Under the Hood: V8 Engine & Node.js Runtime Realities

### Fast Properties vs Dictionary Mode
In the V8 engine, plain objects begin with **Hidden Classes (Shapes)**. Properties are assigned to fixed memory offsets in C++ structs (**In-Object Properties**), enabling near-instant property lookups.

- When you delete properties using `delete obj.prop` or add hundreds of dynamic keys, V8 abandons hidden classes and demotes the object to **Dictionary Mode** (Normalized Mode).
- In Dictionary Mode, the object is backed by a slower C++ hash table. Property lookups must traverse the hash table, slowing down access by **2x to 5x**.
- **Rule**: Never use `{}` as a dynamic, high-churn key-value store. Always use `new Map()`.

### Hash DoS (Denial of Service) Attacks
- When a backend server parses incoming JSON payloads or URL parameters, keys are placed into internal hash tables.
- If the hashing algorithm is predictable, an attacker can craft 50,000 keys that all produce the **exact same bucket index**.
- This collapses hash table lookups from $O(1)$ to $O(n)$. Inserting 50,000 adversarial keys requires $\approx \frac{n^2}{2} \approx 1.25 \times 10^9$ operations, blocking the single-threaded Node.js event loop and freezing the server.
- **Defense**: Modern V8 uses randomized hash seeds (SipHash) on process startup, preventing attackers from predicting hash codes.

---

## 12. Tricky Points and Edge Cases

### 1. Object Reference Equality in `Set` and `Map`
```javascript
const set = new Set();

// ❌ ANTI-PATTERN: Structural matching does not work for non-primitives
set.add([1, 2]);
console.log(set.has([1, 2])); // false! (Different memory addresses)

// ✅ CORRECT: Compare by reference or serialize to string
const pair = [1, 2];
set.add(pair);
console.log(set.has(pair)); // true!
```

### 2. Number vs String Key Coercion
```javascript
// ❌ TRAP: Plain objects convert integer keys to strings
const obj = {};
obj[1] = "number one";
console.log(obj["1"]); // "number one" (Coerced!)

// ✅ CORRECT: Map preserves distinct types
const map = new Map();
map.set(1, "number one");
console.log(map.get("1")); // undefined (Different types!)
console.log(map.get(1));   // "number one"
```

### 3. The `delete` Performance Hazard
```javascript
const obj = { a: 1, b: 2, c: 3 };

// ❌ ANTI-PATTERN: 'delete' demotes object to slow Dictionary Mode
delete obj.b;

// ✅ CORRECT: Use Map for high-churn deletions
const map = new Map([['a', 1], ['b', 2], ['c', 3]]);
map.delete('b'); // Fast, clean, no engine deoptimizations
```

### 4. Mutating Stored Object Properties
```javascript
const userSet = new Set();
const user = { id: 1, name: "Bob" };
userSet.add(user);

// Mutating properties does not change reference identity
user.name = "Robert";
console.log(userSet.has(user)); // true (Reference identity preserved)
```

### 5. Modifying a `Map` During Iteration
```javascript
const map = new Map([[1, "a"], [2, "b"]]);

// Adding new keys during iteration causes the loop to visit the new keys as well!
for (const [k, v] of map) {
  if (k < 4) map.set(k + 2, "new");
}
console.log(map.size); // Expanded dynamically
```

---

## 13. Hands-On Exercises

Run this script in Node.js to verify Two Sum, Set operations, and a custom Hash Table built from scratch:

```javascript
// Node.js code
"use strict";
const assert = require("node:assert");

// ==========================================
// TIER 1: Two Sum Verification (Warm-Up)
// ==========================================
function testTwoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff), i];
    map.set(nums[i], i);
  }
  return [];
}
assert.deepEqual(testTwoSum([2, 7, 11, 15], 9), [0, 1]);
assert.deepEqual(testTwoSum([3, 2, 4], 6), [1, 2]);
assert.deepEqual(testTwoSum([1, 2, 3], 10), []); // Negative case
console.log("✅ Tier 1: Two Sum assertions passed!");

// ==========================================
// TIER 2: Set Intersection Verification (Core)
// ==========================================
function testIntersection(a, b) {
  const setA = new Set(a);
  const result = [];
  for (const x of b) {
    if (setA.has(x)) {
      result.push(x);
      setA.delete(x);
    }
  }
  return result.sort((x, y) => x - y);
}
assert.deepEqual(testIntersection([1, 2, 2, 1], [2, 2]), [2]);
assert.deepEqual(testIntersection([4, 9, 5], [9, 4, 9, 8, 4]), [4, 9]);
assert.deepEqual(testIntersection([1, 2], [3, 4]), []); // Negative case
console.log("✅ Tier 2: Intersection assertions passed!");

// ==========================================
// TIER 3: Custom Hash Table from Scratch (Engineering Depth)
// ==========================================
class SimpleHashTable {
  constructor(capacity = 8) {
    this.capacity = capacity;
    this.buckets = new Array(capacity).fill(null).map(() => []);
    this.size = 0;
  }

  _hash(key) {
    const str = String(key);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % this.capacity;
  }

  set(key, value) {
    if (this.size / this.capacity >= 0.75) {
      this._resize(this.capacity * 2);
    }
    const bucket = this.buckets[this._hash(key)];
    for (const pair of bucket) {
      if (pair[0] === key) {
        pair[1] = value; // Update existing key
        return;
      }
    }
    bucket.push([key, value]);
    this.size++;
  }

  get(key) {
    const bucket = this.buckets[this._hash(key)];
    for (const [k, v] of bucket) {
      if (k === key) return v;
    }
    return undefined;
  }

  delete(key) {
    const bucket = this.buckets[this._hash(key)];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket.splice(i, 1);
        this.size--;
        return true;
      }
    }
    return false;
  }

  _resize(newCap) {
    const oldBuckets = this.buckets;
    this.capacity = newCap;
    this.buckets = new Array(newCap).fill(null).map(() => []);
    this.size = 0;
    for (const b of oldBuckets) {
      for (const [k, v] of b) this.set(k, v);
    }
  }
}

const ht = new SimpleHashTable(4);
ht.set("apple", 10);
ht.set("banana", 20);
ht.set("grape", 30);
ht.set("orange", 40); // Triggers dynamic resize from 4 to 8

assert.equal(ht.get("apple"), 10);
assert.equal(ht.get("banana"), 20);
assert.equal(ht.get("grape"), 30);
assert.equal(ht.get("orange"), 40);
assert.equal(ht.get("nonexistent"), undefined);
assert.equal(ht.delete("banana"), true);
assert.equal(ht.get("banana"), undefined);

console.log("✅ Tier 3: Custom SimpleHashTable assertions passed!");
```

---

## 14. Summary

- **Hash Tables** map keys to values by running keys through a **hash function** and modulo compression (`hash % capacity`) to index into an underlying bucket array in **$O(1)$ average time**.
- **Collisions** are inevitable (Pigeonhole Principle). Handled via **Separate Chaining** (linked lists in buckets) or **Open Addressing** (probing next empty slot).
- **Load Factor ($\alpha = \frac{n}{k}$)**: When $\alpha \ge 0.75$, the table doubles capacity and rehashes all elements in $O(1)$ amortized time.
- **Plain Objects (`{}`)** coerce keys to strings, inherit prototype properties, and deoptimize into slow Dictionary Mode when keys are deleted or added dynamically. Check properties with `Object.hasOwn()`.
- **`Map`** accepts any key type, guarantees insertion order, and tracks `.size` in $O(1)$.
- **`Set`** stores unique elements and provides $O(1)$ membership checks (`set.has(x)`).
- **`WeakMap`** holds weak references to objects, allowing the garbage collector to reclaim unused memory and prevent server leaks.
- **Two Sum**: Store history in a Map; search for `target - current` in $O(1)$ to reduce complexity from $O(n^2) \to O(n)$.

---

## 15. Cheat Sheet

| Operation | `Map` | Plain `Object` | `Set` | `WeakMap` |
| :--- | :---: | :---: | :---: | :---: |
| **Insert** | `map.set(k, v)` | `obj[k] = v` | `set.add(v)` | `wm.set(obj, v)` |
| **Lookup** | `map.get(k)` | `obj[k]` | `set.has(v)` | `wm.get(obj)` |
| **Check** | `map.has(k)` | `Object.hasOwn(obj, k)` | `set.has(v)` | `wm.has(obj)` |
| **Delete** | `map.delete(k)` | `delete obj[k]` (⚠️ deopt) | `set.delete(v)` | `wm.delete(obj)` |
| **Size** | `map.size` (**$O(1)$**) | `Object.keys(obj).length` ($O(n)$) | `set.size` (**$O(1)$**) | **None** |
| **Key Types** | Any type | Strings & Symbols only | Values only | Objects only |
| **Time** | **$O(1)$ avg** | **$O(1)$ avg** | **$O(1)$ avg** | **$O(1)$ avg** |

```javascript
// Reusable Templates
// 1. Two Sum Complement:
if (seen.has(target - num)) return [seen.get(target - num), i];
seen.set(num, i);

// 2. Frequency Counting:
freq.set(item, (freq.get(item) || 0) + 1);

// 3. Deduplication:
const unique = [...new Set(array)];
```

---

## 16. Interview Q&A

### 45-Second Explanation
> *"A Hash Table stores key-value pairs and provides $O(1)$ average lookups using an internal hash function and bucket array. Collisions are handled via Separate Chaining or Open Addressing, with dynamic resizing when the load factor exceeds 0.75. In JavaScript, `new Map()` is preferred over plain objects for dynamic caches because it supports arbitrary key types, avoids prototype pollution, tracks `.size` in $O(1)$, and maintains stable V8 engine performance without deoptimizing into slow Dictionary Mode."*

1. **Why is `new Map()` preferred over `{}` for dynamic caching?**  
   `Map` supports non-string keys, prevents prototype pollution, tracks size in $O(1)$, and avoids triggering V8 Dictionary Mode deoptimizations when adding or deleting properties frequently.

2. **What causes a Hash Table to degrade from $O(1)$ to $O(n)$?**  
   Hash collisions. If many keys hash to the same bucket (due to a poor hash function or an adversarial Hash DoS attack), the bucket becomes a linear list that takes $O(n)$ to search.

3. **How does `WeakMap` prevent memory leaks in Node.js?**  
   A `WeakMap` holds weak references to its key objects. When no external reference to a key object remains, the garbage collector automatically reclaims the object and frees its cache entry.

4. **What is V8 Dictionary Mode and why avoid `delete`?**  
   V8 optimizes plain objects with Hidden Classes for fast struct-like access. Using `delete obj.prop` transitions the object into Dictionary Mode, replacing fast memory offsets with a slow C++ hash table.

---

## 17. Practice Problems

### 1. Two Sum - Easy
Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice.
- **Input:** `nums = [2,7,11,15]`, `target = 9`
- **Expected Output:** `[0,1]`
- **Input:** `nums = [3,2,4]`, `target = 6`
- **Expected Output:** `[1,2]`
- **Input:** `nums = [3,3]`, `target = 6`
- **Expected Output:** `[0,1]`

### 2. Contains Duplicate - Easy
Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.
- **Input:** `nums = [1,2,3,1]`
- **Expected Output:** `true`
- **Input:** `nums = [1,2,3,4]`
- **Expected Output:** `false`
- **Input:** `nums = [1,1,1,3,3,4,3,2,4,2]`
- **Expected Output:** `true`

### 3. Intersection of Two Arrays - Easy
Given two integer arrays `nums1` and `nums2`, return an array of their intersection. Each element in the result must be unique and you may return the result in any order.
- **Input:** `nums1 = [1,2,2,1]`, `nums2 = [2,2]`
- **Expected Output:** `[2]`
- **Input:** `nums1 = [4,9,5]`, `nums2 = [9,4,9,8,4]`
- **Expected Output:** `[4,9]`

### 4. First Unique Character in a String - Easy
Given a string `s`, find the first non-repeating character in it and return its index. If it does not exist, return `-1`.
- **Input:** `s = "leetcode"`
- **Expected Output:** `0`
- **Input:** `s = "loveleetcode"`
- **Expected Output:** `2`
- **Input:** `s = "aabb"`
- **Expected Output:** `-1`

### 5. Valid Anagram - Easy
Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise. An anagram is a word formed by rearranging the letters of a different word, typically using all the original letters exactly once.
- **Input:** `s = "anagram"`, `t = "nagaram"`
- **Expected Output:** `true`
- **Input:** `s = "rat"`, `t = "car"`
- **Expected Output:** `false`

---

<nav aria-label="Lecture navigation">

[Previous: Searching & Elementary Sorting](day-03-searching-and-sorting-algorithms.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Hash Patterns: Frequency & Duplicates](day-05-hash-patterns-frequency-counting-and-duplicates.md)

</nav>
