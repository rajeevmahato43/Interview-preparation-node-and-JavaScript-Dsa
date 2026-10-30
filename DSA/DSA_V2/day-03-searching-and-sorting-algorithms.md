# Day 03: Searching & Elementary Sorting Algorithms

<nav aria-label="Lecture navigation">

[Previous: Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md)

</nav>

---

## 1. Searching Algorithms

**Searching** is the process of locating a target value's index within a collection or confirming that the value does not exist.

Searching efficiency depends entirely on whether the collection is ordered. On unsorted data, the computer has no clues about where an element lives and must inspect every slot one by one. On sorted data, the computer can eliminate huge blocks of elements in a single step.

To picture this physically, imagine looking for an entry across two different physical mediums:
* **The Messy Desk (Linear Search - $O(n)$):** You are looking for a specific receipt in an unsorted pile on your desk. You pick up the top paper, inspect it, set it aside, and repeat until found or the pile is exhausted. If there are 1,000 papers, you may need 1,000 inspections.
* **The Printed Dictionary (Binary Search - $O(\log n)$):** You are looking up the word "Network" in a 1,000-page printed dictionary. You do not begin on page 1 reading word by word. You flip directly to page 500 (the middle). "Network" comes after "Middle", so you instantly toss away the entire first 500 pages in one motion. You repeat on the remaining 500 pages, cutting the search space in half with every flip. You find your word in at most 10 checks ($\log_2 1000 \approx 10$).

```javascript
// Linear Search: Unsorted input, O(n) scan
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i; // Target found
  }
  return -1; // Target does not exist
}

// Binary Search: Sorted input, O(log n) halving
function binarySearch(arr, target) {
  let low = 0;
  let high = arr.length - 1;

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}

console.log(linearSearch([14, 42, 7, 88, 31], 7));     // 2
console.log(binarySearch([2, 5, 8, 12, 16, 23, 38], 16)); // 4
```

### 1.1 Linear Search

Linear Search is the baseline algorithm. It starts at `index 0` and advances sequentially to `index n - 1`. It makes zero assumptions about the data and requires no preprocessing.

```text
Array: [ 14, 42, 7, 88, 31 ], Target = 7

Step 1 (i = 0): Look at arr[0] (14). 14 === 7? No.  -> Advance pointer.
Step 2 (i = 1): Look at arr[1] (42). 42 === 7? No.  -> Advance pointer.
Step 3 (i = 2): Look at arr[2] (7).   7 === 7? Yes! -> Return index 2.
```

* **Best Case ($\Omega(1)$):** The target sits at index 0 (1 comparison).
* **Worst Case ($O(n)$):** The target is at the final index or absent entirely (requires checking all $n$ items).
* **Auxiliary Space ($O(1)$):** Only maintains a single primitive integer index counter in stack memory.

### 1.2 Binary Search

Binary Search works exclusively on **sorted collections**. Instead of inspecting items sequentially, it repeatedly checks the midpoint element:

```text
Sorted Array: [ 2, 5, 8, 12, 16, 23, 38 ], Target = 23
low = 0, high = 6

Pass 1: mid = 0 + Math.floor((6 - 0) / 2) = 3 -> arr[3] is 12.
        12 < 23 -> Target must be in the right half!
        Set low = mid + 1 = 4. Search space is now indices [4..6].

Pass 2: mid = 4 + Math.floor((6 - 4) / 2) = 5 -> arr[5] is 23.
        arr[5] === 23 -> Target found at index 5 in 2 steps!
```

* **Safe Midpoint Formula:** Never write `Math.floor((low + high) / 2)` in languages with fixed integer sizes, as large indices will cause integer overflow. Writing `low + Math.floor((high - low) / 2)` is mathematically identical and guarantees overflow safety.
* **Convergence Condition:** The loop condition `while (low <= high)` guarantees that single-element search spaces (`low === high`) are checked before terminating.

> [!NOTE]
> **Self-Check:** What happens if you search for a target smaller than `arr[0]` in Binary Search?  
> *Answer:* `high` decrements on every iteration until `high` becomes `-1`, causing `low <= high` (`0 <= -1`) to evaluate to `false` and cleanly returning `-1`.

### 1.3 Search Space Invariants

A **loop invariant** is a condition that remains true across every iteration of a loop. In Binary Search, the fundamental invariant is:
$$\text{If target exists in array, it is guaranteed to lie within the inclusive interval } [low, high].$$
Whenever `arr[mid] < target`, all elements in $[low, mid]$ are mathematically smaller than `target`. Discarding that entire prefix by setting `low = mid + 1` preserves the invariant without losing possible answers.

### 1.4 Searching Methods Table

| Method | Best Time | Average Time | Worst Time | Auxiliary Space | Input Prerequisite | Quick Example |
| :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| **Linear Search** | $O(1)$ | $O(n)$ | $O(n)$ | $O(1)$ | None (unsorted arrays) | `[4, 2, 8].indexOf(2)` $\to$ `1` |
| **Binary Search** | $O(1)$ | $O(\log n)$ | $O(\log n)$ | $O(1)$ | **Strictly Sorted** | `[2, 4, 8]` $\to$ checks middle `4` |
| **Hash Lookup** | $O(1)$ | $O(1)$ | $O(n)$ | $O(n)$ | Pre-indexed in `Map`/`Set` | `map.get("key")` $\to$ instant |

---

## 2. Elementary Sorting Algorithms

**Sorting** is the process of arranging elements into a defined sequential order (ascending or descending) based on a comparison rule.

Elementary sorting algorithms run in $O(n^2)$ time in the worst case, but they teach essential low-level mechanics: in-place memory mutation, loop invariants, sort stability, and adaptive execution.

To picture the three elementary sorts physically:
* **Bubble Sort:** Carbonated bubbles rising in a soda glass. The largest bubbles are the most buoyant and float to the surface first; similarly, the largest numbers bubble up to the end of the array on each pass.
* **Selection Sort:** Arranging students in a line by height. You scan the entire group to find the shortest student and swap them with position 0. Then you scan the rest to find the second shortest student and swap them with position 1.
* **Insertion Sort:** Organizing playing cards in your hand. You hold sorted cards in your left hand. You pick up a new card from the table and slide it backward past larger cards until it reaches its correct spot.

```javascript
// Demonstrating in-place swapping
const nums = [5, 1, 4, 2];
[nums[0], nums[1]] = [nums[1], nums[0]]; // ES6 destructuring swap
console.log(nums); // [1, 5, 4, 2]
```

### 2.1 Bubble Sort

Bubble Sort compares adjacent elements `(j, j + 1)` and swaps them if they are out of order. After pass 1, the largest element is guaranteed to sit at the final index. Adding a `swapped` boolean flag enables **adaptive $O(n)$ runtime** if the array is already sorted:

```javascript
// ✅ CORRECT: Bubble Sort with adaptive early exit
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
    // If no swaps occurred, array is already fully sorted!
    if (!swapped) break;
  }
  return arr;
}

console.log(bubbleSort([5, 1, 4, 2, 8])); // [1, 2, 4, 5, 8]
console.log(bubbleSort([1, 2, 3, 4, 5])); // [1, 2, 3, 4, 5] (Runs in O(n) time!)
```

### 2.2 Selection Sort

Selection Sort divides the array into a sorted prefix on the left and an unsorted suffix on the right. In each pass, it finds the index of the minimum element in the unsorted suffix and performs a single swap:

```text
Sort [ 29, 10, 14, 37, 13 ]:
Pass 1: Min is 10 at index 1 -> Swap with index 0: [ 10 | 29, 14, 37, 13 ]
Pass 2: Min is 13 at index 4 -> Swap with index 1: [ 10, 13 | 14, 37, 29 ]
Pass 3: Min is 14 at index 2 -> Swap with index 2: [ 10, 13, 14 | 37, 29 ]
Pass 4: Min is 29 at index 4 -> Swap with index 3: [ 10, 13, 14, 29 | 37 ] -> Sorted!
```

Selection Sort is valuable because it makes at most **$n - 1$ total swaps** ($O(n)$ memory writes), making it optimal for physical flash memory or EEPROMs where writes degrade hardware lifespan.

```javascript
// ✅ CORRECT: Selection Sort (Minimizes memory writes)
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

console.log(selectionSort([29, 10, 14, 37, 13])); // [10, 13, 14, 29, 37]
```

### 2.3 Insertion Sort

Insertion Sort picks up element `key = arr[i]` and shifts larger sorted elements rightward to open a slot for `key`. If an array is already sorted, the inner shift loop never executes, achieving **true $O(n)$ linear speed**:

```javascript
// ✅ CORRECT: Insertion Sort (Adaptive sliding)
function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    // Shift elements greater than key rightward
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key; // Place key into opening
  }
  return arr;
}

console.log(insertionSort([12, 11, 13, 5, 6])); // [5, 6, 11, 12, 13]
```

> [!NOTE]
> **Self-Check:** Why does V8's internal sorting engine (TimSort) use Insertion Sort for small arrays ($n \le 32$)?  
> *Answer:* Insertion Sort has virtually zero function call overhead, excellent CPU cache locality, and runs in $O(n)$ time on nearly-sorted data chunks.

### 2.4 Stability and Adaptability

* **Sort Stability:** A sort is **stable** if elements with equal comparison keys preserve their original relative order. For example, sorting users by `age` where two users share `age: 25` will preserve whoever appeared first. Bubble Sort and Insertion Sort are stable; Selection Sort is unstable.
* **Sort Adaptability:** A sort is **adaptive** if its running time automatically improves (e.g. from $O(n^2)$ down to $O(n)$) when input is partially or fully sorted. Bubble Sort (with flag) and Insertion Sort are adaptive.

### 2.5 Sorting Comparison Table

| Algorithm | Best Time | Average Time | Worst Time | Auxiliary Space | Stable? | Adaptive? | Maximum Swaps |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Bubble Sort** | **$O(n)$** | $O(n^2)$ | $O(n^2)$ | $O(1)$ | ✅ Yes | ✅ Yes | $O(n^2)$ |
| **Selection Sort**| $O(n^2)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ | ❌ No | ❌ No | **$O(n)$** |
| **Insertion Sort**| **$O(n)$** | $O(n^2)$ | $O(n^2)$ | $O(1)$ | ✅ Yes | ✅ Yes | $O(n^2)$ shifts |

---

## 3. Problem Walkthroughs

---

### 3.1 Search Insert Position

#### 3.1.1 Problem Statement
Given a sorted array of distinct integers `nums` and a target value `target`, return the index if the target is found. If not, return the index where it would be if it were inserted in order. You must write an algorithm with $O(\log n)$ runtime complexity.

* **Sample Input 1:** `nums = [1, 3, 5, 6]`, `target = 5` $\to$ **Expected Output:** `2`
* **Sample Input 2:** `nums = [1, 3, 5, 6]`, `target = 2` $\to$ **Expected Output:** `1`
* **Sample Input 3:** `nums = [1, 3, 5, 6]`, `target = 7` $\to$ **Expected Output:** `4`
* **Constraints:** $1 \le nums.length \le 10^5$, $-10^4 \le nums[i], target \le 10^4$, all integers in `nums` are distinct and sorted in ascending order.

#### 3.1.2 How to Think About It
Imagine a row of numbered numbered lockers sorted in ascending order: `[1, 3, 5, 6]`. You want to insert a package labeled `2`.

Place your left finger at the first locker (`low = 0`) and right finger at the last locker (`high = 3`).
Look at the middle locker (index 1, label 3). `2` is smaller than `3`. Since the lockers are sorted, `2` cannot possibly belong anywhere to the right of locker 1. Move your right finger leftward past locker 1 (`high = 0`).
Now middle locker is index 0 (label 1). `2` is larger than `1`. Move your left finger rightward past locker 0 (`low = 1`).
Your fingers have crossed (`low > high`). Notice where your left finger (`low`) stopped: right at locker index `1`! That is the exact insertion slot.

#### 3.1.3 Brute Force Approach & Bottleneck
The naive approach uses a linear scan from left to right:

```javascript
function searchInsertLinear(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] >= target) return i;
  }
  return nums.length;
}
```

* **The Bottleneck:** Inspects elements one by one ($O(n)$ time). For $10^5$ items, this takes $10^5$ comparisons and completely ignores the fact that the array is already sorted.

#### 3.1.4 The Pattern Insight
Because `nums` is sorted, we can use **Binary Search**. At each step, comparing `nums[mid]` against `target` cuts the search space in half ($O(\log n)$). When the target is not present, `low` consistently converges to the exact index where the target belongs.

#### 3.1.5 Pseudocode

```text
FUNCTION SearchInsert(nums, target):
  low = 0
  high = length(nums) - 1

  WHILE low <= high:
    mid = low + FLOOR((high - low) / 2)

    IF nums[mid] == target:
      RETURN mid
    ELSE IF nums[mid] < target:
      low = mid + 1
    ELSE:
      high = mid - 1

  RETURN low
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(log n) time, O(1) space Binary Search
function searchInsert(nums, target) {
  if (!Array.isArray(nums) || nums.length === 0) return 0;

  let low = 0;
  let high = nums.length - 1;

  while (low <= high) {
    // Overflow-safe midpoint calculation
    const mid = low + Math.floor((high - low) / 2);

    if (nums[mid] === target) {
      return mid; // Exact match found
    } else if (nums[mid] < target) {
      low = mid + 1; // Target is in right half
    } else {
      high = mid - 1; // Target is in left half
    }
  }

  // When loop terminates, low points to the exact insert position
  return low;
}

// ❌ ANTI-PATTERN: Infinite loop bug due to mid rounding and incorrect pointer advance
function buggyBinarySearch(nums, target) {
  let low = 0;
  let high = nums.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) low = mid; // BUG: Fails to advance past mid, causing infinite loop!
    else high = mid - 1;
  }
  return low;
}

// Runnable test cases
console.log(searchInsert([1, 3, 5, 6], 5)); // 2
console.log(searchInsert([1, 3, 5, 6], 2)); // 1
console.log(searchInsert([1, 3, 5, 6], 7)); // 4
console.log(searchInsert([1, 3, 5, 6], 0)); // 0
```

#### 3.1.7 Common Anti-Pattern
Writing `low = mid` instead of `low = mid + 1` causes an infinite loop when `low` and `high` are adjacent (e.g. `low = 0, high = 1`). `Math.floor((0 + 1) / 2)` computes `mid = 0`, resetting `low = 0` infinitely. Always advance past `mid` using `mid + 1` or `mid - 1`.

#### 3.1.8 Complexity Derivation
* **Time Complexity:** $O(\log n)$ — In each step, the search interval size is divided by 2 ($\frac{n}{2}, \frac{n}{4}, \dots, 1$). Halving $n$ requires at most $\lfloor \log_2 n \rfloor + 1$ iterations. For $n = 100,000$, this finishes in at most 17 operations.
* **Auxiliary Space Complexity:** $O(1)$ — Only maintains integer pointers (`low`, `high`, `mid`) in stack memory.

> [!NOTE]
> **Self-Check:** Why does `low` always point to the correct insertion index when the target is absent?  
> *Answer:* At loop exit, `high < low`. All elements before `low` are strictly smaller than `target`, and all elements after `high` are strictly greater, making `low` the correct insertion boundary.

---

### 3.2 Sort Colors

#### 3.2.1 Problem Statement
Given an array `nums` with $n$ objects colored red (`0`), white (`1`), or blue (`2`), sort them **in-place** so that objects of the same color are adjacent, in the order `0`, `1`, and `2`. You must solve this without using the library's sort function, in a single pass using $O(1)$ extra space.

* **Sample Input 1:** `nums = [2, 0, 2, 1, 1, 0]` $\to$ **Expected Output:** `[0, 0, 1, 1, 2, 2]`
* **Sample Input 2:** `nums = [2, 0, 1]` $\to$ **Expected Output:** `[0, 1, 2]`
* **Constraints:** $n == nums.length$, $1 \le n \le 10^5$, `nums[i]` is either `0`, `1`, or `2`.

#### 3.2.2 How to Think About It
Imagine sorting colored poker chips on a table: Red (`0`), White (`1`), and Blue (`2`).
You want three clean zones: Red on the left, White in the center, and Blue on the right.

Place your left thumb at the start (`low = 0`, boundary for 0s).
Place your right thumb at the end (`high = n - 1`, boundary for 2s).
Use an index finger (`mid = 0`) to examine each chip one by one:
* If chip is `0`: Swap it into your left thumb's spot (`low`) and advance both thumbs.
* If chip is `1`: It belongs right in the middle! Just advance your examining finger (`mid++`).
* If chip is `2`: Swap it into your right thumb's spot (`high`) and move your right thumb backward (`high--`). Keep your examining finger (`mid`) right where it is, because you need to inspect the new chip that just arrived from the right!

#### 3.2.3 Brute Force Approach & Bottleneck
The naive approach uses a two-pass counting sort:

```javascript
function sortColorsCount(nums) {
  let count0 = 0, count1 = 0, count2 = 0;
  for (const num of nums) {
    if (num === 0) count0++;
    else if (num === 1) count1++;
    else count2++;
  }
  let i = 0;
  while (count0--) nums[i++] = 0;
  while (count1--) nums[i++] = 1;
  while (count2--) nums[i++] = 2;
  return nums;
}
```

* **The Bottleneck:** While $O(n)$, Count Sort requires **two full passes** over memory and overwrites values. If array elements were objects (e.g. `{ color: 0, id: "session_4" }`), overwriting requires duplicate property writes. We want a true single-pass in-place partition.

#### 3.2.4 The Pattern Insight
Edsger Dijkstra's **Dutch National Flag algorithm** partitions the array into four regions using 3 pointers:
* `[0 .. low - 1]`: Confirmed 0s (Red)
* `[low .. mid - 1]`: Confirmed 1s (White)
* `[mid .. high]`: Unexamined elements (Unknown)
* `[high + 1 .. n - 1]`: Confirmed 2s (Blue)

When `mid > high`, the unexamined partition is empty and the entire array is sorted in a single pass.

#### 3.2.5 Pseudocode

```text
FUNCTION SortColors(nums):
  low = 0
  mid = 0
  high = length(nums) - 1

  WHILE mid <= high:
    IF nums[mid] == 0:
      SWAP(nums[low], nums[mid])
      low = low + 1
      mid = mid + 1
    ELSE IF nums[mid] == 1:
      mid = mid + 1
    ELSE:
      SWAP(nums[mid], nums[high])
      high = high - 1

  RETURN nums
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) single-pass Dijkstra 3-Way Partitioning
function sortColors(nums) {
  if (!Array.isArray(nums) || nums.length < 2) return nums;

  let low = 0;
  let mid = 0;
  let high = nums.length - 1;

  while (mid <= high) {
    if (nums[mid] === 0) {
      // Swap 0 to the low boundary
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      // 1 belongs in the middle
      mid++;
    } else {
      // Swap 2 to the high boundary
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--;
      // ⚠️ DO NOT advance mid! The newly swapped element at mid must still be inspected.
    }
  }

  return nums;
}

// ❌ ANTI-PATTERN / COMMON BUG: Advancing mid when swapping with high
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
      mid++; // BUG: Advances mid without checking what arrived from high!
    }
  }
  return nums;
}

// Runnable test cases
console.log(sortColors([2, 0, 2, 1, 1, 0])); // [0, 0, 1, 1, 2, 2]
console.log(sortColors([2, 0, 1]));          // [0, 1, 2]
console.log(sortColors([0]));                // [0]
console.log(buggySortColors([2, 0, 2, 1, 1, 0])); // [0, 0, 1, 2, 1, 2] (Corrupted order!)
```

#### 3.2.7 Common Anti-Pattern
Advancing `mid++` when swapping with `high` is the classic candidate trap. When `nums[mid] === 2`, swapping with `nums[high]` places an uninspected element into `mid`. If that arriving element happens to be `0`, advancing `mid++` skips it forever, leaving a `0` misplaced in the middle zone.

#### 3.2.8 Complexity Derivation
* **Time Complexity:** $O(n)$ — On every iteration of the `while` loop, either `mid` increments or `high` decrements. The two pointers start $n$ distance apart and cross in at most $n$ operations.
* **Auxiliary Space Complexity:** $O(1)$ — Mutates the array entirely in-place with zero extra heap allocations.

> [!NOTE]
> **Self-Check:** Why don't we need to re-inspect `nums[mid]` after swapping with `nums[low]`?  
> *Answer:* Elements swapped from `low` into `mid` are guaranteed to be `1`s that were already inspected earlier by `mid` as it traversed past `low`.

---

### 3.3 Majority Element

#### 3.3.1 Problem Statement
Given an array `nums` of size $n$, return the **majority element**. The majority element is the element that appears **more than $\lfloor n / 2 \rfloor$ times**. You may assume that the majority element always exists in the array.

* **Sample Input 1:** `nums = [3, 2, 3]` $\to$ **Expected Output:** `3`
* **Sample Input 2:** `nums = [2, 2, 1, 1, 1, 2, 2]` $\to$ **Expected Output:** `2`
* **Constraints:** $n == nums.length$, $1 \le n \le 5 \times 10^4$, $-10^9 \le nums[i] \le 10^9$.

#### 3.3.2 How to Think About It
Imagine a crowded parliament room where members of different political parties are voting. One party is the absolute majority, holding more than 50% of all seats.

Whenever two members from different political parties disagree, they both agree to step outside the room and cancel each other out. Because the majority party holds more than half of all seats, even if every other political party in the room gangs up and cancels votes with them, the majority party will still have representatives standing at the end!

#### 3.3.3 Brute Force Approach & Bottleneck
The naive approach counts the frequency of every element using nested loops or a Hash Map:

```javascript
function majorityElementHashMap(nums) {
  const counts = new Map();
  const threshold = Math.floor(nums.length / 2);
  for (const num of nums) {
    const nextCount = (counts.get(num) || 0) + 1;
    if (nextCount > threshold) return num;
    counts.set(num, nextCount);
  }
  return -1;
}
```

* **The Bottleneck:** While $O(n)$ time, allocating a `Map` consumes $O(n)$ heap memory. For $10^6$ elements, this allocates thousands of map nodes. In interviews, you are expected to solve this in **$O(1)$ auxiliary space**.

#### 3.3.4 The Pattern Insight
The **Boyer-Moore Voting Algorithm** tracks a `candidate` and a `count`:
1. If `count === 0`, we pick the current number as the new `candidate`.
2. If the current number matches `candidate`, increment `count++`.
3. If the current number differs from `candidate`, decrement `count--` (mutual cancellation).

Because the majority element appears more than $n / 2$ times, its occurrences strictly outnumber all other elements combined. Mutual cancellation cannot extinguish the majority element.

#### 3.3.5 Pseudocode

```text
FUNCTION MajorityElement(nums):
  candidate = nums[0]
  count = 0

  FOR EACH num IN nums:
    IF count == 0:
      candidate = num
    
    IF num == candidate:
      count = count + 1
    ELSE:
      count = count - 1

  RETURN candidate
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(1) space Boyer-Moore Voting Algorithm
function majorityElement(nums) {
  let candidate = null;
  let count = 0;

  for (let i = 0; i < nums.length; i++) {
    const num = nums[i];

    // When count drops to 0, pick current element as new candidate
    if (count === 0) {
      candidate = num;
    }

    // Increment if matching, decrement if conflicting
    count += (num === candidate) ? 1 : -1;
  }

  return candidate;
}

// ❌ ANTI-PATTERN: Sorting array takes O(n log n) and mutates input
function slowMajorityElement(nums) {
  // Sorts array to inspect nums[Math.floor(n/2)], burning O(n log n) time!
  nums.sort((a, b) => a - b);
  return nums[Math.floor(nums.length / 2)];
}

// Runnable test cases
console.log(majorityElement([3, 2, 3]));             // 3
console.log(majorityElement([2, 2, 1, 1, 1, 2, 2])); // 2
console.log(majorityElement([10]));                  // 10
```

#### 3.3.7 Common Anti-Pattern
Sorting the array with `nums.sort((a, b) => a - b)` and returning `nums[Math.floor(n / 2)]` is a popular shortcut. However, it mutates the caller's input array and runs in $O(n \log n)$ time, which is an order of magnitude slower than Boyer-Moore's $O(n)$ single-pass linear time.

#### 3.3.8 Complexity Derivation
* **Time Complexity:** $O(n)$ — Single linear pass over `nums`. Exactly $n$ iterations performing constant-time arithmetic ($O(1)$).
* **Auxiliary Space Complexity:** $O(1)$ — Only maintains two primitive scalar variables (`candidate` and `count`) in stack memory.

> [!NOTE]
> **Self-Check:** What would Boyer-Moore return if no element appeared more than $n / 2$ times?  
> *Answer:* It would still return a candidate, but that candidate might not be a majority. If the existence of a majority element is not guaranteed, you must make a second $O(n)$ verification pass to confirm its frequency exceeds $n / 2$.

---

## 4. Tricky Edge Cases

* **The JavaScript Default `sort()` Lexicographical Trap:** In JavaScript, `[10, 2, 5].sort()` returns `[10, 2, 5]` because the default comparator converts elements to strings and compares UTF-16 code units (`"10"` comes before `"2"`). Always supply an explicit numeric comparator: `arr.sort((a, b) => a - b)`.
* **Binary Search Midpoint Calculation Overflow:** In typed arrays or other languages, calculating midpoint via `(low + high) / 2` overflows positive integer bounds when $low + high > 2^{31} - 1$. Always use `low + Math.floor((high - low) / 2)`.
* **Binary Search Loop Condition (`low <= high` vs `low < high`):** Using `low < high` terminates before inspecting a 1-element remaining interval when `low === high`. Use `low <= high` when searching for exact values.
* **Empty and Single-Element Arrays (`[]`, `[42]`):** Guard against empty arrays upfront. A 1-element array should return index `0` immediately without entering sorting or partitioning loops.
* **All Identical Elements (`[2, 2, 2, 2]`):** In Dutch National Flag partitioning, all items are identical. The algorithm must advance pointers smoothly without entering infinite self-swapping loops.
* **In-Place Mutation vs Non-Mutating Methods (`sort()` vs `toSorted()`):** `Array.prototype.sort()` mutates the original array in-place. If preserving the original array order is required by the caller, use ES2023 `toSorted()` or copy first with `[...arr].sort()`.

---

## 5. Summary Cheat Sheet

* **Search Boundary:** Unsorted arrays require $O(n)$ Linear Search; sorted arrays enable $O(\log n)$ Binary Search.
* **Binary Search Midpoint Rule:** Always compute `mid` with `low + Math.floor((high - low) / 2)` to eliminate integer overflow risks.
* **Bubble Sort Mechanics:** Adjacent pairwise swaps. Adding a `swapped` boolean flag provides adaptive $O(n)$ speed for sorted data.
* **Selection Sort Advantage:** Minimizes writes to at most $n - 1$ total swaps ($O(n)$ writes), ideal for flash memory systems.
* **Insertion Sort Advantage:** Adaptive sliding; best-case $O(n)$ for nearly-sorted data; serves as the internal engine for V8 TimSort chunks ($n \le 32$).
* **Dutch National Flag Invariant:** Uses 3 pointers (`low`, `mid`, `high`) to partition 3 values in a single $O(n)$ pass without extra memory.
* **Boyer-Moore Voting:** Mutually cancels conflicting elements; the majority candidate ($> 50\%$) is mathematically guaranteed to survive.

---

## 6. Practice Problems

### 6.1 First Bad Version (Easy/Warm-Up)
* **Problem:** You have $n$ product versions `[1, 2, ..., n]`. Since each version is developed based on the previous version, all versions after a bad version are also bad. Given an API `isBadVersion(version)`, find the first bad version using the minimum number of API calls.
* **Sample Input:** `n = 5`, first bad version is `4` $\to$ **Expected Output:** `4`
* **Socratic Guidance:**
  * *Hint 1:* The version status is monotonically sorted: `[false, false, false, true, true]`.
  * *Hint 2:* How can you use Binary Search to locate the exact boundary where `isBadVersion` flips from `false` to `true` in $O(\log n)$ time?

### 6.2 Find Minimum in Rotated Sorted Array (Medium)
* **Problem:** An array of length $n$ sorted in ascending order was rotated between 1 and $n$ times. Given the rotated array `nums` of unique elements, return the minimum element in $O(\log n)$ time.
* **Sample Input:** `nums = [3, 4, 5, 1, 2]` $\to$ **Expected Output:** `1`
* **Socratic Guidance:**
  * *Hint 1:* Compare `nums[mid]` with `nums[high]`.
  * *Hint 2:* If `nums[mid] > nums[high]`, the inflection point (minimum) must lie strictly in the right half (`low = mid + 1`). Otherwise, it lies in the left half including `mid` (`high = mid`).

### 6.3 Meeting Rooms / Interval Overlap (Medium/Hard)
* **Problem:** Given an array of meeting time intervals where `intervals[i] = [start, end]`, determine if a person could attend all meetings without overlap.
* **Sample Input:** `intervals = [[0, 30], [5, 10], [15, 20]]` $\to$ **Expected Output:** `false` (Interval `[0, 30]` overlaps with `[5, 10]`)
* **Socratic Guidance:**
  * *Hint 1:* Without sorting, checking every meeting against every other meeting takes $O(n^2)$ time.
  * *Hint 2:* If you sort meetings by their `start` time in $O(n \log n)$, what simple single-pass condition ($O(n)$) checks if adjacent meetings collide?

---

<nav aria-label="Lecture navigation">

[Previous: Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md)

</nav>
