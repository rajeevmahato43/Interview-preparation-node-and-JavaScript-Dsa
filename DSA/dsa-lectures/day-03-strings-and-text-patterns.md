# Day 03: Strings and Text Patterns

<nav aria-label="Lecture navigation">

[Previous: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Recursion and Call Stack](day-04-recursion-and-call-stack.md)

</nav>

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Asymptotic analysis and auxiliary space.
- [Day 02: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md) — Array allocations and hash tables.
- Basic understanding of JavaScript strings and loops.

---

## 1. String Immutability and Memory in V8

In JavaScript, strings are primitive values. Once a string is created, its characters **cannot** be changed in place.

> **String Immutability**: A string primitive cannot be mutated in place. Any change (like `str += 'a'` or `.slice()`) always allocates a brand new string in memory.

If you attempt to modify a character by index, it either fails silently or throws an error in strict mode:

```javascript
// Node.js code
"use strict";

const word = "hello";

// ❌ ANTI-PATTERN: Attempting in-place mutation does not work
try {
  word[0] = "j"; // Throws TypeError in strict mode!
} catch (err) {
  console.log("Cannot mutate string index:", err.message);
}

// ✅ PATTERN: Create a new string explicitly
const updated = "j" + word.slice(1);
console.log(updated); // "jello"
```

### How V8 Stores Strings Internally

To keep operations fast, the V8 engine (Node.js/Chrome) uses special string representations under the hood:

1. **Flat Strings**: Characters are stored next to each other in memory in one continuous row. Reading by index takes $O(1)$ time.
2. **Cons-Strings**: When you join two strings with `+`, V8 avoids copying immediately. Instead, it creates a small pointer tree linking both strings.
   > **Cons-String**: A V8 internal tree where two strings are linked using pointers rather than copied right away. This delays the expensive copy until the string is finally read or printed.
3. **Sliced Strings**: When you call `slice()` on a large string, V8 creates a small pointer referencing the parent string with a start offset and length.
   > **Sliced String**: A V8 internal pointer that references a section of a parent string with an offset and length, avoiding memory allocation until needed.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           JAVASCRIPT STRING RUNTIME & MEMORY TAXONOMY                       │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  1. FLAT STRING (Contiguous Character Storage)
     "hello"  --> [ 'h' | 'e' | 'l' | 'l' | 'o' ]
     • Indexed random access: O(1)
     • Read-only: Mutating an index fails or throws!

  2. CONS-STRING (Concatenation Tree)
     strA + strB --> ConsString { left: ptr(strA), right: ptr(strB) }
     • Delays copying until the string is flattened upon access.

  3. SLICED STRING (Window into Parent String)
     parentStr.slice(0, 5) --> SlicedString { parent: ptr(parentStr), offset: 0, length: 5 }
     • O(1) creation time, but holds onto the parent string's memory!
```

---

## 2. The String Building Trap: O(n²) vs Array Buffer O(n)

Because strings are immutable, adding characters one by one with `+=` inside a loop forces JavaScript to allocate and copy all previous characters over and over again!

```
Iteration 1: copy 1 char
Iteration 2: copy 2 chars
Iteration 3: copy 3 chars
...
Iteration n: copy n chars
Total copies = 1 + 2 + 3 + ... + n = n(n + 1) / 2 = O(n²) operations!
```

```javascript
// Node.js code
// ❌ ANTI-PATTERN: O(n^2) quadratic string concatenation inside a loop
function buildCsvSlow(rowCount) {
  let csv = "";
  for (let i = 0; i < rowCount; i++) {
    csv += `row_${i},val_${i}\n`; // Constant re-allocation and character copying!
  }
  return csv;
}

// ✅ PATTERN: Collect tokens in an array and join once in O(n) time
function buildCsvFast(rowCount) {
  const parts = new Array(rowCount);
  for (let i = 0; i < rowCount; i++) {
    parts[i] = `row_${i},val_${i}\n`;
  }
  return parts.join(""); // Single pass allocation and copy
}

const n = 20000;
console.time("Slow Concatenation (O(n^2))");
buildCsvSlow(n);
console.timeEnd("Slow Concatenation (O(n^2))");

console.time("Fast Array Join (O(n))");
buildCsvFast(n);
console.timeEnd("Fast Array Join (O(n))");
```

---

## 3. Unicode, Emojis, and UTF-16 Surrogate Pairs

JavaScript encodes strings using **UTF-16**.

> **Code Unit vs Code Point**: In UTF-16, a **code unit** is a 16-bit storage slot ($0$ to $0xFFFF$). Basic Latin letters use 1 code unit. Emojis and special symbols require 2 code units (called a **surrogate pair**) to represent 1 full character (**code point**).

Because `.length` counts 16-bit code units rather than visual characters, an emoji has a length of 2!

```javascript
// Node.js code
const letter = "A";
const emoji = "🚀";

console.log(letter.length); // 1
console.log(emoji.length);  // 2! (Surrogate pair: 2 code units)

// ❌ ANTI-PATTERN: Naive string reversal corrupts emojis!
const broken = emoji.split("").reverse().join("");
console.log(broken); // Outputs broken question mark characters!

// ✅ PATTERN: Use Array.from() or for...of to handle full Unicode characters
const safeChars = Array.from(emoji);
console.log(safeChars.length); // 1
console.log(safeChars[0]);      // "🚀"

// Code units vs Code points
console.log(emoji.charCodeAt(0));  // 55357 (High surrogate code unit)
console.log(emoji.codePointAt(0)); // 128640 (Full Unicode code point)
```

### Unicode String Methods Comparison

| Method | What It Inspects | Handles Emojis Safely? |
|---|---|---|
| `str.charCodeAt(i)` | 16-bit Code Unit ($0$ to $65535$) | ❌ No (splits surrogate pairs) |
| `str[i]` | Character at 16-bit Code Unit index | ❌ No |
| `str.length` | Total 16-bit Code Units | ❌ No (counts emojis as 2) |
| `str.codePointAt(i)` | Full 32-bit Unicode Code Point | ✅ Yes |
| `for (const ch of str)` | Full character sequence | ✅ Yes |
| `Array.from(str)` | Array of full Unicode characters | ✅ Yes |

---

## 4. Character Frequency Vectors in O(1) Auxiliary Space

When an interview problem specifies that inputs only contain lowercase English letters (`'a'` through `'z'`), using a fixed 26-slot array gives you **$O(1)$ auxiliary (extra) space** and runs faster than a `Map`.

> **Frequency Vector**: A fixed-size array (like 26 slots for `'a'`–`'z'`) where each index represents a letter offset: $\text{index} = \text{charCode} - 97$.

```
'a' (ASCII 97)  --> 97 - 97 = index 0
'b' (ASCII 98)  --> 98 - 97 = index 1
...
'z' (ASCII 122) --> 122 - 97 = index 25
```

```javascript
// Node.js code
function getCharacterCounts(str) {
  // Fixed 26-slot integer array (O(1) auxiliary space)
  const freq = new Array(26).fill(0);

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 97 && code <= 122) {
      freq[code - 97]++;
    }
  }

  return freq;
}

const counts = getCharacterCounts("banana");
// 'a' appears 3 times -> counts[0] === 3
// 'b' appears 1 time  -> counts[1] === 1
// 'n' appears 2 times -> counts[13] === 2
console.log("Frequencies: a =", counts[0], "b =", counts[1], "n =", counts[13]);
```

---

## 5. Three Core String Patterns

### Pattern A: Valid Palindrome (Two Pointers Inward Scan)
A string is a palindrome if it reads the same forward and backward, ignoring non-alphanumeric characters and case.

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
    // Skip non-alphanumeric characters on the left
    while (left < right && !isAlphaNumeric(s.charCodeAt(left))) {
      left++;
    }
    // Skip non-alphanumeric characters on the right
    while (left < right && !isAlphaNumeric(s.charCodeAt(right))) {
      right--;
    }

    if (s[left].toLowerCase() !== s[right].toLowerCase()) {
      return false; // Mismatch found
    }

    left++;
    right--;
  }

  return true;
}

console.log(isPalindrome("A man, a plan, a canal: Panama")); // true
console.log(isPalindrome("race a car")); // false
```
- **Time Complexity:** $O(n)$ — each character is inspected at most twice.
- **Auxiliary Space:** $O(1)$ — pointers move in place without creating extra strings or arrays.

---

### Pattern B: Valid Anagram (Balanced Frequency Vector)
Two strings are anagrams if they use the exact same characters with the same frequencies.

```javascript
// Node.js code
function isAnagram(s, t) {
  if (s.length !== t.length) return false;

  const counts = new Array(26).fill(0);

  // Single loop: count up for s, count down for t
  for (let i = 0; i < s.length; i++) {
    counts[s.charCodeAt(i) - 97]++;
    counts[t.charCodeAt(i) - 97]--;
  }

  // If all counts are 0, both strings matched perfectly
  for (let i = 0; i < 26; i++) {
    if (counts[i] !== 0) return false;
  }

  return true;
}

console.log(isAnagram("anagram", "nagaram")); // true
console.log(isAnagram("rat", "car"));         // false
```
- **Time Complexity:** $O(n)$ where $n = s.\text{length}$.
- **Auxiliary Space:** $O(1)$ (bounded 26-slot array).

---

### Pattern C: Is Subsequence (Greedy Two-Pointer Scan)
Check if all characters of string `s` appear in string `t` in their original order.

```javascript
// Node.js code
function isSubsequence(s, t) {
  let sIndex = 0;
  let tIndex = 0;

  while (sIndex < s.length && tIndex < t.length) {
    if (s[sIndex] === t[tIndex]) {
      sIndex++; // Matched character, look for next character in s
    }
    tIndex++; // Always advance in t
  }

  return sIndex === s.length;
}

console.log(isSubsequence("ace", "abcde")); // true
console.log(isSubsequence("aec", "abcde")); // false
```
- **Time Complexity:** $O(n)$ where $n = t.\text{length}$.
- **Auxiliary Space:** $O(1)$.

---

## Common Mistakes and Interview Traps

### 1. Hidden $O(n^2)$ Searching with `indexOf()` or `includes()`
Calling `str.indexOf()` or `str.includes()` inside an outer loop creates nested iteration:
```javascript
// Node.js code
// ❌ Quadratic O(n^2) trap
for (let i = 0; i < s.length; i++) {
  if (s.indexOf(s[i]) === s.lastIndexOf(s[i])) { ... }
}
```
Always replace nested searches with a single-pass frequency array or hash map ($O(n)$ time).

### 2. Forgetting that `replace()` Only Replaces the First Match
Calling `str.replace("a", "b")` with a string literal replaces **only the first match**:
```javascript
// Node.js code
const original = "banana";
console.log(original.replace("a", "o"));    // "bonana" (Replaced only first 'a'!)
console.log(original.replaceAll("a", "o")); // "bonono" (Replaced all 'a's!)
```

---

## Tricky Points and Edge Cases

### 1. The V8 Sliced String Memory Retention Leak in Node.js
When you slice a small substring from a huge string in V8, the sliced string internally points back to the entire parent string.
- If you parse a 50 MB JSON/XML payload and store a 20-character session ID token in a long-lived cache:
- V8 **cannot** garbage-collect the 50 MB parent string because the tiny token holds a pointer to it!

```javascript
// Node.js code
function extractTokenSafe(largePayload) {
  const token = largePayload.slice(0, 16);
  // Force V8 to allocate an independent flat string, detaching from the large parent
  return (" " + token).slice(1);
}
```

### 2. `slice()` vs `substring()`
Always use `String.prototype.slice()` in modern JavaScript:
- `str.slice(start, end)` supports negative indices (`slice(-3)` gets the last 3 characters).
- `str.substring(start, end)` treats negative numbers as `0` and swaps arguments if `start > end`, leading to unexpected results.

### 3. Comparing Character Codes Without Normalizing Case
`"A".charCodeAt(0)` is 65, while `"a".charCodeAt(0)` is 97. If an algorithm ignores case, always call `.toLowerCase()` or add a case check before calculating character code offsets.

---

## Hands-On Exercise: Finding the First Unique Character

### Scenario
You are building an event processing pipeline in Node.js. You must find the index of the first non-repeating character in a lowercase log stream line. If every character repeats, return `-1`.

### Buggy Code
```javascript
// Node.js code
// ❌ Inefficient O(n^2) implementation that times out on large streams
export function firstUniqCharBuggy(s) {
  for (let i = 0; i < s.length; i++) {
    // BUG: indexOf and lastIndexOf each scan the entire string inside the loop!
    if (s.indexOf(s[i]) === s.lastIndexOf(s[i])) {
      return i;
    }
  }
  return -1;
}
```

### Acceptance Criteria
1. The solution must run in strictly **$O(n)$ time**.
2. The solution must use **$O(1)$ auxiliary space** (a 26-slot frequency array).
3. Pass all edge cases: empty strings, single-character strings, all duplicates, and the unique character at the final index.
4. Verify using Node.js assertions.

### Solution Code
```javascript
// Node.js code
import assert from "node:assert/strict";

/**
 * Two-pass O(n) First Unique Character using a 26-element frequency vector
 */
export function firstUniqChar(s) {
  if (s.length === 0) return -1;
  if (s.length === 1) return 0;

  // Pass 1: Build frequency counts in O(n) time, O(1) space
  const counts = new Array(26).fill(0);
  for (let i = 0; i < s.length; i++) {
    counts[s.charCodeAt(i) - 97]++;
  }

  // Pass 2: Find the first character whose count is exactly 1
  for (let i = 0; i < s.length; i++) {
    if (counts[s.charCodeAt(i) - 97] === 1) {
      return i;
    }
  }

  return -1;
}

// Verification Tests
assert.equal(firstUniqChar("leetcode"), 0);     // 'l' at index 0
assert.equal(firstUniqChar("loveleetcode"), 2); // 'v' at index 2
assert.equal(firstUniqChar("aabb"), -1);        // No unique characters
assert.equal(firstUniqChar("z"), 0);           // Single character
assert.equal(firstUniqChar(""), -1);           // Empty string

console.log("✅ All firstUniqChar test assertions passed successfully!");
```

---

## Summary

- **String Immutability**: JavaScript strings are read-only primitives. Any index assignment (`str[0] = 'x'`) fails or throws. Every change creates a new string in memory.
- **The $O(n^2)$ Concatenation Trap**: Using `+=` inside a loop repeatedly allocates new strings and copies existing characters ($O(n^2)$ total work). Collect tokens in an array and use `arr.join("")` for clean $O(n)$ execution.
- **V8 Internal Representations**: V8 uses Flat Strings (fast contiguous), Cons-Strings (concatenation pointer trees), and Sliced Strings (pointers into parent strings).
- **Unicode & Surrogate Pairs**: UTF-16 measures strings in 16-bit code units. Basic letters use 1 unit, but emojis use 2 units (surrogate pairs), making `emoji.length === 2`. Always use `Array.from()` or `for...of` to iterate code points safely.
- **$O(1)$ Frequency Vectors**: For lowercase English letters, a fixed 26-slot array indexed by `charCodeAt(i) - 97` provides $O(1)$ auxiliary space and avoids hash map overhead.
- **Three Essential Patterns**:
  - Valid Palindrome: Two pointers inward scan ($O(n)$ time, $O(1)$ space).
  - Valid Anagram: Balanced frequency array ($O(n)$ time, $O(1)$ space).
  - Is Subsequence: Greedy two-pointer forward scan ($O(n)$ time, $O(1)$ space).

---

## Cheat Sheet

| Operation | Method / Pattern | Time Complexity | Auxiliary Space | Key Note |
|---|---|---|---|---|
| Index Access | `str[i]` | $O(1)$ | $O(1)$ | Reads 16-bit code unit |
| Substring Slice | `str.slice(start, end)` | $O(k)$ | $O(k)$ | Creates sliced string pointer |
| In-Loop Concatenation | `str += char` | $O(n^2)$ | $O(n^2)$ | Re-allocates on every step |
| Array Join | `arr.join("")` | $O(n)$ | $O(n)$ | Single pass memory allocation |
| Character Code | `str.charCodeAt(i)` | $O(1)$ | $O(1)$ | Code unit integer ($0$–$65535$) |
| Unicode Code Point | `str.codePointAt(i)` | $O(1)$ | $O(1)$ | Full 32-bit scalar value |

### Common Pitfalls Checklist
- [ ] Concatenating strings with `+=` inside large loops instead of using an array buffer with `.join("")`.
- [ ] Splitting emojis with `.split("").reverse().join("")`, corrupting surrogate pairs.
- [ ] Forgetting that `str.replace("a", "b")` only replaces the first instance (use `replaceAll()`).
- [ ] Keeping large parent HTTP request strings in memory by storing small sliced substrings in caches.
- [ ] Using `indexOf()` or `lastIndexOf()` inside loops, creating accidental $O(n^2)$ bottlenecks.

---

## Interview Questions

### 1. What is string immutability in JavaScript, and why does naive concatenation inside loops cause $O(n^2)$ performance degradation?

**Question:** Explain what string immutability means at the memory level and why appending characters with `+=` inside a loop degrades performance quadratically.

**Answer:** String immutability means that once a string primitive is allocated in memory, its characters cannot be changed in place. Operations like `word[0] = 'a'` either fail silently or throw a `TypeError` in strict mode.

When you execute `str += token` inside a loop of $n$ iterations, JavaScript cannot expand the existing memory buffer in place. For each iteration $i$, a new memory buffer of size $i$ must be allocated, and all existing $i - 1$ characters must be copied over along with the new token. Summing the character copies across all iterations yields:
$$\sum_{i=1}^{n} i = \frac{n(n + 1)}{2} = O(n^2)$$
For $n = 50,000$, this triggers over 1.25 billion memory copies and heavy garbage collection pressure. To solve this, collect tokens in an array (`parts.push(token)`) where appends take $O(1)$ amortized time, and call `parts.join("")` once at the end in $O(n)$ time.

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

**Answer:** JavaScript strings are encoded using UTF-16. In UTF-16, characters are represented by 16-bit **code units** ($0$ to $0xFFFF$). Basic characters (Latin letters, digits) fit within a single 16-bit unit.

However, Unicode contains over $1,114,112$ characters (code points up to $0x10FFFF$). Characters outside the Basic Multilingual Plane (such as emojis like `'🚀'`) cannot fit into 16 bits. UTF-16 represents these characters using two consecutive 16-bit code units known as a **surrogate pair**.

Because `String.prototype.length` counts 16-bit code units rather than visual glyphs, `'🚀'.length` returns `2`. Naively reversing via `'🚀'.split('').reverse().join('')` inverts the surrogate order, producing corrupt replacement characters.

To safely process Unicode strings:
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
