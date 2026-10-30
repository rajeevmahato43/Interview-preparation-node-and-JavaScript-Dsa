# Day 06: Two Pointers: Opposing & Symmetrical Scans

<nav aria-label="Lecture navigation">

[Previous: Hash Table Patterns: Frequency, Complements & Duplicates](day-05-hash-patterns-frequency-counting-and-duplicates.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Fast & Slow](day-07-two-pointers-fast-slow-and-partitioning.md)

</nav>

---

## 1. Opposing Two Pointers

The **Opposing Two-Pointer** pattern uses two index variables initialized at opposite ends of a collection (`left = 0` and `right = n - 1`) that converge toward each other. Instead of evaluating all pairs with nested loops ($O(n^2)$), the pointers move inward based on strict monotonic rules to find the solution in a single linear pass ($O(n)$) using zero auxiliary memory ($O(1)$ space).

To picture this physically, imagine two librarians searching for two numbered books that sum up to exactly `100` on a long library shelf sorted in ascending order from book #2 to book #99:
* Librarian A stands at the far left, looking at the smallest book: **#2**.
* Librarian B stands at the far right, looking at the largest book: **#99**.
* They sum their book numbers: $2 + 99 = 101$.
* The sum is too large ($101 > 100$). Because the shelf is sorted, Librarian A moving to the right would only pick an even larger number. The only logical way to make the sum smaller is for Librarian B to step one slot to the left to book #97 (`right--`).
* They sum their books again: $2 + 97 = 99$. Now the sum is too small ($99 < 100$). Librarian A steps one slot to the right (`left++`).
* With every single step, they safely eliminate an entire subset of impossible pairs without inspecting them.

```text
Array: [ 2, 7, 11, 15, 19, 28 ], Target = 26

Step 1: left = 0 (2),  right = 5 (28) ──► Sum = 30 (Too big! right--)
Step 2: left = 0 (2),  right = 4 (19) ──► Sum = 21 (Too small! left++)
Step 3: left = 1 (7),  right = 4 (19) ──► Sum = 26 (TARGET MATCH!)
```

```javascript
// Node.js code
"use strict";

// Baseline opposing pointer scan on a sorted array
function findPairSum(sortedArr, target) {
  let left = 0;
  let right = sortedArr.length - 1;

  while (left < right) {
    const sum = sortedArr[left] + sortedArr[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }

  return [];
}

console.log(findPairSum([2, 7, 11, 15, 19, 28], 26)); // [ 1, 4 ]
```

### 1.1 The Invariant Principle

The loop runs under a strict mathematical contract:

$$\text{Candidate pair } (i, j) \text{ must satisfy } left \le i < j \le right$$

1. **When `arr[left] + arr[right] > target`:** Because the array is sorted, `arr[right]` added to *any* element to the right of `left` will produce a sum strictly greater than `target`. Therefore, `arr[right]` can never pair with any remaining candidate. Decrementing `right--` safely discards that entire column of pairs.
2. **When `arr[left] + arr[right] < target`:** Because the array is sorted, `arr[left]` added to *any* element to the left of `right` will produce a sum strictly smaller than `target`. Incrementing `left++` safely discards that entire row of pairs.

> [!NOTE]
> **Self-Check:** What happens if you run an opposing two-pointer scan on an unsorted array like `[15, 2, 28, 7]`?  
> *Answer:* The algorithm fails completely. The monotonic guarantee breaks: incrementing `left` or decrementing `right` will randomly increase or decrease the sum, causing valid pairs to be skipped.

---

### 1.2 Pointer Convergence Mechanics

```text
┌──────────────────────────────────────────────────────────────────┐
│                     POINTER MOVEMENT DECISIONS                   │
├──────────────────────────────────┬───────────────────────────────┤
│ Condition                        │ Action                        │
├──────────────────────────────────┼───────────────────────────────┤
│ Current Sum < Target             │ left++  (Seek larger value)   │
│ Current Sum > Target             │ right-- (Seek smaller value)  │
│ Current Sum === Target           │ Match found! Return indices   │
│ left >= right                    │ Pointers crossed: Terminate   │
└──────────────────────────────────┴───────────────────────────────┘
```

The loop termination condition is strictly `while (left < right)`. Using `left <= right` is an anti-pattern in pair search problems because it allows an element at index `left === right` to pair with itself.

---

## 2. Pattern Overview

The Two-Pointer approach represents a broader family of pointer-driven array algorithms.

### Pattern Family
* **Opposing Pointers (Inward Convergence):** Pointers start at opposite ends (`left = 0`, `right = n - 1`) and move toward each other. Used for sorted pair searches, container boundaries, and palindromes.
* **Symmetrical Expansion:** Pointers start at the center (`left = mid`, `right = mid`) and expand outward. Used for finding longest palindromic substrings.
* **Multi-Pointers (k-Sum Extensions):** Fixing one or more outer loop pointers (e.g. `i` in 3Sum) and running an inner opposing two-pointer scan over the remaining sub-range.

### Pattern Recognition Table

| Problem Keyword | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| **"Sorted array" + "Find pair with sum K"** | Locate two elements summing to target. | Opposing Two Pointers (`left++`, `right--`). |
| **"Container With Most Water" / "Max Area"** | Maximize width $\times$ bounded height. | Opposing Pointers (discard shorter wall). |
| **"3Sum" / "Triplets summing to zero"** | Find 3 unique elements with sum 0. | Sort array, outer loop `i`, inner opposing pointers. |
| **"Valid Palindrome"** | Verify bidirectional symmetry. | Opposing Pointers with ASCII skipping. |

### When to Use
* The input array is **strictly sorted** (or can be sorted without violating problem constraints).
* Memory constraints require strictly **$O(1)$ auxiliary space**.
* You need to evaluate area, bounds, or symmetrical conditions from opposite ends of a collection.

### When NOT to Use
* The input is unsorted and you must return original indices (use a Hash Map instead).
* The data structure is a singly linked list without backward pointer traversal (use Fast & Slow pointers instead).
* The problem asks for contiguous sub-arrays with variable range sums (use Sliding Window or Prefix Sum).

### The $10^7$ Operations Constraint Rule
If an array contains $n = 100,000$ elements:
* A naive nested loop checking all pairs runs $\approx \frac{n^2}{2} = 5 \times 10^9$ operations, freezing single-threaded Node.js for over 50 seconds.
* Opposing two pointers evaluates each element at most once ($n = 100,000$ operations), completing in **under 2 milliseconds**.

---

## 3. Problem Walkthroughs

---

### 3.1 Two Sum II

#### 3.1.1 Problem Statement
Given a 1-indexed array of integers `numbers` that is already sorted in non-decreasing order, find two numbers such that they add up to a specific `target` number. Return the indices of the two numbers added by one as an integer array `[index1, index2]` of length 2.
You may not use the same element twice. Tests are generated such that there is exactly one solution.

* **Sample Input 1:** `numbers = [2, 7, 11, 15]`, `target = 9` $\to$ **Expected Output:** `[1, 2]`
* **Sample Input 2:** `numbers = [2, 3, 4]`, `target = 6` $\to$ **Expected Output:** `[1, 3]`
* **Sample Input 3:** `numbers = [-1, 0]`, `target = -1` $\to$ **Expected Output:** `[1, 2]`
* **Constraints:** $2 \le numbers.length \le 3 \times 10^4$, $-1000 \le numbers[i], target \le 1000$, `numbers` is sorted in non-decreasing order.

#### 3.1.2 How to Think About It
Imagine a ruler with numbers marked along its edge: `[2, 7, 11, 15]`.
Place your left index finger on the first number (`2`) and your right index finger on the last number (`15`).
Sum them: $2 + 15 = 17$. Target is 9.
17 is too large. Since the ruler is sorted, moving your left finger forward only increases the sum. Slide your right finger one step to the left to `11`.
Sum: $2 + 11 = 13$. Still too large. Slide your right finger left to `7`.
Sum: $2 + 7 = 9$. Exact match found!
Return the 1-based indices `[1, 2]`.

#### 3.1.3 Brute Force Approach & Bottleneck
The naive approach uses nested loops to test every combination of $i$ and $j$:

```javascript
function twoSumIIBrute(numbers, target) {
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      if (numbers[i] + numbers[j] === target) return [i + 1, j + 1];
    }
  }
  return [];
}
```

* **The Bottleneck:** Completely ignores that the array is already sorted. When `numbers[0] + numbers[3] = 17 > 9`, brute force still tests `numbers[1] + numbers[3] = 18`, doing redundant quadratic work ($O(n^2)$).

#### 3.1.4 The Pattern Insight
Because `numbers` is sorted, we can prune an entire row or column of pairs on each check:
* If `sum > target`, decrement `right--`.
* If `sum < target`, increment `left++`.
* At most $n$ total pointer steps are needed, dropping runtime from $O(n^2)$ to $O(n)$ with $O(1)$ memory.

#### 3.1.5 Pseudocode

```text
FUNCTION TwoSumII(numbers, target):
  left = 0
  right = length(numbers) - 1

  WHILE left < right:
    sum = numbers[left] + numbers[right]

    IF sum == target:
      RETURN [left + 1, right + 1]
    ELSE IF sum < target:
      left = left + 1
    ELSE:
      right = right - 1

  RETURN []
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(1) space opposing two pointers
function twoSumII(numbers, target) {
  if (!Array.isArray(numbers) || numbers.length < 2) return [];

  let left = 0;
  let right = numbers.length - 1;

  while (left < right) {
    const sum = numbers[left] + numbers[right];

    if (sum === target) {
      return [left + 1, right + 1]; // Convert to 1-based indices
    } else if (sum < target) {
      left++; // Need a larger number
    } else {
      right--; // Need a smaller number
    }
  }

  return [];
}

// Example runs
console.log(twoSumII([2, 7, 11, 15], 9)); // [ 1, 2 ]
console.log(twoSumII([2, 3, 4], 6));       // [ 1, 3 ]
console.log(twoSumII([-1, 0], -1));        // [ 1, 2 ]
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Using a Hash Map when input is already sorted
function twoSumIIHashMap(numbers, target) {
  // SUB-OPTIMAL: Burns O(n) heap memory for a Map when O(1) space is available
  const seen = new Map();
  for (let i = 0; i < numbers.length; i++) {
    const comp = target - numbers[i];
    if (seen.has(comp)) return [seen.get(comp) + 1, i + 1];
    seen.set(numbers[i], i);
  }
  return [];
}
```
* **Why it fails:** While computationally $O(n)$, allocating a hash map for an already-sorted array wastes $O(n)$ heap space and violates the $O(1)$ memory requirement.

#### 3.1.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. In every iteration, either `left` increments or `right` decrements. The pointers start $n - 1$ indices apart and meet after at most $n$ iterations.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. Only two primitive integer index variables are maintained in stack memory.

---

### 3.2 Container With Most Water

#### 3.2.1 Problem Statement
You are given an integer array `height` of length $n$. There are $n$ vertical lines drawn such that the two endpoints of the $i$-th line are `(i, 0)` and `(i, height[i])`.
Find two lines that together with the x-axis form a container that contains the most water. Return the maximum amount of water a container can store. You may not slant the container.

* **Sample Input 1:** `height = [1, 8, 6, 2, 5, 4, 8, 3, 7]` $\to$ **Expected Output:** `49`
* **Sample Input 2:** `height = [1, 1]` $\to$ **Expected Output:** `1`
* **Sample Input 3:** `height = [4, 3, 2, 1, 4]` $\to$ **Expected Output:** `16`
* **Constraints:** $n == height.length$, $2 \le n \le 10^5$, $0 \le height[i] \le 10^4$.

#### 3.2.2 How to Think About It
Imagine wooden vertical fences sticking out of the ground: `[1, 8, 6, 2, 5, 4, 8, 3, 7]`.
Start by testing the widest container possible: Fence 0 (`height 1`) and Fence 8 (`height 7`).
* Width = $8 - 0 = 8$.
* Water spills over the shorter fence: $\min(1, 7) = 1$.
* Area = $\text{Width} \times \text{Height} = 8 \times 1 = 8$.

How can we possibly find a larger area?
Any future container will have a narrower width ($< 8$). The only way a narrower container can hold more water is if it has a much taller bottleneck wall.
Fence 0 has height `1`. It can never hold more water with any other inner fence because width will shrink and height remains bounded by 1.
Discard the shorter fence! Move your left finger inward to Fence 1 (`height 8`).

#### 3.2.3 Brute Force Approach & Bottleneck
Evaluate all possible pairs of walls using nested loops:

```javascript
function maxAreaBrute(height) {
  let maxWater = 0;
  for (let i = 0; i < height.length; i++) {
    for (let j = i + 1; j < height.length; j++) {
      const area = (j - i) * Math.min(height[i], height[j]);
      maxWater = Math.max(maxWater, area);
    }
  }
  return maxWater;
}
```

* **The Bottleneck:** Quadratic pairwise scanning ($O(n^2)$). For $10^5$ walls, this requires $5 \times 10^9$ operations, freezing the execution thread.

#### 3.2.4 The Pattern Insight
Start at maximum width: `left = 0`, `right = height.length - 1`.
At each step, calculate the current area.
**Always discard the shorter wall:**
* If `height[left] < height[right]`, advance `left++`.
* If `height[right] < height[left]`, retreat `right--`.
* If equal, moving either pointer is mathematically safe.
Moving the taller wall is useless because width shrinks and height remains bounded by the shorter wall. Discarding the shorter wall guarantees global optimality in $O(n)$ time.

> [!NOTE]
> **Self-Check:** If `height[left] = 3` and `height[right] = 8`, why is it mathematically impossible for moving `right--` to produce a larger container?  
> *Answer:* The new width will decrease by 1 ($w - 1$), while the container height remains bottlenecked by the shorter left wall ($\le 3$). Therefore, $\text{area} \le 3 \times (w - 1)$, which is strictly less than the current area $3 \times w$.

#### 3.2.5 Pseudocode

```text
FUNCTION MaxArea(height):
  left = 0
  right = length(height) - 1
  maxWater = 0

  WHILE left < right:
    width = right - left
    water = width * MIN(height[left], height[right])
    maxWater = MAX(maxWater, water)

    IF height[left] < height[right]:
      left = left + 1
    ELSE:
      right = right - 1

  RETURN maxWater
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(1) space opposing two pointers
function maxArea(height) {
  if (!Array.isArray(height) || height.length < 2) return 0;

  let left = 0;
  let right = height.length - 1;
  let maxWater = 0;

  while (left < right) {
    const width = right - left;
    const currentHeight = Math.min(height[left], height[right]);
    const area = width * currentHeight;

    if (area > maxWater) {
      maxWater = area;
    }

    // Monotonic pruning: discard the shorter wall bottleneck
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }

  return maxWater;
}

// Example runs
console.log(maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7])); // 49
console.log(maxArea([1, 1]));                         // 1
console.log(maxArea([4, 3, 2, 1, 4]));                // 16
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Moving the taller wall inward
function buggyMaxArea(height) {
  let left = 0, right = height.length - 1, max = 0;
  while (left < right) {
    max = Math.max(max, (right - left) * Math.min(height[left], height[right]));
    // BUG: Discarding the taller wall shrinks width without enabling height gain!
    if (height[left] > height[right]) {
      left++;
    } else {
      right--;
    }
  }
  return max;
}
```
* **Why it fails:** Discarding the taller wall reduces width while keeping the shorter bottleneck wall, mathematically guaranteeing that the new area can never exceed the previous area.

#### 3.2.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The pointers converge inward by at least 1 step on every iteration. Exactly $n - 1$ steps are executed.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. Only scalar index and maximum water variables are used.

---

### 3.3 3Sum

#### 3.3.1 Problem Statement
Given an integer array `nums`, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] === 0`.
Notice that the solution set must not contain duplicate triplets.

* **Sample Input 1:** `nums = [-1, 0, 1, 2, -1, -4]` $\to$ **Expected Output:** `[[-1, -1, 2], [-1, 0, 1]]`
* **Sample Input 2:** `nums = [0, 1, 1]` $\to$ **Expected Output:** `[]`
* **Sample Input 3:** `nums = [0, 0, 0]` $\to$ **Expected Output:** `[[0, 0, 0]]`
* **Constraints:** $3 \le nums.length \le 3000$, $-10^5 \le nums[i] \le 10^5$.

#### 3.3.2 How to Think About It
Imagine sorting all numbers from smallest to largest on a long table: `[-4, -1, -1, 0, 1, 2]`.
Fix one number with your left thumb (`nums[i]`).
Now the problem simplifies into Two Sum II: find two other numbers to the right of your thumb that add up to `0 - nums[i]`.
Use opposing two pointers (`left` and `right`) on the remaining numbers.
To prevent duplicate triplets from appearing in your final answer, skip over identical adjacent numbers whenever your thumb moves or your pointers advance!

#### 3.3.3 Brute Force Approach & Bottleneck
The naive approach uses three nested loops ($i, j, k$) to test all triplets, followed by sorting triplets and storing them in a `Set` to remove duplicates.
* **The Bottleneck:** Cubic time complexity ($O(n^3)$). For $n = 3000$, $n^3 = 2.7 \times 10^{10}$ operations, resulting in instant crash or execution timeout.

#### 3.3.4 The Pattern Insight
Sort the array in $O(n \log n)$ time.
Iterate an outer index $i$ from $0$ to $n - 3$.
For each $i$, initialize opposing pointers: `left = i + 1` and `right = n - 1`.
Because the array is sorted:
* If `nums[i] > 0`, break early (three positive numbers can never sum to zero).
* If `nums[i] === nums[i - 1]`, continue (skip duplicate anchors).
* When a valid triplet is found, advance both pointers past duplicate values in $O(1)$ space.
Total time drops from $O(n^3)$ to $O(n^2)$.

#### 3.3.5 Pseudocode

```text
FUNCTION ThreeSum(nums):
  Sort(nums)
  result = []

  FOR i FROM 0 TO length(nums) - 3:
    IF nums[i] > 0 THEN BREAK
    IF i > 0 AND nums[i] == nums[i - 1] THEN CONTINUE

    left = i + 1
    right = length(nums) - 1

    WHILE left < right:
      sum = nums[i] + nums[left] + nums[right]

      IF sum == 0:
        result.append([nums[i], nums[left], nums[right]])
        WHILE left < right AND nums[left] == nums[left + 1]: left = left + 1
        WHILE left < right AND nums[right] == nums[right - 1]: right = right - 1
        left = left + 1
        right = right - 1
      ELSE IF sum < 0:
        left = left + 1
      ELSE:
        right = right - 1

  RETURN result
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n^2) time, O(1) auxiliary space 3Sum with duplicate skipping
function threeSum(nums) {
  if (!Array.isArray(nums) || nums.length < 3) return [];

  // Sort ascending: O(n log n)
  nums.sort((a, b) => a - b);
  const result = [];

  for (let i = 0; i < nums.length - 2; i++) {
    // Optimization: If smallest element is > 0, three numbers can never sum to 0
    if (nums[i] > 0) break;

    // Skip duplicate outer anchor values
    if (i > 0 && nums[i] === nums[i - 1]) continue;

    let left = i + 1;
    let right = nums.length - 1;

    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];

      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);

        // Skip duplicate left values
        while (left < right && nums[left] === nums[left + 1]) left++;
        // Skip duplicate right values
        while (left < right && nums[right] === nums[right - 1]) right--;

        left++;
        right--;
      } else if (sum < 0) {
        left++; // Need larger sum
      } else {
        right--; // Need smaller sum
      }
    }
  }

  return result;
}

// Example runs
console.log(threeSum([-1, 0, 1, 2, -1, -4])); // [ [ -1, -1, 2 ], [ -1, 0, 1 ] ]
console.log(threeSum([0, 1, 1]));              // []
console.log(threeSum([0, 0, 0]));              // [ [ 0, 0, 0 ] ]
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Forgetting duplicate pointer skipping (causes duplicates)
function buggyThreeSum(nums) {
  nums.sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < nums.length - 2; i++) {
    let left = i + 1, right = nums.length - 1;
    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);
        // BUG: Simple increment without skipping identical items outputs duplicate triplets!
        left++;
        right--;
      } else if (sum < 0) left++;
      else right--;
    }
  }
  return result;
}
```
* **Why it fails:** When duplicate values exist (e.g. `[-2, 0, 0, 2, 2]`), simply doing `left++` and `right--` produces identical triplets `[-2, 0, 2]` multiple times, violating problem constraints.

#### 3.3.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n^2)}$. Sorting takes $O(n \log n)$. The outer loop runs $n$ times, and the inner two-pointer scan takes $O(n)$ per iteration. $O(n \log n) + O(n^2) = O(n^2)$.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$ auxiliary space (ignoring the output list and V8 sorting recursion space).

---

## 4. Tricky Edge Cases

* **`left < right` vs `left <= right`:** In pair-sum and container problems, an element cannot pair with itself at index `left === right`. Always use `left < right`.
* **Equal Heights in Container Walls:** When `height[left] === height[right]`, moving either pointer (or both) is mathematically safe because any future container bounded by either wall will have smaller width and cannot exceed the current height.
* **Strict Sorting Precondition:** Opposing two pointers fails completely if the input is not sorted. Never apply this technique to an unsorted array without sorting first.
* **Duplicate Triplet Combinations:** In 3Sum, skipping duplicates must occur at both the outer anchor (`nums[i] === nums[i - 1]`) and both inner pointers (`nums[left] === nums[left + 1]`).

---

## 5. Summary Cheat Sheet

* **Opposing Two Pointers:** Place pointers at `0` and `n - 1`. Move inward based on monotonic comparisons to eliminate impossible states in $O(1)$ space.
* **Two Sum II (Sorted):** If `sum < target`, `left++`; if `sum > target`, `right--`. Replaces hash map heap allocations with $O(1)$ stack memory.
* **Container With Most Water:** Always advance the pointer pointing to the shorter wall. Moving the taller wall can never produce a larger area.
* **3Sum Reduction:** Sort the array ($O(n \log n)$), fix the outer index $i$, and run an inner opposing two-pointer scan ($O(n^2)$ total).
* **Duplicate Skipping Rule:** Advance pointers past identical values immediately after recording a match to maintain unique combinations.

---

## 6. Practice Problems

### 6.1 Valid Palindrome II

Given a string `s`, return `true` if the `s` can be a palindrome after deleting at most one character from it.

* **Difficulty:** Easy | **Focus:** Warm-Up
* **Sample Input 1:** `s = "aba"` $\to$ **Expected Output:** `true`
* **Sample Input 2:** `s = "abca"` $\to$ **Expected Output:** `true` (delete `'c'`)
* **Sample Input 3:** `s = "abc"` $\to$ **Expected Output:** `false`
* **Constraints:** $1 \le s.length \le 10^5$, `s` consists of lowercase English letters.
* **Hint 1:** Run standard opposing two pointers.
* **Hint 2:** On the first mismatch (`s[left] !== s[right]`), check whether the substring skipping `left` OR the substring skipping `right` forms a valid palindrome.

---

### 6.2 Sort Transformed Array

Given a sorted integer array `nums` and three integers `a`, `b` and `c`, apply the quadratic function $f(x) = ax^2 + bx + c$ to each element and return the array in sorted order in **$O(n)$ time**.

* **Difficulty:** Medium | **Focus:** Parabola Extremes
* **Sample Input 1:** `nums = [-4, -2, 2, 4]`, `a = 1`, `b = 3`, `c = 5` $\to$ **Expected Output:** `[3, 9, 15, 33]`
* **Sample Input 2:** `nums = [-4, -2, 2, 4]`, `a = -1`, `b = 3`, `c = 5` $\to$ **Expected Output:** `[-23, -5, 1, 7]`
* **Constraints:** $1 \le nums.length \le 10^4$, `nums` is sorted.
* **Hint 1:** A parabola $ax^2 + bx + c$ with $a > 0$ opens upwards, meaning the largest values are at the extreme ends (`left = 0` and `right = n - 1`).
* **Hint 2:** Use two pointers from opposite ends. Fill the result array from right to left if $a \ge 0$, or from left to right if $a < 0$.

---

### 6.3 Trapping Rain Water

Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining using opposing two pointers in **$O(n)$ time** and **$O(1)$ space**.

* **Difficulty:** Hard | **Focus:** Advanced Two Pointers
* **Sample Input 1:** `height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]` $\to$ **Expected Output:** `6`
* **Sample Input 2:** `height = [4, 2, 0, 3, 2, 5]` $\to$ **Expected Output:** `9`
* **Constraints:** $n == height.length$, $1 \le n \le 2 \times 10^4$, $0 \le height[i] \le 10^5$.
* **Hint 1:** Water height at any bar is bounded by $\min(\text{leftMax}, \text{rightMax}) - height[i]$.
* **Hint 2:** Maintain `leftMax` and `rightMax`. If `height[left] < height[right]`, the left side is the bottleneck: update `leftMax` and accumulate trapped water, then `left++`. Symmetrically handle `right--` when the right wall is shorter.

---

<nav aria-label="Lecture navigation">

[Previous: Hash Table Patterns: Frequency, Complements & Duplicates](day-05-hash-patterns-frequency-counting-and-duplicates.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Fast & Slow](day-07-two-pointers-fast-slow-and-partitioning.md)

</nav>
