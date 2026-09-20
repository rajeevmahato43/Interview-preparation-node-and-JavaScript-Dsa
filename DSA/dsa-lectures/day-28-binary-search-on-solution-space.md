# Day 28: Binary Search on Solution Space

<nav aria-label="Lecture navigation">

[Previous: Binary Search on Rotated Arrays and Peaks](day-27-binary-search-rotated-arrays-and-peaks.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Singly and Doubly Linked Lists](day-29-singly-and-doubly-linked-lists.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Recognize problems that can be formulated as **Binary Search on the Answer / Solution Space**.
- Formulate a monotonic boolean predicate function: `canComplete(speed)` or `isFeasible(capacity)`.
- Solve **Koko Eating Bananas** in $O(n \log(\max(\text{piles})))$ time.
- Solve **Capacity To Ship Packages Within D Days** using minimum and maximum search bounds.
- Apply solution-space search to optimize system throughput, rate limits, and auto-scaling thresholds in Node.js.

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md)
- [Day 26: Binary Search Bounds and Intervals](day-26-binary-search-bounds-and-intervals.md)

---

## Core Concepts

### 1. Searching the Answer Instead of the Input

Normally, binary search looks for a number in an array.
In **Binary Search on the Solution Space**, the array does not even need to be sorted!
Instead:
> **We binary search the RANGE OF POSSIBLE ANSWERS.**

When does this pattern apply?
Whenever a problem asks for the **"minimum capacity to achieve $X$"** or **"maximum rate to stay within $Y$"** such that:
- If speed $k$ is too slow to finish in time, all speeds $< k$ are also too slow (**False**).
- If speed $k$ is fast enough to finish in time, all speeds $> k$ are also fast enough (**True**).

```text
Monotonic Truth Table across speeds 1 to 10:
Speed:    1     2     3     4     5     6     7     8     9     10
Feasible: False False False False True  True  True  True  True  True
                              ▲
                       First 'True' is the MINIMUM feasible speed!
```
This is a sorted sequence of boolean values: `[F, F, F, F, T, T, T, T, T, T]`.
We can use binary search to locate the boundary in **$O(\log(\text{range})) \times O(\text{validation})$** time!

---

### 2. The 3-Step Solution Space Framework

1. **Establish the Lower Bound (`left`)**:
   What is the absolute smallest possible answer?
   (e.g. For shipping packages, capacity must be at least $\max(\text{weights})$ because a truck cannot carry half a package).
2. **Establish the Upper Bound (`right`)**:
   What is the worst-case maximum answer that is guaranteed to work?
   (e.g. For shipping packages, capacity could be $\sum \text{weights}$, shipping all packages in 1 day).
3. **Write the Feasibility Predicate (`canComplete(mid)`)**:
   A deterministic function running in $O(n)$ that returns `true` or `false`.

---

## Detailed Explanations & Node.js Relevance

### Koko Eating Bananas (LeetCode 875)

Koko loves to eat bananas. There are `piles` of bananas, and the guards will return in `h` hours.
Koko can decide her eating speed $k$ (bananas per hour). In each hour, she chooses a pile and eats $k$ bananas. If the pile has fewer than $k$, she eats the whole pile and stops eating for that hour.
Find the **minimum integer $k$** such that she can eat all bananas within $h$ hours.

- **`left = 1`** (Must eat at least 1 banana per hour).
- **`right = Math.max(...piles)`** (Eating faster than the largest pile never reduces total hours because she cannot eat from two piles in one hour).
- **Time per pile**: `Math.ceil(pile / k)` hours.

### Node.js Relevance: Dynamic Rate Limiter Calibration
In Node.js backend infrastructure (e.g. background job dispatching), you need to determine the maximum concurrent workers $W$ that can process a queue without exceeding database CPU limits ($80\%$). Rather than guessing, load testing tools use binary search across worker concurrency limits to locate the maximum stable throughput threshold.

---

## JavaScript Implementation & Tracing

### 1. Koko Eating Bananas (LeetCode 875)

```js
function minEatingSpeed(piles, h) {
  let left = 1;
  let right = 0;
  for (const pile of piles) {
    if (pile > right) right = pile;
  }

  let result = right;

  function canFinish(speed) {
    let hoursNeeded = 0;
    for (const pile of piles) {
      hoursNeeded += Math.ceil(pile / speed);
      if (hoursNeeded > h) return false; // Early pruning
    }
    return hoursNeeded <= h;
  }

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (canFinish(mid)) {
      result = mid;     // mid is feasible, try to find an even smaller speed!
      right = mid - 1;
    } else {
      left = mid + 1;   // mid is too slow, need a higher speed
    }
  }

  return result;
}
```

### 2. Capacity To Ship Packages Within D Days (LeetCode 1011)

```js
function shipWithinDays(weights, days) {
  // left must be at least the heaviest package
  let left = Math.max(...weights);
  // right is the sum of all packages (shipping everything in 1 day)
  let right = weights.reduce((a, b) => a + b, 0);
  let result = right;

  function canShip(capacity) {
    let daysNeeded = 1;
    let currentLoad = 0;

    for (const weight of weights) {
      if (currentLoad + weight > capacity) {
        daysNeeded++;
        currentLoad = 0;
      }
      currentLoad += weight;
    }

    return daysNeeded <= days;
  }

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (canShip(mid)) {
      result = mid;
      right = mid - 1; // Try smaller capacity
    } else {
      left = mid + 1;  // Need bigger capacity
    }
  }

  return result;
}
```

### Trace: `minEatingSpeed(piles = [3, 6, 7, 11], h = 8)`

`left = 1`, `right = 11`.

| `left` | `right` | `mid (speed)` | Hours needed: $\lceil 3/m \rceil + \lceil 6/m \rceil + \lceil 7/m \rceil + \lceil 11/m \rceil$ | Can finish $\le 8$? | Action | `result` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 11 | 6 | $1 + 1 + 2 + 2 = 6$ hours | `true` ($6 \le 8$) | `right = 6 - 1 = 5` | 6 |
| 1 | 5 | 3 | $1 + 2 + 3 + 4 = 10$ hours | `false` ($10 > 8$) | `left = 3 + 1 = 4` | 6 |
| 4 | 5 | 4 | $1 + 2 + 2 + 3 = 8$ hours | `true` ($8 \le 8$) | `right = 4 - 1 = 3` | **4** |
| 4 | 3 | — | `left > right` $\to$ Loop terminates | — | Returns `4` |

- **Time Complexity**: $O(n \cdot \log(\max(\text{piles})))$ where $n$ is `piles.length`.
- **Auxiliary Space**: $O(1)$ extra space.

---

## Common Mistakes & Interview Traps

1. **Incorrect Lower Bound in Ship Within Days**:
   ```js
   // WRONG: let left = 1;
   ```
   If a single package weighs $50$ and you test capacity $30$, that package can *never* be shipped! Lower bound must be `Math.max(...weights)`.
2. **Integer Division in JavaScript Ceiling**:
   ```js
   // WRONG: Math.ceil(pile / speed) using integer trunc
   // In JavaScript, pile / speed naturally produces a float, so Math.ceil() works.
   // Or use integer math: Math.floor((pile + speed - 1) / speed).
   ```
3. **Early Exit Optimization**:
   Inside `canFinish()`, if `hoursNeeded > h`, return `false` immediately to skip summing the remaining piles.

---

## Tricky Points & Edge Cases

- **$h === \text{piles.length}$**:
  When hours equal the number of piles, Koko must eat at least the size of the largest pile: returns `Math.max(...piles)`.
- **Large Sums Beyond Number Limits**:
  If summing all elements exceeds $2^{53} - 1$, use `BigInt`. For standard interview constraints ($N \le 10^5$, elements $\le 10^4$), sum is $\le 10^9$, well within safe integer bounds.

---

## Practical Exercise

Implement **Split Array Largest Sum** (LeetCode 410):
Given an integer array `nums` and an integer `k`, split `nums` into `k` non-empty subarrays such that the largest sum of any subarray is minimized.
- **Insight**: This is structurally identical to *Capacity to Ship Packages Within D Days*!
- **Acceptance Criterion**: Must run in $O(n \cdot \log(\sum \text{nums}))$ time.

---

## Summary

- When asked to minimize a maximum or find the minimum feasible rate, search the **answer range** using binary search.
- The technique works whenever the problem exhibits a monotonic feasibility condition (`[F, F, ..., T, T]`).
- The feasibility predicate checks validity in $O(n)$ time.
- Total time is $O(n \log(\text{range}))$, achieving near-instant results even for ranges in the billions.

---

## Cheat Sheet

### Binary Search on Solution Space Blueprint
```js
let left = minPossibleAnswer;
let right = maxPossibleAnswer;
let ans = right;

while (left <= right) {
  const mid = left + Math.floor((right - left) / 2);
  if (isFeasible(mid)) {
    ans = mid;
    right = mid - 1; // Seek smaller valid answer
  } else {
    left = mid + 1;  // Not feasible, must increase
  }
}
return ans;
```

---

## Interview Questions

### 1. Deep Definitions and Mental Models
**Question:** Explain what the "Monotonic Feasibility Property" is and why it is the prerequisite for applying Binary Search on the Solution Space.
- **Expected answer shape:** A predicate function $P(x)$ has the monotonic feasibility property if for all $x$, whenever $P(x)$ is true, $P(x + 1)$ is also true (or vice-versa). This guarantees that the boolean evaluations over the search domain form a contiguous partitioned block: `[false, false, ..., true, true]`. Without this property, halving the search space could discard the optimal answer, rendering binary search invalid.

### 2. Predict the Output and Trace Execution
**Question:** In Koko Eating Bananas with `piles = [30, 11, 23, 4, 20]`, `h = 5`, what is the answer and why can it be determined without binary search?
- **Expected answer shape:** Answer is `30` (the maximum pile). Since $h = 5$ and there are 5 piles, Koko has exactly 1 hour per pile. She must be able to consume the largest pile (30) in a single hour. Any speed less than 30 would require at least 2 hours for that pile, exceeding $h = 5$.

### 3. Implementation Exercise
**Question:** Write `minDays(bloomDay, m, k)` (LeetCode 1482: Minimum Number of Days to Make $m$ Bouquets) using binary search on answer days.
- **Expected answer shape:**
```js
function minDays(bloomDay, m, k) {
  if (m * k > bloomDay.length) return -1;
  let l = 1, r = Math.max(...bloomDay), ans = -1;
  function canMake(day) {
    let bouquets = 0, flowers = 0;
    for (const b of bloomDay) {
      if (b <= day) {
        flowers++;
        if (flowers === k) { bouquets++; flowers = 0; }
      } else { flowers = 0; }
    }
    return bouquets >= m;
  }
  while (l <= r) {
    const mid = l + Math.floor((r - l) / 2);
    if (canMake(mid)) { ans = mid; r = mid - 1; }
    else l = mid + 1;
  }
  return ans;
}
```

### 4. Debugging and Failure Analysis
**Question:** A candidate writes `Math.ceil(pile / k)` in integer languages using integer division `pile / k`. Why does this truncate and how do you calculate ceiling with integers?
- **Expected answer shape:** In languages with integer division (or using `Math.floor`), dividing integers rounds down. To compute ceiling using integer arithmetic without floating-point errors, use formula:
$$\lfloor \frac{\text{pile} + k - 1}{k} \rfloor$$
This correctly rounds up any fractional result to the next integer.

### 5. Design and Tradeoff Questions
**Question:** What is the difference between Binary Search on the Answer and Ternary Search?
- **Expected answer shape:** Binary Search on the Answer operates on monotonic boolean predicates (`[False, ..., True]`) with two choices ($L$ or $R$). Ternary Search finds the minimum or maximum of a unimodal function (a function that strictly increases then strictly decreases, or vice-versa) by dividing the range into three parts with two midpoints.

### 6. Senior Follow-ups: Node.js Autoscaling Bounds
**Question:** How can binary search on the answer be applied in production to automatically tune the batch size of an ETL data ingestion pipeline in Node.js?
- **Expected answer shape:** The search range is batch size `[1 ... 10,000]`. The feasibility predicate tests whether a batch size causes event-loop latency to exceed 50 ms or database query timeouts to occur. By binary searching batch sizes during warm-up runs, the system identifies the maximum stable throughput batch size in $\approx 14$ iterations without overwhelming production resources.

<nav aria-label="Lecture navigation">

[Previous: Binary Search on Rotated Arrays and Peaks](day-27-binary-search-rotated-arrays-and-peaks.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Singly and Doubly Linked Lists](day-29-singly-and-doubly-linked-lists.md)

</nav>
