# Day 1: Foundations, Arrays, Hashing, and Sorting

Quick review of main-course lectures 1–10. Each topic provides an interview-ready summary, invariants, and compact JavaScript examples. Follow the deep links for full implementations.

## Problem solving, Big-O, and linear memory

**1. Clarification and interview constraints**

Define input types, size bounds ($N \le 10^5$), duplicate handling, element ranges, mutation permissions, and edge cases (empty, single element) before proposing an algorithm.

**2. Asymptotic complexity**

Measure time growth and auxiliary space separately. Ignore constants; distinguish worst-case from amortized or expected complexity.

```text
O(1) < O(log n) < O(n) < O(n log n) < O(n^2) < O(2^n) < O(n!)
N <= 10^4 -> O(n^2) acceptable; N = 10^5..10^6 -> O(n) or O(n log n) required
```

**3. Arrays and indexed lookups**

Contiguous memory layout enables $O(1)$ random access by index; element insertions and deletions at arbitrary positions require $O(n)$ element shifting.

```js
const arr = [10, 20, 30];
arr[1];          // O(1) read -> 20
arr.push(40);    // O(1) amortized append
arr.unshift(5);  // O(n) shift: moves every item right
```

**4. Strings and immutability**

JavaScript strings are immutable UTF-16 sequences. Concatenation inside a loop creates temporary strings, causing $O(n^2)$ time; accumulate in an array and `.join("")` for $O(n)$.

```js
// Correct: O(n) string construction
const parts = [];
for (let i = 0; i < 5; i++) parts.push(i);
const result = parts.join("-"); // "0-1-2-3-4"
```

**5. Call stack and recursion foundations**

Every function call pushes a frame storing arguments and local bindings onto the call stack. A base case prevents stack overflow; recursion depth determines auxiliary space ($O(d)$).

```js
function factorial(n) {
  if (n <= 1) return 1; // base case
  return n * factorial(n - 1); // call stack grows to O(n) depth
}
```

[Big-O and problem solving](../../DSA/dsa-lectures/day-01-big-o-and-problem-solving.md) | [Arrays and collections](../../DSA/dsa-lectures/day-02-arrays-objects-sets-maps.md) | [Strings](../../DSA/dsa-lectures/day-03-strings-and-text-patterns.md) | [Recursion basics](../../DSA/dsa-lectures/day-04-recursion-and-call-stack.md)

## Hashing, frequencies, and sorting foundations

**1. Hash tables: `Map` and `Set`**

Provide expected $O(1)$ insertion, deletion, and lookup via hash codes; `Map` accepts any key type (preserving identity), while plain `{}` coerces keys to strings.

```js
const counts = new Map();
counts.set(10, (counts.get(10) ?? 0) + 1);
counts.has(10); // true (expected O(1))
```

**2. Two Sum and complement lookup**

Scan array once while probing a hash map for `target - current`. Invariant: check the map before inserting the current value to prevent self-pairing.

```js
function twoSum(nums, target) {
  const seen = new Map(); // value -> index
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) return [seen.get(complement), i];
    seen.set(nums[i], i);
  }
  return [];
}
```

**3. Frequency counters and anagram grouping**

Group items by canonical signature. For anagrams, use sorted characters ($O(k \log k)$) or a 26-element character count vector ($O(k)$) as the hash key.

```js
function groupAnagrams(words) {
  const groups = new Map();
  for (const w of words) {
    const key = w.split("").sort().join("");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(w);
  }
  return Array.from(groups.values());
}
```

**4. Duplicate detection and set intersections**

Use a `Set` to track visited values for $O(n)$ duplicate checks. For two arrays, populate a set with the smaller array and filter the larger for $O(m + n)$ time and $O(\min(m, n))$ space.

```js
const hasDuplicates = (arr) => new Set(arr).size !== arr.length;
const intersect = (a, b) => {
  const setA = new Set(a);
  return b.filter(x => setA.has(x));
};
```

**5. Sorting fundamentals: Merge Sort vs Quick Sort**

JavaScript's `Array.prototype.sort()` sorts lexicographically by default unless passed a comparator `(a, b) => a - b`. Merge sort guarantees stable $O(n \log n)$ time with $O(n)$ space; Quick sort runs $O(n \log n)$ expected time in-place ($O(\log n)$ call stack) but degrades to $O(n^2)$ if pivots are poorly chosen.

```js
// Correct numeric sort
[10, 5, 40, 25].sort((a, b) => a - b); // [5, 10, 25, 40]

// Merge sort core pattern
function merge(left, right) {
  const res = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    res.push(left[i] <= right[j] ? left[i++] : right[j++]);
  }
  return res.concat(left.slice(i)).concat(right.slice(j));
}
```

[Sorting and searching basics](../../DSA/dsa-lectures/day-05-sorting-and-searching-basics.md) | [Frequency counting](../../DSA/dsa-lectures/day-06-frequency-counting-and-hash-tables.md) | [Two Sum](../../DSA/dsa-lectures/day-07-two-sum-and-hash-complements.md) | [Group anagrams](../../DSA/dsa-lectures/day-08-group-anagrams-and-frequency-vectors.md) | [Duplicates and intersections](../../DSA/dsa-lectures/day-09-duplicate-detection-and-intersections.md) | [Merge and Quick Sort](../../DSA/dsa-lectures/day-10-merge-sort-and-quick-sort.md)

## Tricky points

1. **Complexity and space**
   **1.1 Output storage:** Returning a new array of size $N$ is required output, not auxiliary space; distinguish auxiliary working memory from output return storage.
   **1.2 Recursion stack:** Recursive algorithms consume $O(d)$ auxiliary stack memory even if no arrays or objects are allocated.

2. **JavaScript collections**
   **2.1 Numeric sorting:** `[10, 2, 5].sort()` produces `[10, 2, 5]` because strings are compared; always pass `(a, b) => a - b`.
   **2.2 In-place mutation:** `.sort()` and `.reverse()` mutate the array in place; use `.slice().sort(...)` or `.toSorted(...)` if immutability is required.
   **2.3 Object keys:** Plain object keys coerce numbers to strings (`{ 1: "a" }` has key `"1"`), whereas `Map` preserves numeric and object reference identity.

3. **Hashing invariants**
   **3.1 Lookup before insert:** In complement-searching (Two Sum), inserting before checking causes an element to match with itself if `target === 2 * val`.
   **3.2 Hash collisions:** Object/Map operations run expected $O(1)$, but worst-case degraded hash chains can reach $O(n)$ if keys collide maliciously.