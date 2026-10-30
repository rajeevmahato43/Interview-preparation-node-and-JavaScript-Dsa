# Day 02: Arrays, Strings & Primitive Memory

<nav aria-label="Lecture navigation">

[Previous: Big O Complexity & Algorithmic Problem Solving](day-01-big-o-complexity-and-problem-solving.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Searching & Elementary Sorting Algorithms](day-03-searching-and-sorting-algorithms.md)

</nav>

---

## 1. Arrays and Memory Layout

An **array** is an ordered collection of values stored in contiguous (unbroken) memory locations. Every slot inside the array has a fixed numeric index starting at `0`.

To picture this physically, imagine a hallway of 100 numbered metal lockers bolted side-by-side into a wall (`[0], [1], [2] ... [99]`):
* **Instant Lookup ($O(1)$):** Because every locker has the exact same physical width, you do not need to walk down the hall counting from door 0. Your eyes calculate the exact distance down the hallway and step directly in front of Locker #42 in one single motion.
* **Fast End Append ($O(1)$):** Bolting a brand-new locker onto the empty far-right end of the hallway takes one step. No other lockers have to move.
* **Expensive Front Insertion ($O(n)$):** Inserting a new locker into slot #0 requires unbolting and sliding all 100 existing lockers one slot to the right before the new locker can fit.

```javascript
// Node.js code
"use strict";

const scores = [85, 92, 78, 90];

// O(1) Instant element lookup by index offset
console.log(scores[0]); // 85
console.log(scores[2]); // 78

// O(1) In-place value update
scores[1] = 95;
console.log(scores);    // [85, 95, 78, 90]
```

### 1.1 Zero-Based Indexing

Array indices start at `0` rather than `1` because the index represents a **memory offset**—how many element widths to skip from the beginning of the array.

When code accesses `arr[i]`, the CPU calculates the memory address in a single hardware cycle:

$$\text{Memory Address} = \text{Base Address} + (\text{Index} \times \text{Element Size})$$

```text
Array Base Memory Address = 1000, Element Size = 8 bytes

Index [0] ──> 1000 + (0 × 8) = Byte 1000 (Start address, 0 steps away)
Index [1] ──> 1000 + (1 × 8) = Byte 1008 (Skip 1 element width)
Index [3] ──> 1000 + (3 × 8) = Byte 1024 (Skip 3 element widths)
```

Because this calculation requires only one multiplication and one addition, accessing any index in an array takes identical $O(1)$ constant time regardless of whether the array holds 5 elements or 5,000,000 elements.

> [!NOTE]
> **Self-Check:** Why does accessing `arr[999999]` take the exact same time as accessing `arr[0]`?  
> *Answer:* The CPU calculates the physical memory address directly via arithmetic multiplication (`Base + 999999 * 8`), jumping straight to the byte offset in 1 clock cycle without scanning earlier items.

---

### 1.2 Insertion and Deletion

The time complexity of changing an array depends entirely on **where** the modification happens:

```text
Insert at Index 0:
Original:    [ 10 ] [ 20 ] [ 30 ]
                │      │      │
Slide right:    ▼      ▼      ▼
New:   [ 5 ] [ 10 ] [ 20 ] [ 30 ]  (Requires n shift operations = O(n))

Insert at End:
Original:    [ 10 ] [ 20 ] [ 30 ]
                                   └──> Append [ 40 ] (0 shifts = O(1))
```

* **At the End (`push` / `pop`):** Runs in **$O(1)$ time**. The memory boundary expands or contracts by one slot; zero existing elements change position.
* **At the Beginning (`unshift` / `shift`):** Runs in **$O(n)$ time**. Adding or removing at index `0` forces all $n$ following elements to slide one memory address to the right or left.
* **In the Middle (`splice`):** Runs in **$O(n)$ time**. Every element to the right of the insertion or deletion index must be shifted to fill the gap or make room.

```javascript
const items = [10, 20, 30];

// O(1) Fast append to end
items.push(40);
console.log(items); // [10, 20, 30, 40]

// O(1) Fast removal from end
items.pop();
console.log(items); // [10, 20, 30]

// O(n) Expensive front insertion: shifts 10, 20, 30 in memory
items.unshift(5);
console.log(items); // [5, 10, 20, 30]

// O(n) Expensive front deletion: shifts all items left
items.shift();
console.log(items); // [10, 20, 30]
```

---

### 1.3 Dynamic Arrays and Amortized O(1)

In low-level systems like C, a standard array is **static**—its size is fixed at allocation and cannot change. JavaScript arrays are **dynamic arrays**: they automatically expand as you push more items.

To manage this in the V8 engine:
1. The engine allocates a contiguous chunk of memory on the heap called a **backing store** with an initial fixed capacity (e.g., 4 slots).
2. As elements are added with `.push()`, they fill the allocated empty slots in $O(1)$ time.
3. When the backing store is full and a new element arrives, the engine:
   - Allocates a brand-new contiguous block with **double the capacity** (e.g., capacity grows from 4 to 8, then 8 to 16).
   - Copies all existing $n$ elements from the old block into the new block ($O(n)$ copy cost).
   - Frees the old memory block.
   - Appends the new item into the first free slot.

```text
Capacity = 4: [ 1 ][ 2 ][ 3 ][ 4 ] (FULL)
Push 5!
1. Allocate new memory block of Capacity = 8
2. Copy 4 items: [ 1 ][ 2 ][ 3 ][ 4 ][   ][   ][   ][   ]
3. Insert 5:     [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][   ][   ][   ]
```

#### The Amortized O(1) Mathematical Derivation
Even though an occasional resize takes $O(n)$ work, dynamic array appending is classified as **Amortized $O(1)$ time**:
* To insert $N$ items into an initially empty dynamic array doubling at sizes $1, 2, 4, 8, \dots, N$:
$$\text{Total Copies} = 1 + 2 + 4 + 8 + \dots + \frac{N}{2} = N - 1$$
* Adding the $N$ regular insertions gives:
$$\text{Total Operations} = N \text{ (insertions)} + (N - 1) \text{ (copies)} = 2N - 1 \text{ operations}$$
* The average cost per single append is:
$$\frac{2N - 1}{N} \approx 2 \text{ operations} = \mathbf{O(1) \text{ Amortized Time}}$$

> [!NOTE]
> **Self-Check:** If pushing an element sometimes takes $O(n)$ time to resize the backing store, why is `.push()` called an $O(1)$ operation?  
> *Answer:* Resizes happen exponentially less often as the array grows ($1, 2, 4, 8, 16\dots$). The expensive $O(n)$ resize cost is averaged out ("amortized") across all the cheap $O(1)$ insertions that preceded it, making the average cost per insert a constant $\approx 2$ operations.

---

### 1.4 Stack Memory vs Heap Memory

JavaScript divides runtime memory into two primary regions:

```text
STACK MEMORY (Fast, Ordered, Fixed-Size)
┌─────────────────────────┬─────────────────────────┐
│ Variable Name           │ Stored Value            │
├─────────────────────────┼─────────────────────────┤
│ age                     │ 30                      │
│ price                   │ 99.5                    │
│ listRef                 │ 0x4F2A (Pointer to Heap)│
└─────────────────────────┴─────────────────────────┘
                                   │
                                   ▼
HEAP MEMORY (Dynamic, Unordered, Flexible Storage)
┌───────────────────────────────────────────────────┐
│ Address 0x4F2A: [ 10, 20, 30, 40 ] (Array Buffer) │
└───────────────────────────────────────────────────┘
```

1. **Stack Memory (Primitives):** Stores primitive types (`Number`, `Boolean`, `null`, `undefined`, `Symbol`, `BigInt`, and pointer addresses). Values are stored directly in stack frames and copied **by value** (independent clones).
2. **Heap Memory (Reference Types):** Stores variable-sized objects, arrays, and functions. Variables in stack frames hold only an **address pointer** referencing the object's physical location on the heap. Assigning an array copies only the **pointer reference**, not the underlying contents.

```javascript
// 1. PRIMITIVES: Copied by Value (Independent)
let a = 10;
let b = a; // b gets a brand-new independent copy of 10
b = 99;
console.log(a); // 10 (a is completely unchanged)
console.log(b); // 99

// 2. REFERENCES: Copied by Reference (Shared Pointer)
const listA = [1, 2, 3];
const listB = listA; // listB points to the EXACT same heap address as listA

listB.push(999);
console.log(listA); // [1, 2, 3, 999] (listA is modified too!)
console.log(listB); // [1, 2, 3, 999]

// To create an independent heap copy:
const listClone = [...listA];
listClone.pop();
console.log(listA);     // [1, 2, 3, 999] (Original preserved)
console.log(listClone); // [1, 2, 3]
```

---

### 1.5 Packed vs Holey Arrays

The V8 engine optimizes arrays based on their internal structure ("ElementsKind"):
* **Packed Arrays:** Every index from `0` to `length - 1` holds an allocated value (`[1, 2, 3, 4]`).
* **Holey (Sparse) Arrays:** The array contains empty, unassigned gaps (holes) between indices.

```javascript
// Packed Array (Fastest optimization tier)
const packed = [1, 2, 3, 4];

// Holey Array (De-optimized tier)
const holey = [1, 2];
holey[10] = 99; // Indices 2 through 9 are empty holes!

console.log(holey.length); // 11
console.log(holey);        // [ 1, 2, <8 empty items>, 99 ]
console.log(holey[5]);     // undefined
```

When reading an index from a packed array, V8 inspects the exact memory offset directly ($O(1)$). When reading an index from a holey array and finding a hole, V8 cannot assume the value is `undefined`. It must walk up the prototype chain (`Array.prototype`, `Object.prototype`) to confirm no prototype property exists with that index name. This prototype lookup makes holey array operations run up to **10× slower**.

> [!NOTE]
> **Self-Check:** What is the performance danger of using `delete arr[2]` on an array?  
> *Answer:* `delete` removes the property and leaves an empty hole in the array, permanently degrading it to a slow holey elements kind. Use `arr.splice(2, 1)` or re-allocation instead.

---

### 1.6 Multi-Dimensional Arrays

A multi-dimensional array (matrix) in JavaScript is an array whose elements are themselves references to other arrays. Elements are accessed using coordinate pairs: `matrix[row][col]`.

```javascript
const matrix = [
  [1, 2, 3], // Row 0
  [4, 5, 6], // Row 1
  [7, 8, 9]  // Row 2
];

console.log(matrix[0][0]); // 1 (Row 0, Col 0)
console.log(matrix[1][2]); // 6 (Row 1, Col 2)

// Row-major traversal (Cache-friendly)
for (let r = 0; r < matrix.length; r++) {
  for (let c = 0; c < matrix[r].length; c++) {
    // Accesses contiguous items sequentially
    const val = matrix[r][c];
  }
}
```

---

### 1.7 Essential Array Methods

| Method | What It Does | Mutates Original? | Time Complexity | Quick Example |
| :--- | :--- | :---: | :---: | :--- |
| `push(val)` | Appends to end | ✅ Yes | **$O(1)$** (Amortized) | `[1, 2].push(3)` $\to$ `[1, 2, 3]` |
| `pop()` | Removes last element | ✅ Yes | **$O(1)$** | `[1, 2, 3].pop()` $\to$ `3` |
| `unshift(val)` | Inserts at start (shifts all) | ✅ Yes | **$O(n)$** | `[2, 3].unshift(1)` $\to$ `[1, 2, 3]` |
| `shift()` | Removes first element (shifts all) | ✅ Yes | **$O(n)$** | `[1, 2, 3].shift()` $\to$ `1` |
| `indexOf(val)` | Finds first index of item | ❌ No | **$O(n)$** | `["a", "b"].indexOf("b")` $\to$ `1` |
| `includes(val)` | Checks if value exists | ❌ No | **$O(n)$** | `[1, 2].includes(2)` $\to$ `true` |
| `slice(start, end)` | Copies shallow slice | ❌ No | **$O(k)$** ($k = \text{end} - \text{start}$) | `[1, 2, 3, 4].slice(1, 3)` $\to$ `[2, 3]` |
| `splice(start, count)` | Removes / inserts in middle | ✅ Yes | **$O(n)$** | `[1, 2, 3].splice(1, 1)` $\to$ `[1, 3]` |
| `concat(arr2)` | Merges two arrays into new array | ❌ No | **$O(n + m)$** | `[1].concat([2])` $\to$ `[1, 2]` |
| `join(separator)` | Converts elements to string | ❌ No | **$O(n)$** | `["a", "b"].join("-")` $\to$ `"a-b"` |

---

## 2. Strings and Character Encodings

A **string** is an ordered sequence of 16-bit characters representing text. In JavaScript, strings are strictly **immutable**: once allocated in memory, individual characters can never be modified or replaced in-place.

To picture this physically, imagine words chiseled into a solid slab of granite stone. You can inspect any letter instantly with your eyes. However, if you want to change the word `"cat"` to `"car"`, you cannot scrape off `'t'` and chisel `'r'`. You must discard the stone and chisel the complete word `"car"` onto a brand-new slab of granite.

```javascript
const word = "cat";

// Reading by index offset
console.log(word[0]); // "c"
console.log(word[2]); // "t"

// In-place character modification fails silently in JavaScript!
word[0] = "b";
console.log(word); // Still "cat"! (Does NOT become "bat")
```

### 2.1 String Concatenation

Because strings are immutable, using `str += char` inside a loop forces the engine to allocate a brand-new string and copy all previous characters into it on every single iteration.

If a loop runs $n$ times:
$$\text{Total Copies} = 1 + 2 + 3 + \dots + n = \frac{n(n + 1)}{2} = \mathbf{O(n^2) \text{ Time and Memory Churn}}$$

To prevent quadratic allocation bottlenecks, collect values in an array buffer and invoke `.join("")` once at the end ($O(n)$).

```javascript
// ❌ ANTI-PATTERN: String concatenation in loop (O(n^2) time & memory churn)
function buildStringSlow(items) {
  let result = "";
  for (let i = 0; i < items.length; i++) {
    result += items[i] + ","; // Copies entire previous string on every step!
  }
  return result;
}

// ✅ CORRECT: Array buffer joined once (Optimal: O(n) time & memory)
function buildStringFast(items) {
  const buffer = [];
  for (let i = 0; i < items.length; i++) {
    buffer.push(items[i]);
  }
  return buffer.join(","); // Single linear allocation pass
}

console.log(buildStringFast(["apple", "banana", "cherry"])); // "apple,banana,cherry"
```

---

### 2.2 Character Codes and ASCII Math

Every character is stored numerically according to its integer code. In JavaScript, `str.charCodeAt(i)` returns the numeric character code at index `i`.

Useful standard ASCII values:
* `'0'` through `'9'`: Codes `48` through `57`
* `'A'` through `'Z'`: Codes `65` through `90`
* `'a'` through `'z'`: Codes `97` through `122`

Subtracting `'a'.charCodeAt(0)` (`97`) from any lowercase letter normalizes the character directly into an array bucket index from `0` to `25`:

```javascript
const char = "c";
const asciiCode = char.charCodeAt(0);  // 99
const bucketIndex = asciiCode - 97;    // 99 - 97 = 2 (Slot 2 in a 26-slot array)

console.log(asciiCode);   // 99
console.log(bucketIndex); // 2
```

> [!NOTE]
> **Self-Check:** How does subtracting `48` from a digit character code like `'7'.charCodeAt(0)` convert it into an integer?  
> *Answer:* In ASCII, `'0'` is `48` and `'7'` is `55`. Calculating `55 - 48` evaluates to numeric `7` in single CPU clock cycles without calling `parseInt()`.

---

### 2.3 Unicode and Emojis

JavaScript strings are encoded using **UTF-16 code units** (16 bits per unit). Standard alphanumeric characters fit within a single 16-bit code unit. However, modern emojis and specialized symbols require code points above `65535` and are represented as **two 16-bit code units** (a surrogate pair).

```javascript
const emoji = "🚀";

console.log(emoji.length);        // 2 (Counts UTF-16 code units, NOT visible glyphs!)
console.log(emoji.charCodeAt(0)); // 55357 (High surrogate code unit)
console.log(emoji.charCodeAt(1)); // 56960 (Low surrogate code unit)

// ❌ Naive split breaks the surrogate pair and corrupts characters:
console.log(emoji.split("").reverse().join("")); // Corrupted replacement characters!

// ✅ Array.from respects full Unicode code points:
console.log(Array.from(emoji).length); // 1
console.log(Array.from(emoji).reverse().join("")); // "🚀" (Intact!)
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

| Method | What It Does | Mutates Original? | Time Complexity | Quick Example |
| :--- | :--- | :---: | :---: | :--- |
| `str[i]` / `charAt(i)` | Reads character code unit at index $i$ | ❌ No (Immutable) | **$O(1)$** | `"Code"[1]` $\to$ `"o"` |
| `charCodeAt(i)` | Gets UTF-16 integer at index $i$ | ❌ No | **$O(1)$** | `"A".charCodeAt(0)` $\to$ `65` |
| `slice(start, end)` | Extracts substring interval | ❌ No | **$O(k)$** ($k = \text{end} - \text{start}$) | `"Hello".slice(1, 4)` $\to$ `"ell"` |
| `indexOf(substr)` | Finds first starting index of substring | ❌ No | **$O(n)$** | `"hello".indexOf("ll")` $\to$ `2` |
| `includes(substr)` | Checks if substring exists | ❌ No | **$O(n)$** | `"hello".includes("ell")` $\to$ `true` |
| `split(separator)` | Splits string into array of segments | ❌ No | **$O(n)$** | `"a,b,c".split(",")` $\to$ `["a", "b", "c"]` |
| `trim()` | Strips leading and trailing whitespace | ❌ No | **$O(n)$** | `"  hi  ".trim()` $\to$ `"hi"` |
| `toLowerCase()` | Converts all characters to lowercase | ❌ No | **$O(n)$** | `"Hi!".toLowerCase()` $\to$ `"hi!"` |
| `replace(old, new)` | Replaces first occurrence | ❌ No | **$O(n)$** | `"cat".replace("c", "b")` $\to$ `"bat"` |

---

## 3. Two Pointers Pattern Overview

The **Two Pointers** pattern optimizes array and string problems by using two numeric variables to track indices simultaneously. Instead of scanning with nested loops ($O(n^2)$), the pointers navigate the collection in linear time ($O(n)$) while allocating zero extra memory ($O(1)$ space).

### Two Pointers Pattern Family
* **Inward Converging Pointers:** One pointer starts at index `0` (`left`) and the second starts at index `n - 1` (`right`). They move toward each other until they meet. Used for palindromes, reversals, and sorted two-sum problems.
* **Read and Write Pointers (Fast & Slow):** Both pointers move in the same direction. The `read` pointer inspects elements sequentially while the `write` pointer marks the boundary of modified or valid elements. Used for in-place deduplication, compaction, and filtering.

### Pattern Recognition Table

| Problem Keyword | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| **"In-place" / "$O(1)$ extra memory"** | Transform array without allocating a second array. | Read & Write Pointers or In-place Swapping. |
| **"Palindrome"** | Verify text reads identically forward and backward. | Inward Converging Pointers (`left = 0`, `right = n - 1`). |
| **"Move all elements matching X to the end"** | Compact or partition elements maintaining relative order. | Read & Write Pointers. |
| **"Reverse array or string"** | Invert order in-place. | Inward Swapping Pointers (`swap(arr[l], arr[r])`). |

### When to Use
* The input is a contiguous array or string where elements can be addressed by index offset in $O(1)$ time.
* The problem asks to reverse, filter, compact, or partition items in-place with $O(1)$ auxiliary memory.
* The problem asks to compare elements symmetrically from opposite ends.

### When NOT to Use
* The collection is a singly linked list where backward indexing is impossible without $O(n)$ per step.
* You need random lookup across arbitrary non-adjacent pairs (use a `Map` or `Set` instead).
* The elements are unsorted and the problem asks for arbitrary sub-ranges (use Prefix Sum or Hash Tables).

### The $10^7$ Operations Constraint Rule
If an array contains $n = 100,000$ items:
* A naive nested loop takes $(100,000)^2 = 10^{10}$ operations (10 billion operations), taking over **100 seconds** and freezing single-threaded Node.js.
* Two pointers inspects each element at most twice ($2n = 200,000$ operations), finishing in **under 2 milliseconds**.

---

## 4. Problem Walkthroughs

---

### 4.1 Move Zeroes

#### 4.1.1 Problem Statement
Given an integer array `nums`, move all `0`s to the end of it while maintaining the relative order of the non-zero elements. You must do this **in-place** without making a copy of the array.

* **Sample Input 1:** `nums = [0, 1, 0, 3, 12]` $\to$ **Expected Output:** `[1, 3, 12, 0, 0]`
* **Sample Input 2:** `nums = [0]` $\to$ **Expected Output:** `[0]`
* **Sample Input 3:** `nums = [2, 1]` $\to$ **Expected Output:** `[2, 1]`
* **Constraints:** $1 \le nums.length \le 10^5$, $-2^{31} \le nums[i] \le 2^{31} - 1$.

#### 4.1.2 How to Think About It
Imagine a row of numbered tiles laid across a table: `[0, 1, 0, 3, 12]`.

Place your left index finger at the start of the table (`write = 0`). This finger marks the next available spot for a non-zero number.
Use your right index finger (`read`) to slide from left to right across all tiles:
1. At index 0, the tile is `0`. Skip it.
2. At index 1, the tile is `1`. Swap the `1` into your left finger's slot (`write = 0`) and advance your left finger to slot 1.
3. At index 2, the tile is `0`. Skip it.
4. At index 3, the tile is `3`. Swap the `3` into your left finger's slot (`write = 1`) and advance your left finger to slot 2.
5. At index 4, the tile is `12`. Swap the `12` into slot 2 and advance your left finger to slot 3.

All non-zero numbers are packed together at the front in their original relative order, and zeroes naturally collect at the end.

#### 4.1.3 Brute Force Approach & Bottleneck
The naive approach loops through the array, calls `.splice(i, 1)` whenever it encounters a zero, and calls `.push(0)` to send it to the back:

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

* **The Bottleneck:** Calling `nums.splice(i, 1)` forces the engine to shift all remaining elements to the left in memory ($O(n)$ operations). Calling this inside a loop creates an **$O(n^2)$ quadratic bottleneck**. For $10^5$ elements, this freezes the program.

#### 4.1.4 The Pattern Insight
Instead of shifting memory blocks with `splice()`, use **Read & Write Pointers**:
* The `read` pointer scans every element once from index `0` to `n - 1`.
* The `write` pointer advances only when a non-zero element is swapped into its position.
* Every element is swapped at most once in a single linear pass ($O(n)$ time, $O(1)$ memory).

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
* **Why it fails:** In-place deletions with `splice()` rewrite memory across the remainder of the array on every zero encountered, causing quadratic performance degradation.

#### 4.1.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The `read` pointer visits each index exactly once. At each step, a constant-time swap and increment occur.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. No new arrays are allocated; the transformation happens strictly in-place.

---

### 4.2 Valid Palindrome

#### 4.2.1 Problem Statement
A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers. Given a string `s`, return `true` if it is a palindrome, or `false` otherwise.

* **Sample Input 1:** `s = "A man, a plan, a canal: Panama"` $\to$ **Expected Output:** `true`
* **Sample Input 2:** `s = "race a car"` $\to$ **Expected Output:** `false`
* **Sample Input 3:** `s = " "` $\to$ **Expected Output:** `true`
* **Constraints:** $1 \le s.length \le 2 \times 10^5$, `s` consists only of printable ASCII characters.

#### 4.2.2 How to Think About It
Imagine the sentence printed on a long paper tape.

Place your left index finger at the very first character (`left = 0`) and your right index finger at the very last character (`right = s.length - 1`):
1. If your left finger is touching punctuation, a colon, or a space, slide it right until it touches a letter or number.
2. If your right finger is touching punctuation or a space, slide it left until it touches a letter or number.
3. Compare the characters under both fingers (ignoring case). If they do not match, the paper is not a palindrome—stop immediately!
4. If they match, advance both fingers inward. If your fingers meet or cross in the middle without finding a single mismatch, the phrase is a valid palindrome.

#### 4.2.3 Brute Force Approach & Bottleneck
The naive approach uses regular expressions to clean the string, splits it into an array, reverses the array, and compares strings:

```javascript
function isPalindromeBruteForce(s) {
  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const reversed = cleaned.split("").reverse().join("");
  return cleaned === reversed;
}
```

* **The Bottleneck:** Allocates multiple large objects on the heap: the lowercase string, the regex-replaced string, the split array, and the reversed string. For large inputs ($n = 200,000$), this burns $O(n)$ heap memory and triggers heavy garbage collection pauses.

#### 4.2.4 The Pattern Insight
Instead of allocating fresh memory, use **Inward Converging Two Pointers**:
* `left` starts at index `0`; `right` starts at index `s.length - 1`.
* Use ASCII code checking (`charCodeAt`) to skip non-alphanumeric characters directly without allocating regex copies.
* Compare characters in-place. The algorithm exits early on the first mismatch, achieving $O(1)$ auxiliary memory.

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
* **Why it fails:** While computationally $O(n)$, this allocates $4n$ bytes of heap memory, creating severe memory churn and blocking the single-threaded Node.js event loop during garbage collection.

#### 4.2.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The pointers advance toward each other, inspecting each character at most twice.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. No strings, arrays, or regex objects are allocated; only two integer index variables are used.

---

### 4.3 Reverse Array In-Place

#### 4.3.1 Problem Statement
Given an array `arr`, reverse the order of its elements **in-place** without allocating a second array.

* **Sample Input 1:** `arr = [1, 2, 3, 4, 5]` $\to$ **Expected Output:** `[5, 4, 3, 2, 1]`
* **Sample Input 2:** `arr = ["a", "b", "c", "d"]` $\to$ **Expected Output:** `["d", "c", "b", "a"]`
* **Sample Input 3:** `arr = [42]` $\to$ **Expected Output:** `[42]`
* **Constraints:** $0 \le arr.length \le 10^5$.

#### 4.3.2 How to Think About It
Imagine 5 cards laid out in order: `[1, 2, 3, 4, 5]`.

Place your left hand on Card 0 (`1`) and your right hand on Card 4 (`5`).
1. Pick up both cards and swap their positions.
2. Move your left hand one step right to Card 1 (`2`) and your right hand one step left to Card 3 (`4`).
3. Swap both cards.
4. Move your left hand right and right hand left. Both hands meet at Card 2 (`3`). A card cannot swap with itself—stop!

The array is completely reversed after only 2 swaps.

#### 4.3.3 Brute Force Approach & Bottleneck
The naive approach creates a new empty array, iterates backwards through the original array, and pushes each item into the new array:

```javascript
function reverseArrayOutOfPlace(arr) {
  const reversed = [];
  for (let i = arr.length - 1; i >= 0; i--) {
    reversed.push(arr[i]);
  }
  return reversed;
}
```

* **The Bottleneck:** Allocates a brand-new array of size $n$ on the heap ($O(n)$ auxiliary space), violating the strict $O(1)$ in-place memory constraint.

#### 4.3.4 The Pattern Insight
Symmetric reversal is the purest form of **Inward Two Pointers**:
* Pointer `left = 0` and pointer `right = arr.length - 1`.
* In each iteration, swap `arr[left]` and `arr[right]` using a temporary variable.
* Stop when `left >= right`. The total work is strictly $\lfloor n / 2 \rfloor$ swaps.

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
* **Why it fails:** Swapping across the entire length of the array swaps elements in the first half, and then swaps them a second time in the second half, restoring the original order. The loop condition must stop at the midpoint (`left < right` or `i < Math.floor(n / 2)`).

#### 4.3.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The loop performs exactly $\lfloor n / 2 \rfloor$ swaps, which simplifies asymptotically to $O(n)$.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. Only one primitive `temp` variable and two index pointers are allocated.

---

## 5. Tricky Edge Cases

* **Empty Input / Single Element:** Pointers for arrays of size 0 or 1 (`left = 0`, `right = -1` or `left = 0`, `right = 0`) must never enter `while (left < right)`. Always verify boundary conditions on empty collections.
* **String In-Place Modification Traps:** Writing `str[0] = "x"` fails silently in non-strict mode and throws in strict mode without changing the string. Always convert to an array (`Array.from(str)`) if in-place transformations are required.
* **Surrogate Pair Emoji Lengths:** Emojis like `🚀` or `👨‍👩‍👧‍👦` possess a `.length` greater than 1 due to 16-bit UTF-16 surrogate pairs. Using `s.split("").reverse().join("")` splits the pair into invalid unicode fragments. Always use `Array.from(s)` for character-level operations.
* **Holey Array Transitions:** Using `delete arr[i]` leaves an empty gap rather than shifting elements. This permanently de-optimizes V8's internal backing store into a holey array. Always use `.splice()` or rebuild arrays cleanly.
* **Double-Reversal Trap:** In two-pointer swapping algorithms, running a `for` loop up to `i < arr.length` swaps items twice and returns the original array unchanged. Stop at `left < right`.

---

## 6. Summary Cheat Sheet

* **Array Memory:** Stored in contiguous RAM. Index access is instant **$O(1)$** via direct offset arithmetic (`Base + Index * Size`).
* **Dynamic Resizing:** V8 doubles capacity ($4 \to 8 \to 16$) when backing stores fill. While copying costs $O(n)$, amortized append cost is **$O(1)$**.
* **Memory Regions:** Primitives live on the Stack (copied by value). Objects and Arrays live in the Heap (copied by shared reference pointer).
* **String Immutability:** Strings cannot be changed in-place. Avoid quadratic `+=` loops; accumulate in array buffers and call `.join("")` once.
* **Unicode Reality:** `str.length` counts 16-bit code units, not visible glyphs. Emojis occupy 2 code units (surrogate pairs).
* **Two Pointers Invariant:** Use Inward Pointers (`left < right`) for symmetrical checks/reversals; use Read/Write Pointers (`write <= read`) for filtering and compacting.

---

## 7. Practice Problems

### 7.1 Remove Element - Easy / Warm-Up
Given an integer array `nums` and an integer `val`, remove all occurrences of `val` in-place and return the number of elements that are not equal to `val`.
* **Sample Input 1:** `nums = [3, 2, 2, 3]`, `val = 3` $\to$ **Expected Output:** `2` (with first two elements being `[2, 2]`)
* **Sample Input 2:** `nums = [0, 1, 2, 2, 3, 0, 4, 2]`, `val = 2` $\to$ **Expected Output:** `5` (with first five elements being `[0, 1, 3, 0, 4]`)
* **Constraints:** $0 \le nums.length \le 100$, $0 \le nums[i], val \le 50$.
* **Hint 1:** Initialize a `write` pointer at 0.
* **Hint 2:** Iterate through the array with a `read` pointer. Whenever `nums[read] !== val`, copy `nums[read]` into `nums[write]` and increment `write`.

---

### 7.2 Longest Common Prefix - Medium
Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string `""`.
* **Sample Input 1:** `strs = ["flower", "flow", "flight"]` $\to$ **Expected Output:** `"fl"`
* **Sample Input 2:** `strs = ["dog", "racecar", "car"]` $\to$ **Expected Output:** `""`
* **Constraints:** $1 \le strs.length \le 200$, $0 \le strs[i].length \le 200$, `strs[i]` consists of only lowercase English letters.
* **Hint 1:** Take the first string `strs[0]` as your candidate prefix.
* **Hint 2:** For each character index in `strs[0]`, check if every other string in `strs` has the exact same character at that index. If any string is shorter or has a mismatch, return the prefix up to that point.

---

### 7.3 Rotate Array - Hard / Advanced
Given an integer array `nums`, rotate the array to the right by `k` steps, where `k` is non-negative. You must solve this in-place with **$O(1)$ auxiliary space**.
* **Sample Input 1:** `nums = [1, 2, 3, 4, 5, 6, 7]`, `k = 3` $\to$ **Expected Output:** `[5, 6, 7, 1, 2, 3, 4]`
* **Sample Input 2:** `nums = [-1, -100, 3, 99]`, `k = 2` $\to$ **Expected Output:** `[3, 99, -1, -100]`
* **Constraints:** $1 \le nums.length \le 10^5$, $-2^{31} \le nums[i] \le 2^{31} - 1$, $0 \le k \le 10^5$.
* **Hint 1:** `k` can be larger than the array length. Normalize it first using `k = k % nums.length`.
* **Hint 2:** Any rotation can be achieved using three reversals: reverse the entire array, reverse the first `k` elements, and reverse the remaining $n - k$ elements.

---

<nav aria-label="Lecture navigation">

[Previous: Big O Complexity & Algorithmic Problem Solving](day-01-big-o-complexity-and-problem-solving.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Searching & Elementary Sorting Algorithms](day-03-searching-and-sorting-algorithms.md)

</nav>
