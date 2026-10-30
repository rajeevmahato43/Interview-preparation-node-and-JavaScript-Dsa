# Day 18: Recursion Fundamentals & Call Stack

<nav aria-label="Lecture navigation">

[Previous: Binary Search on Solution Space](day-17-binary-search-on-solution-space.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Merge Sort & Quick Sort](day-19-merge-sort-and-quick-sort.md)

</nav>

---

## 1. Recursion Mechanics Foundation

**Recursion** is an algorithmic technique where a function solves a computational problem by delegating smaller, simpler instances of the **exact same problem** to itself. This self-delegation repeats until the subproblem becomes so small that it can be answered immediately without further delegation; this terminating condition is called the **Base Case**.

Every recursive execution consists of two distinct lifecycle phases:
1. **The Winding Phase (Descent)**: The function invokes itself with smaller inputs. New stack frames are pushed onto the CPU call stack, waiting for their child calls to return.
2. **The Unwinding Phase (Ascent)**: The base case is reached and returns a concrete value. Stack frames pop one by one in reverse order (LIFO), combining returned values and bubbling the final result back to the caller.

```text
THE TWO PHASES OF RECURSION (Factorial 3):

Phase 1: Winding (Pushing Stack Frames)
call factorial(3)
  └─► call factorial(2)
        └─► call factorial(1)  [Base Case reached! Returns 1]

Phase 2: Unwinding (Popping Stack Frames and Computing Results)
        ┌─► returns 1
  ┌─────┴─► computes 2 * 1 = 2, returns 2
  └───────► computes 3 * 2 = 6, returns 6
```

Imagine a set of painted wooden Russian Matryoshka nesting dolls:
- You want to find the tiny gold coin hidden inside.
- You open Doll 5 (the outermost doll). Inside sits Doll 4.
- You open Doll 4, then Doll 3, then Doll 2.
- Finally, you reach Doll 1 (The **Base Case**). It is a solid wooden piece with no seams; it cannot be opened. You inspect it and find the coin.
- Now comes the mandatory return trip: You cannot leave the room with disassembled pieces on the floor. You must close Doll 2 inside Doll 3, close Doll 3 inside Doll 4, and reassemble Doll 5 in reverse order (**Stack Unwinding**)!

A basic recursive countdown and factorial in JavaScript:

```javascript
// Baseline countdown demonstrating base case and recursive step
function countdown(n) {
  // 1. Base Case: Stop when n hits 0
  if (n <= 0) {
    console.log("Blastoff!");
    return;
  }

  // 2. Work Phase: Print current number
  console.log(n);

  // 3. Recursive Call: Move closer to base case
  countdown(n - 1);
}

countdown(3);
// Output:
// 3
// 2
// 1
// Blastoff!
```

### 1.1 The Anatomy of Every Recursive Function

Every valid recursive algorithm must define three non-negotiable components:

1. **Base Case Guard**: An explicit conditional check at the very beginning of the function that returns a concrete result without making another recursive call.
2. **Work Phase**: The local computation performed at the current frame level (either before the recursive call or after the call returns).
3. **State Reduction (Recursive Step)**: Invoking the function with an input that is strictly smaller, simpler, or closer to the base case ($n - 1$, $\lfloor n / 2 \rfloor$, `node.next`).

```text
┌────────────────────────────────────────────────────────┐
│             RECURSIVE FUNCTION SKELETON                │
├────────────────────────────────────────────────────────┤
│ function recurse(input) {                              │
│   // 1. Base Case Guard                                │
│   if (isBaseCase(input)) {                             │
│     return baseResult;                                 │
│   }                                                    │
│                                                        │
│   // 2. Work & Recursive Step                          │
│   const smallerInput = reduce(input);                  │
│   const childResult = recurse(smallerInput);           │
│                                                        │
│   // 3. Combine / Unwind                               │
│   return combine(input, childResult);                  │
│ }                                                      │
└────────────────────────────────────────────────────────┘
```

> [!NOTE]
> Self-Check: What happens if the recursive step does not strictly move closer to the base case (e.g. `countdown(n)` without `- 1`)?
> Answer: The base case will never be reached. Stack frames accumulate continuously until exhausting V8's call stack limit, throwing `RangeError: Maximum call stack size exceeded`.

### 1.2 Call Stack Frames & V8 Engine Limits

What physically happens in Node.js when a function calls itself?

1. **Stack Frame Allocation**:
   - The CPU decrements the Stack Pointer register (`RSP`).
   - It pushes the **Return Address** (the instruction pointer in the caller function) onto the thread stack.
   - It pushes the **Base Pointer** (`RBP`) and allocates memory for local parameters and variables.
2. **Stack Frame Footprint**:
   - Each stack frame in V8 consumes **48 to 80 bytes** of raw stack memory.
   - 10,000 frames $\times 64\text{ bytes} \approx 640\text{ KB}$.
3. **The 10,000 Frame Ceiling**:
   - Node.js threads allocate a bounded stack memory segment (typically **1 MB**).
   - If recursion exceeds ~10,000 nested calls, V8 immediately throws `RangeError: Maximum call stack size exceeded` to protect OS process memory from corrupting adjacent thread spaces.
4. **Tail Call Optimization (TCO) in Node.js**:
   - Modern JavaScript engines (V8 in Node.js/Chrome) do **not** optimize tail recursion.
   - V8 chose not to support TCO because reusing stack frames erases historical calling contexts from `error.stack` and `console.trace()`, making debugging production crashes extremely difficult.
   - Therefore, any linear recursion with $n > 5,000$ must be converted into an iterative `while` or `for` loop.

### 1.3 Recursion Complexity Reference Table

| Recurrence Form | Recurrence Relation | Time Complexity | Stack Space | Canonical Example |
| :--- | :--- | :---: | :---: | :--- |
| **Linear Decrement** | $T(n) = T(n - 1) + O(1)$ | **$O(n)$** | $O(n)$ | Factorial, String Reversal |
| **Logarithmic Halving** | $T(n) = T(n / 2) + O(1)$ | **$O(\log n)$** | $O(\log n)$ | Binary Search, Fast Pow |
| **Divide and Combine** | $T(n) = 2T(n / 2) + O(n)$| **$O(n \log n)$** | $O(\log n)$ | Merge Sort |
| **Branching Binary** | $T(n) = 2T(n - 1) + O(1)$| **$O(2^n)$** | $O(n)$ | Naive Fibonacci |

---

## 2. Recursion Patterns & Invariants

### 2.1 Pattern Family

Recursive algorithms divide into three core architectural categories:

- **Divide and Conquer**: Splitting the input into independent halves, solving each half recursively, and merging the outputs in logarithmic stack depth (e.g. Fast Exponentiation, Merge Sort).
- **Two-Pointer Inward Recursion**: Operating symmetrically on the edges of an array or linked list, swapping or validating boundary items and recursing on the interior subproblem.
- **Structural Recursion**: Traversing nested, arbitrarily deep hierarchical structures (deeply nested JSON, arrays of arrays, DOM nodes) by dispatching child calls whenever an element is a sub-container.

### 2.2 Pattern Recognition Table

| Problem Trigger / Keywords | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| "Calculate $x^n$ in logarithmic time" | Halve exponent repeatedly | Fast Binary Exponentiation ($O(\log n)$) |
| "Reverse string / array recursively" | Symmetrical in-place modification | Two-pointer inward recursion (`left + 1, right - 1`) |
| "Flatten deeply nested arrays / objects" | Unknown nesting depth traversal | Structural recursion with shared accumulator |
| "Swap nodes in pairs (Linked List)" | Reconnect local node pairs recursively | Head swap, recurse on `head.next.next` |
| "Evaluate mathematical fractal / nested sequence"| Self-similar subproblem resolution | Base case at depth 0, unwinding calculation |

### 2.3 When to Use vs When NOT to Use

- **When to Use**:
  - The problem naturally divides into identical subproblems of smaller size.
  - The recursion tree has logarithmic depth ($O(\log n)$), keeping stack memory $\le 30$ frames for $n = 10^9$.
  - Traversing hierarchical trees, graphs, or nested data structures (DFS).
  - Backtracking state spaces where state rollback is required upon return.

- **When NOT to Use**:
  - The problem is a simple linear scan with $n > 5,000$ iterations (use an iterative `for`/`while` loop).
  - Overlapping subproblems are repeatedly recomputed without memoization (causes $O(2^n)$ explosion; use **Dynamic Programming**).
  - The call stack depth could exceed V8's 10,000 frame ceiling.

### 2.4 The $10^7$ / 10,000 Call Stack Limit Rule

In standard loops, you can execute $10^7$ operations in $15\text{ms}$. In recursion, you are strictly bounded by **call stack depth**:
- An $O(n)$ linear recursion crashes Node.js when $n \ge 10,000$.
- An $O(\log n)$ divide-and-conquer recursion takes only $\approx 30$ stack frames for $n = 10^9$, using less than $2\text{ KB}$ of stack memory.
- If $n$ is large and reduction is by $n - 1$, convert the algorithm to an iterative loop or manage an explicit heap-allocated stack array.

---

## 3. Problem Walkthroughs

### 3.1 Pow(x, n)

#### 3.1.1 Problem Statement
Implement `myPow(x, n)`, which calculates `x` raised to the power `n` ($x^n$).

The exponent `n` can be a positive integer, negative integer, or zero.

You must solve this with **$O(\log n)$ runtime complexity**.

```text
Input: x = 2.00000, n = 10  ──> Output: 1024.00000
Input: x = 2.10000, n = 3   ──> Output: 9.26100
Input: x = 2.00000, n = -2  ──> Output: 0.25000 (1 / 2^2 = 1 / 4)
```

#### 3.1.2 How to Think About It
How do you calculate $2^{10}$ without performing 10 individual multiplications?
- Notice that $2^{10} = (2^5) \times (2^5) = (2^5)^2$.
- To calculate $2^5$, since 5 is odd, pull out one factor of 2: $2^5 = 2 \times 2^4 = 2 \times (2^2)^2$.
- To calculate $2^2$: $2^2 = (2^1)^2 = (2 \times 2^0)^2 = (2 \times 1)^2 = 4$.

By calculating the half-power $y = x^{\lfloor n / 2 \rfloor}$ **once** and squaring it, the exponent halves on every step:

$$n = 1000 \to 500 \to 250 \to 125 \to 62 \to 31 \to 15 \to 7 \to 3 \to 1 \to 0$$

Calculating $2^{1000}$ takes only **10 multiplications** instead of 1,000!

```text
RECURSION TREE FOR myPow(2, 10):
fastPow(2, 10)
  └─► half = fastPow(2, 5)
        └─► half = fastPow(2, 2)
              └─► half = fastPow(2, 1)
                    └─► half = fastPow(2, 0) ──► Returns 1 (Base Case)
                    └─► 1 is odd: 2 * 1 * 1 = 2
              └─► 2 is even: 2 * 2 = 4
        └─► 5 is odd: 2 * 4 * 4 = 32
  └─► 10 is even: 32 * 32 = 1024
```

#### 3.1.3 Brute Force Approach & Bottleneck
Linearly multiplying $x$ in a loop $n$ times:

```javascript
function myPowBrute(x, n) {
  if (n < 0) { x = 1 / x; n = -n; }
  let res = 1;
  for (let i = 0; i < n; i++) res *= x;
  return res;
}
```

The bottleneck is $O(n)$ linear iterations. When $n = 2^{31} - 1 \approx 2.14 \times 10^9$, this loop executes over two billion multiplications, freezing the Node.js process and causing immediate timeout.

#### 3.1.4 The Pattern Insight
Use **Binary Exponentiation (Divide and Conquer)**:
1. Base case: $x^0 = 1$.
2. For negative exponents: $x^{-n} = (1 / x)^n$.
3. Compute $y = \text{fastPow}(x, \lfloor n / 2 \rfloor)$ once.
4. If $n$ is even: return $y \times y$.
5. If $n$ is odd: return $x \times y \times y$.

This halves the exponent on every step, completing in $O(\log n)$ time.

#### 3.1.5 Pseudocode
```text
function myPow(x, n):
  if n == 0: return 1.0
  if n < 0:
    x = 1.0 / x
    n = -n

  function fastPow(base, exp):
    if exp == 0: return 1.0
    half = fastPow(base, floor(exp / 2))
    if exp % 2 == 0:
      return half * half
    else:
      return base * half * half

  return fastPow(x, n)
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Divide-and-conquer exponentiation in O(log n) time
function myPow(x, n) {
  // Base case
  if (n === 0) return 1;

  // Handle negative exponent: x^(-n) = (1/x)^n
  if (n < 0) {
    x = 1 / x;
    n = -n;
  }

  function fastPow(base, exp) {
    // Base Case
    if (exp === 0) return 1;

    // Recurse on half exponent (compute ONCE)
    const half = fastPow(base, Math.floor(exp / 2));

    // If exp is even: half * half
    if (exp % 2 === 0) {
      return half * half;
    } 
    // If exp is odd: base * half * half
    else {
      return base * half * half;
    }
  }

  return fastPow(x, n);
}

// Example runs
console.log(myPow(2.0, 10)); // 1024
console.log(myPow(2.1, 3));  // 9.261000000000001
console.log(myPow(2.0, -2)); // 0.25
console.log(myPow(1.0, 2147483647)); // 1 (Instantaneous calculation)
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Invoking recursive call twice explodes into O(n) calls
function slowPow(x, n) {
  if (n === 0) return 1;
  // BUG: Calling fastPow twice branches into 2^(log n) = n recursive calls!
  return slowPow(x, Math.floor(n / 2)) * slowPow(x, Math.floor(n / 2));
}
```

#### 3.1.8 Complexity Derivation
- **Time Complexity**: $O(\log n)$. The exponent is halved on every recursive call. For a 32-bit signed integer, the maximum recursion depth is at most 32 steps.
- **Auxiliary Space Complexity**: $O(\log n)$. The execution call stack holds at most $\lceil \log_2 n \rceil$ frames.

---

### 3.2 Reverse a String Recursively

#### 3.2.1 Problem Statement
Write a function that reverses a character array `s` in-place using a recursive helper function with $O(1)$ auxiliary memory (excluding call stack space).

```text
Input: s = ["h", "e", "l", "l", "o"]        ──> Output: ["o", "l", "l", "e", "h"]
Input: s = ["H", "a", "n", "n", "a", "H"]  ──> Output: ["h", "a", "n", "n", "a", "H"]
```

#### 3.2.2 How to Think About It
Imagine cards laid out in a row on a desk: `['h', 'e', 'l', 'l', 'o']`.
- Swap the outermost cards: index 0 (`'h'`) and index 4 (`'o'`).
- The remaining task is to reverse the inner cards: `['e', 'l', 'l']`.
- Swap index 1 (`'e'`) and index 3 (`'l'`).
- The remaining task is the single card at index 2 (`'l'`).
- A single card (or an empty slice) is already reversed (**The Base Case**). Stop and return!

```text
Trace on ['h', 'e', 'l', 'l', 'o']:
Call 1: left = 0, right = 4 -> Swap 'h' and 'o' -> ['o', 'e', 'l', 'l', 'h']
Call 2: left = 1, right = 3 -> Swap 'e' and 'l' -> ['o', 'l', 'l', 'e', 'h']
Call 3: left = 2, right = 2 -> left >= right (Base Case) -> Return!
```

#### 3.2.3 Brute Force Approach & Bottleneck
Allocating a new array and copying elements in reverse:

```javascript
function reverseStringCopy(s) {
  const result = [];
  for (let i = s.length - 1; i >= 0; i--) {
    result.push(s[i]);
  }
  return result;
}
```

The bottleneck is $O(n)$ auxiliary heap allocation. Creating a secondary array copies memory when items can be swapped in-place.

#### 3.2.4 The Pattern Insight
Use **Two-Pointer Inward Recursion**:
- Maintain `left` and `right` indices.
- Base case: `if (left >= right) return;`.
- Swap `s[left]` and `s[right]`.
- Recurse inward on `(left + 1, right - 1)`.

#### 3.2.5 Pseudocode
```text
function reverseString(s):
  helper(left, right):
    if left >= right:
      return

    temp = s[left]
    s[left] = s[right]
    s[right] = temp

    helper(left + 1, right - 1)

  helper(0, length(s) - 1)
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: In-place two-pointer recursive string reversal
function reverseString(s) {
  function helper(left, right) {
    // Base Case: Pointers meet or cross in the middle
    if (left >= right) return;

    // Swap outermost elements
    const temp = s[left];
    s[left] = s[right];
    s[right] = temp;

    // Recurse on the remaining interior slice
    helper(left + 1, right - 1);
  }

  helper(0, s.length - 1);
  return s;
}

// Example runs
const chars1 = ["h", "e", "l", "l", "o"];
reverseString(chars1);
console.log(chars1); // [ 'o', 'l', 'l', 'e', 'h' ]

const chars2 = ["H", "a", "n", "n", "a", "H"];
reverseString(chars2);
console.log(chars2); // [ 'h', 'a', 'n', 'n', 'a', 'H' ]
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: String substring allocations in recursion create O(n^2) garbage
function buggyStringConcat(str) {
  if (str === "") return "";
  // BUG: str.substring(1) creates a new string on every frame, generating O(n^2) memory churn!
  return buggyStringConcat(str.substring(1)) + str[0];
}
```

#### 3.2.8 Complexity Derivation
- **Time Complexity**: $O(n)$. Exactly $\lfloor n / 2 \rfloor$ swaps and recursive calls are performed.
- **Auxiliary Space Complexity**: $O(n)$ call stack frames. (For arrays with $n > 10,000$, an iterative loop should be used to avoid stack overflow).

---

### 3.3 Flatten Deeply Nested Array

#### 3.3.1 Problem Statement
Given a multi-dimensional array with arbitrary nesting depth, return a 1D array with all elements flattened in sequential order.

You may not use the built-in `Array.prototype.flat()`.

```text
Input: [1, [2, [3, [4]], 5]]  ──> Output: [1, 2, 3, 4, 5]
Input: [[1, 2], [3, 4]]        ──> Output: [1, 2, 3, 4]
Input: [[], [[]], 1]           ──> Output: [1]
```

#### 3.3.2 How to Think About It
Imagine a cardboard box that contains a mix of items: loose marbles and smaller nested boxes.
- Reach your hand in. Pull out the first item:
  - If it is a loose marble, place it into your final collection tray.
  - If it is a smaller nested box, pause, open that box, and inspect everything inside using the exact same rule!
- Empty boxes are discarded without adding anything to the tray.
- When the outermost box is empty, your tray contains every marble in original order.

```text
Trace: [ 1, [ 2, [ 3 ] ] ]
Item 1: Number (1) ──> push to result: [ 1 ]
Item 2: Array ([ 2, [ 3 ] ]) ──> Recurse!
  Sub-Item 1: Number (2) ──> push to result: [ 1, 2 ]
  Sub-Item 2: Array ([ 3 ]) ──> Recurse!
    Sub-Sub-Item 1: Number (3) ──> push to result: [ 1, 2, 3 ]
```

#### 3.3.3 Brute Force Approach & Bottleneck
Using `reduce` and array concatenation spreads on every nested level:

```javascript
function flattenBrute(arr) {
  return arr.reduce((acc, item) => {
    return acc.concat(Array.isArray(item) ? flattenBrute(item) : item);
  }, []);
}
```

The bottleneck is `acc.concat()`. On each recursive return, `concat()` creates brand-new array allocations in V8 heap memory and copies all existing accumulated elements, causing $O(n^2)$ time complexity and massive garbage collection pauses.

#### 3.3.4 The Pattern Insight
Use **Structural Recursion with a Shared Mutable Accumulator**:
- Pass a single shared `result` array.
- When an item is a primitive, push it directly to `result` ($O(1)$ amortized).
- When an item is an array, invoke the recursive helper on that sub-array.
- Each element is visited and pushed exactly once, achieving linear $O(n)$ time.

#### 3.3.5 Pseudocode
```text
function flattenArray(arr):
  result = []

  function helper(current):
    for each item in current:
      if item is Array:
        helper(item)
      else:
        result.push(item)

  helper(arr)
  return result
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Recursive array flattening with accumulator
function flattenArray(arr) {
  const result = [];

  function helper(current) {
    for (let i = 0; i < current.length; i++) {
      const item = current[i];

      if (Array.isArray(item)) {
        // Recurse into nested sub-array
        helper(item);
      } else {
        // Base primitive item: push directly to accumulated buffer
        result.push(item);
      }
    }
  }

  helper(arr);
  return result;
}

// Example runs
console.log(flattenArray([1, [2, [3, [4]], 5]])); // [ 1, 2, 3, 4, 5 ]
console.log(flattenArray([[1, 2], [3, 4]]));       // [ 1, 2, 3, 4 ]
console.log(flattenArray([[], [[]], 1]));          // [ 1 ]
console.log(flattenArray([]));                     // []
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Forgetting to capture returned array in recursive calls
function buggyFlatten(arr) {
  let result = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      // BUG: Invokes recursive call but discards returned results!
      buggyFlatten(item);
    } else {
      result.push(item);
    }
  }
  return result;
}

console.log(buggyFlatten([1, [2, 3]])); // [1] (Lost nested items 2 and 3!)
```

#### 3.3.8 Complexity Derivation
- **Time Complexity**: $O(n)$, where $n$ is the total count of all elements across all nesting levels. Every item is inspected once and pushed once.
- **Auxiliary Space Complexity**: $O(d)$, where $d$ is the maximum nesting depth (call stack frames).

---

## 4. Tricky Edge Cases

- **Missing Base Case**: Any recursive function without a base case will recurse infinitely, exceeding V8's call stack memory limit (~10,000 frames) and throwing a `RangeError`.
- **Double Recursive Invocation**: Calling `f(n/2) * f(n/2)` instead of caching `const half = f(n/2)` spawns two branching child trees, turning an $O(\log n)$ algorithm into an exponential $O(n)$ disaster.
- **String and Array Slicing in Arguments**: Writing `fn(str.substring(1))` or `fn(arr.slice(1))` creates new heap objects on every call, leading to $O(n^2)$ memory churn. Use pointer indices (`left`, `right`) instead.
- **Negative Exponents in Power Calculations**: In `myPow(x, n)`, handle negative powers upfront by setting `x = 1 / x` and `n = -n`.
- **Empty and Nested-Empty Arrays in Flattening**: Deeply nested empty structures like `[[], [[]], []]` must terminate cleanly without pushing `undefined` or empty arrays to the result.

---

## 5. Summary Cheat Sheet

- **Two Phases**: Recursion winds stack frames down to the base case, then unwinds stack frames up while computing and bubbling results.
- **V8 Stack Limits**: Node.js limits call stack depth to ~10,000 frames. Deep linear recursion should be converted to an iterative loop.
- **Fast Exponentiation**: Compute $x^n$ in $O(\log n)$ time by squaring the half-power $x^{\lfloor n / 2 \rfloor}$.
- **Shared Accumulator**: Avoid `acc.concat()` inside recursion; pass a single shared array buffer and mutate with `.push()`.
- **No TCO in Node.js**: V8 does not support Tail Call Optimization in production JavaScript due to stack trace debugging invariants.

---

## 6. Practice Problems

### 6.1 Swap Nodes in Pairs
Given the `head` of a linked list, swap every two adjacent nodes and return its head. You must solve the problem without modifying the values in the list's nodes (i.e., only nodes themselves may be changed).

```text
Sample Input 1: head = [1, 2, 3, 4]
Expected Output 1: [2, 1, 4, 3]

Sample Input 2: head = []
Expected Output 2: []

Sample Input 3: head = [1]
Expected Output 3: [1]
```

- *Hint 1*: Base case: `if (!head || !head.next) return head;`.
- *Hint 2*: Identify the pair: `firstNode = head`, `secondNode = head.next`.
- *Hint 3*: Recurse on remaining list: `firstNode.next = swapPairs(secondNode.next)`. Point `secondNode.next = firstNode`. Return `secondNode`.

### 6.2 Fibonacci with Memoization
Calculate the $n$-th Fibonacci number in $O(n)$ time using recursion and a `Map` memoization cache.

```text
Sample Input 1: n = 2
Expected Output 1: 1

Sample Input 2: n = 4
Expected Output 2: 3

Sample Input 3: n = 10
Expected Output 3: 55
```

- *Hint 1*: Base cases: `if (n <= 0) return 0; if (n === 1) return 1;`.
- *Hint 2*: Check `if (memo.has(n)) return memo.get(n);`.
- *Hint 3*: Compute `val = fib(n - 1, memo) + fib(n - 2, memo)`, store `memo.set(n, val)`, and return `val`.

### 6.3 Deep Clone Object
Write a recursive function `deepClone(obj)` that creates a complete independent deep copy of any nested JavaScript object or array, correctly handling nested objects and arrays.

```text
Sample Input: { a: 1, b: { c: [2, 3] } }
Expected Output: Independent clone where mutating clone.b.c does not affect original.
```

- *Hint 1*: Base case: if `typeof obj !== 'object' || obj === null`, return `obj` directly (primitive).
- *Hint 2*: Initialize new container: `Array.isArray(obj) ? [] : {}`.
- *Hint 3*: Iterate keys with `for (const key of Object.keys(obj))` and assign `copy[key] = deepClone(obj[key])`.

---

<nav aria-label="Lecture navigation">

[Previous: Binary Search on Solution Space](day-17-binary-search-on-solution-space.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Merge Sort & Quick Sort](day-19-merge-sort-and-quick-sort.md)

</nav>
