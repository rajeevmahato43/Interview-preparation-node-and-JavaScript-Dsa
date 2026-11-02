# Day 04: Objects, Maps, Sets & Hash Tables

<nav aria-label="Lecture navigation">

[Previous: Searching & Elementary Sorting Algorithms](day-03-searching-and-sorting-algorithms.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Hash Table Patterns: Frequency, Complements & Duplicates](day-05-hash-patterns-frequency-counting-and-duplicates.md)

</nav>

---

## 1. Hash Tables

A **hash table** (or hash map) is a data structure that connects keys to values. It lets you add, find, and delete items in fast **$O(1)$ average time**.

To picture this in real life, imagine checking your coat at a theater coat check:
1. You hand your jacket to the clerk.
2. The clerk uses your name to give you a specific ticket number: ticket **#42** (the **Hash Code**).
3. The clerk hangs your coat directly onto metal hook **#42** (the **Bucket**).
4. When you come back with ticket #42, the clerk does not search through thousands of jackets from left to right. They walk directly to hook #42 and hand you your coat in 1 quick step ($O(1)$ lookup).

```javascript
// Node.js code
"use strict";

const userAges = new Map();

// O(1) Fast key-value storage
userAges.set("Alice", 28);
userAges.set("Bob", 34);

// O(1) Fast lookup
console.log(userAges.get("Alice")); // 28
console.log(userAges.has("Charlie")); // false
```

### 1.1 Hash Functions and Modulo Compression

Under the hood, a hash table stores items inside a regular array called a **bucket array**.

When you give a key to a hash table:
1. The **hash function** turns the key (like a word or number) into a large integer called a hash code.
2. The hash table shrinks that large integer using the remainder operator (`%`) so it fits inside its internal bucket array:

$$\text{Bucket Index} = |\text{HashCode}| \pmod{\text{Capacity}}$$

```text
Key: "apple" ──► Hash Function ──► Hash Code: 93029210
Capacity = 8:   93029210 % 8 = 2 ──► Stored in Bucket Array Index [2]
```

Because calculating the hash code and finding the remainder takes a fixed number of quick steps, looking up an item takes fast $O(1)$ time no matter how large the table is.

> [!NOTE]
> **Self-Check:** What happens if you run the same key through a hash function 100 times?  
> *Answer:* It must return the exact same hash code every single time. Hash functions must be predictable; otherwise, you would store an item in one bucket and search for it in another.

---

### 1.2 Hash Collisions and Resolution

Because there are an endless number of possible words and keys, but only a limited number of buckets in an array, two different keys will sometimes end up with the exact same bucket index. This is called a **hash collision**.

```text
Key "cat" ──► Hash % 8 ──► Index 4 ──┐
                                     ├──► COLLISION! Both target Index 4.
Key "act" ──► Hash % 8 ──► Index 4 ──┘
```

The two main ways to handle collisions are:

#### Strategy A: Separate Chaining (Used in JavaScript Engines)
Each bucket slot holds a small list of key-value pairs:
* **To Add:** Find the bucket index with the hash formula. If other items are already in that bucket, add the new `[key, value]` pair to that bucket's small list.
* **To Find:** Find the bucket index, then look through that bucket's small list using strict equality (`===`) to find the matching key.

```text
Bucket [4]: [ "cat", "feline" ] ──► [ "act", "verb" ] ──► null
```

#### Strategy B: Open Addressing (Linear Probing)
All items are stored directly in the main array. If slot $k$ is already taken, the code checks slot $k+1, k+2, \dots$ until it finds the first empty slot.
* **Drawback:** Slots can clump together in groups, which slows down future searches toward $O(n)$.

---

### 1.3 Load Factor and Rehashing

The **load factor** ($\alpha$) tells us how full the hash table is:

$$\alpha = \frac{\text{Number of Stored Items}}{\text{Total Bucket Capacity}}$$

When the table becomes 75% full ($\alpha \ge 0.75$), collisions happen much more often, and searching starts to slow down from $O(1)$ toward $O(n)$.

To keep lookups fast:
1. The table creates a brand-new bucket array with **double the capacity**.
2. It **rehashes** every existing key using the new capacity and places items into their new slots.
3. Because doubling the capacity happens only once in a while, adding an item remains **$O(1)$ average time**.

> [!NOTE]
> **Self-Check:** Why can't a hash table just copy its old bucket array over when doubling size, like a normal array does?  
> *Answer:* The remainder math depends on capacity ($\text{HashCode} \pmod{\text{Capacity}}$). Changing capacity from 8 to 16 changes the bucket index for almost every key, so every item must be re-placed.

---

## 2. JavaScript Key-Value Collections

JavaScript gives us three main built-in collections: plain objects (`{}`), `Map`, and `Set`.

```text
┌───────────────────────┬─────────────────────────────┬─────────────────────────────┐
│ Collection            │ What It Stores              │ Main Use                    │
├───────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ Plain Object ({})     │ Words / Symbols -> Any data │ Structured records          │
│ ES6 Map               │ Any Type -> Any data        │ Fast key-value cache        │
│ ES6 Set               │ Unique values only          │ Checking existence and dedup│
└───────────────────────┴─────────────────────────────┴─────────────────────────────┘
```

### 2.1 Plain Objects vs Map

A plain JavaScript object (`{}`) is often used like a dictionary, but it has three big traps compared to `Map`:

```javascript
// 1. Prototype Names Trap
const dict = {};
console.log("toString" in dict); // true! (Inherited from JavaScript's Object prototype)

const cleanMap = new Map();
console.log(cleanMap.has("toString")); // false (Completely clean and safe)

// 2. Object Keys Converted to Strings Trap
const cache = {};
const user1 = { id: 1 };
const user2 = { id: 2 };

cache[user1] = "Profile A";
cache[user2] = "Profile B"; // Overwrites user1 because both become "[object Object]"!
console.log(cache[user1]);  // "Profile B" (Corrupted data!)

const safeMap = new Map();
safeMap.set(user1, "Profile A");
safeMap.set(user2, "Profile B");
console.log(safeMap.get(user1)); // "Profile A" (Keeps each object separate)

// 3. Finding Total Size
console.log(Object.keys(cache).length); // Slow O(n) array creation
console.log(safeMap.size);              // Instant O(1) count
```

#### V8 Hidden Classes and Dictionary Mode
The JavaScript engine optimizes objects assuming their shapes do not change. When you keep adding random keys in loops or use the `delete` keyword, the engine turns the object into a slower dictionary mode.  
Always use `new Map()` when you need a fast dynamic cache with keys being added and removed often.

---

### 2.2 The ES6 Set

A **`Set`** is a list of **unique values**. If you try to add an item that is already in the set, it is ignored automatically. Checking (`.has()`), adding (`.add()`), and removing (`.delete()`) take fast **$O(1)$ time**.

```javascript
const seen = new Set();

seen.add(10);
seen.add(20);
seen.add(10); // Duplicate! Ignored automatically.

console.log(seen.size);    // 2
console.log(seen.has(10)); // true (Fast O(1) check)

// Removing duplicates from an array in one line:
const rawNumbers = [4, 2, 2, 8, 4, 9];
const uniqueNumbers = Array.from(new Set(rawNumbers));
console.log(uniqueNumbers); // [ 4, 2, 8, 9 ]
```

---

### 2.3 WeakMap and WeakSet

Normal `Map` and `Set` hold onto their objects tightly. Even if the rest of your app has deleted an object, a `Map` will keep it alive in memory, which can cause memory leaks.

A **`WeakMap`** holds objects loosely (weak references):
* When your app no longer uses an object anywhere else, JavaScript cleans it out of memory automatically.
* Because items can disappear at any time, a `WeakMap` cannot be looped over and does not have a `.size` property.

```javascript
const requestMetadata = new WeakMap();

function logRequest(req) {
  requestMetadata.set(req, { receivedAt: Date.now() });
  // When Node.js finishes the HTTP request and destroys 'req',
  // requestMetadata cleans up its entry automatically without memory leaks!
}
```

---

### 2.4 Collections Reference Table

| Feature | Plain Object (`{}`) | ES6 `Map` | ES6 `Set` | `WeakMap` |
| :--- | :---: | :---: | :---: | :---: |
| **Key Types** | Strings and Symbols only | **Any JavaScript Type** | Values only | **Objects only** |
| **Lookup Time** | $O(1)$ average | **$O(1)$ average** | **$O(1)$ average** | **$O(1)$ average** |
| **Size Property** | $O(n)$ (`Object.keys`) | **$O(1)$ (`.size`)** | **$O(1)$ (`.size`)** | None |
| **Built-in Prototype Traps** | Yes (`toString` exists) | **No** | **No** | **No** |
| **Memory Cleanup**| Keeps object in memory | Keeps object in memory | Keeps object in memory | **Cleans up automatically** |
| **Delete Key** | `delete obj.k` (slows engine) | **`map.delete(k)` ($O(1)$)**| **`set.delete(v)` ($O(1)$)**| **`wm.delete(k)` ($O(1)$)** |
| **Iteration Order** | Not guaranteed | **Keeps Insertion Order**| **Keeps Insertion Order**| Cannot loop over |

---

### 2.5 Essential Map and Set Methods

| Method | What It Does | Changes Original? | Time Complexity | Quick Example |
| :--- | :--- | :---: | :---: | :--- |
| `map.set(key, val)` | Saves or updates item | ✅ Yes | **$O(1)$** | `map.set("id", 42)` |
| `map.get(key)` | Reads value for key | ❌ No | **$O(1)$** | `map.get("id")` $\to$ `42` |
| `map.has(key)` | Checks if key exists | ❌ No | **$O(1)$** | `map.has("id")` $\to$ `true` |
| `map.delete(key)` | Removes key and its value | ✅ Yes | **$O(1)$** | `map.delete("id")` |
| `map.size` | Returns count of items | ❌ No | **$O(1)$** | `map.size` $\to$ `1` |
| `set.add(val)` | Adds a unique item | ✅ Yes | **$O(1)$** | `set.add(99)` |
| `set.has(val)` | Checks if item is in set | ❌ No | **$O(1)$** | `set.has(99)` $\to$ `true` |
| `set.delete(val)` | Removes item | ✅ Yes | **$O(1)$** | `set.delete(99)` |
| `set.size` | Returns count of items | ❌ No | **$O(1)$** | `set.size` $\to$ `1` |

---

## 3. Problem Walkthroughs

---

### 3.1 Design a Hash Map

#### 3.1.1 Problem Statement
Design a custom Hash Map without using any built-in hash map tools. It must support:
* `put(key, value)`: Inserts a `(key, value)` pair into the hash map. If the key already exists, update its value.
* `get(key)`: Returns the value for the key, or `-1` if the key is not in the map.
* `remove(key)`: Removes the key and its value from the map.
* **Constraints:** $0 \le key, value \le 10^6$, at most $10^4$ operations. Handle collisions using separate chaining.

#### 3.1.2 How to Think About It
Imagine a row of numbered pigeonhole boxes: `[0], [1], [2] ... [999]`.  
When a note arrives with a `key`:
1. Use a simple math formula (`key % 1000`) to find out which box it belongs to.
2. Inside that box, keep an envelope holding slips of paper: `[key, value]`.
3. If an existing slip in that envelope already has that `key`, update its value. Otherwise, drop the new slip into the envelope.
4. To find a key, jump straight to that box number and check only the few slips inside that envelope.

#### 3.1.3 Brute Force Approach & Bottleneck
A naive way puts all key-value pairs in a single flat list: `[[k1, v1], [k2, v2], ...]`.
* **The Bottleneck:** Finding a key means scanning through the entire list from start to finish ($O(n)$ time). Doing $10,000$ operations this way takes $100,000,000$ steps, which is very slow.

#### 3.1.4 The Pattern Insight
Use an array of bucket lists (**Separate Chaining**). A prime number bucket size (like `1009`) spreads keys out evenly. Looking up a key calculates `key % 1009` in 1 quick step, reducing the search from $10,000$ items down to just $1$ or $2$ items ($O(1)$ average time).

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
* **Why it fails:** Using the key directly as an array index without hashing wastes huge amounts of memory when numbers are large (like key `1,000,000`). It turns the array into an inefficient holey array.

#### 3.1.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(1)}$ average for `put`, `get`, and `remove`. In the rare worst case where all keys land in the same bucket, it takes $O(k)$ time where $k$ is the length of that bucket's list.
* **Auxiliary Space Complexity:** $\mathbf{O(n + c)}$, where $n$ is the number of stored pairs and $c$ is the fixed bucket size ($1009$).

---

### 3.2 Array Deduplication and Frequency Tracking

#### 3.2.1 Problem Statement
Given an array of words `words`, find the single most frequent word. If there is a tie, return the word that appeared first in the array.

* **Sample Input 1:** `words = ["apple", "banana", "apple", "cherry", "banana", "apple"]` $\to$ **Expected Output:** `"apple"`
* **Sample Input 2:** `words = ["dog", "cat", "dog", "cat"]` $\to$ **Expected Output:** `"dog"`
* **Constraints:** $1 \le words.length \le 10^5$, $1 \le words[i].length \le 20$.

#### 3.2.2 How to Think About It
Imagine word cards placed in front of you on a table.  
Take a blank piece of paper to keep tally marks:
1. As you pick up each card, check your tally sheet.
2. If the word is already on your sheet, add 1 tally mark next to it.
3. If it is new, write the word down with 1 mark.
4. Keep track of the highest count you have seen so far and the winning word.

#### 3.2.3 Brute Force Approach & Bottleneck
For each word, search through the whole list to count how many times it appears using two nested loops.
* **The Bottleneck:** Checks $n$ words for each of the $n$ words ($O(n^2)$ time). For $100,000$ items, this takes $10,000,000,000$ comparisons, freezing your code.

#### 3.2.4 The Pattern Insight
Use a **Map to count frequencies**. In one pass through the list ($O(n)$), add 1 to the word's count in the map. As you go, keep track of `maxCount` and `bestWord` in fast $O(1)$ time.

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
* **Why it fails:** If the list contains `"toString"`, checking `counts["toString"]` finds JavaScript's built-in function instead of an empty spot. Using `new Map()` avoids this bug completely.

#### 3.2.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. One pass through $n$ words with fast $O(1)$ map lookups and updates.
* **Auxiliary Space Complexity:** $\mathbf{O(u)}$, where $u$ is the number of unique words in the list ($u \le n$).

---

### 3.3 Intersection of Two Arrays

#### 3.3.1 Problem Statement
Given two integer arrays `nums1` and `nums2`, return an array of their **unique shared numbers**. Each number in the result must appear only once, and you can return the numbers in any order.

* **Sample Input 1:** `nums1 = [1, 2, 2, 1]`, `nums2 = [2, 2]` $\to$ **Expected Output:** `[2]`
* **Sample Input 2:** `nums1 = [4, 9, 5]`, `nums2 = [9, 4, 9, 8, 4]` $\to$ **Expected Output:** `[9, 4]`
* **Constraints:** $1 \le nums1.length, nums2.length \le 1000$, $0 \le nums1[i], nums2[i] \le 1000$.

#### 3.3.2 How to Think About It
Imagine two separate trays of numbers.
1. Dump all numbers from Tray 1 into a collection bowl that automatically discards duplicate numbers.
2. Check numbers from Tray 2 one by one.
3. If a number is sitting in the bowl, move it to your output list and immediately take it out of the bowl.
4. Taking it out makes sure that if Tray 2 has duplicate copies, you will not add it to the output list a second time.

#### 3.3.3 Brute Force Approach & Bottleneck
Compare every number in `nums1` against every number in `nums2` using nested loops ($O(n \times m)$) and then clean up duplicates at the end ($O(k^2)$).
* **The Bottleneck:** Checking every pair is slow quadratic work.

#### 3.3.4 The Pattern Insight
Put all numbers from `nums1` into a `Set` ($O(n)$ time). Then walk through `nums2`: whenever `set.has(num)` is true, add `num` to `result` and immediately call `set.delete(num)` in $O(1)$ time. This guarantees each matching number is only saved once.

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
* **Why it fails:** Calling `.includes()` inside `.filter()` is a hidden nested loop that runs in slow quadratic $O(n \times m)$ time.

#### 3.3.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n + m)}$, where $n$ is `nums1.length` and $m$ is `nums2.length`. Adding items to the Set takes $O(n)$, and walking through `nums2` with $O(1)$ lookups takes $O(m)$.
* **Auxiliary Space Complexity:** $\mathbf{O(n)}$ to store the unique numbers from `nums1` in the Set.

---

## 4. Tricky Edge Cases

* **Objects as Keys in Set/Map:** `set.add([1]).has([1])` returns `false` because the two arrays are two separate objects in memory with different addresses. Convert pairs to strings (like `[x, y].join(",")`) if you need to use coordinates as keys.
* **Zeros and Falsy Values:** Writing `if (map.get(key))` fails if the stored value is `0`, `false`, or `""`. Always use `map.has(key)` to check if a key exists.
* **Built-in Names on Plain Objects:** Plain objects inherit properties like `constructor` and `toString`. Checking `"toString" in obj` returns `true`. Always use `new Map()` or `Object.hasOwn()`.
* **Objects as Keys on Plain Objects:** Writing `obj[{id: 1}] = "A"` and `obj[{id: 2}] = "B"` overwrites the first value because plain objects turn both keys into `"[object Object]"`. Use `new Map()` for non-string keys.
* **Preventing Memory Leaks:** Storing objects in a global `Map` keeps them in memory forever. Use `WeakMap` if you want objects to be cleaned up when no longer used elsewhere in your app.

---

## 5. Summary Cheat Sheet

* **Hash Table Core:** Connects keys to array bucket spots using a hash code and remainder math ($\text{hash} \pmod{\text{capacity}}$).
* **Handling Collisions:** Solved with **Separate Chaining** (small lists at each slot) or **Open Addressing** (checking the next slot).
* **Load Factor:** When a table becomes 75% full, it doubles its size and moves all items to keep lookups running in **$O(1)$ average time**.
* **Plain Objects vs Map:** Use `Map` for dynamic key-value caches to support any key type, avoid prototype bugs, and read `.size` in $O(1)$ time.
* **Set Uniqueness:** Use `Set` for instant $O(1)$ checks and one-line array deduplication (`Array.from(new Set(arr))`).
* **Deleting While Matching:** When finding shared items between two lists, calling `set.delete(val)` on a match guarantees uniqueness in $O(1)$ time without extra memory.

---

## 6. Practice Problems

### 6.1 First Unique Character - Easy / Warm-Up
Given a string `s`, find the first non-repeating character in it and return its index. If it does not exist, return `-1`.
* **Sample Input 1:** `s = "leetcode"` $\to$ **Expected Output:** `0`
* **Sample Input 2:** `s = "loveleetcode"` $\to$ **Expected Output:** `2`
* **Sample Input 3:** `s = "aabb"` $\to$ **Expected Output:** `-1`
* **Constraints:** $1 \le s.length \le 10^5$, `s` consists of only lowercase English letters.
* **Hint 1:** Count how many times each character appears using a frequency map in your first pass.
* **Hint 2:** In a second pass through the string, return the index of the first character whose count is 1.

---

### 6.2 Two Sum with Map - Easy / Core
Given an array of numbers `nums` and a target sum `target`, find the indices of the two numbers that add up to `target`. Assume exactly one correct pair exists.
* **Sample Input 1:** `nums = [2, 7, 11, 15]`, `target = 9` $\to$ **Expected Output:** `[0, 1]`
* **Sample Input 2:** `nums = [3, 2, 4]`, `target = 6` $\to$ **Expected Output:** `[1, 2]`
* **Constraints:** $2 \le nums.length \le 10^4$, $-10^9 \le nums[i] \le 10^9$.
* **Hint 1:** As you loop through the numbers, find the partner number needed: `complement = target - nums[i]`.
* **Hint 2:** Check if `complement` is already in your map before adding the current number.

---

### 6.3 Custom Hash Table with Resizing - Medium / Advanced
Add automatic resizing to the `MyHashMap` class: when the table becomes $\ge 75\%$ full, double the bucket capacity and rehash all key-value pairs.
* **Sample Input:** Add 4 items into capacity 4 $\to$ triggers resize to capacity 8.
* **Expected Output:** All 4 items remain accessible with valid values after the capacity doubles.
* **Constraints:** Must handle collisions with separate chaining; all keys must be rehashed.
* **Hint 1:** Save old bucket lists in a temporary variable, re-create `this.buckets` with `capacity * 2`, and loop through the old items calling `this.put(k, v)`.
* **Hint 2:** Reset `this.size = 0` before re-adding old items so the count stays accurate.

---

<nav aria-label="Lecture navigation">

[Previous: Searching & Elementary Sorting Algorithms](day-03-searching-and-sorting-algorithms.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Hash Table Patterns: Frequency, Complements & Duplicates](day-05-hash-patterns-frequency-counting-and-duplicates.md)

</nav>
