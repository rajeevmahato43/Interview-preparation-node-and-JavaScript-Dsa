# Day 29: Relational Correctness for APIs

<nav aria-label="Lecture navigation">

[Previous: Parameterized SQL CRUD](day-28-parameterized-sql-crud.md) | [Roadmap](../node-roadmap.md) | [Next: SQL Composition and Performance Awareness](day-30-sql-composition-and-performance-awareness.md)

</nav>

## Learning Outcomes

By the end of this lecture, you should be able to:

- Articulate why application-layer validation (Zod/Joi) is structurally incapable of preventing race conditions and data corruption without relational database constraints.
- Architect robust relational schemas utilizing `PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `CHECK`, and `EXCLUSION` constraints to enforce business invariants at the database boundary.
- Select the appropriate referential action (`ON DELETE RESTRICT`, `NO ACTION`, `CASCADE`, `SET NULL`) to prevent orphan records or catastrophic recursive cascading deletions.
- Design partial unique indexes (`WHERE deleted_at IS NULL`) to resolve the canonical uniqueness conflict when implementing soft-deletes in relational systems.
- Execute zero-downtime PostgreSQL schema migrations for constraints and column additions using the `NOT VALID` and `VALIDATE CONSTRAINT` two-phase pattern to avoid catalog lock starvation.
- Translate relational constraint violations into semantic HTTP domain responses (`400 Bad Request`, `409 Conflict`, `422 Unprocessable Entity`).

---

## Prerequisites

- [Day 28: Parameterized SQL CRUD](day-28-parameterized-sql-crud.md) — Extended query protocol, SQLSTATE mapping, and atomic DML statements.
- [Day 16: Express Input Parsing, Validation, and Serialization](day-16-express-input-validation-and-serialization.md) — Request payload schemas, parameter boundaries, and DTO projections.
- [Day 17: Async Express and Centralized Errors](day-17-async-express-and-centralized-errors.md) — Operational exception mapping and centralized error dispatching.

---

## Quick Vocabulary Card

| Term | Engineering Definition | Production Impact |
|---|---|---|
| **Relational Invariant** | A condition or business rule guaranteed by the database catalog to remain permanently true across all concurrent transactions. | Eliminates silent data corruption caused by application race conditions, partial failures, or bypassing APIs. |
| **Referential Action** | The automated cascade policy (`RESTRICT`, `CASCADE`, `SET NULL`) executed by the database when a referenced primary key is updated or deleted. | Prevents dangling foreign key pointers while protecting critical financial records from accidental recursive cascading deletion. |
| **Check Constraint** | A database rule evaluating a boolean expression on column values before allowing any `INSERT` or `UPDATE` operation to succeed. | Guarantees scalar invariants (e.g., `price >= 0`, `end_date > start_date`) even if buggy application code attempts invalid writes. |
| **Partial Unique Index** | An index enforcing uniqueness exclusively across a filtered subset of rows using a predicate clause: `CREATE UNIQUE INDEX ... WHERE clause`. | Enables multi-version uniqueness, soft-deletes (`deleted_at IS NULL`), and single-active-state constraints on multi-state tables. |
| **`NOT VALID` Constraint** | A PostgreSQL DDL feature allowing constraints to be added without performing an immediate full-table validation scan. | Prevents long-running `ACCESS EXCLUSIVE` table locks during production migrations on large datasets, preventing API downtime. |
| **Table Lock Starvation** | A scenario where a DDL operation waiting for an `ACCESS EXCLUSIVE` lock queues behind long-running queries, blocking all incoming API requests. | Causes cascading pool exhaustion and total API outages if migrations are executed without strict `lock_timeout` controls. |

---

## Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            THE DUAL-PERIMETER VALIDATION ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Incoming HTTP Request (JSON Body)
                 │
                 ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │ 1. APPLICATION LAYER (Express / Zod / Joi)                                              │
  │    - Purpose: Fast user feedback, schema parsing, type coercion, structural integrity. │
  │    - Scope: Stateless, single-payload inspection (e.g., "Is email a valid string?").     │
  │    - Limitation: CANNOT guarantee uniqueness, foreign entity existence, or concurrency. │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
                 │ Passes structural validation
                 ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │ 2. DATABASE STORAGE LAYER (PostgreSQL Catalog Invariants)                               │
  │    - Purpose: Storage of durable truth, concurrency arbitration, relational integrity. │
  │    - Scope: Multi-tenant, multi-process, cross-row invariants across concurrent nodes.  │
  │    - Guarantees:                                                                        │
  │      • PRIMARY KEY / UNIQUE: Prevents concurrent race conditions via index locks.       │
  │      • FOREIGN KEY: Prevents orphaned records across concurrent deletions.             │
  │      • CHECK: Enforces mathematical and domain bounds (balance >= 0, status in enum).   │
  │      • EXCLUSION: Prevents overlapping ranges (scheduling booking conflicts).           │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. The Dual-Perimeter Validation Architecture

Application validation and database constraints serve fundamentally different engineering purposes. A production Node.js backend requires both perimeters operating in concert:

1. **Application Layer (The User Experience Perimeter):**
   - Validates syntax, types, string length, and format (e.g., email RFC compliance, password entropy).
   - Fails fast in memory within microseconds without consuming database connection pool sockets.
   - Provides granular, localized error messages for front-end form fields (`400 Bad Request`).
   - **Critical Vulnerability:** Application validation is inherently stateless and non-atomic across multiple Node.js processes. It cannot prevent race conditions. Checking `await db.findUser(email)` before inserting will fail when two parallel requests execute simultaneously.

2. **Database Constraints (The Concurrency & Durability Perimeter):**
   - Enforces relational invariants (`PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `CHECK`) directly within the storage engine's atomic transaction boundary and B-Tree locks.
   - Guarantees data integrity regardless of whether writes originate from the Express API, a background worker, a database migration script, or a developer running `psql`.
   - Protects the system against race conditions, network partition timeouts, and software bugs.

| Dimension | Application Validation (Zod/Joi) | Database Constraints (PostgreSQL) |
|---|---|---|
| **Execution Point** | Node.js V8 heap memory before DB write | PostgreSQL engine kernel during write transaction |
| **Concurrency Safety** | ❌ Vulnerable to race conditions (TOCTOU) | ✅ 100% atomic across distributed Node instances |
| **Latency Cost** | Microseconds (zero network I/O) | Milliseconds (evaluated during SQL DML) |
| **Error Feedback** | Highly descriptive, field-specific JSON | Raw SQLSTATE codes requiring domain translation |
| **Bypass Vectors** | Admin scripts, queues, background jobs | Impossible to bypass without explicit DDL modification |

```javascript
// Node.js code
// anti-pattern: Relying solely on application checks for concurrency invariants
export async function unsafeRegisterUser(pool, { email, role }) {
  // ❌ Check-Then-Act race condition:
  // Two concurrent requests with the same email will BOTH evaluate existingUser as null,
  // and both will attempt to insert! Without a database UNIQUE constraint,
  // duplicate accounts are permanently created in the database.
  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    throw new Error('Email already registered');
  }

  const result = await pool.query(
    'INSERT INTO users (email, role) VALUES ($1, $2) RETURNING id',
    [email, role]
  );
  return result.rows[0];
}

// pattern: Dual-perimeter validation combining Zod and PostgreSQL constraints
import { z } from 'zod';

const RegisterSchema = z.object({
  email: z.string().email().max(255),
  role: z.enum(['MEMBER', 'ADMIN', 'BILLING'])
});

export async function safeRegisterUser(pool, rawInput) {
  // Perimeter 1: Fast application-level structural validation
  const validated = RegisterSchema.parse(rawInput);

  // Perimeter 2: Database atomic constraint boundary
  try {
    const result = await pool.query(
      `INSERT INTO users (email, role, created_at)
       VALUES ($1, $2, NOW())
       RETURNING id, email, role, created_at`,
      [validated.email.toLowerCase(), validated.role]
    );
    return result.rows[0];
  } catch (error) {
    // Translate SQLSTATE 23505 (unique_violation)
    if (error.code === '23505' && error.constraint === 'users_email_key') {
      const conflictError = new Error('Email is already registered');
      conflictError.status = 409;
      throw conflictError;
    }
    throw error;
  }
}
```

---

### 2. Foreign Key Semantics and Referential Actions

A `FOREIGN KEY` constraint establishes a relational link between a child column and a parent table's primary or unique key. It guarantees that a child record cannot reference a non-existent parent entity.

When the referenced parent row is updated or deleted, PostgreSQL enforces the configured **referential action**:

```sql
-- Syntax:
FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE <ACTION> ON UPDATE <ACTION>
```

| Referential Action | Behavior on Parent Row Deletion | Production API Use Case | Risk / Pitfall |
|---|---|---|---|
| **`RESTRICT`** | Immediately aborts the transaction with SQLSTATE `23503` if any child rows reference the parent. | Financial ledgers, customer accounts with active orders, audit logs. | Requires clients to delete or migrate child records before deleting the parent. |
| **`NO ACTION`** *(Default)* | Similar to `RESTRICT`, but deferred check is permitted at end of transaction if constraint is `DEFERRABLE`. | Complex multi-statement transactions where children are updated later in the same transaction. | Can cause surprising failures at `COMMIT` time if not understood. |
| **`CASCADE`** | Automatically deletes all child rows referencing the deleted parent row. | Dependent child entities with no independent lifecycle (e.g., `order_items`, `post_tags`). | **Extreme danger:** Deleting an organization or account can silently delete millions of historical financial records. |
| **`SET NULL`** | Sets the child foreign key column to `NULL`. (Requires child column to be nullable). | Soft association (e.g., `assigned_support_agent_id` when an agent's employee record is deleted). | Can create orphaned records if downstream queries do not anticipate `NULL` foreign keys. |
| **`SET DEFAULT`** | Sets the child column to its defined column `DEFAULT` value. | Reassigning deleted resources to a fallback system owner (e.g., `owner_id = 'SYSTEM_USER'`). | The default value must exist in the parent table, or the action will fail. |

```sql
-- Production DDL Example: Order and Line Item Invariants
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'PAID', 'SHIPPED', 'CANCELLED')),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0)
);
```

In this schema:
- If a `customer` is deleted while orders exist, `ON DELETE RESTRICT` aborts the operation, preventing loss of financial history.
- If an `order` is cancelled/deleted, `ON DELETE CASCADE` automatically purges the dependent `order_items`.
- If a `product` is deleted, `ON DELETE RESTRICT` prevents deletion while line items reference it, preserving billing records.

---

### 3. Partial Unique Indexes and the Soft-Delete Dilemma

A partial unique index is a PostgreSQL B-Tree index that enforces uniqueness only on the subset of rows matching a boolean `WHERE` filter expression:

```sql
CREATE UNIQUE INDEX idx_users_active_email ON users (email) WHERE deleted_at IS NULL;
```

A common problem in relational API design occurs when implementing **Soft Deletion** (marking records with `deleted_at = NOW()` instead of issuing a hard `DELETE`). If a standard unique constraint `UNIQUE (email)` is placed on the table:
1. User Alice registers with `alice@domain.com`.
2. Alice deletes her account (`deleted_at = '2026-03-01'`).
3. Alice attempts to register again with `alice@domain.com`.
4. The database rejects the registration with error `23505` because the deleted row still occupies the unique index slot!

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          PARTIAL UNIQUE INDEX FOR SOFT-DELETES                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  Table: users
 ┌────┬──────────────────┬─────────────────────┬──────────────────────────────────────────┐
 │ id │ email            │ deleted_at          │ Indexed by Partial Unique Index?         │
 ├────┼──────────────────┼─────────────────────┼──────────────────────────────────────────┤
 │ 1  │ alice@corp.com   │ 2026-01-15 10:00:00 │ ❌ NO (Filtered out by WHERE clause)     │
 │ 2  │ alice@corp.com   │ 2026-02-20 14:30:00 │ ❌ NO (Filtered out by WHERE clause)     │
 │ 3  │ alice@corp.com   │ NULL                │ ✅ YES (Actively indexed as UNIQUE)      │
 │ 4  │ alice@corp.com   │ NULL                │ 💥 REJECTED by Postgres (Violates Unique)│
 └────┴──────────────────┴─────────────────────┴──────────────────────────────────────────┘
```

By applying a partial unique index, multiple historical deleted rows can coexist with the same email address, while guaranteeing that **at most one active (`deleted_at IS NULL`) account exists at any moment**.

---

### 4. CHECK Constraints vs Database ENUMs

Enforcing status lifecycles and domain values requires choosing between PostgreSQL `ENUM` types, `CHECK` constraints, or Lookup Tables:

| Pattern | Implementation | Pros | Cons / Migration Hazards |
|---|---|---|---|
| **PostgreSQL `ENUM`** | `CREATE TYPE status_enum AS ENUM ('DRAFT', 'ACTIVE');` | Compact storage (4 bytes); strongly typed in PostgreSQL catalog. | Adding values (`ALTER TYPE ... ADD VALUE`) cannot run inside a multi-statement transaction in older Postgres versions; deleting or renaming values requires complex migration scripts. |
| **`CHECK` Constraint** | `status TEXT CHECK (status IN ('DRAFT', 'ACTIVE'))` | Flexible; easily altered or validated asynchronously; strings map cleanly to JavaScript enums. | Consumes slightly more disk space per row than 4-byte enum integers; invalid strings must be checked against table constraints. |
| **Lookup Table (FK)** | `status_id INT REFERENCES order_statuses(id)` | Can store dynamic metadata (display labels, permissions, ordering); runtime inserts without DDL. | Requires joins for queries; consumes more buffer pool cache; increased query complexity. |

For standard Node.js APIs where status values evolve alongside code deployments, **`CHECK` constraints on `TEXT` columns provide the optimal balance between performance, safety, and migration simplicity**.

```sql
-- Validating state machine and dates via CHECK constraints
ALTER TABLE subscriptions
  ADD CONSTRAINT chk_subscription_status 
  CHECK (status IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED')),
  ADD CONSTRAINT chk_subscription_dates 
  CHECK (end_date >= start_date);
```

---

### 5. Zero-Downtime PostgreSQL Schema Migrations

A zero-downtime migration is a schema modification process structured so that no table locks halt incoming API read or write queries during deployment.

When modifying tables in high-throughput production databases, naive DDL statements acquire an **`ACCESS EXCLUSIVE`** lock on the table catalog. This lock blocks all reads (`SELECT`) and all writes (`INSERT`, `UPDATE`, `DELETE`) until the migration finishes:

```sql
-- ❌ DANGEROUS IN PRODUCTION (Blocks API for hours on large tables):
-- Scans every existing row while holding an ACCESS EXCLUSIVE lock!
ALTER TABLE payments ADD CONSTRAINT chk_amount CHECK (amount_cents > 0);
```

If another long-running report query is currently executing on `payments`, the `ALTER TABLE` statement queues behind it. Every incoming API request then queues behind the `ALTER TABLE` lock request, causing immediate **connection pool starvation** and bringing down the entire Node.js backend.

#### The Safe Two-Phase Pattern for Constraints

```sql
-- Phase 1: Add constraint as NOT VALID (Instant metadata update; acquires lock for <10ms)
ALTER TABLE payments 
  ADD CONSTRAINT chk_amount 
  CHECK (amount_cents > 0) 
  NOT VALID;

-- Phase 2: Validate existing rows concurrently (Holds only SHARE UPDATE EXCLUSIVE lock;
-- reads and writes continue uninterrupted!)
ALTER TABLE payments 
  VALIDATE CONSTRAINT chk_amount;
```

#### Safe Migration Guidelines in Node.js Applications

1. **Always Set Lock Timeouts:**
   ```sql
   SET lock_timeout = '2s';
   SET statement_timeout = '30s';
   ```
   If a migration cannot acquire its catalog lock within 2 seconds, it aborts immediately rather than queueing and causing an API outage.
2. **Adding Columns with Defaults:**
   In PostgreSQL 11 and later, `ALTER TABLE tbl ADD COLUMN col TEXT DEFAULT 'val' NOT NULL;` is an instantaneous catalog-only metadata change. It does not rewrite the table heap.
3. **Creating Indexes Concurrently:**
   Always use `CREATE INDEX CONCURRENTLY` to avoid blocking table writes during index construction.

---

## Detailed Explanations and Traces

### Concurrency Race Trace: Why App Checks Fail

Consider two concurrent requests to an Express API attempting to claim the same unique username (`@alex`):

```
Time    Request 1 (Process A)                        Request 2 (Process B)
────────────────────────────────────────────────────────────────────────────────────────────
T1      SELECT id FROM users WHERE handle = 'alex'
        (Returns: 0 rows)
T2                                                   SELECT id FROM users WHERE handle = 'alex'
                                                     (Returns: 0 rows)
T3      Validate: handle is available ✅
T4                                                   Validate: handle is available ✅
T5      INSERT INTO users (handle) VALUES ('alex')
        (Acquires tuple insertion lock)
T6      Commit: Row inserted successfully!
T7                                                   INSERT INTO users (handle) VALUES ('alex')
                                                     (Attempts to acquire insertion lock)
────────────────────────────────────────────────────────────────────────────────────────────
Outcome WITHOUT Unique Constraint:
Both Process A and Process B commit successfully! Two users now possess the exact same handle.
Account takeovers, billing errors, and query crashes occur across the platform.

Outcome WITH PostgreSQL Unique Index:
At T7, PostgreSQL checks the handle B-Tree index. The index entry already exists.
PostgreSQL halts Request 2, rolls back the statement, and returns SQLSTATE 23505.
Process B captures error code 23505 and safely responds with HTTP 409 Conflict.
```

---

## Common Mistakes and Interview Traps

### 1. The Missing Foreign Key Index Trap

When you define a `FOREIGN KEY` in PostgreSQL:
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE
);
```
PostgreSQL **does NOT automatically create an index on the child column (`post_id`)**! (Primary keys and unique constraints automatically create indexes, but foreign keys do not).

**Production Impact:**
1. Queries filtering comments by post (`SELECT * FROM comments WHERE post_id = $1`) will execute a full-table `Seq Scan`, crushing database CPU as comments grow.
2. When a row in the parent table `posts` is deleted, PostgreSQL must check or cascade against the `comments` table. Without an index on `post_id`, PostgreSQL must perform a **sequential scan of the entire `comments` table** to find dependent rows, locking the table and freezing the database!
3. **Rule:** *Always create an explicit B-Tree index on foreign key columns.*

### 2. Over-Cascading (`ON DELETE CASCADE` Abuse)

Placing `ON DELETE CASCADE` indiscriminately across relational models creates catastrophic failure modes. If an engineer deletes a "Test Workspace" from an admin panel, a cascading constraint can silently delete all users, orders, billing invoices, and audit logs associated with that workspace. In financial and compliance systems, use `ON DELETE RESTRICT` or soft-deletes to ensure deletions are explicit and auditable.

---

## Tricky Points and Edge Cases

### 1. `NULL` Semantics in Unique Constraints

In standard SQL and PostgreSQL, `NULL` represents an unknown value. Consequently, **two `NULL` values are not considered equal**:
```sql
CREATE TABLE profiles (
  id INT PRIMARY KEY,
  ssn TEXT UNIQUE
);

INSERT INTO profiles (id, ssn) VALUES (1, NULL);
INSERT INTO profiles (id, ssn) VALUES (2, NULL); -- ✅ SUCCEEDS!
```
A standard `UNIQUE` constraint permits an unlimited number of rows with `NULL` values. If your business requirement dictates that a column may be optional but at most one row can have a `NULL` value, or if uniqueness must treat `NULL` as identical, you must:
1. Use PostgreSQL 15+'s `UNIQUE NULLS NOT DISTINCT` syntax:
   ```sql
   ALTER TABLE profiles ADD CONSTRAINT uq_ssn UNIQUE NULLS NOT DISTINCT (ssn);
   ```
2. Or use a partial unique index.

### 2. Multi-Column Foreign Keys

When validating composite relationships (e.g., ensuring a membership references both a valid `workspace_id` and `user_id`), ensure the foreign key references a matching composite unique or primary key:
```sql
ALTER TABLE workspace_memberships
  ADD CONSTRAINT fk_workspace_user
  FOREIGN KEY (workspace_id, user_id)
  REFERENCES users_workspaces(workspace_id, user_id)
  ON DELETE CASCADE;
```

---

## Hands-On Exercise: Resilient Multi-Tenant Billing Schema and Migration

### Scenario

You are tasked with redesigning the billing schema for a multi-tenant SaaS application. The legacy schema has several severe bugs:
1. Users can create duplicate active subscriptions because the unique constraint does not account for cancelled subscriptions (`status = 'CANCELLED'`).
2. Discounts can have negative percentages or exceed 100%, causing customers to be credited money on checkout.
3. Invoices reference tenant workspaces, but the foreign key column lacks an index, causing massive sequential scans during invoice queries.
4. When a subscription status is updated, application code directly catches generic database errors and responds with `500 Internal Server Error` instead of semantic domain responses.

### Buggy Schema and Code

```sql
-- Buggy Legacy Schema
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  plan_code TEXT,
  discount_percent NUMERIC, -- BUG: No check constraint! Allows -50% or 150%
  status TEXT,              -- BUG: No check constraint! Allows arbitrary strings
  created_at TIMESTAMPTZ
  -- BUG: Missing partial unique index (tenant can only have ONE ACTIVE subscription)
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE, -- BUG: Unindexed FK!
  amount_cents INT,
  created_at TIMESTAMPTZ
);
```

```javascript
// Node.js code
// Buggy API Handler
export async function createSubscription(pool, req, res) {
  try {
    const { tenantId, planCode, discountPercent } = req.body;
    // Missing validation; directly writes to DB
    const result = await pool.query(
      `INSERT INTO subscriptions (id, tenant_id, plan_code, discount_percent, status, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, 'ACTIVE', NOW()) RETURNING *`,
      [tenantId, planCode, discountPercent]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    // ❌ Masks all relational violations as 500 crashes
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
```

### Acceptance Criteria

1. Provide an idempotent, zero-downtime PostgreSQL migration script:
   - Enforce `discount_percent` between `0.00` and `100.00` using a safe `CHECK` constraint.
   - Enforce subscription status to be one of: `'TRIALING'`, `'ACTIVE'`, `'PAST_DUE'`, `'CANCELLED'`.
   - Add a partial unique index ensuring each tenant has at most **one active subscription** (`status IN ('TRIALING', 'ACTIVE', 'PAST_DUE')`).
   - Add an explicit index on `invoices.subscription_id`.
   - Configure safe `lock_timeout` controls.
2. Refactor the Node.js API function with Zod validation, parameterization, and centralized mapping of SQLSTATE codes (`23505`, `23514`, `23503`) to proper HTTP statuses (`409`, `422`, `400`).

### Solution Migration Script

```sql
-- safe_billing_migration.sql
BEGIN;

-- Prevent migration from queueing indefinitely and locking the API
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '15s';

-- 1. Safely add check constraint for status using two-phase validation
ALTER TABLE subscriptions 
  ADD CONSTRAINT chk_subscription_status 
  CHECK (status IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED')) 
  NOT VALID;

-- 2. Safely add check constraint for discount percent
ALTER TABLE subscriptions 
  ADD CONSTRAINT chk_discount_percent 
  CHECK (discount_percent >= 0.00 AND discount_percent <= 100.00) 
  NOT VALID;

COMMIT;

-- Validate constraints outside the transaction lock to prevent table locking
ALTER TABLE subscriptions VALIDATE CONSTRAINT chk_subscription_status;
ALTER TABLE subscriptions VALIDATE CONSTRAINT chk_discount_percent;

-- 3. Create partial unique index concurrently (Guarantees only 1 active subscription per tenant)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_one_active_per_tenant 
  ON subscriptions (tenant_id) 
  WHERE status IN ('TRIALING', 'ACTIVE', 'PAST_DUE');

-- 4. Create foreign key index concurrently to prevent sequential scans
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_subscription_id 
  ON invoices (subscription_id);
```

### Solution Code

```javascript
// Node.js code
import { z } from 'zod';

const CreateSubscriptionSchema = z.object({
  tenantId: z.string().uuid(),
  planCode: z.string().min(2).max(50),
  discountPercent: z.number().min(0).max(100).default(0)
});

export class DomainError extends Error {
  constructor(message, status, details = {}) {
    super(message);
    this.name = 'DomainError';
    this.status = status;
    this.details = details;
  }
}

export async function createSubscriptionService(pool, rawInput) {
  // 1. Application-level validation perimeter
  const input = CreateSubscriptionSchema.parse(rawInput);

  const query = `
    INSERT INTO subscriptions (
      id, tenant_id, plan_code, discount_percent, status, created_at
    )
    VALUES (
      gen_random_uuid(), $1, $2, $3, 'ACTIVE', NOW()
    )
    RETURNING id, tenant_id, plan_code, discount_percent, status, created_at;
  `;

  try {
    const { rows } = await pool.query(query, [
      input.tenantId,
      input.planCode,
      input.discountPercent
    ]);
    return rows[0];
  } catch (error) {
    // 2. Database relational constraint perimeter mapping

    // SQLSTATE 23505: Unique violation (One active subscription per tenant)
    if (error.code === '23505') {
      if (error.constraint === 'idx_subscriptions_one_active_per_tenant') {
        throw new DomainError(
          'Tenant already has an active or trialing subscription',
          409,
          { tenantId: input.tenantId }
        );
      }
      throw new DomainError('Duplicate entity conflict', 409);
    }

    // SQLSTATE 23514: Check violation (Invalid bounds or illegal status)
    if (error.code === '23514') {
      if (error.constraint === 'chk_discount_percent') {
        throw new DomainError('Discount percent must be between 0 and 100', 422);
      }
      if (error.constraint === 'chk_subscription_status') {
        throw new DomainError('Invalid subscription status transition', 422);
      }
      throw new DomainError('Business constraint violation', 422);
    }

    // SQLSTATE 23503: Foreign key violation
    if (error.code === '23503') {
      throw new DomainError('Referenced tenant does not exist', 400, {
        tenantId: input.tenantId
      });
    }

    // Unknown or infrastructure error: bubble up
    throw error;
  }
}
```

### Solution Explanation

1. **Two-Phase Constraint Addition:** The migration uses `NOT VALID` within a transaction guarded by `SET LOCAL lock_timeout = '2s'`. This ensures that even on a table with millions of rows, the migration acquires an exclusive lock only for a few milliseconds to update the catalog. The subsequent `VALIDATE CONSTRAINT` runs without blocking read or write queries.
2. **Concurrent Indexing:** Using `CREATE INDEX CONCURRENTLY` for both the partial unique index and the foreign key index guarantees zero downtime. It builds the B-Tree indexes in the background without holding write locks.
3. **Partial Unique Index:** The index `WHERE status IN ('TRIALING', 'ACTIVE', 'PAST_DUE')` cleanly accommodates historical churn. A customer can have 10 past `'CANCELLED'` subscriptions, but attempting to create a second active subscription triggers a unique violation.
4. **Structured Error Translation:** The Node.js service cleanly maps the specific constraint names and SQLSTATE error codes (`23505` $\to$ `409 Conflict`, `23514` $\to$ `422 Unprocessable Entity`, `23503` $\to$ `400 Bad Request`), preventing internal implementation details from leaking while giving API clients precise actionable error details.

---

## Summary

- Application validation (e.g., Zod) provides rapid user feedback and structural sanity, but it cannot prevent race conditions. Relational database constraints provide the durable concurrency boundary.
- Foreign keys enforce relational graphs. Always create an explicit B-Tree index on foreign key columns in child tables to avoid full sequential table scans during joins and parent deletions.
- Carefully choose referential actions: use `ON DELETE RESTRICT` for financial and critical business data to prevent accidental deletions, and use `ON DELETE CASCADE` only for tightly coupled child records.
- Partial unique indexes (`WHERE deleted_at IS NULL`) solve the soft-delete problem by enforcing uniqueness strictly among active rows while allowing duplicate historic records.
- Check constraints enforce scalar domain rules (`amount > 0`, state enums). They are simpler to maintain and migrate than native PostgreSQL `ENUM` types.
- Production schema migrations must use the two-phase `NOT VALID` followed by `VALIDATE CONSTRAINT` pattern alongside `SET lock_timeout` to eliminate table lock starvation and API outages.

---

## Cheat Sheet

| Relational Invariant | PostgreSQL Syntax | API Behavior / Mapping |
|---|---|---|
| **Primary Key** | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` | Uniquely identifies resource; guarantees index-backed seeks |
| **Foreign Key (Safe)** | `REFERENCES parents(id) ON DELETE RESTRICT` | Prevents parent deletion if children exist; maps to `400/409` |
| **Foreign Key (Cascade)**| `REFERENCES parents(id) ON DELETE CASCADE` | Deletes dependent rows automatically; use only for tight composition |
| **Check Constraint** | `CHECK (price >= 0 AND price <= 1000000)` | Prevents invalid scalar states; maps SQLSTATE `23514` $\to$ `422` |
| **Partial Unique Index**| `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL;`| Enables soft-deletion without duplicate active records |
| **Safe DDL Constraint** | `ADD CONSTRAINT ... CHECK (...) NOT VALID;` | Adds rule instantly without blocking reads/writes |
| **Validate Constraint** | `ALTER TABLE tbl VALIDATE CONSTRAINT name;` | Scans table in background with low locking priority |
| **Lock Timeout Guard** | `SET LOCAL lock_timeout = '2s';` | Prevents migration from blocking API connection pools |

---

## Interview Questions

### 1. Why is application-level validation (e.g., using Zod or checking with a preliminary SELECT) incapable of guaranteeing uniqueness in a multi-instance Node.js architecture?

Application-level validation operates inside the local memory of an individual Node.js process and suffers from the Time-of-Check to Time-of-Use (TOCTOU) race condition. When an application queries `SELECT id FROM users WHERE email = $1` to verify availability before inserting, there is an unavoidable temporal window between the execution of the `SELECT` query and the subsequent `INSERT` statement. In a multi-instance or high-concurrency Node.js environment, multiple requests can execute the `SELECT` query concurrently. Both queries observe zero matching rows, both conclude that the email is available, and both issue an `INSERT`. 

Without a database-level `UNIQUE` constraint, both inserts commit, corrupting the database with duplicate accounts. Memory-based validation in Node cannot coordinate locks across separate operating system processes, container replicas, or serverless functions. A database `UNIQUE` constraint or index enforces mutual exclusion at the storage engine level by acquiring an exclusive lock on the relevant B-Tree index page during the write transaction. If a concurrent transaction attempts to insert the same value, it either blocks or is immediately rejected with SQLSTATE `23505`.

---

### 2. What are the operational consequences of failing to index a foreign key column in PostgreSQL, particularly regarding parent record deletions?

When a `FOREIGN KEY` constraint is defined on a table in PostgreSQL, the engine automatically creates a unique index on the referenced parent primary key, but it does **not** create an index on the referencing child column. Failing to manually index the child foreign key column creates two severe production bottlenecks:

First, join operations that filter or traverse from parent to child (e.g., `SELECT * FROM orders WHERE customer_id = $1`) cannot use an index scan and must perform an expensive sequential scan (`Seq Scan`) across the entire child table, causing CPU spikes and slow response times.

Second, and more dangerously, whenever a parent row is deleted or has its primary key modified, PostgreSQL must verify referential integrity by checking whether any child rows reference that parent. Without an index on the child table's foreign key column, PostgreSQL is forced to acquire a shared lock and perform a **full sequential scan of the entire child table** for every single parent row deletion. If the child table contains millions of rows, deleting a single parent row can lock the child table for seconds or minutes, stalling all concurrent writes and rapidly exhausting the Node.js connection pool.

---

### 3. How does the partial unique index pattern solve the conflict between soft deletes and unique constraints in relational databases?

In systems implementing soft deletion, records are marked as deleted using a timestamp column (`deleted_at = NOW()`) rather than physically removing the row via `DELETE`. If a traditional `UNIQUE` constraint is placed on a business identifier like `email`, a user who registers, deletes their account, and later attempts to register again with the same email will be rejected. The database treats the soft-deleted row as an active constraint violation because standard unique indexes track every row in the table heap regardless of its deleted status.

A partial unique index resolves this by applying a predicate filter:
```sql
CREATE UNIQUE INDEX idx_users_active_email ON users (email) WHERE deleted_at IS NULL;
```
PostgreSQL's B-Tree engine only includes rows in the index structure that satisfy the `WHERE deleted_at IS NULL` condition. When a row has a non-null `deleted_at` timestamp, it is excluded from the index. This allows an unlimited number of historic soft-deleted rows with the same email to exist in the table, while guaranteeing that at most one active record with that email can exist at any given time.

---

### 4. What is table lock starvation during database migrations, and how does the two-phase `NOT VALID` / `VALIDATE CONSTRAINT` pattern prevent API outages?

When an `ALTER TABLE ... ADD CONSTRAINT` statement is executed naively, PostgreSQL attempts to acquire an `ACCESS EXCLUSIVE` lock on the table. This lock conflicts with all other lock types, meaning no other transaction can read or write to the table while it is held. If long-running queries are executing on the table when the DDL starts, the `ALTER TABLE` statement must wait. Crucially, PostgreSQL queues all subsequent queries behind the waiting DDL. As a result, incoming API queries (`SELECT`, `INSERT`) get stuck behind the `ALTER TABLE` lock request in the queue. Within seconds, all connections in the Node.js pool become blocked waiting for locks, leading to complete API lock starvation and service failure. Furthermore, verifying existing table data against the new constraint requires a full sequential scan while holding this exclusive lock.

The two-phase pattern prevents this disaster:
1. **Phase 1 (`ADD CONSTRAINT ... NOT VALID`):** PostgreSQL adds the constraint definition to the system catalog without checking existing rows. This operation requires an `ACCESS EXCLUSIVE` lock only for a few milliseconds.
2. **Phase 2 (`VALIDATE CONSTRAINT`):** PostgreSQL scans the existing rows to verify compliance using a weaker `SHARE UPDATE EXCLUSIVE` lock. This lock permits concurrent `SELECT`, `INSERT`, `UPDATE`, and `DELETE` queries to proceed completely unimpeded. Combining this with `SET lock_timeout = '2s'` ensures that if the initial lock cannot be acquired immediately, the migration aborts rather than queueing and causing an outage.

---

<nav aria-label="Lecture navigation">

[Previous: Parameterized SQL CRUD](day-28-parameterized-sql-crud.md) | [Roadmap](../node-roadmap.md) | [Next: SQL Composition and Performance Awareness](day-30-sql-composition-and-performance-awareness.md)

</nav>