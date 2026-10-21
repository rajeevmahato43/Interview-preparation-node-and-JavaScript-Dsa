# Day 17: Binary Search on Solution Space

<nav aria-label="Lecture navigation">

[Previous: Binary Search Bounds & Rotated Arrays](day-16-binary-search-bounds-and-rotated-arrays.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Recursion Fundamentals & Call Stack](day-18-recursion-fundamentals-and-call-stack.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Complexity analysis of composite functions ($O(n \log R)$).
- [Day 03: Searching & Elementary Sorting Algorithms](day-03-searching-and-sorting-algorithms.md) — Classic binary search mechanics.
- [Day 16: Binary Search Bounds & Rotated Arrays](day-16-binary-search-bounds-and-rotated-arrays.md) — Lower bound and search window reduction.

---

## 1. What is Binary Search on Solution Space?

In classic binary search, you search across an explicit array of stored numbers. In **Binary Search on Solution Space** (also known as *Binary Search on the Answer*), there is **no array**. Instead, you search across a continuous mathematical range of possible answers:
$$\text{Range} = [\text{minPossibleAnswer} \dots \text{maxPossibleAnswer}]$$

> **Solution Space**: The bounded set of all numerically possible answers to a problem, bounded by a theoretical minimum `low` and maximum `high`.

> **Monotonic Feasibility Function (Predicate)**: A validation helper function `canAchieve(candidate)` that returns `true` or `false`. Crucially, this function must be **monotonic**: if a candidate answer $k$ is feasible, every value greater than $k$ (or smaller than $k$) is also guaranteed to be feasible.

> **Feasibility Curve**:
> ```text
> Values:     1    2    3    4    5    6    7    8    9    10
> Feasible?:  F    F    F    F    T    T    T    T    T    T
>                                 ▲
>                               Goal: Find the very first 'True' (Minimum valid answer)
> ```

### Everyday Physical Analogies

#### The Factory Conveyor Speed Dial
Imagine managing a packaging conveyor belt at a chocolate factory:
1. You have a dial with speeds from 1 box/min to 1,000 boxes/min.
2. If you set the speed to 10 boxes/min, the chocolate piles up and spoils (**Infeasible: False**).
3. If you set the speed to 1,000 boxes/min, the machine runs easily without spoiling, but wastes immense electricity (**Feasible: True**).
4. You do not test every single speed from 1 to 1,000.
5. You test the midpoint (500 boxes/min). If 500 works, you know 600, 700, and 1,000 will also work! You discard the upper 500 speeds and binary search between 1 and 500 to find the **minimum viable speed**.

---

## 2. How Binary Search on Solution Space Works Step-by-Step

### 1. The 3-Part Architecture

Every solution space problem is solved using the exact same three structural components:

1. **Step 1: Determine the Search Range (`low` and `high`)**:
   - `low`: The absolute theoretical minimum possible answer (e.g., minimum speed = 1, or maximum single package weight).
   - `high`: The worst-case maximum possible answer (e.g., maximum pile size, or sum of all package weights).
2. **Step 2: Build the Monotonic Feasibility Helper**:
   - Write a helper `canAchieve(mid, ...data)` that simulates the process in linear $O(n)$ time and returns a Boolean.
3. **Step 3: Execute Binary Search**:
   - If `canAchieve(mid)` is `true`: `mid` is a valid answer. Record `ans = mid` and search left (`high = mid - 1`) to see if a smaller valid answer exists.
   - If `canAchieve(mid)` is `false`: `mid` is too small. Search right (`low = mid + 1`).

---

### 2. Concrete Trace: Koko Eating Bananas

Given `piles = [3, 6, 7, 11]`, allowed hours $H = 8$. Find the minimum hourly eating speed $k$.

#### Determining the Range:
- Minimum speed `low = 1` (cannot eat 0 bananas/hour).
- Maximum speed `high = 11` (eating faster than the largest pile in 1 hour provides no extra benefit).

#### Feasibility Function `canFinish(speed, H)`:
For each pile, hours needed = $\lceil \text{pile} / \text{speed} \rceil = \lfloor (\text{pile} + \text{speed} - 1) / \text{speed} \rfloor$.

```text
Trace over Search Space [ 1 ... 11 ]:
low = 1, high = 11.

Pass 1:
  mid = 1 + Math.floor((11 - 1) / 2) = 6.
  Test speed = 6:
    Pile 3: ceil(3 / 6) = 1 hr
    Pile 6: ceil(6 / 6) = 1 hr
    Pile 7: ceil(7 / 6) = 2 hrs
    Pile 11: ceil(11 / 6) = 2 hrs
    Total = 1 + 1 + 2 + 2 = 6 hrs.
  Is 6 hrs <= 8 hrs? YES (True)!
  Candidate ans = 6. Can we go slower? high = mid - 1 = 5.

Pass 2:
  low = 1, high = 5 -> mid = 3.
  Test speed = 3:
    Pile 3: 1 hr; Pile 6: 2 hrs; Pile 7: 3 hrs; Pile 11: 4 hrs.
    Total = 1 + 2 + 3 + 4 = 10 hrs.
  Is 10 hrs <= 8 hrs? NO (False, too slow!).
  Must speed up: low = mid + 1 = 4.

Pass 3:
  low = 4, high = 5 -> mid = 4.
  Test speed = 4:
    ceil(3/4)=1; ceil(6/4)=2; ceil(7/4)=2; ceil(11/4)=3. Total = 8 hrs.
  Is 8 hrs <= 8 hrs? YES (True)!
  Candidate ans = 4. Squeeze left: high = mid - 1 = 3.

Termination: low (4) > high (3).
Minimum speed = 4 bananas per hour!
```

---

### 3. Maximizing the Minimum Distance (Aggressive Cows / Ball Allocation)

While Koko seeks the **minimum** feasible value (first `True`), problems like *Magnetic Force Between Two Balls* (LeetCode 1552) or *Aggressive Cows* ask to **maximize the minimum distance** $d$ between placed items.
- If distance $d = 2$ allows placing all $m$ balls, then any distance $< 2$ also trivially works:
  $$\text{Feasibility: } T, T, T, T, F, F, F$$
- Our goal is to find the **last `True`**!
- If `canPlace(d)` is `true`: Record `ans = d`, try a larger gap $\to$ `low = mid + 1`.
- If `canPlace(d)` is `false`: Gap is too wide $\to$ `high = mid - 1`.

```javascript
// ✅ PATTERN: Maximizing minimum distance
function maxDistance(position, m) {
  position.sort((a, b) => a - b);
  let low = 1;
  let high = position[position.length - 1] - position[0];
  let ans = 1;

  function canPlace(minDist) {
    let count = 1;
    let lastPos = position[0];
    for (let i = 1; i < position.length; i++) {
      if (position[i] - lastPos >= minDist) {
        count++;
        lastPos = position[i];
      }
      if (count >= m) return true;
    }
    return false;
  }

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (canPlace(mid)) {
      ans = mid;     // Distance works; try to find even LARGER distance!
      low = mid + 1; // Squeeze right
    } else {
      high = mid - 1;// Distance too wide; squeeze left
    }
  }

  return ans;
}

// Example test run
console.log(maxDistance([1, 2, 4, 8, 9], 3)); // 3 (Place at 1, 4, 8 -> min gap 3)
```

---

## 3. Pattern Recognition of Solution Space Problems

### Problem Triggers and Keywords

| Problem Keyword | What the Interviewer Means | Solution Space Bounds |
| :--- | :--- | :--- |
| **"Minimum speed to finish in $H$ hours"** | Smallest rate where total hours $\le H$. | `low = 1, high = max(piles)` |
| **"Capacity to ship packages in $D$ days"** | Smallest truck capacity where days $\le D$. | `low = max(weights), high = sum(weights)` |
| **"Split array into $M$ subarrays with minimum largest sum"** | Smallest subarray sum where partitions $\le M$. | `low = max(nums), high = sum(nums)` |
| **"Magnetic force between balls / Aggressive cows"** | Largest minimum distance between placed items. | `low = 1, high = max(pos) - min(pos)` |
| **"Kth smallest pair distance"** | Smallest distance with $\ge K$ pairs. | `low = 0, high = max - min` |

### The $10^7$ Rule for Solution Space
- The solution space range $R = \text{high} - \text{low}$ is searched in $O(\log R)$ iterations.
- If $R = 10^9$, $\log_2(10^9) \approx 30$ iterations.
- Inside each iteration, the verification helper takes $O(n)$ time.
- Total time: $O(n \log R)$. For $n = 10^5$, total operations $\approx 30 \times 10^5 = 3 \times 10^6$, executing in **under 20 milliseconds** in Node.js!

---

## 4. Problem 1: Koko Eating Bananas (LeetCode 875)

### Problem Statement
Koko loves to eat bananas. There are $n$ piles of bananas, the $i^{\text{th}}$ pile has `piles[i]` bananas. The guards have gone and will come back in $h$ hours.
Koko can decide her bananas-per-hour eating speed of $k$. Each hour, she chooses some pile of bananas and eats $k$ bananas from that pile. If the pile has less than $k$ bananas, she eats all of them instead and will not eat any more bananas during this hour.
Return the **minimum integer $k$** such that she can eat all the bananas within $h$ hours.

```text
Input: piles = [3, 6, 7, 11], h = 8
Output: 4

Input: piles = [30, 11, 23, 4, 20], h = 5
Output: 30

Input: piles = [30, 11, 23, 4, 20], h = 6
Output: 23
```

### Step 1: Physical Simulation
Imagine bowls of bananas on a table: `[3, 6, 7, 11]`, clock has 8 ticks.
- If Koko eats at speed 1: Bowl 11 takes 11 hours alone! Exceeds 8 hours immediately.
- If Koko eats at speed 11:
  - Bowl 3 takes 1 hr; Bowl 6 takes 1 hr; Bowl 7 takes 1 hr; Bowl 11 takes 1 hr.
  - Total = 4 hours. Easily finishes within 8 hours.
- We want the slowest possible speed between 1 and 11 that finishes in $\le 8$ hours.
- We binary search the speed dial $[1 \dots 11]$.

### Step 2: Brute Force Approach
Test every speed $k = 1, 2, 3, \dots, \max(\text{piles})$ sequentially until one finishes in $\le h$ hours:

```javascript
function minEatingSpeedBrute(piles, h) {
  let maxPile = Math.max(...piles);
  for (let speed = 1; speed <= maxPile; speed++) {
    let hours = 0;
    for (const pile of piles) {
      hours += Math.ceil(pile / speed);
    }
    if (hours <= h) return speed;
  }
  return maxPile;
}
```
- **Time Complexity**: $O(n \times \max(\text{piles}))$. If $\max(\text{piles}) = 10^9$, this performs $10^{14}$ operations and will **time out completely**.
- **Space Complexity**: $O(1)$.

### Step 3: Bottleneck
Where is the CPU sweating?
Testing every integer speed sequentially is wasteful because feasibility is strictly monotonic. If speed 50 works, we never need to test 51 through 100!

### Step 4: The Pattern Discovery
Replace the linear $O(R)$ speed loop with a **Binary Search over the Answer Range** $[1 \dots \max(\text{piles})]$, reducing tests from $10^9$ to only $30$.

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: O(n log(maxPile)) Solution Space Binary Search
function minEatingSpeed(piles, h) {
  let low = 1;
  let high = 0;
  for (const pile of piles) {
    if (pile > high) high = pile; // Fast manual max
  }

  let ans = high;

  // Helper: Can Koko finish all piles within h hours at speed 'speed'?
  function canFinish(speed) {
    let hours = 0;
    for (let i = 0; i < piles.length; i++) {
      // Math.ceil(piles[i] / speed)
      hours += Math.ceil(piles[i] / speed);
      if (hours > h) return false; // Early exit optimization
    }
    return hours <= h;
  }

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);

    if (canFinish(mid)) {
      ans = mid;      // Feasible speed; record candidate
      high = mid - 1; // Squeeze left to find slower valid speed
    } else {
      low = mid + 1;  // Too slow; must increase speed
    }
  }

  return ans;
}

// ❌ ANTI-PATTERN: Integer division floor causes infinite eating loops
function buggyCanFinish(piles, speed) {
  let hours = 0;
  for (const p of piles) {
    // BUG: Math.floor(7 / 4) yields 1, ignoring the remaining 3 bananas that take another hour!
    hours += Math.floor(p / speed); 
  }
  return hours;
}

// Example test runs
console.log(minEatingSpeed([3, 6, 7, 11], 8));          // 4
console.log(minEatingSpeed([30, 11, 23, 4, 20], 5));    // 30
console.log(minEatingSpeed([30, 11, 23, 4, 20], 6));    // 23
console.log(minEatingSpeed([312884470], 312884469));    // 2
```

- **Time Complexity**: $O(n \log(\max(\text{piles})))$ — At most $\log_2(10^9) \approx 30$ passes over $n$ piles.
- **Space Complexity**: $O(1)$ — Only pointer and counter variables.

---

## 5. Problem 2: Capacity to Ship Packages Within D Days (LeetCode 1011)

### Problem Statement
A conveyor belt has packages that must be shipped from one port to another within `days` days.
The $i^{\text{th}}$ package has a weight of `weights[i]`. Each day, we load the ship with packages on the conveyor belt in the **order given by `weights`**. We cannot load more weight than the maximum weight capacity of the ship.
Return the **least weight capacity** of the ship that will result in all packages being shipped within `days` days.

```text
Input: weights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], days = 5
Output: 15
Explanation:
Day 1: 1, 2, 3, 4, 5 (15)
Day 2: 6, 7 (13)
Day 3: 8 (8)
Day 4: 9 (9)
Day 5: 10 (10)

Input: weights = [3, 2, 2, 4, 1, 4], days = 3
Output: 6

Input: weights = [1, 2, 3, 1, 1], days = 4
Output: 3
```

### Step 1: Physical Simulation
Packages roll past: `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`, limit = 5 days.
- What is the smallest possible ship?
  - The heaviest single package weighs `10`. If ship capacity is `9`, package `10` can never be loaded! Thus, `low = 10`.
- What is the largest ship we would ever need?
  - A ship that carries all packages in 1 single day! Capacity = $\sum \text{weights} = 55$. Thus, `high = 55`.
- Range to search: $[10 \dots 55]$.
- Test midpoint `(10 + 55) / 2 = 32`:
  - Day 1: 1..7 (28). Day 2: 8..10 (27). Total days = 2.
  - Can we ship in $\le 5$ days with capacity 32? Yes (takes only 2 days). Try smaller capacity! Squeeze left: `high = 31`.

### Step 2: Brute Force Approach
Increment ship capacity starting from `max(weights)` until day count $\le \text{days}$:

```javascript
function shipWithinDaysBrute(weights, days) {
  let cap = Math.max(...weights);
  while (true) {
    let neededDays = 1, currentLoad = 0;
    for (const w of weights) {
      if (currentLoad + w > cap) {
        neededDays++;
        currentLoad = 0;
      }
      currentLoad += w;
    }
    if (neededDays <= days) return cap;
    cap++;
  }
}
```
- **Time Complexity**: $O(n \times \sum \text{weights})$. Fails on large datasets.
- **Space Complexity**: $O(1)$.

### Step 3: Bottleneck
Where is the CPU sweating?
Linearly incrementing capacity by 1 tests thousands of redundant capacities when capacity feasibility is strictly monotonic.

### Step 4: The Pattern Discovery
Apply binary search over the capacity range $[ \max(\text{weights}) \dots \sum \text{weights} ]$.

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: O(n log(sum - max)) Solution Space Binary Search
function shipWithinDays(weights, days) {
  let low = 0;
  let high = 0;

  for (let i = 0; i < weights.length; i++) {
    if (weights[i] > low) low = weights[i]; // Must carry heaviest single package
    high += weights[i];                    // Sum of all packages
  }

  let ans = high;

  // Helper: Can we ship all packages within 'days' using capacity 'cap'?
  function canShip(cap) {
    let neededDays = 1;
    let currentLoad = 0;

    for (let i = 0; i < weights.length; i++) {
      if (currentLoad + weights[i] > cap) {
        neededDays++;       // Must start a new day
        currentLoad = 0;
      }
      currentLoad += weights[i];
    }

    return neededDays <= days;
  }

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);

    if (canShip(mid)) {
      ans = mid;      // Feasible capacity; record candidate
      high = mid - 1; // Squeeze left to find smaller capacity
    } else {
      low = mid + 1;  // Capacity too small; must increase
    }
  }

  return ans;
}

// ❌ ANTI-PATTERN: Initializing low to 1 instead of max(weights)
function buggyShipWithinDays(weights, days) {
  let low = 1; // BUG: If capacity is tested below max(weights), package exceeds capacity!
  let high = weights.reduce((a, b) => a + b, 0);
  // Causes infinite day increment or invalid states
}

// Example test runs
console.log(shipWithinDays([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5)); // 15
console.log(shipWithinDays([3, 2, 2, 4, 1, 4], 3));                // 6
console.log(shipWithinDays([1, 2, 3, 1, 1], 4));                   // 3
```

- **Time Complexity**: $O(n \log(\sum \text{weights} - \max(\text{weights})))$ — Binary search takes at most $\approx 32$ iterations over array of size $n$.
- **Space Complexity**: $O(1)$ — Constant memory.

---

## 6. Under the Hood: V8 & Node.js

### Floating-Point vs Integer Division Ceiling
In `canFinish` for Koko Eating Bananas:
```javascript
// Method A (Floating-point)
hours += Math.ceil(pile / speed);

// Method B (Pure Integer Arithmetic)
hours += Math.floor((pile + speed - 1) / speed);
```
1. **Method A (`Math.ceil`)**:
   - `pile / speed` generates an IEEE-754 64-bit float.
   - For numbers $< 2^{53} - 1$, precision is exact.
   - However, converting to float and calling `Math.ceil()` involves V8 runtime math library calls.
2. **Method B (Integer Math)**:
   - `Math.floor((pile + speed - 1) / speed)` stays within integer representation.
   - TurboFan can compile Method B into single machine division instructions (`IDIV`).
   - In micro-benchmarks with $10^7$ iterations, Method B is **1.5x to 2x faster** in Node.js.

### Safe BigInt Transitions for Massive Answer Ranges
What happens if the solution space range exceeds $2^{53} - 1$ ($9,007,199,254,740,991$)?
- In problems with huge bounds (e.g., $10^{18}$ search space):
- Standard JavaScript numbers lose precision at $2^{53}$. Adding `low + high` loses the lowest bits, resulting in **infinite loops** where `mid` never changes!
- In Node.js, use JavaScript `BigInt` (`0n`, `1n`, `mid = (low + high) / 2n`) when search bounds can exceed $2^{53}$.

---

## 7. Hands-On Exercise

### The Scenario
You are building an arithmetic verification utility for an embedded cryptography service in Node.js.
You must implement `mySqrt(x)` which computes and returns the **integer square root** of a non-negative integer $x$, truncated down to the nearest integer.
You may not use any built-in exponent functions like `Math.sqrt` or `x ** 0.5`.

```text
Input: x = 4 -> Output: 2
Input: x = 8 -> Output: 2 (2.828... truncated to 2)
```

### The Buggy Code
```javascript
function mySqrtBuggy(x) {
  // Bug 1: Linear scan O(x) takes billions of iterations on x = 2^31 - 1!
  // Bug 2: Off-by-one returns ceiling instead of floor on non-perfect squares.
  for (let i = 0; i <= x; i++) {
    if (i * i === x) return i;
    if (i * i > x) return i; // BUG: Should return i - 1!
  }
}
```

### Acceptance Criteria
1. Must execute in **$O(\log x)$ time**.
2. Must truncate toward zero (floor) without library square root calls.
3. Handles edge cases: $x = 0$ and $x = 1$.
4. Verified with direct test execution.

### Verified Solution

```javascript
// ✅ CORRECT: O(log x) Binary Search on Integer Square Root
function mySqrt(x) {
  if (x < 2) return x; // 0 -> 0, 1 -> 1

  let low = 1;
  let high = Math.floor(x / 2); // For x >= 4, sqrt(x) is always <= x / 2
  let ans = 1;

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    const square = mid * mid;

    if (square === x) {
      return mid; // Exact square found
    } else if (square < x) {
      ans = mid;      // Candidate found (floor)
      low = mid + 1;  // Squeeze right for larger potential integer root
    } else {
      high = mid - 1; // Square exceeds x; search left
    }
  }

  return ans;
}

// Example test runs
console.log(mySqrt(4));          // 2
console.log(mySqrt(8));          // 2
console.log(mySqrt(0));          // 0
console.log(mySqrt(1));          // 1
console.log(mySqrt(16));         // 4
console.log(mySqrt(2147395599)); // 46339 (Max 32-bit root)
```

---

## 8. Tricky Points and Edge Cases

### 1. Correct Initialization of `low`
A frequent trap in capacity and partitioning problems is initializing `low = 1` or `low = 0`.
- In *Capacity to Ship Packages*, if the heaviest package weighs 50, a ship with capacity 40 can **never** load that package, causing infinite loops.
- **Rule**: `low` must be initialized to **$\max(\text{weights})$**, not 1!

### 2. Correct Initialization of `high`
- In *Koko Eating Bananas*, `high = \max(\text{piles})` because eating faster than the largest pile in one hour provides no benefit.
- In *Capacity to Ship Packages*, `high = \sum \text{weights}` because a ship that takes all packages in 1 day requires that total capacity.

### 3. Early Exit in Feasibility Helper
In `canFinish` or `canShip`, add an early break:
```javascript
if (neededDays > days) return false;
```
If the threshold is exceeded halfway through the array, stopping immediately saves thousands of unnecessary loop iterations.

---

## 9. Comprehensive Summary

- **Binary Search on Solution Space** searches across a bounded mathematical range of candidate answers $[ \text{low} \dots \text{high} ]$ rather than an indexed array.
- **Monotonicity Requirement**: The feasibility helper `canAchieve(candidate)` must be monotonic ($F, F, F, T, T, T$), allowing half of the answer space to be discarded on each comparison.
- **Time Complexity**: Combines binary search iterations ($O(\log R)$) with linear validation passes ($O(n)$), resulting in total time $O(n \log R)$.
- **Bounds Hygiene**: In packaging/partitioning problems, `low = \max(\text{items})` and `high = \sum \text{items}`.
- **Integer Ceiling**: Compute $\lceil a / b \rceil$ safely with `Math.ceil(a / b)` or integer formula `Math.floor((a + b - 1) / b)`.

---

## 10. Cheat Sheet

### Common Solution Space Formulations

| Problem | `low` Bound | `high` Bound | Monotonic Condition | Goal |
| :--- | :--- | :--- | :--- | :--- |
| **Koko Eating Bananas** | `1` | `max(piles)` | `hoursNeeded <= h` | Minimize speed (first True) |
| **Ship Packages in D Days** | `max(weights)` | `sum(weights)` | `daysNeeded <= days` | Minimize capacity (first True) |
| **Split Array Largest Sum** | `max(nums)` | `sum(nums)` | `piecesNeeded <= k` | Minimize max sum (first True) |
| **Aggressive Cows / Balls** | `1` | `max(pos) - min(pos)` | `ballsPlaced >= k` | Maximize min dist (last True) |
| **Integer Sqrt(x)** | `1` | `Math.floor(x / 2)` | `mid * mid <= x` | Maximize root (last True) |

### Common Pitfalls List
- **Underestimating `low`**: Setting `low = 1` when items cannot be split, causing capacity violation.
- **Overestimating `high`**: Setting `high = Infinity` instead of calculating a valid upper bound.
- **Ceiling Division Bug**: Using integer floor `Math.floor(a / b)` instead of ceiling in time calculation.
- **Missing Early Exit**: Scanning all $n$ items even after feasibility is already violated.

---

## 11. Interview Q&A

### 45-Second Technical Pitch
> *"Binary Search on Solution Space applies logarithmic search to continuous answer ranges rather than discrete arrays. Whenever a problem asks to find the minimum or maximum value that satisfies a monotonic constraint—such as Koko Eating Bananas or Shipping Packages—we establish a bounded search space between theoretical minimum and maximum answers. In each step, an O(n) feasibility helper simulates whether the candidate answer works. Because feasibility is monotonic, a successful check allows us to discard the more expensive half of the answer space, reducing overall complexity to O(n log R). In high-scale Node.js systems, this technique optimizes dynamic rate limiters, memory buffer sizing, and batch job scheduling."*

### 1. How do you prove that a problem is solvable using Binary Search on Solution Space?
**Answer:**
You must prove that the problem possesses **monotonicity** with respect to the candidate answer:
1. Define a feasibility predicate function $P(x)$ that returns `true` if answer $x$ is valid, and `false` otherwise.
2. Prove that if $P(x)$ is `true`, then for all $y > x$, $P(y)$ is also guaranteed to be `true` (or conversely, if seeking a maximum, if $P(x)$ is true, all $y < x$ are true).
3. If the truth values form a monotonic sequence ($\text{False, False, False, True, True, True}$), the problem is equivalent to finding the boundary inflection point (Lower Bound), which can be solved in $O(n \log R)$ time via binary search.

### 2. What will the following code output in Node.js, and why?
```javascript
console.log(Math.ceil(7 / 3));
console.log(Math.floor((7 + 3 - 1) / 3));
console.log(Math.floor(7 / 3));
```
**Answer:**
It outputs:
`3`
`3`
`2`
`Math.ceil(7 / 3)` calculates $7 / 3 = 2.333\dots \to 3$.
`Math.floor((7 + 3 - 1) / 3)` calculates $(7 + 2) / 3 = 9 / 3 = 3$. This integer formula computes the mathematical ceiling without floating-point arithmetic.
`Math.floor(7 / 3)` truncates down to `2`, which incorrectly loses the remaining 1 unit that requires an additional hour or trip.

### 3. Spot and fix the bug in this capacity search helper:
```javascript
function canShipBuggy(weights, cap, days) {
  let count = 0;
  let current = 0;
  for (let w of weights) {
    current += w;
    if (current >= cap) {
      count++;
      current = 0;
    }
  }
  return count <= days;
}
```
**Answer:**
There are two critical bugs:
1. `count` must start at `1` (day 1), not `0`. If total weights are less than `cap`, `count` remains `0`!
2. If `current + w > cap`, package `w` cannot be discarded; it must be placed onto the **next day's load** (`current = w`). Setting `current = 0` completely drops package `w` from the shipment!
**Fix**:
```javascript
let count = 1, current = 0;
for (let w of weights) {
  if (current + w > cap) {
    count++;
    current = 0;
  }
  current += w;
}
```

### 4. Why is the time complexity of Koko Eating Bananas $O(n \log(\max(\text{piles})))$ and not $O(n \log n)$?
**Answer:**
The binary search is **not** performed over the $n$ elements of the `piles` array.
The binary search is performed over the range of possible **speeds** from $1$ to $\max(\text{piles})$.
The search space size is $R = \max(\text{piles})$. The binary search cuts this range in half on each step, requiring at most $\log_2(R)$ iterations.
In each iteration, the `canFinish` function loops through all $n$ piles to calculate total hours ($O(n)$ work).
Multiplying the iterations by the work per iteration yields:
$$T(n) = O(n \log(\max(\text{piles})))$$

---

## 12. Practice Problems

### 1. Koko Eating Bananas - Medium
Find minimum integer speed to eat all bananas within $h$ hours.
- **Sample Input 1:** `piles = [3, 6, 7, 11]`, `h = 8`
- **Expected Output 1:** `4`
- **Sample Input 2:** `piles = [30, 11, 23, 4, 20]`, `h = 5`
- **Expected Output 2:** `30`

### 2. Capacity to Ship Packages Within D Days - Medium
Find least ship capacity to ship all packages in $d$ days.
- **Sample Input 1:** `weights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`, `days = 5`
- **Expected Output 1:** `15`
- **Sample Input 2:** `weights = [3, 2, 2, 4, 1, 4]`, `days = 3`
- **Expected Output 2:** `6`

### 3. Sqrt(x) - Easy
Compute and return the integer square root of $x$ truncated to nearest integer.
- **Sample Input 1:** `x = 4`
- **Expected Output 1:** `2`
- **Sample Input 2:** `x = 8`
- **Expected Output 2:** `2`

### 4. Split Array Largest Sum - Hard
Split array into $k$ non-empty continuous subarrays to minimize the largest sum among them.
- **Sample Input 1:** `nums = [7, 2, 5, 10, 8]`, `k = 2`
- **Expected Output 1:** `18` (Splits: `[7, 2, 5]` and `[10, 8]`)
- **Sample Input 2:** `nums = [1, 2, 3, 4, 5]`, `k = 2`
- **Expected Output 2:** `9`

---

<nav aria-label="Lecture navigation">

[Previous: Binary Search Bounds & Rotated Arrays](day-16-binary-search-bounds-and-rotated-arrays.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Recursion Fundamentals & Call Stack](day-18-recursion-fundamentals-and-call-stack.md)

</nav>
