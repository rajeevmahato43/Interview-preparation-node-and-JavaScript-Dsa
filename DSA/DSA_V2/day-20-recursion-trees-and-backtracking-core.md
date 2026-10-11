# Day 20: Recursion Trees & Backtracking

<nav aria-label="Lecture navigation">

[Previous: Merge Sort & Quick Sort](day-19-merge-sort-and-quick-sort.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Subsets, Permutations & Combinations](day-21-subsets-permutations-and-combinations.md)

</nav>

## Prerequisites

- [Day 18: Recursion & Call Stack](day-18-recursion-fundamentals-and-call-stack.md) — Base cases and recursive unwinding.
- Basic array manipulation (`push`, `pop`).

---

## 1. What is Backtracking?

**Backtracking** is an algorithmic technique for finding solutions by exploring all possible choices step-by-step.
If a choice leads to a dead end, you **backtrack** (undo your last move) and try another choice!

Think of walking through a maze:
1. Walk forward down path A until you hit a wall (dead end).
2. Walk backwards to the fork in the road (**undo move**).
3. Try path B!

```text
Decision Tree for choices [0, 1] of length 2:
                  (Start: [])
                 /           \
           Choose 0        Choose 1
             [0]             [1]
            /   \           /   \
          [0,0] [0,1]     [1,0] [1,1]
```

---

## 2. The 3-Step Backtracking Template

Almost every backtracking problem follows this single 3-step rhythm:
1. **Choose**: Add choice to the current path (`path.push(choice)`).
2. **Explore**: Recurse deeper to make the next choice.
3. **Unchoose (Backtrack)**: Remove the choice (`path.pop()`) so other branches start with clean state!

```javascript
// Generic Backtracking Boilerplate
function backtrack(state, path, result) {
  // 1. Goal check
  if (isComplete(path)) {
    result.push([...path]); // Must save a COPY!
    return;
  }

  // 2. Loop over available choices
  for (const choice of getChoices(state)) {
    if (isValid(choice, path)) {
      path.push(choice);          // CHOOSE
      backtrack(nextState, path, result); // EXPLORE
      path.pop();                 // UNCHOOSE (BACKTRACK)
    }
  }
}
```

---

## 3. Problem: Generate Parentheses

Given `n` pairs of parentheses, write a function to generate all combinations of well-formed parentheses.

### The Decision Rules:
- We can add an **open bracket `'('`** if `openCount < n`.
- We can add a **close bracket `')'`** if `closeCount < openCount`.
- Goal reached when string length is $2n$.

```javascript
// Node.js code: Generate Parentheses
function generateParenthesis(n) {
  const result = [];

  function dfs(currentStr, openCount, closeCount) {
    // Goal reached
    if (currentStr.length === 2 * n) {
      result.push(currentStr);
      return;
    }

    // Choice 1: Add '('
    if (openCount < n) {
      dfs(currentStr + "(", openCount + 1, closeCount);
    }

    // Choice 2: Add ')'
    if (closeCount < openCount) {
      dfs(currentStr + ")", openCount, closeCount + 1);
    }
  }

  dfs("", 0, 0);
  return result;
}

console.log(generateParenthesis(3));
// Output: [ "((()))", "(()())", "(())()", "()(())", "()()()" ]
console.log(generateParenthesis(1));
// Output: [ "()" ]
```
- **Time Complexity:** $O(\frac{4^n}{\sqrt{n}})$ (Catalan number growth).
- **Extra Space:** $O(n)$ recursion call stack depth.

---

## 4. Tricky Points and Common Traps

1. **Forgetting to copy the path:**
   ```javascript
   // ❌ WRONG: Pushes the SAME array reference!
   result.push(path); // Becomes empty when backtrack finishes!

   // ✅ CORRECT: Save a shallow copy!
   result.push([...path]);
   ```
2. **Forgetting to undo state:** If you modify an array or Set during the forward step, you **must undo it** after the recursive call finishes.
3. **Constraint limits:** Backtracking is exponential ($O(2^n)$ or $O(n!)$). It is mathematically designed for small inputs ($n \le 20$). If $n = 100,000$, backtracking is the wrong approach!

---

## 5. Hands-On Exercises

Run this script in Node.js to verify parenthesis generation:

```javascript
// Node.js code
const assert = require("node:assert");

function testParens(n) {
  const res = [];
  function go(str, o, c) {
    if (str.length === 2 * n) { res.push(str); return; }
    if (o < n) go(str + "(", o + 1, c);
    if (c < o) go(str + ")", o, c + 1);
  }
  go("", 0, 0);
  return res;
}

assert.equal(testParens(1).length, 1);
assert.equal(testParens(2).length, 2); // (()), ()()
assert.equal(testParens(3).length, 5);

console.log("✅ Backtracking assertions passed!");
```

---

## 6. Summary

- **Backtracking** systematically explores all combinations using recursion.
- **The Core Loop**: **Choose** $\to$ **Explore** $\to$ **Unchoose (`pop()`)**.
- **Always copy arrays** (`[...path]`) when saving a found answer to the result list.
- **Input scale:** Best suited for $n \le 20$ combinatorial problems.

---

## 7. Cheat Sheet

| Step | Action |
| :--- | :--- |
| **1. Base Case** | `if (path.length === target) { res.push([...path]); return; }` |
| **2. Choose** | `path.push(candidate);` |
| **3. Recurse** | `backtrack(nextIndex);` |
| **4. Unchoose** | `path.pop();` |

---

## 8. Interview Q&A

### 45-Second Explanation
> *"Backtracking is an exhaustive search strategy that explores a decision tree recursively. At each step, we make a choice, recurse down to explore further decisions, and upon hitting a base case or dead end, we undo the choice by popping from the path. This state restoration allows subsequent branches to start cleanly with zero state pollution. For Generate Parentheses, we only add opening brackets when available, and only add closing brackets when they match an existing open bracket."*

---

## 9. Practice Problems

### 1. Generate Parentheses - Medium
Given `n` pairs of parentheses, write a function to generate all combinations of well-formed parentheses.
- **Input:** `n = 3`
- **Expected Output:** `["((()))","(()())","(())()","()(())","()()()"]`
- **Input:** `n = 1`
- **Expected Output:** `["()"]`

### 2. Letter Combinations of a Phone Number - Medium
Given a string containing digits from `2-9` inclusive, return all possible letter combinations that the number could represent. Return the answer in any order. A mapping of digits to letters is just like on the telephone buttons.
- **Input:** `digits = "23"`
- **Expected Output:** `["ad","ae","af","bd","be","bf","cd","ce","cf"]`
- **Input:** `digits = ""`
- **Expected Output:** `[]`
- **Input:** `digits = "2"`
- **Expected Output:** `["a","b","c"]`

### 3. Combinations - Medium
Given two integers `n` and `k`, return all possible combinations of `k` numbers chosen from the range `[1, n]`. You may return the answer in any order.
- **Input:** `n = 4, k = 2`
- **Expected Output:** `[[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]`
- **Input:** `n = 1, k = 1`
- **Expected Output:** `[[1]]`

---

<nav aria-label="Lecture navigation">

[Previous: Merge Sort & Quick Sort](day-19-merge-sort-and-quick-sort.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Subsets, Permutations & Combinations](day-21-subsets-permutations-and-combinations.md)

</nav>
