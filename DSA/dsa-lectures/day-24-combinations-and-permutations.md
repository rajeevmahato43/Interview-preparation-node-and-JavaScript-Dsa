# Day 24: Combinations and Permutations

<nav aria-label="Lecture navigation">

[Previous: Subsets and Power Sets](day-23-subsets-and-power-sets.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Grid Backtracking: Word Search, Maze Paths, and N-Queens](day-25-grid-backtracking-and-n-queens.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Contrast the structural differences between **Combinations** (order does not matter $\to$ forward index progression) and **Permutations** (order matters $\to$ visited tracking).
- Implement **Combination Sum I** (reusing elements) and **Combination Sum II** (single-use with duplicates).
- Solve **Permutations I** using a `used` boolean array or in-place swapping.
- Solve **Permutations II** by sorting and pruning identical sibling choices.
- Apply pruning techniques to reduce exponential decision trees by orders of magnitude.

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md)
- [Day 22: Backtracking Core: Decision State, Choices, and Undo](day-22-backtracking-fundamentals.md)
- [Day 23: Subsets and Power Sets](day-23-subsets-and-power-sets.md)

---

## Core Concepts

### 1. Combinations vs Permutations

| Concept | Does Order Matter? | Number of Ways | Pointer Mechanics | Example with `[1, 2]` |
| :--- | :--- | :--- | :--- | :--- |
| **Combination** | **No** (`[1, 2] === [2, 1]`) | $\binom{n}{k} = \frac{n!}{k!(n-k)!}$ | Advance index `startIndex = i + 1` | `[[1, 2]]` |
| **Permutation** | **Yes** (`[1, 2] !== [2, 1]`) | $n!$ | Loop from 0 with a `used` tracker | `[[1, 2], [2, 1]]` |

```text
Decision Tree for Permutations of [ 1, 2, 3 ]:
                      Root: [ ]
            /            |           \
         Pick 1        Pick 2       Pick 3
          /              |             \
      [ 1 ]            [ 2 ]          [ 3 ]
      /   \            /   \          /   \
   Pick 2 Pick 3    Pick 1 Pick 3  Pick 1 Pick 2
    /       \        /       \      /       \
 [1,2,3] [1,3,2]  [2,1,3] [2,3,1] [3,1,2] [3,2,1]
Total = 3! = 6 Permutations
```

---

### 2. Combination Sum I vs II

#### Combination Sum I (LeetCode 39)
- Candidates can be chosen **unlimited times**.
- In the recursive call, pass `i` (NOT `i + 1`) to allow the same element to be chosen again:
  `backtrack(i, remainingTarget - candidates[i])`.

#### Combination Sum II (LeetCode 40)
- Candidates can only be used **once**.
- Input array can contain **duplicates**.
- Sort first: `candidates.sort((a, b) => a - b)`.
- Skip duplicates horizontally: `if (i > startIndex && candidates[i] === candidates[i - 1]) continue;`.
- Pass `i + 1` to advance to the next element.

---

## Detailed Explanations & Node.js Relevance

### Effective Pruning with Pre-Sorting

In sum-matching problems (Combination Sum), if the array is unsorted, you must explore down every branch until the sum exceeds the target.
By **sorting the array first in ascending order**:
```js
if (candidates[i] > remainingTarget) {
  break; // STOP! All subsequent candidates are even larger!
}
```
Using `break` instead of `continue` prunes not just the current element, but **all remaining elements in the loop**, eliminating entire branches of the decision tree!

---

## JavaScript Implementation & Tracing

### 1. Combination Sum I (Reusing Elements) (LeetCode 39)

```js
function combinationSum(candidates, target) {
  candidates.sort((a, b) => a - b); // Sort to enable break pruning
  const result = [];
  const currentPath = [];

  function backtrack(startIndex, remaining) {
    if (remaining === 0) {
      result.push([...currentPath]);
      return;
    }

    for (let i = startIndex; i < candidates.length; i++) {
      // Early pruning: since array is sorted, all future numbers exceed remaining
      if (candidates[i] > remaining) {
        break;
      }

      currentPath.push(candidates[i]);
      // Pass 'i' (not i + 1) because we can reuse the same element
      backtrack(i, remaining - candidates[i]);
      currentPath.pop();
    }
  }

  backtrack(0, target);
  return result;
}
```

### 2. Permutations I (Unique Elements) (LeetCode 46)

```js
function permute(nums) {
  const result = [];
  const currentPath = [];
  const used = new Array(nums.length).fill(false);

  function backtrack() {
    if (currentPath.length === nums.length) {
      result.push([...currentPath]);
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue; // Skip already chosen elements

      // 1. CHOOSE
      used[i] = true;
      currentPath.push(nums[i]);

      // 2. EXPLORE
      backtrack();

      // 3. UNCHOOSE (UNDO)
      currentPath.pop();
      used[i] = false;
    }
  }

  backtrack();
  return result;
}
```

### 3. Permutations II (With Duplicates) (LeetCode 47)

```js
function permuteUnique(nums) {
  nums.sort((a, b) => a - b);
  const result = [];
  const currentPath = [];
  const used = new Array(nums.length).fill(false);

  function backtrack() {
    if (currentPath.length === nums.length) {
      result.push([...currentPath]);
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;

      // Duplicate pruning: if identical to previous element AND previous was not used
      if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) {
        continue;
      }

      used[i] = true;
      currentPath.push(nums[i]);
      backtrack();
      currentPath.pop();
      used[i] = false;
    }
  }

  backtrack();
  return result;
}
```

### Trace: `combinationSum([2, 3], 5)`

| Level | `start` | `i` | Candidate | `remaining` | Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 0 | 0 | 0 | 2 | $5 - 2 = 3$ | Push 2 $\to$ Recurse(0, 3) |
| 1 | 0 | 0 | 2 | $3 - 2 = 1$ | Push 2 $\to$ Recurse(0, 1) |
| 2 | 0 | 0 | 2 | $2 > 1$ | `break` (Prune!) |
| 1 | 0 | — | — | — | Pop 2 $\to$ `currentPath: [2]` |
| 1 | 0 | 1 | 3 | $3 - 3 = 0$ | Push 3 $\to$ **Valid Solution `[2, 3]`!** |
| 0 | 0 | — | — | — | Pop 3, Pop 2 $\to$ `currentPath: []` |
| 0 | 0 | 1 | 3 | $5 - 3 = 2$ | Push 3 $\to$ Recurse(1, 2) |
| 1 | 1 | 1 | 3 | $3 > 2$ | `break` (Prune!) |

Final Result: `[[2, 3]]`.
- **Time Complexity**: $O(2^t)$ where $t = \text{target} / \min(\text{candidates})$.
- **Auxiliary Space**: $O(\text{target} / \min(\text{candidates}))$ for recursion depth.

---

## Common Mistakes & Interview Traps

1. **Passing `i + 1` in Combination Sum I**:
   If an element can be reused, you must pass `i` to the recursive call, not `i + 1`.
2. **Missing `!used[i - 1]` in Permutations II**:
   `if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) continue;`
   If `used[i - 1]` is *true*, we are exploring a valid subtree that legitimately contains both duplicates (e.g. first 2 and second 2). We only skip when `used[i - 1]` is *false*, meaning the previous duplicate was already explored and unchosen at the same level!
3. **Using `continue` instead of `break` after sorting**:
   In Combination Sum with sorted candidates, `break` immediately kills the remaining iterations because all subsequent numbers are guaranteed to be larger.

---

## Tricky Points & Edge Cases

- **Target Cannot Be Formed**:
  `candidates = [2], target = 3` terminates cleanly and returns `[]`.
- **Arrays of Size 1**:
  `permute([1])` correctly returns `[[1]]`.

---

## Practical Exercise

Implement **Combinations** (LeetCode 77):
Given two integers $n$ and $k$, return all possible combinations of $k$ numbers chosen from the range $[1, n]$.
- **Pruning Optimization**:
  At any step, if the remaining numbers available in $[i, n]$ are fewer than the numbers needed to reach length $k$, stop the loop early:
  `for (let i = start; i <= n - (k - path.length) + 1; i++)`.

---

## Summary

- Combinations avoid duplicate arrangements by using an advancing index pointer (`startIndex`).
- Permutations allow choices from any index, tracking used elements with a `used` boolean array.
- Sorting elements enables powerful `break` pruning in sum-matching problems.
- Permutations II avoids duplicates by skipping when `nums[i] === nums[i - 1] && !used[i - 1]`.

---

## Cheat Sheet

### Combinations vs Permutations Decision Matrix
```js
// Combinations (Order doesn't matter)
function dfs(start) {
  for (let i = start; i < n; i++) {
    path.push(nums[i]);
    dfs(i + 1); // or i if reusable
    path.pop();
  }
}

// Permutations (Order matters)
function dfs() {
  for (let i = 0; i < n; i++) {
    if (used[i]) continue;
    used[i] = true;
    path.push(nums[i]);
    dfs();
    path.pop();
    used[i] = false;
  }
}
```

---

## Interview Questions

### 1. Deep Definitions and Mental Models
**Question:** Explain why Combination problems use a `startIndex` parameter while Permutation problems use a `used` array.
- **Expected answer shape:** In Combinations, order does not matter: `[1, 2]` is identical to `[2, 1]`. To prevent generating `[2, 1]`, the algorithm only moves forward using `startIndex`, ensuring elements appear in non-decreasing index order. In Permutations, order matters: `[1, 2]` and `[2, 1]` are distinct valid solutions. Elements can be picked from any index, so a `used` array is required to ensure no element is used twice in the same permutation.

### 2. Predict the Output and Trace Execution
**Question:** How many solutions are generated by `permuteUnique([1, 1, 2])`?
- **Expected answer shape:** Formula for permutations of multiset: $\frac{n!}{n_1! n_2!} = \frac{3!}{2! 1!} = \frac{6}{2} = 3$ unique permutations: `[1, 1, 2]`, `[1, 2, 1]`, and `[2, 1, 1]`.

### 3. Implementation Exercise
**Question:** Write `combinationSum2(candidates, target)` in $O(2^n)$ time without duplicate combinations.
- **Expected answer shape:**
```js
function combinationSum2(candidates, target) {
  candidates.sort((a, b) => a - b);
  const result = [];
  const path = [];
  function backtrack(start, remain) {
    if (remain === 0) { result.push([...path]); return; }
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] > remain) break;
      if (i > start && candidates[i] === candidates[i - 1]) continue;
      path.push(candidates[i]);
      backtrack(i + 1, remain - candidates[i]);
      path.pop();
    }
  }
  backtrack(0, target);
  return result;
}
```

### 4. Debugging and Failure Analysis
**Question:** In Permutations II, a developer writes `if (i > 0 && nums[i] === nums[i - 1] && used[i - 1]) continue;`. Why does this fail?
- **Expected answer shape:** Checking `used[i - 1]` instead of `!used[i - 1]` inverts the condition: it skips when the previous duplicate is currently in the active path, preventing legitimate repeated values from being included in the same permutation (e.g. `[1, 1, 2]` can never form both 1s). The check must be `!used[i - 1]`, ensuring that duplicate elements are only chosen in a fixed left-to-right relative order.

### 5. Design and Tradeoff Questions
**Question:** How can you generate permutations in $O(1)$ auxiliary space without a `used` array?
- **Expected answer shape:** By swapping elements in-place: at index `i`, loop `j` from `i` to $n - 1$, swap `[nums[i], nums[j]]`, recurse on `i + 1`, and swap back `[nums[i], nums[j]]`. When `i === nums.length`, push a snapshot. This eliminates the $O(n)$ `used` array entirely.

### 6. Senior Follow-ups: Node.js Job Scheduling Permutations
**Question:** A service must test all execution permutations of 10 microservices to verify deadlocks. $10! = 3,628,800$. How do you execute this without crashing Node.js?
- **Expected answer shape:** Generating all 3.6 million permutations in memory will allocate gigabytes of heap memory. Solution: (1) Use an **Iterator / Generator** (`function* permute()`) that yields one permutation at a time, keeping memory strictly bounded to $O(N)$ stack space. (2) Stream the generated permutations to worker processes via Node.js streams or worker thread channels to test permutations in parallel.

<nav aria-label="Lecture navigation">

[Previous: Subsets and Power Sets](day-23-subsets-and-power-sets.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Grid Backtracking: Word Search, Maze Paths, and N-Queens](day-25-grid-backtracking-and-n-queens.md)

</nav>
