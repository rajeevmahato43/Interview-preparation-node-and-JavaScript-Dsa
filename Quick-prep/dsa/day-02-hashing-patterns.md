# Day 2: Two Pointers, Windows, Prefix Sums, and Linear Structures

Quick review of main-course lectures 11–20. Focuses on linear scan patterns, monotonic structures, and custom queues/stacks with concise JavaScript implementations.

## Pointers, windows, and range queries

**1. Opposing two pointers**

Initialize pointers at opposite ends of a sorted array; move `left++` or `right--` based on comparison with target. Discards entire rows of invalid pairs in $O(n)$ time.

```js
function twoSumSorted(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) return [left, right];
    if (sum < target) left++; else right--;
  }
  return [];
}
```

**2. Fast and slow pointers (Floyd's cycle detection)**

Advance `slow` by 1 step and `fast` by 2 steps. In a cycle, the distance between them decreases by 1 each step, guaranteeing collision in $O(n)$ time with $O(1)$ space.

```js
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}
```

**3. Fixed-size sliding window**

Calculate sum of the first $K$ items; slide the window by adding the incoming element at $i$ and subtracting the outgoing element at $i - K$. Avoids recomputing overlaps ($O(n)$).

```js
function maxSubarraySum(nums, k) {
  let sum = 0, max = -Infinity;
  for (let i = 0; i < nums.length; i++) {
    sum += nums[i];
    if (i >= k) sum -= nums[i - k];
    if (i >= k - 1) max = Math.max(max, sum);
  }
  return max;
}
```

**4. Variable-size sliding window**

Expand `right` to include elements; shrink `left` while a condition (e.g., uniqueness, budget) is violated. Invariant: each index enters and exits the window at most once ($O(n)$ amortized).

```js
function lengthOfLongestSubstring(s) {
  const seen = new Set();
  let left = 0, maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    while (seen.has(s[right])) seen.delete(s[left++]);
    seen.add(s[right]);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}
```

**5. Prefix sums and subarray sum equals K**

Precompute running totals: `rangeSum(L, R) = prefix[R + 1] - prefix[L]`. With negative numbers, maintain a map of seen prefix sums and their frequencies.

```js
function subarraySumEqualsK(nums, k) {
  const map = new Map([[0, 1]]);
  let count = 0, sum = 0;
  for (const x of nums) {
    sum += x;
    count += map.get(sum - k) ?? 0;
    map.set(sum, (map.get(sum) ?? 0) + 1);
  }
  return count;
}
```

[Opposing pointers](../../DSA/dsa-lectures/day-11-two-pointers-opposing.md) | [Fast and slow pointers](../../DSA/dsa-lectures/day-12-two-pointers-fast-and-slow.md) | [Fixed sliding window](../../DSA/dsa-lectures/day-13-sliding-window-fixed-size.md) | [Variable sliding window](../../DSA/dsa-lectures/day-14-sliding-window-variable-size.md) | [Prefix sums](../../DSA/dsa-lectures/day-15-prefix-sum-and-range-queries.md)

## Stacks, queues, and monotonic structures

**1. Stack fundamentals and bracket matching**

LIFO structure. Match opening brackets by pushing; on encountering a closing bracket, verify that `stack.pop()` corresponds to the expected pair.

```js
function isValid(s) {
  const stack = [], map = { ")": "(", "}": "{", "]": "[" };
  for (const ch of s) {
    if (!map[ch]) stack.push(ch);
    else if (stack.pop() !== map[ch]) return false;
  }
  return stack.length === 0;
}
```

**2. Monotonic stack (Next Greater Element)**

Maintains elements in strictly decreasing order. Pop when the current item exceeds the top of the stack, recording current as the next greater element for the popped index. Each index is pushed and popped at most once ($O(n)$ time).

```js
function nextGreaterElements(nums) {
  const res = new Array(nums.length).fill(-1);
  const stack = []; // stores indices
  for (let i = 0; i < nums.length; i++) {
    while (stack.length && nums[i] > nums[stack[stack.length - 1]]) {
      res[stack.pop()] = nums[i];
    }
    stack.push(i);
  }
  return res;
}
```

**3. Queue, circular buffer, and deque**

FIFO structure. JavaScript's `Array.prototype.shift()` is $O(n)$; high-throughput queues maintain a head index pointer or circular ring buffer with capacity $C$ to achieve true $O(1)$ dequeue.

```js
class FastQueue {
  constructor() { this.items = []; this.head = 0; }
  enqueue(val) { this.items.push(val); }
  dequeue() { return this.head < this.items.length ? this.items[this.head++] : undefined; }
  size() { return this.items.length - this.head; }
}
```

**4. Design patterns: MinStack and Queue via two stacks**

To maintain $O(1)$ operations with special constraints, pair primary storage with helper storage or amortize expensive transfers across operations.

```js
class MinStack {
  constructor() { this.stack = []; this.minStack = []; }
  push(val) {
    this.stack.push(val);
    const min = this.minStack.length === 0 ? val : Math.min(val, this.minStack[this.minStack.length - 1]);
    this.minStack.push(min);
  }
  pop() { this.minStack.pop(); return this.stack.pop(); }
  top() { return this.stack[this.stack.length - 1]; }
  getMin() { return this.minStack[this.minStack.length - 1]; }
}
```

[Stack fundamentals](../../DSA/dsa-lectures/day-16-stack-fundamentals-and-lifo.md) | [Parentheses and expressions](../../DSA/dsa-lectures/day-17-valid-parentheses-and-expressions.md) | [Monotonic stack](../../DSA/dsa-lectures/day-18-monotonic-stack-patterns.md) | [Queues and deques](../../DSA/dsa-lectures/day-19-queue-circular-queue-and-deque.md) | [Stack and queue design](../../DSA/dsa-lectures/day-20-stack-and-queue-design-patterns.md)

## Tricky points

1. **Two pointers and sliding windows**
   **1.1 Sorted prerequisite:** Opposing pointers require monotonic sorting; applying them directly on unsorted arrays yields false negatives.
   **1.2 Negative numbers in windows:** Variable sliding windows for target sums fail when numbers can be negative (window sum does not increase monotonically with expansion); use prefix sum with hash map instead.
   **1.3 Substring boundaries:** Length of substring between `left` and `right` inclusive is `right - left + 1`, not `right - left`.

2. **Stacks and queues**
   **2.1 `shift()` latency:** Calling `arr.shift()` in a BFS loop degrades total complexity to $O(n^2)$; use an index pointer or linked queue.
   **2.2 Monotonic stack duplicates:** Choosing between strict inequality (`>`) and non-strict (`>=`) determines whether equal elements trigger pops or stay on stack.
   **2.3 Amortized queue transfer:** In a two-stack queue, transfer from inbox to outbox *only* when the outbox is completely empty, preserving FIFO order.