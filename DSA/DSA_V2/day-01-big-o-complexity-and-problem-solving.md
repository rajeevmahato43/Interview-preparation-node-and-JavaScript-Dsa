# Day 01: Big O Complexity & Algorithmic Problem Solving

<nav aria-label="Lecture navigation">

[Roadmap](../javascript-dsa-roadmap.md) | [Next: Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md)

</nav>

---

## 1. What is Big O

Big O tells us how the number of steps and the memory used by our code grow as our input size $n$ gets larger.

It does **not** measure execution time in seconds. Measuring time in seconds using `Date.now()` or `console.time()` is not reliable. A computer might be fast or slow, other programs might be running in the background, and Node.js might pause to clean up memory.

Instead, Big O counts the **number of basic steps** the computer must do:
1. Setting a variable (`let x = 10`)
2. Doing math (`a + b`)
3. Comparing two values (`i < n`)
4. Reading an item from an array or object (`arr[i]`)

> When the input size $n$ doubles, how much more work does our code have to do?

To picture this in real life, imagine looking for one paper receipt in a pile of $n$ receipts:
* **Linear Search ($O(n)$):** The receipts are in a messy pile. You check them one by one. If there are 10 receipts, you check up to 10 times. If there are 1,000,000 receipts, you might have to check up to 1,000,000 times.
* **Binary Search ($O(\log n)$):** The receipts are sorted by date in filing cabinet drawers. You open the middle drawer first. If your target date is earlier, you can ignore the whole second half immediately. For 1,000,000 receipts, you can find the right one in only about 20 checks.
* **Instant Lookup ($O(1)$):** Each receipt has an ID number and sits in a small slot with that exact number on it. You walk directly to slot #42 and pick it up in 1 step.

```javascript
// O(1) Constant Time: Takes 1 step no matter how big the array is
function getFirstItem(items) {
  return items.length > 0 ? items[0] : null;
}

// O(n) Linear Time: Checks every element once
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
> **Self-Check:** If code runs in 2 milliseconds on your laptop, will it always run in 2 milliseconds on a user's phone?  
> *Answer:* No. Wall-clock time changes with hardware and background load, but the Big O step count stays the same on every machine.

### 1.1 The Three Bounds (O, Ω, Θ)

In computer science, algorithms have worst-case, best-case, and exact bounds:

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

* **Big O ($O$): The Worst Case (Upper Bound).** This tells us the maximum work our code will ever have to do. It guarantees our code will never run slower than this line.
* **Big Omega ($\Omega$): The Best Case (Lower Bound).** This tells us the smallest amount of work our code can do when we get lucky. For example, Linear Search has a best case of $\Omega(1)$ if the item we want happens to be at index 0.
* **Big Theta ($\Theta$): The Exact Match (Tight Bound).** We use this when the best case and worst case take the same number of steps. For example, Merge Sort always takes $\Theta(n \log n)$ steps.

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

Time complexity tells us how the number of steps grows as the input size $n$ increases:

```text
Operations (Work)
  ^
  |                                 / O(2^n) - Exponential (Freezes at n > 30)
  |                                /
  |                               / O(n^2) - Quadratic (Freezes at n > 10,000)
  |                              /
  |                             / / O(n log n) - Linearithmic (Fast sorting benchmark)
  |                            / /
  |                           / / / O(n) - Linear (Grows directly with input)
  |                          / / /
  |                         / / / / O(log n) - Logarithmic (Cuts problem in half)
  |  ──────────────────────/─/─/─/─ O(1) - Constant (Work never grows)
  +───────────────────────────────────────────────────> Input Size (n)
```

| Big O | Name | Operations for $n = 1,000$ | Operations for $n = 100,000$ | Common Example |
| :--- | :--- | :---: | :---: | :--- |
| **$O(1)$** | Constant | 1 | 1 | Reading an array element `arr[i]`, `map.get()` |
| **$O(\log n)$** | Logarithmic | $\approx 10$ | $\approx 17$ | Binary Search in a sorted array |
| **$O(n)$** | Linear | 1,000 | 100,000 | A single loop through an array |
| **$O(n \log n)$** | Linearithmic | $\approx 10,000$ | $\approx 1,700,000$ | Merge Sort, `arr.sort()` |
| **$O(n^2)$** | Quadratic | 1,000,000 | **10,000,000,000** | Nested loops comparing all pairs |
| **$O(2^n)$** | Exponential | Over trillions | Freezes at $n > 30$ | Recursive Fibonacci without caching |
| **$O(n!)$** | Factorial | Too big to count | Freezes at $n > 12$ | Generating all permutations of a list |

### 2.1 O(1) - Constant Time
The work stays the same whether $n = 5$ or $n = 5,000,000$.
```javascript
function getFirstElement(arr) {
  return arr.length > 0 ? arr[0] : null;
}
```

### 2.2 O(log n) - Logarithmic Time
The algorithm cuts the remaining work in half at every step.
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
The work grows directly with the size of the input. Going through an array once is the classic linear pattern.
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
This is the standard speed for good sorting algorithms (like Merge Sort and JavaScript's `arr.sort()`). It splits the input into levels of halves ($\log n$) and does a full pass of work ($n$) across each level.
- For $n = 8$: $8 \times \log_2(8) = 8 \times 3 = 24$ operations.
- For $n = 1,000$: $1,000 \times \log_2(1,000) \approx 1,000 \times 10 \approx 10,000$ operations (only 10 times more work than a single loop).
- For $n = 1,000,000$: $1,000,000 \times \log_2(1,000,000) \approx 20,000,000$ operations. Sorting 1 million items takes only about 20 million steps and finishes in around 0.2 seconds.
```javascript
function sortList(arr) {
  return arr.slice().sort((a, b) => a - b);
}
```

### 2.5 O(n²) - Quadratic Time
The work quadruples every time the input size doubles. This usually happens when you have nested loops where both loops go through the list.
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
The work doubles with every single item you add to the input ($2^{10} \approx 1,000$, but $2^{30} \approx 10^9$).
```javascript
function naiveFibonacci(n) {
  if (n <= 1) return n;
  return naiveFibonacci(n - 1) + naiveFibonacci(n - 2);
}
```

### 2.7 O(n!) - Factorial Time
The work grows by multiplying by each smaller number ($n \times (n-1) \times (n-2) \dots$). It will crash or freeze for $n > 12$.
- For $n = 3$: $3! = 3 \times 2 \times 1 = 6$ operations (all arrangements of `[A, B, C]`).
- For $n = 10$: $10! = 3,628,800$ operations (about 3.6 million steps, finishes in ~0.03 seconds).
- For $n = 13$: $13! = 6,227,020,800$ operations (over 6 billion steps, freezes for over a minute).
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

Space complexity measures how much memory our code uses as the input size $n$ grows.

### 3.1 Auxiliary Space vs Input Space

When looking at memory, we separate two things:
1. **Input Space:** The memory used to hold the data passed into the function.
2. **Auxiliary Space:** The extra temporary memory our code creates to solve the problem (like new variables, arrays, Sets, or Maps).

> In technical interviews, space complexity almost always refers strictly to **auxiliary space** (the extra memory we used).

```javascript
// O(1) Auxiliary Space: Swaps items in place, creates no extra arrays
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

// O(n) Auxiliary Space: Creates a new array with the same size as input
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

When counting steps in code, use these 5 simple rules to clean up your equation into its final Big O form:

### 4.1 Rule 1: Drop Constants
Constant numbers do not change how the curve bends as $n$ becomes very large:
$$O(2n) \to O(n) \quad | \quad O(500) \to O(1) \quad | \quad O\left(\frac{n}{2}\right) \to O(n)$$

### 4.2 Rule 2: Drop Smaller Terms
Keep only the term that grows fastest as $n$ gets huge:
$$O(n^2 + 50n + 100) \to O(n^2)$$
For $n = 100,000$: $n^2$ is $10^{10}$ steps, while $50n$ is only $5 \times 10^6$ steps. The $n^2$ part is more than $99.95\%$ of all the work.

### 4.3 Rule 3: Keep Independent Variables Separate
If a function takes two different arrays `arrA` of size $a$ and `arrB` of size $b$, do not mix them together into a single $n$:
```javascript
// O(a + b) Time: Loops run one after another
function printTwoArrays(arrA, arrB) {
  for (let i = 0; i < arrA.length; i++) { /* O(a) */ }
  for (let j = 0; j < arrB.length; j++) { /* O(b) */ }
}

// O(a * b) Time: One loop inside the other
function pairTwoArrays(arrA, arrB) {
  for (let i = 0; i < arrA.length; i++) {
    for (let j = 0; j < arrB.length; j++) { /* O(a * b) */ }
  }
}
```

### 4.4 Rule 4: Fixed Loops Are Constants
If a loop always runs a fixed number of times (like 5 times) no matter how big $n$ is, it counts as $O(1)$:
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
* **Loops that run one after another add up:** Loop A followed by Loop B $\implies O(A + B)$.
* **Loops inside other loops multiply:** Loop B inside Loop A $\implies O(A \times B)$.

---

## 5. Big O in Node.js

Node.js runs our JavaScript code on a **single main thread**:

```text
Incoming Request A (50,000 items) ──> [ NODE.JS MAIN THREAD ]
                                        │
                                        └──> FREEZES for seconds running O(n^2) loop!
Incoming Request B (Login)        ──> [ WAITING IN SOCKET QUEUE ]
GET /healthz (Kubernetes Probe)   ──> [ WAITING IN SOCKET QUEUE ]
```

### Event Loop Starvation
A single modern CPU core running Node.js can do about **$10^7$ basic operations per second**.  
If an API route runs a slow $O(n^2)$ loop over $n = 50,000$ items:
$$(50,000)^2 = 2,500,000,000 \text{ operations} \implies \frac{2.5 \times 10^9}{10^7} \approx \mathbf{250 \text{ seconds}}$$

While the server is frozen:
1. No new HTTP requests can be accepted.
2. Timers (`setTimeout`) and database responses cannot run.
3. Health check requests (`/healthz`) time out, causing Kubernetes to shut down and restart your app container.

```javascript
// ❌ ANTI-PATTERN: Hidden O(n^2) inside an API handler
app.post('/api/dedup', (req, res) => {
  const ids = req.body.ids; // 50,000 items
  // filter() runs n times; indexOf() scans the whole array every time = O(n^2)!
  const unique = ids.filter((id, i) => ids.indexOf(id) === i);
  res.json({ unique });
});

// ✅ CORRECT: O(n) single pass with Set
app.post('/api/dedup', (req, res) => {
  const ids = req.body.ids;
  // Set lookups and additions take O(1) average time = O(n) total
  const unique = Array.from(new Set(ids));
  res.json({ unique });
});
```

---

## 6. How to Calculate Complexity Step-by-Step

Let us find the exact time and space complexity of three common code examples line-by-line.

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

* When $i = 0$, the inner loop runs $n - 1$ times.
* When $i = 1$, the inner loop runs $n - 2$ times.
* When $i = n - 2$, the inner loop runs $1$ time.
* Total steps = $(n - 1) + (n - 2) + \dots + 1 = \frac{n(n - 1)}{2} = \frac{n^2 - n}{2}$.
* Drop the smaller terms and constants: $\mathbf{O(n^2) \text{ Time}}$, $\mathbf{O(1) \text{ Space}}$.

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

* In each turn of the loop, $i$ doubles: $1, 2, 4, 8, \dots, 2^k$.
* The loop stops when $2^k \ge n \implies k = \log_2 n$.
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

* **Built-in methods hide linear scans:** Methods like `indexOf()`, `includes()`, `slice()`, and `splice()` search through the array. Calling `indexOf()` inside `filter()` makes an accidental $O(n^2)$ loop.
* **Array `shift()` and `unshift()` are $O(n)$:** Adding or removing from the start of an array moves every other item in memory. Calling `unshift()` inside a loop creates slow $O(n^2)$ time.
* **Adding to strings in loops:** Strings in JavaScript cannot be changed once created. Writing `str += char` copies all previous characters into a brand-new string on every loop turn ($O(n^2)$ memory churn). Use an array and call `.join("")` once at the end ($O(n)$).

---

## 8. Summary & Complexity Cheat Sheet

| Code Pattern | Time Complexity | Auxiliary Space | Reason |
| :--- | :---: | :---: | :--- |
| `arr[i]` / `map.get(k)` | **$O(1)$** | **$O(1)$** | Direct memory lookup |
| `for (let i = 0; i < n; i++)` | **$O(n)$** | **$O(1)$** | Single pass through the list |
| `for (let i = 1; i < n; i *= 2)` | **$O(\log n)$** | **$O(1)$** | Cutting search space in half / doubling index |
| `for i < n { for j < n }` | **$O(n^2)$** | **$O(1)$** | Nested loops over the same list |
| `for i < n { for j = i < n }` | **$O(n^2)$** | **$O(1)$** | Number triangle: $n(n - 1) / 2$ |
| `arr.shift()` inside a loop | **$O(n^2)$** | **$O(1)$** | Shifting all array items on every turn |
| `indexOf()` inside `filter()` | **$O(n^2)$** | **$O(n)$** | Nested linear scans |

---

## 9. Common Questions & Analysis

### 1. What does Big O measure, and why do we drop constants like the 3 in O(3n)?

**Answer:** Big O measures how an algorithm's steps and memory grow as the input size $n$ gets larger toward infinity. It does not measure seconds because clock time changes depending on CPU speed, background programs, and garbage collection.

We drop constants because they do not change how the curve bends. Whether code takes $n$ steps or $3n$ steps, doubling the input doubles the work in both cases (both grow linearly). A faster computer can run $O(3n)$ like $O(n)$, but no computer can make an $O(n^2)$ algorithm run fast when $n$ is very large.

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
* **Run count for $n = 16$:** The loop runs for $i = 1, 2, 4, 8$. When $i$ reaches 16, $16 < 16$ is false and the loop stops. The inside of the loop runs **exactly 4 times** ($\log_2 16 = 4$).

---

### 3. A developer deduplicates an array of 100,000 items with filter and indexOf, but the endpoint freezes. Why?

**Answer:** `.filter()` loops $n$ times. Inside it, `.indexOf()` searches the array from index 0 ($n$ operations). This makes an $O(n \times n) = O(n^2)$ nested loop. For $n = 100,000$, this does up to $10^{10}$ comparisons. Because Node.js runs on a single main thread, this loop blocks everything else for seconds, causing web requests to time out.

The fix is to use a `Set`:
```javascript
const unique = Array.from(new Set(arr));
```
`Set` lookups take fast $O(1)$ average time, bringing the total time down to **$O(n)$** and finishing in about 10 milliseconds.

---

### 4. How does an unoptimized O(n²) synchronous loop impact a production Node.js service?

**Answer:** Node.js runs JavaScript on a single thread. When an API route runs a slow $O(n^2)$ loop on large data:
1. **Thread Freezes:** No other incoming requests, timers, or database callbacks can run while the thread is busy.
2. **Timeouts:** Other users get `504 Gateway Timeout` errors because their requests are stuck waiting in line.
3. **Container Restarts:** The server's health check (`GET /healthz`) cannot respond in time, so Kubernetes thinks the container is dead and restarts it.
4. **Fix:** Optimize the code to $O(n)$ or $O(n \log n)$, check input sizes early, or move heavy math to worker threads (`worker_threads`).

---

<nav aria-label="Lecture navigation">

[Roadmap](../javascript-dsa-roadmap.md) | [Next: Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md)

</nav>
