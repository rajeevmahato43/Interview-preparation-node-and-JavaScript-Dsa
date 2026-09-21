# Day 05: Sorting and Searching Basics

<nav aria-label="Lecture navigation">

[← Day 04: Recursion and Call Stack](day-04-recursion-and-call-stack.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Day 06: Frequency Counting and Hash Tables →](day-06-frequency-counting-and-hash-tables.md)

</nav>

---

## What You Will Learn Today

- The difference between linear search (slow) and binary search (fast) — and when you can use each.
- Why JavaScript's default `sort()` produces wrong results for numbers and how to fix it.
- Why sorting mutates the original array and how to avoid that side-effect.
- What a **stable sort** means and why it matters.
- How Merge Sort works internally (divide-and-conquer).
- When to sort in Node.js vs let the database sort.

---

## Prerequisites

- [DSA Day 01 – Big O and Problem Solving](day-01-big-o-and-problem-solving.md)
- [DSA Day 04 – Recursion and Call Stack](day-04-recursion-and-call-stack.md) — Merge Sort uses recursion.

---

## Quick Vocabulary

| Word | Plain meaning |
| :--- | :--- |
| **Linear search** | Check every item one by one from the start until you find what you need. |
| **Binary search** | On a sorted list, check the middle item — if too high, discard the right half; if too low, discard the left half. Repeat. |
| **Comparator** | A function you pass to `sort()` that tells it how to order two items. |
| **Mutate** | Change the original data in place rather than making a copy. |
| **Stable sort** | A sort that preserves the original relative order of items that have the same sort key. |
| **Divide-and-conquer** | Break a problem into two halves, solve each half, then combine the results. |

---

## 1. Searching — Linear vs Binary

### Linear Search

Scan every item from left to right. No requirements on the data — works on any array.

```js
// Works on any array — sorted or not
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1; // not found
}
```

**Time:** O(n) — must look at every item in the worst case.

### Binary Search

Cut the search space in half every step. **Requires the array to be sorted first.**

```
Sorted array: [1, 3, 5, 7, 9, 11, 13]
Looking for: 7

Step 1: Middle = index 3 = 7. Found! Return 3.

Looking for: 9
Step 1: Middle = index 3 = 7. 9 > 7 → search right half [9, 11, 13]
Step 2: Middle = index 5 = 11. 9 < 11 → search left [9]
Step 3: Middle = index 4 = 9. Found! Return 4.
```

**Time:** O(log n) — each step halves the remaining items. For 1 million items, binary search takes at most 20 steps.

> [!NOTE]
> Never sort an array just to do a single search. Sorting costs O(n log n) — that is *more* work than a plain O(n) linear scan. Only sort if you will search the same array many times.

---

## 2. JavaScript `sort()` — Two Traps Every Developer Must Know

### Trap 1: Numbers Are Sorted Alphabetically by Default

Without a comparator, JavaScript converts numbers to **strings** and sorts them alphabetically. Alphabetically `"10"` comes before `"2"` because `"1"` < `"2"` at the first character.

```js
const nums = [10, 2, 5, 1, 20];
nums.sort();
console.log(nums); // [1, 10, 2, 20, 5]  — wrong!
```

**Fix — pass a comparator function:**
```js
nums.sort((a, b) => a - b); // ascending:  [1, 2, 5, 10, 20]
nums.sort((a, b) => b - a); // descending: [20, 10, 5, 2, 1]
```

How the comparator works:
- If `a - b` is **negative** → `a` comes before `b`.
- If `a - b` is **positive** → `b` comes before `a`.
- If `a - b` is **zero** → order is unchanged.

### Trap 2: `sort()` Changes the Original Array

`.sort()` sorts **in place** — it modifies the array it is called on. If other parts of your code hold a reference to the same array, they see the sorted order too.

```js
const original = [3, 1, 2];
const sorted = original.sort((a, b) => a - b);

console.log(original); // [1, 2, 3]  — original was changed!
console.log(sorted === original); // true — same array
```

**Fix — sort a copy:**
```js
// Modern (ES2023+):
const sorted = original.toSorted((a, b) => a - b); // returns a new array

// Universal:
const sorted = original.slice().sort((a, b) => a - b);
```

---

## 3. Stable Sort — What It Means and Why It Matters

A sort is **stable** if items that compare as equal keep their original relative order.

**Example:** sort a list of students by score. Two students both have a score of 90.

```
Before sort: [ { name: "Alice", score: 90 }, { name: "Bob", score: 90 }, { name: "Carol", score: 80 } ]

Stable sort result:   [ Carol(80), Alice(90), Bob(90) ]  ← Alice still before Bob
Unstable sort result: [ Carol(80), Bob(90), Alice(90) ]  ← order flipped!
```

Since ECMAScript 2019, JavaScript's built-in `sort()` is **guaranteed stable** across all environments. It uses TimSort internally in V8.

Stability matters when you sort by one field and the rows are already ordered by another field — a stable sort preserves the secondary order automatically.

---

## 4. Merge Sort — How It Works

Merge Sort is the classic O(n log n) divide-and-conquer sort. It works in three steps:

1. **Divide** — split the array in half.
2. **Recurse** — sort each half.
3. **Merge** — combine the two sorted halves into one sorted array.

```
[38, 27, 43, 3]
     Split
[38, 27]  [43, 3]
  Split      Split
[38] [27]  [43] [3]
  Merge       Merge
 [27, 38]  [3, 43]
       Merge
  [3, 27, 38, 43]
```

```js
// JavaScript
function mergeSort(arr) {
  if (arr.length <= 1) return arr; // base case — nothing to sort

  const mid = Math.floor(arr.length / 2);
  const left  = mergeSort(arr.slice(0, mid)); // sort left half
  const right = mergeSort(arr.slice(mid));    // sort right half

  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;

  // Pick the smaller head from each side
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else                     result.push(right[j++]);
  }

  // One side ran out — append whatever is left in the other
  return result.concat(left.slice(i)).concat(right.slice(j));
}
```

**Time:** O(n log n) in all cases — even on already-sorted data.  
**Space:** O(n) — the `result` arrays for each merge step.

---

## 5. Sorting in Node.js vs in the Database

| Situation | Where to sort | Why |
| :--- | :--- | :--- |
| Small dataset (<500 items) already in memory | Node.js `sort()` | Simple; no round-trip needed |
| Large dataset (>1000 rows) from a database | Database `ORDER BY` | Uses an index — returns only the rows you need; no network transfer of all rows |
| Paginated API (`/comments?page=2`) | Database `ORDER BY` + `LIMIT` | The database skips directly to the page; Node.js would load all rows first |

> **Rule of thumb:** If the data lives in a database and the user will only see a slice of it, sort and slice in the database. Sorting in Node.js means transferring all rows over the network first.

---

## Worked Examples

### Example 1 — Binary Search

```js
// JavaScript (Node.js / browser)
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    // Use this formula to avoid overflow with very large indices
    const mid = left + Math.floor((right - left) / 2);

    if (arr[mid] === target) return mid;        // found
    if (arr[mid] < target)   left = mid + 1;   // target is in the right half
    else                     right = mid - 1;  // target is in the left half
  }

  return -1; // not found
}

console.log(binarySearch([1, 3, 5, 7, 9], 7)); // 3
console.log(binarySearch([1, 3, 5, 7, 9], 4)); // -1
```

**Complexity:** O(log n) time, O(1) space.

#### Why `left + Math.floor((right - left) / 2)` instead of `(left + right) / 2`?

If `left` and `right` are both very large numbers, `left + right` can overflow a 32-bit integer. `(right - left)` is always the smaller number — safer.

---

### Example 2 — Search Insert Position

**Problem:** Given a sorted array of distinct integers and a target, return the index of the target if found. If not found, return the index where it *should* be inserted to keep the array sorted.

```js
// JavaScript
function searchInsert(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (nums[mid] === target) return mid;
    if (nums[mid] < target)   left = mid + 1;
    else                      right = mid - 1;
  }

  return left; // when the loop ends, left is the correct insertion position
}

// searchInsert([1, 3, 5, 6], 5) → 2  (found at index 2)
// searchInsert([1, 3, 5, 6], 2) → 1  (should go between index 0 and 1)
// searchInsert([1, 3, 5, 6], 7) → 4  (goes at the end)
```

**Why does `left` point to the insertion index?** When the loop ends without finding the target, `left` has moved past `right`. At that point `left` is exactly the first position where the target would be larger than all items to its left.

---

## Common Mistakes

### 1. Missing comparator for numbers

```js
[25, 8, 41, 100].sort();         // [100, 25, 41, 8] — alphabetical, wrong
[25, 8, 41, 100].sort((a,b) => a - b); // [8, 25, 41, 100] — correct
```

### 2. Off-by-one in binary search

```js
while (left < right)  // WRONG — misses the case when left === right
while (left <= right) // CORRECT — checks the final single-element window
```

### 3. Sorting a shared array

```js
// Shared reference — other code sees the sorted order too
sharedList.sort((a, b) => a - b);

// Safe — sort a copy
sharedList.slice().sort((a, b) => a - b);
// or in ES2023:
sharedList.toSorted((a, b) => a - b);
```

---

## Tricky Points

### Sorting strings with accents

Standard alphabetical comparisons put accented letters like `'é'` or `'ñ'` after `'z'`, which is wrong for most human alphabets. Use `localeCompare`:

```js
const words = ["éclair", "apple", "zebra"];
words.sort((a, b) => a.localeCompare(b));
// ["apple", "éclair", "zebra"]  — 'é' correctly sorted with 'e'
```

### `sort()` comparator must be consistent

If your comparator ever returns a positive number for `(a, b)` and a negative for `(b, a)` for the same pair, the sort result is undefined (different browsers may produce different orders). Always use a pure mathematical comparator.

---

## Practical Exercise

Implement `firstBadVersion(n, isBad)` — given `n` versions numbered 1 to n, and a function `isBad(version)` that returns `true` for a bad version, find the **first** bad version using binary search. Versions are sequential: once a version is bad, all later versions are also bad.

**Example:**
```
n = 5,  versions 1–4 are good, version 5 is bad
isBad(3) = false, isBad(5) = true
Output: 5
```

**Constraints:**
- Must run in O(log n) time — do not scan linearly.
- Minimise calls to `isBad` — each call is expensive.
- Handle the edge case where version 1 is already bad.

---

## Summary

- **Linear search:** O(n), no sorting required. Use for unsorted data or one-off lookups.
- **Binary search:** O(log n), works only on sorted data. Use when you search the same array many times.
- **JavaScript `sort()`** sorts alphabetically by default — always pass `(a, b) => a - b` for numbers.
- **`sort()` mutates** the original array — use `.toSorted()` or `.slice().sort()` to keep a clean copy.
- **Stable sort** preserves original order for equal items. JavaScript's built-in sort is guaranteed stable since ES2019.
- **Merge Sort** is the reliable O(n log n) algorithm — predictable time on all inputs, stable, implemented with divide-and-conquer.
- For large datasets in a database, sort there using `ORDER BY` — do not transfer all rows to Node.js first.

---

## Cheat Sheet

### Algorithm Complexity

| Algorithm | Best | Average | Worst | Space | Stable? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Linear Search | O(1) | O(n) | O(n) | O(1) | N/A |
| Binary Search | O(1) | O(log n) | O(log n) | O(1) | N/A |
| JS built-in sort (TimSort) | O(n) | O(n log n) | O(n log n) | O(n) | Yes |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | No |

### Common Comparators
```js
// Numbers ascending
arr.sort((a, b) => a - b);

// Numbers descending
arr.sort((a, b) => b - a);

// Strings (locale-aware)
arr.sort((a, b) => a.localeCompare(b));

// Objects by a property
arr.sort((a, b) => a.price - b.price);

// Dates
arr.sort((a, b) => a.getTime() - b.getTime());
```

### Binary Search Template
```js
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (arr[mid] === target) return mid;
    if (arr[mid] < target)   left  = mid + 1;
    else                     right = mid - 1;
  }

  return -1; // or return left for insertion index
}
```

---

## Interview Questions

### 1. Concept Check

**Question:** What does it mean for a sorting algorithm to be stable? Give an example where stability matters.

**Expected answer:** Stable means items with equal sort keys stay in their original relative order. Example: a list of transactions is already sorted by date. Sorting by amount with a stable sort keeps chronological order among same-amount transactions. An unstable sort would scramble that secondary order.

---

### 2. Predict the Output

**Question:** What does this print?
```js
const items = [100, 20, 5];
items.sort();
console.log(items);
```

**Expected answer:** `[100, 20, 5]`. Without a comparator, `sort()` converts numbers to strings: `"100"`, `"20"`, `"5"`. Alphabetically `"1"` < `"2"` < `"5"`, so the order becomes `[100, 20, 5]`. (The original order happens to be preserved here, but for a different reason than numerical order.)

---

### 3. Implement It

**Question:** Implement `searchInsert(nums, target)` using binary search.

**Expected answer:** Covered in Example 2 above. Key point: when the while loop exits without finding the target, `left` is the correct insertion index.

---

### 4. Debug a Bug

**Question:** An API caches a product list. One endpoint sorts products by price and suddenly all other endpoints return products in price order. What went wrong?

**Expected answer:** `Array.prototype.sort()` mutates the array in place. The endpoint sorted the shared cached array. Fix: sort a copy — `productCache.slice().sort((a, b) => a.price - b.price)` or use `productCache.toSorted(...)`.

---

### 5. Design and Trade-off

**Question:** An API serves paginated comments for a post — 100 000 comments total, 20 per page. Should sorting happen in Node.js or in PostgreSQL?

**Expected answer:** Sort in PostgreSQL using `ORDER BY created_at LIMIT 20 OFFSET 0`. Reasons: (1) PostgreSQL uses an index — it jumps directly to the first 20 rows in O(log n). (2) Node.js would need to load all 100 000 rows over the network, allocate them in memory, sort O(n log n), then discard all but 20. That wastes network bandwidth, RAM, and CPU on the single-threaded event loop.

---

### 6. Senior Follow-up — External Sort

**Question:** How would you sort a 10 GB log file on a Node.js server that has only 1 GB of RAM?

**Expected answer:** Use **External Merge Sort** — a two-phase approach:

1. **Phase 1 — Create sorted chunks:** Read the file in 200 MB streaming chunks. Sort each chunk in memory using `arr.sort()` and write it to a temporary file on disk. This produces ~50 sorted temp files.
2. **Phase 2 — K-way merge:** Open a read stream to each temp file. Use a **Min-Heap** (see Day 41) to always pick the smallest item from the front of all streams. Write the merged output directly to the final file.

Memory used: O(k) at any moment — just one item per chunk in the heap. The heap has at most ~50 items.

---

<nav aria-label="Lecture navigation">

[← Day 04: Recursion and Call Stack](day-04-recursion-and-call-stack.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Day 06: Frequency Counting and Hash Tables →](day-06-frequency-counting-and-hash-tables.md)

</nav>
