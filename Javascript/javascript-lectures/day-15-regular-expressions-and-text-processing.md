# Day 15: Regular Expressions and Text Processing

<nav aria-label="Lecture navigation">

[← Previous Day: Day 14 - Iterables, Iterators, Generators, and Symbols](day-14-iterables-iterators-generators-and-symbols.md) | [Roadmap](../javascript-roadmap.md) | [Next Day: Day 16 - Symbols, Reflection, Proxies, and Metaprogramming →](day-16-symbols-reflection-and-proxies.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Deconstruct regular expression syntax into character classes, assertion boundaries, groups, and quantifiers.
- Differentiate greedy, lazy, and possessive-style matching mechanisms and predict backtracking behavior.
- Use capturing groups, non-capturing groups (`(?:...)`), named groups (`(?<name>...)`), and lookaround assertions (`(?=...)`, `(?!...)`, `(?<=...)`, `(?<!...)`).
- Explain the runtime operational semantics of flags (`g`, `i`, `m`, `s`, `u`, `y`, `d`, `v`).
- Diagnose and prevent stateful concurrency defects caused by `RegExp.prototype.lastIndex` in global regex singletons.
- Select the appropriate string search API between `test()`, `exec()`, `match()`, `matchAll()`, `replace()`, and `replaceAll()`.
- Identify catastrophic backtracking patterns (ReDoS) and implement structural defenses, timeouts, and length guards.
- Delineate the architectural boundary where regular expressions fail and deterministic formal parsers are required.

---

## Vocabulary Card

| Term | Plain Definition | Everyday Analogy |
| :--- | :--- | :--- |
| **Regular Expression (RegExp)** | A pattern object that describes a formal grammar or character sequence to search, match, and extract substrings. | A specialized metal stencil used to spray-paint only numbers that match a specific postal format. |
| **Greedy Quantifier** | A quantifier (`*`, `+`, `{m,n}`) that consumes as many characters as possible first, relinquishing characters backward only when remaining patterns fail. | An eater who fills their plate to overflowing and only puts items back when they realize their dessert won't fit on the tray. |
| **Lazy (Reluctant) Quantifier** | A quantifier (`*?`, `+?`) that consumes the absolute minimum number of characters required to satisfy the match, expanding forward only on demand. | A thrifty buyer who takes only one item at a time, picking another only if the current receipt fails inspection. |
| **Backtracking** | The algorithmic fallback mechanism where an NFA engine unwinds previously matched characters to explore alternative branch paths. | Walking through a maze; hitting a dead end, backing up to the last crossroads, and trying the alternative corridor. |
| **`lastIndex`** | A mutable integer property on a `RegExp` instance specifying the character index at which the next execution will start searching when `g` or `y` is set. | A physical bookmark left in a shared library book; if someone else opens it, they start reading from where you stopped. |
| **Catastrophic Backtracking (ReDoS)** | An exponential $O(2^n)$ explosion in engine state evaluation caused by nested, ambiguous repetitions on non-matching input strings. | Trying every single permutation of a lock combination when the lock itself has duplicate tumblers, causing the dial to spin billions of times. |
| **Lookaround Assertion** | A zero-width pattern assertion that checks whether preceding or succeeding text matches without including those characters in the final match result. | Peeking through a window to verify the room has a chair before opening the door, without bringing the room furniture with you. |

---

## Core Concepts

### 1. Regular Expression Anatomy: Literals, Constructors, and Classes

A regular expression is a compiled pattern object used to test and extract text patterns. JavaScript provides two forms: compile-time regex literals (`/.../flags`) and runtime constructors (`new RegExp(pattern, flags)`).

```javascript
// Node.js code
// ✅ DO: Use literals for static patterns compiled once at module load
const staticPattern = /^[A-Za-z0-9_-]{3,16}$/;
console.log(staticPattern.test("alice_99")); // true

// ❌ DON'T: Concatenate unsanitized user input directly into RegExp constructor
const userInput = "billing.department+support";
// Dangerous: Unescaped '+' and '.' act as regex metacharacters!
const unsafeRegex = new RegExp(userInput);
console.log(unsafeRegex.test("billingXdepartmenttttttsupport")); // true (Accidental match!)
```

Essential pattern building blocks:
- **Anchors (`^`, `$`, `\b`):** Zero-width assertions matching the start of input, end of input, or a word boundary.
- **Character Classes (`[...]`, `[^...]`):** Matches any single character within (or negated outside) the set.
- **Shorthand Classes (`\d`, `\w`, `\s`, `\D`, `\W`, `\S`):** Predefined character sets for digits, word characters, and whitespace.
- **Quantifiers (`*`, `+`, `?`, `{n}`, `{min,max}`):** Specify how many times the preceding atom may repeat.
- **Alternation (`|`):** Tests alternatives from left to right.

### 2. Greedy vs. Lazy Quantifiers

A greedy quantifier consumes as much text as possible before evaluating subsequent tokens, whereas a lazy quantifier (denoted by a trailing `?`) consumes as few characters as possible, expanding only when subsequent tokens fail.

```javascript
// Node.js code
const payload = "<span>Header</span><span>Body</span>";

// ❌ Greedy match consumes through the entire string to the last </span>
const greedyMatch = payload.match(/<span>.*<\/span>/);
console.log(greedyMatch[0]); 
// Output: "<span>Header</span><span>Body</span>"

// ✅ Lazy match stops at the very first occurrence of </span>
const lazyMatch = payload.match(/<span>.*?<\/span>/);
console.log(lazyMatch[0]); 
// Output: "<span>Header</span>"
```

### 3. Captures, Non-Capturing Groups, and Named Groups

Capturing groups (`(...)`) retain matched substrings in indexed output arrays. Non-capturing groups (`(?:...)`) provide logical grouping without memory or extraction overhead. Named groups (`(?<name>...)`) assign explicit dictionary keys to matched segments.

```javascript
// Node.js code
const logEntry = "2026-09-27 [ERROR] Database connection failed";

// ✅ DO: Use named capture groups for self-documenting data extraction
const logRegex = /^(?<date>\d{4}-\d{2}-\d{2})\s+\[(?<level>[A-Z]+)\]\s+(?<msg>.+)$/;
const match = logRegex.exec(logEntry);

if (match) {
  const { date, level, msg } = match.groups;
  console.log(`[${date}] Log Level: ${level} -> Message: ${msg}`);
}

// ❌ DON'T: Use capturing groups when you only need grouping for alternation
// Captures unnecessary submatches into array indexes, wasting allocation
const badGrouping = /^(?:https|http):\/\/([a-z0-9.-]+)(?::(\d+))?$/i;
```

### 4. Flags and Their Operational Semantics

Regex flags alter the parsing and matching mechanics of the engine:

| Flag | Name | Semantics |
| :--- | :--- | :--- |
| `g` | Global | Finds all matches rather than stopping at the first; enables stateful `lastIndex` on `.exec()` and `.test()`. |
| `i` | Ignore Case | Case-insensitive matching according to Unicode/ASCII foldings. |
| `m` | Multiline | Treats `^` and `$` as matching the start/end of each individual line (`\n`), not just the entire string boundary. |
| `s` | DotAll | Allows the wildcard `.` to match newline characters (`\n`, `\r`, `\u2028`, `\u2029`). |
| `u` | Unicode | Treats surrogate pairs as single code points and enforces strict syntax checks. |
| `v` | Unicode Sets | Advanced Unicode properties, set operations (subtraction/intersection), and string character classes. |
| `y` | Sticky | Matches only at the exact index specified by `this.lastIndex` without scanning forward. |
| `d` | Indices | Adds start/end offset indices for each capture group to the match result (`match.indices`). |

### 5. The Statefulness Trap: `RegExp.prototype.lastIndex`

When a `RegExp` has the global (`g`) or sticky (`y`) flag enabled, the instance maintains an internal mutable cursor named `lastIndex`. Successive calls to `.test()` or `.exec()` advance this cursor and search from that offset onward.

```javascript
// Node.js code
// ❌ BROKEN: Sharing a global regex instance across requests or validations
const GLOBAL_IS_VALID = /^[a-z]+$/g;

function validateUser(username) {
  return GLOBAL_IS_VALID.test(username);
}

console.log(validateUser("admin")); // true (lastIndex moves from 0 -> 5)
console.log(validateUser("admin")); // false! (starts scanning at index 5 -> fails -> lastIndex resets to 0)
console.log(validateUser("admin")); // true (scans from 0 again)

// ✅ FIXED: Omit the 'g' flag for validation tests, or instantiate cleanly
const SAFE_VALIDATOR = /^[a-z]+$/; // Stateless!
console.log(SAFE_VALIDATOR.test("admin")); // true
console.log(SAFE_VALIDATOR.test("admin")); // true
```

### 6. Text Processing APIs Comparison

JavaScript provides complementary methods on `RegExp.prototype` and `String.prototype`:

```javascript
// Node.js code
const text = "item: 100, item: 200, item: 300";
const pattern = /item:\s*(\d+)/g;

// 1. String.prototype.match with /g: Returns flat string array of matches (NO capture groups)
console.log(text.match(pattern));
// ['item: 100', 'item: 200', 'item: 300']

// 2. String.prototype.matchAll with /g: Returns iterator of complete MatchObjects with capture groups
for (const matchObj of text.matchAll(pattern)) {
  console.log(`Matched '${matchObj[0]}' with capture group: '${matchObj[1]}' at index ${matchObj.index}`);
}

// 3. String.prototype.replace with functional replacer
const transformed = text.replace(/item:\s*(\d+)/g, (fullMatch, id) => {
  return `sku_${Number(id) * 2}`;
});
console.log(transformed); // "sku_200, sku_400, sku_600"
```

### 7. Unicode, Code Points, and Grapheme Clusters

JavaScript strings are sequences of 16-bit code units (UTF-16). Emoji and historical scripts spanning surrogate pairs break legacy regexes unless the `u` or `v` flag is enabled.

```javascript
// Node.js code
const emojiString = "𠮷"; // Surrogate pair: length is 2 code units

// ❌ Legacy regex without 'u' treats code units separately
console.log(/^.$/.test(emojiString)); // false! (Dot matches 1 code unit, emoji is 2)

// ✅ DO: Use 'u' flag for true Unicode code point awareness
console.log(/^.$/u.test(emojiString)); // true

// ⚠️ Grapheme clusters (composed characters): A family emoji is multiple code points!
const family = "👨‍👩‍👧‍👦";
console.log(/^.$/u.test(family)); // false! (Contains 7 code points joined by ZWJ)

// For user-visible characters, use Intl.Segmenter:
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
const graphemes = [...segmenter.segment(family)];
console.log(graphemes.length); // 1 (Exactly one visual user-perceived character!)
```

### 8. Catastrophic Backtracking and ReDoS Defense

Catastrophic backtracking occurs when an NFA (Nondeterministic Finite Automaton) regex engine explores an exponentially expanding tree of match combinations when matching against ambiguous, non-matching input strings.

```javascript
// Node.js code
// ❌ VULNERABLE: Nested quantifiers with overlapping alphabet classes
// Input: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaX"
// Outer '+' can consume 1..N 'a's, and inner '+' can also consume 1..N 'a's.
// Total combinations to fail: 2^N paths. For N=30, that is over 1 billion operations!
const vulnerablePattern = /^(a+)+$/;

// ✅ DEFENSIVE STRATEGIES:
// 1. Bounded character length before evaluation:
function safeValidate(input) {
  if (typeof input !== "string" || input.length > 64) {
    return false; // Hard barrier against ReDoS
  }
  // 2. Eliminate ambiguity: Mutually exclusive character classes
  return /^a+$/.test(input);
}
```

---

## Detailed Explanations and Traces

### Trace 1: The Catastrophic Backtracking Tree

Consider the pattern `^(a+)+$` evaluated against the string `"aaaX"`.

```
Target: "a  a  a  X"
Index:   0  1  2  3

Step 1: Outer group (a+) tries to match as much as possible greedily:
        Inner group consumes: "aaa" (indices 0..2)
        Next token requires '$' (end of string). Next character is 'X'.
        Mismatch! Backtrack.

Step 2: Inner group unwinds one character:
        Inner group 1 consumes: "aa"
        Inner group 2 consumes: "a"
        Next token requires '$'. Next character is 'X'.
        Mismatch! Backtrack.

Step 3: Outer group unwinds:
        Inner group 1 consumes: "a"
        Outer group restarts -> Inner group 2 consumes: "aa"
        Next token requires '$'. Next character is 'X'.
        Mismatch! Backtrack.

Step 4: Inner group 2 unwinds:
        Inner group 1 consumes: "a"
        Inner group 2 consumes: "a"
        Inner group 3 consumes: "a"
        Next token requires '$'. Next character is 'X'.
        Mismatch! Backtrack.
```

For string length $N$, the engine performs $2^{N-1}$ branches before concluding the string does not match. At $N=35$, this locks the Node.js event loop for tens of seconds!

---

### Trace 2: The `lastIndex` Mutable Cursor Cycle

When executing `.exec()` in a `while` loop with a global (`g`) pattern:

```javascript
// Node.js code
const str = "A1 B2 C3";
const regex = /[A-Z](\d)/g;

// Initial state: regex.lastIndex = 0
let m;
// Iteration 1:
// Scans from index 0. Matches "A1" at [0..2].
// regex.lastIndex is updated to 2.
m = regex.exec(str);
console.log(`Found ${m[0]} at index ${m.index}, next search at ${regex.lastIndex}`);

// Iteration 2:
// Scans from index 2. Matches "B2" at [3..5].
// regex.lastIndex is updated to 5.
m = regex.exec(str);
console.log(`Found ${m[0]} at index ${m.index}, next search at ${regex.lastIndex}`);

// Iteration 3:
// Scans from index 5. Matches "C3" at [6..8].
// regex.lastIndex is updated to 8.
m = regex.exec(str);
console.log(`Found ${m[0]} at index ${m.index}, next search at ${regex.lastIndex}`);

// Iteration 4:
// Scans from index 8. No further match.
// exec() returns null.
// regex.lastIndex is automatically reset to 0!
m = regex.exec(str);
console.log(`Result: ${m}, lastIndex reset to ${regex.lastIndex}`);
```

If the loop terminates prematurely (e.g. via `break` or `throw`), `lastIndex` remains stuck at the midpoint. Subsequent calls on different strings will fail unpredictably.

---

## Code Examples

### 1. Escaping Dynamic Input for Safe Pattern Construction

When constructing regular expressions dynamically from arbitrary user strings, all metacharacters must be escaped to prevent syntax errors and unintended pattern execution.

```javascript
// Node.js code
function escapeRegExp(rawString) {
  // Escapes: . * + ? ^ $ { } ( ) | [ ] \
  return rawString.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function searchUserQuery(documents, rawQuery) {
  // ✅ DO: Escape user input before compiling into RegExp
  const safePattern = new RegExp(escapeRegExp(rawQuery), "iu");
  return documents.filter((doc) => safePattern.test(doc));
}

const docs = [
  "Account balance: $100.00",
  "Special promo: 50% discount",
  "Normal text without symbols",
];

// Query containing special characters '$' and '.'
const results = searchUserQuery(docs, "$100.0");
console.log("Safe Search Matches:", results);
// Matches: ["Account balance: $100.00"]
```

### 2. Tokenizing Structured Configurations Using `matchAll`

Extracting multi-attribute configuration values safely with named capture groups.

```javascript
// Node.js code
const configPayload = `
  service=payments-api port=8080 active=true
  service=auth-service port=9000 active=false
`;

// Explicit non-backtracking token pattern:
const tokenRegex = /(?<key>[a-z_][a-z0-9_-]*)=(?<val>[^\s]+)/g;

function parseConfig(text) {
  const entries = {};
  for (const match of text.matchAll(tokenRegex)) {
    const { key, val } = match.groups;
    entries[key] = val;
  }
  return entries;
}

console.log("Parsed Tokens:", parseConfig(configPayload));
// Output: { service: 'auth-service', port: '9000', active: 'false' }
```

---

## Tricky Points and Gotchas

### 1. The Singleton Global Regex Leak Across Requests

In Node.js HTTP servers, exporting or defining a module-level global regex singleton causes subtle request cross-contamination.

```javascript
// Node.js code
// ❌ GOTCHA: Module-scoped singleton regex with /g
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/g;

function handleSignup(email) {
  // If request 1 tests "user@example.com", EMAIL_RE.lastIndex advances.
  // Request 2 with the same or different email might fail completely!
  return EMAIL_RE.test(email);
}
```

**Fix:** Never use `g` for validation tests (`.test()`), or create the regex per function call.

### 2. Multiline Flag (`m`) Weakens End-of-Input Security Guards

When validating tokens or headers, using the `m` flag makes `^` and `$` match newline characters (`\n`), allowing multiline injection attacks to bypass validation.

```javascript
// Node.js code
// ❌ SECURITY HOLE: Multiline anchor permits injected payloads!
const headerValidator = /^[a-zA-Z0-9-]+$/m;
const maliciousHeader = "Content-Type\r\nInjected-Header: evil.com";

// Passes because the first line matches ^[a-zA-Z0-9-]+$ !
console.log(headerValidator.test(maliciousHeader)); // true
```

### 3. Replacement String Special Replacer Tokens

In `String.prototype.replace()`, string replacement templates interpret `$` as an insertion token. Passing unescaped replacement strings can cause silent data corruption:

- `$$` -> Inserts a literal `$`
- `$&` -> Inserts the matched substring
- `$\`` -> Inserts the portion of string preceding the match
- `$'` -> Inserts the portion of string following the match
- `$1`, `$2` -> Inserts capture group number

```javascript
// Node.js code
const template = "User: <name>";
const userSuppliedValue = "$1,000 bonus";

// ❌ Unexpected behavior: '$1' references non-existent capture group 1
console.log(template.replace("<name>", userSuppliedValue));
// Output: "User: ,000 bonus" ($1 was erased!)

// ✅ Safe replacement: Use a functional replacer to avoid token evaluation
console.log(template.replace("<name>", () => userSuppliedValue));
// Output: "User: $1,000 bonus"
```

---

## Hands-on Exercise: Building a ReDoS-Resilient Header Parser

### Problem Statement

You are building an HTTP request header sanitizer. It accepts a raw multi-line metadata header block, extracts clean key-value pairs, and validates each pair.

### Buggy Implementation

```javascript
// Node.js code
// ❌ BUGS:
// 1. Vulnerable to ReDoS: `([a-zA-Z0-9_ -]+)+` nested quantifiers
// 2. Global state bug: Shared static pattern with `g`
// 3. Allows multiline header injection without length limits
const HEADER_PATTERN = /^([a-zA-Z0-9_-]+)\s*:\s*(.*)+$/g;

function parseHeaders(rawHeaders) {
  const result = {};
  const lines = rawHeaders.split("\n");
  for (const line of lines) {
    if (HEADER_PATTERN.test(line)) {
      const match = HEADER_PATTERN.exec(line);
      result[match[1]] = match[2];
    }
  }
  return result;
}
```

### Edge Cases to Address

1. `lastIndex` synchronization defect: Calling `.test()` followed by `.exec()` advances `lastIndex` twice, skipping alternate matches or causing `match` to be `null`.
2. Input length denial-of-service: Malicious payloads with 10,000 characters could lock the CPU.
3. Whitespace trimming and header key normalization.

### Verified Solution

```javascript
// Node.js code
function parseHeadersSafe(rawHeaders, maxPayloadLength = 4096) {
  // 1. Guard against unbounded input size
  if (typeof rawHeaders !== "string" || rawHeaders.length > maxPayloadLength) {
    throw new Error("Payload exceeds allowable header length");
  }

  const result = Object.create(null); // Clean map without prototype pollution

  // 2. Use atomic, non-overlapping, stateless pattern per line
  // Key: [a-zA-Z0-9_-]{1,64} (Strictly bounded, no nested repetition)
  // Value: [^\r\n]{0,512} (Explicitly excludes newlines, prevents injection)
  const LINE_REGEX = /^(?<key>[a-zA-Z0-9_-]{1,64}):\s*(?<val>[^\r\n]{0,512})$/;

  const lines = rawHeaders.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue; // Skip blank lines and comments

    const match = LINE_REGEX.exec(line);
    if (!match || !match.groups) {
      throw new Error(`Malformed header line: "${line.slice(0, 32)}"`);
    }

    const { key, val } = match.groups;
    result[key.toLowerCase()] = val.trim();
  }

  return result;
}

// Verification:
const sample = `
Host: api.service.internal
X-Request-ID: req_992144
Content-Type: application/json
`;

const parsed = parseHeadersSafe(sample);
console.log("Safely Parsed Headers:", parsed);
// Output: { host: 'api.service.internal', 'x-request-id': 'req_992144', 'content-type': 'application/json' }
```

---

## Summary

- Regular expressions use an NFA engine in JavaScript engines (V8). They excel at flat token matching, character class verification, and bounded pattern replacement.
- Greedy quantifiers maximize consumption and backtrack; lazy quantifiers minimize consumption and forward-expand.
- Global (`g`) and sticky (`y`) flags turn regex objects into stateful cursors through `lastIndex`. Never share a global regex across async requests or utility functions.
- `String.prototype.matchAll()` is the modern standard for extracting multiple match sets with capture groups.
- The `u` and `v` flags ensure correct handling of 32-bit Unicode code points. For visual graphemes (e.g. compound emoji), rely on `Intl.Segmenter`.
- Defend against ReDoS by bounding input string lengths, eliminating overlapping nested quantifiers, and employing formal recursive-descent parsers for nested formats (HTML, JSON, Markdown).

---

## Cheat Sheet

### Metacharacters & Quantifiers Quick Reference

| Token | Meaning | Behavior |
| :--- | :--- | :--- |
| `^` / `$` | Start / End of input | Zero-width assertion. With `m`, matches start/end of line. |
| `\b` / `\B` | Word / Non-word boundary | Zero-width transition between `\w` and `\W`. |
| `(?=...)` | Positive lookahead | Asserts pattern follows without consuming characters. |
| `(?!...)` | Negative lookahead | Asserts pattern does NOT follow. |
| `(?<=...)` | Positive lookbehind | Asserts pattern precedes. |
| `(?<!...)` | Negative lookbehind | Asserts pattern does NOT precede. |
| `*` vs `*?` | 0 or more | Greedy (`*`) vs. Lazy (`*?`). |
| `+` vs `+?` | 1 or more | Greedy (`+`) vs. Lazy (`+?`). |
| `(?:...)` | Non-capturing group | Groups logically without capturing into output array. |
| `(?<name>...)` | Named capturing group | Stores captured match under `match.groups[name]`. |

### Execution API Decision Matrix

| Method | Invocation | Returns | Stateful (`lastIndex`)? | Best Used For |
| :--- | :--- | :--- | :--- | :--- |
| `RegExp.prototype.test` | `regex.test(str)` | `boolean` | **Yes** if `g` or `y` | Quick true/false format validation (use without `g`). |
| `RegExp.prototype.exec` | `regex.exec(str)` | `MatchArray \| null` | **Yes** if `g` or `y` | Iterative extraction in loops with group indices. |
| `String.prototype.match` | `str.match(regex)` | `Array \| null` | Yes (resets on completion) | Extracting flat array of matches when groups are unneeded. |
| `String.prototype.matchAll` | `str.matchAll(regex)` | `Iterator<Match>` | Requires `g`; stateless per call | Iterating all occurrences with full capture groups. |
| `String.prototype.replace` | `str.replace(rgx, fn)` | `string` | Yes if `g` | Transforming matches dynamically via replacer function. |

---

## Interview Questions & Deep Dives

### 1. Explain the operational difference between greedy and lazy quantifiers, and how each interacts with the backtracking engine.

**Question:** What is the exact difference between a greedy quantifier like `.*` and a lazy quantifier like `.*?`? Walk through how the engine evaluates each against `"<a><b>"` looking for `<.*>` versus `<.*?>`.

**Answer:**
A greedy quantifier attempts to consume as many characters as possible before checking subsequent tokens in the regular expression. When matching `"<a><b>"` against `/<.*>/`:
1. The engine matches `<`.
2. The `.*` immediately consumes the rest of the string: `"a><b>"`.
3. The pattern now requires a literal `>`. Looking at the end of the string, there are no characters left.
4. The engine backtracks one character (giving back `>`). Now the literal `>` matches the final `>` of `</b>`.
5. The final returned match is the entire string: `"<a><b>"`.

A lazy quantifier (`.*?`) attempts to consume as few characters as possible, expanding only when subsequent tokens fail. When matching `"<a><b>"` against `/<.*?>/`:
1. The engine matches `<`.
2. The `.*?` initially consumes zero characters.
3. The pattern checks for a literal `>`. The next character is `a`, which is not `>`.
4. The lazy quantifier expands by one character, consuming `a`.
5. The pattern checks for `>` again. The next character is `>`.
6. The match succeeds immediately, returning `"<a>"` without ever inspecting the rest of the string.

Greedy quantifiers take everything and backtrack backward; lazy quantifiers take the minimum and step forward.

---

### 2. Why does calling `.test()` twice consecutively with the same string return alternating boolean values on a global regex?

**Question:** Consider the code below. Why does the second console log print `false`, and how do you protect production code from this behavior?
```javascript
const pattern = /foo/g;
console.log(pattern.test("foo")); // true
console.log(pattern.test("foo")); // false
```

**Answer:**
When a regular expression is instantiated with the global (`g`) or sticky (`y`) flag, it becomes stateful. The `RegExp` object maintains an internal property called `lastIndex`, initialized to `0`.

When `.test("foo")` executes:
1. The engine begins searching at index `0`.
2. It finds `"foo"` spanning indices `0..3`.
3. It returns `true` and sets `pattern.lastIndex = 3`.

When `.test("foo")` executes the second time:
1. The engine begins searching starting at index `3` (`pattern.lastIndex`).
2. At index `3`, the remaining string is empty `""`. There is no match.
3. It returns `false` and resets `pattern.lastIndex = 0`.

If called a third time, it would return `true` again.

**Defenses:**
- For boolean validation, never use the `g` flag: `/foo/.test(str)`.
- If global matching is required across multiple invocations, either instantiate a new `RegExp` per call or reset `pattern.lastIndex = 0` prior to every execution.

---

### 3. What constitutes a Regular Expression Denial of Service (ReDoS) vulnerability, and how can you structurally eliminate it from a Node.js backend?

**Question:** What specific pattern structures cause ReDoS vulnerabilities in JavaScript, what is the impact on a Node.js event loop, and what design choices prevent it?

**Answer:**
ReDoS occurs when a regular expression uses nested, ambiguous quantifiers (such as `(a+)+`, `([a-zA-Z]+)*`, or `(a|a)+$`) evaluated by a backtracking NFA engine against non-matching strings. When the engine attempts to match an input like `"aaaaaaaaaaaaaaaaaaaaaaaX"`, there are multiple ways the inner and outer quantifiers can divide the sequence of `"a"` characters. When the final character fails to match (`"X"`), the engine systematically evaluates every single branch combination, resulting in an algorithmic time complexity of $O(2^n)$ or $O(n^k)$. Because Node.js is single-threaded, this exponential computation blocks the event loop completely, causing server-wide denial of service.

**Structural Defenses:**
1. **Input Length Bounding:** Validate `input.length <= MAX_SAFE_LENGTH` (e.g. 50–256 characters) before applying regexes.
2. **Eliminate Overlapping Repetitions:** Ensure grouped character classes are mutually exclusive with surrounding tokens (e.g. replace `(\w+\s*)+` with `\w+(?:\s+\w+)*`).
3. **Avoid Dynamic User Patterns:** Never pass unescaped user-supplied strings to `new RegExp()`.
4. **Offload or Sandbox:** For customer-supplied patterns, run matching inside isolated worker threads (`worker_threads`) with strict execution deadlines or use non-backtracking engines (like Google's RE2 via native bindings).

---

### 4. When should an engineering team replace a regular expression with a dedicated parser?

**Question:** A developer proposes using regular expressions to sanitize nested HTML tags or parse nested JSON config blocks. Why is this technically flawed, and where is the architectural boundary?

**Answer:**
Regular expressions (specifically standard regular languages) can only recognize patterns defined by Finite Automata (Chomsky Type-3 grammars). They do not possess an arbitrary-depth memory stack.

Nested structures—such as paired HTML tags (`<div><div>...</div></div>`), balanced brackets in mathematical expressions, or JSON trees—belong to Context-Free Grammars (Chomsky Type-2). Because nesting can be arbitrarily deep, a finite state machine without a stack cannot track balance or matching parent-child relationships reliably without producing syntax vulnerabilities, incorrect replacements, or unbounded backtracking traps.

**The Boundary Rule:**
- **Use RegExp when:** The grammar is flat, tokens do not balance or nest recursively, and the search space has fixed delimiters (e.g., verifying an email format, UUID, semantic version tag, or ISO-8601 date string).
- **Use a Dedicated Parser (Recursive Descent / AST) when:** The syntax supports recursive nesting, custom escaping rules, multiline comment blocks, or grammar precedence (e.g., HTML/XML, Markdown, SQL queries, arithmetic formulas, or JSON).

---

<nav aria-label="Lecture navigation">

[← Previous Day: Day 14 - Iterables, Iterators, Generators, and Symbols](day-14-iterables-iterators-generators-and-symbols.md) | [Roadmap](../javascript-roadmap.md) | [Next Day: Day 16 - Symbols, Reflection, Proxies, and Metaprogramming →](day-16-symbols-reflection-and-proxies.md)

</nav>
