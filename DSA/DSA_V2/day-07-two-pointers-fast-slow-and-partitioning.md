# Day 07: Two Pointers: Fast & Slow

<nav aria-label="Lecture navigation">

[Previous: Two Pointers: Opposing & Symmetrical](day-06-two-pointers-opposing-and-symmetrical.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Sliding Window: Fixed Size](day-08-sliding-window-fixed-size.md)

</nav>

## Prerequisites

- [Day 02: Arrays, Strings & Memory](day-02-arrays-strings-and-primitive-memory.md) — In-place array mutations.
- [Day 06: Two Pointers: Opposing & Symmetrical](day-06-two-pointers-opposing-and-symmetrical.md) — Two pointer fundamentals.

---

## 1. What are Fast and Slow Pointers?

Unlike opposing pointers that start at opposite ends, **Fast & Slow pointers** both start at the beginning of the array and move forward in the **same direction** at different speeds or conditions.

Think of it like cleaning a messy shelf in place:
- **Fast Pointer (The Scout)**: Scans quickly through every item from left to right.
- **Slow Pointer (The Writer)**: Tracks the next open slot where a valid item should be kept.

Whenever the Scout finds a valid item, it writes it to the Writer's slot:
$$\text{arr}[\text{slow}] = \text{arr}[\text{fast}], \quad \text{slow}++$$

```text
Array: [ 0, 1, 0, 3, 12 ], Goal: Move Zeroes to End
Step 1: fast=0 (val 0): Zero detected! slow stays at index 0. fast advances.
Step 2: fast=1 (val 1): Non-zero! Swap with slow (0) -> [ 1, 0, 0, 3, 12 ], slow=1, fast=2.
Step 3: fast=2 (val 0): Zero detected! fast advances.
Step 4: fast=3 (val 3): Non-zero! Swap with slow (1) -> [ 1, 3, 0, 0, 12 ], slow=2, fast=4.
Step 5: fast=4 (val 12): Non-zero! Swap with slow (2) -> [ 1, 3, 12, 0, 0 ], Done in O(n)!
```

---

## 2. Problem 1: Remove Duplicates from Sorted Array

Given a sorted array `nums`, remove the duplicates **in place** so each unique number appears once. Return the count of unique numbers.

### The Algorithm
Because the array is sorted, duplicates sit side by side:
- `slow`: Points to the last unique element placed.
- `fast`: Scans ahead from index 1 to $n - 1$.
- When `nums[fast] !== nums[slow]`: We found a new unique number! Increment `slow++` and copy `nums[slow] = nums[fast]`.

```javascript
// Node.js code
function removeDuplicates(nums) {
  if (nums.length === 0) return 0;

  let slow = 0; // Index of last unique item placed

  for (let fast = 1; fast < nums.length; fast++) {
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast]; // Overwrite next slot
    }
  }

  return slow + 1; // Length of unique subarray
}

const arr = [1, 1, 2, 2, 3];
const k = removeDuplicates(arr);
console.log(k); // 3
console.log(arr.slice(0, k)); // [1, 2, 3]
```
- **Time Complexity:** $O(n)$ — Single pass.
- **Extra Space:** $O(1)$ — Done in place.

---

## 3. Problem 2: Move Zeroes

Given an integer array `nums`, move all `0`s to the end while keeping the relative order of the non-zero elements.

```javascript
// Node.js code
function moveZeroes(nums) {
  let slow = 0; // Next slot where a non-zero element should go

  for (let fast = 0; fast < nums.length; fast++) {
    if (nums[fast] !== 0) {
      // Swap non-zero element into the slow slot
      const temp = nums[slow];
      nums[slow] = nums[fast];
      nums[fast] = temp;
      slow++;
    }
  }

  return nums;
}

console.log(moveZeroes([0, 1, 0, 3, 12])); // [1, 3, 12, 0, 0]
console.log(moveZeroes([0]));              // [0]
```
- **Time Complexity:** $O(n)$ — Single pass.
- **Extra Space:** $O(1)$ — Zero extra memory allocated.

---

## 4. Problem 3: Happy Number (Cycle Detection)

A number is "happy" if replacing it with the sum of the squares of its digits repeatedly leads to 1. If it loops endlessly in a cycle without reaching 1, it is not happy.

### The Floyd's Cycle (Tortoise & Hare) Trick:
Think of two runners on a circular track. A fast runner moving at $2\times$ speed will eventually catch up to a slow runner if there is a cycle!

```javascript
// Node.js code
function getNext(n) {
  let totalSum = 0;
  while (n > 0) {
    const digit = n % 10;
    totalSum += digit * digit;
    n = Math.floor(n / 10);
  }
  return totalSum;
}

function isHappy(n) {
  let slow = n;
  let fast = getNext(n);

  while (fast !== 1 && slow !== fast) {
    slow = getNext(slow);           // 1 step
    fast = getNext(getNext(fast));   // 2 steps
  }

  return fast === 1;
}

console.log(isHappy(19)); // true (19 -> 82 -> 68 -> 100 -> 1)
console.log(isHappy(2));  // false (cycles endlessly)
```
- **Time Complexity:** $O(\log n)$ — Sum of squares drops fast.
- **Extra Space:** $O(1)$ — Zero extra memory (no Set required!).

---

## 5. Tricky Points and Common Traps

1. **Returning length vs index in `removeDuplicates`:** The index of the last element is `slow`, but the length of the result is `slow + 1`!
2. **Unnecessary self-swaps in `moveZeroes`:** If `slow === fast`, you can skip swapping to save a few CPU instructions.
3. **Handling array length 0:** Always check `if (nums.length === 0) return 0;` at the very beginning.

---

## 6. Hands-On Exercises

Run this script in Node.js to test duplicate removal and moving zeroes:

```javascript
// Node.js code
const assert = require("node:assert");

const nums = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4];
function testDedup(arr) {
  let s = 0;
  for (let f = 1; f < arr.length; f++) {
    if (arr[f] !== arr[s]) {
      s++;
      arr[s] = arr[f];
    }
  }
  return s + 1;
}

const len = testDedup(nums);
assert.equal(len, 5);
assert.deepEqual(nums.slice(0, len), [0, 1, 2, 3, 4]);

console.log("✅ Deduplication tests passed!");
```

---

## 7. Summary

- **Same-direction pointers** move forward together: `fast` explores, and `slow` writes.
- **In-place compaction** (removing duplicates, moving zeroes) takes $O(n)$ time and $O(1)$ space.
- **Floyd's Tortoise and Hare** detects cycles by advancing `slow` by 1 step and `fast` by 2 steps without extra memory.

---

## 8. Cheat Sheet

| Problem | Pointer Roles | Swap / Write Rule | Complexity |
| :--- | :--- | :--- | :---: |
| **Remove Duplicates** | `slow` = unique end, `fast` = scanner | `nums[++slow] = nums[fast]` | $O(n)$ time, $O(1)$ space |
| **Move Zeroes** | `slow` = non-zero slot, `fast` = scanner | Swap when `nums[fast] !== 0` | $O(n)$ time, $O(1)$ space |
| **Cycle Detection** | `slow` = 1 step, `fast` = 2 steps | Stop when `slow === fast` | $O(n)$ time, $O(1)$ space |

---

## 9. Interview Q&A

### 45-Second Explanation
> *"For in-place array partitioning like Move Zeroes, we use two same-direction pointers. A slow pointer tracks where the next valid element belongs, while a fast pointer scans through every item. Whenever the fast pointer finds a non-zero element, we swap it with the element at the slow pointer and advance slow. This reorganizes the array in a single $O(n)$ pass without allocating extra memory."*

### Questions & Answers
1. **Why is Floyd's cycle detection better than using a Set?**
   A Set requires $O(n)$ extra memory to remember seen states. Floyd's cycle detection only tracks two numbers, running in $O(1)$ space.

---

## 10. Practice Problems

### 1. Remove Duplicates from Sorted Array - Easy
Given an integer array `nums` sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once. The relative order of the elements should be kept the same. Then return the number of unique elements in `nums`.
- **Input:** `nums = [1,1,2]`
- **Expected Output:** `2` (with array beginning `[1,2]`)
- **Input:** `nums = [0,0,1,1,1,2,2,3,3,4]`
- **Expected Output:** `5` (with array beginning `[0,1,2,3,4]`)

### 2. Move Zeroes - Easy
Given an integer array `nums`, move all `0`'s to the end of it while maintaining the relative order of the non-zero elements. Note that you must do this in-place without making a copy of the array.
- **Input:** `nums = [0,1,0,3,12]`
- **Expected Output:** `[1,3,12,0,0]`
- **Input:** `nums = [0]`
- **Expected Output:** `[0]`

### 3. Happy Number - Easy
Write an algorithm to determine if a number `n` is happy. A happy number is a number defined by replacing the number by the sum of the squares of its digits, repeating the process until the number equals 1, or it loops endlessly in a cycle which does not include 1.
- **Input:** `n = 19`
- **Expected Output:** `true`
- **Input:** `n = 2`
- **Expected Output:** `false`

---

<nav aria-label="Lecture navigation">

[Previous: Two Pointers: Opposing & Symmetrical](day-06-two-pointers-opposing-and-symmetrical.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Sliding Window: Fixed Size](day-08-sliding-window-fixed-size.md)

</nav>
