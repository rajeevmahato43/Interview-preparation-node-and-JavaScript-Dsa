# Day 28: Parameterized SQL CRUD

<nav aria-label="Lecture navigation">

[Previous: PostgreSQL and `pg` Pool Lifecycle](day-27-postgresql-and-pg-pool-lifecycle.md) | [Roadmap](../node-roadmap.md) | [Next: Relational Correctness for APIs](day-29-relational-correctness-for-apis.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Distinguish the PostgreSQL Extended Query Protocol (`Parse`, `Bind`, `Execute`) from Simple Query string interpolation to permanently eliminate SQL injection vulnerabilities.
- Architect high-throughput CRUD repositories in Node.js using parameterized placeholders (`$1, $2, ...`) and dynamic query building without sacrificing safety.
- Leverage `RETURNING` clauses on `INSERT`, `UPDATE`, and `DELETE` operations to eliminate redundant roundtrips and avoid read-after-write race conditions.
- Configure `node-postgres` type parsers (`pg.types`) to handle `BIGINT` (INT8) string serialization, `TIMESTAMPTZ`, JSONB, and PostgreSQL native array conversions safely within JavaScript's IEEE 754 number limits.
- Handle multi-row batch inserts via parameterized multi-row `VALUES` and the relational `UNNEST($1::type[])` pattern.
- Implement atomic UPSERT operations using `ON CONFLICT (key) DO UPDATE` / `DO NOTHING` to prevent concurrent insert race conditions.
- Translate PostgreSQL error codes (`23505`, `23503`, `23502`, `23514`) into domain-driven HTTP responses (`409 Conflict`, `400 Bad Request`, `404 Not Found`).

---

## Prerequisites

- [Day 27: PostgreSQL and `pg` Pool Lifecycle](day-27-postgresql-and-pg-pool-lifecycle.md) — Connection pools, checkouts, idle timeouts, and client lifecycle management.
- [Day 16: Express Input Parsing, Validation, and Serialization](day-16-express-input-validation-and-serialization.md) — Request validation schemas, sanitization, and data projection boundaries.
- [Day 17: Async Express and Centralized Errors](day-17-async-express-and-centralized-errors.md) — Operational exception mapping and RFC 7807 problem details.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Production Impact |
|---|---|---|
| **Extended Query Protocol** | A PostgreSQL wire protocol dividing query execution into `Parse`, `Bind`, `Describe`, and `Execute` message phases. | Separates query AST compilation from untrusted scalar inputs, rendering SQL injection structurally impossible. |
| **Parameterized Placeholder (`$n`)** | Positional variable placeholders (`$1`, `$2`, ...) in PostgreSQL statements referencing indexed values in an execution array. | Instructs PostgreSQL to treat values purely as typed literal data rather than executable SQL grammar tokens. |
| **`RETURNING` Clause** | SQL syntax instructing the database engine to project modified rows directly in the DML operation's response envelope. | Eliminates read-after-write query roundtrips, prevents concurrency anomalies, and retrieves database-computed defaults atomically. |
| **SQLSTATE Code** | A standardized 5-character alphanumeric error classification emitted by PostgreSQL (e.g., `23505` for Unique Violation). | Allows reliable programmatic classification of schema rule violations without brittle string pattern matching on error messages. |
| **`pg.types` OID Parser** | The type deserialization registry in `node-postgres` mapping PostgreSQL type Object Identifiers (OIDs) to JavaScript transformers. | Controls automatic JSON decoding, Date parsing, and safeguards 64-bit integer (`INT8`) conversions from floating-point rounding errors. |
| **`UNNEST` Array Pattern** | A PostgreSQL set-returning function expanding array parameters into relational table rows: `UNNEST($1::uuid[], $2::text[])`. | Enables bulk batch insertions with a constant number of bind parameters, preventing statement text bloat and parameter count limit overflow. |

---

## Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           POSTGRESQL EXTENDED QUERY PROTOCOL WIRE FLOW                      │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Node.js (node-postgres)                                              PostgreSQL Server
         │                                                                     │
         │  1. Parse Message ("SELECT * FROM users WHERE email = $1")          │
         │────────────────────────────────────────────────────────────────────>│ Parses SQL grammar;
         │                                                                     │ generates query AST plan
         │  2. Bind Message (portal, stmt, values: ["alice@domain.com"])       │
         │────────────────────────────────────────────────────────────────────>│ Injects typed values
         │                                                                     │ into AST parameters
         │  3. Describe Message (portal)                                       │ (values NEVER touch AST parser)
         │────────────────────────────────────────────────────────────────────>│ Returns row description
         │                                                                     │ metadata (column types)
         │  4. Execute Message (portal, maxRows: 0)                            │
         │────────────────────────────────────────────────────────────────────>│ Executes execution plan;
         │                                                                     │ fetches matching tuples
         │  5. DataRow Messages + CommandComplete                              │
         │<────────────────────────────────────────────────────────────────────│ Returns raw byte arrays;
         │                                                                     │ ReadyForQuery emitted
         ▼                                                                     ▼
```

### 1. Parameterized Queries and the Extended Query Protocol

A parameterized query is a database interaction pattern where SQL statement templates containing positional placeholders (`$1`, `$2`) are transmitted separately from user-provided input values over the network protocol. 

When you invoke `pool.query(text, params)`, the `node-postgres` driver utilizes the PostgreSQL **Extended Query Protocol**. This protocol guarantees that untrusted user data is never parsed as SQL command grammar:

1. **Parse Phase:** The database compiles the SQL string into an execution plan. Parameter placeholders are recognized as typed parameters, not executable tokens.
2. **Bind Phase:** The database binds the array of literal values to the parameter slots in the compiled execution plan.
3. **Execute Phase:** The database executes the bound plan and streams the resulting tuples back to the client.

Concatenating input strings directly into SQL strings exposes your backend to catastrophic SQL injection (SQLi). Attackers break out of the string boundary using quotes (`'`), injecting arbitrary SQL clauses (`OR 1=1`, `DROP TABLE`, `UNION SELECT`) directly into the AST parser.

| Dimension | Simple Query Protocol (String Concatenation) | Extended Query Protocol (Parameterized `$n`) |
|---|---|---|
| **Wire Execution** | Sends a single monolithic query string `Q` to server | Sends distinct `Parse`, `Bind`, `Describe`, and `Execute` protocol messages |
| **AST Construction** | SQL AST is constructed *after* raw user input is interpolated | SQL AST is constructed *before* input values are bound |
| **SQLi Protection** | Zero protection without manual, error-prone escaping | Structural protection; values cannot alter query syntax |
| **Plan Reusability** | Unique text per query; prevents query plan cache hits | Identical text structure; allows prepared statement plan caching |
| **Data Types** | Everything is passed as literal text syntax | Supports typed parameter transmission and explicit type casting |

```javascript
// Node.js code
// anti-pattern: Raw string interpolation (CATASTROPHIC SQL INJECTION HAZARD)
export async function unsafeFindUserByEmail(pool, untrustedEmail) {
  // ❌ If untrustedEmail is: "admin@corp.com' OR '1'='1"
  // Query executed: SELECT * FROM users WHERE email = 'admin@corp.com' OR '1'='1'
  // Result: Returns all users, bypassing authentication and data boundaries!
  const query = `SELECT id, email, role FROM users WHERE email = '${untrustedEmail}'`;
  const result = await pool.query(query);
  return result.rows;
}

// pattern: Parameterized query via positional placeholders
export async function safeFindUserByEmail(pool, untrustedEmail) {
  // ✅ The SQL template and array of parameters are separated.
  // The PostgreSQL wire protocol treats untrustedEmail strictly as literal text data.
  const query = `
    SELECT id, email, role, created_at
    FROM users
    WHERE email = $1
    LIMIT 1;
  `;
  const result = await pool.query(query, [untrustedEmail]);
  return result.rows[0] ?? null;
}
```

---

### 2. DML Operations and the `RETURNING` Clause

The `RETURNING` clause is a PostgreSQL SQL extension that directs `INSERT`, `UPDATE`, and `DELETE` commands to immediately output the columns of modified tuples in the command's result stream.

In traditional SQL engines without `RETURNING` (or legacy MySQL patterns using `LAST_INSERT_ID()`), retrieving newly generated primary keys, timestamps, or triggered defaults requires issuing an immediate secondary `SELECT` statement. This anti-pattern introduces severe issues:
1. **Network Latency:** Doubled round-trips over the database socket for every write operation.
2. **Read-After-Write Race Conditions:** In concurrent multi-process environments, querying `WHERE email = $1` immediately after an insert can return a row modified by a concurrent worker, or fail if a concurrent process deleted or mutated the row.
3. **Database Defaults:** Database-generated columns (`id BIGSERIAL`, `uuid_generate_v4()`, `created_at TIMESTAMPTZ DEFAULT NOW()`, generated columns) must be calculated on the server and returned atomically.

```javascript
// Node.js code
// pattern: Atomic insertion with RETURNING clause
export async function createUser(pool, { email, role, displayName }) {
  const query = `
    INSERT INTO users (email, role, display_name, created_at, updated_at)
    VALUES ($1, $2, $3, NOW(), NOW())
    RETURNING id, email, role, display_name, created_at, updated_at;
  `;
  
  // Single roundtrip: Inserts row, evaluates defaults, and projects result
  const { rows } = await pool.query(query, [email, role, displayName]);
  return rows[0];
}

// pattern: Atomic update with RETURNING clause and concurrency check
export async function updateUserRole(pool, userId, newRole) {
  const query = `
    UPDATE users
    SET role = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, email, role, updated_at;
  `;

  const { rows, rowCount } = await pool.query(query, [newRole, userId]);

  // rowCount === 0 indicates the filter matched no active tuples
  if (rowCount === 0) {
    return null; // Signals 404 Not Found upstream
  }

  return rows[0];
}
```

---

### 3. PostgreSQL Type System and `node-postgres` Type Deserialization

Type deserialization is the automated process whereby `node-postgres` translates raw PostgreSQL binary or text wire protocol values into native JavaScript primitive and object types based on the column's Object Identifier (OID).

PostgreSQL features a sophisticated type system whose numeric ranges and data formats do not map 1:1 to JavaScript primitives:

1. **`BIGINT` / `INT8` (OID 20):** JavaScript's native `Number` type is represented as a 64-bit IEEE 754 double-precision floating-point number. Its safe integer range is strictly bounded by `Number.MAX_SAFE_INTEGER` ($2^{53} - 1 = 9,007,199,254,740,991$). A PostgreSQL `BIGINT` is a signed 64-bit integer supporting values up to $2^{63} - 1$ ($9,223,372,036,854,775,807$). If `node-postgres` parsed `BIGINT` directly into a JavaScript `Number`, large primary keys would suffer silent precision loss and corruption. By default, **`node-postgres` returns `BIGINT` columns as JavaScript `String` primitives**.
2. **`TIMESTAMPTZ` (OID 1184):** Automatically deserialized into JavaScript `Date` instances. The driver uses ISO-8601 string conversions to preserve millisecond resolution.
3. **`JSON` / `JSONB` (OID 114, 3802):** Automatically deserialized via `JSON.parse` into JavaScript objects and arrays. When writing JSONB, pass JavaScript objects directly into the parameter array; `pg` automatically invokes `JSON.stringify()`.
4. **PostgreSQL Arrays (`TEXT[]`, `INT[]`):** Automatically parsed into native JavaScript arrays by the driver's built-in array parser.

```javascript
// Node.js code
import pg from 'pg';

// Global Type Parser Configuration
// WARNING: Only parse BIGINT to Number if your domain guarantees values < 2^53 - 1
const BIGINT_OID = 20;

// Default behavior: BIGINT is returned as String (Safe for all 64-bit IDs)
// If you want native JavaScript BigInt primitives:
pg.types.setTypeParser(BIGINT_OID, (val) => {
  return val === null ? null : BigInt(val);
});

// Handling JSONB writes and reads
export async function updateUserSettings(pool, userId, settingsObject) {
  const query = `
    UPDATE users
    SET metadata = $1::jsonb, updated_at = NOW()
    WHERE id = $2
    RETURNING id, metadata;
  `;

  // pg serializes settingsObject to JSON string automatically
  const { rows } = await pool.query(query, [settingsObject, userId]);
  
  // rows[0].metadata is automatically parsed into a JavaScript Object
  return rows[0];
}
```

---

### 4. Relational Batch Inserts: Tuples vs `UNNEST`

A batch insert is an optimized write pattern that commits multiple rows to a database table within a single SQL statement execution, amortizing transaction overhead and socket round-trips.

When inserting hundreds or thousands of rows from Node.js, issuing individual `INSERT` statements inside a `for` loop consumes massive connection resources and degrades throughput. Node.js applications have two primary batch patterns:

| Batch Strategy | Parameter Count Scaling | Query String Size | Best Use Case |
|---|---|---|---|
| **Multi-row Tuple Expansion**<br>`VALUES ($1,$2), ($3,$4)...` | $N \times M$ parameters (e.g., 500 rows $\times$ 5 columns = 2,500 params) | Expands dynamically; risk of hitting PostgreSQL 65,535 parameter limit | Small batches ($< 100$ rows) with simple schemas |
| **`UNNEST` Set-Returning Function**<br>`FROM UNNEST($1::type[], $2::type[])` | Constant $M$ parameters (e.g., 5 columns = 5 array parameters) | Constant, compact SQL string; zero string manipulation overhead | Medium to large batches ($100$ to $10,000+$ rows) |

```javascript
// Node.js code
// pattern: High-performance batch insert using UNNEST
export async function batchInsertEvents(pool, events) {
  if (events.length === 0) return [];

  // Transpose array of objects into typed column arrays
  const userIds = [];
  const eventTypes = [];
  const payloads = [];
  const timestamps = [];

  for (const event of events) {
    userIds.push(event.userId);
    eventTypes.push(event.type);
    payloads.push(JSON.stringify(event.payload)); // Cast to jsonb[]
    timestamps.push(event.timestamp);
  }

  // UNNEST unpacks parallel arrays into a virtual relation of rows
  const query = `
    INSERT INTO audit_logs (user_id, event_type, payload, created_at)
    SELECT
      u.user_id,
      u.event_type,
      u.payload::jsonb,
      u.created_at
    FROM UNNEST(
      $1::uuid[],
      $2::text[],
      $3::text[],
      $4::timestamptz[]
    ) AS u(user_id, event_type, payload, created_at)
    RETURNING id, user_id, event_type, created_at;
  `;

  const { rows } = await pool.query(query, [
    userIds,
    eventTypes,
    payloads,
    timestamps
  ]);

  return rows;
}
```

---

### 5. Atomic Upsert Semantics: `ON CONFLICT`

An UPSERT (Update or Insert) is an atomic SQL operation that attempts to insert a row into a table, and upon encountering a unique constraint violation on specified target columns, gracefully pivots to performing an `UPDATE` on existing data or executing `DO NOTHING`.

In concurrent Node.js web applications, executing a `SELECT` followed by conditional `INSERT` or `UPDATE` is flawed due to the **Check-Then-Act Race Condition (Time-of-Check to Time-of-Use)**. Two parallel requests checking the same unique identifier both observe that the row does not exist, and both issue an `INSERT`. The second insert crashes with a unique violation (`23505`).

PostgreSQL's `ON CONFLICT` clause resolves this race condition inside the database engine's B-Tree index lock:

```javascript
// Node.js code
// pattern: Atomic UPSERT with ON CONFLICT DO UPDATE
export async function upsertUserSession(pool, { userId, sessionToken, ipAddress, userAgent }) {
  const query = `
    INSERT INTO active_sessions (user_id, session_token, ip_address, user_agent, last_active_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET session_token = EXCLUDED.session_token,
          ip_address    = EXCLUDED.ip_address,
          user_agent    = EXCLUDED.user_agent,
          last_active_at = NOW()
    RETURNING id, user_id, session_token, last_active_at;
  `;

  // EXCLUDED is a special virtual table representing the row proposed for insertion
  const { rows } = await pool.query(query, [userId, sessionToken, ipAddress, userAgent]);
  return rows[0];
}

// pattern: Idempotent INSERT with ON CONFLICT DO NOTHING
export async function ensureTagExists(pool, tagName) {
  const query = `
    INSERT INTO tags (name, created_at)
    VALUES ($1, NOW())
    ON CONFLICT (name) DO NOTHING
    RETURNING id, name;
  `;

  const { rows, rowCount } = await pool.query(query, [tagName]);

  if (rowCount === 0) {
    // Row already existed; fetch existing tag ID safely
    const existing = await pool.query(`SELECT id, name FROM tags WHERE name = $1`, [tagName]);
    return existing.rows[0];
  }

  return rows[0];
}
```

---

## Detailed Explanations and Traces

### Extended Query Protocol Lifecycle Trace

Let us trace what occurs across the network socket when a Node.js process executes a parameterized query using `pool.query`:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           EXTENDED QUERY PROTOCOL NETWORK TRACE                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

 Step 1: node-postgres acquires a client from the pool socket buffer.
 Step 2: Driver sends frontend Parse message:
         - Statement name: "" (unnamed prepared statement)
         - SQL string: "SELECT id, email FROM users WHERE org_id = $1 AND role = $2"
         - Parameter types: [0, 0] (unspecified, inferred by PostgreSQL)
 Step 3: Driver sends frontend Bind message:
         - Portal name: ""
         - Statement name: ""
         - Parameter values: ['48a1...uuid', 'ADMIN']
 Step 4: Driver sends Describe message:
         - Type: 'P' (Portal)
 Step 5: Driver sends Execute message:
         - Portal name: ""
         - Max rows: 0 (fetch all matching tuples)
 Step 6: Driver sends Sync message:
         - Directs server to close the current transaction boundary and return ReadyForQuery.
 Step 7: PostgreSQL processes the pipeline in memory:
         - Generates Query Plan -> Binds parameter memory pointers -> Scans Index -> Produces Tuples.
 Step 8: PostgreSQL replies with backend messages:
         - ParseComplete ('1')
         - BindComplete ('2')
         - RowDescription ('T') -> Array of field metadata (OIDs, column names, column lengths)
         - DataRow ('D') -> Stream of tuple byte buffers
         - CommandComplete ('C') -> "SELECT 1"
         - ReadyForQuery ('Z') -> Backend returns to idle state.
 Step 9: node-postgres fires registered OID parsers on each DataRow field buffer.
 Step 10: JavaScript Promise resolves with Result object: { rows: [...], rowCount: 1, fields: [...] }.
```

Because the SQL syntax is parsed and compiled into an abstract syntax tree during Step 2 *before* the parameter values are ever inspected in Step 3, raw user values can never inject syntax commands into the query. Even if a user enters `' OR 1=1; DROP TABLE users; --`, the database engine simply searches for an `org_id` whose literal string value equals that exact malicious text.

---

### Dynamic SQL Query Composition Without SQL Injection

Production search endpoints frequently require dynamic filters where users provide optional search parameters (`email`, `status`, `minAge`, `createdAfter`). 

Developers frequently make two dangerous mistakes when constructing dynamic SQL:
1. Interpolating filter values directly with template literals (`WHERE status = '${status}'`).
2. Hardcoding parameter indices (`$1, $2`), which breaks when filters are conditionally omitted.

The safe pattern uses a dynamic query builder array that maintains synchronization between SQL clause placeholders and the parameter index array.

```javascript
// Node.js code
// pattern: Secure dynamic query composition with parameterized placeholders
export async function searchUsers(pool, filters = {}) {
  const clauses = [];
  const values = [];

  // Index pointer incremented dynamically
  if (filters.email) {
    values.push(`%${filters.email.toLowerCase()}%`);
    clauses.push(`email ILIKE $${values.length}`);
  }

  if (filters.role) {
    values.push(filters.role);
    clauses.push(`role = $${values.length}`);
  }

  if (filters.isActive !== undefined) {
    values.push(Boolean(filters.isActive));
    clauses.push(`is_active = $${values.length}`);
  }

  if (filters.createdAfter) {
    values.push(filters.createdAfter);
    clauses.push(`created_at >= $${values.length}`);
  }

  // Construct WHERE clause safely
  const whereSql = clauses.length > 0 
    ? `WHERE ${clauses.join(' AND ')}` 
    : '';

  // Safe pagination
  const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);
  const offset = Math.max(Number(filters.offset) || 0, 0);

  values.push(limit);
  const limitIndex = values.length;

  values.push(offset);
  const offsetIndex = values.length;

  const sql = `
    SELECT id, email, role, is_active, created_at
    FROM users
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT $${limitIndex} OFFSET $${offsetIndex};
  `;

  const { rows } = await pool.query(sql, values);
  return rows;
}
```

---

### Dynamic Identifiers: Tables, Columns, and Sorting Safety

Parameter placeholders (`$1, $2`) **can only be used for literal data values**. You cannot use parameter placeholders for SQL identifiers such as table names, column names, or sort directions (`ASC` / `DESC`):

```sql
-- ❌ SYNTAX ERROR IN POSTGRESQL:
SELECT * FROM users ORDER BY $1 $2;
```

When an API endpoint allows dynamic sorting (e.g., `GET /users?sortBy=created_at&order=desc`), developers often fall back to raw string interpolation, reintroducing SQL injection.

To safely parameterize dynamic identifiers:
1. **Whitelist Validation:** Match requested identifiers against an explicit allowlist set.
2. **Identifier Escaping:** Use `pg-format` or PostgreSQL's built-in identifier quoting (`format('%I', column)`).

```javascript
// Node.js code
const ALLOWED_SORT_COLUMNS = new Map([
  ['createdAt', 'created_at'],
  ['email', 'email'],
  ['displayName', 'display_name']
]);

const ALLOWED_DIRECTIONS = new Set(['ASC', 'DESC']);

export async function getUsersSorted(pool, { sortBy = 'createdAt', direction = 'DESC' }) {
  // 1. Validate sort column against allowlist
  const dbColumn = ALLOWED_SORT_COLUMNS.get(sortBy);
  if (!dbColumn) {
    throw new Error(`Invalid sort column: '${sortBy}'. Allowed: ${Array.from(ALLOWED_SORT_COLUMNS.keys()).join(', ')}`);
  }

  // 2. Validate sort direction against strict whitelist
  const normalizedDir = direction.toUpperCase();
  if (!ALLOWED_DIRECTIONS.has(normalizedDir)) {
    throw new Error(`Invalid sort direction: '${direction}'. Allowed: ASC, DESC`);
  }

  // 3. Verified identifier is safely injected into SQL template
  const query = `
    SELECT id, email, display_name, created_at
    FROM users
    ORDER BY ${dbColumn} ${normalizedDir}
    LIMIT 50;
  `;

  const { rows } = await pool.query(query);
  return rows;
}
```

---

### PostgreSQL Constraint Violation Error Code Mapping

When relational constraints (primary keys, foreign keys, uniqueness, check rules) are violated, PostgreSQL aborts the operation and emits an error object containing a standardized 5-character `code` property (`SQLSTATE`).

Production repositories must never allow raw SQLSTATE errors to crash the request handler or leak raw schema metadata to client applications. Instead, catch and inspect the error code to project domain-specific exceptions:

```javascript
// Node.js code
export class ConflictError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ConflictError';
    this.status = 409;
    this.details = details;
  }
}

export class ForeignKeyViolationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ForeignKeyViolationError';
    this.status = 400;
    this.details = details;
  }
}

export async function createOrganizationMembership(pool, { orgId, userId, role }) {
  const query = `
    INSERT INTO organization_memberships (org_id, user_id, role, created_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING id, org_id, user_id, role, created_at;
  `;

  try {
    const { rows } = await pool.query(query, [orgId, userId, role]);
    return rows[0];
  } catch (error) {
    // SQLSTATE 23505: unique_violation
    if (error.code === '23505') {
      if (error.constraint === 'organization_memberships_org_id_user_id_key') {
        throw new ConflictError('User is already a member of this organization', {
          constraint: error.constraint,
          orgId,
          userId
        });
      }
      throw new ConflictError('Unique constraint violation', { constraint: error.constraint });
    }

    // SQLSTATE 23503: foreign_key_violation
    if (error.code === '23503') {
      if (error.constraint === 'organization_memberships_org_id_fkey') {
        throw new ForeignKeyViolationError('Target organization does not exist', { orgId });
      }
      if (error.constraint === 'organization_memberships_user_id_fkey') {
        throw new ForeignKeyViolationError('Target user does not exist', { userId });
      }
      throw new ForeignKeyViolationError('Referenced foreign entity does not exist');
    }

    // SQLSTATE 23514: check_violation
    if (error.code === '23514') {
      throw new Error(`Data validation failed constraint check: ${error.constraint}`);
    }

    // Unhandled database error: bubble to centralized error middleware
    throw error;
  }
}
```

---

## Common Mistakes and Interview Traps

### 1. The `IN ($1)` Placeholder Trap

A ubiquitous bug occurs when developers attempt to pass a JavaScript array into a single `$1` placeholder inside a SQL `IN (...)` clause:

```javascript
// Node.js code
// ❌ WRONG: Passing array to single placeholder in standard IN clause
const ids = ['uuid-1', 'uuid-2', 'uuid-3'];
// PostgreSQL interprets this as: WHERE id IN ('{"uuid-1","uuid-2","uuid-3"}')
// Throws: error: operator does not exist: uuid = uuid[]
await pool.query('SELECT * FROM users WHERE id IN ($1)', [ids]);

// ✅ CORRECT PATTERN 1: Using ANY($1) with typed array
// PostgreSQL natively understands: WHERE id = ANY(array_value)
const result = await pool.query(
  'SELECT id, email FROM users WHERE id = ANY($1::uuid[])',
  [ids]
);

// ✅ CORRECT PATTERN 2: Dynamic placeholder generation for standard IN clause
const placeholders = ids.map((_, i) => `$${i + 1}`).join(', '); // "$1, $2, $3"
const result2 = await pool.query(
  `SELECT id, email FROM users WHERE id IN (${placeholders})`,
  ids
);
```

### 2. Confusing `result.rowCount === 0` with a Database Error

When executing an `UPDATE` or `DELETE` statement, matching zero rows is **not a database exception**. PostgreSQL executes the command successfully and returns `rowCount: 0`.

If your repository does not inspect `result.rowCount`, an update to a non-existent entity will return `undefined` rows, causing your HTTP layer to either send an empty `200 OK` or crash when reading `rows[0].id`. Always check `rowCount === 0` to return `null` or throw a `NotFoundError`.

---

## Tricky Points and Edge Cases

### 1. `NULL` vs JavaScript `undefined` in Query Parameters

`node-postgres` treats JavaScript `null` and `undefined` differently in query parameter arrays:
- `null` is converted to SQL `NULL`.
- In older `node-postgres` versions, passing `undefined` threw an uncaught error: `TypeError: Cannot read properties of undefined` or `Bind message supplies 1 parameters, but prepared statement "" requires 2`. In modern versions, passing `undefined` is automatically coerced to `null`.
- However, if you rely on a database column's `DEFAULT` value (e.g., `status VARCHAR DEFAULT 'PENDING'`), passing `null` or `undefined` in an `INSERT INTO orders (status) VALUES ($1)` **overwrites the default with `NULL`**! If the column has a `NOT NULL` constraint, the insert crashes with error `23502`. To use database defaults, omit the column entirely or use the `DEFAULT` keyword in SQL.

### 2. IEEE 754 Floating-Point Loss on 64-Bit Primary Keys

If your PostgreSQL database uses `BIGINT` (`INT8`) for high-scale primary keys, remember:
```javascript
// Node.js code
const maxSafe = Number.MAX_SAFE_INTEGER; // 9007199254740991
const pgBigInt = '9007199254740993'; // Exceeds Number.MAX_SAFE_INTEGER by 2

console.log(Number(pgBigInt)); 
// Output: 9007199254740992 -> SILENT CORRUPTION!
```
Never override `pg.types.setTypeParser(20, Number)`. Retain `BIGINT` values as strings or use native JavaScript `BigInt` primitives (`9007199254740993n`). When serializing `BigInt` to JSON in Express responses, implement a custom `toJSON()` serializer because `JSON.stringify` throws `TypeError: Do not know how to serialize a BigInt`.

---

## Hands-On Exercise: Building a Safe, Multi-Tenant Order Repository

### Scenario

You are modernizing an e-commerce order management system. The legacy repository contains severe vulnerabilities:
1. Dynamic SQL is built via raw template literal interpolation, exposing customer order histories to SQL injection.
2. The `updateOrderStatus` method does not use `RETURNING` or check `rowCount`, resulting in silent update failures and returning stale data.
3. The batch line-item insertion executes individual inserts sequentially inside a `for...of` loop within an open transaction, exhausting pool clients under traffic spikes.
4. Concurrency conflicts on invoice generation cause duplicate invoice creation due to missing atomic UPSERT logic.

### Buggy Code

```javascript
// Node.js code
export class BuggyOrderRepository {
  constructor(pool) {
    this.pool = pool;
  }

  // BUG 1: Blatant SQL injection via string interpolation
  async findOrdersByCustomer(orgId, customerEmail, status) {
    let sql = `SELECT * FROM orders WHERE org_id = '${orgId}' AND customer_email = '${customerEmail}'`;
    if (status) {
      sql += ` AND status = '${status}'`;
    }
    const result = await this.pool.query(sql);
    return result.rows;
  }

  // BUG 2: Stale data return, missing rowCount check, race condition
  async updateOrderStatus(orderId, newStatus) {
    await this.pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`,
      [newStatus, orderId]
    );
    // Extra query roundtrip! Subject to read-after-write race conditions
    const updated = await this.pool.query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
    return updated.rows[0]; // Returns undefined or stale row if concurrent deletion occurred
  }

  // BUG 3: N-Roundtrips sequential batch insert exhausting connections
  async addLineItems(orderId, items) {
    const createdItems = [];
    for (const item of items) {
      const res = await this.pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [orderId, item.productId, item.quantity, item.unitPrice]
      );
      createdItems.push(res.rows[0]);
    }
    return createdItems;
  }
}
```

### Acceptance Criteria

1. Eliminate all SQL injection vulnerabilities by using parameterized queries and structured dynamic WHERE clause generation.
2. Implement atomic `UPDATE ... RETURNING *` in `updateOrderStatus` and return `null` if `rowCount === 0`.
3. Refactor `addLineItems` to use a single round-trip batch insert using PostgreSQL's `UNNEST` pattern.
4. Add an `upsertInvoice` method using `ON CONFLICT (order_id) DO UPDATE` to guarantee idempotent invoice generation.
5. Translate PostgreSQL error code `23505` to a custom `DuplicateRecordError` with detailed constraint context.

### Solution Code

```javascript
// Node.js code
export class DuplicateRecordError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'DuplicateRecordError';
    this.status = 409;
    this.details = details;
  }
}

export class SecureOrderRepository {
  /**
   * @param {import('pg').Pool} pool
   */
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Safe dynamic search using parameter array indexing
   */
  async findOrdersByCustomer(orgId, customerEmail, status = null) {
    const clauses = ['org_id = $1', 'customer_email = $2'];
    const values = [orgId, customerEmail];

    if (status) {
      values.push(status);
      clauses.push(`status = $${values.length}`);
    }

    const query = `
      SELECT id, org_id, customer_email, status, total_amount, created_at, updated_at
      FROM orders
      WHERE ${clauses.join(' AND ')}
      ORDER BY created_at DESC;
    `;

    const { rows } = await this.pool.query(query, values);
    return rows;
  }

  /**
   * Atomic update with RETURNING and not-found verification
   */
  async updateOrderStatus(orderId, orgId, newStatus) {
    const query = `
      UPDATE orders
      SET status = $1,
          updated_at = NOW()
      WHERE id = $2 AND org_id = $3
      RETURNING id, org_id, status, total_amount, updated_at;
    `;

    const { rows, rowCount } = await this.pool.query(query, [newStatus, orderId, orgId]);

    if (rowCount === 0) {
      return null; // Indicates entity does not exist or org_id boundary mismatch
    }

    return rows[0];
  }

  /**
   * High-throughput batch insertion via UNNEST array expansion
   */
  async addLineItems(orderId, items) {
    if (!items || items.length === 0) {
      return [];
    }

    const productIds = [];
    const quantities = [];
    const unitPrices = [];

    for (const item of items) {
      productIds.push(item.productId);
      quantities.push(item.quantity);
      unitPrices.push(item.unitPrice);
    }

    const query = `
      INSERT INTO order_items (order_id, product_id, quantity, unit_price, created_at)
      SELECT
        $1::uuid,
        u.product_id,
        u.quantity,
        u.unit_price,
        NOW()
      FROM UNNEST(
        $2::uuid[],
        $3::integer[],
        $4::numeric[]
      ) AS u(product_id, quantity, unit_price)
      RETURNING id, order_id, product_id, quantity, unit_price, created_at;
    `;

    const { rows } = await this.pool.query(query, [
      orderId,
      productIds,
      quantities,
      unitPrices
    ]);

    return rows;
  }

  /**
   * Atomic UPSERT for idempotent invoice generation
   */
  async upsertInvoice(orderId, invoiceNumber, amountDue, dueDate) {
    const query = `
      INSERT INTO order_invoices (order_id, invoice_number, amount_due, due_date, status, updated_at)
      VALUES ($1, $2, $3, $4, 'ISSUED', NOW())
      ON CONFLICT (order_id) DO UPDATE
        SET amount_due  = EXCLUDED.amount_due,
            due_date    = EXCLUDED.due_date,
            updated_at  = NOW()
      RETURNING id, order_id, invoice_number, amount_due, due_date, status, updated_at;
    `;

    try {
      const { rows } = await this.pool.query(query, [orderId, invoiceNumber, amountDue, dueDate]);
      return rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new DuplicateRecordError('Invoice number conflict', {
          constraint: error.constraint,
          invoiceNumber
        });
      }
      throw error;
    }
  }
}
```

### Solution Explanation

1. **Structured Dynamic Filtering:** In `findOrdersByCustomer`, dynamic parameters build the `clauses` array while pushing values into the `values` array. Every condition uses positional placeholders `$1`, `$2`, `$3` mapped precisely to the length of the parameters array, preventing SQL injection while accommodating optional filters.
2. **Atomic Single-Roundtrip Mutation:** In `updateOrderStatus`, the query combines the mutation and projection into a single step using `RETURNING`. Checking `rowCount === 0` immediately detects whether the record was missing or owned by another tenant, returning `null` safely without issuing an extra query.
3. **Array Transposition and `UNNEST`:** The `addLineItems` method converts the array of objects into three parallel typed arrays (`uuid[]`, `integer[]`, `numeric[]`) and executes a single `INSERT ... SELECT FROM UNNEST(...)` statement. This reduces network roundtrips from $N$ to exactly 1, completely preventing connection pool starvation during large cart checkouts.
4. **Idempotent Invoicing with `ON CONFLICT`:** The `upsertInvoice` method uses `ON CONFLICT (order_id) DO UPDATE` to atomically handle duplicate calls. If an invoice already exists for the given `order_id`, it updates the amounts using the virtual `EXCLUDED` table rather than failing. Any collision on another unique constraint (such as a duplicate `invoice_number`) triggers SQLSTATE `23505`, which is cleanly captured and mapped to a domain-level `DuplicateRecordError`.

---

## Summary

- The PostgreSQL **Extended Query Protocol** divides query execution into `Parse`, `Bind`, `Describe`, and `Execute` phases, structurally isolating untrusted input from the SQL grammar parser.
- Positional placeholders (`$1, $2, ...`) are the required standard for passing scalar values. They cannot be used for SQL identifiers (table names, column names, sort directions), which must be validated against strict allowlists.
- The `RETURNING` clause projects modified tuples directly in `INSERT`, `UPDATE`, and `DELETE` responses, eliminating extra query roundtrips and preventing concurrent read-after-write anomalies.
- `node-postgres` deserializes `BIGINT` (`INT8`) columns as JavaScript `String` primitives by default to prevent silent numeric precision loss beyond `Number.MAX_SAFE_INTEGER`.
- Batch insertions scale significantly better when executed via the relational `UNNEST($1::type[], $2::type[])` pattern compared to massive dynamic `VALUES` string expansion or sequential single-row loops.
- Concurrent insert collisions must be handled inside the database engine using atomic `ON CONFLICT (target) DO UPDATE / DO NOTHING` clauses rather than error-prone check-then-act application patterns.
- Database constraint failures must be detected by checking `error.code` against standardized SQLSTATE codes (`23505`, `23503`, `23514`) and translated into meaningful HTTP exceptions.

---

## Cheat Sheet

| Feature | Syntax / Pattern | Operational Advantage |
|---|---|---|
| **Parameterized Value** | `WHERE id = $1 AND status = $2` | Prevents SQL injection; enables query plan caching |
| **Array Membership** | `WHERE id = ANY($1::uuid[])` | Single placeholder handles dynamic array filters without string concatenation |
| **Insert & Return** | `INSERT INTO tbl (...) VALUES (...) RETURNING *` | Atomically retrieves generated IDs and defaults in one roundtrip |
| **Update Verification** | Inspect `result.rowCount === 0` | Distinguishes between successful zero-match updates and true errors |
| **Batch Insertion** | `INSERT INTO tbl SELECT * FROM UNNEST($1::int[], $2::text[])` | Minimal query text size; constant parameter count regardless of batch size |
| **Atomic Upsert** | `ON CONFLICT (key) DO UPDATE SET col = EXCLUDED.col` | Prevents check-then-act race conditions during concurrent writes |
| **Identifier Safety** | Map user input against `Map` allowlist | Prevents SQL injection in dynamic `ORDER BY` and column selection |
| **Unique Violation** | `if (error.code === '23505')` | Reliable classification of duplicate key conflicts |
| **Foreign Key Error** | `if (error.code === '23503')` | Maps missing parent entity references to 400/404 HTTP responses |

---

## Interview Questions

### 1. How does the PostgreSQL Extended Query Protocol prevent SQL injection at the protocol layer, and why can parameter placeholders ($1) not be used for table or column names?

The Extended Query Protocol separates query preparation from parameter evaluation by splitting query execution into discrete network messages: `Parse`, `Bind`, `Describe`, and `Execute`. During the `Parse` phase, the database server parses the SQL template string into an Abstract Syntax Tree (AST) and generates a query execution plan. Positional placeholders (`$1, $2`) are recognized as parameter tokens representing literal scalar values. During the subsequent `Bind` phase, the client sends raw parameter byte values, which are bound directly into the pre-compiled execution plan's memory buffers. Because the AST structure has already been compiled, input values are never evaluated by the SQL grammar parser, making it impossible for untrusted strings to alter query syntax.

Parameter placeholders cannot be used for table or column names because the database requires table and column identifiers during the `Parse` phase to build the query plan. The query planner must inspect table schemas, verify column existence, calculate statistics, and choose index access paths before it can create an execution plan. Parameter placeholders are designed only for leaf-node scalar values evaluated during plan execution. To handle dynamic table or column names safely, applications must validate inputs against strict allowlists or sanitize them using identifier quoting utilities (`format('%I')`).

---

### 2. Why does `node-postgres` return `BIGINT` (`INT8`) columns as strings in JavaScript, and what are the architectural consequences of overriding this behavior?

JavaScript engines implement numbers according to the IEEE 754 standard for double-precision 64-bit floating-point numbers. In this format, integers can only be represented with absolute exact precision up to $2^{53} - 1$ (`Number.MAX_SAFE_INTEGER`, which is `9,007,199,254,740,991`). However, PostgreSQL's `BIGINT` (OID 20) is a signed 64-bit binary integer capable of storing values up to $2^{63} - 1$ (`9,223,372,036,854,775,807`). If `node-postgres` automatically deserialized `BIGINT` values into JavaScript `Number` primitives, any value exceeding `9,007,199,254,740,991` would undergo silent rounding and truncation. In distributed production systems utilizing Twitter Snowflake IDs, high-range sequences, or 64-bit cryptographic hashes, this causes data corruption, record mismatches, and broken foreign key references.

If developers override this behavior globally via `pg.types.setTypeParser(20, Number)`, they introduce a silent failure mode that only appears in production when database sequence values scale beyond the safe integer threshold. A safer modern alternative is configuring `pg.types.setTypeParser(20, BigInt)`, which deserializes columns into native JavaScript `BigInt` primitives (`12345n`). However, this introduces serialization consequences: native `BigInt` values cannot be directly serialized by `JSON.stringify()`, which throws `TypeError: Do not know how to serialize a BigInt`. Applications adopting `BigInt` must provide custom JSON serialization logic or convert values to strings at the API presentation boundary.

---

### 3. How does the `RETURNING` clause solve the read-after-write problem in concurrent systems compared to issuing a secondary `SELECT`?

Issuing a secondary `SELECT` statement immediately after an `INSERT` or `UPDATE` introduces a read-after-write race condition and doubles network overhead. In a high-concurrency environment, the state of the database can change between the execution of the write statement and the subsequent `SELECT`. For example, in a `SELECT * FROM users WHERE email = $1` issued after an update, a concurrent worker could update, lock, or delete the record in the intervening milliseconds, resulting in stale or inconsistent data being returned to the caller. Furthermore, under read-committed transaction isolation, a secondary query sees changes committed by other concurrent transactions, violating the caller's expectation of observing only its own mutation.

The `RETURNING` clause executes within the exact same atomic statement boundary and engine lock as the DML mutation itself. As PostgreSQL modifies the table heap pages and indexes, it immediately evaluates the `RETURNING` projection against the modified in-memory tuple before releasing row locks. This guarantees that the returned data reflects the exact state of the row at the precise instant of mutation, including database-generated defaults, triggers, and sequences. It also eliminates an entire network round-trip across the database connection pool, reducing socket latency and improving pool utilization.

---

### 4. What is the Check-Then-Act race condition during resource insertion, and how does PostgreSQL's `ON CONFLICT` clause resolve it?

The Check-Then-Act race condition (a form of Time-of-Check to Time-of-Use anomaly) occurs when an application checks for the existence of a record before deciding whether to insert or update it:
```javascript
// Check-Then-Act Anti-Pattern
const existing = await pool.query('SELECT id FROM accounts WHERE email = $1', [email]);
if (!existing.rows.length) {
  // Vulnerable window: Another concurrent request can insert here!
  await pool.query('INSERT INTO accounts (email) VALUES ($1)', [email]);
}
```
If two concurrent requests attempt this flow simultaneously for the same email address, both execute the `SELECT` query, both observe zero matching rows, and both proceed to execute the `INSERT`. The first insert succeeds, while the second crashes with a `23505` unique constraint violation, resulting in unhandled application errors and failed requests. Wrapping the block in a standard transaction does not solve this issue unless strict serialization levels or explicit locks are used.

PostgreSQL's `ON CONFLICT (unique_column) DO UPDATE / DO NOTHING` resolves this at the storage engine level. When the database attempts to insert the new tuple, it acquires an insertion lock on the underlying unique B-Tree index. If the index engine detects that a key already exists (or another in-flight transaction is currently inserting the same key), the inserting transaction waits on the locking transaction. If the prior insert commits, PostgreSQL immediately evaluates the `ON CONFLICT` branch, pivoting to an update or ignoring the insert without releasing the lock or surfacing an error to the client. This guarantees atomic, idempotent writes without application-level distributed locks.

---

<nav aria-label="Lecture navigation">

[Previous: PostgreSQL and `pg` Pool Lifecycle](day-27-postgresql-and-pg-pool-lifecycle.md) | [Roadmap](../node-roadmap.md) | [Next: Relational Correctness for APIs](day-29-relational-correctness-for-apis.md)

</nav>