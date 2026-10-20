# Day 05: Frequency Counter Pattern: Anagrams & Duplicates

<nav aria-label="Lecture navigation">

[Previous: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Opposing & Symmetrical](day-06-two-pointers-opposing-and-symmetrical.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Asymptotic time & space ($O(1), O(n), O(n^2)$) and the $10^7$ operations rule.
- [Day 02: Arrays, Strings & Primitive Memory](day-02-arrays-strings-and-primitive-memory.md) — Contiguous memory, zero-based indexing, and character codes (`charCodeAt`).
- [Day 04: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md) — How Hash Maps give $O(1)$ lookups, `Map` vs plain Object, and collision handling.

---

## 1. What is the Frequency Counter Pattern?

A **Frequency Counter** is a problem-solving pattern where you use a Hash Map or fixed array to tally how many times each item appears in a collection.

> **Frequency Counter**: A pattern that counts item occurrences in a single pass ($O(n)$) to avoid slow nested loop comparisons ($O(n^2)$).

It does **not** compare items against each other one by one. Instead, it reads through the collection once, records counts like tally marks on paper, and then uses those recorded counts to answer questions instantly.

### The Laundry Basket Analogy

Imagine you have a laundry basket filled with 100 colored socks. You want to verify if you have an exact matching pair for every sock:

```text
❌ THE SLOW WAY (Nested Scans - O(n²)):
Pick up sock 1 (Red).
Scan through the entire remaining basket one by one to find another Red sock.
Pick up sock 2 (Blue).
Scan through the entire remaining basket one by one to find another Blue sock.
... You search through the whole basket 100 times! (100 * 100 = 10,000 checks!)

✅ THE FREQUENCY COUNTER WAY (Single Pass - O(n)):
Place 3 labeled buckets on the floor: [ Red ] [ Blue ] [ Green ].
Pick up each sock once and toss it into its matching bucket. (100 fast drops).
Now simply look into each bucket: Is the count even? Done! (3 quick checks).
```

```text
Input Collection: [ 'a', 'b', 'a', 'c', 'a', 'b' ]

Step 1: Read 'a' -> Map: { 'a': 1 }
Step 2: Read 'b' -> Map: { 'a': 1, 'b': 1 }
Step 3: Read 'a' -> Map: { 'a': 2, 'b': 1 }
Step 4: Read 'c' -> Map: { 'a': 2, 'b': 1, 'c': 1 }
Step 5: Read 'a' -> Map: { 'a': 3, 'b': 1, 'c': 1 }
Step 6: Read 'b' -> Map: { 'a': 3, 'b': 2, 'c': 1 }

Final Frequency Table:
┌───────────┬─────────┐
│ Character │ Count   │
├───────────┼─────────┤
│    'a'    │    3    │
│    'b'    │    2    │
│    'c'    │    1    │
└───────────┴─────────┘
```

---

## 2. How Frequency Counting Works Step-by-Step

A Frequency Counter operates in two distinct phases:

1. **Phase 1 (The Accumulation Pass):** Loop through the data once from left to right. Insert each element into a hash map or increment its existing count.
2. **Phase 2 (The Verification Pass):** Either iterate over the map keys to check properties (e.g., is any count $> 1$?), or iterate through a second collection and decrement matching counts.

```text
Comparing Two Strings for Identical Letters:
String 1: "listen"    String 2: "silent"

Phase 1: Accumulate String 1 ("listen") into Map:
  l -> 1
  i -> 1
  s -> 1
  t -> 1
  e -> 1
  n -> 1

Phase 2: Decrement using String 2 ("silent"):
  Inspect 's' -> found in Map (count 1 -> 0)
  Inspect 'i' -> found in Map (count 1 -> 0)
  Inspect 'l' -> found in Map (count 1 -> 0)
  Inspect 'e' -> found in Map (count 1 -> 0)
  Inspect 'n' -> found in Map (count 1 -> 0)
  Inspect 't' -> found in Map (count 1 -> 0)

All counts returned to 0 without dipping below 0 -> Strings are identical in letters!
```

### Choosing Storage: Fixed 26-Slot Array vs Map

| Storage Type | When to Choose | Time Complexity | Auxiliary Space | Engine Memory Behavior |
| :--- | :--- | :---: | :---: | :--- |
| **Fixed Array** `new Array(26).fill(0)` | Alphabet is strictly known (e.g., lowercase `a-z`) | $O(1)$ read/write | $O(1)$ strictly fixed (26 slots) | Packed SMI array; zero GC churn; zero hash computation |
| **`Map` Object** `new Map()` | Keys are arbitrary strings, numbers, or objects | $O(1)$ average read/write | $O(k)$ where $k$ is unique keys | Allocates hash table buckets; rehashes as entry count grows |

---

## 3. Pattern Recognition of Frequency Counting

Learn to identify frequency counting within 30 seconds of reading an interview problem:

### 30-Second Problem Triggers
- Any problem asking if two strings or arrays have the **same contents in different order**.
- Any problem asking for the **first non-repeating element** or **most frequent element**.
- Any problem asking to **group items by shared character components**.
- Any problem asking to find **duplicates within an array or sliding range**.

### Problem Keywords to Look For
- *"Anagram"* or *"Permutation of a string"*
- *"Count of occurrences"* or *"Frequency of each value"*
- *"First unique / non-repeating"*
- *"Majority element"* or *"Top K elements"*
- *"Can rearrange characters to form..."*

### The 10^7 Operations Rule
- If the input length $n \le 10^5$, an $O(n^2)$ nested search does $(10^5)^2 = 10^{10}$ operations, causing an instant **Time Limit Exceeded (TLE)** error.
- A Frequency Counter runs in $O(n)$ time ($\approx 10^5$ operations), executing in under 5 milliseconds in Node.js!

### When NOT to Use Frequency Counting
- **Order matters strictly:** If the problem asks for the *longest increasing subsequence* or *contiguous subarray in original relative order*, simple frequency counts discard index positions.
- **Strictly $O(1)$ memory with an unbounded alphabet:** If memory cannot exceed a few bytes and input strings are huge with arbitrary Unicode characters, you may need an in-place sort or two-pointer scan instead.

---

## 4. Problem 1: Valid Anagram

### Problem Statement
Given two strings `s` and `t`, return `true` if `t` is an **anagram** of `s`, and `false` otherwise. An anagram is a word formed by rearranging the letters of another word, using all original letters exactly once.

- **Example 1:** `s = "anagram"`, `t = "nagaram"` $\to$ `true`
- **Example 2:** `s = "rat"`, `t = "car"` $\to$ `false`
- **Constraints:** $1 \le s.length, t.length \le 5 \times 10^4$. Strings consist only of lowercase English letters.

---

### Step 1: Physical Simulation

Place letter cards on a table:
- Word 1: `[ r | a | t ]`
- Word 2: `[ c | a | r ]`

How would your hands check this without writing code?
1. First, count the cards. Both have 3 cards. Good.
2. Pick up the first letter of Word 1: `'r'`. Look through Word 2, find `'r'`, and remove both.
3. Pick up the second letter of Word 1: `'a'`. Look through Word 2, find `'a'`, and remove both.
4. Pick up the third letter of Word 1: `'t'`. Look through Word 2... all that remains is `'c'`.
5. There is no `'t'` left to match! You immediately stop and say: **"These are not anagrams."**

---

### Step 2: Brute Force Approach

Let us translate that exact human instinct into code. For every character in `s`, we search for it in `t` using `indexOf()`. When found, we slice it out of `t` so it cannot be matched again:

```javascript
// Node.js code
function isAnagramBruteForce(s, t) {
  if (s.length !== t.length) return false;

  let remaining = t;
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    const index = remaining.indexOf(char); // O(n) linear scan through remaining string

    if (index === -1) {
      return false; // Character in s does not exist in t
    }

    // Slice out matched character to avoid duplicate matches (O(n) string copy!)
    remaining = remaining.slice(0, index) + remaining.slice(index + 1);
  }

  return remaining.length === 0;
}
```

#### Complexity Analysis:
- **Time Complexity:** $O(n^2)$. The outer loop runs $n$ times. Inside, `indexOf()` scans up to $n$ characters, and `slice()` creates a new string copying $n$ characters. Total operations: $n \times (n + n) \approx 2n^2$.
- **Space Complexity:** $O(n)$ due to repeated string allocations.
- **Scale Failure:** For $n = 50,000$, $n^2 = 2.5 \times 10^9$ operations. In Node.js, this freezes for over 3 seconds and triggers an interview timeout!

---

### Step 3: Bottleneck

Let us ask: **Where is the CPU wasting effort?**
- On every single letter of `s`, `remaining.indexOf(char)` scans through `t` from left to right. That is $n$ linear scans.
- Every `slice()` call allocates a brand-new string in memory and copies characters over, creating heavy garbage collection work.
- **The Core Problem:** We do not care *where* the letters are located inside `t`. We only care *how many* of each letter exist! Searching for positions is completely wasted work.

---

### Step 4: The Pattern Discovery

If we only care about counts, we do not need to search:
1. Since inputs are lowercase English letters (`'a'` to `'z'`), there are only **26 possible characters**.
2. We can create an array of 26 integer slots, where index `0` represents `'a'`, index `1` represents `'b'`, up to index `25` for `'z'`.
3. In a single pass over `s`, we increment each character's count.
4. In a single pass over `t`, we decrement each character's count.
5. If any slot ends up negative, `t` had an extra character that was not in `s`!
6. By replacing linear search (`indexOf`) with array indexing (`charCodeAt(i) - 97`), lookup time drops from **$O(n)$ to $O(1)$**!

---

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(1) space frequency array
function isAnagram(s, t) {
  // Fast exit: Anagrams MUST have identical lengths
  if (s.length !== t.length) {
    return false;
  }

  // Fixed 26-slot integer array for letters 'a' through 'z'
  const letterCounts = new Array(26).fill(0);

  // Pass 1: Count characters in string s
  for (let i = 0; i < s.length; i++) {
    const charCode = s.charCodeAt(i) - 97; // 97 is ASCII for 'a'
    letterCounts[charCode]++;
  }

  // Pass 2: Decrement counts using string t
  for (let i = 0; i < t.length; i++) {
    const charCode = t.charCodeAt(i) - 97;
    letterCounts[charCode]--;

    // If count drops below zero, t has more of this character than s
    if (letterCounts[charCode] < 0) {
      return false;
    }
  }

  return true;
}

// ❌ ANTI-PATTERN / COMMON BUG: Sorting strings to compare
function isAnagramSortAntiPattern(s, t) {
  if (s.length !== t.length) return false;
  // Inefficiency: split() allocates an array, sort() takes O(n log n), join() allocates string
  return s.split("").sort().join("") === t.split("").sort().join("");
}

// Example runs
console.log(isAnagram("anagram", "nagaram")); // true
console.log(isAnagram("listen", "silent"));   // true
console.log(isAnagram("rat", "car"));         // false
console.log(isAnagram("aa", "a"));            // false
```

#### Complexity Derivation:
- **Time Complexity:** $O(n)$ where $n$ is string length. We do one pass over `s` ($n$ steps) and one pass over `t` ($n$ steps). $n + n = 2n \implies O(n)$.
- **Space Complexity:** $O(1)$ auxiliary space. The array size is strictly fixed at 26 elements, regardless of whether the string has 10 characters or 1,000,000 characters.

---

## 5. Problem 2: Group Anagrams

### Problem Statement
Given an array of strings `strs`, group the **anagrams** together. You can return the answer in any order.

- **Example 1:** `strs = ["eat","tea","tan","ate","nat","bat"]`  
  $\to$ `[ ["bat"], ["nat","tan"], ["ate","eat","tea"] ]`
- **Example 2:** `strs = [""]` $\to$ `[ [""] ]`
- **Example 3:** `strs = ["a"]` $\to$ `[ ["a"] ]`
- **Constraints:** $1 \le strs.length \le 10^4$, $0 \le strs[i].length \le 100$. All strings consist of lowercase English letters.

---

### Step 1: Physical Simulation

You have index cards scattered across a table:
`["eat", "tea", "tan", "ate", "nat", "bat"]`

How do your eyes group them without writing code?
1. Pick up `"eat"`. Write its letters in alphabetical order: `"aet"`. Create a folder labeled **`"aet"`** and put `"eat"` inside.
2. Pick up `"tea"`. Sort its letters: `"aet"`. That folder already exists! Put `"tea"` into folder **`"aet"`**.
3. Pick up `"tan"`. Sort its letters: `"ant"`. Create a new folder labeled **`"ant"`** and put `"tan"` inside.
4. Pick up `"ate"`. Sort its letters: `"aet"`. Put into folder **`"aet"`**.
5. Pick up `"nat"`. Sort its letters: `"ant"`. Put into folder **`"ant"`**.
6. Pick up `"bat"`. Sort its letters: `"abt"`. Create folder **`"abt"`** and put `"bat"` inside.
7. Hand over the contents of all folders: `[ ["eat", "tea", "ate"], ["tan", "nat"], ["bat"] ]`.

---

### Step 2: Brute Force Approach

Without a Hash Map, you must compare every word against every other word using a nested loop and a `visited` array to prevent duplicate groupings:

```javascript
// Node.js code
function groupAnagramsBruteForce(strs) {
  const result = [];
  const visited = new Array(strs.length).fill(false);

  for (let i = 0; i < strs.length; i++) {
    if (visited[i]) continue;

    const group = [strs[i]];
    visited[i] = true;

    for (let j = i + 1; j < strs.length; j++) {
      if (!visited[j] && isAnagram(strs[i], strs[j])) {
        group.push(strs[j]);
        visited[j] = true;
      }
    }

    result.push(group);
  }

  return result;
}
```

#### Complexity Analysis:
- **Time Complexity:** $O(n^2 \cdot k)$ where $n$ is number of strings and $k$ is maximum word length. We make $\frac{n(n-1)}{2}$ pair comparisons, each running `isAnagram` taking $O(k)$ time.
- For $n = 10,000$ and $k = 100$: $\approx \frac{10^8}{2} \times 100 = 5 \times 10^9$ operations! Freezes Node.js completely.

---

### Step 3: Bottleneck

- Why are we comparing `"ate"` against `"bat"`, `"tan"`, and `"nat"`?
- The algorithm has **no instant memory**. Every new word is forced to check all previously seen words one by one.
- **The Solution:** We need an instant, $O(1)$ way to know which bucket a word belongs to without asking every existing word!

---

### Step 4: The Pattern Discovery

What gives instant $O(1)$ insertion into named buckets? A **Hash Map** (`Map`)!
- But what should the Map key be?
- Notice that every word in an anagram group has the exact same character counts.
- If we generate a **Canonical Fingerprint Key** for each word, all anagrams will produce the exact same key!

```text
Fingerprint Key Option 1: Sorted String (Standard)
"eat" -> split -> sort -> join -> "aet"
"tea" -> split -> sort -> join -> "aet"
"ate" -> split -> sort -> join -> "aet"
All three map directly to key "aet"!

Fingerprint Key Option 2: 26-Count Character Vector (Faster for long strings)
"eat" -> 1 'a', 1 'e', 1 't' -> "1#0#0#0#1#...#1"
Avoids O(k log k) sort entirely! Runs in pure O(k) time!
```

---

### Step 5: The Optimal Solution

```javascript
// ✅ CORRECT: Optimal grouping using Map and sorted canonical keys
function groupAnagrams(strs) {
  const anagramGroups = new Map();

  for (let i = 0; i < strs.length; i++) {
    const word = strs[i];
    const canonicalKey = word.split("").sort().join("");

    let group = anagramGroups.get(canonicalKey);
    if (group === undefined) {
      group = [];
      anagramGroups.set(canonicalKey, group);
    }
    group.push(word);
  }

  return Array.from(anagramGroups.values());
}

// ❌ ANTI-PATTERN / COMMON BUG: Using a plain Object {} instead of Map
function buggyGroupAnagrams(strs) {
  const groups = {}; // BUG: Inherits Object.prototype properties!

  for (const word of strs) {
    const key = word.split("").sort().join("");
    // If input contains words like "toString" or "constructor",
    // groups[key] accesses prototype methods instead of an array!
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(word); // Crashes if key matches a prototype method!
  }

  return Object.values(groups);
}

// Example runs
console.log(groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]));
// [ [ 'eat', 'tea', 'ate' ], [ 'tan', 'nat' ], [ 'bat' ] ]

console.log(groupAnagrams([""]));
// [ [ '' ] ]

console.log(groupAnagrams(["a"]));
// [ [ 'a' ] ]
```

#### Complexity Derivation:
- **Time Complexity:** $O(n \cdot k \log k)$ where $n$ is the number of words and $k$ is the maximum length of a word.
  - Sorting each word takes $O(k \log k)$ time.
  - Doing this across $n$ words takes $O(n \cdot k \log k)$.
  - Hash Map lookups and insertions take $O(k)$ average time for string hashing.
  - Total time: $O(n \cdot k \log k)$. Since $k \le 100$, $k \log k \approx 100 \times 7 = 700$ operations (virtually instant).
- **Space Complexity:** $O(n \cdot k)$ auxiliary space to store all words and keys inside the `Map`.

---

## 6. Under the Hood: V8 & Node.js

### 1. V8 Heap Allocations with String Splitting

When you write `word.split("").sort().join("")`, here is what happens inside the V8 engine:

```text
word ("eat")
  │
  ├──> .split("") ──> Allocates new V8 Array in Young Generation (Nursery)
  │                   Allocates 3 individual 1-character String objects: "e", "a", "t"
  │
  ├──> .sort()   ──> Executes in-place TimSort on the array
  │
  └──> .join("")  ──> Allocates a brand-new SeqString ("aet") in heap memory
```

If your Node.js backend processes an incoming CSV file with 500,000 words, this naive one-liner creates **over 2,500,000 temporary objects** in the V8 heap nursery. This triggers frequent **Scavenge Garbage Collection pauses**, causing latency spikes on your HTTP endpoints!

#### The High-Throughput Alternative: Character Count Key ($O(k)$)
For high-traffic systems, generate a frequency string key without allocating array slices:

```javascript
// Node.js code
function getFrequencyKey(word) {
  const counts = new Array(26).fill(0);
  for (let i = 0; i < word.length; i++) {
    counts[word.charCodeAt(i) - 97]++;
  }
  // Creates single key like: "1#0#0#0#1#...#1"
  return counts.join("#");
}
```

---

### 2. The Plain Object Prototype Trap in Node.js

Why do we strictly mandate `new Map()` over `{}` for grouping?

In JavaScript, plain objects inherit from `Object.prototype`. If an API client submits tags like `"toString"`, `"valueOf"`, or `"__proto__"`:

```javascript
// Node.js code
const groups = {};
const key = "toString"; // Anagram signature of "toString"

console.log(groups[key]); // Prints [Function: toString] ! (Not undefined!)
groups[key].push("test"); // CRASH! TypeError: groups[key].push is not a function!
```

Using `new Map()` prevents this completely because `Map.prototype.get()` only returns keys explicitly inserted into the map.

---

### 3. Single-Threaded Event Loop Starvation

Node.js executes JavaScript on a single thread. If an HTTP request handler performs an unoptimized $O(n^2)$ frequency calculation on 50,000 records:

```text
Incoming HTTP GET /group-tags ──> [ Node.js Main Thread ] (LOCKED for 3.4 seconds!)
Incoming HTTP GET /healthz    ──> [ BLOCKED IN EVENT LOOP QUEUE ]
Incoming Socket Heartbeat     ──> [ BLOCKED IN EVENT LOOP QUEUE ]
```

During those 3.4 seconds:
- Kubernetes liveness probes (`/healthz`) fail, causing your container to be killed and restarted!
- All other concurrent users experience timeouts.
- **Rule:** Never run $O(n^2)$ frequency loops on data larger than 2,000 items on the main event loop thread.

---

## 7. Hands-On Coding Exercise: Clean Catalog Tags

### Scenario
You are building an e-commerce catalog service in Node.js. Sellers upload product search tags. You must write a tag cleaner that identifies all duplicate tags that are anagrams of one another, grouping them so the search engine does not index duplicate filter variations.

### Buggy Code
The junior engineer submitted the following function. It fails on edge cases and crashes on specific tag inputs:

```javascript
// Node.js code
function cleanCatalogTagsBuggy(tags) {
  const map = {};

  for (let i = 0; i <= tags.length; i++) { // Bug 1: Off-by-one loop boundary
    const tag = tags[i];
    const key = tag.split("").sort().join(""); // Bug 2: Fails when tag is null or undefined

    if (map[key] === undefined) { // Bug 3: Fails on prototype keys like "constructor"
      map[key] = [];
    }
    map[key].push(tag);
  }

  return Object.values(map);
}
```

### Acceptance Criteria
1. Must handle empty array inputs gracefully by returning `[]`.
2. Must not throw errors on prototype property names (`"constructor"`, `"toString"`).
3. Must group tags in $O(n \cdot k \log k)$ time.
4. Fix the off-by-one loop boundary condition.

### Solution Code

```javascript
// ✅ CORRECT: Optimal grouping using Map and normalized keys
function cleanCatalogTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return [];
  }

  // Use Map to prevent prototype key collisions
  const groups = new Map();

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    if (typeof tag !== "string") continue; // Guard against non-string elements

    // Normalize tag by trimming whitespace and lowercasing
    const normalized = tag.trim().toLowerCase();
    const canonicalKey = normalized.split("").sort().join("");

    let group = groups.get(canonicalKey);
    if (group === undefined) {
      group = [];
      groups.set(canonicalKey, group);
    }
    group.push(normalized);
  }

  return Array.from(groups.values());
}

// Example runs
console.log(cleanCatalogTags([])); // []

const inputTags = ["silent", "listen", "constructor", "enlist"];
console.log(cleanCatalogTags(inputTags));
// [ [ 'silent', 'listen', 'enlist' ], [ 'constructor' ] ]
```

---

## 8. Tricky Points and Edge Cases

### 1. Strings with Different Lengths
Always check `if (s.length !== t.length) return false;` at the very first line of any anagram check. It eliminates 90% of non-matching comparisons in $O(1)$ time before touching loops or memory.

### 2. Unicode and Special Characters Break 26-Slot Arrays
The 26-slot array trick assumes standard lowercase English letters (`'a'` to `'z'`, ASCII 97 to 122).
If input contains uppercase letters, spaces, accented characters (`'é'`), or emojis (`'🚀'`), `charCodeAt()` returns values outside the `0..25` index range:
- `s.charCodeAt(i) - 97` becomes negative or $> 25$, resulting in `undefined` array slot access!
- **Fix:** If the problem specifies arbitrary Unicode characters, use a `Map` instead of a 26-slot array.

### 3. In-Place Array Mutation Bugs
Remember that `Array.prototype.sort()` sorts **in place** and mutates the array. When writing frequency helpers, never mutate an input array that the caller might reuse. Always clone or use `toSorted()` (Node.js 20+).

---

## 9. Summary

- **The Frequency Counter pattern** replaces $O(n^2)$ nested search loops with two sequential $O(n)$ linear scans by accumulating counts into a hash structure.
- **Fixed-size integer arrays (26 slots)** provide the fastest possible $O(1)$ memory solution when inputs are restricted to lowercase English letters (`'a'` through `'z'`).
- **Dynamic `Map` structures** should be chosen over plain JavaScript objects `{}` to avoid prototype property collision bugs (`toString`, `constructor`) and ensure secure handling of user-generated keys.
- **Canonical Fingerprint Keys** allow grouping items that share identical character frequencies:
  - Alphabetically sorted strings (`split('').sort().join('')`) take $O(k \log k)$ time.
  - Character frequency vectors (`counts.join('#')`) take $O(k)$ time and avoid array allocation churn.
- **V8 Engine realities:** Rapid string splitting inside tight loops allocates millions of nursery objects, causing GC scavenge pauses. Pre-allocating fixed arrays preserves memory locality.
- **Event loop protection:** Synchronous frequency processing on datasets larger than $10^5$ elements must be avoided on the main thread to prevent starving HTTP health checks and socket heartbeats.

---

## 10. Cheat Sheet

### Decision Table

| Problem Type | Recommended Technique | Time | Space | Example Key Code |
| :--- | :--- | :---: | :---: | :--- |
| **Anagram verification** (`s`, `t`) | Fixed 26-slot array | $O(n)$ | $O(1)$ | `counts[s.charCodeAt(i) - 97]++` |
| **Arbitrary Unicode anagram** | Dynamic `Map` | $O(n)$ | $O(u)$ | `map.set(char, (map.get(char) \|\| 0) + 1)` |
| **Anagram grouping** ($k \le 100$) | `Map` + Sorted String Key | $O(n \cdot k \log k)$ | $O(n \cdot k)$ | `word.split('').sort().join('')` |
| **Anagram grouping** ($k > 10,000$) | `Map` + Frequency Key | $O(n \cdot k)$ | $O(n \cdot k)$ | `counts.join('#')` |

### Common Pitfalls List
- **Missing length check:** Forgetting `s.length !== t.length` early check.
- **Prototype pollution:** Using `{}` instead of `new Map()`, causing crashes on `"constructor"`.
- **ASCII shift mistake:** Forgetting to subtract `97` when converting lowercase characters to 0-indexed positions.
- **Ignoring Case/Spaces:** Forgetting to ask the interviewer if `"Listen"` and `"silent "` are anagrams.

### Reusable Code Template

```javascript
// Generic Frequency Counter Skeleton
function buildFrequencyMap(items) {
  const frequencyMap = new Map();
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    frequencyMap.set(item, (frequencyMap.get(item) || 0) + 1);
  }
  return frequencyMap;
}
```

---

## 11. Interview Q&A

### 45-Second Technical Pitch
> *"The Frequency Counter pattern eliminates slow nested loop scans by storing item occurrence counts in a Hash Map or fixed array. Instead of re-scanning an array to compare elements in $O(n^2)$ time, we count occurrences in a single $O(n)$ pass and verify them in a second $O(n)$ pass. For English text, we use a 26-slot fixed array to guarantee $O(1)$ extra space and zero garbage collection overhead. In backend Node.js services, we use `Map` rather than plain objects to prevent prototype pollution attacks."*

---

### 1. Why does a 26-slot array use O(1) space while a Map uses O(n)?
**Answer:**
Big O space complexity measures how memory allocations scale relative to the input size $n$. When using a fixed 26-slot array for lowercase English letters, the allocated memory is strictly 26 integers, regardless of whether the input string has 10 characters or 10,000,000 characters. Since the memory consumption does not grow with $n$, it is mathematically constant: $O(1)$. In contrast, a Hash Map storing arbitrary unique keys or full words allocates new buckets proportional to the number of distinct elements, scaling with $O(n)$ auxiliary space.

---

### 2. What happens if you use a plain object {} to count words in Node.js?
**Answer:**
It prints `1` for `"apple"`, but prints `'function Object() { [native code] }1'` for `"constructor"`.
In JavaScript, plain objects inherit from `Object.prototype`. The property `counts["constructor"]` already exists before any loop runs; it references the built-in Object constructor function. Because `counts["constructor"]` is truthy, the code evaluates `counts["constructor"] + 1`, coercing the function to a string and appending `'1'`. This corrupts counter state. To fix this, always use `new Map()` or `Object.create(null)`.

---

### 3. Spot and fix the bug in this anagram check function.
```javascript
// Node.js code
function isAnagramBuggy(s, t) {
  if (s.length !== t.length) return false;
  const map = new Map();
  for (const c of s) map.set(c, (map.get(c) || 0) + 1);
  for (const c of t) {
    if (map.has(c)) map.set(c, map.get(c) - 1);
  }
  for (const count of map.values()) {
    if (count !== 0) return false;
  }
  return true;
}
```
**Answer:**
The bug occurs when string `t` contains characters that were never in string `s`. The condition `if (map.has(c))` simply ignores characters in `t` that do not exist in `s` instead of returning `false`. For example, with `s = "aa"` and `t = "bb"`, the second loop sees that `'b'` is not in the map and does nothing. At the end, the map still has `{'a': 2}`, which is caught, but if `s = "aab"` and `t = "aac"`, `'c'` is ignored and `'b'` remains count 1. More critically, if `map.get(c)` reaches `0` and appears again in `t`, it continues decrementing into negative numbers without early exit. The correct condition must be `if (!map.has(c) || map.get(c) === 0) return false;`.

---

### 4. How do you group 200,000 strings without blocking the Node.js event loop?
**Answer:**
Grouping 200,000 strings in a synchronous loop on the main thread would consume several seconds of continuous CPU time, starving the event loop and dropping incoming HTTP connections.
To solve this in production:
1. **Worker Threads (`worker_threads`):** Offload the CPU-heavy sorting and grouping computation to a background worker thread pool. The main thread remains 100% responsive to incoming HTTP requests, health checks, and I/O.
2. **Chunking via `setImmediate`:** If worker threads cannot be used, process the array in asynchronous batches (e.g., 5,000 strings per tick) using `setImmediate()` to yield control back to the libuv event loop between chunks.
3. **Database Offloading:** If the data originates from PostgreSQL or MongoDB, offload grouping to the database layer using `GROUP BY` or MongoDB aggregation pipelines (`$group`), allowing the database engine's optimized multi-threaded C++ runtime to process data before transmitting it over the wire.

---

## 12. Practice Problems

### 1. Valid Anagram - Easy
Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.
- **Sample Input 1:** `s = "anagram"`, `t = "nagaram"`
- **Expected Output 1:** `true`
- **Sample Input 2:** `s = "rat"`, `t = "car"`
- **Expected Output 2:** `false`
- **Sample Input 3:** `s = "aacc"`, `t = "ccac"`
- **Expected Output 3:** `false`

### 2. Group Anagrams - Medium
Given an array of strings `strs`, group the anagrams together. You can return the answer in any order.
- **Sample Input 1:** `strs = ["eat","tea","tan","ate","nat","bat"]`
- **Expected Output 1:** `[["bat"],["nat","tan"],["ate","eat","tea"]]`
- **Sample Input 2:** `strs = [""]`
- **Expected Output 2:** `[[""]]`
- **Sample Input 3:** `strs = ["a"]`
- **Expected Output 3:** `[["a"]]`

### 3. Find All Anagrams in a String - Medium
Given two strings `s` and `p`, return an array of all the start indices of `p`'s anagrams in `s`. You may return the answer in any order.
- **Sample Input 1:** `s = "cbaebabacd"`, `p = "abc"`
- **Expected Output 1:** `[0, 6]` (Explanation: Substring at index 0 is "cba", anagram of "abc". Substring at index 6 is "bac", anagram of "abc".)
- **Sample Input 2:** `s = "abab"`, `p = "ab"`
- **Expected Output 2:** `[0, 1, 2]`

---

<nav aria-label="Lecture navigation">

[Previous: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Opposing & Symmetrical](day-06-two-pointers-opposing-and-symmetrical.md)

</nav>
