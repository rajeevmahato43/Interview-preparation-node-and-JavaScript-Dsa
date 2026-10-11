# Day 06: Two Pointers: Opposing & Symmetrical Scans

<nav aria-label="Lecture navigation">

[Previous: Hash Table Patterns: Frequency, Complements & Duplicates](day-05-hash-patterns-frequency-counting-and-duplicates.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Fast & Slow](day-07-two-pointers-fast-slow-and-partitioning.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem-Solving](day-01-big-o-complexity-and-problem-solving.md) — Big O basics ($O(n), O(n^2)$) and extra memory ($O(1)$ space).
- [Day 02: JavaScript Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md) — Array indexes and swapping elements.

---

## 1. What is the Two-Pointer Technique?

The **Two-Pointer technique** is a simple way to search or process an array by using two index numbers at the same time instead of nested loops.

> **Pointer**: An integer variable (like `left` or `right`) that holds an array index (`0`, `1`, `2`, ...).

### The Problem It Solves
If you use two nested loops to check every pair in an array, your code runs in **$O(n^2)$ time**:
```javascript
// ❌ Slow way: Nested loops test every single pair (O(n^2))
for (let i = 0; i < arr.length; i++) {
  for (let j = i + 1; j < arr.length; j++) {
    if (arr[i] + arr[j] === target) return [i, j];
  }
}
```
For $100,000$ items, this takes billions of operations and freezes your Node.js server.

### The Big Idea: Using Sorted Order
When an array is already sorted, you don't need to guess or test every pair:
- Put `left` at the start (smallest value).
- Put `right` at the end (largest value).
- **If the sum is too small:** Move `left` forward (`left++`) to get a bigger number.
- **If the sum is too big:** Move `right` backward (`right--`) to get a smaller number.

Because each move skips pairs that can never work, you solve the problem in a single pass (**$O(n)$ time**) with zero extra memory (**$O(1)$ space**).

```text
  Sorted: [ 1,  3,  5,  8,  11,  15 ], Target = 13
            ▲                     ▲
          left                  right

  Step 1: 1 + 15 = 16 (too big!)  --> move right down (right--)
  Step 2: 1 + 11 = 12 (too small!) --> move left up (left++)
  Step 3: 3 + 11 = 14 (too big!)  --> move right down (right--)
  Step 4: 3 + 8  = 11 (too small!) --> move left up (left++)
  Step 5: 5 + 8  = 13 (MATCH!)    --> return [2, 3]
```

---

## 2. The 3 Types of Two-Pointer Techniques

Before jumping into code, here are the three main ways two pointers are used:

| Type | How Pointers Move | When to Use It | Examples |
| :--- | :--- | :--- | :--- |
| **1. Opposing Pointers (Today)** | Start at both ends and walk toward the middle (`left ->` ... `<- right`) | When the array is sorted, or when checking symmetry from both sides | *Two Sum II, Valid Palindrome, Container With Most Water, 3Sum* |
| **2. Fast & Slow Pointers (Day 07)** | Both start at the beginning, one moves faster (`slow ->`, `fast ->>`) | Finding loops/cycles or middle elements | *Linked List Cycle, Middle of List* |
| **3. Read & Write Pointers (Day 07)** | Both start at the beginning; one reads, one writes in-place | Modifying an array without making a new one | *Remove Duplicates, Move Zeroes* |

---

## 3. How Opposing Two Pointers Works (Step-by-Step)

1. **Start at both ends**:
   - `left = 0` (first element)
   - `right = arr.length - 1` (last element)
2. **Loop while they haven't met**:
   - `while (left < right)`
3. **Check the current pair**:
   - If `arr[left] + arr[right] === target`: You found the answer!
   - If the sum is **smaller** than target: Increase it by doing `left++`.
   - If the sum is **larger** than target: Decrease it by doing `right--`.
4. **Stop**: If `left` and `right` cross without finding a match, the answer does not exist.

---

## 4. Simple Code Template

You can reuse this simple template for almost any opposing two-pointer problem:

```javascript
// Node.js code: Opposing Two-Pointer Template
function twoPointerTemplate(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left < right) {
    const current = arr[left] + arr[right];

    if (current === target) {
      return [left, right]; // Found answer
    } else if (current < target) {
      left++; // Need a larger value
    } else {
      right--; // Need a smaller value
    }
  }

  return null; // No match found
}
```

---

## 5. How to Spot This in Interviews

Look for these clues in the problem statement:
- **"The array is already sorted"** and asks for a pair or triplet $\to$ *Opposing Two Pointers*.
- **"Check if string reads the same backward"** $\to$ *Opposing Two Pointers (Palindrome)*.
- **"Find maximum area / water container"** $\to$ *Opposing Two Pointers*.
- **"Do this in $O(1)$ extra memory"** $\to$ Points to pointers instead of a `Map` or `Set`.

---

## 6. Problem 1: Two Sum II (Sorted Array)

Given a **1-indexed** sorted array `numbers` and a `target`, find the two numbers that add up to `target`. Return their 1-based positions `[index1, index2]`.

```javascript
// Node.js code
function twoSumSorted(numbers, target) {
  let left = 0;
  let right = numbers.length - 1;

  while (left < right) {
    const sum = numbers[left] + numbers[right];

    if (sum === target) {
      return [left + 1, right + 1]; // Return 1-based index
    } else if (sum < target) {
      left++; // Sum too small, take a larger number
    } else {
      right--; // Sum too big, take a smaller number
    }
  }

  return [];
}

console.log(twoSumSorted([2, 7, 11, 15], 9)); // [1, 2]
console.log(twoSumSorted([2, 3, 4], 6));       // [1, 3]
```

- **Time Complexity:** $O(n)$ — Each step moves one pointer closer. We visit each element at most once.
- **Extra Space:** $O(1)$ — Only two numbers stored in memory (`left` and `right`).

---

## 7. Problem 2: Container With Most Water

You are given an array of heights `[1, 8, 6, 2, 5, 4, 8, 3, 7]`. Each number represents the height of a vertical line. Find two lines that hold the most water.

$$\text{Water Area} = \text{width} \times \text{shorter height} = (right - left) \times \min(height[left], height[right])$$

### Why Move the Shorter Line?
Water spills over the shorter wall. The only way to find a bigger container as the width gets narrower is to **find a taller wall**. Moving the taller wall never helps because the water level is still limited by the short one!

```javascript
// Node.js code
function maxArea(height) {
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

    // Always move the shorter line inward
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }

  return maxWater;
}

console.log(maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7])); // 49
console.log(maxArea([1, 1]));                         // 1
```

- **Time Complexity:** $O(n)$ — Single pass through the array.
- **Extra Space:** $O(1)$ — No extra arrays created.

---

## 8. Problem 3: 3Sum

Find all unique triplets `[a, b, c]` in an array that add up to `0`: $a + b + c = 0$.

### The 3-Step Strategy
1. **Sort the array first**: Sorting takes $O(n \log n)$ and makes two pointers possible.
2. **Fix the first number (`nums[i]`)**: Run a loop from index `0` to `n - 3`.
3. **Use Two Pointers for the other two numbers**: Search the rest of the array for two numbers that add up to `-nums[i]`.

```javascript
// Node.js code
function threeSum(nums) {
  const result = [];
  if (nums.length < 3) return result;

  // 1. Sort the numbers from smallest to largest
  nums.sort((a, b) => a - b);

  for (let i = 0; i < nums.length - 2; i++) {
    // If the smallest number is > 0, three numbers can never sum to 0
    if (nums[i] > 0) break;

    // Skip duplicate values for the first number
    if (i > 0 && nums[i] === nums[i - 1]) continue;

    let left = i + 1;
    let right = nums.length - 1;
    const target = -nums[i];

    while (left < right) {
      const sum = nums[left] + nums[right];

      if (sum === target) {
        result.push([nums[i], nums[left], nums[right]]);

        // Skip duplicate numbers on the left and right
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;

        left++;
        right--;
      } else if (sum < target) {
        left++; // Need a bigger sum
      } else {
        right--; // Need a smaller sum
      }
    }
  }

  return result;
}

console.log(threeSum([-1, 0, 1, 2, -1, -4])); // [ [-1, -1, 2], [-1, 0, 1] ]
```

- **Time Complexity:** $O(n^2)$ — Sorting is $O(n \log n)$. The outer loop runs $n$ times with an inner $O(n)$ scan ($n \times n = n^2$).
- **Extra Space:** $O(1)$ — Beyond the result array, we only use index pointers.

---

## 9. Tricky Points and Common Traps

1. **Only works if sorted:** Opposing pointers will **not work on an unsorted array**. If the array is not sorted, you must sort it first or use a Hash Map.
2. **Watch the loop condition (`<` vs `<=`):**
   - Use `while (left < right)`.
   - If you use `left <= right`, an element can pair with itself (`nums[left] + nums[left]`), which is usually not allowed.
3. **Skipping duplicates in 3Sum:**
   - Always skip duplicate values for the outer loop (`nums[i] === nums[i - 1]`).
   - After finding a match, skip duplicate values for `left` and `right` to avoid duplicate answer lists.
4. **JavaScript `arr.sort()` trap:**
   - Always pass a compare function: `nums.sort((a, b) => a - b)`.
   - Without it, `[10, 5].sort()` becomes `[10, 5]` because JavaScript sorts numbers as strings by default!

---

## 10. Hands-On Exercises

Run these quick checks in Node.js to test your understanding:

```javascript
// Node.js code
const assert = require("node:assert");

// Exercise 1: Two Sum II check
function testTwoSum(nums, target) {
  let l = 0, r = nums.length - 1;
  while (l < r) {
    const sum = nums[l] + nums[r];
    if (sum === target) return [l + 1, r + 1];
    if (sum < target) l++;
    else r--;
  }
  return [];
}
assert.deepEqual(testTwoSum([2, 7, 11, 15], 9), [1, 2]);
assert.deepEqual(testTwoSum([1, 2, 3, 4], 7), [3, 4]);

// Exercise 2: Container With Most Water check
function testMaxWater(h) {
  let l = 0, r = h.length - 1, max = 0;
  while (l < r) {
    const area = (r - l) * Math.min(h[l], h[r]);
    if (area > max) max = area;
    if (h[l] < h[r]) l++;
    else r--;
  }
  return max;
}
assert.equal(testMaxWater([1, 8, 6, 2, 5, 4, 8, 3, 7]), 49);
assert.equal(testMaxWater([1, 1]), 1);

console.log("✅ All exercises passed successfully!");
```

---

## 11. Summary

- **What it is**: Two index variables (`left` and `right`) scanning an array together instead of nested loops.
- **Why it's fast**: Replaces $O(n^2)$ nested loops with a single $O(n)$ pass.
- **Memory friendly**: Runs in $O(1)$ space because it doesn't create extra objects or maps.
- **When to use**: Any time you have a **sorted array** and need to find pairs, compare opposite ends, or maximize an area.
- **Key rule**: If sum is too small, do `left++`. If sum is too big, do `right--`.

---

## 12. Cheat Sheet

| Problem | Array Condition | Time | Space | Pointer Rule |
| :--- | :--- | :---: | :---: | :--- |
| **Two Sum II** | Already sorted | $O(n)$ | $O(1)$ | `sum < target ? left++ : right--` |
| **Valid Palindrome** | String / array | $O(n)$ | $O(1)$ | `str[left] === str[right] ? (left++, right--) : false` |
| **Container Water** | Heights array | $O(n)$ | $O(1)$ | Move whichever wall is shorter |
| **3Sum** | Sort array first | $O(n^2)$ | $O(1)$ | Fix one number, run Two Sum on the rest |

---

## 13. Technical Discussion & Q&A

### 45-Second Interview Explanation
> *"Because the array is already sorted, we can avoid using extra memory for a hash map by using opposing two pointers. 
> We place one pointer at the start and one at the end. 
> If the sum of the two numbers is less than the target, we increment the left pointer to get a larger value. If it is greater, we decrement the right pointer to get a smaller value. 
> This guarantees an answer in a single $O(n)$ pass while using strictly $O(1)$ extra space."*

---

### Questions & Answers

#### 1. Why does Container With Most Water move the shorter line instead of the taller one?
**Answer:** The amount of water is limited by the shorter line: $\text{Area} = \text{width} \times \text{shorter line}$. As we move inward, the width *always* gets smaller. If we move the taller line, the height can never increase because it is still limited by the short line. Therefore, moving the shorter line is the only move that could reveal a taller wall and increase the area.

#### 2. How does 3Sum prevent duplicate triplets without using a Set?
**Answer:** Because the array is sorted, identical numbers are sitting next to each other. We skip them in two places:
1. In the outer loop, if `nums[i] === nums[i - 1]`, we skip to the next number.
2. After finding a matching triplet, we advance `left` past any identical values and decrement `right` past any identical values before continuing.

#### 3. Why is Two Pointers better than a Hash Map when the array is already sorted?
**Answer:** A Hash Map takes $O(n)$ extra memory to store elements and creates objects in heap memory. Two Pointers only stores two numbers in simple variables, taking $O(1)$ memory and creating zero garbage collection overhead in Node.js.

---

## 14. Practice Problems

Practice these problems on your own:

### 1. Two Sum II - Input Array Is Sorted (Medium)
Given a 1-indexed sorted integer array `numbers` and `target = 9`:
- **Input:** `numbers = [2, 7, 11, 15]`, `target = 9`
- **Expected Output:** `[1, 2]`

### 2. Valid Palindrome (Easy)
Given a string `s`, return `true` if it reads the same forward and backward after removing spaces and punctuation:
- **Input:** `s = "A man, a plan, a canal: Panama"`
- **Expected Output:** `true`

### 3. Container With Most Water (Medium)
Find two vertical lines that hold the most water:
- **Input:** `height = [1, 8, 6, 2, 5, 4, 8, 3, 7]`
- **Expected Output:** `49`

### 4. 3Sum (Medium)
Return all unique triplets that add up to `0`:
- **Input:** `nums = [-1, 0, 1, 2, -1, -4]`
- **Expected Output:** `[[-1, -1, 2], [-1, 0, 1]]`

---

<nav aria-label="Lecture navigation">

[Previous: Hash Table Patterns: Frequency, Complements & Duplicates](day-05-hash-patterns-frequency-counting-and-duplicates.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Fast & Slow](day-07-two-pointers-fast-slow-and-partitioning.md)

</nav>
