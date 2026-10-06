# Day 18: Monotonic Stack Patterns

<nav aria-label="Lecture navigation">

[Previous: Valid Parentheses and Expression Parsing](day-17-valid-parentheses-and-expressions.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Queue Fundamentals, Circular Queues, and Deque](day-19-queue-circular-queue-and-deque.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Identify the **Monotonic Stack Pattern** for solving "Next Greater Element" and "Previous Smaller Element" problems.
- Prove why maintaining strict monotonic order guarantees an aggregate $O(n)$ runtime despite nested loops ($2n$ total operations).
- Explain why storing **indices rather than values** is mandatory for distance calculations and output lookups.
- Solve **Daily Temperatures** and **Online Stock Span** using monotonic stacks.
- Process circular arrays in **Next Greater Element II** using modulo indexing ($2n - 1$) and single-pass push invariants.
- Solve **Largest Rectangle in Histogram** in $O(n)$ time using boundary limits and sentinel values.

---

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Amortized analysis and complexity bounds.
- [Day 16: Stack Fundamentals and LIFO Architecture](day-16-stack-fundamentals-and-lifo.md) — LIFO primitives and array stack mechanics.
- [Day 17: Valid Parentheses and Expression Parsing](day-17-valid-parentheses-and-expressions.md) — Invariant-based stack state management.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
|---|---|---|
| **Monotonic Stack** | A stack whose elements are maintained in strictly increasing or strictly decreasing order. | Solves range lookups (e.g., next greater element) in $O(n)$ time rather than $O(n^2)$ pairwise scans. |
| **Monotonic Decreasing Stack** | A stack where elements decrease from bottom to top; popped by elements strictly greater than the top. | Identifies the Next Greater Element for all popped values in real time. |
| **Monotonic Increasing Stack** | A stack where elements increase from bottom to top; popped by elements strictly smaller than the top. | Identifies the Next Smaller Element or boundaries in histogram problems. |
| **Amortized Stack Bound** | The property that each of $n$ elements enters the stack once and exits at most once. | Proves that nested `while` loops execute at most $2n$ total operations across the entire algorithm. |
| **Sentinel Element** | A dummy value (e.g., height `0` or index `-1`) appended to an array to flush remaining stack elements. | Eliminates cleanup loops and prevents elements from being stranded on monotonic stacks. |

---

## Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            MONOTONIC DECREASING STACK MECHANICS                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Incoming Element: 75
  Current Stack (Values decrease bottom-to-top): [ 100, 80, 60, 40 ]
                                                            ▲   ▲
                                                Smaller than incoming 75!

  To maintain decreasing order upon inserting 75:
  1. Pop 40 ──> 75 is the NEXT GREATER ELEMENT for 40!
  2. Pop 60 ──> 75 is the NEXT GREATER ELEMENT for 60!
  3. Stop at 80 (80 > 75).
  4. Push 75 ──> New Stack State: [ 100, 80, 75 ]
```

### 1. Monotonic Stack Ordering and Classification

A Monotonic Stack maintains sorted ordering among its elements:
1. **Monotonic Decreasing Stack (Bottom to Top):**
   - Stores elements in descending order (`[100, 80, 60, 40]`).
   - An incoming element that is *larger* pops smaller elements from the stack.
   - **Solves:** Next Greater Element, Daily Temperatures, Stock Span.
2. **Monotonic Increasing Stack (Bottom to Top):**
   - Stores elements in ascending order (`[10, 20, 30, 40]`).
   - An incoming element that is *smaller* pops larger elements from the stack.
   - **Solves:** Next Smaller Element, Largest Rectangle in Histogram, Final Prices.

---

### 2. The Amortized $O(n)$ Proof

Monotonic stack code features a `while` loop nested inside a `for` loop:
```javascript
for (let i = 0; i < n; i++) {
  while (stack.length > 0 && arr[i] > arr[stack[stack.length - 1]]) {
    stack.pop();
  }
  stack.push(i);
}
```

#### Why this is strictly $O(n)$, not $O(n^2)$:
- Each element $i$ is pushed onto the stack **exactly once** during the outer loop ($n$ pushes).
- An element can only be popped from the stack if it is currently inside it. Once popped, it is gone forever ($ \le n$ pops).
- **Total stack operations:** At most $n \text{ pushes} + n \text{ pops} = 2n$ operations.
- The average time spent per element is $O(1)$, proving an aggregate runtime of **$O(n)$**.

---

### 3. Store Indices, Never Values

In almost all monotonic stack problems, **always store indices `i` on the stack instead of values `arr[i]`**:
1. You can always retrieve the value from the index: `arr[stackTop]`.
2. You can compute index distances: `distance = i - stackTop` (e.g., days waited).
3. You can write directly to arbitrary positions in the result array: `result[stackTop] = ...`.

```javascript
// Node.js code
"use strict";

// Daily Temperatures (LeetCode 739)
function dailyTemperatures(temperatures) {
  const n = temperatures.length;
  const result = new Array(n).fill(0);
  const stack = []; // Monotonic decreasing stack storing indices

  for (let i = 0; i < n; i++) {
    const currentTemp = temperatures[i];

    // While current temperature is warmer than the temperature at the top of stack
    while (stack.length > 0 && currentTemp > temperatures[stack[stack.length - 1]]) {
      const prevIndex = stack.pop();
      result[prevIndex] = i - prevIndex; // Calculate day distance
    }

    stack.push(i);
  }

  return result;
}

console.log("Daily Temperatures:", dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73]));
// [ 1, 1, 4, 2, 1, 1, 0, 0 ]
```

#### Trace: `dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73])`

| Day `i` | `Temp` | Stack Action | Resolved Wait Days | `stack` State (Indices) |
|---|---|---|---|---|
| `0` | 73 | Push 0 | — | `[0 (73)]` |
| `1` | 74 | $74 > 73 \to$ Pop 0 | `res[0] = 1 - 0 = 1` | `[1 (74)]` |
| `2` | 75 | $75 > 74 \to$ Pop 1 | `res[1] = 2 - 1 = 1` | `[2 (75)]` |
| `3` | 71 | $71 \le 75 \to$ Push 3 | — | `[2 (75), 3 (71)]` |
| `4` | 69 | $69 \le 71 \to$ Push 4 | — | `[2 (75), 3 (71), 4 (69)]` |
| `5` | 72 | $72 > 69 \to$ Pop 4<br>$72 > 71 \to$ Pop 3 | `res[4] = 5 - 4 = 1`<br>`res[3] = 5 - 3 = 2` | `[2 (75), 5 (72)]` |
| `6` | 76 | $76 > 72 \to$ Pop 5<br>$76 > 75 \to$ Pop 2 | `res[5] = 6 - 5 = 1`<br>`res[2] = 6 - 2 = 4` | `[6 (76)]` |
| `7` | 73 | Push 7 | — | `[6 (76), 7 (73)]` |

---

### 4. Circular Arrays: Next Greater Element II

In a circular array, elements wrap around from the end back to index 0.

#### The Modulo Loop Technique:
Simulate two full cycles by iterating from $0$ to $2n - 1$ using `currentIndex = i % n`.
- **Push Invariant:** Only push indices during the **first pass** (`i < n`). Pushing during the second pass is redundant and corrupts indices.

```javascript
// Node.js code
function nextGreaterElements(nums) {
  const n = nums.length;
  const result = new Array(n).fill(-1);
  const stack = []; // Monotonic decreasing stack storing indices

  // Loop twice through the virtual concatenated array
  for (let i = 0; i < 2 * n; i++) {
    const currentIndex = i % n;
    const currentVal = nums[currentIndex];

    while (stack.length > 0 && currentVal > nums[stack[stack.length - 1]]) {
      const prevIndex = stack.pop();
      result[prevIndex] = currentVal;
    }

    // Only push indices during the first cycle
    if (i < n) {
      stack.push(currentIndex);
    }
  }

  return result;
}

console.log("Next Greater Circular:", nextGreaterElements([1, 2, 1])); // [ 2, -1, 2 ]
```

---

## Tricky Points and Edge Cases

### 1. The Stranded Elements Trap in Histograms
In monotonic stacks, calculations are triggered only when a smaller/larger element pops previous values.
If input data is **strictly increasing** (`[1, 2, 3, 4]`), elements are pushed continuously and **never popped**.
- **Fix (Sentinel Element):** Append a sentinel height `0` to the end of the array (`heights.push(0)`). The final zero forces every single bar off the stack before the loop terminates.

### 2. Strictly Greater vs Greater-or-Equal
Always verify problem wording:
- *"Next Greater"* means strictly greater: `currentVal > arr[top]`.
- *"Next Greater or Equal"* includes ties: `currentVal >= arr[top]`.

---

## Hands-On Exercise

### Scenario
You are developing an analytics visualizer for image processing. You are given an array of integers `heights` representing the histogram's bar heights where each bar has width 1. You must find the area of the **Largest Rectangle in the Histogram** (LeetCode 84).

### Buggy Code
```javascript
// Node.js code
function largestRectangleAreaBuggy(heights) {
  let maxArea = 0;
  // ❌ Bug 1: Brute-force nested loops take O(n^2) time!
  // ❌ Bug 2: Fails on arrays with 100,000 elements.
  for (let i = 0; i < heights.length; i++) {
    let minHeight = heights[i];
    for (let j = i; j < heights.length; j++) {
      minHeight = Math.min(minHeight, heights[j]);
      maxArea = Math.max(maxArea, minHeight * (j - i + 1));
    }
  }
  return maxArea;
}
```

### Acceptance Criteria
1. Execute in strictly $O(n)$ time using a monotonic increasing stack.
2. Auxiliary memory must be $O(n)$ for the stack.
3. Correctly handle strictly increasing bars (`[1, 2, 3]`), strictly decreasing bars (`[3, 2, 1]`), and uniform bars (`[2, 2, 2]`).

### Solution Code

```javascript
// Node.js code
import assert from "node:assert/strict";

function largestRectangleArea(heights) {
  // Append sentinel height 0 to force all remaining bars off the stack at termination
  const h = [...heights, 0];
  const stack = []; // Monotonic increasing stack storing indices
  let maxArea = 0;

  for (let i = 0; i < h.length; i++) {
    // While current bar is shorter than the bar at stack top
    while (stack.length > 0 && h[i] < h[stack[stack.length - 1]]) {
      const height = h[stack.pop()];

      // Width calculation:
      // If stack is empty, height spans all the way from index 0 to i
      // Otherwise, width spans between current index i and new stack top
      const width = stack.length === 0 ? i : (i - stack[stack.length - 1] - 1);

      maxArea = Math.max(maxArea, height * width);
    }

    stack.push(i);
  }

  return maxArea;
}

// Verification Tests
assert.equal(largestRectangleArea([2, 1, 5, 6, 2, 3]), 10); // Bars 5 and 6 form area 5 * 2 = 10
assert.equal(largestRectangleArea([2, 4]), 4);
assert.equal(largestRectangleArea([1, 2, 3, 4]), 6);          // Bars 3 and 4 form area 3 * 2 = 6
assert.equal(largestRectangleArea([2, 2, 2]), 6);

console.log("✅ All Largest Rectangle in Histogram assertions passed successfully!");
```

### Solution Explanation

1. **Monotonic Increasing Boundary:** A bar popped at index $k$ has its right boundary defined by the current shorter bar at index $i$, and its left boundary defined by the bar beneath it in the stack.
2. **Sentinel Invariant:** The appended `0` guarantees the stack is empty when the algorithm finishes, avoiding secondary cleanup loops.

---

## Summary

- Monotonic stacks maintain sorted ordering to find next/previous greater/smaller elements in $O(n)$ time.
- Amortized analysis proves linear runtime because each element enters and exits the stack at most once.
- Storing indices on the stack allows computing distances and updating output arrays directly.
- Circular arrays are solved using a virtual $2n$ loop with `i % n`, pushing indices only during the first cycle ($i < n$).
- Sentinel elements (e.g., height `0`) flush remaining items on monotonic stacks, preventing stranded values.

---

## Cheat Sheet

### Next Greater Element Blueprint
```javascript
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

### Common Pitfalls
- **Storing Values Instead of Indices:** Prevents distance calculations and arbitrary result writes.
- **Pushing during the Second Circular Pass:** Pushing when $i \ge n$ corrupts indices and duplicates work.
- **Missing Histogram Sentinel:** Omitting sentinel `0` leaves strictly increasing bars un-evaluated.
- **Strict vs Non-Strict Inequalities:** Conflating `>` with `>=` breaks tie-handling requirements.

---

## Interview Questions

### 1. How does aggregate analysis prove that a monotonic stack runs in $O(n)$ time despite nested loops?

**Question:** Explain how aggregate analysis proves that monotonic stack algorithms achieve $O(n)$ time complexity despite nested iteration.

**Answer:** 
In algorithmic analysis, the total execution time of an algorithm is determined by the total number of fundamental operations executed across the entire program lifecycle:
1. The outer `for` loop executes exactly $n$ iterations (from $i = 0$ to $n - 1$).
2. During each iteration of the outer loop, exactly one `stack.push(i)` operation is performed. Therefore, across all iterations, there are **at most $n$ total push operations**.
3. The inner `while` loop executes only when elements are popped from the stack via `stack.pop()`.
4. An element can only be popped if it was previously pushed. Once an element is popped, it is permanently removed from the stack and cannot be popped again.
5. Therefore, the total number of `pop()` operations executed across all iterations combined is **at most $n$**.
6. Summing all operations:
   $$\text{Total Stack Operations} = \text{Total Pushes} + \text{Total Pops} \le n + n = 2n$$
Because $2n = O(n)$, the algorithm runs in guaranteed **amortized linear time**.

---

### 2. What does this function return for `nums = [2, 1, 2, 4, 3]`, and what is the step-by-step trace?

**Question:** Trace the execution and output of the following function:
```javascript
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

**Answer:**
The function returns: `[ 4, 2, 4, -1, -1 ]`.

**Trace:**
1. **`i = 0` (val 2):** Stack empty $\to$ Push index 0. Stack: `[0 (val 2)]`.
2. **`i = 1` (val 1):** $1 \not> 2 \to$ Push index 1. Stack: `[0 (val 2), 1 (val 1)]`.
3. **`i = 2` (val 2):**
   - $2 > 1 \to$ Pop index 1. `res[1] = 2`.
   - $2 \not> 2 \to$ Stop. Push index 2. Stack: `[0 (val 2), 2 (val 2)]`.
4. **`i = 3` (val 4):**
   - $4 > 2 \to$ Pop index 2. `res[2] = 4`.
   - $4 > 2 \to$ Pop index 0. `res[0] = 4`.
   - Stack empty $\to$ Push index 3. Stack: `[3 (val 4)]`.
5. **`i = 4` (val 3):** $3 \not> 4 \to$ Push index 4. Stack: `[3 (val 4), 4 (val 3)]`.
6. Loop ends. Indices 3 and 4 remain in stack with no greater elements, preserving initial `-1`.
- Final `res`: `[4, 2, 4, -1, -1]`.

---

### 3. How does Online Stock Span calculate price spans in amortized $O(1)$ time per query?

**Question:** Implement the `StockSpanner` class and explain why storing `[price, span]` pairs on a monotonic stack is optimal.

**Answer:** 
The problem requires returning the number of consecutive days prior to today where prices were $\le$ today's price.
Instead of scanning backward through historical arrays on each query, maintain a **monotonic decreasing stack of pairs: `[price, span]`**:

```javascript
// Node.js code
class StockSpanner {
  constructor() {
    this.stack = []; // [price, span]
  }

  next(price) {
    let span = 1;

    // While current price is greater than or equal to top price, absorb its span
    while (this.stack.length > 0 && this.stack[this.stack.length - 1][0] <= price) {
      span += this.stack.pop()[1];
    }

    this.stack.push([price, span]);
    return span;
  }
}
```
**Why this is optimal:**
By absorbing the spans of smaller previous prices (`span += poppedSpan`), previous smaller records are eliminated from future consideration. Each price enters the stack once and is absorbed at most once, yielding an **amortized $O(1)$ time** per `next()` invocation.

---

### 4. How would you architect a real-time anomaly detection stream in Node.js that warns whenever a sensor temperature exceeds all readings in the previous 10 minutes?

**Question:** Design an in-memory streaming detector for a Node.js microservice using monotonic deque concepts.

**Answer:** 
**Architecture Design:**
1. **Monotonic Decreasing Deque:**
   Maintain an in-memory deque storing tuples: `{ timestamp, value }`.
   The deque is kept in **strictly decreasing order** of values.
2. **On Each Telemetry Event Arrival:**
   - **Step 1 (Evict Expired Telemetry):**
     While deque is non-empty and `deque.front.timestamp < (currentTimestamp - 10 * 60 * 1000)`, remove it from the front (`shift` or index advance).
   - **Step 2 (Anomaly Assessment):**
     Because the deque is monotonically decreasing, the **front element is the global maximum** of the active 10-minute window.
     If the deque is empty OR `incomingValue > deque.front.value`:
     Emit an immediate anomaly alert (this reading is the highest in the last 10 minutes).
   - **Step 3 (Maintain Monotonic Decreasing Order):**
     While deque is non-empty and `incomingValue >= deque.back.value`, pop from the back.
     Push `{ timestamp: currentTimestamp, value: incomingValue }` to the back.
3. **Efficiency:**
   Operates in $O(1)$ amortized time per telemetry event, with memory bounded strictly to readings within the 10-minute sliding window.

---

<nav aria-label="Lecture navigation">

[Previous: Valid Parentheses and Expression Parsing](day-17-valid-parentheses-and-expressions.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Queue Fundamentals, Circular Queues, and Deque](day-19-queue-circular-queue-and-deque.md)

</nav>
