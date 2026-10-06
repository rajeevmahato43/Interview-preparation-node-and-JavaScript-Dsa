# Day 53: Trie Construction and Prefix Search

<nav aria-label="Lecture navigation">
  <a href="day-52-greedy-traversal-jump-game-gas-station.md">◀ Day 52: Greedy Traversal: Jump Game and Gas Station</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-54-union-find-disjoint-set-union.md">Day 54: Union-Find: Disjoint Set Union (DSU) ▶</a>
</nav>

---

## Learning Outcomes

- Master the **Trie (Prefix Tree)** data structure and its node-and-pointer mechanical hierarchy.
- Implement core Trie operations—`insert`, `search`, and `startsWith`—in $O(L)$ time, where $L$ is the string length.
- Contrast child pointer storage trade-offs in JavaScript: **`Map` / Plain Object** versus **Fixed 26-Element Array**.
- Solve **Word Search II** by coupling Trie prefix pruning with 2D Grid Backtracking.
- Understand how Radix Trees (compressed Tries) power URL routing in high-performance Node.js frameworks like Fastify and Hono.
- Build search-as-you-type autocomplete engines and IP routing tables with sub-millisecond retrieval latency.

---

## Prerequisites

- [Day 03: String Manipulation and Two Pointers](day-03-string-manipulation-and-two-pointers.md) — Character encoding, strings, and prefix matching.
- [Day 25: Grid Backtracking and N-Queens](day-25-grid-backtracking-and-n-queens.md) — 2D matrix exploration and backtracking state restoration.
- [Day 31: Binary Tree Fundamentals and DFS](day-31-binary-tree-fundamentals-and-dfs.md) — Tree nodes, recursive traversal, and pointer navigation.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Practical / Interview Impact |
| :--- | :--- | :--- |
| **Trie (Prefix Tree)** | An $N$-ary tree where each node represents a character, and the path from root to node represents a common prefix. | Enables $O(L)$ lookups and prefix matching independent of total dictionary size. |
| **`isEndOfWord`** | A boolean flag marking whether a specific node corresponds to the termination of a complete valid word. | Distinguishes between standalone words and mere prefixes (e.g., `"app"` vs. `"apple"`). |
| **Radix Tree / Patricia Trie** | A space-optimized Trie where every node with only one child is merged with its child. | The exact internal routing mechanism behind Fastify, Express routers, and Linux routing tables. |
| **Alphabet Indexing** | Mapping `'a'` through `'z'` to indices $0 \dots 25$ using `char.charCodeAt(0) - 97`. | Provides constant-time indexing and contiguous memory locality in V8 engines. |
| **Prefix Pruning** | Abandoning recursive search branches immediately when the current character sequence does not exist in the Trie. | Reduces Word Search II from exponential $O(M \cdot N \cdot 4^L)$ to microseconds. |

---

## Core Concepts & Mechanical Architecture

### 1. Trie Anatomy and Prefix Sharing

A **Trie** organizes a set of strings hierarchically:
- The **Root Node** is an empty sentinel containing no character.
- Each descendant edge represents a character.
- Words with common prefixes share the same chain of ancestor nodes.

```text
Trie Structure for Words: ["app", "apple", "beer", "bat"]:

                    ( Root )
                   /        \
                 'a'        'b'
                 /          / \
               'p'        'e' 'a'
               /          /     \
          [ 'p' ]*      'e'    [ 't' ]*
            /           /
          'l'       [ 'r' ]*
          /
       [ 'e' ]*

* indicates isEndOfWord = true.
Notice:
- "app" and "apple" share nodes 'a' -> 'p' -> 'p'.
- Querying startsWith("be") stops at node 'e' and returns true in 2 hops!
```

---

### 2. Node Implementation: Map vs. Fixed Array

```text
Child Storage Comparison:
Option A: Fixed 26-Array                       Option B: JavaScript Map
Node {                                         Node {
  children: [null, Node('b'), ...null] (x26)     children: Map('b' => Node('b'))
  isEndOfWord: false                             isEndOfWord: false
}                                              }
Pros: O(1) index arithmetic, fast V8 hidden    Pros: Compact for sparse trees,
classes for lowercase English letters.         supports Unicode, emojis, digits.
```

```javascript
// Node.js code: Production Trie Implementation
class TrieNode {
  constructor() {
    /** @type {Map<string, TrieNode>} */
    this.children = new Map();
    this.isEndOfWord = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  /**
   * Inserts a word into the Trie.
   * Time Complexity: O(L) where L = word.length
   * Space Complexity: O(L)
   * @param {string} word
   */
  insert(word) {
    let curr = this.root;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (!curr.children.has(ch)) {
        curr.children.set(ch, new TrieNode());
      }
      curr = curr.children.get(ch);
    }
    curr.isEndOfWord = true;
  }

  /**
   * Returns true if the word is in the Trie.
   * Time Complexity: O(L)
   * @param {string} word
   * @returns {boolean}
   */
  search(word) {
    let curr = this.root;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (!curr.children.has(ch)) return false;
      curr = curr.children.get(ch);
    }
    return curr.isEndOfWord;
  }

  /**
   * Returns true if there is any word in the Trie that starts with the given prefix.
   * Time Complexity: O(L)
   * @param {string} prefix
   * @returns {boolean}
   */
  startsWith(prefix) {
    let curr = this.root;
    for (let i = 0; i < prefix.length; i++) {
      const ch = prefix[i];
      if (!curr.children.has(ch)) return false;
      curr = curr.children.get(ch);
    }
    return true; // Reached prefix node successfully
  }
}

// Verification
const trie = new Trie();
trie.insert('apple');
console.log('Search "apple":', trie.search('apple'));   // true
console.log('Search "app":', trie.search('app'));       // false
console.log('StartsWith "app":', trie.startsWith('app')); // true
trie.insert('app');
console.log('Search "app" after insert:', trie.search('app')); // true
```

---

### 3. Word Search II: Trie Pruning with 2D Backtracking

In **Word Search II** (LeetCode 212), given an $M \times N$ board of characters and a dictionary `words`, find all words on the board.
- Naive search: Run 2D backtracking for every word independently $\implies O(K \cdot M \cdot N \cdot 4^L)$, which times out.
- **Trie Optimization**: Insert all dictionary words into a Trie. Walk the grid once, advancing in the Trie simultaneously. If the current grid character path does **not** exist in the Trie, terminate that backtracking branch immediately (**prefix pruning**)!

```text
Word Search II Pruning Mechanics:
Grid:
[ ['o', 'a', 'a', 'n'],
  ['e', 't', 'a', 'e'],
  ['i', 'h', 'k', 'r'],
  ['i', 'f', 'l', 'v'] ]
Trie has: ["oath", "pea", "eat", "rain"]

Step 1: Cell (0, 0) is 'o'. Trie has child 'o'! Continue.
Step 2: Neighbor (0, 1) is 'a'. Trie path 'o' -> 'a' exists! Continue.
Step 3: Neighbor (1, 1) is 't'. Trie path 'o' -> 'a' -> 't' exists! Continue.
Step 4: Neighbor (2, 1) is 'h'. Trie path 'o' -> 'a' -> 't' -> 'h' matches word "oath"!
        Record "oath". Set word = null to prevent duplicate reporting.
        Prune leaf nodes to accelerate future searches!
```

```javascript
// Node.js code: Word Search II with Trie Pruning
/**
 * @param {character[][]} board
 * @param {string[]} words
 * @returns {string[]}
 */
function findWords(board, words) {
  // 1. Build Trie
  const root = { children: new Map(), word: null };
  for (const w of words) {
    let curr = root;
    for (const ch of w) {
      if (!curr.children.has(ch)) {
        curr.children.set(ch, { children: new Map(), word: null });
      }
      curr = curr.children.get(ch);
    }
    curr.word = w; // Store full word at terminal node
  }

  const rows = board.length;
  const cols = board[0].length;
  const result = [];

  function dfs(r, c, parentNode) {
    const ch = board[r][c];
    const currNode = parentNode.children.get(ch);
    if (!currNode) return; // Pruned: prefix does not exist!

    // Check if word matched
    if (currNode.word !== null) {
      result.push(currNode.word);
      currNode.word = null; // Prevent duplicate additions
    }

    // In-place visited marker
    board[r][c] = '#';

    // Explore 4 neighbors
    const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] !== '#') {
        dfs(nr, nc, currNode);
      }
    }

    // Backtrack restore
    board[r][c] = ch;

    // Leaf node pruning optimization: delete empty branches
    if (currNode.children.size === 0 && currNode.word === null) {
      parentNode.children.delete(ch);
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (root.children.has(board[r][c])) {
        dfs(r, c, root);
      }
    }
  }

  return result;
}

const testBoard = [
  ['o','a','a','n'],
  ['e','t','a','e'],
  ['i','h','k','r'],
  ['i','f','l','v']
];
console.log('Found words:', findWords(testBoard, ['oath','pea','eat','rain'])); // ['oath', 'eat']
```

---

## Detailed Node.js Relevance

### Fastify URL Routing and Radix Trees

In high-performance Node.js HTTP frameworks (Fastify, Hono, Find-My-Way):

```text
Fastify HTTP Radix Tree Routing:
                       ( /api/v1/ )
                      /            \
                 "users"          "orders"
                /       \             \
             "/:id"    "/search"     "/:orderId"
```

1. **Why Express Degrades on 100+ Routes**: Traditional Express routes are stored in a flat array of regular expressions. Matching a route requires checking every regex in sequence ($O(N)$ regex evaluations).
2. **Sub-Microsecond Radix Routing**: Fastify compiles routes into a Radix Tree. Incoming URLs are evaluated character-by-character along prefix branches in $O(L)$ time, completely independent of whether the API has 10 routes or 10,000 routes!

---

## Tricky Points & Edge Cases

1. **Duplicate Words in Word Search II**:
   Multiple distinct grid paths can spell the exact same word. To prevent returning duplicates, either store results in a `Set` or set `currNode.word = null` immediately after capturing it.
2. **Prefix vs. Complete Word**:
   In `search("app")`, if the Trie contains `"apple"`, the node for `'p'` exists, but its `isEndOfWord` flag is `false`. A common bug is returning `true` simply because the node exists. Only `startsWith()` returns `true` on non-terminal nodes.
3. **Empty String Query**:
   `search("")` should return `true` only if an empty string was explicitly inserted (`root.isEndOfWord === true`).
4. **Pruning Leaf Nodes**:
   In Word Search II, deleting leaf nodes from the Trie as words are matched (`parentNode.children.delete(ch)`) dramatically prunes future traversal branches, speeding up execution by up to $10\times$.

---

## Hands-On Exercise

### Scenario
You are developing a live type-ahead autocomplete service in Node.js for an e-commerce search bar. You receive an array of product titles.
Implement `AutocompleteEngine`:
1. `insert(word)`: Adds a product name to the dictionary.
2. `getSuggestions(prefix, maxResults)`: Returns an array of up to `maxResults` complete words starting with `prefix`, sorted alphabetically.
3. If no words match the prefix, return `[]`.
4. Ensure lookups do not traverse the entire dictionary.

### Buggy Code
```javascript
class AutocompleteEngine {
  constructor() {
    this.words = [];
  }

  insert(word) {
    this.words.push(word);
  }

  getSuggestions(prefix, maxResults) {
    // BUG: Full dictionary scan takes O(N * L) time on every keystroke!
    const matches = this.words.filter(w => w.startsWith(prefix));
    return matches.sort().slice(0, maxResults);
  }
}
```

### Acceptance Criteria
- Use a Trie to navigate directly to the prefix node in $O(\text{prefix.length})$ time.
- Collect all descendant words using DFS starting exclusively from the prefix node.
- Return at most `maxResults` suggestions sorted alphabetically.
- Handle non-matching prefixes gracefully without crashing.

### Solution Code
```javascript
const assert = require('assert');

// Node.js code: Production Trie Autocomplete Engine
class AutoNode {
  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
  }
}

class AutocompleteEngine {
  constructor() {
    this.root = new AutoNode();
  }

  insert(word) {
    let curr = this.root;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (!curr.children.has(ch)) {
        curr.children.set(ch, new AutoNode());
      }
      curr = curr.children.get(ch);
    }
    curr.isEndOfWord = true;
  }

  /**
   * @param {string} prefix
   * @param {number} [maxResults=5]
   * @returns {string[]}
   */
  getSuggestions(prefix, maxResults = 5) {
    let curr = this.root;

    // 1. Navigate to the prefix node in O(prefix.length)
    for (let i = 0; i < prefix.length; i++) {
      const ch = prefix[i];
      if (!curr.children.has(ch)) {
        return []; // Prefix does not exist
      }
      curr = curr.children.get(ch);
    }

    const suggestions = [];

    // 2. DFS to collect words under prefix node
    function dfsCollect(node, currentWord) {
      if (suggestions.length >= maxResults) return;

      if (node.isEndOfWord) {
        suggestions.push(currentWord);
      }

      // Sort child characters alphabetically to guarantee sorted output
      const sortedKeys = Array.from(node.children.keys()).sort();
      for (const ch of sortedKeys) {
        dfsCollect(node.children.get(ch), currentWord + ch);
        if (suggestions.length >= maxResults) break;
      }
    }

    dfsCollect(curr, prefix);
    return suggestions;
  }
}

// Verification & Automated Unit Tests
const engine = new AutocompleteEngine();
engine.insert('apple');
engine.insert('app');
engine.insert('application');
engine.insert('applet');
engine.insert('banana');
engine.insert('apply');

// Suggestions for "app" (max 3)
const res1 = engine.getSuggestions('app', 3);
assert.deepStrictEqual(res1, ['app', 'apple', 'applet']);

// Suggestions for "app" (max 5)
const res2 = engine.getSuggestions('app', 5);
assert.deepStrictEqual(res2, ['app', 'apple', 'applet', 'application', 'apply']);

// Non-matching prefix
assert.deepStrictEqual(engine.getSuggestions('xyz', 3), []);

// Suggestions for "ban"
assert.deepStrictEqual(engine.getSuggestions('ban', 3), ['banana']);

console.log('✅ All AutocompleteEngine assertions passed successfully!');
```

### Solution Explanation
1. **Direct Prefix Navigation**: Instead of scanning millions of words, the algorithm jumps straight down the Trie in $O(\text{prefix.length})$ steps.
2. **Subtree DFS Scoping**: DFS only explores branches under the target prefix node, ignoring the rest of the dictionary.
3. **Sorted Traversal**: Iterating sorted children keys produces lexicographically sorted results on the fly without post-sorting.

---

## Summary

- A **Trie** is a specialized tree data structure designed for efficient string retrieval, prefix querying, and autocomplete.
- Core operations (`insert`, `search`, `startsWith`) run in $O(L)$ time where $L$ is word length, independent of dictionary size.
- **Word Search II** combines Trie prefix pruning with 2D grid backtracking to avoid exploring invalid character branches.
- High-performance Node.js frameworks (Fastify) utilize Radix Trees (compressed Tries) to achieve sub-microsecond HTTP route dispatching.

---

## Cheat Sheet & Common Pitfalls

| Operation | Time Complexity | Auxiliary Space | Key Invariant |
| :--- | :--- | :--- | :--- |
| **`insert(word)`** | $O(L)$ | $O(L)$ new nodes | Set `isEndOfWord = true` at final node |
| **`search(word)`** | $O(L)$ | $O(1)$ | Must verify `curr.isEndOfWord === true` |
| **`startsWith(p)`** | $O(L)$ | $O(1)$ | Return `true` if all characters exist |
| **Word Search II** | $O(M \cdot N \cdot 4^L)$ | $O(\sum L)$ | Prune Trie leaf nodes upon word match |

---

## Interview Questions

### 1. What are the space and time advantages of a Trie compared to a Hash Table for string lookups?
**Question:** Compare a Trie with a Hash Table (such as a JavaScript `Set` or `Map`) for string storage and prefix operations.

**Answer:**
- **Exact Lookups**:
  - Hash Table: $O(L)$ to compute the hash function and compare strings on collision.
  - Trie: $O(L)$ to traverse character pointers.
- **Prefix Matching (`startsWith`)**:
  - Hash Table: $O(N \cdot L)$ because it must scan all $N$ keys and evaluate `str.startsWith(p)`.
  - Trie: $O(L)$ because it simply follows prefix pointers and returns true if the node exists.
- **Memory Consumption**:
  - Hash Table: Stores full duplicate string keys, leading to redundant memory when words share large prefixes.
  - Trie: Common prefixes share nodes, but each node has pointer overhead (`Map` or array of 26 pointers). A Trie uses less memory for dense prefix dictionaries and more memory for sparse, non-overlapping strings.

---

### 2. How does a Radix Tree (Compact Trie) optimize standard Trie memory?
**Question:** Explain how a Radix Tree (Patricia Trie) eliminates redundant nodes in a standard Trie, and how Fastify uses it for HTTP routing.

**Answer:**
1. In a standard Trie, each node represents a single character. If a chain of nodes has only one child and no terminal words (e.g., `'u'` $\to$ `'s'` $\to$ `'e'` $\to$ `'r'`), it allocates 4 distinct node objects.
2. A **Radix Tree** compresses single-child chains into a single edge labeled with the composite string: `"/user"`.
3. This reduces tree height from the number of characters to the number of route divergence points.
4. **Fastify Routing**: Fastify compiles registered route URLs (like `/api/v1/users/:id` and `/api/v1/orders/:id`) into a Radix Tree. Matching an incoming URL requires only navigating shared string chunks and parameter segments in $O(\text{URL.length})$ time, eliminating regex scanning.

---

### 3. How do you implement prefix pruning in Word Search II to achieve top runtime performance?
**Question:** In LeetCode 212, what optimization prevents redundant traversals after a word has already been discovered?

**Answer:**
1. **Word Consumed Sentinel**: When a word is found during DFS, record it in the results and immediately set `node.word = null`. This prevents finding the same word again from another grid path.
2. **Leaf Node Removal**: After returning from recursive DFS calls on child nodes, check if the current child node has become a leaf (`childNode.children.size === 0 && childNode.word === null`).
3. If it is an empty leaf, delete it from the parent: `parentNode.children.delete(char)`.
4. This iteratively prunes branches of words that have already been discovered, pruning future grid traversals from ever visiting those paths again.

---

### 4. What happens when storing non-ASCII or Unicode characters in a fixed 26-element array Trie?
**Question:** What failure occurs if you use a fixed 26-element array `children = new Array(26)` for a Trie that receives Unicode characters or capital letters?

**Answer:**
1. A fixed 26-element array relies on the arithmetic indexing formula `char.charCodeAt(0) - 97`, which maps lowercase English `'a'` (code 97) to 0 and `'z'` (code 122) to 25.
2. If the input contains uppercase letters (e.g., `'A'`, code 65), the formula produces negative numbers (`65 - 97 = -32`), creating out-of-bounds array properties in JavaScript (`arr[-32]`), causing silent bugs or `TypeError`.
3. If the input contains emojis, Cyrillic, or accents, values exceed 25, creating sparse properties on the array object that break V8 contiguous array optimizations.
4. **Fix**: Use a JavaScript `Map` (`this.children = new Map()`) whenever input strings are not strictly guaranteed to be lowercase English letters.

---

<nav aria-label="Lecture navigation">
  <a href="day-52-greedy-traversal-jump-game-gas-station.md">◀ Day 52: Greedy Traversal: Jump Game and Gas Station</a> |
  <a href="../javascript-dsa-roadmap.md">Roadmap</a> |
  <a href="day-54-union-find-disjoint-set-union.md">Day 54: Union-Find: Disjoint Set Union (DSU) ▶</a>
</nav>
