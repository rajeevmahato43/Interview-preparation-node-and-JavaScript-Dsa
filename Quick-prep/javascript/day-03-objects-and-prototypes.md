# Day 3: Objects, Collections, and Serialization

## Objects and property behavior

**1. Creation and keys**

Object literals create objects; property keys are strings or symbols.

```js
const fieldName = "status";
const item = { [fieldName]: "ready" };
```

**2. Property access**

Dot access names a fixed property; brackets support computed keys.

```js
user.name;      // fixed key
user[field];    // computed key
```

**3. Own, inherited, and missing properties**

Lookup checks own properties then prototypes; a missing property reads `undefined`.

```js
Object.hasOwn(user, "role"); // distinguish absent from present-undefined
```

**4. Getters and setters**

Accessors run code on property read/write rather than storing a plain field.

```js
get fullName() { return first + " " + last; }
```

**5. Methods and spread**

Method shorthand creates a function-valued property; object spread copies enumerable own fields shallowly.

```js
const updated = { ...user, active: true };
```

**6. Property descriptors**

`writable`, `enumerable`, and `configurable` control property behavior; omitted descriptor flags default to false in `Object.defineProperty`.

**7. Extension, sealing, and freezing**

`preventExtensions` blocks additions; `seal` also blocks deletion/configuration; `freeze` also blocks top-level writes. These are shallow.

```js
const config = Object.freeze({ nested: {} });
config.nested.value = 1; // nested object remains mutable
```

[Objects](../../Javascript/javascript-lectures/day-09-objects-and-property-access.md) | [Descriptors](../../Javascript/javascript-lectures/day-11-property-descriptors-and-immutability.md)

## Prototypes and classes

**1. Prototype lookup**

Missing-property reads walk `[[Prototype]]`; an own property shadows the inherited one.

```js
delete item.name; // an inherited base.name may now appear
```

**2. Constructor and `new`**

`new C()` creates an instance linked to `C.prototype`, calls `C` with it, and normally returns that instance.

**3. Class members**

Instance methods are usually on the prototype; static methods belong to the class.

```js
class User { static fromJSON(data) { return new User(data); } }
```

**4. Inheritance and `super`**

`extends` links prototype chains; `super()` calls the parent constructor, and `super.method()` calls inherited behavior.

**5. Private fields and overriding**

`#field` is accessible only by its declaring class; an override replaces inherited method lookup for that name.

**6. Composition**

Composition combines collaborators without forcing an inheritance hierarchy; `OrderService` can receive a `PaymentClient`.

[Full topic](../../Javascript/javascript-lectures/day-10-prototypes-classes-and-inheritance.md)

## Built-in data and serialization

1. **Array indexing and length:** Arrays are indexed objects; assigning a distant index creates holes and can increase `length`. Example: `const a=[]; a[2]=7;` has holes at 0 and 1.
2. **Mutation and iteration:** Methods such as `push` mutate; `map` returns a new array; sparse holes differ from explicit `undefined`.
3. **Sorting:** `sort()` mutates and compares as strings by default; numeric order needs `(a, b) => a - b`.
4. **Strings and Unicode:** Strings are immutable UTF-16 code-unit sequences; `"😀".length` is `2`, though it is one code point.
5. **Numbers and special values:** Floating point has rounding; `NaN`, infinities, and signed zero have special comparisons. Example: `Number.isNaN(NaN)` is true.
6. **`BigInt`:** Holds arbitrary-size integers but cannot mix directly with `number`; `10n + 2n` works, `10n + 2` throws.
7. **`Map` and `Set`:** `Map` associates arbitrary keys to values; `Set` stores unique values. Example: two `{}` object keys remain distinct by identity.
8. **Weak collections:** `WeakMap`/`WeakSet` hold object keys/values weakly and are not enumerable; useful for metadata without owning object lifetime.
9. **JSON serialization:** JSON supports a limited value set; undefined object properties are omitted, `BigInt` throws, and cycles throw. [Full topic](../../Javascript/javascript-lectures/day-12-built-in-data-structures-and-serialization.md)

## Tricky points

1. **Objects and properties**
	1.1 **Missing versus undefined:** Both read as `undefined`; use `Object.hasOwn` to distinguish an absent own property from a present one.
	1.2 **Spread:** `{ ...source }` does not copy the prototype, descriptors, or nested object graph.
	1.3 **Freezing:** `Object.freeze` blocks top-level changes only; nested objects can still mutate.
2. **Prototypes and classes**
	2.1 **Shadowing:** Deleting an own property can reveal a same-named inherited property.
	2.2 **`instanceof`:** It follows prototype relationships and may not work across separate realms.
3. **Collections and serialization**
	3.1 **Sparse arrays:** Some array callbacks skip holes; do not treat holes and explicit `undefined` as interchangeable.
	3.2 **Sorting:** `[10, 2].sort()` is lexicographic; use `(a, b) => a - b` for numbers.
	3.3 **JSON:** `BigInt` throws by default, `undefined` object properties are omitted, and circular references throw.