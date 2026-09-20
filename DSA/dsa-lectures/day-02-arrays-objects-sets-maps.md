# Day 02: Arrays, Objects, Sets, and Maps

<nav aria-label="Lecture navigation">

[Previous: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Strings and Text Patterns](day-03-strings-and-text-patterns.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Choose between an Array, Object, `Map`, and `Set` based on lookups, order, and uniqueness.
- Explain why `arr[i]` is $O(1)$ while `arr.shift()` is $O(n)$.
- Identify the key differences between plain objects and `Map` (keys, prototype safety, size).
- Use `Set` to remove duplicates and check membership in $O(1)$ average time.
- Implement the classic **Two Sum** pattern in $O(n)$ time using a `Map`.
- Avoid common JavaScript prototype traps like `constructor` and `toString`.

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md)
- Basic familiarity with JavaScript array and object syntax.

---

## Core Concepts

### 1. Arrays: Ordered Lists with Index Access

Arrays store ordered sequences of values.

```js
const fruits = ["apple", "banana", "cherry"];
console.log(fruits[0]); // "apple" - Instant O(1) index access
```

- **Reading by index (`arr[i]`)**: $O(1)$ constant time.
- **Adding/removing at the end (`push` / `pop`)**: $O(1)$ amortized time.
- **Adding/removing at the front (`unshift` / `shift`)**: **$O(n)$ linear time**!

```text
Tail Operation (push/pop):
[ A | B | C ] ──> push(D) ──> [ A | B | C | D ]  (O(1) - Only writes to end)

Head Operation (shift/unshift):
[ A | B | C ] ──> shift() ──> [ B | C ]           (O(n) - Must re-index all remaining items!)
```

> [!NOTE]
> Never use `arr.shift()` inside a loop over a large array. It turns a simple loop into an accidental $O(n^2)$ performance trap.

---

### 2. Objects vs Maps: Key-Value Lookups

Both objects and maps store key-value pairs, but they behave differently:

| Feature | Plain Object `{}` | `Map` |
| :--- | :--- | :--- |
| **Allowed Keys** | Strings and Symbols only | **Any type** (objects, numbers, booleans) |
| **Inherited Keys** | Inherits `Object.prototype` (`toString`, etc.) | **None** (pure dictionary) |
| **Size** | Manual: `Object.keys(obj).length` ($O(k)$) | Built-in: `map.size` ($O(1)$) |
| **Key Order** | Integer keys sorted first, then insertion | **Strict insertion order** for all keys |

#### The Object Prototype Trap:
```js
const counts = {};
console.log(counts["toString"]); // [Function: toString]! (Inherited from prototype!)

// A safe dictionary has no prototype:
const safeCounts = Object.create(null); // No prototype properties exist!
```

---

### 3. `Set`: The Tool for Uniqueness

A `Set` stores **unique values**. Adding a duplicate value is ignored.

```js
const numbers = new Set([1, 2, 2, 3, 1]);
console.log(numbers.size); // 3 (Only 1, 2, 3 remain)
console.log(numbers.has(2)); // true - O(1) average lookup
```

Deduplicating an array in one line:
```js
const unique = [...new Set(arr)]; // O(n) time and space
```

---

## Detailed Explanations

### When to Pick Each Data Structure

```text
Decision Flow:
1. Do you need an ordered sequence accessed by number index?
   └── YES ──> Array

2. Do you just need to check if something exists or remove duplicates?
   └── YES ──> Set

3. Do you need key-value pairs with non-string keys, frequent additions, or strict insertion order?
   └── YES ──> Map

4. Do you need a simple fixed config or JSON payload?
   └── YES ──> Plain Object
```

### Memory Footprint in Node.js

In Node.js backend services, storing thousands of dynamic keys in a plain object forces V8 into "Dictionary Mode", using more memory. A `Map` is specifically optimized for frequent additions and deletions and uses memory more predictably.

---

## Examples and Traces

### Example 1: Two Sum (Hash Map Lookup)

#### Problem:
Given an array `nums` and a number `target`, return the indices of the two numbers that add up to `target`.

#### Brute Force ($O(n^2)$ Time, $O(1)$ Space):
Check every pair with two nested loops.

#### Optimized with Map ($O(n)$ Time, $O(n)$ Space):
For each number, check if its complement (`target - num`) was already seen.
```js
function twoSum(nums, target) {
  const seen = new Map(); // value -> index

  for (let i = 0; i < nums.length; i++) {
    const current = nums[i];
    const complement = target - current;

    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }

    seen.set(current, i);
  }

  return [];
}
```

#### Trace for `nums = [2, 7, 11, 15], target = 9`:
- `i = 0`: `current = 2`, `complement = 7`. `seen` is empty. Store `2 => 0`.
- `i = 1`: `current = 7`, `complement = 2`. `seen.has(2)` is `true`! Return `[seen.get(2), 1]` $\to$ `[0, 1]`.
- Solved in one pass!

---

### Example 2: First Unique Element

Find the first element that appears only once in an array:
```js
function firstUnique(nums) {
  const freq = new Map();

  // Pass 1: count frequencies
  for (const num of nums) {
    freq.set(num, (freq.get(num) || 0) + 1);
  }

  // Pass 2: find first item with count === 1
  for (const num of nums) {
    if (freq.get(num) === 1) return num;
  }

  return null;
}
```
- **Complexity**: $O(n)$ time (two linear passes), $O(n)$ space for the map.

---

## Common Mistakes and Interview Traps

1. **Object Keys Are Always Strings**: In `{ [1]: "a" }`, the key is string `"1"`. Storing `{ id: 1 }` as an object key coerces to `"[object Object]"`. Use `Map` for non-string keys.
2. **Spread Inside Loop**: Writing `if ([...set].includes(x))` converts the set to an array on every check ($O(n)$). Always use `set.has(x)` ($O(1)$).
3. **Modifying Array with `splice` During Loop**: Calling `arr.splice(i, 1)` shifts elements and changes index positions, skipping the next item unless managed carefully.

---

## Tricky Points

- **Reference Equality in Set/Map**: Objects and arrays are compared by memory address, not content:
  ```js
  const set = new Set();
  set.add([1, 2]);
  set.add([1, 2]);
  console.log(set.size); // 2! (Different array instances in memory)
  ```

---

## Practical Exercise

Write a function `countWords(sentence)` that takes a string and returns a `Map` of each word and how many times it appears. Ignore case (`"The"` and `"the"` should be counted together).

---

## Summary

- **Arrays** offer instant $O(1)$ index access and fast tail operations, but slow $O(n)$ front operations (`shift`).
- **Objects** work well for simple records, but coerce keys to strings and inherit prototype properties.
- **`Map`** supports any key type, maintains insertion order, and provides an $O(1)$ `.size`.
- **`Set`** stores unique values with $O(1)$ membership checks (`.has`).
- Use hash lookups to reduce $O(n^2)$ pair problems to $O(n)$ single-pass solutions.

---

## Cheat Sheet

| Structure | Best For | Lookup | Insert | Delete |
| :--- | :--- | :--- | :--- | :--- |
| **Array** | Ordered items, index access | By Index: $O(1)$ | End: $O(1)$ am., Front: $O(n)$ | End: $O(1)$, Front: $O(n)$ |
| **Object** | Simple string-keyed records | By Key: $O(1)$ avg | $O(1)$ avg | $O(1)$ avg |
| **Map** | Dynamic key-value pairs | By Key: $O(1)$ avg | $O(1)$ avg (`.set`) | $O(1)$ avg (`.delete`) |
| **Set** | Uniqueness, membership checks | Membership: $O(1)$ avg | $O(1)$ avg (`.add`) | $O(1)$ avg (`.delete`) |

---

## Interview Questions

### 1. Deep Definitions and Mental Models

**Question:** What are three practical differences between a JavaScript plain object and a `Map`?
- **Expected answer shape:** (1) Keys: objects coerce keys to strings/symbols, while `Map` allows any type (including objects). (2) Prototype: objects inherit from `Object.prototype`, risking property collisions; `Map` is a clean dictionary. (3) Size: `Map` has an instant $O(1)$ `.size` property, while objects require $O(k)$ `Object.keys(obj).length`.

### 2. Predict the Output and Trace Execution

**Question:** What does this output, and why?
```js
const map = {};
const a = { id: 1 };
const b = { id: 2 };
map[a] = "Alpha";
map[b] = "Beta";
console.log(map[a]);
```
- **Expected answer shape:** `"Beta"`. Plain objects coerce non-string keys to strings. Both `a` and `b` coerce to `"[object Object]"`, so `map[b]` overwrites `map[a]`.

### 3. Implementation Exercise

**Question:** Implement `intersection(nums1, nums2)` returning an array of unique numbers present in both arrays. Must run in $O(n + m)$ time.
- **Expected answer shape:**
```js
function intersection(nums1, nums2) {
  const set1 = new Set(nums1);
  const result = new Set();
  for (const num of nums2) {
    if (set1.has(num)) result.add(num);
  }
  return [...result];
}
```

### 4. Debugging and Failure Analysis

**Question:** A word counter crashes when given the word `"toString"`. Why did this happen, and how do you fix it?
- **Expected answer shape:** The counter used a plain object `counts = {}`. `counts["toString"]` exists on `Object.prototype` as a function. Doing `(counts["toString"] || 0) + 1` produces string concatenation `"[Function: toString]1"`. Fix by using `new Map()` or `Object.create(null)`.

### 5. Design and Tradeoff Questions

**Question:** When would you use a `Set` instead of an Array to store user IDs in an API?
- **Expected answer shape:** Use a `Set` when you frequently need to check if an ID exists (`set.has(id)` is $O(1)$ vs `arr.includes(id)` which is $O(n)$) or when you need to prevent duplicate IDs automatically.

### 6. Senior Follow-ups: Node.js Memory

**Question:** A developer uses an array as a task queue (`queue.push()` and `queue.shift()`). At 50,000 tasks, the Node.js server experiences high CPU latency. Why, and what is the fix?
- **Expected answer shape:** `queue.shift()` is an $O(n)$ operation. For 50,000 tasks, repeatedly shifting creates $O(n^2)$ memory copies, blocking the single-threaded event loop. Fix by using a pointer index (`head++`) or a linked list queue to achieve $O(1)$ dequeues.

<nav aria-label="Lecture navigation">

[Previous: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Strings and Text Patterns](day-03-strings-and-text-patterns.md)

</nav>
