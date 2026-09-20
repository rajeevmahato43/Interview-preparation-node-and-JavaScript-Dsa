# Day 03: Strings and Text Patterns

<nav aria-label="Lecture navigation">

[Previous: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Recursion and Call Stack](day-04-recursion-and-call-stack.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain what string immutability means in JavaScript and why it affects performance.
- Avoid the hidden $O(n^2)$ cost of repeated string concatenation (`+=`) in loops.
- Use character codes (`charCodeAt`) and the 26-element array trick for fast letter counting.
- Solve **Valid Palindrome** using an in-place two-pointer scan.
- Solve **Valid Anagram** using a character frequency count.
- Understand how strings are stored in UTF-16 code units.

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md)
- [Day 02: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md)
- Basic string methods (`slice`, `charAt`, `toLowerCase`).

---

## Core Concepts

### 1. Immutability: Strings Cannot Change

In JavaScript, strings are **immutable primitive values**. Once created, their characters cannot be modified in place:

```js
let str = "hello";
str[0] = "j"; // Does nothing! In strict mode, it throws a TypeError.
console.log(str); // Still "hello"
```

Every method that seems to modify a string (`toUpperCase()`, `slice()`, `replace()`) actually **allocates a brand new string** in memory.

### 2. The Repeated Concatenation Trap

When you append characters in a loop using `+=`:
```js
// SLOW: O(n^2) Time and Memory!
let result = "";
for (let i = 0; i < n; i++) {
  result += "a"; // Creates a new string each time, copying all previous characters!
}
```
Each step allocates a new string and copies all previous characters. For $n$ characters, total characters copied is $1 + 2 + \dots + n = O(n^2)$.

#### The Fast Solution ($O(n)$):
Use an array to accumulate characters, then join once at the end:
```js
const chars = [];
for (let i = 0; i < n; i++) {
  chars.push("a");
}
const result = chars.join(""); // O(n) single allocation
```

---

### 3. Character Codes and the 26-Bucket Trick

Characters in JavaScript are stored as numbers:
- `'a'` is $97$, `'b'` is $98$, ..., `'z'` is $122$
- Formula: `str.charCodeAt(i) - 97` gives an index from $0$ to $25$.

```text
Letter:    'a'   'b'   'c'  ...  'z'
Index:      0     1     2   ...   25
Array:    [ 0  ,  0  ,  0  , ... , 0 ]
```

When an interview problem says *"lowercase English letters only"*, a simple 26-element array `new Array(26).fill(0)` is faster and cleaner than a `Map`!

---

## Detailed Explanations

### UTF-16 and Emojis

JavaScript strings are made of 16-bit code units (UTF-16):
- Regular letters and digits take 1 code unit: `"a".length === 1`.
- Emojis and special symbols take 2 code units (a **surrogate pair**): `"🚀".length === 2`!

If an interview problem might contain emojis or special Unicode symbols, use `for...of` or `Array.from(str)` to iterate over characters safely.

---

## Examples and Traces

### Example 1: Valid Palindrome (Two Pointers)

#### Problem:
Check if a string reads the same forwards and backwards, considering only alphanumeric characters and ignoring case.

#### Approach:
Use two pointers: `left` at the start, `right` at the end. Move them inward, skipping non-alphanumeric characters.
```js
function isPalindrome(s) {
  let left = 0;
  let right = s.length - 1;

  while (left < right) {
    while (left < right && !isAlphaNumeric(s.charCodeAt(left))) left++;
    while (left < right && !isAlphaNumeric(s.charCodeAt(right))) right--;

    if (s[left].toLowerCase() !== s[right].toLowerCase()) {
      return false;
    }

    left++;
    right--;
  }

  return true;
}

function isAlphaNumeric(code) {
  return (
    (code >= 48 && code <= 57) ||  // 0-9
    (code >= 65 && code <= 90) ||  // A-Z
    (code >= 97 && code <= 122)    // a-z
  );
}
```
- **Complexity**: $O(n)$ time, $O(1)$ extra space (no new strings or arrays created).

---

### Example 2: Valid Anagram

#### Problem:
Given two strings `s` and `t`, return `true` if `t` is an anagram of `s` (same characters with same counts).

#### Solution (26-Element Frequency Counter):
```js
function isAnagram(s, t) {
  if (s.length !== t.length) return false;

  const counts = new Array(26).fill(0);

  for (let i = 0; i < s.length; i++) {
    counts[s.charCodeAt(i) - 97]++;
    counts[t.charCodeAt(i) - 97]--;
  }

  // If anagrams, all counts should balance to 0
  for (let i = 0; i < 26; i++) {
    if (counts[i] !== 0) return false;
  }

  return true;
}
```
- **Complexity**: $O(n)$ time, $O(1)$ space (the array size is always fixed at 26).

---

## Common Mistakes and Interview Traps

1. **Reversing with `split('').reverse().join('')`**: While working for small strings, it creates two temporary arrays and a new string. A two-pointer scan uses $O(1)$ space.
2. **Regex Replace Inside Loops**: Avoid calling `.replace(/[^a-z]/g, '')` repeatedly in a loop. Character code checks are much faster.
3. **`replace` Only Replaces the First Match**: In JavaScript, `str.replace("a", "b")` only replaces the **first** `"a"`. Use `str.replaceAll("a", "b")` or `/a/g` for all occurrences.

---

## Tricky Points

- **`substring` vs `slice`**: Prefer `str.slice(start, end)`. `slice` supports negative indices (e.g. `str.slice(-2)` gives the last two characters).
- **String Memory Retention (Sliced Strings)**: In V8, `str.slice(0, 5)` on a 20 MB string can sometimes retain a pointer to the entire 20 MB parent string in memory until flattened.

---

## Practical Exercise

Write a function `firstUniqChar(s)` that returns the index of the first non-repeating character in a lowercase English string. If none exists, return `-1`.
- *Hint*: Make one pass to count frequencies, and a second pass to find the first character with a count of 1.

---

## Summary

- JavaScript strings are **immutable**; modifying a string creates a new allocation.
- Avoid building large strings with `+=` inside loops; use an array with `.join("")`.
- For lowercase English strings, use a **26-bucket array** for $O(1)$ space frequency counts.
- **Two Pointers** allow checking palindromes in $O(n)$ time with $O(1)$ space.

---

## Cheat Sheet

### Fast Character Codes
- `'0'` = 48, `'9'` = 57
- `'A'` = 65, `'Z'` = 90
- `'a'` = 97, `'z'` = 122
- Lowercase bucket formula: `code - 97`

### String Complexities
- Access by index: `s[i]` $\to O(1)$
- Substring: `s.slice(i, j)` $\to O(k)$ where $k$ is slice length
- Join array: `arr.join("")` $\to O(n)$

---

## Interview Questions

### 1. Deep Definitions and Mental Models

**Question:** What does it mean that JavaScript strings are immutable? How does this affect memory when modifying a string?
- **Expected answer shape:** Immutability means string values cannot be modified in place after creation. Any method or concatenation creates a new string in memory and copies characters. Changing one character in a string of length $n$ takes $O(n)$ time and memory.

### 2. Predict the Output and Trace Execution

**Question:** What does this code output, and why?
```js
const s = "cat";
s[0] = "b";
console.log(s);
console.log("hello".replace("l", "r"));
```
- **Expected answer shape:** First line logs `"cat"` because strings are immutable; index assignment fails silently in non-strict mode. Second line logs `"herlo"` because `.replace()` without a global regex replaces only the first occurrence.

### 3. Implementation Exercise

**Question:** Implement `isSubsequence(s, t)` returning `true` if `s` is a subsequence of `t`. Must run in $O(t.\text{length})$ time and $O(1)$ space.
- **Expected answer shape:**
```js
function isSubsequence(s, t) {
  let pS = 0, pT = 0;
  while (pS < s.length && pT < t.length) {
    if (s[pS] === t[pT]) pS++;
    pT++;
  }
  return pS === s.length;
}
```

### 4. Debugging and Failure Analysis

**Question:** A backend function creates a 50,000-character CSV string using `csv += line + "\n"` in a loop and times out. How do you fix it?
- **Expected answer shape:** `csv += ...` is $O(n^2)$ due to repeated string copying. Fix by pushing lines into an array: `const lines = []; lines.push(line);` and finishing with `return lines.join("\n");`, which takes $O(n)$ linear time.

### 5. Design and Tradeoff Questions

**Question:** When checking if two strings are anagrams, compare using a 26-element array vs a `Map` vs sorting both strings.
- **Expected answer shape:** (1) 26-element array: fastest, $O(n)$ time, $O(1)$ space, but only works for known alphabets like lowercase English. (2) `Map`: $O(n)$ time, $O(u)$ space, works for any Unicode characters. (3) Sorting: `s.split('').sort().join('')` is simple to write, but takes $O(n \log n)$ time and allocates arrays.

### 6. Senior Follow-ups: Node.js Runtime

**Question:** You need to process a 5 GB text file on a Node.js server with 1 GB of RAM. Why does `fs.readFileSync` fail, and how do you solve it?
- **Expected answer shape:** `fs.readFileSync` tries to load all 5 GB into memory at once, exceeding the V8 heap limit (~1.4 GB) and crashing the process. Solution: Use `fs.createReadStream()` with the `readline` module to process the file line-by-line as a stream in $O(1)$ bounded memory.

<nav aria-label="Lecture navigation">

[Previous: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Recursion and Call Stack](day-04-recursion-and-call-stack.md)

</nav>
