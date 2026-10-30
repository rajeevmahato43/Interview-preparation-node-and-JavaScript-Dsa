# Day 21: Subsets, Permutations & Combinations

<nav aria-label="Lecture navigation">

[Previous: Recursion Trees & Backtracking](day-20-recursion-trees-and-backtracking-core.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Grid Backtracking & Mazes](day-22-grid-backtracking-and-n-queens.md)

</nav>

## 1. Subsets, Permutations & Combinations Core Concepts

Almost every combinatorial search question maps directly onto one of three core mathematical structures: Subsets, Combinations, or Permutations. Recognizing how they differ structurally dictates your recursion loop boundaries and visited-state tracking.

- **Subset (Power Set):** Any selection of elements from a set, of any length from $0$ to $n$. Order does not matter (`[1, 2]` is the same subset as `[2, 1]`). Total count: $2^n$.
- **Combination ($n$ choose $k$):** A selection of exactly $k$ items from a collection of $n$ items where order does not matter. Total count: $\binom{n}{k} = \frac{n!}{k!(n - k)!}$.
- **Permutation:** An arrangement of all $n$ items in a specific sequential order. Order does matter (`[1, 2, 3]` is distinct from `[3, 2, 1]`). Total count: $n!$.

Consider these physical analogies:
1. **Subsets (Pizza Toppings):** You have 3 toppings: Olives, Mushrooms, Peppers. For each topping, you have a binary choice: put it on the pizza, or do not. You can make $2^3 = 8$ distinct pizzas, ranging from plain cheese `[]` to the works `[O, M, P]`. Length varies from $0$ to $n$, and topping order does not matter.
2. **Combinations (Hiring a Committee):** You have 5 engineers and must choose exactly 3 for an interview panel. A committee of {Alice, Bob, Charlie} is identical to {Charlie, Alice, Bob}. The length is fixed at $k = 3$, and order does not matter.
3. **Permutations (Olympic Podium):** Three runners finish a race: Alice, Bob, Charlie. Alice winning Gold and Bob winning Silver is completely different from Bob winning Gold and Alice winning Silver. Every element is used, length is fixed at $n$, and ordering matters.

```javascript
// Baseline demonstration of Subsets using startIndex
function generatePowerSet(nums) {
  const result = [];
  const currentPath = [];

  function backtrack(startIndex) {
    // Every node in the decision tree represents a valid subset
    result.push([...currentPath]);

    for (let i = startIndex; i < nums.length; i++) {
      currentPath.push(nums[i]);      // CHOOSE
      backtrack(i + 1);               // EXPLORE (move forward)
      currentPath.pop();              // UNCHOOSE
    }
  }

  backtrack(0);
  return result;
}

console.log("Subsets of [1, 2]:", generatePowerSet([1, 2]));
// Output: [ [], [ 1 ], [ 1, 2 ], [ 2 ] ]
```

### 1.1 Structural Mechanics Comparison

Understanding the structural differences reveals the loop mechanics for each archetype:

```text
=============================================================================
               STRUCTURAL MECHANICS COMPARISON
=============================================================================
DIMENSION           SUBSETS                 COMBINATIONS            PERMUTATIONS
-----------------------------------------------------------------------------
Formula             2^n                     n! / (k!(n-k)!)         n!
Order matters?      No                      No                      Yes! ([1,2] != [2,1])
Target length       0 to n (all nodes)      Fixed k                 Fixed n (leaves only)
Loop start          for (i = start; ...)    for (i = start; ...)    for (i = 0; ...)
Used tracking       startIndex increments   startIndex increments   used[i] boolean array
Duplicate pruning   i > start && n[i]==n[i-1]i > start && n[i]==n[i-1]n[i]==n[i-1] && !used[i-1]
=============================================================================
```

- **Subsets collect every node in the recursion tree**, because every prefix represents a valid subset.
- **Combinations and Permutations collect only leaf nodes** that satisfy the target length requirement.

> [!NOTE]
> Why does Subsets save `[...currentPath]` unconditionally at the top of the function, while Permutations checks `currentPath.length === nums.length`? Because an empty set or a 1-element prefix is a valid subset, but not a complete permutation.

### 1.2 The Duplicate Handling Invariants

When inputs contain duplicate values (e.g., `[1, 2, 2]`), sorting the array upfront is mandatory so duplicates are placed adjacent to each other.

- For **Subsets and Combinations**, loop starting at `startIndex`:
  ```javascript
  if (i > startIndex && nums[i] === nums[i - 1]) continue;
  ```
  `i > startIndex` ensures we permit identical elements vertically down the same branch (`[2, 2]`), but skip identical choices horizontally across sibling branches.
- For **Permutations**, loop starting at index `0`:
  ```javascript
  if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) continue;
  ```
  `!used[i - 1]` ensures identical numbers are chosen strictly in left-to-right order. If `used[i - 1]` is false, it means the earlier duplicate was already explored and popped; picking `nums[i]` now would duplicate that branch.

### 1.3 Operations Reference Table

| Archetype | State Buffer | Result Condition | Loop Initialization | Duplicate Pruning Condition |
| :--- | :--- | :--- | :--- | :--- |
| **Subsets I** | Array `path` | Every node: `push([...path])` | `let i = startIndex` | None (distinct input) |
| **Subsets II** | Array `path` | Every node: `push([...path])` | `let i = startIndex` | `i > startIndex && nums[i] === nums[i - 1]` |
| **Combinations** | Array `path` | `path.length === k` | `let i = startIndex` | `i > startIndex && nums[i] === nums[i - 1]` |
| **Permutations I** | Array `path` | `path.length === nums.length` | `let i = 0` with `used[i]` | None (distinct input) |
| **Permutations II**| Array `path` | `path.length === nums.length` | `let i = 0` with `used[i]` | `nums[i] === nums[i - 1] && !used[i - 1]` |

---

## 2. Combinatorial Patterns

### 2.1 Pattern Family

Combinatorial problems partition into three structural families:

- **Monotonic Forward Stepping (Subsets & Combinations):** We enforce an ascending index order `i + 1`. Because elements cannot be chosen behind our current index, order permutations are naturally impossible.
- **Full Positional Assignment with Visited Array (Permutations):** Every call frame loops from `0` to $N - 1$. An external boolean array `used[i]` tracks which elements are already assigned in the current permutation.
- **Bitmask Generation (Non-recursive Power Set):** For inputs where $N \le 30$, each integer from $0$ to $2^N - 1$ represents a unique binary mask indicating element inclusion.

### 2.2 Pattern Recognition Table

| Problem Keyword Signal | Underlying Mathematical Need | Recommended Approach |
| :--- | :--- | :--- |
| "Return all possible subsets (power set)" | Collect all prefix states | Subsets backtracking (`startIndex`) |
| "Contains duplicates, return unique subsets" | Sibling horizontal deduplication | Sort + `i > startIndex && nums[i] === nums[i - 1]` |
| "Return all possible permutations" | Order matters, use each item once | Permutations backtracking (`used` array) |
| "Permutations of array with duplicate numbers" | Order matters with identical values | Sort + `used` array + `!used[i - 1]` |
| "Combinations of $k$ numbers chosen from $1 \dots n$" | Fixed length subset generation | Combinations with loop bound pruning |

### 2.3 When to Use vs When NOT to Use

- **Use Combinatorial Backtracking when:**
  - You must generate every valid subset, combination, or permutation.
  - The input size is small ($N \le 20$ for subsets, $N \le 11$ for permutations).
  - You need output in sorted or lexicographical order.
- **When NOT to use Combinatorial Backtracking:**
  - The question only asks for the **number of combinations** ($\binom{n}{k}$) or **number of permutations** ($n!$). Compute with math or dynamic programming in $O(n)$ or $O(n \cdot k)$ time.
  - Input size $N > 25$. $2^{25} \approx 3.3 \times 10^7$ arrays will exhaust memory or exceed execution time budgets.

### 2.4 The 10^7 Operations Rule

Combinatorial algorithms hit exponential growth rapidly:
- $N = 10 \implies 2^{10} = 1,024$ subsets, $10! \approx 3.6 \times 10^6$ permutations (under 50ms in Node.js).
- $N = 12 \implies 12! = 479,001,600$ permutations (over 5 seconds, will block the event loop).
- $N = 20 \implies 2^{20} \approx 1,048,576$ subsets (around 50ms).

For permutations, ensure $N \le 10$. For subsets, ensure $N \le 20$.

---

## 3. Problem Walkthroughs

### 3.1 Subsets

#### 3.1.1 Problem Statement
Given an integer array `nums` of unique elements, return all possible subsets (the power set). The solution set must not contain duplicate subsets. Return the solution in any order.

- **Input:** `nums = [1, 2, 3]`
- **Output:** `[[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]]`
- **Constraints:** $1 \le nums.length \le 10$, all elements are distinct.

#### 3.1.2 How to Think About It
Imagine a row of 3 light switches labeled 1, 2, and 3. You start with all switches OFF: `[]`. You can flip switch 1 ON: `[1]`. From there, you can also flip switch 2 ON: `[1, 2]`. Then switch 3 ON: `[1, 2, 3]`. You flip switch 3 back OFF, then flip switch 2 back OFF, and explore turning switch 3 ON instead: `[1, 3]`. Every unique combination of switch settings represents a valid subset.

#### 3.1.3 Brute Force Approach & Bottleneck
The naive approach generates subsets by string concatenation or copying arrays without index discipline:

```javascript
function naiveSubsets(nums) {
  let subsets = [[]];
  for (const num of nums) {
    const nextSubsets = [];
    for (const sub of subsets) {
      nextSubsets.push([...sub, num]);
    }
    subsets = subsets.concat(nextSubsets);
  }
  return subsets;
}
```

While iterative addition is valid for distinct numbers, it creates duplicate subsets if duplicates exist, and allocates intermediate arrays continuously.

#### 3.1.4 The Pattern Insight
Use a single array buffer `currentPath`. In a recursive helper, unconditionally save a copy `result.push([...currentPath])`. Loop through indices from `startIndex` to `nums.length - 1`, push `nums[i]`, recurse with `i + 1`, and pop `nums[i]`. This traverses the decision tree cleanly in $O(n \cdot 2^n)$ time.

#### 3.1.5 Pseudocode
```text
function subsets(nums):
    result = []
    currentPath = []

    function backtrack(startIndex):
        result.push(copy of currentPath)

        for i from startIndex to nums.length - 1:
            currentPath.push(nums[i])
            backtrack(i + 1)
            currentPath.pop()

    backtrack(0)
    return result
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal Subsets Backtracking
function subsets(nums) {
  const result = [];
  const currentPath = [];

  function backtrack(startIndex) {
    // Unconditionally capture current prefix snapshot
    result.push([...currentPath]);

    for (let i = startIndex; i < nums.length; i++) {
      currentPath.push(nums[i]); // CHOOSE
      backtrack(i + 1);          // EXPLORE (move forward)
      currentPath.pop();         // UNCHOOSE (backtrack)
    }
  }

  backtrack(0);
  return result;
}

console.log("Subsets of [1, 2, 3]:", subsets([1, 2, 3]));
// Output length: 8 subsets
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Saving mutable reference
result.push(currentPath); // Fails! Every entry in result will end up empty []
```

Because `currentPath` is modified in-place and emptied by subsequent `pop()` operations, saving the array reference directly results in an output containing only empty arrays. Always spread: `[...currentPath]`.

#### 3.1.8 Complexity Derivation
- **Time Complexity:** $O(n \cdot 2^n)$. There are $2^n$ subsets in total. Copying each subset of average length $n/2$ into the result array takes $O(n)$ time.
- **Auxiliary Space Complexity:** $O(n)$ for the recursion call stack and `currentPath` buffer.

---

### 3.2 Subsets II

#### 3.2.1 Problem Statement
Given an integer array `nums` that may contain duplicates, return all possible unique subsets (the power set). The solution set must not contain duplicate subsets. Return the solution in any order.

- **Input:** `nums = [1, 2, 2]`
- **Output:** `[[], [1], [1, 2], [1, 2, 2], [2], [2, 2]]`
- **Constraints:** $1 \le nums.length \le 10$, $-10 \le nums[i] \le 10$.

#### 3.2.2 How to Think About It
Suppose you have three coins: one dime and two identical pennies. If you choose the dime and the first penny, you hold {dime, penny}. If your friend instead chooses the dime and the second penny, they also hold {dime, penny}. These are identical subsets. To avoid duplicates, you decide: if you have two identical pennies sitting on the table, you may only pick the second penny if you have already picked the first penny.

#### 3.2.3 Brute Force Approach & Bottleneck
Generate all $2^n$ subsets naively, sort each subset, convert each subset to a string (`"1,2"`), and insert into a `Set`:

```javascript
function subsetsWithDupNaive(nums) {
  const result = [];
  const seen = new Set();
  nums.sort((a, b) => a - b);

  function backtrack(start, path) {
    const key = path.join(',');
    if (!seen.has(key)) {
      seen.add(key);
      result.push([...path]);
    }
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      backtrack(i + 1, path);
      path.pop();
    }
  }
  backtrack(0, []);
  return result;
}
```

The bottleneck is memory churn and wasted traversal. The algorithm still explores all $2^n$ recursive branches, generating strings and computing hash collisions for redundant paths.

#### 3.2.4 The Pattern Insight
1. Sort `nums` ascending upfront so duplicate numbers are adjacent.
2. In the loop, skip identical items at the same horizontal tree level:
   ```javascript
   if (i > startIndex && nums[i] === nums[i - 1]) continue;
   ```
   When `i === startIndex`, we are going deeper into child branches (e.g. picking the second 2 to form `[2, 2]`). When `i > startIndex`, we are iterating over sibling alternatives at the same depth; picking the second 2 here would duplicate the branch started by the first 2.

#### 3.2.5 Pseudocode
```text
function subsetsWithDup(nums):
    sort nums ascending
    result = []
    currentPath = []

    function backtrack(startIndex):
        result.push(copy of currentPath)

        for i from startIndex to nums.length - 1:
            if i > startIndex and nums[i] == nums[i - 1]:
                continue // prune sibling duplicate
            currentPath.push(nums[i])
            backtrack(i + 1)
            currentPath.pop()

    backtrack(0)
    return result
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal Subsets II with Sibling Pruning
function subsetsWithDup(nums) {
  const result = [];
  const currentPath = [];

  // 1. Sort to group duplicates
  nums.sort((a, b) => a - b);

  function backtrack(startIndex) {
    result.push([...currentPath]);

    for (let i = startIndex; i < nums.length; i++) {
      // Prune duplicate sibling branches
      if (i > startIndex && nums[i] === nums[i - 1]) {
        continue;
      }

      currentPath.push(nums[i]); // CHOOSE
      backtrack(i + 1);          // EXPLORE
      currentPath.pop();         // UNCHOOSE
    }
  }

  backtrack(0);
  return result;
}

console.log("Subsets with duplicates [1, 2, 2]:");
console.log(subsetsWithDup([1, 2, 2]));
// Output: [ [], [ 1 ], [ 1, 2 ], [ 1, 2, 2 ], [ 2 ], [ 2, 2 ] ]
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Checking (i > 0 && nums[i] === nums[i - 1])
if (i > 0 && nums[i] === nums[i - 1]) {
  continue; // BUG: Prunes valid child [2, 2]!
}
```

Using `i > 0` instead of `i > startIndex` prevents taking duplicate elements vertically down the same branch, mistakenly discarding valid subsets like `[2, 2]`.

#### 3.2.8 Complexity Derivation
- **Time Complexity:** $O(n \cdot 2^n)$ in the worst case (distinct inputs). With duplicates, it takes $O(n \cdot K)$, where $K$ is the number of unique subsets generated.
- **Auxiliary Space Complexity:** $O(n)$ for the recursion stack and `currentPath` buffer.

---

### 3.3 Permutations II

#### 3.3.1 Problem Statement
Given a collection of numbers `nums` that might contain duplicates, return all possible unique permutations in any order.

- **Input:** `nums = [1, 1, 2]`
- **Output:** `[[1, 1, 2], [1, 2, 1], [2, 1, 1]]`
- **Constraints:** $1 \le nums.length \le 8$, $-10 \le nums[i] \le 10$.

#### 3.3.2 How to Think About It
Suppose you are placing three scrabble tiles on a board: two identical letter `A` tiles and one letter `B` tile. If you place the first `A` at spot 1, the second `A` at spot 2, and `B` at spot 3, you form `AAB`. If you swap the two identical `A` tiles, you still form `AAB`. To avoid generating duplicate arrangements, enforce an order rule: you may only place the second `A` tile on the board if the first `A` tile is already placed in the current word.

#### 3.3.3 Brute Force Approach & Bottleneck
Generate all $n!$ permutations using a standard visited tracker, serialize them to strings, and filter duplicates with a Set:

```javascript
function permuteUniqueNaive(nums) {
  const result = [];
  const seen = new Set();
  const used = new Array(nums.length).fill(false);

  function backtrack(path) {
    if (path.length === nums.length) {
      const key = path.join(',');
      if (!seen.has(key)) {
        seen.add(key);
        result.push([...path]);
      }
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(nums[i]);
      backtrack(path);
      path.pop();
      used[i] = false;
    }
  }
  backtrack([]);
  return result;
}
```

For an array of 8 identical numbers `[1, 1, 1, 1, 1, 1, 1, 1]`, there is only 1 unique permutation. The naive approach generates all $8! = 40,320$ identical permutations and hashes 40,320 strings, wasting CPU and memory.

#### 3.3.4 The Pattern Insight
1. Sort `nums` ascending upfront.
2. Maintain a boolean array `used = new Array(nums.length).fill(false)`.
3. Loop from `i = 0` to `nums.length - 1`:
   - If `used[i]` is true, skip (element already picked in the current word).
   - If `nums[i] === nums[i - 1]` and `!used[i - 1]`, skip!
   If `used[i - 1]` is false, it means the earlier duplicate was already explored as a choice at this position and has already been backtracked. Starting a new choice with `nums[i]` would reproduce an identical permutation tree.

#### 3.3.5 Pseudocode
```text
function permuteUnique(nums):
    sort nums ascending
    result = []
    path = []
    used = boolean array of size nums.length filled with false

    function backtrack():
        if path.length == nums.length:
            result.push(copy of path)
            return

        for i from 0 to nums.length - 1:
            if used[i]: continue
            if i > 0 and nums[i] == nums[i - 1] and not used[i - 1]:
                continue // prune duplicate sibling

            used[i] = true
            path.push(nums[i])
            backtrack()
            path.pop()
            used[i] = false

    backtrack()
    return result
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal Permutations II with Visited Array Pruning
function permuteUnique(nums) {
  const result = [];
  const currentPath = [];
  const used = new Array(nums.length).fill(false);

  // 1. Sort to group duplicates
  nums.sort((a, b) => a - b);

  function backtrack() {
    if (currentPath.length === nums.length) {
      result.push([...currentPath]);
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;

      // Duplicate pruning: only pick nums[i] if identical predecessor is currently in use
      if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) {
        continue;
      }

      used[i] = true;
      currentPath.push(nums[i]); // CHOOSE
      backtrack();               // EXPLORE
      currentPath.pop();         // UNCHOOSE
      used[i] = false;
    }
  }

  backtrack();
  return result;
}

console.log("Unique Permutations of [1, 1, 2]:");
console.log(permuteUnique([1, 1, 2]));
// Output: [ [ 1, 1, 2 ], [ 1, 2, 1 ], [ 2, 1, 1 ] ]
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Using 'used[i - 1]' instead of '!used[i - 1]'
if (i > 0 && nums[i] === nums[i - 1] && used[i - 1]) {
  continue;
}
```

Checking `used[i - 1]` without negation reverses the order logic and explores significantly more redundant branches before pruning, degrading performance.

#### 3.3.8 Complexity Derivation
- **Time Complexity:** $O(n \cdot n!)$ worst case (all elements distinct). With duplicates, it generates exactly $\frac{n!}{p_1! \cdot p_2! \dots}$ permutations, each copied in $O(n)$ time.
- **Auxiliary Space Complexity:** $O(n)$ for the `used` array and the recursion call stack.

---

## 4. Tricky Edge Cases

- **Empty Input:** Ensure empty inputs return an appropriate baseline (e.g. `subsets([])` returns `[[]]`).
- **All Identical Elements:** An input like `[1, 1, 1, 1]` must generate exactly 1 unique permutation and 5 unique subsets (`[]`, `[1]`, `[1, 1]`, `[1, 1, 1]`, `[1, 1, 1, 1]`).
- **Subsets vs Permutations Duplicate Condition:** For subsets, compare `i > startIndex`. For permutations, check `!used[i - 1]`. Mixing these two conditions causes incorrect results.
- **Memory Pressure on Large $N$:** Generating all permutations of $N = 11$ produces nearly 40 million arrays, which can exceed V8 memory limits. Stream results with generators if processing large combinatorial spaces.

---

## 5. Summary Cheat Sheet

- **Subsets** collect every node in the recursion tree; length ranges from $0$ to $n$.
- **Combinations** collect leaf nodes of fixed length $k$; loop advances with `i + 1`.
- **Permutations** collect leaf nodes of fixed length $n$; loop starts at `0` on every frame using a boolean `used` array.
- **Sorting** is the prerequisite for duplicate handling in all combinatorial patterns.
- **Deduplication Formula for Subsets:** `i > startIndex && nums[i] === nums[i - 1]`.
- **Deduplication Formula for Permutations:** `i > 0 && nums[i] === nums[i - 1] && !used[i - 1]`.

---

## 6. Practice Problems

### 6.1 Combinations of Size K

- **Input:** `n = 4, k = 2`
- **Output:** `[[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]]`
- **Constraint:** $1 \le k \le n \le 20$.
- **Hint 1:** Loop from `startIndex` to `n`.
- **Hint 2:** Prune the loop when there are not enough remaining elements to reach length $k$: `i <= n - (k - path.length) + 1`.
- **Hint 3:** Base case: `if (path.length === k)`.

### 6.2 Non-decreasing Subsequences

- **Input:** `nums = [4, 6, 7, 7]`
- **Output:** `[[4, 6], [4, 6, 7], [4, 6, 7, 7], [4, 7], [4, 7, 7], [6, 7], [6, 7, 7], [7, 7]]`
- **Constraint:** You cannot sort the input array because relative sequence order must be preserved.
- **Hint 1:** Since you cannot sort, track duplicates at each recursion level using a `Set` local to the current frame (`const usedInFrame = new Set()`).
- **Hint 2:** Only pick `nums[i]` if `path.length === 0` or `nums[i] >= path[path.length - 1]`.
- **Hint 3:** Save combinations where `path.length >= 2`.

### 6.3 Permutation Sequence

- **Input:** `n = 3, k = 3`
- **Output:** `"213"`
- **Constraint:** $1 \le n \le 9$, $1 \le k \le n!$.
- **Hint 1:** Avoid generating the first $k - 1$ permutations recursively.
- **Hint 2:** The first digit splits the $n!$ permutations into $n$ groups of $(n - 1)!$ permutations each.
- **Hint 3:** Determine digits one by one using integer division `Math.floor((k - 1) / factorial)` and array deletion.

---

<nav aria-label="Lecture navigation">

[Previous: Recursion Trees & Backtracking](day-20-recursion-trees-and-backtracking-core.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Grid Backtracking & Mazes](day-22-grid-backtracking-and-n-queens.md)

</nav>
