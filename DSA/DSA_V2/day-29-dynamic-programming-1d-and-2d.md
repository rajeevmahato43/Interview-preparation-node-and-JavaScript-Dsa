# Day 29: Dynamic Programming: 1D & 2D

<nav aria-label="Lecture navigation">

[Previous: Binary Heaps & Priority Queues](day-28-binary-heaps-and-priority-queues.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Advanced Systems DSA & Capstone](day-30-advanced-patterns-nodejs-dsa-and-interview-capstone.md)

</nav>

---

## 1. Dynamic Programming Fundamentals

**Dynamic Programming (DP)** is a smart way to solve big problems without doing the same math twice. You break a problem into smaller pieces, solve each small piece once, and write down the answer in a table (or cache). Whenever you need that answer again, you just look it up.

DP turns slow brute-force algorithms that take $O(2^n)$ or $O(n!)$ time into lightning-fast code that runs in $O(n)$ or $O(n^2)$ time:

- **Dynamic Programming:** Remembering past answers so you never have to solve the same math twice.
- **Overlapping Subproblems:** When the same small problems keep showing up over and over again.
- **Optimal Substructure:** When the best answer to the big problem is made from the best answers to smaller pieces.

Imagine writing this on a blackboard: `1 + 1 + 1 + 1 + 1`.
You count them: 5.
Now someone writes another `+ 1` at the end: `1 + 1 + 1 + 1 + 1 + 1`.
What is the new total?
You say 6 right away!
You did not recount the first five numbers from scratch. You remembered that the old total was 5, and simply added 1 ($5 + 1 = 6$).
Dynamic Programming is just like that: **remembering past answers to solve future steps without repeating work.**

```javascript
// Baseline demonstration: Climbing Stairs using space-optimized bottom-up DP
function climbStairs(n) {
  if (n <= 2) return n;

  let prev2 = 1; // ways to reach step 1
  let prev1 = 2; // ways to reach step 2

  for (let i = 3; i <= n; i++) {
    const current = prev1 + prev2;
    prev2 = prev1;
    prev1 = current;
  }

  return prev1;
}

console.log("Ways to climb 5 stairs:", climbStairs(5));
// Output: 8
```

### 1.1 Top-Down Memoization vs Bottom-Up Tabulation

Dynamic Programming is implemented in two ways:

- **Top-Down Memoization:** Start at the target $N$ and recurse downward. Before computing, check if the state exists in a cache (hash map or array). If so, return it; otherwise, compute and store the result.
- **Bottom-Up Tabulation:** Start at the base cases ($0, 1$) and iterate upward toward the target using loops. Stores state in a table.

```text
=============================================================================
                TOP-DOWN MEMOIZATION vs. BOTTOM-UP TABULATION
=============================================================================
DIMENSION           TOP-DOWN (Memoization)          BOTTOM-UP (Tabulation)
-----------------------------------------------------------------------------
Approach            Starts at target N, recurses    Starts at base cases (0, 1),
                    downward, caching return values iterates upward via for-loop
Call Stack Depth    O(N) (Risk of V8 Stack Overflow)O(1) (Zero call stack memory)
Execution Pattern   Lazy (only visits needed states)Eager (computes entire table)
Space Optimization  Difficult to compress memory    Easy to compress to O(1)
Production Best     Prototyping                     Production-Grade Code
=============================================================================
```

> [!NOTE]
> Self-Check: Why is bottom-up tabulation preferred in Node.js backends?
> Answer: Recursive functions eat up call stack memory. For $N = 15,000$, top-down recursion crashes with `RangeError: Maximum call stack size exceeded`. Bottom-up tabulation uses a simple `for` loop with zero call stack overhead.

### 1.2 The 0/1 Knapsack Decision Pattern

The 0/1 Knapsack pattern forms the basis for many subset-sum and partition problems. Given $N$ items with weights and values, and a bag of capacity $W$, every item presents a binary choice:
1. **Exclude item:** The optimal value remains `dp[i - 1][w]`.
2. **Include item:** Add item's value, remaining capacity becomes `w - weight` $\implies \text{val} + dp[i - 1][w - \text{weight}]$.

```text
Recurrence:
dp[i][w] = max(
  dp[i - 1][w],                         // Choice 1: Skip item
  value[i] + dp[i - 1][w - weight[i]]   // Choice 2: Include item (if w >= weight[i])
)
```

When optimizing 0/1 Knapsack space from a 2D table to a 1D array, you must iterate backwards from $W$ down to `weight` to prevent using the same item multiple times.

### 1.3 Operations Reference Table

| Pattern Archetype | State Representation | Recurrence Template | Typical Time | Typical Space |
| :--- | :--- | :--- | :--- | :--- |
| **1D Min/Max Optimization** | `dp[i]` | `min(dp[i], cost + dp[i - choice])` | $O(N \cdot C)$ | $O(N) \to O(1)$ |
| **1D Counting** | `dp[i]` | `dp[i - 1] + dp[i - 2]` | $O(N)$ | $O(1)$ compressed |
| **2D String Alignment** | `dp[i][j]` | `match ? 1 + diag : max(top, left)`| $O(M \cdot N)$ | $O(N)$ row-rolled |
| **0/1 Knapsack** | `dp[w]` (reverse) | `max(dp[w], val + dp[w - weight])` | $O(N \cdot W)$ | $O(W)$ |

---

## 2. Dynamic Programming Patterns

### 2.1 Pattern Family

DP problems divide into three main structural families:

- **1D Optimization & Counting:** A single linear state `dp[i]` represents optimal cost or number of ways to reach target $i$ (e.g., Coin Change, House Robber, Climbing Stairs).
- **2D Grid & String Alignment:** A two-dimensional state `dp[i][j]` represents relationships between two strings or coordinates in a matrix (e.g., Longest Common Subsequence, Edit Distance, Unique Paths).
- **0/1 Subset Decisions:** Deciding whether to include or exclude items with bounded capacities (e.g., Partition Equal Subset Sum, Target Sum).

### 2.2 Pattern Recognition Table

| Problem Keyword Signal | Underlying Problem Need | Recommended Approach |
| :--- | :--- | :--- |
| "Fewest coins to make amount / minimum cost" | Overlapping choices with min objective | 1D Min Optimization DP (`dp[i] = min(...)`) |
| "Count total number of distinct ways to target" | Summing independent paths | 1D Counting DP (`dp[i] = sum(...)`) |
| "Longest common subsequence / edit distance" | Aligning prefixes of two strings | 2D Grid DP with row rolling |
| "Partition array into two equal subsets" | Subset sum to half of total sum | 0/1 Knapsack with reverse 1D iteration |
| "Maximum profit without robbing adjacent houses" | Decision dependent on non-adjacent step | 1D DP with rolling variables |

### 2.3 When to Use vs When NOT to Use

- **Use Dynamic Programming when:**
  - The problem asks for an optimal value (min, max) or total count of combinations.
  - The problem exhibits overlapping subproblems and optimal substructure.
  - Decision choices depend on solutions to previous smaller states.
- **When NOT to use Dynamic Programming:**
  - The problem asks to output **all** possible combinations or paths. Use Backtracking instead.
  - Subproblems do not overlap (e.g. Merge Sort). Use Divide and Conquer instead.
  - A local greedy choice always yields the globally optimal result (e.g. fractional knapsack). Use a Greedy algorithm instead.

### 2.4 The 10^7 Operations Rule

Brute force recursion for Fibonacci or Coin Change generates $O(2^N)$ calls. For $N = 50$, $2^{50} \approx 10^{15}$ operations, which would take weeks to run. Dynamic Programming collapses this to $N$ iterations, completing $50$ operations in under a microsecond. In 2D DP ($M \times N$), if $M, N \le 1,000$, total operations are $1,000,000$, executing in under 15 milliseconds.

---

## 3. Problem Walkthroughs

### 3.1 Coin Change

#### 3.1.1 Problem Statement
You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money. Return the fewest number of coins needed to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`. You may assume an infinite number of each kind of coin.

- **Input:** `coins = [1, 2, 5]`, `amount = 11`
- **Output:** `3` (coins: $5 + 5 + 1$)
- **Constraints:** $1 \le coins.length \le 12$, $1 \le coins[i] \le 2^{31} - 1$, $0 \le amount \le 10^4$.

#### 3.1.2 How to Think About It
Imagine making change for 11 dollars:
- If the last coin you hand over is a 5-dollar coin, you only need to know the fewest coins to make $11 - 5 = 6$ dollars, plus that 1 coin.
- If the last coin is a 2-dollar coin, you only need to know the fewest coins to make $11 - 2 = 9$ dollars, plus that 1 coin.
You check all your coins and pick whichever option needs fewer total coins!

#### 3.1.3 Brute Force Approach & Bottleneck
Recursively try every coin for the current amount:

```javascript
function coinChangeNaive(coins, amount) {
  if (amount === 0) return 0;
  if (amount < 0) return -1;
  let minCoins = Infinity;
  for (const coin of coins) {
    const res = coinChangeNaive(coins, amount - coin);
    if (res >= 0 && res < minCoins) minCoins = res + 1;
  }
  return minCoins === Infinity ? -1 : minCoins;
}
```

The branching factor is $C = coins.length$, creating an $O(C^A)$ recursion tree. For amount 100 with 3 coins, this evaluates $\approx 3^{100}$ operations, repeating identical amounts millions of times.

#### 3.1.4 The Pattern Insight
Use **1D Bottom-Up Tabulation**:
1. State: `dp[i]` = minimum coins to make amount `i`.
2. Base Case: `dp[0] = 0`. Fill `dp[1...amount]` with `Infinity`.
3. Recurrence: For amount `i` from 1 to `amount`, for each `coin` in `coins`:
   $$\text{If } i - \text{coin} \ge 0: \quad dp[i] = \min(dp[i], 1 + dp[i - \text{coin}])$$
4. Result: `dp[amount] === Infinity ? -1 : dp[amount]`.

#### 3.1.5 Pseudocode
```text
function coinChange(coins, amount):
    dp = array of size amount + 1 filled with Infinity
    dp[0] = 0

    for i from 1 to amount:
        for coin in coins:
            if i - coin >= 0 and dp[i - coin] != Infinity:
                dp[i] = min(dp[i], 1 + dp[i - coin])

    return dp[amount] if dp[amount] != Infinity else -1
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal 1D Bottom-Up Tabulation
function coinChange(coins, amount) {
  if (amount === 0) return 0;

  // dp[i] represents minimum coins to form amount i
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0; // 0 coins needed for amount 0

  for (let i = 1; i <= amount; i++) {
    for (let j = 0; j < coins.length; j++) {
      const coin = coins[j];

      if (i - coin >= 0) {
        dp[i] = Math.min(dp[i], 1 + dp[i - coin]);
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}

console.log("Min coins for 11 with [1, 2, 5]:", coinChange([1, 2, 5], 11)); // Output: 3
console.log("Min coins for 3 with [2]:", coinChange([2], 3));               // Output: -1
console.log("Min coins for 0 with [1]:", coinChange([1], 0));               // Output: 0
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Initializing with Number.MAX_SAFE_INTEGER
const dp = new Array(amount + 1).fill(Number.MAX_SAFE_INTEGER);
// 1 + dp[i - coin] overflows safe integer precision and creates negative wrap bugs!
```

Always use `Infinity` or `amount + 1` as the sentinel unreachable value to avoid arithmetic overflow.

#### 3.1.8 Complexity Derivation
- **Time Complexity:** $O(A \cdot C)$, where $A = amount$ and $C = coins.length$. For amount 10,000 and 3 coins, total operations are 30,000 (under 2 milliseconds).
- **Auxiliary Space Complexity:** $O(A)$ for the `dp` array.

---

### 3.2 Longest Common Subsequence

#### 3.2.1 Problem Statement
Given two strings `text1` and `text2`, return the length of their longest common subsequence. If there is no common subsequence, return `0`. A subsequence is a string derived by deleting some or no characters from the original string without changing the relative order of the remaining characters.

- **Input:** `text1 = "abcde"`, `text2 = "ace"`
- **Output:** `3` (Subsequence: `"ace"`)
- **Constraints:** $1 \le text1.length, text2.length \le 1,000$, strings consist of lowercase English letters.

#### 3.2.2 How to Think About It
Imagine two conveyor belts carrying letter blocks:
- If the letters match, take that letter, add +1 to your count, and move both belts forward.
- If the letters are different, you can either drop the letter from belt 1 or drop the letter from belt 2. You choose whichever choice gives you more matching letters downstream.

#### 3.2.3 Brute Force Approach & Bottleneck
Generating all $2^M$ subsequences of `text1` and $2^N$ subsequences of `text2`:
$O(2^M \cdot 2^N)$ exponential complexity is completely intractable for strings longer than 20 characters.

#### 3.2.4 The Pattern Insight
Use **2D Grid Alignment DP**:
- `dp[i][j]` = LCS length between prefix `text1[0...i-1]` and prefix `text2[0...j-1]`.
- If `text1[i - 1] === text2[j - 1]`:
  $$dp[i][j] = 1 + dp[i - 1][j - 1]$$
- If `text1[i - 1] !== text2[j - 1]`:
  $$dp[i][j] = \max(dp[i - 1][j], dp[i][j - 1])$$
Because `dp[i][j]` only reads from the current row and the row directly above it (`i - 1`), space can be compressed from $O(M \cdot N)$ to $O(N)$ using two rolling rows.

#### 3.2.5 Pseudocode
```text
function longestCommonSubsequence(text1, text2):
    m = text1.length, n = text2.length
    dp = 2D array of size (m + 1) x (n + 1) filled with 0

    for i from 1 to m:
        for j from 1 to n:
            if text1[i - 1] == text2[j - 1]:
                dp[i][j] = 1 + dp[i - 1][j - 1]
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])

    return dp[m][n]
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal 2D Longest Common Subsequence with Row Compression
function longestCommonSubsequence(text1, text2) {
  // Ensure text2 is the shorter string to minimize auxiliary array memory
  if (text1.length < text2.length) {
    return longestCommonSubsequence(text2, text1);
  }

  const m = text1.length;
  const n = text2.length;

  let prev = new Int32Array(n + 1);
  let curr = new Int32Array(n + 1);

  for (let i = 1; i <= m; i++) {
    const char1 = text1[i - 1];

    for (let j = 1; j <= n; j++) {
      if (char1 === text2[j - 1]) {
        curr[j] = 1 + prev[j - 1];
      } else {
        curr[j] = Math.max(prev[j], curr[j - 1]);
      }
    }

    prev.set(curr);
  }

  return prev[n];
}

console.log("LCS of 'abcde' and 'ace':", longestCommonSubsequence("abcde", "ace")); // Output: 3
console.log("LCS of 'abc' and 'abc':", longestCommonSubsequence("abc", "abc"));     // Output: 3
console.log("LCS of 'abc' and 'def':", longestCommonSubsequence("abc", "def"));     // Output: 0
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Full 2D array allocation on large strings
const dp = Array.from({ length: m + 1 }, () => new Array(n + 1));
// For m = 5,000 and n = 5,000, allocates 25 million heap cells!
// Use row compression to reduce memory to O(N).
```

Allocating large 2D arrays creates thousands of intermediate row objects. Use two 1D TypedArrays to keep memory bounded.

#### 3.2.8 Complexity Derivation
- **Time Complexity:** $O(M \cdot N)$, where $M = text1.length$ and $N = text2.length$. Every cell in the grid is evaluated once in $O(1)$ time.
- **Auxiliary Space Complexity:** $O(\min(M, N))$ auxiliary space due to rolling row optimization.

---

### 3.3 House Robber

#### 3.3.1 Problem Statement
You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. Adjacent houses have security systems connected: it will automatically contact the police if two adjacent houses are broken into on the same night. Given an integer array `nums` representing the amount of money of each house, return the maximum amount of money you can rob tonight without alerting the police.

- **Input:** `nums = [2, 7, 9, 3, 1]`
- **Output:** `12` (Rob house 1 ($2$), house 3 ($9$), and house 5 ($1$): $2 + 9 + 1 = 12$)
- **Constraints:** $1 \le nums.length \le 100$, $0 \le nums[i] \le 400$.

#### 3.3.2 How to Think About It
At each house, you have two simple choices:
1. **Rob this house:** You take its cash `nums[i]`, but you cannot touch the house right next to it (`i - 1`). You add this cash to the best loot you made up to house `i - 2`.
2. **Skip this house:** Your loot is the best loot you made up to house `i - 1`.
You pick whichever gives you more cash!

#### 3.3.3 Brute Force Approach & Bottleneck
Explore rob/skip branches recursively:
Branching $O(2^N)$ re-evaluates the same house indices across multiple branches, wasting computations.

#### 3.3.4 The Pattern Insight
Use **1D DP with State Compression**:
- Recurrence:
  $$dp[i] = \max(dp[i - 1], nums[i] + dp[i - 2])$$
- Notice that computing $dp[i]$ only requires the results from the previous two houses ($i - 1$ and $i - 2$). We do not need an array. We can maintain two rolling variables: `prev1` and `prev2`, achieving $O(1)$ auxiliary space.

#### 3.3.5 Pseudocode
```text
function rob(nums):
    if nums is empty: return 0
    prev2 = 0
    prev1 = 0

    for num in nums:
        curr = max(prev1, num + prev2)
        prev2 = prev1
        prev1 = curr

    return prev1
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(N) Time and O(1) Space House Robber
function rob(nums) {
  if (!nums || nums.length === 0) return 0;
  if (nums.length === 1) return nums[0];

  let prev2 = 0; // Represents loot up to i - 2
  let prev1 = 0; // Represents loot up to i - 1

  for (let i = 0; i < nums.length; i++) {
    const current = Math.max(prev1, nums[i] + prev2);
    prev2 = prev1;
    prev1 = current;
  }

  return prev1;
}

console.log("Max Loot [1, 2, 3, 1]:", rob([1, 2, 3, 1]));       // Output: 4
console.log("Max Loot [2, 7, 9, 3, 1]:", rob([2, 7, 9, 3, 1])); // Output: 12
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Allocating a full array for two-variable recurrence
const dp = new Array(nums.length);
dp[0] = nums[0];
dp[1] = Math.max(nums[0], nums[1]);
// Allocating an O(N) array when only two scalar variables are needed.
```

When a recurrence relation only references $i - 1$ and $i - 2$, allocating an array of size $N$ is unnecessary memory churn. Compress to two scalar variables.

#### 3.3.8 Complexity Derivation
- **Time Complexity:** $O(N)$. A single linear pass through the array.
- **Auxiliary Space Complexity:** $O(1)$ strictly. Only two numeric variables (`prev1`, `prev2`) are maintained.

---

## 4. Tricky Edge Cases

- **DP Table Sizing Rule:** When target is $N$, the array must be allocated to $N + 1$. Allocating `new Array(N)` leaves index $N$ out of bounds, producing `NaN`.
- **0/1 Knapsack Reverse Iteration:** In 0/1 problems where each item can only be picked once, 1D space-optimized loops must iterate backwards. Forward iteration allows the same item to be reused multiple times.
- **Unreachable Target Sentinel:** In minimization problems (like Coin Change), check if the target remains `Infinity` and return `-1`.
- **Floating-Point Currencies:** In Node.js, `dp[10.99]` converts to a string object key. Always multiply currency values by 100 to convert to integer cents before indexing into DP tables.

---

## 5. Summary Cheat Sheet

- **Dynamic Programming** caches subproblem solutions to prevent exponential recomputation.
- **Bottom-Up Tabulation** prevents V8 call stack overflows and enables memory compression.
- **State Compression:** If a state only references the previous 1 or 2 steps, replace the array with scalar variables for $O(1)$ space.
- **2D Row Rolling:** If row $i$ only reads from row $i - 1$, compress the matrix to two 1D rows for $O(N)$ space.
- **0/1 vs Unbounded Directionality:** Unbounded knapsack iterates forwards; 0/1 knapsack iterates backwards.

---

## 6. Practice Problems

### 6.1 Unique Paths

- **Input:** `m = 3, n = 7` (Grid of size $3 \times 7$).
- **Output:** `28` (Number of possible unique paths from top-left to bottom-right moving only right and down).
- **Constraint:** $1 \le m, n \le 100$.
- **Hint 1:** Recurrence: `dp[r][c] = dp[r - 1][c] + dp[r][c - 1]`.
- **Hint 2:** Compress to a single 1D array of size $n$ initialized to 1.
- **Hint 3:** Loop through rows and update `dp[c] += dp[c - 1]`.

### 6.2 Edit Distance

- **Input:** `word1 = "horse"`, `word2 = "ros"`.
- **Output:** `3` (Minimum operations to convert word1 to word2 via insert, delete, or replace).
- **Constraint:** $0 \le word1.length, word2.length \le 500$.
- **Hint 1:** Build a 2D matrix of size $(M + 1) \times (N + 1)$.
- **Hint 2:** If characters match, take diagonal: `dp[i - 1][j - 1]`.
- **Hint 3:** If characters differ, take $1 + \min(\text{insert}, \text{delete}, \text{replace}) = 1 + \min(dp[i][j - 1], dp[i - 1][j], dp[i - 1][j - 1])$.

### 6.3 Partition Equal Subset Sum

- **Input:** `nums = [1, 5, 11, 5]`.
- **Output:** `true` (Can be partitioned into `[1, 5, 5]` and `[11]`).
- **Constraint:** $1 \le nums.length \le 200$.
- **Hint 1:** If total sum is odd, return `false`.
- **Hint 2:** Target is `sum / 2`.
- **Hint 3:** Use 0/1 Knapsack boolean array of size `target + 1`, iterating backwards from `target` down to `num`.

---

<nav aria-label="Lecture navigation">

[Previous: Binary Heaps & Priority Queues](day-28-binary-heaps-and-priority-queues.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Advanced Systems DSA & Capstone](day-30-advanced-patterns-nodejs-dsa-and-interview-capstone.md)

</nav>
