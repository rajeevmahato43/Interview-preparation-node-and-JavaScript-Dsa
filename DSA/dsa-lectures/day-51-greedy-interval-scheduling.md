# Day 51: Greedy Algorithms: Interval Scheduling and Overlaps

<nav aria-label="Lecture navigation">
  <a href="day-50-2d-dp-longest-common-subsequence-knapsack.md">◀ Day 50: 2D DP: Longest Common Subsequence and Knapsack</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-52-greedy-traversal-jump-game-gas-station.md">Day 52: Greedy Traversal: Jump Game and Gas Station ▶</a>
</nav>

---

## Learning Outcomes

- Master the **Greedy Choice Property**: proving why locally optimal decisions yield globally optimal solutions without backtracking.
- Memorize the sorting decision rule: when to sort by **Start Time** versus sorting by **End Time**.
- Solve **Merge Intervals** by maintaining and extending contiguous active temporal ranges.
- Solve **Non-overlapping Intervals** (Erase Overlap Intervals) by greedily selecting intervals with the earliest finish times.
- Solve **Meeting Rooms II** using the two-pointer sweep-line event coordinate technique.
- Apply interval algorithms to hotel bookings, resource reservations, and rate-limiting sliding windows in Node.js backend services.

---

## Prerequisites

- [Day 05: Sorting Basics and Built-in Sort](day-05-sorting-basics-and-built-in-sort.md) — JavaScript comparator functions and TimSort time complexity.
- [Day 10: Merge Sort and Divide-and-Conquer](day-10-merge-sort-and-divide-and-conquer.md) — Interval division and range merges.
- [Day 50: 2D DP: Longest Common Subsequence and Knapsack](day-50-2d-dp-longest-common-subsequence-knapsack.md) — Combinatorial optimization trade-offs (DP vs. Greedy).

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
| :--- | :--- | :--- |
| **Greedy Choice Property** | The heuristic property that a globally optimal solution can be reached by making locally optimal choices at each step. | Transforms exponential search $O(2^n)$ into $O(n \log n)$ sorting without dynamic programming tables. |
| **Interval** | A continuous range represented by `[start, end]` where $\text{start} \le \text{end}$. | Core data structure for calendar events, memory segments, and time series ranges. |
| **Merge Intervals** | Combining overlapping or adjacent intervals into single maximal continuous ranges. | Requires sorting by **Start Time** to process intervals in chronological arrival order. |
| **Earliest End Time** | Prioritizing the interval that terminates earliest among all compatible options. | The mathematically proven greedy invariant that maximizes total non-overlapping intervals. |
| **Sweep-Line Algorithm** | Treating interval boundaries as discrete start and end events sorted chronologically along a 1D timeline. | Calculates maximum concurrent overlaps (Meeting Rooms II) in $O(n \log n)$ time without 2D checks. |

---

## Core Concepts & Mechanical Architecture

### 1. Interval Relationships and the Sorting Invariant

Two intervals $A = [s_A, e_A]$ and $B = [s_B, e_B]$ (with $s_A \le s_B$) can relate in three distinct ways:

```text
Interval Spatial Topologies:
1. Complete Overlap / Enclosure:
   A: [1 -------------------- 10]
   B:        [3 ------- 7]          --> Merged: [1, 10]

2. Partial Overlap:
   A: [1 ---------- 6]
   B:       [4 ---------- 9]        --> Merged: [1, 9]

3. Disjoint / Non-Overlapping:
   A: [1 ------ 4]
   B:                 [6 ------ 9]  --> Disjoint: Keep both separately
```

#### The Fundamental Sorting Decision Rule:
- **Rule 1 (Merging / Range Coverage)**: Sort by **Start Time** (`a[0] - b[0]`). Ensures you evaluate intervals in chronological arrival order.
- **Rule 2 (Maximizing Non-Overlapping Count)**: Sort by **End Time** (`a[1] - b[1]`). Greedily choosing the interval that finishes earliest leaves the maximum possible remaining time for future intervals.

---

### 2. Merge Intervals (LeetCode 56)

Given an array of `intervals`, merge all overlapping intervals and return an array of the non-overlapping intervals that cover all the input intervals.

```text
Merge Intervals Algorithm:
Input: [[1, 3], [2, 6], [8, 10], [15, 18]]

1. Sort by Start Time: [[1, 3], [2, 6], [8, 10], [15, 18]]
2. Initialize merged = [[1, 3]]
3. Inspect [2, 6]:
   curr.start (2) <= last.end (3) -> OVERLAP!
   last.end = max(3, 6) = 6. Merged becomes: [[1, 6]]
4. Inspect [8, 10]:
   curr.start (8) > last.end (6) -> DISJOINT!
   Append [8, 10]. Merged becomes: [[1, 6], [8, 10]]
5. Inspect [15, 18]:
   curr.start (15) > last.end (10) -> DISJOINT!
   Append [15, 18]. Merged becomes: [[1, 6], [8, 10], [15, 18]]
```

```javascript
// Node.js code: Merge Intervals Implementation
/**
 * @param {number[][]} intervals
 * @returns {number[][]}
 */
function merge(intervals) {
  if (!intervals || intervals.length <= 1) return intervals;

  // 1. Sort by start time ascending: O(n log n)
  intervals.sort((a, b) => a[0] - b[0]);

  const merged = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const lastMerged = merged[merged.length - 1];

    if (current[0] <= lastMerged[1]) {
      // Overlap detected: extend end boundary
      lastMerged[1] = Math.max(lastMerged[1], current[1]);
    } else {
      // No overlap: add new interval
      merged.push(current);
    }
  }

  return merged;
}

console.log('Merged:', merge([[1, 3], [2, 6], [8, 10], [15, 18]])); // [[1,6], [8,10], [15,18]]
```

---

### 3. Non-Overlapping Intervals (LeetCode 435)

Given an array of intervals, find the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.

#### The Equivalence Theorem:
$$\text{Min Intervals to Remove} = \text{Total Intervals} - \text{Max Non-Overlapping Intervals to Keep}$$
By the classical **Interval Scheduling Theorem**, the maximum number of compatible jobs is found by greedily picking intervals sorted by **earliest end time**.

```javascript
// Node.js code: Non-Overlapping Intervals (Erase Overlap)
/**
 * @param {number[][]} intervals
 * @returns {number}
 */
function eraseOverlapIntervals(intervals) {
  if (!intervals || intervals.length <= 1) return 0;

  // 1. Sort by END time ascending
  intervals.sort((a, b) => a[1] - b[1]);

  let removedCount = 0;
  let prevEnd = intervals[0][1];

  for (let i = 1; i < intervals.length; i++) {
    const [start, end] = intervals[i];

    if (start < prevEnd) {
      // Overlap! Greedily remove current interval because it ends later than prevEnd
      removedCount++;
    } else {
      // Non-overlapping: keep this interval and advance boundary
      prevEnd = end;
    }
  }

  return removedCount;
}

console.log('Removed count for [[1,2],[2,3],[3,4],[1,3]]:', eraseOverlapIntervals([[1,2],[2,3],[3,4],[1,3]])); // 1 (remove [1,3])
```

---

### 4. Meeting Rooms II: Sweep-Line Concurrent Overlaps

Given an array of meeting time intervals `intervals = [[s_1, e_1], [s_2, e_2], ...]`, find the minimum number of conference rooms required.
This is mathematically equivalent to finding the **maximum number of concurrent overlapping intervals** at any point in time.

```text
Sweep-Line Chronological Projection:
Meetings: [0, 30], [5, 10], [15, 20]

Separated Events:
Starts: [0, 5, 15]
Ends:   [10, 20, 30]

Two-Pointer Sweep:
Time = 0:  Meeting starts -> Rooms: 1
Time = 5:  Meeting starts -> Rooms: 2 (Peak!)
Time = 10: Meeting ends   -> Rooms: 1
Time = 15: Meeting starts -> Rooms: 2
Time = 20: Meeting ends   -> Rooms: 1
Time = 30: Meeting ends   -> Rooms: 0
Max Concurrent Rooms Required = 2
```

```javascript
// Node.js code: Meeting Rooms II via Two-Pointer Sweep-Line
/**
 * @param {number[][]} intervals
 * @returns {number}
 */
function minMeetingRooms(intervals) {
  if (!intervals || intervals.length === 0) return 0;

  const n = intervals.length;
  const starts = new Int32Array(n);
  const ends = new Int32Array(n);

  for (let i = 0; i < n; i++) {
    starts[i] = intervals[i][0];
    ends[i] = intervals[i][1];
  }

  starts.sort();
  ends.sort();

  let startPtr = 0;
  let endPtr = 0;
  let activeRooms = 0;
  let maxRooms = 0;

  while (startPtr < n) {
    if (starts[startPtr] < ends[endPtr]) {
      // A meeting starts before the earliest active meeting ends
      activeRooms++;
      if (activeRooms > maxRooms) maxRooms = activeRooms;
      startPtr++;
    } else {
      // A meeting ended; free up a room
      activeRooms--;
      endPtr++;
    }
  }

  return maxRooms;
}

console.log('Min rooms for [[0,30],[5,10],[15,20]]:', minMeetingRooms([[0, 30], [5, 10], [15, 20]])); // 2
```

---

## Detailed Node.js Relevance

### Resource Reservations and Calendar Booking Services

In Node.js backend systems (e.g., Airbnb reservation locks, Google Calendar availability checkers, AWS EC2 spot-instance provisioning):

```text
Calendar Booking Timeline:
User Request: [14:00 ---------- 16:00]
Existing Bookings:
[10:00 - 11:30], [12:00 - 14:00], [15:30 - 17:00] (Collision with 14:00-16:00!)
```

1. **Double-Booking Prevention**: When a user books a resource, sorting existing confirmed bookings by start time and checking `requestedStart < existingEnd && requestedEnd > existingStart` performs conflict detection in $O(\log n)$ using binary search on sorted intervals.
2. **Batch Rate-Limiter Windows**: High-velocity payment APIs merge adjacent rate-limiting burst windows using `mergeIntervals`. Consolidating hundreds of granular database locks into merged time windows reduces Redis lock acquisition operations by over $70\%$.

---

## Tricky Points & Edge Cases

1. **Touching Boundaries ($[1, 2]$ and $[2, 3]$)**:
   - In **Merge Intervals**, touching boundaries overlap and **must be merged**: $[1, 2] \cup [2, 3] = [1, 3]$.
   - In **Non-overlapping Intervals** / **Meeting Rooms**, touching boundaries do **not** conflict (one meeting ends at 2:00, the next starts at 2:00 in the same room). Guard condition: `start < prevEnd` (strict inequality).
2. **Unsorted Inputs**:
   Never assume interval inputs arrive pre-sorted. Always invoke `.sort()` first.
3. **Array Mutation in JavaScript `.sort()`**:
   JavaScript's `array.sort()` sorts **in-place**. If the caller requires preserving original input order, clone the array before sorting (`[...intervals].sort(...)`).
4. **Single Interval or Empty Input**:
   Input `[]` or `[[5, 10]]` should immediately return without looping.

---

## Hands-On Exercise

### Scenario
You are developing a conference room scheduler in Node.js. Given a list of requested meetings `[startTime, endTime]` and a room capacity limit `maxAvailableRooms`, implement `canScheduleAllMeetings(meetings, maxAvailableRooms)`:
1. Returns `true` if all meetings can be hosted simultaneously without exceeding `maxAvailableRooms`.
2. If `false`, returns `{ possible: false, peakRoomsNeeded: number }`.
3. Touching intervals (e.g. `[10, 20]` and `[20, 30]`) do not require extra rooms.

### Buggy Code
```javascript
function canScheduleAllMeetings(meetings, maxAvailableRooms) {
  // BUG: Sorts meetings by start time but doesn't track ongoing meeting expirations!
  meetings.sort((a, b) => a[0] - b[0]);
  let overlaps = 1;
  for (let i = 1; i < meetings.length; i++) {
    if (meetings[i][0] < meetings[i - 1][1]) {
      overlaps++; // BUG: Counts consecutive overlaps, not CONCURRENT overlaps!
    }
  }
  return overlaps <= maxAvailableRooms;
}
```

### Acceptance Criteria
- Track concurrent active rooms using sweep-line coordinate separation.
- Accurately compute peak concurrent room demand.
- Touching boundaries must not be counted as concurrent.
- Run in $O(n \log n)$ time and $O(n)$ space.

### Solution Code
```javascript
const assert = require('assert');

// Node.js code: Accurate Room Capacity Auditor
/**
 * @param {Array<[number, number]>} meetings
 * @param {number} maxAvailableRooms
 * @returns {boolean | { possible: boolean, peakRoomsNeeded: number }}
 */
function canScheduleAllMeetings(meetings, maxAvailableRooms) {
  if (!meetings || meetings.length === 0) return true;

  const n = meetings.length;
  const starts = new Array(n);
  const ends = new Array(n);

  for (let i = 0; i < n; i++) {
    starts[i] = meetings[i][0];
    ends[i] = meetings[i][1];
  }

  starts.sort((a, b) => a - b);
  ends.sort((a, b) => a - b);

  let startPtr = 0;
  let endPtr = 0;
  let activeRooms = 0;
  let peakRooms = 0;

  while (startPtr < n) {
    // If next meeting starts strictly before earliest meeting ends
    if (starts[startPtr] < ends[endPtr]) {
      activeRooms++;
      if (activeRooms > peakRooms) {
        peakRooms = activeRooms;
      }
      startPtr++;
    } else {
      // Earliest meeting ended (or ended exactly when next starts)
      activeRooms--;
      endPtr++;
    }
  }

  if (peakRooms <= maxAvailableRooms) {
    return true;
  }

  return {
    possible: false,
    peakRoomsNeeded: peakRooms
  };
}

// Verification & Automated Unit Tests
// Test 1: Capacity 2 is sufficient for max 2 concurrent meetings
const m1 = [[0, 30], [5, 10], [15, 20]];
assert.strictEqual(canScheduleAllMeetings(m1, 2), true);

// Test 2: Capacity 1 is insufficient
const resultFail = canScheduleAllMeetings(m1, 1);
assert.deepStrictEqual(resultFail, { possible: false, peakRoomsNeeded: 2 });

// Test 3: Touching boundaries do NOT overlap
const mTouching = [[10, 20], [20, 30], [30, 40]];
assert.strictEqual(canScheduleAllMeetings(mTouching, 1), true);

// Test 4: Empty meetings
assert.strictEqual(canScheduleAllMeetings([], 1), true);

console.log('✅ All canScheduleAllMeetings assertions passed successfully!');
```

### Solution Explanation
1. **Sweep-Line Separation**: Separating `starts` and `ends` arrays turns interval checking into chronological event counting.
2. **Strict Inequality for Touching**: Using `starts[startPtr] < ends[endPtr]` ensures that if a meeting starts at 20:00 and another ends at 20:00, the ending meeting decrements `activeRooms` first.
3. **Peak Room Auditing**: `peakRooms` captures the global maximum across all timeline steps.

---

## Summary

- **Interval Scheduling** problems hinge on sorting: sort by **Start Time** to merge ranges; sort by **End Time** to maximize non-overlapping selections.
- **Merge Intervals**: Iteratively merge into `merged[merged.length - 1]` whenever `curr[0] <= last[1]`.
- **Erase Overlap Intervals**: Earliest finish time leaves maximum remaining time for subsequent intervals.
- **Meeting Rooms II**: Separating start and end coordinates into two sorted arrays enables $O(n \log n)$ sweep-line concurrent counting.
- In Node.js backend systems, interval algorithms prevent double bookings and consolidate batch database locks.

---

## Cheat Sheet & Common Pitfalls

| Problem | Sort Strategy | Comparison Invariant | Key Action |
| :--- | :--- | :--- | :--- |
| **Merge Intervals** | Start time ASC | `curr.start <= last.end` | `last.end = Math.max(last.end, curr.end)` |
| **Erase Overlap** | End time ASC | `curr.start < prev.end` | If overlap: increment remove count; else `prev.end = curr.end` |
| **Insert Interval** | Pre-sorted | Find insertion position | Merge overlapping middle range |
| **Meeting Rooms II** | Separate starts & ends | `starts[s] < ends[e]` | Increment active rooms; track peak |

---

## Interview Questions

### 1. Why does sorting by end time guarantee an optimal solution for Non-Overlapping Intervals?
**Question:** Mathematically prove why the greedy choice of selecting intervals with the earliest finish time maximizes the number of non-overlapping intervals.

**Answer:**
Let $S$ be the optimal set of non-overlapping intervals, and let $G$ be the set of intervals chosen by our greedy algorithm (earliest finish time).
1. Let the first interval chosen by greedy be $g_1$, which by definition has the smallest finish time among all available intervals.
2. Let the first interval in the optimal set be $o_1$. Since $g_1$ has the earliest finish time of all intervals, $\text{end}(g_1) \le \text{end}(o_1)$.
3. If we replace $o_1$ with $g_1$ in the optimal set $S$, the remaining intervals in $S$ are still compatible because $g_1$ finishes no later than $o_1$.
4. By induction, every greedy choice leaves at least as much remaining time for future intervals as any alternative choice could. Therefore, the greedy choice can never produce fewer intervals than the theoretical optimal solution.

---

### 2. What is the difference between Min-Heap and Two-Pointer approaches for Meeting Rooms II?
**Question:** Compare the Min-Heap approach against the Two-Pointer Sweep-Line approach for Meeting Rooms II in terms of time, space, and operational mechanics.

**Answer:**
- **Min-Heap Approach**:
  1. Sort intervals by start time.
  2. Maintain a Min-Heap of **end times** of active meetings.
  3. For each meeting: if `heap.peek() <= start`, poll the finished meeting. Push current `end`.
  4. Heap size at the end is the minimum rooms required.
  5. Time: $O(n \log n)$, Space: $O(n)$.
- **Two-Pointer Sweep-Line Approach**:
  1. Extract all start times and end times into two separate arrays and sort both independently.
  2. Use two pointers (`startPtr`, `endPtr`).
  3. Time: $O(n \log n)$, Space: $O(n)$.
- **Comparison**: The Two-Pointer approach avoids implementing a Min-Heap data structure in JavaScript and enjoys superior CPU cache locality because it operates on flat primitive arrays.

---

### 3. How do you solve Insert Interval (LeetCode 57) in $O(n)$ time without sorting?
**Question:** Given a list of non-overlapping intervals already sorted by start time, how do you insert a new interval and merge if necessary in $O(n)$ time?

**Answer:**
Because the input is already sorted, we can complete the insertion in three linear phases:
1. **Phase 1 (Before Overlap)**: Append all intervals that end before `newInterval` starts (`interval[1] < newInterval[0]`).
2. **Phase 2 (Merge Overlap)**: While intervals overlap with `newInterval` (`interval[0] <= newInterval[1]`), merge them into `newInterval`:
   ```javascript
   newInterval[0] = Math.min(newInterval[0], interval[0]);
   newInterval[1] = Math.max(newInterval[1], interval[1]);
   ```
3. Push the merged `newInterval`.
4. **Phase 3 (After Overlap)**: Append all remaining intervals.
Total time is strictly $O(n)$ with $O(n)$ output space.

---

### 4. What subtle bug occurs when sorting negative interval coordinates with default `.sort()` in JavaScript?
**Question:** What happens if you call `intervals.sort()` without a comparator on interval arrays containing negative numbers or numbers with different digit counts?

**Answer:**
In JavaScript, `Array.prototype.sort()` without arguments converts elements to **strings** and performs lexicographical comparison:
- `[-10, -5, 2]`: `"-10"` is compared lexicographically to `"-5"`.
- `[10, 2]`: `"10"` is sorted **before** `"2"` because `"1"` comes before `"2"`.
- In an interval array `[[10, 20], [2, 5]]`, calling `intervals.sort()` compares the string representations of the arrays (`"10,20"` vs `"2,5"`), incorrectly placing `[10, 20]` before `[2, 5]`.
**Rule**: Always supply an explicit numeric comparator: `intervals.sort((a, b) => a[0] - b[0])`.

---

<nav aria-label="Lecture navigation">
  <a href="day-50-2d-dp-longest-common-subsequence-knapsack.md">◀ Day 50: 2D DP: Longest Common Subsequence and Knapsack</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-52-greedy-traversal-jump-game-gas-station.md">Day 52: Greedy Traversal: Jump Game and Gas Station ▶</a>
</nav>
