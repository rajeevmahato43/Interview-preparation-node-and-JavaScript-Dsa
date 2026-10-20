# Day 03: Searching & Elementary Sorting

<nav aria-label="Lecture navigation">

[Previous: Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Asymptotic complexity ($O(1), O(\log n), O(n), O(n^2)$).
- [Day 02: Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md) — Contiguous memory, zero-based indexing, and in-place element swapping.

---

## 1. What is an Algorithm?

An **algorithm** is a step-by-step set of instructions designed to solve a specific problem or perform a computation. It is not just arbitrary code; it is a finite sequence of well-defined operations that takes an input and produces an output.

Every valid computer algorithm must satisfy four core properties:

1. **Finiteness**: The algorithm must always terminate after a countable number of execution steps. It cannot run into an unintended infinite loop.
2. **Definiteness**: Each step must be clear, unambiguous, and precisely defined. Given the exact same state, a deterministic step must always produce the exact same transition.
3. **Correctness**: For every valid input within the problem constraints, the algorithm must produce the correct answer and preserve all problem invariants.
4. **Efficiency**: The algorithm must accomplish the goal while respecting resource boundaries, minimizing both computational time (CPU instructions) and auxiliary space (extra RAM).

> **Loop Invariant**: A formal condition or property that is guaranteed to be true before a loop begins, remains true after each iteration, and explains why the algorithm is correct when the loop finishes.

---

## 2. Searching: Linear vs Binary Search

Searching means finding the location (index) of a target item in a collection, or confirming that the item does not exist.

```text
  1. LINEAR SEARCH (Unsorted Array: O(n) Time)
     [ 14 | 42 |  7 | 88 | 31 ]  --> Scans index 0, 1, 2, 3... one by one until target found.

  2. BINARY SEARCH (Sorted Array: O(log n) Time)
     Search space: [ 2, 5, 8, 12, 16, 23, 38, 56, 72 ], Target: 23
     
     Step 1: low=0, high=8, mid=4 (val=16) --> 23 > 16: Discard entire left half [2..16]
     Step 2: low=5, high=8, mid=6 (val=38) --> 23 < 38: Discard entire right half [38..72]
     Step 3: low=5, high=5, mid=5 (val=23) --> 23 == 23: Found target at index 5!
```

### Quick Comparison

| Algorithm | Requires Sorted Array? | Best Time | Average Time | Worst Time | Space Complexity |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Linear Search** | ❌ No | $O(1)$ | $O(n)$ | $O(n)$ | $O(1)$ |
| **Binary Search** | ✅ **Yes** | $O(1)$ | $O(\log n)$ | $O(\log n)$ | $O(1)$ |

---

### Linear Search: The Sequential Scan

**Linear Search** checks every item in the array one by one, from index $0$ to index $n - 1$, until it finds the target or reaches the end of the array. It does not require elements to be in any sorted order, and it does not make any assumptions about the data.

> **Linear Scan**: Checking items one by one in sequential order from index $0$ to $n - 1$.

Imagine looking for a lost receipt in an unsorted pile of papers on your desk. You have no choice but to pick up the top paper, look at it, put it aside, and inspect the next one until you either find the receipt or exhaust the pile.

Let us search for the target value `7` in the following unsorted array:
```javascript
const items = [14, 42, 7, 88, 31];
const target = 7;
```

```text
Initial Array:
Index:   0    1    2    3    4
Value: [ 14 | 42 |  7 | 88 | 31 ]

Step 0: Look at index 0 -> Value is 14. (14 === 7 is false). Move to next index.
Step 1: Look at index 1 -> Value is 42. (42 === 7 is false). Move to next index.
Step 2: Look at index 2 -> Value is 7.  (7 === 7 is true! MATCH FOUND).
Return index 2 immediately. Total comparisons: 3.
```

Now, consider searching for `99` in the same array:
- Index 0: `14 !== 99`
- Index 1: `42 !== 99`
- Index 2: `7 !== 99`
- Index 3: `88 !== 99`
- Index 4: `31 !== 99`
- The loop ends because all 5 items were checked. Return `-1`. Total comparisons: 5 ($n$ comparisons).

```javascript
// Node.js code
"use strict";

// ✅ CORRECT: Scans sequentially and returns early when found
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i; // Early exit on match
    }
  }
  return -1; // Exhausted array without match
}

// ❌ COMMON BUG: Placing return -1 inside the loop
function buggyLinearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i;
    }
    return -1; // BUG! Exits immediately after checking index 0!
  }
  return -1;
}

const data = [14, 42, 7, 88, 31];
console.log(linearSearch(data, 7));       // 2 (Correct)
console.log(linearSearch(data, 99));      // -1 (Correct)
console.log(buggyLinearSearch(data, 7));  // -1 (Bug! Target at index 2 was never reached)
```

- **Time Complexity**: Best case is $O(1)$ (target is at index 0). Worst and average case is $O(n)$ (target is at the end or absent).
- **Space Complexity**: $O(1)$ auxiliary space (only allocates one loop counter variable `i`).

---

### Binary Search: The Divide-and-Conquer

**Binary Search** finds the index of a target element in a **sorted array** by repeatedly comparing the target to the middle element. If the target does not match the middle element, it eliminates half of the remaining elements from consideration in a single step.

> **Binary Search**: An $O(\log n)$ search algorithm that repeatedly halves a sorted search space by checking the middle element.

> **Search Space**: The range of indices `[low ... high]` in which the target value could still mathematically exist.

Imagine looking up the word **"Node"** in a printed 1,000-page dictionary. You do not start at page 1 and read every word. You open the book roughly in the middle (page 500, letter "M"). Because "N" comes after "M" alphabetically, you instantly know "Node" cannot exist on pages 1 to 500. You discard the entire first half of the book in one motion and repeat the process on the remaining pages!

> When the input size $n$ doubles, by how many comparisons does binary search increase? By exactly 1 comparison!

Let us search for `target = 23` in a sorted 9-element array:
```javascript
const nums = [2, 5, 8, 12, 16, 23, 38, 56, 72];
const target = 23;
```

```text
Initial State:
Index:    0   1   2   3    4    5    6    7    8
Value:  [ 2 | 5 | 8 | 12 | 16 | 23 | 38 | 56 | 72 ]
Pointers: ^                   ^                   ^
         low                 mid                 high
         (0)                 (4)                 (8)

Iteration 1:
- low = 0, high = 8
- Calculate mid = 0 + Math.floor((8 - 0) / 2) = 4
- Inspect value at mid: nums[4] is 16.
- Compare target with mid: 23 > 16.
- Insight: Because nums is sorted, all items at indices 0..4 are <= 16. None can be 23.
- Discard the left half: set low = mid + 1 = 5.

Search Space shrinks to indices [5 ... 8]:
Index:    0   1   2   3   4    5    6    7    8
Value:  [ . | . | . | . | . | 23 | 38 | 56 | 72 ]
Pointers:                     ^         ^         ^
                             low       mid       high
                             (5)       (6)       (8)

Iteration 2:
- low = 5, high = 8
- Calculate mid = 5 + Math.floor((8 - 5) / 2) = 6
- Inspect value at mid: nums[6] is 38.
- Compare target with mid: 23 < 38.
- Insight: Because nums is sorted, all items at indices 6..8 are >= 38. None can be 23.
- Discard the right half: set high = mid - 1 = 5.

Search Space shrinks to index [5 ... 5]:
Index:    0   1   2   3   4    5    6   7   8
Value:  [ . | . | . | . | . | 23 | . | . | . ]
Pointers:                     ^
                           low, mid, high
                             (5)

Iteration 3:
- low = 5, high = 5
- Calculate mid = 5 + Math.floor((5 - 5) / 2) = 5
- Inspect value at mid: nums[5] is 23.
- Compare target with mid: 23 === 23. MATCH FOUND!
- Return index 5 immediately. Total comparisons: 3!
```

#### What Happens When the Target is Missing?
Suppose we search for `target = 10` in the same array:
1. `low = 0, high = 8, mid = 4 (val = 16)`. Since `10 < 16`, set `high = 3`.
2. `low = 0, high = 3, mid = 1 (val = 5)`. Since `10 > 5`, set `low = 2`.
3. `low = 2, high = 3, mid = 2 (val = 8)`. Since `10 > 8`, set `low = 3`.
4. `low = 3, high = 3, mid = 3 (val = 12)`. Since `10 < 12`, set `high = 2`.
5. Now `low = 3` and `high = 2`. Notice `low > high`!
6. The search space is exhausted. The loop terminates and returns `-1`.

> [!NOTE]
> When binary search terminates without finding the target, the `low` pointer points to the exact index where the target would need to be inserted to maintain sorted order! Here, `low = 3`, and 10 belongs between 8 (index 2) and 12 (index 3).


```javascript
// Node.js code
"use strict";

// ✅ CORRECT: Standard, production-grade binary search
function binarySearch(arr, target) {
  let low = 0;
  let high = arr.length - 1;

  // Invariant: If target exists in arr, it MUST be within arr[low ... high]
  while (low <= high) {
    // Safe midpoint calculation (prevents 32-bit integer overflow)
    const mid = low + Math.floor((high - low) / 2);

    if (arr[mid] === target) {
      return mid; // Target matched!
    } else if (arr[mid] < target) {
      low = mid + 1; // Target is in the right partition
    } else {
      high = mid - 1; // Target is in the left partition
    }
  }

  return -1; // Target not found
}

// ❌ COMMON BUG 1: Missing Math.floor in JavaScript
function buggyFloatMidpoint(arr, target) {
  let low = 0;
  let high = arr.length - 1;
  while (low <= high) {
    const mid = (low + high) / 2; // BUG: In JS, 0 + 1 / 2 = 0.5! arr[0.5] is undefined!
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}

// ❌ COMMON BUG 2: Running Binary Search on an UNSORTED array
const unsorted = [10, 2, 88, 1, 5, 23];
console.log(binarySearch(unsorted, 23)); // -1 (FAILED! 23 is present, but binary search failed!)

const sorted = [1, 2, 5, 10, 23, 88];
console.log(binarySearch(sorted, 23));   // 4 (Correct!)
```

---

## 3. The Three Elementary Sorting Algorithms ($O(n^2)$)

Sorting means arranging a collection of items in a specified order (typically ascending or descending).

Modern JavaScript runtimes use **TimSort** ($O(n \log n)$), but every mid-to-senior backend engineer is expected to master the three classic elementary sorts:
1. **Bubble Sort**
2. **Selection Sort**
3. **Insertion Sort**

### Why Learn $O(n^2)$ Elementary Sorts?
- **Foundational mental models**: They teach how nested loops, pointer boundaries, in-place swaps, and loop invariants operate together.
- **Used inside advanced algorithms**: Real-world hybrid sorting algorithms (like V8's TimSort or C++ `std::sort` IntroSort) switch to **Insertion Sort** whenever sub-arrays shrink to fewer than 32 or 64 elements, because Insertion Sort has virtually zero function-call overhead and runs faster on small arrays than recursive divide-and-conquer sorts.
- **Frequent interview baseline**: Interviewers test whether you can manipulate array indices without off-by-one errors or auxiliary memory leaks.

> **In-Place Algorithm**: An algorithm that transforms input without allocating auxiliary memory proportional to the input size ($O(1)$ auxiliary space).

> **Sort Stability**: A guarantee that items with identical comparison keys retain their original relative order after sorting.

---

### 1. Bubble Sort: Bubbling Adjacent Elements

**Bubble Sort** repeatedly steps through the array, compares adjacent elements, and swaps them if they are in the wrong order. On each complete pass through the array, the largest unsorted element "bubbles up" to its permanent position at the end.

Think of carbonated bubbles rising in a glass of water. Larger, lighter gas bubbles rise to the surface faster. In this algorithm, the largest numbers bubble up to the right side of the array with each pass.

Let us sort the array: `[5, 1, 4, 2, 8]`

```text
Initial Array: [ 5, 1, 4, 2, 8 ]

============================================================
PASS 1 (i = 0): Bubble the largest item to the end (index 4)
============================================================
Compare index 0 & 1: [5, 1], 4, 2, 8 -> 5 > 1  --> SWAP!  --> [ 1, 5, 4, 2, 8 ]
Compare index 1 & 2: 1, [5, 4], 2, 8 -> 5 > 4  --> SWAP!  --> [ 1, 4, 5, 2, 8 ]
Compare index 2 & 3: 1, 4, [5, 2], 8 -> 5 > 2  --> SWAP!  --> [ 1, 4, 2, 5, 8 ]
Compare index 3 & 4: 1, 4, 2, [5, 8] -> 5 < 8  --> No Swap --> [ 1, 4, 2, 5, 8 ]

End of Pass 1: The largest element (8) is now in its FINAL sorted position!
Sorted portion: [ 8 ] at index 4.

============================================================
PASS 2 (i = 1): Bubble the 2nd largest item to index 3
============================================================
Compare index 0 & 1: [1, 4], 2, 5, 8 -> 1 < 4  --> No Swap --> [ 1, 4, 2, 5, 8 ]
Compare index 1 & 2: 1, [4, 2], 5, 8 -> 4 > 2  --> SWAP!  --> [ 1, 2, 4, 5, 8 ]
Compare index 2 & 3: 1, 2, [4, 5], 8 -> 4 < 5  --> No Swap --> [ 1, 2, 4, 5, 8 ]
(Notice: We do NOT need to check index 3 & 4 because 8 is already sorted!)

End of Pass 2: Element 5 is now in its FINAL sorted position!
Sorted portion: [ 5, 8 ] at indices 3..4.

============================================================
PASS 3 (i = 2): Check remaining unsorted items [1, 2, 4]
============================================================
Compare index 0 & 1: [1, 2], 4, 5, 8 -> 1 < 2  --> No Swap
Compare index 1 & 2: 1, [2, 4], 5, 8 -> 2 < 4  --> No Swap

End of Pass 3: ZERO swaps occurred during this entire pass!
Early-Exit Optimization triggered: The array is already completely sorted! Stop immediately!
Final Sorted Array: [ 1, 2, 4, 5, 8 ]
```

```javascript
// Node.js code
"use strict";

// ✅ OPTIMIZED BUBBLE SORT: Includes early-exit flag & tight inner loop bound
function bubbleSort(arr) {
  const n = arr.length;

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;

    // Inner loop only scans the remaining unsorted portion: (n - 1 - i)
    for (let j = 0; j < n - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        // Swap adjacent elements using ES6 destructuring
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }

    // If no two elements were swapped in this pass, array is already sorted!
    if (!swapped) {
      break;
    }
  }

  return arr;
}

// ❌ UNOPTIMIZED BUBBLE SORT: Runs all n^2 comparisons even on sorted arrays
function unoptimizedBubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - 1; j++) { // Inefficient: checks already-sorted ends!
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}

const numbers = [5, 1, 4, 2, 8];
console.log(bubbleSort(numbers)); // [1, 2, 4, 5, 8]
```

- **Time Complexity**:
  - Best Case: $O(n)$ when already sorted (inner loop does 1 pass, 0 swaps, triggers early exit).
  - Worst Case: $O(n^2)$ when reverse sorted ($[5, 4, 3, 2, 1]$ requires $\frac{n(n-1)}{2}$ swaps).
  - Average Case: $O(n^2)$.
- **Space Complexity**: $O(1)$ auxiliary space (in-place swaps).
- **Stability**: **Stable** (adjacent elements are only swapped if strictly greater `arr[j] > arr[j + 1]`, preserving equal items' order).

---

### 2. Selection Sort: Selecting the Extremes

**Selection Sort** divides the array into a sorted subarray on the left and an unsorted subarray on the right. In each pass, it scans the unsorted subarray to find the **minimum element**, and swaps that minimum element with the first unsorted item.

Imagine you have a group of students standing in line by height. You scan everyone from left to right, find the shortest person, and have them swap places with the first person in line. Then you scan the remaining students, find the next shortest, and swap them with the second person.


Let us sort the array: `[29, 10, 14, 37, 13]`

```text
Initial Array: [ 29 | 10 | 14 | 37 | 13 ]

============================================================
PASS 1 (i = 0): Find minimum in index range [0 ... 4]
============================================================
- Start by assuming minIndex = 0 (value 29).
- Compare with index 1 (10): 10 < 29 --> update minIndex = 1
- Compare with index 2 (14): 14 > 10 --> no change
- Compare with index 3 (37): 37 > 10 --> no change
- Compare with index 4 (13): 13 > 10 --> no change
Minimum found is at index 1 (value 10).
Swap arr[0] (29) with arr[1] (10):
Array becomes: [ 10 | 29, 14, 37, 13 ]
                ^^^^  ^^^^^^^^^^^^^^
               Sorted    Unsorted

============================================================
PASS 2 (i = 1): Find minimum in index range [1 ... 4]
============================================================
- Assume minIndex = 1 (value 29).
- Compare with index 2 (14): 14 < 29 --> update minIndex = 2
- Compare with index 3 (37): 37 > 14 --> no change
- Compare with index 4 (13): 13 < 14 --> update minIndex = 4
Minimum found is at index 4 (value 13).
Swap arr[1] (29) with arr[4] (13):
Array becomes: [ 10, 13 | 14, 37, 29 ]

============================================================
PASS 3 (i = 2): Find minimum in index range [2 ... 4]
============================================================
- Assume minIndex = 2 (value 14).
- Compare with index 3 (37): 37 > 14 --> no change
- Compare with index 4 (29): 29 > 14 --> no change
Minimum found is already at index 2 (value 14). minIndex === i, no swap needed!
Array remains: [ 10, 13, 14 | 37, 29 ]

============================================================
PASS 4 (i = 3): Find minimum in index range [3 ... 4]
============================================================
- Assume minIndex = 3 (value 37).
- Compare with index 4 (29): 29 < 37 --> update minIndex = 4
Minimum found is at index 4 (value 29).
Swap arr[3] (37) with arr[4] (29):
Array becomes: [ 10, 13, 14, 29 | 37 ]

Sorted! Final Result: [ 10, 13, 14, 29, 37 ]
```

#### Selection Sort Memory Advantage: Minimal Swaps
Unlike Bubble Sort (which performs up to $O(n^2)$ swaps), Selection Sort performs **at most $n - 1$ swaps in total**. If writing to memory is physically expensive (such as updating flash memory or EEPROM chips with limited write endurance), Selection Sort minimizes memory writes.

#### Why Selection Sort is NOT Stable
Consider the array: `[ 5a, 5b, 2 ]`
1. Minimum is `2` at index 2.
2. We swap `arr[0]` (`5a`) with `arr[2]` (`2`).
3. The array becomes `[ 2, 5b, 5a ]`.
Notice that `5b` now comes before `5a`! The original relative order was broken.


```javascript
// Node.js code
"use strict";

// ✅ CORRECT: Selection Sort with self-swap avoidance check
function selectionSort(arr) {
  const n = arr.length;

  for (let i = 0; i < n - 1; i++) {
    let minIndex = i;

    // Scan remaining unsorted portion to find index of smallest item
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIndex]) {
        minIndex = j;
      }
    }

    // Only swap if a strictly smaller item was located
    if (minIndex !== i) {
      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
    }
  }

  return arr;
}

const list = [29, 10, 14, 37, 13];
console.log(selectionSort(list)); // [10, 13, 14, 29, 37]
```

- **Time Complexity**: $O(n^2)$ across **all** cases (best, worst, average) because it always scans the entire remaining unsorted array to find the minimum. It is **not adaptive**.
- **Space Complexity**: $O(1)$ auxiliary space.
- **Stability**: **Unstable**.

---

### 3. Insertion Sort: Inserting into a Sorted Hand

**Insertion Sort** builds the sorted array one element at a time. It takes the next element from the unsorted portion and compares it backward against elements in the sorted portion, shifting larger elements one position to the right to create an empty slot to insert it.

> **Adaptive Algorithm**: An algorithm whose running time automatically improves (e.g., drops to $O(n)$) when the input is already partially or completely sorted.

This is the exact way most people sort playing cards in their hand. You hold cards in your left hand. You pick up a new card with your right hand, slide it from right to left past cards that are bigger than it, and insert it into its proper position.

Let us sort the array: `[8, 3, 5, 1, 4]`

```text
Initial Array: [ 8 | 3, 5, 1, 4 ]
Index 0 ([8]) is trivially considered already sorted on its own.

============================================================
STEP 1 (i = 1): Pick key = 3, insert into sorted portion [8]
============================================================
- Current key to insert: 3
- Compare key (3) with arr[0] (8): 8 > 3 --> Shift 8 rightward to index 1.
  Array temporarily looks like: [ 8, 8, 5, 1, 4 ]
- Pointer reached index -1 (start of array).
- Insert key (3) at index 0.
Array becomes: [ 3, 8 | 5, 1, 4 ]
               ^^^^^^
               Sorted

============================================================
STEP 2 (i = 2): Pick key = 5, insert into sorted portion [3, 8]
============================================================
- Current key to insert: 5
- Compare key (5) with arr[1] (8): 8 > 5 --> Shift 8 rightward to index 2.
  Array temporarily looks like: [ 3, 8, 8, 1, 4 ]
- Compare key (5) with arr[0] (3): 3 < 5 --> 3 is smaller! Stop shifting!
- Insert key (5) into the slot opened at index 1.
Array becomes: [ 3, 5, 8 | 1, 4 ]

============================================================
STEP 3 (i = 3): Pick key = 1, insert into sorted portion [3, 5, 8]
============================================================
- Current key to insert: 1
- Compare with 8: 8 > 1 --> Shift 8 rightward: [ 3, 5, 8, 8, 4 ]
- Compare with 5: 5 > 1 --> Shift 5 rightward: [ 3, 5, 5, 8, 4 ]
- Compare with 3: 3 > 1 --> Shift 3 rightward: [ 3, 3, 5, 8, 4 ]
- Reached index -1. Insert key (1) at index 0.
Array becomes: [ 1, 3, 5, 8 | 4 ]

============================================================
STEP 4 (i = 4): Pick key = 4, insert into sorted portion [1, 3, 5, 8]
============================================================
- Current key to insert: 4
- Compare with 8: 8 > 4 --> Shift 8 rightward: [ 1, 3, 5, 8, 8 ]
- Compare with 5: 5 > 4 --> Shift 5 rightward: [ 1, 3, 5, 5, 8 ]
- Compare with 3: 3 < 4 --> Stop shifting!
- Insert key (4) at index 2.
Array becomes: [ 1, 3, 4, 5, 8 ]

Sorted! Final Result: [ 1, 3, 4, 5, 8 ]
```

#### Why Insertion Sort is Superior for Nearly-Sorted Data
If an array is already sorted, like `[1, 2, 3, 4, 5]`:
- For each element `arr[i]`, it compares once with `arr[i - 1]`.
- Since `arr[i - 1] < arr[i]`, the inner while loop immediately terminates after 0 shifts!
- The algorithm finishes in **$O(n)$ time** with only $n - 1$ comparisons.


```javascript
// Node.js code
"use strict";

// ✅ EFFICIENT INSERTION SORT: Uses single assignment shifts instead of multi-step swaps
function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;

    // Shift elements of arr[0..i-1] that are greater than key to one position ahead
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j]; // Shift rightward
      j--;
    }

    arr[j + 1] = key; // Place key into its correct slot
  }

  return arr;
}

// ❌ SLOWER VARIANT: Swapping at every step instead of shifting
function swapInsertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    let j = i;
    // Each swap does 3 assignments! Shifting only does 1 assignment per step.
    while (j > 0 && arr[j - 1] > arr[j]) {
      [arr[j], arr[j - 1]] = [arr[j - 1], arr[j]];
      j--;
    }
  }
  return arr;
}

const cards = [8, 3, 5, 1, 4];
console.log(insertionSort(cards)); // [1, 3, 4, 5, 8]
```

- **Time Complexity**:
  - Best Case: $O(n)$ (already sorted array).
  - Worst Case: $O(n^2)$ (reverse sorted array).
  - Average Case: $O(n^2)$.
- **Space Complexity**: $O(1)$ auxiliary space.
- **Stability**: **Stable** (does not shift equal values; `arr[j] > key` stops when `arr[j] === key`).

---

### Comparison of Elementary Sorting Algorithms

| Algorithm | Best Time | Average Time | Worst Time | Space | Stable? | Adaptive? | Maximum Swaps | Best Use Case |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Bubble Sort** | $O(n)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ | Yes | Yes (with flag) | $O(n^2)$ | Teaching tool, detecting already-sorted arrays |
| **Selection Sort**| $O(n^2)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ | ❌ No | ❌ No | $O(n)$ | Minimizing writes on memory with write-cycle limits (EEPROM/Flash) |
| **Insertion Sort**| **$O(n)$** | $O(n^2)$ | $O(n^2)$ | $O(1)$ | **Yes** | **Yes** | $O(n^2)$ shifts | Small arrays ($n < 32$), nearly-sorted data, streaming online data |

---

## 4. JavaScript's Built-In `sort()` Trap and Engine Internals

In real JavaScript and Node.js applications, we do not write manual $O(n^2)$ loops for production sorting. We use the standard library method `Array.prototype.sort()`. However, `arr.sort()` contains two notorious traps that cause severe bugs in production.

### Trap 1: Default Lexicographical (Alphabetical) String Coercion

If you call `.sort()` without passing a custom comparison function, JavaScript converts **every element into a string** and compares their UTF-16 code unit values:

```javascript
// Node.js code
"use strict";

const scores = [10, 5, 20, 1, 100];

// ❌ DISASTROUS DEFAULT SORT:
scores.sort();
console.log(scores); 
// Output: [ 1, 10, 100, 20, 5 ] !!
```

#### Why Did `100` Come Before `5`?
JavaScript converted numbers to strings: `"10"`, `"5"`, `"20"`, `"1"`, `"100"`.
It compares character by character:
- `"1"` starts with character `'1'` (UTF-16 code unit 49).
- `"20"` starts with `'2'` (code unit 50).
- `"5"` starts with `'5'` (code unit 53).
Because `'1' < '5'`, the string `"100"` comes before `"5"`, just like `"banana"` comes after `"apple"`.

#### The Fix: The Numeric Comparator Contract
To sort numbers correctly, always pass a comparator callback `(a, b)`:

```javascript
// Node.js code
"use strict";

const scores = [10, 5, 20, 1, 100];

// ✅ CORRECT: Ascending numeric sort
scores.sort((a, b) => a - b);
console.log(scores); // [ 1, 5, 10, 20, 100 ]

// ✅ CORRECT: Descending numeric sort
scores.sort((a, b) => b - a);
console.log(scores); // [ 100, 20, 10, 5, 1 ]
```

> **Comparator Contract**:
> - If `comparator(a, b) < 0`: Sort `a` to a lower index than `b` (`a` comes first).
> - If `comparator(a, b) > 0`: Sort `b` to a lower index than `a` (`b` comes first).
> - If `comparator(a, b) === 0`: Keep the original relative order of `a` and `b`.

### Trap 2: In-Place Mutation of Shared Memory

`arr.sort()` modifies the original array in place and returns a reference to that same array. It does **not** create a new array.

```javascript
// Node.js code
"use strict";

const activeSessions = [402, 101, 305];

function getSortedSessionsBad(sessions) {
  return sessions.sort((a, b) => a - b); // Mutates caller's array!
}

getSortedSessionsBad(activeSessions);
console.log(activeSessions); // [ 101, 305, 402 ] -> Caller's data was silently mutated!

// ✅ FIX 1 (ES2023 / Node.js >= 20): Use toSorted()
const safeOriginal = [402, 101, 305];
const safeCopy = safeOriginal.toSorted((a, b) => a - b);
console.log(safeOriginal); // [ 402, 101, 305 ] (Preserved!)
console.log(safeCopy);     // [ 101, 305, 402 ] (Sorted copy!)

// ✅ FIX 2 (Universal / Older Node.js): Clone before sorting
const legacyCopy = [...safeOriginal].sort((a, b) => a - b);
```

---

## 5. Problem 1: Sort Colors (Dutch National Flag)

### Problem Statement
Given an array `nums` with $n$ objects colored red, white, or blue, sort them **in-place** so that objects of the same color are adjacent, with the colors in the order red (`0`), white (`1`), and blue (`2`).
You must solve this problem in a **single pass** without using the library's `sort()` function, using $O(n)$ time and $O(1)$ extra space.

- **Example 1**: `nums = [2, 0, 2, 1, 1, 0]` $\to$ Output: `[0, 0, 1, 1, 2, 2]`
- **Example 2**: `nums = [2, 0, 1]` $\to$ Output: `[0, 1, 2]`

---

Edsger Dijkstra invented this algorithm called the **Dutch National Flag Problem** (red, white, and blue stripes).
Think of sorting objects into three physical buckets:
1. Bucket for `0`s on the far left.
2. Bucket for `1`s in the center.
3. Bucket for `2`s on the far right.

We maintain three pointers:
- `low`: Next index where a `0` should be placed.
- `mid`: Current element under inspection.
- `high`: Next index where a `2` should be placed.

```text
The 3-Way Partitioning Invariant:
----------------------------------------------------------------------
[ 0 ... low - 1 ]   --> All 0s (Red)
[ low ... mid - 1 ] --> All 1s (White)
[ mid ... high ]    --> Uninspected elements (Unknown)
[ high + 1 ... n-1] --> All 2s (Blue)
----------------------------------------------------------------------
```

---

Let us trace `nums = [2, 0, 2, 1, 1, 0]`

```text
Initial State:
Index:    0    1    2    3    4    5
Array:  [ 2  | 0  | 2  | 1  | 1  | 0  ]
         ^                             ^
      low, mid                        high
        (0)                           (5)

Step 1: Inspect nums[mid] (nums[0] = 2)
- It is a 2! It belongs at the end.
- Swap nums[mid] (2) with nums[high] (0).
- Array becomes: [ 0, 0, 2, 1, 1, 2 ]
- Decrement high to 4.
- CRITICAL NOTE: Do NOT increment mid yet! The value swapped into mid (0) has not been inspected!

Step 2: Inspect nums[mid] (nums[0] = 0)
- It is a 0! It belongs at the front.
- Swap nums[low] (0) with nums[mid] (0) (self swap).
- Increment low to 1.
- Increment mid to 1.
- Array: [ 0 | 0, 2, 1, 1, 2 ]

Step 3: Inspect nums[mid] (nums[1] = 0)
- It is a 0! Swap nums[low] (0) with nums[mid] (0).
- Increment low to 2.
- Increment mid to 2.
- Array: [ 0, 0 | 2, 1, 1, 2 ]

Step 4: Inspect nums[mid] (nums[2] = 2)
- It is a 2! Swap nums[mid] (2) with nums[high] (nums[4] = 1).
- Array becomes: [ 0, 0, 1, 1, 2, 2 ]
- Decrement high to 3.
- (mid stays at 2 to check the newly swapped 1).

Step 5: Inspect nums[mid] (nums[2] = 1)
- It is a 1! It belongs in the middle.
- No swap needed. Just advance mid to 3.

Step 6: Inspect nums[mid] (nums[3] = 1)
- It is a 1! Advance mid to 4.

Termination:
- Now mid (4) > high (3). The uninspected partition is empty!
- Final array: [ 0, 0, 1, 1, 2, 2 ] (Fully sorted in a single pass!)
```

---


```javascript
// Node.js code
"use strict";

// ✅ CORRECT: Dijkstra's Dutch National Flag Algorithm (Single pass, O(1) space)
function sortColors(nums) {
  let low = 0;
  let mid = 0;
  let high = nums.length - 1;

  while (mid <= high) {
    if (nums[mid] === 0) {
      // 0 belongs in the left partition
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      // 1 belongs in the middle partition
      mid++;
    } else {
      // nums[mid] === 2: belongs in the right partition
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--;
      // ⚠️ DO NOT increment mid! We must inspect the newly swapped element in the next iteration.
    }
  }

  return nums;
}

// ❌ COMMON BUG: Advancing mid when swapping with high
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
      mid++; // BUG! If nums[high] was a 0, it gets skipped without being moved to low!
    }
  }
  return nums;
}

console.log(sortColors([2, 0, 2, 1, 1, 0]));      // [0, 0, 1, 1, 2, 2] (Correct)
console.log(buggySortColors([2, 0, 2, 1, 1, 0])); // [0, 2, 1, 1, 0, 2] (Corrupted!)
```

- **Time Complexity**: $O(n)$ because each step either advances `mid` or decrements `high`. The pointers meet in at most $n$ total operations.
- **Space Complexity**: $O(1)$ auxiliary space (in-place swaps).

---

## 6. Problem 2: Meeting Rooms (Interval Overlap Detection)

### Problem Statement
Given an array of meeting time intervals where `intervals[i] = [start, end]`, determine if a person could attend all meetings (i.e., no two meetings overlap).
Note: If a meeting ends at time 10 and another starts at time 10, they do **not** conflict.

- **Example 1**: `intervals = [[0, 30], [5, 10], [15, 20]]` $\to$ Output: `false` (Meeting 0 overlaps with Meeting 1 from 5 to 10).
- **Example 2**: `intervals = [[7, 10], [2, 4]]` $\to$ Output: `true` (Meeting 1 ends at 4, meeting 0 starts at 7; no overlap).

---

If someone gives you a random, unordered pile of meeting invitations, checking whether any two meetings clash requires comparing every meeting with every other meeting ($O(n^2)$ time).

However, what do you do on a real Google Calendar? You sort meetings chronologically by **start time**!
Once all meetings are ordered by when they begin, you only need to check **adjacent neighbors**:
Does meeting $i$ begin before meeting $i - 1$ finishes?
If `intervals[i].start < intervals[i - 1].end`, there is an impossible double-booking!

```text
Visualizing Sorted Intervals:

Scenario A (Conflict):
Interval 0: [0 ========================= 30]
Interval 1:       [5 ======= 10]              <-- Starts at 5, but previous ends at 30! CONFLICT!

Scenario B (Valid):
Interval 0: [2 === 4]
Interval 1:            [7 === 10]             <-- Starts at 7, previous ends at 4. OK!
```

---

```javascript
// Node.js code
"use strict";

// ✅ CORRECT: Sorts a shallow copy by start time and checks adjacent intervals
function canAttendMeetings(intervals) {
  if (intervals.length <= 1) return true;

  // Clone array to avoid mutating caller's data, then sort by start time ascending
  const sorted = intervals.slice().sort((a, b) => a[0] - b[0]);

  for (let i = 1; i < sorted.length; i++) {
    const previousMeeting = sorted[i - 1];
    const currentMeeting = sorted[i];

    // If current meeting starts strictly before the previous meeting ends -> Conflict!
    if (currentMeeting[0] < previousMeeting[1]) {
      return false;
    }
  }

  return true;
}

// ❌ COMMON BUG: Forgetting the numeric comparator on nested arrays
function buggyCanAttend(intervals) {
  // intervals.sort() will stringify arrays! [[7, 10], [2, 4]].sort() might sort ["7,10", "2,4"]
  // Always supply an explicit comparator callback (a, b) => a[0] - b[0]!
  return intervals.sort(); 
}

console.log(canAttendMeetings([[0, 30], [5, 10], [15, 20]])); // false
console.log(canAttendMeetings([[7, 10], [2, 4]]));             // true
console.log(canAttendMeetings([[1, 5], [5, 10]]));             // true (Adjacent boundaries are allowed)
```

- **Time Complexity**: $O(n \log n)$ because sorting $n$ intervals takes $O(n \log n)$ time, followed by a linear $O(n)$ scan. The sort dominates.
- **Space Complexity**: $O(n)$ auxiliary space to store the cloned array (or $O(1)$ if mutating in-place is permitted by the interviewer).

---

## 7. V8 TimSort & Event Loop Realities

### Why Did V8 Replace QuickSort with TimSort?
Prior to Node.js 12 (V8 v7.0), JavaScript's `arr.sort()` used a hybrid QuickSort for large arrays and Insertion Sort for arrays with fewer than 10 elements.
However, QuickSort had two critical drawbacks:
1. **Unstable**: QuickSort can reorder identical elements.
2. **$O(n^2)$ worst case**: Adversarial input patterns could trigger quadratic execution.

In ECMAScript 2019 (ES10), the specification strictly mandated that `Array.prototype.sort()` **must be stable**. V8 completely adopted **TimSort** (originally designed by Tim Peters for Python).

#### How TimSort Works
1. It scans the array looking for naturally occurring sorted sequences called **runs** (either strictly ascending or strictly descending).
2. If a run is shorter than a threshold (typically 32 to 64 items), it extends the run using **Insertion Sort**.
3. It then merges adjacent runs together using a balanced **Merge Sort** with an in-memory stack.
- **Best-case time**: $O(n)$ on already-sorted or reverse-sorted data.
- **Worst-case time**: $O(n \log n)$ guaranteed.
- **Space**: $O(n)$ worst-case auxiliary memory.

---

### Never Sort Heavy Datasets Synchronously!

Node.js executes JavaScript on a **single main thread**.
If an incoming HTTP request triggers an in-memory sort on 100,000 objects with an unoptimized $O(n^2)$ algorithm, it executes roughly $10^{10}$ CPU operations.

```text
Client A (Sorting Request) -------> [ Node.js Main Thread ] (FREEZES for 4.2 seconds!)
Client B (Health Check GET /) ----> [ BLOCKED IN EVENT LOOP QUEUE ]
Client C (Login POST /api) -------> [ BLOCKED IN EVENT LOOP QUEUE ]
```

During those 4.2 seconds:
- Zero incoming network packets are processed.
- Zero database query responses are read.
- Kubernetes liveness probes fail, potentially causing the container orchestrator to restart your server!

#### Backend Decision Matrix: Where Should Data Be Sorted?

| Criterion | In-Memory Node.js `arr.sort()` | Database `ORDER BY` (e.g., PostgreSQL) |
| :--- | :--- | :--- |
| **Data Size** | Small arrays ($< 2,000$ items) already cached in memory | Large datasets ($> 5,000$ rows) |
| **Index Acceleration** | None; performs full $O(n \log n)$ CPU sorting on main thread | **B-Tree Index**: Pre-sorted on disk; reads data in $O(\log n)$ order |
| **Network Cost** | Must fetch all rows over network before sorting | Transmits only requested slice (`LIMIT 20 OFFSET 0`) |
| **Event Loop Impact** | Synchronous CPU consumption blocks main thread | Zero Node.js CPU consumption; handled by dedicated database daemon |

---

## Tricky Points and Edge Cases

### 1. The Midpoint Integer Overflow Guard
In languages like Java or C++, computing `(low + high) / 2` overflows when `low + high > 2^{31} - 1`, resulting in a negative number.
In JavaScript, numbers are 64-bit IEEE-754 floats, so `(low + high) / 2` does not overflow 32-bit integers. However:
- Using bitwise right shift `(low + high) >> 1` coerces the operand to a **32-bit signed integer**. If the sum exceeds $2,147,483,647$, it turns negative!
- The safe, universal formula to memorize across all programming languages is:
```javascript
const mid = low + Math.floor((high - low) / 2);
```

### 2. Sorting Arrays Containing `undefined`, `null`, and `NaN`
In JavaScript, `Array.prototype.sort()` has unique quirks when dealing with non-standard values:
```javascript
// Node.js code
const weird = [10, undefined, 2, null, NaN, 5];
weird.sort((a, b) => a - b);
console.log(weird);
// Output: [ 2, null, 5, 10, NaN, undefined ]
```
- `undefined` elements are **always moved to the very end of the array**, and the comparator callback is **never even called** on them!
- `null` coerces to `0` in subtraction `(null - 2 = -2)`.
- `NaN` breaks mathematical transitivity! Because `NaN - 5` is `NaN`, the comparator returns non-deterministic results and corrupts the sort.

### 3. Selection Sort Breaks Stability (Duplicate Keys)
When sorting objects by a primary key, Selection Sort destroys secondary order:
```javascript
// Node.js code
const items = [
  { val: 5, tag: "first" },
  { val: 5, tag: "second" },
  { val: 2, tag: "third" }
];
// Selection sort swaps index 0 with index 2:
// Result: [ { val: 2 }, { val: 5, tag: "second" }, { val: 5, tag: "first" } ]
// "first" and "second" swapped places! Selection sort is NOT stable.
```

---

## Hands-On Exercise

### Scenario
You are building an automated regression deployment system for a microservice platform. You have $n$ software builds labeled sequentially from $1$ to $n$.
At some point, a faulty commit was merged. Since all future builds inherit past code, **every build created after a bad build is also bad**.

You are given an asynchronous API function `isBadVersion(version)` that queries the build server and returns `true` or `false`.
You must implement a function `findFirstBadVersion(n, isBadVersion)` that finds the first bad build using the **minimum number of API queries**.

### Buggy Code
```javascript
// Node.js code
function findFirstBadVersionBuggy(n, isBadVersion) {
  // ❌ Bug 1: Performs a sequential linear search O(n). If n = 1,000,000, it makes 1,000,000 network calls!
  // ❌ Bug 2: Off-by-one error: Versions are 1-indexed (1 to n), but loop checks index 0!
  for (let i = 0; i < n; i++) {
    if (isBadVersion(i)) {
      return i;
    }
  }
  return -1;
}
```

### Acceptance Criteria
1. Must execute in $O(\log n)$ time using Binary Search.
2. The search space must strictly encompass version `1` through version `n`.
3. Correctly handles edge cases: version 1 is bad, or only the final version $n$ is bad.
4. Total extra memory allocated must be $O(1)$.

### Solution Code

```javascript
// Node.js code
"use strict";
const assert = require("node:assert/strict");

function findFirstBadVersion(n, isBadVersion) {
  let low = 1;
  let high = n;
  let firstBad = -1;

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);

    if (isBadVersion(mid)) {
      // mid is bad -> records potential answer, but an earlier bad version might exist to the left
      firstBad = mid;
      high = mid - 1;
    } else {
      // mid is good -> first bad version MUST be strictly to the right
      low = mid + 1;
    }
  }

  return firstBad;
}

// ==========================================
// Automated Test Verifications
// ==========================================
const testBuilds1 = (v) => v >= 4; // Versions 4, 5 are bad (n = 5)
assert.equal(findFirstBadVersion(5, testBuilds1), 4);

const testBuilds2 = (v) => v >= 1; // Very first version is bad
assert.equal(findFirstBadVersion(10, testBuilds2), 1);

const testBuilds3 = (v) => v >= 100; // Only the 100th version is bad
assert.equal(findFirstBadVersion(100, testBuilds3), 100);

console.log("✅ All regression binary search tests passed successfully!");
```

---

## Summary

- **Algorithms must satisfy 4 criteria**: Finiteness (must terminate), Definiteness (unambiguous steps), Correctness (valid results on all inputs), and Efficiency (minimal CPU and RAM).
- **Linear Search**: Scans sequentially from index 0 to $n - 1$. Requires $O(n)$ time, works on unsorted collections, and requires zero preparation.
- **Binary Search**: Requires a sorted array. Probes the midpoint and eliminates half of the remaining items in each step. Operates in $O(\log n)$ time and $O(1)$ space.
- **Bubble Sort**: Compares adjacent pairs and bubbles the largest item to the end. Best case is $O(n)$ with a `swapped` boolean flag; worst case is $O(n^2)$. It is stable.
- **Selection Sort**: Scans the unsorted array to find the minimum element and places it at the front. Always takes $O(n^2)$ comparisons (not adaptive), but makes at most $n - 1$ swaps (useful for minimizing memory writes). It is unstable.
- **Insertion Sort**: Simulates arranging playing cards by picking the next item and shifting larger sorted elements rightward. Best case is $O(n)$ on nearly-sorted data; worst case is $O(n^2)$. It is stable, adaptive, and forms the core of TimSort.
- **JavaScript `arr.sort()` Traps**: Default sort converts elements to UTF-16 strings (`[10, 5]` becomes `[10, 5]`). Always provide `(a, b) => a - b`. Remember that `.sort()` mutates in-place; use `toSorted()` (Node.js 20+) to sort safely.
- **Dutch National Flag (Sort Colors)**: Uses 3 pointers (`low`, `mid`, `high`) to partition 3 unique values in a single $O(n)$ pass and $O(1)$ space.
- **Interval Scheduling (Meeting Rooms)**: Sorting intervals chronologically by start time reduces overlap detection from an $O(n^2)$ all-pairs check to an $O(n \log n)$ adjacent-neighbor check.

---

## Cheat Sheet

### Algorithm Decision Matrix

| Problem Trait | Recommended Technique | Complexity |
| :--- | :--- | :---: |
| Search in an unsorted, constantly changing list | Linear Search | $O(n)$ |
| Search in a static or sorted array | Binary Search | $O(\log n)$ |
| Tiny dataset ($n < 32$) or nearly-sorted array | Insertion Sort | $O(n)$ best, $O(n^2)$ worst |
| Hardware with limited write cycles (flash/EEPROM) | Selection Sort | $O(n)$ writes maximum |
| General array sorting in Node.js | `arr.toSorted((a, b) => a - b)` | $O(n \log n)$ via TimSort |
| Partitioning array with 3 distinct values (e.g., 0, 1, 2) | Dutch National Flag (3 Pointers) | $O(n)$ time, $O(1)$ space |
| Interval overlap / calendar conflict detection | Sort by start time, check adjacent ends | $O(n \log n)$ time |

### Common Pitfalls List
- **The String Sort Trap**: Calling `nums.sort()` without `(a, b) => a - b` orders `100` before `20`.
- **In-Place Mutation**: `arr.sort()` mutates input arrays; use `arr.toSorted()` or `[...arr].sort()`.
- **Binary Search Off-by-One**: Using `low < high` instead of `low <= high` misses the final 1-element search window.
- **Midpoint Float Bug**: Writing `(low + high) / 2` in JavaScript produces non-integer indices like `2.5`. Always wrap with `Math.floor()`.
- **Advancing `mid` in Dutch National Flag**: Incrementing `mid` after swapping with `high` skips inspecting the swapped element.

---

## Interview Q&A

### 1. Why does Binary Search strictly require a sorted array, and what loop invariant proves it terminates correctly?
**Answer:**
Binary search works by comparing the target value against the midpoint value `arr[mid]`. For binary search to safely discard half of the array, the elements must exhibit a **monotonic property** (either non-decreasing or non-increasing). If `target > arr[mid]`, the algorithm assumes all elements in `arr[low ... mid]` are less than or equal to `arr[mid]`, meaning the target cannot exist in the left half. If the array is unsorted, this assumption is false, and the target might be discarded.

The loop invariant is: *"If the target exists anywhere in the array, it must lie within the closed index interval `[low ... high]`."*
- **Initialization**: At the start, `low = 0` and `high = n - 1`, encompassing the entire array.
- **Maintenance**: At each step, if `arr[mid] < target`, all elements from `low` to `mid` are $\le arr[mid] < target$, so `low` can safely advance to `mid + 1`. If `arr[mid] > target`, all elements from `mid` to `high` are $\ge arr[mid] > target$, so `high` can safely drop to `mid - 1`. The invariant holds.
- **Termination**: If `low > high`, the search space interval is empty, mathematically proving the target is not in the array.

---

### 2. What will the following code output, and why?
```javascript
// Node.js code
const arr = [10, 5, 40, 25];
arr.sort((a, b) => {
  return a > b;
});
console.log(arr);
```
**Answer:**
The code produces erratic or incorrect results (often remaining unchanged as `[10, 5, 40, 25]` depending on the engine).
The comparator callback must return a **negative number, zero, or a positive number**.
In this code, `a > b` returns a **Boolean** (`true` or `false`). When coerced to numbers:
- `true` becomes `1`.
- `false` becomes `0`.
Notice that this function **never returns a negative number** (`-1`). When `a < b`, it returns `false` (`0`), indicating to the sorting engine that `a` and `b` are equal! Because the comparator contract is violated, TimSort cannot determine when an element should precede another, resulting in an improperly sorted array. The correct comparator is `(a, b) => a - b`.

---

### 3. Identify and fix the bug in this binary search implementation:
```javascript
// Node.js code
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
There are three critical bugs causing infinite loops and out-of-bounds errors:
1. `high` is initialized to `arr.length` rather than `arr.length - 1`.
2. When `arr[mid] < target`, it sets `low = mid` instead of `low = mid + 1`. If `low` and `high` are adjacent (e.g., `low = 2, high = 3`), `mid` evaluates to `2`. Setting `low = mid` keeps `low` at `2`, creating an **infinite loop**.
3. When `arr[mid] > target`, it sets `high = mid` instead of `high = mid - 1`.
4. The condition `low < high` terminates prematurely when the search space narrows to a single element (`low === high`), failing to check if that remaining element equals `target`.

The corrected version uses `high = arr.length - 1`, `while (low <= high)`, `low = mid + 1`, and `high = mid - 1`.

---

### 4. In a high-traffic Node.js API, should you sort a 200,000-row user dataset using `arr.sort()` in your Express controller or using `ORDER BY` in PostgreSQL? Explain the system-level tradeoffs.
**Answer:**
You should almost always perform this sort in PostgreSQL using `ORDER BY`.

System-level reasons:
1. **Single-Threaded Event Loop Blocking**: Node.js handles all concurrent client requests on a single thread. Sorting 200,000 objects in memory takes hundreds of milliseconds of synchronous CPU time. During this time, Node.js cannot process incoming HTTP requests, WebSocket heartbeats, or I/O events, causing latency spikes for all users.
2. **B-Tree Indexing**: PostgreSQL can satisfy an `ORDER BY` query in $O(\log n + k)$ time if an index exists on the sorting column, avoiding an active sorting computation entirely by reading pre-ordered index nodes.
3. **Memory and Network Bandwidth**: Sorting in Node.js requires transferring all 200,000 rows over the network from the database into Node.js heap memory, consuming hundreds of megabytes of RAM and saturating internal network interfaces. With PostgreSQL, you can combine `ORDER BY` with `LIMIT 50 OFFSET 0` to transfer only the 50 rows needed by the client.
4. **When In-Memory Sorting is Acceptable**: Only sort in Node.js when the dataset is already small ($< 1,000$ items), already loaded into local memory/cache, and requires dynamic multi-attribute sorting criteria not supported by the database index.

---

## Practice Problems

### 1. Binary Search - Easy
Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`. You must write an algorithm with $O(\log n)$ runtime complexity.
- **Sample Input 1:** `nums = [-1, 0, 3, 5, 9, 12]`, `target = 9`
- **Expected Output 1:** `4`
- **Sample Input 2:** `nums = [-1, 0, 3, 5, 9, 12]`, `target = 2`
- **Expected Output 2:** `-1`

### 2. Sort Colors - Medium
Given an array `nums` with $n$ objects colored red, white, or blue, sort them in-place so that objects of the same color are adjacent, with the colors in the order red, white, and blue. We use integers `0`, `1`, and `2` to represent the colors red, white, and blue respectively. You must solve this without using the library's sort function in $O(n)$ time and $O(1)$ space.
- **Sample Input 1:** `nums = [2, 0, 2, 1, 1, 0]`
- **Expected Output 1:** `[0, 0, 1, 1, 2, 2]`
- **Sample Input 2:** `nums = [2, 0, 1]`
- **Expected Output 2:** `[0, 1, 2]`

### 3. Meeting Rooms - Easy
Given an array of meeting time intervals where `intervals[i] = [start_i, end_i]`, determine if a person could attend all meetings.
- **Sample Input 1:** `intervals = [[0, 30], [5, 10], [15, 20]]`
- **Expected Output 1:** `false`
- **Sample Input 2:** `intervals = [[7, 10], [2, 4]]`
- **Expected Output 2:** `true`

---

<nav aria-label="Lecture navigation">

[Previous: Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md)

</nav>
