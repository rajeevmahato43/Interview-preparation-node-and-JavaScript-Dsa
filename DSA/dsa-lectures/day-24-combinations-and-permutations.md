# Day 24: Combinations and Permutations

<nav aria-label="Lecture navigation">

[Previous: Subsets and Power Sets](day-23-subsets-and-power-sets.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Grid Backtracking: Word Search, Maze Paths, and N-Queens](day-25-grid-backtracking-and-n-queens.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Contrast the structural mechanics of **Combinations** (order does not matter $\to$ forward index progression) and **Permutations** (order matters $\to$ visited tracking).
- Implement **Combination Sum I** (unlimited element reuse) and **Combination Sum II** (single-use with duplicates).
- Apply **Ascending Sort Pruning** (`break` instead of `continue`) to terminate sum-matching loops early.
- Solve **Permutations I** using boolean tracking arrays and evaluate in-place swapping alternatives.
- Solve **Permutations II** by enforcing the `!used[i - 1]` invariant to eliminate duplicate sibling branches.
- Prevent memory exhaustion in Node.js backend task schedulers using ES6 Generators to stream factorial permutations.

---

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Factorial ($O(n!)$) and combinatorial ($O(2^n)$) growth rates.
- [Day 05: Sorting and Searching Basics](day-05-sorting-and-searching-basics.md) — Numeric array sorting.
- [Day 22: Backtracking Core: Decision State, Choices, and Undo](day-22-backtracking-fundamentals.md) — Choose, explore, and unchoose mechanics.
- [Day 23: Subsets and Power Sets](day-23-subsets-and-power-sets.md) — Horizontal duplicate skipping.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
| :--- | :--- | :--- |
| **Combination** | An unordered selection of $k$ elements chosen from a set of $n$ elements without regard to arrangement ($\binom{n}{k}$). | Modeled using advancing index pointers (`startIndex`) to prevent duplicate arrangements. |
| **Permutation** | An ordered arrangement of $n$ elements where distinct orderings constitute unique solutions ($n!$). | Modeled by looping across all indices ($0 \dots n - 1$) with a `used` boolean tracker. |
| **Element Reuse Invariant** | Passing current index $i$ into recursive calls rather than $i + 1$, allowing unbounded selection of the same element. | Solves unbounded coin-change and target-sum problems (Combination Sum I). |
| **Ascending Break Pruning** | Terminating loop execution (`break`) when candidates are pre-sorted and candidate value exceeds the remaining target. | Prunes entire subtrees of larger elements rather than testing them individually. |
| **Multiset Duplicate Pruning** | Skipping identical values if their immediate predecessor was not chosen in the active branch (`!used[i - 1]`). | Ensures identical duplicate values are chosen in strict left-to-right relative order, eliminating duplicate permutations. |

---

## Core Concepts

### 1. Combinations vs Permutations: Structural Divergence

The distinction between Combinations and Permutations lies in whether **relative order creates distinct outcomes**.

- **Combinations**: Order is irrelevant ($[1, 2] \equiv [2, 1]$). Because order does not matter, candidates can be restricted to an advancing index (`startIndex`). An element at index $i$ can only pair with elements at indices $\ge i$.
- **Permutations**: Order is essential ($[1, 2] \neq [2, 1]$). Because any element can appear in any position, the search loop must evaluate all indices from $0$ to $n - 1$ at every frame, using a `used` tracking array to avoid picking an element twice in the same path.

```text
Combinations of [ 1, 2, 3 ] of size 2:
                  [ ]
          /        |        \
       Pick 1    Pick 2    Pick 3 (No elements left >= 3)
        /          |
     [ 1 ]       [ 2 ]
     /   \         |
  Pick 2 Pick 3  Pick 3
   /       \       |
 [1,2]   [1,3]   [2,3]
Total = 3 Combinations (No [2, 1], [3, 1], [3, 2] explored)

Permutations of [ 1, 2, 3 ] of size 3:
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

#### Structural Comparison

| Dimension | Combinations | Permutations |
| :--- | :--- | :--- |
| **Is Order Significant?** | **No** (`[1, 2] === [2, 1]`) | **Yes** (`[1, 2] !== [2, 1]`) |
| **Number of Results** | $\binom{n}{k} = \frac{n!}{k!(n-k)!}$ | $P(n, k) = \frac{n!}{(n-k)!}$ |
| **Loop Starting Index** | Starts at `startIndex` (advancing) | Starts at `0` on every frame |
| **Duplicate Prevention** | Prevented by index progression | Tracked by `used[i]` boolean array |

---

### 2. Combination Sum: Reusable Elements vs Duplicates

#### Combination Sum I (LeetCode 39): Reusing Elements
- **Rules**: Candidates can be chosen **unlimited times** to sum to `target`. All candidate values are positive and distinct.
- **Pointer Invariant**: When choosing candidate at index $i$, pass **$i$** (not $i + 1$) to the recursive call. This permits the same element to be chosen again at the next level:
  `backtrack(i, remaining - candidates[i])`.
- **Optimization**: Sort candidates ascending. If `candidates[i] > remaining`, execute **`break`** instead of `continue`. Since the array is sorted, every subsequent candidate in the loop is even larger and will also exceed `remaining`.

```text
Sorted Candidates: [ 2, 3, 6, 7 ], Target: 7
At Root (remain = 7):
- Choose 2 -> recurse with (index 0, remain 5)
  - Choose 2 -> recurse with (index 0, remain 3)
    - Choose 2 -> recurse with (index 0, remain 1)
      - Next is 2 > 1 -> BREAK! (Prunes 2, 3, 6, 7 in one check!)
    - Pop 2, Choose 3: remain 3 - 3 = 0 -> TARGET HIT: [2, 2, 3]!
```

#### Combination Sum II (LeetCode 40): Single Use with Duplicates
- **Rules**: Candidates can be used only **once**. The input array may contain duplicate values. The result must contain no duplicate combinations.
- **Pointer Invariant**: Pass **$i + 1$** to enforce single-use.
- **Duplicate Invariant**: Sort first. Skip horizontal duplicates with:
  `if (i > startIndex && candidates[i] === candidates[i - 1]) continue;`

```javascript
// Node.js code: Combination Sum I with Break Pruning

function combinationSum(candidates, target) {
  candidates.sort((a, b) => a - b); // Prerequisite for break pruning
  const result = [];
  const path = [];

  function backtrack(startIndex, remaining) {
    if (remaining === 0) {
      result.push([...path]);
      return;
    }

    for (let i = startIndex; i < candidates.length; i++) {
      // Early break: All subsequent numbers in sorted array exceed remaining
      if (candidates[i] > remaining) {
        break;
      }

      path.push(candidates[i]);
      // Pass 'i' because the same element can be selected repeatedly
      backtrack(i, remaining - candidates[i]);
      path.pop(); // Undo
    }
  }

  backtrack(0, target);
  return result;
}

console.log(combinationSum([2, 3, 6, 7], 7)); // [[2, 2, 3], [7]]
```

---

### 3. Permutations I: Visited Tracking via `used` Array

In **Permutations I** (distinct elements), every element must appear exactly once in each arrangement.

Because choices can be drawn from any position in the array, the search loop cannot use an advancing `startIndex`. Instead, an auxiliary boolean array `used` of size $n$ tracks elements already committed to the active path:

```javascript
// Node.js code: Permutations I (LeetCode 46)

function permute(nums) {
  const result = [];
  const path = [];
  const used = new Array(nums.length).fill(false);

  function backtrack() {
    // Base Case: Complete permutation constructed
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue; // Skip elements already in current permutation

      // 1. Choose
      used[i] = true;
      path.push(nums[i]);

      // 2. Explore
      backtrack();

      // 3. Unchoose (Rollback both array and boolean flag)
      path.pop();
      used[i] = false;
    }
  }

  backtrack();
  return result;
}

console.log(permute([1, 2, 3])); // Generates all 3! = 6 permutations
```

---

### 4. Permutations II: The `!used[i - 1]` Duplicate Pruning Invariant

When the input array contains duplicate values (e.g., `[1, 1, 2]`), naive permutation generation produces duplicate arrangements.
The total number of unique permutations of a multiset is given by:
$$\text{Total} = \frac{n!}{n_1! \, n_2! \dots n_k!}$$
For `[1, 1, 2]`, $\frac{3!}{2! \, 1!} = \frac{6}{2} = 3$ unique permutations: `[1, 1, 2]`, `[1, 2, 1]`, and `[2, 1, 1]`.

#### The Duplicate Pruning Rule
1. **Sort the array**: `nums.sort((a, b) => a - b)`.
2. **Prune identical siblings**:
   ```javascript
   if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) {
     continue;
   }
   ```

#### Why `!used[i - 1]` and NOT `used[i - 1]`?

- If `used[i - 1]` is **true**: The previous duplicate is currently chosen in the active branch above us. We are currently descending deeper, so picking the current duplicate is valid (e.g., picking the second `1` while the first `1` is already in `path` to form `[1, 1, 2]`).
- If `used[i - 1]` is **false**: The previous duplicate was chosen, fully explored across all subtrees, and has already been unchosen (`pop()`). Choosing the current duplicate now would evaluate an identical sibling subtree! Skipping when `!used[i - 1]` forces identical duplicate elements to be chosen strictly in left-to-right order, guaranteeing unique permutations.

```javascript
// Node.js code: Permutations II (LeetCode 47)

function permuteUnique(nums) {
  nums.sort((a, b) => a - b);
  const result = [];
  const path = [];
  const used = new Array(nums.length).fill(false);

  function backtrack() {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;

      // Duplicate pruning invariant
      if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) {
        continue;
      }

      used[i] = true;
      path.push(nums[i]);

      backtrack();

      path.pop();
      used[i] = false;
    }
  }

  backtrack();
  return result;
}

console.log(permuteUnique([1, 1, 2]));
// Output: [ [1, 1, 2], [1, 2, 1], [2, 1, 1] ] (Exact 3 unique permutations)
```

---

## Detailed Node.js Relevance: Streaming Combinations via ES6 Generators

In high-concurrency Node.js microservices, computing permutations of even 11 items yields $11! \approx 39.9 \text{ million}$ arrays. Allocating 40 million arrays simultaneously in V8 requires multiple gigabytes of heap memory, triggering Garbage Collection freezes and fatal Out-Of-Memory crashes.

By transforming the backtracking function into an **ES6 Generator** (`function*`), we yield permutations lazily one-by-one. The memory footprint remains bounded strictly to $O(n)$ stack depth:

```javascript
// Node.js code: Streaming Permutations with Zero Heap Explosion

function* permuteGenerator(nums) {
  const path = [];
  const used = new Array(nums.length).fill(false);

  function* backtrack() {
    if (path.length === nums.length) {
      yield [...path]; // Yield one permutation at a time
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(nums[i]);

      yield* backtrack();

      path.pop();
      used[i] = false;
    }
  }

  yield* backtrack();
}

// Process permutations as a stream
const stream = permuteGenerator([1, 2, 3]);
for (const perm of stream) {
  // Evaluates without buffering the full factorial collection in memory!
  if (perm[0] === 2) break; // Can terminate early safely
}
```

---

## Tricky Points & Edge Cases

1. **`break` vs `continue` in Sorted Combinations**:
   When candidates are sorted ascending, using `break` halts the loop immediately, saving significant work. If the array is unsorted, `break` prematurely terminates evaluation of smaller subsequent numbers, causing false negatives. Sorting is mandatory before using `break`.
2. **Inverting the Duplicate Guard in Permutations II**:
   Writing `used[i - 1]` instead of `!used[i - 1]` breaks the code by preventing identical duplicates from ever appearing in the same permutation, making `[1, 1, 2]` impossible to form.
3. **Empty Targets in Combination Sum**:
   If `target === 0`, the algorithm should return `[[]]` if selecting zero items is permitted, or `[]` depending on domain specifications.

---

## Hands-On Exercise

### Scenario: Combinations with Dynamic Pruning (LeetCode 77)

In an automated load balancer, you need to select all possible clusters of $k$ worker nodes from $n$ available instances ($1 \dots n$). When remaining available instances are fewer than the nodes needed to reach size $k$, continuing loop iterations wastes CPU cycles. Implement `combine(n, k)` with dynamic bound pruning.

### Buggy Code

```javascript
// ❌ BUGGY: Fails to prune loop bounds, wasting thousands of iterations
function combineUnoptimized(n, k) {
  const result = [];
  const path = [];

  function dfs(start) {
    if (path.length === k) {
      result.push([...path]);
      return;
    }

    // BUG: Always loops up to n! Even when not enough numbers remain to reach size k.
    for (let i = start; i <= n; i++) {
      path.push(i);
      dfs(i + 1);
      path.pop();
    }
  }

  dfs(1);
  return result;
}
```

### Acceptance Criteria

1. Implement dynamic loop pruning: upper bound of the loop is $n - (k - \text{path.length}) + 1$.
2. Returns all valid combinations of size $k$ chosen from $1 \dots n$.
3. Verifies that no invalid or partial combinations are emitted.
4. Includes assertions testing edge cases where $k = 1$ and $k = n$.

### Solution Code

```javascript
// Node.js code: Optimized Combinations with Upper Bound Pruning
const assert = require("assert");

function combine(n, k) {
  const result = [];
  const path = [];

  function backtrack(startIndex) {
    // Base Case: Combination of size k reached
    if (path.length === k) {
      result.push([...path]);
      return;
    }

    // Pruning: Calculate how many numbers are still required
    const needed = k - path.length;
    // The maximum valid starting index is n - needed + 1
    const upperBound = n - needed + 1;

    for (let i = startIndex; i <= upperBound; i++) {
      path.push(i);
      backtrack(i + 1);
      path.pop(); // Undo
    }
  }

  backtrack(1);
  return result;
}

// Verification Tests
const res4Choose2 = combine(4, 2);
assert.strictEqual(res4Choose2.length, 6); // 4! / (2! * 2!) = 6
assert.deepStrictEqual(res4Choose2, [
  [1, 2], [1, 3], [1, 4],
  [2, 3], [2, 4],
  [3, 4]
]);

// Edge cases
const singlePick = combine(5, 1);
assert.strictEqual(singlePick.length, 5);

const fullPick = combine(3, 3);
assert.deepStrictEqual(fullPick, [[1, 2, 3]]);

console.log("✅ All Combinations with dynamic pruning tests passed successfully.");
```

### Solution Explanation

1. **Dynamic Loop Bound**: If $k = 4$, $n = 5$, and `path.length = 1`, we still need $3$ numbers. If the loop reaches $i = 4$, only $[4, 5]$ remain ($2$ numbers), which cannot possibly form a combination of size $4$. Setting `upperBound = n - needed + 1` terminates the loop before futile branches are created.
2. **Space Efficiency**: Memory overhead is strictly $O(k)$ call stack depth and path length.

---

## Summary

- **Combinations vs Permutations**: Combinations use advancing `startIndex` to prevent order-dependent duplicate arrangements; Permutations use `0 \dots n - 1` with a `used` tracking array.
- **Combination Sum I**: Pass current index $i$ (not $i + 1$) to allow element reuse, and sort candidates to enable early `break` pruning.
- **Combination Sum II**: Pass $i + 1$ and enforce horizontal skipping with `i > startIndex && nums[i] === nums[i - 1]`.
- **Permutations II**: Prune duplicate arrangements by enforcing `if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) continue`.
- **Streaming Combinations**: Use ES6 generator functions (`function*`) to stream large factorial permutations without blowing up V8 heap memory.

---

## Cheat Sheet & Common Pitfalls

### Combinations vs Permutations Skeleton
```javascript
// Combinations (Advancing Index)
function dfsComb(start) {
  for (let i = start; i <= upperBound; i++) {
    path.push(nums[i]);
    dfsComb(i + 1); // Pass i if element can be reused
    path.pop();
  }
}

// Permutations (Visited Tracking)
function dfsPerm() {
  for (let i = 0; i < n; i++) {
    if (used[i]) continue;
    used[i] = true;
    path.push(nums[i]);
    dfsPerm();
    path.pop();
    used[i] = false;
  }
}
```

### Common Pitfalls

| Mistake | Consequence | Correct Pattern |
| :--- | :--- | :--- |
| **`used[i - 1]` in Permutations II** | Blocks legitimate duplicates in the same path (`[1, 1]`). | Use `!used[i - 1]` to check horizontal completion. |
| **`continue` instead of `break`** | Evaluates hopeless larger elements in sorted sum matching. | Use `break` when `candidates[i] > remaining`. |
| **Missing `i` in Combination Sum I** | Prevents reusable candidates from repeating. | Pass `i` into recursive call instead of `i + 1`. |
| **Buffering $10!$ results in memory** | Out-of-memory crash in Node.js backend services. | Use ES6 Generators to stream permutations. |

---

## Interview Questions

### 1. Why do Combination problems use an advancing `startIndex` while Permutation problems use a `used` tracking array?

**Question:** Explain the algorithmic requirement behind passing an advancing `startIndex` in Combination problems versus maintaining a `used` boolean array in Permutation problems.

**Answer:** 
The distinction reflects whether order creates unique outcomes:
1. **Combinations (Order Does Not Matter)**:
   In combinations, `[1, 2]` and `[2, 1]` represent the exact same mathematical subset. To guarantee that each combination is generated exactly once, we enforce a strict index ordering invariant: elements in any valid combination must appear in non-decreasing order of their original array indices. By passing `startIndex = i + 1` into the recursive call, the loop only looks forward, preventing the algorithm from ever looking backward to generate inverted arrangements like `[2, 1]`.
2. **Permutations (Order Does Matter)**:
   In permutations, `[1, 2]` and `[2, 1]` are distinct valid solutions. Elements can be selected from any position in the array at any point in the sequence. Because every index from $0$ to $n - 1$ must be eligible for selection at every depth, an advancing index cannot be used. Instead, a `used` boolean array tracks which indices are already occupied in the active path, ensuring that no element is picked more than once in the same permutation.

---

### 2. How many unique permutations are generated by `permuteUnique([1, 1, 2])`, and why?

**Question:** Calculate the theoretical and practical number of permutations generated for `[1, 1, 2]`, and explain how the pruning condition achieves this count.

**Answer:** 
The theoretical count is given by the multiset permutation formula:
$$\frac{n!}{n_1! \, n_2!} = \frac{3!}{2! \, 1!} = \frac{6}{2} = 3 \text{ unique permutations}$$
The 3 unique permutations are: `[1, 1, 2]`, `[1, 2, 1]`, and `[2, 1, 1]`.

**How the Pruning Condition Operates:**
1. Sort the input: `[1, 1, 2]`.
2. Apply the guard: `if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) continue;`.
3. When constructing permutations starting with `1`:
   - Choosing the first `1` (`used[0] = true`) allows choosing the second `1` (`used[1] = true`), generating `[1, 1, 2]`.
   - After the first `1` unwinds, the loop reaches the second `1` at index 1.
   - At this sibling point, `nums[1] === nums[0]` and `used[0] === false` (the first `1` is no longer active).
   - The condition evaluates to `true`, immediately skipping the second `1`.
4. This ensures that duplicate elements are only ever selected in their strict left-to-right relative sequence, eliminating all redundant duplicate permutations.

---

### 3. How do you implement Combination Sum II without duplicate sets?

**Question:** Implement `combinationSum2(candidates, target)` ensuring that every number is used at most once and the output contains no duplicate combinations.

**Answer:** 

```javascript
// Node.js code
function combinationSum2(candidates, target) {
  candidates.sort((a, b) => a - b); // Step 1: Sort ascending
  const result = [];
  const path = [];

  function backtrack(startIndex, remaining) {
    if (remaining === 0) {
      result.push([...path]);
      return;
    }

    for (let i = startIndex; i < candidates.length; i++) {
      // Step 2: Break pruning on sorted array
      if (candidates[i] > remaining) {
        break;
      }

      // Step 3: Horizontal duplicate pruning
      if (i > startIndex && candidates[i] === candidates[i - 1]) {
        continue;
      }

      path.push(candidates[i]);
      // Step 4: Advance to i + 1 to enforce single-use
      backtrack(i + 1, remaining - candidates[i]);
      path.pop(); // Undo
    }
  }

  backtrack(0, target);
  return result;
}
```

---

### 4. How can you test all execution permutations of 10 microservices without crashing Node.js?

**Question:** An integration testing engine must evaluate all execution permutations of 10 microservices ($10! = 3,628,800$ orderings) to detect concurrency deadlocks. How do you implement this in Node.js without running out of memory?

**Answer:** 
Generating 3.6 million permutations synchronously into a single JavaScript array requires allocating approximately $3.6 \times 10^6 \times 10 \times 8 \text{ bytes} \approx 290 \text{ MB}$ of array references and object wrappers. Under high concurrency or slightly larger inputs ($11! \approx 40 \text{ million}$), V8 exhausts heap space and crashes with an Out-Of-Memory error.

**Production Solution:**
1. **ES6 Generator Streaming**: Implement backtracking as an ES6 generator (`function* permute()`). The generator yields one permutation at a time, keeping active heap allocations bounded strictly to $O(n)$ space:
   ```javascript
   for (const order of permute(services)) {
     await testDeadlock(order);
   }
   ```
2. **Worker Pool Parallelization**: Partition the top-level branches across Node.js `worker_threads` (e.g., Worker 1 tests all permutations starting with Service A; Worker 2 tests those starting with Service B). This achieves multi-core CPU utilization while preventing main-thread event loop stalls.

---

<nav aria-label="Lecture navigation">

[Previous: Subsets and Power Sets](day-23-subsets-and-power-sets.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Grid Backtracking: Word Search, Maze Paths, and N-Queens](day-25-grid-backtracking-and-n-queens.md)

</nav>
