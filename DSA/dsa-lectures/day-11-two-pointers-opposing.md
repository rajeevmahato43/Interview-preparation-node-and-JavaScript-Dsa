# Day 11: Two Pointers: Opposing Pointers

<nav aria-label="Lecture navigation">

[Previous: Sorting Deep Dive: Merge Sort and Quick Sort](day-10-merge-sort-and-quick-sort.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Same-Direction / Fast & Slow](day-12-two-pointers-fast-and-slow.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain why sorted data allows opposing pointers to eliminate an entire row of candidates in $O(1)$ time.
- Implement **Two Sum II (Sorted Array)** with $O(1)$ auxiliary space.
- Solve **3Sum** by combining sorting with the two-pointer approach while rigorously avoiding duplicate triplets.
- Prove why the **Container With Most Water** greedy pointer shrinkage invariant is correct.
- Apply two-pointer string scanning for **Valid Palindrome** (handling non-alphanumeric characters and character skips).

## Prerequisites

- [Day 01: Big O and Problem Solving](day-01-big-o-and-problem-solving.md)
- [Day 05: Sorting and Searching Basics](day-05-sorting-and-searching-basics.md)
- [Day 07: Two Sum and Hash Map Complements](day-07-two-sum-and-hash-complements.md)

---

## Core Concepts

### 1. Opposing Pointers on Monotonic Data

When elements are sorted in ascending order, moving from left to right increases values, while moving from right to left decreases values.
By placing `left = 0` and `right = n - 1`, every comparison makes a decisive pruning decision:

```text
Sorted Array: [ 1 , 3 , 5 , 8 , 11 , 15 ],  Target = 13
                ▲                     ▲
              left                  right

Step 1: sum = 1 + 15 = 16. Sum is too large (16 > 13).
        Since the array is sorted, 15 paired with ANY element after 1 will also be > 13.
        We can safely prune 15 from all future consideration: right--.

Step 2: sum = 1 + 11 = 12. Sum is too small (12 < 13).
        1 paired with ANY element before 11 will be even smaller!
        We can safely prune 1 from all future consideration: left++.
```

Instead of checking $O(n^2)$ pairs, the pointers converge in at most $n$ steps: **$O(n)$ Time and $O(1)$ Space**.

---

### 2. The Container With Most Water Invariant

Problem: Given array `height`, find two lines that hold the most water:
$$\text{Area} = \min(\text{height}[L], \text{height}[R]) \times (R - L)$$

```text
   8 |   |                   |
   7 |   |                   |       |
   6 |   |   |               |       |
     +---+---+---+---+---+---+---+---+
       L=1                         R=7
         <---------- Width ---------->
```

**The Greedy Invariant**:
The area is bottlenecked by the **shorter line**.
If `height[L] < height[R]`, what happens if we move `R` inward?
- Width decreases by 1.
- Height can never exceed `height[L]`.
- Therefore, any pair involving `L` and an interior `R` is **guaranteed to have a smaller area**.
- We can safely discard `L`: **`L++`**.

---

## Detailed Explanations & Node.js Relevance

### 3Sum: Reducing $O(n^3)$ to $O(n^2)$

To find all unique triplets `[nums[i], nums[j], nums[k]]` summing to 0:
1. Sort `nums` in ascending order: $O(n \log n)$.
2. Loop index `i` from $0$ to $n - 3$.
3. For each `i`, run Two Sum II on the subarray to the right (`left = i + 1, right = n - 1`) targeting `-nums[i]`.
4. **Duplicate Avoidance Trap**:
   - Skip duplicate values of `nums[i]` when `nums[i] === nums[i - 1]`.
   - After finding a valid triplet, advance `left` past identical numbers (`while (nums[left] === nums[left+1]) left++`).

### Node.js Relevance: In-Memory Financial Range Matching
When building Node.js matching engines (e.g. order-book crossing or currency arbitrage), transactions are already maintained in sorted in-memory ring buffers. Using two-pointer convergence matches orders in $O(n)$ time with zero garbage collection allocations.

---

## JavaScript Implementation & Tracing

### 1. Two Sum II - Input Array Is Sorted (LeetCode 167)

```js
function twoSumSorted(numbers, target) {
  let left = 0;
  let right = numbers.length - 1;

  while (left < right) {
    const sum = numbers[left] + numbers[right];

    if (sum === target) {
      // 1-indexed response convention for LeetCode 167
      return [left + 1, right + 1];
    } else if (sum < target) {
      left++; // Need a larger sum
    } else {
      right--; // Need a smaller sum
    }
  }

  return [];
}
```

### 2. Container With Most Water (LeetCode 11)

```js
function maxArea(height) {
  let left = 0;
  let right = height.length - 1;
  let maxWater = 0;

  while (left < right) {
    const width = right - left;
    const currentHeight = Math.min(height[left], height[right]);
    const currentArea = width * currentHeight;

    if (currentArea > maxWater) {
      maxWater = currentArea;
    }

    // Advance the pointer pointing to the shorter wall
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }

  return maxWater;
}
```

### Trace: `maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7])`

| `L` | `R` | `h[L]` | `h[R]` | `Width` | `MinHeight` | `Area` | `maxWater` | Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 0 | 8 | 1 | 7 | 8 | 1 | 8 | 8 | `h[0] < h[8]` $\to$ `L++` |
| 1 | 8 | 8 | 7 | 7 | 7 | 49 | **49** | `h[8] < h[1]` $\to$ `R--` |
| 1 | 7 | 8 | 3 | 6 | 3 | 18 | 49 | `h[7] < h[1]` $\to$ `R--` |
| 1 | 6 | 8 | 8 | 5 | 8 | 40 | 49 | `h[1] === h[6]` $\to$ `R--` |

- **Time Complexity**: $O(n)$ — every iteration increments `left` or decrements `right`.
- **Auxiliary Space**: $O(1)$ — only primitive index pointers stored.

---

## Common Mistakes & Interview Traps

1. **Applying Two Pointers to Unsorted Arrays**:
   Two-pointer convergence relies entirely on monotonicity. If the array is unsorted, `left++` might decrease the sum!
2. **Infinite Loops in 3Sum Duplicate Skipping**:
   ```js
   // WRONG: Advancing left without boundary check:
   while (nums[left] === nums[left + 1]) left++; // Can exceed right!
   // CORRECT:
   while (left < right && nums[left] === nums[left + 1]) left++;
   ```
3. **Using `<=` instead of `<` in `while (left < right)`**:
   In two-sum and container problems, an element cannot pair with itself. Using `left <= right` causes redundant checks when `left === right`.

---

## Tricky Points & Edge Cases

- **Ties in Container With Most Water**:
  If `height[left] === height[right]`, moving either pointer (or both) is mathematically correct because neither wall can support a larger area with a smaller width.
- **Valid Palindrome with Non-Alphanumeric Characters**:
  Advance pointers past punctuation and spaces before comparing:
  ```js
  while (left < right && !isAlphaNumeric(s[left])) left++;
  ```

---

## Practical Exercise

Implement **Valid Palindrome II** (LeetCode 680):
Given a string `s`, return `true` if the string can be a palindrome after deleting **at most one** character from it.
- **Hint**: When `s[left] !== s[right]`, test whether the substring with `left` skipped OR `right` skipped is a palindrome.
- **Acceptance Criterion**: Must run in $O(n)$ time and $O(1)$ auxiliary space.

---

## Summary

- Opposing two pointers converge inward on sorted arrays in $O(n)$ time with $O(1)$ memory.
- In Two Sum II, the sum dictates whether to discard `left` (too small) or `right` (too large).
- In Container With Most Water, we discard the shorter wall because it cannot support a larger area with decreasing width.
- 3Sum sorts the array first, fixes one element, and runs Two Sum II on the remaining suffix, skipping duplicates at all three pointer positions.

---

## Cheat Sheet

### Decision Rules
| Problem Condition | Pointer Action | Why It Works |
| :--- | :--- | :--- |
| `sum < target` | `left++` | Array is sorted; all pairs with current `left` are too small |
| `sum > target` | `right--` | Array is sorted; all pairs with current `right` are too large |
| `height[L] < height[R]` | `left++` | `L` is the bottleneck; smaller widths cannot beat current area |
| `s[L] === s[R]` (Palindrome) | `left++, right--` | Outer characters match; check inner substring |

---

## Interview Questions

### 1. Deep Definitions and Mental Models
**Question:** Why does sorting an array before running Two Pointers take $O(n \log n)$ time, and why is this often preferable to an $O(n)$ hash map?
- **Expected answer shape:** Sorting dominates the runtime with $O(n \log n)$, whereas a hash map is $O(n)$. However, Two Pointers requires $O(1)$ auxiliary space compared to $O(n)$ space for a hash map. When memory is constrained or the data is already sorted, Two Pointers is strictly superior.

### 2. Predict the Output and Trace Execution
**Question:** What does this function return for `height = [1, 1]`?
```js
function maxArea(height) {
  let l = 0, r = height.length - 1, ans = 0;
  while (l < r) {
    ans = Math.max(ans, Math.min(height[l], height[r]) * (r - l));
    if (height[l] < height[r]) l++;
    else r--;
  }
  return ans;
}
```
- **Expected answer shape:** Returns `1`. Initial: `l = 0, r = 1`. `Width = 1 - 0 = 1`. `Height = min(1, 1) = 1`. `Area = 1 * 1 = 1`. `r` decrements to 0. Loop terminates (`l < r` is false).

### 3. Implementation Exercise
**Question:** Write `isPalindrome(s)` ignoring case and non-alphanumeric characters in $O(n)$ time and $O(1)$ space.
- **Expected answer shape:**
```js
function isPalindrome(s) {
  let l = 0, r = s.length - 1;
  const isAlphaNum = c => /[a-z0-9]/i.test(c);
  while (l < r) {
    while (l < r && !isAlphaNum(s[l])) l++;
    while (l < r && !isAlphaNum(s[r])) r--;
    if (s[l].toLowerCase() !== s[r].toLowerCase()) return false;
    l++;
    r--;
  }
  return true;
}
```

### 4. Debugging and Failure Analysis
**Question:** A candidate's 3Sum solution produces duplicate triplets like `[[-1, 0, 1], [-1, 0, 1]]`. Where is the bug?
- **Expected answer shape:** The candidate forgot duplicate pruning. After finding a triplet `nums[i] + nums[l] + nums[r] === 0`, both `l` and `r` must skip identical adjacent numbers: `while (l < r && nums[l] === nums[l+1]) l++` and `while (l < r && nums[r] === nums[r-1]) r--`, and the outer loop must skip `if (i > 0 && nums[i] === nums[i-1]) continue`.

### 5. Design and Tradeoff Questions
**Question:** Can Two Pointers be used to solve 4Sum? What is the resulting time complexity?
- **Expected answer shape:** Yes. 4Sum uses two nested loops for the first two elements ($O(n^2)$) and Two Pointers for the remaining two elements ($O(n)$), yielding $O(n^3)$ overall time and $O(1)$ space. In general, $K$-Sum on a sorted array runs in $O(n^{K-1})$ time.

### 6. Senior Follow-ups: V8 In-Place Operations
**Question:** Why does an $O(1)$ auxiliary space algorithm like Two Pointers avoid triggering Node.js garbage collection, and why does this matter for 99th percentile (p99) latency?
- **Expected answer shape:** Algorithms that allocate $O(n)$ objects or arrays (like hash maps) allocate memory on the V8 Young Generation heap, eventually triggering minor or major GC scavenges. GC pauses pause all execution on the Node.js event loop. Two-pointer algorithms only reassign primitive integer variables on the stack, generating zero heap allocations and ensuring flat, predictable p99 latency.

<nav aria-label="Lecture navigation">

[Previous: Sorting Deep Dive: Merge Sort and Quick Sort](day-10-merge-sort-and-quick-sort.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Same-Direction / Fast & Slow](day-12-two-pointers-fast-and-slow.md)

</nav>
