# Day 03: Searching & Elementary Sorting Algorithms

<nav aria-label="Lecture navigation">

[Previous: Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Asymptotic complexity ($O(1), O(\log n), O(n), O(n \log n), O(n^2)$) and the $10^7$ operations rule.
- [Day 02: Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md) — Contiguous memory, zero-based array indexing, and in-place element swapping.

---

## 1. What is Searching and Sorting?

**Searching** is the process of locating a target element's position (index) within a collection, or confirming that the element does not exist. **Sorting** is the process of arranging elements into a defined sequential order (ascending or descending) based on a comparison rule.

> **Loop Invariant**: A formal condition or property that is guaranteed to be true before a loop begins, remains true after each iteration, and explains why the algorithm is correct when the loop finishes.

> **In-Place Algorithm**: An algorithm that transforms input without allocating auxiliary memory proportional to the input size ($O(1)$ auxiliary space).

> **Sort Stability**: A guarantee that items with identical comparison keys retain their original relative order after sorting.

> **Adaptive Algorithm**: An algorithm whose running time automatically improves (e.g., drops to $O(n)$) when the input is already partially or completely sorted.

### Everyday Physical Analogies

#### Searching: The Messy Desk vs The Dictionary
- **Linear Search**: Looking for a misplaced tax receipt in an unsorted pile of papers on your desk. You pick up the top paper, inspect it, set it aside, and repeat until found or the pile is empty. Work is proportional to pile size ($O(n)$).
- **Binary Search**: Looking up a word in a printed 1,000-page dictionary. You flip directly to page 500 (middle). If your word comes after letter "M", you instantly discard the first 500 pages in one motion and repeat on the remaining half ($O(\log n)$).

#### Elementary Sorting Analogies
- **Bubble Sort**: Carbonated bubbles in a soda glass. The largest bubbles rise to the surface first; similarly, the largest numbers bubble up to the array's end with each pass.
- **Selection Sort**: Arranging students by height. You scan the entire group to find the shortest student and swap them with the first position, then scan the rest for the next shortest.
- **Insertion Sort**: Arranging playing cards in your hand. You pick up a new card and slide it backward past larger cards until it reaches its correct spot.

```text
SEARCHING PARADIGMS:
- Linear Search: [ 14, 42, 7, 88, 31 ] -> Scans index 0, 1, 2... O(n) steps
- Binary Search: [ 2, 5, 8, 12, 16, 23, 38 ] -> Mid: 12 -> 23 -> Found in 2 steps! O(log n)
```

---

## 2. How Searching and Sorting Work Step-by-Step

### 1. Linear Search ($O(n)$)

#### How It Works Step-by-Step
Linear Search is the most direct search strategy: it checks elements one-by-one from the very beginning (`index 0`) to the end (`index n - 1`). It makes no assumptions about data ordering and requires zero preparation.

Imagine searching for `target = 7` in `arr = [14, 42, 7, 88, 31]`:
```text
Array: [ 14, 42, 7, 88, 31 ], Target = 7

Step 1 (i = 0): Look at arr[0] (14). 14 === 7? No.  -> Advance pointer.
Step 2 (i = 1): Look at arr[1] (42). 42 === 7? No.  -> Advance pointer.
Step 3 (i = 2): Look at arr[2] (7).   7 === 7? Yes! -> Target found! Return index 2.
```
- **Best Case ($O(1)$)**: The target is at index 0 (1 comparison).
- **Worst Case ($O(n)$)**: The target is at the final index or not in the array at all (must inspect all $n$ items).
- **Memory Flow**: Zero extra heap memory ($O(1)$) because only a single integer loop counter is maintained.

```javascript
// ✅ CORRECT: Sequential scan with early exit on match
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i; // Found target early
  }
  return -1; // Target not present
}

// ❌ ANTI-PATTERN: Returning -1 prematurely inside the loop
function buggyLinearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
    return -1; // BUG! Exits on index 0 regardless of subsequent items!
  }
  return -1;
}

// Example test runs
console.log(linearSearch([14, 42, 7, 88, 31], 7));  // 2
console.log(linearSearch([14, 42, 7, 88, 31], 99)); // -1
```

---

### 2. Binary Search ($O(\log n)$)

#### How It Works Step-by-Step
Binary Search works exclusively on **sorted collections**. Instead of inspecting items one-by-one, it repeatedly inspects the midpoint element:
1. Set boundary pointers: `low = 0` and `high = arr.length - 1`.
2. Compute the midpoint: `mid = low + Math.floor((high - low) / 2)`.
3. If `arr[mid] === target`, return `mid`.
4. If `arr[mid] < target`, the target cannot possibly live in the left half (because all left items are smaller than `arr[mid]`). Discard the left half by setting `low = mid + 1`.
5. If `arr[mid] > target`, discard the right half by setting `high = mid - 1`.
6. Repeat until `low > high` (empty search space $\to$ return `-1`).

Every single step eliminates half of the remaining items ($n \to n/2 \to n/4 \to \dots \to 1$). Even with 1,000,000 items, Binary Search finds the answer in at most 20 steps!

#### Step-by-Step Memory Pointer Trace
Search for `target = 23` in `arr = [2, 5, 8, 12, 16, 23, 38]`:
```text
Pass 1:
  Indices:    [ 0 ]  [ 1 ]  [ 2 ]  [ 3 ]  [ 4 ]  [ 5 ]  [ 6 ]
  Values:     [  2,    5,     8,    12,    16,    23,    38 ]
              ^low                  ^mid                ^high
  low = 0, high = 6 -> mid = 0 + Math.floor((6 - 0) / 2) = 3 (value 12)
  Compare: 23 > 12 -> Target must be to the right!
  Action: Discard left half. Move low = mid + 1 = 4.

Pass 2:
  Indices:                         [ 4 ]  [ 5 ]  [ 6 ]
  Values:     [ --,   --,    --,    --,    16,    23,    38 ]
                                    ^low   ^mid         ^high
  low = 4, high = 6 -> mid = 4 + Math.floor((6 - 4) / 2) = 5 (value 23)
  Compare: 23 === 23 -> MATCH FOUND! Return index 5 in only 2 comparisons!
```

```javascript
// ✅ CORRECT: Standard Binary Search with safe integer midpoint
function binarySearch(arr, target) {
  let low = 0;
  let high = arr.length - 1;

  // Invariant: If target exists, it MUST reside in arr[low ... high]
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2); // Avoids 32-bit overflow & float bugs

    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      low = mid + 1; // Discard left half
    } else {
      high = mid - 1; // Discard right half
    }
  }

  return -1; // Not found
}

// ❌ ANTI-PATTERN: Floating-point midpoint in JavaScript
function buggyMidpoint(arr, target) {
  let low = 0, high = arr.length - 1;
  while (low <= high) {
    const mid = (low + high) / 2; // BUG! 0 + 1 / 2 = 0.5. arr[0.5] is undefined!
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}

// Example test runs
console.log(binarySearch([2, 5, 8, 12, 16, 23, 38], 23)); // 5
console.log(binarySearch([2, 5, 8, 12, 16, 23, 38], 10)); // -1
```

---

### 3. Elementary $O(n^2)$ Sorting Algorithms

#### 1. Bubble Sort (Adjacent Comparisons & Bubbling)
**How It Works Step-by-Step:**
Bubble Sort repeatedly walks through the array, comparing adjacent pairs `(arr[j], arr[j + 1])`. If the left item is larger than the right item, they swap. After the first full pass, the single largest unsorted element has "bubbled up" to its final position at the far right.

**Step-by-Step Trace:**
Sort `arr = [5, 1, 4, 2]`:
```text
Pass 1 (Find largest, bubble to end):
  [5, 1, 4, 2] -> 5 > 1? Swap! -> [1, 5, 4, 2]
  [1, 5, 4, 2] -> 5 > 4? Swap! -> [1, 4, 5, 2]
  [1, 4, 5, 2] -> 5 > 2? Swap! -> [1, 4, 2, 5]  <- 5 is permanently placed!

Pass 2 (Find second largest):
  [1, 4, 2, 5] -> 1 > 4? No.   -> [1, 4, 2, 5]
  [1, 4, 2, 5] -> 4 > 2? Swap! -> [1, 2, 4, 5]  <- 4 is permanently placed!

Pass 3 (Verify remaining):
  [1, 2, 4, 5] -> 1 > 2? No.   -> Zero swaps occurred! Early break -> Sorted!
```
- **Early-Exit Optimization**: By adding a `swapped` boolean flag, Bubble Sort detects if an array is already sorted and exits after a single pass ($O(n)$ best case).

```javascript
// ✅ CORRECT: Bubble Sort with early-exit flag
function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    if (!swapped) break; // Array is sorted early; O(n) best case!
  }
  return arr;
}

// ❌ ANTI-PATTERN: Missing early exit flag forces full O(n^2) work on sorted inputs
function slowBubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
    // Always runs all n*(n-1)/2 comparisons even if input was already [1, 2, 3, 4]
  }
  return arr;
}

// Example test run
console.log(bubbleSort([5, 1, 4, 2])); // [ 1, 2, 4, 5 ]
```

---

#### 2. Selection Sort (Minimum Element Selection)
**How It Works Step-by-Step:**
Selection Sort divides the array into two logical sections: a sorted prefix on the left and an unsorted suffix on the right:
1. Find the smallest element in the entire unsorted suffix.
2. Swap it with the first element of the unsorted suffix.
3. Advance the sorted prefix boundary by one slot.
4. Repeat until the entire array is sorted.

**Step-by-Step Trace:**
Sort `arr = [29, 10, 14, 37, 13]`:
```text
Pass 1 (Target slot index 0):
  Find minimum in [29, 10, 14, 37, 13] -> Minimum is 10 at index 1.
  Swap arr[0] and arr[1]: [ 10 | 29, 14, 37, 13 ]

Pass 2 (Target slot index 1):
  Find minimum in [29, 14, 37, 13] -> Minimum is 13 at index 4.
  Swap arr[1] and arr[4]: [ 10, 13 | 14, 37, 29 ]

Pass 3 (Target slot index 2):
  Find minimum in [14, 37, 29] -> Minimum is 14 at index 2 (itself).
  No swap needed:         [ 10, 13, 14 | 37, 29 ]

Pass 4 (Target slot index 3):
  Find minimum in [37, 29] -> Minimum is 29 at index 4.
  Swap arr[3] and arr[4]: [ 10, 13, 14, 29 | 37 ] -> Sorted!
```
- **Why use Selection Sort?** It minimizes write operations. While Bubble Sort may perform $O(n^2)$ swaps, Selection Sort makes at most $n - 1$ swaps ($O(n)$ writes). This makes it valuable when writing to physical flash memory or EEPROM is expensive.

```javascript
// ✅ CORRECT: Selection Sort (Minimizes memory writes to at most n - 1 swaps)
function selectionSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIndex = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIndex]) minIndex = j;
    }
    if (minIndex !== i) {
      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
    }
  }
  return arr;
}

// ❌ ANTI-PATTERN: Swapping on every smaller element turns Selection into an inefficient Bubble Sort
function buggySelectionSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[i]) {
        // BUG: Swapping on EVERY smaller item does O(n^2) writes instead of O(n) writes!
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
  }
  return arr;
}

// Example test run
console.log(selectionSort([29, 10, 14, 37, 13])); // [ 10, 13, 14, 29, 37 ]
```

---

#### 3. Insertion Sort (Adaptive Sliding)
**How It Works Step-by-Step:**
Insertion Sort works exactly like organizing playing cards in your hand:
1. Start with the first card (`index 0`), which is already sorted by definition.
2. Pick up the next unsorted card (`key = arr[i]`).
3. Compare the `key` backward against cards in the sorted hand (`arr[j]`).
4. Shift every card that is larger than `key` one slot to the right.
5. Drop `key` into the empty slot created.

**Step-by-Step Trace:**
Sort `arr = [12, 11, 13, 5, 6]`:
```text
Initial hand: [ 12 ] | [ 11, 13, 5, 6 ]

Step 1 (key = 11):
  Compare 11 with 12: 12 > 11 -> Shift 12 right -> [ __, 12, 13, 5, 6 ]
  Insert 11 at index 0:                            [ 11, 12 ] | [ 13, 5, 6 ]

Step 2 (key = 13):
  Compare 13 with 12: 12 <= 13 -> Stop immediately! 0 shifts.
  Hand remains:                                    [ 11, 12, 13 ] | [ 5, 6 ]

Step 3 (key = 5):
  13 > 5 -> shift 13 right -> [ 11, 12, __, 13, 6 ]
  12 > 5 -> shift 12 right -> [ 11, __, 12, 13, 6 ]
  11 > 5 -> shift 11 right -> [ __, 11, 12, 13, 6 ]
  Insert 5 at index 0:                             [ 5, 11, 12, 13 ] | [ 6 ]

Step 4 (key = 6):
  13 > 6 -> shift 13; 12 > 6 -> shift 12; 11 > 6 -> shift 11; 5 <= 6 -> stop!
  Insert 6 at index 1:                             [ 5, 6, 11, 12, 13 ]
```
- **Adaptive Advantage**: If an array is already sorted `[1, 2, 3, 4, 5]`, the `while` loop condition `arr[j] > key` fails immediately on every step. Zero elements shift, achieving true **$O(n)$ linear runtime**!
- This is why the V8 engine's built-in `TimSort` uses Insertion Sort as its base sorting engine for small arrays ($n \le 32$) and nearly-sorted chunks.

```javascript
// ✅ CORRECT: Insertion Sort (Adaptive O(n) for nearly-sorted data)
function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    // Shift elements of arr[0..i-1] that are greater than key rightward
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j]; // Shift right
      j--;
    }
    arr[j + 1] = key; // Place key into vacated position
  }
  return arr;
}

// ❌ ANTI-PATTERN: Using array.splice() turns in-place shifts into O(n^2) array buffer copies
function slowInsertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) j--;
    // arr.splice removes and re-inserts, causing full array memory re-copying under the hood!
    arr.splice(i, 1);
    arr.splice(j + 1, 0, key);
  }
  return arr;
}

// Example test run
console.log(insertionSort([12, 11, 13, 5, 6])); // [ 5, 6, 11, 12, 13 ]
```

### Comparison of Elementary Sorts

| Algorithm | Best Time | Average Time | Worst Time | Space | Stable? | Adaptive? | Maximum Swaps |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Bubble Sort** | **$O(n)$** | $O(n^2)$ | $O(n^2)$ | $O(1)$ | ✅ Yes | ✅ Yes | $O(n^2)$ |
| **Selection Sort**| $O(n^2)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ | ❌ No | ❌ No | **$O(n)$** |
| **Insertion Sort**| **$O(n)$** | $O(n^2)$ | $O(n^2)$ | $O(1)$ | ✅ Yes | ✅ Yes | $O(n^2)$ shifts |

---

## 3. Pattern Recognition of Searching & Sorting

### Problem Triggers and Diagnostic Keywords

| Problem Trigger | Underlying Requirement | Recommended Strategy |
| :--- | :--- | :--- |
| **"Array is sorted"** | Faster search than $O(n)$ is expected. | Binary Search ($O(\log n)$). |
| **"Partition into 2 or 3 groups"** | In-place grouping by values without full sort. | Two Pointers or Dutch National Flag ($O(n)$). |
| **"Meeting overlaps / scheduling"** | Detecting collisions between time intervals. | Sort by `start_time` ascending ($O(n \log n)$). |
| **"Nearly-sorted streaming data"** | Low item inversion count. | Insertion Sort ($O(n)$). |
| **"Find pair summing to target"** | Sorted array input. | Opposing Two Pointers inward ($O(n)$). |

### The $10^7$ Rule for Sorting
- **$n \le 10^3$**: Elementary $O(n^2)$ sorts take $\approx 10^6$ operations and pass comfortably.
- **$n \ge 10^5$**: An $O(n^2)$ sort requires $10^{10}$ operations and **will freeze Node.js**. You must use $O(n \log n)$ TimSort or $O(n)$ linear partitioning.

---

## 4. Problem 1: Sort Colors (Dutch National Flag)

### Problem Statement
Given an array `nums` with $n$ objects colored red (`0`), white (`1`), or blue (`2`), sort them **in-place** so that objects of the same color are adjacent, in order `0`, `1`, `2`.
You must solve this in a single pass using $O(1)$ extra space without using library sort.

```text
Input: nums = [2, 0, 2, 1, 1, 0]
Output: [0, 0, 1, 1, 2, 2]
```

### Step 1: Physical Simulation
Imagine poker chips of three colors in a messy row on a table: Red (`0`), White (`1`), Blue (`2`).
You want three zones: Red on the left, White in the center, Blue on the right.
- Put your left index finger at the start (`low = 0`, boundary for 0s).
- Put your right index finger at the end (`high = n - 1`, boundary for 2s).
- Use a middle pointer (`mid = 0`) to examine each chip one-by-one.

Let's simulate this step-by-step on `[ 2, 0, 1 ]`:
- **Start:** `low = 0`, `mid = 0`, `high = 2`.
- **Step 1:** The chip under `mid` is `2` (Blue).
  Swap it with the chip under `high` (index 2): the row becomes `[ 1, 0, 2 ]`.
  Move `high` leftward to index 1. Do NOT move `mid` yet, because the chip just received from `high` has not been checked!
- **Step 2:** The chip under `mid` is `1` (White).
  It belongs in the middle white zone! Advance `mid` to index 1.
- **Step 3:** The chip under `mid` is `0` (Red).
  Swap it with `low` (index 0): the row becomes `[ 0, 1, 2 ]`.
  Advance both `low` to index 1 and `mid` to index 2.
- **Stop:** `mid` (2) has crossed `high` (1). All chips are sorted: `[ 0, 1, 2 ]`!

### Step 2: Brute Force Approach
Count the frequencies of 0s, 1s, and 2s in pass 1, then overwrite the array in pass 2:

```javascript
// Two-Pass Count Sort
function sortColorsCount(nums) {
  let c0 = 0, c1 = 0, c2 = 0;
  for (const x of nums) {
    if (x === 0) c0++;
    else if (x === 1) c1++;
    else c2++;
  }
  let idx = 0;
  while (c0--) nums[idx++] = 0;
  while (c1--) nums[idx++] = 1;
  while (c2--) nums[idx++] = 2;
  return nums;
}
```
- **Time Complexity**: $O(n)$ — Two passes across the array.
- **Space Complexity**: $O(1)$ — Only three counter variables.

### Step 3: Bottleneck
Where is the CPU sweating?
While Count Sort is $O(n)$, it requires **two full passes** and overwrites values. If the array elements were composite objects (e.g., `{ color: 0, payload: "UserSession" }`), overwriting requires copying full references twice. We want a true single-pass in-place partition.

### Step 4: The Pattern Discovery
Edsger Dijkstra's 3-way partitioning maintains three pointers defining four memory partitions:
```text
[ 0 ... low - 1 ]   --> Red partition (0s)
[ low ... mid - 1 ] --> White partition (1s)
[ mid ... high ]    --> Uninspected elements (Unknown)
[ high + 1 ... n-1] --> Blue partition (2s)
```
When `mid > high`, the unknown partition is empty and the entire array is sorted!

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: Dijkstra's Dutch National Flag 3-Way Partitioning
function sortColors(nums) {
  let low = 0;
  let mid = 0;
  let high = nums.length - 1;

  // Invariant: nums[0..low-1] === 0, nums[low..mid-1] === 1, nums[high+1..n-1] === 2
  while (mid <= high) {
    if (nums[mid] === 0) {
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      mid++; // White element in place
    } else {
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--;
      // ⚠️ Invariant check: Do NOT advance mid! We must inspect the newly swapped element.
    }
  }

  return nums;
}

// ❌ ANTI-PATTERN: Advancing mid when swapping with high (skips inspecting swapped item)
function buggySortColors(nums) {
  let low = 0, mid = 0, high = nums.length - 1;
  while (mid <= high) {
    if (nums[mid] === 0) {
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++; mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--;
      mid++; // BUG! If nums[high] held a 0, it is skipped without reaching low!
    }
  }
  return nums;
}

// Example test runs
console.log(sortColors([2, 0, 2, 1, 1, 0])); // [ 0, 0, 1, 1, 2, 2 ]
console.log(sortColors([2, 0, 1]));          // [ 0, 1, 2 ]
console.log(buggySortColors([2, 0, 2, 1, 1, 0])); // [ 0, 1, 2, 1, 2, 2 ] (skipped inspecting swapped high element)
```

- **Time Complexity**: $O(n)$ — Every step either increments `mid` or decrements `high`. Single pass.
- **Space Complexity**: $O(1)$ — Direct in-place swaps.

---

## 5. Problem 2: Meeting Rooms (Interval Overlap Detection)

### Problem Statement
Given an array of meeting intervals `intervals[i] = [start, end]`, determine if a person could attend all meetings without overlap.
Note: If a meeting ends at time $t$ and another begins at time $t$, they do **not** conflict.

```text
Input: intervals = [[0, 30], [5, 10], [15, 20]]
Output: false (Meeting [0, 30] conflicts with [5, 10])

Input: intervals = [[7, 10], [2, 4]]
Output: true (Interval [2, 4] finishes before [7, 10] begins)
```

### Step 1: Physical Simulation
Imagine 3 paper appointment slips scattered on your desk:
Slip A: `[0, 30]`, Slip B: `[5, 10]`, Slip C: `[15, 20]`.

How does a human solve this naturally?
1. Pick up the slips and arrange them chronologically by start time:
   `[0, 30]` then `[5, 10]` then `[15, 20]`.
2. Look at Meeting 1 `[0, 30]`. It finishes at time `30`.
3. Look at Meeting 2 `[5, 10]`. It starts at time `5`.
4. Ask yourself: "Does Meeting 2 start before Meeting 1 has finished?"
   `5 < 30` -> YES! They overlap. It is impossible to attend both meetings. We can stop immediately and return `false` without even checking Meeting 3!

Now test non-overlapping slips: `[7, 10]` and `[2, 4]`:
1. Order them by start time: `[2, 4]` first, then `[7, 10]`.
2. Meeting 1 ends at `4`. Meeting 2 starts at `7`. Since `7 >= 4`, there is no conflict! Return `true`.

### Step 2: Brute Force Approach
Compare every meeting pair $(i, j)$ using nested loops:

```javascript
// Pairwise Brute Force O(n^2)
function canAttendMeetingsBrute(intervals) {
  for (let i = 0; i < intervals.length; i++) {
    for (let j = i + 1; j < intervals.length; j++) {
      // Two intervals overlap if max(start1, start2) < min(end1, end2)
      if (Math.max(intervals[i][0], intervals[j][0]) < Math.min(intervals[i][1], intervals[j][1])) {
        return false;
      }
    }
  }
  return true;
}
```
- **Time Complexity**: $O(n^2)$ — Checks all $\frac{n(n-1)}{2}$ pairs.
- **Space Complexity**: $O(1)$.

### Step 3: Bottleneck
Where is the CPU sweating?
Comparing every meeting against every other meeting is redundant. A meeting from 2:00 PM to 3:00 PM cannot possibly conflict with a meeting from 7:00 PM to 8:00 PM. By sorting meetings chronologically by start time, we only need to compare **adjacent neighbors** ($i$ and $i - 1$).

### Step 4: The Pattern Discovery
Sorting transforms an unstructured all-pairs problem ($O(n^2)$) into an adjacent-element verification problem ($O(n \log n) + O(n) = O(n \log n)$).

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: Sort shallow copy by start time and check adjacent neighbors
function canAttendMeetings(intervals) {
  if (intervals.length <= 1) return true;

  // Clone to avoid mutating caller's memory, sort with numeric comparator
  const sorted = intervals.slice().sort((a, b) => a[0] - b[0]);

  // Invariant: No two meetings in sorted[0 ... i - 1] overlap
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    // If current meeting starts strictly before previous ends -> Overlap!
    if (curr[0] < prev[1]) {
      return false;
    }
  }

  return true;
}

// ❌ ANTI-PATTERN: Default sort coerces arrays to strings!
function buggyCanAttend(intervals) {
  // intervals.sort() converts [7, 10] to "7,10" and [2, 4] to "2,4", ordering "2,4" first by string,
  // but [10, 15] and [2, 4] becomes "10,15" before "2,4"!
  return intervals.sort(); 
}

// Example test runs
console.log(canAttendMeetings([[0, 30], [5, 10], [15, 20]])); // false
console.log(canAttendMeetings([[7, 10], [2, 4]])); // true
console.log(canAttendMeetings([[1, 5], [5, 10]])); // true (boundary match allowed)
console.log(canAttendMeetings([])); // true
```

- **Time Complexity**: $O(n \log n)$ — Dominated by sorting $n$ intervals. Linear $O(n)$ check follows.
- **Space Complexity**: $O(n)$ — Auxiliary array for the sorted clone (preserves caller data).

---

## 6. Under the Hood: V8 & Node.js

### Why JavaScript's Default `sort()` Converts to Strings
In JavaScript, `[10, 5, 100].sort()` outputs `[10, 100, 5]`!
The ECMAScript specification dictates that unless a comparator function is provided, all items must be coerced to strings and sorted by UTF-16 code units. Because `"100"` begins with `'1'` (code unit 49) while `"5"` begins with `'5'` (code unit 53), `"100"` precedes `"5"`.
- Always pass a numeric comparator: `(a, b) => a - b`.

### V8 Engine TimSort Architecture
Since Node.js 12 (V8 v7.0), `Array.prototype.sort()` uses **TimSort**:
1. Scans array for natural ascending/descending sequences called **runs**.
2. If a run is shorter than 32 elements, it extends the run using **Insertion Sort** (minimal overhead on small arrays).
3. Merges runs using a balanced **Merge Sort** stack.
- **Guaranteed Worst-Case Time**: $O(n \log n)$.
- **Best-Case Time**: $O(n)$ on sorted or reverse-sorted data.
- **Stability Guarantee**: Guaranteed stable by ECMAScript specification since 2019.

### Synchronous Sorting in Node.js Event Loop
Node.js runs JavaScript on a single thread. Executing an in-memory sort on 100,000 objects with an unoptimized $O(n^2)$ algorithm consumes billions of CPU cycles, freezing the main thread for seconds.
- Incoming HTTP requests queue up in kernel socket buffers.
- Libuv cannot process I/O events.
- Kubernetes liveness probes (`/healthz`) fail, causing container restarts.

### Backend Strategy: In-Memory Node.js vs Database `ORDER BY`

| Decision Metric | Node.js In-Memory `arr.sort()` | PostgreSQL `ORDER BY` |
| :--- | :--- | :--- |
| **Dataset Size** | Small arrays ($< 2,000$ items) already cached | Large datasets ($> 5,000$ rows) |
| **Index Acceleration** | None; full $O(n \log n)$ CPU sorting | **B-Tree Index**: $O(\log n)$ pre-sorted disk read |
| **Network Overhead** | Must pull entire table into Node.js heap | Transmits only requested page (`LIMIT 20 OFFSET 0`) |
| **Thread Safety** | Blocks main thread during CPU sort | Zero Node.js CPU impact; offloaded to DB daemon |

---

## 7. Hands-On Exercise

### The Scenario
You are developing an automated deployment health check for a microservice fleet. You have $n$ software builds labeled sequentially from $1$ to $n$.
At some point, a broken commit was introduced. Because each build inherits all previous commits, **all builds after a bad build are also bad**.
You are provided an API function `isBadVersion(version)` returning `true` or `false`.
You must implement `findFirstBadVersion(n, isBadVersion)` to find the earliest broken build using the minimum number of API queries.

### The Buggy Code
```javascript
// Node.js code
function findFirstBadVersionBuggy(n, isBadVersion) {
  // Bug 1: Linear scan O(n) makes up to 1,000,000 slow network API calls!
  // Bug 2: Off-by-one: Builds are 1-indexed (1 to n), but loop checks index 0!
  for (let i = 0; i < n; i++) {
    if (isBadVersion(i)) return i;
  }
  return -1;
}
```

### Acceptance Criteria
1. Must execute in **$O(\log n)$ time** using Binary Search.
2. Search space must strictly encompass version `1` through version `n`.
3. Handles edge cases: version 1 is bad, or only the final version $n$ is bad.
4. Total extra memory allocated must be **$O(1)$**.
5. Verified with test execution.

### Verified Solution

```javascript
function findFirstBadVersion(n, isBadVersion) {
  let low = 1;
  let high = n;
  let firstBad = -1;

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);

    if (isBadVersion(mid)) {
      firstBad = mid; // Candidate found, search left for earlier bad build
      high = mid - 1;
    } else {
      low = mid + 1;  // Build is good, first bad must be to the right
    }
  }

  return firstBad;
}

// Example Test Runs
console.log(findFirstBadVersion(5, (v) => v >= 4));    // 4 (earliest bad build)
console.log(findFirstBadVersion(10, (v) => v >= 1));   // 1 (first build is bad)
console.log(findFirstBadVersion(100, (v) => v >= 50)); // 50
```

---

## 8. Tricky Points and Edge Cases

### 1. Safe Midpoint Integer Arithmetic
Writing `(low + high) / 2` in JavaScript produces floating-point fractions (`0.5`), breaking array index lookups.
Using bitwise shift `(low + high) >> 1` coerces values to 32-bit signed integers, which overflows to negative if sum exceeds $2^{31} - 1$.
- Memorize the universal safe formula: `low + Math.floor((high - low) / 2)`.

### 2. Sorting Non-Primitives: `undefined`, `null`, `NaN`
- `undefined` items are always moved to the very end of the array, and the comparator callback is **never called** on them.
- `null` coerces to `0` during subtraction (`null - 5 === -5`).
- `NaN` breaks mathematical transitivity (`NaN - 5` is `NaN`), causing non-deterministic sorting order and data corruption.

### 3. In-Place Mutation: `.sort()` vs `.toSorted()`
`arr.sort()` mutates the source array. If the array is shared across concurrent async operations, sorting causes data race side effects. Use ES2023 `arr.toSorted()` or `[...arr].sort()` to preserve original arrays safely.

---

## 9. Comprehensive Summary

- **Binary Search** requires a sorted monotonic array. It probes the midpoint and discards half the search space in each step, achieving $O(\log n)$ time and $O(1)$ space.
- **Bubble Sort** bubbles largest items rightward via adjacent swaps; early-exit flag gives $O(n)$ best-case time.
- **Selection Sort** finds minimum elements in unsorted suffixes; performs at most $n - 1$ swaps ($O(n)$ writes), but is unstable and always takes $O(n^2)$ comparisons.
- **Insertion Sort** slides items into a sorted prefix; adaptive $O(n)$ best case makes it ideal for small arrays ($n < 32$) and nearly-sorted data.
- **Dutch National Flag**: 3-pointer partition (`low`, `mid`, `high`) sorts 3 distinct values in a single $O(n)$ pass and $O(1)$ space.
- **Meeting Rooms**: Sorting intervals by `start_time` reduces overlap detection from an $O(n^2)$ pairwise scan to an $O(n \log n)$ adjacent-neighbor scan.
- **V8 TimSort**: Stable hybrid sort combining Insertion Sort and Merge Sort. Always supply `(a, b) => a - b` to avoid default UTF-16 string coercion.

---

## 10. Cheat Sheet

### Algorithm Decision Matrix

| Problem Requirement | Recommended Algorithm | Time Complexity | Space Complexity |
| :--- | :--- | :---: | :---: |
| **Search in sorted array** | Binary Search | **$O(\log n)$** | $O(1)$ |
| **Search in unsorted array** | Linear Search | $O(n)$ | $O(1)$ |
| **Partition 3 values (0, 1, 2)** | Dutch National Flag | **$O(n)$** | $O(1)$ |
| **Detect interval conflicts** | Sort by start time, scan adjacent | **$O(n \log n)$** | $O(n)$ or $O(1)$ |
| **General array sorting in Node.js**| `arr.toSorted((a, b) => a - b)` | **$O(n \log n)$** | $O(n)$ |
| **Small arrays ($n < 32$)** | Insertion Sort | $O(n)$ best / $O(n^2)$ | $O(1)$ |

### Common Pitfalls List
- **String Coercion Trap**: Calling `arr.sort()` without comparator orders `100` before `5`.
- **In-Place Mutation**: `arr.sort()` modifies input arrays; use `arr.toSorted()` or clone first.
- **Binary Search Boundary**: Using `low < high` instead of `low <= high` misses the final 1-element search window.
- **Float Midpoint Bug**: Omitting `Math.floor()` creates fractional array indices (`arr[2.5]`).
- **Dutch National Flag Premature Increment**: Incrementing `mid` when swapping with `high` skips inspecting swapped elements.

---

## 11. Interview Q&A

### 45-Second Technical Pitch
> *"Searching and sorting form the foundation of algorithmic optimization. While linear search checks unsorted elements in $O(n)$ time, binary search cuts sorted search spaces in half to locate elements in $O(\log n)$ time. In Node.js, the built-in sort uses TimSort—a hybrid of insertion sort and merge sort guaranteeing $O(n \log n)$ stable performance. However, because arr.sort() defaults to lexicographical string conversion and mutates memory in-place, production code must pass explicit numeric comparators and use arr.toSorted(). For specialized tasks like 3-way partitioning or calendar scheduling, we replace generic sorts with single-pass Dutch National Flag or adjacent interval scans."*

### 1. Why does Binary Search strictly require sorted order, and what loop invariant proves it terminates correctly?
**Answer:**
Binary search works by comparing the target with the midpoint value `arr[mid]`. To safely discard half of the array, the elements must be **monotonic** (non-decreasing). If `target > arr[mid]`, the algorithm assumes all elements in `arr[low ... mid]` are $\le arr[mid] < target$, proving the target cannot reside in the left partition. If the array is unsorted, this assumption breaks down and the target could be discarded incorrectly.

The loop invariant is: *"If the target exists in the array, it must lie within the closed index window `[low ... high]`."*
- **Initialization**: `low = 0` and `high = n - 1` bounds the entire array.
- **Maintenance**: At each step, if `arr[mid] < target`, all elements from `low` to `mid` are smaller than target, so setting `low = mid + 1` preserves the invariant. If `arr[mid] > target`, setting `high = mid - 1` preserves the invariant.
- **Termination**: If `low > high`, the search window is empty, proving the target is absent.

### 2. What will the following code output in Node.js, and why?
```javascript
// Node.js code
const arr = [10, 5, 40, 25];
arr.sort((a, b) => a > b);
console.log(arr);
```
**Answer:**
The code produces erratic or incorrect results (often remaining unchanged as `[10, 5, 40, 25]`).
The comparator contract requires returning a **negative number, zero, or a positive number**.
In this code, `a > b` returns a **Boolean** (`true` or `false`). When coerced to numbers:
- `true` becomes `1`.
- `false` becomes `0`.

Notice that this function **never returns a negative number** (`-1`). When `a < b`, it returns `0`, signaling to the sorting engine that `a` and `b` are equal. Because the comparator contract is violated, TimSort cannot determine when an element should precede another. The correct comparator is `(a, b) => a - b`.

### 3. Spot and fix the bugs in this binary search implementation:
```javascript
function findIndex(arr, target) {
  let low = 0;
  let high = arr.length;
  while (low < high) {
    let mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid;
    else high = mid;
  }
  return -1;
}
```
**Answer:**
There are four bugs causing infinite loops and out-of-bounds errors:
1. `high` is initialized to `arr.length` instead of `arr.length - 1`.
2. When `arr[mid] < target`, it sets `low = mid` instead of `low = mid + 1`. When `low` and `high` are adjacent, `mid` equals `low`, creating an **infinite loop**.
3. When `arr[mid] > target`, it sets `high = mid` instead of `high = mid - 1`.
4. `low < high` terminates prematurely when the window narrows to a single element (`low === high`), failing to check that element.
The correct loop is `while (low <= high)`, with `low = mid + 1` and `high = mid - 1`.

### 4. In a high-traffic Node.js API, should you sort a 200,000-row user dataset using `arr.sort()` in Express or using `ORDER BY` in PostgreSQL?
**Answer:**
You should almost always perform this sort in PostgreSQL using `ORDER BY`:
1. **Event Loop Starvation**: Node.js is single-threaded. Sorting 200,000 objects in memory blocks the event loop for hundreds of milliseconds, stalling concurrent HTTP requests and failing health checks.
2. **B-Tree Indexing**: PostgreSQL reads pre-sorted index nodes in $O(\log n + k)$ time without performing an active sorting calculation.
3. **Memory & Bandwidth**: Sorting in Node.js requires transferring all 200,000 rows across the network into heap memory. In PostgreSQL, `ORDER BY` paired with `LIMIT 50 OFFSET 0` transfers only the 50 requested rows.
4. **When In-Memory is Acceptable**: Only sort in Node.js if the dataset is already small ($< 1,000$ items) and cached locally in RAM.

---

## 12. Practice Problems

### 1. Binary Search - Easy
Given an array of integers `nums` sorted in ascending order and an integer `target`, return its index if found, or `-1` if absent.
- **Sample Input 1:** `nums = [-1, 0, 3, 5, 9, 12]`, `target = 9`
- **Expected Output 1:** `4`
- **Sample Input 2:** `nums = [-1, 0, 3, 5, 9, 12]`, `target = 2`
- **Expected Output 2:** `-1`

### 2. Sort Colors - Medium
Given an array `nums` with $n$ objects colored `0` (red), `1` (white), or `2` (blue), sort them in-place in a single pass with $O(1)$ extra space without using library sort.
- **Sample Input 1:** `nums = [2, 0, 2, 1, 1, 0]`
- **Expected Output 1:** `[0, 0, 1, 1, 2, 2]`
- **Sample Input 2:** `nums = [2, 0, 1]`
- **Expected Output 2:** `[0, 1, 2]`

### 3. Meeting Rooms - Easy
Given an array of meeting intervals `intervals[i] = [start, end]`, determine if a person could attend all meetings.
- **Sample Input 1:** `intervals = [[0, 30], [5, 10], [15, 20]]`
- **Expected Output 1:** `false`
- **Sample Input 2:** `intervals = [[7, 10], [2, 4]]`
- **Expected Output 2:** `true`

---

<nav aria-label="Lecture navigation">

[Previous: Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md)

</nav>
