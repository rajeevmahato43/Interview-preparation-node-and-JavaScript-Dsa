# Day 28: Binary Heaps & Priority Queues

<nav aria-label="Lecture navigation">

[Previous: Cycle Detection & Topological Sort](day-27-cycle-detection-and-topological-sort.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Dynamic Programming: 1D & 2D](day-29-dynamic-programming-1d-and-2d.md)

</nav>

---

## 1. Binary Heap & Priority Queue Fundamentals

A normal queue serves people in the order they line up (first come, first served). But in real-world systems, some jobs are much more urgent than others. A **Priority Queue** is a list where every item has a priority level, and the most important item is always pulled out first.

A **Binary Heap** is the best way to build a priority queue. It looks like a balanced tree, but it is actually stored inside one flat, simple array with no node objects or pointers:

- **Complete Binary Tree:** A tree where every level is full, and the bottom level is filled strictly from left to right with no gaps.
- **Min-Heap Rule:** Every parent is smaller than or equal to its children. The smallest number in the whole heap always sits right at index `0`.
- **Max-Heap Rule:** Every parent is larger than or equal to its children. The largest number in the whole heap always sits right at index `0`.

Imagine a hospital emergency room:
- In a bank line, Person A arrived at 9:00 AM and is helped before Person B who arrived at 9:01 AM.
- In an emergency room, Patient A arrives with a small sprain (Priority 3). Patient B arrives with an earache (Priority 4). Then an ambulance arrives with Patient C who is having a heart attack (Priority 1).
- Patient C does not wait behind Patients A and B. Patient C bubbles right up to the front of the line in fast $O(\log n)$ time and is seen immediately in $O(1)$ time!

```javascript
// Production-grade MinHeap supporting custom comparator functions
class MinHeap {
  constructor(compareFn = (a, b) => a - b) {
    this.heap = [];
    this.compare = compareFn;
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  push(val) {
    this.heap.push(val);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const root = this.heap[0];
    this.heap[0] = this.heap.pop();
    this._bubbleDown(0);
    return root;
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parentIdx = Math.floor((index - 1) / 2);
      if (this.compare(this.heap[index], this.heap[parentIdx]) < 0) {
        this._swap(index, parentIdx);
        index = parentIdx;
      } else {
        break;
      }
    }
  }

  _bubbleDown(index) {
    const len = this.heap.length;
    while (true) {
      let smallest = index;
      const leftIdx = 2 * index + 1;
      const rightIdx = 2 * index + 2;

      if (leftIdx < len && this.compare(this.heap[leftIdx], this.heap[smallest]) < 0) {
        smallest = leftIdx;
      }
      if (rightIdx < len && this.compare(this.heap[rightIdx], this.heap[smallest]) < 0) {
        smallest = rightIdx;
      }

      if (smallest !== index) {
        this._swap(index, smallest);
        index = smallest;
      } else {
        break;
      }
    }
  }

  _swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }
}

const testHeap = new MinHeap();
testHeap.push(30);
testHeap.push(10);
testHeap.push(20);
console.log("Min element peek:", testHeap.peek()); // Output: 10
console.log("Extracted min:", testHeap.pop());     // Output: 10
console.log("New min element:", testHeap.peek());   // Output: 20
```

### 1.1 Complete Binary Tree Array Index Arithmetic

Because a heap has no gaps, we can store it in a normal array:

```text
Array representation:
Index:   0    1    2    3    4    5    6
Values: [10,  20,  30,  40,  50,  35,  60]

Parent-Child Formulas:
- For any node at index i:
  * Left Child Index:   2 * i + 1
  * Right Child Index:  2 * i + 2
  * Parent Index:       Math.floor((i - 1) / 2)
```

> [!NOTE]
> Self-Check: Why are array-based heaps faster in practice than tree structures with node objects, even though both take $O(\log n)$ time?
> Answer: Array items sit side by side in memory. The computer's CPU cache can read them all at once. Tree nodes with object pointers are scattered in memory, which forces the CPU to wait on slow memory lookups.

### 1.2 Bubble-Up and Bubble-Down Mechanics

The heap preserves its structural invariants through two operations:

- **Bubble-Up (Insertion):** Append the new element to the end of the array (preserving the complete tree shape). Compare it with its parent at `Math.floor((i - 1) / 2)`. If it has higher priority, swap them. Repeat upward until the invariant holds or the element reaches the root ($O(\log n)$).
- **Bubble-Down (Extraction):** Replace the root at index `0` with the last element in the array. Compare it with its two children (`2i + 1` and `2i + 2`). Swap with the highest-priority child. Repeat downward until the invariant holds or a leaf is reached ($O(\log n)$).

### 1.3 Operations Reference Table

| Operation | Time Complexity | Array Action | Cache Performance |
| :--- | :--- | :--- | :--- |
| **peek()** | $O(1)$ | Read `heap[0]` | Instant L1 cache read |
| **push(val)** | $O(\log n)$ | Append to array, bubble-up | Contiguous memory append |
| **pop()** | $O(\log n)$ | Overwrite root with last, bubble-down | Contiguous memory swaps |
| **buildHeap(arr)**| $O(n)$ | Sift-down from $\lfloor n/2 \rfloor - 1$ down to 0 | Floyd's linear heap construction |
| **size()** | $O(1)$ | Read `heap.length` | Instant lookup |

---

## 2. Priority Queue Patterns

### 2.1 Pattern Family

Priority queue problems divide into three primary structural patterns:

- **Bounded Top-K Selection:** Maintain a heap of size at most $K$. A Min-Heap holds the top $K$ largest elements seen so far; incoming candidates replace the minimum root if they are larger, running in $O(n \log k)$.
- **Multi-Way K-Stream Merging:** Initialize a Min-Heap of size $K$ holding the heads of $K$ sorted streams or linked lists. Extract the minimum, append it to output, and push the next element from that stream.
- **Two Heaps Dynamic Balancing:** Maintain a Max-Heap for the lower half and a Min-Heap for the upper half to compute a running median in $O(1)$ query time and $O(\log n)$ update time.

### 2.2 Pattern Recognition Table

| Problem Keyword Signal | Underlying Problem Need | Recommended Approach |
| :--- | :--- | :--- |
| "Find top $K$ frequent or largest elements" | Discard suboptimal elements on the fly | Bounded Min-Heap of fixed size $K$ |
| "Find $K$-th smallest element in unsorted data" | Filter out larger values | Bounded Max-Heap of fixed size $K$ |
| "Find continuous median from incoming stream" | Track middle values dynamically | Two Heaps Pattern (Max-Heap + Min-Heap) |
| "Merge $K$ sorted arrays or linked lists" | Select minimum among $K$ heads | Min-Heap of size $K$ ($O(N \log K)$) |
| "Schedule tasks with cooldown intervals" | Greedily run highest remaining frequency task | Max-Heap + waiting queue |

### 2.3 When to Use vs When NOT to Use

- **Use a Priority Queue when:**
  - You need repeated access to the minimum or maximum element while elements are continuously added and removed.
  - You want Top-K elements where $K \ll N$, reducing time from $O(N \log N)$ to $O(N \log K)$.
  - You are merging $K$ pre-sorted streams or lists.
- **When NOT to use a Priority Queue:**
  - Searching for arbitrary elements. A binary heap does not maintain search ordering for non-root elements; searching takes $O(n)$ linear scan time.
  - The dataset is static and you only need order statistics once. Use Quickselect in $O(n)$ average time instead.

### 2.4 The 10^7 Operations Rule

In a heap of size $K = 100$, each push and pop takes $\log_2(100) \approx 7$ operations. Processing $N = 1,000,000$ elements takes $\approx 7 \times 10^6$ operations, executing in under 50 milliseconds in Node.js. Sorting all $1,000,000$ elements with $O(N \log N)$ would take $\approx 2 \times 10^7$ comparisons and allocate large arrays.

---

## 3. Problem Walkthroughs

### 3.1 Top K Frequent Elements

#### 3.1.1 Problem Statement
Given an integer array `nums` and an integer `k`, return the $k$ most frequent elements. You may return the answer in any order. The time complexity must be better than $O(n \log n)$.

- **Input:** `nums = [1, 1, 1, 2, 2, 3]`, `k = 2`
- **Output:** `[1, 2]`
- **Constraints:** $1 \le nums.length \le 10^5$, $k$ is in range $[1, \text{unique elements}]$.

#### 3.1.2 How to Think About It
Imagine tracking the top 2 bestselling books in a bookstore. You have a small display table with room for exactly 2 books. The book on the left is the lowest seller among the top 2. When a new book arrives, if it has sold more copies than the book on the left, you kick out the weaker book and put the new book on the table. At all times, the table holds the top 2 bestsellers.

#### 3.1.3 Brute Force Approach & Bottleneck
Count frequencies using a map, dump all unique entries into an array, and sort descending by frequency:

```javascript
function topKFrequentNaive(nums, k) {
  const counts = new Map();
  for (const n of nums) counts.set(n, (counts.get(n) || 0) + 1);
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(e => e[0]);
}
```

Sorting all $M$ unique entries takes $O(M \log M)$ time. If there are 500,000 unique items and we only want the top 5, sorting the entire list wastes CPU ordering items 6 through 500,000.

#### 3.1.4 The Pattern Insight
Use a **Min-Heap bounded to size $K$** ordered by frequency:
- The root of the Min-Heap is always the weakest member of our top $K$ set.
- When an entry is inserted, if heap size exceeds $K$, pop the root. The weakest element is discarded.
- When all entries are processed, the heap contains exactly the top $K$ elements. Total time is $O(N \log K)$.

#### 3.1.5 Pseudocode
```text
function topKFrequent(nums, k):
    count frequencies into Map
    create MinHeap comparing entry[1] (frequency)

    for entry in map.entries():
        minHeap.push(entry)
        if minHeap.size() > k:
            minHeap.pop() // discard lowest frequency

    return array of elements extracted from minHeap
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal Bounded Min-Heap O(N log K)
function topKFrequent(nums, k) {
  const freqMap = new Map();
  for (let i = 0; i < nums.length; i++) {
    freqMap.set(nums[i], (freqMap.get(nums[i]) || 0) + 1);
  }

  // Min-Heap ordered by frequency (entry[1])
  const minHeap = new MinHeap((a, b) => a[1] - b[1]);

  for (const entry of freqMap.entries()) {
    minHeap.push(entry);

    // Bounded to size k
    if (minHeap.size() > k) {
      minHeap.pop(); // Evicts lowest frequency element among current top
    }
  }

  const result = [];
  while (!minHeap.isEmpty()) {
    result.push(minHeap.pop()[0]);
  }

  return result;
}

console.log("Top 2 Frequent in [1,1,1,2,2,3]:", topKFrequent([1, 1, 1, 2, 2, 3], 2));
// Output: [ 2, 1 ] (or [ 1, 2 ])
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Using a Max-Heap of size N
// Inserting all N elements into a Max-Heap takes O(N log N) time and O(N) memory,
// offering zero asymptotic improvement over native array sort.
```

To find the top $K$ largest elements, use a bounded Min-Heap of size $K$, not a Max-Heap of size $N$.

#### 3.1.8 Complexity Derivation
- **Time Complexity:** $O(N \log K)$. Building the map takes $O(N)$. Iterating through $M$ unique entries with a heap of size $K$ takes $O(M \log K)$ where $M \le N$.
- **Auxiliary Space Complexity:** $O(N)$ for the frequency map and $O(K)$ for the Min-Heap.

---

### 3.2 Merge K Sorted Lists

#### 3.2.1 Problem Statement
You are given an array of $k$ linked lists `lists`, each linked list is sorted in ascending order. Merge all the linked lists into one sorted linked list and return it.

- **Input:** `lists = [[1, 4, 5], [1, 3, 4], [2, 6]]`
- **Output:** `[1, 1, 2, 3, 4, 4, 5, 6]`
- **Constraints:** $0 \le k \le 10^4$, total nodes across all lists $\le 10^4$.

#### 3.2.2 How to Think About It
Imagine $K$ lines of people sorted by height, from shortest to tallest. The shortest person in the whole room must be standing at the front of one of those $K$ lines. You compare the $K$ people at the front, pick the shortest one, and have the next person in their line step up.

#### 3.2.3 Brute Force Approach & Bottleneck
Extracting all node values into a giant array, sorting it with `arr.sort((a, b) => a - b)`, and building a new linked list:
This ignores the existing sorted invariant of the $K$ input lists and allocates thousands of redundant node objects on the heap.

#### 3.2.4 The Pattern Insight
Use a **Min-Heap of size $K$**:
1. Insert the head node of each non-empty linked list into the Min-Heap.
2. Pop the smallest node. Re-link it to the output list.
3. If the extracted node has a `.next` pointer, push `node.next` into the heap.
Each extraction and insertion takes $O(\log K)$ time. Existing node pointers are rewired in-place with zero new node allocations.

#### 3.2.5 Pseudocode
```text
function mergeKLists(lists):
    minHeap = MinHeap comparing node.val
    for head in lists:
        if head is not null: minHeap.push(head)

    dummy = ListNode(0)
    tail = dummy

    while not minHeap.isEmpty():
        smallest = minHeap.pop()
        tail.next = smallest
        tail = tail.next
        if smallest.next is not null:
            minHeap.push(smallest.next)

    return dummy.next
```

#### 3.2.6 Optimal Solution

```javascript
class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

// ✅ CORRECT: Optimal O(N log K) Merge K Sorted Lists with Min-Heap
function mergeKLists(lists) {
  if (!lists || lists.length === 0) return null;

  // Min-Heap comparing node values
  const minHeap = new MinHeap((a, b) => a.val - b.val);

  // 1. Initialize heap with head of each list
  for (let i = 0; i < lists.length; i++) {
    if (lists[i] !== null) {
      minHeap.push(lists[i]);
    }
  }

  const dummy = new ListNode(0);
  let tail = dummy;

  // 2. Continuously extract minimum and advance
  while (!minHeap.isEmpty()) {
    const node = minHeap.pop();

    // Re-link existing node in-place
    tail.next = node;
    tail = tail.next;

    if (node.next !== null) {
      minHeap.push(node.next);
    }
  }

  return dummy.next;
}

const list1 = new ListNode(1, new ListNode(4, new ListNode(5)));
const list2 = new ListNode(1, new ListNode(3, new ListNode(4)));
const list3 = new ListNode(2, new ListNode(6));

let merged = mergeKLists([list1, list2, list3]);
const values = [];
while (merged) {
  values.push(merged.val);
  merged = merged.next;
}
console.log("Merged values:", values);
// Output: [ 1, 1, 2, 3, 4, 4, 5, 6 ]
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Linear scanning of all K heads on every step
// Searching all K heads without a heap takes O(K) per step, yielding O(N * K) time.
// When K = 1,000, O(N * K) performs 10,000,000 operations, while O(N log K) takes 100,000.
```

Linearly scanning all list heads turns a logarithmic heap solution into an unscalable quadratic bottleneck.

#### 3.2.8 Complexity Derivation
- **Time Complexity:** $O(N \log K)$, where $N$ is the total count of nodes across all lists and $K$ is the number of linked lists. Each of the $N$ nodes is pushed and popped from the heap of size $K$ once.
- **Auxiliary Space Complexity:** $O(K)$ for the Min-Heap buffer. Node references are rewired in-place with zero additional heap node allocations.

---

### 3.3 Find Median from Data Stream

#### 3.3.1 Problem Statement
The median is the middle value in an ordered integer list. If the size of the list is even, there is no single middle value, and the median is the mean of the two middle values. Design a data structure that supports:
- `addNum(num)`: Add an integer from the data stream.
- `findMedian()`: Return the median of all elements so far in $O(1)$ time.

- **Example:**
  - `addNum(1)`
  - `addNum(2)`
  - `findMedian()` $\to 1.5$
  - `addNum(3)`
  - `findMedian()` $\to 2.0$
- **Constraints:** $-10^5 \le num \le 10^5$, at most $5 \times 10^4$ calls to `addNum` and `findMedian`.

#### 3.3.2 How to Think About It
Imagine splitting all numbers into two equal groups:
- A lower half containing all numbers $\le$ the median.
- An upper half containing all numbers $\ge$ the median.
The median only depends on two numbers: the **largest number in the lower half** and the **smallest number in the upper half**. All other numbers do not matter!

#### 3.3.3 Brute Force Approach & Bottleneck
Inserting numbers into an array and calling `arr.sort((a, b) => a - b)` on every call to `findMedian()`:
Sorting an array of size $N$ takes $O(N \log N)$ per query. Across $N$ insertions, this degrades to $O(N^2 \log N)$, freezing the thread on large streams.

#### 3.3.4 The Pattern Insight
Use the **Two Heaps Pattern**:
1. **Max-Heap (`small`):** Stores the lower half of numbers. The root is the maximum of the lower half.
2. **Min-Heap (`large`):** Stores the upper half of numbers. The root is the minimum of the upper half.
3. **Invariants:**
   - Every number in `small` is $\le$ every number in `large`.
   - `small.size() === large.size()` or `small.size() === large.size() + 1`.
4. **Querying Median in $O(1)$:**
   - If `small.size() > large.size()`, return `small.peek()`.
   - Otherwise, return `(small.peek() + large.peek()) / 2`.

#### 3.3.5 Pseudocode
```text
class MedianFinder:
    small = MaxHeap()
    large = MinHeap()

    function addNum(num):
        small.push(num)
        large.push(small.pop()) // balance elements

        if large.size() > small.size():
            small.push(large.pop())

    function findMedian():
        if small.size() > large.size():
            return small.peek()
        return (small.peek() + large.peek()) / 2.0
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal Two Heaps Median Finder
class MedianFinder {
  constructor() {
    // Max-Heap for lower half: compares b - a so largest is at index 0
    this.small = new MinHeap((a, b) => b - a);
    // Min-Heap for upper half: compares a - b so smallest is at index 0
    this.large = new MinHeap((a, b) => a - b);
  }

  addNum(num) {
    // 1. Always push to small first
    this.small.push(num);

    // 2. Maintain ordering invariant: largest of small moves to large
    this.large.push(this.small.pop());

    // 3. Maintain size invariant: small can have at most 1 more element than large
    if (this.large.size() > this.small.size()) {
      this.small.push(this.large.pop());
    }
  }

  findMedian() {
    if (this.small.size() > this.large.size()) {
      return this.small.peek();
    }
    return (this.small.peek() + this.large.peek()) / 2;
  }
}

const medianTracker = new MedianFinder();
medianTracker.addNum(1);
medianTracker.addNum(2);
console.log("Median of [1, 2]:", medianTracker.findMedian()); // Output: 1.5
medianTracker.addNum(3);
console.log("Median of [1, 2, 3]:", medianTracker.findMedian()); // Output: 2
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Direct insertion without cross-heap balancing
// Pushing directly to small or large based on current size alone without
// verifying if small.peek() <= large.peek() destroys the ordering invariant!
```

Always route numbers through `small` and into `large` to guarantee that the highest number in `small` never exceeds the lowest number in `large`.

#### 3.3.8 Complexity Derivation
- **Time Complexity:**
  - `addNum(num)`: $O(\log N)$ to insert and balance the heaps.
  - `findMedian()`: $O(1)$ strictly by inspecting root elements.
- **Auxiliary Space Complexity:** $O(N)$ auxiliary space across the two heap buffers.

---

## 4. Tricky Edge Cases

- **Right Child Out-of-Bounds:** In `bubbleDown`, always check `right < len` before accessing `heap[right]`. If a node only has a left child, accessing `heap[right]` evaluates to `undefined`, crashing property comparisons.
- **Single Element Pop:** When `heap.length === 1`, immediately return `heap.pop()`. Overwriting `heap[0]` with `pop()` and calling `bubbleDown` corrupts single-element state.
- **Ties in Custom Comparators:** Standard heaps do not guarantee FIFO order among items with identical priority keys. If strict FIFO ordering is needed, add an incrementing sequence timestamp counter.
- **Empty Heap Peeks:** Calling `peek()` on an empty heap must return `null` safely without throwing exceptions.

---

## 5. Summary Cheat Sheet

- **Binary Heap:** Complete binary tree stored in a contiguous array with zero pointer overhead.
- **Parent-Child Arithmetic:** Parent = $\lfloor (i - 1) / 2 \rfloor$, Left = $2i + 1$, Right = $2i + 2$.
- **Bounded Top-K:** Use a Min-Heap of size $K$ to find top $K$ largest items in $O(N \log K)$ time.
- **Merge-K Pattern:** Min-Heap of size $K$ stores active heads of $K$ streams in $O(N \log K)$ time.
- **Two Heaps Pattern:** Max-Heap (lower half) + Min-Heap (upper half) solves running medians in $O(1)$ query time and $O(\log N)$ updates.

---

## 6. Practice Problems

### 6.1 Kth Largest Element in a Stream

- **Input:** Initial array `nums` and rank `k`. Calls to `add(val)`.
- **Output:** The $k$-th largest element after each addition.
- **Constraint:** $1 \le k \le 10^4$.
- **Hint 1:** Maintain a Min-Heap bounded to size $k$.
- **Hint 2:** In constructor, insert all numbers and trim until size is $k$.
- **Hint 3:** In `add(val)`, push `val`, pop if size $> k$, and return `peek()`.

### 6.2 Task Scheduler

- **Input:** Task array `tasks = ["A","A","A","B","B","B"]`, cooldown `n = 2`.
- **Output:** Minimum CPU intervals required.
- **Constraint:** Tasks must wait $n$ intervals before repeating.
- **Hint 1:** Count frequencies into a map.
- **Hint 2:** Push frequencies into a Max-Heap.
- **Hint 3:** Pop the highest frequency task, decrement its count, and if count $> 0$, stage it in a cooldown queue with the timestamp when it becomes available again.

### 6.3 Reorganize String

- **Input:** String `s`.
- **Output:** Reorganized string such that no two adjacent characters are identical, or `""` if impossible.
- **Constraint:** $1 \le s.length \le 500$.
- **Hint 1:** Count character frequencies. If any character frequency $> \lceil s.length / 2 \rceil$, return `""`.
- **Hint 2:** Place `[char, freq]` pairs into a Max-Heap.
- **Hint 3:** Pop the top 2 characters, append both to result, decrement frequencies, and push back if remaining $> 0$.

---

<nav aria-label="Lecture navigation">

[Previous: Cycle Detection & Topological Sort](day-27-cycle-detection-and-topological-sort.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Dynamic Programming: 1D & 2D](day-29-dynamic-programming-1d-and-2d.md)

</nav>
