# Day 02: Arrays, Strings & Primitive Memory

<nav aria-label="Lecture navigation">

[Previous: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Searching & Elementary Sorting](day-03-searching-and-sorting-algorithms.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Asymptotic complexity ($O(1), O(n), O(n^2)$), Big O upper bounds, and the $10^7$ operations rule.
- Basic JavaScript syntax: variables (`let`, `const`), loops (`for`, `while`), functions, and zero-based array indexing.

---

## 1. What is an Array and a String?

An **Array** is an ordered list of elements stored at sequential, numbered positions called indices. A **String** is an ordered, immutable sequence of characters used to represent text.

> **Contiguous Memory**: Memory allocated in one continuous, unbroken block of physical RAM addresses. This layout allows the computer to jump straight to any index in $O(1)$ constant time.

In the V8 engine (Node.js and Chrome), arrays are optimized into different internal types depending on what values they hold:

> **Packed vs Holey Arrays**: A **packed** array has items at every single index (`[1, 2, 3]`). A **holey** array has empty gaps (like `const a = []; a[100] = 5;`). Reading a missing index in a holey array forces V8 to look through the prototype chain to check if `Object.prototype` defined it, making reads up to 10x slower!

> **String Immutability**: A language guarantee that once a string is allocated in memory, its individual characters can never be modified in-place. Any change creates a brand-new string.

> **Zero-Based Indexing**: Numbering positions starting at $0$ rather than $1$, where the index represents the exact distance (offset) from the memory beginning.

### Everyday Physical Analogies

#### The Array: Numbered Hotel Lockers
Imagine a long hallway with 100 numbered lockers bolted side-by-side into a concrete wall:
- **Instant Access ($O(1)$)**: If someone tells you "get the bag in Locker #42", you do not count from locker 0. You walk directly to door 42 because every locker has the exact same width and sits at a predictable physical distance from the entrance.
- **Expensive Insertion at the Front ($O(n)$)**: If a guest demands Locker #0, every single guest from locker 0 through locker 99 must pick up their luggage and slide one door to the right to clear room.

#### The String: Words Carved in Stone
Imagine words carved into a granite monument:
- **Read-Only Inspection ($O(1)$)**: You can look at the 5th letter instantly.
- **No In-Place Overwrites**: If you want to change `"cat"` to `"car"`, you cannot erase the `'t'`. You must take a fresh block of granite and carve the entire new word `"car"` from scratch.

### Memory Representation Diagram

```text
ARRAY IN MEMORY (Contiguous Slots of Fixed Size):
Base Address: 0x1000, Element Size: 4 bytes
Index:            [0]        [1]        [2]        [3]
Value:          [ 10   ]   [ 20   ]   [ 30   ]   [ 40   ]
RAM Address:    0x1000     0x1004     0x1008     0x100C
Formula:        Base + (Index * 4 bytes) -> Instant O(1) Memory Jump!

STRING IMMUTABILITY IN HEAP:
let str = "cat";       // Points to Heap Address 0x5000: ['c', 'a', 't']
str[2] = 'r';          // Silently fails! (Memory at 0x5000 is read-only)
str = str + "s";       // Allocates NEW Heap Address 0x6000: ['c', 'a', 't', 's']
                       // Old string at 0x5000 waits for Garbage Collection.
```

---

## 2. How Arrays and Strings Work Step-by-Step

### Array Memory Address Calculation

How does the computer look up `arr[i]` in $O(1)$ time?
Because memory slots are contiguous and uniform in width, the processor calculates the memory location using basic arithmetic:

$$\text{Address}(arr[i]) = \text{BaseAddress} + (i \times \text{ElementSize})$$

If the array begins at memory address `1000` and each item occupies `8` bytes:
- `arr[0] = 1000 + (0 \times 8) = 1000`
- `arr[1] = 1000 + (1 \times 8) = 1008`
- `arr[5] = 1000 + (5 \times 8) = 1040`

The processor executes this arithmetic in a single clock cycle. It does not scan through elements $0, 1, 2, 3, 4$ to reach index $5$.

### Core Array Operations and Complexity

| Operation | Syntax | Time Complexity | Memory Work Performed |
| :--- | :--- | :---: | :--- |
| **Lookup by Index** | `arr[i]` | **$O(1)$** | Direct address calculation and memory read |
| **Update by Index** | `arr[i] = val` | **$O(1)$** | Direct address calculation and memory write |
| **Append to End** | `arr.push(val)` | **$O(1)$ amortized** | Writes to next pre-allocated buffer slot |
| **Remove from End** | `arr.pop()` | **$O(1)$** | Decrements internal length counter |
| **Prepend to Start** | `arr.unshift(val)` | **$O(n)$** | Slides every existing element 1 slot right |
| **Remove from Start**| `arr.shift()` | **$O(n)$** | Slides every remaining element 1 slot left |
| **Search by Value** | `arr.indexOf(val)` | **$O(n)$** | Linear scan checking indices from $0$ to $n-1$ |
| **Copy Slice** | `arr.slice(start, end)` | **$O(k)$** | Allocates new array and copies $k$ elements |
| **Splice Middle** | `arr.splice(i, count)` | **$O(n)$** | Shifts elements left or right to fill or make room |

### The `shift()` Performance Trap

Using `arr.shift()` inside a loop is one of the most common causes of backend API slowdowns:

```javascript
// Node.js code
"use strict";

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

// ✅ CORRECT: Use an integer head pointer for true O(n) linear execution
function processQueueFast(tasks) {
  const processed = [];
  let head = 0; // Simple integer pointer tracker
  while (head < tasks.length) {
    const task = tasks[head++]; // O(1) read + pointer advance
    processed.push(task * 2);
  }
  return processed;
}
```

### The String Building Trap: $O(n^2)$ vs Array Buffer $O(n)$

Because JavaScript strings are immutable, adding characters using `+=` inside a loop forces the engine to allocate a brand-new string and copy every single previous character on every iteration:

```text
Iteration 1: copy 1 char
Iteration 2: copy 2 chars
Iteration 3: copy 3 chars
...
Iteration n: copy n chars
Total copies = 1 + 2 + 3 + ... + n = n(n + 1) / 2 = O(n^2) operations!
```

```javascript
// Node.js code
"use strict";

// ❌ ANTI-PATTERN: String concatenation in loop allocates O(n^2) temporary bytes
function buildLogStringSlow(items) {
  let result = "";
  for (let i = 0; i < items.length; i++) {
    result += items[i] + ","; // Copies previous result on every step!
  }
  return result;
}

// ✅ CORRECT: Accumulate in an array buffer and join once in O(n) time
function buildLogStringFast(items) {
  const buffer = [];
  for (let i = 0; i < items.length; i++) {
    buffer.push(items[i]); // Amortized O(1) append
  }
  return buffer.join(","); // Single O(n) allocation pass
}
```

### V8 Engine String Taxonomy

To optimize string manipulation, the V8 engine stores strings internally using different structures:

1. **Flat String (`SeqString`)**: Characters stored side-by-side in contiguous memory. Random access via index is $O(1)$.
2. **Cons-String**: A binary tree structure created when joining two strings with `+`. Instead of copying characters immediately, V8 creates a node linking both strings.
   > **Cons-String**: A V8 internal tree where two strings are linked using pointers rather than copied right away. This delays the expensive copy until the string is finally read or printed.
3. **Sliced String**: Created when calling `.slice()` on a large string. It stores a pointer to the original parent string along with an offset and length.
   > **Sliced String**: A V8 internal pointer that references a section of a parent string with an offset and length, avoiding memory allocation until needed.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           V8 STRING MEMORY TAXONOMY                         │
└─────────────────────────────────────────────────────────────────────────────┘

  1. FLAT STRING (Contiguous Character Storage)
     "hello"  --> [ 'h' | 'e' | 'l' | 'l' | 'o' ]
     • Instant O(1) indexing: str[2] -> 'l'
     • Read-only memory buffer

  2. CONS-STRING (Binary Tree Concatenation)
     strA + strB --> ConsString { left: ptr(strA), right: ptr(strB) }
     • O(1) concatenation without copying immediately
     • Flattened into a single string when characters are accessed

  3. SLICED STRING (Window into Existing Parent String)
     parentStr.slice(0, 5) --> SlicedString { parent: ptr(parentStr), offset: 0, len: 5 }
     • O(1) slice creation
     • Traps: Retains parent in RAM, preventing garbage collection!
```

### Unicode, Emojis, and UTF-16 Code Units

JavaScript strings use **UTF-16 encoding**:
- Basic Latin characters (`"A"`, `"z"`, `"9"`) occupy **1 code unit** (16 bits, length = 1).
- Emojis and specialized characters (`"🚀"`, `"🔥"`, `"𝒽"`) require **2 code units** (called a **surrogate pair**).

```javascript
// Node.js code
"use strict";

const emoji = "🚀";
console.log(emoji.length); // 2 (Counts UTF-16 code units, NOT human characters!)

// ❌ ANTI-PATTERN: Naive reversal breaks surrogate pairs!
const broken = emoji.split("").reverse().join("");
console.log(broken); // "" (Corrupted characters!)

// ✅ CORRECT: Array.from() or for...of respects Unicode code points
const safeCharacters = Array.from(emoji);
console.log(safeCharacters.length); // 1
console.log(safeCharacters.reverse().join("")); // "🚀" (Intact!)
```

| Method | What It Reads | Safe with Emojis? | Time Complexity |
| :--- | :--- | :---: | :---: |
| `str.charAt(i)` / `str[i]` | 16-bit Code Unit at index $i$ | ❌ No | $O(1)$ |
| `str.charCodeAt(i)` | Integer ($0$ to $65535$) of code unit | ❌ No | $O(1)$ |
| `str.length` | Number of UTF-16 code units | ❌ No | $O(1)$ |
| `str.codePointAt(i)` | Full Unicode code point ($0$ to $1114111$) | ✅ Yes | $O(1)$ |
| `for (const ch of str)` | Full character code points | ✅ Yes | $O(n)$ |
| `Array.from(str)` | Array of full character strings | ✅ Yes | $O(n)$ |

---

## 3. Pattern Recognition of Arrays & Strings

### Problem Triggers and Keywords

| Problem Keyword | What the Interviewer Means | Recommended Approach |
| :--- | :--- | :--- |
| **"In-place"** | Do not allocate a new array ($O(1)$ extra memory). | Two Pointers (swapping inward or read/write indices). |
| **"Contiguous subarray"** | Elements must be adjacent with no gaps. | Sliding Window or Prefix Sum. |
| **"Palindrome"** | Reads identical forwards and backwards. | Inward Two Pointers (`left` at start, `right` at end). |
| **"Subsequence"** | Order preserved, but items do not need to be adjacent. | Greedy Two Pointers or Dynamic Programming. |
| **"Anagram"** | Same character counts rearranged. | Frequency Counter (Hash Map or fixed 26-slot array). |
| **"Prefix / Suffix"** | Cumulative values from start or end. | Prefix running total or rolling window. |

### The $10^7$ Constraint Rule for Arrays

Always inspect the input constraint $n$ before writing code:
- **$n \le 10^3$**: An $O(n^2)$ nested loop will execute in $\approx 10^6$ operations and pass within 1 second.
- **$n \le 10^5$**: An $O(n^2)$ algorithm executes $10^{10}$ operations and **will freeze Node.js**. You must use an $O(n)$ single-pass two-pointer or $O(n \log n)$ divide-and-conquer strategy.
- **$n \le 10^7$**: Only an $O(n)$ or $O(\log n)$ algorithm will succeed.

### When to Use Arrays vs Alternative Data Structures

- **Use Arrays when**: You need ordered sequences, frequent access by numeric index, or contiguous memory cache friendliness.
- **Do NOT use Arrays when**: You need instant $O(1)$ lookup by non-numeric key (use `Map`), unique values without duplicates (use `Set`), or frequent FIFO queue removals from the front (use a pointer-based Queue).

---

## 4. Problem 1: Valid Palindrome

### Problem Statement
A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the exact same forward and backward.
Given a string `s`, return `true` if it is a palindrome, or `false` otherwise.

```text
Input: s = "A man, a plan, a canal: Panama"
Output: true (Cleaned: "amanaplanacanalpanama" reads identical forwards and backwards)

Input: s = "race a car"
Output: false (Cleaned: "raceacar" vs "racaecar")
```

### Step 1: Physical Simulation
Take the sentence written on a paper strip: `"A m a n ,   P a n a m a"`
1. Place your left index finger on the first letter `'A'`.
2. Place your right index finger on the last letter `'a'`.
3. If a finger lands on a space, comma, or colon, slide that finger inward to the next valid letter.
4. Compare the letters under your two fingers (ignoring case): `'a'` matches `'a'`.
5. Slide both fingers inward by one step and repeat.
6. If the fingers cross without finding a mismatch, the word is a palindrome.

### Step 2: Brute Force Approach
The naive translation cleans the string using regular expressions, reverses the result, and compares equality:

```javascript
// Naive Brute Force
function isPalindromeBrute(s) {
  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, ""); // Allocates new string
  const reversed = cleaned.split("").reverse().join("");      // Allocates array + new string
  return cleaned === reversed;
}
```
- **Time Complexity**: $O(n)$ — Three passes (regex replace, split/reverse/join, comparison).
- **Space Complexity**: $O(n)$ — Allocates auxiliary heap memory for `cleaned`, the split array, and `reversed`.

### Step 3: Bottleneck
Where is the CPU sweating?
The brute force approach allocates multiple intermediate strings and arrays in the V8 heap. If `s` is a 10MB document, `s.toLowerCase().replace(...)` copies 10MB of characters, `split("")` allocates an array of 10,000,000 string pointers, and `join("")` allocates another 10MB string.
This generates severe memory churn and forces the V8 garbage collector to pause execution. Why allocate new memory when we can compare characters in-place using two index pointers?

### Step 4: The Pattern Discovery
Instead of allocating auxiliary memory, we place two integer pointers:
- `left = 0` (starting at the front)
- `right = s.length - 1` (starting at the end)

We advance `left` forward past non-alphanumeric characters, decrement `right` backward past non-alphanumeric characters, and compare characters at `s[left]` and `s[right]`. This requires zero heap allocations ($O(1)$ extra memory).

### Step 5: The Optimal Solution

```javascript
// Node.js code
"use strict";

// Helper function to check alphanumeric characters via ASCII codes
function isAlphaNumeric(charCode) {
  return (
    (charCode >= 48 && charCode <= 57) || // 0-9
    (charCode >= 65 && charCode <= 90) || // A-Z
    (charCode >= 97 && charCode <= 122)   // a-z
  );
}

// ✅ CORRECT: Inward Two Pointers with O(1) Auxiliary Memory
function isPalindrome(s) {
  let left = 0;
  let right = s.length - 1;

  // Invariant: All characters outside [left ... right] have matched symmetrically.
  while (left < right) {
    // Skip non-alphanumeric characters from left
    while (left < right && !isAlphaNumeric(s.charCodeAt(left))) {
      left++;
    }
    // Skip non-alphanumeric characters from right
    while (left < right && !isAlphaNumeric(s.charCodeAt(right))) {
      right--;
    }

    // Compare characters in lower case
    if (s[left].toLowerCase() !== s[right].toLowerCase()) {
      return false; // Mismatch found
    }

    left++;
    right--;
  }

  return true; // All symmetric pairs matched
}

// ❌ ANTI-PATTERN: Inner while loops without bounds checking (causes out-of-bounds loops)
function buggyPalindrome(s) {
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    // BUG: Missing 'left < right' check inside inner loops!
    // On a string of all spaces "   ", left increments past string length!
    while (!isAlphaNumeric(s.charCodeAt(left))) left++;
    while (!isAlphaNumeric(s.charCodeAt(right))) right--;
    if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
    left++; right--;
  }
  return true;
}

// ==========================================
// Example Test Runs
// ==========================================
console.log(isPalindrome("A man, a plan, a canal: Panama")); // true
console.log(isPalindrome("race a car")); // false
console.log(isPalindrome(" ")); // true
console.log(isPalindrome("0P")); // false
```

- **Time Complexity**: $O(n)$ — Each character is visited at most twice (once by the skip loop, once by comparison).
- **Space Complexity**: $O(1)$ — Only two integer pointer variables allocated.

---

## 5. Problem 2: Reverse Array In-Place

### Problem Statement
Write a function that reverses an array of elements **in-place**.
You must modify the input array directly with **$O(1)$ extra memory**.

```text
Input: arr = [1, 2, 3, 4, 5]
Output: [5, 4, 3, 2, 1]
```

### Step 1: Physical Simulation
Imagine 5 playing cards laid out in a row on a table: `[ 1 | 2 | 3 | 4 | 5 ]`
1. Place your left hand on Card 0 (`1`) and your right hand on Card 4 (`5`).
2. Swap the two cards. The row becomes: `[ 5 | 2 | 3 | 4 | 1 ]`.
3. Move your left hand one card right (to `2`) and your right hand one card left (to `4`).
4. Swap the two cards. The row becomes: `[ 5 | 4 | 3 | 2 | 1 ]`.
5. Move both hands inward again. Both hands now point to Card 2 (`3`).
6. Because your hands met in the middle, stop. The cards are completely reversed.

### Step 2: Brute Force Approach
The naive instinct is to allocate a new array and populate it backward:

```javascript
// Naive Brute Force
function reverseArrayBrute(arr) {
  const reversed = [];
  for (let i = arr.length - 1; i >= 0; i--) {
    reversed.push(arr[i]);
  }
  return reversed;
}
```
- **Time Complexity**: $O(n)$ — Single pass over $n$ elements.
- **Space Complexity**: $O(n)$ — Allocates a duplicate array of size $n$, violating the in-place constraint!

### Step 3: Bottleneck
Where is the CPU sweating?
Allocating a secondary array wastes $O(n)$ memory and forces V8 to allocate fresh contiguous memory heap blocks. The original array already holds $n$ pre-allocated memory slots. We can repurpose those existing slots by swapping elements directly.

### Step 4: The Pattern Discovery
By maintaining two pointers (`left = 0`, `right = arr.length - 1`), we swap the elements at `arr[left]` and `arr[right]` using a temporary variable or destructuring assignment, then increment `left` and decrement `right` until `left >= right`.

### Step 5: The Optimal Solution

```javascript
// Node.js code
"use strict";

// ✅ CORRECT: Inward Two-Pointer In-Place Swap
function reverseArrayInPlace(arr) {
  let left = 0;
  let right = arr.length - 1;

  // Invariant: Elements at indices < left and indices > right are in their final reversed positions.
  while (left < right) {
    // Swap elements in-place using temporary variable
    const temp = arr[left];
    arr[left] = arr[right];
    arr[right] = temp;

    left++;
    right--;
  }

  return arr;
}

// ❌ ANTI-PATTERN: Iterating up to arr.length swaps elements twice, restoring the original array!
function buggyReverseTwice(arr) {
  for (let i = 0; i < arr.length; i++) {
    // Swapping for the entire length reverses the array in the first half,
    // and then un-reverses it back to its original state in the second half!
    const target = arr.length - 1 - i;
    const temp = arr[i];
    arr[i] = arr[target];
    arr[target] = temp;
  }
  return arr;
}

// ==========================================
// Example Test Runs
// ==========================================
const testArr1 = [1, 2, 3, 4, 5];
reverseArrayInPlace(testArr1);
console.log(testArr1); // [ 5, 4, 3, 2, 1 ]

const testArr2 = ["a", "b", "c", "d"];
reverseArrayInPlace(testArr2);
console.log(testArr2); // [ "d", "c", "b", "a" ]

const buggyArr = [1, 2, 3, 4, 5];
buggyReverseTwice(buggyArr);
console.log(buggyArr); // [ 1, 2, 3, 4, 5 ] (buggy: restored to original!)
```

- **Time Complexity**: $O(n)$ — Executes exactly $\lfloor n/2 \rfloor$ swaps.
- **Space Complexity**: $O(1)$ — Transforms elements directly inside the caller's array.

---

## 6. Under the Hood: V8 & Node.js

### V8 Elements Kinds Transitions

In C++, an array must hold elements of a single fixed type. In JavaScript, arrays can hold any mix of numbers, strings, and objects.
To maintain high performance, the V8 engine inspects the elements in your array and assigns an internal **ElementsKind**:

1. **`PACKED_SMI_ELEMENTS` (Fastest)**: An array containing only Small Integers (31-bit signed integers). V8 stores these as unboxed numbers in raw memory without pointer dereferencing.
2. **`PACKED_DOUBLE_ELEMENTS`**: An array containing floating-point numbers. V8 stores them as raw 64-bit IEEE floats.
3. **`PACKED_ELEMENTS`**: An array containing mixed types (strings, objects, functions). V8 must store pointers to heap objects.
4. **`HOLEY_*_ELEMENTS` (Slowest)**: An array with missing slots (gaps).

```text
V8 ELEMENTS KIND LATTICE (One-Way Transitions Only):

       PACKED_SMI_ELEMENTS        (Fastest, unboxed integers)
              │
              ▼ (Add a float like 3.14)
      PACKED_DOUBLE_ELEMENTS      (Unboxed IEEE floats)
              │
              ▼ (Add a string or object)
        PACKED_ELEMENTS           (Pointers to heap memory)
              │
              ▼ (Delete an index or create a gap: arr[100] = 5)
        HOLEY_ELEMENTS            (10x Slower: Checks prototype chain on reads!)
```

> [!WARNING]
> ElementsKind transitions are **one-way**. Once an array transitions from `PACKED_SMI` to `HOLEY_ELEMENTS`, V8 will **never** optimize it back to packed, even if you fill the holes later!

### Why Holey Arrays Degrade Performance

When reading `arr[5]` on a packed array, V8 executes a single memory offset read.
When reading `arr[5]` on a holey array, if index 5 is empty, JavaScript semantics require the engine to check if `arr.__proto__` or `Object.prototype` defined a property named `"5"`. This prototype chain walk makes missing-index reads up to **10x slower**.

```javascript
// ❌ Creates a HOLEY array:
const holey = [];
holey[1000] = 42; // Indices 0 to 999 are holes!

// ✅ Creates a PACKED array:
const packed = new Array(1000).fill(0);
packed[1000] = 42;
```

### Sliced String Memory Retention in Node.js Services

When processing large network payloads (such as a 50MB CSV or JSON upload), calling `largeString.slice(0, 10)` creates a **SlicedString** in V8:
- The sliced string holds a pointer reference to the parent 50MB string.
- Even if you drop all references to `largeString`, the garbage collector **cannot free the 50MB memory buffer** as long as that tiny 10-character sliced string is cached or stored in memory!
- **Remediation**: Force string flattening by concatenating with an empty string or using `Buffer.from()`:
  ```javascript
  const unlinked = (" " + largeString.slice(0, 10)).slice(1);
  ```

### Node.js `Buffer` vs JavaScript `String`

- **`String`**: UTF-16 encoded, managed inside the V8 JavaScript heap, subject to V8 heap size limits ($\approx 1.4\text{ GB} - 4\text{ GB}$).
- **`Buffer`**: Contiguous raw byte array allocated in **C++ external memory** outside the V8 heap.
- In Node.js backend streams (HTTP file uploads, TCP sockets, database drivers), always process data using `Buffer` streams to avoid garbage collection pauses on the main thread.

---

## 7. Hands-On Exercise

### The Scenario
You are building an audit log sanitizer for a Node.js microservice. The service receives raw user access logs containing timestamped tokens.
A junior engineer wrote the token validation pipeline, but the service is timing out under high load.

The pipeline must:
1. Process tokens from an incoming queue.
2. Check if the token's alphanumeric characters form a valid palindrome.
3. Construct a comma-separated sanitized audit string.

### The Buggy Code
```javascript
// Node.js code
function processAuditLogsBuggy(tokens) {
  let output = "";

  // Bug 1: Using tokens.shift() in a while loop causes O(n^2) array memory shifting!
  while (tokens.length > 0) {
    const token = tokens.shift();

    // Bug 2: Naive regex and reverse allocation causes O(k) memory allocations per token
    const cleaned = token.toLowerCase().replace(/[^a-z0-9]/g, "");
    const reversed = cleaned.split("").reverse().join("");

    if (cleaned === reversed && cleaned.length > 0) {
      // Bug 3: String concatenation += in a loop causes O(m^2) string buffer re-allocations
      output += cleaned + ",";
    }
  }

  return output.slice(0, -1);
}
```

### Acceptance Criteria
1. Must process all tokens in **$O(n)$ linear time** without calling `shift()`.
2. Must validate palindromes using an in-place two-pointer algorithm with **$O(1)$ auxiliary space** per token.
3. Must construct the final string using an array buffer joined once in $O(m)$ time.
4. Verified with test execution.

### Verified Solution

```javascript
// Node.js code
"use strict";

function isTokenPalindrome(str) {
  function isAlpha(code) {
    return (
      (code >= 48 && code <= 57) || // 0-9
      (code >= 65 && code <= 90) || // A-Z
      (code >= 97 && code <= 122)   // a-z
    );
  }

  let l = 0;
  let r = str.length - 1;
  let hasValidChar = false;

  while (l < r) {
    while (l < r && !isAlpha(str.charCodeAt(l))) l++;
    while (l < r && !isAlpha(str.charCodeAt(r))) r--;

    if (str[l].toLowerCase() !== str[r].toLowerCase()) {
      return false;
    }

    if (isAlpha(str.charCodeAt(l))) hasValidChar = true;
    l++;
    r--;
  }

  if (l === r && isAlpha(str.charCodeAt(l))) hasValidChar = true;
  return hasValidChar;
}

function processAuditLogsFast(tokens) {
  const validTokens = [];
  let head = 0; // Pointer replaces shift()

  while (head < tokens.length) {
    const token = tokens[head++];
    if (isTokenPalindrome(token)) {
      // Extract alphanumeric characters in single O(k) pass
      let cleaned = "";
      for (let i = 0; i < token.length; i++) {
        const code = token.charCodeAt(i);
        if (
          (code >= 48 && code <= 57) ||
          (code >= 97 && code <= 122)
        ) {
          cleaned += token[i];
        } else if (code >= 65 && code <= 90) {
          cleaned += String.fromCharCode(code + 32);
        }
      }
      validTokens.push(cleaned);
    }
  }

  return validTokens.join(","); // Single O(m) join
}

// Example Test Run
const sampleTokens = [
  "RaceCar!",
  "not_a_palindrome",
  "A man, a plan, a canal: Panama",
  "12321",
  "xyz"
];

const result = processAuditLogsFast(sampleTokens);
console.log(result); // "racecar,amanaplanacanalpanama,12321"
```

---

## 8. Tricky Points and Edge Cases

### 1. Modifying String Indices Silently Fails
In non-strict mode, assigning to a string index fails silently. In strict mode (`'use strict'`), it throws a `TypeError`:

```javascript
"use strict";
const str = "hello";
// str[0] = "H"; // TypeError: Cannot assign to read only property '0' of string 'hello'
```

### 2. The `new Array(n)` Empty Slot Trap
Creating an array with `new Array(5)` creates an array with 5 empty holes, **not** `undefined`:

```javascript
const emptyHoles = new Array(3);
console.log(emptyHoles); // [ <3 empty items> ]

// Array iteration methods (.map, .forEach, .filter) SKIP empty holes!
const mapped = emptyHoles.map(() => 1);
console.log(mapped); // Still [ <3 empty items> ]! (Callback never executed!)

// ✅ FIX: Use .fill() or Array.from()
const filled = new Array(3).fill(0);
console.log(filled.map(() => 1)); // [ 1, 1, 1 ]
```

### 3. Mutating vs Non-Mutating Array Methods

| Mutating Methods (Change original array!) | Non-Mutating Methods (Return new copy) |
| :--- | :--- |
| `push()`, `pop()` | `concat()` |
| `shift()`, `unshift()` | `slice()` |
| `splice()` | `filter()`, `map()` |
| `reverse()` | `toReversed()` (Node.js 20+) |
| `sort()` | `toSorted()` (Node.js 20+) |

---

## 9. Comprehensive Summary

- **Arrays** provide $O(1)$ constant-time indexing because items are laid out contiguously in memory at $\text{BaseAddress} + (i \times \text{size})$.
- **Array Prepending (`unshift` / `shift`)** runs in $O(n)$ time because every subsequent item must slide in memory. Use head pointers to process queues in $O(n)$ total time.
- **Strings are Immutable**: Any character modification or string concatenation (`+=`) in a loop allocates a new string in heap memory, creating an $O(n^2)$ copying bottleneck. Use array buffers with `.join('')` for $O(n)$ string construction.
- **UTF-16 & Unicode**: Standard characters take 1 code unit (16-bit). Emojis take 2 code units (surrogate pairs). Use `Array.from()` or `for...of` to avoid splitting surrogate pairs.
- **V8 Elements Kinds**: Arrays transition monotonically from `PACKED_SMI` $\to$ `PACKED_DOUBLE` $\to$ `PACKED_ELEMENTS` $\to$ `HOLEY_ELEMENTS`. Holey arrays are up to 10x slower due to prototype chain traversals.
- **In-Place Two-Pointer Pattern**: Reversing arrays and validating palindromes inward requires only $O(1)$ auxiliary space and $O(n)$ time by comparing and swapping inward from both ends.

---

## 10. Cheat Sheet

### Array & String Complexity Matrix

| Operation | Array Time | Array Space | String Time | String Space |
| :--- | :---: | :---: | :---: | :---: |
| **Random Access (`[i]`)** | **$O(1)$** | $O(1)$ | **$O(1)$** | $O(1)$ |
| **Write by Index (`[i] = x`)** | **$O(1)$** | $O(1)$ | ❌ Immutable | N/A |
| **Append End (`push` / `+`)** | **$O(1)$ amortized**| $O(1)$ | $O(n)$ | $O(n)$ copy |
| **Remove End (`pop`)** | **$O(1)$** | $O(1)$ | $O(n)$ (`slice`) | $O(n)$ |
| **Prepend Start (`unshift`)** | $O(n)$ | $O(1)$ | $O(n)$ | $O(n)$ |
| **Remove Start (`shift`)** | $O(n)$ | $O(1)$ | $O(n)$ (`slice`) | $O(n)$ |
| **In-Place Reversal** | **$O(n)$** | **$O(1)$** | ❌ Requires copy | $O(n)$ |

### Common Pitfalls List
- **The Shift Trap**: Calling `arr.shift()` inside a `while` loop degrades algorithms from $O(n)$ to $O(n^2)$.
- **String `+=` Accumulator**: Appending characters to a string inside a loop causes quadratic heap memory churn.
- **Emoji `.length` Bug**: Counting characters via `.length` counts UTF-16 code units, counting emojis as 2.
- **Holey Array Deoptimization**: Assigning beyond current array length creates holes that permanently deoptimize the array in V8.

### Reusable Templates

```javascript
// Template 1: Inward Two-Pointer Scan
let left = 0;
let right = items.length - 1;
while (left < right) {
  // Check condition, swap, or increment/decrement
  left++;
  right--;
}

// Template 2: Array Buffer String Builder
const buffer = [];
for (const item of items) {
  buffer.push(item);
}
const result = buffer.join("");
```

---

## 11. Interview Q&A

### 45-Second Technical Pitch
> *"Arrays provide instant $O(1)$ random access because their elements are stored in contiguous memory addresses calculated via BaseAddress + index * elementSize. In contrast, JavaScript strings are immutable primitives allocated in heap memory, meaning in-place mutations are impossible and repeated += concatenations inside loops degrade to $O(n^2)$ time. In production Node.js systems, we prevent event loop stalling by avoiding shift() queues and string += loops, relying instead on integer pointer tracking and array buffer joins. For in-place array transformations and palindrome validations, we apply inward two-pointer patterns to achieve $O(n)$ time with $O(1)$ auxiliary space."*

---

### 1. Why do arrays provide $O(1)$ random access while linked lists require $O(n)$?
**Answer:**
Arrays are stored in **contiguous memory blocks**. Because every slot has an identical size, the processor calculates the memory address of any index $i$ in a single CPU cycle using the formula $\text{BaseAddress} + (i \times \text{ElementSize})$. The CPU can jump directly to that physical RAM address without inspecting any intermediate elements.

In contrast, a Linked List stores nodes at random, scattered addresses across the heap. Each node only stores a pointer to the next node. To find the $i$-th element, the computer has no direct arithmetic shortcut; it must follow pointers sequentially from the `head` node through nodes $0, 1, 2, \dots, i-1$, requiring $O(n)$ steps.

---

### 2. What will the following code output in Node.js, and what is its time complexity?
```javascript
// Node.js code
const arr = [1, 2, 3, 4, 5];
const output = [];
for (let i = 0; i < arr.length; i++) {
  output.unshift(arr[i]);
}
console.log(output);
```
**Answer:**
It outputs `[ 5, 4, 3, 2, 1 ]`.
The time complexity is **$O(n^2)$**, not $O(n)$.
While the `for` loop iterates $n$ times, `output.unshift()` must physically shift every existing item in the array one slot to the right in memory on every single insertion. Inserting item 1 takes 1 move, item 2 takes 2 moves, up to item $n$ taking $n$ moves:
$$\sum_{i=1}^n i = \frac{n(n+1)}{2} \approx O(n^2)$$
To reverse an array efficiently, use an in-place two-pointer swap ($O(n)$ time, $O(1)$ space) or push to the end and call `.reverse()` once.

---

### 3. Spot and fix the performance and correctness bug in this palindrome validator:
```javascript
function isPalindrome(s) {
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    while (!/[a-zA-Z0-9]/.test(s[left])) left++;
    while (!/[a-zA-Z0-9]/.test(s[right])) right--;
    if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
    left++;
    right--;
  }
  return true;
}
```
**Answer:**
There is a critical correctness bug:
The inner `while` loops lack boundary conditions (`left < right`). If the input string consists entirely of non-alphanumeric characters (such as `s = "     "` or `s = "???"`), `left` will increment past `s.length - 1`, causing `s[left]` to evaluate to `undefined`. In strict mode or regex execution, this throws errors or results in an out-of-bounds loop.
In addition, compiling a regular expression (`/[a-zA-Z0-9]/`) inside the loop on every iteration introduces unnecessary regex engine overhead.
The fix is to include `left < right` in both inner while loops and use integer character code comparisons (`charCodeAt`).

---

### 4. In a high-traffic Node.js streaming service processing 50,000 requests per second, when would you use a `Buffer` instead of a UTF-8 `String`? Explain the system tradeoffs.
**Answer:**
In high-throughput services (like an API gateway, proxy, or file upload service), use **`Buffer`** whenever the application does not need to inspect or transform the text content:

1. **V8 Heap vs Off-Heap Memory**: JavaScript `String` objects are allocated directly inside the V8 JavaScript heap. Storing large volumes of strings triggers frequent V8 Young and Old Generation garbage collection cycles, pausing the single-threaded event loop. In contrast, `Buffer` instances allocate memory **outside the V8 heap** in C++ memory via `ArrayBuffer`, dramatically reducing GC pressure.
2. **Zero-Copy Network I/O**: Network sockets (libuv) read and write raw bytes. Converting network packets to strings requires a UTF-8 decoding pass, and sending them back out requires a UTF-8 encoding pass. Keeping data as `Buffer` chunks allows zero-copy piping directly from the incoming HTTP stream to disk or upstream microservices.
3. **When to use String**: Only convert buffers to `String` when business logic specifically requires character manipulation, JSON parsing, regex routing, or templating.

---

## 12. Practice Problems

### 1. Valid Palindrome - Easy
A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.
- **Sample Input 1:** `s = "A man, a plan, a canal: Panama"`
- **Expected Output 1:** `true`
- **Sample Input 2:** `s = "race a car"`
- **Expected Output 2:** `false`
- **Sample Input 3:** `s = " "`
- **Expected Output 3:** `true`

### 2. Reverse String - Easy
Write a function that reverses a string. The input string is given as an array of characters `s`. You must do this by modifying the input array in-place with $O(1)$ extra memory.
- **Sample Input 1:** `s = ["h","e","l","l","o"]`
- **Expected Output 1:** `["o","l","l","e","h"]`
- **Sample Input 2:** `s = ["H","a","n","n","a","h"]`
- **Expected Output 2:** `["h","a","n","n","a","H"]`

### 3. Longest Common Prefix - Easy
Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string `""`.
- **Sample Input 1:** `strs = ["flower","flow","flight"]`
- **Expected Output 1:** `"fl"`
- **Sample Input 2:** `strs = ["dog","racecar","car"]`
- **Expected Output 2:** `""`

---

<nav aria-label="Lecture navigation">

[Previous: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Searching & Elementary Sorting](day-03-searching-and-sorting-algorithms.md)

</nav>
