# Day 3: Objects, Prototypes, Classes, and Arrays

Quick review of main-course lectures 9–12. Designed for rapid interview revision: property descriptors, object immutability, prototype delegation chains, ES6 classes with private fields (`#`), mutating vs non-mutating array methods, and array sorting traps.

## Objects, property descriptors, and mutability

**1. Property descriptors: Data vs Accessor**

Every object property has metadata attributes configured via `Object.defineProperty()`:
- **Data Descriptors:** `value`, `writable` (can change value), `enumerable` (shows in loops/keys), `configurable` (can delete property or alter descriptor).
- **Accessor Descriptors:** `get`, `set`, `enumerable`, `configurable`.

```js
const config = {};
Object.defineProperty(config, "apiKey", {
  value: "secret-key-123",
  writable: false,      // Read-only
  enumerable: false,    // Hidden from Object.keys() and JSON.stringify()
  configurable: false   // Cannot be deleted or reconfigured
});

config.apiKey = "new-key"; // Fails silently in sloppy mode; throws TypeError in strict mode
console.log(config.apiKey); // "secret-key-123"
```

**1.1 Shallow immutability: Freeze vs Seal**

- `Object.freeze()`: Prevents adding, removing, or modifying properties (`writable: false, configurable: false`).
- `Object.seal()`: Prevents adding or removing properties, but existing writable properties can still be updated.
- Both methods are strictly **shallow**; nested objects remain fully mutable.

```js
const user = Object.freeze({ name: "Bob", settings: { theme: "dark" } });
user.name = "Alice";               // Fails / Throws in strict mode
user.settings.theme = "light";     // Mutates successfully! (nested object is not frozen)
```

[Objects and descriptors](../../Javascript/javascript-lectures/day-09-objects-and-property-access.md)

## Prototypes and delegation chains

**1. The prototype delegation mechanism**

JavaScript objects do not copy behavior from classes; they delegate property lookups up the prototype chain (`[[Prototype]]` link). When reading `obj.prop`, V8 checks `obj`, then `Object.getPrototypeOf(obj)`, continuing until found or terminating at `null`.

```js
const animal = {
  makeSound() { return this.sound; }
};

// Delegate directly via Object.create
const dog = Object.create(animal);
dog.sound = "Woof!";
console.log(dog.makeSound()); // "Woof!" (delegated up the chain)
console.log(Object.getPrototypeOf(dog) === animal); // true
```

**1.1 `Object.create(null)` for dictionary lookups**

Objects created with `Object.create(null)` have no prototype chain (`[[Prototype]] === null`). They are impervious to Prototype Pollution attacks and contain no inherited methods (like `toString` or `valueOf`).

```js
const map = Object.create(null);
map["key"] = 100;
console.log(map.toString); // undefined - completely clean dictionary
```

**1.2 Introspection: `Object.hasOwn` vs `hasOwnProperty`**

Use `Object.hasOwn(obj, prop)` (ES2022) to check if a property belongs directly to an object rather than its prototype. Unlike `obj.hasOwnProperty()`, it does not fail on `Object.create(null)` objects.

```js
const proto = { inherited: true };
const child = Object.create(proto);
child.own = true;

console.log(Object.hasOwn(child, "own"));       // true
console.log(Object.hasOwn(child, "inherited")); // false
```

[Prototypes and inheritance](../../Javascript/javascript-lectures/day-10-prototypes-classes-and-inheritance.md)

## Classes, inheritance, and private fields

**1. ES6 Class syntax and prototype sugar**

Classes are syntactic sugar over prototype delegation, but enforce strict rules: they run in strict mode by default and throw a `TypeError` if invoked without `new`.

```js
class Service {
  static version = "1.0"; // Bound to constructor, not instance
  constructor(name) {
    this.name = name;
  }
  execute() { return `${this.name} running`; }
}
```

**1.1 Truly private fields (`#`)**

Prefixing identifiers with `#` creates language-enforced private fields and methods. They cannot be inspected, accessed, or overridden outside the class body, even via `Object.keys()` or bracket notation (`this[#field]` is a syntax error).

```js
class BankAccount {
  #balance = 0; // Private field

  deposit(amount) {
    if (amount <= 0) throw new Error("Invalid deposit");
    this.#balance += amount;
  }

  getBalance() {
    return this.#balance;
  }
}

const account = new BankAccount();
account.deposit(50);
console.log(account.getBalance()); // 50
// console.log(account.#balance);  // SyntaxError: Private field '#balance' must be declared in an enclosing class
```

**1.2 Subclasses and `super` constructor requirements**

In a derived class constructor, you must call `super(...args)` before accessing `this`; the parent constructor creates and initializes the instance before the derived class binds its fields.

```js
class BaseLogger {
  constructor(prefix) { this.prefix = prefix; }
}

class CustomLogger extends BaseLogger {
  constructor(prefix, tag) {
    // this.tag = tag; // ReferenceError: Must call super constructor before accessing 'this'
    super(prefix);
    this.tag = tag;
  }
}
```

[Classes and OOP](../../Javascript/javascript-lectures/day-11-property-descriptors-and-immutability.md)

## Arrays, methods, and memory layout

**1. Mutating vs non-mutating array methods**

Modern JavaScript provides immutable copying counterparts (ES2023) for classic mutating methods:
- **Mutating:** `push`, `pop`, `shift`, `unshift`, `splice`, `reverse`, `sort`.
- **Non-mutating (Copying):** `slice`, `concat`, `toSpliced()`, `toReversed()`, `toSorted()`.

```js
const original = [3, 1, 2];

// Mutating: changes original in-place
// original.sort(); // original is now [1, 2, 3]

// Non-mutating (ES2023): returns a sorted shallow copy
const sorted = original.toSorted((a, b) => a - b);
console.log(original); // [3, 1, 2]
console.log(sorted);   // [1, 2, 3]
```

**2. The `.sort()` numeric sorting trap**

By default, `.sort()` converts all elements to strings and compares their UTF-16 code units lexicographically. Numeric sorting requires an explicit comparator `(a, b) => a - b`.

```js
// Lexicographical default sort
const numbers = [10, 5, 40, 25];
numbers.sort();
console.log(numbers); // [10, 25, 40, 5] ('25' < '40' < '5')

// Correct numeric sort
numbers.sort((a, b) => a - b);
console.log(numbers); // [5, 10, 25, 40]
```

**3. Sparse arrays and empty slots**

An array with empty slots (created via `new Array(3)` or deleting an index) differs from an array filled with `undefined`. Methods like `map()`, `filter()`, and `forEach()` skip empty slots completely.

```js
const sparse = [1, , 3]; // index 1 is an empty hole
console.log(sparse.length); // 3
console.log(sparse.map((x) => x * 2)); // [2, <empty>, 6]
```

[Arrays and collections](../../Javascript/javascript-lectures/day-12-built-in-data-structures-and-serialization.md)

## Tricky points

1. **Objects and descriptors**

**1.1 Shallow freeze mutating nested properties**
Applying `Object.freeze()` to a configuration object does not freeze nested arrays or objects. Use a recursive deep-freeze utility for true immutability.

**1.2 Non-configurable property traps**
Once a property is defined with `configurable: false`, its `enumerable` attribute cannot be changed, and it cannot be switched between data and accessor descriptors.

2. **Prototypes and classes**

**1.3 Prototype pollution vulnerability**
Merging unvalidated user payloads recursively into objects (`target[key] = val`) allows attackers to inject `__proto__.isAdmin = true`, polluting every object across the entire application runtime.

**1.4 Calling class constructors without `new`**
Unlike standard functions which bind to the global receiver when invoked as `Fn()`, class constructors throw `TypeError: Class constructor cannot be invoked without 'new'`.

3. **Arrays and mutation**

**1.5 Mutating arrays during `.forEach` or `.filter` loops**
Calling `.splice()` on an array while iterating over it causes the iterator index to skip the immediately following element as array indices shift left.

**1.6 Empty slots vs `undefined` in array methods**
`[1, , 3].indexOf(undefined)` returns `-1` because the empty slot does not exist on the array, whereas `[1, undefined, 3].indexOf(undefined)` returns `1`.