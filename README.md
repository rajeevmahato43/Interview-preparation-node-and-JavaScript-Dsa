# Mid-to-Senior Node.js & JavaScript Interview Preparation

A comprehensive, curriculum-driven preparation system engineered for mid-to-senior backend engineers and full-stack JavaScript developers. This repository provides deep conceptual lectures, runtime mechanics, architectural patterns, database best practices, and data structures and algorithms (DSA) implemented natively in JavaScript.

---

## 🎯 Repository Purpose & Focus

Most interview preparation materials focus on rote memorization or surface-level API syntax. This curriculum is designed to teach the **underlying engineering fundamentals**, **causal mechanics**, and **production tradeoffs** required to excel in senior technical discussions and architectural reviews:

- **Primary Focus**: Backend engineering with Node.js runtime mastery, production scalability, and system reliability.
- **Language Depth**: ECMAScript specifications, execution contexts, V8 memory models, garbage collection, and asynchronous scheduling.
- **Data Stores**: Native database driver internals, connection pooling, transaction isolation, and query optimization for both MongoDB and PostgreSQL.
- **Problem Solving**: Algorithmic pattern recognition, time/space complexity, and practical DSA applications in backend microservices.

---

## 📚 Curriculum Tracks Overview

The workspace is organized into three progressive, day-wise learning tracks with comprehensive roadmaps and standalone lecture files:

| Track | Scope | Days | Roadmap | Lecture Directory |
| :--- | :--- | :--- | :--- | :--- |
| **Track 1: JavaScript Mastery** | Language internals, memory, event loop, prototypes, closures, and async patterns | 28 Days | [javascript-roadmap.md](Javascript/javascript-roadmap.md) | [Javascript/javascript-lectures/](Javascript/javascript-lectures/) |
| **Track 2: Node.js Backend & Architecture** | Node runtime, libuv, Express APIs, MongoDB, PostgreSQL, queues, caching, and system design | 42 Days | [node-roadmap.md](Node/node-roadmap.md) | [Node/node-lectures/](Node/node-lectures/) |
| **Track 3: Data Structures & Algorithms** | Algorithmic patterns, Big O, linear and non-linear structures, dynamic programming, and backend use cases | 60 Days | [javascript-dsa-roadmap.md](DSA/javascript-dsa-roadmap.md) | [DSA/dsa-lectures/](DSA/dsa-lectures/) |

---

## 🗺️ Detailed Track Breakdown

### 1. Pure JavaScript (28 Days)
*Focus: Deep ECMAScript language semantics and engine mechanics that power Node.js.*

- **Days 01–07: Foundations & Execution Model** — Lexical grammar, AST, execution context, hoisting, TDZ, data types, type coercion, control flow, functions, callbacks, and exception bubbling.
- **Days 08–13: Object Model & Modern Syntax** — Closures, lexical scope, `this` resolution, prototype chains, ES6 classes, property descriptors, object immutability, `Map`/`Set`, destructuring, and spread mechanics.
- **Days 14–17: Advanced Primitives & Modular JS** — Iterators, generators, `Symbol`, RegExp internal engines, Proxies, Reflection, CommonJS vs. ESM interoperability.
- **Days 18–21: Asynchronous Runtimes & Engine Memory** — Promises, microtask queues, async/await transforms, V8 heap/stack layout, mark-and-sweep GC, and memory leak analysis.
- **Days 22–28: Performance, Testing & Service Boundaries** — Algorithmic reasoning, unit testing, error boundaries, security-critical JavaScript (prototype pollution, ReDoS), and senior interview synthesis.

👉 **View full roadmap:** [Javascript/javascript-roadmap.md](Javascript/javascript-roadmap.md)  
📁 **Lectures:** [Javascript/javascript-lectures/](Javascript/javascript-lectures/)

---

### 2. Node.js Backend & System Architecture (42 Days)
*Focus: Node.js runtime mechanics, high-throughput HTTP services, data storage, and enterprise resilience.*

- **Days 01–06: Node Runtime & Core Primitives** — V8 and libuv architecture, event loop phases, module resolution, process lifecycle, OS file descriptors, stream buffers, and encoding.
- **Days 07–12: Asynchronous I/O & Process Isolation** — Event emitters, timer drift, backpressure control in streams, native HTTP server, TLS/DNS timeouts, worker threads, child processes, and cluster management.
- **Days 13–20: Production Express APIs** — Middleware execution chains, dynamic routing, parameter coercion, schema validation, centralized async error handlers, pagination standards, JWT/session auth boundaries, and OWASP security practices.
- **Days 21–26: MongoDB Through the Node Driver** — BSON serialization, pool management, CRUD operations, embedding vs. referencing, aggregation pipelines, index indexing strategies, and multi-document transactions.
- **Days 27–32: PostgreSQL & Relational Integrity** — `pg` connection pool sizing, parameterized queries, relational constraints, joins, CTEs, MVCC, index tuning, locking levels, and transaction ACID guarantees.
- **Days 33–42: Architecture, Reliability & Operations** — Layered service architecture, circuit breakers, idempotency keys, Redis caching strategies, BullMQ job queues, structured logging, distributed tracing, metrics, load testing, and senior architectural capstones.

👉 **View full roadmap:** [Node/node-roadmap.md](Node/node-roadmap.md)  
📁 **Lectures:** [Node/node-lectures/](Node/node-lectures/)

---

### 3. JavaScript Data Structures & Algorithms (60 Days)
*Focus: Pattern-based DSA mastery with native JavaScript idioms and direct backend applications.*

- **Days 01–05: Problem Solving & Complexity** — Big O time/space analysis, V8 array internals, hash collisions, call-stack recursion mechanics, and basic sorting.
- **Days 06–15: Core Two-Pointer & Windowing Patterns** — Frequency maps, hash complements (Two Sum), group anagrams, opposing two pointers, fast & slow pointers, fixed/variable sliding windows, and prefix sum arrays.
- **Days 16–25: Linear Structures & Backtracking** — Stack evaluation, monotonic stacks, circular queues, deques, backtracking trees, power sets, combinations, permutations, and grid exploration.
- **Days 26–35: Logarithmic Search & Tree Hierarchies** — Boundary binary search, search on answer spaces, linked list reversals, binary tree DFS/BFS, binary search trees (BST), and LCA algorithms.
- **Days 36–45: Graphs & Priority Queues** — Adjacency lists/matrices, BFS shortest path, cycle detection (directed/undirected), Topological Sort (Kahn's algorithm), Binary Heaps, and Priority Queue patterns.
- **Days 46–55: Dynamic Programming & Advanced Structures** — Memoization, 1D/2D tabulation (House Robber, LIS, Knapsack), greedy interval scheduling, Tries (prefix trees), and Disjoint Set Union (Union-Find).
- **Days 56–60: Production Readiness & Interview Frameworks** — Mixed-pattern recognition under time constraints, senior interview communication frameworks, and practical DSA patterns used in high-throughput backend services.

👉 **View full roadmap:** [DSA/javascript-dsa-roadmap.md](DSA/javascript-dsa-roadmap.md)  
📁 **Lectures:** [DSA/dsa-lectures/](DSA/dsa-lectures/)

---

## 📖 Lecture Structure Standard

Every lecture in this repository adheres to a strict pedagogical format defined in the workspace documentation:

1. **Title & Learning Outcomes**: Explicit technical capabilities acquired upon completion.
2. **Prerequisites**: Clear conceptual dependencies linking back to earlier lecture days.
3. **Core Concepts**: Rapid, concise refresher on fundamentals without unnecessary filler.
4. **Deep-Dive Explanations**: In-depth coverage of engine internals, edge cases, and runtime behavior.
5. **Concrete Examples & Execution Traces**: Clear, functional code demonstrating mechanics step-by-step.
6. **Common Mistakes & Traps**: Real-world anti-patterns and misunderstandings exposed in technical rounds.
7. **Tricky Points**: Detailed breakdown of language anomalies, edge cases, and race conditions.
8. **Practical Exercise**: Hands-on coding challenge with explicit acceptance criteria.
9. **Summary**: High-level synthesis of all major takeaways.
10. **Cheat Sheet**: High-density reference tables and rules for rapid pre-interview revision.
11. **Interview Questions & Follow-ups**: Senior-level situational and conceptual questions with model talking points.

---

## 🚀 How to Use This Repository

### 🎯 Recommended Study Pathways

#### Pathway A: Comprehensive Senior Backend Track (Recommended)
Follow the natural dependency order across all three tracks:
1. Complete **JavaScript Days 01–21** (Language & Async mechanics).
2. Complete **Node.js Days 01–20** (Runtime, Streams, and HTTP).
3. Concurrently work through **DSA Days 01–30** (Core algorithmic patterns).
4. Advance through **Node.js Days 21–32** (Databases: MongoDB & PostgreSQL).
5. Advance through **DSA Days 31–60** (Trees, Graphs, and Dynamic Programming).
6. Complete **Node.js Days 33–42** and **JavaScript Days 22–28** (Architecture, Reliability & Security).

#### Pathway B: Pre-Interview Sprint (Revision Focus)
- Review the **Cheat Sheet** and **Tricky Points** sections in each lecture file.
- Practice answering the **Interview Questions** aloud before reading the model answers.
- Review Days 57–60 of the DSA curriculum for live coding strategy and pattern identification.

---

## 📂 Repository Structure

```text
├── AGENTS.md                  # Workspace-wide instruction and operational boundaries
├── README.md                  # Root documentation (this file)
├── DOCS/                      # Canonical content and interview formatting standards
│   ├── README.md              # Documentation index and usage guide
│   ├── content-rules.md       # Lecture structure and pedagogical rules
│   ├── interview-rules.md     # Question-and-answer quality standards
│   ├── example-rules.md       # Code quality, security, and testability rules
│   ├── accuracy-rules.md      # Reference fidelity and compatibility guidelines
│   └── ...                    # Domain-specific guideline files (node, dsa, js, etc.)
├── Javascript/
│   ├── javascript-roadmap.md  # 28-Day pure JavaScript roadmap
│   └── javascript-lectures/   # Day 01 to Day 28 Markdown lectures
├── Node/
│   ├── node-roadmap.md        # 42-Day Node.js backend roadmap
│   └── node-lectures/         # Day 01 to Day 42 Markdown lectures
└── DSA/
    ├── javascript-dsa-roadmap.md # 60-Day JavaScript DSA roadmap
    └── dsa-lectures/          # Day 01 to Day 60 Markdown lectures
```

---

## 📜 Standards & Content Guidelines

This workspace is maintained under strict content, example, and architectural guidelines:
- [Workspace Boundaries & Agent Guidelines](AGENTS.md)
- [Instruction System Index](DOCS/README.md)
- [Content Architecture & Lecture Standards](DOCS/content-rules.md)
- [Interview Question & Tradeoff Rules](DOCS/interview-rules.md)
- [Code Example & Security Rules](DOCS/example-rules.md)
- [Technical Accuracy & Versioning Rules](DOCS/accuracy-rules.md)
