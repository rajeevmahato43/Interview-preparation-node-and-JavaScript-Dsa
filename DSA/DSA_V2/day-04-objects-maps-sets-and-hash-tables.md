# Day 04: Objects, Maps, Sets & Hash Tables

<nav aria-label="Lecture navigation">

[Previous: Searching & Elementary Sorting Algorithms](day-03-searching-and-sorting-algorithms.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Hash Table Patterns: Frequency, Complements & Duplicates](day-05-hash-patterns-frequency-counting-and-duplicates.md)

</nav>

---

## 1. Hash Tables

A **hash table** (or hash map) is a data structure that pairs keys with values. It provides instantaneous **$O(1)$ average time complexity** for insertions, lookups, and deletions.

To picture this physically, imagine checking your coat at a theater coat check:
1. You hand your jacket to the clerk.
2. The clerk runs your name through a fixed rule, producing a specific number: ticket **#42** (the **Hash Code**).
3. The clerk places your coat directly onto metal hook **#42** (the **Bucket**).
4. When you return with ticket #42, the clerk does not search through thousands of jackets from left to right. They step directly to hook #42 and retrieve your coat in 1 single motion ($O(1)$ lookup).

```javascript
// Node.js code
"use strict";

const userAges = new Map();

// O(1) Key-value storage
userAges.set("Alice", 28);
userAges.set("Bob", 34);

// O(1) Instant retrieval
console.log(userAges.get("Alice")); // 28
console.log(userAges.has("Charlie")); // false
```

### 1.1 Hash Functions and Modulo Compression

Under the hood, a hash table stores items inside a regular contiguous array called a **bucket array**.

When you pass a key into a hash table:
1. The **hash function** deterministically converts the key (a string, number, or object) into a large integer called a hash code.
2. The hash table compresses that integer to fit within the bounds of its internal bucket array using the modulo operator:

$$\text{Bucket Index} = |\text{HashCode}| \pmod{\text{Capacity}}$$

```text
Key: "apple" ──► Hash Function ──► Hash Code: 93029210
Capacity = 8:   93029210 % 8 = 2 ──► Stored in Bucket Array Index [2]
```

Because calculating the hash and computing the modulo takes a fixed number of CPU operations, lookups take $O(1)$ constant time independent of the table's total size.

> [!NOTE]
> **Self-Check:** What happens if you run the same key through a hash function 100 times?  
> *Answer:* It must return the exact same hash code every time. Hash functions must be strictly deterministic; otherwise, you would store an item in one bucket and search for it in another.

---

### 1.2 Hash Collisions and Resolution

Because the universe of possible keys is infinitely large while bucket arrays are finite, two different keys will occasionally produce the exact same bucket index. This event is called a **hash collision** (guaranteed by the Pigeonhole Principle).

```text
Key "cat" ──► Hash % 8 ──► Index 4 ──┐
                                     ├──► COLLISION! Both target Index 4.
Key "act" ──► Hash % 8 ──► Index 4 ──┘
```

The two primary collision resolution strategies are:

#### Strategy A: Separate Chaining (Default in JavaScript Engines)
Each bucket slot holds a pointer to a linked list or dynamic array of key-value pairs:
* **Insertion:** Hash the key to find the bucket index. If other items exist at that bucket, append `[key, value]` to that bucket's list.
* **Lookup:** Hash the key to find the bucket index, then scan the small list in that bucket, comparing keys using strict equality (`===`).

```text
Bucket [4]: [ "cat", "feline" ] ──► [ "act", "verb" ] ──► null
```

#### Strategy B: Open Addressing (Linear Probing)
All key-value pairs live directly in the main array without linked lists. If slot $k$ is already occupied, the algorithm checks $k+1, k+2, \dots$ until it finds the first empty slot.
* **Drawback:** Suffers from **clustering**, where occupied slots form clumps that slow down future lookups toward $O(n)$.

---

### 1.3 Load Factor and Rehashing

The **load factor** ($\alpha$) measures how full the hash table is:

$$\alpha = \frac{n}{k} = \frac{\text{Number of Stored Entries}}{\text{Total Bucket Capacity}}$$

When $\alpha \ge 0.75$ (75% full), collisions multiply and bucket chains grow longer, degrading lookup speed from $O(1)$ toward $O(n)$.

To maintain $O(1)$ performance:
1. The table allocates a brand-new bucket array with **double capacity** ($2k$).
2. It **rehashes** every existing key using the new capacity and moves entries into their new slots.
3. Because capacity doubles geometrically, resizing happens rarely. Insertions remain **$O(1)$ amortized time**.

> [!NOTE]
> **Self-Check:** Why can't a hash table simply copy its old bucket array over when doubling capacity, like a dynamic array does?  
> *Answer:* Modulo compression depends directly on capacity ($\text{HashCode} \pmod{\text{Capacity}}$). Changing capacity from 8 to 16 changes the target bucket index for almost every key, requiring complete rehashing.

---

## 2. JavaScript Key-Value Collections

JavaScript provides three distinct built-in key-value collections: plain objects (`{}`), `Map`, and `Set`.

```text
┌───────────────────────┬─────────────────────────────┬─────────────────────────────┐
│ Collection            │ Stored Format               │ Primary Purpose             │
├───────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ Plain Object ({})     │ String / Symbol -> Any      │ Structured record data      │
│ ES6 Map               │ Any Type -> Any Type        │ Dynamic key-value cache     │
│ ES6 Set               │ Unique Values only          │ Membership & deduplication  │
└───────────────────────┴─────────────────────────────┴─────────────────────────────┘
```

### 2.1 Plain Objects vs Map

A plain JavaScript object (`{}`) is often used as a dictionary, but has three major flaws compared to `Map`:

```javascript
// 1. Prototype Collision Trap
const dict = {};
console.log("toString" in dict); // true! (Inherited from Object.prototype)

const cleanMap = new Map();
console.log(cleanMap.has("toString")); // false (Completely clean)

// 2. Key String Coercion Trap
const cache = {};
const user1 = { id: 1 };
const user2 = { id: 2 };

cache[user1] = "Profile A";
cache[user2] = "Profile B"; // Overwrites user1 because both coerce to "[object Object]"!
console.log(cache[user1]);  // "Profile B" (Data corrupted!)

const safeMap = new Map();
safeMap.set(user1, "Profile A");
safeMap.set(user2, "Profile B");
console.log(safeMap.get(user1)); // "Profile A" (Retains object reference identity)

// 3. Size Inspection
console.log(Object.keys(cache).length); // O(n) array allocation
console.log(safeMap.size);              // O(1) instant counter
```

#### V8 Hidden Classes and Dictionary Mode
In the V8 engine, plain objects begin in **Fast Properties Mode**, backed by C++ Hidden Classes (Shapes) with fixed memory offsets. When you add dynamic keys in loops or use the `delete` operator, V8 strips the hidden class and demotes the object to **Dictionary Mode** (slow hash table).

Always use `new Map()` for dynamic data storage with high key churn.

---

### 2.2 The ES6 Set

A **`Set`** is a collection of **unique values**. Duplicate insertions are ignored automatically. Looking up (`.has()`), adding (`.add()`), and removing (`.delete()`) values run in **$O(1)$ constant time**.

```javascript
const seen = new Set();

seen.add(10);
seen.add(20);
seen.add(10); // Duplicate! Ignored silently.

console.log(seen.size);    // 2
console.log(seen.has(10)); // true (O(1))

// Fast O(n) Array Deduplication
const rawNumbers = [4, 2, 2, 8, 4, 9];
const uniqueNumbers = Array.from(new Set(rawNumbers));
console.log(uniqueNumbers); // [ 4, 2, 8, 9 ]
```

---

### 2.3 WeakMap and WeakSet

Standard `Map` and `Set` maintain **strong references** to their keys. Even if the rest of your application discards all variables pointing to an object, a `Map` will keep the object alive in heap memory, creating a memory leak.

A **`WeakMap`** holds **weak references** exclusively to object keys:
* When your application drops its last reference to an object, the V8 garbage collector reclaims the object and its `WeakMap` entry automatically.
* Because entries can be cleaned up asynchronously at any moment, `WeakMap` is non-iterable and does not have a `.size` property.

```javascript
const requestMetadata = new WeakMap();

function logRequest(req) {
  requestMetadata.set(req, { receivedAt: Date.now() });
  // When Node.js finishes the HTTP response and destroys 'req',
  // requestMetadata frees the associated entry automatically without leaks!
}
```

---

### 2.4 Collections Reference Table

| Feature | Plain Object (`{}`) | ES6 `Map` | ES6 `Set` | `WeakMap` |
| :--- | :---: | :---: | :---: | :---: |
| **Key Types** | Strings and Symbols only | **Any JavaScript Type** | Values only | **Objects only** |
| **Lookup Time** | $O(1)$ average | **$O(1)$ average** | **$O(1)$ average** | **$O(1)$ average** |
| **Size Property** | $O(n)$ (`Object.keys`) | **$O(1)$ (`.size`)** | **$O(1)$ (`.size`)** | None |
| **Prototype Traps** | Yes (`toString` exists) | **No** | **No** | **No** |
| **Garbage Collection**| Strong reference | Strong reference | Strong reference | **Weak reference (Auto-GC)** |
| **Key Deletion** | `delete obj.k` (de-optimizes) | **`map.delete(k)` ($O(1)$)**| **`set.delete(v)` ($O(1)$)**| **`wm.delete(k)` ($O(1)$)** |
| **Iteration Order** | Arbitrary / Coerced | **Strict Insertion Order**| **Strict Insertion Order**| Non-iterable |

---

### 2.5 Essential Map and Set Methods

| Method | What It Does | Mutates Original? | Time Complexity | Quick Example |
| :--- | :--- | :---: | :---: | :--- |
| `map.set(key, val)` | Stores or updates entry | ✅ Yes | **$O(1)$** | `map.set("id", 42)` |
| `map.get(key)` | Retrieves value for key | ❌ No | **$O(1)$** | `map.get("id")` $\to$ `42` |
| `map.has(key)` | Verifies if key exists | ❌ No | **$O(1)$** | `map.has("id")` $\to$ `true` |
| `map.delete(key)` | Removes entry by key | ✅ Yes | **$O(1)$** | `map.delete("id")` |
| `map.size` | Returns count of entries | ❌ No | **$O(1)$** | `map.size` $\to$ `1` |
| `set.add(val)` | Appends unique value | ✅ Yes | **$O(1)$** | `set.add(99)` |
| `set.has(val)` | Checks if value is present | ❌ No | **$O(1)$** | `set.has(99)` $\to$ `true` |
| `set.delete(val)` | Removes value | ✅ Yes | **$O(1)$** | `set.delete(99)` |
| `set.size` | Returns count of unique items | ❌ No | **$O(1)$** | `set.size` $\to$ `1` |

---

## 3. Problem Walkthroughs

---

### 3.1 Design a Hash Map

#### 3.1.1 Problem Statement
Design a custom Hash Map without using any built-in hash map libraries. It must support:
* `put(key, value)`: Inserts a `(key, value)` pair into the hash map. If the key already exists, update the corresponding value.
* `get(key)`: Returns the value to which the specified key is mapped, or `-1` if this map contains no mapping for the key.
* `remove(key)`: Removes the key and its corresponding value if the map contains the mapping for the key.
* **Constraints:** $0 \le key, value \le 10^6$, at most $10^4$ operations. Keys must be handled with separate chaining.

#### 3.1.2 How to Think About It
Imagine a row of numbered pigeonhole boxes: `[0], [1], [2] ... [999]`.
When a letter arrives with address `key`:
1. Use a math formula (`key % 1000`) to determine which box number it belongs to.
2. Inside that box, keep an envelope holding slips of paper `[key, value]`.
3. If a slip already has that `key`, overwrite its value. Otherwise, drop the new slip into the envelope.
4. To retrieve, jump directly to that box number and look only at the few slips inside that envelope.

#### 3.1.3 Brute Force Approach & Bottleneck
A naive approach stores all key-value pairs in a single flat array `[[k1, v1], [k2, v2], ...]`.
* **The Bottleneck:** Finding a key requires scanning the entire array from start to finish ($O(n)$ time). Executing $10^4$ operations takes $10^8$ operations, causing significant latency.

#### 3.1.4 The Pattern Insight
Use an array of bucket lists (**Separate Chaining**). A prime number bucket capacity (like `1009`) distributes keys uniformly across slots. Looking up a key computes `key % 1009` in 1 CPU cycle, reducing the search space from $10,000$ items down to a tiny chain of $1$ or $2$ items ($O(1)$ average time).

#### 3.1.5 Pseudocode

```text
CLASS MyHashMap:
  CONSTRUCTOR():
    capacity = 1009
    buckets = Array of size capacity, each containing an empty list []

  FUNCTION hash(key):
    RETURN key MOD capacity

  FUNCTION put(key, value):
    index = hash(key)
    bucket = buckets[index]
    FOR each [k, v] in bucket:
      IF k == key:
        v = value
        RETURN
    bucket.append([key, value])

  FUNCTION get(key):
    index = hash(key)
    bucket = buckets[index]
    FOR each [k, v] in bucket:
      IF k == key:
        RETURN v
    RETURN -1

  FUNCTION remove(key):
    index = hash(key)
    bucket = buckets[index]
    FOR i FROM 0 TO length(bucket) - 1:
      IF bucket[i][0] == key:
        bucket.removeAt(i)
        RETURN
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Production-grade Hash Map with Separate Chaining
class MyHashMap {
  constructor() {
    this.capacity = 1009; // Prime number capacity minimizes collisions
    this.buckets = new Array(this.capacity).fill(null).map(() => []);
  }

  _hash(key) {
    return key % this.capacity;
  }

  put(key, value) {
    const bucket = this.buckets[this._hash(key)];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket[i][1] = value; // Update existing key
        return;
      }
    }
    bucket.push([key, value]); // Append new key-value pair
  }

  get(key) {
    const bucket = this.buckets[this._hash(key)];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        return bucket[i][1];
      }
    }
    return -1; // Key not found
  }

  remove(key) {
    const bucket = this.buckets[this._hash(key)];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket.splice(i, 1);
        return;
      }
    }
  }
}

// Example runs
const map = new MyHashMap();
map.put(1, 10);
map.put(2, 20);
console.log(map.get(1)); // 10
console.log(map.get(3)); // -1 (not found)
map.put(2, 25);          // Update existing
console.log(map.get(2)); // 25
map.remove(2);
console.log(map.get(2)); // -1
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Using a flat array indexed by key
class BuggyArrayMap {
  constructor() {
    this.data = []; // Allocating 1,000,001 slots for key = 1,000,000
  }
  put(key, value) {
    this.data[key] = value; // Burns massive heap memory and creates a holey array!
  }
}
```
* **Why it fails:** Direct indexing by key without hashing wastes huge amounts of memory when keys are sparse (e.g. key `1,000,000`), turning the array into a de-optimized holey array.

#### 3.1.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(1)}$ average for `put`, `get`, and `remove`. In the worst case where all keys collide into a single bucket, it degrades to $O(k)$ where $k$ is bucket chain length.
* **Auxiliary Space Complexity:** $\mathbf{O(n + c)}$, where $n$ is the number of inserted pairs and $c$ is the fixed bucket capacity ($1009$).

---

### 3.2 Array Deduplication and Frequency Tracking

#### 3.2.1 Problem Statement
Given an array of strings `words`, return the single most frequent word. If there is a tie, return the word that appeared first in the array.

* **Sample Input 1:** `words = ["apple", "banana", "apple", "cherry", "banana", "apple"]` $\to$ **Expected Output:** `"apple"`
* **Sample Input 2:** `words = ["dog", "cat", "dog", "cat"]` $\to$ **Expected Output:** `"dog"`
* **Constraints:** $1 \le words.length \le 10^5$, $1 \le words[i].length \le 20$.

#### 3.2.2 How to Think About It
Imagine cards with words written on them laid in a row.
Take a blank tally sheet.
1. As you pick up each card, check your tally sheet.
2. If the word is already on your sheet, add 1 tally mark next to it.
3. If it is new, write the word down with 1 mark.
4. Keep track of the highest count seen so far and the winning word.

#### 3.2.3 Brute Force Approach & Bottleneck
For each word, loop through the entire array to count how many times it appears using nested loops.
* **The Bottleneck:** Inspects $n$ elements for each of the $n$ words ($O(n^2)$ time). For $10^5$ items, $(10^5)^2 = 10^{10}$ comparisons, freezing the thread.

#### 3.2.4 The Pattern Insight
Use a **Map Frequency Table**. In a single linear pass ($O(n)$), increment the word's count in the map. As you build the map, maintain `maxCount` and `bestWord` in constant time ($O(1)$).

#### 3.2.5 Pseudocode

```text
FUNCTION MostFrequentWord(words):
  counts = new Map()
  maxCount = 0
  bestWord = words[0]

  FOR each word in words:
    currentCount = (counts.get(word) OR 0) + 1
    counts.set(word, currentCount)

    IF currentCount > maxCount:
      maxCount = currentCount
      bestWord = word

  RETURN bestWord
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(k) space frequency tracking
function mostFrequentWord(words) {
  if (!Array.isArray(words) || words.length === 0) return null;

  const counts = new Map();
  let maxCount = 0;
  let bestWord = words[0];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const newCount = (counts.get(word) || 0) + 1;
    counts.set(word, newCount);

    // Strictly greater preserves the first occurrence on ties
    if (newCount > maxCount) {
      maxCount = newCount;
      bestWord = word;
    }
  }

  return bestWord;
}

// Example runs
console.log(mostFrequentWord(["apple", "banana", "apple", "cherry", "banana", "apple"])); // "apple"
console.log(mostFrequentWord(["dog", "cat", "dog", "cat"]));                             // "dog"
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Plain object dictionary with prototype collision risk
function buggyFrequentWord(words) {
  const counts = {};
  for (const word of words) {
    counts[word] = (counts[word] || 0) + 1; // Fails if word is "toString" or "constructor"!
  }
}
```
* **Why it fails:** If `words` contains `"toString"`, `counts["toString"]` returns the built-in prototype function rather than `undefined`, resulting in string concatenation corruptions like `"function toString()...1"`.

#### 3.2.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. A single pass over $n$ words with $O(1)$ average map insertions.
* **Auxiliary Space Complexity:** $\mathbf{O(u)}$, where $u$ is the number of unique words stored in the map ($u \le n$).

---

### 3.3 Intersection of Two Arrays

#### 3.3.1 Problem Statement
Given two integer arrays `nums1` and `nums2`, return an array of their **unique intersection**. Elements in the result must be unique, and the result can be returned in any order.

* **Sample Input 1:** `nums1 = [1, 2, 2, 1]`, `nums2 = [2, 2]` $\to$ **Expected Output:** `[2]`
* **Sample Input 2:** `nums1 = [4, 9, 5]`, `nums2 = [9, 4, 9, 8, 4]` $\to$ **Expected Output:** `[9, 4]`
* **Constraints:** $1 \le nums1.length, nums2.length \le 1000$, $0 \le nums1[i], nums2[i] \le 1000$.

#### 3.3.2 How to Think About It
Imagine two separate trays of numbers.
1. Dump all numbers from Tray 1 into a collection bowl that automatically discards duplicate numbers.
2. Inspect numbers from Tray 2 one by one.
3. If a number is sitting in the bowl, move it to the output table and immediately remove it from the bowl.
4. Removing it guarantees that if Tray 2 has duplicate copies, you will not add it to the output table a second time.

#### 3.3.3 Brute Force Approach & Bottleneck
Compare every element in `nums1` against every element in `nums2` using nested loops ($O(n \times m)$) and deduplicate the final result array ($O(k^2)$).
* **The Bottleneck:** Quadratic pairwise comparisons.

#### 3.3.4 The Pattern Insight
Load `nums1` into an initial `Set` ($O(n)$ time). Then scan `nums2`: whenever `set.has(num)` is true, push `num` to `result` and immediately call `set.delete(num)` in $O(1)$ time. This guarantees result uniqueness without allocating a second deduplication set.

#### 3.3.5 Pseudocode

```text
FUNCTION Intersection(nums1, nums2):
  set1 = new Set(nums1)
  result = []

  FOR each num in nums2:
    IF set1.has(num):
      result.append(num)
      set1.delete(num) // Prevents duplicate matching

  RETURN result
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n + m) time, O(n) space intersection with in-flight deletion
function intersection(nums1, nums2) {
  if (!Array.isArray(nums1) || !Array.isArray(nums2)) return [];

  const set1 = new Set(nums1);
  const result = [];

  for (let i = 0; i < nums2.length; i++) {
    const num = nums2[i];
    if (set1.has(num)) {
      result.push(num);
      set1.delete(num); // In-flight deletion guarantees uniqueness in O(1)
    }
  }

  return result;
}

// Example runs
console.log(intersection([1, 2, 2, 1], [2, 2]));             // [ 2 ]
console.log(intersection([4, 9, 5], [9, 4, 9, 8, 4]));       // [ 9, 4 ]
console.log(intersection([1, 2, 3], [4, 5, 6]));             // []
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Using includes() inside filter()
function slowIntersection(nums1, nums2) {
  // BUG: nums2.includes() performs an O(m) linear scan for every element in nums1 -> O(n * m)!
  const duplicates = nums1.filter(x => nums2.includes(x));
  return Array.from(new Set(duplicates));
}
```
* **Why it fails:** Calling `.includes()` inside `.filter()` is a hidden nested loop with quadratic $O(n \times m)$ time complexity.

#### 3.3.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n + m)}$, where $n$ is `nums1.length` and $m$ is `nums2.length`. Adding items to `Set` takes $O(n)$, and iterating through `nums2` with $O(1)$ Set lookups and deletions takes $O(m)$.
* **Auxiliary Space Complexity:** $\mathbf{O(n)}$ auxiliary space to store distinct items of `nums1` in the Set.

---

## 4. Tricky Edge Cases

* **Object Reference Identity in Map/Set:** `set.add([1]).has([1])` evaluates to `false` because the two arrays represent distinct heap memory allocations. Always serialize compound keys to primitive strings (`[x, y].join(",")`) or retain the exact variable reference.
* **Falsy Value Storage:** Checking `if (map.get(key))` fails when the stored value is `0`, `false`, or `""`. Always use `map.has(key)` to verify entry existence.
* **Prototype Pollution on Plain Objects:** Plain objects inherit properties like `constructor` and `toString`. Checking `"toString" in obj` evaluates to `true`. Always use `Object.hasOwn(obj, key)` or `new Map()`.
* **String Coercion with Object Keys:** Assigning `obj[{id: 1}] = "A"` and `obj[{id: 2}] = "B"` causes key overwrite because both objects coerce to `"[object Object]"`. Use `Map` for non-string keys.
* **Memory Leaks in Long-Running Backends:** Retaining dynamic object references in a global `Map` prevents V8 garbage collection. Use `WeakMap` for request-scoped metadata.

---

## 5. Summary Cheat Sheet

* **Hash Table Core:** Maps keys to bucket array indices using a deterministic hash function and modulo compression ($\text{hash} \pmod{\text{capacity}}$).
* **Collision Handling:** Resolved via **Separate Chaining** (linked bucket lists) or **Open Addressing** (linear probing).
* **Load Factor Rule:** When $\alpha \ge 0.75$, the hash table allocates double capacity and rehashes all keys in **$O(1)$ amortized time**.
* **Plain Object vs Map:** Use `Map` for dynamic caches to support arbitrary key types, ensure prototype safety, track `.size` in $O(1)$, and prevent V8 dictionary mode de-optimizations.
* **Set Uniqueness:** Use `Set` for instant $O(1)$ membership checks and single-line array deduplication (`Array.from(new Set(arr))`).
* **In-Flight Set Deletion:** When finding unique intersections, calling `set.delete(val)` on matches guarantees uniqueness in $O(1)$ time without auxiliary result sets.

---

## 6. Practice Problems

### 6.1 First Unique Character - Easy / Warm-Up
Given a string `s`, find the first non-repeating character in it and return its index. If it does not exist, return `-1`.
* **Sample Input 1:** `s = "leetcode"` $\to$ **Expected Output:** `0`
* **Sample Input 2:** `s = "loveleetcode"` $\to$ **Expected Output:** `2`
* **Sample Input 3:** `s = "aabb"` $\to$ **Expected Output:** `-1`
* **Constraints:** $1 \le s.length \le 10^5$, `s` consists of only lowercase English letters.
* **Hint 1:** Build a frequency map of characters in a first pass.
* **Hint 2:** In a second pass over the string indices, return the first character whose frequency count equals 1.

---

### 6.2 Two Sum with Map - Easy / Core
Given an integer array `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. Assume exactly one solution exists.
* **Sample Input 1:** `nums = [2, 7, 11, 15]`, `target = 9` $\to$ **Expected Output:** `[0, 1]`
* **Sample Input 2:** `nums = [3, 2, 4]`, `target = 6` $\to$ **Expected Output:** `[1, 2]`
* **Constraints:** $2 \le nums.length \le 10^4$, $-10^9 \le nums[i] \le 10^9$.
* **Hint 1:** As you iterate, calculate the needed partner number: `complement = target - nums[i]`.
* **Hint 2:** Check if `complement` is already stored in your map before inserting `nums[i]`.

---

### 6.3 Custom Hash Table with Resizing - Medium / Advanced
Extend the custom `MyHashMap` class to support dynamic rehashing: when the load factor reaches $\ge 0.75$, double the bucket capacity and rehash all existing key-value pairs.
* **Sample Input:** Insert 4 items into capacity 4 $\to$ triggers resize to capacity 8.
* **Expected Output:** All 4 items remain accessible with valid values after capacity doubles.
* **Constraints:** Must handle collisions with separate chaining; all keys must be rehashed.
* **Hint 1:** Store old bucket lists in a temporary variable, re-initialize `this.buckets` with `capacity * 2`, and loop through the old entries calling `this.put(k, v)`.
* **Hint 2:** Remember to reset `this.size = 0` before re-inserting old items so the count stays accurate.

---

<nav aria-label="Lecture navigation">

[Previous: Searching & Elementary Sorting Algorithms](day-03-searching-and-sorting-algorithms.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Hash Table Patterns: Frequency, Complements & Duplicates](day-05-hash-patterns-frequency-counting-and-duplicates.md)

</nav>
