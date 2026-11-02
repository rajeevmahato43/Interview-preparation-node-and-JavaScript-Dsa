# Day 05: Hash Table Patterns: Frequency, Complements & Duplicates

<nav aria-label="Lecture navigation">

[Previous: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Opposing & Symmetrical Scans](day-06-two-pointers-opposing-and-symmetrical.md)

</nav>

---

## 1. The Frequency Counter Pattern

The **Frequency Counter** pattern uses a hash table (like a `Map`) or a fixed array to count how many times each item appears in a list. It counts everything in a single pass ($O(n)$). This replaces slow nested loops ($O(n^2)$) with fast $O(1)$ lookups.

To picture this in real life, imagine sorting a laundry basket of 100 socks of different colors into matching pairs:

* **The Slow Way (Nested Loop - $O(n^2)$):** You pick up one red sock. You search through the other 99 socks in the basket one by one to find its match. Then you pick up a blue sock and search through the whole basket again. You search the whole basket 100 times ($100 \times 100 = 10,000$ checks).
* **The Frequency Counter Way ($O(n)$):** You place labeled boxes on the floor: `[Red]`, `[Blue]`, `[Green]`. You go through the basket once and drop each sock into its matching box ($100$ quick drops). Then you just look at each box to see if every count is an even number. You finish the whole task in one pass.

```javascript
// Node.js code
"use strict";

const fruits = ["apple", "banana", "apple", "orange", "banana", "apple"];

// Count how many times each fruit appears in one pass
const frequencyMap = new Map();
for (let i = 0; i < fruits.length; i++) {
  const item = fruits[i];
  frequencyMap.set(item, (frequencyMap.get(item) || 0) + 1);
}

console.log(frequencyMap.get("apple"));  // 3
console.log(frequencyMap.get("banana")); // 2
console.log(frequencyMap.get("orange")); // 1
```

### 1.1 The Two-Phase Counting Rule

A frequency counter usually works in two simple steps:

1. **Step 1 (Count):** Go through the first list and count how many times each item appears. Store these counts in memory.
2. **Step 2 (Check):** Go through the second list or target. Subtract from the counts or check if the numbers match. Each check takes fast $O(1)$ time.

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
> **Self-Check:** Why does subtracting counts in Step 2 let us stop early when checking anagrams?  
> *Answer:* If any count in the map drops below `0`, the second string has an extra character that does not belong. We can stop immediately and return `false`.

---

### 1.2 Fixed Array vs Map Storage

Deciding between a fixed array and a `Map` is an important choice for speed and memory:

```text
┌───────────────────────────────┬───────────────────────────────┐
│ Fixed 26-Slot Integer Array   │ ES6 Map                       │
├───────────────────────────────┼───────────────────────────────┤
│ Only lowercase English [a-z]  │ Any keys, numbers, strings    │
│ Zero hash collisions          │ Can have hash collisions      │
│ Very fast CPU cache access    │ Extra memory for object links │
│ O(1) fixed stack memory       │ Dynamic heap memory           │
└───────────────────────────────┴───────────────────────────────┘
```

When all inputs are lowercase English letters (`'a'` to `'z'`), using a 26-number array (`new Int32Array(26)`) is much faster. It avoids calculating hash codes and creates fewer objects in memory:

```javascript
// Fast fixed-size bucket array (O(1) extra space)
const counts = new Int32Array(26);

// 'c'.charCodeAt(0) is 99. 99 - 97 = 2
const charCode = "c".charCodeAt(0) - 97;
counts[charCode]++;
console.log(counts[2]); // 1
```

---

## 2. Hash Pattern Overview

Besides counting items, hash tables help us solve problems with two other key patterns: the **Hash Complement** pattern and the **Early-Exit Set** pattern.

### 2.1 Pattern Family

* **Frequency Counting:** Count how many times each item appears. Useful for anagrams, permutations, and finding common items.
* **Hash Complements (The Rearview Mirror):** As you walk through an array, look back into a hash map to see if the partner number ($target - current$) was already seen earlier.
* **Early-Exit Set (The Bouncer's Clipboard):** Keep a `Set` of items you have seen so far. As soon as you see an item that is already in the set, stop immediately and return `true`.
* **Sliding Window Duplicate Tracking:** Keep a `Set` of the last $k$ items. As the window moves forward, delete the item that leaves and add the new item.

### 2.2 Pattern Recognition Table

| Problem Keyword | What It Asks | Recommended Approach |
| :--- | :--- | :--- |
| **"Find pair summing to target"** | Match current number with partner ($target - current$). | Hash Complement with `Map<number, index>`. |
| **"Valid Anagram" / "Permutation"** | Check if letter counts match exactly. | Frequency Counter (`Int32Array(26)` or `Map`). |
| **"Contains Duplicate"** | Check if any number appears more than once. | Early-Exit `Set`. |
| **"Group Anagrams"** | Group words that have the same letters. | Shared Key (`word.split('').sort().join('')`) in `Map`. |
| **"Duplicate within distance K"** | Check for duplicates within a small window. | Sliding `Set` of size $k$. |

### 2.3 When to Use vs When NOT to Use

#### When to Use
* The list is unsorted and you need to find partner numbers or past items in fast $O(1)$ time.
* You need to count items or group items by a shared key.
* You need to check if an item exists quickly without changing the original array.

#### When NOT to Use
* The list is already sorted and you cannot use extra memory (use Two Pointers instead).
* You have a strict limit of $O(1)$ memory and cannot create new maps or sets.
* You need to find sum of elements in a range (use Prefix Sum instead).

### 2.4 The 10^7 Operations Rule

If an array has $n = 100,000$ items:
* A slow nested loop checking every pair takes $(100,000)^2 = 10^{10}$ steps (**10 billion operations**). This freezes Node.js completely.
* Saving items in a `Map` lets you check each partner number in one pass of $100,000$ steps. This finishes in **less than 5 milliseconds**.

---

## 3. Problem Walkthroughs

---

### 3.1 Valid Anagram

#### 3.1.1 Problem Statement
Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise. An anagram is a word made by rearranging the letters of another word, using every original letter exactly once.

* **Sample Input 1:** `s = "anagram"`, `t = "nagaram"` $\to$ **Expected Output:** `true`
* **Sample Input 2:** `s = "rat"`, `t = "car"` $\to$ **Expected Output:** `false`
* **Sample Input 3:** `s = "a"`, `t = "ab"` $\to$ **Expected Output:** `false`
* **Constraints:** $1 \le s.length, t.length \le 5 \times 10^4$, `s` and `t` consist only of lowercase English letters.

#### 3.1.2 How to Think About It
Imagine two letter trays holding letter tiles.

First, count the tiles on each tray. If Tray 1 has 7 tiles and Tray 2 has 6 tiles, they cannot have the same letters. You can stop right away and return `false`!

Now picture a sorting box with 26 small slots, one for each letter from `'a'` to `'z'`:
1. Look at each letter on Tray 1. Drop a marble into that letter's slot.
2. Look at each letter on Tray 2. Take a marble out of that letter's slot.
3. If you ever try to take a marble from an empty slot, Tray 2 has an extra letter that Tray 1 did not have. You can stop immediately and return `false`!
4. If you finish checking all letters on Tray 2 without any problems, both trays had the exact same letters.

#### 3.1.3 Brute Force Approach & Bottleneck
The naive way is to turn both strings into arrays, sort their letters alphabetically, and compare the two strings:

```javascript
function isAnagramBrute(s, t) {
  if (s.length !== t.length) return false;
  return s.split("").sort().join("") === t.split("").sort().join("");
}
```

* **The Bottleneck:** Sorting takes **$O(n \log n)$ time** and creates temporary arrays and strings in memory. For $50,000$ characters, sorting takes about $800,000$ operations. We do not need the letters to be sorted in alphabetical order. We only need to check if the letter counts match.

#### 3.1.4 The Pattern Insight
Use a **Fixed 26-Slot Array to Count Frequencies**:
* Check string lengths first: if `s.length !== t.length`, return `false` right away in $O(1)$ time.
* Pass 1: Go through `s` and add 1 to the count for each letter.
* Pass 2: Go through `t` and subtract 1 from the count for each letter. If any count drops below `0`, return `false` right away.
* This takes $O(n)$ time and uses a fixed 26-slot array ($O(1)$ extra memory).

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

  // Pass 1: Count letter frequencies from s
  for (let i = 0; i < s.length; i++) {
    counts[s.charCodeAt(i) - 97]++;
  }

  // Pass 2: Subtract letter frequencies using t
  for (let i = 0; i < t.length; i++) {
    const idx = t.charCodeAt(i) - 97;
    counts[idx]--;

    // If any count drops below zero, t has an extra letter
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
* **Why it fails:** Without checking string lengths first (`s.length !== t.length`), a shorter string `t` that only has some of the letters of `s` (like `s = "aa"` and `t = "a"`) will wrongly return `true`.

#### 3.1.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$, where $n$ is the length of the string. We read each string once in a single loop.
* **Auxiliary Space Complexity:** $\mathbf{O(1)}$. The array always has 26 numbers, no matter how long the string is.

---

### 3.2 Two Sum

#### 3.2.1 Problem Statement
Given an array of numbers `nums` and a target sum `target`, find the **indices** (positions) of the two numbers that add up to `target`. You can assume that each input has exactly one correct pair, and you cannot use the same element twice.

* **Sample Input 1:** `nums = [2, 7, 11, 15]`, `target = 9` $\to$ **Expected Output:** `[0, 1]`
* **Sample Input 2:** `nums = [3, 2, 4]`, `target = 6` $\to$ **Expected Output:** `[1, 2]`
* **Sample Input 3:** `nums = [3, 3]`, `target = 6` $\to$ **Expected Output:** `[0, 1]`
* **Constraints:** $2 \le nums.length \le 10^4$, $-10^9 \le nums[i], target \le 10^9$.

#### 3.2.2 How to Think About It
Imagine number cards placed on a table in front of you: `[2, 7, 11, 15]`, with `target = 9`.

You look at the first card at index 0, which is `2`.  
You ask yourself: "What partner number do I need to make 9?"
$$\text{Partner} = 9 - 2 = 7$$
You check your small notepad. It is blank. So you write down: `"I saw 2 at index 0"`.

Next, you look at the card at index 1, which is `7`.  
You ask yourself: "What partner number do I need?"
$$\text{Partner} = 9 - 7 = 2$$
You check your notepad. It says: `"I saw 2 at index 0!"`  
You have found your pair! You stop right away and return `[0, 1]`.

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

* **The Bottleneck:** Checking every pair with two nested loops takes $O(n^2)$ time. For $10,000$ numbers, this can take up to $50,000,000$ comparisons. The inner loop keeps looking forward through the whole list over and over.

#### 3.2.4 The Pattern Insight
Instead of looking forward through the array again and again, look backward using a **Hash Map as a Rearview Mirror**:
* Map Key = the number value
* Map Value = the index where you found that number

As you step through `nums`, find the needed partner: `complement = target - nums[i]`.  
Check `seen.has(complement)` in fast $O(1)$ time. If it is already in your map, return `[seen.get(complement), i]`. If it is not there yet, save `nums[i] -> i` in the map and keep going.

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
* **Why it fails:** In a two-pass approach, if `target - nums[i] === nums[i]` (for example, target is 6 and the number is 3), the map finds the number at index 0 and pairs the number with itself. A single-pass approach prevents this bug automatically because we only add a number to the map *after* we check for its partner.

#### 3.2.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n)}$. We go through the array once. Checking and adding items to a `Map` takes $O(1)$ average time per number.
* **Auxiliary Space Complexity:** $\mathbf{O(n)}$. In the worst case, we store up to $n$ numbers in the map.

---

### 3.3 Group Anagrams

#### 3.3.1 Problem Statement
Given an array of words `strs`, group all words that are anagrams of each other together into separate lists. You can return the groups in any order.

* **Sample Input 1:** `strs = ["eat","tea","tan","ate","nat","bat"]`  
  $\to$ **Expected Output:** `[["bat"],["nat","tan"],["ate","eat","tea"]]`
* **Sample Input 2:** `strs = [""]` $\to$ **Expected Output:** `[[""]]`
* **Sample Input 3:** `strs = ["a"]` $\to$ **Expected Output:** `[["a"]]`
* **Constraints:** $1 \le strs.length \le 10^4$, $0 \le strs[i].length \le 100$, `strs[i]` consists of lowercase English letters.

#### 3.3.2 How to Think About It
Imagine cards with words written on them: `["eat", "tea", "tan", "ate", "nat", "bat"]`.

Pick up the first card: `"eat"`. Sort its letters in alphabetical order: `"aet"`.  
Take a folder, write `"aet"` on the tab, and put `"eat"` inside.

Pick up the next card: `"tea"`. Sort its letters: `"aet"`.  
You already have a folder labeled `"aet"`! Slip `"tea"` right into that folder.

Pick up `"tan"`. Sort its letters: `"ant"`.  
You do not have an `"ant"` folder yet, so make a new folder labeled `"ant"` and put `"tan"` inside.

Any words that have the exact same letters will produce the exact same sorted label!

#### 3.3.3 Brute Force Approach & Bottleneck
Compare each word with every other word using two nested loops, marking words that were already grouped:

* **The Bottleneck:** Comparing every pair of words takes $O(n^2 \cdot k)$ time, where $k$ is the length of a word. For $10,000$ words, this takes over $100,000,000$ operations. It is way too slow and will time out.

#### 3.3.4 The Pattern Insight
Use a **Hash Map with a Shared Key**:
* Make a shared key for each word by sorting its letters: `word.split('').sort().join('')`.
* Use this sorted string as the key in a `Map`. The value is a list of words that share that key.
* All words with the same letters go into the same list in quick $O(1)$ lookup time.

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
* **Why it fails:** If any word's sorted key happens to be a built-in property name like `"constructor"` or `"toString"`, a plain JavaScript object `{}` finds the built-in function instead of an array. Calling `.push()` on it throws a `TypeError`. Using `new Map()` avoids this problem completely.

#### 3.3.8 Complexity Derivation
* **Time Complexity:** $\mathbf{O(n \cdot k \log k)}$, where $n$ is the number of words and $k$ is the maximum length of a word. Sorting each word takes $O(k \log k)$ time, and we do this for all $n$ words.
* **Auxiliary Space Complexity:** $\mathbf{O(n \cdot k)}$. We store all the words inside the lists in the map.

---

## 4. Tricky Edge Cases

* **Strings with Different Lengths:** When checking for anagrams, check `if (s.length !== t.length) return false;` at the very start. Do not waste time in a loop if the two strings have different lengths.
* **Using the Same Element Twice in Two Sum:** Make sure your partner lookup does not pair a number with itself at the same index. Doing everything in a single pass fixes this naturally.
* **Built-in Object Names Crashing Plain Objects:** Words like `"toString"`, `"valueOf"`, or `"constructor"` exist on standard JavaScript objects. Always use `new Map()` to store arbitrary word keys safely.
* **Zeros and Negative Numbers in Two Sum:** The formula $\text{target} - \text{current}$ works for negative numbers and zero just as well as positive numbers. Make sure to use `.has()` to check the map, instead of a truthy check like `if (seen.get(val))`, because `seen.get(val)` returns `0` for the first index, which JavaScript treats as falsy.

---

## 5. Summary Cheat Sheet

* **Frequency Counter:** Counts how many times items appear in one pass ($O(n)$) instead of using slow nested loops ($O(n^2)$).
* **26-Slot Fixed Array:** Use `new Int32Array(26)` when working only with lowercase English letters (`'a'` to `'z'`). It is faster and uses less memory than a `Map`.
* **Hash Complement Pattern:** Find the partner number with $\text{partner} = \text{target} - \text{current}$, and check if you saw it before using a `Map` in fast $O(1)$ time.
* **Shared Key Pattern:** Group anagrams by sorting the letters of each word (`word.split('').sort().join('')`) to use as a shared key in a `Map`.
* **Single-Pass Safety:** Adding a number to your map *after* checking for its partner stops a number from pairing with itself.

---

## 6. Practice Problems

### 6.1 First Unique Character in a String - Easy / Warm-Up
Given a string `s`, find the first non-repeating character in it and return its index. If it does not exist, return `-1`.
* **Sample Input 1:** `s = "leetcode"` $\to$ **Expected Output:** `0`
* **Sample Input 2:** `s = "loveleetcode"` $\to$ **Expected Output:** `2`
* **Sample Input 3:** `s = "aabb"` $\to$ **Expected Output:** `-1`
* **Constraints:** $1 \le s.length \le 10^5$, `s` consists of only lowercase English letters.
* **Hint 1:** Count how many times each letter appears using a 26-slot array in your first pass.
* **Hint 2:** In a second pass, return the index of the first letter whose count is exactly `1`.

---

### 6.2 Contains Duplicate II - Medium
Given an integer array `nums` and an integer `k`, return `true` if there are two distinct indices `i` and `j` in the array such that `nums[i] === nums[j]` and `Math.abs(i - j) <= k`.
* **Sample Input 1:** `nums = [1, 2, 3, 1]`, `k = 3` $\to$ **Expected Output:** `true`
* **Sample Input 2:** `nums = [1, 0, 1, 1]`, `k = 1` $\to$ **Expected Output:** `true`
* **Sample Input 3:** `nums = [1, 2, 3, 1, 2, 3]`, `k = 2` $\to$ **Expected Output:** `false`
* **Constraints:** $1 \le nums.length \le 10^5$, $-10^9 \le nums[i] \le 10^9$, $0 \le k \le 10^5$.
* **Hint 1:** Store the most recent index of each number in a `Map<number, index>`.
* **Hint 2:** When you see a number again, check if `currentIndex - lastIndex <= k`. If yes, return `true`; otherwise, update the map with `currentIndex`.

---

### 6.3 Longest Consecutive Sequence - Hard / Advanced
Given an unsorted array of integers `nums`, return the length of the longest consecutive elements sequence. You must write an algorithm that runs in strictly **$O(n)$ time**.
* **Sample Input 1:** `nums = [100, 4, 200, 1, 3, 2]` $\to$ **Expected Output:** `4` (the sequence `[1, 2, 3, 4]`)
* **Sample Input 2:** `nums = [0, 3, 7, 2, 5, 8, 4, 6, 0, 1]` $\to$ **Expected Output:** `9`
* **Constraints:** $0 \le nums.length \le 10^5$, $-10^9 \le nums[i] \le 10^9$.
* **Hint 1:** Store all numbers in a `Set` so you can look up any number in fast $O(1)$ time.
* **Hint 2:** Only start counting a streak from `num` if `num - 1` is NOT in the set. This makes sure you only count forward from the beginning of a sequence.

---

<nav aria-label="Lecture navigation">

[Previous: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Opposing & Symmetrical Scans](day-06-two-pointers-opposing-and-symmetrical.md)

</nav>
