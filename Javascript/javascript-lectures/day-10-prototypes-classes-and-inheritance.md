# Day 10: Prototypes, Classes, and Inheritance

<nav aria-label="Lecture navigation">

[Previous: Objects and Property Access](day-09-objects-and-property-access.md) | [Roadmap](../javascript-roadmap.md) | [Next: Property Descriptors, Enumerability, and Immutability](day-11-property-descriptors-and-immutability.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain how JavaScript looks up a property through a prototype chain.
- Describe what `new` does step by step.
- Explain how classes use prototypes internally.
- Use instance methods, static methods, private fields, `extends`, and `super` correctly.
- Compare inheritance with composition and choose deliberately.

## Prerequisites

Read [Day 09: Objects and Property Access](day-09-objects-and-property-access.md). Day 9 introduced prototype lookup; this lecture explains that lookup in detail. Day 11 will explain the property descriptors used by these objects.

## Core Concepts

### 1. Every ordinary object can have a prototype

A prototype is another object that JavaScript checks when the current object does not contain a property. This creates a lookup chain.

```js
const animal = {
  breathe() {
    return "breathing";
  },
};

const dog = Object.create(animal);
dog.name = "Milo";

console.log(dog.name); // "Milo"
console.log(dog.breathe()); // "breathing"
console.log(Object.hasOwn(dog, "breathe")); // false
```

The `dog` object owns `name`. It does not own `breathe`; the method is found on its prototype.

The chain ends at `null`. If no object in the chain has the property, the result is usually `undefined`.

### 2. `[[Prototype]]` is an internal connection

The specification calls the internal prototype connection `[[Prototype]]`. You can inspect it with `Object.getPrototypeOf` and create objects with `Object.create`.

```js
const parent = { sharedValue: 10 };
const child = Object.create(parent);

console.log(Object.getPrototypeOf(child) === parent); // true
console.log(child.sharedValue); // 10
```

`__proto__` exists in many environments, but prefer standard APIs such as `Object.getPrototypeOf` and `Object.setPrototypeOf`. Changing prototypes repeatedly can also make engine optimization harder.

### 3. Constructor functions and `new`

Before class syntax, constructor functions were commonly used to create similar objects.

```js
function User(name) {
  this.name = name;
}

User.prototype.describe = function describe() {
  return `User: ${this.name}`;
};

const user = new User("Asha");
console.log(user.describe()); // "User: Asha"
console.log(Object.getPrototypeOf(user) === User.prototype); // true
```

A call using `new` roughly does these things:

1. Create a new empty object.
2. Connect that object to `User.prototype`.
3. Call `User` with `this` set to the new object.
4. Return the new object, unless the constructor explicitly returns another object.

This explains why methods placed on `User.prototype` are shared instead of being recreated for every user.

### 4. Classes are clearer syntax over prototype behavior

```js
class User {
  constructor(name) {
    this.name = name;
  }

  describe() {
    return `User: ${this.name}`;
  }

  static category() {
    return "account";
  }
}

const user = new User("Asha");
console.log(user.describe()); // "User: Asha"
console.log(User.category()); // "account"
console.log(Object.hasOwn(user, "describe")); // false
console.log(Object.hasOwn(User.prototype, "describe")); // true
```

An instance method belongs to the class prototype. A static method belongs to the class constructor itself. Static methods are called on `User`, not on `user`.

Class bodies run in strict mode. A class cannot be called without `new`.

### 5. Inheritance and `super`

A subclass can inherit methods from a parent class.

```js
class Employee {
  constructor(name) {
    this.name = name;
  }

  describe() {
    return `${this.name} works here`;
  }
}

class Manager extends Employee {
  describe() {
    return `${super.describe()} as a manager`;
  }
}

const manager = new Manager("Mina");
console.log(manager.describe()); // "Mina works here as a manager"
console.log(manager instanceof Manager); // true
console.log(manager instanceof Employee); // true
```

`extends` connects the subclass prototype to the parent prototype. `super.describe()` calls the parent method with the current receiver. In a derived constructor, `super()` must run before using `this`.

### 6. Private fields are truly private to the class

A field beginning with `#` is a private class element.

```js
class Counter {
  #value = 0;

  increment() {
    this.#value += 1;
    return this.#value;
  }
}

const counter = new Counter();
console.log(counter.increment()); // 1
// counter.#value; // SyntaxError: private field access is not allowed here
```

Private fields are not ordinary string properties. They cannot be read with bracket notation, copied with object spread, or accessed by a subclass unless the subclass declares its own private field. Support is part of modern ECMAScript, but projects should still consider their supported runtime versions.

## Detailed Explanations and Traces

### Prototype lookup is read-time behavior

```js
const settings = { mode: "safe" };
const request = Object.create(settings);

console.log(request.mode); // "safe"
request.mode = "fast";

console.log(request.mode); // "fast"
console.log(settings.mode); // "safe"
console.log(Object.hasOwn(request, "mode")); // true
```

The first read finds `mode` on `settings`. Assignment normally creates an own property on `request`, so later reads stop there. Reading and writing are not simply the same operation on the same object.

### Method sharing and mutable state

Methods on a prototype are shared, but fields assigned in the constructor are normally separate.

```js
class Cart {
  constructor() {
    this.items = [];
  }

  add(item) {
    this.items.push(item);
  }
}

const firstCart = new Cart();
const secondCart = new Cart();
firstCart.add("book");

console.log(firstCart.items); // ["book"]
console.log(secondCart.items); // []
console.log(firstCart.add === secondCart.add); // true
```

Sharing a method is useful. Sharing a mutable array accidentally would be a bug. Put per-instance mutable state on `this`, not on the prototype.

### Constructor return behavior

```js
class Example {
  constructor() {
    return { replacement: true };
  }
}

const result = new Example();
console.log(result); // { replacement: true }
```

An explicitly returned object can replace the automatically created instance. A primitive return value does not replace it. This is valid language behavior but is usually surprising, so avoid it unless there is a clear reason.

### Composition versus inheritance

Inheritance models an "is a" relationship. Composition builds an object by giving it smaller collaborators.

```js
class Logger {
  log(message) {
    return `[log] ${message}`;
  }
}

class Service {
  constructor(logger) {
    this.logger = logger;
  }

  run() {
    return this.logger.log("work completed");
  }
}

const service = new Service(new Logger());
console.log(service.run()); // "[log] work completed"
```

Composition makes the dependency explicit and easy to replace in a test. Inheritance can be useful when objects share a stable contract and substitutability is clear. It becomes risky when subclasses need to disable or contradict parent behavior.

## Compare & Recall

| Concept A | Concept B | Key difference |
|---|---|---|
| Class | Prototype chain | A `class` is cleaner syntax, but instance methods still live on `ClassName.prototype` — not on each instance. No magic happens; it's the same prototype lookup as always. |
| Instance method | Static method | Instance method: called on an object (`user.describe()`), gets `this` = the instance. Static method: called on the class itself (`User.category()`), not available on instances. |
| Inheritance (`extends`) | Composition | `extends` is an "is-a" relationship — subclass shares and overrides parent behavior. Composition is "has-a" — object delegates to a collaborator. Prefer composition for flexibility and testability. |
| `super.method()` | Parent method call | `super.method()` calls the parent's version while keeping `this` as the current instance. It is not simply a function reference. |
| Private field `#val` | Naming convention `_val` | `#val` is enforced by the language — truly inaccessible from outside the class. `_val` is just a name convention; anyone can still access it. |
| `instanceof` | `typeof` | `instanceof` checks the prototype chain (`obj instanceof MyClass`). `typeof` only gives a broad type string (`"object"` for all objects, including arrays). |

> **Cross-day links:** Property descriptors and `configurable`/`enumerable` are in [Day 11](day-11-property-descriptors-and-immutability.md). Object creation methods including `Object.create` are in [Day 09](day-09-objects-and-property-access.md). `this` binding rules are in [Day 08](day-08-closures-execution-context-and-this.md).

## Common Mistakes and Interview Traps

- Saying classes remove prototypes. They do not; class methods still live on prototypes.
- Putting mutable arrays or objects on a prototype and accidentally sharing them.
- Calling a static method on an instance.
- Using `this` in a derived constructor before `super()`.
- Assuming `instanceof` proves that an object came from the same application copy of a class. Multiple copies of a package can have different prototypes.
- Treating `#private` fields as normal properties.
- Choosing inheritance only to reuse a few lines of code.
- Forgetting that a constructor can explicitly return an object.

## Tricky Points

- `Object.hasOwn(value, key)` checks only direct properties; `key in value` also checks prototypes.
- A method can be shared while its `this` value changes depending on the call form.
- `super` is not simply another variable. It performs a parent-method lookup while preserving the current receiver.
- `instanceof` depends on prototype relationships and can be changed by custom prototype manipulation.

## Practical Exercise

**Goal:** Model a notification service in two ways.

**Inputs and outputs:**

- Create a `Notification` base class and an `EmailNotification` subclass.
- Create a second version using a `sender` collaborator through composition.
- Each version should return a string for a supplied recipient and message.

**Constraints:**

- Keep per-instance data separate.
- Share behavior through methods, not copied function values.
- Include one test that replaces the sender with a fake object.

**Edge cases:** Empty recipient, empty message, and a sender that throws an error.

**Acceptance criteria:** Explain the prototype chain, show which methods are shared, and justify which design is easier to test.

## Summary

- Objects can delegate property lookup to a prototype.
- `new` creates an object, connects its prototype, calls the constructor, and usually returns the object.
- Class syntax still uses prototypes for instance methods.
- Static methods belong to the class itself.
- `extends` connects prototype chains, and `super` calls parent behavior.
- Private fields are not ordinary properties.
- Composition often gives clearer dependencies than inheritance.

## Cheat Sheet

| Concept | Meaning |
|---|---|
| `Object.getPrototypeOf(value)` | Reads an object's prototype |
| `Object.create(parent)` | Creates an object with a chosen prototype |
| `new Constructor()` | Creates and initializes an instance |
| Instance method | Usually stored on `Class.prototype` |
| Static method | Stored on the class constructor |
| `extends` | Creates subclass prototype relationships |
| `super()` | Initializes a derived constructor |
| `super.method()` | Calls inherited behavior with current receiver |
| `#field` | Private class field |

**vs. quick reference**

| | Instance method | Static method |
|---|---|---|
| Defined on | `Class.prototype` | Class constructor |
| Called on | `new Class()` instance | Class itself (`Class.method()`) |
| Has access to `this` | ✓ (the instance) | ✓ (the class) |
| Available on instance | ✓ | ✗ |

| Pattern | Best when |
|---|---|
| `extends` (inheritance) | Strong "is-a" contract; few overrides; stable parent |
| Composition | Flexible, testable; dependency can change; no tight coupling |

## Interview Questions

> Difficulty guide: **[Beginner]** = entry-level, **[Mid]** = requires understanding of internals, **[Senior]** = design and tradeoff thinking expected.

1. **[Mid] Definition:** Explain the difference between an own property and an inherited property. Include a read trace and an assignment trace.
   - Expected answer: Define the prototype chain, use `Object.hasOwn`, and explain why assignment usually creates an own property.
   - Follow-up: How could changing the prototype affect `in` and `instanceof`?

2. **[Beginner] Trace:** Predict the output and explain each lookup:

   ```js
   const parent = { value: 1 };
   const child = Object.create(parent);
   child.value += 2;
   console.log(parent.value, child.value, Object.hasOwn(child, "value"));
   ```
   - Expected answer: `1 3 true`; the read finds the parent value, then assignment creates the child's own value.
   - Follow-up: What changes if the inherited property is a setter?

3. **[Senior] Implementation:** Design a class hierarchy for payments without duplicating validation code.
   - Expected answer: Show the stable parent contract, subclass responsibilities, composition alternatives, error behavior, and tests.
   - Follow-up: When would a strategy object be safer than another subclass?

4. **[Mid] Debugging:** A subclass constructor throws `ReferenceError: Must call super constructor`. Explain the cause and repair it without hiding initialization errors.
   - Expected answer: Derived constructors cannot use `this` before `super()`; call `super` first or redesign initialization.
   - Follow-up: How do private fields change subclass design?

5. **[Senior] Design:** A Node service has eight subclasses with many overridden methods and fragile parent assumptions. Recommend a redesign.
   - Expected answer: Identify violated contracts, compare composition and inheritance, define interfaces, migration steps, testing, and operational risk.
   - Follow-up: How would you detect behavior regressions during migration?

