# Day 05: Hash Table Patterns: Frequency, Complements & Duplicates

<nav aria-label="Lecture navigation">

[Previous: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Opposing & Symmetrical Scans](day-06-two-pointers-opposing-and-symmetrical.md)

</nav>

---

## 1. The Frequency Counter Pattern

The **Frequency Counter** pattern uses a hash table or a fixed-size integer array to tally the occurrences of items in a single linear pass ($O(n)$). It replaces nested search loops ($O(n^2)$) with instant $O(1)$ lookups.

To picture this physically, imagine sorting a laundry basket of 100 mismatched colored socks into pairs:
* **The Slow Way (Nested Scan - $O(n^2)$):** You pull out one red sock. You rummage through all 99 remaining socks in the basket one-by-one looking for its match. Then you pull out a blue sock and rummage through the entire basket again. You search through the basket 100 times ($100 \times 100 = 10,000$ operations).
* **The Frequency Counter Way ($O(n)$):** You place labeled bins on the floor: `[Red]`, `[Blue]`, `[Green]`. You empty the basket once, tossing each sock directly into its labeled bin ($100$ quick drops). Now you glance into each bin: is every count an even number? Done in a single pass.

```javascript
// Node.js code
"use strict";

const fruits = ["apple", "banana", "apple", "orange", "banana", "apple"];

// Single-pass frequency tally
const frequencyMap = new Map();
for (let i = 0; i < fruits.length; i++) {
  const item = fruits[i];
  frequencyMap.set(item, (frequencyMap.get(item) || 0) + 1);
}

console.log(frequencyMap.get("apple"));  // 3
console.log(frequencyMap.get("banana")); // 2
console.log(frequencyMap.get("orange")); // 1
```

### 1.1 The Two-Phase Tallying Invariant

A frequency counter operates in two distinct phases:
1. **Phase 1 (The Accumulation Pass):** Traverse the first collection to construct the frequency tally in memory.
2. **Phase 2 (The Verification Pass):** Traverse the second collection or search target, decrementing counts or matching frequencies in $O(1)$ time per element.

```text
Input: ['a', 'b', 'a', 'c', 'a', 'b']

Read 'a'  ──►  Map: { 'a': 1 }
Read 'b'  ──►  Map: { 'a': 1, 'b': 1 }
Read 'a'  ──►  Map: { 'a': 2, 'b': 1 }
Read 'c'  ──►  Map: { 'a': 2, 'b': 1, 'c': 1 }
Read 'a'  ──►  Map: { 'a': 3, 'b': 1, 'c': 1 }
Read 'b'  ──►  Map: { 'a': 3, 'b': 2, 'c': 1 }
```

> [!NOTE]
> **Self-Check:** Why does decrementing counts in Phase 2 allow early termination when validating anagrams?  
> *Answer:* If a count in the frequency map ever drops below `0`, the second string must contain an extra instance of that character, enabling an immediate early return of `false`.

---

### 1.2 Fixed Array vs Map Storage

Choosing between a flat typed array and a `Map` is a vital memory optimization:

```text
┌───────────────────────────────┬───────────────────────────────┐
│ Fixed 26-Slot Integer Array   │ ES6 Map                       │
├───────────────────────────────┼───────────────────────────────┤
│ Fixed lowercase Latin [a-z]   │ Arbitrary keys, UTF-16, Emojis│
│ Zero hash collisions          │ Buckets & collision chains    │
│ Highest CPU L1 cache locality │ Object reference overhead     │
│ O(1) fixed stack memory       │ Dynamic heap allocations      │
└───────────────────────────────┴───────────────────────────────┘
```

When inputs are strictly lowercase English letters (`'a'` to `'z'`), using an integer array (`new Int32Array(26)`) avoids hash computation and object allocations entirely:

```javascript
// Fast fixed-size bucket array (O(1) auxiliary space)
const counts = new Int32Array(26);

// 'c'.charCodeAt(0) is 99. 99 - 97 = 2
const charCode = "c".charCodeAt(0) - 97;
counts[charCode]++;
console.log(counts[2]); // 1
```

---

## 2. Hash Pattern Overview

Beyond frequency counting, hash tables unlock two foundational algorithmic patterns: the **Hash Complement** pattern and the **Early-Exit Set** pattern.

### Hash Pattern Family
* **Frequency Counting:** Record exact occurrences of elements to verify anagrams, permutations, or majority items.
* **Hash Complements (The Rearview Mirror):** While moving forward through an array, look backward into a hash map to check whether the required partner value ($K - \text{current}$) was seen earlier.
* **Early-Exit Set (The Bouncer's Clipboard):** Keep a running `Set` of inspected elements. The moment an incoming item is already in the set, exit immediately with `true`.
* **Sliding Window Duplicate Tracking:** Keep a `Set` representing a window of size $K$. When the window advances, delete the item leaving the window and insert the new item.

### Pattern Recognition Table

| Problem Keyword | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| **"Find pair summing to target"** | Match current with complement ($target - current$). | Hash Complement with `Map<number, index>`. |
| **"Valid Anagram" / "Permutation"** | Confirm exact character count match. | Frequency Counter (`Int32Array(26)` or `Map`). |
| **"Contains Duplicate"** | Find if any element appears at least twice. | Early-Exit `Set`. |
| **"Group Anagrams"** | Group words sharing identical letters. | Canonical Key (`word.split('').sort().join('')`) in `Map`. |
| **"Duplicate within distance K"** | Check duplicate in sliding range. | Sliding `Set` of size $k$. |

### When to Use
* The input is unsorted and you need to look up pairs or historical values in $O(1)$ time.
* You need to track counts, frequencies, or group items by structural signature.
* You need instant membership validation without modifying the input array.

### When NOT to Use
* The input is already sorted and you must find pairs in $O(1)$ space (use Two Pointers instead).
* Memory constraints are strictly $O(1)$ and extra heap allocations are forbidden.
* You need to query contiguous range sums (use Prefix Sum instead).

### The $10^7$ Operations Constraint Rule
If an array contains $n = 100,000$ elements:
* A naive double loop checking all pairs runs $(100,000)^2 = 10^{10}$ steps (**10 billion operations**), causing complete event loop freeze in Node.js.
* Storing history in a `Map` checks each complement in a single pass of $100,000$ operations, finishing in **under 5 milliseconds**.

---

## 3. Problem Walkthroughs

---

### 3.1 Valid Anagram

#### 3.1.1 Problem Statement
Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise. An anagram is a word formed by rearranging the letters of another word, using all original letters exactly once.

* **Sample Input 1:** `s = "anagram"`, `t = "nagaram"` $\to$ **Expected Output:** `true`
* **Sample Input 2:** `s = "rat"`, `t = "car"` $\to$ **Expected Output:** `false`
* **Sample Input 3:** `s = "a"`, `t = "ab"` $\to$ **Expected Output:** `false`
* **Constraints:** $1 \le s.length, t.length \le 5 \times 10^4$, `s` and `t` consist only of lowercase English letters.

#### 3.1.2 How to Think About It
Imagine two scrabble tile racks.
First, count the tiles on both racks. If Rack 1 has 7 tiles and Rack 2 has 6 tiles, they cannot be anagrams—stop immediately!
Now take a 26-box sorting tray labeled `'a'` through `'z'`.
1. For each letter in Rack 1, toss a marble into its letter box.
2. For each letter in Rack 2, take a marble out of its letter box.
3. If you ever reach for a marble in a box that is already empty, Rack 2 has an extra letter—stop and declare mismatch!
4. If you finish Rack 2 without issues, both racks had the exact same letters.

#### 3.1.3 Brute Force Approach & Bottleneck
The naive approach converts both strings to arrays, sorts them alphabetically, and checks string equality:

```javascript
function isAnagramBrute(s, t) {
  if (s.length !== t.length) return false;
  return s.split("").sort().join("") === t.split("").sort().join("");
}
```

* **The Bottleneck:** Sorting takes **$O(n \log n)$ time** and allocates temporary arrays and strings on the heap. For $50,000$ characters, sorting takes $\approx 800,000$ operations. We do not need alphabetical ordering; we only need matching counts.

#### 3.1.4 The Pattern Insight
Use a **Fixed 26-Slot Integer Array Frequency Counter**:
* Initial length check: if `s.length !== t.length`, return `false` in $O(1)$.
* Pass 1: Increment counts for `s`.
* Pass 2: Decrement counts for `t`. If any slot drops below `0`, exit early with `false`.
* Takes strictly $O(n)$ time and $O(1)$ fixed memory.

#### 3.1.5 Pseudocode

```text
FUNCTION IsAnagram(s, t):
  IF length(s) != length(t) THEN RETURN false

  counts = Array of 26 zeroes

  FOR i FROM 0 TO length(s) - 1:
    index = charCode(s[i]) - 97
    counts[index] = counts[index] + 1

  FOR i FROM 0 TO length(t) - 1:
    index = charCode(t[i]) - 97
    counts[index] = counts[index] - 1
    IF counts[index] < 0 THEN
      RETURN false

  RETURN true
```

#### 3.1.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(1) space 26-slot frequency counter
function isAnagram(s, t) {
  if (typeof s !== "string" || typeof t !== "string") return false;
  if (s.length !== t.length) return false; // Early exit on mismatched length

  const counts = new Int32Array(26);

  // Pass 1: Accumulate character frequencies from s
  for (let i = 0; i < s.length; i++) {
    counts[s.charCodeAt(i) - 97]++;
  }

  // Pass 2: Decrement character frequencies using t
  for (let i = 0; i < t.length; i++) {
    const idx = t.charCodeAt(i) - 97;
    counts[idx]--;

    // If any slot drops below zero, t has an extra letter
    if (counts[idx] < 0) {
      return false;
    }
  }

  return true;
}

// Example runs
console.log(isAnagram("anagram", "nagaram")); // true
console.log(isAnagram("rat", "car"));         // false
console.log(isAnagram("a", "ab"));            // false
```

#### 3.1.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Forgetting length check and checking truthy object counts
function buggyAnagram(s, t) {
  const counts = {};
  for (const c of s) counts[c] = (counts[c] || 0) + 1;
  for (const c of t) {
    if (!counts[c]) return false; // Fails when count is 0 or key is missing
    counts[c]--;
  }
  return true; // BUG: If t is shorter than s, returns true falsely!
}
```
* **Why it fails:** Without an initial length check (`s.length !== t.length`), a shorter `t` that is a subset of `s` (e.g. `s = "aa"`, `t = "a"`) will incorrectly return `true`.

#### 3.1.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$, where $n$ is the length of string `s`. Both strings are traversed in single linear passes.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. The array is strictly fixed at 26 elements regardless of $n$.

---

### 3.2 Two Sum

#### 3.2.1 Problem Statement
Given an array of integers `nums` and an integer `target`, return the **indices** of the two numbers such that they add up to `target`. You may assume that each input has exactly one solution, and you may not use the same element twice.

* **Sample Input 1:** `nums = [2, 7, 11, 15]`, `target = 9` $\to$ **Expected Output:** `[0, 1]`
* **Sample Input 2:** `nums = [3, 2, 4]`, `target = 6` $\to$ **Expected Output:** `[1, 2]`
* **Sample Input 3:** `nums = [3, 3]`, `target = 6` $\to$ **Expected Output:** `[0, 1]`
* **Constraints:** $2 \le nums.length \le 10^4$, $-10^9 \le nums[i], target \le 10^9$.

#### 3.2.2 How to Think About It
Imagine numbers on cards laid out face-up on a table: `[2, 7, 11, 15]`, `target = 9`.
You pick up Card 0 (`2`).
You ask: "What exact partner number do I need to reach 9?"
$$\text{Partner} = 9 - 2 = 7$$
You look at your personal memory notepad. It is empty. You write down: `"I have seen number 2 at index 0"`.
You pick up Card 1 (`7`).
You ask: "What partner number do I need?"
$$\text{Partner} = 9 - 7 = 2$$
You look at your notepad: `"Number 2 is stored at index 0!"`
You stop immediately and return `[0, 1]`.

#### 3.2.3 Brute Force Approach & Bottleneck
The naive approach uses nested loops to test all possible pairs:

```javascript
function twoSumBrute(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }
  return [];
}
```

* **The Bottleneck:** Quadratic pairwise scanning ($O(n^2)$ time). For $10^4$ numbers, this performs up to $5 \times 10^7$ comparisons. The inner loop searches forward blindly for a partner.

#### 3.2.4 The Pattern Insight
Instead of scanning forward, use a **Hash Map Rearview Mirror**:
* Key = number value
* Value = index where it was seen
As you iterate forward through `nums`, calculate `complement = target - nums[i]`.
Check `seen.has(complement)` in $O(1)$ time. If found, return `[seen.get(complement), i]`. If absent, save `nums[i] => i` in the map.

#### 3.2.5 Pseudocode

```text
FUNCTION TwoSum(nums, target):
  seen = new Map()

  FOR i FROM 0 TO length(nums) - 1:
    complement = target - nums[i]

    IF seen.has(complement):
      RETURN [seen.get(complement), i]

    seen.set(nums[i], i)

  RETURN []
```

#### 3.2.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n) time, O(n) space single-pass hash complement
function twoSum(nums, target) {
  if (!Array.isArray(nums) || nums.length < 2) return [];

  // Map stores: Value -> Index where it was encountered
  const seen = new Map();

  for (let i = 0; i < nums.length; i++) {
    const current = nums[i];
    const complement = target - current;

    // Check if the required partner was already indexed
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }

    // Record current number for future elements
    seen.set(current, i);
  }

  return [];
}

// Example runs
console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]
console.log(twoSum([3, 2, 4], 6));       // [1, 2]
console.log(twoSum([3, 3], 6));          // [0, 1]
```

#### 3.2.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Two-pass map that matches an element with itself
function buggyTwoSum(nums, target) {
  const map = new Map();
  // Pass 1: Populate all elements
  for (let i = 0; i < nums.length; i++) map.set(nums[i], i);

  // Pass 2: Search complements
  for (let i = 0; i < nums.length; i++) {
    const comp = target - nums[i];
    // BUG: If target = 6 and nums[0] = 3, map.get(3) returns index 0, matching itself!
    if (map.has(comp)) return [i, map.get(comp)];
  }
  return [];
}
```
* **Why it fails:** In a two-pass approach, when `target - nums[i] === nums[i]`, the lookup matches the current element's own index unless an explicit `map.get(comp) !== i` check is added. Single-pass prevents this naturally because an element is only stored *after* its complement check.

#### 3.2.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. The array is traversed once with $O(1)$ average `Map.has()` and `Map.set()` operations.
* **Auxiliary Space Complexity:** $\mathbf{O(n)}$ auxiliary space to store at most $n$ items in the hash map.

---

### 3.3 Group Anagrams

#### 3.3.1 Problem Statement
Given an array of strings `strs`, group all anagrams together into sub-arrays. You can return the answer in any order.

* **Sample Input 1:** `strs = ["eat","tea","tan","ate","nat","bat"]`  
  $\to$ **Expected Output:** `[["bat"],["nat","tan"],["ate","eat","tea"]]`
* **Sample Input 2:** `strs = [""]` $\to$ **Expected Output:** `[[""]]`
* **Sample Input 3:** `strs = ["a"]` $\to$ **Expected Output:** `[["a"]]`
* **Constraints:** $1 \le strs.length \le 10^4$, $0 \le strs[i].length \le 100$, `strs[i]` consists of lowercase English letters.

#### 3.3.2 How to Think About It
Imagine a stack of index cards with words on them: `["eat", "tea", "tan", "ate", "nat", "bat"]`.
Pick up `"eat"`. Sort its letters alphabetically: `"aet"`.
Place `"eat"` into a file folder labeled **`"aet"`**.
Pick up `"tea"`. Sort its letters: `"aet"`. That folder already exists! Slip `"tea"` into folder **`"aet"`**.
Pick up `"tan"`. Sort its letters: `"ant"`. Create a new folder labeled **`"ant"`** and drop `"tan"` inside.
Every word that is an anagram shares the exact same sorted signature!

#### 3.3.3 Brute Force Approach & Bottleneck
Compare every word with all other words using nested loops and an `isVisited` boolean array.
* **The Bottleneck:** Comparing $n$ words against each other takes $O(n^2 \cdot k)$ time, where $k$ is word length. For $10^4$ words, $(10^4)^2 = 10^8$ operations, leading to timeouts.

#### 3.3.4 The Pattern Insight
Use a **Hash Map with Canonical Keys**:
* Compute a canonical key for each word by sorting its characters: `word.split('').sort().join('')`.
* The sorted string acts as the grouping key in a `Map<string, string[]>`.
* All anagrams naturally accumulate into the same bucket array in $O(1)$ lookup time.

#### 3.3.5 Pseudocode

```text
FUNCTION GroupAnagrams(strs):
  groups = new Map()

  FOR each word in strs:
    key = SortCharacters(word)

    IF NOT groups.has(key):
      groups.set(key, [])

    groups.get(key).append(word)

  RETURN Array.from(groups.values())
```

#### 3.3.6 Optimal Solution

```javascript
// ✅ CORRECT: Optimal O(n * k log k) time, O(n * k) space canonical key grouping
function groupAnagrams(strs) {
  if (!Array.isArray(strs) || strs.length === 0) return [];

  const groups = new Map();

  for (let i = 0; i < strs.length; i++) {
    const word = strs[i];

    // Canonical key: sort characters alphabetically
    const key = word.split("").sort().join("");

    let bucket = groups.get(key);
    if (bucket === undefined) {
      bucket = [];
      groups.set(key, bucket);
    }
    bucket.push(word);
  }

  return Array.from(groups.values());
}

// Example runs
console.log(groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]));
// [ [ 'eat', 'tea', 'ate' ], [ 'tan', 'nat' ], [ 'bat' ] ]
console.log(groupAnagrams([""]));   // [ [ '' ] ]
console.log(groupAnagrams(["a"]));  // [ [ 'a' ] ]
```

#### 3.3.7 Common Anti-Pattern

```javascript
// ❌ ANTI-PATTERN: Plain object dictionary with prototype key collision
function buggyGroupAnagrams(strs) {
  const groups = {}; // BUG: If input contains "constructor" or "toString", crashes!
  for (const word of strs) {
    const key = word.split("").sort().join("");
    if (!groups[key]) groups[key] = [];
    groups[key].push(word);
  }
  return Object.values(groups);
}
```
* **Why it fails:** If any word's anagram key is `"constructor"` or `"toString"`, `groups[key]` returns native prototype functions instead of an array, causing `.push()` to throw an uncaught `TypeError`.

#### 3.3.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n \cdot k \log k)}$, where $n$ is `strs.length` and $k$ is the maximum length of a string. Sorting each string takes $O(k \log k)$ time across $n$ total strings.
* **Auxiliary Space Complexity:** $\mathbf{O(n \cdot k)}$ auxiliary space to store all grouped words inside the hash map.

---

## 4. Tricky Edge Cases

* **Different Length Strings:** In anagram checks, always verify `if (s.length !== t.length) return false;` at line 1. Never waste CPU cycles looping when lengths differ.
* **Self-Matching in Two Sum:** Ensure your complement lookup does not match an element with its own index. Single-pass hashing solves this naturally.
* **Prototype Collisions on Object Dictionaries:** Strings like `"toString"`, `"valueOf"`, and `"constructor"` exist on `Object.prototype`. Always use `new Map()` or `Object.hasOwn()`.
* **Zero and Negative Numbers in Complements:** The formula $\text{target} - \text{current}$ works identically for negative numbers and zero. Ensure map lookup uses `.has()` rather than truthy checks (`if (seen.get(val))`), which fail when the stored index is `0`.

---

## 5. Summary Cheat Sheet

* **Frequency Counter:** Counts element occurrences in a single pass ($O(n)$) to replace quadratic nested scans.
* **26-Slot Integer Array:** Use `new Int32Array(26)` for fixed lowercase English strings to maximize CPU cache locality and avoid heap allocations.
* **Hash Complement Pattern:** Compute $\text{partner} = \text{target} - \text{current}$ and check historical entries in a `Map` in $O(1)$ time.
* **Canonical Keys:** Group anagrams by sorting characters (`word.split('').sort().join('')`) and mapping keys to arrays.
* **Single-Pass Safety:** Inserting items into a `Map` *after* checking complements prevents matching an element with itself.

---

## 6. Practice Problems

### 6.1 First Unique Character in a String - Easy / Warm-Up
Given a string `s`, find the first non-repeating character in it and return its index. If it does not exist, return `-1`.
* **Sample Input 1:** `s = "leetcode"` $\to$ **Expected Output:** `0`
* **Sample Input 2:** `s = "loveleetcode"` $\to$ **Expected Output:** `2`
* **Sample Input 3:** `s = "aabb"` $\to$ **Expected Output:** `-1`
* **Constraints:** $1 \le s.length \le 10^5$, `s` consists of only lowercase English letters.
* **Hint 1:** Count the frequency of each character using a 26-slot integer array in a first pass.
* **Hint 2:** In a second pass, return the index of the first character whose count is exactly `1`.

---

### 6.2 Contains Duplicate II - Medium
Given an integer array `nums` and an integer `k`, return `true` if there are two distinct indices `i` and `j` in the array such that `nums[i] === nums[j]` and `Math.abs(i - j) <= k`.
* **Sample Input 1:** `nums = [1, 2, 3, 1]`, `k = 3` $\to$ **Expected Output:** `true`
* **Sample Input 2:** `nums = [1, 0, 1, 1]`, `k = 1` $\to$ **Expected Output:** `true`
* **Sample Input 3:** `nums = [1, 2, 3, 1, 2, 3]`, `k = 2` $\to$ **Expected Output:** `false`
* **Constraints:** $1 \le nums.length \le 10^5$, $-10^9 \le nums[i] \le 10^9$, $0 \le k \le 10^5$.
* **Hint 1:** Store the most recent index of each number in a `Map<number, index>`.
* **Hint 2:** When a number is encountered again, check if `currentIndex - lastIndex <= k`. If yes, return `true`; otherwise, update the map with `currentIndex`.

---

### 6.3 Longest Consecutive Sequence - Hard / Advanced
Given an unsorted array of integers `nums`, return the length of the longest consecutive elements sequence. You must write an algorithm that runs in strictly **$O(n)$ time**.
* **Sample Input 1:** `nums = [100, 4, 200, 1, 3, 2]` $\to$ **Expected Output:** `4` (the sequence `[1, 2, 3, 4]`)
* **Sample Input 2:** `nums = [0, 3, 7, 2, 5, 8, 4, 6, 0, 1]` $\to$ **Expected Output:** `9`
* **Constraints:** $0 \le nums.length \le 10^5$, $-10^9 \le nums[i] \le 10^9$.
* **Hint 1:** Store all numbers in a `Set` for $O(1)$ lookups.
* **Hint 2:** Only attempt to count a streak from `num` if `num - 1` is NOT in the set (this ensures you only start counting from the beginning of a sequence).

---

<nav aria-label="Lecture navigation">

[Previous: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Opposing & Symmetrical Scans](day-06-two-pointers-opposing-and-symmetrical.md)

</nav>
