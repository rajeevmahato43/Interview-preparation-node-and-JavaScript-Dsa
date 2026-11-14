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

An array stores items using numbers as indices: `array[0]`, `array[1]`, `array[2]`. But in real programs, our keys are words like `"apple"`, `"user_101"`, or `"sessionId"`.

How does a computer take a word like `"apple"` and find its exact array slot in 1 quick step, without checking slots one by one?

It uses a two-step bridge:
1. **The Hash Function:** Turns any word or key into a large integer called a **hash code**.
2. **Modulo Compression:** Shrinks that large integer so it fits inside the actual size of the internal array.

```text
Key: "cat" ──► Hash Function ──► Large Hash Code: 98262 ──► Modulo (% 8) ──► Bucket Index: 6
```

#### Step 1: Turning Letters into Numbers
Computers do not store letters directly; they only store numbers. Every character has a standard integer code (called an ASCII or Unicode character code). For example, in JavaScript:
* `'c'.charCodeAt(0)` is `99`
* `'a'.charCodeAt(0)` is `97`
* `'t'.charCodeAt(0)` is `116`

Why can't we just add the character codes together?
* `'c' + 'a' + 't' = 99 + 97 + 116 = 312`
* What about `"act"`? `'a' + 'c' + 't' = 97 + 99 + 116 = 312`!

If we only add the numbers, every anagram (words made with the exact same letters) produces the exact same number and collides.

To prevent this, a real hash function multiplies the running total by a prime number (like `31`) at each letter:
1. Start with `hash = 0`.
2. First letter `'c'` ($99$): $(0 \times 31) + 99 = 99$.
3. Second letter `'a'` ($97$): $(99 \times 31) + 97 = 3166$.
4. Third letter `'t'` ($116$): $(3166 \times 31) + 116 = 98262$.

Because the position of each letter changes the multiplication, `"cat"` becomes `98262`, while `"act"` becomes `96402`. They get completely different numbers!

#### Step 2: Modulo Compression
A computer cannot allocate an array with `98262` slots just to store the word `"cat"`. That would waste megabytes of RAM for one word.

Instead, a hash table starts with a small internal array (for example, `capacity = 8`).

We shrink the large integer using the remainder operator (`%`):

$$\text{Bucket Index} = |\text{HashCode}| \pmod{\text{Capacity}}$$

Think of an analog 12-hour wall clock:
* If 13 hours pass, the clock wraps around: $13 \pmod{12} = 1$ o'clock.
* If 25 hours pass, the clock wraps around: $25 \pmod{12} = 1$ o'clock.

The remainder operator guarantees that no matter how huge the hash code is, the resulting bucket index always lands inside the safe range `0` to `Capacity - 1`:

$$98262 \pmod{8} = 6 \implies \text{Stored in Bucket Array Index [6]}$$

```javascript
// Step-by-step Hash Function with Modulo Compression
function simpleHash(key, capacity) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    // Multiply by prime number 31 and add character code
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0; // >>> 0 keeps it a positive 32-bit integer
  }
  // Modulo compression maps hash to a valid array index
  return hash % capacity;
}

const capacity = 8;
console.log("cat -> bucket index:", simpleHash("cat", capacity)); // 6
console.log("act -> bucket index:", simpleHash("act", capacity)); // 2
console.log("dog -> bucket index:", simpleHash("dog", capacity)); // 4
```

#### How Storing and Looking Up Connect
* **To Save (`set("cat", "feline")`):** Run the hash math on `"cat"` $\to$ get index `6` $\to$ place `["cat", "feline"]` at `bucket[6]`.
* **To Find (`get("cat")`):** Run the exact same hash math on `"cat"` $\to$ get index `6` $\to$ jump straight to `bucket[6]` in 1 step!

You never scan the other 7 slots. That is why hash table operations run in fast **$O(1)$ time**.

#### The 3 Rules of a Good Hash Function
* **Predictable (Deterministic):** The same key must produce the exact same index every single time.
* **Fast:** Runs in tiny constant steps ($O(L)$ where $L$ is word length), regardless of how many millions of items are stored.
* **Uniform Distribution:** Spreads items evenly across all buckets so they do not pile up in one spot.

> [!NOTE]
> **Self-Check:** What would happen if a hash function included `Math.random()` in its calculation?  
> *Answer:* You would store your data in one bucket (e.g. index 3) and search for it in another bucket (e.g. index 7). The hash table would never find your saved data.

---

### 1.2 Hash Collisions and Resolution

Even with the best hash function, two different keys will sometimes produce the exact same bucket index. This is called a **hash collision**.

```text
Key "cat" ──► Hash % 8 ──► Index 6 ──┐
                                     ├──► COLLISION! Both keys target Index 6.
Key "sun" ──► Hash % 8 ──► Index 6 ──┘
```

#### Why Collisions Are 100% Unavoidable
Imagine you have 8 mailboxes and 9 letters. Even if you try your best to spread them out, at least one mailbox must receive 2 letters. This is a mathematical rule called the **Pigeonhole Principle**.

Because there are endless possible strings in the world, but our computer array has a fixed capacity (like 8 or 16 buckets), collisions are guaranteed to happen.

Engines resolve collisions using two main strategies:

#### Strategy A: Separate Chaining (Used by JavaScript Engines and Java)
Instead of storing a single item in each bucket slot, every slot in the bucket array holds a small list (or array) of key-value pairs:

```text
Bucket Array:
[0]: null
[1]: null
[2]: [ ["act", "verb"] ] ──► null
[3]: null
[4]: [ ["dog", "canine"] ] ──► null
[5]: null
[6]: [ ["cat", "feline"] ] ──► [ ["sun", "star"] ] ──► null
[7]: null
```

* **To Add (`set`):**
  1. Calculate the bucket index using the hash formula.
  2. Walk through that bucket's small list.
  3. If the key already exists, update its value.
  4. If the key is not in the list, append the new `[key, value]` pair to that bucket.
* **To Find (`get`):**
  1. Calculate the bucket index.
  2. Jump straight to that bucket slot in 1 step.
  3. Check the few items in that bucket's list one by one using strict equality (`key === targetKey`).
  4. Return the matching value. If the key is not in that bucket, return `undefined`.

**Why Separate Chaining Stays Fast ($O(1)$ Average):**  
As long as the table resizes before getting too full, each bucket's list holds only 1 or 2 items on average. Checking a list of 1 or 2 items takes almost zero time.

#### Strategy B: Open Addressing (Linear Probing)
No extra lists are used. Every item is stored directly inside the main array.

If slot $k$ is already occupied by a different key:
1. Step to the right: check slot $k + 1$.
2. If slot $k + 1$ is taken, check $k + 2, k + 3, \dots$
3. Place the item in the first empty slot found.

```text
Slot [6] already holds "cat".
Trying to insert "sun" (hashes to 6):
Index 6 is taken! ──► Check Index 7 ──► Index 7 is empty ──► Store "sun" in Index [7]
```

* **To Find (`get`):** Jump to slot $k$. If it holds a different key, keep stepping right until you find your key or hit an empty slot (which means the key does not exist).
* **The 2 Big Bottlenecks of Linear Probing:**
  1. **Clustering (Traffic Jams):** Occupied slots bunch together into long continuous chains. New items take more and more steps to find an empty slot, slowing the table down toward $O(n)$.
  2. **Deletions Need "Tombstones":** If you delete an item from slot 6, you cannot set it to `null`. If you do, searching for `"sun"` will hit the empty slot 6 and stop early, falsely reporting that `"sun"` is missing! You must leave a special marker called a **tombstone** (`"DELETED"`).

#### Separate Chaining vs Open Addressing

| Feature | Separate Chaining (V8 Engine) | Open Addressing (Linear Probing) |
| :--- | :--- | :--- |
| **Storage Location** | Each bucket holds a small list of pairs | All items live directly in the main array |
| **When Colliding** | Appends pair to the bucket's list | Steps right ($k+1, k+2$) to find an empty slot |
| **When Nearly Full** | Slows down gracefully | Slows down drastically due to clustering |
| **Deleting Items** | Easy: remove pair from the bucket list | Hard: requires leaving tombstone markers |
| **Memory Behavior** | Extra memory for small list nodes | Stored side-by-side in one simple array |

> [!NOTE]
> **Self-Check:** In Separate Chaining, why do we store both the key and the value `[key, value]` in the bucket list, instead of just the value?  
> *Answer:* Because multiple keys can land in the same bucket. When looking up an item, we must check the key of each pair to know which value belongs to our search.

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

Normal `Map` and `Set` hold **strong references** to their contents. As long as a `Map` or `Set` exists, JavaScript will never clean up the objects stored inside it, even if the rest of your program has completely finished with them.

In a long-running Node.js backend server (such as an Express or Fastify API), this creates serious **memory leaks**:

```javascript
// The Memory Leak Trap with Normal Map
const userCache = new Map();

function loginUser() {
  let sessionUser = { id: 101, name: "Alice" };
  userCache.set(sessionUser, { loggedInAt: Date.now() });

  // Later, the user logs out:
  sessionUser = null; // We clear our local variable...
  // BUT userCache STILL holds a strong reference to { id: 101 }!
  // The V8 garbage collector CANNOT free this memory.
  // Over time, memory usage grows until the server crashes (Out Of Memory).
}
```

#### What "Weak" Means: The Leash Analogy
* **Strong Reference (`Map`, `Set`, regular variables):** Holding a dog on a thick leash. As long as you hold the leash, the dog cannot run away, even if everyone else in the house walks out the door.
* **Weak Reference (`WeakMap`, `WeakSet`):** Pointing your finger at a bird sitting on a branch. You are observing it, but you are not holding it down. If nobody else ties the bird down, it flies away whenever it wants. Once it flies away, the weak collection cleans up its own entry automatically!

#### The Two Universal Rules of Weak Collections
1. **Objects Only:**
   * Keys in a `WeakMap` **must be objects** (or non-registered symbols).
   * Values in a `WeakSet` **must be objects** (or non-registered symbols).
   * Primitive types (numbers, strings, booleans) are not allowed because primitives are copied by value and never garbage collected.
2. **Not Iterable (No Loops, No `.size`):**
   * You cannot loop over a `WeakMap` or `WeakSet` (`for...of` does not exist).
   * There is no `.size` property.
   * *Why?* Because garbage collection runs whenever the V8 engine feels like it. If `.size` existed, it could return `10` right now and `8` half a millisecond later. To prevent unpredictable bugs, reading the entire collection at once is forbidden.

---

#### 2.3.1 WeakMap in Depth
A **`WeakMap`** is a key-value collection where **every key must be an object held weakly**.

Supported methods:
* `weakMap.set(objectKey, value)`: Saves a value keyed by an object.
* `weakMap.get(objectKey)`: Reads the value for that object key.
* `weakMap.has(objectKey)`: Checks if the object key exists ($O(1)$).
* `weakMap.delete(objectKey)`: Removes the object key and value ($O(1)$).

##### Use Case 1: Attaching Metadata to Node.js HTTP Requests
In high-traffic backend servers, thousands of `req` (HTTP request) objects are created and destroyed every second. Often, middleware needs to attach temporary metadata (like start timers, authentication details, or tracing IDs):

```javascript
// ✅ CORRECT: Zero-leak request tracking with WeakMap
const requestTimings = new WeakMap();

function onRequestStart(req) {
  // Store start time keyed by the incoming req object
  requestTimings.set(req, { startTime: Date.now() });
}

function onRequestEnd(req) {
  const timing = requestTimings.get(req);
  if (timing) {
    const duration = Date.now() - timing.startTime;
    console.log(`Request completed in ${duration}ms`);
  }
  // When Node.js finishes the HTTP response and destroys 'req',
  // requestTimings automatically frees the entry from memory!
}

// Runnable test run
let mockReq = { url: "/api/products", method: "GET" };
onRequestStart(mockReq);
onRequestEnd(mockReq);

// Cleanup happens automatically when mockReq is dereferenced
mockReq = null;
```

##### Use Case 2: Truly Private Class Properties
Because standard JavaScript object properties can be inspected, you can use a `WeakMap` to keep private state completely invisible outside a class:

```javascript
// Truly private state using WeakMap
const privateData = new WeakMap();

class BankAccount {
  constructor(initialBalance) {
    // Store private balance keyed by 'this' instance
    privateData.set(this, { balance: initialBalance });
  }

  deposit(amount) {
    if (amount <= 0) return;
    const data = privateData.get(this);
    data.balance += amount;
  }

  getBalance() {
    return privateData.get(this).balance;
  }
}

const account = new BankAccount(100);
account.deposit(50);
console.log(account.getBalance()); // 150
console.log(account.balance);      // undefined (completely private!)
```

---

#### 2.3.2 WeakSet in Depth
A **`WeakSet`** is a collection of **unique objects held weakly**.

Supported methods:
* `weakSet.add(object)`: Adds an object to the set.
* `weakSet.has(object)`: Checks if the object exists in the set ($O(1)$).
* `weakSet.delete(object)`: Removes the object from the set ($O(1)$).

##### Use Case 1: Tagging Objects Without Modifying Them
Suppose you receive objects from a third-party library, or objects that are frozen with `Object.freeze()`. You need to know: *"Has this object already been validated?"*

Modifying foreign objects directly (e.g. `obj.isValidated = true`) causes bugs, and trying to mutate a frozen object throws an error in strict mode. A `WeakSet` solves this by tagging objects externally:

```javascript
// ✅ CORRECT: Tagging objects safely with WeakSet
const validatedObjects = new WeakSet();

function processSecurePayload(payload) {
  if (validatedObjects.has(payload)) {
    console.log("Payload already validated. Skipping check.");
    return;
  }

  // Perform validation check
  console.log("Validating payload for the first time...");

  // Tag the payload without mutating its properties!
  validatedObjects.add(payload);
}

// Works even on frozen objects!
const frozenPayload = Object.freeze({ transactionId: "TX_9921", amount: 500 });

processSecurePayload(frozenPayload); // Validating payload for the first time...
processSecurePayload(frozenPayload); // Payload already validated. Skipping check.
```

##### Use Case 2: Circular Reference Detection (Cycle Detection)
When serializing or cloning nested objects, an object that points back to itself causes an infinite loop and crashes with a stack overflow. A `WeakSet` tracks visited objects during recursion without leaking memory:

```javascript
// Detecting circular references in nested objects
function hasCycle(obj, visited = new WeakSet()) {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  // If we have already visited this object in the current path, a cycle exists!
  if (visited.has(obj)) {
    return true;
  }

  visited.add(obj);

  for (const key of Object.keys(obj)) {
    if (hasCycle(obj[key], visited)) {
      return true;
    }
  }

  return false;
}

const tree = { name: "Root", child: { name: "Leaf" } };
console.log("Tree has cycle:", hasCycle(tree)); // false

const looped = { name: "Node A" };
looped.self = looped; // Self-referencing circular loop!
console.log("Looped has cycle:", hasCycle(looped)); // true
```

---

#### 2.3.3 Map vs WeakMap vs Set vs WeakSet

| Feature | `Map` | `WeakMap` | `Set` | `WeakSet` |
| :--- | :--- | :--- | :--- | :--- |
| **Stores** | Key-Value pairs | Key-Value pairs | Unique values | Unique objects |
| **Allowed Keys / Items** | Any JavaScript type | **Objects only** | Any JavaScript type | **Objects only** |
| **Reference Type** | Strong (prevents GC) | **Weak (allows GC)** | Strong (prevents GC) | **Weak (allows GC)** |
| **Has `.size`?** | ✅ Yes ($O(1)$) | ❌ No | ✅ Yes ($O(1)$) | ❌ No |
| **Can Loop (`for...of`)?**| ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| **Primary Backend Use** | Caching, frequency counts | Request metadata, private data | Deduplication, fast checks | Tagging objects, cycle detection |

> [!NOTE]
> **Self-Check:** Can you use a string as a key in a `WeakMap` (e.g. `weakMap.set("user_1", data)`)?  
> *Answer:* No! Primitives like strings and numbers cannot be garbage collected. `WeakMap` keys must be objects (or non-registered symbols).

---

### 2.4 Collections Reference Table

| Feature | Plain Object (`{}`) | ES6 `Map` | ES6 `Set` | `WeakMap` | `WeakSet` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Key / Value Types** | Strings and Symbols | **Any JavaScript Type** | **Any JavaScript Type** | **Keys must be Objects** | **Values must be Objects** |
| **Lookup Time** | $O(1)$ average | **$O(1)$ average** | **$O(1)$ average** | **$O(1)$ average** | **$O(1)$ average** |
| **Size Property** | $O(n)$ (`Object.keys`) | **$O(1)$ (`.size`)** | **$O(1)$ (`.size`)** | None (No `.size`) | None (No `.size`) |
| **Built-in Prototype Traps** | Yes (`toString` exists) | **No** | **No** | **No** | **No** |
| **Memory Cleanup** | Keeps in memory | Keeps in memory | Keeps in memory | **Cleans up automatically** | **Cleans up automatically** |
| **Removal Method** | `delete obj.k` (slows engine) | **`map.delete(k)` ($O(1)$)** | **`set.delete(v)` ($O(1)$)** | **`wm.delete(k)` ($O(1)$)** | **`ws.delete(v)` ($O(1)$)** |
| **Iteration Order** | Not guaranteed | **Keeps Insertion Order** | **Keeps Insertion Order** | Cannot loop over | Cannot loop over |

---

### 2.5 Essential Collections Methods

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
| `wm.set(obj, val)` | WeakMap: saves value for object | ✅ Yes | **$O(1)$** | `wm.set(req, { time })` |
| `wm.get(obj)` | WeakMap: reads value for object | ❌ No | **$O(1)$** | `wm.get(req)` |
| `ws.add(obj)` | WeakSet: adds an object | ✅ Yes | **$O(1)$** | `ws.add(frozenReq)` |
| `ws.has(obj)` | WeakSet: checks if object exists | ❌ No | **$O(1)$** | `ws.has(frozenReq)` $\to$ `true` |

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
* **Preventing Memory Leaks with Weak Collections:** Storing objects in a global `Map` or `Set` keeps them in memory forever. Use `WeakMap` to store object metadata, or `WeakSet` to tag objects without mutating them, so items clean up automatically when no longer used elsewhere.

---

## 5. Summary Cheat Sheet

* **Hash Table Core:** Connects keys to array bucket spots using a hash code and remainder math ($\text{hash} \pmod{\text{capacity}}$).
* **Handling Collisions:** Solved with **Separate Chaining** (small lists at each slot) or **Open Addressing** (checking the next slot).
* **Load Factor:** When a table becomes 75% full, it doubles its size and moves all items to keep lookups running in **$O(1)$ average time**.
* **Plain Objects vs Map:** Use `Map` for dynamic key-value caches to support any key type, avoid prototype bugs, and read `.size` in $O(1)$ time.
* **Set Uniqueness:** Use `Set` for instant $O(1)$ checks and one-line array deduplication (`Array.from(new Set(arr))`).
* **WeakMap and WeakSet:** Hold objects weakly so the garbage collector can free them. Used for request metadata, class privacy, tagging objects, and detecting cycles without memory leaks.
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
