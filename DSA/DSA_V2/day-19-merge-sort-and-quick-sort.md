# Day 19: Merge Sort & Quick Sort

<nav aria-label="Lecture navigation">

[Previous: Recursion & Call Stack](day-18-recursion-fundamentals-and-call-stack.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Recursion Trees & Backtracking](day-20-recursion-trees-and-backtracking-core.md)

</nav>

## 1. Merge Sort & Quick Sort

Elementary sorting algorithms like Bubble Sort, Selection Sort, and Insertion Sort compare elements one step at a time, resulting in $O(n^2)$ time complexity. When sorting 100,000 items, an $O(n^2)$ algorithm performs roughly $10,000,000,000$ operations—freezing the single-threaded Node.js event loop for seconds.

Merge Sort and Quick Sort overcome this barrier using the Divide and Conquer strategy. Instead of sorting the entire list at once, they divide the collection into smaller subproblems, solve each subproblem recursively, and combine the results in $O(n \log n)$ total operations. For 100,000 items, $n \log_2 n \approx 1,700,000$ operations, which is thousands of times faster than quadratic sorting.

Imagine sorting an unsorted stack of 100 student exam papers. With Merge Sort, you split the stack into two piles of 50 and hand each pile to a teaching assistant. The assistants repeatedly split their stacks in half until every pile contains exactly one paper. A single paper is already sorted. The assistants then zip sorted stacks together by comparing top papers and stacking the smaller one first. This approach is predictable, balanced, and preserves the original order of identical grades (stable), but it requires extra desk space for the temporary piles.

With Quick Sort, you pick one benchmark paper (the pivot), such as a score of 75. You scan through the stack and place every paper below 75 into a left pile and every paper above 75 into a right pile. The benchmark paper 75 is now in its exact final resting spot. You then repeat the process on the left and right piles. Quick Sort works directly in place without extra desk space, but picking a poor pivot can lead to unbalanced piles.

```javascript
// Basic demonstration of the divide-and-conquer zip merge mechanic
function mergeTwoSortedArrays(left, right) {
  const result = [];
  let i = 0;
  let j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  while (i < left.length) result.push(left[i++]);
  while (j < right.length) result.push(right[j++]);

  return result;
}

const listA = [2, 5, 8];
const listB = [1, 3, 7, 9];
console.log("Merged:", mergeTwoSortedArrays(listA, listB));
// Output: [ 1, 2, 3, 5, 7, 8, 9 ]
```

### 1.1 Merge Sort Mechanics

Merge Sort splits the input array at its exact midpoint $\lfloor \frac{\text{start} + \text{end}}{2} \rfloor$, recurses on both halves until single-element arrays remain, and then merges the sorted halves.

```text
Splitting [ 38, 27, 43, 3, 9, 82, 10 ] into halves:
Level 0:                 [ 38, 27, 43, 3, 9, 82, 10 ]
                         /                          \
Level 1:        [ 38, 27, 43, 3 ]              [ 9, 82, 10 ]
                /              \                /          \
Level 2:   [ 38, 27 ]       [ 43, 3 ]        [ 9, 82 ]    [ 10 ]
           /      \         /      \         /      \       |
Level 3: [38]    [27]     [43]     [3]     [9]     [82]   [10] (Base cases: size 1)

Merging sorted halves back up:
Level 2:   [ 27, 38 ]       [ 3, 43 ]        [ 9, 82 ]    [ 10 ]
Level 1:        [ 3, 27, 38, 43 ]              [ 9, 10, 82 ]
Level 0:                 [ 3, 9, 10, 27, 38, 43, 82 ]
```

Because division always halves the array size, the recursion tree height is strictly $\lceil \log_2 n \rceil$. Merging all elements across each horizontal level takes $O(n)$ work, guaranteeing an overall runtime of $O(n \log n)$ in the best, average, and worst cases.

> [!NOTE]
> Why does Merge Sort require auxiliary memory? Because as sorted sub-arrays are zippered together, values must be staged in a temporary buffer to prevent overwriting unexamined elements in the original array.

### 1.2 Quick Sort Partitioning Schemes

Quick Sort does not divide arrays at the center. Instead, it selects a pivot element and partitions the array such that all items smaller than the pivot sit to its left and all items greater sit to its right. The two most common partitioning schemes are Lomuto and Hoare.

```text
Lomuto Partition on [ 2, 8, 7, 1, 3, 5, 6, 4 ] with Pivot = 4:
i tracks boundary of elements <= pivot. j scans from left to right.

Initial:   [ 2,  8,  7,  1,  3,  5,  6,  4 ]   (i = -1)
j = 0: 2 <= 4 -> i = 0, swap(arr[0], arr[0]) -> [ 2, 8, 7, 1, 3, 5, 6, 4 ]
j = 1: 8 > 4  -> do nothing
j = 2: 7 > 4  -> do nothing
j = 3: 1 <= 4 -> i = 1, swap(arr[1], arr[3]) -> [ 2, 1, 7, 8, 3, 5, 6, 4 ]
j = 4: 3 <= 4 -> i = 2, swap(arr[2], arr[4]) -> [ 2, 1, 3, 8, 7, 5, 6, 4 ]
j = 5: 5 > 4  -> do nothing
j = 6: 6 > 4  -> do nothing

Final Step: swap pivot arr[high] with arr[i + 1]:
swap arr[3] (8) with arr[7] (4) -> [ 2, 1, 3, 4, 7, 5, 6, 8 ]
                                             ^
                                       Pivot 4 is finalized!
```

Hoare partitioning starts two pointers at opposing ends and moves them inward until out-of-place pairs are identified and swapped. Hoare partitioning performs roughly three times fewer swaps than Lomuto on average.

```javascript
// Hoare partition implementation
function hoarePartition(arr, low, high) {
  const pivot = arr[Math.floor(low + (high - low) / 2)];
  let i = low - 1;
  let j = high + 1;

  while (true) {
    do { i++; } while (arr[i] < pivot);
    do { j--; } while (arr[j] > pivot);

    if (i >= j) return j;

    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
}

const sample = [5, 3, 8, 4, 2, 7, 1, 6];
const splitIndex = hoarePartition(sample, 0, sample.length - 1);
console.log("Partition boundary index:", splitIndex);
console.log("Partitioned state:", sample);
```

### 1.3 Operations Reference Table

| Algorithm | Best Time | Average Time | Worst Time | Space Complexity | Stability | In-Place |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Merge Sort** | $O(n \log n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ auxiliary | Stable | ❌ No |
| **Quick Sort (Lomuto)** | $O(n \log n)$ | $O(n \log n)$ | $O(n^2)$ | $O(\log n)$ stack | Unstable | ✅ Yes |
| **Quick Sort (Hoare)** | $O(n \log n)$ | $O(n \log n)$ | $O(n^2)$ | $O(\log n)$ stack | Unstable | ✅ Yes |
| **Quickselect** | $O(n)$ | $O(n)$ | $O(n^2)$ | $O(1)$ iterative | Unstable | ✅ Yes |
| **Native Array.sort()** | $O(n)$ (Timsort) | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ auxiliary | Stable | ✅ Yes (in JS) |

---

## 2. Divide and Conquer Sorting Patterns

### 2.1 Pattern Family

Divide and conquer sorting problems fall into three main operational families:

- **Balanced Halving with External Combination (Merge Sort):** Subproblems are split blindly down the middle. Work occurs entirely during the merge phase when combining sorted subsets.
- **Partitioning with Subproblem Pruning (Quickselect):** Subproblems are split around a pivot. When searching for a single ranked value ($K$-th element), the algorithm discards the non-qualifying partition and recurses on only one branch.
- **Three-Way Dutch Flag Partitioning:** Used when inputs contain large numbers of duplicate keys. Partitions the input into three segments: values less than pivot, values equal to pivot, and values greater than pivot.

### 2.2 Pattern Recognition Table

| Problem Keyword Signal | Underlying Computational Need | Recommended Approach |
| :--- | :--- | :--- |
| Stable ordering required across multiple fields | Must preserve relative positions of equal keys | Merge Sort ($O(n \log n)$ stable) |
| In-place sorting with $O(1)$ auxiliary RAM | Cannot allocate extra arrays due to memory limits | Quick Sort ($O(n \log n)$ in-place) |
| Find the $K$-th largest or smallest element | Finding single order statistic without sorting everything | Quickselect ($O(n)$ average) |
| Count pairs where $i < j$ and $nums[i] > nums[j]$ | Inversion count during sorting passes | Merge Sort with inversion tracking |
| Array containing few unique keys (e.g., 0, 1, 2) | Fast segregation without recursion stack | Dutch National Flag (3-way partition) |

### 2.3 When to Use vs When NOT to Use

- **Use Merge Sort when:**
  - Stable sorting is mandatory (e.g., sorting objects by price while keeping existing alphabetical secondary ordering).
  - Worst-case predictable performance is required (e.g., real-time systems where $O(n^2)$ spikes are unacceptable).
  - Sorting linked lists, where pointer re-linking takes $O(1)$ auxiliary space without memory buffer copies.
- **When NOT to use Merge Sort:**
  - Memory is constrained and allocating an auxiliary array of size $n$ risks memory limits.
- **Use Quick Sort / Quickselect when:**
  - You need fast, cache-friendly in-place sorting with minimal auxiliary memory.
  - You need to locate a specific rank element ($K$-th largest) in $O(n)$ average time.
- **When NOT to use Quick Sort:**
  - Order stability is required.
  - Worst-case time must never degrade to $O(n^2)$ under adversarial inputs.

### 2.4 The 10^7 Operations Rule

Node.js executes approximately $10^7$ to $10^8$ operations per second on a single thread. When $n = 100,000$, an $O(n^2)$ algorithm performs $10^{10}$ comparisons, locking the thread for tens of seconds. Both Merge Sort and Quick Sort perform $n \log_2 n \approx 1.7 \times 10^6$ operations, completing in under 20 milliseconds.

---

## 3. Problem Walkthroughs

### 3.1 Sort an Array

#### 3.1.1 Problem Statement
Given an array of integers `nums`, sort the array in ascending order without using built-in sorting methods like `Array.prototype.sort()`.

- **Input:** `nums = [5, 2, 3, 1]`
- **Output:** `[1, 2, 3, 5]`
- **Constraints:** $1 \le nums.length \le 50,000$, $-50,000 \le nums[i] \le 50,000$.

#### 3.1.2 How to Think About It
Imagine a deck of numbered cards spread out face down. You divide the deck in half, and in half again, until you have piles of one card each. You then pick up pairs of piles. With one card in your left hand and one in your right hand, you place the smaller card down first, followed by the larger card. When combining larger piles, you keep eyes on the top cards of each pile, repeatedly moving the smaller card to the output pile.

#### 3.1.3 Brute Force Approach & Bottleneck
The naive approach uses recursive slicing: calling `arr.slice(0, mid)` and `arr.slice(mid)` on every recursion step.

```javascript
// Naive implementation allocating slices on every frame
function naiveMergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = naiveMergeSort(arr.slice(0, mid));
  const right = naiveMergeSort(arr.slice(mid));

  const result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }
  while (i < left.length) result.push(left[i++]);
  while (j < right.length) result.push(right[j++]);
  return result;
}
```

The bottleneck is memory churn. For an array of 50,000 numbers, `arr.slice()` creates tens of thousands of intermediate short-lived arrays on the V8 heap. This triggers continuous garbage collection cycles, degrading execution speed significantly.

#### 3.1.4 The Pattern Insight
Instead of allocating fresh slices at every level, allocate a single auxiliary buffer of size $n$ once before starting the recursion. Pass index boundaries (`start`, `mid`, `end`). Read from the main array into the auxiliary buffer for comparison, and write sorted values directly back into the original array indices.

#### 3.1.5 Pseudocode
```text
function sortArray(nums):
    allocate temp buffer of size nums.length

    function merge(start, mid, end):
        copy nums[start...end] into temp[start...end]
        i = start, j = mid + 1, curr = start
        while i <= mid and j <= end:
            if temp[i] <= temp[j]:
                nums[curr++] = temp[i++]
            else:
                nums[curr++] = temp[j++]
        while i <= mid:
            nums[curr++] = temp[i++]

    function divide(start, end):
        if start >= end: return
        mid = start + floor((end - start) / 2)
        divide(start, mid)
        divide(mid + 1, end)
        if nums[mid] <= nums[mid + 1]: return  // already sorted
        merge(start, mid, end)

    divide(0, nums.length - 1)
    return nums
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal In-Place Index-Based Merge Sort
function sortArray(nums) {
  if (!nums || nums.length <= 1) return nums;

  // Single auxiliary buffer allocated once
  const temp = new Array(nums.length);

  function merge(start, mid, end) {
    for (let k = start; k <= end; k++) {
      temp[k] = nums[k];
    }

    let i = start;
    let j = mid + 1;
    let curr = start;

    while (i <= mid && j <= end) {
      // '<=' maintains stable ordering
      if (temp[i] <= temp[j]) {
        nums[curr++] = temp[i++];
      } else {
        nums[curr++] = temp[j++];
      }
    }

    while (i <= mid) {
      nums[curr++] = temp[i++];
    }
    // Items remaining in right partition are already in place
  }

  function divideAndConquer(start, end) {
    if (start >= end) return;

    const mid = Math.floor(start + (end - start) / 2);
    divideAndConquer(start, mid);
    divideAndConquer(mid + 1, end);

    // Skip merge if sub-arrays are already sorted across boundary
    if (nums[mid] <= nums[mid + 1]) return;

    merge(start, mid, end);
  }

  divideAndConquer(0, nums.length - 1);
  return nums;
}

const inputNums = [5, 2, 3, 1, 8, 4, 2];
console.log("Input:", inputNums);
console.log("Sorted:", sortArray(inputNums));
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Using '<' instead of '<=' breaks stability
function badMerge(start, mid, end) {
  // ...
  while (i <= mid && j <= end) {
    if (temp[i] < temp[j]) { // BUG: Strict '<' pulls from right when values match
      nums[curr++] = temp[i++];
    } else {
      nums[curr++] = temp[j++];
    }
  }
}
```

Using `<` causes equal values from the right partition to precede equal values from the left partition, reversing their original relative position and destroying stability.

#### 3.1.8 Complexity Derivation
- **Time Complexity:** $O(n \log n)$ across best, average, and worst cases. The array is divided $\log_2 n$ times, and each level merges $n$ elements in total.
- **Auxiliary Space Complexity:** $O(n)$ for the single `temp` buffer, plus $O(\log n)$ recursive call stack depth.

---

### 3.2 In-Place QuickSort

#### 3.2.1 Problem Statement
Implement an in-place QuickSort algorithm to sort an integer array in ascending order without allocating auxiliary array buffers.

- **Input:** `nums = [9, -3, 5, 2, 6, 8, -6, 1, 3]`
- **Output:** `[-6, -3, 1, 2, 3, 5, 6, 8, 9]`
- **Constraints:** Array contains arbitrary duplicate and negative values.

#### 3.2.2 How to Think About It
Imagine a shelf of books. You select one book as a separator (the pivot). You inspect books from left to right. Any book smaller than the separator is swapped into the left side of the shelf. Once all books are inspected, you move the separator into the boundary between smaller and larger books. You then repeat the same procedure independently on the books to the left of the separator and the books to the right.

#### 3.2.3 Brute Force Approach & Bottleneck
Naive QuickSort creates new arrays for smaller and larger values:

```javascript
function naiveQuickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[arr.length - 1];
  const left = [];
  const right = [];
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] <= pivot) left.push(arr[i]);
    else right.push(arr[i]);
  }
  return [...naiveQuickSort(left), pivot, ...naiveQuickSort(right)];
}
```

This allocates $O(n)$ arrays across every call frame and spreads arrays using `...`, resulting in high memory churn and losing the key advantage of QuickSort: in-place sorting.

#### 3.2.4 The Pattern Insight
Use two pointers to swap elements directly inside the original array. Choose a randomized pivot to avoid $O(n^2)$ worst-case performance on already-sorted data. Swap the chosen pivot to the end, partition elements using index pointers, and swap the pivot into its final position.

#### 3.2.5 Pseudocode
```text
function quickSort(arr, low, high):
    if low >= high: return
    pivotIdx = partition(arr, low, high)
    quickSort(arr, low, pivotIdx - 1)
    quickSort(arr, pivotIdx + 1, high)

function partition(arr, low, high):
    randomIdx = random integer between low and high
    swap(arr[randomIdx], arr[high])
    pivot = arr[high]
    i = low
    for j from low to high - 1:
        if arr[j] <= pivot:
            swap(arr[i], arr[j])
            i++
    swap(arr[i], arr[high])
    return i
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: In-Place QuickSort with Randomized Pivot Selection
function safeQuickSort(arr, low = 0, high = arr.length - 1) {
  if (low >= high) return arr;

  function swap(i, j) {
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }

  function partition(l, r) {
    // Pick random pivot index to eliminate O(n^2) vulnerability on sorted arrays
    const randIdx = Math.floor(Math.random() * (r - l + 1)) + l;
    swap(randIdx, r);

    const pivotVal = arr[r];
    let i = l;

    for (let j = l; j < r; j++) {
      if (arr[j] <= pivotVal) {
        swap(i, j);
        i++;
      }
    }

    swap(i, r);
    return i;
  }

  const pivotIdx = partition(low, high);

  // Recurse strictly on boundaries excluding pivotIdx
  safeQuickSort(arr, low, pivotIdx - 1);
  safeQuickSort(arr, pivotIdx + 1, high);

  return arr;
}

const numbers = [9, -3, 5, 2, 6, 8, -6, 1, 3];
console.log("Original:", numbers);
console.log("Sorted:", safeQuickSort(numbers));
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Including pivotIdx in recursive calls
safeQuickSort(arr, low, pivotIdx);
safeQuickSort(arr, pivotIdx + 1, high);
```

Because `pivotIdx` is already in its final sorted position, including it in `safeQuickSort(arr, low, pivotIdx)` causes an infinite recursion loop when `pivotIdx === high`, triggering `RangeError: Maximum call stack size exceeded`.

#### 3.2.8 Complexity Derivation
- **Time Complexity:**
  - **Average Case:** $O(n \log n)$ when random pivots divide the array into balanced subproblems.
  - **Worst Case:** $O(n^2)$ if the pivot consistently ends up being the minimum or maximum element. Randomized pivot selection makes this practically impossible.
- **Auxiliary Space Complexity:** $O(\log n)$ average call stack memory for recursion frames. $O(1)$ auxiliary heap memory.

---

### 3.3 Kth Largest Element in an Array

#### 3.3.1 Problem Statement
Given an unsorted integer array `nums` and an integer `k`, return the $k$-th largest element in the array. Note: It is the $k$-th largest element in sorted order, not the $k$-th distinct element.

- **Input:** `nums = [3, 2, 1, 5, 6, 4]`, `k = 2`
- **Output:** `5`
- **Constraints:** $1 \le k \le nums.length \le 10^5$, $-10^4 \le nums[i] \le 10^4$.

#### 3.3.2 How to Think About It
In an array of length 6, the 2nd largest element sits at index `6 - 2 = 4` in ascending sorted order. If you place a benchmark pivot into its correct resting position (say, index 3), you can check: Is our target index 4? Because $3 < 4$, the target index must reside strictly to the right of index 3. You can discard the entire left half of the array without inspecting or sorting it.

#### 3.3.3 Brute Force Approach & Bottleneck
The naive approach sorts the entire array in descending order and accesses `nums[k - 1]`:

```javascript
function findKthLargestNaive(nums, k) {
  nums.sort((a, b) => b - a);
  return nums[k - 1];
}
```

Sorting the whole array takes $O(n \log n)$ time. It performs unnecessary work ordering elements from rank 1 to $k-1$ and elements below rank $k$, when only the element at rank $k$ is needed.

#### 3.3.4 The Pattern Insight
Quickselect adapts QuickSort partitioning. When a partition places a pivot at index `pivotIdx`:
- If `pivotIdx === targetIndex`: Return `nums[pivotIdx]`.
- If `pivotIdx < targetIndex`: Search exclusively in the right partition.
- If `pivotIdx > targetIndex`: Search exclusively in the left partition.

Quickselect recurses on only one branch, leading to a geometric series:
$$T(n) = n + \frac{n}{2} + \frac{n}{4} + \dots = O(2n) = O(n)$$

#### 3.3.5 Pseudocode
```text
function findKthLargest(nums, k):
    targetIdx = nums.length - k
    left = 0, right = nums.length - 1

    while left <= right:
        pivotIdx = partition(nums, left, right)
        if pivotIdx == targetIdx:
            return nums[pivotIdx]
        else if pivotIdx < targetIdx:
            left = pivotIdx + 1
        else:
            right = pivotIdx - 1
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal Iterative Quickselect with Random Pivot
function findKthLargest(nums, k) {
  const targetIndex = nums.length - k;

  function swap(i, j) {
    const temp = nums[i];
    nums[i] = nums[j];
    nums[j] = temp;
  }

  function partition(left, right) {
    const randomPivotIdx = Math.floor(Math.random() * (right - left + 1)) + left;
    swap(randomPivotIdx, right);

    const pivotVal = nums[right];
    let i = left;

    for (let j = left; j < right; j++) {
      if (nums[j] <= pivotVal) {
        swap(i, j);
        i++;
      }
    }

    swap(i, right);
    return i;
  }

  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const pivotIdx = partition(left, right);

    if (pivotIdx === targetIndex) {
      return nums[pivotIdx];
    } else if (pivotIdx < targetIndex) {
      left = pivotIdx + 1;
    } else {
      right = pivotIdx - 1;
    }
  }

  return -1;
}

const scoreList = [3, 2, 1, 5, 6, 4];
console.log("2nd Largest in [3,2,1,5,6,4]:", findKthLargest(scoreList, 2));
// Output: 5
console.log("4th Largest in [3,2,3,1,2,4,5,5,6]:", findKthLargest([3, 2, 3, 1, 2, 4, 5, 5, 6], 4));
// Output: 4
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Fixed pivot on sorted input
function partitionDeterministic(left, right) {
  const pivotVal = nums[right]; // Vulnerable to pre-sorted arrays
  // ...
}
```

Without pivot randomization, an input that is already sorted causes the partition to split into sizes $n-1$ and $0$, degrading Quickselect runtime from $O(n)$ to $O(n^2)$.

#### 3.3.8 Complexity Derivation
- **Time Complexity:**
  - **Average Case:** $O(n)$ as partition sizes halve on each iteration: $n + \frac{n}{2} + \frac{n}{4} + \dots \le 2n$.
  - **Worst Case:** $O(n^2)$ if poor pivots are repeatedly chosen. Randomization makes this probability negligible.
- **Auxiliary Space Complexity:** $O(1)$ auxiliary space because the search uses an iterative loop (`while (left <= right)`) rather than recursion.

---

## 4. Tricky Edge Cases

- **Identical Elements Everywhere:** When an array consists entirely of duplicate numbers (e.g., `[3, 3, 3, 3]`), two-way partitioning can place all items into one side unless comparison operators (`<=` vs `<`) and pointer advancement are strictly managed.
- **Presorted and Reverse-Sorted Arrays:** Fixed pivot selection (`arr[0]` or `arr[high]`) turns Quick Sort into an $O(n^2)$ algorithm. Always randomize pivot selection or use median-of-three.
- **Stability Breakdown on Objects:** In Merge Sort, using strict `<` in `temp[i] < temp[j]` causes equal values from the right half to jump ahead of equal values from the left half, reversing their original order. Always use `<=`.
- **Call Stack Limits in Node.js:** The V8 call stack limit is approximately 10,000 frames. An unbalanced QuickSort on a sorted array of 20,000 items crashes with `RangeError: Maximum call stack size exceeded`. Merge Sort never exceeds $\lceil \log_2 n \rceil$ depth (at most 24 frames for $10^7$ items).

---

## 5. Summary Cheat Sheet

- **Merge Sort** divides first (at the midpoint) and does all sorting work during the combine phase. It guarantees $O(n \log n)$ time and stability at the cost of $O(n)$ auxiliary memory.
- **Quick Sort** does all sorting work upfront during partitioning and combines trivially. It runs in-place with $O(\log n)$ average call stack memory.
- **Quickselect** prunes one partition branch at each step to find the $K$-th order statistic in $O(n)$ average time and $O(1)$ space.
- **Timsort** is the engine algorithm behind Node.js's native `Array.prototype.sort()`. It combines Merge Sort and Insertion Sort to provide stable, $O(n \log n)$ worst-case sorting.
- **Pivot Randomization** prevents $O(n^2)$ degeneration on already-sorted or reverse-sorted data.

---

## 6. Practice Problems

### 6.1 Sort Colors

- **Input:** `nums = [2, 0, 2, 1, 1, 0]`
- **Output:** `[0, 0, 1, 1, 2, 2]`
- **Constraint:** Sort the array in-place in a single pass ($O(n)$ time and $O(1)$ space) without calling built-in sort methods.
- **Hint 1:** This is the Dutch National Flag problem. Use three pointers: `low`, `mid`, and `high`.
- **Hint 2:** `mid` scans the array. If `nums[mid] === 0`, swap with `low` and advance both. If `nums[mid] === 2`, swap with `high` and decrement `high` without advancing `mid`.
- **Hint 3:** If `nums[mid] === 1`, simply advance `mid`.

### 6.2 Top K Frequent Elements

- **Input:** `nums = [1, 1, 1, 2, 2, 3]`, `k = 2`
- **Output:** `[1, 2]`
- **Constraint:** Better than $O(n \log n)$ time complexity.
- **Hint 1:** Count frequencies into a `Map`.
- **Hint 2:** Convert unique keys into an array and use Quickselect based on frequency values instead of sorting all elements.
- **Hint 3:** The top $k$ frequent elements will sit in the right partition after Quickselect finds the $(N - k)$-th index.

### 6.3 Merge Intervals

- **Input:** `intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]`
- **Output:** `[[1, 6], [8, 10], [15, 18]]`
- **Constraint:** $1 \le intervals.length \le 10^4$.
- **Hint 1:** Sort intervals by start time using an $O(n \log n)$ sort.
- **Hint 2:** Iterate through the sorted intervals. If the current interval's start is $\le$ the previous interval's end, merge them by taking the maximum end time.
- **Hint 3:** Otherwise, push the current interval to your result array.

---

<nav aria-label="Lecture navigation">

[Previous: Recursion & Call Stack](day-18-recursion-fundamentals-and-call-stack.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Recursion Trees & Backtracking](day-20-recursion-trees-and-backtracking-core.md)

</nav>
