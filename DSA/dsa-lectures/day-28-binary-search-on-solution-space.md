# Day 28: Binary Search on Solution Space

<nav aria-label="Lecture navigation">

[Previous: Binary Search on Rotated Arrays and Peaks](day-27-binary-search-rotated-arrays-and-peaks.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Singly and Doubly Linked Lists](day-29-singly-and-doubly-linked-lists.md)

</nav>
## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md) — Complexity analysis of composite algorithms ($O(N \log R)$).
- [Day 26: Binary Search Bounds and Intervals](day-26-binary-search-bounds-and-intervals.md) — Boundary conditions and convergence patterns.
---

## 1. Searching the Answer Instead of the Input

In traditional binary search, the input array must be sorted. In **Binary Search on the Solution Space**, the input array does not need to be sorted at all!
Instead:
> **We binary search over the RANGE OF POSSIBLE ANSWERS.**

This design pattern applies whenever a problem asks for the **"minimum capacity to achieve $X$"** or **"maximum speed to stay within $Y$"** such that:
- If a candidate speed $k$ is too slow to finish within the constraint, any speed $< k$ is also too slow (**False**).
- If candidate speed $k$ is fast enough to finish, any speed $> k$ is also fast enough (**True**).

```text
Monotonic Truth Table over candidate speeds 1 to 10:
Candidate Speed:   1      2      3      4      5     6     7     8     9     10
canFinish(speed): False  False  False  False  True  True  True  True  True  True
                                                ▲
                                  First 'True' is the MINIMUM feasible speed!
```

This transforms the problem into finding the boundary between `false` and `true` in a sorted boolean sequence: `[F, F, F, F, T, T, T, T, T, T]`.
The overall time complexity is:
$$\text{Total Time} = O(\log(\text{Range})) \times O(\text{Validation Predicate})$$

---

## 2. The 3-Step Solution Space Framework

```text
Step 1: Establish Lower Bound (left)
        What is the absolute smallest possible answer?
        For shipping: left = Math.max(...weights) (truck must carry heaviest package).

Step 2: Establish Upper Bound (right)
        What is the maximum answer guaranteed to satisfy the condition?
        For shipping: right = sum(weights) (carrying all packages in 1 day).

Step 3: Implement Deterministic Predicate (isFeasible(mid))
        A greedy check running in O(n) returning true or false.
```

```javascript
// Universal Solution Space Binary Search Blueprint
let left = lowerBound;
let right = upperBound;
let ans = right;

while (left <= right) {
  const mid = left + Math.floor((right - left) / 2);

  if (isFeasible(mid)) {
    ans = mid;       // mid is feasible, probe for a smaller valid answer
    right = mid - 1;
  } else {
    left = mid + 1;  // mid is infeasible, must increase capacity
  }
}
return ans;
```

---

## 3. Problem Study: Koko Eating Bananas (LeetCode 875)

Koko has $n$ `piles` of bananas, and the guards return in $h$ hours. In each hour, Koko eats up to $k$ bananas from a single pile. If the pile has fewer than $k$ bananas, she eats the entire pile and stops eating for that hour. Find the **minimum integer eating speed $k$** to finish all bananas within $h$ hours.

#### Bound Formulations:
- **`left = 1`**: Koko must eat at least 1 banana per hour.
- **`right = Math.max(...piles)`**: Eating faster than the largest pile never saves additional hours because Koko cannot eat from multiple piles within the same hour.
- **Hours per pile**: $\lceil \text{pile} / k \rceil$.

```text
piles = [ 3, 6, 7, 11 ], h = 8
left = 1, right = 11

mid = 6:
Hours: ceil(3/6) + ceil(6/6) + ceil(7/6) + ceil(11/6) = 1 + 1 + 2 + 2 = 6 hours
6 <= 8 hours -> FEASIBLE! Record ans = 6. Seek smaller: right = mid - 1 = 5.

mid = 3:
Hours: ceil(3/3) + ceil(6/3) + ceil(7/3) + ceil(11/3) = 1 + 2 + 3 + 4 = 10 hours
10 > 8 hours -> INFEASIBLE! Need faster speed: left = mid + 1 = 4.

mid = 4:
Hours: ceil(3/4) + ceil(6/4) + ceil(7/4) + ceil(11/4) = 1 + 2 + 2 + 3 = 8 hours
8 <= 8 hours -> FEASIBLE! Record ans = 4. Seek smaller: right = mid - 1 = 3.

Loop terminates (left > right). Minimum feasible speed is 4 bananas/hour!
```

```javascript
// Node.js code: Koko Eating Bananas (LeetCode 875)

function minEatingSpeed(piles, h) {
  let left = 1;
  let right = 0;
  for (const pile of piles) {
    if (pile > right) right = pile;
  }
  let ans = right;

  function canFinish(speed) {
    let hoursNeeded = 0;
    for (const pile of piles) {
      hoursNeeded += Math.ceil(pile / speed);
      // Early pruning: abort loop if hours already exceed allowance
      if (hoursNeeded > h) return false;
    }
    return hoursNeeded <= h;
  }

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (canFinish(mid)) {
      ans = mid;
      right = mid - 1; // Seek smaller speed
    } else {
      left = mid + 1;  // Speed too slow
    }
  }

  return ans;
}

console.log(minEatingSpeed([3, 6, 7, 11], 8)); // 4
console.log(minEatingSpeed([30, 11, 23, 4, 20], 5)); // 30
```

---

## 4. Problem Study: Capacity To Ship Packages Within D Days (LeetCode 1011)

A conveyor belt carries packages with weights `weights[i]`. A ship must transport all packages in the given order within `days` days. Return the **minimum ship weight capacity**.

#### Bound Formulations:
- **`left = Math.max(...weights)`**: The ship capacity *must* be at least the heaviest single package; otherwise, that package can never be transported.
- **`right = weights.reduce((a, b) => a + b, 0)`**: Shipping all packages in a single day requires carrying the total sum of weights.
- **Greedy Verification**: Iterate through packages in order. If adding the next package exceeds `capacity`, increment `daysNeeded++` and start a new shipping day.

```javascript
// Node.js code: Capacity To Ship Packages (LeetCode 1011)

function shipWithinDays(weights, days) {
  let left = 0;
  let right = 0;
  for (const w of weights) {
    if (w > left) left = w; // Heaviest package
    right += w;             // Total weight sum
  }

  let ans = right;

  function canShip(capacity) {
    let daysNeeded = 1;
    let currentLoad = 0;

    for (const w of weights) {
      if (currentLoad + w > capacity) {
        daysNeeded++;
        currentLoad = 0;
      }
      currentLoad += w;
    }

    return daysNeeded <= days;
  }

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (canShip(mid)) {
      ans = mid;
      right = mid - 1; // Try smaller capacity
    } else {
      left = mid + 1;  // Need bigger capacity
    }
  }

  return ans;
}

console.log(shipWithinDays([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5)); // 15
```

---

## Detailed Node.js Relevance: Dynamic Batch Size Calibration in ETL

In production Node.js data ingestion services (e.g., syncing records from MongoDB to Elasticsearch), processing records one-by-one is inefficient, but large batch sizes trigger V8 heap exhaustion and event loop latency spikes ($> 100\text{ms}$).

```text
ETL Calibration Problem:
Find the MAXIMUM batch size B in range [100 ... 50,000] such that:
Event Loop Delay(B) <= 25ms AND Memory Delta(B) <= 128 MB.
```

- **Monotonicity**: As batch size increases, event loop delay monotonically increases.
- **Binary Search Calibration**: During service warm-up, the orchestrator tests batch sizes using binary search. With a search space of $[100, 50000]$, binary search isolates the maximum optimal batch size in just $\approx 9$ trial batches without risking production server outages.

---

## Tricky Points & Edge Cases

1. **Incorrect Lower Bound in Packing Problems**:
   Initializing `left = 1` instead of `Math.max(...weights)` creates invalid states. If a package weighs $50$ and the candidate capacity is $30$, the greedy loop tries to ship that package by rolling over to a new day forever or crashing.
2. **Floating-Point Rounding in Ceiling Division**:
   In languages with integer division, `pile / speed` truncates. In JavaScript, division produces IEEE-754 floats, so `Math.ceil(pile / speed)` works correctly. Alternatively, use integer arithmetic:
   $$\lfloor \frac{\text{pile} + \text{speed} - 1}{\text{speed}} \rfloor$$
3. **Number of Days Equals Package Count**:
   If `days === weights.length`, every package gets its own day. The answer is simply `Math.max(...weights)`.

---

## Hands-On Exercise

### Scenario: Split Array Largest Sum (LeetCode 410)

Given an array of non-negative integers `nums` and an integer $k$, split `nums` into $k$ non-empty contiguous subarrays such that the **largest sum among these $k$ subarrays is minimized**.

### Buggy Code

```javascript
// ❌ BUGGY: Fails to enforce minimum lower bound and miscounts subarray boundaries
function buggySplitArray(nums, k) {
  let left = 0; // BUG 1: Lower bound should be Math.max(...nums)!
  let right = nums.reduce((a, b) => a + b, 0);

  function canSplit(maxSum) {
    let count = 0; // BUG 2: Starts count at 0 instead of 1!
    let current = 0;
    for (const n of nums) {
      if (current + n > maxSum) {
        count++;
        current = n;
      } else {
        current += n;
      }
    }
    return count <= k;
  }

  let ans = right;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (canSplit(mid)) {
      ans = mid;
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }
  return ans;
}
```

### Acceptance Criteria

1. Minimizes the maximum subarray sum in $O(n \log(\sum \text{nums}))$ time and $O(1)$ space.
2. Correctly sets `left = Math.max(...nums)` and `right = sum(nums)`.
3. Validates subarray splits greedily starting with count = 1.
4. Verified with comprehensive Node.js assertions testing single elements, uniform arrays, and varying $k$.

### Solution Code

```javascript
// Node.js code: Split Array Largest Sum Solution
const assert = require("assert");

function splitArray(nums, k) {
  let left = 0;
  let right = 0;

  for (const n of nums) {
    if (n > left) left = n; // Minimum feasible answer: largest single number
    right += n;             // Maximum feasible answer: sum of entire array
  }

  let ans = right;

  function canSplit(maxAllowedSum) {
    let pieces = 1;
    let currentSum = 0;

    for (const num of nums) {
      if (currentSum + num > maxAllowedSum) {
        pieces++;
        currentSum = num; // Start next subarray
      } else {
        currentSum += num;
      }
    }

    return pieces <= k;
  }

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (canSplit(mid)) {
      ans = mid;       // Feasible, seek a smaller maximum sum
      right = mid - 1;
    } else {
      left = mid + 1;  // Infeasible, need a larger allowance
    }
  }

  return ans;
}

// Verification Tests
assert.strictEqual(splitArray([7, 2, 5, 10, 8], 2), 18); // Subarrays: [7, 2, 5] (14) and [10, 8] (18)
assert.strictEqual(splitArray([1, 2, 3, 4, 5], 2), 9);   // Subarrays: [1, 2, 3] (6) and [4, 5] (9)
assert.strictEqual(splitArray([1, 4, 4], 3), 4);         // Each gets own array
assert.strictEqual(splitArray([10], 1), 10);             // Single element

console.log("✅ All Split Array Largest Sum assertions passed successfully.");
```

### Solution Explanation

1. **Structural Equivalence**: Splitting an array into $k$ contiguous pieces to minimize maximum sum is identical to packing packages into $k$ days to minimize ship capacity.
2. **Greedy Contiguity**: Elements are packaged in order. When adding `num` exceeds `maxAllowedSum`, a new split is created. If total pieces $\le k$, the capacity is feasible.

---

## Summary

- **Solution Space Concept**: Binary search over the range of potential answers rather than the input elements.
- **Prerequisite Invariant**: The problem must satisfy monotonic feasibility ($[F, F, \dots, T, T]$).
- **Bound Formulations**: Lower bound must accommodate the largest individual item (`Math.max`); Upper bound is the total aggregate (`sum`).
- **Complexity**: $O(n \log(\text{Range}))$, executing in milliseconds even for ranges in the billions.
- **Node.js Systems**: Applied in backend environments to auto-calibrate rate limiters, worker concurrency, and ETL batch sizes.

---

## Cheat Sheet & Common Pitfalls

### Solution Space Search Template

> **Solution Space Search**: Binary searching across the numeric range of possible answers rather than an input array.
```javascript
let left = Math.max(...items);
let right = items.reduce((a, b) => a + b, 0);
let ans = right;

while (left <= right) {
  const mid = left + Math.floor((right - left) / 2);
  if (isFeasible(mid)) {
    ans = mid;
    right = mid - 1; // Seek smaller answer
  } else {
    left = mid + 1;  // Not feasible, must increase
  }
}
return ans;
```

### Common Pitfalls

| Mistake | Consequence | Correct Pattern |
| :--- | :--- | :--- |
| **`left = 1` in packing problems** | An individual package exceeds capacity; breaks logic. | `left = Math.max(...weights)`. |
| **Starting subarray count at 0** | Off-by-one undercount in partition validation. | Initialize `pieces = 1`. |
| **Omitting early exit in predicate** | Unnecessary iterations when budget already exceeded. | `if (hours > h) return false`. |
| **Integer division truncation** | Under-allocates time in ceiling calculations. | `Math.ceil(pile / speed)`. |

---

## Interview Questions

### 1. What is the Monotonic Feasibility Property, and why is it required for Binary Search on the Answer?

**Question:** Explain what the Monotonic Feasibility Property is and why it is a mandatory prerequisite for applying Binary Search on the Solution Space.

**Answer:** 
A verification predicate $P(x)$ satisfies the monotonic feasibility property if its boolean output changes truth value at most once across the ordered search domain:
$$P(x) = \text{true} \implies P(x + 1) = \text{true} \quad (\text{or symmetrically, } P(x) = \text{true} \implies P(x - 1) = \text{true})$$

This property ensures that the evaluation outputs across the candidate range form two contiguous partitioned blocks:
$$[\text{false}, \text{false}, \dots, \text{false}, \text{true}, \text{true}, \dots, \text{true}]$$

Without monotonic feasibility, evaluating candidate $x$ provides zero information about candidates $< x$ or $> x$. An algorithm could discard half the domain containing the true optimum, causing binary search to fail. With monotonic feasibility, any evaluation immediately eliminates half the search space with mathematical certainty.

---

### 2. In Koko Eating Bananas with `piles = [30, 11, 23, 4, 20]` and `h = 5`, what is the optimal speed and why?

**Question:** Predict the optimal eating speed for Koko with `piles = [30, 11, 23, 4, 20]` and `h = 5` without performing binary search, and explain your reasoning.

**Answer:** 
The optimal eating speed is **$30$ bananas/hour** (the maximum pile).

**Reasoning:**
- There are $5$ piles and exactly $5$ available hours ($h = 5$).
- Because Koko can eat from at most one pile per hour, she must consume exactly one pile per hour.
- To finish the largest pile ($30$ bananas) within 1 hour, her speed $k$ must satisfy $k \ge 30$.
- Any speed $k < 30$ would require $\lceil 30 / k \rceil \ge 2$ hours for the largest pile, bringing total required hours to at least $2 + 1 + 1 + 1 + 1 = 6$ hours, violating the deadline $h = 5$.
- Therefore, the minimum feasible speed is strictly $\max(\text{piles}) = 30$.

---

### 3. How do you implement the Minimum Days to Make M Bouquets using binary search on answer days?

**Question:** Implement `minDays(bloomDay, m, k)` (LeetCode 1482) in $O(n \log(\max(\text{bloomDay})))$ time using binary search on the solution space.

**Answer:** 

```javascript
// Node.js code
function minDays(bloomDay, m, k) {
  // If total flowers needed exceeds available flowers, impossible
  if (m * k > bloomDay.length) return -1;

  let left = 1;
  let right = 0;
  for (const day of bloomDay) {
    if (day > right) right = day;
  }
  let ans = -1;

  function canMake(currentDay) {
    let bouquets = 0;
    let adjacentFlowers = 0;

    for (const b of bloomDay) {
      if (b <= currentDay) {
        adjacentFlowers++;
        if (adjacentFlowers === k) {
          bouquets++;
          adjacentFlowers = 0;
        }
      } else {
        adjacentFlowers = 0; // Break adjacency
      }
    }

    return bouquets >= m;
  }

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (canMake(mid)) {
      ans = mid;       // Feasible, seek earlier day
      right = mid - 1;
    } else {
      left = mid + 1;  // Not enough bouquets, need more days
    }
  }

  return ans;
}
```

---

### 4. How can Binary Search on the Answer be used to dynamically calibrate rate limits or batch sizes in Node.js?

**Question:** In a high-throughput Node.js microservice consuming from Kafka, how can binary search on the answer be implemented to auto-tune consumer batch sizes during runtime?

**Answer:** 
1. **Formulate the Domain**: Define the batch size candidate range $[B_{\min}, B_{\max}]$, e.g., $[50, 10,000]$ records.
2. **Define Monotonic Feasibility**: The predicate $P(B)$ evaluates whether processing a batch of size $B$:
   - Keeps p99 event-loop delay $\le 20\text{ms}$.
   - Keeps memory heap consumption delta $\le 64\text{MB}$.
   - Completes without database connection timeout errors.
3. **Execution during Warmup**:
   - The consumer dynamically sets batch size to $B_{\text{mid}} = \text{left} + \lfloor (\text{right} - \text{left}) / 2 \rfloor$.
   - Monitors telemetry metrics over 3 consecutive batches.
   - If SLA thresholds are violated, the batch is too large: $\text{right} = B_{\text{mid}} - 1$.
   - If SLA thresholds are met, the batch is feasible: record candidate and probe higher: $\text{left} = B_{\text{mid}} + 1$.
4. **Outcome**: Within $\lceil \log_2(10000) \rceil \approx 14$ test intervals, the service converges on the maximum stable throughput capacity without risking production downtime.

---

<nav aria-label="Lecture navigation">

[Previous: Binary Search on Rotated Arrays and Peaks](day-27-binary-search-rotated-arrays-and-peaks.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Singly and Doubly Linked Lists](day-29-singly-and-doubly-linked-lists.md)

</nav>
