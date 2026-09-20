# Day 05: Sorting and Searching Basics

<nav aria-label="Lecture navigation">

[Previous: Recursion and Call Stack](day-04-recursion-and-call-stack.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Frequency Counting and Hash Tables](day-06-frequency-counting-and-hash-tables.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Compare Linear Search ($O(n)$) and Binary Search ($O(\log n)$) on sorted data.
- Explain why JavaScript's default `arr.sort()` sorts alphabetically (`[10, 2]` becomes `[10, 2]`) and how to write a correct comparator.
- Avoid accidental array mutation when sorting using `toSorted()` or `.slice().sort()`.
- Define **stability** in sorting algorithms and explain why it matters.
- Implement **Merge Sort** from scratch using divide-and-conquer ($O(n \log n)$).
- Decide when to sort in Node.js server memory versus in the database using an index.

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md)
- [Day 04: Recursion and Call Stack](day-04-recursion-and-call-stack.md)

---

## Core Concepts

### 1. Searching: Linear vs Binary

```text
Linear Search (Unsorted):
Scans every element from left to right: [ 5, 2, 9, 1, 7 ]
Worst Case: O(n) Time.

Binary Search (Sorted Data Only):
Starts at the middle and cuts the remaining items in half each step!
[ 1, 2, 5, 7, 9 ]  --> Middle is 5 (Compare and discard half)
Worst Case: O(log n) Time.
```

> [!NOTE]
> Never sort an array just to search it once! Sorting takes $O(n \log n)$, which is slower than a simple $O(n)$ linear scan. Only sort if you will search multiple times.

---

### 2. The JavaScript `sort()` Traps

JavaScript's built-in `Array.prototype.sort()` has two traps every developer must know:

#### Trap 1: Alphabetical Sorting by Default
Without a comparator function, JavaScript converts numbers to **strings** before comparing them:
```js
const nums = [10, 2, 5, 1, 20];
nums.sort();
console.log(nums); // [1, 10, 2, 20, 5]! ('10' comes before '2' alphabetically!)
```

**The Fix: Pass a Numeric Comparator**:
```js
// Ascending:
nums.sort((a, b) => a - b); // [1, 2, 5, 10, 20]

// Descending:
nums.sort((a, b) => b - a); // [20, 10, 5, 2, 1]
```
- If `a - b < 0`: `a` comes first.
- If `a - b > 0`: `b` comes first.
- If `a - b === 0`: their relative order stays unchanged.

#### Trap 2: In-Place Mutation
`.sort()` modifies the original array in memory:
```js
const original = [3, 1, 2];
original.sort((a, b) => a - b);
console.log(original); // [1, 2, 3]! Original array was permanently changed!
```
To avoid side-effects, sort a copy:
```js
// Modern ES2023:
const sorted = original.toSorted((a, b) => a - b);

// Universal:
const sorted = original.slice().sort((a, b) => a - b);
```

---

### 3. What is a Stable Sort?

A sorting algorithm is **stable** if elements with identical keys stay in their original relative order.

```text
Input: [ { name: "Alice", score: 90 }, { name: "Bob", score: 90 } ]
Stable Sort by score keeps "Alice" before "Bob".
```

Since ECMAScript 2019, JavaScript's `sort()` is guaranteed to be **stable** (using TimSort internally in V8).

---

## Detailed Explanations

### In-Memory Node.js Sorting vs Database Sorting

- **Sort in the Database (`ORDER BY`)**: Best for large datasets ($> 1,000$ rows) and paginated APIs (`LIMIT 20`). The database uses B-Tree indexes to return ordered rows with almost zero CPU overhead.
- **Sort in Node.js**: Best for small datasets ($< 500$ items) already in memory, or when sorting requires complex JavaScript business logic.

---

## Examples and Traces

### Example 1: Binary Search ($O(\log n)$ Time, $O(1)$ Space)

```js
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }

  return -1; // Not found
}
```
- Uses `left + Math.floor((right - left) / 2)` to avoid integer overflow in large datasets.

---

### Example 2: Merge Sort ($O(n \log n)$ Time, $O(n)$ Space)

Merge Sort splits the array in half recursively, then merges the sorted halves:

```js
function mergeSort(arr) {
  if (!Array.isArray(arr) || arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }

  return result.concat(left.slice(i)).concat(right.slice(j));
}
```
- **Time Complexity**: $O(n \log n)$ in all cases.
- **Auxiliary Space**: $O(n)$ to store merged arrays.

---

## Common Mistakes and Interview Traps

1. **Missing Comparator on Numbers**: Calling `.sort()` on `[25, 8, 41]` sorts alphabetically into `[25, 41, 8]`. Always write `(a, b) => a - b`.
2. **Binary Search Off-by-One**: Writing `while (left < right)` misses the target when `left === right`. Use `while (left <= right)`.
3. **Sorting Mutates State**: In frontend frameworks (React) or shared Node.js caches, sorting an array directly can cause strange state mutation bugs. Use `.slice().sort()` or `.toSorted()`.

---

## Tricky Points

- **Sorting Strings with Accents**: Standard `a > b` puts accented letters like `'é'` after `'z'`. Use `a.localeCompare(b)` for international alphabet sorting:
  ```js
  words.sort((a, b) => a.localeCompare(b));
  ```

---

## Practical Exercise

Implement `searchInsert(nums, target)`: Given a sorted array of distinct integers and a target, return the index if found. If not found, return the index where it should be inserted in order.
- *Hint*: The `left` pointer in binary search automatically points to the insertion index when the loop terminates!

---

## Summary

- Default `arr.sort()` sorts **alphabetically**; use `(a, b) => a - b` for numbers.
- `.sort()` **mutates** the array in place; use `.toSorted()` or `.slice().sort()` to keep it pure.
- **Binary Search** finds elements in sorted arrays in $O(\log n)$ time with $O(1)$ space.
- **Merge Sort** delivers guaranteed $O(n \log n)$ time and stable sorting using divide-and-conquer.
- Prefer database index sorting over in-memory server sorting for large paginated datasets.

---

## Cheat Sheet

### Sorting Complexities
| Algorithm | Best | Average | Worst | Space | Stable? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TimSort (JS built-in)** | $O(n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ | Yes |
| **Merge Sort** | $O(n \log n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ | Yes |
| **Quick Sort** | $O(n \log n)$ | $O(n \log n)$ | $O(n^2)$ | $O(\log n)$ | No |
| **Binary Search (Search)** | $O(1)$ | $O(\log n)$ | $O(\log n)$ | $O(1)$ | N/A |

### Common Comparators
- Numbers: `(a, b) => a - b`
- Strings: `(a, b) => a.localeCompare(b)`
- Dates: `(a, b) => a.getTime() - b.getTime()`
- Object property: `(a, b) => a.price - b.price`

---

## Interview Questions

### 1. Deep Definitions and Mental Models

**Question:** What does it mean for a sorting algorithm to be "stable"? Give an example of when stability is needed.
- **Expected answer shape:** A sorting algorithm is stable if elements with identical keys maintain their original relative order in the output. For example, if transactions are already ordered chronologically, sorting them by amount with a stable sort preserves the chronological order of equal-amount transactions.

### 2. Predict the Output and Trace Execution

**Question:** What will this code output?
```js
const items = [100, 20, 5];
items.sort();
console.log(items);
```
- **Expected answer shape:** `[100, 20, 5]`. Without a comparator function, numbers are converted to strings: `"100"`, `"20"`, `"5"`. In alphabetical order, `"100"` comes first (starts with 1), then `"20"`, then `"5"`.

### 3. Implementation Exercise

**Question:** Implement `searchInsert(nums, target)` using binary search in $O(\log n)$ time.
- **Expected answer shape:**
```js
function searchInsert(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return left; // 'left' is the insertion index!
}
```

### 4. Debugging and Failure Analysis

**Question:** An API caches a list of products. One endpoint sorts products by price, and suddenly all other endpoints return products ordered by price. What happened?
- **Expected answer shape:** `Array.prototype.sort()` mutates the array in place. The endpoint mutated the shared cached array in memory. Fix by sorting a copy using `productCache.slice().sort((a, b) => a.price - b.price)` or `productCache.toSorted(...)`.

### 5. Design and Tradeoff Questions

**Question:** An API serves a paginated feed of 100,000 comments. Should you sort comments in Node.js memory or in PostgreSQL using `ORDER BY created_at`?
- **Expected answer shape:** Sort in the database using an index. PostgreSQL seeks directly to the first 20 rows in $O(\log k)$ time. Sorting in Node.js would require transferring all 100,000 rows over the network, allocating 100,000 objects in memory, and running $O(n \log n)$ sort on the single-threaded event loop.

### 6. Senior Follow-ups: Node.js Memory

**Question:** How would you sort a 10 GB file of log lines on a Node.js server that only has 1 GB of RAM?
- **Expected answer shape:** Use **External Merge Sort**: (1) Read the file in streams of ~200 MB chunks, sort each chunk in memory with `sort()`, and write each sorted chunk to a temporary file on disk. (2) Open read streams to all temporary files simultaneously and merge them using a Min-Heap ($K$-way merge) in a streaming fashion, writing the sorted output directly to disk with $O(1)$ memory usage.

<nav aria-label="Lecture navigation">

[Previous: Recursion and Call Stack](day-04-recursion-and-call-stack.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Frequency Counting and Hash Tables](day-06-frequency-counting-and-hash-tables.md)

</nav>
