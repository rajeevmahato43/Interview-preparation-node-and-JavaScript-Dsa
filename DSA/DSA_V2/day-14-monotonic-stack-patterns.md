# Day 14: Monotonic Stacks

<nav aria-label="Lecture navigation">

[Previous: Stacks & Expression Parsing](day-13-stacks-and-expression-parsing.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Queues, Circular Buffers & Design](day-15-queues-circular-buffers-and-design.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Amortized $O(n)$ analysis.
- [Day 13: Stacks & Expression Parsing](day-13-stacks-and-expression-parsing.md) — Stack `push` and `pop`.

---

## 1. What is a Monotonic Stack?

A **Monotonic Stack** is a stack where elements are kept in sorted order (either strictly increasing or strictly decreasing) from bottom to top.

> **Monotonic Stack**: A stack that pops elements out whenever a new incoming value would break its sorted order.

Think of looking across a row of buildings of different heights:
- A very tall building hides all shorter buildings behind it.
- When a new, taller building enters your view, all previous shorter buildings become irrelevant.

```text
Incoming Element: 75
Current Stack (decreasing order): [ 100, 80, 60, 40 ]
                                              ▲   ▲
                                         Smaller than 75!
To keep decreasing order:
1. Pop 40 ──► 75 is the NEXT GREATER ELEMENT for 40!
2. Pop 60 ──► 75 is the NEXT GREATER ELEMENT for 60!
3. Stop at 80 (since 80 > 75).
4. Push 75 ──► New Stack: [ 100, 80, 75 ]
```

### The Golden Rule: Store Indices, Not Values
Always push the **index** `i` onto the stack rather than the raw value `arr[i]`:
- You can get the value anytime via `arr[index]`.
- You can calculate distances (like days or width) via `i - prevIndex`.

---

## 2. Why is it $O(n)$ Even with a `while` Loop?

```javascript
for (let i = 0; i < arr.length; i++) {
  while (stack.length > 0 && arr[i] > arr[stack[stack.length - 1]]) {
    stack.pop();
  }
  stack.push(i);
}
```
- Every index is pushed onto the stack **exactly once** ($n$ pushes).
- An element can only be popped **once** in its entire lifetime ($\le n$ pops).
- Total stack operations cannot exceed $n + n = 2n \implies$ **strictly $O(n)$ time**!

---

## 3. Problem 1: Daily Temperatures

Given an array of daily temperatures `temperatures`, return an array `answer` such that `answer[i]` is the number of days you have to wait after the $i$-th day to get a warmer temperature. If no future day is warmer, keep `0`.

```javascript
// Node.js code
function dailyTemperatures(temperatures) {
  const n = temperatures.length;
  const result = new Array(n).fill(0);
  const stack = []; // Stores indices of days

  for (let i = 0; i < n; i++) {
    const currentTemp = temperatures[i];

    // While current day is warmer than the day on top of the stack
    while (stack.length > 0 && currentTemp > temperatures[stack[stack.length - 1]]) {
      const prevDayIndex = stack.pop();
      result[prevDayIndex] = i - prevDayIndex; // Distance in days
    }

    stack.push(i);
  }

  return result;
}

console.log(dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73]));
// Output: [1, 1, 4, 2, 1, 1, 0, 0]
```
- **Time Complexity:** $O(n)$ — Single pass; elements pushed and popped at most once.
- **Extra Space:** $O(n)$ — Stack stores up to $n$ indices.

---

## 4. Problem 2: Next Greater Element I

Find the next greater element for each number in `nums1` within `nums2`.

```javascript
// Node.js code
function nextGreaterElement(nums1, nums2) {
  const nextGreaterMap = new Map();
  const stack = [];

  for (const num of nums2) {
    while (stack.length > 0 && num > stack[stack.length - 1]) {
      const smaller = stack.pop();
      nextGreaterMap.set(smaller, num);
    }
    stack.push(num);
  }

  // Map remaining items in stack to -1 (no greater element found)
  while (stack.length > 0) {
    nextGreaterMap.set(stack.pop(), -1);
  }

  return nums1.map(num => nextGreaterMap.get(num));
}

console.log(nextGreaterElement([4, 1, 2], [1, 3, 4, 2])); // [-1, 3, -1]
```
- **Time Complexity:** $O(n + m)$
- **Extra Space:** $O(m)$

---

## 5. Tricky Points and Common Traps

1. **Strictly greater vs greater or equal:** Pay attention to whether the problem says "strictly greater" (`>`) or "greater or equal" (`>=`).
2. **Circular arrays:** If elements wrap around to the start (like *Next Greater Element II*), loop through the array twice virtually: `for (let i = 0; i < 2 * n; i++)` using `arr[i % n]`.
3. **Unresolved items in the stack:** Indices left in the stack after the loop finishes have no next greater element. They default to `0` or `-1`.

---

## 6. Hands-On Exercises

Run this script in Node.js to verify daily temperatures:

```javascript
// Node.js code
const assert = require("node:assert");

function testDaily(temps) {
  const res = new Array(temps.length).fill(0);
  const st = [];
  for (let i = 0; i < temps.length; i++) {
    while (st.length > 0 && temps[i] > temps[st[st.length - 1]]) {
      const prev = st.pop();
      res[prev] = i - prev;
    }
    st.push(i);
  }
  return res;
}

assert.deepEqual(testDaily([73, 74, 75, 71, 69, 72, 76, 73]), [1, 1, 4, 2, 1, 1, 0, 0]);
assert.deepEqual(testDaily([30, 40, 50, 60]), [1, 1, 1, 0]);

console.log("✅ Daily temperatures assertions passed!");
```

---

## 7. Summary

- **Monotonic Stacks** find the *Next Greater* or *Next Smaller* element in $O(n)$ time.
- **Push indices**, not raw values, so you can calculate distances between elements.
- **Linear complexity**: Even with a nested `while` loop, each element is pushed and popped at most once.

---

## 8. Cheat Sheet

| Problem Goal | Stack Order | Loop Condition |
| :--- | :--- | :--- |
| **Next Greater Element** | Monotonic Decreasing | `while (arr[i] > arr[top]) pop()` |
| **Next Smaller Element** | Monotonic Increasing | `while (arr[i] < arr[top]) pop()` |
| **Distance Between Items**| Store indices | `distance = i - poppedIndex` |

---

## 9. Interview Q&A

### 45-Second Explanation
> *"To solve Daily Temperatures in $O(n)$ time instead of an $O(n^2)$ nested loop, we use a monotonic decreasing stack that stores day indices. As we iterate through each temperature, if the current temperature is warmer than the day at the top of the stack, we pop that day and calculate the difference in indices. Because each index is pushed and popped at most once, the total runtime is strictly $O(n)$ with $O(n)$ auxiliary space."*

---

## 10. Practice Problems

### 1. Daily Temperatures - Medium
Given an array of integers `temperatures` represents the daily temperatures, return an array `answer` such that `answer[i]` is the number of days you have to wait after the $i^{\text{th}}$ day to get a warmer temperature. If there is no future day for which this is possible, keep `answer[i] == 0` instead.
- **Input:** `temperatures = [73,74,75,71,69,72,76,73]`
- **Expected Output:** `[1,1,4,2,1,1,0,0]`
- **Input:** `temperatures = [30,40,50,60]`
- **Expected Output:** `[1,1,1,0]`

### 2. Next Greater Element I - Easy
The **next greater element** of some element `x` in an array is the first greater element that is to the right of `x` in the same array. You are given two distinct 0-indexed integer arrays `nums1` and `nums2`, where `nums1` is a subset of `nums2`. For each `0 <= i < nums1.length`, find the index `j` such that `nums1[i] == nums2[j]` and determine the next greater element of `nums2[j]` in `nums2`. If there is no next greater element, then the answer for this query is `-1`.
- **Input:** `nums1 = [4,1,2], nums2 = [1,3,4,2]`
- **Expected Output:** `[-1,3,-1]`
- **Input:** `nums1 = [2,4], nums2 = [1,2,3,4]`
- **Expected Output:** `[3,-1]`

### 3. Largest Rectangle in Histogram - Hard
Given an array of integers `heights` representing the histogram's bar height where the width of each bar is `1`, return the area of the largest rectangle in the histogram.
- **Input:** `heights = [2,1,5,6,2,3]`
- **Expected Output:** `10`
- **Input:** `heights = [2,4]`
- **Expected Output:** `4`

---

<nav aria-label="Lecture navigation">

[Previous: Stacks & Expression Parsing](day-13-stacks-and-expression-parsing.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Queues, Circular Buffers & Design](day-15-queues-circular-buffers-and-design.md)

</nav>
