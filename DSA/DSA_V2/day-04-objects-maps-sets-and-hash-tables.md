# Day 04: Objects, Maps, Sets & Hash Tables

<nav aria-label="Lecture navigation">

[Previous: Searching & Elementary Sorting](day-03-searching-and-sorting-algorithms.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Hash Patterns: Frequency & Duplicates](day-05-hash-patterns-frequency-counting-and-duplicates.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Asymptotic complexity ($O(1)$ vs $O(n)$).
- Basic JavaScript object and array syntax.

---

## 1. What is a Hash Table?

A **Hash Table** is a data structure that stores key-value pairs and allows lookups, insertions, and deletions in **$O(1)$ average time**.

> **Hash Function**: A formula that converts any key (like `"apple"`) into an integer index where the value is stored in memory.

```text
Key: "apple" ──► Hash Function ──► Index 4 ──► Memory Bucket [ "apple", $1.50 ]
Key: "banana" ──► Hash Function ──► Index 9 ──► Memory Bucket [ "banana", $0.80 ]
```

### What is a Hash Collision?
A **collision** happens when two different keys produce the exact same index.
- Hash tables handle this by storing a small linked list or array in that bucket (**Separate Chaining**).
- When designed properly, lookups remain **$O(1)$ average time**.

---

## 2. `Map` vs Plain `Object` vs `Set`

In JavaScript, you have three ways to store key collections:

| Feature | `Map` | Plain `Object` (`{}`) | `Set` |
| :--- | :--- | :--- | :--- |
| **What it stores** | Key $\to$ Value | Key $\to$ Value | Unique Values only |
| **Allowed Keys** | **Any type** (objects, numbers) | Strings & Symbols only | Values only |
| **Lookup syntax** | `map.get(key)` / `map.has(key)` | `obj[key]` | `set.has(val)` |
| **Size check** | `map.size` ($O(1)$) | `Object.keys(obj).length` ($O(n)$) | `set.size` ($O(1)$) |
| **Key ordering** | Insertion order guaranteed | Arbitrary / numerical | Insertion order |
| **Best used for** | Frequent add/delete, non-string keys | Fixed data records | Tracking unique seen items |

```javascript
// Map accepts any key type
const map = new Map();
const objKey = { id: 1 };
map.set(objKey, "User metadata");
console.log(map.get(objKey)); // "User metadata"

// Set stores only unique values
const set = new Set([1, 2, 2, 3]);
console.log(set.size); // 3 (duplicate 2 is ignored)
```

---

## 3. The Classic Problem: Two Sum (Hash Map Complement)

Given an unsorted array `nums` and a `target`, find indices of two numbers that add up to `target`.

### The Naive Way ($O(n^2)$)
Check every pair using nested loops.

### The Optimized Hash Map Way ($O(n)$)
As we walk through the array, calculate the needed complement:
$$\text{complement} = \text{target} - \text{current}$$
If the complement is already in our map, we are done! Otherwise, save the current number and its index.

```javascript
// Node.js code: Optimal Two Sum
function twoSum(nums, target) {
  const seen = new Map(); // Stores: number -> index

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];

    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }

    seen.set(nums[i], i);
  }

  return [];
}

console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]
console.log(twoSum([3, 2, 4], 6));       // [1, 2]
```
- **Time Complexity:** $O(n)$ — Single loop, each lookup is $O(1)$.
- **Extra Space:** $O(n)$ — Map stores up to $n$ elements.

---

## 4. Problem 2: Contains Duplicate

Return `true` if any value appears at least twice in the array.

```javascript
// Node.js code
function containsDuplicate(nums) {
  const seen = new Set();

  for (const num of nums) {
    if (seen.has(num)) return true;
    seen.add(num);
  }

  return false;
}

console.log(containsDuplicate([1, 2, 3, 1])); // true
console.log(containsDuplicate([1, 2, 3, 4])); // false
```
- **Time Complexity:** $O(n)$ — Single pass.
- **Extra Space:** $O(n)$ — Set stores unique elements.

---

## 5. Tricky Points and Common Traps

1. **Object prototype pollution:** Plain objects inherit properties like `toString`. Checking `obj["toString"]` returns a function, not `undefined`! Use `new Map()` or `Object.hasOwn(obj, key)`.
2. **Object keys convert to strings:**
   ```javascript
   const obj = {};
   obj[{ a: 1 }] = "first";
   obj[{ b: 2 }] = "second";
   console.log(obj); // { "[object Object]": "second" } (Overwritten!)
   // Use Map when keys are objects!
   ```
3. **Iterating `Map` keys/values:**
   ```javascript
   for (const [key, val] of map) { ... }
   ```

---

## 6. Hands-On Exercises

Run this script in Node.js to verify Two Sum and Set deduplication:

```javascript
// Node.js code
const assert = require("node:assert");

function testTwoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff), i];
    map.set(nums[i], i);
  }
  return [];
}

assert.deepEqual(testTwoSum([2, 7, 11, 15], 9), [0, 1]);
assert.deepEqual(testTwoSum([3, 3], 6), [0, 1]);

console.log("✅ Two sum assertions passed!");
```

---

## 7. Summary

- **Hash Tables** give $O(1)$ average lookups, insertions, and deletions.
- **`Map`** is built for key-value lookups with any key types and $O(1)$ `.size`.
- **`Set`** stores unique elements and eliminates duplicates in $O(n)$ time.
- **Two Sum** trades $O(n)$ extra memory to reduce time from $O(n^2)$ down to $O(n)$.

---

## 8. Cheat Sheet

| Operation | `Map` | Plain `Object` | `Set` |
| :--- | :---: | :---: | :---: |
| Insert / Add | `map.set(k, v)` | `obj[k] = v` | `set.add(v)` |
| Lookup / Check | `map.get(k)` / `map.has(k)` | `obj[k]` | `set.has(v)` |
| Delete | `map.delete(k)` | `delete obj[k]` | `set.delete(v)` |
| Size | `map.size` ($O(1)$) | `Object.keys(obj).length` ($O(n)$) | `set.size` ($O(1)$) |
| Time Complexity | **$O(1)$ average** | **$O(1)$ average** | **$O(1)$ average** |

---

## 9. Interview Q&A

### 45-Second Explanation
> *"A Hash Map stores key-value pairs and provides $O(1)$ average lookups using an internal hash function. For Two Sum on an unsorted array, we maintain a Map of seen values and their indices. As we iterate through the array, we check if the complement (target minus current value) is already in the map. This achieves an optimal $O(n)$ runtime in a single pass while using $O(n)$ auxiliary space."*

### Questions & Answers
1. **Why is `new Map()` preferred over `{}` for dynamic caches?**
   `Map` avoids prototype collisions, supports non-string keys, tracks size in $O(1)$, and performs better with frequent additions and deletions.
2. **What causes a Hash Map lookup to degrade from $O(1)$ to $O(n)$?**
   Hash collisions. If a poor hash function places all keys into the same bucket, the bucket degenerates into a linear list requiring $O(n)$ steps to search.

---

## 10. Practice Problems

### 1. Two Sum - Easy
Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice.
- **Input:** `nums = [2,7,11,15]`, `target = 9`
- **Expected Output:** `[0,1]`
- **Input:** `nums = [3,2,4]`, `target = 6`
- **Expected Output:** `[1,2]`
- **Input:** `nums = [3,3]`, `target = 6`
- **Expected Output:** `[0,1]`

### 2. Contains Duplicate - Easy
Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.
- **Input:** `nums = [1,2,3,1]`
- **Expected Output:** `true`
- **Input:** `nums = [1,2,3,4]`
- **Expected Output:** `false`
- **Input:** `nums = [1,1,1,3,3,4,3,2,4,2]`
- **Expected Output:** `true`

### 3. Intersection of Two Arrays - Easy
Given two integer arrays `nums1` and `nums2`, return an array of their intersection. Each element in the result must be unique and you may return the result in any order.
- **Input:** `nums1 = [1,2,2,1]`, `nums2 = [2,2]`
- **Expected Output:** `[2]`
- **Input:** `nums1 = [4,9,5]`, `nums2 = [9,4,9,8,4]`
- **Expected Output:** `[4,9]`

---

<nav aria-label="Lecture navigation">

[Previous: Searching & Elementary Sorting](day-03-searching-and-sorting-algorithms.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Hash Patterns: Frequency & Duplicates](day-05-hash-patterns-frequency-counting-and-duplicates.md)

</nav>
