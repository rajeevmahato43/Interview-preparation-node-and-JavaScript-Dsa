# Day 03: Strings and Text Patterns

<nav aria-label="Lecture navigation">

[← Day 02: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Day 04: Recursion and Call Stack →](day-04-recursion-and-call-stack.md)

</nav>

---

## What You Will Learn Today

- Why strings cannot be modified in place, and why that matters for performance.
- How to avoid building strings inside loops the slow way.
- How to use character codes to count letters without a Map.
- How to check if a string is a palindrome and whether two strings are anagrams.

---

## Prerequisites

- [DSA Day 01 – Big O and Problem Solving](day-01-big-o-and-problem-solving.md)
- [DSA Day 02 – Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md)
- **JavaScript strings:** [JS Day 03 – Values, Types, and Literals](../../Javascript/javascript-lectures/day-03-values-types-and-literals.md) and [JS Day 15 – Regular Expressions and Text Processing](../../Javascript/javascript-lectures/day-15-regular-expressions-and-text-processing.md)

---

## Quick Vocabulary

| Word | Plain meaning |
| :--- | :--- |
| **Immutable** | Cannot be changed after it is created. |
| **Allocate** | Reserve a new block of memory. |
| **Character code** | The number that represents a letter internally. `'a'` is 97, `'b'` is 98, and so on. |
| **Palindrome** | A string that reads the same forwards and backwards, e.g. `"racecar"`. |
| **Anagram** | Two strings that use exactly the same letters the same number of times, e.g. `"eat"` and `"tea"`. |
| **Two-pointer** | A technique that uses one index starting from the left and one from the right, moving toward the middle. |

---

## 1. Strings Cannot Be Changed In Place

In JavaScript, a string is **immutable** — once created, its characters are fixed. You cannot swap one letter for another directly:

```js
let word = "hello";
word[0] = "j"; // Does nothing in non-strict mode. Throws in strict mode.
console.log(word); // "hello" — unchanged
```

Every operation that appears to change a string — like `toUpperCase()`, `slice()`, or `replace()` — actually creates a **brand new string** in memory. The old one stays untouched.

---

## 2. The String-Building Trap — O(n²) Hidden in a Loop

Because each `+=` creates a new string and copies all previous characters into it, building a string character by character in a loop is very slow.

```js
// SLOW — O(n²) time
let result = "";
for (let i = 0; i < n; i++) {
  result += chars[i]; // creates a new string every iteration, copying everything
}
```

For 10 000 characters: step 1 copies 1 character, step 2 copies 2, step 3 copies 3 … the total is roughly 50 million character copies.

**The fix — collect into an array, join once at the end:**

```js
// FAST — O(n) time
const parts = [];
for (let i = 0; i < n; i++) {
  parts.push(chars[i]); // O(1) push
}
const result = parts.join(""); // one allocation at the end
```

> [!WARNING]
> Any time you build a long string inside a loop, use an array + `.join("")`. This is a common interview and production pitfall.

---

## 3. Character Codes — A Fast Way to Count Letters

Every character has a number assigned to it. For lowercase English letters:

```
'a' = 97,  'b' = 98,  'c' = 99, … 'z' = 122
```

To convert any letter to a slot in a 26-element array:
```js
const index = str.charCodeAt(i) - 97;
// 'a' → 0,  'b' → 1, … 'z' → 25
```

This gives you a frequency counter of fixed size O(1) space — faster and simpler than a Map when the problem says *"lowercase English letters only"*.

```js
// Count letter frequencies for "hello"
const freq = new Array(26).fill(0);
for (const ch of "hello") {
  freq[ch.charCodeAt(0) - 97]++;
}
// freq[7]  = 1  (h)
// freq[4]  = 1  (e)
// freq[11] = 2  (l)
// freq[14] = 1  (o)
```

---

## 4. Unicode Note

JavaScript strings store each character as a 16-bit number (UTF-16).

- Normal letters and digits take **1 slot**: `"a".length === 1`.
- Emojis and many international characters take **2 slots**: `"🚀".length === 2`.

For most interview problems this does not matter. But if the problem could contain emojis, use `for...of` instead of index access — it reads full characters, not slots.

> **Deep dive:** [JS Day 03 – Values, Types, and Literals](../../Javascript/javascript-lectures/day-03-values-types-and-literals.md) covers string encoding in detail.

---

## Worked Examples

### Example 1 — Valid Palindrome (Two-Pointer)

**Problem:** Check if a string reads the same forwards and backwards, ignoring non-letter, non-digit characters and case.

```
Input:  "A man, a plan, a canal: Panama"
Output: true   (after removing non-alphanumeric characters and lowercasing → "amanaplanacanalpanama")
```

**Approach:** Place one pointer at the start (`left`) and one at the end (`right`). Skip any character that is not a letter or digit. Compare. Move both pointers inward. If any pair mismatches, return false.

```js
// JavaScript (Node.js / browser)
function isPalindrome(s) {
  let left = 0;
  let right = s.length - 1;

  while (left < right) {
    // Skip non-alphanumeric from the left
    while (left < right && !isAlphaNum(s.charCodeAt(left))) left++;
    // Skip non-alphanumeric from the right
    while (left < right && !isAlphaNum(s.charCodeAt(right))) right--;

    if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;

    left++;
    right--;
  }

  return true;
}

function isAlphaNum(code) {
  return (
    (code >= 48 && code <= 57)  || // '0'–'9'
    (code >= 65 && code <= 90)  || // 'A'–'Z'
    (code >= 97 && code <= 122)    // 'a'–'z'
  );
}
```

**Complexity:** O(n) time, O(1) space — no new strings or arrays are created.

---

### Example 2 — Valid Anagram (26-Bucket Frequency Count)

**Problem:** Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`.

```
Input:  s = "anagram",  t = "nagaram"
Output: true

Input:  s = "rat",  t = "car"
Output: false
```

**Approach:** Use a 26-element array as a counter. Add 1 for each character in `s`. Subtract 1 for each character in `t`. If all counts end up at zero, the strings are anagrams.

```js
// JavaScript (Node.js / browser)
function isAnagram(s, t) {
  if (s.length !== t.length) return false; // different lengths = definitely not anagram

  const counts = new Array(26).fill(0);

  for (let i = 0; i < s.length; i++) {
    counts[s.charCodeAt(i) - 97]++; // add 1 for letter in s
    counts[t.charCodeAt(i) - 97]--; // subtract 1 for letter in t
  }

  // If all counts are zero, every letter balanced out
  return counts.every(c => c === 0);
}
```

**Complexity:** O(n) time, O(1) space (the array is always 26 elements regardless of input size).

---

## Common Mistakes

### 1. Using `replace` when you meant `replaceAll`

```js
"aabbcc".replace("b", "x");    // "axbcc"  — only the FIRST "b" is replaced
"aabbcc".replaceAll("b", "x"); // "aaxxcc" — all "b"s replaced
```

When you need to replace every occurrence, use `replaceAll` or the regex global flag `/b/g`.

### 2. Reversing a string with `split + reverse + join` in interviews

```js
const reversed = s.split("").reverse().join(""); // creates two temporary arrays
```

This works but uses O(n) extra memory. For palindrome checking, the two-pointer approach (Example 1 above) does it in O(1) space with no new allocations.

### 3. Forgetting to normalise case before comparing characters

```js
// Bug: 'A' (65) !== 'a' (97) even though they are the same letter
if (s[left] !== s[right]) return false; // fails for mixed-case input

// Fix: normalise first
if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
```

---

## Tricky Points

- **`slice` vs `substring`:** Prefer `str.slice(start, end)`. `slice` supports negative indices (`str.slice(-3)` = last 3 characters). `substring` treats negative indices as 0.
- **V8 string slicing:** In V8 (the JavaScript engine in Node.js), `str.slice(0, 5)` on a very large string may keep a hidden reference to the full parent string in memory. If you need to release memory, copy with `String(str.slice(0, 5))`.

---

## Practical Exercise

Write `firstUniqueChar(s)` that returns the index of the first character that appears only once in lowercase string `s`. Return `-1` if none exists.

**Example:**
```
Input:  "leetcode"
Output: 0   ('l' appears once)

Input:  "aabb"
Output: -1  (no unique character)
```

**Constraints:**
- Must run in O(n) time.
- Use the 26-bucket array approach, not a Map.
- Two passes: one to count, one to find the first count-of-1.

---

## Summary

- Strings are **immutable** — every modification creates a new string in memory.
- Never build a long string with `+=` inside a loop — use an array and `.join("")` for O(n) performance.
- When the problem says "lowercase English letters only", a **26-element array** (`new Array(26).fill(0)`) is faster than a Map and uses O(1) space.
- The **two-pointer** technique checks palindromes in O(n) time with O(1) space — no new string created.
- Always normalise case before comparing characters; `'A' !== 'a'` in character code comparisons.

---

## Cheat Sheet

### Character Code Reference
| Range | Codes |
| :--- | :--- |
| `'0'` – `'9'` | 48 – 57 |
| `'A'` – `'Z'` | 65 – 90 |
| `'a'` – `'z'` | 97 – 122 |

Lowercase bucket index: `str.charCodeAt(i) - 97`

### String Operation Complexity
| Operation | Time | Notes |
| :--- | :--- | :--- |
| `s[i]` index read | O(1) | |
| `s.slice(i, j)` | O(k) | k = slice length |
| `s += x` in loop | O(n²) total | Use array + join instead |
| `arr.join("")` | O(n) | One allocation |
| `s.charCodeAt(i)` | O(1) | |

### Pattern: 26-Bucket Counter
```js
const freq = new Array(26).fill(0);
for (const ch of str) freq[ch.charCodeAt(0) - 97]++;
// freq[0] = count of 'a', freq[1] = count of 'b', …
```

---

## Interview Questions

### 1. Concept Check

**Question:** What does string immutability mean, and why does it make `+=` in a loop slow?

**Expected answer:** Immutable means the string's characters cannot be changed in place. Each `+=` allocates a fresh string and copies all previous characters into it. For n iterations, the total copy work is 1 + 2 + … + n = O(n²). Fix by pushing to an array and calling `.join("")` once at the end.

---

### 2. Predict the Output

**Question:** What does this output and why?
```js
const s = "hello";
s[0] = "j";
console.log(s);
console.log("ball".replace("l", "r"));
```

**Expected answer:** First line prints `"hello"` — strings are immutable, so index assignment is silently ignored. Second line prints `"balr"` — `.replace` without a global flag replaces only the first match.

---

### 3. Implement It

**Question:** Implement `isSubsequence(s, t)` returning `true` if every character of `s` appears in `t` in the same order (not necessarily adjacent). Must run in O(n) time where n is the length of `t`.

**Expected answer:**
```js
function isSubsequence(s, t) {
  let sIndex = 0;
  let tIndex = 0;

  while (sIndex < s.length && tIndex < t.length) {
    if (s[sIndex] === t[tIndex]) sIndex++; // matched a character — advance in s
    tIndex++; // always advance in t
  }

  return sIndex === s.length; // did we match all of s?
}

// isSubsequence("ace", "abcde") → true
// isSubsequence("aec", "abcde") → false
```

---

### 4. Debug a Bug

**Question:** A function builds a 50 000-line CSV using `csv += line + "\n"` in a loop and times out. Why and how do you fix it?

**Expected answer:** Each `+=` allocates a new string and copies all previous content. For 50 000 lines the total character copies grow as O(n²) — millions of unnecessary operations. Fix:
```js
const lines = [];
for (const row of data) lines.push(formatRow(row));
return lines.join("\n"); // O(n) — one allocation
```

---

### 5. Anagram Trade-offs

**Question:** Compare three approaches for checking if two strings are anagrams: sort both, use a Map, use a 26-element array.

**Expected answer:**
| Approach | Time | Space | Constraint |
| :--- | :--- | :--- | :--- |
| Sort both strings | O(n log n) | O(n) for copies | Works for any characters |
| Map | O(n) | O(u) — u unique chars | Works for any characters |
| 26-element array | O(n) | O(1) | Lowercase English only |

Use the array when the problem guarantees lowercase English — it is the fastest and uses constant space.

---

### 6. Senior Follow-up — Node.js

**Question:** You need to process a 5 GB text file on a Node.js server with 1 GB of RAM. What goes wrong with `fs.readFileSync` and how do you solve it?

**Expected answer:** `fs.readFileSync` loads the entire 5 GB into memory at once. Node.js (V8) has a default heap limit of about 1.5 GB, so this crashes the process with an out-of-memory error.

Fix: read the file as a stream using `fs.createReadStream()` paired with the `readline` module to process one line at a time. Memory stays bounded at O(1) regardless of file size.

---

<nav aria-label="Lecture navigation">

[← Day 02: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Day 04: Recursion and Call Stack →](day-04-recursion-and-call-stack.md)

</nav>
