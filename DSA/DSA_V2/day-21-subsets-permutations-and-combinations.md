# Day 21: Subsets, Permutations & Combinations

<nav aria-label="Lecture navigation">

[Previous: Recursion Trees & Backtracking](day-20-recursion-trees-and-backtracking-core.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Grid Backtracking & Mazes](day-22-grid-backtracking-and-n-queens.md)

</nav>

## Prerequisites

- [Day 20: Recursion Trees & Backtracking](day-20-recursion-trees-and-backtracking-core.md) — Choose, explore, and unchoose (`pop`) template.

---

## 1. The Big 3 Backtracking Archetypes

Most backtracking interview questions belong to one of three classic patterns:

| Pattern | Order Matters? | Array Length | Loop Index Technique | Complexity |
| :--- | :---: | :---: | :--- | :---: |
| **Subsets** | ❌ No | Any length ($0 \dots n$) | Advance `start` index (`i + 1`) | **$O(2^n)$** |
| **Combinations** | ❌ No | Fixed length $k$ | Advance `start` index (`i + 1`) | **$O(\binom{n}{k})$** |
| **Permutations** | ✅ **Yes** | Always length $n$ | Loop from $0$ using `used` boolean array | **$O(n!)$** |

---

## 2. Archetype 1: Subsets (Power Set)

Given an array of unique integers `nums`, return all possible subsets (the power set).

```javascript
// Node.js code: Subsets
function subsets(nums) {
  const result = [];

  function backtrack(startIndex, currentPath) {
    // Every state in the decision tree is a valid subset!
    result.push([...currentPath]);

    for (let i = startIndex; i < nums.length; i++) {
      currentPath.push(nums[i]);        // Choose
      backtrack(i + 1, currentPath);    // Explore (move start forward)
      currentPath.pop();                // Unchoose
    }
  }

  backtrack(0, []);
  return result;
}

console.log(subsets([1, 2, 3]));
// Output: [ [], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3] ]
```
- **Total Subsets:** Exactly $2^n$ subsets.
- **Time Complexity:** $O(n \cdot 2^n)$ — $2^n$ subsets copied in $O(n)$ time.

---

## 3. Archetype 2: Permutations

Given an array `nums` of distinct integers, return all possible permutations (orderings).

```javascript
// Node.js code: Permutations
function permute(nums) {
  const result = [];
  const used = new Array(nums.length).fill(false);

  function backtrack(currentPath) {
    // Goal reached when path contains all elements
    if (currentPath.length === nums.length) {
      result.push([...currentPath]);
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue; // Skip already used items

      used[i] = true;
      currentPath.push(nums[i]);        // Choose
      backtrack(currentPath);           // Explore
      currentPath.pop();                // Unchoose
      used[i] = false;
    }
  }

  backtrack([]);
  return result;
}

console.log(permute([1, 2, 3]));
// Output: [ [1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1] ]
```
- **Total Permutations:** $n!$ (factorial).
- **Time Complexity:** $O(n \cdot n!)$

---

## 4. Archetype 3: Combination Sum (Reusing Elements)

Given distinct integers `candidates` and a `target`, return all unique combinations where the chosen numbers sum to `target`. The **same number may be chosen an unlimited number of times**.

```javascript
// Node.js code: Combination Sum
function combinationSum(candidates, target) {
  const result = [];

  function backtrack(startIndex, currentPath, remainingSum) {
    if (remainingSum === 0) {
      result.push([...currentPath]); // Found valid sum!
      return;
    }
    if (remainingSum < 0) return; // Exceeded target, prune!

    for (let i = startIndex; i < candidates.length; i++) {
      currentPath.push(candidates[i]);
      // Note: pass 'i', NOT 'i + 1', because we can reuse the same element!
      backtrack(i, currentPath, remainingSum - candidates[i]);
      currentPath.pop();
    }
  }

  backtrack(0, [], target);
  return result;
}

console.log(combinationSum([2, 3, 6, 7], 7));
// Output: [ [2, 2, 3], [7] ]
```
- **Time Complexity:** $O(2^t)$ where $t = \text{target} / \min(\text{candidates})$.

---

## 5. Duplicate Handling: Subsets II

What if the input contains duplicates (like `[1, 2, 2]`) and the answer must **not** contain duplicate subsets?
1. **Sort `nums` first:** `nums.sort((a, b) => a - b)`.
2. **Skip identical elements at the same tree depth:**
   ```javascript
   if (i > startIndex && nums[i] === nums[i - 1]) continue;
   ```

---

## 6. Tricky Points and Common Traps

1. **`i` vs `i + 1` in recursion:**
   - In **Subsets / Combinations without reuse**: Pass `i + 1`.
   - In **Combination Sum with reuse**: Pass `i`.
   - In **Permutations**: Always loop from $0$ using `used[i]`.
2. **Forgetting to sort before duplicate skipping:** `nums[i] === nums[i - 1]` only works if identical numbers sit right next to each other!

---

## 7. Hands-On Exercises

Run this script in Node.js to verify subsets and permutations:

```javascript
// Node.js code
const assert = require("node:assert");

function testSubsets(nums) {
  const res = [];
  function go(start, path) {
    res.push([...path]);
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      go(i + 1, path);
      path.pop();
    }
  }
  go(0, []);
  return res;
}

assert.equal(testSubsets([1, 2]).length, 4); // [], [1], [1,2], [2]
assert.equal(testSubsets([1, 2, 3]).length, 8); // 2^3 = 8

console.log("✅ Subsets assertions passed!");
```

---

## 8. Summary

- **Subsets**: Start loop at `i + 1`, add every path to results ($O(2^n)$).
- **Permutations**: Loop from `0` to $n - 1$ using a `used` boolean array ($O(n!)$).
- **Combination Sum**: Pass `i` to allow element reuse; prune when remaining sum $< 0$.
- **Duplicates**: Sort first, then skip `if (i > start && nums[i] === nums[i - 1])`.

---

## 9. Cheat Sheet

| Problem | Loop Start | State Advance | Base Case |
| :--- | :---: | :---: | :--- |
| **Subsets** | `startIndex` | `go(i + 1)` | Record at every step |
| **Permutations** | `0` (with `used[i]`) | `go()` | `path.length === nums.length` |
| **Comb Sum** | `startIndex` | `go(i)` (reuse!) | `remaining === 0` |

---

## 10. Interview Q&A

### 45-Second Explanation
> *"The difference between Subsets, Combinations, and Permutations comes down to index management. For Subsets and Combinations where order does not matter, we pass a starting index `i + 1` to ensure we only look forward and avoid duplicate arrangements. For Permutations where order matters, we iterate from index 0 on every step while tracking used items with a boolean array. In all cases, we follow the Choose, Explore, and Unchoose pattern."*

---

## 11. Practice Problems

### 1. Subsets - Medium
Given an integer array `nums` of unique elements, return all possible subsets (the power set). The solution set must not contain duplicate subsets. Return the solution in any order.
- **Input:** `nums = [1,2,3]`
- **Expected Output:** `[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]`
- **Input:** `nums = [0]`
- **Expected Output:** `[[],[0]]`

### 2. Permutations - Medium
Given an array `nums` of distinct integers, return all the possible permutations. You can return the answer in any order.
- **Input:** `nums = [1,2,3]`
- **Expected Output:** `[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]`
- **Input:** `nums = [0,1]`
- **Expected Output:** `[[0,1],[1,0]]`

### 3. Combination Sum - Medium
Given an array of distinct integers `candidates` and a target integer `target`, return a list of all unique combinations of `candidates` where the chosen numbers sum to `target`. You may return the combinations in any order. The same number may be chosen from `candidates` an unlimited number of times.
- **Input:** `candidates = [2,3,6,7], target = 7`
- **Expected Output:** `[[2,2,3],[7]]`
- **Input:** `candidates = [2,3,5], target = 8`
- **Expected Output:** `[[2,2,2,2],[2,3,3],[3,5]]`
- **Input:** `candidates = [2], target = 1`
- **Expected Output:** `[]`

---

<nav aria-label="Lecture navigation">

[Previous: Recursion Trees & Backtracking](day-20-recursion-trees-and-backtracking-core.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Grid Backtracking & Mazes](day-22-grid-backtracking-and-n-queens.md)

</nav>
