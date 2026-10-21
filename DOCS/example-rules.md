# Example Rules & Code Standards

Examples exist to make code behavior clear, testable, and reliable. Every major concept requires concrete, runnable code examples.

---

## Core Code Principles

- **Use JavaScript:** Write standard, modern JavaScript (Node.js LTS) for JavaScript, Node.js, Express, and DSA lectures unless another language is explicitly requested.
- **Label Every Code Block:** Start every code block with an environment label:
  ```javascript
  // Node.js code
  "use strict";
  ```
- **Self-Contained & Runnable:** Code blocks must be complete and runnable directly in Node.js without missing variables or hidden setup.
- **Direct Clean Execution:** Provide direct functions with clear example calls (`console.log`) showing expected outputs without requiring `assert` imports.
- **Basic English Comments:** Write inline comments in simple, plain English explaining *what* happens and *why*.

---

## Dual-Case Implementation Requirement

Never show only the happy path. Real engineering understanding comes from seeing the common failure mode. Every code example must present dual cases:

1. **`✅ CORRECT / POSITIVE CASE`**:
   - The clean, production-grade implementation.
   - Uses clear, descriptive variable names.
   - Explains why the state stays valid.
2. **`❌ ANTI-PATTERN / COMMON BUG`**:
   - Demonstrates the common trap, off-by-one error, memory leak, or performance mistake.
   - Uses clear inline comments explaining exactly why it fails or slows down.

---

## Test Both Positive and Negative Cases

When demonstrating an algorithm or data structure:
- **Positive Test Case:** Verifies successful matching, correct order, or valid results.
- **Negative / Edge Test Case:** Verifies behavior when the target is missing, input is empty, array has duplicates, or boundaries are exceeded.

Example:
```javascript
// ✅ CORRECT: Standard binary search
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

// ❌ COMMON BUG: Floating point mid in JavaScript
function buggyBinarySearch(arr, target) {
  let low = 0;
  let high = arr.length - 1;
  while (low <= high) {
    const mid = (low + high) / 2; // BUG: 1/2 = 0.5 in JS! arr[0.5] is undefined!
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}

// Example runs
const numbers = [10, 20, 30, 40, 50];
console.log(binarySearch(numbers, 30)); // 2 (found)
console.log(binarySearch(numbers, 99)); // -1 (missing)
console.log(binarySearch([], 10));       // -1 (empty array)
```

---

## Hands-On Bug-Fix Exercises

The Hands-On Exercise must follow a 4-part structure:
1. **Scenario:** A realistic engineering situation.
2. **Buggy Code:** A self-contained code snippet containing subtle real-world bugs.
3. **Acceptance Criteria:** A numbered list of exact requirements.
4. **Solution Code:** Clean, working code with direct test execution.