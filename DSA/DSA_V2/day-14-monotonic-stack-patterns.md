# Day 14: Monotonic Stack Patterns

<nav aria-label="Lecture navigation">

[Previous: Stacks & Expression Parsing](day-13-stacks-and-expression-parsing.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Queues, Circular Buffers & Design](day-15-queues-circular-buffers-and-design.md)

</nav>

---

## 1. Monotonic Stacks Foundation

A **Monotonic Stack** is a specialized stack data structure that enforces a strict ordering invariant among its stored elements at all times. The elements inside the stack are preserved in either strictly increasing or strictly decreasing order from bottom to top. Whenever an incoming element threatens to break this ordering invariant, existing elements are popped until the invariant is restored.

Imagine standing on a flat plain looking toward a city skyline. In front of you is a building 50 meters tall, and behind it sits a smaller building 30 meters tall. You can see both rooftops. 

If construction workers suddenly erect a towering skyscraper 80 meters high directly behind them, the new skyscraper completely obstructs your line of sight to both shorter buildings. From your perspective, the 80-meter tower dominates the view. The 80-meter tower is the **Next Greater Element** for both the 30-meter and 50-meter buildings.

```text
MONOTONIC DECREASING STACK:
Stream: [ 73, 74, 75, 71, 69, 72 ]

Current stack state after processing 75, 71, 69:
[ Bottom: 75 | 71 | Top: 69 ]  <-- Strictly decreasing

Element 72 arrives:
- 72 > 69? Violates decreasing order! Pop 69 (Next Greater for 69 is 72).
- 72 > 71? Violates decreasing order! Pop 71 (Next Greater for 71 is 72).
- 72 <= 75? Invariant preserved. Push 72!

New stack state:
[ Bottom: 75 | Top: 72 ]
```

A basic monotonic decreasing stack for finding next greater values in JavaScript:

```javascript
function findNextGreater(nums) {
  const n = nums.length;
  const result = new Array(n).fill(-1);
  const stack = []; // Stores indices

  for (let i = 0; i < n; i++) {
    // Maintain monotonic decreasing order
    while (stack.length > 0 && nums[i] > nums[stack[stack.length - 1]]) {
      const poppedIdx = stack.pop();
      result[poppedIdx] = nums[i]; // Resolved by nums[i]
    }
    stack.push(i);
  }

  return result;
}

console.log(findNextGreater([2, 1, 2, 4, 3])); // [ 4, 2, 4, -1, -1 ]
```

### 1.1 Decreasing vs Increasing Stacks

The choice between a decreasing stack and an increasing stack depends on whether you seek larger or smaller boundary elements:

```text
MONOTONIC DECREASING STACK (Bottom to Top: Large -> Small)
- Values: [ 100, 80, 50, 20 ]
- Trigger to pop: Incoming element is GREATER than top (incoming > top).
- Resolves: Next Greater Element (to the right).

MONOTONIC INCREASING STACK (Bottom to Top: Small -> Large)
- Values: [ 10, 25, 40, 70 ]
- Trigger to pop: Incoming element is SMALLER than top (incoming < top).
- Resolves: Next Smaller Element (to the right).
```

```javascript
// Monotonic Increasing Stack resolving Next Smaller Element
function findNextSmaller(nums) {
  const n = nums.length;
  const result = new Array(n).fill(-1);
  const stack = [];

  for (let i = 0; i < n; i++) {
    while (stack.length > 0 && nums[i] < nums[stack[stack.length - 1]]) {
      const poppedIdx = stack.pop();
      result[poppedIdx] = nums[i];
    }
    stack.push(i);
  }

  return result;
}

console.log(findNextSmaller([4, 5, 2, 10, 8])); // [ 2, 2, -1, 8, -1 ]
```

> [!NOTE]
> Self-Check: Why do monotonic stacks almost always store array indices rather than the raw array values?
> Answer: Storing the index preserves both the original array position and allows instant distance calculation (`currentIndex - poppedIndex`), while the value remains accessible via `nums[poppedIndex]`.

### 1.2 Aggregate Analysis Proof

At first glance, placing a `while` loop inside a `for` loop looks like $O(n^2)$ quadratic complexity. However, an **Aggregate Analysis** proves it is strictly linear $O(n)$:

```text
AMORTIZED COST ACCOUNTING:
Let input size be n.

1. Outer for-loop:
   Runs exactly n times (i = 0 to n - 1).
   Performs exactly 1 push() per iteration.
   Total pushes across entire algorithm = exactly n.

2. Inner while-loop:
   Performs 1 pop() per iteration.
   INVARIANT: An element can only be popped if it was previously pushed.
   Since only n elements were ever pushed, the while loop can execute
   its pop() at most n times ACROSS THE ENTIRE LIFETIME OF THE PROGRAM.

Total operations: n pushes + (at most n pops) <= 2n operations.
Time Complexity: O(2n) = O(n).
```

> [!NOTE]
> Self-Check: If an array is already sorted in descending order `[5, 4, 3, 2, 1]`, how many times does the `while` loop pop in a monotonic decreasing stack?
> Answer: Zero times during the loop. All elements are pushed without any pops, resulting in exactly $n$ pushes and $0$ pops ($n$ total operations).

### 1.3 V8 SMI Memory Packing

In high-performance Node.js code, the way the output array is allocated directly affects V8 engine optimization:

```javascript
// ✅ OPTIMAL: Pre-allocated contiguous SMI (Small Integer) array
const result = new Array(n).fill(-1);

// ❌ SLOWER: Dynamically expanding holey array
const result = [];
// ... later in loop: result[poppedIdx] = nums[i]; (causes HOLEY_ELEMENTS)
```

When initialized with `new Array(n).fill(-1)`, V8 allocates a flat contiguous C-style memory block typed as `PACKED_SMI_ELEMENTS`. If you instead assign indices out of order into an empty array `[]`, V8 converts the structure to `HOLEY_ELEMENTS`, forcing boundary and prototype chain lookups on subsequent reads.

### 1.4 Monotonic Stack Invariants Reference

| Stack Type | Internal Ordering (Bottom $\to$ Top) | Pops When | Primary Use Case |
| :--- | :--- | :--- | :--- |
| **Monotonic Decreasing** | Strictly decreasing ($100, 80, 50, 20$) | `current > stack.top()` | Next Greater Element, Daily Temperatures |
| **Monotonic Decreasing (Non-Strict)**| Decreasing or equal ($100, 80, 80, 20$)| `current > stack.top()` | Stock Span, Online Stock Spanner |
| **Monotonic Increasing** | Strictly increasing ($10, 25, 40, 70$) | `current < stack.top()` | Next Smaller Element, Histogram Boundaries |
| **Monotonic Increasing (Non-Strict)**| Increasing or equal ($10, 25, 25, 70$)| `current < stack.top()` | Sliding Window Minimum bounds |

---

## 2. Monotonic Stack Patterns

### 2.1 Pattern Family

Monotonic stack problems fall into three architectural categories:

- **Next / Previous Greater Element**: Finding the first larger element to the right or left. Uses a **Decreasing Stack**.
- **Next / Previous Smaller Element**: Finding the first smaller element to the right or left. Uses an **Increasing Stack**.
- **Bounded Geometric Spans**: Using left and right smaller boundaries to calculate areas of rectangles beneath histograms or trapped water volumes.

### 2.2 Pattern Recognition Table

| Problem Trigger / Keywords | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| "Next greater element / First larger to right" | First index $j > i$ where $nums[j] > nums[i]$ | Monotonic Decreasing Stack |
| "Days until warmer temperature" | Distance ($j - i$) to first larger element | Monotonic Decreasing Stack storing indices |
| "Consecutive days price was less than or equal" | Distance to previous greater element | Monotonic Decreasing Stack storing `[price, span]` |
| "Largest rectangle in histogram" | Left and right smaller boundaries for each bar | Monotonic Increasing Stack calculating widths |
| "Trapping rain water" | Bounding walls holding trapped liquid pools | Monotonic Decreasing Stack tracking basins |

### 2.3 When to Use vs When NOT to Use

- **When to Use**:
  - The problem asks for the *nearest* or *first* greater or smaller element in an array.
  - You need to determine the span or range over which an element is the minimum or maximum.
  - Brute force requires scanning rightward from every index with nested loops ($O(n^2)$).
  - Calculating rectangular areas constrained by neighboring heights.

- **When NOT to Use**:
  - The problem asks for global minimum or maximum across the entire array (use a single variable scan).
  - The problem asks for the $k$-th largest element overall (use a Heap or Quickselect).
  - Elements do not preserve sequential positional order (e.g. arbitrary subsets).

### 2.4 The $10^7$ Operations Rule

A naive nested loop comparing every element to all future elements takes $O(n^2)$ time. For $n = 10^5$, this requires $10^{10}$ operations, freezing Node.js for several seconds.

A Monotonic Stack reduces this to $2n$ operations. For $n = 10^5$, $2 \times 10^5 \ll 10^7$, completing in under 20 milliseconds.

---

## 3. Problem Walkthroughs

### 3.1 Next Greater Element I

#### 3.1.1 Problem Statement
The **next greater element** of some element `x` in an array is the first greater element that is to the right of `x` in the same array.

You are given two distinct integer arrays `nums1` and `nums2`, where `nums1` is a subset of `nums2`.

For each `0 <= i < nums1.length`, find the index `j` such that `nums1[i] == nums2[j]` and determine the next greater element of `nums2[j]` in `nums2`. If there is no next greater element, the answer for this query is `-1`.

Return an array `ans` of length `nums1.length` such that `ans[i]` is the next greater element as described above.

```text
Input: nums1 = [4, 1, 2], nums2 = [1, 3, 4, 2]
Output: [-1, 3, -1]
Explanation:
For 4 in nums2: No greater element to the right -> -1
For 1 in nums2: Next greater element to the right is 3
For 2 in nums2: No greater element to the right -> -1

Input: nums1 = [2, 4], nums2 = [1, 2, 3, 4]
Output: [3, -1]
```

#### 3.1.2 How to Think About It
Imagine inspecting items along an assembly line: `nums2 = [1, 3, 4, 2]`. You hold a clipboard where you want to write down the answer for each number.

You place items onto a holding tray (the stack). 
1. Pick up `1`. Put it on the tray.
2. Pick up `3`. Look at the tray: `3 > 1`! That means `3` is the first larger number to the right of `1`. 
   - Record in your notebook: `1 -> 3`.
   - Take `1` off the tray.
   - Put `3` on the tray.
3. Pick up `4`. Look at the tray: `4 > 3`! 
   - Record in your notebook: `3 -> 4`.
   - Take `3` off the tray.
   - Put `4` on the tray.
4. Pick up `2`. Look at the tray: `2 < 4`. Place `2` on top of `4`.
5. Assembly line is finished. The items remaining on the tray (`4` and `2`) never saw a larger item to their right. Their answer remains `-1`.

Now check `nums1 = [4, 1, 2]`. Simply read the recorded answers from your notebook!

```text
Tray Trace on nums2 = [1, 3, 4, 2]:
1. Read 1: Stack [ 1 ]
2. Read 3: 3 > 1 -> Map: { 1: 3 }, Pop 1, Push 3 -> Stack [ 3 ]
3. Read 4: 4 > 3 -> Map: { 1: 3, 3: 4 }, Pop 3, Push 4 -> Stack [ 4 ]
4. Read 2: 2 <= 4 -> Stack [ 4, 2 ]
Remaining in stack: 4 and 2 -> Map values default to -1.
```

#### 3.1.3 Brute Force Approach & Bottleneck
A brute-force solution searches for each `nums1[i]` inside `nums2`, then scans rightward to find the first larger value:

```javascript
function nextGreaterElementBrute(nums1, nums2) {
  const result = [];
  for (let i = 0; i < nums1.length; i++) {
    const target = nums1[i];
    let idx = nums2.indexOf(target);
    let found = -1;
    for (let j = idx + 1; j < nums2.length; j++) {
      if (nums2[j] > target) {
        found = nums2[j];
        break;
      }
    }
    result.push(found);
  }
  return result;
}
```

The bottleneck is repeated rightward scanning. For each of the $m$ queries, scanning up to $n$ elements yields $O(m \times n)$ runtime. On large arrays, this quadratic work causes noticeable slowdowns.

#### 3.1.4 The Pattern Insight
Precompute the next greater element for every item in `nums2` in a single pass using a **Monotonic Decreasing Stack**. Store each resolved pair in a hash map `nextGreaterMap.set(poppedVal, currentVal)`. 

Once `nums2` is processed in $O(n)$ time, map each value in `nums1` to its precomputed answer in $O(1)$ time.

#### 3.1.5 Pseudocode
```text
function nextGreaterElement(nums1, nums2):
  stack = empty array
  map = empty hash map

  for each num in nums2:
    while stack not empty AND num > stack.top():
      popped = stack.pop()
      map.set(popped, num)
    stack.push(num)

  result = empty array
  for each target in nums1:
    result.push(map.get(target) ?? -1)

  return result
```

#### 3.1.6 Optimal Solution

```javascript
function nextGreaterElement(nums1, nums2) {
  const nextGreaterMap = new Map();
  const stack = []; // Monotonic decreasing stack of values

  for (let i = 0; i < nums2.length; i++) {
    const current = nums2[i];

    // While current element is greater than the top of the stack,
    // current is the Next Greater Element for that top element
    while (stack.length > 0 && current > stack[stack.length - 1]) {
      const smaller = stack.pop();
      nextGreaterMap.set(smaller, current);
    }

    stack.push(current);
  }

  // Map each query in nums1 to its precomputed next greater value
  const result = new Array(nums1.length);
  for (let i = 0; i < nums1.length; i++) {
    result[i] = nextGreaterMap.get(nums1[i]) ?? -1;
  }

  return result;
}

// Example runs
console.log(nextGreaterElement([4, 1, 2], [1, 3, 4, 2])); // [ -1, 3, -1 ]
console.log(nextGreaterElement([2, 4], [1, 2, 3, 4]));       // [ 3, -1 ]
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Forgetting to handle remaining elements in stack
function buggyNextGreater(nums1, nums2) {
  const map = {};
  const stack = [];
  for (const x of nums2) {
    while (stack.length && x > stack[stack.length - 1]) {
      map[stack.pop()] = x;
    }
    stack.push(x);
  }
  // BUG: If target value is 0 and map[0] is undefined,
  // map[val] || -1 returns -1 for 0 even if map[0] had a valid answer!
  return nums1.map(x => map[x] || -1);
}

console.log(buggyNextGreater([0], [0, 5])); // Returns -1 instead of 5 if 0 is truthy-checked!
```

#### 3.1.8 Complexity Derivation
- **Time Complexity**: $O(n + m)$, where $n$ is the length of `nums2` and $m$ is the length of `nums1`. Each element of `nums2` is pushed and popped at most once ($O(n)$). Querying the map for $m$ elements takes $O(m)$ time.
- **Auxiliary Space Complexity**: $O(n)$. The stack and hash map store at most $n$ elements.

---

### 3.2 Daily Temperatures

#### 3.2.1 Problem Statement
Given an array of integers `temperatures` represents the daily temperatures, return an array `answer` such that `answer[i]` is the number of days you have to wait after the $i$-th day to get a warmer temperature. If there is no future day for which this is possible, keep `answer[i] == 0` instead.

```text
Input: temperatures = [73, 74, 75, 71, 69, 72, 76, 73]
Output: [1, 1, 4, 2, 1, 1, 0, 0]

Input: temperatures = [30, 40, 50, 60]
Output: [1, 1, 1, 0]

Input: temperatures = [30, 60, 90]
Output: [1, 1, 0]
```

#### 3.2.2 How to Think About It
Imagine recording daily temperatures on a calendar. For each day, you write the day number on a sticky note and place it into a waiting column.

On Day 0, temperature is 73. Stick note `Day 0 (73)` on the wall.
On Day 1, temperature is 74. 
- Look at the wall: 74 is warmer than 73!
- Day 0 only waited `1 - 0 = 1` day. Pull down note for Day 0 and write `1` in the calendar.
- Stick note `Day 1 (74)` on the wall.

On Day 2, temperature is 75. 75 is warmer than 74. Day 1 waited `2 - 1 = 1` day. Pull down Day 1. Stick Day 2.
On Day 3, temperature is 71 (cooler). Stick Day 3.
On Day 4, temperature is 69 (cooler). Stick Day 4.
On Day 5, temperature is 72!
- 72 is warmer than Day 4 (69)! Day 4 waited `5 - 4 = 1` day. Pull down Day 4.
- 72 is also warmer than Day 3 (71)! Day 3 waited `5 - 3 = 2` days. Pull down Day 3.
- 72 is cooler than Day 2 (75). Stop popping. Stick Day 5.

```text
Wall Trace:
Day 3 (71) and Day 4 (69) are waiting.
Day 5 (72) arrives:
  72 > 69 -> Day 4 waits 5 - 4 = 1 day
  72 > 71 -> Day 3 waits 5 - 3 = 2 days
Calendar updated instantly!
```

#### 3.2.3 Brute Force Approach & Bottleneck
A brute-force solution checks every day against all subsequent days with a nested loop:

```javascript
function dailyTemperaturesBrute(temperatures) {
  const n = temperatures.length;
  const answer = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (temperatures[j] > temperatures[i]) {
        answer[i] = j - i;
        break;
      }
    }
  }
  return answer;
}
```

The bottleneck is worst-case inputs with descending temperatures (e.g. `[100, 99, 98, ..., 1]`). For $n = 100,000$, the nested loops execute $\approx n^2 / 2 \approx 5 \times 10^9$ iterations, causing severe CPU throttling.

#### 3.2.4 The Pattern Insight
Use a **Monotonic Decreasing Stack storing day indices**. Day indices waiting for a warmer temperature remain in decreasing order of their temperatures. 

When a warmer day `currDay` arrives, it resolves all colder pending days on top of the stack. The wait time is simply the difference between indices: `currDay - prevDay`.

#### 3.2.5 Pseudocode
```text
function dailyTemperatures(temperatures):
  n = length of temperatures
  answer = array of size n filled with 0
  stack = empty array (stores day indices)

  for currDay from 0 to n - 1:
    while stack not empty AND temperatures[currDay] > temperatures[stack.top()]:
      prevDay = stack.pop()
      answer[prevDay] = currDay - prevDay
    stack.push(currDay)

  return answer
```

#### 3.2.6 Optimal Solution

```javascript
function dailyTemperatures(temperatures) {
  const n = temperatures.length;
  // Pre-allocate contiguous SMI array filled with default 0
  const answer = new Array(n).fill(0);
  const stack = []; // Stores day indices

  for (let currDay = 0; currDay < n; currDay++) {
    const currentTemp = temperatures[currDay];

    // Resolve any days waiting for a warmer temperature
    while (
      stack.length > 0 &&
      currentTemp > temperatures[stack[stack.length - 1]]
    ) {
      const prevDay = stack.pop();
      answer[prevDay] = currDay - prevDay;
    }

    stack.push(currDay);
  }

  return answer;
}

// Example runs
console.log(dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73])); // [ 1, 1, 4, 2, 1, 1, 0, 0 ]
console.log(dailyTemperatures([30, 40, 50, 60]));                   // [ 1, 1, 1, 0 ]
console.log(dailyTemperatures([30, 60, 90]));                       // [ 1, 1, 0 ]
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Storing values instead of indices loses distance information
function buggyDailyTemperatures(temperatures) {
  const stack = [];
  const answer = [];
  for (const t of temperatures) {
    // BUG: Storing values on stack means we cannot calculate
    // the elapsed day difference (j - i)!
    while (stack.length && t > stack[stack.length - 1]) {
      stack.pop();
    }
    stack.push(t);
  }
  return answer;
}
```

#### 3.2.8 Complexity Derivation
- **Time Complexity**: $O(n)$. Each day index is pushed onto the stack exactly once and popped at most once. The amortized runtime across $n$ days is strictly linear.
- **Auxiliary Space Complexity**: $O(n)$. In the worst case where temperatures strictly decrease, the stack holds all $n$ indices.

---

### 3.3 Largest Rectangle in Histogram

#### 3.3.1 Problem Statement
Given an array of integers `heights` representing the histogram's bar height where the width of each bar is `1`, return the area of the largest rectangle in the histogram.

```text
Input: heights = [2, 1, 5, 6, 2, 3]
Output: 10
Explanation: The largest rectangle is formed by bars [5, 6] with height 5 and width 2 (area = 5 * 2 = 10).

Input: heights = [2, 4]
Output: 4
```

#### 3.3.2 How to Think About It
Imagine a row of wooden fence posts of varying heights standing on the ground. You want to stretch a rectangular banner across some consecutive posts.

For any specific post of height $H$:
- How far can a banner of height $H$ stretch to the left? It stretches until it hits a post strictly shorter than $H$.
- How far can it stretch to the right? It stretches until it hits a post strictly shorter than $H$.
- The total width is the distance between these two shorter boundaries minus 1.

If you can find the **first smaller post to the left** and the **first smaller post to the right** for every post, you can compute the maximum rectangle each post can support, and take the global maximum!

```text
Heights: [ 2, 1, 5, 6, 2, 3 ]
For bar 5 (index 2, height 5):
- Left boundary post shorter than 5: bar 1 at index 1.
- Right boundary post shorter than 5: bar 2 at index 4.
- Width = rightBoundary - leftBoundary - 1 = 4 - 1 - 1 = 2.
- Area = height * width = 5 * 2 = 10!
```

#### 3.3.3 Brute Force Approach & Bottleneck
A brute-force solution picks every bar $i$ and expands left and right until encountering shorter bars:

```javascript
function largestRectangleAreaBrute(heights) {
  let maxArea = 0;
  for (let i = 0; i < heights.length; i++) {
    const h = heights[i];
    let left = i;
    while (left >= 0 && heights[left] >= h) left--;
    let right = i;
    while (right < heights.length && heights[right] >= h) right++;
    const width = right - left - 1;
    maxArea = Math.max(maxArea, h * width);
  }
  return maxArea;
}
```

The bottleneck is expanding left and right for every bar, taking $O(n^2)$ time. On arrays of size $n = 10^5$, this quadratic scanning exceeds execution timeouts.

#### 3.3.4 The Pattern Insight
Use a **Monotonic Increasing Stack storing indices**.

As long as bar heights are increasing, bars cannot yet determine their right boundary. 
When a shorter bar arrives at index `i`, it serves as the **right smaller boundary** for the taller bar sitting on top of the stack!

When that taller bar is popped:
1. Its height is `heights[poppedIdx]`.
2. Its right smaller boundary is `i`.
3. Its left smaller boundary is the **new top of the stack** (the index sitting right below it)!
4. Width is `i - leftSmaller - 1` (or simply `i` if the stack is now empty).

To ensure all bars remaining on the stack are eventually processed, append a sentinel bar of height `0` at the end of the array.

#### 3.3.5 Pseudocode
```text
function largestRectangleArea(heights):
  stack = empty array (stores indices)
  maxArea = 0
  n = length of heights

  for i from 0 to n:
    // When i == n, use sentinel height 0 to flush remaining bars
    currentHeight = heights[i] if i < n else 0

    while stack not empty AND currentHeight < heights[stack.top()]:
      poppedIndex = stack.pop()
      h = heights[poppedIndex]
      width = i if stack is empty else (i - stack.top() - 1)
      maxArea = max(maxArea, h * width)

    stack.push(i)

  return maxArea
```

#### 3.3.6 Optimal Solution

```javascript
function largestRectangleArea(heights) {
  const stack = []; // Monotonic increasing stack of indices
  let maxArea = 0;
  const n = heights.length;

  // Iterate up to n; index n acts as a 0-height sentinel to flush the stack
  for (let i = 0; i <= n; i++) {
    const currentHeight = i < n ? heights[i] : 0;

    while (
      stack.length > 0 &&
      currentHeight < heights[stack[stack.length - 1]]
    ) {
      const poppedIdx = stack.pop();
      const height = heights[poppedIdx];

      // If stack is empty, poppedIdx was the smallest bar seen so far, spanning width i
      const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;

      maxArea = Math.max(maxArea, height * width);
    }

    stack.push(i);
  }

  return maxArea;
}

// Example runs
console.log(largestRectangleArea([2, 1, 5, 6, 2, 3])); // 10
console.log(largestRectangleArea([2, 4]));             // 4
console.log(largestRectangleArea([1, 1]));             // 2
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Forgetting to flush remaining bars on the stack
function buggyLargestRectangle(heights) {
  const stack = [];
  let maxArea = 0;
  // BUG: Without processing remaining bars after loop ends,
  // strictly increasing histograms like [1, 2, 3, 4] return 0!
  for (let i = 0; i < heights.length; i++) {
    while (stack.length && heights[i] < heights[stack[stack.length - 1]]) {
      const h = heights[stack.pop()];
      const w = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
      maxArea = Math.max(maxArea, h * w);
    }
    stack.push(i);
  }
  return maxArea;
}

console.log(buggyLargestRectangle([1, 2, 3, 4])); // 0 (Completely missed unpopped bars!)
```

#### 3.3.8 Complexity Derivation
- **Time Complexity**: $O(n)$. Each index from `0` to `n` is pushed onto the stack exactly once and popped at most once. Calculating the rectangular area takes $O(1)$ operations per pop.
- **Auxiliary Space Complexity**: $O(n)$. The stack holds at most $n + 1$ indices.

---

## 4. Tricky Edge Cases

- **Strict vs Non-Strict Inequalities**: Pay attention to whether the problem requires strictly greater/smaller elements or allows equality. For Next Greater Element, use `nums[i] > nums[top]` (strict). For Stock Span, use `currentPrice >= topPrice` (non-strict) to absorb equal prices.
- **Unresolved Elements Remaining on Stack**: Elements left in the stack when the loop terminates have no greater or smaller element to their right. Ensure your output array is pre-initialized with default values (such as `-1` or `0`).
- **Flush Sentinel in Histograms**: In monotonic increasing stacks where areas depend on both boundaries, ascending inputs (e.g. `[1, 2, 3]`) will never pop during the main loop. Running the loop up to index $n$ with height `0` flushes all pending bars cleanly.
- **Duplicate Heights in Histograms**: When adjacent bars share identical heights, earlier bars may compute an underestimated width, but the final duplicate bar will compute the full correct width, ensuring the overall maximum area remains mathematically exact.
- **Circular Arrays**: When an array is circular and elements wrap around to the beginning, iterate up to $2n$ using modulo indexing (`i % n`) while keeping index boundaries constrained.

---

## 5. Summary Cheat Sheet

- **Monotonic Decreasing Stack**: Maintains elements in decreasing order from bottom to top. Pops when `current > top`. Solves Next Greater Element and Daily Temperatures.
- **Monotonic Increasing Stack**: Maintains elements in increasing order from bottom to top. Pops when `current < top`. Solves Next Smaller Element and Largest Rectangle in Histogram.
- **Store Indices, Not Just Values**: Storing indices preserves both element values (`nums[idx]`) and relative distances (`i - idx`).
- **Amortized Linearity**: Despite nested loops, each element is pushed once and popped at most once, bounding total operations to $\le 2n$ ($O(n)$ time).
- **V8 SMI Pre-allocation**: Pre-allocate output arrays with `new Array(n).fill(defaultVal)` to preserve fast `PACKED_SMI_ELEMENTS` and prevent holey array deoptimizations.

---

## 6. Practice Problems

### 6.1 Next Greater Element II
Given a circular integer array `nums` (the next element of `nums[nums.length - 1]` is `nums[0]`), return the next greater number for every element in `nums`.

If no greater element exists, return `-1` for that number.

```text
Sample Input 1: nums = [1, 2, 1]
Expected Output 1: [2, -1, 2]

Sample Input 2: nums = [1, 2, 3, 4, 3]
Expected Output 2: [2, 3, 4, -1, 4]
```

- *Hint 1*: A circular array can be simulated without duplicating memory by running the loop for $2n$ iterations.
- *Hint 2*: Access the current element using modulo indexing: `nums[i % n]`.
- *Hint 3*: Only push indices to the stack during the first pass (`i < n`); the second pass only serves to resolve remaining unresolved elements.

### 6.2 Online Stock Span
Design an algorithm that collects daily price quotes for some stock and returns the **span** of that stock's price for the current day.

The **span** of the stock's price today is the maximum number of consecutive days (starting from today and going backward) for which the stock price was less than or equal to today's price.

```text
Sample Input:
["StockSpanner", "next", "next", "next", "next", "next", "next", "next"]
[[], [100], [80], [60], [70], [60], [75], [85]]

Expected Output:
[null, 1, 1, 1, 2, 1, 4, 6]
```

- *Hint 1*: Each day starts with an initial span of `1` (today itself).
- *Hint 2*: Maintain a monotonic decreasing stack storing pairs of `[price, accumulatedSpan]`.
- *Hint 3*: While the current price is greater than or equal to the top price, pop the top and add its accumulated span to today's span.

### 6.3 Trapping Rain Water
Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.

```text
Sample Input 1: height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]
Expected Output 1: 6

Sample Input 2: height = [4, 2, 0, 3, 2, 5]
Expected Output 2: 9
```

- *Hint 1*: Water is trapped in basins bounded by taller walls on both the left and right.
- *Hint 2*: Use a monotonic decreasing stack storing bar indices. When a taller bar arrives, a basin is formed.
- *Hint 3*: Pop the bottom of the basin. The new top of the stack is the left wall, and the current index is the right wall. Bounded height is `min(height[left], height[right]) - height[bottom]`.

---

<nav aria-label="Lecture navigation">

[Previous: Stacks & Expression Parsing](day-13-stacks-and-expression-parsing.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Queues, Circular Buffers & Design](day-15-queues-circular-buffers-and-design.md)

</nav>
