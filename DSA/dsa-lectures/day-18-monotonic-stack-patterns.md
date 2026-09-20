# Day 18: Monotonic Stack Patterns

<nav aria-label="Lecture navigation">

[Previous: Valid Parentheses and Expression Parsing](day-17-valid-parentheses-and-expressions.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Queue Fundamentals, Circular Queues, and Deque](day-19-queue-circular-queue-and-deque.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Identify the **Monotonic Stack Pattern** for finding the "next greater" or "previous smaller" element.
- Explain why maintaining strict monotonic order guarantees $O(n)$ total time across all operations.
- Solve **Daily Temperatures** using a monotonic decreasing stack storing indices.
- Handle circular arrays in **Next Greater Element II** using modulo indexing ($2n - 1$).
- Solve **Largest Rectangle in Histogram** in $O(n)$ time using monotonic boundaries.

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md)
- [Day 16: Stack Fundamentals and LIFO Architecture](day-16-stack-fundamentals-and-lifo.md)

---

## Core Concepts

### 1. What is a Monotonic Stack?

A **Monotonic Stack** is a stack whose elements are always sorted in a single direction (strictly increasing or strictly decreasing):
- **Monotonic Decreasing Stack**: Elements decrease from bottom to top (`[100, 80, 60, 40]`).
  - Used to find the **Next Greater Element**.
- **Monotonic Increasing Stack**: Elements increase from bottom to top (`[10, 20, 40, 80]`).
  - Used to find the **Next Smaller Element**.

```text
Incoming Element: 75
Current Stack (Decreasing): [ 100, 80, 60, 40 ]
                                        ▲   ▲
                                      Smaller than 75!

To preserve decreasing order:
Pop 40 -> 75 is the NEXT GREATER ELEMENT for 40!
Pop 60 -> 75 is the NEXT GREATER ELEMENT for 60!
Push 75 -> Stack is now: [ 100, 80, 75 ]
```

---

### 2. Why is Monotonic Stack $O(n)$ and Not $O(n^2)$?

A nested while-loop inside a for-loop looks like $O(n^2)$ at first glance:
```js
for (let i = 0; i < n; i++) {
  while (stack.length > 0 && arr[i] > arr[stack[stack.length - 1]]) {
    stack.pop();
  }
  stack.push(i);
}
```
**Amortized Analysis**:
- Every element is pushed onto the stack **exactly once**.
- Every element can be popped from the stack **at most once**.
- Total push operations: $n$. Total pop operations: at most $n$.
- Total operations: $2n \to \mathbf{O(n)}$ **linear time!**

---

## Detailed Explanations & Node.js Relevance

### Storing Indices Instead of Values

In almost all monotonic stack problems (Daily Temperatures, Stock Span, Histogram), **always push the index `i` rather than the value `arr[i]` onto the stack**.
Why?
- From the index, you can always read the value: `arr[i]`.
- You can compute distances: `daysWaited = currentIndex - stack.pop()`.
- You can look up positions in the output array in $O(1)$ time.

### Node.js Relevance: Timeseries Anomaly Detection
In Node.js timeseries processing (e.g. tracking microservice CPU usage or memory spikes), a monotonic stack detects the duration until the next threshold breach in a single streaming pass without re-scanning historical windows.

---

## JavaScript Implementation & Tracing

### 1. Daily Temperatures (LeetCode 739)

Given an array of integers `temperatures`, return an array `answer` such that `answer[i]` is the number of days you have to wait after the $i$-th day to get a warmer temperature. If there is no future day for which this is possible, keep `answer[i] == 0`.

```js
function dailyTemperatures(temperatures) {
  const n = temperatures.length;
  const result = new Array(n).fill(0);
  const stack = []; // Monotonic decreasing stack storing indices

  for (let i = 0; i < n; i++) {
    const currentTemp = temperatures[i];

    // While current day is warmer than the day at the top of stack
    while (stack.length > 0 && currentTemp > temperatures[stack[stack.length - 1]]) {
      const prevIndex = stack.pop();
      result[prevIndex] = i - prevIndex; // Distance in days
    }

    stack.push(i);
  }

  return result;
}
```

### 2. Next Greater Element II (Circular Array) (LeetCode 503)

In a circular array, search through the array twice by looping up to $2n - 1$ using index `i % n`:

```js
function nextGreaterElements(nums) {
  const n = nums.length;
  const result = new Array(n).fill(-1);
  const stack = []; // Stores indices

  // Loop twice through the array
  for (let i = 0; i < 2 * n; i++) {
    const currentIndex = i % n;
    const currentVal = nums[currentIndex];

    while (stack.length > 0 && currentVal > nums[stack[stack.length - 1]]) {
      const prevIndex = stack.pop();
      result[prevIndex] = currentVal;
    }

    // Only push indices during the first pass
    if (i < n) {
      stack.push(currentIndex);
    }
  }

  return result;
}
```

### Trace: `dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73])`

| Day `i` | `Temp` | Stack Action | Resolved Days | `stack` State (Indices) |
| :--- | :--- | :--- | :--- | :--- |
| `0` | 73 | Push 0 | — | `[0 (73)]` |
| `1` | 74 | $74 > 73 \to$ Pop 0 | `res[0] = 1 - 0 = 1` | `[1 (74)]` |
| `2` | 75 | $75 > 74 \to$ Pop 1 | `res[1] = 2 - 1 = 1` | `[2 (75)]` |
| `3` | 71 | $71 \le 75 \to$ Push 3 | — | `[2 (75), 3 (71)]` |
| `4` | 69 | $69 \le 71 \to$ Push 4 | — | `[2 (75), 3 (71), 4 (69)]` |
| `5` | 72 | $72 > 69 \to$ Pop 4<br>$72 > 71 \to$ Pop 3 | `res[4] = 5 - 4 = 1`<br>`res[3] = 5 - 3 = 2` | `[2 (75), 5 (72)]` |
| `6` | 76 | $76 > 72 \to$ Pop 5<br>$76 > 75 \to$ Pop 2 | `res[5] = 6 - 5 = 1`<br>`res[2] = 6 - 2 = 4` | `[6 (76)]` |
| `7` | 73 | Push 7 | — | `[6 (76), 7 (73)]` |

Final result: `[1, 1, 4, 2, 1, 1, 0, 0]`.
- **Time Complexity**: $O(n)$ where $n$ is `temperatures.length`.
- **Auxiliary Space**: $O(n)$ to hold indices in the stack.

---

## Common Mistakes & Interview Traps

1. **Pushing Values instead of Indices**:
   If you store values on the stack, you cannot compute distance (`i - prevIndex`) or update the output array at specific indices. Always store indices!
2. **Pushing in Circular Array during Second Pass**:
   In Next Greater Element II, if you push indices during the second pass ($i \ge n$), you will cause redundant calculations and overwrite valid results. Only push when `i < n`.
3. **Strictly Greater vs Greater-or-Equal**:
   Carefully verify the problem statement: does a temperature with the *same* value count as warmer? (`>` vs `>=`). For "strictly greater", use `currentTemp > temperatures[top]`.

---

## Tricky Points & Edge Cases

- **Elements With No Greater Element**:
  Elements left on the stack at the end of the loop never find a greater element. Initializing the result array with `0` or `-1` handles them automatically.
- **Monotonically Decreasing Input**:
  `[50, 40, 30, 20]`: No popping occurs during the loop; all elements are pushed. Runtime remains $O(n)$.

---

## Practical Exercise

Implement **Online Stock Span** (LeetCode 901):
Design a class `StockSpanner` which collects daily price quotes for some stock and returns the span of that stock's price for the current day:
- The span of the stock's price today is the maximum number of consecutive days (starting from today and going backward) for which the price was less than or equal to today's price.
- **Acceptance Criterion**: `next(price)` must run in amortized $O(1)$ time using a monotonic stack storing `[price, span]` pairs.

---

## Summary

- Monotonic stacks maintain sorted elements to solve "next greater" or "previous smaller" problems in $O(n)$ time.
- Storing indices on the stack allows calculating distances and updating arbitrary positions in the output.
- Amortized analysis proves linear runtime because each element is pushed and popped at most once.
- Circular array problems are simulated by looping up to $2n$ using modulo indexing (`i % n`).

---

## Cheat Sheet

### Next Greater Element Blueprint
```js
const result = new Array(n).fill(-1);
const stack = []; // indices
for (let i = 0; i < n; i++) {
  while (stack.length > 0 && nums[i] > nums[stack[stack.length - 1]]) {
    const prev = stack.pop();
    result[prev] = nums[i]; // or (i - prev) for distance
  }
  stack.push(i);
}
return result;
```

---

## Interview Questions

### 1. Deep Definitions and Mental Models
**Question:** Prove that an algorithm with a while loop inside a for loop runs in $O(n)$ time for a monotonic stack.
- **Expected answer shape:** Runtime is governed by the total number of operations performed on the stack, not the maximum iterations of a single while-loop step. An element enters the stack at most once via `push` ($n$ total pushes) and leaves at most once via `pop` (at most $n$ total pops). Therefore, the inner while loop executes at most $n$ times across the entire lifetime of the program, proving an aggregate runtime of $O(2n) = O(n)$.

### 2. Predict the Output and Trace Execution
**Question:** What does this function return for `nums = [2, 1, 2, 4, 3]`?
```js
function test(nums) {
  const res = new Array(nums.length).fill(-1);
  const stack = [];
  for (let i = 0; i < nums.length; i++) {
    while (stack.length > 0 && nums[i] > nums[stack[stack.length - 1]]) {
      res[stack.pop()] = nums[i];
    }
    stack.push(i);
  }
  return res;
}
```
- **Expected answer shape:** Returns `[4, 2, 4, -1, -1]`.
- For `2` (idx 0), next greater is `4` (idx 3).
- For `1` (idx 1), next greater is `2` (idx 2).
- For `2` (idx 2), next greater is `4` (idx 3).
- For `4` and `3`, no greater future elements exist, so they retain default `-1`.

### 3. Implementation Exercise
**Question:** Implement `finalPrices(prices)` (LeetCode 1475) where you receive a discount equal to the next smaller or equal price to the right: $O(n)$ time using a monotonic increasing stack.
- **Expected answer shape:**
```js
function finalPrices(prices) {
  const result = [...prices];
  const stack = []; // indices
  for (let i = 0; i < prices.length; i++) {
    while (stack.length > 0 && prices[i] <= prices[stack[stack.length - 1]]) {
      const prev = stack.pop();
      result[prev] -= prices[i];
    }
    stack.push(i);
  }
  return result;
}
```

### 4. Debugging and Failure Analysis
**Question:** A candidate solves Largest Rectangle in Histogram using a monotonic stack. When input is strictly increasing `[1, 2, 3, 4]`, the function returns 0. Why?
- **Expected answer shape:** In strictly increasing input, elements are continuously pushed onto the stack and never popped because no smaller element arrives to trigger the calculation. To fix: append a sentinel `0` to the end of the array (`heights.push(0)`), which forces all remaining bars to be popped and evaluated before the loop finishes.

### 5. Design and Tradeoff Questions
**Question:** How does a monotonic stack compare to a segment tree for answering range maximum queries?
- **Expected answer shape:** A monotonic stack finds the next greater element in static arrays in $O(n)$ time and $O(n)$ space, but cannot handle dynamic element updates. A Segment Tree supports dynamic point updates and range queries in $O(\log n)$ time, but requires $O(4n)$ space and complex tree mechanics.

### 6. Senior Follow-ups: Node.js Stream Telemetry
**Question:** How would you implement a streaming service that logs a warning whenever an incoming temperature reading is higher than all readings in the previous 10 minutes?
- **Expected answer shape:** Use a monotonic decreasing deque storing timestamps and temperature readings. As new telemetry arrives: (1) evict readings older than 10 minutes from the front, (2) check if incoming reading is larger than all elements in the window (if deque is empty or reading $>$ deque front), (3) maintain decreasing order by popping smaller elements from the back before inserting the current reading.

<nav aria-label="Lecture navigation">

[Previous: Valid Parentheses and Expression Parsing](day-17-valid-parentheses-and-expressions.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Queue Fundamentals, Circular Queues, and Deque](day-19-queue-circular-queue-and-deque.md)

</nav>
