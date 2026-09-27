# Day 21: Memory, Reachability, and Ownership

<nav aria-label="Lecture navigation">

[← Previous Day: Day 20 - Jobs, Microtasks, and Observable Scheduling](day-20-jobs-microtasks-and-scheduling.md) | [Roadmap](../javascript-roadmap.md) | [Next Day: Day 22 - Performance and Algorithmic Reasoning →](day-22-performance-and-algorithmic-reasoning.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Explain the difference between lexical scope lifetime and runtime object reachability from root references.
- Deconstruct the V8 memory architecture into stack frames, Young Generation (Nursery/Intermediate), Old Generation, and Large Object spaces.
- Contrast generational Scavenge collection with Major Mark-Sweep-Compact garbage collection cycles.
- Identify the five most common Node.js retention leaks: module-scoped collections, dangling event listeners, closure context retention, abandoned promises, and buffer slicing.
- Select appropriately between strong references (`Map`/`Set`) and weak references (`WeakMap`/`WeakSet`/`WeakRef`).
- Implement an explicit bounded LRU cache with deterministic eviction semantics.
- Articulate why `FinalizationRegistry` and garbage collection cannot be used as deterministic resource cleanup mechanisms.

---

## Vocabulary Card

| Term | Plain Definition | Everyday Analogy |
| :--- | :--- | :--- |
| **Reachability** | The property that an object in memory can be navigated to via a chain of references starting from an active root (e.g. global object, active call stack). | A boat anchored to the dock; as long as at least one mooring rope connects it back to the shore, the tide cannot carry it away. |
| **GC Root** | An intrinsically live reference originating from active local variables, the call stack, module scopes, or the global object. | The main steel pylons anchored directly into bedrock from which a suspension bridge hangs. |
| **Generational Hypothesis** | The empirical observation that the vast majority of allocated objects die very shortly after creation. | Disposable coffee cups: most are thrown away within 15 minutes of purchase, while a ceramic mug lasts for years. |
| **Scavenge (Minor GC)** | A fast, stop-the-world garbage collection cycle that moves live short-lived objects between semi-spaces in the Young Generation. | Quickly tossing junk mail from your entryway table straight into the recycling bin each afternoon. |
| **Mark-Sweep-Compact** | The major collection cycle that traverses the entire reachable object graph, sweeps dead objects, and compacts fragmented memory in the Old Generation. | An annual spring cleaning where furniture is shifted, closets are cleared, and remaining possessions are packed tightly together. |
| **Weak Reference** | A reference to an object that does not prevent the object from being reclaimed by the garbage collector if no strong references remain. | A guest list record noting someone visited your party; if they leave town, having their name on the list doesn't keep them in the city. |

---

## Core Concepts

### 1. Reachability vs. Lexical Scope

In JavaScript, variable declarations are lexically scoped, but allocated objects reside on the heap. Exiting a function scope does **not** automatically free allocated objects if a reference path connects them back to an active GC root.

```javascript
// Node.js code
// ✅ DO: Understand that references, not scopes, dictate object survival
function createScopedGraph() {
  const hugeData = new Array(1_000_000).fill("heavy_record");
  
  // Lexical scope of createScopedGraph exits here, BUT:
  return function extractLength() {
    // Closure retains a live strong reference to hugeData!
    return hugeData.length;
  };
}

const liveAccessor = createScopedGraph();
// hugeData remains alive on the V8 heap because liveAccessor holds a reachable reference!
console.log("Retained data length:", liveAccessor());
```

**Garbage Collection Rule:** An object is eligible for garbage collection if and only if there is **zero reachable path** from any active GC root (Global, Active Stack Frame, or Node.js internal C++ handles).

### 2. The V8 Generational Memory Model

V8 divides heap memory into distinct spaces based on object age and size:

1. **Young Generation (New Space):** Small (typically 16MB–64MB). Where almost all new allocations occur. Managed by the lightning-fast **Scavenger** collector.
   - Divided into two semi-spaces: `From Space` and `To Space`.
   - Objects that survive two Minor GC cycles are promoted to Old Space.
2. **Old Generation (Old Space):** Houses long-lived objects that survived the Young Generation.
   - **Old Pointer Space:** Contains objects containing pointers to other objects.
   - **Old Data Space:** Contains raw data payloads (strings, boxed numbers, raw byte buffers).
   - Collected infrequently by **Major Mark-Sweep-Compact** cycles.
3. **Large Object Space:** Allocations that exceed the capacity of New Space bypass the Young Generation entirely and are allocated directly here to avoid expensive copy operations.
4. **Code Space:** Houses JIT-compiled machine code instructions generated by TurboFan.

### 3. Strong vs. Weak Ownership: `Map` vs. `WeakMap`

A `Map` holds strong references to both its keys and its values. Even if all external references to a key object are set to `null`, the `Map` retains the key and value in memory forever until explicitly deleted or cleared.

A `WeakMap` holds **weak references** to its keys:
- Keys must be objects or non-registered symbols.
- If no external strong references to the key object remain, the entry is eligible for garbage collection.
- `WeakMap` is **not iterable**, has no `.size` property, and cannot be enumerated.

```javascript
// Node.js code
const strongCache = new Map();
const weakMetadata = new WeakMap();

let sessionToken = { id: "sess_88192" };

strongCache.set(sessionToken, "user_profile_data");
weakMetadata.set(sessionToken, { authenticatedAt: Date.now() });

// Sever external reference:
sessionToken = null;

// ❌ Memory Leak Risk:
// strongCache STILL holds the object in heap memory!
console.log("Strong cache entries:", strongCache.size); // 1

// ✅ Weak ownership:
// The entry in weakMetadata is now eligible for GC reclamation automatically!
```

### 4. `WeakRef` and `FinalizationRegistry`

ES2021 introduced `WeakRef` (dereferenceable weak pointers) and `FinalizationRegistry` (post-mortem cleanup notifications).
- `weakRef.deref()`: Returns the target object if alive, or `undefined` if collected.
- `FinalizationRegistry`: Invokes a callback *after* an object has been garbage collected.

```javascript
// Node.js code
const registry = new FinalizationRegistry((heldValue) => {
  console.log(`[GC NOTICE] Object with metadata '${heldValue}' was collected`);
});

function monitorObject() {
  let tempObject = { name: "Ephemeral" };
  registry.register(tempObject, "temp-obj-tag");
  // tempObject goes out of scope here
}

monitorObject();
```

**Critical Warning:** The ECMAScript specification explicitly warns that GC timing is non-deterministic. A runtime may never run garbage collection during process exit. **Never rely on `FinalizationRegistry` to release database connections, file handles, or network sockets!**

---

## Detailed Explanations and Traces

### Trace 1: The Shared Closure Context Leak

A subtle, classic V8 optimization quirk occurs when two closures in the same scope share a lexical environment:

```javascript
// Node.js code
// ❌ SUBTLE MEMORY LEAK:
let leakedClosure;

function runScope() {
  const hugePayload = new Array(1_000_000).fill("heavy");

  // Closure 1: Uses hugePayload
  function heavyWorker() {
    return hugePayload[0];
  }

  // Closure 2: Uses NOTHING from the outer scope!
  leakedClosure = function tinyWorker() {
    return "I am tiny";
  };
}

runScope();
// Even though tinyWorker does NOT reference hugePayload,
// V8 historically compiles a single shared lexical environment record for both closures.
// Because leakedClosure is reachable from the global root, hugePayload is retained!
```

```
Retention Graph:
[ Global Context ]
        |
        v
[ leakedClosure (tinyWorker) ]
        |
        v (Points to Shared Lexical Context)
[ Scope Context { heavyWorker, hugePayload } ]
        |
        v
[ Array of 1,000,000 strings ]  <-- RETAINED IN HEAP!
```

**Fix:** Avoid keeping long-lived closures alongside large temporary objects in the same function scope. Explicitly null out `hugePayload = null` before the function completes.

---

### Trace 2: The Dangling Event Listener Retention Path

In Node.js, `EventEmitter` instances maintain strong references to listener functions:

```javascript
// Node.js code
const EventEmitter = require("node:events");
const globalBus = new EventEmitter();

function handleUserRequest(reqId) {
  const requestBuffer = Buffer.alloc(10 * 1024 * 1024); // 10 MB

  // ❌ ANTI-PATTERN: Attaching to global singleton without cleanup
  globalBus.on("configUpdate", () => {
    console.log(`Updated config for request ${reqId}, buffer size: ${requestBuffer.length}`);
  });
}

for (let i = 0; i < 100; i++) {
  handleUserRequest(i);
}
// Heap has now leaked 1 GB of memory!
// globalBus retains 100 closures, each retaining a 10MB Buffer!
```

---

## Code Examples

### 1. Deterministic Bounded LRU Cache

An unbounded `Map` will eventually exhaust process memory (`JavaScript heap out of memory`). A clean, self-evicting LRU cache leverages `Map` key iteration order:

```javascript
// Node.js code
class BoundedLRUCache {
  constructor(maxEntries) {
    if (!Number.isInteger(maxEntries) || maxEntries < 1) {
      throw new RangeError("maxEntries must be a positive integer");
    }
    this.maxEntries = maxEntries;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;

    // Refresh key to "most recently used" by re-inserting at tail of Map
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    // If key already exists, delete it so re-insert moves it to end
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxEntries) {
      // ✅ Evict the oldest entry: Map.keys().next().value returns first-inserted key
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, value);
  }

  get size() {
    return this.cache.size;
  }
}

// Verification:
const lru = new BoundedLRUCache(3);
lru.set("a", 1);
lru.set("b", 2);
lru.set("c", 3);
lru.get("a"); // Promotes "a" to recent! Order: b, c, a
lru.set("d", 4); // Evicts "b"!

console.log("Has 'b' (oldest)?", lru.cache.has("b")); // false
console.log("Has 'a' (accessed)?", lru.cache.has("a")); // true
console.log("Current entries:", [...lru.cache.keys()]); // ['c', 'a', 'd']
```

### 2. Attaching Metadata Without Leaking Instances via `WeakMap`

Associating private operational metadata with request or connection objects without polluting object keys or preventing garbage collection:

```javascript
// Node.js code
const requestMetadata = new WeakMap();

function registerIncomingRequest(requestObj) {
  // Associate telemetry without modifying the requestObj shape (keeps V8 hidden classes stable)
  requestMetadata.set(requestObj, {
    receivedAt: Date.now(),
    authenticatedUser: "user_9941",
  });
}

function getRequestTelemetry(requestObj) {
  return requestMetadata.get(requestObj);
}

let mockReq = { path: "/api/checkout", method: "POST" };
registerIncomingRequest(mockReq);
console.log("Metadata:", getRequestTelemetry(mockReq));

// When mockReq is finished and dereferenced by Node's HTTP engine:
mockReq = null;
// requestMetadata automatically cleans up when GC sweeps!
```

---

## Tricky Points and Gotchas

### 1. `Buffer.slice()` vs. `Buffer.subarray()` Memory Retention

In Node.js, `buf.subarray()` (and historically `buf.slice()`) creates a view sharing the **identical underlying memory pool**:

```javascript
// Node.js code
// ❌ GOTCHA: Slicing a tiny substring or sub-buffer retains the massive parent allocation!
function extractSmallToken() {
  const hugeBuffer = Buffer.alloc(50 * 1024 * 1024); // 50MB
  hugeBuffer.write("TOKEN_123", 0);
  
  // Creates a view over the 50MB ArrayBuffer:
  return hugeBuffer.subarray(0, 9);
}

// The returned 9-byte view keeps the entire 50MB buffer alive in memory!
const token = extractSmallToken();

// ✅ FIX: Clone bytes to allow the 50MB parent buffer to be collected
function extractSmallTokenSafe() {
  const hugeBuffer = Buffer.alloc(50 * 1024 * 1024);
  hugeBuffer.write("TOKEN_123", 0);
  
  const token = Buffer.alloc(9);
  hugeBuffer.copy(token, 0, 0, 9);
  return token; // 50MB parent is now completely unreferenced and eligible for GC!
}
```

### 2. Global / Module-Level Singletons

Any array, map, or object defined at the top level of a module is rooted to the module's export table, which is held by Node's module cache. It will **never** be garbage collected during the lifetime of the process.

### 3. Forgotten Interval Timers

Calling `setInterval(fn, 1000)` attaches the callback to Node's internal timer list. Because the timer list is a GC root, the closure—and everything referenced within it—remains permanently in memory until `clearInterval(timerId)` is explicitly called.

---

## Hands-on Exercise: Diagnosing and Fixing a Leaky Subscription Hub

### Problem Statement

You have an event notification hub in a microservice. As thousands of client connections connect and disconnect, the memory usage climbs linearly until the process crashes with `OOM`.

### Buggy Implementation

```javascript
// Node.js code
// ❌ BUGS:
// 1. Listeners stored in unbounded array without unsubscribe cleanup
// 2. Closed-over client socket retained in memory indefinitely
// 3. Duplicate registrations are not deduplicated
class EventHub {
  constructor() {
    this.subscribers = [];
  }

  subscribe(topic, socket) {
    this.subscribers.push({
      topic,
      handler: (data) => socket.write(JSON.stringify(data)),
    });
  }

  publish(topic, data) {
    for (const sub of this.subscribers) {
      if (sub.topic === topic) sub.handler(data);
    }
  }
}
```

### Edge Cases to Address

1. Clients disconnect abruptly: Must provide an explicit `unsubscribe()` function.
2. Socket reference retention: Prevent memory leak when socket closes.
3. Clean removal without array index corruption or unbounded array growth.

### Verified Solution

```javascript
// Node.js code
class SafeEventHub {
  constructor() {
    // Topic -> Set of handler callbacks
    this.topics = new Map();
  }

  subscribe(topic, socket) {
    if (!this.topics.has(topic)) {
      this.topics.set(topic, new Set());
    }

    const handler = (data) => {
      if (!socket.destroyed) {
        socket.write(JSON.stringify(data));
      }
    };

    const topicHandlers = this.topics.get(topic);
    topicHandlers.add(handler);

    // 1. Auto-cleanup on socket disconnect
    const cleanup = () => {
      topicHandlers.delete(handler);
      if (topicHandlers.size === 0) {
        this.topics.delete(topic); // Free empty topic set
      }
      socket.removeListener("close", cleanup);
      socket.removeListener("error", cleanup);
    };

    socket.once("close", cleanup);
    socket.once("error", cleanup);

    // 2. Return explicit teardown handle (Unsubscribe)
    return () => cleanup();
  }

  publish(topic, data) {
    const handlers = this.topics.get(topic);
    if (!handlers) return;

    for (const handler of handlers) {
      try {
        handler(data);
      } catch (err) {
        console.error("Handler error:", err.message);
      }
    }
  }

  get activeTopicCount() {
    return this.topics.size;
  }
}

// Verification:
const hub = new SafeEventHub();
const mockSocket = {
  destroyed: false,
  write: (msg) => console.log("Emitted:", msg),
  listeners: {},
  once(event, fn) { this.listeners[event] = fn; },
  removeListener(event) { delete this.listeners[event]; },
};

const unsubscribe = hub.subscribe("orders", mockSocket);
console.log("Topics registered:", hub.activeTopicCount); // 1

hub.publish("orders", { id: 101 }); // Prints Emitted: {"id":101}

// Simulate client disconnect:
unsubscribe();
console.log("Topics after unsubscribe:", hub.activeTopicCount); // 0 (Cleaned up completely!)
```

---

## Summary

- Object lifetime is dictated by **reachability** from active roots (stack, globals, module caches), not lexical scope termination.
- V8 uses generational garbage collection: Young Generation (Scavenge for short-lived items) and Old Generation (Mark-Sweep-Compact for long-lived items).
- `Map` retains keys strongly; `WeakMap` retains keys weakly, allowing GC reclamation when external references vanish.
- Never use `FinalizationRegistry` for critical resource teardown (e.g. database connections); GC execution is inherently non-deterministic.
- The 5 primary causes of Node.js memory leaks are: unbounded module caches, dangling event listeners, shared closure context captures, abandoned timers, and buffer view slicing.
- Protect long-lived in-memory caches by implementing an explicit, bounded LRU eviction policy.

---

## Cheat Sheet

### Memory Ownership Strategies

| Type | Reference Strength | Garbage Collected When | Key Requirements | Iterable? |
| :--- | :--- | :--- | :--- | :--- |
| **`Map` / `Set`** | Strong | Explicitly deleted via `.delete()`, `.clear()`, or Map is unrooted | Any value | **Yes** |
| **`WeakMap`** | Weak (on keys) | Key object has no other strong references | Objects / Non-registered symbols | **No** |
| **`WeakSet`** | Weak (on items) | Item object has no other strong references | Objects / Non-registered symbols | **No** |
| **`WeakRef`** | Weak (on target) | Target object has no other strong references | Objects | N/A (`.deref()`) |

### Common Memory Leaks & Remediation

| Leak Vector | Mechanism | Fix |
| :--- | :--- | :--- |
| **Unbounded Cache** | `cache.set(id, data)` grows forever | Use `BoundedLRUCache` with explicit `maxSize` |
| **Event Listeners** | `emitter.on()` attached to global singleton | Always call `emitter.off()` or use `{ once: true }` |
| **Interval Timers** | `setInterval()` never cleared | Store `timerId` and invoke `clearInterval()` on teardown |
| **Large Buffer Slicing**| `hugeBuf.subarray(0, 10)` retains 50MB pool | Allocate new buffer and `copy()` bytes explicitly |
| **Dangling Closures** | Small function shares scope with large arrays | Split function scopes or assign `largeVar = null` |

---

## Interview Questions & Deep Dives

### 1. What is the fundamental difference between Lexical Scope and Object Reachability in JavaScript?

**Question:** An engineer argues: "Once a function finishes executing, all objects created inside it are immediately destroyed." Why is this statement incorrect?

**Answer:**
Lexical scope determines identifier visibility at compile time. Object reachability determines memory allocation lifetime at runtime.

When a function executes, its local variables exist within an execution context. When the function returns, its stack frame unwinds. However, objects created within that function are allocated on the **heap**, not on the call stack.

If the function returns a nested closure that references any variable from that outer scope, or if an object is passed into an external collection, event listener, or global cache, a **reference path** connects that heap object back to an active Garbage Collection Root. Because the object remains reachable from a root, the V8 garbage collector will NOT reclaim it, regardless of the fact that the creating function has finished execution.

---

### 2. How does V8's Generational Garbage Collector work, and why does it divide the heap into Young and Old generations?

**Question:** Explain the Generational Hypothesis and how V8's Scavenger algorithm differs from its Mark-Sweep-Compact algorithm.

**Answer:**
The V8 garbage collector is built upon the **Weak Generational Hypothesis**: the observation that most allocated objects die young (temporary variables, string concatenations, single-turn promises).

To optimize CPU performance, V8 divides the heap into two main zones:
1. **Young Generation (New Space):**
   - Managed by the **Scavenger** collector (Cheney's copying algorithm).
   - Memory is split into two halves: `From Space` and `To Space`.
   - During minor GC, V8 copies only *live* objects from `From Space` to `To Space`, immediately reclaiming the rest.
   - Because live objects in the young generation are few, this operation is extremely fast (sub-millisecond).
   - Objects surviving two Scavenge passes are **promoted** to the Old Generation.
2. **Old Generation (Old Space):**
   - Contains objects that survived multiple cycles.
   - Collected using the **Major Mark-Sweep-Compact** algorithm (Orinoco collector).
   - Traverses the entire heap object graph (Mark), reclaims dead object memory into free lists (Sweep), and reorganizes contiguous memory to remove fragmentation (Compact).
   - This cycle is significantly more CPU-intensive and runs concurrently and incrementally to minimize stop-the-world latency pauses.

---

### 3. Why is `WeakMap` unsuitable for building a cache that can be iterated or serialized?

**Question:** A developer proposes using `WeakMap` to store cached user records so that memory frees automatically. Why will this fail for general-purpose caching?

**Answer:**
`WeakMap` is not an observable data store; it is an object-associative storage mechanism.
1. **Keys Must Be Objects:** `WeakMap` cannot take primitive keys like user IDs, emails, or cache keys (`"user:101"`). You must have a strong reference to the exact object key in order to read the value back via `weakMap.get(key)`.
2. **Not Iterable:** `WeakMap` exposes no `.keys()`, `.values()`, `.entries()`, or `.forEach()`. You cannot inspect what items currently reside in the cache.
3. **No `.size` Property:** You cannot determine how many items are in memory.
4. **Cannot Prevent Key Destruction:** If the application loses its reference to the user key, the cache entry disappears immediately. For a cache, you typically want the *cache itself* to hold the item alive until an eviction policy (like TTL or LRU) discards it.

`WeakMap` is intended for attaching private metadata or state to objects that you already hold references to elsewhere (such as DOM nodes in browsers, or request objects in middleware).

---

### 4. Why should you never use `FinalizationRegistry` to clean up OS resources like database connections or file descriptors?

**Question:** What guarantees does the ECMAScript specification provide regarding `FinalizationRegistry` execution timing, and what production catastrophe occurs if it is used for connection pooling?

**Answer:**
The ECMAScript specification explicitly provides **zero timing guarantees** for `FinalizationRegistry` callbacks.
- The engine is under no obligation to run garbage collection at any specific interval.
- When an object becomes unreachable, the finalizer callback may execute seconds, minutes, or hours later.
- If memory pressure is low, the garbage collector might never trigger at all.
- When a Node.js process terminates, it is not required to drain finalizer queues.

**The Catastrophe:**
Operating system resources (like TCP sockets, file descriptors, and database connections) are strictly bounded by OS kernel limits (e.g. `ulimit -n` of 1024 or 4096 file descriptors). If you rely on GC to close database connections:
1. Heap memory usage remains tiny (a connection object is only a few kilobytes).
2. Because heap usage is low, V8 never triggers a major GC cycle.
3. Meanwhile, the OS runs out of available socket descriptors (`EMFILE: too many open files`), crashing the entire backend while V8 has gigabytes of free heap remaining!

Resource cleanup must always be **deterministic and explicit** using `try...finally`, dispose patterns, or explicit connection pools.

---

<nav aria-label="Lecture navigation">

[← Previous Day: Day 20 - Jobs, Microtasks, and Observable Scheduling](day-20-jobs-microtasks-and-scheduling.md) | [Roadmap](../javascript-roadmap.md) | [Next Day: Day 22 - Performance and Algorithmic Reasoning →](day-22-performance-and-algorithmic-reasoning.md)

</nav>
