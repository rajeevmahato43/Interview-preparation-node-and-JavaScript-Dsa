# Day 18: Recursion Fundamentals & Call Stack

<nav aria-label="Lecture navigation">

[Previous: Binary Search on Solution Space](day-17-binary-search-on-solution-space.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Merge Sort & Quick Sort](day-19-merge-sort-and-quick-sort.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Call stack auxiliary space complexity ($O(\text{depth})$).
- [Day 13: Stacks & Expression Parsing](day-13-stacks-and-expression-parsing.md) — LIFO stack frame push/pop mechanics.

---

## 1. What is Recursion?

**Recursion** is an algorithmic technique where a function solves a complex problem by delegating smaller, simpler instances of the **exact same problem** to itself. This self-delegation repeats until the subproblem becomes so small that it can be answered directly without further delegation; this terminating condition is called the **Base Case**.

> **Base Case**: The simplest possible input where the answer is known immediately and the function returns without making another recursive call.

> **Recursive Step**: The statement where the function invokes itself with a strictly smaller or simpler input ($n - 1$, $n / 2$, `node.next`).

> **Call Stack Frame (Activation Record)**: A block of memory allocated on the CPU thread stack for each active function invocation, storing its parameters, local variables, and return address.

> **Stack Overflow**: A fatal runtime error occurring when recursive calls continue infinitely without hitting a base case, exhausting the allocated thread stack memory.

### Everyday Physical Analogies

#### Russian Matryoshka Nesting Dolls
Imagine a set of painted wooden Russian dolls:
1. You want to find the tiny gold token hidden in the center.
2. You open Doll 5 (the outermost doll). Inside is Doll 4.
3. You open Doll 4, then Doll 3, then Doll 2.
4. Finally, you reach Doll 1 (The **Base Case**). It is a solid wooden figurine with no seam; it cannot be opened. You inspect it and find the token.
5. Now comes the return journey: You must close Doll 2, then close Doll 3, then close Doll 4, and finally reassemble Doll 5 in reverse order (**Stack Unwinding**)!

```text
THE TWO PHASES OF RECURSION:

Phase 1: Winding (Pushing Stack Frames)
call factorial(3)
  └─► call factorial(2)
        └─► call factorial(1)  [Base Case reached! Returns 1]

Phase 2: Unwinding (Popping Stack Frames and Computing Results)
        ┌─► returns 1
  ┌─────┴─► computes 2 * 1 = 2, returns 2
  └───────► computes 3 * 2 = 6, returns 6
```

---

## 2. How Recursion Works Step-by-Step

### 1. The Anatomy of Every Recursive Function

Every valid recursive function must possess three distinct components:

1. **Base Case(s)**: An explicit conditional check at the very top that halts recursion.
2. **Work Phase**: Performing computation at the current level.
3. **Recursive Call**: Invoking the function with a subproblem strictly closer to the base case.

```javascript
function countdown(n) {
  // 1. Base Case: Stop when n hits 0
  if (n <= 0) {
    console.log("Blastoff!");
    return;
  }

  // 2. Work Phase: Print current number
  console.log(n);

  // 3. Recursive Call: Move closer to base case (n - 1)
  countdown(n - 1);
}
```

---

### 2. Concrete Call Stack Execution Trace

Let's trace `sumTo(3)` ($3 + 2 + 1 = 6$):

```javascript
function sumTo(n) {
  if (n === 1) return 1; // Base case
  return n + sumTo(n - 1);
}
```

#### Step-by-Step State Transition in Stack Memory:
```text
Step 1: main calls sumTo(3).
  Stack Frame 1: n = 3. Waits on sumTo(2).
  Stack: [ sumTo(3) ]

Step 2: sumTo(3) calls sumTo(2).
  Stack Frame 2: n = 2. Waits on sumTo(1).
  Stack: [ sumTo(3), sumTo(2) ]

Step 3: sumTo(2) calls sumTo(1).
  Stack Frame 3: n = 1. Hits Base Case (n === 1)!
  Returns 1. Frame 3 is popped from stack.
  Stack: [ sumTo(3), sumTo(2) ]

Step 4: sumTo(2) receives 1.
  Computes 2 + 1 = 3. Returns 3.
  Frame 2 is popped from stack.
  Stack: [ sumTo(3) ]

Step 5: sumTo(3) receives 3.
  Computes 3 + 3 = 6. Returns 6.
  Frame 1 is popped from stack.
  Stack: [ ] (Empty)

Final Result = 6.
```

---

### 3. Head Recursion vs Tail Recursion

- **Head Recursion**: The recursive call is made *before* the computation. Computation happens on the **unwinding phase** as stack frames return.
- **Tail Recursion**: The recursive call is the *very last statement* in the function. All computation is accumulated forward and passed as an argument.

```javascript
// ✅ Head Recursion: Computation happens on return (unwinding)
function factorialHead(n) {
  if (n <= 1) return 1;
  return n * factorialHead(n - 1); // Multiplication happens AFTER call returns
}

// ✅ Tail Recursion: Computation accumulated in parameter 'acc'
function factorialTail(n, acc = 1) {
  if (n <= 1) return acc;
  return factorialTail(n - 1, n * acc); // Nothing left to do after call returns!
}

// Example test run
console.log(factorialHead(4)); // 24
console.log(factorialTail(4)); // 24
```

---

## 3. Pattern Recognition of Recursion

### Problem Triggers and Keywords

| Problem Trigger | Underlying Requirement | Recommended Strategy |
| :--- | :--- | :--- |
| **"Divide problem into halves"** | Repeatedly halving subproblem. | Divide & Conquer recursion ($O(\log n)$). |
| **"Traverse nested tree / graph"** | Hierarchical parent-child nodes. | DFS traversal recursion. |
| **"Generate all permutations / subsets"**| Exploring decision trees. | Backtracking recursion. |
| **"Solve Towers of Hanoi / Fractals"** | Self-similar geometric structures. | Inductive recursion. |
| **"Flatten nested arrays or JSON"** | Unknown nesting depth. | Structural recursion. |

### The $10^7$ Rule for Recursion
- Unlike loops, recursion is bounded by **Call Stack Depth**.
- In Node.js (V8 engine), the maximum call stack depth is approximately **10,000 frames**.
- If a recursive function recurses $N$ times (linear recursion $O(N)$), calling it with $N = 10,000$ will crash Node.js with `RangeError: Maximum call stack size exceeded`.
- **Golden Rule**: Use recursion only when tree depth is $O(\log N)$ (e.g., $N = 10^9 \to \text{depth } 30$) or small backtracking paths ($N \le 20$). If depth is linear $O(N)$ with $N > 5,000$, convert to an iterative loop!

---

## 4. Problem 1: Pow(x, n) - Fast Exponentiation (LeetCode 50)

### Problem Statement
Implement `myPow(x, n)`, which calculates $x$ raised to the power $n$ ($x^n$).
$n$ can be positive, negative, or zero.
You must solve this in **$O(\log n)$ time**.

```text
Input: x = 2.00000, n = 10
Output: 1024.00000

Input: x = 2.10000, n = 3
Output: 9.26100

Input: x = 2.00000, n = -2
Output: 0.25000 (1 / 2^2 = 1 / 4 = 0.25)
```

### Step 1: Physical Simulation
How does human intuition calculate $2^{10}$ without multiplying 2 ten times?
- $2^{10} = (2^5)^2$
- $2^5 = 2 \times 2^4 = 2 \times (2^2)^2$
- $2^2 = (2^1)^2$
- $2^1 = 2 \times 2^0 = 2 \times 1 = 2$
Notice: Whenever the power $n$ is **even**, we square the half-power:
$$x^n = (x^{n / 2})^2$$
Whenever $n$ is **odd**, we pull out one factor of $x$ and square the rest:
$$x^n = x \times (x^{n / 2})^2$$
By cutting $n$ in half on every step, calculating $2^{1000}$ takes only **10 steps** instead of 1,000 multiplications!

### Step 2: Brute Force Approach
Multiply $x$ in a loop $n$ times:

```javascript
function myPowBrute(x, n) {
  if (n < 0) { x = 1 / x; n = -n; }
  let res = 1;
  for (let i = 0; i < n; i++) res *= x;
  return res;
}
```
- **Time Complexity**: $O(n)$ — If $n = 2^{31} - 1$ ($2.14 \times 10^9$), this loop takes **10+ seconds** and times out.
- **Space Complexity**: $O(1)$.

### Step 3: Bottleneck
Where is the CPU sweating?
Linear multiplication does not take advantage of mathematical symmetry ($x^8 = x^4 \times x^4$).

### Step 4: The Pattern Discovery
**Divide & Conquer (Binary Exponentiation)**:
Calculate $y = \text{myPow}(x, \lfloor n / 2 \rfloor)$ once.
If $n$ is even, return $y \times y$.
If $n$ is odd, return $x \times y \times y$.
Base case: $n = 0 \to 1$.

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: O(log n) Fast Binary Exponentiation
function myPow(x, n) {
  // Base Case
  if (n === 0) return 1;

  // Handle negative exponent: x^(-n) = (1/x)^n
  if (n < 0) {
    x = 1 / x;
    n = -n;
  }

  function fastPow(base, exp) {
    if (exp === 0) return 1;

    // Recurse on half exponent
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

// ❌ ANTI-PATTERN: Calling fastPow twice destroys O(log n) complexity!
function slowPow(x, n) {
  if (n === 0) return 1;
  // BUG: Calling fastPow(x, n/2) * fastPow(x, n/2) branches into O(n) calls!
  return slowPow(x, Math.floor(n / 2)) * slowPow(x, Math.floor(n / 2));
}

// Example test runs
console.log(myPow(2.0, 10)); // 1024
console.log(myPow(2.1, 3));  // 9.261000000000001
console.log(myPow(2.0, -2)); // 0.25
console.log(myPow(1.0, 2147483647)); // 1 (Instantaneous O(log n) calculation!)
```

- **Time Complexity**: $O(\log n)$ — Exponent is divided by 2 at each step ($\approx 32$ total calls for max 32-bit int).
- **Space Complexity**: $O(\log n)$ — Recursion call stack depth is $\log_2(n)$.

---

## 5. Problem 2: Reverse a String Recursively

### Problem Statement
Given a character array `s`, reverse the array in-place using a recursive function with $O(1)$ extra space (excluding call stack).

```text
Input: s = ["h", "e", "l", "l", "o"]
Output: ["o", "l", "l", "e", "h"]

Input: s = ["H", "a", "n", "n", "a", "h"]
Output: ["h", "a", "n", "n", "a", "H"]
```

### Step 1: Physical Simulation
Imagine cards in a row: `['h', 'e', 'l', 'l', 'o']`.
- Swap outermost pair: swap index 0 (`'h'`) and index 4 (`'o'`).
- The remaining subproblem is the inner slice: `['e', 'l', 'l']`.
- Swap index 1 (`'e'`) and index 3 (`'l'`).
- The remaining subproblem is index 2 (`'l'`).
- Base Case: A single character or empty window requires zero swaps! Return.

### Step 2: Brute Force Approach
Allocate a new array and populate it backward:

```javascript
function reverseStringCopy(s) {
  const res = [];
  for (let i = s.length - 1; i >= 0; i--) res.push(s[i]);
  return res;
}
```
- **Time Complexity**: $O(n)$.
- **Space Complexity**: $O(n)$ heap allocation.

### Step 3: Bottleneck
Where is the CPU sweating?
Allocating a second array copies memory when pointers can be swapped in place.

### Step 4: The Pattern Discovery
Two-Pointer Inward Recursion: Swap `s[left]` and `s[right]`, then recurse on `(left + 1, right - 1)` until `left >= right`.

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: Two-Pointer In-Place Recursion
function reverseString(s) {
  function helper(left, right) {
    // Base Case: Pointers have met or crossed
    if (left >= right) return;

    // Swap outermost elements
    const temp = s[left];
    s[left] = s[right];
    s[right] = temp;

    // Recurse on remaining interior slice
    helper(left + 1, right - 1);
  }

  helper(0, s.length - 1);
  return s;
}

// ❌ ANTI-PATTERN: String concatenation in recursion creates O(n^2) garbage
function buggyStringConcat(str) {
  if (str === "") return "";
  // BUG: str.substring() allocates new strings on every frame -> O(n^2) memory!
  return buggyStringConcat(str.substring(1)) + str[0];
}

// Example test runs
const chars1 = ["h", "e", "l", "l", "o"];
reverseString(chars1);
console.log(chars1); // [ 'o', 'l', 'l', 'e', 'h' ]

const chars2 = ["H", "a", "n", "n", "a", "h"];
reverseString(chars2);
console.log(chars2); // [ 'h', 'a', 'n', 'n', 'a', 'H' ]
```

- **Time Complexity**: $O(n)$ — Exactly $n / 2$ recursive calls.
- **Space Complexity**: $O(n)$ call stack frames.

---

## 6. Under the Hood: V8 & Node.js

### The Anatomy of a V8 Call Stack Frame
What physically happens in Node.js when a function calls itself?
1. **Prologue**:
   - The CPU decrements the Stack Pointer (`RSP`).
   - Pushes the Return Address (memory location in caller code) onto thread stack.
   - Pushes the Base Pointer (`RBP`).
2. **Body**:
   - Allocates memory for function arguments and local variables.
3. **Memory Footprint**:
   - Each frame in V8 consumes **48 to 80 bytes** of raw stack memory.
   - 10,000 frames $\times 64\text{ bytes} \approx 640\text{ KB}$.
   - V8 sets a safety ceiling on stack memory (typically **1 MB** in Node.js). Exceeding this boundary immediately throws `RangeError: Maximum call stack size exceeded` to protect OS process memory from corrupting adjacent threads.

### Why V8 Does Not Support Tail Call Optimization (TCO)
In theory, tail-recursive functions can run in $O(1)$ stack space by reusing the current stack frame.
Why doesn't Node.js do this?
- **Error Stack Traces**: Developers rely on `error.stack` and `console.trace()` to debug production issues. Reusing stack frames erases historical calling frames from stack traces.
- **Performance Trade-offs**: In practice, optimizing tail calls complicated V8's JIT compiler (TurboFan) without substantial speedups for standard idiomatic JavaScript.
- **Production Takeaway**: Always write iterative loops for linear tasks ($N > 5,000$).

---

## 7. Hands-On Exercise

### The Scenario
You are developing a configuration loader for a microservice framework in Node.js.
The configuration file can contain deeply nested arrays (e.g., `[1, [2, [3, [4]], 5]]`).
You must implement a recursive utility `flattenArray(arr)` that flattens any arbitrarily nested array into a single flat 1D array.

```text
Input: [1, [2, [3, [4]], 5]]
Output: [1, 2, 3, 4, 5]
```

### The Buggy Code
```javascript
function flattenBuggy(arr) {
  let result = [];
  for (let item of arr) {
    if (Array.isArray(item)) {
      // Bug: Calling flatten without capturing return value!
      flattenBuggy(item);
    } else {
      result.push(item);
    }
  }
  return result;
}
```

### Acceptance Criteria
1. Flattens arbitrary levels of array nesting.
2. Preserves relative element ordering.
3. Correctly handles empty nested arrays `[]` and empty inputs.
4. Verified with direct test execution.

### Verified Solution

```javascript
// ✅ CORRECT: Structural Recursion Accumulating into a Single Buffer
function flattenArray(arr) {
  const result = [];

  function helper(current) {
    for (let i = 0; i < current.length; i++) {
      const item = current[i];
      if (Array.isArray(item)) {
        // Recurse into nested sub-array
        helper(item);
      } else {
        // Base item: push directly to accumulated buffer
        result.push(item);
      }
    }
  }

  helper(arr);
  return result;
}

// Example test runs
console.log(flattenArray([1, [2, [3, [4]], 5]])); // [ 1, 2, 3, 4, 5 ]
console.log(flattenArray([[1, 2], [3, 4]]));       // [ 1, 2, 3, 4 ]
console.log(flattenArray([[], [[]], 1]));          // [ 1 ]
console.log(flattenArray([]));                     // []
```

---

## 8. Tricky Points and Edge Cases

### 1. Integer Min Negative Power in `myPow`
In 32-bit two's complement systems, the minimum 32-bit signed integer is $-2^{31} = -2147483648$.
In C++ or Java, negating this number (`-n`) overflows because maximum positive integer is $2^{31} - 1$.
In JavaScript, all numbers are double-precision floats up to $2^{53} - 1$, so `-(-2147483648)` safely evaluates to `2147483648` without 32-bit integer overflow.

### 2. The Duplicate Recursive Call Trap
Never write:
```javascript
return fastPow(x, n / 2) * fastPow(x, n / 2);
```
Even though the math is identical, calling the function twice spawns two branching child trees, turning an $O(\log n)$ algorithm into an **exponential $O(n)$ disaster**! Always store the result in a variable:
```javascript
const half = fastPow(x, Math.floor(n / 2));
return half * half;
```

### 3. Edge Cases Checklist
- Zero base: `myPow(0, 5) === 0`.
- Power of zero: `myPow(5, 0) === 1`.
- Base of one: `myPow(1, 1000000) === 1`.
- Base of negative one: `myPow(-1, 3) === -1`, `myPow(-1, 4) === 1`.

---

## 9. Comprehensive Summary

- **Recursion** breaks a problem down by delegating smaller subproblems to itself until reaching an irreducible **Base Case**.
- **Execution Flow**: During the *winding phase*, stack frames accumulate; during the *unwinding phase*, base case answers bubble upward and compute intermediate results.
- **Fast Exponentiation (Pow)**: Divide and conquer computes $x^n$ in $O(\log n)$ time by squaring $(x^{n/2})^2$.
- **Call Stack Limits**: V8 enforces a ~10,000 frame limit. Linear recursions with $N > 10,000$ must be converted to iterative loops to prevent stack overflows.
- **Tail Recursion**: Not optimized in modern JavaScript engines due to debugging stack trace requirements.

---

## 10. Cheat Sheet

### Recursion Complexity Patterns

| Pattern | Recurrence Relation | Time Complexity | Stack Space | Example |
| :--- | :--- | :---: | :---: | :--- |
| **Linear Reduction** | $T(n) = T(n - 1) + O(1)$ | **$O(n)$** | $O(n)$ | Factorial, String Reverse |
| **Divide & Conquer** | $T(n) = T(n / 2) + O(1)$ | **$O(\log n)$** | $O(\log n)$ | Binary Exponentiation (Pow), Binary Search |
| **Branching Binary** | $T(n) = 2T(n - 1) + O(1)$ | **$O(2^n)$** | $O(n)$ | Naive Fibonacci |
| **Divide & Combine** | $T(n) = 2T(n / 2) + O(n)$ | **$O(n \log n)$** | $O(\log n)$ | Merge Sort |

### Common Pitfalls List
- **Missing Base Case**: Triggers immediate `RangeError: Maximum call stack size exceeded`.
- **Double Recursive Branching**: Calling `f(n/2) * f(n/2)` instead of caching `half`.
- **String Slicing Memory Leaks**: Slicing strings inside recursive arguments allocates $O(n^2)$ heap memory. Use pointer indices (`left`, `right`) instead.
- **Unreachable Base Case**: Decrementing an integer with step 2 when base case checks for `0` (e.g. `n === 0` missed by odd numbers!).

---

## 11. Interview Q&A

### 45-Second Technical Pitch
> *"Recursion is an inductive problem-solving method where a function resolves smaller instances of itself until reaching a base case. In technical interviews, recursion is the primary foundation for Divide and Conquer, tree and graph traversals, and backtracking. For algorithms like fast exponentiation (Pow(x, n)), halving the exponent at each step reduces multiplications from linear O(n) to logarithmic O(log n). In production Node.js systems, because V8 does not support Tail Call Optimization and limits stack depth to approximately 10,000 frames, senior engineers restrict recursion to logarithmic-depth trees or convert linear recursion into explicit iterative loops."*

### 1. What is the difference between Call Stack memory and Heap memory in a recursive JavaScript function?
**Answer:**
- **Call Stack Memory**: Stores the execution frames of active functions. Every time a function calls itself, V8 allocates a stack frame storing arguments, return addresses, and local primitive bindings. Stack memory allocation is managed directly by the CPU pointer (`RSP`), making it fast but strictly bounded (~1 MB limit).
- **Heap Memory**: Stores dynamic objects, arrays, and closures. If a recursive function creates objects or arrays inside its body, those objects reside in the V8 garbage-collected heap.
- If a recursive function has excessive depth, it exhausts **Stack Memory** (`Maximum call stack size exceeded`). If it allocates massive objects inside each frame, it exhausts **Heap Memory** (`JavaScript heap out of memory`).

### 2. What will the following code output in Node.js, and why?
```javascript
function mystery(n) {
  if (n <= 0) return 0;
  return n + mystery(n - 2);
}
console.log(mystery(5));
```
**Answer:**
It outputs `9`.
Trace:
- `mystery(5) = 5 + mystery(3)`
- `mystery(3) = 3 + mystery(1)`
- `mystery(1) = 1 + mystery(-1)`
- `mystery(-1)`: Hits base case `n <= 0` $\to$ returns `0`.
- Unwinding:
  - `1 + 0 = 1`
  - `3 + 1 = 4`
  - `5 + 4 = 9`.
Notice that because the base case checks `n <= 0` rather than `n === 0`, odd inputs safely terminate without infinite negative loops.

### 3. Spot and fix the bug in this recursive Fibonacci function:
```javascript
function fibBuggy(n) {
  if (n === 0) return 0;
  if (n === 1) return 1;
  return fibBuggy(n - 1) + fibBuggy(n - 2);
}
```
**Answer:**
While mathematically correct, this naive implementation exhibits **exponential $O(2^n)$ time complexity**.
Computing `fibBuggy(50)` requires over $2^{50} \approx 10^{15}$ operations, freezing Node.js for days. The bug is redundant overlapping subproblems (e.g., `fib(3)` is computed millions of times independently).
**Fix**: Use Memoization (`Map` cache) or an iterative loop to achieve $O(n)$ time:
```javascript
function fibMemo(n, memo = new Map()) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);
  const val = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  memo.set(n, val);
  return val;
}
```

### 4. Why should you pass pointer indices (`left`, `right`) instead of array slices (`arr.slice(1)`) into recursive helpers?
**Answer:**
Calling `arr.slice(1)` creates a brand-new array object in V8 heap memory and copies all $n - 1$ remaining elements.
Across $n$ recursive calls, this allocates:
$$(n - 1) + (n - 2) + \dots + 1 = \frac{n(n - 1)}{2} = O(n^2) \text{ memory}$$
This places enormous pressure on the V8 garbage collector and degrades execution speed.
Passing numeric indices (`left`, `right`) creates zero heap allocations and takes $O(1)$ space per frame, preserving $O(n)$ total time.

---

## 12. Practice Problems

### 1. Pow(x, n) - Medium
Calculate $x^n$ in $O(\log n)$ time handling positive and negative exponents.
- **Sample Input 1:** `x = 2.00000, n = 10`
- **Expected Output 1:** `1024.00000`
- **Sample Input 2:** `x = 2.00000, n = -2`
- **Expected Output 2:** `0.25000`

### 2. Reverse String - Easy
Reverse an array of characters in-place using recursion.
- **Sample Input 1:** `s = ["h","e","l","l","o"]`
- **Expected Output 1:** `["o","l","l","e","h"]`
- **Sample Input 2:** `s = ["H","a","n","n","a","h"]`
- **Expected Output 2:** `["h","a","n","n","a","H"]`

### 3. Flatten Deeply Nested Array - Medium
Recursively flatten an arbitrary nested array into 1D array.
- **Sample Input 1:** `arr = [1, [2, [3, [4]], 5]]`
- **Expected Output 1:** `[1, 2, 3, 4, 5]`
- **Sample Input 2:** `arr = [[1, 2], [3, 4]]`
- **Expected Output 2:** `[1, 2, 3, 4]`

### 4. Swap Nodes in Pairs - Medium
Given a linked list, swap every two adjacent nodes using recursion.
- **Sample Input 1:** `head = [1, 2, 3, 4]`
- **Expected Output 1:** `[2, 1, 4, 3]`
- **Sample Input 2:** `head = []`
- **Expected Output 2:** `[]`

---

<nav aria-label="Lecture navigation">

[Previous: Binary Search on Solution Space](day-17-binary-search-on-solution-space.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Merge Sort & Quick Sort](day-19-merge-sort-and-quick-sort.md)

</nav>
