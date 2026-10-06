# Day 52: Greedy Traversal: Jump Game and Gas Station

<nav aria-label="Lecture navigation">
  <a href="day-51-greedy-interval-scheduling.md">◀ Day 51: Greedy: Interval Scheduling and Overlaps</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-53-trie-construction-and-prefix-search.md">Day 53: Trie Construction and Prefix Search ▶</a>
</nav>

---

## Learning Outcomes

- Master the **Greedy Frontier Reachability Pattern** to solve navigation problems without exponential branching.
- Solve **Jump Game I** in $O(n)$ time and $O(1)$ space using an evolving `maxReach` horizon.
- Solve **Jump Game II** (minimum jumps) in $O(n)$ time by modeling level-by-level BFS window boundaries.
- Prove the two fundamental circuit invariants of the **Gas Station** problem (Total Deficit Invariant and Sub-Route Elimination).
- Prevent quadratic $O(n^2)$ simulation pitfalls by converting circular traversals into single-pass linear scans.
- Apply greedy traversal principles to circuit breaker retry budgets and resource depletion monitors in Node.js microservices.

---

## Prerequisites

- [Day 11: Two Pointers: Opposite and Same Direction](day-11-two-pointers-opposite-and-same-direction.md) — Window scanning and boundary increments.
- [Day 51: Greedy: Interval Scheduling and Overlaps](day-51-greedy-interval-scheduling.md) — The Greedy Choice property and optimality preservation.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
| :--- | :--- | :--- |
| **Max Reach Frontier** | The farthest array index reachable from any previously visited index: $\max(i + \text{nums}[i])$. | If the current index exceeds `maxReach`, future progress is impossible. |
| **BFS Jump Window** | The contiguous segment of array indices reachable with the current number of jumps. | Advancing `currentEnd = farthest` represents taking another jump in $O(n)$ time. |
| **Total Deficit Invariant** | If total gas available is $\ge$ total gas consumed, a valid starting station is mathematically guaranteed to exist. | Allows a single linear pass to find the starting station without simulating full circular trips. |
| **Sub-Route Elimination** | If travelling from station $A$ runs out of fuel at station $B$, no station between $A$ and $B$ can be a valid starting point. | Eliminates quadratic $O(n^2)$ trial runs; resets search candidate directly to $B + 1$. |
| **Greedy Choice (Jumps)** | You don't need to choose the exact landing cell; you only need to observe the farthest point reachable from anywhere within your current window. | Avoids evaluating all combinatorial landing decisions. |

---

## Core Concepts & Mechanical Architecture

### 1. Jump Game I: The Reachability Frontier

In **Jump Game I** (LeetCode 55), given an array `nums` where each element represents the maximum jump length from that position, determine if you can reach the last index starting from index 0.

```text
Jump Game I Frontier Progression:
nums = [2, 3, 1, 1, 4]

Index 0 (val 2): maxReach = max(0, 0 + 2) = 2. Frontier covers indices [0..2]
Index 1 (val 3): 1 <= maxReach. maxReach = max(2, 1 + 3) = 4. Frontier covers [0..4]
                 maxReach >= target (4)! Return TRUE!

Counter-Example: nums = [3, 2, 1, 0, 4]
Index 0 (val 3): maxReach = 3. Frontier covers [0..3]
Index 1 (val 2): maxReach = max(3, 1 + 2) = 3
Index 2 (val 1): maxReach = max(3, 2 + 1) = 3
Index 3 (val 0): maxReach = max(3, 3 + 0) = 3
Index 4: i (4) > maxReach (3)! CANNOT PROCEED. Return FALSE!
```

```javascript
// Node.js code: Jump Game I Implementation
/**
 * @param {number[]} nums
 * @returns {boolean}
 */
function canJump(nums) {
  let maxReach = 0;
  const target = nums.length - 1;

  for (let i = 0; i <= target; i++) {
    // If current index is unreachable from all previous steps
    if (i > maxReach) {
      return false;
    }

    maxReach = Math.max(maxReach, i + nums[i]);

    // Early exit optimization
    if (maxReach >= target) {
      return true;
    }
  }

  return true;
}

console.log('Can jump [2,3,1,1,4]:', canJump([2, 3, 1, 1, 4])); // true
console.log('Can jump [3,2,1,0,4]:', canJump([3, 2, 1, 0, 4])); // false
```

---

### 2. Jump Game II: Minimum Jumps via BFS Windows

In **Jump Game II** (LeetCode 45), determine the **minimum number of jumps** needed to reach the last index.

```text
BFS Window Partitioning:
nums = [ 2 ,   3 ,   1 ,   1 ,   4 ]
Index:   0     1     2     3     4

Window 0 (Jump 0): [0..0] -> farthest reachable is 0 + 2 = 2.
At end of Window 0 (index 0):
  Jump 1 taken! Window 1 becomes [1..2].
  farthest reachable from Window 1: max(1 + 3, 2 + 1) = 4.
At end of Window 1 (index 2):
  Jump 2 taken! Window 2 becomes [3..4].
Target index 4 is reached in exactly 2 jumps!
```

**Mechanical Invariant**:
- Iterate `i` from $0$ up to $N - 2$ (no need to jump once we arrive at the last cell).
- Maintain `farthest = Math.max(farthest, i + nums[i])`.
- When `i === currentEnd`, increment `jumps++` and update `currentEnd = farthest`.

```javascript
// Node.js code: Jump Game II Implementation
/**
 * @param {number[]} nums
 * @returns {number}
 */
function jump(nums) {
  if (nums.length <= 1) return 0;

  let jumps = 0;
  let currentEnd = 0; // Boundary of current BFS level
  let farthest = 0;   // Farthest reachable index seen so far

  for (let i = 0; i < nums.length - 1; i++) {
    farthest = Math.max(farthest, i + nums[i]);

    // Reached boundary of current jump level
    if (i === currentEnd) {
      jumps++;
      currentEnd = farthest;

      if (currentEnd >= nums.length - 1) {
        break; // Reached or surpassed target
      }
    }
  }

  return jumps;
}

console.log('Min jumps for [2,3,1,1,4]:', jump([2, 3, 1, 1, 4])); // 2
```

---

### 3. The Gas Station Problem (LeetCode 134)

There are $n$ gas stations along a circular route. Station $i$ has `gas[i]` units of gas and costs `cost[i]` to travel to station $i + 1$. Return the starting gas station's index if you can travel around the circuit once clockwise; otherwise, return `-1`.

```text
Gas Station Circuit Trace:
gas  = [1, 2, 3, 4, 5]
cost = [3, 4, 5, 1, 2]
diff = [-2, -2, -2, +3, +3]

Total Gas:  15
Total Cost: 15
Total Net:  15 - 15 = 0 >= 0 (A solution is guaranteed to exist!)

Candidate Evaluation:
Start at 0: tank = -2 < 0. Failed at 0! Reset candidate to 1.
Start at 1: tank = -2 < 0. Failed at 1! Reset candidate to 2.
Start at 2: tank = -2 < 0. Failed at 2! Reset candidate to 3.
Start at 3: tank = +3 > 0. Valid!
Next 4:     tank = 3 + 3 = 6 > 0.
Final Answer: Station 3!
```

#### The Sub-Route Elimination Theorem:
If you start at station $A$ and run out of gas at station $B$, **no station $K$ between $A$ and $B$ can be a valid starting station**.
- *Proof*: When departing station $A$, you arrived at $K$ with tank $\ge 0$. Despite having this leftover gas bonus, you still failed to make it past $B$. If you started at $K$ with **zero initial gas**, your tank would be even lower, meaning you would run out of fuel at or before $B$. Therefore, all stations from $A$ to $B$ are eliminated. We jump our candidate directly to $B + 1$!

```javascript
// Node.js code: Gas Station Implementation
/**
 * @param {number[]} gas
 * @param {number[]} cost
 * @returns {number}
 */
function canCompleteCircuit(gas, cost) {
  let totalTank = 0;
  let currentTank = 0;
  let startingStation = 0;

  for (let i = 0; i < gas.length; i++) {
    const net = gas[i] - cost[i];
    totalTank += net;
    currentTank += net;

    // Cannot make it to station i + 1 from startingStation
    if (currentTank < 0) {
      startingStation = i + 1; // Eliminate all candidates up to i
      currentTank = 0;         // Reset tank for new candidate
    }
  }

  // If total gas available is less than total gas consumed, impossible
  return totalTank >= 0 ? startingStation : -1;
}

console.log(
  'Start station:',
  canCompleteCircuit([1, 2, 3, 4, 5], [3, 4, 5, 1, 2])
); // 3
```

---

## Detailed Node.js Relevance

### Circuit Breakers, Retry Windows, and Resource Exhaustion

In Node.js enterprise microservices interacting with third-party payment providers or external databases:

```text
API Retry Pipeline:
[Outgoing Request] ---> [Retry Budget Window] ---> [Third-Party Gateway]
Available Token Budget: [3 retries, 2 retries, 0 retries...]
```

1. **Retry Token Depletion**: Jump Game reachability models rate-limiting token horizons. When an API experiences transient errors, a client can execute retries only if its cumulative retry token budget (`maxReach`) extends beyond the expected latency degradation duration.
2. **Batch Pipeline Checkpointing**: The Gas Station sub-route elimination algorithm is used in distributed stream processing workers (e.g., Kafka batch processors). If an ETL transaction fails at batch step $B$, restarting from step $A$ or any intermediate step $K \in [A, B]$ is provably futile. The worker marks the partition failed, flushes offsets directly to $B + 1$, and initiates a fresh transaction pipeline.

---

## Tricky Points & Edge Cases

1. **Jump Game II Off-By-One Loop Boundary**:
   In Jump Game II, the loop must terminate at `nums.length - 2`:
   ```javascript
   for (let i = 0; i < nums.length - 1; i++)
   ```
   If you iterate all the way to `nums.length - 1`, arriving at the last element will trigger `i === currentEnd`, causing an erroneous additional `jumps++`!
2. **Gas Station Total Tank Check**:
   Never skip the `totalTank >= 0` check. Without it, the algorithm might return an index even if the overall gas is completely insufficient to make a full circuit.
3. **Single Element Arrays**:
   - `canJump([0])`: returns `true` (already at target).
   - `jump([0])`: returns `0` (0 jumps needed).
   - `canCompleteCircuit([2], [2])`: returns `0` (2 - 2 = 0, valid loop).

---

## Hands-On Exercise

### Scenario
You are developing a resilient API request dispatcher in Node.js. An HTTP request must route through a sequential pipeline of relay proxies. Each proxy $i$ has an integer energy metric `energy = [e_0, e_1, ..., e_{n-1}]` denoting how many hops forward it can boost a packet.
Implement `analyzeRelayPipeline(energy)`:
1. Returns `{ canReachDestination: boolean, minHops: number }`.
2. If unreachable, `canReachDestination` is `false` and `minHops` is `-1`.
3. Must run in $O(n)$ time and $O(1)$ space.

### Buggy Code
```javascript
function analyzeRelayPipeline(energy) {
  // BUG: Infinite loop when maxReach stalls; doesn't handle unreachable states
  let hops = 0;
  let curr = 0;
  while (curr < energy.length - 1) {
    curr += energy[curr]; // Naively jumps max distance instead of optimal BFS window!
    hops++;
  }
  return { canReachDestination: true, minHops: hops };
}
```

### Acceptance Criteria
- Verify whether the last proxy is reachable.
- Compute the exact minimum hop count using BFS level boundaries.
- Return `{ canReachDestination: false, minHops: -1 }` on zero-energy traps.
- Unit test coverage with `assert`.

### Solution Code
```javascript
const assert = require('assert');

// Node.js code: Production Relay Pipeline Reachability Auditor
/**
 * @param {number[]} energy
 * @returns {{ canReachDestination: boolean, minHops: number }}
 */
function analyzeRelayPipeline(energy) {
  if (!energy || energy.length === 0) {
    return { canReachDestination: false, minHops: -1 };
  }
  if (energy.length === 1) {
    return { canReachDestination: true, minHops: 0 };
  }

  const target = energy.length - 1;
  let maxReach = 0;
  let currentEnd = 0;
  let hops = 0;

  for (let i = 0; i < energy.length; i++) {
    // If current index is unreachable from all previous nodes
    if (i > maxReach) {
      return { canReachDestination: false, minHops: -1 };
    }

    maxReach = Math.max(maxReach, i + energy[i]);

    // Check if we need to advance hop window (only before reaching the end)
    if (i < target && i === currentEnd) {
      hops++;
      currentEnd = maxReach;
      if (currentEnd >= target) {
        return { canReachDestination: true, minHops: hops };
      }
    }
  }

  return {
    canReachDestination: maxReach >= target,
    minHops: maxReach >= target ? hops : -1
  };
}

// Verification & Automated Unit Tests
// Test 1: Standard reachable pipeline
const result1 = analyzeRelayPipeline([2, 3, 1, 1, 4]);
assert.deepStrictEqual(result1, { canReachDestination: true, minHops: 2 });

// Test 2: Unreachable trap (zero at index 3 blocks index 4)
const result2 = analyzeRelayPipeline([3, 2, 1, 0, 4]);
assert.deepStrictEqual(result2, { canReachDestination: false, minHops: -1 });

// Test 3: Single proxy
const result3 = analyzeRelayPipeline([0]);
assert.deepStrictEqual(result3, { canReachDestination: true, minHops: 0 });

// Test 4: Big leap in one hop
const result4 = analyzeRelayPipeline([10, 1, 1]);
assert.deepStrictEqual(result4, { canReachDestination: true, minHops: 1 });

console.log('✅ All analyzeRelayPipeline assertions passed successfully!');
```

### Solution Explanation
1. **Unreachable Trap Guard**: `if (i > maxReach)` identifies dead ends immediately, returning `{ canReachDestination: false, minHops: -1 }` in $O(1)$ from the trap point.
2. **Boundary Advancement**: Checking `i < target && i === currentEnd` prevents counting an extra hop after reaching the final proxy.
3. **Linearity**: The single `for` loop inspects each element at most once, using strictly $O(1)$ space.

---

## Summary

- **Jump Game I** tracks the advancing horizon `maxReach = Math.max(maxReach, i + nums[i])` in $O(n)$ time and $O(1)$ space.
- **Jump Game II** groups positions into BFS level windows; each window boundary marks an additional jump.
- **Gas Station** leverages the **Sub-Route Elimination Theorem**: if trip $A \to B$ fails, no station between $A$ and $B$ can start the route, allowing an $O(n)$ single-pass solution.
- The **Total Deficit Invariant** guarantees that if $\sum \text{gas} \ge \sum \text{cost}$, a valid starting station must exist.
- In Node.js backend systems, greedy reachability models retry token budgets and prevents cascading pipeline failures.

---

## Cheat Sheet & Common Pitfalls

| Problem | Key Metric | Loop Range | Termination Condition |
| :--- | :--- | :--- | :--- |
| **Jump Game I** | `maxReach` | $0 \dots n - 1$ | If $i > \text{maxReach}$, return `false` |
| **Jump Game II** | `currentEnd`, `farthest` | $0 \dots n - 2$ | At $i === \text{currentEnd}$, `jumps++` |
| **Gas Station** | `totalTank`, `currentTank` | $0 \dots n - 1$ | If `currentTank < 0`, `start = i + 1` |
| **Loop Boundary Trap** | Jump II must stop at $n - 2$ | Avoid extra jump on destination cell | N/A |

---

## Interview Questions

### 1. Why does Jump Game II only need to loop up to index $n - 2$?
**Question:** Explain why the iteration in Jump Game II terminates at index $n - 2$ instead of $n - 1$, and describe what happens if you iterate to the end.

**Answer:**
1. In Jump Game II, the goal is to reach the last index ($n - 1$).
2. The trigger `if (i === currentEnd)` signifies: "We have reached the maximum distance possible with our current number of jumps; to move any further, we must take another jump."
3. Once we arrive at index $n - 1$, we have already reached our destination! We do **not** need to jump again.
4. If the loop included index $n - 1$, and `currentEnd` happened to land on $n - 1$, the condition `i === currentEnd` would evaluate to true, incrementing `jumps++` unnecessarily and returning an off-by-one incorrect answer.
5. Terminating at $n - 2$ ensures we only count jumps initiated **before** arriving at the destination.

---

### 2. Can you mathematically prove the Gas Station Sub-Route Elimination property?
**Question:** Provide a rigorous proof for why if starting at station $A$ runs out of fuel at station $B$, no station $K \in (A, B)$ can successfully complete the circuit.

**Answer:**
Let $\text{tank}(i)$ denote the fuel in our tank upon arriving at station $i$.
1. When starting at station $A$ with $\text{tank}(A) = 0$, to reach any intermediate station $K \in (A, B)$, we must have had non-negative fuel:
   $$\text{tank}(K) \ge 0$$
2. Continuing from station $K$ with this starting bonus $\text{tank}(K)$, our fuel deficit at station $B$ was strictly negative:
   $$\text{tank}(B) = \text{tank}(K) + \sum_{j=K}^{B-1} (\text{gas}[j] - \text{cost}[j]) < 0$$
3. Now suppose we instead began our trip at station $K$ with an empty tank ($\text{tank}'(K) = 0$):
   $$\text{tank}'(B) = 0 + \sum_{j=K}^{B-1} (\text{gas}[j] - \text{cost}[j])$$
4. Since $\text{tank}(K) \ge 0$:
   $$\text{tank}'(B) \le \text{tank}(B) < 0$$
5. Therefore, starting at station $K$ will run out of fuel at or before station $B$. Thus, every station $K \in [A, B]$ is disqualified, allowing us to safely jump our candidate directly to $B + 1$.

---

### 3. How does Jump Game I compare between Dynamic Programming and Greedy?
**Question:** Contrast the $O(n^2)$ Dynamic Programming approach for Jump Game I with the $O(n)$ Greedy approach.

**Answer:**
- **Dynamic Programming ($O(n^2)$ Time, $O(n)$ Space)**:
  - Let `dp[i]` be a boolean indicating whether index $i$ can reach the target.
  - Recurrence: $dp[i] = \text{true}$ if there exists any $j \in [i + 1, \min(i + nums[i], n - 1)]$ such that $dp[j] === \text{true}$.
  - Requires checking all forward cells from each position, resulting in $O(n^2)$ worst-case time.
- **Greedy ($O(n)$ Time, $O(1)$ Space)**:
  - Recognizes that we only care about the **maximum continuous reach** achieved by any combination of previous steps.
  - Maintains `maxReach = Math.max(maxReach, i + nums[i])`.
  - Operates in a single pass without nested scans, executing in strict $O(n)$ time and $O(1)$ memory.

---

### 4. What is the time complexity of Gas Station if implemented with brute force simulation?
**Question:** What is the time and space complexity of the brute force solution to the Gas Station problem, and why is it unacceptable for large inputs?

**Answer:**
- **Brute Force Mechanism**: Test every station $i \in [0 \dots n - 1]$ as the starting point. For each station, simulate the circular trip step-by-step for up to $n$ hops until fuel runs out or the trip completes.
- **Complexity**:
  - Time Complexity: $O(n^2)$ in the worst case (e.g., when almost every station travels nearly full circle before failing).
  - Space Complexity: $O(1)$.
- **Why Unacceptable**: For input constraints where $N = 100,000$, an $O(n^2)$ algorithm requires $10^{10}$ operations, freezing the Node.js event loop for several seconds and triggering HTTP request timeouts. The greedy single-pass algorithm completes in $O(n)$ time ($\approx 100,000$ operations, under 5 milliseconds).

---

<nav aria-label="Lecture navigation">
  <a href="day-51-greedy-interval-scheduling.md">◀ Day 51: Greedy: Interval Scheduling and Overlaps</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-53-trie-construction-and-prefix-search.md">Day 53: Trie Construction and Prefix Search ▶</a>
</nav>
