# Day 45: Merge 'K' Sorted Lists and Task Scheduling

<nav aria-label="Lecture navigation">
  <a href="day-44-two-heaps-median-from-stream.md">◀ Day 44: Two Heaps: Median from Data Stream</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-46-dynamic-programming-memo-and-tabulation.md">Day 46: Dynamic Programming: Memoization and Tabulation ▶</a>
</nav>

---

## Learning Outcomes

- Solve **Merge K Sorted Lists** using a Min-Heap of size $K$ in $O(N \log K)$ time and $O(K)$ auxiliary space.
- Compare Min-Heap multi-way merging against **Divide-and-Conquer Pairwise Merging** regarding recursion depth, space complexity, and pointer chasing.
- Solve **Task Scheduler** with cooldown intervals using both Max-Heap simulation and greedy mathematical cycle bounding.
- Implement **External Multi-Way Sort** for merging multi-gigabyte log files that exceed Node.js V8 heap limits.
- Build rate-limited task executors and distributed stream mergers for production Node.js microservices.
- Guard against null list headers, empty inputs, and memory reference leaks during streaming list operations.

---

## Prerequisites

- [Day 19: Queue and Deque Implementations](day-19-queue-and-deque-implementations.md) — FIFO queues, waiting buffers, and cooldown intervals.
- [Day 29: Singly and Doubly Linked Lists](day-29-singly-and-doubly-linked-lists.md) — Node manipulation, sentinel dummy heads, and pointer splicing.
- [Day 42: Min-Heap and Max-Heap Implementation](day-42-min-heap-and-max-heap-implementation.md) — `PriorityQueue` classes with custom comparators.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
| :--- | :--- | :--- |
| **Multi-Way Merge** | Merging $K$ independent sorted streams simultaneously into a single global sorted output sequence. | Standard algorithmic foundation for external sorting, LSM-tree compaction (RocksDB), and distributed log aggregation. |
| **Min-Heap of Heads** | A priority queue storing only the current front head element from each of the $K$ sorted streams. | Reduces comparison cost from $O(K)$ to $O(\log K)$ per item, bringing total time to $O(N \log K)$. |
| **Divide-and-Conquer Merge** | Iteratively pairing up lists and merging pairs using standard 2-way merge until only 1 list remains. | Matches $O(N \log K)$ time and achieves $O(1)$ auxiliary space for linked lists. |
| **Task Scheduler Cooldown** | An interval $n$ requiring at least $n$ units of idle or alternative work between two executions of identical tasks. | Modeled with a Max-Heap for highest remaining frequencies and a FIFO queue for cooldown timers. |
| **Idle Cycle Injection** | Forcing CPU idle ticks when high-frequency tasks are on cooldown and no eligible alternative tasks exist. | Common interview pitfall: failing to count idle slots when calculating total elapsed cycles. |
| **External Sorting** | Sorting datasets too large to fit in RAM by sorting chunks on disk and merging them using a Min-Heap. | Essential backend technique for Node.js services processing large CSV/JSON database dumps. |

---

## Core Concepts & Mechanical Architecture

### 1. Multi-Way Merge Mechanics: Min-Heap of Size $K$

Given $K$ sorted lists with a total of $N$ elements:
- Merging them sequentially one-by-one ($L_1$ with $L_2$, then with $L_3$, etc.) takes:
  $$(n_1 + n_2) + (n_1 + n_2 + n_3) + \dots = O(N \cdot K) \text{ time!}$$
- By maintaining a **Min-Heap of size $K$** containing the current heads of each list:
  1. Extract the minimum node from the heap in $O(\log K)$ time.
  2. Append it to the merged output list.
  3. If that node has a successor (`node.next`), push `node.next` into the heap.
  4. Repeat until the heap is empty.

```text
Merge K Sorted Lists via Min-Heap (K = 3):
List 1: 1 -> 4 -> 5
List 2: 1 -> 3 -> 4
List 3: 2 -> 6

Min-Heap (Size = 3):
Initial: Heap contains heads [1(L1), 1(L2), 2(L3)]
Step 1: Poll min 1(L1). Append 1. Push next: 4(L1). Heap: [1(L2), 2(L3), 4(L1)]
Step 2: Poll min 1(L2). Append 1. Push next: 3(L2). Heap: [2(L3), 3(L2), 4(L1)]
Step 3: Poll min 2(L3). Append 2. Push next: 6(L3). Heap: [3(L2), 4(L1), 6(L3)]
Step 4: Poll min 3(L2). Append 3. Push next: 4(L2). Heap: [4(L1), 4(L2), 6(L3)]
...
Final Merged List: 1 -> 1 -> 2 -> 3 -> 4 -> 4 -> 5 -> 6
Total Comparisons: N * log(K)
```

---

### 2. Implementation: Merge K Sorted Lists (LeetCode 23)

```javascript
// Node.js code: Merge K Sorted Lists Implementation
class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

class MinHeapNodes {
  constructor() {
    this.heap = [];
  }
  size() { return this.heap.length; }

  push(node) {
    this.heap.push(node);
    let curr = this.heap.length - 1;
    while (curr > 0) {
      const p = (curr - 1) >> 1;
      if (this.heap[curr].val < this.heap[p].val) {
        [this.heap[curr], this.heap[p]] = [this.heap[p], this.heap[curr]];
        curr = p;
      } else break;
    }
  }

  poll() {
    if (this.heap.length <= 1) return this.heap.pop();
    const root = this.heap[0];
    this.heap[0] = this.heap.pop();
    let curr = 0;
    const n = this.heap.length;

    while (true) {
      const left = (curr << 1) + 1;
      const right = (curr << 1) + 2;
      let smallest = curr;

      if (left < n && this.heap[left].val < this.heap[smallest].val) smallest = left;
      if (right < n && this.heap[right].val < this.heap[smallest].val) smallest = right;

      if (smallest !== curr) {
        [this.heap[curr], this.heap[smallest]] = [this.heap[smallest], this.heap[curr]];
        curr = smallest;
      } else break;
    }

    return root;
  }
}

/**
 * Merges K sorted linked lists.
 * Time Complexity: O(N log K)
 * Space Complexity: O(K) auxiliary heap space
 * @param {Array<ListNode|null>} lists
 * @returns {ListNode|null}
 */
function mergeKLists(lists) {
  if (!lists || lists.length === 0) return null;

  const minHeap = new MinHeapNodes();

  // 1. Seed heap with head of each non-empty list
  for (let i = 0; i < lists.length; i++) {
    if (lists[i] !== null) {
      minHeap.push(lists[i]);
    }
  }

  const dummyHead = new ListNode(0);
  let tail = dummyHead;

  // 2. Continually extract min and advance
  while (minHeap.size() > 0) {
    const minNode = minHeap.poll();
    tail.next = minNode;
    tail = tail.next;

    if (minNode.next !== null) {
      minHeap.push(minNode.next);
    }
  }

  return dummyHead.next;
}
```

---

### 3. Divide-and-Conquer Alternative: $O(1)$ Space Merging

Instead of maintaining a heap, we can merge lists pairwise using standard two-way linked list merging:
- Round 1: Merge $L_0$ with $L_1$, $L_2$ with $L_3 \dots$ ($K \to K/2$ lists).
- Round 2: Merge the results ($K/2 \to K/4$ lists).
- Total rounds: $\log_2 K$.
Each round scans all $N$ nodes. Total time is $O(N \log K)$, with $O(1)$ auxiliary memory (re-linking pointers in place).

```text
Divide-and-Conquer Pairing (K = 4):
Round 0: [ L0,     L1,     L2,     L3 ]
           \     /          \     /
Round 1: [ Merge(L0,L1),    Merge(L2,L3) ]
                 \         /
Round 2:     [ Merge(L01, L23) ] -> Final Result!
```

---

### 4. Task Scheduler (LeetCode 621)

Given an array of CPU task strings (e.g., `["A","A","A","B","B","B"]`) and non-negative cooldown integer $n$:
- Identical tasks must be separated by at least $n$ intervals.
- Tasks execute in 1 unit of time; CPU can sit idle.
- Find minimum total intervals required.

#### Mathematical Greedy Formula:
Let `maxFreq` be the maximum frequency of any task.
Let `maxCount` be the number of distinct tasks that share this `maxFreq`.
1. The most frequent tasks define the number of "frames": `(maxFreq - 1)`.
2. Each frame has length `(n + 1)`.
3. Total calculated slots:
   $$\text{slots} = (\text{maxFreq} - 1) \cdot (n + 1) + \text{maxCount}$$
4. If there are enough diverse tasks to fill all idle slots, no idle time is needed.
   $$\text{ans} = \max(\text{tasks.length}, \text{slots})$$

```javascript
// Node.js code: Task Scheduler Mathematical Solution
/**
 * Time Complexity: O(tasks.length)
 * Space Complexity: O(1) (at most 26 uppercase letters)
 * @param {string[]} tasks
 * @param {number} n
 * @returns {number}
 */
function leastInterval(tasks, n) {
  const freqMap = new Map();
  let maxFreq = 0;

  for (let i = 0; i < tasks.length; i++) {
    const f = (freqMap.get(tasks[i]) || 0) + 1;
    freqMap.set(tasks[i], f);
    if (f > maxFreq) maxFreq = f;
  }

  let maxCount = 0;
  for (const count of freqMap.values()) {
    if (count === maxFreq) maxCount++;
  }

  const emptyFrames = maxFreq - 1;
  const frameLength = n + 1;
  const totalSlots = emptyFrames * frameLength + maxCount;

  return Math.max(tasks.length, totalSlots);
}

console.log('Task slots (A:3, B:3, n:2):', leastInterval(['A','A','A','B','B','B'], 2)); // 8 (A -> B -> idle -> A -> B -> idle -> A -> B)
```

---

## Detailed Node.js Relevance

### External Multi-Way Log Aggregation in Node.js

In large cloud backends, multiple microservices write timestamped logs to independent rotated files: `service-1.log`, `service-2.log` ... `service-50.log`.
A central Node.js service must stream these into an audit pipeline in strictly chronological order.

```text
External Stream Merging Pipeline:
[Service-1 File ReadStream] --\
[Service-2 File ReadStream] ---> [Min-Heap of Top Lines] ---> [Merged HTTP Response Stream]
[Service-50 File ReadStream] -/  Only 50 lines in RAM!         Continuous backpressure safe
```

1. **V8 Memory Safety**: Loading fifty 2GB log files into memory requires 100GB of RAM, immediately crashing Node.js with Out-Of-Memory.
2. **Streaming Min-Heap Merge**: Node.js opens a `readline` stream on each file, pushing only the **first line** of each stream into a Min-Heap of size 50.
3. As the minimum timestamp log is piped to `res.write()`, the next line from that specific file stream is read and inserted into the heap. Memory consumption remains strictly bounded under a few megabytes regardless of file sizes!

---

## Tricky Points & Edge Cases

1. **Empty Lists in `lists` Array**: Input `[[], [1, 2], []]` contains empty list heads (`null`). If you attempt to access `lists[i].val` without checking `lists[i] !== null`, Node.js throws `TypeError: Cannot read properties of null`.
2. **Task Scheduler Cooldown $n = 0$**: When cooldown $n = 0$, tasks can run back-to-back with zero idle slots. The answer is simply `tasks.length`.
3. **`dummyHead` Memory Pattern**: Always construct linked lists using a sentinel `dummyHead = new ListNode(0)`. Returning `dummyHead.next` avoids cumbersome branch conditions for the first merged node.
4. **All Lists Empty**: When `lists = [null, null]`, the heap remains empty, and the function must cleanly return `null`.

---

## Hands-On Exercise

### Scenario
You are developing an audit log merger for a distributed Node.js cluster. Log entries arrive as sorted arrays from $K$ service nodes: each entry is `{ timestamp: number, message: string }`.
Implement `mergeLogStreams(streams)`:
1. Merges $K$ pre-sorted streams into a single globally sorted array.
2. Uses a Min-Heap of size $K$ to ensure time complexity is $O(N \log K)$ where $N$ is total entries across all streams.
3. Must handle empty streams and uneven stream lengths cleanly.

### Buggy Code
```javascript
function mergeLogStreams(streams) {
  // BUG: Flattens all entries and runs global sort!
  // Takes O(N log N) time and buffers entire dataset at once
  const allLogs = [];
  for (let s of streams) {
    allLogs.push(...s);
  }
  return allLogs.sort((a, b) => a.timestamp - b.timestamp);
}
```

### Acceptance Criteria
- Use a Min-Heap of size $K$ to compare stream heads.
- Track stream indices and element offsets (`[streamIndex, elementIndex]`) to advance streams.
- Achieve $O(N \log K)$ time complexity and $O(K)$ auxiliary memory.
- Provide automated unit test coverage with `assert`.

### Solution Code
```javascript
const assert = require('assert');

// Node.js code: Production K-Way Stream Merger
class StreamMinHeap {
  constructor() {
    this.heap = [];
  }
  size() { return this.heap.length; }

  push(item) {
    this.heap.push(item);
    let curr = this.heap.length - 1;
    while (curr > 0) {
      const p = (curr - 1) >> 1;
      if (this.heap[curr].entry.timestamp < this.heap[p].entry.timestamp) {
        [this.heap[curr], this.heap[p]] = [this.heap[p], this.heap[curr]];
        curr = p;
      } else break;
    }
  }

  poll() {
    if (this.heap.length <= 1) return this.heap.pop();
    const root = this.heap[0];
    this.heap[0] = this.heap.pop();
    let curr = 0;
    const n = this.heap.length;

    while (true) {
      const left = (curr << 1) + 1;
      const right = (curr << 1) + 2;
      let smallest = curr;

      if (left < n && this.heap[left].entry.timestamp < this.heap[smallest].entry.timestamp) {
        smallest = left;
      }
      if (right < n && this.heap[right].entry.timestamp < this.heap[smallest].entry.timestamp) {
        smallest = right;
      }

      if (smallest !== curr) {
        [this.heap[curr], this.heap[smallest]] = [this.heap[smallest], this.heap[curr]];
        curr = smallest;
      } else break;
    }

    return root;
  }
}

/**
 * Merges K sorted log streams in O(N log K) time.
 * @param {Array<Array<{ timestamp: number, message: string }>>} streams
 * @returns {Array<{ timestamp: number, message: string }>}
 */
function mergeLogStreams(streams) {
  if (!streams || streams.length === 0) return [];

  const heap = new StreamMinHeap();

  // 1. Initialize heap with first entry of each non-empty stream
  for (let sIdx = 0; sIdx < streams.length; sIdx++) {
    if (streams[sIdx] && streams[sIdx].length > 0) {
      heap.push({
        entry: streams[sIdx][0],
        streamIdx: sIdx,
        itemIdx: 0
      });
    }
  }

  const merged = [];

  // 2. Continually extract minimum timestamp and advance corresponding stream
  while (heap.size() > 0) {
    const { entry, streamIdx, itemIdx } = heap.poll();
    merged.push(entry);

    const nextItemIdx = itemIdx + 1;
    if (nextItemIdx < streams[streamIdx].length) {
      heap.push({
        entry: streams[streamIdx][nextItemIdx],
        streamIdx,
        itemIdx: nextItemIdx
      });
    }
  }

  return merged;
}

// Verification & Automated Unit Tests
const s1 = [
  { timestamp: 100, message: 'Auth success' },
  { timestamp: 300, message: 'Token refresh' }
];
const s2 = [
  { timestamp: 150, message: 'DB connect' },
  { timestamp: 200, message: 'DB query' },
  { timestamp: 400, message: 'DB close' }
];
const s3 = [
  { timestamp: 50, message: 'Server start' },
  { timestamp: 250, message: 'Cache warm' }
];

const mergedLogs = mergeLogStreams([s1, s2, s3]);

// Assertions
assert.strictEqual(mergedLogs.length, 7);
assert.strictEqual(mergedLogs[0].timestamp, 50);
assert.strictEqual(mergedLogs[1].timestamp, 100);
assert.strictEqual(mergedLogs[2].timestamp, 150);
assert.strictEqual(mergedLogs[3].timestamp, 200);
assert.strictEqual(mergedLogs[4].timestamp, 250);
assert.strictEqual(mergedLogs[5].timestamp, 300);
assert.strictEqual(mergedLogs[6].timestamp, 400);

// Test empty streams
assert.deepStrictEqual(mergeLogStreams([[], [], []]), []);
assert.deepStrictEqual(mergeLogStreams([]), []);

console.log('✅ All K-Way Log Stream Merger assertions passed successfully!');
```

### Solution Explanation
1. **Bounded Auxiliary Memory**: The heap stores at most $K$ items simultaneously, capping auxiliary space at $O(K)$.
2. **Index-Based Advancement**: Recording `{ streamIdx, itemIdx }` avoids mutating or slicing caller arrays while identifying the successor element in $O(1)$ time.
3. **Logarithmic Multi-Way Selection**: Each extracted element triggers an $O(\log K)$ sift operation, yielding strict $O(N \log K)$ total execution time.

---

## Summary

- Merging $K$ sorted lists naively takes $O(N \cdot K)$ time; maintaining a **Min-Heap of size $K$** reduces this to $O(N \log K)$ time and $O(K)$ space.
- **Divide-and-Conquer Merging** matches $O(N \log K)$ time and achieves $O(1)$ space for linked lists by splicing pointers pairwise.
- **Task Scheduler** can be solved via simulation using a Max-Heap and waiting queue, or in $O(N)$ time via the mathematical frame formula: $\max(\text{tasks.length}, (\text{maxFreq}-1)(n+1) + \text{maxCount})$.
- In Node.js distributed architectures, multi-way merging powers external log sorting and RocksDB-style compaction across memory-constrained services.

---

## Cheat Sheet & Common Pitfalls

| Problem | Key Technique | Time Complexity | Auxiliary Space |
| :--- | :--- | :--- | :--- |
| **Merge $K$ Lists (Heap)** | Min-Heap of list heads | $O(N \log K)$ | $O(K)$ |
| **Merge $K$ Lists (D&C)** | Pairwise 2-way merges | $O(N \log K)$ | $O(1)$ |
| **Task Scheduler** | Max-Freq frame formula | $O(\text{tasks.length})$ | $O(1)$ (26 chars) |
| **External Sorting** | Disk chunks + Min-Heap | $O(N \log K)$ | $O(K)$ |

---

## Interview Questions

### 1. How does the Min-Heap approach compare with Divide-and-Conquer for Merge K Sorted Lists?
**Question:** Analyze the time complexity, space complexity, and architectural trade-offs between the Min-Heap method and Divide-and-Conquer pairwise merging for Merge K Sorted Lists.

**Answer:**
- **Time Complexity**: Both algorithms achieve identical asymptotic time: $O(N \log K)$, where $N$ is total elements across all $K$ lists.
- **Space Complexity**:
  - Min-Heap: Requires $O(K)$ auxiliary space to maintain the heap array.
  - Divide-and-Conquer: Operates in $O(1)$ auxiliary space for linked lists by rearranging existing `.next` pointers in-place (or $O(\log K)$ recursive stack space if implemented recursively).
- **Architectural Trade-Off**:
  - The Min-Heap approach is strictly superior for **streaming data and external sorting**, because it only requires 1 element from each of the $K$ sources in memory at any time.
  - Divide-and-Conquer is preferable for static, in-memory linked lists where zero additional memory allocation is desired.

---

### 2. How do you derive the mathematical formula for the Task Scheduler problem?
**Question:** Explain the step-by-step derivation of the formula: `slots = (maxFreq - 1) * (n + 1) + maxCount` in LeetCode 621.

**Answer:**
1. Consider the task with the maximum frequency, `maxFreq`. Let it be task `A`.
2. Because each execution of `A` requires a cooldown of $n$ slots before the next execution, `A` partitions the timeline into `(maxFreq - 1)` chunks or "frames".
3. Each frame contains 1 slot for `A` and $n$ slots reserved for other tasks or idle cycles, giving each frame a length of `n + 1`.
4. In the final frame, we only need to place `A` without any trailing cooldown. If multiple distinct tasks share the exact same maximum frequency (`maxCount`), all of them must run in this final frame.
5. Therefore, minimum frame slots required is: `(maxFreq - 1) * (n + 1) + maxCount`.
6. If the total number of tasks exceeds this slot count, there are enough distinct tasks to fill all empty slots without inserting any idle cycles. Hence, the final answer is $\max(\text{tasks.length}, \text{slots})$.

---

### 3. What happens if you try to merge K sorted arrays using `Array.prototype.shift()`?
**Question:** If you implement K-way merging on JavaScript arrays using `stream.shift()` to get the next element, what catastrophic performance degradation occurs?

**Answer:**
In JavaScript engines (V8), arrays are stored as contiguous memory buffers.
1. Calling `array.shift()` removes the element at index 0 and shifts all remaining $M - 1$ elements left by 1 index in physical memory.
2. If done for all $N$ elements across $K$ arrays of average length $M$, each dequeue costs $O(M)$ time.
3. The total time complexity degrades from optimal $O(N \log K)$ to:
   $$O(N \cdot M + N \log K) = O(N \cdot \frac{N}{K})$$
   For $K = 10$ and $N = 100,000$, this performs $10^9$ memory shifts, freezing the Node.js event loop for several seconds.
4. **Fix**: Never call `shift()`; track the current index offset (`streamIdx`, `itemIdx`) using plain integer pointers.

---

### 4. How does external sorting using a Min-Heap handle multi-gigabyte files in Node.js?
**Question:** How would you sort a 20GB log file in a Node.js process constrained to a 512MB heap limit?

**Answer:**
1. **Phase 1: Chunk Sorting (Run Generation)**:
   - Read the 20GB file in 200MB chunks via a readable stream.
   - Sort each 200MB chunk in memory and write it out to disk as a temporary sorted file: `chunk_0.tmp`, `chunk_1.tmp` ... `chunk_99.tmp` (100 sorted runs).
2. **Phase 2: K-Way Merge with Min-Heap**:
   - Open a line-by-line read stream for each of the 100 temporary chunk files.
   - Read only the **first line** of each chunk file and insert `{ line, fileIndex }` into a Min-Heap of size 100.
   - In a loop: poll the minimum line from the heap, write it to the final sorted output file, and read the next line from `fileIndex` to re-insert into the heap.
3. **Memory Profile**: Memory usage is capped at $O(K \times \text{buffer size}) \approx 100 \times 64\text{KB} \approx 6.4\text{MB}$, easily running inside the 512MB heap limit without GC stress.

---

<nav aria-label="Lecture navigation">
  <a href="day-44-two-heaps-median-from-stream.md">◀ Day 44: Two Heaps: Median from Data Stream</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-46-dynamic-programming-memo-and-tabulation.md">Day 46: Dynamic Programming: Memoization and Tabulation ▶</a>
</nav>
