# Day 14: Monotonic Stack Patterns

<nav aria-label="Lecture navigation">

[Previous: Stacks & Expression Parsing](day-13-stacks-and-expression-parsing.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Queues, Circular Buffers & Design](day-15-queues-circular-buffers-and-design.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Amortized complexity analysis (Aggregate Method).
- [Day 02: Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md) — Pre-allocated arrays and V8 SMI packing.
- [Day 13: Stacks & Expression Parsing](day-13-stacks-and-expression-parsing.md) — Stack LIFO push/pop mechanics.

---

## 1. What is a Monotonic Stack?

A **Monotonic Stack** is a specialized stack data structure that enforces a strict ordering invariant among its stored elements at all times. The elements inside the stack are always kept either in **strictly decreasing** or **strictly increasing** order from bottom to top.

> **Monotonic Decreasing Stack**: A stack where elements decrease from bottom to top (e.g., bottom `100, 80, 50, 20` top). Used to find the **Next Greater Element**.

> **Monotonic Increasing Stack**: A stack where elements increase from bottom to top (e.g., bottom `10, 25, 40, 70` top). Used to find the **Next Smaller Element**.

> **Amortized $O(n)$ Runtime**: Although an inner `while` loop runs inside an outer `for` loop, each element is pushed at most once and popped at most once across the entire algorithm, guaranteeing linear total work.

### Everyday Physical Analogies

#### The Skyline / Mountain Silhouette
Imagine looking out over a city skyline from left to right:
- If a skyscraper is 50 meters tall, and the next building is 30 meters tall, you can see both rooftops.
- But if a massive 80-meter tower is built next, it completely obstructs your line of sight to the shorter 30-meter and 50-meter buildings behind it!
- The 80-meter tower is the **Next Greater Element** for all those shorter buildings!

```text
MONOTONIC DECREASING STACK:
Elements arrive: [ 73, 74, 75, 71, 69, 72 ]

Stack state after processing 71, 69:
[ Bottom: 75 | 71 | Top: 69 ]  <-- Strictly decreasing!

When 72 arrives:
- 72 > 69? Pop 69! (72 is the Next Greater Element for 69)
- 72 > 71? Pop 71! (72 is the Next Greater Element for 71)
- 72 <= 75? Push 72!
New Stack State: [ Bottom: 75 | Top: 72 ]
```

---

## 2. How Monotonic Stacks Work Step-by-Step

### 1. The Next Greater Element Pattern (Decreasing Stack)

When we want to find the first element to the right that is strictly greater than `nums[i]`:
1. We iterate through the array from left to right.
2. We store **indices** (not just values) on the stack so we know both the original position and distance.
3. While the stack is not empty and `nums[i] > nums[stack.peek()]`:
   - The current element `nums[i]` is the "Next Greater Element" for the index sitting on top of the stack!
   - We pop that index: `poppedIndex = stack.pop()`.
   - We record `result[poppedIndex] = nums[i]`.
4. Push the current index `i` onto the stack.

#### Concrete Step-by-Step Trace on `[2, 1, 2, 4, 3]`
```text
Array: [ 2, 1, 2, 4, 3 ]
Result initialized to: [ -1, -1, -1, -1, -1 ]
Stack stores indices.

i = 0 (val = 2):
  Stack is empty. Push index 0.              Stack: [ 0 (val:2) ]

i = 1 (val = 1):
  nums[1] (1) > nums[0] (2)? No.
  Push index 1.                              Stack: [ 0 (val:2), 1 (val:1) ]

i = 2 (val = 2):
  nums[2] (2) > nums[1] (1)? Yes!
    Pop index 1 -> result[1] = 2.
  nums[2] (2) > nums[0] (2)? No (equal, not strictly greater).
  Push index 2.                              Stack: [ 0 (val:2), 2 (val:2) ]

i = 3 (val = 4):
  nums[3] (4) > nums[2] (2)? Yes!
    Pop index 2 -> result[2] = 4.
  nums[3] (4) > nums[0] (2)? Yes!
    Pop index 0 -> result[0] = 4.
  Stack is empty. Push index 3.              Stack: [ 3 (val:4) ]

i = 4 (val = 3):
  nums[4] (3) > nums[3] (4)? No.
  Push index 4.                              Stack: [ 3 (val:4), 4 (val:3) ]

End of array:
  Remaining indices in stack (3, 4) have no next greater element; retain default -1.
Final Result: [ 4, 2, 4, -1, -1 ]
```

```javascript
// ✅ CORRECT: Standard Monotonic Decreasing Stack for Next Greater Element
function nextGreaterElements(nums) {
  const n = nums.length;
  const result = new Array(n).fill(-1);
  const stack = []; // Stores indices

  for (let i = 0; i < n; i++) {
    while (stack.length > 0 && nums[i] > nums[stack[stack.length - 1]]) {
      const poppedIdx = stack.pop();
      result[poppedIdx] = nums[i]; // Resolved!
    }
    stack.push(i);
  }

  return result;
}

// ❌ ANTI-PATTERN: Nested loops scan forward redundantly (O(n^2) runtime)
function slowNextGreater(nums) {
  const result = [];
  for (let i = 0; i < nums.length; i++) {
    let found = -1;
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[j] > nums[i]) {
        found = nums[j];
        break;
      }
    }
    result.push(found);
  }
  return result;
}

// Example test run
console.log(nextGreaterElements([2, 1, 2, 4, 3])); // [ 4, 2, 4, -1, -1 ]
```

---

### 2. The Next Smaller Element Pattern (Increasing Stack)

When a problem asks for the first smaller element to the right (such as computing boundary walls for *Largest Rectangle in Histogram* or *Sum of Subarray Minimums*):
- We maintain the stack in **strictly increasing order** from bottom to top.
- When an incoming element `nums[i]` is strictly smaller than `nums[stack.top()]`, the newcomer is the **Next Smaller Element** for the top of the stack!

#### Concrete Step-by-Step Trace on `[4, 5, 2, 10, 8]`
```text
Array: [ 4, 5, 2, 10, 8 ]
Result initialized to: [ -1, -1, -1, -1, -1 ]
Stack stores indices.

i = 0 (val = 4):
  Stack is empty. Push index 0.              Stack: [ 0 (val:4) ]

i = 1 (val = 5):
  nums[1] (5) < nums[0] (4)? No.
  Push index 1.                              Stack: [ 0 (val:4), 1 (val:5) ]

i = 2 (val = 2):
  nums[2] (2) < nums[1] (5)? Yes!
    Pop index 1 -> result[1] = 2.
  nums[2] (2) < nums[0] (4)? Yes!
    Pop index 0 -> result[0] = 2.
  Stack is empty. Push index 2.              Stack: [ 2 (val:2) ]

i = 3 (val = 10):
  nums[3] (10) < nums[2] (2)? No.
  Push index 3.                              Stack: [ 2 (val:2), 3 (val:10) ]

i = 4 (val = 8):
  nums[4] (8) < nums[3] (10)? Yes!
    Pop index 3 -> result[3] = 8.
  nums[4] (8) < nums[2] (2)? No.
  Push index 4.                              Stack: [ 2 (val:2), 4 (val:8) ]

End of array:
  Indices 2 and 4 have no smaller elements; retain default -1.
Final Result: [ 2, 2, -1, 8, -1 ]
```

```javascript
// ✅ CORRECT: Monotonic Increasing Stack for Next Smaller Element
function nextSmallerElements(nums) {
  const n = nums.length;
  const result = new Array(n).fill(-1);
  const stack = []; // Stores indices

  for (let i = 0; i < n; i++) {
    while (stack.length > 0 && nums[i] < nums[stack[stack.length - 1]]) {
      const poppedIdx = stack.pop();
      result[poppedIdx] = nums[i]; // Resolved!
    }
    stack.push(i);
  }

  return result;
}

// Example test run
console.log(nextSmallerElements([4, 5, 2, 10, 8])); // [ 2, 2, -1, 8, -1 ]
```

---

## 3. Pattern Recognition of Monotonic Stacks

### Problem Triggers and Keywords

| Problem Keyword | What the Interviewer Means | Recommended Stack Type |
| :--- | :--- | :--- |
| **"Next Greater Element"** | First larger value to the right. | Monotonic Decreasing Stack |
| **"Next Smaller Element"** | First smaller value to the right. | Monotonic Increasing Stack |
| **"Days until warmer temperature"**| Distance to next greater value. | Monotonic Decreasing Stack (store indices) |
| **"Stock Span"** | Consecutive days with lower or equal price. | Monotonic Decreasing Stack |
| **"Largest Rectangle in Histogram"**| Left and right smaller boundaries. | Monotonic Increasing Stack |
| **"Trapping Rain Water"** | Finding bounding walls. | Monotonic Decreasing Stack |

### The $10^7$ Rule for Monotonic Stacks
- Brute-force nested loops take $O(n^2)$ time. For $n = 10^5$, $10^{10}$ operations will freeze Node.js.
- A Monotonic Stack reduces the runtime to strictly **$O(n)$ amortized**. Each index is pushed once and popped at most once ($2n$ operations $\approx 15\text{ms}$ in Node.js).

---

## 4. Problem 1: Next Greater Element I (LeetCode 496)

### Problem Statement
The **next greater element** of some element `x` in an array is the first greater element that is to the right of `x` in the same array.
You are given two distinct integer arrays `nums1` and `nums2`, where `nums1` is a subset of `nums2`.
For each `0 <= i < nums1.length`, find the index `j` such that `nums1[i] == nums2[j]` and determine the next greater element of `nums2[j]` in `nums2`. If there is no next greater element, then the answer for this query is `-1`.

```text
Input: nums1 = [4, 1, 2], nums2 = [1, 3, 4, 2]
Output: [-1, 3, -1]
Explanation:
For 4 in nums2: No greater element to the right -> -1.
For 1 in nums2: Next greater element is 3.
For 2 in nums2: No greater element to the right -> -1.
```

### Step 1: Physical Simulation
Imagine examining `nums2 = [1, 3, 4, 2]`:
1. Start with an empty shelf (the stack).
2. Look at `1`. Place `1` on the shelf.
3. Look at `3`.
   - `3 > 1`! That means `3` is the next greater element for `1`!
   - Write down in your notebook: `1 -> 3`.
   - Remove `1` from the shelf.
   - Place `3` on the shelf.
4. Look at `4`.
   - `4 > 3`! Write down in notebook: `3 -> 4`.
   - Remove `3` from shelf.
   - Place `4` on shelf.
5. Look at `2`.
   - `2` is smaller than `4`. Place `2` on shelf.
6. End of `nums2`. Remaining on shelf: `4` and `2`. Neither has a greater element.
   - In notebook: `4 -> -1`, `2 -> -1`.
7. For each query in `nums1 = [4, 1, 2]`, look up your notebook:
   - `4` -> `-1`, `1` -> `3`, `2` -> `-1`.

### Step 2: Brute Force Approach
For every element in `nums1`, search for its position in `nums2`, then loop forward to find the first larger number:

```javascript
function nextGreaterElementBrute(nums1, nums2) {
  const result = [];
  for (const x of nums1) {
    const idx = nums2.indexOf(x);
    let nextGreater = -1;
    for (let j = idx + 1; j < nums2.length; j++) {
      if (nums2[j] > x) {
        nextGreater = nums2[j];
        break;
      }
    }
    result.push(nextGreater);
  }
  return result;
}
```
- **Time Complexity**: $O(n_1 \times n_2)$ — Scanning `nums2` for each element in `nums1`.
- **Space Complexity**: $O(1)$ auxiliary space.

### Step 3: Bottleneck
Where is the CPU sweating?
We are performing repeated linear scans across `nums2` for every single query in `nums1`.

### Step 4: The Pattern Discovery
We can precompute the Next Greater Element for **all elements in `nums2` in a single pass** using a Monotonic Decreasing Stack and cache results in a `Map`. Then, answering each query in `nums1` takes instant $O(1)$ time!

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: O(n1 + n2) Monotonic Stack + Hash Map
function nextGreaterElement(nums1, nums2) {
  const nextGreaterMap = new Map();
  const stack = []; // Monotonic decreasing stack of values

  for (const num of nums2) {
    // While current num is greater than stack top, num is its next greater element
    while (stack.length > 0 && num > stack[stack.length - 1]) {
      nextGreaterMap.set(stack.pop(), num);
    }
    stack.push(num);
  }

  // Any elements remaining on stack have no next greater element
  while (stack.length > 0) {
    nextGreaterMap.set(stack.pop(), -1);
  }

  // Map each query from nums1 in O(1) time
  return nums1.map(x => nextGreaterMap.get(x));
}

// ❌ ANTI-PATTERN: Forgetting to resolve remaining elements in stack
function buggyNextGreater(nums1, nums2) {
  const map = new Map();
  const stack = [];
  for (const num of nums2) {
    while (stack.length && num > stack[stack.length - 1]) {
      map.set(stack.pop(), num);
    }
    stack.push(num);
  }
  // BUG: If an element is never popped, map.get(x) returns undefined instead of -1!
  return nums1.map(x => map.get(x) ?? -1);
}

// Example test runs
console.log(nextGreaterElement([4, 1, 2], [1, 3, 4, 2])); // [ -1, 3, -1 ]
console.log(nextGreaterElement([2, 4], [1, 2, 3, 4]));       // [ 3, -1 ]
```

- **Time Complexity**: $O(n_1 + n_2)$ — Single pass through `nums2` ($O(n_2)$) plus map lookups for `nums1` ($O(n_1)$).
- **Space Complexity**: $O(n_2)$ — Hash Map and Stack hold at most $n_2$ elements.

---

## 5. Problem 2: Daily Temperatures (LeetCode 739)

### Problem Statement
Given an array of integers `temperatures` representing the daily temperatures, return an array `answer` such that `answer[i]` is the **number of days you have to wait** after the $i^{\text{th}}$ day to get a warmer temperature. If there is no future day for which this is possible, keep `answer[i] == 0` instead.

```text
Input: temperatures = [73, 74, 75, 71, 69, 72, 76, 73]
Output: [1, 1, 4, 2, 1, 1, 0, 0]

Input: temperatures = [30, 40, 50, 60]
Output: [1, 1, 1, 0]

Input: temperatures = [30, 60, 90]
Output: [1, 1, 0]
```

### Step 1: Physical Simulation
Imagine recording daily weather on a whiteboard:
Input: `[73, 74, 75, 71, 69, 72, 76, 73]`
1. **Day 0 (73)**: Write Day 0 on sticky note, place on stack. Stack: `[ Day 0 (73) ]`.
2. **Day 1 (74)**: 74 is warmer than 73!
   - How many days did Day 0 wait? `1 - 0 = 1 day`!
   - Record `answer[0] = 1`. Pop Day 0.
   - Push Day 1. Stack: `[ Day 1 (74) ]`.
3. **Day 2 (75)**: 75 is warmer than 74!
   - `answer[1] = 2 - 1 = 1 day`. Pop Day 1.
   - Push Day 2. Stack: `[ Day 2 (75) ]`.
4. **Day 3 (71)**: Cooler than 75. Push Day 3. Stack: `[ Day 2 (75), Day 3 (71) ]`.
5. **Day 4 (69)**: Cooler than 71. Push Day 4. Stack: `[ Day 2 (75), Day 3 (71), Day 4 (69) ]`.
6. **Day 5 (72)**:
   - 72 is warmer than Day 4 (69)! `answer[4] = 5 - 4 = 1 day`. Pop Day 4.
   - 72 is warmer than Day 3 (71)! `answer[3] = 5 - 3 = 2 days`. Pop Day 3.
   - 72 is cooler than Day 2 (75). Push Day 5. Stack: `[ Day 2 (75), Day 5 (72) ]`.
7. Continue until all days processed.

### Step 2: Brute Force Approach
Compare each day with every future day using nested loops:

```javascript
function dailyTemperaturesBrute(temperatures) {
  const n = temperatures.length;
  const res = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (temperatures[j] > temperatures[i]) {
        res[i] = j - i;
        break;
      }
    }
  }
  return res;
}
```
- **Time Complexity**: $O(n^2)$ — For decreasing input `[100, 99, 98, ...]`, checks $\approx n^2/2$ pairs.
- **Space Complexity**: $O(1)$ auxiliary space.

### Step 3: Bottleneck
Where is the CPU sweating?
On an input of $n = 100,000$ descending days, $O(n^2)$ requires $5 \times 10^9$ operations, freezing the single-threaded Node.js event loop for seconds.

### Step 4: The Pattern Discovery
A **Monotonic Decreasing Stack storing day indices** tracks all days currently waiting for a warmer temperature. When a warmer day arrives, it resolves all colder days on top of the stack in $O(1)$ amortized time.

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: Amortized O(n) Monotonic Stack with Index Distance
function dailyTemperatures(temperatures) {
  const n = temperatures.length;
  const answer = new Array(n).fill(0);
  const stack = []; // Stores indices of days

  for (let currDay = 0; currDay < n; currDay++) {
    const currentTemp = temperatures[currDay];

    // While current day is warmer than the day on top of the stack
    while (stack.length > 0 && currentTemp > temperatures[stack[stack.length - 1]]) {
      const prevDay = stack.pop();
      answer[prevDay] = currDay - prevDay; // Calculate elapsed days
    }

    stack.push(currDay);
  }

  return answer;
}

// ❌ ANTI-PATTERN: Storing values instead of indices requires secondary lookups
function buggyDailyTemperatures(temperatures) {
  const stack = []; // BUG: Storing values loses index location and distance!
  const answer = [];
  for (const t of temperatures) {
    while (stack.length && t > stack[stack.length - 1]) {
      stack.pop();
    }
    stack.push(t);
  }
  return answer;
}

// Example test runs
console.log(dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73])); // [ 1, 1, 4, 2, 1, 1, 0, 0 ]
console.log(dailyTemperatures([30, 40, 50, 60]));                   // [ 1, 1, 1, 0 ]
console.log(dailyTemperatures([30, 60, 90]));                       // [ 1, 1, 0 ]
```

- **Time Complexity**: $O(n)$ — Every day index is pushed onto the stack exactly once and popped at most once.
- **Space Complexity**: $O(n)$ — Stack holds at most $n$ indices.

---

## 6. Under the Hood: V8 & Node.js

### V8 Engine Elements Kinds: Why Pre-allocation Matters
Notice how we initialize the output array:
```javascript
const answer = new Array(n).fill(0);
```
In V8:
1. `new Array(n).fill(0)` creates an array with **PACKED_SMI_ELEMENTS** (Small Integers).
2. Because it contains only unboxed 31-bit integers without holes, V8 allocates a single contiguous C-style integer memory block.
3. If you instead write `const answer = []` and randomly assign `answer[prevDay] = diff`, the array becomes a **HOLEY_ELEMENTS** array.
   - Holey arrays require V8 to check prototype chains on element lookups to verify whether an index is empty or undefined.
   - Initializing with `.fill(0)` guarantees fast raw C++ memory indexing, speeding up loop execution by **2x to 3x**!

### Aggregate Complexity Proof ($O(n)$ Amortized)
Why is a nested loop `for (...) { while (...) }` considered $O(n)$ and not $O(n^2)$?
- **Outer loop**: Executes $n$ times. Each iteration performs exactly 1 `push()` operation. Across the entire program, exactly $n$ elements are pushed.
- **Inner while loop**: Every iteration of the while loop executes exactly 1 `pop()` operation.
- **Fundamental Invariant**: An element cannot be popped unless it was previously pushed!
- Therefore, the while loop condition can evaluate to `true` at most $n$ times across the **entire execution** of the algorithm.
- Total operations: $n \text{ pushes} + (\le n \text{ pops}) \le 2n$ operations.
- $$T(n) = O(2n) = O(n)$$

---

## 7. Hands-On Exercise

### The Scenario
You are developing a real-time market data analytics component for a fintech trading API in Node.js.
You must implement an `OnlineStockSpanner` class that collects daily stock prices and returns the **span** of that day's price.
The **span** of the stock's price today is defined as the maximum number of consecutive days (starting from today and going backward) for which the stock price was less than or equal to today's price.

```text
Input: prices = [100, 80, 60, 70, 60, 75, 85]
Spans:          [  1,  1,  1,  2,  1,  4,  6]
```

### The Buggy Code
```javascript
class BuggySpanner {
  constructor() {
    this.history = [];
  }
  next(price) {
    this.history.push(price);
    let span = 0;
    // Bug: Linear scan backward on every call degrades next() to O(n) time!
    for (let i = this.history.length - 1; i >= 0; i--) {
      if (this.history[i] <= price) span++;
      else break;
    }
    return span;
  }
}
```

### Acceptance Criteria
1. `next(price)` must run in **$O(1)$ amortized time**.
2. Must use a Monotonic Decreasing Stack storing `[price, span]` pairs.
3. Accurately aggregates consecutive spans of all smaller or equal preceding prices.
4. Verified with direct test execution.

### Verified Solution

```javascript
// ✅ CORRECT: Monotonic Stack storing [price, accumulatedSpan]
class StockSpanner {
  constructor() {
    // Stack stores pairs: [price, span]
    this.stack = [];
  }

  next(price) {
    let span = 1; // Today counts as 1 day

    // While previous price is less than or equal to current price,
    // absorb its accumulated span into today's span!
    while (this.stack.length > 0 && this.stack[this.stack.length - 1][0] <= price) {
      span += this.stack.pop()[1];
    }

    this.stack.push([price, span]);
    return span;
  }
}

// Example test runs
const spanner = new StockSpanner();
console.log(spanner.next(100)); // 1
console.log(spanner.next(80));  // 1
console.log(spanner.next(60));  // 1
console.log(spanner.next(70));  // 2 (70 >= 60 -> span 1 + 1 = 2)
console.log(spanner.next(60));  // 1
console.log(spanner.next(75));  // 4 (75 >= 60, 70, 60 -> span 1 + 1 + 2 = 4)
console.log(spanner.next(85));  // 6 (85 >= 75, 80 -> span 4 + 1 + 1 = 6)
```

---

## 8. Tricky Points and Edge Cases

### 1. Storing Indices vs Values
Always store **indices** on the stack unless the problem explicitly forbids it.
- Storing an index gives you instant access to:
  1. The value: `nums[stack[stack.length - 1]]`.
  2. The position/distance: `currIndex - poppedIndex`.
- Storing only values destroys index distance information.

### 2. Strict Inequality vs Non-Strict Inequality
Pay close attention to problem statements:
- "Next Greater": `nums[curr] > nums[top]` (Strictly greater). Equal values stay on the stack.
- "Next Greater or Equal": `nums[curr] >= nums[top]`.
- For `StockSpanner`, it asks for prices *less than or equal to* today's price, requiring `<=`.

### 3. Circular Array Next Greater Element
In problems like *Next Greater Element II (LeetCode 503)* where the array is circular:
- Loop through the array twice using modulo indexing:
  `for (let i = 0; i < 2 * n; i++) { const idx = i % n; ... }`
- This simulates wrapping around the array without duplicating array memory.

---

## 9. Comprehensive Summary

- A **Monotonic Stack** maintains elements in sorted order by popping elements that violate the monotonic invariant.
- **Monotonic Decreasing Stack** (`>`): Solves **Next Greater Element** and **Daily Temperatures**.
- **Monotonic Increasing Stack** (`<`): Solves **Next Smaller Element** and **Largest Rectangle in Histogram**.
- **Amortized Linearity**: Despite nested loops, each item is pushed once and popped at most once ($O(n)$ total work).
- **V8 Efficiency**: Pre-allocating result arrays with `.fill(0)` creates `PACKED_SMI_ELEMENTS`, preventing memory holes and engine deoptimizations.

---

## 10. Cheat Sheet

### Monotonic Stack Invariants

| Pattern | Stack Order (Bottom to Top) | While Condition | Typical Problems |
| :--- | :--- | :--- | :--- |
| **Next Greater Element** | Decreasing (`100, 80, 50`) | `current > stackTop` | Next Greater Element, Daily Temperatures |
| **Previous Greater Element**| Decreasing | `current >= stackTop` | Online Stock Span |
| **Next Smaller Element** | Increasing (`20, 40, 70`) | `current < stackTop` | Largest Rectangle in Histogram |
| **Previous Smaller Element**| Increasing | `current <= stackTop` | Trapping Rain Water boundaries |

### Common Pitfalls List
- **Value vs Index Confusion**: Pushing `nums[i]` onto stack instead of index `i`.
- **Holey Array Deopt**: Dynamically expanding result arrays instead of `new Array(n).fill(0)`.
- **Strict Inequality Bugs**: Using `>=` when the problem asks for strictly greater elements.
- **Unpopped Elements**: Forgetting that items remaining on the stack have no greater element.

---

## 11. Interview Q&A

### 45-Second Technical Pitch
> *"A Monotonic Stack is an algorithmic pattern that solves Next Greater or Next Smaller element queries in linear amortized time. By enforcing a strictly increasing or decreasing invariant inside the stack, every incoming element resolves all pending candidates that it dominates before pushing itself. While naive nested loops take quadratic O(n^2) time, a monotonic stack guarantees that each element is pushed once and popped at most once, reducing total execution to strict O(n) time. In Node.js backend systems, this pattern optimizes financial time-series analysis, rate limiting sliding windows, and streaming metrics without blocking the event loop."*

### 1. Explain why the time complexity of Daily Temperatures is $O(n)$ despite the `while` loop inside the `for` loop.
**Answer:**
We evaluate the time complexity using **Aggregate Amortized Analysis**:
- The outer `for` loop runs exactly $n$ times (from index $0$ to $n - 1$). On each iteration, exactly one index is pushed onto the stack.
- The inner `while` loop executes only when an element is popped from the stack.
- Because an element must exist on the stack to be popped, and each element is pushed at most once, an element can be popped **at most once in its lifetime**.
- Across the entire execution of the algorithm, the total number of `pop()` operations cannot exceed $n$.
- Therefore, total operations = $n \text{ pushes} + \le n \text{ pops} = \le 2n$ operations.
- $$O(2n) = O(n)$$

### 2. What will the following code output in Node.js, and why?
```javascript
const stack = [10, 20];
console.log(stack[stack.length - 1]);
stack.pop();
console.log(stack[stack.length - 1]);
stack.pop();
console.log(stack[stack.length - 1]);
```
**Answer:**
It outputs:
`20`
`10`
`undefined`
When the stack is non-empty, `stack[stack.length - 1]` returns the top element. When the stack is completely empty (`stack.length === 0`), `stack[-1]` evaluates to `undefined` in JavaScript without throwing an error. In monotonic stack while conditions, checking `stack.length > 0` before accessing `stack[stack.length - 1]` prevents unintended comparisons against `undefined`.

### 3. Spot and fix the bug in this Next Greater Element implementation:
```javascript
function findNext(nums) {
  const res = [];
  const stack = [];
  for (let i = 0; i < nums.length; i++) {
    while (stack.length && nums[i] > nums[stack[stack.length - 1]]) {
      res[stack.pop()] = nums[i];
    }
    stack.push(i);
  }
  return res;
}
```
**Answer:**
The bug occurs for elements that have **no greater element** to their right.
Because `res` is initialized as an empty array `[]`, indices that remain on the stack at the end are never assigned a value. In JavaScript, `res` becomes a sparse array with empty holes (`<empty item>`), which evaluate to `undefined` instead of the expected `-1`.
Fix: Initialize with `new Array(nums.length).fill(-1)`.

### 4. How would you solve the "Next Greater Element II" problem where the array is circular?
**Answer:**
In a circular array, the element after `nums[n - 1]` wraps around to `nums[0]`.
Instead of physically duplicating the array (which allocates $2n$ memory), we simulate a concatenated array by iterating from `0` to `2 * n - 1` and accessing elements using modulo arithmetic: `nums[i % n]`.
- We only push indices during the first pass (`if (i < n) stack.push(i)`).
- During the second pass ($n$ to $2n - 1$), the incoming elements `nums[i % n]` can resolve any remaining unresolved indices from the first pass.
- Runtime remains strictly $O(n)$ with $O(n)$ auxiliary space.

---

## 12. Practice Problems

### 1. Next Greater Element I - Easy
Find next greater element for each query in subset array.
- **Sample Input 1:** `nums1 = [4, 1, 2]`, `nums2 = [1, 3, 4, 2]`
- **Expected Output 1:** `[-1, 3, -1]`
- **Sample Input 2:** `nums1 = [2, 4]`, `nums2 = [1, 2, 3, 4]`
- **Expected Output 2:** `[3, -1]`

### 2. Daily Temperatures - Medium
Find days to wait until warmer temperature.
- **Sample Input 1:** `temperatures = [73, 74, 75, 71, 69, 72, 76, 73]`
- **Expected Output 1:** `[1, 1, 4, 2, 1, 1, 0, 0]`
- **Sample Input 2:** `temperatures = [30, 40, 50, 60]`
- **Expected Output 2:** `[1, 1, 1, 0]`

### 3. Online Stock Span - Medium
Design a class calculating price span in $O(1)$ amortized time.
- **Sample Input:** `[100, 80, 60, 70, 60, 75, 85]`
- **Expected Output:** `[1, 1, 1, 2, 1, 4, 6]`

### 4. Next Greater Element II (Circular Array) - Medium
Given a circular integer array, find the next greater number for every element.
- **Sample Input 1:** `nums = [1, 2, 1]`
- **Expected Output 1:** `[2, -1, 2]`
- **Sample Input 2:** `nums = [1, 2, 3, 4, 3]`
- **Expected Output 2:** `[2, 3, 4, -1, 4]`

---

<nav aria-label="Lecture navigation">

[Previous: Stacks & Expression Parsing](day-13-stacks-and-expression-parsing.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Queues, Circular Buffers & Design](day-15-queues-circular-buffers-and-design.md)

</nav>
