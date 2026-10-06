# Day 23: Subsets and Power Sets

<nav aria-label="Lecture navigation">

[Previous: Backtracking Core: Decision State, Choices, and Undo](day-22-backtracking-fundamentals.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Combinations and Permutations](day-24-combinations-and-permutations.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain the mathematical derivation proving why an $n$-element set has exactly $2^n$ distinct subsets in its **Power Set**.
- Implement **Subsets I** (unique elements) using both the Include/Exclude binary choice model and the Loop-based forward index model.
- Solve **Subsets II** (containing duplicate numbers) by sorting elements and applying horizontal duplicate pruning (`i > startIndex`).
- Differentiate between vertical recursive descent (choosing identical values at deeper levels) and horizontal branching (skipping identical sibling values).
- Compare recursive backtracking with **Bit Manipulation** ($1 \ll n$) and identify JavaScript 32-bit integer overflow hazards.
- Apply subset modeling to Node.js authorization engines, including Role-Based Access Control (RBAC) and permission flags.

---

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Exponential growth rates ($O(2^n)$).
- [Day 05: Sorting and Searching Basics](day-05-sorting-and-searching-basics.md) — Numeric array sorting with comparators.
- [Day 22: Backtracking Core: Decision State, Choices, and Undo](day-22-backtracking-fundamentals.md) — State mutation, undo, and snapshotting.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
| :--- | :--- | :--- |
| **Power Set** | The set of all possible subsets of a set $S$, including the empty set $\emptyset$ and $S$ itself, with cardinality $2^{|S|}$. | Establishes the exact size of the solution space when evaluating all feature or permission configurations. |
| **Forward Index (`startIndex`)** | A parameter restricting subsequent choices to indices strictly greater than or equal to the current index. | Prevents duplicate combinations across permutations (e.g., generates `[1, 2]` but excludes `[2, 1]`). |
| **Horizontal Pruning** | Skipping duplicate elements when branching across the same decision depth (`i > startIndex && nums[i] === nums[i - 1]`). | Eliminates identical duplicate subsets without allocating expensive secondary HashSets. |
| **Vertical Descent** | The recursive progression into deeper stack frames (`i + 1`), allowing identical values from distinct indices to coexist in a single subset. | Allows valid duplicate groupings (such as `[2, 2]` from `[1, 2, 2]`) while blocking redundant sibling trees. |
| **Bitmask Enumeration** | Mapping each subset to an integer where the $k$-th bit indicates the inclusion or exclusion of the $k$-th element. | Offers an $O(1)$ stack overhead iterative alternative for inputs of size $n \le 30$. |

---

## Core Concepts

### 1. The Power Set Mathematical Model

A set with $n$ elements yields exactly **$2^n$ subsets**.

This exponential property arises from the fundamental counting principle: for every distinct element in the set, there are exactly two mutually exclusive choices:
$$\text{Choice} = \{\text{Include}, \text{Exclude}\}$$
Multiplying these two independent choices across all $n$ items gives:
$$2 \times 2 \times \dots \times 2 = 2^n$$

```text
Decision Tree for Set [ 1, 2, 3 ]:
                                  [ ]
                              /         \
                         Inc 1           Exc 1
                         /                   \
                      [ 1 ]                  [ ]
                     /     \                /     \
                 Inc 2     Exc 2        Inc 2     Exc 2
                 /             \        /             \
              [1, 2]          [ 1 ]   [ 2 ]           [ ]
              /    \          /   \   /   \          /   \
            Inc 3 Exc 3     Inc 3... Inc 3...      Inc 3 Exc 3
            /        \
         [1,2,3]   [1,2]  ...                      [3]   []
```

```text
The Two Core Mental Models for Generating Subsets:

Model 1: Binary Decision Tree (Include / Exclude)
- At every index i, recurse with nums[i] added.
- Then recurse with nums[i] omitted.
- Tree depth: n. Total leaf nodes: 2^n.

Model 2: Loop-Based Forward Index (N-ary Tree)
- Every node visited represents a valid subset!
- Loop from startIndex to n - 1, choosing nums[i] and recursing with i + 1.
- Flattens the search space and maps directly to combination problems.
```

---

### 2. Subsets I: All Intermediate Nodes Are Valid

In permutation problems, only leaf nodes containing all $n$ elements represent valid solutions. In **Subset problems**, **every single node in the recursion tree is a valid subset**.

Consequently, the snapshotting step `result.push([...path])` is executed at the very beginning of the recursive function, recording the empty set at the root and capturing every partial state as the search descends:

```javascript
// Node.js code: Subsets I (LeetCode 78)

function subsets(nums) {
  const result = [];
  const currentPath = [];

  function backtrack(startIndex) {
    // Invariant: Every node visited in the decision tree is a valid subset!
    result.push([...currentPath]);

    for (let i = startIndex; i < nums.length; i++) {
      // 1. Choose
      currentPath.push(nums[i]);

      // 2. Explore: Advance startIndex to i + 1 so we never look backward
      backtrack(i + 1);

      // 3. Unchoose (Rollback)
      currentPath.pop();
    }
  }

  backtrack(0);
  return result;
}

console.log(subsets([1, 2, 3]));
// Outputs: [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]
```

---

### 3. Subsets II: Handling Duplicates via Horizontal Pruning

When the input array contains duplicate elements (e.g., `[1, 2, 2]`), a naive backtracking search generates duplicate subsets because the first `2` and the second `2` generate identical subtrees.

```text
Naive Exploration on [ 1, 2 (a), 2 (b) ]:
Branch 1 (picks 2a): [ 1, 2 ]
Branch 2 (picks 2b): [ 1, 2 ]  <-- IDENTICAL DUPLICATE SUBSET!
```

#### The Pruning Solution

1. **Sort the Input Array**: Cluster identical numbers adjacent to each other: `nums.sort((a, b) => a - b)`.
2. **Apply Horizontal Duplicate Pruning**: Inside the loop, if an element is identical to its predecessor AND it is not the first element evaluated at this recursion level (`i > startIndex`), skip it:
   ```javascript
   if (i > startIndex && nums[i] === nums[i - 1]) continue;
   ```

```text
Decision Level with Candidates [ 2 (first), 2 (second) ] at startIndex = 1:
- i = 1 (startIndex): Choose first '2'. Valid exploration! Generates [1, 2] and [1, 2, 2].
- i = 2 (i > startIndex): nums[2] === nums[1].
  We ALREADY explored all subsets starting with '2' at this level!
  PRUNED! Skip second '2'.
```

#### Vertical vs Horizontal Duplication Comparison

| Dimension | Condition | Permitted? | Explanation |
| :--- | :--- | :--- | :--- |
| **Vertical Descent** | `i === startIndex` | **Yes** | Reaching deeper levels creates subsets containing multiple identical numbers (e.g., `[2, 2]`). |
| **Horizontal Branching** | `i > startIndex && nums[i] === nums[i - 1]` | **No (Pruned)** | Evaluates the same value at the identical position in the subset, producing redundant identical branches. |

```javascript
// Node.js code: Subsets II Implementation and Pitfall

// ❌ WRONG: Writing i > 0 instead of i > startIndex
function brokenSubsetsWithDup(nums) {
  nums.sort((a, b) => a - b);
  const result = [];
  const path = [];
  function dfs(start) {
    result.push([...path]);
    for (let i = start; i < nums.length; i++) {
      // BUG: i > 0 blocks valid vertical duplicates like [2, 2]!
      if (i > 0 && nums[i] === nums[i - 1]) continue;
      path.push(nums[i]);
      dfs(i + 1);
      path.pop();
    }
  }
  dfs(0);
  return result;
}

// ✅ CORRECT: Checking i > startIndex allows vertical depth while pruning horizontally
function subsetsWithDup(nums) {
  nums.sort((a, b) => a - b); // Prerequisite: Sort first
  const result = [];
  const currentPath = [];

  function backtrack(startIndex) {
    result.push([...currentPath]);

    for (let i = startIndex; i < nums.length; i++) {
      // Prune horizontal duplicate siblings only
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

console.log("Broken [1, 2, 2]:", brokenSubsetsWithDup([1, 2, 2])); // Misses [1, 2, 2] and [2, 2]!
console.log("Correct [1, 2, 2]:", subsetsWithDup([1, 2, 2]));       // Correct 6 unique subsets
```

---

### 4. Bitmasking vs Recursive Backtracking

Every subset of an $n$-element collection corresponds to a unique integer bitmask in the range $[0, 2^n - 1]$. The $k$-th bit of the integer indicates whether `nums[k]` is included (`1`) or excluded (`0`).

```text
nums = [ A, B, C ], length = 3 -> Masks from 0 (000_2) to 7 (111_2):
Mask 0 (000): [ ]
Mask 1 (001): [ A ]
Mask 2 (010): [ B ]
Mask 3 (011): [ A, B ]
Mask 7 (111): [ A, B, C ]
```

```javascript
// Node.js code: Bitmask Subset Generation

function subsetsBitmask(nums) {
  const n = nums.length;
  const totalSubsets = 1 << n; // 2^n
  const result = [];

  for (let mask = 0; mask < totalSubsets; mask++) {
    const subset = [];
    for (let i = 0; i < n; i++) {
      // Test if i-th bit is set
      if ((mask & (1 << i)) !== 0) {
        subset.push(nums[i]);
      }
    }
    result.push(subset);
  }

  return result;
}
```

#### JavaScript 32-Bit Bitwise Limitation Hazard

In JavaScript, all bitwise operations (`<<`, `>>`, `|`, `&`) operate strictly on **32-bit signed integers**.
- For $n \ge 31$, evaluating `1 << 31` produces `-2147483648` (signed overflow).
- Evaluating `1 << 32` wraps around: $32 \pmod{32} = 0$, evaluating to `1 << 0 = 1`.
- For collections where $n > 30$, bitmasking requires `BigInt` (`1n << BigInt(n)`) or recursive backtracking.

---

## Detailed Node.js Relevance: Role-Based Access Control (RBAC)

In Node.js enterprise microservices, user authorizations are frequently modeled as sets of discrete permission strings:
```javascript
const Permissions = {
  READ_USERS: 1 << 0,   // 0001
  WRITE_USERS: 1 << 1,  // 0010
  DELETE_USERS: 1 << 2, // 0100
  ADMIN_AUDIT: 1 << 3   // 1000
};
```
- **Permission Checking**: A fast bitwise check `(userRole & requiredPermission) !== 0` executes in $O(1)$ CPU cycles without database round-trips.
- **Payload Explosion Protection**: When an API endpoint accepts filtering dimensions (e.g., aggregations over combinations of status, region, tier), an unrestricted client could submit 25 dimensions. Computing all $2^{25} \approx 33.5 \text{ million}$ combinations would allocate over 5 GB of memory, instantly crashing Node.js with an Out-Of-Memory (OOM) error. Enforce dimension caps ($N \le 10$) at the Express middleware validation boundary.

---

## Tricky Points & Edge Cases

1. **Unsorted Inputs in Subsets II**:
   The check `nums[i] === nums[i - 1]` assumes that identical elements are adjacent. If `nums = [2, 1, 2]`, the second `2` is not adjacent to the first, and duplicate subsets like `[2]` will be generated twice. Sorting before recursing is mandatory.
2. **Accidentally Using `i > 0`**:
   Using `if (i > 0 && nums[i] === nums[i - 1]) continue;` incorrectly blocks choosing identical elements at deeper recursion levels, losing legitimate subsets like `[2, 2]`.
3. **Empty Input Handling**:
   When `nums = []`, the function must return `[[]]` (the empty set), not `[]`.

---

## Hands-On Exercise

### Scenario: Combinatorial Feature Flag Engine

In a Node.js microservice, a testing engine must generate all unique feature configuration test suites from a list of experimental flags. Flags can have duplicate labels due to legacy aliases. The engine must generate only unique flag combinations without duplicate suites.

### Buggy Code

```javascript
// ❌ BUGGY: Fails to sort, uses i > 0, and produces duplicate configurations
function generateFeatureSuites(flags) {
  const result = [];
  const current = [];

  function dfs(start) {
    result.push([...current]);

    for (let i = start; i < flags.length; i++) {
      // BUG 1: Array was never sorted! Duplicate labels like ["beta", "alpha", "beta"] fail pruning.
      // BUG 2: Uses i > 0 instead of i > start!
      if (i > 0 && flags[i] === flags[i - 1]) {
        continue;
      }
      current.push(flags[i]);
      dfs(i + 1);
      current.pop();
    }
  }

  dfs(0);
  return result;
}
```

### Acceptance Criteria

1. Sorts flag names alphabetically to cluster duplicate aliases together.
2. Implements horizontal pruning (`i > start && flags[i] === flags[i - 1]`).
3. Correctly handles arrays with duplicates, producing strictly unique combinations.
4. Verified with comprehensive Node.js assertions testing duplicate elimination and empty inputs.

### Solution Code

```javascript
// Node.js code: Robust Feature Flag Configuration Suite Generator
const assert = require("assert");

function generateFeatureSuites(flags) {
  // 1. Sort strings alphabetically to group duplicates
  const sortedFlags = [...flags].sort();
  const result = [];
  const current = [];

  function backtrack(startIndex) {
    // Every node in the decision tree represents a valid flag suite
    result.push([...current]);

    for (let i = startIndex; i < sortedFlags.length; i++) {
      // Horizontal duplicate pruning: skip identical sibling choices
      if (i > startIndex && sortedFlags[i] === sortedFlags[i - 1]) {
        continue;
      }

      current.push(sortedFlags[i]);
      backtrack(i + 1);
      current.pop(); // Undo mutation
    }
  }

  backtrack(0);
  return result;
}

// Verification Tests
const testFlags = ["canary", "alpha", "canary"];
const suites = generateFeatureSuites(testFlags);

// Expected unique combinations:
// [], ["alpha"], ["alpha", "canary"], ["alpha", "canary", "canary"], ["canary"], ["canary", "canary"]
assert.strictEqual(suites.length, 6);

const stringified = suites.map(s => s.join(","));
assert(stringified.includes(""));
assert(stringified.includes("alpha"));
assert(stringified.includes("alpha,canary"));
assert(stringified.includes("alpha,canary,canary"));
assert(stringified.includes("canary"));
assert(stringified.includes("canary,canary"));

// Edge case: Empty input returns [[]]
assert.deepStrictEqual(generateFeatureSuites([]), [[]]);

console.log("✅ All Feature Suite generator assertions passed successfully.");
```

### Solution Explanation

1. **Sorting**: `[...flags].sort()` normalizes duplicate aliases adjacent to each other without mutating the input argument.
2. **Horizontal Skipping**: `i > startIndex` skips duplicate branches at the current level while allowing vertical descent to combine multiple identical tags (e.g., `["canary", "canary"]`).
3. **Empty Base**: Calling `backtrack(0)` immediately snapshots `[]` as the baseline configuration suite.

---

## Summary

- **Power Set Cardinality**: An $n$-element set produces $2^n$ subsets because every element has two independent choices: include or exclude.
- **Tree Structure**: Every node in the recursion tree represents a valid subset, requiring snapshots at the entry of each call.
- **Subsets II Invariant**: Sort first, then prune duplicate sibling branches with `if (i > startIndex && nums[i] === nums[i - 1]) continue`.
- **Vertical vs Horizontal**: Vertical descent (`i === startIndex`) explores multiple identical values in one subset; horizontal branching (`i > startIndex`) skips redundant sibling explorations.
- **Bitwise Limits**: Bitmasking works for $n \le 30$; for $n \ge 31$, bitwise shifting wraps around in JavaScript unless `BigInt` is used.

---

## Cheat Sheet & Common Pitfalls

### Subsets Invariant Patterns
```javascript
// Subsets I (Distinct Elements)
function dfs(startIndex) {
  result.push([...path]);
  for (let i = startIndex; i < nums.length; i++) {
    path.push(nums[i]);
    dfs(i + 1);
    path.pop();
  }
}

// Subsets II (With Duplicates)
nums.sort((a, b) => a - b);
function dfs(startIndex) {
  result.push([...path]);
  for (let i = startIndex; i < nums.length; i++) {
    if (i > startIndex && nums[i] === nums[i - 1]) continue; // Horizontal skip
    path.push(nums[i]);
    dfs(i + 1);
    path.pop();
  }
}
```

### Common Pitfalls

| Mistake | Consequence | Correct Pattern |
| :--- | :--- | :--- |
| **Omitting `sort()` in Subsets II** | Fails to prune duplicates across separated values. | Sort elements ascending before recursing. |
| **`i > 0` instead of `i > startIndex`** | Disallows legitimate vertical duplicates (`[2, 2]`). | Enforce `i > startIndex` for horizontal pruning. |
| **Bitwise shift on $N \ge 32$** | Wraps around and corrupts mask values. | Use recursive backtracking or `1n << BigInt(n)`. |
| **Only snapshotting at leaves** | Captures only the full set; loses all smaller subsets. | Snapshot `result.push([...path])` on function entry. |

---

## Interview Questions

### 1. How does horizontal duplicate pruning differ from vertical duplicate exploration in Subsets II?

**Question:** Explain the difference between horizontal duplicate pruning (`i > startIndex`) and vertical duplicate exploration in Subsets II.

**Answer:** 
The decision tree distinguishes between two structural directions:
1. **Vertical Descent (Deeper Recursion Levels)**:
   When `i === startIndex`, we are making the first valid decision at this level of depth. Choosing `nums[i]` and advancing to `backtrack(i + 1)` allows picking subsequent identical elements into the **same subset** (for example, forming `[2, 2]` from `[1, 2, 2]`). This vertical duplication is legitimate and required.
2. **Horizontal Branching (Sibling Choices at Same Depth)**:
   When the loop advances (`i > startIndex`), we are evaluating alternative choices for the **exact same position** in the current subset. If `nums[i] === nums[i - 1]`, choosing `nums[i]` would explore a subtree identical to the one already evaluated when `nums[i - 1]` was chosen. Skipping when `i > startIndex && nums[i] === nums[i - 1]` prunes the redundant sibling subtree.

---

### 2. How many unique subsets are generated by `subsetsWithDup([1, 1, 1])`, and why?

**Question:** Predict the exact count and contents of subsets generated by `subsetsWithDup([1, 1, 1])`.

**Answer:** 
The function generates exactly **4 unique subsets**:
```javascript
[ [], [ 1 ], [ 1, 1 ], [ 1, 1, 1 ] ]
```

**Reasoning:**
Because all elements are identical, any subset is defined entirely by its length (how many `1`s it contains):
- Length 0: `[]`
- Length 1: `[1]`
- Length 2: `[1, 1]`
- Length 3: `[1, 1, 1]`

At each recursion level, horizontal duplicate pruning skips alternative sibling choices of `1`, permitting only a single branch per length. The total number of unique subsets for an array of $n$ identical elements is always $n + 1$.

---

### 3. How do you implement bitmask subset enumeration, and what is the 32-bit integer trap in JavaScript?

**Question:** Implement subset generation using bitmasking and explain the runtime bug that occurs when $n = 32$ in JavaScript.

**Answer:** 

```javascript
// Node.js code
function subsetsBitmask(nums) {
  const n = nums.length;
  const total = 1 << n;
  const result = [];
  for (let mask = 0; mask < total; mask++) {
    const sub = [];
    for (let i = 0; i < n; i++) {
      if ((mask & (1 << i)) !== 0) sub.push(nums[i]);
    }
    result.push(sub);
  }
  return result;
}
```

**The 32-bit Integer Trap:**
In the ECMAScript specification, bitwise operators (`<<`, `&`, `|`) cast operands to 32-bit signed integers.
1. When evaluating `1 << 32`, JavaScript masks the shift amount to the lowest 5 bits: $32 \ \& \ 31 = 0$. Consequently, `1 << 32` evaluates to `1 << 0 = 1`.
2. The loop runs for only $1$ iteration instead of $2^{32} \approx 4.29 \text{ billion}$ iterations.
3. For $n = 31$, `1 << 31` evaluates to `-2147483648`, creating an immediate loop termination bug (`mask < total` evaluates to `0 < -2147483648`, which is `false`).

For collections where $n \ge 31$, either use `BigInt(1) << BigInt(n)` or use recursive backtracking.

---

### 4. What happens when an API endpoint generates all combinations of 30 product attributes in Node.js?

**Question:** A client submits a list of 30 filter tags to an Express route that generates all possible filter subsets. What happens to the Node.js process, and how do you protect it?

**Answer:** 
An input of 30 items produces $2^{30} = 1,073,741,824$ subsets.
1. **Memory Exhaustion**: Storing 1.07 billion JavaScript arrays requires roughly $1.07 \times 10^9 \times 40 \text{ bytes} \approx 43 \text{ GB}$ of memory.
2. **Crash Mode**: V8 has a default heap limit of ~1.4 GB (64-bit). The process will exhaust memory within seconds and terminate with `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory`.

**Mitigation & Production Design:**
1. **Input Validation**: Enforce a strict schema constraint at the gateway layer (e.g., using Joi or Zod) capping the maximum number of items: `z.array(z.string()).max(10)`. An input of 10 items yields 1,024 subsets, which executes safely in under 2 milliseconds.
2. **Pagination / Generator Streaming**: If combinations must be inspected, use an ES6 Generator function (`function* subsetsGenerator()`) to yield subsets one by one without buffering the entire power set in memory.

---

<nav aria-label="Lecture navigation">

[Previous: Backtracking Core: Decision State, Choices, and Undo](day-22-backtracking-fundamentals.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Combinations and Permutations](day-24-combinations-and-permutations.md)

</nav>
