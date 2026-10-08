# Day 13: Sliding Window: Fixed Size

<nav aria-label="Lecture navigation">

[Previous: Two Pointers: Same-Direction / Fast & Slow](day-12-two-pointers-fast-and-slow.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Sliding Window: Variable Size](day-14-sliding-window-variable-size.md)

</nav>
## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Asymptotic analysis and auxiliary memory.
- [Day 11: Two Pointers: Opposing Pointers](day-11-two-pointers-opposing.md) — Multi-pointer index traversal.
- [Day 12: Two Pointers: Same-Direction / Fast & Slow](day-12-two-pointers-fast-and-slow.md) — Same-direction pointer scanning.
---

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            FIXED SLIDING WINDOW TRANSITION PIPELINE                         │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Array: [ 2, 1, 5, 1, 3, 2 ],  k = 3

  Window 0 (Initial): [ 2, 1, 5 ] 1, 3, 2  ──> Sum = 2 + 1 + 5 = 8
                        -2    +1
  Window 1 (Slide 1): 2 [ 1, 5, 1 ] 3, 2   ──> Sum = 8 - 2 + 1 = 7
                           -1    +3
  Window 2 (Slide 2): 2, 1 [ 5, 1, 3 ] 2   ──> Sum = 7 - 1 + 3 = 9  <-- Maximum!
                              -5    +2
  Window 3 (Slide 3): 2, 1, 5 [ 1, 3, 2 ]  ──> Sum = 9 - 5 + 2 = 6

  • Instead of adding 3 numbers per window ((n - k + 1) * k operations),
    each step performs 1 subtraction and 1 addition -> O(n) total time!
```

## 1. The Fixed Window Transition Rule

When evaluating contiguous sequences of length $k$ across an array of length $n$:
- Brute-force re-evaluation recalculates the sum of every window from scratch, taking $(n - k + 1) \times k = O(n \cdot k)$ operations.
- Two adjacent windows share $k - 1$ common elements.
- Instead of re-summing the shared elements, we update the state in $O(1)$ time:
  $$\text{CurrentSum} = \text{CurrentSum} - \text{nums}[i - k] + \text{nums}[i]$$

```javascript
// Node.js code
"use strict";

const numbers = [2, 1, 5, 1, 3, 2];
const k = 3;

// ❌ ANTI-PATTERN: Re-slicing and reducing each window (O(n * k))
function maxSubarraySumSlow(nums, k) {
  let max = -Infinity;
  for (let i = 0; i <= nums.length - k; i++) {
    // slice() allocates a new array of size k; reduce() sums k elements!
    const windowSum = nums.slice(i, i + k).reduce((acc, val) => acc + val, 0);
    max = Math.max(max, windowSum);
  }
  return max;
}

// ✅ PATTERN: Fixed sliding window in O(1) transition time (O(n) total)
function maxSubarraySumFast(nums, k) {
  if (nums.length < k || k <= 0) return 0;

  // Step 1: Pre-compute the initial window [0 ... k - 1]
  let currentSum = 0;
  for (let i = 0; i < k; i++) {
    currentSum += nums[i];
  }

  // Initialize maximum with first window's sum (handles negative numbers)
  let maxSum = currentSum;

  // Step 2: Slide the window from index k to the end of the array
  for (let i = k; i < nums.length; i++) {
    currentSum = currentSum - nums[i - k] + nums[i];
    if (currentSum > maxSum) {
      maxSum = currentSum;
    }
  }

  return maxSum;
}

console.log("Slow result:", maxSubarraySumSlow(numbers, k)); // 9
console.log("Fast result:", maxSubarraySumFast(numbers, k)); // 9
```

---

## 2. Execution Trace: `maxSubarraySumFast([2, 1, 5, 1, 3, 2], 3)`

| Index `i` | Outgoing Index `i - k` (`nums[i-k]`) | Incoming Index `i` (`nums[i]`) | Arithmetic Formula | `currentSum` | `maxSum` |
|---|---|---|---|---|---|
| Initial `0..2` | — | `[2, 1, 5]` | $2 + 1 + 5$ | 8 | 8 |
| `i = 3` | `i - 3 = 0` (`2`) | `i = 3` (`1`) | $8 - 2 + 1$ | 7 | 8 |
| `i = 4` | `i - 3 = 1` (`1`) | `i = 4` (`3`) | $7 - 1 + 3$ | 9 | **9** |
| `i = 5` | `i - 3 = 2` (`5`) | `i = 5` (`2`) | $9 - 5 + 2$ | 6 | 9 |

- **Time Complexity:** $O(n)$ — each element enters the window once and exits once.
- **Auxiliary Space:** $O(1)$ — requires only two scalar accumulation variables.

---

## 3. Non-Additive Window Metrics: Queue-Assisted Tracking

Not all metrics can be updated using basic subtraction. For non-additive properties (such as finding the **First Negative Integer in Every Window of Size K**), maintain a queue of candidate indices:

```javascript
// Node.js code
function firstNegativeInWindow(arr, k) {
  const result = [];
  const negativeIndices = []; // Queue storing indices of negative numbers
  let queueHead = 0;          // Index pointer avoiding O(n) Array.shift()

  for (let i = 0; i < arr.length; i++) {
    // 1. Enqueue incoming negative number's index
    if (arr[i] < 0) {
      negativeIndices.push(i);
    }

    // 2. Dequeue elements that have fallen outside the active window [i - k + 1 ... i]
    while (queueHead < negativeIndices.length && negativeIndices[queueHead] <= i - k) {
      queueHead++;
    }

    // 3. Once at least one full window of size k is formed, record the result
    if (i >= k - 1) {
      if (queueHead < negativeIndices.length) {
        result.push(arr[negativeIndices[queueHead]]);
      } else {
        result.push(0); // No negative integer present in active window
      }
    }
  }

  return result;
}

const streamData = [12, -1, -7, 8, -15, 30, 16, 28];
console.log("First Negative per Window:", firstNegativeInWindow(streamData, 3));
// [ -1, -1, -7, -15, -15, 0 ]
```

---

## 4. Node.js Backend Application: Rolling Telemetry with Circular Buffers

In microservice health monitoring, calculating the rolling error rate over the last $k = 1,000$ HTTP requests on every incoming request is common.

Using an in-memory **Circular Ring Buffer** guarantees $O(1)$ update time and strictly bounded $O(k)$ memory without triggering garbage collection:

```javascript
// Node.js code
class RollingMetricTracker {
  constructor(windowSize) {
    this.size = windowSize;
    this.buffer = new Float64Array(windowSize); // Typed array: packed contiguous memory
    this.index = 0;
    this.count = 0;
    this.runningTotal = 0;
  }

  record(value) {
    if (this.count < this.size) {
      // Buffer not yet full: accumulate
      this.buffer[this.index] = value;
      this.runningTotal += value;
      this.count++;
    } else {
      // Buffer full: subtract outgoing old value, add incoming new value
      const outgoing = this.buffer[this.index];
      this.buffer[this.index] = value;
      this.runningTotal = this.runningTotal - outgoing + value;
    }

    this.index = (this.index + 1) % this.size;
  }

  getAverage() {
    return this.count === 0 ? 0 : this.runningTotal / this.count;
  }
}

const tracker = new RollingMetricTracker(3);
tracker.record(10);
tracker.record(20);
tracker.record(30);
console.log("Average of first 3:", tracker.getAverage()); // 20
tracker.record(40); // 10 is evicted
console.log("Average after 4th:", tracker.getAverage());  // (20 + 30 + 40) / 3 = 30
```

---

## Tricky Points and Edge Cases

### 1. The Negative Numbers Initialization Bug
When tracking the maximum window sum, initializing `let maxSum = 0` causes incorrect results if all elements are negative:

```javascript
// Node.js code
const allNegative = [-5, -2, -8, -1];
const windowSize = 2;

// ❌ BUG: Initializing to 0
let buggyMax = 0;
// First window sum is -7. Math.max(0, -7) keeps 0, which is incorrect!

// ✅ FIX: Initialize to the sum of the first window
let safeMax = allNegative[0] + allNegative[1]; // -7
```

### 2. The `Array.prototype.shift()` Event-Loop Trap
In queue-backed sliding windows (such as finding the first negative number or sliding window maximum), using `queue.shift()` inside the loop runs in $O(k)$ time per slide, degrading the entire algorithm to $O(n \cdot k)$. Always use an index pointer (`queueHead++`) or a linked list queue structure.

### 3. Window Size Exceeding Array Length ($k > n$)
If $k > \text{nums.length}$ or $k \le 0$, no valid window can ever be formed. Always include a guard check: `if (nums.length < k || k <= 0) return 0;`.

---

## Hands-On Exercise

### Scenario
You are developing an analytics worker for a stock trading platform. You are given an array `prices` and an integer `k`. You must find the maximum average value among all contiguous subarrays of length $k$ (LeetCode 643: Maximum Average Subarray I).

### Buggy Code
```javascript
// Node.js code
function findMaxAverageBuggy(nums, k) {
  // ❌ Bug 1: Calculates average on every step, introducing floating point rounding drift
  // ❌ Bug 2: Initialized maxAverage to 0, failing on negative numbers
  let maxAverage = 0;
  for (let i = 0; i <= nums.length - k; i++) {
    let sum = 0;
    for (let j = i; j < i + k; j++) {
      sum += nums[j];
    }
    maxAverage = Math.max(maxAverage, sum / k);
  }
  return maxAverage;
}
```

### Acceptance Criteria
1. Execute in strictly $O(n)$ time using the fixed sliding window pattern.
2. Auxiliary space must be strictly $O(1)$.
3. Compute the floating-point division by $k$ **only once** at the very end to prevent precision drift and minimize CPU instructions.
4. Correctly handle arrays with all negative numbers and arrays where $k = n$.

### Solution Code

```javascript
// Node.js code
import assert from "node:assert/strict";

function findMaxAverage(nums, k) {
  if (nums.length < k || k <= 0) return 0;

  // Step 1: Pre-compute the sum of the initial window of size k
  let windowSum = 0;
  for (let i = 0; i < k; i++) {
    windowSum += nums[i];
  }

  let maxSum = windowSum;

  // Step 2: Slide the window across the remaining elements
  for (let i = k; i < nums.length; i++) {
    windowSum = windowSum - nums[i - k] + nums[i];
    if (windowSum > maxSum) {
      maxSum = windowSum;
    }
  }

  // Step 3: Perform division once at the end
  return maxSum / k;
}

// Verification Tests
assert.equal(findMaxAverage([1, 12, -5, -6, 50, 3], 4), 12.75); // (12 - 5 - 6 + 50) / 4 = 12.75
assert.equal(findMaxAverage([5], 1), 5.0);
assert.equal(findMaxAverage([-1], 1), -1.0);
assert.equal(findMaxAverage([-5, -2, -8, -1], 2), -3.5); // (-5 + -2) = -7; (-2 + -8) = -10; (-8 + -1) = -9 -> max -7 / 2 = -3.5

console.log("✅ All Maximum Average Subarray fixed-window tests passed successfully!");
```

### Solution Explanation

1. **Integer Arithmetic Maximization:** By keeping `maxSum` as a raw integer sum throughout the loop, we avoid $n - k$ floating-point division operations.
2. **Precision and Performance:** Dividing `maxSum / k` once upon return guarantees exact precision and optimal execution speed.

---

## Summary

- Fixed-size sliding windows track a continuous range of exactly $k$ elements across an array.
- The state transition subtracts the outgoing element (`nums[i - k]`) and adds the incoming element (`nums[i]`) in $O(1)$ time.
- For tracking non-additive elements (such as negative numbers), use an index queue with a `head` index pointer to prevent $O(k)$ `shift()` copying penalties.
- Always initialize max-tracking accumulators with the first window's metric, avoiding the $0$-initialization bug with negative numbers.
- In Node.js backend services, typed circular ring buffers provide $O(1)$ rolling telemetry updates with zero heap allocation churn.

---

## Cheat Sheet

### Fixed Window Blueprint
```javascript
let currentMetric = initialKSum;
let best = currentMetric;

for (let i = k; i < n; i++) {
  currentMetric = currentMetric - arr[i - k] + arr[i];
  best = Math.max(best, currentMetric);
}

return best;
```

### Common Pitfalls
- **Incorrect Outgoing Index:** Writing `nums[i - k - 1]` instead of `nums[i - k]`.
- **In-Loop Slicing:** Calling `.slice(i, i + k)` inside the loop turns an $O(n)$ algorithm into $O(n \cdot k)$.
- **Negative Number Bug:** Initializing `maxSum = 0` produces false outputs when all window sums are negative.
- **Floating-Point Division in Loops:** Performing `/ k` inside the loop instead of maximizing integer sum and dividing once upon return.

---

## Interview Questions

### 1. Why does the sliding window technique fail when negative numbers are introduced into *variable-size* window problems, but works perfectly fine in *fixed-size* window problems?

**Question:** Compare how negative numbers impact monotonicity in fixed-size versus variable-size sliding window algorithms.

**Answer:** 
The fundamental distinction lies in **how the window boundaries move**:
1. **Variable-Size Windows:**
   - In variable-size windows (e.g., finding the shortest subarray with sum $\ge S$), boundary decisions rely strictly on **monotonicity**: expanding the right pointer must strictly increase the window sum, and contracting the left pointer must strictly decrease the window sum.
   - When negative numbers are present, expanding right can decrease the sum, and shrinking left can increase the sum. The algorithm can no longer make greedy decisions about whether to expand or contract, causing variable-size sliding windows to fail (requiring Prefix Sum + Hash Map or Monotonic Deque instead).
2. **Fixed-Size Windows:**
   - In fixed-size windows, the window boundary never relies on monotonicity to make expansion/contraction choices. The window size is fixed at $k$.
   - The transition is a pure algebraic identity:
     $$\text{NewSum} = \text{OldSum} - \text{nums}[i - k] + \text{nums}[i]$$
   - Addition and subtraction are mathematically valid regardless of whether elements are positive, negative, or zero. Thus, fixed sliding windows remain valid in all numeric domains.

---

### 2. What does this code return for `nums = [-1, -2, -3]`, `k = 2`, and what causes the bug?

**Question:** Identify the logical bug and execution outcome of the following snippet:
```javascript
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

**Answer:**
The function returns `0`, which is incorrect.

**Explanation:**
1. For `nums = [-1, -2, -3]` and $k = 2$:
   - Window 0 (`[-1, -2]`): sum is $-3$.
   - Window 1 (`[-2, -3]`): sum is $-5$.
2. The true maximum subarray sum of size 2 is $-3$.
3. However, `max` was initialized to `0`. On the first iteration of the loop (`i = 2`):
   - `cur` becomes $-3 - (-1) + (-3) = -5$.
   - `Math.max(0, -5)` evaluates to `0`.
4. The loop terminates, returning `0`.
- **Fix:** Initialize `max = cur` (the sum of the first window) rather than `0`.

---

### 3. How do you implement `numOfSubarrays(arr, k, threshold)` in $O(n)$ time while avoiding floating-point rounding errors?

**Question:** Write an optimal JavaScript function that counts how many subarrays of size $k$ have an average $\ge \text{threshold}$ without performing floating-point division in the loop.

**Answer:** 
Instead of checking `(windowSum / k) >= threshold`, multiply the threshold by $k$ once: $\text{targetSum} = k \times \text{threshold}$. This converts the comparison to a faster and precision-safe integer check: `windowSum >= targetSum`.

```javascript
// Node.js code
function numOfSubarrays(arr, k, threshold) {
  const targetSum = k * threshold; // Convert to integer comparison
  let currentSum = 0;
  let count = 0;

  // Initialize first window
  for (let i = 0; i < k; i++) {
    currentSum += arr[i];
  }
  if (currentSum >= targetSum) count++;

  // Slide window across remainder
  for (let i = k; i < arr.length; i++) {
    currentSum = currentSum - arr[i - k] + arr[i];
    if (currentSum >= targetSum) {
      count++;
    }
  }

  return count;
}
```
- **Time Complexity:** $O(n)$.
- **Auxiliary Space:** $O(1)$.

---

### 4. How does a Fixed-Window sliding counter compare to a Leaky/Token Bucket algorithm for API rate limiting in Node.js, and what is the Boundary Burst Problem?

> **Boundary Burst Problem**: A flaw in fixed-window rate limiting where double the traffic limit is admitted across window boundary transitions.

**Question:** Analyze the architectural difference between fixed-window rate limiting and leaky/token bucket rate limiting in a Node.js API gateway.

**Answer:** 
**Fixed-Window Rate Limiting:**
- Divides time into rigid discrete buckets (e.g., 60-second intervals from 12:00:00 to 12:01:00).
- Tracks a counter in memory or Redis. If counter $> 100$, requests are rejected until the clock resets at 12:01:00.
- **The Boundary Burst Problem:** If an attacker sends 100 requests at 12:00:59 (the end of window 1) and another 100 requests at 12:01:01 (the beginning of window 2), the system accepts 200 requests within a 2-second span. This can overwhelm backend databases.

**Token / Leaky Bucket Alternative:**
- Instead of resetting counters on discrete time boundaries, tokens are continuously added to a bucket at a constant fill rate (e.g., 100 tokens per minute $\approx 1.67$ tokens/sec).
- Each request consumes 1 token. Requests exceeding bucket capacity are rejected or queued.
- This enforces smooth traffic shaping, strictly preventing bursts across arbitrary time intervals.

---

<nav aria-label="Lecture navigation">

[Previous: Two Pointers: Same-Direction / Fast & Slow](day-12-two-pointers-fast-and-slow.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Sliding Window: Variable Size](day-14-sliding-window-variable-size.md)

</nav>
