# Day 06: Frequency Counting and Hash Tables

<nav aria-label="Lecture navigation">

[Previous: Sorting and Searching Basics](day-05-sorting-and-searching-basics.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Sum and Hash Map Complements](day-07-two-sum-and-hash-complements.md)

</nav>
## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Asymptotic analysis, average vs worst-case complexity.
- [Day 02: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md) — JavaScript collection primitives and prototype traps.
- [Day 05: Sorting and Searching Basics](day-05-sorting-and-searching-basics.md) — Linear scans vs indexed lookups.
---

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             HASH TABLE BUCKET MAPPING & CHAINING                            │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Key: "user:101" ──> [ Hash Function ] ──> Hash Code: 849201 ──> Bucket Index: 849201 % 4 = 1

  BUCKET ARRAY:
  [0] null
  [1] [ "user:101", data ] ──> [ "user:942", data ]  <-- Separate Chaining for Collisions!
  [2] null
  [3] [ "user:405", data ]

  • Average Case: Hash function distributes keys uniformly -> O(1) per lookup.
  • Adversarial Worst Case: All keys collide into Bucket 1 -> O(n) linked list traversal.
```

## 1. Hash Table Architecture and Collision Mechanics

> **Hash Table**: A data structure that maps keys to bucket indices using a hash function, storing key-value pairs in memory.

A Hash Table is an associative data structure that stores key-value pairs and computes array indices using a hash function.

When an entry is stored:
1. **Hash Computation:** A deterministic hash function converts the key into a 32-bit integer hash code.
2. **Bucket Mapping:** The runtime calculates the bucket index via modulo arithmetic: `index = hashCode % bucketCount`.
3. **Collision Handling:** When two distinct keys map to the same bucket index (a collision), engines resolve it using **Separate Chaining** (linking entries in a list or balanced tree within that bucket) or **Open Addressing** (probing adjacent empty slots).

| Scenario | Lookup Complexity | Cause |
|---|---|---|
| **Average Case** | **$O(1)$** | Uniform key distribution across buckets; bucket chain length $\approx 1$. |
| **Worst Case (Degraded)** | **$O(n)$** | Hash collisions force all keys into a single bucket chain. |

---

## 2. The Frequency Counter Pattern ($O(n^2) \to O(n)$)

> **Frequency Counter Pattern**: An algorithmic design pattern that collects item counts in a hash map to compare or filter datasets in $O(n)$ time.

In many problems, questions arise such as:
- *"Does array A contain the exact same frequencies as array B?"*
- *"What is the first non-repeating character in a stream?"*
- *"Can string A construct string B?"*

The naive solution checks each element against all remaining elements using nested loops or `.indexOf()`, running in $O(n^2)$ time. The **Frequency Counter Pattern** solves this in linear time by decoupling the scan into two independent linear passes:
1. **Pass 1 ($O(n)$):** Iterate through the dataset and increment counts in a hash map.
2. **Pass 2 ($O(n)$):** Iterate through the candidate sequence and inspect the frequency map.

```javascript
// Node.js code
"use strict";

const text = "loveleetcode";

// ❌ ANTI-PATTERN: Nested scans via indexOf and lastIndexOf (O(n^2))
function findFirstUniqueSlow(str) {
  for (let i = 0; i < str.length; i++) {
    // indexOf and lastIndexOf each scan the full string!
    if (str.indexOf(str[i]) === str.lastIndexOf(str[i])) {
      return i;
    }
  }
  return -1;
}

// ✅ PATTERN: Frequency Counter in two linear passes (O(n) time, O(1) space)
function findFirstUniqueFast(str) {
  const counts = new Map();

  // Pass 1: Accumulate counts
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    counts.set(ch, (counts.get(ch) || 0) + 1);
  }

  // Pass 2: Identify the first character with frequency 1
  for (let i = 0; i < str.length; i++) {
    if (counts.get(str[i]) === 1) {
      return i;
    }
  }

  return -1;
}

console.log("Slow result:", findFirstUniqueSlow(text)); // 2 ('v')
console.log("Fast result:", findFirstUniqueFast(text)); // 2 ('v')
```

---

## 3. Collection Selection: Plain Object vs `Map` vs Fixed Vector

Choosing the correct dictionary structure in Node.js determines both algorithmic correctness and engine memory efficiency:

| Feature | Plain Object `{}` | ES2015 `Map` | `Int32Array(26)` |
|---|---|---|---|
| **Allowed Key Types** | Strings and Symbols | Any type (objects, numbers, functions) | Lowercase ASCII letters (`'a'`–`'z'`) |
| **Prototype Safety** | Inherits built-ins (`toString`, `valueOf`) | Clean; zero default properties | Contiguous typed memory buffer |
| **Insertion Order** | Integers sorted, strings in insertion order | Guaranteed strict insertion order | Fixed numerical index (`code - 97`) |
| **Memory Overhead** | Small for few properties; slow in dictionary mode | Moderate heap overhead per node | Minimal: exactly 104 bytes ($26 \times 4$ B) |
| **Lookup Time** | $O(1)$ average | $O(1)$ average | $O(1)$ instantaneous array index |

```javascript
// Node.js code
// Prototype hazard in plain objects:
const plainObj = {};
console.log(plainObj["toString"]); // [Function: toString] -> Exists before insertion!

// Safe Null-Prototype Object:
const safeDict = Object.create(null);
console.log(safeDict["toString"]); // undefined -> Safe!

// Map:
const safeMap = new Map();
console.log(safeMap.has("toString")); // false -> Safe!
```

---

## 4. Canonical Problems: Ransom Note and Majority Element

#### Problem A: Ransom Note (Multi-Set Decrement Pattern)
Given two strings `ransomNote` and `magazine`, return `true` if `ransomNote` can be constructed using the letters from `magazine` (each letter in `magazine` can only be used once).

```javascript
// Node.js code
function canConstruct(ransomNote, magazine) {
  // If the note has more letters than the magazine, construction is impossible
  if (ransomNote.length > magazine.length) return false;

  const counts = new Map();

  // Pass 1: Tally available inventory
  for (const ch of magazine) {
    counts.set(ch, (counts.get(ch) || 0) + 1);
  }

  // Pass 2: Consume letters for ransom note
  for (const ch of ransomNote) {
    const available = counts.get(ch) || 0;
    if (available === 0) {
      return false; // Insufficient characters available
    }
    counts.set(ch, available - 1);
  }

  return true;
}

console.log(canConstruct("aa", "aab")); // true
console.log(canConstruct("aa", "ab"));  // false
```
- **Time Complexity:** $O(m + n)$ where $m$ is magazine length and $n$ is ransom note length.
- **Auxiliary Space:** $O(u)$ where $u$ is the count of unique characters in `magazine`.

#### Problem B: Majority Element (Hash Map vs Boyer-Moore)
Given an array `nums` of size $n$, find the element that appears strictly more than $\lfloor n / 2 \rfloor$ times.

```javascript
// Node.js code
// Approach 1: Frequency Map (O(n) time, O(n) space)
function majorityElementMap(nums) {
  const threshold = Math.floor(nums.length / 2);
  const counts = new Map();

  for (const num of nums) {
    const nextCount = (counts.get(num) || 0) + 1;
    if (nextCount > threshold) return num;
    counts.set(num, nextCount);
  }

  return -1;
}

// Approach 2: Boyer-Moore Voting Algorithm (O(n) time, O(1) space)
function majorityElementBoyerMoore(nums) {
  let candidate = null;
  let count = 0;

  for (const num of nums) {
    if (count === 0) {
      candidate = num;
      count = 1;
    } else if (num === candidate) {
      count++;
    } else {
      count--;
    }
  }

  return candidate;
}

const dataset = [2, 2, 1, 1, 1, 2, 2];
console.log("Map Result:", majorityElementMap(dataset));                 // 2
console.log("Boyer-Moore Result:", majorityElementBoyerMoore(dataset)); // 2
```
- **Boyer-Moore Correctness:** Because the majority element appears more than $n / 2$ times, its frequency exceeds all other elements combined. Offsetting each occurrence of the candidate against an opposing element still leaves the majority element with a positive count at termination.

---

## Tricky Points and Edge Cases

### 1. Prototype Pollution in Plain Objects
In Express handlers, accepting user-controlled strings as dictionary keys on a plain `{}` object allows attackers to manipulate built-in object properties:

```javascript
// Node.js code
// ❌ VULNERABLE: Prototype pollution hazard
function countUserTagsVulnerable(tags) {
  const tally = {};
  for (const tag of tags) {
    tally[tag] = (tally[tag] || 0) + 1;
  }
  return tally;
}

// Attacker supplies: ["constructor", "toString"]
const result = countUserTagsVulnerable(["constructor"]);
console.log("Corrupted value:", result["constructor"]);
// Outputs: "function Object() { [native code] }1" -> Type coercion bug!

// ✅ SECURE: Use new Map() or Object.create(null)
function countUserTagsSecure(tags) {
  const tally = new Map();
  for (const tag of tags) {
    tally.set(tag, (tally.get(tag) || 0) + 1);
  }
  return tally;
}
```

### 2. Numeric Keys vs String Keys in Objects and Maps
Plain JavaScript objects coerce numeric keys to strings. A `Map` distinguishes types strictly:

```javascript
// Node.js code
const obj = {};
obj[1] = "numeric";
obj["1"] = "string";
console.log(Object.keys(obj).length); // 1 -> Collapsed to property "1"

const map = new Map();
map.set(1, "numeric");
map.set("1", "string");
console.log(map.size); // 2 -> Preserves distinct numeric and string keys
```

---

## Hands-On Exercise

### Scenario
You are designing an in-memory API rate limiter for a Node.js microservice. You receive an array of request events: `{ clientIp: string, timestamp: number }`.

You must detect all `clientIp` addresses that exceed a maximum allowed request threshold within a specified time window.

### Buggy Code
```javascript
// Node.js code
function findExceededClientsBuggy(events, limit) {
  const counts = {};
  const violators = [];

  for (let i = 0; i < events.length; i++) {
    const ip = events[i].clientIp;
    // ❌ Bug 1: Plain object is susceptible to prototype collisions (e.g. clientIp = "toString")
    // ❌ Bug 2: Mutates and pushes to violators repeatedly instead of deduplicating
    counts[ip] = (counts[ip] || 0) + 1;
    if (counts[ip] > limit) {
      violators.push(ip);
    }
  }

  return violators;
}
```

### Acceptance Criteria
1. Use an isolated `Map` data structure to prevent prototype interference.
2. Accurately count occurrences per `clientIp` in $O(n)$ time.
3. Return each violating IP address exactly once.
4. Pass tests for empty event logs and inputs containing prototype property names like `"constructor"`.

### Solution Code

```javascript
// Node.js code
import assert from "node:assert/strict";

function findExceededClients(events, limit) {
  const counts = new Map();
  const violators = new Set();

  for (const event of events) {
    const ip = event.clientIp;
    const currentCount = (counts.get(ip) || 0) + 1;
    counts.set(ip, currentCount);

    if (currentCount > limit) {
      violators.add(ip);
    }
  }

  return Array.from(violators);
}

// Verification Tests
const sampleEvents = [
  { clientIp: "192.168.1.1", timestamp: 100 },
  { clientIp: "192.168.1.2", timestamp: 101 },
  { clientIp: "192.168.1.1", timestamp: 102 },
  { clientIp: "192.168.1.1", timestamp: 103 }, // Exceeds limit of 2!
  { clientIp: "constructor", timestamp: 104 },
  { clientIp: "constructor", timestamp: 105 },
  { clientIp: "constructor", timestamp: 106 }  // "constructor" exceeds limit of 2!
];

const flagged = findExceededClients(sampleEvents, 2);
assert.deepEqual(flagged.sort(), ["192.168.1.1", "constructor"].sort());

// Edge case: Empty events list
assert.deepEqual(findExceededClients([], 5), []);

console.log("✅ All rate-limiter frequency counting tests passed successfully!");
```

### Solution Explanation

1. **Map Key Isolation:** Storing IPs in `new Map()` isolates arbitrary user strings from the JavaScript prototype chain.
2. **Deduplicated Violation Reporting:** A `Set` guarantees each violating client IP is captured once without needing an expensive $O(n^2)$ array search (`violators.includes(ip)`).

---

## Summary

- Hash tables compute bucket indices using hash functions to achieve $O(1)$ average-time lookups, insertions, and deletions.
- If hash collisions saturate a single bucket, separate chaining degrades search operations to $O(n)$ time.
- The **Frequency Counter Pattern** reduces nested-loop comparison algorithms from $O(n^2)$ to $O(n)$ by using two sequential passes.
- Use `Map` or `Object.create(null)` for dynamic user-controlled dictionaries to prevent prototype pollution vulnerabilities.
- For bounded lowercase English strings, `Int32Array(26)` provides $O(1)$ space and avoids V8 heap allocation overhead.
- When an element represents strictly more than half the data, the **Boyer-Moore Voting Algorithm** computes the answer in $O(n)$ time with $O(1)$ auxiliary space.

---

## Cheat Sheet

### Dictionary Operations & Complexity
| Operation | `new Map()` | Plain Object `{}` | `Int32Array(26)` |
|---|---|---|---|
| Set / Increment | `map.set(k, (map.get(k) ?? 0) + 1)` | `obj[k] = (obj[k] ?? 0) + 1` | `arr[code - 97]++` |
| Membership Check | `map.has(k)` | `Object.hasOwn(obj, k)` | `arr[idx] > 0` |
| Delete Key | `map.delete(k)` | `delete obj[k]` | `arr[idx] = 0` |
| Memory Footprint | Moderate ($O(u)$ nodes) | Low to High ($O(u)$) | Constant (104 bytes) |
| Collision Hazard | $O(n)$ worst-case | $O(n)$ worst-case | Zero (direct index) |

### Common Pitfalls
- **Using Nested Loops for Counts:** Calling `.indexOf()` or `.includes()` inside a loop turns an $O(n)$ algorithm into $O(n^2)$.
- **Prototype Collision Trap:** Using `{}` as a dictionary with user-supplied keys crashes or misbehaves when keys match `"constructor"` or `"toString"`.
- **Falsy Count Logic:** Checking `if (map.get(k))` evaluates a count of `0` as falsy; use `map.has(k)` or the nullish coalescing operator `map.get(k) ?? 0`.
- **Assuming Ordered Plain Objects:** Relying on plain objects to preserve numerical key insertion order (integer keys are sorted ascending by V8).

---

## Interview Questions

### 1. How does a hash table resolve collisions using Separate Chaining, and what happens to asymptotic complexity under an adversarial attack?

> **Separate Chaining**: A collision resolution strategy where each bucket in the hash table contains a linked list or tree of colliding entries.

**Question:** Explain the internal mechanics of Separate Chaining in hash tables and analyze how hash-flooding attacks affect runtime complexity.

**Answer:** A hash table maps keys to bucket indices using a hash function: $\text{index} = \text{hash}(\text{key}) \pmod{\text{capacity}}$. When two distinct keys yield the same index, this is a **collision**. Under **Separate Chaining**, each array bucket contains a pointer to a linked list (or balanced red-black tree in engines like Java's HashMap or modern V8 map variants) holding all key-value entries mapped to that bucket.
- **Average Case:** With a uniform hash distribution and a load factor kept below $\approx 0.75$, each bucket contains an average of $O(1)$ elements. Search, insertion, and deletion operate in $O(1)$ amortized time.
- **Adversarial Worst Case (Hash Flooding):** If an attacker crafts thousands of malicious keys that all produce identical hash values, every entry is forced into the same bucket. Searching for an item requires traversing the entire linked list of $n$ elements, degrading lookup performance from **$O(1)$ to $O(n)$**. In Node.js web servers, an attacker can exploit this to exhaust CPU resources by submitting maliciously crafted JSON payloads.

---

### 2. What does this code print, and why does the behavior differ between `Map` and a plain object?

**Question:** Predict the output of the following snippet and explain the underlying language mechanics:
```javascript
const map = new Map();
map.set(1, "number");
map.set("1", "string");

const obj = {};
obj[1] = "number";
obj["1"] = "string";

console.log(map.size, Object.keys(obj).length);
```

**Answer:**
The code prints: `2 1`.

**Explanation:**
1. **`Map` Mechanics:** In the ECMAScript specification, `Map` keys can be of any data type and are compared using the `SameValueZero` algorithm. The integer primitive `1` and the string primitive `"1"` have different types and values. Consequently, `map` creates two separate entries, resulting in `map.size === 2`.
2. **Plain Object Mechanics:** In plain JavaScript objects, property keys are strictly limited to Strings and Symbols. When an integer `1` is provided as a key (`obj[1] = "number"`), JavaScript implicitly coerces it to the string `"1"`. When the subsequent assignment `obj["1"] = "string"` executes, it references the exact same property key `"1"`, overwriting the previous value. Therefore, the object has only one property, and `Object.keys(obj).length === 1`.

---

### 3. What is the Boyer-Moore Voting Algorithm, and how does it find the majority element in $O(1)$ space compared to a frequency map?

> **Boyer-Moore Voting Algorithm**: An optimal streaming algorithm that finds the majority element in an array in $O(n)$ time and $O(1)$ auxiliary space.

**Question:** Explain the mathematical intuition behind the Boyer-Moore Voting Algorithm and implement it in JavaScript.

**Answer:** Given an array of size $n$, a **majority element** is defined as an element that appears strictly more than $\lfloor n / 2 \rfloor$ times. 

While a frequency map requires $O(n)$ auxiliary space to count all occurrences, the **Boyer-Moore Voting Algorithm** finds the candidate in $O(n)$ time using **$O(1)$ space**:
- Maintain a `candidate` variable and an integer `count = 0`.
- Iterate through each number in the array.
- If `count === 0`, set `candidate = num` and `count = 1`.
- If `num === candidate`, increment `count++`.
- If `num !== candidate`, decrement `count--`.

**Mathematical Intuition:**
Because the majority element occurs more than half the time, even if every non-majority element is paired up to cancel out one majority element, the majority element will still have a surplus count at the end of the array.

```javascript
// Node.js code
function majorityElement(nums) {
  let candidate = nums[0];
  let count = 0;

  for (const num of nums) {
    if (count === 0) {
      candidate = num;
      count = 1;
    } else if (num === candidate) {
      count++;
    } else {
      count--;
    }
  }

  return candidate;
}
```

---

### 4. What happens when user-supplied input is used directly as keys on a plain `{}` object, and how does this create vulnerabilities in Node.js?

**Question:** Analyze the security and operational risks of using plain objects as frequency maps for user-supplied data in Node.js backends.

**Answer:** Plain JavaScript objects inherit properties and methods from `Object.prototype`, including `toString`, `valueOf`, and `constructor`. Using plain objects as dynamic frequency dictionaries creates two major risks:
1. **Silent Logic Corruption:** If a user submits the string `"constructor"` or `"toString"`, checking `obj[key]` does not return `undefined`; it returns the built-in function from `Object.prototype`. Executing `obj["constructor"] = (obj["constructor"] || 0) + 1` evaluates to `"function Object() { [native code] }1"`. This causes NaN or string concatenation errors, corrupting application logic.
2. **Prototype Pollution:** If untrusted input paths (such as nested JSON keys) write to `__proto__`, an attacker can inject properties directly onto `Object.prototype`. These injected properties are immediately inherited by every object across the entire Node.js runtime, potentially allowing authentication bypasses or Remote Code Execution (RCE).

**Mitigation:** Always use `new Map()` for dynamic key-value storage. Alternatively, use `Object.create(null)` to create dictionary objects with a null prototype chain.

---

<nav aria-label="Lecture navigation">

[Previous: Sorting and Searching Basics](day-05-sorting-and-searching-basics.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Sum and Hash Map Complements](day-07-two-sum-and-hash-complements.md)

</nav>
