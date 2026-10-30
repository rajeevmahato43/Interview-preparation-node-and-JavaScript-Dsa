# Day 27: Cycle Detection & Topological Sort

<nav aria-label="Lecture navigation">

[Previous: Graphs: BFS & DFS](day-26-graphs-bfs-shortest-path-and-dfs-components.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Heaps & Priority Queues](day-28-binary-heaps-and-priority-queues.md)

</nav>

## 1. Directed Graphs, Cycles & DAGs

A Directed Graph consists of vertices connected by one-way directed edges: an edge $u \to v$ denotes an asymmetric relationship where $u$ must precede or point directly to $v$.

When a directed graph contains no closed loops (cycles), it is called a Directed Acyclic Graph (DAG). DAGs are the universal mathematical foundation for modeling build pipelines, workflow execution engines, database migration runners, and package dependency managers (like `npm` or `yarn`).

- **Directed Acyclic Graph (DAG):** A directed graph with zero directed cycles. If you start at any vertex and follow directed edges, you can never loop back to your starting point.
- **Topological Sort:** A linear ordering of all vertices in a DAG such that for every directed edge $u \to v$, vertex $u$ appears before vertex $v$ in the sequence.
- **In-Degree vs Out-Degree:** The in-degree of a vertex is the count of incoming edges pointing into it (prerequisites). The out-degree is the count of outgoing edges pointing away from it (dependents).

Imagine getting dressed in the morning. You must put on your underwear before your pants, your socks before your shoes, and your pants before your shoes. A valid linear sequence might be: `[Underwear, Socks, Pants, Shoes]`. Multiple valid sequences can exist (e.g. `[Socks, Underwear, Pants, Shoes]`), but you can never put your shoes on before your socks. Now imagine a circular deadlock: Module A requires Module B to start, Module B requires Module C, and Module C requires Module A. None of the three modules can ever start. A graph can produce a valid topological sort if and only if it has zero cycles.

```javascript
// Baseline demonstration of in-degree calculation
function calculateInDegrees(numCourses, prerequisites) {
  const inDegree = new Int32Array(numCourses);
  const adj = Array.from({ length: numCourses }, () => []);

  for (const [course, prereq] of prerequisites) {
    adj[prereq].push(course); // prereq -> course
    inDegree[course]++;
  }

  return { adj, inDegree };
}

const { inDegree } = calculateInDegrees(4, [[1, 0], [2, 0], [3, 1], [3, 2]]);
console.log("In-Degrees for courses 0..3:", Array.from(inDegree));
// Output: [ 0, 1, 1, 2 ] (Course 0 has 0 prerequisites; ready to run!)
```

### 1.1 Kahn's In-Degree Peeling Algorithm (BFS)

Kahn's algorithm resolves dependencies by iteratively processing nodes with an in-degree of 0:

```text
Edges: 0 -> 1, 0 -> 2, 1 -> 3, 2 -> 3
In-Degrees: { 0: 0, 1: 1, 2: 1, 3: 2 }

Step 1: Enqueue all nodes with inDegree === 0 -> Queue = [ 0 ]
Step 2: Pop 0. Add 0 to Order.
        Decrement neighbor 1 -> inDegree[1] becomes 0 -> Enqueue 1!
        Decrement neighbor 2 -> inDegree[2] becomes 0 -> Enqueue 2!
        Queue = [ 1, 2 ]
Step 3: Pop 1. Add 1 to Order. Decrement neighbor 3 -> inDegree[3] becomes 1.
Step 4: Pop 2. Add 2 to Order. Decrement neighbor 3 -> inDegree[3] becomes 0 -> Enqueue 3!
Step 5: Pop 3. Add 3 to Order.
Final Sequence: [ 0, 1, 2, 3 ] (All 4 nodes processed -> Valid DAG!)
```

If a cycle exists, nodes within the cycle will never have their in-degrees reduced to zero. When the queue empties, the number of processed nodes will be strictly less than $V$, proving that a deadlock exists.

> [!NOTE]
> Why does Kahn's algorithm prove the presence of a cycle if `order.length < numCourses`?
> Because every node in a directed cycle has at least one incoming edge from another node in that cycle. None of them can ever reach an in-degree of zero, so none of them can ever enter the queue.

### 1.2 Three-Color DFS State Tracking (Recursion Stack)

In an undirected graph, a two-state boolean visited array is sufficient. In a directed graph, a two-state visited array triggers false alarms on diamond graphs:

```text
Diamond Graph (Valid DAG, NO cycle):
      0
     / \
    1   2
     \ /
      3
Path 1: 0 -> 1 -> 3 (3 marked visited)
Path 2: 0 -> 2 -> 3 (3 is already visited, but this is NOT a cycle! 3 is just a shared dependent!)
```

To avoid false cycle reports, we categorize nodes into Three States (Colors):
- **0 (White / Unvisited):** The vertex has not yet been discovered.
- **1 (Gray / Visiting):** The vertex is currently active on the recursive call stack. If a search ever encounters a neighbor in state `1`, a back-edge has looped back into the active path $\implies$ Cycle Detected!
- **2 (Black / Finished):** The vertex and all of its descendants have been fully explored and confirmed acyclic.

### 1.3 Operations Reference Table

| Algorithm | Paradigm | Data Structures | Cycle Detection Condition | Topological Order Emission |
| :--- | :--- | :--- | :--- | :--- |
| **Kahn's Algorithm** | BFS (In-Degree Peeling) | Queue + `inDegree` array | `order.length < V` | Natural Left-to-Right |
| **3-Color DFS** | DFS (Stack Tracking) | Call stack + `state` array | Encounter neighbor in state `1` | Reverse Post-Order |
| **Alien Dictionary** | Pairwise DAG + Kahn's | Map + inDegree Map | `order.length < uniqueChars` | Lexicographical order |

---

## 2. Topological Sort Patterns

### 2.1 Pattern Family

Directed graph and cycle detection problems partition into three main patterns:

- **Iterative In-Degree Peeling (Kahn's BFS):** Unlocks nodes as prerequisites reach zero. Naturally emits solutions in prerequisite-first execution order.
- **Three-Color Back-Edge Detection (DFS):** Detects whether a path loops back onto its own active call stack. Emits topological order via reverse post-order.
- **Centroid Leaf Peeling:** Trims leaves inward to find tree centroids or minimum height roots.

### 2.2 Pattern Recognition Table

| Problem Keyword Signal | Underlying Graph Invariant | Recommended Approach |
| :--- | :--- | :--- |
| "Prerequisites: must take B before A" | Validate task ordering or detect cycle | Kahn's Algorithm or 3-Color DFS |
| "Find an ordering to complete all tasks" | Generate full linear sequence | Kahn's Algorithm (Course Schedule II) |
| "Can all courses be finished?" | Cycle detection boolean answer | 3-Color DFS or Kahn's check |
| "Alien Dictionary: derive alphabet order" | Build character DAG from sorted prefixes | Prefix comparison + Topological Sort |
| "Find minimum height tree root" | Peel leaf nodes inward layer by layer | In-degree leaf trimming |

### 2.3 When to Use vs When NOT to Use

- **Use Kahn's Algorithm (BFS) when:**
  - You need to generate the actual linear execution sequence.
  - You want intuitive iterative code with explicit queue state.
  - You need to break ties lexicographically (by replacing the queue with a Min-Heap).
- **Use 3-Color DFS when:**
  - You only need a boolean answer: "Does this graph contain a cycle?"
  - The search terminates as soon as the first back-edge is hit.
- **When NOT to use Topological Sort:**
  - The graph is undirected. In undirected graphs, use standard visited parent tracking or Union-Find.

### 2.4 The 10^7 Operations Rule

Both Kahn's algorithm and 3-Color DFS run in $O(V + E)$ time:
- For $V = 50,000$ and $E = 100,000$, total operations are around $150,000$, executing in under 15 milliseconds.
- Always use `queue[head++]` rather than `queue.shift()` to ensure dequeues remain $O(1)$ amortized.

---

## 3. Problem Walkthroughs

### 3.1 Course Schedule I

#### 3.1.1 Problem Statement
There are a total of `numCourses` courses you have to take, labeled from `0` to `numCourses - 1`. You are given an array `prerequisites` where `prerequisites[i] = [a, b]` indicates that you must take course $b$ first if you want to take course $a$. Return `true` if you can finish all courses. Otherwise, return `false`.

- **Input:** `numCourses = 2`, `prerequisites = [[1, 0]]`
- **Output:** `true`
- **Input:** `numCourses = 2`, `prerequisites = [[1, 0], [0, 1]]`
- **Output:** `false` (Cycle between 0 and 1)
- **Constraints:** $1 \le numCourses \le 2,000$, $0 \le prerequisites.length \le 5,000$.

#### 3.1.2 How to Think About It
Imagine a set of instruction manuals. Book 1 says "Read Book 0 first". Book 0 says "Read Book 1 first". Neither reader can ever begin because both are waiting on the other. If any chain of prerequisites forms a closed loop, none of the books in that loop can ever be read.

#### 3.1.3 Brute Force Approach & Bottleneck
Running an unmemoized DFS from every node to see if it can reach itself:
Without recording fully verified (finished) nodes, subsequent searches re-traverse previously confirmed acyclic paths, leading to $O(V \cdot (V + E))$ or $O(V^2)$ time complexity.

#### 3.1.4 The Pattern Insight
Use **3-Color DFS Cycle Detection**:
- State 0: Unvisited.
- State 1: Active on current recursion stack. If a neighbor is in state 1, a back-edge exists $\implies$ Cycle detected.
- State 2: Completely explored and safe. If a neighbor is in state 2, skip it immediately.

#### 3.1.5 Pseudocode
```text
function canFinish(numCourses, prerequisites):
    build adj list: prereq -> course
    state = array of size numCourses filled with 0

    function hasCycle(node):
        state[node] = 1 // Gray
        for neighbor in adj[node]:
            if state[neighbor] == 1:
                return true
            if state[neighbor] == 0:
                if hasCycle(neighbor): return true
        state[node] = 2 // Black
        return false

    for i from 0 to numCourses - 1:
        if state[i] == 0 and hasCycle(i):
            return false

    return true
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal 3-Color DFS Cycle Detection
function canFinish(numCourses, prerequisites) {
  const adj = Array.from({ length: numCourses }, () => []);
  for (const [course, prereq] of prerequisites) {
    adj[prereq].push(course); // prereq -> course
  }

  // 0 = Unvisited, 1 = Visiting (Active Stack), 2 = Finished
  const state = new Uint8Array(numCourses);

  function hasCycle(node) {
    state[node] = 1; // Mark Gray (currently on call stack)

    for (const neighbor of adj[node]) {
      // If neighbor is currently on active stack, a cycle exists
      if (state[neighbor] === 1) {
        return true;
      }

      // If neighbor is unvisited, recurse
      if (state[neighbor] === 0) {
        if (hasCycle(neighbor)) return true;
      }
    }

    state[node] = 2; // Mark Black (finished and safe)
    return false;
  }

  for (let i = 0; i < numCourses; i++) {
    if (state[i] === 0) {
      if (hasCycle(i)) {
        return false;
      }
    }
  }

  return true;
}

console.log("Can Finish [[1, 0]]:", canFinish(2, [[1, 0]]));             // Output: true
console.log("Can Finish [[1, 0], [0, 1]]:", canFinish(2, [[1, 0], [0, 1]])); // Output: false
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Using a 2-state boolean visited array
// Fails on diamond graphs (0 -> 1 -> 3 and 0 -> 2 -> 3) by treating
// node 3 as a cycle because it was already visited from node 1!
```

A two-state array cannot distinguish between a node visited in a previous parallel branch versus a node currently active on the current recursive call stack.

#### 3.1.8 Complexity Derivation
- **Time Complexity:** $O(V + E)$ where $V = numCourses$ and $E = prerequisites.length$. Each node transitions $0 \to 1 \to 2$ once, and each edge is traversed once.
- **Auxiliary Space Complexity:** $O(V + E)$ for the adjacency list and $O(V)$ for the `state` array and recursion stack.

---

### 3.2 Course Schedule II

#### 3.2.1 Problem Statement
There are a total of `numCourses` courses labeled from `0` to `numCourses - 1`. Given an array `prerequisites` where `prerequisites[i] = [a, b]` means you must take course $b$ first before course $a$, return the ordering of courses you should take to finish all courses. If impossible, return an empty array `[]`.

- **Input:** `numCourses = 4`, `prerequisites = [[1, 0], [2, 0], [3, 1], [3, 2]]`
- **Output:** `[0, 1, 2, 3]` or `[0, 2, 1, 3]`
- **Constraints:** $1 \le numCourses \le 2,000$, $0 \le prerequisites.length \le numCourses \times (numCourses - 1)$.

#### 3.2.2 How to Think About It
Imagine a bucket of tasks. You look for any task that has zero requirements. You complete it and wipe it off the requirements list of all other tasks. This unlocks new tasks that now have zero remaining requirements. You repeat this until all tasks are completed.

#### 3.2.3 Brute Force Approach & Bottleneck
Generating all $V!$ permutations of courses and testing if every prerequisite constraint is met:
Factorial complexity ($V!$) is computationally impossible for $V \ge 12$.

#### 3.2.4 The Pattern Insight
Use **Kahn's Algorithm (BFS In-Degree Peeling)**:
1. Compute the in-degree of every course.
2. Initialize a queue with all courses having `inDegree === 0`.
3. While the queue has elements, dequeue course `u`, append it to `order`, and for each dependent course `v`, decrement `inDegree[v]`.
4. If `inDegree[v]` becomes 0, enqueue `v`.
5. If `order.length === numCourses`, return `order`. Otherwise, return `[]`.

#### 3.2.5 Pseudocode
```text
function findOrder(numCourses, prerequisites):
    build adj list (prereq -> course) and inDegree array
    queue = all nodes where inDegree == 0
    head = 0
    order = []

    while head < queue.length:
        curr = queue[head++]
        order.push(curr)
        for nextCourse in adj[curr]:
            inDegree[nextCourse]--
            if inDegree[nextCourse] == 0:
                queue.push(nextCourse)

    return order if order.length == numCourses else []
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal Kahn's BFS Topological Sort
function findOrder(numCourses, prerequisites) {
  const adj = Array.from({ length: numCourses }, () => []);
  const inDegree = new Int32Array(numCourses);

  for (const [course, prereq] of prerequisites) {
    adj[prereq].push(course); // prereq -> course
    inDegree[course]++;
  }

  const queue = [];
  let head = 0;

  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) {
      queue.push(i);
    }
  }

  const order = [];

  while (head < queue.length) {
    const curr = queue[head++];
    order.push(curr);

    for (const nextCourse of adj[curr]) {
      inDegree[nextCourse]--;
      if (inDegree[nextCourse] === 0) {
        queue.push(nextCourse);
      }
    }
  }

  return order.length === numCourses ? order : [];
}

console.log("Valid Course Order:", findOrder(4, [[1, 0], [2, 0], [3, 1], [3, 2]]));
// Output: [ 0, 1, 2, 3 ]
console.log("Cyclic Course Order:", findOrder(2, [[1, 0], [0, 1]]));
// Output: []
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Reversing the edge direction
adj[course].push(prereq);
inDegree[prereq]++; // BUG: Pushes edges backwards!
```

`[course, prereq]` means `prereq -> course`. Inverting this creates a reverse ordering or prevents nodes from ever reaching an in-degree of zero.

#### 3.2.8 Complexity Derivation
- **Time Complexity:** $O(V + E)$ where $V = numCourses$ and $E = prerequisites.length$.
- **Auxiliary Space Complexity:** $O(V + E)$ for the adjacency list and $O(V)$ for the `inDegree` array, queue, and order output.

---

### 3.3 Alien Dictionary

#### 3.3.1 Problem Statement
There is a new alien language that uses the English alphabet. The letters are sorted lexicographically by the rules of this new language. Given a list of words `words` sorted lexicographically by the rules of this alien language, derive the order of letters in this language. If the order is invalid, return `""`. If multiple valid orders exist, return any of them.

- **Input:** `words = ["wrt","wrf","er","ett","rftt"]`
- **Output:** `"wertf"`
- **Constraints:** $1 \le words.length \le 100$, $1 \le words[i].length \le 100$.

#### 3.3.2 How to Think About It
In an English dictionary, "apple" comes before "apply" because 'e' comes before 'y' at the first point of divergence. By comparing adjacent words in the sorted list, the first differing character gives a direct precedence rule: letter 1 must come before letter 2 (`letter1 -> letter2`). Once all precedence rules are collected into a DAG, topological sort yields the alphabet.

#### 3.3.3 Brute Force Approach & Bottleneck
Comparing all pairs of words ($O(N^2)$) and checking permutation orders:
Only adjacent word comparisons are needed. Comparing non-adjacent pairs adds redundant transitive edges without new information.

#### 3.3.4 The Pattern Insight
1. Collect all unique characters into an in-degree map initialized to 0.
2. Compare adjacent words `words[i]` and `words[i + 1]`:
   - Edge Case: If `words[i]` starts with `words[i + 1]` and is longer (e.g. `["abc", "ab"]`), the dictionary is invalid $\implies$ Return `""`.
   - Find the first differing character: `c1 !== c2`. Add directed edge $c1 \to c2$ and increment `inDegree[c2]`. Break immediately.
3. Run Kahn's algorithm on the character DAG.
4. If the output string length equals the number of unique characters, return the string. Otherwise, return `""`.

#### 3.3.5 Pseudocode
```text
function alienOrder(words):
    initialize adj and inDegree for all unique chars in words

    for i from 0 to words.length - 2:
        w1 = words[i], w2 = words[i + 1]
        if w1.length > w2.length and w1.startsWith(w2):
            return "" // invalid prefix ordering
        for j from 0 to min(w1.length, w2.length) - 1:
            if w1[j] != w2[j]:
                add edge w1[j] -> w2[j]
                increment inDegree of w2[j]
                break

    run Kahn's BFS with inDegree == 0 chars
    return order if order.length == uniqueCharsCount else ""
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal Alien Dictionary DAG with Kahn's Algorithm
function alienOrder(words) {
  const adj = new Map();
  const inDegree = new Map();

  // 1. Initialize all unique characters
  for (const word of words) {
    for (const ch of word) {
      if (!adj.has(ch)) adj.set(ch, new Set());
      if (!inDegree.has(ch)) inDegree.set(ch, 0);
    }
  }

  // 2. Build edges from adjacent word differences
  for (let i = 0; i < words.length - 1; i++) {
    const w1 = words[i];
    const w2 = words[i + 1];

    // Invalid prefix trap: ["abc", "ab"]
    if (w1.length > w2.length && w1.startsWith(w2)) {
      return "";
    }

    const minLen = Math.min(w1.length, w2.length);
    for (let j = 0; j < minLen; j++) {
      const c1 = w1[j];
      const c2 = w2[j];

      if (c1 !== c2) {
        if (!adj.get(c1).has(c2)) {
          adj.get(c1).add(c2);
          inDegree.set(c2, inDegree.get(c2) + 1);
        }
        break; // Only the first differing character dictates order!
      }
    }
  }

  // 3. Kahn's BFS
  const queue = [];
  let head = 0;

  for (const [ch, deg] of inDegree.entries()) {
    if (deg === 0) {
      queue.push(ch);
    }
  }

  const result = [];

  while (head < queue.length) {
    const ch = queue[head++];
    result.push(ch);

    for (const neighbor of adj.get(ch)) {
      const newDeg = inDegree.get(neighbor) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) {
        queue.push(neighbor);
      }
    }
  }

  return result.length === inDegree.size ? result.join('') : "";
}

console.log("Alien Order ['wrt','wrf','er','ett','rftt']:", alienOrder(["wrt","wrf","er","ett","rftt"]));
// Output: "wertf"
console.log("Alien Order with cycle ['z', 'x', 'z']:", alienOrder(["z", "x", "z"]));
// Output: ""
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Forgetting prefix length check
// If input is ["apple", "app"], standard difference loops find no differing char,
// missing the fact that a longer word cannot precede its prefix in a sorted dictionary!
```

Always check `if (w1.length > w2.length && w1.startsWith(w2)) return ""` upfront.

#### 3.3.8 Complexity Derivation
- **Time Complexity:** $O(C)$ where $C$ is the total length of all words in the input. Extracting unique characters and comparing adjacent prefixes takes $O(C)$ time. Running Kahn's algorithm takes $O(U + E)$, where $U \le 26$ unique letters and $E \le U^2$.
- **Auxiliary Space Complexity:** $O(U + E) = O(1)$ since the alphabet size is bounded by 26 lowercase English letters.

---

## 4. Tricky Edge Cases

- **Self-Loops:** A dependency like `[0, 0]` means a task requires itself. Its in-degree will be at least 1, preventing it from ever being enqueued. Both Kahn's and 3-Color DFS correctly flag this as an invalid cycle.
- **Disconnected Components with Multiple In-Degree 0 Roots:** A DAG can have multiple independent entry points. Kahn's algorithm handles this naturally by enqueuing all initial 0-in-degree nodes together.
- **Prefix Violation in Sorted Words:** In Alien Dictionary, if `"apple"` precedes `"app"`, the dictionary order is invalid. Return `""` immediately.
- **Duplicate Prerequisites:** If prerequisites include `[1, 0]` multiple times, using an adjacency array without deduplication may artificially inflate in-degrees. Use Sets or deduplicate edge inputs.

---

## 5. Summary Cheat Sheet

- **A topological sort exists if and only if a directed graph contains zero cycles.**
- **Kahn's Algorithm (BFS):** Enqueue nodes with in-degree 0; decrement neighbor in-degrees on dequeue. If `order.length < V`, a cycle exists.
- **3-Color DFS:** Mark 1 (Gray) on recursion descent; mark 2 (Black) on return. Seeing a neighbor with state 1 indicates a back-edge and cycle.
- **Edge Direction Clarity:** In Course Schedule, `[a, b]` means $b \to a$ ($b$ is a prerequisite for $a$).
- **Alien Dictionary:** Pairwise comparison of adjacent words reveals the first differing character as a directed precedence edge.

---

## 6. Practice Problems

### 6.1 Minimum Height Trees

- **Input:** Undirected tree with $n$ nodes and $n - 1$ edges.
- **Output:** All root labels that minimize overall tree height.
- **Constraint:** $1 \le n \le 2 \times 10^4$.
- **Hint 1:** Use topological in-degree leaf peeling.
- **Hint 2:** Leaves have `degree === 1`. Enqueue all initial leaves.
- **Hint 3:** Trim leaves layer-by-layer inward until 1 or 2 centroid nodes remain.

### 6.2 Sequence Reconstruction

- **Input:** Array `nums` and array of subsequences `sequences`.
- **Output:** `true` if `nums` is the unique shortest supersequence reconstructible from `sequences`.
- **Constraint:** $1 \le n \le 10^4$.
- **Hint 1:** Build a DAG from consecutive pairs in each sequence.
- **Hint 2:** Run Kahn's algorithm.
- **Hint 3:** At every step, verify that `queue.length === 1`. If the queue ever has more than 1 node, multiple valid topological orderings exist, meaning the sequence is not unique.

### 6.3 Find Eventual Safe States

- **Input:** Directed graph represented as adjacency list `graph`.
- **Output:** All safe nodes sorted in ascending order.
- **Constraint:** A node is safe if every possible path starting from it leads to a terminal node (no cycles).
- **Hint 1:** Use 3-Color DFS.
- **Hint 2:** Any node that participates in a cycle or points to a cycle remains non-safe.
- **Hint 3:** Nodes that transition to state 2 (Black) are safe.

---

<nav aria-label="Lecture navigation">

[Previous: Graphs: BFS & DFS](day-26-graphs-bfs-shortest-path-and-dfs-components.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Binary Heaps & Priority Queues](day-28-binary-heaps-and-priority-queues.md)

</nav>
