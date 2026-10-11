# Day 16: Binary Search: Bounds & Rotated Arrays

<nav aria-label="Lecture navigation">

[Previous: Queues & Circular Buffers](day-15-queues-circular-buffers-and-design.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search on Solution Space](day-17-binary-search-on-solution-space.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Logarithmic complexity ($O(\log n)$).
- [Day 03: Searching & Elementary Sorting](day-03-searching-and-sorting-algorithms.md) — Binary search basics.

---

## 1. What is Binary Search?

**Binary Search** finds a target in a **sorted array** in **$O(\log n)$ time** by repeatedly cutting the search space in half.

Think of flipping to page 500 in a 1,000-page telephone directory:
- If the name on page 500 starts with "Kim" and you need "Miller", "Miller" must be in pages 501–1,000.
- You immediately discard pages 1–500!
- In an array of $1,000,000$ items, it finds any item in at most **20 checks**.

```text
Searching for 23 in: [ 2, 5, 8, 12, 16, 23, 38, 56 ]
                       ▲        ▲               ▲
                      low      mid             high
Step 1: mid = index 3 (value 12). 12 < 23 ──► Discard left half! low = mid + 1 (4).
[ 16, 23, 38, 56 ]
  ▲       ▲   ▲
 low     mid high
Step 2: mid = index 5 (value 23). Match! Found in 2 steps.
```

---

## 2. The 3 Invariants for Bug-Free Binary Search

Binary search is famous for off-by-one errors and infinite loops. Always stick to these 3 rules:
1. **Loop condition:** `while (low <= high)` guarantees single-element search spaces are checked.
2. **Safe midpoint:** `low + Math.floor((high - low) / 2)` prevents decimal fraction bugs.
3. **Strict interval shrinking:** Always update `low = mid + 1` or `high = mid - 1`. Never do `low = mid` or `high = mid` (causes infinite loops!).

---

## 3. Problem 1: Search Insert Position (Lower Bound)

Given a sorted array of distinct integers and a target value, return the index if found. If not, return the index where it would be if it were inserted in order.

```javascript
// Node.js code
function searchInsert(nums, target) {
  let low = 0;
  let high = nums.length - 1;

  while (low <= high) {
    const mid = Math.floor(low + (high - low) / 2);

    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  // When loop terminates, 'low' is the exact insert position!
  return low;
}

console.log(searchInsert([1, 3, 5, 6], 5)); // 2
console.log(searchInsert([1, 3, 5, 6], 2)); // 1
console.log(searchInsert([1, 3, 5, 6], 7)); // 4
```
- **Time Complexity:** $O(\log n)$
- **Extra Space:** $O(1)$

---

## 4. Problem 2: Search in Rotated Sorted Array

An array sorted in ascending order was rotated at an unknown pivot (e.g., `[4, 5, 6, 7, 0, 1, 2]`). Find the index of `target`.

### The Core Insight: One Half is ALWAYS Sorted
In any rotated sorted array, splitting at `mid` always leaves **at least one half perfectly sorted**!
1. Check if `nums[mid] === target`.
2. Check if the **left half is sorted** (`nums[low] <= nums[mid]`):
   - If target is inside `[nums[low], nums[mid]]`, search left: `high = mid - 1`.
   - Otherwise, search right: `low = mid + 1`.
3. Otherwise, the **right half is sorted**:
   - If target is inside `[nums[mid], nums[high]]`, search right: `low = mid + 1`.
   - Otherwise, search left: `high = mid - 1`.

```javascript
// Node.js code
function searchRotated(nums, target) {
  let low = 0;
  let high = nums.length - 1;

  while (low <= high) {
    const mid = Math.floor(low + (high - low) / 2);

    if (nums[mid] === target) return mid;

    // Case 1: Left half is normally sorted
    if (nums[low] <= nums[mid]) {
      if (nums[low] <= target && target < nums[mid]) {
        high = mid - 1; // Target is in left half
      } else {
        low = mid + 1;  // Target is in right half
      }
    }
    // Case 2: Right half is normally sorted
    else {
      if (nums[mid] < target && target <= nums[high]) {
        low = mid + 1;  // Target is in right half
      } else {
        high = mid - 1; // Target is in left half
      }
    }
  }

  return -1;
}

console.log(searchRotated([4, 5, 6, 7, 0, 1, 2], 0)); // 4
console.log(searchRotated([4, 5, 6, 7, 0, 1, 2], 3)); // -1
```
- **Time Complexity:** $O(\log n)$
- **Extra Space:** $O(1)$

---

## 5. Tricky Points and Common Traps

1. **Using `<` instead of `<=`: `while (low < high)`** misses the target if the search space shrinks to a single element.
2. **Infinite loop trap:** Forgetting the `+ 1` or `- 1` when adjusting `low` or `high` will trap binary search in an infinite loop when `high - low === 1`.
3. **Handling duplicates in rotated arrays:** If duplicates are allowed (e.g. `[1, 0, 1, 1, 1]`), `nums[low] === nums[mid]` can occur. In that case, you must do `low++` to resolve ambiguity, which degrades worst-case to $O(n)$.

---

## 6. Hands-On Exercises

Run this script in Node.js to verify binary search and rotated array search:

```javascript
// Node.js code
const assert = require("node:assert");

function testSearch(nums, target) {
  let l = 0, r = nums.length - 1;
  while (l <= r) {
    const m = Math.floor((l + r) / 2);
    if (nums[m] === target) return m;
    if (nums[l] <= nums[m]) {
      if (nums[l] <= target && target < nums[m]) r = m - 1;
      else l = m + 1;
    } else {
      if (nums[m] < target && target <= nums[r]) l = m + 1;
      else r = m - 1;
    }
  }
  return -1;
}

assert.equal(testSearch([4, 5, 6, 7, 0, 1, 2], 0), 4);
assert.equal(testSearch([4, 5, 6, 7, 0, 1, 2], 7), 3);
assert.equal(testSearch([1], 0), -1);

console.log("✅ Rotated binary search assertions passed!");
```

---

## 7. Summary

- **Binary Search** runs in $O(\log n)$ by halving the search space each step.
- **The 3 invariants**: `while (low <= high)`, `Math.floor((high - low) / 2)`, and `mid ± 1`.
- **Search Insert Position**: `low` holds the exact insertion index upon loop termination.
- **Rotated Array**: Identify which half is sorted, then check if target falls inside that sorted half.

---

## 8. Cheat Sheet

| Problem | Key Decision Rule |
| :--- | :--- |
| **Standard BS** | `nums[mid] < target ? low = mid + 1 : high = mid - 1` |
| **Insert Position** | Return `low` when loop finishes |
| **Rotated Array** | Identify sorted half: `nums[low] <= nums[mid]` |
| **Complexity** | **$O(\log n)$ time**, **$O(1)$ space** |

---

## 9. Interview Q&A

### 45-Second Explanation
> *"To search in a rotated sorted array in $O(\log n)$ time, we observe that dividing the array at the midpoint always leaves at least one half strictly sorted. We first identify which half is normally sorted by comparing `nums[low]` and `nums[mid]`. Next, we check if the target falls within the boundary values of that sorted half. If it does, we narrow our search to that half; otherwise, we search the opposite half. This maintains the logarithmic halving invariant."*

---

## 10. Practice Problems

### 1. Search Insert Position - Easy
Given a sorted array of distinct integers and a target value, return the index if the target is found. If not, return the index where it would be if it were inserted in order.
- **Input:** `nums = [1,3,5,6], target = 5`
- **Expected Output:** `2`
- **Input:** `nums = [1,3,5,6], target = 2`
- **Expected Output:** `1`
- **Input:** `nums = [1,3,5,6], target = 7`
- **Expected Output:** `4`

### 2. Search in Rotated Sorted Array - Medium
Given the array `nums` after the possible rotation and an integer `target`, return the index of `target` if it is in `nums`, or `-1` if it is not in `nums`.
- **Input:** `nums = [4,5,6,7,0,1,2], target = 0`
- **Expected Output:** `4`
- **Input:** `nums = [4,5,6,7,0,1,2], target = 3`
- **Expected Output:** `-1`
- **Input:** `nums = [1], target = 0`
- **Expected Output:** `-1`

### 3. Find Minimum in Rotated Sorted Array - Medium
Given the sorted rotated array `nums` of unique elements, return the minimum element of this array.
- **Input:** `nums = [3,4,5,1,2]`
- **Expected Output:** `1`
- **Input:** `nums = [4,5,6,7,0,1,2]`
- **Expected Output:** `0`
- **Input:** `nums = [11,13,15,17]`
- **Expected Output:** `11`

---

<nav aria-label="Lecture navigation">

[Previous: Queues & Circular Buffers](day-15-queues-circular-buffers-and-design.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Search on Solution Space](day-17-binary-search-on-solution-space.md)

</nav>
