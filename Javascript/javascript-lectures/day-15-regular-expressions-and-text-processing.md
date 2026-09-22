# Day 15: Regular Expressions and Text Processing

<nav aria-label="Lecture navigation">

[Previous: Iterables, Iterators, Generators, and Symbols](day-14-iterables-iterators-generators-and-symbols.md) | [Roadmap](../javascript-roadmap.md) | [Next: Symbols, Reflection, Proxies, and Metaprogramming](day-16-symbols-reflection-and-proxies.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Read common regular-expression parts such as classes, groups, anchors, and quantifiers.
- Explain greediness, captures, flags, and global state.
- Use `test`, `exec`, `match`, and replacement deliberately.
- Recognize Unicode and escaping problems.
- Identify patterns that may cause excessive backtracking.
- Decide when a parser is clearer than a regular expression.

## Prerequisites

Read [Day 03: Values, Types, and Literals](day-03-values-types-and-literals.md), [Day 04: Coercion, Equality, and Operators](day-04-coercion-equality-and-operators.md), and [Day 12: Built-in Data Structures and Serialization](day-12-built-in-data-structures-and-serialization.md).

## Core Concepts

A regular expression describes text patterns. JavaScript supports literal syntax and the `RegExp` constructor.

```js
const identifier = /^[A-Za-z_][A-Za-z0-9_]*$/;
console.log(identifier.test("user_1")); // true
console.log(identifier.test("1user")); // false
```

Important parts:

- `^` starts at the beginning; `$` ends at the end.
- `[abc]` matches one character from a class.
- `[^abc]` matches one character not in the class.
- `*` means zero or more; `+` means one or more; `?` means zero or one.
- `{min,max}` gives a bounded repetition.
- Parentheses group and may capture.
- `|` means alternatives.

### Greedy and lazy quantifiers

Quantifiers are greedy by default.

```js
const greedy = /<.*>/;
const lazy = /<.*?>/;
console.log("<a><b>".match(greedy)[0]); // "<a><b>"
console.log("<a><b>".match(lazy)[0]); // "<a>"
```

Regex is not a safe general HTML parser. Nested syntax, entities, comments, and malformed input need a parser designed for that grammar.

### Captures and named groups

```js
const datePattern = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/;
const match = datePattern.exec("2026-09-19");
console.log(match.groups); // { year: "2026", month: "09", day: "19" }
```

Captures are strings. A pattern can validate shape but usually does not prove that a date is valid, such as February 31.

## Detailed Explanations and Traces

### Useful flags

- `g`: find multiple matches and maintain `lastIndex` for some APIs.
- `i`: ignore ASCII case differences, with Unicode details depending on flags and data.
- `m`: change `^` and `$` behavior for lines.
- `s`: allow dot to match line terminators.
- `u`: use Unicode-aware parsing and code point behavior.
- `y`: sticky matching at `lastIndex`.
- `d`: expose match indices in runtimes that support it.

Check runtime support for newer flags before using them in a shared package.

### Global regex state

```js
const pattern = /cat/g;
console.log(pattern.test("cat")); // true
console.log(pattern.lastIndex); // 3
console.log(pattern.test("cat")); // false, starts at index 3
pattern.lastIndex = 0;
console.log(pattern.test("cat")); // true
```

Reusing a global regular expression across requests or tests can create state-dependent bugs. Create a fresh expression or reset state when appropriate.

### `match`, `matchAll`, and replacement

```js
const text = "id=10 id=20";
console.log(text.match(/\d+/g)); // ["10", "20"]
console.log(text.replace(/id=(\d+)/g, "item:$1")); // "item:10 item:20"
```

`match` changes behavior with the global flag. `matchAll` is useful when captures from every match are needed, subject to runtime support.

### Backtracking risk

Patterns with nested ambiguous repetition can try many paths.

```js
const risky = /^(a+)+$/;
// A long string of "a" characters followed by "b" can be expensive.
```

The exact timing is engine- and input-dependent, but untrusted input plus a backtracking-heavy pattern can create denial-of-service risk. Prefer bounded patterns, simpler parsing, or a regex engine with appropriate guarantees for security-critical paths.

## Examples and Traces

### Constrained identifier validation

```js
function isSafeIdentifier(value) {
  return typeof value === "string"
    && value.length <= 32
    && /^[A-Za-z][A-Za-z0-9_]*$/.test(value);
}

console.log(isSafeIdentifier("user_1")); // true
console.log(isSafeIdentifier("user-name")); // false
```

The length bound limits work, but it is still important to avoid unsafe patterns and to validate the business meaning separately.

### Escaping user text

If user text becomes part of a dynamic regular expression, escape regex metacharacters first. Do not insert raw input into `new RegExp(userText)` unless treating it as a pattern is explicitly intended.

```js
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const search = new RegExp(escapeRegExp("a+b"), "u");
console.log(search.test("a+b")); // true
```

## Node.js Connection

Regex validation and parsing run on a Node request path, so pattern complexity and input limits affect availability.

---

## Compare & Recall

| Concept A | Concept B | Key difference |
|---|---|---|
| Greedy `.*` | Lazy `.*?` | Greedy takes as much as possible, then backtracks. Lazy takes as little as possible, then expands. Both can match the same text; greedy is the default. |
| Capturing group `(x)` | Non-capturing group `(?:x)` | Both group. Capturing creates a numbered match in results. Non-capturing groups silently for ordering/repetition without polluting match results. |
| `pattern.test(str)` | `pattern.exec(str)` | `.test` returns true/false. `.exec` returns a match array with groups and index, or null. Use `.exec` when you need capture groups. |
| `string.match(pattern)` | `string.matchAll(pattern)` | `.match` with `g` returns all matches but no group details. `.matchAll` with `g` returns an iterator of full match objects including groups. |
| Global regex `lastIndex` | Stateless regex | A global (`/g`) regex on an object persists `lastIndex` between calls. Using `.test()` on a stored global regex twice on the same string can give different results. |
| Regex validation | Parser | Regex works for flat, unambiguous patterns. For nested structures (HTML, JSON, nested brackets), use a proper parser. |

> **Cross-day links:** String length and Unicode code points are covered in [Day 12](day-12-built-in-data-structures-and-serialization.md). Security implications of user-controlled regex are in [Day 25](day-25-security-relevant-javascript.md).

## Common Mistakes and Interview Traps

- Forgetting anchors and accepting a valid substring inside invalid input.
- Using `.` when line breaks or Unicode behavior matter.
- Reusing a global regex without considering `lastIndex`.
- Treating captures as numbers or validated domain values.
- Building a dynamic regex from unescaped user text.
- Using regex for nested formats that need a parser.
- Assuming a short pattern is automatically safe from backtracking.

## Tricky Points

- `$` and line behavior can differ when `m` is used.
- Unicode code points and user-visible grapheme clusters are different concepts.
- `g` affects stateful matching APIs, not every regex method in the same way.
- Regex syntax and supported flags can depend on the JavaScript runtime version.

## Practical Exercise

**Goal:** Validate a bounded service identifier and extract key-value pairs.

**Inputs and outputs:** Accept a string with identifiers such as `env=prod region=ap`; return validated pairs.

**Constraints:** Limit input length, reject malformed pairs, and avoid dynamic unescaped regexes.

**Edge cases:** Empty input, duplicate keys, Unicode text, line breaks, and a long adversarial string.

**Acceptance criteria:** Show expected matches, explain capture groups, and state why the pattern is bounded and safe enough for the chosen input limit.

## Summary

- Regex patterns combine literals, classes, groups, anchors, quantifiers, and flags.
- Greedy quantifiers take as much as possible; lazy forms take less when possible.
- Captures extract text but do not automatically validate its meaning.
- Global regexes can maintain `lastIndex` state.
- Unicode and user-visible characters require careful thought.
- Ambiguous backtracking patterns can harm server latency and security.
- Use a parser when the input grammar is nested or too complex for regex.

## Cheat Sheet

| Feature | Meaning |
|---|---|
| `^...$` | Match the whole input shape |
| `[]` | Character class |
| `()` | Group/capture |
| `(?:...)` | Non-capturing group |
| `+`, `*`, `?` | Repetition |
| `{2,4}` | Bounded repetition |
| `g` | Global matching and possible state |
| `u` | Unicode-aware mode |
| `i` | Case-insensitive matching |
| `exec` | Returns detailed match data |
| `replace` | Produces a new string |

**vs. quick reference**

| | Greedy `.*` | Lazy `.*?` |
|---|---|---|
| Takes | As much as possible | As little as possible |
| Default? | ✓ Yes | ✗ (opt-in with `?`) |
| Can cause ReDoS? | ✓ (exponential backtrack) | Less likely but still possible |

| Method | Returns | Uses global state? |
|---|---|---|
| `.test(str)` | `true`/`false` | ✓ (if regex has `g`) |
| `.exec(str)` | Match array or `null` | ✓ (if regex has `g`) |
| `str.match(rgx)` | All matches (no groups with `g`) | ✗ |
| `str.matchAll(rgx)` | Iterator of full match objects | Requires `g` |

## Interview Questions

> Difficulty guide: **[Beginner]** = entry-level, **[Mid]** = requires understanding of internals, **[Senior]** = design and tradeoff thinking expected.

1. **[Mid] Definition:** Explain greedy versus lazy matching with a trace.
   - Expected answer: Define the search choice, show a pattern and input, and state why each match ends where it does.
   - Follow-up: Why is regex a poor choice for nested HTML?

2. **[Beginner] Trace:** Predict two calls:

   ```js
   const pattern = /x/g;
   console.log(pattern.test("x"));
   console.log(pattern.test("x"));
   ```
   - Expected answer: `true`, then `false` because `lastIndex` is 1 after the first call.
   - Follow-up: What happens after resetting `lastIndex`?

3. **[Senior] Implementation:** Validate a user-controlled identifier without introducing a regex denial-of-service risk.
   - Expected answer: Define a grammar, use bounded simple patterns, cap input size, and test adversarial cases.
   - Follow-up: When would you use a parser or another validation library?

4. **[Mid] Debugging:** A test suite passes alone but fails when tests run together because a regex has `g`. Diagnose the shared state.
   - Expected answer: Explain `lastIndex`, test isolation, fresh regex creation, and reset strategies.
   - Follow-up: Which APIs consume global state differently?

5. **[Senior] Design:** Review a Node endpoint that accepts arbitrary regex patterns from users.
   - Expected answer: Discuss trust boundaries, input limits, timeout/isolation strategy, engine behavior, logging, and safer product requirements.
   - Follow-up: Why may a timeout not fully protect a blocked event loop?

