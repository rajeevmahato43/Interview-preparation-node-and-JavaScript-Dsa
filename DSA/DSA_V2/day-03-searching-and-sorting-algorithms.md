# Day 03: Searching & Elementary Sorting Algorithms

<nav aria-label="Lecture navigation">

[Previous: Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md)

</nav>

---

## 1. Searching Algorithms

**Searching** means finding the position of a target value in a list, or checking that the value is not there.

How fast you can search depends on whether the list is sorted. If the list is unsorted, the computer has no clues about where the item is and has to check every item one by one. If the list is sorted, the computer can throw away half the list in a single step.

To picture this in real life, imagine looking for information in two different ways:
* **The Messy Desk (Linear Search - $O(n)$):** You are looking for a receipt in a messy, unsorted pile on your desk. You pick up the top paper, check it, put it aside, and repeat. If there are 1,000 papers, you might have to check all 1,000 papers.
* **The Printed Dictionary (Binary Search - $O(\log n)$):** You are looking up the word "Network" in a 1,000-page dictionary where words are sorted alphabetically. You do not start on page 1 reading word by word. You open the book right in the middle at page 500. "Network" comes after the middle word, so you can ignore the whole first 500 pages right away. You cut the remaining pages in half again and again, finding the word in at most 10 checks ($\log_2 1000 \approx 10$).

```javascript
// Linear Search: Unsorted input, checks every item
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i; // Found it
  }
  return -1; // Not in the list
}

// Binary Search: Sorted input, cuts in half each step
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

Linear Search is the simplest search. It starts at index 0 and checks each item one by one until the end. It does not need the list to be sorted.

```text
Array: [ 14, 42, 7, 88, 31 ], Target = 7

Step 1 (i = 0): Look at arr[0] (14). Is 14 === 7? No.  -> Check next item.
Step 2 (i = 1): Look at arr[1] (42). Is 42 === 7? No.  -> Check next item.
Step 3 (i = 2): Look at arr[2] (7).   Is 7 === 7? Yes! -> Return index 2.
```

* **Best Case ($\Omega(1)$):** The item we want is right at the first spot (index 0).
* **Worst Case ($O(n)$):** The item is at the very end, or not in the array at all. We have to check all $n$ items.
* **Extra Memory ($O(1)$):** Only uses one simple loop variable.

### 1.2 Binary Search

Binary Search works **only on sorted lists**. Instead of checking items one by one, it always checks the middle item:

```text
Sorted Array: [ 2, 5, 8, 12, 16, 23, 38 ], Target = 23
low = 0, high = 6

Step 1: mid = 0 + Math.floor((6 - 0) / 2) = 3 -> arr[3] is 12.
        12 is smaller than 23 -> Target must be in the right half!
        Move low = mid + 1 = 4. Now search only indices [4..6].

Step 2: mid = 4 + Math.floor((6 - 4) / 2) = 5 -> arr[5] is 23.
        arr[5] === 23 -> Target found at index 5 in just 2 steps!
```

* **Safe Midpoint Formula:** In code, write `low + Math.floor((high - low) / 2)` instead of `(low + high) / 2` to avoid integer overflow bugs when numbers are large.
* **Loop Condition:** Using `while (low <= high)` makes sure that even when only 1 item is left (`low === high`), that last item is still checked.

> [!NOTE]
> **Self-Check:** What happens if you search for a number smaller than `arr[0]` in Binary Search?  
> *Answer:* `high` moves left on every turn until it drops to `-1`. Then `low <= high` becomes `false` and the code cleanly returns `-1`.

### 1.3 Search Space Invariants

An invariant is a simple rule that stays true on every turn of a loop. In Binary Search, the rule is:
$$\text{If the target is in the array, it must be between indices } [low, high].$$
When `arr[mid] < target`, we know all items from `low` to `mid` are too small. We can safely throw away that whole left half by setting `low = mid + 1`.

### 1.4 Searching Methods Table

| Method | Best Time | Average Time | Worst Time | Extra Memory | Needs Sorted List? | Quick Example |
| :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| **Linear Search** | $O(1)$ | $O(n)$ | $O(n)$ | $O(1)$ | No (works on unsorted) | `[4, 2, 8].indexOf(2)` $\to$ `1` |
| **Binary Search** | $O(1)$ | $O(\log n)$ | $O(\log n)$ | $O(1)$ | **Yes (Must be sorted)** | `[2, 4, 8]` $\to$ checks middle `4` |
| **Hash Lookup** | $O(1)$ | $O(1)$ | $O(n)$ | $O(n)$ | Needs a `Map` or `Set` | `map.get("key")` $\to$ instant |

---

## 2. Elementary Sorting Algorithms

**Sorting** means putting items in order (from smallest to biggest, or biggest to smallest).

Basic sorting algorithms take $O(n^2)$ time in the worst case, but they teach important lessons about swapping items in memory and organizing data step-by-step.

To picture the three basic sorts in real life:
* **Bubble Sort:** Bubbles floating up in a glass of soda. The largest bubbles float to the top first. In the same way, the largest numbers bubble up to the end of the array on each pass.
* **Selection Sort:** Arranging students in a line by height. You scan everyone to find the shortest student and swap them with the first spot. Then you scan the rest to find the next shortest student and swap them with the second spot.
* **Insertion Sort:** Sorting cards in your hand. You hold sorted cards in your left hand. You pick up a new card from the table and slide it backward past bigger cards until it sits in the right spot.

```javascript
// Swapping two items in JavaScript
const nums = [5, 1, 4, 2];
[nums[0], nums[1]] = [nums[1], nums[0]]; // Swap items at index 0 and 1
console.log(nums); // [1, 5, 4, 2]
```

### 2.1 Bubble Sort

Bubble Sort compares two neighbors `(j, j + 1)` and swaps them if the left one is bigger. After the first pass, the largest number is guaranteed to be at the very end. Adding a `swapped` flag lets the code finish in fast **$O(n)$ time** if the array is already sorted:

```javascript
// ✅ CORRECT: Bubble Sort with early exit if already sorted
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
    // If no swaps happened, the list is already sorted!
    if (!swapped) break;
  }
  return arr;
}

console.log(bubbleSort([5, 1, 4, 2, 8])); // [1, 2, 4, 5, 8]
console.log(bubbleSort([1, 2, 3, 4, 5])); // [1, 2, 3, 4, 5] (Fast O(n) run!)
```

### 2.2 Selection Sort

Selection Sort keeps a sorted section on the left and an unsorted section on the right. In each turn, it finds the smallest number in the unsorted section and swaps it to the front:

```text
Sort [ 29, 10, 14, 37, 13 ]:
Pass 1: Smallest is 10 at index 1 -> Swap with index 0: [ 10 | 29, 14, 37, 13 ]
Pass 2: Smallest is 13 at index 4 -> Swap with index 1: [ 10, 13 | 14, 37, 29 ]
Pass 3: Smallest is 14 at index 2 -> Swap with index 2: [ 10, 13, 14 | 37, 29 ]
Pass 4: Smallest is 29 at index 4 -> Swap with index 3: [ 10, 13, 14, 29 | 37 ] -> Done!
```

Selection Sort is useful because it makes at most **$n - 1$ total swaps**. It writes to memory very few times.

```javascript
// ✅ CORRECT: Selection Sort (Fewest memory writes)
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

Insertion Sort picks up the next item (`key = arr[i]`) and slides all bigger items one spot to the right to make an opening for `key`. If the list is already sorted, the sliding loop never runs, finishing in fast **$O(n)$ time**:

```javascript
// ✅ CORRECT: Insertion Sort (Adaptive sliding)
function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    // Slide items that are bigger than key to the right
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key; // Put key into the opening
  }
  return arr;
}

console.log(insertionSort([12, 11, 13, 5, 6])); // [5, 6, 11, 12, 13]
```

> [!NOTE]
> **Self-Check:** Why does JavaScript's internal sorting engine use Insertion Sort for small lists ($n \le 32$)?  
> *Answer:* Insertion Sort is very simple, runs fast in CPU cache, and finishes in $O(n)$ time if the data is already mostly sorted.

### 2.4 Stability and Adaptability

* **Stable Sorting:** A sort is **stable** if items with the exact same value stay in their original relative order. For example, sorting users by `age` will keep whichever 25-year-old was listed first in that same relative spot. Bubble Sort and Insertion Sort are stable. Selection Sort is not.
* **Adaptive Sorting:** A sort is **adaptive** if it runs faster (speeding up from $O(n^2)$ to $O(n)$) when the list is already partly or fully sorted. Bubble Sort (with the flag) and Insertion Sort are adaptive.

### 2.5 Sorting Comparison Table

| Algorithm | Best Time | Average Time | Worst Time | Extra Memory | Stable? | Adaptive? | Total Swaps |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Bubble Sort** | **$O(n)$** | $O(n^2)$ | $O(n^2)$ | $O(1)$ | ✅ Yes | ✅ Yes | Up to $O(n^2)$ |
| **Selection Sort**| $O(n^2)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ | ❌ No | ❌ No | **Only $O(n)$** |
| **Insertion Sort**| **$O(n)$** | $O(n^2)$ | $O(n^2)$ | $O(1)$ | ✅ Yes | ✅ Yes | Up to $O(n^2)$ shifts |

---

## 3. Problem Walkthroughs

---

### 3.1 Search Insert Position

#### 3.1.1 Problem Statement
Given a sorted array of distinct numbers `nums` and a number `target`, return the index if the target is found. If not, return the index where it would belong if you inserted it in order. You must write a solution that runs in $O(\log n)$ time.

* **Sample Input 1:** `nums = [1, 3, 5, 6]`, `target = 5` $\to$ **Expected Output:** `2`
* **Sample Input 2:** `nums = [1, 3, 5, 6]`, `target = 2` $\to$ **Expected Output:** `1`
* **Sample Input 3:** `nums = [1, 3, 5, 6]`, `target = 7` $\to$ **Expected Output:** `4`
* **Constraints:** $1 \le nums.length \le 10^5$, $-10^4 \le nums[i], target \le 10^4$, all numbers in `nums` are distinct and sorted in ascending order.

#### 3.1.2 How to Think About It
Imagine numbered lockers in a hallway, sorted in ascending order: `[1, 3, 5, 6]`. You want to put a package labeled `2` into the right slot.

Put your left finger at the first locker (`low = 0`) and your right finger at the last locker (`high = 3`).  
Look at the locker in the middle (index 1, label 3). `2` is smaller than `3`. Because the lockers are sorted, `2` cannot possibly belong to the right of locker 1. Move your right finger leftward past locker 1 (`high = 0`).  
Now the middle locker is index 0 (label 1). `2` is bigger than `1`. Move your left finger rightward past locker 0 (`low = 1`).  
Your fingers have crossed (`low > high`). Look at where your left finger (`low`) stopped: right at locker index `1`! That is the exact spot where `2` belongs.

#### 3.1.3 Brute Force Approach & Bottleneck
The naive way is to check items from left to right:

```javascript
function searchInsertLinear(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] >= target) return i;
  }
  return nums.length;
}
```

* **The Bottleneck:** Checks items one by one ($O(n)$ time). For $100,000$ numbers, this takes $100,000$ steps and ignores the fact that the array is already sorted.

#### 3.1.4 The Pattern Insight
Because `nums` is sorted, we can use **Binary Search**. In each step, checking the middle item cuts the remaining items in half ($O(\log n)$). When the target is not in the list, `low` always ends up pointing to the exact spot where the target should be inserted.

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
    // Safe midpoint calculation
    const mid = low + Math.floor((high - low) / 2);

    if (nums[mid] === target) {
      return mid; // Exact match found
    } else if (nums[mid] < target) {
      low = mid + 1; // Target is in right half
    } else {
      high = mid - 1; // Target is in left half
    }
  }

  // When loop finishes, low points to the exact insert position
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
Writing `low = mid` instead of `low = mid + 1` causes an infinite loop when `low` and `high` are right next to each other (like `low = 0, high = 1`). `Math.floor((0 + 1) / 2)` gives `0`, resetting `low = 0` forever. Always move past `mid` using `mid + 1` or `mid - 1`.

#### 3.1.8 Complexity Derivation
* **Time Complexity:** $O(\log n)$ — In each step, the search range is cut in half. Halving $100,000$ items takes at most 17 steps.
* **Auxiliary Space Complexity:** $O(1)$ — Only uses simple index numbers (`low`, `high`, `mid`).

> [!NOTE]
> **Self-Check:** Why does `low` always point to the correct insertion spot when the target is missing?  
> *Answer:* When the loop finishes, `high < low`. All items before `low` are smaller than `target`, and all items after `high` are bigger. That makes `low` the exact spot where the target belongs.

---

### 3.2 Sort Colors

#### 3.2.1 Problem Statement
Given an array `nums` with $n$ objects colored red (`0`), white (`1`), or blue (`2`), sort them **in-place** so that numbers of the same color are next to each other, in the order `0`, `1`, and `2`. You must do this without using the built-in sort function, in one single pass using $O(1)$ extra space.

* **Sample Input 1:** `nums = [2, 0, 2, 1, 1, 0]` $\to$ **Expected Output:** `[0, 0, 1, 1, 2, 2]`
* **Sample Input 2:** `nums = [2, 0, 1]` $\to$ **Expected Output:** `[0, 1, 2]`
* **Constraints:** $n == nums.length$, $1 \le n \le 10^5$, `nums[i]` is either `0`, `1`, or `2`.

#### 3.2.2 How to Think About It
Imagine sorting colored poker chips on a table: Red (`0`), White (`1`), and Blue (`2`).  
You want three clean areas: Red on the left, White in the middle, and Blue on the right.

Put your left thumb at the start (`low = 0`, spot for 0s).  
Put your right thumb at the end (`high = n - 1`, spot for 2s).  
Use your index finger (`mid = 0`) to look at each chip one by one:
* If the chip is `0`: Swap it into your left thumb's spot (`low`) and move both fingers forward.
* If the chip is `1`: It belongs right in the middle! Just move your examining finger forward (`mid++`).
* If the chip is `2`: Swap it into your right thumb's spot (`high`) and move your right thumb backward (`high--`). Keep your examining finger (`mid`) right where it is, because you need to look at the new chip that just arrived from the right!

#### 3.2.3 Brute Force Approach & Bottleneck
The naive way counts how many 0s, 1s, and 2s there are, and then writes them back:

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

* **The Bottleneck:** Counting takes **two full passes** through the list and overwrites all values. We want to sort the items in a single pass by swapping them in place.

#### 3.2.4 The Pattern Insight
The **Dutch National Flag algorithm** divides the array into three areas using 3 pointers:
* `[0 .. low - 1]`: Confirmed 0s (Red)
* `[low .. mid - 1]`: Confirmed 1s (White)
* `[mid .. high]`: Unchecked items (Unknown)
* `[high + 1 .. n - 1]`: Confirmed 2s (Blue)

When `mid > high`, all items have been checked and the entire array is sorted in one pass.

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
Moving `mid++` forward when swapping with `high` is a common bug. When `nums[mid] === 2`, swapping with `nums[high]` brings an unchecked number into `mid`. If that new number is `0`, moving `mid++` forward will skip it, leaving a `0` trapped in the middle.

#### 3.2.8 Complexity Derivation
* **Time Complexity:** $O(n)$ — On every step of the loop, either `mid` moves right or `high` moves left. They cross each other in at most $n$ steps.
* **Auxiliary Space Complexity:** $O(1)$ — Sorts the array completely in place without creating new lists.

> [!NOTE]
> **Self-Check:** Why don't we need to re-check `nums[mid]` after swapping with `nums[low]`?  
> *Answer:* Items swapped from `low` into `mid` are guaranteed to be `1`s that were already checked earlier as `mid` walked past `low`.

---

### 3.3 Majority Element

#### 3.3.1 Problem Statement
Given an array `nums` of size $n$, find the **majority element**. The majority element is the number that appears **more than half the time** (more than $\lfloor n / 2 \rfloor$ times). You can assume that the majority element always exists in the array.

* **Sample Input 1:** `nums = [3, 2, 3]` $\to$ **Expected Output:** `3`
* **Sample Input 2:** `nums = [2, 2, 1, 1, 1, 2, 2]` $\to$ **Expected Output:** `2`
* **Constraints:** $n == nums.length$, $1 \le n \le 5 \times 10^4$, $-10^9 \le nums[i] \le 10^9$.

#### 3.3.2 How to Think About It
Imagine a crowded room where people from different teams are voting. One team is the majority, having more than 50% of all the votes.

Whenever two people from different teams disagree, they both leave the room and cancel each other out. Because the majority team has more than half of all people, even if everyone else in the room teams up against them, the majority team will still have people standing at the end!

#### 3.3.3 Brute Force Approach & Bottleneck
The naive way counts how often each number appears using a Hash Map:

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

* **The Bottleneck:** While this takes $O(n)$ time, making a `Map` uses $O(n)$ extra memory. For $1,000,000$ numbers, this uses lots of extra memory. In interviews, you are expected to solve this using **$O(1)$ extra space**.

#### 3.3.4 The Pattern Insight
The **Boyer-Moore Voting Algorithm** keeps track of a `candidate` and a `count`:
1. If `count === 0`, pick the current number as the new `candidate`.
2. If the current number matches `candidate`, add 1 (`count++`).
3. If the current number is different, subtract 1 (`count--`) (canceling out).

Because the majority number appears more than $n / 2$ times, it appears more often than all other numbers combined. Canceling out pairs will never eliminate the true majority number.

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
Sorting the array with `nums.sort((a, b) => a - b)` and returning the middle number `nums[Math.floor(n / 2)]` is a common shortcut. But sorting takes $O(n \log n)$ time and changes the caller's array. Boyer-Moore takes fast $O(n)$ time and leaves the array unchanged.

#### 3.3.8 Complexity Derivation
* **Time Complexity:** $O(n)$ — Goes through the array once in a single pass of $n$ steps.
* **Auxiliary Space Complexity:** $O(1)$ — Only stores two simple variables (`candidate` and `count`).

> [!NOTE]
> **Self-Check:** What would Boyer-Moore return if no number appeared more than half the time?  
> *Answer:* It would still return a number, but that number might not be a real majority. If a majority number is not guaranteed to exist, you need a second pass to check that the candidate actually appears more than $n / 2$ times.

---

## 4. Tricky Edge Cases

* **JavaScript Default `sort()` Traps Numbers:** In JavaScript, `[10, 2, 5].sort()` returns `[10, 2, 5]` because it treats numbers like words (`"10"` comes before `"2"` alphabetically). Always provide a comparison function: `arr.sort((a, b) => a - b)`.
* **Binary Search Midpoint Overflow:** Writing `(low + high) / 2` can cause numbers to overflow when numbers are very large. Always write `low + Math.floor((high - low) / 2)`.
* **Binary Search Loop Condition:** Writing `low < high` stops before checking the last item when `low === high`. Use `low <= high` when searching for a specific number.
* **Empty and Single-Item Arrays:** Check for empty arrays at the start. An array with 1 item should return index `0` right away without running full loops.
* **All Identical Numbers:** When all numbers in the list are the same (like `[2, 2, 2, 2]`), your code should not get stuck in an endless loop.
* **Sorting in Place Changes the Original List:** JavaScript's `sort()` modifies the array you give it. If you need to keep the original array unchanged, copy it first with `[...arr].sort()` or use `toSorted()`.

---

## 5. Summary Cheat Sheet

* **Linear vs Binary Search:** Unsorted lists need $O(n)$ Linear Search. Sorted lists can use fast $O(\log n)$ Binary Search.
* **Safe Midpoint:** Always calculate the middle using `low + Math.floor((high - low) / 2)` to prevent overflow.
* **Bubble Sort:** Swaps neighboring items. Adding a `swapped` flag makes it finish in fast $O(n)$ time if already sorted.
* **Selection Sort:** Makes at most $n - 1$ total swaps, which is great when writing to memory is expensive.
* **Insertion Sort:** Slides items to the right to make room. Very fast ($O(n)$) on lists that are already mostly sorted.
* **Dutch National Flag:** Uses 3 pointers (`low`, `mid`, `high`) to sort 3 values in a single $O(n)$ pass with no extra memory.
* **Boyer-Moore Voting:** Cancels out different numbers; the majority number ($> 50\%$) is guaranteed to survive.

---

## 6. Practice Problems

### 6.1 First Bad Version (Easy / Warm-Up)
* **Problem:** You have $n$ software versions `[1, 2, ..., n]`. Once a version is bad, all versions after it are also bad. Given an API function `isBadVersion(version)`, find the first bad version using the fewest API calls.
* **Sample Input:** `n = 5`, first bad version is `4` $\to$ **Expected Output:** `4`
* **Hints:**
  * *Hint 1:* The version list is sorted: `[false, false, false, true, true]`.
  * *Hint 2:* How can you use Binary Search to find the exact spot where `isBadVersion` flips from `false` to `true` in $O(\log n)$ time?

### 6.2 Find Minimum in Rotated Sorted Array (Medium)
* **Problem:** An array of unique numbers was sorted in ascending order and then rotated. Find the smallest number in $O(\log n)$ time.
* **Sample Input:** `nums = [3, 4, 5, 1, 2]` $\to$ **Expected Output:** `1`
* **Hints:**
  * *Hint 1:* Compare `nums[mid]` with `nums[high]`.
  * *Hint 2:* If `nums[mid] > nums[high]`, the smallest number must be in the right half (`low = mid + 1`). Otherwise, it is in the left half including `mid` (`high = mid`).

### 6.3 Meeting Rooms (Medium / Hard)
* **Problem:** Given a list of meeting intervals `intervals[i] = [start, end]`, determine if one person can attend all meetings without any overlapping times.
* **Sample Input:** `intervals = [[0, 30], [5, 10], [15, 20]]` $\to$ **Expected Output:** `false` (`[0, 30]` overlaps with `[5, 10]`)
* **Hints:**
  * *Hint 1:* Without sorting, checking every meeting against every other meeting takes $O(n^2)$ time.
  * *Hint 2:* If you sort meetings by their `start` time in $O(n \log n)$ time, what simple check ($O(n)$) sees if two neighboring meetings overlap?

---

<nav aria-label="Lecture navigation">

[Previous: Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md)

</nav>
