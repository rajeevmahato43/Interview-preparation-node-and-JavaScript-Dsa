# Day 06: Two Pointers: Opposing & Symmetrical Scans

<nav aria-label="Lecture navigation">

[Previous: Hash Table Patterns: Frequency, Complements & Duplicates](day-05-hash-patterns-frequency-counting-and-duplicates.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Fast & Slow](day-07-two-pointers-fast-slow-and-partitioning.md)

</nav>

---

## 1. Opposing Two Pointers

The **Opposing Two-Pointer** pattern starts two pointer variables at opposite ends of a list (`left = 0` and `right = n - 1`) and moves them toward each other. Instead of checking every pair with slow nested loops ($O(n^2)$), the pointers move inward step by step. They find the answer in one single pass ($O(n)$) without using any extra memory ($O(1)$ space).

To picture this in real life, imagine two librarians looking for two numbered books that add up to exactly `100` on a long library shelf sorted from book #2 to book #99:
* Librarian A stands at the far left, looking at the smallest book: **#2**.
* Librarian B stands at the far right, looking at the largest book: **#99**.
* They add their book numbers together: $2 + 99 = 101$.
* The sum is too big ($101 > 100$). Because the shelf is sorted, Librarian A moving right would only pick an even bigger number. The only way to make the sum smaller is for Librarian B to take one step to the left to book #97 (`right--`).
* They add their books again: $2 + 97 = 99$. Now the sum is too small ($99 < 100$). Librarian A takes one step to the right (`left++`).
* With every single step, they can safely ignore a whole set of impossible pairs without checking them.

```text
Array: [ 2, 7, 11, 15, 19, 28 ], Target = 26

Step 1: left = 0 (2),  right = 5 (28) ──► Sum = 30 (Too big! right--)
Step 2: left = 0 (2),  right = 4 (19) ──► Sum = 21 (Too small! left++)
Step 3: left = 1 (7),  right = 4 (19) ──► Sum = 26 (MATCH FOUND!)
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

The loop follows two simple rules:

$$\text{Candidate pair } (i, j) \text{ must sit between } left \le i < j \le right$$

1. **When `arr[left] + arr[right] > target`:** Because the list is sorted, `arr[right]` added to *any* other number to the right of `left` will also be too big. That means `arr[right]` can never be part of our answer. We can safely move `right--` one step left.
2. **When `arr[left] + arr[right] < target`:** Because the list is sorted, `arr[left]` added to *any* number to the left of `right` will also be too small. That means `arr[left]` can never be part of our answer. We can safely move `left++` one step right.

> [!NOTE]
> **Self-Check:** What happens if you try this opposing two-pointer scan on an unsorted array like `[15, 2, 28, 7]`?  
> *Answer:* The algorithm fails completely. Without sorted numbers, moving `left` or `right` might increase or decrease the sum randomly, skipping the correct pair.

---

### 1.2 Pointer Convergence Mechanics

```text
┌──────────────────────────────────────────────────────────────────┐
│                     HOW POINTERS MOVE                            │
├──────────────────────────────────┬───────────────────────────────┤
│ Condition                        │ Action                        │
├──────────────────────────────────┼───────────────────────────────┤
│ Current Sum < Target             │ left++  (Make sum bigger)     │
│ Current Sum > Target             │ right-- (Make sum smaller)    │
│ Current Sum === Target           │ Match found! Return positions │
│ left >= right                    │ Pointers met: Stop loop       │
└──────────────────────────────────┴───────────────────────────────┘
```

The loop condition is strictly `while (left < right)`. Writing `left <= right` is a bug in pair problems because it would let an element at `left === right` pair with itself.

---

## 2. Pattern Overview

The Two-Pointer technique is part of a larger family of pointer methods.

### 2.1 Pattern Family
* **Opposing Pointers (Moving Inward):** Pointers start at opposite ends (`left = 0`, `right = n - 1`) and move toward each other. Used for finding pairs in sorted arrays, container walls, and palindromes.
* **Symmetrical Expansion:** Pointers start in the middle (`left = mid`, `right = mid`) and move outward. Used for finding palindromic substrings.
* **Multi-Pointers (3Sum):** Keeping one outer pointer fixed with a loop while moving two inner opposing pointers across the remaining numbers.

### 2.2 Pattern Recognition Table

| Problem Keyword | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| **"Sorted array" + "Find pair with sum K"** | Find two numbers that add up to target. | Opposing Two Pointers (`left++`, `right--`). |
| **"Container With Most Water" / "Max Area"** | Find largest area between two vertical lines. | Opposing Pointers (discard shorter wall). |
| **"3Sum" / "Triplets summing to zero"** | Find 3 unique numbers that add up to 0. | Sort array, outer loop `i`, inner opposing pointers. |
| **"Valid Palindrome"** | Check if text reads same forward and backward. | Opposing Pointers skipping spaces. |

### 2.3 When to Use vs When NOT to Use

#### When to Use
* The array is **already sorted** (or can be sorted without breaking rules).
* You must use strictly **$O(1)$ extra memory**.
* You need to compare items starting from opposite ends.

#### When NOT to Use
* The array is unsorted and you need to return original indices (use a `Map` instead).
* You have a singly linked list where you cannot move backward.
* You need to find sum of elements in a range (use Sliding Window or Prefix Sum).

### 2.4 The 10^7 Operations Rule
If an array has $n = 100,000$ items:
* A slow nested loop checking all pairs takes about $5 \times 10^9$ operations, freezing Node.js for over 50 seconds.
* Opposing two pointers checks each item at most once ($100,000$ operations), finishing in **under 2 milliseconds**.

---

## 3. Problem Walkthroughs

---

### 3.1 Two Sum II

#### 3.1.1 Problem Statement
Given an array of numbers `numbers` sorted in ascending order, find two numbers that add up to a target sum `target`. Return the positions of the two numbers added by one (`[index1, index2]`). You cannot use the same element twice. Assume exactly one answer exists.

* **Sample Input 1:** `numbers = [2, 7, 11, 15]`, `target = 9` $\to$ **Expected Output:** `[1, 2]`
* **Sample Input 2:** `numbers = [2, 3, 4]`, `target = 6` $\to$ **Expected Output:** `[1, 3]`
* **Sample Input 3:** `numbers = [-1, 0]`, `target = -1` $\to$ **Expected Output:** `[1, 2]`
* **Constraints:** $2 \le numbers.length \le 3 \times 10^4$, $-1000 \le numbers[i], target \le 1000$, `numbers` is sorted in ascending order.

#### 3.1.2 How to Think About It
Imagine numbers marked along a ruler: `[2, 7, 11, 15]`.  
Put your left index finger on the first number (`2`) and your right index finger on the last number (`15`).  
Add them: $2 + 15 = 17$. Target is 9.  
17 is too big. Because the ruler is sorted, moving your left finger right would only make the sum even bigger. So slide your right finger one step to the left to `11`.  
Add them: $2 + 11 = 13$. Still too big. Slide your right finger left to `7`.  
Add them: $2 + 7 = 9$. We found the exact match!  
Add 1 to both indices to return 1-based positions: `[1, 2]`.

#### 3.1.3 Brute Force Approach & Bottleneck
The naive way uses two nested loops to test every combination:

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

* **The Bottleneck:** Completely ignores that the array is already sorted. When `numbers[0] + numbers[3] = 17 > 9`, brute force still wastes time testing `numbers[1] + numbers[3] = 18`. This takes slow quadratic $O(n^2)$ time.

#### 3.1.4 The Pattern Insight
Because `numbers` is sorted, we can eliminate whole sets of numbers on each check:
* If `sum > target`, move `right--` leftward.
* If `sum < target`, move `left++` rightward.
* It takes at most $n$ steps, dropping runtime from $O(n^2)$ to $O(n)$ with $O(1)$ memory.

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
* **Why it fails:** While this takes $O(n)$ time, allocating a hash map for an already-sorted array wastes $O(n)$ extra memory when $O(1)$ space is possible.

#### 3.1.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. In every step, either `left` moves right or `right` moves left. They meet after at most $n$ steps.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. We only use two simple number variables for the indices.

---

### 3.2 Container With Most Water

#### 3.2.1 Problem Statement
You are given an integer array `height` of length $n$. Each number represents a vertical line. Find two lines that, together with the ground, form a container that holds the most water. Return the maximum amount of water the container can hold.

* **Sample Input 1:** `height = [1, 8, 6, 2, 5, 4, 8, 3, 7]` $\to$ **Expected Output:** `49`
* **Sample Input 2:** `height = [1, 1]` $\to$ **Expected Output:** `1`
* **Sample Input 3:** `height = [4, 3, 2, 1, 4]` $\to$ **Expected Output:** `16`
* **Constraints:** $n == height.length$, $2 \le n \le 10^5$, $0 \le height[i] \le 10^4$.

#### 3.2.2 How to Think About It
Imagine wooden fences sticking out of the ground: `[1, 8, 6, 2, 5, 4, 8, 3, 7]`.  
Start by checking the widest possible container: Fence 0 (`height 1`) and Fence 8 (`height 7`).
* Width = $8 - 0 = 8$.
* Water spills over the shorter fence: $\min(1, 7) = 1$.
* Water Area = $\text{Width} \times \text{Height} = 8 \times 1 = 8$.

How could a narrower container hold more water?  
Any future container will be narrower ($< 8$). The only way it can hold more water is if it has a much taller wall.  
Fence 0 only has height `1`. It can never hold more water with any inner fence because width will shrink and height will still be limited to 1.  
Throw away the shorter fence! Move your left finger inward to Fence 1 (`height 8`).

#### 3.2.3 Brute Force Approach & Bottleneck
Check every possible pair of walls using nested loops:

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

* **The Bottleneck:** Checking all pairs takes slow $O(n^2)$ time. For $100,000$ walls, this takes billions of steps and freezes Node.js.

#### 3.2.4 The Pattern Insight
Start at maximum width: `left = 0`, `right = height.length - 1`.  
At each step, calculate the current water area.  
**Always move past the shorter wall:**
* If `height[left] < height[right]`, move `left++`.
* If `height[right] < height[left]`, move `right--`.
* If both walls have the same height, moving either wall is safe.  
Moving the taller wall is useless because width gets smaller while the container is still limited by the shorter wall. Discarding the shorter wall guarantees we find the maximum area in fast $O(n)$ time.

> [!NOTE]
> **Self-Check:** If `height[left] = 3` and `height[right] = 8`, why is it impossible for moving `right--` to make a bigger container?  
> *Answer:* The new width will be smaller ($w - 1$), but the height is still limited by the left wall ($\le 3$). The new area will always be smaller than the current $3 \times w$.

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

    // Always discard the shorter wall
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
* **Why it fails:** Moving past the taller wall makes the container narrower while keeping the shorter wall. The new area can never be bigger.

#### 3.2.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The pointers take at least 1 step inward on every turn, meeting in exactly $n - 1$ steps.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. We only use simple number variables for the indices and maximum area.

---

### 3.3 3Sum

#### 3.3.1 Problem Statement
Given an integer array `nums`, find all unique groups of three numbers `[nums[i], nums[j], nums[k]]` that add up to `0` (`nums[i] + nums[j] + nums[k] === 0`). The result must not have duplicate groups.

* **Sample Input 1:** `nums = [-1, 0, 1, 2, -1, -4]` $\to$ **Expected Output:** `[[-1, -1, 2], [-1, 0, 1]]`
* **Sample Input 2:** `nums = [0, 1, 1]` $\to$ **Expected Output:** `[]`
* **Sample Input 3:** `nums = [0, 0, 0]` $\to$ **Expected Output:** `[[0, 0, 0]]`
* **Constraints:** $3 \le nums.length \le 3000$, $-10^5 \le nums[i] \le 10^5$.

#### 3.3.2 How to Think About It
Imagine sorting all numbers from smallest to largest on a table: `[-4, -1, -1, 0, 1, 2]`.  
Hold down the first number with your left thumb (`nums[i]`).  
Now the problem becomes Two Sum II: find two other numbers to the right of your thumb that add up to `0 - nums[i]`.  
Use opposing two pointers (`left` and `right`) on the remaining numbers.  
To avoid duplicate answers, skip over identical adjacent numbers whenever you move your thumb or your pointers!

#### 3.3.3 Brute Force Approach & Bottleneck
The naive way uses three nested loops ($i, j, k$) to test all groups, and then sorts each group to filter duplicates in a `Set`.
* **The Bottleneck:** Three loops take cubic $O(n^3)$ time. For $3,000$ numbers, this takes over $27,000,000,000$ steps and crashes.

#### 3.3.4 The Pattern Insight
Sort the array in $O(n \log n)$ time.  
Loop through the array with index $i$ from $0$ to $n - 3$.  
For each $i$, set up two pointers: `left = i + 1` and `right = n - 1`.  
Because the list is sorted:
* If `nums[i] > 0`, stop the loop (three positive numbers can never add to zero).
* If `nums[i] === nums[i - 1]`, skip it (skip duplicate starting numbers).
* When you find a valid group of three, move both pointers past duplicate numbers in $O(1)$ space.  
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
* **Why it fails:** When duplicate numbers exist (like `[-2, 0, 0, 2, 2]`), moving pointers without skipping identical values outputs the exact same answer multiple times.

#### 3.3.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n^2)}$. Sorting takes $O(n \log n)$. The outer loop runs $n$ times, and the inner two-pointer scan takes $O(n)$ each time. $O(n \log n) + O(n^2) = O(n^2)$.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$ extra memory (ignoring the output list).

---

## 4. Tricky Edge Cases

* **`left < right` vs `left <= right`:** In pair-sum and container problems, an item cannot pair with itself at index `left === right`. Always write `left < right`.
* **Equal Wall Heights in Container:** When `height[left] === height[right]`, moving either pointer is safe because any future container with either wall will be narrower and cannot be taller.
* **Array Must Be Sorted:** Opposing two pointers fails completely if the input is not sorted. Never use this pattern on an unsorted array without sorting first.
* **Skipping Duplicates in 3Sum:** You must skip duplicate numbers both at the outer loop (`nums[i] === nums[i - 1]`) and at both inner pointers (`nums[left] === nums[left + 1]`).

---

## 5. Summary Cheat Sheet

* **Opposing Two Pointers:** Put pointers at `0` and `n - 1`. Move them inward to eliminate impossible choices in fast $O(1)$ space.
* **Two Sum II (Sorted):** If `sum < target`, move `left++`; if `sum > target`, move `right--`. Uses fast $O(1)$ stack memory instead of a Hash Map.
* **Container With Most Water:** Always move past the shorter wall. Moving the taller wall can never make a bigger container.
* **3Sum Breakdown:** Sort the array ($O(n \log n)$), fix the outer number $i$, and run two pointers on the rest ($O(n^2)$ total).
* **Skipping Duplicates:** Move pointers past identical numbers right after recording a match to keep all answers unique.

---

## 6. Practice Problems

### 6.1 Valid Palindrome II
Given a string `s`, return `true` if `s` can be a palindrome after deleting at most one character from it.
* **Sample Input 1:** `s = "aba"` $\to$ **Expected Output:** `true`
* **Sample Input 2:** `s = "abca"` $\to$ **Expected Output:** `true` (delete `'c'`)
* **Sample Input 3:** `s = "abc"` $\to$ **Expected Output:** `false`
* **Constraints:** $1 \le s.length \le 10^5$, `s` consists of lowercase English letters.
* **Hint 1:** Use two pointers from opposite ends.
* **Hint 2:** When you find the first mismatch (`s[left] !== s[right]`), check if deleting `s[left]` OR deleting `s[right]` leaves a valid palindrome.

---

### 6.2 Sort Transformed Array
Given a sorted integer array `nums` and three numbers `a`, `b`, and `c`, calculate $f(x) = ax^2 + bx + c$ for each element and return the numbers in sorted order in **$O(n)$ time**.
* **Sample Input 1:** `nums = [-4, -2, 2, 4]`, `a = 1`, `b = 3`, `c = 5` $\to$ **Expected Output:** `[3, 9, 15, 33]`
* **Sample Input 2:** `nums = [-4, -2, 2, 4]`, `a = -1`, `b = 3`, `c = 5` $\to$ **Expected Output:** `[-23, -5, 1, 7]`
* **Constraints:** $1 \le nums.length \le 10^4$, `nums` is sorted.
* **Hint 1:** A parabola with $a > 0$ has its largest numbers at the two outer ends (`left = 0` and `right = n - 1`).
* **Hint 2:** Use two pointers from opposite ends. Fill the result array from right to left if $a \ge 0$, or from left to right if $a < 0$.

---

### 6.3 Trapping Rain Water
Given an array `height` representing bar heights of width 1, calculate how much water can be trapped after it rains, using two pointers in **$O(n)$ time** and **$O(1)$ space**.
* **Sample Input 1:** `height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]` $\to$ **Expected Output:** `6`
* **Sample Input 2:** `height = [4, 2, 0, 3, 2, 5]` $\to$ **Expected Output:** `9`
* **Constraints:** $n == height.length$, $1 \le n \le 2 \times 10^4$, $0 \le height[i] \le 10^5$.
* **Hint 1:** The water height above any bar is limited by the shorter of the maximum heights to its left and right ($\min(\text{leftMax}, \text{rightMax}) - height[i]$).
* **Hint 2:** Track `leftMax` and `rightMax`. If `height[left] < height[right]`, the left side is the bottleneck: update `leftMax` and add trapped water, then `left++`. Do the same from the right when the right wall is shorter.

---

<nav aria-label="Lecture navigation">

[Previous: Hash Table Patterns: Frequency, Complements & Duplicates](day-05-hash-patterns-frequency-counting-and-duplicates.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Fast & Slow](day-07-two-pointers-fast-slow-and-partitioning.md)

</nav>
