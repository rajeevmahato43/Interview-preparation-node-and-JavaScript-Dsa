# Day 01: Big O Complexity & Algorithmic Problem Solving

<nav aria-label="Lecture navigation">

[Roadmap](../javascript-dsa-roadmap.md) | [Next: Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md)

</nav>

---

## 1. What is Big O

Big O notation is a mathematical tool used to describe how the execution steps and memory consumption of an algorithm grow as the input size $n$ increases.

It does **not** measure execution time in seconds. Measuring execution time with `Date.now()` or `console.time()` is unreliable because clock time depends on CPU hardware, background operating system tasks, V8 engine JIT compilation, and garbage collection pauses.

Instead, Big O counts the **number of basic operations**:
1. Variable assignments (`let x = 10`)
2. Arithmetic calculations (`a + b`)
3. Logical comparisons (`i < n`)
4. Array or object lookups (`arr[i]`)

> When the input size $n$ doubles, by what factor does the total work increase?

To picture this physically, imagine searching for a specific receipt in a room containing $n$ receipts:
* **Linear Search ($O(n)$):** The receipts are in a messy pile. You inspect them one by one. If there are 10 receipts, you check up to 10 times. If there are 1,000,000 receipts, you check up to 1,000,000 times.
* **Binary Search ($O(\log n)$):** The receipts are sorted by date in a filing cabinet. You open the drawer right at the middle. If the target date is earlier, you instantly discard the entire second half. For 1,000,000 receipts, you find it in about 20 checks.
* **Instant Lookup ($O(1)$):** Each receipt has an ID and sits in a numbered slot matching that ID. You walk directly to slot #42 and grab it in 1 step.

```javascript
// O(1) Constant Time: Takes 1 step regardless of input size
function getFirstItem(items) {
  return items.length > 0 ? items[0] : null;
}

// O(n) Linear Time: Inspects every element once
function findItemLinear(items, target) {
  for (let i = 0; i < items.length; i++) {
    if (items[i] === target) return i;
  }
  return -1;
}

console.log(getFirstItem([10, 20, 30]));           // 10
console.log(findItemLinear([10, 20, 30, 40], 30)); // 2
```

> [!NOTE]
> **Self-Check:** If code runs in 2 milliseconds on your laptop, can you guarantee it will run in 2 milliseconds on a customer's phone?  
> *Answer:* No. Wall-clock time varies by hardware and background load, but the Big O operation count remains identical on both machines.

### 1.1 The Three Bounds (O, Ω, Θ)

In computer science, algorithms have worst-case, best-case, and tight bounds:

```text
       Work (Steps)
          ^
          |        /  f(n) = Upper Bound: Big O -> O(g(n))
          |       /
          |      / /  Actual Algorithm Growth
          |     / /
          |    / / /  f(n) = Lower Bound: Big Omega -> Ω(g(n))
          +───/─/─/─────────────────────────────> Input Size (n)
```

* **Big O ($O$): The Upper Bound (Worst Case).** Guarantees that code will never perform worse than this curve.
* **Big Omega ($\Omega$): The Lower Bound (Best Case).** The minimum work required under the most favorable input. For example, Linear Search has a best case of $\Omega(1)$ when the target sits at index 0.
* **Big Theta ($\Theta$): The Tight Bound (Exact Match).** Used when an algorithm's best case and worst case have the exact same growth rate. For example, Merge Sort always runs in $\Theta(n \log n)$ steps.

```javascript
// Demonstration: Best vs Worst Case on the same function
function searchTarget(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}

// Best-case: Target is at index 0 -> Ω(1)
console.log(searchTarget([99, 1, 2, 3], 99)); // 0

// Worst-case: Target is missing -> O(n)
console.log(searchTarget([1, 2, 3, 4], 99));  // -1
```

---

## 2. Common Time Complexities

Time complexity measures how execution steps grow as the input size $n$ increases:

```text
Operations (Work)
  ^
  |                                 / O(2^n) - Exponential (Freezes at n > 30)
  |                                /
  |                               / O(n^2) - Quadratic (Danger: freezes at n > 10,000)
  |                              /
  |                             / / O(n log n) - Linearithmic (Fast sorting benchmark)
  |                            / /
  |                           / / / O(n) - Linear (Proportional to input)
  |                          / / /
  |                         / / / / O(log n) - Logarithmic (Cuts problem in half)
  |  ──────────────────────/─/─/─/─ O(1) - Constant (Work never grows)
  +───────────────────────────────────────────────────> Input Size (n)
```

| Big O | Name | Operations for $n = 1,000$ | Operations for $n = 100,000$ | Common Example |
| :--- | :--- | :---: | :---: | :--- |
| **$O(1)$** | Constant | 1 | 1 | Array index lookup `arr[i]`, `map.get()` |
| **$O(\log n)$** | Logarithmic | $\approx 10$ | $\approx 17$ | Binary Search in a sorted array |
| **$O(n)$** | Linear | 1,000 | 100,000 | Single loop over an array |
| **$O(n \log n)$** | Linearithmic | $\approx 10,000$ | $\approx 1,700,000$ | Merge Sort, `arr.sort()` (TimSort) |
| **$O(n^2)$** | Quadratic | 1,000,000 | **10,000,000,000** | Nested loops comparing all pairs |
| **$O(2^n)$** | Exponential | Over trillions | Freezes at $n > 30$ | Recursive Fibonacci without cache |
| **$O(n!)$** | Factorial | Astronomical | Freezes at $n > 12$ | Generating all permutations |

### 2.1 O(1) - Constant Time
Work stays identical regardless of whether $n = 5$ or $n = 5,000,000$.
```javascript
function getFirstElement(arr) {
  return arr.length > 0 ? arr[0] : null;
}
```

### 2.2 O(log n) - Logarithmic Time
The algorithm cuts the remaining problem in half on every step.
* $\log_2(8) = 3$ (divide 8 by 2 three times to reach 1).
* $\log_2(1,000,000) \approx 20$ operations.
```javascript
function binarySearch(arr, target) {
  let low = 0;
  let high = arr.length - 1;

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}
```

### 2.3 O(n) - Linear Time
Work scales in direct 1:1 proportion to input size. Looping through an array once is the classic linear pattern.
```javascript
function findSum(arr) {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    total += arr[i];
  }
  return total;
}
```

### 2.4 O(n log n) - Linearithmic Time
Optimal benchmark for comparison-based sorting (Merge Sort, QuickSort average, V8 `Array.prototype.sort()`). It divides the problem into logarithmic levels and does $O(n)$ work across each level.
- For $n = 8$: $8 \times \log_2(8) = 8 \times 3 = 24$ operations (8 items processed across 3 division levels).
- For $n = 1,000$: $1,000 \times \log_2(1,000) \approx 1,000 \times 10 \approx 10,000$ operations (only 10× more work than a single pass $O(n)$).
- For $n = 1,000,000$: $1,000,000 \times \log_2(1,000,000) \approx 1,000,000 \times 20 \approx 20,000,000$ operations (sorting 1 million items takes only ~20 million ops, finishing in ~0.2s!).
- Intuition: Think of it as "linear work ($n$) repeated across logarithmic depth ($\log n$)"—like dividing an array in half repeatedly, then merging all $n$ items at each level.
```javascript
function sortList(arr) {
  return arr.slice().sort((a, b) => a - b);
}
```

### 2.5 O(n²) - Quadratic Time
Work quadruples whenever input size doubles. Usually caused by nested loops where both loops scan up to $n$.
```javascript
function printAllPairs(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      console.log(arr[i], arr[j]);
    }
  }
}
```

### 2.6 O(2ⁿ) - Exponential Time
Work doubles with every single item added to the input ($2^{10} \approx 1,000$, but $2^{30} \approx 10^9$).
```javascript
function naiveFibonacci(n) {
  if (n <= 1) return n;
  return naiveFibonacci(n - 1) + naiveFibonacci(n - 2);
}
```

### 2.7 O(n!) - Factorial Time
Work grows by multiplying by each decreasing integer ($n \times (n-1) \times (n-2) \dots$). Crashes for $n > 12$.
- For $n = 3$: $3! = 3 \times 2 \times 1 = 6$ operations (all arrangements of `[A, B, C]`).
- For $n = 10$: $10! = 3,628,800$ operations (~3.6 million ops, finishes in ~0.03s).
- For $n = 13$: $13! = 6,227,020,800$ operations (~6.2 billion ops, takes >60 seconds $\to$ instant TLE / crash!).
- Intuition: Think of placing items into spots one by one. Spot 1 has $n$ choices, Spot 2 has $n-1$, Spot 3 has $n-2$... Total ways = $n \times (n-1) \times \dots \times 1 = n!$.
```javascript
function getPermutations(arr) {
  if (arr.length <= 1) return [arr];
  const results = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
    const subPerms = getPermutations(remaining);
    for (const sub of subPerms) {
      results.push([current, ...sub]);
    }
  }
  return results;
}
```

---

## 3. Space Complexity

Space complexity measures how much memory an algorithm allocates as input size $n$ grows.

### 3.1 Auxiliary Space vs Input Space

When analyzing memory usage, separate:
1. **Input Space:** The memory consumed by the inputs passed into the function by the caller.
2. **Auxiliary Space:** The extra temporary memory allocated by the algorithm itself to complete its task (variables, arrays, Sets, Maps).

> Space complexity refers strictly to **auxiliary space**.

```javascript
// O(1) Auxiliary Space: In-place pointer swap, zero extra arrays allocated
function reverseInPlace(arr) {
  let left = 0;
  let right = arr.length - 1;
  while (left < right) {
    const temp = arr[left];
    arr[left] = arr[right];
    arr[right] = temp;
    left++;
    right--;
  }
  return arr;
}

// O(n) Auxiliary Space: Allocates a new array proportional to input size
function reverseWithNewArray(arr) {
  const result = [];
  for (let i = arr.length - 1; i >= 0; i--) {
    result.push(arr[i]);
  }
  return result;
}

console.log(reverseInPlace([1, 2, 3]));      // [3, 2, 1]
console.log(reverseWithNewArray([1, 2, 3])); // [3, 2, 1]
```

---

## 4. The 5 Simplification Rules

When counting raw steps in code, use these 5 rules to simplify equations to their Big O form:

### 4.1 Rule 1: Drop Constants
Constants do not change the curve of growth as $n$ goes to infinity:
$$O(2n) \to O(n) \quad | \quad O(500) \to O(1) \quad | \quad O\left(\frac{n}{2}\right) \to O(n)$$

### 4.2 Rule 2: Drop Smaller Terms
Keep only the term that grows fastest as $n \to \infty$:
$$O(n^2 + 50n + 100) \to O(n^2)$$
For $n = 100,000$: $n^2 = 10^{10}$ operations, while $50n = 5 \times 10^6$ operations. $n^2$ accounts for $99.95\%$ of all work.

### 4.3 Rule 3: Keep Independent Variables Separate
If a function accepts two separate inputs `arrA` of size $a$ and `arrB` of size $b$, do not combine them into a single $n$:
```javascript
// O(a + b) Time: Consecutive loops
function printTwoArrays(arrA, arrB) {
  for (let i = 0; i < arrA.length; i++) { /* O(a) */ }
  for (let j = 0; j < arrB.length; j++) { /* O(b) */ }
}

// O(a * b) Time: Nested loops
function pairTwoArrays(arrA, arrB) {
  for (let i = 0; i < arrA.length; i++) {
    for (let j = 0; j < arrB.length; j++) { /* O(a * b) */ }
  }
}
```

### 4.4 Rule 4: Fixed Loops Are Constants
If a loop always runs a fixed number of times regardless of $n$, it counts as $O(1)$:
```javascript
function checkFixedRows(arr) {
  for (let i = 0; i < arr.length; i++) { // Runs n times
    for (let k = 0; k < 5; k++) {        // Runs exactly 5 times -> O(1)
      console.log(arr[i]);
    }
  }
  // Total work: 5 * n => O(n) linear time
}
```

### 4.5 Rule 5: Sequential Adds, Nested Multiplies
* **Sequential steps add:** Loop A followed by Loop B $\implies O(A + B)$.
* **Nested steps multiply:** Loop B inside Loop A $\implies O(A \times B)$.

---

## 5. Big O in Node.js

Node.js executes application JavaScript on a **single main thread**:

```text
Incoming Request A (50,000 items) ──> [ NODE.JS MAIN THREAD ]
                                        │
                                        └──> FREEZES for 4 seconds running O(n^2) loop!
Incoming Request B (Login)        ──> [ BLOCKED IN SOCKET QUEUE ]
GET /healthz (Kubernetes Probe)   ──> [ BLOCKED IN SOCKET QUEUE ]
```

### Event Loop Starvation
A single modern CPU core running Node.js processes about **$10^7$ basic operations per second**.
If a route handler runs an $O(n^2)$ loop over $n = 50,000$ items:
$$(50,000)^2 = 2,500,000,000 \text{ operations} \implies \frac{2.5 \times 10^9}{10^7} \approx \mathbf{250 \text{ seconds}}$$

During this freeze:
1. No other incoming HTTP requests can be accepted.
2. Timers (`setTimeout`) and database callbacks are blocked.
3. Kubernetes `/healthz` liveness probes time out, causing Kubernetes to restart your container.

```javascript
// ❌ ANTI-PATTERN: Hidden O(n^2) in route handler
app.post('/api/dedup', (req, res) => {
  const ids = req.body.ids; // 50,000 items
  // filter() runs n times; indexOf() scans from 0 to n every time = O(n^2)!
  const unique = ids.filter((id, i) => ids.indexOf(id) === i);
  res.json({ unique });
});

// ✅ CORRECT: O(n) single pass with Set
app.post('/api/dedup', (req, res) => {
  const ids = req.body.ids;
  // Set lookups and insertions run in O(1) average time = O(n) total
  const unique = Array.from(new Set(ids));
  res.json({ unique });
});
```

---

## 6. How to Calculate Complexity Step-by-Step

Let us derive the exact time and space complexity of three common code patterns line-by-line.

### 6.1 Triangular Nested Loop ($j = i$)

```javascript
function countPairs(arr) {
  const n = arr.length;
  let count = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      count++;
    }
  }

  return count;
}
```

* When $i = 0$, inner loop runs $n - 1$ times.
* When $i = 1$, inner loop runs $n - 2$ times.
* When $i = n - 2$, inner loop runs $1$ time.
* Total steps = $(n - 1) + (n - 2) + \dots + 1 = \frac{n(n - 1)}{2} = \frac{n^2 - n}{2}$.
* Drop non-dominant terms and constants: $\mathbf{O(n^2) \text{ Time}}$, $\mathbf{O(1) \text{ Space}}$.

### 6.2 Step Multiplication Loop ($i *= 2$)

```javascript
function logStep(n) {
  let count = 0;
  for (let i = 1; i < n; i = i * 2) {
    count++;
  }
  return count;
}
```

* In each iteration, $i$ takes values: $1, 2, 4, 8, \dots, 2^k$.
* The loop terminates when $2^k \ge n \implies k = \log_2 n$.
* Total steps: $\mathbf{O(\log n) \text{ Time}}$, $\mathbf{O(1) \text{ Space}}$.

### 6.3 Independent Multi-Variable Loops

```javascript
function processMatrix(matrix, list) {
  // list length = k, matrix rows = r, matrix cols = c
  let total = 0;

  for (let i = 0; i < list.length; i++) { // Runs k times
    total += list[i];
  }

  for (let r = 0; r < matrix.length; r++) {       // Runs r times
    for (let c = 0; c < matrix[r].length; c++) { // Runs c times
      total += matrix[r][c];
    }
  }

  return total;
}
```

* First loop runs $k$ times: $O(k)$.
* Second nested loop runs $r \times c$ times: $O(r \times c)$.
* Total work: $\mathbf{O(k + r \cdot c) \text{ Time}}$, $\mathbf{O(1) \text{ Space}}$.

---

## 7. Common Traps and Edge Cases

* **Built-in methods hide linear scans:** Methods like `indexOf()`, `includes()`, `slice()`, and `splice()` scan the array. Calling `indexOf()` inside `filter()` creates an unintended $O(n^2)$ loop.
* **Array `shift()` and `unshift()` are $O(n)$:** Adding or removing from the start of an array shifts all following elements in RAM. Calling `unshift()` inside a loop produces $O(n^2)$ time.
* **String concatenation in loops:** Strings in JavaScript are immutable. Writing `str += char` copies all previous characters into a new string on every turn ($O(n^2)$ memory churn). Use an array buffer and call `.join("")` once at the end ($O(n)$).

---

## 8. Summary & Complexity Cheat Sheet

| Code Pattern | Time Complexity | Auxiliary Space | Reason |
| :--- | :---: | :---: | :--- |
| `arr[i]` / `map.get(k)` | **$O(1)$** | **$O(1)$** | Direct memory offset lookup |
| `for (let i = 0; i < n; i++)` | **$O(n)$** | **$O(1)$** | Single linear pass |
| `for (let i = 1; i < n; i *= 2)` | **$O(\log n)$** | **$O(1)$** | Halving search space / doubling index |
| `for i < n { for j < n }` | **$O(n^2)$** | **$O(1)$** | Nested loops over same input |
| `for i < n { for j = i < n }` | **$O(n^2)$** | **$O(1)$** | Gauss series: $n(n - 1) / 2$ |
| `arr.shift()` inside loop | **$O(n^2)$** | **$O(1)$** | Linear element shifting on each iteration |
| `indexOf()` inside `filter()` | **$O(n^2)$** | **$O(n)$** | Nested linear searches |

---

## 9. Common Questions & Analysis

### 1. What does Big O measure, and why do we drop constants like the 3 in O(3n)?

**Answer:** Big O measures how an algorithm's operation count and memory scale as input size $n$ grows toward infinity. It does not measure wall-clock seconds because execution time fluctuates based on CPU speed, OS background tasks, memory garbage collection, and JIT compilation.

Constants are dropped because they do not change the fundamental mathematical growth curve. Whether an algorithm takes $n$ steps or $3n$ steps, doubling the input doubles the work in both cases (both scale linearly). Upgrading to a CPU that is 3 times faster makes $O(3n)$ perform like $O(n)$, but no hardware can bridge the gap between $O(n)$ and $O(n^2)$ at scale.

---

### 2. What is the time and space complexity of this loop, and how many times does it run for n = 16?

```javascript
function mystery(n) {
  let count = 0;
  for (let i = 1; i < n; i *= 2) {
    count++;
  }
  return count;
}
```

**Answer:**
* **Time Complexity:** $O(\log n)$.
* **Auxiliary Space Complexity:** $O(1)$.
* **Run count for $n = 16$:** The loop executes for $i = 1, 2, 4, 8$. When $i$ reaches 16, $16 < 16$ is false and the loop terminates. The loop body runs **exactly 4 times** ($\log_2 16 = 4$).

---

### 3. A developer deduplicates an array of 100,000 items with filter and indexOf, but the endpoint freezes. Why?

**Answer:** `.filter()` iterates $n$ times. Inside, `.indexOf()` scans the array from index 0 ($n$ operations). This creates an $O(n \times n) = O(n^2)$ loop. For $n = 100,000$, this executes up to $10^{10}$ comparisons. Because Node.js runs JavaScript on a single thread, this synchronous computation blocks the event loop for seconds, causing incoming HTTP requests to time out.

The fix is using a `Set`:
```javascript
const unique = Array.from(new Set(arr));
```
`Set` lookups run in $O(1)$ time, reducing the total runtime to **$O(n)$ time** and completing in about 10 milliseconds.

---

### 4. How does an unoptimized O(n²) synchronous loop impact a production Node.js service?

**Answer:** Node.js executes JavaScript on a single main thread. When a route handler executes an $O(n^2)$ synchronous loop on a large payload:
1. **Event Loop Starvation:** No other event loop callbacks, timers, or network I/O events can execute while the thread is occupied.
2. **Cascading Timeouts:** Upstream proxies (Nginx, AWS ALB) return `504 Gateway Timeout` to other users waiting in the TCP queue.
3. **Container Restarts:** The Kubernetes liveness probe (`GET /healthz`) fails to respond within its deadline, causing Kubernetes to terminate and restart the container.
4. **Remediation:** Optimize to $O(n)$ or $O(n \log n)$, validate payload sizes with middleware, or offload heavy CPU computation to `node:worker_threads`.

---

<nav aria-label="Lecture navigation">

[Roadmap](../javascript-dsa-roadmap.md) | [Next: Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md)

</nav>
