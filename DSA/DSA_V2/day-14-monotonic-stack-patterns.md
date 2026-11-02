# Day 14: Monotonic Stack Patterns

<nav aria-label="Lecture navigation">

[Previous: Stacks & Expression Parsing](day-13-stacks-and-expression-parsing.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Queues, Circular Buffers & Design](day-15-queues-circular-buffers-and-design.md)

</nav>

---

## 1. Monotonic Stacks Foundation

A **Monotonic Stack** is a stack that keeps its items in a strict order at all times — either strictly increasing (getting bigger) or strictly decreasing (getting smaller) from bottom to top. If a new number would break that order, you pop items off the stack until the order is restored.

To picture this physically, imagine looking at city buildings from left to right:
* In front of you is a building 50 meters tall. Behind it sits a smaller building 30 meters tall. You can see both rooftops.
* If workers build a huge skyscraper 80 meters tall behind them, the new skyscraper blocks your view of both shorter buildings.
* The 80-meter tower is the **Next Greater Element** for both the 30-meter and 50-meter buildings.

```text
MONOTONIC DECREASING STACK:
Stream: [ 73, 74, 75, 71, 69, 72 ]

Current stack state after processing 75, 71, 69:
[ Bottom: 75 | 71 | Top: 69 ]  <-- Strictly decreasing

Element 72 arrives:
- 72 > 69? Breaks decreasing order! Pop 69 (Next Greater for 69 is 72).
- 72 > 71? Breaks decreasing order! Pop 71 (Next Greater for 71 is 72).
- 72 <= 75? Order is safe. Push 72!

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

---

### 1.1 Decreasing vs Increasing Stacks

The choice between a decreasing stack and an increasing stack depends on whether you are looking for larger or smaller numbers:

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
> **Self-Check:** Why do monotonic stacks almost always store array indices rather than the numbers themselves?  
> *Answer:* Storing the index gives you both the position of the item and its distance (`currentIndex - poppedIndex`), while you can still read the number at any time using `nums[poppedIndex]`.

---

### 1.2 Why the Loop is Still Linear O(n)

At first glance, a `while` loop inside a `for` loop looks like $O(n^2)$.  
**Why it is guaranteed to run in $O(n)$ time:**
* Every index in the array is pushed onto the stack exactly once.
* An index can only be popped off the stack once.
* Even if one step pops 5 items, those 5 items can never be popped again.
* Across all $n$ steps, there are at most $n$ pushes and at most $n$ pops ($2n$ operations total).
* This runs in **$O(n)$ linear time**.

---

## 2. Pattern Overview

### 2.1 Pattern Family
* **Next Greater / Smaller Element:** Finding the very first larger or smaller number to the right.
* **Distance to Greater / Smaller:** Finding how many steps away that next larger number is (like Daily Temperatures).
* **Histogram Areas & Water Basins:** Using left and right smaller boundaries to find the area of rectangles or trapped water.

### 2.2 Pattern Recognition Table

| Problem Keyword | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| **"Next greater element / First larger to right"** | Find first index $j > i$ where $nums[j] > nums[i]$. | Monotonic Decreasing Stack. |
| **"Days until warmer temperature"** | Distance ($j - i$) to first warmer day. | Monotonic Decreasing Stack storing indices. |
| **"Stock span / Days price was lower"** | Distance to previous greater element on the left. | Monotonic Decreasing Stack storing `[price, span]`. |
| **"Largest rectangle in histogram"** | Left and right smaller boundaries for each bar. | Monotonic Increasing Stack calculating widths. |
| **"Trapping rain water"** | Finding boundaries that hold pools of water. | Monotonic Decreasing Stack tracking basins. |

### 2.3 When to Use vs When NOT to Use
* **When to Use**:
  * The problem asks for the *nearest* or *first* greater or smaller element in an array.
  * You need to find how far an element can stretch before hitting a smaller or bigger value.
  * A naive solution uses nested loops to look rightward ($O(n^2)$).
  * Finding areas of rectangles under bars.
* **When NOT to Use**:
  * You need the biggest number across the whole array (just use a single loop with `Math.max`).
  * You need the $k$-th largest number overall (use a **Heap** or **Quickselect**).
  * Items do not follow an ordered sequence.

### 2.4 The $10^7$ Operations Rule
* Comparing every item to all future items with nested loops takes $O(n^2)$ time. For $n = 100,000$, this executes $10^{10}$ operations and freezes Node.js.
* A monotonic stack does this in $2n = 200,000$ operations, finishing in under 20 milliseconds.

---

## 3. Problem Walkthroughs

---

### 3.1 Next Greater Element I

#### 3.1.1 Problem Statement
The **next greater element** of some element `x` in an array is the first greater element that is to the right of `x` in the same array.

You are given two distinct integer arrays `nums1` and `nums2`, where `nums1` is a subset of `nums2`.

For each `0 <= i < nums1.length`, find the index `j` such that `nums1[i] == nums2[j]` and determine the next greater element of `nums2[j]` in `nums2`. If there is no next greater element, the answer for this query is `-1`.

Return an array `ans` of length `nums1.length` such that `ans[i]` is the next greater element as described above.

* **Sample Input 1:** `nums1 = [4, 1, 2]`, `nums2 = [1, 3, 4, 2]` $\to$ **Expected Output:** `[-1, 3, -1]`
* **Sample Input 2:** `nums1 = [2, 4]`, `nums2 = [1, 2, 3, 4]` $\to$ **Expected Output:** `[3, -1]`
* **Constraints:** $1 \le nums1.length \le nums2.length \le 1000$, $0 \le nums1[i], nums2[i] \le 10^4$, all integers in `nums1` and `nums2` are unique.

#### 3.1.2 How to Think About It
Imagine inspecting items along a conveyor belt: `nums2 = [1, 3, 4, 2]`. You hold a clipboard where you want to write down the answer for each number.  
You put items onto a holding tray (the stack):
1. Pick up `1`. Put it on the tray.
2. Pick up `3`. Look at the tray: `3 > 1`! That means `3` is the first larger number to the right of `1`.
   - Write on your clipboard: `1 -> 3`.
   - Take `1` off the tray.
   - Put `3` on the tray.
3. Pick up `4`. Look at the tray: `4 > 3`!
   - Write on your clipboard: `3 -> 4`.
   - Take `3` off the tray.
   - Put `4` on the tray.
4. Pick up `2`. Look at the tray: `2 < 4`. Place `2` on top of `4`.
5. The belt stops. The items left on the tray (`4` and `2`) never saw a bigger number to their right. Their answer stays `-1`.

Now look at `nums1 = [4, 1, 2]`. Just read the recorded answers from your clipboard!

```text
Tray Trace on nums2 = [1, 3, 4, 2]:
1. Read 1: Stack [ 1 ]
2. Read 3: 3 > 1 -> Map: { 1: 3 }, Pop 1, Push 3 -> Stack [ 3 ]
3. Read 4: 4 > 3 -> Map: { 1: 3, 3: 4 }, Pop 3, Push 4 -> Stack [ 4 ]
4. Read 2: 2 <= 4 -> Stack [ 4, 2 ]
Remaining in stack: 4 and 2 -> Map values default to -1.
```

#### 3.1.3 Brute Force Approach & Bottleneck
Searching for each number in `nums2`, then looking rightward one by one:

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

* **The Bottleneck:** Repeated rightward scans take $O(m \times n)$ time. On large arrays, this slow quadratic work adds up quickly.

#### 3.1.4 The Pattern Insight
Precompute the next greater number for every item in `nums2` in one pass using a **Monotonic Decreasing Stack**.  
Store each answer in a map: `nextGreaterMap.set(poppedVal, currentVal)`.  
Once `nums2` is done in $O(n)$ time, look up each number from `nums1` in $O(1)$ instant time.

#### 3.1.5 Pseudocode

```text
FUNCTION NextGreaterElement(nums1, nums2):
  stack = []
  map = Map()

  FOR each num IN nums2:
    WHILE stack IS NOT EMPTY AND num > stack.top():
      popped = stack.pop()
      map.set(popped, num)
    stack.push(num)

  result = []
  FOR each target IN nums1:
    result.push(map.get(target) ?? -1)

  RETURN result
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
* **Why it fails:** Using `map[val] || -1` fails when the value is `0` because `0` is falsy in JavaScript. Always use nullish coalescing (`?? -1`) or a `Map`.

#### 3.1.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n + m)}$, where $n$ is `nums2.length` and $m$ is `nums1.length`. Every item in `nums2` is pushed and popped at most once. Map lookups take $O(1)$ time.
* **Auxiliary Space Complexity:** $\mathbf{O(n)}$. The stack and map hold at most $n$ items.

---

### 3.2 Daily Temperatures

#### 3.2.1 Problem Statement
Given an array of integers `temperatures` represents the daily temperatures, return an array `answer` such that `answer[i]` is the number of days you have to wait after the $i$-th day to get a warmer temperature. If there is no future day for which this is possible, keep `answer[i] == 0` instead.

* **Sample Input 1:** `temperatures = [73, 74, 75, 71, 69, 72, 76, 73]` $\to$ **Expected Output:** `[1, 1, 4, 2, 1, 1, 0, 0]`
* **Sample Input 2:** `temperatures = [30, 40, 50, 60]` $\to$ **Expected Output:** `[1, 1, 1, 0]`
* **Sample Input 3:** `temperatures = [30, 60, 90]` $\to$ **Expected Output:** `[1, 1, 0]`
* **Constraints:** $1 \le temperatures.length \le 10^5$, $30 \le temperatures[i] \le 100$.

#### 3.2.2 How to Think About It
Imagine recording daily temperatures on sticky notes:
* On Day 0, temperature is 73. Stick note `Day 0 (73)` on the wall.
* On Day 1, temperature is 74.
  - Look at the wall: 74 is warmer than 73!
  - Day 0 only waited `1 - 0 = 1` day. Pull down note for Day 0 and write `1` in your calendar.
  - Stick note `Day 1 (74)` on the wall.
* On Day 2, temperature is 75. 75 is warmer than 74. Day 1 waited `2 - 1 = 1` day. Pull down Day 1. Stick Day 2.
* On Day 3, temperature is 71 (cooler). Stick Day 3.
* On Day 4, temperature is 69 (cooler). Stick Day 4.
* On Day 5, temperature is 72!
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
Checking each day against all future days with nested loops:

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

* **The Bottleneck:** When temperatures keep going down (like `[100, 99, 98, ..., 1]`), nested loops run $\approx \frac{n^2}{2} = 5 \times 10^9$ operations, freezing your program.

#### 3.2.4 The Pattern Insight
Use a **Monotonic Decreasing Stack storing day indices**.  
Days waiting for a warmer temperature stay on the stack in decreasing order.  
When a warmer day `currDay` arrives, it answers all cooler days waiting on top of the stack. The wait time is simply `currDay - prevDay`.

#### 3.2.5 Pseudocode

```text
FUNCTION DailyTemperatures(temperatures):
  n = length(temperatures)
  answer = Array of size n filled with 0
  stack = [] // Stores day indices

  FOR currDay FROM 0 TO n - 1:
    WHILE stack IS NOT EMPTY AND temperatures[currDay] > temperatures[stack.top()]:
      prevDay = stack.pop()
      answer[prevDay] = currDay - prevDay
    stack.push(currDay)

  RETURN answer
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
* **Why it fails:** If you only push temperatures onto the stack, you lose track of *which day* they happened, making it impossible to calculate how many days have passed.

#### 3.2.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. Each day index is pushed once and popped at most once.
* **Auxiliary Space Complexity:** $\mathbf{O(n)}$. In the worst case where temperatures strictly decrease, the stack holds $n$ indices.

---

### 3.3 Largest Rectangle in Histogram

#### 3.3.1 Problem Statement
Given an array of integers `heights` representing the histogram's bar height where the width of each bar is `1`, return the area of the largest rectangle in the histogram.

* **Sample Input 1:** `heights = [2, 1, 5, 6, 2, 3]` $\to$ **Expected Output:** `10`  
  *(Bars `[5, 6]` with height 5 and width 2 give area $5 \times 2 = 10$)*
* **Sample Input 2:** `heights = [2, 4]` $\to$ **Expected Output:** `4`
* **Constraints:** $1 \le heights.length \le 10^5$, $0 \le heights[i] \le 10^4$.

#### 3.3.2 How to Think About It
Imagine wooden fence posts of different heights: `[2, 1, 5, 6, 2, 3]`. You want to hang a rectangular banner across some posts.  
For any post of height $H$:
* How far can a banner of height $H$ stretch to the left? It stretches until it hits a post shorter than $H$.
* How far can it stretch to the right? It stretches until it hits a post shorter than $H$.
* Total width is the distance between those two shorter posts minus 1.
If you know the **first smaller post on the left** and the **first smaller post on the right** for each bar, you can calculate the biggest banner that bar can hold!

```text
Heights: [ 2, 1, 5, 6, 2, 3 ]
For bar 5 (index 2, height 5):
- Left boundary post shorter than 5: bar 1 at index 1.
- Right boundary post shorter than 5: bar 2 at index 4.
- Width = rightBoundary - leftBoundary - 1 = 4 - 1 - 1 = 2.
- Area = height * width = 5 * 2 = 10!
```

#### 3.3.3 Brute Force Approach & Bottleneck
Expanding left and right from every bar:

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

* **The Bottleneck:** Expanding left and right from every bar takes $O(n^2)$ time. For $10^5$ bars, this causes a timeout error.

#### 3.3.4 The Pattern Insight
Use a **Monotonic Increasing Stack storing indices**.  
As long as bars keep getting taller, we cannot determine their right boundary.  
When a shorter bar arrives at index `i`, it is the **right smaller boundary** for the taller bar on top of the stack!  
When that taller bar is popped:
1. Its height is `heights[poppedIdx]`.
2. Its right smaller boundary is `i`.
3. Its left smaller boundary is the **new top of the stack** (the bar below it).
4. Width is `i - leftSmaller - 1` (or simply `i` if the stack is now empty).  
To make sure all bars on the stack get processed at the end, add a fake bar of height `0` at the very end.

#### 3.3.5 Pseudocode

```text
FUNCTION LargestRectangleArea(heights):
  stack = []
  maxArea = 0
  n = length(heights)

  FOR i FROM 0 TO n:
    currentHeight = (i < n) ? heights[i] : 0

    WHILE stack IS NOT EMPTY AND currentHeight < heights[stack.top()]:
      poppedIndex = stack.pop()
      h = heights[poppedIndex]
      width = stack IS EMPTY ? i : (i - stack.top() - 1)
      maxArea = MAX(maxArea, h * width)

    stack.push(i)

  RETURN maxArea
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
* **Why it fails:** If all bars keep getting taller (like `[1, 2, 3, 4]`), nothing ever pops inside the loop. Without a 0-height bar at the end to flush the stack, the function returns `0`.

#### 3.3.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. Each bar index is pushed once and popped at most once. Calculating the rectangle area takes $O(1)$ time per pop.
* **Auxiliary Space Complexity:** $\mathbf{O(n)}$. The stack holds at most $n + 1$ indices.

---

## 4. Tricky Edge Cases

* **Strict vs Non-Strict Comparisons:** Check if the problem says strictly greater or allows equal. For Next Greater Element, use `nums[i] > nums[top]`. For Stock Span, use `>=` to include equal prices.
* **Unresolved Items in Stack:** Items left on the stack at the end have no greater or smaller item to their right. Make sure your result array is filled with default values (`-1` or `0`).
* **Flushing Histograms with Height 0:** Ascending bars like `[1, 2, 3]` will never pop on their own. Running the loop up to index $n$ with height `0` clears all bars safely.
* **Duplicate Heights in Histograms:** When bars have the same height, the earlier bar might compute a smaller width, but the last duplicate bar will compute the full correct width, keeping the final max area correct.
* **Circular Arrays:** When an array wraps around to the beginning, loop up to $2n$ using `i % n` to find items on the next cycle.

---

## 5. Summary Cheat Sheet

* **Monotonic Decreasing Stack:** Large at bottom, small at top. Pops when `current > top`. Solves Next Greater Element and Daily Temperatures.
* **Monotonic Increasing Stack:** Small at bottom, large at top. Pops when `current < top`. Solves Next Smaller Element and Histogram Area.
* **Store Indices:** Storing indices gives you both values (`nums[idx]`) and distances (`i - idx`).
* **$2n$ Step Limit:** Every item is pushed once and popped at most once. Total steps never exceed $2n \implies O(n)$ linear time.
* **Array Pre-allocation:** Start arrays with `new Array(n).fill(defaultVal)` to keep memory fast and consistent in Node.js.

---

## 6. Practice Problems

### 6.1 Next Greater Element II

Given a circular integer array `nums` (the next element of `nums[nums.length - 1]` is `nums[0]`), return the next greater number for every element in `nums`.

If no greater element exists, return `-1` for that number.

* **Difficulty:** Medium | **Focus:** Circular Monotonic Stack
* **Sample Input 1:** `nums = [1, 2, 1]` $\to$ **Expected Output:** `[2, -1, 2]`
* **Sample Input 2:** `nums = [1, 2, 3, 4, 3]` $\to$ **Expected Output:** `[2, 3, 4, -1, 4]`
* **Constraints:** $1 \le nums.length \le 10^4$, $-10^9 \le nums[i] \le 10^9$.
* **Hint 1:** You can handle the circular array by running the loop for $2n$ steps without copying the array.
* **Hint 2:** Access items with modulo: `nums[i % n]`.
* **Hint 3:** Only push indices to the stack on the first pass (`i < n`); the second pass only serves to answer items still waiting on the stack.

---

### 6.2 Online Stock Span

Design an algorithm that collects daily price quotes for a stock and returns the **span** of that stock's price for the current day.

The **span** of the stock's price today is the maximum number of consecutive days (starting today and looking backwards) where the stock price was less than or equal to today's price.

* **Difficulty:** Medium | **Focus:** Monotonic Stack with Accumulated Span
* **Sample Input:**
  ```javascript
  const spanner = new StockSpanner();
  spanner.next(100); // 1
  spanner.next(80);  // 1
  spanner.next(60);  // 1
  spanner.next(70);  // 2
  spanner.next(60);  // 1
  spanner.next(75);  // 4
  spanner.next(85);  // 6
  ```
* **Constraints:** At most $10^4$ calls to `next`, $1 \le price \le 10^5$.
* **Hint 1:** Every day starts with a span of `1` (the day itself).
* **Hint 2:** Keep a monotonic decreasing stack storing pairs: `[price, span]`.
* **Hint 3:** While today's price is greater than or equal to the top price, pop the top and add its span to today's span.

---

### 6.3 Trapping Rain Water

Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.

* **Difficulty:** Hard | **Focus:** Basin Bounding Walls
* **Sample Input 1:** `height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]` $\to$ **Expected Output:** `6`
* **Sample Input 2:** `height = [4, 2, 0, 3, 2, 5]` $\to$ **Expected Output:** `9`
* **Constraints:** $n == height.length$, $1 \le n \le 2 \times 10^4$, $0 \le height[i] \le 10^5$.
* **Hint 1:** Water is trapped in dips between a taller wall on the left and a taller wall on the right.
* **Hint 2:** Use a monotonic decreasing stack storing bar indices. When a taller bar arrives, a dip has formed.
* **Hint 3:** Pop the bottom of the dip. The new top of the stack is the left wall, and current index is the right wall. Trapped height is `Math.min(height[left], height[right]) - height[bottom]`.

---

<nav aria-label="Lecture navigation">

[Previous: Stacks & Expression Parsing](day-13-stacks-and-expression-parsing.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Queues, Circular Buffers & Design](day-15-queues-circular-buffers-and-design.md)

</nav>
