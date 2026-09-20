# Day 06: Frequency Counting and Hash Tables

<nav aria-label="Lecture navigation">

[Previous: Sorting and Searching Basics](day-05-sorting-and-searching-basics.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Sum and Hash Map Complements](day-07-two-sum-and-hash-complements.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain how hash tables compute bucket indices to achieve $O(1)$ average-time lookups.
- Identify the **Frequency Counter Pattern** to convert nested-loop searches ($O(n^2)$) into linear scans ($O(n)$).
- Choose between a JavaScript `Map`, a plain object `{}`, and a fixed-size `Int32Array(26)` based on memory and key types.
- Avoid prototype pollution hazards when using plain objects as dictionaries with untrusted user input.
- Apply frequency tables in Node.js backend services for in-memory rate limiting and request metrics.

## Prerequisites

- [Day 02: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md)
- [Day 05: Sorting and Searching Basics](day-05-sorting-and-searching-basics.md)

---

## Core Concepts

### 1. The Power of Hashing

In computing, checking whether an item exists in an unsorted list of size $n$ requires checking every item: $O(n)$ time.
A **Hash Table** eliminates the need to scan items by transforming the key itself into the memory address where the value lives.

```text
Key: "banana" ──> [ Hash Function ] ──> Hash Code: 19283 ──> Index: 19283 % 8 = 3
Array of Buckets:
[0] null
[1] null
[2] null
[3] ["banana", 4]  <-- Direct O(1) memory lookup
[4] null
```

- **Hash Function**: Deterministically turns a key into an integer.
- **Bucket Index**: `hash % bucketArrayLength`.
- **Collisions**: When two distinct keys yield the same bucket index, modern engines store them in a linked chain or tree within that bucket (Separate Chaining). In the average case, buckets contain $O(1)$ entries.

---

### 2. The Frequency Counter Pattern

Whenever an interview problem asks:
- "How many times does $X$ appear?"
- "Find the first non-repeating character"
- "Are these two arrays composed of the exact same counts?"

**Do not use nested loops ($O(n^2)$).** Use a frequency counter:
1. **Pass 1 ($O(n)$)**: Scan the dataset and populate counts in a `Map`.
2. **Pass 2 ($O(n)$)**: Scan again or inspect the map keys to answer the query.

```text
Input: "leetcode"
Pass 1 -> Map { 'l': 1, 'e': 3, 't': 1, 'c': 1, 'o': 1, 'd': 1 }
Pass 2 -> Check characters in order:
  'l' has count 1 -> First non-repeating character is 'l'! (Index 0)
Total Time: O(n) + O(n) = O(n)
```

---

## Detailed Explanations & Node.js Relevance

### Plain Object vs `Map` vs Fixed Array

| Feature | Plain Object `{}` | `Map` | `Int32Array(26)` |
| :--- | :--- | :--- | :--- |
| **Key Types** | Strings and Symbols only | Any value (objects, numbers, functions) | Lowercase ASCII letters only |
| **Prototype Safety** | Has inherited keys (`toString`, `valueOf`) unless `Object.create(null)` | Fully isolated, no prototype properties | Direct indexed memory buffer |
| **Insertion Order** | Complex (integers sorted, strings insertion-order) | Strict insertion order guaranteed | Fixed index `char.charCodeAt(0) - 97` |
| **V8 Overhead** | Low memory for few fixed keys | Moderate heap allocation per entry | Lowest possible memory footprint ($O(1)$) |

### Node.js Security Warning: Prototype Pollution
If you use a plain object `{}` to count user-supplied keys in an Express API route:
```js
// DANGEROUS: If untrusted input contains "__proto__" or "toString"
const counts = {};
counts[userInput] = (counts[userInput] || 0) + 1;
```
An attacker passing `__proto__` can corrupt the global `Object.prototype`, crashing or hijacking your Node.js process. Always use `new Map()` or `Object.create(null)` for arbitrary user-supplied keys.

---

## JavaScript Implementation & Tracing

### Problem: First Unique Character in a String (LeetCode 387)

Given a string `s`, find the first non-repeating character and return its index. If it does not exist, return `-1`.

```js
function firstUniqChar(s) {
  const charCounts = new Map();

  // Pass 1: Build frequency map - O(n)
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    charCounts.set(char, (charCounts.get(char) || 0) + 1);
  }

  // Pass 2: Find first character with count === 1 - O(n)
  for (let i = 0; i < s.length; i++) {
    if (charCounts.get(s[i]) === 1) {
      return i;
    }
  }

  return -1;
}

// Fixed Array Optimization (for lowercase English letters a-z)
function firstUniqCharOptimized(s) {
  const counts = new Int32Array(26);
  const baseCode = 97; // 'a'.charCodeAt(0)

  for (let i = 0; i < s.length; i++) {
    counts[s.charCodeAt(i) - baseCode]++;
  }

  for (let i = 0; i < s.length; i++) {
    if (counts[s.charCodeAt(i) - baseCode] === 1) {
      return i;
    }
  }

  return -1;
}
```

### Step-by-Step Execution Trace

Input: `s = "loveleetcode"`

| Step | Current Index `i` | Char | Action | `charCounts` Map State |
| :--- | :--- | :--- | :--- | :--- |
| **Pass 1** | 0 to 11 | `l,o,v,e...` | Increment count | `{l:2, o:2, v:1, e:4, t:1, c:1, d:1}` |
| **Pass 2** | `i = 0` | `'l'` | `get('l') === 2` | Not unique, continue |
| **Pass 2** | `i = 1` | `'o'` | `get('o') === 2` | Not unique, continue |
| **Pass 2** | `i = 2` | `'v'` | `get('v') === 1` | **MATCH FOUND!** Return index `2` |

- **Time Complexity**: $O(n)$ where $n$ is string length (two passes).
- **Auxiliary Space**: $O(1)$ extra space because the alphabet size is bounded ($\le 26$ lowercase English characters).

---

## Common Mistakes & Interview Traps

1. **Calling `.indexOf()` or `.includes()` inside a loop**:
   ```js
   // WRONG: O(n^2) time!
   for (let i = 0; i < s.length; i++) {
     if (s.indexOf(s[i]) === s.lastIndexOf(s[i])) return i;
   }
   ```
   Each call to `indexOf` and `lastIndexOf` scans the entire string. Nested inside the loop, this takes $O(n^2)$ time.
2. **Assuming `Map` insertion order is sorted**:
   A JavaScript `Map` preserves **insertion order**, not alphabetical or numerical order.
3. **Checking truthiness instead of `.has()`**:
   ```js
   // WRONG: If count is 0, (map.get(k) || 0) evaluates 0 as falsy!
   // Use explicit check:
   map.set(k, (map.get(k) ?? 0) + 1);
   ```

---

## Tricky Points & Edge Cases

- **Numeric String Keys vs Numbers**:
  In a plain object `{}`, keys `1` and `"1"` collapse to the same property. In a `Map`, `map.set(1, 'a')` and `map.set("1", 'b')` are treated as two distinct keys.
- **Empty or All-Duplicate Inputs**:
  Ensure empty strings (`""`) gracefully return `-1` without errors, and inputs with identical characters (`"aaaa"`) correctly return `-1`.

---

## Practical Exercise

Implement `findMajorityElement(nums)` which takes an array of numbers and returns the element that appears strictly more than $\lfloor n / 2 \rfloor$ times.
- **Constraint**: Array length $1 \le n \le 5 \times 10^4$. Guaranteed that a majority element exists.
- **Acceptance Criterion**: Must run in $O(n)$ time using a frequency map before exploring Boyer-Moore voting.

---

## Summary

- Hashing transforms keys into direct array indices, enabling $O(1)$ average lookup, insert, and delete.
- The frequency counter pattern replaces $O(n^2)$ nested lookups with two sequential $O(n)$ passes.
- Prefer `Map` over `{}` for arbitrary user input to protect Node.js applications from prototype pollution.
- When inputs are restricted to ASCII characters `a-z`, a fixed `Int32Array(26)` offers the fastest runtime and $O(1)$ memory usage.

---

## Cheat Sheet

### Common Operations
| Operation | `new Map()` | Plain Object `{}` | `Int32Array(26)` |
| :--- | :--- | :--- | :--- |
| Set / Increment | `map.set(k, (map.get(k) ?? 0) + 1)` | `obj[k] = (obj[k] ?? 0) + 1` | `arr[char.charCodeAt(0) - 97]++` |
| Check existence | `map.has(k)` | `Object.hasOwn(obj, k)` | `arr[idx] > 0` |
| Space Complexity | $O(k)$ entries | $O(k)$ properties | $O(1)$ (fixed 26 ints) |

---

## Interview Questions

### 1. Deep Definitions and Mental Models
**Question:** Explain how a hash map resolves collisions using Separate Chaining, and what happens to the time complexity if all keys collide into the same bucket.
- **Expected answer shape:** A hash map maps keys to array buckets via `hash(key) % capacity`. Separate Chaining stores colliding entries in a linked list or balanced tree at that bucket index. If all $n$ keys collide into a single bucket, search degrades from $O(1)$ average time to $O(n)$ linear time.

### 2. Predict the Output and Trace Execution
**Question:** What does this code print?
```js
const map = new Map();
map.set(1, "number");
map.set("1", "string");
const obj = {};
obj[1] = "number";
obj["1"] = "string";
console.log(map.size, Object.keys(obj).length);
```
- **Expected answer shape:** Output: `2 1`. `Map` distinguishes key types, so integer `1` and string `"1"` are separate entries. Plain objects convert all non-symbol keys to strings, so `obj[1]` is overwritten by `obj["1"]`.

### 3. Implementation Exercise
**Question:** Write `areAnagrams(s, t)` using a single frequency counter that increments for `s` and decrements for `t`. Must run in $O(n)$ time and $O(1)$ auxiliary space (assuming $a-z$).
- **Expected answer shape:**
```js
function areAnagrams(s, t) {
  if (s.length !== t.length) return false;
  const counts = new Int32Array(26);
  for (let i = 0; i < s.length; i++) {
    counts[s.charCodeAt(i) - 97]++;
    counts[t.charCodeAt(i) - 97]--;
  }
  return counts.every(count => count === 0);
}
```

### 4. Debugging and Failure Analysis
**Question:** A developer uses `const counts = {}; counts[word] = counts[word] + 1;` to tally words from user input. A user submits the word `"constructor"`. What happens?
- **Expected answer shape:** Because plain objects inherit from `Object.prototype`, `counts["constructor"]` returns `Object.prototype.constructor` (a function). Adding `+ 1` evaluates to `"function Object() { [native code] }1"`. Use `new Map()` or `Object.create(null)` to prevent prototype inheritance traps.

### 5. Design and Tradeoff Questions
**Question:** When is using an in-place sort ($O(n \log n)$ time, $O(1)$ space) preferred over a frequency map ($O(n)$ time, $O(n)$ space)?
- **Expected answer shape:** When memory is strictly constrained (embedded environments or tight microservice container memory limits) and auxiliary allocations must be zero. Allocating $O(n)$ hash map entries creates GC pressure in Node.js, whereas in-place sorting uses $O(1)$ extra space.

### 6. Senior Follow-ups: Node.js Memory Limits
**Question:** If a Node.js web server builds an in-memory frequency map of 10 million distinct user IDs from a batch stream, what risks arise and how do you mitigate them?
- **Expected answer shape:** 10 million `Map` entries can exceed Node.js's default V8 heap limit (~1.4 GB–4 GB), triggering an Out-Of-Memory (OOM) crash. Mitigations: (1) Stream data in batches and offload counting to Redis or PostgreSQL, (2) increase `--max-old-space-size`, or (3) use an external database aggregation (`COUNT(*) GROUP BY user_id`).

<nav aria-label="Lecture navigation">

[Previous: Sorting and Searching Basics](day-05-sorting-and-searching-basics.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Sum and Hash Map Complements](day-07-two-sum-and-hash-complements.md)

</nav>
