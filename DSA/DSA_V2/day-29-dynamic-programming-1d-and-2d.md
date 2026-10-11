# Day 29: Dynamic Programming: 1D & 2D

<nav aria-label="Lecture navigation">

[Previous: Binary Heaps & Priority Queues](day-28-binary-heaps-and-priority-queues.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Advanced Systems DSA & Capstone](day-30-advanced-patterns-nodejs-dsa-and-interview-capstone.md)

</nav>

## Prerequisites

- [Day 18: Recursion & Call Stack](day-18-recursion-fundamentals-and-call-stack.md) — Memoization caching.
- [Day 20: Recursion Trees & Backtracking](day-20-recursion-trees-and-backtracking-core.md) — Overlapping subproblems.

---

## 1. What is Dynamic Programming?

**Dynamic Programming (DP)** is an optimization technique that solves complex problems by breaking them into simpler subproblems, caching each subproblem's solution so you **never calculate the same thing twice**.

> **The 2 Requirements for DP**:
> 1. **Overlapping Subproblems**: The recursive tree computes the exact same values repeatedly.
> 2. **Optimal Substructure**: The optimal answer to the full problem can be built directly from the optimal answers to its smaller subproblems.

```text
Fibonacci Tree without DP:
                    fib(5)
                   /      \
               fib(4)     fib(3)  <-- Duplicate work!
               /    \     /    \
            fib(3) fib(2)fib(2) fib(1)
Naive: O(2^n) exponential time!
With DP: Store results in an array -> O(n) linear time!
```

---

## 2. Top-Down (Memoization) vs Bottom-Up (Tabulation)

| Approach | How it Works | Memory Risk |
| :--- | :--- | :--- |
| **Top-Down (Memoization)** | Starts at target $N$ and recurses down to base cases, caching results. | Risk of stack overflow on large $N$. |
| **Bottom-Up (Tabulation)** | Starts at base cases ($0, 1$) and iterates up to target $N$ using a `for` loop. | **Zero stack risk**; easy to compress space. |

---

## 3. Problem 1: Climbing Stairs ($O(1)$ Space)

You are climbing a staircase with $n$ steps. You can climb either 1 or 2 steps each time. How many distinct ways can you reach the top?

### The Recurrence:
$$\text{ways}(n) = \text{ways}(n - 1) + \text{ways}(n - 2)$$
Because each step only depends on the **previous two steps**, we don't need a full array! We can use two scalar variables to achieve **$O(1)$ space**:

```javascript
// Node.js code: Space-Optimized O(1)
function climbStairs(n) {
  if (n <= 2) return n;

  let prev2 = 1; // 1 step: 1 way
  let prev1 = 2; // 2 steps: 2 ways

  for (let i = 3; i <= n; i++) {
    const current = prev1 + prev2;
    prev2 = prev1;
    prev1 = current;
  }

  return prev1;
}

console.log(climbStairs(2)); // 2
console.log(climbStairs(3)); // 3
console.log(climbStairs(5)); // 8
```
- **Time Complexity:** $O(n)$
- **Extra Space:** **$O(1)$**

---

## 4. Problem 2: House Robber

Houses are lined up along a street. You cannot rob two adjacent houses on the same night. Return the maximum money you can rob.

### The Decision:
For each house $i$, make a binary choice:
1. **Rob house $i$:** Gain `nums[i]` plus maximum from house $i - 2$: `nums[i] + prev2`
2. **Skip house $i$:** Keep maximum from house $i - 1$: `prev1`
$$\text{maxMoney} = \max(\text{prev1}, \text{nums}[i] + \text{prev2})$$

```javascript
// Node.js code: House Robber O(1) Space
function rob(nums) {
  let prev2 = 0;
  let prev1 = 0;

  for (const money of nums) {
    const current = Math.max(prev1, money + prev2);
    prev2 = prev1;
    prev1 = current;
  }

  return prev1;
}

console.log(rob([1, 2, 3, 1])); // 4 (Rob house 1 and 3: 1 + 3 = 4)
console.log(rob([2, 7, 9, 3, 1])); // 12 (Rob house 1, 3, 5: 2 + 9 + 1 = 12)
```
- **Time Complexity:** $O(n)$
- **Extra Space:** $O(1)$

---

## 5. Problem 3: Coin Change (Fewest Coins)

Given an array of coin `coins` and total `amount`, return the fewest coins needed to make that amount. If impossible, return -1.

```javascript
// Node.js code: Bottom-Up Tabulation
function coinChange(coins, amount) {
  // dp[i] = minimum coins to make amount i
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0; // Base case: 0 coins for amount 0

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (i - coin >= 0) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}

console.log(coinChange([1, 2, 5], 11)); // 3 (5 + 5 + 1)
console.log(coinChange([2], 3));          // -1
```
- **Time Complexity:** $O(\text{amount} \times \text{coins.length})$
- **Extra Space:** $O(\text{amount})$

---

## 6. Problem 4: Unique Paths (2D Grid DP)

A robot starts at top-left `(0, 0)` of an $m \times n$ grid. It can only move Down or Right. How many unique paths reach the bottom-right corner?

$$\text{dp}[r][c] = \text{dp}[r - 1][c] + \text{dp}[r][c - 1]$$

```javascript
// Node.js code: 2D Grid DP
function uniquePaths(m, n) {
  // 1D rolling row optimization
  const row = new Array(n).fill(1); // Top row is all 1s

  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) {
      row[c] += row[c - 1]; // Current = top + left
    }
  }

  return row[n - 1];
}

console.log(uniquePaths(3, 7)); // 28
console.log(uniquePaths(3, 2)); // 3
```
- **Time Complexity:** $O(m \times n)$
- **Extra Space:** $O(n)$ row buffer.

---

## 7. Tricky Points and Common Traps

1. **State compression:** If a state formula only looks back $k$ steps (like $i - 1$ and $i - 2$), never allocate an $O(n)$ array. Use scalar variables for $O(1)$ space.
2. **Base case initialization:** In Coin Change, initialize `dp` with `Infinity` and `dp[0] = 0`. Forgetting `dp[0] = 0` produces wrong answers.

---

## 8. Hands-On Exercises

Run this script in Node.js to verify Climbing Stairs and House Robber:

```javascript
// Node.js code
const assert = require("node:assert");

function testClimb(n) {
  if (n <= 2) return n;
  let p2 = 1, p1 = 2;
  for (let i = 3; i <= n; i++) {
    const cur = p1 + p2;
    p2 = p1; p1 = cur;
  }
  return p1;
}

assert.equal(testClimb(2), 2);
assert.equal(testClimb(3), 3);
assert.equal(testClimb(4), 5);

console.log("✅ Dynamic programming assertions passed!");
```

---

## 9. Summary

- **Dynamic Programming** stores previously calculated subproblem results to avoid $O(2^n)$ exponential repeat work.
- **State compression**: Reduce $O(n)$ tables to $O(1)$ variables when only the last few states matter.
- **Bottom-up tabulation** uses loops and avoids recursive call stack limits.

---

## 10. Cheat Sheet

| Problem | DP Recurrence Formula | Space |
| :--- | :--- | :---: |
| **Climbing Stairs** | `dp[i] = dp[i-1] + dp[i-2]` | **$O(1)$** |
| **House Robber** | `dp[i] = max(dp[i-1], money + dp[i-2])` | **$O(1)$** |
| **Coin Change** | `dp[i] = min(dp[i], dp[i - coin] + 1)` | $O(\text{amount})$ |
| **Unique Paths** | `dp[r][c] = dp[r-1][c] + dp[r][c-1]` | $O(n)$ |

---

## 11. Interview Q&A

### 45-Second Explanation
> *"Dynamic Programming solves problems with overlapping subproblems and optimal substructure by caching subproblem results. In House Robber, at each house we make a binary decision: either rob the current house and add its value to the maximum profit from two houses ago, or skip it and keep the profit from the previous house. Because this only depends on the previous two states, we can compress the DP array into two variables, running in $O(n)$ time and strictly $O(1)$ auxiliary space."*

---

## 12. Practice Problems

### 1. Climbing Stairs - Easy
You are climbing a staircase. It takes `n` steps to reach the top. Each time you can either climb `1` or `2` steps. In how many distinct ways can you climb to the top?
- **Input:** `n = 2`
- **Expected Output:** `2`
- **Input:** `n = 3`
- **Expected Output:** `3`

### 2. House Robber - Medium
You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint stopping you from robbing each of them is that adjacent houses have security systems connected and it will automatically contact the police if two adjacent houses were broken into on the same night. Given an integer array `nums` representing the amount of money of each house, return the maximum amount of money you can rob tonight without alerting the police.
- **Input:** `nums = [1,2,3,1]`
- **Expected Output:** `4`
- **Input:** `nums = [2,7,9,3,1]`
- **Expected Output:** `12`

### 3. Coin Change - Medium
You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.
- **Input:** `coins = [1,2,5], amount = 11`
- **Expected Output:** `3`
- **Input:** `coins = [2], amount = 3`
- **Expected Output:** `-1`
- **Input:** `coins = [1], amount = 0`
- **Expected Output:** `0`

### 4. Unique Paths - Medium
There is a robot on an `m x n` grid. The robot is initially located at the top-left corner and tries to move to the bottom-right corner. The robot can only move either down or right at any point in time. Given the two integers `m` and `n`, return the number of possible unique paths that the robot can take to reach the bottom-right corner.
- **Input:** `m = 3, n = 7`
- **Expected Output:** `28`
- **Input:** `m = 3, n = 2`
- **Expected Output:** `3`

---

<nav aria-label="Lecture navigation">

[Previous: Binary Heaps & Priority Queues](day-28-binary-heaps-and-priority-queues.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Advanced Systems DSA & Capstone](day-30-advanced-patterns-nodejs-dsa-and-interview-capstone.md)

</nav>
