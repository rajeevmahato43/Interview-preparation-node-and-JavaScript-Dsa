# Day 17: Binary Search on Solution Space

<nav aria-label="Lecture navigation">

[Previous: Binary Search Bounds & Rotated Arrays](day-16-binary-search-bounds-and-rotated-arrays.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Recursion Fundamentals & Call Stack](day-18-recursion-fundamentals-and-call-stack.md)

</nav>

---

## 1. Solution Space Search Foundation

In classic binary search, you search across an explicit array of stored numbers. In **Binary Search on Solution Space** (also known as *Binary Search on the Answer*), there is no array in memory. Instead, you search across a continuous numerical range of possible answers:

$$\text{Search Space Range} = [\text{minPossibleAnswer} \dots \text{maxPossibleAnswer}]$$

Whenever a problem asks for the **minimum** or **maximum** rate, capacity, speed, or distance required to satisfy a condition, the solution space exhibits a **Monotonic Feasibility Curve**:
- If a candidate speed $k$ is fast enough to finish on time, any speed greater than $k$ is also guaranteed to finish on time.
- If a candidate speed $k$ is too slow, any speed less than $k$ will also fail.

```text
MONOTONIC FEASIBILITY CURVE:
Candidate Speeds: 1    2    3    4    5    6    7    8    9    10
Is Feasible?:     F    F    F    F    T    T    T    T    T    T
                                      ▲
                           Goal: Find first 'T' (Minimum valid answer)
```

Imagine managing a chocolate packaging conveyor belt at a confectionery factory:
- You have a control dial with speeds ranging from 1 box per minute to 1,000 boxes per minute.
- At 10 boxes/min, chocolate accumulates and overflows (**Infeasible: False**).
- At 1,000 boxes/min, the machine easily packs every chocolate, but consumes excessive electricity (**Feasible: True**).
- You do not test every single speed from 1 to 1,000 sequentially.
- You test the midpoint (500 boxes/min). If 500 works, you know that 501 through 1,000 will also work. You discard the upper 500 speeds and binary search between 1 and 500 to pinpoint the **minimum viable speed**.

A basic solution-space binary search calculating integer square roots in JavaScript:

```javascript
// Integer Square Root: Find largest integer r where r * r <= x
function mySqrt(x) {
  if (x < 2) return x; // 0 -> 0, 1 -> 1

  let low = 1;
  let high = Math.floor(x / 2); // For x >= 4, sqrt(x) <= x / 2
  let ans = 1;

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    const square = mid * mid;

    if (square === x) {
      return mid;
    } else if (square < x) {
      ans = mid;     // Candidate found
      low = mid + 1; // Squeeze right for larger potential integer root
    } else {
      high = mid - 1; // Square exceeds x; squeeze left
    }
  }

  return ans;
}

console.log(mySqrt(4));  // 2
console.log(mySqrt(8));  // 2 (2.828... truncated to 2)
console.log(mySqrt(16)); // 4
```

### 1.1 The 3-Part Architecture & Monotonic Feasibility

Every solution space problem follows a uniform three-part architectural structure:

1. **Establish the Range (`low` and `high`)**:
   - `low`: The absolute theoretical minimum possible answer (e.g., minimum eating speed = 1, or maximum individual package weight).
   - `high`: The worst-case theoretical maximum possible answer (e.g., maximum pile size, or the cumulative sum of all packages).
2. **Build the Feasibility Predicate Function**:
   - Construct a helper function `canAchieve(mid, ...data)` that simulates the operation in linear $O(n)$ time and returns a boolean (`true` or `false`).
3. **Execute the Binary Search**:
   - If `canAchieve(mid)` is `true`: `mid` is valid. Record `ans = mid` and search left (`high = mid - 1`) to find a smaller valid answer.
   - If `canAchieve(mid)` is `false`: `mid` is insufficient. Search right (`low = mid + 1`).

> [!NOTE]
> Self-Check: Why must the feasibility predicate function be monotonic?
> Answer: If the feasibility function alternates unpredictably (e.g. `F, T, F, T`), binary search cannot discard half the search space because eliminating a branch might discard a valid answer. Monotonicity ensures all values to one side of `mid` share the same boolean outcome.

### 1.2 Integer Division Ceilings & BigInt Safeguards

When calculating hours or trips needed in feasibility helpers:

```javascript
// Method A: Floating-point ceiling
hours += Math.ceil(pile / speed);

// Method B: Pure integer arithmetic ceiling
hours += Math.floor((pile + speed - 1) / speed);
```

While `Math.ceil()` is convenient, converting large numbers to 64-bit floats and calling external math functions incurs minor V8 runtime overhead. Pure integer arithmetic `Math.floor((pile + speed - 1) / speed)` is compiled by TurboFan into native integer division instructions (`IDIV`), executing up to $2\times$ faster in hot loops.

If the search space exceeds JavaScript's safe integer limit ($2^{53} - 1$), use `BigInt`:

```javascript
let low = 1n;
let high = 1000000000000000000n; // 10^18
const mid = low + (high - low) / 2n;
```

### 1.3 Solution Space Formulations Reference Table

| Problem Form | `low` Boundary | `high` Boundary | Feasibility Condition | Target Goal |
| :--- | :--- | :--- | :--- | :--- |
| **Minimum Rate (Koko Bananas)** | `1` | $\max(\text{piles})$ | `hoursNeeded <= h` | Minimize rate (first `True`) |
| **Minimum Capacity (Ship Packages)**| $\max(\text{weights})$ | $\sum \text{weights}$ | `daysNeeded <= days` | Minimize capacity (first `True`) |
| **Partition Sum (Split Array)** | $\max(\text{nums})$ | $\sum \text{nums}$ | `piecesNeeded <= k` | Minimize max sum (first `True`) |
| **Max Minimum Gap (Balls / Cows)** | `1` | $\max(\text{pos}) - \min(\text{pos})$ | `ballsPlaced >= m` | Maximize gap (last `True`) |
| **Integer Square Root** | `1` | $\lfloor x / 2 \rfloor$ | `mid * mid <= x` | Maximize root (last `True`) |

---

## 2. Solution Space Patterns

### 2.1 Pattern Family

Solution space problems fall into three architectural categories:

- **Minimizing the Maximum Threshold (Capacity / Speed)**: Finding the smallest capacity or speed such that all tasks finish within an allowed limit. Feasibility curve is `F, F, F, T, T, T`.
- **Maximizing the Minimum Distance (Geometric Allocation)**: Placing $k$ items into discrete positions such that the minimum distance between any pair is as large as possible. Feasibility curve is `T, T, T, F, F, F`.
- **Threshold Counting (K-th Matrix Element)**: Counting how many numbers in a range are less than or equal to a candidate value to pinpoint rank boundaries.

### 2.2 Pattern Recognition Table

| Problem Trigger / Keywords | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| "Minimum eating speed to finish in $H$ hours" | Smallest hourly rate where total hours $\le H$ | Range $[1 \dots \max(\text{piles})]$, ceiling sum |
| "Least ship capacity to ship in $D$ days" | Smallest vehicle capacity where trips $\le D$ | Range $[\max(\text{weights}) \dots \sum \text{weights}]$, greedy pack |
| "Split array into $K$ subarrays to minimize largest sum" | Smallest maximum contiguous subarray sum | Range $[\max(\text{nums}) \dots \sum \text{nums}]$, greedy chunks |
| "Maximize the minimum distance between items" | Largest separation gap between $M$ items | Range $[1 \dots \max - \min]$, greedy placement |
| "Minimum days to make $M$ bouquets" | Earliest bloom day with $M$ contiguous groups | Range $[1 \dots \max(\text{bloomDays})]$, cluster count |

### 2.3 When to Use vs When NOT to Use

- **When to Use**:
  - The problem asks to **minimize a maximum** or **maximize a minimum** value.
  - The candidate answer comes from a bounded numerical range with a clear lower and upper bound.
  - A candidate answer can be verified efficiently in $O(n)$ time using a greedy simulation.
  - Feasibility exhibits strict monotonicity (if $x$ is valid, all $y > x$ are valid, or vice-versa).

- **When NOT to Use**:
  - Feasibility does not have monotonic behavior (e.g. valid configurations appear sporadically).
  - The problem asks to list or generate all valid configurations (use **Backtracking**).
  - Optimal choices at step $i$ depend on non-local historical choices (use **Dynamic Programming**).

### 2.4 The $10^7$ Operations Rule

If the solution space range is $R = 10^9$, binary search requires at most $\lceil \log_2(10^9) \rceil \approx 30$ iterations. 

Within each iteration, a linear feasibility scan over an array of size $n = 10^5$ executes $10^5$ operations. Total operations:

$$30 \times 10^5 = 3 \times 10^6 \text{ operations} \ll 10^7 \text{ budget}$$

The algorithm executes in **under 20 milliseconds** in Node.js, whereas testing speeds linearly ($O(n \times R)$) would take $10^{14}$ operations, causing an immediate server timeout.

---

## 3. Problem Walkthroughs

### 3.1 Koko Eating Bananas

#### 3.1.1 Problem Statement
Koko loves to eat bananas. There are `n` piles of bananas, the $i^{\text{th}}$ pile has `piles[i]` bananas. The guards have gone and will return in `h` hours.

Koko can decide her bananas-per-hour eating speed of `k`. Each hour, she chooses some pile of bananas and eats `k` bananas from that pile. If the pile has less than `k` bananas, she eats all of them instead and will not eat any more bananas during that hour.

Return the **minimum integer `k`** such that she can eat all the bananas within `h` hours.

```text
Input: piles = [3, 6, 7, 11], h = 8       ──> Output: 4
Input: piles = [30, 11, 23, 4, 20], h = 5  ──> Output: 30
Input: piles = [30, 11, 23, 4, 20], h = 6  ──> Output: 23
```

#### 3.1.2 How to Think About It
Imagine 4 bowls of bananas on a table: `[3, 6, 7, 11]`. A clock is set to 8 hours.

- If Koko chooses speed 1 banana/hour: Bowl 11 alone takes 11 hours! She exceeds 8 hours immediately.
- If Koko chooses speed 11 bananas/hour: 
  - Bowl 3 takes 1 hour.
  - Bowl 6 takes 1 hour.
  - Bowl 7 takes 1 hour.
  - Bowl 11 takes 1 hour.
  - Total = 4 hours. She finishes well before the 8-hour limit.
- We want the **slowest possible speed** between 1 and 11 that finishes in $\le 8$ hours.
- Rather than checking speeds 1, 2, 3, 4... one by one, test the midpoint speed 6. 
- At speed 6: $\lceil 3/6 \rceil + \lceil 6/6 \rceil + \lceil 7/6 \rceil + \lceil 11/6 \rceil = 1 + 1 + 2 + 2 = 6$ hours ($\le 8$). 
- Speed 6 works! Can she go slower? Squeeze search range to $[1 \dots 5]$.

```text
Binary Search over Speed Space [ 1 ... 11 ]:
Pass 1: mid = 6 -> Total hours = 6 <= 8 (True)  -> Record ans = 6, high = 5
Pass 2: mid = 3 -> Total hours = 10 > 8 (False) -> Too slow! low = 4
Pass 3: mid = 4 -> Total hours = 8 <= 8 (True)  -> Record ans = 4, high = 3
low (4) > high (3) -> Terminate. Minimum speed = 4!
```

#### 3.1.3 Brute Force Approach & Bottleneck
Incrementing speed $k$ by 1 until total hours $\le h$:

```javascript
function minEatingSpeedBrute(piles, h) {
  let speed = 1;
  while (true) {
    let hours = 0;
    for (const pile of piles) {
      hours += Math.ceil(pile / speed);
    }
    if (hours <= h) return speed;
    speed++;
  }
}
```

The bottleneck is $O(n \times \max(\text{piles}))$. When $\max(\text{piles}) = 10^9$, checking speeds sequentially takes $10^{14}$ operations, freezing the Node.js event loop.

#### 3.1.4 The Pattern Insight
Feasibility is strictly monotonic. If speed $k$ is feasible, every speed $> k$ is also feasible. 

Search the speed space $[1 \dots \max(\text{piles})]$ using binary search. Each step evaluates hours in $O(n)$ time, cutting candidate speeds in half each iteration.

#### 3.1.5 Pseudocode
```text
function minEatingSpeed(piles, h):
  low = 1, high = max(piles), ans = high

  helper canFinish(speed):
    hours = 0
    for each pile in piles:
      hours = hours + ceil(pile / speed)
    return hours <= h

  while low <= high:
    mid = low + floor((high - low) / 2)
    if canFinish(mid):
      ans = mid
      high = mid - 1
    else:
      low = mid + 1

  return ans
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Binary search on eating speed range [1, max(piles)]
function minEatingSpeed(piles, h) {
  let low = 1;
  let high = 0;

  for (let i = 0; i < piles.length; i++) {
    if (piles[i] > high) high = piles[i];
  }

  let ans = high;

  function canFinish(speed) {
    let hours = 0;
    for (let i = 0; i < piles.length; i++) {
      // Math.ceil equivalent using integer arithmetic: Math.floor((piles[i] + speed - 1) / speed)
      hours += Math.ceil(piles[i] / speed);
      if (hours > h) return false; // Early exit optimization
    }
    return hours <= h;
  }

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);

    if (canFinish(mid)) {
      ans = mid;      // Feasible speed; record candidate
      high = mid - 1; // Try to find a slower valid speed
    } else {
      low = mid + 1;  // Too slow; increase speed
    }
  }

  return ans;
}

// Example runs
console.log(minEatingSpeed([3, 6, 7, 11], 8));       // 4
console.log(minEatingSpeed([30, 11, 23, 4, 20], 5)); // 30
console.log(minEatingSpeed([30, 11, 23, 4, 20], 6)); // 23
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Using Math.floor division loses fractional hours
function buggyCanFinish(piles, speed, h) {
  let hours = 0;
  for (const p of piles) {
    // BUG: Math.floor(7 / 4) yields 1, completely ignoring the 3 leftover bananas!
    hours += Math.floor(p / speed);
  }
  return hours <= h;
}
```

#### 3.1.8 Complexity Derivation
- **Time Complexity**: $O(n \log(\max(\text{piles})))$. Binary search runs in $\log_2(\max(\text{piles})) \approx 30$ iterations. Each iteration performs an $O(n)$ loop through `piles`.
- **Auxiliary Space Complexity**: $O(1)$. Uses scalar integer variables.

---

### 3.2 Capacity to Ship Packages Within D Days

#### 3.2.1 Problem Statement
A conveyor belt has packages that must be shipped from one port to another within `days` days.

The $i^{\text{th}}$ package has a weight of `weights[i]`. Each day, packages are loaded onto the ship in the **strict order given by `weights`**. We cannot load more weight than the maximum capacity of the ship.

Return the **least weight capacity** of the ship that will result in all packages being shipped within `days` days.

```text
Input: weights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], days = 5  ──> Output: 15
Input: weights = [3, 2, 2, 4, 1, 4], days = 3               ──> Output: 6
Input: weights = [1, 2, 3, 1, 1], days = 4                  ──> Output: 3
```

#### 3.2.2 How to Think About It
Imagine a factory conveyor belt loaded with packages: `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`. You must hire trucks that all have the exact same weight capacity.

- What is the smallest capacity truck you could ever hire?
  - The heaviest individual package weighs `10`. If a truck has capacity `9`, package `10` can never be loaded onto any truck! Therefore, `low = 10` ($\max(\text{weights})$).
- What is the largest capacity truck you would ever need?
  - A giant truck that ships every single package in 1 day: capacity = $\sum \text{weights} = 55$. Therefore, `high = 55`.
- Range to search: $[10 \dots 55]$.
- Test capacity midpoint 32:
  - Day 1 loads: `1..7` (sum 28). Package 8 would exceed 32, so Day 1 departs.
  - Day 2 loads: `8..10` (sum 27). All packages shipped in only 2 days!
  - 2 days is $\le 5$ days. Capacity 32 is valid. Try hiring smaller trucks: search $[10 \dots 31]$.

```text
Simulation of Capacity = 15 on [ 1..10 ]:
Day 1: 1 + 2 + 3 + 4 + 5 = 15
Day 2: 6 + 7 = 13 (8 would make 21 > 15)
Day 3: 8
Day 4: 9
Day 5: 10
Total days = 5 <= 5. Valid!
```

#### 3.2.3 Brute Force Approach & Bottleneck
Linearly incrementing capacity by 1 starting from $\max(\text{weights})$:

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

The bottleneck is $O(n \times (\sum \text{weights} - \max(\text{weights})))$. For large arrays with heavy weights, scanning capacities sequentially causes execution timeouts.

#### 3.2.4 The Pattern Insight
Truck capacity feasibility is strictly monotonic. If a capacity of 15 ships all packages in 5 days, any capacity $> 15$ will also succeed. 

Search the solution space $[ \max(\text{weights}) \dots \sum \text{weights} ]$ using binary search with a greedy packing helper.

#### 3.2.5 Pseudocode
```text
function shipWithinDays(weights, days):
  low = max(weights), high = sum(weights), ans = high

  helper canShip(cap):
    neededDays = 1, currentLoad = 0
    for each w in weights:
      if currentLoad + w > cap:
        neededDays = neededDays + 1
        currentLoad = 0
      currentLoad = currentLoad + w
    return neededDays <= days

  while low <= high:
    mid = low + floor((high - low) / 2)
    if canShip(mid):
      ans = mid
      high = mid - 1
    else:
      low = mid + 1

  return ans
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Binary search on ship capacity range [max(weights), sum(weights)]
function shipWithinDays(weights, days) {
  let low = 0;
  let high = 0;

  for (let i = 0; i < weights.length; i++) {
    if (weights[i] > low) low = weights[i]; // Must carry heaviest single package
    high += weights[i];                    // Sum of all package weights
  }

  let ans = high;

  function canShip(cap) {
    let neededDays = 1;
    let currentLoad = 0;

    for (let i = 0; i < weights.length; i++) {
      if (currentLoad + weights[i] > cap) {
        neededDays++;
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

// Example runs
console.log(shipWithinDays([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5)); // 15
console.log(shipWithinDays([3, 2, 2, 4, 1, 4], 3));                // 6
console.log(shipWithinDays([1, 2, 3, 1, 1], 4));                   // 3
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Initializing low to 1 instead of max(weights)
function buggyShipWithinDays(weights, days) {
  let low = 1; // BUG: Testing capacity below max(weights) makes a package exceed total capacity!
  let high = weights.reduce((a, b) => a + b, 0);
  // canShip will enter an invalid state when an individual weight > cap
}
```

#### 3.2.8 Complexity Derivation
- **Time Complexity**: $O(n \log(\sum \text{weights} - \max(\text{weights})))$. The range is at most $5 \times 10^8$, requiring at most 32 binary search passes. Each pass loops through $n$ elements.
- **Auxiliary Space Complexity**: $O(1)$. Uses scalar integer variables.

---

### 3.3 Magnetic Force Between Two Balls

#### 3.3.1 Problem Statement
In a universe with $n$ empty baskets located at distinct positions `position[i]`, you are given an integer $m$ representing $m$ balls. 

You must distribute the balls across the baskets such that the **minimum magnetic force** between any two balls is **maximum**.

The magnetic force between two balls at positions $x$ and $y$ is $|x - y|$.

Return the maximum possible minimum magnetic force.

```text
Input: position = [1, 2, 3, 4, 7], m = 3       ──> Output: 3
Explanation: Distributing 3 balls at positions [1, 4, 7] yields minimum distance 3.

Input: position = [5, 4, 3, 2, 1, 1000000000], m = 2 ──> Output: 999999999
```

#### 3.3.2 How to Think About It
Imagine numbered posts in a straight line: `[1, 2, 3, 4, 7]`. You want to place 3 aggressive guard dogs at posts so they are as far apart from each other as possible.

- Sort the basket locations: `[1, 2, 3, 4, 7]`.
- What is the smallest possible gap between dogs? `low = 1`.
- What is the largest possible gap between dogs? `high = position[n - 1] - position[0] = 7 - 1 = 6`.
- Test gap = 3:
  - Dog 1 sits at post 1.
  - Next dog must sit at post $\ge 1 + 3 = 4$. Post 4 works! Dog 2 sits at post 4.
  - Next dog must sit at post $\ge 4 + 3 = 7$. Post 7 works! Dog 3 sits at post 7.
  - All 3 dogs placed with at least distance 3! Distance 3 is feasible.
  - Can we spread them even further? Squeeze search space right: `low = mid + 1 = 4`.

```text
Feasibility Curve (Maximizing minimum):
Gap Distance: 1    2    3    4    5    6
Feasible?:    T    T    T    F    F    F
                        ▲
             Goal: Find the last 'T' (Maximum valid gap)
```

#### 3.3.3 Brute Force Approach & Bottleneck
Testing all $\binom{n}{m}$ subset combinations to find the maximum minimum distance:

```javascript
// Combinatorial generation takes factorial/exponential time O(C(n, m))
```

Combinatorial subset generation explodes exponentially, causing immediate stack and memory exhaustion.

#### 3.3.4 The Pattern Insight
Sorting the positions takes $O(n \log n)$ time. 
Once sorted, checking if we can place $m$ balls with minimum gap $d$ is a simple **Greedy $O(n)$ scan**:
- Place first ball at `position[0]`.
- Iterate through positions; place the next ball whenever `position[i] - lastPos >= d`.
- Binary search over gap range $[1 \dots (\text{position}[n - 1] - \text{position}[0])]$ to find the largest feasible gap.

#### 3.3.5 Pseudocode
```text
function maxDistance(position, m):
  sort(position)
  low = 1, high = position[last] - position[0], ans = 1

  helper canPlace(minDist):
    count = 1, lastPos = position[0]
    for i from 1 to length(position) - 1:
      if position[i] - lastPos >= minDist:
        count = count + 1
        lastPos = position[i]
    return count >= m

  while low <= high:
    mid = low + floor((high - low) / 2)
    if canPlace(mid):
      ans = mid
      low = mid + 1 // Try finding an even larger gap!
    else:
      high = mid - 1

  return ans
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Binary search on minimum distance range [1, max - min]
function maxDistance(position, m) {
  // Sort positions ascending
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
      if (count >= m) return true; // Early exit
    }

    return count >= m;
  }

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);

    if (canPlace(mid)) {
      ans = mid;     // Distance feasible; record candidate
      low = mid + 1; // Squeeze right to try larger separation
    } else {
      high = mid - 1; // Separation too wide; squeeze left
    }
  }

  return ans;
}

// Example runs
console.log(maxDistance([1, 2, 3, 4, 7], 3));                       // 3
console.log(maxDistance([5, 4, 3, 2, 1, 1000000000], 2));          // 999999999
console.log(maxDistance([79, 74, 57, 22], 4));                     // 5
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Forgetting to sort positions before greedy placement
function buggyMaxDistance(position, m) {
  let low = 1, high = 1000000000;
  // BUG: Greedy placement assumes position[i] >= lastPos.
  // Without sorting, position[i] - lastPos produces negative gaps!
}
```

#### 3.3.8 Complexity Derivation
- **Time Complexity**: $O(n \log n + n \log(\max(\text{pos}) - \min(\text{pos})))$. Sorting takes $O(n \log n)$ time. Binary search takes $\log_2(10^9) \approx 30$ iterations, each doing an $O(n)$ greedy scan.
- **Auxiliary Space Complexity**: $O(1)$ beyond the in-place sort.

---

## 4. Tricky Edge Cases

- **Underestimating `low` in Partitioning**: In packaging and subarray splitting, `low` must be initialized to $\max(\text{items})$, not $1$. If tested capacity is less than the largest single element, that element can never be loaded, corrupting simulation state.
- **Overestimating `high`**: In Koko Eating Bananas, setting `high = \sum \text{piles}` is unnecessarily large. Eating faster than $\max(\text{piles})$ in 1 hour provides zero additional advantage; therefore `high = \max(\text{piles})`.
- **Direction Inversion (Minimizing vs Maximizing)**:
  - When minimizing the answer (e.g. speed), success moves `high = mid - 1` to find smaller values.
  - When maximizing the answer (e.g. distance), success moves `low = mid + 1` to find larger values.
- **Early Termination in Verification Helpers**: Always break out early inside `canFinish` or `canShip` the moment limits are breached (`if (hours > h) return false;`). Skipping remaining elements saves thousands of iterations.
- **Integer Ceiling Division**: Do not use `Math.floor(a / b)` when computing elapsed time; use `Math.ceil(a / b)` or integer equivalent `Math.floor((a + b - 1) / b)` to account for partial hours.

---

## 5. Summary Cheat Sheet

- **Search the Answer Range**: When there is no array to search, binary search over continuous solution values $[ \text{low} \dots \text{high} ]$.
- **Monotonic Feasibility**: The problem must satisfy monotonicity: if candidate $k$ works, all candidates $> k$ (or $< k$) must also work.
- **Time Complexity Formula**: $T(n) = O(n \log R)$, where $R$ is the size of the answer range and $n$ is array length.
- **Greedy Verification**: The feasibility helper simulates candidate validity in $O(n)$ time using simple greedy packing or counting.
- **Safe Bounds Sizing**: For partitioning, `low = max(arr)` and `high = sum(arr)`. For speed, `low = 1` and `high = max(arr)`.

---

## 6. Practice Problems

### 6.1 Sqrt(x)
Given a non-negative integer `x`, return the square root of `x` rounded down to the nearest integer. The returned integer should be non-negative as well. You must not use built-in exponent functions.

```text
Sample Input 1: x = 4
Expected Output 1: 2

Sample Input 2: x = 8
Expected Output 2: 2
```

- *Hint 1*: Search space is $[1 \dots \lfloor x / 2 \rfloor]$ for $x \ge 4$.
- *Hint 2*: Test midpoint: if `mid * mid <= x`, record `ans = mid` and search right (`low = mid + 1`).
- *Hint 3*: Otherwise, `mid * mid > x`, search left (`high = mid - 1`).

### 6.2 Split Array Largest Sum
Given an integer array `nums` and an integer `k`, split `nums` into `k` non-empty subarrays such that the largest sum of any subarray is **minimized**. Return the minimized largest sum.

```text
Sample Input 1: nums = [7, 2, 5, 10, 8], k = 2
Expected Output 1: 18 (Splits: [7, 2, 5] and [10, 8])

Sample Input 2: nums = [1, 2, 3, 4, 5], k = 2
Expected Output 2: 9
```

- *Hint 1*: This problem is isomorphic to *Capacity to Ship Packages Within D Days*.
- *Hint 2*: Search range is `low = max(nums)` to `high = sum(nums)`.
- *Hint 3*: Feasibility helper greedily accumulates subarray totals; if adding next number exceeds `mid`, start a new subarray chunk.

### 6.3 Minimum Days to Make m Bouquets
You are given an integer array `bloomDay`, an integer `m` and an integer `k`. You want to make `m` bouquets. To make a bouquet, you need to use `k` **adjacent** flowers from the garden. Return the minimum number of days you need to wait to be able to make `m` bouquets, or `-1` if impossible.

```text
Sample Input 1: bloomDay = [1, 10, 3, 10, 2], m = 3, k = 1
Expected Output 1: 3

Sample Input 2: bloomDay = [1, 10, 3, 10, 2], m = 3, k = 2
Expected Output 2: -1
```

- *Hint 1*: If $m \times k > bloomDay.length$, return `-1` immediately.
- *Hint 2*: Search space is `low = min(bloomDay)` to `high = max(bloomDay)`.
- *Hint 3*: In `canMake(day)`: scan flowers; count consecutive flowers where `bloomDay[i] <= day`. When count reaches $k$, form a bouquet and reset count to 0.

---

<nav aria-label="Lecture navigation">

[Previous: Binary Search Bounds & Rotated Arrays](day-16-binary-search-bounds-and-rotated-arrays.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Recursion Fundamentals & Call Stack](day-18-recursion-fundamentals-and-call-stack.md)

</nav>
