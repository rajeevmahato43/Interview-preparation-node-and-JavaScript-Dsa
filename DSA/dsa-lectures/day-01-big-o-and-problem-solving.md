# Day 01: Big O Notation and Problem-Solving Mindset

<nav aria-label="Lecture navigation">

[Roadmap](../javascript-dsa-roadmap.md) | [Next: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain what Big O measures in plain, everyday language.
- Recognize the most common growth orders: $O(1)$, $O(\log n)$, $O(n)$, $O(n \log n)$, and $O(n^2)$.
- Calculate time complexity and auxiliary space complexity for JavaScript functions.
- Simplify Big O expressions by dropping constants and smaller terms.
- Understand why slow algorithms can block the Node.js event loop.
- Approach interview questions with a calm, step-by-step problem-solving mindset.

## Prerequisites

You only need basic JavaScript knowledge: variables, functions, `if/else` statements, loops (`for`, `while`), and simple math.

---

## Core Concepts

### 1. What Big O Actually Measures

When we run code, execution speed depends on the computer, CPU, and background tasks. Wall-clock time in milliseconds changes from run to run.

**Big O does not measure seconds.** It measures **how the work grows as the input size ($n$) grows**.

A simple mental model:
> If the amount of data doubles, does the work stay the same, double, or explode?

```text
Operations
    ^
    |          / O(n^2) - Quadratic (Slows down quickly with large input)
    |         /
    |        /    / O(n) - Linear (Grows 1:1 with input)
    |       /    /
    |      /    /    / O(log n) - Logarithmic (Grows very slowly)
    |     /    /    /
    |    /    /    /___________ O(1) - Constant (Always same work)
    +----------------------------------------> Input Size (n)
```

### 2. Common Growth Rates

Here are the 5 rates you will see in almost every interview:

1. **$O(1)$ Constant Time**: Work stays the same no matter how big the input is.
   - Example: Reading `arr[0]` or checking `map.has(key)`.
2. **$O(\log n)$ Logarithmic Time**: Each step cuts the remaining data in half.
   - Example: Binary search in a sorted array (1,000 items takes only ~10 steps).
3. **$O(n)$ Linear Time**: Work scales directly with input size.
   - Example: A single loop reading every element in an array.
4. **$O(n \log n)$ Linearithmic Time**: Standard for efficient sorting algorithms.
   - Example: `Array.prototype.sort()` (TimSort) and Merge Sort.
5. **$O(n^2)$ Quadratic Time**: Nested loops over the same data.
   - Example: Comparing every item against every other item. For 10,000 items, this does 100,000,000 checks!

### 3. Simplifying Big O

To find the Big O of code, use two simple rules:

- **Rule 1: Drop constants.** $O(2n) \to O(n)$. An algorithm doing $2n$ steps still grows linearly.
- **Rule 2: Drop smaller terms.** $O(n^2 + 3n + 5) \to O(n^2)$. As $n$ grows large, $n^2$ dominates everything else.

### 4. Time Complexity vs Space Complexity

- **Time Complexity**: How many operations the algorithm runs as $n$ grows.
- **Auxiliary Space Complexity**: How much **extra memory** the algorithm allocates beyond the input itself.
  - Creating a new array of size $n$ takes $O(n)$ extra space.
  - Using a couple of index numbers takes $O(1)$ extra space.
  - Active recursive calls also take space on the **call stack**.

---

## Detailed Explanations

### 1. The 3 Notations: Worst, Best, and Average

- **Big O ($O$)**: The worst-case upper bound ("it will never be worse than this").
- **Big Omega ($\Omega$)**: The best-case lower bound ("it will be at least this fast").
- **Big Theta ($\Theta$)**: The exact tight bound when best and worst cases match.

In interviews, always discuss **worst-case Big O** first. Production systems must survive bad inputs, not just lucky ones.

### 2. Why Big O Matters in Node.js

Node.js runs JavaScript on a **single main thread (the event loop)**.

If your server runs an $O(n^2)$ loop over an incoming request with 50,000 records:
- The single thread freezes for several seconds doing math.
- Incoming HTTP requests from other users cannot be handled.
- Health checks fail, leading to timeouts or server restarts.

Keeping algorithms $O(n)$ or $O(n \log n)$ ensures your backend stays responsive.

---

## Examples and Traces

### Example 1: Comparing Linear Search ($O(n)$) and Binary Search ($O(\log n)$)

Suppose we want to find a number in a list of $n$ elements.

#### Linear Search (Unsorted Data):
```js
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}
```
- **Worst case**: Item is at the very end or missing. Checks all $n$ items $\to O(n)$ time, $O(1)$ space.

#### Binary Search (Sorted Data Only):
```js
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
```
- **Trace for 16 items**: Checks index 8, then 12, then 14, then 15. Only 4 steps ($\log_2 16 = 4$).
- **Complexity**: $O(\log n)$ time, $O(1)$ space.

---

### Example 2: Duplicate Check (Brute Force vs Optimized)

#### Problem:
Check if an array contains any duplicate values. Return `true` if yes, `false` if all are unique.

#### Brute Force ($O(n^2)$ Time, $O(1)$ Space):
```js
function hasDuplicateBrute(nums) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] === nums[j]) return true;
    }
  }
  return false;
}
```
- For $n = 100,000$, $(100,000)^2 / 2 \approx 5,000,000,000$ operations. This will freeze and time out.

#### Optimized with Set ($O(n)$ Time, $O(n)$ Space):
```js
function hasDuplicateFast(nums) {
  const seen = new Set();
  for (const num of nums) {
    if (seen.has(num)) return true; // O(1) lookup
    seen.add(num);
  }
  return false;
}
```
- **Complexity**: $O(n)$ time because `seen.has()` takes $O(1)$ average time. Takes under 15 ms for 100,000 items!

---

## Common Mistakes and Interview Traps

1. **The "Short Code" Illusion**: Writing `arr.some((x, i) => arr.indexOf(x) !== i)` looks like one line, but `.indexOf()` inside `.some()` runs in $O(n^2)$ time!
2. **Forgetting Built-In Method Costs**: `arr.push()` is $O(1)$, but `arr.shift()` and `arr.unshift()` are $O(n)$ because every remaining item must shift indices in memory.
3. **Confusing Variables**: If a function takes two arrays `arrA` and `arrB`, the time is $O(A + B)$ or $O(A \times B)$, not simply $O(n)$.

---

## Tricky Points

- **Amortized $O(1)$**: `arr.push()` is usually $O(1)$. Occasionally, when the array runs out of allocated space, V8 copies it to a bigger block of memory ($O(n)$). Because this happens rarely, the average (amortized) cost is still $O(1)$.
- **Small Inputs**: For $n = 10$, an $O(n^2)$ algorithm runs in microseconds. Big O only describes what happens as data becomes large.

---

## Practical Exercise

Determine the Time and Auxiliary Space complexity of this snippet:
```js
function countPairs(n) {
  let count = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < 5; j++) {
      count++;
    }
  }
  return count;
}
```
*Answer*: Time is $O(n)$ because the inner loop runs a fixed 5 times (a constant, not dependent on $n$). Auxiliary Space is $O(1)$.

---

## Summary

- Big O describes how runtime and memory scale as input size $n$ grows toward infinity.
- Simplify complexity by dropping constants and keeping only the largest term.
- Prefer $O(1)$, $O(\log n)$, or $O(n)$ in web request paths to avoid blocking the Node.js event loop.
- In interviews: state your brute-force idea first ($O(n^2)$), then optimize using a pattern or data structure ($O(n)$).

---

## Cheat Sheet

### Growth Orders from Fastest to Slowest
$$O(1) < O(\log n) < O(n) < O(n \log n) < O(n^2) < O(2^n)$$

### Common JavaScript Operations
| Operation | Method | Time Complexity |
| :--- | :--- | :--- |
| Read by index | `arr[i]` | $O(1)$ |
| Add/remove at end | `arr.push()`, `arr.pop()` | $O(1)$ amortized |
| Add/remove at front | `arr.unshift()`, `arr.shift()` | $O(n)$ |
| Array search | `arr.includes(x)`, `arr.indexOf(x)` | $O(n)$ |
| Array slice | `arr.slice(start, end)` | $O(k)$ ($k = \text{length}$) |
| Set lookup / insert | `set.has(x)`, `set.add(x)` | $O(1)$ average |
| Map lookup / insert | `map.get(k)`, `map.set(k, v)` | $O(1)$ average |
| In-place sort | `arr.sort()` | $O(n \log n)$ |

---

## Interview Questions

### 1. Deep Definitions and Mental Models

**Question:** What does Big O measure, and why can we drop constants like the $2$ in $O(2n)$?
- **Expected answer shape:** Big O measures the growth rate of operations as input size approaches infinity. Constants only change the slope of the line, not the shape of growth. Both $n$ and $2n$ grow linearly, doubling their operations when the input doubles.

### 2. Predict the Output and Trace Execution

**Question:** What is the time complexity of this loop?
```js
for (let i = 1; i < n; i *= 2) {
  console.log(i);
}
```
- **Expected answer shape:** $O(\log n)$. The loop variable `i` doubles on each step (`1, 2, 4, 8...`), cutting the remaining distance in half each time. It executes $\log_2(n)$ times. Space complexity is $O(1)$.

### 3. Implementation Exercise

**Question:** Write a function `hasPairWithSum(arr, target)` that returns `true` if any two numbers in an unsorted array add up to `target`. Must run in $O(n)$ time.
- **Expected answer shape:**
```js
function hasPairWithSum(arr, target) {
  const seen = new Set();
  for (const num of arr) {
    if (seen.has(target - num)) return true;
    seen.add(num);
  }
  return false;
}
```
- State Time: $O(n)$, Auxiliary Space: $O(n)$.

### 4. Debugging and Failure Analysis

**Question:** A function filtering unique IDs from a list of 100,000 items is taking 8 seconds:
```js
const unique = items.filter((item, index) => items.indexOf(item) === index);
```
Why is this slow, and how do you fix it?
- **Expected answer shape:** `.filter()` loops $n$ times, and for each element, `.indexOf()` scans from index 0 ($O(n)$). Total time is $O(n^2)$. Fix by converting to a `Set`: `const unique = [...new Set(items)];` which runs in $O(n)$ time.

### 5. Design and Tradeoff Questions

**Question:** When would an $O(n^2)$ algorithm be acceptable or even preferred over an $O(n \log n)$ algorithm?
- **Expected answer shape:** When $n$ is known to be tiny (e.g. $n \le 10$). For small inputs, simpler code without extra dependencies or memory allocations runs in microseconds, and the constant factors of complex algorithms can make them slower.

### 6. Senior Follow-ups: Node.js Runtime

**Question:** What happens to a Node.js web server if an endpoint runs an $O(n^2)$ loop over an uploaded array of 50,000 items? How would you protect the service?
- **Expected answer shape:** Because Node.js is single-threaded, a CPU-heavy $O(n^2)$ synchronous loop blocks the event loop for seconds. All concurrent requests, health checks, and I/O freeze, causing 504 gateway timeouts. Protect by: (1) optimizing to $O(n)$, (2) validating and capping input size at the API gateway, or (3) offloading CPU-heavy work to Node.js `worker_threads`.

<nav aria-label="Lecture navigation">

[Roadmap](../javascript-dsa-roadmap.md) | [Next: Arrays, Objects, Sets, and Maps](day-02-arrays-objects-sets-maps.md)

</nav>
