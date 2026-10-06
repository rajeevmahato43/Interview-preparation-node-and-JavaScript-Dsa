# Day 03: Strings and Text Patterns

<nav aria-label="Lecture navigation">

[Previous: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Recursion and Call Stack](day-04-recursion-and-call-stack.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain string immutability in JavaScript and how V8 manages strings in memory (flat strings, cons-strings, and sliced strings).
- Prevent the hidden $O(n^2)$ time and memory trap when building strings in loops by using array buffers and `join("")`.
- Map characters to fixed-size frequency vectors using `charCodeAt()` to achieve $O(1)$ auxiliary space.
- Navigate UTF-16 encoding quirks, distinguishing code units from Unicode code points (surrogate pairs and emoji handling).
- Solve fundamental string interview patterns: two-pointer inward scan (Valid Palindrome), balanced frequency vector (Valid Anagram), and linear pointer tracking (Subsequence).
- Diagnose and prevent memory retention leaks in Node.js caused by V8 sliced strings holding large parent buffers.

---

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Asymptotic analysis and space complexity.
- [Day 02: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md) — Array allocations and hash tables.
- [JS Day 03: Values, Types, and Literals](../../Javascript/javascript-lectures/day-03-values-types-and-literals.md) — Primitive value semantics.
- [JS Day 15: Regular Expressions and Text Processing](../../Javascript/javascript-lectures/day-15-regular-expressions-and-text-processing.md) — Text transformations.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
|---|---|---|
| **String Immutability** | Primitive string values cannot be mutated in place; any modification creates a distinct string allocation. | Index assignment (`str[0] = 'a'`) fails silently; naive concatenation in loops takes $O(n^2)$ time. |
| **Cons-String** | A V8 internal tree representation of two concatenated strings without immediate memory copying. | Postpones copying until string flattening, but can bloat memory if deeply nested. |
| **Sliced String** | A V8 internal pointer containing an offset and length pointing into a parent string's memory. | Slicing a small 10-character token from a 50 MB HTTP payload keeps the entire 50 MB in memory. |
| **Code Unit vs Code Point** | A code unit is a 16-bit storage slot in UTF-16 ($0$ to $0xFFFF$). A code point is a full Unicode character ($0$ to $0x10FFFF$). | Astral plane characters (emojis, rare scripts) consume two 16-bit code units (surrogate pairs). |
| **Frequency Vector** | A fixed-size numeric array (e.g., size 26) indexed by character codes (`code - 97`). | Provides $O(1)$ auxiliary space counting that outperforms `Map` when character sets are bounded. |

---

## Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           JAVASCRIPT STRING RUNTIME & MEMORY TAXONOMY                       │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  1. FLAT STRING (Contiguous Character Storage)
     "hello"  --> [ 'h' | 'e' | 'l' | 'l' | 'o' ]
     • Indexed random access: O(1)
     • Read-only: Mutating an index does nothing or throws in strict mode!

  2. CONS-STRING (Concatenation Tree)
     strA + strB --> ConsString { left: ptr(strA), right: ptr(strB) }
     • Prevents immediate re-allocation during +=, but requires "flattening" upon access.

  3. SLICED STRING (Window into Parent String)
     parentStr.slice(0, 5) --> SlicedString { parent: ptr(parentStr), offset: 0, length: 5 }
     • O(1) creation time, but prevents garbage collection of the entire parentStr!

  4. UTF-16 ENCODING & SURROGATE PAIRS
     "A"  --> Code Unit: 0x0041 (1 unit,  .length = 1)
     "🚀" --> High Surrogate: 0xD83D, Low Surrogate: 0xDE80 (2 units, .length = 2)
```

### 1. String Immutability and V8 Internal Representations

A JavaScript string is a primitive value representing a sequence of 16-bit unsigned integer values (UTF-16 code units).

Because strings are immutable, you cannot alter existing character elements in place:

```javascript
// Node.js code
"use strict";

const word = "hello";

// ❌ ANTI-PATTERN: Attempting in-place mutation
try {
  word[0] = "j"; // Throws TypeError in strict mode; silently fails in non-strict mode
} catch (err) {
  console.log("Cannot mutate string index:", err.message);
}

// ✅ PATTERN: Constructing a new string explicitly
const updated = "j" + word.slice(1);
console.log(updated); // "jello"
```

In the V8 engine, strings are not always flat contiguous character arrays:
1. **Sequential / Flat Strings:** Characters are laid out consecutively in memory.
2. **Cons-Strings:** Created when two strings are concatenated with `+`. Instead of allocating a new buffer and copying both inputs immediately, V8 creates a pair of pointers referencing the operands. When a flat string is required (e.g., regex execution or IPC), V8 flattens the tree.
3. **Sliced Strings:** Created when `slice()` or `substring()` is called on a large string. Rather than copying bytes, V8 points back to the parent string with a start offset and length.

---

### 2. The String-Building Trap: $O(n^2)$ vs Array Buffer $O(n)$

Concatenating strings inside a loop using `+=` copies accumulated characters repeatedly once V8 flattens the structure, yielding quadratic time complexity.

```
Iteration 1: copy 1 char
Iteration 2: copy 2 chars
Iteration 3: copy 3 chars
...
Iteration n: copy n chars
Total copies = 1 + 2 + 3 + ... + n = n(n + 1) / 2 = O(n²)
```

```javascript
// Node.js code
// ❌ ANTI-PATTERN: Quadratic string concatenation inside a loop (O(n^2))
function buildCsvSlow(rowCount) {
  let csv = "";
  for (let i = 0; i < rowCount; i++) {
    csv += `row_${i},value_${i}\n`; // Repeated re-allocation and copying!
  }
  return csv;
}

// ✅ PATTERN: Collecting into an array and joining once (O(n))
function buildCsvFast(rowCount) {
  const parts = new Array(rowCount);
  for (let i = 0; i < rowCount; i++) {
    parts[i] = `row_${i},value_${i}\n`;
  }
  return parts.join(""); // Single pass allocation and copy
}

const n = 20000;
console.time("Slow Concatenation");
buildCsvSlow(n);
console.timeEnd("Slow Concatenation");

console.time("Fast Array Join");
buildCsvFast(n);
console.timeEnd("Fast Array Join");
```

---

### 3. Unicode, UTF-16 Code Units, and Code Points

JavaScript strings index over 16-bit UTF-16 **code units**, not full Unicode characters (code points).

- Characters within the Basic Multilingual Plane (BMP, $U+0000$ to $U+FFFF$) occupy **one code unit** (`length === 1`).
- Supplementary characters (emojis, historic scripts, $U+10000$ to $U+10FFFF$) occupy **two code units** called a surrogate pair (`length === 2`).

```javascript
// Node.js code
const ascii = "A";
const emoji = "🚀";

console.log(ascii.length); // 1
console.log(emoji.length); // 2

// ❌ ANTI-PATTERN: Naive string reversal breaks surrogate pairs!
const brokenReverse = emoji.split("").reverse().join("");
console.log(brokenReverse); // Outputs corrupted characters (e.g. )

// ✅ PATTERN: Iterate by Unicode code points using Array.from or for...of
const safeCharacters = Array.from(emoji);
console.log(safeCharacters.length); // 1
console.log(safeCharacters[0]);      // "🚀"

// Inspecting code points vs code units
console.log(emoji.charCodeAt(0));   // 55357 (High surrogate code unit)
console.log(emoji.codePointAt(0));  // 128640 (Full Unicode code point)
```

| Method | Unit Inspected | Surrogate Pair Safe? |
|---|---|---|
| `str.charCodeAt(i)` | 16-bit Code Unit ($0$ to $65535$) | ❌ No |
| `str.codePointAt(i)` | Full 32-bit Unicode Code Point | ✅ Yes |
| `str[i]` | Character at 16-bit Code Unit index | ❌ No |
| `for (const ch of str)` | Full Unicode character stream | ✅ Yes |
| `Array.from(str)` | Array of full Unicode characters | ✅ Yes |

---

### 4. Character Frequency Vectors ($O(1)$ Auxiliary Space)

When a problem statement restricts inputs to lowercase English letters (`'a'` through `'z'`), an array of size 26 is asymptotically optimal ($O(1)$ space) and avoids hash map hashing overhead.

```
Character Code Offsets:
'a' = 97  --> 97 - 97 = index 0
'b' = 98  --> 98 - 97 = index 1
...
'z' = 122 --> 122 - 97 = index 25
```

```javascript
// Node.js code
function getCharacterFrequencies(str) {
  // Fixed 26-slot integer array (O(1) auxiliary space)
  const freq = new Array(26).fill(0);

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // Boundary check for lowercase English
    if (code >= 97 && code <= 122) {
      freq[code - 97]++;
    }
  }

  return freq;
}

const sampleFreq = getCharacterFrequencies("banana");
// 'a' (code 97) appears 3 times -> freq[0] === 3
// 'b' (code 98) appears 1 time  -> freq[1] === 1
// 'n' (code 110) appears 2 times -> freq[13] === 2
console.log("Frequencies: a =", sampleFreq[0], "b =", sampleFreq[1], "n =", sampleFreq[13]);
```

---

### 5. Algorithmic Patterns: Palindrome, Anagram, Subsequence

#### Pattern A: Valid Palindrome (Two Pointers Inward Scan)
A string is a palindrome if it reads identically forwards and backwards after ignoring non-alphanumeric characters and normalizing case.

```javascript
// Node.js code
function isAlphaNumeric(code) {
  return (
    (code >= 48 && code <= 57)  || // 0-9
    (code >= 65 && code <= 90)  || // A-Z
    (code >= 97 && code <= 122)    // a-z
  );
}

function isPalindrome(s) {
  let left = 0;
  let right = s.length - 1;

  while (left < right) {
    // Advance left pointer past non-alphanumerics
    while (left < right && !isAlphaNumeric(s.charCodeAt(left))) {
      left++;
    }
    // Decrement right pointer past non-alphanumerics
    while (left < right && !isAlphaNumeric(s.charCodeAt(right))) {
      right--;
    }

    if (s[left].toLowerCase() !== s[right].toLowerCase()) {
      return false; // Mismatch discovered
    }

    left++;
    right--;
  }

  return true;
}

console.log(isPalindrome("A man, a plan, a canal: Panama")); // true
console.log(isPalindrome("race a car")); // false
```
- **Time Complexity:** $O(n)$ — each character is visited at most twice.
- **Auxiliary Space:** $O(1)$ — pointers move in place without creating filtered substrings or arrays.

#### Pattern B: Valid Anagram (Balanced Frequency Vector)
Two strings are anagrams if they contain the identical multiset of characters with equal frequencies.

```javascript
// Node.js code
function isAnagram(s, t) {
  if (s.length !== t.length) return false;

  const counts = new Array(26).fill(0);

  for (let i = 0; i < s.length; i++) {
    counts[s.charCodeAt(i) - 97]++; // Increment for string s
    counts[t.charCodeAt(i) - 97]--; // Decrement for string t
  }

  for (let i = 0; i < 26; i++) {
    if (counts[i] !== 0) return false;
  }

  return true;
}

console.log(isAnagram("anagram", "nagaram")); // true
console.log(isAnagram("rat", "car"));         // false
```
- **Time Complexity:** $O(n)$ where $n = s.\text{length}$.
- **Auxiliary Space:** $O(1)$ (fixed 26-element array).

#### Pattern C: Is Subsequence (Greedy Two-Pointer Scan)
Verify if all characters of string `s` appear inside string `t` in their original relative sequence.

```javascript
// Node.js code
function isSubsequence(s, t) {
  let sIndex = 0;
  let tIndex = 0;

  while (sIndex < s.length && tIndex < t.length) {
    if (s[sIndex] === t[tIndex]) {
      sIndex++; // Advance target probe upon match
    }
    tIndex++; // Always advance host string pointer
  }

  return sIndex === s.length;
}

console.log(isSubsequence("ace", "abcde")); // true
console.log(isSubsequence("aec", "abcde")); // false
```
- **Time Complexity:** $O(n)$ where $n = t.\text{length}$.
- **Auxiliary Space:** $O(1)$.

---

## Tricky Points and Edge Cases

### 1. The V8 Sliced String Memory Retention Leak in Node.js
When you slice a small string out of a massive string in V8, the sliced string internally references the entire parent string. If the small substring is retained in a long-lived cache, the multi-megabyte parent string cannot be garbage collected.

```javascript
// Node.js code
function extractTokenVulnerable(largePayload) {
  // SlicedString maintains internal pointer to largePayload!
  return largePayload.slice(0, 16);
}

function extractTokenSafe(largePayload) {
  // Force creation of a fresh flat string by cloning character data
  const token = largePayload.slice(0, 16);
  // In V8, concatenating with an empty string or using Buffer creates a detached string
  return (" " + token).slice(1);
}
```

### 2. `replace()` vs `replaceAll()` and Global Flags
Calling `str.replace("a", "b")` with a string literal replaces **only the first match**. To replace every occurrence, use `replaceAll()` or a RegExp with the global flag `/g`.

```javascript
// Node.js code
const original = "banana";

// ❌ Trap: Replaces only the first 'a'
console.log(original.replace("a", "o")); // "bonana"

// ✅ Pattern: Replaces all occurrences
console.log(original.replaceAll("a", "o")); // "bonono"
console.log(original.replace(/a/g, "o"));   // "bonono"
```

### 3. `slice()` vs `substring()`
Always standardize on `String.prototype.slice()`.
- `slice(start, end)` supports negative indices counting backwards from the string end (`slice(-3)` gets the last 3 characters).
- `substring(start, end)` treats negative indices as `0` and swaps arguments if `start > end`.

---

## Hands-On Exercise

### Scenario
You are implementing a log parser for a high-throughput Node.js microservice. You must find the index of the first non-repeating character in a lowercase stream line. If no unique character exists, return `-1`.

### Buggy Code
```javascript
// Node.js code
function firstUniqCharBuggy(s) {
  for (let i = 0; i < s.length; i++) {
    // ❌ Bug: indexOf and lastIndexOf scan the entire string inside an outer loop!
    // Time complexity becomes O(n^2), timing out on large strings.
    if (s.indexOf(s[i]) === s.lastIndexOf(s[i])) {
      return i;
    }
  }
  return -1;
}
```

### Acceptance Criteria
1. The solution must run in strictly $O(n)$ time.
2. The solution must use $O(1)$ auxiliary space (a 26-slot frequency array).
3. The function must pass edge cases: empty strings, single character strings, all duplicates, and unique character at the final index.

### Solution Code

```javascript
// Node.js code
import assert from "node:assert/strict";

function firstUniqChar(s) {
  if (s.length === 0) return -1;
  if (s.length === 1) return 0;

  // Pass 1: Build frequency vector in O(n) time, O(1) space
  const counts = new Array(26).fill(0);
  for (let i = 0; i < s.length; i++) {
    counts[s.charCodeAt(i) - 97]++;
  }

  // Pass 2: Identify the first character whose frequency is exactly 1
  for (let i = 0; i < s.length; i++) {
    if (counts[s.charCodeAt(i) - 97] === 1) {
      return i;
    }
  }

  return -1;
}

// Verification Tests
assert.equal(firstUniqChar("leetcode"), 0);     // 'l' is at index 0
assert.equal(firstUniqChar("loveleetcode"), 2); // 'v' is at index 2
assert.equal(firstUniqChar("aabb"), -1);        // No unique characters
assert.equal(firstUniqChar("z"), 0);           // Single character
assert.equal(firstUniqChar(""), -1);           // Empty string

console.log("✅ All firstUniqChar test assertions passed successfully!");
```

### Solution Explanation

1. **Two-Pass Algorithm:** The first pass iterates across all $n$ characters and increments the corresponding bucket in the 26-element array ($O(n)$ time). The second pass inspects the characters in order of their original indices and returns the first index where `counts[code - 97] === 1`.
2. **Strict $O(1)$ Memory:** Regardless of whether the string length is 10 or 1,000,000 characters, the auxiliary space allocated is bounded to exactly 26 integers.

---

## Summary

- JavaScript strings are immutable primitives; index mutations fail or throw, and every modification creates a new allocation.
- In-loop string concatenation via `+=` causes $O(n^2)$ copying overhead; accumulate parts in an array and invoke `.join("")` once.
- Lowercase English character frequencies can be tracked in $O(1)$ auxiliary memory using `charCodeAt(i) - 97` inside a 26-element array.
- JavaScript measures string length in 16-bit UTF-16 code units; characters outside the BMP (such as emojis) require surrogate pairs (`codePointAt()`, `Array.from()`).
- Two-pointer inward scanning solves palindrome verification in $O(n)$ time with $O(1)$ memory without allocating reversed strings.

---

## Cheat Sheet

### Common String Complexities
| Operation | Method / Pattern | Time Complexity | Space Complexity |
|---|---|---|---|
| Index Access | `str[i]` | $O(1)$ | $O(1)$ |
| Substring Slice | `str.slice(start, end)` | $O(k)$ | $O(k)$ (or V8 sliced string pointer) |
| Naive Loop Concatenation | `str += char` | $O(n^2)$ | $O(n^2)$ allocations |
| Array Join | `arr.join("")` | $O(n)$ | $O(n)$ single buffer allocation |
| Character Code | `str.charCodeAt(i)` | $O(1)$ | $O(1)$ |
| Unicode Code Point | `str.codePointAt(i)` | $O(1)$ | $O(1)$ |

### Common Pitfalls
- **The Accidental $O(n^2)$ Search:** Calling `str.indexOf()` or `str.includes()` inside an outer loop creates nested quadratic iteration.
- **Surrogate Splitting:** Using `str.split("").reverse().join("")` splits 32-bit surrogate pairs into invalid code units.
- **Single Replacement Trap:** Forgetting that `str.replace("a", "b")` only replaces the first instance.
- **Case Inconsistency:** Comparing character codes directly without case normalization (`"A".charCodeAt(0) === 65` while `"a".charCodeAt(0) === 97`).
- **Memory Retention with Slices:** Retaining tiny substrings extracted from large request buffers in long-lived caches in Node.js.

---

## Interview Questions

### 1. What is string immutability in JavaScript, and why does naive concatenation inside loops cause $O(n^2)$ performance degradation?

**Question:** Explain what string immutability means at the memory level and why appending characters with `+=` inside a loop degrades performance quadratically.

**Answer:** String immutability means that once a string primitive is allocated in memory, its character contents cannot be modified in place. Operations like `word[0] = 'a'` either fail silently or throw in strict mode.

When you execute `str += char` inside a loop of $n$ iterations, JavaScript cannot expand the existing memory buffer in place. For each iteration $i$, a new memory buffer of size $i$ must be allocated, and all existing $i - 1$ characters must be copied over along with the new character. Summing the character copies across all iterations yields:
$$\sum_{i=1}^{n} i = \frac{n(n + 1)}{2} = O(n^2)$$
For $n = 50,000$, this triggers over 1.25 billion memory copy operations and massive garbage collection pressure. To solve this, collect tokens into an array (`parts.push(token)`) where appends are $O(1)$ amortized, and execute `parts.join("")` once at the end in $O(n)$ time.

---

### 2. How do V8 sliced strings work, and how can slicing a tiny substring from a huge HTTP payload cause a memory leak in Node.js?

**Question:** What internal optimization does V8 use for `String.prototype.slice()`, and how can it lead to unintended memory retention in a Node.js backend?

**Answer:** In the V8 engine, calling `str.slice(start, end)` on a string does not always create a new flat copy of the characters. Instead, V8 creates an internal object called a **Sliced String**, which contains:
1. A reference pointer back to the parent string.
2. An integer offset.
3. An integer length.

If a Node.js server receives a 50 MB HTTP payload (e.g., an uploaded XML or JSON string) and extracts a 20-character session ID using `payload.slice(0, 20)`, storing that 20-character string in a long-lived cache (like an in-memory Map) prevents the entire 50 MB parent payload from being garbage collected. Even though the developer believes only 20 bytes are stored, the root pointer prevents freeing the 50 MB parent.

To fix this leak, you must force V8 to allocate an independent flat string, such as by slicing and concatenating with an empty string: `(" " + token).slice(1)`.

---

### 3. How does JavaScript handle Unicode characters, and why does `'🚀'.length` equal `2`? How do you safely iterate Unicode strings?

**Question:** Explain UTF-16 code units versus code points in JavaScript, why emoji lengths appear doubled, and how to safely reverse or process text containing emojis.

**Answer:** JavaScript strings are encoded using UTF-16. In UTF-16, characters are represented by 16-bit **code units** ($0$ to $0xFFFF$). Basic characters (Latin, digits, common punctuation) fit within a single 16-bit unit.

However, Unicode contains over $1,114,112$ characters (code points up to $0x10FFFF$). Characters outside the Basic Multilingual Plane (such as emojis like `'🚀'`, mathematical symbols, and rare Han characters) cannot fit into 16 bits. UTF-16 represents these characters using two consecutive 16-bit code units known as a **surrogate pair** (one high surrogate between $0xD800$–$0xDBFF$ and one low surrogate between $0xDC00$–$0xDFFF$).

Because `String.prototype.length` counts 16-bit code units rather than visual glyphs or code points, `'🚀'.length` returns `2`. Naively reversing via `'🚀'.split('').reverse().join('')` inverts the surrogate order, producing corrupt replacement characters (``).

To safely iterate or manipulate Unicode strings:
1. Use `for...of` or `Array.from(str)`: The ES2015 iterator protocol is code-point aware and yields full characters.
2. Use `str.codePointAt(i)` instead of `str.charCodeAt(i)` to read the true 32-bit scalar value.

---

### 4. How do sorting, hash maps, and fixed-size arrays compare for anagram detection across time, space, and character constraints?

**Question:** Compare sorting, using a `Map`, and using a 26-element array when determining if two strings of length $n$ are anagrams.

**Answer:**

| Strategy | Time Complexity | Auxiliary Space | Constraints & Trade-offs |
|---|---|---|---|
| **Sorting** (`split('').sort().join('')`) | $O(n \log n)$ | $O(n)$ | Works on arbitrary Unicode characters, but is the slowest asymptotically and allocates multiple temporary arrays. |
| **Hash Map** (`Map` counter) | $O(n)$ | $O(u)$ where $u \le n$ is unique characters | Works across arbitrary character sets (Unicode, emojis, mixed case). Has minor hashing overhead per lookup. |
| **Fixed Array** (26-element array) | $O(n)$ | $O(1)$ constant space | The fastest approach in practice with zero hash overhead and constant memory, but strictly requires the input character set to be bounded (e.g., `'a'`–`'z'`). |

In technical interviews, if the problem statement specifies *"lowercase English letters only"*, the 26-bucket array (`new Array(26).fill(0)`) is the expected optimal solution because its space complexity is strictly $O(1)$. If the input includes arbitrary Unicode or unknown alphabets, the `Map` approach is required.

---

<nav aria-label="Lecture navigation">

[Previous: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Recursion and Call Stack](day-04-recursion-and-call-stack.md)

</nav>
