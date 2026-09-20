# Day 45: Merge 'K' Sorted Lists and Task Scheduling

## 1. Learning Outcomes
- Master **Merge K Sorted Lists** using a Min-Heap of size $K$ in $O(N \log K)$ time.
- Compare Min-Heap multi-way merge against Divide-and-Conquer pairwise merging.
- Solve the **Task Scheduler** problem with cooldown intervals using a Max-Heap and waiting queue.
- Implement streaming multi-way merges for datasets that exceed available RAM.
- Connect multi-way merges and task schedulers to log aggregation pipelines and rate-limited worker pools in Node.js.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 19 (Queue & Deque), Day 29 (Singly Linked Lists), Day 42 (Min/Max Heap Implementation).
- **Navigation**:
  - [Previous: Day 44 - Two Heaps: Median from Data Stream](day-44-two-heaps-median-from-stream.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 46 - Dynamic Programming: Memoization and Tabulation](day-46-dynamic-programming-memo-and-tabulation.md)

---

## 3. Core Concepts & Mental Models
Merging 2 sorted lists takes $O(n_1 + n_2)$ time using two pointers. Merging $K$ sorted lists naively (merging one-by-one) takes $O(N \cdot K)$ time.
By maintaining a **Min-Heap of size $K$**, we only compare the current head of each of the $K$ lists. Extracting the minimum and inserting its successor takes $O(\log K)$ per element, reducing total time to $O(N \log K)$.

```text
Merge K Sorted Lists (K = 3):
List 1: 1 -> 4 -> 5
List 2: 1 -> 3 -> 4
List 3: 2 -> 6

Min-Heap of Size K = 3:
Initial: Heap contains heads: [1 (L1), 1 (L2), 2 (L3)]
1. Extract min 1 (L1) -> Append to result. Insert 4 (L1.next).
   Heap: [1 (L2), 2 (L3), 4 (L1)]
2. Extract min 1 (L2) -> Append to result. Insert 3 (L2.next).
   Heap: [2 (L3), 3 (L2), 4 (L1)]
3. Extract min 2 (L3) -> Append to result. Insert 6 (L3.next)...
Total Time: O(N log K), where N is total nodes across all lists!
```

---

## 4. Detailed Technical Explanations

### 4.1 Min-Heap vs. Divide-and-Conquer Merging
- **Min-Heap Approach**: $O(N \log K)$ time, $O(K)$ auxiliary space. Ideal for streaming data from $K$ external files or database shards where only 1 item per list needs to reside in memory at a time.
- **Divide-and-Conquer (Pairwise)**: Pair up $K$ lists and merge them iteratively ($K/2, K/4 \dots 1$). Time complexity is also $O(N \log K)$ with $O(1)$ space for linked lists.

### 4.2 Task Scheduler Pattern
Given a list of CPU tasks and a cooldown interval $n$ between identical tasks:
- Always prioritize the task with the **highest remaining frequency** using a **Max-Heap**.
- When a task executes, decrement its remaining count and place it in a **Cooldown Queue** along with the timestamp/cycle when it becomes eligible again: `{ task, count, readyTime: currentCycle + n + 1 }`.
- When `currentCycle === queue.peek().readyTime`, pop from queue and re-insert into the Max-Heap.

### 4.3 Node.js Relevance: External Sort & Distributed Log Aggregation
When aggregating sorted log streams from 50 distributed microservices (e.g., Elasticsearch or Loki), loading all logs into a single Node.js instance triggers V8 out-of-memory. Instead, Node.js streams the logs line-by-line via HTTP or gRPC, pushing only the top log entry of each of the 50 streams into a Min-Heap of size 50. The merged chronological log stream is piped directly to the client with negligible memory consumption.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 Merge K Sorted Lists (LeetCode 23)
```javascript
import { PriorityQueue } from './day-42-min-heap-and-max-heap-implementation.js';

class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

/**
 * Merges K sorted linked lists using a Min-Heap.
 * Time Complexity: O(N log K)
 * Space Complexity: O(K)
 */
function mergeKLists(lists) {
  if (!lists || lists.length === 0) return null;

  // Min-Heap comparing node values
  const minHeap = new PriorityQueue((a, b) => a.val - b.val);

  // 1. Insert the head of each non-empty list into the heap
  for (const head of lists) {
    if (head !== null) {
      minHeap.insert(head);
    }
  }

  const dummy = new ListNode(0);
  let tail = dummy;

  // 2. Extract min node, attach to tail, and insert its next node
  while (!minHeap.isEmpty()) {
    const minNode = minHeap.extract();
    tail.next = minNode;
    tail = tail.next;

    if (minNode.next !== null) {
      minHeap.insert(minNode.next);
    }
  }

  return dummy.next;
}
```

### 5.2 Task Scheduler (LeetCode 621)
```javascript
/**
 * Calculates minimum CPU intervals to finish all tasks with cooldown n.
 * Time Complexity: O(totalTasks * log 26) = O(T)
 * Space Complexity: O(1) bounded by 26 characters
 */
function leastInterval(tasks, n) {
  const freqMap = new Map();
  for (const t of tasks) {
    freqMap.set(t, (freqMap.get(t) || 0) + 1);
  }

  // Max-Heap of frequencies
  const maxHeap = new PriorityQueue((a, b) => b - a);
  for (const count of freqMap.values()) {
    maxHeap.insert(count);
  }

  const queue = []; // Stores [remainingCount, readyTime]
  let time = 0;

  while (!maxHeap.isEmpty() || queue.length > 0) {
    time++;

    if (!maxHeap.isEmpty()) {
      const remaining = maxHeap.extract() - 1;
      if (remaining > 0) {
        queue.push([remaining, time + n]);
      }
    }

    // Check if any cooled-down task is ready to re-enter heap
    if (queue.length > 0 && queue[0][1] === time) {
      maxHeap.insert(queue.shift()[0]);
    }
  }

  return time;
}
```

### 5.3 Execution Trace: `leastInterval(["A","A","A","B","B","B"], 2)`
```text
Counts: A: 3, B: 3. n = 2. maxHeap: [3, 3].
Cycle 1: Exec A (rem: 2). Cooldown ready at 1+2=3. queue: [[2, 3]]. Heap: [3].
Cycle 2: Exec B (rem: 2). Cooldown ready at 2+2=4. queue: [[2, 3], [2, 4]]. Heap: [].
Cycle 3: Heap empty (idle?). queue[0] readyTime is 3 == time!
         Re-enqueue A into heap. Heap: [2]. Exec A (rem: 1, ready at 5).
Cycle 4: queue[0] readyTime is 4 == time! Re-enqueue B. Exec B (rem: 1, ready at 6).
Cycle 5: Exec A (rem: 0).
Cycle 6: Exec B (rem: 0).
Total cycles elapsed: 8 (Sequence: A -> B -> idle -> A -> B -> idle -> A -> B).
```

---

## 6. Common Mistakes & Anti-Patterns
- **Inserting Null Nodes**: Pushing `null` list heads into the heap creates null pointer exceptions during extraction.
- **Flattening and Sorting All Elements**: Converting $K$ linked lists into an array and calling `.sort()` requires $O(N \log N)$ time and $O(N)$ memory, which fails when lists are massive or streamed.
- **Cooldown Off-By-One in Task Scheduler**: If cooldown is $n = 2$, an executed task at cycle 1 can run again at cycle $1 + n + 1 = 4$ (with 2 idle/other cycles in between: cycles 2 and 3).

---

## 7. Tricky Points & Edge Cases
- **$K = 0$ or Empty Lists**: Input `lists = []` or `[null, null]` must be guarded immediately returning `null`.
- **$n = 0$ (No Cooldown)**: When cooldown $n = 0$, task scheduler time is simply `tasks.length`.
- **Mathematical Formula for Task Scheduler**: The maximum frequency $M$ dictates the minimum frame size: `(M - 1) * (n + 1) + countOfMaxFreqTasks`. If tasks exceed this frame, answer is `tasks.length`.

---

## 8. Practical Engineering Exercises
1. Implement **Find K Pairs with Smallest Sums** (LeetCode 373) using a Min-Heap initialized with $(u_0, v_i)$ indices.
2. Given $K$ sorted streaming files on disk, implement a Node.js `Readable` stream that outputs lines in merged ascending order.

---

## 9. Key Takeaways & Summary
- Merge K Sorted Lists uses a Min-Heap of size $K$ to achieve $O(N \log K)$ time and $O(K)$ space.
- Task Scheduler combines a Max-Heap for greedy prioritization with a FIFO cooldown queue for delayed re-entry.
- Streaming multi-way merges allow processing unbounded data streams with bounded $O(K)$ RAM.

---

## 10. Quick Reference Cheat Sheet
| Problem | Heap Structure | Complexity | Space |
| :--- | :--- | :--- | :--- |
| **Merge K Lists** | Min-Heap of size $K$ | $O(N \log K)$ | $O(K)$ |
| **Task Scheduler** | Max-Heap + Cooldown Queue | $O(T)$ | $O(1)$ (26 chars) |
| **K Pairs Smallest Sum** | Min-Heap of size $K$ | $O(K \log K)$ | $O(K)$ |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: Compare the time and space complexity of merging $K$ sorted lists using a Min-Heap versus Divide-and-Conquer pairwise merging.  
**Hint**: Consider auxiliary memory overhead for linked lists.  
**Expected Answer Shape**: Both approaches achieve identical time complexity: $O(N \log K)$, where $N$ is total nodes. The Min-Heap maintains an array of size $K$, consuming $O(K)$ auxiliary space. Divide-and-Conquer merges lists in pairs iteratively, requiring only pointer manipulation ($O(1)$ space for linked lists, or $O(\log K)$ recursion stack). However, the Min-Heap is strictly superior for streaming external sources where data cannot be loaded into memory simultaneously.

### 2. Code-Writing
**Question**: Write a function to solve the Task Scheduler problem using the $O(1)$ space mathematical formula.  
**Hint**: The most frequent task forms $(maxFreq - 1)$ buckets of size $(n + 1)$.  
**Expected Answer Shape**: Find the maximum frequency `maxFreq` among all tasks. Count how many distinct tasks share this `maxFreq` (`maxCount`). Calculate `emptySlots = (maxFreq - 1) * (n + 1) + maxCount`. Return `Math.max(tasks.length, emptySlots)` in $O(N)$ time and $O(1)$ space.

### 3. Debugging
**Question**: Identify why this Min-Heap comparator for `ListNode` fails in JavaScript:  
```javascript
const heap = new PriorityQueue((a, b) => a - b);
```  
**Hint**: What are `a` and `b` in the context of linked lists?  
**Expected Answer Shape**: `a` and `b` are `ListNode` objects (`{ val, next }`). In JavaScript, subtracting two objects `a - b` attempts numeric coercion, resulting in `NaN - NaN = NaN`. Comparisons with `NaN` always return false, corrupting the heap structure. The comparator must compare numerical properties explicitly: `(a, b) => a.val - b.val`.

### 4. System Design / Tradeoff
**Question**: How would you design a distributed log merger in Node.js that aggregates timestamped log lines from 100 EC2 instances in real time?  
**Hint**: Multi-way merge stream using Node.js `stream.Readable`.  
**Expected Answer Shape**: Establish 100 TLS streaming sockets to the EC2 instances. In Node.js, create a custom `Readable` stream holding a Min-Heap of size 100. Read the first log line from each socket and push `{ timestamp, line, socketId }` into the heap. On each `_read()` call, extract the earliest timestamp log, push to the downstream stream, and read the next line from that specific socket to refill the heap, maintaining chronological order in $O(\log 100)$ time with constant memory.

### 5. Tricky / Edge Case
**Question**: In Merge K Sorted Lists, what happens if one list has 1,000,000 nodes while all other $K-1$ lists have only 1 node? How does the Min-Heap perform?  
**Hint**: How many active elements remain in the heap once the small lists empty?  
**Expected Answer Shape**: Once the $K-1$ single-node lists are extracted, the heap shrinks to size 1. At size 1, `_bubbleDown` and `_bubbleUp` execute 0 swaps ($O(1)$ time). The remaining 1,000,000 nodes are extracted in strictly $O(1)$ time each, meaning performance automatically adapts to the remaining active lists without wasting $O(\log K)$ operations.

### 6. Real-World Node.js Context
**Question**: How does BullMQ's rate-limiting mechanism handle jobs that exceed per-second quotas using task scheduling principles?  
**Hint**: Cooldown intervals and delayed queue re-insertion.  
**Expected Answer Shape**: When a worker attempts to process a job for a rate-limited domain, BullMQ checks the current quota via Redis. If exceeded, it does not drop or spin-wait on the job; it calculates the necessary cooldown delay (`now + cooldownMs`), removes the job from the active queue, and adds it to the delayed priority set with score = execution timestamp. Once the cooldown passes, the job is moved back to the ready queue.
