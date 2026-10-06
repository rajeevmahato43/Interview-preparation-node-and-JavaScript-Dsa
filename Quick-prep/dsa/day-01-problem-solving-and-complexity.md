# Day 1: Foundations, Arrays, Hashing, and Sorting

## Reasoning and complexity

**1. Clarify first**

Define input, output, size limits, duplicates, ordering, mutation, and edge cases before selecting an algorithm.

**2. Baseline and invariant**

Start with a correct brute-force method; an invariant states what remains true during optimization.

**3. Complexity**

Describe time and auxiliary-space growth separately; include output storage and recursion depth where relevant.

```text
Check every pair: O(n^2) time, O(1) extra space
Map lookup:       O(n) expected time, O(n) extra space
```

[More](../../DSA/dsa-lectures/day-01-big-o-and-problem-solving.md)

## Core collections and patterns

**1. Arrays and strings**

Arrays are ordered/indexed; strings are immutable. A single scan is often `O(n)`; pairwise comparisons can be `O(n^2)`.

**2. Maps and sets**

Use `Map` for counts/associated state and `Set` for membership; lookup/update is typically expected `O(1)`.

**3. Frequency and complement patterns**

Frequency maps count/group; complement lookup checks `target - value` among values already visited.

```js
const seen = new Set();
for (const value of values) {
	if (seen.has(target - value)) return true;
	seen.add(value);
}
```

**4. Sorting**

Sorting reveals order and can simplify scans; JS numeric arrays need `(a, b) => a - b`. Comparison sorting is typically `O(n log n)`.

[Arrays](../../DSA/dsa-lectures/day-02-arrays-objects-sets-maps.md) | [Strings](../../DSA/dsa-lectures/day-03-strings-and-text-patterns.md) | [Recursion](../../DSA/dsa-lectures/day-04-recursion-and-call-stack.md) | [Sort/search](../../DSA/dsa-lectures/day-05-sorting-and-searching-basics.md) | [Hashing](../../DSA/dsa-lectures/day-06-frequency-counting-and-hash-tables.md) | [Two Sum](../../DSA/dsa-lectures/day-07-two-sum-and-hash-complements.md) | [Anagrams](../../DSA/dsa-lectures/day-08-group-anagrams-and-frequency-vectors.md) | [Duplicates](../../DSA/dsa-lectures/day-09-duplicate-detection-and-intersections.md) | [Sorting algorithms](../../DSA/dsa-lectures/day-10-merge-sort-and-quick-sort.md)

## Tricky points

1. **Reasoning**

**1.1 Complexity**

Big O describes growth, not elapsed time; state expected versus worst-case assumptions.

**1.2 Correctness**

A fast solution without an invariant can mishandle duplicates or boundaries.

2. **JavaScript data**

**2.1 Sort**

Default `.sort()` is lexicographic and mutates the array.

**2.2 Strings**

Strings cannot be changed in place; Unicode characters may span multiple code units.

**2.3 Object keys**

`Map` object keys use identity, not structural equality.

3. **Hashing**

**3.1 Two Sum**

Check the complement before inserting current value when one element cannot be used twice.

**3.2 Space**

The lookup table is auxiliary `O(n)` space even when the input is not copied.