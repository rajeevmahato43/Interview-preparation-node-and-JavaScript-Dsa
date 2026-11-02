# Day 20: Recursion Trees & Backtracking

<nav aria-label="Lecture navigation">

[Previous: Merge Sort & Quick Sort](day-19-merge-sort-and-quick-sort.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Subsets, Permutations & Combinations](day-21-subsets-permutations-and-combinations.md)

</nav>

---

## 1. Backtracking Core Concepts

In regular recursion, we cut a big problem into smaller pieces and put the answers together. But many problems ask us to find combinations or explore all possible choices—like finding a way out of a maze or solving a puzzle.

**Backtracking** is a way to try out every possible choice step by step. You make a choice, take a step forward, and see if it works. If you hit a dead end or break a rule, you stop immediately. You undo your last choice (step backward) and try a different path instead.

Imagine walking through a dark stone maze:
- When you reach a fork in the path, you tie a string to the wall and walk down the left tunnel.
- If you hit a solid dead-end wall, you do not walk all the way back to the maze entrance.
- You simply follow your string backward to the fork, roll up your string, and try the next tunnel instead!
- You check every path step by step without wasting time starting over.

```javascript
// Basic backtracking skeleton demonstrating Choose, Explore, Unchoose
function generateBinaryStrings(n) {
  const results = [];
  const currentPath = [];

  function backtrack() {
    if (currentPath.length === n) {
      results.push(currentPath.join(''));
      return;
    }

    for (const bit of ['0', '1']) {
      // 1. CHOOSE
      currentPath.push(bit);

      // 2. EXPLORE
      backtrack();

      // 3. UNCHOOSE (Rollback state for sibling branches)
      currentPath.pop();
    }
  }

  backtrack();
  return results;
}

console.log("Binary strings of length 3:", generateBinaryStrings(3));
// Output: [ '000', '001', '010', '011', '100', '101', '110', '111' ]
```

### 1.1 The Choose, Explore, Unchoose Lifecycle

Backtracking relies on three simple steps at every decision point:

- **Choose:** Add the choice to your path array (`path.push(...)`).
- **Explore:** Call the function again to go one step deeper into the tree.
- **Unchoose:** Remove the choice from your path array (`path.pop()`), resetting the array so you can test the next choice cleanly.

```text
Visualizing Path Buffer Mutation:
Decision Level 0: path = []
  push('0')   --> path = ['0']
    push('0') --> path = ['0', '0']  ==> GOAL! Snapshot created: '00'
    pop()     --> path = ['0']        <-- State restored!
    push('1') --> path = ['0', '1']  ==> GOAL! Snapshot created: '01'
    pop()     --> path = ['0']        <-- State restored!
  pop()       --> path = []           <-- State restored to root!
  push('1')   --> path = ['1']
```

> [!NOTE]
> Self-Check: Why do we use one single array with `push()` and `pop()` instead of making a new array on every call?
> Answer: Making a new array on every call creates thousands of short-lived objects in memory. That slows down Node.js. Using one shared array and cleaning it up with `pop()` keeps memory usage tiny ($O(n)$).

### 1.2 State Space Trees and Pruning

Every backtracking problem can be drawn as a tree of choices. The root is empty, middle nodes are partial choices, and leaves are complete answers.

```text
Decision Tree for Parentheses (n = 2):
                       "" (open:0, close:0)
                           /
                        "(" (open:1, close:0)
                       /                      \
             "((" (open:2, close:0)       "()" (open:1, close:1)
                     |                             |
             "(()" (open:2, close:1)      "()(" (open:2, close:1)
                     |                             |
             "(())" (open:2, close:2)     "()()" (open:2, close:2)
                  [VALID]                      [VALID]
```

**Pruning** means cutting off dead ends early. For example, starting with `)` can never make a valid pair of parentheses. We stop immediately and never check that branch.

### 1.3 Operations Reference Table

| Backtracking Archetype | Decision Space per Step | State Buffer Mutation | Rollback Operation | Typical Time Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **Combinations / Subsets** | Choices from `startIndex` to $N - 1$ | `path.push(arr[i])` | `path.pop()` | $O(2^n)$ or $O(\binom{n}{k})$ |
| **Permutations** | All $N$ items excluding visited | `path.push(arr[i]); visited.add(i)` | `path.pop(); visited.delete(i)` | $O(n!)$ |
| **Grid Pathfinding** | 4 cardinal directions | Mark cell `visited` | Restore unvisited state | $O(4^{m \times n})$ |
| **String Partitions** | Slices from `startIndex` | `path.push(subStr)` | `path.pop()` | $O(2^n)$ |

---

## 2. Backtracking Patterns

### 2.1 Pattern Family

Backtracking patterns divide into three primary shapes:

- **Pruning Invalid Paths:** Build choices one by one (like valid parentheses). Check rules at each step so you never waste time on broken paths.
- **Ordered Choices with Start Index:** Use a moving `startIndex` to pick items in order. This stops you from creating the same combination twice in a different order (like `[2, 3]` and `[3, 2]`).
- **Reuse with Target Remaining:** Keep picking from the same numbers again and again until the leftover target reaches zero.

### 2.2 Pattern Recognition Table

| Problem Keyword Signal | Underlying Computational Need | Recommended Approach |
| :--- | :--- | :--- |
| "Generate all valid parentheses of length $2n$" | Validate open/close balance at each step | Pruned Backtracking with counter invariants |
| "Find all unique combinations that sum to target" | Avoid permutation duplicates; reuse allowed | Backtracking with `startIndex` and sort pruning |
| "Letter combinations of a phone number" | Multi-way branching over character lookup tables | Multi-branch Backtracking |
| "Generate all permutations of array" | Order matters; each item used once | Backtracking with `visited` boolean array |
| "Partition string into palindrome substrings" | Substring prefix validation before recursing | Backtracking with palindrome check |

### 2.3 When to Use vs When NOT to Use

- **Use Backtracking when:**
  - You need to generate or list **all** valid solutions.
  - The problem size is small ($n \le 20$ for $O(2^n)$ problems, $n \le 12$ for $O(n!)$ problems).
  - You can stop early by checking constraints.
- **When NOT to use Backtracking:**
  - The problem only asks for the best value (min, max, or count of ways) and choices overlap. Use Dynamic Programming instead.
  - Input size $n \ge 100$. Backtracking will take too long or crash the call stack.

### 2.4 The 10^7 Operations Rule

Combinatorial algorithms grow very fast:
- $n = 10 \implies 2^{10} \approx 1,024$ operations (under 1 millisecond).
- $n = 20 \implies 2^{20} \approx 1,048,576$ operations (around 10 milliseconds).
- $n = 30 \implies 2^{30} \approx 1,073,741,824$ operations (freezes the Node.js event loop for over 10 seconds).

If $n > 25$, pure backtracking will fail unless pruning cuts out more than 99% of branches.

---

## 3. Problem Walkthroughs

### 3.1 Generate Parentheses

#### 3.1.1 Problem Statement
Given an integer `n`, generate all combinations of well-formed parentheses containing exactly `n` pairs of open `(` and closed `)` parentheses.

- **Input:** `n = 3`
- **Output:** `["((()))", "(()())", "(())()", "()(())", "()()()"]`
- **Constraints:** $1 \le n \le 8$.

#### 3.1.2 How to Think About It
Imagine you have a small bag with $n$ opening brackets `(` and $n$ closing brackets `)`. You build a string from left to right:
- You can add an opening bracket `(` whenever you still have some left in the bag (`openCount < n`).
- You can add a closing bracket `)` only if there are already more open brackets than closed brackets in your string (`closeCount < openCount`).
- If you follow these two simple rules, you will never build an invalid string!

#### 3.1.3 Brute Force Approach & Bottleneck
Generate all $2^{2n}$ possible strings of length $2n$ consisting of `(` and `)`. After generating each string, test whether it is valid:

```javascript
function generateParenthesesNaive(n) {
  const results = [];
  function isValid(s) {
    let bal = 0;
    for (const ch of s) {
      if (ch === '(') bal++;
      else bal--;
      if (bal < 0) return false;
    }
    return bal === 0;
  }

  function build(current) {
    if (current.length === 2 * n) {
      if (isValid(current)) results.push(current);
      return;
    }
    build(current + '(');
    build(current + ')');
  }

  build('');
  return results;
}
```

The bottleneck is generating thousands of invalid strings. For $n = 8$, this tries 65,536 strings even though only 1,430 of them are actually valid! It wastes time building broken strings all the way to the end.

#### 3.1.4 The Pattern Insight
Check the rules at every single step:
1. Add `(` only if `openCount < n`.
2. Add `)` only if `closeCount < openCount`.

Any branch that breaks these rules is never explored, cutting out wasted work completely.

#### 3.1.5 Pseudocode
```text
function generateParenthesis(n):
    result = []
    currentChars = []

    function backtrack(openCount, closeCount):
        if currentChars.length == 2 * n:
            result.push(join(currentChars))
            return

        if openCount < n:
            currentChars.push('(')
            backtrack(openCount + 1, closeCount)
            currentChars.pop()

        if closeCount < openCount:
            currentChars.push(')')
            backtrack(openCount, closeCount + 1)
            currentChars.pop()

    backtrack(0, 0)
    return result
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal Backtracking with Invariant Pruning
function generateParenthesis(n) {
  const result = [];
  const currentChars = [];

  function backtrack(openCount, closeCount) {
    // Goal state: complete valid string
    if (currentChars.length === 2 * n) {
      result.push(currentChars.join(''));
      return;
    }

    // Branch 1: Add open parenthesis
    if (openCount < n) {
      currentChars.push('(');               // CHOOSE
      backtrack(openCount + 1, closeCount); // EXPLORE
      currentChars.pop();                   // UNCHOOSE
    }

    // Branch 2: Add close parenthesis
    if (closeCount < openCount) {
      currentChars.push(')');               // CHOOSE
      backtrack(openCount, closeCount + 1); // EXPLORE
      currentChars.pop();                   // UNCHOOSE
    }
  }

  backtrack(0, 0);
  return result;
}

console.log("n = 3:", generateParenthesis(3));
// Output: [ '((()))', '(()())', '(())()', '()(())', '()()()' ]
console.log("n = 1:", generateParenthesis(1));
// Output: [ '()' ]
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: String concatenation in deep recursion
function badBacktrack(str, open, close) {
  if (str.length === 2 * n) {
    result.push(str);
    return;
  }
  if (open < n) badBacktrack(str + '(', open + 1, close);
  if (close < open) badBacktrack(str + ')', open, close + 1);
}
```

Creating fresh strings with `str + '('` at every recursive level generates thousands of intermediate string objects on the V8 heap. A single array buffer with `push()` and `pop()` avoids heap reallocation.

#### 3.1.8 Complexity Derivation
- **Time Complexity:** $O(\frac{4^n}{\sqrt{n}})$, bounded by the $n$-th Catalan number $C_n = \frac{1}{n+1}\binom{2n}{n}$. For $n = 4$, exactly 14 valid paths are generated instead of $2^8 = 256$.
- **Auxiliary Space Complexity:** $O(n)$ for the recursion call stack of depth $2n$ and the `currentChars` buffer.

---

### 3.2 Combination Sum

#### 3.2.1 Problem Statement
Given an array of distinct integers `candidates` and a target integer `target`, return a list of all unique combinations of `candidates` where the chosen numbers sum to `target`. Elements from `candidates` may be chosen an unlimited number of times.

- **Input:** `candidates = [2, 3, 6, 7]`, `target = 7`
- **Output:** `[[2, 2, 3], [7]]`
- **Constraints:** $1 \le candidates.length \le 30$, $2 \le candidates[i] \le 40$, all elements are distinct, $1 \le target \le 40$.

#### 3.2.2 How to Think About It
Imagine paying a 7-dollar bill using 2, 3, 6, and 7 dollar coins:
- You put down a 2-dollar coin. Now you need 5 more dollars.
- You put down another 2-dollar coin. Now you need 3 more dollars.
- You put down a 3-dollar coin. Now you need 0 dollars. You found a match: `[2, 2, 3]`!
- To make sure you do not make `[3, 2, 2]` as a duplicate answer later, follow this rule: once you move on to 3-dollar coins, never look backward at 2-dollar coins again.

#### 3.2.3 Brute Force Approach & Bottleneck
The naive approach generates all sequences that sum to target and uses a Set of sorted strings to filter duplicates:

```javascript
function naiveCombinationSum(candidates, target) {
  const result = [];
  const seen = new Set();

  function search(rem, path) {
    if (rem === 0) {
      const key = [...path].sort((a, b) => a - b).join(',');
      if (!seen.has(key)) {
        seen.add(key);
        result.push([...path]);
      }
      return;
    }
    if (rem < 0) return;

    for (const num of candidates) {
      search(rem - num, [...path, num]);
    }
  }

  search(target, []);
  return result;
}
```

The bottleneck is exploring duplicate orders. Exploring `[2, 2, 3]`, `[2, 3, 2]`, and `[3, 2, 2]` separately wastes time. Also, spreading arrays on each call creates unnecessary objects.

#### 3.2.4 The Pattern Insight
1. **Move Forward Only (`startIndex`):** Loop from `startIndex` to `candidates.length - 1`. Pass the current index `i` into the recursive call so the element can be reused, but prevent the algorithm from ever picking numbers from earlier indices.
2. **Early Pruning with Sorting:** Sort `candidates` ascending upfront. If `candidates[i] > remainingTarget`, every subsequent candidate will also exceed the target, allowing an immediate `break`.

#### 3.2.5 Pseudocode
```text
function combinationSum(candidates, target):
    sort candidates ascending
    result = []
    path = []

    function backtrack(remaining, startIndex):
        if remaining == 0:
            result.push(copy of path)
            return

        for i from startIndex to candidates.length - 1:
            if candidates[i] > remaining:
                break // sorted pruning
            path.push(candidates[i])
            backtrack(remaining - candidates[i], i) // reuse allowed
            path.pop()

    backtrack(target, 0)
    return result
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal Combination Sum with Sort Pruning
function combinationSum(candidates, target) {
  const result = [];
  const currentPath = [];

  // Sort ascending to enable break pruning
  candidates.sort((a, b) => a - b);

  function backtrack(remainingTarget, startIndex) {
    if (remainingTarget === 0) {
      // Snapshot the path snapshot
      result.push([...currentPath]);
      return;
    }

    for (let i = startIndex; i < candidates.length; i++) {
      const candidate = candidates[i];

      // Pruning: if candidate exceeds remaining target, all subsequent will too
      if (candidate > remainingTarget) {
        break;
      }

      currentPath.push(candidate);              // CHOOSE
      backtrack(remainingTarget - candidate, i); // EXPLORE (reuse index i)
      currentPath.pop();                        // UNCHOOSE
    }
  }

  backtrack(target, 0);
  return result;
}

console.log("Combinations for 7:", combinationSum([2, 3, 6, 7], 7));
// Output: [ [ 2, 2, 3 ], [ 7 ] ]
console.log("Combinations for 8:", combinationSum([2, 3, 5], 8));
// Output: [ [ 2, 2, 2, 2 ], [ 2, 3, 3 ], [ 3, 5 ] ]
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Pushing path reference directly
if (remainingTarget === 0) {
  result.push(currentPath); // BUG: Pushes mutable reference!
  return;
}
```

Because `currentPath` is mutated in-place by subsequent `path.pop()` operations, the final `result` array will contain only empty arrays `[[], []]`. Always push a shallow copy: `result.push([...currentPath])`.

#### 3.2.8 Complexity Derivation
- **Time Complexity:** $O(N^{\frac{T}{M}})$, where $N$ is the candidate count, $T$ is the target value, and $M$ is the minimum candidate value. The maximum tree depth is $\frac{T}{M}$.
- **Auxiliary Space Complexity:** $O(\frac{T}{M})$ for the recursion stack and `currentPath` buffer.

---

### 3.3 Letter Combinations of a Phone Number

#### 3.3.1 Problem Statement
Given a string containing digits from `2-9` inclusive, return all possible letter combinations that the number could represent based on the telephone keypad mapping. Return the answer in any order.

- **Mapping:** `2 -> "abc"`, `3 -> "def"`, `4 -> "ghi"`, `5 -> "jkl"`, `6 -> "mno"`, `7 -> "pqrs"`, `8 -> "tuv"`, `9 -> "wxyz"`.
- **Input:** `digits = "23"`
- **Output:** `["ad", "ae", "af", "bd", "be", "bf", "cd", "ce", "cf"]`
- **Constraints:** $0 \le digits.length \le 4$.

#### 3.3.2 How to Think About It
Imagine a bike lock with rotating dials:
The first dial has letters for 2 (`a`, `b`, `c`). The second dial has letters for 3 (`d`, `e`, `f`).
- Turn the first dial to `a`, and spin through the second dial: `ad`, `ae`, `af`.
- Turn the first dial to `b`, and spin through the second dial: `bd`, `be`, `bf`.
- Turn the first dial to `c`, and spin through the second dial: `cd`, `ce`, `cf`.

#### 3.3.3 Brute Force Approach & Bottleneck
Using nested loops works only if the number of digits is fixed. For variable digits length, nested loops become impossible without messy code or recursive tree traversal.

#### 3.3.4 The Pattern Insight
At each recursive depth `index`, identify the characters mapped to `digits[index]`. Loop through each character, append it to the current path, recurse to `index + 1`, and pop the character afterward. When `index === digits.length`, save the snapshot.

#### 3.3.5 Pseudocode
```text
function letterCombinations(digits):
    if digits is empty: return []
    map digits to letters
    result = []
    path = []

    function backtrack(index):
        if index == digits.length:
            result.push(join(path))
            return

        letters = map[digits[index]]
        for letter in letters:
            path.push(letter)
            backtrack(index + 1)
            path.pop()

    backtrack(0)
    return result
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal Multi-Branch Backtracking
function letterCombinations(digits) {
  if (!digits || digits.length === 0) return [];

  const phoneMap = {
    '2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl',
    '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz'
  };

  const result = [];
  const path = [];

  function backtrack(digitIndex) {
    if (digitIndex === digits.length) {
      result.push(path.join(''));
      return;
    }

    const letters = phoneMap[digits[digitIndex]];
    for (let i = 0; i < letters.length; i++) {
      path.push(letters[i]);      // CHOOSE
      backtrack(digitIndex + 1);  // EXPLORE
      path.pop();                 // UNCHOOSE
    }
  }

  backtrack(0);
  return result;
}

console.log("Digits '23':", letterCombinations("23"));
// Output: [ 'ad', 'ae', 'af', 'bd', 'be', 'bf', 'cd', 'ce', 'cf' ]
console.log("Empty digits:", letterCombinations(""));
// Output: []
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Forgetting edge case of empty string
function badLetterCombinations(digits) {
  // If digits === "", returns [""] instead of []!
  const result = [];
  // ...
  return result;
}
```

When `digits = ""`, the algorithm reaches the base case immediately and returns `[""]` containing an empty string, violating the problem constraint of returning `[]`.

#### 3.3.8 Complexity Derivation
- **Time Complexity:** $O(4^N \times N)$, where $N$ is the number of digits. Digits 7 and 9 have 4 letters; in the worst case there are $4^N$ combinations, each taking $O(N)$ to build.
- **Auxiliary Space Complexity:** $O(N)$ for the recursion tree depth of $N$ and the `path` buffer.

---

## 4. Tricky Edge Cases

- **Empty Input:** Always guard empty inputs upfront. For example, `digits = ""` must return `[]`, not `[""]`.
- **Zero Values in Unbounded Sums:** If candidates include `0` and elements can be reused, subtracting `0` causes an infinite recursive loop resulting in `RangeError: Maximum call stack size exceeded`. Ensure candidates are strictly positive.
- **Duplicate Output Permutations:** Failing to use `startIndex` causes permutations (`[2, 3]` and `[3, 2]`) to be evaluated as distinct combinations, exploding runtime.
- **Mutable Reference Capture:** Writing `result.push(path)` instead of `result.push([...path])` results in an array filled with empty buffers after all recursion steps complete.

---

## 5. Summary Cheat Sheet

- **Backtracking** is depth-first search on a decision tree that builds candidates step-by-step and undoes choices when constraints are violated.
- **Choose, Explore, Unchoose:** Push candidate to buffer, recurse, pop candidate from buffer.
- **Pruning** aborts exploration early when constraints guarantee that no valid solutions exist down a branch.
- **Snapshotting:** Always save a copy (`[...path]`), never the mutable buffer reference.
- **Monotonic Indexing:** Use `startIndex` when combinations are needed to prevent generating identical permutations.

---

## 6. Practice Problems

### 6.1 Binary Watch

- **Input:** `turnedOn = 1`
- **Output:** `["0:01", "0:02", "0:04", "0:08", "0:16", "0:32", "1:00", "2:00", "4:00", "8:00"]`
- **Constraint:** Hours range from 0 to 11; minutes range from 0 to 59.
- **Hint 1:** The watch has 10 LEDs total: 4 for hours (1, 2, 4, 8) and 6 for minutes (1, 2, 4, 8, 16, 32).
- **Hint 2:** Generate all combinations of turning on `turnedOn` LEDs using backtracking, or iterate through all 12 hours and 60 minutes and count set bits.

### 6.2 Palindrome Partitioning

- **Input:** `s = "aab"`
- **Output:** `[["a", "a", "b"], ["aa", "b"]]`
- **Constraint:** $1 \le s.length \le 16$.
- **Hint 1:** Use `startIndex` to evaluate candidate substrings `s.slice(startIndex, i + 1)`.
- **Hint 2:** Only recurse down the branch if the candidate substring is a valid palindrome.
- **Hint 3:** Base case is reached when `startIndex === s.length`.

### 6.3 Combination Sum II

- **Input:** `candidates = [10, 1, 2, 7, 6, 1, 5]`, `target = 8`
- **Output:** `[[1, 1, 6], [1, 2, 5], [1, 7], [2, 6]]`
- **Constraint:** Each number in `candidates` may only be used **once**. Solution set must contain no duplicate combinations.
- **Hint 1:** Sort `candidates` ascending upfront.
- **Hint 2:** In the loop, skip identical elements at the same level: `if (i > startIndex && candidates[i] === candidates[i - 1]) continue;`.
- **Hint 3:** Recurse with `i + 1` to ensure each item is used at most once.

---

<nav aria-label="Lecture navigation">

[Previous: Merge Sort & Quick Sort](day-19-merge-sort-and-quick-sort.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Subsets, Permutations & Combinations](day-21-subsets-permutations-and-combinations.md)

</nav>
