# Day 4: Modern Syntax, Iteration, and Metaprogramming

## Modern syntax

**1. Destructuring**

Reads array items or object properties into bindings; a default applies only when the value is `undefined`.

```js
const { limit = 10 } = { limit: null }; // limit is null, not 10
```

**2. Rest and spread**

Rest gathers remaining values; spread expands iterables/properties. Object spread is shallow.

```js
const [first, ...rest] = [1, 2, 3]; // first=1, rest=[2,3]
```

**3. Modern operators**

Optional chaining stops on nullish receivers; `??` defaults only for null/undefined; logical assignment updates conditionally.

```js
user?.name ?? "Guest"; // preserves empty string; defaults only if nullish
```

**4. Template literals**

Backticks interpolate expressions and preserve multiline text: `` `Hello, ${name}` ``.

[Full topic](../../Javascript/javascript-lectures/day-13-destructuring-spread-and-modern-operators.md)

## Iterables and generators

**1. Iterable and iterator protocols**

An iterable provides `Symbol.iterator`; its iterator's `next()` returns `{ value, done }`.

```js
for (const value of [1, 2]) console.log(value); // array is iterable
```

**2. Generators**

`function*` pauses at `yield`; values are computed lazily when `next()` is requested.

```js
function* ids() { yield 1; yield 2; }
```

**3. Async iterables**

An async iterable yields values over time via `Symbol.asyncIterator`; consume it with `for await...of`.

[Full topic](../../Javascript/javascript-lectures/day-14-iterables-iterators-generators-and-symbols.md)

## Text and metaprogramming

**1. Regular expressions**

Patterns match text; groups capture parts, flags alter matching, and global/sticky regexes retain `lastIndex` state.

```js
/^id-\d+$/.test("id-12"); // true
```

**2. Symbols**

Each `Symbol()` is unique and can be used as a non-colliding property key.

**3. Reflection and proxies**

`Reflect` exposes object operations; `Proxy` intercepts them, subject to invariants the engine enforces.

```js
const checked = new Proxy(target, { get: (object, key) => Reflect.get(object, key) });
```

[Regex](../../Javascript/javascript-lectures/day-15-regular-expressions-and-text-processing.md) | [Symbols, Reflect, Proxy](../../Javascript/javascript-lectures/day-16-symbols-reflection-and-proxies.md)

## Tricky points

1. **Syntax and copying**

**1.1 Defaults**

Destructuring defaults replace `undefined`, not `null`.

**1.2 Spread**

Object spread copies references for nested values; it is not a deep clone.

**1.3 Optional chaining**

It protects a nullish receiver, not invalid types or malformed data.

2. **Iteration**

**2.1 Generator laziness**

The generator body runs on `next()`, not when its iterator object is created.

**2.2 Cleanup**

Early loop exit may call iterator `return()`; custom iterators should release resources there.

3. **Regex and proxies**

**3.1 Stateful regex**

Global/sticky regexes retain `lastIndex`; reuse can change later results.

**3.2 Backtracking**

Ambiguous nested quantifiers on long untrusted input can consume excessive CPU.

**3.3 Proxy invariants**

A trap cannot contradict fixed, non-configurable target properties.