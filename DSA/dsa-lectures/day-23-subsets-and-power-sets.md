# Day 23: Subsets and Power Sets

<nav aria-label="Lecture navigation">

[Previous: Backtracking Core: Decision State, Choices, and Undo](day-22-backtracking-fundamentals.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Combinations and Permutations](day-24-combinations-and-permutations.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain the mathematical relationship between an $n$-element set and its $2^n$ power set.
- Implement **Subsets I** (unique elements) using both the Include/Exclude and the Loop-Based backtracking models.
- Solve **Subsets II** (containing duplicate numbers) by sorting and applying horizontal duplicate pruning.
- Compare backtracking with **Bit Manipulation** ($1 \ll n$) for generating subsets.
- Model permission combinations and feature flag subsets in Node.js backend systems.

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md)
- [Day 05: Sorting and Searching Basics](day-05-sorting-and-searching-basics.md)
- [Day 22: Backtracking Core: Decision State, Choices, and Undo](day-22-backtracking-fundamentals.md)

---

## Core Concepts

### 1. The Power Set Mathematical Model

A set with $n$ elements has exactly **$2^n$ subsets** (including the empty set and the set itself).
Why? Because for every element, we have a binary choice: **Include it OR Exclude it**.

```text
Set: [ 1, 2, 3 ] -> 2^3 = 8 subsets

Decision Tree:
                        [ ]
                    /         \
               Include 1     Exclude 1
                 /                 \
              [ 1 ]                [ ]
             /     \              /    \
          Inc 2   Exc 2        Inc 2  Exc 2
          /           \        /          \
       [ 1, 2 ]      [ 1 ]   [ 2 ]        [ ]
```

---

### 2. Subsets II: Handling Duplicates

If the input array contains duplicate numbers (e.g. `[1, 2, 2]`), naive subset generation produces duplicate subsets:
```text
Branch 1 uses first '2':  [ 1, 2 ]
Branch 2 uses second '2': [ 1, 2 ]  <-- DUPLICATE!
```

**The Duplicate Pruning Rule**:
1. **Sort the array first**: Identical values are grouped adjacent to each other: `nums.sort((a, b) => a - b)`.
2. Inside the choice loop, if `nums[i] === nums[i - 1]` and `i > startIndex`, **skip this choice** (`continue`).

```text
Decision Level with candidates: [ 2 (first), 2 (second) ]
When i = startIndex: Choose first '2' -> valid exploration
When i > startIndex and nums[i] === nums[i - 1]:
  We ALREADY explored all subsets starting with '2' in this level!
  Skip second '2' to prevent duplicate branches!
```

---

## Detailed Explanations & Node.js Relevance

### Bitmask Approach vs Backtracking

Every subset corresponds to an integer from $0$ to $2^n - 1$ represented in binary:
```text
nums = [ A, B, C ]
Mask 0 (000 in binary): [ ]
Mask 1 (001 in binary): [ C ]
Mask 2 (010 in binary): [ B ]
Mask 3 (011 in binary): [ B, C ]
Mask 7 (111 in binary): [ A, B, C ]
```

```js
// Bit Manipulation Solution (for n <= 30):
function subsetsBitmask(nums) {
  const n = nums.length;
  const total = 1 << n; // 2^n
  const result = [];
  for (let mask = 0; mask < total; mask++) {
    const subset = [];
    for (let i = 0; i < n; i++) {
      if ((mask & (1 << i)) !== 0) subset.push(nums[i]);
    }
    result.push(subset);
  }
  return result;
}
```

### Node.js Relevance: Role-Based Access Control (RBAC)
In Node.js authorization systems, a user's permissions are often stored as an array of permission strings or a bitwise mask (e.g. `READ = 1, WRITE = 2, DELETE = 4`). Testing whether a user's permission set includes required capabilities mirrors the subset evaluation pattern.

---

## JavaScript Implementation & Tracing

### 1. Subsets I (LeetCode 78)

```js
function subsets(nums) {
  const result = [];
  const currentPath = [];

  function backtrack(startIndex) {
    // Every state in the tree is a valid subset!
    result.push([...currentPath]);

    for (let i = startIndex; i < nums.length; i++) {
      currentPath.push(nums[i]);     // Choose
      backtrack(i + 1);             // Explore (can only use subsequent elements)
      currentPath.pop();             // Unchoose (Undo)
    }
  }

  backtrack(0);
  return result;
}
```

### 2. Subsets II (With Duplicates) (LeetCode 90)

```js
function subsetsWithDup(nums) {
  nums.sort((a, b) => a - b); // 1. Sort to cluster duplicates
  const result = [];
  const currentPath = [];

  function backtrack(startIndex) {
    result.push([...currentPath]);

    for (let i = startIndex; i < nums.length; i++) {
      // 2. Skip duplicate elements on the same tree level
      if (i > startIndex && nums[i] === nums[i - 1]) {
        continue;
      }

      currentPath.push(nums[i]);
      backtrack(i + 1);
      currentPath.pop();
    }
  }

  backtrack(0);
  return result;
}
```

### Step-by-Step Trace: `subsetsWithDup([1, 2, 2])`

| Level | `startIndex` | `i` | Element | Action | `result` State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 0 | 0 | — | — | Snapshot `[]` | `[ [] ]` |
| 0 | 0 | 0 | 1 | Push 1 $\to$ Recurse | `[ [], [1] ]` |
| 1 | 1 | 1 | 2 (first) | Push 2 $\to$ Recurse | `[ ..., [1, 2] ]` |
| 2 | 2 | 2 | 2 (second)| Push 2 $\to$ Recurse | `[ ..., [1, 2, 2] ]` |
| 2 | — | — | — | Unwind to Level 1 | `currentPath: [1]` |
| 1 | 1 | 2 | 2 (second)| `i > start` & `nums[2] === nums[1]` | **SKIPPED (Duplicate!)** |
| 0 | 0 | 1 | 2 (first) | Push 2 $\to$ Recurse | `[ ..., [2] ]` |
| 1 | 2 | 2 | 2 (second)| Push 2 $\to$ Recurse | `[ ..., [2, 2] ]` |
| 0 | 0 | 2 | 2 (second)| `i > start` & `nums[2] === nums[1]` | **SKIPPED (Duplicate!)** |

Final `result`: `[ [], [1], [1, 2], [1, 2, 2], [2], [2, 2] ]` (Exact 6 unique subsets).
- **Time Complexity**: $O(n \cdot 2^n)$ because there are $2^n$ subsets and cloning each subset takes up to $O(n)$ time.
- **Auxiliary Space**: $O(n)$ for recursion stack depth and `currentPath`.

---

## Common Mistakes & Interview Traps

1. **Forgetting `nums.sort()` in Subsets II**:
   Duplicate pruning logic `if (nums[i] === nums[i - 1])` relies completely on identical elements being adjacent. Without sorting, `[2, 1, 2]` will fail to prune duplicates.
2. **Writing `i > 0` instead of `i > startIndex`**:
   ```js
   // WRONG: if (i > 0 && nums[i] === nums[i - 1]) continue;
   ```
   This would prevent picking duplicate elements *vertically* in the same subset (e.g. `[2, 2]` would be blocked). We only want to prevent duplicate choices *horizontally* across the same decision level, which is why `i > startIndex` is required.
3. **Placing `result.push()` only at the end**:
   Unlike Permutations where only full-length paths are recorded, in Subsets, **every intermediate node in the recursion tree is a valid subset**. The snapshot occurs at the very start of each call.

---

## Tricky Points & Edge Cases

- **Empty Input Array**: `nums = []` correctly produces `[[]]`.
- **Arrays with All Identical Elements**: `nums = [2, 2, 2]` produces 4 subsets: `[], [2], [2, 2], [2, 2, 2]`.

---

## Practical Exercise

Implement **Letter Case Permutation** (LeetCode 784):
Given a string `s`, transform every letter individually to lowercase or uppercase to create another string. Return a list of all possible strings you could create.
- **Hint**: At each index, if the character is a digit, advance. If it is a letter, branch into lowercase and uppercase.
- **Acceptance Criterion**: Must run in $O(n \cdot 2^k)$ where $k$ is the number of letters.

---

## Summary

- The Power Set of an $n$-element set contains exactly $2^n$ subsets.
- In the loop-based backtracking template, every node in the recursion tree represents a valid subset.
- Subsets II handles duplicate numbers by sorting first and pruning duplicate choices with `if (i > startIndex && nums[i] === nums[i - 1]) continue`.
- Bitmasking generates subsets using integer bit flags from $0$ to $2^n - 1$.

---

## Cheat Sheet

### Subsets Invariant Rule
```js
// Subsets I
function dfs(start) {
  result.push([...path]);
  for (let i = start; i < nums.length; i++) {
    path.push(nums[i]);
    dfs(i + 1);
    path.pop();
  }
}

// Subsets II (Duplicates)
nums.sort((a, b) => a - b);
function dfs(start) {
  result.push([...path]);
  for (let i = start; i < nums.length; i++) {
    if (i > start && nums[i] === nums[i - 1]) continue; // Horizontal skip
    path.push(nums[i]);
    dfs(i + 1);
    path.pop();
  }
}
```

---

## Interview Questions

### 1. Deep Definitions and Mental Models
**Question:** Explain the difference between horizontal duplicate pruning (`i > startIndex`) and vertical duplicate prevention in Subsets II.
- **Expected answer shape:** Vertical descent represents choosing multiple identical numbers within the *same* subset (e.g. `[2, 2]`). This is allowed because each `2` is at a deeper recursion depth (`i + 1`). Horizontal branching represents trying different numbers at the *same* position in the subset. If `i > startIndex` and `nums[i] === nums[i - 1]`, we have already explored all subsets that start with this value at this level; skipping it prevents identical duplicate subsets.

### 2. Predict the Output and Trace Execution
**Question:** How many subsets does `subsetsWithDup([1, 1, 1])` generate?
- **Expected answer shape:** Exactly 4 subsets: `[]`, `[1]`, `[1, 1]`, and `[1, 1, 1]`.

### 3. Implementation Exercise
**Question:** Write `subsetsBitmask(nums)` for unique elements using bitwise operations.
- **Expected answer shape:**
```js
function subsetsBitmask(nums) {
  const n = nums.length;
  const result = [];
  const total = 1 << n;
  for (let mask = 0; mask < total; mask++) {
    const sub = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) sub.push(nums[i]);
    }
    result.push(sub);
  }
  return result;
}
```

### 4. Debugging and Failure Analysis
**Question:** A candidate uses `1 << nums.length` to calculate subsets. When `nums.length = 32`, JavaScript produces `1` instead of $2^{32}$. Why?
- **Expected answer shape:** In JavaScript, bitwise operators (`<<`, `|`, `&`) operate on 32-bit signed integers. When shifting by 32 (`1 << 32`), the shift count is masked by 31 (`32 & 31 = 0`), so `1 << 32` evaluates to `1 << 0 = 1`. For $n \ge 31$, use `Math.pow(2, n)` or `BigInt(1) << BigInt(n)`.

### 5. Design and Tradeoff Questions
**Question:** When is bitmasking preferred over recursive backtracking for generating subsets?
- **Expected answer shape:** Bitmasking is non-recursive, has zero call stack overhead, and generates subsets in strict iterative order. It is preferred when $n$ is small ($n \le 20$) and bitwise CPU instructions can be leveraged for fast membership tests. When $n$ is larger or duplicate pruning is needed (Subsets II), backtracking is far superior because it can prune dead branches without generating all $2^n$ masks.

### 6. Senior Follow-ups: Node.js API Payload Explosion
**Question:** An API allows users to request all combinations of product filter attributes. An attacker sends a filter list of 30 attributes. What happens to the Node.js server?
- **Expected answer shape:** $2^{30} \approx 1.07 \text{ billion}$ subsets. Attempting to allocate an array of 1 billion arrays will exhaust V8 heap memory within seconds, triggering an unrecoverable Out-Of-Memory process crash. Protect by strictly validating and capping input attribute size ($N \le 12 \to 4096$ subsets max) at the Express middleware layer.

<nav aria-label="Lecture navigation">

[Previous: Backtracking Core: Decision State, Choices, and Undo](day-22-backtracking-fundamentals.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Combinations and Permutations](day-24-combinations-and-permutations.md)

</nav>
