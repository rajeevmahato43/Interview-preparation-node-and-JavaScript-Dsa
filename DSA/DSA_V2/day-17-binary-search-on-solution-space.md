# Day 17: Binary Search on Solution Space

<nav aria-label="Lecture navigation">

[Previous: Binary Search Bounds & Rotated Arrays](day-16-binary-search-bounds-and-rotated-arrays.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Recursion Fundamentals & Call Stack](day-18-recursion-fundamentals-and-call-stack.md)

</nav>

---

## 1. Solution Space Search Foundation

In standard binary search, you look through an array of numbers stored in memory. In **Binary Search on Solution Space** (also known as *Binary Search on the Answer*), there is no array in memory! Instead, you search across a range of possible answers:

$$\text{Search Space Range} = [\text{minPossibleAnswer} \dots \text{maxPossibleAnswer}]$$

Whenever a problem asks for the **minimum** or **maximum** rate, capacity, speed, or distance needed to get a job done, the answers follow a predictable rule:
* If a candidate speed $k$ is fast enough to finish on time, any speed greater than $k$ will also finish on time.
* If a candidate speed $k$ is too slow, any speed slower than $k$ will also fail.

```text
MONOTONIC FEASIBILITY CURVE:
Candidate Speeds: 1    2    3    4    5    6    7    8    9    10
Is Feasible?:     F    F    F    F    T    T    T    T    T    T
                                      ▲
                           Goal: Find first 'T' (Minimum valid answer)
```

To picture this physically, imagine running a chocolate packaging machine in a factory:
* You have a speed dial with settings from 1 box per minute to 1,000 boxes per minute.
* At 10 boxes/min, chocolates pile up and overflow the belt (**Too slow: False**).
* At 1,000 boxes/min, the machine packs every chocolate easily, but burns way too much electricity (**Works: True**).
* You do not test speeds 1, 2, 3... one by one.
* You test the middle speed (500 boxes/min). If 500 works, you know that 501 through 1,000 will also work. You can safely throw away the top half and search between 1 and 500 to find the **slowest speed that still finishes on time**.

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

---

### 1.1 The 3-Part Architecture & Monotonic Feasibility

Every solution space problem follows three clear steps:

1. **Pick the Range (`low` and `high`)**:
   - `low`: The smallest possible answer that could ever make sense (e.g. speed = 1, or the heaviest single package).
   - `high`: The biggest possible answer that would guarantee success (e.g. largest pile size, or the sum of all packages).
2. **Build the Helper Check Function**:
   - Write a helper function `canAchieve(mid)` that walks through the input in $O(n)$ time and returns `true` or `false`.
3. **Run Binary Search on the Range**:
   - If `canAchieve(mid)` is `true`: this answer works. Save it (`ans = mid`) and try to find an even better one (if minimizing, search left: `high = mid - 1`).
   - If `canAchieve(mid)` is `false`: this answer failed. Squeeze in the other direction (`low = mid + 1`).

> [!NOTE]
> **Self-Check:** Why must the check function be monotonic?  
> *Answer:* If answers switched back and forth between working and failing (like `F, T, F, T`), binary search could not throw away half the numbers, because a good answer could be hiding in either half. Monotonicity ensures all answers to one side of `mid` give the exact same outcome.

---

### 1.2 Integer Division Ceilings

When finding hours or trips needed in your helper function:

```javascript
// Method A: Floating-point ceiling
hours += Math.ceil(pile / speed);

// Method B: Pure integer arithmetic ceiling
hours += Math.floor((pile + speed - 1) / speed);
```

While `Math.ceil()` is easy to read, pure integer arithmetic `Math.floor((pile + speed - 1) / speed)` runs directly as native integer division in the V8 engine, executing faster in heavy loops.

---

### 1.3 Operations Reference Table

| Step | What It Does | Time Complexity | Extra Space | Code Example |
| :--- | :--- | :---: | :---: | :--- |
| **Determine Bounds** | Finds min and max possible answers | $O(n)$ | $O(1)$ | `low = max(arr); high = sum(arr)` |
| **Calculate Midpoint** | Picks middle candidate to test | $O(1)$ | $O(1)$ | `mid = low + Math.floor((high - low) / 2)` |
| **Check Helper** | Simulates if `mid` meets the requirement | $O(n)$ | $O(1)$ | `canShip(mid, weights, days)` |
| **Record Candidate** | Saves current valid answer | $O(1)$ | $O(1)$ | `ans = mid; high = mid - 1` |

---

## 2. Pattern Overview

### 2.1 Pattern Family
* **Minimum Rate / Speed:** Finding the slowest pace to finish tasks before a deadline (like Koko Eating Bananas).
* **Minimum Capacity / Threshold:** Finding the smallest container size to ship items in $D$ days.
* **Maximum Minimum Separation:** Spacing items as far apart as possible (like Magnetic Force).
* **Minimax Subarray Splits:** Splitting an array into $k$ parts so the largest sub-array sum is as small as possible.

### 2.2 Pattern Recognition Table

| Problem Keyword | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| **"Minimum speed to finish in H hours"** | Slowest rate that completes all work in time. | Range $[1 \dots \max(\text{piles})]$ + time sum check. |
| **"Least ship capacity within D days"** | Smallest truck size that fits all packages in order. | Range $[\max(\text{weights}) \dots \sum \text{weights}]$ + greedy pack. |
| **"Maximize minimum distance / force"** | Place $m$ items so closest pair is as far apart as possible. | Range $[1 \dots \max - \min]$ + greedy placement. |
| **"Split array largest sum"** | Divide array into $k$ pieces with minimal max sum. | Range $[\max(\text{nums}) \dots \sum \text{nums}]$ + chunk check. |
| **"Minimum days to make M bouquets"** | Earliest calendar day with enough flowers bloomed. | Range $[\min(\text{bloom}) \dots \max(\text{bloom})]$ + flower count. |

### 2.3 When to Use vs When NOT to Use
* **When to Use**:
  * The problem asks for the "minimum speed", "minimum capacity", or "maximum minimum distance".
  * The answer is a number within a known range $[low \dots high]$.
  * You can write a helper function that checks if a candidate answer works in $O(n)$ time.
* **When NOT to Use**:
  * Working and failing do not follow a clean order (e.g. answers work randomly).
  * The problem asks to list or generate all combinations (use **Backtracking**).
  * Earlier choices affect later choices in unpredictable ways (use **Dynamic Programming**).

### 2.4 The $10^7$ Operations Rule
If the range of possible answers is $R = 1,000,000,000$:
* Binary search takes only $\lceil \log_2(10^9) \rceil \approx 30$ rounds.
* In each round, checking an array of $n = 100,000$ items takes $100,000$ operations.
* Total operations: $30 \times 100,000 = 3,000,000$ operations, finishing in under 20 milliseconds in Node.js.
* Testing every speed one by one would take $10^{14}$ operations and crash your server.

---

## 3. Problem Walkthroughs

---

### 3.1 Koko Eating Bananas

#### 3.1.1 Problem Statement
Koko loves to eat bananas. There are `n` piles of bananas, the $i^{\text{th}}$ pile has `piles[i]` bananas. The guards have gone and will return in `h` hours.

Koko can decide her bananas-per-hour eating speed of `k`. Each hour, she chooses some pile of bananas and eats `k` bananas from that pile. If the pile has less than `k` bananas, she eats all of them instead and will not eat any more bananas during that hour.

Return the **minimum integer `k`** such that she can eat all the bananas within `h` hours.

* **Sample Input 1:** `piles = [3, 6, 7, 11]`, `h = 8` $\to$ **Expected Output:** `4`
* **Sample Input 2:** `piles = [30, 11, 23, 4, 20]`, `h = 5` $\to$ **Expected Output:** `30`
* **Sample Input 3:** `piles = [30, 11, 23, 4, 20]`, `h = 6` $\to$ **Expected Output:** `23`
* **Constraints:** $1 \le piles.length \le 10^4$, $piles.length \le h \le 10^9$, $1 \le piles[i] \le 10^9$.

#### 3.1.2 How to Think About It
Imagine 4 bowls of bananas on a table: `[3, 6, 7, 11]`. A timer is set to 8 hours.
* If Koko eats at speed 1 banana/hour: Bowl 11 alone takes 11 hours! She fails immediately.
* If Koko eats at speed 11 bananas/hour:
  - Bowl 3 takes 1 hour.
  - Bowl 6 takes 1 hour.
  - Bowl 7 takes 1 hour.
  - Bowl 11 takes 1 hour.
  - Total = 4 hours. She finishes well before the 8-hour deadline.
* We want the **slowest speed** between 1 and 11 that finishes in $\le 8$ hours.
* Instead of checking speeds 1, 2, 3, 4... one by one, test the middle speed: 6 bananas/hour.
* At speed 6: $\lceil 3/6 \rceil + \lceil 6/6 \rceil + \lceil 7/6 \rceil + \lceil 11/6 \rceil = 1 + 1 + 2 + 2 = 6$ hours ($\le 8$).
* Speed 6 works! Can she eat even slower? Search between 1 and 5.

```text
Binary Search over Speed Space [ 1 ... 11 ]:
Pass 1: mid = 6 -> Total hours = 6 <= 8 (True)  -> Record ans = 6, high = 5
Pass 2: mid = 3 -> Total hours = 10 > 8 (False) -> Too slow! low = 4
Pass 3: mid = 4 -> Total hours = 8 <= 8 (True)  -> Record ans = 4, high = 3
low (4) > high (3) -> Terminate. Minimum speed = 4!
```

#### 3.1.3 Brute Force Approach & Bottleneck
Incrementing speed by 1 until hours $\le h$:

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

* **The Bottleneck:** When the biggest pile has $10^9$ bananas, checking speeds one by one takes $10^{14}$ operations and freezes Node.js.

#### 3.1.4 The Pattern Insight
If speed $k$ works, any speed faster than $k$ also works.  
Run binary search on the speed range $[1 \dots \max(\text{piles})]$.  
Each check takes $O(n)$ time, cutting candidate speeds in half each time.

#### 3.1.5 Pseudocode

```text
FUNCTION MinEatingSpeed(piles, h):
  low = 1, high = max(piles), ans = high

  HELPER canFinish(speed):
    hours = 0
    FOR each pile IN piles:
      hours = hours + ceil(pile / speed)
    RETURN hours <= h

  WHILE low <= high:
    mid = low + floor((high - low) / 2)
    IF canFinish(mid):
      ans = mid
      high = mid - 1
    ELSE:
      low = mid + 1

  RETURN ans
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
* **Why it fails:** Using `Math.floor()` ignores leftover bananas. A pile with 7 bananas at speed 4 takes 2 hours, not 1 hour. Always use `Math.ceil()`.

#### 3.1.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n \log(\max(\text{piles})))}$. Binary search takes $\approx 30$ passes. Each pass loops through the $n$ piles.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. We only use simple number variables.

---

### 3.2 Capacity to Ship Packages Within D Days

#### 3.2.1 Problem Statement
A conveyor belt has packages that must be shipped from one port to another within `days` days.

The $i^{\text{th}}$ package has a weight of `weights[i]`. Each day, packages are loaded onto the ship in the **strict order given by `weights`**. We cannot load more weight than the maximum capacity of the ship.

Return the **least weight capacity** of the ship that will result in all packages being shipped within `days` days.

* **Sample Input 1:** `weights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`, `days = 5` $\to$ **Expected Output:** `15`
* **Sample Input 2:** `weights = [3, 2, 2, 4, 1, 4]`, `days = 3` $\to$ **Expected Output:** `6`
* **Sample Input 3:** `weights = [1, 2, 3, 1, 1]`, `days = 4` $\to$ **Expected Output:** `3`
* **Constraints:** $1 \le days \le weights.length \le 5 \times 10^4$, $1 \le weights[i] \le 500$.

#### 3.2.2 How to Think About It
Imagine packages on a conveyor belt: `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`. You must hire trucks that all have the exact same weight limit.
* What is the smallest truck you could possibly hire?
  - The heaviest single package weighs `10`. If your truck limit is `9`, that 10-pound package can never be loaded! So `low = 10` ($\max(\text{weights})$).
* What is the largest truck you would ever need?
  - A giant truck that ships every single package in 1 day: capacity = sum of all weights = $55$. So `high = 55`.
* Range to search: $[10 \dots 55]$.
* Test the middle capacity 32:
  - Day 1 loads: `1..7` (sum 28). Package 8 would make 36, which is $> 32$. Day 1 departs.
  - Day 2 loads: `8..10` (sum 27). All packages shipped in only 2 days!
  - 2 days is $\le 5$ days. Capacity 32 works. Try smaller trucks: search $[10 \dots 31]$.

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
Trying capacities one by one starting from $\max(\text{weights})$ takes $O(n \times (\sum weights - \max(weights)))$ time. On large inputs, this causes execution timeouts.

#### 3.2.4 The Pattern Insight
If capacity 15 ships all packages in 5 days, any capacity $> 15$ will also work.  
Binary search the capacity range $[ \max(\text{weights}) \dots \sum \text{weights} ]$ using a simple greedy packing check.

#### 3.2.5 Pseudocode

```text
FUNCTION ShipWithinDays(weights, days):
  low = max(weights), high = sum(weights), ans = high

  HELPER canShip(cap):
    neededDays = 1, currentLoad = 0
    FOR each w IN weights:
      IF currentLoad + w > cap:
        neededDays = neededDays + 1
        currentLoad = 0
      currentLoad = currentLoad + w
    RETURN neededDays <= days

  WHILE low <= high:
    mid = low + floor((high - low) / 2)
    IF canShip(mid):
      ans = mid
      high = mid - 1
    ELSE:
      low = mid + 1

  RETURN ans
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
* **Why it fails:** Starting `low = 1` lets binary search test capacities smaller than individual package weights. A 10-pound package can never fit into a 5-pound truck! Always set `low = Math.max(...weights)`.

#### 3.2.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n \log(\sum \text{weights} - \max(\text{weights})))}$. Binary search takes at most 32 passes. Each pass checks all $n$ items.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. We only use simple number variables.

---

### 3.3 Magnetic Force Between Two Balls

#### 3.3.1 Problem Statement
In a universe with $n$ empty baskets located at distinct positions `position[i]`, you are given an integer $m$ representing $m$ balls.

You must distribute the balls across the baskets such that the **minimum magnetic force** between any two balls is **maximum**.

The magnetic force between two balls at positions $x$ and $y$ is $|x - y|$.

Return the maximum possible minimum magnetic force.

* **Sample Input 1:** `position = [1, 2, 3, 4, 7]`, `m = 3` $\to$ **Expected Output:** `3`  
  *(Placing balls at positions `[1, 4, 7]` gives minimum distance 3)*
* **Sample Input 2:** `position = [5, 4, 3, 2, 1, 1000000000]`, `m = 2` $\to$ **Expected Output:** `999999999`
* **Constraints:** $n == position.length$, $2 \le n \le 10^5$, $1 \le position[i] \le 10^9$, all values are distinct, $2 \le m \le n$.

#### 3.3.2 How to Think About It
Imagine posts along a straight road: `[1, 2, 3, 4, 7]`. You want to place 3 guard dogs at posts so they are as far apart from each other as possible.
* Sort the post positions first: `[1, 2, 3, 4, 7]`.
* Smallest possible gap between dogs: `low = 1`.
* Largest possible gap: `high = position[n - 1] - position[0] = 7 - 1 = 6`.
* Test gap = 3:
  - Dog 1 sits at post 1.
  - Next dog must sit at post $\ge 1 + 3 = 4$. Post 4 works! Dog 2 sits at post 4.
  - Next dog must sit at post $\ge 4 + 3 = 7$. Post 7 works! Dog 3 sits at post 7.
  - All 3 dogs are placed with at least distance 3! Distance 3 works.
  - Can we space them out even further? Squeeze search space to the right: `low = mid + 1 = 4`.

```text
Feasibility Curve (Maximizing minimum):
Gap Distance: 1    2    3    4    5    6
Feasible?:    T    T    T    F    F    F
                        ▲
             Goal: Find the last 'T' (Maximum valid gap)
```

#### 3.3.3 Brute Force Approach & Bottleneck
Generating all combinations of $m$ baskets takes factorial/exponential time, crashing your program immediately.

#### 3.3.4 The Pattern Insight
Sort the positions in $O(n \log n)$ time.  
Once sorted, checking if you can place $m$ balls with minimum gap $d$ is a simple **greedy $O(n)$ scan**:
* Place the first ball at `position[0]`.
* Walk through positions; place the next ball whenever `position[i] - lastPos >= d`.
* Binary search over the gap range $[1 \dots (\text{position}[n - 1] - \text{position}[0])]$ to find the largest working gap.

#### 3.3.5 Pseudocode

```text
FUNCTION MaxDistance(position, m):
  sort(position)
  low = 1, high = position[last] - position[0], ans = 1

  HELPER canPlace(minDist):
    count = 1, lastPos = position[0]
    FOR i FROM 1 TO length(position) - 1:
      IF position[i] - lastPos >= minDist:
        count = count + 1
        lastPos = position[i]
    RETURN count >= m

  WHILE low <= high:
    mid = low + floor((high - low) / 2)
    IF canPlace(mid):
      ans = mid
      low = mid + 1 // Try finding an even larger gap!
    ELSE:
      high = mid - 1

  RETURN ans
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
* **Why it fails:** Greedy placement assumes numbers are sorted. If the positions are not sorted, `position[i] - lastPos` produces negative gaps, ruining the distance checks. Always sort first.

#### 3.3.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n \log n + n \log(\max - \min))}$. Sorting takes $O(n \log n)$ time. Binary search takes $\approx 30$ rounds, each doing an $O(n)$ pass.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$ beyond the in-place sort.

---

## 4. Tricky Edge Cases

* **Starting `low` Too Small in Truck Problems:** In shipping problems, `low` must start at $\max(\text{weights})$, not 1. A truck must be at least as big as the heaviest single package.
* **Making `high` Too Big:** In Koko Eating Bananas, setting `high = sum(piles)` is unnecessary. Eating faster than $\max(\text{piles})$ in 1 hour gives zero extra benefit; set `high = max(piles)`.
* **Direction of Search (Minimizing vs Maximizing):**
  - When minimizing (like speed): if `mid` works, search left (`high = mid - 1`) to find a smaller number.
  - When maximizing (like distance): if `mid` works, search right (`low = mid + 1`) to find a bigger number.
* **Early Exit in Helper Functions:** Always exit early inside `canFinish` or `canShip` the moment limits are passed (`if (hours > h) return false;`). Skipping remaining items saves thousands of steps.
* **Rounding Up Hours:** Never use `Math.floor()` when calculating hours; use `Math.ceil()` so partial hours are counted.

---

## 5. Summary Cheat Sheet

* **Search the Answer Range:** When there is no array to search, run binary search across the range of possible answers $[low \dots high]$.
* **Monotonic Feasibility:** If candidate answer $k$ works, all answers $> k$ (or $< k$) must also work.
* **Time Complexity:** $T(n) = O(n \log R)$, where $R$ is the size of the answer range and $n$ is array length.
* **Greedy Helper:** Write a simple $O(n)$ helper function that tests whether candidate `mid` meets the requirement.
* **Safe Bounds:** For shipping packages, `low = max(arr)` and `high = sum(arr)`. For eating speed, `low = 1` and `high = max(arr)`.

---

## 6. Practice Problems

### 6.1 Sqrt(x)

Given a non-negative integer `x`, return the square root of `x` rounded down to the nearest integer. The returned integer should be non-negative as well. You must not use built-in exponent functions.

* **Difficulty:** Easy | **Focus:** Integer Square Root
* **Sample Input 1:** `x = 4` $\to$ **Expected Output:** `2`
* **Sample Input 2:** `x = 8` $\to$ **Expected Output:** `2`
* **Constraints:** $0 \le x \le 2^{31} - 1$.
* **Hint 1:** Search range is $[1 \dots \lfloor x / 2 \rfloor]$ for $x \ge 4$.
* **Hint 2:** Test midpoint: if `mid * mid <= x`, record `ans = mid` and search right (`low = mid + 1`).
* **Hint 3:** Otherwise, `mid * mid > x`, search left (`high = mid - 1`).

---

### 6.2 Split Array Largest Sum

Given an integer array `nums` and an integer `k`, split `nums` into `k` non-empty subarrays such that the largest sum of any subarray is **minimized**. Return the minimized largest sum.

* **Difficulty:** Hard | **Focus:** Subarray Partitioning Minimax
* **Sample Input 1:** `nums = [7, 2, 5, 10, 8]`, `k = 2` $\to$ **Expected Output:** `18` (Splits: `[7, 2, 5]` and `[10, 8]`)
* **Sample Input 2:** `nums = [1, 2, 3, 4, 5]`, `k = 2` $\to$ **Expected Output:** `9`
* **Constraints:** $1 \le nums.length \le 1000$, $0 \le nums[i] \le 10^6$, $1 \le k \le \min(50, nums.length)$.
* **Hint 1:** This problem is identical to *Capacity to Ship Packages Within D Days*.
* **Hint 2:** Search range is `low = max(nums)` to `high = sum(nums)`.
* **Hint 3:** Feasibility helper adds numbers into a chunk; if adding the next number exceeds `mid`, start a new chunk.

---

### 6.3 Minimum Days to Make m Bouquets

You are given an integer array `bloomDay`, an integer `m` and an integer `k`. You want to make `m` bouquets. To make a bouquet, you need to use `k` **adjacent** flowers from the garden. Return the minimum number of days you need to wait to be able to make `m` bouquets, or `-1` if impossible.

* **Difficulty:** Medium | **Focus:** Contiguous Segment Grouping
* **Sample Input 1:** `bloomDay = [1, 10, 3, 10, 2]`, `m = 3`, `k = 1` $\to$ **Expected Output:** `3`
* **Sample Input 2:** `bloomDay = [1, 10, 3, 10, 2]`, `m = 3`, `k = 2` $\to$ **Expected Output:** `-1`
* **Constraints:** $1 \le bloomDay.length \le 10^5$, $1 \le m \le 10^6$, $1 \le k \le bloomDay.length$.
* **Hint 1:** If $m \times k > bloomDay.length$, return `-1` immediately.
* **Hint 2:** Search range is `low = min(bloomDay)` to `high = max(bloomDay)`.
* **Hint 3:** In `canMake(day)`: scan flowers; count adjacent flowers where `bloomDay[i] <= day`. When count reaches $k$, form a bouquet and reset count to 0.

---

<nav aria-label="Lecture navigation">

[Previous: Binary Search Bounds & Rotated Arrays](day-16-binary-search-bounds-and-rotated-arrays.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Recursion Fundamentals & Call Stack](day-18-recursion-fundamentals-and-call-stack.md)

</nav>
