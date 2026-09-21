# Day 02: Arrays, Objects, Sets, and Maps

<nav aria-label="Lecture navigation">

[← Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Day 03: Strings and Text Patterns →](day-03-strings-and-text-patterns.md)

</nav>

---

## What You Will Learn Today

By the end of this lecture you should be able to:

- Explain in plain words what an Array, Object, `Map`, and `Set` each do.
- Know **which one to reach for** given a problem's constraints.
- Explain why reading from an array by position is instant, but removing the first item is slow.
- Spot and fix the two most common traps: the **object prototype trap** and the **Set reference equality trap**.
- Solve the classic **Two Sum** interview problem in a single pass using a `Map`.

---

## Prerequisites

- [DSA Day 01 – Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — you need to understand O(1) and O(n) before this lecture makes sense.
- **JavaScript background** — the sections below link to the JS lecture series whenever a JavaScript concept needs deeper coverage. Read those links if anything feels unfamiliar.

---

## Quick Vocabulary Card

These words will appear throughout the lecture. Read this first so nothing blindsides you.

| Word | Plain meaning |
| :--- | :--- |
| **Data structure** | A way of organising data in memory so you can find and change it efficiently. |
| **Index** | The number you use to point at a position in an array. The first position is index `0`. |
| **Key** | The name you use to look up a value in an object or Map. Like a word in a dictionary. |
| **Value** | The thing stored at a given index or key. |
| **Lookup** | Finding a value — asking "what is stored here?". |
| **O(1) — constant time** | Takes the same time no matter how large the data is. |
| **O(n) — linear time** | Takes longer as the data grows; roughly proportional to size. |
| **Prototype** | A hidden parent object that every plain `{}` object inherits built-in properties from. Explained fully in [JS Day 10](../../Javascript/javascript-lectures/day-10-prototypes-classes-and-inheritance.md). |
| **Hash function** | An internal formula that turns a key into a memory slot number. JavaScript's `Map` and `Set` use this internally to give you O(1) lookups. |
| **Amortized** | "On average over many operations." For example, `push` is usually O(1) but occasionally O(n) when the array must grow its internal buffer — amortized it works out to O(1) per operation. |

---

## 1. Arrays — An Ordered List You Access by Position

### What is an Array?

An array is the simplest way to store a list of things **in order**. Think of it like a row of numbered boxes:

```
Index:  0       1        2
      +--------+--------+----------+
      | "cat"  | "dog"  | "rabbit" |
      +--------+--------+----------+
```

Each box has a fixed address (the index). To read box 2 you write `animals[2]`. JavaScript goes directly to that address — it does **not** scan through the list. That is why reads are O(1).

```js
// JavaScript (works in Node.js and the browser)
const animals = ["cat", "dog", "rabbit"];

console.log(animals[0]); // "cat"    — instant, O(1)
console.log(animals[2]); // "rabbit" — instant, O(1)
console.log(animals.length); // 3
```

> **Further reading on arrays:** [JS Day 12 – Built-in Data Structures](../../Javascript/javascript-lectures/day-12-built-in-data-structures-and-serialization.md) covers `Array` methods in depth.

### What operations are fast and what are slow?

| Operation | Method | Time | Why |
| :--- | :--- | :--- | :--- |
| Read by index | `arr[i]` | **O(1)** | Direct address lookup |
| Add to the end | `arr.push(x)` | **O(1)** amortized | Writes to the next empty slot |
| Remove from the end | `arr.pop()` | **O(1)** | Just decrements the length counter |
| Add to the front | `arr.unshift(x)` | **O(n)** | Every existing item must shift one slot to the right |
| Remove from the front | `arr.shift()` | **O(n)** | Every remaining item must shift one slot to the left |
| Find a value (no index) | `arr.includes(x)` | **O(n)** | Must scan from the beginning until it finds the value |

### Why is removing from the front slow?

Imagine the numbered boxes again. When you take out box 0, boxes 1, 2, 3, … must all slide left to fill the gap and keep their index numbers correct. If you have 10 000 items, every removal causes 9 999 moves.

```
Before shift():
  Index:  0     1     2     3
        [ "A" | "B" | "C" | "D" ]

After shift():
  Index:  0     1     2
        [ "B" | "C" | "D" ]
  B moved from slot 1 to 0, C from 2 to 1, D from 3 to 2. All three moved!
```

> [!WARNING]
> Never call `arr.shift()` inside a loop. If your loop runs n times and each `shift()` is O(n), you end up doing O(n x n) = O(n²) work — that will time out for large inputs in an interview.

---

## 2. Objects — A Dictionary with String Labels

### What is a plain Object?

A plain object `{}` stores **key-value pairs** where the keys are always strings (or Symbols). Think of it like a physical dictionary: you look up a word (the key) to find its definition (the value).

```js
const user = {
  name: "Priya",
  age: 28,
  city: "Mumbai",
};

console.log(user.name);    // "Priya"  — O(1) lookup by key
console.log(user["age"]);  // 28       — same thing, bracket syntax
```

> **Further reading on objects:** [JS Day 09 – Objects and Property Access](../../Javascript/javascript-lectures/day-09-objects-and-property-access.md) covers dot vs bracket notation, property descriptors, and more.

### The Prototype Trap — why it matters in interviews

Every plain object secretly inherits a set of built-in properties from something called `Object.prototype`. These hidden properties include names like `toString`, `constructor`, and `hasOwnProperty`.

Most of the time this is harmless. But it causes a real bug when you use an object as a **counter or lookup table** and one of your data values happens to match one of those hidden names.

```js
const wordCount = {};

// Works fine for normal words:
wordCount["hello"] = (wordCount["hello"] || 0) + 1;
console.log(wordCount["hello"]); // 1 — correct

// Breaks for "toString":
wordCount["toString"] = (wordCount["toString"] || 0) + 1;
// wordCount["toString"] starts as [Function: toString], not undefined.
// ([Function: toString] || 0) evaluates to the function (truthy),
// then function + 1 = "[Function: toString]1" — wrong!
console.log(wordCount["toString"]); // "[Function: toString]1" — wrong!
```

**Fix 1 — use a `Map` instead** (covered in the next section; this is the cleanest fix).

**Fix 2 — use `Object.create(null)`** to create an object that has no hidden parent at all:
```js
const safeCount = Object.create(null); // No built-in properties
safeCount["toString"] = (safeCount["toString"] || 0) + 1;
console.log(safeCount["toString"]); // 1 — correct now
```

> **Further reading on prototypes:** [JS Day 10 – Prototypes, Classes, and Inheritance](../../Javascript/javascript-lectures/day-10-prototypes-classes-and-inheritance.md).

---

## 3. Map — A Smarter Key-Value Store

### What is a Map?

A `Map` does the same job as a plain object — it stores key-value pairs — but it fixes several limitations:

- **Any type of key** is allowed: numbers, booleans, objects, anything.
- **No hidden properties** — it starts completely empty.
- **`.size` is instant O(1)** — you do not need to count manually.
- **Keys always stay in the order you added them** — no surprises.

```js
const map = new Map();

// Add entries with .set(key, value)
map.set("name", "Arjun");
map.set(42, "the answer");     // number key — plain objects cannot do this cleanly
map.set(true, "boolean key");  // boolean key

// Read with .get(key)
console.log(map.get("name")); // "Arjun"
console.log(map.get(42));     // "the answer"

// Check if a key exists — O(1)
console.log(map.has(true));   // true

// Count entries — O(1)
console.log(map.size);        // 3

// Remove with .delete(key)
map.delete(42);
console.log(map.size);        // 2
```

### Object vs Map — side-by-side

| | Plain Object `{}` | `Map` |
| :--- | :--- | :--- |
| **Allowed key types** | Strings and Symbols only | Any type |
| **Hidden built-in keys** | Yes (prototype) | No |
| **Get size** | `Object.keys(obj).length` — O(n) | `map.size` — O(1) |
| **Key order** | Integer keys sorted first, then insertion order | Strict insertion order always |
| **Best for** | Simple, fixed-shape records; JSON payloads | Dynamic counters, lookups, caches |

> **Further reading:** [JS Day 12 – Built-in Data Structures](../../Javascript/javascript-lectures/day-12-built-in-data-structures-and-serialization.md) covers `Map` iteration, conversion to/from arrays, and serialisation.

---

## 4. Set — A List That Never Has Duplicates

### What is a Set?

A `Set` stores a **collection of unique values**. If you add a value that is already in the Set, nothing happens — the duplicate is silently ignored.

Think of it as a guest list with a rule: the same person can only appear once. If you try to add the same name twice, the second attempt is ignored.

```js
const guestList = new Set();

guestList.add("Alice");
guestList.add("Bob");
guestList.add("Alice"); // duplicate — silently ignored

console.log(guestList.size);       // 2  (not 3)
console.log(guestList.has("Bob")); // true  — O(1) check
console.log(guestList.has("Eve")); // false — O(1) check
```

### Deduplicating an array in one line

```js
const scores = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3];
const unique = [...new Set(scores)];
// unique = [3, 1, 4, 5, 9, 2, 6]
```

What happens: `new Set(scores)` builds a Set (duplicates are dropped), then the spread operator `...` converts it back into a regular array. O(n) time, O(n) space.

---

## 5. How to Choose the Right Structure

When you see a problem, ask these questions in order:

```
1. Do you need items in a fixed order, accessed by position (index 0, 1, 2...)?
   Yes → Array

2. Do you need to quickly check "have I seen this before?" or guarantee no duplicates?
   Yes → Set

3. Do you need to store (key → value) pairs?
   3a. Do your keys need to be non-string types, or could they collide with
       built-in names like "constructor"?
       Yes → Map
   3b. Are the keys always safe, known strings and you need JSON output?
       Yes → Plain Object

Still unsure? → Map  (it is the safest default for dynamic lookups)
```

---

## 6. The Reference Equality Trap in Set and Map

This behaviour surprises many developers.

`Set` and `Map` compare **objects and arrays by memory address**, not by their contents. Two arrays that look identical but were created separately are treated as two different items.

```js
const seen = new Set();

const arr1 = [1, 2, 3];
const arr2 = [1, 2, 3]; // same content, but a separate object in memory

seen.add(arr1);
seen.add(arr2); // arr2 is stored at a different memory address, so it is added

console.log(seen.size); // 2  — not 1!

// Compare: primitive values ARE compared by content
const nums = new Set();
nums.add(5);
nums.add(5); // same primitive value
console.log(nums.size); // 1  — works as expected
```

**Rule of thumb:** `Set` and `Map` work perfectly for numbers, strings, and booleans. For objects and arrays, if you want content-based uniqueness you need to convert them to a string first (e.g. `JSON.stringify(arr)`) and store that string instead.

---

## Worked Examples

### Example 1 — Two Sum (the most common hash-map interview problem)

#### The Problem

Given an array of numbers and a target number, return the **indices** (positions) of the two numbers that add up to the target. Assume exactly one answer exists.

```
Input:  nums = [2, 7, 11, 15],  target = 9
Output: [0, 1]   (because nums[0] + nums[1] = 2 + 7 = 9)
```

#### Slow Solution — O(n²)

Check every possible pair using two nested loops:

```js
function twoSumSlow(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}
```

For 10 000 numbers this runs roughly 50 million comparisons. Too slow for an interview.

#### Fast Solution — O(n) using a Map

The key insight: instead of looking **forward** for a pair, look **backward** using a Map.

For each number, ask: "Have I already seen the number that would complete this pair?" The number that would complete the pair is called the **complement**: `complement = target - currentNumber`.

Store each number you have already visited in a Map mapped to its index. When you find the complement already in the Map, you are done.

```js
// JavaScript (Node.js / browser)
function twoSum(nums, target) {
  // seen maps: number -> index of where we saw it
  const seen = new Map();

  for (let i = 0; i < nums.length; i++) {
    const current = nums[i];
    const complement = target - current; // the number we need to complete the pair

    if (seen.has(complement)) {
      // We already saw the complement earlier — return both indices
      return [seen.get(complement), i];
    }

    // No pair found yet — record this number and move on
    seen.set(current, i);
  }

  return []; // no solution found
}
```

#### Step-by-step trace for `nums = [2, 7, 11, 15], target = 9`

| Step | `i` | `current` | `complement` | `seen` contents | Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 0 | 2 | 7 | (empty) | `seen` does not have 7. Store `2 → 0`. |
| 2 | 1 | 7 | 2 | `{2 → 0}` | `seen` **has** 2! Return `[seen.get(2), 1]` = **`[0, 1]`** |

Solved in two steps instead of nested loops. The `seen.has()` check is O(1), so the whole function is O(n).

---

### Example 2 — First Unique Character

#### The Problem

Find the first character in a string that appears only once. Return its index, or `-1` if none exists.

```
Input:  "interview"
Output: 0   ("i" appears only once, at index 0)
```

```js
// JavaScript (Node.js / browser)
function firstUniqueChar(str) {
  const freq = new Map(); // character -> how many times it appears

  // Pass 1: count how often each character appears
  for (const char of str) {
    freq.set(char, (freq.get(char) || 0) + 1);
  }

  // Pass 2: find the first character with a count of 1
  for (let i = 0; i < str.length; i++) {
    if (freq.get(str[i]) === 1) {
      return i;
    }
  }

  return -1;
}

console.log(firstUniqueChar("interview")); // 0  ("i" appears once)
console.log(firstUniqueChar("aabb"));      // -1 (no unique character)
```

**Complexity:** O(n) time — two passes through the string. O(k) space where k is the number of distinct characters (at most 26 for lowercase English letters).

---

## Common Mistakes

### 1. Object keys are always strings — even when they look like numbers

```js
const obj = {};
obj[1] = "one";
obj[2] = "two";
console.log(Object.keys(obj)); // ["1", "2"]  — strings, not numbers
```

If you store an object as a key, it converts to the string `"[object Object]"`. Two different objects produce the same key and overwrite each other:

```js
const map = {};
const a = { id: 1 };
const b = { id: 2 };
map[a] = "Alpha";
map[b] = "Beta";  // both keys become "[object Object]", so this overwrites
console.log(map[a]); // "Beta"  — not "Alpha"!
```

Fix: use a `Map`.

### 2. Using `arr.includes()` inside a loop

```js
// Slow — O(n) search inside an O(n) loop = O(n²) total
for (const item of items) {
  if (bigArray.includes(item)) { ... }
}

// Fast — convert to a Set once O(n), then each check is O(1)
const bigSet = new Set(bigArray);
for (const item of items) {
  if (bigSet.has(item)) { ... }
}
```

### 3. Spreading a Set to check membership

```js
// Bad — creates a new array on every check, O(n) each time
if ([...mySet].includes(x)) { ... }

// Good — O(1)
if (mySet.has(x)) { ... }
```

---

## Tricky Points

### Prototype trap with object counters

Covered in Section 2 above. Short version: if your keys could ever be `"constructor"`, `"toString"`, `"hasOwnProperty"`, or similar, use a `Map` or `Object.create(null)`.

### Reference vs value equality in Set/Map

Covered in Section 6 above. Primitives (numbers, strings, booleans) are compared by value. Objects and arrays are compared by memory address.

---

## Practical Exercise

Write a function `countWords(sentence)` that:
1. Takes a string like `"The dog saw the cat"`.
2. Returns a `Map` where each key is a **lowercase** word and the value is how many times it appears.
3. Ignores case — `"The"` and `"the"` both count as `"the"`.

**Expected output for `"The dog saw the cat"`:**
```
Map { "the" => 2, "dog" => 1, "saw" => 1, "cat" => 1 }
```

**Acceptance criteria:**
- Must use a `Map`, not a plain object.
- Must handle any number of spaces between words.
- Time complexity should be O(n) where n is the number of characters in the input.

> **Hint:** `sentence.toLowerCase().split(/\s+/)` splits a string on any whitespace and gives you an array of words. `\s+` means "one or more whitespace characters".

---

## Summary

- **Array** — ordered list, indexed by number. Reading by index is O(1). Adding or removing at the front (`unshift`/`shift`) is O(n) because all items must shift positions. Never call `shift` inside a loop.
- **Plain Object** — string-keyed dictionary. Simple and JSON-friendly, but has a hidden prototype that can cause bugs when data keys collide with built-in names like `"toString"`.
- **Map** — like an object but safer: any key type, no prototype, instant `.size`. Prefer it for dynamic counters and lookup tables.
- **Set** — a collection where every value is unique. Membership check (`.has`) is O(1). Objects inside a Set are compared by memory address, not by content.
- **The pattern:** convert an O(n²) nested-loop search into an O(n) single-pass solution by using a Map or Set to record what you have already seen.

---

## Cheat Sheet

### Operation Complexity

| Structure | Read | Insert | Delete | Membership check |
| :--- | :--- | :--- | :--- | :--- |
| **Array** (by index) | O(1) | End: O(1) · Front: O(n) | End: O(1) · Front: O(n) | O(n) with `.includes` |
| **Object** (by key) | O(1) avg | O(1) avg | O(1) avg | O(1) with `key in obj` |
| **Map** | O(1) avg | O(1) with `.set` | O(1) with `.delete` | O(1) with `.has` |
| **Set** | — | O(1) with `.add` | O(1) with `.delete` | O(1) with `.has` |

### Quick API Reference

```js
// Array
arr.push(x)      // add to end       O(1)
arr.pop()        // remove from end  O(1)
arr.unshift(x)   // add to front     O(n) — avoid inside loops!
arr.shift()      // remove from front  O(n) — avoid inside loops!
arr[i]           // read by index    O(1)

// Map
const m = new Map();
m.set(key, value)  // add/update
m.get(key)         // read
m.has(key)         // true/false  O(1)
m.delete(key)      // remove
m.size             // count  O(1)

// Set
const s = new Set();
s.add(value)       // add (duplicate ignored)
s.has(value)       // true/false  O(1)
s.delete(value)    // remove
s.size             // count  O(1)
[...new Set(arr)]  // deduplicate an array  O(n)
```

### Decision Guide

| Situation | Use |
| :--- | :--- |
| Ordered list, accessed by position | **Array** |
| Check if something was seen before | **Set** |
| Remove duplicates from a list | **Set** |
| Count how often each item appears | **Map** |
| Key-value pairs, keys are not plain strings | **Map** |
| Simple config / JSON payload with known string keys | **Plain Object** |
| Not sure? | **Map** (safest default) |

### Pattern Template — O(n) lookup with Map

Use this pattern whenever a problem asks for pairs, complements, or "have I seen X before?":

```js
function solvePairProblem(nums, target) {
  const seen = new Map(); // stores: value -> index (or whatever info you need)

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i]; // what we are searching for
    if (seen.has(complement)) {
      return [seen.get(complement), i];  // found the pair
    }
    seen.set(nums[i], i);               // record current item for future lookups
  }

  return []; // no solution
}
```

---

## Interview Questions

### 1. Concept Check

**Question:** What are three practical differences between a plain JavaScript object and a `Map`?

**Expected answer:** (1) **Key types** — objects only accept strings and Symbols as keys; `Map` accepts any type. (2) **Prototype safety** — plain objects inherit built-in properties like `toString` from `Object.prototype`, which can cause bugs when data keys collide with them; `Map` has no such inheritance. (3) **Size** — `Object.keys(obj).length` is O(n); `map.size` is O(1).

---

### 2. Predict the Output

**Question:** What does this print, and why?
```js
const map = {};
const a = { id: 1 };
const b = { id: 2 };
map[a] = "Alpha";
map[b] = "Beta";
console.log(map[a]);
```

**Expected answer:** `"Beta"`. Plain objects coerce non-string keys to strings. Both `a` and `b` convert to `"[object Object]"`, so `map[b] = "Beta"` overwrites the entry set by `map[a]`. Reading `map[a]` then returns `"Beta"`.

---

### 3. Implement It

**Question:** Implement `intersection(nums1, nums2)` that returns an array of **unique** numbers present in both arrays. Must run in O(n + m) time where n and m are the lengths of the two arrays.

**Expected answer:**
```js
function intersection(nums1, nums2) {
  const set1 = new Set(nums1);  // O(n) to build
  const result = new Set();

  for (const num of nums2) {    // O(m) to scan
    if (set1.has(num)) {        // O(1) per check
      result.add(num);          // add() ignores duplicates automatically
    }
  }

  return [...result];
}

// intersection([1, 2, 2, 3], [2, 3, 4])  ->  [2, 3]
```

---

### 4. Debug a Bug

**Question:** A word counter crashes when given the word `"toString"`. Reproduce and fix the bug.

**Expected answer:**
```js
// Buggy version — uses a plain object as a counter:
const counts = {};
counts["toString"] = (counts["toString"] || 0) + 1;
// counts["toString"] starts as the built-in function [Function: toString],
// not undefined. The || 0 does not help because the function is truthy.
// Result: "[Function: toString]" + 1 = "[Function: toString]1" — wrong!

// Fix 1 — Map (cleanest):
const counts = new Map();
counts.set("toString", (counts.get("toString") || 0) + 1); // 1 — correct

// Fix 2 — prototype-free object:
const counts = Object.create(null);
counts["toString"] = (counts["toString"] || 0) + 1; // undefined || 0 = 0, then + 1 = 1 — correct
```

---

### 5. Design and Trade-off

**Question:** When would you use a `Set` instead of an Array to store user IDs?

**Expected answer:** Use a `Set` when you frequently need to check whether an ID already exists. `set.has(id)` is O(1); `arr.includes(id)` is O(n). A `Set` also prevents duplicate IDs automatically. Use an Array when you need the IDs in a specific order or need to access them by position.

---

### 6. Senior Follow-up — Node.js Server

**Question:** A developer uses an array as a task queue: `queue.push()` to add tasks and `queue.shift()` to dequeue them. At 50 000 tasks the Node.js server starts lagging badly. Why? How do you fix it?

**Expected answer:** `queue.shift()` is O(n). Every time a task is dequeued, all remaining tasks must slide one position forward. Calling it 50 000 times produces roughly 1.25 billion memory copy operations in total. Because Node.js runs JavaScript on a **single thread**, this blocks the event loop and prevents it from handling incoming requests.

Two fixes:
1. **Head pointer** — instead of shifting, keep a `head` index and increment it: `queue[head++]`. No copying happens at all. Memory for old slots is wasted but all operations are O(1).
2. **Linked list queue** — a proper queue backed by a linked list gives true O(1) enqueue and dequeue with no wasted space. See [DSA Day 19 – Queue and Deque](day-19-queue-circular-queue-and-deque.md) for the full implementation.

---

<nav aria-label="Lecture navigation">

[← Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Day 03: Strings and Text Patterns →](day-03-strings-and-text-patterns.md)

</nav>
