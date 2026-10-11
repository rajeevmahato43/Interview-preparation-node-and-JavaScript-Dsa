# Day 17: Binary Search on Solution Space

<nav aria-label="Lecture navigation">

[Previous: Binary Search: Bounds & Rotated Arrays](day-16-binary-search-bounds-and-rotated-arrays.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Recursion & Call Stack](day-18-recursion-fundamentals-and-call-stack.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Asymptotic time.
- [Day 16: Binary Search: Bounds & Rotated Arrays](day-16-binary-search-bounds-and-rotated-arrays.md) — Binary search halving mechanics.

---

## 1. What is Binary Search on Solution Space?

In traditional binary search, you search for an item inside an existing array.
In **Binary Search on Solution Space**, there is **no array**! You are searching for the **optimal numerical answer** within a known range:
$$[\text{minimum possible answer} \dots \text{maximum possible answer}]$$

### The Monotonic Property (True/False Switch)
This technique works whenever a helper function `canAchieve(speed)` has a clear True/False cutoff:
- If speed $K$ is fast enough to finish on time, **every speed $> K$ is also fast enough** (`[F, F, F, T, T, T, T]`).
- We binary search the range to find the **very first `True`**!

```text
Possible Speeds:  [ 1, 2, 3, 4, 5, 6, 7, 8 ]
Can finish in H?  [ F, F, F, T, T, T, T, T ]
                             ▲
              Minimum valid speed = 4!
```

---

## 2. Problem 1: Koko Eating Bananas

Koko loves eating bananas. There are `piles` of bananas, and the guards will return in `h` hours. Find the minimum integer eating speed `k` (bananas per hour) such that she can eat all bananas within `h` hours.

### The Algorithm:
1. **Search Range:**
   - Minimum speed: `low = 1`
   - Maximum speed: `high = Math.max(...piles)`
2. **Helper function `canFinish(speed)`:**
   - For each pile, hours needed = `Math.ceil(pile / speed)`.
   - Return `totalHours <= h`.
3. **Binary Search:**
   - If `canFinish(mid)` is `true`: Koko can finish! Try a slower speed: `high = mid - 1`, save `ans = mid`.
   - If `false`: Too slow! Speed up: `low = mid + 1`.

```javascript
// Node.js code: Koko Eating Bananas
function minEatingSpeed(piles, h) {
  let low = 1;
  let high = Math.max(...piles);
  let result = high;

  function canFinish(speed) {
    let hoursNeeded = 0;
    for (const pile of piles) {
      hoursNeeded += Math.ceil(pile / speed);
    }
    return hoursNeeded <= h;
  }

  while (low <= high) {
    const mid = Math.floor(low + (high - low) / 2);

    if (canFinish(mid)) {
      result = mid;     // mid works; record candidate
      high = mid - 1;   // try smaller speed
    } else {
      low = mid + 1;    // too slow; increase speed
    }
  }

  return result;
}

console.log(minEatingSpeed([3, 6, 7, 11], 8)); // 4
console.log(minEatingSpeed([30, 11, 23, 4, 20], 5)); // 30
console.log(minEatingSpeed([30, 11, 23, 4, 20], 6)); // 23
```
- **Time Complexity:** $O(n \cdot \log(\max(\text{piles})))$ — We test a speed in $O(n)$ time across $\log(\max)$ steps.
- **Extra Space:** $O(1)$ — Only numbers stored.

---

## 3. Problem 2: Capacity To Ship Packages Within D Days

Find the minimum ship weight capacity to transport all packages within `days` days.

```javascript
// Node.js code
function shipWithinDays(weights, days) {
  // low must be at least the heaviest single item
  let low = Math.max(...weights);
  // high is the sum of all weights (ship everything in 1 day)
  let high = weights.reduce((sum, w) => sum + w, 0);
  let result = high;

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

  while (low <= high) {
    const mid = Math.floor(low + (high - low) / 2);

    if (canShip(mid)) {
      result = mid;
      high = mid - 1; // Try smaller capacity
    } else {
      low = mid + 1;  // Need bigger capacity
    }
  }

  return result;
}

console.log(shipWithinDays([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5)); // 15
console.log(shipWithinDays([3, 2, 2, 4, 1, 4], 3));                // 6
```
- **Time Complexity:** $O(n \cdot \log(\text{sum} - \max))$
- **Extra Space:** $O(1)$

---

## 4. Tricky Points and Common Traps

1. **Setting `low` too low:** If a ship capacity is smaller than the heaviest single item, that item can never be shipped! Always initialize `low = Math.max(...weights)`.
2. **Integer division rounding up:** When calculating hours in Koko, `Math.ceil(pile / speed)` is required. Do not use integer truncation `Math.floor`.
3. **Recording the answer:** Always record `result = mid` when a condition is met before shrinking the range with `high = mid - 1`.

---

## 5. Hands-On Exercises

Run this script in Node.js to verify solution-space binary search:

```javascript
// Node.js code
const assert = require("node:assert");

function testKoko(piles, h) {
  let l = 1, r = Math.max(...piles), ans = r;
  while (l <= r) {
    const m = Math.floor((l + r) / 2);
    let hrs = 0;
    for (const p of piles) hrs += Math.ceil(p / m);
    if (hrs <= h) { ans = m; r = m - 1; }
    else l = m + 1;
  }
  return ans;
}

assert.equal(testKoko([3, 6, 7, 11], 8), 4);
assert.equal(testKoko([30, 11, 23, 4, 20], 5), 30);

console.log("✅ Koko eating bananas assertions passed!");
```

---

## 6. Summary

- **Solution Space Binary Search** finds the minimum (or maximum) value that satisfies a condition.
- **Search range** is bounded by $[low, high]$ derived from problem limits.
- **Feasibility check (`canAchieve`)** runs in $O(n)$ time to test whether a given candidate value works.
- **Overall runtime** is $O(n \cdot \log(\text{range}))$, turning an intractable search into a fast logarithmic process.

---

## 7. Cheat Sheet

| Step | Template |
| :--- | :--- |
| **1. Define Bounds** | `low = minPossible`, `high = maxPossible` |
| **2. Feasibility** | `function canDo(x) { ... return boolean; }` |
| **3. Shrink Rule** | If `canDo(mid)` $\to$ `ans = mid; high = mid - 1;` else `low = mid + 1;` |
| **Complexity** | **$O(n \log(\text{range}))$ time**, **$O(1)$ space** |

---

## 8. Interview Q&A

### 45-Second Explanation
> *"When a problem asks for the minimum capacity or speed to complete a task within a constraint, we can binary search directly on the answer space. The minimum possible answer is the largest single element, and the maximum is the sum of all elements. We define an $O(n)$ feasibility function that checks whether a given value satisfies the constraint. Because feasibility is monotonic, binary search finds the optimal value in $O(n \log(\text{range}))$ time with $O(1)$ space."*

---

## 9. Practice Problems

### 1. Sqrt(x) - Easy
Given a non-negative integer `x`, return the square root of `x` rounded down to the nearest integer. The returned integer should be non-negative as well. You must not use any built-in exponent function or operator.
- **Input:** `x = 4`
- **Expected Output:** `2`
- **Input:** `x = 8`
- **Expected Output:** `2`

### 2. Koko Eating Bananas - Medium
Koko loves to eat bananas. There are `n` piles of bananas, the $i^{\text{th}}$ pile has `piles[i]` bananas. The guards have gone and will come back in `h` hours. Koko can decide her bananas-per-hour eating speed of `k`. Return the minimum integer `k` such that she can eat all the bananas within `h` hours.
- **Input:** `piles = [3,6,7,11], h = 8`
- **Expected Output:** `4`
- **Input:** `piles = [30,11,23,4,20], h = 5`
- **Expected Output:** `30`
- **Input:** `piles = [30,11,23,4,20], h = 6`
- **Expected Output:** `23`

### 3. Capacity To Ship Packages Within D Days - Medium
A conveyor belt has packages that must be shipped from one port to another within `days` days. The $i^{\text{th}}$ package on the conveyor belt has a weight of `weights[i]`. Return the least weight capacity of the ship that will result in all the packages on the conveyor belt being shipped within `days` days.
- **Input:** `weights = [1,2,3,4,5,6,7,8,9,10], days = 5`
- **Expected Output:** `15`
- **Input:** `weights = [3,2,2,4,1,4], days = 3`
- **Expected Output:** `6`

---

<nav aria-label="Lecture navigation">

[Previous: Binary Search: Bounds & Rotated Arrays](day-16-binary-search-bounds-and-rotated-arrays.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Recursion & Call Stack](day-18-recursion-fundamentals-and-call-stack.md)

</nav>
