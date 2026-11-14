# Day 06: Two Pointers: Opposing & Symmetrical Scans

<nav aria-label="Lecture navigation">

[Previous: Hash Table Patterns: Frequency, Complements & Duplicates](day-05-hash-patterns-frequency-counting-and-duplicates.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Fast & Slow](day-07-two-pointers-fast-slow-and-partitioning.md)

</nav>

---

## 1. Pattern Overview

In an array, a pointer is an index that tells us which value to check. Two-pointer methods use two such indexes.

### 1.1 Pattern Family
* **Opposing pointers:** Start at both ends (`left = 0`, `right = n - 1`) and move toward each other. Use them for pairs in sorted arrays, container walls, and palindromes.
* **Middle-out pointers:** To check a palindrome, start both pointers at the middle. For an even-length string, start on the two middle letters. Compare the letters, then move `left` back and `right` forward. Stop at a mismatch or when the pointers pass the ends.
* **Three pointers for 3Sum:** Hold one number in place. Move two other pointers through the numbers that remain.

For `"level"`, start at the middle `v`. Then compare `e` with `e`, and `l` with `l`. All pairs match, so the string is a palindrome.

---
## 2. Opposing Two Pointers

For a pair-sum problem, start at both ends of a sorted array: `left = 0` and `right = n - 1`. Move one pointer toward the middle after each check. This avoids checking every pair with two loops. The scan takes `O(n)` time and `O(1)` extra space.

Imagine finding two numbers that add to `100` in a sorted row of books. Start with the smallest and largest. If their sum is too big, move the right pointer left. If it is too small, move the left pointer right. Sorting makes each move safe: it tells us which values cannot be part of the answer.

```text
Array: [ 2, 7, 11, 15, 19, 28 ], Target = 26

Step 1: left = 0 (2),  right = 5 (28) -> Sum = 30 (too big, move right)
Step 2: left = 0 (2),  right = 4 (19) -> Sum = 21 (too small, move left)
Step 3: left = 1 (7),  right = 4 (19) -> Sum = 26 (match)
```

### 2.1 Pattern Recognition Table

| Problem Keyword | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| **"Sorted array" + "Find pair with sum K"** | Find two numbers that add to the target. | Opposing pointers. |
| **"Container With Most Water" / "Max Area"** | Find the largest area between two walls. | Move the shorter wall inward. |
| **"3Sum" / "Three numbers sum to zero"** | Find three numbers that add to 0. | Sort, hold one number, then use two pointers. |
| **"Valid Palindrome"** | Check whether text reads the same both ways. | Compare both ends and move inward. |
| **"Two numbers closest to target"** | Find the pair with the closest sum. | Sort, then use opposing pointers. |
| **"Remove duplicates from sorted array"** | Keep one copy of each value. | Read/write pointers (Day 7). |
| **"Squares of a Sorted Array"** | Return the squared values in order. | Compare both ends and fill the result from the back. |
| **"Palindrome ignoring symbols"** | Skip symbols and compare letters and numbers. | Opposing pointers with skipping. |
| **"Reverse a string/array in place"** | Reverse values without a second array. | Swap values at both ends. |
| **"Trapping Rain Water"** | Count water held between bars. | Opposing pointers and running wall heights. |
| **"Pairs smaller/larger than target"** | Count or find pairs by their sum. | Sort, then use opposing pointers. |
| **"Pair from both ends"** | Compare the smallest and largest values. | Move pointers toward each other. |

### 2.2 When to Use vs When NOT to Use

#### When to Use
* The values are sorted, or can be sorted without changing the answer.
* You can tell which pointer to move after each check.
* Moving one pointer rules out some impossible pairs.
* You need to compare values from both ends.
* You want `O(1)` extra space.

#### When NOT to Use
* You cannot tell which pointer should move next.
* Moving a pointer could skip the answer.
* You need to remember earlier values; use a `Map` or `Set`.
* You must check every possible group.
* Another method fits better, such as a hash map, sliding window, or prefix sum.

### 2.3 Compare the Number of Steps

For 100,000 values, checking every pair can take about 5 billion checks. Opposing pointers need at most about 100,000 checks. Use step counts to compare methods; actual run time depends on the computer and code.


### 2.4 Example of opposing pointer
```javascript
"use strict";

// Find a pair in a sorted array.
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

### 2.5 The Rule That Stays True

As long as a matching pair may still exist, both numbers must be between `left` and `right`.

1. **If the sum is too big:** The value at `right` is too large to make a pair with any value between `left` and `right`. Move `right` one spot left.
2. **If the sum is too small:** The value at `left` is too small to make a pair with any value between `left` and `right`. Move `left` one spot right.

> [!NOTE]
> What can go wrong if you use this method on an unsorted array like `[15, 2, 28, 7]`?
>
> *Answer:* The pointer moves are no longer safe. The sum may go up or down in an unpredictable way, so the method can skip the answer.

---

### 2.6 When the Pointers Meet

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

Use `while (left < right)`. Do not use `left <= right`: when both pointers meet, one value cannot be paired with itself.

---

## 3. Problem Walkthroughs

---

### 3.1 Two Sum II

#### 3.1.1 Problem Statement
Given a sorted array `numbers`, find two values that add up to `target`. Return their positions, counting from 1. Do not use the same value twice. There is exactly one answer.

* **Input:** `numbers = [2, 7, 11, 15]`, `target = 9` -> **Output:** `[1, 2]`
* **Input:** `numbers = [2, 3, 4]`, `target = 6` -> **Output:** `[1, 3]`
* **Input:** `numbers = [-1, 0]`, `target = -1` -> **Output:** `[1, 2]`
* **Input limits:** 2 to 30,000 values. Each value and the target are between -1,000 and 1,000. The array is sorted from smallest to largest.

#### 3.1.2 How to Think About It
Use two fingers on `[2, 7, 11, 15]`, one at each end. Add those values: `2 + 15 = 17`, which is too big. Move the right finger left to `11`. The sum is still too big, so move it left again to `7`. Now `2 + 7 = 9`. Return positions `[1, 2]`, counting from 1.

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

* **The slow part:** This method ignores that the array is sorted. After `2 + 15` is too big, it still checks `7 + 15`, which is even bigger. The nested loops can take `O(n^2)` time.

#### 3.1.4 The Pattern Insight
Because `numbers` is sorted, each sum tells us which pointer to move:
* If `sum > target`, move `right` one spot left.
* If `sum < target`, move `left` one spot right.
* The pointers move at most `n` times. This takes `O(n)` time and `O(1)` extra space.

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
// ✅ CORRECT: Checks at most n pairs and uses only a few variables.
function twoSumII(numbers, target) {
  if (!Array.isArray(numbers) || numbers.length < 2) return [];

  let left = 0;
  let right = numbers.length - 1;

  while (left < right) {
    const sum = numbers[left] + numbers[right];

    if (sum === target) {
      return [left + 1, right + 1]; // Count positions from 1.
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
  // The Map uses extra space that the sorted two-pointer method does not need.
  const seen = new Map();
  for (let i = 0; i < numbers.length; i++) {
    const comp = target - numbers[i];
    if (seen.has(comp)) return [seen.get(comp) + 1, i + 1];
    seen.set(numbers[i], i);
  }
  return [];
}
```
* **Why it is a poor fit:** The Map uses memory that grows with the array. Since the values are sorted, two pointers solve the problem with only a few variables.

#### 3.1.8 Complexity Derivation
* **Time:** `O(n)`. One pointer moves on each step. They meet after at most `n` steps.
* **Extra space:** `O(1)`. The function uses only two index variables.

---

### 3.2 Container With Most Water

#### 3.2.1 Problem Statement
You are given an array `height`. Each value is the height of a wall. Choose two walls that can hold the most water with the ground. Return the amount of water they can hold.

* **Input:** `height = [1, 8, 6, 2, 5, 4, 8, 3, 7]` -> **Output:** `49`
* **Input:** `height = [1, 1]` -> **Output:** `1`
* **Input:** `height = [4, 3, 2, 1, 4]` -> **Output:** `16`
* **Input limits:** 2 to 100,000 walls. Each height is between 0 and 10,000.

#### 3.2.2 How to Think About It
Imagine vertical walls in the ground: [1, 8, 6, 2, 5, 4, 8, 3, 7]
1. Start by testing the widest possible container: wall at index 0 (height 1) and wall at index 8 (height 7).
2. Width = 8 - 0 = 8.
3. Water can only rise up to the height of the shorter wall. min(1, 7) = 1
4. Area = 8 × 1 = 8.
5. How can we find a larger area?
6. * Any new container will have a smaller width (< 8).
   * To get a larger area, we need a taller water height.
   * The current water height is limited by the wall with height 1.
   * Keeping height 1 means the water height can never be greater than 1.
7. * If we move the taller wall (7), the width becomes smaller.
   * The water height is still limited by 1.
   * So the area cannot become larger.
8. * The wall with height 1 is limiting the container.
   * Move past it: left++.


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

* **The slow part:** Checking every pair takes `O(n^2)` time. With 100,000 walls, that means billions of checks.

#### 3.2.4 The Pattern Insight
Start with the widest gap: `left = 0`, `right = height.length - 1`. Find its area, then move the shorter wall inward.

Why move the shorter wall? The shorter wall limits the water height. Moving the taller wall makes the gap narrower but does not let the water rise higher. Moving the shorter wall may find a taller one. Check each pair as the pointers move. This takes `O(n)` time and `O(1)` extra space.

> [!NOTE]
> If the wall heights are 3 and 8, why should we move the wall with height 3?
>
> *Answer:* The shorter wall limits the water height. Moving the taller wall only makes the gap narrower.

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
// ✅ CORRECT: Checks each pair once as the pointers move inward.
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

    // Move the shorter wall inward.
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
* **Why it fails:** Moving the taller wall makes the gap smaller. The shorter wall still limits the water height, so the area cannot improve.

#### 3.2.8 Complexity Derivation
* **Time:** `O(n)`. A pointer moves inward on every step, for at most `n - 1` steps.
* **Extra space:** `O(1)`. The function uses a few number variables.

---

### 3.3 3Sum

#### 3.3.1 Problem Statement
Given an integer array `nums`, return every different group of three values that adds up to `0`. Do not return the same group more than once.

* **Input:** `nums = [-1, 0, 1, 2, -1, -4]` -> **Output:** `[[-1, -1, 2], [-1, 0, 1]]`
* **Input:** `nums = [0, 1, 1]` -> **Output:** `[]`
* **Input:** `nums = [0, 0, 0]` -> **Output:** `[[0, 0, 0]]`
* **Input limits:** 3 to 3,000 values. Each value is between -100,000 and 100,000.

#### 3.3.2 How to Think About It
Sort the values: `[-4, -1, -1, 0, 1, 2]`. Hold one value still, such as `-1`. Now find two values to its right that add up to `1`, because `-1 + 1 = 0`. Use two pointers to find that pair. Skip equal values so the same group is not returned twice.

#### 3.3.3 Brute Force Approach & Bottleneck
The slow method uses three loops to check every group of three values, then removes duplicate groups.
* **The slow part:** Three loops can take `O(n^3)` time. With 3,000 values, there are about 4.5 billion different groups of three to check.

#### 3.3.4 The Pattern Insight
First sort the array. Then hold each value in turn and search the remaining values with two pointers.
* If the held value is greater than 0, stop. The values after it are also positive, so their sum cannot be 0.
* If the held value matches the previous one, skip it.
* When a group adds to 0, record it and skip equal pointer values.

Sorting takes `O(n log n)` time. The search takes `O(n^2)` time.

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
// ✅ CORRECT: Sorts once, then searches with two pointers.
function threeSum(nums) {
  if (!Array.isArray(nums) || nums.length < 3) return [];

  // Sort from smallest to largest.
  nums.sort((a, b) => a - b);
  const result = [];

  for (let i = 0; i < nums.length - 2; i++) {
    // Three positive values cannot add to zero.
    if (nums[i] > 0) break;

    // Do not start with the same value twice.
    if (i > 0 && nums[i] === nums[i - 1]) continue;

    let left = i + 1;
    let right = nums.length - 1;

    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];

      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);

        // Skip equal values so this group is not returned again.
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;

        left++;
        right--;
      } else if (sum < 0) {
        left++; // A larger value makes the sum larger.
      } else {
        right--; // A smaller value makes the sum smaller.
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
* **Why it fails:** Repeated values can make the function return the same group more than once.

#### 3.3.8 Complexity Derivation
* **Time:** `O(n^2)`. Sorting takes `O(n log n)`. For each held value, the two pointers scan the rest once. The scan's `O(n^2)` work is larger than the sorting work.
* **Extra space:** The scan uses `O(1)` extra space. This does not count the output or any memory used internally by the JavaScript sort.

---

## 4. Tricky Edge Cases

* **Stop when the pointers meet:** A value cannot pair with itself. Use `left < right`.
* **Equal wall heights:** When both walls match, moving either one is safe.
* **Sorting:** Two Sum II and 3Sum need sorted values for these pointer moves. Container With Most Water does not.
* **3Sum duplicates:** Skip repeats at the held value and after finding a group.

---

## 5. Summary Cheat Sheet

* **Opposing pointers:** Start at `0` and `n - 1`. Move the pointer that can bring you closer to the answer.
* **Two Sum II:** If the sum is too small, move `left` right. If it is too large, move `right` left.
* **Container With Most Water:** Always move past the shorter wall. Moving the taller wall can never make a bigger container.
* **3Sum:** Sort the array, hold one value, then search the rest with two pointers. Skip repeats to avoid duplicate groups.

---

## 6. Practice Problems

### 6.1 Valid Palindrome II
Given a string `s`, return `true` if `s` can be a palindrome after deleting at most one character from it.
* **Input:** `s = "aba"` -> **Output:** `true`
* **Input:** `s = "abca"` -> **Output:** `true` (delete `'c'`)
* **Input:** `s = "abc"` -> **Output:** `false`
* **Input limits:** 1 to 100,000 lowercase letters.
* **Hint 1:** Use two pointers from opposite ends.
* **Hint 2:** When you find the first mismatch (`s[left] !== s[right]`), check if deleting `s[left]` OR deleting `s[right]` leaves a valid palindrome.

---

### 6.2 Sort Transformed Array
Given a sorted array `nums` and values `a`, `b`, and `c`, calculate `a*x*x + b*x + c` for each value. Return the results sorted, in `O(n)` time.
* **Input:** `nums = [-4, -2, 2, 4]`, `a = 1`, `b = 3`, `c = 5` -> **Output:** `[3, 9, 15, 33]`
* **Input:** `nums = [-4, -2, 2, 4]`, `a = -1`, `b = 3`, `c = 5` -> **Output:** `[-23, -5, 1, 7]`
* **Input limits:** 1 to 10,000 sorted values.
* **Hint 1:** Compare the results at both ends of the array.
* **Hint 2:** Use two pointers. Put each larger result at the end of the output array.

---

### 6.3 Trapping Rain Water
Given bar heights, find how much water they hold after rain. Use two pointers in `O(n)` time and `O(1)` extra space.
* **Input:** `height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]` -> **Output:** `6`
* **Input:** `height = [4, 2, 0, 3, 2, 5]` -> **Output:** `9`
* **Input limits:** 1 to 20,000 bars. Each height is between 0 and 100,000.
* **Hint 1:** A bar holds water only if there are taller bars on both sides.
* **Hint 2:** Track the tallest wall seen from each side. Move the pointer at the shorter side and add any water held above that bar.

---

<nav aria-label="Lecture navigation">

[Previous: Hash Table Patterns: Frequency, Complements & Duplicates](day-05-hash-patterns-frequency-counting-and-duplicates.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Fast & Slow](day-07-two-pointers-fast-slow-and-partitioning.md)

</nav>
