# Day 3: Recursion, Backtracking, Search, and Linked Lists

Quick review of main-course lectures 21–30. Covers decision-tree search spaces, binary search variants, monotonic predicates, and pointer manipulation in linked lists.

## Recursion, backtracking, and combinatorial search

**1. Backtracking template and decision trees**

Enumerate combinations by exploring choices down a branch, then backtracking (undoing state mutations) to preserve clean state for sibling branches.

```js
// Generic Backtracking Pattern:
function backtrack(start, path, res) {
  if (isSolution(path)) { res.push([...path]); return; }
  for (let i = start; i < candidates.length; i++) {
    if (isValid(candidates[i])) {
      path.push(candidates[i]);       // Choose
      backtrack(i + 1, path, res);    // Explore
      path.pop();                     // Unchoose (backtrack)
    }
  }
}
```

**2. Subsets and power sets**

Generate all $2^n$ subsets. At index $i$, choose whether to include `nums[i]` or recurse by advancing the starting pointer.

```js
function subsets(nums) {
  const result = [];
  function dfs(index, current) {
    result.push([...current]);
    for (let i = index; i < nums.length; i++) {
      current.push(nums[i]);
      dfs(i + 1, current);
      current.pop();
    }
  }
  dfs(0, []);
  return result;
}
```

**3. Permutations and combinations**

For combinations of size $K$, advance index `i + 1` to prevent reuse. For permutations ($n!$), scan all candidates and track visited indices using a `Set` or boolean array.

```js
function permute(nums) {
  const res = [];
  function dfs(curr, used) {
    if (curr.length === nums.length) { res.push([...curr]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used.has(i)) continue;
      used.add(i); curr.push(nums[i]);
      dfs(curr, used);
      curr.pop(); used.delete(i);
    }
  }
  dfs([], new Set());
  return res;
}
```

**4. Grid backtracking and pruning**

Search paths on a 2D matrix (e.g., Word Search). Temporarily mutate `grid[r][c] = '#'` to mark visited without extra memory, then restore on return. Prune branches immediately when out of bounds or characters mismatch.

[Recursion mechanics](../../DSA/dsa-lectures/day-21-recursion-mechanics-and-call-stack.md) | [Backtracking basics](../../DSA/dsa-lectures/day-22-backtracking-fundamentals.md) | [Subsets](../../DSA/dsa-lectures/day-23-subsets-and-power-sets.md) | [Combinations and permutations](../../DSA/dsa-lectures/day-24-combinations-and-permutations.md) | [Grid search and N-Queens](../../DSA/dsa-lectures/day-25-grid-backtracking-and-n-queens.md)

## Binary search and linked lists

**1. Binary search canonical bounds**

Requires a sorted array or monotonic condition. Calculate `mid = Math.floor(left + (right - left) / 2)` to eliminate half of the search range per iteration ($O(\log n)$).

```js
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor(left + (right - left) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
```

**2. Rotated sorted array search**

At least one half (`[left..mid]` or `[mid..right]`) is always strictly sorted. Identify the sorted half, determine if `target` falls inside its boundary, and discard the opposite half.

```js
function searchRotated(nums, target) {
  let l = 0, r = nums.length - 1;
  while (l <= r) {
    const mid = Math.floor((l + r) / 2);
    if (nums[mid] === target) return mid;
    if (nums[l] <= nums[mid]) { // Left half sorted
      if (nums[l] <= target && target < nums[mid]) r = mid - 1;
      else l = mid + 1;
    } else { // Right half sorted
      if (nums[mid] < target && target <= nums[r]) l = mid + 1;
      else r = mid - 1;
    }
  }
  return -1;
}
```

**3. Binary search on solution space**

When the answer satisfies a monotonic feasibility function `canAchieve(k)` (e.g., `false, false, true, true`), binary-search across the possible numerical answer range `[min, max]`.

```js
function minCapacity(weights, days) {
  let low = Math.max(...weights), high = weights.reduce((a, b) => a + b, 0);
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (canShip(weights, days, mid)) high = mid; // try smaller capacity
    else low = mid + 1;
  }
  return low;
}
```

**4. Linked list in-place reversal**

Iteratively reverse pointers using `prev`, `curr`, and `next` pointers in $O(n)$ time and $O(1)$ space. Always cache `curr.next` before overwriting.

```js
function reverseList(head) {
  let prev = null, curr = head;
  while (curr) {
    const nextNode = curr.next; // 1. Save next
    curr.next = prev;           // 2. Reverse pointer
    prev = curr;                // 3. Step forward
    curr = nextNode;
  }
  return prev; // new head
}
```

**5. Linked list middle and cycle entry point**

`fast` moves two steps, `slow` moves one. When `fast` reaches tail, `slow` is at the midpoint. For cycle entry: reset `slow = head` on collision; advance both by 1 step until they meet again at the entry node.

[Binary search intervals](../../DSA/dsa-lectures/day-26-binary-search-bounds-and-intervals.md) | [Rotated search](../../DSA/dsa-lectures/day-27-binary-search-rotated-arrays-and-peaks.md) | [Solution space search](../../DSA/dsa-lectures/day-28-binary-search-on-solution-space.md) | [Linked lists](../../DSA/dsa-lectures/day-29-singly-and-doubly-linked-lists.md) | [List pointer patterns](../../DSA/dsa-lectures/day-30-linked-list-fast-slow-and-reversals.md)

## Tricky points

1. **Backtracking and state**
   **1.1 Shallow copy mutation:** Pushing `path` directly (`res.push(path)`) stores references; by completion all entries become empty. Push a shallow snapshot `[...path]`.
   **1.2 Unchoosing order:** Revert global or board mutations in reverse order before returning from recursive frames.

2. **Binary search bounds**
   **2.1 Loop condition match:** Pair `left <= right` with `right = mid - 1` and `left = mid + 1`. Using `right = mid` with `left <= right` causes infinite loops when `left === right`.
   **2.2 Integer overflow:** In JavaScript, numbers are double-precision floats up to $2^{53} - 1$; use `Math.floor((left + right) / 2)` or `left + Math.floor((right - left) / 2)`.

3. **Linked lists**
   **3.1 Lost pointers:** Overwriting `curr.next` before preserving `curr.next` orphans the remainder of the linked list.
   **3.2 Dummy head:** When operations can delete or modify the head node, anchor traversal with `const dummy = new ListNode(0); dummy.next = head;` and return `dummy.next`.