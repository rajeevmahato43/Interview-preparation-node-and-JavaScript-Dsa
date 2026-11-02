# Day 02: Arrays, Strings & Primitive Memory

<nav aria-label="Lecture navigation">

[Previous: Big O Complexity & Algorithmic Problem Solving](day-01-big-o-complexity-and-problem-solving.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Searching & Elementary Sorting Algorithms](day-03-searching-and-sorting-algorithms.md)

</nav>

---

## 1. Arrays and Memory Layout

An **array** is a list of values stored side-by-side in computer memory. Every item inside the array has a number called an index, starting at `0`.

To picture this in real life, imagine a long hallway with 100 metal lockers bolted to the wall side-by-side (`[0], [1], [2] ... [99]`):
* **Fast Lookup ($O(1)$):** Because all lockers have the exact same width, you do not have to count from door 0. Your eyes know the exact distance down the hallway and you can walk directly to locker #42 in one step.
* **Fast Add at End ($O(1)$):** Bolting a new locker onto the far-right end of the hallway takes one quick step. None of the existing lockers need to move.
* **Slow Add at Front ($O(n)$):** Putting a new locker at the very front (slot #0) means you must slide all 100 existing lockers one spot to the right to make room.

```javascript
// Node.js code
"use strict";

const scores = [85, 92, 78, 90];

// O(1) Fast lookup by index
console.log(scores[0]); // 85
console.log(scores[2]); // 78

// O(1) Fast update in place
scores[1] = 95;
console.log(scores);    // [85, 95, 78, 90]
```

### 1.1 Zero-Based Indexing

Array indices start at `0` instead of `1` because the index tells the computer **how many items to skip** from the start of the array in memory:

$$\text{Memory Address} = \text{Start Address} + (\text{Index} \times \text{Item Size})$$

```text
Array Start Address = 1000, Item Size = 8 bytes

Index [0] ──> 1000 + (0 × 8) = Byte 1000 (Start address, skip 0 items)
Index [1] ──> 1000 + (1 × 8) = Byte 1008 (Skip 1 item)
Index [3] ──> 1000 + (3 × 8) = Byte 1024 (Skip 3 items)
```

Because the computer only needs to do one multiplication and one addition, reading any index takes fast $O(1)$ constant time, whether the array has 5 items or 5,000,000 items.

> [!NOTE]
> **Self-Check:** Why does reading `arr[999999]` take the exact same time as reading `arr[0]`?  
> *Answer:* The computer calculates the memory address directly using math (`Start + 999999 * 8`), jumping straight to the right spot without scanning earlier items.

---

### 1.2 Insertion and Deletion

How long it takes to add or remove an item depends on **where** you change the array:

```text
Insert at Index 0:
Original:    [ 10 ] [ 20 ] [ 30 ]
                │      │      │
Slide right:    ▼      ▼      ▼
New:   [ 5 ] [ 10 ] [ 20 ] [ 30 ]  (Must slide all items = O(n))

Insert at End:
Original:    [ 10 ] [ 20 ] [ 30 ]
                                   └──> Add [ 40 ] (No items slide = O(1))
```

* **At the End (`push` / `pop`):** Runs in **$O(1)$ time**. The array grows or shrinks by one slot at the end; no other items need to move.
* **At the Beginning (`unshift` / `shift`):** Runs in **$O(n)$ time**. Adding or removing at index `0` forces every single item after it to slide one spot to the right or left.
* **In the Middle (`splice`):** Runs in **$O(n)$ time**. Every item to the right of that spot must shift to make room or fill the hole.

```javascript
const items = [10, 20, 30];

// O(1) Fast add to end
items.push(40);
console.log(items); // [10, 20, 30, 40]

// O(1) Fast remove from end
items.pop();
console.log(items); // [10, 20, 30]

// O(n) Slow add to front: slides 10, 20, 30 in memory
items.unshift(5);
console.log(items); // [5, 10, 20, 30]

// O(n) Slow remove from front: slides all items left
items.shift();
console.log(items); // [10, 20, 30]
```

---

### 1.3 Dynamic Arrays and Amortized O(1)

In older languages like C, an array has a fixed size and cannot grow. In JavaScript, arrays are **dynamic**: they grow automatically when you add more items.

Here is how the JavaScript engine (V8) does this:
1. It reserves a small block of memory (like 4 empty slots).
2. When you call `.push()`, it fills the empty slots in fast $O(1)$ time.
3. When all slots are full and you try to add another item:
   - It reserves a new block that is **twice as big** (like 8 slots, then 16 slots).
   - It copies all old items into the new block ($O(n)$ copy work).
   - It frees the old block.
   - It puts the new item into the next free slot.

```text
Capacity = 4: [ 1 ][ 2 ][ 3 ][ 4 ] (FULL)
Push 5!
1. Reserve new block of Capacity = 8
2. Copy 4 items: [ 1 ][ 2 ][ 3 ][ 4 ][   ][   ][   ][   ]
3. Insert 5:     [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][   ][   ][   ]
```

#### Amortized O(1)
Even though the engine has to resize occasionally, adding items with `.push()` is considered **Amortized $O(1)$ time**:
* When adding $N$ items, the resize copies only happen at sizes $1, 2, 4, 8, \dots$:
$$\text{Total Copies} = 1 + 2 + 4 + 8 + \dots + \frac{N}{2} = N - 1$$
* Adding the $N$ normal insertions gives:
$$\text{Total Steps} = N \text{ (inserts)} + (N - 1) \text{ (copies)} = 2N - 1 \text{ steps}$$
* The average cost per `.push()` is:
$$\frac{2N - 1}{N} \approx 2 \text{ steps} = \mathbf{O(1) \text{ Average Time}}$$

> [!NOTE]
> **Self-Check:** If pushing an element sometimes takes O(n) time because the array needs to resize, why is `.push()` still considered O(1)?  
> *Answer:* Resizing happens only once in a while. Most `.push()` calls take 1 step, so the rare resize cost is spread out over many fast pushes, making the average cost $O(1)$.

---

### 1.4 Stack Memory vs Heap Memory

JavaScript divides computer memory into two main areas:

```text
STACK MEMORY (Fast, Ordered, Fixed-Size)
┌─────────────────────────┬─────────────────────────┐
│ Variable Name           │ Stored Value            │
├─────────────────────────┼─────────────────────────┤
│ age                     │ 30                      │
│ price                   │ 99.5                    │
│ listRef                 │ 0x4F2A (Address pointer)│
└─────────────────────────┴─────────────────────────┘
                                   │
                                   ▼
HEAP MEMORY (Flexible, Dynamic Storage)
┌───────────────────────────────────────────────────┐
│ Address 0x4F2A: [ 10, 20, 30, 40 ] (Array Data)   │
└───────────────────────────────────────────────────┘
```

1. **Stack Memory (Primitives):** Stores simple data like numbers, booleans, `null`, and `undefined`. Values are stored directly on the stack and copied **by value** (creating a completely independent copy).
2. **Heap Memory (Objects and Arrays):** Stores bigger or flexible data like arrays, objects, and functions. Variables on the stack only store an **address pointer** pointing to where the data lives in heap memory. When you assign an array to another variable, it copies only the **pointer**, not the array itself.

```javascript
// 1. PRIMITIVES: Copied by Value (Independent)
let a = 10;
let b = a; // b gets its own copy of 10
b = 99;
console.log(a); // 10 (a is not changed)
console.log(b); // 99

// 2. REFERENCES: Copied by Reference (Shared Pointer)
const listA = [1, 2, 3];
const listB = listA; // listB points to the EXACT same array as listA

listB.push(999);
console.log(listA); // [1, 2, 3, 999] (listA changed too!)
console.log(listB); // [1, 2, 3, 999]

// To make an independent copy of an array:
const listClone = [...listA];
listClone.pop();
console.log(listA);     // [1, 2, 3, 999] (Original is safe)
console.log(listClone); // [1, 2, 3]
```

---

### 1.5 Packed vs Holey Arrays

The JavaScript engine optimizes arrays based on whether they have empty gaps:
* **Packed Arrays:** Every index from `0` to `length - 1` has a value (`[1, 2, 3, 4]`).
* **Holey Arrays:** The array has empty gaps (holes) between indices.

```javascript
// Packed Array (Fast)
const packed = [1, 2, 3, 4];

// Holey Array (Slower)
const holey = [1, 2];
holey[10] = 99; // Indices 2 through 9 are empty holes!

console.log(holey.length); // 11
console.log(holey);        // [ 1, 2, <8 empty items>, 99 ]
console.log(holey[5]);     // undefined
```

When reading an item from a packed array, the engine jumps straight to that memory offset ($O(1)$). When reading a holey array and hitting a hole, the engine must check JavaScript prototype rules to make sure no property exists with that name. This extra check can make holey arrays run up to **10 times slower**.

> [!NOTE]
> **Self-Check:** Why should you avoid using `delete arr[2]` on an array?  
> *Answer:* `delete` removes the item and leaves an empty hole in the array, making the array holey and slower to access. Use `arr.splice(2, 1)` or create a new array instead.

---

### 1.6 Multi-Dimensional Arrays

A multi-dimensional array (matrix) is an array where each item is another array. You read values using row and column indices: `matrix[row][col]`.

```javascript
const matrix = [
  [1, 2, 3], // Row 0
  [4, 5, 6], // Row 1
  [7, 8, 9]  // Row 2
];

console.log(matrix[0][0]); // 1 (Row 0, Col 0)
console.log(matrix[1][2]); // 6 (Row 1, Col 2)

// Looping through rows and columns
for (let r = 0; r < matrix.length; r++) {
  for (let c = 0; c < matrix[r].length; c++) {
    const val = matrix[r][c];
  }
}
```

---

### 1.7 Essential Array Methods

| Method | What It Does | Changes Original? | Time Complexity | Quick Example |
| :--- | :--- | :---: | :---: | :--- |
| `push(val)` | Adds to end | ✅ Yes | **$O(1)$** (Average) | `[1, 2].push(3)` $\to$ `[1, 2, 3]` |
| `pop()` | Removes last item | ✅ Yes | **$O(1)$** | `[1, 2, 3].pop()` $\to$ `3` |
| `unshift(val)` | Adds to start (shifts all) | ✅ Yes | **$O(n)$** | `[2, 3].unshift(1)` $\to$ `[1, 2, 3]` |
| `shift()` | Removes first item (shifts all) | ✅ Yes | **$O(n)$** | `[1, 2, 3].shift()` $\to$ `1` |
| `indexOf(val)` | Finds first index of item | ❌ No | **$O(n)$** | `["a", "b"].indexOf("b")` $\to$ `1` |
| `includes(val)` | Checks if item exists | ❌ No | **$O(n)$** | `[1, 2].includes(2)` $\to$ `true` |
| `slice(start, end)` | Copies part of array | ❌ No | **$O(k)$** ($k = \text{end} - \text{start}$) | `[1, 2, 3, 4].slice(1, 3)` $\to$ `[2, 3]` |
| `splice(start, count)` | Removes / adds in middle | ✅ Yes | **$O(n)$** | `[1, 2, 3].splice(1, 1)` $\to$ `[1, 3]` |
| `concat(arr2)` | Combines two arrays | ❌ No | **$O(n + m)$** | `[1].concat([2])` $\to$ `[1, 2]` |
| `join(separator)` | Turns array into a string | ❌ No | **$O(n)$** | `["a", "b"].join("-")` $\to$ `"a-b"` |

---

## 2. Strings and Character Encodings

A **string** is an ordered list of characters representing text. In JavaScript, strings are **immutable**: once created in memory, characters inside them can never be changed in place.

To picture this in real life, imagine words carved into stone. You can read any letter instantly. But if you want to change `"cat"` to `"car"`, you cannot scrape off `'t'` and carve `'r'`. You have to throw away the stone and carve the whole word `"car"` onto a brand-new stone.

```javascript
const word = "cat";

// Reading a letter by index
console.log(word[0]); // "c"
console.log(word[2]); // "t"

// Trying to change a character in place does not work in JavaScript!
word[0] = "b";
console.log(word); // Still "cat"! (Does NOT become "bat")
```

### 2.1 String Concatenation

Because strings cannot be changed in place, using `str += char` inside a loop forces the engine to build a brand-new string and copy all old letters on every single turn.

If a loop runs $n$ times:
$$\text{Total Copies} = 1 + 2 + 3 + \dots + n = \frac{n(n + 1)}{2} = \mathbf{O(n^2) \text{ Time and Memory Waste}}$$

To keep your code fast, push items into an array and call `.join("")` once at the end ($O(n)$).

```javascript
// ❌ ANTI-PATTERN: Adding to a string in a loop (O(n^2) slow)
function buildStringSlow(items) {
  let result = "";
  for (let i = 0; i < items.length; i++) {
    result += items[i] + ","; // Copies the whole string on every step!
  }
  return result;
}

// ✅ CORRECT: Collect in an array and join once (Optimal: O(n) fast)
function buildStringFast(items) {
  const buffer = [];
  for (let i = 0; i < items.length; i++) {
    buffer.push(items[i]);
  }
  return buffer.join(","); // One single pass to build string
}

console.log(buildStringFast(["apple", "banana", "cherry"])); // "apple,banana,cherry"
```

---

### 2.2 Character Codes and ASCII Math

Every character is stored as a number. In JavaScript, `str.charCodeAt(i)` gives the number code for the letter at index `i`.

Useful common codes:
* `'0'` to `'9'`: Codes `48` to `57`
* `'A'` to `'Z'`: Codes `65` to `90`
* `'a'` to `'z'`: Codes `97` to `122`

Subtracting `'a'.charCodeAt(0)` (`97`) from any lowercase letter gives you an array slot from `0` to `25`:

```javascript
const char = "c";
const asciiCode = char.charCodeAt(0);  // 99
const bucketIndex = asciiCode - 97;    // 99 - 97 = 2 (Slot 2 in a 26-slot array)

console.log(asciiCode);   // 99
console.log(bucketIndex); // 2
```

> [!NOTE]
> **Self-Check:** How does subtracting `48` from a digit character code like `'7'.charCodeAt(0)` turn it into a number?  
> *Answer:* In ASCII, `'0'` is `48` and `'7'` is `55`. Calculating `55 - 48` gives the number `7` directly and fast without needing `parseInt()`.

---

### 2.3 Unicode and Emojis

JavaScript strings are stored in **16-bit code units** (UTF-16). Regular letters and numbers fit in a single 16-bit unit. Modern emojis and special symbols need numbers bigger than `65535`, so they are stored as **two 16-bit code units** (called a surrogate pair).

```javascript
const emoji = "🚀";

console.log(emoji.length);        // 2 (Counts 16-bit units, NOT visible symbols!)
console.log(emoji.charCodeAt(0)); // 55357 (First half of emoji)
console.log(emoji.charCodeAt(1)); // 56960 (Second half of emoji)

// ❌ Naive split cuts the emoji in half and breaks it:
console.log(emoji.split("").reverse().join("")); // Broken characters!

// ✅ Array.from handles full emojis properly:
console.log(Array.from(emoji).length); // 1
console.log(Array.from(emoji).reverse().join("")); // "🚀" (Safe and working!)
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

### 2.4 Essential String Methods

| Method | What It Does | Changes Original? | Time Complexity | Quick Example |
| :--- | :--- | :---: | :---: | :--- |
| `str[i]` / `charAt(i)` | Reads character at index $i$ | ❌ No (Immutable) | **$O(1)$** | `"Code"[1]` $\to$ `"o"` |
| `charCodeAt(i)` | Gets integer code at index $i$ | ❌ No | **$O(1)$** | `"A".charCodeAt(0)` $\to$ `65` |
| `slice(start, end)` | Takes part of the string | ❌ No | **$O(k)$** ($k = \text{end} - \text{start}$) | `"Hello".slice(1, 4)` $\to$ `"ell"` |
| `indexOf(substr)` | Finds first starting index of text | ❌ No | **$O(n)$** | `"hello".indexOf("ll")` $\to$ `2` |
| `includes(substr)` | Checks if text is inside string | ❌ No | **$O(n)$** | `"hello".includes("ell")` $\to$ `true` |
| `split(separator)` | Splits string into an array | ❌ No | **$O(n)$** | `"a,b,c".split(",")` $\to$ `["a", "b", "c"]` |
| `trim()` | Removes spaces at start and end | ❌ No | **$O(n)$** | `"  hi  ".trim()` $\to$ `"hi"` |
| `toLowerCase()` | Converts all letters to lowercase | ❌ No | **$O(n)$** | `"Hi!".toLowerCase()` $\to$ `"hi!"` |
| `replace(old, new)` | Replaces first match | ❌ No | **$O(n)$** | `"cat".replace("c", "b")` $\to$ `"bat"` |

---

## 3. Two Pointers Pattern Overview

The **Two Pointers** pattern helps us solve array and string problems using two index variables at the same time. Instead of using slow nested loops ($O(n^2)$), two pointers move through the list in a single pass ($O(n)$) without using extra memory ($O(1)$ space).

### 3.1 Pattern Family
* **Inward Moving Pointers:** One pointer starts at the left (`left = 0`) and the other starts at the right (`right = n - 1`). They move toward each other until they meet. Used for checking palindromes, reversing arrays, and finding pairs in sorted arrays.
* **Read and Write Pointers (Fast & Slow):** Both pointers move in the same direction. The `read` pointer inspects each element while the `write` pointer keeps track of where to write the next valid item. Used for removing items in place, moving zeroes, and compacting data.

### 3.2 Pattern Recognition Table

| Problem Keyword | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| **"In-place" / "$O(1)$ extra memory"** | Change the array without making a new one. | Read & Write Pointers or In-place Swapping. |
| **"Palindrome"** | Check if text reads the same forward and backward. | Inward Pointers (`left = 0`, `right = n - 1`). |
| **"Move all elements matching X to the end"** | Keep valid items at front, send others to back. | Read & Write Pointers. |
| **"Reverse array or string"** | Flip order in place. | Inward Swapping Pointers (`swap(arr[l], arr[r])`). |

### 3.3 When to Use vs When NOT to Use

#### When to Use
* You have an array or string where you can read items by index in $O(1)$ time.
* You need to reverse, filter, or clean up an array in place with $O(1)$ extra memory.
* You need to compare items starting from both ends.

#### When NOT to Use
* You have a singly linked list where you cannot move backward.
* You need to find pairs across an unsorted list without any order (use a `Map` or `Set` instead).
* You need to calculate sums of sub-arrays (use Prefix Sum instead).

### 3.4 The 10^7 Operations Rule
If an array has $n = 100,000$ items:
* A slow nested loop takes $(100,000)^2 = 10^{10}$ steps (10 billion operations), taking over **100 seconds** and freezing Node.js.
* Two pointers check each item at most twice ($2n = 200,000$ steps), finishing in **under 2 milliseconds**.

---

## 4. Problem Walkthroughs

---

### 4.1 Move Zeroes

#### 4.1.1 Problem Statement
Given an integer array `nums`, move all `0`s to the end of it while keeping the non-zero numbers in their original order. You must do this **in-place** without copying the array.

* **Sample Input 1:** `nums = [0, 1, 0, 3, 12]` $\to$ **Expected Output:** `[1, 3, 12, 0, 0]`
* **Sample Input 2:** `nums = [0]` $\to$ **Expected Output:** `[0]`
* **Sample Input 3:** `nums = [2, 1]` $\to$ **Expected Output:** `[2, 1]`
* **Constraints:** $1 \le nums.length \le 10^5$, $-2^{31} \le nums[i] \le 2^{31} - 1$.

#### 4.1.2 How to Think About It
Imagine numbered tiles placed in a row on a table: `[0, 1, 0, 3, 12]`.

Place your left index finger at the start of the table (`write = 0`). This finger points to where the next non-zero number should go.  
Use your right index finger (`read`) to check each tile from left to right:
1. At index 0, the tile is `0`. Skip it.
2. At index 1, the tile is `1`. Swap the `1` into your left finger's spot (`write = 0`), and move your left finger to slot 1.
3. At index 2, the tile is `0`. Skip it.
4. At index 3, the tile is `3`. Swap the `3` into your left finger's spot (`write = 1`), and move your left finger to slot 2.
5. At index 4, the tile is `12`. Swap the `12` into slot 2, and move your left finger to slot 3.

All non-zero numbers are packed neatly at the front in their original order, and all zeroes end up at the back.

#### 4.1.3 Brute Force Approach & Bottleneck
The naive way is to loop through the array, call `.splice(i, 1)` whenever you find a zero, and call `.push(0)` to add it to the end:

```javascript
function moveZeroesBruteForce(nums) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === 0) {
      nums.splice(i, 1); // Costly memory shift!
      nums.push(0);
      i--; // Adjust index after deletion
    }
  }
  return nums;
}
```

* **The Bottleneck:** Calling `nums.splice(i, 1)` makes the computer slide all remaining items to the left in memory ($O(n)$ work). Calling this inside a loop creates an **$O(n^2)$ slow loop**. For $100,000$ items, this freezes the program.

#### 4.1.4 The Pattern Insight
Instead of sliding items with `splice()`, use **Read & Write Pointers**:
* The `read` pointer checks every item once from index `0` to `n - 1`.
* The `write` pointer moves forward only when a non-zero item is swapped into place.
* Every item is swapped at most once in one pass ($O(n)$ time, $O(1)$ memory).

#### 4.1.5 Pseudocode

```text
FUNCTION MoveZeroes(nums):
  write = 0

  FOR read FROM 0 TO length(nums) - 1:
    IF nums[read] != 0:
      // Swap non-zero element into write position
      temp = nums[write]
      nums[write] = nums[read]
      nums[read] = temp

      write = write + 1

  RETURN nums
```

#### 4.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time and O(1) space Read & Write Two Pointers
function moveZeroes(nums) {
  if (!Array.isArray(nums) || nums.length <= 1) return nums;

  let write = 0;

  for (let read = 0; read < nums.length; read++) {
    if (nums[read] !== 0) {
      // Only swap if pointers are at different positions to avoid redundant self-swaps
      if (read !== write) {
        const temp = nums[write];
        nums[write] = nums[read];
        nums[read] = temp;
      }
      write++;
    }
  }

  return nums;
}

// Example runs
console.log(moveZeroes([0, 1, 0, 3, 12])); // [1, 3, 12, 0, 0]
console.log(moveZeroes([0]));             // [0]
console.log(moveZeroes([4, 2, 0, 1]));    // [4, 2, 1, 0]
```

#### 4.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Calling splice() inside an array traversal loop
function buggyMoveZeroes(nums) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === 0) {
      // BUG: splice() shifts all following elements in RAM on every match -> O(n^2) time!
      nums.splice(i, 1);
      nums.push(0);
      i--; // Dangerous index tracking under mutation
    }
  }
  return nums;
}
```
* **Why it fails:** Deleting items in place with `splice()` moves all items behind it every time a zero is found. This makes the code run in quadratic $O(n^2)$ time.

#### 4.1.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The `read` pointer visits each index once. Each step does a quick swap and moves forward.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. No new arrays are created; everything happens in place.

---

### 4.2 Valid Palindrome

#### 4.2.1 Problem Statement
A phrase is a palindrome if, after converting all uppercase letters to lowercase and removing all spaces and punctuation, it reads the exact same forward and backward. Given a string `s`, return `true` if it is a palindrome, or `false` otherwise.

* **Sample Input 1:** `s = "A man, a plan, a canal: Panama"` $\to$ **Expected Output:** `true`
* **Sample Input 2:** `s = "race a car"` $\to$ **Expected Output:** `false`
* **Sample Input 3:** `s = " "` $\to$ **Expected Output:** `true`
* **Constraints:** $1 \le s.length \le 2 \times 10^5$, `s` consists only of printable ASCII characters.

#### 4.2.2 How to Think About It
Imagine the sentence printed on a long paper strip.

Place your left index finger at the first character (`left = 0`) and your right index finger at the last character (`right = s.length - 1`):
1. If your left finger is touching a space or punctuation, slide it right until it touches a letter or number.
2. If your right finger is touching a space or punctuation, slide it left until it touches a letter or number.
3. Compare the two characters (ignoring capital letters). If they are different, it is not a palindrome—stop immediately!
4. If they match, move both fingers inward. If your fingers meet or cross in the middle without finding any mismatches, the phrase is a palindrome.

#### 4.2.3 Brute Force Approach & Bottleneck
The naive way cleans the string with regex, turns it into an array, reverses it, and compares the strings:

```javascript
function isPalindromeBruteForce(s) {
  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const reversed = cleaned.split("").reverse().join("");
  return cleaned === reversed;
}
```

* **The Bottleneck:** Creates several large new strings and arrays in memory: the cleaned string, the split array, and the reversed string. For large text ($200,000$ characters), this wastes memory and slows down Node.js.

#### 4.2.4 The Pattern Insight
Instead of making new strings and arrays, use **Inward Two Pointers**:
* `left` starts at index `0`; `right` starts at index `s.length - 1`.
* Use character codes (`charCodeAt`) to skip spaces and punctuation without creating new strings.
* Compare characters directly in place. Stop as soon as you find a mismatch. This uses $O(1)$ extra memory.

#### 4.2.5 Pseudocode

```text
FUNCTION IsPalindrome(s):
  left = 0
  right = length(s) - 1

  WHILE left < right:
    WHILE left < right AND NOT IsAlphaNumeric(s[left]):
      left = left + 1

    WHILE left < right AND NOT IsAlphaNumeric(s[right]):
      right = right - 1

    IF ToLower(s[left]) != ToLower(s[right]):
      RETURN false

    left = left + 1
    right = right - 1

  RETURN true
```

#### 4.2.6 Optimal Solution

```javascript
// Fast helper: ASCII alphanumeric check without regex allocation
function isAlphaNumeric(code) {
  return (
    (code >= 48 && code <= 57) || // 0-9
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122)   // a-z
  );
}

// ✅ CORRECT: Optimal O(n) time, O(1) space Inward Two Pointers
function isPalindrome(s) {
  if (typeof s !== "string" || s.length <= 1) return true;

  let left = 0;
  let right = s.length - 1;

  while (left < right) {
    // Skip non-alphanumeric characters from left
    while (left < right && !isAlphaNumeric(s.charCodeAt(left))) {
      left++;
    }
    // Skip non-alphanumeric characters from right
    while (left < right && !isAlphaNumeric(s.charCodeAt(right))) {
      right--;
    }

    // Compare characters in lowercase
    if (s[left].toLowerCase() !== s[right].toLowerCase()) {
      return false; // Mismatch found
    }

    left++;
    right--;
  }

  return true;
}

// Example runs
console.log(isPalindrome("A man, a plan, a canal: Panama")); // true
console.log(isPalindrome("race a car"));                     // false
console.log(isPalindrome(" "));                              // true
```

#### 4.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Heap-heavy regex and string reversal
function memoryHeavyPalindrome(s) {
  // BUG: Allocates 3 new strings and 1 intermediate array on the heap
  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleaned === cleaned.split("").reverse().join("");
}
```
* **Why it fails:** While this takes $O(n)$ time, it creates many temporary strings and arrays in memory. This wastes memory and forces Node.js to pause to clean up.

#### 4.2.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The two pointers move toward each other, checking each character at most twice.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. No new strings or arrays are created; we only use two number index variables.

---

### 4.3 Reverse Array In-Place

#### 4.3.1 Problem Statement
Given an array `arr`, reverse the order of its items **in-place** without creating a second array.

* **Sample Input 1:** `arr = [1, 2, 3, 4, 5]` $\to$ **Expected Output:** `[5, 4, 3, 2, 1]`
* **Sample Input 2:** `arr = ["a", "b", "c", "d"]` $\to$ **Expected Output:** `["d", "c", "b", "a"]`
* **Sample Input 3:** `arr = [42]` $\to$ **Expected Output:** `[42]`
* **Constraints:** $0 \le arr.length \le 10^5$.

#### 4.3.2 How to Think About It
Imagine 5 cards placed in order on a table: `[1, 2, 3, 4, 5]`.

Put your left hand on Card 0 (`1`) and your right hand on Card 4 (`5`):
1. Pick up both cards and swap their places.
2. Move your left hand one step right to Card 1 (`2`), and your right hand one step left to Card 3 (`4`).
3. Swap both cards.
4. Move your hands inward again. Both hands meet at Card 2 (`3`). A card cannot swap with itself, so stop!

The array is completely reversed in only 2 swaps.

#### 4.3.3 Brute Force Approach & Bottleneck
The naive way makes a new empty array, walks backward through the original array, and pushes each item into the new array:

```javascript
function reverseArrayOutOfPlace(arr) {
  const reversed = [];
  for (let i = arr.length - 1; i >= 0; i--) {
    reversed.push(arr[i]);
  }
  return reversed;
}
```

* **The Bottleneck:** Creates a whole new array of size $n$ in memory ($O(n)$ auxiliary space), breaking the requirement to reverse the array in place with $O(1)$ extra memory.

#### 4.3.4 The Pattern Insight
Reversing an array is the classic example of **Inward Two Pointers**:
* Pointer `left = 0` and pointer `right = arr.length - 1`.
* In each turn, swap `arr[left]` and `arr[right]` using a temporary variable.
* Stop when `left >= right`. The total work is only $\lfloor n / 2 \rfloor$ swaps.

#### 4.3.5 Pseudocode

```text
FUNCTION ReverseArray(arr):
  left = 0
  right = length(arr) - 1

  WHILE left < right:
    temp = arr[left]
    arr[left] = arr[right]
    arr[right] = temp

    left = left + 1
    right = right - 1

  RETURN arr
```

#### 4.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(1) space in-place array reversal
function reverseArray(arr) {
  if (!Array.isArray(arr) || arr.length <= 1) return arr;

  let left = 0;
  let right = arr.length - 1;

  while (left < right) {
    // In-place primitive value swap
    const temp = arr[left];
    arr[left] = arr[right];
    arr[right] = temp;

    left++;
    right--;
  }

  return arr;
}

// Example runs
console.log(reverseArray([1, 2, 3, 4, 5])); // [5, 4, 3, 2, 1]
console.log(reverseArray(["a", "b", "c"])); // ["c", "b", "a"]
console.log(reverseArray([42]));            // [42]
```

#### 4.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Iterating up to arr.length un-reverses the array!
function buggyReverse(arr) {
  for (let i = 0; i < arr.length; i++) {
    // BUG: Swapping for all n iterations reverses the array, then reverses it right back!
    const target = arr.length - 1 - i;
    const temp = arr[i];
    arr[i] = arr[target];
    arr[target] = temp;
  }
  return arr; // Array ends up back in original order!
}
```
* **Why it fails:** Swapping across the full length of the array swaps the first half with the second half, and then swaps them right back to where they started. The loop must stop in the middle (`left < right`).

#### 4.3.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The loop does $\lfloor n / 2 \rfloor$ swaps, which is linear $O(n)$ time.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. We only use one temporary variable and two index pointers.

---

## 5. Tricky Edge Cases

* **Empty Arrays or Single Items:** Arrays with 0 or 1 item should never enter `while (left < right)`. Always check that your code handles empty lists safely.
* **Strings Cannot Be Changed in Place:** Writing `str[0] = "x"` does not work in JavaScript because strings are immutable. Turn the string into an array (`Array.from(str)`) if you need to swap letters.
* **Emojis Take Two Units:** Emojis like `🚀` have a `.length` of 2 because of 16-bit UTF-16 units. Using `s.split("").reverse().join("")` cuts emojis in half. Always use `Array.from(s)` to work with whole emojis.
* **Holey Arrays from `delete`:** Using `delete arr[i]` leaves an empty hole instead of shifting items. This makes the array slower. Use `.splice()` or make a new array instead.
* **Double Swap Bug:** When reversing an array with two pointers, looping all the way to `arr.length` swaps items twice and puts them back in their original order. Always stop at `left < right`.

---

## 6. Summary Cheat Sheet

* **Array Memory:** Stored side-by-side in memory. Finding an item by index is fast **$O(1)$** using direct address math (`Start + Index * Size`).
* **Dynamic Growing:** JavaScript arrays double in size when full. The occasional resize takes $O(n)$, but the average cost to add an item is **$O(1)$**.
* **Stack vs Heap:** Simple values live on the Stack (copied by value). Arrays and objects live on the Heap (variables hold address pointers).
* **String Immutability:** Strings cannot be changed in place. Avoid slow `+=` loops; put items in an array and use `.join("")` once at the end.
* **Emoji Safety:** `str.length` counts 16-bit units, not visible symbols. Emojis take 2 units. Use `Array.from(str)` for safe character handling.
* **Two Pointers:** Use Inward Pointers (`left < right`) for palindromes and reversals; use Read/Write Pointers for moving or cleaning up items in place.

---

## 7. Practice Problems

### 7.1 Remove Element - Easy / Warm-Up
Given an integer array `nums` and an integer `val`, remove all occurrences of `val` in-place and return the count of items that are not equal to `val`.
* **Sample Input 1:** `nums = [3, 2, 2, 3]`, `val = 3` $\to$ **Expected Output:** `2` (with first two elements being `[2, 2]`)
* **Sample Input 2:** `nums = [0, 1, 2, 2, 3, 0, 4, 2]`, `val = 2` $\to$ **Expected Output:** `5` (with first five elements being `[0, 1, 3, 0, 4]`)
* **Constraints:** $0 \le nums.length \le 100$, $0 \le nums[i], val \le 50$.
* **Hint 1:** Start a `write` pointer at 0.
* **Hint 2:** Walk through the array with a `read` pointer. Whenever `nums[read] !== val`, copy `nums[read]` into `nums[write]` and move `write` forward by 1.

---

### 7.2 Longest Common Prefix - Medium
Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string `""`.
* **Sample Input 1:** `strs = ["flower", "flow", "flight"]` $\to$ **Expected Output:** `"fl"`
* **Sample Input 2:** `strs = ["dog", "racecar", "car"]` $\to$ **Expected Output:** `""`
* **Constraints:** $1 \le strs.length \le 200$, $0 \le strs[i].length \le 200$, `strs[i]` consists of only lowercase English letters.
* **Hint 1:** Take the first word `strs[0]` as your starting prefix candidate.
* **Hint 2:** For each letter in `strs[0]`, check if all other words have that exact same letter at that position. If any word is shorter or has a different letter, return the prefix up to that point.

---

### 7.3 Rotate Array - Hard / Advanced
Given an integer array `nums`, rotate the array to the right by `k` steps, where `k` is non-negative. You must solve this in-place with **$O(1)$ extra memory**.
* **Sample Input 1:** `nums = [1, 2, 3, 4, 5, 6, 7]`, `k = 3` $\to$ **Expected Output:** `[5, 6, 7, 1, 2, 3, 4]`
* **Sample Input 2:** `nums = [-1, -100, 3, 99]`, `k = 2` $\to$ **Expected Output:** `[3, 99, -1, -100]`
* **Constraints:** $1 \le nums.length \le 10^5$, $-2^{31} \le nums[i] \le 2^{31} - 1$, $0 \le k \le 10^5$.
* **Hint 1:** `k` can be bigger than the array length. Use `k = k % nums.length` to keep it within range.
* **Hint 2:** You can rotate an array using three simple reversals: reverse the whole array, reverse the first `k` items, and then reverse the remaining items.

---

<nav aria-label="Lecture navigation">

[Previous: Big O Complexity & Algorithmic Problem Solving](day-01-big-o-complexity-and-problem-solving.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Searching & Elementary Sorting Algorithms](day-03-searching-and-sorting-algorithms.md)

</nav>
