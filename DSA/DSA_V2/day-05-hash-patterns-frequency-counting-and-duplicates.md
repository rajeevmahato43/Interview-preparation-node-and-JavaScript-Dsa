# Day 05: Hash Patterns: Frequency & Duplicates

<nav aria-label="Lecture navigation">

[Previous: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Opposing & Symmetrical](day-06-two-pointers-opposing-and-symmetrical.md)

</nav>

## Prerequisites

- [Day 01: Big O Complexity & Problem Solving](day-01-big-o-complexity-and-problem-solving.md) — Asymptotic time & space.
- [Day 04: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md) — `Map` and `Set` $O(1)$ lookups.

---

## 1. What is the Frequency Counter Pattern?

The **Frequency Counter pattern** uses a Hash Map (or fixed array) to count how many times each element appears in a collection.

> **Frequency Map**: A map where keys are unique items and values are their occurrence counts: `Map { "a" => 3, "b" => 1 }`.

### Why Use It?
Instead of nested loops comparing elements ($O(n^2)$), a frequency counter converts comparisons into two separate linear loops ($O(n)$):
1. **Pass 1**: Count elements and save in map.
2. **Pass 2**: Verify or compare counts.

```javascript
// Quick Frequency Counter Helper
function getFrequencies(arr) {
  const counts = new Map();
  for (const item of arr) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }
  return counts;
}
```

---

## 2. Problem 1: Valid Anagram

Given two strings `s` and `t`, return `true` if `t` is an anagram of `s` (contains the exact same characters with the exact same frequencies).

```javascript
// Node.js code: Optimal 26-slot frequency array (O(1) auxiliary space)
function isAnagram(s, t) {
  if (s.length !== t.length) return false;

  const counts = new Array(26).fill(0);

  // Count chars in s, decrement chars in t
  for (let i = 0; i < s.length; i++) {
    counts[s.charCodeAt(i) - 97]++;
    counts[t.charCodeAt(i) - 97]--;
  }

  // If all counts return to 0, they are anagrams
  for (let i = 0; i < 26; i++) {
    if (counts[i] !== 0) return false;
  }

  return true;
}

console.log(isAnagram("anagram", "nagaram")); // true
console.log(isAnagram("rat", "car"));         // false
```
- **Time Complexity:** $O(n)$ — Single loop through strings.
- **Extra Space:** $O(1)$ — Array size is strictly fixed at 26 slots.

---

## 3. Problem 2: Group Anagrams

Given an array of strings `strs`, group the anagrams together.

### The Key Idea: Canonical Hash Key
All anagrams (like `"eat"`, `"tea"`, `"ate"`) produce the exact same word when their characters are sorted: `"aet"`. We use this sorted string as the Map key!

```javascript
// Node.js code
function groupAnagrams(strs) {
  const groups = new Map(); // sortedKey -> array of words

  for (const str of strs) {
    // Generate canonical key by sorting characters
    const key = str.split("").sort().join("");

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(str);
  }

  return Array.from(groups.values());
}

console.log(groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]));
// Output: [ ["eat", "tea", "ate"], ["tan", "nat"], ["bat"] ]
```
- **Time Complexity:** $O(n \times k \log k)$ where $n$ is word count and $k$ is maximum word length.
- **Extra Space:** $O(n \times k)$ — Stores all strings in the Map.

---

## 4. Problem 3: Longest Consecutive Sequence

Given an unsorted array of integers `nums`, find the length of the longest consecutive elements sequence in **$O(n)$ time**.

### The Clever Trick: Only Start at Sequence Beginnings
Put all numbers into a `Set`. A number `x` is the **start** of a sequence if and only if `x - 1` is **not** in the Set!

```javascript
// Node.js code: O(n) Sequence Scanner
function longestConsecutive(nums) {
  const set = new Set(nums);
  let longest = 0;

  for (const num of set) {
    // Only start counting if num is the FIRST element in its sequence
    if (!set.has(num - 1)) {
      let currentNum = num;
      let currentStreak = 1;

      while (set.has(currentNum + 1)) {
        currentNum++;
        currentStreak++;
      }

      longest = Math.max(longest, currentStreak);
    }
  }

  return longest;
}

console.log(longestConsecutive([100, 4, 200, 1, 3, 2])); // 4 (sequence: [1, 2, 3, 4])
```
- **Time Complexity:** $O(n)$ — Each number is visited at most twice.
- **Extra Space:** $O(n)$ — Set stores all numbers.

---

## 5. Tricky Points and Common Traps

1. **Forgetting to check lengths first in anagrams:** If `s.length !== t.length`, return `false` immediately to save work.
2. **Sorting inside Group Anagrams:** For very long strings, sorting characters takes $O(k \log k)$. You can replace the sort with a 26-count frequency string key (e.g., `"1#0#0#..."`) to achieve $O(k)$ key generation.
3. **Longest Consecutive Sequence brute force:** Without the `!set.has(num - 1)` check, the inner loop would run repeatedly for every item, degrading the solution to $O(n^2)$.

---

## 6. Hands-On Exercises

Run this script in Node.js to test anagrams and consecutive sequence counting:

```javascript
// Node.js code
const assert = require("node:assert");

function testAnagram(s, t) {
  if (s.length !== t.length) return false;
  const m = new Map();
  for (const c of s) m.set(c, (m.get(c) || 0) + 1);
  for (const c of t) {
    if (!m.has(c) || m.get(c) === 0) return false;
    m.set(c, m.get(c) - 1);
  }
  return true;
}

assert.equal(testAnagram("listen", "silent"), true);
assert.equal(testAnagram("hello", "world"), false);

console.log("✅ Anagram tests passed!");
```

---

## 7. Summary

- **Frequency Counting** replaces $O(n^2)$ nested loops with two sequential $O(n)$ passes.
- **Fixed arrays** of 26 slots give $O(1)$ auxiliary memory when inputs are lowercase English letters.
- **Group Anagrams** uses a sorted character string or frequency tuple as a common Hash Map key.
- **Longest Consecutive Sequence** runs in $O(n)$ using a Set by only scanning forward when `num - 1` is absent.

---

## 8. Cheat Sheet

| Problem | Hash Technique | Time | Space | Key Insight |
| :--- | :--- | :---: | :---: | :--- |
| **Valid Anagram** | 26-slot array or Map | $O(n)$ | $O(1)$ | Increment on `s`, decrement on `t` |
| **Group Anagrams**| Map of lists | $O(n \cdot k \log k)$ | $O(n \cdot k)$ | Key = `str.split('').sort().join('')` |
| **Consecutive Seq**| Hash Set | $O(n)$ | $O(n)$ | Only count streak if `!set.has(num - 1)` |

---

## 9. Interview Q&A

### 45-Second Explanation
> *"To group anagrams, we need a canonical key that all anagram variations share. We can sort each word's characters alphabetically so 'eat', 'tea', and 'ate' all produce 'aet'. Using this sorted string as the key in a Hash Map, we group matching words into lists, then return the map values in $O(n \cdot k \log k)$ time."*

### Questions & Answers
1. **Why does Longest Consecutive Sequence run in $O(n)$ if there is a `while` loop inside a `for` loop?**
   The `while` loop only executes for numbers that start a sequence (`!set.has(num - 1)`). Each number in the array is visited at most twice (once by the `for` loop, and once by the `while` loop), so the total work is $2n \implies O(n)$.

---

## 10. Practice Problems

### 1. Valid Anagram - Easy
Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise. An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.
- **Input:** `s = "anagram", t = "nagaram"`
- **Expected Output:** `true`
- **Input:** `s = "rat", t = "car"`
- **Expected Output:** `false`

### 2. Group Anagrams - Medium
Given an array of strings `strs`, group the anagrams together. You can return the answer in any order.
- **Input:** `strs = ["eat","tea","tan","ate","nat","bat"]`
- **Expected Output:** `[["bat"],["nat","tan"],["ate","eat","tea"]]`
- **Input:** `strs = [""]`
- **Expected Output:** `[[""]]`
- **Input:** `strs = ["a"]`
- **Expected Output:** `[["a"]]`

### 3. Longest Consecutive Sequence - Medium
Given an unsorted array of integers `nums`, return the length of the longest consecutive elements sequence. You must write an algorithm that runs in $O(n)$ time.
- **Input:** `nums = [100,4,200,1,3,2]`
- **Expected Output:** `4`
- **Input:** `nums = [0,3,7,2,5,8,4,6,0,1]`
- **Expected Output:** `9`

---

<nav aria-label="Lecture navigation">

[Previous: Objects, Maps, Sets & Hash Tables](day-04-objects-maps-sets-and-hash-tables.md) | [Roadmap](../javascript-dsa-roadmap.md) | [Next: Two Pointers: Opposing & Symmetrical](day-06-two-pointers-opposing-and-symmetrical.md)

</nav>
