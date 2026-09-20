# Day 51: Greedy Algorithms: Interval Scheduling and Overlaps

## 1. Learning Outcomes
- Master the **Greedy Choice Property**: proving that locally optimal choices lead to global optimality.
- Distinguish when to sort by **Start Time** versus sorting by **End Time**.
- Solve **Merge Intervals** by expanding contiguous active ranges.
- Solve **Non-overlapping Intervals** (Interval Scheduling) by minimizing end boundaries.
- Solve **Meeting Rooms II** using two-pointer sweep-line event sorting.
- Apply interval algorithms to calendar scheduling, resource reservation, and booking rate limiters in Node.js.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 05 (Sorting Basics), Day 10 (Merge Sort).
- **Navigation**:
  - [Previous: Day 50 - 2D DP: Longest Common Subsequence & Knapsack](day-50-2d-dp-longest-common-subsequence-knapsack.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 52 - Greedy Traversal: Jump Game & Gas Station](day-52-greedy-traversal-jump-game-gas-station.md)

---

## 3. Core Concepts & Mental Models
An **Interval** is represented by a pair `[start, end]`. In interval problems, decisions hinge on how intervals overlap:

```text
Interval Relationships:
A: [1 ---------- 5]
B:       [3 ---------- 8]      --> OVERLAP: Merge to [1, 8]
C:                        [9 - 10] --> DISJOINT: Separate interval

The Sorting Decision Rule:
1. Merging Overlapping Ranges:
   Sort by START TIME: intervals.sort((a, b) => a[0] - b[0])
   Ensures intervals appear in chronological arrival order.

2. Maximizing Compatible Non-Overlapping Intervals:
   Sort by END TIME: intervals.sort((a, b) => a[1] - b[1])
   Greedy choice: Finishing earliest leaves maximum time for future intervals!
```

---

## 4. Detailed Technical Explanations

### 4.1 Merge Intervals Pattern
1. Sort intervals by `start` ascending.
2. Maintain a `merged = [intervals[0]]`.
3. For each subsequent interval `[currStart, currEnd]`:
   - Let `last = merged[merged.length - 1]`.
   - If `currStart <= last[1]`: Overlap! Update `last[1] = Math.max(last[1], currEnd)`.
   - Else: No overlap. Push `[currStart, currEnd]` into `merged`.

### 4.2 Non-overlapping Intervals (Erase Minimum Intervals)
To find the minimum intervals to remove, find the maximum intervals you can *keep* (Interval Scheduling Theorem):
1. Sort intervals by `end` ascending.
2. Initialize `count = 0`, `prevEnd = -Infinity`.
3. For each interval:
   - If `start >= prevEnd`: Keep it, update `prevEnd = end`.
   - Else: Overlap! Must remove it, increment `count++`.

### 4.3 Meeting Rooms II (Sweep-Line Technique)
Given meeting time intervals, what is the minimum number of conference rooms required?
- Instead of tracking room objects, treat starts as `+1 room` events and ends as `-1 room` events.
- Sort all start times and end times into two separate arrays.
- Advance two pointers: when `starts[s] < ends[e]`, a room is occupied (`rooms++`, $s++$); when `starts[s] >= ends[e]`, a meeting ended and vacated a room (`rooms--`, $e++$).

### 4.4 Node.js Relevance: Reservation Engines & Rate Quota Windows
In booking platforms (e.g., Airbnb, OpenTable, flight booking APIs) or scheduled maintenance systems written in Node.js, reservations are intervals. Interval merging identifies overlapping lock periods, and sweep-line algorithms determine peak concurrent server capacity requirements.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 Merge Intervals (LeetCode 56)
```javascript
/**
 * Merges all overlapping intervals.
 * Time Complexity: O(n log n) due to sort
 * Space Complexity: O(n) for output
 */
function merge(intervals) {
  if (!intervals || intervals.length <= 1) return intervals;

  // 1. Sort by start time
  intervals.sort((a, b) => a[0] - b[0]);

  const merged = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const [currStart, currEnd] = intervals[i];
    const last = merged[merged.length - 1];

    if (currStart <= last[1]) {
      // Overlap: merge by expanding end time to maximum
      last[1] = Math.max(last[1], currEnd);
    } else {
      // Disjoint: push as new distinct interval
      merged.push([currStart, currEnd]);
    }
  }

  return merged;
}
```

### 5.2 Non-overlapping Intervals (LeetCode 435)
```javascript
/**
 * Minimum intervals to remove to make the rest non-overlapping.
 * Time Complexity: O(n log n)
 * Space Complexity: O(1)
 */
function eraseOverlapIntervals(intervals) {
  if (intervals.length <= 1) return 0;

  // Sort by end time ascending (Greedy: earliest finish time)
  intervals.sort((a, b) => a[1] - b[1]);

  let removals = 0;
  let prevEnd = intervals[0][1];

  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] < prevEnd) {
      // Overlap detected: remove this interval
      removals++;
    } else {
      // Valid non-overlapping interval: update boundary
      prevEnd = intervals[i][1];
    }
  }

  return removals;
}
```

### 5.3 Meeting Rooms II (LeetCode 253)
```javascript
/**
 * Minimum conference rooms required.
 * Time Complexity: O(n log n)
 * Space Complexity: O(n)
 */
function minMeetingRooms(intervals) {
  if (intervals.length === 0) return 0;

  const starts = intervals.map(i => i[0]).sort((a, b) => a - b);
  const ends = intervals.map(i => i[1]).sort((a, b) => a - b);

  let rooms = 0;
  let maxRooms = 0;
  let s = 0;
  let e = 0;

  while (s < intervals.length) {
    if (starts[s] < ends[e]) {
      // Meeting starts before earliest meeting ends: need new room
      rooms++;
      s++;
    } else {
      // Meeting finished: free up room
      rooms--;
      e++;
    }
    maxRooms = Math.max(maxRooms, rooms);
  }

  return maxRooms;
}
```

### 5.4 Execution Trace: `merge([[1,3],[2,6],[8,10],[15,18]])`
```text
1. Sorted by start: [[1,3], [2,6], [8,10], [15,18]]
2. merged = [[1, 3]]
3. Interval [2, 6]:
   currStart (2) <= last[1] (3) -> Overlap!
   last[1] = max(3, 6) = 6.  merged = [[1, 6]]
4. Interval [8, 10]:
   currStart (8) > last[1] (6) -> Disjoint!
   merged.push([8, 10]).    merged = [[1, 6], [8, 10]]
5. Interval [15, 18]:
   currStart (15) > last[1] (10) -> Disjoint!
   merged.push([15, 18]).  merged = [[1, 6], [8, 10], [15, 18]]
Result: [[1, 6], [8, 10], [15, 18]].
```

---

## 6. Common Mistakes & Anti-Patterns
- **Sorting by Wrong Boundary in Interval Scheduling**: Sorting by start time in `eraseOverlapIntervals` produces suboptimal removals. A very long interval starting early can block multiple short intervals. Sorting by *end time* is mathematically required.
- **Forgetting `Math.max` in Merge**: Writing `last[1] = currEnd` fails when a later interval is completely swallowed inside the earlier interval (e.g., `[1, 10]` and `[2, 5]` would incorrectly become `[1, 5]`). Must use `Math.max(last[1], currEnd)`.
- **Inclusive vs. Exclusive Overlaps**: Clarify whether `[1, 2]` and `[2, 3]` overlap. In standard LeetCode problems, touching endpoints (`start === end`) are non-overlapping (`currStart < prevEnd`).

---

## 7. Tricky Points & Edge Cases
- **Interval Fully Enclosed**: `[1, 8]` followed by `[2, 4]` produces `[1, 8]`. Handled by `Math.max`.
- **Identical Intervals**: `[[1, 2], [1, 2]]` merged produces `[[1, 2]]`.
- **Single Interval or Empty Input**: Guard `if (intervals.length <= 1) return intervals;`.

---

## 8. Practical Engineering Exercises
1. Implement **Insert Interval** (LeetCode 57) inserting a new interval into an already sorted list of non-overlapping intervals in $O(n)$ time.
2. Implement **Employee Free Time** (LeetCode 759) finding common free intervals across multiple employee working schedules.

---

## 9. Key Takeaways & Summary
- Greedy algorithms make locally optimal decisions that guarantee global optimality.
- To merge overlapping intervals: sort by **Start Time**.
- To maximize non-overlapping intervals: sort by **End Time** (earliest deadline first).
- Meeting Rooms II tracks peak concurrent overlapping intervals via two-pointer sweep line.

---

## 10. Quick Reference Cheat Sheet
| Problem | Sort Property | Overlap Action | Complexity |
| :--- | :--- | :--- | :--- |
| **Merge Intervals** | Start time ascending | `last[1] = max(last[1], currEnd)` | $O(n \log n)$ |
| **Erase Overlap** | End time ascending | `removals++` | $O(n \log n)$ |
| **Meeting Rooms II** | Separate starts and ends | `starts[s] < ends[e] ? rooms++ : rooms--` | $O(n \log n)$ |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: Prove why sorting by End Time guarantees the maximum number of non-overlapping intervals (Interval Scheduling Theorem).  
**Hint**: Proof by induction/contradiction (Greedy stays ahead).  
**Expected Answer Shape**: Suppose an optimal solution $O$ has intervals $i_1, i_2 \dots i_k$, and greedy choice picks $g_1$ with the earliest end time. Because $g_1$ finishes at or before $i_1$ by definition, replacing $i_1$ with $g_1$ in $O$ leaves at least as much remaining time for all subsequent intervals $i_2 \dots i_k$. By mathematical induction, the greedy sequence finishes each step no later than the optimal sequence ("greedy stays ahead"), guaranteeing it fits at least as many total intervals as any alternative.

### 2. Code-Writing
**Question**: Write `insert(intervals, newInterval)` that inserts a new interval into a list of non-overlapping intervals sorted by start time in $O(n)$ time.  
**Hint**: Divide into 3 phases: before overlap, during overlap, and after overlap.  
**Expected Answer Shape**: Initialize `result = []`, index `i = 0`. Phase 1: while `intervals[i][1] < newInterval[0]`, push to result. Phase 2 (merge overlaps): while `intervals[i][0] <= newInterval[1]`, expand `newInterval = [min(newInterval[0], intervals[i][0]), max(newInterval[1], intervals[i][1])]`, increment $i$. Push merged `newInterval`. Phase 3: push remaining intervals. Return `result` in $O(n)$ time.

### 3. Debugging
**Question**: Identify why this Meeting Rooms code fails:  
```javascript
function minMeetingRooms(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  let rooms = 1;
  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] < intervals[i - 1][1]) rooms++;
  }
  return rooms;
}
```  
**Hint**: What happens when an earlier meeting ends before the third meeting starts?  
**Expected Answer Shape**: This code only compares adjacent pairs. If meeting 1 ends at 10, meeting 2 runs from 2 to 4, and meeting 3 runs from 5 to 7: meeting 2 overlaps with 1, and meeting 3 overlaps with 2's end time, but meeting 2 already finished before meeting 3 starts! The code counts 3 rooms, but only 2 rooms are ever occupied simultaneously. Rooms can be reused. Use the sweep-line technique or a Min-Heap of end times.

### 4. System Design / Tradeoff
**Question**: In an event ticketing platform built on Node.js (e.g., Ticketmaster), how would you detect seating conflicts for 1,000,000 reservation holds?  
**Hint**: Database row locks vs. in-memory interval trees.  
**Expected Answer Shape**: Locking 1,000,000 rows in PostgreSQL causes severe lock contention and slow transaction queues. Instead, maintain an in-memory **Interval Tree** or Segment Tree in Redis/Node.js partitioned by venue seat ID. Inserting a temporary reservation hold takes $O(\log n)$ to query whether any existing hold overlaps with the requested time window, returning instant seat availability before committing final database writes.

### 5. Tricky / Edge Case
**Question**: In `eraseOverlapIntervals`, if two intervals have identical end times `[1, 4]` and `[2, 4]`, which one should the greedy algorithm pick, and does it impact the result?  
**Hint**: Compare remaining time after finish.  
**Expected Answer Shape**: Both intervals finish at the exact same time (4). Therefore, the remaining time available for all future intervals is identical regardless of which interval is selected. Picking either interval yields the exact same count of compatible subsequent intervals, meaning tie-breaking between equal end times does not affect the optimal outcome.

### 6. Real-World Node.js Context
**Question**: How does a Node.js cron job scheduler (like `node-cron` or Agenda) use interval merging to coalesce overlapping job runs?  
**Hint**: Deduplicating overlapping scheduled maintenance windows.  
**Expected Answer Shape**: When multiple service modules register overlapping maintenance or database backup windows (e.g., Service A requests 2:00–4:00 AM, Service B requests 3:30–5:00 AM), running them independently causes redundant database freezes. The job orchestrator runs `mergeIntervals` on all registered maintenance windows, coalescing them into a single consolidated window (2:00–5:00 AM) to minimize system disruption.
