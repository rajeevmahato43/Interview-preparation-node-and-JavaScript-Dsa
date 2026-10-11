# Day 02: Arrays, Strings & Memory

<nav aria-label="Lecture navigation">

[Previous: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Searching & Elementary Sorting](day-03-searching-and-sorting-algorithms.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Asymptotic complexity ($O(1), O(n), O(n^2)$).
- Basic JavaScript variables, loops, and array indexing.

---

## 1. Arrays in Memory

An array is an ordered list where each item has an index starting at 0.

> **Contiguous Memory**: Memory allocated in one continuous, unbroken block. This lets the engine look up any index `arr[i]` instantly in $O(1)$ time by jumping straight to $\text{BaseAddress} + i \times \text{ElementSize}$.

In the V8 engine (Node.js and Chrome), arrays are optimized into different internal types depending on what values they hold:

> **Packed vs Holey Arrays**: A **packed** array has items at every single index (`[1, 2, 3]`). A **holey** array has empty gaps (like `const a = []; a[100] = 5;`). Reading a missing index in a holey array forces V8 to look through the prototype chain to check if `Object.prototype` defined it, making reads up to 10x slower!

```text
Array Memory: [ 'A', 'B', 'C', 'D' ]
Index:           0    1    2    3
Memory Offset: Base Base+1 Base+2 Base+3 (Instant O(1) jump)
```

### Core Array Operations

| Operation | Method / Syntax | Time Complexity | Why it Takes this Time |
| :--- | :--- | :--- | :--- |
| **Read by Index** | `arr[i]` | **$O(1)$** | Direct memory offset calculation |
| **Write by Index**| `arr[i] = val` | **$O(1)$** | Overwrites pre-allocated memory slot |
| **Append (End)** | `arr.push(val)` | **$O(1)$ amortized** | Writes to next pre-allocated buffer slot |
| **Remove (End)** | `arr.pop()` | **$O(1)$** | Decrements length counter by 1 |
| **Prepend (Start)**| `arr.unshift(val)` | **$O(n)$** | Every element in memory must shift 1 slot to the right |
| **Remove (Start)** | `arr.shift()` | **$O(n)$** | Every remaining element must shift 1 slot to the left |
| **Find Value** | `arr.indexOf(val)` | **$O(n)$** | Linear search scanning items from index 0 |
| **Subarray Slice**| `arr.slice(start, end)` | **$O(k)$** | Copies $k$ elements into a brand new array buffer |

```javascript
// Node.js code
// ❌ ANTI-PATTERN: arr.shift() inside a loop turns an O(n) task into O(n^2)!
function processQueueSlow(tasks) {
  const processed = [];
  while (tasks.length > 0) {
    // shift() forces all remaining n elements to slide over in memory on EVERY step!
    const task = tasks.shift(); 
    processed.push(task * 2);
  }
  return processed;
}

// ✅ PATTERN: Use a head pointer to achieve true O(n) linear time
function processQueueFast(tasks) {
  const processed = [];
  let head = 0; // Simple integer pointer tracker
  while (head < tasks.length) {
    const task = tasks[head++]; // O(1) lookup + increment
    processed.push(task * 2);
  }
  return processed;
}
```

---

## 2. Strings: Immutable Text

In JavaScript, strings are primitive values and **immutable** (they can never be changed in place).

```javascript
// Node.js code
let str = "hello";
str[0] = "H"; // Silently fails! (throws error in strict mode)
console.log(str); // Still "hello"
```

## 1. How V8 Stores Strings Internally


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
// ❌ Slow: Re-allocates and copies every time -> O(n^2)
let result = "";
for (let i = 0; i < 10000; i++) {
  result += i + ",";
}

// ✅ Fast: Collect in array and join once -> O(n)
const parts = [];
for (let i = 0; i < 10000; i++) {
  parts.push(i);
}
const fastResult = parts.join(",");
```

---

## 3. Unicode, Emojis, and String Length

JavaScript strings use **UTF-16 encoding**:
- Standard letters (`"A"`, `"z"`) take **1 code unit** (`length = 1`).
- Emojis (`"🚀"`, `"🔥"`) take **2 code units** (called a *surrogate pair*), so `"🚀".length` is **2**!

```javascript
const emoji = "🚀";
console.log(emoji.length); // 2!

// ❌ Naive reversal breaks emojis!
console.log(emoji.split("").reverse().join("")); // Broken characters!

// ✅ Safe: Use Array.from() or for...of to handle full characters
const safeChars = Array.from(emoji);
console.log(safeChars.length); // 1
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

---

## 4. Problem 1: Valid Palindrome

Check if a string reads the same forward and backward, ignoring spaces and punctuation.

```javascript
// Node.js code: Optimal Inward Two Pointers
function isPalindrome(s) {
  // Simple alphanumeric check
  function isAlpha(c) {
    const code = c.charCodeAt(0);
    return (code >= 48 && code <= 57) || // 0-9
           (code >= 97 && code <= 122) || // a-z
           (code >= 65 && code <= 90);    // A-Z
  }

  let left = 0;
  let right = s.length - 1;

  while (left < right) {
    while (left < right && !isAlpha(s[left])) left++;
    while (left < right && !isAlpha(s[right])) right--;

    if (s[left].toLowerCase() !== s[right].toLowerCase()) {
      return false;
    }
    left++;
    right--;
  }

  return true;
}

console.log(isPalindrome("A man, a plan, a canal: Panama")); // true
console.log(isPalindrome("race a car")); // false
```
- **Time Complexity:** $O(n)$ — Single pass inward.
- **Extra Space:** $O(1)$ — No new strings created.

---

## 5. Problem 2: Reverse Array In-Place

Reverse an array without allocating a new array.

```javascript
// Node.js code: In-Place Swap
function reverseArray(arr) {
  let left = 0;
  let right = arr.length - 1;

  while (left < right) {
    const temp = arr[left];
    arr[left] = arr[right];
    arr[right] = temp;
    left++;
    right--;
  }

  return arr;
}

console.log(reverseArray([1, 2, 3, 4, 5])); // [5, 4, 3, 2, 1]
```
- **Time Complexity:** $O(n)$ — Exactly $n/2$ swaps.
- **Extra Space:** $O(1)$ — Done directly inside the original array.

---

## 6. Under the Hood: V8 Engine Array Types

In the V8 engine (Node.js/Chrome), arrays are optimized under the hood:
1. **Packed Arrays (Fast):** An array with items at every index (`[1, 2, 3]`).
2. **Holey Arrays (Slow):** An array with empty gaps (`const a = []; a[100] = 5;`). When reading a missing index in a holey array, V8 must look through the prototype chain to check if `Object.prototype` defined it, making reads up to 10× slower!
3. **Small Integers (SMI):** Arrays holding only integers are stored as unboxed numbers in continuous memory. Adding a string or object forces V8 to convert the array to pointer storage.

---

## 7. Tricky Points and Common Traps

1. **Attempting to modify string characters:** `str[0] = 'x'` does nothing.
2. **`arr.shift()` in queues:** Causes an accidental $O(n^2)$ loop. Use a pointer or a proper Queue object.
3. **Emoji length:** An emoji counts as 2 in `.length`. Use `Array.from(str)` when counting real characters.
4. **`Array(10).map(...)` trap:** `new Array(10)` creates empty holes, not `undefined`. `.map()` skips holes! Use `new Array(10).fill(0)` instead.

---

## 8. Hands-On Exercises

Run this script in Node.js to verify palindrome and in-place reversal:

```javascript
// Node.js code
const assert = require("node:assert");

function testReverse(arr) {
  let l = 0, r = arr.length - 1;
  while (l < r) {
    [arr[l], arr[r]] = [arr[r], arr[l]];
    l++;
    r--;
  }
  return arr;
}

assert.deepEqual(testReverse([1, 2, 3]), [3, 2, 1]);
assert.deepEqual(testReverse(["a", "b"]), ["b", "a"]);

console.log("✅ Array reversal assertions passed!");
```

---

## 9. Summary

- **Arrays** offer instant $O(1)$ reads and writes by index, but $O(n)$ insertion/removal at the front (`shift`/`unshift`).
- **Strings** cannot be changed in place; every modification creates a new string.
- **Join over concat:** Use array `.push()` and `.join('')` to build strings in $O(n)$ time instead of $O(n^2)$ `+=` loops.
- **Unicode safety:** Emojis take 2 code units; use `Array.from()` to avoid splitting them.

---

## 10. Cheat Sheet

| Operation | Array Time | String Time |
| :--- | :---: | :---: |
| Access by Index (`[i]`) | **$O(1)$** | **$O(1)$** |
| Update by Index (`[i] = x`) | **$O(1)$** | ❌ Impossible (Immutable) |
| Add to End (`push` / `+`) | **$O(1)$ amortized** | $O(n)$ (Allocates new string) |
| Remove from End (`pop`) | **$O(1)$** | $O(n)$ (`slice`) |
| In-place Reversal | **$O(n)$ time, $O(1)$ space** | ❌ Requires new string |

---

## 12. Q&A

### 45-Second Explanation
> *"In JavaScript, arrays provide $O(1)$ random access because they are stored in contiguous memory. Strings are immutable primitives, meaning any string change creates a new string in memory. To reverse an array in $O(1)$ space, we use two pointers starting at both ends and swap inward. When checking palindromes, we use the same two-pointer scan, skipping non-alphanumeric characters without allocating new strings."*

### Questions & Answers
1. **Why does `str[0] = 'a'` not throw an error in regular JavaScript?**
   Because non-strict mode silently ignores mutations to primitives. In `'use strict'`, it throws a `TypeError`.
2. **Why is `new Array(5).map(() => 0)` returning empty slots?**
   `new Array(5)` creates an array with empty slots (holes). JavaScript array iteration methods skip non-existent properties. Use `Array.from({ length: 5 }, () => 0)` or `.fill(0)`.

---

## 12. Practice Problems

### 1. Valid Palindrome - Easy
A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.
- **Input:** `s = "A man, a plan, a canal: Panama"`
- **Expected Output:** `true`
- **Input:** `s = "race a car"`
- **Expected Output:** `false`
- **Input:** `s = " "`
- **Expected Output:** `true`

### 2. Reverse String - Easy
Write a function that reverses a string. The input string is given as an array of characters `s`. You must do this by modifying the input array in-place with $O(1)$ extra memory.
- **Input:** `s = ["h","e","l","l","o"]`
- **Expected Output:** `["o","l","l","e","h"]`
- **Input:** `s = ["H","a","n","n","a","h"]`
- **Expected Output:** `["h","a","n","n","a","H"]`

### 3. Longest Common Prefix - Easy
Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string `""`.
- **Input:** `strs = ["flower","flow","flight"]`
- **Expected Output:** `"fl"`
- **Input:** `strs = ["dog","racecar","car"]`
- **Expected Output:** `""`

---

<nav aria-label="Lecture navigation">

[Previous: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Searching & Elementary Sorting](day-03-searching-and-sorting-algorithms.md)

</nav>
