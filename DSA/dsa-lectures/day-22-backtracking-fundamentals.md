# Day 22: Backtracking Core: Decision State, Choices, and Undo

<nav aria-label="Lecture navigation">

[Previous: Recursion Mechanics and Call Stack](day-21-recursion-mechanics-and-call-stack.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Subsets and Power Sets](day-23-subsets-and-power-sets.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Master the universal 3-step backtracking blueprint: **Choose $\to$ Explore $\to$ Unchoose (Undo)**.
- Understand why in-place array mutation with an explicit undo step is dramatically faster than cloning arrays (`[...path]`) on every step.
- Visualize and trace state transitions across decision trees.
- Apply **Pruning (Bounding Conditions)** to discard invalid search subtrees early.
- Model multi-option configuration engines in Node.js backend workflows.

## Prerequisites

- [Day 04: Recursion and Call Stack](day-04-recursion-and-call-stack.md)
- [Day 21: Recursion Mechanics and Call Stack](day-21-recursion-mechanics-and-call-stack.md)

---

## Core Concepts

### 1. What Backtracking Really Is

Imagine navigating through a maze. When you arrive at a fork with three doors:
1. You **choose** door 1.
2. You walk down that path (**explore**).
3. If you hit a dead end, you walk back to the fork (**unchoose / backtrack**).
4. You try door 2.

**Backtracking is recursion with an explicit undo step.** It systematically builds candidates for a solution and abandons a candidate ("backtracks") as soon as it determines the candidate cannot possibly lead to a valid solution.

```text
Decision Tree for choices [ A, B ]:
                     Root: [ ]
                    /         \
               Choose A      Choose B
                 /               \
              [ A ]             [ B ]
             /     \           /     \
         Choose A Choose B  Choose A Choose B
          /         \        /         \
       [A, A]     [A, B]   [B, A]     [B, B]
```

---

### 2. The Universal Backtracking Blueprint

Every backtracking algorithm follows this exact skeleton:

```js
function backtrack(candidatePath, choices) {
  // 1. BASE CASE: Is the current path a complete valid solution?
  if (isSolution(candidatePath)) {
    result.push([...candidatePath]); // Save a snapshot!
    return;
  }

  // 2. ITERATE OVER CHOICES:
  for (const choice of getAvailableChoices(choices)) {
    // 3. PRUNING: Can this choice lead to a valid solution?
    if (isInvalid(choice)) continue; // Prune dead end

    // 4. CHOOSE: Apply choice to state
    candidatePath.push(choice);

    // 5. EXPLORE: Recurse deeper down the decision tree
    backtrack(candidatePath, nextChoices);

    // 6. UNCHOOSE (BACKTRACK): Undo choice to restore state
    candidatePath.pop();
  }
}
```

---

## Detailed Explanations & Node.js Relevance

### In-Place Mutation with `pop()` vs Array Cloning

There are two ways to pass state down a decision tree:

#### Flawed Approach: Array Cloning on Every Call
```js
// INEFFICIENCY TRAP:
function badBacktrack(path) {
  for (const choice of choices) {
    badBacktrack([...path, choice]); // Allocates a NEW array on every single node!
  }
}
```
If the tree has $2^n$ nodes and path length is $n$, cloning creates $O(n \cdot 2^n)$ heap allocations, putting massive pressure on V8's Garbage Collector.

#### Optimal Approach: Single Shared Array + `pop()`
```js
// OPTIMAL:
path.push(choice);     // Mutate shared array
backtrack(path);       // Recurse
path.pop();            // Undo mutation (restores state in O(1))
```
Only **one** array exists across the entire execution! When a valid solution is reached, snapshot it: `result.push([...path])`.
Auxiliary space drops from $O(n \cdot 2^n)$ to just **$O(n)$**!

---

## JavaScript Implementation & Tracing

### Problem: Generate All Binary Strings of Length $N$

Generate all possible binary strings of length $n$ (e.g. $n = 2 \to$ `["00", "01", "10", "11"]`).

```js
function generateBinaryStrings(n) {
  const result = [];
  const currentPath = [];

  function backtrack() {
    // Base Case: complete binary string of length n formed
    if (currentPath.length === n) {
      result.push(currentPath.join(""));
      return;
    }

    // Two choices at every step: '0' or '1'
    for (const bit of ["0", "1"]) {
      // 1. CHOOSE
      currentPath.push(bit);

      // 2. EXPLORE
      backtrack();

      // 3. UNCHOOSE (Undo)
      currentPath.pop();
    }
  }

  backtrack();
  return result;
}
```

### Trace: `generateBinaryStrings(2)`

| Step | Call Level | Action | `currentPath` State | Result |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `level 0` | Choose `"0"` | `["0"]` | `[]` |
| 2 | `level 1` | Choose `"0"` | `["0", "0"]` | `[]` |
| 3 | `level 2` | `len === 2` $\to$ Snapshot | `["0", "0"]` | `["00"]` |
| 4 | `level 1` | **Undo** (pop `"0"`) | `["0"]` | `["00"]` |
| 5 | `level 1` | Choose `"1"` | `["0", "1"]` | `["00"]` |
| 6 | `level 2` | `len === 2` $\to$ Snapshot | `["0", "1"]` | `["00", "01"]` |
| 7 | `level 1` | **Undo** (pop `"1"`) | `["0"]` | `["00", "01"]` |
| 8 | `level 0` | **Undo** (pop `"0"`) | `[]` | `["00", "01"]` |
| 9 | `level 0` | Choose `"1"` | `["1"]` | `["00", "01"]` |
| ... | ... | ... | ... | `["00", "01", "10", "11"]` |

- **Time Complexity**: $O(2^n)$ total strings generated.
- **Auxiliary Space**: $O(n)$ stack space and path length.

---

## Common Mistakes & Interview Traps

1. **Forgetting to Clone the Result when Snapshotting**:
   ```js
   // FATAL BUG:
   if (isComplete(path)) {
     result.push(path); // Pushes a reference to the mutable array!
   }
   ```
   Because `path` is continuously mutated and popped, `result` will end up containing an array of empty arrays `[[], [], []]`! Always push a copy: `result.push([...path])`.
2. **Forgetting the Undo Step**:
   If you `push()` without a matching `pop()`, state from dead-end branches bleeds into unrelated branches.
3. **Omitting Pruning**:
   Without early checks (`if (invalid) continue;`), backtracking traverses millions of hopeless branches.

---

## Tricky Points & Edge Cases

- **Pruning Before vs After Recursing**:
  Always prune **before** recursing (`if (sum + choice > target) continue;`). Checking after recursing wastes a stack frame.
- **Empty Initial State**:
  `n = 0` should return `[""]` or `[]` depending on problem specifications.

---

## Practical Exercise

Implement **Generate Parentheses** (LeetCode 22):
Given $n$ pairs of parentheses, write a function to generate all combinations of well-formed parentheses.
- **Pruning Rules**:
  - Can add `'('` as long as `openCount < n`.
  - Can add `')'` only when `closeCount < openCount`.
- **Acceptance Criterion**: Must run in Catalan number complexity $O(\frac{4^n}{\sqrt{n}})$ without generating invalid strings.

---

## Summary

- Backtracking explores decision trees using Choose $\to$ Explore $\to$ Unchoose.
- Using a single mutable array with `push()` and `pop()` bounds auxiliary memory to $O(n)$ tree depth.
- Always snapshot valid solutions using shallow copies: `result.push([...path])`.
- Pruning dead-end branches before recursing is what separates efficient backtracking from brute force.

---

## Cheat Sheet

### Backtracking 3-Step Rhythm
```js
path.push(choice);  // 1. Choose
backtrack();        // 2. Explore
path.pop();         // 3. Unchoose (Undo)
```

### Snapshotting Rule
```js
if (baseCondition) {
  result.push([...path]); // MUST CLONE!
  return;
}
```

---

## Interview Questions

### 1. Deep Definitions and Mental Models
**Question:** Why does `result.push(path)` produce an array of empty arrays in backtracking, and how does `result.push([...path])` solve it?
- **Expected answer shape:** In JavaScript, arrays are reference types. Pushing `path` directly stores a reference to the single mutable array used across the entire search. As the algorithm unwinds, it pops every element until `path.length === 0`. Every entry in `result` points to this same empty array. Using `[...path]` creates an independent shallow copy of the array at that exact moment in time.

### 2. Predict the Output and Trace Execution
**Question:** What does this code print?
```js
function test() {
  const res = [];
  const path = [];
  function dfs(i) {
    if (i === 2) { res.push([...path]); return; }
    path.push(i);
    dfs(i + 1);
    path.pop();
    dfs(i + 1);
  }
  dfs(0);
  return res;
}
console.log(test());
```
- **Expected answer shape:** Prints `[[0, 1], [0], [1], []]`. This represents all 4 subsets of `[0, 1]` formed by including or excluding each index at levels 0 and 1.

### 3. Implementation Exercise
**Question:** Write `generateParentheses(n)` in $O(\frac{4^n}{\sqrt{n}})$ time.
- **Expected answer shape:**
```js
function generateParenthesis(n) {
  const result = [];
  function backtrack(current, open, close) {
    if (current.length === 2 * n) {
      result.push(current);
      return;
    }
    if (open < n) backtrack(current + "(", open + 1, close);
    if (close < open) backtrack(current + ")", open, close + 1);
  }
  backtrack("", 0, 0);
  return result;
}
```

### 4. Debugging and Failure Analysis
**Question:** A candidate implements backtracking using string concatenation `backtrack(str + choice)`. When asked why they don't call `str.pop()`, they are confused. Does their code work?
- **Expected answer shape:** Yes, it works. In JavaScript, strings are primitive and immutable. `str + choice` creates a new string passed into the next frame without modifying the caller's `str`. When that frame returns, the caller's `str` remains unchanged, making an explicit undo step unnecessary. However, for arrays, mutation occurs in-place, making `pop()` mandatory.

### 5. Design and Tradeoff Questions
**Question:** When is Dynamic Programming preferred over Backtracking?
- **Expected answer shape:** Use Dynamic Programming when the problem asks for an optimal value (minimum, maximum, or count of solutions) and subproblems overlap. Use Backtracking when the problem asks to generate **all** concrete combinations, arrangements, or paths. DP cannot generate all configurations without exponential memory.

### 6. Senior Follow-ups: Node.js Resource Limits
**Question:** If a backtracking algorithm explores a search space of $3^{15}$ choices in an Express route, what will happen to concurrent API requests, and how should it be architected?
- **Expected answer shape:** $3^{15} \approx 14.3 \text{ million}$ operations executed synchronously will block the single-threaded Node.js event loop for several seconds, stalling all concurrent HTTP requests. Architecture: (1) Offload the search to a Worker Thread (`worker_threads`), (2) set a deadline/timeout check inside the backtracking loop, and (3) enforce input bounds at the API gateway ($N \le 10$).

<nav aria-label="Lecture navigation">

[Previous: Recursion Mechanics and Call Stack](day-21-recursion-mechanics-and-call-stack.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Subsets and Power Sets](day-23-subsets-and-power-sets.md)

</nav>
