# Day 4: Modern Collections, Protocols, Generators, and Metaprogramming

Quick review of main-course lectures 13–16. Designed for rapid interview revision: `Map`/`Set` vs `WeakMap`/`WeakSet`, destructuring and spread mechanics, custom iterable protocols, generator coroutines, and Proxy/Reflect metaprogramming.

## Keyed collections: Map, Set, WeakMap, and WeakSet

**1. `Map` and `Set` vs plain Objects**

- **`Map`:** Keys can be any value (including objects and functions); preserves exact insertion order; provides `.size`; does not inherit prototype properties.
- **`Set`:** Stores unique values with expected $O(1)$ lookups via `.has()`.
- Plain objects (`{}`) coerce all keys to strings or symbols and inherit `Object.prototype` methods.

```js
const map = new Map();
const keyObj = { id: 1 };

map.set(keyObj, "Session Active");
console.log(map.get(keyObj)); // "Session Active"
console.log(map.size);        // 1

// Plain object coercion trap:
const obj = {};
obj[keyObj] = "Overwritten";
obj[{ id: 2 }] = "New Value";
console.log(obj["[object Object]"]); // "New Value" (both coerced to same string!)
```

**1.1 `WeakMap` and `WeakSet` garbage collection mechanics**

`WeakMap` and `WeakSet` hold references to object keys **weakly**. If no other reference to a key object exists, the object and its entry are eligible for immediate Garbage Collection. Because entries are dynamic and dependent on GC, `WeakMap` is not iterable and has no `.size` property.

```js
let user = { id: 99 };
const metadata = new WeakMap();
metadata.set(user, { loginCount: 5 });

user = null; // Key object becomes unreachable; metadata entry is automatically collected!
```

[Collections](../../Javascript/javascript-lectures/day-13-destructuring-spread-and-modern-operators.md)

## Destructuring, rest, and spread mechanics

**1. Destructuring patterns and default values**

Destructuring extracts properties by position (Arrays) or by property key (Objects). Default values apply only when the incoming property is strictly `undefined`.

```js
const config = { host: "localhost", port: undefined, timeout: null };

// Renaming (host -> serverHost) and defaults
const { host: serverHost, port = 8080, timeout = 5000 } = config;
console.log(serverHost, port, timeout); // "localhost" 8080 null (null does not trigger default!)
```

**2. Shallow copying with Spread (`...`)**

The spread operator performs a **shallow copy**. Top-level primitives are duplicated, but nested objects and arrays share identical memory references.

```js
const state = { count: 1, nested: { active: true } };
const copy = { ...state };

copy.count = 2;              // Does not mutate state.count
copy.nested.active = false;  // Mutates state.nested.active! (shared reference)
```

[Destructuring and spread](../../Javascript/javascript-lectures/day-14-iterables-iterators-generators-and-symbols.md)

## Iteration protocols and generator coroutines

**1. The Iterable and Iterator protocol**

An object is **iterable** if it defines a method keyed by `Symbol.iterator` that returns an **iterator** object with a `next()` method returning `{ value, done }`.

```js
// Implementing a custom range iterable
const range = (from, to) => ({
  [Symbol.iterator]() {
    let current = from;
    return {
      next() {
        return current <= to
          ? { value: current++, done: false }
          : { value: undefined, done: true };
      }
    };
  }
});

for (const num of range(1, 3)) console.log(num); // 1, 2, 3
```

**2. Generator functions (`function*` and `yield`)**

Generators are pausable functions that produce an iterator. Calling a generator returns a generator object without executing code until `.next()` is called. `yield` can also receive values passed into subsequent `.next(value)` calls.

```js
function* idGenerator() {
  let id = 1;
  while (true) {
    const reset = yield id++;
    if (reset) id = 1; // Two-way communication via next(arg)
  }
}

const gen = idGenerator();
console.log(gen.next().value);     // 1
console.log(gen.next().value);     // 2
console.log(gen.next(true).value); // 1 (reset triggered)
```

[Iterators and generators](../../Javascript/javascript-lectures/day-15-regular-expressions-and-text-processing.md)

## Metaprogramming: Symbols, Proxies, and Reflect

**1. Symbols as unique identifiers**

`Symbol()` creates a guaranteed unique primitive value. Well-known symbols customize built-in engine behaviors (`Symbol.iterator`, `Symbol.toStringTag`, `Symbol.toPrimitive`).

```js
const privateKey = Symbol("token");
const data = { [privateKey]: "secret_abc", public: "visible" };
console.log(Object.keys(data)); // ["public"] (Symbols are hidden from standard key lists)
console.log(data[privateKey]);  // "secret_abc"
```

**2. Proxy traps and Reflect**

A `Proxy` intercepts fundamental language operations (property access, assignment, function invocation, deletion). Always pair Proxy traps with `Reflect` methods, passing the `receiver` argument to preserve correct `this` binding on getters.

```js
const target = {
  _val: 10,
  get val() { return this._val; }
};

const proxy = new Proxy(target, {
  get(targetObj, prop, receiver) {
    console.log(`Accessing property: ${String(prop)}`);
    // Reflect.get with receiver ensures 'this' inside getter points to proxy
    return Reflect.get(targetObj, prop, receiver);
  },
  set(targetObj, prop, value, receiver) {
    if (typeof value !== "number") throw new TypeError("Value must be a number");
    return Reflect.set(targetObj, prop, value, receiver); // Must return boolean in strict mode
  }
});

console.log(proxy.val); // Logs access -> 10
proxy._val = 20;        // Sets successfully
// proxy._val = "bad";  // TypeError: Value must be a number
```

[Metaprogramming and proxies](../../Javascript/javascript-lectures/day-16-symbols-reflection-and-proxies.md)

## Tricky points

1. **Collections**

**1.1 WeakMap keys must be objects or unregistered symbols**
Attempting to use primitive values as keys in a WeakMap (`weakMap.set("user_id", 123)`) throws a `TypeError: Invalid value used as weak map key`.

**1.2 NaN equality in Map and Set**
Unlike `===` where `NaN !== NaN`, `Map` and `Set` use the `SameValueZero` equality algorithm: `NaN` is treated as equal to `NaN`, so a `Set` contains at most one `NaN`.

2. **Destructuring and spread**

**2.1 Destructuring `null` or `undefined`**
Destructuring `null` or `undefined` throws a `TypeError: Cannot destructure property of 'null' as it is null`. Always provide default object fallbacks (`const { x } = input ?? {}`).

**2.2 Spread does not copy prototype methods or descriptors**
Using `{ ...obj }` copies only own enumerable properties. Non-enumerable properties, prototype methods, and custom getters (which are converted to static values upon read) are lost.

3. **Generators and proxies**

**3.1 Generators cannot be arrow functions**
There is no arrow syntax for generators. `const fn = *() => {}` is an invalid syntax error.

**3.2 Proxy breaking private class fields**
Accessing a private class field (`#field`) on a Proxy instance throws `TypeError: Cannot read private member #field from an object whose class did not declare it` because the Proxy is not the raw class instance.