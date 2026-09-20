# Day 08: Group Anagrams and Frequency Vectors

<nav aria-label="Lecture navigation">

[Previous: Two Sum and Hash Map Complements](day-07-two-sum-and-hash-complements.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Duplicate Detection and Array Intersections](day-09-duplicate-detection-and-intersections.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Recognize the **Equivalence Class Partitioning** pattern for grouping items by shared signatures.
- Compare the two canonical key-generation strategies for anagrams: **Sorted Strings** ($O(k \log k)$) vs **Frequency Count Vectors** ($O(k)$).
- Implement Group Anagrams cleanly using a JavaScript `Map`.
- Understand the risks of numeric hashing techniques such as prime number multiplication (integer overflow in JavaScript).
- Design in-memory categorization and batching pipelines in Node.js backend services.

## Prerequisites

- [Day 03: Strings and Text Patterns](day-03-strings-and-text-patterns.md)
- [Day 06: Frequency Counting and Hash Tables](day-06-frequency-counting-and-hash-tables.md)

---

## Core Concepts

### 1. The Grouping by Signature Pattern

An anagram is a word formed by rearranging the letters of another word (e.g. `"eat"`, `"tea"`, and `"ate"`).
When an interview problem asks to *"group items that share a property"*, the optimal approach is:
1. Define a **canonical signature** that is identical for all members of the group.
2. Use a hash map where `key = signature` and `value = array of items`.
3. Return `Array.from(map.values())`.

```text
Words: ["eat", "tea", "tan", "ate", "nat", "bat"]

Canonical Signature (Sorted):
"eat" ──> "aet" ──\
"tea" ──> "aet" ───> Map Key "aet": ["eat", "tea", "ate"]
"ate" ──> "aet" ──/

"tan" ──> "ant" ──\
"nat" ──> "ant" ───> Map Key "ant": ["tan", "nat"]

"bat" ──> "abt" ─────> Map Key "abt": ["bat"]

Output: [ ["eat", "tea", "ate"], ["tan", "nat"], ["bat"] ]
```

---

### 2. Strategy Comparison: Sorted String vs Count Vector

How should we generate the signature for a word of length $k$?

#### Approach 1: Sorted String
Convert string to array, sort characters alphabetically, and join back into a string:
`str.split('').sort().join('')`
- **Time Complexity per word**: $O(k \log k)$
- **Pros**: Simple, concise, works with any Unicode character.
- **Cons**: Sorting overhead on long strings ($k > 1,000$).

#### Approach 2: Frequency Count Vector (Delimiter Separated)
For strings composed of lowercase English letters (`a-z`), count occurrences of each of the 26 letters:
`#1#0#0#0#1#0...#1` (meaning 1 'a', 0 'b', ..., 1 'e', ..., 1 't').
- **Time Complexity per word**: $O(k)$ to count characters + $O(26) = O(1)$ to format key.
- **Pros**: Linear in string length; asymptotically faster for very long words.
- **Cons**: Delimiter formatting required to prevent ambiguity (`"11"` vs `"1"` and `"1"`).

---

## Detailed Explanations & Node.js Relevance

### Why Prime Multiplication is Dangerous in JavaScript

A tempting mathematical shortcut is assigning each of the 26 letters a prime number (`a=2, b=3, c=5, d=7...`) and computing the product of letters. By the Fundamental Theorem of Arithmetic, every anagram has a unique product.

```js
// DANGEROUS IN JAVASCRIPT:
const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101];
let product = 1;
for (const char of word) product *= primes[char.charCodeAt(0) - 97];
```
**The Failure Mode:**
JavaScript numbers are IEEE 754 double-precision floats with an exact integer limit of `Number.MAX_SAFE_INTEGER` ($2^{53} - 1 \approx 9 \times 10^{15}$).
A word with just 12 characters can easily exceed this limit, causing numeric truncation and catastrophic hash collisions! Unless you use `BigInt`, stick to string keys.

### Backend Relevance: Request Batching and Deduplication
In Node.js, grouping by signature is fundamental when batching incoming client requests. For example, grouping incoming database read queries by SQL query template (`SELECT * FROM users WHERE id IN (...)`) allows combining multiple single-item requests into a single bulk query (DataLoader pattern).

---

## JavaScript Implementation & Tracing

### Problem: Group Anagrams (LeetCode 49)

Given an array of strings `strs`, group the anagrams together. You can return the answer in any order.

```js
// Approach 1: Sorted String Key - Clean & Standard
function groupAnagrams(strs) {
  const groups = new Map();

  for (const str of strs) {
    // Generate signature by sorting characters: O(k log k)
    const key = str.split("").sort().join("");

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(str);
  }

  return Array.from(groups.values());
}

// Approach 2: 26-Element Frequency Vector Key - O(k) per word
function groupAnagramsLinear(strs) {
  const groups = new Map();

  for (const str of strs) {
    const counts = new Array(26).fill(0);
    for (let i = 0; i < str.length; i++) {
      counts[str.charCodeAt(i) - 97]++;
    }

    // Build unique string key: "#1#0#0#0#1#0..."
    const key = counts.join("#");

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(str);
  }

  return Array.from(groups.values());
}
```

### Step-by-Step Trace

Input: `strs = ["eat", "tea", "tan", "ate", "nat", "bat"]`

| Word | Key Generation (Sorted) | Key in Map? | Action | `groups` State |
| :--- | :--- | :--- | :--- | :--- |
| `"eat"` | `'e','a','t' -> "aet"` | No | Create key `"aet"` | `{"aet" => ["eat"]}` |
| `"tea"` | `'t','e','a' -> "aet"` | Yes | Push to `"aet"` | `{"aet" => ["eat", "tea"]}` |
| `"tan"` | `'t','a','n' -> "ant"` | No | Create key `"ant"` | `{"aet" => [...], "ant" => ["tan"]}` |
| `"ate"` | `'a','t','e' -> "aet"` | Yes | Push to `"aet"` | `{"aet" => ["eat", "tea", "ate"]}` |
| `"nat"` | `'n','a','t' -> "ant"` | Yes | Push to `"ant"` | `{"ant" => ["tan", "nat"]}` |
| `"bat"` | `'b','a','t' -> "abt"` | No | Create key `"abt"` | `{"abt" => ["bat"]}` |

- **Time Complexity**:
  - Approach 1: $O(n \cdot k \log k)$, where $n$ is number of words and $k$ is maximum word length.
  - Approach 2: $O(n \cdot k)$, where $n \cdot k$ is total characters processed.
- **Auxiliary Space**: $O(n \cdot k)$ to store all strings and keys inside the `Map`.

---

## Common Mistakes & Interview Traps

1. **Omitting Delimiters in Frequency Strings**:
   ```js
   // WRONG: counts.join('') without delimiter:
   // Word 1: 'a' appears 11 times, 'b' appears 0 times -> "110"
   // Word 2: 'a' appears 1 time, 'b' appears 10 times -> "110"  COLLISION!
   ```
   Always use a delimiter like `#` (`counts.join('#')`) or fixed-width padding so numbers do not bleed into each other.
2. **Mutating the Original Array**:
   `str.split('').sort()` is safe because `split('')` creates a fresh array. Never sort an array in-place if other parts of the program rely on original ordering.

---

## Tricky Points & Edge Cases

- **Empty Strings**: `strs = [""]` yields key `""` and correctly returns `[[""]]`.
- **Single Character Strings**: `strs = ["a"]` returns `[["a"]]`.
- **Large Alphabet or Unicode**:
  If inputs contain uppercase characters, spaces, or emojis, the 26-character fixed array fails. The sorted string approach (`str.split('').sort().join('')`) seamlessly handles full Unicode strings.

---

## Practical Exercise

Implement `groupShiftedStrings(strings)` where two strings belong to the same group if each character can be shifted by the same circular offset to match the other (e.g. `"abc"` shifts to `"bcd"`, and `"az"` shifts to `"ba"`).
- **Goal**: Generate a canonical difference signature for each string and group them using a `Map`.
- **Acceptance Criterion**: Must run in $O(n \cdot k)$ time and handle circular shifts (`(char2 - char1 + 26) % 26`).

---

## Summary

- The Group Anagrams problem is the archetypal example of the **Signature-Based Grouping Pattern**.
- Sorting characters gives an $O(n \cdot k \log k)$ solution that is short, elegant, and handles any character set.
- 26-element count arrays produce an $O(n \cdot k)$ linear solution for lowercase ASCII, but require delimiters to avoid key ambiguity.
- Never use prime multiplication without `BigInt` in JavaScript due to `Number.MAX_SAFE_INTEGER` overflow.

---

## Cheat Sheet

### Signature Techniques
| Method | Key Example | Time per Word | Alphabet Support |
| :--- | :--- | :--- | :--- |
| **Sorted String** | `"aet"` | $O(k \log k)$ | Full Unicode / ASCII |
| **Frequency Vector** | `"1#0#0#...#1"` | $O(k)$ | Constrained (e.g. `a-z`) |
| **Prime Product** | `2 * 3 * 5` | $O(k)$ | Prone to IEEE 754 overflow! |

### Core Algorithm Pattern
```js
const map = new Map();
for (const s of strs) {
  const key = s.split('').sort().join('');
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(s);
}
return Array.from(map.values());
```

---

## Interview Questions

### 1. Deep Definitions and Mental Models
**Question:** Explain what an equivalence relation is in the context of Group Anagrams, and how a canonical signature enables $O(1)$ group lookup.
- **Expected answer shape:** Being an anagram is an equivalence relation (reflexive, symmetric, transitive). An equivalence class can be uniquely identified by a single canonical representative (the signature). By mapping each input to its signature, a hash table groups items in $O(1)$ amortized time per insertion.

### 2. Predict the Output and Trace Execution
**Question:** What does this function return?
```js
function test() {
  const map = new Map();
  const k1 = [1, 0, 1];
  const k2 = [1, 0, 1];
  map.set(k1, ["a"]);
  map.set(k2, ["b"]);
  return map.size;
}
```
- **Expected answer shape:** Returns `2`. In JavaScript, arrays are objects compared by reference identity, not structural equality. Because `k1 !== k2`, `map` treats them as two distinct keys. To use arrays as keys in a `Map`, they must be serialized to primitive strings (`k1.join('#')`).

### 3. Implementation Exercise
**Question:** Write `isAnagram(s, t)` using an in-place frequency vector. Return boolean. Must run in $O(n)$ time and $O(1)$ space.
- **Expected answer shape:**
```js
function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const counts = new Int32Array(26);
  for (let i = 0; i < s.length; i++) {
    counts[s.charCodeAt(i) - 97]++;
    counts[t.charCodeAt(i) - 97]--;
  }
  for (let i = 0; i < 26; i++) {
    if (counts[i] !== 0) return false;
  }
  return true;
}
```

### 4. Debugging and Failure Analysis
**Question:** A candidate builds an anagram signature by concatenating character codes without delimiters: `key += str.charCodeAt(i)`. Why does this fail for `"ab"` vs `"k"`?
- **Expected answer shape:** `'a'` has code 97, `'b'` has code 98 $\to$ concatenated: `"9798"`. If another character combination yields the same digits without separation, collisions occur. Delimiters are mandatory to preserve boundaries between individual numbers.

### 5. Design and Tradeoff Questions
**Question:** If word lengths $k$ are small ($k \le 10$) but the number of words $n$ is $10^6$, which signature generation approach is best and why?
- **Expected answer shape:** For $k \le 10$, $k \log k \le 33$ operations, meaning sorting is virtually constant time. `str.split('').sort().join('')` allocates fewer string fragments than building a 26-element delimiter-joined string (`counts.join('#')`). Profiling in V8 shows sorted string keys perform faster for small $k$ due to lower memory allocation overhead.

### 6. Senior Follow-ups: Node.js Data Pipelines
**Question:** An Express microservice receives 50 MB JSON payloads of dictionary words to group. How do you prevent event-loop starvation during grouping?
- **Expected answer shape:** Processing 50 MB synchronously blocks the event loop for seconds. Solutions: (1) Stream the incoming JSON using a streaming parser (e.g. `stream-json`) instead of buffering the whole 50 MB into memory, (2) offload the grouping logic to a worker thread pool (`worker_threads`), and (3) return the grouped response as a chunked HTTP stream.

<nav aria-label="Lecture navigation">

[Previous: Two Sum and Hash Map Complements](day-07-two-sum-and-hash-complements.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Duplicate Detection and Array Intersections](day-09-duplicate-detection-and-intersections.md)

</nav>
