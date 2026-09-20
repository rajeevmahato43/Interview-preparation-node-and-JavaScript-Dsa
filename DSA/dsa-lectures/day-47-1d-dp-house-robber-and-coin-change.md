# Day 47: 1D Dynamic Programming: House Robber and Coin Change

## 1. Learning Outcomes
- Master the **Choice Pattern** in 1D DP: deciding whether to include or exclude an element.
- Solve **House Robber I** using the recurrence $dp[i] = \max(dp[i-1], dp[i-2] + \text{val})$ in $O(1)$ space.
- Solve **House Robber II** on circular arrays using problem decomposition into two linear sub-ranges.
- Master the **Unbounded Knapsack Pattern** in **Coin Change** (finding minimum coin combinations).
- Model currency transactions, discount optimizations, and resource allocation in Node.js financial backends.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 46 (Dynamic Programming: Memoization and Tabulation).
- **Navigation**:
  - [Previous: Day 46 - Dynamic Programming: Memoization and Tabulation](day-46-dynamic-programming-memo-and-tabulation.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 48 - 1D DP: Longest Increasing Subsequence](day-48-1d-dp-longest-increasing-subsequence.md)

---

## 3. Core Concepts & Mental Models
In 1D Dynamic Programming, at each index $i$ we evaluate a decision boundary.

```text
House Robber Decision Tree at House i:
                  House i ($nums[i])
                     /          \
            Option 1: ROB       Option 2: SKIP
            /                      \
Cannot rob house i-1             Can take best of house i-1
Profit: dp[i-2] + nums[i]        Profit: dp[i-1]

State Invariant:
dp[i] = Math.max(dp[i - 1], dp[i - 2] + nums[i])
```

### Coin Change Mental Model (Bottom-Up Unbounded)
To form amount $A$, consider every available coin $C$:
$$\text{If we pick coin } C, \text{ the subproblem becomes } A - C.$$
The minimum coins for amount $A$ is:
$$dp[A] = \min_{C \in \text{coins}} (1 + dp[A - C])$$

---

## 4. Detailed Technical Explanations

### 4.1 House Robber II: Handling the Circular Constraint
In House Robber II, the first house and last house are neighbors; robbing both triggers the alarm.
- **Decomposition Principle**: We break the circular array into two independent linear subproblems:
  1. Range $[0 \dots N - 2]$: We include house 0 and explicitly exclude house $N - 1$.
  2. Range $[1 \dots N - 1]$: We include house $N - 1$ and explicitly exclude house 0.
- Overall answer: $\max(\text{robLinear}(0, N - 2), \text{robLinear}(1, N - 1))$.

### 4.2 Coin Change Invariants & Sentinel Values
- Initialize an array `dp` of size `amount + 1` filled with $\infty$ (`Infinity` or `amount + 1`).
- Base case: `dp[0] = 0` (0 coins needed to make amount 0).
- If after running all coins `dp[amount] === Infinity`, the amount is impossible to form; return `-1`.

### 4.3 Node.js Relevance: Dynamic Billing & Resource Quota Allocations
In billing and cloud billing engines written in Node.js (e.g., Stripe subscription credit calculations or AWS reserved instance packaging), finding the optimal breakdown of fixed credit coupons to cover an invoice with minimal remainder mirrors Coin Change. DP ensures optimal payment breakdowns in milliseconds.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 House Robber I (LeetCode 198) - O(1) Space
```javascript
/**
 * Calculates max loot without robbing adjacent houses.
 * Time Complexity: O(n)
 * Space Complexity: O(1)
 */
function rob(nums) {
  if (!nums || nums.length === 0) return 0;
  if (nums.length === 1) return nums[0];

  let prev2 = 0; // Represents dp[i - 2]
  let prev1 = 0; // Represents dp[i - 1]

  for (const num of nums) {
    const current = Math.max(prev1, prev2 + num);
    prev2 = prev1;
    prev1 = current;
  }

  return prev1;
}
```

### 5.2 House Robber II (Circular Array - LeetCode 213)
```javascript
/**
 * Solves circular House Robber.
 * Time Complexity: O(n)
 * Space Complexity: O(1)
 */
function robCircular(nums) {
  if (nums.length === 0) return 0;
  if (nums.length === 1) return nums[0];

  function robRange(start, end) {
    let prev2 = 0;
    let prev1 = 0;
    for (let i = start; i <= end; i++) {
      const current = Math.max(prev1, prev2 + nums[i]);
      prev2 = prev1;
      prev1 = current;
    }
    return prev1;
  }

  const n = nums.length;
  // Case 1: Rob from house 0 to n-2
  // Case 2: Rob from house 1 to n-1
  return Math.max(robRange(0, n - 2), robRange(1, n - 1));
}
```

### 5.3 Coin Change (LeetCode 322)
```javascript
/**
 * Finds fewest coins needed to make up amount.
 * Time Complexity: O(amount * numberOfCoins)
 * Space Complexity: O(amount)
 */
function coinChange(coins, amount) {
  // Fill with amount + 1 as effective infinity
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0; // Base case

  for (let a = 1; a <= amount; a++) {
    for (const coin of coins) {
      if (a - coin >= 0) {
        dp[a] = Math.min(dp[a], 1 + dp[a - coin]);
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}
```

### 5.4 Execution Trace: `coinChange([1, 2, 5], 11)`
```text
dp array of size 12. dp[0] = 0, all others = inf.
a = 1: min(inf, 1 + dp[0]) = 1
a = 2: coin 1 -> 1+dp[1]=2; coin 2 -> 1+dp[0]=1. dp[2] = 1
a = 3: coin 1 -> 1+dp[2]=2; coin 2 -> 1+dp[1]=2. dp[3] = 2
a = 4: coin 1 -> 1+dp[3]=3; coin 2 -> 1+dp[2]=2. dp[4] = 2
a = 5: coin 1 -> 3; coin 2 -> 3; coin 5 -> 1+dp[0]=1. dp[5] = 1
...
a = 10: coin 5 -> 1+dp[5]=2. dp[10] = 2
a = 11: coin 1 -> 1+dp[10]=3; coin 5 -> 1+dp[6]=3. dp[11] = 3 (Coins: 5 + 5 + 1)
Result: 3.
```

---

## 6. Common Mistakes & Anti-Patterns
- **Using Greedy for Coin Change**: Choosing the largest coin first (Greedy approach) fails on standard denominations. For `coins = [1, 3, 4]`, amount 6: Greedy takes $4 + 1 + 1$ (3 coins), but optimal DP takes $3 + 3$ (2 coins)!
- **Forgetting Single House in House Robber II**: If `nums = [1]`, slicing into `robRange(0, -1)` produces empty ranges and returns 0. Always guard `if (nums.length === 1) return nums[0]`.
- **Initializing Coin Change with 0**: If `dp` is initialized with 0, `Math.min(dp[a], 1 + dp[a - coin])` will always select 0, breaking the calculation. Use `Infinity`.

---

## 7. Tricky Points & Edge Cases
- **Amount = 0**: Always takes 0 coins; handled by `dp[0] = 0`.
- **Coin Greater Than Amount**: Handled by guard `if (a - coin >= 0)`.
- **Negative Numbers or Zero Denominations**: Standard coin change assumes positive coin values. Zero-value coins would create infinite combinations.

---

## 8. Practical Engineering Exercises
1. Implement **Coin Change II** (LeetCode 518) returning the total number of distinct combinations that make up the amount.
2. Implement **Delete and Earn** (LeetCode 740) by transforming the input array into a frequency-weighted House Robber problem.

---

## 9. Key Takeaways & Summary
- House Robber models inclusion/exclusion: $dp[i] = \max(dp[i-1], dp[i-2] + nums[i])$.
- Circular constraints are solved by running two linear DP passes on split ranges $[0, N-2]$ and $[1, N-1]$.
- Coin Change is an unbounded knapsack problem: $dp[a] = \min(dp[a], 1 + dp[a - coin])$.
- Greedy algorithms fail on arbitrary coin systems; DP guarantees global optimality.

---

## 10. Quick Reference Cheat Sheet
| Problem | Recurrence Relation | Space Complexity |
| :--- | :--- | :--- |
| **House Robber I** | $dp[i] = \max(dp[i-1], dp[i-2] + nums[i])$ | $O(1)$ |
| **House Robber II** | $\max(\text{rob}(0, n-2), \text{rob}(1, n-1))$ | $O(1)$ |
| **Coin Change** | $dp[a] = \min(dp[a], 1 + dp[a - c])$ | $O(\text{amount})$ |
| **Coin Change II** | $dp[a] += dp[a - c]$ (combination count) | $O(\text{amount})$ |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: Why does the greedy choice of always picking the largest coin fail to find the minimum number of coins in general coin systems?  
**Hint**: Provide a concrete counter-example.  
**Expected Answer Shape**: The greedy approach assumes that taking the locally largest coin leaves an optimal subproblem. In non-canonical coin systems, this is false. For example, with `coins = [1, 3, 4]` and target `6`: Greedy takes coin 4, leaving amount 2, which requires two 1-coins: total 3 coins (`4 + 1 + 1`). Dynamic Programming evaluates all choices and discovers that two 3-coins (`3 + 3`) yields 2 coins, proving Greedy is suboptimal.

### 2. Code-Writing
**Question**: Write `change(amount, coins)` (Coin Change II) to compute the number of combinations to make up `amount`.  
**Hint**: Loop coins in the outer loop to prevent counting permutations as distinct combinations.  
**Expected Answer Shape**: Initialize `dp = new Uint32Array(amount + 1)`. `dp[0] = 1`. Outer loop `for (const coin of coins)`, inner loop `for (let a = coin; a <= amount; a++)`: `dp[a] += dp[a - coin]`. Putting `coin` in the outer loop enforces non-decreasing coin order, counting combinations rather than permutations ($O(\text{amount} \cdot C)$ time, $O(\text{amount})$ space).

### 3. Debugging
**Question**: Identify why this House Robber code crashes on `nums = [0]`:  
```javascript
function rob(nums) {
  const dp = [nums[0], Math.max(nums[0], nums[1])];
  for (let i = 2; i < nums.length; i++) {
    dp[i] = Math.max(dp[i - 1], dp[i - 2] + nums[i]);
  }
  return dp[nums.length - 1];
}
```  
**Hint**: What is `nums[1]` when `nums.length === 1`?  
**Expected Answer Shape**: When `nums = [0]`, `nums[1]` is `undefined`. `Math.max(0, undefined)` produces `NaN`. Then `dp[1] = NaN`. For length 1, it returns `dp[0] = 0`, but for length 2 it corrupts with `NaN`. Check `if (nums.length <= 1) return nums[0] || 0;` at the very beginning, or use two scalar rolling variables initialized to 0.

### 4. System Design / Tradeoff
**Question**: When calculating optimal coupon combinations in an e-commerce checkout service in Node.js, what happens if the cart amount is $1,000,000 and coins represent cents?  
**Hint**: DP array size and memory overhead.  
**Expected Answer Shape**: An amount of 1,000,000 cents requires an array of size $10^6$, which takes ~8MB in V8 and executes in milliseconds—fully feasible. However, if amount is $10^9$ cents, allocating an array of size $10^9$ will crash Node.js with OOM. For huge amounts with small coin counts, use recursive branch-and-bound with memoization or integer linear programming (ILP) instead of full tabular DP.

### 5. Tricky / Edge Case
**Question**: In Coin Change, why do we fill the DP table with `amount + 1` instead of `Number.MAX_SAFE_INTEGER`?  
**Hint**: Arithmetic overflow when adding 1.  
**Expected Answer Shape**: If `dp[a - coin]` is initialized to `Number.MAX_SAFE_INTEGER`, then `1 + dp[a - coin]` equals `Number.MAX_SAFE_INTEGER + 1`, which loses precision in IEEE 754 floating point arithmetic. Using `amount + 1` is safe because the theoretical maximum number of coins needed can never exceed `amount` (even using 1-cent coins), making `amount + 1` an impossible sentinel that never overflows.

### 6. Real-World Node.js Context
**Question**: How would you implement a Node.js microservice endpoint that calculates the minimum number of cloud container instances needed to satisfy a CPU demand?  
**Hint**: Unbounded knapsack mapping with instance capacities.  
**Expected Answer Shape**: Map the problem to Coin Change where `amount` is total required CPU units and `coins` are container capacity sizes (e.g., `[2, 4, 8, 16]` vCPUs). Run 1D DP `dp[a] = min(dp[a], 1 + dp[a - cpu])`. Cache the DP table in Redis or module scope for common capacity thresholds to return instant instance recommendations without recomputing on every request.
