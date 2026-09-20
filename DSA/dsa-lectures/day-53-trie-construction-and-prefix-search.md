# Day 53: Trie Construction and Prefix Search

## 1. Learning Outcomes
- Master the **Trie (Prefix Tree)** data structure and its tree node representation.
- Implement core Trie operations: `insert`, `search`, and `startsWith` in $O(L)$ time ($L$ = word length).
- Compare child storage representations in JavaScript: **Hash Map** vs. **Fixed 26-Element Array**.
- Solve **Word Search II** combining Trie pruning with 2D Grid Backtracking.
- Connect Tries to real-world high-performance HTTP routers (Fastify radix tree) and search autocomplete in Node.js.

---

## 2. Prerequisites & Navigation
- **Prerequisites**: Day 03 (Strings & Text Patterns), Day 25 (Grid Backtracking), Day 31 (Tree Fundamentals).
- **Navigation**:
  - [Previous: Day 52 - Greedy Traversal: Jump Game & Gas Station](day-52-greedy-traversal-jump-game-gas-station.md)
  - [Roadmap](../javascript-dsa-roadmap.md)
  - [Next: Day 54 - Union-Find: Disjoint Set Union (DSU)](day-54-union-find-disjoint-set-union.md)

---

## 3. Core Concepts & Mental Models
A **Trie** (derived from "re**trie**val") is a tree where each node represents a character of a string. All descendants of a node share the common string prefix associated with that node.

```text
Trie containing: ["app", "apple", "beer", "bat"]:
                    (root)
                   /      \
                 'a'      'b'
                 /        /  \
               'p'      'e'  'a'
               /        /      \
          [ 'p' ]*    'e'     [ 't' ]*
            /         /
          'l'     [ 'r' ]*
          /
       [ 'e' ]*

* indicates isEndOfWord = true.
Shared Prefixes: "app" and "apple" share 3 nodes ('a' -> 'p' -> 'p').
Prefix Search: Checking if any word starts with "be" takes only 2 character hops!
```

---

## 4. Detailed Technical Explanations

### 4.1 Node Representation: Map vs. Array
1. **Object / `Map`**: `children = new Map()`. Flexible, supports full Unicode / ASCII characters with zero wasted memory for sparse nodes.
2. **Fixed 26-Element Array**: `children = new Array(26)`. Index derived via `char.charCodeAt(0) - 97`. Provides instant array access with optimal V8 hidden-class optimizations for lowercase English letters.

### 4.2 Time and Space Complexity
- **Insertion**: $O(L)$ time, $O(L)$ space in worst case (where $L$ is word length).
- **Search (Exact Match)**: $O(L)$ time, $O(1)$ space.
- **Prefix Match (`startsWith`)**: $O(L)$ time, $O(1)$ space.
- **Lookup Independence**: Lookup time depends *only* on the length of the query string, completely independent of how many millions of words are stored in the Trie!

### 4.3 Node.js Relevance: Fastify URL Routing & Autocomplete
Standard web frameworks (Express) match routes using linear regex arrays ($O(N)$ routes). High-performance Node.js frameworks (e.g., **Fastify**, **Hono**) use a Radix Tree (compact Trie) to route incoming HTTP requests. A request for `/api/users/:id` navigates prefix branches in $O(L)$ character comparisons, ensuring route dispatching takes sub-microseconds regardless of API route count.

---

## 5. JavaScript Implementation & Step-by-Step Traces

### 5.1 Production Trie Implementation (LeetCode 208)
```javascript
class TrieNode {
  constructor() {
    this.children = {}; // or new Map()
    this.isEndOfWord = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  /**
   * Inserts a word into the trie.
   * Time Complexity: O(L), Space: O(L)
   */
  insert(word) {
    let curr = this.root;

    for (const char of word) {
      if (!curr.children[char]) {
        curr.children[char] = new TrieNode();
      }
      curr = curr.children[char];
    }

    curr.isEndOfWord = true;
  }

  /**
   * Returns true if the exact word is in the trie.
   * Time Complexity: O(L), Space: O(1)
   */
  search(word) {
    const node = this._traverse(word);
    return node !== null && node.isEndOfWord === true;
  }

  /**
   * Returns true if there is any word in the trie that starts with prefix.
   * Time Complexity: O(L), Space: O(1)
   */
  startsWith(prefix) {
    return this._traverse(prefix) !== null;
  }

  _traverse(str) {
    let curr = this.root;
    for (const char of str) {
      if (!curr.children[char]) {
        return null;
      }
      curr = curr.children[char];
    }
    return curr;
  }
}
```

### 5.2 Word Search II (Trie + 2D Backtracking - LeetCode 212)
```javascript
/**
 * Finds all words from a dictionary present in a 2D board.
 */
function findWords(board, words) {
  const root = new TrieNode();

  // 1. Build Trie from words dictionary
  for (const word of words) {
    let curr = root;
    for (const char of word) {
      if (!curr.children[char]) curr.children[char] = new TrieNode();
      curr = curr.children[char];
    }
    curr.word = word; // Store full word at leaf for O(1) collection
  }

  const result = [];
  const rows = board.length;
  const cols = board[0].length;

  function dfs(r, c, parentNode) {
    const char = board[r][c];
    const currNode = parentNode.children[char];
    if (!currNode) return; // Trie pruning: prefix does not exist

    // Match found!
    if (currNode.word) {
      result.push(currNode.word);
      currNode.word = null; // Avoid duplicate collection
    }

    // Backtrack on grid
    board[r][c] = '#'; // Mark visited

    if (r > 0 && board[r - 1][c] !== '#') dfs(r - 1, c, currNode);
    if (r < rows - 1 && board[r + 1][c] !== '#') dfs(r + 1, c, currNode);
    if (c > 0 && board[r][c - 1] !== '#') dfs(r, c - 1, currNode);
    if (c < cols - 1 && board[r][c + 1] !== '#') dfs(r, c + 1, currNode);

    board[r][c] = char; // Restore original character

    // Optimization: prune leaf nodes to speed up subsequent searches
    if (Object.keys(currNode.children).length === 0) {
      delete parentNode.children[char];
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (root.children[board[r][c]]) {
        dfs(r, c, root);
      }
    }
  }

  return result;
}
```

### 5.3 Execution Trace: Trie Search on "app" vs. "apple"
```text
Trie contains: "apple" (isEndOfWord = true at 'e')
Query 1: search("app")
  Traverse: 'a' -> 'p' -> 'p'. Node reached!
  Check node.isEndOfWord: false (only a prefix, not an inserted word).
  Return FALSE.

Query 2: startsWith("app")
  Traverse: 'a' -> 'p' -> 'p'. Node reached!
  Return TRUE.

Query 3: search("apple")
  Traverse: 'a' -> 'p' -> 'p' -> 'l' -> 'e'. Node reached!
  Check node.isEndOfWord: true.
  Return TRUE.
```

---

## 6. Common Mistakes & Anti-Patterns
- **Confusing `search` with `startsWith`**: `search` requires `node.isEndOfWord === true`. Calling `startsWith` only verifies that the prefix path exists in the tree.
- **Redundant Word Backtracking in Word Search II**: Searching each dictionary word independently on the grid takes $O(W \cdot M \cdot N \cdot 4^L)$. Using a Trie searches all words concurrently, pruning branches the moment a prefix fails.
- **Collecting Duplicate Words in Grid Backtracking**: Multiple paths on the grid can spell the same word. Setting `currNode.word = null` immediately upon adding to results prevents duplicate entries.

---

## 7. Tricky Points & Edge Cases
- **Empty String**: Inserting `""` sets `root.isEndOfWord = true`.
- **Character Case Sensitivity**: Ensure inputs are normalized (e.g., `.toLowerCase()`) if case-insensitive matching is expected.
- **Radix Tree (Compressed Trie)**: In production routers, single-child chains (e.g., `'a' -> 'p' -> 'i'`) are compressed into a single edge `"api"` to save pointer allocations.

---

## 8. Practical Engineering Exercises
1. Implement an **Autocomplete System** that returns the Top 5 most frequent search queries matching a given prefix.
2. Implement **Map Sum Pairs** (LeetCode 677) summing values of all keys starting with a given prefix.

---

## 9. Key Takeaways & Summary
- Tries provide $O(L)$ string insertion, search, and prefix matching regardless of dictionary size.
- Shared prefixes are represented by shared node paths, making Tries memory-efficient for related word sets.
- In Word Search II, a Trie enables simultaneous multi-word search with early prefix pruning.
- Fastify and high-performance Node.js routers utilize Radix Trees for $O(L)$ HTTP request routing.

---

## 10. Quick Reference Cheat Sheet
| Operation | Method | Time Complexity | Auxiliary Space |
| :--- | :--- | :--- | :--- |
| **Insert** | Walk/Create characters, set `isEndOfWord = true` | $O(L)$ | $O(L)$ |
| **Search** | Walk characters, return `Boolean(node?.isEndOfWord)` | $O(L)$ | $O(1)$ |
| **Prefix Check** | Walk characters, return `node !== null` | $O(L)$ | $O(1)$ |

---

## 11. Interview Questions & Expected Answers

### 1. Conceptual
**Question**: Compare the lookup time and space characteristics of a Trie versus a Hash Map for prefix lookups (`startsWith`).  
**Hint**: How does a Hash Map handle prefix queries?  
**Expected Answer Shape**: A Hash Map provides $O(L)$ exact lookups, but to check whether *any* word starts with prefix $P$, a Hash Map must scan all $N$ keys ($O(N \cdot L)$ time), or pre-store all possible prefixes of all words, causing massive memory bloat. A Trie naturally structures words by common prefix, resolving `startsWith` in strictly $O(|P|)$ time with zero full dictionary scanning and optimal shared prefix memory.

### 2. Code-Writing
**Question**: Add a `delete(word)` method to the `Trie` class that removes a word and deallocates unused nodes.  
**Hint**: Use post-order recursion; delete child if it has no other children and is not end of another word.  
**Expected Answer Shape**: Write recursive `_delete(node, word, depth)`. Base: at word end, set `node.isEndOfWord = false`. If `node` has no children, return true to signal parent to delete this child key (`delete parent.children[char]`). If child has other children or is another word's ending, preserve it.

### 3. Debugging
**Question**: Spot the memory leak in this Trie autocomplete cache in Node.js:  
```javascript
class AutoCompleteTrie {
  constructor() {
    this.root = {};
  }
  addQuery(q) {
    let curr = this.root;
    for (const c of q) {
      curr[c] = curr[c] || { suggestions: [] };
      curr[c].suggestions.push(q);
      curr = curr[c];
    }
  }
}
```  
**Hint**: What happens to `suggestions` arrays on common prefixes over millions of queries?  
**Expected Answer Shape**: Over millions of searches, pushing every full query string into every ancestor node's `suggestions` array causes massive unbounded duplicate string storage. Ancestors for common prefixes (like `'s'`) accumulate millions of strings in V8 heap memory. Bounded heaps (e.g., keeping only the top 5 suggestions) or storing query IDs with TTLs are required to keep memory bounded.

### 4. System Design / Tradeoff
**Question**: Why does Fastify choose a Radix Tree (compact Trie) for URL routing rather than an array of regular expressions like Express?  
**Hint**: Route count scaling and regex execution overhead.  
**Expected Answer Shape**: Express tests routes sequentially using regex ($O(N)$ where $N$ is route count). In an enterprise API with 500 endpoints, every incoming request executes dozens of regex matches, consuming event loop CPU time. Fastify's Radix Tree routes requests in $O(L)$ where $L$ is URL path character length, completely independent of how many routes exist, yielding over $3\times$ higher request throughput.

### 5. Tricky / Edge Case
**Question**: In Word Search II, why is leaf node pruning (`delete parentNode.children[char]`) critical to avoid Time Limit Exceeded?  
**Hint**: What happens after all words in a branch have been discovered?  
**Expected Answer Shape**: Once a leaf word (e.g., "apple") is found and has no other children, subsequent grid traversals visiting that same cell area will continue traversing down to the dead-end leaf repeatedly. By deleting the leaf node from the parent's children map when its word is found and it has no remaining sub-branches, the Trie actively shrinks during execution, dramatically pruning future grid backtracking branches.

### 6. Real-World Node.js Context
**Question**: How does a Node.js CIDR IP address filter (like checking if a request IP is within a banned subnet) use a Binary Trie?  
**Hint**: Bitwise representation of IPv4 addresses.  
**Expected Answer Shape**: An IPv4 address is a 32-bit integer. Subnets (e.g., `192.168.1.0/24`) represent bit prefixes. A Binary Trie stores bits (0 or 1) along each edge up to the subnet prefix length. When an incoming HTTP request IP arrives, the Node.js security middleware traverses the 32 bits through the Binary Trie in $O(1)$ time ($\le 32$ steps) to instantly match against thousands of banned CIDR blocks.
