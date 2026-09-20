# Day 13: Sliding Window: Fixed Size

<nav aria-label="Lecture navigation">

[Previous: Two Pointers: Same-Direction / Fast & Slow](day-12-two-pointers-fast-and-slow.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Sliding Window: Variable Size](day-14-sliding-window-variable-size.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Recognize when a problem has a **Fixed-Size Window** constraint (contiguous subarray/substring of exact length $k$).
- Apply the **Subtract Left / Add Right** update rule to transition between adjacent windows in $O(1)$ time.
- Implement **Maximum Sum Subarray of Size K** in $O(n)$ time instead of $O(n \times k)$ brute force.
- Solve the **First Negative Integer in Every Window of Size K** using an index queue.
- Build rolling metrics and sliding rate-limiters in Node.js backend applications.

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md)
- [Day 11: Two Pointers: Opposing Pointers](day-11-two-pointers-opposing.md)
- [Day 12: Two Pointers: Same-Direction / Fast & Slow](day-12-two-pointers-fast-and-slow.md)

---

## Core Concepts

### 1. The Fixed Window Transition Rule

Suppose you have an array `[2, 1, 5, 1, 3, 2]` and need to find the maximum sum of any contiguous subarray of size $k = 3$.
The naive approach recalculates the sum of each window from scratch:
```text
Window 1: 2 + 1 + 5 = 8
Window 2: 1 + 5 + 1 = 7
Window 3: 5 + 1 + 3 = 9
Window 4: 1 + 3 + 2 = 6
Operations: (n - k + 1) * k = O(n * k)
```

Notice the overlap between Window 1 `[2, 1, 5]` and Window 2 `[1, 5, 1]`:
Both windows share `[1, 5]`.
Instead of recalculating the shared elements, **slide the window**:
$$\text{NewSum} = \text{OldSum} - \text{OutgoingElement} + \text{IncomingElement}$$

```text
Window 1: [ 2, 1, 5 ] 1, 3, 2  -> Sum = 8
             -2    +1
Window 2: 2 [ 1, 5, 1 ] 3, 2   -> Sum = 8 - 2 + 1 = 7
                -1    +3
Window 3: 2, 1 [ 5, 1, 3 ] 2   -> Sum = 7 - 1 + 3 = 9  <-- Maximum!
                   -5    +2
Window 4: 2, 1, 5 [ 1, 3, 2 ]  -> Sum = 9 - 5 + 2 = 6
```
Each slide takes exactly **$O(1)$ arithmetic operations**, turning the overall runtime into **$O(n)$**!

---

### 2. The 3-Step Fixed Window Template

1. **Initialize First Window**: Loop from index `0` to `k - 1` and accumulate the initial metric (sum, frequency map, or queue).
2. **Record Baseline**: Store the initial window's result as `maxResult`.
3. **Slide Through Remainder**: Loop index `i` from `k` to `n - 1`:
   - Add incoming item: `arr[i]`.
   - Subtract outgoing item: `arr[i - k]`.
   - Update `maxResult = Math.max(maxResult, currentMetric)`.

---

## Detailed Explanations & Node.js Relevance

### Rolling Averages & Rate Limiting in Backend Systems

In Node.js backend monitoring, APIs frequently track rolling metrics:
- **Rolling Error Rate**: Percentage of HTTP 5xx responses over the last 1,000 requests.
- **Fixed Window Rate Limiting**: Max 100 requests per 60-second window.

Recalculating metrics over an array of 1,000 items on every incoming HTTP request wastes CPU cycles. Using the sliding window update rule ($O(1)$ per request) ensures instantaneous response times.

---

## JavaScript Implementation & Tracing

### 1. Maximum Sum Subarray of Size K

```js
function maxSubarraySumFixed(nums, k) {
  if (nums.length < k || k <= 0) return 0;

  // Step 1: Compute sum of first window [0 ... k - 1]
  let currentSum = 0;
  for (let i = 0; i < k; i++) {
    currentSum += nums[i];
  }

  let maxSum = currentSum;

  // Step 2 & 3: Slide window from k to end of array
  for (let i = k; i < nums.length; i++) {
    // Subtract outgoing element (i - k) and add incoming element (i)
    currentSum = currentSum - nums[i - k] + nums[i];
    if (currentSum > maxSum) {
      maxSum = currentSum;
    }
  }

  return maxSum;
}
```

### 2. First Negative Integer in Every Window of Size K

Given array `arr` and window size `k`, find the first negative integer in every contiguous window of size `k`. If no negative exists, output `0`.

```js
function firstNegativeInWindow(arr, k) {
  const result = [];
  const negativeIndices = []; // Queue of indices holding negative numbers
  let queueHead = 0;

  for (let i = 0; i < arr.length; i++) {
    // Add current element if negative
    if (arr[i] < 0) {
      negativeIndices.push(i);
    }

    // Remove negative numbers that have fallen out of the window [i - k + 1 ... i]
    while (queueHead < negativeIndices.length && negativeIndices[queueHead] <= i - k) {
      queueHead++;
    }

    // Record answer once we have formed at least one full window of size k
    if (i >= k - 1) {
      if (queueHead < negativeIndices.length) {
        result.push(arr[negativeIndices[queueHead]]);
      } else {
        result.push(0);
      }
    }
  }

  return result;
}
```

### Trace: `maxSubarraySumFixed([2, 1, 5, 1, 3, 2], 3)`

| Loop Index `i` | Outgoing `i - k` (`nums[i-k]`) | Incoming `i` (`nums[i]`) | Formula | `currentSum` | `maxSum` |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Initial `0..2` | — | `[2, 1, 5]` | $2 + 1 + 5$ | 8 | 8 |
| `i = 3` | `i - 3 = 0` (`2`) | `i = 3` (`1`) | $8 - 2 + 1$ | 7 | 8 |
| `i = 4` | `i - 3 = 1` (`1`) | `i = 4` (`3`) | $7 - 1 + 3$ | 9 | **9** |
| `i = 5` | `i - 3 = 2` (`5`) | `i = 5` (`2`) | $9 - 5 + 2$ | 6 | 9 |

- **Time Complexity**: $O(n)$ — every element enters and exits the window once.
- **Auxiliary Space**: $O(1)$ extra space.

---

## Common Mistakes & Interview Traps

1. **Incorrect Outgoing Index**:
   ```js
   // WRONG: nums[i - k - 1] or nums[i - 1]
   // When window is of size k ending at index i, the outgoing element is at index: i - k
   ```
2. **Re-slicing Arrays inside the Loop**:
   ```js
   // WRONG: nums.slice(i, i + k).reduce((a, b) => a + b, 0);
   // slice() + reduce() takes O(k) time! Nested inside loop, total is O(n * k).
   ```
3. **Invalid `k` Bounds**:
   Always validate `if (nums.length < k || k <= 0)` before running loops to avoid `NaN` or infinite loops.

---

## Tricky Points & Edge Cases

- **Negative Numbers in Array**:
  Initialize `maxSum = currentSum` (the sum of the first window), NOT `maxSum = 0`. If all numbers are negative, initializing `maxSum = 0` produces an incorrect result of 0.
- **Window Size Equal to Array Length ($k = n$)**:
  The slide loop never executes; the algorithm correctly returns the sum of the whole array in $O(n)$ time.

---

## Practical Exercise

Implement `findMaxAverage(nums, k)` (LeetCode 643):
Find a contiguous subarray whose length is equal to $k$ that has the maximum average value and return this value.
- **Constraint**: $1 \le k \le n \le 10^5$.
- **Acceptance Criterion**: Must run in $O(n)$ time and $O(1)$ auxiliary space.

---

## Summary

- Fixed-size sliding windows maintain a continuous range of exactly $k$ elements.
- The state transition subtracts the item leaving the left edge and adds the item entering the right edge in $O(1)$ time.
- Queue-backed fixed windows allow tracking non-additive properties (like the first negative number or minimum/maximum element).
- Never re-slice or re-sum arrays inside sliding window loops.

---

## Cheat Sheet

### Fixed Window Blueprint
```js
let windowMetric = initialKSum;
let best = windowMetric;
for (let i = k; i < n; i++) {
  windowMetric += arr[i] - arr[i - k];
  best = Math.max(best, windowMetric);
}
return best;
```

---

## Interview Questions

### 1. Deep Definitions and Mental Models
**Question:** Why does the sliding window technique fail when negative numbers are introduced into *variable-size* window problems, but works perfectly fine in *fixed-size* window problems?
- **Expected answer shape:** In variable-size windows, the expansion/contraction decision relies on monotonicity (e.g. expanding increases sum, contracting decreases sum). Negative numbers break this monotonicity. In fixed-size windows, however, the window size is constant: we do not make expansion decisions, we simply subtract the exiting element and add the entering element mathematically, which works regardless of sign.

### 2. Predict the Output and Trace Execution
**Question:** What does this code return for `nums = [-1, -2, -3]`, `k = 2`?
```js
function test(nums, k) {
  let cur = nums[0] + nums[1];
  let max = 0;
  for (let i = k; i < nums.length; i++) {
    cur += nums[i] - nums[i - k];
    max = Math.max(max, cur);
  }
  return max;
}
```
- **Expected answer shape:** It incorrectly returns `0`. The maximum sum of any 2 elements is `-1 + (-2) = -3`. Because `max` was initialized to `0`, `Math.max(0, -5)` keeps `0`. `max` must be initialized to the first window's sum (`cur`), not `0`.

### 3. Implementation Exercise
**Question:** Implement `numOfSubarrays(arr, k, threshold)` (LeetCode 1343) that counts the number of sub-arrays of size $k$ and average greater than or equal to `threshold`.
- **Expected answer shape:**
```js
function numOfSubarrays(arr, k, threshold) {
  const targetSum = k * threshold;
  let sum = 0, count = 0;
  for (let i = 0; i < k; i++) sum += arr[i];
  if (sum >= targetSum) count++;
  for (let i = k; i < arr.length; i++) {
    sum += arr[i] - arr[i - k];
    if (sum >= targetSum) count++;
  }
  return count;
}
```

### 4. Debugging and Failure Analysis
**Question:** An engineer tracks the first negative number in a sliding window using an array queue: `queue.shift()` whenever the front element leaves the window. In a 500,000 element stream, the endpoint becomes extremely slow. Why?
- **Expected answer shape:** In JavaScript, `Array.prototype.shift()` has $O(m)$ time complexity because it shifts all remaining elements in memory. Calling `shift()` repeatedly degrades performance to $O(n \times m)$. Fix by using an index pointer (`let head = 0; head++`) to achieve $O(1)$ dequeue.

### 5. Design and Tradeoff Questions
**Question:** How does a fixed-window sliding counter compare to a leaky bucket algorithm for API rate limiting in Node.js?
- **Expected answer shape:** A fixed window sliding counter resets counts on discrete window boundaries, which can allow a "burst" of 2x traffic around boundary boundaries (e.g. 100 requests at 0:59 and 100 requests at 1:01). A leaky/token bucket algorithm smooths traffic over time by processing requests at a constant leak rate, preventing boundary burst anomalies.

### 6. Senior Follow-ups: Node.js Stream Chunking
**Question:** You need to compute a moving average over a continuous Node.js readable stream of sensor telemetry that never terminates. How do you implement this without leaking memory?
- **Expected answer shape:** Create a Node.js `Transform` stream. Maintain a circular ring buffer or a running total of the last $k$ values and a counter. As each chunk arrives, parse sensor floats, subtract the value leaving the ring buffer, add the incoming value, and push the new average downstream. Memory is bounded strictly to $O(k)$ regardless of stream duration.

<nav aria-label="Lecture navigation">

[Previous: Two Pointers: Same-Direction / Fast & Slow](day-12-two-pointers-fast-and-slow.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Sliding Window: Variable Size](day-14-sliding-window-variable-size.md)

</nav>
