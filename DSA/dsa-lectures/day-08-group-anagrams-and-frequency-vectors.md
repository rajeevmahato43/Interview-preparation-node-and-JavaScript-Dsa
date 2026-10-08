# Day 08: Group Anagrams and Frequency Vectors

<nav aria-label="Lecture navigation">

[Previous: Two Sum and Hash Map Complements](day-07-two-sum-and-hash-complements.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Duplicate Detection and Array Intersections](day-09-duplicate-detection-and-intersections.md)

</nav>
## Prerequisites

- [Day 03: Strings and Text Patterns](day-03-strings-and-text-patterns.md) — String immutability, `charCodeAt()`, and character frequencies.
- [Day 06: Frequency Counting and Hash Tables](day-06-frequency-counting-and-hash-tables.md) — Hash bucket lookups and prototype safety.
- [Day 07: Two Sum and Hash Complements](day-07-two-sum-and-hash-complements.md) — Hash map state tracking and single-pass iteration.
---

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           EQUIVALENCE PARTITIONING VIA CANONICAL KEYS                       │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  INPUT: [ "eat", "tea", "tan", "ate", "nat", "bat" ]

  SIGNATURE GENERATION:
  "eat" ──> sort() ──> "aet" ──┐
  "tea" ──> sort() ──> "aet" ──┼──> Bucket "aet": [ "eat", "tea", "ate" ]
  "ate" ──> sort() ──> "aet" ──┘

  "tan" ──> sort() ──> "ant" ──┐
  "nat" ──> sort() ──> "ant" ──┴──> Bucket "ant": [ "tan", "nat" ]

  "bat" ──> sort() ──> "abt" ──────> Bucket "abt": [ "bat" ]

  OUTPUT: [ ["eat", "tea", "ate"], ["tan", "nat"], ["bat"] ]
```

## 1. The Grouping by Signature Pattern

An anagram is a word formed by rearranging the letters of another word using all original letters exactly once (e.g., `"eat"`, `"tea"`, and `"ate"`).

When solving problems that ask to *"group items that share a common relationship"*:
1. **Derive Canonical Key:** Transform each item into an invariant signature that is identical for all members of that equivalence class.
2. **Bucket Accumulation:** Store items inside a `Map<Signature, Array<Item>>`.
3. **Extract Result:** Return `Array.from(map.values())`.

---

## 2. Strategy Comparison: Sorted String vs Serialized Frequency Vector

To group $n$ strings where each string has a maximum length of $k$:

#### Approach A: Sorted String Signature
Convert each string to an array, sort alphabetically, and join back into a string:
`str.split("").sort().join("")`
- **Time Complexity per word:** $O(k \log k)$
- **Advantages:** Concise, memory-efficient in V8 for short strings ($k \le 15$), and works across arbitrary Unicode characters.
- **Disadvantages:** Slower for extremely long strings ($k > 1,000$).

#### Approach B: Serialized Frequency Count Vector
For lowercase English strings (`'a'`–`'z'`), build a 26-element integer frequency vector and serialize it with a delimiter:
`counts.join("#")` (e.g., `"#1#0#0#0#1#0...#1"`)
- **Time Complexity per word:** $O(k)$ to count characters $+ O(26) = O(k)$ to format the key.
- **Advantages:** Strictly linear in word length; asymptotically superior when $k$ is massive.
- **Disadvantages:** Restricted to bounded character sets; creates multi-segment string allocations in the V8 heap.

```javascript
// Node.js code
"use strict";

// Approach A: Sorted String Key (O(n * k log k) time)
function groupAnagramsSorted(strs) {
  const groups = new Map();

  for (const str of strs) {
    const key = str.split("").sort().join("");

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(str);
  }

  return Array.from(groups.values());
}

// Approach B: Serialized Frequency Vector Key (O(n * k) time)
function groupAnagramsVector(strs) {
  const groups = new Map();

  for (const str of strs) {
    const counts = new Array(26).fill(0);
    for (let i = 0; i < str.length; i++) {
      counts[str.charCodeAt(i) - 97]++;
    }

    // Must use delimiters to avoid ambiguous digit concatenation
    const key = counts.join("#");

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(str);
  }

  return Array.from(groups.values());
}

const words = ["eat", "tea", "tan", "ate", "nat", "bat"];
console.log("Sorted key result:", groupAnagramsSorted(words));
console.log("Vector key result:", groupAnagramsVector(words));
```

---

## 3. Execution Trace: Group Anagrams

Input: `strs = ["eat", "tea", "tan", "ate", "nat", "bat"]`

| Word | Computed Key (Sorted) | Key Exists in Map? | Action Taken | `groups` State |
|---|---|---|---|---|
| `"eat"` | `"aet"` | No | Create bucket `"aet"` | `{"aet" => ["eat"]}` |
| `"tea"` | `"aet"` | Yes | Push to `"aet"` | `{"aet" => ["eat", "tea"]}` |
| `"tan"` | `"ant"` | No | Create bucket `"ant"` | `{"aet" => [...], "ant" => ["tan"]}` |
| `"ate"` | `"aet"` | Yes | Push to `"aet"` | `{"aet" => ["eat", "tea", "ate"], ...}` |
| `"nat"` | `"ant"` | Yes | Push to `"ant"` | `{"ant" => ["tan", "nat"], ...}` |
| `"bat"` | `"abt"` | No | Create bucket `"abt"` | `{"abt" => ["bat"], ...}` |

- **Time Complexity:** $O(n \cdot k \log k)$ for sorted approach; $O(n \cdot k)$ for vector approach.
- **Auxiliary Space:** $O(n \cdot k)$ to store strings and keys in the `Map`.

---

## 4. Node.js Backend Application: Request Batching (DataLoader Pattern)

In GraphQL servers or microservice aggregators, multiple client queries often execute independent database reads for the same SQL statement shape.

Using signature grouping, a Node.js gateway groups disparate requests by query signature, executes a single consolidated SQL query (`IN (...)`), and fans out results to individual client promises.

```javascript
// Node.js code
// Request Batcher (DataLoader pattern)
class QueryBatcher {
  constructor() {
    this.batches = new Map(); // Key: query template, Value: array of deferred lookups
  }

  enqueue(entityType, id) {
    const key = `SELECT_BY_ID:${entityType}`;
    if (!this.batches.has(key)) {
      this.batches.set(key, []);
    }

    return new Promise((resolve) => {
      this.batches.get(key).push({ id, resolve });
    });
  }

  // Flushes batches into single consolidated database calls
  flush() {
    for (const [key, requests] of this.batches.entries()) {
      const ids = requests.map(r => r.id);
      console.log(`Executing bulk DB query for ${key} with IDs:`, ids);

      // Simulate DB response
      for (const req of requests) {
        req.resolve({ id: req.id, loaded: true });
      }
    }
    this.batches.clear();
  }
}

const batcher = new QueryBatcher();
batcher.enqueue("User", 101);
batcher.enqueue("User", 102);
batcher.enqueue("Order", 5001);
batcher.flush();
```

---

## Tricky Points and Edge Cases

### 1. The Delimiter Hazard in Frequency Strings
If you serialize count arrays without delimiters (`counts.join("")`), variable-length numbers bleed into adjacent buckets, creating false collisions:

```javascript
// Node.js code
// Word 1: 'a' appears 11 times, 'b' appears 0 times
// Word 2: 'a' appears 1 time,  'b' appears 10 times

// ❌ BROKEN: Without delimiter
const key1Broken = [11, 0].join(""); // "110"
const key2Broken = [1, 10].join(""); // "110" -> COLLISION!

// ✅ SAFE: With delimiter
const key1Safe = [11, 0].join("#"); // "11#0"
const key2Safe = [1, 10].join("#"); // "1#10" -> DISTINCT!
```

### 2. The Reference Equality Trap with Array Keys in `Map`
In JavaScript, objects and arrays are compared by **reference identity**, not structural value:

```javascript
// Node.js code
const map = new Map();
const vec1 = [1, 0, 1];
const vec2 = [1, 0, 1];

// ❌ BUG: Different array instances have different memory references!
map.set(vec1, ["first"]);
console.log(map.get(vec2)); // undefined! vec1 !== vec2
console.log(map.size);      // 1

// ✅ FIX: Serialize compound data to primitive strings
map.set(vec1.join("#"), ["first"]);
console.log(map.get(vec2.join("#"))); // ["first"]
```

### 3. Prime Multiplication and the IEEE-754 Overflow Trap
A well-known mathematical trick assigns each letter a prime number ($a=2, b=3, c=5\dots$) and computes their product. By the Fundamental Theorem of Arithmetic, every anagram has a unique prime product.

**Why this breaks in JavaScript:**
JavaScript numbers are 64-bit double-precision floats where integers lose precision beyond `Number.MAX_SAFE_INTEGER` ($2^{53} - 1 \approx 9.007 \times 10^{15}$).
- A word of just 13 letters (`"zzzzzzzzzzzzz"`) computes to $101^{13} \approx 1.13 \times 10^{26}$, exceeding `MAX_SAFE_INTEGER` by eleven orders of magnitude.
- The product rounds to floating-point infinity or imprecise truncated values, triggering false anagram collisions. Unless using `BigInt`, never use prime multiplication in JavaScript.

---

## Hands-On Exercise

### Scenario
You are building a text clustering utility. Two strings belong to the same shifted group if each letter in one string can be shifted circularly by the exact same distance to match the other string (e.g., `"abc"` shifts to `"bcd"`, and `"az"` shifts to `"ba"` by shifting 1 step circularly).

You must group an array of strings into their shifted equivalence classes.

### Buggy Code
```javascript
// Node.js code
function groupShiftedStringsBuggy(strings) {
  const groups = new Map();

  for (const str of strings) {
    let key = "";
    for (let i = 1; i < str.length; i++) {
      // ❌ Bug 1: Negative differences are not handled circularly (e.g. 'a' - 'z' = -25)
      // ❌ Bug 2: No delimiters between character differences (e.g. 1 and 2 vs 12)
      const diff = str.charCodeAt(i) - str.charCodeAt(i - 1);
      key += diff;
    }

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(str);
  }

  return Array.from(groups.values());
}
```

### Acceptance Criteria
1. Handle circular alphabet wrapping: `'z'` to `'a'` must compute as a positive circular distance of $1$.
2. Use delimiters in the signature to prevent numeric concatenation collisions.
3. Successfully group single-character strings under a shared baseline key.
4. Execute in $O(n \cdot k)$ time.

### Solution Code

```javascript
// Node.js code
import assert from "node:assert/strict";

function groupShiftedStrings(strings) {
  const groups = new Map();

  for (const str of strings) {
    const diffs = [];

    // Calculate circular character differences relative to the preceding character
    for (let i = 1; i < str.length; i++) {
      const diff = (str.charCodeAt(i) - str.charCodeAt(i - 1) + 26) % 26;
      diffs.push(diff);
    }

    // Join with delimiter to prevent digit merging; single chars yield ""
    const key = diffs.join("#");

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(str);
  }

  return Array.from(groups.values());
}

// Verification Tests
const testInput = ["abc", "bcd", "acef", "xyz", "az", "ba", "a", "z"];
const actual = groupShiftedStrings(testInput);

// Helper to sort nested groups for deterministic assertion
const normalize = (arr) => arr.map(group => group.slice().sort()).sort();

const expected = [
  ["abc", "bcd", "xyz"],
  ["acef"],
  ["az", "ba"],
  ["a", "z"]
];

assert.deepEqual(normalize(actual), normalize(expected));
console.log("✅ All shifted string grouping assertions passed successfully!");
```

### Solution Explanation

1. **Circular Modulo Difference:** The formula `(code[i] - code[i-1] + 26) % 26` converts all differences into positive values between $0$ and $25$. For `"az"`, `'z' - 'a' = 25`. For `"ba"`, `'a' - 'b' = -1 \to (-1 + 26) % 26 = 25`. Both yield key `"25"`.
2. **Delimiter Isolation:** Splicing with `#` guarantees that differences like `1` followed by `11` are stored as `"1#11"`, distinct from `11` followed by `1` (`"11#1"`).

---

## Summary

- The **Grouping by Signature Pattern** reduces equivalence partitioning problems to hash map lookups by deriving an invariant canonical key.
- Sorting characters produces an $O(k \log k)$ key per word that supports arbitrary Unicode characters.
- Serializing a 26-element frequency vector yields an $O(k)$ linear signature for lowercase ASCII, but requires delimiter formatting.
- Compound data structures like arrays cannot serve directly as `Map` keys due to JavaScript's **reference equality model**; serialize them to primitive strings.
- Prime multiplication algorithms fail on strings longer than 12 characters due to JavaScript IEEE-754 `MAX_SAFE_INTEGER` precision limits.

---

## Cheat Sheet

### Signature Strategy Comparison
| Key Generation Method | Key Example | Time per Word | Alphabet Support | Memory Overhead |
|---|---|---|---|---|
| **Sorted String** | `"aet"` | $O(k \log k)$ | Full Unicode / Emojis | Low (single string) |
| **Delimited Frequency Vector** | `"1#0#0#...#1"` | $O(k)$ | Lowercase ASCII only | High (multiple strings per word) |
| **Prime Product** | Integer product | $O(k)$ | Lowercase ASCII | Breaks at $k > 12$ without `BigInt` |

### Common Pitfalls
- **Array Reference Keys:** Writing `map.set([1, 2], val)` and expecting `map.get([1, 2])` to work.
- **Missing Delimiters in Keys:** Serializing count arrays without `#`, causing digit ambiguity (`[1, 10]` vs `[11, 0]`).
- **In-Place Sorting Mutation:** Slicing or sorting strings in place without creating temporary arrays.
- **Prime Overflow:** Using prime numbers to compute product keys in standard JavaScript floats.

---

## Interview Questions

### 1. What is an equivalence relation in the context of Group Anagrams, and how does canonical signature generation enable $O(1)$ group lookups?

> **Canonical Signature**: A standardized, deterministic string representation derived from an object's invariant properties.

**Question:** Explain the mathematical concept of an equivalence relation in grouping problems and how it maps to hash table operations.

**Answer:** 
In discrete mathematics, a relation $\sim$ is an **equivalence relation** if it satisfies three properties:
1. **Reflexivity:** $a \sim a$ (every word is an anagram of itself).
2. **Symmetry:** If $a \sim b$, then $b \sim a$ (if $a$ is an anagram of $b$, $b$ is an anagram of $a$).
3. **Transitivity:** If $a \sim b$ and $b \sim c$, then $a \sim c$.

An equivalence relation partitions a universe of items into disjoint **equivalence classes**. Each equivalence class can be uniquely represented by a single invariant value called its **canonical signature**.

In Group Anagrams, words with identical character multiset distributions belong to the same equivalence class. By defining a deterministic transformation function $f(\text{word}) \to \text{signature}$ (such as alphabetical character sorting), every member of the equivalence class maps to the exact same hash key:
$$f(\text{"eat"}) = f(\text{"tea"}) = f(\text{"ate"}) = \text{"aet"}$$
When indexing items into a hash map, computing $f(\text{word})$ takes $O(k \log k)$ or $O(k)$ time, followed by an $O(1)$ average-time bucket insertion. This enables partitioning $n$ items in linear time relative to input size without $O(n^2)$ pairwise comparisons.

---

### 2. Why does `new Map().set([1, 2], "val").get([1, 2])` return `undefined`, and how must compound vectors be keyed in JavaScript?

**Question:** Explain how JavaScript evaluates equality for object and array keys in `Map`, and how to correctly use composite data as map keys.

**Answer:** 
The ECMAScript specification dictates that `Map` keys are evaluated using the `SameValueZero` equality algorithm. For non-primitive reference types (Objects, Arrays, Functions), `SameValueZero` compares **memory pointer references**, not structural contents:
```javascript
const a = [1, 2];
const b = [1, 2];
console.log(a === b); // false (different heap allocations)
```
When you execute `map.set([1, 2], "val")`, the array literal `[1, 2]` is allocated at memory address $A$. When you subsequently call `map.get([1, 2])`, a *new* array literal is allocated at memory address $B$. Because address $A \ne address B$, the `Map` does not match the key and returns `undefined`.

**Resolution:**
Compound vectors must be converted to **primitive values** (such as strings), which JavaScript compares by value rather than reference address:
```javascript
// Node.js code
const map = new Map();
const serialize = (arr) => arr.join("#");

map.set(serialize([1, 2]), "val");
console.log(map.get(serialize([1, 2]))); // "val"
```

---

### 3. Why does prime factor multiplication fail for anagram hashing in JavaScript for strings longer than 12 characters, and what numeric limit causes this?

**Question:** Explain the Fundamental Theorem of Arithmetic anagram hashing approach and demonstrate why it produces collisions in JavaScript.

**Answer:** 
The Fundamental Theorem of Arithmetic states that every integer greater than 1 has a unique prime factorization. By assigning each lowercase letter a prime number ($a=2, b=3, c=5, \dots, z=101$) and multiplying the prime values of all characters in a word, all anagrams produce identical products, while non-anagrams produce distinct products.

**Why it fails in JavaScript:**
JavaScript represents all numbers as IEEE-754 64-bit double-precision floating-point values. The maximum integer that can be represented with exact precision is `Number.MAX_SAFE_INTEGER`:
$$2^{53} - 1 = 9{,}007{,}199{,}254{,}740{,}991 \approx 9 \times 10^{15}$$
Consider words composed of characters near the end of the alphabet. Letter `'z'` is assigned prime 101.
For a string of 13 `'z'`s:
$$101^{13} \approx 1.13 \times 10^{26}$$
Because $1.13 \times 10^{26}$ far exceeds $2^{53} - 1$, the V8 engine discards the least significant bits to fit the value into the floating-point mantissa. Arithmetic rounding causes distinct words to compute to identical rounded floating-point approximations, resulting in catastrophic hash collisions.
*(Note: This approach is only viable in JavaScript if implemented using arbitrary-precision `BigInt` values).*

---

### 4. When grouping 100,000 words in Node.js, how do sorted string keys compare against 26-bucket frequency strings in CPU and memory?

**Question:** In a high-throughput Node.js service grouping 100,000 words of length $k \le 10$, which key generation strategy is faster and consumes less memory?

**Answer:** 
While theoretical Big O analysis indicates that 26-bucket counting ($O(k)$) is asymptotically faster than sorting ($O(k \log k)$), **sorted string keys (`str.split('').sort().join('')`) perform significantly faster and consume less memory** in V8 when $k \le 10$.

**Reasons:**
1. **CPU Comparison:**
   - For $k \le 10$, $k \log_2 k \le 33$ comparisons. This is computationally negligible.
   - The 26-bucket frequency approach requires allocating an array of 26 integers, running a 26-iteration loop, and formatting a 52-character delimited string (`#0#0#1#...`). Generating this key involves substantial string concatenation overhead.
2. **Memory & Garbage Collection Overhead:**
   - Building a 26-bucket key requires creating a 26-element array and serializing it into a ~52-byte string for each of the 100,000 words, allocating millions of short-lived objects on the V8 heap and triggering frequent Young Generation GC pauses.
   - Slicing and sorting a 6-character string creates a small flat string that V8 can intern or collect efficiently.
- **Conclusion:** Use sorted string keys when $k \le 20$. Only switch to 26-bucket frequency vectors when word lengths are very large ($k \ge 500$) and sorting overhead dominates.

---

<nav aria-label="Lecture navigation">

[Previous: Two Sum and Hash Map Complements](day-07-two-sum-and-hash-complements.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Duplicate Detection and Array Intersections](day-09-duplicate-detection-and-intersections.md)

</nav>
