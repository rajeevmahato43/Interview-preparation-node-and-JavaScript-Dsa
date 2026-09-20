# DSA Roadmap for JavaScript

A calm, practical, beginner-to-advanced roadmap for JavaScript developers who want to learn Data Structures and Algorithms for Node.js backend work and interview preparation.

## Recommended pace

- 12 weeks for a strong foundation
- 1.5 to 2.5 hours per day, 5 days per week
- Learn patterns instead of memorizing random algorithms
- For a shorter schedule, complete Weeks 1-6 first and then revise the core patterns

## Roadmap overview

### What to learn first

1. Big O notation and problem-solving habits
2. Arrays, objects, sets, and maps
3. Strings
4. Recursion and call-stack behavior
5. Sorting and searching
6. Hashing, two pointers, sliding window, prefix sum, stack, and queue
7. Binary search, linked lists, trees, graphs, and heaps
8. Dynamic programming, greedy algorithms, tries, and union find

### Why this order matters

DSA is not about knowing a giant list of algorithms. It is about noticing patterns in problems.

- Checking duplicates usually suggests a `Set` or hash map.
- Finding a range inside a sequence may suggest a sliding window or prefix sum.
- Searching ordered data may suggest binary search.
- Processing the newest or oldest item first may suggest a stack or queue.
- Exploring connected data may suggest graph traversal.
- Finding the best result with repeated smaller choices may suggest dynamic programming or greedy reasoning.

### How to study every problem

1. Restate the problem.
2. Clarify inputs, outputs, constraints, and edge cases.
3. Write a brute-force baseline.
4. Look for a pattern or useful data structure.
5. Describe the algorithm in simple words.
6. State time complexity, auxiliary space, and recursion depth where relevant.
7. Implement in JavaScript.
8. Test empty input, duplicates, extremes, and ordinary examples.
9. Compare trade-offs and follow-up variations.

### JavaScript structures to know

- Arrays for ordered sequences
- Objects for simple string-keyed lookup
- `Map` for explicit key-value storage and flexible keys
- `Set` for uniqueness and membership checks
- Arrays as stacks
- Arrays or linked structures as queues
- Plain objects or classes for linked lists and trees
- Arrays for heaps, prefix tables, and union-find parents

# Phase 1: Beginner Foundation

## 1. Big O Notation and Problem-Solving Mindset

- **Why it matters:** Helps compare solutions and avoid code that becomes slow as input grows.
- **JavaScript relevance:** Applies to loops, nested loops, array methods, lookups, and backend data processing.
- **Real-life use case:** Checking duplicates in a large API response or filtering a large user list.
- **Practice:** Analyze nested loops, compare `O(n)` with `O(n^2)`, and estimate search costs.
- **Lecture:** [Day 01: Big O and Problem Solving](dsa-lectures/day-01-big-o-and-problem-solving.md)

## 2. Arrays, Objects, Sets, and Maps

- **Why it matters:** These are the most common JavaScript data structures.
- **JavaScript relevance:** Choose based on order, lookup, uniqueness, key type, and mutation needs.
- **Real-life use case:** User caches, deduplicating products, request counters, and rate-limit state.
- **Practice:** Remove duplicates, count frequencies, merge maps, and compare object lookup with `Map` lookup.
- **Lecture:** [Day 02: Arrays, Objects, Sets, and Maps](dsa-lectures/day-02-arrays-objects-sets-maps.md)

## 3. Strings and Common Patterns

- **Why it matters:** Many interview problems are scans, comparisons, counts, or transformations of strings.
- **JavaScript relevance:** Strings are immutable; use a new string or an array when you need to build or change characters.
- **Real-life use case:** URL parsing, validation, search suggestions, and log processing.
- **Practice:** Reverse a string, check a palindrome, find the first non-repeating character, and check anagrams.
- **Lecture:** [Day 03: Strings and Text Patterns](dsa-lectures/day-03-strings-and-text-patterns.md)

## 4. Recursion and Function Call Stack

- **Why it matters:** Recursion is useful for trees, backtracking, and divide-and-conquer problems.
- **JavaScript relevance:** Every recursive call uses call-stack space; deep recursion can cause stack overflow.
- **Real-life use case:** File-tree traversal, nested data parsing, and dependency processing.
- **Practice:** Factorial, Fibonacci, nested-array sum, and recursive tree traversal.
- **Lecture:** [Day 04: Recursion and Call Stack](dsa-lectures/day-04-recursion-and-call-stack.md)

## 5. Sorting and Searching Basics

- **Why it matters:** Ordered data enables faster search and simplifies many later patterns.
- **JavaScript relevance:** `Array.prototype.sort()` needs a numeric comparator for numbers and mutates the array unless copied first.
- **Real-life use case:** Sorting products, ordering logs, and searching ordered metadata.
- **Practice:** Linear search, binary search, object sorting, and minimum/maximum scans.
- **Lecture:** [Day 05: Sorting and Searching Basics](dsa-lectures/day-05-sorting-and-searching-basics.md)

# Phase 2: Core Patterns

## Pattern 1: Array and String Scanning

- **When to use it:** Scan, filter, compare, transform, or normalize data.
- **Common problems:** Two sum, anagram check, palindrome, longest common prefix, and duplicate removal.
- **Real-life use case:** API validation, search processing, and data normalization.
- **JavaScript mapping:** Arrays, strings, loops, `Set`, and frequency tables.
- **Typical complexity:** `O(n)` for one pass; `O(n^2)` for checking every pair without extra structure.
- **Lectures:** [Day 07: Two Sum and Hash Map Complements](dsa-lectures/day-07-two-sum-and-hash-complements.md), [Day 09: Duplicate Detection and Array Intersections](dsa-lectures/day-09-duplicate-detection-and-intersections.md)

## Pattern 2: Hashing and Frequency Counting

- **When to use it:** Fast lookup, counting, grouping, or duplicate detection.
- **Common problems:** Top-frequency values, group anagrams, first repeated character, and overlap counting.
- **Real-life use case:** Rate limiting, cache checks, duplicate orders, and user-action counters.
- **JavaScript mapping:** `Map`, `Set`, and object-based frequency tables.
- **Typical complexity:** Usually `O(n)` average time and `O(n)` extra space.
- **Lectures:** [Day 06: Frequency Counting and Hash Tables](dsa-lectures/day-06-frequency-counting-and-hash-tables.md), [Day 08: Group Anagrams and Frequency Vectors](dsa-lectures/day-08-group-anagrams-and-frequency-vectors.md)

## Pattern 3: Two Pointers

- **When to use it:** Two ends or two moving positions can reduce repeated pair checks.
- **Common problems:** Sorted pair sum, palindrome, partitioning, and removing duplicates from sorted data.
- **Real-life use case:** Comparing sorted data sets or scanning a sequence with two boundaries.
- **JavaScript mapping:** Array indexes and string indexes.
- **Typical complexity:** Often `O(n)` when each pointer only moves forward or inward.
- **Lectures:** [Day 11: Two Pointers: Opposing Pointers](dsa-lectures/day-11-two-pointers-opposing.md), [Day 12: Two Pointers: Same-Direction / Fast & Slow](dsa-lectures/day-12-two-pointers-fast-and-slow.md)

## Pattern 4: Sliding Window

- **When to use it:** The problem asks about a contiguous subarray or substring with a changing condition.
- **Common problems:** Longest substring without repeats, maximum fixed-window sum, and at-most-k constraints.
- **Real-life use case:** Rate-limit windows, active sessions, log analysis, and moving metrics.
- **JavaScript mapping:** Left and right indexes plus a sum, count, or frequency map.
- **Typical complexity:** Usually `O(n)` because each boundary moves forward.
- **Lectures:** [Day 13: Sliding Window: Fixed Size](dsa-lectures/day-13-sliding-window-fixed-size.md), [Day 14: Sliding Window: Variable Size](dsa-lectures/day-14-sliding-window-variable-size.md)

## Pattern 5: Prefix Sum

- **When to use it:** Repeated range totals or cumulative values are needed.
- **Common problems:** Range sum, subarray sum equals target, and equilibrium index.
- **Real-life use case:** Analytics totals, inventory movement, and time-based metrics.
- **JavaScript mapping:** A prefix array beginning with a leading zero.
- **Typical complexity:** `O(n)` preprocessing and often `O(1)` per range query.
- **Lecture:** [Day 15: Prefix Sum and Cumulative Totals](dsa-lectures/day-15-prefix-sum-and-range-queries.md)

## Pattern 6: Stack and Queue

- **When to use it:** The order of processing matters.
- **Common problems:** Valid parentheses, next greater element, task processing, and history navigation.
- **Real-life use case:** Undo history, browser back navigation, job queues, and request processing.
- **JavaScript mapping:** Arrays with `push`/`pop` for stacks; a head index or linked structure for efficient queues.
- **Typical complexity:** `O(1)` per operation when implemented with suitable ends and indexes.
- **Lectures:** [Day 16: Stack Fundamentals and LIFO Architecture](dsa-lectures/day-16-stack-fundamentals-and-lifo.md), [Day 18: Monotonic Stack Patterns](dsa-lectures/day-18-monotonic-stack-patterns.md), [Day 19: Queue Fundamentals, Circular Queues, and Deque](dsa-lectures/day-19-queue-circular-queue-and-deque.md)

## Pattern 7: Recursion and Backtracking

- **When to use it:** Explore combinations, arrangements, paths, or multiple decisions.
- **Common problems:** Subsets, permutations, combinations, N-Queens, and maze paths.
- **Real-life use case:** Configuration search, route alternatives, and dependency choices.
- **JavaScript mapping:** Recursive functions, arrays for the current path, and explicit undo operations.
- **Typical complexity:** Often exponential, so input limits matter.
- **Lectures:** [Day 21: Recursion Mechanics and Call Stack](dsa-lectures/day-21-recursion-mechanics-and-call-stack.md), [Day 22: Backtracking Core: Decision State, Choices, and Undo](dsa-lectures/day-22-backtracking-fundamentals.md), [Day 23: Subsets and Power Sets](dsa-lectures/day-23-subsets-and-power-sets.md)

## Pattern 8: Binary Search

- **When to use it:** The search domain is sorted or has a monotonic true/false condition.
- **Common problems:** Rotated arrays, first or last position, insert position, and minimum feasible value.
- **Real-life use case:** Ordered logs, sorted catalogs, and range-based lookup.
- **JavaScript mapping:** `left`, `right`, and `mid` indexes with carefully defined boundaries.
- **Typical complexity:** `O(log n)` for a halved search range.
- **Lectures:** [Day 26: Binary Search Bounds and Intervals](dsa-lectures/day-26-binary-search-bounds-and-intervals.md), [Day 27: Binary Search on Rotated Arrays and Peaks](dsa-lectures/day-27-binary-search-rotated-arrays-and-peaks.md), [Day 28: Binary Search on Solution Space](dsa-lectures/day-28-binary-search-on-solution-space.md)

## Pattern 9: Linked Lists

- **When to use it:** The sequence is pointer-based and nodes must be inserted, removed, or reversed.
- **Common problems:** Reverse list, merge sorted lists, detect cycle, and remove the nth node from the end.
- **Real-life use case:** Linked task chains and low-level queue or event structures.
- **JavaScript mapping:** Objects or classes with a `next` property.
- **Typical complexity:** Usually `O(n)` for traversal and pointer operations.
- **Lectures:** [Day 29: Singly and Doubly Linked Lists](dsa-lectures/day-29-singly-and-doubly-linked-lists.md), [Day 30: Linked List Fast & Slow Pointers and Reversals](dsa-lectures/day-30-linked-list-fast-slow-and-reversals.md)

## Pattern 10: Tree Traversal

- **When to use it:** Data is hierarchical and contains parent-child relationships.
- **Common problems:** DFS, BFS, tree height, level order, invert tree, and subtree checks.
- **Real-life use case:** File systems, permission hierarchies, categories, and nested configuration.
- **JavaScript mapping:** Objects with `left`/`right` or `children` properties.
- **Typical complexity:** `O(n)` to visit every node.
- **Lectures:** [Day 31: Binary Tree Fundamentals and Recursive DFS](dsa-lectures/day-31-binary-tree-fundamentals-and-dfs.md), [Day 32: Level-Order Traversal (BFS) and Tree Views](dsa-lectures/day-32-level-order-traversal-bfs-and-views.md)

## Pattern 11: Binary Search Trees

- **When to use it:** A tree maintains an ordering relationship between left and right subtrees.
- **Common problems:** Search, insert, validate, minimum/maximum, and sorted traversal.
- **Real-life use case:** Ordered in-memory data and range-oriented structures.
- **JavaScript mapping:** Tree nodes with ordered `left` and `right` references.
- **Typical complexity:** `O(log n)` when balanced; `O(n)` when skewed.
- **Lecture:** [Day 34: Binary Search Trees: CRUD and Validation](dsa-lectures/day-34-binary-search-trees-crud-and-validation.md)

## Pattern 12: Graph Traversal

- **When to use it:** Data is connected rather than simply nested or linear.
- **Common problems:** BFS, DFS, shortest path in an unweighted graph, cycles, and components.
- **Real-life use case:** Routes, dependencies, recommendations, social graphs, and crawlers.
- **JavaScript mapping:** Adjacency lists with arrays, objects, or `Map`.
- **Typical complexity:** `O(V + E)` with an adjacency-list traversal.
- **Lectures:** [Day 36: Graph Representations and Modeling](dsa-lectures/day-36-graph-representations-and-modeling.md), [Day 37: Graph Traversal: BFS and Shortest Path](dsa-lectures/day-37-graph-traversal-bfs-and-shortest-path.md), [Day 38: Graph Traversal: DFS and Connected Components](dsa-lectures/day-38-graph-traversal-dfs-and-components.md)

# Phase 3: Advanced Patterns

## Pattern 13: Heap and Priority Queue

- **When to use it:** Repeatedly need the smallest, largest, or highest-priority item.
- **Common problems:** Top K values, merge K sorted lists, scheduling, and running median.
- **Real-life use case:** Job priorities, task scheduling, search ranking, and stream processing.
- **JavaScript mapping:** A custom heap stored in an array.
- **Typical complexity:** `O(log n)` for insertion and removal; `O(1)` to inspect the root.
- **Lectures:** [Day 41: Binary Heap Array Representation](dsa-lectures/day-41-binary-heap-array-representation.md), [Day 42: Min-Heap and Max-Heap Implementation](dsa-lectures/day-42-min-heap-and-max-heap-implementation.md), [Day 43: Top K Elements and Kth Largest](dsa-lectures/day-43-top-k-elements-and-kth-largest.md)

## Pattern 14: Dynamic Programming

- **When to use it:** The problem has overlapping subproblems and optimal substructure.
- **Common problems:** Fibonacci, climbing stairs, coin change, knapsack, and longest increasing subsequence.
- **Real-life use case:** Resource allocation, route cost, caching, and repeated calculations.
- **JavaScript mapping:** Arrays or `Map` for memoization and tabulation.
- **Typical complexity:** Often polynomial instead of exponential, depending on the state dimensions.
- **Lectures:** [Day 46: Dynamic Programming Foundations: Memoization and Tabulation](dsa-lectures/day-46-dynamic-programming-memo-and-tabulation.md), [Day 47: 1D Dynamic Programming: House Robber and Coin Change](dsa-lectures/day-47-1d-dp-house-robber-and-coin-change.md), [Day 50: 2D Dynamic Programming: Longest Common Subsequence and Knapsack](dsa-lectures/day-50-2d-dp-longest-common-subsequence-knapsack.md)

## Pattern 15: Greedy Algorithms

- **When to use it:** A locally best choice can be proved to produce a globally valid result.
- **Common problems:** Activity selection, interval scheduling, gas station, and minimum coverage.
- **Real-life use case:** Scheduling, task prioritization, and routing heuristics.
- **JavaScript mapping:** Often sort first, then make one-pass local decisions.
- **Typical complexity:** Frequently `O(n log n)` because of sorting.
- **Lectures:** [Day 51: Greedy Choices and Interval Scheduling](dsa-lectures/day-51-greedy-interval-scheduling.md), [Day 52: Greedy Traversal: Jump Game and Gas Station](dsa-lectures/day-52-greedy-traversal-jump-game-gas-station.md)

## Pattern 16: Trie

- **When to use it:** The problem is about prefixes or dictionary-style lookup.
- **Common problems:** Autocomplete, prefix matching, word search, and spell suggestions.
- **Real-life use case:** Search suggestions, spell checking, and prefix-based routing.
- **JavaScript mapping:** Nested objects or `Map` instances for child characters.
- **Typical complexity:** `O(k)` for a word of length `k`, plus output cost for suggestions.
- **Lecture:** [Day 53: Trie Construction and Prefix Search](dsa-lectures/day-53-trie-construction-and-prefix-search.md)

## Pattern 17: Union Find / Disjoint Set

- **When to use it:** Items are repeatedly merged into connected groups.
- **Common problems:** Connected components, redundant connections, and Kruskal's algorithm.
- **Real-life use case:** Network membership, dependency clusters, and connected systems.
- **JavaScript mapping:** Parent and rank arrays with path compression.
- **Typical complexity:** Near-constant amortized time with path compression and union by rank.
- **Lectures:** [Day 54: Disjoint Set Union (Union-Find)](dsa-lectures/day-54-union-find-disjoint-set-union.md), [Day 55: Union-Find Applications in Graphs](dsa-lectures/day-55-union-find-graph-applications.md)

# Pattern Recognition Cheat Sheet

| Pattern | Best for | Common clues | Typical solution |
| --- | --- | --- | --- |
| Arrays and strings | Scanning and transformation | contains, matches, duplicate, anagram | Loop, map, set |
| Hashing | Lookup, counting, grouping | frequency, duplicate, group by | `Map`, `Set`, frequency table |
| Two pointers | Ordered or two-ended data | pair, sum, palindrome | Left/right indexes |
| Sliding window | Contiguous ranges | longest, shortest, at most, exactly `k` | Maintain a moving range |
| Prefix sum | Repeated range totals | sum from `i` to `j`, cumulative | Running totals |
| Stack | Reverse or nested order | parentheses, undo, next greater | Push/pop |
| Queue | FIFO processing | first in, process order, level | Enqueue/dequeue |
| Recursion | Hierarchy and search choices | tree, paths, all combinations | Recursive state |
| Binary search | Ordered or monotonic data | sorted, first, last, minimum feasible | Halve the search range |
| Linked list | Pointer-based sequence edits | next, reverse, remove | Pointer reassignment |
| Tree traversal | Hierarchical data | root, child, depth, level | DFS or BFS |
| Graph traversal | Connected data | network, route, dependency | DFS/BFS plus visited set |
| Heap | Repeated min/max selection | top `k`, priority, smallest | Heap |
| Dynamic programming | Repeated optimization states | minimum, maximum, count ways | Memoization or table |
| Greedy | Safe local choices | schedule, maximize, minimum cost | Sort and choose |
| Trie | Prefix lookup | prefix, autocomplete, dictionary | Character tree |
| Union find | Connected groups | merge, component, connectivity | Parent and rank |

## Quick memory rules

- Order matters: consider a stack or queue.
- Duplicates or counts matter: consider a hash map or set.
- A contiguous range matters: consider sliding window or prefix sum.
- Data is sorted: consider binary search or two pointers.
- Many choices or paths exist: consider recursion or backtracking.
- Repeated optimization states exist: consider dynamic programming.
- A local choice can be proved safe: consider greedy.
- Connections matter: consider graph traversal or union find.

# 12-Week Learning Plan (60 Study Days)

Paced at 5 study days per week for 12 weeks (totaling 60 structured units), bridging from fundamental data structures to advanced algorithms and live interview readiness.

---

## Week 1: Foundations (Days 01–05)

**Focus:** Asymptotic analysis, JavaScript runtime storage, arrays, objects, sets, maps, strings, and call stack behavior.

- **Lectures:**
  - [Day 01: Big O and Problem Solving](dsa-lectures/day-01-big-o-and-problem-solving.md) — Big O notation, growth orders, constant dropping, Node.js event loop blocking.
  - [Day 02: Arrays, Objects, Sets, and Maps](dsa-lectures/day-02-arrays-objects-sets-maps.md) — V8 continuous vs holey arrays, fast key lookups, Set operations, Map vs Object.
  - [Day 03: Strings and Text Patterns](dsa-lectures/day-03-strings-and-text-patterns.md) — String immutability, code points vs code units, anagram checks, palindrome validation.
  - [Day 04: Recursion and Call Stack](dsa-lectures/day-04-recursion-and-call-stack.md) — Call stack frames, maximum recursion limits in Node.js, base conditions.
  - [Day 05: Sorting and Searching Basics](dsa-lectures/day-05-sorting-and-searching-basics.md) — Linear scan, binary search baseline, `Array.prototype.sort()` comparator quirks.
- **Practice:** 1 basic data manipulation exercise daily; measure time & space complexity.
- **Weekly Build:** Word-frequency counter, array deduplication utility, and palindrome checker.

---

## Week 2: Arrays and Hash Patterns (Days 06–10)

**Focus:** Frequency counting, complement lookups, anagram grouping, array intersections, and divide-and-conquer sorting.

- **Lectures:**
  - [Day 06: Frequency Counting and Hash Tables](dsa-lectures/day-06-frequency-counting-and-hash-tables.md) — Frequency map pattern, Map vs Object benchmarking, character vectors.
  - [Day 07: Two Sum and Hash Map Complements](dsa-lectures/day-07-two-sum-and-hash-complements.md) — Complements lookup pattern, single-pass hash map, handling duplicates.
  - [Day 08: Group Anagrams and Frequency Vectors](dsa-lectures/day-08-group-anagrams-and-frequency-vectors.md) — Grouping anagrams, sorted string keys vs prime/frequency keys.
  - [Day 09: Duplicate Detection and Array Intersections](dsa-lectures/day-09-duplicate-detection-and-intersections.md) — Set membership, array intersections, duplicate within k distance.
  - [Day 10: Sorting Deep Dive: Merge Sort and Quick Sort](dsa-lectures/day-10-merge-sort-and-quick-sort.md) — Divide-and-conquer, recursion depth, in-place Lomuto/Hoare partitioning vs extra array allocations in V8.
- **Practice:** 5 array problems, 5 frequency map exercises, and recursive trace diagrams.
- **Weekly Build:** User-activity counter, duplicate-product detector, and in-memory product lookup index.

---

## Week 3: Two Pointers, Sliding Window, and Prefix Sum (Days 11–15)

**Focus:** Opposing pointers, same-direction fast/slow pointers, fixed and variable sliding windows, and cumulative prefix arrays.

- **Lectures:**
  - [Day 11: Two Pointers: Opposing Pointers](dsa-lectures/day-11-two-pointers-opposing.md) — Two-end convergence, Two Sum II (Sorted), 3Sum, Valid Palindrome with character skips.
  - [Day 12: Two Pointers: Same-Direction / Fast & Slow](dsa-lectures/day-12-two-pointers-fast-and-slow.md) — In-place array deduplication, Move Zeroes, Container With Most Water.
  - [Day 13: Sliding Window: Fixed Size](dsa-lectures/day-13-sliding-window-fixed-size.md) — Fixed window sliding, Maximum Sum Subarray of Size K, First negative integer in window.
  - [Day 14: Sliding Window: Variable Size](dsa-lectures/day-14-sliding-window-variable-size.md) — Expand/contract window invariant, Longest Substring Without Repeating Characters, Minimum Window Substring.
  - [Day 15: Prefix Sum and Cumulative Totals](dsa-lectures/day-15-prefix-sum-and-range-queries.md) — Prefix sum with 0-index offset, Range Sum Query, Subarray Sum Equals K (Prefix Sum + Map).
- **Practice:** 1 window/prefix problem daily; written comparison of brute force vs optimized window.
- **Weekly Build:** Sliding window rate-limiter simulation, largest session window tracker, and moving-average calculator.

---

## Week 4: Stack and Queue (Days 16–20)

**Focus:** LIFO and FIFO ordering, bracket matching, monotonic stack, circular buffer, deque, and custom container design.

- **Lectures:**
  - [Day 16: Stack Fundamentals and LIFO Architecture](dsa-lectures/day-16-stack-fundamentals-and-lifo.md) — Stack mechanics, array vs linked list stack, call stack simulation.
  - [Day 17: Valid Parentheses and Expression Parsing](dsa-lectures/day-17-valid-parentheses-and-expressions.md) — Bracket matching, nested bracket evaluation, Reverse Polish Notation.
  - [Day 18: Monotonic Stack Patterns](dsa-lectures/day-18-monotonic-stack-patterns.md) — Monotonic increasing/decreasing stack, Next Greater Element, Daily Temperatures.
  - [Day 19: Queue Fundamentals, Circular Queues, and Deque](dsa-lectures/day-19-queue-circular-queue-and-deque.md) — Array `shift()` $O(n)$ hazard vs circular buffer / pointer queue, Deque implementation.
  - [Day 20: Stack and Queue Design Patterns](dsa-lectures/day-20-stack-and-queue-design-patterns.md) — Min Stack ($O(1)$ extra metadata), Implement Queue using Stacks, Moving Average from Data Stream.
- **Practice:** 5 stack problems, 3 queue problems, and 2 stateful data-structure designs.
- **Weekly Build:** Browser-history simulation, asynchronous task queue, and undo/redo state manager.

---

## Week 5: Recursion and Backtracking (Days 21–25)

**Focus:** Call stack limits, decision tree state exploration, subset generation, permutations, combinations, and 2D grid backtracking.

- **Lectures:**
  - [Day 21: Recursion Mechanics and Call Stack](dsa-lectures/day-21-recursion-mechanics-and-call-stack.md) — Recursion tree visualization, auxiliary stack depth, tail recursion vs loop unrolling.
  - [Day 22: Backtracking Core: Decision State, Choices, and Undo](dsa-lectures/day-22-backtracking-fundamentals.md) — Choose-explore-unchoose blueprint, state cloning vs in-place mutation and rollback.
  - [Day 23: Subsets and Power Sets](dsa-lectures/day-23-subsets-and-power-sets.md) — Generating all subsets (Subsets I), handling duplicates via sorting and index skips (Subsets II).
  - [Day 24: Combinations and Permutations](dsa-lectures/day-24-combinations-and-permutations.md) — Combination Sum I & II, Permutations I & II, early branch pruning.
  - [Day 25: Grid Backtracking: Word Search, Maze Paths, and N-Queens](dsa-lectures/day-25-grid-backtracking-and-n-queens.md) — 2D grid boundaries, in-place cell marking, constraint satisfaction.
- **Practice:** 5 recursion and 5 backtracking problems; track call-stack depth on paper.
- **Weekly Build:** File-system tree traversal, role-based permission tree checker, and configuration combination generator.

---

## Week 6: Binary Search and Linked Lists (Days 26–30)

**Focus:** Binary search boundary conditions, search on answer space, singly/doubly linked lists, cycle detection, and list reordering.

- **Lectures:**
  - [Day 26: Binary Search Bounds and Intervals](dsa-lectures/day-26-binary-search-bounds-and-intervals.md) — Exact match, off-by-one avoidance (`left <= right` vs `left < right`), `lower_bound` / `upper_bound`.
  - [Day 27: Binary Search on Rotated Arrays and Peaks](dsa-lectures/day-27-binary-search-rotated-arrays-and-peaks.md) — Search in Rotated Sorted Array, Find Minimum in Rotated Sorted Array, Find Peak Element.
  - [Day 28: Binary Search on Solution Space](dsa-lectures/day-28-binary-search-on-solution-space.md) — Monotonic feasibility predicates, Capacity To Ship Packages Within D Days, Koko Eating Bananas.
  - [Day 29: Singly and Doubly Linked Lists](dsa-lectures/day-29-singly-and-doubly-linked-lists.md) — Pointer manipulation, dummy head pattern, in-place list reversal, remove Nth node from end.
  - [Day 30: Linked List Fast & Slow Pointers and Reversals](dsa-lectures/day-30-linked-list-fast-slow-and-reversals.md) — Floyd's cycle detection (Tortoise and Hare), Palindrome Linked List, Reorder List, Merge Two Sorted Lists.
- **Practice:** 5 binary search problems and 4 linked list manipulation exercises.
- **Weekly Build:** Sorted product binary search catalog, linked task chain, and LRU linked structure baseline.

---

## Week 7: Trees and Binary Search Trees (Days 31–35)

**Focus:** Hierarchical structures, recursive DFS, level-order BFS, tree properties, BST invariant, and LCA.

- **Lectures:**
  - [Day 31: Binary Tree Fundamentals and Recursive DFS](dsa-lectures/day-31-binary-tree-fundamentals-and-dfs.md) — Tree node representation, Pre-order, In-order, Post-order, call-stack space $O(h)$.
  - [Day 32: Level-Order Traversal (BFS) and Tree Views](dsa-lectures/day-32-level-order-traversal-bfs-and-views.md) — Queue-based BFS, level-by-level batching, Zigzag order, Right side view of binary tree.
  - [Day 33: Tree Depth, Diameter, and Path Sums](dsa-lectures/day-33-tree-depth-diameter-and-path-sums.md) — Maximum Depth, Balanced Tree check, Diameter of Binary Tree, Binary Tree Maximum Path Sum.
  - [Day 34: Binary Search Trees: CRUD and Validation](dsa-lectures/day-34-binary-search-trees-crud-and-validation.md) — BST invariant ($left < node < right$), Validate BST with min/max ranges, Delete node in BST.
  - [Day 35: Lowest Common Ancestor and Tree Serialization](dsa-lectures/day-35-lowest-common-ancestor-and-serialization.md) — LCA in BST vs Binary Tree, Serialize and Deserialize Binary Tree (pre-order & level-order).
- **Practice:** 5 binary tree problems, 3 BST problems, and 1 verbal architectural explanation.
- **Weekly Build:** Product category tree traversal, permission tree validation, and hierarchy reporting engine.

---

## Week 8: Graphs (Days 36–40)

**Focus:** Adjacency lists, unweighted shortest path (BFS), component exploration (DFS), cycle detection, and topological ordering.

- **Lectures:**
  - [Day 36: Graph Representations and Modeling](dsa-lectures/day-36-graph-representations-and-modeling.md) — Adjacency list (Map/Array) vs Adjacency Matrix, dense vs sparse graphs, directed vs undirected.
  - [Day 37: Graph Traversal: BFS and Shortest Path](dsa-lectures/day-37-graph-traversal-bfs-and-shortest-path.md) — BFS for unweighted shortest paths, Word Ladder, Rotten Oranges (multi-source BFS).
  - [Day 38: Graph Traversal: DFS and Connected Components](dsa-lectures/day-38-graph-traversal-dfs-and-components.md) — Connected components, Number of Islands (2D Grid DFS), Max Area of Island, Clone Graph.
  - [Day 39: Cycle Detection: Directed and Undirected](dsa-lectures/day-39-cycle-detection-directed-and-undirected.md) — 3-color DFS (unvisited, visiting, visited), Undirected cycle detection using parent pointer.
  - [Day 40: Topological Sort: Kahn's Algorithm and DFS](dsa-lectures/day-40-topological-sort-kahns-and-dfs.md) — DAGs, in-degree calculation, Course Schedule I & II, build dependency resolution in Node.js.
- **Practice:** 5 graph problems and 2 topological sorting exercises.
- **Weekly Build:** Route network planner, social recommendation graph, and package dependency resolver.

---

## Week 9: Heaps and Priority Queues (Days 41–45)

**Focus:** Complete binary trees, array-backed heaps, bubble-up/sink-down operations, Top-K elements, two-heap median, and K-way merge.

- **Lectures:**
  - [Day 41: Binary Heap Array Representation](dsa-lectures/day-41-binary-heap-array-representation.md) — Complete binary tree property, index formulas (`2i+1`, `2i+2`, `Math.floor((i-1)/2)`).
  - [Day 42: Min-Heap and Max-Heap Implementation](dsa-lectures/day-42-min-heap-and-max-heap-implementation.md) — `insert()` with bubble-up, `extractRoot()` with sink-down, $O(n)$ `buildHeap`.
  - [Day 43: Top K Elements and Kth Largest](dsa-lectures/day-43-top-k-elements-and-kth-largest.md) — Min-heap of size K pattern ($O(n \log k)$), Top K Frequent Elements, QuickSelect comparison ($O(n)$).
  - [Day 44: Two Heaps: Median from Data Stream](dsa-lectures/day-44-two-heaps-median-from-stream.md) — Balancing Min-Heap and Max-Heap, streaming median, sliding window median baseline.
  - [Day 45: Merge K Sorted Lists and Task Scheduling](dsa-lectures/day-45-merge-k-sorted-lists-and-task-scheduling.md) — K-way merge using Min-Heap ($O(N \log k)$), Task Scheduler with cooldown intervals.
- **Practice:** 4 heap problems and 2 priority scheduling exercises.
- **Weekly Build:** Priority job scheduler, top-K search ranking cache, and rate-limit priority queue.

---

## Week 10: Dynamic Programming (Days 46–50)

**Focus:** Overlapping subproblems, optimal substructure, memoization vs tabulation, 1D linear sequences, LIS, grid DP, and Knapsack.

- **Lectures:**
  - [Day 46: Dynamic Programming Foundations: Memoization and Tabulation](dsa-lectures/day-46-dynamic-programming-memo-and-tabulation.md) — Top-down vs bottom-up, subproblem DAG, Fibonacci, Climbing Stairs.
  - [Day 47: 1D Dynamic Programming: House Robber and Coin Change](dsa-lectures/day-47-1d-dp-house-robber-and-coin-change.md) — House Robber I & II (circular), Coin Change (minimum coins), state compression ($O(1)$ space).
  - [Day 48: 1D Dynamic Programming: Longest Increasing Subsequence](dsa-lectures/day-48-1d-dp-longest-increasing-subsequence.md) — LIS $O(n^2)$ tabulation vs $O(n \log n)$ binary search patience sorting, Word Break.
  - [Day 49: 2D Dynamic Programming: Grid Paths and Minimum Path Sum](dsa-lectures/day-49-2d-dp-grid-paths-and-minimum-path-sum.md) — Unique Paths I & II (with obstacles), Minimum Path Sum, rolling array space optimization to $O(n)$.
  - [Day 50: 2D Dynamic Programming: Longest Common Subsequence and Knapsack](dsa-lectures/day-50-2d-dp-longest-common-subsequence-knapsack.md) — Longest Common Subsequence (LCS), Edit Distance, 0/1 Knapsack pattern (Subset Sum).
- **Practice:** 5 DP problems with explicit state definition, base cases, recurrence, and space optimization.
- **Weekly Build:** Memoized calculation service, target-reaching counter, and minimum-cost grid routing engine.

---

## Week 11: Greedy, Trie, and Union Find (Days 51–55)

**Focus:** Greedy choice property, interval scheduling, prefix trees (Trie), and Disjoint Set Union (Union-Find) with path compression.

- **Lectures:**
  - [Day 51: Greedy Choices and Interval Scheduling](dsa-lectures/day-51-greedy-interval-scheduling.md) — Greedy choice property vs dynamic programming, Merge Intervals, Non-overlapping Intervals, Insert Interval.
  - [Day 52: Greedy Traversal: Jump Game and Gas Station](dsa-lectures/day-52-greedy-traversal-jump-game-gas-station.md) — Jump Game I & II, Gas Station circular simulation, Partition Labels.
  - [Day 53: Trie Construction and Prefix Search](dsa-lectures/day-53-trie-construction-and-prefix-search.md) — TrieNode structure with Map/Array, `insert`, `search`, `startsWith`, Prefix autocomplete.
  - [Day 54: Disjoint Set Union (Union-Find)](dsa-lectures/day-54-union-find-disjoint-set-union.md) — Array-based parent pointer, Path Compression, Union by Rank, nearly $O(1)$ $\alpha(n)$ amortized complexity.
  - [Day 55: Union-Find Applications in Graphs](dsa-lectures/day-55-union-find-graph-applications.md) — Number of Connected Components, Redundant Connection, Kruskal's Minimum Spanning Tree algorithm.
- **Practice:** 3 greedy problems, 2 trie problems, and 2 union-find problems.
- **Weekly Build:** Fast autocomplete search engine, network-connectivity validator, and minimum spanning cluster builder.

---

## Week 12: Interview Preparation, Revision, and Capstone (Days 56–60)

**Focus:** Constraint-driven pattern recognition, hard combination problems, production Node.js algorithmic concerns, live interview communication, and comprehensive revision.

- **Lectures:**
  - [Day 56: Mixed Pattern Strategy and Problem Constraints](dsa-lectures/day-56-mixed-pattern-strategy-and-constraints.md) — Pattern recognition matrix based on constraints ($N \le 20$, $N \le 10^3$, $N \le 10^5$).
  - [Day 57: High-Frequency Senior Interview Problems](dsa-lectures/day-57-high-frequency-senior-interview-problems.md) — Hard combinations (Sliding Window Maximum with Monotonic Deque, Trapping Rain Water, Alien Dictionary).
  - [Day 58: DSA in Production Node.js Backends](dsa-lectures/day-58-dsa-in-production-nodejs-backends.md) — Event loop latency prevention, large batch partitioning with `setImmediate()`, in-memory LRU cache design, stream-based data processing.
  - [Day 59: Live Interview Communication Framework and Unsticking Protocol](dsa-lectures/day-59-live-interview-framework-and-unsticking.md) — Methodical 6-stage problem solving under pressure, unsticking protocol, defending tradeoffs, and handling edge cases live.
  - [Day 60: Comprehensive DSA Master Cheat Sheet and Final Readiness](dsa-lectures/day-60-comprehensive-dsa-master-cheat-sheet.md) — Complete algorithmic cheat sheet, complexity lookup table, pattern signals, and final interview checklist.
- **Practice:** 4 mixed-pattern medium/hard problems under a 30-minute timer.
- **Weekly Build:** Production backend service combining graph traversal, an LRU cache, and an asynchronous worker queue.

# DSA in Real JavaScript and Node.js Work

## Backend examples

- Rate limiting: sliding window or queue patterns
- Request deduplication: hash maps and sets
- Cache lookup: `Map` and memoization
- Task scheduling: queue and priority queue
- Dependency resolution: graph traversal and topological ordering
- Metrics and cumulative totals: prefix sums
- Large CPU-heavy searches: consider memory and event-loop impact before adding algorithmic work to a request path

## Frontend examples

- Search suggestions: trie
- Browser history: stack
- Undo and redo: stacks
- DOM or component hierarchy: tree traversal
- Recommendation relationships: graph traversal
- Duplicate user actions: set or map

## Questions to ask in a real project

- Is the data large enough for complexity to matter?
- Is order important?
- Are duplicates possible?
- Is the data already sorted?
- Do I need fast membership or key lookup?
- Is the data nested or connected?
- Do I need one answer, all answers, or the best answer?
- Can memory usage or recursion depth become a production problem?

# Interview Preparation

- **Lectures:**
  - [Day 59: Live Interview Communication Framework and Unsticking Protocol](dsa-lectures/day-59-live-interview-framework-and-unsticking.md)
  - [Day 60: Comprehensive DSA Master Cheat Sheet and Final Readiness](dsa-lectures/day-60-comprehensive-dsa-master-cheat-sheet.md)

## Solution explanation format

1. Clarify the problem and assumptions.
2. Explain the brute-force baseline.
3. Identify the pattern.
4. Explain the optimized algorithm.
5. State an invariant or proof idea.
6. Implement with descriptive JavaScript names.
7. Test normal, empty, duplicate, extreme, and failure cases.
8. State time complexity, auxiliary space, and trade-offs.

## Useful complexity language

- “This is `O(n)` because we visit each element once.”
- “This is `O(n log n)` because sorting dominates the work.”
- “This uses `O(n)` extra space for the frequency map.”
- “The recursive depth is `O(h)`, where `h` is the tree height.”
- “This is `O(V + E)` because we process every graph vertex and edge at most a constant number of times.”

## Trade-offs to practice

- Array versus object versus `Map`
- `Set` versus `Map`
- Recursion versus iterative DFS
- Stack versus queue
- Sorting first versus maintaining a heap
- Brute force versus dynamic programming
- Greedy versus dynamic programming
- Trie versus hash map for prefix search
- Graph traversal versus union find for connectivity

## Final revision order

1. Big O, arrays, strings, objects, maps, and sets
2. Hashing, two pointers, sliding window, and prefix sum
3. Stack, queue, recursion, and backtracking
4. Binary search and linked lists
5. Trees, BSTs, and graph traversal
6. Heaps and priority queues
7. Dynamic programming basics
8. Greedy algorithms, tries, and union find
9. Mixed pattern practice and timed explanations

## Must-learn before interview preparation

- Big O and complexity
- Arrays and strings
- Hash maps and sets
- Two pointers and sliding window
- Stack and queue
- Recursion and backtracking basics
- Binary search
- Tree and graph traversal
- Heap basics
- Dynamic programming basics

## Revisit after the core foundation

- Trie implementation details
- Advanced shortest-path algorithms
- Heavy dynamic-programming variants
- Advanced union-find applications
- Formal greedy proofs
- Topological sorting and minimum spanning trees

## Final summary

The simplest realistic path is:

- learn the pattern, not a random algorithm list
- solve one or two problems regularly
- use JavaScript-native structures deliberately
- explain complexity and edge cases
- connect every pattern to a real application
- revise mistakes through spaced practice

The aim is not just to produce working code. It is to choose a suitable structure, explain why it fits, understand its limits, and communicate the trade-off clearly in a JavaScript or Node.js interview.
