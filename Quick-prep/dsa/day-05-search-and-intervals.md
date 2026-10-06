# Day 5: Heaps and Priority Queues

## Heap operations

**1. Binary heap**

A complete binary tree stored in an array; a min-heap keeps each parent no greater than its children.

```text
	  2          array: [2, 5, 7]
	 / \
	5   7
```

**2. Push, pop, peek**

Insert/removing the root restores heap order in `O(log n)`; reading the root is `O(1)`.

**3. Priority queue**

Repeatedly exposes the next min/max priority item; it does not keep the whole collection sorted.

[Representation](../../DSA/dsa-lectures/day-41-binary-heap-array-representation.md) | [Min/max heap](../../DSA/dsa-lectures/day-42-min-heap-and-max-heap-implementation.md)

## Common patterns

**1. Top K / kth value**

A size-K heap can avoid sorting all values when K is small relative to input; typical cost is `O(n log k)`.

**2. Streaming median**

A max-heap stores the lower half, a min-heap the upper half; their roots provide the middle value(s).

**3. Merge K lists and task scheduling**

A min-heap repeatedly selects the smallest current list head or next eligible task.

[Top K](../../DSA/dsa-lectures/day-43-top-k-elements-and-kth-largest.md) | [Median](../../DSA/dsa-lectures/day-44-two-heaps-median-from-stream.md) | [Merge/scheduling](../../DSA/dsa-lectures/day-45-merge-k-sorted-lists-and-task-scheduling.md)

## Tricky points

1. **Heap invariant**

**1.1 Order guarantee**

Only the root is globally min/max; the remaining array is not sorted.

**1.2 Indexes**

For zero-based arrays, children are `2*i + 1` and `2*i + 2`; parent is `floor((i - 1) / 2)`.

**1.3 Comparator**

Define whether smaller or larger values have higher priority and use it consistently.

2. **Pattern choice**

**2.1 Top K**

Heap size K gives `O(n log k)`; full sort may be simpler when K is near n.

**2.2 Median heaps**

Keep sizes within one item and every lower-half value no greater than every upper-half value.

**2.3 Duplicates**

Preserve item identity when equal priorities must remain distinct.