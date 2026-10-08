# Day 22: Backtracking Core: Decision State, Choices, and Undo

<nav aria-label="Lecture navigation">

[Previous: Recursion Mechanics and Call Stack](day-21-recursion-mechanics-and-call-stack.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Subsets and Power Sets](day-23-subsets-and-power-sets.md)

</nav>
## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Asymptotic analysis and search tree branching.
- [Day 04: Recursion and Call Stack](day-04-recursion-and-call-stack.md) — Call stack activation frames.
- [Day 21: Recursion Mechanics and Call Stack](day-21-recursion-mechanics-and-call-stack.md) — Winding and unwinding execution phases.
---

## 1. What Backtracking Really Is: Recursion with State Rollback

> **Backtracking**: An algorithmic design paradigm that incrementally builds candidates toward a solution and abandons a candidate ("backtracks") as soon as it violates constraints.

**Backtracking** is a systematic depth-first search strategy that constructs a solution path element-by-element, reverting the most recent decision whenever a partial configuration violates problem constraints or reaches a dead end.

Unlike standard recursion—which frequently decomposes a problem into disjoint subproblems without state rollback—backtracking navigates a state-space tree where all branches share a single evolving decision state. The lifecycle of each node follows an invariant rhythm:
1. **Choose**: Commit a candidate choice to the shared state.
2. **Explore**: Recurse down the branch to evaluate deeper decisions.
3. **Unchoose (Backtrack)**: Revert the candidate choice, restoring the shared state so alternate sibling choices can be evaluated without pollution.

```text
Decision Tree for choices [ A, B ] of length 2:
                          Root: [ ]
                        /           \
                   Choose A        Choose B
                     /                 \
                  [ A ]               [ B ]
                 /     \             /     \
             Choose A  Choose B   Choose A  Choose B
              /           \        /           \
           [A, A]       [A, B]   [B, A]      [B, B]
```

```text
The Backtracking Execution Triangle:
       ┌──────────────┐
       │ 1. CHOOSE    │ -> path.push(candidate)
       └──────┬───────┘
              │
       ┌──────▼───────┐
       │ 2. EXPLORE   │ -> backtrack(nextState)
       └──────┬───────┘
              │
       ┌──────▼───────┐
       │ 3. UNCHOOSE  │ -> path.pop()  (Restores state for next sibling)
       └──────────────┘
```

---

## 2. The Universal Backtracking Skeleton

Every production-grade backtracking algorithm conforms to a unified architectural template:

```javascript
function backtrack(path, ...stateContext) {
  // 1. BASE CASE / ACCEPTANCE: Is the candidate path a complete valid solution?
  if (isCompleteSolution(path)) {
    result.push([...path]); // Invariant: Snapshot by cloning!
    return;
  }

  // 2. CHOICES LOOP: Iterate through all candidate decisions available at this state
  for (const choice of getAvailableChoices(stateContext)) {
    // 3. PRUNING GUARD: Can this choice potentially produce a valid solution?
    if (isInvalid(choice, path)) {
      continue; // Skip invalid branch immediately
    }

    // 4. CHOOSE: Mutate shared state
    path.push(choice);

    // 5. EXPLORE: Recurse deeper down the decision tree
    backtrack(path, ...nextContext);

    // 6. UNCHOOSE: Rollback mutation in O(1) time
    path.pop();
  }
}
```

#### Shared Mutation + Rollback vs Array Cloning

| Approach | Memory Allocation | Auxiliary Space | Garbage Collection Impact in V8 |
| :--- | :--- | :--- | :--- |
| **Array Cloning (`[...path, choice]`)** | Allocates a new array on every node | $O(n \cdot b^n)$ where $b = \text{branching factor}$ | High heap churn; triggers frequent GC pauses and degrades p99 latency. |
| **In-Place Mutation (`push()` + `pop()`)** | Allocates one single shared array | $O(h)$ stack frames ($h = \text{tree height}$) | Zero temporary heap arrays; optimal cache locality in V8 packed arrays. |

```javascript
// Node.js code: Demonstrating In-Place Mutation vs Cloning and Snapshotting Pitfalls

// ❌ WRONG: Pushing mutable reference without shallow copying
function brokenBacktrack(n) {
  const result = [];
  const path = [];
  function dfs(step) {
    if (step === n) {
      result.push(path); // FATAL BUG: Pushes reference to mutable array!
      return;
    }
    path.push(step);
    dfs(step + 1);
    path.pop();
  }
  dfs(0);
  return result; // Result contains [[], []] because path was completely popped!
}

// ✅ CORRECT: In-place mutation with shallow copy snapshotting
function correctBacktrack(n) {
  const result = [];
  const path = [];
  function dfs(step) {
    if (step === n) {
      result.push([...path]); // Correct: Clones snapshot at current leaf
      return;
    }
    path.push(step);
    dfs(step + 1);
    path.pop(); // Undo state
  }
  dfs(0);
  return result;
}

console.log("Broken:", brokenBacktrack(2));   // [[], []]
console.log("Correct:", correctBacktrack(2)); // [[0, 1]]
```

---

## 3. Pruning (Bounding Conditions): Search Space Reduction

> **Pruning (Bounding)**: Evaluating candidate feasibility before recursing and skipping branches that cannot yield valid solutions.

**Pruning** is the strategic elimination of decision tree branches prior to recursive descent by checking whether a partial candidate violates invariants.

Without pruning, an algorithm degenerates into **Brute Force Exhaustion**, traversing millions of impossible configurations. When pruning conditions are enforced before recursing, exponential search spaces shrink by orders of magnitude.

```text
Decision Tree Without Pruning (Sum Target = 3, Choices = [2, 2]):
                  [ ]
               /       \
            [ 2 ]     [ 2 ]
           /     \   /     \
        [2,2]   [2] [2,2]  [2]  <- Traverses invalid sums >= 4!

Decision Tree With Pruning:
                  [ ]
               /       \
            [ 2 ]     [ 2 ]
             |          |
        sum+2=4 > 3 -> PRUNED! (Zero recursive calls spawned)
```

---

## 4. Problem Study: Generate Parentheses (LeetCode 22)

Given $n$ pairs of parentheses, generate all combinations of well-formed parentheses strings.

A naive brute-force algorithm generates all $2^{2n}$ possible strings of length $2n$ and validates each one using a stack in $O(2n)$ time, requiring $O(n \cdot 2^{2n})$ total operations.
Using **Backtracking with Invariant Pruning**:
1. **Open Invariant**: We can place an opening bracket `'('` only if `openCount < n`.
2. **Close Invariant**: We can place a closing bracket `')'` only if `closeCount < openCount`.
3. **Base Case**: A valid string is reached when `current.length === 2 * n`.

Because every string constructed conforms strictly to the prefix invariant, zero invalid strings are generated. The total number of valid strings is bounded by the $n$-th **Catalan Number**:
$$C_n = \frac{1}{n + 1} \binom{2n}{n} \approx O\left(\frac{4^n}{n\sqrt{n}}\right)$$

```javascript
// Node.js code: Generate Parentheses with Pruning

function generateParenthesis(n) {
  const result = [];

  function backtrack(currentString, openCount, closeCount) {
    // Base Case: complete well-formed string reached
    if (currentString.length === 2 * n) {
      result.push(currentString);
      return;
    }

    // Pruning Rule 1: We can always add '(' if we haven't used all n opens
    if (openCount < n) {
      backtrack(currentString + "(", openCount + 1, closeCount);
    }

    // Pruning Rule 2: We can add ')' only if there is an unclosed '('
    if (closeCount < openCount) {
      backtrack(currentString + ")", openCount, closeCount + 1);
    }
  }

  backtrack("", 0, 0);
  return result;
}

console.log(generateParenthesis(3));
// Output: [ "((()))", "(()())", "(())()", "()(())", "()()()" ]
```

---

## Detailed Node.js Relevance: Combinatorial API Route Protection

In Node.js backend architectures, exposing combinatorial backtracking algorithms (e.g., generating all product bundling permutations or schedule slots) directly inside an Express request handler poses severe availability risks:

```text
Client Request -> Express Route Handler -> Synchronous Backtracking (15 Million branches)
                                         |
                                         V
                        [ Event Loop Frozen for 4.2 seconds! ]
                                         |
       All concurrent HTTP requests, Redis pings, and DB queries TIME OUT!
```

To protect Node.js microservices:
1. **Input Validation Limits**: Reject combinatorial requests exceeding strict input thresholds at the validation layer (e.g., if $n > 10$, return HTTP 400 Bad Request).
2. **Worker Thread Offloading**: Run exponential backtracking computations inside Node.js `worker_threads`, returning results to the main thread via message ports.
3. **Cancellation & Timeout Guards**: Check an execution deadline inside the choices loop and abort with an error if calculation exceeds a SLA threshold (e.g., 50ms).

---

## Tricky Points & Edge Cases

1. **String Immutability vs Array Mutation**:
   In JavaScript, strings are primitive and immutable. Writing `backtrack(str + "(")` produces a brand-new string argument without mutating the caller's variable, eliminating the need for an explicit `str.pop()` undo step. Arrays, however, are mutable references, making the `pop()` undo step mandatory.
2. **Pruning Before vs Inside Callee**:
   Always verify feasibility *before* making the recursive call (`if (sum + choice > target) continue;`). Checking feasibility inside the callee wastes an extra call stack frame allocation for every pruned path.
3. **Empty Base Cases**:
   For $n = 0$, `generateParenthesis(0)` should return `[""]`, representing the empty set of parentheses, rather than throwing errors.

---

## Hands-On Exercise

### Scenario: Safe Expression Token Generator

You are building a query expression compiler in Node.js. Given an integer $n$, you must generate all valid nested balance expressions of square brackets `[` and `]` without blocking the event loop or leaking mutable state across branches.

### Buggy Code

```javascript
// ❌ BUGGY: Fails to snapshot properly, creates invalid strings, and leaks state
function generateBracketExpressions(n) {
  const result = [];
  const current = [];

  function dfs(open, close) {
    if (current.length === 2 * n) {
      result.push(current); // BUG 1: Pushes reference!
      return;
    }

    // BUG 2: Invalid pruning logic allows ']' before '['
    if (open < n) {
      current.push("[");
      dfs(open + 1, close);
      // BUG 3: Forgets to pop!
    }

    if (close < n) { // BUG 4: Fails to enforce close < open invariant!
      current.push("]");
      dfs(open, close + 1);
      current.pop();
    }
  }

  dfs(0, 0);
  return result;
}
```

### Acceptance Criteria

1. Returns all valid combinations of $n$ pairs of square brackets `[` and `]`.
2. Strictly preserves the invariant `close < open` to guarantee well-formed syntax.
3. Mutates an in-place array with $O(1)$ `pop()` rollback and clones valid snapshots using `join("")`.
4. Passes unit assertions verifying exact outputs and counts against Catalan numbers.

### Solution Code

```javascript
// Node.js code: Robust Bracket Expression Backtracker
const assert = require("assert");

function generateBracketExpressions(n) {
  if (n <= 0) return [""];

  const result = [];
  const path = [];

  function backtrack(openCount, closeCount) {
    // Base Case: Complete expression of length 2n reached
    if (path.length === 2 * n) {
      result.push(path.join(""));
      return;
    }

    // Choice 1: Add '[' if openCount < n
    if (openCount < n) {
      path.push("[");
      backtrack(openCount + 1, closeCount);
      path.pop(); // Undo
    }

    // Choice 2: Add ']' only if closeCount < openCount (well-formed invariant)
    if (closeCount < openCount) {
      path.push("]");
      backtrack(openCount, closeCount + 1);
      path.pop(); // Undo
    }
  }

  backtrack(0, 0);
  return result;
}

// Verification Tests
const res1 = generateBracketExpressions(1);
assert.deepStrictEqual(res1, ["[]"]);

const res2 = generateBracketExpressions(2);
assert.deepStrictEqual(res2, ["[][]", "[[]]"].sort()); // Order independent assertion

const res3 = generateBracketExpressions(3);
assert.strictEqual(res3.length, 5); // 3rd Catalan number is 5
assert(res3.includes("[[[ ]]]".replace(/\s/g, "")));
assert(res3.includes("[][][]"));

console.log("✅ All Bracket Expression tests passed successfully.");
```

### Solution Explanation

1. **Invariant Enforcement**: The condition `closeCount < openCount` guarantees that a closing bracket is never evaluated without a matching unclosed opening bracket.
2. **In-Place Mutation**: `path.push()` and `path.pop()` maintain a single array on the heap with $O(n)$ maximum space.
3. **Snapshot Isolation**: Calling `path.join("")` creates an independent string snapshot at the leaf, avoiding reference contamination.

---

## Summary

- **Backtracking Rhythm**: Systematically cycles through **Choose $\to$ Explore $\to$ Unchoose**, maintaining a single mutable candidate state.
- **In-Place Rollback**: Using `path.push()` and `path.pop()` bounds auxiliary memory to $O(h)$ tree depth, eliminating millions of array allocations.
- **Snapshot Rule**: When a valid leaf is encountered, always clone the state (`[...path]` or `path.join("")`) to prevent reference mutations.
- **Pruning**: Bounding conditions evaluated before recursive calls reduce exponential search spaces to manageable runtimes.
- **Parentheses Generation**: Bound branching by enforcing `open < n` and `close < open`, yielding $O(\frac{4^n}{\sqrt{n}})$ Catalan complexity.

---

## Cheat Sheet & Common Pitfalls

### Universal Backtracking Pattern
```javascript
function backtrack(path, state) {
  if (isComplete(path)) {
    result.push([...path]); // Clone!
    return;
  }
  for (const choice of getChoices(state)) {
    if (isInvalid(choice)) continue; // Prune!
    path.push(choice);               // 1. Choose
    backtrack(path, nextState);      // 2. Explore
    path.pop();                      // 3. Unchoose
  }
}
```

### Common Pitfalls

| Mistake | Consequence | Correct Pattern |
| :--- | :--- | :--- |
| **`result.push(path)`** | Result contains an array of empty arrays. | `result.push([...path])` creates an isolated snapshot. |
| **Missing `path.pop()`** | Mutations leak into sibling branches, corrupting paths. | Pair every `push()` with a symmetric `pop()`. |
| **Array cloning in loops** | Massive heap allocation and GC latency spikes. | Mutate a single shared array with $O(1)$ rollback. |
| **Pruning inside callee** | Wastes unnecessary call stack frame allocations. | Evaluate `if (invalid) continue` before recursing. |

---

## Interview Questions

### 1. Why does `result.push(path)` produce an array of empty arrays in backtracking, and how does `result.push([...path])` solve it?

**Question:** Why does pushing `path` directly into the result array yield an array filled with empty arrays `[[], [], []]` in JavaScript backtracking, and how does spread cloning fix this?

**Answer:** 
In JavaScript, arrays are reference types. When `result.push(path)` executes, it does not copy the array's contents; it pushes a memory pointer referencing the single mutable `path` array residing on the heap.

As the backtracking algorithm completes its exploration and unwinds back to the root, every element added during the winding phase is popped off during the unwinding phase (`path.pop()`) until `path.length === 0`. Because every entry in `result` points to the exact same memory address, reading `result` at the end inspects that single, now-empty array.

Writing `result.push([...path])` creates a shallow copy of the array's elements at that specific instant in time. The newly created array copy has its own distinct heap memory allocation, completely isolating it from subsequent `push()` and `pop()` mutations on `path`.

---

### 2. What is the output and execution trace of the following backtracking code?

**Question:** Trace the execution and determine the exact return value of this backtracking function:
```javascript
function test() {
  const res = [];
  const path = [];
  function dfs(i) {
    if (i === 2) {
      res.push([...path]);
      return;
    }
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

**Answer:** 
The function returns:
```javascript
[ [ 0, 1 ], [ 0 ], [ 1 ], [] ]
```

**Execution Trace:**
This is the classic **Include/Exclude Binary Choice Tree** for indices `[0, 1]`:
1. `dfs(0)`:
   - Includes `0`: `path = [0]`. Calls `dfs(1)`.
   - In `dfs(1)`:
     - Includes `1`: `path = [0, 1]`. Calls `dfs(2)` $\to$ hits base case, snapshots `[0, 1]`.
     - Excludes `1`: pops `1` $\to$ `path = [0]`. Calls `dfs(2)` $\to$ hits base case, snapshots `[0]`.
   - Excludes `0`: pops `0` $\to$ `path = []`. Calls `dfs(1)`.
   - In `dfs(1)`:
     - Includes `1`: `path = [1]`. Calls `dfs(2)` $\to$ hits base case, snapshots `[1]`.
     - Excludes `1`: pops `1` $\to$ `path = []`. Calls `dfs(2)` $\to$ hits base case, snapshots `[]`.

The 4 snapshots generated correspond to all $2^2 = 4$ subsets of elements `{0, 1}`.

---

### 3. How does backtracking generate all well-formed parentheses strings in Catalan complexity?

**Question:** Implement `generateParenthesis(n)` and explain why its time complexity is bounded by the $n$-th Catalan number rather than $O(2^{2n})$.

**Answer:** 

```javascript
// Node.js code
function generateParenthesis(n) {
  const result = [];

  function backtrack(current, open, close) {
    if (current.length === 2 * n) {
      result.push(current);
      return;
    }
    if (open < n) {
      backtrack(current + "(", open + 1, close);
    }
    if (close < open) {
      backtrack(current + ")", open, close + 1);
    }
  }

  backtrack("", 0, 0);
  return result;
}
```

**Complexity Explanation:**
A naive generator that tests all combinations of `(` and `)` of length $2n$ visits $2^{2n} = 4^n$ leaves.
By applying two strict pruning invariants:
1. `open < n`: Never places more than $n$ opening parentheses.
2. `close < open`: Never places a closing parenthesis unless there is an unmatched opening parenthesis to balance it.

The algorithm only explores branches that represent valid prefixes of well-formed parentheses expressions. The number of such valid strings is precisely the $n$-th Catalan number:
$$C_n = \frac{1}{n+1}\binom{2n}{n} \approx \frac{4^n}{n\sqrt{\pi n}}$$
Because every leaf visited is guaranteed to be valid, zero dead branches are explored, bounding runtime to $O(\frac{4^n}{\sqrt{n}})$.

---

### 4. What happens when an Express route handler executes a synchronous backtracking search over $3^{15}$ states?

**Question:** A backend API exposes an endpoint that executes a synchronous backtracking search with a branching factor of 3 and depth of 15 ($3^{15} \approx 14.3 \text{ million}$ operations). What happens to the Node.js process, and how should it be architected?

**Answer:** 
Executing 14.3 million recursive iterations synchronously monopolizes the single JavaScript main thread for approximately 1 to 4 seconds, depending on CPU architecture. During this execution window:
1. **Event Loop Starvation**: The Node.js event loop is completely blocked in the execution phase. It cannot advance to the Poll phase to accept new TCP socket connections or read incoming HTTP requests.
2. **Cascading Timeouts**: Existing clients waiting for responses hit reverse proxy gateway timeouts (e.g., NGINX 504 Gateway Timeout).
3. **Health Check Failures**: Kubernetes liveness and readiness probes fail, potentially causing the container orchestrator to restart the container, compounding the outage.

**Production Architecture Pattern:**
1. **Request Validation**: Enforce strict input limits at the API validation layer (e.g., $N \le 9$) to reject infeasible searches before execution.
2. **Worker Threads**: Offload the combinatorial search to a dedicated thread using `worker_threads`:
   ```javascript
   const { Worker } = require("worker_threads");
   // Offload to worker thread; main event loop remains free to serve traffic
   ```
3. **Execution Deadlines**: Pass a `deadline = Date.now() + 50` parameter into the backtracking loop, checking `if (Date.now() > deadline) throw new Error("TIMEOUT")` to fail fast.

---

<nav aria-label="Lecture navigation">

[Previous: Recursion Mechanics and Call Stack](day-21-recursion-mechanics-and-call-stack.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Subsets and Power Sets](day-23-subsets-and-power-sets.md)

</nav>
