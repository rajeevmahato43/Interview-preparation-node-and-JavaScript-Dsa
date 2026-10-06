# Day 2: Two Pointers, Windows, Prefix Sums, and Linear Structures

## Scan patterns

**1. Opposing pointers**

Move inward on sorted data when a monotonic rule proves discarded candidates cannot answer the question.

```js
while (left < right) {
	if (values[left] + values[right] === target) return true;
	if (values[left] + values[right] < target) left++;
	else right--;
}
```

**2. Fast and slow pointers**

Move pointers at different rates to find a midpoint or detect a cycle without storing every visited node.

**3. Sliding window**

Track a contiguous range; fixed windows shift by one, variable windows grow/shrink when the condition permits.

**4. Prefix sum**

Cumulative totals turn range sums into differences; prefix-frequency maps also work with negative values.

```text
prefix[i] = sum(values[0..i-1]); range(left,right) = prefix[right+1]-prefix[left]
```

[Two pointers](../../DSA/dsa-lectures/day-11-two-pointers-opposing.md) | [Fast/slow](../../DSA/dsa-lectures/day-12-two-pointers-fast-and-slow.md) | [Fixed window](../../DSA/dsa-lectures/day-13-sliding-window-fixed-size.md) | [Variable window](../../DSA/dsa-lectures/day-14-sliding-window-variable-size.md) | [Prefix sums](../../DSA/dsa-lectures/day-15-prefix-sum-and-range-queries.md)

## Stacks and queues

**1. Stack**

LIFO processes the newest item first; use it for nested syntax, undo, and expression parsing.

```js
const stack = [];
stack.push("(");
const open = stack.pop();
```

**2. Monotonic stack**

Keep values/indexes ordered to find next greater/smaller values; each index enters and leaves once, so the scan is `O(n)`.

**3. Queue and deque**

FIFO processes the oldest item first; use a head index/deque for large queues instead of repeated `shift()`.

**4. Circular queue and design choices**

A circular queue reuses fixed storage; select the structure based on required insertion/removal order.

[Stack](../../DSA/dsa-lectures/day-16-stack-fundamentals-and-lifo.md) | [Expressions](../../DSA/dsa-lectures/day-17-valid-parentheses-and-expressions.md) | [Monotonic stack](../../DSA/dsa-lectures/day-18-monotonic-stack-patterns.md) | [Queue/deque](../../DSA/dsa-lectures/day-19-queue-circular-queue-and-deque.md) | [Design patterns](../../DSA/dsa-lectures/day-20-stack-and-queue-design-patterns.md)

## Tricky points

1. **Pointer/window invariants**

**1.1 Sortedness**

Opposing pointers often need sorted input; sorting can destroy original index order.

**1.2 Negative values**

Sum windows are not generally monotone with negatives; use prefix sums when appropriate.

**1.3 Window boundaries**

Define whether both endpoints are included before updating state.

2. **Stack and queue**

**2.1 Equal values**

Choose `<` versus `<=` in a monotonic stack based on strictness of the requested comparison.

**2.2 Queue cost**

Repeated `Array.shift()` may move remaining elements; a head index avoids that pattern.

**2.3 Visited timing**

For BFS, mark a node visited when enqueueing to prevent duplicate queue entries.