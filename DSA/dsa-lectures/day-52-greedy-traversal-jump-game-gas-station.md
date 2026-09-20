# Day 52: Greedy Traversal: Jump Game and Gas Station

## 1. Learning Outcomes
- Master the **Greedy Reachability Pattern** without testing all paths.
- Solve **Jump Game I** in $O(n)$ time and $O(1)$ space using a running `maxReach` boundary.
- Solve **Jump Game II** (minimum jumps) in $O(n)$ time using window boundary transitions.
- Master circular circuit invariants in the **Gas Station** problem.
- Model circuit-breaker retries, resource depletion thresholds, and batch execution pipelines in Node.js.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 11 (Two Pointers), Day 51 (Greedy Interval Scheduling).
- **Navigation**:
  - [Previous: Day 51 - Greedy: Interval Scheduling and Overlaps](day-51-greedy-interval-scheduling.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 53 - Trie Construction and Prefix Search](day-53-trie-construction-and-prefix-search.md)

---

## 3. Core Concepts & Mental Models
Instead of exploring all jump branches via DFS ($O(2^n)$) or Dynamic Programming ($O(n^2)$), greedy traversal tracks the **maximum frontier** reachable at each stage.

```text
Jump Game I Frontier:
nums: [2, 3, 1, 1, 4]
i=0 (val:2): maxReach = max(0, 0+2) = 2. Frontier covers indices [0..2]
i=1 (val:3): maxReach = max(2, 1+3) = 4. Frontier covers indices [0..4] (>= target 4!)
Target reached in linear time!

Jump Game II Window Transitions:
        Current Window
       [---- JUMP 1 ----]
nums: [ 2 ,   3 ,   1   ,   1 ,   4 ]
                  [---- JUMP 2 ----]
Each jump pushes the window to the farthest reachable index discovered in the current window!
```

---

## 4. Detailed Technical Explanations

### 4.1 Jump Game I: The Reachability Invariant
- Maintain `maxReach = 0`.
- Iterate `i` from $0$ to $n - 1$:
  - If `i > maxReach`: Current index is beyond what can be reached from any previous index; return `false`.
  - Update `maxReach = Math.max(maxReach, i + nums[i])`.
  - If `maxReach >= n - 1`: Target reached; return `true`.

### 4.2 Jump Game II: Minimum Jumps via BFS Windows
Think of jumps as BFS levels:
- `currentEnd`: The farthest boundary reachable with the current number of jumps.
- `farthest`: The maximum reachable index discovered so far.
- When `i` reaches `currentEnd`: We must take another jump! Increment `jumps++`, update `currentEnd = farthest`.
- Iterate up to $n - 2$ (we don't need to jump once we land on the last index).

### 4.3 Gas Station: The Two Circuit Invariants
1. **Total Deficit Invariant**: If $\sum \text{gas} < \sum \text{cost}$, the entire round trip is impossible; return `-1`.
2. **Sub-Route Elimination**: If you start at station $A$ and run out of gas at station $B$, **no station between $A$ and $B$ can be the starting point**! Why? Because arriving at any station $K \in (A, B)$ with leftover gas from $A$ still failed to pass $B$; starting at $K$ with $0$ gas will fail even earlier! Reset `start = B + 1` and reset current tank.

### 4.4 Node.js Relevance: Resilient Circuit Breakers & Token Buckets
In Node.js microservices calling external APIs, circuit breakers (e.g., Opossum) track failure and recovery rates. Gas station invariants model token-bucket rate limiters: if the rate of incoming request tokens consistently lags consumption costs, the circuit must trip immediately rather than testing every request.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 Jump Game I (LeetCode 55)
```javascript
/**
 * Determines if you can reach the last index.
 * Time Complexity: O(n)
 * Space Complexity: O(1)
 */
function canJump(nums) {
  let maxReach = 0;

  for (let i = 0; i < nums.length; i++) {
    // If current index is unreachable from all previous jumps
    if (i > maxReach) {
      return false;
    }

    maxReach = Math.max(maxReach, i + nums[i]);

    // Early exit if last index is reachable
    if (maxReach >= nums.length - 1) {
      return true;
    }
  }

  return true;
}
```

### 5.2 Jump Game II (LeetCode 45)
```javascript
/**
 * Minimum jumps to reach the last index.
 * Time Complexity: O(n)
 * Space Complexity: O(1)
 */
function jump(nums) {
  if (nums.length <= 1) return 0;

  let jumps = 0;
  let currentEnd = 0;
  let farthest = 0;

  // We loop up to nums.length - 2 because when we hit the last index, we're done
  for (let i = 0; i < nums.length - 1; i++) {
    farthest = Math.max(farthest, i + nums[i]);

    // When we reach the end of the current jump's reach
    if (i === currentEnd) {
      jumps++;
      currentEnd = farthest;

      if (currentEnd >= nums.length - 1) {
        break;
      }
    }
  }

  return jumps;
}
```

### 5.3 Gas Station (LeetCode 134)
```javascript
/**
 * Finds starting gas station index to complete the circular route.
 * Time Complexity: O(n)
 * Space Complexity: O(1)
 */
function canCompleteCircuit(gas, cost) {
  let totalTank = 0;
  let currentTank = 0;
  let startStation = 0;

  for (let i = 0; i < gas.length; i++) {
    const netGain = gas[i] - cost[i];
    totalTank += netGain;
    currentTank += netGain;

    // If current gas drops below 0, cannot reach next station from startStation
    if (currentTank < 0) {
      // Pick next station as candidate start and reset current tank
      startStation = i + 1;
      currentTank = 0;
    }
  }

  // If total gas >= total cost, a solution is mathematically guaranteed!
  return totalTank >= 0 ? startStation : -1;
}
```

### 5.4 Execution Trace: `canCompleteCircuit([1,2,3,4,5], [3,4,5,1,2])`
```text
netGains: [-2, -2, -2, +3, +3]
i=0: net = -2. totalTank = -2, currentTank = -2 < 0 -> startStation = 1, currentTank = 0
i=1: net = -2. totalTank = -4, currentTank = -2 < 0 -> startStation = 2, currentTank = 0
i=2: net = -2. totalTank = -6, currentTank = -2 < 0 -> startStation = 3, currentTank = 0
i=3: net = +3. totalTank = -3, currentTank = 3 > 0.
i=4: net = +3. totalTank = 0,  currentTank = 6 > 0.
Loop finishes. totalTank (0) >= 0 is TRUE.
Return startStation = 3 (index 3, station with gas 4).
```

---

## 6. Common Mistakes & Anti-Patterns
- **Nested Loop in Gas Station ($O(n^2)$)**: Simulating the full circular trip from every station $i$ takes $O(n^2)$ and times out on large inputs ($N = 10^5$). The single-pass elimination rule guarantees $O(n)$ time.
- **Looping to `nums.length - 1` in Jump Game II**: If the loop runs to index $n - 1$, hitting `i === currentEnd` triggers an unnecessary extra jump count even when already standing at the finish line! Loop only to $n - 2$.
- **Using DP When Greedy Suffices**: Writing $O(n^2)$ dynamic programming `dp[i] = 1 + min(dp[j])` for Jump Game II wastes CPU time and memory when BFS-greedy achieves $O(n)$ time and $O(1)$ space.

---

## 7. Tricky Points & Edge Cases
- **Single Element Array**: For `nums = [0]` in Jump Game I, return `true` (already at end). For Jump Game II, return `0` jumps.
- **Zeros in Array**: `nums = [3, 2, 1, 0, 4]`. The zero acts as a barrier; `maxReach` stops at 3, `i=4 > maxReach`, correctly returning `false`.
- **Unique Solution Guarantee**: In LeetCode 134, if a solution exists, it is guaranteed to be unique.

---

## 8. Practical Engineering Exercises
1. Implement **Video Stitching** (LeetCode 1024) using the Jump Game II greedy window expansion technique.
2. Given an array of request burst rates, find the minimum number of worker thread scaling events needed to absorb all traffic bursts.

---

## 9. Key Takeaways & Summary
- Jump Game I checks reachability by maintaining the maximum frontier index: `maxReach = Math.max(maxReach, i + nums[i])`.
- Jump Game II counts minimum jumps by treating reach boundaries as BFS window layers.
- Gas Station eliminates invalid sub-routes in a single pass: if failing at $B$, all stations up to $B$ are disqualified.
- Both problems run in strictly linear $O(n)$ time and $O(1)$ auxiliary space.

---

## 10. Quick Reference Cheat Sheet
| Problem | Key Variable | Update Trigger | Complexity |
| :--- | :--- | :--- | :--- |
| **Jump Game I** | `maxReach` | `i > maxReach ? false : max(reach, i + val)` | $O(n)$ time, $O(1)$ space |
| **Jump Game II** | `currentEnd`, `farthest` | `i === currentEnd ? jumps++, currentEnd = farthest` | $O(n)$ time, $O(1)$ space |
| **Gas Station** | `totalTank`, `currentTank` | `currentTank < 0 ? start = i + 1, tank = 0` | $O(n)$ time, $O(1)$ space |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: In the Gas Station problem, prove why no station between the starting station $A$ and the failed station $B$ can be the valid starting station.  
**Hint**: Consider the tank balance when arriving at intermediate station $K$.  
**Expected Answer Shape**: Starting at $A$, you successfully reached all stations from $A$ to $B-1$ with a non-negative fuel balance ($\text{tank} \ge 0$). This means you arrived at any intermediate station $K \in (A, B)$ with $\text{tank} \ge 0$, and yet starting with that extra surplus fuel still resulted in failure at station $B$. If you instead started at $K$ with zero fuel, you would have strictly less fuel at every subsequent station than you did starting from $A$, guaranteeing failure at or before $B$. Hence, all stations between $A$ and $B$ are eliminated.

### 2. Code-Writing
**Question**: Solve Jump Game I by working backwards from the goal to index 0.  
**Hint**: Track the leftmost index that can reach the current goal.  
**Expected Answer Shape**: Set `goal = nums.length - 1`. Iterate backwards `i` from $n - 2$ down to 0: if `i + nums[i] >= goal`, update `goal = i`. At the end of the loop, return `goal === 0` in $O(n)$ time and $O(1)$ space.

### 3. Debugging
**Question**: Identify why this Jump Game II code produces an extra jump:  
```javascript
function jump(nums) {
  let jumps = 0, currentEnd = 0, farthest = 0;
  for (let i = 0; i < nums.length; i++) {
    farthest = Math.max(farthest, i + nums[i]);
    if (i === currentEnd) {
      jumps++;
      currentEnd = farthest;
    }
  }
  return jumps;
}
```  
**Hint**: Look at what happens at the very last element of the array.  
**Expected Answer Shape**: When the loop reaches the last element `i = nums.length - 1`, `i === currentEnd` evaluates true, incrementing `jumps++` again even though the destination was already reached. Change the loop condition to `i < nums.length - 1` so the loop terminates before evaluating the final landing index.

### 4. System Design / Tradeoff
**Question**: In building an asynchronous API rate-limiter in Node.js, how does the Gas Station deficit tracking concept help protect downstream databases?  
**Hint**: Total capacity vs. burst drain.  
**Expected Answer Shape**: Similar to `totalTank >= 0`, a rate limiter tracks net token inflow versus request drain. If overall token generation over an epoch is negative, requests are guaranteed to overwhelm the database. The system trips a circuit breaker and rejects new requests at the gateway tier (returning 429 Too Many Requests) before database connection pools are saturated.

### 5. Tricky / Edge Case
**Question**: In Jump Game I, what happens if the array contains negative numbers? Can greedy traversal still work?  
**Hint**: Can a step move you backwards?  
**Expected Answer Shape**: The problem assumes non-negative integers (`nums[i] >= 0`). If negative numbers were allowed, a jump could move backwards, introducing cycles and bidirectional graph transitions. The simple monotonic forward frontier invariant breaks, and the problem must be modeled as a shortest path or graph search (BFS/Dijkstra) rather than linear greedy traversal.

### 6. Real-World Node.js Context
**Question**: How does a Node.js streaming file downloader use greedy window sizing to adjust network chunk read buffers?  
**Hint**: Adaptive buffer sizing based on TCP window health.  
**Expected Answer Shape**: When streaming large media files via Node.js `fs.createReadStream`, the process monitors socket drain rates. If downstream consumers process chunks faster than the current buffer window, the downloader greedily increases buffer size to the maximum throughput frontier (`highWaterMark`). If backpressure occurs (`stream.write() === false`), it pauses immediately until drain, ensuring memory efficiency without event loop stalls.
