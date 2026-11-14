# Day 07: Two Pointers: Fast & Slow and In-Place Partitioning

<nav aria-label="Lecture navigation">

[Previous: Two Pointers: Opposing & Symmetrical Scans](day-06-two-pointers-opposing-and-symmetrical.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Fixed Sliding Window](day-08-sliding-window-fixed-size.md)

</nav>

---

## Prerequisites

- An **index** is an item's position number in an array.
- **In place** means changing the same array instead of making a new one.
- `O(n)` work grows with the number of values. `O(n^2)` work can grow like the number of values multiplied by itself.
- **Extra space** is memory used besides the input array. `O(1)` extra space means using a fixed amount, such as a few variables. `O(n)` extra space grows with the array.
- Review [Day 6](day-06-two-pointers-opposing-and-symmetrical.md) for pointers that start at opposite ends and move toward each other.

## 1. Pointer Methods

This lesson uses three ways to move pointers:

- **Read and write:** `read` checks each array value. `write` marks the next spot for a value we want to keep.
- **Tortoise and hare:** Two linked-list pointers move at different speeds. This is only a preview; linked lists come in Days 11 and 12.
- **Three-way grouping:** Three pointers put values into three groups. This is a different method from read and write.

In the array examples, a pointer is an index that tells us which spot to read or write.

### 1.1 Read and Write Pointers

`read` checks each value from left to right. `write` marks where the next value we keep should go. `read` moves for every value. `write` moves only when we keep a value, so it may stay still while `read` moves.

Imagine checking cards in a line. One finger checks each card. Another finger points to the next open place for a card you want to keep. If you skip a card, only the first finger moves. If you keep it, both fingers move.

Move all zeroes in `[0, 1, 0, 3, 12]` to the end. Keep the other values in the same order:

```text
Read 0: skip                    [ 0, 1, 0, 3, 12 ]
Read 1: write at the front     [ 1, 1, 0, 3, 12 ]
Read 0: skip                    [ 1, 1, 0, 3, 12 ]
Read 3: write next             [ 1, 3, 0, 3, 12 ]
Read 12: write next            [ 1, 3, 12, 3, 12 ]
Fill the rest with 0           [ 1, 3, 12, 0, 0 ]
```

```javascript
// Node.js code
"use strict";

// ✅ CORRECT: Keep non-zero values in their original order.
function moveZeroes(nums) {
  if (!Array.isArray(nums)) {
    throw new TypeError("nums must be an array");
  }

  let write = 0;

  for (let read = 0; read < nums.length; read++) {
    if (nums[read] !== 0) {
      if (write !== read) {
        nums[write] = nums[read];
      }
      write++;
    }
  }

  while (write < nums.length) {
    nums[write] = 0;
    write++;
  }

  return nums;
}

const numbers = [0, 1, 0, 3, 12];
console.log(moveZeroes(numbers)); // [ 1, 3, 12, 0, 0 ]
console.log(moveZeroes([]));      // []

// ❌ COMMON BUG: Removing items while reading can skip a zero and move many values.
function buggyMoveZeroes(nums) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === 0) {
      nums.splice(i, 1);
      nums.push(0);
    }
  }
  return nums;
}

console.log(buggyMoveZeroes([0, 0, 1])); // [ 0, 1, 0 ] (one zero was skipped)
```

`write` marks the next open spot. The values before it are the ones we keep. Fill the rest with `0`. We check each value once (`O(n)`) and use only a few extra variables (`O(1)` space).

> [!NOTE]
> After checking one value, which part of the array holds the values we want to keep?

### 1.2 The Read and Write Rule

An **invariant** is a rule that must stay true after every step. For these pointers:

- Before `write`: the values we keep, in their original order.
- From `write` up to `read`: values we checked but no longer need.
- From `read` to the end: values we have not checked yet.

> [!NOTE]
> One `splice()` can move many values. What happens if a loop calls it many times?

### 1.3 Tortoise and Hare Preview

In a linked list, values are joined by links. The slow pointer moves one link at a time. The fast pointer moves two. If the list ends, fast reaches the end or `null`. If the list loops back, fast eventually meets slow.

Check for a meeting after both pointers move. At first, both point to the first value, even when there is no loop. If there is a loop, fast moves one extra link each turn, so it eventually meets slow. Learn this method after [Day 11](day-11-singly-and-doubly-linked-lists.md), in [Day 12](day-12-linked-list-reversals-and-cycle-detection.md).

### 1.4 Pointer Movement Summary

| Method | How the pointers move | Use it to | Time | Extra space |
| :--- | :--- | :--- | :---: | :---: |
| **Read / Write** | Read checks each item; write moves when an item is kept | Move chosen values to the front | `O(n)` | `O(1)` |
| **Tortoise / Hare** | One link vs. two links per turn | Find a list middle or loop | `O(n)` | `O(1)` |
| **Three-Way Grouping** | `low` and `high` mark group edges; `mid` checks values | Put values into three groups | `O(n)` | `O(1)` |

## 2. Put Values into Three Groups

This method is called **three-way partitioning**. It means putting values into three groups using a rule. Values in a group do not have to be sorted.

The Dutch National Flag method puts `0`s, `1`s, and `2`s into three groups in one pass. A pass means going through the array from one end to the other. Think of sorting red, white, and blue balls into three bins. At any time, the array has four parts:

```text
[ 0s | 1s | not checked yet | 2s ]
 0    low  mid               high          n - 1
```

`low` marks where the next `0` goes. `mid` marks the next value to check. `high` marks where the next `2` goes.

### 2.1 Keep the Four Parts Clear

At the start of each step:

- Before `low`: all values are `0`.
- From `low` to `mid - 1`: all values are `1`.
- From `mid` to `high`: values are not checked yet.
- After `high`: all values are `2`.

Check `nums[mid]`:

- **It is `0`:** Swap (trade places) it with `nums[low]`. Move `low` and `mid` forward. If they were in different spots, a `1` moves to `mid`.
- **It is `1`:** Leave it in place. Move `mid` forward.
- **It is `2`:** Swap it with `nums[high]` and move `high` back. Keep `mid` in place because the new value at `mid` still needs checking.

Each step deals with one value that has not been checked yet. Stop when `mid > high`. Then every value is in the right group.

### 2.2 Check the Values Left

Start with `[2, 0, 1]`. Watch what happens when `2` moves to the right:

| Action | Array | `low` | `mid` | `high` |
| :--- | :--- | :---: | :---: | :---: |
| Start | `[2, 0, 1]` | 0 | 0 | 2 |
| See `2`; swap with the rightmost spot | `[1, 0, 2]` | 0 | 0 | 1 |
| Check the new `1`; move `mid` | `[1, 0, 2]` | 0 | 1 | 1 |
| See `0`; swap it to the left | `[0, 1, 2]` | 1 | 2 | 1 |
| Stop; no values are left to check | `[0, 1, 2]` | 1 | 2 | 1 |

Values in a group may change order. Use this method only if that is okay.

> [!NOTE]
> Why must we check the value swapped in from the right before moving `mid`?

### 2.3 Compare Pointer Methods

| Pattern | How the pointers move | Use it for |
| :--- | :--- | :--- |
| Opposing pointers | Start at both ends and move inward | Find a pair in a sorted array |
| Read / write | Move forward; write only values you keep | Remove values from an array |
| Three-way grouping | Check the middle; make the part not checked yet smaller from either side | Group three kinds of values |
| Sliding window | Move the two ends of a range | Work with a fixed-size part of an array |

[Day 6](day-06-two-pointers-opposing-and-symmetrical.md) covers opposing pointers. [Day 8](day-08-sliding-window-fixed-size.md) covers sliding windows. Each pattern moves its pointers in a different way.

## 3. Pick a Method

### 3.1 Match the Clue

| Problem clue | What it means | Try |
| :--- | :--- | :--- |
| **Change an array without making another one** | Use little extra memory. | Read / write pointers. |
| **Remove copies from a sorted array** | Keep one of each value. | Keep a value when it is different from the last one kept. |
| **Remove a chosen value** | Move all other values to the front. | Read / write pointers. |
| **Group three kinds of values** | Put each value in the right group. | Three-way grouping. |
| **Find the middle of a linked list** | Find its center while checking links. | Tortoise and hare, after learning linked lists. |

### 3.2 When This Method Fits

- Use read/write when you can decide to keep or skip each value as you read it.
- Use it for duplicates when the array is sorted. Copies of the same value are next to each other.
- Use three-way grouping when every value belongs in one of three groups and the order inside each group does not matter.
- Use these methods instead of removing items one by one and shifting the rest.

### 3.3 When to Pick Another Method

- You must keep every value in its original spot.
- You need to remove one item and its order does not matter; swapping with the last item may be simpler.
- You need a pair from both ends of a sorted array; use opposing pointers.
- You need to check a range of nearby values; use a sliding window.

### 3.4 Compare the Steps

About 10 million steps is only a rough guide. It does not tell you the exact run time.

For an array with 50,000 values:

- One pass checks about 50,000 values.
- If all values match, the first `splice()` moves nearly 50,000 values. Each next call moves one fewer value. Together, they move about **1.25 billion values**.
- The actual run time depends on the computer and the input.

---

## 4. Problem Walkthroughs

---

### 4.1 Remove Duplicates from Sorted Array

#### 4.1.1 Problem Statement
Given an integer array `nums`, sorted from smallest to largest, keep one copy of each value. Change `nums` itself and keep the values in the same order. Return `k`, the number of different values.

Only the first `k` spots matter. The rest can contain any values. In the samples, `_` marks a spot that does not matter.

* **Input:** `nums = [1, 1, 2]` -> **Output:** `k = 2`, `nums = [1, 2, _]`
* **Input:** `nums = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]` -> **Output:** `k = 5`, `nums = [0, 1, 2, 3, 4, _, _, _, _, _]`
* **Input limits:** `nums` has 1 to 30,000 values. Each value is between -100 and 100. The values are sorted from smallest to largest, and may repeat.

#### 4.1.2 How to Think About It
Picture the sorted cards `[0, 0, 1, 1, 1, 2]` on a table. Keep the first card. Compare each next card with the last one you kept. If they are the same, skip it. If they are different, put it in the next open spot. The kept cards stay together at the front.

#### 4.1.3 Brute Force Approach & Bottleneck
One simple way is to remove a value each time it matches the value next to it. **Bottleneck** means the slow part:

```javascript
// Node.js code
"use strict";

function removeDuplicatesBrute(nums) {
  let i = 0;
  while (i < nums.length - 1) {
    if (nums[i] === nums[i + 1]) {
      nums.splice(i + 1, 1); // Moves later values to the left.
    } else {
      i++;
    }
  }
  return nums.length;
}

const bruteInput = [1, 1, 2];
console.log(removeDuplicatesBrute(bruteInput), bruteInput); // 2 [ 1, 2 ]
```

* One `splice()` may move every value after the removed one. If all 30,000 values are the same, the first call moves nearly 30,000 values. Each next call moves one fewer value. Together, they move about **450 million values**. This takes `O(n^2)` work.

#### 4.1.4 Why This Works
Since the array is sorted, equal values are side by side. Do not delete them. Check each value and write it only if it is not the same as the last value kept.

#### 4.1.5 Pseudocode

Pseudocode is a short list of steps. It is not written in JavaScript.

```text
FUNCTION RemoveDuplicates(nums):
  IF length(nums) == 0 RETURN 0

  slow = 0

  FOR fast FROM 1 TO length(nums) - 1:
    IF nums[fast] != nums[slow]:
      slow = slow + 1
      nums[slow] = nums[fast]

  RETURN slow + 1
```

#### 4.1.6 Optimal Solution

```javascript
// Node.js code
"use strict";

// ✅ CORRECT: Checks each value once and uses only a few variables.
function removeDuplicates(nums) {
  if (!Array.isArray(nums)) {
    throw new TypeError("nums must be an array");
  }
  if (nums.length === 0) return 0;

  // slow is the index of the last value we kept.
  let slow = 0;

  // Start at 1 because the first value is already kept.
  for (let fast = 1; fast < nums.length; fast++) {
    // Keep the value if it is not the same as the last one kept.
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast];
    }
  }

  // slow is an index, so add 1 to get the count.
  return slow + 1;
}

// Example runs
const arr1 = [1, 1, 2];
const k1 = removeDuplicates(arr1);
console.log(k1, arr1.slice(0, k1)); // 2 [ 1, 2 ]

const arr2 = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4];
const k2 = removeDuplicates(arr2);
console.log(k2, arr2.slice(0, k2)); // 5 [ 0, 1, 2, 3, 4 ]
console.log(removeDuplicates([]));  // 0
```

The `slice()` calls only show the first `k` values. They make new arrays for the examples; `removeDuplicates` does not.

#### 4.1.7 Common Anti-Pattern

```javascript
// Node.js code
"use strict";

// ❌ COMMON BUG: This makes a Set and a new array, so extra memory grows with the input.
function removeDuplicatesSet(nums) {
  const unique = Array.from(new Set(nums));
  for (let i = 0; i < unique.length; i++) nums[i] = unique[i];
  return unique.length;
}

const setInput = [1, 1, 2];
console.log(removeDuplicatesSet(setInput), setInput); // 2 [ 1, 2 ]
```
* **Why it fails:** The `Set` and the new array need space that grows with the input. This problem allows only `O(1)` extra space.

#### 4.1.8 Complexity Derivation
* **Time:** `O(n)`. `fast` checks every value once.
* **Extra space:** `O(1)`. The function uses only a few variables.

---

### 4.2 Sort Colors

#### 4.2.1 Problem Statement
Given an array `nums` with values `0`, `1`, and `2`, put the `0`s first, the `1`s next, and the `2`s last. Change `nums` itself.

Do not use `sort()`. Check the array once and use only a few extra variables.

* **Input:** `nums = [2, 0, 2, 1, 1, 0]` -> **Output:** `[0, 0, 1, 1, 2, 2]`
* **Input:** `nums = [2, 0, 1]` -> **Output:** `[0, 1, 2]`
* **Input:** `nums = [0]` -> **Output:** `[0]`
* **Input limits:** `nums` has 1 to 300 values. Each value is `0`, `1`, or `2`.

#### 4.2.2 How to Think About It
Imagine a row of red (`0`), white (`1`), and blue (`2`) balls. Make three areas: red on the left, white in the middle, and blue on the right. Check the first ball that is not in an area yet.

- If it is red, move it into the left area.
- If it is white, leave it in the middle area.
- If it is blue, move it into the right area.

When a blue ball moves right, another ball comes back from that spot. Check that ball before moving on.

#### 4.2.3 Brute Force Approach & Bottleneck

A simple way is to find the smallest value left and move it to the next open spot. Repeat for every spot:

```javascript
// Node.js code
"use strict";

function sortColorsBrute(nums) {
  if (!Array.isArray(nums)) {
    throw new TypeError("nums must be an array");
  }

  for (let i = 0; i < nums.length - 1; i++) {
    let smallest = i;
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[j] < nums[smallest]) {
        smallest = j;
      }
    }

    if (smallest !== i) {
      const temp = nums[i];
      nums[i] = nums[smallest];
      nums[smallest] = temp;
    }
  }

  return nums;
}

console.log(sortColorsBrute([2, 0, 2, 1, 1, 0])); // [ 0, 0, 1, 1, 2, 2 ]
```

For each spot, we may need to check all the values after it. This takes `O(n^2)` time. Counting the values first is faster, but needs two passes: one to count and one to write. The problem asks for one pass, so use three-way grouping instead.

#### 4.2.4 Why This Works
Use the Dutch National Flag method from Section 2. Keep these four parts in order:

- Before `low`: `0`s.
- From `low` to the spot before `mid`: `1`s.
- From `mid` through `high`: values not checked yet.
- After `high`: `2`s.

After swapping a `2` with `nums[high]`, keep `mid` in place. Check the new value at `mid` before moving on.

#### 4.2.5 Pseudocode

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
    ELSE IF nums[mid] == 2:
      SWAP(nums[mid], nums[high])
      high = high - 1

  RETURN nums
```

#### 4.2.6 Optimal Solution

```javascript
// Node.js code
"use strict";

// ✅ CORRECT: Check each value once; use only a few extra variables.
function sortColors(nums) {
  if (!Array.isArray(nums)) {
    throw new TypeError("nums must be an array");
  }

  let low = 0;                 // Next place for a 0.
  let mid = 0;                 // Next value to check.
  let high = nums.length - 1;  // Next place for a 2.

  while (mid <= high) {
    if (nums[mid] === 0) {
      // Put 0 on the left.
      const temp = nums[low];
      nums[low] = nums[mid];
      nums[mid] = temp;
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      // 1 is already in the middle.
      mid++;
    } else if (nums[mid] === 2) {
      // Put 2 on the right.
      const temp = nums[mid];
      nums[mid] = nums[high];
      nums[high] = temp;
      high--;
      // Check the new value at mid on the next step.
    } else {
      throw new RangeError("each value must be 0, 1, or 2");
    }
  }

  return nums;
}

// Example runs
console.log(sortColors([2, 0, 2, 1, 1, 0])); // [ 0, 0, 1, 1, 2, 2 ]
console.log(sortColors([2, 0, 1]));          // [ 0, 1, 2 ]
console.log(sortColors([0]));                // [ 0 ]
console.log(sortColors([]));                 // []
```

#### 4.2.7 Common Anti-Pattern

```javascript
// Node.js code
"use strict";

// ❌ COMMON BUG: Moving past the new value after a swap.
function buggySortColors(nums) {
  let low = 0, mid = 0, high = nums.length - 1;
  while (mid <= high) {
    if (nums[mid] === 0) {
      const temp = nums[low];
      nums[low] = nums[mid];
      nums[mid] = temp;
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      const temp = nums[mid];
      nums[mid] = nums[high];
      nums[high] = temp;
      high--;
      mid++; // BUG: Moves past the new value without checking it!
    }
  }
  return nums;
}

const buggyColors = [1, 2, 0];
console.log(buggySortColors(buggyColors)); // [ 1, 0, 2 ] (not sorted)
```
* **Why it fails:** Swapping with `nums[high]` brings a new value to `nums[mid]`. Moving `mid` skips it. For `[1, 2, 0]`, this skips the `0`, so the array is still out of order.

#### 4.2.8 Complexity Derivation
* **Time:** `O(n)`. Each step checks one value, so there are at most `n` steps.
* **Extra space:** `O(1)`. The function uses only a few variables.

---

### 4.3 Remove Element

#### 4.3.1 Problem Statement
Given an integer array `nums` and a value `val`, remove every value equal to `val`. Change `nums` itself and return how many values remain.

The first `k` spots must hold values that are not `val`. Their order may change.

* **Input:** `nums = [3, 2, 2, 3]`, `val = 3` -> **Output:** `k = 2`, `nums = [2, 2, _, _]`
* **Input:** `nums = [0, 1, 2, 2, 3, 0, 4, 2]`, `val = 2` -> **Output:** `k = 5`, `nums = [0, 1, 3, 0, 4, _, _, _]`
* **Input limits:** `nums` can have 0 to 100 values. Each value and `val` are between 0 and 50.

#### 4.3.2 How to Think About It
Imagine checking tickets at a door. Skip every ticket that matches `val`. Put each other ticket in the next open spot at the front. The number of filled spots is the answer.

#### 4.3.3 Brute Force Approach & Bottleneck
One simple way removes `val` each time it appears. The **bottleneck** is the part that makes this method slow:

```javascript
// Node.js code
"use strict";

function removeElementBrute(nums, val) {
  let i = 0;
  while (i < nums.length) {
    if (nums[i] === val) {
      nums.splice(i, 1);
    } else {
      i++;
    }
  }
  return nums.length;
}

const bruteItems = [3, 2, 2, 3];
console.log(removeElementBrute(bruteItems, 3), bruteItems); // 2 [ 2, 2 ]
```

Each removal may move many values after it. Repeating this can take `O(n^2)` time.

#### 4.3.4 Why This Works
Do not delete values one at a time. Check each value once. Write it only if it is not `val`. At the end, `slow` is how many values we kept.

> [!NOTE]
> Why does one function return `slow + 1`, but the other return `slow`?

#### 4.3.5 Pseudocode

```text
FUNCTION RemoveElement(nums, val):
  slow = 0

  FOR fast FROM 0 TO length(nums) - 1:
    IF nums[fast] != val:
      nums[slow] = nums[fast]
      slow = slow + 1

  RETURN slow
```

#### 4.3.6 Optimal Solution

```javascript
// Node.js code
"use strict";

// ✅ CORRECT: Check each value once; use only a few extra variables.
function removeElement(nums, val) {
  if (!Array.isArray(nums)) {
    throw new TypeError("nums must be an array");
  }

  let slow = 0; // Next place for a value we keep.

  for (let fast = 0; fast < nums.length; fast++) {
    // Copy the value only when it is not val.
    if (nums[fast] !== val) {
      nums[slow] = nums[fast];
      slow++;
    }
  }

  // slow is the number of values we kept.
  return slow;
}

// Example runs
const test1 = [3, 2, 2, 3];
const len1 = removeElement(test1, 3);
console.log(len1, test1.slice(0, len1)); // 2 [ 2, 2 ]

const test2 = [0, 1, 2, 2, 3, 0, 4, 2];
const len2 = removeElement(test2, 2);
console.log(len2, test2.slice(0, len2)); // 5 [ 0, 1, 3, 0, 4 ]
console.log(removeElement([], 2));       // 0
```

This solution keeps the remaining values in their original order. The `slice()` calls only show the first `k` values; they are not part of the function.

#### 4.3.7 Common Anti-Pattern

```javascript
// Node.js code
"use strict";

// ❌ COMMON BUG: Moving slow for a value we should skip.
function buggyRemoveElement(nums, val) {
  let slow = 0;
  for (let fast = 0; fast < nums.length; fast++) {
    if (nums[fast] === val) { // BUG: Moves slow for a value we should skip.
      slow++;
    } else {
      nums[slow] = nums[fast];
    }
  }
  return slow;
}

const buggyItems = [3, 2, 2, 3];
const buggyCount = buggyRemoveElement(buggyItems, 3);
console.log(buggyCount, buggyItems.slice(0, buggyCount)); // 2 [ 3, 2 ]
```
* **Why it fails:** `slow` moves when it should stay still. A value equal to `val` can stay at the front, and a value we want can be lost.

#### 4.3.8 Complexity Derivation
* **Time:** `O(n)`. Check every value once.
* **Extra space:** `O(1)`. Use only a few variables.

---

## 5. Tricky Edge Cases

* **Index or count:** `removeDuplicates` returns `slow + 1` because `slow` is an index that starts at 0. `removeElement` returns `slow` because it counts the values kept.
* **Empty array:** All four array functions should work with `[]`.
* **No duplicates:** `removeDuplicates([1, 2, 3])` should keep all three values.
* **Remove every value:** `removeElement([2, 2], 2)` should return `0`.
* **Remove no values:** `removeElement([1, 3], 2)` should return `2`.
* **Move zeroes:** Try arrays with no zeroes, only zeroes, and zeroes at the end. Keep the other values in order.
* **Three groups:** Try arrays with all `0`s, all `1`s, all `2`s, and mixed values. After swapping with the right side, check the new value at `mid`.
* **Sort Colors input:** Values must be `0`, `1`, or `2`. The function throws an error for any other value.

---

## 6. Summary Cheat Sheet

* **Read / write:** Check each value once. Put each value we keep at the next open spot.
* **Sorted duplicates:** Compare each value with the last one kept.
* **Three groups:** Track the `0`s, `1`s, values not checked yet, and `2`s. After swapping with `high`, check `mid` again.
* **Repeated `splice()`:** It can shift many values each time. Many removals can take `O(n^2)` time.
* **Tortoise / hare:** This lesson only gives a first look at linked lists. Learn how list links work before finding a loop or middle.
* **Changing the array:** These methods change the input array. Make a copy first if you need to keep the original.

---

## 7. Practice Problems

### 7.1 Remove Duplicates from Sorted Array II

Given an integer array `nums`, sorted from smallest to largest, keep each value no more than twice. Keep the same order. Return `k`, the number of values kept.

* **Sample Input 1:** `nums = [1, 1, 1, 2, 2, 3]` $\to$ **Expected Output:** `5`, `nums = [1, 1, 2, 2, 3, _]`
* **Sample Input 2:** `nums = [0, 0, 1, 1, 1, 1, 2, 3, 3]` $\to$ **Expected Output:** `7`, `nums = [0, 0, 1, 1, 2, 3, 3, _, _]`
* **Input limits:** `nums` has 1 to 30,000 values. Each value is between -10,000 and 10,000. The values are sorted from smallest to largest.
* **Hint 1:** If the array has one or two values, keep them all. Start `slow` and `fast` at index 2.
* **Hint 2:** Compare `nums[fast]` with `nums[slow - 2]`. If they are different, copy `nums[fast]` to `nums[slow]`, then add 1 to `slow`.

---

### 7.2 Move Zeroes

Given an integer array, move all zeroes to the end. Keep the other values in the same order. Change the same array and use only a few extra variables.

* **Sample Input 1:** `nums = [0, 1, 0, 3, 12]` $\to$ **Expected Output:** `[1, 3, 12, 0, 0]`
* **Sample Input 2:** `nums = [0, 0]` $\to$ **Expected Output:** `[0, 0]`
* **Hint 1:** Check each value. Put each non-zero value in the next open spot.
* **Hint 2:** After checking all values, what should go in the open spots?

### 7.3 Group Values Around a Pivot

Given an integer array and a `pivot` value, put smaller values first, values equal to the pivot next, and larger values last. Do not sort the array. The order inside each group does not matter.

The `pivot` is the value used to split the array into groups. `nums` may be empty.

* **Input:** `nums = [9, 12, 3, 7, 12, 5, 12]`, `pivot = 7` -> **One valid output:** `[3, 5, 7, 12, 9, 12, 12]`
* **Input:** `nums = [4, 4, 4]`, `pivot = 4` -> **Output:** `[4, 4, 4]`
* **Hint 1:** Keep a left spot for smaller values, a middle spot for values not checked yet, and a right spot for larger values.
* **Hint 2:** When you swap a larger value with the right spot, check the new value in the middle before moving on.

---

<nav aria-label="Lecture navigation">

[Previous: Two Pointers: Opposing & Symmetrical Scans](day-06-two-pointers-opposing-and-symmetrical.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Fixed Sliding Window](day-08-sliding-window-fixed-size.md)

</nav>
